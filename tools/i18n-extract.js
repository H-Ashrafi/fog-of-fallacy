#!/usr/bin/env node
/* Lists every English string the game can show, for translators and for tools/i18n-check.js.
   Sources: text fields in js/data.js, js/data-order.js and js/world.js (via I18N.collect),
   T('...') calls in js/game.js, and data-i18n attributes in index.html.
   Usage:  node tools/i18n-extract.js        -> writes i18n/en.json (unique, in order of appearance)
   Plain Node, no packages. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
global.document = { documentElement: {}, readyState: 'complete', querySelectorAll: () => [], title: '', addEventListener() { } };
global.location = { search: '', href: 'http://localhost/' };
global.localStorage = { getItem: () => null, setItem() { } };
require(path.join(ROOT, 'js', 'i18n.js'));
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'data-order.js'));
require(path.join(ROOT, 'js', 'data-story.js'));
require(path.join(ROOT, 'js', 'data-games.js'));
require(path.join(ROOT, 'js', 'world.js'));

const seen = new Set(), out = [];
const add = s => { if (typeof s === 'string' && s.trim() && !seen.has(s)) { seen.add(s); out.push(s); } };

window.I18N.collect(window.FOG, window.World).forEach(add);

const re = /\bT\((['"])((?:\\.|(?!\1).)*)\1/g;
let m;
['game.js', 'scenes.js'].forEach(f => { const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'); re.lastIndex = 0; while ((m = re.exec(src))) add(m[2].replace(/\\(['"\\])/g, '$1')); });

// canvas labels: tl('...') literals in world.js, plus the "<KIND> SITE" labels built from the mission kinds
const world = fs.readFileSync(path.join(ROOT, 'js', 'world.js'), 'utf8');
const rt = /\btl\((['"])((?:\\.|(?!\1).)*)\1\)/g;
while ((m = rt.exec(world))) add(m[2].replace(/\\(['"\\])/g, '$1'));
window.FOG.MISSIONS.forEach(mi => add(mi.kind.toUpperCase() + ' SITE'));

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ra = /data-i18n(?:-placeholder|-aria)?="([^"]*)"/g;
while ((m = ra.exec(html))) add(m[1]);
add('Fog of Fallacy');

fs.mkdirSync(path.join(ROOT, 'i18n'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'i18n', 'en.json'), JSON.stringify(out, null, 1) + '\n');
const chars = out.reduce((s, x) => s + x.length, 0);
console.log(`${out.length} strings, ${chars} characters -> i18n/en.json`);
