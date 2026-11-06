/* Fog of Fallacy - inside the buildings.

   Press A at a door and the roof comes off: the room is drawn from a corner in three-quarter
   (isometric) view on the same canvas as the Valley. The two far walls stand, the two near
   walls are cut away so you can see in. You walk with the same keys and pad, screen-wise:
   up walks away from you, down walks towards you, left and right go left and right. Press A
   facing a thing and the narrator says its line (js/data-rooms.js). Walk out through the door
   (or press A on it) to go back outside.

   game.js drives it: Inside.enter(structure, api) when the player presses A at a door; then
   Inside.move(dir) / Inside.press() for input, Inside.tick(dt) each frame, and
   Inside.render(ctx, canvas, t) instead of the Valley while Inside.active(). `api` is
   { Wd, A, T, spec(), say(lines, after), coins(n), flag(key), hasFlag(key), leave() }. */
window.Inside = (function () {
  const TW = 60, TH = 30, WH = 64;   // tile width and height on screen, wall height (world px)
  const TAU = Math.PI * 2;
  const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const ell = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
  const FONT = () => (window.I18N && window.I18N.canvasFont) || '"Baloo 2", system-ui, sans-serif';
  const DAY = () => Math.floor(Date.now() / 86400000);

  /* Screen-wise steps on the diamond grid: each key moves one whole tile up, down, left or right on screen. */
  const STEP = { up: [-1, -1], down: [1, 1], left: [-1, 1], right: [1, -1] };
  /* The cells in front of the player for each facing, nearest first. */
  const FRONT = { up: [[-1, -1], [-1, 0], [0, -1]], down: [[1, 1], [1, 0], [0, 1]], left: [[-1, 1], [-1, 0], [0, 1]], right: [[1, -1], [1, 0], [0, -1]] };

  let st = null;   // { s, room, label, api, x, y, fx, fy, tx, ty, moving, t, dir, walk, stepTick }

  function roomFor(s) {
    const R = window.FOG.ROOMS, byLabel = R.labels[s.label], base = R.kinds[(byLabel && byLabel.kind) || s.kind] || R.kinds.house;
    return Object.assign({}, base, byLabel || {});
  }
  function enterable(s) { return !!window.FOG.ROOMS.kinds[s.kind] || !!(window.FOG.ROOMS.labels[s.label] && window.FOG.ROOMS.labels[s.label].kind); }

  function enter(s, api) {
    const room = roomFor(s);
    const x = room.door, y = room.h - 1;
    st = { s, room, label: s.label, api, x, y, fx: x, fy: y, tx: x, ty: y, moving: false, t: 0, dir: 'up', walk: 0, stepTick: 0, entered: performance.now() };
    api.A.play('open');
    if (room.intro && room.intro.length) api.say(room.intro);
  }
  function leave() {
    if (!st) return;
    const api = st.api; st = null;
    api.A.play('close');
    api.leave();
  }

  const inRoom = (x, y) => st && x >= 0 && y >= 0 && x < st.room.w && y < st.room.h;
  const onFloor = it => it.y >= 0 && it.x >= 0;
  const covers = (it, x, y) => x >= it.x && x < it.x + (it.w || 1) && y >= it.y && y < it.y + (it.h || 1);
  const blockedAt = (x, y) => st.room.items.some(it => onFloor(it) && !it.walk && covers(it, x, y));
  const itemAt = (x, y) => st.room.items.find(it => covers(it, x, y));

  function move(dir) {
    if (!st || st.moving) return;
    st.dir = dir;
    const [dx, dy] = STEP[dir];
    const nx = st.x + dx, ny = st.y + dy;
    if (ny >= st.room.h && st.y === st.room.h - 1 && Math.abs(st.x - st.room.door) <= 1) { leave(); return; }   // out through the door
    if (!inRoom(nx, ny) || blockedAt(nx, ny)) return;
    st.moving = true; st.t = 0; st.tx = nx; st.ty = ny;
  }
  function tick(dt, held) {
    if (!st) return;
    if (!st.moving) { if (held) move(held); return; }
    st.t += dt / 170;
    if (st.t >= 1) {
      st.x = st.tx; st.y = st.ty; st.fx = st.x; st.fy = st.y; st.moving = false; st.t = 0; st.walk = 0;
      if (++st.stepTick % 2 === 0) st.api.A.play('step');
      if (held) move(held);
      return;
    }
    st.fx = st.x + (st.tx - st.x) * st.t; st.fy = st.y + (st.ty - st.y) * st.t; st.walk = st.t;
  }

  function press() {
    if (!st || st.moving) return;
    if (st.dir === 'down' && st.y === st.room.h - 1 && Math.abs(st.x - st.room.door) <= 1) { leave(); return; }
    for (const [dx, dy] of FRONT[st.dir]) {
      const it = itemAt(st.x + dx, st.y + dy);
      if (!it) continue;
      use(it); return;
    }
  }
  function use(it) {
    const api = st.api, lines = [].concat(it.text || []);
    if (it.sfx) api.A.play(it.sfx);
    if (it.coins) {
      const key = 'room:' + st.label + ':' + it.kind + it.x + ',' + it.y + ':' + DAY();
      if (!api.hasFlag(key)) { api.flag(key); api.say(lines.concat([api.T('You find {n} coins!', { n: it.coins })]), () => api.coins(it.coins)); return; }
      api.say(lines.concat([api.T('Nothing more in there today.')])); return;
    }
    if (lines.length) api.say(lines);
  }

  /* ================= drawing ================= */
  const P = (x, y) => [(x - y) * TW / 2, (x + y) * TH / 2];   // cell corner -> screen (room space)
  function diamond(ctx, x, y, w, h) { const a = P(x, y), b = P(x + w, y), c = P(x + w, y + h), d = P(x, y + h); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); }
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };

  /* A box standing on cells (x, y, w, h), z tall: top face, left face (towards +y) and right face (towards +x). */
  function box(ctx, x, y, w, h, z, color, top) {
    const a = P(x, y), b = P(x + w, y), c = P(x + w, y + h), d = P(x, y + h);
    ctx.fillStyle = shade(color, 0.78); ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0], c[1] - z); ctx.lineTo(d[0], d[1] - z); ctx.closePath(); ctx.fill();   // left face
    ctx.fillStyle = shade(color, 0.62); ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - z); ctx.lineTo(c[0], c[1] - z); ctx.closePath(); ctx.fill();   // right face
    ctx.fillStyle = top || color; ctx.beginPath(); ctx.moveTo(a[0], a[1] - z); ctx.lineTo(b[0], b[1] - z); ctx.lineTo(c[0], c[1] - z); ctx.lineTo(d[0], d[1] - z); ctx.closePath(); ctx.fill();   // top
  }
  function legs(ctx, x, y, w, h, z, color) {
    [[x + 0.15, y + 0.15], [x + w - 0.15, y + 0.15], [x + w - 0.15, y + h - 0.15], [x + 0.15, y + h - 0.15]].forEach(([lx, ly]) => { const p = P(lx, ly); ctx.fillStyle = color; ctx.fillRect(p[0] - 2, p[1] - z, 4, z); });
  }
  const centre = it => { const p = P(it.x + (it.w || 1) / 2, it.y + (it.h || 1) / 2); return p; };

  function drawItem(ctx, it, t) {
    const w = it.w || 1, h = it.h || 1, [cx, cy] = centre(it);
    switch (it.kind) {
      case 'rug': { ctx.fillStyle = '#C9553F'; diamond(ctx, it.x + 0.1, it.y + 0.1, w - 0.2, h - 0.2); ctx.fill(); ctx.fillStyle = '#F4E8CC'; diamond(ctx, it.x + 0.35, it.y + 0.35, w - 0.7, h - 0.7); ctx.fill(); ctx.fillStyle = '#C9553F'; diamond(ctx, it.x + 0.55, it.y + 0.55, w - 1.1, h - 1.1); ctx.fill(); break; }
      case 'bed': { box(ctx, it.x, it.y, w, h, 14, '#8B5A2B'); box(ctx, it.x + 0.08, it.y + 0.08, w - 0.16, h - 0.16, 20, '#5FB3D9', '#7FC3E3'); box(ctx, it.x + 0.15, it.y + 0.15, w - 0.3, 0.7, 25, '#FFFFFF'); break; }
      case 'table': case 'longtable': { legs(ctx, it.x, it.y, w, h, 22, '#6E4A23'); box(ctx, it.x, it.y, w, h, 22, '#B08A5A', '#C9A06A'); ctx.save(); ctx.translate(cx, cy - 22); ctx.fillStyle = '#F4E8CC'; ell(ctx, -8, 0, 5, 2.5); ell(ctx, 8, 2, 5, 2.5); ctx.restore(); break; }
      case 'desk': { legs(ctx, it.x, it.y, w, h, 22, '#6E4A23'); box(ctx, it.x, it.y, w, h, 22, '#A2703F', '#B98650'); ctx.save(); ctx.translate(cx, cy - 23); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, -7); ctx.lineTo(14, 0); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill(); ctx.restore(); break; }
      case 'chair': { legs(ctx, it.x + 0.2, it.y + 0.2, 0.6, 0.6, 14, '#6E4A23'); box(ctx, it.x + 0.2, it.y + 0.2, 0.6, 0.6, 14, '#B08A5A'); box(ctx, it.x + 0.2, it.y + 0.2, 0.6, 0.12, 32, '#8B5A2B'); break; }
      case 'stool': { box(ctx, it.x + 0.3, it.y + 0.3, 0.4, 0.4, 12, '#B08A5A'); break; }
      case 'stove': { box(ctx, it.x, it.y, w, h, 24, '#4A4744', '#5B5652'); ctx.save(); ctx.translate(cx, cy - 25); ctx.fillStyle = '#8E8A80'; ell(ctx, 0, 0, 9, 4.5); ctx.fillStyle = '#2A2420'; ell(ctx, 0, -1, 7, 3.5); for (let i = 0; i < 2; i++) { const f = ((t / 1800 + i / 2) % 1); ctx.fillStyle = 'rgba(240,240,235,' + (0.5 * (1 - f)) + ')'; circ(ctx, Math.sin(f * 7) * 3, -6 - f * 22, 2 + f * 3); } ctx.restore(); break; }
      case 'oven': { box(ctx, it.x, it.y, w, h, 36, '#8E6A50', '#A07858'); ctx.save(); ctx.translate(cx, cy - 12); ctx.fillStyle = '#2A2420'; rr(ctx, -10, -10, 20, 14, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,' + (140 + Math.sin(t / 150) * 40) + ',60,.9)'; rr(ctx, -7, -6, 14, 8, 3); ctx.fill(); ctx.restore(); break; }
      case 'fireplace': { box(ctx, it.x, it.y, w, h, 40, '#8E8A80', '#A5A099'); ctx.save(); ctx.translate(cx, cy - 10); ctx.fillStyle = '#2A2420'; rr(ctx, -11, -16, 22, 18, 4); ctx.fill(); for (let i = 0; i < 3; i++) { const f = ((t / 500 + i / 3) % 1); ctx.fillStyle = i % 2 ? '#F6B544' : '#FF7B6B'; ell(ctx, (i - 1) * 5 + Math.sin(t / 90 + i) * 2, -4 - f * 8, 4, 6 + f * 4); } ctx.restore(); break; }
      case 'shelf': { box(ctx, it.x, it.y, w, h, 30, '#A2703F', '#B98650'); ctx.save(); ctx.translate(cx, cy - 31); ['#F6B544', '#63C48F', '#FF7B6B', '#5FB3D9'].forEach((c, i) => { ctx.fillStyle = c; rr(ctx, -18 + i * 10, -8, 7, 9, 2); ctx.fill(); }); ctx.restore(); break; }
      case 'bookcase': { box(ctx, it.x, it.y, w, h, 54, '#6E4A23', '#8B5A2B'); ctx.save(); ctx.translate(cx, cy); const tall = h > w; for (let r = 0; r < 3; r++) for (let i = 0; i < (tall ? 3 : 5); i++) { ctx.fillStyle = ['#F6B544', '#63C48F', '#FF7B6B', '#5FB3D9', '#9B6BD6'][(i + r) % 5]; const bx = (tall ? -8 + i * 6 : -16 + i * 7), by = -50 + r * 15 + (tall ? i * 3 : 0); ctx.fillRect(bx, by, 5, 11); } ctx.restore(); break; }
      case 'chest': { box(ctx, it.x + 0.1, it.y + 0.15, 0.8, 0.7, 16, '#8B5A2B', '#A2703F'); ctx.save(); ctx.translate(cx, cy - 17); ctx.fillStyle = '#F6B544'; ctx.fillRect(-2, -1, 4, 5); ctx.restore(); break; }
      case 'barrel': { box(ctx, it.x + 0.15, it.y + 0.15, 0.7, 0.7, 22, '#A2703F', '#8B5A2B'); ctx.save(); ctx.translate(cx, cy - 23); ctx.fillStyle = '#5B4F47'; ell(ctx, 0, 0, 12, 6); ctx.fillStyle = '#B98650'; ell(ctx, 0, 0, 9, 4); ctx.restore(); break; }
      case 'sack': { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#C9BCA4'; ell(ctx, 0, -6, 13, 12); ctx.fillStyle = '#B5A58C'; ell(ctx, 0, -16, 6, 4); ctx.restore(); break; }
      case 'crate': { box(ctx, it.x + 0.1, it.y + 0.1, 0.8, 0.8, 18, '#C98B5B', '#D9A06A'); ctx.save(); ctx.translate(cx, cy - 9); ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(10, 6); ctx.moveTo(10, -6); ctx.lineTo(-10, 6); ctx.stroke(); ctx.restore(); break; }
      case 'hay': { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#E8C36A'; ell(ctx, 0, -8, w * 24, h * 11 + 6); ctx.fillStyle = '#F6D987'; ell(ctx, -4, -14, w * 16, h * 7 + 2); ctx.strokeStyle = '#C9A040'; ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-w * 20 + i * w * 5, -4 + (i % 3) * 3); ctx.lineTo(-w * 20 + i * w * 5 + 6, -12 + (i % 2) * 4); ctx.stroke(); } ctx.restore(); break; }
      case 'counter': { box(ctx, it.x, it.y, w, h, 26, '#C98B5B', '#E7D6B0'); ctx.save(); ctx.translate(cx, cy - 28); for (let i = 0; i < w * 2; i++) { ctx.fillStyle = i % 2 ? '#D98F1F' : '#E8A94A'; ell(ctx, -w * 12 + i * 12, (i % 2) * 3 - i * 3 + w * 3, 7, 4); } ctx.restore(); break; }
      case 'scale': { box(ctx, it.x + 0.2, it.y + 0.2, 0.6, 0.6, 10, '#8E8A80'); ctx.save(); ctx.translate(cx, cy - 11); ctx.fillStyle = '#F6B544'; ctx.fillRect(-1, -14, 2, 14); ctx.fillRect(-12, -14, 24, 2); ell(ctx, -11, -6, 6, 2.5); ell(ctx, 11, -4, 6, 2.5); ctx.restore(); break; }
      case 'podium': { box(ctx, it.x + 0.2, it.y + 0.2, 0.6, 0.6, 30, '#8B5A2B', '#A2703F'); break; }
      case 'globe': { box(ctx, it.x + 0.3, it.y + 0.3, 0.4, 0.4, 8, '#6E4A23'); ctx.save(); ctx.translate(cx, cy - 22); ctx.fillStyle = '#5FB3D9'; circ(ctx, 0, 0, 11); ctx.fillStyle = '#63C48F'; ell(ctx, -3, -2, 5, 4); ell(ctx, 5, 4, 4, 3); ctx.restore(); break; }
      case 'cart': { legs(ctx, it.x, it.y, w, h, 12, '#5B4F47'); box(ctx, it.x, it.y + 0.1, w, h - 0.2, 22, '#8B5A2B', '#5B4F47'); ctx.save(); ctx.translate(cx, cy - 24); ctx.fillStyle = '#8E8A80'; for (let i = 0; i < 5; i++) circ(ctx, -16 + i * 8, (i % 2) * 4 - 2, 5); ctx.restore(); break; }
      case 'rocks': { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#8E8A80'; ell(ctx, 0, -8, 26, 14); ctx.fillStyle = '#A5A099'; ell(ctx, -6, -14, 12, 8); ell(ctx, 10, -10, 9, 6); ctx.fillStyle = '#F6B544'; circ(ctx, 6, -16, 2); circ(ctx, -12, -6, 1.5); ctx.restore(); break; }
      case 'cage': { box(ctx, it.x + 0.3, it.y + 0.3, 0.4, 0.4, 20, '#6E4A23'); ctx.save(); ctx.translate(cx, cy - 32); ctx.strokeStyle = '#F6B544'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, TAU); ctx.stroke(); for (let i = -6; i <= 6; i += 4) { ctx.beginPath(); ctx.moveTo(i, -10); ctx.lineTo(i, 10); ctx.stroke(); } ctx.fillStyle = '#F6D987'; circ(ctx, 0, 2 + Math.sin(t / 300) * 1.5, 3.5); ctx.restore(); break; }
      case 'cat': { ctx.save(); ctx.translate(cx, cy); const breathe = Math.sin(t / 600) * 0.6; ctx.fillStyle = '#D98F1F'; ell(ctx, 0, -5, 11, 6 + breathe); circ(ctx, 9, -9, 5); ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(8, -17); ctx.lineTo(10, -12); ctx.moveTo(10, -12); ctx.lineTo(13, -16); ctx.lineTo(14, -11); ctx.fill(); ctx.strokeStyle = '#D98F1F'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(-18, -2, -16, -10); ctx.stroke(); ctx.fillStyle = '#2A2420'; ctx.fillRect(7, -10, 2, 1); ctx.fillRect(11, -10, 2, 1); ctx.restore(); break; }
      case 'goat': { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#F4E8CC'; ell(ctx, 0, -10, 12, 8); circ(ctx, 10, -16, 5); ctx.fillStyle = '#C9BCA4'; ctx.fillRect(-8, -4, 3, 6); ctx.fillRect(5, -4, 3, 6); ctx.fillStyle = '#5B4F47'; ctx.beginPath(); ctx.moveTo(9, -20); ctx.lineTo(7, -26); ctx.lineTo(11, -21); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.fillRect(12, -17, 1.5, 1.5); ctx.restore(); break; }
      case 'plant': { box(ctx, it.x + 0.3, it.y + 0.3, 0.4, 0.4, 10, '#C9553F'); ctx.save(); ctx.translate(cx, cy - 12); ctx.fillStyle = '#63C48F'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + Math.sin(t / 900) * 0.1; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 7, -8 + Math.sin(a) * 4, 7, 3.5, a, 0, TAU); ctx.fill(); } ctx.restore(); break; }
      case 'bench': { legs(ctx, it.x, it.y, w, h, 12, '#6E4A23'); box(ctx, it.x, it.y, w, h, 12, '#B08A5A'); break; }
      default: { box(ctx, it.x + 0.1, it.y + 0.1, w - 0.2, h - 0.2, 16, '#B08A5A'); }
    }
  }
  /* Things on the far walls: drawn on the wall plane, centred on the cell they are outside of. */
  function drawWallItem(ctx, it, t) {
    const back = it.y < 0;   // on the back-right wall (along the y = 0 edge) or the back-left wall (x = 0 edge)
    const [bx, by] = back ? P(it.x + 0.5, 0) : P(0, it.y + 0.5);
    ctx.save(); ctx.translate(bx, by - WH / 2);
    const sk = back ? 0.5 : -0.5;   // the wall slopes with the room edge
    ctx.transform(1, sk, 0, 1, 0, 0);
    switch (it.kind) {
      case 'window': { ctx.fillStyle = '#6E4A23'; rr(ctx, -13, -14, 26, 24, 3); ctx.fill(); ctx.fillStyle = '#BFE3EC'; ctx.fillRect(-11, -12, 10, 9); ctx.fillRect(1, -12, 10, 9); ctx.fillRect(-11, -1, 10, 9); ctx.fillRect(1, -1, 10, 9); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-10, -11, 4, 4); break; }
      case 'picture': { ctx.fillStyle = '#F6B544'; rr(ctx, -14, -11, 28, 20, 2); ctx.fill(); ctx.fillStyle = '#BFE3EC'; ctx.fillRect(-11, -8, 22, 14); ctx.fillStyle = '#5FB3D9'; ctx.fillRect(-11, 0, 22, 6); ctx.fillStyle = '#63C48F'; ell(ctx, -4, -1, 7, 3); break; }
      case 'clock': { ctx.fillStyle = '#8B5A2B'; circ(ctx, 0, -4, 12); ctx.fillStyle = '#F4E8CC'; circ(ctx, 0, -4, 9); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -10); ctx.moveTo(0, -4); ctx.lineTo(Math.cos(t / 1000) * 6, -4 + Math.sin(t / 1000) * 6); ctx.stroke(); break; }
      case 'banner': { ctx.fillStyle = '#6B5BB3'; ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(10, -22); ctx.lineTo(10, 10); ctx.lineTo(0, 16); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#F6B544'; circ(ctx, 0, -4, 5); break; }
      case 'sign': { ctx.fillStyle = '#F4E8CC'; rr(ctx, -16, -10, 32, 14, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 8px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('FRESH', 0, 0); break; }
      case 'lantern': { ctx.fillStyle = '#5B4F47'; ctx.fillRect(-1, -20, 2, 10); ctx.fillStyle = '#8E8A80'; rr(ctx, -6, -10, 12, 16, 2); ctx.fill(); ctx.fillStyle = 'rgba(246,181,68,' + (0.8 + Math.sin(t / 200) * 0.15) + ')'; rr(ctx, -4, -8, 8, 12, 2); ctx.fill(); break; }
      case 'tools': case 'picks': { ctx.strokeStyle = '#6E4A23'; ctx.lineWidth = 2.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 10, -18); ctx.lineTo(i * 10, 8); ctx.stroke(); } ctx.fillStyle = '#8E8A80'; for (let i = -1; i <= 1; i++) { if (it.kind === 'picks') { ctx.fillRect(i * 10 - 7, -20, 14, 3); } else { ctx.fillRect(i * 10 - 5, -21, 10, 4); } } break; }
      case 'net': { ctx.strokeStyle = '#C9BCA4'; ctx.lineWidth = 1; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 5 - 12, -18); ctx.lineTo(i * 5 + 8, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 5 + 12, -18); ctx.lineTo(i * 5 - 8, 12); ctx.stroke(); } ctx.fillStyle = '#8B5A2B'; circ(ctx, 4, 0, 4); break; }
      case 'boat': { ctx.fillStyle = '#8B5A2B'; ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(16, -4); ctx.lineTo(10, 6); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -22); ctx.lineTo(12, -8); ctx.closePath(); ctx.fill(); break; }
      default: { ctx.fillStyle = '#8B5A2B'; rr(ctx, -10, -10, 20, 16, 2); ctx.fill(); }
    }
    ctx.restore();
  }

  function floorPattern(ctx, room) {
    const { w, h } = room;
    const base = { planks: '#D9B98A', tiles: '#E7D6B0', stone: '#C9C4BA', dirt: '#C9A070', rock: '#8E8A80' }[room.floor] || '#D9B98A';
    ctx.fillStyle = base; diamond(ctx, 0, 0, w, h); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
    if (room.floor === 'planks' || room.floor === 'dirt') { for (let y = 1; y < h; y++) { const a = P(0, y), b = P(w, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    else { for (let y = 1; y < h; y++) { const a = P(0, y), b = P(w, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } for (let x = 1; x < w; x++) { const a = P(x, 0), b = P(x, h); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    if (room.floor === 'rock') { ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 12; i++) { const p = P(((i * 7) % w) + 0.5, ((i * 5) % h) + 0.5); ell(ctx, p[0], p[1], 8, 4); } }
  }
  function walls(ctx, room) {
    const { w, h } = room, wall = room.wall || '#F4E8CC';
    const a = P(0, 0), b = P(w, 0), d = P(0, h);
    ctx.fillStyle = shade(wall, 0.9); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(d[0], d[1] - WH); ctx.lineTo(a[0], a[1] - WH); ctx.closePath(); ctx.fill();   // back-left wall
    ctx.fillStyle = wall; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - WH); ctx.lineTo(a[0], a[1] - WH); ctx.closePath(); ctx.fill();   // back-right wall
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();   // skirting
    ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d[0], d[1] - WH); ctx.lineTo(a[0], a[1] - WH); ctx.lineTo(b[0], b[1] - WH); ctx.stroke();   // the cut edge where the roof was
  }
  function door(ctx, room, t) {
    const x = room.door, y = room.h - 1;
    ctx.fillStyle = '#6E4A23'; diamond(ctx, x, y + 0.6, 1, 0.4); ctx.fill();
    ctx.fillStyle = '#8B5A2B'; diamond(ctx, x + 0.1, y + 0.2, 0.8, 0.45); ctx.fill();   // doormat
    const p = P(x + 0.5, y + 1.05);
    ctx.fillStyle = 'rgba(42,36,32,' + (0.6 + Math.sin(t / 400) * 0.2) + ')'; ctx.font = 'bold 11px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('▼', p[0], p[1] + 12);
  }

  function render(ctx, canvas, t) {
    if (!st) return;
    const { room, api } = st, { w, h } = room;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14262B'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // fit the room (floor plus walls) into the canvas with a margin
    const left = P(0, h)[0] - TW / 2, right = P(w, 0)[0] + TW / 2, top = -WH - 24, bottom = P(w, h)[1] + 30;
    const z = Math.min(canvas.width / (right - left), canvas.height / (bottom - top)) * 0.94;
    const ox = (canvas.width - (right + left) * z) / 2, oy = (canvas.height - (bottom + top) * z) / 2;
    ctx.setTransform(z, 0, 0, z, ox, oy);
    walls(ctx, room);
    floorPattern(ctx, room);
    door(ctx, room, t);
    room.items.filter(it => !onFloor(it)).forEach(it => drawWallItem(ctx, it, t));
    room.items.filter(it => onFloor(it) && it.walk).forEach(it => drawItem(ctx, it, t));
    const things = room.items.filter(it => onFloor(it) && !it.walk).map(it => ({ depth: it.x + (it.w || 1) + it.y + (it.h || 1), it }));
    things.push({ depth: st.fx + st.fy + 2, me: true });
    things.sort((a, b) => a.depth - b.depth);
    things.forEach(th => {
      if (th.me) { const p = P(st.fx + 0.5, st.fy + 0.5); ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(ctx, p[0], p[1] + 2, 12, 5); api.Wd.drawPerson(ctx, p[0], p[1] + 4, api.spec(), st.dir, st.walk, 1.25); }
      else drawItem(ctx, th.it, t);
    });
    // the room's name on the cut edge of the wall
    ctx.fillStyle = 'rgba(244,232,204,.9)'; ctx.font = 'bold 13px ' + FONT(); ctx.textAlign = 'center';
    const lp = P(w / 2, 0); ctx.fillText(api.T(st.label), lp[0], lp[1] - WH - 8);
  }

  return { enter, leave, enterable, move, press, tick, render, active: () => !!st, label: () => (st ? st.label : null), state: () => (st ? { x: st.x, y: st.y, dir: st.dir, label: st.label } : null) };
})();
