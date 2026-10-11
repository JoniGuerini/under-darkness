'use strict';

/* ================= o Mar Sem Sol: o mundo (docs/camadas/10-mar-sem-sol.md, seção 3) =================
   A décima segunda camada, debaixo do Reino Élfico (msAbove, 260). Um vão de ar que dá a volta no mundo sobre um mar
   inteiro; ilhas de basalto com praias de areia negra, navios encalhados e cascos virados, palafitas da gente-peixe;
   no fundo, a Floresta de Algas nos recifes, as fendas da Fossa com os templos e, debaixo do chão do mar, as Chaminés
   Negras. Dois caminhos para baixo: o molhado (nadar, correntes, respiradouros, o templo com o domo de ar e o túnel
   de trás) e o seco (os túneis por dentro das ilhas, com sifões curtos na Fossa), que é o garantido. Em passos:
     1. a rocha por faixa: a pedra-do-poço do Reino afina e vira Rocha do Mar; Rocha com Cracas nas Praias, Recife na
        Floresta, Lodo na Fossa, Sulfeto nas Chaminés
     2. o vão e o mar: o teto com estalactites, o nível do mar fixo (MS_NIVEL), o fundo por ruído largo, as ilhas
        (duas garantidas debaixo das descidas), as plataformas de recife, o mar aberto do Leviatã do outro lado
     3. as fendas da Fossa e, no pé de cada uma, um templo com domo de ar e o túnel de trás até as Chaminés
     4. as Chaminés: grutas secas ligadas por túneis, as poças ferventes, os dois Poços de Vapor (a saída)
     5. os túneis secos por dentro das ilhas (busca de caminho que nunca chega perto do mar) com os sifões
     6. os navios encalhados, os cascos de quilha para cima (sino de ar), as palafitas, as descidas do Reino (a Raiz
        que pende do teto com o cordame, e a Câmara de Pouso)
     7. os veios: carvão nas ilhas e grutas, oricalco no sulfeto e nas paredes da Fossa
   Depois (msAfter): tudo alcançável das descidas, cordame em todo desnível de 5, a água (o mar por bacia, menos os
   sinos e os domos; os sifões; as poças ferventes; o plâncton; os respiradouros), a decoração e os objetos (262). Por
   fim o mar do Leviatã (266: msDress), as bocas das descidas e a subida garantida (msClimbFix, que trata a água como
   escada). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 57 a 60, o spawn por meio (água, ar, fundo) e o nível (25 e 26 pela posição no
   129), as partículas. */

const MS_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [MS_AREIA, MS_ROCHA, MS_CRACAS, MS_RECIFE, MS_CORAL, MS_LODO, MS_SULFETO, MS_CASCO, MS_CONVES, MS_TEMPLO, MS_O_CARVAO, MS_O_ORICALCO, MS_O_ORICALCO_S]) MS_SOILS[t] = 1;
const MS_CLIMB = t => t === MS_CORDAME || t === MS_CORRENTE || t === CHAIN || t === msAbove().climb;
let msVents = [], msSiphons = [], msPools = [], msTunnels = [];
const msDry = new Set();     // células secas de propósito abaixo do nível do mar (sinos de ar, domos, porões): a água não entra

function msBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = msAbove();
  MS_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  MS_NIVEL = MS_S0 + MS_NIVEL_D;
  const S0 = MS_S0, YB = Math.min(WH - 8, S0 + MS_D), DB = YB - S0, SL = MS_NIVEL;
  const R = mulberry32(seed ^ 0x6a51), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / MS_D);
  const bandOf = d => d < MS_BANDS[1] ? 0 : d < MS_BANDS[2] ? 1 : d < MS_BANDS[3] ? 2 : 3;
  msEntries = []; msLand = []; msExits = []; msBoss = null; msIslands = []; msShips = []; msHulls = []; msVillages = []; msTemples = []; msTrenches = []; msGrottos = [];
  msVents = []; msSiphons = []; msPools = []; msTunnels = []; msKeep.clear(); msDry.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a pedra de cima afina nas últimas 10 linhas e vira rocha do mar
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x6b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = MS_ROCHA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      const d = y - S0 + (nz(x, y, 18, 0x6b3) - 0.5) * 8, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x6a1), n2 = nz(x, y, 14, 0x6a2);
      let tt = MS_ROCHA, w = WMS_ROCHA;
      if (y >= YB) { tt = MS_SULFETO; w = WMS_SULFETO; }
      else if (b === 0) { if (n1 > 0.72) tt = MS_CRACAS; }
      else if (b === 1) { if (n2 > 0.74) tt = MS_RECIFE; }
      else if (b === 2) { if (n1 > 0.76) tt = MS_LODO; }
      else { tt = n2 > 0.76 ? MS_ROCHA : MS_SULFETO; w = WMS_SULFETO; }
      tiles[i] = tt; walls[i] = w;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. o vão e o mar: o perfil coluna por coluna ----------
  const ceil = new Int16Array(WW), bot = new Int16Array(WW), isl = new Int16Array(WW).fill(-1);
  // as descidas: dos poços de raiz do Reino; até duas, longe uma da outra
  const ub = A.boss;
  const halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 3) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
  const picks = [];
  for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
  for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
  if (!picks.length) { const c0 = (R() * WW) | 0; picks.push({ cx: c0, x0: c0, fy: S0 - 1 }, { cx: W1(c0 + (WW >> 1)), x0: W1(c0 + (WW >> 1)), fy: S0 - 1 }); }
  for (const c of picks) if (c.x0 === undefined) c.x0 = W1(Math.round(c.cx) - 1);
  // o mar do Leviatã: do outro lado do mundo em relação às descidas
  const ax = picks.reduce((s, e) => s + wdx(e.x0 - picks[0].x0), 0) / picks.length + picks[0].x0;
  const bcx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), BHW = 70;
  const nearBoss = (x, m) => Math.abs(wdx(x - bcx)) < BHW + m;
  // as ilhas: duas debaixo das descidas (a raiz cai num canto do platô), as outras soltas
  const addIsland = (cx, ph, top, entry) => {
    const beach = Math.round((SL - top) / 0.8), hw = ph + beach;
    const I0 = { cx: W1(cx), ph, top, hw, x0: W1(cx - hw), x1: W1(cx + hw), entry: entry || null, shore: [W1(cx - hw), W1(cx + hw)], shelf: 3 + ((R() * 6) | 0) };
    msIslands.push(I0); return I0;
  };
  for (const c of picks) {
    const side = R() < 0.5 ? -1 : 1, ph = 12 + ((R() * 4) | 0);
    addIsland(c.x0 + 1 + side * (ph - 6), ph, S0 + 24 + ((R() * 2) | 0), c);
  }
  for (let tries = 0; msIslands.length < 2 * WSC && tries < 800; tries++) {
    const ph = 4 + ((R() * 9) | 0), top = S0 + 22 + ((R() * 6) | 0), beach = Math.round((SL - top) / 0.8), hw = ph + beach, cx = (R() * WW) | 0;
    if (nearBoss(cx, hw + 30)) continue;
    if (msIslands.some(J => Math.abs(wdx(J.cx - cx)) < J.hw + hw + 24)) continue;
    addIsland(cx, ph, top, null);
  }
  // o perfil de uma ilha na coluna x: o platô, a praia em rampa, a encosta debaixo da água, a plataforma de recife e a
  // queda até o fundo
  const islandH = (J, x) => {
    const d = Math.abs(wdx(x - J.cx)) - J.ph + (nz(x, 0, 30, 0x6a9) - 0.5) * 2;
    if (d <= 0) return J.top;
    if (d <= J.hw - J.ph) return Math.round(J.top + d * 0.8);
    const u = d - (J.hw - J.ph), shelfY = S0 + 46;
    const y1 = SL + Math.round(u * 3);
    if (y1 < shelfY) return y1;
    const u2 = u - (shelfY - SL) / 3;
    if (u2 < J.shelf) return shelfY;
    return Math.round(shelfY + (u2 - J.shelf) * 7);
  };
  for (let x = 0; x < WW; x++) {
    let c = S0 + 6 + Math.round((nz(x, 0, 18, 0x6a3) - 0.5) * 8);
    // o fundo: ruído largo entre 56 e 108 m; no mar do Leviatã, plano a 48 do nível
    // em patamares de 3 (trechos planos para os objetos e degraus para subir nadando)
    let f = S0 + 56 + Math.round((nz(x, 0, 20, 0x6a4) * 44 + nz(x, 0, 60, 0x6a5) * 8) / 3) * 3;
    const bd = Math.abs(wdx(x - bcx));
    if (bd < BHW + 2) f = SL + 48; else if (bd < BHW + 24) f = Math.round(lerp(SL + 48, f, (bd - BHW - 2) / 22));
    let bi = -1;
    for (let k = 0; k < msIslands.length; k++) { const h = islandH(msIslands[k], x); if (h < f) { f = h; bi = k; } }
    ceil[x] = c; bot[x] = Math.min(f, YB - 30); isl[x] = bi;
  }
  // as estalactites grandes: nunca sobre o platô das descidas, nunca a menos de 4 da água (12 sobre as ilhas)
  for (let k = 0; k < 16 * WSC; k++) {
    const cx = (R() * WW) | 0, hw = 3 + R() * 5, len = 6 + R() * 12;
    if (picks.some(c => Math.abs(wdx(c.x0 + 1 - cx)) < hw + 6)) continue;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const X = W1(x), q = 1 - Math.abs(x + 0.5 - cx) / hw; if (q <= 0) continue;
      const lim = Math.min(SL - 4, bot[X] - (isl[X] >= 0 ? 12 : 4), nearBoss(X, 6) ? SL - 12 : 9999);
      ceil[X] = Math.max(ceil[X], Math.min(lim, Math.round(ceil[X] + len * q * q + (nz(X, 0, 40, 0x6a6) - 0.5) * 2)));
    }
  }
  msBoss = { cx: bcx, x0: W1(bcx - BHW), x1: W1(bcx + BHW), w: BHW * 2, fy: SL + 48, sl: SL, top: Math.max(S0 + 2, Math.min(...Array.from({ length: 2 * BHW + 1 }, (_, k) => ceil[W1(bcx - BHW + k)])) - 1), bar: [W1(bcx - BHW), W1(bcx + BHW)] };

  // ---------- as máscaras ----------
  const cv = new Uint8Array(NN);       // aberto
  const seaM = new Uint8Array(NN);     // o vão e o mar (o que a busca dos túneis secos não pode encostar)
  const dig = (x, y) => { if (y < S0 + 1 || y > YB - 2) return; cv[I(x, y)] = 1; };
  for (let x = 0; x < WW; x++) for (let y = ceil[x]; y < bot[x]; y++) { const i = I(x, y); cv[i] = 1; seaM[i] = 1; }

  // ---------- 3. as fendas da Fossa e os templos ----------
  const busyL = [];   // caixas ocupadas { x0, x1, y0, y1 }
  const busy = (x0, x1, y0, y1, m = 3) => busyL.some(b => wdx(x0 - b.x1) <= m && wdx(b.x0 - x1) <= m && y0 <= b.y1 + m && b.y0 <= y1 + m);
  const take = (x0, x1, y0, y1) => busyL.push({ x0, x1, y0, y1 });
  const TB = S0 + mb(141);
  for (let k = 0, tries = 0; k < 2 * WSC && tries < 500; tries++) {
    const cx = (R() * WW) | 0, w = 8 + ((R() * 7) | 0);
    let ok = !nearBoss(cx, 40); for (let x = cx - w; x <= cx + w && ok; x++) if (bot[W1(x)] < S0 + 84) ok = false;
    if (!ok || msTrenches.some(t => Math.abs(wdx(t.cx - cx)) < 60)) continue;
    let top = 9999; for (let x = cx - (w >> 1); x <= cx + (w >> 1); x++) top = Math.min(top, bot[W1(x)]);
    for (let y = top - 2; y < TB; y++) {
      const hw = w / 2 + (nz(cx, y, 40, 0x6b8) - 0.5) * 3 - (y > TB - 4 ? (y - TB + 4) * 0.5 : 0);
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const i = I(x, y); cv[i] = 1; seaM[i] = 1; }
    }
    const T0 = { cx: W1(cx), w, top, bot: TB };
    msTrenches.push(T0); take(W1(cx - w), W1(cx + w), top - 4, TB + 2); k++;
    // o templo no pé da fenda, de um lado: a sala de pedra entalhada; a porta debaixo da água, o domo de ar em cima
    const side = R() < 0.5 ? -1 : 1, tw = 16 + ((R() * 9) | 0), th = 9, wallX = side > 0 ? Math.ceil(cx + w / 2) + 1 : Math.floor(cx - w / 2) - 1;
    const tx0 = side > 0 ? wallX + 2 : wallX - 1 - tw, tfy = TB;
    const Tp = { x0: W1(tx0), w: tw, fy: tfy, top: tfy - th, dome: tfy - 5, side, door: W1(wallX + side), trench: T0 };
    msTemples.push(Tp); T0.temple = Tp; take(W1(tx0 - 3), W1(tx0 + tw + 3), tfy - th - 3, tfy + 3);
  }

  // ---------- 4. as Chaminés Negras: grutas secas largas ----------
  const gBusy = (cx, cy, w, h, m) => msGrottos.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); };
  const blob = (cx, cy, w, h, s, flat = 1.6) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  // os dois Poços de Vapor primeiro (a saída para baixo), longe um do outro
  for (let tries = 0; msExits.length < 2 && tries < 600; tries++) {
    const w = 18 + ((R() * 8) | 0), h = 9, cx = (R() * WW) | 0, fy = S0 + mb(170) + ((R() * mb(6)) | 0);
    if (msExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || gBusy(cx, fy - h / 2, w, h, 6)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx: W1(cx), cy: fy - h / 2, w, h, x0: W1(x0), fy, top: fy - h, exit: true };
    msGrottos.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) dig(x, y);
    msExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }
  for (let k = 0, tries = 0; msGrottos.length < 5 * WSC + 2 && tries < 800; tries++) {
    const w = 18 + ((R() * 13) | 0), h = 10 + ((R() * 8) | 0), cx = (R() * WW) | 0, cy = S0 + mb(156) + h / 2 + R() * Math.max(0, mb(24) - h);
    if (gBusy(cx, cy, w, h, 8) || cy + h / 2 > YB - 5) continue;
    blob(cx, cy, w, h, 0x6c00 + k, 2.4);
    const C = { cx: W1(cx), cy, w, h, fy: Math.round(cy + h / 2), top: Math.round(cy - h / 2) };
    // uma poça fervente em 40% delas, perto de uma ponta (3 de largura: dá para pular)
    if (R() < 0.4) C.pool = { x: Math.round(cx + (R() < 0.5 ? -1 : 1) * w * 0.22) - 1 };
    msGrottos.push(C); k++;
  }
  // as grutas ligadas em anel por túneis de rocha quente
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1600; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.7 + Math.sin(n * 0.09 + s) * 0.3;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.45;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) { const yy = Math.round(y) + dy; if (yy >= S0 + mb(146)) dig(Math.round(x) + dx, yy); }
    }
  };
  {
    const L = msGrottos.slice().sort((a, b) => a.cx - b.cx);
    for (let k = 0; k < L.length; k++) { const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue; worm(P.cx + P.w / 2 - 2, P.fy - 2, Q.cx - Q.w / 2 + 2, Q.fy - 2, 1.45, 0x6c80 + k); }
  }

  // ---------- 5. os túneis secos: por dentro das ilhas, dos templos, até as Chaminés ----------
  // o perto do mar: tudo a até 3 de uma célula do vão ou do mar (os templos e a fenda estão no mar)
  const near = new Uint8Array(NN);
  for (let y = S0; y < YB; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!seaM[i]) continue;
    for (let dy = -3; dy <= 3; dy++) { const yy = y + dy; if (yy < S0 || yy >= YB) continue; for (let dx = -3; dx <= 3; dx++) near[yy * WW + W1(x + dx)] = 1; }
  }
  const tun = new Uint8Array(NN);   // o que foi cavado como túnel seco (a água nunca entra)
  for (const Tp of msTemples) for (let y = Tp.top - 2; y <= Tp.fy + 2; y++) for (let x = Tp.x0 - 2; x <= Tp.x0 + Tp.w + 1; x++) near[I(x, y)] = 1;
  const path = (sx, sy, tx, ty, okStart) => {
    const dX = wdx(tx - sx), xa = Math.min(0, dX) - 30, xb = Math.max(0, dX) + 30, ya = Math.max(S0 + 1, Math.min(sy, ty) - 4), yb = Math.min(YB - 3, Math.max(sy, ty) + 2);
    const GW = xb - xa + 1, GH = yb - ya + 1, N = GW * GH;
    const dist = new Float32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const id = (rx, y) => (y - ya) * GW + (rx - xa);
    const free = (rx, y) => { const X = W1(sx + rx), i = y * WW + X; if (okStart(rx, y)) return true; return !near[i] && tiles[i] !== BEDROCK; };
    const heap = [], push = (n, d) => { heap.push([d, n]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const s0 = id(0, sy), g = id(dX, ty); dist[s0] = 0; push(s0, 0);
    while (heap.length) {
      const [d, n] = pop(); if (done[n]) continue; done[n] = 1; if (n === g) break;
      const rx = n % GW + xa, y = ((n / GW) | 0) + ya;
      for (const [ddx, ddy, c] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1.3], [0, -1, 6]]) {
        const nx = rx + ddx, ny = y + ddy; if (nx < xa || nx > xb || ny < ya || ny > yb) continue;
        if (!free(nx, ny) || !free(nx, ny - 1) || !free(nx, ny - 2)) continue;
        const m = id(nx, ny), nd = d + c + nz(sx + nx, ny, 30, 0x6d1) * 2.2;
        if (nd < dist[m]) { dist[m] = nd; prev[m] = n; push(m, nd); }
      }
    }
    if (prev[g] < 0) return null;
    const out = []; for (let n = g; n >= 0; n = prev[n]) out.push([sx + n % GW + xa, ((n / GW) | 0) + ya]);
    return out.reverse();
  };
  const carveTunnel = (P, s) => {
    const T0 = { cells: P, siphons: [] };
    for (let k = 0; k < P.length; k++) {
      const [x, y] = P[k], nx = k + 1 < P.length ? P[k + 1] : null;
      for (let yy = y - 2; yy <= y; yy++) { dig(x, yy); tun[I(x, yy)] = 1; }
      if (nx && nx[1] !== y) for (let yy = y - 2; yy <= y + 1; yy++) for (const xx of [x, x + 1]) { dig(xx, yy); tun[I(xx, yy)] = 1; }
    }
    // os trechos em pé: escada de cordame na coluna
    for (let k = 0; k < P.length;) {
      let j = k; while (j + 1 < P.length && P[j + 1][0] === P[k][0]) j++;
      if (P[j][1] - P[k][1] >= 3) T0.ladders = (T0.ladders || []).concat([[P[k][0], P[k][1] - 2, P[j][1]]]);
      k = j + 1;
    }
    // os sifões: um ou dois trechos retos na Fossa viram um U alagado (a parede desce no meio, a calha passa por baixo)
    const want = 1 + (R() < 0.5 ? 1 : 0);
    for (let k = 0; k < P.length && T0.siphons.length < want;) {
      let j = k; while (j + 1 < P.length && P[j + 1][1] === P[k][1] && Math.abs(P[j + 1][0] - P[j][0]) === 1) j++;
      const y = P[k][1], len = j - k + 1;
      if (len >= 10 && y >= S0 + mb(100) && y <= S0 + mb(146) && (T0.siphons.length === 0 || y - T0.siphons[0].y > 8 || T0.siphons[0].y - y > 8)) {
        const a = Math.min(P[k][0], P[k + 9][0]) + 0, b = a + 9;
        let ok = true; for (let x = a - 1; x <= b + 1 && ok; x++) for (let yy = y + 1; yy <= y + 4; yy++) if (near[I(x, yy)] || tun[I(x, yy)] && yy > y + 1) ok = false;
        if (ok) { T0.siphons.push({ xa: W1(a), xb: W1(b), y }); msSiphons.push({ xa: W1(a), xb: W1(b), y }); }
      }
      k = j + 1;
    }
    msTunnels.push(T0);
    return T0;
  };
  const nearestGrotto = (x, y) => { let best = null, bd = 1e9; for (const C of msGrottos) { const d = Math.abs(wdx(C.cx - x)) + Math.abs(C.fy - y) * 0.3; if (d < bd) { bd = d; best = C; } } return best; };
  // das ilhas: um túnel (dois nas grandes), da boca no platô até a gruta mais perto
  for (const J of msIslands) {
    const n = J.ph > 14 && !J.entry ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const off = J.entry ? -Math.sign(wdx(J.entry.x0 + 1 - J.cx)) * Math.max(2, J.ph - 4) : (k ? 1 : -1) * Math.max(1, (J.ph >> 1)), sx = W1(J.cx + off), sy = J.top - 1;
      const C = nearestGrotto(sx, sy); if (!C) continue;
      // dois pontos de passagem para o túnel serpentear por dentro da rocha (se um trecho não dá, vai direto)
      const dX = wdx(C.cx - sx), ty = C.fy - 1, wps = [[sx + ((R() - 0.5) * 30) | 0, Math.round(sy + (ty - sy) * 0.38)], [sx + Math.round(dX * 0.6 + (R() - 0.5) * 30), Math.round(sy + (ty - sy) * 0.72)]];
      let P = null, ax = sx, ay = sy, okA = (rx, y) => Math.abs(rx) <= 2 && y <= J.top + 3, all = [];
      for (const [wx, wy] of wps) { if (near[I(wx, wy)] || near[I(wx, wy - 2)]) continue; const Q = path(ax, ay, wx, wy, okA); if (!Q) continue; all = all.concat(all.length ? Q.slice(1).map(([x, y]) => [ax + wdx(x - ax) + (all.length ? 0 : 0), y]) : Q); ax = all[all.length - 1][0]; ay = wy; okA = (rx, y) => Math.abs(rx) <= 1 && Math.abs(y - wy) <= 0; }
      { const Q = path(ax, ay, C.cx, ty, all.length ? okA : (rx, y) => Math.abs(rx) <= 2 && y <= J.top + 3); if (Q) P = all.concat(all.length ? Q.slice(1) : Q); }
      if (!P) P = path(sx, sy, C.cx, ty, (rx, y) => Math.abs(rx) <= 2 && y <= J.top + 3);
      if (P) { const T0 = carveTunnel(P); T0.island = J; J.tunnel = J.tunnel || T0; }
    }
  }
  // dos templos: o túnel de trás sai do domo, acima da água de dentro, e desce até as Chaminés
  for (const Tp of msTemples) {
    const sx = Tp.side > 0 ? Tp.x0 + Tp.w + 2 : Tp.x0 - 3, sy = Tp.dome;
    const C = nearestGrotto(sx, sy); if (!C) continue;
    const P = path(sx, sy, C.cx, C.fy - 1, (rx, y) => Math.abs(rx) <= 2 && Math.abs(y - sy) <= 2);
    if (P) { const T0 = carveTunnel(P); T0.temple = Tp; Tp.tunnel = T0; Tp.exitX = W1(sx); }
  }

  // ---------- 6a. as descidas: a Raiz que pende do teto até o platô, e a Câmara de Pouso ----------
  for (let e = 0; e < picks.length; e++) {
    const c = picks[e], J = msIslands[e], xs = W1(c.x0), lx = W1(xs + 1);
    const floor = J.top;   // o chão do platô debaixo da raiz
    const side = wdx(J.cx - lx) > 0 ? 1 : -1;   // a câmara se abre para o meio da ilha
    const hx = side > 0 ? lx - 2 : lx - 9;      // a câmara (12 x 6) com a raiz caindo numa ponta
    const L = { x0: W1(hx), fy: floor, w: 12, h: 6, door: W1(side > 0 ? hx + 12 : hx - 1), side, x: lx };
    msLand.push(L); take(W1(hx - 2), W1(hx + 13), floor - 9, floor + 2);
    msEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L, island: J });
  }

  // ---------- 6b. os navios encalhados nos rasos, os cascos virados, as palafitas ----------
  const shallowRun = (x0, len, lo, hi) => { for (let k = 0; k < len; k++) { const X = W1(x0 + k), b = bot[X]; if (b < lo || b > hi || nearBoss(X, 10)) return false; } return true; };
  for (let k = 0, tries = 0; k < 3 * WSC && tries < 200; tries++) {
    const J = msIslands[(R() * msIslands.length) | 0]; if (!J || J.village) continue;
    const side = R() < 0.5 ? -1 : 1, hf = SL - 3;
    // a primeira cabana onde a praia já está abaixo do piso; as outras saem para o mar
    let x = J.cx + side * J.ph; while (Math.abs(wdx(x - J.cx)) < J.hw + 20 && bot[W1(x)] <= hf + 1) x += side;
    const huts = [], n = 2 + ((R() * 2) | 0);
    let cx = x;
    for (let h = 0; h < n; h++) { const w = 6 + ((R() * 3) | 0), hx = side > 0 ? cx : cx - w + 1; huts.push({ x0: W1(hx), w }); cx += side * (w + 3 + ((R() * 3) | 0)); }
    const X0 = Math.min(...huts.map(h => wdx(h.x0 - x))) + x, X1 = Math.max(...huts.map(h => wdx(h.x0 - x) + h.w - 1)) + x;
    let ok = true; for (let xx = X0; xx <= X1; xx++) if (bot[W1(xx)] <= hf + 1 || nearBoss(W1(xx), 10)) ok = false;
    if (!ok || busy(W1(X0 - 1), W1(X1 + 1), hf - 9, hf + 2, 3)) continue;
    const V = { x0: W1(X0), x1: W1(X1), deck: hf, huts, side, island: J, from: W1(x - side) };
    J.village = V; msVillages.push(V); take(W1(X0 - 1), W1(X1 + 1), hf - 9, hf + 2); k++;
  }

  for (let k = 0, tries = 0; k < 3 * WSC && tries < 1500; tries++) {
    const len = 24 + ((R() * 17) | 0), x0 = (R() * WW) | 0;
    if (!shallowRun(x0, len, SL + 4, 9999) || msTrenches.some(t => Math.abs(wdx(t.cx - x0 - len / 2)) < t.w + len / 2 + 4)) continue;
    const deck = SL - 3, keel = deck + 9 + ((R() * 3) | 0);
    if (busy(W1(x0 - 2), W1(x0 + len + 2), deck - 7, keel + 2, 4)) continue;
    msShips.push({ x0: W1(x0), len, deck, keel, dir: R() < 0.5 ? -1 : 1 }); take(W1(x0 - 2), W1(x0 + len + 2), deck - 7, keel + 2); k++;
  }
  for (const floatH of [true, false]) for (let k = 0, tries = 0; k < 2 * WSC && tries < 1500; tries++) {
    const w = 14 + ((R() * 9) | 0), x0 = (R() * WW) | 0;
    if (floatH) {
      if (!shallowRun(x0 - 3, w + 6, SL + 22, 9999)) continue;
      const top = SL - 3, b = SL + 7;
      if (busy(W1(x0 - 3), W1(x0 + w + 3), top - 2, b + 3, 6)) continue;
      msHulls.push({ x0: W1(x0), w, top, bot: b, air: SL + 2, float: true }); take(W1(x0 - 3), W1(x0 + w + 3), top - 2, b + 3); k++;
    } else {
      let fl = 0; for (let j = 0; j < w; j++) fl = Math.max(fl, bot[W1(x0 + j)]);
      if (!shallowRun(x0 - 2, w + 4, SL + 26, S0 + 96) || fl - SL < 26) continue;
      let lo = 9999; for (let j = 0; j < w; j++) lo = Math.min(lo, bot[W1(x0 + j)]);
      if (fl - lo > 4) continue;
      const b = lo, top = b - 11;
      if (busy(W1(x0 - 2), W1(x0 + w + 2), top - 2, b + 2, 6)) continue;
      msHulls.push({ x0: W1(x0), w, top, bot: b, air: top + 4, float: false }); take(W1(x0 - 2), W1(x0 + w + 2), top - 2, b + 2); k++;
    }
  }
  // ---------- os furos de verdade (o que foi aberto vira ar) ----------
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- as cascas e os materiais da superfície ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const solidSoil = (x, y) => { const t = at(x, y); return SOLID[t] && MS_SOILS[t]; };
  for (let x = 0; x < WW; x++) {
    const b = bot[x], depth = b - SL, J = isl[x] >= 0 ? msIslands[isl[x]] : null;
    // o chão: areia nas praias e nos rasos, recife e coral na plataforma, areia e rocha na Floresta, lodo na Fossa
    for (let y = b; y < b + 4 && y < YB - 1; y++) {
      const i = I(x, y); if (!SOLID[tiles[i]] || tun[i]) continue;
      const k = y - b, n = nz(x, y, 20, 0x6e1);
      let t = tiles[i];
      if (b < SL - 1 && J && Math.abs(wdx(x - J.cx)) <= J.ph) t = k < 1 && n > 0.55 ? MS_AREIA : MS_ROCHA;   // o platô
      else if (depth < 14) t = k < 3 ? MS_AREIA : MS_ROCHA;                                              // a praia e os rasos
      else if (b === S0 + 46 || depth < 30) t = k < 2 ? (n > 0.6 ? MS_CORAL : MS_RECIFE) : MS_RECIFE;     // a plataforma de recife
      else if (b < S0 + 98) t = k < 2 ? (n > 0.5 ? MS_AREIA : MS_ROCHA) : MS_ROCHA;
      else t = k < 4 ? MS_LODO : MS_ROCHA;
      tiles[i] = t;
    }
    // o penhasco das ilhas na linha d'água: cracas
    for (let y = SL - 3; y < SL + 6; y++) { const i = I(x, y); if (SOLID[tiles[i]] && !tun[i] && (!SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)])) tiles[i] = MS_CRACAS; }
    // o teto: rocha com cracas nas pontas das estalactites
    for (let y = ceil[x] - 2; y < ceil[x]; y++) { const i = I(x, y); if (SOLID[tiles[i]] && nz(x, y, 16, 0x6e2) > 0.62) tiles[i] = MS_CRACAS; }
  }
  // o coral vivo em tufos nos recifes da Floresta
  for (let k = 0; k < 60 * WSC; k++) {
    const x = (R() * WW) | 0, b = bot[x]; if (b - SL < 12 || b > S0 + 98 || nearBoss(x, 4)) continue;
    const r = 1 + R() * 2.2;
    for (let yy = b - 2; yy <= b + 1; yy++) for (let xx = x - 3; xx <= x + 3; xx++) { if (Math.hypot(xx - x, (yy - b) * 1.4) > r) continue; const i = I(xx, yy); if (yy < b && tiles[i] === AIR) tiles[i] = MS_CORAL; else if (yy >= b && SOLID[tiles[i]] && !tun[i]) tiles[i] = MS_CORAL; }
  }
  // as paredes das fendas: rocha e, no fundo, lodo
  for (const T0 of msTrenches) for (let y = T0.top; y <= T0.bot + 1; y++) for (let x = T0.cx - T0.w; x <= T0.cx + T0.w; x++) {
    const i = I(x, y); if (!SOLID[tiles[i]] || tun[i]) continue;
    if (y >= T0.bot) tiles[i] = MS_LODO; else if (nz(x, y, 20, 0x6e3) > 0.7) tiles[i] = MS_CRACAS;
  }
  // os templos: a sala de pedra entalhada, a porta para a fenda, o domo de ar e a boca do túnel de trás
  for (const Tp of msTemples) {
    for (let y = Tp.top - 2; y <= Tp.fy + 1; y++) for (let x = Tp.x0 - 2; x <= Tp.x0 + Tp.w + 1; x++) {
      const i = I(x, y), inner = y >= Tp.top && y < Tp.fy && wdx(x - Tp.x0) >= 0 && wdx(x - Tp.x0) < Tp.w;
      if (inner) { tiles[i] = AIR; walls[i] = WMS_TEMPLO; if (y < Tp.dome + 1) msDry.add(i); }
      else if (!tun[i]) { tiles[i] = MS_TEMPLO; walls[i] = WMS_TEMPLO; }
      msKeep.add(i);
    }
    // a porta (3 de altura, debaixo da água), do meio da fenda até a sala
    { const xa = Tp.trench.cx, xb = Tp.side > 0 ? Tp.x0 : Tp.x0 + Tp.w - 1, d = wdx(xb - xa), st = d < 0 ? -1 : 1;
      for (let k = 0; k !== d + st; k += st) for (let y = Tp.fy - 3; y < Tp.fy; y++) { const i = I(xa + k, y); tiles[i] = AIR; if (wdx(xa + k - Tp.x0) >= -2 && wdx(xa + k - Tp.x0) <= Tp.w + 1) walls[i] = WMS_TEMPLO; } }
    // a boca do túnel de trás, no alto da parede do fundo (acima da água de dentro)
    if (Tp.tunnel) { const bx = Tp.side > 0 ? Tp.x0 + Tp.w : Tp.x0 - 1, bx2 = Tp.side > 0 ? bx + 1 : bx - 1; for (let y = Tp.dome - 2; y <= Tp.dome; y++) for (const x of [bx, bx2]) { const i = I(x, y); tiles[i] = AIR; walls[i] = WMS_TEMPLO; } }
  }
  // as Chaminés: sulfeto em volta das grutas e dos túneis
  for (const C of msGrottos) for (let y = C.top - 3; y <= C.fy + 3; y++) for (let x = C.cx - C.w / 2 - 3; x <= C.cx + C.w / 2 + 3; x++) {
    const i = I(x, y); if (!SOLID[tiles[i]] || y >= YB - 1) { if (!SOLID[tiles[i]]) walls[i] = WMS_SULFETO; continue; }
    if (MS_SOILS[tiles[i]] && nz(x, y, 18, 0x6e4) < 0.8) tiles[i] = MS_SULFETO;
  }
  // as poças ferventes (só a cova; a água vem depois)
  for (const C of msGrottos) if (C.pool) {
    const px = C.pool.x; let fy = C.fy - 1; while (fy < C.fy + 3 && !SOLID[at(px + 1, fy + 1)]) fy++;
    if (!SOLID[at(px + 1, fy + 1)]) { C.pool = null; continue; }
    for (let x = px; x < px + 3; x++) { for (let y = fy + 1; y <= fy + 2; y++) set(x, y, AIR, WMS_SULFETO); set(x, fy + 3, MS_SULFETO); }
    set(px - 1, fy + 1, MS_SULFETO); set(px - 1, fy + 2, MS_SULFETO); set(px + 3, fy + 1, MS_SULFETO); set(px + 3, fy + 2, MS_SULFETO);
    msPools.push({ x: W1(px), y: fy + 1 });
  }
  // os sifões: a parede desce no meio do trecho, a calha passa por baixo (3 de fundo)
  for (const S of msSiphons) {
    const a = S.xa, b = a + wdx(S.xb - a), y = S.y;
    for (let x = a + 3; x <= b - 3; x++) for (let yy = y - 2; yy <= y; yy++) { const i = I(x, yy); tiles[i] = MS_ROCHA; tun[i] = 0; }
    for (let x = a; x <= b; x++) { for (let yy = y + 1; yy <= y + 3; yy++) { const i = I(x, yy); tiles[i] = AIR; walls[i] = WMS_ROCHA; tun[i] = 1; } const i = I(x, y + 4); if (!SOLID[tiles[i]]) tiles[i] = MS_ROCHA; }
    for (const x of [a - 1, b + 1]) for (let yy = y + 1; yy <= y + 4; yy++) { const i = I(x, yy); if (!SOLID[tiles[i]]) tiles[i] = MS_ROCHA; }
  }
  // os túneis: cordame nos trechos em pé
  for (const T0 of msTunnels) for (const [x, y0, y1] of (T0.ladders || [])) for (let y = y0; y <= y1; y++) { const i = I(x, y); if (tiles[i] === AIR) tiles[i] = MS_CORDAME; }

  // ---------- os navios encalhados: casco de tábua, convés, porão seco, escotilha com cordame, a cabine na popa ----------
  for (const S of msShips) {
    const L = S.len, bowAt = S.dir > 0 ? L - 1 : 0;
    for (let j = 0; j < L; j++) {
      const x = S.x0 + j, u = j / (L - 1), e = Math.min(u, 1 - u), kl = Math.min(Math.round(S.deck + 2 + (S.keel - S.deck - 2) * Math.min(1, e * 4.5)), bot[W1(x)] - 1);
      for (let y = S.deck; y <= kl; y++) {
        const i = I(x, y), edge = j === 0 || j === L - 1 || y === kl || y === S.deck;
        if (edge) { tiles[i] = y === S.deck ? MS_CONVES : MS_CASCO; if (agua.length) agua[i] = 0; }
        else { tiles[i] = AIR; walls[i] = WMS_CASCO; if (y >= SL) msDry.add(i); }
        msKeep.add(i);
      }
      // um pouco de casco por baixo, enterrado no fundo
      for (let y = kl + 1; y < kl + 3 && !SOLID[at(x, y)]; y++) set(x, y, MS_CASCO);
    }
    // a escotilha e o cordame até o fundo do porão
    const hx = S.x0 + (L >> 1);
    for (let y = S.deck; y < S.keel; y++) { const i = I(hx, y); if (y === S.deck || tiles[i] === AIR) { tiles[i] = MS_CORDAME; msKeep.add(i); } }
    // a cabine na popa: 6 x 4 com a porta para o convés
    const sx = S.dir > 0 ? S.x0 : S.x0 + L - 7;
    for (let y = S.deck - 5; y < S.deck; y++) for (let x = sx; x < sx + 7; x++) {
      const i = I(x, y), edge = y === S.deck - 5 || x === sx || x === sx + 6;
      const door = (S.dir > 0 ? x === sx + 6 : x === sx) && y >= S.deck - 3;
      tiles[i] = edge && !door ? MS_CASCO : AIR; walls[i] = WMS_CASCO; msKeep.add(i);
    }
    // a corrente da âncora, da proa até o fundo
    const ax2 = S.x0 + (S.dir > 0 ? L : -1);
    for (let y = S.deck + 1; y < YB - 2; y++) { const i = I(ax2, y); if (SOLID[tiles[i]]) break; tiles[i] = MS_CORRENTE; msKeep.add(i); }
    S.bow = W1(S.x0 + bowAt); S.anchor = W1(ax2);
  }
  // os cascos de quilha para cima: a quilha em cima, os costados descendo, o oco com o sino de ar
  for (const H of msHulls) {
    for (let j = 0; j < H.w; j++) {
      const x = H.x0 + j, u = j / (H.w - 1), e = Math.min(u, 1 - u), top = Math.round(H.top + (1 - Math.min(1, e * 4)) * 3);
      const side = j === 0 || j === H.w - 1;
      const yEnd = H.float ? H.bot : H.bot - (side && (j & 1) ? 3 : 1);
      for (let y = top; y <= yEnd; y++) {
        const i = I(x, y);
        if (side || y === top || (y === top + 1 && e < 0.12)) { tiles[i] = MS_CASCO; if (agua.length) agua[i] = 0; }
        else { tiles[i] = AIR; walls[i] = WMS_CASCO; if (y <= H.air && y >= SL) msDry.add(i); }
        msKeep.add(i);
      }
      if (j === (H.w >> 1) && H.float) { const i = I(x, top - 1); tiles[i] = MS_CASCO; msKeep.add(i); }   // a quilha
    }
    // os vãos de entrar no casco do fundo: o costado não chega no chão
    if (!H.float) for (const x of [H.x0, H.x0 + H.w - 1]) for (let y = H.bot - 3; y < H.bot; y++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WMS_CASCO; }
  }
  // as palafitas: o piso de convés sobre as estacas, as paredes de casco com porta dos dois lados, o telhado, as
  // pontes entre as cabanas e a rampa até a praia
  for (const V of msVillages) {
    const hf = V.deck;
    for (const h of V.huts) {
      for (let x = h.x0; x < h.x0 + h.w; x++) {
        set(x, hf, MS_CONVES); msKeep.add(I(x, hf));
        for (let y = hf - 6; y < hf; y++) { const i = I(x, y), edge = x === h.x0 || x === h.x0 + h.w - 1, door = edge && y >= hf - 3; tiles[i] = y === hf - 6 || (edge && !door) ? MS_CASCO : AIR; walls[i] = WMS_CASCO; msKeep.add(i); }
        const peak = Math.round((h.w - 1) / 2), dx = Math.abs(x - h.x0 - peak); if (dx < peak) { set(x, hf - 7, MS_CASCO); msKeep.add(I(x, hf - 7)); }
      }
      for (const x of [h.x0 + 1, h.x0 + h.w - 2]) for (let y = hf + 1; y < YB - 2; y++) { const i = I(x, y); if (SOLID[tiles[i]]) break; tiles[i] = MS_ESTACA; msKeep.add(i); }
      const lx = h.x0 + (h.w >> 1); if (at(lx, hf - 5) === AIR) set(lx, hf - 5, MS_LANTERNA);
    }
    // as pontes: o piso corre de uma cabana a outra e até a praia
    const xs = V.huts.map(h => h.x0), xa = Math.min(...xs.map(x => wdx(x - V.x0))) + V.x0, xb = V.x1 + 0;
    for (let x = V.x0; x !== W1(V.x1 + 1); x = W1(x + 1)) { const i = I(x, hf); if (tiles[i] === AIR) { tiles[i] = MS_CONVES; msKeep.add(i); } }
    for (let x = V.from, n = 0; n < 30; x = W1(x - V.side), n++) { const i = I(x, hf); if (SOLID[tiles[i]] || bot[x] <= hf) break; tiles[i] = MS_CONVES; msKeep.add(i); }
    void xa; void xb;
  }

  // ---------- 6c. a Raiz que pende do teto e a Câmara de Pouso ----------
  const rootT = A.root || MS_CRACAS;
  for (const E of msEntries) {
    const L = E.land, xs = E.x0, lx = W1(xs + 1), floor = L.fy;
    // a câmara: rocha com a porta para o meio da ilha; chão de areia; as conchas acesas
    for (let y = floor - L.h - 2; y <= floor; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y <= floor - L.h - 1 || y === floor || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= floor - 3 && y < floor) { tiles[i] = AIR; walls[i] = WMS_ROCHA; }
      else if (edge) tiles[i] = y === floor ? MS_AREIA : MS_ROCHA;
      else { tiles[i] = AIR; walls[i] = WMS_ROCHA; }
      msKeep.add(i);
    }
    // o chão do lado de fora da porta, até o platô (degraus de no máximo 1)
    for (let k = 1; k < 8; k++) { const x = W1(L.door + L.side * (k - 1)); for (let y = floor - 4; y < floor; y++) { const i = I(x, y); if (SOLID[tiles[i]] && !msKeep.has(i)) tiles[i] = AIR; } if (!SOLID[at(x, floor)]) set(x, floor, MS_ROCHA); }
    // a raiz: do teto do vão até o teto da câmara, 3 de ar por dentro, a casca dos dois lados
    for (let y = S0 - 1; y < floor - L.h; y++) {
      for (let x = xs; x < xs + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WMS_ROCHA; msKeep.add(i); }
      for (const x of [xs - 1, xs + 3]) { const i = I(x, y); tiles[i] = (y - S0) % 7 === 3 ? MS_CRACAS : rootT; walls[i] = WMS_ROCHA; msKeep.add(i); }
    }
    // o cordame da boca do Reino até o chão da câmara
    for (let y = E.fy - 3; y < floor; y++) { const i = I(lx, y); if (!SOLID[tiles[i]] || y >= E.fy - 1) { tiles[i] = MS_CORDAME; msKeep.add(i); } }
    for (const x of [L.x0 + 2, L.x0 + 9]) { const i = I(x, floor - 1); if (tiles[i] === AIR && W1(x) !== lx) tiles[i] = MS_CONCHA; }
    for (const x of [L.x0 + 5, L.x0 + 7]) { const i = I(x, floor - L.h); if (tiles[i] === AIR && W1(x) !== lx) tiles[i] = MS_LANTERNA; }
  }
  // ---------- os Poços de Vapor: o poço de sulfeto até a última linha com o cordame da gente-peixe ----------
  for (const X of msExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WMS_SULFETO; msKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = (y - X.top) % 5 === 2 ? MS_ROCHA : MS_SULFETO; msKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = MS_CORDAME; msKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) msKeep.add(I(x, X.top));
    tiles[I(X.x0 + 1, X.fy)] = MS_SULFETO;
  }

  // ---------- 7. os veios ----------
  const R4 = mulberry32(seed ^ 0x0fa7);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !msKeep.has(i) && !inMsHall(W1(x), y, 4)) tiles[i] = typeof ore === 'function' ? ore(tiles[i]) : ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(MS_O_CARVAO, 28 * WSC, 8, 98, 3, 8, t => t === MS_ROCHA);
  vein(MS_O_CARVAO, 12 * WSC, 146, 186, 3, 7, t => t === MS_ROCHA || t === MS_SULFETO);
  vein(t => t === MS_SULFETO ? MS_O_ORICALCO_S : MS_O_ORICALCO, 13 * WSC, 150, 186, 2, 5, t => t === MS_SULFETO || t === MS_ROCHA);
  vein(MS_O_ORICALCO, 13 * WSC, 98, 150, 2, 5, t => t === MS_ROCHA || t === MS_CRACAS);
  // o que fica para o msAfter
  msBuild.tun = tun; msBuild.bot = bot; msBuild.ceil = ceil; if (window.MS_DEBUG) { msBuild.path = path; msBuild.near = near; }
}

