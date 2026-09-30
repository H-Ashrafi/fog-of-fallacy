# Fog of Fallacy

An open-world game about spotting bad arguments. You arrive in the Valley with a
pouch of coins. Tricksters use logical fallacies to talk you out of them. Honest
jobs earn more. Experts who could build things have heads fogged with fallacies;
clear the fog and they join your crew. Each level's mission is a building that
opens the next part of the map and pays you back over time.

## Play

```powershell
.\run.ps1            # builds and starts the Rust server, then open http://localhost:8787/
```

Without the server the game still runs as a static page (open `index.html` from
any static host). Saves then live only in the browser and voices use the browser's
own speech synthesis.

Controls: arrows or WASD to walk, Enter / Space / A to talk, B trick book,
C crew, G goals, M minimap, Z zoom, Esc closes panels. On a phone use the on-screen pad.

The camera shows the whole level the player is standing in and glides to the next
level when she walks into it. 🔍 (or Z) switches to a close camera that follows her.

## The story

A magic bird, the **Simurgh**, appears out of nowhere at the start. She says a monster
at the end of the valley feeds the fog, and that the player can build a beautiful land
and rule it once the monster falls. She teaches the rules one level at a time: each level
opens with her lesson, the tracker shows her current goal, and she comes back when the
goal is done (`D.SIMURGH` in `js/data-story.js`). Each level adds one new thing:

| Level | New thing |
| --- | --- |
| 1 Riverside Village | talking, jobs, coins, clearing an expert's fog, building. No threats at all. |
| 2 River Farms | tricksters who want your coins (`fromLevel` on a trick); buildings pay income |
| 3 Market Town | halfway: the Grey Order's preachers appear, statues of Aristotle, the school |
| 4 Hill Mine | preachers also turn task givers against you; true allies |
| 5 Harbour | every trick at once; the lighthouse shows the road to the Grey City |
| 6 The Grey City | everyone is fogged; convince one person and the monster falls |

**True allies.** An expert with every fog cleared becomes a true ally (⭐ in the crew
panel). Preachers cannot fog a true ally. Allies walk to your buildings on their own,
collect the stored coins and keep 20% (`D.ALLY`); a toast says who collected, how much
you got and how much they kept, and the Goals panel lists the last collections.

**The Grey City.** Each of four citizens needs three right answers in a row (four options
each); one wrong answer and they laugh and you start again. Convincing any one of them
breaks the monster's shadow over the palace. The Simurgh reveals that the monster was
stupidity, the city turns green, and the player sits on the throne.

`node tools/dump-dialogue.js` writes every line of dialogue, with a key per line, to
`dialogue.txt` (for rewriting the text elsewhere and matching it back). Put an edited copy
back with `node tools/apply-dialogue.js <edited.txt>` (add `--dry` to preview): it matches each
[key], finds the old text in the story files and swaps it in, keeping the quotes.

## How the game works

* **Money.** You start with 40 coins. Tricksters (red `!`) try to take them with a
  fallacy. Pick the answer that names the flaw and you keep your coins and usually
  get a tip; go along with it and you lose the coins. Wrong answers can always be
  retried.
* **Work.** People with a yellow `!` have one-off tasks (deliver something, fix
  something, find something). Every region also has a repeatable job spot (buckets,
  goats, broom, ore pile, ropes) with a short cooldown so you can never be stuck.
* **Experts** (blue `?`) know a craft (mason, carpenter, water engineer, surveyor,
  scholar, millwright, smith) but refuse to work until you clear the first fallacy
  from their head. Each further fallacy you clear makes them learn 50% faster from
  the work they do. Missions need specific roles at minimum skill levels; experts
  gain XP from each mission, and the Engineering School can train them for coins.
* **Missions.** Walk up to the staked site and press A. It shows the materials
  cost, the crew fees, and who from your crew fills each role. Building takes a
  little while (hammer sounds), then the fog lifts from the next region. Finished
  buildings are investments: they accumulate coins that you collect on site.
* **Crews grow.** The well needs two experts, the bridge three, the school four, the
  mill five and the lighthouse six, at rising skill levels, so every expert matters.
* **The Grey Order.** From Market Town (level 3) on, uniformed preachers start walking out
  of the Grey Lodge in each region. A red banner and the minimap show where they are
  and who they are heading for. You cannot talk to them. A preacher who reaches an
  expert you convinced fogs their head again with a harder, sneakier fallacy (four
  options, wrong ones that sound reasonable), and the expert leaves your crew until
  you clear it. A preacher who reaches a task giver turns them against you: they
  refuse work and deliveries until you answer the preacher's argument. Pressure grows
  with each level (more preachers, more often, more heads per outing).
* **Statues of Aristotle.** Every region has an empty plinth. With a mason in your
  crew and enough coins you can raise a statue there; nobody inside its circle can be
  reached by a preacher. Statues cost more in later regions.
* **Levels.** Each early region focuses on one fallacy, later ones mix several:

  | Region | Fallacies | Mission | Crew |
  | --- | --- | --- | --- |
  | Riverside Village | bandwagon | Well | 2 |
  | River Farms | false dilemma | Bridge | 3 |
  | Market Town | appeal to emotion, post hoc | Engineering School | 4 |
  | Hill Mine | gambler's fallacy, sunk cost, hasty generalisation | Waterwheel Mill | 5 |
  | Harbour | authority, slippery slope, straw man, red herring, tradition, ad hominem | Lighthouse | 6 |
  | The Grey City | all of them | the throne (convince one person) | - |

