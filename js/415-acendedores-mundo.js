'use strict';

/* ================= As Ruínas dos Acendedores: o mundo (docs/camadas/19-ruinas-acendedores.md, seção 3) =================
   A décima nona camada, debaixo do Abismo (acAbove, 410). A cidade é cavada na rocha fuliginosa e os prédios são
   carimbados dentro das cavernas largas. Em passos:
     1. a rocha: rocha fuliginosa em tudo; a rocha de cima afina nas últimas linhas e vira cinza; veios de rocha de brasa
        que crescem para o fundo; escória em bolsões na Fornalha
     2. os vazios: as duas descidas dos templos do Abismo (o poço de 3 cai na Casa da Guarda, a câmara de pouso, 16 x 6,
        acesa pelas fendas de brasa da lareira), a Fornalha do Mundo do outro lado do mundo (a caixa sólida que o 416
        veste), as duas Escadarias do Fundo, e as salas de cada faixa: os faróis em pé e os caídos nos Faróis; as ruas
        largas com as casas nas Ruas de Cinza; os templos de colunas nos Templos; as forjas na Fornalha
     3. as ligações: túneis entre as salas de cada andar em anel e rampas em zigue-zague entre os andares
     4. os carimbos: a torre de tijolo com a escada de ferro por dentro e a casa da lanterna no alto, a torre tombada
        (um túnel de tijolo deitado), as casas de pedra lavrada com porta, janela e telhado, as ruas de laje, o templo de
        paredes grossas com as colunas e o estrado do altar, a forja com o chão de escória
     5. os veios: carvão na rocha fuliginosa; ardorita sempre a até 6 blocos de um veio de brasa
   Depois (acAfter): tudo alcançável das descidas, escada de ferro ou corrente em todo desnível de 5, a decoração de 1
   bloco (braseiros frios, cinza, cera, fuligem, pavios, lanternas, fendas), os braseiros acesos dos templos (os loucos
   ainda os alimentam) e os objetos (412). Por fim a Fornalha (416: acDress), as bocas das descidas, nenhuma queda aberta
   de mais de 13 blocos (acFallFix) e a subida garantida (acClimbFix). O 87 liga o resto depois, e as quedas que as
   ligações dele abrem passam de novo pelo acFallFix.
   Também: a terceira camada, as zonas 93 a 96, o spawn por faixa e o nível (pela posição no 129), as partículas, a
   ardorita na fornalha e nas lojas. */

const AC_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [AC_ROCHA, AC_LAVRADA, AC_LAJE, AC_CINZA, AC_BRASA, AC_TIJOLO, AC_BRONZE, AC_ESCORIA, AC_O_CARVAO, AC_O_ARDORITA, AC_GRELHA]) AC_SOILS[t] = 1;
CAMADA_EXT.acendedores.gemas.soils = AC_SOILS;
let acTowers = [], acFallen = [], acStreets = [], acHouses = [], acTemples = [], acForges = [], acVeins = [];
let acUpClimb = CHAIN, acUpClimbs = [];   // o que se sobe na camada de cima (acBuild acerta)
const AC_CLIMB = t => t === AC_ESCADA || t === AC_CORRENTE || t === CHAIN || t === acUpClimb || acUpClimbs.includes(t);
const AC_LYR = () => Math.min(WH - 8, AC_S0 + AC_D);   // a última linha da camada (a de baixo começa aqui)
const acWallOf = y => { const b = acBand(y); return b === 3 ? WAC_FORNALHA : WAC_ROCHA; };
const acClimbT = y => { const b = acBand(y); return b === 1 || b === 3 ? AC_CORRENTE : AC_ESCADA; };

function acBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = acAbove(); acUpClimb = A.climb || CHAIN; acUpClimbs = A.climbs || [];
  AC_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = AC_S0, YB = AC_LYR(), DB = YB - S0;
  const R = mulberry32(seed ^ 0xac1d), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < AC_BANDS[1] ? 0 : d < AC_BANDS[2] ? 1 : d < AC_BANDS[3] ? 2 : 3;
  // como no 285: cada faixa vira K andares; lv(d, j) a linha da profundidade d do desenho no andar j; lvOf(y) o andar
  const K = LAYER_K, BD = AC_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / AC_D); };
  const lvOf = y => { const d = (y - S0) * AC_D / DB, b = bandOf(d), h = (AC_BANDS[b + 1] - AC_BANDS[b]) / K; return b * K + clamp(Math.floor((d - AC_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  acTowers = []; acFallen = []; acStreets = []; acHouses = []; acTemples = []; acForges = []; acVeins = [];
  acEntries = []; acLand = []; acExits = []; acBoss = null; acRooms = []; acKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a rocha de cima afina nas últimas 10 linhas e vira rocha fuliginosa e cinza
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0xa72);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = h < k * 0.4 ? AC_CINZA : AC_ROCHA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = AC_ROCHA; walls[i] = WAC_ROCHA; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0xa73) - 0.5) * 10, b = bandOf(Math.max(0, d)), n2 = nz(x, y, 14, 0xa74);
      const vein = Math.abs(nz(x, y, 16, 0xa75) - 0.5);
      let tt = AC_ROCHA, w = b === 3 ? WAC_FORNALHA : WAC_ROCHA;
      if (y - S0 < 12 && n2 < 1 - (y - S0) / 12) tt = AC_CINZA;                      // a cinza do Abismo, sumindo
      else if (vein < 0.008 + b * 0.006) tt = AC_BRASA;                             // os veios que ainda ardem, mais grossos para o fundo
      else if (b === 3 && nz(x, y, 24, 0xa76) > 0.72) tt = AC_ESCORIA;
      else if (b === 1 && nz(x, y, 30, 0xa77) > 0.74) tt = AC_CINZA;
      tiles[i] = tt; walls[i] = w;
      if (agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. os vazios ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => acRooms.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  // a caverna larga: chão reto em fy, o teto em domo irregular h acima
  const hollow = (x0, fy, w, h, s, flat = 0.45) => {
    for (let x = x0; x < x0 + w; x++) {
      const u = (x + 0.5 - x0) / w * 2 - 1, top = fy - Math.round(h * Math.pow(Math.max(0, 1 - u * u), flat) + (nz(x, fy, 9, s) - 0.5) * 4);
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
  // rampa: a minhoca em zigue-zague, cada perna desce no máximo ~11 andando 14 a 23 de lado
  const ramp = (xa, ya, xb, yb, r, s) => {
    const Rr = mulberry32(seed ^ s ^ 0x5a17), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 11));
    let x = xa, y = ya, dir = wdx(xb - xa) < 0 ? -1 : 1;
    for (let k = 1; k <= n; k++) {
      const ny = Math.round(ya + dy * k / n), nx = k === n ? xa + wdx(xb - xa) : x + dir * (14 + ((Rr() * 10) | 0));
      worm(x, y, nx, ny, r, s + k * 131); x = nx; y = ny; dir = -dir;
    }
  };

  // ---------- 2a. as duas descidas: dos templos do Abismo até a Casa da Guarda ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || ub.w || 20) / 2 + 24)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 120)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 50)) picks.push(c); }
    while (picks.length < 2) { const cx = (R() * WW) | 0; if (picks.every(p => Math.abs(wdx(p.cx - cx)) > 120)) picks.push({ cx, fy: S0 - 4 }); }   // sem sala em cima: um poço curto
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 22 + ((R() * 6) | 0), S0 + 16, S0 + mb(28));
      const hx = side > 0 ? xs - 1 : xs - 12;   // o poço cai numa ponta da Casa da Guarda (16 x 6)
      for (let y = landFy - 8; y <= landFy + 1; y++) for (let x = hx - 2; x <= hx + 17; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 16; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      // a porta do lado de fora, 4 de altura, atravessando a parede grossa
      const dx0 = side > 0 ? hx + 16 : hx - 2, dx1 = side > 0 ? hx + 17 : hx - 1;
      for (let y = landFy - 4; y < landFy; y++) for (let x = dx0; x <= dx1; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 16, h: 6, side, door: [W1(dx0), W1(dx1)], xs };
      acLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // a primeira caverna logo depois da porta: uma pracinha dos Faróis
      const w = 22 + ((R() * 8) | 0), h = 12, x0 = side > 0 ? dx1 + 1 : dx0 - w;
      hollow(x0, landFy, w, h, 0xa800 + acLand.length);
      acRooms.push({ cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'cova', x0: W1(x0), fy: landFy, top: landFy - h });
      acRooms.push({ cx: hx + 8, cy: landFy - 4, w: 26, h: 14, band: 0, kind: 'pouso', nolink: true });
      acEntries.push({ x0: xs, fy: c.fy, land: L });
    }
  }

  // ---------- 2b. a Fornalha do Mundo, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 112, h = 46;
    const ax = acEntries.length ? acEntries.reduce((s, e) => s + wdx(e.x0 - acEntries[0].x0), 0) / acEntries.length + acEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 14, S0 + mb(176)), top = fy - h;
    acBoss = { cx, w, h, top, fy, doors: [{ side: -1, x: W1(cx - 59), fy }, { side: 1, x: W1(cx + 58), fy }] };
    for (let y = top - 4; y <= fy + 4; y++) for (let x = cx - 60; x <= cx + 59; x++) seal[I(x, y)] = 1;
    acRooms.push({ cx, cy: fy - h / 2, w: w + 8, h: h + 8, band: 3, boss: true, nolink: true });
    for (const D of acBoss.doors) {
      const len = 24 + ((R() * 10) | 0), fyD = D.fy;
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 5; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); acKeep.add(I(x, fyD));
        x += D.side;
      }
      acRooms.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 5, band: 3, kind: 'servico', nolink: true });
      const gw = 22 + ((R() * 8) | 0), gh = 12, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      hollow(gx0, fyD, gw, gh, 0xa810 + D.side);
      acRooms.push({ cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: 3, kind: 'cova', x0: W1(gx0), fy: fyD, top: fyD - gh });
    }
  }
  const awayFromBoss = (cx, cy, m) => !acBoss || Math.abs(wdx(cx - acBoss.cx)) > acBoss.w / 2 + 6 + m || cy < acBoss.top - 6 - m || cy > acBoss.fy + 6 + m;

  // ---------- 2c. as Escadarias do Fundo: duas salas no fundo, longe uma da outra e da Fornalha; um poço de 3 até a última linha ----------
  for (let tries = 0; acExits.length < 2 && tries < 600; tries++) {
    const w = 18 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);
    if (!awayFromBoss(cx, fy, 90) || acExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'escadaria', x0: W1(x0), fy, top: fy - h, exit: true };
    acRooms.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    acExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. Os Faróis Caídos: os faróis em pé (cavernas altas) e os tombados, e covas ----------
  for (let k = 0, tries = 0; k < 2 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 40 + ((R() * 14) | 0), h = 32 + ((R() * 8) | 0), x0 = (R() * WW) | 0, fy = Math.max(lv(0, j) + h + 8, lv(30 + R() * 14, j));
    if (fy > lv(0, j) + 52 || busy(x0 + w / 2, fy - h / 2, w + 12, h + 8, 6)) continue;
    hollow(x0, fy, w, h, 0xa900 + k, 0.35);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'farol', x0: W1(x0), fy, top: fy - h, tw: 9 };
    acTowers.push(C); acRooms.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 600 * K; tries++) {
    const j = k % K, len = 36 + ((R() * 24) | 0), x0 = (R() * WW) | 0, fy = lv(14 + R() * 26, j);
    if (fy - 18 < S0 + 3 || busy(x0 + len / 2, fy - 7, len + 12, 16, 5)) continue;
    hollow(x0 - 6, fy, len + 12, 14, 0xa940 + k);
    const C = { cx: x0 + len / 2, cy: fy - 7, w: len + 12, h: 14, band: 0, kind: 'tombado', x0: W1(x0), len, fy, top: fy - 14, open: R() < 0.5 ? -1 : 1 };
    acFallen.push(C); acRooms.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 300 * K; tries++) {
    const w = 16 + ((R() * 14) | 0), h = 8 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(8, k % K) + h / 2 + R() * Math.max(0, 34 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0xa980 + k, 1.6);
    acRooms.push({ cx, cy, w, h, band: 0, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2e. As Ruas de Cinza: ruas largas de chão reto (as casas são carimbadas depois) ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 600 * K; tries++) {
    const j = k % K, w = 70 + ((R() * 40) | 0), h = 17 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = lv(66 + R() * 26, j);
    if (fy - h - 4 < lv(48, j) || busy(x0 + w / 2, fy - h / 2, w + 10, h + 6, 6)) continue;
    hollow(x0, fy, w, h, 0xaa00 + k, 0.2);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'rua', x0: W1(x0), fy, top: fy - h };
    acStreets.push(C); acRooms.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(50, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0xaa80 + k, 1.7);
    acRooms.push({ cx, cy, w, h, band: 1, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2f. Os Templos da Chama: salas de chão reto e teto alto (as paredes grossas e as colunas vêm depois) ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 40 + ((R() * 16) | 0), h = 20 + ((R() * 6) | 0), x0 = (R() * WW) | 0, fy = lv(108 + R() * 36, j);
    if (fy - h - 6 < lv(98, j) || busy(x0 + w / 2, fy - h / 2, w + 16, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 8)) continue;
    hollow(x0 - 6, fy, w + 12, h + 4, 0xab00 + k, 0.25);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'templo', x0: W1(x0), fy, top: fy - h };
    acTemples.push(C); acRooms.push(Object.assign({}, C, { w: w + 12, h: h + 4 })); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC * K && tries < 300 * K; tries++) {
    const w = 18 + ((R() * 14) | 0), h = 9 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(102, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2 + 6)) continue;
    blob(cx, cy, w, h, 0xab80 + k, 1.6);
    acRooms.push({ cx, cy, w, h, band: 2, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2g. A Fornalha do Mundo: as forjas e covas de escória ----------
  for (let k = 0, tries = 0; k < 3 * WSC * K && tries < 400 * K; tries++) {
    const w = 34 + ((R() * 20) | 0), h = 13 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = lv(158 + R() * 22, k % K);
    if (fy > YB - 6 || busy(x0 + w / 2, fy - h / 2, w + 12, h + 8, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    hollow(x0 - 4, fy, w + 8, h + 3, 0xac00 + k, 0.3);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'forja', x0: W1(x0), fy, top: fy - h };
    acForges.push(C); acRooms.push(Object.assign({}, C, { w: w + 8, h: h + 3 })); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const w = 18 + ((R() * 12) | 0), h = 10 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(154, k % K) + h / 2 + R() * Math.max(0, 26 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, Math.max(w, h) / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0xac80 + k, 1.8);
    acRooms.push({ cx, cy, w, h, band: 3, kind: 'cova', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of acRooms) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(ends(c, false)[1] - 1) - c.band * K, 0, K - 1)].push(c);
  for (let l = 0; l < NL; l++) {
    const L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      worm(ax, ay - 2, bx, by - 2, 1.5, 0xa700 + l * 90 + k);
    }
  }
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l], D = byLv[l + 1];
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5); ramp(ax, ay - 2, Math.round(Q.cx), mouth(Q) - 2, 1.4, 0xa7f0 + l * 9 + k);
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
  const set = (x, y, t, w) => { if (y < S0 || y >= YB - 1) return; const i = I(x, y); if (acKeep.has(i)) return; tiles[i] = t; if (w !== undefined) walls[i] = w; };
  // o fundo de todo vazio, e a cinza no chão das ruas e dos faróis
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR) continue;
    walls[i] = acWallOf(y);
    const dn = i + WW; if (y + 1 < YB - 1 && SOLID[tiles[dn]] && tiles[dn] === AC_ROCHA && !acKeep.has(dn)) {
      const b = acBand(y); if ((b === 0 || b === 1) && nz(x, y, 10, 0xa7f1) > 0.35) tiles[dn] = AC_CINZA;
    }
  }

  // os faróis em pé: a torre de tijolo (9 de largura) do chão quase até o teto, oca, com a escada de ferro por dentro,
  // as portas embaixo dos dois lados, janelas estreitas, a casa da lanterna no alto (bronze) com a pira fria
  for (const C of acTowers) {
    const cx = Math.round(C.cx), x0 = cx - 4, x1 = cx + 4, fy = C.fy;
    let top = fy - C.h + 4; while (top < fy - 12 && at(cx, top - 1) === AIR && at(cx, top - 2) === AIR && at(cx, top - 3) === AIR) top--;
    top = Math.max(top, fy - C.h + 2);
    for (let y = top; y < fy; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1, cap = y < top + 5;
      if (cap) { if (y === top || ((x === x0 || x === x1) && y !== top + 2)) set(x, y, y === top ? AC_BRONZE : AC_TIJOLO, WAC_TIJOLO); else set(x, y, AIR, WAC_TIJOLO); continue; }   // a casa da lanterna: fechada, uma fresta de 1 de cada lado
      if (edge) { const door = fy - y <= 4, win = (fy - y) % 9 === 6 && y > top + 6; set(x, y, door || win ? AIR : AC_TIJOLO, WAC_TIJOLO); }
      else set(x, y, AIR, WAC_TIJOLO);
    }
    // a escada no meio, do chão até a casa da lanterna; patamares de 9 em 9 (com o vão da escada)
    for (let y = top + 1; y < fy; y++) { const i = I(cx, y); if (!acKeep.has(i)) { tiles[i] = AC_ESCADA; acKeep.add(i); } }
    for (let y = fy - 9; y > top + 5; y -= 9) for (let x = x0 + 1; x < x1; x++) if (x !== cx) set(x, y, AC_LAVRADA);
    // o chão da casa da lanterna, com a pira fria no meio dela
    for (let x = x0 + 1; x < x1; x++) if (x !== cx) set(x, top + 5, AC_LAVRADA);
    set(cx - 2, top + 4, AC_BRASEIRO_FRIO); set(cx + 2, top + 4, AC_BRASEIRO_FRIO);
    for (let x = x0 - 1; x <= x1 + 1; x++) { const i = I(x, fy); if (SOLID[tiles[i]]) tiles[i] = AC_LAVRADA; }
    C.towerTop = top;
  }
  // os faróis tombados: a torre deitada no chão da caverna, um túnel de tijolo de 6 de alto, a ponta quebrada aberta, a
  // casa da lanterna caída na outra ponta
  for (const C of acFallen) {
    const x0 = C.x0, x1 = C.x0 + C.len - 1, fy = C.fy, th = 7;
    for (let x = x0; x <= x1; x++) {
      const e = C.open > 0 ? x1 - x : x - x0, broken = e < 4;
      for (let y = fy - th; y < fy; y++) {
        if (at(x, y) !== AIR && !SOLID[at(x, y)]) continue;
        const shell = y === fy - th || y === fy - 1, inner = !shell;
        if (broken && (y < fy - th + 2 + (hash2(x, y, seed ^ 0xa7e) < 0.5 ? 1 : 0))) continue;
        if (inner) { set(x, y, AIR, WAC_TIJOLO); continue; }
        set(x, y, y === fy - 1 ? AC_LAVRADA : AC_TIJOLO, WAC_TIJOLO);
      }
    }
    // a ponta fechada é a casa da lanterna: bronze, com a boca para dentro
    const xe = C.open > 0 ? x0 : x1; for (let y = fy - th - 1; y < fy; y++) { if (y > fy - 4 && y < fy - 1) continue; set(xe, y, AC_BRONZE); }
  }
  // as ruas: o chão de laje, as casas encostadas uma na outra dos dois lados de uma praça no meio. Cada casa: paredes de
  // pedra lavrada com a porta (4 de alto) de cada lado, a janela, o telhado de tijolo em duas águas; o chão de dentro é
  // o da rua, a parede de dentro é lavrada. Uma casa em cada quatro desabou (só o pé das paredes)
  for (const C of acStreets) {
    const fy = C.fy;
    for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) { const i = I(x, fy); if (SOLID[tiles[i]] && !acKeep.has(i)) tiles[i] = AC_LAJE; const j = I(x, fy + 1); if (SOLID[tiles[j]] && !acKeep.has(j) && hash2(x, fy, seed ^ 0xa7b) < 0.5) tiles[j] = AC_LAJE; }
    const plaza = C.x0 + Math.round(C.w * (0.35 + hash2(C.x0, fy, seed) * 0.3));
    let x = C.x0 + 3;
    while (x < C.x0 + C.w - 12) {
      const hw = 10 + ((hash2(x, fy, seed ^ 0xa7c) * 5) | 0), hh = 8 + ((hash2(x, fy, seed ^ 0xa7d) * 3) | 0);
      if (Math.abs(x + hw / 2 - plaza) < 9) { x += 9; continue; }
      let room = true; for (let xx = x; xx < x + hw && room; xx++) for (let y = fy - hh - 4; y < fy; y++) if (at(xx, y) !== AIR) { room = false; break; }
      if (!room) { x += 3; continue; }
      const ruin = hash2(x, fy, seed ^ 0xa7f) < 0.25;
      const H = { x0: W1(x), w: hw, h: hh, fy, ruin };
      for (let xx = x; xx < x + hw; xx++) for (let y = fy - hh - 4; y < fy; y++) {
        const u = xx - x, wallX = u === 0 || u === hw - 1, roofY = fy - hh - Math.max(0, Math.min(u, hw - 1 - u, 3));
        if (ruin) { if (wallX && y >= fy - 3 && y < fy - 0 && hash2(xx, y, seed) < 0.8 && y < fy - 1 - 0) set(xx, y, AC_LAVRADA); continue; }
        if (y < roofY) continue;
        if (y === roofY) { set(xx, y, AC_TIJOLO); continue; }
        if (y === roofY + 1 && (u === 0 || u === hw - 1)) { set(xx, y, AC_LAVRADA, WAC_LAVRADA); continue; }
        walls[I(xx, y)] = WAC_LAVRADA;
        if (wallX) { const door = fy - y <= 4; set(xx, y, door ? AIR : AC_LAVRADA, WAC_LAVRADA); }
      }
      if (!ruin) { const wy = fy - hh + 2, wx = x + (hw >> 1); walls[I(wx, wy)] = WAC_ROCHA; walls[I(wx + 1, wy)] = WAC_ROCHA; walls[I(wx, wy + 1)] = WAC_ROCHA; walls[I(wx + 1, wy + 1)] = WAC_ROCHA; }   // a janela (escura: o fundo da caverna)
      acHouses.push(H);
      x += hw + (hash2(x, 3, seed) < 0.4 ? 0 : 2 + ((hash2(x, 4, seed) * 4) | 0));
    }
  }
  // os templos: as paredes grossas de pedra lavrada com as portas altas dos lados, o teto em abóbada de lavrada, as
  // colunas de 6 em 6, o estrado do altar no meio (2 degraus); o reboco pintado na parede de dentro
  for (const C of acTemples) {
    const x0 = C.x0, x1 = C.x0 + C.w - 1, fy = C.fy, cx = C.x0 + C.w / 2;
    for (let x = x0 - 3; x <= x1 + 3; x++) {
      const u = (x + 0.5 - cx) / (C.w / 2 + 3), vt = fy - C.h + Math.round(4 * u * u);
      for (let y = vt - 2; y <= fy; y++) {
        const i = I(x, y); if (acKeep.has(i)) continue;
        const wallSide = x < x0 || x > x1, door = wallSide && fy - y <= 6 && fy - y >= 1;
        if (y === fy) { tiles[i] = AC_LAVRADA; continue; }
        if (y < vt) { set(x, y, AC_LAVRADA); continue; }
        if (wallSide && !door) { set(x, y, AC_LAVRADA, WAC_TEMPLO); continue; }
        set(x, y, AIR, wallSide ? WAC_LAVRADA : WAC_TEMPLO);
      }
    }
    // o estrado: 2 degraus no meio, 12 de largura em cima
    for (let k = 0; k < 2; k++) for (let x = Math.round(cx) - 8 + k * 2; x <= Math.round(cx) + 7 - k * 2; x++) set(x, fy - 1 - k, AC_LAVRADA);
    C.dais = { x0: W1(Math.round(cx) - 4), x1: W1(Math.round(cx) + 3), y: fy - 3 };
    // as colunas, do chão até a abóbada (as de cima do estrado não)
    for (let x = x0 + 3; x < x1 - 1; x += 6) {
      if (Math.abs(x - cx) < 9) continue;
      let y = fy - 1; let top = y; while (top > fy - C.h - 4 && at(x, top - 1) === AIR) top--;
      if (!SOLID[at(x, top - 1)] || y - top < 4) continue;
      for (let yy = top; yy <= y; yy++) set(x, yy, AC_COLUNA);
    }
  }
  // as forjas: o chão de escória e tijolo, um degrau de tijolo da fornalha no fundo
  for (const C of acForges) {
    for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) { const i = I(x, C.fy); if (SOLID[tiles[i]] && !acKeep.has(i)) tiles[i] = hash2(x, C.fy, seed ^ 0xa71) < 0.55 ? AC_ESCORIA : AC_TIJOLO; }
    for (let x = C.x0 + 3; x < C.x0 + 9; x++) set(x, C.fy - 1, AC_TIJOLO);
  }
  // a Casa da Guarda: paredes de pedra lavrada, o chão de laje, a escada de ferro descendo do poço, e a lareira de rocha de
  // brasa no fundo (a luz que nasce da pedra: ninguém precisa acender), duas fendas de brasa no chão
  for (const L of acLand) {
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      const shaft = y === L.fy - L.h - 1 && wdx(x - L.xs) >= 0 && wdx(x - L.xs) < 3;
      const door = (W1(x) === L.door[0] || W1(x) === L.door[1] || (L.side > 0 ? x === L.x0 + L.w : x === L.x0 - 1)) && y >= L.fy - 4 && y < L.fy;
      if (shaft || door) { tiles[i] = W1(x) === W1(L.xs + 1) && shaft ? AC_ESCADA : AIR; walls[i] = WAC_LAVRADA; }
      else if (edge) tiles[i] = y === L.fy ? AC_LAJE : AC_LAVRADA;
      else { tiles[i] = AIR; walls[i] = WAC_LAVRADA; }
      acKeep.add(i);
    }
    for (const dx of L.door) for (let y = L.fy - 4; y < L.fy; y++) { const i = I(dx, y); tiles[i] = AIR; walls[i] = WAC_LAVRADA; acKeep.add(i); }
    for (const dx of L.door) { const i = I(dx, L.fy); tiles[i] = AC_LAJE; acKeep.add(i); const j = I(dx, L.fy - 5); if (!SOLID[tiles[j]]) tiles[j] = AC_LAVRADA; acKeep.add(j); }
    const far = L.side > 0 ? L.x0 : L.x0 + L.w - 3;   // a lareira na ponta de dentro
    for (let x = far; x < far + 3; x++) { tiles[I(x, L.fy - L.h - 1)] = AC_BRASA; }
    for (const lx of L.side > 0 ? [L.x0 + 5, L.x0 + 11] : [L.x0 + 4, L.x0 + 10]) if (tiles[I(lx, L.fy - 1)] === AIR) tiles[I(lx, L.fy - 1)] = AC_FENDA;
    for (let y = L.fy - L.h; y < L.fy; y++) { const i = I(L.xs + 1, y); if (tiles[i] === AIR) tiles[i] = AC_ESCADA; }
  }
  // as descidas: o poço de 3, paredes de tijolo refratário, a escada no meio; um patamar a cada 12 (só a escada passa)
  for (const E of acEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - L.h - 1;
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; if (!walls[i] || y >= S0 - 4) walls[i] = y < S0 ? walls[i] || WAC_ROCHA : WAC_TIJOLO; acKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 ? AC_ROCHA : AC_TIJOLO; acKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = AC_ESCADA; acKeep.add(i); } }
    for (let my = E.fy + 12; my < y1 - 4; my += 12) for (const x of [x0, x0 + 2]) { const i = I(x, my); tiles[i] = AC_LAVRADA; acKeep.add(i); }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) acKeep.add(I(x, y));
  }
  // as Escadarias do Fundo: o poço de 3 com paredes de bronze, a corrente pendurada até a última linha, um patamar no meio
  for (const X of acExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WAC_FORNALHA; acKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = y > X.fy - 8 ? AC_BRONZE : AC_TIJOLO; acKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = AC_CORRENTE; acKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2]) { const i = I(x, my); tiles[i] = AC_TIJOLO; acKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { acKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = AC_LAVRADA; } }
    tiles[I(X.x0 + 1, X.fy)] = AC_TIJOLO;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0fac);
  const vein = (ore, n, d0, d1, lmin, lmax, host, near) => {
    for (let k = 0, tries = 0; k < n && tries < n * 8; tries++) {
      let x, y;
      if (near) { const s = near(); if (!s) break; x = s[0] + ((R4() * 11) | 0) - 5; y = s[1] + ((R4() * 9) | 0) - 4; }
      else { x = (R4() * WW) | 0; y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); }
      if (y < S0 + mb(d0) || y > S0 + mb(d1)) continue;
      k++;
      const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !acKeep.has(i) && awayFromBoss(x, y, -4)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(AC_O_CARVAO, 30 * WSC * K, 0, 186, 3, 6, t => t === AC_ROCHA);
  // a ardorita nasce junto dos veios de brasa: os pontos de brasa que tocam um vão (para o herói achar)
  for (let k = 0, tries = 0; k < 60 * WSC * K && tries < 4000 * K; tries++) {
    const x = (R4() * WW) | 0, y = S0 + 2 + ((R4() * (DB - 6)) | 0); if (at(x, y) !== AC_BRASA) continue;
    let open = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!SOLID[at(x + dx, y + dy)]) open = true;
    if (open || R4() < 0.3) { acVeins.push([W1(x), y]); k++; }
  }
  const pick = (d0, d1) => () => { const L = acVeins.filter(s => s[1] >= S0 + mb(d0) && s[1] < S0 + mb(d1)); return L.length ? L[(R4() * L.length) | 0] : null; };
  const ardHost = t => t === AC_ROCHA || t === AC_BRASA;
  vein(AC_O_ARDORITA, 3 * WSC * K, 0, 46, 3, 5, ardHost, pick(0, 46));
  vein(AC_O_ARDORITA, 4 * WSC * K, 46, 98, 3, 5, ardHost, pick(46, 98));
  vein(AC_O_ARDORITA, 6 * WSC * K, 98, 150, 3, 6, ardHost, pick(98, 150));
  vein(AC_O_ARDORITA, 7 * WSC * K, 150, 186, 3, 6, t => ardHost(t) || t === AC_ESCORIA, pick(150, 186));
}

function acAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = AC_S0, YB = AC_LYR(), R3 = mulberry32(seed ^ 0xac3c1);
  const acRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!acRow(y)) return; const i = I(x, y); if (acKeep.has(i) || inAcHall(W1(x), y, 4)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = acWallOf(y); };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const acSolid = t => SOLID[t] && AC_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = acBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  // o telhado dos faróis em pé não ganha escada por fora (a casa da lanterna é fechada: só se chega lá por dentro)
  const inTower = (x, y) => acTowers.some(C => Math.abs(wdx(x - Math.round(C.cx))) <= 6 && y >= (C.towerTop || C.top) - 2 && y <= C.fy);

  // ---------- 1. tudo alcançável das duas descidas (o conserto do 285) ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of acEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!acEntries.length && acRooms.length) flood(I(acRooms[0].cx, Math.round(acRooms[0].cy)));
  if (B) for (let y = B.top - 4; y <= B.fy + 4; y++) for (let x = B.cx - 60; x <= B.cx + 59; x++) reach[I(x, y)] = 1;
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
        if (acKeep.has(nb) || acKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
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
      for (let k = 1; k <= n; k++) { const ny = Math.round(ay + (by - ay) * k / n), nx = k === n ? ax + wdx(bx - ax) : x + dir * 12; worm(x, y, nx, ny, 1.3, 0xa6a0 + pass + (k - 1) * 977); x = nx; y = ny; dir = -dir; }
    }
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {
      const hit = bfs(bestC);
      for (let c = hit; c >= 0 && org[c - RB] !== c; c = org[c - RB]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada de ferro (Faróis e Templos) ou corrente (Ruas e Fornalha) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3) || inTower(x, y)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || AC_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (acKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const tt = acClimbT(y);
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || AC_CLIMB(at(x, y - 1)) || AC_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (acKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, acClimbT(y));
  }

  // ---------- 3. os braseiros dos templos: os loucos ainda alimentam os dos estrados (um de cada lado do altar), em dois
  // templos de cada três; nos outros ficaram frios ----------
  for (const C of acTemples) {
    if (!C.dais) continue;
    const lit = hash2(C.x0, C.fy, seed ^ 0xa55) < 0.67;
    for (const x of [C.dais.x0 - 1, C.dais.x1 + 1]) { const y = C.fy - 3; if (at(x, y) === AIR && SOLID[at(x, y + 1)]) put(x, y, lit ? AC_BRASEIRO : AC_BRASEIRO_FRIO); }
    C.lit = lit;
  }

  // ---------- 4. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || acKeep.has(i)) continue;
    const b = acBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inAcLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = acSolid(dn) && BLOCKY[dn] && up === AIR, ceil = acSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (q < 0.05) put(x, y, AC_FULIGEM);
      else if (q < 0.065 && gap >= 4 && (b === 1 || b === 2)) put(x, y, AC_LANTERNA);
      else if (q < 0.08 && gap >= 3 && b !== 3) put(x, y, AC_PAVIO);
      else if (q < 0.09 && gap >= 3 && b === 2) put(x, y, AC_PINGENTE);
      continue;
    }
    if (!floor || AC_CLIMB(at(x - 1, y)) || AC_CLIMB(at(x + 1, y)) || (agua.length && agua[i])) continue;
    // as fendas: o fogo que ainda corre debaixo da cidade aparece pelas rachaduras do chão (a luz natural da camada)
    if (q > 0.975 - b * 0.004 && (agua.length === 0 || !agua[i])) { put(x, y, AC_FENDA); continue; }
    if (b === 0) { if (q < 0.04) put(x, y, AC_CINZEIRO); else if (q < 0.05) put(x, y, AC_BRASEIRO_FRIO); else if (q < 0.056) put(x, y, AC_OSSADA); else if (q < 0.07 && dn === AC_BRASA) put(x, y, AC_FENDA); }
    else if (b === 1) { if (q < 0.05) put(x, y, AC_CINZEIRO); else if (q < 0.062) put(x, y, AC_BRASEIRO_FRIO); else if (q < 0.07) put(x, y, AC_OSSADA); else if (q < 0.076) put(x, y, AC_CERA); }
    else if (b === 2) { if (q < 0.05) put(x, y, AC_CERA); else if (q < 0.065) put(x, y, AC_BRASEIRO_FRIO); else if (q < 0.075) put(x, y, AC_CINZEIRO); else if (q < 0.08) put(x, y, AC_OSSADA); }
    else { if (q < 0.04) put(x, y, AC_CINZEIRO); else if (q < 0.07 && (dn === AC_BRASA || dn === AC_ESCORIA)) put(x, y, AC_FENDA); else if (q < 0.08) put(x, y, AC_BRASEIRO_FRIO); }
  }

  // ---------- 5. os objetos ----------
  acPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function acExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of acEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? AC_ESCADA : AIR; acKeep.add(i); }
}
/* ---------- nenhuma queda aberta de mais de 13 blocos: de toda beira onde se fica de pé, se o vão embaixo passa disso,
   desce uma corrente do teto (se o teto está perto) ou se encosta uma escada no chão até a altura da beira ---------- */
function acFallFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), YB = AC_LYR();
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => AC_CLIMB(tiles[I(x, y)]), wet = (x, y) => agua.length > 0 && agua[I(x, y)] > 0;
  const stand = (x, y) => !S(x, y) && !S(x, y - 1) && S(x, y + 1);
  let n = 0;
  for (let y = AC_S0 - 2; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (!stand(x, y) || inAcHall(x, y, 2)) continue;
    for (const d of [-1, 1]) {
      const fx = W1(x + d);
      if (S(fx, y) || S(fx, y - 1) || S(fx, y + 1) || L(fx, y + 1) || wet(fx, y + 1)) continue;
      let b = y + 1; while (b < YB + 30 && !S(fx, b) && !L(fx, b) && !wet(fx, b)) b++;
      if (b - y - 1 <= 13) continue;   // cair em cima de uma escada também é queda: a corrente nova emenda nela
      if (L(W1(fx + d), y + 2) || L(W1(fx + d), b - 2)) continue;   // já tem por onde descer ao lado
      let top = y; while (top > y - 10 && !S(fx, top - 1)) top--;
      const hang = S(fx, top - 1), t = hang ? AC_CORRENTE : AC_ESCADA;
      for (let yy = hang ? top : y; yy < b; yy++) { const i = I(fx, yy); if (acKeep.has(i)) continue; tiles[i] = t; if (!walls[i]) walls[i] = acWallOf(yy); }
      n++;
    }
  }
  acFallFix.last = n;
  return n;
}
/* ---------- a subida garantida (o 285): da Fornalha, de cada torre, rua, templo e do pé das Escadarias o herói tem de
   conseguir voltar às descidas (pulo de 3 blocos; escada e corrente sobem) ---------- */
function acClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = AC_S0, YB = AC_LYR(), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => AC_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !inAcHall(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
    F[(y - Y0) * WW + x] = f;
  };
  const flags = () => { for (let y = Y0 + 1; y < YB; y++) for (let x = 0; x < WW; x++) flag1(x, y); };
  const arrive = (p, r, c, dir) => { if (F[c] & 2) return dir === 1 && r === 0 ? -1 : 4; if (dir === 0) return r === 4 && !(F[p] & 4) ? 0 : r; if (dir === 1) return r === 0 ? -1 : F[p] & 8 ? 4 : r === 4 ? 3 : r - 1; return 0; };
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
  const soft = t => t === AC_ROCHA || t === AC_CINZA || t === AC_LAJE || t === AC_LAVRADA || t === AC_TIJOLO || t === AC_ESCORIA || t === AC_BRASA;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || acKeep.has(I(x, y)) || inAcHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !acKeep.has(I(x, t)) && !inAcHall(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = acClimbT(y); if (!walls[i]) walls[i] = acWallOf(y); } }
    return best;
  };
  const starts = [];
  if (acBoss) for (const D of acBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of acTowers) starts.push([Math.round(c.cx) + 2, c.fy - 1], [Math.round(c.cx) + 2, (c.towerTop || c.top) + 4]);
  for (const c of acStreets) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of acTemples) starts.push([Math.round(c.cx), c.fy - 4]);
  for (const c of acForges) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of acExits) starts.push([X.x0 + 2, X.top - 1]);
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
  acClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (412): por faixa, no chão, debaixo do teto e na parede (o 285). Flags do 412: templo (só nos
   templos), forja (só nas forjas). Nunca no pouso nem na Fornalha do Mundo ---------- */
