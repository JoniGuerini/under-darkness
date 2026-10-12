'use strict';

/* ================= os Salões do Pesadelo: o mundo (docs/camadas/14-saloes-pesadelo.md, seção 3) =================
   A camada logo acima do Abismo (psAbove, 300). Em cima, a Casa que Não Era: cômodos de uma casa soltos dentro da
   pedra-sono, ligados por túneis redondos; depois os Corredores Sem Fim de azulejo, com os corredores em laço; os
   Quartos Esquecidos, macios, cada um com uma cama e um Adormecido; e no fundo a Galeria dos Espelhos, com o Salão dos
   Espelhos do Sem-Rosto e as duas Portas Quentes que descem para o Abismo. Em passos:
     1. a rocha por faixa: a rocha de cima afina nas 6 últimas linhas e vira pedra-sono; pedra-sono com bolsões de
        acolchoado e penas nos Quartos e placas de vidro de espelho na Galeria; assoalho queimado no fundo
     2. as salas: as duas Escadas que Afundam (o vão com a escada de mão torta até o teto da câmara de pouso 10 x 6), o
        Salão dos Espelhos (48 x 18 por dentro) do outro lado do mundo e os corredores até as portas, as duas Portas
        Quentes (salões com o poço de 4 até a última linha), os cômodos da Casa (1 em 4 do tamanho errado), os
        corredores, os corredores em laço (3 trechos iguais e o quarto-prêmio no fim), os quartos, os salões da
        Galeria, as grutas moles e os quartos que não existem (casca de O Nada, sem ligação)
     3. as ligações: túneis redondos na Casa e nos Quartos, galerias retas nos Corredores e na Galeria, escadarias entre
        as faixas
     4. as cascas: assoalho, parede forrada e papel de parede nos cômodos; azulejo e tijolo mole nos corredores;
        acolchoado nos quartos; vidro de espelho na Galeria; assoalho queimado nas últimas 8 linhas
     5. os veios: carvão na pedra-sono; onirita só em volta das camas (a regra da onirita, 306)
   Depois (psAfter): tudo alcançável das descidas sem portas nem laços, escada torta ou lençóis em todo desnível de 5, a
   decoração de 1 bloco, as camas, as portas, os laços e os objetos (302). Por fim as bocas e a subida garantida.
   A geração roda dentro do abBuild do Abismo (embrulhado aqui): depois de todas as outras camadas, logo antes dele.
   Também: a terceira camada, as zonas 73 a 76, o spawn e o nível pela posição no 129, as partículas e a onirita na
   fornalha e nas lojas. */

const PS_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [PS_SONO, PS_ASSOALHO, PS_FORRADA, PS_TIJOLO, PS_AZULEJO, PS_ACOLCHOADO, PS_PENAS, PS_ESPELHO, PS_QUEIMADO, PS_O_CARVAO, PS_O_ONIRITA, PS_VEIO_DESFEITO]) PS_SOILS[t] = 1;
let psChambers = [], psGal = [], psCorr = [], psCaves = [], psDoors = [], psUpClimb = CHAIN;
const PS_CLIMB = t => t === PS_ESCADA || t === PS_CORDA || t === CHAIN || t === psUpClimb;
const psYB = () => Math.min(WH - 8, PS_S0 + PS_D);
// o corredor em laço (os 3 trechos) e o quarto-prêmio no fim
const psLpTop = L => L.top - 1, psLpBot = L => L.fy, psPzTop = L => L.prize ? L.prize.top - 1 : L.top - 1, psPzBot = L => L.prize ? L.prize.fy : L.fy;
const inPsLoop = (tx, ty, m = 0) => { const Q = psNear(psLoops, 'psIdxL', psLpTop, psLpBot, ty, m); return !!Q && Q.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.n * L.L + m && ty >= L.top - 1 - m && ty <= L.fy + m); };
const inPsPrize = (tx, ty, m = 0) => { const Q = psNear(psLoops, 'psIdxP', psPzTop, psPzBot, ty, m); return !!Q && Q.some(L => L.prize && wdx(tx - L.prize.x0) >= -1 - m && wdx(tx - L.prize.x0) <= L.prize.w + m && ty >= L.prize.top - 1 - m && ty <= L.prize.fy + m); };

function psBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = psAbove(); psUpClimb = A.climb || CHAIN;
  PS_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = PS_S0, YB = Math.min(WH - 8, S0 + PS_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7a51), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < PS_BANDS[1] ? 0 : d < PS_BANDS[2] ? 1 : d < PS_BANDS[3] ? 2 : 3;
  // cada faixa tem LAYER_K andares da altura de uma faixa antiga: as ligações correm por andar, e de um andar ao de baixo
  const tierOf = y => { const d = clamp(y - S0, 0, DB - 1), b = bandOf(d), hb = (PS_BANDS[b + 1] - PS_BANDS[b]) / LAYER_K; return b * LAYER_K + Math.min(LAYER_K - 1, Math.floor((d - PS_BANDS[b]) / hb)); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  psChambers = []; psGal = []; psCorr = []; psCaves = []; psDoors = [];
  psEntries = []; psLand = []; psExits = []; psBoss = null; psRooms = []; psHalls = []; psBeds = []; psLoops = []; psNowhere = []; psKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 6; y < S0; y++) {   // a rocha de cima afina e entorta nas últimas 6 linhas
      const i = y * WW + x, k = (y - (S0 - 6)) / 6, h = nz(x, y, 10, 0x7b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.9) tiles[i] = PS_SONO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = PS_SONO; walls[i] = WPS_SONO; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 22, 0x7b3) - 0.5) * 12, b = bandOf(Math.max(0, d)), n1 = () => nz(x, y, 30, 0x7a1), n2 = () => nz(x, y, 16, 0x7a2);   // cada ruído só onde a faixa lê
      let tt = PS_SONO, w = WPS_SONO;
      if (b === 1) { if (n2() > 0.8) tt = PS_TIJOLO; }
      else if (b === 2) { if (n1() > 0.7) tt = PS_PENAS; else if (n2() > 0.74) tt = PS_ACOLCHOADO; }
      else if (b === 3) { if (n2() > 0.74) { tt = PS_ESPELHO; w = WPS_ESPELHO; } if (y >= YB - 8 && n1() > 0.45) tt = PS_QUEIMADO; }
      tiles[i] = tt; walls[i] = w;
      if (agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => psChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // sala reta: ar de fy - h a fy - 1, chão em fy; `soft` arredonda os cantos de cima (os quartos)
  const room = (x0, fy, w, h, soft = 0) => {
    for (let x = x0; x < x0 + w; x++) {
      const e = Math.min(x - x0, x0 + w - 1 - x), cut = soft && e < soft ? Math.round((soft - e) * (soft - e) / soft * 0.8) : 0;
      for (let y = fy - h + cut; y < fy; y++) dig(x, y); hard(x, fy);
    }
  };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (nz(x, y, 36, s) - 0.5) * 0.2) dig(x, y);   // bordas moles, sem degrau
    }
  };
  // túnel redondo: anda para o alvo com curvas suaves
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1200; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.6 + Math.sin(n * 0.07 + s) * 0.35;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  // galeria: corredor reto de 5 no chão fa e, se o destino for outro chão, uma escadaria (um degrau a cada 2 colunas)
  const gallery = (xa, fa, xb, fb, list) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, steps = Math.abs(fb - fa), flat = Math.max(0, Math.abs(d) - steps * 2);
    let x = xa, f = fa;
    for (let k = 0; k <= flat; k++, x += s) { for (let y = f - 5; y < f; y++) dig(x, y); hard(x, f); }
    if (list && flat > 6) list.push({ x0: W1(s > 0 ? xa : xa - flat), len: flat + 1, fy: fa });
    const fs = fb > fa ? 1 : -1;
    for (let k = 0; k < steps * 2; k++, x += s) { if (k % 2 === 1) f += fs; for (let y = f - 5; y < f; y++) dig(x, y); hard(x, f); }
  };
  const sealBox = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) seal[I(x, y)] = 1; };
  const open = (x, y) => { const i = I(x, y); seal[i] = 0; if (canCarve(x, y)) { cv[i] = 1; keep[i] = 1; } };

  // ---------- 2a. as duas Escadas que Afundam: do poço de cima, um vão com a escada torta até o teto do pouso ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: ((R() * WW) | 0), fy: S0 - 2 });
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 22 + ((R() * 5) | 0), S0 + 12, S0 + mb(30));
      const hx = xs - 3 - (side > 0 ? 0 : 1);   // o vão abre no teto do pouso (10 x 6), perto do meio
      sealBox(hx - 1, landFy - 7, hx + 10, landFy + 1);
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 10; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 10 : hx - 1;
      for (let y = landFy - 4; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 10, h: 6, door: W1(door), side, sx: xs };
      psLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // um cômodo logo depois da porta: o primeiro pedaço da Casa que o herói vê
      const w = 14 + ((R() * 6) | 0), h = 7, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'comodo', x0: W1(x0), fy: landFy, top: landFy - h };
      psRooms.push(H); psChambers.push(H);
      psChambers.push({ cx: hx + 5, cy: landFy - 3, w: 10, h: 6, band: 0, kind: 'pouso', nolink: true });
      psEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. o Salão dos Espelhos, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 48, h = 18;
    const ax = psEntries.length ? psEntries.reduce((s, e) => s + wdx(e.x0 - psEntries[0].x0), 0) / psEntries.length + psEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 14, S0 + mb(172)), top = fy - h;   // longe das linhas que o Abismo afina
    const x0 = W1(cx - 24), x1 = W1(cx + 23);
    psBoss = { cx, x0, x1, w, h, top, fy, doors: [{ side: -1, x: W1(cx - 26), fy }, { side: 1, x: W1(cx + 25), fy }] };
    sealBox(cx - 28, top - 4, cx + 27, fy + 4);
    psChambers.push({ cx, cy: fy - h / 2, w: w + 8, h: h + 8, band: 3, boss: true, nolink: true });
    for (const D of psBoss.doors) {
      const len = 18 + ((R() * 10) | 0);
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) { for (let y = D.fy - 4; y < D.fy; y++) open(x, y); hard(x, D.fy); psKeep.add(I(x, D.fy)); x += D.side; }
      psCorr.push({ x0: D.side > 0 ? W1(D.x + 1) : W1(D.x - len), len, fy: D.fy, boss: true });
      psChambers.push({ cx: D.x + D.side * len / 2, cy: D.fy - 2, w: len, h: 4, band: 3, kind: 'servico', nolink: true });
      // um salão da Galeria no fim do corredor
      const gw = 26 + ((R() * 8) | 0), gh = 10, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      room(gx0, D.fy, gw, gh);
      const C = { cx: gx0 + gw / 2, cy: D.fy - gh / 2, w: gw, h: gh, band: 3, kind: 'galeria', x0: W1(gx0), fy: D.fy, top: D.fy - gh };
      psGal.push(C); psHalls.push(C); psChambers.push(C);
    }
  }
  const awayFromBoss = (cx, cy, m) => !psBoss || Math.abs(wdx(cx - psBoss.cx)) > psBoss.w / 2 + 6 + m || cy < psBoss.top - 6 - m || cy > psBoss.fy + 6 + m;

  // ---------- 2c. as Portas Quentes: dois salões da Galeria com o poço de 4 até a última linha ----------
  for (let tries = 0; psExits.length < 2 && tries < 600; tries++) {
    const w = 28 + ((R() * 8) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 15 - ((R() * 8) | 0);   // o poço tem o mesmo tamanho de antes
    if (!awayFromBoss(cx, fy, 60) || psExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'galeria', x0: W1(x0), fy, top: fy - h, exit: true };
    psGal.push(C); psHalls.push(C); psChambers.push(C);
    const sx = W1(cx - 2);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 4; x++) seal[I(x, y)] = x >= sx && x < sx + 4 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 4; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    psExits.push({ x0: sx, x1: W1(sx + 3), cx: W1(cx), w: 4, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. os corredores em laço: 3 trechos iguais e, no fim, o quarto-prêmio (1 na Casa e 1 nos Corredores, vezes WSC) ----------
  for (const [band, n] of [[0, WSC * LAYER_K], [1, WSC * LAYER_K]]) {
    const lo = PS_BANDS[band] + (band ? 12 : 20), hi = PS_BANDS[band + 1] - 8;
    for (let k = 0, tries = 0; k < n && tries < 300 * LAYER_K; tries++) {
      const L = 24 + ((R() * 4) | 0), len = 3 * L, pw = 14, ph = 8, ent = 8;   // um trecho maior que meia tela: a emenda nunca aparece
      const x0 = (R() * WW) | 0, fy = S0 + lo + ((R() * (hi - lo)) | 0), cx = x0 + (len + pw - ent) / 2;
      if (fy - 16 < S0 + 2 || busy(cx, fy - 2, len + pw + ent + 4, 30, 8) || !awayFromBoss(cx, fy, len)) continue;
      // a antessala (liga com o resto), o corredor selado com a rocha em volta, o quarto-prêmio selado
      sealBox(x0 - 1, fy - 15, x0 + len + pw, fy + 13);
      for (let x = x0; x < x0 + len; x++) { for (let y = fy - 5; y < fy; y++) open(x, y); hard(x, fy); }
      for (let x = x0 + len; x < x0 + len + pw; x++) { for (let y = fy - ph; y < fy; y++) open(x, y); hard(x, fy); }
      const ax0 = x0 - ent; room(ax0, fy, ent, 6);
      for (let y = fy - 5; y < fy; y++) open(x0 - 1, y);
      const Ant = { cx: ax0 + ent / 2, cy: fy - 3, w: ent, h: 6, band, kind: band ? 'corredor' : 'comodo', x0: W1(ax0), fy, top: fy - 6 };
      psChambers.push(Ant); (band ? psHalls : psRooms).push(Ant);
      psChambers.push({ cx: x0 + (len + pw) / 2, cy: fy - 1, w: len + pw, h: 30, band, kind: 'laco', nolink: true });
      const prize = { x0: W1(x0 + len), w: pw, top: fy - ph, fy, cx: x0 + len + pw / 2, cy: fy - ph / 2, h: ph, band, kind: 'premio' };
      psLoops.push({ id: psLoops.length, x0: W1(x0), L, n: 3, fy, top: fy - 5, band, prize });
      k++;
    }
  }

  // ---------- 2e. a Casa que Não Era: cômodos retos, 1 em 4 do tamanho errado ----------
  for (let k = 0, tries = 0; k < 10 * WSC * LAYER_K && tries < 600 * LAYER_K; tries++) {
    const big = k % 4 === 3, w = big ? 26 + ((R() * 10) | 0) : 12 + ((R() * 13) | 0), h = big ? 12 + ((R() * 4) | 0) : 6 + ((R() * 5) | 0);
    const x0 = (R() * WW) | 0, fy = S0 + 8 + h + ((R() * (PS_BANDS[1] - 10 - h)) | 0);
    if (fy - h < S0 + 3 || busy(x0 + w / 2, fy - h / 2, w, h, 6)) continue;
    room(x0, fy, w, h);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'comodo', x0: W1(x0), fy, top: fy - h, big };
    psRooms.push(H); psChambers.push(H); k++;
  }
  // ---------- 2f. os Corredores Sem Fim: retos e compridos, de azulejo ----------
  for (let k = 0, tries = 0; k < 6 * WSC * LAYER_K && tries < 600 * LAYER_K; tries++) {
    const len = 40 + ((R() * 41) | 0), h = 4 + ((R() * 2) | 0), x0 = (R() * WW) | 0, fy = S0 + PS_BANDS[1] + 8 + ((R() * (PS_BANDS[2] - PS_BANDS[1] - 12)) | 0);
    if (busy(x0 + len / 2, fy - 3, len, h, 4)) continue;
    room(x0, fy, len, h);
    const C = { cx: x0 + len / 2, cy: fy - h / 2, w: len, h, band: 1, kind: 'corredor', x0: W1(x0), fy, top: fy - h, len };
    psHalls.push(C); psChambers.push(C); k++;
  }
  // ---------- 2g. os Quartos Esquecidos: grutas macias com a cama no meio ----------
  for (let k = 0, tries = 0; k < 6 * WSC * LAYER_K && tries < 600 * LAYER_K; tries++) {
    const w = 16 + ((R() * 15) | 0), h = 10 + ((R() * 7) | 0), x0 = (R() * WW) | 0, fy = S0 + PS_BANDS[2] + 8 + h + ((R() * (PS_BANDS[3] - PS_BANDS[2] - 10 - h)) | 0);
    if (busy(x0 + w / 2, fy - h / 2, w, h, 7) || !awayFromBoss(x0 + w / 2, fy, w)) continue;
    room(x0, fy, w, h, 4);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'quarto', x0: W1(x0), fy, top: fy - h };
    psRooms.push(H); psChambers.push(H); k++;
  }
  // ---------- 2h. a Galeria dos Espelhos: salões largos ----------
  for (let k = 0, tries = 0; k < 4 * WSC * LAYER_K && tries < 600 * LAYER_K; tries++) {
    const w = 30 + ((R() * 21) | 0), h = 10 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = S0 + PS_BANDS[3] + 4 + h + ((R() * (DB - 14 - PS_BANDS[3] - 4 - h)) | 0);
    if (fy - h < S0 + PS_BANDS[3] + 1 || busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 4)) continue;
    room(x0, fy, w, h);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'galeria', x0: W1(x0), fy, top: fy - h };
    psGal.push(C); psHalls.push(C); psChambers.push(C); k++;
  }
  // ---------- 2i. grutas moles (a rocha que cedeu): 4 por faixa, vezes WSC ----------
  for (let b = 0; b < 4; b++) for (let k = 0, tries = 0; k < 4 * WSC * LAYER_K && tries < 300 * LAYER_K; tries++) {
    const w = 12 + ((R() * 14) | 0), h = 7 + ((R() * 6) | 0), cx = (R() * WW) | 0, cy = S0 + PS_BANDS[b] + 4 + h / 2 + R() * Math.max(0, PS_BANDS[b + 1] - PS_BANDS[b] - 8 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0x7d00 + b * 50 + k, 1.6);
    const C = { cx, cy, w, h, band: b, kind: 'gruta', fy: Math.round(cy + h / 2) };
    psCaves.push(C); psChambers.push(C); k++;
  }
  // ---------- 2j. os quartos que não existem: 12 x 8 dentro da rocha, sem ligação, casca de O Nada ----------
  const NKIND = ['dormente', 'monstro', 'casa'];
  for (let k = 0, tries = 0; k < 6 * WSC * LAYER_K && tries < 800 * LAYER_K; tries++) {
    const w = 12, h = 8, b = tries % 4, x0 = (R() * WW) | 0, fy = S0 + PS_BANDS[b] + 4 + h + ((R() * Math.max(1, PS_BANDS[b + 1] - PS_BANDS[b] - 10 - h)) | 0);
    if (fy >= YB - 12 || busy(x0 + w / 2, fy - h / 2, w + 4, h + 4, 6) || !awayFromBoss(x0 + w / 2, fy, 20)) continue;
    sealBox(x0 - 2, fy - h - 2, x0 + w + 1, fy + 2);
    const N = { x0: W1(x0), w, h, top: fy - h, fy, cx: x0 + w / 2, cy: fy - h / 2, band: b, kind: NKIND[k % 3], id: psNowhere.length };
    psNowhere.push(N); psChambers.push({ cx: N.cx, cy: N.cy, w: w + 4, h: h + 4, band: b, kind: 'nada', nolink: true });
    k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  const NT_ = 4 * LAYER_K, tierL = [];
  for (let t = 0; t < NT_; t++) tierL.push([]);
  for (const c of psChambers) if (!c.nolink && !c.boss) tierL[tierOf(mouth(c))].push(c);
  for (let t = 0; t < NT_; t++) {
    const b = (t / LAYER_K) | 0, L = tierL[t].sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (b === 1 || b === 3) gallery(ax, ay, bx, by, psCorr);
      else worm(ax, ay - 2, bx, by - 2, 1.6, 0x7700 + t * 90 + k);   // túneis redondos e largos
    }
  }
  // de um andar ao de baixo: o túnel desce em diagonal (o destino fica de lado, nunca bem embaixo: nada de poço) e a
  // escadaria anda um degrau a cada 2 colunas
  const slant = (P, D) => { const ay = mouth(P); let Q = null, qd = 1e9; for (const c of D) { const dy = Math.max(6, mouth(c) - ay), dx = Math.abs(wdx(c.cx - P.cx)), e = dx < dy * 1.2 ? 400 + dy * 1.2 - dx : Math.abs(dx - dy * 1.6); if (e < qd) { qd = e; Q = c; } } return Q; };
  for (let t = 0; t < NT_ - 1; t++) {
    const U = tierL[t], D = tierL[t + 1];
    for (let k = 0; k < 2 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = slant(P, D);
      const [ax, ay] = ends(P, wdx(Q.cx - P.cx) > 0); worm(ax, ay - 2, Q.cx, mouth(Q) - 2, 1.5, 0x77f0 + t * 9 + k);
    }
    for (let k = 0, tries = 0; k < 2 * WSC && tries < 80; tries++) {
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
      const comp = []; let opn = true; sl[i0] = 1; st.push(i0);
      while (st.length) { const c = st.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN || cv[nb] || sl[nb]) continue; const ny = (nb / WW) | 0; if (!canCarve(nb % WW, ny)) { opn = false; continue; } sl[nb] = 1; st.push(nb); } if (comp.length > 30) opn = false; }
      if (opn && comp.length < 6 && !comp.some(c => seal[c] || keep[c])) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 40) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 4. as cascas ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && PS_SOILS[tiles[i]] && !psKeep.has(i) && !inPsHall(W1(x), y, 3)) tiles[i] = t; };
  const airAround = (x, y) => !SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)] || !SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)];
  const lining = (x0, y0, x1, y1, t, w, floorT, ceilT, wLow) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (inPsHall(W1(x), y, 3) || y < S0 || y >= YB - 1) continue;
      if (SOLID[tiles[i]]) { if (airAround(x, y) || hash2(W1(x), y, seed ^ 0x71) < 0.5) shell(x, y, floorT && !SOLID[at(x, y - 1)] ? floorT : ceilT && !SOLID[at(x, y + 1)] ? ceilT : t); }
      else walls[i] = wLow && y >= y1 - 3 ? wLow : w;
    }
  };
  for (const H of psRooms) {
    if (H.kind === 'quarto') lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, PS_ACOLCHOADO, WPS_PAPEL, PS_ASSOALHO, PS_ACOLCHOADO);
    else lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, PS_FORRADA, WPS_PAPEL, PS_ASSOALHO, PS_FORRADA, WPS_LAMBRI);
  }
  for (const H of psHalls) {
    if (H.kind === 'galeria') lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, PS_ESPELHO, WPS_ESPELHO, H.fy >= YB - 9 ? PS_QUEIMADO : PS_ASSOALHO, PS_ESPELHO);
    else lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, PS_TIJOLO, WPS_AZULEJO, PS_AZULEJO, PS_AZULEJO);
  }
  // as galerias de ligação: chão e teto de azulejo nos Corredores, de espelho e assoalho na Galeria
  for (const Q of psCorr) {
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j;
      for (let y = Q.fy - 6; y <= Q.fy; y++) {
        const i = I(x, y); if (inPsHall(W1(x), y, 1) || y < S0 + 1 || y >= YB - 1) continue;
        const b = pesadeloBand(y);
        if (!SOLID[tiles[i]]) { walls[i] = b >= 3 ? WPS_ESPELHO : b === 1 ? WPS_AZULEJO : walls[i]; continue; }
        if ((y === Q.fy || y === Q.fy - 6) && PS_SOILS[tiles[i]] && !psKeep.has(i)) tiles[i] = b === 1 ? PS_AZULEJO : b >= 3 ? (y === Q.fy ? (Q.fy >= YB - 9 ? PS_QUEIMADO : PS_ASSOALHO) : PS_ESPELHO) : tiles[i];
      }
    }
  }
  // os túneis e as grutas da Casa ganham pedaços de papel de parede: a casa vazou para a rocha
  for (const C of psCaves) if (C.band === 0 && hash2(C.cx | 0, C.fy, seed ^ 0x72) < 0.5) for (let y = Math.floor(C.cy - C.h / 2); y <= C.fy; y++) for (let x = Math.floor(C.cx - C.w / 2); x <= C.cx + C.w / 2; x++) { const i = I(x, y); if (!SOLID[tiles[i]] && nz(x, y, 8, 0x7e1) > 0.55) walls[i] = WPS_PAPEL; }
  // o assoalho queimado nas últimas 8 linhas: todo chão aberto vira tábua preta com rachas
  for (let y = YB - 9; y < YB - 1; y++) for (let x = 0; x < WW; x++) { const i = I(x, y); if (SOLID[tiles[i]] && PS_SOILS[tiles[i]] && !SOLID[tiles[i - WW]] && !psKeep.has(i) && !inPsHall(x, y, 2)) tiles[i] = PS_QUEIMADO; }

  // ---------- o Salão dos Espelhos: a caixa de vidro de espelho, o chão de assoalho escuro, as portas nas pontas ----------
  {
    const B = psBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 27; x <= B.cx + 26; x++) { const i = I(x, y); tiles[i] = PS_ESPELHO; walls[i] = WPS_ESPELHO; if (agua.length) agua[i] = 0; psKeep.add(i); }
    for (let y = B.top; y < B.fy; y++) for (let x = B.cx - 24; x <= B.cx + 23; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WPS_ESPELHO; }
    for (let x = B.cx - 24; x <= B.cx + 23; x++) set(x, B.fy, PS_ASSOALHO);
    for (const D of B.doors) for (let x = Math.min(D.x, B.cx + D.side * 24), x1 = Math.max(D.x, B.cx + D.side * 24); x <= x1; x++) for (let y = D.fy - 4; y < D.fy; y++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WPS_ESPELHO; }
  }
  // ---------- as descidas: a boca vira pedra-sono, o vão com a escada torta; a câmara de pouso ----------
  for (const E of psEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - L.h;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = PS_SONO; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WPS_SONO; psKeep.add(i); }
      // as juntas entortam: laje lisa em cima, pedra-sono embaixo, um degrau fora do lugar de vez em quando
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 + 2 && A.thin && SOLID[A.thin] ? A.thin : PS_SONO; psKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = PS_ESCADA; psKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) psKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 4 && y < L.fy) { tiles[i] = AIR; walls[i] = WPS_PAPEL; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 3)) tiles[i] = y === L.fy ? PS_ASSOALHO : PS_FORRADA;
      else if (!edge) { tiles[i] = W1(x) === W1(x0 + 1) ? PS_ESCADA : AIR; walls[i] = y >= L.fy - 2 ? WPS_LAMBRI : WPS_PAPEL; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? PS_ESCADA : AIR; walls[i] = WPS_SONO; }
      psKeep.add(i);
    }
    // o abajur aceso no canto longe da porta
    const ax = L.side > 0 ? L.x0 + 1 : L.x0 + L.w - 2; if (tiles[I(ax, L.fy - 1)] === AIR) tiles[I(ax, L.fy - 1)] = PS_ABAJUR;
  }
  // ---------- as Portas Quentes: o poço de 4 escurecendo e rachando em vermelho; a escada torta vira corrente ----------
  for (const X of psExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 4; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WPS_SONO; psKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 4]) { const i = I(x, y), k = (y - X.top) / Math.max(1, X.fy - X.top); tiles[i] = k > 0.55 || (k > 0.3 && (y & 3) === 1) ? PS_QUEIMADO : PS_SONO; psKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = y >= X.fy - 6 ? CHAIN : PS_ESCADA; psKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 5; x++) { psKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 3) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = PS_QUEIMADO; } }
    tiles[I(X.x0 + 1, X.fy)] = PS_SONO;
  }
  // ---------- os laços: azulejo idêntico nos 3 trechos, a costura invisível nas emendas; o quarto-prêmio acolchoado ----------
  for (const Lp of psLoops) {
    const { x0, L, fy } = Lp;
    for (let j = -1; j <= Lp.n * L; j++) {
      const x = x0 + j;
      for (let y = fy - 7; y <= fy + 1; y++) {
        const i = I(x, y); psKeep.add(i);
        if (j < 0) { if (y >= fy - 5 && y < fy) { tiles[i] = AIR; walls[i] = WPS_AZULEJO; } else if (y === fy) tiles[i] = PS_AZULEJO; else if (y === fy - 6) tiles[i] = PS_AZULEJO; continue; }
        if (j === Lp.n * L) continue;
        if (y === fy - 7 || y === fy + 1) { tiles[i] = PS_TIJOLO; continue; }
        if (y === fy || y === fy - 6) { tiles[i] = PS_AZULEJO; continue; }
        tiles[i] = AIR; walls[i] = WPS_AZULEJO;
        if (agua.length) agua[i] = 0;
      }
      const m = ((j % L) + L) % L;   // o mesmo desenho em cada trecho
      if (j >= 0 && j < Lp.n * L) { if (m === 0) tiles[I(x, fy - 1)] = PS_COSTURA; if (m === 5) tiles[I(x, fy - 5)] = PS_LAMPADA; if (m === 11) tiles[I(x, fy - 1)] = PS_VELA; }
    }
    const P = Lp.prize;
    for (let y = P.top - 1; y <= P.fy; y++) for (let x = P.x0 - 1; x <= P.x0 + P.w; x++) {
      const i = I(x, y), edge = y === P.top - 1 || y === P.fy || x === P.x0 - 1 || x === P.x0 + P.w;
      if (W1(x) === W1(P.x0 - 1) && y >= fy - 5 && y < fy) { tiles[i] = AIR; walls[i] = WPS_PAPEL; }
      else if (edge) tiles[i] = y === P.fy ? PS_ASSOALHO : PS_ACOLCHOADO;
      else { tiles[i] = AIR; walls[i] = y >= P.fy - 2 ? WPS_LAMBRI : WPS_PAPEL; }
      psKeep.add(i);
    }
    for (let y = P.top - 3; y <= P.fy + 2; y++) for (let x = P.x0 - 2; x <= P.x0 + P.w + 1; x++) psKeep.add(I(x, y));
  }
  // ---------- os quartos que não existem: a casca de O Nada, e dentro um cômodo da Casa ----------
  for (const N of psNowhere) {
    for (let y = N.top - 2; y <= N.fy + 1; y++) for (let x = N.x0 - 2; x <= N.x0 + N.w + 1; x++) {
      const i = I(x, y), edge = y < N.top || y > N.fy || x < N.x0 || x >= N.x0 + N.w;
      if (edge) { tiles[i] = PS_NADA; walls[i] = WPS_SONO; }
      else if (y === N.fy) tiles[i] = PS_ASSOALHO;
      else { tiles[i] = AIR; walls[i] = N.kind === 'casa' ? WPS_LAMBRI : y >= N.fy - 2 ? WPS_LAMBRI : WPS_PAPEL; }
      psKeep.add(i); if (agua.length) agua[i] = 0;
    }
    tiles[I(N.x0 + (N.kind === 'casa' ? 2 : N.w - 2), N.fy - 1)] = N.kind === 'casa' ? PS_VELA : PS_ABAJUR;
  }

  // ---------- as camas (onde dormem os Adormecidos): no meio de todo quarto, em 3 cômodos da Casa por WSC, no prêmio de
  // cada laço e nos quartos que não existem de dormente ----------
  const bedIn = (C, kind) => {
    const tx = Math.round(C.cx) - 2, fy = C.fy;
    for (let x = tx - 1; x < tx + 5; x++) { const i = I(x, fy); if (!SOLID[tiles[i]]) tiles[i] = PS_ASSOALHO; for (let y = fy - 3; y < fy; y++) { const j = I(x, y); if (SOLID[tiles[j]] && !psKeep.has(j)) tiles[j] = AIR; } }
    psBeds.push({ id: psBeds.length, tx: W1(tx), fy, band: C.band, kind, room: C });
  };
  for (const H of psRooms) if (H.kind === 'quarto') bedIn(H, 'quarto');
  { let n = 0; for (const H of psRooms) if (H.kind === 'comodo' && !H.big && H.w >= 12 && n < 3 * WSC * LAYER_K && hash2(H.x0, H.fy, seed ^ 0x73) < 0.45) { bedIn(H, 'comodo'); n++; } }
  for (const Lp of psLoops) bedIn(Lp.prize, 'premio');
  for (const N of psNowhere) if (N.kind === 'dormente') bedIn(N, 'nada');

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0f7c);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !psKeep.has(i) && !inPsHall(W1(x), y, 4)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(PS_O_CARVAO, 26 * WSC * LAYER_K, 0, 178, 3, 8, t => t === PS_SONO);
  // a onirita: só em volta das camas, num raio de 10 (mais grossa no prêmio dos laços)
  const oniHost = t => t === PS_SONO || t === PS_ACOLCHOADO || t === PS_PENAS || t === PS_FORRADA || t === PS_TIJOLO;
  for (const Bd of psBeds) {
    const big = Bd.kind === 'premio', n = big ? 7 : Bd.kind === 'nada' ? 5 : 3 + ((R4() * 2) | 0), cx = Bd.tx + 2, cy = Bd.fy - 2;
    for (let k = 0; k < n; k++) {
      // um ponto na rocha perto da cama: anda do centro para fora até achar pedra
      const a = R4() * Math.PI * 2; let x = cx, y = cy, r = 0;
      while (r < 10 && !(SOLID[tiles[I(Math.round(x), Math.round(y))]] && oniHost(tiles[I(Math.round(x), Math.round(y))]))) { r += 0.7; x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r * 0.8; }
      if (r >= 10) continue;
      x = Math.round(x); y = Math.round(y);
      const len = big ? 5 + ((R4() * 4) | 0) : 2 + ((R4() * 4) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (oniHost(tiles[i]) && !psKeep.has(i) && Math.hypot(wdx(x - cx), y - cy) <= 10 && y < YB - 1) tiles[i] = PS_O_ONIRITA;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y += d === 2 ? 1 : d === 3 ? -1 : 0;
      }
    }
  }
}

