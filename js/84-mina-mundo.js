'use strict';

/* ================= the abandoned mine: the world under the ice =================
   buildCathedral() already builds the caves, the cathedral and the ice (56, 57, 73, 74); here it gets one more
   step at the end, mnBuild() and mnAfter(), which turn everything under the Coração do Inverno into the mine:
     1. the rock by band (banded iron rock everywhere, tailings the miners dumped, quartzite where the gold is,
        rubble in the goblins' camp, slag down by the furnaces; the black ice and frozen rock thin out over the
        first rows, and the iron rock creeps up into the last rows of the ice)
     2. natural caverns (a sparse cellular automaton), then the miners' work: straight timbered galleries at fixed
        levels, shafts with ladders between them (wide ones with scaffold platforms in the Poços), stopes, the
        goblins' camp halls, the furnace halls and the boss hall (the Oficina da Escavadeira), joined by tunnels
     3. two old shafts down from the Coração do Inverno: a timber collar in the ice floor, a planked shaft and a
        ladder all the way to the first gallery (you climb back up the same way)
     4. clean-up: tiny pockets filled, floating islands removed; ore veins (coal and iron in the iron rock, gold
        and crystal in quartzite)
     5. everything reachable from the two shafts, then the dressing: plank floors where a gallery crosses a cave,
        beams where its roof opens, timber sets (posts floor to roof under a capping beam), rails, lanterns, the
        ladders and scaffolds, brick and slag in the furnaces, plank floors in the camp, ropes, tools, stones,
        skull stakes, embers, and the props
   Also here: the far layer, the zones (17..20) and their names, spawn tables, monster levels, glows, dust and
   embers, distant picks, the village's shops and the elder's tasks for the new materials, and the save (wg 5:
   older worlds are remade, the hero keeps level, items and gold). */

let mnChambers = [], mnGalleries = [], mnShafts = [], mnKeep = new Set();   // mnKeep: ladders, scaffolds, shaft collars: tunnels and dressing leave them alone
const MN_SOILS = new Uint8Array(NT);   // natural mine ground: what decorations and props may sit on
for (const t of [MN_FERROSA, MN_REJEITO, MN_ENTULHO, MN_TABUA, MN_VIGA, MN_CAVADA, MN_TIJOLO, MN_ESCORIA, MN_QUARTZITO, MN_O_CARVAO, MN_O_FERRO, MN_O_OURO, MN_O_CRISTAL, MN_O_COBALTO]) MN_SOILS[t] = 1;
const MN_HOST = new Uint8Array(NT);    // what the mine may overwrite (the ice's filler under the Coração)
for (const t of [IC_GELO_NEGRO, IC_ROCHA, IC_GELO_AZUL, IC_GELO, IC_PERMA, IC_NEVE, IC_NEVE_DURA, IC_VEIO, IC_O_FERRO, IC_O_OURO, IC_O_CRISTAL, IC_SINCELO, IC_ESTALAG, IC_CRISTAL, IC_CRISTAL_TETO, IC_OSSOS, IC_NEVE_MONTE, IC_COLUNA, BEDROCK, AIR]) MN_HOST[t] = 1;

function mnBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  MN_S0 = Math.min(WH - 12, IC_S0 + Math.min(IC_D, WH - 8 - IC_S0));
  const S0 = MN_S0, YB = Math.min(WH - 8, S0 + MN_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x3a1e), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / MN_D);
  const db = (x, y) => (y - S0) * MN_D / DB + (nz(x, y, 30, 0x3b1) - 0.5) * 10;
  const bandOf = d => d < MN_BANDS[1] ? 0 : d < MN_BANDS[2] ? 1 : d < MN_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  mnChambers = []; mnGalleries = []; mnShafts = []; mnBoss = null; mnExits = []; mnKeep.clear();

  // ---------- 1. the rock ----------
  for (let x = 0; x < WW; x++) {
    // the iron rock creeps up into the last rows of the ice
    for (let y = S0 - 8; y < S0; y++) {
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x3b2);
      if ((tiles[i] === IC_GELO_NEGRO || tiles[i] === IC_ROCHA) && h < k * 0.85) tiles[i] = MN_FERROSA;
      if (walls[i] === WIC_NEGRO && h < k * 0.6) walls[i] = WMN_FERROSA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3) continue;
      if (!MN_HOST[tiles[i]]) continue;
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x3b3);
      if (k < 1 && h > 0.35 + k * 0.6) { tiles[i] = h > 0.7 ? IC_GELO_NEGRO : IC_ROCHA; walls[i] = WIC_NEGRO; continue; }   // the ice thins out
      const d = db(x, y), b = bandOf(d), n1 = nz(x, y, 34, 0x3a1), n2 = nz(x, y, 18, 0x3a2), n3 = nz(x, y, 50, 0x3a3);
      let t;
      if (y >= YB) t = MN_FERROSA;
      else if (b === 0) t = n1 > 0.72 ? MN_REJEITO : n2 > 0.78 ? MN_QUARTZITO : MN_FERROSA;
      else if (b === 1) t = n2 > 0.62 ? MN_QUARTZITO : n1 > 0.75 ? MN_REJEITO : MN_FERROSA;
      else if (b === 2) t = n1 > 0.66 ? MN_REJEITO : n3 > 0.74 ? MN_ENTULHO : n2 > 0.8 ? MN_QUARTZITO : MN_FERROSA;
      else t = n3 > 0.62 ? MN_ESCORIA : n2 > 0.76 ? MN_QUARTZITO : MN_FERROSA;
      tiles[i] = t; walls[i] = t === MN_QUARTZITO ? WMN_QUARTZITO : WMN_FERROSA;
    }
  }

  // ---------- 2. natural caverns, then the miners' work ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN);
  const P0 = [0.2, 0.22, 0.21, 0.19];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x3c1), d = db(x, y);
    cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.34 - (d < 5 ? 0.2 : 0) ? 1 : 0;
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
  const fill = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (!keep[i]) cv[i] = 0; };
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.35) dig(x, y);
    }
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.1 + Math.sin(n * 0.11 + s) * 0.25;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const busy = (cx, cy, w, h, m = 4) => mnChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // a straight gallery: 4 rows of air over a floor row, the ends tapering
  const gallery = (xa, len, fy, band) => {
    for (let k = 0; k < len; k++) { const x = xa + k, end = k < 2 || k > len - 3; for (let y = fy - (end ? 3 : 4); y < fy; y++) dig(x, y); fill(x, fy); }
    const G = { x0: W1(xa), len, fy, band }; mnGalleries.push(G);
    mnChambers.push({ cx: xa + len / 2, cy: fy - 2, w: len, h: 4, band, kind: 'galeria', g: G });
    return G;
  };

  // the two shafts from the ice first: under two grottos of the Coração do Inverno, far apart and away from the Yeti's hall
  const yb = icBoss, iceS = icChambers.filter(c => c.band === 3 && !c.boss && !c.exit && (!yb || Math.abs(wdx(c.cx - yb.cx)) > yb.w / 2 + 24)).sort((a, b) => a.cx - b.cx);
  const picks = [];
  for (let n = 0; n < iceS.length && picks.length < 2; n++) { const c = iceS[(n * 5 + ((R() * iceS.length) | 0)) % iceS.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
  for (const c of iceS) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
  const landY = S0 + mb(12);
  for (const c of picks) {
    const x0 = W1(Math.round(c.cx) - 2);
    let fy = Math.round(c.cy); while (fy < S0 && !SOLID[tiles[I(x0 + 1, fy)]] && !SOLID[tiles[I(x0 + 2, fy)]]) fy++;
    if (fy >= S0 - 2) continue;
    mnExits.push({ x0, fy, top: Math.round(c.cy) });
    gallery(x0 - 14 - ((R() * 10) | 0), 34 + ((R() * 24) | 0), landY, 0);   // the first gallery at the foot of the shaft
  }
  // the boss hall, the Oficina da Escavadeira: in the Fornalhas, across the world from the shafts
  {
    const w = 48, h = 16, ax = mnExits.length ? mnExits.reduce((s, e) => s + wdx(e.x0 - mnExits[0].x0), 0) / mnExits.length + mnExits[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = S0 + mb(180), x0 = cx - (w >> 1), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(3 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 3)); if (y >= top + arch) dig(x, y); }
    mnBoss = { x0: W1(x0), x1: W1(x0 + w - 1), w, h, top, fy, cx };
    mnChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true });
  }
  // the galleries: levels in metres, how many per level, length range
  const LEV = [[22, 3, 30, 90, 0], [32, 3, 30, 90, 0], [42, 2, 30, 80, 0], [56, 2, 30, 70, 1], [70, 2, 30, 70, 1], [86, 2, 30, 70, 1], [112, 2, 26, 60, 2], [136, 2, 26, 60, 2]];
  for (const [m, n, la, lb, band] of LEV) for (let k = 0, tries = 0; k < n * WSC && tries < 40 * WSC; tries++) {
    const len = la + ((R() * (lb - la)) | 0), xa = (R() * WW) | 0, fy = S0 + mb(m) + (((R() * 3) | 0) - 1);
    if (busy(xa + len / 2, fy - 2, len, 4, 3)) continue;
    gallery(xa, len, fy, band); k++;
  }
  // chambers per band: [count, wMin, wMax, hMin, hMax, top metre, bottom metre, kind]
  const PLAN = [[5, 10, 16, 5, 7, 6, 44, 'gruta'], [6, 18, 32, 10, 14, 50, 96, 'camara'], [6, 28, 46, 12, 16, 102, 148, 'acampamento'], [6, 22, 34, 9, 12, 154, 182, 'fornalha']];
  PLAN.forEach(([n0, wa, wb, ha, hb, d0, d1, kind], band) => {
    const n = n0 * WSC;
    for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
      const w = wa + ((R() * (wb - wa + 1)) | 0), h = Math.min(mb(hb), ha + ((R() * (hb - ha + 1)) | 0)), cx = (R() * WW) | 0, cy = S0 + mb(d0) + h / 2 + R() * Math.max(0, mb(d1 - d0) - h);
      if (busy(cx, cy, w, h)) continue;
      if (kind === 'fornalha') {   // a hall built square, with a low vault
        const x0 = Math.round(cx - w / 2), top = Math.round(cy - h / 2), fy = top + h;
        for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const kk = x - x0, arch = Math.round(2.5 * Math.pow(Math.abs((kk + 0.5) / w * 2 - 1), 2)); if (y >= top + arch) dig(x, y); }
        mnChambers.push({ cx, cy, w, h, band, kind, x0: W1(x0), top, fy });
      } else { blob(cx, cy, w, h, 0x3900 + band * 40 + k, kind === 'acampamento' ? 2.6 : kind === 'camara' ? 2.2 : 1.7); mnChambers.push({ cx, cy, w, h, band, kind }); }
      k++;
    }
  });
  // shafts between galleries: from a gallery's floor straight down to the next gallery under it (or a sump)
  for (let k = 0, tries = 0; k < 16 * WSC && tries < 160 * WSC; tries++) {
    const A = mnGalleries[(R() * mnGalleries.length) | 0]; if (!A || A.band > 2 || A.len < 14) continue;
    const wide = A.band === 1 ? 6 : 4, x0 = W1(A.x0 + 4 + ((R() * (A.len - 8 - wide)) | 0));
    if (mnShafts.some(s => Math.abs(wdx(s.x0 - x0)) < 14 && Math.abs(s.top - A.fy) < 40)) continue;
    const below = mnGalleries.filter(B => B !== A && B.fy > A.fy + 8 && B.fy < A.fy + mb(52) && wdx(x0 - B.x0) >= 2 && wdx(x0 + wide - (B.x0 + B.len)) <= -2).sort((a, b) => a.fy - b.fy)[0];
    let bot;
    if (below) bot = below.fy;
    else { bot = Math.min(YB - 6, A.fy + 14 + ((R() * 14) | 0)); if (mineBand(bot) > 2) continue; blob(x0 + wide / 2, bot - 3, 12 + wide, 6, 0x3a00 + k, 2.4); mnChambers.push({ cx: x0 + wide / 2, cy: bot - 3, w: 12 + wide, h: 6, band: mineBand(bot), kind: 'gruta' }); }
    for (let y = A.fy - 4; y < bot; y++) for (let x = x0; x < x0 + wide; x++) dig(x, y);
    mnShafts.push({ x0, w: wide, top: A.fy, bot, band: A.band }); k++;
  }
  // tunnels: along each band round the world, and a few down between bands
  const RAD = [1.5, 1.7, 2.0, 1.8];
  for (let b = 0; b < 4; b++) {
    const L = mnChambers.filter(c => c.band === b).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue;
      const ax = A.boss ? A.cx - A.w / 2 : A.g ? A.cx + A.w / 2 - 1 : A.cx, ay = A.boss ? mnBoss.fy - 2 : A.g ? A.g.fy - 2 : A.cy + A.h * 0.2;
      const bx = B.boss ? B.cx + B.w / 2 : B.g ? B.cx - B.w / 2 + 1 : B.cx, by = B.boss ? mnBoss.fy - 2 : B.g ? B.g.fy - 2 : B.cy + B.h * 0.2;
      worm(ax, ay, bx, by, RAD[b], 0x3700 + b * 50 + k);
    }
  }
  for (let b = 0; b < 3; b++) {
    const U = mnChambers.filter(c => c.band === b && !c.boss), D = mnChambers.filter(c => c.band === b + 1 && !c.boss);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      worm(A.cx, A.cy, B.cx, B.cy, Math.max(RAD[b], RAD[b + 1]) + 0.2, 0x37f0 + b * 9 + k);
    }
  }
  // tiny pockets filled; little islands floating in the air cleared
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
  // the galleries keep their floor where a cave ran under them: a plank floor (a bridge) over the gap
  for (const G of mnGalleries) for (let k = 0; k < G.len; k++) { const i = I(G.x0 + k, G.fy); if (!SOLID[tiles[i]] && !mnShafts.some(s => wdx(G.x0 + k - s.x0) >= 0 && wdx(G.x0 + k - s.x0) < s.w && s.top <= G.fy + 2 && s.bot > G.fy)) tiles[i] = MN_TABUA; }

  // ---------- 3. the shafts down from the ice: a timber collar in the ice floor, a planked shaft, a ladder ----------
  for (const E of mnExits) {
    const x0 = E.x0, y0 = E.fy, y1 = landY;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? WIC_NEGRO : WMN_TABUADO; }
      if (y >= y1 - 4) { for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); tiles[i] = AIR; mnKeep.add(i); } continue; }   // open on both sides into the landing gallery
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (!SOLID[tiles[i]] || y === y0) tiles[i] = y === y0 ? MN_VIGA : MN_TABUA; mnKeep.add(i); }   // collar and lining
      if ((y - y0) % 6 === 5) for (const x of [x0 - 1, x0 + 4]) tiles[I(x, y)] = MN_VIGA;   // a set of timbers every six rows
    }
    for (let x = x0 - 3; x <= x0 + 6; x++) { const i = I(x, y1); if (!SOLID[tiles[i]]) tiles[i] = MN_TABUA; mnKeep.add(i); }   // the floor at the foot
    for (let y = y0 - 2; y < y1; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = MN_ESCADA; mnKeep.add(i); } }
    for (let y = y0 - 3; y < y1; y++) for (let x = x0; x < x0 + 4; x++) mnKeep.add(I(x, y));
  }

  // ---------- 4. ore veins ----------
  const R4 = mulberry32(seed ^ 0x0de4);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !mnKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  const iron = t => t === MN_FERROSA || t === MN_REJEITO, quartz = t => t === MN_QUARTZITO;
  vein(MN_O_CARVAO, 90 * WSC, 0, 186, 3, 8, iron);   // coal in the mine (102); the crystal is a gem now, placed by 117 like the others
  vein(MN_O_COBALTO, 90 * WSC, 0, 186, 2, 5, t => quartz(t) || t === MN_FERROSA);   // cobalt, the mine's metal
}

function mnAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = MN_S0, YB = Math.min(WH - 8, S0 + MN_D), DB = YB - S0, nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s), R3 = mulberry32(seed ^ 0x3d3c1);
  const mb = m => Math.round(m * DB / MN_D);
  const mineRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!mineRow(y)) return; const i = I(x, y); if (mnKeep.has(i)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WMN_FERROSA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const mnSolid = t => SOLID[t] && MN_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const inBoss = (x, y, m = 1) => mnBoss && Math.abs(wdx(x - mnBoss.cx)) < mnBoss.w / 2 + m && y >= mnBoss.top - 1 - m && y <= mnBoss.fy;
  const shaftAt = (x, y) => mnShafts.find(s => wdx(x - s.x0) >= 0 && wdx(x - s.x0) < s.w && y >= s.top - 4 && y < s.bot);

  // ---------- 1. everything reachable from the two shafts ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of mnExits) flood(I(E.x0 + 2, E.fy - 1));
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
    if (!best) {   // nothing reached close by: a breadth-first search out through the rock to the nearest reached cell
      const org = new Int32Array(NN).fill(-1), q = []; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && !best; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 - 40) * WW || nb >= (YB - 1) * WW || org[nb] >= 0) continue;
          if (reach[nb] && !SOLID[tiles[nb]]) { const o = org[c]; best = [o % WW, (o / WW) | 0, nb % WW, (nb / WW) | 0]; break; }
          org[nb] = org[c]; q.push(nb);
        }
      }
      if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    }
    worm(best[0], best[1], best[2], best[3], 1.6, 0x36a0 + pass);
    flood(I(best[2], best[3]));
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 2. the furnaces in brick and slag, the camp's plank floors ----------
  for (const H of mnChambers) {
    if (H.kind === 'fornalha') {
      for (let y = H.top - 3; y <= H.fy + 2; y++) for (let x = H.x0 - 3; x <= H.x0 + H.w + 2; x++) {
        const i = I(x, y), t = tiles[i]; if (!mineRow(y) || mnKeep.has(i)) continue;
        if (!SOLID[t]) { if (y >= H.top - 1 && y < H.fy && walls[i]) walls[i] = WMN_TIJOLO; continue; }
        if (!MN_SOILS[t]) continue;
        let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (!SOLID[at(x + dx, y + dy)]) { near = true; break; }
        if (near) tiles[i] = y >= H.fy && hash2(W1(x), y, seed ^ 0x3e1) < 0.35 ? MN_ESCORIA : MN_TIJOLO;
      }
    } else if (H.kind === 'acampamento') {
      for (let y = Math.round(H.cy - H.h / 2) - 1; y <= Math.round(H.cy + H.h / 2) + 2; y++) for (let x = Math.round(H.cx - H.w / 2) - 1; x <= Math.round(H.cx + H.w / 2) + 1; x++) {
        const i = I(x, y), t = tiles[i]; if (!mineRow(y) || mnKeep.has(i)) continue;
        if (mnSolid(t) && at(x, y - 1) === AIR && nz(x, y, 20, 0x3e2) > 0.35) tiles[i] = MN_TABUA;   // plank floors laid by the goblins
        if (!SOLID[t] && walls[i] && nz(x, y, 14, 0x3e3) > 0.55) walls[i] = WMN_TABUADO;
      }
    }
  }

  // ---------- 3. the galleries: pick-marked walls, timber sets, rails, lanterns ----------
  for (const G of mnGalleries) {
    const rails = G.band !== 1 && R3() < 0.7, lamps = G.band <= 1 && R3() < 0.75, phase = (R3() * 7) | 0;
    for (let k = 1; k < G.len - 1; k++) {
      const x = G.x0 + k, fy = G.fy;
      let open = true; for (let y = fy - 4; y < fy; y++) if (SOLID[at(x, y)]) open = false;
      if (!open || !SOLID[at(x, fy)] || shaftAt(x, fy - 1)) continue;
      for (let y = fy - 4; y < fy; y++) { const i = I(x, y); if (walls[i] && !inBoss(x, y)) walls[i] = (k + phase) % 7 === 0 ? WMN_TABUADO : WMN_CAVADA; }
      if (!SOLID[at(x, fy - 5)] && !mnKeep.has(I(x, fy - 5))) { put(x, fy - 5, MN_VIGA); }   // the roof gave way into a cave: a beam bridges it (never over a shaft)
      const post = (k + phase) % 7 === 3 && SOLID[at(x, fy - 5)] && mnSolid(at(x, fy)) && at(x, fy - 1) === AIR && at(x, fy - 2) === AIR && at(x, fy - 3) === AIR && at(x, fy - 4) === AIR;
      if (post) {
        for (let y = fy - 4; y < fy; y++) put(x, y, MN_ESCORA);
        for (let dx = -1; dx <= 1; dx++) { const i = I(x + dx, fy - 5); if (MN_SOILS[tiles[i]] && !mnKeep.has(i)) tiles[i] = MN_VIGA; }   // the capping beam
        continue;
      }
      if (rails && at(x, fy - 1) === AIR) put(x, fy - 1, MN_TRILHO);
      if (lamps && (k + phase) % 14 === 10 && SOLID[at(x, fy - 5)] && at(x, fy - 4) === AIR && at(x, fy - 3) === AIR) put(x, fy - 4, MN_LAMPIAO);
    }
  }

  // ---------- 4. the shafts: a ladder down one side, scaffold platforms in the wide ones ----------
  for (const S of mnShafts) {
    const lx = S.x0 + 1;
    for (let y = S.top - 2; y < S.bot; y++) { const i = I(lx, y); if (!SOLID[tiles[i]] && !inBoss(lx, y)) { tiles[i] = MN_ESCADA; mnKeep.add(i); } }
    for (let y = S.top - 4; y < S.bot; y++) for (let x = S.x0; x < S.x0 + S.w; x++) { const i = I(x, y); if (!SOLID[tiles[i]] && walls[i] && y > S.top) walls[i] = WMN_TABUADO; }
    if (S.w >= 6) for (let y = S.top + 6, k = 0; y < S.bot - 4; y += 7, k++) {   // platforms jutting from the far side, every seven rows
      for (let x = S.x0 + 3; x < S.x0 + S.w; x++) { const i = I(x, y); if (tiles[i] === AIR) { tiles[i] = MN_TABUA; mnKeep.add(i); } }
      const wx = S.x0 + S.w; if (!SOLID[at(wx, y)]) put(wx, y, MN_VIGA);
    }
  }

  // ---------- 4b. a ladder at every drop too deep to jump back up (the miners left them everywhere) ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBoss(x, y, 3)) continue;   // somewhere to stand at the top
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;                                    // a short hop, or no floor below
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || at(lx + j, yy) === MN_ESCADA) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (mnKeep.has(i) || !walls[i]) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = MN_ESCADA; used.add(i); }
      }
    }
  }

  // ---------- 5. decorations ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i]) continue;
    const b = mineBand(y); if (b < 0 || b > 3 || inBoss(x, y, 2)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = mnSolid(dn) && BLOCKY[dn] && up === AIR, ceil = mnSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      if (b === 1 && q < 0.012 && at(x, y + 1) === AIR) { for (let j = 0, n = 3 + ((R3() * 6) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, MN_CORDA); continue; }   // a rope down from the roof
      if (b === 2 && q < 0.01 && at(x, y + 1) === AIR && at(x, y + 2) === AIR) put(x, y, MN_LAMPIAO);   // the goblins kept a few lamps
      continue;
    }
    if (!floor) continue;
    if (b === 0) { if (q < 0.03) put(x, y, MN_PEDRAS); else if (q < 0.045) put(x, y, MN_FERRAMENTA); else if (q < 0.05) put(x, y, BONES); }
    else if (b === 1) { if (q < 0.03) put(x, y, MN_PEDRAS); else if (q < 0.05) put(x, y, MN_FERRAMENTA); }
    else if (b === 2) { if (q < 0.025) put(x, y, MN_ESTACA); else if (q < 0.045) put(x, y, MN_PEDRAS); else if (q < 0.06) put(x, y, BONES); }
    else { if (q < 0.05 && (dn === MN_ESCORIA || dn === MN_TIJOLO)) put(x, y, MN_BRASA); else if (q < 0.065) put(x, y, MN_PEDRAS); else if (q < 0.072) put(x, y, MN_FERRAMENTA); }
  }

  // ---------- 7. the big props ----------
  mnPlaceProps();
}

