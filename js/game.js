/* Fog of Fallacy - engine: movement, camera, talking, tricks, tasks, jobs, experts, missions, saving. */

(function () {
  'use strict';

  const D = window.FOG, Wd = window.World, A = window.Audio2, TS = Wd.TS;
  const VIEW_W = 13, VIEW_H = 11;
  const KEY = 'fog-of-fallacy-v4';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  canvas.width = VIEW_W * TS; canvas.height = VIEW_H * TS;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ================= state ================= */
  const START = D.LEVELS[0].start;
  const DEFAULT = () => ({
    name: '', look: 0, money: D.START_MONEY, x: START.x, y: START.y, unlocked: 1, seen: {},
    spotted: {}, fails: {}, tricks: {}, tasks: {}, jobs: {}, experts: {}, missions: {}, flags: {},
    sound: true, voice: true, savedAt: 0, ended: false, stats: { earned: 0, lost: 0 }, npcPos: {}, carry: null
  });
  let S = load();
  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return Object.assign(DEFAULT(), JSON.parse(r)); } catch (e) { }
    return DEFAULT();
  }
  let saveTimer = null;
  function save() {
    S.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushSave, 1500);
  }
  const slug = () => (S.name || 'player').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'player';
  async function pushSave() {
    if (!S.name) return;
    try { await fetch('/api/saves/' + slug(), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(S) }); } catch (e) { }
  }
  async function pullSave() {
    try {
      const r = await fetch('/api/saves/' + slug(), { cache: 'no-store' });
      if (r.status !== 200) return false;
      const remote = await r.json();
      if (remote && remote.savedAt > (S.savedAt || 0)) { S = Object.assign(DEFAULT(), remote); return true; }
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

  function ex(id) {
    const n = npcById(id), base = n.expert;
    return S.experts[id] || (S.experts[id] = { cleared: 0, crew: false, xp: D.XP_LEVELS[base.level - 1] });
  }
  const levelOf = xp => { let l = 1; D.XP_LEVELS.forEach((need, i) => { if (xp >= need) l = i + 1; }); return l; };
  const exLevel = id => levelOf(ex(id).xp);
  const xpMult = id => (1 + 0.5 * ex(id).cleared) * (built('school') ? 1.5 : 1);
  const crew = () => npcs.filter(n => n.expert && S.experts[n.id] && S.experts[n.id].crew);
  const stars = l => '★'.repeat(l) + '☆'.repeat(5 - l);

  function worldState() { const b = {}; D.MISSIONS.forEach(m => { if (built(m.id)) b[m.id] = true; }); return { flags: S.flags, unlocked: S.unlocked, built: b }; }
  function syncWorld() { Wd.setState(worldState()); }

  /* what follows the player: a found goat or canary until it is handed back */
  const follower = () => { const t = allTasks().find(t => t.follow && S.tasks[t.id] === 'found'); return t ? t.follow : null; };

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
  function toast(text, kind) {
    const box = $('toasts'), el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 1600); setTimeout(() => el.remove(), 2100);
  }

  /* ================= title ================= */
  let mode = 'title';   // title | world | dialog | panel | action | end
  function renderTitle() {
    mode = 'title'; A.stop();
    $('title').hidden = false; $('play').hidden = true; $('end').hidden = true; $('panel').hidden = true;
    const looks = $('looks'); looks.innerHTML = '';
    D.LOOKS.forEach((spec, i) => {
      const b = document.createElement('button'); b.className = 'look' + (i === S.look ? ' on' : ''); b.type = 'button'; b.setAttribute('aria-label', 'Look ' + (i + 1));
      const c = document.createElement('canvas'); c.width = 64; c.height = 64; b.appendChild(c);
      Wd.drawPerson(c.getContext('2d'), 32, 58, spec, 'down', 0, 1.9);
      b.addEventListener('click', () => { S.look = i; looks.querySelectorAll('.look').forEach(x => x.classList.remove('on')); b.classList.add('on'); A.play('talk'); });
      looks.appendChild(b);
    });
    $('name-input').value = S.name || '';
    const started = !!S.name;
    $('start').textContent = started ? 'Keep playing' : 'Start';
    $('reset').hidden = !started;
  }

  async function startGame() {
    A.unlock();
    S.name = ($('name-input').value.trim() || 'You').slice(0, 16);
    $('start').disabled = true;
    await pullSave();
    $('start').disabled = false;
    S.name = S.name || 'You';
    save();
    A.settings.sfx = S.sound; A.settings.voice = S.voice;
    player.x = player.fx = player.tx = S.x; player.y = player.fy = player.ty = S.y; player.moving = false; trail.length = 0;
    syncWorld(); applyNpcPos(); placeCrew(false);
    $('title').hidden = true; $('play').hidden = false;
    mode = 'world';
    updateHud();
    checkRegionIntro();
  }

  function updateHud() {
    $('hud-money').textContent = S.money;
    $('hud-insight').textContent = spottedCount() + ' / ' + D.FALLACIES.length;
    $('hud-sound').textContent = S.sound ? '🔔' : '🔕';
    $('hud-voice').textContent = S.voice ? '🗣️' : '🤐';
    const r = Wd.regionAt(player.x, player.y);
    $('hud-region').textContent = r >= 0 ? Wd.regions[r].name : 'The Valley';
    $('objective').textContent = objectiveText();
    updateTracker();
  }
  function objectiveText() {
    const lv = currentLevel(), m = mission(lv.mission), ms = S.missions[m.id] || {};
    if (S.ended) return 'The Valley is clear. Keep exploring, or start again from the title.';
    if (ms.status === 'building') return `Building ${m.name}…`;
    const need = totalCost(m);
    const roles = m.needs.map(n => { const who = assign(m)[m.needs.indexOf(n)]; return D.ROLES[n.role].icon + (who ? '✓' : '✗'); }).join(' ');
    return `${m.name}: ${S.money}/${need} 🪙 · ${roles}`;
  }

  /* ---- the small-task tracker: a pulsing bulb with the next step ---- */
  function trackerInfo() {
    if (S.carry && S.carry.kind === 'job') { const j = D.JOBS[S.carry.id]; return { title: j.title, step: j.steps[1] }; }
    if (S.carry && S.carry.kind === 'task') { const t = D.TASKS[S.carry.id]; const st = S.tasks[S.carry.id]; return { title: t.title, step: st === 'found' ? `Take it back to ${npcById(t.giver).name} for ${t.pay} coins.` : t.active[0] }; }
    const f = allTasks().find(t => t.follow && S.tasks[t.id] === 'found');
    if (f) return { title: f.title, step: `Lead ${f.follow === 'goat' ? 'Pickle' : 'Goldie'} back to ${npcById(f.giver).name} for ${f.pay} coins.` };
    const t = allTasks().find(t => (S.tasks[t.id] === 'active' || S.tasks[t.id] === 'found') && npcById(t.giver).region < S.unlocked);
    if (t) return { title: t.title, step: S.tasks[t.id] === 'found' ? `Go back to ${npcById(t.giver).name} for ${t.pay} coins.` : t.active[0] };
    return null;
  }
  function updateTracker() {
    const info = trackerInfo(), el = $('tracker');
    if (!info) { el.hidden = true; return; }
    el.hidden = false; $('tracker-title').textContent = info.title; $('tracker-step').textContent = info.step;
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
    if (!Wd.walkable(nx, ny) || npcAt(nx, ny)) return;
    trail.unshift([player.x, player.y]); if (trail.length > 3) trail.pop();
    player.moving = true; player.t = 0; player.tx = nx; player.ty = ny;
    hidePreview();
  }

  function update(dt, t) {
    tickMissions(t); moveNpcs(dt); tickAction(t);
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

  /* ================= render ================= */
  let fogAnim = null;  // { region, t0 }
  let npcAnim = null;  // { id, kind } while an expert acts out a line
  let cam = { x: 0, y: 0 };
  function render(t) {
    const camX = Math.max(0, Math.min(Wd.W * TS - canvas.width, player.fx * TS + TS / 2 - canvas.width / 2));
    const camY = Math.max(0, Math.min(Wd.H * TS - canvas.height, player.fy * TS + TS / 2 - canvas.height / 2));
    cam = { x: camX, y: camY };
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    ctx.fillStyle = '#14262B'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = y0; y <= y0 + VIEW_H; y++) for (let x = x0; x <= x0 + VIEW_W; x++) {
      if (x >= Wd.W || y >= Wd.H) continue;
      Wd.drawTile(ctx, Wd.at(x, y), x, y, x * TS - camX, y * TS - camY, t);
    }
    const inView = (x, y, w, h) => x + w >= x0 && x <= x0 + VIEW_W + 1 && y + h >= y0 && y <= y0 + VIEW_H + 1;
    Wd.structures.forEach(s => { if (inView(s.x, s.y, s.w, s.h)) Wd.drawStructure(ctx, s, camX, camY); });
    D.MISSIONS.forEach(m => {
      if (!inView(m.site.x, m.site.y, m.site.w, m.site.h)) return;
      const ms = S.missions[m.id] || {};
      if (m.region < S.unlocked && ms.status !== 'built' && ms.status !== 'building') Wd.drawGlow(ctx, m.site.x * TS - camX, m.site.y * TS - camY, m.site.w * TS, m.site.h * TS, t, hover && hover.id === m.id);
      if (!(built(m.id) && m.kind === 'bridge')) Wd.drawMission(ctx, m, camX, camY, ms, t);
    });
    Wd.decor.forEach(d => { if (inView(d.x, d.y, 1, 1)) Wd.drawDecor(ctx, d, camX, camY, t); });

    const people = npcs.filter(n => n.region < S.unlocked && inView(Math.floor(n.fx), Math.floor(n.fy), 2, 2)).map(n => ({ x: n.fx, y: n.fy, spec: n.spec, dir: n.dir, walk: n.walk || 0, npc: n }));
    people.push({ x: player.fx, y: player.fy, spec: D.LOOKS[S.look], dir: player.dir, walk: player.walk, me: true });
    const fol = follower();
    if (fol === 'goat' && trail.length) people.push({ x: trail[0][0], y: trail[0][1], goat: true });
    people.sort((a, b) => a.y - b.y);
    people.forEach(p => {
      const px = p.x * TS - camX + TS / 2, py = p.y * TS - camY + TS - 2;
      if (p.goat) { Wd.drawFollower(ctx, 'goat', px, py, t, player.dir); return; }
      Wd.drawPerson(ctx, px, py, p.spec, p.dir, p.walk, 1);
      if (p.me) {
        if (S.carry) Wd.drawItem(ctx, S.carry.item, px, py - 44, t);
        if (fol === 'canary') Wd.drawFollower(ctx, 'canary', px, py, t, player.dir);
        if (action) Wd.drawAction(ctx, action.kind, px, py, t, (t - action.t0) / action.dur, player.dir);
      }
      if (p.npc) {
        if (npcAnim && npcAnim.id === p.npc.id && mode === 'dialog') Wd.drawAction(ctx, npcAnim.kind, px, py, t, 0.5, p.npc.dir === 'left' ? 'left' : 'right');
        drawMarker(p.npc, px, py, t);
      }
    });

    // fog over locked regions
    Wd.regions.forEach((r, i) => {
      const anim = fogAnim && fogAnim.region === i ? Math.min(1, (t - fogAnim.t0) / 2500) : null;
      if (i < S.unlocked && anim === null) return;
      if (!inView(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1)) return;
      drawFog(r, camX, camY, t, anim === null ? 1 : 1 - anim);
    });
    if (fogAnim && t - fogAnim.t0 > 2600) fogAnim = null;
  }

  function drawMarker(n, px, py, t) {
    const bob = Math.sin(t / 250) * 3;
    let mark = null, color = '#F6B544';
    if (n.trick && !S.tricks[n.trick] && (!n.talk || S.flags['talked:' + n.id])) { mark = '!'; color = '#FF7B6B'; }
    else if (n.expert && !ex(n.id).crew) { mark = '?'; color = '#5FB3D9'; }
    else if (n.expert && ex(n.id).cleared < n.expert.fog.length) { mark = '?'; color = '#BFEBD6'; }
    else if (deliverFor(n) || jobDeliverFor(n)) { mark = '📦'; color = '#63C48F'; }
    else if (nextTask(n)) { mark = S.tasks[nextTask(n).id] === 'found' ? '🪙' : '!'; color = S.tasks[nextTask(n).id] ? '#63C48F' : '#F6B544'; }
    else if (n.trick && !S.tricks[n.trick]) { mark = '!'; color = '#F6B544'; }
    if (!mark) return;
    ctx.fillStyle = color; Wd.rr(ctx, px - 7, py - 52 + bob, 14, 17, 5); ctx.fill();
    ctx.fillStyle = '#2A2420'; ctx.font = 'bold 12px "Baloo 2", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(mark, px, py - 39 + bob);
  }

  function drawFog(r, camX, camY, t, alpha) {
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
    ctx.fillStyle = 'rgba(20,38,43,.75)'; ctx.font = 'bold 14px "Baloo 2", system-ui, sans-serif'; ctx.textAlign = 'center';
    const cx = Math.max(60, Math.min(canvas.width - 60, px + w / 2)), cy = Math.max(20, Math.min(canvas.height - 10, py + h / 2));
    if (px < canvas.width && px + w > 0 && py < canvas.height && py + h > 0) ctx.fillText('Fog of Fallacy', cx, cy);
    ctx.restore();
  }

  /* ---- site preview: hover with a mouse, tap on touch ---- */
  let hover = null;   // mission under the pointer
  function siteAtPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width * canvas.width + cam.x) / TS);
    const y = Math.floor(((e.clientY - rect.top) / rect.height * canvas.height + cam.y) / TS);
    const m = D.MISSIONS.find(m => x >= m.site.x && x < m.site.x + m.site.w && y >= m.site.y && y < m.site.y + m.site.h);
    if (!m || m.region >= S.unlocked || built(m.id)) return null;
    return m;
  }
  function showPreview(m) {
    hover = m;
    const box = $('preview'), stage = canvas.getBoundingClientRect();
    $('preview-img').src = 'img/preview-' + m.id + '.jpg'; $('preview-title').textContent = m.name;
    $('preview-text').textContent = `Costs ${m.cost} coins. Needs ${m.needs.map(n => (n.level > 1 ? stars(n.level) + ' ' : 'a ') + D.ROLES[n.role].name.toLowerCase()).join(', ')}.` + (m.income.rate ? ` Pays ${m.income.rate} coins a minute once built.` : ' Lifts the fog from the whole Valley.');
    box.hidden = false;
    const scale = stage.width / canvas.width;
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
  const MINI_COL = { G: '#82C773', T: '#2F7A44', F: '#A2703F', L: '#82C773', C: '#E2B93B', P: '#DCC79A', S: '#EBD9A8', K: '#C9BCA4', Q: '#A9A39A', W: '#5FB3D9', B: '#B08A5A', R: '#8E8A80', D: '#B08A5A', M: '#8B6A3E' };
  function renderMini() {
    for (let y = 0; y < Wd.H; y++) for (let x = 0; x < Wd.W; x++) { mctx.fillStyle = MINI_COL[Wd.at(x, y)] || '#000'; mctx.fillRect(x * 2, y * 2, 2, 2); }
    Wd.structures.forEach(s => { mctx.fillStyle = s.roof; mctx.fillRect(s.x * 2, s.y * 2, s.w * 2, s.h * 2); });
    Wd.regions.forEach((r, i) => { if (i >= S.unlocked) { mctx.fillStyle = 'rgba(190,205,205,.9)'; mctx.fillRect(r.x0 * 2, r.y0 * 2, (r.x1 - r.x0 + 1) * 2, (r.y1 - r.y0 + 1) * 2); } });
    D.MISSIONS.forEach(m => { if (m.region < S.unlocked) { mctx.fillStyle = built(m.id) ? '#63C48F' : '#F6B544'; mctx.fillRect(m.site.x * 2 - 1, m.site.y * 2 - 1, m.site.w * 2 + 2, m.site.h * 2 + 2); } });
    mctx.fillStyle = '#FF7B6B'; mctx.beginPath(); mctx.arc(player.x * 2 + 1, player.y * 2 + 1, 3, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.stroke();
  }

  function loop(t) {
    const dt = Math.min(50, t - lastTime); lastTime = t;
    update(dt, t);
    if (mode !== 'title') { render(t); if (mode === 'dialog') drawPortrait(t); if (!$('minimap-box').hidden && Math.floor(t / 250) !== Math.floor((t - dt) / 250)) renderMini(); }
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
    const n = npcById(who);
    portrait = { who, spec: who === 'you' ? D.LOOKS[S.look] : (n ? n.spec : D.LOOKS[S.look]), mute: false };
    drawPortrait(performance.now());
  }
  function drawPortrait(t) {
    if (!portrait || $('dlg').hidden) return;
    const c = $('dlg-portrait');
    const talking = !portrait.mute && (typing !== null || A.isSpeaking());
    Wd.drawFace(c.getContext('2d'), portrait.spec, t, talking, c.width, c.height);
  }

  function showLine(who, text, raw) {
    const n = npcById(who);
    $('dlg').hidden = false; $('scene').hidden = true;
    $('dlg').classList.toggle('narrator', who === 'n');
    $('dlg-name').textContent = who === 'n' ? '' : who === 'you' ? S.name : (n ? n.name : who);
    portraitFor(who);
    const el = $('dlg-text'); el.textContent = '';
    let i = 0;
    A.play('talk');
    A.say(text, who, who === 'n' ? 'narrator' : who === 'you' ? 'you' : (n && n.v) || 'man', raw || text);
    typingFull = text;
    typing = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i >= text.length) finishTyping(); }, 18);
  }
  function finishTyping() { if (!typing) return; clearInterval(typing); $('dlg-text').textContent = typingFull; typing = null; }

  function showChoice(options, menu, prompt, who) {
    $('dlg').hidden = false; $('scene').hidden = true;
    $('dlg').classList.remove('narrator');
    if (who && npcById(who)) { $('dlg-name').textContent = npcById(who).name; portraitFor(who); } else { $('dlg-name').textContent = S.name; portraitFor('you'); }
    if (portrait) portrait.mute = true;
    $('dlg-text').textContent = prompt || 'What do you say?';
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

  function endDialog() { $('dlg').hidden = true; $('scene').hidden = true; script = null; npcAnim = null; mode = 'world'; A.stop(); updateHud(); }

  /* ================= cards (lesson pop-ups) ================= */
  function card(opts) {
    const c = $('card');
    $('card-eyebrow').textContent = opts.eyebrow || ''; $('card-title').textContent = opts.title || '';
    const img = $('card-img'), big = $('card-icon');
    if (opts.img) { img.src = opts.img; img.hidden = false; big.hidden = true; } else { img.hidden = true; big.hidden = false; big.textContent = opts.icon || '✨'; }
    $('card-one').textContent = opts.one || ''; $('card-spot').textContent = opts.spot || '';
    $('card-answers').innerHTML = opts.answers || '';
    $('card-btn').textContent = opts.btn || 'OK';
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
    if (chosen) h += `<div class="ans ${ok ? 'right' : 'wrong'}"><span class="mark">${ok ? '✓' : '✗'}</span><div><small>You said</small>${esc(chosen)}</div></div>`;
    if (!ok && correct) h += `<div class="ans right"><span class="mark">✓</span><div><small>Better answer</small>${esc(correct)}</div></div>`;
    return h;
  }
  function lessonWin(fid, eyebrow, after, chosen) {
    const f = fallacy(fid);
    S.spotted[fid] = (S.spotted[fid] || 0) + 1; save();
    A.play('badge');
    card({ eyebrow: eyebrow || 'You spotted it!', title: f.icon + ' ' + f.nick, img: f.img, icon: f.icon, one: f.one, spot: f.spot, btn: 'Nice', kind: 'win', after, answers: answersHtml(chosen, null, true) });
  }
  function lessonFail(fid, eyebrow, after, chosen, correct) {
    const f = fallacy(fid);
    S.fails[fid] = (S.fails[fid] || 0) + 1; save();
    A.play('bad');
    card({ eyebrow: eyebrow || 'That was a trick', title: f.icon + ' ' + f.nick, img: f.img, icon: f.icon, one: f.one, spot: f.spot, btn: 'Try again', kind: 'fail', after, answers: answersHtml(chosen, correct, false) });
  }
  function lessonOops(after, chosen, correct) {
    const f = fallacy('adHominem');
    A.play('bad');
    card({ eyebrow: 'Hmm', title: f.icon + ' ' + f.nick, img: f.img, one: 'Name-calling is not an answer.', spot: 'Say why the argument is wrong instead. Insults give the other person a reason to stop listening.', btn: 'Try again', kind: 'fail', after, answers: answersHtml(chosen, correct, false) });
  }

  /* ================= talking ================= */
  function talkTo(n) {
    if (n.path) { n.path = null; n.fx = n.x; n.fy = n.y; n.walk = 0; }
    const jd = jobDeliverFor(n);
    if (jd) { deliverJob(jd, n); return; }
    const del = deliverFor(n);
    if (del) { completeDeliver(del, n); return; }
    if (n.trick && !S.tricks[n.trick] && (!n.talk || S.flags['talked:' + n.id])) { runTrick(n.trick); return; }
    if (n.expert) { talkExpert(n); return; }
    const task = nextTask(n);
    if (task) { handleTask(task, n); return; }
    let lines = n.talk || [];
    if (n.trick && S.tricks[n.trick] && n.after) lines = n.after;
    else if (n.afterTrick && S.tricks[n.afterTrick] && n.after) lines = n.after;
    else if (tasksOf(n).length && tasksOf(n).every(t => S.tasks[t.id] === 'done')) { const last = tasksOf(n)[tasksOf(n).length - 1]; lines = last.done || lines; }
    S.flags['talked:' + n.id] = true; save();
    if (!lines.length) lines = ['...'];
    runSteps(lines.map(text => ({ who: n.id, text })), null);
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
    else if (kind === 'fail') lessonFail(tr.fallacy, null, null, chosen, correct);
    else lessonOops(null, chosen, correct);
  }

  /* ---- experts ---- */
  function talkExpert(n) {
    const e = ex(n.id), fogs = n.expert.fog;
    if (!e.crew) { runFog(n, 0); return; }
    const opts = [];
    if (e.cleared < fogs.length) opts.push({ key: 'fog', text: `Ask about: ${fogs[e.cleared].topic || 'what is on your mind'}` });
    opts.push({ key: 'why', text: "Why aren't you working yet?" });
    opts.push({ key: 'work', text: 'Tell me about your craft.' });
    opts.push({ key: 'bye', text: 'Never mind.' });
    const lvl = exLevel(n.id), role = D.ROLES[n.expert.role].name;
    runSteps([{ choice: opts, menu: true, speaker: n.id, prompt: 'What do you want to talk about?' }], {
      branch: o => {
        if (o.key === 'fog') return [{ fn: () => runFog(n, e.cleared), stop: true }];
        if (o.key === 'why') return whyNotWorking(n).map(text => ({ who: n.id, text }));
        if (o.key === 'work') return [{ who: n.id, text: (n.expert.crew || ['Ready to work.'])[0] }, { fn: () => toast(`${D.ROLES[n.expert.role].icon} ${role} ${stars(lvl)} · fee ${n.expert.fee} · fog cleared ${e.cleared}/${fogs.length}`, 'good') }];
        return [{ who: n.id, text: 'Right you are.' }];
      }
    });
  }
  /* Every line here is fixed text so it can be recorded in the expert's own voice; numbers live in the HUD. */
  function whyNotWorking(n) {
    const L = D.LINES.why, lv = currentLevel(), m = mission(lv.mission), ms = S.missions[m.id] || {};
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
      const eyebrow = joined ? `${n.name} joins your crew!` : `${n.name} thinks clearer (+50% learning)`;
      lessonWin(fog.fallacy, eyebrow, () => { if (joined) toast(`👷 ${n.name} joined`, 'good'); updateHud(); placeCrew(true); }, chosen);
    } else lessonFail(fog.fallacy, n.name + ' is still foggy', null, chosen, correct);
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
      const steps = t.offer.map(text => ({ who: n.id, text })).concat([{ choice: [{ text: "Yes, I'll do it.", key: 'yes' }, { text: 'Not right now.', key: 'no' }] }]);
      runSteps(steps, {
        branch: o => o.key === 'yes'
          ? [{ who: n.id, text: t.accept }, { fn: () => { S.tasks[t.id] = 'active'; if (t.kind === 'deliver' && t.item) S.carry = { kind: 'task', id: t.id, item: t.item }; save(); toast('📋 ' + t.title, 'good'); A.play('open'); updateHud(); } }]
          : [{ who: n.id, text: 'Come back when you have time.' }],
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

  /* ---- decorations: task spots and repeatable jobs ---- */
  const FLAVOR = { goat: 'A goat. It looks at you. You look at it.', apples: 'A basket of apples under the trees.', scarecrow: 'A scarecrow, face down in the mud.', brokenfence: 'A fence rail hangs loose.',
    lamp: 'A street lamp.', lostsign: 'A wooden sign lying in the grass.', cart: 'An ore cart with a missing wheel.', canary: 'A small yellow bird, singing.', oar: 'An oar, half buried in sand.',
    bucket: 'Two buckets by the river.', broom: 'A broom leaning on a stall.', orepile: 'A heap of rock with glints of ore.', ropes: 'Coils of wet rope.', milk: 'The goats need milking.',
    boat: 'A boat. It bobs.', stall: 'A market stall. Bright things, high prices.', fountain: 'Cool water splashes.', cards: 'A card table. The cards look tired.', sign: 'A signpost.', bench: 'A bench. Nobody is sitting.',
    logs: 'Freshly cut timber.', tripod: 'A surveyor\'s tripod.', crate: 'A crate. Heavy.', pot2: 'A flower pot.', tollbox: 'The bridge toll box.' };
  const ACTION_MS = { hammer: 2600, dig: 2600, sweep: 2800, pick: 2200, sort: 2600, milk: 2400, coil: 2400, lift: 1800, light: 2200, call: 2200 };

  function useDecor(d) {
    if (d.mission) { openBuilding(mission(d.mission)); return; }
    const job = allJobs().find(j => j.spot === d.id);
    if (job) { doJob(job); return; }
    const task = allTasks().find(t => t.kind === 'spot' && t.target === d.id);
    if (task && S.tasks[task.id] === 'active') {
      if (task.item && S.carry) { runSteps(nar(D.LINES.handsFull), null); return; }
      startAction(task.anim || 'pick', ACTION_MS[task.anim] || 2200, () => {
        S.tasks[task.id] = 'found'; S.flags['task:' + task.id] = true;
        if (task.item) S.carry = { kind: 'task', id: task.id, item: task.item };
        save(); syncWorld(); updateHud();
        A.play(task.follow ? (task.follow === 'goat' ? 'goat' : 'bird') : 'good');
        toast(task.follow ? `${task.follow === 'goat' ? 'Pickle' : 'Goldie'} follows you!` : task.item ? 'Got it! Carry it back.' : 'Fixed!', 'good');
      });
      return;
    }
    runSteps(nar(FLAVOR[d.kind] || 'Nothing to do here.'), null);
  }

  /* ---- jobs: an animation at the spot, then pay, or carry something to a person who pays ---- */
  function doJob(job) {
    const last = S.jobs[job.id] || 0;
    if (last + job.cooldown * 1000 > Date.now()) { runSteps(nar(D.LINES.cooldown), null); return; }
    if (S.carry) { runSteps(nar(D.LINES.handsFull), null); return; }
    startAction(job.anim, ACTION_MS[job.anim] || 2400, () => {
      if (job.deliverTo) { S.carry = { kind: 'job', id: job.id, item: job.item }; save(); updateHud(); toast('Now ' + job.steps[1].charAt(0).toLowerCase() + job.steps[1].slice(1), 'good'); }
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
  function placeCrew(animate) {
    const lv = currentLevel(), m = mission(lv.mission), ms = S.missions[m.id] || {};
    const camp = m.camp || [];
    const wanted = crew().filter(n => { const need = m.needs.find(nd => nd.role === n.expert.role); return need && !S.ended && ms.status !== 'built' && exLevel(n.id) >= need.level; });
    const used = new Set();
    wanted.forEach(n => { const i = camp.findIndex(([x, y]) => x === n.x && y === n.y); if (i >= 0) used.add(i); });
    wanted.forEach(n => {
      if (camp.some(([x, y]) => x === n.x && y === n.y)) return;
      const i = camp.findIndex(([x, y], idx) => !used.has(idx) && !npcs.some(o => o !== n && o.x === x && o.y === y));
      if (i < 0) return;
      used.add(i);
      const [x, y] = camp[i];
      const facing = x < m.site.x ? 'right' : x >= m.site.x + m.site.w ? 'left' : y < m.site.y ? 'down' : 'up';
      sendNpc(n, x, y, facing, animate && n.region === m.region);
    });
    crew().filter(n => !wanted.includes(n)).forEach(n => sendNpc(n, n.home.x, n.home.y, n.home.dir, false));
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
      let note = who ? `${esc(who.name)} ${stars(exLevel(who.id))} · fee ${who.expert.fee}` : have.length ? `${esc(have[0].name)} is only ${stars(exLevel(have[0].id))}. Train up or find another.` : `Nobody in your crew. Find a ${r.name.toLowerCase()} and clear their fog.`;
      return `<li class="${who ? 'ok' : 'missing'}"><span class="ri">${r.icon}</span><div><b>${r.name} ${stars(need.level)}</b><small>${note}</small></div><span>${who ? '✓' : '✗'}</span></li>`;
    }).join('');
    const ready = team.every(Boolean) && S.money >= cost;
    let why = '';
    if (!team.every(Boolean)) why = 'Your crew is missing someone.'; else if (S.money < cost) why = `You need ${cost - S.money} more coins.`;
    panel(`
      <p class="eyebrow">Mission · ${esc(Wd.regions[m.region].name)}</p>
      <h2>${esc(m.name)}</h2>
      <img class="mprev" src="img/preview-${m.id}.jpg" alt="How the finished ${esc(m.name)} will look">
      <p>${esc(m.blurb)}</p>
      <ul class="needs">${rows}</ul>
      <div class="costrow"><span>Materials <b>${m.cost}</b></span><span>Crew fees <b>${cost - m.cost}</b></span><span>Total <b>${cost} 🪙</b></span><span>You have <b>${S.money} 🪙</b></span></div>
      ${m.income.rate ? `<p class="spot">Once built it pays about ${m.income.rate} coins a minute (holds up to ${m.income.cap}). Collect them at the building.</p>` : '<p class="spot">Once built, the fog lifts from the whole Valley.</p>'}
      <p class="why">${esc(why)}</p>
      <div class="row"><button class="btn btn-big grow" id="p-build" ${ready ? '' : 'disabled'}>Start building</button><button class="btn btn-ghost" id="p-close">Close</button></div>`);
    $('p-close').onclick = closePanel;
    $('p-build').onclick = () => { if (ready) startBuild(m, team, cost); };
  }

  function startBuild(m, team, cost) {
    changeMoney(-cost, true); toast(`-${cost} 🪙 building started`, 'bad');
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
      gains.push(`${npcById(id).name} +${got} XP${exLevel(id) > before ? ' · level up!' : ''}`);
    });
    const newRegion = m.unlocks < Wd.regions.length && m.unlocks >= S.unlocked ? m.unlocks : null;
    if (newRegion !== null) S.unlocked = newRegion + 1;
    save(); syncWorld(); placeCrew(false);
    A.play('fanfare');
    const steps = nar(m.done);
    steps.push({ who: 'n', text: D.LINES.crewLearned }, { fn: () => gains.forEach((g, i) => setTimeout(() => toast(g, 'good'), i * 700)) });
    if (newRegion !== null) steps.push({ fn: () => { fogAnim = { region: newRegion, t0: performance.now() }; A.play('fog'); A.play('unlock'); } });
    if (m.lift) steps.push({ who: 'n', text: m.lift });
    if (m.id === 'lighthouse') steps.push({ fn: () => { S.ended = true; save(); } }, { end: 'x' });
    runSteps(steps, { finish: () => showEnd() });
  }

  function pending(m) {
    const ms = S.missions[m.id]; if (!ms || ms.status !== 'built' || !m.income.rate) return 0;
    return Math.min(m.income.cap, Math.floor(m.income.rate * (Date.now() - ms.lastCollect) / 60000));
  }
  function openBuilding(m) {
    const ms = mstate(m.id);
    if (ms.status === 'building') {
      const p = Math.min(100, Math.round((Date.now() - ms.startedAt) / (m.buildSec * 10)));
      panel(`<p class="eyebrow">Under construction</p><h2>${esc(m.name)}</h2><img class="mprev" src="img/preview-${m.id}.jpg" alt=""><div class="bar"><span style="width:${p}%"></span></div><p>${p}% done. ${(ms.crew || []).map(id => esc(npcById(id).name)).join(' and ')} are hard at work.</p><div class="row"><button class="btn btn-ghost grow" id="p-close">Close</button></div>`);
      $('p-close').onclick = closePanel; return;
    }
    const p = pending(m);
    const train = m.id === 'school' ? `<h3>Train an expert · 30 🪙</h3><p class="spot">A lesson gives +60 XP, times their clarity bonus.</p><div class="trainlist">${crew().map(n => `<button class="choice" data-train="${n.id}" ${S.money < 30 ? 'disabled' : ''}>${D.ROLES[n.expert.role].icon} ${esc(n.name)} ${stars(exLevel(n.id))} <small>+${Math.round(60 * xpMult(n.id))} XP</small></button>`).join('') || '<p class="spot">Nobody in your crew yet.</p>'}</div>` : '';
    panel(`
      <p class="eyebrow">Your investment</p>
      <h2>${esc(m.name)}</h2>
      <img class="mprev" src="img/preview-${m.id}.jpg" alt="">
      <p>Pays ${m.income.rate} coins a minute, holds up to ${m.income.cap}.</p>
      <p class="big">Stored: ${p} 🪙</p>
      <div class="row"><button class="btn btn-big grow" id="p-collect" ${p ? '' : 'disabled'}>Collect ${p} 🪙</button><button class="btn btn-ghost" id="p-close">Close</button></div>
      ${train}`);
    $('p-close').onclick = closePanel;
    $('p-collect').onclick = () => { const got = pending(m); ms.lastCollect = Date.now(); changeMoney(got); A.play('coins'); openBuilding(m); };
    document.querySelectorAll('[data-train]').forEach(b => b.onclick = () => {
      if (S.money < 30) return;
      const id = b.dataset.train, before = exLevel(id);
      changeMoney(-30); ex(id).xp += Math.round(60 * xpMult(id)); save();
      A.play('good'); toast(`${npcById(id).name} +${Math.round(60 * xpMult(id))} XP` + (exLevel(id) > before ? ' · level up!' : ''), 'good');
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
      return n ? `<div class="bcard">${f.img ? `<img src="${f.img}" alt="">` : `<div class="bicon">${f.icon}</div>`}<b>${f.icon} ${esc(f.nick)}</b><p>${esc(f.one)}</p><p class="spot">${esc(f.spot)}</p><small>Spotted ${n}×${fails ? ` · fooled ${fails}×` : ''}</small></div>`
        : `<div class="bcard locked">${f.img ? `<img src="${f.img}" alt="">` : `<div class="bicon">❔</div>`}<b>❔ Not yet</b><p>${fails ? 'This one fooled you. Try again.' : 'Find this trick somewhere in the Valley.'}</p></div>`;
    }).join('');
    panel(`<div class="row between"><h2>Trick book</h2><button class="btn btn-ghost btn-sm" id="p-close">Back</button></div><div class="book-grid">${items}</div>`);
    $('p-close').onclick = closePanel;
  }

  function showCrew() {
    const rows = crew().map(n => {
      const e = ex(n.id), lvl = exLevel(n.id), nextNeed = D.XP_LEVELS[lvl] || null;
      const pct = nextNeed ? Math.round((e.xp - D.XP_LEVELS[lvl - 1]) / (nextNeed - D.XP_LEVELS[lvl - 1]) * 100) : 100;
      return `<li><span class="ri">${D.ROLES[n.expert.role].icon}</span><div><b>${esc(n.name)}</b> · ${D.ROLES[n.expert.role].name} ${stars(lvl)}<div class="bar"><span style="width:${pct}%"></span></div><small>${e.xp} XP · fee ${n.expert.fee} · fog cleared ${e.cleared}/${n.expert.fog.length} · learns ×${xpMult(n.id).toFixed(1)}</small></div></li>`;
    }).join('');
    const known = npcs.filter(n => n.expert && n.region < S.unlocked && !(S.experts[n.id] && S.experts[n.id].crew)).map(n => `<li class="missing"><span class="ri">${D.ROLES[n.expert.role].icon}</span><div><b>${esc(n.name)}</b> · ${D.ROLES[n.expert.role].name} <small>Not yet convinced. Find them in ${esc(Wd.regions[n.region].name)}.</small></div></li>`).join('');
    panel(`<div class="row between"><h2>Your crew</h2><button class="btn btn-ghost btn-sm" id="p-close">Back</button></div>
      <ul class="needs">${rows || '<li><div>Nobody yet. Experts join when you clear the first fog from their head.</div></li>'}</ul>
      ${known ? `<p class="eyebrow">Experts you have heard of</p><ul class="needs">${known}</ul>` : ''}
      <p class="spot">Each cleared fog makes an expert learn 50% faster from building. The Engineering School adds another 50%.</p>`);
    $('p-close').onclick = closePanel;
  }

  function showGoals() {
    const lv = currentLevel(), m = mission(lv.mission);
    const focus = lv.focus.map(id => fallacy(id)).map(f => `${f.icon} ${esc(f.nick)}`).join(', ');
    const info = trackerInfo();
    const tasks = allTasks().filter(t => npcById(t.giver).region < S.unlocked && S.tasks[t.id] && S.tasks[t.id] !== 'done')
      .map(t => `<li><span class="ri">${S.tasks[t.id] === 'found' ? '🪙' : '📋'}</span><div><b>${esc(t.title)}</b><small>${S.tasks[t.id] === 'found' ? 'Done! Go back to ' + esc(npcById(t.giver).name) + ' for ' + t.pay + ' coins.' : esc(t.active[0])}</small></div></li>`).join('');
    const carry = S.carry && S.carry.kind === 'job' ? `<li><span class="ri">📦</span><div><b>${esc(D.JOBS[S.carry.id].title)}</b><small>${esc(D.JOBS[S.carry.id].steps[1])}</small></div></li>` : '';
    const inv = D.MISSIONS.filter(x => built(x.id) && x.income.rate).map(x => `<li><span class="ri">🏛️</span><div><b>${esc(x.name)}</b><small>${x.income.rate}/min · ${pending(x)} stored</small></div></li>`).join('');
    panel(`<div class="row between"><h2>Goals</h2><button class="btn btn-ghost btn-sm" id="p-close">Back</button></div>
      <p class="eyebrow">Level ${S.unlocked} · ${esc(Wd.regions[lv.region].name)}</p>
      <p><b>Mission:</b> ${esc(m.name)} — ${objectiveText()}</p>
      <p class="spot">Tricks in this area: ${focus}</p>
      ${info ? `<p class="eyebrow">Right now</p><p><b>${esc(info.title)}</b>: ${esc(info.step)}</p>` : ''}
      <p class="eyebrow">Jobs you accepted</p><ul class="needs">${carry + tasks || '<li><div>None yet. People with a ! have work for you, and job spots like the buckets pay every time.</div></li>'}</ul>
      <p class="eyebrow">Investments</p><ul class="needs">${inv || '<li><div>Nothing built yet.</div></li>'}</ul>`);
    $('p-close').onclick = closePanel;
  }

  function showEnd() {
    if (!S.ended) { mode = 'world'; return; }
    mode = 'end'; $('end').hidden = false;
    $('end-stats').innerHTML = `<p class="big">Coins earned: ${S.stats.earned} · lost to tricks: ${S.stats.lost}</p><p>Fallacies spotted: ${spottedCount()} of ${D.FALLACIES.length}. Crew: ${crew().map(n => esc(n.name)).join(', ')}.</p>`;
    $('end-cards').innerHTML = D.FALLACIES.filter(f => S.spotted[f.id]).map(f => `<div class="mini">${f.img ? `<img src="${f.img}" alt="">` : `<div class="bicon">${f.icon}</div>`}<span>${f.icon} ${esc(f.nick)}</span></div>`).join('');
  }

  /* ================= input ================= */
  function pressA() {
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
    if (!window.confirm('Start again from the beginning? Your coins, crew and buildings will be lost.')) return;
    const name = S.name; S = DEFAULT(); S.name = ''; save(); pushSave();
    player.x = player.fx = player.tx = S.x; player.y = player.fy = player.ty = S.y; syncWorld(); renderTitle();
    $('name-input').value = name;
  });
  $('hud-book').addEventListener('click', () => { if (mode === 'world') showBook(); else if (mode === 'panel') closePanel(); });
  $('hud-crew').addEventListener('click', () => { if (mode === 'world') showCrew(); else if (mode === 'panel') closePanel(); });
  $('hud-goals').addEventListener('click', () => { if (mode === 'world') showGoals(); else if (mode === 'panel') closePanel(); });
  $('tracker').addEventListener('click', () => { if (mode === 'world') showGoals(); });
  $('hud-map').addEventListener('click', () => { const b = $('minimap-box'); b.hidden = !b.hidden; if (!b.hidden) renderMini(); A.play('open'); });
  $('hud-sound').addEventListener('click', () => { S.sound = !S.sound; A.settings.sfx = S.sound; save(); updateHud(); A.play('good'); });
  $('hud-voice').addEventListener('click', () => { S.voice = !S.voice; A.settings.voice = S.voice; if (!S.voice) A.stop(); save(); updateHud(); });
  $('hud-home').addEventListener('click', () => { if (mode === 'world') renderTitle(); });
  $('end-close').addEventListener('click', () => { $('end').hidden = true; mode = 'world'; });
  $('panel').addEventListener('click', e => { if (e.target === $('panel')) closePanel(); });

  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  document.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (KEYS[e.key]) { e.preventDefault(); A.unlock(); held = KEYS[e.key]; if (mode === 'world') tryMove(held); }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'e') { e.preventDefault(); A.unlock(); pressA(); }
    if (e.key === 'Escape') { if (mode === 'panel' && !$('card').hidden) closeCard(); else if (mode === 'panel') closePanel(); else hidePreview(); }
    if (mode === 'world') { if (e.key === 'b') showBook(); if (e.key === 'c') showCrew(); if (e.key === 'g') showGoals(); if (e.key === 'm') $('hud-map').click(); }
  });
  document.addEventListener('keyup', e => { if (KEYS[e.key] === held) held = null; });

  /* ================= go ================= */
  syncWorld();
  window.FogDebug = {
    go(x, y, dir) { player.x = player.fx = player.tx = x; player.y = player.fy = player.ty = y; player.moving = false; if (dir) player.dir = dir; S.x = x; S.y = y; updateHud(); },
    money(n) { changeMoney(n); }, unlock(n) { S.unlocked = n; save(); syncWorld(); renderMini(); },
    state: () => ({ mode, x: player.x, y: player.y, money: S.money, unlocked: S.unlocked, crew: crew().map(n => n.id), missions: S.missions, tasks: S.tasks, tricks: S.tricks, carry: S.carry, follower: follower(), tracker: trackerInfo() }),
    save: () => S, press: pressA, next, interact, place: () => placeCrew(true), npc: id => { const n = npcById(id); return { x: n.x, y: n.y, path: n.path && n.path.length }; },
    choose: i => { const b = $('dlg-choices').querySelectorAll('button')[i]; if (b) b.click(); }, finishBuild: id => finishBuild(mission(id)), finishAction: () => { if (action) action.t0 -= 60000; }, preview: id => showPreview(mission(id))
  };
  renderTitle();
  requestAnimationFrame(loop);
})();
