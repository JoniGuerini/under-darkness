'use strict';

/* ================= a Prisão dos Deuses: o mundo (docs/camadas/16-prisao-deuses.md, seção 3) =================
   A décima sexta camada, debaixo da Cidade dos Antigos (pdAbove, 390). Uma prisão que ninguém construiu para ser
   andada: os deuses abriram abismos e atravessaram neles correntes do tamanho de pontes; cavaram galerias de celas
   na pedra viva; deixaram os gigantes de joelhos em salões enormes; e no fundo, o Tártaro, só rocha negra rachada de
   luz violeta, a Cova das Correntes onde o Lobo puxa as duas correntes que sobraram. Em passos:
     1. a rocha por faixa: a pedra de cima afina nas 8 primeiras linhas e vira rocha da prisão; rocha em tudo, bolsões
        de pedra viva nas Celas, pedra do Tártaro no fundo
     2. as salas: as duas descidas (o Poço do Carcereiro, 4 de largura com a escada de ferro, e a câmara de pouso 10 x 6
        com ícor pingando do teto), a Cova das Correntes do outro lado do mundo com os dois corredores, as Gargantas (a
        saída para baixo, 3 de largura com a corrente até a última linha), os abismos com a ponte de elos, as galerias de
        celas em andares, os salões dos gigantes com as plataformas nas paredes, as covas do Tártaro, os bolsões
     3. as ligações: túneis tortos (Correntes e Tártaro) e corredores retos com degraus (Celas e Salões) entre as salas
        de um andar; entre andares, corredores longos e os poços de corrente (4 de largura)
     4. as cascas: alvenaria ciclópica em volta das salas feitas, bronze nas portas da Cova, pedra viva e laje e runas
        nas celas, fenda do Tártaro nas covas de baixo
     5. os veios: carvão na rocha, ferro divino fino nas Celas e nos Salões e grosso no Tártaro
   Depois (pdAfter): tudo alcançável das descidas, escada de ferro (Celas e Salões) ou corrente (Correntes e Tártaro)
   em todo desnível de 5, a decoração de 1 bloco, os objetos (392). Por fim as bocas das descidas e a subida garantida
   (pdClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 85 a 88, o spawn por faixa e o nível (pela posição no 129), as partículas, o
   ferro divino na fornalha e nas lojas. */

let pdChambers = [], pdCorr = [], pdShafts = [];
const pdSolid = t => SOLID[t] && PD_SOILS[t];
const PD_COVA_W = 62, PD_COVA_H = 24;

function pdBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = pdAbove();
  PD_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = PD_S0, YB = Math.min(WH - 8, S0 + PD_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x9d17), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < PD_BANDS[1] ? 0 : d < PD_BANDS[2] ? 1 : d < PD_BANDS[3] ? 2 : 3;
  // K andares por faixa, como no 295: lv(d, j) a linha da profundidade d do desenho (186) no andar j; lvOf(y) o andar
  const K = LAYER_K, BD = PD_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / PD_D); };
  const lvOf = y => { const d = (y - S0) * PD_D / DB, b = bandOf(d), h = (PD_BANDS[b + 1] - PD_BANDS[b]) / K; return b * K + clamp(Math.floor((d - PD_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  pdChambers = []; pdCorr = []; pdShafts = [];
  pdEntries = []; pdLand = []; pdExits = []; pdBoss = null; pdChasms = []; pdGals = []; pdHalls = []; pdPits = []; pdKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 8; y < S0; y++) {
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x9b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = PD_ROCHA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB + 8) { tiles[i] = PD_ROCHA; walls[i] = WPD_ROCHA; continue; }
      const d = y >= YB ? PD_D : y - S0 + (nz(x, y, 18, 0x9b3) - 0.5) * 8, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 24, 0x9a1);
      let tt = PD_ROCHA, ww = WPD_ROCHA;
      if (b === 1 && n1 > 0.7) tt = PD_PEDRA_VIVA;
      else if (b === 3) { tt = n1 > 0.78 ? PD_ROCHA : PD_TARTARO; ww = WPD_TARTARO; }
      else if (b === 2 && n1 > 0.8) tt = PD_TARTARO;
      tiles[i] = tt; walls[i] = ww;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => pdChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1400; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.6 + Math.sin(n * 0.09 + s) * 0.25;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  // corredor reto de altura hh com degraus (um a cada 2 colunas) até o chão de destino
  const street = (xa, fa, xb, fb, hh, list) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, steps = Math.abs(fb - fa), flat = Math.max(0, Math.abs(d) - steps * 2);
    let x = xa, f = fa;
    for (let k = 0; k <= flat; k++, x += s) { for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
    if (list && flat > 6) list.push({ x0: W1(s > 0 ? xa : xa - flat), len: flat + 1, fy: fa, hh });
    const fs = fb > fa ? 1 : -1;
    for (let k = 0; k < steps * 2; k++, x += s) { if (k % 2 === 1) f += fs; for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
  };

  // ---------- 2a. as duas descidas: das Escadas que Afundam da Cidade, o Poço do Carcereiro até a câmara de pouso ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 30, S0 + 14, S0 + mb(36));
      const hx = side > 0 ? xs : xs - 6;
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 10; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 10; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 10 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 10, h: 6, door: W1(door), side };
      pdLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // depois da porta, um patamar de alvenaria: a primeira coisa que se vê da prisão
      const w = 24 + ((R() * 10) | 0), h = 8, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      pdChambers.push({ cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'patamar', x0: W1(x0), fy: landFy, top: landFy - h });
      pdChambers.push({ cx: hx + 5, cy: landFy - 3, w: 10, h: 6, band: 0, kind: 'pouso', nolink: true });
      pdEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. a Cova das Correntes, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const ax = pdEntries.length ? pdEntries.reduce((s, e) => s + wdx(e.x0 - pdEntries[0].x0), 0) / pdEntries.length + pdEntries[0].x0 : SPX;
    const w = PD_COVA_W, h = PD_COVA_H, cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), x0 = W1(cx - (w >> 1)), fy = YB - 7, y0 = fy - h;
    pdBoss = { cx, x0, y0, w, h, fy, doors: [{ side: -1, x: W1(x0 - 1), fy }, { side: 1, x: W1(x0 + w), fy }] };
    for (let y = y0 - 5; y <= fy + 4; y++) for (let x = x0 - 5; x <= x0 + w + 4; x++) seal[I(x, y)] = 1;
    pdChambers.push({ cx, cy: y0 + h / 2, w: w + 10, h: h + 10, band: 3, boss: true, nolink: true });
    for (const D of pdBoss.doors) {
      const len = 22 + ((R() * 10) | 0);
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fy - 4; y < fy; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fy); pdKeep.add(I(x, fy));
        x += D.side;
      }
      pdCorr.push({ x0: D.side > 0 ? W1(D.x + 1) : W1(D.x - len), len, fy, hh: 4, boss: true });
      pdChambers.push({ cx: D.x + D.side * len / 2, cy: fy - 2, w: len, h: 4, band: 3, kind: 'corredor', nolink: true });
      // a antessala: uma cova baixa no fim do corredor
      const gw = 16 + ((R() * 6) | 0), gh = 9, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      room(gx0, fy, gw, gh);
      const C = { cx: gx0 + gw / 2, cy: fy - gh / 2, w: gw, h: gh, band: 3, kind: 'antessala', x0: W1(gx0), fy, top: fy - gh };
      pdChambers.push(C); pdPits.push(C);
    }
  }
  const B = pdBoss;
  const awayFromBoss = (cx, cy, m) => !B || Math.abs(wdx(cx - B.cx)) > B.w / 2 + 6 + m || cy < B.y0 - 6 - m || cy > B.fy + 6 + m;

  // ---------- 2c. as Gargantas: dois poços para baixo no fundo, longe um do outro e do lado oposto à Cova ----------
  for (let tries = 0; pdExits.length < 2 && tries < 800; tries++) {
    const w = 14 + ((R() * 6) | 0), h = 9, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);
    const far = tries < 500 ? Math.min(250, WW / 3) : WW / 5;
    if (!awayFromBoss(cx, fy, tries < 400 ? WW / 4 - 20 : 40) || pdExits.some(e => Math.abs(wdx(e.cx - cx)) < far) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'garganta', x0: W1(x0), fy, top: fy - h, exit: true };
    pdChambers.push(C); pdPits.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    pdExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. As Correntes Suspensas: abismos com a ponte de elos de uma borda à outra ----------
  // o abismo: ar de top a pf - 1 (pf o fundo); as duas bordas de alvenaria de 6 de largura até a altura da ponte; a ponte
  // de elos em barriga (cai sag no meio) a 10 do fundo; correntes do teto até a ponte e da ponte até o fundo
  for (let k = 0, tries = 0; k < 2 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 50 + ((R() * 41) | 0), h = 21 + ((R() * 3) | 0), x0 = (R() * WW) | 0, pf = lv(12 + R() * 28, j) + h - 10;
    const top = pf - h;
    if (top < lv(0, j) + 4 || pf > lv(44, j) || busy(x0 + w / 2, top + h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, top, w / 2)) continue;
    for (let y = top; y < pf; y++) for (let x = x0; x < x0 + w; x++) { const u = (x + 0.5 - x0) / w, cy = top + Math.round(Math.abs(u - 0.5) * 3 + (nz(x, 2, 12, 0x9c1 + k) - 0.5) * 3); if (y >= cy) dig(x, y); }
    for (let x = x0; x < x0 + w; x++) hard(x, pf);
    const by = pf - 10, sag = 2 + ((R() * 2) | 0);
    const C = { cx: x0 + w / 2, cy: top + h / 2, w, h, band: 0, kind: 'abismo', x0: W1(x0), fy: by, top, pf, bridge: { y: by, sag } };
    pdChasms.push(C); pdChambers.push(C); k++;
  }
  // os bolsões e as grutas soltas, mais nas Correntes e no Tártaro
  for (let k = 0, tries = 0; k < 7 * WSC * K && tries < 500 * K; tries++) {
    const b = R() < 0.45 ? 3 : R() < 0.6 ? 0 : 1 + ((R() * 2) | 0), w = 10 + ((R() * 12) | 0), h = 6 + ((R() * 4) | 0), cx = (R() * WW) | 0;
    const cy = lv(BD[b] + 6, k % K) + h / 2 + R() * Math.max(0, BD[b + 1] - BD[b] - 12 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6) || cy + h / 2 > YB - 5) continue;
    blob(cx, cy, w, h, 0x9d00 + k, 1.6);
    pdChambers.push({ cx, cy, w, h, band: b, kind: 'gruta', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2e. As Celas de Pedra Viva: galerias em andares (a cada 6), as celas na parede de trás ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 40 + ((R() * 31) | 0), h = 19, x0 = (R() * WW) | 0, fy = lv(64 + R() * 28, j);
    if (fy - h < lv(48, j) || busy(x0 + w / 2, fy - h / 2, w, h, 7)) continue;
    room(x0, fy, w, h);
    const tiers = [fy - 6, fy - 12];
    pdGals.push({ x0: W1(x0), w, top: fy - h, fy, tiers, cx: x0 + w / 2 });
    pdChambers.push({ cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'galeria', x0: W1(x0), fy, top: fy - h }); k++;
  }
  // as celas soltas: 8 x 5 com a porta de grade, entre as galerias
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 300 * K; tries++) {
    const w = 8 + ((R() * 4) | 0), h = 5, x0 = (R() * WW) | 0, fy = lv(52 + R() * 42, k % K);
    if (busy(x0 + w / 2, fy - h / 2, w, h, 5)) continue;
    room(x0, fy, w, h);
    pdChambers.push({ cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'cela', x0: W1(x0), fy, top: fy - h }); k++;
  }

  // ---------- 2f. O Salão dos Gigantes: salões altos com as plataformas de alvenaria nas paredes ----------
  for (let k = 0, tries = 0; k < 2 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 60 + ((R() * 41) | 0), h = 24 + ((R() * 6) | 0), x0 = (R() * WW) | 0, fy = lv(116 + R() * 30, j);
    if (fy - h < lv(100, j) || busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    room(x0, fy, w, h);
    const decks = []; for (let y = fy - 6; y > fy - h + 4; y -= 6) decks.push(y);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'salao', x0: W1(x0), fy, top: fy - h, decks };
    pdHalls.push(H); pdChambers.push(H); k++;
  }
  // as passagens baixas entre os salões
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 12 + ((R() * 8) | 0), h = 6 + ((R() * 3) | 0), x0 = (R() * WW) | 0, fy = lv(104 + R() * 44, k % K);
    if (busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    room(x0, fy, w, h);
    pdChambers.push({ cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'passagem', x0: W1(x0), fy, top: fy - h }); k++;
  }

  // ---------- 2g. O Tártaro: covas largas de chão torto ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 400 * K; tries++) {
    const w = 24 + ((R() * 21) | 0), h = 10 + ((R() * 7) | 0), cx = (R() * WW) | 0, cy = lv(156 + R() * 20, k % K);
    if (busy(cx, cy, w, h, 7) || !awayFromBoss(cx, cy, w / 2 + 8) || cy + h / 2 > YB - 5) continue;
    blob(cx, cy, w, h, 0x9e00 + k, 2.2);
    const C = { cx, cy, w, h, band: 3, kind: 'cova', fy: Math.round(cy + h / 2 - 1), x0: W1(Math.floor(cx - w / 2)), top: Math.round(cy - h / 2) };
    pdPits.push(C); pdChambers.push(C); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of pdChambers) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(mouth(c) - 1) - c.band * K, 0, K - 1)].push(c);
  const crooked = b => b === 0 || b === 3;
  for (let l = 0; l < NL; l++) {
    const b = (l / K) | 0, L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (crooked(b) && (P.kind === 'gruta' || Q.kind === 'gruta' || P.kind === 'cova' || Q.kind === 'cova')) worm(ax, ay - 2, bx, by - 2, 1.4, 0x9700 + l * 97 + k);
      else street(ax, ay, bx, by, b === 1 ? 4 : 5, pdCorr);
    }
  }
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l].filter(c => c.kind !== 'gruta'), D = byLv[l + 1].filter(c => c.kind !== 'gruta');
    for (let k = 0, tries = 0; k < 2 * WSC && tries < 80 && U.length && D.length; tries++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5), by = mouth(Q); if (by - ay < 6 || by - ay > 70 || !awayFromBoss(Q.cx, by, 6)) continue;
      if (crooked((l / K) | 0)) worm(ax, ay - 2, Math.round(Q.cx), by - 2, 1.4, 0x9800 + l * 31 + k); else street(ax, ay, Math.round(Q.cx), by, 5);
      k++;
    }
  }
  // os poços de corrente (4 de largura) de uma sala para a de baixo
  {
    const pairs = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3]];
    for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 500 * K; tries++) {
      const [bu, bd] = pairs[k % pairs.length];
      const U = pdChambers.filter(c => c.band === bu && c.fy && c.x0 !== undefined && !c.nolink && !c.boss && c.kind !== 'gruta'), D = pdChambers.filter(c => c.band === bd && c.top && c.x0 !== undefined && !c.nolink && !c.boss && c.kind !== 'gruta');
      const P = U[(R() * U.length) | 0]; if (!P) continue;
      const pf = P.pf || P.fy;
      const span = c => { const qa = P.x0 + wdx(c.x0 - P.x0); return [Math.max(P.x0, qa), Math.min(P.x0 + P.w, qa + c.w)]; };
      const Q = D.find(c => c !== P && c.top - pf >= 12 && c.top - pf <= 34 && span(c)[1] - span(c)[0] >= 10);
      if (!Q) continue;
      const [lo, hi] = span(Q);
      if (hi - lo < 8) continue;
      const sx = lo + 2 + ((R() * (hi - lo - 7)) | 0);
      if (!awayFromBoss(sx, (pf + Q.top) / 2, 4)) continue;
      for (let y = pf; y < Q.top; y++) for (let x = sx; x < sx + 4; x++) dig(x, y);
      pdShafts.push({ x0: W1(sx), top: pf, fy: Q.top, band: bu }); k++;
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
  const okShell = (x, y) => { const i = I(x, y); return SOLID[tiles[i]] && PD_SOILS[tiles[i]] && !pdKeep.has(i) && !inPdHall(W1(x), y, 3) && y >= S0 && y < YB - 1; };
  const shellRect = (x0, y0, x1, y1, t, w, inner) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (y < S0 || y >= YB - 1 || inPdHall(W1(x), y, 3)) continue;
      if (SOLID[tiles[i]]) { if (okShell(x, y)) tiles[i] = t; }
      else if (!pdKeep.has(i)) walls[i] = inner !== undefined && x > x0 + 1 && x < x1 - 1 && y > y0 + 1 && y < y1 - 1 ? inner : w;
    }
  };
  // a casca torta: só a rocha a até r de algum ar vira t (salas naturais)
  const shellNear = (x0, y0, x1, y1, r, pick, w) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (y < S0 || y >= YB - 1 || inPdHall(W1(x), y, 3)) continue;
      if (!SOLID[tiles[i]]) { if (!pdKeep.has(i) && w) walls[i] = w; continue; }
      if (!okShell(x, y)) continue;
      let near = 9; for (let d = 1; d <= r && near === 9; d++) if (!SOLID[at(x - d, y)] || !SOLID[at(x + d, y)] || !SOLID[at(x, y - d)] || !SOLID[at(x, y + d)]) near = d;
      if (near <= r) { const t = pick(x, y, near); if (t) tiles[i] = t; }
    }
  };
  // os abismos: a ponte, as bordas, as correntes
  for (const C of pdChasms) {
    const { y: by, sag } = C.bridge, x0 = C.x0, w = C.w;
    shellNear(x0 - 3, C.top - 3, x0 + w + 2, C.pf + 2, 2, (x, y, d) => d <= 1 && y >= by - 1 ? PD_ALVENARIA : 0, WPD_ROCHA);
    // as bordas de alvenaria: 6 colunas de cada lado, do fundo até a ponte
    for (const [a, b] of [[x0, x0 + 5], [x0 + w - 6, x0 + w - 1]]) for (let x = a; x <= b; x++) for (let y = by; y <= C.pf; y++) { const i = I(x, y); tiles[i] = PD_ALVENARIA; }
    C.bridge.x0 = W1(x0 + 6); C.bridge.x1 = W1(x0 + w - 7);
    for (let x = x0 + 6; x < x0 + w - 6; x++) {
      const u = (x - x0 - 5.5) / (w - 11), y = by + Math.round(sag * Math.sin(Math.PI * u)), i = I(x, y);
      tiles[i] = PD_ELO; pdKeep.add(i);
      // os elos são grossos: o de baixo também, a cada 2 colunas (o elo de lado)
      if ((x & 1) === 0 && at(x, y + 1) === AIR) { tiles[I(x, y + 1)] = PD_ELO; pdKeep.add(I(x, y + 1)); }
    }
    // da ponte ao fundo, a cada 12 colunas, uma corrente pendurada (a volta para cima); do teto até a ponte, outras
    for (let x = x0 + 12; x < x0 + w - 10; x += 12) {
      let y = by + 1; while (y < C.pf + 3 && SOLID[at(x, y)]) y++;
      for (; y < C.pf + 3 && at(x, y) === AIR; y++) { tiles[I(x, y)] = PD_CORRENTE; pdKeep.add(I(x, y)); }
    }
    for (let x = x0 + 9; x < x0 + w - 8; x += 14 + ((hash2(x, C.top, seed ^ 0x9c5) * 6) | 0)) {
      let y = C.top; while (y < by && SOLID[at(x, y)]) y++;
      const bot = by + Math.round(sag * Math.sin(Math.PI * (x - x0 - 5.5) / (w - 11)));
      for (; y < bot && at(x, y) === AIR; y++) tiles[I(x, y)] = PD_CORRENTE;
    }
    for (let y = C.top; y < C.pf; y++) for (let x = x0; x < x0 + w; x++) { const i = I(x, y); if (!SOLID[tiles[i]] && !pdKeep.has(i)) walls[i] = y < by - 2 ? WPD_ROCHA : WPD_ALVENARIA; }
  }
  // as galerias: alvenaria em volta, as celas atrás (parede de cela), os andares de laje com vãos de 3, a pedra viva
  for (const G of pdGals) {
    shellRect(G.x0 - 2, G.top - 2, G.x0 + G.w + 1, G.fy + 1, PD_ALVENARIA, WPD_ALVENARIA, WPD_CELA);
    for (let x = G.x0; x < G.x0 + G.w; x++) if (okShell(x, G.fy)) set(x, G.fy, (x % 9) === 4 ? PD_RUNA : PD_PEDRA_VIVA);
    for (let d = 0; d < G.tiers.length; d++) {
      const y = G.tiers[d], gap = G.x0 + 5 + ((hash2(G.x0, y, seed ^ 0x9e1) * (G.w - 13)) | 0);
      for (let x = G.x0; x < G.x0 + G.w; x++) { if (x >= gap && x < gap + 3) continue; const i = I(x, y); if (tiles[i] === AIR) tiles[i] = PD_LAJE; }
    }
    // a grade de cada cela, a cada 7 colunas, 3 de altura em cima de cada andar; umas faltam (arrebentadas por dentro)
    for (const fy of [G.fy, ...G.tiers]) for (let x = G.x0 + 3; x < G.x0 + G.w - 2; x += 7) {
      if (hash2(x, fy, seed ^ 0x9e2) < 0.3) continue;
      for (let y = fy - 3; y < fy; y++) { const i = I(x, y); if (tiles[i] === AIR && SOLID[at(x, fy)]) tiles[i] = PD_GRADE; }
    }
    // as runas no alto das paredes
    for (const x of [G.x0 - 1, G.x0 + G.w]) for (let y = G.top + 3; y < G.fy; y += 6) if (okShell(x, y)) set(x, y, PD_RUNA);
  }
  for (const C of pdChambers) if (C.kind === 'cela') {
    shellRect(C.x0 - 2, C.top - 2, C.x0 + C.w + 1, C.fy + 1, PD_PEDRA_VIVA, WPD_CELA);
    const gx = (hash2(C.x0, C.fy, seed ^ 0x9e3) < 0.5) ? C.x0 : C.x0 + C.w - 1;
    for (let y = C.fy - 3; y < C.fy; y++) if (at(gx, y) === AIR) set(gx, y, PD_GRADE);
  }
  for (const Q of pdCorr) {
    if (Q.boss) continue;
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j;
      for (let y = Q.fy - Q.hh - 1; y <= Q.fy; y++) {
        const i = I(x, y); if (inPdHall(W1(x), y, 1) || y < S0 + 1 || y >= YB - 1) continue;
        const b = prisaoBand(y);
        if (!SOLID[tiles[i]]) { if (!pdKeep.has(i)) walls[i] = b === 3 ? WPD_TARTARO : WPD_ALVENARIA; continue; }
        if ((y === Q.fy || y === Q.fy - Q.hh - 1) && okShell(x, y)) tiles[i] = b === 3 ? PD_TARTARO : y === Q.fy ? PD_LAJE : PD_ALVENARIA;
      }
    }
  }
  // os salões: alvenaria, as plataformas de alvenaria saindo das paredes (alternando o lado), runas
  for (const H of pdHalls) {
    shellRect(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, PD_ALVENARIA, WPD_ALVENARIA);
    for (let x = H.x0; x < H.x0 + H.w; x++) if (okShell(x, H.fy)) set(x, H.fy, PD_LAJE);
    for (let d = 0; d < H.decks.length; d++) {
      // cada plataforma é mais curta que a de baixo do mesmo lado: quem cai da ponta cai 12 na de baixo, não no chão
      const y = H.decks[d], lft = d % 2 === 0, len = Math.max(8, Math.round(H.w * 0.34) - d * 3 + ((hash2(H.x0, y, seed ^ 0x9e4) * 3) | 0));
      for (let k = 0; k < len; k++) { const x = lft ? H.x0 + k : H.x0 + H.w - 1 - k, i = I(x, y); if (tiles[i] === AIR) tiles[i] = PD_ALVENARIA; }
      // a plataforma do meio, solta, em cima das duas de lado
      if (d % 2 === 1 && H.w > 70) for (let x = H.x0 + (H.w >> 1) - 6; x < H.x0 + (H.w >> 1) + 6; x++) { const i = I(x, y); if (tiles[i] === AIR) tiles[i] = PD_ALVENARIA; }
    }
    for (const x of [H.x0 - 1, H.x0 + H.w]) for (let y = H.top + 4; y < H.fy - 1; y += 5) if (okShell(x, y)) set(x, y, PD_RUNA);
  }
  for (const C of pdChambers) if (C.kind === 'passagem' || C.kind === 'patamar') shellRect(C.x0 - 2, C.top - 2, C.x0 + C.w + 1, C.fy + 1, PD_ALVENARIA, WPD_ALVENARIA);
  // os poços de corrente: alvenaria nas paredes (bronze a cada 6), a corrente na coluna da esquerda
  for (const S of pdShafts) {
    for (let y = S.top - 1; y <= S.fy; y++) {
      for (const x of [S.x0 - 1, S.x0 + 4]) if (okShell(x, y)) set(x, y, (y - S.top) % 6 === 2 ? PD_BRONZE : PD_ALVENARIA);
      for (let x = S.x0; x < S.x0 + 4; x++) { const i = I(x, y); if (!SOLID[tiles[i]]) walls[i] = WPD_ALVENARIA; }
      const i = I(S.x0, y); if (tiles[i] === AIR || tiles[i] === PD_LAJE || tiles[i] === PD_ELO) { tiles[i] = S.band === 1 || S.band === 2 ? PD_ESCADA : PD_CORRENTE; pdKeep.add(i); }
    }
    // a escada continua sala abaixo até o chão (a sala de baixo pode ser alta)
    for (let y = S.fy + 1; y < YB - 1 && !SOLID[at(S.x0, y)]; y++) { const i = I(S.x0, y); if (tiles[i] === AIR) { tiles[i] = S.band === 1 || S.band === 2 ? PD_ESCADA : PD_CORRENTE; pdKeep.add(i); } }
    for (let y = S.top + 10, n = 0; y < S.fy - 4; y += 10, n++) for (let x = S.x0 + (n % 2 ? 1 : 2); x < S.x0 + 4; x++) { const i = I(x, y); if (tiles[i] === AIR) tiles[i] = PD_ALVENARIA; }
  }
  // o Tártaro: pedra do Tártaro forrando as covas, fendas de luz violeta perto do ar
  for (const C of pdPits) {
    const x0 = Math.floor(C.cx - C.w / 2) - 3, x1 = Math.ceil(C.cx + C.w / 2) + 3, y0 = (C.top !== undefined ? C.top : Math.floor(C.cy - C.h / 2)) - 3, y1 = C.fy + 3;
    shellNear(x0, y0, x1, y1, 3, (x, y, d) => d === 1 && hash2(W1(x), y, seed ^ 0x9e5) < 0.12 ? PD_FENDA : PD_TARTARO, WPD_TARTARO);
  }
  for (const C of pdChambers) if (C.kind === 'gruta') {
    shellNear(Math.floor(C.cx - C.w / 2) - 3, Math.floor(C.cy - C.h / 2) - 3, Math.ceil(C.cx + C.w / 2) + 3, Math.ceil(C.cy + C.h / 2) + 3, 2, (x, y, d) => C.band === 3 ? (d === 1 && hash2(W1(x), y, seed ^ 0x9e6) < 0.08 ? PD_FENDA : PD_TARTARO) : C.band === 1 && hash2(W1(x), y, seed ^ 0x9e7) < 0.5 ? PD_PEDRA_VIVA : 0, C.band === 3 ? WPD_TARTARO : WPD_ROCHA);
  }
  // as rachaduras do Tártaro: veios de fenda subindo das covas
  {
    const R2 = mulberry32(seed ^ 0x9e8);
    for (const C of pdPits) if (C.kind === 'cova') for (let k = 0, n = 2 + ((R2() * 3) | 0); k < n; k++) {
      let x = C.cx + (R2() - 0.5) * C.w * 0.9, y = (C.top || C.cy) + 1; const a = -Math.PI / 2 + (R2() - 0.5) * 2.2, len = 14 + R2() * 18;
      for (let s = 0; s < len; s++) {
        x += Math.cos(a) + (R2() - 0.5) * 0.8; y += Math.sin(a) * 0.9 + (R2() - 0.5) * 0.5;
        const tx = Math.round(x), ty = Math.round(y);
        if (okShell(tx, ty) && !inPdLand(W1(tx), ty, 2) && (at(tx, ty) === PD_TARTARO || at(tx, ty) === PD_ROCHA)) set(tx, ty, PD_FENDA);
      }
    }
  }
  // a Cova das Correntes: a moldura de bronze, o chão de laje, a parede de bronze; as portas no pé dos dois lados.
  // Duas correntes partidas penduradas do teto (dá para subir nelas); o 397 desenha as duas inteiras presas ao lobo
  for (let y = B.y0 - 1; y <= B.fy; y++) for (let x = B.x0 - 1; x <= B.x0 + B.w; x++) {
    const i = I(x, y), edge = y === B.y0 - 1 || y === B.fy || x === B.x0 - 1 || x === B.x0 + B.w;
    tiles[i] = edge ? (y === B.fy ? PD_LAJE : PD_BRONZE) : AIR; walls[i] = y >= B.fy - 4 ? WPD_BRONZE : (y - B.y0) % 8 === 7 ? WPD_BRONZE : WPD_TARTARO;
    if (agua.length) agua[i] = 0; pdKeep.add(i);
  }
  for (const D of B.doors) for (let y = B.fy - 4; y < B.fy; y++) { const i = I(D.x, y); tiles[i] = AIR; walls[i] = WPD_BRONZE; }
  for (let x = B.x0; x < B.x0 + B.w; x += 9) set(x, B.y0 - 1, PD_RUNA);
  B.hang = [];
  for (const hx of [B.x0 + 17, B.x0 + B.w - 18]) { for (let y = B.y0; y <= B.fy - 5; y++) tiles[I(hx, y)] = PD_CORRENTE; B.hang.push(W1(hx)); }
  // as runas nas paredes de fora em volta da moldura
  for (let y = B.y0 + 2; y < B.fy - 5; y += 6) for (const x of [B.x0 - 2, B.x0 + B.w + 1]) if (SOLID[at(x, y)]) set(x, y, PD_RUNA);

  // ---------- as descidas: a boca vira alvenaria, o Poço do Carcereiro com a escada de ferro, a câmara de pouso ----------
  for (const E of pdEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let y = E.fy - 2; y <= E.fy; y++) for (let x = x0 - 3; x <= x0 + 6; x++) { const i = I(x, y); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 4) && tiles[i] !== BEDROCK && y >= S0) tiles[i] = PD_ALVENARIA; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WPD_ALVENARIA; pdKeep.add(i); }
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y > E.fy) { tiles[i] = (y - E.fy) % 6 === 3 ? PD_BRONZE : PD_ALVENARIA; pdKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = PD_ESCADA; pdKeep.add(i); } }
    if (y1 - E.fy > 14) { const my = (E.fy + y1) >> 1; for (const x of [x0, x0 + 2, x0 + 3]) { const i = I(x, my); tiles[i] = PD_ALVENARIA; pdKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 4; x++) pdKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WPD_ALVENARIA; }
      else if (edge && !(y === L.fy - L.h - 1 && wdx(W1(x) - x0) >= 0 && wdx(W1(x) - x0) < 4)) tiles[i] = y === L.fy ? PD_LAJE : PD_ALVENARIA;
      else { tiles[i] = W1(x) === W1(x0 + 1) ? PD_ESCADA : AIR; walls[i] = !edge && y === L.fy - 3 ? WPD_BRONZE : WPD_ALVENARIA; }
      pdKeep.add(i);
    }
    // duas gotas de ícor no teto, longe do poço: a luz do pouso
    for (const lx of L.side > 0 ? [L.x0 + 5, L.x0 + 8] : [L.x0 + 1, L.x0 + 4]) if (tiles[I(lx, L.fy - L.h)] === AIR) tiles[I(lx, L.fy - L.h)] = PD_ICOR;
    for (const lx of L.side > 0 ? [L.x0 + 5, L.x0 + 8] : [L.x0 + 1, L.x0 + 4]) if (tiles[I(lx, L.fy - 1)] === AIR) tiles[I(lx, L.fy - 1)] = PD_POCA;
  }
  // ---------- as Gargantas: o poço de 3 com a corrente até a última linha ----------
  for (const X of pdExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WPD_TARTARO; pdKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = (y - X.top) % 5 === 2 ? PD_RUNA : PD_ALVENARIA; pdKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = PD_CORRENTE; pdKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2]) { const i = I(x, my); tiles[i] = PD_ALVENARIA; pdKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { pdKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = PD_BRONZE; } }
    shellRect(X.C.x0 - 2, X.C.top - 2, X.C.x0 + X.C.w + 1, X.C.fy + 1, PD_ALVENARIA, WPD_TARTARO);
    tiles[I(X.x0 + 1, X.fy)] = PD_ALVENARIA;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x9f9b);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !pdKeep.has(i) && !inPdHall(W1(x), y, 4)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(PD_O_CARVAO, 16 * WSC * K, 0, 150, 3, 7, t => t === PD_ROCHA);
  vein(PD_O_FERRO, 4 * WSC * K, 46, 150, 2, 3, t => t === PD_ROCHA || t === PD_PEDRA_VIVA);
  vein(PD_O_FERRO, 13 * WSC * K, 150, 186, 3, 7, t => t === PD_TARTARO || t === PD_ROCHA);
}

function pdAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = PD_S0, YB = Math.min(WH - 8, S0 + PD_D), R3 = mulberry32(seed ^ 0x9d3c1);
  const pdRow = y => y >= S0 && y < YB - 1;
  const inBox = (x, y, m = 0) => inPdHall(x, y, 3 + m);
  const dig = (x, y) => { if (!pdRow(y)) return; const i = I(x, y); if (pdKeep.has(i) || inBox(W1(x), y)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = prisaoBand(y) === 3 ? WPD_TARTARO : WPD_ROCHA; };
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const tunnel = (xa, ya, xb, yb) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1;
    for (let k = 0; k <= Math.abs(d); k++) for (let yy = ya - 2; yy <= ya; yy++) dig(xa + k * s, yy);
    for (let yy = Math.min(ya, yb) - 2; yy <= Math.max(ya, yb); yy++) { dig(xb, yy); dig(xb - s, yy); }
    for (let yy = Math.min(ya, yb) + 6; yy < Math.max(ya, yb) - 3; yy += 8) { const i = I(xb - s, yy); if (tiles[i] === AIR && !pdKeep.has(i) && pdRow(yy)) tiles[i] = PD_ALVENARIA; }
  };

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of pdEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!pdEntries.length && pdChambers.length) flood(I(pdChambers[0].cx, Math.round(pdChambers[0].cy)));
  const B = pdBoss;
  if (B) for (let y = B.y0 - 3; y <= B.fy + 3; y++) for (let x = B.x0 - 3; x <= B.x0 + B.w + 2; x++) reach[I(x, y)] = 1;
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
        if (pdKeep.has(nb) || pdKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
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
    tunnel(best[0], best[1], best[2], best[3]);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {
      const hit = bfs(bestC);
      for (let c = hit; c >= 0 && org[c - RB] !== c; c = org[c - RB]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada de ferro (Celas e Salões) ou corrente (Correntes e Tártaro) em todo desnível de 5 ou mais ----------
  const climbT = y => { const b = prisaoBand(y); return b === 1 || b === 2 ? PD_ESCADA : PD_CORRENTE; };
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 0)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || PD_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (pdKeep.has(i) || !walls[i] || inBox(lx, yy, 0)) clear = false; }
        if (!clear) continue;
        const tt = climbT(y);
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !(SOLID[at(x + 3, y)] || SOLID[at(x + 4, y)])) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || PD_CLIMB(at(x, y - 1)) || PD_CLIMB(at(x + 1, y)) || PD_CLIMB(at(x + 2, y)) || inBox(x, y, 0)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (pdKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) { const tt = climbT(y); for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, tt); }
  }

  pdQuedas();

  // ---------- 3. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || pdKeep.has(i)) continue;
    const b = prisaoBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inPdLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = pdSolid(dn) && BLOCKY[dn] && up === AIR, ceil = pdSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (b === 0) { if (q < 0.03 && gap >= 6) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 3) === AIR; j++) put(x, y + j, PD_CORRENTE); } else if (q < 0.05) put(x, y, PD_ARGOLA); else if (q < 0.07) put(x, y, PD_ESTALAC); }
      else if (b === 1) { if (q < 0.008) put(x, y, PD_ICOR); else if (q < 0.03) put(x, y, PD_ARGOLA); else if (q < 0.06) put(x, y, PD_LIQUEN); }
      else if (b === 2) { if (q < 0.04 && gap >= 6) { for (let j = 0, n = 3 + ((R3() * 5) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 3) === AIR; j++) put(x, y + j, PD_CORRENTE); } else if (q < 0.05) put(x, y, PD_ICOR); else if (q < 0.07) put(x, y, PD_ESTALAC); }
      else { if (q < 0.07) put(x, y, PD_ESTALAC); else if (q < 0.078) put(x, y, PD_ICOR); else if (q < 0.1) put(x, y, PD_LIQUEN); }
      continue;
    }
    if (!floor || PD_CLIMB(at(x - 1, y)) || PD_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    // a poça de ícor debaixo de uma gota (a que caiu)
    let drip = false; for (let k = 1; k < 9 && !drip; k++) { const t = at(x, y - k); if (t === PD_ICOR) drip = true; else if (t !== AIR) break; }
    if (drip) { put(x, y, PD_POCA); continue; }
    if (b === 0) { if (q < 0.03) put(x, y, PD_OSSOS); else if (q < 0.05) put(x, y, PD_ELOS); }
    else if (b === 1) { if (q < 0.03) put(x, y, PD_OSSOS); else if (q < 0.05) put(x, y, PD_GRILHAO); else if (q < 0.06) put(x, y, PD_ELOS); }
    else if (b === 2) { if (q < 0.04) put(x, y, PD_ELOS); else if (q < 0.055) put(x, y, PD_OSSOS); else if (q < 0.065) put(x, y, PD_GRILHAO); }
    else { if (q < 0.04) put(x, y, PD_OSSOS); else if (q < 0.05) put(x, y, PD_ELOS); }
  }

  // ---------- 4. os objetos ----------
  pdPlaceProps();
}

