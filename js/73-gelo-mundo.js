'use strict';

/* ================= the ice caves: the world under the crypts =================
   buildCathedral() is already wrapped by 56 (the caves above) and 57 (the Mãe-Teia's chamber); here it gets one
   more step at the end, icBuild(), which turns everything under the cathedral's crypts into the ice:
     1. the rock by band (frozen limestone and permafrost in the Fendas, blue ice in the Salões, packed snow and
        permafrost in the Covis, black ice in the Coração; frost creeps into the last rows of the crypts)
     2. the caves: cellular automaton for the organic shape, then tall fissures, great halls, the yetis' dens,
        black-ice grottos and the Trono de Gelo (the boss hall), joined by wide tunnels (a yeti is big)
     3. two ways down: the floor of a crypt room is broken open and a jagged fissure with ledges drops into the ice
     4. clean-up: tiny pockets filled, floating islands removed; ore veins (iron, gold, crystal in black ice)
     5. everything reachable from the two fissures, then the dressing: frozen lakes, snow on the den floors, frost
        on the fissure walls, glowing seams in the blue ice, ice columns in the halls, icicles, crystals, bones,
        and the props
   Also here: the far layer, the zones (13..16) and their names, spawn tables, monster levels and loot by depth,
   the slippery ice under the hero's feet, glows, the village's shops and the elder's tasks for the new
   materials, and the save (wg 4: older worlds are remade, the hero keeps level, items and gold). */

let icChambers = [], icLedge = new Set();   // the fissures' ledges: the dressing leaves them alone (not slippery)
const IC_SOILS = new Uint8Array(NT);   // natural ice-layer ground: what decorations and props may sit on
for (const t of [IC_NEVE, IC_NEVE_DURA, IC_GELO, IC_GELO_AZUL, IC_PERMA, IC_ROCHA, IC_GELO_NEGRO, IC_CALC_GELO, IC_VEIO, IC_O_FERRO, IC_O_OURO, IC_O_CRISTAL]) IC_SOILS[t] = 1;
const IC_HOST = new Uint8Array(NT);    // what the ice layer may overwrite (the cathedral's plain rock under the crypts)
for (const t of [CT_CALCARIO, CT_CALC_TERRA, COAL, COPPER, IRON, GOLD, CRYSTAL, BEDROCK, LAVA, AIR]) IC_HOST[t] = 1;

function icBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  IC_S0 = CB_S0 + Math.round(186 * CB_F);
  const S0 = IC_S0, YB = Math.min(WH - 8, S0 + IC_D), DB = YB - S0;   // the ice: rows S0..YB-1 (squeezed if the world is short)
  const R = mulberry32(seed ^ 0x1ce5), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / IC_D);   // metres of the design -> rows of this world
  const db = (x, y) => (y - S0) * IC_D / DB + (nz(x, y, 30, 0x1b1) - 0.5) * 10;   // band depth in metres, its borders wobble
  const bandOf = d => d < IC_BANDS[1] ? 0 : d < IC_BANDS[2] ? 1 : d < IC_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  icChambers = []; icBoss = null; icExits = []; icLedge.clear();

  // ---------- 1. the rock ----------
  for (let x = 0; x < WW; x++) {
    // frost creeps up into the last rows of the crypts
    for (let y = S0 - 10; y < S0; y++) {
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x1b2);
      if ((tiles[i] === CT_CALCARIO || tiles[i] === CT_CALC_TERRA) && h < k * 0.9) tiles[i] = IC_CALC_GELO;
      if (walls[i] === WCT_CALCARIO && h < k * 0.7) walls[i] = WIC_CALC;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (y >= WH - 3 - ((hash2(x, 0, seed) * 2) | 0)) { tiles[i] = BEDROCK; walls[i] = 3; continue; }
      if (!IC_HOST[tiles[i]] && y < S0 + 3) continue;   // something of the cathedral reaches down here: leave it
      const d = db(x, y), b = bandOf(d), n1 = nz(x, y, 34, 0x1a1), n2 = nz(x, y, 18, 0x1a2), n3 = nz(x, y, 50, 0x1a3);
      let t, w;
      if (b === 0) {
        const k = clamp(d / 30, 0, 1);
        t = n1 > 0.25 + k * 0.6 ? IC_CALC_GELO : n2 > 0.7 ? IC_GELO : n3 > 0.55 ? IC_ROCHA : IC_PERMA;
        w = t === IC_CALC_GELO ? WIC_CALC : WIC_ROCHA;
      } else if (b === 1) {
        t = n1 > 0.7 ? IC_ROCHA : n2 > 0.68 ? IC_GELO : IC_GELO_AZUL;
        w = t === IC_ROCHA ? WIC_ROCHA : WIC_GELO;
      } else if (b === 2) {
        t = n1 > 0.62 ? IC_ROCHA : n2 > 0.6 ? IC_NEVE_DURA : n3 > 0.7 ? IC_GELO : n2 < 0.25 ? IC_NEVE : IC_PERMA;
        w = t === IC_ROCHA || t === IC_PERMA ? WIC_ROCHA : WIC_NEVE;
      } else {
        t = n1 > 0.72 ? IC_ROCHA : n2 > 0.8 ? IC_GELO_AZUL : IC_GELO_NEGRO;
        w = WIC_NEGRO;
      }
      tiles[i] = t; walls[i] = w;
    }
  }

  // ---------- 2. the caves ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN);
  const P0 = [0.27, 0.26, 0.28, 0.25];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x1c1), streak = nz(x, y, 60, 0x1c2), d = db(x, y);
    cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.36 + (streak - 0.5) * 0.12 - (d < 6 ? 0.2 : 0) ? 1 : 0;
  }
  for (let it = 0; it < 5; it++) {
    for (let y = S0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (!canCarve(x, y)) { tmp[i] = 0; continue; }
      let s1 = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!cv[(y + dy) * WW + W1(x + dx)]) s1++;
      let solid = s1 >= 5;
      if (it < 2) { let s2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!cv[(y + dy) * WW + W1(x + dx)]) s2++; if (s2 <= 2) solid = true; }
      tmp[i] = solid ? 0 : 1;
    }
    for (let y = S0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) cv[y * WW + x] = tmp[y * WW + x];
  }
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); cv[i] = 1; keep[i] = 1; };
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.4) dig(x, y);
    }
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.2 + Math.sin(n * 0.11 + s) * 0.3;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      const rr = r + Math.sin(n * 0.21 + s) * 0.3;
      for (let dy = -Math.ceil(rr); dy <= Math.ceil(rr); dy++) for (let dx = -Math.ceil(rr) - 1; dx <= Math.ceil(rr) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= rr * rr) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const overlaps = (cx, cy, w, h) => icChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + 5 && Math.abs(c.cy - cy) < (c.h + h) / 2 + 4);

  // the ways down first: under two of the deepest crypt rooms, far apart
  const deep = cathRooms.filter(Rm => Rm.band === 3).sort((a, b) => b.fy - a.fy || a.x0 - b.x0);
  const picks = [];
  for (const Rm of deep) { if (Rm.w < 9) continue; if (picks.every(P => Math.abs(wdx((Rm.x0 + Rm.x1) / 2 - (P.x0 + P.x1) / 2)) > 80)) picks.push(Rm); if (picks.length === 2) break; }
  for (const Rm of deep) { if (picks.length >= 2) break; if (!picks.includes(Rm) && Rm.w >= 7) picks.push(Rm); }
  for (const Rm of picks) {
    // a part of the floor with nothing standing on it
    const used = new Set(); for (const p of PROPS) if (p.front) for (const i of p.sup) used.add(i);
    let fx = Rm.x0 + 2;
    for (let k = 0; k < Rm.w - 8; k++) { const x0 = Rm.x0 + 1 + ((k * 7 + (R() * 3 | 0)) % Math.max(1, Rm.w - 8)); let ok = true; for (let x = x0; x < x0 + 7; x++) if (used.has(I(x, Rm.fy))) ok = false; if (ok) { fx = x0; break; } }
    icExits.push({ x0: W1(fx), fy: Rm.fy, room: Rm });
    // the grotto at the bottom of the fissure, in the Fendas
    blob(fx + 3, S0 + 10, 16, 7, 0x1e0 + fx, 1.9);
    icChambers.push({ cx: fx + 3, cy: S0 + 10, w: 16, h: 7, band: 0, exit: true });
  }
  // the Trono de Gelo: in the Coração, across the world from the ways down
  {
    const w = 40, h = 16, ax = icExits.length ? icExits.reduce((s, e) => s + wdx(e.x0 - icExits[0].x0), 0) / icExits.length + icExits[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = S0 + mb(178), x0 = cx - (w >> 1), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(4 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2.2)); if (y >= top + arch) dig(x, y); }
    icBoss = { x0: W1(x0), x1: W1(x0 + w - 1), w, h, top, fy, cx };
    icChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true });
  }
  // chambers per band: [count, wMin, wMax, hMin, hMax, top metre, bottom metre, kind]
  const PLAN = [[12, 10, 18, 5, 8, 6, 42, 'gruta'], [7, 28, 55, 14, 24, 52, 100, 'salao'], [10, 14, 24, 8, 12, 110, 152, 'covil'], [7, 14, 26, 8, 12, 160, 182, 'gruta']];
  PLAN.forEach(([n0, wa, wb, ha, hb, d0, d1, kind], band) => {
    const n = n0 * WSC;
    for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
      const w = wa + ((R() * (wb - wa + 1)) | 0), h = Math.min(mb(hb), ha + ((R() * (hb - ha + 1)) | 0)), cx = (R() * WW) | 0, cy = S0 + mb(d0) + h / 2 + R() * Math.max(0, mb(d1 - d0) - h);
      if (overlaps(cx, cy, w, h)) continue;
      blob(cx, cy, w, h, 0x1900 + band * 40 + k, kind === 'salao' ? 2.2 : 1.7); icChambers.push({ cx, cy, w, h, band, kind }); k++;
    }
  });
  // the Fendas: tall narrow fissures, as if the ground had been split by the cold
  for (let k = 0, tries = 0; k < 14 * WSC && tries < 200 * WSC; tries++) {
    const x = (R() * WW) | 0, y0 = S0 + 3 + ((R() * mb(14)) | 0), hgt = mb(14) + ((R() * mb(12)) | 0), w = 4 + ((R() * 5) | 0);
    if (icChambers.some(c => Math.abs(wdx(c.cx - x)) < c.w / 2 + w && Math.abs(c.cy - (y0 + hgt / 2)) < c.h / 2 + hgt / 2)) continue;
    for (let y = y0; y < y0 + hgt; y++) { const t = (y - y0) / hgt, half = w / 2 * Math.sin(Math.PI * (0.15 + t * 0.85)) + 0.6, cx = x + Math.sin(y * 0.2 + k) * 1.4 + t * 2; for (let xx = Math.floor(cx - half); xx <= cx + half; xx++) dig(xx, y); }
    icChambers.push({ cx: x, cy: y0 + hgt / 2, w, h: hgt, band: 0, kind: 'fenda' }); k++;
  }
  // tunnels: along each band round the world (wide in the dens), and a few between bands
  const RAD = [1.5, 1.9, 2.2, 1.7];
  for (let b = 0; b < 4; b++) {
    const L = icChambers.filter(c => c.band === b).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) { const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue; worm(A.boss ? A.cx - A.w / 2 : A.cx, A.boss ? icBoss.fy - 2 : A.cy + A.h * 0.2, B.boss ? B.cx + B.w / 2 : B.cx, B.boss ? icBoss.fy - 2 : B.cy + B.h * 0.2, RAD[b], 0x1700 + b * 50 + k); }
  }
  for (let b = 0; b < 3; b++) {
    const U = icChambers.filter(c => c.band === b && !c.boss), D = icChambers.filter(c => c.band === b + 1 && !c.boss);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      worm(A.cx, A.cy, B.cx, B.cy, Math.max(RAD[b], RAD[b + 1]) + 0.2, 0x17f0 + b * 9 + k);
    }
  }
  // tiny pockets the automaton left get filled; little islands of ice floating in the air are cleared
  {
    const lab = new Int32Array(NN).fill(-1), st = [];
    for (let i0 = S0 * WW; i0 < YB * WW; i0++) {
      if (!cv[i0] || lab[i0] >= 0) continue;
      const comp = []; lab[i0] = i0; st.push(i0);
      while (st.length) { const c = st.pop(), x = c % WW, row = c - x; comp.push(c); for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && cv[nb] && lab[nb] < 0) { lab[nb] = i0; st.push(nb); } }
      if (comp.length < 14 && !comp.some(c => keep[c])) for (const c of comp) cv[c] = 0;
    }
    const sl = new Uint8Array(NN);
    for (let y = S0 + 1; y <= YB - 3; y++) for (let x = 0; x < WW; x++) {
      const i0 = y * WW + x; if (cv[i0] || sl[i0]) continue;
      const comp = []; let open = true; sl[i0] = 1; st.push(i0);
      while (st.length) { const c = st.pop(), cx = c % WW, cy = (c / WW) | 0, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN || cv[nb] || sl[nb]) continue; const ny = (nb / WW) | 0; if (!canCarve(nb % WW, ny)) { open = false; continue; } sl[nb] = 1; st.push(nb); } if (comp.length > 40) open = false; }
      if (open && comp.length < 24) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 3. the fissures down from the crypts: the floor broken open, ledges of frozen stone to climb back ----------
  for (const E of icExits) {
    const x0 = E.x0, y0 = E.fy, y1 = S0 + 13, Rm = E.room;   // the grotto below keeps a floor at S0 + 14
    for (let x = x0 - 6; x <= x0 + 13; x++) { const i = I(x, y1 + 1); if (!SOLID[tiles[i]]) tiles[i] = IC_PERMA; if (x >= x0 + 2 && x <= x0 + 4) icLedge.add(i); }
    for (let y = y0; y <= y1; y++) {
      const jl = Math.round(Math.sin(y * 0.37 + x0) * 0.8), jr = Math.round(Math.sin(y * 0.29 + x0 * 3) * 0.8);
      for (let x = x0 - 1 + jl; x <= x0 + 7 + jr; x++) { const i = I(x, y); tiles[i] = AIR; if (walls[i] === 0 || walls[i] === WCT_CALCARIO) walls[i] = y < S0 ? WIC_CALC : WIC_ROCHA; }
      for (const x of [x0 - 2 + jl, x0 + 8 + jr]) { const i = I(x, y); if (y > y0 && y < S0 + 8 && !SOLID[tiles[i]]) tiles[i] = y < S0 ? IC_CALC_GELO : IC_PERMA; }   // the fissure's walls
    }
    // ledges every three rows from the grotto floor up, alternating sides: a way back up to the crypts
    for (let y = y1 - 2, k = 0; y > y0 + 1; y -= 3, k++) { const left = k % 2 === 0; for (let j = 0; j < 3; j++) { const i = I(left ? x0 - 1 + j : x0 + 5 + j, y); tiles[i] = y < S0 ? IC_CALC_GELO : IC_PERMA; icLedge.add(i); } }
    // the broken edge of the crypt floor
    for (const x of [x0 - 1, x0 + 7]) if (hash2(W1(x), y0, seed) < 0.6) tiles[I(x, y0)] = AIR;
    // anything loose that stood on the floor that is now gone (candles, skulls, urns) goes with it
    for (let x = Rm.x0; x <= Rm.x1; x++) { const i = I(x, Rm.fy - 1); if (tiles[i] !== AIR && !SOLID[tiles[i]] && !SOLID[tiles[I(x, Rm.fy)]]) tiles[i] = AIR; }
  }
  icPruneProps();

  // ---------- 4. ore veins (iron in rock and permafrost, gold deeper, crystal in black ice) ----------
  const R4 = mulberry32(seed ^ 0x0ce4);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  const rocky = t => t === IC_ROCHA || t === IC_PERMA || t === IC_CALC_GELO || t === IC_NEVE_DURA, blackish = t => t === IC_GELO_NEGRO || t === IC_ROCHA;
  vein(IC_O_CARVAO, 90 * WSC, 0, 186, 3, 7, rocky); vein(IC_O_OURO, 100 * WSC, 0, 186, 2, 5, t => rocky(t) || t === IC_GELO_NEGRO);   // coal and gold in the ice (102)
}

