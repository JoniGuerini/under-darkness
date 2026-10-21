'use strict';

/* ================= o Brejo das Bruxas: o mundo (docs/camadas/06-brejo-bruxas.md, seção 3) =================
   A sexta camada, debaixo das Minas Fúngicas (bjAbove, 370). Em passos:
     1. a rocha: turfa em cima (a Turfeira), argila e turfa nas Palafitas, pedra do brejo e argila no Patíbulo, pedra
        e menir no Círculo; o micélio de cima vira lama nas primeiras linhas; raizame em fios pela turfa
     2. os vazios: as duas descidas das Minas (o poço cai numa câmara de pouso de tábua, 16 x 6, com duas velas), o
        Caldeirão do outro lado do mundo (a caixa sólida que o 376 veste), as duas Valas de Escoamento no fundo, e as
        salas de cada faixa: bacias de turfa com a poça preta no meio e a mata afogada na Turfeira; lagoas largas com
        plataformas de tábua sobre estacas, cabanas de pau a pique e sapê e passarelas nas Palafitas; os pátios do
        patíbulo com o cadafalso e as cordas penduradas; os círculos de pedras em pé em volta de uma poça no Círculo
     3. as ligações: túneis de minhoca entre as salas de um andar e 3 por WSC rampas em zigue-zague entre os andares
     4. os carimbos: as plataformas, as estacas, as cabanas, o cadafalso, os menires; lama no chão das bacias
     5. os veios: carvão de turfa na turfa e na argila; ferro-do-brejo na crosta de ferro, que junta perto da água
   Depois (bjAfter): tudo alcançável das descidas, escada de corda em todo desnível de 5, a água das poças (378 enche
   de novo depois do 87), a decoração de 1 bloco e os objetos (372). Por fim o Caldeirão (376: bjDress), as bocas das
   descidas e a subida garantida (bjClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 77 a 80, o spawn por faixa (a sanguessuga tem o seu, na água), o nível (pela
   posição no 129), as partículas, o ferro na fornalha e nas lojas. */

const BJ_CLIMB0 = t => t === BJ_ESCADA || t === BJ_CORDA || t === CHAIN;
let bjUpClimb = CHAIN;   // a escada da camada de cima (bjBuild acerta)
const BJ_CLIMB = t => BJ_CLIMB0(t) || t === bjUpClimb;
const BJ_LYR = () => Math.min(WH - 8, BJ_S0 + BJ_D);   // a última linha da camada (a de baixo começa aqui)
let bjMatas = [], bjLagoas = [], bjPatios = [];

function bjBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = bjAbove(); bjUpClimb = A.climb || CHAIN;
  BJ_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = BJ_S0, YB = BJ_LYR(), DB = YB - S0;
  const R = mulberry32(seed ^ 0x3b7e1), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < BJ_BANDS[1] ? 0 : d < BJ_BANDS[2] ? 1 : d < BJ_BANDS[3] ? 2 : 3;
  // a camada é LAYER_K vezes mais alta que o desenho (186 metros): cada faixa vira K andares, um embaixo do outro.
  // lv(d, j): a linha da profundidade d do desenho, no andar j da faixa de d; lvOf(y): o andar (0 a 4K - 1) de uma linha
  const K = LAYER_K, BD = BJ_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / BJ_D); };
  const lvOf = y => { const d = (y - S0) * BJ_D / DB, b = bandOf(d), h = (BJ_BANDS[b + 1] - BJ_BANDS[b]) / K; return b * K + clamp(Math.floor((d - BJ_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  bjCh = []; bjMatas = []; bjLagoas = []; bjPatios = [];
  bjEntries = []; bjLand = []; bjExits = []; bjBoss = null; bjPools = []; bjHuts = []; bjDecks = []; bjGallows = []; bjCircles = []; bjMires = []; bjKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a rocha de cima afina nas últimas 10 linhas e vira lama de turfa
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x3b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = BJ_LAMA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = BJ_PEDRA; walls[i] = WBJ_PEDRA; continue; }   // abaixo da camada: a mesma pedra, sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0x3b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x3a1), n2 = nz(x, y, 14, 0x3a2);
      const root = Math.abs(nz(x, y, 22, 0x3a4) - 0.5);
      let tt, w;
      if (b === 0) { tt = n1 > 0.62 ? BJ_ARGILA : BJ_TURFA; w = WBJ_TURFA; }
      else if (b === 1) { tt = n1 > 0.55 ? BJ_ARGILA : BJ_TURFA; w = n1 > 0.55 ? WBJ_PEDRA : WBJ_TURFA; }
      else if (b === 2) { tt = n1 > 0.6 ? BJ_ARGILA : BJ_PEDRA; w = WBJ_PEDRA; }
      else { tt = n1 > 0.7 ? BJ_MENIR : BJ_PEDRA; w = n1 > 0.7 ? WBJ_MENIR : WBJ_PEDRA; }
      if (y - S0 < 12 && n2 < 1 - (y - S0) / 12) tt = BJ_LAMA;                 // a lama encharcada logo abaixo do micélio
      else if (root < 0.02 && b <= 1) { tt = BJ_RAIZ; w = WBJ_RAIZ; }         // as raízes das árvores afogadas
      tiles[i] = tt; walls[i] = w;
      if (agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. os vazios ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => bjCh.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const hollow = (x0, fy, w, h, s) => {
    for (let x = x0; x < x0 + w; x++) {
      const u = (x + 0.5 - x0) / w * 2 - 1, top = fy - Math.round(h * Math.pow(Math.max(0, 1 - u * u), 0.45) + (nz(x, fy, 9, s) - 0.5) * 4);
      if (fy - top < 3) continue;
      for (let y = top; y < fy; y++) dig(x, y); hard(x, fy);
    }
  };
  // a poça: o chão afunda `dep` linhas de px0 a px1 (sem as beiradas), a borda de baixo e dos lados guardada
  const pond = (px0, px1, fy, dep, kind) => {
    const dug = [];
    for (let x = px0; x < px1; x++) { const e = Math.min(x - px0, px1 - 1 - x), dd = Math.min(dep, 1 + e); for (let y = fy; y < fy + dd; y++) { dig(x, y); dug.push(I(x, y)); } hard(x, fy + dd); }
    hard(px0 - 1, fy); hard(px1, fy);
    bjPools.push({ x0: W1(px0), x1: W1(px1 - 1), fy: fy + dep - 1, wl: fy, kind, cx: W1(Math.round((px0 + px1) / 2)), dug });
  };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1200; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.7 + Math.sin(n * 0.09 + s) * 0.3;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const ramp = (xa, ya, xb, yb, r, s) => {
    const Rr = mulberry32(seed ^ s ^ 0x5a17), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 11));
    let x = xa, y = ya, dir = wdx(xb - xa) < 0 ? -1 : 1;
    for (let k = 1; k <= n; k++) {
      const ny = Math.round(ya + dy * k / n), nx = k === n ? xa + wdx(xb - xa) : x + dir * (14 + ((Rr() * 10) | 0));
      worm(x, y, nx, ny, r, s + k * 131); x = nx; y = ny; dir = -dir;
    }
  };

  // ---------- 2a. as duas descidas: o poço das Minas cai numa câmara de pouso de tábua ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || (ub.w ? ub.w / 2 : 0) || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) { const a = (R() * WW) | 0; picks.push({ cx: a, fy: S0 - 2 }, { cx: W1(a + WW / 2), fy: S0 - 2 }); }
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 22 + ((R() * 7) | 0), S0 + 16, S0 + mb(32));
      const hx = side > 0 ? xs - 1 : xs - 12;   // o poço cai numa ponta da câmara (16 x 6)
      for (let y = landFy - 8; y <= landFy + 1; y++) for (let x = hx - 2; x <= hx + 17; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 16; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 16 : hx - 1, dx0 = side > 0 ? hx + 16 : hx - 2, dx1 = side > 0 ? hx + 17 : hx - 1;
      for (let y = landFy - 4; y < landFy; y++) for (let x = dx0; x <= dx1; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 16, h: 6, door: W1(door), side, ox0: W1(dx0), ox1: W1(dx1) };
      bjLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // a primeira sala, logo depois da porta: o primeiro pedaço da Turfeira que o herói vê (seca: sem poça)
      const w = 22 + ((R() * 8) | 0), h = 11, x0 = side > 0 ? dx1 + 1 : dx0 - w;
      hollow(x0, landFy, w, h, 0x3c00 + bjLand.length);
      bjCh.push({ cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'cova', x0: W1(x0), fy: landFy, top: landFy - h, dry: true });
      bjCh.push({ cx: hx + 8, cy: landFy - 4, w: 26, h: 14, band: 0, kind: 'pouso', nolink: true });
      bjEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. o Caldeirão, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 110, h = 44;
    const ax = bjEntries.length ? bjEntries.reduce((s, e) => s + wdx(e.x0 - bjEntries[0].x0), 0) / bjEntries.length + bjEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 16, S0 + mb(176)), top = fy - h, bank = fy - 7;
    bjBoss = { cx, x0: W1(cx - 55), x1: W1(cx + 54), w, h, top, fy, bank, wl: fy - 5,
      doors: [{ side: -1, x: W1(cx - 58), fy: bank }, { side: 1, x: W1(cx + 57), fy: bank }] };
    for (let y = top - 4; y <= fy + 4; y++) for (let x = cx - 59; x <= cx + 58; x++) seal[I(x, y)] = 1;
    bjCh.push({ cx, cy: fy - h / 2, w: w + 8, h: h + 8, band: 3, boss: true, nolink: true });
    for (const D of bjBoss.doors) {
      const len = 26 + ((R() * 12) | 0), fyD = D.fy;
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 5; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); bjKeep.add(I(x, fyD));
        x += D.side;
      }
      bjCh.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 5, band: 3, kind: 'servico', nolink: true });
      const gw = 22 + ((R() * 8) | 0), gh = 12, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      hollow(gx0, fyD, gw, gh, 0x3c10 + D.side);
      bjCh.push({ cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: 3, kind: 'cova', x0: W1(gx0), fy: fyD, top: fyD - gh, dry: true });
    }
  }
  const awayFromBoss = (cx, cy, m) => !bjBoss || Math.abs(wdx(cx - bjBoss.cx)) > bjBoss.w / 2 + 6 + m || cy < bjBoss.top - 6 - m || cy > bjBoss.fy + 6 + m;

  // ---------- 2c. as Valas de Escoamento: duas salas no fundo, longe uma da outra e do Caldeirão; um poço de 3 ----------
  for (let tries = 0; bjExits.length < 2 && tries < 600; tries++) {
    const w = 18 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);
    if (!awayFromBoss(cx, fy, 90) || bjExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'vala', x0: W1(x0), fy, top: fy - h, exit: true, dry: true };
    bjCh.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    bjExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. a Turfeira: bacias de turfa com a poça preta e a mata afogada ----------
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 40 + ((R() * 25) | 0), h = 14 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = Math.max(lv(0, j) + h + 8, lv(18 + R() * 24, j));
    if (fy > lv(0, j) + 46 || busy(x0 + w / 2, fy - h / 2, w + 10, h + 8, 6)) continue;
    hollow(x0 - 5, fy, w + 10, h + 4, 0x3d00 + k);
    const pw = Math.round(w * (0.4 + R() * 0.25)), px0 = Math.round(x0 + (w - pw) / 2);
    pond(px0, px0 + pw, fy, 3 + ((R() * 2) | 0), 'turfa');
    bjCh.push({ cx: x0 + w / 2, cy: fy - h / 2, w: w + 10, h: h + 4, band: 0, kind: 'bacia', x0: W1(x0), fy, top: fy - h }); k++;
  }
  for (let k = 0, tries = 0; k < 2 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 50 + ((R() * 30) | 0), h = 20 + ((R() * 6) | 0), x0 = (R() * WW) | 0, fy = Math.max(lv(0, j) + h + 8, lv(22 + R() * 22, j));
    if (fy > lv(0, j) + 46 || busy(x0 + w / 2, fy - h / 2, w + 10, h + 6, 6)) continue;
    hollow(x0 - 5, fy, w + 10, h + 5, 0x3d40 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w: w + 10, h: h + 5, band: 0, kind: 'mata', x0: W1(x0), fy, top: fy - h };
    bjMatas.push(C); bjCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 300 * K; tries++) {
    const w = 16 + ((R() * 14) | 0), h = 8 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(8, k % K) + h / 2 + R() * Math.max(0, 36 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x3d80 + k, 1.6);
    bjCh.push({ cx, cy, w, h, band: 0, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2e. as Palafitas: lagoas largas (a água no chão todo, com a beirada seca nas pontas) ----------
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 600 * K; tries++) {
    const j = k % K, w = 60 + ((R() * 30) | 0), h = 22 + ((R() * 6) | 0), x0 = (R() * WW) | 0, fy = lv(56 + R() * 36, j);
    if (fy - h - 6 < lv(46, j) || busy(x0 + w / 2, fy - h / 2, w + 12, h + 8, 6)) continue;
    hollow(x0 - 6, fy, w + 12, h + 5, 0x3e00 + k);
    const dep = 5;
    pond(x0 + 6, x0 + w - 6, fy, dep, 'lagoa');
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w: w + 12, h: h + 5, band: 1, kind: 'lagoa', x0: W1(x0), lw: w, fy, top: fy - h, dep };
    bjLagoas.push(C); bjCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(50, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x3ec0 + k, 1.7);
    bjCh.push({ cx, cy, w, h, band: 1, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2f. o Patíbulo: os pátios das forcas (secos) ----------
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 44 + ((R() * 21) | 0), h = 18 + ((R() * 7) | 0), x0 = (R() * WW) | 0, fy = lv(108 + R() * 38, j);
    if (fy - h - 6 < lv(98, j) || busy(x0 + w / 2, fy - h / 2, w + 12, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 8)) continue;
    hollow(x0 - 6, fy, w + 12, h + 5, 0x3f00 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w: w + 12, h: h + 5, band: 2, kind: 'patio', x0: W1(x0), pw: w, fy, top: fy - h };
    bjPatios.push(C); bjCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(102, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6)) continue;
    blob(cx, cy, w, h, 0x3f80 + k, 1.6);
    bjCh.push({ cx, cy, w, h, band: 2, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2g. o Círculo: as pedras em pé em volta da poça ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 44 + ((R() * 13) | 0), h = 18 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = lv(156 + R() * 22, j);
    if (fy > YB - 8 || fy - h - 4 < lv(150, j) || busy(x0 + w / 2, fy - h / 2, w + 12, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 8)) continue;
    hollow(x0 - 6, fy, w + 12, h + 5, 0x3fc0 + k);
    const pw = Math.round(w * 0.36), px0 = Math.round(x0 + (w - pw) / 2);
    pond(px0, px0 + pw, fy, 3, 'circulo');
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w: w + 12, h: h + 5, band: 3, kind: 'circulo', x0: W1(x0), cw: w, px0: W1(px0), pw, fy, top: fy - h };
    bjCircles.push(C); bjCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const w = 18 + ((R() * 12) | 0), h = 10 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(154, k % K) + h / 2 + R() * Math.max(0, 26 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, Math.max(w, h) / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0x3fe0 + k, 1.8);
    bjCh.push({ cx, cy, w, h, band: 3, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of bjCh) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(ends(c, false)[1] - 1) - c.band * K, 0, K - 1)].push(c);
  for (let l = 0; l < NL; l++) {
    const b = (l / K) | 0, L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      worm(ax, ay - 2, bx, by - 2, b === 1 ? 1.4 : 1.5, 0x3700 + l * 90 + k);
    }
  }
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l], D = byLv[l + 1];
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5); ramp(ax, ay - 2, Math.round(Q.cx + (R() < 0.5 ? -1 : 1) * (Q.w / 2 - 3)), mouth(Q) - 2, 1.4, 0x37f0 + l * 9 + k);
    }
  }
  // bolsinhas fechadas viram rocha; ilhas soltas no ar somem
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
      while (st.length) { const c = st.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN || cv[nb] || sl[nb]) continue; const ny = (nb / WW) | 0; if (!canCarve(nb % WW, ny)) { open = false; continue; } sl[nb] = 1; st.push(nb); } if (comp.length > 30) open = false; }
      if (open && comp.length < 6 && !comp.some(c => seal[c] || keep[c])) for (const c of comp) cv[c] = 1;
    }
  }
  // as beiradas das poças voltam a ser rocha (um túnel que passou por elas faria a água vazar)
  for (const P of bjPools) {
    const D = new Set(P.dug); P.rim = [];
    for (const c of P.dug) { const x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c + WW]) if (!D.has(nb) && ((nb / WW) | 0) >= P.wl) { cv[nb] = 0; P.rim.push(nb); } }
    for (const x of [P.x0 - 1, P.x1 + 1]) { const nb = I(x, P.wl); if (!D.has(nb)) { cv[nb] = 0; P.rim.push(nb); } }
    for (const c of P.dug) cv[c] = 1;
    delete P.dug;
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 40) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 4. os carimbos ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { if (y < S0 || y >= YB - 1) return; const i = I(x, y); if (bjKeep.has(i)) return; tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const wallOf = y => { const b = brejoBand(y); return b <= 1 ? WBJ_TURFA : b === 3 && nz(0, y, 30, 0x3f1) > 0.6 ? WBJ_MENIR : WBJ_PEDRA; };
  // o fundo de todo vazio; o chão das bacias e da mata é lama; nas Palafitas o chão é turfa encharcada
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR) continue;
    walls[i] = wallOf(y);
    const dn = i + WW; if (y + 1 < YB - 1 && SOLID[tiles[dn]] && BJ_SOILS[tiles[dn]] && !bjKeep.has(dn)) {
      const b = brejoBand(y); if (b <= 1 && nz(x, y, 10, 0x3f2) > 0.42) { tiles[dn] = BJ_LAMA; bjMires.push(dn); }
    }
  }
  const inB = (x, y) => !bjBoss || awayFromBoss(x, y, -4);
  const keepIt = (x, y) => bjKeep.add(I(x, y));
  // a mata afogada: os troncos mortos de raizame do chão ao teto (só onde o teto está perto), as raízes penduradas
  for (const C of bjMatas) {
    for (let x = C.x0 + 6; x < C.x0 + C.w - 16; x += 9 + ((hash2(x, C.fy, seed ^ 0x3e1) * 6) | 0)) {
      let top = C.fy - 1; while (top > C.top - 4 && at(x, top - 1) === AIR) top--;
      const gap = C.fy - top; if (gap < 6 || gap > 18 || !SOLID[at(x, top - 1)]) continue;
      for (let y = top; y < C.fy; y++) { set(x, y, BJ_RAIZ, WBJ_RAIZ); if (y < top + 3 || y > C.fy - 3 || hash2(x, y, seed ^ 0x3e2) < 0.3) set(x + 1, y, BJ_RAIZ, WBJ_RAIZ); }
      // um vão no pé do tronco, do tamanho do herói (passa-se por baixo da raiz)
      for (let y = C.fy - 3; y < C.fy; y++) { set(x, y, AIR, WBJ_RAIZ); set(x + 1, y, AIR, WBJ_RAIZ); }
      set(x - 1, C.fy - 4, BJ_RAIZ); set(x + 2, C.fy - 4, BJ_RAIZ);
    }
  }
  // as lagoas das Palafitas: plataformas de tábua sobre estacas, cabanas de pau a pique com telhado de sapê, passarelas
  for (const C of bjLagoas) {
    const wl = C.fy, dy = wl - 3, x0 = C.x0 + 8, x1 = C.x0 + C.lw - 8;   // a tábua 3 acima da água
    const decks = []; let x = x0 + ((hash2(C.x0, 1, seed ^ 0x3e3) * 4) | 0);
    while (x < x1 - 8) { const len = 9 + ((hash2(x, C.fy, seed ^ 0x3e4) * 7) | 0); if (x + len > x1) break; decks.push([x, len]); x += len + 4 + ((hash2(x, 2, seed ^ 0x3e5) * 6) | 0); }
    for (const [dx0, len] of decks) {
      let clear = true; for (let xx = dx0; xx < dx0 + len && clear; xx++) for (let yy = dy - 8; yy <= dy; yy++) if (at(xx, yy) !== AIR) { clear = false; break; }
      if (!clear) continue;
      for (let xx = dx0; xx < dx0 + len; xx++) set(xx, dy, BJ_TABUA);
      // as estacas: nas pontas e a cada 4, da tábua até o fundo da lagoa
      for (let xx = dx0; xx < dx0 + len; xx += 4) for (const px of xx === dx0 ? [xx] : [xx]) for (let yy = dy + 1; yy < wl + C.dep; yy++) if (at(px, yy) === AIR) set(px, yy, BJ_POSTE);
      for (let yy = dy + 1; yy < wl + C.dep; yy++) if (at(dx0 + len - 1, yy) === AIR) set(dx0 + len - 1, yy, BJ_POSTE);
      // a escada de corda descendo da tábua até o fundo, para sair da água
      const lx = dx0 + 1 + ((hash2(dx0, 3, seed ^ 0x3e6) * (len - 3)) | 0);
      for (let yy = dy; yy < wl + C.dep; yy++) if (at(lx, yy) === AIR || yy === dy) set(lx, yy, BJ_ESCADA);
      bjDecks.push({ x0: W1(dx0), w: len, y: dy, lagoa: C });
      // a cabana: nas plataformas compridas, metade das vezes
      if (len >= 11 && hash2(dx0, 4, seed ^ 0x3e7) < 0.65) {
        const hw = Math.min(len - 2, 9 + ((hash2(dx0, 5, seed ^ 0x3e8) * 2) | 0)), hx0 = dx0 + ((len - hw) >> 1), top = dy - 6, door = hash2(dx0, 6, seed ^ 0x3e9) < 0.5 ? -1 : 1;
        for (let yy = top; yy < dy; yy++) for (let xx = hx0; xx < hx0 + hw; xx++) {
          const wallC = xx === hx0 || xx === hx0 + hw - 1, inDoor = (door < 0 ? xx === hx0 : xx === hx0 + hw - 1) && yy >= dy - 4;
          if (wallC && !inDoor && yy > top) set(xx, yy, BJ_PAU_PIQUE, WBJ_TABUA);
          else set(xx, yy, AIR, WBJ_TABUA);
          if (wallC && inDoor) { set(xx, yy, AIR, WBJ_TABUA); }
        }
        // a janela do outro lado: um vão de 1 à altura do rosto
        set(door < 0 ? hx0 + hw - 1 : hx0, dy - 3, AIR, WBJ_TABUA);
        // o telhado de sapê em duas águas, um pouco mais largo
        for (let r = 0; r < 4; r++) for (let xx = hx0 - 1 + r; xx <= hx0 + hw - r; xx++) if (at(xx, top - r + 1) === AIR || r === 0) set(xx, top - r + 1, BJ_SAPE);
        bjHuts.push({ x0: W1(hx0), w: hw, fy: dy, top: top - 3, door, lagoa: C });
      }
    }
    // as passarelas: uma tábua de ponta a ponta entre plataformas vizinhas, quando o vão é curto
    const D = bjDecks.filter(d => d.lagoa === C).sort((a, b) => wdx(a.x0 - C.x0) - wdx(b.x0 - C.x0));
    for (let k = 0; k + 1 < D.length; k++) {
      const a = D[k], b = D[k + 1], g0 = a.x0 + a.w, g1 = b.x0; if (wdx(g1 - g0) > 8) continue;
      let ok = true; for (let xx = g0; wdx(xx - g0) < wdx(g1 - g0); xx++) if (at(xx, dy) !== AIR || at(xx, dy - 1) !== AIR || at(xx, dy - 2) !== AIR) ok = false;
      if (ok) for (let xx = g0; wdx(xx - g0) < wdx(g1 - g0); xx++) set(xx, dy, BJ_TABUA);
    }
  }
  // os pátios do Patíbulo: o cadafalso de tábua sobre estacas no meio, com a escada; o chão de pedra
  for (const C of bjPatios) {
    const w = 12 + ((hash2(C.x0, 1, seed ^ 0x3ea) * 5) | 0), sx0 = Math.round(C.cx - w / 2), sy = C.fy - 5;
    let clear = true; for (let x = sx0 - 1; x <= sx0 + w && clear; x++) for (let y = sy - 9; y < C.fy; y++) if (at(x, y) !== AIR) { clear = false; break; }
    if (!clear) continue;
    for (let x = sx0; x < sx0 + w; x++) set(x, sy, BJ_TABUA);
    for (const px of [sx0, sx0 + (w >> 1), sx0 + w - 1]) for (let y = sy + 1; y < C.fy; y++) set(px, y, BJ_POSTE);
    const lx = hash2(C.x0, 2, seed ^ 0x3eb) < 0.5 ? sx0 - 1 : sx0 + w;
    for (let y = sy; y < C.fy; y++) set(lx, y, BJ_ESCADA);
    bjGallows.push({ cx: W1(Math.round(C.cx)), x0: W1(sx0), w, fy: sy, patio: C });
  }
  // os círculos: menires dentro da poça (ilhas de pedra) e dois de cada lado no chão (baixos: pula-se por cima)
  for (const C of bjCircles) {
    const P = { x0: C.px0, w: C.pw };
    for (let k = 0; k < 3; k++) {   // na água
      const x = P.x0 + 2 + Math.round((P.w - 5) * (k + 0.5) / 3); if (hash2(x, k, seed ^ 0x3ec) < 0.2) continue;
      const h = 4 + ((hash2(x, C.fy, seed ^ 0x3ed) * 2) | 0);
      for (let y = C.fy + 2 - h; y <= C.fy + 2; y++) { set(x, y, BJ_MENIR, WBJ_MENIR); set(x + 1, y, BJ_MENIR, WBJ_MENIR); }
    }
    for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {   // nas beiradas secas
      const x = side < 0 ? P.x0 - 5 - k * 6 : P.x0 + P.w + 3 + k * 6, h = 2 + ((hash2(x, 1, seed ^ 0x3ee) * 2) | 0);
      if (at(x, C.fy - 1) !== AIR || at(x + 1, C.fy - 1) !== AIR || !SOLID[at(x, C.fy)] || !SOLID[at(x + 1, C.fy)]) continue;
      for (let y = C.fy - h; y < C.fy; y++) { set(x, y, BJ_MENIR, WBJ_MENIR); set(x + 1, y, BJ_MENIR, WBJ_MENIR); }
    }
    for (let y = C.top; y < C.fy; y++) for (let x = C.x0; x < C.x0 + C.cw; x++) if (at(x, y) === AIR) walls[I(x, y)] = WBJ_MENIR;
  }
  // a crosta de ferro junta em volta das poças (embaixo e dos lados): é onde o ferro-do-brejo nasce
  for (const P of bjPools) {
    for (let x = P.x0 - 2; wdx(x - P.x0) <= wdx(P.x1 - P.x0) + 2; x++) for (let y = P.wl; y <= P.fy + 3; y++) {
      const i = I(x, y), t = tiles[i]; if (!SOLID[t] || !BJ_SOILS[t] || bjKeep.has(i) || t === BJ_MENIR) continue;
      if (nz(x, y, 6, 0x3ef) > 0.55) tiles[i] = BJ_CROSTA;
    }
  }

  // o Caldeirão: a caixa toda sólida de pedra (o 376 escreve dentro)
  {
    const B = bjBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 58; x <= B.cx + 57; x++) { const i = I(x, y); tiles[i] = BJ_PEDRA; walls[i] = WBJ_PEDRA; if (agua.length) agua[i] = 0; }
  }
  // ---------- as descidas: a boca vira lama, o poço com a escada de corda, a câmara de pouso de tábua com as velas ----------
  for (const E of bjEntries) {
    const x0 = E.x0, L = E.land;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = BJ_LAMA; }
    for (let y = E.fy; y < L.fy - 6; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? walls[i] || WBJ_TURFA : WBJ_TURFA; bjKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 + 3 ? BJ_LAMA : (y - E.fy) % 7 === 3 ? BJ_RAIZ : BJ_TURFA; bjKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = BJ_ESCADA; bjKeep.add(i); } }
    // uma tábua no meio do poço (só a escada passa): quem desce caindo cai a metade
    if (L.fy - 6 - E.fy > 14) { const my = (E.fy + L.fy - 6) >> 1; for (const x of [x0, x0 + 2]) { const i = I(x, my); tiles[i] = BJ_TABUA; bjKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) bjKeep.add(I(x, y));
    // a câmara: o chão de tábua, as paredes de pau a pique, o teto de tábua, a porta para fora
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 4 && y < L.fy) { tiles[i] = AIR; walls[i] = WBJ_TABUA; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 3)) tiles[i] = y === L.fy ? BJ_TABUA : y === L.fy - L.h - 1 ? BJ_TABUA : BJ_PAU_PIQUE;
      else if (!edge) { tiles[i] = W1(x) === W1(x0 + 1) ? BJ_ESCADA : AIR; walls[i] = WBJ_TABUA; }   // a escada de corda desce até o chão do pouso
      else { tiles[i] = W1(x) === W1(x0 + 1) ? BJ_ESCADA : AIR; walls[i] = WBJ_TABUA; }
      bjKeep.add(i);
    }
    for (let y = L.fy - 4; y < L.fy; y++) for (let x = L.ox0; wdx(x - L.ox0) <= wdx(L.ox1 - L.ox0); x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WBJ_TABUA; bjKeep.add(i); }
    for (let x = L.ox0; wdx(x - L.ox0) <= wdx(L.ox1 - L.ox0); x++) { const i = I(x, L.fy); tiles[i] = BJ_TABUA; bjKeep.add(i); const j = I(x, L.fy - 5); if (!SOLID[tiles[j]]) tiles[j] = BJ_PAU_PIQUE; bjKeep.add(j); }
    // duas velas pretas no chão, longe da escada: a luz do pouso
    for (const lx of L.side > 0 ? [L.x0 + 6, L.x0 + 12] : [L.x0 + 3, L.x0 + 9]) if (tiles[I(lx, L.fy - 1)] === AIR) tiles[I(lx, L.fy - 1)] = BJ_VELA;
  }
  // ---------- as Valas de Escoamento: o poço reto com a escada de corda até a última linha ----------
  for (const X of bjExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WBJ_PEDRA; bjKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = y > X.fy - 8 ? BJ_CROSTA : BJ_PEDRA; bjKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = BJ_ESCADA; bjKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2]) { const i = I(x, my); tiles[i] = BJ_TABUA; bjKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { bjKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = BJ_PEDRA; } }
    tiles[I(X.x0 + 1, X.fy)] = BJ_PEDRA;
  }
  // as beiradas das poças ficam: túnel nenhum abre a bacia (a água não vaza)
  for (const P of bjPools) { for (const i of P.rim || []) { if (!SOLID[tiles[i]]) tiles[i] = BJ_TURFA; bjKeep.add(i); } for (let x = P.x0 - 1; wdx(x - P.x0) <= wdx(P.x1 - P.x0) + 1; x++) for (let y = P.wl; y <= P.fy + 1; y++) { const i = I(x, y); if (SOLID[tiles[i]]) bjKeep.add(i); } delete P.rim; }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x3f9c);
  const vein = (ore, n, d0, d1, lmin, lmax, host, near) => {
    for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) {
      let x, y;
      if (near) { const s = near(); if (!s) break; x = s[0] + ((R4() * 13) | 0) - 6; y = s[1] + 1 + ((R4() * 6) | 0); }
      else { x = (R4() * WW) | 0; y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); }
      if (y < S0 + mb(d0) || y > S0 + mb(d1)) continue;
      k++;
      const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !bjKeep.has(i) && inB(x, y)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(BJ_O_CARVAO, 28 * WSC * K, 0, 186, 3, 6, t => t === BJ_TURFA || t === BJ_ARGILA);
  // o ferro-do-brejo: perto das poças (na crosta e na argila em volta), mais fundo mais
  const sites = bjPools.map(P => [P.cx, P.fy]);
  const pick = (d0, d1) => () => { const L = sites.filter(s => s[1] >= S0 + mb(d0) - 4 && s[1] < S0 + mb(d1) + 4); return L.length ? L[(R4() * L.length) | 0] : null; };
  const feHost = t => t === BJ_CROSTA || t === BJ_ARGILA || t === BJ_PEDRA || t === BJ_TURFA;
  vein(BJ_O_FERRO, 4 * WSC * K, 0, 46, 3, 5, feHost, pick(0, 46));
  vein(BJ_O_FERRO, 5 * WSC * K, 46, 98, 3, 5, feHost, pick(46, 98));
  vein(BJ_O_FERRO, 5 * WSC * K, 98, 150, 3, 6, feHost, pick(98, 150));
  vein(BJ_O_FERRO, 5 * WSC * K, 150, 186, 3, 6, feHost, pick(150, 186));
  vein(BJ_O_FERRO, 6 * WSC * K, 20, 186, 2, 4, t => t === BJ_CROSTA || t === BJ_PEDRA);
}

function bjAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = BJ_S0, YB = BJ_LYR(), R3 = mulberry32(seed ^ 0x3d3c1);
  const bjRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!bjRow(y)) return; const i = I(x, y); if (bjKeep.has(i) || inBjHall(W1(x), y, 4)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WBJ_PEDRA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const bjSolid = t => SOLID[t] && BJ_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = bjBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const wet = i => agua.length && agua[i];
  const inPool = (x, y, m = 0) => bjPools.some(P => wdx(x - P.x0) >= -m && wdx(x - P.x0) <= wdx(P.x1 - P.x0) + m && y >= P.wl - m && y <= P.fy + m);

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of bjEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!bjEntries.length && bjCh.length) flood(I(bjCh[0].cx, Math.round(bjCh[0].cy)));
  if (B) for (let y = B.top - 4; y <= B.fy + 4; y++) for (let x = B.cx - 59; x <= B.cx + 58; x++) reach[I(x, y)] = 1;
  const RB = S0 * WW, lab = new Uint8Array((YB - S0) * WW), comps = [];
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (reach[i] || lab[i - RB] || SOLID[tiles[i]] || !walls[i]) continue;
    const comp = []; lab[i - RB] = 1; stack.push(i);
    while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= RB && nb < YB * WW && !lab[nb - RB] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb - RB] = 1; stack.push(nb); } }
    if (comp.length >= 16) comps.push(comp);
  }
  comps.sort((a, c) => c.length - a.length);
  const org = new Int32Array((YB - S0) * WW);
  const bfs = C => {
    org.fill(-1); const q = []; let hit = -1; for (const c of C) { org[c - RB] = c; q.push(c); }
    for (let h = 0; h < q.length && hit < 0; h++) {
      const c = q[h], x = c % WW, row = c - x;
      for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
        if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb - RB] >= 0 || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
        if (reach[nb] && !SOLID[tiles[nb]]) { org[nb - RB] = c; hit = nb; break; }
        if (bjKeep.has(nb) || bjKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
        org[nb - RB] = c;
        q.push(nb);
      }
    }
    return hit;
  };
  for (let pass = 0; pass < comps.length && pass < 60 * WSC * LAYER_K; pass++) {
    const bestC = comps[pass]; if (reach[bestC[0]]) continue;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inBox(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { const h = bfs(bestC); if (h >= 0) { let o = h; while (org[o - RB] !== o) o = org[o - RB]; best = [o % WW, (o / WW) | 0, h % WW, (h / WW) | 0]; } }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    {
      const [ax, ay, bx, by] = best, n = Math.max(1, Math.ceil(Math.abs(by - ay) / 11)); let x = ax, y = ay, dir = wdx(bx - ax) < 0 ? -1 : 1;
      for (let k = 1; k <= n; k++) { const ny = Math.round(ay + (by - ay) * k / n), nx = k === n ? ax + wdx(bx - ax) : x + dir * 12; worm(x, y, nx, ny, 1.3, 0x36a0 + pass + (k - 1) * 977); x = nx; y = ny; dir = -dir; }
    }
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {
      const hit = bfs(bestC);
      for (let c = hit; c >= 0 && org[c - RB] !== c; c = org[c - RB]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. a água das poças (o 378 enche de novo depois das ligações do 87) ----------
  bjWater();

  // ---------- 3. escada de corda em todo desnível de 5 ou mais (nunca na água) ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR && !wet(I(lx, k))) k++;
        if (k - y < 5 || (!SOLID[at(lx, k)] && !wet(I(lx, k)))) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || BJ_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (bjKeep.has(i) || !walls[i] || wet(i)) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = BJ_ESCADA; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || BJ_CLIMB(at(x, y - 1)) || BJ_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (bjKeep.has(I(x, yy)) || !walls[I(x, yy)] || wet(I(x, yy))) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, BJ_ESCADA);
  }

  // ---------- 4. as cordas de forca nos pátios do Patíbulo e o crânio na estaca nas portas deles ----------
  for (const C of bjPatios) for (let x = C.x0 + 4; x < C.x0 + C.pw - 4; x += 5 + ((R3() * 5) | 0)) {
    let y = C.top; while (y < C.fy - 6 && at(x, y) !== AIR) y++;
    if (at(x, y) !== AIR || !bjSolid(at(x, y - 1)) || BJ_CLIMB(at(x - 1, y)) || BJ_CLIMB(at(x + 1, y))) continue;
    const n = 3 + ((R3() * 5) | 0); for (let j = 0; j < n && at(x, y + j) === AIR && at(x, y + j + 3) === AIR; j++) put(x, y + j, BJ_CORDA);
  }
  // as velas das cabanas (uma luz em cada) e as velas no meio dos círculos
  for (const H of bjHuts) { const x = H.x0 + 2 + ((R3() * (H.w - 4)) | 0); if (at(x, H.fy - 1) === AIR && bjSolid(at(x, H.fy))) put(x, H.fy - 1, BJ_VELA); }
  for (const C of bjCircles) for (const x of [C.px0 - 2, C.px0 + C.pw + 1]) { if (at(x, C.fy - 1) === AIR && bjSolid(at(x, C.fy)) && R3() < 0.7) put(x, C.fy - 1, BJ_VELA); }

  // ---------- 5. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || bjKeep.has(i)) continue;
    const b = brejoBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inBjLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    if (wet(i)) continue;
    // o fogo-fátuo: sobre a água parada das bacias e das lagoas, um pouco acima
    if (wet(i + WW) && !wet(i) && q < 0.012 && b <= 1) { put(x, y - 1 - ((R3() * 2) | 0), at(x, y - 2) === AIR ? BJ_FATUO : AIR); continue; }
    const floor = bjSolid(dn) && BLOCKY[dn] && up === AIR, ceil = bjSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (q < 0.06 && b <= 1) put(x, y, BJ_MUSGO);
      else if (q < 0.03) put(x, y, BJ_MUSGO);
      else if (q < 0.075 && gap >= 3) put(x, y, BJ_GOTA);
      else if (q < 0.085 && gap >= 4 && (b === 1 || b === 3)) put(x, y, BJ_AMULETO);
      continue;
    }
    if (!floor || BJ_CLIMB(at(x - 1, y)) || BJ_CLIMB(at(x + 1, y))) continue;
    const mud = dn === BJ_LAMA || dn === BJ_TURFA;
    if (b === 0) { if (q < 0.08 && mud) put(x, y, BJ_JUNCO); else if (q < 0.11 && mud) put(x, y, BJ_TOUCEIRA); else if (q < 0.12) put(x, y, BJ_OSSOS); }
    else if (b === 1) { if (q < 0.07 && mud) put(x, y, BJ_JUNCO); else if (q < 0.09) put(x, y, BJ_TOUCEIRA); else if (q < 0.1 && dn === BJ_TABUA) put(x, y, BJ_VELA); }
    else if (b === 2) { if (q < 0.03) put(x, y, BJ_OSSOS); else if (q < 0.045 && dn !== BJ_TABUA) put(x, y, BJ_CRANIO); else if (q < 0.06 && mud) put(x, y, BJ_TOUCEIRA); }
    else { if (q < 0.025) put(x, y, BJ_OSSOS); else if (q < 0.035 && dn !== BJ_TABUA) put(x, y, BJ_VELA); else if (q < 0.05) put(x, y, BJ_CRANIO); }
  }

  // ---------- 6. os objetos ----------
  bjPlaceProps();
}

