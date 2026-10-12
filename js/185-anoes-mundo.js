'use strict';

/* ================= a Fortaleza dos Anões: o mundo debaixo da Floresta Petrificada =================
   buildCathedral() já faz todas as camadas de cima; aqui ganha mais um passo, anBuild() e anAfter(), que fazem
   Brasafunda, a fortaleza do Clã da Bigorna (docs/camadas/08-fortaleza-anoes.md, seção 3; docs/anoes-spec.md).
   Ao contrário das outras camadas, a fortaleza é construída: andares fixos por faixa (a linha do piso de cada um é
   um corredor reto de 3 de altura que dá a volta no mundo), e as salas se alinham neles, como a mina faz com as galerias.
     1. a rocha: granito anão em tudo, com bolsões de rocha natural; a rocha de cima afina nas primeiras 8 linhas
     2. as duas escadarias do clã: poços de cantaria com escada anã que descem das duas descidas da camada de cima até
        a guarita de pouso (12 x 6, sem spawn) nos Portões de Bronze
     3. a Grande Forja (o chefe, o 186 monta o lado de dentro com anDress), do outro lado do mundo, e a Oficina do Mestre
     4. os andares: Portões (muralhas com seteiras, guaritas), Salões (grandes salões de colunas, refeitórios,
        dormitórios em fileira, túmulos dos reis), Canais (salas de canal com lava debaixo de grade, salas de máquinas,
        eclusas com comporta e alavanca), Forjas (forjas com fornalha e canal curto, as duas brechas da Colmeia)
     5. escadas anãs entre os andares; barricadas de entulho viradas para baixo; poucas cavernas naturais
     6. veios: carvão em tudo, mithril no granito (raro nos Portões, denso nos Canais e nas Forjas)
     7. tudo alcançável das escadarias (túneis de serviço retos se faltar), escada anã em todo desnível de 5 ou mais
     8. decoração de 1 bloco, objetos (182), a subida garantida (anClimbFix)
   Lava só existe dentro de canais de pedra de canal, sempre com grade por cima: nunca fica no caminho.
   Também aqui: a terceira camada, as zonas 37 a 40 (nomes no 188), o spawn, o nível (layerLvl), as partículas, a
   queimadura, o que as três bases fazem, a fornalha (mithril, brasa domada) e as lojas. */

let anChambers = [], anLand = [], anEclusas = [], anLines = [];
const AN_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [AN_GRANITO, AN_CANTARIA, AN_LAJE, AN_BRONZE, AN_GRADE, AN_CANAL, AN_TIJOLO, AN_CERA, AN_ENTULHO, AN_O_CARVAO, AN_O_MITHRIL, AN_SETEIRA]) AN_SOILS[t] = 1;
const AN_CLIMB = t => t === AN_ESCADA || t === AN_CORRENTE || t === CHAIN || (typeof CD_ESCADA !== 'undefined' && (t === CD_ESCADA || t === CD_CORRENTE));
// as linhas de piso de cada faixa, em metros abaixo do topo da camada (cada uma é um corredor que dá a volta)
const AN_FLOORS = [[16, 30, 44], [70, 94], [118, 146], [168, 182]];
// o maior pé-direito de sala em cada linha (até a linha de cima, menos a laje)
const AN_ROOM_H = { 16: 11, 30: 12, 44: 12, 70: 22, 94: 22, 118: 18, 146: 24, 168: 14, 182: 12 };

function anBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const UP = anAbove();
  AN_S0 = Math.min(WH - 12, UP.S0 + Math.min(UP.D, WH - 8 - UP.S0));
  const S0 = AN_S0, YB = Math.min(WH - 8, S0 + AN_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x8a2f), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < AN_BANDS[1] ? 0 : d < AN_BANDS[2] ? 1 : d < AN_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  anChambers = []; anLand = []; anEclusas = []; anLines = []; anEntries = []; anExits = []; anBoss = null; anOficina = null;
  anLevers = []; anChannels = []; anSlits = []; anRooms = []; anKeep.clear();

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 8; y < S0; y++) {   // o granito anão sobe nas últimas linhas da camada de cima
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x8b2);
      if (SOLID[tiles[i]] && UP.soils && UP.soils[tiles[i]] && h < k * 0.85) tiles[i] = AN_GRANITO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = AN_GRANITO; walls[i] = WAN_GRANITO; continue; }   // abaixo da camada: o granito, sem ruído (a de baixo escreve por cima)
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x8b3);
      if (k < 1 && UP.thin && h > 0.4 + k * 0.6) { tiles[i] = UP.thin; walls[i] = UP.thinW || WAN_GRANITO; continue; }   // a rocha de cima afina
      // bolsões de rocha natural: o granito fica mais grosso e quebrado (entulho de pedra solta) em manchas
      // (o segundo ruído só onde o primeiro já passou)
      tiles[i] = nz(x, y, 30, 0x8a1) > 0.74 && nz(x, y, 14, 0x8a2) > 0.55 ? AN_ENTULHO : AN_GRANITO;
      walls[i] = WAN_GRANITO;
      if (agua.length) agua[i] = 0;   // a água do mundo de antes não fica presa na rocha nova
    }
  }

  // ---------- 2. as cavernas naturais (poucas), depois a fortaleza ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const P0 = [0.2, 0.18, 0.22, 0.16];   // poucas: a rocha natural que os anões não chegaram a cavar
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x8c1), d = y - S0;
    cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.4 - (d < 5 ? 0.2 : 0) ? 1 : 0;
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
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };   // fica sólido (o chão de uma sala)
  const busy = (cx, cy, w, h, m = 4) => anChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const later = [];   // o que se escreve depois que as cavernas viram ar: [x, y, tile, wall?]
  const put = (x, y, t, w) => later.push([W1(x), y, t, w]);
  // uma sala retangular de chão plano: `fy` é a fileira do chão, o ar de fy - h a fy - 1
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  // cada faixa é LAYER_K andares iguais à faixa do desenho (ABD, metros de desenho): a linha da profundidade m do desenho
  // no andar s da faixa b; lineY(m) é a do último andar (onde ficam a Grande Forja, a Oficina e as brechas)
  const ABD = AN_BANDS.map(v => v / LAYER_K), bOf = m => m < ABD[1] ? 0 : m < ABD[2] ? 1 : m < ABD[3] ? 2 : 3;
  const lvY = (b, s, m) => S0 + AN_BANDS[b] + s * (ABD[b + 1] - ABD[b]) + (m - ABD[b]);
  const lineY = m => Math.min(YB - 4, lvY(bOf(m), LAYER_K - 1, m));

  // ---------- 2a. as duas escadarias do clã: um poço quadrado de cantaria desce de cada descida da camada de cima ----------
  const landM = 16, landFy = lvY(0, 0, landM);
  const ups = (UP.exits || []).filter(c => c && c.fy);
  for (const F of ups.slice(0, 2)) {
    const xs = W1(Math.round(F.cx !== undefined ? F.cx : F.x0 + 2) - 2);   // xs..xs+3: o poço, a escada na coluna xs + 1
    const side = R() < 0.5 ? -1 : 1;
    // a guarita de pouso, 12 x 6, do lado do poço, com o chão na linha do primeiro andar
    const hx = side < 0 ? xs - 12 : xs + 4;
    for (let y = landFy - 7; y <= landFy; y++) for (let x = hx - 1; x <= hx + 12; x++) seal[I(x, y)] = 1;
    for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 12; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    for (let x = hx; x < hx + 12; x++) { const i = I(x, landFy); cv[i] = 0; keep[i] = 1; }
    // as portas da guarita: dos dois lados, rentes ao chão (uma dá no poço, a outra no corredor do andar)
    for (const dx of [hx - 1, hx + 12]) for (let y = landFy - 3; y < landFy; y++) { const i = I(dx, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
    const L = { x0: W1(hx), fy: landFy, w: 12, h: 6 };
    anLand.push(L);
    // o poço: do chão da sala de cima até o chão da guarita
    for (let y = F.fy; y < landFy; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
    for (let x = xs; x < xs + 4; x++) hard(x, landFy);
    anEntries.push({ x0: xs, fy: F.fy, top: F.fy - 2, land: L, side });
    anChambers.push({ cx: hx + 6, cy: landFy - 3, w: 12, h: 6, band: 0, kind: 'guarita', fy: landFy, x0: W1(hx), land: true, nolink: true });
  }
  const awayFromEntries = (cx, m) => anEntries.every(E => Math.abs(wdx(E.x0 - cx)) > m);

  // ---------- 2b. a Grande Forja, do outro lado do mundo em relação às escadarias (o 186 monta o lado de dentro) ----------
  {
    const w = 64, h = 28, ax = anEntries.length ? anEntries.reduce((s, e) => s + wdx(e.x0 - anEntries[0].x0), 0) / anEntries.length + anEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = lineY(182), top = fy - h, x0 = cx - (w >> 1);
    for (let y = top - 2; y <= fy + 2; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) seal[I(x, y)] = 1;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    const doors = [];
    for (const s of [-1, 1]) {
      const dx = s < 0 ? x0 - 1 : x0 + w;
      for (let k = 0; k < 2; k++) for (let y = fy - 4; y < fy; y++) { const i = I(dx + s * k, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
      doors.push({ side: s, x: W1(dx), fy });
    }
    anBoss = { x0: W1(x0), x1: W1(x0 + w - 1), cx, w, h, top, fy, doors };
    anChambers.push({ cx, cy: fy - (h >> 1), w: w + 4, h: h + 4, band: 3, boss: true, nolink: true });
  }

  // ---------- 2c. as eclusas: poços de 6 de largura entre as duas linhas dos Canais, com uma comporta na boca de cima (antes
  // das salas, que desviam delas) ----------
  for (let s = 0; s < LAYER_K; s++) {   // em cada andar dos Canais
    const ya = lvY(2, s, 118), yb = lvY(2, s, 146);
    for (let k = 0, tries = 0; k < 2 * WSC && tries < 3000; tries++) {
      const x0 = (R() * WW) | 0;
      if (busy(x0 + 3, (ya + yb) / 2, 10, yb - ya, 2) || inAnHall(x0, yb, 8)) continue;
      for (let y = ya; y < yb; y++) for (let x = x0; x < x0 + 6; x++) dig(x, y);
      anEclusas.push({ x0: W1(x0), ya, yb });
      anChambers.push({ cx: x0 + 3, cy: (ya + yb) / 2, w: 6, h: yb - ya, band: 2, kind: 'eclusa', nolink: true });
      k++;
    }
  }

  // ---------- 2d. os andares: a linha do piso de cada um é um corredor reto que dá a volta; as salas se alinham nele ----------
  const ROOMS = [
    // faixa: [tipo, peso, largura mín, máx, altura mín, máx, limite (x WSC)]
    [['muralha', 3, 30, 44, 12, 16, 6], ['guarita', 4, 10, 10, 7, 7, 12]],
    [['salao', 4, 36, 56, 14, 20, 6], ['refeitorio', 3, 20, 20, 8, 8, 6], ['dormitorio', 3, 14, 14, 6, 6, 8], ['tumulo', 2, 18, 18, 10, 10, 2]],
    [['sala_canal', 4, 40, 60, 12, 18, 5], ['maquinas', 3, 16, 24, 16, 24, 4]],
    [['forja', 5, 24, 32, 12, 12, 5]]
  ];
  const kindCount = {};
  const avoidBoss = (x0, w, fy, h) => { const B = anBoss; return Math.abs(wdx(x0 + w / 2 - B.cx)) < (w + B.w) / 2 + 6 && fy >= B.top - 4 && fy - h <= B.fy + 4; };
  const avoidLand = (x0, w, fy, h) => anLand.some(L => Math.abs(wdx(x0 + w / 2 - (L.x0 + 6))) < w / 2 + 12 && Math.abs(fy - L.fy) < h + 8) || anEntries.some(E => Math.abs(wdx(x0 + w / 2 - (E.x0 + 2))) < w / 2 + 6 && fy - h <= landFy + 2 && fy >= E.fy);
  for (let b = 0; b < 4; b++) for (let s = 0; s < LAYER_K; s++) for (const m of AN_FLOORS[b]) {
    const fy = Math.min(YB - 4, lvY(b, s, m)), hmax = Math.min(AN_ROOM_H[m], fy - S0 - 3), Ln = { fy, band: b, m, rooms: [] };
    anLines.push(Ln);
    // o corredor: 3 de altura, laje no chão, cantaria no teto
    for (let x = 0; x < WW; x++) {
      if (inAnHall(x, fy - 2, 3) || anLand.some(L => wdx(x - L.x0) >= 0 && wdx(x - L.x0) < 12 && Math.abs(fy - L.fy) < 2)) continue;
      for (let y = fy - 3; y < fy; y++) dig(x, y);
      hard(x, fy);
    }
    // as salas, uma atrás da outra com um trecho de corredor entre elas
    let x = (R() * WW) | 0, done = 0;
    while (done < WW - 30) {
      const gap = 6 + ((R() * 16) | 0); x += gap; done += gap;
      const opts = ROOMS[b].filter(o => (kindCount[o[0]] || 0) < o[6] * WSC * LAYER_K && o[4] <= hmax), tot = opts.reduce((s, o) => s + o[1], 0);
      if (!opts.length) break;
      let q = R() * tot, o = opts[0]; for (const p of opts) { q -= p[1]; if (q <= 0) { o = p; break; } }
      const [kind, , wa, wb, ha, hb] = o, w = wa + ((R() * (wb - wa + 1)) | 0), h = Math.min(hmax, ha + ((R() * (hb - ha + 1)) | 0));
      if (done + w > WW - 20) break;
      if (avoidBoss(x, w, fy, h) || avoidLand(x, w, fy, h) || busy(x + w / 2, fy - h / 2, w, h, 1)) { x += w; done += w; continue; }
      // os dormitórios vêm em fileira: 2 a 4 quartos de 14 x 6 colados, com uma parede de cantaria e uma porta entre eles
      const n = kind === 'dormitorio' ? 2 + ((R() * 3) | 0) : 1, ww = kind === 'dormitorio' ? n * 15 - 1 : w;
      if (done + ww > WW - 20) break;
      for (let k = 0; k < n; k++) {
        const rx = x + k * 15, rw = kind === 'dormitorio' ? 14 : w;
        room(rx, fy, rw, h);
        const C = { cx: rx + rw / 2, cy: fy - h / 2, w: rw, h, band: b, kind, x0: W1(rx), fy, top: fy - h, id: anRooms.length };
        anRooms.push(C); anChambers.push(C); Ln.rooms.push(C);
        kindCount[kind] = (kindCount[kind] || 0) + 1;
      }
      x += ww; done += ww;
    }
  }
  // a Oficina do Mestre: 20 x 10 na última linha, perto da Grande Forja, numa das salas de forja ou num trecho livre
  {
    const fy = lineY(182), B = anBoss;
    for (let t = 0; t < 80 && !anOficina; t++) {
      const s = t & 1 ? 1 : -1, off = B.w / 2 + 8 + ((t >> 1) * 4), x0 = W1(Math.round(B.cx + s * off - (s < 0 ? 20 : 0)));
      if (busy(x0 + 10, fy - 5, 20, 10, 2)) continue;
      room(x0, fy, 20, 10);
      anOficina = { x0, fy, w: 20, h: 10, cx: W1(x0 + 10) };
      const C = { cx: x0 + 10, cy: fy - 5, w: 20, h: 10, band: 3, kind: 'oficina', x0, fy, top: fy - 10, id: anRooms.length };
      anRooms.push(C); anChambers.push(C);
    }
  }
  // as duas brechas da Colmeia: as forjas da última linha mais longe uma da outra e da Grande Forja
  {
    const fy = lineY(182), L = anRooms.filter(c => c.kind === 'forja' && c.fy === fy && Math.abs(wdx(c.cx - anBoss.cx)) > anBoss.w / 2 + 40 && awayFromEntries(c.cx, 30));
    const picks = [];
    for (const c of L.sort(() => R() - 0.5)) { if (picks.length >= 2) break; if (picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 150)) picks.push(c); }
    for (const c of L) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 60)) picks.push(c); }
    if (picks.length < 2) for (let t = 0; t < 400 && picks.length < 2; t++) {   // não deu: uma sala de forja nova num trecho de corredor
      const x0 = (R() * WW) | 0, w = 26;
      if (Math.abs(wdx(x0 + 13 - anBoss.cx)) < anBoss.w / 2 + 40 || busy(x0 + 13, fy - 6, w, 12, 2) || picks.some(p => Math.abs(wdx(p.cx - x0 - 13)) < 60)) continue;
      room(x0, fy, w, 12);
      const C = { cx: x0 + 13, cy: fy - 6, w, h: 12, band: 3, kind: 'forja', x0: W1(x0), fy, top: fy - 12, id: anRooms.length };
      anRooms.push(C); anChambers.push(C); picks.push(C);
    }
    for (const c of picks) {
      c.brecha = true;
      const cx = W1(Math.round(c.cx));
      anExits.push({ cx, x0: W1(cx - 2), x1: W1(cx + 1), fy: c.fy, w: c.w, top: c.top, bot: c.fy });
    }
  }

  // ---------- 2d'. as grutas que os anões não cavaram: bolsões de rocha natural entre os andares ----------
  const blob = (cx, cy, w, h, sd) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * 1.6 : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, sd) - 0.5) * 0.3 + (nz(x, y, 40, sd) - 0.5) * 0.4) dig(x, y);
    }
  };
  for (let k = 0, tries = 0; k < 10 * WSC * LAYER_K && tries < 400 * LAYER_K; tries++) {
    const w = 20 + ((R() * 22) | 0), h = 8 + ((R() * 7) | 0), cx = (R() * WW) | 0, cy = S0 + 6 + R() * (DB - 14);
    if (busy(cx, cy, w, h, 3) || inAnHall(cx, cy, w / 2 + 6)) continue;
    blob(cx, cy, w, h, 0x8f00 + k);
    anChambers.push({ cx, cy, w, h, band: bandOf(cy - S0), kind: 'gruta', nolink: true }); k++;
  }

  // ---------- 2e. escadas entre os andares: poços de 3 com escada anã, ligando cada linha à de baixo ----------
  const stairs = [];
  for (let k = 0; k + 1 < anLines.length; k++) {
    const A = anLines[k], B = anLines[k + 1], n = (A.band === B.band ? 5 : 4) * WSC;
    for (let j = 0, tries = 0; j < n && tries < n * 30; tries++) {
      const x0 = (R() * WW) | 0;
      if (inAnHall(x0, B.fy - 2, 6) || inAnHall(x0 + 2, B.fy - 2, 6) || stairs.some(s => Math.abs(wdx(s.x0 - x0)) < 30 && s.k === k)) continue;
      if (anLand.some(L => Math.abs(wdx(x0 - L.x0 - 6)) < 14) || anEclusas.some(E => Math.abs(wdx(x0 - E.x0)) < 10)) continue;
      // não abre buraco no chão de uma sala de canal (a lava fica debaixo do chão) nem no meio de uma guarita
      if (A.rooms.some(c => (c.kind === 'sala_canal' || c.kind === 'forja' || c.kind === 'guarita' || c.kind === 'tumulo') && wdx(x0 - c.x0) > -4 && wdx(x0 - c.x0) < c.w + 1)) continue;
      for (let y = A.fy - 1; y < B.fy; y++) for (let x = x0; x < x0 + 3; x++) dig(x, y);
      stairs.push({ x0: W1(x0), ya: A.fy - 1, yb: B.fy, k });
      j++;
    }
  }

  // ---------- 2f. cavernas: as bolsinhas pequenas fecham, as ilhas soltas no ar abrem ----------
  {
    const lab = new Int32Array(NN).fill(-1), st = [];
    for (let i0 = S0 * WW; i0 < YB * WW; i0++) {
      if (!cv[i0] || lab[i0] >= 0) continue;
      const comp = []; lab[i0] = i0; st.push(i0);
      while (st.length) { const c = st.pop(), x = c % WW, row = c - x; comp.push(c); for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && cv[nb] && lab[nb] < 0) { lab[nb] = i0; st.push(nb); } }
      if (comp.length < 14 && !comp.some(c => keep[c])) for (const c of comp) cv[c] = 0;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 40) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 3. a fortaleza de pedra: o que as salas viram ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && (tiles[i] === AN_GRANITO || tiles[i] === AN_ENTULHO) && !anKeep.has(i)) tiles[i] = t; };
  // os corredores: laje no chão, cantaria no teto, parede de cantaria
  for (const Ln of anLines) for (let x = 0; x < WW; x++) {
    if (at(x, Ln.fy - 1) !== AIR) continue;
    for (let y = Ln.fy - 3; y < Ln.fy; y++) { const i = I(x, y); if (tiles[i] === AIR) walls[i] = WAN_CANTARIA; }
    if (SOLID[at(x, Ln.fy)]) shell(x, Ln.fy, AN_LAJE);
    let c = Ln.fy - 4; while (c > Ln.fy - 30 && at(x, c) === AIR) c--;
    if (c === Ln.fy - 4) shell(x, c, AN_CANTARIA);
  }
  const WALL_OF = { muralha: WAN_CANTARIA, guarita: WAN_CANTARIA, salao: WAN_RELEVO, refeitorio: WAN_CANTARIA, dormitorio: WAN_CANTARIA, tumulo: WAN_RELEVO, sala_canal: WAN_CANTARIA, maquinas: WAN_BRONZE, forja: WAN_TIJOLO, oficina: WAN_RELEVO };
  const SHELL_OF = { forja: AN_TIJOLO, maquinas: AN_BRONZE };
  for (const C of anRooms) {
    const w0 = WALL_OF[C.kind] || WAN_CANTARIA, sh = SHELL_OF[C.kind] || AN_CANTARIA;
    for (let y = C.top - 1; y <= C.fy; y++) for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) {
      const i = I(x, y); if (SOLID[tiles[i]]) shell(x, y, y === C.fy ? (C.kind === 'forja' ? AN_TIJOLO : AN_LAJE) : sh); else walls[i] = w0;
    }
  }
  // as escadas: a escada anã numa beira, parede de cantaria atrás
  for (const S of stairs) {
    const lx = S.x0 + (hash2(S.x0, S.ya, seed) < 0.5 ? 0 : 2);
    for (let y = S.ya; y < S.yb; y++) { for (let x = S.x0; x < S.x0 + 3; x++) if (at(x, y) === AIR) walls[I(x, y)] = WAN_CANTARIA; if (at(lx, y) === AIR) set(lx, y, AN_ESCADA); }
    for (let y = S.ya; y < S.yb; y++) for (const x of [S.x0 - 1, S.x0 + 3]) shell(x, y, AN_CANTARIA);
  }
  // as escadarias do clã: poço de cantaria com escada anã e corrimão de bronze; a guarita com laje e paredes de cantaria
  for (const E of anEntries) {
    for (let y = E.fy - 2; y < E.land.fy; y++) {
      for (const x of [E.x0 - 1, E.x0 + 4]) { const i = I(x, y); if (SOLID[tiles[i]]) tiles[i] = y % 6 === 0 ? AN_BRONZE : AN_CANTARIA; else walls[i] = WAN_CANTARIA; anKeep.add(i); }
      for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); if (tiles[i] !== AIR) continue; walls[i] = WAN_CANTARIA; anKeep.add(i); }
      if (y >= E.fy) set(E.x0 + 1, y, AN_ESCADA);
    }
    const L = E.land;
    for (let y = L.fy - 7; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + 12; x++) {
      const i = I(x, y); if (SOLID[tiles[i]]) tiles[i] = y === L.fy ? AN_LAJE : AN_CANTARIA; else walls[i] = WAN_RELEVO; anKeep.add(i);
    }
    put(L.x0 + 3, L.fy - 4, AN_LAMPADA); put(L.x0 + 8, L.fy - 4, AN_LAMPADA);
  }
  // a Grande Forja: a casca de tijolo refratário (2) e o chão de laje; o 186 monta o resto
  {
    const B = anBoss, x0 = B.cx - (B.w >> 1);
    for (let y = B.top - 2; y <= B.fy + 1; y++) for (let x = x0 - 2; x < x0 + B.w + 2; x++) {
      const i = I(x, y); if (SOLID[tiles[i]]) tiles[i] = y >= B.fy ? AN_LAJE : (x - x0 + y) % 7 === 0 ? AN_CANTARIA : AN_TIJOLO; else walls[i] = WAN_TIJOLO; anKeep.add(i);
    }
    for (const D of B.doors) for (let k = 0; k < 2; k++) for (let y = D.fy - 4; y < D.fy; y++) { const i = I(D.x + D.side * k, y); tiles[i] = AIR; walls[i] = WAN_TIJOLO; }
  }
  // as muralhas e as guaritas: seteiras nas paredes dos lados (o besteiro aparece nelas)
  for (const C of anRooms) {
    if (C.kind !== 'muralha' && C.kind !== 'guarita') continue;
    const rows = C.kind === 'guarita' ? [C.fy - 3] : [C.fy - 3, C.fy - 7, C.fy - 11].filter(y => y > C.top);
    for (const y of rows) for (const x of [C.x0 - 1, C.x0 + C.w]) {
      if (y >= C.fy - 3 && y <= C.fy - 1) continue;   // não tapa a porta do corredor
      const i = I(x, y); if (!SOLID[tiles[i]]) continue;
      tiles[i] = AN_SETEIRA; anSlits.push({ x: W1(x), y, room: C.id }); anKeep.add(i);
    }
    // na guarita a seteira fica no alto da parede, por cima da porta
    if (C.kind === 'guarita') for (const x of [C.x0 - 1, C.x0 + C.w]) { const y = C.fy - 5, i = I(x, y); if (SOLID[tiles[i]]) { tiles[i] = AN_SETEIRA; anSlits.push({ x: W1(x), y, room: C.id }); anKeep.add(i); } }
    // e na parede de dentro, de frente para quem entra: seteiras no alto da sala (o fundo da muralha)
    if (C.kind === 'muralha') for (let x = C.x0 + 6; x < C.x0 + C.w - 6; x += 9) { const y = C.top - 1, i = I(x, y); if (SOLID[tiles[i]]) { tiles[i] = AN_SETEIRA; anSlits.push({ x: W1(x), y, room: C.id }); anKeep.add(i); } }
  }
  // os grandes salões: colunas do chão ao teto desenhadas na parede (cantaria lisa sobre o relevo), capitel no teto
  for (const C of anRooms) {
    if (C.kind !== 'salao' && C.kind !== 'tumulo') continue;
    for (let x = C.x0 + 4; x < C.x0 + C.w - 4; x += 8) {
      for (let y = C.top; y < C.fy; y++) for (const k of [0, 1]) { const i = I(x + k, y); if (tiles[i] === AIR) walls[i] = WAN_CANTARIA; }
      for (const k of [-1, 0, 1, 2]) shell(x + k, C.top - 1, AN_CANTARIA);
      // uma coluna caída: um monte de entulho no pé dela
      if (C.kind === 'salao' && R() < 0.2) for (let k = -2; k <= 3; k++) { const hgt = k === 0 || k === 1 ? 2 : 1; for (let j = 1; j <= hgt; j++) put(x + k, C.fy - j, AN_ENTULHO); }
    }
  }
  // as salas de canal: um canal de lava de 2 de fundo debaixo do chão, coberto de grade de bronze em todo o comprimento
  const channel = (xa, xb, fy) => {
    for (let x = xa - 1; x <= xb + 1; x++) for (let y = fy + 1; y <= fy + 3; y++) { const i = I(x, y); tiles[i] = x < xa || x > xb || y === fy + 3 ? AN_CANAL : LAVA; walls[i] = WAN_CANTARIA; anKeep.add(i); }
    for (let x = xa; x <= xb; x++) { const i = I(x, fy); tiles[i] = AN_GRADE; anKeep.add(i); }
    for (const x of [xa - 1, xb + 1]) { const i = I(x, fy); tiles[i] = AN_CANAL; anKeep.add(i); }
    anChannels.push({ x0: W1(xa), x1: W1(xb), y: fy + 1 });
  };
  for (const C of anRooms) {
    if (C.kind === 'sala_canal') channel(C.x0 + 3, C.x0 + C.w - 4, C.fy);
    else if (C.kind === 'forja' && !C.brecha) { const a = C.x0 + 4 + ((R() * Math.max(1, C.w - 16)) | 0); channel(a, a + 6, C.fy); }
  }
  // as salas de máquinas: uma passarela de bronze no meio da altura com escada, e o eixo das engrenagens no teto
  for (const C of anRooms) {
    if (C.kind !== 'maquinas') continue;
    const py = C.fy - Math.round(C.h / 2), s = R() < 0.5;
    const xa = s ? C.x0 + 1 : C.x0 + Math.round(C.w / 2), xb = s ? C.x0 + Math.round(C.w / 2) : C.x0 + C.w - 2;
    for (let x = xa; x <= xb; x++) put(x, py, AN_BRONZE);
    const lx = s ? xb + 1 : xa - 1; for (let y = py; y < C.fy; y++) put(lx, y, AN_ESCADA);
    for (let x = C.x0; x < C.x0 + C.w; x++) shell(x, C.top - 1, AN_EIXO);
  }
  // a Oficina: relevo, laje, a marca do clã (o 182 desenha a marca; o pedestal sai no 185 junto com os objetos)
  // as brechas: cera seca na beira do chão, dos dois lados do buraco (a camada de baixo corta o buraco)
  for (const E of anExits) for (const x of [E.x0 - 2, E.x0 - 1, E.x1 + 1, E.x1 + 2]) { const i = I(x, E.fy); tiles[i] = AN_CERA; anKeep.add(i); }
  // as eclusas: casca de bronze, a corrente do alto ao fundo, a comporta fechada na boca de cima, uma alavanca em cada andar
  for (const E of anEclusas) {
    for (let y = E.ya; y < E.yb; y++) {
      for (const x of [E.x0 - 1, E.x0 + 6]) { const i = I(x, y); if (SOLID[tiles[i]]) { tiles[i] = (y - E.ya) % 5 === 0 ? AN_BRONZE : AN_CANTARIA; anKeep.add(i); } }
      for (let x = E.x0; x < E.x0 + 6; x++) { const i = I(x, y); if (tiles[i] === AIR) walls[i] = WAN_BRONZE; }
      if (y > E.ya) set(E.x0 + 2, y, AN_CORRENTE);
    }
    const gate = []; for (let x = E.x0; x < E.x0 + 6; x++) { const i = I(x, E.ya); tiles[i] = AN_COMPORTA; walls[i] = WAN_BRONZE; anKeep.add(i); gate.push(i); }
    E.gate = gate;
    for (const [lx, ly] of [[E.x0 - 3, E.ya - 1], [E.x0 + 8, E.yb - 1]]) {
      const i = I(lx, ly); if (tiles[i] !== AIR || !SOLID[tiles[i + WW]]) continue;
      tiles[i] = AN_ALAVANCA; anKeep.add(i); anLevers.push({ x: W1(lx), y: ly, targets: gate, on: false, cd: 0 });
    }
  }
  for (const [x, y, t, w] of later) { const i = y * WW + x; if (anKeep.has(i) && t !== AN_LAMPADA) continue; tiles[i] = t; if (w !== undefined) walls[i] = w; }

  // ---------- 4. os veios ----------
  const R4 = mulberry32(seed ^ 0x0e8a);
  const vein = (ore, n, d0, d1, lmin, lmax) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (tiles[i] === AN_GRANITO && y < YB - 1 && !anKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(AN_O_CARVAO, 80 * WSC * LAYER_K, 0, 184, 3, 8);
  vein(AN_O_MITHRIL, 12 * WSC * LAYER_K, 0, 46, 2, 4);
  vein(AN_O_MITHRIL, 30 * WSC * LAYER_K, 46, 98, 2, 5);
  vein(AN_O_MITHRIL, 60 * WSC * LAYER_K, 98, 184, 3, 7);
  // a gruta que passou por dentro de uma sala levou a parede de fundo junto: a sala ganha de volta a parede que mais tem
  for (const C of anRooms) {
    const n = {}; let best = 0, bn = 0;
    for (let y = C.top; y < C.fy; y++) for (let x = C.x0; x < C.x0 + C.w; x++) { const w = walls[I(x, y)]; if (w && w !== WAN_GRANITO && (n[w] = (n[w] || 0) + 1) > bn) { bn = n[w]; best = w; } }
    if (best) for (let y = C.top; y < C.fy; y++) for (let x = C.x0; x < C.x0 + C.w; x++) { const i = I(x, y); if (!walls[i] || walls[i] === WAN_GRANITO) walls[i] = best; }
  }
}

function anAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = AN_S0, YB = Math.min(WH - 8, S0 + AN_D), R3 = mulberry32(seed ^ 0x8d3c1);
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const dig = (x, y) => { if (y < S0 || y >= YB - 1) return; const i = I(x, y); if (anKeep.has(i) || inAnHall(W1(x), y, 2)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WAN_GRANITO; };

  // ---------- 1. tudo alcançável das duas escadarias: túneis de serviço retos onde faltar ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of anEntries) flood(I(E.x0 + 2, E.land.fy - 1));
  if (!anEntries.length && anLines.length) flood(I(SPX, anLines[0].fy - 1));
  if (anBoss) for (let y = anBoss.top; y < anBoss.fy; y++) for (let k = 0; k < anBoss.w; k++) reach[I(anBoss.x0 + k, y)] = 1;   // a Grande Forja: o 186 cuida
  // um túnel de serviço: 3 de altura na horizontal, depois um poço de 2 com escada anã
  const service = (ax, ay, bx, by) => {
    const dx = wdx(bx - ax), sx = Math.sign(dx) || 1;
    for (let k = 0; k <= Math.abs(dx); k++) { const x = ax + k * sx; for (let y = ay - 2; y <= ay; y++) dig(x, y); const f = I(x, ay + 1); if (!SOLID[tiles[f]] && !anKeep.has(f) && ay + 1 < YB - 1) { tiles[f] = AN_CANTARIA; } }
    const y0 = Math.min(ay, by), y1 = Math.max(ay, by);
    for (let y = y0 - 2; y <= y1; y++) { dig(bx, y); dig(bx + sx, y); const i = I(bx, y); if (tiles[i] === AIR && y > y0 - 2) tiles[i] = AN_ESCADA; }
  };
  // o pedaço solto mais alto primeiro: tudo acima dele já está ligado, então a ligação sai curta (e a busca continua
  // da linha onde parou)
  const lab = new Uint16Array(NN);   // marcado com o número da passada (uma alocação só)
  let yScan = S0;
  for (let pass = 0; pass < 60 * WSC * LAYER_K; pass++) {
    const P = pass + 1; let bestC = null;
    for (let y = yScan; y < YB - 1 && !bestC; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] === P || SOLID[tiles[i]] || tiles[i] === LAVA || !walls[i]) continue;   // o canal de lava não é um pedaço solto
      const comp = []; lab[i] = P; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && lab[nb] !== P && !reach[nb] && !SOLID[tiles[nb]] && tiles[nb] !== LAVA) { lab[nb] = P; stack.push(nb); } }
      if (comp.length >= 20) { bestC = comp; yScan = y; break; }
    }
    if (!bestC) break;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      if (SOLID[tiles[c + WW]] === 0 && cy + 1 < YB - 1) continue;   // de onde se pisa
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inAnHall(W1(cx + dx), y, 3)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, W1(cx + dx), y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    service(best[0], best[1], best[2], best[3]);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 2. uma escada anã em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inAnHall(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)] || at(lx, k) === LAVA) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || AN_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (anKeep.has(i) || !walls[i]) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = AN_ESCADA; used.add(i); }
      }
    }
  }

  // ---------- 3. barricadas de entulho viradas para baixo: encostadas na escada, do lado de cima ----------
  for (const C of anRooms) {
    if (C.band < 2 || R3() > 0.25 || C.brecha || C.kind === 'oficina') continue;
    const s = R3() < 0.5 ? 0 : C.w - 3;
    for (let k = 0; k < 3; k++) for (let j = 1; j <= 3 - Math.abs(k - 1); j++) { const x = C.x0 + s + k, y = C.fy - j, i = I(x, y); if (tiles[i] === AIR && !anKeep.has(i)) tiles[i] = AN_ENTULHO; }
  }

  // ---------- 4. a decoração ----------
  const lamps = new Set();
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || anKeep.has(i)) continue;
    const b = dwarfBand(y); if (b < 0 || b > 3 || inAnHall(x, y, 2)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const built = walls[i] !== WAN_GRANITO;
    const floor = SOLID[dn] && AN_SOILS[dn] && BLOCKY[dn] && dn !== AN_GRADE && up === AIR;
    // as lâmpadas de runa: na parede das salas e dos corredores, na altura do olho, uma a cada 9 a 12
    if (built && !floor && SOLID[tiles[i + 3 * WW]] && !SOLID[tiles[i + WW]] && !SOLID[tiles[i + 2 * WW]] && tiles[i + WW] === AIR) {
      let near = false; for (let dx = -9; dx <= 9 && !near; dx++) if (lamps.has(y * WW + W1(x + dx))) near = true;
      if (!near && q < 0.5) { tiles[i] = AN_LAMPADA; lamps.add(i); continue; }
    }
    if (!floor) continue;
    const near = (r, k) => { for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= 1; dy++) if (tiles[(y + dy) * WW + W1(x + dx)] === k) return true; return false; };
    if (b === 0) { if (q < 0.01) put(x, y, AN_ELMO); else if (q < 0.016) put(x, y, AN_RUNA); }
    else if (b === 1) { if (q < 0.012) put(x, y, AN_BARRIL); else if (q < 0.022) put(x, y, AN_RUNA); else if (q < 0.028) put(x, y, AN_ELMO); }
    else if (b === 2) { if (q < 0.04 && near(3, AN_GRADE)) put(x, y, AN_VAPOR); else if (q < 0.05) put(x, y, AN_QUITINA); else if (q < 0.056) put(x, y, AN_RUNA); }
    else { const w = walls[i]; if (w === WAN_TIJOLO && q < 0.05) put(x, y, q < 0.02 ? AN_BRASEIRO : q < 0.035 ? AN_BIGORNA : AN_TENAZ); else if (q < 0.02) put(x, y, AN_QUITINA); }
  }
  // o fundo: perto das brechas, cascas de quitina e cera
  for (const E of anExits) for (let dx = -10; dx <= 10; dx++) { const x = W1(E.cx + dx), y = E.fy - 1, i = I(x, y); if (tiles[i] === AIR && SOLID[tiles[i + WW]] && Math.abs(dx) > 3 && R3() < 0.3) tiles[i] = AN_QUITINA; }

  // ---------- 5. os objetos ----------
  anPlaceProps();
}