/* ---------- as quedas que ainda sobraram (de 8 ou mais, da beira de um chão): a corrente ou a escada na própria
   coluna da queda. Roda no fim do pdAfter e de novo depois das ligações (87 e 353), que abrem túneis novos ---------- */
function pdQuedas() {
  if (!PRISAO || !pdBoss) return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = PD_S0, YB = Math.min(WH - 8, S0 + PD_D);
  const at = (x, y) => tiles[I(x, y)], inBox = (x, y, m = 0) => inPdHall(x, y, 3 + m);
  const climbT = y => { const b = prisaoBand(y); return b === 1 || b === 2 ? PD_ESCADA : PD_CORRENTE; };
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x, y - 1) !== AIR || SOLID[at(x, y + 1)] || PD_CLIMB(at(x, y + 1)) || inBox(x, y, 0)) continue;
    let edge = false; for (const d of [-1, 1]) if (at(x + d, y) === AIR && at(x + d, y - 1) === AIR && SOLID[at(x + d, y + 1)]) edge = true;
    if (!edge) continue;
    let k = y + 1; while (k < YB - 1 && !SOLID[at(x, k)] && !PD_CLIMB(at(x, k))) k++;
    if (k - y < 8 || PD_CLIMB(at(x, k))) continue;
    // uma corrente do lado só serve se chegar até embaixo
    if (PD_CLIMB(at(x - 1, k - 1)) || PD_CLIMB(at(x + 1, k - 1)) || PD_CLIMB(at(x - 1, k - 2)) || PD_CLIMB(at(x + 1, k - 2))) continue;
    const tt = climbT(y);
    for (let yy = y; yy < k; yy++) { const i = I(x, yy); if (tiles[i] === AIR && !pdKeep.has(i)) { tiles[i] = tt; if (!walls[i]) walls[i] = WPD_ROCHA; } }
  }

}
// registrado quando a página termina de carregar: assim roda depois das ligações refeitas pelo 353 (o selo)
addEventListener('DOMContentLoaded', () => genPos(() => { try { pdQuedas(); } catch (err) { console.error(err); } }, 'prisao'));

function pdExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of pdEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? PD_ESCADA : AIR; pdKeep.add(i); }
}
/* ---------- a subida garantida (a mesma busca de trás para frente do 295): da Cova, dos salões, das galerias, das
   covas, dos fundos dos abismos e do pé das Gargantas o herói volta às descidas (pulo de 3; escada e corrente sobem) ---------- */
function pdClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = PD_S0, YB = Math.min(WH - 8, S0 + PD_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => PD_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const box = (x, y, m = 0) => inPdHall(x, y, m);
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !box(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
    F[(y - Y0) * WW + x] = f;
  };
  const flags = () => { for (let y = Y0 + 1; y < YB; y++) for (let x = 0; x < WW; x++) flag1(x, y); };
  const arrive = (p, r, c, dir) => { if (F[c] & 2) return dir === 1 && r === 0 ? -1 : 4; if (dir === 0) return r === 4 && !(F[p] & 4) ? 0 : r; if (dir === 1) return r === 0 ? -1 : F[p] & 8 ? 4 : r === 4 ? 2 : r - 1; return 0; };
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
  const soft = t => t === PD_ROCHA || t === PD_ALVENARIA || t === PD_PEDRA_VIVA || t === PD_LAJE || t === PD_TARTARO || t === PD_FENDA || t === PD_ELO;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || pdKeep.has(I(x, y)) || box(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !pdKeep.has(I(x, t)) && !box(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best, b = prisaoBand(bot), tt = b === 1 || b === 2 ? PD_ESCADA : PD_CORRENTE;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = tt; if (!walls[i]) walls[i] = WPD_ROCHA; } }
    return best;
  };
  const starts = [];
  if (pdBoss) for (const D of pdBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of pdHalls) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of pdGals) starts.push([c.x0 + 1, c.fy - 1]);
  for (const c of pdChasms) starts.push([Math.round(c.cx), c.pf - 1]);
  for (const c of pdPits) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of pdExits) starts.push([X.x0 + 2, X.top - 1]);
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
  pdClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (392): por faixa, no chão, debaixo do teto e na parede. salao: só nos salões dos gigantes;
   tartaro: só no Tártaro. Nunca sobre escada ou corrente; nunca no pouso nem na Cova ---------- */