/* the props of the crypt rooms that lost their footing when the floor broke open: dropped */
function icPruneProps() {
  const keep = PROPS.filter(p => p.sup.every(i => SOLID[tiles[i]]));
  if (keep.length === PROPS.length) return;
  PROPS.length = 0; propBuckets.clear(); propBySup.clear();
  for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup);
}

function icAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = IC_S0, YB = Math.min(WH - 8, S0 + IC_D), DB = YB - S0, nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s), R3 = mulberry32(seed ^ 0x1d3c1);
  const mb = m => Math.round(m * DB / IC_D);
  const iceRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!iceRow(y)) return; const i = I(x, y); if (icLedge.has(i)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WIC_ROCHA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const iceSolid = t => SOLID[t] && IC_SOILS[t];

  // ---------- 1. everything reachable from the two fissures ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= S0 * WW - 40 * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of icExits) flood(I(E.x0 + 3, E.fy - 2));
  for (let pass = 0; pass < 60 * WSC; pass++) {
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 20 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]]) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    worm(best[0], best[1], best[2], best[3], 1.6, 0x16a0 + pass);
    flood(I(best[2], best[3]));
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 2. the faces of the caves: frozen lakes, snow on the den floors, frost in the fissures, glowing seams ----------
  const airAt = (x, y) => tiles[I(x, y)] === AIR;
  for (let y = S0 + 1; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x, t = tiles[i], b = iceBand(y); if (!SOLID[t] || !IC_SOILS[t] || icLedge.has(i) || t === IC_O_FERRO || t === IC_O_OURO || t === IC_O_CRISTAL || t === IC_O_CARVAO) continue;
    const up = tiles[i - WW] === AIR, dn = tiles[i + WW] === AIR, side = tiles[y * WW + W1(x - 1)] === AIR || tiles[y * WW + W1(x + 1)] === AIR;
    if (b === 1 && up && nz(x, y, 18, 0x1d2) > 0.42) tiles[i] = IC_GELO;                                     // frozen lakes on the hall floors
    else if (b === 2 && up) tiles[i] = nz(x, y, 10, 0x1d3) > 0.3 ? IC_NEVE : IC_NEVE_DURA;                  // snow on the den floors
    else if (b === 0 && (dn || side) && !up && nz(x, y, 14, 0x1d4) > 0.55) tiles[i] = IC_GELO;              // frost glazing the fissure walls and roofs
    else if ((b === 1 || b === 3) && (t === IC_GELO_AZUL || t === IC_GELO_NEGRO) && (dn || side) && nz(x, y, 22, 0x1d5) > 0.72) tiles[i] = IC_VEIO;   // seams of glowing ice
  }

  // ---------- 3. ice columns in the great halls, floor to roof ----------
  for (const H of icChambers) {
    if (H.kind !== 'salao') continue;
    const n = 1 + ((R3() * 3) | 0);
    for (let k = 0; k < n; k++) {
      const x = Math.round(H.cx + (R3() - 0.5) * H.w * 0.7);
      let y = Math.round(H.cy); if (SOLID[tiles[I(x, y)]]) continue;
      let fl = y; while (fl < YB && !SOLID[tiles[I(x, fl + 1)]]) fl++;
      let rf = y; while (rf > S0 && !SOLID[tiles[I(x, rf - 1)]]) rf--;
      if (fl - rf < 4 || fl - rf > 20 || !iceSolid(tiles[I(x, fl + 1)]) || !iceSolid(tiles[I(x, rf - 1)])) continue;
      if (SOLID[tiles[I(x - 1, fl + 1)]] + SOLID[tiles[I(x + 1, fl + 1)]] < 2) continue;
      for (let yy = rf; yy <= fl; yy++) tiles[I(x, yy)] = IC_COLUNA;
    }
  }

  // ---------- 4. decorations ----------
  const put = (x, y, t) => { tiles[I(x, y)] = t; };
  const at = (x, y) => tiles[I(x, y)];
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i]) continue;
    const b = iceBand(y); if (b < 0 || b > 3) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = iceSolid(dn) && BLOCKY[dn] && up === AIR, ceil = iceSolid(up) && BLOCKY[up] && dn === AIR;
    if (icBoss && Math.abs(wdx(x - icBoss.cx)) < icBoss.w / 2 + 1 && y >= icBoss.top - 1 && y <= icBoss.fy) continue;   // the boss hall is dressed by 74
    if (ceil) {
      const ic = [0.07, 0.12, 0.06, 0.06][b];
      if (b === 3 && q < 0.035 && at(x, y + 1) === AIR && at(x, y + 2) === AIR) { put(x, y, IC_CRISTAL_TETO); continue; }
      if (q < ic) { for (let j = 0, n = 1 + ((R3() * (b === 1 ? 3 : 2)) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, IC_SINCELO); }
      continue;
    }
    if (!floor) continue;
    const icy = dn === IC_GELO || dn === IC_GELO_AZUL || dn === IC_GELO_NEGRO || dn === IC_VEIO || dn === IC_ROCHA;
    if (b === 0) {
      if (q < 0.04) put(x, y, IC_NEVE_MONTE);
      else if (q < 0.05 && typeof CT_CRANIOS !== 'undefined') put(x, y, CT_CRANIOS);
      else if (q < 0.058 && typeof CT_CACOS !== 'undefined') put(x, y, CT_CACOS);
      else if (q < 0.068) put(x, y, IC_OSSOS);
    } else if (b === 1) {
      if (q < 0.05 && icy && at(x, y - 1) === AIR) { put(x, y, IC_ESTALAG); if (R3() < 0.4 && at(x, y - 2) === AIR && at(x, y - 3) === AIR) put(x, y - 1, IC_ESTALAG); }
      else if (q < 0.062 && icy) put(x, y, IC_CRISTAL);
      else if (q < 0.07) put(x, y, IC_NEVE_MONTE);
    } else if (b === 2) {
      if (q < 0.06) put(x, y, IC_NEVE_MONTE);
      else if (q < 0.1) put(x, y, IC_OSSOS);
      else if (q < 0.11) put(x, y, BONES);
    } else {
      if (q < 0.045 && icy) put(x, y, IC_CRISTAL);
      else if (q < 0.075 && icy && at(x, y - 1) === AIR) put(x, y, IC_ESTALAG);
      else if (q < 0.085) put(x, y, IC_OSSOS);
    }
  }

  // ---------- 6. the big props ----------
  icPlaceProps();
}

