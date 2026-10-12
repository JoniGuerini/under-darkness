'use strict';

/* ================= o Ossário dos Titãs: o mundo (docs/camadas/12-ossario-titas.md, seção 3) =================
   A décima quarta camada, debaixo do Covil do Dragão (ttAbove, 280). Aqui as salas não são cavadas na rocha: são
   esqueletos carimbados e o vazio escuro em volta deles. Em passos:
     1. a rocha: rocha fóssil em tudo, a cinza do Covil cobrindo as primeiras 14 linhas e sumindo por ruído, ossos
        enterrados correndo pela rocha, osso por ruído no Vale, osso esponjoso por ruído no Leito
     2. os vazios: as duas descidas dos Tubos Frios (o tubo cai dentro de um crânio de titã: a câmara de pouso é a caixa
        craniana, 16 x 6, e sai-se pela órbita), o Leito do Titã do outro lado do mundo (a caixa sólida que o 287 veste),
        as duas Fendas Retas no fundo, e as cavernas largas em volta de cada peça: caixas torácicas e ossos longos no
        Campo; desfiladeiros, espinhas-ponte e bacias na Espinha; crânios-caverna e elmos de bronze no Vale; mãos
        abertas no Leito
     3. as ligações: túneis de minhoca entre as peças e 3 por WSC entre as faixas
     4. os carimbos: as costelas em arco com o esterno, o fêmur deitado (oco, com tutano), as vértebras com os discos e
        as apófises, a bacia, o crânio (órbitas, dentes de esmalte, a nuca aberta), o elmo tombado, a mão; o pó no chão
     5. os veios: carvão na rocha fóssil; adamantita sempre a até 8 blocos de uma lasca da foice ou de bronze
   Depois (ttAfter): tudo alcançável das descidas, escada de ossos ou tendão em todo desnível de 5, os estragos (placas
   de bronze caídas, pó nas encostas), a decoração de 1 bloco, as colunas de dente nos crânios, os acampamentos de
   catador e os objetos (282). Por fim o Leito (287: ttDress), as bocas das descidas e a subida garantida (ttClimbFix).
   O 87 liga o resto depois.
   Também: a terceira camada, as zonas 65 a 68, o spawn por faixa e o nível (pela posição no 129), as partículas, a
   adamantita na fornalha e nas lojas. */

const TT_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [TT_OSSO, TT_ESPONJA, TT_TUTANO, TT_ROCHA, TT_PO, TT_DENTE, TT_CARTILAGEM, TT_CINZA, TT_BRONZE, TT_O_CARVAO, TT_O_ADAMANTITA]) TT_SOILS[t] = 1;
let ttCh = [], ttCanyons = [], ttShards = [];
let ttUpClimb = CHAIN;   // a escada da camada de cima (ttBuild acerta)
const TT_CLIMB = t => t === TT_ESCADA || t === TT_TENDAO || t === CHAIN || t === ttUpClimb;
const TT_LYR = () => Math.min(WH - 8, TT_S0 + TT_D);   // a última linha da camada (a de baixo começa aqui)

function ttBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = ttAbove(); ttUpClimb = A.climb;
  TT_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = TT_S0, YB = TT_LYR(), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7177a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < TT_BANDS[1] ? 0 : d < TT_BANDS[2] ? 1 : d < TT_BANDS[3] ? 2 : 3;
  // a camada é LAYER_K vezes mais alta que o desenho (186 metros): cada faixa vira K andares da altura de antes, um
  // embaixo do outro. lv(d, j): a linha da profundidade d do desenho, no andar j da faixa de d; lvOf(y): o andar
  // (0 a 4K - 1) de uma linha
  const K = LAYER_K, BD = TT_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / TT_D); };
  const lvOf = y => { const d = (y - S0) * TT_D / DB, b = bandOf(d), h = (TT_BANDS[b + 1] - TT_BANDS[b]) / K; return b * K + clamp(Math.floor((d - TT_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  ttCh = []; ttCanyons = []; ttShards = [];
  ttEntries = []; ttLand = []; ttExits = []; ttBoss = null; ttCages = []; ttBones = []; ttBridges = []; ttPelves = []; ttSkulls = []; ttHelms = []; ttHands = []; ttCamps = []; ttKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a rocha de cima afina nas últimas 10 linhas e vira cinza assentada
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x7b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = TT_CINZA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = TT_ROCHA; walls[i] = WTT_ROCHA; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0x7b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x7a1), n2 = nz(x, y, 14, 0x7a2);
      const rib = Math.abs(nz(x, y, 22, 0x7a4) - 0.5);
      let tt = TT_ROCHA, w = WTT_ROCHA;
      if (y - S0 < 14 && n2 < 1 - (y - S0) / 14) tt = TT_CINZA;   // a cinza do vulcão de cima, sumindo
      else if (rib < 0.022) tt = TT_OSSO;   // ossos enterrados atravessando a rocha
      else if (b === 2 && n1 > 0.66) { tt = TT_OSSO; w = WTT_OSSO; }
      else if (b === 3) { if (n1 > 0.52) { tt = TT_ESPONJA; w = WTT_ESPONJA; } }
      tiles[i] = tt; walls[i] = w;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. os vazios ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => ttCh.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  // a caverna larga em volta de uma peça: chão reto em fy, o teto em domo irregular `h` acima, `m` de folga dos lados
  const hollow = (x0, fy, w, h, s) => {
    for (let x = x0; x < x0 + w; x++) {
      const u = (x + 0.5 - x0) / w * 2 - 1, top = fy - Math.round(h * Math.pow(Math.max(0, 1 - u * u), 0.45) + (nz(x, fy, 9, s) - 0.5) * 4);
      if (fy - top < 3) continue;
      for (let y = top; y < fy; y++) dig(x, y); hard(x, fy);
    }
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
  // rampa: a minhoca em zigue-zague de xa,ya até xb,yb, cada perna desce no máximo ~11 andando 14 a 23 de lado
  const ramp = (xa, ya, xb, yb, r, s) => {
    const Rr = mulberry32(seed ^ s ^ 0x5a17), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 11));
    let x = xa, y = ya, dir = wdx(xb - xa) < 0 ? -1 : 1;
    for (let k = 1; k <= n; k++) {
      const ny = Math.round(ya + dy * k / n), nx = k === n ? xa + wdx(xb - xa) : x + dir * (14 + ((Rr() * 10) | 0));
      worm(x, y, nx, ny, r, s + k * 131); x = nx; y = ny; dir = -dir;
    }
  };

  // ---------- 2a. as duas descidas: os Tubos Frios do Covil caem dentro de um crânio enterrado ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) { const a = (R() * WW) | 0; picks.push({ cx: a, fy: S0 - 2 }, { cx: W1(a + WW / 2), fy: S0 - 2 }); }
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 22 + ((R() * 7) | 0), S0 + 16, S0 + mb(32));
      const hx = side > 0 ? xs - 1 : xs - 12;   // o tubo cai numa ponta da caixa craniana (16 x 6)
      // o crânio de entrada: a casca de 3 em volta da caixa, a órbita do lado de fora é a porta
      const sk = { x0: hx - 4, x1: hx + 19, top: landFy - 10, fy: landFy + 2 };
      for (let y = sk.top - 1; y <= sk.fy; y++) for (let x = sk.x0 - 1; x <= sk.x1 + 1; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 16; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 16 : hx - 1, dx0 = side > 0 ? hx + 16 : hx - 4, dx1 = side > 0 ? hx + 19 : hx - 1;
      for (let y = landFy - 4; y < landFy; y++) for (let x = dx0; x <= dx1; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 16, h: 6, door: W1(door), side, skull: { x0: W1(sk.x0), x1: W1(sk.x1), top: sk.top, fy: sk.fy, ox0: W1(dx0), ox1: W1(dx1) } };
      ttLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // a primeira caverna, logo depois da órbita: o primeiro pedaço do Campo que o herói vê
      const w = 22 + ((R() * 8) | 0), h = 11, x0 = side > 0 ? dx1 + 1 : dx0 - w;
      hollow(x0, landFy, w, h, 0x7c00 + ttLand.length);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'cova', x0: W1(x0), fy: landFy, top: landFy - h };
      ttCh.push(H);
      ttCh.push({ cx: hx + 8, cy: landFy - 4, w: 26, h: 14, band: 0, kind: 'pouso', nolink: true });
      ttEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. o Leito do Titã, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 140, h = 56;
    const ax = ttEntries.length ? ttEntries.reduce((s, e) => s + wdx(e.x0 - ttEntries[0].x0), 0) / ttEntries.length + ttEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 14, S0 + mb(174)), top = fy - h;
    ttBoss = { cx, x0: W1(cx - 70), x1: W1(cx + 69), w, h, top, fy,
      doors: [{ side: -1, x: W1(cx - 73), fy }, { side: 1, x: W1(cx + 72), fy }] };
    for (let y = top - 4; y <= fy + 4; y++) for (let x = cx - 74; x <= cx + 73; x++) seal[I(x, y)] = 1;
    ttCh.push({ cx, cy: fy - h / 2, w: w + 8, h: h + 8, band: 3, boss: true, nolink: true });
    for (const D of ttBoss.doors) {
      const len = 26 + ((R() * 12) | 0), fyD = D.fy;
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 5; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); ttKeep.add(I(x, fyD));
        x += D.side;
      }
      ttCh.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 5, band: 3, kind: 'servico', nolink: true });
      const gw = 22 + ((R() * 8) | 0), gh = 12, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      hollow(gx0, fyD, gw, gh, 0x7c10 + D.side);
      ttCh.push({ cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: 3, kind: 'cova', x0: W1(gx0), fy: fyD, top: fyD - gh });
    }
  }
  const awayFromBoss = (cx, cy, m) => !ttBoss || Math.abs(wdx(cx - ttBoss.cx)) > ttBoss.w / 2 + 6 + m || cy < ttBoss.top - 6 - m || cy > ttBoss.fy + 6 + m;

  // ---------- 2c. as Fendas Retas: duas salas no fundo, longe uma da outra e do Leito; um poço de 3 até a última linha ----------
  for (let tries = 0; ttExits.length < 2 && tries < 600; tries++) {
    const w = 18 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);   // no andar de baixo: a fenda é curta
    if (!awayFromBoss(cx, fy, 90) ||   // longe o bastante para a Cidade aceitar a descida (ela pede w + 20 do centro do Leito)
      ttExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'fenda', x0: W1(x0), fy, top: fy - h, exit: true };
    ttCh.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    ttExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. o Campo das Costelas: caixas torácicas e ossos longos caídos, cada um na sua caverna larga ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 50 + ((R() * 31) | 0), h = 22 + ((R() * 9) | 0), x0 = (R() * WW) | 0, fy = Math.max(lv(0, j) + h + 9, lv(26 + R() * 18, j));
    if (fy > lv(0, j) + 50 || busy(x0 + w / 2, fy - h / 2, w + 16, h + 8, 6)) continue;
    hollow(x0 - 8, fy, w + 16, h + 7, 0x7d00 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'caixa', x0: W1(x0), fy, top: fy - h, broken: R() < 0.35 };
    ttCages.push(C); ttCh.push(Object.assign({}, C, { w: w + 16, h: h + 7 })); k++;
  }
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 800 * K; tries++) {
    const len = 30 + ((R() * 31) | 0), th = 4 + ((R() * 3) | 0), x0 = (R() * WW) | 0, fy = lv(12 + R() * 30, k % K);
    if (fy - th - 10 < S0 + 3 || busy(x0 + len / 2, fy - 6, len + 12, 12, 5)) continue;
    hollow(x0 - 6, fy, len + 12, th + 8, 0x7d40 + k);
    const C = { cx: x0 + len / 2, cy: fy - 5, w: len + 12, h: th + 8, band: 0, kind: 'osso', x0: W1(x0), len, th, fy, top: fy - th - 8, open: R() < 0.5 ? -1 : 1 };
    ttBones.push(C); ttCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 300 * K; tries++) {
    const w = 16 + ((R() * 14) | 0), h = 8 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(8, k % K) + h / 2 + R() * Math.max(0, 36 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x7d80 + k, 1.6);
    ttCh.push({ cx, cy, w, h, band: 0, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2e. a Espinha: desfiladeiros fundos, espinhas-ponte por cima, bacias ----------
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 600 * K; tries++) {
    const j = k % K, w = 12 + ((R() * 19) | 0), depth = 30 + ((R() * 16) | 0), cx = (R() * WW) | 0, top = lv(48 + R() * 16, j), bot = Math.min(lv(97, j), top + depth);
    if (bot - top < 24 || busy(cx, (top + bot) / 2, w + 18, bot - top, 4)) continue;
    const s = 0x7e00 + k;
    for (let y = top; y < bot; y++) {
      const v = (y - top) / (bot - top), hw = w / 2 * (0.7 + 0.3 * Math.sin(v * Math.PI)) + (nz(cx, y, 7, s) - 0.5) * 4, ox = (nz(cx, y, 15, s + 1) - 0.5) * 6;
      for (let x = Math.round(cx + ox - hw); x <= Math.round(cx + ox + hw); x++) dig(x, y);
    }
    for (let x = Math.round(cx - w / 2) - 3; x <= cx + w / 2 + 3; x++) hard(x, bot);
    const C = { cx, cy: (top + bot) / 2, w, h: bot - top, band: 1, kind: 'canion', fy: bot, top };
    ttCanyons.push(C); ttCh.push(C);
    // 5 em cada 7 têm a espinha por cima: as vértebras em fila de parede a parede, a passarela em cima, um poço com escada
    // em cada cabeceira até o fundo
    if (ttBridges.length < 5 * WSC * K) {
      const by = top + Math.round((bot - top) * (0.22 + R() * 0.3)), L = Math.min(90, w + 22 + ((R() * 20) | 0)), bx0 = Math.round(cx - L / 2);
      for (let x = bx0; x < bx0 + L; x++) for (let y = by - 5; y < by; y++) dig(x, y);
      const heads = [bx0 + 1, bx0 + L - 4];
      for (const hx of heads) {
        for (let y = by - 5; y < bot; y++) for (let x = hx; x < hx + 3; x++) dig(x, y);
        const dir = hx < cx ? 1 : -1; for (let x = hx; Math.abs(x - cx) > w / 4; x += dir) for (let y = bot - 4; y < bot; y++) dig(x, y);
      }
      ttBridges.push({ cx, x0: W1(bx0), len: L, by, top: by - 5, fy: by, bot, heads: heads.map(W1), cw: w });
    }
    k++;
  }
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 300 * K; tries++) {
    const j = k % K, w = 30, h = 16, x0 = (R() * WW) | 0, fy = lv(62 + R() * 32, j);
    if (fy - h < lv(48, j) || busy(x0 + w / 2, fy - h / 2, w + 10, h + 6, 6)) continue;
    hollow(x0 - 5, fy, w + 10, h + 5, 0x7e80 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w: w + 10, h: h + 5, band: 1, kind: 'bacia', x0: W1(x0), pw: w, ph: h, fy, top: fy - h };
    ttPelves.push(C); ttCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(50, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x7ec0 + k, 1.7);
    ttCh.push({ cx, cy, w, h, band: 1, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2f. o Vale dos Crânios: crânios-caverna e elmos de bronze tombados ----------
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 34 + ((R() * 17) | 0), h = 20 + ((R() * 9) | 0), x0 = (R() * WW) | 0, fy = lv(106 + R() * 40, j);
    if (fy - h - 6 < lv(98, j) || busy(x0 + w / 2, fy - h / 2, w + 16, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 8)) continue;
    hollow(x0 - 8, fy, w + 16, h + 6, 0x7f00 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'cranio', x0: W1(x0), fy, top: fy - h, face: R() < 0.5 ? -1 : 1 };
    ttSkulls.push(C); ttCh.push(Object.assign({}, C, { w: w + 16, h: h + 6 })); k++;
  }
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 300 * K; tries++) {
    const j = k % K, w = 24, h = 14, x0 = (R() * WW) | 0, fy = lv(104 + R() * 42, j);
    if (fy - h - 6 < lv(98, j) || busy(x0 + w / 2, fy - h / 2, w + 12, h + 6, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 8)) continue;
    hollow(x0 - 6, fy, w + 12, h + 5, 0x7f40 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'elmo', x0: W1(x0), fy, top: fy - h, face: R() < 0.5 ? -1 : 1 };
    ttHelms.push(C); ttCh.push(Object.assign({}, C, { w: w + 12, h: h + 5 })); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(102, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6)) continue;
    blob(cx, cy, w, h, 0x7f80 + k, 1.6);
    ttCh.push({ cx, cy, w, h, band: 2, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2g. o Leito do Último: mãos abertas e covas de osso esponjoso ----------
  for (let k = 0, tries = 0; k < 2 * WSC * K && tries < 300 * K; tries++) {
    const w = 30, h = 12, x0 = (R() * WW) | 0, fy = lv(158 + R() * 20, k % K);
    if (fy > YB - 6 || busy(x0 + w / 2, fy - h / 2, w + 12, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    hollow(x0 - 6, fy, w + 12, h + 7, 0x7fc0 + k);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'mao', x0: W1(x0), fy, top: fy - h, face: R() < 0.5 ? -1 : 1 };
    ttHands.push(C); ttCh.push(Object.assign({}, C, { w: w + 12, h: h + 7 })); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const w = 18 + ((R() * 12) | 0), h = 10 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(154, k % K) + h / 2 + R() * Math.max(0, 26 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, Math.max(w, h) / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0x7fe0 + k, 1.8);
    ttCh.push({ cx, cy, w, h, band: 3, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), C.kind === 'canion' ? C.fy : mouth(C)];
  // cada peça no seu andar (o da faixa dela que contém a boca); as de um andar ligadas em anel
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of ttCh) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(ends(c, false)[1] - 1) - c.band * K, 0, K - 1)].push(c);
  for (let l = 0; l < NL; l++) {
    const b = (l / K) | 0, L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      worm(ax, ay - 2, bx, by - 2, b === 1 ? 1.35 : 1.5, 0x7700 + l * 90 + k);
    }
  }
  // entre um andar e o de baixo: 3 x WSC rampas em zigue-zague (nada de poço reto: cada perna desce uns 11)
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l], D = byLv[l + 1];
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5); ramp(ax, ay - 2, Math.round(Q.cx), mouth(Q) - 2, 1.4, 0x77f0 + l * 9 + k);
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
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 40) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 4. os carimbos ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { if (y < S0 || y >= YB - 1) return; const i = I(x, y); if (ttKeep.has(i)) return; tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const wallOf = y => { const b = titanBand(y); return b === 2 ? WTT_OSSO : b === 3 ? WTT_ESPONJA : WTT_ROCHA; };
  // fundo de todo vazio e o chão de pó: as salas do Campo e do Vale têm pó de osso no chão
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR) continue;
    walls[i] = wallOf(y);
    const dn = i + WW; if (y + 1 < YB - 1 && SOLID[tiles[dn]] && TT_SOILS[tiles[dn]] && tiles[dn] !== TT_OSSO && !ttKeep.has(dn)) {
      const b = titanBand(y); if ((b === 0 || b === 2) && nz(x, y, 10, 0x7f1) > 0.3) { tiles[dn] = TT_PO; if (SOLID[tiles[dn + WW]] && nz(x, y, 6, 0x7f2) > 0.55 && tiles[dn + WW] !== BEDROCK) tiles[dn + WW] = TT_PO; }
    }
  }
  const inB = (x, y) => !ttBoss || awayFromBoss(x, y, -4);

  // as caixas torácicas: o arco de costelas de 2 a 3 de espessura em volta do salão, as costelas separadas por vãos,
  // o esterno reto em cima, o espinhaço no chão; as costelas vistas de dentro ficam na parede de fundo
  for (const C of ttCages) {
    const a = C.w / 2, b = C.h, cx = C.x0 + a, th = 2 + (C.w > 64 ? 1 : 0), ribs = Math.round(C.w / 7);
    const gapAt = C.broken ? (R() < 0.5 ? 0.35 : 0.65) : -1;
    for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) for (let y = C.top - 2; y < C.fy; y++) {
      const u = (x + 0.5 - cx) / a, v = (C.fy - y - 0.5) / b, r = Math.sqrt(u * u + v * v);
      const rw = th / Math.min(a, b);
      const ang = Math.atan2(v, u), rk = ang / Math.PI * ribs;   // a costela: os vãos entre elas
      const onRib = Math.abs(rk - Math.round(rk)) < 0.27 || v > 0.92;   // o esterno em cima é contínuo
      if (r >= 1 - rw && r < 1 && (onRib || Math.abs(u) < 0.12)) {
        if (C.fy - y <= 4 && Math.abs(u) > 0.8) continue;   // os pés do arco ficam abertos: são as portas
        if (gapAt > 0 && Math.abs(ang / Math.PI - gapAt) < 0.06) continue;   // a costela quebrada no meio
        set(x, y, TT_OSSO, WTT_OSSO);
      } else if (r < 1 - rw && tiles[I(x, y)] === AIR) {
        walls[I(x, y)] = Math.abs(((x - C.x0) % 7) - 3) <= 1 && v < 0.85 ? WTT_OSSO : WTT_ROCHA;   // as costelas do outro lado
      }
    }
    // costelas soltas caídas de través dentro da caixa, em dois andares desencontrados (a 10 e a 20 do chão): o salão
    // alto não vira um poço, quem cai do esterno cai num osso
    for (const [dy, segs] of [[10, [[-0.75, -0.12], [0.12, 0.75]]], [20, [[-0.32, 0.32]]]]) {
      if (b < dy + 6) continue;
      for (const [u0, u1] of segs) for (let x = Math.round(cx + u0 * a); x <= Math.round(cx + u1 * a); x++) {
        const y = C.fy - dy - (hash2(x >> 2, C.fy, seed ^ 0x7e9) < 0.3 ? 1 : 0);
        if (at(x, y) === AIR && at(x, y - 1) === AIR && at(x, y - 2) === AIR) set(x, y, TT_OSSO);
      }
    }
    // o espinhaço deitado no chão: uma fileira de vértebras baixas
    for (let x = C.x0 + 2; x < C.x0 + C.w - 2; x++) { const i = I(x, C.fy); if (SOLID[tiles[i]] && !ttKeep.has(i)) tiles[i] = (x - C.x0) % 5 === 0 ? TT_CARTILAGEM : TT_OSSO; }
    // a costela quebrada caiu e virou rampa no chão
    if (gapAt > 0) {
      const rx = Math.round(cx + Math.cos(gapAt * Math.PI) * a * 0.6), dir = gapAt < 0.5 ? -1 : 1;
      for (let j = 0; j < 8; j++) { const x = rx + dir * j, y = C.fy - 1 - Math.floor(j / 2); if (at(x, y) === AIR && SOLID[at(x, y + 1)]) set(x, y, TT_OSSO); }
    }
  }
  // os ossos longos deitados: casca de osso, cabeças redondas nas pontas, o oco com tutano, uma ponta quebrada aberta
  for (const C of ttBones) {
    const x0 = C.x0, x1 = C.x0 + C.len - 1, fy = C.fy, th = C.th;
    for (let x = x0; x <= x1; x++) {
      const e = Math.min(x - x0, x1 - x), knob = e < 4, hh = knob ? th + 1 + (e < 3 ? 1 : 0) - (e === 0 ? 1 : 0) : th;
      for (let y = fy - hh; y < fy; y++) {
        if (at(x, y) !== AIR && !SOLID[at(x, y)]) continue;
        const inner = !knob && y > fy - th && y < fy - 1, broken = C.open > 0 ? x1 - x < 6 : x - x0 < 6;
        if (inner) { set(x, y, AIR, WTT_ESPONJA); continue; }
        if (broken && y > fy - th && y < fy - 1) { set(x, y, AIR, WTT_ESPONJA); continue; }
        set(x, y, y === fy - 1 && !knob ? TT_TUTANO : knob && y > fy - hh + 1 && hash2(x, y, seed ^ 0x7e1) < 0.4 ? TT_ESPONJA : TT_OSSO);
      }
    }
  }
  // as espinhas-ponte: vértebras de 6 x 6 com o furo no meio, discos de cartilagem de 2 entre elas, as apófises para cima
  for (const P of ttBridges) {
    const y0 = P.by, x0 = P.x0;
    for (let j = 0; j < P.len; j++) {
      const x = x0 + j, k = j % 8, disc = k >= 6;
      for (let y = y0; y < y0 + 6; y++) {
        if (disc) { if (y >= y0 + 1 && y < y0 + 5) set(x, y, TT_CARTILAGEM); else if (at(x, y) === AIR) continue; else set(x, y, TT_CARTILAGEM); continue; }
        const hole = k >= 2 && k <= 3 && y >= y0 + 2 && y <= y0 + 3;
        if (hole) { set(x, y, AIR, WTT_OSSO); continue; }
        set(x, y, TT_OSSO);
      }
      if (!disc && (k === 2 || k === 3) && j > 6 && j < P.len - 6) { set(x, y0 - 1, TT_OSSO); set(x, y0 - 2, TT_OSSO); }   // a apófise: a ameia
    }
    // as escadas das duas cabeceiras, da passarela até o fundo do desfiladeiro
    for (const hx of P.heads) for (let y = y0 - 5; y < P.bot; y++) { const i = I(hx + 1, y); if (tiles[i] === AIR || y >= y0 - 1) { tiles[i] = TT_ESCADA; walls[i] = WTT_ROCHA; ttKeep.add(i); } }
    // e nos poços das cabeceiras, um patamar de osso a cada 10 (só a escada passa)
    for (const hx of P.heads) for (let y = y0 + 9; y < P.bot - 5; y += 10) for (const x of [hx, hx + 2]) if (at(x, y) === AIR) set(x, y, TT_OSSO);
  }
  // os desfiladeiros: saliências de rocha fóssil a cada 8 a 10 linhas, uma de cada parede, cada uma cobrindo 3/5 do vão:
  // desce-se em zigue-zague e quem cai cai pouco (longe da ponte e do fundo, onde os túneis chegam)
  for (const C of ttCanyons) {
    const P = ttBridges.find(b => b.cx === C.cx && b.bot === C.fy), cx = Math.round(C.cx);
    let side = hash2(cx, C.top, seed ^ 0x7e6) < 0.5 ? -1 : 1;
    for (let y = C.top + 7; y < C.fy - 6; y += 8 + ((hash2(cx, y, seed ^ 0x7e7) * 3) | 0), side = -side) {
      if (P && y > P.by - 8 && y < P.by + 9) continue;
      let xl = cx, xr = cx; if (at(cx, y) !== AIR) continue;
      while (xl > cx - 30 && at(xl - 1, y) === AIR) xl--; while (xr < cx + 30 && at(xr + 1, y) === AIR) xr++;
      const n = Math.min(18, Math.ceil((xr - xl + 1) * 0.6));
      for (let k = 0; k < n; k++) { const x = side < 0 ? xl + k : xr - k; if (at(x, y) === AIR && at(x, y - 1) === AIR) set(x, y, k === n - 1 && hash2(x, y, seed ^ 0x7e8) < 0.5 ? TT_OSSO : TT_ROCHA); }
    }
  }
  // as bacias: a casca de osso em tigela, os dois arcos laterais abertos (as portas), o sacro na parede de fundo
  for (const C of ttPelves) {
    const x0 = C.x0, w = C.pw, h = C.ph, fy = C.fy, cx = x0 + w / 2;
    for (let x = x0 - 2; x < x0 + w + 2; x++) for (let y = fy - h - 2; y < fy; y++) {
      const u = (x + 0.5 - cx) / (w / 2 + 2), v = (fy - y) / (h + 2), bowl = u * u * 0.8 + Math.pow(Math.max(0, v - 0.15), 2) * 1.2;
      const shell = bowl > 0.62 && bowl < 1.0 && v > 0.12, door = Math.abs(u) > 0.7 && fy - y <= 6 && fy - y >= 1;
      if (shell && !door) set(x, y, TT_OSSO, WTT_OSSO);
      else if (bowl <= 0.62 && at(x, y) === AIR) walls[I(x, y)] = Math.abs(u) < 0.22 && v > 0.3 ? WTT_OSSO : WTT_ESPONJA;
    }
  }
  // uma casca de `th` em volta de uma forma (inside), com furos (hole): o que fica dentro vira ar com a parede `wIn`
  const shellOf = (x0, y0, x1, y1, inside, th, solidT, wIn, hole) => {
    const ins = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && inside(x, y);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!ins(x, y)) continue;
      let edge = false;
      for (let dy = -th; dy <= th && !edge; dy++) for (let dx = -th; dx <= th && !edge; dx++) if (dx * dx + dy * dy <= th * th + 1 && !ins(x + dx, y + dy)) edge = true;
      if (!edge) { set(x, y, AIR, wIn); continue; }
      if (hole && hole(x, y)) { set(x, y, AIR, wIn); continue; }
      set(x, y, typeof solidT === 'function' ? solidT(x, y) : solidT, wIn);
    }
  };
  // os crânios-caverna: a caixa craniana redonda atrás, a cara mais baixa na frente; casca de osso de 3, oca; a órbita e
  // o nariz na cara são janelas, a boca é a entrada com os dentes de esmalte, a nuca aberta atrás; o chão de dentro é pó
  for (const C of ttSkulls) {
    const x0 = C.x0, w = C.w, h = C.h, fy = C.fy, cx = x0 + w / 2, f = C.face;
    const kx = cx - f * w * 0.14, ky = fy - h * 0.52, ka = w * 0.37, kb = h * 0.53;   // a caixa craniana
    const fx0 = Math.min(cx, cx + f * w / 2), fx1 = Math.max(cx, cx + f * w / 2), ftop = fy - h * 0.66;   // a cara
    const inside = (x, y) => {
      const u = (x + 0.5 - kx) / ka, v = (y + 0.5 - ky) / kb; if (u * u + v * v < 1) return true;
      if (x + 0.5 < fx0 || x + 0.5 > fx1 || y + 0.5 < ftop || y >= fy) return false;
      const ex = (x + 0.5 - (cx + f * (w / 2 - 6))) * f, ey = ftop + 6 - (y + 0.5);   // a ponta de cima da cara arredondada
      return !(ex > 0 && ey > 0 && ex * ex + ey * ey > 36);
    };
    const ox = cx + f * w * 0.24, oy = fy - h * 0.46;
    const hole = (x, y) => {
      if (fy - y <= 6 && (x + 0.5 - cx) * f > w * 0.26) return true;                  // a boca
      if (fy - y <= 5 && (x + 0.5 - kx) * f < -ka * 0.7) return true;                  // a nuca
      if (Math.hypot((x + 0.5 - ox) / 1.15, y + 0.5 - oy) < 3.2) return true;           // a órbita
      return Math.abs(x + 0.5 - (ox + f * 4)) < 1 && y + 0.5 > oy + 3 && y + 0.5 < oy + 6;   // o nariz
    };
    shellOf(Math.floor(cx - w / 2) - 1, fy - h - 1, Math.ceil(cx + w / 2) + 1, fy - 1, inside, 3, (x, y) => hash2(W1(x), y, seed ^ 0x7e5) < 0.06 ? TT_ESPONJA : TT_OSSO, WTT_CRANIO, hole);
    // as prateleiras de osso de dentro da caixa craniana (a 10 e a 19 do chão, desencontradas): o crânio alto não vira poço
    for (const [dy, segs] of [[10, [[-0.8, -0.15], [0.15, 0.8]]], [19, [[-0.35, 0.35]]]]) {
      if (fy - (ky - kb) < dy + 7) continue;
      for (const [u0, u1] of segs) for (let x = Math.round(kx + u0 * ka); x <= Math.round(kx + u1 * ka); x++) {
        const y = fy - dy; if (at(x, y) === AIR && at(x, y - 1) === AIR && at(x, y - 2) === AIR && at(x, y + 1) === AIR) set(x, y, TT_OSSO);
      }
    }
    // os dentes: os de cima pendem da boca, os de baixo são tocos no chão (pula-se)
    for (let x = x0; x < x0 + w; x++) {
      if ((x + 0.5 - cx) * f <= w * 0.27) continue;
      let y = fy - 1; while (y > fy - 9 && at(x, y) === AIR) y--;
      if (y <= fy - 9 || fy - y < 5) continue;
      const k = (x - x0) % 3; if (k === 0) continue;
      set(x, y + 1, TT_DENTE); if (k === 1) set(x, y + 2, TT_DENTE);
      if (k === 2 && at(x, fy - 1) === AIR && SOLID[at(x, fy)]) set(x, fy - 1, TT_DENTE);
    }
    for (let x = x0 + 2; x < x0 + w - 2; x++) { const i = I(x, fy); if (SOLID[tiles[i]] && !ttKeep.has(i)) tiles[i] = (x + 0.5 - cx) * f > w * 0.26 ? TT_DENTE : TT_PO; }
  }
  // os elmos de bronze tombados: casca de bronze de 2 com rebites, a viseira aberta de um lado e a fresta dos olhos
  for (const C of ttHelms) {
    const x0 = C.x0, w = C.w, h = C.h, fy = C.fy, cx = x0 + w / 2, f = C.face;
    for (let x = x0; x < x0 + w; x++) for (let y = fy - h; y < fy; y++) {
      const u = (x + 0.5 - cx) / (w / 2), v = (fy - y - 0.5) / h, r = Math.sqrt(u * u + v * v);
      if (r >= 1) continue;
      if (r < 1 - 2 / Math.min(w / 2, h)) { if (at(x, y) === AIR) walls[I(x, y)] = WTT_BRONZE; continue; }
      const visor = u * f > 0.5 && fy - y <= 6, slit = u * f > 0.3 && Math.abs(y - (fy - h * 0.6)) < 1;
      if (visor || slit) { if (at(x, y) !== AIR) set(x, y, AIR, WTT_BRONZE); continue; }
      set(x, y, TT_BRONZE, WTT_BRONZE);
    }
    // a crista do elmo, uma fileira de bronze em cima
    for (let x = Math.round(cx - w / 5); x <= cx + w / 5; x++) if (at(x, fy - h - 1) === AIR) set(x, fy - h - 1, TT_BRONZE);
  }
  // as mãos abertas: a palma é um morro, os dedos são rampas que sobem do chão até ela (com o vão entre um e outro)
  for (const C of ttHands) {
    const x0 = C.x0, w = C.w, fy = C.fy, f = C.face, palm0 = f > 0 ? x0 : x0 + w - 12;
    for (let x = palm0; x < palm0 + 12; x++) { const u = (x + 0.5 - palm0 - 6) / 6, hh = Math.round(6 * Math.sqrt(Math.max(0, 1 - u * u * 0.6))); for (let y = fy - hh; y < fy; y++) set(x, y, y === fy - hh ? TT_OSSO : hash2(x, y, seed ^ 0x7e2) < 0.3 ? TT_ESPONJA : TT_OSSO); }
    for (let d = 0; d < 4; d++) {
      const start = f > 0 ? palm0 + 12 : palm0 - 1, len = 13 - Math.abs(d - 1.5) * 2;
      for (let j = 0; j < len; j++) {
        const x = start + f * j, y = fy - 6 + Math.floor(j / 2) + (d % 2);   // cada dedo desce um a cada dois
        if (y >= fy) break;
        if ((j + d * 3) % 9 === 8) continue;   // a junta: um vão no dedo
        set(x, y, TT_OSSO); if (y + 1 < fy && d % 2 === 0) set(x, y + 1, TT_OSSO);
      }
    }
    // o polegar, do outro lado da palma
    for (let j = 0; j < 6; j++) { const x = (f > 0 ? palm0 - 1 : palm0 + 12) - f * j, y = fy - 4 + Math.floor(j / 2); if (y < fy) set(x, y, TT_OSSO); }
  }

  // o Leito do Titã: a caixa toda sólida de rocha e osso esponjoso (o 287 escreve dentro)
  {
    const B = ttBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 73; x <= B.cx + 72; x++) { const i = I(x, y); tiles[i] = TT_ROCHA; walls[i] = WTT_ESPONJA; if (agua.length) agua[i] = 0; }
  }
  // ---------- as descidas: a boca vira cinza, o tubo frio com a escada de ossos, o crânio de entrada com a câmara ----------
  for (const E of ttEntries) {
    const x0 = E.x0, L = E.land, sk = L.skull;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = TT_CINZA; }
    // o crânio: a casca de osso, as suturas, a órbita é a porta; dentro a curva do crânio
    const skx0 = sk.x0, skw = wdx(sk.x1 - sk.x0) + 1, scx = skx0 + skw / 2, sh = sk.fy - sk.top;
    for (let y = sk.top; y <= sk.fy; y++) for (let x = skx0; x < skx0 + skw; x++) {
      const u = (x + 0.5 - scx) / (skw / 2), v = (sk.fy - y) / sh; if (u * u + v * v * 0.9 > 1.05) continue;
      const i = I(x, y); if (ttKeep.has(i)) continue;
      if (tiles[i] === AIR || cvHas(L, x, y)) { tiles[i] = AIR; walls[i] = WTT_CRANIO; } else { tiles[i] = TT_OSSO; walls[i] = WTT_CRANIO; }
    }
    for (let y = E.fy; y < L.fy - 6; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < sk.top ? WTT_ROCHA : WTT_CRANIO; ttKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 + 3 ? TT_CINZA : y >= sk.top ? TT_OSSO : (y - E.fy) % 7 === 3 ? TT_CINZA : TT_ROCHA; ttKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = TT_ESCADA; ttKeep.add(i); } }
    // um patamar de osso no meio do tubo (só a escada passa): quem desce caindo cai a metade
    if (L.fy - 6 - E.fy > 14) { const my = (E.fy + L.fy - 6) >> 1; for (const x of [x0, x0 + 2]) { const i = I(x, my); tiles[i] = TT_OSSO; ttKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) ttKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 4 && y < L.fy) { tiles[i] = AIR; walls[i] = WTT_CRANIO; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 3)) tiles[i] = y === L.fy ? TT_PO : TT_OSSO;
      else if (!edge) { tiles[i] = AIR; walls[i] = WTT_CRANIO; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? TT_ESCADA : AIR; walls[i] = WTT_CRANIO; }
      ttKeep.add(i);
    }
    // a órbita: o furo do olho atravessando a casca até fora
    for (let y = L.fy - 4; y < L.fy; y++) for (let x = sk.ox0; wdx(x - sk.ox0) <= wdx(sk.ox1 - sk.ox0); x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WTT_CRANIO; ttKeep.add(i); }
    for (let x = sk.ox0; wdx(x - sk.ox0) <= wdx(sk.ox1 - sk.ox0); x++) { const i = I(x, L.fy); tiles[i] = TT_OSSO; ttKeep.add(i); const j = I(x, L.fy - 5); if (tiles[j] === AIR || !SOLID[tiles[j]]) tiles[j] = TT_OSSO; ttKeep.add(j); }
    // duas lamparinas de tutano no chão, longe da escada
    for (const lx of L.side > 0 ? [L.x0 + 6, L.x0 + 12] : [L.x0 + 3, L.x0 + 9]) if (tiles[I(lx, L.fy - 1)] === AIR) tiles[I(lx, L.fy - 1)] = TT_LAMPARINA;
  }
  function cvHas(L, x, y) { return wdx(x - L.x0) >= 0 && wdx(x - L.x0) < L.w && y >= L.fy - L.h && y < L.fy; }
  // ---------- as Fendas Retas: a rocha racha reta, o tendão pendurado desce pelo poço até a última linha ----------
  for (const X of ttExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WTT_ROCHA; ttKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = y > X.fy - 8 ? TT_BRONZE : TT_ROCHA; ttKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = TT_TENDAO; ttKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2]) { const i = I(x, my); tiles[i] = TT_ROCHA; ttKeep.add(i); } }   // o patamar no meio
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { ttKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = TT_OSSO; } }
    tiles[I(X.x0 + 1, X.fy)] = TT_ROCHA;
  }

  // ---------- 5. as lascas da foice e os veios ----------
  // as lascas: cacos de adamantita cravados no chão das covas, mais no Vale e no Leito (a decoração TT_LASCA); o veio de
  // adamantita sempre a até 8 blocos de uma lasca ou de bronze
  const R4 = mulberry32(seed ^ 0x0f9c);
  const floorAt = (x, y) => { for (let k = 0; k < 10; k++, y++) { if (y >= YB - 2) return -1; const t = at(x, y + 1); if (at(x, y) === AIR && SOLID[t] && TT_SOILS[t] && BLOCKY[t]) return y; } return -1; };
  const bandW = [0.12, 0.2, 0.34, 0.34];
  for (let k = 0, tries = 0; k < 30 * WSC * K && tries < 3000 * K; tries++) {
    const q = R4(); let b = 0, acc = bandW[0]; while (b < 3 && q > acc) acc += bandW[++b];
    const x = (R4() * WW) | 0, y0 = S0 + Math.round((TT_BANDS[b] + R4() * (TT_BANDS[b + 1] - TT_BANDS[b])) * DB / TT_D);
    const y = floorAt(x, y0); if (y < 0) continue;
    const i = I(x, y); if (ttKeep.has(i) || !inB(x, y) || inTtLand(W1(x), y, 4)) continue;
    if (TT_CLIMB(at(x - 1, y)) || TT_CLIMB(at(x + 1, y))) continue;
    tiles[i] = TT_LASCA; ttShards.push([W1(x), y]); k++;
  }
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
        if (host(tiles[i]) && y < YB - 1 && !ttKeep.has(i) && inB(x, y)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(TT_O_CARVAO, 28 * WSC * K, 0, 186, 3, 6, t => t === TT_ROCHA);
  // os lugares de onde a adamantita sai: as lascas e as placas de bronze dos elmos
  const bronzes = []; for (const C of ttHelms) bronzes.push([Math.round(C.cx + (R4() - 0.5) * C.w), C.fy - 2]);
  const sites = ttShards.concat(bronzes);
  const pick = (d0, d1) => () => { const L = sites.filter(s => s[1] >= S0 + mb(d0) - 4 && s[1] < S0 + mb(d1) + 4); return L.length ? L[(R4() * L.length) | 0] : null; };
  const adaHost = t => t === TT_ROCHA || t === TT_OSSO;
  vein(TT_O_ADAMANTITA, 3 * WSC * K, 0, 46, 3, 5, adaHost, pick(0, 46));
  vein(TT_O_ADAMANTITA, 4 * WSC * K, 46, 98, 3, 5, adaHost, pick(46, 98));
  vein(TT_O_ADAMANTITA, 7 * WSC * K, 98, 150, 3, 6, adaHost, pick(98, 150));
  vein(TT_O_ADAMANTITA, 6 * WSC * K, 150, 186, 3, 6, t => adaHost(t) || t === TT_ESPONJA, pick(150, 186));
}

function ttAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = TT_S0, YB = TT_LYR(), R3 = mulberry32(seed ^ 0x7d3c1);
  const ttRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!ttRow(y)) return; const i = I(x, y); if (ttKeep.has(i) || inTtHall(W1(x), y, 4)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WTT_ROCHA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const ttSolid = t => SOLID[t] && TT_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = ttBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of ttEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!ttEntries.length && ttCh.length) flood(I(ttCh[0].cx, Math.round(ttCh[0].cy)));
  if (B) for (let y = B.top - 4; y <= B.fy + 4; y++) for (let x = B.cx - 74; x <= B.cx + 73; x++) reach[I(x, y)] = 1;
  // as bolsas que não se alcançam, rotuladas uma vez só (só as linhas da camada), da maior para a menor; a que um
  // conserto anterior já alcançou fica de fora
  const RB = S0 * WW, lab = new Uint8Array((YB - S0) * WW), comps = [];
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (reach[i] || lab[i - RB] || SOLID[tiles[i]] || !walls[i]) continue;
    const comp = []; lab[i - RB] = 1; stack.push(i);
    while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= RB && nb < YB * WW && !lab[nb - RB] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb - RB] = 1; stack.push(nb); } }
    if (comp.length >= 16) comps.push(comp);
  }
  comps.sort((a, c) => c.length - a.length);
  const org = new Int32Array((YB - S0) * WW);
  // a busca pela rocha da bolsa inteira até o vão alcançado mais perto (contornando o que fica); devolve onde chegou
  const bfs = C => {
    org.fill(-1); const q = []; let hit = -1; for (const c of C) { org[c - RB] = c; q.push(c); }
    for (let h = 0; h < q.length && hit < 0; h++) {
      const c = q[h], x = c % WW, row = c - x;
      for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
        if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb - RB] >= 0 || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
        if (reach[nb] && !SOLID[tiles[nb]]) { org[nb - RB] = c; hit = nb; break; }   // o vão alcançado vale mesmo guardado (a porta do pouso)
        if (ttKeep.has(nb) || ttKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
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
    if (!best) {   // nada perto: a ligação vai até o vão alcançado mais perto, por mais longe que esteja
      const h = bfs(bestC); if (h >= 0) { let o = h; while (org[o - RB] !== o) o = org[o - RB]; best = [o % WW, (o / WW) | 0, h % WW, (h / WW) | 0]; }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    {   // em zigue-zague quando a ligação é mais funda que 11: o conserto não abre poço
      const [ax, ay, bx, by] = best, n = Math.max(1, Math.ceil(Math.abs(by - ay) / 11)); let x = ax, y = ay, dir = wdx(bx - ax) < 0 ? -1 : 1;
      for (let k = 1; k <= n; k++) { const ny = Math.round(ay + (by - ay) * k / n), nx = k === n ? ax + wdx(bx - ax) : x + dir * 12; worm(x, y, nx, ny, 1.3, 0x76a0 + pass + (k - 1) * 977); x = nx; y = ny; dir = -dir; }
    }
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {
      const hit = bfs(bestC);
      for (let c = hit; c >= 0 && org[c - RB] !== c; c = org[c - RB]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada de ossos (Espinha e Vale) ou tendão (Campo e Leito) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || TT_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (ttKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const b = titanBand(y), tt = b === 1 || b === 2 ? TT_ESCADA : TT_TENDAO;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || TT_CLIMB(at(x, y - 1)) || TT_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (ttKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, TT_ESCADA);
  }

  // ---------- 3. os estragos: placas de bronze caídas no chão do Vale e do Leito, pó acumulado nas encostas ----------
  for (let k = 0, tries = 0; k < 14 * WSC * LAYER_K && tries < 2000 * LAYER_K; tries++) {
    const x = (R3() * WW) | 0, y0 = S0 + TT_BANDS[2] + ((R3() * (TT_BANDS[4] - TT_BANDS[2])) | 0);
    let y = y0; while (y < YB - 2 && at(x, y + 1) === AIR) y++;
    if (at(x, y) !== AIR || !ttSolid(at(x, y + 1)) || inBox(x, y, 3) || inTtLand(W1(x), y, 3)) continue;
    const w = 3 + ((R3() * 3) | 0); let ok = true;
    for (let j = 0; j < w; j++) { const i = I(x + j, y); if (at(x + j, y) !== AIR || !SOLID[at(x + j, y + 1)] || ttKeep.has(i) || TT_CLIMB(at(x + j, y - 1))) ok = false; }
    if (!ok) continue;
    for (let j = 0; j < w; j++) put(x + j, y, TT_BRONZE);
    k++;
  }
  for (let y = S0 + 2; y < S0 + TT_BANDS[2]; y++) for (let x = 0; x < WW; x++) {   // o pó escorre e junta no pé das encostas do Campo e da Espinha
    if (at(x, y) !== AIR || !ttSolid(at(x, y + 1)) || ttKeep.has(I(x, y)) || inTtLand(W1(x), y, 2)) continue;
    const l = SOLID[at(x - 1, y)] && !SOLID[at(x - 1, y - 1)], r = SOLID[at(x + 1, y)] && !SOLID[at(x + 1, y - 1)];
    if ((l || r) && !(l && r) && R3() < 0.18 && !TT_CLIMB(at(x, y - 1)) && at(x, y - 1) === AIR) put(x, y, TT_PO);
  }

  // ---------- 4. as colunas de dente nos crânios, do chão ao teto, uma a cada 7 ----------
  for (const C of ttSkulls) for (let x = C.x0 + 6; x < C.x0 + C.w - 6; x += 7) {
    let y = C.fy - 1; if (at(x, y) !== AIR) continue;
    let top = y; while (top > C.top - 2 && at(x, top - 1) === AIR) top--;
    const gap = y - top + 1; if (gap < 3 || gap > 12 || !ttSolid(at(x, top - 1))) continue;   // esticada só se o teto está perto; senão sai
    for (let yy = top; yy <= y; yy++) put(x, yy, TT_COLUNA);
  }

  // ---------- 5. os acampamentos de catador: lamparinas e estacas no chão de algumas caixas e covas do Campo e da Espinha ----------
  {
    const L = ttCh.filter(c => (c.band === 0 || c.band === 1) && (c.kind === 'caixa' || c.kind === 'cova' || c.kind === 'bacia') && !c.nolink);
    for (let k = 0, tries = 0; k < 2 * WSC * LAYER_K && tries < 60 * LAYER_K && L.length; tries++) {
      const C = L[(R3() * L.length) | 0]; if (ttCamps.includes(C)) continue;
      const cx = Math.round(C.cx); let y = Math.round(C.fy ? C.fy - 1 : C.cy); while (y < YB - 2 && at(cx, y + 1) === AIR) y++;
      if (at(cx, y) !== AIR || !ttSolid(at(cx, y + 1))) continue;
      const spots = [];
      for (let dx = -7; dx <= 7; dx++) { const x = cx + dx; if (at(x, y) === AIR && ttSolid(at(x, y + 1)) && !TT_CLIMB(at(x, y - 1))) spots.push(x); }
      if (spots.length < 6) continue;
      put(spots[1], y, TT_LAMPARINA); put(spots[spots.length - 2], y, TT_LAMPARINA);
      put(spots[(spots.length / 2) | 0], y, TT_ESTACA);
      ttCamps.push(Object.assign(C, { campX: W1(cx), campY: y })); k++;
    }
  }

  // ---------- 6. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || ttKeep.has(i)) continue;
    const b = titanBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inTtLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = ttSolid(dn) && BLOCKY[dn] && up === AIR, ceil = ttSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (q < 0.045) put(x, y, TT_LIQUEN);
      else if (q < 0.06 && gap >= 3) put(x, y, TT_PO_CAI);
      else if ((b === 0 || b === 3) && q < 0.07 && gap > 5) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, TT_TENDAO); }
      continue;
    }
    if (!floor || TT_CLIMB(at(x - 1, y)) || TT_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    const bone = dn === TT_OSSO || dn === TT_ESPONJA || dn === TT_TUTANO || dn === TT_PO;
    if (b === 0) { if (q < 0.05) put(x, y, TT_OSSINHOS); else if (q < 0.065 && dn === TT_ROCHA) put(x, y, TT_FOSSIL); else if (q < 0.08) put(x, y, TT_ESPINHO); }
    else if (b === 1) { if (q < 0.03) put(x, y, TT_OSSINHOS); else if (q < 0.05 && dn === TT_ROCHA) put(x, y, TT_FOSSIL); else if (q < 0.065) put(x, y, TT_ESPINHO); }
    else if (b === 2) { if (q < 0.04) put(x, y, TT_OSSINHOS); else if (q < 0.055 && bone) put(x, y, TT_FLOR); else if (q < 0.07) put(x, y, TT_ESPINHO); }
    else { if (q < 0.035) put(x, y, TT_OSSINHOS); else if (q < 0.07 && bone) put(x, y, TT_FLOR); else if (q < 0.08 && dn === TT_ROCHA) put(x, y, TT_FOSSIL); }
  }

  // ---------- 7. os objetos ----------
  ttPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function ttExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of ttEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? TT_ESCADA : AIR; ttKeep.add(i); }
}
/* ---------- a subida garantida: do Leito, dos acampamentos, de cada crânio e do pé das Fendas o herói tem de conseguir
   voltar às descidas (pulo de 3 blocos; escada e tendão sobem) ---------- */
function ttClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = TT_S0, YB = TT_LYR(), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => TT_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  // os estados (célula, pulo que sobra 0 a 4) de onde se volta ao topo (y <= S0 - 3) saem de uma vez, andando de trás
  // para frente a partir do topo (antes era uma busca inteira para cada ponto de partida). F guarda, por célula
  // c = (y - Y0) * WW + x: 1 cabe o herói, 2 apoiado (pulo cheio), 4 chão ou escada aqui, 8 escada aqui ou acima
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !inTtHall(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
    F[(y - Y0) * WW + x] = f;
  };
  const flags = () => { for (let y = Y0 + 1; y < YB; y++) for (let x = 0; x < WW; x++) flag1(x, y); };
  // o pulo com que se chega em c vindo de p (dir 0 de lado, 1 subindo, 2 descendo); -1 não dá
  const arrive = (p, r, c, dir) => { if (F[c] & 2) return dir === 1 && r === 0 ? -1 : 4; if (dir === 0) return r === 4 && !(F[p] & 4) ? 0 : r; if (dir === 1) return r === 0 ? -1 : F[p] & 8 ? 4 : r === 4 ? 3 : r - 1; return 0; };
  const closure = () => {
    good.fill(0); let qt = 0;
    for (let y = Y0 + 1; y <= S0 - 3; y++) for (let x = 0; x < WW; x++) { const c = (y - Y0) * WW + x, f = F[c]; if (f & 1) for (let r = f & 2 ? 4 : 0; r <= 4; r++) { good[c * 5 + r] = 1; Q[qt++] = c * 5 + r; } }
    spread(qt);
  };
  // depois de um conserto (escada na coluna x, de top a bot: só abre caminho, nunca fecha) basta refazer as marcas em
  // volta e continuar a volta a partir dos estados bons de perto
  const patch = (x, top, bot) => {
    for (let y = Math.max(Y0 + 1, top - 2); y <= Math.min(YB - 1, bot + 2); y++) for (let dx = -1; dx <= 1; dx++) flag1(W1(x + dx), y);
    let qt = 0;
    for (let y = Math.max(Y0 + 1, top - 3); y <= Math.min(YB - 1, bot + 3); y++) for (let dx = -2; dx <= 2; dx++) { const c = (y - Y0) * WW + W1(x + dx); for (let r = 0; r < 5; r++) if (good[c * 5 + r]) Q[qt++] = c * 5 + r; }
    spread(qt);
  };
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
  // tudo o que se alcança de uma célula (para o conserto)
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
  const soft = t => t === TT_ROCHA || t === TT_PO || t === TT_CINZA || t === TT_ESPONJA || t === TT_OSSO || t === TT_TUTANO || t === TT_CARTILAGEM;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || ttKeep.has(I(x, y)) || inTtHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !ttKeep.has(I(x, t)) && !inTtHall(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = TT_ESCADA; if (!walls[i]) walls[i] = WTT_ROCHA; } }
    return best;
  };
  const starts = [];
  if (ttBoss) for (const D of ttBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of ttCamps) starts.push([c.campX, c.campY]);
  for (const c of ttSkulls) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of ttCages) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of ttExits) starts.push([X.x0 + 2, X.top - 1]);
  for (const P of ttBridges) starts.push([P.x0 + (P.len >> 1), P.by - 3], [Math.round(P.cx), P.bot - 1]);
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
  ttClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (282): por faixa, no chão, debaixo do teto e na parede. As flags do 282 decidem onde cada um
   pode ficar (caixa: só nas caixas torácicas; cranio: só nos crânios; canion: só nos desfiladeiros e nas pontes; leito:
   só nas covas do Leito). Objetos de chão só sobre osso, rocha, pó ou bronze, nunca sobre a cartilagem das pontes;
   nunca sobre escada, tendão ou lasca; nunca no pouso nem no Leito ---------- */
