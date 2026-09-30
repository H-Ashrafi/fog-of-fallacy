/* Fog of Fallacy - scenes: the little animated pictures that open when you press A on a thing
   (the goat bleats and butts you, the fountain splashes, the boat bobs) and the hidden mini-games
   (Dodge's cups, red or black, skipping stones, shooing crows, fishing).
   Every scene draws on a 360x220 canvas inside the modal in index.html. game.js opens a scene with
   an `api` ({ Wd, A, T, spec, opts, lines, caption(), buttons(), finish() }) and then feeds it time,
   taps (pointer) and keys. A scene is { draw(ctx, t), pointer?(x, y), key?(k) }. */

window.Scenes = (function () {
  const W = 360, H = 220;
  const TAU = Math.PI * 2;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
  const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const ell = (ctx, x, y, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const jit = (i, s) => ((Math.sin(i * 127.1 + s * 311.7) * 43758.5453) % 1 + 1) % 1;   // deterministic scatter, no flicker
  const ease = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const FONT = () => (window.I18N && window.I18N.canvasFont) || '"Baloo 2", system-ui, sans-serif';
  const Wd = () => window.World;

  /* ================= backdrops ================= */
  function sky(ctx, top, bottom) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function clouds(ctx, t) { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 3; i++) { const x = ((t / (90 + i * 30) + i * 140) % (W + 120)) - 60, y = 26 + i * 18; circ(ctx, x, y, 11); circ(ctx, x + 12, y - 5, 14); circ(ctx, x + 26, y, 10); } }
  function sun(ctx, x, y) { const g = ctx.createRadialGradient(x, y, 4, x, y, 60); g.addColorStop(0, 'rgba(255,225,150,.9)'); g.addColorStop(0.3, 'rgba(255,225,150,.35)'); g.addColorStop(1, 'rgba(255,225,150,0)'); ctx.fillStyle = g; circ(ctx, x, y, 60); ctx.fillStyle = '#FFE8A3'; circ(ctx, x, y, 14); }
  function meadow(ctx, t, groundY) {
    groundY = groundY || 160;
    sky(ctx, '#BFE3EC', '#EAF3E6'); sun(ctx, 300, 34); clouds(ctx, t);
    ctx.fillStyle = '#A9D69A'; ell(ctx, 80, groundY + 10, 170, 44); ctx.fillStyle = '#93CB86'; ell(ctx, 290, groundY + 14, 190, 40);
    ctx.fillStyle = '#82C773'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#6FB562'; for (let i = 0; i < 26; i++) { const x = jit(i, 1) * W, y = groundY + 6 + jit(i, 2) * (H - groundY - 10); ctx.fillRect(x, y, 2, 5); ctx.fillRect(x + 3, y - 2, 2, 7); }
    ctx.fillStyle = '#FF7B6B'; for (let i = 0; i < 6; i++) circ(ctx, 20 + jit(i, 3) * 320, groundY + 12 + jit(i, 4) * 40, 2);
  }
  function water(ctx, t, shoreY) {
    shoreY = shoreY || 110;
    sky(ctx, '#BFE3EC', '#E8F1EA'); sun(ctx, 60, 36); clouds(ctx, t);
    ctx.fillStyle = '#A9D69A'; ell(ctx, 260, shoreY, 200, 26); ctx.fillStyle = '#5FB3D9'; ctx.fillRect(0, shoreY, W, H - shoreY);
    const g = ctx.createLinearGradient(0, shoreY, 0, H); g.addColorStop(0, 'rgba(63,146,191,0)'); g.addColorStop(1, 'rgba(63,146,191,.7)'); ctx.fillStyle = g; ctx.fillRect(0, shoreY, W, H - shoreY);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) { const y = shoreY + 12 + i * 9 + Math.sin(t / 600 + i) * 2, x = ((t / (40 + i * 6) + i * 70) % (W + 60)) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 20, y); ctx.quadraticCurveTo(x + 30, y + 4, x + 40, y); ctx.stroke(); }
  }
  function square(ctx, t) {
    sky(ctx, '#BFE3EC', '#D9E9E3');
    ctx.fillStyle = '#EDE2D2'; ctx.fillRect(0, 40, W, 90); ctx.fillStyle = '#D95A4B'; ctx.fillRect(0, 30, W, 14);
    ctx.fillStyle = '#BFEBD6'; for (let i = 0; i < 6; i++) { ctx.fillRect(22 + i * 58, 60, 22, 26); ctx.strokeStyle = '#8FB3B0'; ctx.strokeRect(22 + i * 58, 60, 22, 26); ctx.fillStyle = '#F6B544'; ctx.fillRect(18 + i * 58, 86, 30, 4); ctx.fillStyle = '#BFEBD6'; }
    ctx.fillStyle = '#C9BCA4'; ctx.fillRect(0, 130, W, H - 130);
    ctx.strokeStyle = 'rgba(90,70,50,.18)'; ctx.lineWidth = 1; for (let y = 134; y < H; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < W; x += 24) ctx.strokeRect(x + 1, y + 1, 21, 13);
  }
  function field(ctx, t) {
    meadow(ctx, t, 120);
    ctx.fillStyle = '#B9932F'; for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) { const x = 8 + i * 23 + (r % 2) * 11, y = 132 + r * 22; ctx.fillRect(x, y, 3, 16); ctx.fillStyle = '#E2B93B'; circ(ctx, x + 1.5, y, 3.2); ctx.fillStyle = '#B9932F'; }
  }
  function dusk(ctx, t) {
    sky(ctx, '#4A5568', '#8E8A80'); ctx.fillStyle = '#6E6A62'; ell(ctx, 60, 130, 120, 50); ell(ctx, 300, 125, 140, 60); ctx.fillStyle = '#8E8A80'; ctx.fillRect(0, 140, W, H - 140);
    ctx.fillStyle = '#7A766D'; for (let i = 0; i < 8; i++) circ(ctx, jit(i, 5) * W, 150 + jit(i, 6) * 60, 6 + jit(i, 7) * 8);
  }
  function person(ctx, api, x, y, dir, scale, walk) { Wd().drawPerson(ctx, x, y, api.spec, dir || 'right', walk || 0, scale || 2.4); }
  function note(ctx, x, y, a, size) { ctx.fillStyle = 'rgba(42,36,32,' + a + ')'; ctx.font = 'bold ' + (size || 16) + 'px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('♪', x, y); }
  function bang(ctx, x, y) { ctx.fillStyle = '#FFF'; rr(ctx, x - 9, y - 22, 18, 22, 6); ctx.fill(); ctx.fillStyle = '#E4574F'; ctx.font = 'bold 16px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('!', x, y - 5); }
  function ripple(ctx, x, y, p, rx) { ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p) * 0.8 + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, (rx || 14) * p + 2, ((rx || 14) * p + 2) * 0.35, 0, 0, TAU); ctx.stroke(); }

  /* ================= animals and props shared by scenes ================= */
  /* A goat about a third of the picture tall. o: { chew, bleat, walk (0..1 phase or 0), eat } */
  function goat(ctx, x, feetY, t, o) {
    o = o || {};
    if (o.flip) { ctx.save(); ctx.translate(x * 2, 0); ctx.scale(-1, 1); goat(ctx, x, feetY, t, Object.assign({}, o, { flip: false })); ctx.restore(); return; }   // face left
    const sw = o.walk ? Math.sin(t / 90) * 5 : 0, hop = o.walk ? Math.abs(Math.sin(t / 90)) * 3 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ell(ctx, x, feetY + 2, 34, 6);
    ctx.fillStyle = '#5B4F47'; ctx.fillRect(x - 22, feetY - 22 - hop + sw, 7, 22 + hop - sw); ctx.fillRect(x + 12, feetY - 22 - hop - sw, 7, 22 + hop + sw); ctx.fillStyle = '#6E6259'; ctx.fillRect(x - 12, feetY - 22 - hop - sw, 7, 22 + hop + sw); ctx.fillRect(x + 22, feetY - 22 - hop + sw, 7, 22 + hop - sw);
    ctx.fillStyle = '#2A2420'; [x - 22, x - 12, x + 12, x + 22].forEach(lx => ctx.fillRect(lx, feetY - 4, 7, 4));
    ctx.fillStyle = '#F4E8CC'; rr(ctx, x - 30, feetY - 48 - hop, 62, 30, 14); ctx.fill();
    ctx.fillStyle = '#FFF6E0'; rr(ctx, x - 26, feetY - 46 - hop, 30, 12, 6); ctx.fill();           // a soft highlight along the back
    const tail = Math.sin(t / 140) * 0.7; ctx.save(); ctx.translate(x - 30, feetY - 44 - hop); ctx.rotate(-0.8 + tail); ctx.fillStyle = '#F4E8CC'; rr(ctx, -4, -12, 8, 14, 4); ctx.fill(); ctx.restore();
    const hx = x + 34, hy = feetY - 52 - hop + (o.eat ? 14 : 0), jaw = o.chew ? Math.abs(Math.sin(t / 150)) * 3 : o.bleat ? 5 : 0;
    ctx.fillStyle = '#F4E8CC'; ctx.fillRect(x + 22, feetY - 50 - hop, 16, 16);                            // neck
    ctx.fillStyle = '#E4574F'; ctx.fillRect(x + 22, feetY - 38 - hop, 16, 4); ctx.fillStyle = '#F6B544'; circ(ctx, x + 30, feetY - 31 - hop + Math.sin(t / 200) * 1.5, 3.5);   // collar and bell
    ctx.fillStyle = '#F4E8CC'; ell(ctx, hx, hy, 16, 13); ell(ctx, hx + 12, hy + 6 + jaw / 2, 10, 7);       // head and muzzle
    ctx.fillStyle = '#E8D6B8'; ell(ctx, hx - 14, hy - 4, 8, 4, -0.5); ell(ctx, hx - 2, hy - 12, 4, 8, 0.4);    // ear and a little tuft
    ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(hx - 4, hy - 12); ctx.lineTo(hx - 10, hy - 26); ctx.lineTo(hx - 1, hy - 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 4, hy - 12); ctx.lineTo(hx + 4, hy - 26); ctx.lineTo(hx + 9, hy - 13); ctx.fill();   // horns
    ctx.fillStyle = '#E8D6B8'; ctx.beginPath(); ctx.moveTo(hx + 6, hy + 12); ctx.lineTo(hx + 10, hy + 24); ctx.lineTo(hx + 15, hy + 12); ctx.fill();   // beard
    ctx.fillStyle = '#7A6A5A'; ctx.fillRect(hx + 12, hy + 8 + jaw, 12, 2);                              // the mouth line drops as it chews
    ctx.fillStyle = '#5B4F47'; circ(ctx, hx + 20, hy + 5, 1.6);
    const blink = ((t / 2900) % 1) < 0.05;
    if (!blink) { ctx.fillStyle = '#FFF'; ell(ctx, hx + 6, hy - 2, 5, 4.2); ctx.fillStyle = '#2A2420'; ell(ctx, hx + 7, hy - 2, 3.5, 1.6); ctx.fillStyle = '#FFF'; circ(ctx, hx + 8, hy - 3.5, 1); }   // goats have letterbox pupils
    else { ctx.strokeStyle = '#7A6A5A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + 2, hy - 2); ctx.lineTo(hx + 10, hy - 2); ctx.stroke(); }
  }
  function crow(ctx, x, y, t, flap) {
    const f = Math.sin(t / 70) * (flap ? 1 : 0.15);
    ctx.fillStyle = '#2A2420'; ell(ctx, x, y, 10, 7); circ(ctx, x + 9, y - 5, 5);
    ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.quadraticCurveTo(x - 10, y - 14 - f * 12, x - 22, y - 8 - f * 10); ctx.lineTo(x - 8, y + 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 8, y + 2); ctx.lineTo(x - 18, y + 6); ctx.lineTo(x - 10, y + 6); ctx.fill();
    ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(x + 13, y - 6); ctx.lineTo(x + 20, y - 4); ctx.lineTo(x + 13, y - 2); ctx.fill();
    ctx.fillStyle = '#FFF'; circ(ctx, x + 10, y - 6, 1.6); ctx.fillStyle = '#2A2420'; circ(ctx, x + 10.5, y - 6, 0.8);
  }
  function canary(ctx, x, y, t, sing) {
    const bob = Math.sin(t / 180) * 1.5;
    ctx.fillStyle = '#F6B544'; ell(ctx, x, y + bob, 12, 9); circ(ctx, x + 10, y - 7 + bob, 7);
    ctx.fillStyle = '#E2B93B'; ell(ctx, x - 3, y + bob, 8, 4, -0.3); ctx.beginPath(); ctx.moveTo(x - 10, y + bob); ctx.lineTo(x - 22, y - 4 + bob); ctx.lineTo(x - 20, y + 4 + bob); ctx.fill();
    ctx.fillStyle = '#E4574F'; ctx.beginPath(); ctx.moveTo(x + 16, y - 8 + bob); ctx.lineTo(x + 24, y - 6 + bob - (sing ? 2 : 0)); ctx.lineTo(x + 16, y - 4 + bob); ctx.fill();
    ctx.fillStyle = '#FFF'; circ(ctx, x + 12, y - 9 + bob, 2.2); ctx.fillStyle = '#2A2420'; circ(ctx, x + 12.6, y - 9 + bob, 1.2);
    ctx.strokeStyle = '#D98F1F'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 2, y + 8 + bob); ctx.lineTo(x - 3, y + 14); ctx.moveTo(x + 4, y + 8 + bob); ctx.lineTo(x + 5, y + 14); ctx.stroke();
    if (sing) for (let i = 0; i < 3; i++) { const f = ((t / 700 + i / 3) % 1); note(ctx, x + 26 + f * 30 + i * 6, y - 14 - f * 30 + Math.sin(f * 8) * 3, 1 - f, 12 + i * 2); }
  }
  function fish(ctx, x, y, size, red, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const r = 6 + size * 3;
    ctx.fillStyle = red ? '#E4574F' : '#5FB3D9'; ell(ctx, 0, 0, r * 1.5, r); ctx.beginPath(); ctx.moveTo(-r * 1.3, 0); ctx.lineTo(-r * 2.1, -r * 0.8); ctx.lineTo(-r * 2.1, r * 0.8); ctx.fill();
    ctx.fillStyle = red ? '#FF9A90' : '#BFEBD6'; ell(ctx, r * 0.2, r * 0.3, r * 0.9, r * 0.4);
    ctx.fillStyle = '#FFF'; circ(ctx, r * 0.8, -r * 0.3, r * 0.25); ctx.fillStyle = '#2A2420'; circ(ctx, r * 0.85, -r * 0.3, r * 0.13);
    ctx.restore();
  }
  function cat(ctx, x, y, t, awake) {
    const tail = Math.sin(t / 500) * 0.5;
    ctx.fillStyle = '#D98F1F'; ell(ctx, x, y, 22, 11); circ(ctx, x + 18, y - 6, 9);
    ctx.save(); ctx.translate(x - 20, y); ctx.rotate(tail - 0.6); ctx.strokeStyle = '#D98F1F'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-10, -10, -6, -22); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#D98F1F'; ctx.beginPath(); ctx.moveTo(x + 12, y - 12); ctx.lineTo(x + 14, y - 20); ctx.lineTo(x + 19, y - 13); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 21, y - 13); ctx.lineTo(x + 26, y - 20); ctx.lineTo(x + 26, y - 11); ctx.fill();
    ctx.fillStyle = '#FFE8A3'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 8 + i * 8, y - 5, 3, 10);
    ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1.2; ctx.beginPath();
    if (awake) { ctx.fillStyle = '#63C48F'; circ(ctx, x + 16, y - 7, 2); circ(ctx, x + 22, y - 7, 2); ctx.fillStyle = '#2A2420'; circ(ctx, x + 16, y - 7, 0.9); circ(ctx, x + 22, y - 7, 0.9); }
    else { ctx.moveTo(x + 14, y - 7); ctx.lineTo(x + 18, y - 7); ctx.moveTo(x + 20, y - 7); ctx.lineTo(x + 24, y - 7); ctx.stroke(); }
    ctx.fillStyle = '#FF9A90'; circ(ctx, x + 19, y - 3, 1.2);
  }

  /* ================= vignettes: press A on a thing and watch ================= */
  const V = {};
  V.goat = api => {
    let bleated = -1;
    return { draw(ctx, t) {
      meadow(ctx, t);
      const cyc = (t % 6500) / 6500, n = Math.floor(t / 6500);
      let gx = 250, bump = 0, walk = false;
      if (cyc > 0.45 && cyc < 0.6) { gx = 250 - 96 * ease((cyc - 0.45) / 0.15); walk = true; }
      else if (cyc >= 0.6 && cyc < 0.68) { gx = 154; bump = Math.sin((cyc - 0.6) / 0.08 * Math.PI); }
      else if (cyc >= 0.68 && cyc < 0.85) { gx = 154 + 96 * ease((cyc - 0.68) / 0.17); walk = true; }
      const bleat = cyc > 0.12 && cyc < 0.24;
      if (bleat && bleated !== n) { bleated = n; api.A.play('goat'); }
      if (bump > 0.5 && !this.bumped) { this.bumped = true; api.A.play('bad'); } if (bump === 0) this.bumped = false;
      ctx.save(); ctx.translate(92, 176); ctx.rotate(-0.28 * bump); ctx.translate(-92, -176); person(ctx, api, 92, 176, 'right', 2.4); ctx.restore();
      if (bump > 0.2) bang(ctx, 92, 96 - bump * 6);
      goat(ctx, gx, 176, t, { chew: !bleat && !walk && bump === 0, bleat, walk, flip: true });
      if (bleat) for (let i = 0; i < 2; i++) { const f = ((t / 600 + i / 2) % 1); note(ctx, gx - 60 - f * 20 - i * 8, 96 - f * 26, 1 - f, 14); }
    } };
  };
  V.milk = V.goat;
  V.fountain = api => ({ draw(ctx, t) {
    const dry = api.opts.dry;
    if (dry) { sky(ctx, '#B8B3A8', '#8E8A80'); ctx.fillStyle = '#A9A39A'; ctx.fillRect(0, 130, W, H - 130); } else square(ctx, t);
    const cx = 220, by = 176, wat = dry ? '#6E6A62' : '#5FB3D9';
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ell(ctx, cx, by + 6, 74, 12);
    ctx.fillStyle = '#A9A39A'; ell(ctx, cx, by, 72, 20); ctx.fillStyle = wat; ell(ctx, cx, by - 4, 62, 14);
    if (!dry) for (let i = 0; i < 4; i++) ripple(ctx, cx + (i - 1.5) * 26, by - 4, ((t / 1400 + i / 4) % 1), 18);
    ctx.fillStyle = '#C9C4BA'; ctx.fillRect(cx - 9, by - 62, 18, 58); ctx.fillStyle = '#A9A39A'; ell(ctx, cx, by - 62, 34, 9); ctx.fillStyle = wat; ell(ctx, cx, by - 64, 28, 6);
    ctx.fillStyle = '#C9C4BA'; ctx.fillRect(cx - 4, by - 96, 8, 34); ctx.fillStyle = dry ? '#8E8A80' : '#F6B544'; circ(ctx, cx, by - 100, 6);
    if (dry) {   // grey dust drifts out of the empty bowl
      person(ctx, api, 120, 186, 'right', 2.4);
      ctx.fillStyle = 'rgba(160,155,145,.55)'; for (let i = 0; i < 8; i++) { const f = ((t / 3000 + jit(i, 40)) % 1); circ(ctx, cx - 40 + jit(i, 41) * 80 + Math.sin(f * 6 + i) * 8, by - 10 - f * 60, 2 + f * 5); }
      return;
    }
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(cx, by - 100); ctx.quadraticCurveTo(cx + s * 30, by - 130, cx + s * 40, by - 70); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + s * 26, by - 64); ctx.quadraticCurveTo(cx + s * 44, by - 80, cx + s * 54, by - 12); ctx.stroke(); });
    ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 14; i++) { const f = ((t / 900 + jit(i, 8)) % 1), s = i % 2 ? 1 : -1; circ(ctx, cx + s * (10 + f * 36) + (jit(i, 9) - 0.5) * 8, by - 100 + Math.sin(f * Math.PI) * -30 + f * 90, 2.2 - f); }
    const dip = Math.max(0, Math.sin(t / 1400)); person(ctx, api, 120, 186, 'right', 2.4);
    ctx.fillStyle = api.spec.skin; ctx.fillRect(140, 140 + dip * 14, 18, 6); if (dip > 0.9) for (let i = 0; i < 4; i++) circ(ctx, 158 + jit(i, 10) * 14, 150 - jit(i, 11) * 14, 1.6);
    ctx.fillStyle = '#8E8A80'; const hop = Math.abs(Math.sin(t / 260)) * 4; circ(ctx, cx + 60, by - 22 - hop, 5); circ(ctx, cx + 65, by - 26 - hop, 3.5); ctx.fillStyle = '#F6B544'; ctx.fillRect(cx + 68, by - 27 - hop, 4, 2);   // a sparrow on the rim
  } });
  V.dryfountain = V.fountain;
  V.boat = api => ({ draw(ctx, t) {
    water(ctx, t, 96);
    const bob = Math.sin(t / 700) * 5, tilt = Math.sin(t / 700 + 1) * 0.06, bx = 200, by = 172 + bob;
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { const f = ((t / 4000 + i / 3) % 1), x = 40 + f * 280, y = 40 + i * 14 + Math.sin(f * 12) * 3; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x - 4, y - 5, x, y); ctx.quadraticCurveTo(x + 4, y - 5, x + 8, y); ctx.stroke(); }
    ctx.save(); ctx.translate(bx, by); ctx.rotate(tilt);
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-2, -104, 4, 92); const flap = Math.sin(t / 240) * 6;
    ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(3, -100); ctx.quadraticCurveTo(50 + flap, -60, 46, -20); ctx.lineTo(3, -20); ctx.fill(); ctx.fillStyle = '#E4574F'; ctx.fillRect(3, -60, 40, 6);
    person(ctx, api, -12, -6, 'right', 2.2);
    ctx.fillStyle = '#A2703F'; ctx.beginPath(); ctx.moveTo(-70, -16); ctx.lineTo(74, -16); ctx.quadraticCurveTo(60, 14, 40, 16); ctx.lineTo(-50, 16); ctx.quadraticCurveTo(-72, 10, -70, -16); ctx.fill();
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-70, -16, 144, 5); ctx.fillStyle = '#F4E8CC'; ctx.font = 'bold 9px ' + FONT(); ctx.textAlign = 'center';
    ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, -20); ctx.lineTo(-56, 20 + Math.sin(t / 700) * 3); ctx.stroke(); ctx.fillStyle = '#7A4F2A'; rr(ctx, -64, 14, 14, 20, 5); ctx.fill();   // an oar in the water
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(ctx, bx - 60, by + 18, 12 + Math.sin(t / 300) * 3, 3); ell(ctx, bx + 70, by + 16, 10, 3);
  } });
  V.canary = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    const cyc = (t % 7000) / 7000;
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(268, 60, 10, 100); ctx.beginPath(); ctx.moveTo(272, 80); ctx.quadraticCurveTo(230, 70, 200, 78); ctx.lineTo(200, 84); ctx.quadraticCurveTo(232, 78, 272, 90); ctx.fill();
    ctx.fillStyle = '#2F7A44'; circ(ctx, 285, 50, 30); ctx.fillStyle = '#3F9A56'; circ(ctx, 272, 40, 20); circ(ctx, 300, 34, 16);
    person(ctx, api, 100, 176, 'right', 2.4);
    let bx = 212, by = 72, sing = cyc < 0.5;
    if (cyc >= 0.55 && cyc < 0.7) { const p = ease((cyc - 0.55) / 0.15); bx = lerp(212, 100, p); by = lerp(72, 96, p) - Math.sin(p * Math.PI) * 40; }
    else if (cyc >= 0.7 && cyc < 0.9) { bx = 100; by = 96; sing = true; }
    else if (cyc >= 0.9) { const p = ease((cyc - 0.9) / 0.1); bx = lerp(100, 212, p); by = lerp(96, 72, p) - Math.sin(p * Math.PI) * 40; }
    if (cyc >= 0.7 && cyc < 0.72 && !this.pl) { this.pl = true; api.A.play('bird'); } if (cyc < 0.7) this.pl = false;
    canary(ctx, bx, by, t, sing);
  } });
  V.cards = api => ({ draw(ctx, t) {
    dusk(ctx, t);
    ctx.fillStyle = '#2F7A44'; rr(ctx, 60, 120, 240, 70, 12); ctx.fill(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(70, 186, 10, 30); ctx.fillRect(280, 186, 10, 30);
    const g = ctx.createRadialGradient(180, 100, 10, 180, 100, 120); g.addColorStop(0, 'rgba(246,181,68,.25)'); g.addColorStop(1, 'rgba(246,181,68,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    person(ctx, api, 180, 128, 'down', 2.2);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, 60, 120, 240, 70, 12); ctx.fill();
    const cyc = (t % 2400) / 2400;
    for (let i = 0; i < 8; i++) { const f = clamp((cyc - i * 0.08) / 0.4, 0, 1), x = lerp(120, 240, ease(f)), y = 150 - Math.sin(f * Math.PI) * 30; ctx.save(); ctx.translate(x, y); ctx.rotate((f - 0.5) * 0.8); ctx.fillStyle = '#FFF'; rr(ctx, -11, -15, 22, 30, 3); ctx.fill(); ctx.fillStyle = i % 2 ? '#E4574F' : '#2A2420'; circ(ctx, 0, 0, 4); ctx.restore(); }
    ctx.fillStyle = '#F6B544'; for (let i = 0; i < 5; i++) circ(ctx, 90 + i * 9, 168, 5); ctx.fillStyle = '#D98F1F'; for (let i = 0; i < 5; i++) circ(ctx, 90 + i * 9, 168, 2);
  } });
  V.lamp = api => ({ draw(ctx, t) {
    sky(ctx, '#1C3439', '#2F555C'); ctx.fillStyle = '#25444A'; ctx.fillRect(0, 150, W, 70);
    ctx.fillStyle = '#FFF'; for (let i = 0; i < 20; i++) circ(ctx, jit(i, 12) * W, jit(i, 13) * 120, 0.8 + jit(i, 14));
    const lx = 230, ly = 60, fl = 0.85 + 0.15 * Math.sin(t / 90) * Math.sin(t / 37);
    const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 120); g.addColorStop(0, 'rgba(255,214,110,' + 0.5 * fl + ')'); g.addColorStop(1, 'rgba(255,214,110,0)'); ctx.fillStyle = g; circ(ctx, lx, ly, 120);
    ctx.fillStyle = '#2A2420'; ctx.fillRect(lx - 4, ly + 10, 8, 150); ctx.fillRect(lx - 14, ly + 152, 28, 8); rr(ctx, lx - 16, ly - 22, 32, 36, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(lx - 20, ly - 20); ctx.lineTo(lx, ly - 34); ctx.lineTo(lx + 20, ly - 20); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,120,' + fl + ')'; ctx.fillRect(lx - 12, ly - 18, 24, 28); ctx.fillStyle = '#FFF6D0'; ell(ctx, lx, ly, 4, 7);
    person(ctx, api, 130, 186, 'right', 2.4);
    const a = t / 500; ctx.fillStyle = '#E7D6B0'; const mx = lx + Math.cos(a) * 24, my = ly + Math.sin(a * 1.3) * 18; ell(ctx, mx, my, 4, 2.5, a); ell(ctx, mx - 3, my - 2, 3, 2, a + 0.6); ell(ctx, mx + 3, my - 2, 3, 2, a - 0.6);   // a moth circling the light
  } });
  V.stall = api => ({ draw(ctx, t) {
    square(ctx, t);
    const sx = 200, sy = 190; ctx.fillStyle = '#B08A5A'; ctx.fillRect(sx - 80, sy - 44, 160, 44); ctx.fillStyle = '#8B6A3E'; ctx.fillRect(sx - 80, sy - 44, 160, 5);
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(sx - 82, sy - 130, 6, 90); ctx.fillRect(sx + 76, sy - 130, 6, 90);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : '#E4574F'; const wob = Math.sin(t / 300 + i) * 2; ctx.beginPath(); ctx.moveTo(sx - 88 + i * 22, sy - 132); ctx.lineTo(sx - 66 + i * 22, sy - 132); ctx.lineTo(sx - 66 + i * 22, sy - 112 + wob); ctx.arc(sx - 77 + i * 22, sy - 112 + wob, 11, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#F6B544'; for (let i = 0; i < 4; i++) circ(ctx, sx - 60 + i * 12, sy - 50, 6); ctx.fillStyle = '#63C48F'; for (let i = 0; i < 3; i++) circ(ctx, sx - 4 + i * 12, sy - 51, 6); ctx.fillStyle = '#E4574F'; for (let i = 0; i < 3; i++) circ(ctx, sx + 40 + i * 12, sy - 50, 6);
    const sw = Math.sin(t / 600) * 0.2; ctx.save(); ctx.translate(sx + 40, sy - 110); ctx.rotate(sw); ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.stroke(); ctx.fillStyle = '#F4E8CC'; rr(ctx, -16, 18, 32, 16, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 10px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('99', 0, 30); ctx.restore();   // a price tag swinging in the wind
    person(ctx, api, 90, 200, 'right', 2.4);
    ctx.fillStyle = api.spec.skin; circ(ctx, 108 + Math.sin(t / 500) * 4, 152, 4);
  } });
  V.bench = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    const cyc = (t % 6000) / 6000, awake = cyc > 0.4 && cyc < 0.8;
    ctx.fillStyle = '#A2703F'; ctx.fillRect(140, 150, 150, 12); ctx.fillRect(140, 130, 150, 10); ctx.fillRect(148, 162, 8, 30); ctx.fillRect(274, 162, 8, 30); ctx.fillStyle = '#8B5A2B'; ctx.fillRect(140, 130, 150, 3); ctx.fillRect(140, 150, 150, 3);
    person(ctx, api, 100, 190, 'right', 2.4);
    cat(ctx, 220, 140, t, awake);
    if (!awake) for (let i = 0; i < 3; i++) { const f = ((t / 1800 + i / 3) % 1); ctx.fillStyle = 'rgba(42,36,32,' + (1 - f) + ')'; ctx.font = 'bold ' + (10 + i * 3) + 'px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('z', 250 + f * 20 + i * 8, 110 - f * 30); }
    else if (cyc < 0.5) { ctx.fillStyle = '#FF9A90'; ell(ctx, 240, 140, 5, 2); }
  } });
  V.apples = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(270, 40, 16, 140); ctx.fillStyle = '#2F7A44'; circ(ctx, 280, 50, 50); ctx.fillStyle = '#3F9A56'; circ(ctx, 258, 36, 30); circ(ctx, 300, 30, 24);
    ctx.fillStyle = '#E4574F'; for (let i = 0; i < 7; i++) circ(ctx, 250 + jit(i, 15) * 60, 20 + jit(i, 16) * 60, 5);
    const cyc = (t % 5000) / 5000, drop = cyc > 0.55 && cyc < 0.7 ? ease((cyc - 0.55) / 0.15) : cyc >= 0.7 ? 1 : 0;
    if (drop > 0) { circ(ctx, 232, 60 + drop * 96 + (drop === 1 ? 0 : 0), 6); }
    ctx.fillStyle = '#B08A5A'; ctx.beginPath(); ctx.moveTo(150, 140); ctx.lineTo(240, 140); ctx.lineTo(228, 186); ctx.lineTo(162, 186); ctx.fill(); ctx.strokeStyle = '#8B6A3E'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(152, 150 + i * 10); ctx.lineTo(238, 150 + i * 10); ctx.stroke(); }
    ctx.fillStyle = '#E4574F'; [[165, 134], [185, 128], [205, 130], [225, 134], [195, 118]].forEach(([x, y]) => { circ(ctx, x, y, 9); ctx.fillStyle = '#FFB3A8'; circ(ctx, x - 3, y - 3, 3); ctx.fillStyle = '#E4574F'; });
    const worm = cyc > 0.2 && cyc < 0.5 ? Math.sin((cyc - 0.2) / 0.3 * Math.PI) : 0;
    if (worm > 0) { ctx.fillStyle = '#FF9A90'; ell(ctx, 195, 112 - worm * 12, 4, 4 + worm * 8); ctx.fillStyle = '#2A2420'; circ(ctx, 194, 106 - worm * 16, 1); circ(ctx, 197, 106 - worm * 16, 1); }
    ctx.save(); if (worm > 0.5) ctx.translate(-6 * (worm - 0.5) * 2, 0); person(ctx, api, 110, 186, 'right', 2.4); ctx.restore();
    if (worm > 0.6) bang(ctx, 104, 104);
  } });
  V.scarecrow = api => ({ draw(ctx, t) {
    field(ctx, t);
    const cyc = (t % 6000) / 6000, scat = cyc > 0.5 && cyc < 0.62 ? (cyc - 0.5) / 0.12 : cyc >= 0.62 && cyc < 0.85 ? 1 : cyc >= 0.85 ? 1 - (cyc - 0.85) / 0.15 : 0;
    ctx.fillStyle = '#7A4F2A'; ctx.save(); ctx.translate(230, 168); ctx.rotate(1.35); ctx.fillRect(-5, -60, 10, 70); ctx.fillRect(-36, -40, 72, 8); ctx.restore();
    ctx.fillStyle = '#E2B93B'; circ(ctx, 172, 176, 14); ctx.fillStyle = '#2F80ED'; ctx.fillRect(196, 150, 40, 30);
    person(ctx, api, 90, 190, 'right', 2.4);
    if (cyc > 0.42 && cyc < 0.62) { const c = Math.abs(Math.sin(t / 90)); ctx.fillStyle = api.spec.skin; circ(ctx, 112 - c * 6, 140, 4); circ(ctx, 118 + c * 6, 140, 4); }
    [[200, 150], [260, 160], [300, 176], [150, 192]].forEach(([x, y], i) => { const fly = scat; crow(ctx, x + fly * (80 + i * 30), y - fly * (120 + i * 20), t, fly > 0 && fly < 1 || (!fly && ((t / 900 + i) % 1) < 0.15)); });
  } });
  V.bucket = api => ({ draw(ctx, t) {
    water(ctx, t, 130);
    ctx.fillStyle = '#EBD9A8'; ell(ctx, 120, 150, 140, 40); ctx.fillStyle = '#E2CD95'; for (let i = 0; i < 8; i++) circ(ctx, 20 + jit(i, 17) * 200, 140 + jit(i, 18) * 30, 3);
    person(ctx, api, 90, 176, 'right', 2.4);
    [150, 200].forEach((bx, k) => { ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(bx - 18, 140); ctx.lineTo(bx + 18, 140); ctx.lineTo(bx + 14, 180); ctx.lineTo(bx - 14, 180); ctx.fill(); ctx.fillStyle = '#B5B0A6'; ctx.fillRect(bx - 17, 146, 34, 3); ctx.fillRect(bx - 15, 168, 30, 3); ctx.strokeStyle = '#5B4F47'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, 140, 18, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#5FB3D9'; ell(ctx, bx, 144, 15, 4); ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(ctx, bx - 5, 143, 4, 1.5); });
    const cyc = (t % 4000) / 4000; if (cyc > 0.5 && cyc < 0.8) { const p = (cyc - 0.5) / 0.3; const fx = lerp(200, 300, p), fy = 140 - Math.sin(p * Math.PI) * 60; ctx.fillStyle = '#63C48F'; ell(ctx, fx, fy, 9, 6); circ(ctx, fx + 6, fy - 5, 5); ctx.fillStyle = '#FFF'; circ(ctx, fx + 5, fy - 7, 2); circ(ctx, fx + 9, fy - 7, 2); ctx.fillStyle = '#2A2420'; circ(ctx, fx + 5, fy - 7, 1); circ(ctx, fx + 9, fy - 7, 1); ctx.fillStyle = '#63C48F'; ell(ctx, fx - 6, fy + 4, 6, 3, 0.6); ell(ctx, fx + 8, fy + 4, 6, 3, -0.6); }   // a frog hops out
    else if (cyc >= 0.8) ripple(ctx, 300, 150, (cyc - 0.8) / 0.2, 20);
    if (cyc > 0.45 && cyc < 0.6) bang(ctx, 90, 96);
  } });
  V.orepile = api => ({ draw(ctx, t) {
    dusk(ctx, t);
    ctx.fillStyle = '#6E6A62'; [[230, 176, 26], [270, 172, 24], [250, 148, 22], [300, 180, 18], [210, 186, 16]].forEach(([x, y, r]) => circ(ctx, x, y, r)); ctx.fillStyle = '#7A766D'; circ(ctx, 246, 142, 10); circ(ctx, 226, 170, 9);
    for (let i = 0; i < 9; i++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 400 + i * 1.7)); ctx.fillStyle = 'rgba(246,181,68,' + tw + ')'; const x = 215 + jit(i, 19) * 90, y = 140 + jit(i, 20) * 50, s = 2 + tw * 3; ctx.beginPath(); ctx.moveTo(x, y - s * 2); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 2); ctx.lineTo(x - s, y); ctx.fill(); }
    const cyc = (t % 4500) / 4500, up = cyc > 0.3 && cyc < 0.7 ? Math.sin((cyc - 0.3) / 0.4 * Math.PI) : 0;
    person(ctx, api, 130, 190, 'right', 2.4);
    ctx.fillStyle = '#F6B544'; circ(ctx, 152, 150 - up * 40, 5 + up * 3); if (up > 0.7) { ctx.fillStyle = 'rgba(255,240,190,' + (up - 0.7) * 3 + ')'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t / 500; circ(ctx, 152 + Math.cos(a) * 18, 110 + Math.sin(a) * 18, 2); } }
  } });
  V.ropes = api => ({ draw(ctx, t) {
    water(ctx, t, 100); ctx.fillStyle = '#B08A5A'; ctx.fillRect(0, 130, W, 90); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 6; i++) ctx.fillRect(0, 140 + i * 14, W, 2);
    ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(240, 176, 34, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(240, 176, 18, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#8B6A3E'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(240, 176, 34, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(240, 176, 18, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(275, 176); ctx.quadraticCurveTo(320, 150, 340, 120); ctx.stroke(); ctx.fillStyle = '#5B4F47'; ctx.fillRect(334, 100, 10, 30);
    const cyc = (t % 5000) / 5000, cx = cyc < 0.6 ? lerp(240, 150, ease(cyc / 0.6)) : 150, legs = Math.sin(t / 120) * 3;
    ctx.fillStyle = '#E4574F'; ell(ctx, cx, 190, 14, 9); ctx.fillStyle = '#B3463A'; [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { ctx.fillRect(cx + s * (10 + i * 4), 192 + (i % 2 ? legs : -legs), 3, 8); } ctx.fillRect(cx + s * 16, 178, 4, 10); circ(ctx, cx + s * 18, 176, 5); }); ctx.fillStyle = '#FFF'; circ(ctx, cx - 4, 184, 2.5); circ(ctx, cx + 4, 184, 2.5); ctx.fillStyle = '#2A2420'; circ(ctx, cx - 4, 184, 1.2); circ(ctx, cx + 4, 184, 1.2);   // a crab sidles out
    person(ctx, api, 100, 190, 'right', 2.4);
    if (cyc > 0.55 && cyc < 0.7) bang(ctx, 100, 110);
  } });
  V.broom = api => ({ draw(ctx, t) {
    square(ctx, t);
    const cyc = (t % 4000) / 4000, sw = Math.sin(t / 220) * 14, sneeze = cyc > 0.7 && cyc < 0.78;
    ctx.save(); if (sneeze) ctx.translate(0, 6); person(ctx, api, 130, 190, 'right', 2.4); ctx.restore();
    ctx.strokeStyle = '#A2703F'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(150, 140); ctx.lineTo(200 + sw, 192); ctx.stroke();
    ctx.fillStyle = '#E2B93B'; ctx.beginPath(); ctx.moveTo(188 + sw, 184); ctx.lineTo(214 + sw, 184); ctx.lineTo(226 + sw, 206); ctx.lineTo(178 + sw, 206); ctx.fill(); ctx.fillStyle = '#B9932F'; ctx.fillRect(190 + sw, 186, 22, 4);
    ctx.fillStyle = 'rgba(200,190,170,.7)'; for (let i = 0; i < 8; i++) { const f = ((t / 700 + jit(i, 21)) % 1); circ(ctx, 200 + sw + (jit(i, 22) - 0.5) * 40, 200 - f * 30, 3 - f * 2); }
    if (sneeze) { ctx.fillStyle = '#FFF'; rr(ctx, 140, 100, 70, 22, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 13px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('A-choo!', 175, 116); }
  } });
  V.sign = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(228, 90, 12, 100); ctx.fillStyle = '#F4E8CC'; rr(ctx, 170, 70, 130, 36, 8); ctx.fill(); ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 3; rr(ctx, 170, 70, 130, 36, 8); ctx.stroke();
    ctx.fillStyle = '#2A2420'; ctx.font = 'bold 15px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText(api.opts.text || '', 235, 94);
    const cyc = (t % 5000) / 5000; let bx = 380, by = 30; if (cyc > 0.2 && cyc < 0.4) { const p = ease((cyc - 0.2) / 0.2); bx = lerp(380, 250, p); by = lerp(30, 62, p) - Math.sin(p * Math.PI) * 30; } else if (cyc >= 0.4 && cyc < 0.85) { bx = 250; by = 62; } else if (cyc >= 0.85) { const p = (cyc - 0.85) / 0.15; bx = 250 - p * 200; by = 62 - p * 80; }
    ctx.fillStyle = '#5FB3D9'; ell(ctx, bx, by, 9, 6); circ(ctx, bx + 7, by - 5, 5); ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(bx + 11, by - 5); ctx.lineTo(bx + 17, by - 4); ctx.lineTo(bx + 11, by - 2); ctx.fill(); ctx.fillStyle = '#2A2420'; circ(ctx, bx + 8, by - 6, 1);
    person(ctx, api, 120, 190, 'right', 2.4);
  } });
  V.crate = api => ({ draw(ctx, t) {
    square(ctx, t);
    const cyc = (t % 3000) / 3000, push = cyc < 0.6 ? Math.sin(cyc / 0.6 * Math.PI) : 0;
    ctx.fillStyle = '#B08A5A'; ctx.fillRect(190, 130, 70, 62); ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 4; ctx.strokeRect(190, 130, 70, 62); ctx.beginPath(); ctx.moveTo(190, 130); ctx.lineTo(260, 192); ctx.moveTo(260, 130); ctx.lineTo(190, 192); ctx.stroke();
    ctx.save(); ctx.translate(140 + push * 8, 192); ctx.rotate(push * 0.35); person(ctx, api, 0, 0, 'right', 2.4); ctx.restore();
    if (cyc > 0.65) { ctx.fillStyle = '#5FB3D9'; ell(ctx, 128, 110 + (cyc - 0.65) * 60, 3, 5); }
  } });
  V.logs = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    [[200, 180], [240, 180], [280, 180], [220, 150], [260, 150]].forEach(([x, y]) => { ctx.fillStyle = '#A2703F'; ctx.fillRect(x - 20, y - 16, 40, 32); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(x - 20, y - 16, 40, 4); ctx.fillStyle = '#E2CD95'; circ(ctx, x + 20, y, 15); ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 20, y, 9, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 20, y, 4, 0, TAU); ctx.stroke(); });
    const cyc = (t % 4000) / 4000, sx = lerp(300, 180, ease(clamp(cyc / 0.7, 0, 1))), hop = Math.abs(Math.sin(t / 100)) * 5;
    ctx.fillStyle = '#B04A2A'; ell(ctx, sx, 128 - hop, 10, 7); circ(ctx, sx - 8, 122 - hop, 5); ctx.save(); ctx.translate(sx + 8, 128 - hop); ctx.rotate(-0.4 + Math.sin(t / 200) * 0.2); ell(ctx, 4, -10, 5, 12); ctx.restore(); ctx.fillStyle = '#FFF'; circ(ctx, sx - 10, 121 - hop, 1.5); ctx.fillStyle = '#2A2420'; circ(ctx, sx - 10, 121 - hop, 0.8);   // a squirrel runs along the top log
    person(ctx, api, 110, 192, 'right', 2.4);
  } });
  V.tripod = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(320, 60, 10, 110); ctx.fillStyle = '#2F7A44'; circ(ctx, 325, 50, 30);
    ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(180, 110); ctx.lineTo(150, 190); ctx.moveTo(180, 110); ctx.lineTo(210, 190); ctx.moveTo(180, 110); ctx.lineTo(180, 192); ctx.stroke(); ctx.fillStyle = '#F6B544'; rr(ctx, 160, 92, 40, 22, 4); ctx.fill(); ctx.fillStyle = '#2A2420'; circ(ctx, 200, 103, 6); ctx.fillStyle = '#5FB3D9'; circ(ctx, 200, 103, 3.5);
    ctx.strokeStyle = 'rgba(246,181,68,' + (0.4 + 0.4 * Math.sin(t / 250)) + ')'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.lineDashOffset = -t / 40; ctx.beginPath(); ctx.moveTo(206, 103); ctx.lineTo(318, 96); ctx.stroke(); ctx.setLineDash([]);
    person(ctx, api, 130, 190, 'right', 2.4);
  } });
  V.pot2 = api => ({ draw(ctx, t) {
    square(ctx, t);
    ctx.fillStyle = '#C0623F'; ctx.beginPath(); ctx.moveTo(190, 140); ctx.lineTo(250, 140); ctx.lineTo(242, 192); ctx.lineTo(198, 192); ctx.fill(); ctx.fillStyle = '#D97A54'; ctx.fillRect(186, 134, 68, 10);
    ctx.strokeStyle = '#2F7A44'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(220, 136); ctx.quadraticCurveTo(216, 110, 222, 86); ctx.stroke(); ctx.fillStyle = '#63C48F'; ell(ctx, 208, 118, 10, 5, -0.5); ell(ctx, 232, 108, 10, 5, 0.5);
    ctx.fillStyle = '#FF7B6B'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(ctx, 222 + Math.cos(a) * 10, 84 + Math.sin(a) * 10, 6, 4, a); } ctx.fillStyle = '#F6B544'; circ(ctx, 222, 84, 5);
    const a = t / 400, bx = 222 + Math.cos(a) * 30, by = 84 + Math.sin(a * 2) * 12; ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(ctx, bx - 3, by - 5, 4, 2.5, -0.5); ell(ctx, bx + 3, by - 5, 4, 2.5, 0.5); ctx.fillStyle = '#F6B544'; ell(ctx, bx, by, 6, 4); ctx.fillStyle = '#2A2420'; ctx.fillRect(bx - 4, by - 3, 2, 6); ctx.fillRect(bx, by - 3, 2, 6);   // a bee
    person(ctx, api, 120, 192, 'right', 2.4);
  } });
  V.tollbox = api => ({ draw(ctx, t) {
    water(ctx, t, 90); ctx.fillStyle = '#B08A5A'; ctx.fillRect(0, 120, W, 100); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 12; i++) ctx.fillRect(i * 32, 120, 2, 100); ctx.fillRect(0, 124, W, 4);
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(228, 140, 14, 60); ctx.fillStyle = '#F6B544'; rr(ctx, 196, 100, 78, 46, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.fillRect(220, 108, 30, 5); ctx.font = 'bold 14px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('TOLL', 235, 134);
    const cyc = (t % 2500) / 2500; if (cyc < 0.5) { ctx.fillStyle = '#F6B544'; circ(ctx, 208 + cyc * 50, 108 - Math.sin(cyc * 2 * Math.PI) * 30, 6); ctx.fillStyle = '#D98F1F'; circ(ctx, 208 + cyc * 50, 108 - Math.sin(cyc * 2 * Math.PI) * 30, 3); }
    if (cyc > 0.5 && cyc < 0.55 && !this.pl) { this.pl = true; api.A.play('coin'); } if (cyc < 0.5) this.pl = false;
    person(ctx, api, 150, 200, 'right', 2.4);
  } });
  V.throne = api => ({ draw(ctx, t) {
    sky(ctx, '#B8B3A8', '#8E8A80'); ctx.fillStyle = '#A9A39A'; ctx.fillRect(0, 150, W, 70);
    ctx.fillStyle = '#6E6A62'; rr(ctx, 160, 40, 80, 130, 10); ctx.fill(); ctx.fillStyle = '#8E8A80'; rr(ctx, 172, 56, 56, 100, 8); ctx.fill(); ctx.fillStyle = '#5B5652'; rr(ctx, 150, 140, 100, 26, 6); ctx.fill(); ctx.fillStyle = '#6E6A62'; ctx.fillRect(154, 166, 12, 24); ctx.fillRect(234, 166, 12, 24);
    const g = ctx.createRadialGradient(200, 100, 10, 200, 100, 120); g.addColorStop(0, 'rgba(246,181,68,' + (0.15 + 0.1 * Math.sin(t / 600)) + ')'); g.addColorStop(1, 'rgba(246,181,68,0)'); ctx.fillStyle = g; circ(ctx, 200, 100, 120);
    person(ctx, api, 100, 196, 'right', 2.4); ctx.fillStyle = api.spec.skin; circ(ctx, 124 + Math.sin(t / 700) * 6, 150, 4);
  } });
  V.cart = api => ({ draw(ctx, t) {
    dusk(ctx, t);
    const wob = Math.sin(t / 300) * 0.05;
    ctx.save(); ctx.translate(230, 180); ctx.rotate(wob + 0.08); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-60, -50, 120, 44); ctx.fillStyle = '#5B4F47'; ctx.fillRect(-60, -50, 120, 6); ctx.fillStyle = '#6E6A62'; [-30, 0, 30].forEach(x => circ(ctx, x, -54, 12)); ctx.fillStyle = '#2A2420'; circ(ctx, -36, 0, 16); ctx.fillStyle = '#8E8A80'; circ(ctx, -36, 0, 5); ctx.restore();
    ctx.save(); ctx.translate(300, 196); ctx.rotate(1.2 + Math.sin(t / 500) * 0.1); ctx.fillStyle = '#2A2420'; circ(ctx, 0, 0, 16); ctx.fillStyle = '#8E8A80'; circ(ctx, 0, 0, 5); ctx.restore();
    person(ctx, api, 120, 196, 'right', 2.4);
  } });
  V.oar = api => ({ draw(ctx, t) {
    water(ctx, t, 100); ctx.fillStyle = '#EBD9A8'; ell(ctx, 120, 200, 200, 50); ctx.fillStyle = '#EBD9A8'; ctx.fillRect(0, 150, 230, 70);
    ctx.save(); ctx.translate(220, 176); ctx.rotate(-0.4); ctx.fillStyle = '#A2703F'; ctx.fillRect(-60, -5, 120, 10); ctx.fillStyle = '#7A4F2A'; rr(ctx, 50, -12, 34, 24, 10); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#EBD9A8'; ell(ctx, 200, 190, 40, 14); ctx.fillStyle = '#3F9A56'; ell(ctx, 240, 170, 14, 5, 0.5);
    const cyc = (t % 3000) / 3000; ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(ctx, 240, 156 + cyc * 8, 60, 6);
    person(ctx, api, 110, 196, 'right', 2.4);
  } });
  V.lostsign = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    ctx.save(); ctx.translate(230, 170); ctx.rotate(-0.5); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-6, -10, 12, 60); ctx.fillStyle = '#F4E8CC'; rr(ctx, -50, -36, 100, 34, 6); ctx.fill(); ctx.fillStyle = '#8B6A3E'; ell(ctx, -10, -20, 20, 6, 0.3); ctx.restore();
    const cyc = (t % 4000) / 4000, bx = 250 + Math.cos(cyc * TAU) * 30, by = 120 + Math.sin(cyc * TAU * 2) * 10; ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(ctx, bx - 4, by, 4, 3, cyc * 20); ell(ctx, bx + 4, by, 4, 3, -cyc * 20);   // a butterfly
    person(ctx, api, 120, 196, 'right', 2.4);
  } });
  V.brokenfence = api => ({ draw(ctx, t) {
    meadow(ctx, t);
    ctx.fillStyle = '#A2703F'; ctx.fillRect(150, 110, 12, 80); ctx.fillRect(290, 110, 12, 80); ctx.fillRect(150, 124, 152, 10);
    ctx.save(); ctx.translate(162, 160); ctx.rotate(0.45 + Math.sin(t / 400) * 0.03); ctx.fillRect(0, -5, 110, 10); ctx.restore();
    person(ctx, api, 100, 196, 'right', 2.4);
  } });

  /* ================= mini-games ================= */
  const G = {};

  /* Dodge's cups. mode 'trick': the pea is palmed and never under a cup. 'reveal': the same, slowly, with
     the pea shown sliding into his hand. 'fair': the pea really stays under a cup. */
  G.cups = api => {
    const L = api.lines, mode = api.opts.mode || 'trick', A = api.A;
    const slots = [100, 170, 240], TY = 152, dodge = api.opts.npcSpec || { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'curly', shirt: '#2F80ED', pants: '#5B4F47', cap: '#2A2420' };
    const pos = [0, 1, 2];                        // pos[cup] = which slot the cup stands in
    const peaCup = Math.floor(Math.random() * 3), swaps = [];
    const n = mode === 'reveal' ? 4 : 8;
    for (let k = 0; k < n; k++) { const a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3; swaps.push([a, b, mode === 'reveal' ? 520 : Math.max(170, 460 - k * 45)]); }
    let phase = 'show', p0 = 0, si = 0, sw = null, cursor = 1, picked = -1, said = '';
    const say = k => { if (said !== k) { said = k; api.caption(L[k]); } };
    say(mode === 'fair' ? 'fair' : mode === 'reveal' ? 'show' : 'watch');
    const cupX = i => { if (sw && (sw.a === i || sw.b === i)) { const p = ease(sw.p), from = slots[sw.from[i]], to = slots[sw.to[i]]; return lerp(from, to, p); } return slots[pos[i]]; };
    const cupLift = (i, t) => {
      if (phase === 'show') return 34; if (phase === 'lower') return 34 * (1 - ease(clamp((t - p0) / 500, 0, 1)));
      if (sw && (sw.a === i || sw.b === i)) return Math.sin(sw.p * Math.PI) * (sw.a === i ? 6 : -2);
      if (phase === 'reveal' || phase === 'end') { const d = t - p0; if (i === picked) return 34 * ease(clamp(d / 500, 0, 1)); return 34 * ease(clamp((d - 1100) / 500, 0, 1)); }
      return 0;
    };
    function choose(i) { if (phase !== 'pick') return; picked = i; phase = 'reveal'; p0 = performance.now() - api.t0; A.play('open'); }
    return {
      draw(ctx, t) {
        meadow(ctx, t, 150);
        // timeline
        if (phase === 'show' && t > 1300) { phase = 'lower'; p0 = t; }
        if (phase === 'lower' && t > p0 + 550) { phase = 'palm'; p0 = t; }
        if (phase === 'palm' && t > p0 + (mode === 'reveal' ? 1600 : 500)) { phase = 'shuffle'; p0 = t; si = 0; sw = null; if (mode !== 'fair') say('shuffle'); A.play('dice'); }
        if (phase === 'shuffle') {
          if (!sw) { if (si >= swaps.length) { phase = 'pick'; p0 = t; say('pick'); } else { const [a, b, d] = swaps[si++]; sw = { a, b, d, t0: t, p: 0, from: pos.slice(), to: pos.slice() }; sw.to[a] = pos[b]; sw.to[b] = pos[a]; } }
          if (sw) { sw.p = clamp((t - sw.t0) / sw.d, 0, 1); if (sw.p >= 1) { pos[sw.a] = sw.to[sw.a]; pos[sw.b] = sw.to[sw.b]; sw = null; } }
        }
        if (phase === 'reveal') { const d = t - p0; const fair = mode === 'fair'; if (d > 600 && fair) { say(picked === peaCup ? 'fairWin' : 'fairLose'); } if (d > 600 && !fair) say('empty'); if (d > 2200 && !fair) say('palm'); if (d > (fair ? 1800 : 3200)) { phase = 'end'; api.finish({}); } }
        // Dodge stands at the end of the table; his far hand rests closed on the corner (the pea lives there)
        Wd().drawPerson(ctx, 322, TY + 30, dodge, 'left', 0, 2.3);
        ctx.fillStyle = '#8B5A2B'; rr(ctx, 30, TY - 6, 280, 14, 6); ctx.fill(); ctx.fillStyle = '#A2703F'; rr(ctx, 34, TY - 8, 272, 8, 4); ctx.fill(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(46, TY + 8, 10, 60); ctx.fillRect(284, TY + 8, 10, 60);
        const open = (phase === 'reveal' || phase === 'end') && mode !== 'fair' && t - p0 > 2000, showPalm = mode === 'reveal' && phase !== 'show' && phase !== 'lower';
        ctx.fillStyle = dodge.skin; if (open) ell(ctx, 296, TY - 5, 13, 8); else circ(ctx, 296, TY - 4, 8);
        if (open || showPalm && phase !== 'palm') { ctx.fillStyle = '#63C48F'; circ(ctx, 296, TY - 6, 4); if (open) { ctx.strokeStyle = '#F6B544'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(296, TY - 6, 16 + Math.sin(t / 150) * 2, 0, TAU); ctx.stroke(); } }
        // the pea: under its cup while shown, then (reveal mode) sliding to his hand; fair mode keeps it under the cup
        const pcx = cupX(peaCup);
        let peaAt = null;
        if (phase === 'show' || phase === 'lower') peaAt = [pcx, TY - 6];
        else if (mode === 'fair' && (phase === 'reveal' || phase === 'end') && t - p0 > 1100) peaAt = [pcx, TY - 6];
        else if (mode === 'reveal' && phase === 'palm') { const p = ease(clamp((t - p0) / 1400, 0, 1)); peaAt = [lerp(pcx, 296, p), TY - 6 - Math.sin(p * Math.PI) * 10]; }
        if (peaAt) { ctx.fillStyle = '#63C48F'; circ(ctx, peaAt[0], peaAt[1], 5); ctx.fillStyle = '#BFEBD6'; circ(ctx, peaAt[0] - 1.5, peaAt[1] - 1.5, 1.6); if (mode === 'reveal' && phase === 'palm') { ctx.strokeStyle = '#F6B544'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(peaAt[0], peaAt[1], 12, 0, TAU); ctx.stroke(); } }
        // cups, back to front by slot so overlaps look right
        const order = [0, 1, 2].sort((a, b) => cupX(a) - cupX(b));
        order.forEach(i => {
          const x = cupX(i), lift = cupLift(i, t), y = TY - lift;
          ctx.fillStyle = 'rgba(0,0,0,.16)'; ell(ctx, x, TY - 2, 26, 6);
          ctx.fillStyle = '#E4574F'; ctx.beginPath(); ctx.moveTo(x - 18, y - 48); ctx.lineTo(x + 18, y - 48); ctx.lineTo(x + 26, y - 4); ctx.lineTo(x - 26, y - 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#B3463A'; ell(ctx, x, y - 4, 26, 6); ctx.fillStyle = '#F4E8CC'; ctx.fillRect(x - 19, y - 40, 38, 6); ctx.fillStyle = '#D95A4B'; ell(ctx, x, y - 48, 18, 5); ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, x - 14, y - 44, 6, 32, 3); ctx.fill();
          if (phase === 'pick' && cursor === i) { ctx.strokeStyle = '#F6B544'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t / 40; ctx.beginPath(); ctx.moveTo(x - 30, y - 56); ctx.lineTo(x + 30, y - 56); ctx.lineTo(x + 34, y + 4); ctx.lineTo(x - 34, y + 4); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(x, y - 62); ctx.lineTo(x - 8, y - 76); ctx.lineTo(x + 8, y - 76); ctx.fill(); }
        });
      },
      pointer(x) { let best = 0; slots.forEach((sx, i) => { if (Math.abs(x - sx) < Math.abs(x - slots[best])) best = i; }); cursor = [0, 1, 2].find(c => pos[c] === best); choose(cursor); },
      key(k) {
        if (phase !== 'pick') return;
        const slot = pos[cursor];
        if (k === 'ArrowLeft' || k === 'a') cursor = [0, 1, 2].find(c => pos[c] === Math.max(0, slot - 1));
        if (k === 'ArrowRight' || k === 'd') cursor = [0, 1, 2].find(c => pos[c] === Math.min(2, slot + 1));
        if (k === 'Enter' || k === ' ') choose(cursor);
      }
    };
  };

  /* Red or black at Ace's table: six fair flips, then the question that matters. */
  G.streak = api => {
    const L = api.lines, A = api.A, T = api.T;
    const guesses = [], flips = [];   // colours 'r'|'b'
    let flip = null, cursor = 0, phase = 'guess', p0 = 0;
    api.caption(L.intro);
    const askNext = () => { api.caption(L.prompt, false); api.buttons([{ text: L.red, on: () => guess('r') }, { text: L.black, on: () => guess('b') }]); };
    setTimeout(askNext, 1600);
    function guess(c) {
      if (phase !== 'guess' || flip) return;
      const col = Math.random() < 0.5 ? 'r' : 'b'; guesses.push(c); flips.push(col); flip = { t0: performance.now() - api.t0, col, ok: c === col };
      api.buttons([]); A.play('open');
    }
    function question() {
      phase = 'ask'; api.caption(L.question);
      const opts = L.options.slice().sort(() => Math.random() - 0.5), right = L.options.find(o => o.right);
      api.buttons(opts.map(o => ({ text: o.text, on: () => { api.buttons([]); const ok = !!o.right; phase = 'end'; api.caption(ok ? L.right : L.wrong); api.finish({ coins: ok ? api.game.pay : 0, lesson: { fid: 'gambler', ok, chosen: o.text, correct: right.text } }); } })));
    }
    function card(ctx, x, y, col, face, w, h) {
      w = w || 30; h = h || 42;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(ctx, x - w / 2 + 2, y - h / 2 + 3, w, h, 4); ctx.fill();
      if (!face) { ctx.fillStyle = '#2F6E7E'; rr(ctx, x - w / 2, y - h / 2, w, h, 4); ctx.fill(); ctx.strokeStyle = '#F4E8CC'; ctx.lineWidth = 1.5; rr(ctx, x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 3); ctx.stroke(); ctx.fillStyle = '#BFEBD6'; ell(ctx, x, y, w * 0.18, h * 0.22); return; }
      ctx.fillStyle = '#FFF'; rr(ctx, x - w / 2, y - h / 2, w, h, 4); ctx.fill(); ctx.strokeStyle = '#E7D6B0'; ctx.lineWidth = 1; rr(ctx, x - w / 2, y - h / 2, w, h, 4); ctx.stroke();
      ctx.fillStyle = col === 'r' ? '#E4574F' : '#2A2420';
      if (col === 'r') { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 8, y); ctx.fill(); }
      else { circ(ctx, x - 5, y - 1, 5); circ(ctx, x + 5, y - 1, 5); ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 9, y - 1); ctx.lineTo(x - 9, y - 1); ctx.fill(); ctx.fillRect(x - 1.5, y, 3, 9); }
    }
    return {
      draw(ctx, t) {
        dusk(ctx, t);
        const g = ctx.createRadialGradient(180, 90, 10, 180, 90, 170); g.addColorStop(0, 'rgba(246,181,68,.25)'); g.addColorStop(1, 'rgba(246,181,68,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#2F7A44'; rr(ctx, 16, 44, 328, 160, 16); ctx.fill(); ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 6; rr(ctx, 16, 44, 328, 160, 16); ctx.stroke();
        // the four reds that "came up in a row", small, at the top
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = 'bold 11px ' + FONT(); ctx.textAlign = 'left';
        for (let i = 0; i < 4; i++) card(ctx, 50 + i * 26, 70, 'r', true, 22, 30);
        ctx.fillStyle = '#F4E8CC'; ctx.font = 'bold 12px ' + FONT(); ctx.textAlign = 'left'; ctx.fillText('→', 154, 75);
        // the six slots
        for (let i = 0; i < 6; i++) {
          const x = 66 + i * 46, y = 130, done = i < flips.length && !(flip && i === flips.length - 1);
          if (done) { card(ctx, x, y, flips[i], true); ctx.fillStyle = guesses[i] === flips[i] ? '#63C48F' : '#E4574F'; circ(ctx, x, y + 32, 6); ctx.fillStyle = '#FFF'; ctx.font = 'bold 9px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText(guesses[i] === flips[i] ? '✓' : '✗', x, y + 35); }
          else if (flip && i === flips.length - 1) { const p = clamp((t - flip.t0) / 600, 0, 1), sx = Math.abs(Math.cos(p * Math.PI)); ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.04, sx), 1); card(ctx, 0, 0, flip.col, p > 0.5); ctx.restore(); if (p >= 1) { A.play(flip.ok ? 'good' : 'bad'); flip = null; if (flips.length >= 6) setTimeout(question, 700); else setTimeout(askNext, 500); } }
          else { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); rr(ctx, x - 15, y - 21, 30, 42, 4); ctx.stroke(); ctx.setLineDash([]); if (phase === 'guess' && i === flips.length) { ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x - 7, y - 42); ctx.lineTo(x + 7, y - 42); ctx.fill(); } }
        }
        for (let i = 0; i < 4; i++) card(ctx, 318, 74 - i * 2, 'b', false, 26, 36);   // the deck
        // a running streak count of the last few flips, so a child can see "same colour again"
        let run = 0; for (let i = flips.length - 1; i >= 0 && flips[i] === flips[flips.length - 1]; i--) run++;
        if (run >= 2 && !flip) { ctx.fillStyle = '#F6B544'; rr(ctx, 40, 168, 150, 22, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 12px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText(T('Same colour ×{n}', { n: run }), 115, 183); }
        if (phase === 'guess' && !flip && flips.length < 6) { const cx = 66 + flips.length * 46; card(ctx, cursor === 0 ? 100 : 260, 176, cursor === 0 ? 'r' : 'b', true, 26, 36); }
      },
      pointer(x) { if (phase !== 'guess') return; guess(x < 180 ? 'r' : 'b'); },
      key(k) { if (phase !== 'guess') return; if (k === 'ArrowLeft' || k === 'a' || k === 'r') cursor = 0; if (k === 'ArrowRight' || k === 'd' || k === 'b') cursor = 1; if (k === 'Enter' || k === ' ') guess(cursor === 0 ? 'r' : 'b'); }
    };
  };

  /* Skipping stones: hit the green on a swinging meter, three times. */
  G.stones = api => {
    const L = api.lines, A = api.A;
    let throws = 0, total = 0, phase = 'aim', fly = null;
    api.caption(L.intro);
    function act() {
      if (phase !== 'aim') return;
      const m = (Math.sin(performance.now() / 260) + 1) / 2, acc = 1 - Math.abs(m - 0.5) * 2, skips = Math.max(1, Math.round(acc * acc * 6.4));
      const hops = []; let x = 120, len = 40 + skips * 8, h = 34;
      for (let i = 0; i < skips; i++) { hops.push({ x0: x, x1: x + len, h }); x += len; len *= 0.72; h *= 0.7; }
      fly = { t0: performance.now() - api.t0, hops, dur: 500 + skips * 260, skips, splash: 0 }; phase = 'fly'; A.play('open');
    }
    return {
      draw(ctx, t) {
        water(ctx, t, 110); ctx.fillStyle = '#EBD9A8'; ell(ctx, 40, 200, 130, 46);
        ctx.fillStyle = '#A9A39A'; [[30, 196], [52, 204], [70, 194]].forEach(([x, y]) => ell(ctx, x, y, 9, 4));
        const arm = phase === 'aim' ? Math.sin(t / 260) * 0.3 : 0;
        person(ctx, api, 88, 200, 'right', 2.4);
        if (phase === 'aim') { ctx.fillStyle = '#A9A39A'; ell(ctx, 112 + arm * 20, 150 - arm * 30, 6, 3.5, arm); }
        if (fly) {
          const p = clamp((t - fly.t0) / fly.dur, 0, 1), n = fly.hops.length, f = p * n, i = Math.min(n - 1, Math.floor(f)), q = f - i, hp = fly.hops[i];
          const x = lerp(hp.x0, hp.x1, q), y = 150 - Math.sin(q * Math.PI) * hp.h;
          for (let k = 0; k < i; k++) ripple(ctx, fly.hops[k].x1, 150, clamp((f - k - 1) / 1.5, 0, 1), 16);
          if (p < 1) { ctx.fillStyle = '#A9A39A'; ell(ctx, x, y, 6, 3.5, q * 6); }
          else { ripple(ctx, fly.hops[n - 1].x1, 150, clamp((t - fly.t0 - fly.dur) / 700, 0, 1), 20); if (!fly.splash) { fly.splash = 1; A.play('splash'); total += fly.skips; throws++; } }
          ctx.fillStyle = '#FFF'; rr(ctx, 250, 40, 60, 26, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 14px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('×' + Math.min(fly.skips, i + (p >= 1 ? 1 : 0)), 280, 58);
          if (p >= 1 && t - fly.t0 - fly.dur > 800) { fly = null; if (throws >= 3) { phase = 'end'; api.caption(total > 3 ? L.done : L.none); api.finish({ coins: Math.min(api.game.pay, total) }); } else phase = 'aim'; }
        }
        // the meter
        if (phase !== 'end') {
          const bx = 130, by = 24, bw = 200, m = (Math.sin(t / 260) + 1) / 2;
          ctx.fillStyle = 'rgba(20,38,43,.55)'; rr(ctx, bx - 6, by - 6, bw + 12, 26, 10); ctx.fill();
          ctx.fillStyle = '#E4574F'; rr(ctx, bx, by, bw, 14, 6); ctx.fill(); ctx.fillStyle = '#F6B544'; ctx.fillRect(bx + bw * 0.28, by, bw * 0.44, 14); ctx.fillStyle = '#63C48F'; ctx.fillRect(bx + bw * 0.41, by, bw * 0.18, 14);
          ctx.fillStyle = '#FFF'; rr(ctx, bx + m * bw - 4, by - 4, 8, 22, 3); ctx.fill(); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1.5; rr(ctx, bx + m * bw - 4, by - 4, 8, 22, 3); ctx.stroke();
          for (let i = 0; i < 3; i++) { ctx.fillStyle = i < 3 - throws ? '#A9A39A' : 'rgba(255,255,255,.25)'; ell(ctx, 40 + i * 18, 40, 7, 4); }
        }
        ctx.fillStyle = '#FFF'; rr(ctx, 20, 60, 70, 24, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 13px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('🪙 ' + Math.min(api.game.pay, total), 55, 77);
      },
      pointer() { act(); },
      key(k) { if (k === 'Enter' || k === ' ') act(); }
    };
  };

  /* Shoo the crows: they pop up in the seed rows; tap them before they eat. Twenty seconds. */
  G.crows = api => {
    const L = api.lines, A = api.A, DUR = 20000;
    const spots = [[70, 150], [150, 150], [230, 150], [110, 186], [190, 186], [270, 186]];
    const birds = []; let score = 0, lost = 0, next = 900, cursor = 1, phase = 'play', endAt = 0;
    api.caption(L.intro);
    function shoo(i) { const b = birds.find(b => b.spot === i && b.state === 'up'); if (!b) return; b.state = 'shoo'; b.t1 = performance.now() - api.t0; score++; A.play('bird'); }
    return {
      draw(ctx, t) {
        field(ctx, t);
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(176, 60, 8, 90); ctx.fillRect(140, 80, 80, 6); ctx.fillStyle = '#2F80ED'; ctx.fillRect(160, 82, 40, 34); ctx.fillStyle = '#E2B93B'; circ(ctx, 180, 66, 14); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(162, 52, 36, 6); rr(ctx, 168, 38, 24, 16, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; circ(ctx, 175, 64, 1.5); circ(ctx, 185, 64, 1.5);
        if (phase === 'play') {
          if (t > next) { const free = spots.map((s, i) => i).filter(i => !birds.some(b => b.spot === i && b.state !== 'gone')); if (free.length) { birds.push({ spot: free[Math.floor(Math.random() * free.length)], t0: t, state: 'up', life: 1100 + Math.random() * 700 }); } next = t + 450 + Math.random() * 500 - Math.min(300, t / 80); }
          if (t > DUR) { phase = 'end'; endAt = t; birds.forEach(b => { if (b.state === 'up') { b.state = 'shoo'; b.t1 = t; } }); api.caption(score > 3 ? L.done : L.none); api.finish({ coins: Math.min(api.game.pay, score) }); }
        }
        birds.forEach(b => {
          const [sx, sy] = spots[b.spot];
          if (b.state === 'up') { const age = t - b.t0, rise = ease(clamp(age / 250, 0, 1)); if (age > b.life) { b.state = 'gone'; lost++; } crow(ctx, sx, sy - rise * 14 + Math.abs(Math.sin(age / 120)) * (age > b.life - 400 ? 3 : 0), t, false); if (age > b.life - 500) { ctx.fillStyle = '#E2B93B'; circ(ctx, sx + 18, sy - 8 - (age % 200) / 40, 2); } }
          else if (b.state === 'shoo') { const p = clamp((t - b.t1) / 500, 0, 1); if (p >= 1) b.state = 'gone'; crow(ctx, sx + p * 60, sy - 14 - p * 120, t, true); }
        });
        if (phase === 'play') { const [cx, cy] = spots[cursor]; ctx.strokeStyle = 'rgba(246,181,68,.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -t / 40; ctx.beginPath(); ctx.ellipse(cx, cy, 30, 16, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        // time bar and score
        const left = clamp(1 - t / DUR, 0, 1); ctx.fillStyle = 'rgba(20,38,43,.55)'; rr(ctx, 60, 14, 240, 12, 6); ctx.fill(); ctx.fillStyle = left > 0.25 ? '#63C48F' : '#E4574F'; rr(ctx, 60, 14, Math.max(12, 240 * left), 12, 6); ctx.fill();
        ctx.fillStyle = '#FFF'; rr(ctx, 8, 8, 46, 24, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 13px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('🪙 ' + Math.min(api.game.pay, score), 31, 25);
      },
      pointer(x, y) { if (phase !== 'play') return; let best = -1, bd = 40; birds.forEach(b => { if (b.state !== 'up') return; const [sx, sy] = spots[b.spot], d = Math.hypot(x - sx, y - sy + 8); if (d < bd) { bd = d; best = b.spot; } }); if (best >= 0) { cursor = best; shoo(best); } },
      key(k) { if (phase !== 'play') return; if (k === 'ArrowLeft' || k === 'a') cursor = cursor % 3 === 0 ? cursor : cursor - 1; if (k === 'ArrowRight' || k === 'd') cursor = cursor % 3 === 2 ? cursor : cursor + 1; if (k === 'ArrowUp' || k === 'w') cursor = cursor >= 3 ? cursor - 3 : cursor; if (k === 'ArrowDown' || k === 's') cursor = cursor < 3 ? cursor + 3 : cursor; if (k === 'Enter' || k === ' ') shoo(cursor); }
    };
  };

  /* Fishing off the pier: wait for the dip, then press. Three casts. A red herring pays nothing. */
  G.fish = api => {
    const L = api.lines, A = api.A;
    let cast = 0, total = 0, phase = 'wait', p0 = 0, biteAt = 1500 + Math.random() * 2500, catchInfo = null;
    api.caption(L.intro);
    const FX = 240, FY = 150;
    function act(t) {
      if (phase === 'wait') { phase = 'miss'; p0 = t; A.play('splash'); return; }
      if (phase === 'bite') { const red = Math.random() < 0.25, size = 1 + Math.floor(Math.random() * 5); catchInfo = { red, size }; phase = 'hook'; p0 = t; A.play(red ? 'bad' : 'coins'); if (red) api.caption(L.herring); else total += size; }
    }
    function nextCast(t) { cast++; if (cast >= 3) { phase = 'end'; api.caption(total > 0 ? L.done : L.none); api.finish({ coins: Math.min(api.game.pay, total) }); return; } phase = 'wait'; p0 = t; biteAt = t + 1500 + Math.random() * 2500; catchInfo = null; }
    return {
      draw(ctx, t) {
        water(ctx, t, 96);
        // the pier
        ctx.fillStyle = '#B08A5A'; ctx.fillRect(0, 150, 130, 70); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 5; i++) ctx.fillRect(0, 156 + i * 12, 130, 2); ctx.fillRect(126, 150, 6, 70); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(116, 120, 10, 34);
        if (phase === 'wait' && t > biteAt) { phase = 'bite'; p0 = t; }
        if (phase === 'bite' && t > p0 + 750) { phase = 'miss'; p0 = t; }
        if (phase === 'miss' && t > p0 + 900) nextCast(t);
        if (phase === 'hook' && t > p0 + 1400) nextCast(t);
        const dip = phase === 'bite' ? 7 + Math.sin(t / 60) * 2 : Math.sin(t / 500) * 2;
        person(ctx, api, 70, 150, 'right', 2.4);
        ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(84, 118); ctx.lineTo(150, 60); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(150, 60);
        if (phase === 'hook') { const p = ease(clamp((t - p0) / 700, 0, 1)); const fx = lerp(FX, 110, p), fy = lerp(FY, 90, p) - Math.sin(p * Math.PI) * 60; ctx.lineTo(fx, fy - 8); ctx.stroke(); fish(ctx, fx, fy, catchInfo.size, catchInfo.red, -0.6 + p * 0.6); if (p > 0.9) { ctx.fillStyle = '#FFF'; rr(ctx, 130, 30, 70, 26, 8); ctx.fill(); ctx.fillStyle = catchInfo.red ? '#E4574F' : '#2A2420'; ctx.font = 'bold 14px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText(catchInfo.red ? '0' : '+' + catchInfo.size, 165, 48); } }
        else { ctx.quadraticCurveTo(200, 100, FX, FY + dip - 6); ctx.stroke(); }
        if (phase === 'miss') { const p = clamp((t - p0) / 900, 0, 1); ripple(ctx, FX, FY, p, 24); ctx.fillStyle = 'rgba(255,255,255,' + (1 - p) + ')'; for (let i = 0; i < 6; i++) circ(ctx, FX + (jit(i, 23) - 0.5) * 40, FY - p * 30 + p * p * 40 - jit(i, 24) * 20, 2); if (p < 0.5) fish(ctx, FX + 30 + p * 80, FY + 20, 2, false, 0.3); }
        else if (phase !== 'hook') { ctx.fillStyle = '#E4574F'; ell(ctx, FX, FY + dip, 6, 8); ctx.fillStyle = '#FFF'; ell(ctx, FX, FY + dip + 3, 6, 4); ctx.fillStyle = '#2A2420'; ctx.fillRect(FX - 1, FY + dip - 16, 2, 8); ripple(ctx, FX, FY + 6, (t / 1600) % 1, 16); }
        if (phase === 'bite') { ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(FX, FY - 30); ctx.lineTo(FX - 9, FY - 46); ctx.lineTo(FX + 9, FY - 46); ctx.fill(); }
        // a shadow of a fish sniffing around the float before the bite
        if (phase === 'wait') { const f = ((t / 1800) % 1); ctx.fillStyle = 'rgba(30,80,110,.35)'; ell(ctx, FX - 40 + f * 80, FY + 26 + Math.sin(f * 7) * 4, 14, 5); }
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < 3 - cast ? '#E4574F' : 'rgba(255,255,255,.3)'; circ(ctx, 20 + i * 16, 22, 5); }
        ctx.fillStyle = '#FFF'; rr(ctx, 270, 8, 76, 24, 8); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 13px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText('🪙 ' + Math.min(api.game.pay, total), 308, 25);
      },
      pointer(x, y, t) { act(t); },
      key(k, t) { if (k === 'Enter' || k === ' ') act(t); }
    };
  };

  return { W, H, vignettes: V, games: G };
})();
