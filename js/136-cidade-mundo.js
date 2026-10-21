'use strict';

/* ================= a Cidade Afundada: o mundo debaixo das Minas Fúngicas =================
   buildCathedral() já faz as cavernas, a catedral, o gelo, a mina e as Minas Fúngicas; aqui ganha mais um passo,
   cdBuild() e cdAfter(), que fazem a cidade engolida debaixo do Coração do Micélio (docs/camadas/06-cidade-afundada.md,
   seção 3; docs/cidade-spec.md):
     1. a rocha: aterro em tudo, entulho em manchas, mármore no fundo; a carne e o xisto de cima rareiam
     2. poucas cavernas naturais (desabamentos), depois a cidade: nas Cisternas os salões de colunas com água negra, os
        esgotos de canal e o aqueduto; nas Ruas e no Bairro as ruas em quarteirões tortos (o chão sobe ou desce 1 bloco
        a cada 5 a 8), com rachaduras de tábua, montes de entulho, casas de 2 e 3 andares com telhado de ardósia que
        vira caminho, becos verticais e acampamentos; no Bairro o templo, as casas do culto e o Grande Poço; no
        Palácio os salões de mármore, as adegas (duas são as descidas para o Abismo) e a Torre do Sino (137 veste)
     3. as duas entradas: as raízes-mestras do Coração furam o teto de dois salões de cisterna; o cordão de micélio e
        uma escada de corda dos saqueadores descem até uma borda seca com a casa do guarda (pouso, 12 x 6)
     4. veios: carvão no aterro, prata no aterro e no limo, mais grossa no Palácio
     5. tudo alcançável das entradas; escada de corda (corrente nas Cisternas) em todo desnível de 5 ou mais; a
        decoração; os objetos (132); a subida garantida (cdClimbFix)
   A água negra é a do sistema comum (171): as bacias ficam em cdBasins e são cheias de novo no 139, depois do 87.
   Também aqui: a terceira camada, as zonas 29 a 32 (nomes no 139), o spawn (a procissão conta 1, o afogado só perto
   da água, saqueadores em dupla), o nível, os estados que os humanos põem no herói (marcado, encharcado, enredado),
   o Facão e o Capuz (138), os brilhos, as partículas, o Poço que bebe a luz, a fornalha e as lojas. */

