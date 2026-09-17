#!/usr/bin/env node
/* Checks a language file against i18n/en.json.
   Usage:  node tools/i18n-check.js fa [--verbose]
   Reports: missing keys, keys that are not in the game, {placeholder} mismatches, values
   that still look English, translated option sets where the right answer is the longest
   (that is a tell; the writing rule is that it never is), and empty translations.
   Exit code 1 when anything is wrong. Plain Node, no packages. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const code = process.argv[2];
const verbose = process.argv.includes('--verbose');
if (!code) { console.error('Usage: node tools/i18n-check.js <lang>'); process.exit(2); }

global.window = {};
global.document = { documentElement: {}, readyState: 'complete', querySelectorAll: () => [], title: '', addEventListener() { } };
global.location = { search: '', href: 'http://localhost/' };
global.localStorage = { getItem: () => null, setItem() { } };
require(path.join(ROOT, 'js', 'lang', code + '.js'));
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'data-order.js'));
const D = window.FOG;
const dict = (window.FOG_LANG || {})[code] || {};
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'en.json'), 'utf8'));

let problems = 0;
const report = (title, items) => { if (!items.length) return; problems += items.length; console.log(`\n${title} (${items.length})`); items.slice(0, verbose ? items.length : 25).forEach(x => console.log('  ' + x)); if (!verbose && items.length > 25) console.log(`  ... ${items.length - 25} more (use --verbose)`); };

const missing = en.filter(k => !(k in dict));
const extra = Object.keys(dict).filter(k => !en.includes(k));
const empty = Object.keys(dict).filter(k => typeof dict[k] !== 'string' || !dict[k].trim());
const ph = k => (k.match(/\{\w+\}/g) || []).sort().join(' ');
const badPh = Object.keys(dict).filter(k => typeof dict[k] === 'string' && ph(k) !== ph(dict[k])).map(k => `${JSON.stringify(k)} -> ${JSON.stringify(dict[k])}`);
const latin = Object.keys(dict).filter(k => typeof dict[k] === 'string' && /[A-Za-z]{4,}/.test(dict[k].replace(/\{\w+\}/g, '')) && !/^[A-Z]{2,}$/.test(k)).map(k => `${JSON.stringify(k)} -> ${JSON.stringify(dict[k])}`);
const diacritics = Object.keys(dict).filter(k => typeof dict[k] === 'string' && /[ً-ْٰ]/.test(dict[k])).map(k => `${JSON.stringify(dict[k])}`);

/* right-answer-is-longest audit on the translated option sets */
const sets = [];
D.NPCS.forEach(n => { if (n.expert) n.expert.fog.forEach((f, i) => sets.push([n.id + ' fog ' + i, f.options, o => !!o.right])); });
Object.entries(D.HARD).forEach(([id, fogs]) => fogs.forEach((f, i) => sets.push([id + ' hard ' + i, f.options, o => !!o.right])));
Object.entries(D.REFUSE).forEach(([id, r]) => sets.push([id + ' refuse', r.options, o => !!o.right]));
Object.entries(D.TRICKS).forEach(([id, tr]) => { sets.push([id, tr.options, o => /^right/.test(o.key)]); tr.stage2 && tr.stage2.forEach(s => { if (s.choice) sets.push([id + ' stage2', s.choice, o => /^right/.test(o.key)]); }); });
const longest = [];
sets.forEach(([label, opts, isRight]) => {
  const tr = opts.map(o => (dict[o.text] || o.text));
  const r = opts.findIndex(isRight); if (r < 0) return;
  const max = Math.max(...tr.map(s => s.length));
  if (tr[r].length === max) longest.push(`${label}: ${tr[r]}`);
});

report('Missing (English keys with no translation)', missing);
report('Not in the game (keys that no longer exist)', extra);
report('Empty translations', empty);
report('Placeholder mismatch', badPh);
report('Still English?', latin);
report('Vowel marks found (the game shows text without them)', diacritics);
report('Right answer is the longest option', longest);
console.log(`\n${code}: ${Object.keys(dict).length} entries, ${en.length} needed, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
