'use strict';

/* ================= o Reino Élfico: o mundo (docs/camadas/11-reino-elfico.md, seção 3) =================
   A décima camada, debaixo da Fortaleza dos Anões (a de cima vem de camadaAcima; elAbove, 250). Em cima, a mata de
   prata crescida debaixo da Lua Presa; depois os salões lavrados do rei, a Corte dos Espinhos (a corte que seguiu a
   Dama e virou a Corte Sem Lua: a roseira-brava cresceu por cima de tudo) e, no fundo, as Grutas da Lua. Em passos:
     1. a rocha por faixa: a rocha da camada de cima (a Fortaleza dos Anões) afina e vira Solo Élfico; Solo com bolsões de Mármore-Lua na
        Mata; Mármore-Lua nos Salões; Mármore Enredado na Corte; Pedra-do-Poço com veios de Raiz-Mãe nas Grutas
     2. as salas: as duas descidas (o poço de raízes com a Escada de Corda e o Posto de Guarda 12 x 6), o Espelho da
        Lua do outro lado do mundo (a caixa sólida que o 256 veste com elDress) e os dois corredores até as portas, as
        clareiras e as grotas de folha, os salões lavrados, os abismos com ponte e as galerias, os salões enredados e os
        roseirais, as grutas da lua (duas com as Raízes Fundas, a saída para baixo)
     3. as ligações: túneis de raiz na Mata e nas Grutas, galerias retas nos Salões e na Corte, escadarias entre as faixas
     4. as cascas: as árvores de prata (tronco do chão ao teto, copa de folhagem no teto, flets de tábua com escada de
        corda), mármore e pedra lavrada nos salões com colunas de raiz, mármore enredado, lenho de espinheiro e pedras-videntes
        na Corte, cristais e raízes nas Grutas
     5. os veios: carvão no solo e no lenho de espinheiro, lunarita no mármore e na pedra-do-poço (metade nos Salões e nas Grutas)
   Depois (elAfter): tudo alcançável das descidas, Escada de Corda ou Cipó em todo desnível de 5, os estragos (entulho e
   roseira-brava na Corte), a decoração de 1 bloco, os objetos (252) e a água que brilha nos poços. Por fim o Espelho
   (256: elDress), as bocas das descidas e a subida garantida (elClimbFix). O 87 liga o resto depois.
   A camada tem LAYER_K vezes a altura do desenho: cada faixa vira LAYER_K andares da altura da faixa no desenho, cada
   andar com as suas salas (do mesmo tamanho) e o seu anel; entre os andares, túneis de raiz em ziguezague e escadarias.
   Também: a terceira camada, as zonas 53 a 56, o spawn por faixa e o nível (46 a 50 pela posição no 129), as
   partículas e a lunarita na fornalha e nas lojas. */

const EL_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [EL_SOLO, EL_MADEIRA, EL_FOLHAGEM, EL_MARMORE, EL_LAVRADA, EL_TABUA, EL_ENREDADO, EL_LENHO, EL_VIDENTE, EL_PEDRA_POCO, EL_RAIZ, EL_CRISTAL_LUA, EL_O_CARVAO, EL_O_LUNARITA]) EL_SOILS[t] = 1;
let elChambers = [], elCorr = [], elBridges = [], elDead = [];
// (a escada da camada de cima fica guardada: elAbove() monta um objeto a cada chamada e isto roda por bloco)
let elUpClimb = CHAIN;
const EL_CLIMB = t => t === EL_ESCADA || t === EL_CIPO || t === CHAIN || t === elUpClimb;

function elBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = elAbove(); elUpClimb = A.climb;
  EL_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = EL_S0, YB = Math.min(WH - 8, S0 + EL_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x51f3), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  // cada faixa tem LAYER_K andares, cada um com a altura da faixa no desenho de 186 metros (salas do mesmo tamanho,
  // 3x mais delas); md(j, m) põe o metro m do desenho dentro do andar j da faixa de m; sp(m0, m1) é o vão no andar
  const K = LAYER_K, BD = [0, 46, 98, 150, 186];
  const md = (j, m) => { const b = m < BD[1] ? 0 : m < BD[2] ? 1 : m < BD[3] ? 2 : 3, r0 = mb(BD[b]), r1 = mb(BD[b + 1]); return S0 + Math.round(r0 + (j + (m - BD[b]) / (BD[b + 1] - BD[b])) * (r1 - r0) / K); };
  const sp = (m0, m1) => md(0, m1) - md(0, m0);
  const bandOf = d => d < EL_BANDS[1] ? 0 : d < EL_BANDS[2] ? 1 : d < EL_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  elChambers = []; elCorr = []; elBridges = []; elDead = [];
  elEntries = []; elLand = []; elExits = []; elBoss = null; elHalls = []; elGlades = []; elGrottos = []; elKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // o metal de cima afina nas últimas 10 linhas e vira terra: aqui a nave acaba
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x5b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = EL_SOLO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = EL_PEDRA_POCO; walls[i] = WEL_POCO; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0x5b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x5a1), n2 = nz(x, y, 14, 0x5a2);
      let tt = EL_SOLO, w = WEL_MATA;
      if (b === 0) { if (n1 > 0.66 || (d > mb(36) && n2 > 0.6)) tt = EL_MARMORE; }
      else if (b === 1) { tt = n2 > 0.78 ? EL_SOLO : EL_MARMORE; w = WEL_SALAO; }
      else if (b === 2) { tt = n1 > 0.8 ? EL_MARMORE : EL_ENREDADO; w = WEL_ENREDADO; }
      else { const rib = Math.abs(nz(x, y, 22, 0x5a4) - 0.5); tt = rib < 0.028 ? EL_RAIZ : n1 > 0.82 ? EL_MARMORE : EL_PEDRA_POCO; w = WEL_POCO; }
      tiles[i] = tt; walls[i] = w;
      if (agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => elChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // sala reta: ar de fy - h a fy - 1, chão em fy
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  // salão lavrado: reto até a metade, depois a abóbada em arco (o meio sobe `arc` acima das paredes)
  const vault = (x0, fy, w, h, arc) => {
    const wall = h - arc;
    for (let x = x0; x < x0 + w; x++) {
      const u = (x + 0.5 - x0) / w * 2 - 1, top = fy - wall - Math.round(arc * Math.sqrt(Math.max(0, 1 - u * u)));
      for (let y = top; y < fy; y++) dig(x, y); hard(x, fy);
    }
  };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  // túnel de raiz (Mata e Grutas): anda para o alvo com curvas suaves; r ~1.4 dá 3 de altura. Nunca mais íngreme que
  // uns 35 graus: com o alvo embaixo ele vai em ziguezague (side), sem poço reto
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya, side = 1; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 2000; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.7 + Math.sin(n * 0.09 + s) * 0.3;
      let vx = Math.cos(a), vy = Math.sin(a);
      if (Math.abs(vy) > 0.72 && Math.abs(ddy) > 3) { if (Math.abs(ddx) > 7) side = ddx > 0 ? 1 : -1; vy = Math.sign(vy) * 0.72; vx = side * 0.7; }
      x += vx * 0.8; y += vy * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  // galeria: um corredor reto de 5 no chão fa de xa até xb e, se o chão de destino for outro, uma escadaria
  // (um degrau a cada 2 colunas) até fb
  const gallery = (xa, fa, xb, fb, list) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, steps = Math.abs(fb - fa), flat = Math.max(0, Math.abs(d) - steps * 2);
    let x = xa, f = fa;
    for (let k = 0; k <= flat; k++, x += s) { for (let y = f - 5; y < f; y++) dig(x, y); hard(x, f); }
    if (list && flat > 6) list.push({ x0: W1(s > 0 ? xa : xa - flat), len: flat + 1, fy: fa });
    const fs = fb > fa ? 1 : -1;
    for (let k = 0; k < steps * 2; k++, x += s) { if (k % 2 === 1) f += fs; for (let y = f - 5; y < f; y++) dig(x, y); hard(x, f); }
  };

  // ---------- 2a. as duas descidas: das salas de descida da camada de cima (a Fortaleza dos Anões), um poço de raízes até o Posto de Guarda ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 20 + ((R() * 7) | 0), S0 + 12, S0 + mb(30));
      const hx = side > 0 ? xs - 1 : xs - 8;   // o poço cai numa ponta do posto (12 x 6)
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 12; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 12; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 12 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 12, h: 6, door: W1(door), side };
      elLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // uma grota de folha logo depois da porta: o primeiro pedaço da mata que o herói vê
      const w = 16 + ((R() * 8) | 0), h = 8, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, t: 0, kind: 'grota', x0: W1(x0), fy: landFy, top: landFy - h };
      elChambers.push(H);
      elChambers.push({ cx: hx + 6, cy: landFy - 3, w: 12, h: 6, band: 0, kind: 'pouso', nolink: true });
      elEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. o Espelho da Lua, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 64, h = 26;
    const ax = elEntries.length ? elEntries.reduce((s, e) => s + wdx(e.x0 - elEntries[0].x0), 0) / elEntries.length + elEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 16, md(K - 1, 168)), top = fy - h;   // longe das 10 linhas que a camada de baixo afina
    const x0 = W1(cx - 32), x1 = W1(cx + 31);
    elBoss = { cx, x0, x1, w, h, top, fy,
      doors: [{ side: -1, x: W1(cx - 35), fy }, { side: 1, x: W1(cx + 34), fy }],
      moon: { cx, cy: top + 7, r: 3 } };
    for (let y = top - 4; y <= fy + 4; y++) for (let x = cx - 36; x <= cx + 35; x++) seal[I(x, y)] = 1;
    elChambers.push({ cx, cy: fy - h / 2, w: w + 8, h: h + 8, band: 3, boss: true, nolink: true });
    for (const D of elBoss.doors) {
      const len = 28 + ((R() * 14) | 0), fyD = D.fy;
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 4; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); elKeep.add(I(x, fyD));
        x += D.side;
      }
      elCorr.push({ x0: D.side > 0 ? W1(D.x + 1) : W1(D.x - len), len, fy: fyD, boss: true });
      elChambers.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 4, band: 3, kind: 'servico', nolink: true });
      // uma gruta da lua no fim do corredor
      const gw = 18 + ((R() * 6) | 0), gh = 12, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      room(gx0, fyD, gw, gh);
      const C = { cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: 3, t: 4 * K - 1, kind: 'gruta', x0: W1(gx0), fy: fyD, top: fyD - gh, flat: true };
      elGrottos.push(C); elChambers.push(C);
    }
  }
  const awayFromBoss = (cx, cy, m) => !elBoss || Math.abs(wdx(cx - elBoss.cx)) > elBoss.w / 2 + 6 + m || cy < elBoss.top - 6 - m || cy > elBoss.fy + 6 + m;

  // ---------- 2c. as Raízes Fundas: duas grutas da lua no fundo, longe uma da outra e do Espelho ----------
  for (let tries = 0; elExits.length < 2 && tries < 600; tries++) {
    const w = 16 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = md(K - 1, 166) + ((R() * sp(166, 176)) | 0);
    if (!awayFromBoss(cx, fy, 40) || elExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, t: 4 * K - 1, kind: 'gruta', x0: W1(x0), fy, top: fy - h, exit: true, flat: true };
    elGrottos.push(C); elChambers.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    elExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. a Mata de Prata: clareiras com árvores de prata e grotas de folha ----------
  // (por andar: k % K escolhe o andar, as contas por camada vezes K)
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 34 + ((R() * 23) | 0), h = 14 + ((R() * 7) | 0), cx = (R() * WW) | 0, cy = md(j, 22 + R() * 22) - h / 2;   // o chão entre 22 e 44 m do andar
    if (busy(cx, cy, w, h, 6)) continue;
    // a clareira: o teto alto e largo (a copa vai colada nele), o chão quase plano
    for (let y = Math.floor(cy - h / 2) - 1; y <= cy + h / 2 + 1; y++) for (let x = Math.floor(cx - w / 2) - 1; x <= cx + w / 2 + 1; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy = (y + 0.5 - cy) / (h / 2), e = dy > 0 ? dx * dx * 0.7 + dy * dy * dy * dy * 1.0 : dx * dx * 0.9 + dy * dy;
      if (e < 1 + (nz(x, y, 20, 0x5c0 + k) - 0.5) * 0.22) dig(x, y);
    }
    const fy = Math.round(cy + h / 2), trees = [], n = w > 46 ? 3 : w > 38 ? 2 : 1;
    for (let j = 0; j < n; j++) trees.push(Math.round(cx - w / 2 + w * (j + 0.5) / n + (R() - 0.5) * 4) - 1);
    const G = { cx, cy, w, h, band: 0, t: j, kind: 'clareira', fy, trees };
    elGlades.push(G); elChambers.push(G); k++;
  }
  for (let k = 0, tries = 0; k < 8 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 10 + ((R() * 9) | 0), h = 6 + ((R() * 4) | 0), cx = (R() * WW) | 0, cy = md(j, 6) + h / 2 + R() * Math.max(0, sp(6, 44) - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x5d00 + k, 1.4);
    elChambers.push({ cx, cy, w, h, band: 0, t: j, kind: 'grota' }); k++;
  }

  // ---------- 2e. os Salões do Rei: salões lavrados com abóbada, abismos com ponte, galerias ----------
  const hallsOf = (band, n, d0, d1, ruin) => {
    for (let k = 0, tries = 0; k < n * K && tries < 400 * K; tries++) {
      const j = k % K, w = (ruin ? 24 : 28) + ((R() * (ruin ? 17 : 17)) | 0), h = (ruin ? 9 : 10) + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = md(j, d0 + R() * (d1 - d0));
      if (fy - h < md(j, BD[band]) + 2 || busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
      const arc = Math.min(4, h >> 2);
      vault(x0, fy, w, h, arc);
      const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band, t: band * K + j, kind: ruin ? 'ruina' : 'salao', x0: W1(x0), fy, top: fy - h, arc, ruin: !!ruin };
      elHalls.push(H); elChambers.push(H); k++;
    }
  };
  hallsOf(1, 5 * WSC, 58, 96, false);
  for (let k = 0, tries = 0; k < 2 * WSC * K && tries < 300 * K; tries++) {
    const j = k % K, w = 18 + ((R() * 9) | 0), h = 16 + ((R() * 7) | 0), x0 = (R() * WW) | 0, fy = md(j, 70 + R() * 26);
    if (fy - h < md(j, 48) || busy(x0 + w / 2, fy - h / 2, w, h, 6)) continue;
    room(x0, fy, w, h);
    const by = fy - Math.round(h / 2) - 1;
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, t: K + j, kind: 'abismo', x0: W1(x0), fy, top: fy - h, by };
    elBridges.push(H); elChambers.push(H); k++;
  }
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, len = 30 + ((R() * 41) | 0), x0 = (R() * WW) | 0, fy = md(j, 54 + R() * 42);
    if (busy(x0 + len / 2, fy - 3, len, 5, 3)) continue;
    for (let j = 0; j < len; j++) { for (let y = fy - 5; y < fy; y++) dig(x0 + j, y); hard(x0 + j, fy); }
    const C = { cx: x0 + len / 2, cy: fy - 3, w: len, h: 5, band: 1, t: K + j, kind: 'galeria', x0: W1(x0), fy, top: fy - 5, len };
    elCorr.push({ x0: W1(x0), len, fy }); elChambers.push(C); k++;
  }

  // ---------- 2f. a Corte dos Espinhos: salões enredados e roseirais ----------
  hallsOf(2, 5 * WSC, 108, 148, true);
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 300 * K; tries++) {
    const j = k % K, w = 26 + ((R() * 15) | 0), h = 12 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = md(j, 104) + h / 2 + R() * Math.max(0, sp(104, 146) - h);
    if (busy(cx, cy, w, h, 6) || !awayFromBoss(cx, cy, w / 2 + 6)) continue;
    blob(cx, cy, w, h, 0x5e00 + k, 2.2);
    const fy = Math.round(cy + h / 2), trees = [], n = w > 34 ? 2 : 1;
    for (let j = 0; j < n; j++) trees.push(Math.round(cx - w / 2 + w * (j + 0.5) / n + (R() - 0.5) * 6));
    const G = { cx, cy, w, h, band: 2, t: 2 * K + j, kind: 'bosque', fy, trees, dead: true };
    elGlades.push(G); elDead.push(G); elChambers.push(G); k++;
  }

  // ---------- 2g. as Grutas da Lua: grutas redondas com uma bacia d'água no fundo ----------
  for (let k = 0, tries = 0; elGrottos.length < 5 * WSC * K + 4 && tries < 500 * K; tries++) {
    const j = k % K, w = 18 + ((R() * 11) | 0), h = 12 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = md(j, 152) + h / 2 + R() * Math.max(0, sp(152, 182) - h);
    if (busy(cx, cy, w, h, 6) || !awayFromBoss(cx, cy, Math.max(w, h) / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0x5f00 + k, 1.8);
    const C = { cx, cy, w, h, band: 3, t: 3 * K + j, kind: 'gruta', fy: Math.round(cy + h / 2), pool: R() < 0.75 };
    elGrottos.push(C); elChambers.push(C); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  // um anel por andar (como era um por faixa), no estilo da faixa
  for (let t = 0; t < 4 * K; t++) {
    const b = (t / K) | 0, L = elChambers.filter(c => c.t === t && !c.nolink && !c.boss).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (b === 1 || b === 2) gallery(ax, ay, bx, by, elCorr);   // os salões: galerias e escadarias
      else worm(ax, ay - 2, bx, by - 2, b === 0 ? 1.5 : 1.35, 0x5700 + t * 90 + k);   // a mata e o poço: túneis de raiz
    }
  }
  // entre os andares: túneis de raiz (2 x WSC por divisa) e escadarias (2 x WSC entre faixas, WSC entre andares da mesma)
  for (let t = 0; t < 4 * K - 1; t++) {
    const b = t, U = elChambers.filter(c => c.t === t && !c.nolink && !c.boss), D = elChambers.filter(c => c.t === t + 1 && !c.nolink && !c.boss), nl = (t + 1) % K ? WSC : 2 * WSC;
    for (let k = 0; k < 2 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5); worm(ax, ay - 2, Q.cx, mouth(Q) - 2, 1.35, 0x57f0 + b * 9 + k);
    }
    for (let k = 0, tries = 0; k < nl && tries < 80; tries++) {
      const P = U[(R() * U.length) | 0]; if (!P) continue;
      const Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5), by = mouth(Q); if (by - ay < 6 || by - ay > 60 || !awayFromBoss(Q.cx, by, 6)) continue;
      gallery(ax, ay, Math.round(Q.cx), by); k++;
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

  // ---------- 4. as cascas ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && EL_SOILS[tiles[i]] && !elKeep.has(i) && !inElHall(W1(x), y, 4)) tiles[i] = t; };
  const airAround = (x, y) => !SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)] || !SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)];
  const lining = (x0, y0, x1, y1, t, w, floorT, ceilT) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (inElHall(W1(x), y, 4) || y < S0 || y >= YB - 1) continue;
      if (SOLID[tiles[i]]) { if (airAround(x, y) || hash2(W1(x), y, seed ^ 0x51) < 0.55) shell(x, y, floorT && !SOLID[at(x, y - 1)] ? floorT : ceilT && !SOLID[at(x, y + 1)] ? ceilT : t); }
      else walls[i] = w;
    }
  };
  // um tronco do chão (fy) ao teto: 3 de largura, raízes abertas no pé; `dead` entorta e escurece; devolve o topo
  const trunk = (tx, fy, dead) => {
    let top = fy - 1; while (top > fy - 40 && at(tx + 1, top - 1) === AIR) top--;
    if (fy - top < 6) return null;
    const T0 = dead ? EL_LENHO : EL_MADEIRA;
    let sh = 0;
    for (let y = fy - 1; y >= top - 1; y--) {
      if (dead && (fy - y) % 5 === 4) sh += hash2(tx, y, seed ^ 0x52) < 0.5 ? -1 : 1;   // o espinheiro se retorce
      for (let x = tx + sh; x < tx + sh + 3; x++) { const i = I(x, y); if (elKeep.has(i)) continue; tiles[i] = T0; }
    }
    // as raízes do pé: uma fileira mais larga em cima do chão
    for (const x of [tx - 1, tx + 3]) { const i = I(x, fy - 1); if (tiles[i] === AIR && SOLID[at(x, fy)]) tiles[i] = T0; }
    return { top, sh };
  };
  // a Mata: copa de folhagem colada no teto (2 a 3 de espessura, mais funda em volta dos troncos), árvores de prata com
  // flets de tábua em volta e a escada de corda do chão ao flet
  for (const G of elGlades) {
    const x0 = Math.floor(G.cx - G.w / 2) - 2, x1 = Math.ceil(G.cx + G.w / 2) + 2, y0 = Math.floor(G.cy - G.h / 2) - 3, y1 = G.fy + 1;
    lining(x0, y0, x1, y1, G.dead ? EL_ENREDADO : EL_SOLO, G.dead ? WEL_ENREDADO : WEL_FOLHAS, G.dead ? EL_ENREDADO : EL_SOLO, G.dead ? EL_ENREDADO : EL_FOLHAGEM);
    G.flets = [];
    for (const tx of G.trees) {
      // o chão debaixo do tronco: desce até achar chão firme perto do fundo da clareira
      let fy = G.fy - 4; while (fy < G.fy + 3 && at(tx + 1, fy) === AIR) fy++;
      if (!SOLID[at(tx + 1, fy)]) continue;
      const tr = trunk(tx, fy, G.dead); if (!tr) continue;
      if (G.dead) continue;
      // a copa em volta do topo do tronco: um leque de folhagem pendurado
      for (let y = tr.top; y < tr.top + 4; y++) for (let x = tx - 6; x <= tx + 8; x++) {
        const dx = (x - tx - 1) / 7, dy = (y - tr.top) / 4; if (dx * dx + dy * dy * 1.6 > 1 || hash2(W1(x), y, seed ^ 0x53) < 0.15) continue;
        const i = I(x, y); if (tiles[i] === AIR && !elKeep.has(i)) tiles[i] = EL_FOLHAGEM;
      }
      // flets: a 5 e a 10 do chão, de um lado ou dos dois, com a escada de corda colada no tronco
      for (let p = 0, py = fy - 5; py > tr.top + 4 && p < 2; p++, py -= 5) {
        const sideL = (p + (hash2(tx, py, seed ^ 0x54) < 0.5 ? 0 : 1)) & 1, pw = 4 + ((hash2(tx, py, seed ^ 0x55) * 4) | 0);
        const px0 = sideL ? tx - pw : tx + 3, px1 = sideL ? tx - 1 : tx + 2 + pw;
        let okP = true; for (let x = px0; x <= px1; x++) if (at(x, py) !== AIR || at(x, py - 1) !== AIR || at(x, py - 2) !== AIR) okP = false;
        if (!okP) continue;
        for (let x = px0; x <= px1; x++) set(x, py, EL_TABUA);
        const lx = sideL ? px1 : px0;   // a escada encostada no tronco, do flet até o chão de baixo
        for (let y = py; y < fy; y++) { const i = I(lx, y); if (tiles[i] === AIR || y === py) tiles[i] = EL_ESCADA; }
        G.flets.push({ x0: W1(px0), x1: W1(px1), y: py });
      }
    }
  }
  // as grotas de folha: solo com a cortina de folhas atrás
  for (const C of elChambers) if (C.kind === 'grota' && C.band === 0) lining(Math.floor(C.cx - C.w / 2) - 2, Math.floor(C.cy - C.h / 2) - 2, Math.ceil(C.cx + C.w / 2) + 2, Math.ceil(C.cy + C.h / 2) + 2, EL_SOLO, WEL_MATA, EL_SOLO, EL_FOLHAGEM);
  // os salões: pedra lavrada na casca, chão lavrado, painel lavrado atrás; colunas de raiz a cada 8 do chão à abóbada
  for (const H of elHalls) {
    lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, H.ruin ? EL_ENREDADO : EL_LAVRADA, H.ruin ? WEL_ENREDADO : WEL_SALAO, H.ruin ? EL_ENREDADO : EL_LAVRADA, H.ruin ? EL_ENREDADO : EL_LAVRADA);
    for (let x = H.x0 + 4; x < H.x0 + H.w - 3; x += 8) {
      if (at(x, H.fy - 1) !== AIR) continue;
      let y = H.fy - 1; while (y > H.top - 6 && at(x, y - 1) === AIR) y--;
      if (H.fy - y < 4) continue;
      for (let yy = y; yy < H.fy; yy++) set(x, yy, EL_COLUNA);
    }
    // na Corte, 35% dos salões têm o teto caído: um buraco na abóbada e um monte de entulho embaixo
    if (H.ruin && hash2(H.x0, H.fy, seed ^ 0x56) < 0.35) {
      const cx = H.x0 + 4 + ((hash2(H.x0, 1, seed ^ 0x56) * (H.w - 8)) | 0), rw = 3 + ((hash2(H.x0, 2, seed ^ 0x56) * 3) | 0);
      for (let x = cx - rw; x <= cx + rw; x++) {
        if (at(x, H.fy - 1) === EL_COLUNA) for (let yy = H.top - 4; yy < H.fy; yy++) if (at(x, yy) === EL_COLUNA) set(x, yy, AIR);
        const mh = Math.max(0, Math.round((1 - Math.abs(x - cx) / (rw + 1)) * 2.4));
        for (let j = 1; j <= mh; j++) if (at(x, H.fy - j) === AIR) set(x, H.fy - j, EL_ENREDADO);
      }
    }
  }
  // os abismos com ponte: mármore lavrado em volta, a ponte de tábua sem corrimão a meia altura, de parede a parede
  for (const H of elBridges) {
    lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, EL_MARMORE, WEL_SALAO, EL_LAVRADA, EL_MARMORE);
    for (let x = H.x0 - 1; x <= H.x0 + H.w; x++) if (at(x, H.by) === AIR) set(x, H.by, EL_TABUA);
  }
  // as galerias: chão e teto de pedra lavrada, painel atrás
  for (const Q of elCorr) {
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j;
      for (let y = Q.fy - 6; y <= Q.fy; y++) {
        const i = I(x, y); if (inElHall(W1(x), y, 1) || y < S0 + 1 || y >= YB - 1) continue;
        const b = elfosBand(y);
        if (!SOLID[tiles[i]]) { walls[i] = b >= 3 ? WEL_POCO : b === 2 ? WEL_ENREDADO : WEL_SALAO; continue; }
        if ((y === Q.fy || y === Q.fy - 6) && EL_SOILS[tiles[i]] && !elKeep.has(i)) tiles[i] = b === 2 ? EL_ENREDADO : b >= 3 ? EL_PEDRA_POCO : EL_LAVRADA;
      }
    }
  }
  // as grutas da lua: pedra-do-poço com cachos de cristal lunar nas paredes e raízes atravessando o teto
  for (const C of elGrottos) {
    const x0 = Math.floor(C.cx - C.w / 2) - 3, x1 = Math.ceil(C.cx + C.w / 2) + 3, y0 = Math.floor(C.cy - C.h / 2) - 3, y1 = Math.ceil(C.cy + C.h / 2) + 3;
    lining(x0, y0, x1, y1, EL_PEDRA_POCO, WEL_POCO, EL_PEDRA_POCO, EL_RAIZ);
    for (let k = 0, n = 2 + ((R() * 3) | 0); k < n; k++) {
      const a = -Math.PI * (0.1 + R() * 0.8) + (R() < 0.3 ? Math.PI : 0), r = 1.3 + R() * 1.2, ex = C.cx + Math.cos(a) * C.w / 2, ey = C.cy + Math.sin(a) * C.h / 2;
      for (let y = Math.floor(ey - r); y <= ey + r; y++) for (let x = Math.floor(ex - r); x <= ex + r; x++) {
        if (Math.hypot(x + 0.5 - ex, y + 0.5 - ey) > r || inElHall(W1(x), y, 3) || y >= YB - 1) continue;
        const i = I(x, y); if (elKeep.has(i) || !SOLID[tiles[i]]) continue; tiles[i] = EL_CRISTAL_LUA;
      }
    }
  }
  // a Corte: pedras-videntes (a pedra furada que deixa ver o povo das fadas) nas paredes dos salões enredados
  for (const H of elHalls) if (H.ruin) for (let k = 0, n = 1 + ((R() * 2) | 0); k < n; k++) {
    const ex = H.x0 + 2 + R() * (H.w - 4), ey = H.top + R() * 3, r = 1.2 + R();
    for (let y = Math.floor(ey - r); y <= ey + r; y++) for (let x = Math.floor(ex - r); x <= ex + r; x++) {
      if (Math.hypot(x + 0.5 - ex, y + 0.5 - ey) > r) continue;
      const i = I(x, y); if (elKeep.has(i) || !SOLID[tiles[i]] || !EL_SOILS[tiles[i]]) continue; tiles[i] = EL_VIDENTE;
    }
  }
  // o Espelho da Lua: a caixa toda sólida, pedra-do-poço com parede do poço (o 256 escreve dentro)
  {
    const B = elBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 35; x <= B.cx + 34; x++) { const i = I(x, y); tiles[i] = EL_PEDRA_POCO; walls[i] = WEL_POCO; if (agua.length) agua[i] = 0; }
  }
  // ---------- as descidas: a boca vira terra, o poço de raízes com a Escada de Corda; o Posto de Guarda ----------
  for (const E of elEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = EL_SOLO; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WEL_MATA; elKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 + 3 ? EL_SOLO : (y - E.fy) % 5 === 2 ? EL_RAIZ : EL_MADEIRA; elKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = EL_ESCADA; elKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) elKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WEL_MATA; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 3)) tiles[i] = y === L.fy ? EL_TABUA : EL_MADEIRA;
      else if (!edge) { tiles[i] = W1(x) === W1(x0 + 1) ? EL_ESCADA : AIR; walls[i] = WEL_FOLHAS; }   // a escada desce até o chão (sem ela, o posto era um poço sem volta)
      else { tiles[i] = W1(x) === W1(x0 + 1) ? EL_ESCADA : AIR; walls[i] = WEL_MATA; }
      elKeep.add(i);
    }
    // duas lanternas élficas no teto, longe da escada
    for (const lx of L.side > 0 ? [L.x0 + 5, L.x0 + 9] : [L.x0 + 2, L.x0 + 6]) if (tiles[I(lx, L.fy - L.h)] === AIR) tiles[I(lx, L.fy - L.h)] = EL_LANTERNA;
  }
  // ---------- as Raízes Fundas: a raiz-mãe descendo pelo poço, a casca queimada nas bordas, a escada até a última linha ----------
  for (const X of elExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WEL_POCO; elKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = (y - X.top) % 6 === 3 ? EL_LENHO : EL_RAIZ; elKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = EL_ESCADA; elKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { elKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = EL_RAIZ; } }
    tiles[I(X.x0 + 1, X.fy)] = EL_PEDRA_POCO;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0f9b);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !elKeep.has(i) && !inElHall(W1(x), y, 4)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(EL_O_CARVAO, 22 * WSC * K, 0, 60, 3, 8, t => t === EL_SOLO);
  vein(EL_O_CARVAO, 6 * WSC * K, 98, 150, 3, 7, t => t === EL_ENREDADO || t === EL_LENHO);
  vein(EL_O_LUNARITA, 13 * WSC * K, 46, 98, 2, 5, t => t === EL_MARMORE);
  vein(EL_O_LUNARITA, 7 * WSC * K, 98, 150, 2, 5, t => t === EL_ENREDADO || t === EL_MARMORE);
  vein(EL_O_LUNARITA, 6 * WSC * K, 150, 186, 2, 5, t => t === EL_PEDRA_POCO || t === EL_MARMORE);
}

function elAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = EL_S0, YB = Math.min(WH - 8, S0 + EL_D), R3 = mulberry32(seed ^ 0x5d3c1);
  const elRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!elRow(y)) return; const i = I(x, y); if (elKeep.has(i) || inElHall(W1(x), y, 4)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WEL_MATA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya, side = 1; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1500; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      let vx = Math.cos(a), vy = Math.sin(a);   // em ziguezague quando o alvo está bem embaixo ou em cima (sem poço reto)
      if (Math.abs(vy) > 0.75 && Math.abs(ddy) > 4) { if (Math.abs(ddx) > 6) side = ddx > 0 ? 1 : -1; vy = Math.sign(vy) * 0.75; vx = side * 0.66; }
      x += vx * 0.8; y += vy * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const elSolid = t => SOLID[t] && EL_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = elBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of elEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!elEntries.length && elChambers.length) flood(I(elChambers[0].cx, Math.round(elChambers[0].cy)));
  if (B) for (let y = B.top - 4; y <= B.fy + 4; y++) for (let x = B.cx - 36; x <= B.cx + 35; x++) reach[I(x, y)] = 1;
  // (um só rótulo para todas as passadas, marcado com o número da passada; cada passada junta todos os bolsões de 16 ou
  // mais e liga um por um, do maior ao menor, pulando os que uma ligação anterior já alcançou)
  const LO = S0 * WW, lab = new Uint16Array((YB - S0) * WW);
  let org = null; const orgT = [];
  for (let pass = 0, nw = 0; pass < 60; pass++) {
    const P1 = pass + 1, comps = [];
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i - LO] === P1 || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i - LO] = P1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= LO && nb < YB * WW && lab[nb - LO] !== P1 && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb - LO] = P1; stack.push(nb); } }
      if (comp.length >= 16) comps.push(comp);
    }
    if (!comps.length) break;
    comps.sort((a, b) => b.length - a.length);
    for (const bestC of comps) {
      if (reach[bestC[0]]) continue;
      let best = null, bd = 1e9;
      for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
        const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
        for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
          const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
          const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inBox(W1(cx + dx), y, 2)) continue;
          const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
        }
      }
      if (!best) { for (const c of bestC) reach[c] = 1; continue; }
      worm(best[0], best[1], best[2], best[3], 1.3, 0x56a0 + nw++);
      flood(I(best[2], best[3]), true);
      if (!reach[bestC[0]]) {   // a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
        if (!org) org = new Int32Array(NN).fill(-1);
        for (const c of orgT) org[c] = -1; orgT.length = 0;
        const q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); orgT.push(c); }
        for (let h = 0; h < q.length && hit < 0; h++) {
          const c = q[h], x = c % WW, row = c - x;
          for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
            if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || elKeep.has(nb) || elKeep.has(nb - WW) || tiles[nb] === BEDROCK || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
            org[nb] = c; orgT.push(nb); if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
            q.push(nb);
          }
        }
        for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
        if (hit >= 0) flood(hit, true);
        if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
      }
    }
  }

  // ---------- 2. escada de corda (nos salões) ou cipó (na mata e no poço) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || EL_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (elKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const b = elfosBand(y), tt = b === 0 || b === 3 ? EL_CIPO : EL_ESCADA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  // poços verticais estreitos (3 de largura): a escada na coluna da esquerda, se ainda não tiver nada
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || EL_CLIMB(at(x, y - 1)) || EL_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (elKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, EL_ESCADA);
  }

  // ---------- 3. os estragos: roseira-brava no chão dos roseirais e dos salões enredados ----------
  for (const C of [...elDead, ...elHalls.filter(H => H.ruin)]) {
    const x0 = Math.floor(C.x0 !== undefined ? C.x0 : C.cx - C.w / 2), w = C.w;
    for (let x = x0 + 1; x < x0 + w - 1; x++) {
      let y = C.fy - 1; while (y > C.fy - 6 && at(x, y + 1) === AIR) y++;
      const i = I(x, y); if (tiles[i] !== AIR || elKeep.has(i) || !elSolid(at(x, y + 1)) || EL_CLIMB(at(x - 1, y)) || EL_CLIMB(at(x + 1, y)) || EL_CLIMB(at(x, y - 1))) continue;
      if (R3() < (C.dead ? 0.16 : 0.06)) put(x, y, EL_ROSEIRA);
    }
  }

  // ---------- 4. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || elKeep.has(i)) continue;
    const b = elfosBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inElLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = elSolid(dn) && BLOCKY[dn] && up === AIR && dn !== EL_FOLHAGEM, ceil = elSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (b >= 1 && b <= 2 && gap <= 6 && gap >= 3 && SOLID[at(x, y + gap)] && elSolid(at(x, y + gap)) && q < 0.006) { for (let j = 0; j < gap; j++) put(x, y + j, EL_COLUNA); continue; }   // a coluna de raiz, do teto ao chão
      if (b === 0) {
        if (up === EL_FOLHAGEM && q < 0.05 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 5) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, EL_CIPO); }
        else if (q < 0.065 && gap >= 3) put(x, y, EL_LANTERNA);
        else if (q < 0.085) put(x, y, EL_ORVALHO);
      }
      else if (b === 1) { if (q < 0.03 && gap >= 3) put(x, y, EL_LANTERNA); else if (q < 0.05 && gap >= 4) put(x, y, EL_FLAMULA); else if (q < 0.06) put(x, y, EL_ORVALHO); }
      else if (b === 2) { if (q < 0.04 && gap >= 4) put(x, y, EL_FLAMULA); else if (q < 0.05 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, EL_CIPO); } }
      else { if (q < 0.035) put(x, y, EL_ORVALHO); else if (q < 0.05 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, EL_CIPO); } else if (q < 0.06 && gap >= 3) put(x, y, EL_LANTERNA); }
      continue;
    }
    // vaga-lumes no ar perto da parede (Mata e Grutas); cogumelo-de-luar grudado na parede das Grutas
    if (!floor && (b === 0 || b === 3) && q < 0.006 && at(x - 1, y) === AIR && at(x + 1, y) === AIR && at(x, y + 1) === AIR) { put(x, y, EL_VAGALUME); continue; }
    if (!floor || EL_CLIMB(at(x - 1, y)) || EL_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    if (b === 0) { if (q < 0.05) put(x, y, EL_FOLHAS); else if (q < 0.075) put(x, y, EL_SAMAMBAIA); else if (q < 0.095) put(x, y, EL_FLOR); else if (q < 0.1) put(x, y, EL_RUNA); }
    else if (b === 1) { if (q < 0.012) put(x, y, EL_BRASEIRO); else if (q < 0.02) put(x, y, EL_RUNA); else if (q < 0.03) put(x, y, EL_FLOR); }
    else if (b === 2) { if (q < 0.025) put(x, y, EL_FOLHAS); else if (q < 0.045) put(x, y, EL_COGUMELO); }   // os anéis de cogumelo das fadas
    else { if (q < 0.03) put(x, y, EL_COGUMELO); else if (q < 0.05) put(x, y, EL_CRISTALINHO); else if (q < 0.065) put(x, y, EL_FLOR); else if (q < 0.07) put(x, y, EL_RUNA); }
  }

  // ---------- 5. os objetos ----------
  elPlaceProps();
}