* **Scenes and mini-games.** Pressing A on most things (the goat, the fountain, a boat,
  the canary, the card table) opens a small animated picture instead of a line of text; the
  narrator's line is its caption. A few things hide a short mini-game, playable with keys,
  mouse or touch: Dodge's cup game inside his trick (the pea is always palmed; he shows you
  how after you beat him, and plays a fair round for fun afterwards), *red or black* at the
  card table in the Hill Mine (six fair flips, then the question that teaches the gambler's
  fallacy, 10 coins), skipping stones on the village beach and the harbour beach, shooing
  crows at the scarecrow once it stands again, and fishing at the end of the pier (a red
  herring pays nothing). Games pay once a minute; captions live in `js/data-games.js`, the
  drawing in `js/scenes.js`.

All story content lives in `js/data.js`; the Grey Order, the statues, the harder
fogs and the refusals in `js/data-order.js`; the scenes' captions and the mini-games in
`js/data-games.js`; the map in `js/world.js`; the scenes themselves in `js/scenes.js`; the
engine in `js/game.js`; sound and voice in `js/audio.js`; languages in `js/i18n.js` and
`js/lang/`.

## Languages

English is the source text. Persian (`fa`) and Arabic (`ar`) are text only for now
(no recorded voices), right-to-left, shown without vowel marks, and use local names
(Farmer Idris is کشاورز رسول in Persian and المزارع إدريس in Arabic; the full table is
in `i18n/NAMES.md`). Pick a language on the title screen or open `?lang=fa`.

* `js/i18n.js` swaps every text field in the story data at start-up and translates
  UI strings through `T('...')`. `js/lang/<code>.js` holds one dictionary per
  language, keyed by the exact English string, so the English files stay the only
  place where the story is written.
* `node tools/i18n-extract.js` lists every English string in `i18n/en.json`.
* `node tools/i18n-check.js fa` reports missing keys, placeholder mismatches, leftover
  vowel marks, and translated option sets where the right answer became the longest
  option (that would be a tell). Run it after any change to the story or a dictionary.

## Server (Rust)

`server/` is a small [axum](https://github.com/tokio-rs/axum) app:

| Route | Purpose |
| --- | --- |
| `GET /` | serves the game from the repo root (or `FOG_WEB_DIR`) |
| `GET /api/health` | `{ ok, voice }` |
| `GET /api/saves/{slug}` · `PUT /api/saves/{slug}` | JSON save per player name |
| `GET /api/voice?who=&profile=&text=` | recorded voice line, cached as MP3 on disk |

Environment variables:

| Name | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8787` | listen port |
| `FOG_BIND` | `0.0.0.0` | bind address (LAN play from a phone works out of the box) |
| `FOG_WEB_DIR` | `.` | folder containing `index.html` |
| `FOG_DATA_DIR` | `%LOCALAPPDATA%\FogOfFallacy` | saves and voice cache |
| `FOG_VOICES` | `voice/voices.json`, then built-in copy | character → voice id mapping for the live route |
| `ELEVENLABS_API_KEY` | unset | when set, `/api/voice` fetches lines from ElevenLabs once and caches them |

## Caching (read before deploying)

`index.html` and `voice/index.json` are served with `Cache-Control: no-cache`, so a
browser always asks whether they changed (a 304 is cheap). Everything under `css/`,
`js/`, `img/` and `voice/` is served `immutable` for a year, because those URLs change
whenever their content does: css and js carry a `?v=` query, and a voice clip is named
after a hash of its own text.

**Run `node tools/bump-version.js` whenever you change anything in `css/` or `js/`,
before deploying.** It rewrites every `?v=` in `index.html`. Skip it and returning
players keep running the JavaScript their browser cached; with a stale
`voice/index.json` they lose the recorded voices and hear the robot fallback instead.
On a plain static host (GitHub Pages) the `?v=` bump is the only thing that protects
them, since the headers above come from the Rust server.

## Voices

Every line in the script is pre-recorded with ElevenLabs (model `eleven_v3`) and
committed under `voice/` as small MP3s, so voices work on any static host and the
production server never needs an API key. `voice/voices.json` assigns one voice per
character (no two speakers in the same region share a voice); `voice/index.json`
maps each spoken line to its clip. The browser plays the clip when it has one and
falls back to the server voice route, then to speech synthesis, for anything not
pre-recorded (lines the engine composes at runtime).

After editing dialogue in `js/data.js` or `js/data-order.js`, regenerate only the changed lines with:

```powershell
$env:ELEVENLABS_API_KEY = '...'
node tools/gen-voices.js          # --dry to count, --only otto,mo to limit
```

Without `ELEVENLABS_API_KEY` the live voice route answers 204 and the browser speaks
uncached lines with per-character pitch and rate. Sound effects are synthesised in the
browser with WebAudio.

```powershell
cd server
cargo run --release           # from the server folder, with FOG_WEB_DIR=.. or run from the repo root
```
