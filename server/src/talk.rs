//! Live conversations with the tricksters.
//!
//! The scripted encounters in js/data.js have three fixed answers, which a child can
//! learn to pick without reading. Here the character talks instead: the server asks an
//! OpenAI model to play the character (same story, same fallacy, words for a six-year-
//! old), the browser records what the child says back, ElevenLabs turns it into text,
//! and the model answers and judges whether the child saw through the trick. The game
//! then pays out exactly as the scripted scene would have.
//!
//! What it costs, and what keeps the cost down:
//! * Opening lines are pooled per character, fallacy and language (`talk/openings/`):
//!   once six exist, a random one is reused and no model call is made.
//! * Every spoken line goes through `/api/voice`, which caches clips by text, so a
//!   reused opening costs nothing to speak either.
//! * `FOG_TALK_DAILY_LIMIT` caps model calls per UTC day; past it the browser is told
//!   (`talk: false` in /api/health) and falls back to the scripted answers.
//! * A conversation is at most `FOG_TALK_MAX_TURNS` replies from the child.
//!
//! Every exchange is appended to `talk/log/<day>.jsonl`, so a parent can read what was
//! said and how it was judged.

use std::{
    collections::HashMap,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::{
    body::Bytes,
    extract::{Path, Query, Request, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};

use crate::Shared;

pub struct Talk {
    pub openai_key: Option<String>,
    pub openai_base: String,
    /// The model that plays the characters: the first of `candidates` that OpenAI still serves
    /// (probed at startup, and again when a turn answers model_not_found). See pick_model.
    model: Mutex<String>,
    candidates: Vec<String>,
    /// Why conversations are off although the keys are present (no candidate answered).
    model_error: Mutex<Option<String>>,
    pub eleven_base: String,
    pub eleven_model: String,
    pub dir: PathBuf,
    pub daily_limit: u32,
    pub max_turns: u32,
    convs: Mutex<HashMap<String, Conv>>,
}

/// What the browser sends to start a conversation: the scripted scene, so the model
/// plays the same character, with the same aim and the same fallacy, in the same language.
#[derive(Clone, Deserialize, Serialize)]
pub struct Seed {
    pub who: String,
    pub name: String,
    pub fallacy: String,
    pub nick: String,
    pub one: String,
    pub spot: String,
    #[serde(default = "default_lang")]
    pub lang: String,
    pub player: String,
    /// "trick" (a trickster wants coins), "fog" (an expert's head is fogged), "hard"
    /// (a preacher's harder fog) or "refuse" (someone the preacher turned against you).
    pub kind: String,
    #[serde(default)]
    pub topic: Option<String>,
    #[serde(default)]
    pub intro: Vec<String>,
    #[serde(default)]
    pub right: Vec<String>,
    #[serde(default)]
    pub wrong: Vec<String>,
    #[serde(default)]
    pub cost: Option<i64>,
}
fn default_lang() -> String {
    "en".into()
}

struct Conv {
    seed: Seed,
    messages: Vec<serde_json::Value>,
    turns: u32,
    started: Instant,
}

#[derive(Serialize)]
pub struct Turn {
    pub heard: String,
    pub say: Option<String>,
    pub verdict: String,
    pub done: bool,
    pub turns_left: u32,
}

#[derive(Deserialize)]
struct ModelTurn {
    say: String,
    verdict: String,
}

impl Talk {
    pub fn from_env(data: &std::path::Path) -> Talk {
        let dir = data.join("talk");
        for sub in ["openings", "usage", "log"] {
            if let Err(e) = std::fs::create_dir_all(dir.join(sub)) {
                eprintln!("cannot create {}: {e}", dir.join(sub).display());
            }
        }
        let env = |k: &str| std::env::var(k).ok().map(|v| v.trim().to_string()).filter(|v| !v.is_empty());
        Talk {
            openai_key: env("OPENAI_API_KEY"),
            openai_base: env("OPENAI_BASE_URL").unwrap_or_else(|| "https://api.openai.com/v1".into()).trim_end_matches('/').to_string(),
            model: Mutex::new(String::new()),
            candidates: {
                let mut c: Vec<String> = env("FOG_OPENAI_MODEL").into_iter().collect();
                for m in ["gpt-4o-mini", "gpt-5-mini", "gpt-4.1-mini", "gpt-5-nano"] { if !c.iter().any(|x| x == m) { c.push(m.into()); } }
                c
            },
            model_error: Mutex::new(Some("model not probed yet".into())),
            eleven_base: env("ELEVENLABS_BASE_URL").unwrap_or_else(|| "https://api.elevenlabs.io".into()).trim_end_matches('/').to_string(),
            eleven_model: env("FOG_ELEVEN_MODEL").unwrap_or_else(|| "eleven_flash_v2_5".into()),
            dir,
            daily_limit: env("FOG_TALK_DAILY_LIMIT").and_then(|v| v.parse().ok()).unwrap_or(250),
            max_turns: env("FOG_TALK_MAX_TURNS").and_then(|v| v.parse().ok()).unwrap_or(4),
            convs: Mutex::new(HashMap::new()),
        }
    }

    /// Conversations need the model for the talking and ElevenLabs for the listening.
    pub fn enabled(&self, eleven_key: bool) -> bool {
        self.openai_key.is_some() && eleven_key && self.model_error.lock().expect("model lock").is_none()
    }
    pub fn model(&self) -> String {
        self.model.lock().expect("model lock").clone()
    }

    pub fn status(&self, eleven_key: bool) -> serde_json::Value {
        let used = self.used_today();
        serde_json::json!({
            "talk": self.enabled(eleven_key) && used < self.daily_limit,
            "talk_used": used,
            "talk_limit": self.daily_limit,
            "talk_model": self.model(),
            "talk_error": self.model_error.lock().expect("model lock").clone(),
        })
    }

    /// Ask OpenAI which of the candidate models it still serves and use the first one. Models get
    /// deprecated without warning (gpt-4.1-nano went in November 2026, and every conversation then
    /// failed silently), so this runs at startup and again when a turn answers model_not_found.
    /// `skip` is a model that just failed, so a stale probe cannot pick it again.
    pub async fn pick_model(&self, http: &reqwest::Client, skip: Option<&str>) {
        let Some(key) = self.openai_key.as_deref() else { return };
        let mut errors = Vec::new();
        for m in &self.candidates {
            if Some(m.as_str()) == skip { continue; }
            let url = format!("{}/models/{}", self.openai_base, m);
            match http.get(&url).bearer_auth(key).send().await {
                Ok(r) if r.status().is_success() => {
                    *self.model.lock().expect("model lock") = m.clone();
                    *self.model_error.lock().expect("model lock") = None;
                    println!("  talk    : live conversations with {m} ({} model calls a day, {} answers each)", self.daily_limit, self.max_turns);
                    return;
                }
                Ok(r) => errors.push(format!("{m}: {}", r.status())),
                Err(e) => errors.push(format!("{m}: {e}")),
            }
        }
        let msg = format!("no usable OpenAI model ({})", errors.join("; "));
        eprintln!("  talk    : OFF, {msg}; scripted answers until a model answers (set FOG_OPENAI_MODEL)");
        *self.model_error.lock().expect("model lock") = Some(msg);
    }

    fn day() -> u64 {
        SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() / 86_400).unwrap_or(0)
    }
    fn usage_path(&self) -> PathBuf {
        self.dir.join("usage").join(format!("{}.count", Self::day()))
    }
    fn used_today(&self) -> u32 {
        std::fs::read_to_string(self.usage_path()).ok().and_then(|s| s.trim().parse().ok()).unwrap_or(0)
    }
    /// One model call is about to be made. False when today's budget is spent.
    fn spend(&self) -> bool {
        let used = self.used_today();
        if used >= self.daily_limit {
            return false;
        }
        if let Err(e) = std::fs::write(self.usage_path(), (used + 1).to_string()) {
            eprintln!("talk usage write failed: {e}");
        }
        true
    }

    fn log(&self, id: &str, seed: &Seed, role: &str, text: &str, verdict: Option<&str>) {
        let line = serde_json::json!({
            "t": SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0),
            "id": id, "who": seed.who, "player": seed.player, "fallacy": seed.fallacy, "lang": seed.lang,
            "role": role, "text": text, "verdict": verdict,
        });
        let path = self.dir.join("log").join(format!("{}.jsonl", Self::day()));
        use std::io::Write;
        match std::fs::OpenOptions::new().create(true).append(true).open(&path) {
            Ok(mut f) => {
                let _ = writeln!(f, "{line}");
            }
            Err(e) => eprintln!("talk log failed: {e}"),
        }
    }

    fn language_name(lang: &str) -> &'static str {
        match lang {
            "fa" => "Persian (Farsi), in the Persian script, simple everyday words",
            "ar" => "Arabic, in the Arabic script, simple everyday words",
            _ => "English",
        }
    }

    /// How the scene ends, by who the character is. A trickster is always a trickster: on a spotted
    /// verdict he sulks and gives up for now, never praises, never explains the lesson and never pays
    /// (the Simurgh does all that, in the game); on fooled he gloats and takes the coins. Everyone
    /// else (an expert whose head clears, a citizen, a refusal) concedes honestly.
    fn closing_rule(seed: &Seed) -> String {
        if seed.kind == "trick" {
            "When the verdict is \"spotted\": \"say\" is your closing line and you STAY A TRICKSTER: you grumble, sulk, shrug it off, make a feeble excuse or pretend you were joking, in your own words and differently every time (never the same sentence twice; do not copy any example), you stop pushing, you do NOT praise the child, do NOT say what the trick was, do NOT explain any lesson, do NOT offer coins, and ask no question. When \"fooled\": \"say\" gloats a little in character as you take what you wanted; no lesson, no explanation, no question.".to_string()
        } else {
            "When the verdict is \"spotted\": \"say\" is your closing line, in character and kind: you give up the bad reasoning, you do NOT argue for it any more, you say in one simple sentence that you see it now, and you ask no further question. When \"fooled\": \"say\" shows that you still believe the bad reasoning and the fog stays; no question.".to_string()
        }
    }

    /// The character, the scene and the rules, in one system message.
    fn system_prompt(&self, seed: &Seed) -> String {
        let aim = match seed.kind.as_str() {
            "trick" => match seed.cost {
                Some(c) if c > 0 => format!("You want the child to hand you {c} coins. You use the trick to make paying feel like the only sensible thing."),
                _ => "You want the child to agree with you. You use the trick to make agreeing feel like the only sensible thing.".to_string(),
            },
            "refuse" => "You have decided not to work with the child any more, because of the trick in your head. You use the trick to explain why. If the child answers the trick well, you change your mind.".to_string(),
            _ => "You are an expert whose head is fogged by this trick, so you refuse to work. You use the trick to explain why. If the child answers the trick well, the fog lifts and you agree to work.".to_string(),
        };
        let intro = seed.intro.iter().map(|l| format!("- {l}")).collect::<Vec<_>>().join("\n");
        let right = seed.right.iter().map(|l| format!("- {l}")).collect::<Vec<_>>().join("\n");
        let wrong = seed.wrong.iter().map(|l| format!("- {l}")).collect::<Vec<_>>().join("\n");
        let topic = seed.topic.as_deref().unwrap_or("the scene below");
        format!(
"You are {name}, a character in Fog of Fallacy, a gentle game that teaches a six-year-old child to notice bad arguments. The child playing is called {player}. Stay in character as {name} at all times. Never say you are an AI, a model or a game.

THE TRICK YOU USE: \"{nick}\" ({fallacy}). In plain words: {one}
What the child should learn to say: {spot}

YOUR AIM IN THIS SCENE ({topic}): {aim}
The scripted version of your opening, for the facts and the tone (do not repeat it word for word; say it your own way, differently each time):
{intro}
Answers that see through the trick sound like:
{right}
Answers that fall for it sound like:
{wrong}

HOW TO TALK: Write in {language}. The child is six: use short, common words and short sentences. Name only people who appear in the scripted lines above (and the child); never invent other villagers, places or things. At most two sentences and thirty words per turn, except your final turn, which may be three sentences. Be warm and playful, never scary, never mean, never about violence, death, bodies, romance or money the child does not have in the game. End every non-final turn with a question that invites the child to answer. If what the child said is unclear or off the subject, answer it kindly in one short sentence and push your trick again in a new way.

JUDGING: After each thing the child says, set \"verdict\":
- \"spotted\" when the child questions the reasoning in any way: asks why, asks for proof or a reason, says that is not a reason, points out the flaw, or names the trick. Be generous: a six-year-old says it simply. A single word is enough: \"why\", \"why?\", \"how\", \"prove it\", \"no\" or \"not a reason\" on its own is ALWAYS \"spotted\", never \"none\". The whole point of the game is to get the child to ask why.
- \"fooled\" when the child agrees, goes along, pays, or accepts the trick as a reason.
- \"insult\" when the child only calls you names instead of answering.
- \"none\" when you cannot tell yet. Then keep going.
Decide the verdict first, then write \"say\" to match it. {closing} When \"insult\": \"say\" says that names are not an answer and asks the child to say why instead. In all three the conversation ends. Only with \"none\" do you keep pushing the trick and end with a question.
Every sentence must make plain sense on its own; never mash two ideas into one sentence.
Always answer with JSON: {{\"verdict\": \"none|spotted|fooled|insult\", \"say\": \"...\"}}.",
            name = seed.name, player = seed.player, nick = seed.nick, fallacy = seed.fallacy, one = seed.one, spot = seed.spot,
            topic = topic, aim = aim, intro = intro, right = right, wrong = wrong, language = Self::language_name(&seed.lang),
            closing = Self::closing_rule(seed),
        )
    }

    async fn model_turn(&self, http: &reqwest::Client, messages: &[serde_json::Value]) -> Result<ModelTurn, String> {
        let key = self.openai_key.as_deref().ok_or("no OPENAI_API_KEY")?;
        let model = self.model();
        let mut body = serde_json::json!({
            "model": model,
            "messages": messages,
            "max_completion_tokens": 220,
            "response_format": { "type": "json_schema", "json_schema": { "name": "turn", "strict": true, "schema": {
                "type": "object", "additionalProperties": false,
                "properties": {
                    "verdict": { "type": "string", "enum": ["none", "spotted", "fooled", "insult"] },
                    "say": { "type": "string" }
                },
                "required": ["verdict", "say"]
            } } }
        });
        // The reasoning models (gpt-5 family, o-series) refuse a temperature; the others like some variety.
        if !(model.starts_with("gpt-5") || model.starts_with('o')) {
            body["temperature"] = serde_json::json!(0.9);
        }
        let url = format!("{}/chat/completions", self.openai_base);
        let resp = http.post(&url).bearer_auth(key).json(&body).send().await.map_err(|e| format!("model unreachable: {e}"))?;
        let status = resp.status();
        let text = resp.text().await.map_err(|e| format!("model answer unreadable: {e}"))?;
        if !status.is_success() {
            if text.contains("model_not_found") {
                // The model was retired under us: find another and let the caller retry.
                self.pick_model(http, Some(&model)).await;
            }
            return Err(format!("model answered {status}: {}", text.chars().take(300).collect::<String>()));
        }
        let v: serde_json::Value = serde_json::from_str(&text).map_err(|e| format!("model answer is not JSON: {e}"))?;
        let content = v["choices"][0]["message"]["content"].as_str().ok_or("model answer has no content")?;
        let turn: ModelTurn = serde_json::from_str(content).map_err(|e| format!("model turn is not the expected JSON: {e}: {content}"))?;
        Ok(ModelTurn { say: turn.say.trim().to_string(), verdict: turn.verdict })
    }

    /// One pool per scene: the character, the trick, the language AND the scripted lines, so a
    /// test seed or a rewritten scene never feeds its openings to a different scene.
    fn pool_path(&self, seed: &Seed) -> PathBuf {
        let clean = |s: &str| s.chars().filter(|c| c.is_ascii_alphanumeric()).collect::<String>();
        let scene = crate::fnv1a(&format!("{}|{}|{}", seed.topic.as_deref().unwrap_or(""), seed.intro.join("\n"), seed.cost.unwrap_or(0)));
        self.dir.join("openings").join(format!("{}-{}-{}-{scene:016x}.json", clean(&seed.who), clean(&seed.fallacy), clean(&seed.lang)))
    }

    /// A closing line must not end on a question the child cannot answer any more: when the
    /// scene is over and the line has several sentences, a final question is dropped.
    fn close_line(say: &str) -> String {
        let t = say.trim();
        if !t.ends_with('?') && !t.ends_with('؟') { return t.to_string(); }
        let cut = t.trim_end_matches(['?', '؟']).rfind(|c| c == '.' || c == '!' || c == '؟' || c == '?');
        match cut {
            Some(i) if i + 1 < t.len() => t[..=i].trim().to_string(),
            _ => t.to_string(),
        }
    }

    /// An opening line: from the pool once it has six, else freshly written and pooled.
    /// The child's name is pooled as {name} so a saved opening fits any player.
    async fn opening(&self, http: &reqwest::Client, seed: &Seed) -> Result<String, String> {
        let path = self.pool_path(seed);
        let mut pool: Vec<String> = std::fs::read_to_string(&path).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default();
        if pool.len() >= 6 {
            let pick = &pool[rand::random::<usize>() % pool.len()];
            return Ok(pick.replace("{name}", &seed.player));
        }
        if !self.spend() {
            return Err("budget".into());
        }
        let messages = vec![
            serde_json::json!({ "role": "system", "content": self.system_prompt(seed) }),
            serde_json::json!({ "role": "user", "content": format!("(The child walks up to you.) Start the scene: greet {} by name and begin your trick in your own words, ending with a question. Verdict is \"none\".", seed.player) }),
        ];
        let turn = match self.model_turn(http, &messages).await {
            Ok(t) => t,
            Err(e) if e.contains("model_not_found") && self.model_error.lock().expect("model lock").is_none() => self.model_turn(http, &messages).await?,
            Err(e) => return Err(e),
        };
        let say = turn.say;
        let pooled = say.replace(&seed.player, "{name}");
        if !say.is_empty() && !pool.contains(&pooled) {
            pool.push(pooled);
            if let Err(e) = std::fs::write(&path, serde_json::to_string_pretty(&pool).unwrap_or_default()) {
                eprintln!("opening pool write failed: {e}");
            }
        }
        Ok(say)
    }

    async fn transcribe(&self, http: &reqwest::Client, key: &str, audio: Bytes, mime: &str, lang: &str) -> Result<String, String> {
        let ext = if mime.contains("mp4") || mime.contains("m4a") || mime.contains("aac") { "m4a" } else if mime.contains("ogg") { "ogg" } else if mime.contains("wav") { "wav" } else { "webm" };
        let part = reqwest::multipart::Part::bytes(audio.to_vec())
            .file_name(format!("answer.{ext}"))
            .mime_str(mime)
            .map_err(|e| format!("bad audio type: {e}"))?;
        let mut form = reqwest::multipart::Form::new().text("model_id", "scribe_v1").text("tag_audio_events", "false").part("file", part);
        if lang == "en" || lang == "fa" || lang == "ar" {
            form = form.text("language_code", lang.to_string());
        }
        let url = format!("{}/v1/speech-to-text", self.eleven_base);
        let resp = http.post(&url).header("xi-api-key", key).multipart(form).send().await.map_err(|e| format!("transcriber unreachable: {e}"))?;
        let status = resp.status();
        let text = resp.text().await.map_err(|e| format!("transcript unreadable: {e}"))?;
        if !status.is_success() {
            return Err(format!("transcriber answered {status}: {}", text.chars().take(300).collect::<String>()));
        }
        let v: serde_json::Value = serde_json::from_str(&text).map_err(|e| format!("transcript is not JSON: {e}"))?;
        Ok(v["text"].as_str().unwrap_or("").trim().to_string())
    }

    /// A one-word challenge is the whole lesson of the game, so it is settled here, not left to the
    /// model: "why" on its own came back as "none" in two runs out of three on a small model.
    fn is_challenge(heard: &str) -> bool {
        let norm: String = heard.to_lowercase().chars().filter(|c| c.is_alphanumeric() || c.is_whitespace()).collect::<String>().split_whitespace().collect::<Vec<_>>().join(" ");
        const CHALLENGES: &[&str] = &[
            "why", "but why", "why not", "why though", "how", "how come", "how do you know", "says who", "so what", "prove it", "show me",
            "no", "no way", "not a reason", "thats not a reason", "that is not a reason", "that isnt a reason", "that is not a real reason",
            "why is it right", "why is that right", "why should i", "is it true", "is that true", "what does it do",
            "چرا", "چرا نه", "از کجا میدانی", "ثابت کن", "نه", "لماذا", "لماذا لا", "كيف تعرف", "أثبت ذلك", "لا",
        ];
        CHALLENGES.contains(&norm.as_str())
    }

    fn prune(convs: &mut HashMap<String, Conv>) {
        convs.retain(|_, c| c.started.elapsed() < Duration::from_secs(30 * 60));
    }
}

fn fail(status: StatusCode, msg: &str) -> Response {
    (status, Json(serde_json::json!({ "error": msg }))).into_response()
}

/// POST /api/talk — the scripted scene in, the character's opening line out.
pub async fn start(State(app): State<Shared>, Json(seed): Json<Seed>) -> Response {
    let talk = &app.talk;
    if !talk.enabled(app.key.is_some()) {
        return fail(StatusCode::SERVICE_UNAVAILABLE, "conversations are off: set OPENAI_API_KEY and ELEVENLABS_API_KEY");
    }
    if seed.who.is_empty() || seed.name.is_empty() || seed.player.is_empty() || seed.intro.is_empty() {
        return fail(StatusCode::BAD_REQUEST, "who, name, player and intro are needed");
    }
    let say = match talk.opening(&app.http, &seed).await {
        Ok(s) => s,
        Err(e) if e == "budget" => return fail(StatusCode::TOO_MANY_REQUESTS, "today's conversations are used up"),
        Err(e) => {
            eprintln!("talk start failed: {e}");
            return fail(StatusCode::BAD_GATEWAY, "the character could not think of anything to say");
        }
    };
    let id = crate::hex(&rand::random::<[u8; 12]>());
    talk.log(&id, &seed, "character", &say, None);
    let messages = vec![
        serde_json::json!({ "role": "system", "content": talk.system_prompt(&seed) }),
        serde_json::json!({ "role": "assistant", "content": serde_json::json!({ "verdict": "none", "say": say }).to_string() }),
    ];
    {
        let mut convs = talk.convs.lock().expect("convs lock");
        Talk::prune(&mut convs);
        convs.insert(id.clone(), Conv { seed, messages, turns: 0, started: Instant::now() });
    }
    Json(serde_json::json!({ "id": id, "say": say, "turns_left": talk.max_turns })).into_response()
}

#[derive(Deserialize)]
pub struct ReplyQuery {
    /// Typed instead of spoken (no audio in the body).
    text: Option<String>,
}

/// POST /api/talk/:id — the child's answer in (recorded audio, or ?text=), the
/// character's reply and the verdict out.
pub async fn reply(State(app): State<Shared>, Path(id): Path<String>, Query(q): Query<ReplyQuery>, req: Request) -> Response {
    let talk = &app.talk;
    let Some(eleven_key) = app.key.as_deref() else {
        return fail(StatusCode::SERVICE_UNAVAILABLE, "no ELEVENLABS_API_KEY");
    };
    let (seed, turns) = {
        let convs = talk.convs.lock().expect("convs lock");
        match convs.get(&id) {
            Some(c) => (c.seed.clone(), c.turns),
            None => return fail(StatusCode::NOT_FOUND, "that conversation is over"),
        }
    };
    if turns >= talk.max_turns {
        return fail(StatusCode::GONE, "that conversation is over");
    }

    let heard = match q.text {
        Some(t) => t.trim().chars().take(400).collect::<String>(),
        None => {
            let mime = req.headers().get(header::CONTENT_TYPE).and_then(|v| v.to_str().ok()).unwrap_or("audio/webm").to_string();
            let audio = match axum::body::to_bytes(req.into_body(), 2 * 1024 * 1024).await {
                Ok(b) => b,
                Err(_) => return fail(StatusCode::BAD_REQUEST, "audio too long"),
            };
            if audio.len() < 200 {
                return fail(StatusCode::BAD_REQUEST, "no audio");
            }
            match talk.transcribe(&app.http, eleven_key, audio, &mime, &seed.lang).await {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("talk transcribe failed: {e}");
                    return fail(StatusCode::BAD_GATEWAY, "could not hear the answer");
                }
            }
        }
    };
    if heard.is_empty() {
        // Nothing to answer: no model call, the child just tries again.
        return Json(Turn { heard, say: None, verdict: "none".into(), done: false, turns_left: talk.max_turns - turns }).into_response();
    }
    talk.log(&id, &seed, "child", &heard, None);

    if !talk.spend() {
        return fail(StatusCode::TOO_MANY_REQUESTS, "today's conversations are used up");
    }
    let last = turns + 1 >= talk.max_turns;
    let challenged = Talk::is_challenge(&heard);
    let messages = {
        let mut convs = talk.convs.lock().expect("convs lock");
        let Some(c) = convs.get_mut(&id) else { return fail(StatusCode::NOT_FOUND, "that conversation is over") };
        let mut content = heard.clone();
        if challenged {
            if seed.kind == "trick" {
                content.push_str("\n\n(The child has challenged your reasoning. The verdict is \"spotted\", decided. Write only your closing line, at most two sentences, and stay a trickster: grumble, sulk, shrug it off, make a feeble excuse or pretend you were joking, in your own words and in a fresh way (do not repeat a line you have used before), and stop pushing. Do not praise the child, do not say what the trick was, do not explain, do not offer coins, ask no question.)");
            } else {
                content.push_str("\n\n(The child has challenged your reasoning. The verdict is \"spotted\", decided. Write only your closing line, at most two sentences: give up the bad reasoning, say that you see it now, and ask no question.)");
            }
        } else if last {
            content.push_str("\n\n(This was the child's last answer. Decide now: \"spotted\" or \"fooled\" (or \"insult\"), never \"none\", and end the scene in your final turn.)");
        } else {
            content.push_str(if seed.kind == "trick" {
                "\n\n(Reminder: decide the verdict first. If it is \"spotted\", your line is a sulky closing line in character: no praise, no lesson, no coins, no question. If \"fooled\", you gloat and take what you wanted; no lesson, no question. Only with \"none\" do you keep pushing and end with a question.)"
            } else {
                "\n\n(Reminder: decide the verdict first. If it is \"spotted\" or \"fooled\", your line is a closing line with no question. Only with \"none\" do you keep pushing and end with a question.)"
            });
        }
        c.messages.push(serde_json::json!({ "role": "user", "content": content }));
        c.messages.clone()
    };
    let first = talk.model_turn(&app.http, &messages).await;
    let turn = match first {
        Ok(t) => t,
        Err(e) if e.contains("model_not_found") && talk.model_error.lock().expect("model lock").is_none() => match talk.model_turn(&app.http, &messages).await {
            Ok(t) => t,
            Err(e) => { eprintln!("talk reply failed after re-pick: {e}"); return fail(StatusCode::BAD_GATEWAY, "the character lost their words"); }
        },
        Err(e) => {
            eprintln!("talk reply failed: {e}");
            return fail(StatusCode::BAD_GATEWAY, "the character lost their words");
        }
    };
    let mut verdict = turn.verdict;
    if challenged {
        verdict = "spotted".into();
    } else if last && verdict == "none" {
        verdict = "fooled".into();
    }
    let done = verdict != "none";
    let turn = ModelTurn { say: if done { Talk::close_line(&turn.say) } else { turn.say }, verdict: verdict.clone() };
    {
        let mut convs = talk.convs.lock().expect("convs lock");
        if let Some(c) = convs.get_mut(&id) {
            c.turns += 1;
            c.messages.push(serde_json::json!({ "role": "assistant", "content": serde_json::json!({ "verdict": verdict, "say": turn.say }).to_string() }));
        }
        if done {
            convs.remove(&id);
        }
    }
    talk.log(&id, &seed, "character", &turn.say, Some(&verdict));
    Json(Turn { heard, say: Some(turn.say), verdict, done, turns_left: talk.max_turns - turns - 1 }).into_response()
}