/* ---------- a água: o mar por bacia (menos o que é seco de propósito e os túneis secos), os sifões, as poças
   ferventes, o plâncton e os respiradouros ---------- */
function msFill(x0, y0, level, tipo, max, skip) {
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), YB = Math.min(WH - 8, MS_S0 + MS_D);
  const s0 = I(x0, y0); if (SOLID[tiles[s0]] || agua[s0] || (skip && skip(s0))) return 0;
  const got = [s0], seen = new Set([s0]);
  for (let h = 0; h < got.length; h++) {
    const c = got[h], x = c % WW, row = c - x;
    for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
      if (seen.has(nb) || nb < 0) continue; const ny = (nb / WW) | 0; if (ny < level || ny >= YB) continue;
      if (SOLID[tiles[nb]] || tiles[nb] === LAVA || agua[nb] || (skip && skip(nb))) continue;
      seen.add(nb); got.push(nb); if (got.length > max) return 0;
    }
  }
  for (const c of got) agua[c] = tipo;
  return got.length;
}
function msWater() {
  if (!agua.length) return;
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = MS_S0, SL = MS_NIVEL, YB = Math.min(WH - 8, S0 + MS_D);
  const tun = msBuild.tun || new Uint8Array(0), bot = msBuild.bot;
  const skip = i => msDry.has(i) || tun[i];
  // o mar: de cada coluna aberta na linha do nível
  for (let x = 0; x < WW; x++) { const i = I(x, SL); if (!SOLID[tiles[i]] && !agua[i] && !skip(i)) msFill(x, SL, SL, AGUA_LIMPA, 4e6, skip); }
  // o que é seco de propósito e encosta na água de lado ou por cima vira água (a água não fica em pé)
  for (let pass = 0; pass < 24; pass++) {
    let ch = 0;
    for (const i of msDry) {
      if (agua[i] || SOLID[tiles[i]]) continue;
      const x = i % WW, row = i - x;
      if (agua[row + W1(x - 1)] || agua[row + W1(x + 1)] || agua[i - WW]) { agua[i] = AGUA_LIMPA; msDry.delete(i); ch++; }
    }
    if (!ch) break;
  }
  // um túnel seco que encostou no mar: a célula da divisa vira rocha
  for (let y = S0; y < YB; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!tun[i] || agua[i] || SOLID[tiles[i]]) continue;
    const row = y * WW;
    if (agua[row + W1(x - 1)] || agua[row + W1(x + 1)] || agua[i - WW]) { tiles[i] = MS_ROCHA; }
  }
  // os sifões: a calha até a borda
  for (const S of msSiphons) { const a = S.xa; for (let k = 0; k <= wdx(S.xb - a); k++) { const i = I(a + k, S.y + 1); if (!agua[i] && !SOLID[tiles[i]]) msFill(a + k, S.y + 1, S.y + 1, AGUA_LIMPA, 80, null); } }
  // as poças ferventes
  for (const P of msPools) for (let k = 0; k < 3; k++) { const i = I(P.x + k, P.y); if (!agua[i] && !SOLID[tiles[i]]) msFill(P.x + k, P.y, P.y, AGUA_FERVE, 20, null); }
  // o plâncton: manchas nas 4 primeiras linhas do mar
  for (let x = 0; x < WW; x++) for (let y = SL; y < SL + 4; y++) { const i = I(x, y); if (agua[i] === AGUA_LIMPA && depthNz(x, y, 22, seed ^ 0x6f1) > 0.55) agua[i] = AGUA_PLANCTON; }
  // os respiradouros: uma fonte de bolhas no fundo a cada 40 a 55 colunas do mar fundo, e uma no pé de cada fenda;
  // a coluna de bolhas sobe até a superfície (enche o fôlego, empurra para cima)
  const vent = (x, yb) => {
    let y = yb; while (y > SL && agua[I(x, y)] && !SOLID[tiles[I(x, y)]]) y--;
    if (yb - y < 8) return false;
    const fi = I(x, yb); if (!SOLID[tiles[fi + WW]]) return false;
    if (tiles[fi] === AIR) tiles[fi] = MS_FONTE;
    for (let yy = yb; yy >= SL; yy--) { const i = I(x, yy); if (SOLID[tiles[i]] || !agua[i]) break; agua[i] = AGUA_RESPIRO; }
    msVents.push({ x: W1(x), y: yb }); return true;
  };
  for (const T0 of msTrenches) { const x = T0.cx; let y = T0.bot - 1; while (y > T0.top && SOLID[tiles[I(x, y)]]) y--; vent(x, y); }
  for (let x = (seed & 31), gap = 0; x < WW; x++, gap++) {
    if (gap < 40) continue;
    if (inMsHall(x, SL + 4, 4) || msTrenches.some(T0 => Math.abs(wdx(T0.cx - x)) < T0.w + 4)) continue;
    const b = bot[x]; if (!b || b - SL < 16) continue;
    let y = b - 1; while (y > SL && SOLID[tiles[I(x, y)]]) y--;
    if (DECO[tiles[I(x, y)]] && tiles[I(x, y)] !== MS_FONTE) continue;
    if (vent(x, y)) gap = -((seed >> 3) & 15);
  }
  // nada de decoração solta (tufo, flor) nem tocha dentro da água; o que é do mar fica
  const molha = t => t === TORCH || t === CANDLE;
  for (let i = S0 * WW; i < YB * WW; i++) if (agua[i] && molha(tiles[i])) tiles[i] = AIR;
}

function msAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = MS_S0, SL = MS_NIVEL, YB = Math.min(WH - 8, S0 + MS_D), R3 = mulberry32(seed ^ 0x6d3c1);
  const msRow = y => y >= S0 && y < YB - 1;
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = msBoss, inBox = (x, y, m = 0) => inMsHall(x, y, 4 + m);
  const tun = msBuild.tun;
  const dig = (x, y) => { if (!msRow(y)) return; const i = I(x, y); if (msKeep.has(i) || inBox(W1(x), y)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) { tiles[i] = AIR; if (y >= SL && tun) tun[i] = 1; } if (!walls[i]) walls[i] = WMS_ROCHA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const msSolid = t => SOLID[t] && MS_SOILS[t];

  // ---------- 1. tudo alcançável das descidas (o mar conta como aberto: dá para nadar) ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of msEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!msEntries.length) flood(I(0, S0 + 20));
  for (let pass = 0; pass < 40 * WSC; pass++) {
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 16 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
    // liga pelo caminho seco: só a outra parte seca (nunca abre o mar num túnel seco)
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inBox(W1(cx + dx), y, 2)) continue;
        const wet = !tun[i] && y >= SL && !msDry.has(i) && (msBuild.bot[W1(cx + dx)] > y && msBuild.ceil[W1(cx + dx)] <= y);
        const d = Math.abs(dx) + Math.abs(dy) * 1.4 + (wet ? 40 : 0); if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    worm(best[0], best[1], best[2], best[3], 1.3, 0x66a0 + pass);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 2. a água ----------
  msWater();

  // ---------- 3. cordame em todo desnível de 5 ou mais no seco (na água, nada-se) ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR && !agua[I(lx, k)]) k++;
        if (k - y < 5 || (!SOLID[at(lx, k)] && !agua[I(lx, k)])) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || MS_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (msKeep.has(i) || !walls[i] || agua[i]) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = MS_CORDAME; used.add(i); }
      }
    }
  }

  // ---------- 4. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || msKeep.has(i)) continue;
    const b = marBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inMsLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3(), wet = !!agua[i];
    const floor = msSolid(dn) && BLOCKY[dn] && (up === AIR), ceil = msSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil && !wet) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR && !agua[I(x, y + gap)]) gap++;
      if (b === 0 && y < SL) { if (q < 0.03) put(x, y, MS_ESTALAC); else if (q < 0.045 && agua[I(x, y + gap)]) put(x, y, MS_ESTALAC); }
      else if (b === 3) { if (q < 0.02) put(x, y, MS_ESTALAC); else if (q < 0.026 && gap >= 3) put(x, y, MS_LANTERNA); }
      else if (q < 0.015) put(x, y, MS_ESTALAC);
      continue;
    }
    if (ceil && wet) { if (q < 0.05 && y < SL + 20) put(x, y, MS_MEXILHAO); continue; }
    if (!floor || MS_CLIMB(at(x - 1, y)) || MS_CLIMB(at(x + 1, y))) continue;
    if (wet) {
      const deep = y - SL;
      if (b <= 1 && deep > 4 && q < 0.11) { let n = 2 + ((R3() * Math.min(10, deep - 3)) | 0); for (let j = 0; j < n && at(x, y - j) === AIR && agua[I(x, y - j - 1)]; j++) put(x, y - j, MS_ALGA); }
      else if (b <= 1 && q < 0.14) put(x, y, MS_ANEMONA);
      else if (q < 0.165) put(x, y, MS_CONCHA);
      else if (b >= 2 && q < 0.2) put(x, y, MS_VERMES);
      else if (q < 0.21) put(x, y, MS_ESPINHA);
    } else {
      if (b === 0) { if (q < 0.03 && dn === MS_AREIA) put(x, y, MS_ESPINHA); else if (q < 0.05 && dn === MS_AREIA) put(x, y, MS_CONCHA); }
      else if (b === 3) { if (q < 0.04) put(x, y, MS_RESPIRO); else if (q < 0.07) put(x, y, MS_VERMES); else if (q < 0.08) put(x, y, MS_CONCHA); }
      else if (q < 0.02) put(x, y, MS_CONCHA);
    }
  }

  // ---------- 5. os objetos ----------
  msPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function msExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of msEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? MS_CORDAME : AIR; msKeep.add(i); }
}
/* ---------- a subida garantida: dos templos, das grutas das Chaminés, das ilhas e do pé dos Poços de Vapor o herói tem
   de conseguir voltar às descidas (pulo de 3; cordame e corrente sobem; na água, nada-se para qualquer lado) ---------- */
function msClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = MS_S0, YB = Math.min(WH - 8, S0 + MS_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => MS_CLIMB(tiles[I(x, y)]) || !!agua[I(x, y)];
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || inMsHall(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1) && !L(sx, y)) y++; push(sx, y, 4);
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
  const soft = t => t === MS_ROCHA || t === MS_AREIA || t === MS_SULFETO || t === MS_RECIFE || t === MS_LODO || t === MS_CRACAS || t === MS_CORAL;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || msKeep.has(I(x, y)) || inMsHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !msKeep.has(I(x, t)) && !inMsHall(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { if (agua.length && agua[i] && SOLID[tiles[i]]) agua[i] = 0; tiles[i] = MS_CORDAME; if (!walls[i]) walls[i] = WMS_ROCHA; } }
    return true;
  };
  const starts = [];
  for (const Tp of msTemples) starts.push([Tp.x0 + (Tp.w >> 1), Tp.fy - 1]);
  for (const C of msGrottos) starts.push([Math.round(C.cx), C.fy - 1]);
  for (const J of msIslands) starts.push([J.cx, J.top - 1]);
  for (const X of msExits) starts.push([X.x0 + 2, X.top - 1]);
  for (const S2 of msShips) starts.push([S2.x0 + (S2.len >> 1) + 1, S2.keel - 1]);
  let fixes = 0, ns = 0;
  for (const [x, y] of starts) { if (SOLID[tiles[I(x, y)]]) continue; for (let k = 0; k < 12 && (ns++, !search(W1(x), y)); k++) { if (!repair()) break; fixes++; } }
  msClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (262): por faixa, no chão, debaixo do teto e na parede. As flags do 262 decidem onde cada um
   pode ficar (agua: só debaixo da água; os outros só no seco; ilha: só nas ilhas; casco: só dentro dos cascos; templo:
   só nos templos; chamine: só nas grutas das Chaminés). Nunca sobre cordame, corrente ou estaca; nunca no pouso nem
   no mar do Leviatã ---------- */