/* ---------- a água: cada poça enche até a fileira de cima (ou a mais alta que não vaza) ---------- */
function bjWater() {
  if (!agua.length) return;
  for (const P of bjPools) {
    if (P.cells) for (const c of P.cells) if (agua[c] === AGUA_LIMPA) agua[c] = AGUA_SECO;
    P.cells = null;
    const max = (wdx(P.x1 - P.x0) + 3) * (P.fy - P.wl + 3) + 40;
    let sx = -1, sy = P.fy;
    for (let y = P.fy; y >= P.wl && sx < 0; y--) for (let k = 0, n = wdx(P.x1 - P.x0); k <= n; k++) { const x = wrapX(P.cx + (k & 1 ? -1 : 1) * ((k + 1) >> 1)); if (aguaCabe(y * WW + x)) { sx = x; sy = y; break; } }
    if (sx < 0) continue;
    for (let nv = P.wl; nv <= sy; nv++) {
      const n = aguaBasin(sx, sy, nv, AGUA_LIMPA, max);
      if (n > 0) {
        const cells = [], st = [sy * WW + wrapX(sx)], seen = new Set(st);
        while (st.length) { const c = st.pop(); if (agua[c] !== AGUA_LIMPA) continue; cells.push(c); const x = c % WW, row = c - x; for (const nb of [row + wrapX(x - 1), row + wrapX(x + 1), c - WW, c + WW]) if (!seen.has(nb) && nb >= 0 && nb < WW * WH) { seen.add(nb); st.push(nb); } }
        P.cells = cells; P.nv = nv; break;
      }
    }
  }
  // o que ficou debaixo da água e não vive nela sai (vela, osso, junco)
  for (const P of bjPools) if (P.cells) for (const c of P.cells) { const t = tiles[c]; if (t === BJ_VELA || t === BJ_OSSOS || t === BJ_JUNCO || t === BJ_TOUCEIRA || t === BJ_CRANIO || t === BJ_FATUO || t === BJ_MUSGO || t === BJ_GOTA || t === TORCH) tiles[c] = AIR; }
}

