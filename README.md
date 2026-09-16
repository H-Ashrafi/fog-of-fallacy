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
C crew, G goals, M minimap, Esc closes panels. On a phone use the on-screen pad.

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
* **Levels.** Each early region focuses on one fallacy, later ones mix several:

  | Region | Fallacies | Mission |
  | --- | --- | --- |
  | Riverside Village | bandwagon | Well |
  | River Farms | false dilemma | Bridge |
  | Market Town | appeal to emotion, post hoc | Engineering School |
  | Hill Mine | gambler's fallacy, sunk cost, hasty generalisation | Waterwheel Mill |
  | Harbour | authority, slippery slope, straw man, red herring, tradition, ad hominem | Lighthouse |

All story content lives in `js/data.js`; the map in `js/world.js`; the engine in
`js/game.js`; sound and voice in `js/audio.js`.

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
| `FOG_VOICES` | built-in `server/voices.json` | character → voice id mapping |
| `ELEVENLABS_API_KEY` | unset | when set, `/api/voice` fetches lines from ElevenLabs once and caches them |

Without `ELEVENLABS_API_KEY` the voice route answers 204 and the browser speaks
the lines with per-character pitch and rate. Sound effects are synthesised in the
browser with WebAudio, so there are no audio files to ship.

```powershell
cd server
cargo run --release           # from the server folder, with FOG_WEB_DIR=.. or run from the repo root
```