let cdChambers = [], cdStreets = [], cdHouses = [], cdCamps = [], cdTemples = [], cdBasins = [], cdLand = [], cdPalace = [];
const cdKeep = new Set();   // o Poço, a torre, as entradas, o pouso, as bordas das bacias: túneis e decoração não mexem
const CD_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [CD_ATERRO, CD_CANTARIA, CD_TIJOLO, CD_CALCAMENTO, CD_TELHA, CD_MADEIRAME, CD_LIMO, CD_LODO, CD_MARMORE, CD_ENTULHO, CD_O_CARVAO, CD_O_PRATA]) CD_SOILS[t] = 1;
// a camada logo acima (129, camadaAcima; 2026-10-21: o Brejo das Bruxas entrou entre as Minas e a Cidade); sem ela, as
// Minas Fúngicas, com os mesmos números de antes
function cdAbove() {
  const a = camadaAcima('cidade'); if (a) return a;
  return { id: 'fungo', S0: FG_S0, D: FG_D, soils: FG_SOILS, host: FG_HOST, halls: typeof fungDown !== 'undefined' ? fungDown : [], climb: FG_ESCADA, thin: FG_CARNE, thinW: WFG_CARNE };
}
let cdUp = cdAbove();   // a de cima no cdBuild atual: a rocha que rareia no topo, o furo das entradas, a corda delas
const cdUpFg = () => !cdUp || cdUp.id === 'fungo';
const cdUpT = (h) => cdUpFg() ? (h > 0.75 ? FG_XISTO : FG_CARNE) : cdUp.thin || CD_ATERRO;   // a rocha de cima
const cdUpW = () => cdUpFg() ? WFG_CARNE : cdUp.thinW || WCD_LIMO;
const cdUpRope = () => cdUpFg() ? FG_CORDAO : cdUp.climb || CHAIN;                           // a corda das entradas
const CD_HOST = new Uint8Array(NT);    // o que a camada pode sobrescrever (o enchimento debaixo da camada de cima)
for (let t = 0; t < NT; t++) if (FG_HOST[t] || FG_SOILS[t] || (cdUp.host && cdUp.host[t]) || (cdUp.soils && cdUp.soils[t])) CD_HOST[t] = 1;
CD_HOST[BEDROCK] = 0;
const CD_CLIMB = t => t === CD_ESCADA || t === CD_CORRENTE || t === FG_CORDAO || t === FG_ESCADA || t === CHAIN || t === cdUpRope();
// a Torre do Sino (o 137 usa): dentro dela, com margem m
function inCdHall(tx, ty, m = 0) { const B = cdBoss; return !!B && Math.abs(wdx(tx - B.cx)) < B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inCdPoco = (tx, ty, m = 0) => { const P = cdPoco; return !!P && Math.abs(wdx(tx - P.cx)) <= 6 + m && ty >= P.top - 2 - m && ty <= P.bot + m; };

function cdBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = cdUp = cdAbove();
  CD_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = CD_S0, YB = Math.min(WH - 8, S0 + CD_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x6c1d), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < CD_BANDS[1] ? 0 : d < CD_BANDS[2] ? 1 : d < CD_BANDS[3] ? 2 : 3;
  // uma linha ao acaso para o que se repete numa faixa: o intervalo [a, b] do desenho de 186 guarda a mesma distância
  // das beiras da faixa e o meio se estica (a faixa é LAYER_K vezes mais alta e leva LAYER_K vezes mais coisas)
  const sp = (a, b, band) => { const B0 = CD_BANDS[band] / LAYER_K, B1 = CD_BANDS[band + 1] / LAYER_K, lo = mb(B0) + (a - B0), hi = mb(B1) - (B1 - b); return S0 + lo + R() * Math.max(0, hi - lo); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  cdChambers = []; cdStreets = []; cdHouses = []; cdCamps = []; cdTemples = []; cdBasins = []; cdLand = []; cdPalace = [];
  cdEntries = []; cdDown = []; cdBoss = null; cdPoco = null; cdKeep.clear();

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 8; y < S0; y++) {   // a carne e o xisto de cima rareiam nas últimas linhas do Coração
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x6b2);
      if (SOLID[tiles[i]] && ((A.soils && A.soils[tiles[i]]) || tiles[i] === A.thin) && h < k * 0.85) tiles[i] = CD_ATERRO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3 || !CD_HOST[tiles[i]]) continue;
      // 8 linhas abaixo da camada: o aterro sem ruído; a Floresta escreve pedra e parede por cima de tudo ali (é tudo
      // FP_HOST), então a parede de mármore ou cantaria que o ruído escolhia não chega ao mundo
      if (y >= YB + 8) { tiles[i] = CD_ATERRO; walls[i] = WCD_CANTARIA; continue; }
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x6b3);
      if (k < 1 && h > 0.4 + k * 0.6) { tiles[i] = cdUpT(h); walls[i] = cdUpW(); continue; }
      const b = bandOf(y - S0), n1 = nz(x, y, 30, 0x6a1), n2 = y < YB ? nz(x, y, 16, 0x6a2) : 0;   // n2 só dentro da camada
      let t = CD_ATERRO, w = b === 0 ? WCD_LIMO : b === 3 ? (n1 > 0.5 ? WCD_MARMORE : WCD_CANTARIA) : n1 > 0.55 ? WCD_CANTARIA : WCD_TIJOLO;
      if (y >= YB) t = CD_ATERRO;
      else if (b === 3 && n2 > 0.7) t = CD_MARMORE;
      else if (b > 0 && n2 > 0.8) t = CD_ENTULHO;
      else if (b === 0 && n1 > 0.78) t = CD_LIMO;
      tiles[i] = t; walls[i] = w;
    }
  }

  // ---------- 2. os desabamentos (cavernas naturais, poucas), depois a cidade ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const P0 = [0.12, 0.1, 0.1, 0.12];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x6c1), d = y - S0;
    cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.3 - (d < 5 ? 0.2 : 0) ? 1 : 0;
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
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const fill = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (!keep[i] && !seal[i]) cv[i] = 0; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };   // fica sólido (o chão de uma sala)
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.35) dig(x, y);
    }
  };
  const busy = (cx, cy, w, h, m = 4) => cdChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // uma sala de chão plano: `fy` é a fileira do chão, o ar de fy - h a fy - 1, teto em abóbada
  const room = (x0, fy, w, h, vault = 1.5) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(vault * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 3)); if (y >= fy - h + arch) dig(x, y); } for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const later = [];   // o que se escreve depois que as cavernas viram ar: (x, y, tile, wall?)
  const put = (x, y, t, w) => later.push([W1(x), y, t, w]);

  // ---------- 2a. as duas entradas: cada raiz-mestra do Coração fura o teto de um salão de cisterna ----------
  const cistern = (x0, fy, w, h, ledge) => {   // ledge: -1 a borda seca na esquerda, 1 na direita, 0 nenhuma
    room(x0, fy, w, h, 2);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'cisterna', x0: W1(x0), fy, top: fy - h, ledge };
    cdChambers.push(C); return C;
  };
  const fd = (A.halls || []).map(c => c.cx !== undefined ? c : Object.assign({}, c, { cx: c.x0 + (c.w || 3) / 2 })).filter(c => c.fy);
  const landFy = S0 + 26;   // a cisterna de chegada logo abaixo do Coração: o furo da raiz fica curto
  for (const F of fd.slice(0, 2)) {
    const side = R() < 0.5 ? -1 : 1, w = 40, h = 14, xs = W1(Math.round(F.cx) - 2);   // xs..xs+3: o furo da raiz
    const x0 = side < 0 ? xs - 3 : xs + 4 - w + 3;
    const C = cistern(x0, landFy, w, h, side);
    const L = landFy - 4;   // a borda seca: 10 colunas de cantaria do lado do furo, o topo em L
    C.ledgeY = L; C.ledgeX0 = side < 0 ? W1(x0) : W1(x0 + w - 10);
    // o pouso: a casa do guarda, 12 x 6, do lado de fora da borda, com o chão na altura dela
    const hx = side < 0 ? x0 - 13 : x0 + w + 1;
    for (let y = L - 7; y <= L; y++) for (let x = hx - 1; x <= hx + 12; x++) seal[I(x, y)] = 1;
    for (let y = L - 6; y < L; y++) for (let x = hx; x < hx + 12; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    const door = side < 0 ? hx + 12 : hx - 1;
    for (let y = L - 3; y < L; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; }
    cdLand.push({ x0: W1(hx), fy: L, w: 12, h: 6, door: W1(door) });
    // o furo: do chão do salão de cima até o teto da cisterna
    for (let y = F.fy; y < landFy - h + 2; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
    cdEntries.push({ x0: xs, fy: F.fy, top: F.fy - 2, ledge: L, land: cdLand[cdLand.length - 1], C });
  }
  const awayFromEntries = (cx, m) => cdEntries.every(E => Math.abs(wdx(E.x0 - cx)) > m);

  // ---------- 2b. a Torre do Sino, do outro lado do mundo em relação às entradas (o 137 veste) ----------
  {
    const w = 20, h = 50, ax = cdEntries.length ? cdEntries.reduce((s, e) => s + wdx(e.x0 - cdEntries[0].x0), 0) / cdEntries.length + cdEntries[0].x0 : SPX;
    let cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30));
    const fy = Math.min(YB - 4, S0 + mb(183)), top = fy - h, x0 = cx - (w >> 1);
    for (let y = top - 2; y <= fy + 1; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) seal[I(x, y)] = 1;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    cdBoss = { x0: W1(x0), x1: W1(x0 + w - 1), cx, w, h, top, fy };
    cdChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true, nolink: true });
    // a ponte de telhados no alto (o campanário) e a porta de baixo: abertas na casca, um corredor para fora
    const sd = R() < 0.5 ? -1 : 1, bridgeY = top + 9, doorY = fy;
    cdBoss.bridge = { side: sd, fy: bridgeY, x: W1(sd < 0 ? x0 - 1 : x0 + w) };
    cdBoss.door = { side: -sd, fy: doorY, x: W1(-sd < 0 ? x0 - 1 : x0 + w) };
    for (const [s, f, len] of [[sd, bridgeY, 26], [-sd, doorY, 14]]) {
      for (let k = 0; k < 2; k++) for (let y = f - 4; y < f; y++) { const i = I(s < 0 ? x0 - 1 - k : x0 + w + k, y); cv[i] = 1; keep[i] = 1; }
      const xa = s < 0 ? x0 - 2 - len : x0 + w + 2;
      for (let x = xa; x < xa + len; x++) { for (let y = f - 4; y < f; y++) dig(x, y); hard(x, f); }
      cdChambers.push({ cx: xa + len / 2, cy: f - 2, w: len, h: 4, band: f < S0 + CD_BANDS[3] ? 2 : 3, kind: s === sd ? 'ponte' : 'porta', fy: f, x0: W1(xa), len });
    }
  }

  // ---------- 2c. o Grande Poço: 9 de largura, paredes de pedra do Poço, do Bairro até perto do fundo ----------
  {
    let cx = 0; for (let tries = 0; tries < 100; tries++) { cx = (R() * WW) | 0; if (awayFromEntries(cx, 100) && Math.abs(wdx(cx - cdBoss.cx)) > 70) break; }
    const top = S0 + mb(108), bot = top + 68, x0 = cx - 4;   // fundo como no desenho (68): esticado, viraria uma queda de 200
    cdPoco = { x0: W1(x0), x1: W1(x0 + 8), cx: W1(cx), top, bot };
    for (let y = top; y <= bot + 3; y++) for (let x = x0 - 2; x <= x0 + 10; x++) seal[I(x, y)] = 1;
    for (let y = top; y < bot; y++) for (let x = x0; x <= x0 + 8; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    cdChambers.push({ cx, cy: (top + bot) / 2, w: 13, h: bot - top + 4, band: 2, kind: 'poco', nolink: true });
  }

  // ---------- 2d. as Cisternas Altas: salões de colunas, esgotos de canal, o aqueduto ----------
  for (let k = 0, tries = 0; k < WSC * LAYER_K && tries < 200 * LAYER_K; tries++) {
    const w = 60 + ((R() * 21) | 0), h = 22, cx = (R() * WW) | 0, cy = sp(24, 34, 0);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x6e00 + k, 1.2);
    cdChambers.push({ cx, cy, w, h, band: 0, kind: 'aqueduto' }); k++;
  }

  for (let k = 0, tries = 0; k < 4 * WSC * LAYER_K && tries < 400 * LAYER_K; tries++) {
    const w = 30 + ((R() * 21) | 0), h = 12 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = Math.round(sp(16, 42, 0));
    if (fy - h < S0 + 3 || busy(x0 + w / 2, fy - h / 2, w, h, 5)) continue;
    cistern(x0, fy, w, h, 0); k++;
  }
  for (let k = 0, tries = 0; k < 3 * WSC * LAYER_K && tries < 300 * LAYER_K; tries++) {
    const w = 40 + ((R() * 41) | 0), x0 = (R() * WW) | 0, fy = Math.round(sp(10, 44, 0));
    if (busy(x0 + w / 2, fy - 2, w, 5, 3)) continue;
    const a = Math.round(w * 0.15), b = w - a;
    for (let kk = 0; kk < w; kk++) { const ch = kk >= a && kk < b, f = fy + (ch ? 1 : 0); for (let y = fy - 4; y < f; y++) dig(x0 + kk, y); hard(x0 + kk, f); }
    const C = { cx: x0 + w / 2, cy: fy - 2, w, h: 4, band: 0, kind: 'esgoto', x0: W1(x0), fy, a, b };
    cdChambers.push(C); k++;
  }
  // ---------- 2e. as ruas: quarteirões de 60 a 90, cada um com a sua inclinação ----------
  const streetRow = (base, band) => {
    let x = (R() * WW) | 0, done = 0, f = base;
    while (done < WW - 50) {
      const qw = 60 + ((R() * 31) | 0), len = Math.min(qw, WW - done - 20), sl = 5 + ((R() * 4) | 0), hh = 6 + ((R() * 3) | 0);
      let dir = [-1, 0, 1][(R() * 3) | 0];
      if (busy(x + len / 2, f - hh / 2, len, hh, 1) || R() < 0.12) { x += len; done += len; continue; }   // um quarteirão inteiro desabou (ou outra coisa está ali)
      const floor = [];
      for (let k = 0; k < len; k++) {
        if (k > 0 && dir && k % sl === 0) { if (Math.abs(f + dir - base) > 5) dir = -dir; f += dir; }
        floor.push(f);
        for (let y = f - hh; y < f; y++) dig(x + k, y);
        hard(x + k, f);
      }
      const S = { x0: W1(x), len, floor, hh, band, tilt: dir, crack: [], rubble: [] };
      // uma rachadura no começo do quarteirão (passa-se pela tábua), um monte de entulho de fachada caída no meio
      if (R() < 0.35 && len > 20) { const c0 = 4 + ((R() * (len - 12)) | 0), cw = 2 + ((R() * 3) | 0), dp = 5 + ((R() * 5) | 0); for (let c = c0; c < c0 + cw; c++) for (let y = floor[c] + 1; y <= floor[c] + dp; y++) dig(x + c, y); S.crack = [c0, cw, dp]; }
      if (R() < 0.35 && len > 20) { const r0 = 6 + ((R() * (len - 16)) | 0); S.rubble = [r0, 4 + ((R() * 4) | 0)]; }
      cdStreets.push(S);
      cdChambers.push({ cx: x + len / 2, cy: f - (hh >> 1), w: len, h: hh, band, kind: 'rua', s: S });
      x += len; done += len;
    }
  };
  // as fileiras de rua: eram 3 por faixa, a 16 uma da outra (58, 74, 90 | 104, 120, 138); com a faixa LAYER_K vezes
  // mais alta são LAYER_K vezes mais fileiras, à mesma distância
  for (const [band, a, b] of [[1, 58, 90], [2, 104, 138]]) {
    const top = S0 + mb(CD_BANDS[band] / LAYER_K) + (a - CD_BANDS[band] / LAYER_K), bot = S0 + mb(CD_BANDS[band + 1] / LAYER_K) - (CD_BANDS[band + 1] / LAYER_K - b);
    const n = Math.max(2, Math.round((bot - top) / 16));
    for (let j = 0; j <= n; j++) streetRow(Math.round(top + (bot - top) * j / n), band);
  }
  const onStreet = (S, k0, w) => k0 >= 2 && k0 + w <= S.len - 2 && !(S.crack.length && k0 < S.crack[0] + S.crack[1] + 1 && k0 + w > S.crack[0] - 1);
  const used = new Set();
  const pickStreet = (band, w, margin) => {
    for (let t = 0; t < 60; t++) {
      const L = cdStreets.filter(s => s.band === band && s.len > w + 6); if (!L.length) return null;
      const S = L[(R() * L.length) | 0], k0 = 2 + ((R() * (S.len - w - 4)) | 0);
      if (!onStreet(S, k0, w)) continue;
      let clash = false; for (let k = k0 - margin; k < k0 + w + margin; k++) if (used.has(I(S.x0 + k, S.floor[0]))) clash = true;
      if (clash || Math.abs(wdx(S.x0 + k0 + w / 2 - cdPoco.cx)) < w / 2 + 10 || Math.abs(wdx(S.x0 + k0 + w / 2 - cdBoss.cx)) < w / 2 + 14) continue;
      for (let k = k0 - margin; k < k0 + w + margin; k++) used.add(I(S.x0 + k, S.floor[0]));
      return [S, k0];
    }
    return null;
  };
  // a boca do Poço: o chão de uma rua do Bairro passa por cima dele
  {
    const P = cdPoco, top = P.top;
    for (let x = P.x0 - 12; x <= P.x0 + 20; x++) { for (let y = top - 7; y < top; y++) dig(x, y); hard(x, top); }
    cdChambers.push({ cx: P.cx, cy: top - 3, w: 33, h: 7, band: 2, kind: 'praca', fy: top, x0: W1(P.x0 - 12) });
  }
  // o templo: 30 x 14, no chão de uma rua do Bairro; o primeiro ao lado do Poço, voltado para ele
  for (let k = 0; k < WSC * LAYER_K; k++) {
    let S = null, k0 = 0, x0, fy;
    if (k === 0) { const sd = R() < 0.5 ? -1 : 1; x0 = sd < 0 ? cdPoco.x0 - 12 - 30 : cdPoco.x0 + 21; fy = cdPoco.top; }
    else { const p = pickStreet(2, 30, 4); if (!p) continue; [S, k0] = p; x0 = S.x0 + k0; fy = S.floor[k0]; }
    for (let x = x0; x < x0 + 30; x++) { for (let y = fy - 14; y < fy; y++) { const kx = x - x0, arch = Math.round(3 * Math.pow(Math.abs((kx + 0.5) / 30 * 2 - 1), 2)); if (y >= fy - 14 + arch) dig(x, y); } hard(x, fy); }
    const C = { cx: x0 + 15, cy: fy - 7, w: 30, h: 14, band: 2, kind: 'templo', x0: W1(x0), fy, top: fy - 14, faces: Math.sign(wdx(cdPoco.cx - (x0 + 15))) || 1 };
    cdTemples.push(C); cdChambers.push(C);
  }
  // os acampamentos dos saqueadores: 20 x 10, uma rua alargada para cima
  for (let k = 0, tries = 0; k < 2 * WSC * LAYER_K && tries < 30 * WSC * LAYER_K; tries++) {
    const p = pickStreet(1, 20, 6); if (!p) continue;
    const [S, k0] = p, fy = S.floor[k0], x0 = S.x0 + k0;
    for (let x = x0; x < x0 + 20; x++) { for (let y = fy - 10; y < fy; y++) dig(x, y); }
    cdCamps.push({ x0: W1(x0), w: 20, fy, top: fy - 10, S, k0 });
    k++;
  }
  // as casas tortas das Ruas: 2 a 3 andares de 6 sobre a rua, telhado de ardósia que vira caminho
  for (let k = 0, tries = 0; k < 10 * WSC * LAYER_K && tries < 60 * WSC * LAYER_K; tries++) {
    const hw = 10 + ((R() * 7) | 0), p = pickStreet(1, hw, 2); if (!p) continue;
    const [S, k0] = p, nf = 2 + ((R() * 2) | 0), fy = S.floor[k0], top = fy - nf * 6, x0 = S.x0 + k0;
    if (top - 6 < S0 + mb(48)) continue;
    for (let x = x0; x < x0 + hw; x++) for (let y = top - 1 - Math.ceil(hw / 4) - 3; y < fy; y++) dig(x, y);
    for (let x = x0 - 2; x < x0 + hw + 2; x++) for (let y = top - 2 - Math.ceil(hw / 4) - 3; y < top - 1; y++) dig(x, y);
    cdHouses.push({ x0: W1(x0), w: hw, fy, top, nf, S, k0, cult: false, mat: R() < 0.5 ? CD_TIJOLO : CD_CANTARIA });
    k++;
  }
  // as casas do culto: 10 x 6 no Bairro, 1 andar, telhado baixo
  for (let k = 0, tries = 0; k < 6 * WSC * LAYER_K && tries < 40 * WSC * LAYER_K; tries++) {
    const p = pickStreet(2, 10, 2); if (!p) continue;
    const [S, k0] = p, fy = S.floor[k0], x0 = S.x0 + k0;
    for (let x = x0; x < x0 + 10; x++) for (let y = fy - 6; y < fy; y++) dig(x, y);
    cdHouses.push({ x0: W1(x0), w: 10, fy, top: fy - 6, nf: 1, S, k0, cult: true, mat: R() < 0.6 ? CD_CANTARIA : CD_TIJOLO });
    k++;
  }
  // os becos verticais: 3 a 5 de largura, ligam uma rua à de baixo, com escada de corda
  const becos = [];
  for (const band of [1, 2]) for (let k = 0, tries = 0; k < 5 * WSC * LAYER_K && tries < 80 * WSC * LAYER_K; tries++) {
    const L = cdStreets.filter(s => s.band === band); if (!L.length) break;
    const A = L[(R() * L.length) | 0], ka = 3 + ((R() * Math.max(1, A.len - 8)) | 0), ax = A.x0 + ka, w = 3 + ((R() * 3) | 0);
    if (!onStreet(A, ka, w)) continue;
    const fa = A.floor[ka];
    const B = cdStreets.filter(s => s !== A && s.floor[0] > fa + 6 && Math.abs(s.floor[0] - fa) < 34 && wdx(ax - s.x0) >= 2 && wdx(ax - s.x0) < s.len - w - 2).sort((a, b) => a.floor[0] - b.floor[0])[0];
    if (!B) continue;
    const fb = B.floor[wdx(ax - B.x0)];
    if (fb - fa < 10 || fb - fa > 24) continue;   // a rua logo de baixo, não duas abaixo
    let clash = false; for (let x = ax - 3; x < ax + w + 3; x++) if (used.has(I(x, A.floor[0]))) clash = true;
    if (clash || inCdPoco(W1(ax), fa + 4, 3) || Math.abs(wdx(ax - cdBoss.cx)) < 16) continue;
    for (let x = ax; x < ax + w; x++) { used.add(I(x, A.floor[0])); for (let y = fa; y < fb; y++) dig(x, y); }
    becos.push({ x0: W1(ax), w, ya: fa, yb: fb }); k++;
  }

  // ---------- 2f. o Palácio do Sino: salões de mármore e as adegas (duas são as descidas) ----------
  for (let k = 0, tries = 0; cdDown.length < 2 && tries < 600; tries++) {
    const w = 16 + ((R() * 9) | 0), cx = (R() * WW) | 0, fy = S0 + mb(168) + ((R() * mb(10)) | 0);
    if (Math.abs(wdx(cx - cdBoss.cx)) < cdBoss.w / 2 + 40 || cdDown.some(c => Math.abs(wdx(c.cx - cx)) < (tries < 400 ? 120 : 50)) || busy(cx, fy - 3, w, 6, 6) || inCdPoco(cx, fy - 3, w / 2 + 4)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, 6, 1);
    const C = { cx, cy: fy - 3, w, h: 6, band: 3, kind: 'adega', fy, x0: W1(x0), x1: W1(x0 + w - 1), down: true };
    cdDown.push(C); cdChambers.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 2 * WSC * LAYER_K && tries < 300 * LAYER_K; tries++) {
    const w = 16 + ((R() * 9) | 0), cx = (R() * WW) | 0, fy = Math.round(sp(160, 178, 3));
    if (busy(cx, fy - 3, w, 6, 4) || inCdPoco(cx, fy - 3, w / 2 + 4)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, 6, 1);
    cdChambers.push({ cx, cy: fy - 3, w, h: 6, band: 3, kind: 'adega', fy, x0: W1(x0) }); k++;
  }
  for (let k = 0, tries = 0; k < 3 * WSC * LAYER_K && tries < 400 * LAYER_K; tries++) {
    const w = 30 + ((R() * 11) | 0), h = 10 + ((R() * 3) | 0), cx = (R() * WW) | 0, fy = Math.round(sp(156, 178, 3));
    if (fy - h < S0 + CD_BANDS[3] - 2 || busy(cx, fy - h / 2, w, h, 5) || inCdPoco(cx, fy - h / 2, w / 2 + 4)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h, 2);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'palacio', fy, x0: W1(x0), top: fy - h, stair: R() < 0.5 ? -1 : 1 };
    cdPalace.push(C); cdChambers.push(C); k++;
  }

  // ---------- 2g. túneis (passagens desabadas): em volta do mundo em cada faixa e alguns entre faixas ----------
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.0 + Math.sin(n * 0.13 + s) * 0.25;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const mouth = C => C.fy ? C.fy - 2 : C.s ? C.s.floor[0] - 2 : C.cy + C.h * 0.2;
  const ends = (C, right) => right ? C.cx + C.w / 2 - 1 : C.cx - C.w / 2 + 1;
  // um túnel que desce muito vai em pernas de no máximo ~12 linhas, de um lado para o outro: nenhum trecho vira queda reta
  const zz = (xa, ya, xb, yb, r, s) => {
    const dx = wdx(xb - xa), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 12)), sw = Math.abs(dx) / n < Math.abs(dy) / n + 4;
    let px = xa, py = ya;
    for (let k = 1; k <= n; k++) { const nx = xa + dx * k / n + (sw && k < n ? (k % 2 ? 1 : -1) * (Math.abs(dy) / n + 6) : 0), ny = ya + dy * k / n; worm(px, py, nx, ny, r, s + k * 31); px = nx; py = ny; }
  };
  // cada faixa são LAYER_K andares (cada um da altura de uma faixa antiga): uma volta ao mundo por andar e alguns
  // túneis de um andar para o de baixo
  const RAD = [1.6, 1.6, 1.6, 1.8], NTR = 4 * LAYER_K;
  for (const c of cdChambers) { const b = c.band, t0 = CD_BANDS[b], h = (CD_BANDS[b + 1] - t0) / LAYER_K; c.tier = b * LAYER_K + clamp(Math.floor((mouth(c) - S0 - t0) / h), 0, LAYER_K - 1); }
  for (let t = 0; t < NTR; t++) {
    const b = (t / LAYER_K) | 0, L = cdChambers.filter(c => c.tier === t && !c.nolink).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue;
      if (A.kind === 'rua' && B.kind === 'rua' && Math.abs(wdx(B.s.x0 - (A.s.x0 + A.s.len))) < 2 && Math.abs(B.s.floor[0] - A.s.floor[A.s.len - 1]) < 2) continue;   // a rua já continua
      zz(ends(A, true), mouth(A), ends(B, false), mouth(B), RAD[b], 0x6700 + t * 50 + k);
    }
  }
  for (let t = 0; t < NTR - 1; t++) {
    const b = (t / LAYER_K) | 0, b2 = ((t + 1) / LAYER_K) | 0;
    const U = cdChambers.filter(c => c.tier === t && !c.nolink), D = cdChambers.filter(c => c.tier === t + 1 && !c.nolink);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      zz(A.cx, mouth(A), B.cx, mouth(B), Math.max(RAD[b], RAD[b2]) + 0.2, 0x67f0 + t * 9 + k);
    }
  }
  // bolsinhas fechadas; ilhas soltas no ar
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
      if (open && comp.length < 24 && !comp.some(c => seal[c] || keep[c])) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 30) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 3. a cidade de pedra: o que as salas viram ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && CD_SOILS[tiles[i]] && !cdKeep.has(i)) tiles[i] = t; };
  // as cisternas: casca de limo, chão de lodo, colunas a cada 5, parede de limo
  for (const C of cdChambers) {
    if (C.kind !== 'cisterna') continue;
    for (let y = C.top - 2; y <= C.fy + 1; y++) for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) {
      const i = I(x, y); if (SOLID[tiles[i]]) shell(x, y, y >= C.fy ? CD_LODO : CD_LIMO); else walls[i] = WCD_LIMO;
    }
    for (let x = C.x0; x < C.x0 + C.w; x++) set(x, C.fy, CD_LODO);
    if (C.ledge) {   // a borda seca do pouso
      for (let x = C.ledgeX0; x < C.ledgeX0 + 10; x++) for (let y = C.ledgeY; y <= C.fy; y++) { set(x, y, CD_CANTARIA); cdKeep.add(I(x, y)); }
    }
    for (let x = C.x0 + 2; x < C.x0 + C.w - 1; x += 5) {
      if (C.ledge && wdx(x - C.ledgeX0) >= -1 && wdx(x - C.ledgeX0) <= 10) continue;
      let y0 = C.fy - 1; while (y0 > C.top - 3 && at(x, y0 - 1) === AIR) y0--;
      if (!SOLID[at(x, y0 - 1)]) continue;
      for (let y = y0; y < C.fy; y++) if (at(x, y) === AIR) set(x, y, CD_COLUNA);
    }
  }
  // os esgotos: casca e chão de limo, o canal no meio
  for (const C of cdChambers) {
    if (C.kind !== 'esgoto') continue;
    for (let y = C.fy - 5; y <= C.fy + 2; y++) for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) { const i = I(x, y); if (SOLID[tiles[i]]) shell(x, y, CD_LIMO); else walls[i] = WCD_LIMO; }
    cdBasins.push({ x: C.x0 + (C.w >> 1), y: C.fy, nivel: C.fy, tipo: AGUA_LIMPA, max: C.w * 2 + 10, box: [C.x0 + C.a, C.x0 + C.b - 1, C.fy, C.fy] });
  }
  // o aqueduto: uma ponte de arcos de cantaria atravessando a caverna na metade da altura
  for (const C of cdChambers) {
    if (C.kind !== 'aqueduto') continue;
    const dy = Math.round(C.cy - C.h * 0.1), xl = Math.round(C.cx - C.w / 2) - 2, xr = Math.round(C.cx + C.w / 2) + 2;
    let xa = null; for (let x = xl; x <= xr; x++) if (at(x, dy) === AIR) { if (xa === null) xa = x; }
    let xb = null; for (let x = xr; x >= xl; x--) if (at(x, dy) === AIR) { if (xb === null) xb = x; }
    if (xa === null || xb - xa < 20) continue;
    C.deck = dy; C.xa = xa; C.xb = xb;
    for (let x = xa - 1; x <= xb + 1; x++) { set(x, dy, CD_CANTARIA); if (at(x, dy - 1) === AIR && ((x - xa) % 2 === 0) && (x === xa - 1 || x === xb + 1)) set(x, dy - 1, CD_CANTARIA); }
    for (let px = xa + 4; px < xb - 3; px += 10) {   // os pilares e os arcos entre eles
      for (let y = dy + 1; y < YB - 2 && at(px, y) === AIR; y++) { set(px, y, CD_CANTARIA, WCD_CANTARIA); set(px + 1, y, CD_CANTARIA, WCD_CANTARIA); }
      for (let k = 2; k < 10 && px + k < xb; k++) { const u = (k - 1) / 9, d = Math.round(3 * (1 - Math.sqrt(1 - Math.pow(2 * u - 1, 2)))); for (let y = dy + 1; y <= dy + d; y++) if (at(px + k, y) === AIR) set(px + k, y, CD_CANTARIA); }
    }
  }
  // as ruas: calçamento no chão, fachadas de cantaria e tijolo na parede de fundo, a tábua na rachadura, o entulho
  for (const S of cdStreets) {
    let face = 0, fw = 0, fmat = WCD_CANTARIA;
    for (let k = 0; k < S.len; k++) {
      const x = S.x0 + k, f = S.floor[k];
      if (fw-- <= 0) { fw = 8 + ((R() * 8) | 0); fmat = [WCD_CANTARIA, WCD_TIJOLO, WCD_TIJOLO, WCD_MADEIRA][(R() * 4) | 0]; face++; }
      for (let y = f - S.hh; y < f; y++) { const i = I(x, y); if (tiles[i] === AIR) walls[i] = fmat; }
      if (!cdKeep.has(I(x, f))) set(x, f, CD_CALCAMENTO);
      // o teto da rua: a fileira de cima vira fundação de casa (cantaria ou tijolo)
      const c = f - S.hh - 1; if (SOLID[at(x, c)] && CD_SOILS[at(x, c)] && !cdKeep.has(I(x, c))) set(x, c, fmat === WCD_CANTARIA ? CD_CANTARIA : CD_TIJOLO);
    }
    if (S.crack.length) { const [c0, cw] = S.crack; for (let c = c0; c < c0 + cw; c++) set(S.x0 + c, S.floor[c], CD_MADEIRAME); for (let c = c0; c < c0 + cw; c++) for (let y = S.floor[c] + 1; y < S.floor[c] + S.crack[2]; y++) if (at(S.x0 + c, y) === AIR) walls[I(S.x0 + c, y)] = WCD_TIJOLO; }
    if (S.rubble.length) { const [r0, rw] = S.rubble; for (let c = r0; c < r0 + rw && c < S.len; c++) { const hgt = c === r0 || c === r0 + rw - 1 ? 1 : 2; for (let y = S.floor[c] - hgt; y < S.floor[c]; y++) if (at(S.x0 + c, y) === AIR) set(S.x0 + c, y, CD_ENTULHO); } }
  }
  // a praça do Poço: calçamento, parede de cantaria
  { const P = cdPoco; for (let x = P.x0 - 12; x <= P.x0 + 20; x++) { if (!inCdPoco(W1(x), P.top)) set(x, P.top, CD_CALCAMENTO); for (let y = P.top - 7; y < P.top; y++) if (at(x, y) === AIR) walls[I(x, y)] = WCD_CANTARIA; } }
  // o Grande Poço: paredes de pedra do Poço (2 de grossura), um lábio em cada beira, a tampa e a rocha-mãe por baixo,
  // uma corrente do lábio até a tampa (dá para descer: decisão do Jonathan) e correntes curtas com oferendas
  {
    const P = cdPoco, x0 = P.x0;
    for (let y = P.top; y <= P.bot + 3; y++) for (let x = x0 - 2; x <= x0 + 10; x++) {
      const i = I(x, y), inner = x >= x0 && x <= x0 + 8 && y < P.bot;
      if (inner) { tiles[i] = AIR; walls[i] = WCD_LIMO; }
      else tiles[i] = y >= P.bot + 2 ? BEDROCK : CD_PEDRA_POCO;
      cdKeep.add(i);
    }
    for (const x of [x0, x0 + 8]) set(x, P.top, CD_PEDRA_POCO);   // o lábio
    for (const x of [x0 - 2, x0 - 1, x0 + 9, x0 + 10]) set(x, P.top - 1, CD_PEDRA_POCO);   // o parapeito baixo
    for (let y = P.top + 1; y < P.bot; y++) set(x0, y, CD_CORRENTE);
    for (let y = P.top + 1; y < P.top + 7; y++) set(x0 + 8, y, CD_CORRENTE);
    // anéis de pedra quebrados a cada 10, um de cada lado (nunca na coluna da corrente): quem cai no Poço cai aos poucos
    for (let y = P.top + 12, k = 0; y < P.bot - 4; y += 10, k++) for (let x = k % 2 ? x0 + 4 : x0 + 1; x <= (k % 2 ? x0 + 8 : x0 + 4); x++) set(x, y, CD_PEDRA_POCO);
    for (let x = x0 - 10; x <= x0 + 18; x++) { if (x >= x0 - 2 && x <= x0 + 10) continue; if (at(x, P.top - 1) === AIR && SOLID[at(x, P.top)] && hash2(W1(x), P.top, seed) < 0.3) set(x, P.top - 1, CD_OFERENDA); }
    for (let y = P.top - 8; y <= P.top; y++) for (let x = x0 - 12; x <= x0 + 20; x++) cdKeep.add(I(x, y));
  }
  // as casas: casca, andares de madeirame com escada de corda, telhado de ardósia em duas águas, e um alçapão no telhado
  for (const H of cdHouses) {
    const x0 = H.x0, w = H.w, fy = H.fy, top = H.top, rh = H.cult ? Math.ceil(w / 5) : Math.ceil(w / 4), lx = x0 + (H.cult ? 0 : (hash2(x0, fy, seed) < 0.5 ? 1 : w - 2));
    const S = H.S, gh = S.hh;   // o térreo é a própria rua
    for (let x = x0; x < x0 + w; x++) {
      for (let y = top - rh - 1; y < fy; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || y < fy - gh) { if (y >= top - rh) tiles[i] = AIR; walls[i] = WCD_MADEIRA; } }
      set(x, fy, CD_MADEIRAME);
    }
    for (const x of [x0 - 1, x0 + w]) for (let y = top - 1; y < (H.cult ? fy - 4 : fy - gh); y++) set(x, y, H.mat);   // as paredes de fora (no térreo a rua passa)
    for (let j = 1; j < H.nf; j++) for (let x = x0; x < x0 + w; x++) if (x !== lx) set(x, fy - 6 * j, CD_MADEIRAME);
    // o telhado: duas águas de ardósia sobre o sótão
    for (let k = -1; k <= w; k++) { const r = Math.min(rh, Math.floor(Math.min(k + 1, w - k) / 2)); set(x0 + k, top - 1 - r, CD_TELHA); for (let y = top - r; y < top; y++) if (k >= 0 && k < w) { const i = I(x0 + k, y); tiles[i] = AIR; walls[i] = WCD_MADEIRA; } }
    if (!H.cult) {
      const roofY = top - 1 - Math.min(rh, Math.floor(Math.min(lx - x0 + 1, w - (lx - x0)) / 2));
      for (let y = roofY; y < fy; y++) if (!SOLID[at(lx, y)] || at(lx, y) === CD_TELHA || at(lx, y) === CD_MADEIRAME) set(lx, y, CD_ESCADA);
    } else {
      for (let x = x0 + 1; x < x0 + w - 1; x += 3) if (at(x, fy - 1) === AIR) set(x, fy - 1, CD_VELAS);
    }
  }
  // os acampamentos: lanternas penduradas, trouxas no chão
  for (const Cp of cdCamps) {
    const x0 = Cp.x0;
    for (let x = x0; x < x0 + Cp.w; x++) { for (let y = Cp.top; y < Cp.fy; y++) { const i = I(x, y); if (tiles[i] === AIR) walls[i] = WCD_MADEIRA; } }
    for (const k of [4, 15]) { let y = Cp.top; while (y < Cp.fy - 3 && at(x0 + k, y) === AIR && !SOLID[at(x0 + k, y - 1)]) y--; if (SOLID[at(x0 + k, y - 1)] && at(x0 + k, y) === AIR) set(x0 + k, y, CD_LANTERNA); }
    for (const k of [2, 9, 17]) { const f = Cp.S.floor[Cp.k0 + k]; if (at(x0 + k, f - 1) === AIR && SOLID[at(x0 + k, f)]) set(x0 + k, f - 1, CD_TROUXA); }
  }
  // os templos: casca de cantaria, chão de cantaria, velas em fila, sininhos no teto
  for (const C of cdTemples) {
    for (let y = C.top - 2; y <= C.fy + 1; y++) for (let x = C.x0 - 2; x < C.x0 + 32; x++) { const i = I(x, y); if (SOLID[tiles[i]]) shell(x, y, CD_CANTARIA); else walls[i] = WCD_CANTARIA; }
    for (let x = C.x0; x < C.x0 + 30; x++) set(x, C.fy, CD_CANTARIA);
    for (let x = C.x0 + 2; x < C.x0 + 28; x += 4) if (at(x, C.fy - 1) === AIR) set(x, C.fy - 1, CD_VELAS);
    for (let x = C.x0 + 4; x < C.x0 + 27; x += 6) { let y = C.top; while (y < C.fy - 6 && SOLID[at(x, y)]) y++; if (SOLID[at(x, y - 1)] && at(x, y) === AIR) set(x, y, CD_SININHOS); }
  }
  // o Palácio: casca e chão de mármore, uma escadaria até um mezanino, colunas
  for (const C of cdPalace) {
    for (let y = C.top - 2; y <= C.fy + 1; y++) for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) { const i = I(x, y); if (SOLID[tiles[i]]) shell(x, y, CD_MARMORE); else walls[i] = WCD_MARMORE; }
    for (let x = C.x0; x < C.x0 + C.w; x++) set(x, C.fy, CD_MARMORE);
    const s = C.stair, xs = s < 0 ? C.x0 : C.x0 + C.w - 1;
    for (let k = 0; k < 9; k++) { const x = xs - s * k, hgt = Math.min(4, 9 - k); if (k >= 5) { set(x, C.fy - 4, CD_MARMORE); continue; } for (let y = C.fy - hgt; y < C.fy; y++) set(x, y, CD_MARMORE); }
    for (let x = C.x0 + 11; x < C.x0 + C.w - 10; x += 6) { let y = C.fy - 1; while (y > C.top - 3 && at(x, y - 1) === AIR) y--; if (SOLID[at(x, y - 1)]) for (let yy = y; yy < C.fy; yy++) if (at(x, yy) === AIR) set(x, yy, CD_COLUNA); }
  }
  // as adegas: abóbada de tijolo, chão de calçamento
  for (const C of cdChambers) {
    if (C.kind !== 'adega') continue;
    for (let y = C.fy - 8; y <= C.fy + 1; y++) for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) { const i = I(x, y); if (SOLID[tiles[i]]) shell(x, y, CD_TIJOLO); else walls[i] = WCD_TIJOLO; }
    for (let x = C.x0; x < C.x0 + C.w; x++) set(x, C.fy, CD_CALCAMENTO);
  }
  // a Torre do Sino: casca de mármore de 2, por dentro vazia (o 137 põe os andares, o sino e a água); a ponte de telha
  {
    const B = cdBoss;
    for (let y = B.top - 2; y <= B.fy + 1; y++) for (let x = B.x0 - 2; x <= B.x0 + B.w + 1; x++) {
      const i = I(x, y), inner = x >= B.x0 && x < B.x0 + B.w && y >= B.top && y < B.fy;
      if (inner) { tiles[i] = AIR; walls[i] = WCD_MARMORE; } else if (SOLID[tiles[i]] || y === B.fy || y < B.top) tiles[i] = CD_MARMORE;
      cdKeep.add(i);
    }
    for (const O of [B.bridge, B.door]) for (let k = 0; k < 2; k++) for (let y = O.fy - 4; y < O.fy; y++) { const i = I(O.x + O.side * k, y); tiles[i] = AIR; walls[i] = WCD_MARMORE; cdKeep.add(i); }
    for (const C of cdChambers) if (C.kind === 'ponte' || C.kind === 'porta') for (let k = -2; k < C.len + 2; k++) { const x = C.x0 + k, i = I(x, C.fy); if (!cdKeep.has(i)) tiles[i] = C.kind === 'ponte' ? CD_TELHA : CD_MARMORE; for (let y = C.fy - 4; y < C.fy; y++) if (tiles[I(x, y)] === AIR) walls[I(x, y)] = C.kind === 'ponte' ? WCD_TIJOLO : WCD_MARMORE; }
  }
  // ---------- as entradas: o cordão de micélio no meio do furo, a escada de corda dos saqueadores ao lado; o pouso ----------
  for (const E of cdEntries) {
    const x0 = E.x0, L = E.ledge;
    for (let y = E.fy; y < L; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); if (y < S0 - 1 || !inCdHallRow(E.C, y)) { tiles[i] = AIR; walls[i] = y < S0 ? cdUpW() : WCD_LIMO; } }
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y < E.C.top) { if (!SOLID[tiles[i]]) tiles[i] = y < S0 ? cdUpT(0) : CD_LIMO; cdKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = cdUpRope(); cdKeep.add(i); } }
    for (let y = E.fy + 1; y < L; y++) { const i = I(x0 + 2, y); if (!SOLID[tiles[i]]) { tiles[i] = CD_ESCADA; cdKeep.add(i); } }
    for (let y = E.fy - 3; y < E.C.top + 1; y++) for (let x = x0; x < x0 + 4; x++) cdKeep.add(I(x, y));
    for (let y = E.fy + 9; y < E.C.top - 3; y += 10) for (const x of [x0, x0 + 3]) set(x, y, y < S0 ? cdUpT(0) : CD_LIMO);   // um degrau a cada dez: só o cordão e a escada passam
    // o pouso: cantaria seca, parede de cantaria, uma lanterna acesa no teto
    const Ld = E.land;
    for (let y = Ld.fy - Ld.h - 1; y <= Ld.fy; y++) for (let x = Ld.x0 - 1; x <= Ld.x0 + Ld.w; x++) {
      const i = I(x, y), edge = y === Ld.fy - Ld.h - 1 || y === Ld.fy || x === Ld.x0 - 1 || x === Ld.x0 + Ld.w;
      if (W1(x) === Ld.door && y >= Ld.fy - 3 && y < Ld.fy) { tiles[i] = AIR; walls[i] = WCD_CANTARIA; }
      else if (edge) tiles[i] = CD_CANTARIA; else { tiles[i] = AIR; walls[i] = WCD_CANTARIA; }
      cdKeep.add(i);
    }
    tiles[I(Ld.x0 + 6, Ld.fy - Ld.h)] = CD_LANTERNA;
    // a escada de corda também desce da borda até o fundo da cisterna (do lodo dá para subir de volta)
    const sx = E.C.ledge < 0 ? E.C.ledgeX0 + 10 : E.C.ledgeX0 - 1;
    for (let y = L - 1; y < E.C.fy; y++) if (at(sx, y) === AIR) set(sx, y, CD_ESCADA);
  }
  function inCdHallRow(C, y) { return y >= C.top && y < C.fy; }
  // os becos: a escada de corda numa das beiras
  for (const Bc of becos) { const lx = Bc.x0 + (hash2(Bc.x0, Bc.ya, seed) < 0.5 ? 0 : Bc.w - 1); for (let y = Bc.ya - 2; y < Bc.yb; y++) { const t = at(lx, y); if (t === AIR || t === CD_CALCAMENTO) set(lx, y, CD_ESCADA); } for (let x = Bc.x0; x < Bc.x0 + Bc.w; x++) for (let y = Bc.ya; y < Bc.yb; y++) if (at(x, y) === AIR) walls[I(x, y)] = WCD_TIJOLO;
    for (let y = Bc.ya + 8; y < Bc.yb - 4; y += 8) for (let x = Bc.x0; x < Bc.x0 + Bc.w; x++) if (W1(x) !== W1(lx) && at(x, y) === AIR) { set(x, y, CD_MADEIRAME); cdKeep.add(I(x, y)); }   // um patamar de madeira a cada 8: só a escada passa
  }

  // ---------- 4. os veios ----------
  const R4 = mulberry32(seed ^ 0x0de6);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !cdKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(CD_O_CARVAO, 80 * WSC * LAYER_K, 0, 180, 3, 8, t => t === CD_ATERRO);
  vein(CD_O_PRATA, 70 * WSC * LAYER_K, 0, 150, 2, 5, t => t === CD_ATERRO || t === CD_LIMO);
  vein(CD_O_PRATA, 40 * WSC * LAYER_K, 150, 186, 4, 8, t => t === CD_ATERRO || t === CD_MARMORE);
}

function cdAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = CD_S0, YB = Math.min(WH - 8, S0 + CD_D), R3 = mulberry32(seed ^ 0x6d3c1);
  const cdRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!cdRow(y)) return; const i = I(x, y); if (cdKeep.has(i) || inCdHall(W1(x), y, 2)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WCD_TIJOLO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const zz = (xa, ya, xb, yb, r, s) => {   // em pernas de ~12 linhas, de um lado para o outro (como no cdBuild)
    const dx = wdx(xb - xa), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 12)), sw = Math.abs(dx) / n < Math.abs(dy) / n + 4;
    let px = xa, py = ya;
    for (let k = 1; k <= n; k++) { const nx = xa + dx * k / n + (sw && k < n ? (k % 2 ? 1 : -1) * (Math.abs(dy) / n + 6) : 0), ny = ya + dy * k / n; worm(px, py, nx, ny, r, s + k * 31); px = nx; py = ny; }
  };
  const cdSolid = t => SOLID[t] && CD_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };

  // ---------- 0. a água negra das cisternas: fundo de lodo, a bacia tapada, a passarela de pedra ----------
  for (const C of cdChambers) {
    if (C.kind !== 'cisterna') continue;
    const depth = 3 + ((R3() * 4) | 0), nivel = C.fy - depth;
    let sx = -1; for (let k = 0; k < C.w && sx < 0; k++) { const x = C.ledge < 0 ? C.x0 + C.w - 2 - k : C.x0 + 1 + k; if (at(x, C.fy - 1) === AIR || at(x, C.fy - 1) === CD_COLUNA) sx = x; }
    if (sx < 0) continue;
    C.basin = { box: [C.x0 - 1, C.x0 + C.w, nivel, C.fy], x: sx, y: C.fy - 1, nivel, tipo: AGUA_LIMPA, max: C.w * (depth + 2) * 2 };
    cdBasins.push(C.basin);
    cdPlug(C.basin);
    // a passarela: cantaria logo acima da água, de parede a parede, com uma falha a cada tanto
    if (R3() < 0.8 || C.ledge) for (let x = C.x0, n = 0; x < C.x0 + C.w; x++, n++) {
      const t = at(x, nivel - 1); if ((t !== AIR && t !== CD_COLUNA) || cdKeep.has(I(x, nivel - 1))) continue;
      if (n % 13 >= 11) continue;
      put(x, nivel - 1, CD_CANTARIA);
    }
  }
  for (const B of cdBasins) if (B.box && !B.plugged) cdPlug(B);

  // ---------- 1. tudo alcançável das duas entradas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  // das entradas: a coluna inteira até a borda do salão de chegada (a boca de cima pode ainda estar fechada)
  for (const E of cdEntries) for (let y = E.fy - 1; y <= (E.ledge || E.fy); y++) for (let x = E.x0; x < E.x0 + 4; x++) flood(I(x, y));
  if (!cdEntries.length) flood(I(cdChambers[0].cx, mouthOf(cdChambers[0])));
  if (cdBoss) for (let y = cdBoss.top; y < cdBoss.fy; y++) for (let k = 0; k < cdBoss.w; k++) reach[I(cdBoss.x0 + k, y)] = 1;   // a torre: o 137 cuida
  // as bolsas isoladas, rotuladas uma vez só (a camada é três vezes mais alta), da maior para a menor
  const comps = []; let orgB = null;
  {
    const o = S0 * WW, lab = new Uint8Array((YB - S0) * WW);
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i - o] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i - o] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= o && nb < YB * WW && !lab[nb - o] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb - o] = 1; stack.push(nb); } }
      if (comp.length >= 20) comps.push(comp);
    }
    comps.sort((a, b) => b.length - a.length);
  }
  for (let pass = 0; pass < comps.length; pass++) {
    const bestC = comps[pass]; if (bestC.some(c => reach[c])) continue;   // um túnel de antes já chegou
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inCdHall(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (best) { zz(best[0], best[1], best[2], best[3], 1.6, 0x66a0 + pass); flood(I(best[2], best[3]), true); }
    if (!reach[bestC[0]]) {   // longe demais, ou a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = orgB || (orgB = new Int32Array(NN).fill(-1)), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || cdKeep.has(nb) || cdKeep.has(nb - WW) || tiles[nb] === BEDROCK || inCdHall(nb % WW, (nb / WW) | 0, 2)) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      // o corredor; onde ele sobe ou desce reto, uma escada de corda na coluna (um poço de 1 sem nada seria uma queda)
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0, p = org[c], vert = p >= 0 && p % WW === x; dig(x, y); dig(x, y - 1); if (vert) for (const yy of [y, y - 1]) { const i = I(x, yy); if (tiles[i] === AIR && cdRow(yy)) tiles[i] = CD_ESCADA; } }
      for (const c of q) org[c] = -1; if (hit >= 0) org[hit] = -1;
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }
  function mouthOf(C) { return Math.round(C.fy ? C.fy - 2 : C.cy); }

  // ---------- 1b. vigas de madeirame caídas atravessadas onde um vão ainda cai 22 ou mais (84: layerShelves) ----------
  layerShelves(S0 + 2, YB - 2, CD_MADEIRAME, (x, y, i) => cdKeep.has(i) || inCdHall(x, y, 3) || inCdPoco(x, y, 2));

  // ---------- 2. uma escada de corda (corrente nas Cisternas) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inCdHall(x, y, 3) || inCdPoco(x, y, 1)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || CD_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (cdKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const lt = cidadeBand(y) === 0 ? CD_CORRENTE : CD_ESCADA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = lt; used.add(i); }
      }
    }
  }
  // a água agora (a decoração da beira precisa dela); o 139 enche de novo no fim, depois do 87
  cdWater();

  // ---------- 3. a decoração ----------
  const pocoD = (x, y) => cdPoco ? Math.hypot(wdx(x - cdPoco.cx), y - cdPoco.top) : 1e9;
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || cdKeep.has(i)) continue;
    const b = cidadeBand(y); if (b < 0 || b > 3 || inCdHall(x, y, 2) || inCdPoco(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3(), wet = agua.length && agua[i];
    const floor = cdSolid(dn) && BLOCKY[dn] && up === AIR, ceil = cdSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil && !wet) {
      if (b === 0) { if (q < 0.03) put(x, y, CD_GOTEIRA); else if (q < 0.07) { for (let j = 0, n = 1 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR && !aguaAt(x, y + j + 1); j++) put(x, y + j, CD_ALGA); } }
      else if (b === 1) { if (q < 0.025) put(x, y, CD_GOTEIRA); else if (q < 0.032 && walls[i] !== WCD_LIMO) put(x, y, CD_PLACA); }
      else if (b === 2) { if (q < 0.02) put(x, y, CD_GOTEIRA); else if (q < 0.035) put(x, y, CD_SININHOS); }
      else { if (q < 0.03) put(x, y, CD_GOTEIRA); }
      continue;
    }
    if (!floor) continue;
    if (b === 0) { if (q < 0.03) put(x, y, CD_OSSOS); }
    else if (b === 1) { if (q < 0.006) put(x, y, CD_TROUXA); else if (q < 0.012) put(x, y, CD_OSSOS); }
    else if (b === 2) { if (q < (pocoD(x, y) < 24 ? 0.12 : 0.02) && !wet) put(x, y, CD_VELAS); else if (q < 0.03 + (pocoD(x, y) < 24 ? 0.1 : 0)) put(x, y, CD_OFERENDA); }
    else { if (q < 0.012) put(x, y, CD_OSSOS); }
  }

  // ---------- 4. os objetos ----------
  cdPlaceProps();
}

