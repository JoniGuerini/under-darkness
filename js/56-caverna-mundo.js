'use strict';

/* ================= the caves: the world between the village and the cathedral =================
   generate() (06) runs buildCathedral() at its end; with CAVERNA on, that call is wrapped here:
     cvBuild()   before the cathedral: the rock from the village floor down to CB_S0 (damp earth, cave rock,
                 schist, limestone, blended by noise), the caves carved into it (cellular automaton for the
                 organic shape, plus grottos, great halls, nest chambers and the Mãe-Teia's chamber, joined by
                 worm tunnels and shafts), two or three natural mouths in the hills, the ore veins, and the two
                 grottos in the Fundações whose right wall the cathedral (45) opens onto a ruined stairway
     cathedral   45-catedral-mundo builds the cathedral under CB_S0 and the portal stairway (14 m of masonry)
     cvAfter()   the portal stairway fades into earth and ends in a grotto, everything is made reachable from
                 the portal, then the dressing: moss, flowstone, web, the decorations, old torches, chests, props
   Also here: the far layer of the caves, the zones (9..12) and their names, spawn tables, monster levels
   and loot by real depth, decorations that fall when what holds them breaks, glows, the shops and the
   elder's tasks for the new materials, and the save (wg 3: old worlds are remade, the hero keeps the rest). */

let cvChambers = [], cvBoss = null, cvMouths = [];
const CV_SOILS = new Uint8Array(NT);   // natural cave ground: what decorations and props may sit on
for (const t of [CV_TERRA, CV_ARGILA, CV_ROCHA, CV_MUSGO, CV_CALCITA, CV_CASCALHO, CV_XISTO, CV_TEIA, CV_O_CARVAO, CV_O_COBRE, CV_O_FERRO, CV_O_OURO, DIRT, CT_CALCARIO, CT_CALC_TERRA]) CV_SOILS[t] = 1;

function cvBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = surf[SPX], YB = S0 + CAVE_D; CV_S0 = S0;
  const R = mulberry32(seed ^ 0xca7e5), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const db = (x, y) => y - S0 + (nz(x, y, 30, 0xb1) - 0.5) * 9;   // band depth, its borders wobble
  const bandAt = (x, y) => { const d = db(x, y); return d < 60 ? 0 : d < 120 ? 1 : d < 168 ? 2 : 3; };
  const nearVil = x => Math.abs(wdx(W1(x) - SPX)) <= VIL_HALF + 6;
  const portalX = SPX + VIL_HALF + 5, nearPortal = x => { const d = wdx(W1(x) - portalX); return d > -8 && d < 34; };
  const minY = x => surf[W1(x)] + (nearVil(x) || nearPortal(x) ? 15 : 8);   // keep a solid crust under the village and the portal
  const canCarve = (x, y) => y >= minY(x) && y <= YB - 3;
  cvChambers = []; cvBoss = null; cvMouths = []; caveExits = []; cavePortalEnd = null;

  // ---------- 1. the rock ----------
  for (let x = 0; x < WW; x++) {
    const sx = surf[x];
    for (let y = sx; y < YB; y++) {
      const i = y * WW + x, dl = y - sx;
      if (dl < 4) { if (!SOLID[tiles[i]] && y > sx) tiles[i] = DIRT; continue; }   // the surface crust stays as the village made it
      const d = db(x, y), b = d < 60 ? 0 : d < 120 ? 1 : d < 168 ? 2 : 3, n1 = nz(x, y, 34, 0xa1), n2 = nz(x, y, 18, 0xa2), n3 = nz(x, y, 50, 0xa3);
      let t, w;
      if (dl < 7) { t = DIRT; w = WCV_TERRA; }
      else if (b === 0) {
        const k = clamp((d - 12) / 48, 0, 1);
        t = n1 > 0.74 - k * 0.32 ? CV_ROCHA : n2 > 0.66 ? CV_ARGILA : n3 > 0.82 ? CV_CASCALHO : CV_TERRA;
        w = t === CV_ROCHA ? WCV_ROCHA : WCV_TERRA;
      } else if (b === 1) {
        t = n1 < 0.3 - (d - 60) / 60 * 0.18 ? CV_TERRA : n2 > 0.72 ? CV_CALCITA : n3 > 0.84 ? CV_CASCALHO : n2 < 0.14 ? CV_ARGILA : CV_ROCHA;
        w = t === CV_TERRA ? WCV_TERRA : nz(x, y, 14, 0xa4) > 0.64 ? WCV_CALCITA : WCV_ROCHA;
      } else if (b === 2) {
        t = n1 > 0.66 ? CV_ROCHA : n3 > 0.86 ? CV_CASCALHO : CV_XISTO;
        w = WCV_XISTO;
      } else {
        const p = clamp((d - 168) / 18, 0, 1);
        t = nz(x, y, 40, 0xa5) < 0.12 + p * 0.9 ? (n2 > 0.62 ? CT_CALC_TERRA : CT_CALCARIO) : n1 > 0.45 ? CV_ROCHA : CV_XISTO;
        w = t === CT_CALCARIO || t === CT_CALC_TERRA ? WCT_CALCARIO : WCV_ROCHA;
      }
      tiles[i] = t; walls[i] = w;
    }
  }

  // ---------- 2. the caves ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN);   // keep: carved on purpose, the automaton leaves it open
  const P0 = [0.37, 0.39, 0.3, 0.33];
  for (let x = 0; x < WW; x++) for (let y = minY(x); y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0xc1), streak = nz(x, y, 60, 0xc2);
    cv[y * WW + x] = R() < P0[bandAt(x, y)] + (reg - 0.5) * 0.5 + (streak - 0.5) * 0.12 ? 1 : 0;
  }
  const y0 = S0 - 20 > 2 ? S0 - 20 : 2;
  for (let it = 0; it < 5; it++) {
    for (let y = y0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (!canCarve(x, y)) { tmp[i] = 0; continue; }
      let s1 = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!cv[(y + dy) * WW + W1(x + dx)]) s1++;
      let solid = s1 >= 5;
      if (it < 2) { let s2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!cv[(y + dy) * WW + W1(x + dx)]) s2++; if (s2 <= 2) solid = true; }
      tmp[i] = solid ? 0 : 1;
    }
    for (let y = y0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) cv[y * WW + x] = tmp[y * WW + x];
  }
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); cv[i] = 1; keep[i] = 1; };
  // a room of organic shape: an ellipse with a wobbling edge, its floor flattened
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.4) dig(x, y);
    }
  };
  // a worm tunnel between two points: wanders, never narrower than r
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.3 + Math.sin(n * 0.11 + s) * 0.35;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;   // tunnels run more across than down
      const rr = r + Math.sin(n * 0.21 + s) * 0.35;
      for (let dy = -Math.ceil(rr); dy <= Math.ceil(rr); dy++) for (let dx = -Math.ceil(rr) - 1; dx <= Math.ceil(rr) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= rr * rr) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const overlaps = (cx, cy, w, h) => cvChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + 5 && Math.abs(c.cy - cy) < (c.h + h) / 2 + 4);
  // chambers per band: [count, wMin, wMax, hMin, hMax, top metre, bottom metre]
  const PLAN = [[16, 8, 18, 5, 9, 12, 56], [8, 20, 45, 10, 22, 66, 116], [9, 12, 24, 7, 12, 124, 162], [7, 10, 20, 5, 8, 171, 180]];
  // the Mãe-Teia's chamber first: in the Ninho, across the world from the village
  {
    const w = 34, h = 14, cx = W1(SPX + (WW >> 1) + ((R() - 0.5) * 40 | 0)), fy = S0 + 158, x0 = cx - (w >> 1), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(3 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2)); if (y >= top + arch) dig(x, y); }
    cvBoss = { x0: W1(x0), x1: W1(x0 + w - 1), w, top, fy, cx };
    cvChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 2, boss: true });
  }
  PLAN.forEach(([n0, wa, wb, ha, hb, d0, d1], band) => {
    const n = n0 * WSC;
    for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
      const w = wa + ((R() * (wb - wa + 1)) | 0), h = ha + ((R() * (hb - ha + 1)) | 0), cx = (R() * WW) | 0, cy = S0 + d0 + h / 2 + R() * Math.max(0, d1 - d0 - h);
      if (overlaps(cx, cy, w, h) || cy - h / 2 < minY(cx) + 1) continue;
      blob(cx, cy, w, h, 0x900 + band * 40 + k, band === 1 ? 1.9 : 1.6); cvChambers.push({ cx, cy, w, h, band }); k++;
    }
  });
  // worm tunnels: along each band round the world, and a few between bands
  const RAD = [1.5, 1.9, 1.4, 1.6];
  for (let b = 0; b < 4; b++) {
    const L = cvChambers.filter(c => c.band === b).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) { const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue; worm(A.boss ? A.cx - A.w / 2 : A.cx, A.boss ? cvBoss.fy - 2 : A.cy + A.h * 0.2, B.boss ? B.cx + B.w / 2 : B.cx, B.boss ? cvBoss.fy - 2 : B.cy + B.h * 0.2, RAD[b], 0x700 + b * 50 + k); }
  }
  for (let b = 0; b < 3; b++) {
    const U = cvChambers.filter(c => c.band === b && !c.boss), D = cvChambers.filter(c => c.band === b + 1 && !c.boss);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      worm(A.cx, A.cy, B.cx, B.cy, RAD[b] + 0.2, 0x7f0 + b * 9 + k);
    }
  }
  // the Galerias' shafts: straight down out of a hall floor
  for (const H of cvChambers.filter(c => c.band === 1).slice(0, 4 * WSC)) {
    const x = Math.round(H.cx + (R() - 0.5) * H.w * 0.5), ya = Math.round(H.cy), yb = Math.min(YB - 6, ya + 16 + ((R() * 16) | 0));
    for (let y = ya; y <= yb; y++) { const xx = x + Math.round(Math.sin(y * 0.3) * 0.8); for (let dx = -1; dx <= 1; dx++) dig(xx + dx, y); }
  }
  // the way down: two grottos in the Fundações; the cathedral opens a stairway out of each one's right-hand wall
  for (const off of [100 + ((R() * 20) | 0), -(90 + ((R() * 20) | 0))]) {
    const gx = W1(SPX + off), gy = YB - 3, x0 = gx - 13;
    for (let x = x0; x < gx; x++) {
      const k = x - x0, top = gy - 6 + (k < 3 ? 3 - k : 0) + (hash2(x, gy, seed) < 0.3 ? 1 : 0) * (k < 10 ? 1 : 0);
      for (let y = top; y < gy; y++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      tiles[I(x, gy)] = CV_ROCHA; tiles[I(x, gy + 1)] = CV_ROCHA;
    }
    caveExits.push([gx, gy]);
    const near = cvChambers.filter(c => c.band >= 2 && !c.boss).reduce((m, c) => !m || Math.hypot(wdx(c.cx - gx), c.cy - gy) < Math.hypot(wdx(m.cx - gx), m.cy - gy) ? c : m, null);
    if (near) worm(x0 + 2, gy - 2, near.cx, near.cy, 1.6, 0x7a0 + off);
  }
  // natural mouths in the hills, far from the village: a sloping tunnel down into the first caves
  for (let k = 0, tries = 0; k < 3 && tries < 40; tries++) {
    const mx = W1(SPX + (R() < 0.5 ? 1 : -1) * (VIL_HALF + 40 + ((R() * 80) | 0)));
    if (nearPortal(mx) || cvMouths.some(m => Math.abs(wdx(m[0] - mx)) < 50)) continue;
    const dir = R() < 0.5 ? 1 : -1, sy = surf[mx];
    for (let s = 0; s < 30; s++) {
      const x = Math.round(mx + dir * s * 0.75 + Math.sin(s * 0.3) * 1.2), y = Math.round(sy - 1 + s * 0.72), r = s < 3 ? 1.2 : 1.6;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx / 1.5 + dy * dy <= r * r) { const i = I(x + dx, y + dy); if (y + dy >= sy - 1) { cv[i] = 1; keep[i] = 1; } }
    }
    const ex = mx + dir * 22, ey = sy + 21, near = cvChambers.filter(c => c.band === 0).reduce((m, c) => !m || Math.hypot(wdx(c.cx - ex), c.cy - ey) < Math.hypot(wdx(m.cx - ex), m.cy - ey) ? c : m, null);
    if (near) worm(ex, ey, near.cx, near.cy, 1.5, 0x7c0 + k);
    cvMouths.push([mx, sy]); k++;
  }
  // tiny pockets the automaton left alone get filled back in
  {
    const lab = new Int32Array(NN).fill(-1), st = [];
    for (let i0 = 0; i0 < NN; i0++) {
      if (!cv[i0] || lab[i0] >= 0) continue;
      const comp = []; lab[i0] = i0; st.push(i0);
      while (st.length) { const c = st.pop(), x = c % WW, row = c - x; comp.push(c); for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && cv[nb] && lab[nb] < 0) { lab[nb] = i0; st.push(nb); } }
      if (comp.length < 14 && !comp.some(c => keep[c])) for (const c of comp) cv[c] = 0;
    }
    // and little islands of rock floating in the air are cleared away
    const sl = new Uint8Array(NN);
    for (let y = 0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) {
      const i0 = y * WW + x; if (cv[i0] || sl[i0] || !canCarve(x, y)) continue;
      const comp = []; let open = true; sl[i0] = 1; st.push(i0);
      while (st.length) { const c = st.pop(), cx = c % WW, cy = (c / WW) | 0, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN || cv[nb] || sl[nb]) continue; const nx = nb % WW, ny = (nb / WW) | 0; if (!canCarve(nx, ny)) { open = false; continue; } sl[nb] = 1; st.push(nb); } if (comp.length > 40) open = false; }
      if (open && comp.length < 24) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = 0; i < NN; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 3. ore veins in the cave rock (the rock right around a vein turns to stone) ----------
  const R4 = mulberry32(seed ^ 0x0ca7e);
  const host = t => t === CV_TERRA || t === CV_ROCHA || t === CV_XISTO || t === CV_ARGILA || t === CV_CASCALHO || t === CT_CALCARIO;
  const vein = (ore, n, d0, d1, lmin, lmax) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + d0 + ((R4() * (d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y > surf[W1(x)] + 7 && y < YB - 1) {
          tiles[i] = ore;
          for (const nb of [i - 1, i + 1, i - WW, i + WW]) if ((tiles[nb] === CV_TERRA || tiles[nb] === CV_ARGILA) && R4() < 0.7) tiles[nb] = CV_ROCHA;
        }
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), 2, YB - 2);
      }
    }
  };
  vein(CV_O_CARVAO, 150 * WSC, 6, 186, 3, 7); vein(CV_O_COBRE, 150 * WSC, 6, 186, 2, 6);   // only coal and copper up here (102: one metal per layer)
}

function cvAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = CV_S0, YB = S0 + CAVE_D, nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s), R = mulberry32(seed ^ 0xca7e6);
  const caveRow = (x, y) => y >= surf[W1(x)] + 4 && y < YB - 1;
  const dig = (x, y) => { if (!caveRow(x, y) || y < surf[W1(x)] + 8) return; const i = I(x, y); if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const caveSolid = t => SOLID[t] && CV_SOILS[t];

  // ---------- 1. the portal stairway: masonry for the first steps, then earth, then a grotto ----------
  const ex = SPX + VIL_HALF + 5, ey = surf[W1(ex)];
  if (cavePortalEnd) {
    const [sx2, sy2] = cavePortalEnd;
    for (let y = ey + 2; y <= sy2 + 3; y++) for (let x = ex - 4; x <= ex + 52; x++) {
      const i = I(x, y), t = tiles[i], k = clamp((y - ey - 2) / 12, 0, 1), h = hash2(W1(x), y, seed ^ 0x5f1);
      if (t >= CT_CALCARIO && t <= CT_ARDOSIA && SOLID[t] && t !== CT_COLUNA && h < k * 1.15 - 0.1) tiles[i] = y - surf[W1(x)] < 7 ? DIRT : CV_TERRA;
      if (walls[i] >= WCT_CALCARIO && walls[i] <= WCT_MARMORE && hash2(W1(x), y, seed ^ 0x5f2) < k * 1.2 - 0.1) walls[i] = WCV_TERRA;
    }
    // the steps run out in a grotto, and the grotto opens on the caves
    const gx = sx2 + 5, gy = sy2 - 3;
    for (let y = gy - 5; y <= sy2 - 1; y++) for (let x = sx2 - 1; x <= sx2 + 12; x++) {
      const dx = (x + 0.5 - gx) / 7.5, dy = (y + 0.5 - gy) / (y > gy ? 3.4 : 4.4);
      if (dx * dx + dy * dy < 1 + (hash2(W1(x), y, seed ^ 0x5f3) - 0.5) * 0.3) { const i = I(x, y); if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WCV_TERRA; }
    }
    for (let x = sx2 - 1; x <= sx2 + 12; x++) { const i = I(x, sy2); if (!SOLID[tiles[i]]) tiles[i] = CV_TERRA; }
    let best = null, bd = 1e9;
    for (let y = sy2 - 6; y < sy2 + 40; y++) for (let dx = -10; dx <= 50; dx++) {
      const x = gx + dx, i = I(x, y); if (tiles[i] !== AIR || !caveRow(x, y) || (dx < 10 && Math.abs(y - gy) < 7)) continue;
      const d = Math.abs(dx) + Math.abs(y - gy) * 1.3; if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) worm(gx + 6, sy2 - 2, best[0], best[1], 1.6, 0x5f4);
  }

  // ---------- 2. everything reachable from the portal ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0) => { if (reach[s0]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  flood(I(ex + 1, ey - 2));
  for (let pass = 0; pass < 60 * WSC; pass++) {
    // the biggest cave pocket still cut off
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !caveRow(x, y) || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 20 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
    // the nearest reached spot to any of its tiles (a sample of them), and a tunnel across
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx += 1) {
        const y = cy + dy; if (y < 2 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || y < surf[W1(cx + dx)] + 6) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }   // nothing near: leave it as a pocket for the pickaxe
    worm(best[0], best[1], best[2], best[3], 1.5, 0x6a0 + pass);
    flood(I(best[2], best[3]));
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 3. the walls of the caves: moss where it is damp, flowstone in the galleries, web in the nest ----------
  const R3 = mulberry32(seed ^ 0xd3c1);
  const airNext = i => tiles[i - 1] === AIR || tiles[i + 1] === AIR || tiles[i - WW] === AIR || tiles[i + WW] === AIR;
  for (let y = S0 + 6; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x, t = tiles[i], b = caveBand(y); if (y < surf[x] + 8) continue;
    if (b <= 1 && t === CV_ROCHA && airNext(i) && nz(x, y, 22, 0xd2) > 0.6) tiles[i] = CV_MUSGO;
    else if (b === 1 && t === CV_ROCHA && airNext(i) && nz(x, y, 16, 0xd3) > 0.66) tiles[i] = CV_CALCITA;
    else if (b === 2 && (t === CV_XISTO || t === CV_ROCHA) && (tiles[i + WW] === AIR || tiles[i - 1] === AIR || tiles[i + 1] === AIR) && tiles[i - WW] !== AIR && nz(x, y, 26, 0xd4) > 0.5 && R3() < 0.55) tiles[i] = CV_TEIA;   // on walls and roofs, never the floor you walk on
    if (b === 2 && walls[i] === WCV_XISTO && nz(x, y, 20, 0xd5) > 0.55) walls[i] = WCV_TEIA;
  }

  // ---------- 4. decorations, old torches ----------
  const put = (x, y, t) => { tiles[I(x, y)] = t; };
  const at = (x, y) => tiles[I(x, y)];
  for (let y = S0 + 6; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || y < surf[x] + 9) continue;
    const b = caveBand(y), dn = tiles[i + WW], up = tiles[i - WW], l = tiles[y * WW + W1(x - 1)], r = tiles[y * WW + W1(x + 1)], q = R3();
    const floor = caveSolid(dn) && BLOCKY[dn] && up === AIR, ceil = caveSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil && (SOLID[l] || SOLID[r]) && q < (b === 2 ? 0.5 : 0.1)) { put(x, y, R3() < 0.5 ? CV_FIOS : WEB); continue; }
    if (ceil) {
      const soft = up === CV_TERRA || up === DIRT || up === CV_ARGILA;
      if (b === 0 && soft && q < 0.09) { for (let j = 0, n = 1 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, CV_RAIZES); continue; }
      const stal = [0.02, 0.08, 0.06, 0.05][b];
      if (q < stal && !soft) { for (let j = 0, n = 1 + ((R3() * (b === 1 ? 3 : 2)) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, CV_ESTALACTITE); continue; }
      if (q < stal + [0, 0.008, 0.04, 0.012][b] && at(x, y + 1) === AIR && at(x, y + 2) === AIR) { put(x, y, CV_CASULO); continue; }
      continue;
    }
    if (!floor) continue;
    const rockish = dn === CV_ROCHA || dn === CV_MUSGO || dn === CV_XISTO || dn === CV_CALCITA || dn === CT_CALCARIO;
    if (b === 0) {
      if (q < 0.035 && dn !== CV_CASCALHO) put(x, y, CV_COGUMELO);
      else if (q < 0.045) put(x, y, SHROOM);
      else if (q < 0.085) put(x, y, CV_SEIXOS);
      else if (q < 0.091) put(x, y, BONES);
      else if (q < 0.0945 && l === AIR && r === AIR) put(x, y, TORCH);
    } else if (b === 1) {
      if (q < 0.05 && rockish && at(x, y - 1) === AIR) { put(x, y, CV_ESTALAGMITE); if (R3() < 0.4 && at(x, y - 2) === AIR && at(x, y - 3) === AIR) put(x, y - 1, CV_ESTALAGMITE); }
      else if (q < 0.08) put(x, y, CV_SEIXOS);
      else if (q < 0.09 && rockish) put(x, y, CV_DRUSA);
      else if (q < 0.1) put(x, y, SHROOM);
      else if (q < 0.105) put(x, y, BONES);
    } else if (b === 2) {
      if (q < 0.035) put(x, y, BONES);
      else if (q < 0.055) put(x, y, CV_SEIXOS);
      else if (q < 0.07 && rockish) put(x, y, CV_ESTALAGMITE);
      else if (q < 0.075 && rockish) put(x, y, CV_DRUSA);
    } else {
      if (q < 0.04) put(x, y, CV_SEIXOS);
      else if (q < 0.055) put(x, y, BONES);
      else if (q < 0.075 && rockish) put(x, y, CV_ESTALAGMITE);
      else if (q < 0.082 && typeof CT_CACOS !== 'undefined') put(x, y, CT_CACOS);
    }
  }
  // a few narrow nest tunnels plugged with a wall of solid web (it breaks in a blink)
  {
    let n = 0;
    for (let tries = 0; tries < 4000 * WSC && n < 14 * WSC; tries++) {
      const x = (R3() * WW) | 0, y = S0 + 124 + ((R3() * 42) | 0), i = I(x, y);
      if (tiles[i] !== AIR || !SOLID[at(x, y + 1)]) continue;
      let h = 0; while (h < 5 && at(x, y - h) === AIR) h++;
      if (h < 2 || h > 4 || !SOLID[at(x, y - h)] || SOLID[at(x - 1, y)] || SOLID[at(x + 1, y)] || at(x - 1, y) !== AIR || at(x + 1, y) !== AIR) continue;
      if (cvBoss && Math.abs(wdx(x - cvBoss.cx)) < cvBoss.w / 2 + 8 && Math.abs(y - cvBoss.fy) < 20) continue;
      for (let k = 0; k < h; k++) put(x, y - k, CV_TEIA);
      n++;
    }
  }

  // ---------- 6. the big props ----------
  cvPlaceProps();
}