function ttPlaceProps() {
  if (typeof TT_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b3c8);
  const S0 = TT_S0, YB = TT_LYR(), used = new Uint8Array(WW * WH * 2), BF = typeof TT_BACK_FLOOR !== 'undefined' ? TT_BACK_FLOOR : {};
  const B = ttBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= -2 && wdx(x - C.x0) < (C.len || C.w) + 2 && y >= C.top - 2 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const where = (def, x, y) => (!def.caixa || inside(ttCages, x, y)) && (!def.cranio || inside(ttSkulls, x, y) || inside(ttHelms, x, y)) && (!def.canion || inside(ttCanyons, x, y) || inside(ttBridges, x, y)) && (!def.campo || ttCamps.some(C => Math.abs(wdx(x - C.campX)) < 9 && Math.abs(y - C.campY) < 3));
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || ttKeep.has(i) || wet(i) || inBox(W1(x), y, 1) || inTtLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && TT_SOILS[t] && t !== TT_CARTILAGEM; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = TT_BAND_NAMES[clamp(titanBand(y), 0, 3)], plan = TT_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || wet(i) || inBox(W1(k), y, 2) || inTtLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (!where(def, W1(px + (tw >> 1)), y)) continue;
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

// a ordem: a camada, o Leito (287: ttDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('titas', () => {
  if (!TITAS) return;
  try { ttBuild(); ttAfter(); if (typeof ttDress === 'function') ttDress(); ttExitClear(); ttClimbFix(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada atrás do Ossário: costelas enormes ao longe no Campo, titãs deitados do tamanho de
   montanhas na Espinha e no Vale, rocha fóssil com ossos no Leito ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!TITAS) return;
  const Y1 = Math.min(WH, TT_S0 + TT_D + 4);
  for (let y = Math.max(TT_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - TT_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < TT_BANDS[1] ? (n > 0.72 ? DP_TT_TITAS : DP_TT_COSTELAS) : d < TT_BANDS[3] ? (n > 0.62 ? DP_TT_COSTELAS : DP_TT_TITAS) : (n > 0.7 ? DP_TT_TITAS : DP_TT_ROCHA);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (TITAS && ty >= TT_S0 && ty < TT_S0 + TT_D) return inTtHall(tx, ty, 2) ? TT_ZONE0 + 3 : TT_ZONE0 + clamp(titanBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), inteiros
Object.assign(CATH_SPAWN, {
  [TT_ZONE0]: [[['catador', 24], ['hiena', 20], ['descarna', 18], ['abutre', 20], ['medula', 18]], 8],
  [TT_ZONE0 + 1]: [[['erinia', 22], ['abutre', 22], ['catador', 18], ['hecaton', 20], ['maoterra', 18]], 9],
  [TT_ZONE0 + 2]: [[['medula', 16], ['ciclope', 16], ['titanide', 18], ['hiena', 16], ['descarna', 14], ['hecaton', 20]], 9],
  [TT_ZONE0 + 3]: [[['ciclope', 20], ['titanide', 20], ['maoterra', 18], ['erinia', 20], ['hecaton', 22]], 10]
});
for (let z = TT_ZONE0; z < TT_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const TT_NO_SPAWN = (tx, ty) => ttSafe(tx, ty) || inTtHall(tx, ty, 4) || ttExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
// níveis pela posição no 129 (layerLvl no 52); nada nasce perto do pouso, no Leito nem nas Fendas
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!TITAS || !e || e.boss || (D && D.boss) || e.ttMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - TT_S0;
  if (d >= 0 && d < TT_D) {
    if (zone >= TT_ZONE0 && zone <= TT_ZONE0 + 3 && TT_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.ttVoid = true; return e; }
    const lvl = layerLvl(layerLo('titas'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].ttVoid) enemies.splice(k, 1); });

/* ---------- partículas: pó fino caindo dos ossos em todo lugar, ciscos de cinza no Campo, pó levado de lado pelo vento
   nos desfiladeiros da Espinha; nada de fogo ---------- */
HOOK.update.push(dt => {
  if (!TITAS || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = titanBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 1 ? 5 : 3.5)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0 && Math.random() < 0.45) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(3, 7), g: 0, life: 3.5, max: 3.5, col: Math.random() < 0.6 ? '#8a8478' : '#5a564e', size: 1 });
    else if (b === 1 && Math.random() < 0.5) { const s = Math.sin(gameTime * 0.3) < 0 ? -1 : 1; parts.push({ x, y, vx: s * rnd(14, 26), vy: rnd(-1, 2), g: 0, life: 2.4, max: 2.4, col: Math.random() < 0.5 ? '#a89e88' : '#c8bca0', size: 1 }); }
    else parts.push({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(2, 5), g: 0, life: 3.2, max: 3.2, col: Math.random() < 0.6 ? '#c8bca0' : '#e8e0c8', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a adamantita na fornalha (288 tem os itens), as lojas, a maça de fêmur ---------- */
FURN.min_adamantita = { bar: 'barra_adamantita', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_adamantita: 62, barra_adamantita: 500, tutano: 30, dente_tita: 32, tendao: 12, olho_ciclope: 130 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'tutano' || id === 'olho_ciclope'; c.hint = c.hint.replace(/\.$/, '') + ', tutano de titã e olhos de ciclope.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_adamantita', 'barra_adamantita', 'dente_tita', 'tendao'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', adamantita, dentes e tendões de titã.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'olho_ciclope'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ', olhos de ciclope.'; } }
// a Maça de Fêmur atordoa mais que as outras maças (stunB do 288)
{ const _rc = recalc; recalc = function () { const r = _rc.apply(this, arguments); const w = equip.weapon, it = w && ITEMS[w.id]; if (it && it.stunB) pl.stunCh = (pl.stunCh || 0) + it.stunB; return r; }; }
