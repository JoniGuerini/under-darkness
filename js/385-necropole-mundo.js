'use strict';

/* ================= a Necrópole do Rei Eterno: o mundo (docs/camadas/14-necropole.md, seção 3) =================
   A décima quarta camada, debaixo do Ossário dos Titãs (ncAbove, 380). Uma cidade inteira construída para os mortos e
   enterrada com eles: as salas não são cavernas, são ruas, salões e casas de pedra trabalhada no granito negro. Em passos:
     1. a rocha: granito negro em tudo; a rocha de cima afina e vira terra de cova nas últimas linhas; terra de cova em
        bolsas pelas Avenidas, cal em veios finos
     2. os vazios: as duas descidas do Ossário (o poço cai dentro da capela da guarda, 16 x 6, a câmara de pouso, e sai-se
        pela porta para a primeira avenida), o Salão do Relicário do outro lado do mundo (a caixa sólida que o 387 veste),
        as duas Escadas dos Mortos no fundo (o poço de 3 até a última linha), e as peças de cada faixa: as avenidas
        compridas e as covas nas Avenidas; os columbários altos e os ossuários nos Columbários; os salões dos quartéis
        nos Quartéis; as salas reais na Cripta
     3. as ligações: túneis entre as peças de cada andar (em anel) e 3 por WSC rampas entre os andares
     4. os carimbos: a laje das avenidas e os mausoléus (paredes de mármore, telhado de ardósia em duas águas, a porta, a
        laje de cova dentro); os columbários forrados de nichos com as galerias desencontradas e as correntes; os
        ossuários forrados de crânios; os quartéis de cantaria com o mezanino e as colunas; as salas reais de mármore
        negro com as colunas
     5. os veios: carvão no granito; a sepulcrita sempre a até 8 blocos de uma cova, de um mausoléu ou de um ossuário
   Depois (ncAfter): tudo alcançável das descidas, escada de ferro (ou corrente nos Columbários) em todo desnível de 5, a
   decoração de 1 bloco, os altares dos necromantes e os objetos (382). Por fim o Salão (387: ncDress), as bocas das
   descidas e a subida garantida (ncClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 81 a 84, o spawn por faixa e o nível (pela posição no 129), as partículas, a
   sepulcrita na fornalha e nas lojas. */

let ncCh = [];
let ncUpClimb = CHAIN;   // a escada da camada de cima (ncBuild acerta)
const NC_CLIMB = t => t === NC_ESCADA || t === NC_CORRENTE || t === CHAIN || t === ncUpClimb;
const NC_LYR = () => Math.min(WH - 8, NC_S0 + NC_D);   // a última linha da camada (a de baixo começa aqui)
const ncClimbT = y => necroBand(y) === 1 ? NC_CORRENTE : NC_ESCADA;   // a corrente nos Columbários, a escada de ferro no resto
let ncSites = [];   // covas, mausoléus e ossuários: de onde a sepulcrita sai

function ncBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = ncAbove(); ncUpClimb = A.climb || CHAIN;
  NC_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = NC_S0, YB = NC_LYR(), DB = YB - S0;
  const R = mulberry32(seed ^ 0x9c07a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < NC_BANDS[1] ? 0 : d < NC_BANDS[2] ? 1 : d < NC_BANDS[3] ? 2 : 3;
  // a camada é LAYER_K vezes mais alta que o desenho (186 metros): cada faixa vira K andares, um embaixo do outro.
  // lv(d, j): a linha da profundidade d do desenho, no andar j da faixa de d; lvOf(y): o andar (0 a 4K - 1) de uma linha
  const K = LAYER_K, BD = NC_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / NC_D); };
  const lvOf = y => { const d = (y - S0) * NC_D / DB, b = bandOf(d), h = (NC_BANDS[b + 1] - NC_BANDS[b]) / K; return b * K + clamp(Math.floor((d - NC_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  ncCh = []; ncSites = [];
  ncEntries = []; ncLand = []; ncExits = []; ncBoss = null; ncStreets = []; ncTombs = []; ncCols = []; ncOss = []; ncHalls = []; ncRoyal = []; ncCamps = []; ncKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a rocha de cima afina nas últimas 10 linhas e vira terra de cova
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x9b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = NC_TERRA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = NC_GRANITO; walls[i] = WNC_GRANITO; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0x9b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 22, 0x9a1), n2 = nz(x, y, 14, 0x9a2);
      const vein = Math.abs(nz(x, y, 26, 0x9a4) - 0.5);
      let t2 = NC_GRANITO;
      if (y - S0 < 12 && n2 < 1 - (y - S0) / 12) t2 = NC_TERRA;   // a terra das covas de cima, sumindo
      else if (vein < 0.016) t2 = NC_CAL;                           // veios finos de cal
      else if (b === 0 && n1 > 0.7) t2 = NC_TERRA;
      else if (b === 3 && n1 > 0.74) t2 = NC_MARMORE;
      tiles[i] = t2; walls[i] = WNC_GRANITO;
      if (agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. os vazios ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => ncCh.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  // uma sala de teto quase reto (feita por mãos): o chão reto em fy, o teto `h` acima com a abóbada de leve no meio
  const hall = (x0, fy, w, h, s, vault = 2) => {
    for (let x = x0; x < x0 + w; x++) {
      const u = (x + 0.5 - x0) / w * 2 - 1, top = fy - h - Math.round(vault * Math.max(0, 1 - u * u)) + Math.round((nz(x, fy, 7, s) - 0.5) * 1.2);
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

  // ---------- 2a. as duas descidas: os poços do Ossário caem na capela da guarda ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) { const a = (R() * WW) | 0; picks.push({ cx: a, fy: S0 - 2 }, { cx: W1(a + WW / 2), fy: S0 - 2 }); }
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 20 + ((R() * 6) | 0), S0 + 14, S0 + mb(30));
      const hx = side > 0 ? xs - 1 : xs - 12;   // o poço cai numa ponta da capela (16 x 6)
      // a casca de mármore em volta (2), a porta do lado de fora
      for (let y = landFy - 9; y <= landFy + 2; y++) for (let x = hx - 3; x <= hx + 18; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 16; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 16 : hx - 1, dx0 = side > 0 ? hx + 16 : hx - 3, dx1 = side > 0 ? hx + 18 : hx - 1;
      for (let y = landFy - 4; y < landFy; y++) for (let x = dx0; x <= dx1; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 16, h: 6, door: W1(door), side, ox0: W1(dx0), ox1: W1(dx1) };
      ncLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // a primeira avenida, logo depois da porta
      const w = 34 + ((R() * 14) | 0), h = 12, x0 = side > 0 ? dx1 + 1 : dx0 - w;
      hall(x0, landFy, w, h, 0x9c00 + ncLand.length, 1);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'rua', x0: W1(x0), fy: landFy, top: landFy - h, first: true };
      ncCh.push(H); ncStreets.push(H);
      ncCh.push({ cx: hx + 8, cy: landFy - 4, w: 26, h: 14, band: 0, kind: 'pouso', nolink: true });
      ncEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. o Salão do Relicário, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 120, h = 44;
    const ax = ncEntries.length ? ncEntries.reduce((s, e) => s + wdx(e.x0 - ncEntries[0].x0), 0) / ncEntries.length + ncEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 14, S0 + mb(176)), top = fy - h;
    ncBoss = { cx, x0: W1(cx - 60), x1: W1(cx + 59), w, h, top, fy,
      doors: [{ side: -1, x: W1(cx - 63), fy }, { side: 1, x: W1(cx + 62), fy }] };
    for (let y = top - 4; y <= fy + 4; y++) for (let x = cx - 64; x <= cx + 63; x++) seal[I(x, y)] = 1;
    ncCh.push({ cx, cy: fy - h / 2, w: w + 8, h: h + 8, band: 3, boss: true, nolink: true });
    for (const D of ncBoss.doors) {
      const len = 26 + ((R() * 12) | 0), fyD = D.fy;
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 5; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); ncKeep.add(I(x, fyD));
        x += D.side;
      }
      D.len = len;
      ncCh.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 5, band: 3, kind: 'servico', nolink: true });
      const gw = 30 + ((R() * 10) | 0), gh = 12, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      hall(gx0, fyD, gw, gh, 0x9c10 + D.side, 2);
      const C = { cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: 3, kind: 'real', x0: W1(gx0), fy: fyD, top: fyD - gh };
      ncCh.push(C); ncRoyal.push(C);
    }
  }
  const awayFromBoss = (cx, cy, m) => !ncBoss || Math.abs(wdx(cx - ncBoss.cx)) > ncBoss.w / 2 + 6 + m || cy < ncBoss.top - 6 - m || cy > ncBoss.fy + 6 + m;

  // ---------- 2c. as Escadas dos Mortos: duas salas no fundo, longe uma da outra e do Salão; um poço de 3 até a última linha ----------
  for (let tries = 0; ncExits.length < 2 && tries < 600; tries++) {
    const w = 18 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);
    if (!awayFromBoss(cx, fy, 90) ||   // longe o bastante para a Cidade aceitar a descida (ela pede w + 20 do centro do Salão)
      ncExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'escada', x0: W1(x0), fy, top: fy - h, exit: true };
    ncCh.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    ncExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. as Avenidas dos Túmulos: as ruas compridas de teto reto e as covas ----------
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 600 * K; tries++) {
    const j = k % K, w = 60 + ((R() * 61) | 0), h = 13 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = Math.max(lv(0, j) + h + 6, lv(18 + R() * 26, j));
    if (fy > lv(0, j) + 46 || busy(x0 + w / 2, fy - h / 2, w + 10, h + 6, 6)) continue;
    hall(x0, fy, w, h, 0x9d00 + k, 2);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'rua', x0: W1(x0), fy, top: fy - h };
    ncStreets.push(C); ncCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 300 * K; tries++) {
    const w = 14 + ((R() * 14) | 0), h = 7 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(6, k % K) + h / 2 + R() * Math.max(0, 36 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x9d80 + k, 1.6);
    ncCh.push({ cx, cy, w, h, band: 0, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2e. os Columbários: os salões altos de nichos e os ossuários ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 26 + ((R() * 15) | 0), hh = 30 + ((R() * 12) | 0), cx = (R() * WW) | 0, top = lv(50 + R() * 10, j), fy = Math.min(lv(96, j), top + hh);
    if (fy - top < 24 || busy(cx, (top + fy) / 2, w + 10, fy - top, 5)) continue;
    const x0 = Math.round(cx - w / 2);
    for (let y = top; y < fy; y++) { const ox = Math.round((nz(cx, y, 9, 0x9e00 + k) - 0.5) * 2); for (let x = x0 + ox; x < x0 + w + ox; x++) dig(x, y); }
    for (let x = x0 - 2; x < x0 + w + 2; x++) hard(x, fy);
    const C = { cx, cy: (top + fy) / 2, w, h: fy - top, band: 1, kind: 'col', x0: W1(x0), fy, top };
    ncCols.push(C); ncCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 18 + ((R() * 9) | 0), h = 9 + ((R() * 4) | 0), x0 = (R() * WW) | 0, fy = lv(56 + R() * 38, j);
    if (fy - h - 3 < lv(48, j) || busy(x0 + w / 2, fy - h / 2, w + 8, h + 6, 6)) continue;
    room(x0, fy, w, h);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'oss', x0: W1(x0), fy, top: fy - h };
    ncOss.push(C); ncCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 16 + ((R() * 14) | 0), h = 8 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(50, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x9ec0 + k, 1.7);
    ncCh.push({ cx, cy, w, h, band: 1, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2f. os Quartéis da Legião: os salões compridos com mezanino ----------
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 50 + ((R() * 31) | 0), h = 17 + ((R() * 4) | 0), x0 = (R() * WW) | 0, fy = lv(108 + R() * 38, j);
    if (fy - h - 4 < lv(98, j) || busy(x0 + w / 2, fy - h / 2, w + 10, h + 6, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 8)) continue;
    hall(x0, fy, w, h, 0x9f00 + k, 0);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'quartel', x0: W1(x0), fy, top: fy - h };
    ncHalls.push(C); ncCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(102, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6)) continue;
    blob(cx, cy, w, h, 0x9f80 + k, 1.6);
    ncCh.push({ cx, cy, w, h, band: 2, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2g. a Cripta Real: as salas de mármore negro ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 36 + ((R() * 21) | 0), h = 12 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = lv(158 + R() * 22, j);
    if (fy > YB - 6 || fy - h - 3 < lv(150, j) || busy(x0 + w / 2, fy - h / 2, w + 10, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    hall(x0, fy, w, h, 0x9fc0 + k, 3);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'real', x0: W1(x0), fy, top: fy - h };
    ncRoyal.push(C); ncCh.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const w = 18 + ((R() * 12) | 0), h = 10 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(154, k % K) + h / 2 + R() * Math.max(0, 26 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, Math.max(w, h) / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0x9fe0 + k, 1.8);
    ncCh.push({ cx, cy, w, h, band: 3, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of ncCh) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(ends(c, false)[1] - 1) - c.band * K, 0, K - 1)].push(c);
  for (let l = 0; l < NL; l++) {
    const L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      worm(ax, ay - 2, bx, by - 2, 1.5, 0x9700 + l * 90 + k);
    }
  }
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l], D = byLv[l + 1];
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5); ramp(ax, ay - 2, Math.round(Q.cx), mouth(Q) - 2, 1.4, 0x97f0 + l * 9 + k);
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
  const set = (x, y, t, w) => { if (y < S0 || y >= YB - 1) return; const i = I(x, y); if (ncKeep.has(i)) return; tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const wallOf = y => { const b = necroBand(y); return b === 1 ? WNC_NICHOS : b === 2 ? WNC_CANTARIA : b === 3 ? WNC_MARMORE : WNC_GRANITO; };
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) { const i = y * WW + x; if (tiles[i] === AIR) walls[i] = wallOf(y); }
  const inB = (x, y) => !ncBoss || awayFromBoss(x, y, -4);
  // o chão de uma sala (as duas linhas de baixo do vão) vira t; o teto (a linha de cima) vira tc
  const paveFloor = (x0, x1, fy, t, rows = 2) => { for (let x = x0; x <= x1; x++) for (let r = 0; r < rows; r++) { const i = I(x, fy + r); if (SOLID[tiles[i]] && !ncKeep.has(i) && tiles[i] !== BEDROCK) tiles[i] = t; } };
  const ceilOf = (x, fy, max) => { let y = fy - 1; while (y > fy - max && at(x, y) === AIR) y--; return at(x, y) === AIR ? null : y; };

  // as avenidas: a laje em fiadas, a terra nas bordas, os mausoléus de um lado e de outro, as lápides
  for (const C of ncStreets) {
    const x0 = C.x0, x1 = C.x0 + C.w - 1;
    paveFloor(x0, x1, C.fy, NC_LAJE, 1);
    for (let x = x0; x <= x1; x++) { const i = I(x, C.fy + 1); if (SOLID[tiles[i]] && !ncKeep.has(i)) tiles[i] = NC_TERRA; }
    for (let x = x0; x <= x1; x++) { const y = ceilOf(x, C.fy, C.h + 6); if (y !== null && !ncKeep.has(I(x, y))) tiles[I(x, y)] = NC_GRANITO; }
    // os mausoléus: casinhas de mármore com telhado de ardósia, a porta virada para a rua
    let x = x0 + 3 + ((R() * 6) | 0);
    while (x < x1 - 10) {
      const w = 7 + ((R() * 5) | 0), hh = Math.min(C.h - 6, 5 + ((R() * 3) | 0)), roof = Math.min(3, Math.floor(w / 2) - 1);
      if (hh < 4 || x + w > x1 - 2 || (C.first && Math.abs(wdx(x - C.x0)) < 4)) { x += 6; continue; }
      let ok = true; for (let k = -1; k <= w; k++) { if (at(x + k, C.fy) === AIR || at(x + k, C.fy - 1) !== AIR) ok = false; for (let y = C.fy - hh - roof - 1; y < C.fy; y++) if (ncKeep.has(I(x + k, y)) || inNcLand(W1(x + k), y, 2) || !inB(x + k, y)) ok = false; }
      if (!ok) { x += 5; continue; }
      const door = R() < 0.5 ? -1 : 1, fy = C.fy;   // door: o lado da lápide
      for (let k = 0; k < w; k++) for (let y = fy - hh; y < fy; y++) {
        const edge = k === 0 || k === w - 1 || y === fy - hh, isDoor = (k === 0 || k === w - 1) && y >= fy - 3;   // as duas portas: a rua passa por dentro
        if (edge && !isDoor) set(x + k, y, NC_MARMORE, WNC_MARMORE); else set(x + k, y, AIR, WNC_MARMORE);
      }
      for (let r = 1; r <= roof; r++) for (let k = r - 1; k < w - r + 1; k++) set(x + k, fy - hh - r, NC_TELHA);   // o telhado em duas águas
      if (at(x + (w >> 1), fy - hh - roof - 1) === AIR && roof >= 2) set(x + (w >> 1), fy - hh - roof - 1, NC_TELHA);
      for (let k = 2; k < w - 2; k++) set(x + k, fy, NC_COVA);                                                   // a laje da cova dentro
      ncTombs.push({ x0: W1(x), w, fy, hh, roof, door }); ncSites.push([W1(x + (w >> 1)), fy]);
      x += w + 5 + ((R() * 10) | 0);
    }
  }
  // as covas das Avenidas: terra no chão
  for (const C of ncCh) if (C.kind === 'cova' && C.band === 0) for (let x = Math.round(C.cx - C.w / 2) - 1; x <= C.cx + C.w / 2 + 1; x++) for (let y = Math.round(C.cy - C.h / 2) - 1; y <= C.cy + C.h / 2 + 3; y++) { const i = I(x, y); if (tiles[i] === NC_GRANITO && at(x, y - 1) === AIR && !ncKeep.has(i)) { tiles[i] = NC_TERRA; if (hash2(W1(x), y, seed ^ 0x9e1) < 0.35) ncSites.push([W1(x), y]); } }

  // os columbários: as paredes forradas de nichos, as galerias desencontradas de laje a cada 8 ou 9 linhas, cobrindo
  // 3/5 do vão, a corrente pendurada da ponta de cada galeria até a de baixo
  for (const C of ncCols) {
    const cx = Math.round(C.cx);
    for (let y = C.top - 1; y <= C.fy; y++) {
      let xl = cx, xr = cx; if (at(cx, y) !== AIR) continue;
      while (xl > cx - 40 && at(xl - 1, y) === AIR) xl--; while (xr < cx + 40 && at(xr + 1, y) === AIR) xr++;
      for (const [xx, d] of [[xl - 1, -1], [xr + 1, 1]]) for (let k = 0; k < 2; k++) { const i = I(xx + d * k, y); if (SOLID[tiles[i]] && !ncKeep.has(i) && tiles[i] !== BEDROCK) tiles[i] = NC_NICHO; }
    }
    for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) { const y = ceilOf(x, C.fy, C.h + 4); if (y !== null && !ncKeep.has(I(x, y))) tiles[I(x, y)] = NC_NICHO; }
    paveFloor(C.x0 - 1, C.x0 + C.w, C.fy, NC_LAJE, 1);
    let side = hash2(cx, C.top, seed ^ 0x9e6) < 0.5 ? -1 : 1;
    for (let y = C.top + 7; y < C.fy - 5; y += 8 + ((hash2(cx, y, seed ^ 0x9e7) * 2) | 0), side = -side) {
      let xl = cx, xr = cx; if (at(cx, y) !== AIR) continue;
      while (xl > cx - 40 && at(xl - 1, y) === AIR) xl--; while (xr < cx + 40 && at(xr + 1, y) === AIR) xr++;
      const n = Math.min(26, Math.ceil((xr - xl + 1) * 0.6));
      for (let k = 0; k < n; k++) { const x = side < 0 ? xl + k : xr - k; if (at(x, y) === AIR && at(x, y - 1) === AIR) set(x, y, NC_LAJE); }
      // a corrente logo depois da ponta da galeria, de cima dela até o chão de baixo
      const tipX = side < 0 ? xl + n : xr - n;
      if (at(tipX, y) === AIR) for (let yy = y - 1; yy < C.fy && at(tipX, yy) === AIR; yy++) { const i = I(tipX, yy); tiles[i] = NC_CORRENTE; ncKeep.add(i); }
    }
    ncSites.push([cx, C.fy]);
  }
  // os ossuários: casca de crânios de 2 em volta, a cal no chão
  for (const C of ncOss) {
    for (let y = C.top - 2; y <= C.fy + 1; y++) for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) {
      const i = I(x, y); if (tiles[i] === AIR) { walls[i] = WNC_OSSOS; continue; }
      if (ncKeep.has(i) || tiles[i] === BEDROCK) continue;
      tiles[i] = y >= C.fy ? (y === C.fy ? NC_CAL : NC_OSSUARIO) : NC_OSSUARIO;
    }
    ncSites.push([Math.round(C.cx), C.fy]);
  }
  // os quartéis: cantaria no chão e no teto, o mezanino a 8 do chão com vãos de 3 a cada ~16, as colunas por baixo
  for (const C of ncHalls) {
    const x0 = C.x0, x1 = C.x0 + C.w - 1, my = C.fy - 9;
    paveFloor(x0 - 1, x1 + 1, C.fy, NC_CANTARIA, 2);
    for (let x = x0 - 1; x <= x1 + 1; x++) { const y = ceilOf(x, C.fy, C.h + 4); if (y !== null) for (let r = 0; r < 2; r++) { const i = I(x, y - r); if (SOLID[tiles[i]] && !ncKeep.has(i)) tiles[i] = NC_CANTARIA; } }
    for (let y = C.top - 1; y < C.fy; y++) for (const xx of [x0 - 1, x1 + 1]) { const i = I(xx, y); if (SOLID[tiles[i]] && !ncKeep.has(i)) tiles[i] = NC_CANTARIA; }
    if (C.h >= 15) {
      for (let x = x0 + 5; x <= x1 - 5; x++) { const k = (x - x0 - 5) % 17; if (k >= 14) continue; if (at(x, my) === AIR && at(x, my - 1) === AIR && at(x, my - 2) === AIR) set(x, my, NC_CANTARIA); }
      C.my = my;
    }
  }
  // as salas reais: mármore negro no chão, mármore no teto
  for (const C of ncRoyal) {
    const x0 = C.x0, x1 = C.x0 + C.w - 1;
    paveFloor(x0, x1, C.fy, NC_REAL, 2);
    for (let x = x0 - 1; x <= x1 + 1; x++) { const y = ceilOf(x, C.fy, C.h + 6); if (y !== null && !ncKeep.has(I(x, y))) tiles[I(x, y)] = NC_MARMORE; }
    ncSites.push([Math.round(C.cx), C.fy]);
  }

  // o Salão do Relicário: a caixa toda sólida de granito (o 387 escreve dentro)
  {
    const B = ncBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 63; x <= B.cx + 62; x++) { const i = I(x, y); tiles[i] = NC_GRANITO; walls[i] = WNC_MARMORE; if (agua.length) agua[i] = 0; }
    for (const D of B.doors) for (let k = 1; k <= D.len; k++) { const x = D.x + D.side * k; for (let y = D.fy - 5; y < D.fy; y++) walls[I(x, y)] = WNC_MARMORE; const i = I(x, D.fy); if (SOLID[tiles[i]]) tiles[i] = NC_REAL; }
  }
  // ---------- as descidas: o poço com a escada de ferro, a capela da guarda com as duas lanternas de alma ----------
  for (const E of ncEntries) {
    const x0 = E.x0, L = E.land;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = NC_TERRA; }
    for (let y = E.fy; y < L.fy - 6; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? walls[i] || WNC_GRANITO : WNC_GRANITO; ncKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 + 3 ? NC_TERRA : (y - E.fy) % 6 === 3 ? NC_CANTARIA : NC_GRANITO; ncKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = NC_ESCADA; ncKeep.add(i); } }
    // um patamar no meio do poço (só a escada passa): quem desce caindo cai a metade
    if (L.fy - 6 - E.fy > 14) { const my = (E.fy + L.fy - 6) >> 1; for (const x of [x0, x0 + 2]) { const i = I(x, my); tiles[i] = NC_CANTARIA; ncKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) ncKeep.add(I(x, y));
    // a capela: casca de mármore de 2, o chão de laje, o teto de mármore com a boca do poço
    for (let y = L.fy - L.h - 2; y <= L.fy + 1; y++) for (let x = L.x0 - 2; x <= L.x0 + L.w + 1; x++) {
      const i = I(x, y), inside = wdx(x - L.x0) >= 0 && wdx(x - L.x0) < L.w && y >= L.fy - L.h && y < L.fy;
      const shaft = y < L.fy - L.h && W1(x) >= W1(x0) && wdx(x - x0) < 3;
      const isDoor = y >= L.fy - 4 && y < L.fy && wdx(x - L.ox0) >= 0 && wdx(x - L.ox0) <= wdx(L.ox1 - L.ox0);
      if (inside || isDoor) { tiles[i] = AIR; walls[i] = WNC_MARMORE; }
      else if (shaft) { tiles[i] = W1(x) === W1(x0 + 1) ? NC_ESCADA : AIR; walls[i] = WNC_MARMORE; }
      else tiles[i] = y >= L.fy ? NC_LAJE : NC_MARMORE;
      ncKeep.add(i);
    }
    for (let x = L.ox0; wdx(x - L.ox0) <= wdx(L.ox1 - L.ox0); x++) { const i = I(x, L.fy); tiles[i] = NC_LAJE; ncKeep.add(i); const j = I(x, L.fy - 5); tiles[j] = NC_MARMORE; ncKeep.add(j); }
    // as duas lanternas de alma no chão, longe da escada: os necromantes as mantêm para receber quem desce
    for (const lx of L.side > 0 ? [L.x0 + 6, L.x0 + 12] : [L.x0 + 3, L.x0 + 9]) if (tiles[I(lx, L.fy - 1)] === AIR) tiles[I(lx, L.fy - 1)] = NC_LANTERNA;
  }
  // ---------- as Escadas dos Mortos: a cantaria em volta do poço, a corrente descendo até a última linha ----------
  for (const X of ncExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WNC_CANTARIA; ncKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = NC_CANTARIA; ncKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = NC_CORRENTE; ncKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2]) { const i = I(x, my); tiles[i] = NC_CANTARIA; ncKeep.add(i); } }   // o patamar no meio
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { ncKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = NC_CANTARIA; } }
    paveFloor(X.C.x0, X.C.x0 + X.C.w - 1, X.C.fy, NC_LAJE, 1);
    tiles[I(X.x0 + 1, X.fy)] = NC_CANTARIA;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0fa1c);
  const vein = (ore, n, d0, d1, lmin, lmax, host, near) => {
    for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) {
      let x, y;
      if (near) { const s = near(); if (!s) break; x = s[0] + ((R4() * 15) | 0) - 7; y = s[1] + 1 + ((R4() * 7) | 0); }
      else { x = (R4() * WW) | 0; y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); }
      if (y < S0 + mb(d0) || y > S0 + mb(d1)) continue;
      k++;
      const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !ncKeep.has(i) && inB(x, y)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(NC_O_CARVAO, 28 * WSC * K, 0, 186, 3, 6, t => t === NC_GRANITO);
  const pick = (d0, d1) => () => { const L = ncSites.filter(s => s[1] >= S0 + mb(d0) - 4 && s[1] < S0 + mb(d1) + 4); return L.length ? L[(R4() * L.length) | 0] : null; };
  const sepHost = t => t === NC_GRANITO || t === NC_TERRA;
  vein(NC_O_SEPULCRITA, 3 * WSC * K, 0, 46, 3, 5, sepHost, pick(0, 46));
  vein(NC_O_SEPULCRITA, 4 * WSC * K, 46, 98, 3, 5, sepHost, pick(46, 98));
  vein(NC_O_SEPULCRITA, 6 * WSC * K, 98, 150, 3, 6, sepHost, pick(98, 150));
  vein(NC_O_SEPULCRITA, 6 * WSC * K, 150, 186, 3, 6, t => sepHost(t) || t === NC_MARMORE, pick(150, 186));
  // nos quartéis não há covas: a sepulcrita sai do ferro velho das armaduras, perto dos salões
  if (ncHalls.length) vein(NC_O_SEPULCRITA, 3 * WSC * K, 98, 150, 3, 5, sepHost, () => { const C = ncHalls[(R4() * ncHalls.length) | 0]; return [Math.round(C.cx + (R4() - 0.5) * C.w), C.fy]; });
}
function ncAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = NC_S0, YB = NC_LYR(), R3 = mulberry32(seed ^ 0x9d3c1);
  const ncRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!ncRow(y)) return; const i = I(x, y); if (ncKeep.has(i) || inNcHall(W1(x), y, 4)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WNC_GRANITO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const ncSolid = t => SOLID[t] && NC_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = ncBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of ncEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!ncEntries.length && ncCh.length) flood(I(ncCh[0].cx, Math.round(ncCh[0].cy)));
  if (B) for (let y = B.top - 4; y <= B.fy + 4; y++) for (let x = B.cx - B.w / 2 - 4; x <= B.cx + B.w / 2 + 3; x++) reach[I(x, y)] = 1;
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
        if (ncKeep.has(nb) || ncKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
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
      for (let k = 1; k <= n; k++) { const ny = Math.round(ay + (by - ay) * k / n), nx = k === n ? ax + wdx(bx - ax) : x + dir * 12; worm(x, y, nx, ny, 1.3, 0x96a0 + pass + (k - 1) * 977); x = nx; y = ny; dir = -dir; }
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
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || NC_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (ncKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const tt = ncClimbT(y);
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || NC_CLIMB(at(x, y - 1)) || NC_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (ncKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, ncClimbT(yy));
  }


  // ---------- 3. as colunas das salas reais, do chão ao teto, uma a cada 7 ----------
  for (const C of ncRoyal) for (let x = C.x0 + 5; x < C.x0 + C.w - 5; x += 7) {
    const y = C.fy - 1; if (at(x, y) !== AIR || NC_CLIMB(at(x - 1, y)) || NC_CLIMB(at(x + 1, y))) continue;
    let top = y; while (top > C.top - 4 && at(x, top - 1) === AIR) top--;
    const gap = y - top + 1; if (gap < 3 || gap > 14 || !ncSolid(at(x, top - 1))) continue;
    for (let yy = top; yy <= y; yy++) put(x, yy, NC_COLUNA);
  }

  // ---------- 4. os altares dos necromantes: duas lanternas de alma e o lugar do altar (382) no chão de algumas salas ----------
  {
    const L = ncCh.filter(c => !c.nolink && !c.boss && c.kind !== 'escada' && c.kind !== 'cova');
    for (let b = 0; b < 4; b++) {
      const LB = L.filter(c => c.band === b);
      for (let k = 0, tries = 0; k < 5 * LAYER_K && tries < 40 * LAYER_K && LB.length; tries++) {
        const C = LB[(R3() * LB.length) | 0]; if (ncCamps.includes(C)) continue;
        const cx = Math.round(C.cx + (R3() - 0.5) * C.w * 0.5); let y = Math.round(C.fy ? C.fy - 1 : C.cy); while (y < YB - 2 && at(cx, y + 1) === AIR) y++;
        if (at(cx, y) !== AIR || !ncSolid(at(cx, y + 1)) || inBox(cx, y, 3) || inNcLand(W1(cx), y, 6)) continue;
        const spots = [];
        for (let dx = -6; dx <= 6; dx++) { const x = cx + dx; if (at(x, y) === AIR && at(x, y - 1) === AIR && ncSolid(at(x, y + 1)) && !NC_CLIMB(at(x, y - 1)) && !NC_CLIMB(at(x, y))) spots.push(x); }
        if (spots.length < 9) continue;
        put(spots[0], y, NC_LANTERNA); put(spots[spots.length - 1], y, NC_LANTERNA);
        ncCamps.push(Object.assign(C, { campX: W1(cx), campY: y })); k++;
      }
    }
  }

  // ---------- 5. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || ncKeep.has(i)) continue;
    const b = necroBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inNcLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = ncSolid(dn) && BLOCKY[dn] && up === AIR, ceil = ncSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (gap < 4) continue;
      if (b === 0 && (up === NC_TERRA || up === NC_GRANITO) && q < 0.035) { for (let j = 0, n = 1 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, NC_RAIZ); }
      else if ((b === 1 || b === 3) && q < (b === 1 ? 0.03 : 0.018)) { for (let j = 0, n = 1 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, NC_MORTALHA); }
      else if (b === 2 && q < 0.015) { for (let j = 0, n = 2 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, NC_CORRENTE); }
      continue;
    }
    if (!floor || NC_CLIMB(at(x - 1, y)) || NC_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    if (ncCamps.some(C => Math.abs(wdx(x - C.campX)) < 7 && Math.abs(y - C.campY) < 2)) continue;
    const earth = dn === NC_TERRA || dn === NC_COVA || dn === NC_LAJE;
    if (b === 0) { if (q < 0.04 && earth) put(x, y, NC_LAPIDE); else if (q < 0.06 && earth) put(x, y, NC_FLORES); else if (q < 0.075) put(x, y, NC_OSSOS); else if (q < 0.09 && dn === NC_TERRA) put(x, y, NC_MUSGO); }
    else if (b === 1) { if (q < 0.04) put(x, y, NC_URNA); else if (q < 0.08) put(x, y, NC_OSSOS); else if (q < 0.09 && dn === NC_CAL) put(x, y, NC_MUSGO); }
    else if (b === 2) { if (q < 0.035) put(x, y, NC_ELMO); else if (q < 0.06) put(x, y, NC_LANCAS); else if (q < 0.08) put(x, y, NC_OSSOS); }
    else { if (q < 0.03) put(x, y, NC_URNA); else if (q < 0.05) put(x, y, NC_OSSOS); else if (q < 0.065) put(x, y, NC_MUSGO); else if (q < 0.075 && dn === NC_REAL) put(x, y, NC_FLORES); }
  }
  // a lápide na porta de cada mausoléu
  for (const M of ncTombs) { const x = M.door < 0 ? M.x0 - 2 : M.x0 + M.w + 1, y = M.fy - 1; if (at(x, y) === AIR && ncSolid(at(x, y + 1)) && !NC_CLIMB(at(x - 1, y)) && !NC_CLIMB(at(x + 1, y)) && !ncKeep.has(I(x, y))) put(x, y, NC_LAPIDE); }

  // ---------- 6. os objetos ----------
  ncPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function ncExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of ncEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? NC_ESCADA : AIR; ncKeep.add(i); }
}
/* ---------- a subida garantida: do Salão, dos altares, de cada columbário, quartel, sala real, ossuário e mausoléu e do
   pé das Escadas dos Mortos o herói tem de conseguir voltar às descidas (pulo de 3 blocos; escada e corrente sobem) ---------- */
function ncClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = NC_S0, YB = NC_LYR(), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => NC_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  // os estados (célula, pulo que sobra 0 a 4) de onde se volta ao topo (y <= S0 - 3) saem de uma vez, andando de trás
  // para frente a partir do topo (antes era uma busca inteira para cada ponto de partida). F guarda, por célula
  // c = (y - Y0) * WW + x: 1 cabe o herói, 2 apoiado (pulo cheio), 4 chão ou escada aqui, 8 escada aqui ou acima
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !inNcHall(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
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
  const soft = t => t === NC_GRANITO || t === NC_TERRA || t === NC_CAL || t === NC_LAJE || t === NC_CANTARIA || t === NC_NICHO || t === NC_OSSUARIO || t === NC_MARMORE || t === NC_TELHA || t === NC_O_CARVAO;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || ncKeep.has(I(x, y)) || inNcHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !ncKeep.has(I(x, t)) && !inNcHall(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = ncClimbT(y); if (!walls[i]) walls[i] = WNC_GRANITO; } }
    return best;
  };
  const starts = [];
  if (ncBoss) for (const D of ncBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of ncCamps) starts.push([c.campX, c.campY]);
  for (const c of ncCols) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of ncHalls) { starts.push([Math.round(c.cx), c.fy - 1]); if (c.my) starts.push([Math.round(c.cx), c.my - 1]); }
  for (const c of ncRoyal) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of ncOss) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const t of ncTombs) starts.push([t.x0 + (t.w >> 1), t.fy - 1]);
  for (const X of ncExits) starts.push([X.x0 + 2, X.top - 1]);
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
  ncClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (282): por faixa, no chão, debaixo do teto e na parede. As flags do 282 decidem onde cada um
   pode ficar (caixa: só nas caixas torácicas; cranio: só nos crânios; canion: só nos desfiladeiros e nas pontes; leito:
   só nas covas do Leito). Objetos de chão só sobre osso, rocha, pó ou bronze, nunca sobre a cartilagem das pontes;
   nunca sobre escada, tendão ou lasca; nunca no pouso nem no Leito ---------- */