function acPlaceProps() {
  if (typeof AC_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9ac58);
  const S0 = AC_S0, YB = AC_LYR(), used = new Uint8Array(WW * WH * 2), BF = typeof AC_BACK_FLOOR !== 'undefined' ? AC_BACK_FLOOR : {};
  const B = acBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 4 + m && y >= B.top - 4 - m && y <= B.fy + 4 + m;
  const inside = (L, x, y) => L.some(C => wdx(x - C.x0) >= -2 && wdx(x - C.x0) < C.w + 2 && y >= C.top - 2 && y <= C.fy);
  const where = (def, x, y) => (!def.templo || inside(acTemples, x, y)) && (!def.forja || inside(acForges, x, y));
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || acKeep.has(i) || wet(i) || inBox(W1(x), y, 1) || inAcLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && AC_SOILS[t]; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = AC_BAND_NAMES[clamp(acBand(y), 0, 3)], plan = AC_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || wet(i) || inBox(W1(k), y, 2) || inAcLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
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

// a ordem: a camada, a Fornalha (416: acDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('acendedores', () => {
  if (!ACENDEDORES) return;
  const t0 = performance.now(); acWrapLink();
  try { acBuild(); acAfter(); if (typeof acDress === 'function') acDress(); acExitClear(); acFallFix(); acClimbFix(); } catch (err) { console.error(err); }
  acBuild.ms = performance.now() - t0;
});
}; }
// as ligações do 87 abrem túneis depois da camada: as quedas que elas criam também ganham corrente ou escada
// (o 87 carrega depois deste arquivo: o embrulho se faz na primeira geração)
function acWrapLink() {
  if (typeof worldLink !== 'function' || worldLink.ac) return;
  const _wl = worldLink; worldLink = function () { const r = _wl.apply(this, arguments); if (ACENDEDORES) try { acFallFix(); } catch (err) { console.error(err); } return r; }; worldLink.ac = true;
}