function msPlaceProps() {
  if (typeof MS_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9c3c7);
  const S0 = MS_S0, YB = Math.min(WH - 8, S0 + MS_D), used = new Uint8Array(WW * WH * 2), BF = typeof MS_BACK_FLOOR !== 'undefined' ? MS_BACK_FLOOR : {};
  const inBox = (x, y, m = 0) => inMsHall(x, y, 4 + m);
  const inIsl = (x, y) => msIslands.some(J => Math.abs(wdx(x - J.cx)) <= J.hw && y < MS_NIVEL + 2 && y > J.top - 14);
  const inHull = (x, y) => msHulls.some(H => wdx(x - H.x0) >= 0 && wdx(x - H.x0) < H.w && y >= H.top && y <= H.bot) || msShips.some(S => wdx(x - S.x0) >= 0 && wdx(x - S.x0) < S.len && y > S.deck && y <= S.keel);
  const inTpl = (x, y) => msTemples.some(Tp => wdx(x - Tp.x0) >= 0 && wdx(x - Tp.x0) < Tp.w && y >= Tp.top && y < Tp.fy);
  const inChm = (x, y) => msGrottos.some(C => Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && y >= C.top - 1 && y <= C.fy + 1);
  const where = (def, x, y) => (!def.ilha || inIsl(x, y)) && (!def.casco || inHull(x, y)) && (!def.templo || inTpl(x, y)) && (!def.chamine || inChm(x, y));
  const wet = i => !!agua[i];
  // a decoração de 1 bloco (alga, anêmona, concha) dá lugar ao objeto; corda, corrente e o que é da estrutura, não
  const freeT = i => { const t = tiles[i]; return t === AIR || (!SOLID[t] && DECO[t] && !MS_CLIMB(t) && !msKeep.has(i)); };
  const clearDeco = (x0, y0, tw, th) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y); if (tiles[i] !== AIR && freeT(i)) tiles[i] = AIR; } };
  const fits = (x0, y0, tw, th, layer, needAir, wantWet) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) {
      const i = I(x, y), t = tiles[i];
      if (used[i * 2 + layer] || SOLID[t] || (needAir && !freeT(i)) || (layer === 1 && !walls[i]) || (t !== AIR && (msKeep.has(i) || MS_CLIMB(t))) || inBox(W1(x), y, 1) || inMsLand(W1(x), y)) return false;
      if (wantWet !== null && wantWet !== wet(i)) return false;
    }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && MS_SOILS[t]; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = MS_BAND_NAMES[clamp(marBand(y), 0, 3)], plan = MS_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (!freeT(i) || inBox(W1(k), y, 2) || inMsLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1) && wet(I(x1 + 1, y)) === wet(I(x, y))) x1++;
        const run = x1 - x + 1, x0 = x, w0 = wet(I(x, y)); x = x1 + 1;
        if (run < 2) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id], amb = def && def.agua === 'ambos'; if (!def || (!amb && !!def.agua !== w0)) continue;
          const ww = amb ? null : w0;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (!where(def, W1(px + (tw >> 1)), y)) continue;
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true, ww)) continue;
              mark(px, y0, tw, th, 0); clearDeco(px, y0, tw, th); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 2, 0, true, ww)) continue;
              mark(px, y, tw, th, 0); clearDeco(px, y, tw, th); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (!fits(px, y0, tw, th, 1, false, ww)) continue;
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