/* ---------- a água: enche as bacias; se uma vazou, tenta um nível mais baixo ---------- */
function cdWater() {
  if (!agua.length) return;
  const W1 = x => ((x % WW) + WW) % WW;
  for (const B of cdBasins) {
    if (B.cells) for (const c of B.cells) if (agua[c] === B.tipo) agua[c] = AGUA_SECO;
    B.cells = null;
    for (let nv = B.nivel; nv <= B.y; nv++) {
      const n = aguaBasin(B.x, B.y, nv, B.tipo, B.max);
      if (n > 0) { const cells = []; const st = [B.y * WW + W1(B.x)]; const seen = new Set(st); while (st.length) { const c = st.pop(); if (agua[c] !== B.tipo) continue; cells.push(c); const x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (!seen.has(nb) && nb >= 0 && nb < WW * WH) { seen.add(nb); st.push(nb); } } B.cells = cells; break; }
    }
  }
  for (const B of cdBasins) if (B.cells) for (const c of B.cells) { const t = tiles[c]; if (t === TORCH || t === CD_LANTERNA || t === CD_VELAS || t === CD_TROUXA || t === CD_OFERENDA) tiles[c] = AIR; }
}
function cdPlug(B) {
  const W1 = x => ((x % WW) + WW) % WW, [x0, x1, y0, y1] = B.box, inBox = (x, y) => wdx(x - x0) >= 0 && wdx(x - x0) <= wdx(x1 - x0) && y >= y0 && y <= y1;
  B.plugged = true;
  const s0 = B.y * WW + W1(B.x); if (SOLID[tiles[s0]]) return;
  const seen = new Set([s0]), st = [s0];
  while (st.length) {
    const c = st.pop(), x = c % WW, row = c - x;
    for (const nb of [row + W1(x - 1), row + W1(x + 1), c + WW, c - WW]) {
      if (seen.has(nb)) continue;
      const nx = nb % WW, ny = (nb / WW) | 0; if (ny < y0) continue;
      seen.add(nb);
      if (SOLID[tiles[nb]]) { cdKeep.add(nb); continue; }
      if (inBox(nx, ny)) st.push(nb);
      else if (!cdKeep.has(nb)) { tiles[nb] = CD_LODO; if (!walls[nb]) walls[nb] = WCD_LIMO; cdKeep.add(nb); }
    }
  }
}
/* ---------- as bocas das entradas por último, e o que ficou de tábua, telha ou entulho tapando o único caminho sai ---------- */
function cdExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of cdEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? cdUpRope() : AIR; cdKeep.add(i); }
  const reach = new Uint8Array(WW * WH), st = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; st.push(s0); while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < WW * WH && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; st.push(nb); } } };
  for (const E of cdEntries) flood(I(E.x0 + 2, E.fy - 1));
  if (cdBoss) for (let y = cdBoss.top; y < cdBoss.fy; y++) for (let k = 0; k < cdBoss.w; k++) reach[I(cdBoss.x0 + k, y)] = 1;
  const Y1 = Math.min(WH - 8, CD_S0 + CD_D);
  for (let sweep = 0, changed = true; changed && sweep < 50; sweep++) {
    changed = false;
    for (let i = CD_S0 * WW; i < Y1 * WW; i++) {
      const t = tiles[i]; if ((t !== CD_MADEIRAME && t !== CD_TELHA && t !== CD_ENTULHO && t !== CD_TIJOLO && t !== CD_CANTARIA) || cdKeep.has(i)) continue;
      const x = i % WW, row = i - x, nb = [i - WW, i + WW, row + W1(x - 1), row + W1(x + 1)];
      if (nb.some(j => reach[j]) && nb.some(j => !reach[j] && !SOLID[tiles[j]] && !inCdHall(j % WW, (j / WW) | 0))) { tiles[i] = AIR; flood(i); changed = true; }
    }
  }
}
/* ---------- a subida garantida: da porta da torre, dos acampamentos, dos templos, dos salões do palácio e das adegas
   o herói tem de conseguir voltar às entradas (pulo de 3 blocos, escadas, correntes e cordões sobem) ---------- */
function cdClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = CD_S0, YB = Math.min(WH - 8, S0 + CD_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => CD_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  // a torre (inCdHall) em colunas, uma vez: chamar o inCdHall a cada passo da busca pesava
  const hallX = new Uint8Array(WW), hT = cdBoss ? cdBoss.top : 1e9, hB = cdBoss ? cdBoss.fy : -1; for (let x = 0; x < WW; x++) hallX[x] = inCdHall(x, hT) ? 1 : 0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || (y >= hT && y <= hB && hallX[x])) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1) || aguaAt(x, y)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1)) y++; push(sx, y, 4);
    while (q.length) {
      if (hit >= 0) return win(hit);
      const r = q.pop(), yy = q.pop(), x = q.pop(); cur = ((yy - Y0) * WW + x) * 5 + r; if (yy <= S0 - 3) return win(cur);
      const gr = S(x, yy + 1) || L(x, yy) || aguaAt(x, yy);
      push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
      if (r > 0) push(x, yy - 1, L(x, yy) || L(x, yy - 1) || aguaAt(x, yy - 1) ? 4 : r === 4 ? 3 : r - 1);
      if (!S(x, yy + 1)) push(x, yy + 1, L(x, yy + 1) ? 4 : 0);
    }
    return hit >= 0 ? win(hit) : false;
  };
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || cdKeep.has(I(x, y))) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if ((tt === CD_MADEIRAME || tt === CD_TELHA || tt === CD_CANTARIA) && !cdKeep.has(I(x, t)) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best, lt = cidadeBand(bot) === 0 ? CD_CORRENTE : CD_ESCADA;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || tiles[i] === CD_MADEIRAME || tiles[i] === CD_TELHA || tiles[i] === CD_CANTARIA) tiles[i] = lt; }
    return true;
  };
  const starts = [];
  if (cdBoss) { starts.push([cdBoss.door.x + cdBoss.door.side * 4, cdBoss.door.fy - 1]); starts.push([cdBoss.bridge.x + cdBoss.bridge.side * 6, cdBoss.bridge.fy - 1]); }
  for (const c of cdChambers) if (c.kind === 'palacio' || c.kind === 'adega' || c.kind === 'templo') starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of cdCamps) starts.push([c.x0 + 10, c.fy - 1]);
  if (cdPoco) starts.push([cdPoco.x0 + 4, cdPoco.bot - 1]);
  let fixes = 0;
  // um começo dentro do que uma busca que falhou já percorreu falha igual (tudo o que ele alcança, ela alcançou):
  // pula, até uma escada mudar alguma coisa (os começos são LAYER_K vezes mais agora)
  const dead = new Uint8Array(WW * H);
  for (const [x0, y0] of starts) {
    const x = W1(x0); let y = y0; while (y < YB - 1 && !S(x, y + 1)) y++;
    if (y > Y0 && y < YB && dead[(y - Y0) * WW + x]) continue;
    for (let k = 0; k < 12 && !search(x, y0); k++) { if (!repair()) { for (let i = 0; i < any.length; i++) if (any[i]) dead[i] = 1; break; } fixes++; dead.fill(0); }
  }
  return fixes;
}

