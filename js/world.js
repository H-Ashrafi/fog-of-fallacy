/* Fog of Fallacy - Maple Street world: tile map, structures, decorations,
   and the code-drawn people (so every character and portrait share one look). */

window.World = (function () {
  const TS = 32, W = 36, H = 28;
  const tiles = new Array(W * H).fill('G');
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'T' : tiles[y * W + x];
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };

  /* ---- ground ---- */
  rect(0, 0, W - 1, 0, 'T'); rect(0, H - 1, W - 1, H - 1, 'T'); rect(0, 0, 0, H - 1, 'T'); rect(W - 1, 0, W - 1, H - 1, 'T');
  rect(1, 9, 34, 10, 'P');            // main street
  rect(12, 9, 13, 26, 'P');           // west lane
  rect(24, 7, 25, 26, 'P');           // east lane
  rect(5, 8, 6, 8, 'P');              // garden gate path
  rect(1, 7, 10, 7, 'F'); set(5, 7, 'G'); set(6, 7, 'G');   // garden fence with a gate
  [[7, 2], [8, 2], [9, 2], [1, 4], [1, 5], [9, 6], [2, 6]].forEach(([x, y]) => set(x, y, 'L'));
  rect(14, 5, 18, 5, 'P'); rect(14, 3, 14, 5, 'P'); rect(18, 3, 18, 5, 'P'); rect(14, 3, 18, 3, 'P'); // bike loop
  rect(15, 7, 33, 7, 'F'); set(24, 7, 'P'); set(25, 7, 'P');  // playground fence with a gate
  rect(21, 2, 29, 6, 'S');            // playground sand
  rect(30, 3, 33, 6, 'I');            // frozen pond
  rect(10, 12, 10, 21, 'W');          // stream
  rect(8, 16, 9, 16, 'P'); set(10, 16, 'B'); set(11, 16, 'P');  // bridge to school
  rect(8, 19, 9, 19, 'M'); set(11, 19, 'M'); set(9, 20, 'M'); set(8, 20, 'M');  // muddy stream path
  rect(20, 21, 33, 26, 'S');          // sports field
  rect(22, 23, 31, 24, 'G');          // infield
  [[2, 21], [3, 25], [7, 21], [8, 25], [16, 20], [16, 24], [19, 12], [22, 18], [33, 17], [15, 1], [33, 1], [17, 8], [2, 12], [2, 18], [6, 19]].forEach(([x, y]) => set(x, y, 'T'));
  [[3, 21], [5, 25], [7, 23], [17, 22], [20, 17], [31, 17], [14, 1], [16, 1], [34, 12], [4, 12], [8, 12]].forEach(([x, y]) => set(x, y, 'L'));

  /* ---- structures (blocking rectangles drawn as buildings) ---- */
  const structures = [
    { x: 2, y: 1, w: 4, h: 3, kind: 'house', roof: '#D95A4B', label: 'Home' },
    { x: 2, y: 13, w: 6, h: 3, kind: 'school', roof: '#2F6E7E', label: 'School' },
    { x: 15, y: 13, w: 5, h: 3, kind: 'shop', roof: '#E4574F', label: 'Toy Shop' },
    { x: 27, y: 13, w: 4, h: 3, kind: 'house', roof: '#6B5BB3', label: "Priya's" }
  ];

  /* ---- decorations (blocking, drawn on top of ground) ---- */
  const decor = [
    { x: 23, y: 3, kind: 'swing' }, { x: 27, y: 3, kind: 'slide' },
    { x: 17, y: 4, kind: 'bike' },
    { x: 21, y: 16, kind: 'icecream' },
    { x: 26, y: 15, kind: 'balloons' }, { x: 31, y: 15, kind: 'balloons' },
    { x: 32, y: 22, kind: 'flag' }, { x: 32, y: 25, kind: 'flag' },
    { x: 4, y: 22, kind: 'bench' }, { x: 6, y: 24, kind: 'pot' }, { x: 8, y: 22, kind: 'pot2' },
    { x: 9, y: 4, kind: 'sign' }
  ];

  const blocked = new Set();
  structures.forEach(s => { for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) blocked.add(x + ',' + y); });
  decor.forEach(d => blocked.add(d.x + ',' + d.y));

  function walkable(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (blocked.has(x + ',' + y)) return false;
    return 'GPSLB'.includes(at(x, y));
  }

  /* ---- drawing helpers ---- */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

  function drawTile(ctx, c, x, y, px, py, t) {
    const h = hash(x, y);
    switch (c) {
      case 'G': case 'T': case 'F': case 'L':
        ctx.fillStyle = (h % 7 === 0) ? '#78BD69' : '#82C773'; ctx.fillRect(px, py, TS, TS);
        if (h % 5 === 0) { ctx.fillStyle = '#6FB562'; ctx.fillRect(px + (h % 20), py + ((h >> 3) % 20), 4, 3); }
        break;
      case 'P':
        ctx.fillStyle = '#DCC79A'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = '#CDB786'; ctx.fillRect(px + (h % 18), py + ((h >> 4) % 22), 5, 3);
        break;
      case 'S':
        ctx.fillStyle = '#EBD9A8'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = '#E2CD95'; ctx.fillRect(px + (h % 22), py + ((h >> 5) % 24), 3, 3);
        break;
      case 'W': case 'B':
        ctx.fillStyle = '#5FB3D9'; ctx.fillRect(px, py, TS, TS);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); const o = (t / 600 + h % 7) % 1; ctx.moveTo(px + 4, py + 8 + o * 16); ctx.quadraticCurveTo(px + 12, py + 4 + o * 16, px + 20, py + 8 + o * 16); ctx.stroke();
        break;
      case 'I':
        ctx.fillStyle = '#D6F1F8'; ctx.fillRect(px, py, TS, TS);
        ctx.strokeStyle = 'rgba(120,170,190,.55)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + (h % 10), py + 6); ctx.lineTo(px + 14 + (h % 8), py + 18); ctx.lineTo(px + 10, py + 30); ctx.stroke();
        break;
      case 'M':
        ctx.fillStyle = '#8B6A3E'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = '#6F5230'; circ(ctx, px + 10 + (h % 8), py + 12 + ((h >> 2) % 8), 5); circ(ctx, px + 22, py + 22, 4);
        break;
    }
    if (c === 'B') { ctx.fillStyle = '#B08A5A'; ctx.fillRect(px, py + 4, TS, TS - 8); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 4; i++) ctx.fillRect(px + i * 8 + 2, py + 4, 1.5, TS - 8); ctx.fillRect(px, py + 2, TS, 3); ctx.fillRect(px, py + TS - 5, TS, 3); }
    if (c === 'T') {
      ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 13, py + 18, 6, 12);
      ctx.fillStyle = '#2F7A44'; circ(ctx, px + 16, py + 13, 12);
      ctx.fillStyle = '#3F9A56'; circ(ctx, px + 12, py + 11, 8);
    }
    if (c === 'F') {
      ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 4, py + 10, 4, 16); ctx.fillRect(px + 24, py + 10, 4, 16);
      ctx.fillRect(px, py + 13, TS, 3); ctx.fillRect(px, py + 21, TS, 3);
    }
    if (c === 'L') {
      const cols = ['#FF7B6B', '#F6B544', '#F0F0F0', '#C58BF2'];
      for (let i = 0; i < 3; i++) { ctx.fillStyle = cols[(h + i) % 4]; circ(ctx, px + 7 + i * 9, py + 12 + ((h >> i) % 12), 3); ctx.fillStyle = '#FFE8A3'; circ(ctx, px + 7 + i * 9, py + 12 + ((h >> i) % 12), 1.2); }
    }
  }

  function drawStructure(ctx, s, ox, oy) {
    const px = s.x * TS - ox, py = s.y * TS - oy, w = s.w * TS, h = s.h * TS;
    ctx.fillStyle = s.kind === 'school' ? '#F3E3C3' : s.kind === 'shop' ? '#FBF1DC' : '#F6E6CF';
    ctx.fillRect(px + 2, py + 14, w - 4, h - 14);
    ctx.fillStyle = s.roof; rr(ctx, px, py, w, 22, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(px + 2, py + 20, w - 4, 4);
    // windows
    ctx.fillStyle = '#BFEBD6';
    for (let i = 0; i < s.w; i++) { if (i === Math.floor(s.w / 2)) continue; ctx.fillRect(px + i * TS + 9, py + 30, 14, 12); ctx.strokeStyle = '#8FB3B0'; ctx.lineWidth = 1; ctx.strokeRect(px + i * TS + 9, py + 30, 14, 12); }
    // door
    const dx = px + Math.floor(s.w / 2) * TS + 8;
    ctx.fillStyle = '#8B5A2B'; rr(ctx, dx, py + h - 20, 16, 20, 3); ctx.fill();
    ctx.fillStyle = '#F6B544'; circ(ctx, dx + 12, py + h - 10, 1.5);
    if (s.kind === 'shop') { ctx.fillStyle = '#E4574F'; for (let i = 0; i < s.w * 2; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : '#E4574F'; ctx.fillRect(px + i * 16, py + 22, 16, 8); } }
    if (s.kind === 'school') { ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w - 10, py - 18, 2, 32); ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(px + w - 8, py - 18); ctx.lineTo(px + w + 6, py - 13); ctx.lineTo(px + w - 8, py - 8); ctx.fill(); }
    ctx.fillStyle = '#2A2420'; ctx.font = 'bold 11px "Baloo 2", system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(ctx, px + w / 2 - 28, py + 4, 56, 14, 7); ctx.fill();
    ctx.fillStyle = '#2A2420'; ctx.fillText(s.label, px + w / 2, py + 15);
  }

  function drawDecor(ctx, d, ox, oy, state) {
    const px = d.x * TS - ox, py = d.y * TS - oy;
    switch (d.kind) {
      case 'swing':
        ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 4, py + 30); ctx.lineTo(px + 10, py + 4); ctx.lineTo(px + 22, py + 4); ctx.lineTo(px + 28, py + 30); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 13, py + 4); ctx.lineTo(px + 13, py + 22); ctx.moveTo(px + 19, py + 4); ctx.lineTo(px + 19, py + 22); ctx.stroke();
        ctx.fillStyle = '#E4574F'; ctx.fillRect(px + 10, py + 22, 12, 3); break;
      case 'slide':
        ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(px + 4, py + 6); ctx.lineTo(px + 14, py + 6); ctx.lineTo(px + 30, py + 28); ctx.lineTo(px + 20, py + 28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 4, py + 6, 3, 24); ctx.fillRect(px + 11, py + 6, 3, 24); break;
      case 'bike':
        ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 9, py + 22, 6, 0, Math.PI * 2); ctx.moveTo(px + 29, py + 22); ctx.arc(px + 23, py + 22, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#E4574F'; ctx.beginPath(); ctx.moveTo(px + 9, py + 22); ctx.lineTo(px + 15, py + 12); ctx.lineTo(px + 23, py + 22); ctx.moveTo(px + 15, py + 12); ctx.lineTo(px + 22, py + 12); ctx.stroke(); break;
      case 'icecream':
        ctx.fillStyle = '#F4E8CC'; ctx.fillRect(px + 4, py + 14, 24, 16);
        ctx.fillStyle = '#E4574F'; for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : '#E4574F'; ctx.fillRect(px + 2 + i * 7, py + 6, 7, 8); }
        ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(px + 12, py + 28); ctx.lineTo(px + 16, py + 18); ctx.lineTo(px + 20, py + 28); ctx.fill(); ctx.fillStyle = '#FFB3A8'; circ(ctx, px + 16, py + 18, 4); break;
      case 'balloons':
        ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + 16, py + 30); ctx.lineTo(px + 10, py + 12); ctx.moveTo(px + 16, py + 30); ctx.lineTo(px + 22, py + 10); ctx.moveTo(px + 16, py + 30); ctx.lineTo(px + 16, py + 6); ctx.stroke();
        ctx.fillStyle = '#E4574F'; circ(ctx, px + 10, py + 10, 6); ctx.fillStyle = '#F6B544'; circ(ctx, px + 22, py + 8, 6); ctx.fillStyle = '#63C48F'; circ(ctx, px + 16, py + 4, 6); break;
      case 'flag':
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 14, py + 4, 3, 26);
        ctx.fillStyle = '#2A2420'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#F4E8CC' : '#2A2420'; ctx.fillRect(px + 17 + i * 4, py + 4 + j * 5, 4, 5); } break;
      case 'bench':
        ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 2, py + 14, 28, 6); ctx.fillRect(px + 2, py + 6, 28, 5); ctx.fillRect(px + 4, py + 20, 3, 8); ctx.fillRect(px + 25, py + 20, 3, 8); break;
      case 'pot':
        if (state && state.potFixed) { ctx.fillStyle = '#C0623F'; ctx.fillRect(px + 8, py + 14, 16, 14); ctx.fillStyle = '#63C48F'; circ(ctx, px + 16, py + 10, 7); ctx.fillStyle = '#FF7B6B'; circ(ctx, px + 16, py + 8, 3); }
        else { ctx.fillStyle = '#C0623F'; ctx.beginPath(); ctx.moveTo(px + 6, py + 28); ctx.lineTo(px + 10, py + 16); ctx.lineTo(px + 16, py + 22); ctx.lineTo(px + 14, py + 28); ctx.fill(); ctx.beginPath(); ctx.moveTo(px + 18, py + 28); ctx.lineTo(px + 22, py + 14); ctx.lineTo(px + 28, py + 28); ctx.fill(); ctx.fillStyle = '#5B4F47'; circ(ctx, px + 17, py + 26, 5); ctx.fillStyle = '#63C48F'; ctx.fillRect(px + 12, py + 8, 3, 10); }
        break;
      case 'pot2':
        ctx.fillStyle = '#C0623F'; ctx.fillRect(px + 8, py + 14, 16, 14); ctx.fillStyle = '#63C48F'; circ(ctx, px + 16, py + 10, 7); ctx.fillStyle = '#F6B544'; circ(ctx, px + 16, py + 8, 3); break;
      case 'sign':
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 14, py + 12, 4, 18); ctx.fillStyle = '#F4E8CC'; rr(ctx, px + 4, py + 4, 24, 12, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('MAPLE ST', px + 16, py + 13); break;
    }
  }

  /* ---- people ---- */
  const SIZES = { s: 0.72, m: 0.86, l: 1.0, xl: 1.14 };
  function drawPerson(ctx, cx, feetY, spec, dir, walk, scale) {
    const S = SIZES[spec.size || 'm'] * (scale || 1);
    const hw = 7 * S, bodyH = 12 * S, headR = 7.5 * S, legH = 6 * S;
    const swing = walk ? Math.sin(walk * Math.PI * 2) * 2.5 * S : 0;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(cx, feetY + 1, 9 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = spec.pants || '#3E5C8A';
    ctx.fillRect(cx - 5.5 * S, feetY - legH + swing, 4.5 * S, legH); ctx.fillRect(cx + 1 * S, feetY - legH - swing, 4.5 * S, legH);
    ctx.fillStyle = spec.shirt; rr(ctx, cx - hw, feetY - legH - bodyH, hw * 2, bodyH + 1, 3 * S); ctx.fill();
    if (spec.apron) { ctx.fillStyle = '#F4E8CC'; ctx.fillRect(cx - hw + 2 * S, feetY - legH - bodyH + 3 * S, hw * 2 - 4 * S, bodyH - 3 * S); }
    ctx.fillStyle = spec.skin;
    ctx.fillRect(cx - hw - 3 * S, feetY - legH - bodyH + 2 * S - swing * 0.6, 3 * S, 8 * S);
    ctx.fillRect(cx + hw, feetY - legH - bodyH + 2 * S + swing * 0.6, 3 * S, 8 * S);
    const hy = feetY - legH - bodyH - headR + 2 * S;
    circ(ctx, cx, hy, headR);
    // hair
    ctx.fillStyle = spec.hair;
    const st = spec.hairStyle || 'short';
    if (dir === 'up') { circ(ctx, cx, hy, headR); }
    else { ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR, Math.PI, 0); ctx.fill(); }
    if (st === 'long') { ctx.fillRect(cx - headR, hy - 1 * S, 3 * S, headR + 6 * S); ctx.fillRect(cx + headR - 3 * S, hy - 1 * S, 3 * S, headR + 6 * S); }
    if (st === 'bun') { circ(ctx, cx, hy - headR - 1 * S, 3.5 * S); }
    if (st === 'curly') { circ(ctx, cx - headR + 1 * S, hy - 2 * S, 3.5 * S); circ(ctx, cx + headR - 1 * S, hy - 2 * S, 3.5 * S); circ(ctx, cx, hy - headR, 4 * S); }
    if (spec.cap) { ctx.fillStyle = spec.cap; ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR + 0.5 * S, Math.PI, 0); ctx.fill(); if (dir !== 'up') ctx.fillRect(cx - headR - 2 * S * (dir === 'left' ? 1 : 0), hy - 1.5 * S, headR + 4 * S, 2.5 * S); }
    if (spec.partyhat) { ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(cx - 5 * S, hy - headR + 2 * S); ctx.lineTo(cx, hy - headR - 9 * S); ctx.lineTo(cx + 5 * S, hy - headR + 2 * S); ctx.fill(); ctx.fillStyle = '#E4574F'; circ(ctx, cx, hy - headR - 9 * S, 2 * S); }
    // face
    if (dir !== 'up') {
      ctx.fillStyle = '#2A2420';
      const ey = hy + 1.5 * S;
      if (dir === 'down') { circ(ctx, cx - 2.8 * S, ey, 1.2 * S); circ(ctx, cx + 2.8 * S, ey, 1.2 * S); }
      else if (dir === 'left') { circ(ctx, cx - 3.5 * S, ey, 1.2 * S); }
      else { circ(ctx, cx + 3.5 * S, ey, 1.2 * S); }
      ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 1 * S; ctx.beginPath();
      const mx = dir === 'left' ? cx - 2 * S : dir === 'right' ? cx + 2 * S : cx;
      ctx.arc(mx, hy + 3.5 * S, 2 * S, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      if (spec.glasses) { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx - 2.8 * S, ey, 2.4 * S, 0, Math.PI * 2); ctx.moveTo(cx + 5.2 * S, ey); ctx.arc(cx + 2.8 * S, ey, 2.4 * S, 0, Math.PI * 2); ctx.stroke(); }
      if (spec.beard) { ctx.fillStyle = spec.hair; ctx.beginPath(); ctx.arc(cx, hy + 3 * S, headR - 1 * S, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,150,140,.45)'; circ(ctx, cx - 4.5 * S, hy + 3 * S, 1.5 * S); circ(ctx, cx + 4.5 * S, hy + 3 * S, 1.5 * S);
    }
  }

  return { TS, W, H, at, walkable, structures, decor, drawTile, drawStructure, drawDecor, drawPerson, rr };
})();
