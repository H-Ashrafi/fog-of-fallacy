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
//!   FOG_PASSPHRASE     the family's secret word. Every request except /api/health and
//!                      /api/login needs the cookie that POST /api/login sets after the
//!                      right word. Unset: the server is CLOSED (every page is the gate),
//!                      unless FOG_OPEN=1, which is for local play only.
//!   FOG_OPEN           "1" opens the server to everyone (no passphrase). Never in production.
//!   OPENAI_API_KEY     with ELEVENLABS_API_KEY, turns the scripted encounters into live
//!                      conversations (POST /api/talk, see talk.rs)
//!   FOG_OPENAI_MODEL   the model that plays the characters; probed at startup, then gpt-4o-mini,
//!                      gpt-5-mini, gpt-4.1-mini, gpt-5-nano are tried in turn. /api/health shows
//!                      talk_model and talk_error
//!   FOG_TALK_DAILY_LIMIT  model calls allowed per UTC day (default 150), then the game
//!                      falls back to the scripted answers until tomorrow
//!   FOG_TALK_MAX_TURNS answers the child gets per conversation (default 4)
//!   FOG_ELEVEN_MODEL   the ElevenLabs model for live lines in Latin script (default eleven_flash_v2_5,
//!                      fast; Persian and Arabic lines always use eleven_v3)
//!   OPENAI_BASE_URL, ELEVENLABS_BASE_URL  override the API hosts (tests)