/* ---------- as bocas das escadarias por último, e o que ficou de entulho tapando o único caminho sai ---------- */
function anExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of anEntries) for (let y = E.fy - 3; y < E.land.fy; y++) for (let x = E.x0; x < E.x0 + 4; x++) {
    if (y >= E.fy + 2 && x !== E.x0 + 1) continue;
    const i = I(x, y); tiles[i] = x === E.x0 + 1 && y >= E.fy - 1 ? AN_ESCADA : AIR; anKeep.add(i);
  }
  const reach = new Uint8Array(WW * WH), st = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; st.push(s0); while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < WW * WH && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; st.push(nb); } } };
  for (const E of anEntries) flood(I(E.x0 + 2, E.land.fy - 1));
  if (anBoss) for (let y = anBoss.top; y < anBoss.fy; y++) for (let k = 0; k < anBoss.w; k++) reach[I(anBoss.x0 + k, y)] = 1;
  const Y1 = Math.min(WH - 8, AN_S0 + AN_D);
  for (let sweep = 0, changed = true; changed && sweep < 50; sweep++) {
    changed = false;
    for (let i = AN_S0 * WW; i < Y1 * WW; i++) {
      if (tiles[i] !== AN_ENTULHO || anKeep.has(i)) continue;
      const x = i % WW, row = i - x, nb = [i - WW, i + WW, row + W1(x - 1), row + W1(x + 1)];
      if (nb.some(j => reach[j]) && nb.some(j => !reach[j] && !SOLID[tiles[j]] && !inAnHall(j % WW, (j / WW) | 0))) { tiles[i] = AIR; flood(i); changed = true; }
    }
  }
}

