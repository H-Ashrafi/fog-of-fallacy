#!/usr/bin/env node
/* Writes every line of dialogue in the game (spoken lines, narration, the Simurgh, and the answers
   the player can pick) to one text file, in the order a player meets it, level by level.
   Every line starts with a [key] that points at where it lives in the story data, so an edited
   copy can be matched back line by line.
   Usage:  node tools/dump-dialogue.js            -> writes dialogue.txt
   Plain Node, no packages. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'data-order.js'));
require(path.join(ROOT, 'js', 'data-story.js'));
require(path.join(ROOT, 'js', 'data-games.js'));
require(path.join(ROOT, 'js', 'world.js'));
const D = window.FOG, W = window.World;

const out = [];
const P = s => out.push(s);
const npc = id => D.NPCS.find(n => n.id === id);
const who2 = who => who === 'n' ? 'NARRATOR' : who === 'you' ? 'PLAYER' : who === 'simurgh' ? 'SIMURGH' : ((npc(who) || {}).name || who).toUpperCase();
const head = (t, ch) => { P(''); P(ch.repeat(78)); P(t); P(ch.repeat(78)); };
const sub = t => { P(''); P('--- ' + t + ' ---'); };

/* A list of steps: strings are spoken by `who`; objects may name their own speaker, be a scene, or hold a nested choice. */
function lines(arr, who, key) {
  (arr || []).forEach((s, i) => {
    const k = `${key}[${i}]`;
    if (typeof s === 'string') P(`[${k}] ${who2(who)}: ${s}`);
    else if (s && s.choice) choices(s.choice, `${k}.choice`);
    else if (s && s.text) P(`[${k}.text] ${who2(s.scene ? 'n' : (s.who || who))}${s.scene ? ' (picture card)' : ''}: ${s.text}`);
  });
}
function one(text, who, key) { if (text) P(`[${key}] ${who2(who)}: ${text}`); }
function choices(opts, key) {
  opts.forEach((o, i) => {
    const tag = o.right || /^right/.test(o.key || '') ? '✓ RIGHT' : o.key === 'oops' ? '✗ INSULT' : o.key === 'stage2' ? '→ LEADS ON' : o.key === 'yes' || o.key === 'no' ? '' : '✗ WRONG';
    P(`[${key}[${i}].text] (PLAYER ANSWER${tag ? ' ' + tag : ''}) ${o.text}`);
  });
}
function argument(q, who, key) {   // a fog, hard fog, refusal or city question: intro, answers, right and wrong replies
  if (q.topic) P(`  (topic: ${q.topic} · trick: ${q.fallacy})`);
  lines(q.intro, who, key + '.intro');
  choices(q.options, key + '.options');
  P('  (if the player picks the right answer)'); lines(q.right, who, key + '.right');
  P('  (if the player picks a wrong answer)'); lines(q.wrong, who, key + '.wrong');
}

P('FOG OF FALLACY — EVERY LINE OF DIALOGUE');
P('');
P('Notes for whoever rewrites this file:');
P('* Keep every [key] exactly as it is, one line per key, so the new text can be put back in the game.');
P('* The players are young children (about 7). Use short, simple, whole sentences. Every sentence needs a verb.');
P('* {name} is replaced by the player\'s name. Keep it wherever it appears.');
P('* PLAYER ANSWER lines are the choices on screen. The ✓ RIGHT answer must never be the longest one,');
P('  or children learn to pick the longest. Wrong answers should sound tempting and reasonable, not silly.');
P('  ✗ INSULT answers are name-calling on purpose: they teach that insults are not arguments.');
P('* Each argument teaches the named trick (fallacy). The bad argument must still clearly use that trick.');
P('* Numbers of coins in spoken lines must match the game (they are shown in the HUD too).');
P('* NARRATOR lines are read by a storyteller. SIMURGH is a wise, warm, ancient magic bird.');