/* ---------- props: on cave floors, under cave roofs, against the cave walls ---------- */
function cvPlaceProps() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9a0c5);
  const S0 = CV_S0, YB = S0 + CAVE_D, used = new Uint8Array(WW * WH * 2);
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (x0 < 1 || x0 + tw >= WW - 1 || y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = y * WW + x, t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i]) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[(y * WW + x) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && CV_SOILS[t]; };
  for (let y = S0 + 8; y < YB - 2; y++) {
    const band = CV_BAND_NAMES[clamp(caveBand(y), 0, 3)], plan = CV_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      // runs of floor (air over cave ground) or of roof (air under it) along this row
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || y < surf[W1(k)] + 10) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
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
              if (!fits(px, y, tw, th + 3, 0, true)) continue;   // room to walk under it
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!CV_BACK_FLOOR[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
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

{ const _bc = buildCathedral; buildCathedral = function () { if (CAVERNA) cvBuild(); _bc(); if (CAVERNA) cvAfter(); }; }

/* ---------- the far layer behind the caves ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!CAVERNA) return;
  const S0 = CV_S0, YB = S0 + CAVE_D;
  for (let y = 0; y < YB; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i] || y < surf[x] + 3) continue;
    const d = y - S0 + (depthNz(x, y, 25, seed ^ 0xe11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0xe12);
    DEEPT[i] = d < 60 ? (n > 0.7 ? DP_CV_ROCHA : DP_CV_TERRA) : d < 120 ? (n > 0.6 ? DP_CV_ESTALAC : DP_CV_ROCHA) : d < 168 ? (n > 0.45 ? DP_CV_TEIA : DP_CV_ROCHA) : d < 178 ? DP_CV_ROCHA : DP_CT_CALCARIO;
  }
}; }

/* ---------- zones, names, spawns ---------- */
ZONE_NAMES.push('Grutas Rasas', 'Galerias de Pedra', 'O Ninho', 'Fundações Soterradas');
ZONE_SUB.push('a terra ainda respira aqui', 'o eco responde de longe', 'tudo aqui está preso em alguma coisa', 'pedra lavrada onde não devia haver');
{ const _cz = cathZone; cathZone = function (tx, ty) { if (CAVERNA && ty < CV_S0 + CAVE_D) return CV_ZONE0 + clamp(caveBand(ty), 0, 3); return _cz(tx, ty); }; }
Object.assign(CATH_SPAWN, {
  9: [[['slime', 0.35], ['bat', 0.3], ['rato', 0.35]], 6],
  10: [[['bat', 0.2], ['slime', 0.15], ['rato', 0.15], ['aranha', 0.25], ['besouro', 0.25]], 7],
  11: [[['aranha', 0.35], ['cuspideira', 0.3], ['besouro', 0.15], ['bat', 0.1], ['filhote', 0.1]], 8],
  12: [[['aranha', 0.25], ['cuspideira', 0.2], ['besouro', 0.25], ['bat', 0.15], ['rato', 0.15]], 8]
});
// loot by real depth: Grutas and Galerias 1, Ninho and Fundações 2; in the cathedral Átrio and Nave 2, Claustro 3, Criptas 4
{ const _lz = lootZone; lootZone = function (tx, ty) { const z = zoneAt(tx, ty); if (CAVERNA && z >= CV_ZONE0 && z <= CV_ZONE0 + 3) return z <= CV_ZONE0 + 1 ? 1 : 2; if (CAVERNA && z === 5) return 2; return _lz(tx, ty); }; }
// levels by real depth: caves 1 + 1 per 50 m (to 4), cathedral 2 + 1 per 45 m (to 6), 30% of them one higher
let cvPacking = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!CAVERNA || e.boss || D.boss || zone === 4 || e.reiMinion) return e;
  const d = Math.floor((py + e.h) / T) - CV_S0;
  if (d >= 6) {
    const lvl = (d < CAVE_D ? 1 + Math.min(3, Math.floor(d / 50)) : Math.min(6, 2 + Math.floor((d - CAVE_D) / 45))) + (Math.random() < 0.3 ? 1 : 0), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  if (zone >= CV_ZONE0 && zone <= CV_ZONE0 + 3) {
    if (type === 'slime') e.variant = 4 + Math.min(2, zone - CV_ZONE0);
    else if (type === 'aranha' && Math.random() < 0.55) cvToRoof(e, 'thread');
    else if (type === 'bat' && Math.random() < 0.5) cvToRoof(e, 'roost');
    else if (type === 'rato' && !cvPacking) {   // rats come in twos and threes
      cvPacking = true;
      try { for (let k = 0, n = 1 + (Math.random() < 0.5 ? 1 : 0); k < n; k++) { const x2 = px + (k ? -1 : 1) * (14 + Math.random() * 8); if (!rectSolid(x2, py, D.w, D.h) && solidAt(Math.floor((x2 + D.w / 2) / T), Math.floor((py + D.h) / T) + 0)) spawnEnemy('rato', x2, py, zone); } }
      finally { cvPacking = false; }
    }
  }
  return e;
}; }