/* ---------- a água que brilha nos poços das grutas da lua (171: água com plâncton, rasa); se a bacia vaza, fica seca ---------- */
function elWater() {
  if (!agua.length) return;
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const C of elGrottos) {
    if (!C.pool || C.exit) continue;
    let y = Math.round(C.cy); while (y < C.fy + 4 && !SOLID[tiles[I(Math.round(C.cx), y + 1)]]) y++;
    if (!SOLID[tiles[I(Math.round(C.cx), y + 1)]] || SOLID[tiles[I(Math.round(C.cx), y)]]) continue;
    const n = aguaBasin(Math.round(C.cx), y, y - 1, AGUA_PLANCTON, 160);
    if (n) for (let x = Math.round(C.cx - C.w / 2); x <= C.cx + C.w / 2; x++) for (let yy = y - 2; yy <= y; yy++) { const i = I(x, yy); if (agua[i] && DECO[tiles[i]] && !EL_CLIMB(tiles[i])) tiles[i] = AIR; }
  }
}

/* ---------- as bocas das descidas por último ---------- */
function elExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of elEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? EL_ESCADA : AIR; elKeep.add(i); }
}
/* ---------- a subida garantida: do Espelho, dos salões, das grutas e do pé das raízes fundas o herói tem de conseguir
   voltar às descidas (pulo de 3 blocos; escada e cipó sobem) ---------- */
function elClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = EL_S0, YB = Math.min(WH - 8, S0 + EL_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => EL_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  // a busca anda em tabelas (sólido, escada, cabe em pé) e não nos tiles: o repair atualiza a coluna que mexe. seen e
  // any guardam o número da busca (stamp), sem limpar os arrays a cada busca; a sala do chefe entra na tabela
  const N = WW * H, Sa = new Uint8Array(N + WW), La = new Uint8Array(N + WW), Ok = new Uint8Array(N);
  const hall = new Uint8Array(WW * H); if (elBoss) for (let y = Y0; y < YB; y++) for (let x = 0; x < WW; x++) if (inElHall(x, y)) hall[(y - Y0) * WW + x] = 1;
  for (let y = Y0; y <= YB; y++) for (let x = 0; x < WW; x++) { const j = (y - Y0) * WW + x; Sa[j] = S(x, y) ? 1 : 0; La[j] = L(x, y) ? 1 : 0; }
  for (let j = WW; j < N; j++) Ok[j] = !Sa[j] && !Sa[j - WW] && !hall[j] ? 1 : 0;
  const refresh = (x, y0, y1) => {
    for (let y = y0; y <= y1 + 1; y++) { const j = (y - Y0) * WW + x; if (j >= 0 && j < N + WW) { Sa[j] = S(x, y) ? 1 : 0; La[j] = L(x, y) ? 1 : 0; } }
    for (let y = y0; y <= y1 + 1; y++) { const j = (y - Y0) * WW + x; if (j >= WW && j < N) Ok[j] = !Sa[j] && !Sa[j - WW] && !hall[j] ? 1 : 0; }
  };
  const seen = new Uint16Array(N * 5), any = new Uint16Array(N), from = new Int32Array(N * 5), good = new Uint8Array(N * 5), stk = new Int32Array(N * 5);
  let st = 0;
  const search = (sx, sy) => {
    if (++st > 65000) { seen.fill(0); any.fill(0); st = 1; }
    let sp = 0, cur = -1, hit = -1, jLim = N;   // (a busca não desce mais de 40 abaixo do começo: voltar não pede isso)
    const push = (j, r) => { if (j >= jLim || !Ok[j]) return; if (Sa[j + WW] || La[j] || La[j - WW]) r = 4; const k = j * 5 + r; if (seen[k] === st) return; seen[k] = st; from[k] = cur; any[j] = st; stk[sp++] = k; if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1) && !L(sx, y)) y++;
    if (y <= Y0 || y >= YB) return false;
    jLim = Math.min(N, (y + 41 - Y0) * WW); push((y - Y0) * WW + sx, 4);
    const goal = (S0 - 2 - Y0) * WW;
    while (sp) {
      if (hit >= 0) return win(hit);
      const k = stk[--sp], j = (k / 5) | 0, r = k - j * 5; cur = k; if (j < goal) return win(cur);
      const x = j % WW, row = j - x, gr = Sa[j + WW] || La[j], rs = r === 4 && !gr ? 0 : r;
      // (a pilha tira o último primeiro: descer entra antes e subir por último, a busca tenta subir antes de tudo)
      if (!Sa[j + WW]) push(j + WW, La[j + WW] ? 4 : 0);
      push(row + (x === 0 ? WW - 1 : x - 1), rs); push(row + (x === WW - 1 ? 0 : x + 1), rs);
      if (r > 0) push(j - WW, La[j] || La[j - WW] ? 4 : r === 4 ? 3 : r - 1);
    }
    return hit >= 0 ? win(hit) : false;
  };
  const soft = t => t === EL_SOLO || t === EL_MARMORE || t === EL_LAVRADA || t === EL_ENREDADO || t === EL_PEDRA_POCO || t === EL_TABUA || t === EL_FOLHAGEM;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (any[(y - Y0) * WW + x] !== st || !S(x, y + 1) || elKeep.has(I(x, y)) || inElHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && any[(t - Y0) * WW + sx] !== st) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !elKeep.has(I(x, t)) && !inElHall(x, t, 4) && ok(x, t - 1) && any[(t - 1 - Y0) * WW + x] !== st && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = EL_ESCADA; if (!walls[i]) walls[i] = WEL_MATA; } }
    refresh(x, top, bot);
    return true;
  };
  // os estados que já sobem até a boca, de uma vez: uma busca de trás para frente a partir das linhas de cima (antes,
  // cada começo andava pela camada inteira atrás da boca); a busca de cada começo acha um destes logo no primeiro passo
  {
    const q = stk;   // (a pilha das buscas ainda está livre)
    const norm = (j, r) => Sa[j + WW] || La[j] || La[j - WW] ? 4 : r;
    let qh = 0, qt = 0;
    const mark = k => { good[k] = 1; q[qt++] = k; };
    for (let j = WW; j < (S0 - 2 - Y0) * WW; j++) if (Ok[j]) for (let r = 0; r < 5; r++) mark(j * 5 + r);
    while (qh < qt) {
      const k = q[qh++], j = (k / 5) | 0, r = k - j * 5, x = j % WW, row = j - x;
      for (const pj of [row + (x === 0 ? WW - 1 : x - 1), row + (x === WW - 1 ? 0 : x + 1)]) {   // de lado
        if (!Ok[pj]) continue; const gr = Sa[pj + WW] || La[pj];
        for (let rp = 0; rp < 5; rp++) if (!good[pj * 5 + rp] && norm(j, rp === 4 && !gr ? 0 : rp) === r) mark(pj * 5 + rp);
      }
      { const pj = j + WW;   // subindo, de baixo
        if (pj < N && Ok[pj]) for (let rp = 1; rp < 5; rp++) if (!good[pj * 5 + rp] && norm(j, La[pj] || La[j] ? 4 : rp === 4 ? 3 : rp - 1) === r) mark(pj * 5 + rp); }
      { const pj = j - WW;   // caindo, de cima
        if (pj >= WW && Ok[pj] && norm(j, La[j] ? 4 : 0) === r) for (let rp = 0; rp < 5; rp++) if (!good[pj * 5 + rp]) mark(pj * 5 + rp); }
    }
  }
  const starts = [];
  if (elBoss) for (const D of elBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of elHalls) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of elGrottos) starts.push([Math.round(c.cx), c.fy ? c.fy - 1 : Math.round(c.cy)]);
  for (const X of elExits) starts.push([X.x0 + 2, X.top - 1]);
  for (const H of elBridges) starts.push([Math.round(H.cx), H.fy - 1]);
  starts.sort((a, b) => a[1] - b[1]);   // de cima para baixo: as de baixo acham logo o caminho bom das de cima
  let fixes = 0, ns = 0;
  for (const [x, y] of starts) { if (SOLID[tiles[I(x, y)]]) continue; for (let k = 0; k < 12 && (ns++, !search(W1(x), y)); k++) { if (!repair()) break; fixes++; } }
  elClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (252): por faixa, no chão, debaixo do teto e na parede. As flags do 252 decidem onde cada um
   pode ficar (clareira: só nas clareiras e nos bosques; salao: só nos salões lavrados; ruina: só nos salões enredados;
   gruta: só nas grutas da lua). Nunca sobre escada, cipó, espinho ou água; nunca no pouso nem no Espelho ---------- */