/* ---------- a subida garantida: da Grande Forja, da Oficina, de cada eclusa e de cada túmulo o herói tem de conseguir
   voltar às escadarias (pulo de 3 blocos; escadas e correntes sobem) ---------- */
function anClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = AN_S0, YB = Math.min(WH - 8, S0 + AN_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1 || tiles[I(x, y)] === LAVA, L = (x, y) => AN_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || inAnHall(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
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
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || anKeep.has(I(x, y))) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if ((tt === AN_CANTARIA || tt === AN_GRANITO || tt === AN_LAJE || tt === AN_ENTULHO) && !anKeep.has(I(x, t)) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || tiles[i] === AN_CANTARIA || tiles[i] === AN_GRANITO || tiles[i] === AN_LAJE || tiles[i] === AN_ENTULHO) { tiles[i] = AN_ESCADA; if (!walls[i]) walls[i] = WAN_CANTARIA; } }
    return true;
  };
  const starts = [];
  if (anBoss) for (const D of anBoss.doors) starts.push([D.x + D.side * 4, D.fy - 1]);
  if (anOficina) starts.push([anOficina.cx, anOficina.fy - 1]);
  for (const E of anEclusas) starts.push([E.x0 + 3, E.yb - 1]);
  for (const c of anRooms) if (c.kind === 'tumulo' || c.brecha) starts.push([Math.round(c.cx), c.fy - 1]);
  let fixes = 0, bad = 0;
  for (const [x, y] of starts) { let k = 0; for (; k < 12 * LAYER_K && !search(W1(x), y); k++) { if (!repair()) { bad++; break; } fixes++; } }
  anClimbFix.last = [starts.length, fixes, bad];
  return fixes;
}