/* ---------- a terceira camada: os faróis ao longe nos Faróis, a cidade em silhueta nas Ruas e nos Templos, o clarão
   da Fornalha no fundo ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!ACENDEDORES) return;
  const Y1 = Math.min(WH, AC_S0 + AC_D + 4);
  for (let y = Math.max(AC_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - AC_S0) + (depthNz(x, y, 25, seed ^ 0xae11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0xae12);
    DEEPT[i] = d < AC_BANDS[1] ? (n > 0.7 ? DP_AC_CIDADE : DP_AC_FAROIS) : d < AC_BANDS[3] ? (n > 0.75 ? DP_AC_FAROIS : DP_AC_CIDADE) : (n > 0.72 ? DP_AC_CIDADE : DP_AC_FORNALHA);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (ACENDEDORES && ty >= AC_S0 && ty < AC_S0 + AC_D) return inAcHall(tx, ty, 2) ? AC_ZONE0 + 3 : AC_ZONE0 + clamp(acBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos por faixa: cada faixa usa 5 ou 6 dos 10, todos aparecem em alguma
Object.assign(CATH_SPAWN, {
  [AC_ZONE0]: [[['faroleiro', 24], ['alado', 20], ['turibulo', 20], ['fagulhas', 16], ['pavio', 14]], 8],
  [AC_ZONE0 + 1]: [[['turibulo', 20], ['acArauto', 18], ['faminto', 16], ['pavio', 18], ['engolidor', 16], ['cirio', 12]], 9],
  [AC_ZONE0 + 2]: [[['cirio', 20], ['acArauto', 18], ['turibulo', 18], ['alado', 16], ['faminto', 14]], 9],
  [AC_ZONE0 + 3]: [[['fornoandante', 22], ['fagulhas', 20], ['engolidor', 20], ['faminto', 16], ['faroleiro', 12]], 10]
});
for (let z = AC_ZONE0; z < AC_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const AC_NO_SPAWN = (tx, ty) => acSafe(tx, ty) || inAcHall(tx, ty, 4) || acExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
// níveis pela posição no 129 (layerLvl no 52); nada nasce perto do pouso, na Fornalha nem nas Escadarias
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!ACENDEDORES || !e || e.boss || (D && D.boss) || e.acMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - AC_S0;
  if (d >= 0 && d < AC_D) {
    if (zone >= AC_ZONE0 && zone <= AC_ZONE0 + 3 && AC_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.acVoid = true; return e; }
    const lvl = layerLvl(layerLo('acendedores'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].acVoid) enemies.splice(k, 1); });

/* ---------- partículas: cinza fina caindo em todo lugar, fagulhas subindo das fendas e dos veios no fundo, a cinza
   levada pelo vento nas ruas ---------- */