/* ---------- props: on mine floors, under its roofs, against its walls ---------- */
/* ---------- climbing back out: from the deep places (the boss hall, every furnace hall) the hero must be
   able to get back up to the shafts. A walk-and-jump search (three blocks of jump, ladders climbed); where it tops
   out under open air that leads up to somewhere to stand, a ladder goes in, and the search runs again. ---------- */
// the shaft mouths last of all: whatever the ice's own clean-up packed back into the gap between the grotto and the
// collar is dug out again, and the ladder runs right up into the grotto
function mnExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of mnExits) {
    let top = E.fy; while (top > E.top && top > 2 && (SOLID[tiles[I(E.x0 + 1, top - 1)]] || SOLID[tiles[I(E.x0 + 2, top - 1)]] || tiles[I(E.x0 + 1, top - 1)] === MN_ESCADA)) top--;
    for (let y = Math.min(top, E.fy - 2); y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); if (tiles[i] !== MN_VIGA && tiles[i] !== MN_TABUA) tiles[i] = x === E.x0 + 1 ? MN_ESCADA : AIR; mnKeep.add(i); }
  }
  // and each grotto the shafts start from must be joined to the rest of the world (in the wide world one can end up
  // a sealed pocket of the ice): flood from the village, and dig a tunnel from a cut-off mouth to the nearest open ice
  const reach = new Uint8Array(WW * WH), st = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; st.push(s0); while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < WW * WH && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; st.push(nb); } } };
  flood(I(SPX, surf[SPX] - 2));
  for (const E of mnExits) {
    const sx = E.x0 + 1, sy = E.fy - 2; if (reach[I(sx, sy)]) continue;
    let best = null, bd = 1e9;
    for (let y = Math.max(2, sy - 60); y < MN_S0 - 2; y++) for (let dx = -120; dx <= 120; dx++) {
      const i = I(sx + dx, y); if (!reach[i]) continue;
      const d = Math.abs(dx) + Math.abs(y - sy) * 1.3; if (d < bd) { bd = d; best = [sx + dx, y]; }
    }
    if (!best) continue;
    const n = Math.ceil(Math.max(Math.abs(best[0] - sx), Math.abs(best[1] - sy))) * 2;
    for (let k = 0; k <= n; k++) {
      const x = Math.round(sx + (best[0] - sx) * k / n), y = Math.round(sy + (best[1] - sy) * k / n);
      for (let yy = y - 2; yy <= y; yy++) for (let xx = x - 1; xx <= x + 1; xx++) {
        const i = I(xx, yy), t = tiles[i];
        if (t === BEDROCK || t === IC_BARREIRA || t === MN_BARREIRA || mnKeep.has(i) || (typeof inYetiHall === 'function' && inYetiHall(W1(xx), yy, -3))) continue;
        if (SOLID[t]) tiles[i] = AIR;
      }
    }
    flood(I(sx, sy));
  }
  // a roof beam or plank laid over a gap can be the only way between two parts of the mine: take those out again
  const Y1 = Math.min(WH - 8, MN_S0 + MN_D);
  for (let sweep = 0, changed = true; changed && sweep < 50; sweep++) {
    changed = false;
    for (let i = (MN_S0 - 40) * WW; i < Y1 * WW; i++) {
      const t = tiles[i]; if ((t !== MN_VIGA && t !== MN_TABUA) || mnKeep.has(i)) continue;
      const x = i % WW, row = i - x, nb = [i - WW, i + WW, row + W1(x - 1), row + W1(x + 1)];
      if (nb.some(j => reach[j]) && nb.some(j => !reach[j] && !SOLID[tiles[j]])) { tiles[i] = AIR; flood(i); changed = true; }
    }
  }
}
function mnClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = MN_S0, YB = Math.min(WH - 8, S0 + MN_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => tiles[I(x, y)] === MN_ESCADA || tiles[I(x, y)] === MN_CORDA;
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  // good: states already known to lead out (the path of an earlier search that made it); ladders added later only
  // ever open more ways, so they stay good, and a later search stops as soon as it steps on one
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1)) y++; push(sx, y, 4);
    while (q.length) {
      if (hit >= 0) return win(hit);
      const r = q.pop(), yy = q.pop(), x = q.pop(); cur = ((yy - Y0) * WW + x) * 5 + r; if (yy <= S0 - 3) return win(cur);
      const gr = S(x, yy + 1) || L(x, yy);
      push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
      if (r > 0) push(x, yy - 1, L(x, yy) || L(x, yy - 1) ? 4 : r === 4 ? 3 : r - 1);
      if (!S(x, yy + 1)) push(x, yy + 1, L(x, yy + 1) ? 4 : 0);
    }
    return hit >= 0 ? win(hit) : false;
  };
  // the best ladder for a stuck search: from a reached floor straight up through air to a ledge it couldn't reach
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || mnKeep.has(I(x, y))) continue;   // a reached floor
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      // a plank floor overhead with room above it: cut through it
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        if (tiles[I(x, t)] === MN_TABUA && !mnKeep.has(I(x, t)) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best; for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || tiles[i] === MN_TABUA) tiles[i] = MN_ESCADA; }
    return true;
  };
  const starts = [];
  if (mnBoss) starts.push([mnBoss.cx - 6, mnBoss.fy - 1]);
  for (const c of mnChambers) if (c.kind === 'fornalha' || c.kind === 'acampamento') starts.push([Math.round(c.cx), Math.round(c.cy)]);
  let fixes = 0;
  for (const [x, y] of starts) { for (let k = 0; k < 12 && !search(W1(x), y); k++) { if (!repair()) break; fixes++; } }
  return fixes;
}