/* ---------- os objetos (182): os das salas primeiro (anRoomProps), depois no chão, debaixo do teto e na parede, pela faixa ---------- */
function anPlaceProps() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b8a7);
  const S0 = AN_S0, YB = Math.min(WH - 8, S0 + AN_D), used = new Uint8Array(WW * WH * 2), BF = typeof AN_BACK_FLOOR !== 'undefined' ? AN_BACK_FLOOR : {};
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || anKeep.has(i)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && AN_SOILS[t] && t !== AN_GRADE; };
  const floorProp = (id, x0, fy, layer = 0, v0) => {
    const def = PROP_DEFS[id]; if (!def) return null;
    const v = v0 !== undefined ? v0 : (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    for (let dx = 0; dx < 4; dx++) for (const s of [1, -1]) {
      const px = x0 + dx * s; let ok = true; for (let k = px; k < px + tw; k++) if (!soil(k, fy)) ok = false;
      if (!ok || !fits(px, fy - th, tw, th, layer, layer === 0)) continue;
      mark(px, fy - th, tw, th, layer);
      const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, fy));
      return addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), fy * T - V.h, sup);
    }
    return null;
  };
  // o pedestal do Cinzel, na Oficina, debaixo da marca do clã (o 189 entrega o cinzel)
  // (o 182 monta a Oficina inteira: pedestal, a marca logo acima, a bigorna, o armeiro e o lustre; sem ele, só o pedestal e a marca)
  if (anOficina && typeof anRoomProps === 'function') {
    try { const L = anRoomProps('oficina', anOficina.x0, anOficina.fy, anOficina.w, R, used); anOficina.prop = (L || []).find(p => p && p.def && p.def.id === 'an_pedestal') || null; } catch (err) { console.error(err); }
  }
  if (anOficina && !anOficina.prop) {
    anOficina.prop = floorProp('an_pedestal', anOficina.x0 + 8, anOficina.fy);
    const m = PROP_DEFS.an_marca; if (m) { const V = m.vars[0], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), px = anOficina.x0 + 10 - (tw >> 1), py = anOficina.fy - 4 - th; if (fits(px, py, tw, th, 1, false)) { mark(px, py, tw, th, 1); addProp(m, 0, W1(px) * T, py * T, []); } }
  }
  // os das salas: o 182 sabe o que cada tipo de sala tem
  if (typeof anRoomProps === 'function') for (const C of anRooms) { if (C.kind === 'oficina') continue; try { const L = anRoomProps(C.kind, C.x0, C.fy, C.w, R, used); if (L) for (const p of L) if (p && p.def) { const tw = Math.ceil(p.w / T), th = Math.ceil(p.h / T); mark(Math.floor(p.X / T), Math.floor(p.Y / T), tw, th, p.front ? 0 : 1); } } catch (err) { console.error(err); } }
  if (typeof AN_PROP_PLAN === 'undefined') return;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = AN_BAND_NAMES[clamp(dwarfBand(y), 0, 3)], plan = AN_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inAnHall(W1(k), y, 2)) return false; return kind === 'chao' ? soil(k, y + 1) || tiles[I(k, y + 1)] === AN_GRADE : soil(k, y - 1); };   // a grade só segura o que tem `grade` (182)
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def || def.oficina || def.tumulo || def.forja || def.refeitorio || def.dormitorio) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (def.canal) { let w = false; for (let k = px - 3; k < px + tw + 3; k++) if (tiles[I(k, y + 1)] === AN_GRADE) w = true; if (!w) continue; }
            if (how !== 'teto' && !def.grade) { let g = false; for (let k = px; k < px + tw; k++) if (tiles[I(k, y + 1)] === AN_GRADE) g = true; if (g) continue; }
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
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

