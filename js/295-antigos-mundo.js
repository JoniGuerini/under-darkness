'use strict';

/* ================= a Cidade dos Antigos: o mundo (docs/camadas/13-cidade-antigos.md, seção 3) =================
   A décima quinta camada, debaixo do Ossário dos Titãs (atAbove, 290). Quase nada aqui é caverna: a cidade ocupa a
   camada. Em cima, terraços enormes em degraus; depois os quarteirões com o prédio no chão e o mesmo prédio pendurado
   no teto; as máquinas que ainda trabalham; e no fundo as crateras de vidro da estrela. Em passos:
     1. a rocha por faixa: o material de cima afina nas 8 primeiras linhas e vira Pedra Lisa; Pedra Lisa em tudo, com
        bolsões de Rocha Fria por ruído (mais na Cratera)
     2. as salas: as duas descidas (o Poço dos Antigos, 4 de largura com a escada embutida, e a câmara de pouso 10 x 6),
        a Sala que se Monta do outro lado do mundo (a caixa sólida que o 297 monta com atDress) e os dois corredores até
        as portas, as Escadas que Afundam (a saída para baixo), os terraços em degraus e as câmaras quadradas, os
        quarteirões com os prédios espelhados, as Salas de Prumo (a caixa que o 296 veste), os salões de máquinas com
        passarelas e os poços de pistão, as crateras
     3. as ligações: ruas retas com escadaria (um degrau a cada 2 colunas) dentro da cidade, túneis só na Cratera
     4. as cascas: laje em volta de toda sala, faixa de glifo atrás, chapa e engrenagem nas Máquinas, vidro e rocha
        fundida nas crateras, as rachaduras radiais da estrela entrando nas Máquinas
     5. os veios: carvão só na rocha fria, ferro estelar grosso na Cratera e fino na pedra das Máquinas
   Depois (atAfter): tudo alcançável das descidas, escada embutida (na cidade) ou corrente (na Cratera) em todo desnível
   de 5, a decoração de 1 bloco, os objetos (292). Por fim a arena (297: atDress), as Salas de Prumo (296: atPrumoDress),
   as bocas das descidas e a subida garantida (atClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 69 a 72, o spawn por faixa e o nível (pela posição no 129), as partículas, o
   ferro estelar na fornalha e nas lojas. */

let atChambers = [], atCorr = [];
const AT_CLIMB = t => t === AT_ESCADA || t === AT_CORRENTE || t === CHAIN;
const atSolid = t => SOLID[t] && AT_SOILS[t];

function atBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = atAbove();
  AT_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = AT_S0, YB = Math.min(WH - 8, S0 + AT_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7a91), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / AT_D);
  const bandOf = d => d < AT_BANDS[1] ? 0 : d < AT_BANDS[2] ? 1 : d < AT_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  atChambers = []; atCorr = [];
  atEntries = []; atLand = []; atExits = []; atBoss = null; atTerraces = []; atBlocks = []; atPrumos = []; atHalls = []; atShafts = []; atCraters = []; atKeep.clear();
  AT_GRAV.length = 0;
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 8; y < S0; y++) {   // o osso de cima afina nas últimas 8 linhas: a pedra lisa já aparece
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x7b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = AT_PEDRA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      const d = y - S0 + (nz(x, y, 18, 0x7b3) - 0.5) * 8, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 24, 0x7a1);
      let tt = AT_PEDRA;
      if (b === 3 ? n1 > 0.6 : n1 > 0.74) tt = AT_ROCHA_FRIA;
      tiles[i] = tt; walls[i] = WAT_PEDRA;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => atChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // sala reta: ar de fy - h a fy - 1, chão em fy
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
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
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.6 + Math.sin(n * 0.09 + s) * 0.25;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  // rua: um corredor reto de altura hh no chão fa de xa até xb e, se o chão de destino for outro, uma escadaria
  // (um degrau a cada 2 colunas) até fb. Os Antigos não fazem curva: é reto ou é degrau.
  const street = (xa, fa, xb, fb, hh, list) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, steps = Math.abs(fb - fa), flat = Math.max(0, Math.abs(d) - steps * 2);
    let x = xa, f = fa;
    for (let k = 0; k <= flat; k++, x += s) { for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
    if (list && flat > 6) list.push({ x0: W1(s > 0 ? xa : xa - flat), len: flat + 1, fy: fa, hh });
    const fs = fb > fa ? 1 : -1;
    for (let k = 0; k < steps * 2; k++, x += s) { if (k % 2 === 1) f += fs; for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
  };

  // ---------- 2a. as duas descidas: dos poços do Ossário, o Poço dos Antigos até a câmara de pouso ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 30, S0 + 14, S0 + mb(36));   // o poço desce uns 24 e abre no teto da câmara
      const hx = side > 0 ? xs : xs - 6;   // o poço cai numa ponta da câmara (10 x 6); a porta fica na outra
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 10; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 10; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 10 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 10, h: 6, door: W1(door), side };
      atLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // um terraço logo depois da porta: a primeira coisa que o herói vê da cidade
      const w = 30 + ((R() * 12) | 0), h = 9, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'terraco', x0: W1(x0), fy: landFy, top: landFy - h };
      atTerraces.push(H); atChambers.push(H);
      atChambers.push({ cx: hx + 5, cy: landFy - 3, w: 10, h: 6, band: 0, kind: 'pouso', nolink: true });
      atEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. a Sala que se Monta, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const ax = atEntries.length ? atEntries.reduce((s, e) => s + wdx(e.x0 - atEntries[0].x0), 0) / atEntries.length + atEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), x0 = W1(cx - 15), fy = YB - 7, y0 = fy - 30;   // o miolo 30 x 30; a moldura em volta
    atBoss = { cx, x0, y0, w: 30, h: 30, fy, doors: [{ side: -1, x: W1(x0 - 1), fy }, { side: 1, x: W1(x0 + 30), fy }] };
    for (let y = y0 - 5; y <= fy + 4; y++) for (let x = x0 - 5; x <= x0 + 34; x++) seal[I(x, y)] = 1;
    atChambers.push({ cx, cy: y0 + 15, w: 40, h: 40, band: 3, boss: true, nolink: true });
    for (const D of atBoss.doors) {
      const len = 24 + ((R() * 12) | 0);
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fy - 4; y < fy; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fy); atKeep.add(I(x, fy));
        x += D.side;
      }
      atCorr.push({ x0: D.side > 0 ? W1(D.x + 1) : W1(D.x - len), len, fy, hh: 4, boss: true });
      atChambers.push({ cx: D.x + D.side * len / 2, cy: fy - 2, w: len, h: 4, band: 3, kind: 'servico', nolink: true });
      // uma antessala de vidro no fim do corredor
      const gw = 16 + ((R() * 6) | 0), gh = 10, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      room(gx0, fy, gw, gh);
      const C = { cx: gx0 + gw / 2, cy: fy - gh / 2, w: gw, h: gh, band: 3, kind: 'antessala', x0: W1(gx0), fy, top: fy - gh };
      atChambers.push(C); atCraters.push(C);
    }
  }
  const B = atBoss;
  const awayFromBoss = (cx, cy, m) => !B || Math.abs(wdx(cx - B.cx)) > 20 + m || cy < B.y0 - 6 - m || cy > B.fy + 6 + m;

  // ---------- 2c. as Escadas que Afundam: dois vãos de laje no fundo, longe um do outro e do lado oposto ao chefe ----------
  for (let tries = 0; atExits.length < 2 && tries < 800; tries++) {
    const w = 14 + ((R() * 6) | 0), h = 9, cx = (R() * WW) | 0, fy = S0 + mb(170) + ((R() * mb(8)) | 0);
    const far = tries < 500 ? Math.min(250, WW / 3) : WW / 5;
    if (!awayFromBoss(cx, fy, tries < 400 ? WW / 4 - 20 : 40) || atExits.some(e => Math.abs(wdx(e.cx - cx)) < far) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'vao', x0: W1(x0), fy, top: fy - h, exit: true };
    atChambers.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    atExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. as Escadarias: terraços em degraus de 3 (a cada 2, um degrau de 6 com escada) e câmaras quadradas ----------
  for (let made = 0, tries = 0; made < 8 * WSC && tries < 300; tries++) {
    const n = 2 + ((R() * 3) | 0), ws = [], hs = [];
    for (let j = 0; j < n; j++) { ws.push(30 + ((R() * 21) | 0)); hs.push(8 + ((R() * 5) | 0)); }
    const total = ws.reduce((a, b) => a + b, 0), x0 = (R() * WW) | 0, dir = R() < 0.5 ? 1 : -1;
    let fy = S0 + mb(dir > 0 ? 16 : 28) + ((R() * mb(8)) | 0);
    const fys = [fy]; for (let j = 1; j < n; j++) { fy += dir * (j % 2 === 0 ? 6 : 3); fys.push(fy); }
    if (Math.min(...fys) - Math.max(...hs) < S0 + 4 || Math.max(...fys) > S0 + mb(44)) continue;
    const cyM = (Math.min(...fys) + Math.max(...fys)) / 2 - 5;
    if (busy(x0 + total / 2, cyM, total, Math.max(...fys) - Math.min(...fys) + 12, 6) || !awayFromBoss(x0 + total / 2, cyM, total / 2)) continue;
    let x = x0;
    for (let j = 0; j < n; j++) {
      room(x, fys[j], ws[j], hs[j]);
      const H = { cx: x + ws[j] / 2, cy: fys[j] - hs[j] / 2, w: ws[j], h: hs[j], band: 0, kind: 'terraco', x0: W1(x), fy: fys[j], top: fys[j] - hs[j], chain: made, stair: j > 0 && j % 2 === 0 ? (dir > 0 ? 'l' : 'r') : null };
      atTerraces.push(H); atChambers.push(H); x += ws[j];
    }
    made += n;
  }
  for (let k = 0, tries = 0; k < 6 * WSC && tries < 300; tries++) {
    const x0 = (R() * WW) | 0, fy = S0 + mb(18 + R() * 24);
    if (fy - 12 < S0 + 3 || busy(x0 + 6, fy - 6, 12, 12, 6)) continue;
    room(x0, fy, 12, 12);
    const H = { cx: x0 + 6, cy: fy - 6, w: 12, h: 12, band: 0, kind: 'camara', x0: W1(x0), fy, top: fy - 12 };
    atTerraces.push(H); atChambers.push(H); k++;
  }

  // ---------- 2e. a Cidade Inversa: quarteirões com os prédios no chão e os mesmos pendurados no teto ----------
  for (let k = 0, tries = 0; k < 6 * WSC && tries < 400; tries++) {
    const w = 24 + ((R() * 17) | 0), h = 14 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(66 + R() * 28);
    if (fy - h < S0 + mb(48) || busy(x0 + w / 2, fy - h / 2, w, h, 7)) continue;
    room(x0, fy, w, h);
    const houses = [], hmax = Math.max(4, Math.min(7, (h - 5) >> 1));
    for (let x = x0 + 3 + ((R() * 3) | 0); x < x0 + w - 7; ) {
      const hw = 4 + ((R() * 5) | 0), hh = 4 + ((R() * (hmax - 3)) | 0);
      if (x + hw > x0 + w - 3) break;
      houses.push({ x0: W1(x), w: hw, h: hh });
      x += hw + 3 + ((R() * 4) | 0);
    }
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'quarteirao', x0: W1(x0), fy, top: fy - h, houses };
    atBlocks.push(H); atChambers.push(H); k++;
  }
  // as Salas de Prumo: 14 x 14 fechadas (ladrilho), a porta no pé de uma parede; o 296 escreve o modelo dentro
  for (let k = 0, tries = 0; k < 2 * WSC && tries < 400; tries++) {
    const x0 = (R() * WW) | 0, fy = S0 + mb(70 + R() * 24), y0 = fy - 13;
    if (y0 < S0 + mb(48) || busy(x0 + 7, y0 + 7, 14, 14, 8)) continue;
    const near = atBlocks.filter(b => Math.abs(b.fy - fy) < 16).sort((a, b) => Math.abs(wdx(a.cx - x0 - 7)) - Math.abs(wdx(b.cx - x0 - 7)))[0];
    if (!near || Math.abs(wdx(near.cx - x0 - 7)) > 80) continue;
    const side = wdx(near.cx - x0 - 7) < 0 ? -1 : 1, dx = side > 0 ? x0 + 13 : x0;
    for (let y = y0 - 1; y <= fy + 1; y++) for (let x = x0 - 1; x <= x0 + 14; x++) seal[I(x, y)] = 1;
    const P = { x0: W1(x0), y0, w: 14, h: 14, fy, door: { x: W1(dx), y: fy - 1, side }, model: 0, rot: 0, pend: null, cx: x0 + 7, cy: y0 + 7 };
    atPrumos.push(P); atChambers.push({ cx: x0 + 7, cy: y0 + 7, w: 16, h: 16, band: 1, kind: 'prumo', nolink: true });
    // a rua da porta até o quarteirão
    const ex = dx + side, tx = side > 0 ? near.x0 : near.x0 + near.w - 1;
    for (let y = fy - 4; y < fy; y++) { seal[I(dx, y)] = 0; seal[I(ex, y)] = 0; }
    street(ex, fy - 1 + 1, tx, near.fy, 4, atCorr);
    k++;
  }

  // ---------- 2f. As Máquinas: salões com passarelas de chapa em andares, poços de pistão ----------
  for (let k = 0, tries = 0; k < 5 * WSC && tries < 400; tries++) {
    const w = 40 + ((R() * 21) | 0), h = 14 + ((R() * 7) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(118 + R() * 28);
    if (fy - h < S0 + mb(100) || busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    room(x0, fy, w, h);
    const decks = []; for (let y = fy - 5; y > fy - h + 3; y -= 5) decks.push(y);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'maquina', x0: W1(x0), fy, top: fy - h, decks };
    atHalls.push(H); atChambers.push(H); k++;
  }
  // salas de serviço pequenas entre os salões
  for (let k = 0, tries = 0; k < 5 * WSC && tries < 300; tries++) {
    const w = 12 + ((R() * 8) | 0), h = 6 + ((R() * 3) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(104 + R() * 44);
    if (busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    room(x0, fy, w, h);
    atChambers.push({ cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'servico', x0: W1(x0), fy, top: fy - h }); k++;
  }

  // ---------- 2g. A Cratera da Estrela: tigelas de vidro e bolsões naturais na rocha fria ----------
  for (let k = 0, tries = 0; k < WSC && tries < 400; tries++) {
    const w = 60 + ((R() * 31) | 0), h = 20 + ((R() * 9) | 0), cx = (R() * WW) | 0, top = S0 + mb(152), fy = Math.min(YB - 5, top + h);
    if (busy(cx, top + h / 2, w, h, 8) || !awayFromBoss(cx, top + h / 2, w / 2 + 8)) continue;
    // a tigela: chão em arco, a borda larga; o teto quase reto (a estrela caiu de cima: o buraco acima foi fechado)
    for (let x = Math.floor(cx - w / 2); x <= cx + w / 2; x++) {
      const u = (x + 0.5 - cx) / (w / 2), bot = Math.round(fy - (fy - top - 6) * (1 - Math.sqrt(Math.max(0, 1 - u * u))) - (nz(x, 0, 10, 0x7c1 + k) - 0.5) * 2);
      const ceil = top + Math.round(Math.abs(u) * 3 + (nz(x, 1, 16, 0x7c2 + k) - 0.5) * 3);
      for (let y = ceil; y < bot; y++) dig(x, y);
    }
    const C = { cx, cy: top + h / 2, w, h, band: 3, kind: 'cratera', x0: W1(Math.floor(cx - w / 2)), fy, top, bowl: true };
    atCraters.push(C); atChambers.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 6 * WSC && tries < 400; tries++) {   // os bolsões naturais (quase não há)
    const b = R() < 0.6 ? 3 : (R() * 3) | 0, w = 10 + ((R() * 10) | 0), h = 6 + ((R() * 4) | 0), cx = (R() * WW) | 0;
    const cy = S0 + mb(AT_BANDS[b] + 6) + h / 2 + R() * Math.max(0, mb(AT_BANDS[b + 1] - AT_BANDS[b] - 12) - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6) || cy + h / 2 > YB - 5) continue;
    blob(cx, cy, w, h, 0x7d00 + k, 1.6);
    atChambers.push({ cx, cy, w, h, band: b, kind: 'natural', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  for (let b = 0; b < 4; b++) {
    const L = atChambers.filter(c => c.band === b && !c.nolink && !c.boss).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      if (P.chain !== undefined && P.chain === Q.chain) continue;   // os terraços da mesma escadaria já se tocam
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (b === 3 && (P.kind === 'natural' || Q.kind === 'natural')) worm(ax, ay - 2, bx, by - 2, 1.35, 0x7700 + k);
      else street(ax, ay, bx, by, b === 1 ? 4 : 5, atCorr);
    }
  }
  // entre as faixas: escadarias longas (2 x WSC por divisa) e os poços de pistão (4 de largura, com a escada embutida)
  for (let b = 0; b < 3; b++) {
    const U = atChambers.filter(c => c.band === b && !c.nolink && !c.boss && c.kind !== 'natural'), D = atChambers.filter(c => c.band === b + 1 && !c.nolink && !c.boss && c.kind !== 'natural');
    for (let k = 0, tries = 0; k < 2 * WSC && tries < 80 && U.length && D.length; tries++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5), by = mouth(Q); if (by - ay < 6 || by - ay > 70 || !awayFromBoss(Q.cx, by, 6)) continue;
      street(ax, ay, Math.round(Q.cx), by, 5); k++;
    }
  }
  {
    const pairs = [[1, 2], [2, 2], [2, 3]];
    for (let k = 0, tries = 0; k < 4 * WSC && tries < 400; tries++) {
      const [bu, bd] = pairs[k % 3];
      const U = atChambers.filter(c => c.band === bu && c.fy && !c.nolink && !c.boss && c.kind !== 'natural'), D = atChambers.filter(c => c.band === bd && c.top && !c.nolink && !c.boss && c.kind !== 'natural');
      const P = U[(R() * U.length) | 0]; if (!P) continue;
      const span = c => { const qa = P.x0 + wdx(c.x0 - P.x0); return [Math.max(P.x0, qa), Math.min(P.x0 + P.w, qa + c.w)]; };
      const Q = D.find(c => c !== P && c.top - P.fy >= 12 && c.top - P.fy <= 34 && span(c)[1] - span(c)[0] >= 10);
      if (!Q) continue;
      const [lo, hi] = span(Q);
      if (hi - lo < 8) continue;
      const sx = lo + 2 + ((R() * (hi - lo - 7)) | 0);
      if (!awayFromBoss(sx, (P.fy + Q.top) / 2, 4)) continue;
      for (let y = P.fy; y < Q.top; y++) for (let x = sx; x < sx + 4; x++) dig(x, y);
      atShafts.push({ x0: W1(sx), top: P.fy, fy: Q.top }); k++;
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
  const okShell = (x, y) => { const i = I(x, y); return SOLID[tiles[i]] && AT_SOILS[tiles[i]] && !atKeep.has(i) && !inAtHall(W1(x), y, 3) && !inAtPrumo(W1(x), y, 1) && y >= S0 && y < YB - 1; };
  // a casca reta: toda rocha do retângulo (a sala com 2 de margem) vira o material da sala; o ar ganha a parede
  const shellRect = (x0, y0, x1, y1, t, w, inner) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (y < S0 || y >= YB - 1 || inAtHall(W1(x), y, 3) || inAtPrumo(W1(x), y, 1)) continue;
      if (SOLID[tiles[i]]) { if (okShell(x, y)) tiles[i] = t; }
      else if (!atKeep.has(i)) walls[i] = inner !== undefined && x > x0 + 1 && x < x1 - 1 && y > y0 + 1 && y < y1 - 1 ? inner : w;
    }
  };
  // a faixa de glifo atrás de toda sala da cidade, 3 acima do chão; na parede sólida do lado, um bloco de glifo aceso
  const glyphBand = (x0, x1, fy) => {
    for (let x = x0; x <= x1; x++) { const i = I(x, fy - 3); if (!SOLID[tiles[i]] && walls[i]) walls[i] = WAT_GLIFO; }
    for (const [x, ix] of [[x0 - 1, x0], [x1 + 1, x1]]) if (okShell(x, fy - 3) && !SOLID[at(ix, fy - 3)]) set(x, fy - 3, AT_GLIFO);
  };
  for (const H of atTerraces) {
    shellRect(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, AT_LAJE, WAT_LAJE);
    glyphBand(H.x0, H.x0 + H.w - 1, H.fy);
  }
  // os degraus de 6 das escadarias ganham a escada embutida no passo 2 do atAfter (todo desnível de 5 ou mais)
  for (const Q of atBlocks) {
    shellRect(Q.x0 - 2, Q.top - 2, Q.x0 + Q.w + 1, Q.fy + 1, AT_LAJE, WAT_LAJE);
    glyphBand(Q.x0, Q.x0 + Q.w - 1, Q.fy);
    // os prédios: casca de laje, por dentro a parede de laje e uma janela de glifo; porta dos dois lados no pé (o de
    // cima, de cabeça para baixo, tem a porta colada no teto)
    for (const P of Q.houses) {
      for (const up of [false, true]) {
        const yA = up ? Q.top : Q.fy - P.h, yB = up ? Q.top + P.h - 1 : Q.fy - 1;
        for (let y = yA; y <= yB; y++) for (let x = P.x0; x < P.x0 + P.w; x++) {
          const edge = x === P.x0 || x === P.x0 + P.w - 1 || (up ? y === yB : y === yA);
          const doorRow = up ? y <= yA + 2 : y >= yB - 2, i = I(x, y);
          if (edge && (x === P.x0 || x === P.x0 + P.w - 1) && doorRow) { tiles[i] = AIR; walls[i] = WAT_LAJE; continue; }
          if (edge) { tiles[i] = AT_LAJE; atKeep.add(i); continue; }
          tiles[i] = AIR; walls[i] = WAT_LAJE;
        }
        // a janela no meio do telhado: um glifo aceso
        const wx = P.x0 + (P.w >> 1), wy = up ? yB : yA; if (P.w >= 6) set(wx, wy, AT_GLIFO);
      }
    }
  }
  for (const Q of atCorr) {
    if (Q.boss) continue;
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j;
      for (let y = Q.fy - Q.hh - 1; y <= Q.fy; y++) {
        const i = I(x, y); if (inAtHall(W1(x), y, 1) || inAtPrumo(W1(x), y, 0) || y < S0 + 1 || y >= YB - 1) continue;
        if (!SOLID[tiles[i]]) { if (!atKeep.has(i)) walls[i] = antigosBand(y) === 2 ? WAT_MAQUINA : WAT_LAJE; continue; }
        if ((y === Q.fy || y === Q.fy - Q.hh - 1) && okShell(x, y)) tiles[i] = antigosBand(y) === 2 ? AT_CHAPA : AT_LAJE;
      }
    }
  }
  // as Máquinas: laje com blocos de engrenagem nas paredes, painel de máquina atrás, o conduto de luz no teto em
  // trechos de 6, as passarelas de chapa em andares (com vãos de 3 para cair)
  for (const H of atHalls) {
    shellRect(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, AT_LAJE, WAT_MAQUINA);
    for (let y = H.top; y < H.fy; y++) for (const x of [H.x0 - 1, H.x0 + H.w, H.x0 - 2, H.x0 + H.w + 1]) if (okShell(x, y) && (y - H.top) % 4 !== 3) set(x, y, AT_ENGRENAGEM);
    for (let x = H.x0; x < H.x0 + H.w; x++) { if (okShell(x, H.top - 1) && (x - H.x0) % 10 < 6) set(x, H.top - 1, AT_CONDUTO); if (okShell(x, H.fy)) set(x, H.fy, AT_CHAPA); }
    for (let d = 0; d < H.decks.length; d++) {
      const y = H.decks[d], gap = H.x0 + 6 + ((hash2(H.x0, y, seed ^ 0x7e1) * (H.w - 15)) | 0), lft = d % 2 === 0;
      for (let x = H.x0 + (lft ? 0 : 5); x < H.x0 + H.w - (lft ? 5 : 0); x++) {
        if (x >= gap && x < gap + 3) continue;
        const i = I(x, y); if (tiles[i] === AIR) { tiles[i] = AT_CHAPA; }
      }
    }
  }
  for (const C of atChambers) if (C.band === 2 && C.kind === 'servico') shellRect(C.x0 - 2, C.top - 2, C.x0 + C.w + 1, C.fy + 1, AT_LAJE, WAT_MAQUINA);
  for (const C of atChambers) if (C.kind === 'camara') {
    shellRect(C.x0 - 2, C.top - 2, C.x0 + C.w + 1, C.fy + 1, AT_LAJE, WAT_LAJE, WAT_GLIFO);
  }
  // os poços de pistão: laje nas paredes, a escada embutida na coluna da esquerda
  for (const S of atShafts) {
    for (let y = S.top - 1; y <= S.fy; y++) {
      for (const x of [S.x0 - 1, S.x0 + 4]) if (okShell(x, y)) set(x, y, (y - S.top) % 6 === 2 ? AT_GLIFO : AT_LAJE);
      for (let x = S.x0; x < S.x0 + 4; x++) { const i = I(x, y); if (!SOLID[tiles[i]]) walls[i] = WAT_MAQUINA; }
      const i = I(S.x0, y); if (y >= S.top - 1 && (tiles[i] === AIR || tiles[i] === AT_CHAPA)) { tiles[i] = AT_ESCADA; atKeep.add(i); }
    }
  }
  // as crateras: vidro forrando, rocha fundida na borda, parede de vidro fosco, lascas no fundo
  for (const C of atCraters) {
    const x0 = Math.floor(C.cx - C.w / 2) - 3, x1 = Math.ceil(C.cx + C.w / 2) + 3, y0 = C.top - 3, y1 = C.fy + 3;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (y < S0 || y >= YB - 1 || inAtHall(W1(x), y, 3)) continue;
      if (!SOLID[tiles[i]]) { if (!atKeep.has(i)) walls[i] = WAT_VIDRO; continue; }
      if (!okShell(x, y)) continue;
      let near = 9; for (let d = 1; d <= 3 && near === 9; d++) if (!SOLID[at(x - d, y)] || !SOLID[at(x + d, y)] || !SOLID[at(x, y - d)] || !SOLID[at(x, y + d)]) near = d;
      if (near > 3) continue;
      const rim = Math.abs(x + 0.5 - C.cx) > C.w / 2 - 6 || y < C.top + 3;
      tiles[i] = C.bowl ? (rim && near <= 2 ? AT_FUNDIDA : near <= 2 ? AT_VIDRO : AT_FUNDIDA) : (near <= 1 ? AT_VIDRO : AT_LAJE);
    }
  }
  // os bolsões naturais: rocha fria em volta
  for (const C of atChambers) if (C.kind === 'natural') {
    for (let y = Math.floor(C.cy - C.h / 2) - 3; y <= C.cy + C.h / 2 + 3; y++) for (let x = Math.floor(C.cx - C.w / 2) - 3; x <= C.cx + C.w / 2 + 3; x++) {
      const i = I(x, y); if (!SOLID[tiles[i]]) { if (!atKeep.has(i) && y >= S0) walls[i] = WAT_PEDRA; continue; }
      if (okShell(x, y) && tiles[i] === AT_PEDRA && hash2(W1(x), y, seed ^ 0x7e3) < 0.7) tiles[i] = AT_ROCHA_FRIA;
    }
  }
  // as rachaduras da estrela: veios de rocha fundida saindo das crateras para cima, entrando nas Máquinas
  {
    const R2 = mulberry32(seed ^ 0x7e5);
    for (const C of atCraters) if (C.bowl) for (let k = 0, n = 4 + ((R2() * 3) | 0); k < n; k++) {
      let x = C.cx + (R2() - 0.5) * C.w * 0.9, y = C.top + 2; const a = -Math.PI / 2 + (R2() - 0.5) * 2.2, len = 22 + R2() * 26;
      for (let s = 0; s < len; s++) {
        x += Math.cos(a) + (R2() - 0.5) * 0.8; y += Math.sin(a) * 0.9 + (R2() - 0.5) * 0.5;
        const tx = Math.round(x), ty = Math.round(y);
        if (okShell(tx, ty) && !inAtLand(W1(tx), ty, 2)) set(tx, ty, AT_FUNDIDA);
        if (s < len * 0.5 && okShell(tx + 1, ty) && R2() < 0.4) set(tx + 1, ty, AT_FUNDIDA);
      }
    }
  }
  // a Sala que se Monta: a caixa toda sólida de ladrilho, parede de ladrilho (o 297 monta os módulos dentro)
  for (let y = B.y0 - 1; y <= B.fy; y++) for (let x = B.x0 - 1; x <= B.x0 + 30; x++) { const i = I(x, y); tiles[i] = AT_LADRILHO; walls[i] = WAT_LAJE; if (agua.length) agua[i] = 0; }
  // as Salas de Prumo: a caixa de ladrilho com a porta no pé (o 296 escreve o modelo)
  for (const P of atPrumos) {
    for (let y = P.y0; y <= P.fy; y++) for (let x = P.x0; x < P.x0 + 14; x++) { const i = I(x, y); tiles[i] = AT_LADRILHO; walls[i] = WAT_LAJE; atKeep.add(i); }
    for (let y = P.fy - 3; y < P.fy; y++) { const i = I(P.door.x, y); tiles[i] = AIR; }
  }

  // ---------- as descidas: a boca vira laje, o Poço dos Antigos com a escada embutida, a câmara de pouso ----------
  for (const E of atEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let y = E.fy - 2; y <= E.fy; y++) for (let x = x0 - 3; x <= x0 + 6; x++) { const i = I(x, y); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 4) && tiles[i] !== BEDROCK) tiles[i] = AT_LAJE; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WAT_LAJE; atKeep.add(i); }
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y > E.fy) { tiles[i] = (y - E.fy) % 6 === 3 ? AT_GLIFO : AT_LAJE; atKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = AT_ESCADA; atKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 4; x++) atKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WAT_LAJE; }
      else if (edge && !(y === L.fy - L.h - 1 && wdx(W1(x) - x0) >= 0 && wdx(W1(x) - x0) < 4)) tiles[i] = AT_LAJE;
      else if (!edge) { tiles[i] = W1(x) === W1(x0 + 1) ? AT_ESCADA : AIR; walls[i] = y === L.fy - 3 ? WAT_GLIFO : WAT_LAJE; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? AT_ESCADA : AIR; walls[i] = WAT_LAJE; }
      atKeep.add(i);
    }
    // duas lâmpadas de glifo no teto, longe do poço
    for (const lx of L.side > 0 ? [L.x0 + 6, L.x0 + 8] : [L.x0 + 1, L.x0 + 3]) if (tiles[I(lx, L.fy - L.h)] === AIR) tiles[I(lx, L.fy - L.h)] = AT_LAMPADA;
  }
  // ---------- as Escadas que Afundam: o vão de laje com a escada embutida até a última linha ----------
  for (const X of atExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WAT_LAJE; atKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = (y - X.top) % 5 === 2 ? AT_GLIFO : AT_LAJE; atKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = AT_ESCADA; atKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { atKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = AT_LAJE; } }
    shellRect(X.C.x0 - 2, X.C.top - 2, X.C.x0 + X.C.w + 1, X.C.fy + 1, AT_LAJE, WAT_LAJE);
    tiles[I(X.x0 + 1, X.fy)] = AT_LAJE;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x7f9b);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !atKeep.has(i) && !inAtHall(W1(x), y, 4) && !inAtPrumo(W1(x), y, 1)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(AT_O_CARVAO, 16 * WSC, 0, 186, 3, 7, t => t === AT_ROCHA_FRIA);
  vein(AT_O_ESTELAR, 5 * WSC, 104, 150, 2, 3, t => t === AT_PEDRA);
  vein(AT_O_ESTELAR, 14 * WSC, 150, 186, 3, 7, t => t === AT_VIDRO || t === AT_FUNDIDA || t === AT_PEDRA);
  // veios grossos perto do fundo das crateras (onde ficam as lascas)
  for (const C of atCraters) if (C.bowl) for (let k = 0; k < 4; k++) {
    let x = Math.round(C.cx + (R4() - 0.5) * C.w * 0.5), y = C.fy + 1;
    for (let s = 0; s < 8; s++) { const i = I(x, y); if ((tiles[i] === AT_VIDRO || tiles[i] === AT_FUNDIDA || tiles[i] === AT_PEDRA) && !atKeep.has(i)) tiles[i] = AT_O_ESTELAR; x += R4() < 0.5 ? -1 : 1; y = clamp(y + (R4() < 0.3 ? 1 : 0), S0 + 1, YB - 2); }
  }
  // os retângulos da gravidade virada (o 296 cuida; o 297 decide na arena)
  AT_GRAV.push({ x0: B.x0, y0: B.y0, w: 30, h: 30, dir: 0, kind: 'arena', ref: B });
  for (const P of atPrumos) AT_GRAV.push({ x0: W1(P.x0 + 1), y0: P.y0 + 1, w: 12, h: 12, dir: 0, kind: 'prumo', ref: P });
}

function atAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = AT_S0, YB = Math.min(WH - 8, S0 + AT_D), R3 = mulberry32(seed ^ 0x7d3c1);
  const atRow = y => y >= S0 && y < YB - 1;
  const inBox = (x, y, m = 0) => inAtHall(x, y, 3 + m) || inAtPrumo(x, y, 1 + m);
  const dig = (x, y) => { if (!atRow(y)) return; const i = I(x, y); if (atKeep.has(i) || inBox(W1(x), y)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WAT_PEDRA; };
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  // o túnel de conserto: reto, como uma rua (primeiro na horizontal, depois uma escadaria)
  const tunnel = (xa, ya, xb, yb) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1;
    for (let k = 0; k <= Math.abs(d); k++) for (let yy = ya - 2; yy <= ya; yy++) dig(xa + k * s, yy);
    for (let yy = Math.min(ya, yb) - 2; yy <= Math.max(ya, yb); yy++) { dig(xb, yy); dig(xb - s, yy); }
  };

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of atEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!atEntries.length && atChambers.length) flood(I(atChambers[0].cx, Math.round(atChambers[0].cy)));
  const B = atBoss;
  if (B) for (let y = B.y0 - 3; y <= B.fy + 3; y++) for (let x = B.x0 - 3; x <= B.x0 + 32; x++) reach[I(x, y)] = 1;
  for (const P of atPrumos) for (let y = P.y0; y <= P.fy; y++) for (let x = P.x0; x < P.x0 + 14; x++) reach[I(x, y)] = 1;
  for (let pass = 0; pass < 60 * WSC; pass++) {
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 16 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
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
    tunnel(best[0], best[1], best[2], best[3]);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {   // o túnel bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = new Int32Array(NN).fill(-1), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || atKeep.has(nb) || atKeep.has(nb - WW) || tiles[nb] === BEDROCK || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada embutida (na cidade) ou corrente de elos (na Cratera) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 0)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || AT_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (atKeep.has(i) || !walls[i] || inBox(lx, yy, 0)) clear = false; }
        if (!clear) continue;
        const tt = antigosBand(y) === 3 ? AT_CORRENTE : AT_ESCADA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  // poços verticais estreitos (3 ou 4 de largura): a escada na coluna da esquerda, se ainda não tiver nada
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !(SOLID[at(x + 3, y)] || SOLID[at(x + 4, y)])) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || AT_CLIMB(at(x, y - 1)) || AT_CLIMB(at(x + 1, y)) || AT_CLIMB(at(x + 2, y)) || inBox(x, y, 0)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (atKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, AT_ESCADA);
  }

  // ---------- 3. a decoração ----------
  const inCrater = (x, y) => atCraters.some(C => C.bowl && Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && y >= C.top - 1 && y <= C.fy + 1);
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || atKeep.has(i)) continue;
    const b = antigosBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inAtLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = atSolid(dn) && BLOCKY[dn] && up === AIR, ceil = atSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (b <= 1 && gap <= 6 && gap >= 3 && atSolid(at(x, y + gap)) && q < 0.008) { for (let j = 0; j < gap; j++) put(x, y + j, AT_COLUNA); continue; }   // a coluna facetada, do teto ao chão
      if (b === 0) { if (q < 0.03 && gap >= 3) put(x, y, AT_LAMPADA); else if (q < 0.04 && gap >= 4) put(x, y, AT_FIO); }
      else if (b === 1) { if (q < 0.025 && gap >= 3) put(x, y, AT_LAMPADA); else if (q < 0.045 && gap >= 4) put(x, y, AT_FIO); }
      else if (b === 2) { if (q < 0.02 && gap >= 3) put(x, y, AT_LAMPADA); else if (q < 0.05 && gap >= 4) put(x, y, AT_FIO); }
      else { if (q < 0.06 && (up === AT_VIDRO || up === AT_FUNDIDA)) put(x, y, AT_ESTALAC); else if (q < 0.07 && gap >= 5) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, AT_CORRENTE); } }
      continue;
    }
    if (!floor || AT_CLIMB(at(x - 1, y)) || AT_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    if (b === 0) { if (q < 0.025) put(x, y, AT_MARCO); else if (q < 0.035) put(x, y, AT_CUBOS); }
    else if (b === 1) { if (q < 0.02) put(x, y, AT_MARCO); else if (q < 0.035) put(x, y, AT_CUBOS); }
    else if (b === 2) { if (q < 0.04) put(x, y, AT_ENGRENA); else if (q < 0.048) put(x, y, AT_CUBOS); }
    else if (inCrater(x, y)) { if (q < 0.07) put(x, y, AT_LASCA); else if (q < 0.13) put(x, y, AT_POEIRA); }
    else { if (q < 0.03) put(x, y, AT_POEIRA); else if (q < 0.04) put(x, y, AT_LASCA); }
  }

  // ---------- 4. os objetos ----------
  atPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function atExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of atEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? AT_ESCADA : AIR; atKeep.add(i); }
}
/* ---------- a subida garantida: da arena, das Salas de Prumo, dos salões, das crateras e do pé das Escadas que
   Afundam o herói tem de conseguir voltar às descidas, sempre com a gravidade normal (pulo de 3; escada e corrente
   sobem) ---------- */
function atClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = AT_S0, YB = Math.min(WH - 8, S0 + AT_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => AT_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const box = (x, y, m = 0) => inAtHall(x, y, m) || inAtPrumo(x, y, m);
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || box(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1) && !L(sx, y)) y++; push(sx, y, 4);
    while (q.length) {
      if (hit >= 0) return win(hit);
      const r = q.pop(), yy = q.pop(), x = q.pop(); cur = ((yy - Y0) * WW + x) * 5 + r; if (yy <= S0 - 3) return win(cur);
      const gr = S(x, yy + 1) || L(x, yy);
      push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
      if (r > 0) push(x, yy - 1, L(x, yy) || L(x, yy - 1) ? 4 : r === 4 ? 2 : r - 1);
      if (!S(x, yy + 1)) push(x, yy + 1, L(x, yy + 1) ? 4 : 0);
    }
    return hit >= 0 ? win(hit) : false;
  };
  const soft = t => t === AT_PEDRA || t === AT_LAJE || t === AT_ROCHA_FRIA || t === AT_CHAPA || t === AT_VIDRO || t === AT_FUNDIDA || t === AT_ENGRENAGEM;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || atKeep.has(I(x, y)) || box(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !atKeep.has(I(x, t)) && !box(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best, cr = antigosBand(bot) === 3;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = cr ? AT_CORRENTE : AT_ESCADA; if (!walls[i]) walls[i] = WAT_PEDRA; } }
    return true;
  };
  const starts = [];
  if (atBoss) for (const D of atBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const P of atPrumos) starts.push([P.door.x + P.door.side * 2, P.fy - 1]);
  for (const c of atHalls) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of atBlocks) starts.push([c.x0 + 1, c.fy - 1]);
  for (const c of atCraters) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of atExits) starts.push([X.x0 + 2, X.top - 1]);
  let fixes = 0, ns = 0;
  for (const [x, y] of starts) { if (SOLID[tiles[I(x, y)]]) continue; for (let k = 0; k < 12 && (ns++, !search(W1(x), y)); k++) { if (!repair()) break; fixes++; } }
  atClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (292): por faixa, no chão, debaixo do teto e na parede. As flags do 292 decidem onde cada um
   pode ficar (terraco: só nos terraços e câmaras das Escadarias; quarteirao: só nos quarteirões; maquina: só nos
   salões de máquinas; cratera: só nas crateras). Nunca sobre escada, corrente ou coluna; nunca no pouso, na arena
   nem nas Salas de Prumo ---------- */