/* ---------- decorations that fall when what holds them breaks ---------- */
{ const _pls = propsLoseSupport; propsLoseSupport = function (x, y) {
  _pls(x, y);
  if (!CAVERNA || SOLID[tileAt(x, y)]) return;
  const dn = tileAt(x, y + 1), up = tileAt(x, y - 1);
  if (CV_HANGS[dn] && dn !== tileAt(x, y)) { burst(x * T + 6, (y + 1) * T + 6, 6, PCOL[dn] || '#887', 60, 300, 0.5); setTile(x, y + 1, AIR); }
  if (CV_STANDS[up] && up !== tileAt(x, y)) { burst(x * T + 6, (y - 1) * T + 6, 6, PCOL[up] || '#887', 60, 300, 0.5); setTile(x, y - 1, AIR); }
}; }

/* ---------- glows: crystal druses ---------- */
const CV_GLOW = { drusa: glow(16, '#a888f0') };
HOOK.drawGlow.push((cx, cy) => {
  for (let i = 0; i < emitters.length; i += 3) {
    if (emitters[i + 2] !== CV_DRUSA) continue;
    const gx = emitters[i], gy = emitters[i + 1];
    lc.globalAlpha = 0.2 + Math.sin(gameTime * 1.7 + gx * 0.7) * 0.05; lc.drawImage(CV_GLOW.drusa, gx * T + 6 - cx - 16, gy * T + 8 - cy - 16);
  }
  lc.globalAlpha = 1;
});