/* ---------- props: on ice floors, under ice roofs, against the walls ---------- */
function icPlaceProps() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9a1c5);
  const S0 = IC_S0, YB = Math.min(WH - 8, S0 + IC_D), used = new Uint8Array(WW * WH * 2);
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (x0 < 1 || x0 + tw >= WW - 1 || y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = y * WW + x, t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i]) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[(y * WW + x) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && IC_SOILS[t]; };
  const inBoss = (x, y) => icBoss && Math.abs(wdx(x - icBoss.cx)) < icBoss.w / 2 + 2 && y >= icBoss.top - 2 && y <= icBoss.fy + 1;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = IC_BAND_NAMES[clamp(iceBand(y), 0, 3)], plan = IC_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBoss(k, y)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (how === 'chao') {
              const y0 = y + 1 - th; if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!IC_BACK_FLOOR[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (!fits(px, y0, tw, th, 1, false)) continue;
              mark(px, y0, tw, th, 1); n--;
              const sup = []; if (onFloor) for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), onFloor ? (y + 1) * T - V.h : y0 * T + ((th * T - V.h) >> 1), sup);
            }
          }
        }
      }
    }
  }
}

{ const _bc = buildCathedral; buildCathedral = function () { _bc(); if (GELO) { icBuild(); icAfter(); } }; }