// a ordem: a camada (com a água), o mar do Leviatã (266: msDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!MAR) return;
  try { msBuild(); msAfter(); if (typeof msDress === 'function') msDress(); msExitClear(); msClimbFix(); } catch (err) { console.error(err); }
  msBuild.tun = null;
}; }

/* ---------- a terceira camada atrás do mar: o horizonte com as ilhas e os cascos no vão, o fundo com os vultos na
   água funda, as chaminés ao longe nas Chaminés ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!MAR) return;
  const Y1 = Math.min(WH, MS_S0 + MS_D + 4);
  for (let y = MS_S0 - 4; y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - MS_S0) + (depthNz(x, y, 25, seed ^ 0x6e11) - 0.5) * 8, n = depthNz(x, y, 20, seed ^ 0x6e12);
    DEEPT[i] = y < MS_NIVEL + 2 ? DP_MS_HORIZONTE : d < 150 ? (n > 0.8 ? DP_MS_CHAMINES : DP_MS_FUNDO) : (n > 0.7 ? DP_MS_FUNDO : DP_MS_CHAMINES);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (MAR && ty >= MS_S0 && ty < MS_S0 + MS_D) return MS_ZONE0 + clamp(marBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6)
Object.assign(CATH_SPAWN, {
  [MS_ZONE0]: [[['escamado', 4], ['xamamar', 3], ['ermitao', 2], ['arraia', 3], ['tubarao', 2], ['medusa', 2]], 8],
  [MS_ZONE0 + 1]: [[['tubarao', 2], ['medusa', 3], ['enguia', 2], ['polvo', 3], ['escamado', 3], ['baiacu', 2]], 8],
  [MS_ZONE0 + 2]: [[['diabomar', 3], ['enguia', 2], ['baiacu', 3], ['polvo', 2], ['medusa', 3]], 7],
  [MS_ZONE0 + 3]: [[['ermitao', 3], ['xamamar', 2], ['escamado', 3], ['diabomar', 2], ['baiacu', 2]], 8]
});
const MS_NO_SPAWN = (tx, ty) => inMsLand(tx, ty, 3) || inMsHall(tx, ty, 6) || msExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2) || msEntries.some(E => Math.abs(wdx(tx - E.x0 - 1)) < 4 && ty < E.land.fy);
const msInZone = z => z >= MS_ZONE0 && z <= MS_ZONE0 + 3;
// o spawn do mar: cada bicho no seu meio (água: tudo molhado em volta; ar: no seco, com parede atrás; fundo e anfíbio:
// em pé num chão, seco ou molhado; o resto: em pé no seco). Na Fossa, mais longe.
function msTrySpawn(zone) {
  const [tab0, max] = CATH_SPAWN[zone], table = tab0.filter(([t]) => ET[t] && AI[t]); if (!table.length || enemies.length >= max) return;
  let r = Math.random() * table.reduce((a, q) => a + q[1], 0), type = table[0][0]; for (const [t, w] of table) { if (r < w) { type = t; break; } r -= w; }
  const D = ET[type], ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T), halfW = Math.ceil(VW / 2 / T), far = zone === MS_ZONE0 + 2 ? 5 : 0;
  for (let a = 0; a < 30; a++) {
    const side = Math.random() < 0.5 ? -1 : 1, tx = ptx + side * (halfW + 2 + far + Math.floor(Math.random() * 7)), ty0 = pty + Math.floor((Math.random() - 0.5) * 22);
    if (ty0 < MS_S0 || ty0 >= MS_S0 + MS_D - 2 || MS_NO_SPAWN(tx, ty0)) continue;
    if (D.swim) {
      const px = tx * T, py = ty0 * T;
      if (rectSolid(px - T, py - T, D.w + 2 * T, D.h + 2 * T) || aguaIn(px - T, py - T, D.w + 2 * T, D.h + 2 * T) < 1) continue;
      const e = spawnEnemy(type, px, py, zone);
      if (e && type === 'medusa') for (let k = 0, n = 2 + ((Math.random() * 3) | 0); k < n && enemies.length < max + 4; k++) { const qx = px + rnd(-30, 30), qy = py + rnd(-24, 24); if (!rectSolid(qx, qy, D.w, D.h) && aguaIn(qx, qy, D.w, D.h) >= 1) spawnEnemy(type, qx, qy, zone); }
      return;
    }
    if (D.fly) {
      const px = tx * T, py = ty0 * T;
      if (rectSolid(px, py, D.w, D.h) || aguaIn(px, py - T, D.w, D.h + 2 * T) > 0 || !(wallAt(tx, ty0) > 0)) continue;
      spawnEnemy(type, px, py, zone); return;
    }
    for (let ty = ty0 - 6; ty < ty0 + 9; ty++) {
      if (ty < MS_S0 || ty >= MS_S0 + MS_D - 2) continue;
      const px = tx * T, py = (ty + 1) * T - D.h;
      if (!solidAt(tx, ty + 1) || rectSolid(px, py, D.w, D.h) || tileAt(tx, ty + 1) === LAVA || tileAt(tx, ty) === LAVA) continue;
      const w = aguaIn(px, py, D.w, D.h);
      if (!(D.amph || D.bottom) && w > 0) break;
      if (aguaAt(tx, ty) === AGUA_FERVE || wallAt(tx, ty) <= 0) break;
      spawnEnemy(type, px, py, zone); return;
    }
  }
}
{ const _ts = trySpawn; trySpawn = function () {
  if (MAR && !bossFight && pl && !pl.dead) {
    const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T), z = zoneAt(ptx, pty);
    if (msInZone(z)) { msTrySpawn(z); return; }
  }
  return _ts();
}; }
// níveis 25 e 26 (layerLvl no 52, a posição no 129); nada nasce no pouso, no mar do Leviatã nem nos poços de vapor
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!MAR || !e || e.boss || (D && D.boss) || e.msMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - MS_S0;
  if (d >= 0 && d < MS_D) {
    if (msInZone(zone) && MS_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.msVoid = true; return e; }
    const lvl = layerLvl(layerLo('mar'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].msVoid) enemies.splice(k, 1); });

/* ---------- partículas: gotas grandes caindo do teto no mar e névoa rente à superfície no vão, plâncton subindo e
   bolhas debaixo da água, vapor e fumaça preta nas Chaminés ---------- */