/* ---------- the village: shops and the elder's tasks for the new materials ---------- */
Object.assign(MAT_VAL, { pele_rato: 2, seda: 2, glandula: 8, quitina: 9 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['pele_rato', 'seda', 'glandula'].includes(id); c.hint = 'Compra gel, asas, carne, olhos, ectoplasma, brasas, crânios, seda, peles de rato e glândulas.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || id === 'quitina'; f.hint = f.hint.replace('chifres e presas', 'chifres, presas e quitina'); }
BOUNTIES.push(
  [1, 'pele_rato', 6, 'Peles de rato. Viram forro de bota para o inverno, e o inverno vem.', 'Forro para as botas'],
  [1, 'seda', 8, 'Seda de aranha. A Marta costura ferida com ela, e não arrebenta nunca.', 'Linha que não arrebenta'],
  [2, 'glandula', 4, 'Glândulas de peçonha. Com cuidado: a Marta tira delas um antídoto.', 'O antídoto da Marta'],
  [2, 'quitina', 4, 'Placas de quitina. O Grimaldo quer ver se servem de armadura.', 'Casca de besouro']
);
Object.assign(ORE_WHERE, { min_cobre: 'Minério das Grutas e das Galerias', min_ferro: 'Minério das cavernas, abaixo de 35 m', min_ouro: 'Minério do fundo das cavernas e da catedral', carvao: 'Veios pretos em todas as cavernas, ou com o Odo' });

/* ---------- the save: worlds from before the caves are remade; level, items, gold and the chest stay ---------- */
let caveNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (CAVERNA) o.wg = 3; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!CAVERNA || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 3) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null; v.cp = []; v.rei = null; v.teia = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
    caveNews = !!v.p && v.wrap === 1;
  }
  v.wg = 2; const r = _ms(v); if (r) r.wg = 3; return r;   // 23-save only knows world 2
}; }
HOOK.update.push(() => {
  if (caveNews && state === 'play') { caveNews = false; setTimeout(() => toast('Novidade: entre o vilarejo e a catedral agora há cavernas, com bichos novos e um ninho de aranhas. O mundo foi refeito para elas; seu nível, itens e ouro continuam.', 'gold'), 900); }
});
