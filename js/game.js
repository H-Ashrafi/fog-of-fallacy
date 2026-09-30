/* Fog of Fallacy - engine: movement, camera, talking, tricks, tasks, jobs, experts, missions,
   the Grey Order's preachers, statues of Aristotle, the Simurgh's lessons, true allies,
   the Grey City and the throne, languages, saving. */

(function () {
  'use strict';

  const D = window.FOG, Wd = window.World, A = window.Audio2, TS = Wd.TS, I = window.I18N, Sc = window.Scenes;
  /* UI strings go through T(key, vars); the English key is looked up in js/lang/<code>.js. */
  const T = (k, v) => I ? I.t(k, v) : (v ? k.replace(/\{(\w+)\}/g, (m, n) => (n in v ? v[n] : m)) : k);
  if (I) I.apply(D, Wd);
  const KEY = 'fog-of-fallacy-v4';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FONT = (I && I.canvasFont) || '"Baloo 2", system-ui, sans-serif';

  /* ================= state ================= */
  const START = D.LEVELS[0].start;
  const DEFAULT = () => ({
    name: '', look: 0, money: D.START_MONEY, x: START.x, y: START.y, unlocked: 1, seen: {},
    spotted: {}, fails: {}, tricks: {}, tasks: {}, jobs: {}, experts: {}, missions: {}, flags: {},
    sound: true, voice: true, savedAt: 0, ended: false, stats: { earned: 0, lost: 0 }, npcPos: {}, carry: null,
    preachers: [], refog: {}, refuse: {}, statues: {}, lastPreach: 0, orderSince: 0, orderStats: { fogged: 0, cleared: 0 },
    lesson: null, simSeen: {}, zoom: false, errands: {}, allyShares: {}, allyLog: [], lastErrand: 0, city: {}, throne: false, games: {}
  });
  /* Older saves: the lighthouse used to end the game, now it opens the Grey City. Saves from before
     the Simurgh start her lessons at the level they reached. */
  function migrate(s) {
    if (s.ended && !s.throne && (s.missions.lighthouse || {}).status === 'built') { s.ended = false; s.unlocked = Math.max(s.unlocked, 6); }
    if (!s.lesson) s.lesson = { level: Math.min(s.unlocked, D.LEVELS.length) - 1, step: 0, intro: false };
    return s;
  }
  let S = load();
  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return migrate(Object.assign(DEFAULT(), JSON.parse(r))); } catch (e) { }
    return migrate(DEFAULT());
  }
  let saveTimer = null;
  function save() {
    S.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushSave, 1500);
  }
  /* Save-file name: ascii letters and digits, or a short hash when the name is in another script (the server only takes [a-z0-9-]). */
  const slug = () => {
    const name = S.name || 'player', ascii = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (ascii) return ascii;
    let h = 2166136261; for (const ch of name) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return 'p' + h.toString(36);
  };
  async function pushSave() {
    if (!S.name) return;
    try { await fetch('/api/saves/' + encodeURIComponent(slug()), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(S) }); } catch (e) { }
  }
  async function pullSave() {
    try {
      const r = await fetch('/api/saves/' + encodeURIComponent(slug()), { cache: 'no-store' });
      if (r.status !== 200) return false;
      const remote = await r.json();
      if (remote && remote.savedAt > (S.savedAt || 0)) { S = migrate(Object.assign(DEFAULT(), remote)); return true; }
    } catch (e) { }
    return false;
  }

  /* ================= helpers ================= */
  const fallacy = id => D.FALLACIES.find(f => f.id === id);
  const npcs = D.NPCS.map(n => Object.assign({ fx: n.x, fy: n.y, walk: 0, path: null, home: { x: n.x, y: n.y, dir: n.dir } }, n));
  const npcById = id => npcs.find(n => n.id === id);
  const npcAt = (x, y) => npcs.find(n => n.region < S.unlocked && ((n.x === x && n.y === y) || (n.path && n.path.length && n.path[0][0] === x && n.path[0][1] === y)));
  function applyNpcPos() {
    npcs.forEach(n => {
      const p = (S.npcPos || {})[n.id];
      if (p) { n.x = p.x; n.y = p.y; n.dir = p.dir || n.dir; } else { n.x = n.home.x; n.y = n.home.y; n.dir = n.home.dir; }
      n.fx = n.x; n.fy = n.y; n.path = null; n.walk = 0;
    });
  }
  const mission = id => D.MISSIONS.find(m => m.id === id);
  const mstate = id => S.missions[id] || (S.missions[id] = { status: 'open' });
  const built = id => (S.missions[id] || {}).status === 'built';
  const currentLevel = () => D.LEVELS[Math.min(S.unlocked - 1, D.LEVELS.length - 1)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fill = t => String(t).replace(/\{name\}/g, S.name);
  const spottedCount = () => Object.keys(S.spotted).length;
  const allTasks = () => Object.keys(D.TASKS).map(id => Object.assign({ id }, D.TASKS[id]));
  const allJobs = () => Object.keys(D.JOBS).map(id => Object.assign({ id }, D.JOBS[id]));
  const nar = lines => (Array.isArray(lines) ? lines : [lines]).map(text => ({ who: 'n', text }));
  const regionName = i => Wd.regions[i] ? Wd.regions[i].name : T('The Valley');
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  /* A trick waits until its level is open: level 1 has no threats at all. */
  const trickLive = id => { const tr = D.TRICKS[id]; return !!tr && S.unlocked >= (tr.fromLevel || 1); };
  /* A true ally: in the crew with every fog cleared. Preachers cannot fog them, and they collect coins for you. */
  const isAlly = n => !!(n && n.expert && S.experts[n.id] && S.experts[n.id].crew && S.experts[n.id].cleared >= n.expert.fog.length && !S.refog[n.id]);
  const speakerName = who => who === 'you' ? S.name : who === 'simurgh' ? D.SIMURGH.name : (npcById(who) || {}).name || who;
  const mySpec = () => S.throne ? Object.assign({}, D.LOOKS[S.look], { crown: true }) : D.LOOKS[S.look];

  function ex(id) {
    const n = npcById(id), base = n.expert;
    return S.experts[id] || (S.experts[id] = { cleared: 0, crew: false, xp: D.XP_LEVELS[base.level - 1] });
  }
  const levelOf = xp => { let l = 1; D.XP_LEVELS.forEach((need, i) => { if (xp >= need) l = i + 1; }); return l; };
  const exLevel = id => levelOf(ex(id).xp);
  const xpMult = id => (1 + 0.5 * ex(id).cleared) * (built('school') ? 1.5 : 1);
  const crew = () => npcs.filter(n => n.expert && S.experts[n.id] && S.experts[n.id].crew);
  const stars = l => '★'.repeat(l) + '☆'.repeat(5 - l);
  const roleName = r => D.ROLES[r].name;

  function worldState() {
    const b = {}; D.MISSIONS.forEach(m => { if (built(m.id)) b[m.id] = true; });
    const st = {}; Object.keys(S.statues).forEach(i => { if (S.statues[i].status === 'built') st[i] = true; });
    return { flags: S.flags, unlocked: S.unlocked, built: b, statues: st, throne: !!S.throne };
  }
  function syncWorld() { Wd.setState(worldState()); }

  /* what follows the player: a found goat or canary until it is handed back */
  const follower = () => { const t = allTasks().find(t => t.follow && S.tasks[t.id] === 'found'); return t ? t.follow : null; };
  const petName = kind => kind === 'goat' ? T('Pickle') : T('Goldie');

  /* ================= money & toasts ================= */
  function changeMoney(d, quiet) {
    if (!d) return;
    const before = S.money;
    S.money = Math.max(0, S.money + d);
    const real = S.money - before;
    if (real > 0) S.stats.earned += real; else S.stats.lost -= real;
    save(); updateHud();
    if (!quiet) toast((real > 0 ? '+' : '') + real + ' 🪙', real > 0 ? 'good' : 'bad');
  }
  function toast(text, kind, ms) {
    const box = $('toasts'), el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.textContent = text;
    box.appendChild(el);
    const hold = ms || 1600;
    setTimeout(() => el.classList.add('out'), hold); setTimeout(() => el.remove(), hold + 500);
  }

  /* ================= title ================= */
  let mode = 'title';   // title | world | dialog | panel | action | modal | end
  function renderTitle() {
    mode = 'title'; A.stop();
    document.body.classList.remove('playing');
    $('title').hidden = false; $('play').hidden = true; $('end').hidden = true; $('panel').hidden = true;
    const looks = $('looks'); looks.innerHTML = '';
    D.LOOKS.forEach((spec, i) => {
      const b = document.createElement('button'); b.className = 'look' + (i === S.look ? ' on' : ''); b.type = 'button'; b.setAttribute('aria-label', T('Look {n}', { n: i + 1 }));
      const c = document.createElement('canvas'); c.width = 64; c.height = 64; b.appendChild(c);
      Wd.drawPerson(c.getContext('2d'), 32, 58, spec, 'down', 0, 1.9);
      b.addEventListener('click', () => { S.look = i; looks.querySelectorAll('.look').forEach(x => x.classList.remove('on')); b.classList.add('on'); A.play('talk'); });
      looks.appendChild(b);
    });
    const langs = $('langs');
    if (langs && I) {
      langs.innerHTML = '';
      Object.keys(I.langs).forEach(code => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'langbtn' + (code === I.lang ? ' on' : ''); b.textContent = I.langs[code].name; b.lang = code;
        b.addEventListener('click', () => { if (code !== I.lang) I.set(code); });
        langs.appendChild(b);
      });
    }
    $('name-input').value = S.name || '';
    const started = !!S.name;
    $('start').textContent = started ? T('Keep playing') : T('Start');
    $('reset').hidden = !started;
  }

  async function startGame() {
    A.unlock();
    S.name = ($('name-input').value.trim() || T('You')).slice(0, 16);
    $('start').disabled = true;
    await pullSave();
    $('start').disabled = false;
    S.name = S.name || T('You');
    save();
    A.settings.sfx = S.sound; A.settings.voice = S.voice && voiceAvailable();
    player.x = player.fx = player.tx = S.x; player.y = player.fy = player.ty = S.y; player.moving = false; trail.length = 0;
    syncWorld(); applyNpcPos(); placeCrew(false); restorePreachers();
    $('title').hidden = true; $('play').hidden = false;
    document.body.classList.add('playing'); resizeCanvas(); camNow = null;
    mode = 'world';
    updateHud(); updateAlert();
    checkRegionIntro();
  }
  /* Recorded voices exist for English only; other languages are text for now. */
  const voiceAvailable = () => !I || I.lang === 'en';

  function updateHud() {
    $('hud-money').textContent = S.money;
    $('hud-insight').textContent = spottedCount() + ' / ' + D.FALLACIES.length;
    $('hud-sound').textContent = S.sound ? '🔔' : '🔕';
    $('hud-voice').textContent = S.voice ? '🗣️' : '🤐';
    $('hud-voice').hidden = !voiceAvailable();
    $('hud-zoom').classList.toggle('on', !!S.zoom);
    const r = Wd.regionAt(player.x, player.y);
    $('hud-region').textContent = r >= 0 ? regionName(r) : T('The Valley');
    $('objective').textContent = objectiveText();
    updateTracker();
  }
  function objectiveText() {
    const lv = currentLevel();
    if (S.ended) return T('You rule the Valley now. Keep exploring, or start again from the title.');
    if (!lv.mission) return T('The Grey City: convince one person, and the monster falls.');
    const m = mission(lv.mission), ms = S.missions[m.id] || {};
    if (ms.status === 'building') return T('Building {name}…', { name: m.name });
    const need = totalCost(m);
    const roles = m.needs.map(n => { const who = assign(m)[m.needs.indexOf(n)]; return D.ROLES[n.role].icon + (who ? '✓' : '✗'); }).join(' ');
    return `${m.name}: ${S.money}/${need} 🪙 · ${roles}`;
  }

  /* ---- the small-task tracker: a pulsing bulb with the next step ---- */
  function trackerInfo() {
    if (S.carry && S.carry.kind === 'job') { const j = D.JOBS[S.carry.id]; return { title: j.title, step: j.steps[1] }; }
    if (S.carry && S.carry.kind === 'task') { const t = D.TASKS[S.carry.id]; const st = S.tasks[S.carry.id]; return { title: t.title, step: st === 'found' ? T('Take it back to {name} for {n} coins.', { name: npcById(t.giver).name, n: t.pay }) : t.active[0] }; }
    const f = allTasks().find(t => t.follow && S.tasks[t.id] === 'found');
    if (f) return { title: f.title, step: T('Lead {pet} back to {name} for {n} coins.', { pet: petName(f.follow), name: npcById(f.giver).name, n: f.pay }) };
    const t = allTasks().find(t => (S.tasks[t.id] === 'active' || S.tasks[t.id] === 'found') && npcById(t.giver).region < S.unlocked);
    if (t) return { title: t.title, step: S.tasks[t.id] === 'found' ? T('Go back to {name} for {n} coins.', { name: npcById(t.giver).name, n: t.pay }) : t.active[0] };
    const goal = lessonGoal();
    if (goal) return { title: T('🪶 The Simurgh says'), step: fill(goal) };
    return null;
  }
  function updateTracker() {
    const info = trackerInfo(), el = $('tracker');
    if (!info) { el.hidden = true; return; }
    el.hidden = false; $('tracker-title').textContent = info.title; $('tracker-step').textContent = info.step;
  }

  /* ---- the red warning about preachers on the move ---- */
  function updateAlert() {
    const el = $('alert'); if (!el) return;
    const live = preachers.filter(p => p.phase !== 'gone');
    if (!live.length) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = '⚠ ' + live.map(p => { const n = p.target ? npcById(p.target) : null; return n ? T('Preacher in {region}, heading for {name}', { region: regionName(p.region), name: n.name }) : T('Preacher in {region}', { region: regionName(p.region) }); }).join(' · ');
  }

  /* ================= movement ================= */
  const player = { x: S.x, y: S.y, dir: 'down', moving: false, t: 0, fx: S.x, fy: S.y, tx: S.x, ty: S.y, walk: 0 };
  const trail = [];   // recent tiles, for the goat that trots behind
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  let held = null, lastTime = 0, stepTick = 0;

  function tryMove(dir) {
    if (player.moving) return;
    player.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = player.x + dx, ny = player.y + dy;
    if (!Wd.walkable(nx, ny) || npcAt(nx, ny) || preacherAt(nx, ny)) return;
    trail.unshift([player.x, player.y]); if (trail.length > 3) trail.pop();
    player.moving = true; player.t = 0; player.tx = nx; player.ty = ny;
    hidePreview();
  }

  function update(dt, t) {
    tickMissions(t); tickStatues(); moveNpcs(dt); tickPreachers(dt); tickAction(t); tickAllies(t); tickLesson(t);
    if (mode !== 'world') return;
    if (player.moving) {
      player.t += dt / 140;
      if (player.t >= 1) {
        player.x = player.tx; player.y = player.ty; player.moving = false; player.t = 0;
        player.fx = player.x; player.fy = player.y; player.walk = 0;
        S.x = player.x; S.y = player.y; save();
        if (++stepTick % 2 === 0) A.play('step');
        updateHud();
        if (!checkRegionIntro() && held) tryMove(held);
      } else {
        player.fx = player.x + (player.tx - player.x) * player.t;
        player.fy = player.y + (player.ty - player.y) * player.t;
        player.walk = player.t;
      }
    } else if (held) tryMove(held);
  }

  function checkRegionIntro() {
    const r = Wd.regionAt(player.x, player.y);
    if (r < 0 || S.seen[r]) return false;
    S.seen[r] = true; save();
    runSteps(nar(D.LEVELS[r].intro), null);
    return true;
  }

  function front() { const [dx, dy] = DIRS[player.dir]; return [player.x + dx, player.y + dy]; }

  function interact() {
    if (mode !== 'world' || player.moving) return;
    hidePreview();
    const [fx, fy] = front();
    const p = preacherAt(fx, fy);
    if (p) { runSteps(nar(D.ORDER.lines.silent), null); return; }
    const n = npcAt(fx, fy);
    if (n) { n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir]; talkTo(n); return; }
    const site = Wd.siteAt(fx, fy);
    if (site) { openMission(site); return; }
    const d = Wd.decorAt(fx, fy);
    if (d) { useDecor(d); return; }
  }

  /* ================= player actions (chores with real animations) ================= */
  let action = null;   // { kind, t0, dur, cb }
  function startAction(kind, dur, cb) {
    action = { kind, t0: performance.now(), dur, cb, lastSfx: 0 };
    mode = 'action';
  }
  const ACTION_SFX = { hammer: 'hammer', forge: 'hammer', dig: 'work', sweep: 'work', pick: 'work', sort: 'coin', milk: 'goat', coil: 'work', lift: 'work', light: 'good', call: 'bird' };
  function tickAction(t) {
    if (!action) return;
    const p = (t - action.t0) / action.dur;
    const every = { hammer: 380, forge: 380, dig: 480, sweep: 600, pick: 520, sort: 420, milk: 700, coil: 700, lift: 900, light: 1200, call: 900 }[action.kind] || 600;
    if (t - action.lastSfx > every && p < 0.9) { action.lastSfx = t; A.play(action.kind === 'call' && follower() === 'goat' ? 'goat' : ACTION_SFX[action.kind] || 'work'); }
    if (p >= 1) { const cb = action.cb; action = null; mode = 'world'; cb(); }
  }

  /* ================= camera =================
     The camera frames the whole level the player stands in, with one tile of margin, and glides
     to the next level when she walks into it. Zoom (🔍 or Z) follows the player up close instead.
     cam: top-left (x, y) and size (w, h) of the view in world pixels; z is canvas pixels per world pixel. */
  const stageEl = document.querySelector('.stage');
  let dpr = 1, cam = { x: 0, y: 0, w: 1, h: 1, z: 1 }, camNow = null, lastRegion = 0;
  function resizeCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stageEl.getBoundingClientRect();
    canvas.width = Math.max(64, Math.round(r.width * dpr)); canvas.height = Math.max(64, Math.round(r.height * dpr));
  }
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(stageEl); else window.addEventListener('resize', resizeCanvas);
  const mid = (v, lo, hi) => lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v));
  function aimCamera(dt) {
    const r = Wd.regionAt(player.x, player.y); if (r >= 0) lastRegion = r;
    const R = Wd.regions[lastRegion];
    const x0 = (R.x0 - 1) * TS, y0 = (R.y0 - 1) * TS, rw = (R.x1 - R.x0 + 3) * TS, rh = (R.y1 - R.y0 + 3) * TS;
    const fit = Math.min(canvas.width / rw, canvas.height / rh);
    let z = fit, cx = x0 + rw / 2, cy = y0 + rh / 2;
    if (S.zoom) {
      z = Math.max(fit, dpr * 1.2);
      const zw = canvas.width / z / 2, zh = canvas.height / z / 2;
      cx = mid(player.fx * TS + TS / 2, x0 + zw, x0 + rw - zw); cy = mid(player.fy * TS + TS / 2, y0 + zh, y0 + rh - zh);
    }
    const hw = canvas.width / z / 2, hh = canvas.height / z / 2;   // never show the void past the map edge
    cx = mid(cx, hw, Wd.W * TS - hw); cy = mid(cy, hh, Wd.H * TS - hh);
    if (!camNow) camNow = { z, cx, cy };
    const k = Math.min(1, dt / 220);
    camNow.z += (z - camNow.z) * k; camNow.cx += (cx - camNow.cx) * k; camNow.cy += (cy - camNow.cy) * k;
    const w = canvas.width / camNow.z, h = canvas.height / camNow.z;
    cam = { x: camNow.cx - w / 2, y: camNow.cy - h / 2, w, h, z: camNow.z };
  }
  function toggleZoom() { S.zoom = !S.zoom; save(); updateHud(); A.play('open'); }

  /* ================= render ================= */
  let fogAnim = null;  // { region, t0 }
  let npcAnim = null;  // { id, kind } while an expert acts out a line
  let throneAnim = 0;  // when the monster's shadow started to fade
  function render(t, dt) {
    aimCamera(dt || 16);
    const camX = cam.x, camY = cam.y;
    /* Markers, arrows and labels keep a readable size on screen however far the camera zooms out. */
    const ui = Math.max(1, 0.9 * dpr / cam.z);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14262B'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(cam.z, 0, 0, cam.z, 0, 0);
    const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(Wd.W - 1, Math.floor((camX + cam.w) / TS)), y1 = Math.min(Wd.H - 1, Math.floor((camY + cam.h) / TS));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Wd.drawTile(ctx, Wd.at(x, y), x, y, x * TS - camX, y * TS - camY, t);
    const inView = (x, y, w, h) => x + w >= x0 - 1 && x <= x1 + 1 && y + h >= y0 - 1 && y <= y1 + 1;
    // statue circles sit on the ground, under everything that stands
    D.STATUE.sites.forEach((s, i) => {
      const st = S.statues[i]; if (!st || st.status !== 'built') return;
      const r = D.STATUE.radius;
      if (inView(s.x - r, s.y - r, r * 2 + 1, r * 2 + 1)) Wd.drawRing(ctx, s.x * TS - camX + TS / 2, s.y * TS - camY + TS / 2, r * TS, t);
    });
    Wd.structures.forEach(s => { if (inView(s.x, s.y, s.w, s.h)) Wd.drawStructure(ctx, s, camX, camY, t); });
    D.MISSIONS.forEach(m => {
      if (!inView(m.site.x, m.site.y, m.site.w, m.site.h)) return;
      const ms = S.missions[m.id] || {};
      if (m.region < S.unlocked && ms.status !== 'built' && ms.status !== 'building') Wd.drawGlow(ctx, m.site.x * TS - camX, m.site.y * TS - camY, m.site.w * TS, m.site.h * TS, t, hover && hover.id === m.id);
      if (!(built(m.id) && m.kind === 'bridge')) Wd.drawMission(ctx, m, camX, camY, ms, t);
    });
    Wd.decor.forEach(d => {
      if (!inView(d.x, d.y, 1, 1)) return;
      if (d.kind === 'plinth') { const st = S.statues[d.statue]; if (D.STATUE.sites[d.statue].region < S.unlocked && S.unlocked >= D.STATUE.fromLevel && !st) Wd.drawGlow(ctx, d.x * TS - camX, d.y * TS - camY, TS, TS, t, false); if (st && st.status === 'building') drawStatueProgress(d, st, camX, camY, t); }
      Wd.drawDecor(ctx, d, camX, camY, t);
    });

    const targeted = new Set(preachers.filter(p => p.phase !== 'gone' && p.target).map(p => p.target));
    const people = npcs.filter(n => n.region < S.unlocked && inView(Math.floor(n.fx), Math.floor(n.fy), 2, 2)).map(n => ({ x: n.fx, y: n.fy, spec: n.spec, dir: n.dir, walk: n.walk || 0, npc: n }));
    preachers.filter(p => p.phase !== 'gone' && inView(Math.floor(p.fx), Math.floor(p.fy), 2, 2)).forEach(p => people.push({ x: p.fx, y: p.fy, spec: p.spec, dir: p.dir, walk: p.walk || 0, preacher: p }));
    people.push({ x: player.fx, y: player.fy, spec: mySpec(), dir: player.dir, walk: player.walk, me: true });
    const fol = follower();
    if (fol === 'goat' && trail.length) people.push({ x: trail[0][0], y: trail[0][1], goat: true });
    people.sort((a, b) => a.y - b.y);
    people.forEach(p => {
      const px = p.x * TS - camX + TS / 2, py = p.y * TS - camY + TS - 2;
      if (p.goat) { Wd.drawFollower(ctx, 'goat', px, py, t, player.dir); return; }
      if (p.npc && targeted.has(p.npc.id)) { ctx.strokeStyle = 'rgba(228,87,79,' + (0.5 + 0.4 * Math.sin(t / 200)) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px, py + 1, 14, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
      Wd.drawPerson(ctx, px, py, p.spec, p.dir, p.walk, 1);
      if (p.me) {
        if (S.carry) Wd.drawItem(ctx, S.carry.item, px, py - 44, t);
        if (fol === 'canary') Wd.drawFollower(ctx, 'canary', px, py, t, player.dir);
        if (action) Wd.drawAction(ctx, action.kind, px, py, t, (t - action.t0) / action.dur, player.dir);
      }
      if (p.npc) {
        if (npcAnim && npcAnim.id === p.npc.id && mode === 'dialog') Wd.drawAction(ctx, npcAnim.kind, px, py, t, 0.5, p.npc.dir === 'left' ? 'left' : 'right');
        const sermon = preachers.find(q => q.phase === 'preach' && q.target === p.npc.id);
        if (sermon) Wd.drawSermon(ctx, px, py, t);
        drawMarker(p.npc, px, py, t, ui);
      }
      if (p.preacher) drawPreacherMarker(px, py, t, ui);
    });
    drawCityShadow(t, camX, camY, inView);
    drawBird(t, camX, camY, ui);
    drawOffscreenPreachers(camX, camY, t, ui);

    // fog over locked regions
    Wd.regions.forEach((r, i) => {
      const anim = fogAnim && fogAnim.region === i ? Math.min(1, (t - fogAnim.t0) / 2500) : null;
      if (i < S.unlocked && anim === null) return;
      if (!inView(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1)) return;
      drawFog(r, camX, camY, t, anim === null ? 1 : 1 - anim, ui);
    });
    if (fogAnim && t - fogAnim.t0 > 2600) fogAnim = null;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* While the monster lives, a grey haze hangs over the Grey City and its shadow sits on the palace. */
  function drawCityShadow(t, camX, camY, inView) {
    const r = Wd.regions[5];
    if (!r || S.unlocked <= 5) return;
    const a = S.throne ? (throneAnim ? Math.max(0, 1 - (t - throneAnim) / 3500) : 0) : 1;
    if (a <= 0 || !inView(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1)) return;
    ctx.fillStyle = 'rgba(96,94,104,' + (0.22 * a) + ')'; ctx.fillRect(r.x0 * TS - camX, r.y0 * TS - camY, (r.x1 - r.x0 + 1) * TS, (r.y1 - r.y0 + 1) * TS);
    Wd.drawMonster(ctx, D.CITY.palace.x * TS - camX, D.CITY.palace.y * TS - camY, t, a);
  }
  /* The Simurgh hovers beside the player while she talks: she bursts out of sparkles and flies off upwards. */
  function drawBird(t, camX, camY, ui) {
    if (!bird) return;
    const now = performance.now(), inP = Math.min(1, (now - bird.t0) / 500), outP = bird.out ? Math.min(1, (now - bird.out) / 900) : 0;
    if (outP >= 1) { bird = null; return; }
    const cx = bird.x * TS + TS / 2 - camX, cy = bird.y * TS - camY - outP * 90 + Math.sin(t / 400) * 4;
    ctx.save(); ctx.globalAlpha = 1 - outP;
    Wd.drawSimurgh(ctx, cx, cy, t, (0.35 + 0.65 * inP) * Math.min(ui, 1.8), bird.x > player.x ? 'left' : 'right');
    ctx.restore();
    if (inP < 1 || outP > 0) Wd.drawSparkles(ctx, cx, cy, inP < 1 ? inP : outP, t);
  }

  function drawMarker(n, px, py, t, ui) {
    const bob = Math.sin(t / 250) * 3;
    let mark = null, color = '#F6B544';
    if (n.city) { if (!S.throne && n.city.gauntlet) { mark = '?'; color = '#C9C4BA'; } }
    else if (S.refuse[n.id]) { mark = '✗'; color = '#E4574F'; }
    else if (n.expert && S.refog[n.id]) { mark = '?'; color = '#E4574F'; }
    else if (n.trick && trickLive(n.trick) && !S.tricks[n.trick] && (!n.talk || S.flags['talked:' + n.id])) { mark = '!'; color = '#FF7B6B'; }
    else if (n.expert && !ex(n.id).crew) { mark = '?'; color = '#5FB3D9'; }
    else if (n.expert && ex(n.id).cleared < n.expert.fog.length) { mark = '?'; color = '#BFEBD6'; }
    else if (deliverFor(n) || jobDeliverFor(n)) { mark = '📦'; color = '#63C48F'; }
    else if (nextTask(n)) { mark = S.tasks[nextTask(n).id] === 'found' ? '🪙' : '!'; color = S.tasks[nextTask(n).id] ? '#63C48F' : '#F6B544'; }
    else if (n.trick && trickLive(n.trick) && !S.tricks[n.trick]) { mark = '!'; color = '#F6B544'; }
    if (!mark) return;
    ctx.save(); ctx.translate(px, py - 36); ctx.scale(ui, ui);
    ctx.fillStyle = color; Wd.rr(ctx, -7, -16 + bob, 14, 17, 5); ctx.fill();
    ctx.fillStyle = '#2A2420'; ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(mark, 0, -3 + bob);
    ctx.restore();
  }
  function drawPreacherMarker(px, py, t, ui) {
    const bob = Math.sin(t / 250) * 3, pulse = 0.6 + 0.4 * Math.sin(t / 150);
    ctx.save(); ctx.translate(px, py - 38); ctx.scale(ui, ui);
    ctx.fillStyle = 'rgba(228,87,79,' + pulse + ')'; Wd.rr(ctx, -8, -18 + bob, 16, 19, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('!', 0, -3 + bob);
    ctx.restore();
  }
  /* A red arrow at the edge of the screen for every preacher that is out of view. */
  function drawOffscreenPreachers(camX, camY, t, ui) {
    const vw = cam.w, vh = cam.h, edge = 18 * ui;
    preachers.filter(p => p.phase !== 'gone').forEach(p => {
      const sx = p.fx * TS - camX + TS / 2, sy = p.fy * TS - camY + TS / 2;
      if (sx >= 0 && sx <= vw && sy >= 0 && sy <= vh) return;
      const cx = vw / 2, cy = vh / 2, dx = sx - cx, dy = sy - cy;
      const k = Math.min((vw / 2 - edge) / Math.abs(dx || 1e-6), (vh / 2 - edge) / Math.abs(dy || 1e-6));
      const ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.scale(ui, ui);
      ctx.fillStyle = 'rgba(228,87,79,' + (0.7 + 0.3 * Math.sin(t / 150)) + ')'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  }
  function drawStatueProgress(d, st, camX, camY, t) {
    const px = d.x * TS - camX, py = d.y * TS - camY, p = Math.min(1, (Date.now() - st.startedAt) / (D.STATUE.buildSec * 1000));
    ctx.fillStyle = '#2A2420'; Wd.rr(ctx, px + 2, py - 10, TS - 4, 6, 3); ctx.fill();
    ctx.fillStyle = '#63C48F'; Wd.rr(ctx, px + 2, py - 10, Math.max(6, (TS - 4) * p), 6, 3); ctx.fill();
  }

  function drawFog(r, camX, camY, t, alpha, ui) {
    const px = r.x0 * TS - camX, py = r.y0 * TS - camY, w = (r.x1 - r.x0 + 1) * TS, h = (r.y1 - r.y0 + 1) * TS;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(190,205,205,.82)'; ctx.fillRect(px - 16, py - 16, w + 32, h + 32);
    for (let i = 0; i < 9; i++) {
      const cx = px + ((i * 137 + t / 40) % (w + 80)) - 40, cy = py + ((i * 91 + t / 65) % (h + 80)) - 40;
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 110);
      g.addColorStop(0, 'rgba(235,242,242,.55)'); g.addColorStop(1, 'rgba(235,242,242,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 110, cy - 110, 220, 220);
    }
    ctx.fillStyle = 'rgba(20,38,43,.75)'; ctx.font = 'bold ' + Math.round(14 * (ui || 1)) + 'px ' + FONT; ctx.textAlign = 'center';
    const cx = Math.max(60, Math.min(cam.w - 60, px + w / 2)), cy = Math.max(20, Math.min(cam.h - 10, py + h / 2));
    if (px < cam.w && px + w > 0 && py < cam.h && py + h > 0) ctx.fillText(T('Fog of Fallacy'), cx, cy);
    ctx.restore();
  }

  /* ---- site preview: hover with a mouse, tap on touch ---- */
  let hover = null;   // mission under the pointer
  function siteAtPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width * cam.w + cam.x) / TS);
    const y = Math.floor(((e.clientY - rect.top) / rect.height * cam.h + cam.y) / TS);
    const m = D.MISSIONS.find(m => x >= m.site.x && x < m.site.x + m.site.w && y >= m.site.y && y < m.site.y + m.site.h);
    if (!m || m.region >= S.unlocked || built(m.id)) return null;
    return m;
  }
  function needsText(m) { return m.needs.map(n => (n.level > 1 ? stars(n.level) + ' ' : '') + T('a {role}', { role: roleName(n.role).toLowerCase() })).join(', '); }
  function showPreview(m) {
    hover = m;
    const box = $('preview'), stage = canvas.getBoundingClientRect();
    $('preview-img').src = 'img/preview-' + m.id + '.jpg'; $('preview-title').textContent = m.name;
    $('preview-text').textContent = T('Costs {n} coins. Needs {list}.', { n: m.cost, list: needsText(m) }) + ' ' + (m.income.rate ? T('Pays {n} coins a minute once built.', { n: m.income.rate }) : T('Lifts the fog from the whole Valley.'));
    box.hidden = false;
    const scale = stage.width / cam.w;
    const sx = (m.site.x * TS - cam.x) * scale, sy = (m.site.y * TS - cam.y) * scale, sw = m.site.w * TS * scale, sh = m.site.h * TS * scale;
    const bw = box.offsetWidth, bh = box.offsetHeight;
    let left = Math.max(6, Math.min(stage.width - bw - 6, sx + sw / 2 - bw / 2));
    let top = sy - bh - 10; if (top < 6) top = Math.min(stage.height - bh - 6, sy + sh + 10);
    box.style.left = left + 'px'; box.style.top = top + 'px';
  }
  function hidePreview() { hover = null; $('preview').hidden = true; }
  canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || mode !== 'world') return; const m = siteAtPointer(e); if (m) { if (!hover || hover.id !== m.id) showPreview(m); } else if (hover) hidePreview(); });
  canvas.addEventListener('pointerleave', () => { if (hover) hidePreview(); });
  canvas.addEventListener('pointerdown', e => { if (mode !== 'world') return; const m = siteAtPointer(e); if (m && !(hover && hover.id === m.id)) { showPreview(m); A.play('open'); clearTimeout(previewTimer); previewTimer = setTimeout(hidePreview, 5000); } else hidePreview(); });
  let previewTimer = null;

  /* ---- minimap ---- */
  const mini = $('minimap'), mctx = mini.getContext('2d');
  mini.width = Wd.W * 2; mini.height = Wd.H * 2;
  const MINI_COL = { G: '#82C773', T: '#2F7A44', F: '#A2703F', L: '#82C773', C: '#E2B93B', P: '#DCC79A', S: '#EBD9A8', K: '#C9BCA4', Q: '#A9A39A', W: '#5FB3D9', B: '#B08A5A', R: '#8E8A80', D: '#B08A5A', M: '#8B6A3E', A: '#A8A49B' };
  function renderMini() {
    for (let y = 0; y < Wd.H; y++) for (let x = 0; x < Wd.W; x++) { const c = Wd.at(x, y); mctx.fillStyle = (c === 'A' && S.throne ? MINI_COL.G : MINI_COL[c]) || '#000'; mctx.fillRect(x * 2, y * 2, 2, 2); }
    Wd.structures.forEach(s => { mctx.fillStyle = s.roof; mctx.fillRect(s.x * 2, s.y * 2, s.w * 2, s.h * 2); });
    D.STATUE.sites.forEach((s, i) => {
      const st = S.statues[i]; if (!st || st.status !== 'built') return;
      mctx.fillStyle = 'rgba(246,181,68,.22)'; mctx.beginPath(); mctx.arc(s.x * 2 + 1, s.y * 2 + 1, D.STATUE.radius * 2, 0, Math.PI * 2); mctx.fill();
      mctx.fillStyle = '#F6B544'; mctx.fillRect(s.x * 2 - 1, s.y * 2 - 1, 4, 4);
    });
    Wd.regions.forEach((r, i) => { if (i >= S.unlocked) { mctx.fillStyle = 'rgba(190,205,205,.9)'; mctx.fillRect(r.x0 * 2, r.y0 * 2, (r.x1 - r.x0 + 1) * 2, (r.y1 - r.y0 + 1) * 2); } });
    D.MISSIONS.forEach(m => { if (m.region < S.unlocked) { mctx.fillStyle = built(m.id) ? '#63C48F' : '#F6B544'; mctx.fillRect(m.site.x * 2 - 1, m.site.y * 2 - 1, m.site.w * 2 + 2, m.site.h * 2 + 2); } });
    const blink = Math.floor(Date.now() / 300) % 2 === 0;
    preachers.filter(p => p.phase !== 'gone').forEach(p => {
      const n = p.target ? npcById(p.target) : null;
      if (n) { mctx.strokeStyle = '#E4574F'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(n.x * 2 + 1, n.y * 2 + 1, 4, 0, Math.PI * 2); mctx.stroke(); }
      mctx.fillStyle = blink ? '#E4574F' : '#FF9A90'; mctx.beginPath(); mctx.arc(p.x * 2 + 1, p.y * 2 + 1, 3.5, 0, Math.PI * 2); mctx.fill();
      mctx.strokeStyle = '#2A2420'; mctx.lineWidth = 1; mctx.stroke();
    });
    mctx.fillStyle = '#FF7B6B'; mctx.beginPath(); mctx.arc(player.x * 2 + 1, player.y * 2 + 1, 3, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.stroke();
  }

  function loop(t) {
    const dt = Math.min(50, t - lastTime); lastTime = t;
    update(dt, t);
    if (mode !== 'title') { render(t, dt); if (mode === 'dialog') drawPortrait(t); if (mode === 'modal') drawModal(t); if (!$('minimap-box').hidden && Math.floor(t / 250) !== Math.floor((t - dt) / 250)) renderMini(); }
    requestAnimationFrame(loop);
  }

  /* ================= dialogue ================= */
  let script = null;    // { steps, i, ctx }
  let typing = null, typingFull = '';

  /* Strings become lines by `who`; objects with only text/anim get `who` filled in. */
  function normalize(steps, who) {
    return steps.map(s => typeof s === 'string' ? { who, text: s } : (s.who || s.choice || s.scene || s.end || s.fn ? s : Object.assign({ who }, s)));
  }

  function runSteps(steps, sctx) {
    A.stop(); hidePreview();
    script = { steps, i: -1, ctx: sctx };
    mode = 'dialog';
    $('dlg').hidden = false; $('scene').hidden = true;
    next();
  }

  function next() {
    if (!script) return;
    if (typing) { finishTyping(); return; }
    script.i++;
    const st = script.steps[script.i];
    npcAnim = null;
    if (!st) { endDialog(); return; }
    $('dlg-choices').innerHTML = ''; $('dlg-choices').hidden = true; $('dlg-next').hidden = false;
    if (st.money) changeMoney(st.money);
    if (st.sfx) A.play(st.sfx);
    if (st.game) { openGameStep(st); return; }
    if (st.who) { if (st.anim && st.who !== 'n' && st.who !== 'you') npcAnim = { id: st.who, kind: st.anim }; showLine(st.who, fill(st.text), st.text); return; }
    if (st.choice) { showChoice(st.choice, st.menu, st.prompt, st.speaker); return; }
    if (st.scene) { showScene(st.scene, fill(st.text), st.text); return; }
    if (st.end) { const c = script.ctx; script = null; $('dlg').hidden = true; $('scene').hidden = true; if (c && c.finish) c.finish(st.end); else { mode = 'world'; } return; }
    if (st.fn) { st.fn(); if (!st.stop) next(); return; }
    next();
  }

  let portrait = null;  // { who, spec, mute }
  function portraitFor(who) {
    const c = $('dlg-portrait');
    if (who === 'n') { c.hidden = true; portrait = null; return; }
    c.hidden = false;
    if (who === 'simurgh') { portrait = { who, bird: true, mute: false }; drawPortrait(performance.now()); return; }
    const n = npcById(who);
    portrait = { who, spec: who === 'you' ? mySpec() : (n ? n.spec : mySpec()), mute: false };
    drawPortrait(performance.now());
  }
  function drawPortrait(t) {
    if (!portrait || $('dlg').hidden) return;
    const c = $('dlg-portrait');
    const talking = !portrait.mute && (typing !== null || A.isSpeaking());
    if (portrait.bird) Wd.drawBirdFace(c.getContext('2d'), t, talking, c.width, c.height);
    else Wd.drawFace(c.getContext('2d'), portrait.spec, t, talking, c.width, c.height);
  }

  function showLine(who, text, raw) {
    const n = npcById(who);
    $('dlg').hidden = false; $('scene').hidden = true;
    $('dlg').classList.toggle('narrator', who === 'n');
    $('dlg-name').textContent = who === 'n' ? '' : speakerName(who);
    portraitFor(who);
    const el = $('dlg-text'); el.textContent = '';
    let i = 0;
    A.play('talk');
    A.say(text, who, who === 'n' ? 'narrator' : who === 'you' ? 'you' : who === 'simurgh' ? 'bird' : (n && n.v) || 'man', raw || text);
    typingFull = text;
    typing = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i >= text.length) finishTyping(); }, 18);
  }
  function finishTyping() { if (!typing) return; clearInterval(typing); $('dlg-text').textContent = typingFull; typing = null; }

  function showChoice(options, menu, prompt, who) {
    $('dlg').hidden = false; $('scene').hidden = true;
    $('dlg').classList.remove('narrator');
    if (who && npcById(who)) { $('dlg-name').textContent = npcById(who).name; portraitFor(who); } else { $('dlg-name').textContent = S.name; portraitFor('you'); }
    if (portrait) portrait.mute = true;
    $('dlg-text').textContent = prompt || T('What do you say?');
    $('dlg-next').hidden = true;
    const box = $('dlg-choices'); box.hidden = false; box.innerHTML = '';
    (menu ? options : shuffle(options)).forEach(o => {
      const b = document.createElement('button'); b.className = 'choice'; b.type = 'button'; b.textContent = fill(o.text);
      b.addEventListener('click', () => {
        A.play('talk'); A.stop();
        if (script.ctx) { script.ctx.chosen = o; script.ctx.shown = options; }
        const steps = script.ctx && script.ctx.branch ? script.ctx.branch(o) : null;
        if (!steps) { endDialog(); return; }
        script.steps = steps; script.i = -1; next();
      });
      box.appendChild(b);
    });
  }

  function showScene(img, text, raw) {
    $('dlg').hidden = true;
    $('scene-img').src = img; $('scene-text').textContent = text;
    $('scene').hidden = false;
    A.say(text, 'n', 'narrator', raw || text);
  }

  function endDialog() { $('dlg').hidden = true; $('scene').hidden = true; script = null; npcAnim = null; mode = 'world'; A.stop(); if (bird && !bird.out) bird.out = performance.now(); updateHud(); }

  /* ================= cards (lesson pop-ups) ================= */
  function card(opts) {
    const c = $('card');
    $('card-eyebrow').textContent = opts.eyebrow || ''; $('card-title').textContent = opts.title || '';
    const img = $('card-img'), big = $('card-icon');
    if (opts.img) { img.src = opts.img; img.hidden = false; big.hidden = true; } else { img.hidden = true; big.hidden = false; big.textContent = opts.icon || '✨'; }
    $('card-one').textContent = opts.one || ''; $('card-spot').textContent = opts.spot || '';
    $('card-answers').innerHTML = opts.answers || '';
    $('card-btn').textContent = opts.btn || T('OK');
    c.className = 'overlay ' + (opts.kind || '');
    c.hidden = false; mode = 'panel'; updateHud();
    cardAfter = opts.after || null;
  }
  let cardAfter = null;
  function closeCard() {
    $('card').hidden = true; mode = 'world';
    const f = cardAfter; cardAfter = null;
    if (f) f();
  }

  function answersHtml(chosen, correct, ok) {
    let h = '';
    if (chosen) h += `<div class="ans ${ok ? 'right' : 'wrong'}"><span class="mark">${ok ? '✓' : '✗'}</span><div><small>${esc(T('You said'))}</small>${esc(chosen)}</div></div>`;
    if (!ok && correct) h += `<div class="ans right"><span class="mark">✓</span><div><small>${esc(T('Better answer'))}</small>${esc(correct)}</div></div>`;
    return h;
  }
  function lessonWin(fid, eyebrow, after, chosen) {
    const f = fallacy(fid);
    S.spotted[fid] = (S.spotted[fid] || 0) + 1; save();
    A.play('badge');
    card({ eyebrow: eyebrow || T('You spotted it!'), title: f.icon + ' ' + f.nick, img: f.img, icon: f.icon, one: f.one, spot: f.spot, btn: T('Nice'), kind: 'win', after, answers: answersHtml(chosen, null, true) });
  }
  function lessonFail(fid, eyebrow, after, chosen, correct) {
    const f = fallacy(fid);
    S.fails[fid] = (S.fails[fid] || 0) + 1; save();
    A.play('bad');
    card({ eyebrow: eyebrow || T('That was a trick'), title: f.icon + ' ' + f.nick, img: f.img, icon: f.icon, one: f.one, spot: f.spot, btn: T('Try again'), kind: 'fail', after, answers: answersHtml(chosen, correct, false) });
  }
  function lessonOops(after, chosen, correct) {
    const f = fallacy('adHominem');
    A.play('bad');
    card({ eyebrow: T('Hmm'), title: f.icon + ' ' + f.nick, img: f.img, one: T('Name-calling is not an answer.'), spot: T('Say why the argument is wrong instead. Insults give the other person a reason to stop listening.'), btn: T('Try again'), kind: 'fail', after, answers: answersHtml(chosen, correct, false) });
  }

  /* ================= talking ================= */
  function talkTo(n) {
    if (n.path) { n.path = null; n.fx = n.x; n.fy = n.y; n.walk = 0; }
    if (n.city) { talkCity(n); return; }
    if (S.refuse[n.id] && D.REFUSE[n.id]) { runRefuse(n); return; }
    const jd = jobDeliverFor(n);
    if (jd) { deliverJob(jd, n); return; }
    const del = deliverFor(n);
    if (del) { completeDeliver(del, n); return; }
    if (n.trick && trickLive(n.trick) && !S.tricks[n.trick] && (!n.talk || S.flags['talked:' + n.id])) { runTrick(n.trick); return; }
    if (n.expert) { talkExpert(n); return; }
    const task = nextTask(n);
    if (task) { handleTask(task, n); return; }
    let lines = n.talk || [];
    if (n.trick && S.tricks[n.trick] && n.after) lines = n.after;
    else if (n.afterTrick && S.tricks[n.afterTrick] && n.after) lines = n.after;
    else if (tasksOf(n).length && tasksOf(n).every(t => S.tasks[t.id] === 'done')) { const last = tasksOf(n)[tasksOf(n).length - 1]; lines = last.done || lines; }
    S.flags['talked:' + n.id] = true; save();
    if (!lines.length) lines = ['...'];
    runSteps(normalize(lines, n.id), null);
  }

  /* ---- tricks ---- */
  function runTrick(id) {
    const tr = D.TRICKS[id];
    const steps = normalize(tr.intro, tr.npc).concat([{ choice: tr.options }]);
    const c = { branch: o => normalize(tr[o.key] || [], tr.npc), finish: kind => finishTrick(id, kind, c) };
    runSteps(steps, c);
  }
  function answerTexts(c, isRight) {
    const chosen = c && c.chosen ? fill(c.chosen.text) : null;
    const correct = c && c.shown ? c.shown.find(isRight) : null;
    return { chosen, correct: correct ? fill(correct.text) : null };
  }
  function finishTrick(id, kind, c) {
    const tr = D.TRICKS[id];
    const { chosen, correct } = answerTexts(c, o => /^right/.test(o.key));
    mode = 'world';
    if (kind === 'win') { S.tricks[id] = 'won'; save(); lessonWin(tr.fallacy, null, null, chosen); }
    else if (kind === 'fail') { lessonFail(tr.fallacy, null, null, chosen, correct); simEvent('fooled'); }
    else lessonOops(null, chosen, correct);
  }

  /* ---- experts ---- */
  function talkExpert(n) {
    const e = ex(n.id), fogs = n.expert.fog;
    if (S.refog[n.id]) { runHardFog(n); return; }
    if (!e.crew) { runFog(n, 0); return; }
    const opts = [];
    if (e.cleared < fogs.length) opts.push({ key: 'fog', text: T('Ask about: {topic}', { topic: fogs[e.cleared].topic || T('what is on your mind') }) });
    opts.push({ key: 'why', text: T("Why aren't you working yet?") });
    opts.push({ key: 'work', text: T('Tell me about your craft.') });
    opts.push({ key: 'bye', text: T('Never mind.') });
    const lvl = exLevel(n.id), role = roleName(n.expert.role);
    runSteps([{ choice: opts, menu: true, speaker: n.id, prompt: T('What do you want to talk about?') }], {
      branch: o => {
        if (o.key === 'fog') return [{ fn: () => runFog(n, e.cleared), stop: true }];
        if (o.key === 'why') return whyNotWorking(n).map(text => ({ who: n.id, text }));
        if (o.key === 'work') return [{ who: n.id, text: (n.expert.crew || [T('Ready to work.')])[0] }, { fn: () => toast(`${D.ROLES[n.expert.role].icon} ${role} ${stars(lvl)} · ${T('fee {n}', { n: n.expert.fee })} · ${T('fog cleared {a}/{b}', { a: e.cleared, b: fogs.length })}`, 'good') }];
        return [{ who: n.id, text: T('Right you are.') }];
      }
    });
  }
  /* Every line here is fixed text so it can be recorded in the expert's own voice; numbers live in the HUD. */
  function whyNotWorking(n) {
    const L = D.LINES.why, lv = currentLevel();
    if (!lv.mission) return L.built;
    const m = mission(lv.mission), ms = S.missions[m.id] || {};
    if (ms.status === 'building') return L.building;
    if (ms.status === 'built') return L.built;
    const need = m.needs.find(nd => nd.role === n.expert.role);
    if (!need) return L.notNeeded;
    if (exLevel(n.id) < need.level) return L.lowLevel;
    const team = assign(m);
    if (!team.every(Boolean)) return L.missing;
    if (S.money < totalCost(m)) return L.coins;
    return L.ready;
  }
  function runFog(n, idx) {
    const fog = n.expert.fog[idx];
    let result = 'fail';
    const c = {
      branch: o => { result = o.right ? 'win' : 'fail'; return normalize(o.right ? fog.right : fog.wrong, n.id).concat([{ end: 'x' }]); },
      finish: () => finishFog(n, idx, result, c)
    };
    runSteps(normalize(fog.intro, n.id).concat([{ choice: fog.options }]), c);
  }
  function finishFog(n, idx, result, c) {
    const e = ex(n.id), fog = n.expert.fog[idx];
    const { chosen, correct } = answerTexts(c, o => !!o.right);
    mode = 'world';
    if (result === 'win') {
      e.cleared = idx + 1;
      const joined = !e.crew; e.crew = true; save();
      const ally = isAlly(n);
      const eyebrow = ally ? T('{name} is now a true ally!', { name: n.name }) : joined ? T('{name} joins your crew!', { name: n.name }) : T('{name} thinks clearer (+50% learning)', { name: n.name });
      lessonWin(fog.fallacy, eyebrow, () => {
        if (joined) toast(T('👷 {name} joined', { name: n.name }), 'good');
        if (ally) { toast(T('⭐ {name} is a true ally', { name: n.name }), 'good', 2600); simEvent('ally'); }
        updateHud(); placeCrew(true);
      }, chosen);
    } else { lessonFail(fog.fallacy, T('{name} is still foggy', { name: n.name }), null, chosen, correct); simEvent('fooled'); }
  }

  /* ---- the harder fog a preacher leaves behind: clear it and the expert rejoins the crew ---- */
  function runHardFog(n) {
    const list = D.HARD[n.id] || [], r = S.refog[n.id];
    const fog = list[r.idx % list.length];
    if (!fog) { delete S.refog[n.id]; ex(n.id).crew = true; save(); talkExpert(n); return; }
    let result = 'fail';
    const c = {
      branch: o => { result = o.right ? 'win' : 'fail'; return normalize(o.right ? fog.right : fog.wrong, n.id).concat([{ end: 'x' }]); },
      finish: () => {
        const { chosen, correct } = answerTexts(c, o => !!o.right);
        mode = 'world';
        if (result === 'win') {
          delete S.refog[n.id]; const e = ex(n.id); e.crew = true; e.xp += 30; S.orderStats.cleared++; save();
          lessonWin(fog.fallacy, T('{name} is back on your crew!', { name: n.name }), () => { toast(T('👷 {name} is back', { name: n.name }), 'good'); updateHud(); placeCrew(true); }, chosen);
        } else lessonFail(fog.fallacy, T('{name} is still foggy', { name: n.name }), null, chosen, correct);
      }
    };
    runSteps(normalize(fog.intro, n.id).concat([{ choice: fog.options }]), c);
  }

  /* ---- somebody the preacher turned against you: answer the argument and they work with you again ---- */
  function runRefuse(n) {
    const r = D.REFUSE[n.id];
    let result = 'fail';
    const c = {
      branch: o => { result = o.right ? 'win' : 'fail'; return normalize(o.right ? r.right : r.wrong, n.id).concat([{ end: 'x' }]); },
      finish: () => {
        const { chosen, correct } = answerTexts(c, o => !!o.right);
        mode = 'world';
        if (result === 'win') { delete S.refuse[n.id]; S.orderStats.cleared++; save(); lessonWin(r.fallacy, T('{name} will work with you again', { name: n.name }), () => updateHud(), chosen); }
        else lessonFail(r.fallacy, T('{name} still refuses', { name: n.name }), null, chosen, correct);
      }
    };
    runSteps(normalize(r.intro, n.id).concat([{ choice: r.options }]), c);
  }

  /* ---- tasks ---- */
  const tasksOf = n => allTasks().filter(t => t.giver === n.id);
  function nextTask(n) {
    return tasksOf(n).find(t => S.tasks[t.id] !== 'done' && (!t.pre || S.tasks[t.pre] === 'done')) || null;
  }
  function deliverFor(n) {
    return allTasks().find(t => t.kind === 'deliver' && t.target === n.id && S.tasks[t.id] === 'active') || null;
  }
  function handleTask(t, n) {
    const st = S.tasks[t.id];
    if (!st) {
      if (t.item && S.carry) { runSteps(nar(D.LINES.handsFull), null); return; }
      const steps = t.offer.map(text => ({ who: n.id, text })).concat([{ choice: [{ text: T("Yes, I'll do it."), key: 'yes' }, { text: T('Not right now.'), key: 'no' }] }]);
      runSteps(steps, {
        branch: o => o.key === 'yes'
          ? [{ who: n.id, text: t.accept }, { fn: () => { S.tasks[t.id] = 'active'; if (t.kind === 'deliver' && t.item) S.carry = { kind: 'task', id: t.id, item: t.item }; save(); toast('📋 ' + t.title, 'good'); A.play('open'); updateHud(); } }]
          : [{ who: n.id, text: T('Come back when you have time.') }],
        finish: () => { mode = 'world'; }
      });
      return;
    }
    if (st === 'active') { runSteps(t.active.map(text => ({ who: n.id, text })), null); return; }
    if (st === 'found') {
      runSteps(t.reward.map(text => ({ who: n.id, text })).concat([{ fn: () => finishTask(t) }]), null);
    }
  }
  function finishTask(t) {
    S.tasks[t.id] = 'done'; S.flags['task:' + t.id] = true;
    if (S.carry && S.carry.kind === 'task' && S.carry.id === t.id) S.carry = null;
    changeMoney(t.pay); A.play('coins'); syncWorld(); updateHud();
  }
  function completeDeliver(t, n) {
    runSteps(t.deliver.map(text => ({ who: n.id, text })).concat([{ fn: () => finishTask(t) }]), null);
  }

  /* ---- decorations: task spots, repeatable jobs, statue plinths ---- */
  const ACTION_MS = { hammer: 2600, dig: 2600, sweep: 2800, pick: 2200, sort: 2600, milk: 2400, coil: 2400, lift: 1800, light: 2200, call: 2200 };

  function useDecor(d) {
    if (d.mission) { openBuilding(mission(d.mission)); return; }
    if (d.kind === 'plinth') { openStatue(d.statue); return; }
    const job = allJobs().find(j => j.place === d.id);
    if (job) { doJob(job); return; }
    const task = allTasks().find(t => t.kind === 'spot' && t.target === d.id);
    if (d.kind === 'fountain' && d.dry && !S.throne) { showVignette(d, D.FLAVOR.dryfountain, { dry: true }); return; }
    if (task && S.tasks[task.id] === 'active') {
      if (task.item && S.carry) { runSteps(nar(D.LINES.handsFull), null); return; }
      startAction(task.anim || 'pick', ACTION_MS[task.anim] || 2200, () => {
        S.tasks[task.id] = 'found'; S.flags['task:' + task.id] = true;
        if (task.item) S.carry = { kind: 'task', id: task.id, item: task.item };
        save(); syncWorld(); updateHud();
        A.play(task.follow ? (task.follow === 'goat' ? 'goat' : 'bird') : 'good');
        toast(task.follow ? T('{pet} follows you!', { pet: petName(task.follow) }) : task.item ? T('Got it! Carry it back.') : T('Fixed!'), 'good');
      });
      return;
    }
    const g = gameAt(d);
    if (g) { startMiniGame(g, d); return; }
    showVignette(d, D.FLAVOR[d.kind] || D.FLAVOR.nothing);
  }

  /* ================= scenes: little animated pictures and mini-games in a modal =================
     A scene (js/scenes.js) draws on the canvas in #vig; game.js feeds it time, taps and keys and shows its
     caption and buttons. Vignettes replace the narrator's flat line when you press A on a thing; mini-games
     hide behind some things (the card table, the skipping stones, the fixed scarecrow, the fishing rod) and
     inside Dodge's cup trick. */
  let modal = null;   // { scene, api, prev, after, t0, result }
  const vcan = $('vig-canvas');
  function setVigButtons(list) {
    const box = $('vig-ui'); box.innerHTML = '';
    (list || []).forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.className = 'choice'; b.textContent = o.text; b.addEventListener('click', () => { A.play('talk'); o.on(); }); box.appendChild(b); });
  }
  function openScene(make, cfg, after) {
    if (!make) { if (cfg.caption) runSteps(nar(cfg.caption), null); return; }
    hidePreview(); A.stop();
    const t0 = performance.now();
    const api = {
      Wd, A, T, spec: mySpec(), t0, opts: cfg.opts || {}, lines: cfg.lines || {}, game: cfg.game || null,
      caption: (text, speak) => { $('vig-text').textContent = text || ''; if (text && speak !== false) A.say(text, 'n', 'narrator', text); },
      buttons: setVigButtons,
      finish: r => { if (!modal) return; modal.result = r || {}; $('vig-close').textContent = T('OK'); setVigButtons([]); }
    };
    modal = { scene: null, api, prev: mode, after, t0, result: null };
    mode = 'modal';
    $('vig-text').textContent = ''; setVigButtons([]);
    $('vig-close').textContent = cfg.game ? T('Leave') : T('OK');
    $('vig').hidden = false;
    modal.scene = make(api);
    if (cfg.caption) api.caption(cfg.caption);
    drawModal(performance.now());
  }
  function closeScene() {
    if (!modal) return;
    const m = modal; modal = null;
    $('vig').hidden = true; setVigButtons([]); A.stop(); A.play('close');
    mode = m.prev === 'modal' ? 'world' : m.prev;
    if (m.after) m.after(m.result);
    updateHud();
  }
  function drawModal(t) {
    if (!modal || !modal.scene) return;
    const want = Math.round((vcan.clientWidth || Sc.W) * dpr);
    if (vcan.width !== want) { vcan.width = want; vcan.height = Math.round(want * Sc.H / Sc.W); }
    const c = vcan.getContext('2d');
    c.setTransform(vcan.width / Sc.W, 0, 0, vcan.height / Sc.H, 0, 0); c.clearRect(0, 0, Sc.W, Sc.H);
    try { modal.scene.draw(c, t - modal.t0); } catch (e) { console.error(e); closeScene(); }   // a broken scene must never stop the game loop
  }
  const modalT = () => performance.now() - modal.t0;
  /* Enter, Space or the A button inside a scene: the game's action key, or "close" once it is over. */
  function modalPress() {
    if (!modal) return;
    if (modal.result || !modal.scene.key) closeScene(); else modal.scene.key('Enter', modalT());
  }
  vcan.addEventListener('pointerdown', e => {
    if (!modal) return; e.preventDefault(); A.unlock();
    const r = vcan.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * Sc.W, y = (e.clientY - r.top) / r.height * Sc.H;
    if (modal.scene.pointer && !modal.result) modal.scene.pointer(x, y, modalT()); else closeScene();
  });
  $('vig-close').addEventListener('click', closeScene);
  $('vig').addEventListener('click', e => { if (e.target === $('vig') && modal && !modal.api.game) closeScene(); });

  function showVignette(d, caption, opts) {
    const make = Sc && Sc.vignettes[d.kind];
    openScene(make, { caption: fill(caption), opts: Object.assign({ text: d.text ? (I ? I.t(d.text) : d.text) : '' }, opts || {}) }, null);
  }
  /* A step { game, mode } inside a dialogue: the dialogue box steps aside, the game plays, the dialogue goes on. */
  function openGameStep(st) {
    const g = D.GAMES && D.GAMES[st.game], make = Sc && Sc.games[st.game];
    if (!g || !make) { next(); return; }
    $('dlg').hidden = true;
    const who = script && script.steps.find(s => s.who && s.who !== 'n' && s.who !== 'you');
    openScene(make, { game: g, lines: g.lines, opts: { mode: st.mode, npcSpec: (npcById(who ? who.who : 'dodge') || {}).spec } }, () => { $('dlg').hidden = false; next(); });
  }
  const allGames = () => Object.keys(D.GAMES || {}).map(id => Object.assign({ id }, D.GAMES[id]));
  const gameAt = d => allGames().find(g => g.place && g.place === d.id && (!g.needs || S.flags[g.needs]) && Sc && Sc.games[g.id]) || null;
  /* A hidden mini-game at a decoration. Coins are paid once per cooldown; a lesson question shows its card afterwards. */
  function startMiniGame(g, d, extra) {
    const st = S.games[g.id] || (S.games[g.id] = {}), canPay = !st.last || st.last + g.cooldown * 1000 < Date.now();
    openScene(Sc.games[g.id], { game: g, lines: g.lines, opts: Object.assign({ text: d && d.text ? (I ? I.t(d.text) : d.text) : '', npcSpec: (npcById(g.npc || 'dodge') || {}).spec }, extra || {}) }, r => {
      if (!r) return;
      st.plays = (st.plays || 0) + 1; st.best = Math.max(st.best || 0, r.coins || 0); save();
      if (r.coins && canPay) { st.last = Date.now(); save(); changeMoney(r.coins); A.play('coins'); }
      else if (r.coins) toast(T('You already earned coins here. Come back later.'), '', 2600);
      if (r.lesson) {
        if (r.lesson.ok) lessonWin(r.lesson.fid, null, null, r.lesson.chosen);
        else lessonFail(r.lesson.fid, null, null, r.lesson.chosen, r.lesson.correct);
      }
    });
  }

  /* ---- jobs: an animation at the spot, then pay, or carry something to a person who pays ---- */
  function doJob(job) {
    const last = S.jobs[job.id] || 0;
    if (last + job.cooldown * 1000 > Date.now()) { runSteps(nar(D.LINES.cooldown), null); return; }
    if (S.carry) { runSteps(nar(D.LINES.handsFull), null); return; }
    startAction(job.anim, ACTION_MS[job.anim] || 2400, () => {
      if (job.deliverTo) { S.carry = { kind: 'job', id: job.id, item: job.item }; save(); updateHud(); toast(job.steps[1], 'good'); }
      else { S.jobs[job.id] = Date.now(); changeMoney(job.pay); A.play('coins'); }
    });
  }
  function jobDeliverFor(n) {
    if (!S.carry || S.carry.kind !== 'job') return null;
    const j = D.JOBS[S.carry.id];
    return j && j.deliverTo === n.id ? Object.assign({ id: S.carry.id }, j) : null;
  }
  function deliverJob(job, n) {
    runSteps([{ who: n.id, text: job.thanks }, { fn: () => { S.carry = null; S.jobs[job.id] = Date.now(); changeMoney(job.pay); A.play('coins'); updateHud(); } }], null);
  }

  /* ================= crew movement: convinced experts wait at the work site ================= */
  function moveNpcs(dt) {
    npcs.forEach(n => {
      if (!n.path || !n.path.length) return;
      const [tx, ty] = n.path[0];
      n.dir = tx > n.x ? 'right' : tx < n.x ? 'left' : ty > n.y ? 'down' : 'up';
      n.t = (n.t || 0) + dt / 170;
      if (n.t >= 1) {
        n.x = tx; n.y = ty; n.fx = tx; n.fy = ty; n.t = 0; n.walk = 0; n.path.shift();
        if (!n.path.length) { n.path = null; if (n.faceAfter) n.dir = n.faceAfter; S.npcPos[n.id] = { x: n.x, y: n.y, dir: n.dir }; save(); }
      } else { n.fx = n.x + (tx - n.x) * n.t; n.fy = n.y + (ty - n.y) * n.t; n.walk = n.t; }
    });
  }
  function sendNpc(n, x, y, dir, animate) {
    if (n.x === x && n.y === y && !n.path) { if (dir) n.dir = dir; return; }
    const avoid = new Set(npcs.filter(o => o !== n).map(o => o.x + ',' + o.y)); avoid.add(player.x + ',' + player.y);
    const path = animate ? Wd.findPath(n.x, n.y, x, y, avoid) : null;
    if (path && path.length) { n.path = path; n.t = 0; n.faceAfter = dir; return; }
    n.x = x; n.y = y; n.fx = x; n.fy = y; n.path = null; n.walk = 0; n.dir = dir || n.dir;
    S.npcPos[n.id] = { x, y, dir: n.dir }; save();
  }
  /* Crew needed for the current building wait at its camp; the rest go home. Allies on an errand are left alone. */
  function placeCrew(animate) {
    const lv = currentLevel(), m = lv.mission ? mission(lv.mission) : null, ms = m ? (S.missions[m.id] || {}) : {};
    const free = crew().filter(n => !(S.errands || {})[n.id]);
    const camp = m ? m.camp || [] : [];
    const wanted = m ? free.filter(n => { const need = m.needs.find(nd => nd.role === n.expert.role); return need && !S.ended && ms.status !== 'built' && exLevel(n.id) >= need.level; }) : [];
    const used = new Set();
    wanted.forEach(n => { const i = camp.findIndex(([x, y]) => x === n.x && y === n.y); if (i >= 0) used.add(i); });
    wanted.forEach(n => {
      if (camp.some(([x, y]) => x === n.x && y === n.y)) return;
      const i = camp.findIndex(([x, y], idx) => !used.has(idx) && !npcs.some(o => o !== n && o.x === x && o.y === y));
      if (i < 0) return;
      used.add(i);
      const [x, y] = camp[i];
      const facing = x < m.site.x ? 'right' : x >= m.site.x + m.site.w ? 'left' : y < m.site.y ? 'down' : 'up';
      sendNpc(n, x, y, facing, animate);
    });
    free.filter(n => !wanted.includes(n)).forEach(n => sendNpc(n, n.home.x, n.home.y, n.home.dir, animate));
  }

  /* ================= the Grey Order: preachers who fog cleared heads =================
     A preacher walks out of the lodge in a region, goes to somebody you convinced, preaches
     for a few seconds, and leaves a fog behind: experts leave your crew until you clear a
     harder fog; task givers refuse you until you answer the preacher's argument. Nobody
     inside a statue's circle can be reached. You cannot talk to a preacher. */
  const preachers = [];
  const preacherAt = (x, y) => preachers.find(p => p.phase !== 'gone' && ((p.x === x && p.y === y) || (p.path && p.path.length && p.path[0][0] === x && p.path[0][1] === y)));
  const orderCfg = () => D.ORDER.byLevel[Math.min(S.unlocked, 6)] || null;
  const isDeliverTarget = n => Object.values(D.JOBS).some(j => j.deliverTo === n.id) || Object.values(D.TASKS).some(t => t.kind === 'deliver' && t.target === n.id);
  const protectedAt = (x, y) => D.STATUE.sites.some((s, i) => S.statues[i] && S.statues[i].status === 'built' && dist(s.x, s.y, x, y) <= D.STATUE.radius);
  function canTarget(n) {
    if (n.region >= S.unlocked || protectedAt(n.x, n.y)) return false;
    if (preachers.some(p => p.phase !== 'gone' && p.target === n.id)) return false;
    if (n.expert) return !!(ex(n.id).crew && !isAlly(n) && !S.refog[n.id] && D.HARD[n.id] && D.HARD[n.id].length);
    const cfg = orderCfg();
    return !!(cfg && cfg.refuse && D.REFUSE[n.id] && !S.refuse[n.id] && (n.task || isDeliverTarget(n)));
  }
  /* Is this person still worth walking to? (Same as canTarget, minus the "already targeted" rule.) */
  const stillValid = n => n.region < S.unlocked && !protectedAt(n.x, n.y) && (n.expert ? !!(ex(n.id).crew && !isAlly(n) && !S.refog[n.id]) : !S.refuse[n.id]);
  function pickTarget(region) {
    const cands = npcs.filter(n => canTarget(n) && (region === undefined || n.region === region));
    if (!cands.length) return null;
    const weight = n => n.expert ? 3 : 1;
    let r = Math.random() * cands.reduce((s, n) => s + weight(n), 0);
    for (const n of cands) { r -= weight(n); if (r <= 0) return n; }
    return cands[cands.length - 1];
  }
  function makePreacher(x, y, region, target, skin) {
    const spec = Object.assign({}, D.ORDER.spec, { skin: skin || D.ORDER.skins[Math.floor(Math.random() * D.ORDER.skins.length)] });
    return { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000), x, y, fx: x, fy: y, dir: 'down', walk: 0, path: null, t: 0, spec, region, target, phase: 'walk', converts: 0, until: 0 };
  }
  function persistPreachers() { S.preachers = preachers.filter(p => p.phase !== 'gone').map(p => ({ x: p.x, y: p.y, region: p.region, target: p.target, phase: p.phase === 'preach' ? 'walk' : p.phase, converts: p.converts, skin: p.spec.skin })); save(); }
  function restorePreachers() {
    preachers.length = 0;
    (S.preachers || []).forEach(s => { const p = makePreacher(s.x, s.y, s.region, s.target, s.skin); p.phase = s.phase || 'walk'; p.converts = s.converts || 0; preachers.push(p); });
  }
  function spawnPreacher() {
    const target = pickTarget();
    S.lastPreach = Date.now();
    if (!target) { save(); return; }
    const lodge = Wd.lodges().find(l => l.region === target.region) || Wd.lodges()[0];
    const p = makePreacher(lodge.door[0], lodge.door[1], target.region, target.id);
    preachers.push(p); persistPreachers();
    A.play('omen');
    toast(T('⚠ A preacher is out in {region}!', { region: regionName(target.region) }), 'bad', 3200);
    updateAlert();
    if ($('minimap-box').hidden) { $('minimap-box').hidden = false; renderMini(); }
  }
  function tickPreachers(dt) {
    if (S.ended || S.unlocked < D.ORDER.fromLevel) return;
    const cfg = orderCfg(); if (!cfg) return;
    const now = Date.now();
    if (!S.orderSince) { S.orderSince = now; S.lastPreach = now - cfg.every * 1000 + D.ORDER.firstAfterSec * 1000; save(); }
    const live = preachers.filter(p => p.phase !== 'gone');
    if (live.length < cfg.max && now - S.lastPreach > cfg.every * 1000 && mode === 'world') spawnPreacher();
    live.forEach(p => stepPreacher(p, dt, now, cfg));
    if (preachers.some(p => p.phase === 'gone')) { for (let i = preachers.length - 1; i >= 0; i--) if (preachers[i].phase === 'gone') preachers.splice(i, 1); persistPreachers(); updateAlert(); }
  }
  function walkAlong(p, dt, speed) {
    if (!p.path || !p.path.length) return true;
    const [tx, ty] = p.path[0];
    p.dir = tx > p.x ? 'right' : tx < p.x ? 'left' : ty > p.y ? 'down' : 'up';
    p.t += dt / speed;
    if (p.t >= 1) { p.x = tx; p.y = ty; p.fx = tx; p.fy = ty; p.t = 0; p.walk = 0; p.path.shift(); if (!p.path.length) { p.path = null; return true; } }
    else { p.fx = p.x + (tx - p.x) * p.t; p.fy = p.y + (ty - p.y) * p.t; p.walk = p.t; }
    return false;
  }
  function pathTo(p, x, y) {
    const avoid = new Set(npcs.map(o => o.x + ',' + o.y)); preachers.forEach(o => { if (o !== p && o.phase !== 'gone') avoid.add(o.x + ',' + o.y); });
    return Wd.findPath(p.x, p.y, x, y, avoid);
  }
  function pathNextTo(p, n) {
    const spots = [[n.x, n.y + 1], [n.x - 1, n.y], [n.x + 1, n.y], [n.x, n.y - 1]].filter(([x, y]) => Wd.walkable(x, y) && !npcAt(x, y) && !(player.x === x && player.y === y));
    spots.sort((a, b) => dist(p.x, p.y, a[0], a[1]) - dist(p.x, p.y, b[0], b[1]));
    for (const [x, y] of spots) { if (p.x === x && p.y === y) return []; const path = pathTo(p, x, y); if (path) return path; }
    return null;
  }
  function stepPreacher(p, dt, now, cfg) {
    if (p.phase === 'walk') {
      const n = p.target ? npcById(p.target) : null;
      if (!n || !stillValid(n)) { retarget(p); return; }
      if (!p.path) { const path = pathNextTo(p, n); if (!path) { retarget(p); return; } if (!path.length) { beginSermon(p, n, now, cfg); return; } p.path = path; p.t = 0; }
      if (walkAlong(p, dt, 190)) { if (dist(p.x, p.y, n.x, n.y) <= 1.5) beginSermon(p, n, now, cfg); else p.path = null; }
      if (Math.floor(now / 400) !== Math.floor((now - dt) / 400)) persistPreachers();
    } else if (p.phase === 'preach') {
      const n = npcById(p.target);
      if (!n) { retarget(p); return; }
      if (protectedAt(n.x, n.y)) { toast(D.ORDER.lines.protectedStop, 'good', 2600); retarget(p); return; }
      if (now >= p.until && mode === 'world') { convert(n); p.converts++; if (p.converts >= cfg.converts) leave(p); else retarget(p); }
    } else if (p.phase === 'leave') {
      if (!p.path) { const lodge = Wd.lodges().find(l => l.region === p.region) || Wd.lodges()[0]; const path = pathTo(p, lodge.door[0], lodge.door[1]); if (!path || !path.length) { p.phase = 'gone'; return; } p.path = path; p.t = 0; }
      if (walkAlong(p, dt, 170)) p.phase = 'gone';
    }
  }
  function beginSermon(p, n, now, cfg) {
    if (protectedAt(n.x, n.y)) { toast(D.ORDER.lines.protectedStop, 'good', 2600); retarget(p); return; }
    p.phase = 'preach'; p.until = now + D.ORDER.preachSec * 1000; p.path = null; p.walk = 0;
    p.dir = n.x > p.x ? 'right' : n.x < p.x ? 'left' : n.y > p.y ? 'down' : 'up';
    n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
  }
  function retarget(p) {
    const t = pickTarget(p.region);
    p.path = null; p.t = 0;
    if (t) { p.target = t.id; p.phase = 'walk'; } else leave(p);
    persistPreachers(); updateAlert();
  }
  function leave(p) { p.phase = 'leave'; p.target = null; p.path = null; p.t = 0; S.lastPreach = Date.now(); persistPreachers(); updateAlert(); }
  /* The sermon worked. */
  function convert(n) {
    S.orderStats.fogged++;
    A.play('fog');
    if (n.expert) {
      const e = ex(n.id), list = D.HARD[n.id] || [];
      e.crew = false; S.refog[n.id] = { idx: (e.hardIdx || 0) % Math.max(1, list.length) }; e.hardIdx = (e.hardIdx || 0) + 1;
      save(); sendNpc(n, n.home.x, n.home.y, n.home.dir, true);
      toast(T('{name} is foggy again', { name: n.name }), 'bad', 3000);
      simEvent('fogged');
    } else {
      S.refuse[n.id] = true; save();
      toast(T('{name} refuses to work with you', { name: n.name }), 'bad', 3000);
      simEvent('refused');
    }
    updateHud(); renderMini();
  }

  /* ================= the Simurgh: the magic bird who teaches the rules, one level at a time ================= */
  let bird = null;              // { x, y, t0, out } while she is on screen
  const simQueue = [];
  function simEvent(key) {
    if (S.simSeen[key] || !D.SIMURGH.events[key]) return;
    S.simSeen[key] = true; save(); simQueue.push(D.SIMURGH.events[key]);
  }
  function simurghSay(lines) {
    bird = { x: player.x + (player.dir === 'left' ? -1 : 1), y: player.y - 1, t0: performance.now(), out: 0 };
    A.play('simurgh');
    runSteps(lines.map(text => ({ who: 'simurgh', text })), null);
  }
  const lessonNow = () => { const ls = S.lesson, L = ls && D.SIMURGH.levels[ls.level]; return L && !ls.done ? { ls, L } : null; };
  function lessonGoal() {
    const x = lessonNow(); if (!x || !x.ls.intro) return null;
    const st = x.L.steps[x.ls.step]; return st ? st.goal : null;
  }
  function stepDone(check) {
    const [k, v] = check.split(':');
    if (k === 'talk') return !!S.flags['talked:' + v];
    if (k === 'earn') return S.stats.earned > 0;
    if (k === 'crew') return crew().length >= +v;
    if (k === 'role') return crew().some(n => n.expert.role === v);
    if (k === 'built') return built(v);
    if (k === 'collect') return !!S.flags.collected;
    if (k === 'trick') return Object.keys(S.tricks).some(id => D.TRICKS[id] && D.TRICKS[id].cost);
    if (k === 'statue') return Object.keys(S.statues).length > 0;
    if (k === 'ally') return crew().some(isAlly);
    if (k === 'throne') return !!S.throne;
    return false;
  }
  /* She comes back when a step is done: praise, then what to do next. She cannot fly into the Grey City. */
  let lessonAt = 0;
  function tickLesson(t) {
    if (mode !== 'world' || player.moving || S.ended || t - lessonAt < 400) return;
    lessonAt = t;
    if (Wd.regionAt(player.x, player.y) === 5 && !S.throne) return;
    if (simQueue.length) { simurghSay(simQueue.shift()); return; }
    const x = lessonNow(); if (!x) return;
    const { ls, L } = x;
    if (!ls.intro) { ls.intro = true; save(); simurghSay(L.say); return; }
    let passed = null;
    while (L.steps[ls.step] && stepDone(L.steps[ls.step].check)) { passed = L.steps[ls.step]; ls.step++; }
    if (!passed) return;
    const next = L.steps[ls.step];
    if (!next) ls.done = true;
    save(); updateHud();
    const lines = [].concat(passed.praise || [], next && next.say ? next.say : []);
    if (lines.length) simurghSay(lines);
  }

  /* ================= true allies: they walk to your buildings and bring back the coins ================= */
  const nearSite = (n, m) => n.x >= m.site.x - 1 && n.x <= m.site.x + m.site.w && n.y >= m.site.y - 1 && n.y <= m.site.y + m.site.h;
  function siteSpot(m) {
    for (let y = m.site.y - 1; y <= m.site.y + m.site.h; y++) for (let x = m.site.x - 1; x <= m.site.x + m.site.w; x++)
      if (Wd.walkable(x, y) && !npcAt(x, y) && !(player.x === x && player.y === y)) return [x, y];
    return null;
  }
  function allyCollect(n, m) {
    const ms = mstate(m.id), got = pending(m);
    ms.lastCollect = Date.now();
    if (!got) { save(); return; }
    const share = Math.max(1, Math.round(got * D.ALLY.share)), mine = got - share;
    S.allyShares[n.id] = (S.allyShares[n.id] || 0) + share; S.flags.collected = true;
    S.allyLog.unshift({ who: n.id, m: m.id, got, mine, share, at: Date.now() }); S.allyLog.length = Math.min(S.allyLog.length, 6);
    changeMoney(mine, true); A.play('coins');
    toast(T('🪙 {name} collected {got} coins at {place}. You get {mine}, {name} keeps {share}.', { name: n.name, got, place: m.name, mine, share }), 'good', 4500);
  }
  let allyAt = 0;
  function tickAllies(t) {
    if (mode !== 'world' || t - allyAt < 1000) return;
    allyAt = t;
    const errands = S.errands || (S.errands = {});
    Object.keys(errands).forEach(id => {
      const n = npcById(id), er = errands[id], m = mission(er.m);
      if (!n || !m || !isAlly(n)) { delete errands[id]; save(); return; }
      if (n.path && n.path.length) return;
      if (!nearSite(n, m)) {
        er.tries = (er.tries || 0) + 1;
        const spot = er.tries <= 3 ? siteSpot(m) : null;
        if (spot) { sendNpc(n, spot[0], spot[1], null, true); return; }
      }
      delete errands[id]; allyCollect(n, m); placeCrew(true);
    });
    if (Date.now() - (S.lastErrand || 0) < D.ALLY.everySec * 1000) return;
    const busy = new Set(Object.values(errands).map(e => e.m));
    const m = D.MISSIONS.filter(x => built(x.id) && x.income.rate && !busy.has(x.id) && pending(x) >= D.ALLY.minCoins).sort((a, b) => pending(b) - pending(a))[0];
    if (!m) return;
    const n = crew().filter(o => isAlly(o) && !errands[o.id]).sort((a, b) => dist(a.x, a.y, m.site.x, m.site.y) - dist(b.x, b.y, m.site.x, m.site.y))[0];
    if (!n) return;
    errands[n.id] = { m: m.id, tries: 0 }; S.lastErrand = Date.now(); save();
    const spot = siteSpot(m);
    if (spot) sendNpc(n, spot[0], spot[1], null, true);
  }

  /* ================= the Grey City: everybody is fogged; convince one person and the monster falls ================= */
  function talkCity(n) {
    const c = n.city;
    if (!c.gauntlet || S.throne) { runSteps(normalize(S.throne ? (c.after || n.talk) : n.talk, n.id), null); return; }
    const st = S.city[n.id] || (S.city[n.id] = { step: 0 });
    const q = c.gauntlet[st.step];
    let result = 'fail';
    const cx = {
      branch: o => { result = o.right ? 'win' : 'fail'; return normalize(o.right ? q.right : q.wrong, n.id).concat([{ end: 'x' }]); },
      finish: () => {
        const { chosen, correct } = answerTexts(cx, o => !!o.right);
        mode = 'world';
        if (result === 'win') {
          st.step++; save();
          if (st.step >= c.gauntlet.length) lessonWin(q.fallacy, T('{name} is convinced!', { name: n.name }), () => crowned(n), chosen);
          else lessonWin(q.fallacy, T('{name} is listening. {a} of {b} done.', { name: n.name, a: st.step, b: c.gauntlet.length }), () => talkCity(n), chosen);
        } else { st.step = 0; save(); lessonFail(q.fallacy, T('{name} laughs at you. Start again.', { name: n.name }), null, chosen, correct); }
      }
    };
    const intro = (st.step === 0 ? normalize(c.intro || [], n.id) : []).concat(normalize(q.intro, n.id));
    runSteps(intro.concat([{ choice: q.options }]), cx);
  }
  function placePlayer(x, y, dir) {
    player.x = player.fx = player.tx = x; player.y = player.fy = player.ty = y; player.moving = false;
    if (dir) player.dir = dir;
    S.x = x; S.y = y; trail.length = 0;
  }
  /* The monster breaks, the Simurgh flies in and tells the truth, and the player sits on the throne. */
  function crowned(n) {
    const th = D.CITY.throne, sim = lines => lines.map(text => ({ who: 'simurgh', text }));
    const steps = normalize(n.city.convinced, n.id).concat(
      [{ fn: () => { S.throne = true; save(); throneAnim = performance.now(); syncWorld(); A.play('fog'); } }],
      nar(D.CITY.lift),
      [{ fn: () => { bird = { x: player.x + 1, y: player.y - 1, t0: performance.now(), out: 0 }; A.play('simurgh'); } }],
      sim(D.SIMURGH.ending),
      [{ fn: () => { if (bird) bird.out = performance.now(); placePlayer(th.x, th.y, 'down'); S.ended = true; save(); syncWorld(); A.play('fanfare'); updateHud(); } }],
      nar(D.CITY.sit),
      [{ end: 'x' }]);
    runSteps(steps, { finish: () => showEnd() });
  }

  /* ================= statues of Aristotle ================= */
  const hasMason = () => crew().some(n => n.expert.role === 'mason');
  function openStatue(i) {
    const site = D.STATUE.sites[i], st = S.statues[i], cost = D.STATUE.costs[i];
    if (site.region >= S.unlocked) return;
    if (S.unlocked < D.STATUE.fromLevel) { runSteps(nar(D.STATUE.flavor), null); return; }
    if (st && st.status === 'built') { runSteps(nar([D.STATUE.inspect, D.STATUE.quote]), null); return; }
    if (st && st.status === 'building') {
      const p = Math.min(100, Math.round((Date.now() - st.startedAt) / (D.STATUE.buildSec * 10)));
      panel(`<p class="eyebrow">${esc(T('Under construction'))}</p><h2>${esc(D.STATUE.name)}</h2><div class="bar"><span style="width:${p}%"></span></div><p>${esc(T('{p}% done.', { p }))}</p><div class="row"><button class="btn btn-ghost grow" id="p-close">${esc(T('Close'))}</button></div>`);
      $('p-close').onclick = closePanel; return;
    }
    const ready = hasMason() && S.money >= cost;
    let why = '';
    if (!hasMason()) why = T('You need a mason in your crew.'); else if (S.money < cost) why = T('You need {n} more coins.', { n: cost - S.money });
    panel(`
      <p class="eyebrow">${esc(regionName(site.region))}</p>
      <h2>🗿 ${esc(D.STATUE.name)}</h2>
      <p>${esc(D.STATUE.blurb)}</p>
      <p class="spot">${esc(D.STATUE.quote)}</p>
      <div class="costrow"><span>${esc(T('Cost'))} <b>${cost} 🪙</b></span><span>${esc(T('You have'))} <b>${S.money} 🪙</b></span><span>${esc(T('Circle'))} <b>${D.STATUE.radius}</b></span><span>${esc(T('Builder'))} <b>${esc(roleName('mason'))}</b></span></div>
      <p class="why">${esc(why)}</p>
      <div class="row"><button class="btn btn-big grow" id="p-build" ${ready ? '' : 'disabled'}>${esc(T('Build the statue'))}</button><button class="btn btn-ghost" id="p-close">${esc(T('Close'))}</button></div>`);
    $('p-close').onclick = closePanel;
    $('p-build').onclick = () => {
      if (!ready) return;
      changeMoney(-cost, true); toast(`-${cost} 🪙`, 'bad');
      S.statues[i] = { status: 'building', startedAt: Date.now() }; save(); closePanel(); A.play('hammer');
      runSteps(nar(D.STATUE.start), null);
    };
  }
  function tickStatues() {
    Object.keys(S.statues).forEach(i => {
      const st = S.statues[i];
      if (st.status === 'building' && Date.now() - st.startedAt >= D.STATUE.buildSec * 1000 && mode === 'world') {
        st.status = 'built'; save(); syncWorld(); A.play('unlock');
        runSteps(nar(D.STATUE.built), null);
      }
    });
  }

  /* ================= missions ================= */
  function assign(m) {
    const used = new Set();
    return m.needs.map(need => {
      const cands = crew().filter(n => n.expert.role === need.role && exLevel(n.id) >= need.level && !used.has(n.id)).sort((a, b) => a.expert.fee - b.expert.fee);
      if (!cands.length) return null;
      used.add(cands[0].id); return cands[0];
    });
  }
  const totalCost = m => m.cost + assign(m).reduce((s, n) => s + (n ? n.expert.fee : 0), 0);

  function openMission(m) {
    const ms = mstate(m.id);
    if (ms.status === 'built' || ms.status === 'building') { openBuilding(m); return; }
    const team = assign(m), cost = totalCost(m);
    const rows = m.needs.map((need, i) => {
      const who = team[i], r = D.ROLES[need.role];
      const have = crew().filter(n => n.expert.role === need.role);
      let note = who ? T('{name} {stars} · fee {fee}', { name: who.name, stars: stars(exLevel(who.id)), fee: who.expert.fee })
        : have.length ? T('{name} is only {stars}. Train up or find another.', { name: have[0].name, stars: stars(exLevel(have[0].id)) })
          : T('Nobody in your crew. Find a {role} and clear their fog.', { role: r.name.toLowerCase() });
      return `<li class="${who ? 'ok' : 'missing'}"><span class="ri">${r.icon}</span><div><b>${esc(r.name)} ${stars(need.level)}</b><small>${esc(note)}</small></div><span>${who ? '✓' : '✗'}</span></li>`;
    }).join('');
    const ready = team.every(Boolean) && S.money >= cost;
    let why = '';
    if (!team.every(Boolean)) why = T('Your crew is missing someone.'); else if (S.money < cost) why = T('You need {n} more coins.', { n: cost - S.money });
    panel(`
      <p class="eyebrow">${esc(T('Mission · {region}', { region: regionName(m.region) }))}</p>
      <h2>${esc(m.name)}</h2>
      <img class="mprev" src="img/preview-${m.id}.jpg" alt="${esc(T('How the finished {name} will look', { name: m.name }))}">
      <p>${esc(m.blurb)}</p>
      <ul class="needs">${rows}</ul>
      <div class="costrow"><span>${esc(T('Materials'))} <b>${m.cost}</b></span><span>${esc(T('Crew fees'))} <b>${cost - m.cost}</b></span><span>${esc(T('Total'))} <b>${cost} 🪙</b></span><span>${esc(T('You have'))} <b>${S.money} 🪙</b></span></div>
      ${m.income.rate ? `<p class="spot">${esc(T('Once built it pays about {rate} coins a minute (holds up to {cap}). Collect them at the building.', { rate: m.income.rate, cap: m.income.cap }))}</p>` : `<p class="spot">${esc(T('Once built, the fog lifts from the whole Valley.'))}</p>`}
      <p class="why">${esc(why)}</p>
      <div class="row"><button class="btn btn-big grow" id="p-build" ${ready ? '' : 'disabled'}>${esc(T('Start building'))}</button><button class="btn btn-ghost" id="p-close">${esc(T('Close'))}</button></div>`);
    $('p-close').onclick = closePanel;
    $('p-build').onclick = () => { if (ready) startBuild(m, team, cost); };
  }

  function startBuild(m, team, cost) {
    changeMoney(-cost, true); toast(T('-{n} 🪙 building started', { n: cost }), 'bad');
    const ms = mstate(m.id);
    ms.status = 'building'; ms.startedAt = Date.now(); ms.crew = team.map(n => n.id);
    save(); closePanel(); syncWorld(); A.play('hammer');
    runSteps(nar(m.start), null);
  }

  let hammerAt = 0;
  function tickMissions(t) {
    D.MISSIONS.forEach(m => {
      const ms = S.missions[m.id];
      if (!ms || ms.status !== 'building') return;
      if (t - hammerAt > 700 && Math.abs(m.site.x - player.x) < 10 && Math.abs(m.site.y - player.y) < 9) { hammerAt = t; A.play(Math.random() < 0.3 ? 'saw' : 'hammer'); }
      if (Date.now() - ms.startedAt >= m.buildSec * 1000 && mode === 'world') finishBuild(m);
    });
  }
  function finishBuild(m) {
    const ms = mstate(m.id);
    ms.status = 'built'; ms.lastCollect = Date.now();
    const gains = [];
    (ms.crew || []).forEach(id => {
      const e = ex(id), before = exLevel(id), got = Math.round(m.xp * xpMult(id));
      e.xp += got;
      gains.push(T('{name} +{n} XP', { name: npcById(id).name, n: got }) + (exLevel(id) > before ? ' · ' + T('level up!') : ''));
    });
    const newRegion = m.unlocks < Wd.regions.length && m.unlocks >= S.unlocked ? m.unlocks : null;
    if (newRegion !== null) { S.unlocked = newRegion + 1; S.lesson = { level: newRegion, step: 0, intro: false }; }
    save(); syncWorld(); placeCrew(false);
    A.play('fanfare');
    const steps = nar(m.done);
    steps.push({ who: 'n', text: D.LINES.crewLearned }, { fn: () => gains.forEach((g, i) => setTimeout(() => toast(g, 'good'), i * 700)) });
    if (newRegion !== null) steps.push({ fn: () => { fogAnim = { region: newRegion, t0: performance.now() }; A.play('fog'); A.play('unlock'); } });
    if (m.lift) steps.push({ who: 'n', text: m.lift });
    runSteps(steps, null);
  }

  function pending(m) {
    const ms = S.missions[m.id]; if (!ms || ms.status !== 'built' || !m.income.rate) return 0;
    return Math.min(m.income.cap, Math.floor(m.income.rate * (Date.now() - ms.lastCollect) / 60000));
  }
  function openBuilding(m) {
    const ms = mstate(m.id);
    if (ms.status === 'building') {
      const p = Math.min(100, Math.round((Date.now() - ms.startedAt) / (m.buildSec * 10)));
      panel(`<p class="eyebrow">${esc(T('Under construction'))}</p><h2>${esc(m.name)}</h2><img class="mprev" src="img/preview-${m.id}.jpg" alt=""><div class="bar"><span style="width:${p}%"></span></div><p>${esc(T('{p}% done. {names} are hard at work.', { p, names: (ms.crew || []).map(id => npcById(id).name).join(T(' and ')) }))}</p><div class="row"><button class="btn btn-ghost grow" id="p-close">${esc(T('Close'))}</button></div>`);
      $('p-close').onclick = closePanel; return;
    }
    const p = pending(m);
    const train = m.id === 'school' ? `<h3>${esc(T('Train an expert · 30 🪙'))}</h3><p class="spot">${esc(T('A lesson gives +60 XP, times their clarity bonus.'))}</p><div class="trainlist">${crew().map(n => `<button class="choice" data-train="${n.id}" ${S.money < 30 ? 'disabled' : ''}>${D.ROLES[n.expert.role].icon} ${esc(n.name)} ${stars(exLevel(n.id))} <small>+${Math.round(60 * xpMult(n.id))} XP</small></button>`).join('') || `<p class="spot">${esc(T('Nobody in your crew yet.'))}</p>`}</div>` : '';
    panel(`
      <p class="eyebrow">${esc(T('Your investment'))}</p>
      <h2>${esc(m.name)}</h2>
      <img class="mprev" src="img/preview-${m.id}.jpg" alt="">
      <p>${esc(T('Pays {rate} coins a minute, holds up to {cap}.', { rate: m.income.rate, cap: m.income.cap }))}</p>
      <p class="big">${esc(T('Stored: {n} 🪙', { n: p }))}</p>
      <div class="row"><button class="btn btn-big grow" id="p-collect" ${p ? '' : 'disabled'}>${esc(T('Collect {n} 🪙', { n: p }))}</button><button class="btn btn-ghost" id="p-close">${esc(T('Close'))}</button></div>
      ${train}`);
    $('p-close').onclick = closePanel;
    $('p-collect').onclick = () => { const got = pending(m); ms.lastCollect = Date.now(); S.flags.collected = true; changeMoney(got); A.play('coins'); openBuilding(m); };
    document.querySelectorAll('[data-train]').forEach(b => b.onclick = () => {
      if (S.money < 30) return;
      const id = b.dataset.train, before = exLevel(id);
      changeMoney(-30); ex(id).xp += Math.round(60 * xpMult(id)); save();
      A.play('good'); toast(T('{name} +{n} XP', { name: npcById(id).name, n: Math.round(60 * xpMult(id)) }) + (exLevel(id) > before ? ' · ' + T('level up!') : ''), 'good');
      openBuilding(m);
    });
  }

  /* ================= panels ================= */
  function panel(html) {
    A.play('open'); hidePreview();
    $('panel-box').innerHTML = html; $('panel').hidden = false; mode = 'panel';
  }
  function closePanel() { if ($('panel').hidden) return; $('panel').hidden = true; mode = 'world'; A.play('close'); updateHud(); }

  function showBook() {
    const items = D.FALLACIES.map(f => {
      const n = S.spotted[f.id] || 0, fails = S.fails[f.id] || 0;
      return n ? `<div class="bcard">${f.img ? `<img src="${f.img}" alt="">` : `<div class="bicon">${f.icon}</div>`}<b>${f.icon} ${esc(f.nick)}</b><p>${esc(f.one)}</p><p class="spot">${esc(f.spot)}</p><small>${esc(T('Spotted {n}×', { n }))}${fails ? ' · ' + esc(T('fooled {n}×', { n: fails })) : ''}</small></div>`
        : `<div class="bcard locked">${f.img ? `<img src="${f.img}" alt="">` : `<div class="bicon">❔</div>`}<b>❔ ${esc(T('Not yet'))}</b><p>${esc(fails ? T('This one fooled you. Try again.') : T('Find this trick somewhere in the Valley.'))}</p></div>`;
    }).join('');
    panel(`<div class="row between"><h2>${esc(T('Trick book'))}</h2><button class="btn btn-ghost btn-sm" id="p-close">${esc(T('Back'))}</button></div><div class="book-grid">${items}</div>`);
    $('p-close').onclick = closePanel;
  }

  function showCrew() {
    const rows = crew().map(n => {
      const e = ex(n.id), lvl = exLevel(n.id), nextNeed = D.XP_LEVELS[lvl] || null;
      const pct = nextNeed ? Math.round((e.xp - D.XP_LEVELS[lvl - 1]) / (nextNeed - D.XP_LEVELS[lvl - 1]) * 100) : 100;
      const ally = isAlly(n), kept = S.allyShares[n.id] || 0;
      return `<li class="${ally ? 'ally' : ''}"><span class="ri">${D.ROLES[n.expert.role].icon}</span><div><b>${esc(n.name)}</b>${ally ? ` <span class="tag">⭐ ${esc(T('True ally'))}</span>` : ''} · ${esc(roleName(n.expert.role))} ${stars(lvl)}<div class="bar"><span style="width:${pct}%"></span></div><small>${esc(T('{xp} XP · fee {fee} · fog cleared {a}/{b} · learns ×{m}', { xp: e.xp, fee: n.expert.fee, a: e.cleared, b: n.expert.fog.length, m: xpMult(n.id).toFixed(1) }))}${kept ? ' · ' + esc(T('kept {n} coins from collecting', { n: kept })) : ''}</small></div></li>`;
    }).join('');
    const foggy = npcs.filter(n => n.expert && S.refog[n.id]).map(n => `<li class="missing"><span class="ri">${D.ROLES[n.expert.role].icon}</span><div><b>${esc(n.name)}</b> · ${esc(roleName(n.expert.role))} <small>${esc(T('A preacher fogged their head again. Find them in {region} and clear it.', { region: regionName(n.region) }))}</small></div></li>`).join('');
    const known = npcs.filter(n => n.expert && n.region < S.unlocked && !S.refog[n.id] && !(S.experts[n.id] && S.experts[n.id].crew)).map(n => `<li class="missing"><span class="ri">${D.ROLES[n.expert.role].icon}</span><div><b>${esc(n.name)}</b> · ${esc(roleName(n.expert.role))} <small>${esc(T('Not yet convinced. Find them in {region}.', { region: regionName(n.region) }))}</small></div></li>`).join('');
    panel(`<div class="row between"><h2>${esc(T('Your crew'))}</h2><button class="btn btn-ghost btn-sm" id="p-close">${esc(T('Back'))}</button></div>
      <ul class="needs">${rows || `<li><div>${esc(T('Nobody yet. Experts join when you clear the first fog from their head.'))}</div></li>`}</ul>
      ${foggy ? `<p class="eyebrow">${esc(T('Fogged by the Grey Order'))}</p><ul class="needs">${foggy}</ul>` : ''}
      ${known ? `<p class="eyebrow">${esc(T('Experts you have heard of'))}</p><ul class="needs">${known}</ul>` : ''}
      <p class="spot">${esc(T('Each cleared fog makes an expert learn 50% faster from building. The Engineering School adds another 50%.'))}</p>
      <p class="spot">${esc(T('Clear every fog from an expert and they become a true ally. Preachers cannot fool a true ally, and allies collect coins from your buildings for you. They keep one coin in five.'))}</p>`);
    $('p-close').onclick = closePanel;
  }

  function showGoals() {
    const lv = currentLevel(), m = lv.mission ? mission(lv.mission) : null;
    const focus = lv.focus.map(id => fallacy(id)).map(f => `${f.icon} ${esc(f.nick)}`).join(', ');
    const info = trackerInfo();
    const tasks = allTasks().filter(t => npcById(t.giver).region < S.unlocked && S.tasks[t.id] && S.tasks[t.id] !== 'done')
      .map(t => `<li><span class="ri">${S.tasks[t.id] === 'found' ? '🪙' : '📋'}</span><div><b>${esc(t.title)}</b><small>${esc(S.tasks[t.id] === 'found' ? T('Done! Go back to {name} for {n} coins.', { name: npcById(t.giver).name, n: t.pay }) : t.active[0])}</small></div></li>`).join('');
    const carry = S.carry && S.carry.kind === 'job' ? `<li><span class="ri">📦</span><div><b>${esc(D.JOBS[S.carry.id].title)}</b><small>${esc(D.JOBS[S.carry.id].steps[1])}</small></div></li>` : '';
    const inv = D.MISSIONS.filter(x => built(x.id) && x.income.rate).map(x => `<li><span class="ri">🏛️</span><div><b>${esc(x.name)}</b><small>${esc(T('{rate}/min · {n} stored', { rate: x.income.rate, n: pending(x) }))}</small></div></li>`).join('');
    const refusing = npcs.filter(n => S.refuse[n.id]).map(n => `<li class="missing"><span class="ri">✗</span><div><b>${esc(n.name)}</b><small>${esc(T('Refuses to work with you. Answer the preacher\'s argument.'))}</small></div></li>`).join('');
    const live = preachers.filter(p => p.phase !== 'gone');
    const log = (S.allyLog || []).map(l => `<li><span class="ri">🪙</span><div><b>${esc(npcById(l.who).name)}</b><small>${esc(T('{place}: {got} coins. You got {mine}, they kept {share}.', { place: mission(l.m).name, got: l.got, mine: l.mine, share: l.share }))}</small></div></li>`).join('');
    const order = S.unlocked >= D.ORDER.fromLevel ? `<p class="eyebrow">${esc(T('The Grey Order'))}</p><p class="spot">${esc(live.length ? T('{n} preacher(s) on the move. Open the map to see them.', { n: live.length }) : T('No preacher is out right now. Statues of Aristotle keep them away.'))}</p>${refusing ? `<ul class="needs">${refusing}</ul>` : ''}` : '';
    panel(`<div class="row between"><h2>${esc(T('Goals'))}</h2><button class="btn btn-ghost btn-sm" id="p-close">${esc(T('Back'))}</button></div>
      <p class="eyebrow">${esc(T('Level {n} · {region}', { n: S.unlocked, region: regionName(lv.region) }))}</p>
      ${m ? `<p><b>${esc(T('Mission:'))}</b> ${esc(m.name)} — ${esc(objectiveText())}</p>` : `<p><b>${esc(objectiveText())}</b></p>`}
      <p class="spot">${esc(T('Tricks in this area:'))} ${focus}</p>
      ${info ? `<p class="eyebrow">${esc(T('Right now'))}</p><p><b>${esc(info.title)}</b>: ${esc(info.step)}</p>` : ''}
      ${order}
      <p class="eyebrow">${esc(T('Jobs you accepted'))}</p><ul class="needs">${carry + tasks || `<li><div>${esc(T('None yet. People with a ! have work for you, and job spots like the buckets pay every time.'))}</div></li>`}</ul>
      <p class="eyebrow">${esc(T('Investments'))}</p><ul class="needs">${inv || `<li><div>${esc(T('Nothing built yet.'))}</div></li>`}</ul>
      ${log ? `<p class="eyebrow">${esc(T('Collected by your allies'))}</p><ul class="needs">${log}</ul>` : ''}`);
    $('p-close').onclick = closePanel;
  }

  function showEnd() {
    if (!S.ended) { mode = 'world'; return; }
    mode = 'end'; $('end').hidden = false;
    const allies = crew().filter(isAlly).map(n => n.name).join(', ');
    $('end-stats').innerHTML = `<p class="big">${esc(T('Coins earned: {a} · lost to tricks: {b}', { a: S.stats.earned, b: S.stats.lost }))}</p><p>${esc(T('Fallacies spotted: {a} of {b}. Crew: {list}.', { a: spottedCount(), b: D.FALLACIES.length, list: crew().map(n => n.name).join(', ') }))}</p>${allies ? `<p>${esc(T('True allies: {list}.', { list: allies }))}</p>` : ''}<p>${esc(T('Heads fogged by the Grey Order: {a} · cleared again: {b}', { a: S.orderStats.fogged, b: S.orderStats.cleared }))}</p>`;
    $('end-cards').innerHTML = D.FALLACIES.filter(f => S.spotted[f.id]).map(f => `<div class="mini">${f.img ? `<img src="${f.img}" alt="">` : `<div class="bicon">${f.icon}</div>`}<span>${f.icon} ${esc(f.nick)}</span></div>`).join('');
  }

  /* ================= input ================= */
  function pressA() {
    if (mode === 'modal') { modalPress(); return; }
    if (mode === 'world') interact();
    else if (mode === 'dialog') { if (!$('dlg-choices').hidden) return; if ($('scene').hidden) next(); else { $('scene').hidden = true; next(); } }
    else if (mode === 'panel' && !$('card').hidden) closeCard();
  }

  document.querySelectorAll('.dpad [data-dir]').forEach(b => {
    const dir = b.dataset.dir;
    const down = e => { e.preventDefault(); A.unlock(); held = dir; if (mode === 'world') tryMove(dir); };
    const up = () => { if (held === dir) held = null; };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  });
  $('btn-a').addEventListener('click', () => { A.unlock(); pressA(); });
  $('dlg-next').addEventListener('click', pressA);
  $('dlg-text').addEventListener('click', () => { if (mode === 'dialog' && $('dlg-choices').hidden) next(); });
  $('scene-next').addEventListener('click', pressA);
  $('card-btn').addEventListener('click', closeCard);
  $('start').addEventListener('click', startGame);
  $('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  $('reset').addEventListener('click', () => {
    if (!window.confirm(T('Start again from the beginning? Your coins, crew and buildings will be lost.'))) return;
    const name = S.name; S = migrate(DEFAULT()); S.name = ''; save(); pushSave();
    preachers.length = 0; simQueue.length = 0; bird = null;
    player.x = player.fx = player.tx = S.x; player.y = player.fy = player.ty = S.y; syncWorld(); renderTitle();
    $('name-input').value = name;
  });
  $('hud-book').addEventListener('click', () => { if (mode === 'world') showBook(); else if (mode === 'panel') closePanel(); });
  $('hud-crew').addEventListener('click', () => { if (mode === 'world') showCrew(); else if (mode === 'panel') closePanel(); });
  $('hud-goals').addEventListener('click', () => { if (mode === 'world') showGoals(); else if (mode === 'panel') closePanel(); });
  $('tracker').addEventListener('click', () => { if (mode === 'world') showGoals(); });
  $('alert').addEventListener('click', () => { const b = $('minimap-box'); b.hidden = false; renderMini(); });
  $('hud-map').addEventListener('click', () => { const b = $('minimap-box'); b.hidden = !b.hidden; if (!b.hidden) renderMini(); A.play('open'); });
  $('hud-zoom').addEventListener('click', () => { if (mode !== 'title') toggleZoom(); });
  $('hud-sound').addEventListener('click', () => { S.sound = !S.sound; A.settings.sfx = S.sound; save(); updateHud(); A.play('good'); });
  $('hud-voice').addEventListener('click', () => { S.voice = !S.voice; A.settings.voice = S.voice && voiceAvailable(); if (!S.voice) A.stop(); save(); updateHud(); });
  $('hud-home').addEventListener('click', () => { if (mode === 'world') renderTitle(); });
  $('end-close').addEventListener('click', () => { $('end').hidden = true; mode = 'world'; });
  $('panel').addEventListener('click', e => { if (e.target === $('panel')) closePanel(); });

  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  document.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (mode === 'modal' && modal) {   // a scene takes every key: Esc leaves, the rest go to the game
      if (e.key === 'Tab') return;
      e.preventDefault(); A.unlock();
      if (e.key === 'Escape') closeScene();
      else if (e.key === 'Enter' || e.key === ' ') modalPress();
      else if (modal.scene.key && !modal.result) modal.scene.key(e.key, modalT());
      return;
    }
    if (KEYS[e.key]) { e.preventDefault(); A.unlock(); held = KEYS[e.key]; if (mode === 'world') tryMove(held); }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'e') { e.preventDefault(); A.unlock(); pressA(); }
    if (e.key === 'Escape') { if (mode === 'panel' && !$('card').hidden) closeCard(); else if (mode === 'panel') closePanel(); else hidePreview(); }
    if (mode === 'world') { if (e.key === 'b') showBook(); if (e.key === 'c') showCrew(); if (e.key === 'g') showGoals(); if (e.key === 'm') $('hud-map').click(); if (e.key === 'z') toggleZoom(); }
  });
  document.addEventListener('keyup', e => { if (KEYS[e.key] === held) held = null; });

  /* ================= go ================= */
  syncWorld();
  window.FogDebug = {
    go(x, y, dir) { placePlayer(x, y, dir); camNow = null; updateHud(); },
    money(n) { changeMoney(n); }, unlock(n) { S.unlocked = n; save(); syncWorld(); renderMini(); },
    state: () => ({ mode, x: player.x, y: player.y, money: S.money, unlocked: S.unlocked, crew: crew().map(n => n.id), missions: S.missions, tasks: S.tasks, tricks: S.tricks, carry: S.carry, follower: follower(), tracker: trackerInfo(), refog: S.refog, refuse: S.refuse, statues: S.statues, preachers: preachers.map(p => ({ id: p.id, x: p.x, y: p.y, phase: p.phase, target: p.target, converts: p.converts })), lang: I ? I.lang : 'en', missing: I ? I.missing() : [] }),
    save: () => S, press: pressA, next, interact, place: () => placeCrew(true), npc: id => { const n = npcById(id); return { x: n.x, y: n.y, path: n.path && n.path.length }; },
    choose: i => { const b = $('dlg-choices').querySelectorAll('button')[i]; if (b) b.click(); }, finishBuild: id => finishBuild(mission(id)), finishAction: () => { if (action) action.t0 -= 60000; }, preview: id => showPreview(mission(id)),
    joinCrew: id => { const e = ex(id); e.crew = true; e.cleared = Math.max(e.cleared, 1); save(); placeCrew(false); updateHud(); },
    spawnPreacher: () => { S.orderSince = S.orderSince || Date.now(); spawnPreacher(); }, preach: () => { preachers.forEach(p => { p.until = 0; }); },
    fastPreachers: () => preachers.forEach(p => { if (p.path) { while (p.path.length > 1) { const [x, y] = p.path.shift(); p.x = p.fx = x; p.y = p.fy = y; } } }),
    convert: id => convert(npcById(id)), protectedNpc: id => { const n = npcById(id); return protectedAt(n.x, n.y); }, canTarget: id => canTarget(npcById(id)), statue: i => { S.statues[i] = { status: 'built', startedAt: 0 }; save(); syncWorld(); }, openStatue,
    lesson: () => ({ lesson: S.lesson, goal: lessonGoal(), queued: simQueue.length, bird: !!bird }), sim: key => simEvent(key), isAlly: id => isAlly(npcById(id)),
    allies: () => ({ errands: S.errands, shares: S.allyShares, log: S.allyLog }), errandNow: () => { S.lastErrand = 0; allyAt = 0; },
    city: () => ({ city: S.city, throne: S.throne, ended: S.ended }), cam: () => Object.assign({ dpr, canvas: [canvas.width, canvas.height], region: lastRegion }, cam), zoom: toggleZoom,
    vignette: (kind, text) => showVignette({ kind, text }, D.FLAVOR[kind] || kind), game: (id, extra) => startMiniGame(Object.assign({ id }, D.GAMES[id]), null, extra), games: () => S.games,
    modal: () => modal ? { result: modal.result, caption: $('vig-text').textContent, buttons: [...$('vig-ui').querySelectorAll('button')].map(b => b.textContent), close: $('vig-close').textContent, t: modalT() } : null,
    tap: (x, y) => { if (modal && modal.scene.pointer) modal.scene.pointer(x, y, modalT()); }, mkey: k => { if (modal && modal.scene.key) modal.scene.key(k, modalT()); }, mbutton: i => { const b = $('vig-ui').querySelectorAll('button')[i]; if (b) b.click(); }, closeScene, flag: k => { S.flags[k] = true; save(); syncWorld(); }
  };
  renderTitle();
  requestAnimationFrame(loop);
})();