function mnPlaceProps() {
  if (typeof MN_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b2c5);
  const S0 = MN_S0, YB = Math.min(WH - 8, S0 + MN_D), used = new Uint8Array(WW * WH * 2);
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (x0 < 1 || x0 + tw >= WW - 1 || y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = y * WW + x, t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || mnKeep.has(i)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[(y * WW + x) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && MN_SOILS[t]; };
  const inBoss = (x, y) => mnBoss && Math.abs(wdx(x - mnBoss.cx)) < mnBoss.w / 2 + 2 && y >= mnBoss.top - 2 && y <= mnBoss.fy + 1;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = MN_BAND_NAMES[clamp(mineBand(y), 0, 3)], plan = MN_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y), t = tiles[i]; if ((t !== AIR && !(kind === 'chao' && t === MN_TRILHO)) || inBoss(k, y)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 2.2 + R())), tries = n * 5;   // the posts cut the galleries into short stretches
          while (n > 0 && tries-- > 0) {
            const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (how === 'chao') {
              const y0 = y + 1 - th; let rail = 0; for (let k = px; k < px + tw; k++) if (tiles[I(k, y)] === MN_TRILHO) rail++;
              if (def.trilho ? rail < tw : rail > 0) continue;   // carts stand on the rails; everything else off them
              let clear = true; for (let yy = y0; yy < y0 + th && clear; yy++) for (let xx = px; xx < px + tw; xx++) { const i = yy * WW + xx, t = tiles[i]; if (used[i * 2] || (t !== AIR && !(yy === y && t === MN_TRILHO)) || !walls[i] || mnKeep.has(i)) { clear = false; break; } }
              if (!clear) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!MN_BACK_FLOOR[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
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

{ const _bc = buildCathedral; buildCathedral = function () { _bc(); if (MINA) { mnBuild(); mnAfter(); } }; }

/* ---------- the far layer behind the mine ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!MINA) return;
  for (let y = MN_S0 - 4; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - MN_S0) + (depthNz(x, y, 25, seed ^ 0x3e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x3e12);
    DEEPT[i] = d < 46 ? (n > 0.62 ? DP_MN_ANDAIME : DP_MN_ROCHA) : d < 98 ? (n > 0.45 ? DP_MN_ANDAIME : DP_MN_ROCHA) : d < 150 ? (n > 0.7 ? DP_MN_ANDAIME : DP_MN_ROCHA) : (n > 0.5 ? DP_MN_FORNALHA : DP_MN_ROCHA);
  }
}; }

/* ---------- zones, names, spawns ---------- */
ZONE_NAMES.push('Galerias Escoradas', 'Poços e Andaimes', 'Acampamento Goblin', 'Fornalhas Esquecidas');
ZONE_SUB.push('as escoras ainda rangem', 'cada degrau desce mais', 'os goblins chegaram depois', 'o fogo nunca apagou de todo');
{ const _cz = cathZone; cathZone = function (tx, ty) { if (MINA && ty >= MN_S0) return MN_ZONE0 + clamp(mineBand(ty), 0, 3); return _cz(tx, ty); }; }
Object.assign(CATH_SPAWN, {
  [MN_ZONE0]: [[['mineiro', 0.3], ['carrinho', 0.15], ['gatuno', 0.2], ['grisu', 0.15], ['lampiao', 0.2]], 8],
  [MN_ZONE0 + 1]: [[['mineiro', 0.2], ['gatuno', 0.15], ['lampiao', 0.15], ['falsoveio', 0.15], ['toupeira', 0.15], ['grisu', 0.2]], 9],
  [MN_ZONE0 + 2]: [[['gatuno', 0.25], ['goblin', 0.25], ['capataz', 0.15], ['carrinho', 0.15], ['toupeira', 0.2]], 9],
  [MN_ZONE0 + 3]: [[['golem', 0.25], ['goblin', 0.15], ['capataz', 0.15], ['falsoveio', 0.15], ['lampiao', 0.15], ['grisu', 0.15]], 10]
});
// levels: 9-10 (layerLvl in 52), 30% of them one higher but never past 10
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!MINA || e.boss || D.boss || e.mnMinion) return e;
  const d = Math.floor((py + e.h) / T) - MN_S0;
  if (d >= 0) {
    const lvl = layerLvl(9, d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }

/* ---------- glows: lanterns, embers, crystal and gold in the quartzite ---------- */
const MN_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!MN_GLOW.l) { MN_GLOW.l = glow(22, '#ffa040'); MN_GLOW.b = glow(14, '#ff6a1a'); MN_GLOW.o = glow(16, '#a07ae8'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== MN_LAMPIAO && t !== MN_BRASA && t !== MN_O_CRISTAL) continue;
    const gx = emitters[i], gy = emitters[i + 1];
    if (t === MN_LAMPIAO) { lc.globalAlpha = 0.3 + Math.sin(gameTime * 7 + gx * 1.3) * 0.03 + Math.sin(gameTime * 13 + gy) * 0.02; lc.drawImage(MN_GLOW.l, gx * T + 6 - cx - 22, gy * T + 7 - cy - 22); continue; }
    if (t === MN_BRASA) { lc.globalAlpha = 0.22 + Math.sin(gameTime * 1.6 + gx) * 0.06; lc.drawImage(MN_GLOW.b, gx * T + 6 - cx - 14, gy * T + 9 - cy - 14); continue; }
    lc.globalAlpha = 0.16 + Math.sin(gameTime * 2 + gx) * 0.05; lc.drawImage(MN_GLOW.o, gx * T + 6 - cx - 16, gy * T + 6 - cy - 16);
  }
  lc.globalAlpha = 1;
});
// grit trickling from the old roofs, embers drifting up in the furnaces, and far off a pick that nobody swings
let mnPickT = 6;
HOOK.update.push(dt => {
  if (!MINA || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = mineBand(pty); if (b < 0 || b > 3) return;
  if (Math.random() < dt * (b === 0 ? 3 : 1.5)) {
    const x = cam.x + Math.random() * VW, tx = Math.floor(x / T); let ty = Math.floor((cam.y + Math.random() * VH * 0.6) / T);
    for (let k = 0; k < 12 && !solidAt(tx, ty - 1); k++) ty--;
    if (solidAt(tx, ty - 1) && !solidAt(tx, ty) && wallAt(tx, ty)) for (let k = 0; k < 3; k++) parts.push({ x: tx * T + rnd(1, 11), y: ty * T + rnd(0, 2), vx: rnd(-3, 3), vy: rnd(10, 30), g: 260, life: 1.2, max: 1.2, col: Math.random() < 0.5 ? '#5a4a40' : '#3e322c', size: 1 });
  }
  if (b === 3 && Math.random() < dt * 8) { const x = cam.x + Math.random() * VW, y = cam.y + VH * (0.4 + Math.random() * 0.6); if (!solidAt(Math.floor(x / T), Math.floor(y / T))) parts.push({ x, y, vx: rnd(-8, 8), vy: rnd(-26, -12), g: -4, life: 1.8, max: 1.8, col: Math.random() < 0.6 ? '#ff8a20' : '#ffd27a', size: 1, glow: true }); }
  if ((mnPickT -= dt) <= 0) { mnPickT = 9 + Math.random() * 16; if (b <= 1) sfx.mnPicks(); }
});
Object.assign(sfx, {
  mnPicks() { for (let k = 0, n = 2 + ((Math.random() * 3) | 0); k < n; k++) setTimeout(() => { tone(1900 + Math.random() * 300, 0.06, 'square', 0.012, -600); noise(0.05, 0.015, 3200, 'bandpass'); }, k * (420 + Math.random() * 120)); }
});

/* ---------- the village: shops and the elder's tasks for the new materials (82, 83 add the items) ---------- */
Object.assign(MAT_VAL, { engrenagem: 12, pepita: 16, nucleo_minerio: 22, oleo_lampiao: 10 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'oleo_lampiao'; c.hint = c.hint.replace(/\.$/, '') + ' e óleo de lampião.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['engrenagem', 'pepita', 'nucleo_minerio'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', engrenagens, pepitas e núcleos de minério.'; }
BOUNTIES.push(
  [4, 'pepita', 5, 'Pepitas de ouro da mina velha. Se os goblins roubaram, os goblins devolvem.', 'O ouro da mina'],
  [4, 'engrenagem', 4, 'Engrenagens dos carrinhos de lá de baixo. O Grimaldo quer ver como os antigos faziam.', 'Ferro que gira'],
  [4, 'nucleo_minerio', 2, 'O coração de um golem de minério. Dizem que ainda está quente. Traga com luva.', 'Um coração de pedra']
);
Object.assign(ORE_WHERE, { min_cristal: 'Pedra preciosa, rara, da Mina Abandonada', min_ouro: 'Minério do fundo das cavernas, da catedral, do gelo e da mina', min_ferro: 'Minério das cavernas, abaixo de 35 m, do gelo e da rocha ferrosa da mina', carvao: 'Veios pretos em todas as cavernas e na mina, ou com o Odo' });

/* ---------- the save: worlds from before the mine are remade; level, items, gold and the chest stay ---------- */
let mineNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (MINA) o.wg = 5; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!MINA || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 5) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
    mineNews = !!v.p && v.wrap === 1;
  }
  v.wg = 4; const r = _ms(v); if (r) r.wg = 5; return r;   // 73 knows world 4
}; }
HOOK.update.push(() => {
  if (mineNews && state === 'play') { mineNews = false; setTimeout(() => toast('Novidade: debaixo das Cavernas de Gelo agora há a Mina Abandonada, tomada pelos goblins, com um chefe no fundo. O mundo foi refeito para ela; seu nível, itens e ouro continuam.', 'gold'), 900); }
});