HOOK.update.push(dt => {
  if (!MAR || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = marBand(pty); if (b < 0 || b > 3) return;
  if (Math.random() < dt * 5) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH, tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (solidAt(tx, ty)) return;
    const w = aguaAt(tx, ty);
    if (w) { if (Math.random() < 0.6) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(-8, -3), g: -1, life: 3, max: 3, col: Math.random() < 0.6 ? '#4ac0b4' : '#8ae8d8', size: 1 }); else parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-26, -14), g: -4, life: 1.4, max: 1.4, col: '#c8ecf8', size: 1 }); }
    else if (b === 3) parts.push(Math.random() < 0.55 ? { x, y, vx: rnd(-3, 3), vy: rnd(-10, -4), g: -1, life: 2.4, max: 2.4, col: '#8a7a6a', size: 1, smoke: true } : { x, y, vx: rnd(-3, 3), vy: rnd(-8, -3), g: -1, life: 2.6, max: 2.6, col: '#141010', size: 1, smoke: true });
    else if (ty < MS_NIVEL) {
      if (Math.random() < 0.5) parts.push({ x, y, vx: 0, vy: rnd(60, 90), g: 30, life: 2.2, max: 2.2, col: '#8ac4dc', size: 1 });   // uma gota caindo do teto
      else if (ty > MS_NIVEL - 4) parts.push({ x, y, vx: rnd(4, 9), vy: rnd(-1, 1), g: 0, life: 3.5, max: 3.5, col: '#3a5a6a', size: 2, smoke: true });   // névoa
    }
  }
});

/* ---------- o oricalco na fornalha, os preços e quem compra o quê (o metal e os itens no 267; o prato do Odo no 269) ---------- */
FURN.min_oricalco = { bar: 'barra_oricalco', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_oricalco: 62, barra_oricalco: 500, escama_abissal: 14, tinta_polvo: 24, isca_viva: 22, peixe_cego: 6, peixe_assado: 18 });
// a pérola negra já vale 30 (136); o Grimaldo também compra, caro
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_oricalco', 'barra_oricalco', 'escama_abissal', 'perola_negra'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', oricalco, escamas abissais e pérolas negras.'; }
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'isca_viva'; c.hint = c.hint.replace(/\.$/, '') + ' e iscas vivas.'; }
{ const o = SHOPS.taverneiro, b = o.buys; o.buys = id => b(id) || id === 'peixe_cego'; o.hint = o.hint.replace(/\.$/, '') + ' e peixe-cego.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'tinta_polvo'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ' e tinta de polvo.'; } }
