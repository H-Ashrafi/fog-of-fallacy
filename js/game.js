/* Fog of Fallacy - Maple Street engine: movement, camera, talking, stories, badges. */

(function () {
  'use strict';

  const D = window.FOG, Wd = window.World, TS = Wd.TS;
  const VIEW_W = 13, VIEW_H = 11;
  const KEY = 'fog-of-fallacy-v3';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  canvas.width = VIEW_W * TS; canvas.height = VIEW_H * TS;

  /* ---------------- state ---------------- */
  const DEFAULT = { name: '', look: 0, badges: [], x: 4, y: 5, sound: true, fails: {} };
  let S = load();
  function load() { try { const r = localStorage.getItem(KEY); if (r) return Object.assign({}, DEFAULT, JSON.parse(r)); } catch (e) { } return Object.assign({}, DEFAULT); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

  const player = { x: S.x, y: S.y, dir: 'down', moving: false, t: 0, fx: S.x, fy: S.y, tx: S.x, ty: S.y, walk: 0 };
  const npcs = D.NPCS.map(n => Object.assign({}, n));
  const npcAt = (x, y) => npcs.find(n => n.x === x && n.y === y);
  const trick = id => D.TRICKS.find(t => t.id === id);
  const done = id => S.badges.includes(id);
  const world = { potFixed: false };
  let mode = 'title'; // title | world | dialog | overlay | book | end
  let held = null;
  let lastTime = 0;

  /* ---------------- sound ---------------- */
  const Sound = {
    ctx: null,
    play(kind) {
      if (!S.sound) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const c = this.ctx, now = c.currentTime;
        const seq = { talk: [[520, 0]], good: [[523, 0], [784, .1]], bad: [[220, 0], [170, .16]], badge: [[523, 0], [659, .12], [784, .24], [1046, .38]], step: [[300, 0]] }[kind] || [];
        seq.forEach(([f, t]) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = kind === 'bad' ? 'sawtooth' : 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, now + t); g.gain.exponentialRampToValueAtTime(kind === 'step' ? 0.03 : 0.12, now + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.25);
          o.connect(g).connect(c.destination); o.start(now + t); o.stop(now + t + 0.3);
        });
      } catch (e) { }
    }
  };

  /* ---------------- title ---------------- */
  function renderTitle() {
    mode = 'title';
    $('title').hidden = false; $('play').hidden = true; $('book').hidden = true; $('end').hidden = true;
    const looks = $('looks'); looks.innerHTML = '';
    D.LOOKS.forEach((spec, i) => {
      const b = document.createElement('button'); b.className = 'look' + (i === S.look ? ' on' : ''); b.type = 'button'; b.setAttribute('aria-label', 'Look ' + (i + 1));
      const c = document.createElement('canvas'); c.width = 64; c.height = 64; b.appendChild(c);
      Wd.drawPerson(c.getContext('2d'), 32, 58, spec, 'down', 0, 1.9);
      b.addEventListener('click', () => { S.look = i; looks.querySelectorAll('.look').forEach(x => x.classList.remove('on')); b.classList.add('on'); Sound.play('talk'); });
      looks.appendChild(b);
    });
    $('name-input').value = S.name || '';
    $('start').textContent = S.badges.length || S.name ? 'Keep playing' : 'Start';
    $('reset').hidden = !(S.badges.length || S.name);
  }

  function startGame() {
    S.name = ($('name-input').value.trim() || 'You').slice(0, 16);
    save();
    $('title').hidden = true; $('play').hidden = false;
    mode = 'world';
    updateHud();
    if (!S.badges.length && !S.seenIntro) { S.seenIntro = true; save(); runSteps([
      { who: 'n', text: 'Maple Street is foggy today. The fog comes when a tricky argument wins.' },
      { who: 'n', text: 'Walk with the arrows. Press A to talk. Find the kids with a ! above them.' }
    ], null); }
  }

  function updateHud() {
    $('hud-badges').textContent = S.badges.length + ' / ' + D.TRICKS.length;
    $('hud-sound').textContent = S.sound ? '🔔' : '🔕';
  }

  /* ---------------- movement ---------------- */
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function tryMove(dir) {
    if (player.moving) return;
    player.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = player.x + dx, ny = player.y + dy;
    if (!Wd.walkable(nx, ny) || npcAt(nx, ny)) return;
    player.moving = true; player.t = 0; player.tx = nx; player.ty = ny;
  }

  function update(dt) {
    if (mode !== 'world') return;
    if (player.moving) {
      player.t += dt / 150;
      if (player.t >= 1) {
        player.x = player.tx; player.y = player.ty; player.moving = false; player.t = 0;
        player.fx = player.x; player.fy = player.y; player.walk = 0;
        S.x = player.x; S.y = player.y; save();
        if (held) tryMove(held);
      } else {
        player.fx = player.x + (player.tx - player.x) * player.t;
        player.fy = player.y + (player.ty - player.y) * player.t;
        player.walk = player.t;
      }
    } else if (held) tryMove(held);
  }

  function interact() {
    if (mode !== 'world' || player.moving) return;
    const [dx, dy] = DIRS[player.dir];
    const n = npcAt(player.x + dx, player.y + dy);
    if (!n) return;
    n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir];
    talkTo(n);
  }

  /* ---------------- render ---------------- */
  function render(t) {
    const camX = Math.max(0, Math.min(Wd.W * TS - canvas.width, player.fx * TS + TS / 2 - canvas.width / 2));
    const camY = Math.max(0, Math.min(Wd.H * TS - canvas.height, player.fy * TS + TS / 2 - canvas.height / 2));
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    ctx.fillStyle = '#14262B'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = y0; y <= y0 + VIEW_H; y++) for (let x = x0; x <= x0 + VIEW_W; x++) {
      if (x >= Wd.W || y >= Wd.H) continue;
      Wd.drawTile(ctx, Wd.at(x, y), x, y, x * TS - camX, y * TS - camY, t);
    }
    Wd.structures.forEach(s => Wd.drawStructure(ctx, s, camX, camY));
    Wd.decor.forEach(d => Wd.drawDecor(ctx, d, camX, camY, world));
    // people, sorted by y so lower ones draw in front
    const people = npcs.map(n => ({ x: n.x, y: n.y, spec: n.spec, dir: n.dir, walk: 0, npc: n }));
    people.push({ x: player.fx, y: player.fy, spec: D.LOOKS[S.look], dir: player.dir, walk: player.walk, me: true });
    people.sort((a, b) => a.y - b.y);
    people.forEach(p => {
      const px = p.x * TS - camX + TS / 2, py = p.y * TS - camY + TS - 2;
      Wd.drawPerson(ctx, px, py, p.spec, p.dir, p.walk, 1);
      if (p.npc && p.npc.quest && !done(p.npc.quest)) {
        const bob = Math.sin(t / 250) * 3;
        ctx.fillStyle = '#F6B544'; Wd.rr(ctx, px - 6, py - 50 + bob, 12, 16, 4); ctx.fill();
        ctx.fillStyle = '#2A2420'; ctx.font = 'bold 13px "Baloo 2", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', px, py - 37 + bob);
      }
      if (p.npc && p.npc.quest && done(p.npc.quest)) { ctx.fillStyle = '#63C48F'; ctx.beginPath(); ctx.arc(px + 10, py - 40, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('✓', px + 10, py - 37); }
    });
    // fog over unfinished areas
    Object.keys(D.FOG).forEach(id => {
      if (done(id)) return;
      const [fx0, fy0, fx1, fy1] = D.FOG[id];
      const px = fx0 * TS - camX, py = fy0 * TS - camY, w = (fx1 - fx0 + 1) * TS, h = (fy1 - fy0 + 1) * TS;
      const g = ctx.createRadialGradient(px + w / 2, py + h / 2, Math.min(w, h) * 0.2, px + w / 2, py + h / 2, Math.max(w, h) * 0.6);
      g.addColorStop(0, 'rgba(205,220,220,.42)'); g.addColorStop(1, 'rgba(205,220,220,0)');
      ctx.fillStyle = g; ctx.fillRect(px - 40, py - 40, w + 80, h + 80);
    });
  }

  function loop(t) {
    const dt = Math.min(50, t - lastTime); lastTime = t;
    update(dt);
    if (mode !== 'title') render(t);
    requestAnimationFrame(loop);
  }

  /* ---------------- dialogue ---------------- */
  let script = null; // { steps, i, onDone, quest }
  let typing = null, typingFull = '';

  function fill(text) { return text.replace(/\{name\}/g, S.name); }

  function portraitFor(who) {
    const c = $('dlg-portrait'), cx = c.getContext('2d');
    cx.clearRect(0, 0, c.width, c.height);
    if (who === 'n') { c.hidden = true; return; }
    c.hidden = false;
    const spec = who === 'you' ? D.LOOKS[S.look] : npcs.find(n => n.id === who).spec;
    cx.fillStyle = '#F4E8CC'; cx.fillRect(0, 0, c.width, c.height);
    Wd.drawPerson(cx, 36, 76, Object.assign({}, spec, { size: 'l' }), 'down', 0, 2.2);
  }

  function talkTo(n) {
    if (n.quest && !done(n.quest)) { runQuest(n.quest); return; }
    let lines = n.talk || [];
    if (n.quest && done(n.quest)) lines = n.after;
    else if (n.afterQuest && done(n.afterQuest)) lines = n.after;
    else if (n.id === 'mum' && S.badges.length === D.TRICKS.length) lines = n.done;
    runSteps(lines.map(text => ({ who: n.id, text })), null);
  }

  function runQuest(id) {
    const q = D.QUESTS[id];
    const steps = q.intro.concat([{ choice: shuffle(q.options) }]);
    runSteps(steps, id);
  }

  function runSteps(steps, quest) {
    script = { steps, i: -1, quest };
    mode = 'dialog';
    $('dlg').hidden = false;
    next();
  }

  function next() {
    if (!script) return;
    if (typing) { finishTyping(); return; }
    script.i++;
    const st = script.steps[script.i];
    if (!st) { endDialog(); return; }
    $('dlg-choices').innerHTML = ''; $('dlg-choices').hidden = true; $('dlg-next').hidden = false;
    if (st.who) { showLine(st.who, fill(st.text)); return; }
    if (st.choice) { showChoice(st.choice); return; }
    if (st.scene) { showScene(st.scene, fill(st.text)); return; }
    if (st.end) { finishQuest(st.end); return; }
    next();
  }

  function showLine(who, text) {
    $('dlg').classList.toggle('narrator', who === 'n');
    $('dlg-name').textContent = who === 'n' ? '' : who === 'you' ? S.name : npcs.find(n => n.id === who).name;
    portraitFor(who);
    const el = $('dlg-text'); el.textContent = '';
    let i = 0;
    Sound.play('talk');
    typingFull = text;
    typing = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i >= text.length) finishTyping(); }, 22);
  }
  function finishTyping() { if (!typing) return; clearInterval(typing); $('dlg-text').textContent = typingFull; typing = null; }

  function showChoice(options) {
    $('dlg').classList.remove('narrator');
    $('dlg-name').textContent = S.name; portraitFor('you');
    $('dlg-text').textContent = 'What do you say?';
    $('dlg-next').hidden = true;
    const box = $('dlg-choices'); box.hidden = false; box.innerHTML = '';
    options.forEach(o => {
      const b = document.createElement('button'); b.className = 'choice'; b.type = 'button'; b.textContent = o.text;
      b.addEventListener('click', () => { Sound.play('talk'); script.steps = D.QUESTS[script.quest][o.key]; script.i = -1; next(); });
      box.appendChild(b);
    });
  }

  function showScene(img, text) {
    $('dlg').hidden = true;
    $('scene-img').src = img; $('scene-text').textContent = text;
    $('scene').hidden = false;
  }

  function finishQuest(kind) {
    $('dlg').hidden = true; $('scene').hidden = true;
    const q = script.quest, tr = trick(q);
    const card = $('card');
    if (kind === 'win') {
      if (!done(q)) { S.badges.push(q); save(); }
      if (q === 'redHerring') world.potFixed = true;
      $('card-eyebrow').textContent = 'Badge earned!'; $('card-title').textContent = tr.icon + ' ' + tr.nick;
      $('card-img').src = tr.img; $('card-one').textContent = tr.one; $('card-spot').textContent = tr.spot;
      $('card-btn').textContent = 'Yay!'; card.className = 'overlay win';
      Sound.play('badge');
    } else if (kind === 'fail') {
      S.fails[q] = (S.fails[q] || 0) + 1; save();
      $('card-eyebrow').textContent = 'That was a trick'; $('card-title').textContent = tr.icon + ' ' + tr.nick;
      $('card-img').src = tr.img; $('card-one').textContent = tr.one; $('card-spot').textContent = tr.spot;
      $('card-btn').textContent = 'Try again'; card.className = 'overlay fail';
      Sound.play('bad');
    } else {
      const ins = trick('adHominem');
      $('card-eyebrow').textContent = 'Hmm'; $('card-title').textContent = ins.icon + ' ' + ins.nick;
      $('card-img').src = ins.img; $('card-one').textContent = 'Name-calling is not an answer.'; $('card-spot').textContent = 'Say why the trick is wrong instead.';
      $('card-btn').textContent = 'Try again'; card.className = 'overlay fail';
      Sound.play('bad');
    }
    card.hidden = false;
    updateHud();
    script = null;
    mode = 'overlay';
  }

  function endDialog() {
    $('dlg').hidden = true; script = null; mode = 'world';
  }

  function closeCard() {
    $('card').hidden = true;
    if (S.badges.length === D.TRICKS.length && !S.ended) { S.ended = true; save(); showEnd(); return; }
    mode = 'world';
  }

  function showEnd() {
    mode = 'end';
    $('end').hidden = false;
    $('end-cards').innerHTML = D.TRICKS.map(t => `<div class="mini"><img src="${t.img}" alt=""><span>${t.icon} ${t.nick}</span></div>`).join('');
  }

  /* ---------------- book ---------------- */
  function showBook() {
    mode = 'book';
    $('book').hidden = false;
    $('book-grid').innerHTML = D.TRICKS.map(t => done(t.id)
      ? `<div class="bcard"><img src="${t.img}" alt=""><b>${t.icon} ${t.nick}</b><p>${t.one}</p><p class="spot">${t.spot}</p></div>`
      : `<div class="bcard locked"><img src="${t.img}" alt=""><b>❔ Not yet</b><p>Find this trick on Maple Street.</p></div>`).join('');
  }

  /* ---------------- input ---------------- */
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function pressA() {
    if (mode === 'world') interact();
    else if (mode === 'dialog') { if (!$('dlg-choices').hidden) return; if ($('scene').hidden) next(); else { $('scene').hidden = true; $('dlg').hidden = false; next(); } }
    else if (mode === 'overlay') closeCard();
  }

  document.querySelectorAll('.dpad [data-dir]').forEach(b => {
    const dir = b.dataset.dir;
    const down = e => { e.preventDefault(); held = dir; if (mode === 'world') tryMove(dir); };
    const up = () => { if (held === dir) held = null; };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  });
  $('btn-a').addEventListener('click', pressA);
  $('dlg-next').addEventListener('click', pressA);
  $('dlg-text').addEventListener('click', () => { if (mode === 'dialog' && $('dlg-choices').hidden) next(); });
  $('scene-next').addEventListener('click', pressA);
  $('card-btn').addEventListener('click', closeCard);
  $('start').addEventListener('click', startGame);
  $('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  $('reset').addEventListener('click', () => { if (!window.confirm('Start again from the beginning?')) return; S = Object.assign({}, DEFAULT, { badges: [], fails: {} }); save(); player.x = player.fx = player.tx = S.x; player.y = player.fy = player.ty = S.y; world.potFixed = false; renderTitle(); });
  $('hud-book').addEventListener('click', () => { if (mode === 'world') showBook(); });
  $('book-close').addEventListener('click', () => { $('book').hidden = true; mode = 'world'; });
  $('hud-sound').addEventListener('click', () => { S.sound = !S.sound; save(); updateHud(); });
  $('hud-home').addEventListener('click', () => { if (mode === 'world') renderTitle(); });
  $('end-close').addEventListener('click', () => { $('end').hidden = true; mode = 'world'; });

  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  document.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (KEYS[e.key]) { e.preventDefault(); held = KEYS[e.key]; if (mode === 'world') tryMove(held); }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'e') { e.preventDefault(); pressA(); }
    if (e.key === 'Escape' && mode === 'book') { $('book').hidden = true; mode = 'world'; }
  });
  document.addEventListener('keyup', e => { if (KEYS[e.key] === held) held = null; });

  /* ---------------- go ---------------- */
  world.potFixed = done('redHerring');
  window.FogDebug = { go(x, y, dir) { player.x = player.fx = player.tx = x; player.y = player.fy = player.ty = y; player.moving = false; if (dir) player.dir = dir; }, state: () => ({ mode, x: player.x, y: player.y, badges: S.badges.slice() }) };
  renderTitle();
  requestAnimationFrame(loop);
})();