/* ---------- os objetos (382): por faixa, no chão, debaixo do teto e na parede. As flags do 382 decidem onde cada um
   pode ficar (coluna: só nos columbários; campo: só no altar dos necromantes, e o resto nunca no altar). Objetos de chão
   nunca sobre telhado ou rastrilho, escada ou corrente; nunca no pouso nem no Salão ---------- */
function ncPlaceProps() {
  if (typeof NC_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9e3c8);
  const S0 = NC_S0, YB = NC_LYR(), used = new Uint8Array(WW * WH * 2), BF = typeof NC_BACK_FLOOR !== 'undefined' ? NC_BACK_FLOOR : {};
  const B = ncBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= -2 && wdx(x - C.x0) < (C.len || C.w) + 2 && y >= C.top - 2 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const where = (def, x, y) => (!def.coluna || inside(ncCols, x, y)) && (def.campo ? ncCamps.some(C => !C.altar && Math.abs(wdx(x - C.campX)) < 6 && Math.abs(y - C.campY) < 2) : !ncCamps.some(C => Math.abs(wdx(x - C.campX)) < 5 && Math.abs(y - C.campY) < 3));
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || ncKeep.has(i) || wet(i) || inBox(W1(x), y, 1) || inNcLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && NC_SOILS[t] && t !== NC_BARREIRA && t !== NC_TELHA; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = NC_BAND_NAMES[clamp(necroBand(y), 0, 3)], plan = NC_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || wet(i) || inBox(W1(k), y, 2) || inNcLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
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

// a ordem: a camada, o Salão (387: ncDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('necropole', () => {
  if (!NECROPOLE) return;
  try { const t0 = performance.now(); ncBuild(); ncAfter(); if (typeof ncDress === 'function') ncDress(); ncExitClear(); ncClimbFix(); ncBuild.ms = performance.now() - t0; } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada atrás da Necrópole: a cidade dos mortos ao longe nas Avenidas, a parede de nichos sem fim
   nos Columbários, a legião parada em fileiras nos Quartéis, nichos e telhados na Cripta ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!NECROPOLE) return;
  const Y1 = Math.min(WH, NC_S0 + NC_D + 4);
  for (let y = Math.max(NC_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - NC_S0) + (depthNz(x, y, 25, seed ^ 0x9e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x9e12);
    DEEPT[i] = d < NC_BANDS[1] ? (n > 0.78 ? DP_NC_NICHOS : DP_NC_CIDADE) : d < NC_BANDS[2] ? DP_NC_NICHOS : d < NC_BANDS[3] ? (n > 0.75 ? DP_NC_NICHOS : DP_NC_LEGIAO) : (n > 0.55 ? DP_NC_NICHOS : DP_NC_CIDADE);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (NECROPOLE && ty >= NC_S0 && ty < NC_S0 + NC_D) return inNcHall(tx, ty, 2) ? NC_ZONE0 + 3 : NC_ZONE0 + clamp(necroBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), inteiros: de 5 a 6 bichos por faixa, os 10 aparecem
Object.assign(CATH_SPAWN, {
  [NC_ZONE0]: [[['coveiro', 22], ['ncMortalha', 18], ['ncFatuo', 14], ['embalsamador', 16], ['legionario', 18], ['necromante', 12]], 8],
  [NC_ZONE0 + 1]: [[['gaveta', 24], ['ncFatuo', 16], ['escriba', 18], ['necromante', 18], ['ncMortalha', 20]], 9],
  [NC_ZONE0 + 2]: [[['legionario', 26], ['arauto', 18], ['cavaleiro', 16], ['embalsamador', 18], ['necromante', 12]], 9],
  [NC_ZONE0 + 3]: [[['cavaleiro', 20], ['escriba', 20], ['gaveta', 14], ['legionario', 18], ['arauto', 14], ['ncMortalha', 14]], 10]
});
for (let z = NC_ZONE0; z < NC_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const NC_NO_SPAWN = (tx, ty) => ncSafe(tx, ty) || inNcHall(tx, ty, 4) || ncExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
// níveis pela posição no 129 (layerLvl no 52); nada nasce perto do pouso, no Salão nem nas Escadas dos Mortos
// o 387 chama os seus (âncoras, mortos do rei) com ncSummonNow ligado: nível e vida ficam com ele, e nada some no Salão
let ncSummonNow = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!NECROPOLE || !e || e.boss || (D && D.boss) || e.ncSummon || ncSummonNow) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - NC_S0;
  if (d >= 0 && d < NC_D) {
    if (zone >= NC_ZONE0 && zone <= NC_ZONE0 + 3 && NC_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.ncVoid = true; return e; }
    const lvl = layerLvl(layerLo('necropole'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
    if (e.ncRisen) { e.xp = 1; e.gold = 0; }
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].ncVoid) enemies.splice(k, 1); });

/* ---------- partículas: pó cinza caindo devagar nas Avenidas, poeira de osso nos Columbários, fuligem nos Quartéis, e na
   Cripta as faíscas de alma subindo devagar (as almas que o rei prendeu) ---------- */
HOOK.update.push(dt => {
  if (!NECROPOLE || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = necroBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 3 ? 2.5 : 3)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(3, 6), g: 0, life: 3.5, max: 3.5, col: Math.random() < 0.6 ? '#6e6a62' : '#4c4842', size: 1 });
    else if (b === 1) parts.push({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(2, 5), g: 0, life: 3.2, max: 3.2, col: Math.random() < 0.6 ? '#bcb092' : '#968a6e', size: 1 });
    else if (b === 2) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(1, 3), g: 0, life: 3, max: 3, col: Math.random() < 0.6 ? '#2a2826' : '#403c36', size: 1 });
    else parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(-7, -3), g: 0, life: 3.4, max: 3.4, col: Math.random() < 0.5 ? '#7ad8a8' : '#b8f0d0', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a sepulcrita na fornalha (388 tem os itens), as lojas ---------- */
FURN.min_sepulcrita = { bar: 'barra_sepulcrita', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_sepulcrita: 66, barra_sepulcrita: 530, cravo_caixao: 14, cinza_alma: 34, unguento: 30, tinta_sentenca: 40, mortalha_pano: 18 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'unguento' || id === 'cinza_alma'; c.hint = c.hint.replace(/\.$/, '') + ', unguento de embalsamar e cinza de alma.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_sepulcrita', 'barra_sepulcrita', 'cravo_caixao'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', sepulcrita e cravos de caixão.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'tinta_sentenca' || id === 'cinza_alma'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ', tinta da sentença.'; } }