function pdPlaceProps() {
  if (typeof PD_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b3d9);
  const S0 = PD_S0, YB = Math.min(WH - 8, S0 + PD_D), used = new Uint8Array(WW * WH * 2), BF = typeof PD_BACK_FLOOR !== 'undefined' ? PD_BACK_FLOOR : {};
  const inBox = (x, y, m = 0) => inPdHall(x, y, 3 + m);
  const inside = (L, x, y) => L.some(C => wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy);
  const where = (def, x, y) => (!def.salao || inside(pdHalls, x, y)) && (!def.tartaro || prisaoBand(y) === 3);
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || pdKeep.has(i) || inBox(W1(x), y, 0) || inPdLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && PD_SOILS[t] && t !== PD_ELO; };
  const varOf = def => (R() * def.vars.length) | 0;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = PD_BAND_NAMES[clamp(prisaoBand(y), 0, 3)], plan = PD_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBox(W1(k), y, 1) || inPdLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
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

// a ordem: a camada, a Cova (397: pdDress), as bocas e a subida; o 87 liga o resto
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('prisao', () => {
  if (!PRISAO) return;
  try { pdBuild(); pdAfter(); if (typeof pdDress === 'function') pdDress(); pdExitClear(); pdClimbFix(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada: correntes atravessando o vazio nas Correntes, as celas em andares ao longe nas Celas
   e nos Salões, o fundo do Tártaro ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!PRISAO) return;
  const Y1 = Math.min(WH, PD_S0 + PD_D + 4);
  for (let y = Math.max(PD_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - PD_S0) + (depthNz(x, y, 25, seed ^ 0x9e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x9e12);
    DEEPT[i] = d < PD_BANDS[1] ? DP_PD_ABISMO : d < PD_BANDS[3] ? (n > 0.82 ? DP_PD_ABISMO : DP_PD_CELAS) : (n > 0.85 ? DP_PD_CELAS : DP_PD_TARTARO);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (PRISAO && ty >= PD_S0 && ty < PD_S0 + PD_D) return PD_ZONE0 + clamp(prisaoBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), em centésimos
Object.assign(CATH_SPAWN, {
  [PD_ZONE0]: [[['aguia', 24], ['elos', 16], ['condenado', 22], ['acorrentador', 20], ['cria', 18]], 8],
  [PD_ZONE0 + 1]: [[['carcereiro', 24], ['pedraviva', 20], ['condenado', 18], ['elos', 16], ['lamento', 22]], 8],
  [PD_ZONE0 + 2]: [[['gigante', 14], ['carcereiro', 22], ['cria', 22], ['pdSerpe', 20], ['aguia', 22]], 8],
  [PD_ZONE0 + 3]: [[['pdSerpe', 20], ['lamento', 18], ['pedraviva', 16], ['acorrentador', 18], ['gigante', 10], ['cria', 18]], 9]
});
for (let z = PD_ZONE0; z < PD_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const PD_NO_SPAWN = (tx, ty) => inPdLand(tx, ty, 3) || inPdHall(tx, ty, 4) || pdExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2) || pdEntries.some(E => wdx(tx - E.x0) >= -2 && wdx(tx - E.x0) < 6 && ty < E.land.fy);
// os níveis pela posição no 129 (layerLvl no 52); nada nasce no pouso, na Cova nem nos poços de descida e saída
let pdSpawnLivre = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!PRISAO || !e || e.boss || (D && D.boss) || e.pdMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - PD_S0;
  if (d >= 0 && d < PD_D) {
    if (!pdSpawnLivre && zone >= PD_ZONE0 && zone <= PD_ZONE0 + 3 && PD_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.atVoid = true; return e; }
    const lvl = layerLvl(layerLo('prisao'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].atVoid) enemies.splice(k, 1); });
// os bichos comuns não entram na Cova: quem pisa dentro da moldura é empurrado para a porta de onde veio
HOOK.update.push(() => {
  if (!PRISAO || !pdBoss) return;
  for (const e of enemies) {
    if (e.dead || e.boss || e.pdMinion || !PD_TYPES.includes(e.type)) continue;
    const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T);
    if (!inPdHall(tx, ty, 0)) continue;
    const left = wdx(tx - pdBoss.cx) < 0; e.vx = left ? -60 : 60; e.facing = left ? -1 : 1;
    if (inPdHall(tx, ty, -3)) { e.dead = true; e.hp = 0; e.atVoid = true; }   // bem dentro: some (não fica preso na arena)
  }
});

/* ---------- partículas: pó de pedra caindo nas Correntes, gotas de ícor nos Salões, cinza violeta no Tártaro ---------- */
HOOK.update.push(dt => {
  if (!PRISAO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = prisaoBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 0 ? 4 : b === 3 ? 5 : 2.5)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(8, 16), g: 0, life: 3, max: 3, col: Math.random() < 0.7 ? '#6a6050' : '#8a8070', size: 1 });
    else if (b === 1) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-2, 2), g: 0, life: 3, max: 3, col: '#5a4e40', size: 1 });
    else if (b === 2) parts.push({ x, y, vx: 0, vy: rnd(-3, -1), g: 0, life: 3.5, max: 3.5, col: Math.random() < 0.15 ? '#ffcc4a' : '#7a6a50', size: 1 });
    else parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-8, -3), g: 0, life: 3, max: 3, col: Math.random() < 0.35 ? '#b08aff' : '#4a3a5a', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: o ferro divino na fornalha (398 tem os itens), as lojas ---------- */
FURN.min_ferro_divino = { bar: 'barra_ferro_divino', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_ferro_divino: 70, barra_ferro_divino: 560, icor_divino: 44, elo_vivo: 10, pena_suplicio: 24, coracao_pedra: 30, presa_lobo: 14 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['icor_divino', 'pena_suplicio', 'presa_lobo'].includes(id); c.hint = c.hint.replace(/\.$/, '') + ', ícor divino, penas do suplício e presas de lobo.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_ferro_divino', 'barra_ferro_divino', 'elo_vivo', 'coracao_pedra'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', ferro divino, elos vivos e corações de pedra.'; }
