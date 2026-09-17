#!/usr/bin/env node
/* Bumps the ?v= asset version in index.html so returning players load new css/js
   instead of the copies their browser cached. Run it before every deploy.
   Usage:  node tools/bump-version.js [value]     (default: current version + 1)
   Plain Node, no packages. */
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

const found = [...html.matchAll(/(?:href|src)="(?:css|js)\/[^"]*?\?v=([^"]*)"/g)].map(m => m[1]);
if (!found.length) { console.error('No ?v= asset links found in index.html.'); process.exit(1); }

const current = found[0];
const next = process.argv[2] || (/^\d+$/.test(current) ? String(Number(current) + 1) : new Date().toISOString().slice(0, 10));
const out = html.replace(/((?:href|src)="(?:css|js)\/[^"]*?\?v=)[^"]*"/g, `$1${next}"`);
fs.writeFileSync(file, out);
console.log(`asset version ${current} -> ${next} (${found.length} links)`);