/* ---------- as bocas das descidas por último ---------- */
function bjExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of bjEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? BJ_ESCADA : AIR; bjKeep.add(i); }
}
/* ---------- a subida garantida: do Caldeirão, das cabanas, das plataformas, dos pátios e do pé das Valas o herói
   tem de conseguir voltar às descidas (pulo de 3 blocos; escada e corda sobem; na água nada-se para cima) ---------- */
function bjClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = BJ_S0, YB = BJ_LYR(), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, Wt = (x, y) => !!(agua.length && agua[I(x, y)]), L = (x, y) => BJ_CLIMB(tiles[I(x, y)]) || Wt(x, y);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !inBjHall(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
    F[(y - Y0) * WW + x] = f;
  };
  const flags = () => { for (let y = Y0 + 1; y < YB; y++) for (let x = 0; x < WW; x++) flag1(x, y); };
  const arrive = (p, r, c, dir) => { if (F[c] & 2) return dir === 1 && r === 0 ? -1 : 4; if (dir === 0) return r === 4 && !(F[p] & 4) ? 0 : r; if (dir === 1) return r === 0 ? -1 : F[p] & 8 ? 4 : r === 4 ? 3 : r - 1; return 0; };
  const spread = qt => {
    let qh = 0;
    while (qh < qt) {
      const t = Q[qh++], c = (t / 5) | 0, rt = t - c * 5, x = c % WW, row = c - x;
      for (let d = 0; d < 4; d++) {
        const p = d === 0 ? row + (x === 0 ? WW - 1 : x - 1) : d === 1 ? row + (x === WW - 1 ? 0 : x + 1) : d === 2 ? c + WW : c - WW;
        if (p < 0 || p >= NC || !(F[p] & 1)) continue;
        const dir = d < 2 ? 0 : d === 2 ? 1 : 2;
        for (let r = F[p] & 2 ? 4 : 0; r <= 4; r++) { const k = p * 5 + r; if (!good[k] && arrive(p, r, c, dir) === rt) { good[k] = 1; Q[qt++] = k; } }
      }
    }
  };
  const closure = () => {
    good.fill(0); let qt = 0;
    for (let y = Y0 + 1; y <= S0 - 3; y++) for (let x = 0; x < WW; x++) { const c = (y - Y0) * WW + x, f = F[c]; if (f & 1) for (let r = f & 2 ? 4 : 0; r <= 4; r++) { good[c * 5 + r] = 1; Q[qt++] = c * 5 + r; } }
    spread(qt);
  };
  const patch = (x, top, bot) => {
    for (let y = Math.max(Y0 + 1, top - 2); y <= Math.min(YB - 1, bot + 2); y++) for (let dx = -1; dx <= 1; dx++) flag1(W1(x + dx), y);
    let qt = 0;
    for (let y = Math.max(Y0 + 1, top - 3); y <= Math.min(YB - 1, bot + 3); y++) for (let dx = -2; dx <= 2; dx++) { const c = (y - Y0) * WW + W1(x + dx); for (let r = 0; r < 5; r++) if (good[c * 5 + r]) Q[qt++] = c * 5 + r; }
    spread(qt);
  };
  const forward = c0 => {
    seen.fill(0); any.fill(0); let qh = 0, qt = 0; const s0 = c0 * 5 + 4; seen[s0] = 1; Q[qt++] = s0; any[c0] = 1;
    while (qh < qt) {
      const t = Q[qh++], c = (t / 5) | 0, r = t - c * 5, x = c % WW, row = c - x;
      for (let d = 0; d < 4; d++) {
        const n = d === 0 ? row + (x === 0 ? WW - 1 : x - 1) : d === 1 ? row + (x === WW - 1 ? 0 : x + 1) : d === 2 ? c - WW : c + WW;
        if (n < 0 || n >= NC || !(F[n] & 1)) continue;
        const r1 = arrive(c, r, n, d < 2 ? 0 : d === 2 ? 1 : 2); if (r1 < 0) continue;
        const k = n * 5 + r1; if (!seen[k]) { seen[k] = 1; any[n] = 1; Q[qt++] = k; }
      }
    }
  };
  const soft = t => t === BJ_TURFA || t === BJ_LAMA || t === BJ_ARGILA || t === BJ_PEDRA || t === BJ_RAIZ || t === BJ_CROSTA;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || bjKeep.has(I(x, y)) || inBjHall(x, y, 1) || Wt(x, y)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !bjKeep.has(I(x, t)) && !inBjHall(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = BJ_ESCADA; if (!walls[i]) walls[i] = WBJ_PEDRA; if (agua.length) agua[i] = 0; } }
    return best;
  };
  const starts = [];
  if (bjBoss) for (const D of bjBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const H of bjHuts) starts.push([H.x0 + (H.w >> 1), H.fy - 1]);
  for (const G of bjGallows) starts.push([G.x0 + (G.w >> 1), G.fy - 1]);
  for (const C of bjPatios) starts.push([Math.round(C.cx) + 8, C.fy - 1]);
  for (const C of bjCircles) starts.push([C.x0 + 3, C.fy - 1]);
  for (const C of bjLagoas) starts.push([C.x0 + 3, C.fy - 1]);
  for (const X of bjExits) starts.push([X.x0 + 2, X.top - 1]);
  let fixes = 0, ns = 0;
  flags(); closure();
  for (const [x0, y0] of starts) {
    if (SOLID[tiles[I(x0, y0)]]) continue;
    for (let k = 0; k < 12; k++) {
      ns++;
      const sx = W1(x0); let y = y0; while (y < YB - 1 && !S(sx, y + 1) && !L(sx, y)) y++;
      const c = (y - Y0) * WW + sx;
      if (F[c] & 1) { if (good[c * 5 + 4]) break; forward(c); } else any.fill(0);
      const fx = repair(); if (!fx) break;
      fixes++; patch(fx[0], fx[1], fx[2]);
    }
  }
  bjClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (372): por faixa, no chão, debaixo do teto e na parede; nunca na água, no pouso nem no
   Caldeirão; nunca sobre escada, estaca ou corda ---------- */