D.LEVELS.forEach((lv, r) => {
  const R = W.regions[lv.region];
  head(`LEVEL ${r + 1} · ${R.name.toUpperCase()}${lv.focus ? '   (tricks here: ' + lv.focus.join(', ') + ')' : ''}`, '=');

  const sim = D.SIMURGH.levels[r];
  if (sim) {
    sub('The Simurgh arrives' + (r === 0 ? ' (start of the game)' : ' (as this level opens)'));
    lines(sim.say, 'simurgh', `SIMURGH.levels.${r}.say`);
    sim.steps.forEach((st, i) => {
      P(`[SIMURGH.levels.${r}.steps[${i}].goal] (GOAL shown on screen) ${st.goal}`);
      if (st.say) lines(st.say, 'simurgh', `SIMURGH.levels.${r}.steps[${i}].say`);
      if (st.praise) { P('  (when the goal is done)'); lines(st.praise, 'simurgh', `SIMURGH.levels.${r}.steps[${i}].praise`); }
    });
  }
  sub('Walking into ' + R.name);
  lines(lv.intro, 'n', `LEVELS[${r}].intro`);

  const m = D.MISSIONS.find(x => x.region === lv.region);
  if (m) {
    sub('Building: ' + m.name);
    P(`[MISSIONS#${m.id}.blurb] (DESCRIPTION on the building card) ${m.blurb}`);
    one(m.start, 'n', `MISSIONS#${m.id}.start`);
    lines(m.done, 'n', `MISSIONS#${m.id}.done`);
    one(m.lift, 'n', `MISSIONS#${m.id}.lift`);
  }

  Object.entries(D.JOBS).filter(([, j]) => j.region === lv.region).forEach(([id, j]) => {
    sub(`Repeatable job: ${j.title}`);
    j.steps.forEach((s, i) => P(`[JOBS.${id}.steps[${i}]] (STEP shown on screen) ${s}`));
    if (j.deliverTo) one(j.thanks, j.deliverTo, `JOBS.${id}.thanks`);
  });

  D.NPCS.filter(n => n.region === lv.region).forEach(n => {
    const K = `NPCS#${n.id}`;
    sub(`${n.name} (${n.id})`);
    lines(n.talk, n.id, K + '.talk');
    Object.entries(D.TASKS).filter(([, t]) => t.giver === n.id).forEach(([id, t]) => {
      const T = `TASKS.${id}`;
      P(`  (task "${t.title}", pays ${t.pay} coins)`);
      lines(t.offer, n.id, T + '.offer');
      one(t.accept, n.id, T + '.accept');
      lines(t.active, n.id, T + '.active');
      if (t.found) lines(t.found, 'n', T + '.found');
      if (t.deliver) lines(t.deliver, t.target, T + '.deliver');
      if (t.reward) lines(t.reward, n.id, T + '.reward');
      lines(t.done, n.id, T + '.done');
    });
    if (n.expert) n.expert.fog.forEach((f, i) => { P(`  (fog ${i + 1} in ${n.name}'s head${i === 0 ? ': clear it and they join your crew' : ''})`); argument(f, n.id, `${K}.expert.fog[${i}]`); });
    if (n.expert) lines(n.expert.crew, n.id, K + '.expert.crew');
    if (n.trick) {
      const tr = D.TRICKS[n.trick], T = `TRICKS.${n.trick}`;
      P(`  (trick "${n.trick}": ${tr.fallacy}${tr.cost ? ', tries to take ' + tr.cost + ' coins' : ''})`);
      lines(tr.intro, tr.npc, T + '.intro');
      choices(tr.options, T + '.options');
      Object.keys(tr).filter(k => Array.isArray(tr[k]) && !['intro', 'options'].includes(k)).forEach(k => { P(`  (after answer "${k}")`); lines(tr[k], tr.npc, `${T}.${k}`); });
    }
    if (n.after) { P('  (after the trick is beaten)'); lines(n.after, n.id, K + '.after'); }
    (D.HARD[n.id] || []).forEach((f, i) => { P(`  (a Grey Order preacher fogs ${n.name} again, hard fog ${i + 1})`); argument(f, n.id, `HARD.${n.id}[${i}]`); });
    if (D.REFUSE[n.id]) { P(`  (a Grey Order preacher turns ${n.name} against you)`); argument(D.REFUSE[n.id], n.id, `REFUSE.${n.id}`); }
    if (n.city) {
      const c = n.city;
      lines(c.intro, n.id, K + '.city.intro');
      (c.gauntlet || []).forEach((q, i) => { P(`  (question ${i + 1} of ${c.gauntlet.length}: one wrong answer and the player starts again)`); argument(q, n.id, `${K}.city.gauntlet[${i}]`); });
      if (c.convinced) { P('  (convinced: this starts the ending)'); lines(c.convinced, n.id, K + '.city.convinced'); }
      if (c.after) { P('  (after the monster is gone)'); lines(c.after, n.id, K + '.city.after'); }
    }
  });

  if (lv.final) {
    sub('The ending');
    lines(D.CITY.lift, 'n', 'CITY.lift');
    lines(D.SIMURGH.ending, 'simurgh', 'SIMURGH.ending');
    lines(D.CITY.sit, 'n', 'CITY.sit');
  }
});

