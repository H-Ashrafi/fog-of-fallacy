/* Fog of Fallacy - languages.
   English is the source of truth in js/data.js, js/data-order.js, js/world.js and the
   T('...') strings in js/game.js. A language file (js/lang/<code>.js) maps every English
   string to its translation. At start-up the game data is walked once and every text
   field is swapped; UI strings go through I18N.t() at the moment they are shown.

   Names are local to each language (Farmer Idris is Farmer Rasool in Persian), so a
   translated sentence carries the local name naturally: translators translate whole
   sentences, never single words.

   Pick a language with ?lang=fa, or from the title screen (stored in localStorage).
   Persian and Arabic are shown without vowel marks and use right-to-left layout. */

window.I18N = (function () {
  const LANGS = {
    en: { name: 'English', rtl: false, canvasFont: '"Baloo 2", system-ui, sans-serif' },
    fa: { name: 'فارسی', rtl: true, canvasFont: '"Baloo Bhaijaan 2", Vazirmatn, system-ui, sans-serif' },
    ar: { name: 'العربية', rtl: true, canvasFont: '"Baloo Bhaijaan 2", Vazirmatn, system-ui, sans-serif' }
  };
  const KEY = 'fog-lang';
  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const stored = localStorage.getItem(KEY);
    lang = LANGS[q] ? q : LANGS[stored] ? stored : 'en';
    if (q && LANGS[q]) localStorage.setItem(KEY, q);
  } catch (e) { lang = 'en'; }
  const cfg = LANGS[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = cfg.rtl ? 'rtl' : 'ltr';

  const missing = new Set();
  const dict = () => (window.FOG_LANG && window.FOG_LANG[lang]) || {};

  /* Translate one string. `vars` fills {placeholders} after translation. */
  function t(key, vars) {
    if (typeof key !== 'string') return key;
    let s = dict()[key];
    if (s === undefined) { s = key; if (lang !== 'en' && key.trim()) missing.add(key); }
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, n) => (n in vars ? vars[n] : m));
    return s;
  }

  /* Object keys whose string values are text shown to the player. Everything else
     (ids, colours, image paths, animation names) is left alone. */
  const TEXT_KEYS = new Set(['name', 'nick', 'one', 'spot', 'intro', 'done', 'start', 'lift', 'blurb', 'title', 'offer', 'accept', 'active', 'deliver', 'found', 'reward', 'steps', 'thanks',
    'talk', 'after', 'topic', 'text', 'right', 'wrong', 'ok', 'oops', 'stage2', 'ok2', 'right2', 'crew', 'quote', 'needs', 'built', 'flavor', 'inspect', 'out', 'silent', 'protectedStop', 'refogged', 'refuses',
    'cooldown', 'handsFull', 'crewLearned', 'building', 'notNeeded', 'lowLevel', 'missing', 'coins', 'ready', 'prompt', 'label',
    'say', 'goal', 'praise', 'ending', 'convinced', 'sit']);
  /* Containers where every string value is text, whatever its key. */
  const ALL_STRINGS = new Set(['FLAVOR', 'LINES', 'lines', 'why', 'events']);

  function walk(node, allStrings, fn) {
    /* Strings directly in a text array are text; objects inside it (step objects like {who, text, anim}) are walked by key. */
    if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) node[i] = typeof node[i] === 'string' ? (allStrings ? fn(node[i]) : node[i]) : walk(node[i], Array.isArray(node[i]) && allStrings, fn); return node; }
    if (node && typeof node === 'object') {
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (typeof v === 'string') { if (allStrings || TEXT_KEYS.has(k)) node[k] = fn(v); }
        else if (v && typeof v === 'object') walk(v, allStrings || ALL_STRINGS.has(k) || (TEXT_KEYS.has(k) && Array.isArray(v)), fn);
      }
    }
    return node;
  }
  const DATA_KEYS = ['FALLACIES', 'ROLES', 'LEVELS', 'MISSIONS', 'TASKS', 'JOBS', 'LINES', 'FLAVOR', 'NPCS', 'TRICKS', 'ORDER', 'STATUE', 'HARD', 'REFUSE', 'SIMURGH', 'CITY', 'GAMES'];
  function walkAll(D, Wd, fn) {
    DATA_KEYS.forEach(k => { if (D[k]) walk(D[k], ALL_STRINGS.has(k), fn); });
    if (Wd) { Wd.regions.forEach(r => { r.name = fn(r.name); }); Wd.structures.forEach(s => { s.label = fn(s.label); }); Wd.decor.forEach(d => { if (d.text) d.text = fn(d.text); }); }
  }
  /* Every text string in the data, in order of appearance (used by tools/i18n-extract.js). */
  function collect(D, Wd) { const out = []; walkAll(D, Wd, s => { out.push(s); return s; }); return out; }

  /* Swap every text field in the story data and the map for its translation. Runs once. */
  let applied = false;
  function apply(D, Wd) {
    if (applied || lang === 'en') { applied = true; return; }
    applied = true;
    walkAll(D, null, s => t(s));
    if (Wd) Wd.regions.forEach(r => { r.name = t(r.name); });   // structure labels and sign text are translated when drawn (tl in world.js)
  }

  /* Static page text: elements with data-i18n (text), data-i18n-placeholder, data-i18n-aria. */
  function applyDom() {
    if (lang === 'en') return;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.title = t(document.title);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyDom); else applyDom();

  function set(code) {
    if (!LANGS[code]) return;
    try { localStorage.setItem(KEY, code); } catch (e) { }
    const url = new URL(location.href); url.searchParams.delete('lang'); location.href = url.toString();
  }

  return { lang, langs: LANGS, rtl: cfg.rtl, canvasFont: cfg.canvasFont, t, apply, collect, set, missing: () => [...missing] };
})();