function bjPlaceProps() {
  if (typeof BJ_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x3b3c8);
  const S0 = BJ_S0, YB = BJ_LYR(), used = new Uint8Array(WW * WH * 2), BF = typeof BJ_BACK_FLOOR !== 'undefined' ? BJ_BACK_FLOOR : {};
  const B = bjBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || bjKeep.has(i) || wet(i) || inBox(W1(x), y, 1) || inBjLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && BJ_SOILS[t] && t !== BJ_SAPE && t !== BJ_MENIR; };
  const varOf = def => (R() * def.vars.length) | 0;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = BJ_BAND_NAMES[clamp(brejoBand(y), 0, 3)], plan = BJ_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || wet(i) || inBox(W1(k), y, 2) || inBjLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (!fits(px, y0, tw, th, 1, false)) continue;
              mark(px, y0, tw, th, 1); n--;
              const sup = []; if (onFloor) for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), onFloor ? (y + 1) * T - V.h : y0 * T + ((th * T - V.h) >> 1), sup);
            }
          }
        }
      }
    }
  }
}

// a ordem: a camada, o Caldeirão (376: bjDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('brejo', () => {
  if (!BREJO) return;
  try { bjBuild(); bjAfter(); if (typeof bjDress === 'function') bjDress(); bjExitClear(); bjClimbFix(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada atrás do Brejo: a mata afogada na Turfeira, as palafitas ao longe nas Palafitas, as
   forcas e as pedras em pé ao longe no Patíbulo e no Círculo ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!BREJO) return;
  const Y1 = Math.min(WH, BJ_S0 + BJ_D + 4);
  for (let y = Math.max(BJ_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - BJ_S0) + (depthNz(x, y, 25, seed ^ 0x3e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x3e12);
    DEEPT[i] = d < BJ_BANDS[1] ? (n > 0.75 ? DP_BJ_PALAFITAS : DP_BJ_MATA) : d < BJ_BANDS[2] ? (n > 0.6 ? DP_BJ_MATA : DP_BJ_PALAFITAS) : (n > 0.72 ? DP_BJ_MATA : DP_BJ_FORCAS);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (BREJO && ty >= BJ_S0 && ty < BJ_S0 + BJ_D) return inBjHall(tx, ty, 2) ? BJ_ZONE0 + 3 : BJ_ZONE0 + clamp(brejoBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), inteiros; a sanguessuga não está aqui: ela nasce na água pelo spawner dela (abaixo)
Object.assign(CATH_SPAWN, {
  [BJ_ZONE0]: [[['bjturfeiro', 20], ['bjsapo', 22], ['bjmao', 14], ['bjlavadeira', 18], ['bjcorvo', 8]], 8],
  [BJ_ZONE0 + 1]: [[['bjsapo', 20], ['bjvassoura', 18], ['bjlavadeira', 18], ['bjbruxa', 18], ['bjinquisidor', 18]], 9],
  [BJ_ZONE0 + 2]: [[['bjenforcado', 26], ['bjcorvo', 14], ['bjinquisidor', 22], ['bjbruxa', 16], ['bjturfeiro', 14]], 9],
  [BJ_ZONE0 + 3]: [[['bjvassoura', 16], ['bjmao', 20], ['bjbruxa', 18], ['bjcorvo', 10], ['bjenforcado', 16], ['bjinquisidor', 18]], 10]
});
for (let z = BJ_ZONE0; z < BJ_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const BJ_NO_SPAWN = (tx, ty) => bjSafe(tx, ty) || inBjHall(tx, ty, 4) || bjExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
const BJ_TYPES = ['bjsapo', 'bjsangue', 'bjenforcado', 'bjturfeiro', 'bjcorvo', 'bjvassoura', 'bjmao', 'bjinquisidor', 'bjlavadeira', 'bjbruxa'];
// níveis pela posição no 129 (layerLvl no 52); nada nasce perto do pouso, no Caldeirão nem nas Valas
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!BREJO || !e || e.boss || (D && D.boss) || e.bjMinion || bjChefeSpawn) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - BJ_S0;
  if (d >= 0 && d < BJ_D) {
    if (zone >= BJ_ZONE0 && zone <= BJ_ZONE0 + 3 && BJ_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.bjVoid = true; return e; }
    const lvl = layerLvl(layerLo('brejo'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].bjVoid) enemies.splice(k, 1); });
// a sanguessuga: nasce na água funda (2 de fundo, pelo menos) das bacias e das lagoas, fora da tela, até 3 de uma vez
let bjSgT = 0;
HOOK.update.push(dt => {
  if (!BREJO || !pl || pl.dead || state !== 'play' || bossFight || !agua.length) return;
  if ((bjSgT -= dt) > 0) return; bjSgT = 2 + Math.random() * 2;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T), b = brejoBand(pty);
  if (b !== 0 && b !== 1) return;
  if (enemies.filter(e => e.type === 'bjsangue' && !e.dead).length >= 3 || enemies.length >= 10) return;
  const L = bjPools.filter(P => P.cells && P.cells.length > 20 && Math.abs(wdx(P.cx - ptx)) < 60 && Math.abs(P.fy - pty) < 30);
  if (!L.length) return;
  const P = L[(Math.random() * L.length) | 0];
  for (let a = 0; a < 10; a++) {
    const c = P.cells[(Math.random() * P.cells.length) | 0], x = c % WW, y = (c / WW) | 0;
    if (!aguaAt(x, y - 1) || Math.hypot(wdx(x - ptx), y - pty) < 14 || bjSafe(x, y)) continue;
    spawnEnemy('bjsangue', x * T, y * T + 3, BJ_ZONE0 + clamp(b, 0, 3)); return;
  }
});

/* ---------- partículas: o vapor baixo em cima da água, gotas caindo, mosquitos nas Palafitas, a cinza das
   fogueiras no Patíbulo ---------- */
HOOK.update.push(dt => {
  if (!BREJO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = brejoBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * 4) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (aguaAt(Math.floor(x / T), Math.floor(y / T) + 1) && !aguaAt(Math.floor(x / T), Math.floor(y / T))) parts.push({ x, y: Math.floor(y / T) * T + T - 2, vx: rnd(-4, 4), vy: rnd(-3, -1), g: 0, life: 3, max: 3, col: '#5a5444', size: 1 });   // o vapor do brejo
    else if (b === 1 && Math.random() < 0.5) { for (let k = 0; k < 3; k++) parts.push({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-20, 20), vy: rnd(-20, 20), g: 0, life: 0.8, max: 0.8, col: '#2a2418', size: 1 }); }   // o mosquito
    else if (b === 2 && Math.random() < 0.4) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(2, 6), g: 0, life: 3.4, max: 3.4, col: Math.random() < 0.6 ? '#4a4440' : '#2a2622', size: 1 });   // cinza de fogueira velha
    else parts.push({ x, y, vx: 0, vy: rnd(30, 60), g: 120, life: 0.8, max: 0.8, col: '#7a6a4a', size: 1 });   // a gota
  }
});

/* ---------- a forja e o vilarejo: o ferro-do-brejo na fornalha (377 tem os itens), as lojas ---------- */
FURN.min_ferrobrejo = { bar: 'barra_ferrobrejo', n: 6, t: 10 };
Object.assign(MAT_VAL, { min_ferrobrejo: 26, barra_ferrobrejo: 190, pele_sapo: 14, corda_forca: 10, pena_corvo: 6, erva_brejo: 12, vela_preta: 16 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'erva_brejo' || id === 'pele_sapo'; c.hint = c.hint.replace(/\.$/, '') + ', ervas do brejo e pele de sapo.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_ferrobrejo', 'barra_ferrobrejo', 'corda_forca'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', ferro-do-brejo e corda de forca.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'vela_preta' || id === 'pena_corvo'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ', velas pretas e penas de corvo.'; } }