use std::{
    collections::HashMap,
    net::SocketAddr,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use axum::{
    body::Bytes,
    extract::{DefaultBodyLimit, Path, Query, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha2::Sha256;
use subtle::ConstantTimeEq;
use tower_http::services::{ServeDir, ServeFile};

mod talk;

pub struct App {
    data: PathBuf,
    /// ELEVENLABS_API_KEY: recorded voices, and the listening half of conversations.
    key: Option<String>,
    voices: HashMap<String, String>,
    http: reqwest::Client,
    gate: Gate,
    talk: talk::Talk,
}
pub type Shared = Arc<App>;

/// Who may come in. See the `gate` section at the bottom.
struct Gate {
    passphrase: Option<String>,
    open: bool,
    /// Times of the recent wrong answers, for the throttle in `login`.
    failures: Mutex<Vec<Instant>>,
}

const BUILTIN_VOICES: &str = include_str!("../voices.json");
const GATE_PAGE: &str = include_str!("../gate.html");

#[tokio::main]
async fn main() {
    let web = env_path("FOG_WEB_DIR").unwrap_or_else(|| PathBuf::from("."));
    let data = env_path("FOG_DATA_DIR").unwrap_or_else(default_data_dir);
    let key = std::env::var("ELEVENLABS_API_KEY").ok().filter(|k| !k.trim().is_empty());
    let gate_config = Gate {
        passphrase: std::env::var("FOG_PASSPHRASE").ok().map(|p| p.trim().to_string()).filter(|p| !p.is_empty()),
        open: std::env::var("FOG_OPEN").map(|v| v.trim() == "1").unwrap_or(false),
        failures: Mutex::new(Vec::new()),
    };
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

    let talk = talk::Talk::from_env(&data);
    let app: Shared = Arc::new(App {
        data,
        key,
        voices,
        http: reqwest::Client::builder().user_agent("fog-of-fallacy/0.2").build().expect("http client"),
        gate: gate_config,
        talk,
    });

    let router = Router::new()
        .route("/api/health", get(health))
        .route("/api/saves/:slug", get(get_save).put(put_save))
        .route("/api/voice", get(voice))
        .route("/api/login", post(login))
        .route("/api/logout", post(logout))
        .route("/api/talk", post(talk::start))
        .route("/api/talk/:id", post(talk::reply))
        .fallback_service(ServeDir::new(&web).not_found_service(ServeFile::new(index)))
        // The gate runs inside cache_headers, so its answers get the no-store below.
        .layer(middleware::from_fn_with_state(app.clone(), gate))
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
    if app.talk.openai_key.is_some() && app.key.is_some() {
        app.talk.pick_model(&app.http, None).await;   // prints the talk line itself
    } else {
        println!("  talk    : scripted answers only (set OPENAI_API_KEY and ELEVENLABS_API_KEY for live conversations)");
    }
    println!("  gate    : {}", match (&app.gate.passphrase, app.gate.open) {
        (_, true) => "OPEN to everyone (FOG_OPEN=1; local play only)",
        (Some(_), false) => "locked; the secret word in FOG_PASSPHRASE lets players in",
        (None, false) => "CLOSED: no FOG_PASSPHRASE set, every page is the gate (set it, or FOG_OPEN=1 for local play)",
    });
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
    // A gate page or a refusal must never be kept as if it were the asset that was asked for.
    if res.status() == StatusCode::UNAUTHORIZED {
        res.headers_mut().insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
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
    let mut v = serde_json::json!({ "ok": true, "voice": app.key.is_some(), "locked": app.gate.passphrase.is_some() && !app.gate.open });
    if let (Some(obj), Some(talk)) = (v.as_object_mut(), app.talk.status(app.key.is_some()).as_object()) {
        obj.extend(talk.clone());
    }
    Json(v)
}

/* -------------------------------------------------------------------- gate */

// The whole site is for one family. One secret word (FOG_PASSPHRASE) lets a device in;
// the device then carries a cookie for a year. The cookie is `nonce.signature` where the
// signature is an HMAC of the nonce under the passphrase, so the server keeps no session
// list, a cookie cannot be forged without the word, and changing the word signs every
// device out at once. Wrong answers are slowed down and capped, which is all the brute
// force protection a word this site needs.

const COOKIE: &str = "fog_session";
const COOKIE_MAX_AGE: u64 = 365 * 24 * 60 * 60;
/// Wrong answers allowed per minute, across everyone.
const MAX_FAILURES_PER_MINUTE: usize = 20;

type HmacSha256 = Hmac<Sha256>;

pub fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn sign(passphrase: &str, nonce: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(passphrase.as_bytes()).expect("hmac accepts any key length");
    mac.update(b"fog-session-v1:");
    mac.update(nonce.as_bytes());
    hex(&mac.finalize().into_bytes())
}

fn cookie_value(req: &Request) -> Option<String> {
    let header = req.headers().get(header::COOKIE)?.to_str().ok()?;
    header
        .split(';')
        .map(str::trim)
        .find_map(|pair| pair.strip_prefix(COOKIE).and_then(|rest| rest.strip_prefix('=')))
        .map(str::to_owned)
}

fn session_ok(gate: &Gate, req: &Request) -> bool {
    let Some(passphrase) = gate.passphrase.as_deref() else { return false };
    let Some(cookie) = cookie_value(req) else { return false };
    let Some((nonce, sig)) = cookie.split_once('.') else { return false };
    if nonce.len() != 32 || !nonce.bytes().all(|b| b.is_ascii_hexdigit()) {
        return false;
    }
    let expected = sign(passphrase, nonce);
    expected.as_bytes().ct_eq(sig.as_bytes()).into()
}

fn wants_https(req: &Request) -> bool {
    req.headers()
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.eq_ignore_ascii_case("https"))
        .unwrap_or(false)
}

fn set_cookie(value: &str, max_age: u64, secure: bool) -> HeaderValue {
    let mut cookie = format!("{COOKIE}={value}; Path=/; Max-Age={max_age}; HttpOnly; SameSite=Lax");
    if secure {
        cookie.push_str("; Secure");
    }
    HeaderValue::from_str(&cookie).expect("cookie is ascii")
}

/// Every request but the health check and the login itself needs a valid cookie.
/// An API call without one gets 401 JSON; a page gets the gate instead of the game.
async fn gate(State(app): State<Shared>, req: Request, next: Next) -> Response {
    let path = req.uri().path();
    if path == "/api/health" || path == "/api/login" || app.gate.open || session_ok(&app.gate, &req) {
        return next.run(req).await;
    }
    if path.starts_with("/api/") {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": "sign in first" }))).into_response();
    }
    (StatusCode::UNAUTHORIZED, Html(GATE_PAGE)).into_response()
}

#[derive(Deserialize)]
struct Login {
    passphrase: String,
}

async fn login(State(app): State<Shared>, req: Request) -> Response {
    let secure = wants_https(&req);
    let Some(passphrase) = app.gate.passphrase.as_deref() else {
        // Nothing to compare against: say so rather than refuse every word as wrong.
        return StatusCode::SERVICE_UNAVAILABLE.into_response();
    };
    let body = match axum::body::to_bytes(req.into_body(), 4096).await {
        Ok(b) => b,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };
    let Ok(Login { passphrase: given }) = serde_json::from_slice::<Login>(&body) else {
        return StatusCode::BAD_REQUEST.into_response();
    };

    {
        let mut failures = app.gate.failures.lock().expect("failures lock");
        failures.retain(|t| t.elapsed() < Duration::from_secs(60));
        if failures.len() >= MAX_FAILURES_PER_MINUTE {
            return StatusCode::TOO_MANY_REQUESTS.into_response();
        }
    }

    let right: bool = given.trim().as_bytes().ct_eq(passphrase.as_bytes()).into();
    if !right {
        app.gate.failures.lock().expect("failures lock").push(Instant::now());
        tokio::time::sleep(Duration::from_secs(1)).await;
        return StatusCode::UNAUTHORIZED.into_response();
    }

    let nonce = hex(&rand::random::<[u8; 16]>());
    let value = format!("{nonce}.{}", sign(passphrase, &nonce));
    ([(header::SET_COOKIE, set_cookie(&value, COOKIE_MAX_AGE, secure))], StatusCode::NO_CONTENT).into_response()
}

async fn logout(req: Request) -> Response {
    let secure = wants_https(&req);
    ([(header::SET_COOKIE, set_cookie("", 0, secure))], StatusCode::NO_CONTENT).into_response()
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

pub fn fnv1a(s: &str) -> u64 {
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

    let url = format!("{}/v1/text-to-speech/{voice_id}?output_format=mp3_44100_64", app.talk.eleven_base);
    // Live lines must come back fast: Flash answers in well under a second where v3 takes several.
    // Flash v2.5 does not cover Persian, so text outside the Latin script keeps the slower model.
    let latin = text.chars().all(|c| (c as u32) < 0x250);
    let model = if latin { app.talk.eleven_model.as_str() } else { "eleven_v3" };
    let body = serde_json::json!({
        "text": text,
        "model_id": model,
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
