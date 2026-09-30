/* Fog of Fallacy - the Valley: one big tile map split into six regions (levels).
   Regions start hidden under fog and open as missions are built. Also holds the
   code-drawn buildings, decorations and people so every sprite shares one look. */

window.World = (function () {
  const TS = 32, W = 92, H = 84;
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
    { id: 'harbour', name: 'Harbour', x0: 1, y0: 58, x1: 62, y1: 82 },
    { id: 'city', name: 'The Grey City', x0: 65, y0: 58, x1: 90, y1: 82 }
  ];
  /* Tiles that change when a region opens (gates, passes, bridges). */
  const gates = {
    farms: [[12, 28, 'P'], [13, 28, 'P'], [12, 29, 'P'], [13, 29, 'P']],
    market: [[27, 42, 'B'], [28, 42, 'B'], [29, 42, 'B'], [30, 42, 'B'], [27, 43, 'B'], [28, 43, 'B'], [29, 43, 'B'], [30, 43, 'B']],
    mine: [[46, 28, 'P'], [47, 28, 'P'], [46, 29, 'P'], [47, 29, 'P']],
    harbour: [[44, 56, 'P'], [45, 56, 'P'], [44, 57, 'P'], [45, 57, 'P']],
    city: [[63, 68, 'Q'], [64, 68, 'Q'], [63, 69, 'Q'], [64, 69, 'Q']]
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

  /* ---- the Grey City (the last level): ash-grey ground until the monster falls ---- */
  rect(65, 1, 90, 55, 'T');                      // the dark forest north of the city
  rect(63, 1, 64, 69, 'R'); rect(63, 70, 64, 82, 'W');   // the ridge between the harbour and the city; the gate opens at y 68-69
  rect(65, 56, 90, 57, 'R');                     // city wall
  rect(65, 58, 90, 78, 'A'); rect(65, 79, 90, 82, 'W');
  rect(65, 68, 71, 69, 'Q');                     // the quay runs in through the gate
  rect(72, 62, 85, 74, 'K');                     // the grey plaza
  rect(77, 61, 79, 61, 'K');                     // the palace steps
  rect(71, 68, 72, 69, 'P'); rect(86, 70, 88, 71, 'P');
  scatter([[66, 64], [70, 58], [88, 74], [89, 64], [66, 76], [80, 77], [90, 58], [72, 60]], 'R');

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
    { x: 10, y: 61, w: 4, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 4, door: [12, 63] },
    { x: 84, y: 75, w: 4, h: 2, kind: 'lodge', roof: '#3A3633', label: 'Grey Lodge', region: 5, door: [86, 77] },
    // the Grey City
    { x: 75, y: 58, w: 7, h: 3, kind: 'palace', roof: '#4A4744', label: 'Palace', region: 5 },
    { x: 66, y: 59, w: 4, h: 3, kind: 'house', roof: '#6E6A62', label: 'Grey House', region: 5 },
    { x: 67, y: 72, w: 4, h: 2, kind: 'house', roof: '#5B5652', label: 'Grey House', region: 5 },
    { x: 87, y: 60, w: 3, h: 3, kind: 'house', roof: '#6E6A62', label: 'Scribe', region: 5 },
    { x: 86, y: 66, w: 4, h: 3, kind: 'shop', roof: '#5B5652', label: 'Grey Bakery', region: 5 },
    { x: 73, y: 76, w: 5, h: 2, kind: 'house', roof: '#6E6A62', label: 'Grey House', region: 5 }
  ];

  /* ================= decorations (blocking). id lets tasks/jobs point at them. ================= */
  const decor = [
    // village
    { x: 9, y: 4, kind: 'sign', text: 'VILLAGE' }, { x: 6, y: 12, kind: 'bench' }, { x: 11, y: 13, kind: 'lamp' }, { x: 15, y: 16, kind: 'lamp' },
    { x: 23, y: 26, kind: 'goat', id: 'goat', hideWhen: 'task:goat' }, { x: 17, y: 18, kind: 'brokenfence', id: 'brokenfence', fixWhen: 'task:fence' },
    { x: 25, y: 15, kind: 'bucket', id: 'bucket' }, { x: 10, y: 12, kind: 'pot2' }, { x: 21, y: 7, kind: 'crate' }, { x: 22, y: 13, kind: 'stones', id: 'stones' },
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
    { x: 20, y: 63, kind: 'sign', text: 'BEACH' }, { x: 8, y: 66, kind: 'stones', id: 'stones' }, { x: 45, y: 75, kind: 'rod', id: 'rod' },
    // statue plinths, one per region (see FOG.STATUE.sites)
    { x: 10, y: 16, kind: 'plinth', statue: 0 }, { x: 16, y: 44, kind: 'plinth', statue: 1 }, { x: 49, y: 41, kind: 'plinth', statue: 2 }, { x: 44, y: 16, kind: 'plinth', statue: 3 }, { x: 40, y: 62, kind: 'plinth', statue: 4 },
    // the Grey City
    { x: 78, y: 61, kind: 'throne' }, { x: 66, y: 66, kind: 'sign', text: 'GREY CITY' }, { x: 78, y: 67, kind: 'fountain', dry: true },
    { x: 73, y: 63, kind: 'lamp', dark: true }, { x: 84, y: 63, kind: 'lamp', dark: true }, { x: 73, y: 73, kind: 'lamp', dark: true }, { x: 84, y: 73, kind: 'lamp', dark: true },
    { x: 75, y: 71, kind: 'bench' }, { x: 81, y: 71, kind: 'bench' }, { x: 70, y: 66, kind: 'crate' }
  ];

  const blocked = new Set();
  structures.forEach(s => { for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) blocked.add(x + ',' + y); });
  const decorBlocked = d => !(d.hideWhen && state.flags[d.hideWhen]) && !(d.showWhen && !state.flags[d.showWhen]);
  let state = { flags: {}, unlocked: 1, built: {}, statues: {}, throne: false };
  /* Text drawn on the canvas goes through the translation layer when one is loaded. */
  const tl = s => (window.I18N ? window.I18N.t(s) : s);
  const FONT = () => (window.I18N && window.I18N.canvasFont) || '"Baloo 2", system-ui, sans-serif';

  function regionAt(x, y) {
    for (let i = 0; i < regions.length; i++) { const r = regions[i]; if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return i; }
    return -1;  // borders, river, walls
  }
  function locked(x, y) { const r = regionAt(x, y); return r >= state.unlocked; }

  const WALK = 'GPSLBDKQA';
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

  /* Ground tiles are filled one pixel oversize so no seams show when the camera zooms to a fractional scale. */
  const TSO = TS + 1;
  function drawTile(ctx, c, x, y, px, py, t) {
    const h = hash(x, y);
    if (c === 'A' && state.throne) c = 'G';   // the Grey City turns green once the monster is gone
    switch (c) {
      case 'G': case 'T': case 'F': case 'L': case 'C':
        ctx.fillStyle = (h % 7 === 0) ? '#78BD69' : '#82C773'; ctx.fillRect(px, py, TSO, TSO);
        if (h % 5 === 0) { ctx.fillStyle = '#6FB562'; ctx.fillRect(px + (h % 20), py + ((h >> 3) % 20), 4, 3); }
        break;
      case 'A':
        ctx.fillStyle = (h % 7 === 0) ? '#9C988F' : '#A8A49B'; ctx.fillRect(px, py, TSO, TSO);
        if (h % 5 === 0) { ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + (h % 20), py + ((h >> 3) % 20), 4, 3); }
        break;
      case 'P':
        ctx.fillStyle = '#DCC79A'; ctx.fillRect(px, py, TSO, TSO);
        ctx.fillStyle = '#CDB786'; ctx.fillRect(px + (h % 18), py + ((h >> 4) % 22), 5, 3);
        break;
      case 'S':
        ctx.fillStyle = '#EBD9A8'; ctx.fillRect(px, py, TSO, TSO);
        ctx.fillStyle = '#E2CD95'; ctx.fillRect(px + (h % 22), py + ((h >> 5) % 24), 3, 3);
        break;
      case 'K':
        ctx.fillStyle = '#C9BCA4'; ctx.fillRect(px, py, TSO, TSO);
        ctx.strokeStyle = 'rgba(90,70,50,.18)'; ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, 14, 14); ctx.strokeRect(px + 17, py + 1, 14, 14); ctx.strokeRect(px + 1, py + 17, 14, 14); ctx.strokeRect(px + 17, py + 17, 14, 14);
        break;
      case 'Q':
        ctx.fillStyle = '#A9A39A'; ctx.fillRect(px, py, TSO, TSO);
        ctx.strokeStyle = 'rgba(40,40,40,.2)'; ctx.lineWidth = 1; ctx.strokeRect(px + 1, py + 1, 30, 14); ctx.strokeRect(px + 1, py + 17, 30, 14);
        break;
      case 'W': case 'B':
        ctx.fillStyle = y >= 70 ? '#3F92BF' : '#5FB3D9'; ctx.fillRect(px, py, TSO, TSO);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); const o = (t / 600 + h % 7) % 1; ctx.moveTo(px + 4, py + 8 + o * 16); ctx.quadraticCurveTo(px + 12, py + 4 + o * 16, px + 20, py + 8 + o * 16); ctx.stroke();
        break;
      case 'R':
        ctx.fillStyle = '#8E8A80'; ctx.fillRect(px, py, TSO, TSO);
        ctx.fillStyle = '#6E6A62'; circ(ctx, px + 10 + (h % 8), py + 12 + ((h >> 2) % 8), 8); ctx.fillStyle = '#A5A197'; circ(ctx, px + 22, py + 22, 6);
        break;
      case 'D':
        ctx.fillStyle = '#3F92BF'; ctx.fillRect(px, py, TSO, TSO);
        ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + 2, py, TS - 4, TS); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 4; i++) ctx.fillRect(px + 2, py + i * 8 + 3, TS - 4, 1.5);
        break;
    }
    if (c === 'B') { ctx.fillStyle = '#B08A5A'; ctx.fillRect(px, py + 4, TS, TS - 8); ctx.fillStyle = '#8F6C42'; for (let i = 0; i < 4; i++) ctx.fillRect(px + i * 8 + 2, py + 4, 1.5, TS - 8); ctx.fillRect(px, py + 2, TS, 3); ctx.fillRect(px, py + TS - 5, TS, 3); }
    if (c === 'T') {   // a round tree: shadow, trunk, a two-tone canopy with a lit side, sometimes fruit
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(px + 17, py + 29, 11, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 13, py + 18, 6, 12); ctx.fillStyle = '#5E3A1E'; ctx.fillRect(px + 13, py + 18, 2, 12);
      ctx.fillStyle = '#2F7A44'; circ(ctx, px + 16, py + 13, 12); ctx.fillStyle = '#3F9A56'; circ(ctx, px + 12, py + 11, 8); ctx.fillStyle = '#5BB36A'; circ(ctx, px + 10, py + 8, 4);
      if (h % 3 === 0) { ctx.fillStyle = h % 2 ? '#E4574F' : '#F6B544'; circ(ctx, px + 20 + (h % 5), py + 16, 1.6); circ(ctx, px + 8, py + 17 + (h % 3), 1.6); }
    }
    if (c === 'F') {   // a rail fence: two posts with caps, two rails, a lit edge on each
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(px + 2, py + 26, 28, 3);
      ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 4, py + 9, 4, 17); ctx.fillRect(px + 24, py + 9, 4, 17); ctx.fillRect(px, py + 13, TS, 3); ctx.fillRect(px, py + 21, TS, 3);
      ctx.fillStyle = '#C48E55'; ctx.fillRect(px + 4, py + 9, 1.5, 17); ctx.fillRect(px + 24, py + 9, 1.5, 17); ctx.fillRect(px, py + 13, TS, 1); ctx.fillRect(px, py + 21, TS, 1);
      ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 3, py + 8, 6, 2); ctx.fillRect(px + 23, py + 8, 6, 2);
    }
    if (c === 'L') {   // flowers: a stem, four petals in one of four colours, a yellow heart
      const cols = ['#FF7B6B', '#F6B544', '#F0F0F0', '#C58BF2'];
      for (let i = 0; i < 3; i++) { const fx = px + 7 + i * 9, fy = py + 12 + ((h >> i) % 12); ctx.fillStyle = '#4E9A52'; ctx.fillRect(fx - 0.5, fy, 1.5, 7); ctx.fillStyle = cols[(h + i) % 4]; for (let k = 0; k < 4; k++) circ(ctx, fx + Math.cos(k * Math.PI / 2) * 2.2, fy + Math.sin(k * Math.PI / 2) * 2.2, 1.8); ctx.fillStyle = '#FFE8A3'; circ(ctx, fx, fy, 1.3); }
    }
    if (c === 'C') {   // wheat: stalks that lean in the wind, with a heavy ear on top
      const lean = Math.sin(t / 900 + h % 10) * 1.5;
      for (let i = 0; i < 3; i++) { const sx = px + 5 + i * 10; ctx.strokeStyle = '#B9932F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, py + 28); ctx.quadraticCurveTo(sx + lean, py + 16, sx + lean * 2, py + 8); ctx.stroke(); ctx.fillStyle = '#E2B93B'; ctx.beginPath(); ctx.ellipse(sx + lean * 2, py + 6, 2.5, 5, lean * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#F6D98A'; ctx.fillRect(sx + lean * 2 - 0.5, py + 2, 1, 6); }
    }
  }

  function drawStructure(ctx, s, ox, oy, t) {
    const px = s.x * TS - ox, py = s.y * TS - oy, w = s.w * TS, h = s.h * TS, k = s.kind;
    const grey = s.region === 5 && !state.throne, dark = k === 'lodge' || grey;
    const wall = grey ? (k === 'palace' ? '#B8B3A8' : k === 'lodge' ? '#4A4744' : '#C9C4BA')
      : ({ school: '#F3E3C3', shop: '#FBF1DC', hall: '#EDE2D2', barn: '#C98B5B', mine: '#8E8A80', lodge: '#4A4744', palace: '#F3E3C3' }[k] || '#F6E6CF');
    const roof = grey || s.region !== 5 ? s.roof : (k === 'palace' ? '#6B5BB3' : k === 'lodge' ? s.roof : '#D95A4B');
    ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(ctx, px + 4, py + 18, w - 2, h - 14, 6); ctx.fill();   // the building's shadow falls right and down
    if (k === 'palace') {   // two towers with pointed roofs, pennants and a slit window each
      [px, px + w - 26].forEach(tx => { ctx.fillStyle = wall; ctx.fillRect(tx + 2, py - 14, 24, h + 14); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(tx + 20, py - 14, 6, h + 14); ctx.fillStyle = grey ? '#3A3633' : '#6B5BB3'; ctx.beginPath(); ctx.moveTo(tx - 2, py - 12); ctx.lineTo(tx + 14, py - 38); ctx.lineTo(tx + 30, py - 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = grey ? '#6B6662' : '#F6B544'; ctx.fillRect(tx + 13, py - 50, 2, 13); ctx.fillStyle = grey ? '#8E8A80' : '#E4574F'; ctx.beginPath(); ctx.moveTo(tx + 15, py - 50); ctx.lineTo(tx + 25, py - 46); ctx.lineTo(tx + 15, py - 42); ctx.fill(); ctx.fillStyle = dark ? '#1C1A18' : '#BFEBD6'; rr(ctx, tx + 10, py + 2, 8, 12, 4); ctx.fill(); });
    }
    ctx.fillStyle = wall; ctx.fillRect(px + 2, py + 14, w - 4, h - 14);
    ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(px + w - 8, py + 14, 6, h - 14); ctx.fillRect(px + 2, py + h - 5, w - 4, 5);   // a shaded edge and a plinth line
    if (k === 'barn' || k === 'mine') { ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; for (let i = 1; i < s.w * 2; i++) { ctx.beginPath(); ctx.moveTo(px + 2 + i * 16, py + 14); ctx.lineTo(px + 2 + i * 16, py + h); ctx.stroke(); } }   // plank seams
    else if (!dark) { ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 3; i++) for (let j = 0; j < s.w; j++) ctx.fillRect(px + 6 + j * TS + (i % 2) * 8, py + h - 10 - i * 5, 10, 2); }   // a few bricks low on the wall
    ctx.fillStyle = roof; rr(ctx, px, py, w, 22, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(px, py + 17, w, 5); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(px + 6, py + 2, w - 12, 2);   // eaves shade and a lit ridge
    ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(px + 2, py + 7 + i * 5); ctx.lineTo(px + w - 2, py + 7 + i * 5); ctx.stroke(); }
    if (k !== 'lodge' && k !== 'mine' && !grey) {   // a chimney with a lazy smoke trail
      const cx = px + w - 14; ctx.fillStyle = '#8E8A80'; ctx.fillRect(cx - 4, py - 8, 8, 12); ctx.fillStyle = '#6E6A62'; ctx.fillRect(cx - 5, py - 9, 10, 3);
      for (let i = 0; i < 3; i++) { const f = ((t / 2600 + i / 3 + (s.x % 7) / 7) % 1); ctx.fillStyle = 'rgba(240,240,235,' + (0.55 * (1 - f)) + ')'; circ(ctx, cx + Math.sin(f * 6 + i) * 4, py - 12 - f * 26, 2 + f * 4); }
    }
    if (k === 'mine') {   // a timbered mouth with rails running out and a lamp inside
      ctx.fillStyle = '#2A2420'; rr(ctx, px + w / 2 - 18, py + h - 30, 36, 30, 10); ctx.fill();
      ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w / 2 - 22, py + h - 34, 44, 5); ctx.fillRect(px + w / 2 - 22, py + h - 34, 5, 34); ctx.fillRect(px + w / 2 + 17, py + h - 34, 5, 34);
      ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + w / 2 - 8, py + h - 12, 3, 12); ctx.fillRect(px + w / 2 + 5, py + h - 12, 3, 12); ctx.fillStyle = '#5B4F47'; for (let i = 0; i < 3; i++) ctx.fillRect(px + w / 2 - 10, py + h - 10 + i * 4, 20, 1.5);
      ctx.fillStyle = '#F6B544'; circ(ctx, px + w / 2, py + h - 26, 2.5);
    } else {
      const frame = dark ? '#6B6662' : '#8FB3B0', glass = dark ? '#1C1A18' : '#BFEBD6';
      for (let i = 0; i < s.w; i++) {
        if (i === Math.floor(s.w / 2)) continue;
        const wx = px + i * TS + 9, wy = py + 30;
        ctx.fillStyle = frame; ctx.fillRect(wx - 1, wy - 1, 16, 14); ctx.fillStyle = glass; ctx.fillRect(wx, wy, 14, 12);
        ctx.fillStyle = dark ? 'rgba(160,160,150,.15)' : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(wx, wy + 8); ctx.lineTo(wx + 8, wy); ctx.lineTo(wx + 12, wy); ctx.lineTo(wx, wy + 12); ctx.fill();   // a glint on the glass
        ctx.fillStyle = frame; ctx.fillRect(wx + 6.5, wy, 1, 12); ctx.fillRect(wx, wy + 5.5, 14, 1);
        ctx.fillStyle = dark ? '#3A3633' : '#F4E8CC'; ctx.fillRect(wx - 2, wy + 12, 18, 2.5);
        if (!dark && k === 'house') { ctx.fillStyle = '#E4574F'; ctx.fillRect(wx - 2, wy + 14, 18, 3); ctx.fillStyle = '#63C48F'; for (let f = 0; f < 3; f++) circ(ctx, wx + 2 + f * 5, wy + 13.5, 1.6); }   // a flower box
      }
      const dx = px + Math.floor(s.w / 2) * TS + 8;
      ctx.fillStyle = dark ? '#1C1A18' : '#6E4A23'; rr(ctx, dx - 1, py + h - 21, 18, 21, 4); ctx.fill();
      ctx.fillStyle = dark ? '#1C1A18' : '#8B5A2B'; rr(ctx, dx, py + h - 20, 16, 20, 3); ctx.fill();
      if (!dark) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(dx + 5, py + h - 19, 1, 19); ctx.fillRect(dx + 10, py + h - 19, 1, 19); ctx.fillStyle = '#F6B544'; circ(ctx, dx + 12, py + h - 10, 1.5); }
      ctx.fillStyle = dark ? '#3A3633' : '#C9BCA4'; ctx.fillRect(dx - 3, py + h - 2, 22, 2);
      if (k === 'barn') { ctx.strokeStyle = '#5E3A1E'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dx + 1, py + h - 18); ctx.lineTo(dx + 15, py + h - 2); ctx.moveTo(dx + 15, py + h - 18); ctx.lineTo(dx + 1, py + h - 2); ctx.stroke(); }
    }
    if (k === 'shop') { for (let i = 0; i < s.w * 2; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : roof; ctx.beginPath(); ctx.moveTo(px + i * 16, py + 22); ctx.lineTo(px + i * 16 + 16, py + 22); ctx.lineTo(px + i * 16 + 16, py + 27); ctx.arc(px + i * 16 + 8, py + 27, 8, 0, Math.PI); ctx.fill(); } }   // a scalloped awning
    if (k === 'hall') {
      ctx.fillStyle = roof; ctx.fillRect(px + w / 2 - 2, py - 16, 3, 20); ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(px + w / 2 + 1, py - 16); ctx.lineTo(px + w / 2 + 14 + Math.sin(t / 300) * 2, py - 11); ctx.lineTo(px + w / 2 + 1, py - 6); ctx.fill();
      ctx.fillStyle = '#E7D6B0'; [px + Math.floor(s.w / 2) * TS + 1, px + Math.floor(s.w / 2) * TS + 27].forEach(cx => { ctx.fillRect(cx, py + 24, 4, h - 24); ctx.fillRect(cx - 1, py + 24, 6, 3); });   // columns beside the door
    }
    if (k === 'lodge') {   // a grey banner on a pole, and a dark doorway
      ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + w / 2 - 1, py - 16, 2, 20); ctx.fillStyle = '#5B5652'; ctx.fillRect(px + w / 2 + 1, py - 16, 14, 9); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + w / 2 + 3, py - 13, 10, 3);
      ctx.fillStyle = '#1C1A18'; rr(ctx, px + Math.floor(s.w / 2) * TS + 8, py + h - 20, 16, 20, 3); ctx.fill();
    }
    const lbl = tl(s.label);
    ctx.font = 'bold 11px ' + FONT(); ctx.textAlign = 'center';
    const tw = Math.max(56, ctx.measureText(lbl).width + 14);
    ctx.fillStyle = k === 'lodge' ? 'rgba(60,56,52,.9)' : 'rgba(255,255,255,.85)'; rr(ctx, px + w / 2 - tw / 2, py + 4, tw, 14, 7); ctx.fill();
    ctx.fillStyle = k === 'lodge' ? '#F4E8CC' : '#2A2420'; ctx.fillText(lbl, px + w / 2, py + 15);
  }

  /* Built missions are drawn as their own landmark. Sites under construction show stakes, rope, waiting
     materials and scaffolding that climbs with the progress bar. */
  function drawMission(ctx, m, ox, oy, ms, t) {
    const px = m.site.x * TS - ox, py = m.site.y * TS - oy, w = m.site.w * TS, h = m.site.h * TS, cx = px + w / 2;
    const st = ms && ms.status;
    if (st === 'built') { drawBuilt(ctx, m.kind, px, py, w, h, t); return; }
    const p = st === 'building' ? Math.min(1, (Date.now() - ms.startedAt) / (m.buildSec * 1000)) : 0;
    ctx.fillStyle = 'rgba(120,90,50,.18)'; rr(ctx, px + 4, py + 4, w - 8, h - 8, 8); ctx.fill();   // trodden earth
    ctx.strokeStyle = '#F6B544'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(px + 6, py + 6, w - 12, h - 12); ctx.setLineDash([]);
    [[px + 6, py + 6], [px + w - 6, py + 6], [px + 6, py + h - 6], [px + w - 6, py + h - 6]].forEach(([x, y]) => { ctx.fillStyle = '#7A4F2A'; ctx.fillRect(x - 2, y - 10, 4, 14); ctx.fillStyle = '#E4574F'; ctx.fillRect(x - 3, y - 10, 6, 3); });
    // materials waiting in the corners: stone blocks, a stack of planks, a sand heap, the plan on a board
    [[0, 0], [9, 0], [4.5, -7]].forEach(([dx, dy]) => { ctx.fillStyle = '#A9A39A'; ctx.fillRect(px + 10 + dx, py + h - 22 + dy, 8, 7); ctx.fillStyle = '#C9C4BA'; ctx.fillRect(px + 10 + dx, py + h - 22 + dy, 8, 2); });
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + w - 32, py + h - 14 - i * 4, 24, 3); ctx.fillStyle = '#8B6A3E'; ctx.fillRect(px + w - 32, py + h - 12 - i * 4, 24, 1); }
    ctx.fillStyle = '#E2CD95'; ctx.beginPath(); ctx.moveTo(px + w - 30, py + 22); ctx.quadraticCurveTo(px + w - 20, py + 8, px + w - 10, py + 22); ctx.fill();
    ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 12, py + 10, 2, 12); ctx.fillStyle = '#F4E8CC'; ctx.fillRect(px + 8, py + 8, 12, 9); ctx.strokeStyle = '#2F80ED'; ctx.lineWidth = 1; ctx.strokeRect(px + 10, py + 10, 8, 5);
    if (st === 'building') {
      const sh = Math.max(6, (h - 20) * p);   // scaffolding and the wall inside it rise with progress
      ctx.fillStyle = 'rgba(169,163,154,.9)'; ctx.fillRect(px + 14, py + h - 8 - sh * 0.8, w - 28, sh * 0.8);
      ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 1; for (let y = py + h - 8; y > py + h - 8 - sh * 0.8; y -= 5) { ctx.beginPath(); ctx.moveTo(px + 14, y); ctx.lineTo(px + w - 14, y); ctx.stroke(); }
      ctx.fillStyle = '#A2703F'; [px + 10, px + w - 13].forEach(x => ctx.fillRect(x, py + h - 8 - sh, 3, sh)); for (let y = py + h - 14; y > py + h - 8 - sh; y -= 12) ctx.fillRect(px + 10, y, w - 20, 2.5);
      const bob = Math.abs(Math.sin(t / 120)) * 6;
      ctx.fillStyle = '#5B4F47'; ctx.fillRect(px + 14, py + 14 - bob, 3, 12); ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + 10, py + 10 - bob, 11, 6);
      for (let i = 0; i < 4; i++) { const f = ((t / 900 + i / 4) % 1); ctx.fillStyle = 'rgba(230,220,200,' + (0.5 * (1 - f)) + ')'; circ(ctx, cx + (jit(i, 30) - 0.5) * w * 0.6, py + h - 10 - f * 18, 2 + f * 3); }
      ctx.fillStyle = '#2A2420'; rr(ctx, px + 6, py - 12, w - 12, 8, 4); ctx.fill(); ctx.fillStyle = '#63C48F'; rr(ctx, px + 6, py - 12, Math.max(8, (w - 12) * p), 8, 4); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, cx - 34, py + h / 2 - 10, 68, 20, 6); ctx.fill();
    ctx.fillStyle = '#2A2420'; ctx.font = 'bold 10px ' + FONT(); ctx.textAlign = 'center';
    ctx.fillText(st === 'building' ? tl('BUILDING…') : tl(m.kind.toUpperCase() + ' SITE'), cx, py + h / 2 + 4);
  }
  /* A pennant rippling in the wind, drawn as short slices. */
  function flag(ctx, x, y, t, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) { const f = i / 8, wave = Math.sin(t / 150 - i * 0.7) * 1.5 * f; ctx.fillRect(x + i * 2.2, y + wave + f * 2, 2.6, 7 * (1 - f) + 1); }
  }
  function drawBuilt(ctx, kind, px, py, w, h, t) {
    const cx = px + w / 2, cols = w / TS;
    switch (kind) {
      case 'well': {
        const wy = py + h - 20;
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(cx + 2, wy + 4, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C9BCA4'; ctx.beginPath(); ctx.ellipse(cx, wy + 2, 30, 14, 0, 0, Math.PI * 2); ctx.fill();   // flagstones
        ctx.fillStyle = '#8E8A80'; circ(ctx, cx, wy, 22); ctx.fillStyle = '#A9A39A'; circ(ctx, cx, wy - 2, 22);
        ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 15, wy - 2 + Math.sin(a) * 15); ctx.lineTo(cx + Math.cos(a) * 22, wy - 2 + Math.sin(a) * 22); ctx.stroke(); }
        ctx.fillStyle = '#2F6E7E'; circ(ctx, cx, wy - 2, 14); ctx.fillStyle = '#5FB3D9'; circ(ctx, cx, wy - 2, 12);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; for (let i = 0; i < 2; i++) { const o = ((t / 900 + i / 2) % 1); ctx.beginPath(); ctx.arc(cx, wy - 2, 3 + o * 9, 0.2, 1.4); ctx.stroke(); }   // the water shimmers
        ctx.fillStyle = '#63C48F'; circ(ctx, cx - 18, wy + 6, 3); circ(ctx, cx + 20, wy - 8, 2.5);
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(cx - 22, py + 10, 4, 30); ctx.fillRect(cx + 18, py + 10, 4, 30); ctx.fillStyle = '#5E3A1E'; ctx.fillRect(cx - 22, py + 10, 1.5, 30); ctx.fillRect(cx + 18, py + 10, 1.5, 30);
        ctx.fillStyle = '#A2703F'; ctx.fillRect(cx - 24, py + 20, 48, 3);
        ctx.fillStyle = '#B3463A'; ctx.beginPath(); ctx.moveTo(cx - 30, py + 18); ctx.lineTo(cx, py); ctx.lineTo(cx + 30, py + 18); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#D95A4B'; ctx.beginPath(); ctx.moveTo(cx - 30, py + 18); ctx.lineTo(cx, py); ctx.lineTo(cx + 6, py + 4); ctx.lineTo(cx - 24, py + 18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 30 + i * 7, py + 18 - i * 4.2); ctx.lineTo(cx + 30 - i * 7, py + 18 - i * 4.2); ctx.stroke(); }
        const drop = 8 + Math.sin(t / 1300) * 6;   // the bucket rides up and down on its rope
        ctx.fillStyle = '#5E3A1E'; ctx.fillRect(cx - 1, py + 20, 2, drop); ctx.fillStyle = '#8E8A80'; ctx.beginPath(); ctx.moveTo(cx - 5, py + 20 + drop); ctx.lineTo(cx + 5, py + 20 + drop); ctx.lineTo(cx + 4, py + 28 + drop); ctx.lineTo(cx - 4, py + 28 + drop); ctx.fill();
        ctx.fillStyle = '#5B4F47'; ctx.fillRect(cx + 22, py + 18, 6, 2); ctx.fillRect(cx + 26, py + 14, 2, 6);
        break; }
      case 'school': {
        ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(ctx, px + 5, py + 24, w - 4, h - 20, 6); ctx.fill();
        ctx.fillStyle = '#F3E3C3'; ctx.fillRect(px + 2, py + 20, w - 4, h - 20); ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(px + w - 8, py + 20, 6, h - 20); ctx.fillStyle = '#E7D6B0'; ctx.fillRect(px + 2, py + h - 6, w - 4, 6);
        ctx.fillStyle = '#2F6E7E'; rr(ctx, px, py + 4, w, 24, 6); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(px, py + 23, w, 5); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(px + 6, py + 6, w - 12, 2);
        ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(px + 2, py + 12 + i * 5); ctx.lineTo(px + w - 2, py + 12 + i * 5); ctx.stroke(); }
        for (let r = 0; r < 2; r++) for (let i = 0; i < cols; i++) {
          if (r === 1 && i === Math.floor(cols / 2)) continue;
          const wx = px + i * TS + 9, wy = py + 40 + r * 30;
          ctx.fillStyle = '#8FB3B0'; ctx.fillRect(wx - 1, wy - 1, 16, 16); ctx.fillStyle = '#BFEBD6'; ctx.fillRect(wx, wy, 14, 14);
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(wx, wy + 9); ctx.lineTo(wx + 9, wy); ctx.lineTo(wx + 13, wy); ctx.lineTo(wx, wy + 13); ctx.fill();
          ctx.fillStyle = '#8FB3B0'; ctx.fillRect(wx + 6.5, wy, 1, 14); ctx.fillRect(wx, wy + 6.5, 14, 1); ctx.fillStyle = '#F4E8CC'; ctx.fillRect(wx - 2, wy + 14, 18, 2.5);
        }
        ctx.fillStyle = '#6E4A23'; rr(ctx, cx - 11, py + h - 27, 22, 27, 4); ctx.fill(); ctx.fillStyle = '#8B5A2B'; rr(ctx, cx - 10, py + h - 26, 20, 26, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(cx - 0.5, py + h - 25, 1, 25); ctx.fillStyle = '#F6B544'; circ(ctx, cx - 3, py + h - 13, 1.5); circ(ctx, cx + 3, py + h - 13, 1.5);
        ctx.fillStyle = '#C9BCA4'; ctx.fillRect(cx - 16, py + h - 2, 32, 2); ctx.fillRect(cx - 14, py + h - 4, 28, 2);
        ctx.fillStyle = '#F3E3C3'; ctx.fillRect(cx - 8, py - 12, 16, 18); ctx.fillStyle = '#2F6E7E'; ctx.beginPath(); ctx.moveTo(cx - 11, py - 12); ctx.lineTo(cx, py - 22); ctx.lineTo(cx + 11, py - 12); ctx.fill();   // the bell tower
        ctx.save(); ctx.translate(cx, py - 10); ctx.rotate(Math.sin(t / 400) * 0.35); ctx.fillStyle = '#D98F1F'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-5, 8, -6, 9); ctx.lineTo(6, 9); ctx.quadraticCurveTo(5, 8, 4, 0); ctx.fill(); ctx.fillStyle = '#2A2420'; circ(ctx, 0, 10, 1.5); ctx.restore();
        ctx.fillStyle = '#2A2420'; circ(ctx, cx, py + 16, 8); ctx.fillStyle = '#F4E8CC'; circ(ctx, cx, py + 16, 6); ctx.fillStyle = '#2A2420'; ctx.fillRect(cx - 0.5, py + 11, 1, 5); ctx.fillRect(cx, py + 16, 4, 1);
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w - 12, py - 20, 3, 36); flag(ctx, px + w - 9, py - 20, t, '#F6B544');
        label(ctx, 'Engineering School', cx, py + h - 6);
        break; }
      case 'mill': {
        ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(ctx, px + 18, py + 28, w - 16, h - 24, 6); ctx.fill();
        ctx.fillStyle = '#A9A39A'; ctx.fillRect(px + 14, py + h - 30, w - 16, 30); ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ctx.fillRect(px + 16 + j * 14 + (i % 2) * 7, py + h - 27 + i * 7, 12, 5);   // stone base
        ctx.fillStyle = '#C98B5B'; ctx.fillRect(px + 14, py + 24, w - 16, h - 54); ctx.fillStyle = '#8B5A2B'; ctx.fillRect(px + 14, py + 24, 3, h - 54); ctx.fillRect(px + w - 5, py + 24, 3, h - 54); ctx.fillRect(px + 14, py + 24 + (h - 54) / 2, w - 16, 2);   // timber frame
        ctx.fillStyle = '#7A4F2A'; rr(ctx, px + 12, py + 8, w - 12, 22, 5); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(px + 12, py + 25, w - 12, 5); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(px + 18, py + 10, w - 24, 2);
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(px + 14, py + 15 + i * 5); ctx.lineTo(px + w - 2, py + 15 + i * 5); ctx.stroke(); }
        ctx.fillStyle = '#8FB3B0'; ctx.fillRect(cx + 5, py + 35, 14, 12); ctx.fillStyle = '#BFEBD6'; ctx.fillRect(cx + 6, py + 36, 12, 10); ctx.fillStyle = '#8FB3B0'; ctx.fillRect(cx + 11.5, py + 36, 1, 10);
        ctx.fillStyle = '#6E4A23'; rr(ctx, cx + 5, py + h - 23, 16, 23, 3); ctx.fill(); ctx.fillStyle = '#8B5A2B'; rr(ctx, cx + 6, py + h - 22, 14, 22, 3); ctx.fill();
        ctx.fillStyle = '#C98B5B'; rr(ctx, px + w - 14, py + h - 12, 10, 12, 4); ctx.fill(); rr(ctx, px + w - 22, py + h - 9, 9, 9, 3); ctx.fill(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + w - 12, py + h - 13, 6, 2);   // flour sacks
        const wx = px + 10, wy = py + h - 30, a = t / 900;   // the wheel turns in its race and throws water
        ctx.fillStyle = '#5FB3D9'; ctx.fillRect(px - 6, wy + 18, 30, 10); ctx.fillStyle = '#3F92BF'; ctx.fillRect(px - 6, wy + 22, 30, 6);
        ctx.save(); ctx.translate(wx, wy); ctx.rotate(a);
        ctx.strokeStyle = '#5E3A1E'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#A2703F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4; ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 26, Math.sin(ang) * 26); ctx.stroke(); ctx.fillStyle = '#A2703F'; ctx.save(); ctx.rotate(ang); ctx.fillRect(22, -6, 6, 12); ctx.restore(); }
        ctx.fillStyle = '#5B4F47'; circ(ctx, 0, 0, 5); ctx.fillStyle = '#8E8A80'; circ(ctx, 0, 0, 2); ctx.restore();
        for (let i = 0; i < 7; i++) { const f = ((t / 700 + jit(i, 31)) % 1); ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * (1 - f)) + ')'; circ(ctx, wx - 20 + jit(i, 32) * 28 - f * 8, wy + 22 - Math.sin(f * Math.PI) * 14 + f * 6, 1.5 + (1 - f)); }
        label(ctx, 'Mill', cx + 8, py + 4);
        break; }
      case 'lighthouse': {
        ctx.fillStyle = '#8E8A80'; [[px + 4, py + h - 6, 12, 6], [px + w - 16, py + h - 8, 14, 7], [px + w - 8, py + h - 4, 10, 4]].forEach(([x, y, rw, rh]) => { ctx.beginPath(); ctx.ellipse(x + rw / 2, y + rh / 2, rw, rh, 0, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(px + 14, py + 10); ctx.lineTo(px + w - 14, py + 10); ctx.lineTo(px + w - 8, py + h); ctx.lineTo(px + 8, py + h); ctx.closePath(); ctx.fill();   // a tapered tower
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.moveTo(px + w - 22, py + 10); ctx.lineTo(px + w - 14, py + 10); ctx.lineTo(px + w - 8, py + h); ctx.lineTo(px + w - 18, py + h); ctx.fill();
        ctx.fillStyle = '#E4574F'; [[30, 14], [62, 14]].forEach(([oy, bh]) => { const k0 = (oy - 10) / (h - 10), k1 = (oy + bh - 10) / (h - 10); ctx.beginPath(); ctx.moveTo(px + 14 - 6 * k0, py + oy); ctx.lineTo(px + w - 14 + 6 * k0, py + oy); ctx.lineTo(px + w - 14 + 6 * k1, py + oy + bh); ctx.lineTo(px + 14 - 6 * k1, py + oy + bh); ctx.fill(); });
        ctx.fillStyle = '#2A2420'; ctx.fillRect(cx - 4, py + 46, 8, 10); ctx.fillStyle = '#BFEBD6'; ctx.fillRect(cx - 3, py + 47, 6, 6);
        ctx.fillStyle = '#6E4A23'; rr(ctx, cx - 6, py + h - 16, 12, 16, 3); ctx.fill();
        ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 6, py + 6, w - 12, 4); for (let i = 0; i < 5; i++) ctx.fillRect(px + 8 + i * (w - 18) / 4, py, 1.5, 7);   // the gallery rail
        ctx.fillStyle = '#5B4F47'; ctx.fillRect(px + 12, py - 4, w - 24, 12); ctx.fillStyle = '#FFE8A3'; ctx.fillRect(px + 14, py - 2, w - 28, 8); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(cx - 0.5, py - 2, 1, 8);
        ctx.fillStyle = '#2A2420'; rr(ctx, px + 8, py - 12, w - 16, 9, 4); ctx.fill(); ctx.fillStyle = '#F6B544'; circ(ctx, cx, py - 13, 2);
        const ang = t / 1400;   // the beam sweeps round: two cones, brighter when they face the front
        ctx.save(); ctx.translate(cx, py + 2);
        [0, Math.PI].forEach(o => { const a2 = ang + o, front = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(a2)); const g = ctx.createLinearGradient(0, 0, Math.cos(a2) * 110, Math.sin(a2) * 40); g.addColorStop(0, 'rgba(255,232,163,' + front + ')'); g.addColorStop(1, 'rgba(255,232,163,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a2 - 0.16) * 110, Math.sin(a2 - 0.16) * 40); ctx.lineTo(Math.cos(a2 + 0.16) * 110, Math.sin(a2 + 0.16) * 40); ctx.closePath(); ctx.fill(); });
        ctx.restore();
        const glow = ctx.createRadialGradient(cx, py + 2, 2, cx, py + 2, 40); glow.addColorStop(0, 'rgba(255,232,163,.6)'); glow.addColorStop(1, 'rgba(255,232,163,0)'); ctx.fillStyle = glow; circ(ctx, cx, py + 2, 40);
        for (let i = 0; i < 2; i++) { const f = ((t / 6000 + i / 2) % 1), gx = px - 40 + f * (w + 80), gy = py - 30 + Math.sin(f * 9 + i) * 6; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx - 5, gy); ctx.quadraticCurveTo(gx - 2.5, gy - 3, gx, gy); ctx.quadraticCurveTo(gx + 2.5, gy - 3, gx + 5, gy); ctx.stroke(); }   // gulls
        break; }
      case 'bridge': break;   // the bridge is tiles, nothing more to draw
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
    const px = d.x * TS - ox, py = d.y * TS - oy, h = hash(d.x, d.y);
    const shadow = (w, dy) => { ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.beginPath(); ctx.ellipse(px + 16, py + (dy || 29), w || 12, 3.5, 0, 0, Math.PI * 2); ctx.fill(); };
    switch (d.kind) {
      case 'sign':
        shadow(6, 31); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 14, py + 12, 4, 18); ctx.fillStyle = '#5E3A1E'; ctx.fillRect(px + 14, py + 12, 1.5, 18);
        ctx.fillStyle = '#F4E8CC'; rr(ctx, px + 2, py + 4, 28, 12, 3); ctx.fill(); ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 1; rr(ctx, px + 2.5, py + 4.5, 27, 11, 3); ctx.stroke();
        ctx.fillStyle = '#2A2420'; ctx.font = 'bold 7px ' + FONT(); ctx.textAlign = 'center'; ctx.fillText(tl(d.text || ''), px + 16, py + 13); break;
      case 'bench':
        shadow(14, 30); ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 2, py + 14, 28, 6); ctx.fillRect(px + 2, py + 6, 28, 5); ctx.fillRect(px + 4, py + 20, 3, 8); ctx.fillRect(px + 25, py + 20, 3, 8);
        ctx.fillStyle = '#C48E55'; ctx.fillRect(px + 2, py + 14, 28, 1.5); ctx.fillRect(px + 2, py + 6, 28, 1.5); ctx.fillStyle = '#5E3A1E'; ctx.fillRect(px + 2, py + 11, 28, 1); ctx.fillRect(px + 4, py + 26, 3, 2); ctx.fillRect(px + 25, py + 26, 3, 2); break;
      case 'lamp': {
        const lit = !d.dark || fixed, fl = 0.85 + 0.15 * Math.sin(t / 90 + h) * Math.sin(t / 37);
        shadow(6, 31); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 14, py + 8, 4, 22); ctx.fillRect(px + 10, py + 28, 12, 3); ctx.fillRect(px + 12, py + 26, 8, 2); ctx.fillStyle = '#3D3632'; ctx.fillRect(px + 15.5, py + 8, 1, 22);
        ctx.fillStyle = '#2A2420'; ctx.beginPath(); ctx.moveTo(px + 8, py + 3); ctx.lineTo(px + 16, py - 2); ctx.lineTo(px + 24, py + 3); ctx.fill(); rr(ctx, px + 9, py + 1, 14, 12, 3); ctx.fill();
        ctx.fillStyle = lit ? 'rgba(255,220,120,' + fl + ')' : '#5B4F47'; rr(ctx, px + 11, py + 3, 10, 8, 2); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 15.5, py + 3, 1, 8);
        if (lit) { ctx.fillStyle = '#FFF6D0'; circ(ctx, px + 16, py + 7, 1.5); const g = ctx.createRadialGradient(px + 16, py + 7, 2, px + 16, py + 7, 24); g.addColorStop(0, 'rgba(246,181,68,' + (0.35 * fl) + ')'); g.addColorStop(1, 'rgba(246,181,68,0)'); ctx.fillStyle = g; circ(ctx, px + 16, py + 7, 24); }
        break; }
      case 'goat': {   // it chews, flicks its tail, and now and then bends down to nibble the grass
        const chew = Math.abs(Math.sin(t / 220 + h)) * 1.5, tail = Math.sin(t / 160 + h) * 3, ear = Math.sin(t / 700 + h) > 0.9 ? 2 : 0, eat = Math.sin(t / 2600 + h) > 0.3 ? 5 : 0;
        shadow(12, 30); ctx.fillStyle = '#5B4F47'; ctx.fillRect(px + 8, py + 23, 3, 7); ctx.fillRect(px + 20, py + 23, 3, 7); ctx.fillStyle = '#6E6259'; ctx.fillRect(px + 12, py + 23, 3, 7); ctx.fillRect(px + 16, py + 23, 3, 7);
        ctx.fillStyle = '#F4E8CC'; rr(ctx, px + 6, py + 12, 20, 12, 5); ctx.fill(); ctx.fillStyle = '#FFF6E0'; rr(ctx, px + 8, py + 13, 12, 4, 2); ctx.fill();
        ctx.fillStyle = '#F4E8CC'; ctx.fillRect(px + 4, py + 14 - tail * 0.3, 4, 3);
        circ(ctx, px + 25, py + 11 + eat, 6); ctx.beginPath(); ctx.ellipse(px + 29, py + 14 + eat + chew * 0.4, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E8D6B8'; ctx.beginPath(); ctx.ellipse(px + 21 - ear, py + 9 + eat, 3.5, 1.8, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + 27, py + 3 + eat, 2, 5); ctx.fillRect(px + 22, py + 3 + eat, 2, 5);
        ctx.fillStyle = '#E4574F'; ctx.fillRect(px + 20, py + 16 + eat, 5, 2); ctx.fillStyle = '#F6B544'; circ(ctx, px + 22, py + 19 + eat, 1.5);
        ctx.fillStyle = '#FFF'; circ(ctx, px + 27, py + 10 + eat, 1.8); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 26, py + 9.5 + eat, 2.4, 1);
        if (eat) { ctx.fillStyle = '#3F9A56'; circ(ctx, px + 31, py + 26, 2.5); circ(ctx, px + 28, py + 28, 2); }
        break; }
      case 'brokenfence':
        ctx.fillStyle = '#A2703F'; ctx.fillRect(px + 4, py + 10, 4, 16); ctx.fillRect(px + 24, py + 10, 4, 16); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 3, py + 9, 6, 2); ctx.fillRect(px + 23, py + 9, 6, 2);
        ctx.fillStyle = '#A2703F';
        if (fixed) { ctx.fillRect(px, py + 13, TS, 3); ctx.fillRect(px, py + 21, TS, 3); ctx.fillStyle = '#C48E55'; ctx.fillRect(px, py + 13, TS, 1); ctx.fillRect(px, py + 21, TS, 1); }
        else { ctx.save(); ctx.translate(px + 16, py + 20); ctx.rotate(0.5 + Math.sin(t / 900) * 0.03); ctx.fillRect(-14, -2, 20, 3); ctx.restore(); ctx.fillRect(px + 20, py + 21, 8, 3); ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + 10, py + 27, 2, 3); ctx.fillRect(px + 14, py + 28, 2, 3); }
        break;
      case 'bucket':
        shadow(10, 30); [px + 4, px + 16].forEach((bx, i) => { ctx.fillStyle = i ? '#8E8A80' : '#7E7A72'; ctx.beginPath(); ctx.moveTo(bx + 1, py + 13 + i * 2); ctx.lineTo(bx + 13, py + 13 + i * 2); ctx.lineTo(bx + 11, py + 28); ctx.lineTo(bx + 3, py + 28); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#B5B0A6'; ctx.fillRect(bx + 1, py + 15 + i * 2, 12, 1); ctx.fillRect(bx + 2.5, py + 24, 9, 1); ctx.strokeStyle = '#5B4F47'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx + 7, py + 13 + i * 2, 6, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#5FB3D9'; ctx.beginPath(); ctx.ellipse(bx + 7, py + 14 + i * 2, 5, 1.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(bx + 4, py + 13.5 + i * 2, 3, 1); });
        break;
      case 'pot2':
        shadow(8, 29); ctx.fillStyle = '#C0623F'; ctx.beginPath(); ctx.moveTo(px + 8, py + 16); ctx.lineTo(px + 24, py + 16); ctx.lineTo(px + 22, py + 28); ctx.lineTo(px + 10, py + 28); ctx.fill(); ctx.fillStyle = '#D97A54'; ctx.fillRect(px + 7, py + 14, 18, 3);
        ctx.fillStyle = '#63C48F'; circ(ctx, px + 12, py + 11, 4); circ(ctx, px + 20, py + 11, 4); circ(ctx, px + 16, py + 8, 4.5); ctx.fillStyle = '#FF7B6B'; circ(ctx, px + 16, py + 6 + Math.sin(t / 800) * 0.5, 3); circ(ctx, px + 11, py + 9, 2); circ(ctx, px + 21, py + 9, 2); ctx.fillStyle = '#F6B544'; circ(ctx, px + 16, py + 6 + Math.sin(t / 800) * 0.5, 1.2); break;
      case 'crate':
        shadow(12, 29); ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + 6, py + 10, 20, 18); ctx.fillStyle = '#C9A272'; ctx.fillRect(px + 6, py + 10, 20, 2); ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 2; ctx.strokeRect(px + 6, py + 10, 20, 18); ctx.beginPath(); ctx.moveTo(px + 6, py + 10); ctx.lineTo(px + 26, py + 28); ctx.moveTo(px + 26, py + 10); ctx.lineTo(px + 6, py + 28); ctx.stroke(); ctx.fillStyle = '#5B4F47'; [[8, 12], [22, 12], [8, 24], [22, 24]].forEach(([x, y]) => circ(ctx, px + x, py + y, 1)); break;
      case 'apples':
        shadow(11, 30); ctx.fillStyle = '#B08A5A'; ctx.beginPath(); ctx.moveTo(px + 5, py + 16); ctx.lineTo(px + 27, py + 16); ctx.lineTo(px + 24, py + 29); ctx.lineTo(px + 8, py + 29); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#8B6A3E'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(px + 6, py + 19 + i * 4); ctx.lineTo(px + 26, py + 19 + i * 4); ctx.stroke(); } ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 16, py + 16, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        [[11, 14], [20, 13], [15, 10], [24, 15]].forEach(([x, y]) => { ctx.fillStyle = '#E4574F'; circ(ctx, px + x, py + y, 4); ctx.fillStyle = '#FFB3A8'; circ(ctx, px + x - 1.3, py + y - 1.3, 1.2); ctx.fillStyle = '#5E3A1E'; ctx.fillRect(px + x - 0.5, py + y - 5, 1, 2); }); break;
      case 'scarecrow': {
        if (fixed) {   // standing, swaying a little, straw at the cuffs
          shadow(6, 31); ctx.save(); ctx.translate(px + 16, py + 30); ctx.rotate(Math.sin(t / 1100 + h) * 0.04);
          ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-1.5, -26, 3, 26); ctx.fillRect(-12, -19, 24, 3);
          ctx.fillStyle = '#2F80ED'; ctx.fillRect(-8, -20, 16, 11); ctx.fillStyle = '#E2B93B'; ctx.fillRect(-13, -19, 4, 3); ctx.fillRect(9, -19, 4, 3); ctx.fillRect(-6, -9, 12, 3);
          ctx.fillStyle = '#E4574F'; ctx.fillRect(-3, -14, 6, 1.5); ctx.fillStyle = '#E2B93B'; circ(ctx, 0, -25, 5.5); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-7, -29, 14, 2); rr(ctx, -4, -35, 8, 7, 2); ctx.fill();
          ctx.fillStyle = '#2A2420'; circ(ctx, -2, -26, 0.9); circ(ctx, 2, -26, 0.9); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -24, 2, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore();
        } else {   // face down in the mud with a crow perched on him
          ctx.fillStyle = '#7A4F2A'; ctx.save(); ctx.translate(px + 16, py + 20); ctx.rotate(1.3); ctx.fillRect(-1.5, -14, 3, 22); ctx.fillRect(-10, -6, 20, 3); ctx.restore();
          ctx.fillStyle = '#E2B93B'; circ(ctx, px + 8, py + 26, 5); ctx.fillStyle = '#2F80ED'; ctx.fillRect(px + 19, py + 22, 10, 6); ctx.fillStyle = '#7A4F2A'; rr(ctx, px + 2, py + 12, 8, 4, 1); ctx.fill();
          const hop = ((t / 600 + h) % 1) < 0.2 ? 2 : 0; ctx.fillStyle = '#2A2420'; ctx.beginPath(); ctx.ellipse(px + 24, py + 10 - hop, 4, 2.8, 0, 0, Math.PI * 2); ctx.fill(); circ(ctx, px + 27.5, py + 8 - hop, 2); ctx.fillStyle = '#F6B544'; ctx.fillRect(px + 29, py + 7.5 - hop, 2.5, 1);
        }
        break; }
      case 'logs':
        shadow(13, 30); [[8, 24], [20, 24], [14, 15]].forEach(([x, y]) => { ctx.fillStyle = '#A2703F'; ctx.fillRect(px + x - 8, py + y - 5, 16, 10); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + x - 8, py + y - 5, 16, 1.5); ctx.fillStyle = '#E2CD95'; circ(ctx, px + x + 8, py + y, 5); ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px + x + 8, py + y, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#B08A5A'; circ(ctx, px + x + 8, py + y, 1); }); break;
      case 'tripod':
        shadow(10, 31); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 16, py + 10); ctx.lineTo(px + 6, py + 30); ctx.moveTo(px + 16, py + 10); ctx.lineTo(px + 26, py + 30); ctx.moveTo(px + 16, py + 10); ctx.lineTo(px + 16, py + 30); ctx.stroke(); ctx.strokeStyle = '#8E8A80'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + 10, py + 22); ctx.lineTo(px + 22, py + 22); ctx.stroke();
        ctx.fillStyle = '#F6B544'; rr(ctx, px + 9, py + 3, 14, 9, 2); ctx.fill(); ctx.fillStyle = '#2A2420'; circ(ctx, px + 23, py + 7.5, 2.5); ctx.fillStyle = '#5FB3D9'; circ(ctx, px + 23, py + 7.5, 1.4); break;
      case 'boat': {   // it bobs and rolls on the swell; the sail flaps
        const bob = Math.sin(t / 700 + h) * 1.5, tilt = Math.sin(t / 700 + h + 1) * 0.04;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 27, 15 + Math.sin(t / 500 + h), 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(px + 16, py + 20 + bob); ctx.rotate(tilt);
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-1, -18, 2, 14); const flap = Math.sin(t / 300 + h) * 1.2;
        ctx.fillStyle = '#F4E8CC'; ctx.beginPath(); ctx.moveTo(1, -18); ctx.quadraticCurveTo(10 + flap, -12, 12, -4); ctx.lineTo(1, -4); ctx.fill(); ctx.fillStyle = '#E4574F'; ctx.fillRect(1, -11, 7, 1.5);
        ctx.fillStyle = '#A2703F'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(14, -4); ctx.quadraticCurveTo(12, 6, 8, 6); ctx.lineTo(-8, 6); ctx.quadraticCurveTo(-13, 6, -14, -4); ctx.fill(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-14, -4, 28, 2); ctx.fillStyle = '#C48E55'; ctx.fillRect(-11, 0, 22, 1);
        ctx.restore(); break; }
      case 'stall': {
        const c = d.color || '#E4574F';
        shadow(14, 30); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 2, py + 8, 2, 20); ctx.fillRect(px + 28, py + 8, 2, 20);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#F4E8CC' : c; ctx.beginPath(); ctx.moveTo(px + i * 8, py + 2); ctx.lineTo(px + i * 8 + 8, py + 2); ctx.lineTo(px + i * 8 + 8, py + 8); ctx.arc(px + i * 8 + 4, py + 8, 4, 0, Math.PI); ctx.fill(); }
        ctx.fillStyle = '#B08A5A'; ctx.fillRect(px + 2, py + 16, 28, 12); ctx.fillStyle = '#8B6A3E'; ctx.fillRect(px + 2, py + 16, 28, 2); ctx.fillStyle = '#F4E8CC'; ctx.fillRect(px + 4, py + 20, 24, 6);
        ctx.fillStyle = '#F6B544'; circ(ctx, px + 9, py + 15, 3); circ(ctx, px + 13, py + 14, 2.5); ctx.fillStyle = '#63C48F'; circ(ctx, px + 18, py + 14.5, 3); ctx.fillStyle = '#E4574F'; circ(ctx, px + 24, py + 15, 3); circ(ctx, px + 21, py + 13, 2);
        ctx.fillStyle = '#FFF'; rr(ctx, px + 20, py + 20 + Math.sin(t / 700 + h) * 0.5, 7, 5, 1); ctx.fill(); break; }
      case 'fountain': {   // two tiers; the jets arc down and ripples spread in the bowl
        const dry = d.dry && !state.throne;
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(px + 17, py + 24, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#A9A39A'; ctx.beginPath(); ctx.ellipse(px + 16, py + 22, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#C9C4BA'; ctx.beginPath(); ctx.ellipse(px + 16, py + 20, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = dry ? '#6E6A62' : '#5FB3D9'; ctx.beginPath(); ctx.ellipse(px + 16, py + 20, 12, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C9C4BA'; ctx.fillRect(px + 14, py + 4, 4, 16); ctx.beginPath(); ctx.ellipse(px + 16, py + 8, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = dry ? '#6E6A62' : '#5FB3D9'; ctx.beginPath(); ctx.ellipse(px + 16, py + 7.5, 5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
        if (!dry) {
          ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(px + 16, py + 3); ctx.quadraticCurveTo(px + 16 + s * 7, py - 2, px + 16 + s * 9, py + 18); ctx.stroke(); });
          for (let i = 0; i < 5; i++) { const f = ((t / 800 + jit(i, 33)) % 1), s = i % 2 ? 1 : -1; ctx.fillStyle = 'rgba(255,255,255,' + (0.9 - f * 0.7) + ')'; circ(ctx, px + 16 + s * (2 + f * 8), py + 3 - Math.sin(f * Math.PI) * 5 + f * 15, 1.2); }
          for (let i = 0; i < 2; i++) { const o = ((t / 1200 + i / 2) % 1); ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - o)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px + 16, py + 20, 3 + o * 8, 1.2 + o * 3.5, 0, 0, Math.PI * 2); ctx.stroke(); }
        } else { ctx.fillStyle = 'rgba(160,155,145,.5)'; for (let i = 0; i < 3; i++) { const f = ((t / 3000 + i / 3) % 1); circ(ctx, px + 10 + i * 6 + Math.sin(f * 6) * 3, py + 18 - f * 12, 1.5 + f); } }
        break; }
      case 'throne': {   // a tall-backed throne: grey stone while the monster lives, gold after
        const gold = state.throne;
        shadow(14, 31); ctx.fillStyle = gold ? '#B3702A' : '#5B5652'; rr(ctx, px + 4, py - 15, 24, 36, 5); ctx.fill(); ctx.fillStyle = gold ? '#D98F1F' : '#6E6A62'; rr(ctx, px + 5, py - 14, 22, 34, 5); ctx.fill();
        ctx.fillStyle = gold ? '#F6B544' : '#8E8A80'; rr(ctx, px + 8, py - 10, 16, 26, 4); ctx.fill(); ctx.fillStyle = gold ? '#FFE8A3' : '#A9A39A'; ctx.fillRect(px + 10, py - 8, 3, 20);
        ctx.fillStyle = gold ? '#E4574F' : '#5B5652'; rr(ctx, px + 3, py + 14, 26, 8, 3); ctx.fill(); ctx.fillStyle = gold ? '#B3463A' : '#4A4744'; ctx.fillRect(px + 3, py + 19, 26, 3);
        ctx.fillStyle = gold ? '#D98F1F' : '#6E6A62'; ctx.fillRect(px + 4, py + 22, 4, 8); ctx.fillRect(px + 24, py + 22, 4, 8); circ(ctx, px + 4, py + 12, 3); circ(ctx, px + 28, py + 12, 3);
        ctx.fillStyle = gold ? '#FFE8A3' : '#8E8A80'; [[10, -18], [16, -22], [22, -18]].forEach(([x, y]) => circ(ctx, px + x, py + y, 2.5)); ctx.fillStyle = gold ? '#E4574F' : '#5B5652'; circ(ctx, px + 16, py - 22, 1.2);
        break; }
      case 'lostsign':
        ctx.save(); ctx.translate(px + 16, py + 20); ctx.rotate(-0.9); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(-2, -6, 4, 18); ctx.fillStyle = '#F4E8CC'; rr(ctx, -14, -12, 28, 10, 3); ctx.fill(); ctx.fillStyle = '#8B6A3E'; ctx.beginPath(); ctx.ellipse(-4, -7, 6, 2, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#4E9A52'; ctx.fillRect(px + 6, py + 24, 1.5, 6); ctx.fillRect(px + 24, py + 22, 1.5, 7); break;
      case 'broom':
        shadow(8, 31); ctx.save(); ctx.translate(px + 16, py + 16); ctx.rotate(0.15); ctx.fillStyle = '#A2703F'; ctx.fillRect(-1.5, -16, 3, 22); ctx.fillStyle = '#C48E55'; ctx.fillRect(-1.5, -16, 1, 22); ctx.fillStyle = '#E2B93B'; ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(5, 5); ctx.lineTo(10, 15); ctx.lineTo(-10, 15); ctx.fill(); ctx.fillStyle = '#B9932F'; ctx.fillRect(-5, 6, 10, 2); for (let i = 0; i < 4; i++) ctx.fillRect(-8 + i * 5, 12, 1, 3); ctx.restore(); break;
      case 'cards': {
        shadow(14, 30); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 4, py + 24, 3, 6); ctx.fillRect(px + 25, py + 24, 3, 6);
        ctx.fillStyle = '#2F7A44'; rr(ctx, px + 2, py + 8, 28, 18, 4); ctx.fill(); ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 1.5; rr(ctx, px + 2, py + 8, 28, 18, 4); ctx.stroke();
        const fan = Math.sin(t / 1500 + h) * 0.1;
        [[-0.3, '#E4574F'], [0, '#2A2420'], [0.3, '#E4574F']].forEach(([a, c], i) => { ctx.save(); ctx.translate(px + 12, py + 20); ctx.rotate(a + fan * (i - 1)); ctx.fillStyle = '#FFF'; rr(ctx, -3, -8, 7, 10, 1); ctx.fill(); ctx.fillStyle = c; circ(ctx, 0.5, -3, 1.5); ctx.restore(); });
        ctx.fillStyle = '#2F6E7E'; rr(ctx, px + 20, py + 11, 7, 10, 1); ctx.fill(); ctx.fillStyle = '#F6B544'; circ(ctx, px + 24, py + 23, 2); circ(ctx, px + 27, py + 22, 2); break; }
      case 'cart':
        shadow(13, 31); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 4, py + 10, 24, 12); ctx.fillStyle = '#5E3A1E'; ctx.fillRect(px + 4, py + 10, 24, 2); ctx.fillRect(px + 4, py + 16, 24, 1); ctx.fillStyle = '#6E6A62'; circ(ctx, px + 12, py + 9, 4); circ(ctx, px + 20, py + 8, 4); circ(ctx, px + 16, py + 6, 3.5); ctx.fillStyle = '#F6B544'; circ(ctx, px + 14, py + 7, 1); circ(ctx, px + 21, py + 9, 1);
        ctx.fillStyle = '#2A2420';
        if (fixed) { circ(ctx, px + 9, py + 25, 5); circ(ctx, px + 23, py + 25, 5); ctx.fillStyle = '#8E8A80'; circ(ctx, px + 9, py + 25, 1.5); circ(ctx, px + 23, py + 25, 1.5); }
        else { circ(ctx, px + 9, py + 25, 5); ctx.fillStyle = '#8E8A80'; circ(ctx, px + 9, py + 25, 1.5); ctx.fillStyle = '#2A2420'; ctx.save(); ctx.translate(px + 27, py + 28); ctx.rotate(0.6 + Math.sin(t / 1500) * 0.05); circ(ctx, 0, 0, 5); ctx.fillStyle = '#8E8A80'; circ(ctx, 0, 0, 1.5); ctx.restore(); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 20, py + 22, 6, 3); }
        break;
      case 'canary': {   // on a twig, hopping and singing
        const hop = ((t / 900 + h) % 1) < 0.15 ? 3 : 0, sing = ((t / 2400 + h) % 1) < 0.4;
        ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 4, py + 24, 24, 2); ctx.fillStyle = '#3F9A56'; circ(ctx, px + 6, py + 22, 3); circ(ctx, px + 27, py + 23, 2.5);
        ctx.fillStyle = '#F6B544'; circ(ctx, px + 16, py + 18 - hop, 6); circ(ctx, px + 21, py + 14 - hop, 4); ctx.fillStyle = '#E2B93B'; ctx.beginPath(); ctx.ellipse(px + 14, py + 18 - hop, 4, 2.5, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(px + 11, py + 18 - hop); ctx.lineTo(px + 5, py + 15 - hop); ctx.lineTo(px + 7, py + 20 - hop); ctx.fill();
        ctx.fillStyle = '#E4574F'; ctx.beginPath(); ctx.moveTo(px + 24, py + 14 - hop); ctx.lineTo(px + 28, py + 15 - hop); ctx.lineTo(px + 24, py + 16 - hop); ctx.fill(); ctx.fillStyle = '#FFF'; circ(ctx, px + 22, py + 13 - hop, 1.4); ctx.fillStyle = '#2A2420'; circ(ctx, px + 22.4, py + 13 - hop, 0.8);
        if (sing) for (let i = 0; i < 2; i++) { const f = ((t / 800 + i / 2) % 1); ctx.fillStyle = 'rgba(42,36,32,' + (1 - f) + ')'; ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('♪', px + 26 + f * 8 + i * 3, py + 8 - f * 10); }
        break; }
      case 'orepile':
        shadow(14, 30); ctx.fillStyle = '#5E5A52'; circ(ctx, px + 10, py + 25, 7); circ(ctx, px + 22, py + 25, 7); ctx.fillStyle = '#6E6A62'; circ(ctx, px + 10, py + 24, 6.5); circ(ctx, px + 22, py + 24, 6.5); circ(ctx, px + 16, py + 15, 7); ctx.fillStyle = '#7A766D'; circ(ctx, px + 14, py + 13, 3.5); circ(ctx, px + 8, py + 22, 3);
        for (let i = 0; i < 4; i++) { const tw = 0.5 + 0.5 * Math.abs(Math.sin(t / 350 + i * 1.9 + h)); ctx.fillStyle = 'rgba(246,181,68,' + tw + ')'; const [x, y] = [[14, 14], [22, 22], [9, 25], [18, 20]][i], s = 1.2 + tw * 1.4; ctx.beginPath(); ctx.moveTo(px + x, py + y - s * 2); ctx.lineTo(px + x + s, py + y); ctx.lineTo(px + x, py + y + s * 2); ctx.lineTo(px + x - s, py + y); ctx.fill(); }
        break;
      case 'ropes':
        shadow(11, 29); ctx.strokeStyle = '#8B6A3E'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px + 16, py + 18, 9, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(px + 16, py + 17, 9, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(px + 16, py + 17, 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(px + 16, py + 17, 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#B08A5A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px + 25, py + 17); ctx.quadraticCurveTo(px + 32, py + 22, px + 30, py + 30); ctx.stroke(); break;
      case 'tollbox':
        shadow(8, 31); ctx.fillStyle = '#7A4F2A'; ctx.fillRect(px + 14, py + 14, 4, 16); ctx.fillStyle = '#D98F1F'; rr(ctx, px + 5, py + 3, 22, 16, 3); ctx.fill(); ctx.fillStyle = '#F6B544'; rr(ctx, px + 6, py + 4, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#2A2420'; ctx.fillRect(px + 12, py + 7, 8, 2); ctx.font = 'bold 7px system-ui'; ctx.textAlign = 'center'; ctx.fillText('TOLL', px + 16, py + 16); break;
      case 'oar':
        ctx.fillStyle = '#E2CD95'; ctx.beginPath(); ctx.ellipse(px + 16, py + 22, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(px + 16, py + 16); ctx.rotate(0.7); ctx.fillStyle = '#A2703F'; ctx.fillRect(-2, -14, 4, 22); ctx.fillStyle = '#C48E55'; ctx.fillRect(-2, -14, 1.2, 22); ctx.fillStyle = '#7A4F2A'; rr(ctx, -5, 6, 10, 12, 4); ctx.fill(); ctx.fillStyle = '#8B5A2B'; ctx.fillRect(-0.5, 7, 1, 10); ctx.restore(); ctx.fillStyle = '#3F9A56'; ctx.beginPath(); ctx.ellipse(px + 24, py + 25, 5, 2, 0.4, 0, Math.PI * 2); ctx.fill(); break;
      case 'stones':   // flat skipping stones on the shore
        [[8, 24, 5, 2.5], [18, 27, 6, 3], [25, 21, 4, 2], [13, 19, 4.5, 2.2]].forEach(([x, y, rx, ry], i) => { ctx.fillStyle = i % 2 ? '#A9A39A' : '#B5B0A6'; ctx.beginPath(); ctx.ellipse(px + x, py + y, rx, ry, 0.3 * i, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(px + x - 1, py + y - 1, rx * 0.5, ry * 0.4, 0.3 * i, 0, Math.PI * 2); ctx.fill(); });
        break;
      case 'rod': {   // a fishing rod leaning on a post, the line already in the water
        ctx.fillStyle = '#5B4F47'; ctx.fillRect(px + 6, py + 12, 5, 18); ctx.fillStyle = '#7A766D'; ctx.fillRect(px + 6, py + 12, 5, 2);
        ctx.strokeStyle = '#7A4F2A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + 8, py + 26); ctx.lineTo(px + 26, py + 2); ctx.stroke();
        const dip = Math.sin(t / 600) * 1.5; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + 26, py + 2); ctx.quadraticCurveTo(px + 30, py + 14, px + 30, py + 26 + dip); ctx.stroke();
        ctx.fillStyle = '#E4574F'; circ(ctx, px + 30, py + 27 + dip, 2); ctx.fillStyle = '#FFF'; circ(ctx, px + 30, py + 28.5 + dip, 1.2);
        break; }
      case 'plinth':
        if (state.statues && state.statues[d.statue]) drawStatue(ctx, px, py, t);
        else { shadow(13, 31); ctx.fillStyle = '#8E8A80'; rr(ctx, px + 5, py + 19, 22, 11, 3); ctx.fill(); ctx.fillStyle = '#A9A39A'; rr(ctx, px + 5, py + 18, 22, 11, 3); ctx.fill(); ctx.fillStyle = '#C9C4BA'; rr(ctx, px + 8, py + 12, 16, 8, 2); ctx.fill(); ctx.fillStyle = '#DAD5CB'; ctx.fillRect(px + 8, py + 12, 16, 1.5); ctx.fillStyle = '#8E8A80'; ctx.fillRect(px + 10, py + 22, 12, 2); ctx.fillStyle = '#63C48F'; circ(ctx, px + 7, py + 28, 2); }
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
  const shadeCache = {};
  /* A darker (k < 1) or lighter (k > 1) version of a hex colour, cached, for folds, shoes and hair shine. */
  function shade(c, k) {
    const key = c + k; if (shadeCache[key]) return shadeCache[key];
    let r = 128, g = 128, b = 128;
    if (/^#[0-9a-f]{6}$/i.test(c)) { r = parseInt(c.slice(1, 3), 16); g = parseInt(c.slice(3, 5), 16); b = parseInt(c.slice(5, 7), 16); }
    const f = v => Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))));
    return (shadeCache[key] = 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')');
  }
  function drawPerson(ctx, cx, feetY, spec, dir, walk, scale) {
    const S = SIZES[spec.size || 'm'] * (scale || 1);
    const hw = 7 * S, bodyH = 12 * S, headR = 7.5 * S, legH = 6 * S, pants = spec.pants || '#3E5C8A';
    const swing = walk ? Math.sin(walk * Math.PI * 2) * 2.5 * S : 0;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(cx, feetY + 1, 9 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
    // legs and shoes
    ctx.fillStyle = pants; ctx.fillRect(cx - 5.5 * S, feetY - legH + swing, 4.5 * S, legH); ctx.fillRect(cx + 1 * S, feetY - legH - swing, 4.5 * S, legH);
    ctx.fillStyle = shade(pants, 0.8); ctx.fillRect(cx + 1 * S, feetY - legH - swing, 1 * S, legH);
    ctx.fillStyle = spec.shoes || '#4A3524'; rr(ctx, cx - 6 * S, feetY - 2 * S + swing, 5.5 * S, 2.5 * S, 1 * S); ctx.fill(); rr(ctx, cx + 0.5 * S, feetY - 2 * S - swing, 5.5 * S, 2.5 * S, 1 * S); ctx.fill();
    // body: the shirt, a light fold on the left, shade on the right and at the hem
    const top = feetY - legH - bodyH;
    ctx.fillStyle = spec.shirt; rr(ctx, cx - hw, top, hw * 2, bodyH + 1, 3 * S); ctx.fill();
    ctx.fillStyle = shade(spec.shirt, 1.25); ctx.fillRect(cx - hw + 1.5 * S, top + 2 * S, 1.5 * S, bodyH - 4 * S);
    ctx.fillStyle = shade(spec.shirt, 0.8); ctx.fillRect(cx + hw - 3 * S, top + 2 * S, 1.5 * S, bodyH - 3 * S); ctx.fillRect(cx - hw + 1 * S, feetY - legH - 1 * S, hw * 2 - 2 * S, 1.5 * S);
    if (spec.robe) {   // a long robe from the shoulders to the ground, with a faint seam and a sash
      ctx.fillStyle = spec.robe; ctx.beginPath(); ctx.moveTo(cx - hw, top + 1 * S); ctx.lineTo(cx + hw, top + 1 * S); ctx.lineTo(cx + hw + 3 * S, feetY + swing * 0.3); ctx.lineTo(cx - hw - 3 * S, feetY - swing * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = spec.sash || '#6B6662'; ctx.fillRect(cx - hw - 1 * S, feetY - legH - 2 * S, hw * 2 + 2 * S, 2.5 * S);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(cx - hw + 1 * S, top + 2 * S, 2 * S, bodyH - 3 * S); ctx.fillRect(cx + hw - 3 * S, top + 2 * S, 2 * S, bodyH - 3 * S);
    }
    if (spec.apron) { const ac = spec.apron === true ? '#F4E8CC' : spec.apron; ctx.fillStyle = ac; ctx.fillRect(cx - hw + 2 * S, top + 3 * S, hw * 2 - 4 * S, bodyH - 3 * S); ctx.fillStyle = shade(ac, 0.85); ctx.fillRect(cx - hw + 2 * S, top + 3 * S, hw * 2 - 4 * S, 1 * S); ctx.fillRect(cx - 1 * S, top + 6 * S, 2 * S, 3 * S); }
    if (spec.vest) { ctx.fillStyle = spec.vest; ctx.fillRect(cx - hw, top, 3 * S, bodyH); ctx.fillRect(cx + hw - 3 * S, top, 3 * S, bodyH); ctx.fillStyle = shade(spec.vest, 0.8); ctx.fillRect(cx - hw + 2.2 * S, top, 0.8 * S, bodyH); ctx.fillRect(cx + hw - 3 * S, top, 0.8 * S, bodyH); }
    // arms: a sleeve in the shirt colour, then the hand
    const armY = top + 2 * S;
    [[cx - hw - 3 * S, -swing * 0.6], [cx + hw, swing * 0.6]].forEach(([ax, dy]) => { ctx.fillStyle = spec.robe || spec.shirt; ctx.fillRect(ax, armY + dy, 3 * S, 5 * S); ctx.fillStyle = spec.skin; ctx.fillRect(ax, armY + dy + 5 * S, 3 * S, 3 * S); if (!spec.robe) { ctx.fillStyle = shade(spec.shirt, 0.8); ctx.fillRect(ax, armY + dy + 4 * S, 3 * S, 1 * S); } });
    if (!spec.robe) { ctx.fillStyle = spec.skin; ctx.beginPath(); ctx.moveTo(cx - 2.5 * S, top); ctx.lineTo(cx + 2.5 * S, top); ctx.lineTo(cx, top + 2.5 * S); ctx.fill(); }   // the neck shows in a small V collar
    // head, a shade under the chin, ears
    const hy = top - headR + 2 * S;
    ctx.fillStyle = spec.skin; circ(ctx, cx, hy, headR);
    ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.beginPath(); ctx.arc(cx, hy, headR, 0.2, Math.PI - 0.2); ctx.fill();
    ctx.fillStyle = spec.skin; ctx.beginPath(); ctx.ellipse(cx - headR, hy + 0.5 * S, 1.6 * S, 2 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + headR, hy + 0.5 * S, 1.6 * S, 2 * S, 0, 0, Math.PI * 2); ctx.fill();
    // hair, with a shine
    const st = spec.hairStyle || 'short', hairL = shade(spec.hair, 1.35), hairD = shade(spec.hair, 0.8);
    ctx.fillStyle = spec.hair;
    if (st !== 'bald') {
      if (dir === 'up') circ(ctx, cx, hy, headR); else { ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = hairL; ctx.beginPath(); ctx.ellipse(cx - 2.5 * S, hy - 5 * S, 2.5 * S, 1 * S, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = spec.hair;
      if (st === 'short' && dir !== 'up') { ctx.beginPath(); ctx.moveTo(cx - headR, hy - 1 * S); ctx.lineTo(cx - headR + 1.5 * S, hy + 1.5 * S); ctx.lineTo(cx - headR + 2.5 * S, hy - 1 * S); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + headR, hy - 1 * S); ctx.lineTo(cx + headR - 1.5 * S, hy + 1.5 * S); ctx.lineTo(cx + headR - 2.5 * S, hy - 1 * S); ctx.fill(); }   // sideburns
    } else {   // tufts by the ears and a shine on the dome
      ctx.beginPath(); ctx.ellipse(cx - headR + 0.5 * S, hy + 0.5 * S, 1.8 * S, 2.6 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + headR - 0.5 * S, hy + 0.5 * S, 1.8 * S, 2.6 * S, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(cx - 2 * S, hy - 4 * S, 2.5 * S, 1.2 * S, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = spec.hair;
    }
    if (st === 'long') { ctx.fillRect(cx - headR, hy - 1 * S, 3 * S, headR + 6 * S); ctx.fillRect(cx + headR - 3 * S, hy - 1 * S, 3 * S, headR + 6 * S); ctx.fillStyle = hairD; ctx.fillRect(cx - headR + 2 * S, hy + 2 * S, 1 * S, headR + 3 * S); ctx.fillRect(cx + headR - 3 * S, hy + 2 * S, 1 * S, headR + 3 * S); ctx.fillStyle = spec.hair; }
    if (st === 'bun') { circ(ctx, cx, hy - headR - 1 * S, 3.5 * S); ctx.fillStyle = hairD; circ(ctx, cx + 1 * S, hy - headR, 1.2 * S); ctx.fillStyle = spec.hair; }
    if (st === 'curly') { circ(ctx, cx - headR + 1 * S, hy - 2 * S, 3.5 * S); circ(ctx, cx + headR - 1 * S, hy - 2 * S, 3.5 * S); circ(ctx, cx, hy - headR, 4 * S); ctx.fillStyle = hairL; circ(ctx, cx - 1.5 * S, hy - headR - 1 * S, 1.1 * S); circ(ctx, cx + headR - 1.5 * S, hy - 3 * S, 0.9 * S); ctx.fillStyle = spec.hair; }
    if (spec.cap) { ctx.fillStyle = spec.cap; ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR + 0.5 * S, Math.PI, 0); ctx.fill(); if (dir !== 'up') ctx.fillRect(cx - headR - 2 * S * (dir === 'left' ? 1 : 0), hy - 1.5 * S, headR + 4 * S, 2.5 * S); ctx.fillStyle = shade(spec.cap, 1.3); circ(ctx, cx, hy - headR - 0.5 * S, 1 * S); }
    if (spec.helmet) { ctx.fillStyle = spec.helmet; ctx.beginPath(); ctx.arc(cx, hy - 0.5 * S, headR + 1 * S, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - headR - 1 * S, hy - 1.5 * S, headR * 2 + 2 * S, 2.5 * S); ctx.fillStyle = shade(spec.helmet, 1.3); ctx.beginPath(); ctx.ellipse(cx - 2 * S, hy - 5 * S, 2.5 * S, 1 * S, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = shade(spec.helmet, 0.8); ctx.fillRect(cx - 1 * S, hy - headR - 1 * S, 2 * S, 3 * S); }
    if (spec.hat) { ctx.fillStyle = spec.hat; ctx.fillRect(cx - headR - 3 * S, hy - headR + 1 * S, headR * 2 + 6 * S, 2.5 * S); rr(ctx, cx - headR + 1 * S, hy - headR - 7 * S, headR * 2 - 2 * S, 9 * S, 2 * S); ctx.fill(); ctx.fillStyle = shade(spec.hat, 0.75); ctx.fillRect(cx - headR + 1 * S, hy - headR - 1 * S, headR * 2 - 2 * S, 2 * S); ctx.fillStyle = shade(spec.hat, 1.3); ctx.fillRect(cx - headR + 2 * S, hy - headR - 6 * S, 1 * S, 5 * S); }
    if (spec.bandana) { ctx.fillStyle = spec.bandana; ctx.beginPath(); ctx.arc(cx, hy - 1 * S, headR + 0.5 * S, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - headR - 0.5 * S, hy - 2 * S, headR * 2 + 1 * S, 2.5 * S); ctx.fillStyle = shade(spec.bandana, 0.8); ctx.beginPath(); ctx.moveTo(cx + headR - 1 * S, hy - 1 * S); ctx.lineTo(cx + headR + 3 * S, hy + 2 * S); ctx.lineTo(cx + headR, hy + 0.5 * S); ctx.fill(); }
    if (spec.partyhat) { ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(cx - 5 * S, hy - headR + 2 * S); ctx.lineTo(cx, hy - headR - 9 * S); ctx.lineTo(cx + 5 * S, hy - headR + 2 * S); ctx.fill(); }
    if (spec.crown) {   // a small gold crown with three points and a red jewel
      ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(cx - 6 * S, hy - headR + 3 * S); ctx.lineTo(cx - 6 * S, hy - headR - 5 * S); ctx.lineTo(cx - 3 * S, hy - headR - 1 * S); ctx.lineTo(cx, hy - headR - 6 * S); ctx.lineTo(cx + 3 * S, hy - headR - 1 * S); ctx.lineTo(cx + 6 * S, hy - headR - 5 * S); ctx.lineTo(cx + 6 * S, hy - headR + 3 * S); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E4574F'; circ(ctx, cx, hy - headR, 1.4 * S);
    }
    if (spec.turban) {   // a wrapped turban: wide band low on the brow, a dome above, a fold line
      ctx.fillStyle = spec.turban; ctx.beginPath(); ctx.ellipse(cx, hy - headR * 0.5, headR + 2.2 * S, headR * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, hy - headR * 0.95, headR * 0.7, headR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1 * S; ctx.beginPath(); ctx.moveTo(cx - headR - 1 * S, hy - headR * 0.35); ctx.quadraticCurveTo(cx, hy - headR * 0.8, cx + headR + 1 * S, hy - headR * 0.25); ctx.stroke();
    }
    if (dir !== 'up') {
      const ey = hy + 1.5 * S, look = dir === 'left' ? -0.4 * S : dir === 'right' ? 0.4 * S : 0, side = dir === 'left' ? -1 : 1;
      const eye = ex => { ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.ellipse(ex, ey, 1.7 * S, 1.9 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = spec.eyes || '#2A2420'; circ(ctx, ex + look, ey + 0.3 * S, 1.1 * S); ctx.fillStyle = '#FFF'; circ(ctx, ex + look + 0.4 * S, ey - 0.3 * S, 0.45 * S); };
      if (dir === 'down') { eye(cx - 2.8 * S); eye(cx + 2.8 * S); } else eye(cx + side * 3.2 * S);
      ctx.strokeStyle = spec.hair === '#DDDDDD' ? '#9A9A9A' : spec.hair; ctx.lineWidth = 0.9 * S; ctx.lineCap = 'round'; ctx.beginPath();   // brows tilt with the mood
      const tilt = spec.frown ? 0.7 * S : -0.25 * S, by = ey - 2.6 * S;
      if (dir === 'down') { ctx.moveTo(cx - 4.4 * S, by - tilt); ctx.lineTo(cx - 1.4 * S, by + tilt); ctx.moveTo(cx + 1.4 * S, by + tilt); ctx.lineTo(cx + 4.4 * S, by - tilt); }
      else { ctx.moveTo(cx + side * 1.6 * S, by + tilt); ctx.lineTo(cx + side * 4.8 * S, by - tilt); }
      ctx.stroke();
      ctx.fillStyle = shade(spec.skin, 0.85);   // a small nose
      if (dir === 'down') { ctx.beginPath(); ctx.ellipse(cx, hy + 3.3 * S, 0.8 * S, 1.1 * S, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(cx + side * 6.5 * S, hy + 2.8 * S, 1.3 * S, 1 * S, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 1 * S; ctx.beginPath();
      const mx = dir === 'left' ? cx - 2 * S : dir === 'right' ? cx + 2 * S : cx;
      if (spec.frown) ctx.arc(mx, hy + 6 * S, 2 * S, 1.15 * Math.PI, 1.85 * Math.PI); else ctx.arc(mx, hy + 3.8 * S, 2 * S, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      if (spec.glasses) { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx - 2.8 * S, ey, 2.4 * S, 0, Math.PI * 2); ctx.moveTo(cx + 5.2 * S, ey); ctx.arc(cx + 2.8 * S, ey, 2.4 * S, 0, Math.PI * 2); ctx.moveTo(cx - 0.4 * S, ey); ctx.lineTo(cx + 0.4 * S, ey); ctx.stroke(); }
      if (spec.beard) { ctx.fillStyle = spec.hair; ctx.beginPath(); ctx.arc(cx, hy + 3 * S, headR - 1 * S, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill(); ctx.fillStyle = hairL; ctx.beginPath(); ctx.arc(cx, hy + 3 * S, headR - 3 * S, 0.3 * Math.PI, 0.7 * Math.PI); ctx.fill(); ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 0.8 * S; ctx.beginPath(); ctx.arc(mx, hy + 3.5 * S, 1.4 * S, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      if (spec.eyepatch) { ctx.fillStyle = '#2A2420'; circ(ctx, cx + 2.8 * S, ey, 2.4 * S); ctx.fillRect(cx - headR, hy - 0.5 * S, headR * 2, 0.8 * S); }
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
    const vg = ctx.createRadialGradient(W / 2, H * 0.4, W * 0.1, W / 2, H * 0.4, W * 0.75); vg.addColorStop(0, 'rgba(255,248,230,.6)'); vg.addColorStop(1, 'rgba(200,170,120,.25)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, R = W * 0.27;
    const bob = talking ? Math.sin(t / 130) * 1.6 : Math.sin(t / 1100) * 0.8;
    const hy = H * 0.40 + bob;
    const skinD = shade(spec.skin, 0.82), hairD = shade(spec.hair, 0.75), hairL = shade(spec.hair, 1.3), cloth = spec.robe || spec.shirt;
    // shoulders, a V collar and a lit fold
    ctx.fillStyle = cloth; rr(ctx, cx - W * 0.42, H * 0.74, W * 0.84, H * 0.5, 20); ctx.fill();
    ctx.fillStyle = shade(cloth, 0.82); ctx.beginPath(); ctx.moveTo(cx - R * 0.5, H * 0.74); ctx.lineTo(cx, H * 0.74 + R * 0.5); ctx.lineTo(cx + R * 0.5, H * 0.74); ctx.fill();
    ctx.fillStyle = shade(cloth, 1.2); ctx.fillRect(cx - W * 0.38, H * 0.76, W * 0.06, H * 0.25);
    if (spec.vest) { ctx.fillStyle = spec.vest; ctx.fillRect(cx - W * 0.42, H * 0.74, W * 0.15, H * 0.3); ctx.fillRect(cx + W * 0.27, H * 0.74, W * 0.15, H * 0.3); }
    if (spec.apron) { ctx.fillStyle = spec.apron === true ? '#F4E8CC' : spec.apron; ctx.fillRect(cx - W * 0.16, H * 0.82, W * 0.32, H * 0.3); }
    // neck and ears
    ctx.fillStyle = skinD; ctx.fillRect(cx - R * 0.32, hy + R * 0.6, R * 0.64, R * 0.75);
    ctx.fillStyle = spec.skin; circ(ctx, cx - R * 0.98, hy + R * 0.1, R * 0.2); circ(ctx, cx + R * 0.98, hy + R * 0.1, R * 0.2); ctx.fillStyle = skinD; circ(ctx, cx - R * 0.98, hy + R * 0.12, R * 0.09); circ(ctx, cx + R * 0.98, hy + R * 0.12, R * 0.09);
    // head with a soft shade on the jaw
    ctx.fillStyle = spec.skin; circ(ctx, cx, hy, R);
    ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.beginPath(); ctx.arc(cx, hy, R, 0.15, Math.PI - 0.15); ctx.fill();
    // hair
    const st = spec.hairStyle || 'short';
    ctx.fillStyle = spec.hair;
    if (st === 'bald') { ctx.beginPath(); ctx.arc(cx, hy, R + 0.5, Math.PI * 1.05, Math.PI * 1.25); ctx.lineTo(cx - R * 0.9, hy - R * 0.15); ctx.fill(); ctx.beginPath(); ctx.arc(cx, hy, R + 0.5, -Math.PI * 0.25, -Math.PI * 0.05); ctx.lineTo(cx + R * 0.9, hy - R * 0.15); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(cx - R * 0.3, hy - R * 0.65, R * 0.3, R * 0.12, -0.5, 0, Math.PI * 2); ctx.fill(); }
    else {
      ctx.beginPath(); ctx.arc(cx, hy - R * 0.08, R + 1, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); ctx.fillRect(cx - R - 1, hy - R * 0.35, R * 2 + 2, R * 0.3);
      ctx.fillStyle = hairL; ctx.beginPath(); ctx.ellipse(cx - R * 0.35, hy - R * 0.75, R * 0.35, R * 0.12, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = spec.hair;
      if (st === 'short') { ctx.beginPath(); ctx.moveTo(cx - R - 1, hy - R * 0.1); ctx.lineTo(cx - R + R * 0.2, hy + R * 0.25); ctx.lineTo(cx - R + R * 0.3, hy - R * 0.1); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + R + 1, hy - R * 0.1); ctx.lineTo(cx + R - R * 0.2, hy + R * 0.25); ctx.lineTo(cx + R - R * 0.3, hy - R * 0.1); ctx.fill(); }
    }
    if (st === 'long') { ctx.fillRect(cx - R - 2, hy - R * 0.3, R * 0.42, R * 1.9); ctx.fillRect(cx + R - R * 0.4 + 2, hy - R * 0.3, R * 0.42, R * 1.9); ctx.fillStyle = hairD; ctx.fillRect(cx - R + R * 0.2, hy + R * 0.2, R * 0.1, R * 1.3); ctx.fillRect(cx + R - R * 0.3, hy + R * 0.2, R * 0.1, R * 1.3); ctx.fillStyle = spec.hair; }
    if (st === 'bun') { circ(ctx, cx, hy - R - R * 0.15, R * 0.42); ctx.fillStyle = hairD; circ(ctx, cx + R * 0.1, hy - R - R * 0.05, R * 0.12); ctx.fillStyle = spec.hair; }
    if (st === 'curly') { for (let i = -3; i <= 3; i++) circ(ctx, cx + i * R * 0.36, hy - R * 0.85 - Math.abs(i) * -R * 0.06, R * 0.3); circ(ctx, cx - R * 0.95, hy - R * 0.25, R * 0.32); circ(ctx, cx + R * 0.95, hy - R * 0.25, R * 0.32); ctx.fillStyle = hairL; for (let i = -2; i <= 2; i += 2) circ(ctx, cx + i * R * 0.36 - R * 0.08, hy - R * 0.95 - Math.abs(i) * -R * 0.06, R * 0.08); ctx.fillStyle = spec.hair; }
    if (spec.cap) { ctx.fillStyle = spec.cap; ctx.beginPath(); ctx.arc(cx, hy - R * 0.1, R + 2, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R - 2, hy - R * 0.3, R * 2 + 4, R * 0.28); rr(ctx, cx - R * 0.2, hy - R * 0.32, R * 1.5, R * 0.3, 4); ctx.fill(); ctx.fillStyle = shade(spec.cap, 1.3); circ(ctx, cx, hy - R - 1, R * 0.1); }
    if (spec.helmet) { ctx.fillStyle = spec.helmet; ctx.beginPath(); ctx.arc(cx, hy - R * 0.05, R + 3, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R - 5, hy - R * 0.3, R * 2 + 10, R * 0.3); ctx.fillStyle = shade(spec.helmet, 1.3); ctx.beginPath(); ctx.ellipse(cx - R * 0.4, hy - R * 0.7, R * 0.3, R * 0.1, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = shade(spec.helmet, 0.8); ctx.fillRect(cx - R * 0.12, hy - R - 3, R * 0.24, R * 0.4); }
    if (spec.bandana) { ctx.fillStyle = spec.bandana; ctx.beginPath(); ctx.arc(cx, hy - R * 0.1, R + 2, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - R - 2, hy - R * 0.4, R * 2 + 4, R * 0.35); ctx.beginPath(); ctx.moveTo(cx + R * 0.7, hy - R * 0.2); ctx.lineTo(cx + R * 1.45, hy + R * 0.25); ctx.lineTo(cx + R * 0.95, hy - R * 0.05); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 5; i++) circ(ctx, cx - R * 0.6 + i * R * 0.3, hy - R * 0.25, R * 0.04); }
    if (spec.hat) { ctx.fillStyle = spec.hat; ctx.fillRect(cx - R * 1.35, hy - R * 0.72, R * 2.7, R * 0.28); rr(ctx, cx - R * 0.85, hy - R * 1.65, R * 1.7, R * 1.0, 5); ctx.fill(); ctx.fillStyle = shade(spec.hat, 0.75); ctx.fillRect(cx - R * 0.85, hy - R * 0.95, R * 1.7, R * 0.22); ctx.fillStyle = shade(spec.hat, 1.3); ctx.fillRect(cx - R * 0.7, hy - R * 1.55, R * 0.12, R * 0.5); }
    if (spec.crown) { ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(cx - R * 0.8, hy - R * 0.7); ctx.lineTo(cx - R * 0.8, hy - R * 1.45); ctx.lineTo(cx - R * 0.4, hy - R * 1.05); ctx.lineTo(cx, hy - R * 1.6); ctx.lineTo(cx + R * 0.4, hy - R * 1.05); ctx.lineTo(cx + R * 0.8, hy - R * 1.45); ctx.lineTo(cx + R * 0.8, hy - R * 0.7); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#E4574F'; circ(ctx, cx, hy - R * 0.95, R * 0.12); }
    // eyes: whites, a coloured iris, a pupil, two catchlights and a lid line
    const blink = ((t / 3300 + ((spec.skin.charCodeAt(1) || 0) % 7) * 0.13) % 1) < 0.045;
    const ey = hy + R * 0.05, ex = R * 0.42, iris = spec.eyes || (spec.hair === '#E0A23A' || spec.hair === '#B04A2A' ? '#3D7A8A' : spec.hair === '#DDDDDD' ? '#6B8A9A' : '#4A3524');
    [cx - ex, cx + ex].forEach(x => {
      if (blink) { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - R * 0.2, ey); ctx.quadraticCurveTo(x, ey + R * 0.08, x + R * 0.2, ey); ctx.stroke(); return; }
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.ellipse(x, ey, R * 0.21, R * 0.19, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = iris; circ(ctx, x + R * 0.02, ey + R * 0.03, R * 0.12); ctx.fillStyle = '#2A2420'; circ(ctx, x + R * 0.02, ey + R * 0.03, R * 0.065);
      ctx.fillStyle = '#FFF'; circ(ctx, x - R * 0.03, ey - R * 0.04, R * 0.035); circ(ctx, x + R * 0.06, ey + R * 0.06, R * 0.02);
      ctx.strokeStyle = 'rgba(42,36,32,.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, ey, R * 0.21, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    });
    // brows: thicker at the inner end, tilted by the mood
    ctx.strokeStyle = spec.hair === '#DDDDDD' ? '#9A9A9A' : spec.hair; ctx.lineCap = 'round';
    const tilt = spec.frown ? R * 0.1 : -R * 0.04, by = ey - R * 0.32;
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - ex - R * 0.22, by - tilt); ctx.lineTo(cx - ex + R * 0.22, by + tilt); ctx.moveTo(cx + ex - R * 0.22, by + tilt); ctx.lineTo(cx + ex + R * 0.22, by - tilt); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - ex - R * 0.02, by); ctx.lineTo(cx - ex + R * 0.22, by + tilt); ctx.moveTo(cx + ex - R * 0.22, by + tilt); ctx.lineTo(cx + ex + R * 0.02, by); ctx.stroke();
    // nose
    ctx.strokeStyle = skinD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + R * 0.02, ey + R * 0.1); ctx.lineTo(cx + R * 0.06, ey + R * 0.34); ctx.quadraticCurveTo(cx, ey + R * 0.42, cx - R * 0.06, ey + R * 0.36); ctx.stroke();
    if (spec.glasses) { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - ex, ey, R * 0.3, 0, Math.PI * 2); ctx.moveTo(cx + ex + R * 0.3, ey); ctx.arc(cx + ex, ey, R * 0.3, 0, Math.PI * 2); ctx.moveTo(cx - ex + R * 0.3, ey); ctx.lineTo(cx + ex - R * 0.3, ey); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx - ex, ey, R * 0.22, Math.PI * 1.2, Math.PI * 1.6); ctx.moveTo(cx + ex + R * 0.22 * Math.cos(Math.PI * 1.2), ey + R * 0.22 * Math.sin(Math.PI * 1.2)); ctx.arc(cx + ex, ey, R * 0.22, Math.PI * 1.2, Math.PI * 1.6); ctx.stroke(); }
    if (spec.eyepatch) { ctx.fillStyle = '#2A2420'; circ(ctx, cx + ex, ey, R * 0.3); ctx.lineWidth = 2; ctx.strokeStyle = '#2A2420'; ctx.beginPath(); ctx.moveTo(cx + ex - R * 0.3, ey - R * 0.1); ctx.lineTo(cx - R, hy - R * 0.5); ctx.stroke(); }
    // cheeks, and freckles for the red-haired
    ctx.fillStyle = 'rgba(255,150,140,.4)'; circ(ctx, cx - R * 0.62, hy + R * 0.4, R * 0.16); circ(ctx, cx + R * 0.62, hy + R * 0.4, R * 0.16);
    if (spec.hair === '#B04A2A' || spec.freckles) { ctx.fillStyle = 'rgba(120,70,40,.35)'; [-0.72, -0.6, -0.5, 0.5, 0.6, 0.72].forEach((k, i) => circ(ctx, cx + R * k, hy + R * (0.3 + (i % 2) * 0.1), R * 0.025)); }
    // mouth
    const my = hy + R * 0.52;
    if (talking) {
      const open = R * (0.08 + 0.3 * Math.abs(Math.sin(t / 95) * 0.6 + Math.sin(t / 41) * 0.4));
      ctx.fillStyle = '#7A2A25'; ctx.beginPath(); ctx.ellipse(cx, my, R * 0.28, open, 0, 0, Math.PI * 2); ctx.fill();
      if (open > R * 0.16) { ctx.fillStyle = '#fff'; ctx.fillRect(cx - R * 0.2, my - open + 1, R * 0.4, R * 0.08); ctx.fillStyle = '#C0524A'; ctx.beginPath(); ctx.ellipse(cx, my + open * 0.5, R * 0.14, open * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
      if (spec.frown) ctx.arc(cx, my + R * 0.32, R * 0.3, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(cx, my - R * 0.05, R * 0.3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      if (!spec.frown) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, my, R * 0.3, Math.PI * 0.25, Math.PI * 0.75); ctx.stroke(); }
    }
    if (spec.beard) { ctx.fillStyle = spec.hair; ctx.beginPath(); ctx.arc(cx, hy + R * 0.25, R * 0.92, Math.PI * 0.12, Math.PI * 0.88); ctx.lineTo(cx - R * 0.6, hy + R * 0.55); ctx.lineTo(cx + R * 0.6, hy + R * 0.55); ctx.fill(); ctx.fillStyle = hairL; ctx.beginPath(); ctx.arc(cx, hy + R * 0.35, R * 0.7, Math.PI * 0.3, Math.PI * 0.7); ctx.fill(); ctx.fillStyle = spec.skin; ctx.beginPath(); ctx.ellipse(cx, my + R * 0.04, R * 0.36, R * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      if (talking) { const open = R * (0.08 + 0.3 * Math.abs(Math.sin(t / 95) * 0.6 + Math.sin(t / 41) * 0.4)); ctx.fillStyle = '#7A2A25'; ctx.beginPath(); ctx.ellipse(cx, my, R * 0.26, Math.min(open, R * 0.22), 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.strokeStyle = '#B3463A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, my - R * 0.05, R * 0.26, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); } }
    ctx.restore();
  }

  /* Shortest path over walkable tiles. `avoid` is a set of "x,y" keys to treat as blocked. */
  function findPath(x0, y0, x1, y1, avoid) {
    if (!walkable(x1, y1) || (avoid && avoid.has(x1 + ',' + y1))) return null;
    const key = (x, y) => x + ',' + y, prev = new Map([[key(x0, y0), null]]), q = [[x0, y0]];
    let guard = 0;
    while (q.length && guard++ < 20000) {
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

  /* ================= the Simurgh: a great magic bird with a crest and a long tail of eye-feathers ================= */
  function wing(ctx, flap, color, tip, back) {
    ctx.save(); ctx.translate(-2, -4); ctx.rotate(-0.35 - flap * (back ? 0.55 : 0.8));
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -24, -28, -28); ctx.quadraticCurveTo(-18, -14, -22, -8); ctx.quadraticCurveTo(-10, -5, 2, 5); ctx.fill();
    ctx.fillStyle = tip; ctx.beginPath(); ctx.moveTo(-28, -28); ctx.quadraticCurveTo(-20, -18, -22, -8); ctx.lineTo(-17, -12); ctx.quadraticCurveTo(-16, -20, -28, -28); ctx.fill();
    ctx.restore();
  }
  /* (cx, cy) is the middle of her body; s is her size (1 is about two tiles wide with the tail). */
  function drawSimurgh(ctx, cx, cy, t, s, dir) {
    const f = dir === 'left' ? -1 : 1, flap = Math.sin(t / 150);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s * f, s); ctx.lineCap = 'round';
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 50); glow.addColorStop(0, 'rgba(255,220,130,.5)'); glow.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = glow; circ(ctx, 0, 0, 50);
    ['#2A9D8F', '#F6B544', '#E4574F', '#F6B544', '#2A9D8F'].forEach((c, i) => {
      const a = -0.45 + i * 0.22 + Math.sin(t / 500 + i) * 0.06, ex = -16 - Math.cos(a) * 30, ey = 12 + Math.sin(a) * 24;
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 4); ctx.quadraticCurveTo(-20, 8 + i * 2, ex, ey); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ex, ey, 5.5, 3.5, a, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1F5F7A'; circ(ctx, ex, ey, 1.8);
    });
    wing(ctx, flap, '#B3463A', '#D98F1F', true);
    ctx.fillStyle = '#2A9D8F'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.ellipse(6, 3, 7, 6, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2A9D8F'; circ(ctx, 12, -9, 6.5);
    ['#E4574F', '#F6B544', '#E4574F'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10 + i * 2, -14); ctx.quadraticCurveTo(6 + i * 3, -21 - i, 2 + i * 4, -24 + i * 2); ctx.stroke(); ctx.fillStyle = c; circ(ctx, 2 + i * 4, -24 + i * 2, 1.7); });
    ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(17, -12); ctx.lineTo(25, -8); ctx.lineTo(17, -6); ctx.fill();
    ctx.fillStyle = '#2A2420'; circ(ctx, 14, -10, 1.6); ctx.fillStyle = '#fff'; circ(ctx, 14.5, -10.6, 0.6);
    wing(ctx, flap, '#E4574F', '#F6B544', false);
    ctx.restore();
  }
  /* Sparkles that burst out when she appears out of nowhere; p goes 0..1. */
  function drawSparkles(ctx, cx, cy, p, t) {
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2 + t / 900, r = 10 + p * 46, s = (1 - p) * 3.2 + 0.6;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8;
      ctx.fillStyle = 'rgba(255,240,190,' + (1 - p) + ')'; ctx.beginPath(); ctx.moveTo(x, y - s * 2); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 2); ctx.lineTo(x - s, y); ctx.fill();
    }
  }
  /* Her talking portrait: head, crest and a golden beak that opens while she speaks. */
  function drawBirdFace(ctx, t, talking, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1C3439'; rr(ctx, 0, 0, W, H, 14); ctx.fill();
    ctx.save(); rr(ctx, 0, 0, W, H, 14); ctx.clip();
    const bob = talking ? Math.sin(t / 130) * 1.6 : Math.sin(t / 1100) * 0.8, cx = W * 0.44, cy = H * 0.46 + bob, R = W * 0.27;
    const g = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, W * 0.7); g.addColorStop(0, 'rgba(255,220,130,.55)'); g.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.ellipse(cx - R * 0.1, H * 0.98, R * 1.25, R * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2A9D8F'; ctx.fillRect(cx - R * 0.55, cy + R * 0.3, R * 1.0, H);
    ['#E4574F', '#F6B544', '#E4574F', '#F6B544'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - R * 0.2 + i * R * 0.18, cy - R * 0.85); ctx.quadraticCurveTo(cx - R * 0.6 + i * R * 0.2, cy - R * 1.6 - i * 3 + Math.sin(t / 400 + i) * 2, cx - R * 1.1 + i * R * 0.3, cy - R * 1.75 + i * R * 0.12); ctx.stroke(); ctx.fillStyle = c; circ(ctx, cx - R * 1.1 + i * R * 0.3, cy - R * 1.75 + i * R * 0.12, 3.5); });
    ctx.fillStyle = '#2A9D8F'; circ(ctx, cx, cy, R);
    ctx.fillStyle = '#3FB3A4'; circ(ctx, cx - R * 0.25, cy - R * 0.3, R * 0.45);
    const blink = ((t / 3700) % 1) < 0.04, ex = cx + R * 0.25, ey = cy - R * 0.15;
    if (!blink) { ctx.fillStyle = '#FFF4D6'; circ(ctx, ex, ey, R * 0.26); ctx.fillStyle = '#2A2420'; circ(ctx, ex + R * 0.05, ey, R * 0.14); ctx.fillStyle = '#fff'; circ(ctx, ex + R * 0.1, ey - R * 0.07, R * 0.05); }
    else { ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex - R * 0.25, ey); ctx.lineTo(ex + R * 0.25, ey); ctx.stroke(); }
    const open = talking ? R * (0.06 + 0.22 * Math.abs(Math.sin(t / 95) * 0.6 + Math.sin(t / 41) * 0.4)) : 0;
    ctx.fillStyle = '#D98F1F'; ctx.beginPath(); ctx.moveTo(cx + R * 0.7, cy + R * 0.12 + open * 0.3); ctx.lineTo(cx + R * 1.55, cy + R * 0.35 + open); ctx.lineTo(cx + R * 0.8, cy + R * 0.5 + open); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F6B544'; ctx.beginPath(); ctx.moveTo(cx + R * 0.65, cy - R * 0.2); ctx.quadraticCurveTo(cx + R * 1.5, cy - R * 0.1, cx + R * 1.6, cy + R * 0.35); ctx.lineTo(cx + R * 0.75, cy + R * 0.2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* The monster's shadow over the palace: dark smoke with two red eyes. `a` fades it out. */
  function drawMonster(ctx, cx, cy, t, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < 7; i++) {
      const ang = i / 7 * Math.PI * 2 + t / 3000, r = 70 + 14 * Math.sin(t / 700 + i), x = cx + Math.cos(ang) * 70, y = cy + Math.sin(ang) * 32 - 30;
      const g = ctx.createRadialGradient(x, y, 5, x, y, r); g.addColorStop(0, 'rgba(38,34,44,.5)'); g.addColorStop(1, 'rgba(38,34,44,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const g = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy - 40, 120); g.addColorStop(0, 'rgba(22,20,28,.85)'); g.addColorStop(1, 'rgba(22,20,28,0)'); ctx.fillStyle = g; circ(ctx, cx, cy - 40, 120);
    const glow = 0.65 + 0.35 * Math.sin(t / 300), shut = ((t / 4100) % 1) < 0.05;
    [-1, 1].forEach(s => {
      const ex = cx + s * 28, ey = cy - 62;
      const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 22); eg.addColorStop(0, 'rgba(255,80,60,' + glow + ')'); eg.addColorStop(1, 'rgba(255,80,60,0)'); ctx.fillStyle = eg; circ(ctx, ex, ey, 22);
      ctx.fillStyle = '#FFD0C0'; ctx.beginPath(); ctx.ellipse(ex, ey, 9, shut ? 0.8 : 4, s * 0.3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  const decorAt = (x, y) => decor.find(d => d.x === x && d.y === y && decorBlocked(d));
  const lodges = () => structures.filter(s => s.kind === 'lodge');
  return { TS, W, H, at, walkable, regions, regionAt, locked, siteAt, setState, structures, decor, decorAt, lodges, drawTile, drawFace, findPath, drawAction, drawItem, drawFollower, drawGlow, drawStructure, drawDecor, drawMission, drawPerson, drawRing, drawSermon, drawSimurgh, drawSparkles, drawBirdFace, drawMonster, rr, circ, shade };
})();
