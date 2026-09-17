//! Fog of Fallacy server.
//!
//! * Serves the game (the repo root, or `FOG_WEB_DIR`).
//! * Stores saves as JSON files: `GET/PUT /api/saves/{slug}`.
//! * `GET /api/voice?who=&profile=&text=` returns a spoken clip. With
//!   `ELEVENLABS_API_KEY` set it fetches the line from ElevenLabs once and caches
//!   the MP3 on disk; without a key it answers 204 and the browser speaks the line
//!   itself.
//!
//! Environment:
//!   PORT               listen port (default 8787)
//!   FOG_BIND           bind address (default 0.0.0.0 so a phone on the LAN can play)
//!   FOG_WEB_DIR        directory with index.html (default: current directory)
//!   FOG_DATA_DIR       where saves and voice clips live (default: %LOCALAPPDATA%/FogOfFallacy)
//!   FOG_VOICES         optional path to a voices.json (default: <web>/voice/voices.json, then built-in)
//!   ELEVENLABS_API_KEY optional; enables recorded voices

use std::{collections::HashMap, net::SocketAddr, path::PathBuf, sync::Arc};

use axum::{
    body::Bytes,
    extract::{DefaultBodyLimit, Path, Query, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use tower_http::services::{ServeDir, ServeFile};

struct App {
    data: PathBuf,
    key: Option<String>,
    voices: HashMap<String, String>,
    http: reqwest::Client,
}
type Shared = Arc<App>;

const BUILTIN_VOICES: &str = include_str!("../voices.json");

#[tokio::main]
async fn main() {
    let web = env_path("FOG_WEB_DIR").unwrap_or_else(|| PathBuf::from("."));
    let data = env_path("FOG_DATA_DIR").unwrap_or_else(default_data_dir);
    let key = std::env::var("ELEVENLABS_API_KEY").ok().filter(|k| !k.trim().is_empty());
    let voices = load_voices(&web);
    for sub in ["saves", "voice"] {
        if let Err(e) = std::fs::create_dir_all(data.join(sub)) {
            eprintln!("cannot create {}: {e}", data.join(sub).display());
        }
    }

    let index = web.join("index.html");
    if !index.exists() {
        eprintln!("warning: {} not found. Run from the repo root or set FOG_WEB_DIR.", index.display());
    }

    let app: Shared = Arc::new(App {
        data,
        key,
        voices,
        http: reqwest::Client::builder().user_agent("fog-of-fallacy/0.2").build().expect("http client"),
    });

    let router = Router::new()
        .route("/api/health", get(health))
        .route("/api/saves/:slug", get(get_save).put(put_save))
        .route("/api/voice", get(voice))
        .fallback_service(ServeDir::new(&web).not_found_service(ServeFile::new(index)))
        .layer(middleware::from_fn(cache_headers))
        .layer(DefaultBodyLimit::max(2 * 1024 * 1024))
        .with_state(app.clone());

    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8787);
    let bind = std::env::var("FOG_BIND").unwrap_or_else(|_| "0.0.0.0".into());
    let addr: SocketAddr = format!("{bind}:{port}").parse().expect("bind address");
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
    println!("Fog of Fallacy  →  http://localhost:{port}/");
    println!("  web dir : {}", web.display());
    println!("  data dir: {}", app.data.display());
    println!("  voices  : {}", if app.key.is_some() { "ElevenLabs (cached on disk)" } else { "browser speech synthesis (set ELEVENLABS_API_KEY for recorded voices)" });
    axum::serve(listener, router).await.expect("server");
}

/// Caching rules for the static game.
///
/// The page and the clip index must REVALIDATE on every load. Otherwise a browser that
/// cached them keeps serving the old `index.html` after a deploy: the player never sees
/// the new `?v=` asset links, keeps running yesterday's JavaScript against a stale
/// `voice/index.json`, and every spoken line silently falls back to the robot voice.
/// `no-cache` still allows a cheap 304; it only forbids using the copy without asking.
///
/// Everything else is safe to keep: `css/` and `js/` are requested with a `?v=` that
/// changes when they do, and a voice clip is named after a hash of its own text, so its
/// URL changes whenever its content does.
async fn cache_headers(req: Request, next: Next) -> Response {
    let path = req.uri().path().to_owned();
    let mut res = next.run(req).await;

    if path.starts_with("/api/") {
        return res;
    }
    let value = if path == "/" || path.ends_with(".html") || path == "/voice/index.json" {
        "no-cache"
    } else if path.starts_with("/voice/")
        || path.starts_with("/img/")
        || path.starts_with("/css/")
        || path.starts_with("/js/")
    {
        "public, max-age=31536000, immutable"
    } else {
        "public, max-age=3600"
    };
    res.headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static(value));
    res
}

fn env_path(name: &str) -> Option<PathBuf> {
    std::env::var(name).ok().filter(|v| !v.trim().is_empty()).map(PathBuf::from)
}

fn default_data_dir() -> PathBuf {
    if let Some(p) = env_path("LOCALAPPDATA") {
        return p.join("FogOfFallacy");
    }
    if let Some(p) = env_path("HOME") {
        return p.join(".fog-of-fallacy");
    }
    PathBuf::from("data")
}