/* ---------- the far layer behind the ice ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!GELO) return;
  for (let y = IC_S0 - 4; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - IC_S0) + (depthNz(x, y, 25, seed ^ 0x1e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x1e12);
    DEEPT[i] = d < 46 ? DP_IC_ROCHA : d < 104 ? (n > 0.55 ? DP_IC_SINCELOS : DP_IC_GELO) : d < 156 ? (n > 0.7 ? DP_IC_GELO : DP_IC_ROCHA) : DP_IC_NEGRO;
  }
}; }

/* ---------- zones, names, spawns ---------- */
ZONE_NAMES.push('Fendas Geladas', 'Salões de Gelo Azul', 'Covis dos Yetis', 'Coração do Inverno');
ZONE_SUB.push('o frio subiu pelas rachaduras', 'o gelo guarda a luz', 'algo grande dorme aqui', 'o inverno começou aqui');
{ const _cz = cathZone; cathZone = function (tx, ty) { if (GELO && ty >= IC_S0) return IC_ZONE0 + clamp(iceBand(ty), 0, 3); return _cz(tx, ty); }; }
Object.assign(CATH_SPAWN, {
  [IC_ZONE0]: [[['lobo', 0.35], ['espirito', 0.25], ['slime', 0.25], ['verme', 0.15]], 8],
  [IC_ZONE0 + 1]: [[['lobo', 0.25], ['espirito', 0.25], ['sentinela', 0.2], ['slime', 0.15], ['verme', 0.15]], 9],
  [IC_ZONE0 + 2]: [[['yeti', 0.3], ['lobo', 0.3], ['verme', 0.2], ['espirito', 0.2]], 9],
  [IC_ZONE0 + 3]: [[['sentinela', 0.3], ['yeti', 0.25], ['espirito', 0.25], ['lobo', 0.2]], 10]
});
// loot: the whole ice layer counts as the deepest
{ const _lz = lootZone; lootZone = function (tx, ty) { if (GELO && zoneAt(tx, ty) >= IC_ZONE0 && zoneAt(tx, ty) <= IC_ZONE0 + 3) return 4; return _lz(tx, ty); }; }
// levels: 7-8 (layerLvl in 52), 30% of them one higher but never past 8; wolves run in packs; worms start under the floor
let icPacking = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!GELO || e.boss || D.boss || e.yetiMinion) return e;
  const d = Math.floor((py + e.h) / T) - IC_S0;
  if (d >= 0) {
    const lvl = layerLvl(7, d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  if (zone >= IC_ZONE0 && zone <= IC_ZONE0 + 3) {
    if (type === 'slime') e.variant = IC_SLIME;
    else if (type === 'verme') e.state = 'under';
    else if (type === 'lobo' && !icPacking) {
      icPacking = true; sfx.icHowl();
      try { for (let k = 0, n = 1 + (Math.random() < 0.5 ? 1 : 0); k < n; k++) { const x2 = px + (k ? -1 : 1) * (22 + Math.random() * 10); if (!rectSolid(x2, py, D.w, D.h) && solidAt(Math.floor((x2 + D.w / 2) / T), Math.floor((py + D.h) / T))) spawnEnemy('lobo', x2, py, zone); } }
      finally { icPacking = false; }
    }
  }
  return e;
}; }