function elPlaceProps() {
  if (typeof EL_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b3c7);
  const S0 = EL_S0, YB = Math.min(WH - 8, S0 + EL_D), used = new Uint8Array(WW * WH * 2), BF = typeof EL_BACK_FLOOR !== 'undefined' ? EL_BACK_FLOOR : {};
  const B = elBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const halls = elHalls.filter(H => !H.ruin), ruins = elHalls.filter(H => H.ruin);
  const where = (def, x, y) => (!def.clareira || inside(elGlades, x, y)) && (!def.salao || inside(halls, x, y)) && (!def.ruina || inside(ruins, x, y)) && (!def.gruta || inside(elGrottos, x, y));
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || elKeep.has(i) || wet(i) || inBox(W1(x), y, 1) || inElLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && EL_SOILS[t] && t !== EL_FOLHAGEM; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = EL_BAND_NAMES[clamp(elfosBand(y), 0, 3)], plan = EL_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || wet(i) || inBox(W1(k), y, 2) || inElLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : (soil(k, y - 1) || tiles[I(k, y - 1)] === EL_FOLHAGEM); };   // a copa da mata segura o que pende
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

// a ordem: a camada, o Espelho (256: elDress), as bocas e a subida, a água; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('elfos', () => {
  if (!ELFOS) return;
  try { elBuild(); elAfter(); if (typeof elDress === 'function') elDress(); elExitClear(); elClimbFix(); elWater(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada atrás do Reino: a mata ao longe com a Lua Presa na Mata, os salões ao longe nos Salões
   e na Corte, as raízes da Árvore-Mãe nas Grutas ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!ELFOS) return;
  const Y1 = Math.min(WH, EL_S0 + EL_D + 4);
  for (let y = Math.max(EL_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - EL_S0) + (depthNz(x, y, 25, seed ^ 0x5e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x5e12);
    DEEPT[i] = d < EL_BANDS[1] ? DP_EL_MATA : d < EL_BANDS[2] ? (n > 0.7 ? DP_EL_MATA : DP_EL_SALOES) : d < EL_BANDS[3] ? (n > 0.6 ? DP_EL_RAIZES : DP_EL_SALOES) : (n > 0.75 ? DP_EL_SALOES : DP_EL_RAIZES);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (ELFOS && ty >= EL_S0 && ty < EL_S0 + EL_D) return EL_ZONE0 + clamp(elfosBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6, revista no revamp de 2026-10-21)
Object.assign(CATH_SPAWN, {
  [EL_ZONE0]: [[['fronteira', 4], ['arqueiro', 3], ['fatuo', 3], ['caofada', 2], ['silfide', 2]], 8],
  [EL_ZONE0 + 1]: [[['fronteira', 3], ['arqueiro', 3], ['guardiao', 3], ['silfide', 2], ['carpideira', 2]], 9],
  [EL_ZONE0 + 2]: [[['cavespinho', 3], ['mascarada', 3], ['musa', 2], ['carpideira', 2], ['guardiao', 2]], 9],
  [EL_ZONE0 + 3]: [[['fatuo', 3], ['caofada', 2], ['silfide', 2], ['mascarada', 2], ['musa', 2], ['carpideira', 2]], 10]
});
// tipos que ainda não existem saem da tabela (o 253 e o 254 registram os elfos)
for (let z = EL_ZONE0; z < EL_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const EL_NO_SPAWN = (tx, ty) => inElLand(tx, ty, 3) || inElHall(tx, ty, 4) || elExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
// níveis 46 a 50 (layerLvl no 52, a posição no 129); nada nasce no posto de guarda, no Espelho nem nas raízes fundas
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!ELFOS || !e || e.boss || (D && D.boss) || e.elMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - EL_S0;
  if (d >= 0 && d < EL_D) {
    if (zone >= EL_ZONE0 && zone <= EL_ZONE0 + 3 && EL_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.elVoid = true; return e; }
    const lvl = layerLvl(layerLo('elfos'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].elVoid) enemies.splice(k, 1); });

/* ---------- partículas: folhas de prata caindo e pólen de luz na Mata, poeira de luar nos Salões, pétalas escuras
   caindo e esporos verde-pálidos subindo na Corte, faíscas azuis subindo das Grutas ---------- */
HOOK.update.push(dt => {
  if (!ELFOS || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = elfosBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 0 ? 6 : 4)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0) parts.push(Math.random() < 0.55 ? { x, y, vx: rnd(-8, 8), vy: rnd(4, 10), g: 0, life: 3.5, max: 3.5, col: Math.random() < 0.5 ? '#c8dcec' : '#8ab4cc', size: 1 } : { x, y, vx: rnd(-2, 2), vy: rnd(-4, -1), g: 0, life: 2.5, max: 2.5, col: '#e6f2ff', size: 1 });
    else if (b === 1) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(-1, 2), g: 0, life: 3, max: 3, col: Math.random() < 0.6 ? '#dce8f8' : '#9cc8ff', size: 1 });
    else if (b === 2) parts.push(Math.random() < 0.6 ? { x, y, vx: rnd(-6, 6), vy: rnd(3, 7), g: 1, life: 3.4, max: 3.4, col: Math.random() < 0.6 ? '#662450' : '#4c183c', size: 1 } : { x, y, vx: rnd(-2, 2), vy: rnd(-7, -2), g: -0.5, life: 2.4, max: 2.4, col: Math.random() < 0.6 ? '#b8f0c8' : '#8ce0a8', size: 1 });
    else parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(-9, -3), g: -1, life: 2.6, max: 2.6, col: Math.random() < 0.6 ? '#9cc8ff' : '#e6f2ff', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a lunarita na fornalha (257 tem os itens), as lojas ---------- */
FURN.min_lunarita = { bar: 'barra_lunarita', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_lunarita: 58, barra_lunarita: 470, folha_prata: 12, asa_silfide: 26, essencia_fatua: 30, pelo_caofada: 28, rosa_negra: 120, lagrima_carpideira: 34 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'folha_prata' || id === 'lagrima_carpideira'; c.hint = c.hint.replace(/\.$/, '') + ', folhas de prata e lágrimas de carpideira.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_lunarita', 'barra_lunarita', 'pelo_caofada'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', lunarita e pelo de cão-fada.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || ['asa_silfide', 'essencia_fatua', 'rosa_negra'].includes(id); if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ', asas de sílfide, essência fátua e rosas negras.'; } }