/* ---------- os objetos (132): os dos acampamentos e dos templos primeiro, depois no chão, debaixo do teto e na parede, pela faixa ---------- */
function cdPlaceProps() {
  if (typeof CD_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b2c7);
  const S0 = CD_S0, YB = Math.min(WH - 8, S0 + CD_D), used = new Uint8Array(WW * WH * 2), BF = typeof CD_BACK_FLOOR !== 'undefined' ? CD_BACK_FLOOR : {};
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir, dry) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || cdKeep.has(i) || (dry && wet(i))) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && CD_SOILS[t]; };
  const special = def => def.templo;   // os bancos e o altar só vão no templo (abaixo)
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  const floorProp = (id, x0, fy, layer = 0, v0) => {
    const def = PROP_DEFS[id]; if (!def) return false;
    const v = v0 !== undefined ? v0 : (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    for (let dx = 0; dx < 4; dx++) for (const s of [1, -1]) {
      const px = x0 + dx * s; let ok = true; for (let k = px; k < px + tw; k++) if (!soil(k, fy)) ok = false;
      if (!ok || !fits(px, fy - th, tw, th, layer, layer === 0, !def.beira)) continue;
      mark(px, fy - th, tw, th, layer);
      const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, fy));
      addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), fy * T - V.h, sup);
      return true;
    }
    return false;
  };
  // os lugares próprios: a fogueira e a barricada nos acampamentos; os bancos virados para o altar no templo; oferendas na praça do Poço
  for (const Cp of cdCamps) { floorProp('cd_fogueira', Cp.x0 + 9, Cp.S.floor[Cp.k0 + 9]); floorProp('cd_barricada', Cp.x0 + 1, Cp.S.floor[Cp.k0 + 1]); floorProp('cd_barricada', Cp.x0 + 16, Cp.S.floor[Cp.k0 + 16]); }
  for (const C of cdTemples) {
    const f = C.faces, alt = f > 0 ? C.x0 + 25 : C.x0 + 2;
    floorProp('cd_altar', alt, C.fy);
    for (let k = 0; k < 4; k++) floorProp('cd_bancos', f > 0 ? C.x0 + 3 + k * 5 : C.x0 + 23 - k * 5, C.fy, 0, R() < 0.25 ? 1 : 0);
    floorProp('cd_portao', f > 0 ? C.x0 + 2 : C.x0 + 22, C.fy, 1);
  }
  if (cdPoco) { floorProp('cd_oferendas', cdPoco.x0 - 7, cdPoco.top); floorProp('cd_oferendas', cdPoco.x0 + 14, cdPoco.top); }
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = CD_BAND_NAMES[clamp(cidadeBand(y), 0, 3)], plan = CD_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inCdHall(W1(k), y, 2) || inCdPoco(W1(k), y, 2)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def || special(def)) continue;
          if (def.rua && kind === 'chao' && tiles[I(x0, y + 1)] !== CD_CALCAMENTO) continue;   // o poço de rua: só no calçamento
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (def.rua) { let ok = true; for (let k = px; k < px + tw; k++) if (tiles[I(k, y + 1)] !== CD_CALCAMENTO) ok = false; if (!ok) continue; }
            if (def.janela) { const w = walls[I(px, y)]; if (w !== WCD_MADEIRA && w !== WCD_MARMORE && w !== WCD_CANTARIA && w !== WCD_TIJOLO) continue; }
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true, !def.beira)) continue;
              if (def.beira) { let w = false; for (let k = px - 2; k < px + tw + 2; k++) if (aguaAt(k, y) || aguaAt(k, y + 1)) w = true; if (!w) continue; }
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : def.janela ? y - 1 - th : y - th - ((R() * 2) | 0);
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