function atPlaceProps() {
  if (typeof AT_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b3d7);
  const S0 = AT_S0, YB = Math.min(WH - 8, S0 + AT_D), used = new Uint8Array(WW * WH * 2), BF = typeof AT_BACK_FLOOR !== 'undefined' ? AT_BACK_FLOOR : {};
  const inBox = (x, y, m = 0) => inAtHall(x, y, 3 + m) || inAtPrumo(x, y, 1 + m);
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const craters = atCraters.filter(C => C.bowl);
  const where = (def, x, y) => (!def.terraco || inside(atTerraces, x, y)) && (!def.quarteirao || inside(atBlocks, x, y)) && (!def.maquina || inside(atHalls, x, y)) && (!def.cratera || inside(craters, x, y));
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || atKeep.has(i) || inBox(W1(x), y, 0) || inAtLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && AT_SOILS[t]; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = AT_BAND_NAMES[clamp(antigosBand(y), 0, 3)], plan = AT_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBox(W1(k), y, 1) || inAtLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
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

// a ordem: a camada, a arena (297: atDress), as Salas de Prumo (296: atPrumoDress), as bocas e a subida; o 87 liga o resto
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!ANTIGOS) return;
  try { atBuild(); atAfter(); if (typeof atDress === 'function') atDress(); if (typeof atPrumoDress === 'function') atPrumoDress(); atExitClear(); atClimbFix(); } catch (err) { console.error(err); }
}; }