HOOK.update.push(dt => {
  if (!ACENDEDORES || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = acBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 1 ? 5 : 3.5)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 3 && Math.random() < 0.5) parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-12, -5), g: 0, life: 2.2, max: 2.2, col: Math.random() < 0.6 ? '#f08a2a' : '#ffbe5a', size: 1 });
    else if (b === 1 && Math.random() < 0.5) { const s = Math.sin(gameTime * 0.25) < 0 ? -1 : 1; parts.push({ x, y, vx: s * rnd(12, 22), vy: rnd(-1, 3), g: 0, life: 2.6, max: 2.6, col: Math.random() < 0.5 ? '#625d57' : '#7c766e', size: 1 }); }
    else parts.push({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(2, 5), g: 0, life: 3.4, max: 3.4, col: Math.random() < 0.6 ? '#4c4844' : '#7c766e', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a ardorita na fornalha (417 tem os itens), as lojas ---------- */
FURN.min_ardorita = { bar: 'barra_ardorita', n: 10, t: 12 };
Object.assign(MAT_VAL, { min_ardorita: 64, barra_ardorita: 680, cera_acendedor: 22, brasa_viva: 70, pavio_eterno: 34 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['cera_acendedor', 'brasa_viva'].includes(id); c.hint = c.hint.replace(/\.$/, '') + ', cera de círio e brasa viva.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_ardorita', 'barra_ardorita', 'pavio_eterno', 'brasa_viva'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', ardorita e pavios eternos.'; }