head('ANY TIME IN THE GAME', '=');
sub('The Simurgh, the first time something happens');
Object.entries(D.SIMURGH.events).forEach(([k, e]) => { P(`  (${k})`); lines(e, 'simurgh', `SIMURGH.events.${k}`); });
sub('Experts in your crew, when asked "Why aren\'t you working yet?"');
Object.entries(D.LINES.why).forEach(([k, arr]) => lines(arr, 'expert', `LINES.why.${k}`));
sub('Narrator');
['cooldown', 'handsFull', 'crewLearned'].forEach(k => one(D.LINES[k], 'n', `LINES.${k}`));
Object.entries(D.FLAVOR).forEach(([k, v]) => one(v, 'n', `FLAVOR.${k}`));
sub('Mini-games (captions read by the narrator; the game itself is played on screen)');
Object.entries(D.GAMES).forEach(([id, g]) => { P(`  (game "${id}"${g.fallacy ? ', teaches ' + g.fallacy : ''}${g.pay ? ', pays up to ' + g.pay + ' coins' : ''})`); Object.entries(g.lines).forEach(([k, v]) => { if (typeof v === 'string') one(v, 'n', `GAMES.${id}.lines.${k}`); else if (Array.isArray(v)) choices(v, `GAMES.${id}.lines.${k}`); }); });
sub('The Grey Order and the statues');
Object.entries(D.ORDER.lines).forEach(([k, v]) => one(v, 'n', `ORDER.lines.${k}`));
['blurb', 'quote', 'start', 'built', 'flavor', 'inspect'].forEach(k => one(D.STATUE[k], 'n', `STATUE.${k}`));
sub('Engine lines (in js/game.js)');
[["Yes, I'll do it.", 'PLAYER ANSWER'], ['Not right now.', 'PLAYER ANSWER'], ['Come back when you have time.', 'ANYONE'], ['Right you are.', 'EXPERT'],
  ['Ask about: {topic}', 'PLAYER ANSWER'], ["Why aren't you working yet?", 'PLAYER ANSWER'], ['Tell me about your craft.', 'PLAYER ANSWER'], ['Never mind.', 'PLAYER ANSWER'],
  ['What do you want to talk about?', 'PROMPT'], ['What do you say?', 'PROMPT'], ['Name-calling is not an answer.', 'CARD'],
  ['Say why the argument is wrong instead. Insults give the other person a reason to stop listening.', 'CARD']].forEach(([s, w]) => P(`[game.js "${s}"] (${w}) ${s}`));
sub('Trick cards (shown after every argument)');
D.FALLACIES.forEach(f => { P(`[FALLACIES#${f.id}.nick] (CARD TITLE) ${f.nick}`); P(`[FALLACIES#${f.id}.one] (CARD: the trick) ${f.one}`); P(`[FALLACIES#${f.id}.spot] (CARD: how to spot it) ${f.spot}`); });

const text = out.join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'dialogue.txt'), text);
const count = out.filter(l => l.startsWith('[')).length;
console.log(`${count} lines, ${text.length} characters -> dialogue.txt`);
