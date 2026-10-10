'use strict';

/* ================= o Abismo: the world under the mine =================
   buildCathedral() already builds the caves, the cathedral, the ice and the mine (56, 57, 73, 74, 84, 85); here it
   gets one more step, abBuild() and abAfter(), which turn everything under the Fornalhas Esquecidas into the abyss:
     1. the rock by band (ash rock and basalt in the Portões, basalt and obsidian in the Rios de Fogo, living flesh
        and packed bone in the Entranhas, chaos stone and brimstone in the Trono; the mine's slag thins out over the
        first rows, and the ash creeps up into the last rows of the mine)
     2. caverns (a cellular automaton, more open than the mine's: hell is made of big hollows), then the rooms:
        ruined halls in the Portões, wide caverns with a lava lake and a black-iron bridge in the Rios, round
        chambers of flesh in the Entranhas, temples in the Trono and the boss hall (the Trono do Caos, 56 x 20,
        across the world from the rifts), joined by tunnels round each band and down between them
     3. two rifts down from the floor of two furnace halls of the mine: glowing crust round the mouth, a shaft lined
        with black iron and a ladder all the way to a ruined hall (you climb back up the same way)
     4. clean-up (tiny pockets, floating islands), the lava lakes (filled like water, so they never leak into a
        tunnel), the bridges over them, and the veins (coal, and infernite, the abyss's own metal)
     5. everything reachable from the rifts, then the dressing: hell brick round the ruins and temples, crust and
        obsidian round the lava, basalt columns, ladders at every drop too deep to jump back up (chains in the
        Entranhas), chains, braziers, flames, skulls, spikes, tendrils, hooks, runes, crystals and props
   Then the boss hall (109's abDress) and the climb back out (abClimbFix); 87's worldLink runs after all of it.
   Also here: the far layer, the zones (21..24) and their names, spawn tables, monster levels, glows, ash and
   sparks, the furnace recipe for infernite, the village's shops and the elder's tasks, and the save (111: wg 8,
   older worlds are remade, the hero keeps level, items and gold). */

let abChambers = [], abLakes = [], abKeep = new Set();   // abKeep: the rifts' ladders and linings, the bridges: tunnels and dressing leave them alone
const AB_SOILS = new Uint8Array(NT);   // natural abyss ground: what decorations and props may sit on
for (const t of [AB_CINZA, AB_BASALTO, AB_OBSIDIANA, AB_CROSTA, AB_CARNE, AB_OSSO, AB_ENXOFRE, AB_FERRO_NEGRO, AB_TIJOLO, AB_CAOS, AB_O_CARVAO, AB_O_INFERNITA]) AB_SOILS[t] = 1;
const AB_WALL_OF = { [AB_CINZA]: WAB_CINZA, [AB_BASALTO]: WAB_BASALTO, [AB_OBSIDIANA]: WAB_BASALTO, [AB_CARNE]: WAB_CARNE, [AB_OSSO]: WAB_CARNE, [AB_ENXOFRE]: WAB_CAOS, [AB_CAOS]: WAB_CAOS };
const abHallAt = (x, y, m = 1) => abBoss && Math.abs(wdx(x - abBoss.cx)) < abBoss.w / 2 + m && y >= abBoss.top - 1 - m && y <= abBoss.fy;

function abBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const UP = abAbove();   // the layer above (103): today the fungal mines
  AB_S0 = Math.min(WH - 12, UP.S0 + Math.min(UP.D, WH - 8 - UP.S0));
  const S0 = AB_S0, YB = Math.min(WH - 8, S0 + AB_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x6b1d), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / AB_D);
  const db = (x, y) => (y - S0) * AB_D / DB + (nz(x, y, 30, 0x6b2) - 0.5) * 10;
  const bandOf = d => d < AB_BANDS[1] ? 0 : d < AB_BANDS[2] ? 1 : d < AB_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  abChambers = []; abLakes = []; abBoss = null; abExits = []; abKeep.clear();

  // ---------- 1. the rock ----------
  for (let x = 0; x < WW; x++) {
    // the ash creeps up into the last rows of the layer above
    for (let y = S0 - 8; y < S0; y++) {
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x6b3);
      if (SOLID[tiles[i]] && UP.soils[tiles[i]] && h < k * 0.8) tiles[i] = AB_CINZA;
      if (walls[i] && h < k * 0.6) walls[i] = WAB_CINZA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3) continue;
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x6b4);
      if (k < 1 && h > 0.35 + k * 0.6) { tiles[i] = UP.thin; walls[i] = UP.thinW; continue; }   // the rock above thins out
      const d = db(x, y), b = bandOf(d), n1 = nz(x, y, 34, 0x6a1), n2 = nz(x, y, 18, 0x6a2), n3 = nz(x, y, 50, 0x6a3);
      let t;
      if (y >= YB) t = AB_BASALTO;
      else if (b === 0) t = n1 > 0.66 ? AB_BASALTO : AB_CINZA;
      else if (b === 1) t = n2 > 0.72 ? AB_OBSIDIANA : n3 > 0.8 ? AB_CINZA : AB_BASALTO;
      else if (b === 2) t = n1 > 0.64 ? AB_OSSO : AB_CARNE;
      else t = n2 > 0.7 ? AB_ENXOFRE : n3 > 0.78 ? AB_OBSIDIANA : AB_CAOS;
      tiles[i] = t; walls[i] = AB_WALL_OF[t];
    }
  }

  // ---------- 2. caverns, then the rooms ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN);
  const P0 = [0.22, 0.25, 0.23, 0.2];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x6c1), d = db(x, y);
    cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.36 - (d < 5 ? 0.2 : 0) ? 1 : 0;
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
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.35) dig(x, y);
    }
  };
  // a hall built square with a low vault (the ruins and the temples)
  const hall = (cx, fy, w, h, band, kind) => {
    const x0 = Math.round(cx - w / 2), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(2.5 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2)); if (y >= top + arch) dig(x, y); }
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band, kind, x0: W1(x0), top, fy }; abChambers.push(H); return H;
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.2 + Math.sin(n * 0.11 + s) * 0.3;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const busy = (cx, cy, w, h, m = 4) => abChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);

  // the two rifts first: from the floor of two halls of the layer above (the fungal mines' two ways down), far apart and away from its boss
  const rb = UP.boss, furn = UP.halls.filter(c => c.fy && (!rb || Math.abs(wdx(c.cx - rb.cx)) > rb.w / 2 + 24)).sort((a, b) => a.cx - b.cx);
  const picks = [];
  for (let n = 0; n < furn.length && picks.length < 2; n++) { const c = furn[(n * 5 + ((R() * furn.length) | 0)) % furn.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
  for (const c of furn) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
  const landY = S0 + mb(14);
  for (const c of picks) {
    const x0 = W1(Math.round(c.cx) - 2);
    abExits.push({ x0, fy: c.fy, top: c.fy - 2 });
    hall(x0 + 2 + (R() < 0.5 ? -6 : 6), landY, 30 + ((R() * 8) | 0), 8, 0, 'ruina');   // a ruined hall at the foot of the rift
  }
  // the boss hall, the Trono do Caos: in the last band, across the world from the rifts
  {
    const w = 56, h = 20, ax = abExits.length ? abExits.reduce((s, e) => s + wdx(e.x0 - abExits[0].x0), 0) / abExits.length + abExits[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = S0 + mb(182), x0 = cx - (w >> 1), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(4 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 3)); if (y >= top + arch) dig(x, y); }
    abBoss = { x0: W1(x0), x1: W1(x0 + w - 1), w, h, top, fy, cx };
    abChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true });
  }
  // the rooms per band: [count, wMin, wMax, hMin, hMax, top metre, bottom metre, kind]
  const PLAN = [[5, 18, 30, 8, 11, 8, 44, 'ruina'], [6, 30, 46, 12, 16, 52, 94, 'lago'], [6, 16, 26, 11, 16, 102, 146, 'carne'], [5, 22, 32, 10, 13, 154, 176, 'templo']];
  PLAN.forEach(([n0, wa, wb, ha, hb, d0, d1, kind], band) => {
    const n = n0 * WSC;
    for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
      const w = wa + ((R() * (wb - wa + 1)) | 0), h = Math.min(mb(hb), ha + ((R() * (hb - ha + 1)) | 0)), cx = (R() * WW) | 0, cy = S0 + mb(d0) + h / 2 + R() * Math.max(0, mb(d1 - d0) - h);
      if (busy(cx, cy, w, h)) continue;
      if (kind === 'ruina' || kind === 'templo') hall(cx, Math.round(cy + h / 2), w, h, band, kind);
      else { blob(cx, cy, w, h, 0x6900 + band * 40 + k, kind === 'lago' ? 2.4 : 1.15); abChambers.push({ cx, cy, w, h, band, kind }); }
      k++;
    }
  });
  // tunnels: round each band, and a few down between bands (into a lake cavern from high up, above the lava)
  const RAD = [1.6, 1.9, 2.3, 1.8];
  const mouth = C => C.boss ? abBoss.fy - 2 : C.kind === 'lago' ? C.cy - C.h * 0.15 : C.fy ? C.fy - 2 : C.cy + C.h * 0.2;
  for (let b = 0; b < 4; b++) {
    const L = abChambers.filter(c => c.band === b).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue;
      worm(A.boss ? A.cx - A.w / 2 : A.cx, mouth(A), B.boss ? B.cx + B.w / 2 : B.cx, mouth(B), RAD[b], 0x6700 + b * 50 + k);
    }
  }
  for (let b = 0; b < 3; b++) {
    const U = abChambers.filter(c => c.band === b && !c.boss), D = abChambers.filter(c => c.band === b + 1 && !c.boss);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      worm(A.cx, mouth(A), B.cx, mouth(B), Math.max(RAD[b], RAD[b + 1]) + 0.2, 0x67f0 + b * 9 + k);
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

  // ---------- 3. the rifts: glowing crust round the mouth in the furnace floor, a shaft lined with black iron, a ladder ----------
  for (const E of abExits) {
    const x0 = E.x0, y0 = E.fy, y1 = landY;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? UP.thinW : WAB_CINZA; }
      if (y >= y1 - 4) { for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); tiles[i] = AIR; abKeep.add(i); } continue; }   // open on both sides into the hall below
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y === y0) tiles[i] = AB_CROSTA; else if (!SOLID[tiles[i]] || (y - y0) % 6 === 5) tiles[i] = AB_FERRO_NEGRO; abKeep.add(i); }
    }
    for (let x = x0 - 4; x <= x0 + 7; x++) { const i = I(x, y0); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 4)) tiles[i] = AB_CROSTA; }   // the crack glows round the mouth
    for (let x = x0 - 3; x <= x0 + 6; x++) { const i = I(x, y1); if (!SOLID[tiles[i]]) tiles[i] = AB_FERRO_NEGRO; abKeep.add(i); }   // the floor at the foot
    for (let y = y0 - 2; y < y1; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = AB_ESCADA; abKeep.add(i); } }
    for (let y = y0 - 3; y < y1; y++) for (let x = x0; x < x0 + 4; x++) abKeep.add(I(x, y));
  }

  // ---------- 4. the lava lakes: filled from the bottom like water, so they stay in their basin; a bridge over each ----------
  const lavaFill = (x0, x1, yTop, yBot) => {
    let n = 0;
    for (let y = yBot; y >= yTop; y--) {
      let x = x0;
      while (x <= x1) {
        if (tiles[I(x, y)] !== AIR) { x++; continue; }
        let xe = x; while (xe + 1 <= x1 + 12 && tiles[I(xe + 1, y)] === AIR) xe++;
        const lo = tiles[I(x - 1, y)], hi = tiles[I(xe + 1, y)];
        let ok = SOLID[lo] && SOLID[hi] && xe - x < 70;
        for (let k = x; k <= xe && ok; k++) { const b = tiles[I(k, y + 1)]; if (!SOLID[b] && b !== LAVA) ok = false; if (abKeep.has(I(k, y))) ok = false; }
        if (ok) for (let k = x; k <= xe; k++) { tiles[I(k, y)] = LAVA; n++; }
        x = xe + 1;
      }
    }
    return n;
  };
  for (const C of abChambers) {
    if (C.kind !== 'lago') continue;
    // the floor of the cavern, under each column of its middle; then the longest flat run of it with rock under and
    // round it (no shaft falling through): a trench four deep is cut there, lava filling it, a black-iron
    // bridge across the top flush with the floor
    const xa = Math.round(C.cx - C.w * 0.4), xb = Math.round(C.cx + C.w * 0.4), yb = Math.round(C.cy + C.h / 2) + 2;
    const fl = [];
    for (let x = xa; x <= xb; x++) { let y = Math.round(C.cy); if (tiles[I(x, y)] !== AIR) { fl.push(-1); continue; } while (y < yb && tiles[I(x, y + 1)] === AIR) y++; fl.push(y < yb ? y + 1 : -1); }
    let best = null;
    for (let k = 0; k < fl.length;) {
      const fy = fl[k]; if (fy < 0) { k++; continue; }
      let e = k; while (e + 1 < fl.length && fl[e + 1] === fy) e++;
      if (!best || e - k > best[1] - best[0]) best = [k, e, fy];
      k = e + 1;
    }
    if (!best || best[1] - best[0] < 9) continue;
    const fy = best[2], a = xa + best[0] + 2, b = Math.min(xa + best[1] - 2, a + 26);
    let ok = true;
    for (let x = a - 1; x <= b + 1 && ok; x++) for (let y = fy; y <= fy + 4; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || abKeep.has(i)) { ok = false; break; } }
    if (!ok) continue;
    for (let x = a; x <= b; x++) {
      tiles[I(x, fy)] = AB_FERRO_NEGRO; abKeep.add(I(x, fy));
      tiles[I(x, fy + 1)] = LAVA; tiles[I(x, fy + 2)] = LAVA; tiles[I(x, fy + 3)] = LAVA;
      for (let y = fy + 1; y <= fy + 3; y++) walls[I(x, y)] = WAB_BASALTO;
    }
    abLakes.push({ x0: a, x1: b, top: fy + 1, bot: fy + 3, by: fy, a, b });
  }
  // little pools in low dips of the Rios de Fogo
  for (let y = S0 + mb(AB_BANDS[1]) + 2; y < S0 + mb(AB_BANDS[2]) - 2; y++) for (let x = 0; x < WW; x++) {
    if (tiles[I(x, y)] !== AIR || !SOLID[tiles[I(x, y + 1)]] || !SOLID[tiles[I(x - 1, y)]] || hash2(x, y, seed ^ 0x6d1) > 0.5) continue;
    let xe = x; while (xe - x < 9 && tiles[I(xe + 1, y)] === AIR) xe++;
    if (xe - x >= 2 && xe - x < 9 && SOLID[tiles[I(xe + 1, y)]]) lavaFill(x, xe, y, y);
  }

  // ---------- 5. ore veins: coal in the basalt and the ash, infernite in the basalt, the obsidian and the chaos stone ----------
  const R4 = mulberry32(seed ^ 0x0de6);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !abKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(AB_O_CARVAO, 90 * WSC, 0, 186, 3, 8, t => t === AB_BASALTO || t === AB_CINZA);                                     // coal and infernite in the abyss (102)
  vein(AB_O_INFERNITA, 80 * WSC, 0, 186, 2, 5, t => t === AB_BASALTO || t === AB_OBSIDIANA || t === AB_CAOS);
}

function abAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = AB_S0, YB = Math.min(WH - 8, S0 + AB_D), DB = YB - S0, nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s), R3 = mulberry32(seed ^ 0x6d3c1);
  const mb = m => Math.round(m * DB / AB_D);
  const abRow = y => y >= S0 && y < YB - 1;
  const open = t => !SOLID[t] && t !== LAVA;
  const dig = (x, y) => { if (!abRow(y)) return; const i = I(x, y); if (abKeep.has(i) || tiles[i] === LAVA) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WAB_BASALTO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const abSolid = t => SOLID[t] && AB_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const inBoss = (x, y, m = 1) => abHallAt(x, y, m);

  // ---------- 1. everything reachable from the two rifts (never through lava) ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = s0 => { if (reach[s0] || !open(tiles[s0])) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && open(tiles[nb])) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of abExits) flood(I(E.x0 + 2, E.fy - 1));
  for (let pass = 0; pass < 60 * WSC; pass++) {
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || !open(tiles[i]) || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && open(tiles[nb])) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 20 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || !open(tiles[i])) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) {   // nothing reached close by: a breadth-first search out through the rock to the nearest reached cell
      const org = new Int32Array(NN).fill(-1), q = []; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && !best; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 - 40) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || tiles[nb] === LAVA) continue;
          if (reach[nb] && open(tiles[nb])) { const o = org[c]; best = [o % WW, (o / WW) | 0, nb % WW, (nb / WW) | 0]; break; }
          org[nb] = org[c]; q.push(nb);
        }
      }
      if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    }
    worm(best[0], best[1], best[2], best[3], 1.6, 0x66a0 + pass);
    flood(I(best[2], best[3]));
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 2. hell brick round the ruins and the temples, flesh behind the flesh chambers ----------
  for (const H of abChambers) {
    if (H.boss) continue;
    if (H.kind === 'ruina' || H.kind === 'templo') {
      const broken = H.kind === 'ruina';
      for (let y = H.top - 3; y <= H.fy + 2; y++) for (let x = H.x0 - 3; x <= H.x0 + H.w + 2; x++) {
        const i = I(x, y), t = tiles[i]; if (!abRow(y) || abKeep.has(i)) continue;
        if (!SOLID[t]) { if (y >= H.top - 1 && y < H.fy && walls[i] && !(broken && nz(x, y, 9, 0x6e5) < 0.3)) walls[i] = WAB_TIJOLO; continue; }
        if (!AB_SOILS[t] || t === AB_FERRO_NEGRO) continue;
        let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (open(at(x + dx, y + dy))) { near = true; break; }
        if (near && !(broken && nz(x, y, 7, 0x6e6) < 0.32)) tiles[i] = AB_TIJOLO;
      }
    } else if (H.kind === 'carne') {
      for (let y = Math.round(H.cy - H.h / 2) - 1; y <= Math.round(H.cy + H.h / 2) + 1; y++) for (let x = Math.round(H.cx - H.w / 2) - 1; x <= Math.round(H.cx + H.w / 2) + 1; x++) {
        const i = I(x, y); if (abRow(y) && !SOLID[tiles[i]] && walls[i]) walls[i] = WAB_CARNE;
      }
    }
  }

  // ---------- 3. crust and obsidian round the lava; basalt columns in the Rios ----------
  for (let y = S0 + 1; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x, t = tiles[i]; if (!AB_SOILS[t] || abKeep.has(i) || t === AB_FERRO_NEGRO || t === AB_TIJOLO) continue;
    let lava = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (at(x + dx, y + dy) === LAVA) lava++;
    if (!lava) continue;
    tiles[i] = lava > 3 || at(x, y - 1) === LAVA || at(x - 1, y) === LAVA || at(x + 1, y) === LAVA ? AB_CROSTA : hash2(x, y, seed ^ 0x6e7) < 0.6 ? AB_OBSIDIANA : t;
  }
  for (const H of abChambers) {
    if (H.band !== 1 && H.band !== 0 || H.boss) continue;
    for (let k = 0, n = H.kind === 'lago' ? 3 : 1; k < n; k++) {
      const x = Math.round(H.cx + (R3() - 0.5) * H.w * 0.8);
      let y = Math.round(H.cy - H.h * 0.2); if (at(x, y) !== AIR) continue;
      let fl = y; while (fl < YB && at(x, fl + 1) === AIR) fl++;
      let rf = y; while (rf > S0 && at(x, rf - 1) === AIR) rf--;
      if (fl - rf < 4 || fl - rf > 18 || !abSolid(at(x, fl + 1)) || !abSolid(at(x, rf - 1)) || at(x, fl + 1) === AB_FERRO_NEGRO) continue;
      if (SOLID[at(x - 1, fl + 1)] + SOLID[at(x + 1, fl + 1)] < 2) continue;
      for (let yy = rf; yy <= fl; yy++) put(x, yy, AB_COLUNA);
    }
  }

  // ---------- 4. a ladder (a chain in the Entranhas) at every drop too deep to jump back up ----------
  {
    const used = new Set(), climbT = y => abyssBand(y) === 2 ? AB_CORRENTE : AB_ESCADA;
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBoss(x, y, 3)) continue;   // somewhere to stand at the top
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;                                    // a short hop, no floor below, or lava
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) { const tt = at(lx + j, yy); if (used.has(I(lx + j, yy)) || tt === AB_ESCADA || tt === AB_CORRENTE) near = true; }
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (abKeep.has(i) || !walls[i]) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = climbT(yy); used.add(i); }
      }
    }
  }

  // ---------- 5. decorations ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i]) continue;
    const b = abyssBand(y); if (b < 0 || b > 3 || inBoss(x, y, 2)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = abSolid(dn) && BLOCKY[dn] && up === AIR && dn !== AB_FERRO_NEGRO, ceil = abSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      if ((b === 0 && q < 0.012) || (b === 3 && q < 0.007)) { for (let j = 0, n = 3 + ((R3() * 7) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, AB_CORRENTE); continue; }   // chains hanging from the roof
      if (b === 2 && q < 0.035 && at(x, y + 1) === AIR) put(x, y, q < 0.012 ? AB_GANCHO : AB_TENTACULO);
      continue;
    }
    if (!floor) continue;
    if (b === 0) { if (q < 0.02) put(x, y, AB_CRANIOS); else if (q < 0.028) put(x, y, AB_BRASEIRO); else if (q < 0.04) put(x, y, AB_CHAMA); else if (q < 0.05) put(x, y, AB_ESPINHOS); }
    else if (b === 1) { if (q < 0.03) put(x, y, AB_ESTALAG); else if (q < 0.045 || (dn === AB_CROSTA && q < 0.2)) put(x, y, AB_CHAMA); }
    else if (b === 2) { if (q < 0.035) put(x, y, AB_ESPINHOS); else if (q < 0.05) put(x, y, AB_CRANIOS); }
    else { if (q < 0.012 || (dn === AB_TIJOLO && q < 0.05)) put(x, y, AB_RUNA); else if (q < 0.035) put(x, y, AB_CRISTAL); else if (q < 0.043) put(x, y, AB_BRASEIRO); else if (q < 0.053) put(x, y, AB_CRANIOS); }
  }

  // ---------- 7. the big props ----------
  if (typeof abPlaceProps === 'function') abPlaceProps();
}