/* ---------- a terceira camada atrás da Cidade: torres ao longe nas Escadarias e na Cidade Inversa, engrenagens
   gigantes nas Máquinas, o clarão da estrela na Cratera ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!ANTIGOS) return;
  const Y1 = Math.min(WH, AT_S0 + AT_D + 4);
  for (let y = AT_S0 - 4; y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - AT_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < 98 ? (d > 80 && n > 0.7 ? DP_AT_MAQUINAS : DP_AT_CIDADE) : d < 150 ? (n > 0.8 ? DP_AT_CIDADE : DP_AT_MAQUINAS) : (n > 0.78 ? DP_AT_MAQUINAS : DP_AT_ESTRELA);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (ANTIGOS && ty >= AT_S0 && ty < AT_S0 + AT_D) return AT_ZONE0 + clamp(antigosBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), em centésimos
Object.assign(CATH_SPAWN, {
  [AT_ZONE0]: [[['custodio', 24], ['olhovigia', 20], ['agrimensor', 20], ['tesselas', 18], ['ponteiro', 18]], 8],
  [AT_ZONE0 + 1]: [[['olhovigia', 20], ['cuboerrante', 20], ['embolo', 18], ['ponteiro', 20], ['astrolabio', 22]], 8],
  [AT_ZONE0 + 2]: [[['obreiro', 14], ['embolo', 16], ['custodio', 20], ['tesselas', 18], ['astrolabio', 16], ['agrimensor', 16]], 9],
  [AT_ZONE0 + 3]: [[['estilhaco', 26], ['obreiro', 16], ['cuboerrante', 18], ['astrolabio', 20], ['olhovigia', 20]], 9]
});
// tipos que ainda não existem saem da tabela (o 293 e o 294 registram os construtos)
for (let z = AT_ZONE0; z < AT_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const AT_NO_SPAWN = (tx, ty) => inAtLand(tx, ty, 3) || inAtHall(tx, ty, 4) || inAtPrumo(tx, ty, 2) || atExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
// os níveis pela posição no 129 (layerLvl no 52); nada nasce no pouso, na arena, nas Salas de Prumo nem nas escadas
// atSpawnLivre: o Arquiteto chama os cubos dentro da arena (onde nada nasce sozinho)
let atSpawnLivre = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!ANTIGOS || !e || e.boss || (D && D.boss) || e.atMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - AT_S0;
  if (d >= 0 && d < AT_D) {
    if (!atSpawnLivre && zone >= AT_ZONE0 && zone <= AT_ZONE0 + 3 && AT_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.atVoid = true; return e; }
    const lvl = layerLvl(layerLo('antigos'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].atVoid) enemies.splice(k, 1); });

/* ---------- partículas: poeira de estrela subindo reta e devagar (não há vento nenhum); nas Máquinas, um brilho
   ciano a intervalos certos; na Cratera, mais poeira e uma ou outra fagulha branca ---------- */