// os 3 trechos de cada laço iguais até onde a tela alcança: a rocha em volta também (o trecho 1 é copiado nos outros)
function psLoopCopy() {
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const Lp of psLoops) for (let s = 1; s < Lp.n; s++) for (let j = 0; j < Lp.L; j++) for (let y = Lp.fy - 15; y <= Lp.fy + 13; y++) {
    const a = I(Lp.x0 + j, y), b = I(Lp.x0 + s * Lp.L + j, y); tiles[b] = tiles[a]; walls[b] = walls[a]; if (agua.length) agua[b] = 0; psKeep.add(a); psKeep.add(b);
  }
}

function psAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = PS_S0, YB = psYB(), R3 = mulberry32(seed ^ 0x7d3c1);
  const psRow = y => y >= S0 && y < YB - 1;
  const special = (x, y, m = 0) => inPsLoop(x, y, 1 + m) || inPsPrize(x, y, 1 + m) || inPsNowhere(x, y, 1 + m);
  const dig = (x, y) => { if (!psRow(y)) return; const i = I(x, y); if (psKeep.has(i) || inPsHall(W1(x), y, 3) || special(W1(x), y)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WPS_SONO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const psSolid = t => SOLID[t] && PS_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = psBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;

  // ---------- 1. tudo alcançável das duas descidas (sem portas e sem laços: os quartos que não existem ficam de fora) ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of psEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!psEntries.length && psChambers.length) flood(I(psChambers[0].cx, Math.round(psChambers[0].cy)));
  if (B) for (let y = B.top - 4; y <= B.fy + 4; y++) for (let x = B.cx - 28; x <= B.cx + 27; x++) reach[I(x, y)] = 1;
  for (const N of psNowhere) for (let y = N.top - 3; y <= N.fy + 2; y++) for (let x = N.x0 - 3; x <= N.x0 + N.w + 2; x++) reach[I(x, y)] = 1;
  // os pedaços soltos, contados uma vez só e ligados do maior para o menor (contar de novo a cada passada custava caro)
  const comps = [];
  { const lab = new Uint8Array(NN);
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 16) comps.push(comp);
    }
    comps.sort((a, c) => c.length - a.length); }
  for (let pass = 0; pass < comps.length && pass < 60 * WSC * LAYER_K; pass++) {
    const bestC = comps[pass]; if (bestC.some(c => reach[c])) continue;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inBox(W1(cx + dx), y, 2) || special(W1(cx + dx), y, 1)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    worm(best[0], best[1], best[2], best[3], 1.4, 0x76a0 + pass);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {   // a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = new Int32Array(NN).fill(-1), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || psKeep.has(nb) || psKeep.has(nb - WW) || tiles[nb] === BEDROCK || inBox(nb % WW, (nb / WW) | 0, 2) || special(nb % WW, (nb / WW) | 0, 1)) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada torta (cômodos, corredores, galeria) ou lençóis amarrados (quartos e grutas) em todo desnível de 5 ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3) || special(x, y)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || PS_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (psKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const tt = pesadeloBand(y) === 2 ? PS_CORDA : PS_ESCADA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {   // poços estreitos (3 de largura): escada na coluna da esquerda
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || PS_CLIMB(at(x, y - 1)) || PS_CLIMB(at(x + 1, y)) || inBox(x, y, 3) || special(x, y)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (psKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, PS_ESCADA);
  }

  // ---------- 3. a decoração de 1 bloco ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || psKeep.has(i)) continue;
    const b = pesadeloBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inPsLand(x, y, 1) || special(x, y)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = psSolid(dn) && BLOCKY[dn] && up === AIR, ceil = psSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (b === 0) { if (q < 0.025 && gap >= 4) put(x, y, PS_LAMPADA); else if (q < 0.035) put(x, y, PS_LA); }
      else if (b === 1) { if (q < 0.035 && gap >= 3) put(x, y, PS_LAMPADA); }
      else if (b === 2) { if (q < 0.05) put(x, y, PS_LA); else if (q < 0.07 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, PS_CORDA); } else if (q < 0.075 && gap >= 4) put(x, y, PS_LAMPADA); }
      else { if (q < 0.015 && gap >= 4) put(x, y, PS_LAMPADA); }
      continue;
    }
    if (!floor || PS_CLIMB(at(x - 1, y)) || PS_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    if (dn === PS_QUEIMADO) { if (q < 0.12) put(x, y, PS_BRASA); continue; }
    if (b === 0) { if (q < 0.012) put(x, y, PS_VELA); else if (q < 0.018) put(x, y, PS_ABAJUR); else if (q < 0.03) put(x, y, PS_BRINQUEDO); else if (q < 0.036) put(x, y, PS_DESPERTADOR); else if (q < 0.05) put(x, y, PS_PENA); }
    else if (b === 1) { if (q < 0.008) put(x, y, PS_VELA); else if (q < 0.014) put(x, y, PS_DESPERTADOR); else if (q < 0.02) put(x, y, PS_CACOS); }
    else if (b === 2) { if (q < 0.04) put(x, y, PS_PENA); else if (q < 0.07) put(x, y, PS_BRINQUEDO); else if (q < 0.08) put(x, y, PS_DENTES); else if (q < 0.088) put(x, y, PS_ABAJUR); else if (q < 0.094) put(x, y, PS_VELA); }
    else { if (q < 0.05) put(x, y, PS_CACOS); else if (q < 0.058) put(x, y, PS_VELA); }
  }

  // ---------- 4. os objetos ----------
  psPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function psExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of psEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? PS_ESCADA : AIR; psKeep.add(i); }
}
/* ---------- a subida garantida: do Salão, dos cômodos, dos quartos, das camas e das Portas Quentes o herói tem de
   conseguir voltar às descidas (pulo de 3 blocos; escada e lençóis sobem) ---------- */
function psClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = PS_S0, YB = psYB(), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => PS_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const blocked = (x, y) => inPsHall(x, y) || inPsNowhere(x, y) || inPsLoop(x, y) || inPsPrize(x, y);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || (blocked(x, y) && !(inPsLoop(sx, sy) || inPsPrize(sx, sy)))) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
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
  const soft = t => t === PS_SONO || t === PS_ASSOALHO || t === PS_FORRADA || t === PS_TIJOLO || t === PS_AZULEJO || t === PS_ACOLCHOADO || t === PS_PENAS || t === PS_ESPELHO || t === PS_QUEIMADO;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || psKeep.has(I(x, y)) || inPsHall(x, y, 1) || blocked(x, y)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !psKeep.has(I(x, t)) && !inPsHall(x, t, 3) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = PS_ESCADA; if (!walls[i]) walls[i] = WPS_SONO; } }
    return true;
  };
  const starts = [];
  if (psBoss) for (const D of psBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of psRooms) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of psHalls) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const Bd of psBeds) if (Bd.kind === 'quarto' || Bd.kind === 'comodo') starts.push([Bd.tx - 1, Bd.fy - 1]);
  for (const X of psExits) starts.push([X.x0 + 2, X.top - 1]);
  let fixes = 0, ns = 0;
  for (const [x, y] of starts) { if (SOLID[tiles[I(x, y)]]) continue; for (let k = 0; k < 12 && (ns++, !search(W1(x), y)); k++) { if (!repair()) break; fixes++; } }
  psClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (302): primeiro os que têm lugar marcado (as camas, as portas que levam longe, as Portas
   Quentes, o desenho repetido dos laços), depois o plano por faixa. Flags do 302: comodo (só nos cômodos da Casa),
   quarto (só nos quartos com cama), alto (precisa de n blocos de ar). Nunca sobre escada, lençóis ou água; nunca no
   pouso, no Salão, nos laços nem nos quartos que não existem ---------- */