// a ordem: a camada, a torre do chefe (137: cdDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('cidade', () => {
  if (!CIDADE) return;
  try { cdBuild(); cdAfter(); if (typeof cdDress === 'function') cdDress(); cdExitClear(); cdClimbFix(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada atrás da cidade ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!CIDADE) return;
  const Y1 = Math.min(WH, CD_S0 + CD_D + 4);
  for (let y = Math.max(CD_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - CD_S0) + (depthNz(x, y, 25, seed ^ 0x6e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x6e12);
    DEEPT[i] = d < CD_BANDS[1] ? (n > 0.5 ? DP_CD_ARCOS : DP_CD_ATERRO) : d < CD_BANDS[3] ? (n > 0.42 ? DP_CD_CASAS : DP_CD_ATERRO) : (n > 0.55 ? DP_CD_ARCOS : n > 0.35 ? DP_CD_CASAS : DP_CD_ATERRO);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (CIDADE && ty >= CD_S0 && ty < CD_S0 + CD_D) return CD_ZONE0 + clamp(cidadeBand(ty), 0, 3); return _cz(tx, ty); }; }
// a procissão dos noviços conta como 1 (o líder) no máximo; o afogado só nasce na água ou a até 4 blocos dela
Object.assign(CATH_SPAWN, {
  [CD_ZONE0]: [[['afogado', 0.3], ['boiante', 0.25], ['saqueador', 0.25], ['armadilheiro', 0.2]], 7],
  [CD_ZONE0 + 1]: [[['saqueador', 0.25], ['besteiro', 0.2], ['telhadeiro', 0.2], ['armadilheiro', 0.2], ['afogado', 0.15]], 8],
  [CD_ZONE0 + 2]: [[['novicos', 0.25], ['pregador', 0.15], ['emparedador', 0.2], ['penitente', 0.2], ['boiante', 0.2]], 8],
  [CD_ZONE0 + 3]: [[['saqueador', 0.2], ['telhadeiro', 0.15], ['pregador', 0.15], ['penitente', 0.15], ['emparedador', 0.15], ['afogado', 0.2]], 8]
});
const CD_NO_SPAWN = (tx, ty) => cdLand.some(L => wdx(tx - L.x0) >= -3 && wdx(tx - L.x0) < L.w + 3 && ty > L.fy - L.h - 3 && ty <= L.fy) || inCdHall(tx, ty, 2) || inCdPoco(tx, ty, 0);
const cdNearWater = (tx, ty, r) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -r; dx <= r; dx++) if (aguaAt(tx + dx, ty + dy)) return true; return false; };
{ const _ts = trySpawn; trySpawn = function () {
  if (!CIDADE || !pl) return _ts();
  const fol = enemies.filter(e => e.cdFollower || e.cdPar); if (!fol.length) return _ts();
  for (const e of fol) enemies.splice(enemies.indexOf(e), 1);
  try { return _ts(); } finally { for (const e of fol) enemies.push(e); }
}; }
// níveis 13 e 14 (layerLvl no 52, a posição no 129); nada nasce no pouso, na torre nem dentro do Poço
let cdPairing = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!CIDADE || e.boss || D.boss || e.cdMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - CD_S0;
  if (d >= 0 && d < CD_D) {
    if (zone >= CD_ZONE0 && zone <= CD_ZONE0 + 3 && (CD_NO_SPAWN(tx, ty - 1) || (type === 'afogado' && !cdNearWater(tx, ty - 1, 4)))) { e.dead = true; e.hp = 0; e.cdVoid = true; return e; }
    const lvl = layerLvl(layerLo('cidade'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
    // os saqueadores andam em dupla
    if (type === 'saqueador' && !cdPairing && zone >= CD_ZONE0 && zone <= CD_ZONE0 + 3) {
      cdPairing = true;
      try { for (const dx of [-T * 2, T * 2]) if (!rectSolid(px + dx, py, e.w, e.h) && solidAt(Math.floor((px + dx + e.w / 2) / T), ty)) { const o = spawnEnemy('saqueador', px + dx, py, zone); if (o && !o.dead) o.cdPar = true; break; } } finally { cdPairing = false; }
    }
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].cdVoid) enemies.splice(k, 1); });
// os acampamentos: perto de um acampamento vazio, uma dupla de saqueadores volta para ele (fora da tela, de tempo em tempo)
let cdCampT = 6;
HOOK.update.push(dt => {
  if (!CIDADE || !pl || pl.dead || state !== 'play' || !ET.saqueador || bossFight || (cdCampT -= dt) > 0) return;
  cdCampT = 8;
  const ptx = (pl.x + pl.w / 2) / T, pty = (pl.y + pl.h / 2) / T, halfW = VW / 2 / T + 2;
  for (const Cp of cdCamps) {
    const cx = Cp.x0 + 10, dx = Math.abs(wdx(cx - ptx)), dy = Math.abs(Cp.fy - pty);
    if (dx < halfW || dx > 45 || dy > 20 || gameTime - (Cp.t || -999) < 120) continue;
    if (enemies.some(e => e.type === 'saqueador' && !e.dead && Math.abs(wdx(e.x / T - cx)) < 14)) continue;
    Cp.t = gameTime;
    const e = spawnEnemy('saqueador', (Cp.x0 + 6) * T, Cp.fy * T - ET.saqueador.h, CD_ZONE0 + 1);
    if (e && !e.dead) e.cdCamp = true;
    break;
  }
});