/* ---------- climbing back out: from the deep places (the boss hall, every temple and flesh chamber) the
   hero must be able to get back up to the rifts. A walk-and-jump search (three blocks of jump, ladders and chains
   climbed, never through lava); where it tops out under open air that leads up to somewhere to stand, a ladder goes
   in, and the search runs again. Same as the mine's mnClimbFix. ---------- */
function abClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = AB_S0, YB = Math.min(WH - 8, S0 + AB_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => { const t = tiles[I(x, y)]; return t === AB_ESCADA || t === AB_CORRENTE || t === CHAIN; };
  const lava = (x, y) => tiles[I(x, y)] === LAVA;
  const ok = (x, y) => !S(x, y) && !S(x, y - 1) && !lava(x, y) && !lava(x, y - 1), H = YB - Y0;
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
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || abKeep.has(I(x, y))) continue;   // a reached floor
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
    }
    if (!best) return false;
    const [x, top, bot] = best; for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] && tiles[i] !== LAVA) tiles[i] = abyssBand(y) === 2 ? AB_CORRENTE : AB_ESCADA; }
    return true;
  };
  const starts = [];
  if (abBoss) starts.push([abBoss.cx - 8, abBoss.fy - 1], [abBoss.cx + 8, abBoss.fy - 1]);
  for (const c of abChambers) if (c.kind === 'templo' || c.kind === 'carne' || c.kind === 'lago') starts.push([Math.round(c.cx), Math.round(c.cy)]);
  let fixes = 0;
  for (const [x, y] of starts) { for (let k = 0; k < 12 && !search(W1(x), y); k++) { if (!repair()) break; fixes++; } }
  return fixes;
}
// the rift mouths last of all: whatever the mine's clean-up or the dressing left in the gap is dug out, and the
// ladder runs right up into the furnace hall
function abExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of abExits) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? AB_ESCADA : AIR; abKeep.add(i); }
}