/* ---------- the hero slides on ice ---------- */
function icOnIce() {
  const ty = Math.floor((pl.y + pl.h + 1) / T);
  return !!(IC_SLIP[tileAt(Math.floor((pl.x + 1) / T), ty)] || IC_SLIP[tileAt(Math.floor((pl.x + pl.w - 1) / T), ty)]);
}
{ const _up = updatePlayer; updatePlayer = function (dt) {
  const vx0 = pl.vx, on = GELO && pl.onGround && !pl.dead && !pl.bat && icOnIce();
  const r = _up(dt);
  if (on && pl.onGround && !pl.climb) {
    pl.vx = vx0 + (pl.vx - vx0) * 0.22;   // a quarter of the grip: slow to start, slower to stop
    if (Math.abs(pl.vx) > 30 && Math.random() < dt * 20) parts.push({ x: pl.x + pl.w / 2 - Math.sign(pl.vx) * 3, y: pl.y + pl.h - 1, vx: -pl.vx * 0.2 + rnd(-10, 10), vy: rnd(-30, -10), g: 200, life: 0.3, max: 0.3, col: '#e4f2fc', size: 1 });
  }
  return r;
}; }

/* ---------- decorations that glow: crystals, glowing seams, crystal ore in black ice ---------- */
const IC_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!IC_GLOW.c) { IC_GLOW.c = glow(16, '#6ad0f4'); IC_GLOW.v = glow(12, '#4aa0e0'); IC_GLOW.o = glow(16, '#a07ae8'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== IC_CRISTAL && t !== IC_CRISTAL_TETO && t !== IC_VEIO && t !== IC_O_CRISTAL) continue;
    const gx = emitters[i], gy = emitters[i + 1];
    if (t === IC_VEIO) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.14 + Math.sin(gameTime * 1.3 + gx * 0.5 + gy) * 0.04; lc.drawImage(IC_GLOW.v, gx * T + 6 - cx - 12, gy * T + 6 - cy - 12); continue; }
    if (t === IC_O_CRISTAL) { lc.globalAlpha = 0.16 + Math.sin(gameTime * 2 + gx) * 0.05; lc.drawImage(IC_GLOW.o, gx * T + 6 - cx - 16, gy * T + 6 - cy - 16); continue; }
    lc.globalAlpha = 0.22 + Math.sin(gameTime * 1.7 + gx * 0.7) * 0.05; lc.drawImage(IC_GLOW.c, gx * T + 6 - cx - 16, gy * T + (t === IC_CRISTAL ? 8 : 4) - cy - 16);
  }
  lc.globalAlpha = 1;
});
// snowflakes drifting down in the great halls, and the hero's breath in the cold
HOOK.update.push(dt => {
  if (!GELO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = iceBand(pty); if (b < 0 || b > 3) return;
  if (Math.random() < dt * (b === 1 ? 14 : 6)) { const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH * 0.5; if (!solidAt(Math.floor(x / T), Math.floor(y / T)) && wallAt(Math.floor(x / T), Math.floor(y / T))) parts.push({ x, y, vx: rnd(-6, 6), vy: rnd(10, 22), g: 0, life: 2.4, max: 2.4, col: Math.random() < 0.7 ? '#e4f2fc' : '#9ac4e0', size: 1 }); }
  if (Math.random() < dt * 1.2) for (let k = 0; k < 3; k++) parts.push({ x: pl.x + pl.w / 2 + pl.facing * 4, y: pl.y + 7, vx: pl.facing * rnd(8, 18), vy: rnd(-8, -2), g: -6, life: 0.7, max: 0.7, col: 'rgba(230,240,250,0.5)', size: 1 });
});

/* ---------- the village: shops and the elder's tasks for the new materials ---------- */
Object.assign(MAT_VAL, { pelo_yeti: 14, presa_lobo: 6, essencia_gelida: 12, lasca_eterna: 20 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['presa_lobo', 'essencia_gelida', 'pelo_yeti'].includes(id); c.hint = c.hint.replace(/\.$/, '') + ', presas de lobo, pelos de yeti e essência gélida.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || id === 'lasca_eterna'; f.hint = f.hint.replace(/\.$/, '') + ' e gelo eterno.'; }

/* ---------- the save: worlds from before the ice are remade; level, items, gold and the chest stay ---------- */
let iceNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (GELO) o.wg = 4; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!GELO || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 4) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null; v.cp = []; v.rei = null; v.teia = null; v.yeti = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
    iceNews = !!v.p && v.wrap === 1;
  }
  v.wg = 3; const r = _ms(v); if (r) r.wg = 4; return r;   // 56 knows world 3
}; }
HOOK.update.push(() => {
  if (iceNews && state === 'play') { iceNews = false; setTimeout(() => toast('Novidade: debaixo das criptas da catedral agora há as Cavernas de Gelo, com yetis, lobos, espíritos da nevasca e um chefe antigo. O mundo foi refeito para elas; seu nível, itens e ouro continuam.', 'gold'), 900); }
});
