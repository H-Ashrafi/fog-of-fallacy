#!/usr/bin/env node
/* Pre-generates every spoken line in the game as an MP3 with ElevenLabs (model eleven_v3)
   and writes voice/index.json so the browser can play clips without a key or a server.

   Usage:   ELEVENLABS_API_KEY=... node tools/gen-voices.js [--dry] [--only otto,mo]
   Files:   voice/<fnv1a64 of "voiceId|spoken text">.mp3   (skipped if it already exists)
            voice/index.json  { "who|raw text": "hash.mp3", ... }
   Plain Node, no packages. */

const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'voice');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ONLY = args.includes('--only') ? (args[args.indexOf('--only') + 1] || '').split(',').filter(Boolean) : [];
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY && !DRY) { console.error('Set ELEVENLABS_API_KEY (or use --dry).'); process.exit(1); }

global.window = {};
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'data-order.js'));
const D = window.FOG;
const VOICES = JSON.parse(fs.readFileSync(path.join(OUT, 'voices.json'), 'utf8'));
const MODEL = VOICES._model || 'eleven_v3';

/* ---------- collect every line that showLine/showScene can speak ---------- */
const lines = new Map();   // key "who|raw" -> { who, raw }
const add = (who, raw) => { if (typeof raw !== 'string' || !raw.trim()) return; lines.set(who + '|' + raw, { who, raw }); };
const steps = (arr, who) => (arr || []).forEach(s => { if (typeof s === 'string') add(who, s); else if (s && s.who && s.text) add(s.who, s.text); else if (s && s.scene && s.text) add('n', s.text); else if (s && s.text) add(who, s.text); });

D.LEVELS.forEach(l => l.intro.forEach(t => add('n', t)));
D.MISSIONS.forEach(m => { m.done.forEach(t => add('n', t)); add('n', m.start); add('n', m.lift); });
add('n', D.LINES.cooldown); add('n', D.LINES.handsFull); add('n', D.LINES.crewLearned);
Object.values(D.JOBS).forEach(j => { if (j.deliverTo) add(j.deliverTo, j.thanks); });
Object.values(D.TASKS).forEach(t => {
  (t.offer || []).forEach(x => add(t.giver, x)); add(t.giver, t.accept); (t.active || []).forEach(x => add(t.giver, x));
  (t.deliver || []).forEach(x => add(t.target, x)); (t.found || []).forEach(x => add('n', x)); (t.reward || []).forEach(x => add(t.giver, x)); (t.done || []).forEach(x => add(t.giver, x));
  add(t.giver, 'Come back when you have time.');
});
Object.values(D.JOBS).forEach(j => (j.lines || []).forEach(x => add('n', x)));
D.NPCS.forEach(n => {
  (n.talk || []).forEach(x => add(n.id, x)); (n.after || []).forEach(x => add(n.id, x));
  if (n.expert) { n.expert.fog.forEach(f => { steps(f.intro, n.id); steps(f.right, n.id); steps(f.wrong, n.id); }); (n.expert.crew || []).forEach(x => add(n.id, x)); add(n.id, 'Right you are.'); Object.values(D.LINES.why).forEach(arr => arr.forEach(x => add(n.id, x))); }
});
Object.values(D.TRICKS).forEach(tr => Object.entries(tr).forEach(([k, v]) => { if (Array.isArray(v) && k !== 'options') { steps(v, tr.npc); v.forEach(s => { if (s && s.choice) { /* choices are not spoken */ } }); } }));
// narrator lines for decorations, the Grey Order and the statues
Object.values(D.FLAVOR).forEach(t => add('n', t));
[D.ORDER.lines.silent, D.STATUE.inspect, D.STATUE.quote, D.STATUE.start, D.STATUE.built].forEach(t => add('n', t));
// the harder fogs preachers leave behind, and the refusals they cause
Object.entries(D.HARD).forEach(([id, fogs]) => fogs.forEach(f => { steps(f.intro, id); steps(f.right, id); steps(f.wrong, id); }));
Object.entries(D.REFUSE).forEach(([id, r]) => { steps(r.intro, id); steps(r.right, id); steps(r.wrong, id); });

/* ---------- hashing identical to server/src/main.rs ---------- */
function fnv1a64(s) {
  let h = 0xcbf29ce484222325n; const bytes = Buffer.from(s, 'utf8');
  for (const b of bytes) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, '0');
}
const spoken = raw => raw.replace(/\{name\}/g, 'friend').replace(/[*_]/g, '');
const voiceFor = who => VOICES[who] || VOICES.default;

const jobs = [...lines.values()].filter(l => !ONLY.length || ONLY.includes(l.who)).map(l => {
  const v = voiceFor(l.who), text = spoken(l.raw), hash = fnv1a64(v + '|' + text);
  return { ...l, v, text, file: hash + '.mp3' };
});
const chars = jobs.reduce((s, j) => s + j.text.length, 0);
const todo = jobs.filter(j => !fs.existsSync(path.join(OUT, j.file)));
console.log(`${jobs.length} lines, ${chars} characters, ${new Set(jobs.map(j => j.v)).size} voices, ${todo.length} to generate`);
if (DRY) { const byWho = {}; jobs.forEach(j => byWho[j.who] = (byWho[j.who] || 0) + 1); console.log(byWho); writeIndex(); process.exit(0); }

/* ---------- generate with a small worker pool ---------- */
async function tts(job, attempt = 0) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${job.v}?output_format=mp3_44100_64`;
  const res = await fetch(url, {
    method: 'POST', headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text: job.text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 5) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); return tts(job, attempt + 1); }
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  fs.writeFileSync(path.join(OUT, job.file), Buffer.from(await res.arrayBuffer()));
}
(async () => {
  let done = 0, failed = 0, i = 0;
  const worker = async () => { while (i < todo.length) { const job = todo[i++]; try { await tts(job); done++; } catch (e) { failed++; console.error(`FAIL ${job.who}: ${job.text.slice(0, 50)} -> ${e.message.slice(0, 120)}`); } if ((done + failed) % 25 === 0) console.log(`${done + failed}/${todo.length}`); } };
  await Promise.all([worker(), worker(), worker()]);
  writeIndex();
  console.log(`generated ${done}, failed ${failed}`);
})();

function writeIndex() {
  const index = {};
  for (const j of jobs) if (fs.existsSync(path.join(OUT, j.file))) index[j.who + '|' + j.raw] = j.file;
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  console.log(`index.json: ${Object.keys(index).length} clips`);
}