let atPulse = 0;
HOOK.update.push(dt => {
  if (!ANTIGOS || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = antigosBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  atPulse += dt;
  if (Math.random() < dt * (b === 3 ? 6 : 3)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 3 && Math.random() < 0.3) parts.push({ x, y, vx: 0, vy: rnd(-14, -8), g: 0, life: 1.4, max: 1.4, col: '#ffffff', size: 1 });
    else parts.push({ x, y, vx: 0, vy: rnd(-4, -2), g: 0, life: 4, max: 4, col: Math.random() < 0.6 ? '#e8f0ff' : '#b4b8e8', size: 1 });
  }
  // nas Máquinas, a cada 2 s em ponto, um pulso ciano sai dos condutos à vista
  if (b === 2 && atPulse >= 2) {
    atPulse = 0;
    const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
    for (let y = y0; y < y0 + Math.ceil(VH / T) + 1; y++) for (let x = x0; x < x0 + Math.ceil(VW / T) + 1; x += 2) {
      if (tileAt(x, y) !== AT_CONDUTO) continue;
      parts.push({ x: x * T + T / 2, y: y * T + T, vx: 0, vy: 2, g: 0, life: 0.8, max: 0.8, col: '#9af0f0', size: 1 });
    }
  }
  if (atPulse > 2) atPulse = 0;
});

/* ---------- a forja e o vilarejo: o ferro estelar na fornalha (298 tem os itens), as lojas ---------- */
FURN.min_ferro_estelar = { bar: 'barra_ferro_estelar', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_ferro_estelar: 66, barra_ferro_estelar: 530, nucleo_estelar: 40, tessela: 10, lente_vigia: 30, po_estelar: 22 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'lente_vigia' || id === 'po_estelar'; c.hint = c.hint.replace(/\.$/, '') + ', lentes de vigia e pó estelar.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_ferro_estelar', 'barra_ferro_estelar', 'nucleo_estelar', 'tessela'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', ferro estelar, núcleos estelares e tesselas.'; }

// a Lança-Compasso (298) alcança 8 px a mais que as outras lanças (o recalc do 08 põe o alcance do tipo)
{ const _rc = recalc; recalc = function () { const r = _rc.apply(this, arguments); const w = equip.weapon, it = w && ITEMS[w.id]; if (it && it.atReach) pl.reach += it.atReach; return r; }; }