/// Voice map: FOG_VOICES if set, else the game's own voice/voices.json, else the built-in copy.
fn load_voices(web: &std::path::Path) -> HashMap<String, String> {
    let path = env_path("FOG_VOICES").or_else(|| {
        let p = web.join("voice").join("voices.json");
        if p.exists() { Some(p) } else { None }
    });
    let text = match path {
        Some(p) => std::fs::read_to_string(&p).unwrap_or_else(|e| {
            eprintln!("cannot read {}: {e}; using built-in voices", p.display());
            BUILTIN_VOICES.to_string()
        }),
        None => BUILTIN_VOICES.to_string(),
    };
    serde_json::from_str(&text).unwrap_or_else(|e| {
        eprintln!("voices.json is not valid: {e}");
        HashMap::new()
    })
}

/* ------------------------------------------------------------------ health */

async fn health(State(app): State<Shared>) -> Json<serde_json::Value> {
    Json(serde_json::json!({ "ok": true, "voice": app.key.is_some() }))
}

/* ------------------------------------------------------------------- saves */

fn valid_slug(s: &str) -> bool {
    !s.is_empty() && s.len() <= 40 && s.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

async fn get_save(State(app): State<Shared>, Path(slug): Path<String>) -> Response {
    if !valid_slug(&slug) {
        return StatusCode::BAD_REQUEST.into_response();
    }
    match tokio::fs::read(app.data.join("saves").join(format!("{slug}.json"))).await {
        Ok(bytes) => ([(header::CONTENT_TYPE, "application/json"), (header::CACHE_CONTROL, "no-store")], bytes).into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn put_save(State(app): State<Shared>, Path(slug): Path<String>, body: Bytes) -> StatusCode {
    if !valid_slug(&slug) {
        return StatusCode::BAD_REQUEST;
    }
    if serde_json::from_slice::<serde_json::Value>(&body).is_err() {
        return StatusCode::BAD_REQUEST;
    }
    let dir = app.data.join("saves");
    let final_path = dir.join(format!("{slug}.json"));
    let tmp = dir.join(format!("{slug}.json.tmp"));
    if tokio::fs::write(&tmp, &body).await.is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR;
    }
    match tokio::fs::rename(&tmp, &final_path).await {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => {
            // Windows refuses to rename over an open file now and then; fall back to a plain write.
            if tokio::fs::write(&final_path, &body).await.is_ok() {
                let _ = tokio::fs::remove_file(&tmp).await;
                StatusCode::NO_CONTENT
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        }
    }
}

/* ------------------------------------------------------------------- voice */

#[derive(Deserialize)]
struct VoiceQuery {
    who: Option<String>,
    profile: Option<String>,
    text: String,
}

fn fnv1a(s: &str) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in s.as_bytes() {
        h ^= *b as u64;
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    h
}

fn audio(bytes: Bytes) -> Response {
    ([(header::CONTENT_TYPE, "audio/mpeg"), (header::CACHE_CONTROL, "public, max-age=31536000, immutable")], bytes).into_response()
}

async fn voice(State(app): State<Shared>, Query(q): Query<VoiceQuery>) -> Response {
    let Some(key) = app.key.as_deref() else {
        return StatusCode::NO_CONTENT.into_response();
    };
    let text = q.text.trim();
    if text.is_empty() || text.chars().count() > 500 {
        return StatusCode::BAD_REQUEST.into_response();
    }
    let pick = |k: Option<&String>| k.and_then(|k| app.voices.get(k)).cloned();
    let Some(voice_id) = pick(q.who.as_ref()).or_else(|| pick(q.profile.as_ref())).or_else(|| app.voices.get("default").cloned()) else {
        return StatusCode::NO_CONTENT.into_response();
    };

    let hash = fnv1a(&format!("{voice_id}|{text}"));
    let path = app.data.join("voice").join(format!("{hash:016x}.mp3"));
    if let Ok(bytes) = tokio::fs::read(&path).await {
        return audio(Bytes::from(bytes));
    }

    let url = format!("https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_64");
    let body = serde_json::json!({
        "text": text,
        "model_id": "eleven_v3",
        "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
    });
    let resp = app.http.post(&url).header("xi-api-key", key).header(header::ACCEPT, "audio/mpeg").json(&body).send().await;
    match resp {
        Ok(r) if r.status().is_success() => match r.bytes().await {
            Ok(bytes) => {
                if let Err(e) = tokio::fs::write(&path, &bytes).await {
                    eprintln!("voice cache write failed: {e}");
                }
                audio(bytes)
            }
            Err(e) => {
                eprintln!("voice download failed: {e}");
                StatusCode::BAD_GATEWAY.into_response()
            }
        },
        Ok(r) => {
            eprintln!("voice provider answered {}", r.status());
            StatusCode::BAD_GATEWAY.into_response()
        }
        Err(e) => {
            eprintln!("voice provider unreachable: {e}");
            StatusCode::BAD_GATEWAY.into_response()
        }
    }
}