{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!ABISMO) return;
  abBuild(); abAfter();
  if (typeof abDress === 'function') try { abDress(); } catch (err) { console.error(err); }
  abExitClear(); abClimbFix();
}; }

/* ---------- the far layer behind the abyss ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!ABISMO) return;
  for (let y = AB_S0 - 4; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - AB_S0) + (depthNz(x, y, 25, seed ^ 0x6e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x6e12);
    DEEPT[i] = d < 46 ? (n > 0.55 ? DP_AB_RUINAS : DP_AB_ROCHA) : d < 98 ? DP_AB_ROCHA : d < 150 ? (n > 0.35 ? DP_AB_CARNE : DP_AB_ROCHA) : (n > 0.5 ? DP_AB_RUINAS : DP_AB_ROCHA);
  }
}; }

/* ---------- zones, names, spawns ---------- */
ZONE_NAMES.push('Portões de Cinza', 'Rios de Fogo', 'As Entranhas', 'Trono do Caos');
ZONE_SUB.push('a cinza cai e não para', 'a pedra aqui escorre', 'as paredes respiram', 'tudo aqui obedece a alguém');
{ const _cz = cathZone; cathZone = function (tx, ty) { if (ABISMO && ty >= AB_S0) return AB_ZONE0 + clamp(abyssBand(ty), 0, 3); return _cz(tx, ty); }; }
Object.assign(CATH_SPAWN, {
  [AB_ZONE0]: [[['diabrete', 0.22], ['caoinferno', 0.24], ['almapenada', 0.18], ['cultista', 0.16], ['gargulainf', 0.2]], 9],
  [AB_ZONE0 + 1]: [[['diabrete', 0.22], ['caoinferno', 0.22], ['vermemagma', 0.24], ['salamandra', 0.32]], 9],
  [AB_ZONE0 + 2]: [[['brutamontes', 0.22], ['almapenada', 0.2], ['rastejador', 0.33], ['moscas', 0.25]], 10],
  [AB_ZONE0 + 3]: [[['diabrete', 0.16], ['brutamontes', 0.22], ['vermemagma', 0.16], ['cultista', 0.24], ['gargulainf', 0.22]], 10]
});
// levels: two per layer from the abyss's place in the layer list (129-camadas: 13-14 as the 6th), 30% of them one higher but never past the top
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!ABISMO || e.boss || D.boss || e.abMinion) return e;
  const d = Math.floor((py + e.h) / T) - AB_S0;
  if (d >= 0) {
    const lvl = layerLvl(layerLo('abismo'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
// the salamanders of the Rios de Fogo come up out of the lava lakes: now and then, a lake near the hero (but off the
// screen) that has none gets one, swimming
let abSalT = 3;
HOOK.update.push(dt => {
  if (!ABISMO || !pl || pl.dead || state !== 'play' || !ET.salamandra || (abSalT -= dt) > 0) return;
  abSalT = 5 + Math.random() * 4;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (abyssBand(pty) !== 1 || enemies.length > 40) return;
  for (const L of abLakes) {
    const cx = (L.x0 + L.x1) >> 1, dx = Math.abs(wdx(cx - ptx)), dy = Math.abs(L.top - pty);
    if (dx < 22 && dy < 14 || dx > 60 || dy > 30) continue;
    if (enemies.some(e => e.type === 'salamandra' && Math.abs(wdx(Math.floor(e.x / T) - cx)) < 30 && Math.abs(Math.floor(e.y / T) - L.top) < 12)) continue;
    const e = spawnEnemy('salamandra', (L.x0 + 2 + Math.random() * (L.x1 - L.x0 - 4)) * T, (L.bot) * T - 2, AB_ZONE0 + 1);
    if (e && enemies.indexOf(e) < 0) enemies.push(e);
    break;
  }
});

// the old crypt's gear, which nothing dropped any more, goes to the demons that took its place (the heart goes to the boss, 109)
for (const [k, add] of [['diabrete', [['anel_vampiro', 0.015]]], ['caoinferno', [['anel_furia', 0.02]]], ['brutamontes', [['escudo_infernal', 0.02]]]]) if (DROPS[k]) for (const d of add) if (ITEMS[d[0]] && !DROPS[k].some(o => o[0] === d[0])) DROPS[k].push(d);

/* ---------- glows: braziers, flames, runes, crystals, the crust and the infernite ---------- */
const AB_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!ABISMO || cy + VH < (AB_S0 - 6) * T) return;
  if (!AB_GLOW.b) { AB_GLOW.b = glow(24, '#ff9a3c'); AB_GLOW.f = glow(14, '#ff7a2a'); AB_GLOW.r = glow(16, '#b04aff'); AB_GLOW.c = glow(16, '#e04a8a'); AB_GLOW.k = glow(10, '#ff5a1a'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2], gx = emitters[i], gy = emitters[i + 1];
    if (t === AB_BRASEIRO) { lc.globalAlpha = 0.34 + Math.sin(gameTime * 8 + gx * 1.3) * 0.04 + Math.sin(gameTime * 13 + gy) * 0.03; lc.drawImage(AB_GLOW.b, gx * T + 6 - cx - 24, gy * T + 5 - cy - 24); }
    else if (t === AB_CHAMA) { lc.globalAlpha = 0.26 + Math.sin(gameTime * 10 + gx * 2.1) * 0.05; lc.drawImage(AB_GLOW.f, gx * T + 6 - cx - 14, gy * T + 8 - cy - 14); }
    else if (t === AB_RUNA) { lc.globalAlpha = 0.2 + Math.sin(gameTime * 1.8 + gx) * 0.08; lc.drawImage(AB_GLOW.r, gx * T + 6 - cx - 16, gy * T + 9 - cy - 16); }
    else if (t === AB_CRISTAL) { lc.globalAlpha = 0.24 + Math.sin(gameTime * 2.4 + gx) * 0.06; lc.drawImage(AB_GLOW.c, gx * T + 6 - cx - 16, gy * T + 6 - cy - 16); }
    else if (t === AB_CROSTA || t === AB_O_INFERNITA) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.12 + Math.sin(gameTime * 1.2 + gx * 0.7 + gy) * 0.04; lc.drawImage(AB_GLOW.k, gx * T + 6 - cx - 10, gy * T + 6 - cy - 10); }
  }
  lc.globalAlpha = 1;
});
// ash falling in the Portões, sparks rising off the lava, blood dripping in the Entranhas, purple embers in the Trono
// (the sounds of the abyss are in 97-ambiente)
HOOK.update.push(dt => {
  if (!ABISMO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = abyssBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (b === 0 && Math.random() < dt * 14) { const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH * 0.5; if (air(x, y)) parts.push({ x, y, vx: rnd(-6, 6), vy: rnd(8, 18), g: 2, life: 3, max: 3, col: Math.random() < 0.6 ? '#6a6460' : '#8a8078', size: 1 }); }
  if (b === 1 && Math.random() < dt * 12) { const x = cam.x + Math.random() * VW, y = cam.y + VH * (0.3 + Math.random() * 0.7); if (air(x, y)) parts.push({ x, y, vx: rnd(-10, 10), vy: rnd(-34, -14), g: -6, life: 1.6, max: 1.6, col: Math.random() < 0.6 ? '#ff6a1a' : '#ffc060', size: 1, glow: true }); }
  if (b === 2 && Math.random() < dt * 3) {
    const tx = Math.floor((cam.x + Math.random() * VW) / T); let ty = Math.floor((cam.y + Math.random() * VH * 0.6) / T);
    for (let k = 0; k < 12 && !solidAt(tx, ty - 1); k++) ty--;
    if (solidAt(tx, ty - 1) && !solidAt(tx, ty) && wallAt(tx, ty)) parts.push({ x: tx * T + rnd(2, 10), y: ty * T, vx: 0, vy: 10, g: 420, life: 1.4, max: 1.4, col: '#7a1018', size: 1 });
  }
  if (b === 3 && Math.random() < dt * 6) { const x = cam.x + Math.random() * VW, y = cam.y + VH * (0.4 + Math.random() * 0.6); if (air(x, y)) parts.push({ x, y, vx: rnd(-8, 8), vy: rnd(-22, -10), g: -3, life: 2, max: 2, col: Math.random() < 0.6 ? '#b04aff' : '#ff5a8a', size: 1, glow: true }); }
});

/* ---------- the forge and the village: the infernite at the furnace (110 adds the items), shops and the elder's tasks ---------- */
FURN.min_infernita = { bar: 'barra_infernita', n: 6, t: 10 };
Object.assign(MAT_VAL, { min_infernita: 40, barra_infernita: 260, essencia_demoniaca: 30, asa_couro: 14, olho_demonio: 26, enxofre: 8 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['essencia_demoniaca', 'asa_couro'].includes(id); c.hint = c.hint.replace(/\.$/, '') + ', essência demoníaca e asas de couro.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_infernita', 'barra_infernita', 'enxofre', 'olho_demonio'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', infernita, enxofre e olhos de demônio.'; }
