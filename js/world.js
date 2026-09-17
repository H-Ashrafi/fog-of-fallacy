/* Fog of Fallacy - the Valley: one big tile map split into five regions (levels).
   Regions start hidden under fog and open as missions are built. Also holds the
   code-drawn buildings, decorations and people so every sprite shares one look. */

window.World = (function () {
  const TS = 32, W = 64, H = 84;
  const tiles = new Array(W * H).fill('G');
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'T' : tiles[y * W + x];
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const scatter = (list, c) => list.forEach(([x, y]) => set(x, y, c));

  /* Regions (levels). Order matters: region i unlocks after mission i-1 is built. */
  const regions = [
    { id: 'village', name: 'Riverside Village', x0: 1, y0: 1, x1: 26, y1: 27 },
    { id: 'farms', name: 'River Farms', x0: 1, y0: 30, x1: 26, y1: 55 },
    { id: 'market', name: 'Market Town', x0: 31, y0: 30, x1: 62, y1: 55 },
    { id: 'mine', name: 'Hill Mine', x0: 31, y0: 1, x1: 62, y1: 27 },
    { id: 'harbour', name: 'Harbour', x0: 1, y0: 58, x1: 62, y1: 82 }
  ];
  /* Tiles that change when a region opens (gates, passes, bridges). */
  const gates = {
    farms: [[12, 28, 'P'], [13, 28, 'P'], [12, 29, 'P'], [13, 29, 'P']],
    market: [[27, 42, 'B'], [28, 42, 'B'], [29, 42, 'B'], [30, 42, 'B'], [27, 43, 'B'], [28, 43, 'B'], [29, 43, 'B'], [30, 43, 'B']],
    mine: [[46, 28, 'P'], [47, 28, 'P'], [46, 29, 'P'], [47, 29, 'P']],
    harbour: [[44, 56, 'P'], [45, 56, 'P'], [44, 57, 'P'], [45, 57, 'P']]
  };

  /* ================= ground ================= */
  rect(0, 0, W - 1, 0, 'T'); rect(0, H - 1, W - 1, H - 1, 'T'); rect(0, 0, 0, H - 1, 'T'); rect(W - 1, 0, W - 1, H - 1, 'T');
  rect(27, 1, 30, 57, 'W');                     // the river
  rect(26, 1, 26, 55, 'S'); rect(31, 1, 31, 55, 'S');   // banks
  rect(1, 28, 26, 29, 'F'); rect(31, 28, 62, 29, 'R');   // hedge (village|farms) and rockfall (market|mine)
  rect(1, 56, 26, 57, 'F'); rect(31, 56, 62, 57, 'F');   // harbour wall

  /* ---- Riverside Village ---- */
  rect(1, 14, 25, 15, 'P'); rect(12, 2, 13, 27, 'P');
  rect(9, 11, 16, 18, 'K');
  rect(12, 11, 13, 18, 'K'); rect(9, 14, 16, 15, 'K');
  rect(18, 17, 25, 19, 'C'); rect(17, 17, 17, 19, 'F'); rect(18, 16, 25, 16, 'F'); set(17, 18, 'G');
  scatter([[2, 6], [7, 2], [8, 6], [16, 2], [24, 2], [25, 6], [3, 17], [7, 24], [9, 26], [20, 26], [22, 25], [24, 25], [25, 24], [2, 26], [17, 8], [22, 10], [3, 12]], 'T');
  scatter([[6, 5], [10, 3], [15, 8], [19, 12], [5, 16], [8, 21], [15, 21], [21, 13], [3, 20]], 'L');
  rect(20, 24, 24, 27, 'G'); set(23, 26, 'G');
  rect(22, 12, 25, 13, 'S');                     // river beach where Wren camps

  /* ---- River Farms ---- */
  rect(12, 30, 13, 55, 'P'); rect(12, 42, 26, 43, 'P'); rect(1, 48, 12, 49, 'P');
  rect(3, 33, 8, 36, 'T'); set(5, 37, 'G');      // orchard
  rect(15, 36, 24, 39, 'C'); set(19, 40, 'G');
  rect(14, 35, 14, 40, 'F'); rect(25, 35, 25, 40, 'F'); rect(14, 40, 25, 40, 'F'); set(19, 40, 'G'); set(20, 40, 'P');
  scatter([[2, 40], [4, 43], [9, 39], [2, 53], [5, 54], [22, 53], [24, 50], [17, 45], [20, 47], [9, 31], [17, 31], [23, 31], [3, 52]], 'T');
  scatter([[7, 40], [10, 45], [16, 50], [22, 48], [5, 45], [8, 31]], 'L');
  rect(21, 42, 26, 43, 'S');                     // muddy landing by the ferry
  rect(4, 50, 10, 53, 'S');                      // goat pen dirt
  rect(3, 50, 3, 53, 'F'); rect(11, 50, 11, 53, 'F'); rect(3, 53, 11, 53, 'F'); rect(4, 50, 10, 50, 'F'); set(4, 50, 'S'); set(3, 50, 'F');
  set(7, 50, 'S');

  /* ---- Market Town ---- */
  rect(31, 42, 62, 43, 'P'); rect(46, 30, 47, 55, 'P');
  rect(38, 38, 54, 47, 'K');
  scatter([[33, 32], [36, 31], [62 - 1, 31], [58, 36], [34, 45], [33, 54], [39, 54], [60, 54], [55, 54], [37, 36]], 'T');
  scatter([[36, 40], [56, 46], [40, 52], [52, 52], [58, 32], [33, 40]], 'L');
  rect(32, 32, 34, 33, 'L');

  /* ---- Hill Mine ---- */
  rect(46, 2, 47, 27, 'P'); rect(31, 14, 62, 15, 'P'); rect(34, 18, 45, 19, 'P');
  scatter([[33, 3], [34, 4], [38, 2], [39, 3], [50, 2], [51, 3], [59, 3], [60, 4], [61, 5], [61, 12], [60, 20], [61, 21], [55, 25], [56, 26], [33, 25], [34, 26], [42, 5], [43, 5], [52, 20], [53, 21], [61, 26], [36, 22]], 'R');
  scatter([[36, 5], [58, 8], [40, 10], [52, 12], [58, 22], [40, 26], [50, 26]], 'T');
  rect(48, 4, 58, 11, 'S'); rect(35, 17, 43, 21, 'S');
  rect(31, 16, 34, 22, 'S');                     // mill bank

  /* ---- Harbour ---- */
  rect(44, 58, 45, 69, 'P'); rect(31, 68, 62, 69, 'Q'); rect(1, 68, 26, 69, 'S');
  rect(1, 70, 62, 82, 'W'); rect(27, 58, 30, 69, 'W');
  rect(26, 64, 31, 65, 'B');                     // old footbridge inside the harbour
  rect(44, 70, 45, 76, 'D');                     // the pier
  rect(1, 58, 26, 67, 'S'); rect(1, 58, 26, 60, 'G');
  scatter([[3, 59], [8, 59], [20, 59], [24, 60], [33, 59], [62 - 1, 59], [60, 66], [47, 61], [50, 59]], 'T');
  scatter([[6, 62], [16, 61], [48, 66], [35, 66]], 'L');

  /* ================= structures (blocking, drawn as buildings) ================= */
  const structures = [
    // village
    { x: 2, y: 2, w: 4, h: 3, kind: 'house', roof: '#D95A4B', label: 'Home', region: 0 },
    { x: 18, y: 3, w: 5, h: 3, kind: 'shop', roof: '#E4574F', label: 'Bakery', region: 0 },
    { x: 3, y: 8, w: 5, h: 3, kind: 'house', roof: '#6B5BB3', label: "Elder's", region: 0 },
    { x: 19, y: 20, w: 6, h: 3, kind: 'barn', roof: '#A2703F', label: 'Barn', region: 0 },
    { x: 3, y: 21, w: 4, h: 2, kind: 'house', roof: '#2F6E7E', label: "Sal's", region: 0 },
    // farms
    { x: 16, y: 32, w: 5, h: 3, kind: 'house', roof: '#D98F1F', label: 'Farm', region: 1 },
    { x: 3, y: 46, w: 4, h: 2, kind: 'house', roof: '#63C48F', label: 'Twins', region: 1 },
    { x: 22, y: 45, w: 4, h: 3, kind: 'shop', roof: '#2F80ED', label: 'Ferry', region: 1 },
    // market
    { x: 40, y: 31, w: 6, h: 4, kind: 'hall', roof: '#6B5BB3', label: 'Town Hall', region: 2 },
    { x: 56, y: 40, w: 5, h: 3, kind: 'house', roof: '#D95A4B', label: 'Inn', region: 2 },
    { x: 33, y: 48, w: 4, h: 3, kind: 'shop', roof: '#E4574F', label: 'Shop', region: 2 },
    { x: 56, y: 49, w: 5, h: 3, kind: 'hall', roof: '#2F6E7E', label: 'Library', region: 2 },
    // mine
    { x: 54, y: 6, w: 5, h: 3, kind: 'mine', roof: '#5B4F47', label: 'Mine', region: 3 },
    { x: 34, y: 8, w: 4, h: 3, kind: 'barn', roof: '#8B5A2B', label: 'Camp', region: 3 },
    { x: 38, y: 22, w: 4, h: 3, kind: 'shop', roof: '#D98F1F', label: 'Shares', region: 3 },
    // harbour
    { x: 33, y: 60, w: 5, h: 3, kind: 'hall', roof: '#2F80ED', label: 'Harbour Office', region: 4 },
    { x: 52, y: 60, w: 7, h: 3, kind: 'barn', roof: '#5B4F47', label: 'Warehouse', region: 4 },
    { x: 38, y: 64, w: 5, h: 3, kind: 'shop', roof: '#D95A4B', label: 'Tavern', region: 4 },
    // the Grey Order's lodges: preachers walk out of the door tile below each one
    { x: 14, y: 22, w: 3, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 0, door: [15, 24] },
    { x: 22, y: 32, w: 4, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 1, door: [24, 34] },
    { x: 33, y: 36, w: 3, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 2, door: [34, 38] },
    { x: 58, y: 24, w: 3, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 3, door: [59, 26] },
    { x: 10, y: 61, w: 4, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 4, door: [12, 63] }
  ];

  /* ================= decorations (blocking). id lets tasks/jobs point at them. ================= */
  const decor = [
    // village
    { x: 9, y: 4, kind: 'sign', text: 'VILLAGE' }, { x: 6, y: 12, kind: 'bench' }, { x: 11, y: 13, kind: 'lamp' }, { x: 15, y: 16, kind: 'lamp' },
    { x: 23, y: 26, kind: 'goat', id: 'goat', hideWhen: 'task:goat' }, { x: 17, y: 18, kind: 'brokenfence', id: 'brokenfence', fixWhen: 'task:fence' },
    { x: 25, y: 15, kind: 'bucket', id: 'bucket' }, { x: 10, y: 12, kind: 'pot2' }, { x: 21, y: 7, kind: 'crate' },
    // farms
    { x: 5, y: 37, kind: 'apples', id: 'apples', hideWhen: 'task:apples' }, { x: 19, y: 40, kind: 'scarecrow', id: 'scarecrow', fixWhen: 'task:scarecrow' },
    { x: 7, y: 51, kind: 'goat', id: 'milk' }, { x: 8, y: 52, kind: 'goat' }, { x: 21, y: 52, kind: 'logs' }, { x: 23, y: 41, kind: 'tripod' }, { x: 25, y: 43, kind: 'boat' },
    { x: 14, y: 34, kind: 'crate' }, { x: 15, y: 50, kind: 'sign', text: 'LOTTO' }, { x: 26, y: 41, kind: 'tollbox', mission: 'bridge', showWhen: 'built:bridge' },
    // market
    { x: 40, y: 40, kind: 'stall', color: '#E4574F' }, { x: 43, y: 40, kind: 'stall', color: '#2F80ED' }, { x: 40, y: 45, kind: 'stall', color: '#63C48F' }, { x: 43, y: 45, kind: 'stall', color: '#F6B544' },
    { x: 49, y: 44, kind: 'fountain' }, { x: 38, y: 47, kind: 'lamp', id: 'lamp', dark: true, fixWhen: 'task:lamp' }, { x: 53, y: 39, kind: 'lamp' },
    { x: 60, y: 32, kind: 'lostsign', id: 'lostsign', hideWhen: 'task:lostsign' }, { x: 50, y: 40, kind: 'broom', id: 'broom' }, { x: 35, y: 46, kind: 'crate' },
    // mine
    { x: 40, y: 20, kind: 'cards' }, { x: 50, y: 18, kind: 'cart', id: 'cart', fixWhen: 'task:cart' }, { x: 60, y: 4, kind: 'canary', id: 'canary', hideWhen: 'task:canary' },
    { x: 58, y: 16, kind: 'orepile', id: 'orepile' }, { x: 37, y: 12, kind: 'crate' }, { x: 53, y: 10, kind: 'lamp' }, { x: 44, y: 21, kind: 'logs' },
    // harbour
    { x: 35, y: 72, kind: 'boat' }, { x: 55, y: 71, kind: 'boat' }, { x: 12, y: 73, kind: 'boat' }, { x: 52, y: 69, kind: 'ropes', id: 'ropes' },
    { x: 5, y: 66, kind: 'oar', id: 'oar', hideWhen: 'task:oar' }, { x: 60, y: 68, kind: 'crate' }, { x: 34, y: 69, kind: 'crate' }, { x: 42, y: 62, kind: 'lamp' }, { x: 47, y: 62, kind: 'lamp' },
    { x: 20, y: 63, kind: 'sign', text: 'BEACH' },
    // statue plinths, one per region (see FOG.STATUE.sites)
    { x: 10, y: 16, kind: 'plinth', statue: 0 }, { x: 16, y: 44, kind: 'plinth', statue: 1 }, { x: 49, y: 41, kind: 'plinth', statue: 2 }, { x: 44, y: 16, kind: 'plinth', statue: 3 }, { x: 40, y: 62, kind: 'plinth', statue: 4 }
  ];

  const blocked = new Set();
  structures.forEach(s => { for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) blocked.add(x + ',' + y); });
  const decorBlocked = d => !(d.hideWhen && state.flags[d.hideWhen]) && !(d.showWhen && !state.flags[d.showWhen]);
  let state = { flags: {}, unlocked: 1, built: {}, statues: {} };
  /* Text drawn on the canvas goes through the translation layer when one is loaded. */
  const tl = s => (window.I18N ? window.I18N.t(s) : s);
  const FONT = () => (window.I18N && window.I18N.canvasFont) || '"Baloo 2", system-ui, sans-serif';

  function regionAt(x, y) {
    for (let i = 0; i < regions.length; i++) { const r = regions[i]; if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return i; }
    return -1;  // borders, river, walls
  }
  function locked(x, y) { const r = regionAt(x, y); return r >= state.unlocked; }

  const WALK = 'GPSLBDKQ';
  function walkable(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (blocked.has(x + ',' + y)) return false;
    if (locked(x, y)) return false;
    if (decor.some(d => d.x === x && d.y === y && decorBlocked(d))) return false;
    if (siteAt(x, y)) return false;
    return WALK.includes(at(x, y));
  }

  /* Mission sites come from the story data so the two files agree. */
  function sites() { return (window.FOG && window.FOG.MISSIONS) || []; }
  function siteAt(x, y) {
    const m = sites().find(m => x >= m.site.x && x < m.site.x + m.site.w && y >= m.site.y && y < m.site.y + m.site.h);
    if (!m) return null;
    if (state.built[m.id] && m.walkWhenBuilt) return null;
    return m;
  }

  function setState(next) {
    state = next;
    regions.forEach((r, i) => { if (i > 0 && i < state.unlocked && gates[r.id]) gates[r.id].forEach(([x, y, c]) => set(x, y, c)); });
  }

  /* ================= drawing helpers ================= */
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
      case 'G': case 'T': case 'F': case 'L': case 'C':
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
      case 'K':
        ctx.fillStyle = '#C9BCA4'; ctx.fillRect(px, py, TS, TS);
        ctx.strokeStyle = 'rgba(90,70,50,.18)'; ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, 14, 14); ctx.strokeRect(px + 17, py + 1, 14, 14); ctx.strokeRect(px + 1, py + 17, 14, 14); ctx.strokeRect(px + 17, py + 17, 14, 14);
        break;
      case 'Q':
        ctx.fillStyle = '#A9A39A'; ctx.fillRect(px, py, TS, TS);
        ctx.strokeStyle = 'rgba(40,40,40,.2)'; ctx.lineWidth = 1; ctx.strokeRect(px + 1, py + 1, 30, 14); ctx.strokeRect(px + 1, py + 17, 30, 14);
        break;
      case 'W': case 'B':
        ctx.fillStyle = y >= 70 ? '#3F92BF' : '#5FB3D9'; ctx.fillRect(px, py, TS, TS);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); const o = (t / 600 + h % 7) % 1; ctx.moveTo(px + 4, py + 8 + o * 16); ctx.quadraticCurveTo(px + 12, py + 4 + o * 16, px + 20, py + 8 + o * 16); ctx.stroke();
        break;
      case 'R':
        ctx.fillStyle = '#8E8A80'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = '#6E6A62'; circ(ctx, px + 10 + (h % 8), py + 12 + ((h >> 2) % 8), 8); ctx.fillStyle = '#A5A197'; circ(ctx, px + 22, py + 22, 6);
        break;
      case 'D':
        ctx.fillStyle = '#3F92BF'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + 2, py, TS - 4, TS); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 4; i++) ctx.fillRect(px + 2, py + i * 8 + 3, TS - 4, 1.5);
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
    if (c === 'C') {
      ctx.fillStyle = '#B9932F'; for (let i = 0; i < 3; i++) { ctx.fillRect(px + 4 + i * 10, py + 6, 3, 22); ctx.fillStyle = '#E2B93B'; circ(ctx, px + 5.5 + i * 10, py + 6, 3); ctx.fillStyle = '#B9932F'; }
    }
  }

  function drawStructure(ctx, s, ox, oy) {
    const px = s.x * TS - ox, py = s.y * TS - oy, w = s.w * TS, h = s.h * TS;
    const wall = { school: '#F3E3C3', shop: '#FBF1DC', hall: '#EDE2D2', barn: '#C98B5B', mine: '#8E8A80', lodge: '#4A4744' }[s.kind] || '#F6E6CF';
    ctx.fillStyle = wall; ctx.fillRect(px + 2, py + 14, w - 4, h - 14);
    ctx.fillStyle = s.roof; rr(ctx, px, py, w, 22, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(px + 2, py + 20, w - 4, 4);
    if (s.kind === 'mine') { ctx.fillStyle = '#2A2420'; rr(ctx, px + w / 2 - 18, py + h - 30, 36, 30, 10); ctx.fill(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w / 2 - 20, py + h - 32, 40, 4); }
    else {
      ctx.fillStyle = s.kind === 'lodge' ? '#1C1A18' : '#BFEBD6';
      for (let i = 0; i < s.w; i++) { if (i === Math.floor(s.w / 2)) continue; ctx.fillRect(px + i * TS + 9, py + 30, 14, 12); ctx.strokeStyle = s.kind === 'lodge' ? '#6B6662' : '#8FB3B0'; ctx.lineWidth = 1; ctx.strokeRect(px + i * TS + 9, py + 30, 14, 12); }
      const dx = px + Math.floor(s.w / 2) * TS + 8;
      ctx.fillStyle = '#8B5A2B'; rr(ctx, dx, py + h - 20, 16, 20, 3); ctx.fill();
      ctx.fillStyle = '#F6B544'; circ(ctx, dx + 12, py + h - 10, 1.5);
    }
    if (s.kind === 'shop') { for (let i = 0; i < s.w * 2; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : s.roof; ctx.fillRect(px + i * 16, py + 22, 16, 8); } }
    if (s.kind === 'hall') { ctx.fillStyle = s.roof; ctx.fillRect(px + w / 2 - 2, py - 16, 3, 20); ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(px + w / 2 + 1, py - 16); ctx.lineTo(px + w / 2 + 14, py - 11); ctx.lineTo(px + w / 2 + 1, py - 6); ctx.fill(); }
    if (s.kind === 'lodge') {   // a grey banner on a pole, and a dark doorway
      ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + w / 2 - 1, py - 16, 2, 20); ctx.fillStyle = '#5B5652'; ctx.fillRect(px + w / 2 + 1, py - 16, 14, 9); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + w / 2 + 3, py - 13, 10, 3);
      ctx.fillStyle = '#1C1A18'; rr(ctx, px + Math.floor(s.w / 2) * TS + 8, py + h - 20, 16, 20, 3); ctx.fill();
    }
    const lbl = tl(s.label);
    ctx.font = 'bold 11px ' + FONT(); ctx.textAlign = 'center';
    const tw = Math.max(56, ctx.measureText(lbl).width + 14);
    ctx.fillStyle = s.kind === 'lodge' ? 'rgba(60,56,52,.9)' : 'rgba(255,255,255,.85)'; rr(ctx, px + w / 2 - tw / 2, py + 4, tw, 14, 7); ctx.fill();
    ctx.fillStyle = s.kind === 'lodge' ? '#F4E8CC' : '#2A2420'; ctx.fillText(lbl, px + w / 2, py + 15);
  }

  /* Built missions are drawn as their own landmark. Sites under construction show stakes and a progress bar. */
  function drawMission(ctx, m, ox, oy, ms, t) {
    const px = m.site.x * TS - ox, py = m.site.y * TS - oy, w = m.site.w * TS, h = m.site.h * TS;
    const st = ms && ms.status;
    if (st === 'built') {
      switch (m.kind) {
        case 'well':
          ctx.fillStyle = '#8E8A80'; circ(ctx, px + w / 2, py + h - 20, 22); ctx.fillStyle = '#5FB3D9'; circ(ctx, px + w / 2, py + h - 20, 14);
          ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w / 2 - 22, py + 10, 4, 30); ctx.fillRect(px + w / 2 + 18, py + 10, 4, 30);
          ctx.fillStyle = '#D95A4B'; ctx.beginPath(); ctx.moveTo(px + w / 2 - 28, py + 16); ctx.lineTo(px + w / 2, py); ctx.lineTo(px + w / 2 + 28, py + 16); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#2A2420'; ctx.fillRect(px + w / 2 - 1, py + 16, 2, 18); ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + w / 2 - 5, py + 30, 10, 8);
          break;
        case 'school':
          ctx.fillStyle = '#F3E3C3'; ctx.fillRect(px + 2, py + 20, w - 4, h - 20);
          ctx.fillStyle = '#2F6E7E'; rr(ctx, px, py + 4, w, 24, 6); ctx.fill();
          ctx.fillStyle = '#BFEBD6'; for (let i = 0; i < m.site.w; i++) { if (i === Math.floor(m.site.w / 2)) continue; ctx.fillRect(px + i * TS + 9, py + 40, 14, 14); ctx.fillRect(px + i * TS + 9, py + 70, 14, 14); }
          ctx.fillStyle = '#8B5A2B'; rr(ctx, px + w / 2 - 10, py + h - 26, 20, 26, 3); ctx.fill();
          ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w - 12, py - 20, 3, 36); ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(px + w - 9, py - 20); ctx.lineTo(px + w + 8, py - 14); ctx.lineTo(px + w - 9, py - 8); ctx.fill();
          ctx.fillStyle = '#2A2420'; circ(ctx, px + w / 2, py + 16, 8); ctx.fillStyle = '#F4E8CC'; circ(ctx, px + w / 2, py + 16, 6); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + w / 2 - 0.5, py + 11, 1, 5); ctx.fillRect(px + w / 2, py + 16, 4, 1);
          label(ctx, 'Engineering School', px + w / 2, py + h - 6);
          break;
        case 'mill':
          ctx.fillStyle = '#C98B5B'; ctx.fillRect(px + 14, py + 24, w - 16, h - 24);
          ctx.fillStyle = '#7A4F2A'; rr(ctx, px + 12, py + 8, w - 12, 22, 5); ctx.fill();
          const a = t / 900; ctx.save(); ctx.translate(px + 10, py + h - 30); ctx.rotate(a);
          ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
          for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * Math.PI / 4) * 26, Math.sin(i * Math.PI / 4) * 26); ctx.stroke(); }
          ctx.restore();
          ctx.fillStyle = '#8B5A2B'; rr(ctx, px + w / 2 + 6, py + h - 22, 14, 22, 3); ctx.fill();
          label(ctx, 'Mill', px + w / 2 + 8, py + 4);
          break;
        case 'lighthouse':
          ctx.fillStyle = '#F4E8CC'; ctx.fillRect(px + 12, py + 10, w - 24, h - 10);
          ctx.fillStyle = '#E4574F'; ctx.fillRect(px + 12, py + 30, w - 24, 14); ctx.fillRect(px + 12, py + 62, w - 24, 14);
          ctx.fillStyle = '#2A2420'; rr(ctx, px + 8, py - 6, w - 16, 18, 4); ctx.fill();
          ctx.fillStyle = '#F6B544'; ctx.fillRect(px + 14, py - 2, w - 28, 10);
          const beam = ctx.createRadialGradient(px + w / 2, py + 3, 2, px + w / 2, py + 3, 90);
          beam.addColorStop(0, 'rgba(246,181,68,' + (0.35 + 0.25 * Math.sin(t / 400)) + ')'); beam.addColorStop(1, 'rgba(246,181,68,0)');
          ctx.fillStyle = beam; circ(ctx, px + w / 2, py + 3, 90);
          break;
        case 'bridge': break;   // the bridge is tiles, nothing more to draw
      }
      return;
    }
    // stakes and rope
    ctx.strokeStyle = '#F6B544'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(px + 6, py + 6, w - 12, h - 12); ctx.setLineDash([]);
    [[px + 6, py + 6], [px + w - 6, py + 6], [px + 6, py + h - 6], [px + w - 6, py + h - 6]].forEach(([x, y]) => { ctx.fillStyle = '#7A4F2A'; ctx.fillRect(x - 2, y - 10, 4, 14); });
    ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, px + w / 2 - 34, py + h / 2 - 10, 68, 20, 6); ctx.fill();
    ctx.fillStyle = '#2A2420'; ctx.font = 'bold 10px ' + FONT(); ctx.textAlign = 'center';
    ctx.fillText(st === 'building' ? tl('BUILDING…') : tl(m.kind.toUpperCase() + ' SITE'), px + w / 2, py + h / 2 + 4);
    if (st === 'building') {
      const p = Math.min(1, (Date.now() - ms.startedAt) / (m.buildSec * 1000));
      ctx.fillStyle = '#2A2420'; rr(ctx, px + 6, py - 12, w - 12, 8, 4); ctx.fill();
      ctx.fillStyle = '#63C48F'; rr(ctx, px + 6, py - 12, Math.max(8, (w - 12) * p), 8, 4); ctx.fill();
      const bob = Math.abs(Math.sin(t / 120)) * 6;
      ctx.fillStyle = '#5B4F47'; ctx.fillRect(px + 14, py + 14 - bob, 3, 12); ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + 10, py + 10 - bob, 11, 6);
    }
  }
  function label(ctx, text, x, y) {
    text = tl(text);
    ctx.font = 'bold 11px ' + FONT(); ctx.textAlign = 'center';
    const tw = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(ctx, x - tw / 2, y - 11, tw, 14, 7); ctx.fill();
    ctx.fillStyle = '#2A2420'; ctx.fillText(text, x, y);
  }

  function drawDecor(ctx, d, ox, oy, t) {
    if (d.hideWhen && state.flags[d.hideWhen]) return;
    if (d.showWhen && !state.flags[d.showWhen]) return;
    const fixed = d.fixWhen && state.flags[d.fixWhen];
    const px = d.x * TS - ox, py = d.y * TS - oy;
    switch (d.kind) {
      case 'sign':
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 14, py + 12, 4, 18); ctx.fillStyle = '#F4E8CC'; rr(ctx, px + 2, py + 4, 28, 12, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 7px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText(tl(d.text || ''), px + 16, py + 13); break;
      case 'bench':
        ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 2, py + 14, 28, 6); ctx.fillRect(px + 2, py + 6, 28, 5); ctx.fillRect(px + 4, py + 20, 3, 8); ctx.fillRect(px + 25, py + 20, 3, 8); break;
      case 'lamp': {
        const lit = !d.dark || fixed;
        ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 14, py + 8, 4, 22); ctx.fillRect(px + 10, py + 28, 12, 3);
        ctx.fillStyle = lit ? '#F6B544' : '#5B4F47'; rr(ctx, px + 10, py + 2, 12, 10, 3); ctx.fill();
        if (lit) { const g = ctx.createRadialGradient(px + 16, py + 7, 2, px + 16, py + 7, 22); g.addColorStop(0, 'rgba(246,181,68,.35)'); g.addColorStop(1, 'rgba(246,181,68,0)'); ctx.fillStyle = g; circ(ctx, px + 16, py + 7, 22); }
        break; }
      case 'goat':
        ctx.fillStyle = '#F4E8CC'; rr(ctx, px + 6, py + 12, 20, 12, 5); ctx.fill(); circ(ctx, px + 25, py + 11, 6);
        ctx.fillStyle = '#5B4F47'; ctx.fillRect(px + 8, py + 23, 3, 7); ctx.fillRect(px + 20, py + 23, 3, 7); ctx.fillRect(px + 27, py + 3, 2, 5); ctx.fillRect(px + 22, py + 3, 2, 5);
        ctx.fillStyle = '#2A2420'; circ(ctx, px + 27, py + 10, 1.2); break;
      case 'brokenfence':
        ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 4, py + 10, 4, 16); ctx.fillRect(px + 24, py + 10, 4, 16);
        if (fixed) { ctx.fillRect(px, py + 13, TS, 3); ctx.fillRect(px, py + 21, TS, 3); }
        else { ctx.save(); ctx.translate(px + 16, py + 20); ctx.rotate(0.5); ctx.fillRect(-14, -2, 20, 3); ctx.restore(); ctx.fillRect(px + 20, py + 21, 8, 3); }
        break;
      case 'bucket':
        ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(px + 8, py + 12); ctx.lineTo(px + 24, py + 12); ctx.lineTo(px + 22, py + 28); ctx.lineTo(px + 10, py + 28); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#5B4F47'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 16, py + 12, 8, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#5FB3D9'; ctx.fillRect(px + 10, py + 14, 12, 3); break;
      case 'pot2':
        ctx.fillStyle = '#C0623F'; ctx.fillRect(px + 8, py + 14, 16, 14); ctx.fillStyle = '#63C48F'; circ(ctx, px + 16, py + 10, 7); ctx.fillStyle = '#F6B544'; circ(ctx, px + 16, py + 8, 3); break;
      case 'crate':
        ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + 6, py + 10, 20, 18); ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 2; ctx.strokeRect(px + 6, py + 10, 20, 18); ctx.beginPath(); ctx.moveTo(px + 6, py + 10); ctx.lineTo(px + 26, py + 28); ctx.stroke(); break;
      case 'apples':
        ctx.fillStyle = '#B08A5A'; ctx.beginPath(); ctx.moveTo(px + 6, py + 16); ctx.lineTo(px + 26, py + 16); ctx.lineTo(px + 23, py + 28); ctx.lineTo(px + 9, py + 28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#E4574F'; circ(ctx, px + 11, py + 14, 4); circ(ctx, px + 20, py + 13, 4); circ(ctx, px + 15, py + 10, 4); break;
      case 'scarecrow':
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 15, py + 6, 3, 24); ctx.fillRect(px + 4, py + 12, 24, 3);
        if (fixed) { ctx.fillStyle = '#E2B93B'; circ(ctx, px + 16, py + 6, 6); ctx.fillStyle = '#2F80ED'; ctx.fillRect(px + 8, py + 12, 16, 10); }
        else { ctx.fillStyle = '#E2B93B'; circ(ctx, px + 8, py + 26, 5); ctx.fillStyle = '#2F80ED'; ctx.fillRect(px + 20, py + 22, 10, 6); }
        break;
      case 'logs':
        ctx.fillStyle = '#A2703F'; circ(ctx, px + 8, py + 24, 6); circ(ctx, px + 20, py + 24, 6); circ(ctx, px + 14, py + 14, 6); ctx.fillStyle = '#E2CD95'; circ(ctx, px + 8, py + 24, 3); circ(ctx, px + 20, py + 24, 3); circ(ctx, px + 14, py + 14, 3); break;
      case 'tripod':
        ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 16, py + 10); ctx.lineTo(px + 6, py + 30); ctx.moveTo(px + 16, py + 10); ctx.lineTo(px + 26, py + 30); ctx.moveTo(px + 16, py + 10); ctx.lineTo(px + 16, py + 30); ctx.stroke(); ctx.fillStyle = '#F6B544'; ctx.fillRect(px + 10, py + 4, 12, 8); break;
      case 'boat':
        ctx.fillStyle = '#A2703F'; ctx.beginPath(); ctx.moveTo(px + 2, py + 16); ctx.lineTo(px + 30, py + 16); ctx.lineTo(px + 24, py + 26); ctx.lineTo(px + 8, py + 26); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 15, py + 2, 2, 14); ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(px + 17, py + 2); ctx.lineTo(px + 28, py + 13); ctx.lineTo(px + 17, py + 13); ctx.fill(); break;
      case 'stall':
        ctx.fillStyle = d.color || '#E4574F'; for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : (d.color || '#E4574F'); ctx.fillRect(px + i * 8, py + 4, 8, 8); }
        ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + 2, py + 16, 28, 12); ctx.fillStyle = '#F6B544'; circ(ctx, px + 10, py + 16, 3); ctx.fillStyle = '#63C48F'; circ(ctx, px + 18, py + 15, 3); ctx.fillStyle = '#E4574F'; circ(ctx, px + 25, py + 16, 3); break;
      case 'fountain':
        ctx.fillStyle = '#8E8A80'; circ(ctx, px + 16, py + 20, 14); ctx.fillStyle = '#5FB3D9'; circ(ctx, px + 16, py + 20, 10);
        ctx.fillStyle = 'rgba(255,255,255,.8)'; circ(ctx, px + 16, py + 8 + Math.sin(t / 200) * 2, 3); circ(ctx, px + 12, py + 13, 2); circ(ctx, px + 20, py + 13, 2); break;
      case 'lostsign':
        ctx.save(); ctx.translate(px + 16, py + 20); ctx.rotate(-0.9); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-2, -6, 4, 18); ctx.fillStyle = '#F4E8CC'; rr(ctx, -14, -12, 28, 10, 3); ctx.fill(); ctx.restore(); break;
      case 'broom':
        ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 15, py + 2, 3, 20); ctx.fillStyle = '#E2B93B'; ctx.beginPath(); ctx.moveTo(px + 10, py + 20); ctx.lineTo(px + 22, py + 20); ctx.lineTo(px + 26, py + 30); ctx.lineTo(px + 6, py + 30); ctx.fill(); break;
      case 'cards':
        ctx.fillStyle = '#2F7A44'; rr(ctx, px + 2, py + 8, 28, 20, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(px + 6, py + 12, 7, 10); ctx.fillRect(px + 15, py + 12, 7, 10); ctx.fillStyle = '#E4574F'; circ(ctx, px + 9.5, py + 17, 2); ctx.fillStyle = '#2A2420'; circ(ctx, px + 18.5, py + 17, 2); break;
      case 'cart':
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 4, py + 10, 24, 12); ctx.fillStyle = '#2A2420';
        if (fixed) { circ(ctx, px + 9, py + 25, 5); circ(ctx, px + 23, py + 25, 5); ctx.fillStyle = '#8E8A80'; circ(ctx, px + 12, py + 9, 4); circ(ctx, px + 20, py + 8, 4); }
        else { circ(ctx, px + 9, py + 25, 5); ctx.save(); ctx.translate(px + 26, py + 28); ctx.rotate(0.6); ctx.fillRect(-5, -1, 10, 2); ctx.fillRect(-1, -5, 2, 10); ctx.restore(); }
        break;
      case 'canary':
        ctx.fillStyle = '#F6B544'; circ(ctx, px + 16, py + 18, 6); circ(ctx, px + 21, py + 14, 4); ctx.fillStyle = '#E4574F'; ctx.beginPath(); ctx.moveTo(px + 24, py + 14); ctx.lineTo(px + 28, py + 15); ctx.lineTo(px + 24, py + 16); ctx.fill(); ctx.fillStyle = '#2A2420'; circ(ctx, px + 22, py + 13, 1); break;
      case 'orepile':
        ctx.fillStyle = '#6E6A62'; circ(ctx, px + 10, py + 24, 7); circ(ctx, px + 22, py + 24, 7); circ(ctx, px + 16, py + 15, 7); ctx.fillStyle = '#F6B544'; circ(ctx, px + 14, py + 14, 2); circ(ctx, px + 22, py + 22, 2); circ(ctx, px + 9, py + 25, 1.5); break;
      case 'ropes':
        ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px + 16, py + 18, 9, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(px + 16, py + 18, 4, 0, Math.PI * 2); ctx.stroke(); break;
      case 'tollbox':
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 14, py + 14, 4, 16); ctx.fillStyle = '#F6B544'; rr(ctx, px + 6, py + 4, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 12, py + 7, 8, 2); ctx.font = 'bold 7px system-ui'; ctx.textAlign = 'center'; ctx.fillText('TOLL', px + 16, py + 16); break;
      case 'oar':
        ctx.save(); ctx.translate(px + 16, py + 16); ctx.rotate(0.7); ctx.fillStyle = '#A2703F'; ctx.fillRect(-2, -14, 4, 22); ctx.fillStyle = '#7A4F2A'; rr(ctx, -5, 6, 10, 12, 4); ctx.fill(); ctx.restore(); break;
      case 'plinth':
        if (state.statues && state.statues[d.statue]) drawStatue(ctx, px, py, t);
        else { ctx.fillStyle = '#A9A39A'; rr(ctx, px + 5, py + 18, 22, 11, 3); ctx.fill(); ctx.fillStyle = '#C9C4BA'; rr(ctx, px + 8, py + 12, 16, 8, 2); ctx.fill(); ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + 10, py + 22, 12, 2); }
        break;
    }
  }

  /* A stone Aristotle on a plinth: a robed figure holding a scroll, laurel on his head. */
  const STONE = { size: 'm', skin: '#D3CEC4', hair: '#B5B0A6', hairStyle: 'short', shirt: '#C9C4BA', pants: '#B5B0A6', robe: '#C9C4BA', beard: true };
  function drawStatue(ctx, px, py, t) {
    ctx.fillStyle = '#A9A39A'; rr(ctx, px + 3, py + 20, 26, 12, 3); ctx.fill(); ctx.fillStyle = '#C9C4BA'; rr(ctx, px + 6, py + 14, 20, 8, 2); ctx.fill();
    drawPerson(ctx, px + 16, py + 14, STONE, 'down', 0, 0.95);
    ctx.fillStyle = '#F4E8CC'; rr(ctx, px + 20, py - 12, 4, 10, 1); ctx.fill();                       // the scroll
    ctx.strokeStyle = '#8FA36B'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 16, py - 22, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();   // laurel
    const g = ctx.createRadialGradient(px + 16, py + 4, 4, px + 16, py + 4, 30); g.addColorStop(0, 'rgba(246,181,68,' + (0.18 + 0.1 * Math.sin(t / 500)) + ')'); g.addColorStop(1, 'rgba(246,181,68,0)');
    ctx.fillStyle = g; circ(ctx, px + 16, py + 4, 30);
  }
  /* The statue's circle of effect: a soft golden ring that breathes. */
  function drawRing(ctx, cx, cy, r, t) {
    const pulse = 0.5 + 0.5 * Math.sin(t / 900);
    const g = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
    g.addColorStop(0, 'rgba(246,181,68,0)'); g.addColorStop(1, 'rgba(246,181,68,' + (0.10 + 0.08 * pulse) + ')');
    ctx.fillStyle = g; circ(ctx, cx, cy, r);
    ctx.strokeStyle = 'rgba(246,181,68,' + (0.35 + 0.3 * pulse) + ')'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -t / 60;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  /* Grey fog puffs circling somebody's head while a preacher works on them. */
  function drawSermon(ctx, cx, feetY, t) {
    for (let i = 0; i < 6; i++) {
      const a = t / 700 + i * Math.PI / 3, r = 14 + 3 * Math.sin(t / 300 + i);
      ctx.fillStyle = 'rgba(120,120,125,' + (0.35 + 0.25 * Math.sin(t / 200 + i)) + ')';
      circ(ctx, cx + Math.cos(a) * r, feetY - 36 + Math.sin(a) * r * 0.5, 4 + (i % 2));
    }
  }

  /* ================= people ================= */
  const SIZES = { s: 0.72, m: 0.86, l: 1.0, xl: 1.14 };
  function drawPerson(ctx, cx, feetY, spec, dir, walk, scale) {
    const S = SIZES[spec.size || 'm'] * (scale || 1);
    const hw = 7 * S, bodyH = 12 * S, headR = 7.5 * S, legH = 6 * S;
    const swing = walk ? Math.sin(walk * Math.PI * 2) * 2.5 * S : 0;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(cx, feetY + 1, 9 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = spec.pants || '#3E5C8A';
    ctx.fillRect(cx - 5.5 * S, feetY - legH + swing, 4.5 * S, legH); ctx.fillRect(cx + 1 * S, feetY - legH - swing, 4.5 * S, legH);
    ctx.fillStyle = spec.shirt; rr(ctx, cx - hw, feetY - legH - bodyH, hw * 2, bodyH + 1, 3 * S); ctx.fill();
    if (spec.robe) {   // a long robe from the shoulders to the ground, with a faint seam and a sash
      ctx.fillStyle = spec.robe; ctx.beginPath(); ctx.moveTo(cx - hw, feetY - legH - bodyH + 1 * S); ctx.lineTo(cx + hw, feetY - legH - bodyH + 1 * S); ctx.lineTo(cx + hw + 3 * S, feetY + swing * 0.3); ctx.lineTo(cx - hw - 3 * S, feetY - swing * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = spec.sash || '#6B6662'; ctx.fillRect(cx - hw - 1 * S, feetY - legH - 2 * S, hw * 2 + 2 * S, 2.5 * S);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(cx - hw + 1 * S, feetY - legH - bodyH + 2 * S, 2 * S, bodyH - 3 * S); ctx.fillRect(cx + hw - 3 * S, feetY - legH - bodyH + 2 * S, 2 * S, bodyH - 3 * S);
    }
    if (spec.apron) { ctx.fillStyle = spec.apron === true ? '#F4E8CC' : spec.apron; ctx.fillRect(cx - hw + 2 * S, feetY - legH - bodyH + 3 * S, hw * 2 - 4 * S, bodyH - 3 * S); }
    if (spec.vest) { ctx.fillStyle = spec.vest; ctx.fillRect(cx - hw, feetY - legH - bodyH, 3 * S, bodyH); ctx.fillRect(cx + hw - 3 * S, feetY - legH - bodyH, 3 * S, bodyH); }
    ctx.fillStyle = spec.robe || spec.skin;
    ctx.fillRect(cx - hw - 3 * S, feetY - legH - bodyH + 2 * S - swing * 0.6, 3 * S, 8 * S);
    ctx.fillRect(cx + hw, feetY - legH - bodyH + 2 * S + swing * 0.6, 3 * S, 8 * S);
    const hy = feetY - legH - bodyH - headR + 2 * S;
    circ(ctx, cx, hy, headR);
    ctx.fillStyle = spec.hair;
    const st = spec.hairStyle || 'short';
    if (st !== 'bald') {
      if (dir === 'up') { circ(ctx, cx, hy, headR); }
      else { ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR, Math.PI, 0); ctx.fill(); }
    }
    if (st === 'long') { ctx.fillRect(cx - headR, hy - 1 * S, 3 * S, headR + 6 * S); ctx.fillRect(cx + headR - 3 * S, hy - 1 * S, 3 * S, headR + 6 * S); }
    if (st === 'bun') { circ(ctx, cx, hy - headR - 1 * S, 3.5 * S); }
    if (st === 'curly') { circ(ctx, cx - headR + 1 * S, hy - 2 * S, 3.5 * S); circ(ctx, cx + headR - 1 * S, hy - 2 * S, 3.5 * S); circ(ctx, cx, hy - headR, 4 * S); }
    if (spec.cap) { ctx.fillStyle = spec.cap; ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR + 0.5 * S, Math.PI, 0); ctx.fill(); if (dir !== 'up') ctx.fillRect(cx - headR - 2 * S * (dir === 'left' ? 1 : 0), hy - 1.5 * S, headR + 4 * S, 2.5 * S); }
    if (spec.helmet) { ctx.fillStyle = spec.helmet; ctx.beginPath(); ctx.arc(cx, hy - 0.5 * S, headR + 1 * S, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - headR - 1 * S, hy - 1.5 * S, headR * 2 + 2 * S, 2.5 * S); }
    if (spec.hat) { ctx.fillStyle = spec.hat; ctx.fillRect(cx - headR - 3 * S, hy - headR + 1 * S, headR * 2 + 6 * S, 2.5 * S); rr(ctx, cx - headR + 1 * S, hy - headR - 7 * S, headR * 2 - 2 * S, 9 * S, 2 * S); ctx.fill(); }
    if (spec.bandana) { ctx.fillStyle = spec.bandana; ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR + 0.5 * S, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - headR - 0.5 * S, hy - 2 * S, headR * 2 + 1 * S, 2.5 * S); }
    if (spec.partyhat) { ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(cx - 5 * S, hy - headR + 2 * S); ctx.lineTo(cx, hy - headR - 9 * S); ctx.lineTo(cx + 5 * S, hy - headR + 2 * S); ctx.fill(); }
    if (spec.turban) {   // a wrapped turban: wide band low on the brow, a dome above, a fold line
      ctx.fillStyle = spec.turban; ctx.beginPath(); ctx.ellipse(cx, hy - headR * 0.5, headR + 2.2 * S, headR * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, hy - headR * 0.95, headR * 0.7, headR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1 * S; ctx.beginPath(); ctx.moveTo(cx - headR - 1 * S, hy - headR * 0.35); ctx.quadraticCurveTo(cx, hy - headR * 0.8, cx + headR + 1 * S, hy - headR * 0.25); ctx.stroke();
    }
    if (dir !== 'up') {
      ctx.fillStyle = '#2A2420';
      const ey = hy + 1.5 * S;
      if (dir === 'down') { circ(ctx, cx - 2.8 * S, ey, 1.2 * S); circ(ctx, cx + 2.8 * S, ey, 1.2 * S); }
      else if (dir === 'left') { circ(ctx, cx - 3.5 * S, ey, 1.2 * S); }
      else { circ(ctx, cx + 3.5 * S, ey, 1.2 * S); }
      ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 1 * S; ctx.beginPath();
      const mx = dir === 'left' ? cx - 2 * S : dir === 'right' ? cx + 2 * S : cx;
      if (spec.frown) ctx.arc(mx, hy + 5.5 * S, 2 * S, 1.15 * Math.PI, 1.85 * Math.PI); else ctx.arc(mx, hy + 3.5 * S, 2 * S, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      if (spec.glasses) { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx - 2.8 * S, ey, 2.4 * S, 0, Math.PI * 2); ctx.moveTo(cx + 5.2 * S, ey); ctx.arc(cx + 2.8 * S, ey, 2.4 * S, 0, Math.PI * 2); ctx.stroke(); }
      if (spec.beard) { ctx.fillStyle = spec.hair; ctx.beginPath(); ctx.arc(cx, hy + 3 * S, headR - 1 * S, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill(); }
      if (spec.eyepatch) { ctx.fillStyle = '#2A2420'; circ(ctx, cx + 2.8 * S, ey, 2.4 * S); }
      ctx.fillStyle = 'rgba(255,150,140,.45)'; circ(ctx, cx - 4.5 * S, hy + 3 * S, 1.5 * S); circ(ctx, cx + 4.5 * S, hy + 3 * S, 1.5 * S);
    }
  }

  /* ================= talking portrait =================
     A bust of the same person, big enough to read. `talking` opens and closes the
     mouth; eyes blink now and then; the head bobs a little while speaking. */
  function drawFace(ctx, spec, t, talking, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#E7D6B0'; rr(ctx, 0, 0, W, H, 14); ctx.fill();
    ctx.save(); rr(ctx, 0, 0, W, H, 14); ctx.clip();
    const cx = W / 2, R = W * 0.27;
    const bob = talking ? Math.sin(t / 130) * 1.6 : Math.sin(t / 1100) * 0.8;
    const hy = H * 0.40 + bob;
    // shoulders
    ctx.fillStyle = spec.shirt; rr(ctx, cx - W * 0.40, H * 0.74, W * 0.80, H * 0.5, 18); ctx.fill();
    if (spec.vest) { ctx.fillStyle = spec.vest; ctx.fillRect(cx - W * 0.40, H * 0.74, W * 0.14, H * 0.3); ctx.fillRect(cx + W * 0.26, H * 0.74, W * 0.14, H * 0.3); }
    if (spec.apron) { ctx.fillStyle = spec.apron === true ? '#F4E8CC' : spec.apron; ctx.fillRect(cx - W * 0.16, H * 0.8, W * 0.32, H * 0.3); }
    // neck and ears
    ctx.fillStyle = spec.skin; ctx.fillRect(cx - R * 0.32, hy + R * 0.6, R * 0.64, R * 0.7);
    circ(ctx, cx - R * 0.98, hy + R * 0.1, R * 0.2); circ(ctx, cx + R * 0.98, hy + R * 0.1, R * 0.2);
    // head
    circ(ctx, cx, hy, R);
    // hair
    const st = spec.hairStyle || 'short';
    ctx.fillStyle = spec.hair;
    if (st === 'bald') { ctx.beginPath(); ctx.arc(cx, hy, R + 0.5, Math.PI * 1.05, Math.PI * 1.25); ctx.lineTo(cx - R * 0.9, hy - R * 0.15); ctx.fill(); ctx.beginPath(); ctx.arc(cx, hy, R + 0.5, -Math.PI * 0.25, -Math.PI * 0.05); ctx.lineTo(cx + R * 0.9, hy - R * 0.15); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(cx, hy - R * 0.08, R + 1, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); ctx.fillRect(cx - R - 1, hy - R * 0.35, R * 2 + 2, R * 0.3); }
    if (st === 'long') { ctx.fillRect(cx - R - 2, hy - R * 0.3, R * 0.42, R * 1.9); ctx.fillRect(cx + R - R * 0.4 + 2, hy - R * 0.3, R * 0.42, R * 1.9); }
    if (st === 'bun') { circ(ctx, cx, hy - R - R * 0.15, R * 0.42); }
    if (st === 'curly') { for (let i = -3; i <= 3; i++) circ(ctx, cx + i * R * 0.36, hy - R * 0.85 - Math.abs(i) * -R * 0.06, R * 0.3); circ(ctx, cx - R * 0.95, hy - R * 0.25, R * 0.32); circ(ctx, cx + R * 0.95, hy - R * 0.25, R * 0.32); }
    if (spec.cap) { ctx.fillStyle = spec.cap; ctx.beginPath(); ctx.arc(cx, hy - R * 0.1, R + 2, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R - 2, hy - R * 0.3, R * 2 + 4, R * 0.28); rr(ctx, cx - R * 0.2, hy - R * 0.32, R * 1.5, R * 0.3, 4); ctx.fill(); }
    if (spec.helmet) { ctx.fillStyle = spec.helmet; ctx.beginPath(); ctx.arc(cx, hy - R * 0.05, R + 3, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R - 5, hy - R * 0.3, R * 2 + 10, R * 0.3); }
    if (spec.bandana) { ctx.fillStyle = spec.bandana; ctx.beginPath(); ctx.arc(cx, hy - R * 0.1, R + 2, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R - 2, hy - R * 0.4, R * 2 + 4, R * 0.35); ctx.beginPath(); ctx.moveTo(cx + R * 0.7, hy - R * 0.2); ctx.lineTo(cx + R * 1.45, hy + R * 0.25); ctx.lineTo(cx + R * 0.95, hy - R * 0.05); ctx.fill(); }
    if (spec.hat) { ctx.fillStyle = spec.hat; ctx.fillRect(cx - R * 1.35, hy - R * 0.72, R * 2.7, R * 0.28); rr(ctx, cx - R * 0.85, hy - R * 1.65, R * 1.7, R * 1.0, 5); ctx.fill(); }
    // eyes
    const blink = ((t / 3300 + ((spec.skin.charCodeAt(1) || 0) % 7) * 0.13) % 1) < 0.045;
    const ey = hy + R * 0.05, ex = R * 0.42;
    ctx.fillStyle = '#fff';
    if (!blink) { circ(ctx, cx - ex, ey, R * 0.2); circ(ctx, cx + ex, ey, R * 0.2); ctx.fillStyle = '#2A2420'; circ(ctx, cx - ex + R * 0.03, ey + R * 0.03, R * 0.1); circ(ctx, cx + ex + R * 0.03, ey + R * 0.03, R * 0.1); }
    else { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - ex - R * 0.2, ey); ctx.lineTo(cx - ex + R * 0.2, ey); ctx.moveTo(cx + ex - R * 0.2, ey); ctx.lineTo(cx + ex + R * 0.2, ey); ctx.stroke(); }
    // brows
    ctx.strokeStyle = spec.hair === '#DDDDDD' ? '#9A9A9A' : spec.hair; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
    const tilt = spec.frown ? R * 0.1 : -R * 0.04;
    ctx.moveTo(cx - ex - R * 0.22, ey - R * 0.32 - tilt); ctx.lineTo(cx - ex + R * 0.22, ey - R * 0.32 + tilt);
    ctx.moveTo(cx + ex - R * 0.22, ey - R * 0.32 + tilt); ctx.lineTo(cx + ex + R * 0.22, ey - R * 0.32 - tilt); ctx.stroke();
    if (spec.glasses) { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - ex, ey, R * 0.3, 0, Math.PI * 2); ctx.moveTo(cx + ex + R * 0.3, ey); ctx.arc(cx + ex, ey, R * 0.3, 0, Math.PI * 2); ctx.moveTo(cx - ex + R * 0.3, ey); ctx.lineTo(cx + ex - R * 0.3, ey); ctx.stroke(); }
    if (spec.eyepatch) { ctx.fillStyle = '#2A2420'; circ(ctx, cx + ex, ey, R * 0.3); ctx.lineWidth = 2; ctx.strokeStyle = '#2A2420'; ctx.beginPath(); ctx.moveTo(cx + ex - R * 0.3, ey - R * 0.1); ctx.lineTo(cx - R, hy - R * 0.5); ctx.stroke(); }
    // cheeks
    ctx.fillStyle = 'rgba(255,150,140,.4)'; circ(ctx, cx - R * 0.62, hy + R * 0.4, R * 0.16); circ(ctx, cx + R * 0.62, hy + R * 0.4, R * 0.16);
    // mouth
    const my = hy + R * 0.52;
    if (talking) {
      const open = R * (0.08 + 0.3 * Math.abs(Math.sin(t / 95) * 0.6 + Math.sin(t / 41) * 0.4));
      ctx.fillStyle = '#7A2A25'; ctx.beginPath(); ctx.ellipse(cx, my, R * 0.28, open, 0, 0, Math.PI * 2); ctx.fill();
      if (open > R * 0.16) { ctx.fillStyle = '#fff'; ctx.fillRect(cx - R * 0.2, my - open + 1, R * 0.4, R * 0.08); }
    } else {
      ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 2.5; ctx.beginPath();
      if (spec.frown) ctx.arc(cx, my + R * 0.32, R * 0.3, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(cx, my - R * 0.05, R * 0.3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    if (spec.beard) { ctx.fillStyle = spec.hair; ctx.beginPath(); ctx.arc(cx, hy + R * 0.25, R * 0.92, Math.PI * 0.12, Math.PI * 0.88); ctx.lineTo(cx - R * 0.6, hy + R * 0.55); ctx.lineTo(cx + R * 0.6, hy + R * 0.55); ctx.fill(); ctx.fillStyle = spec.skin; ctx.beginPath(); ctx.ellipse(cx, my + R * 0.04, R * 0.36, R * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      if (talking) { const open = R * (0.08 + 0.3 * Math.abs(Math.sin(t / 95) * 0.6 + Math.sin(t / 41) * 0.4)); ctx.fillStyle = '#7A2A25'; ctx.beginPath(); ctx.ellipse(cx, my, R * 0.26, Math.min(open, R * 0.22), 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, my - R * 0.05, R * 0.26, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); } }
    ctx.restore();
  }

  /* Shortest path over walkable tiles. `avoid` is a set of "x,y" keys to treat as blocked. */
  function findPath(x0, y0, x1, y1, avoid) {
    if (!walkable(x1, y1) || (avoid && avoid.has(x1 + ',' + y1))) return null;
    const key = (x, y) => x + ',' + y, prev = new Map([[key(x0, y0), null]]), q = [[x0, y0]];
    let guard = 0;
    while (q.length && guard++ < 6000) {
      const [x, y] = q.shift();
      if (x === x1 && y === y1) { const path = []; let k = key(x, y); while (prev.get(k)) { const [px, py] = k.split(',').map(Number); path.unshift([px, py]); k = prev.get(k); } return path; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || !walkable(nx, ny) || (avoid && avoid.has(k))) continue;
        prev.set(k, key(x, y)); q.push([nx, ny]);
      }
    }
    return null;
  }

  /* ================= actions, carried items, followers, site glow ================= */
  /* Deterministic scatter so particles do not flicker between frames. */
  const jit = (i, s) => ((Math.sin(i * 127.1 + s * 311.7) * 43758.5453) % 1 + 1) % 1;

  /* A tool animation drawn over a person standing at (cx, feetY). `p` is 0..1 progress. */
  function drawAction(ctx, kind, cx, feetY, t, p, dir) {
    const side = dir === 'left' ? -1 : 1;
    const hx = cx + 9 * side, hy = feetY - 16;      // hand
    ctx.save(); ctx.lineCap = 'round';
    switch (kind) {
      case 'hammer': case 'forge': {
        const a = Math.sin(t / 110) * 0.9 - 0.6;
        ctx.translate(hx, hy); ctx.rotate(a * side);
        ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
        ctx.fillStyle = '#5B4F47'; rr(ctx, -7, -21, 14, 7, 2); ctx.fill();
        ctx.restore(); ctx.save();
        if (Math.sin(t / 110) > 0.85) for (let i = 0; i < 6; i++) { ctx.fillStyle = kind === 'forge' ? '#F6B544' : '#FFE8A3'; circ(ctx, hx + side * 14 + (jit(i, 1) - 0.5) * 22, feetY - 6 - jit(i, 2) * 22, 1.5 + jit(i, 3)); }
        if (kind === 'forge') { ctx.fillStyle = '#5B4F47'; rr(ctx, cx + side * 14, feetY - 8, 18, 8, 2); ctx.fill(); ctx.fillStyle = '#FF7B6B'; rr(ctx, cx + side * 17, feetY - 10, 12, 3, 1); ctx.fill(); }
        break; }
      case 'dig': {
        const a = Math.sin(t / 160) * 0.6 + 0.3;
        ctx.translate(hx, hy); ctx.rotate(a * side);
        ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 18); ctx.stroke();
        ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(6, 16); ctx.lineTo(4, 26); ctx.lineTo(-4, 26); ctx.fill();
        ctx.restore(); ctx.save();
        for (let i = 0; i < 5; i++) { const f = ((t / 500 + jit(i, 4)) % 1); ctx.fillStyle = '#8B6A3E'; circ(ctx, cx + side * 18 + (jit(i, 5) - 0.5) * 20, feetY - 4 - f * 24 + f * f * 30, 2.5 - f); }
        break; }
      case 'sweep': {
        const s = Math.sin(t / 220) * 10;
        ctx.strokeStyle = '#A2703F'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, hy - 4); ctx.lineTo(cx + side * 16 + s, feetY + 2); ctx.stroke();
        ctx.fillStyle = '#E2B93B'; ctx.beginPath(); ctx.moveTo(cx + side * 10 + s, feetY - 2); ctx.lineTo(cx + side * 22 + s, feetY - 2); ctx.lineTo(cx + side * 26 + s, feetY + 6); ctx.lineTo(cx + side * 6 + s, feetY + 6); ctx.fill();
        for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(200,190,170,.6)'; circ(ctx, cx + side * 20 + s + (jit(i, 6) - 0.5) * 18, feetY + 2 - jit(i, 7) * 8 - ((t / 300 + i) % 1) * 6, 2); }
        break; }
      case 'pick': case 'sort': {
        const b = Math.abs(Math.sin(t / 260));
        ctx.fillStyle = kind === 'sort' ? '#F6B544' : '#E4574F'; circ(ctx, hx + side * 4, hy + 10 - b * 22, 3.5);
        if (kind === 'sort') for (let i = 0; i < 3; i++) { ctx.fillStyle = '#FFE8A3'; circ(ctx, cx + side * 20 + (jit(i, 8) - 0.5) * 16, feetY - 4 - jit(i, 9) * 10, 1.2); }
        break; }
      case 'milk': {
        ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(cx + side * 14, feetY - 8); ctx.lineTo(cx + side * 26, feetY - 8); ctx.lineTo(cx + side * 24, feetY + 2); ctx.lineTo(cx + side * 16, feetY + 2); ctx.fill();
        for (let i = 0; i < 3; i++) { const f = ((t / 350 + i / 3) % 1); ctx.fillStyle = '#fff'; circ(ctx, cx + side * 20 + (i - 1) * 2, feetY - 18 + f * 12, 1.5); }
        break; }
      case 'coil': {
        const r = 6 + Math.abs(Math.sin(t / 300)) * 6;
        ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx + side * 6, hy + 6, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hx + side * 6 + r, hy + 6); ctx.quadraticCurveTo(cx + side * 30, feetY - 20, cx + side * 34, feetY + 4); ctx.stroke();
        break; }
      case 'lift': {
        const a = -1.2 * Math.min(1, p * 1.4);
        ctx.translate(cx + side * 16, feetY); ctx.rotate(a * side);
        ctx.fillStyle = '#A2703F'; rr(ctx, -3, -28, 6, 28, 2); ctx.fill();
        break; }
      case 'light': {
        const f = Math.min(1, p * 1.3);
        ctx.fillStyle = '#F6B544'; circ(ctx, hx + side * 2, hy - 10 - f * 14, 2 + f * 4);
        const g = ctx.createRadialGradient(hx, hy - 20, 2, hx, hy - 20, 30 * f + 4); g.addColorStop(0, 'rgba(246,181,68,.5)'); g.addColorStop(1, 'rgba(246,181,68,0)'); ctx.fillStyle = g; circ(ctx, hx, hy - 20, 30 * f + 4);
        break; }
      case 'call': {
        for (let i = 0; i < 3; i++) { const f = ((t / 900 + i / 3) % 1); ctx.fillStyle = 'rgba(42,36,32,' + (1 - f) + ')'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('♪', cx + side * (10 + f * 26), feetY - 30 - f * 22 + Math.sin(f * 9) * 3); }
        break; }
      case 'measure': {
        ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + side * 18, feetY - 20); ctx.lineTo(cx + side * 12, feetY); ctx.moveTo(cx + side * 18, feetY - 20); ctx.lineTo(cx + side * 24, feetY); ctx.stroke();
        ctx.fillStyle = '#F6B544'; ctx.fillRect(cx + side * 13, feetY - 26, 10, 7);
        ctx.strokeStyle = 'rgba(246,181,68,' + (0.4 + 0.4 * Math.sin(t / 200)) + ')'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(cx + side * 22, feetY - 23); ctx.lineTo(cx + side * 90, feetY - 30); ctx.stroke(); ctx.setLineDash([]);
        break; }
      case 'whittle': {
        const s = Math.sin(t / 150) * 3;
        ctx.strokeStyle = '#A2703F'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx - 6, hy + 2); ctx.lineTo(hx + 8, hy - 2); ctx.stroke();
        ctx.strokeStyle = '#8E8A80'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + 2 + s, hy - 6); ctx.lineTo(hx + 8 + s, hy + 2); ctx.stroke();
        for (let i = 0; i < 3; i++) { const f = ((t / 400 + i / 3) % 1); ctx.fillStyle = '#E2CD95'; ctx.fillRect(hx + 4 + (i - 1) * 5, hy + 2 + f * 14, 2, 1); }
        break; }
      case 'read': {
        ctx.fillStyle = '#6B5BB3'; rr(ctx, cx - 8, feetY - 22, 16, 11, 2); ctx.fill(); ctx.fillStyle = '#F4E8CC'; ctx.fillRect(cx - 6, feetY - 20, 5, 7); ctx.fillRect(cx + 1, feetY - 20, 5, 7);
        break; }
    }
    ctx.restore();
  }

  /* Something carried over the head with both hands. */
  function drawItem(ctx, item, cx, y, t) {
    const b = Math.sin(t / 300) * 1.2, top = y - 10 + b;
    ctx.save();
    switch (item) {
      case 'buckets': ctx.fillStyle = '#8E8A80'; [-9, 9].forEach(o => { ctx.beginPath(); ctx.moveTo(cx + o - 5, top - 4); ctx.lineTo(cx + o + 5, top - 4); ctx.lineTo(cx + o + 4, top + 6); ctx.lineTo(cx + o - 4, top + 6); ctx.fill(); ctx.fillStyle = '#5FB3D9'; ctx.fillRect(cx + o - 4, top - 3, 8, 2); ctx.fillStyle = '#8E8A80'; }); break;
      case 'pail': ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(cx - 6, top - 4); ctx.lineTo(cx + 6, top - 4); ctx.lineTo(cx + 5, top + 6); ctx.lineTo(cx - 5, top + 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 5, top - 3, 10, 2); break;
      case 'bread': ctx.fillStyle = '#D98F1F'; rr(ctx, cx - 9, top - 4, 18, 8, 4); ctx.fill(); ctx.fillStyle = '#F6B544'; ctx.fillRect(cx - 6, top - 3, 3, 1); ctx.fillRect(cx - 1, top - 3, 3, 1); ctx.fillRect(cx + 4, top - 3, 3, 1); break;
      case 'sack': ctx.fillStyle = '#C98B5B'; rr(ctx, cx - 7, top - 5, 14, 11, 4); ctx.fill(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(cx - 5, top - 6, 10, 2); break;
      case 'parcel': ctx.fillStyle = '#B08A5A'; ctx.fillRect(cx - 8, top - 5, 16, 11); ctx.strokeStyle = '#E4574F'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, top - 5); ctx.lineTo(cx, top + 6); ctx.moveTo(cx - 8, top); ctx.lineTo(cx + 8, top); ctx.stroke(); break;
      case 'oilcan': ctx.fillStyle = '#5B4F47'; rr(ctx, cx - 6, top - 3, 12, 10, 2); ctx.fill(); ctx.fillRect(cx - 2, top - 7, 4, 4); ctx.fillStyle = '#F6B544'; ctx.fillRect(cx - 4, top, 8, 3); break;
      case 'fishcrate': ctx.fillStyle = '#B08A5A'; ctx.fillRect(cx - 9, top - 3, 18, 9); ctx.fillStyle = '#5FB3D9'; [-5, 0, 5].forEach(o => { ctx.beginPath(); ctx.ellipse(cx + o, top - 3, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill(); }); break;
      case 'book': ctx.fillStyle = '#2F80ED'; rr(ctx, cx - 7, top - 4, 14, 10, 1); ctx.fill(); ctx.fillStyle = '#F4E8CC'; ctx.fillRect(cx - 5, top - 2, 10, 6); break;
      case 'basket': ctx.fillStyle = '#B08A5A'; ctx.beginPath(); ctx.moveTo(cx - 9, top - 2); ctx.lineTo(cx + 9, top - 2); ctx.lineTo(cx + 7, top + 7); ctx.lineTo(cx - 7, top + 7); ctx.fill(); ctx.fillStyle = '#E4574F'; circ(ctx, cx - 4, top - 3, 3); circ(ctx, cx + 4, top - 3, 3); circ(ctx, cx, top - 5, 3); break;
      case 'orebasket': ctx.fillStyle = '#B08A5A'; ctx.beginPath(); ctx.moveTo(cx - 9, top - 2); ctx.lineTo(cx + 9, top - 2); ctx.lineTo(cx + 7, top + 7); ctx.lineTo(cx - 7, top + 7); ctx.fill(); ctx.fillStyle = '#6E6A62'; circ(ctx, cx - 4, top - 3, 3); circ(ctx, cx + 4, top - 3, 3); ctx.fillStyle = '#F6B544'; circ(ctx, cx, top - 4, 1.5); break;
      case 'sign': ctx.fillStyle = '#F4E8CC'; rr(ctx, cx - 14, top - 6, 28, 10, 2); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.font = 'bold 6px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SHOP', cx, top + 1); break;
      case 'oar': ctx.save(); ctx.translate(cx, top); ctx.rotate(-0.2); ctx.fillStyle = '#A2703F'; ctx.fillRect(-18, -2, 36, 3); ctx.fillStyle = '#7A4F2A'; rr(ctx, 12, -5, 10, 9, 3); ctx.fill(); ctx.restore(); break;
    }
    ctx.restore();
  }

  /* A companion: the goat trots behind, the canary rides on the shoulder. */
  function drawFollower(ctx, kind, cx, feetY, t, dir) {
    if (kind === 'goat') {
      const hop = Math.abs(Math.sin(t / 180)) * 2;
      ctx.fillStyle = '#F4E8CC'; rr(ctx, cx - 10, feetY - 12 - hop, 20, 11, 5); ctx.fill(); circ(ctx, cx + 10 * (dir === 'left' ? -1 : 1), feetY - 13 - hop, 5.5);
      ctx.fillStyle = '#5B4F47'; ctx.fillRect(cx - 8, feetY - 3 - hop, 3, 4 + hop); ctx.fillRect(cx + 4, feetY - 3 - hop, 3, 4 + hop);
      ctx.fillStyle = '#F6B544'; circ(ctx, cx, feetY - 8 - hop, 1.6);
    } else if (kind === 'canary') {
      const side = dir === 'left' ? -1 : 1, bob = Math.sin(t / 250);
      ctx.fillStyle = '#F6B544'; circ(ctx, cx + 9 * side, feetY - 27 + bob, 4); circ(ctx, cx + 12 * side, feetY - 30 + bob, 2.8);
      ctx.fillStyle = '#E4574F'; ctx.beginPath(); ctx.moveTo(cx + 14 * side, feetY - 30 + bob); ctx.lineTo(cx + 17 * side, feetY - 29 + bob); ctx.lineTo(cx + 14 * side, feetY - 28 + bob); ctx.fill();
    }
  }

  /* Magical glow around an unbuilt site: pulsing halo, drifting sparkles, soft outline. */
  function drawGlow(ctx, px, py, w, h, t, strong) {
    const cx = px + w / 2, cy = py + h / 2, pulse = 0.5 + 0.5 * Math.sin(t / 600);
    const r = Math.max(w, h) * (0.95 + 0.12 * pulse) * (strong ? 1.2 : 1);
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    g.addColorStop(0, 'rgba(255,214,110,' + (0.42 + 0.16 * pulse + (strong ? 0.18 : 0)) + ')'); g.addColorStop(0.55, 'rgba(255,230,160,0.18)'); g.addColorStop(1, 'rgba(246,181,68,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    for (let i = 0; i < 16; i++) {
      const f = ((t / (1800 + i * 137) + jit(i, 11)) % 1);
      const x = px + jit(i, 12) * w + Math.sin(t / 700 + i) * 6, y = py + h - f * (h + 40), s = (1 - f) * 2.4 + 0.5;
      ctx.fillStyle = 'rgba(255,245,200,' + (1 - f) * 0.9 + ')';
      ctx.beginPath(); ctx.moveTo(x, y - s * 2); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 2); ctx.lineTo(x - s, y); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,225,140,' + (0.45 + 0.35 * pulse) + ')'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t / 40;
    rr(ctx, px + 4, py + 4, w - 8, h - 8, 8); ctx.stroke(); ctx.setLineDash([]);
  }

  const decorAt = (x, y) => decor.find(d => d.x === x && d.y === y && decorBlocked(d));
  const lodges = () => structures.filter(s => s.kind === 'lodge');
  return { TS, W, H, at, walkable, regions, regionAt, locked, siteAt, setState, structures, decor, decorAt, lodges, drawTile, drawFace, findPath, drawAction, drawItem, drawFollower, drawGlow, drawStructure, drawDecor, drawMission, drawPerson, drawRing, drawSermon, rr };
})();