// a ordem: a camada, a Grande Forja (186: anDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('anoes', () => {
  if (!ANOES) return;
  try { anBuild(); anAfter(); if (typeof anDress === 'function') anDress(); anExitClear(); anClimbFix(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada atrás da fortaleza ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!ANOES) return;
  const Y1 = Math.min(WH, AN_S0 + AN_D + 4);
  for (let y = Math.max(AN_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - AN_S0) + (depthNz(x, y, 25, seed ^ 0x8e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x8e12);
    DEEPT[i] = d < AN_BANDS[2] ? (n > 0.62 ? DP_AN_MAQUINAS : DP_AN_SALOES) : d < AN_BANDS[3] ? (n > 0.4 ? DP_AN_MAQUINAS : DP_AN_SALOES) : (n > 0.5 ? DP_AN_FORJAS : DP_AN_MAQUINAS);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (ANOES && ty >= AN_S0 && ty < AN_S0 + AN_D) return AN_ZONE0 + clamp(dwarfBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6); o Barba-de-Ferro conta o Soldado que ele acorda, o enxame de engrenagens conta 1
Object.assign(CATH_SPAWN, {
  [AN_ZONE0]: [[['soldbronze', 0.3], ['besteiroan', 0.25], ['coruja', 0.25], ['runaviva', 0.2]], 7],
  [AN_ZONE0 + 1]: [[['soldbronze', 0.2], ['juramentado', 0.18], ['ferreirofant', 0.16], ['barbaferro', 0.16], ['besteiroan', 0.15], ['coruja', 0.15]], 8],
  [AN_ZONE0 + 2]: [[['bombalava', 0.24], ['engrenagens', 0.22], ['fornalhaamb', 0.18], ['runaviva', 0.14], ['barbaferro', 0.12], ['coruja', 0.1]], 8],
  [AN_ZONE0 + 3]: [[['fornalhaamb', 0.2], ['ferreirofant', 0.18], ['engrenagens', 0.18], ['juramentado', 0.16], ['soldbronze', 0.14], ['runaviva', 0.14]], 8]
});
// tipos que ainda não existem (um arquivo de monstros desligado) saem da tabela
for (let z = AN_ZONE0; z < AN_ZONE0 + 4; z++) { const S = CATH_SPAWN[z]; S[0] = S[0].filter(([k]) => ET[k]); }
const AN_NO_SPAWN = (tx, ty) => anLand.some(L => wdx(tx - L.x0) >= -4 && wdx(tx - L.x0) < L.w + 4 && ty > L.fy - L.h - 3 && ty <= L.fy) || inAnHall(tx, ty, 2) ||
  (!!anOficina && wdx(tx - anOficina.x0) >= -2 && wdx(tx - anOficina.x0) < anOficina.w + 2 && ty > anOficina.fy - anOficina.h - 2 && ty <= anOficina.fy);
// quem anda em bando conta menos no máximo da faixa: um enxame de 5 engrenagens conta como 2 (o 183 marca as rodinhas com
// anFollower; o soldado acordado conta inteiro)
{ const _ts = trySpawn; trySpawn = function () {
  if (!ANOES || !pl) return _ts();
  const all = enemies.filter(e => e.anFollower), fol = all.slice(Math.ceil(all.length / 4)); if (!fol.length) return _ts();
  for (const e of fol) enemies.splice(enemies.indexOf(e), 1);
  try { return _ts(); } finally { for (const e of fol) enemies.push(e); }
}; }
// níveis pela posição da camada (layerLvl no 52, layerLo no 129); nada nasce na guarita, na Grande Forja nem na Oficina
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!ANOES || !e || e.boss || D.boss || e.anMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - AN_S0;
  if (d >= 0 && d < AN_D) {
    if (zone >= AN_ZONE0 && zone <= AN_ZONE0 + 3 && AN_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.anVoid = true; return e; }
    const lvl = layerLvl(layerLo('anoes'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].anVoid) enemies.splice(k, 1); });

/* ---------- queimando: a poça de pedra quente, o cadinho e as grades em brasa (anQueimar no 180) ---------- */
let anBurnTick = 0;
HOOK.update.push(dt => {
  if (!pl || state !== 'play') return;
  if (pl.dead) { pl.anFogoT = 0; return; }
  if ((pl.anFogoT || 0) <= 0) return;
  pl.anFogoT -= dt; anBurnTick -= dt;
  if (Math.random() < dt * 14) parts.push({ x: pl.x + rnd(1, pl.w - 1), y: pl.y + rnd(4, pl.h), vx: rnd(-6, 6), vy: rnd(-30, -12), g: -20, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffa62a' : '#e8700e', size: 1 });
  if (anBurnTick <= 0) { anBurnTick = 0.5; const d = Math.max(1, Math.round((pl.anFogoD || 2) * 0.5)); if (typeof hurtPlayerType === 'function') hurtPlayerType(d, 'fogo'); else hurtPlayer(d, pl.x + pl.w / 2, null, true); }
  if (pl.anFogoT <= 0) pl.anFogoD = 0;
});

/* ---------- as três bases (187): o machado do clã acerta dois, a viseira segura o que vem de cima, o escudo rúnico cansa ---------- */
let anDoisT = -9;
{ const _he = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _he(e, dir, mult, melee);
  const w = melee && equip.weapon && ITEMS[equip.weapon.id];
  if (w && w.dois && !e.boss) {
    if (!e.dead) e.vx = (e.vx || 0) * 1.3;   // empurra mais longe
    if (gameTime - anDoisT > 0.3) {
      anDoisT = gameTime;
      let o = null, bd = 34; for (const f of enemies) { if (f === e || f.dead || f.boss) continue; const d = Math.hypot(f.x + f.w / 2 - (e.x + e.w / 2), f.y + f.h / 2 - (e.y + e.h / 2)); if (d < bd) { bd = d; o = f; } }
      if (o) _he(o, dir, mult * 0.7, melee);
    }
  }
  return r;
}; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const h = equip.head && ITEMS[equip.head.id];
  if (h && h.viseira && src && typeof src.y === 'number' && src.y + (src.h || 0) * 0.5 < pl.y) dmg = Math.max(1, Math.round(dmg * (1 - h.viseira)));
  return _hp(dmg, srcX, src, isProj);
}; }
if (typeof spendVigor === 'function') { const _sv = spendVigor; spendVigor = function (parry, boss) {
  const v0 = pl.vig, r = _sv(parry, boss), s = equip.shield && ITEMS[equip.shield.id];
  if (s && s.pesado && !r && pl.vig > 0) { pl.vig = Math.max(0, pl.vig - (v0 - pl.vig) * 0.25); }
  return r;
}; }

/* ---------- partículas: vapor nos Canais, faíscas e fuligem nas Forjas, poeira fina nos Salões ---------- */
HOOK.update.push(dt => {
  if (!ANOES || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = dwarfBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (b === 2 && Math.random() < dt * 10) {   // o vapor sobe das grades
    const tx = Math.floor((cam.x + Math.random() * VW) / T), ty = Math.floor((cam.y + Math.random() * VH) / T);
    if (tileAt(tx, ty) === AN_GRADE && !solidAt(tx, ty - 1)) parts.push({ x: tx * T + rnd(1, 11), y: ty * T, vx: rnd(-4, 4), vy: rnd(-22, -12), g: -6, life: 1.6, max: 1.6, col: Math.random() < 0.5 ? '#9ea6ac' : '#7a848c', size: 2 });
  }
  if (Math.random() < dt * 4) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (air(x, y)) parts.push(b === 3 ? (Math.random() < 0.3 ? { x, y, vx: rnd(-20, 20), vy: rnd(-40, -10), g: 120, life: 0.6, max: 0.6, col: '#ffa62a', size: 1 } : { x, y, vx: rnd(-2, 2), vy: rnd(3, 7), g: 2, life: 3, max: 3, col: '#1e2228', size: 1 })
      : b === 1 ? { x, y, vx: rnd(-3, 3), vy: rnd(1, 4), g: 2, life: 3.5, max: 3.5, col: Math.random() < 0.5 ? '#7a848c' : '#9ea6ac', size: 1 }
      : b === 0 ? { x, y, vx: rnd(4, 12), vy: rnd(-1, 1), g: 0, life: 2, max: 2, col: '#5a646e', size: 1 }
      : { x, y, vx: rnd(-2, 2), vy: rnd(-8, -3), g: -2, life: 2.5, max: 2.5, col: '#7a848c', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: o mithril na fornalha (187 tem os itens), a brasa domada vale 2 carvões, as lojas ---------- */
FURN.min_mithril = { bar: 'barra_mithril', n: 7, t: 11 };
Object.assign(MAT_VAL, { min_mithril: 46, barra_mithril: 330, runa_gravada: 26, mola_runica: 20, brasa_domada: 12, barba_espectral: 34, cera_seca: 4 });
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_mithril', 'barra_mithril', 'runa_gravada', 'mola_runica', 'brasa_domada'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', mithril, runas, molas e brasas.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'barba_espectral'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ' e barbas espectrais.'; } }
// a brasa domada na fornalha: com a janela da forja aberta, cada brasa (na mochila ou no baú) vira 2 carvões
{ const _tf = tickFurnace; tickFurnace = function (dt) {
  if (ITEMS.brasa_domada && forgeOpen()) { const n = reagHave('brasa_domada'); if (n && reagTake('brasa_domada', n)) { reagGive('carvao', 2 * n); forgeDirty = true; invDirty = true; } }
  return _tf(dt);
}; }