function psPlaceProps() {
  if (typeof PS_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9c3c7);
  const S0 = PS_S0, YB = psYB(), used = new Uint8Array(WW * WH * 2), BF = typeof PS_BACK_FLOOR !== 'undefined' ? PS_BACK_FLOOR : {};
  const B = psBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const special = (x, y) => inPsLoop(x, y, 1) || inPsPrize(x, y, 1) || inPsNowhere(x, y, 1);
  const inside = (L, x, y) => L.some(C => wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy);
  const comodos = psRooms.filter(H => H.kind === 'comodo'), quartos = psBeds.filter(b => b.kind === 'quarto').map(b => b.room);
  const where = (def, x, y) => (!def.comodo || inside(comodos, x, y)) && (!def.quarto || inside(quartos, x, y));
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir, free) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || (!free && (psKeep.has(i) || special(W1(x), y))) || wet(i) || inBox(W1(x), y, 1) || inPsLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && PS_SOILS[t]; };
  const floorProp = (id, v, tx, fy, layer = 0) => {   // de pé no chão fy, a partir da coluna tx (sem checar: lugar marcado)
    const def = PROP_DEFS[id]; if (!def) return null;
    const V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    mark(tx, fy - th, tw, th, layer);
    const sup = []; for (let k = tx; k < tx + tw; k++) sup.push(I(k, fy));
    return addProp(def, v, W1(tx) * T + ((tw * T - V.w) >> 1), fy * T - V.h, sup);
  };

  // ---------- as camas ----------
  for (const Bd of psBeds) {
    const p = floorProp('ps_cama', Bd.band === 2 || Bd.kind === 'premio' ? 0 : 1, Bd.tx, Bd.fy);
    if (p) { Bd.X = p.X; Bd.Y = p.Y; Bd.p = p; p.psBed = Bd.id; }
  }
  // ---------- as portas que levam longe ----------
  const doorSpots = band => {
    const L = [];
    for (const C of [...psRooms, ...psHalls]) {
      if (C.band !== band || C.exit || C.kind === 'premio') continue;
      for (let x = C.x0 + 2; x < C.x0 + C.w - 3; x += 3) {
        const fy = C.fy; if (!soil(x, fy) || !soil(x + 1, fy)) continue;
        if (!fits(x, fy - 4, 2, 4, 0, true) || psDoors.some(d => Math.abs(wdx(d.x - x)) < 6 && Math.abs(d.fy - fy) < 6) || psLand.some(Ld => Math.abs(wdx(Ld.x0 - x)) < 14 && Math.abs(Ld.fy - fy) < 8)) continue;
        L.push({ x: W1(x), fy, C });
      }
    }
    return L;
  };
  const putDoor = (s, kind, v = 0) => { const p = floorProp('ps_porta', v, s.x, s.fy); mark(s.x, s.fy - 4, 2, 4, 1); const d = { id: psDoors.length, x: s.x, fy: s.fy, kind, to: -1, band: pesadeloBand(s.fy - 1), p }; psDoors.push(d); return d; };
  for (let b = 0; b < 4; b++) {
    // os pares (atalho de ida e volta), de 30 a 200 blocos um do outro
    for (let k = 0, n = (b < 2 ? 2 * WSC : WSC) * LAYER_K; k < n; k++) {
      const S = doorSpots(b); if (S.length < 2) break;
      const a = S[(R() * S.length) | 0], far = S.filter(s => { const d = Math.abs(wdx(s.x - a.x)); return d >= 30 && d <= 200 && s.C !== a.C; });
      if (!far.length) continue;
      const c = far[(R() * far.length) | 0], da = putDoor(a, 'par'), dc = putDoor(c, 'par'); da.to = dc.id; dc.to = da.id;
    }
    // a porta para lugar nenhum (azul): abre e mostra uma parede de tijolo
    if (b < 3) for (let k = 0; k < WSC * LAYER_K; k++) { const S = doorSpots(b); if (S.length) putDoor(S[(R() * S.length) | 0], 'parede', 1); }
  }
  // os quartos que não existem: a porta de dentro e a de fora (numa sala da mesma faixa)
  for (const N of psNowhere) {
    const S = doorSpots(N.band); if (!S.length) continue;
    const out = putDoor(S[(R() * S.length) | 0], 'nada');
    const inn = { id: psDoors.length, x: W1(N.x0 + (N.kind === 'casa' ? N.w - 3 : 1)), fy: N.fy, kind: 'nada', to: out.id, band: N.band, room: N.id };
    inn.p = floorProp('ps_porta', 0, inn.x, inn.fy); psDoors.push(inn); out.to = inn.id; out.room = N.id; N.door = inn.id;
    if (N.kind === 'casa') floorProp('ps_cama', 1, N.x0 + 1, N.fy);   // o quarto do herói no vilarejo, vazio
  }
  // ---------- as Portas Quentes: a porta entreaberta ao lado do poço, a mancha de queimado na parede ----------
  for (const X of psExits) {
    const tx = W1(X.x0 - 3); if (soil(tx, X.top) && soil(tx + 1, X.top)) floorProp('ps_porta', 0, tx, X.top);
    const m = PROP_DEFS.ps_mancha_queimado; if (m) { const V = m.vars[0], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), mx = W1(X.x0 + 6); if (fits(mx, X.top - th, tw, th, 1, false, true)) { mark(mx, X.top - th, tw, th, 1); const sup = []; for (let k = mx; k < mx + tw; k++) sup.push(I(k, X.top)); addProp(m, 0, mx * T + ((tw * T - V.w) >> 1), X.top * T - V.h, sup); } }
  }
  // ---------- os laços: o mesmo quadro de família e as mesmas placas em cada trecho ----------
  for (const Lp of psLoops) for (let s = 0; s < Lp.n; s++) {
    const base = Lp.x0 + s * Lp.L;
    for (const [id, off, y] of [['ps_placas', 3, Lp.fy - 4], ['ps_quadro_familia', 9, Lp.fy - 4]]) {
      const def = PROP_DEFS[id]; if (!def) continue;
      const V = def.vars[0], X = W1(base + off) * T, Y = y * T + ((T * 2 - V.h) >> 1);
      addProp(def, 0, X, Y, []);
    }
  }

  // ---------- o plano por faixa ----------
  const varOf = def => (R() * def.vars.length) | 0;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = PS_BAND_NAMES[clamp(pesadeloBand(y), 0, 3)], plan = PS_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || wet(i) || inBox(W1(k), y, 2) || inPsLand(W1(k), y, 1) || special(W1(k), y)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), alto = def.alto || 0;
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (!where(def, W1(px + (tw >> 1)), y)) continue;
            if (how === 'chao') {
              const y0 = y + 1 - th, need = Math.max(th, alto);
              if (!fits(px, y + 1 - need, tw, need, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, Math.max(th + 3, alto), 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (onFloor && alto && !fits(px, y + 1 - alto, tw, alto, 1, false)) continue;
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

// a ordem: todas as camadas do meio, depois esta (a camada, as bocas, a subida), depois o Abismo que desce das Portas Quentes
{ const _ab = abBuild; abBuild = function () {
  if (PESADELO) { try { psBuild(); psLoopCopy(); psAfter(); psLoopCopy(); if (typeof psDress === 'function') psDress(); psExitClear(); psClimbFix(); } catch (err) { console.error(err); } }
  return _ab.apply(this, arguments);
}; }

/* ---------- a terceira camada: casas tortas soltas no escuro, o corredor que some em perspectiva, o vermelho do Abismo
   no fundo da Galeria ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!PESADELO) return;
  const Y1 = Math.min(WH, PS_S0 + PS_D + 4);
  for (let y = Math.max(PS_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - PS_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < PS_BANDS[1] ? DP_PS_CASAS : d < PS_BANDS[2] ? (n > 0.72 ? DP_PS_CASAS : DP_PS_CORREDOR) : d < PS_BANDS[3] ? (n > 0.55 ? DP_PS_CORREDOR : DP_PS_CASAS) : d > PS_D - 20 * LAYER_K && n > 0.35 ? DP_PS_BRILHO : DP_PS_CORREDOR;
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (PESADELO && ty >= PS_S0 && ty < PS_S0 + PS_D) return PS_ZONE0 + clamp(pesadeloBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), em centésimos
Object.assign(CATH_SPAWN, {
  [PS_ZONE0]: [[['sonambulo', 22], ['portafaminta', 16], ['bonecas', 20], ['mariposaon', 22], ['sombraerrada', 20]], 8],
  [PS_ZONE0 + 1]: [[['perseguidor', 22], ['homemalto', 20], ['portafaminta', 16], ['relogiomole', 20], ['sombraerrada', 22]], 8],
  [PS_ZONE0 + 2]: [[['sonambulo', 18], ['bonecas', 18], ['cavalinho', 14], ['bailarina', 18], ['mariposaon', 16], ['relogiomole', 16]], 9],
  [PS_ZONE0 + 3]: [[['homemalto', 20], ['perseguidor', 20], ['bailarina', 22], ['cavalinho', 16], ['relogiomole', 22]], 9]
});
for (let z = PS_ZONE0; z < PS_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
// nada nasce no pouso, no Salão, nas Portas Quentes, nos laços, nos quartos que não existem, nem perto de quem dorme
const psSleeping = Bd => !(typeof psAwake === 'function' && psAwake(Bd.id));
const PS_NO_SPAWN = (tx, ty) => inPsLand(tx, ty, 3) || inPsHall(tx, ty, 4) || inPsLoop(tx, ty, 2) || inPsPrize(tx, ty, 2) || inPsNowhere(tx, ty, 2)
  || psExits.some(X => Math.abs(wdx(tx - X.cx)) < 4 && ty >= X.top - 2) || psBeds.some(Bd => psSleeping(Bd) && Math.abs(wdx(tx - Bd.tx - 2)) < 10 && Math.abs(ty - Bd.fy) < 8);
// onde cada coisa pode nascer: a porta faminta só numa parede de fundo de cômodo ou corredor, longe das portas de par;
// a sombra errada só onde há parede atrás
function psSpawnOk(e, tx, ty) {
  if (e.type === 'sombraerrada') return wallAt(tx, ty) !== 0 && wallAt(tx, ty - 1) !== 0;
  if (e.type !== 'portafaminta') return true;
  const C = [...psRooms, ...psHalls].find(C => wdx(tx - C.x0) >= 1 && wdx(tx - C.x0) < C.w - 2 && ty >= C.top && ty <= C.fy);
  if (!C || psDoors.some(d => Math.abs(wdx(d.x - tx)) < 5 && Math.abs(d.fy - C.fy) < 5)) return false;
  for (let y = C.fy - 3; y < C.fy; y++) for (let x = tx - 1; x <= tx + 1; x++) if (solidAt(x, y) || !wallAt(x, y)) return false;
  e.x = tx * T + T / 2 - e.w / 2; e.y = C.fy * T - e.h; e.ax = e.x; e.ay = e.y;   // de pé no chão do cômodo
  return true;
}
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!PESADELO || !e || e.boss || (D && D.boss) || e.psMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - PS_S0;
  if (d >= 0 && d < PS_D) {
    if (zone >= PS_ZONE0 && zone <= PS_ZONE0 + 3 && (PS_NO_SPAWN(tx, ty - 1) || !psSpawnOk(e, tx, ty - 1))) { e.dead = true; e.hp = 0; e.psVoid = true; return e; }
    const lvl = layerLvl(layerLo('pesadelo'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].psVoid) enemies.splice(k, 1); });

/* ---------- partículas: penas caindo devagar (de vez em quando uma sobe), poeira parada no ar, e no fundo o ar
   tremendo de calor com cinza fina subindo ---------- */
HOOK.update.push(dt => {
  if (!PESADELO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = pesadeloBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * 4) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    const hot = Math.floor(y / T) >= psYB() - 10;
    if (hot) parts.push(Math.random() < 0.6 ? { x, y, vx: rnd(-2, 2), vy: rnd(-14, -6), g: -2, life: 2, max: 2, col: Math.random() < 0.5 ? '#6a5a5c' : '#4a3a3c', size: 1 } : { x, y, vx: rnd(-2, 2), vy: rnd(-12, -6), g: -1, life: 1.2, max: 1.2, col: '#f07a2a', size: 1 });
    else if ((b === 0 || b === 2) && Math.random() < 0.55) { const up = Math.random() < 0.1; parts.push({ x, y, vx: rnd(-6, 6), vy: up ? rnd(-6, -3) : rnd(3, 7), g: 0, life: 4, max: 4, col: Math.random() < 0.6 ? '#e8e0ea' : '#cbb4ba', size: 1, smoke: true }); }
    else parts.push({ x, y, vx: rnd(-0.6, 0.6), vy: rnd(-0.4, 0.4), g: 0, life: 3.5, max: 3.5, col: b === 3 ? '#dcf0f4' : '#a69cba', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a onirita na fornalha (308 tem os itens), as lojas ---------- */
FURN.min_onirita = { bar: 'barra_onirita', n: 9, t: 10 };
Object.assign(MAT_VAL, { min_onirita: 66, barra_onirita: 600, po_de_sono: 30, porcelana: 28, corda_caixinha: 34, ponteiro_mole: 36 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'po_de_sono' || id === 'ponteiro_mole'; c.hint = c.hint.replace(/\.$/, '') + ', pó de sono e ponteiros moles.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_onirita', 'barra_onirita', 'porcelana'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', onirita e cacos de porcelana.'; }
if (SHOPS.taverneiro) { const t = SHOPS.taverneiro, b = t.buys; t.buys = id => b(id) || id === 'corda_caixinha'; t.hint = t.hint.replace(/\.$/, '') + ' e cordas de caixinha de música.'; }
