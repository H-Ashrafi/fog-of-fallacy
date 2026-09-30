#!/usr/bin/env node
/* Puts an edited copy of dialogue.txt back into the game. Each [key] line of the edited file is
   matched to the same key in the current dialogue.txt (run tools/dump-dialogue.js first); where the
   text changed, the exact old string literal is found in the story files and replaced with filewriter
   (a literal replace, keeping the same quote style).
   Usage:  node tools/apply-dialogue.js <edited.txt> [--dry]
   Plain Node, no packages. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const FW = 'C:/Users/Ashra/source/repos/filewriter-rust/target/release/filewriter.exe';
const FILES = ['js/data.js', 'js/data-order.js', 'js/data-story.js', 'js/data-games.js', 'js/game.js'];
const [edited] = process.argv.slice(2).filter(a => !a.startsWith('--')), DRY = process.argv.includes('--dry');
if (!edited) { console.error('Usage: node tools/apply-dialogue.js <edited.txt> [--dry]'); process.exit(1); }

/* "[key] SPEAKER: text" or "[key] (label) text" -> { key, text } */
function parse(file) {
  const map = new Map();
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(l => {
    if (!l.startsWith('[')) return;
    const k = l.indexOf('] ');
    if (k < 0) return;
    const key = l.slice(0, k + 1), rest = l.slice(k + 2);
    const cut = rest.startsWith('(') ? rest.indexOf(') ') + 2 : rest.indexOf(': ') + 2;
    map.set(key, cut > 1 ? rest.slice(cut) : rest);
  });
  return map;
}
const before = parse(path.join(ROOT, 'dialogue.txt')), after = parse(edited);

/* old text -> new text; the same old text used in two places must get the same new text */
const changes = new Map(), clash = [];
for (const [key, oldText] of before) {
  const neu = after.get(key);
  if (neu === undefined) { console.log('missing in edited file: ' + key); continue; }
  if (neu === oldText) continue;
  if (changes.has(oldText) && changes.get(oldText) !== neu) { clash.push(key); continue; }
  changes.set(oldText, neu);
}

const src = Object.fromEntries(FILES.map(f => [f, fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : '']));
const lit = (s, q) => q + s.replace(/\\/g, '\\\\').split(q).join('\\' + q) + q;
let done = 0, notFound = [];
for (const [oldText, neu] of changes) {
  let hit = false;
  for (const q of ["'", '"', '`']) {
    const o = lit(oldText, q);
    for (const f of FILES) {
      const n = src[f].split(o).length - 1;
      if (!n) continue;
      hit = true;
      const args = ['replace', '-file', path.join(ROOT, f), '-old', Buffer.from(o).toString('base64'), '-new', Buffer.from(lit(neu, q)).toString('base64')].concat(n > 1 ? ['-all'] : []);
      if (!DRY) cp.execFileSync(FW, args, { stdio: 'pipe' });
      src[f] = src[f].split(o).join(lit(neu, q));
      done++;
    }
  }
  if (!hit) notFound.push(oldText);
}
console.log(`${changes.size} changed lines, ${done} replacements${DRY ? ' (dry run)' : ''}`);
if (clash.length) console.log('Same old text, different new text (not applied): ' + clash.join(' '));
if (notFound.length) { console.log('Not found in the source (' + notFound.length + '):'); notFound.forEach(t => console.log('  ' + t)); }