/* ---------- os estados que os humanos põem no herói: marcado (+20% de dano dos da camada), encharcado (pulo menor),
   enredado (sem atacar) ---------- */
const cdOfLayer = src => src && ET[src.type] && (ET[src.type].human || src.type === 'afogado' || src.type === 'boiante');
HOOK.update.push(dt => {
  if (!pl || state !== 'play') return;
  if (pl.dead) { pl.cdMarcaT = pl.cdMolhadoT = pl.cdRedeT = 0; return; }
  if ((pl.cdMarcaT || 0) > 0) {
    pl.cdMarcaT -= dt;   // o anel escuro em volta dele é desenhado pelo 134
  }
  if ((pl.cdMolhadoT || 0) > 0) { pl.cdMolhadoT -= dt; if (Math.random() < dt * 6) parts.push({ x: pl.x + rnd(1, pl.w - 1), y: pl.y + rnd(4, pl.h), vx: 0, vy: 10, g: 300, life: 0.5, max: 0.5, col: '#22262c', size: 1 }); }
  if ((pl.cdRedeT || 0) > 0) pl.cdRedeT -= dt;
  // marcado: os da camada vão direto no herói (lembram dele mesmo sem vê-lo)
  if ((pl.cdMarcaT || 0) > 0) for (const e of enemies) if (!e.dead && cdOfLayer(e) && Math.hypot(e.x - pl.x, e.y - pl.y) < 30 * T) { e.memT = Math.max(e.memT || 0, 1); e.aggro = true; }
});
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  if (CIDADE && (pl.cdMarcaT || 0) > 0 && (cdOfLayer(src) || (isProj && inCidade(Math.floor((pl.y + pl.h / 2) / T))))) dmg = Math.round(dmg * 1.2);
  return _hp(dmg, srcX, src, isProj);
}; }
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!CIDADE || pl.dead) return _up(dt);
  const rede = (pl.cdRedeT || 0) > 0 && hb.sel === 0, ml = mouse.l, vy0 = pl.vy;
  if (rede) { mouse.l = false; pl.atkBuf = 0; }
  try { _up(dt); } finally { if (rede) mouse.l = ml; }
  if ((pl.cdMolhadoT || 0) > 0 && pl.vy <= -250 && vy0 > -150) pl.vy *= 0.75;   // encharcado: o pulo sai menor
}; }

/* ---------- o Facão do Saqueador e o Capuz do Poço (138) ---------- */
// o Facão: o golpe nas costas de quem não está olhando para você faz 60% a mais
{ const _he = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const w = melee && equip.weapon && ITEMS[equip.weapon.id];
  if (w && w.costas && !e.boss && dir === e.facing) mult *= 1 + w.costas;
  return _he(e, dir, mult, melee);
}; }
// o Capuz: os inimigos só notam o herói de mais perto (a 130 px em vez de 200)
{ const _cp = clearPath; clearPath = function (a, b) {
  if (b === pl && a !== pl && equip.head && ITEMS[equip.head.id] && ITEMS[equip.head.id].furtivo && !(a.memT > 0) && Math.hypot(pl.x - a.x, pl.y - a.y) > 130) return false;
  return _cp(a, b);
}; }

/* ---------- os brilhos: velas, lanternas, a prata raspada; perto do Poço a luz cai pela metade ---------- */
const CD_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!CIDADE || cy + VH < (CD_S0 - 6) * T || cy > (CD_S0 + CD_D + 6) * T) return;
  if (!CD_GLOW.v) { CD_GLOW.v = glow(16, '#ffb84a'); CD_GLOW.l = glow(24, '#ff9a40'); CD_GLOW.p = glow(10, '#ccd2da'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2], gx = emitters[i], gy = emitters[i + 1], k = cdPocoK(gx, gy);
    if (t === CD_VELAS) { lc.globalAlpha = (0.24 + Math.sin(gameTime * 9 + gx * 1.7) * 0.04) * k; lc.drawImage(CD_GLOW.v, gx * T + 6 - cx - 16, gy * T + 7 - cy - 16); }
    else if (t === CD_LANTERNA) { lc.globalAlpha = (0.28 + Math.sin(gameTime * 6 + gx * 1.3) * 0.03) * k; lc.drawImage(CD_GLOW.l, gx * T + 6 - cx - 24, gy * T + 7 - cy - 24); }
    else if (t === CD_O_PRATA) { if ((gx + gy) & 1) continue; lc.globalAlpha = (0.1 + Math.sin(gameTime * 0.9 + gx * 0.7) * 0.03) * k; lc.drawImage(CD_GLOW.p, gx * T + 6 - cx - 10, gy * T + 6 - cy - 10); }
  }
  lc.globalAlpha = 1;
});
// o Poço bebe a luz: a até 12 blocos da boca (e dentro dele) os brilhos daqui caem até a metade
function cdPocoK(tx, ty) { const P = cdPoco; if (!P) return 1; const dx = Math.abs(wdx(tx - P.cx)); if (dx <= 6 && ty >= P.top && ty <= P.bot) return 0.5; const d = Math.hypot(dx, ty - P.top); return d >= 12 ? 1 : 0.5 + 0.5 * d / 12; }
// gotas caindo do teto em toda a camada, poeira de reboco nas Ruas, fumaça de vela no Bairro, pó de mármore no Palácio
HOOK.update.push(dt => {
  if (!CIDADE || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = cidadeBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T)) && !aguaAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 0 ? 4 : 2)) {
    const tx = Math.floor((cam.x + Math.random() * VW) / T); let ty = Math.floor((cam.y + Math.random() * VH * 0.6) / T);
    for (let k = 0; k < 12 && !solidAt(tx, ty - 1); k++) ty--;
    if (solidAt(tx, ty - 1) && !solidAt(tx, ty) && wallAt(tx, ty)) parts.push({ x: tx * T + rnd(2, 10), y: ty * T, vx: 0, vy: 8, g: 380, life: 1.6, max: 1.6, col: '#3a4652', size: 1 });
  }
  if (b !== 0 && Math.random() < dt * 4) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (air(x, y)) parts.push(b === 1 ? { x, y, vx: rnd(-3, 3), vy: rnd(2, 6), g: 4, life: 3, max: 3, col: Math.random() < 0.5 ? '#6a5a4a' : '#8a7a68', size: 1 }
      : b === 2 ? { x, y, vx: rnd(-2, 2), vy: rnd(-8, -3), g: -1, life: 3, max: 3, col: '#4a4440', size: 1 }
      : { x, y, vx: rnd(-3, 3), vy: rnd(1, 4), g: 2, life: 3.5, max: 3.5, col: Math.random() < 0.5 ? '#9a9694' : '#c4beb8', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a prata na fornalha (138 tem os itens), as lojas ---------- */
FURN.min_prata = { bar: 'barra_prata', n: 6, t: 10 };
Object.assign(MAT_VAL, { min_prata: 40, barra_prata: 240, moeda_afundada: 22, cera_poco: 14, corda_alcatroada: 12, perola_negra: 30 });
{ const o = SHOPS.taverneiro, b = o.buys; o.buys = id => b(id) || id === 'moeda_afundada'; o.hint = o.hint.replace(/\.$/, '') + ' e moedas afundadas.'; }
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'cera_poco'; c.hint = c.hint.replace(/\.$/, '') + ' e cera do Poço.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_prata', 'barra_prata', 'corda_alcatroada'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', prata e corda alcatroada.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'perola_negra'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ' e pérolas negras.'; } }
// as bases da camada caem raro (cerca de 1% de cada; 3% do penitente). O sorteio de equipamento multiplica a chance
// por 0,1 (rollDrops), por isso os números aqui são 10 vezes maiores
for (const k of ['saqueador', 'besteiro', 'armadilheiro', 'telhadeiro', 'novicos', 'pregador', 'penitente', 'emparedador', 'afogado', 'boiante']) {
  if (!DROPS[k]) continue;
  const p = k === 'penitente' ? 0.1 : 0.034;
  for (const id of ['facao_saqueador', 'capuz_poco', 'couraca_guarda']) { const o = DROPS[k].find(r => r[0] === id); if (o) o[1] = p; else DROPS[k].push([id, p]); }
}
