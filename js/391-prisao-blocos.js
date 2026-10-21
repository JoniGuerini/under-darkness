'use strict';

/* ================= a Prisão dos Deuses: blocos, paredes, terceira camada, minérios, decoração, o brilho =================
   O que os deuses levantaram para prender. A rocha da prisão é um granito escuro cinza-violeta, em placas fraturadas,
   com o grão claro do feldspato; a alvenaria ciclópica são pedras enormes e irregulares, cada uma talhada em faces,
   com a junta funda e a beira de cima à esquerda acesa; a pedra viva é a rocha das celas, avermelhada, com veios que
   pulsam devagar como se respirassem; o elo gigante é o ferro das pontes, um elo de frente e um de lado, enferrujado
   nas beiras; o bronze antigo em placas rebitadas com o verde do tempo; a pedra do Tártaro quase preta com pontos
   violeta, e a fenda dela, por onde a luz fria vaza; a laje gasta dos pisos (o meio da pedra afundado de tanto passo);
   a pedra rúnica, alvenaria com uma runa entalhada que ainda acende em azul frio. O ferro divino: caroços de ferro
   negro com veios de ouro.
   Como o 291, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda acesa e
   oclusão vêm do 07. Paredes e terceira camada só leem o tom. A decoração de 1 bloco são sprites de 12x12 em rampas de
   7 tons, luz de cima à esquerda. Luz só a que nasce do lugar: o ícor (o sangue dourado dos deuses presos, pingando do
   teto), as runas, os veios da pedra viva, as fendas do Tártaro e o líquen pálido. Ids: 390. */
const PDART = {};   // ferramentas para 392-prisao-objetos, os bichos (393, 394) e o Lobo Atado (397)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('pdRocha', ['#121016', '#1e1a22', '#2c2632', '#3c3444', '#524858', '#6c6074']);
pal('pdAlvenaria', ['#15130f', '#24201a', '#363026', '#4a4234', '#635a48', '#837862']);
pal('pdViva', ['#160c0c', '#261414', '#381e1c', '#4c2a26', '#643a32', '#7e4c40']);
pal('pdElo', ['#0c0c10', '#18181e', '#26262e', '#383842', '#50505c', '#727280']);
pal('pdBronze', ['#1a1006', '#2e1e0c', '#4a3214', '#6c4c1e', '#94702e', '#c09a48']);
pal('pdTartaro', ['#060508', '#0c0a10', '#141118', '#1c1822', '#26202e', '#322a3c']);
pal('pdLaje', ['#14120e', '#221f19', '#332e26', '#464034', '#5c5444', '#766c58']);
pal('pdRuna', ['#121216', '#1e1e24', '#2c2c34', '#3e3e48', '#56566a', '#74748a']);
// paredes de fundo: bem abaixo do chão da frente
pal('pdRochaW', ['#060508', '#09080b', '#0d0b10', '#110f15', '#16131b', '#1c1822']);
pal('pdAlvW', ['#070605', '#0b0a08', '#100e0b', '#15120f', '#1a1713', '#211c17']);
pal('pdCelaW', ['#060505', '#0a0808', '#0e0b0b', '#130f0e', '#181312', '#1f1816']);
pal('pdBronzeW', ['#0a0604', '#100a06', '#170f08', '#1f140b', '#281a0e', '#332312']);
pal('pdTartaroW', ['#030304', '#060508', '#09070b', '#0c0a0f', '#100d14', '#15111a']);
// a terceira camada: as correntes no vazio, as celas ao longe, o fundo do Tártaro
pal('dpPdAbismo', ['#020203', '#050407', '#08070b', '#0c0b10', '#131118', '#201c28']);
pal('dpPdCelas', ['#030202', '#060505', '#0a0808', '#0f0c0b', '#161210', '#2a1e16']);
pal('dpPdTartaro', ['#020103', '#040306', '#07050a', '#0b0810', '#140e1e', '#2e1e48']);

const wrapT = v => ((v % TP) + TP) % TP;
const RX = hexes => hexes.map(h => ph(h));
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
// as cores puras (MATX): o vermelho dos veios vivos, o violeta das fendas, o azul das runas, a ferrugem, o verde do bronze
const VIVA = RX(['#3a0e0a', '#6a1a12', '#a02c1c', '#d0402a', '#ff7a4a', '#ffc090']);
const FENDA = RX(['#1a1028', '#2e1a4a', '#4a2a7a', '#7a4ac0', '#b08aff', '#e8d8ff']);
const RUNA = RX(['#0e2030', '#1a3a58', '#2a6090', '#5ab0e8', '#a8dcff', '#e8f8ff']);
const FERR = RX(['#2a1208', '#4a2210', '#6a3418', '#8a4a22']);
const PATINA = RX(['#1a2a22', '#2a4a3a', '#3e6a54', '#5a8a70']);

/* ---- o chão sólido ---- */
// rocha da prisão: granito em placas grandes fraturadas, a nuvem larga de tom, o grão claro e o escuro
function vRocha(x, y) {
  let v = 2.7 + cn(x, y, 6, 6, 39101) * 1.1 + cn(x, y, 24, 24, 39102) * 0.45 + cg(x, y, 39103) * 0.35;
  const k = cells(x, y, 30, 39104, 1.1), e = k.d2 - k.d1;
  if (e < 1.0) v -= 1.4; else if (e < 2.2) v += k.ox + k.oy < 0 ? 0.55 : -0.35;
  v += (k.id - 0.5) * 0.5;
  const h = hash2(x, y, 39105); if (h < 0.022) v += 1.1; else if (h < 0.04) v -= 0.8;
  return v;
}
// alvenaria ciclópica: pedras enormes e irregulares (células de 40), a junta funda, a face de cima à esquerda acesa e
// as marcas de cinzel em riscas finas
function vAlvenaria(x, y) {
  const k = cells(x, y, 40, 39111, 0.9), e = k.d2 - k.d1;
  if (e < 1.3) return 0.5 + cg(x, y, 39112) * 0.2;
  let v = 3.0 + (k.id - 0.5) * 0.9 + cn(x, y, 12, 12, 39113) * 0.35 + cg(x, y, 39114) * 0.3;
  if (e < 3.2) v += k.ox + k.oy < 0 ? 0.9 : -0.6;
  else if (e < 5) v += k.ox + k.oy < 0 ? 0.3 : -0.15;
  if (((x * 3 + y * 7 + ((k.id * 40) | 0)) % 9) === 0 && e > 4) v -= 0.45;   // o cinzel
  return v;
}
// pedra viva: rocha avermelhada com a pele em bolhas largas e os veios que acendem (o pulso é ao vivo, no drawGlow)
function vViva(x, y) {
  let v = 2.6 + cn(x, y, 8, 8, 39121) * 1.0 + cg(x, y, 39122) * 0.3;
  const k = cells(x, y, 20, 39123, 1); v += (1 - Math.min(1, k.d1 / 12)) * 0.6 - 0.25;
  const wx = wrapT(x + cn(x, y, 6, 6, 39124) * 40), wy = wrapT(y + cn(x, y, 6, 6, 39125) * 40), vein = Math.abs(cn(wx, wy, 5, 5, 39126));
  if (vein < 0.0055) { MATX = VIVA[vein < 0.0025 ? 4 : 3]; return -9; }
  if (vein < 0.011) { MATX = VIVA[vein < 0.008 ? 2 : 1]; return -9; }
  if (vein < 0.02) v += 0.6;
  return v;
}
// elo gigante: um elo de frente (o anel oval, 16 x 11) e um de lado (a barra que passa pelos furos), a cada 24 px; a
// ferrugem nas beiras
function vElo(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 24, ly = Y % 12;
  const dx = (lx + 0.5 - 8) / 8, dy = (ly + 0.5 - 6) / 5.6, d = Math.hypot(dx, dy), hx = (lx + 0.5 - 8) / 4.4, hy = (ly + 0.5 - 6) / 2.1, dh = Math.hypot(hx, hy);
  if (d <= 1 && dh > 1) {
    let v = 3.2 - (dx * 0.6 + dy * 0.8) * 1.3 + cg(x, y, 39131) * 0.35;
    if (d > 0.86) v -= 0.6;
    if (dh < 1.35) v += dx + dy > 0 ? 0.7 : -0.7;   // a beira do furo
    if (hash2(x, y, 39132) < 0.05) { MATX = FERR[(hash2(x, y, 39133) * 4) | 0]; return -9; }
    return v;
  }
  const bar = ly >= 4 && ly <= 7 && (lx >= 13 || dh <= 1);
  if (bar) {
    let v = ly === 4 ? 4.2 : ly === 5 ? 3.4 : ly === 6 ? 2.6 : 1.6; v += cg(x, y, 39134) * 0.3;
    if (hash2(x, y, 39135) < 0.06) { MATX = FERR[1 + ((hash2(x, y, 39136) * 3) | 0)]; return -9; }
    return v;
  }
  return 0.5 + cg(x, y, 39137) * 0.2;   // o vão entre os elos, no escuro
}
// bronze antigo: placas de 24 x 24 com o friso gravado, quatro rebites, o verde do tempo em manchas
function vBronze(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 24, ly = Y % 24;
  if (lx === 23 || ly === 23) return 0.6;
  let v = 3.0 + cn(x, y, 10, 10, 39141) * 0.45 + cg(x, y, 39142) * 0.25 + Math.sin(y * 0.9 + cn(x, y, 4, 4, 39143) * 3) * 0.12;
  if (lx === 0 || ly === 0) v += 1.0; else if (lx === 22 || ly === 22) v -= 0.6;
  if ((lx === 3 || lx === 19) && ly >= 3 && ly <= 19 || (ly === 3 || ly === 19) && lx >= 3 && lx <= 19) v -= 0.9;   // o friso
  else if ((lx === 4 && ly > 3 && ly < 19) || (ly === 4 && lx > 3 && lx < 19)) v += 0.5;
  for (const [rx, ry] of [[1.5, 1.5], [20.5, 1.5], [1.5, 20.5], [20.5, 20.5]]) { const d = Math.hypot(lx + 0.5 - rx - 0.5, ly + 0.5 - ry - 0.5); if (d < 1.4) return d < 0.7 ? 4.8 : lx + ly < rx + ry + 1 ? 4.2 : 1.6; }
  const pt = cn(x, y, 12, 12, 39144) + cn(x, y, 30, 30, 39145) * 0.5;
  if (pt > 0.3) { MATX = PATINA[pt > 0.42 ? 2 : pt > 0.36 ? 1 : 0]; return -9; }
  return v;
}
// pedra do Tártaro: preta, faces de vidro largas, pontos violeta
function vTartaro(x, y) {
  let v = 2.2 + cn(x, y, 8, 8, 39151) * 1.0 + cg(x, y, 39152) * 0.3;
  const k = cells(x, y, 24, 39153, 1); v += -(k.ox + k.oy) * 0.035 + (k.id - 0.5) * 0.5; if (k.d2 - k.d1 < 0.9) v -= 1.0;
  if (hash2(x, y, 39154) < 0.006) { MATX = FENDA[hash2(x, y, 39155) < 0.3 ? 3 : 2]; return -9; }
  return v;
}
// fenda do Tártaro: a mesma pedra rachada, a luz violeta vazando pelas rachaduras
function vFenda(x, y) {
  const wx = wrapT(x + cn(x, y, 6, 6, 39161) * 30), wy = wrapT(y + cn(x, y, 6, 6, 39162) * 30), c = Math.abs(cn(wx, wy, 4, 4, 39163)), c2 = Math.abs(cn(wx, wy, 10, 10, 39164));
  if (c < 0.007) { MATX = FENDA[c < 0.003 ? 5 : 4]; return -9; }
  if (c < 0.014) { MATX = FENDA[c < 0.01 ? 3 : 2]; return -9; }
  if (c2 < 0.005) { MATX = FENDA[2]; return -9; }
  const v = vTartaro(x, y); if (v === -9) return v;
  return v + (c < 0.03 ? 0.9 : 0);
}
// laje gasta: lajes de 24 x 12 desencontradas, o meio afundado de tanto passo, as beiras arredondadas, uma rachadura
function vLaje(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = (Y / 12) | 0, ly = Y % 12, xx = wrapT(X + (row & 1) * 12), col = (xx / 24) | 0, lx = xx % 24, h = hash2(col, row, 39171);
  if (ly === 11 || lx === 23) return 0.6;
  let v = 3.1 + (h - 0.5) * 0.7 + cn(x, y, 12, 12, 39172) * 0.4 + cg(x, y, 39173) * 0.35;
  const u = (lx - 11) / 11, w = (ly - 5) / 5; v -= (1 - u * u) * (1 - w * w) * 0.5;   // o meio gasto
  if (ly === 0 || lx === 0) v += 0.9; else if (ly === 10 || lx === 22) v -= 0.6;
  if (h < 0.3 && Math.abs(cn(x, y, 8, 8, 39174)) < 0.012) v -= 1.3;
  return v;
}
/* pedra rúnica: alvenaria em blocos de 12 com uma runa entalhada no meio (7 runas de traço reto, como as que se
   riscam em pedra), a runa acesa em azul frio e o sulco em volta escuro */
const RUNAS = [
  ['..#..', '.###.', '#.#.#', '..#..', '..#..', '..#..', '..#..'], ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  ['#....', '##...', '#.#..', '#..#.', '#.#..', '##...', '#....'], ['#.#.#', '.###.', '..#..', '..#..', '..#..', '.###.', '#.#.#'],
  ['..#..', '..#..', '.#.#.', '#...#', '.#.#.', '..#..', '..#..'], ['###..', '#..#.', '###..', '#.#..', '#..#.', '#...#', '#....'],
  ['#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#', '#...#']
];
const runaAt = (k, x, y) => x >= 0 && y >= 0 && x < 5 && y < 7 && RUNAS[k][y][x] === '#';
const runaK = (bx, by) => (hash2(bx, by, 39181) * RUNAS.length) | 0;
function vRuna(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 12, ly = Y % 12, bx = (X / 12) | 0, by = (Y / 12) | 0;
  if (lx === 11 || ly === 11) return 0.6;
  const k = runaK(bx, by), gx = lx - 3, gy = ly - 2;
  if (runaAt(k, gx, gy)) { MATX = RUNA[(gx + gy) % 3 === 0 ? 4 : 3]; return -9; }
  let v = 2.9 + (hash2(bx, by, 39182) - 0.5) * 0.5 + cn(x, y, 12, 12, 39183) * 0.3 + cg(x, y, 39184) * 0.3;
  if (lx === 0 || ly === 0) v += 0.9; else if (lx === 10 || ly === 10) v -= 0.55;
  if (runaAt(k, gx - 1, gy) || runaAt(k, gx + 1, gy) || runaAt(k, gx, gy - 1) || runaAt(k, gx, gy + 1)) v = runaAt(k, gx + 1, gy + 1) || runaAt(k, gx, gy + 1) ? 1.1 : v + 0.6;   // o sulco
  return v;
}
const RUNA_PX = RUNAS.map((r, k) => { const a = []; for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (runaAt(k, x, y)) a.push(3 + x, 2 + y); return a; });
// a grade de bronze das portas do chefe (ícone e mapa): barras em pé, uma travessa
function vGrade(x, y) { const X = wrapT(x), Y = wrapT(y); return 0.8 + (X % 4 === 1 ? 3.2 : X % 4 === 2 ? 2.2 : 0) + (Y % 12 === 5 ? 2.4 : 0) + cg(x, y, 39191) * 0.3; }

/* ---- paredes de fundo (só o tom) ---- */
function vRochaW(x, y) { const k = cells(x, y, 30, 39201, 1.1); return 2.7 + cn(x, y, 6, 6, 39202) * 1.0 + cg(x, y, 39203) * 0.25 + (k.d2 - k.d1 < 1 ? -1 : 0); }
function vAlvW(x, y) { const k = cells(x, y, 40, 39211, 0.9), e = k.d2 - k.d1; if (e < 1.3) return 0.6; return 2.8 + (k.id - 0.5) * 0.8 + cn(x, y, 12, 12, 39212) * 0.3 + cg(x, y, 39213) * 0.2 + (e < 3 ? (k.ox + k.oy < 0 ? 0.7 : -0.5) : 0); }
// a parede das celas: um nicho em arco a cada 40 px, fundo e escuro, com as barras de ferro (umas tortas)
function vCelaW(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 40, ly = Y % 48, n = (X / 40) | 0;
  const inArch = lx >= 7 && lx <= 32 && ly >= 8 && ly <= 46 && (ly > 18 || Math.hypot(lx + 0.5 - 20, ly + 0.5 - 19) < 13);
  if (inArch) {
    const bend = hash2(n, (Y / 48) | 0, 39221) < 0.35 ? Math.round(Math.sin((ly - 8) / 38 * 3.14) * 2) : 0;
    if ((lx - bend) % 5 === 0 && lx > 7 && lx < 32) return ly === 46 ? 2 : 3.4 - ((lx - bend) % 10 === 0 ? 0 : 0.5);   // as barras
    if (ly === 26 || ly === 27) return ly === 26 ? 3.2 : 1.6;                                                       // a travessa
    return 0.4 + cg(x, y, 39222) * 0.15;                                                                             // o fundo da cela
  }
  const nearArch = lx >= 5 && lx <= 34 && ly >= 6 && ly <= 47 && (ly > 18 || Math.hypot(lx + 0.5 - 20, ly + 0.5 - 19) < 15.5);
  return vAlvW(x, y) + (nearArch ? (lx < 20 ? 0.7 : -0.3) : 0);
}
// o bronze com relevo: painéis de 48 x 48 com moldura e uma corrente em relevo cruzando na diagonal
function vBronzeW(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 48, ly = Y % 48;
  if (lx === 47 || ly === 47) return 0.6;
  let v = 2.6 + cn(x, y, 10, 10, 39231) * 0.4 + cg(x, y, 39232) * 0.2;
  if (lx < 3 || ly < 3) v += 0.8; else if (lx > 43 || ly > 43) v -= 0.5;
  const t = (lx + ly) / 2, ox = lx - ly, ring = (Math.round(t) % 8);
  if (lx > 4 && ly > 4 && lx < 43 && ly < 43 && Math.abs(ox) < 5 && (ring < 5 ? Math.abs(Math.abs(ox) - 3) < 1 : Math.abs(ox) < 1.2)) v += ox < 0 ? 1.2 : -0.6;
  return v;
}
function vTartaroW(x, y) { const k = cells(x, y, 24, 39241, 1); return 2.3 + cn(x, y, 8, 8, 39242) * 1.0 + cg(x, y, 39243) * 0.2 + (k.d2 - k.d1 < 0.9 ? -1.2 : 0); }

/* ---- a terceira camada ---- */
// as correntes no vazio: três correntes enormes em catenária atravessando a textura, elo de frente e elo de lado
function vDpAbismo(x, y) {
  const X = wrapT(x), Y = wrapT(y);
  let v = 0.6 + cn(x, y, 4, 4, 39301) * 0.6 + cg(x, y, 39302) * 0.1;
  for (const [y0, sag, ph0, r] of [[40, 30, 0, 5], [130, 22, 80, 4], [200, 16, 160, 3]]) {
    const u = ((X + ph0) % 240) / 240 * 2 - 1, cy = y0 + sag * (u * u), d = Y - cy;
    if (Math.abs(d) > r + 1) continue;
    const along = (X + ph0) % (r * 4), front = along < r * 2;
    if (front) { const e = Math.hypot((along - r) / r, d / (r + 0.5)); if (e < 1 && e > 0.45) return 2.6 - d / r * 0.9 + (e > 0.85 ? -0.6 : 0); }
    else if (Math.abs(d) < r * 0.4) return 2.0 - d * 0.4;
  }
  return v;
}
// as celas ao longe: andares a cada 40 linhas, a laje do andar, nichos com barras, um ou outro com um resto de ícor
function vDpCelas(x, y) {
  const X = wrapT(x), Y = wrapT(y), ly = Y % 40, lx = X % 20, n = (X / 20) | 0, f = (Y / 40) | 0;
  if (ly >= 36) return ly === 36 ? 2.6 : 1.8 + cg(x, y, 39311) * 0.1;
  if (ly >= 14 && ly <= 32 && lx >= 4 && lx <= 15) {
    const lit = hash2(n, f, 39312) < 0.06;
    if (lx % 3 === 1) return lit ? 3.2 : 1.8;
    return lit ? 4.4 - Math.abs(ly - 26) * 0.05 : 0.3;
  }
  return 1.0 + cn(x, y, 10, 10, 39313) * 0.4 + cg(x, y, 39314) * 0.1;
}
// o fundo do Tártaro: placas negras e as fissuras violeta muito fracas, e a silhueta de uma corrente caindo no escuro
function vDpTartaro(x, y) {
  const c = cells(x, y, 60, 39321, 1), e = c.d2 - c.d1;
  if (e < 1.1) return 3.4 + cn(x, y, 3, 3, 39322) * 1.2;
  const X = wrapT(x), Y = wrapT(y), cx = 120 + Math.sin(Y / 240 * 6.2832) * 6;
  if (Math.abs(X - cx) < 3 && (Y % 14) < 10) return 1.6;
  return 0.4 + Math.max(0, 1 - e / 12) * 1.2 + cn(x, y, 10, 10, 39323) * 0.4 + cg(x, y, 39324) * 0.1;
}

/* ---- assar e registrar ---- */
const BKP = {
  rocha: bake(vRocha), alv: bake(vAlvenaria), viva: bake(vViva), elo: bake(vElo), bronze: bake(vBronze), tartaro: bake(vTartaro), fenda: bake(vFenda),
  laje: bake(vLaje), runa: bake(vRuna), grade: bake(vGrade),
  rochaW: bake(vRochaW), alvW: bake(vAlvW), celaW: bake(vCelaW), bronzeW: bake(vBronzeW), tartaroW: bake(vTartaroW),
  dpAbismo: bake(vDpAbismo), dpCelas: bake(vDpCelas), dpTartaro: bake(vDpTartaro)
};
const PD_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [PD_ROCHA, 'pdRocha', 'rocha', 1.9, '#3c3444'], [PD_ALVENARIA, 'pdAlvenaria', 'alv', 2.1, '#4a4234'], [PD_PEDRA_VIVA, 'pdViva', 'viva', 1.9, '#643a32'],
  [PD_ELO, 'pdElo', 'elo', 2.4, '#383842'], [PD_BRONZE, 'pdBronze', 'bronze', 2.3, '#94702e'], [PD_TARTARO, 'pdTartaro', 'tartaro', 2.0, '#1c1822'],
  [PD_FENDA, 'pdTartaro', 'fenda', 2.0, '#7a4ac0'], [PD_LAJE, 'pdLaje', 'laje', 2.0, '#5c5444'], [PD_RUNA, 'pdRuna', 'runa', 2.2, '#5ab0e8']
];
for (const [t, p, k, dig, col] of PD_SOLID) { MAT[t] = [PALS[p], BKP[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
// o natural se mistura com o vizinho; o que foi talhado ou forjado tem a beira reta
for (const t of [PD_ROCHA, PD_PEDRA_VIVA, PD_TARTARO, PD_FENDA]) BLEND[t] = 1;
EMIT[PD_PEDRA_VIVA] = 0.06; EMIT[PD_FENDA] = 0.32; EMIT[PD_RUNA] = 0.2;

WMAT[WPD_ROCHA] = [PALS.pdRochaW, BKP.rochaW]; WMAT[WPD_ALVENARIA] = [PALS.pdAlvW, BKP.alvW]; WMAT[WPD_CELA] = [PALS.pdCelaW, BKP.celaW];
WMAT[WPD_BRONZE] = [PALS.pdBronzeW, BKP.bronzeW]; WMAT[WPD_TARTARO] = [PALS.pdTartaroW, BKP.tartaroW];
DMAT[DP_PD_ABISMO] = [PALS.dpPdAbismo, BKP.dpAbismo]; DMAT[DP_PD_CELAS] = [PALS.dpPdCelas, BKP.dpCelas]; DMAT[DP_PD_TARTARO] = [PALS.dpPdTartaro, BKP.dpTartaro];

/* ---- os minérios: carvão na rocha, e o ferro divino: caroços de ferro negro facetado com veios de ouro ---- */
oreRamp(PD_O_FERRO, ['#08080c', '#16161e', '#2a2a34', '#46464f', '#8a7448', '#d8b060', '#fff0b0']);
ORE_PAINT[PD_O_FERRO] = function (L, s) {
  const R = ORE_RAMP[PD_O_FERRO];
  const pts = oreNodes(L, s, R, 39401, [2.9, 0.6], [1.5, 0.4], 6);
  // os veios de ouro atravessando o caroço: uma risca fina e brilhante
  const [x0, y0] = pts[0], a = hash2(s, 1, 39402) * 6.28;
  for (let t = -4; t <= 4; t += 0.5) { const x = Math.round(x0 + Math.cos(a) * t), y = Math.round(y0 + Math.sin(a) * t * 0.7); if (x >= 0 && y >= 0 && x < 12 && y < 12 && L.m[y * 12 + x]) L.put(x, y, R[Math.abs(t) < 1.5 ? 6 : 5], 9); }
  for (let i = 0; i < 2; i++) { const x = 1 + (hash2(s, i, 39403) * 10 | 0), y = 1 + (hash2(s, i, 39404) * 10 | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[4], 1); }   // pó dourado em volta
};
ORE_HALO[PD_O_FERRO] = { pal: ['pdRocha', '#8a6a2a', 0.3, 0.1], shade: 0.35 };
ORE_PAINT[PD_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[PD_O_CARVAO] = { pal: ['pdRocha', '#020203', 0.5, 0.2], shade: 0 };
const fromBK = B => (x, y) => { const k = y * TP + x; if (B.v[k] === -9) { MATX = B.x[k]; return -9; } return B.v[k]; };
MAT[PD_O_CARVAO] = [PALS.pdRocha, bakeOre(PD_O_CARVAO, fromBK(BKP.rocha))]; MAT[PD_O_FERRO] = [PALS.pdRocha, bakeOre(PD_O_FERRO, fromBK(BKP.rocha))];
for (const t of [PD_O_CARVAO, PD_O_FERRO]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[PD_O_CARVAO] = DIG[COAL]; ORE_XP[PD_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[PD_O_CARVAO] = ORE_NAME[COAL]; PCOL[PD_O_CARVAO] = PCOL[COAL]; ORE_ITEM[PD_O_CARVAO] = ORE_ITEM[COAL];
DIG[PD_O_FERRO] = 2.0; ORE_XP[PD_O_FERRO] = 29; ORE_NAME[PD_O_FERRO] = 'Ferro Divino'; PCOL[PD_O_FERRO] = '#d8b060'; ORE_ITEM[PD_O_FERRO] = 'min_ferro_divino';
EMIT[PD_O_FERRO] = 0.12;

/* ---- itens de bloco ---- */
const PD_ITEMS = {
  rocha_prisao: ['Rocha da Prisão', PD_ROCHA, 'Granito escuro, quase violeta. Os deuses escolheram a pedra mais dura que acharam.'],
  alvenaria_ciclopica: ['Alvenaria Ciclópica', PD_ALVENARIA, 'Um pedaço de uma pedra que nenhum homem levantaria. As marcas do cinzel são do tamanho de um dedo.'],
  pedra_viva: ['Pedra Viva', PD_PEDRA_VIVA, 'Pedra das celas. Na mão, os veios vermelhos ainda pulsam, devagar, como quem dorme.'],
  elo_gigante: ['Elo Gigante', PD_ELO, 'Um pedaço de elo das correntes-ponte. O ferro é tão grosso que a ferrugem só arranhou a casca.'],
  bronze_antigo: ['Bronze Antigo', PD_BRONZE, 'Placa de bronze rebitada, verde nas beiras. Ninguém mais sabe fundir bronze assim.'],
  pedra_tartaro: ['Pedra do Tártaro', PD_TARTARO, 'Pedra preta do fundo. Pontos violeta acendem dentro dela quando ninguém está olhando.'],
  laje_gasta: ['Laje Gasta', PD_LAJE, 'O meio da laje afundou de tanto passo. Quem andou aqui andou por muito tempo.'],
  pedra_runica: ['Pedra Rúnica', PD_RUNA, 'Uma runa de prisão entalhada na pedra. Ainda acende em azul, ainda segura alguma coisa.']
};
for (const id in PD_ITEMS) { const [name, block, desc] = PD_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[PD_FENDA] = 'pedra_tartaro';

/* ================= decoração: sprites de 12x12 em rampas de 7 tons ================= */
const DRP = {
  ferro: ['#08080c', '#16161c', '#26262e', '#3a3a44', '#55555f', '#7a7a86', '#a8a8b4'],
  bronze: ['#140c04', '#2a1a08', '#4a3010', '#6e4c1a', '#98702c', '#c49a48', '#e8c878'],
  osso: ['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6'],
  pedra: ['#0e0c12', '#1a161e', '#28222e', '#383040', '#4c4256', '#665a70', '#86788e'],
  icor: ['#3a2004', '#6a3e08', '#a06810', '#d89a20', '#ffcc4a', '#ffe890', '#fffad8'],
  liquen: ['#141a14', '#22301e', '#34482c', '#4c6640', '#6c8a5a', '#9cb88a', '#d0e8c0'],
  ferr: ['#1a0a04', '#2e1408', '#4a2210', '#6a3418', '#8a4a22', '#a86a3a', '#c88a5a']
};
for (const k in DRP) DRP[k] = RX(DRP[k]);
const FE = DRP.ferro, BR = DRP.bronze;
function sprCanvas(a, w = T, h = T) { const c = mk(w, h), x = c.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(a); x.putImageData(img, 0, 0); return c; }
// um elo de frente (anel oval) desenhado num sprite: centro (cx, cy), raios (rx, ry), espessura th
function eloFrente(a, cx, cy, rx, ry, th, R = FE) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy), di = Math.hypot((x + 0.5 - cx) / Math.max(0.5, rx - th), (y + 0.5 - cy) / Math.max(0.5, ry - th));
    if (d <= 1 && di > 1) a.put(x, y, R, 4 - (dx * 0.6 + dy * 0.8) * 1.6 + (d > 0.85 ? -0.8 : 0) + (di < 1.25 ? (dx + dy > 0 ? 0.6 : -0.9) : 0) + cg(x, y, 39501) * 0.4);
  }
}
/* a corrente de subir: elos grandes de ferro, um de frente e um de lado; o de lado e o de frente se alternam pela linha,
   então a corrente fica contínua por qualquer altura. A ponta de baixo é um elo partido */
function correnteSprite(ph, end) {
  const a = spr();
  if (ph === 0) {
    eloFrente(a, 6, 4.5, 3.4, 4.6, 1.4);
    if (!end) for (let y = 8; y < 12; y++) { a.put(5, y, FE, 4.6); a.put(6, y, FE, 3.2); a.put(7, y, FE, 1.8); }
  } else {
    for (let y = 0; y < (end ? 6 : 12); y++) { a.put(5, y, FE, 4.8); a.put(6, y, FE, 3.4); a.put(7, y, FE, 2); }
    if (!end) eloFrente(a, 6, 7.5, 3.4, 4.6, 1.4);
    else { eloFrente(a, 6, 8.5, 3.2, 3.6, 1.3); a[10 * T + 8] = 0; a[11 * T + 8] = 0; a[11 * T + 7] = 0; }   // o elo partido
  }
  for (let i = 0; i < 4; i++) { const x = 3 + (hash2(ph, i, 39502) * 6 | 0), y = (hash2(ph, i, 39503) * 12) | 0; if (a[y * T + x]) a.put(x, y, DRP.ferr, 3 + (i & 1)); }   // ferrugem
  return rimOut(a, FE[0], false);
}
const CORRENTE = [correnteSprite(0, false), correnteSprite(1, false), correnteSprite(0, true), correnteSprite(1, true)];
/* a escada de ferro: dois grampos em U cravados na pedra (o ferro gasto em cima, onde a mão pega), com o cravo de cada lado */
function escadaSprite(top) {
  const a = spr();
  for (const ry of top ? [7] : [2, 8]) {
    for (let x = 2; x <= 9; x++) { a.put(x, ry, FE, x < 4 ? 5.6 : 4.8 - (x - 4) * 0.15); a.put(x, ry + 1, FE, 2.2); }
    for (const sx of [2, 9]) { a.put(sx, ry - 1, FE, 4); a.put(sx, ry + 2, FE, 2.6); }
    a.put(1, ry, FE, 1.5); a.put(10, ry, FE, 1.2); a.put(1, ry + 1, FE, 0.8); a.put(10, ry + 1, FE, 0.6);   // os cravos
    a.put(5 + (ry & 1), ry, FE, 6);
  }
  return rimOut(a, FE[0], false);
}
const ESCADA = [escadaSprite(false), escadaSprite(true)];
/* a grade torta das celas: barras de ferro em pé presas no chão e no teto; v 0 reta, v 1 duas abertas para fora, v 2
   uma partida (a de baixo dobrada) */
function gradeSprite(v) {
  const a = spr();
  for (const bx of [1, 5, 9]) {
    for (let y = 0; y < 12; y++) {
      let ox = 0;
      if (v === 1 && bx !== 9) ox = Math.round(Math.sin(y / 11 * Math.PI) * 1.6) * (bx === 1 ? -1 : 1);
      if (v === 2 && bx === 5 && y >= 5 && y <= 6) continue;
      if (v === 2 && bx === 5 && y > 6) ox = Math.round((y - 6) * 0.6);
      a.put(bx + ox, y, FE, 4.4 + cg(bx, y, 39511) * 0.6); a.put(bx + ox + 1, y, FE, 2.4);
    }
  }
  for (let x = 0; x < 12; x++) { a.put(x, 3, FE, x === 0 ? 5 : 3.8); a.put(x, 4, FE, 1.8); }
  if (v === 2) { a.put(5, 4, FE, 4.8); a.put(6, 7, DRP.ferr, 3); }
  return rimOut(a, FE[0], false);
}
const GRADE = [gradeSprite(0), gradeSprite(1), gradeSprite(2)];
/* a argola: dois elos curtos presos no teto e o aro grande de bronze escuro pendurado */
function argolaSprite() {
  const a = spr();
  for (let x = 4; x <= 7; x++) { a.put(x, 0, FE, 4.6 - (x - 4) * 0.4); a.put(x, 1, FE, 2.4); }
  eloFrente(a, 6, 3.2, 1.8, 2.2, 1);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = Math.hypot(x + 0.5 - 6, y + 0.5 - 8.4); if (d < 3.4 && d > 2.1) a.put(x, y, BR, 4 - ((x - 6) * 0.6 + (y - 8.4) * 0.8) * 0.6 + cg(x, y, 39521) * 0.4); }
  return rimOut(a, FE[0], false);
}
const ARGOLA = [argolaSprite()];
/* os ossos: v 0 um crânio de lado e dois ossos longos; v 1 a caixa de costelas desabada */
function ossosSprite(v) {
  const a = spr(), O = DRP.osso;
  if (v === 0) {
    for (let y = 6; y < 11; y++) for (let x = 1; x < 7; x++) { const d = Math.hypot((x + 0.5 - 4) / 3, (y + 0.5 - 8.4) / 2.6); if (d < 1) a.put(x, y, O, 4.4 - (x - 4) * 0.4 - (y - 8) * 0.4); }
    a.put(2, 8, O, 0.6); a.put(3, 8, O, 0.4); a.put(5, 10, O, 1); a.put(4, 10, O, 3.4);
    for (let x = 6; x <= 11; x++) { a.put(x, 10, O, 4.2 - (x - 6) * 0.2); a.put(x, 11, O, 2.2); }
    a.put(6, 9, O, 4.6); a.put(11, 9, O, 4);
    for (let k = 0; k < 5; k++) a.put(7 + k, 8 - (k >> 1), O, 3.6);
  } else {
    for (let k = 0; k < 5; k++) { const x = 2 + k * 2; for (let y = 6 + (k & 1); y < 11; y++) a.put(x + ((y - 6) >> 2), y, O, 4.4 - (y - 6) * 0.3); }
    for (let x = 1; x <= 11; x++) { a.put(x, 11, O, 3.8 - x * 0.12); }
  }
  return rimOut(a, O[0]);
}
const OSSOS = [ossosSprite(0), ossosSprite(1)];
/* o grilhão aberto no chão: a meia-lua de ferro aberta, o pino solto, três elos saindo */
function grilhaoSprite() {
  const a = spr();
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = Math.hypot(x + 0.5 - 4, y + 0.5 - 8); if (d < 3.6 && d > 2.2 && y < 10) a.put(x, y, FE, 4.2 - ((x - 4) * 0.6 + (y - 8) * 0.8) * 0.6); }
  for (let x = 0; x <= 8; x++) { a.put(x, 11, FE, 3.6 - x * 0.2); }
  for (const [x, y] of [[7, 10], [8, 10], [9, 10], [10, 11], [11, 11]]) a.put(x, y, FE, 3.8);
  a.put(8, 9, FE, 5); a.put(9, 9, DRP.ferr, 3);
  return rimOut(a, FE[0]);
}
const GRILHAO = [grilhaoSprite()];
/* a gota de ícor: o sangue dourado dos deuses presos escorrendo de uma racha no teto; a gota da ponta cresce e cai
   (ao vivo); a racha e a mancha são do sprite */
const ICOR_TIP = [6, 9];
function icorSprite() {
  const a = spr(), I = DRP.icor;
  for (let x = 3; x <= 8; x++) a.put(x, 0, DRP.pedra, 2 - Math.abs(x - 5.5) * 0.3);
  for (let y = 0; y <= 8; y++) { const w = y < 3 ? 2 : y < 6 ? 1.4 : 1; for (let x = Math.round(6 - w); x <= Math.round(5 + w); x++) a.put(x, y, I, 5.4 - y * 0.25 - (x - 5) * 0.4); }
  a.put(6, 9, I, 6); a.put(5, 9, I, 5);
  return rimOut(a, I[0], false);
}
const ICOR = [icorSprite()];
/* a poça de ícor: a mancha dourada no chão, mais clara no meio, com a borda seca escura */
function pocaSprite(v) {
  const a = spr(), I = DRP.icor, w = v ? 4.6 : 3.6;
  for (let x = 0; x < 12; x++) { const u = (x + 0.5 - 6) / w; if (Math.abs(u) > 1) continue; const lit = 1 - u * u; a.put(x, 11, I, 3 + lit * 2.6); if (lit > 0.5) a.put(x, 10, I, 4 + lit * 1.5); }
  a.put(5, 10, I, 6.4);
  return rimOut(a, I[1]);
}
const POCA = [pocaSprite(0), pocaSprite(1)];
/* a estalactite de pedra: v 0 uma longa, v 1 duas curtas */
function estalacSprite(v) {
  const a = spr(), P = DRP.pedra, list = v ? [[3.5, 6, 1.8], [8, 4, 1.4]] : [[6, 10, 2.4]];
  for (const [cx, len, w0] of list) for (let y = 0; y < len; y++) { const w = w0 * (1 - y / len); for (let x = Math.floor(cx - w); x <= cx + w; x++) a.put(x, y, P, 4 - (x - cx) / Math.max(0.5, w) * 1.5 - y * 0.12); }
  return rimOut(a, P[0], false);
}
const ESTALAC = [estalacSprite(0), estalacSprite(1)];
/* o líquen pálido: fios curtos pendurados do teto, a ponta clara (acende fraco, verde-branco) */
function liquenSprite(v) {
  const a = spr(), L = DRP.liquen;
  for (let x = 1; x < 11; x++) a.put(x, 0, L, 3 + cg(x, v, 39531) * 2);
  for (let k = 0; k < 6; k++) { const x = 1 + ((k * 2 + v) % 10), len = 2 + ((hash2(k, v, 39532) * 6) | 0); for (let y = 1; y <= len; y++) a.put(x, y, L, 3 + y / len * 2.6); }
  return rimOut(a, L[0], false);
}
const LIQUEN = [liquenSprite(0), liquenSprite(1)];
/* os elos soltos: um montinho de elos de ferro no chão */
function elosSprite() {
  const a = spr();
  eloFrente(a, 4, 9, 3, 2.2, 1.2); eloFrente(a, 8.5, 9.6, 2.6, 2, 1.1); eloFrente(a, 6.4, 7.2, 2.2, 1.8, 1);
  for (let x = 0; x < 12; x++) if (!a[11 * T + x] && x > 1 && x < 11) a.put(x, 11, FE, 1.6);
  return rimOut(a, FE[0]);
}
const ELOS = [elosSprite()];
/* a grade de bronze das portas do chefe: barras grossas em pé, a travessa, pontas de lança em cima */
function barreiraSprite() {
  const a = spr();
  for (const bx of [1, 5, 9]) for (let y = 0; y < 12; y++) { a.put(bx, y, BR, 5.4); a.put(bx + 1, y, BR, 3.6); a.put(bx + 2, y, BR, 2); }
  for (let x = 0; x < 12; x++) { a.put(x, 5, BR, x === 0 ? 6 : 4.4); a.put(x, 6, BR, 2.4); }
  return a;
}
const BARREIRA = [barreiraSprite()];

DECO[PD_CORRENTE] = CORRENTE; DECO[PD_ESCADA] = ESCADA; DECO[PD_GRADE] = GRADE; DECO[PD_ARGOLA] = ARGOLA; DECO[PD_OSSOS] = OSSOS; DECO[PD_GRILHAO] = GRILHAO;
DECO[PD_ICOR] = ICOR; DECO[PD_POCA] = POCA; DECO[PD_ESTALAC] = ESTALAC; DECO[PD_LIQUEN] = LIQUEN; DECO[PD_ELOS] = ELOS;
// a grade de bronze: sólida mas vazada; não quebra
DECO[PD_BARREIRA] = BARREIRA; MAT[PD_BARREIRA] = [PALS.pdBronze, BKP.grade]; SOLID[PD_BARREIRA] = 1; BLOCKY[PD_BARREIRA] = 0; SEETHRU[PD_BARREIRA] = 1; DIG[PD_BARREIRA] = 0; PCOL[PD_BARREIRA] = '#c09a48';
const PD_DECO = [
  // id, dureza, cor no mapa
  [PD_CORRENTE, 0.3, '#55555f'], [PD_ESCADA, 0.4, '#55555f'], [PD_GRADE, 0.5, '#3a3a44'], [PD_ARGOLA, 0.3, '#98702c'], [PD_OSSOS, 0.2, '#a09078'], [PD_GRILHAO, 0.3, '#55555f'],
  [PD_ICOR, 0.1, '#ffcc4a'], [PD_POCA, 0.05, '#d89a20'], [PD_ESTALAC, 0.4, '#383040'], [PD_LIQUEN, 0.05, '#6c8a5a'], [PD_ELOS, 0.2, '#3a3a44']
];
for (const [t, dig, col] of PD_DECO) { DIG[t] = dig; PCOL[t] = col; }
EMIT[PD_ICOR] = 0.55; EMIT[PD_POCA] = 0.4; EMIT[PD_LIQUEN] = 0.12;
// o que cai quando o apoio some (56, 87); corrente, escada e grade ficam
for (const t of [PD_ARGOLA, PD_ICOR, PD_ESTALAC, PD_LIQUEN]) CV_HANGS[t] = 1;
for (const t of [PD_OSSOS, PD_GRILHAO, PD_POCA, PD_ELOS]) CV_STANDS[t] = 1;
if (ITEMS.icor_divino) { BLOCK_DROP[PD_ICOR] = 'icor_divino'; BLOCK_DROP[PD_POCA] = 'icor_divino'; }

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[PD_CORRENTE] = (gx, gy, arr) => arr[(gy & 1) + (tileAt(gx, gy + 1) === PD_CORRENTE ? 0 : 2)];
DECO_PICK[PD_ESCADA] = (gx, gy, arr) => arr[tileAt(gx, gy - 1) !== PD_ESCADA && !solidAt(gx, gy - 1) ? 1 : 0];
DECO_PICK[PD_GRADE] = (gx, gy, arr) => arr[vr(gx, gy >> 2, 39541, 3)];
DECO_PICK[PD_OSSOS] = (gx, gy, arr) => arr[vr(gx, gy, 39542, 2)];
DECO_PICK[PD_POCA] = (gx, gy, arr) => arr[vr(gx, gy, 39543, 2)];
DECO_PICK[PD_ESTALAC] = (gx, gy, arr) => arr[vr(gx, gy, 39544, 2)];
DECO_PICK[PD_LIQUEN] = (gx, gy, arr) => arr[vr(gx, gy, 39545, 2)];
DECO_PICK[PD_BARREIRA] = (gx, gy, arr) => arr[0];

// a corrente e a escada de ferro contam como a corrente da catedral (subir) e a escada como a da mina (a pose)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, PD_CORRENTE) || _tt(e, PD_ESCADA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, PD_ESCADA)); }; }

/* ================= ao vivo: o ícor pingando, as runas, os veios da pedra viva, as fendas, o líquen ================= */
const PD_GL = {};
const pdGlow = (k, r, col) => PD_GL[k] || (PD_GL[k] = glow(r, col));
const pdOut = cy => cy + VH < (PD_S0 - 6) * T || cy > (PD_S0 + PD_D + 6) * T;
// a respiração da pedra viva e das runas: devagar, 5 s por volta; cada bloco no seu tempo (uma onda que anda)
const pdBreath = (tm, gx, gy) => 0.5 - 0.5 * Math.cos(tm * 1.2566 + (gx * 0.31 + gy * 0.17));
HOOK.drawGlow.push((cx, cy) => {
  if (pdOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < PD_ROCHA || t > PD_ELOS) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case PD_ICOR: lc.globalAlpha = 0.24; lc.drawImage(pdGlow('ib', 26, '#ffb030'), x + 6 - 26, y + 6 - 26); lc.globalAlpha = 0.35; lc.drawImage(pdGlow('is', 7, '#fff0b0'), x + 6 - 7, y + 9 - 7); break;
      case PD_POCA: lc.globalAlpha = 0.2; lc.drawImage(pdGlow('pb', 18, '#ffb030'), x + 6 - 18, y + 11 - 18); break;
      case PD_RUNA: { if ((gx + gy) & 1) break; const b = pdBreath(tm, gx, gy); lc.globalAlpha = 0.06 + b * 0.1; lc.drawImage(pdGlow('r12', 12, '#5ab0e8'), x + 6 - 12, y + 6 - 12); break; }
      case PD_PEDRA_VIVA: { if ((gx * 7 + gy * 3) % 4) break; const b = pdBreath(tm, gx, gy); if (b < 0.4) break; lc.globalAlpha = (b - 0.4) * 0.16; lc.drawImage(pdGlow('v12', 12, '#d0402a'), x + 6 - 12, y + 6 - 12); break; }
      case PD_FENDA: if ((gx + gy * 3) % 3) break; lc.globalAlpha = 0.12; lc.drawImage(pdGlow('f14', 14, '#8a5ad8'), x + 6 - 14, y + 6 - 14); break;
      case PD_LIQUEN: lc.globalAlpha = 0.08; lc.drawImage(pdGlow('l8', 8, '#c8f0b0'), x + 6 - 8, y + 4 - 8); break;
      case PD_O_FERRO: lc.globalAlpha = 0.07; lc.drawImage(pdGlow('o10', 10, '#d8b060'), x + 6 - 10, y + 6 - 10); break;
    }
  }
  lc.globalAlpha = 1;
});
const pxList = (x, y, a, col, al) => { lc.globalAlpha = al; lc.fillStyle = col; for (let k = 0; k < a.length; k += 2) lc.fillRect(x + a[k], y + a[k + 1], 1, 1); };
HOOK.drawTop.push((cx, cy) => {
  if (pdOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== PD_ICOR && t !== PD_RUNA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === PD_RUNA) { const b = pdBreath(tm, gx, gy); if (b > 0.35) pxList(x, y, RUNA_PX[runaK(wrapX(gx) % 20, gy % 20)], '#b8e8ff', (b - 0.35) * 0.8); continue; }
    // a gota cresce na ponta (2 s) e cai até o chão; cada gota no seu tempo
    const ph0 = (tm * 0.4 + hash2(wrapX(gx), gy, 39601)) % 1;
    if (ph0 < 0.7) { lc.globalAlpha = 0.6 + ph0 * 0.5; lc.fillStyle = '#fff0b0'; lc.fillRect(x + ICOR_TIP[0], y + ICOR_TIP[1] + 1, 1, ph0 > 0.45 ? 2 : 1); }
    else { const k = (ph0 - 0.7) / 0.3, fy = y + 11 + k * k * 46; lc.globalAlpha = 1 - k * 0.5; lc.fillStyle = '#ffcc4a'; lc.fillRect(x + ICOR_TIP[0], Math.round(fy), 1, 2); }
  }
  lc.globalAlpha = 1;
});
Object.assign(PDART, { cg, cn, cells, dPix, spr, rimOut, pp, wrapT, RX, sprCanvas, eloFrente, DRP, VIVA, FENDA, RUNA, FERR, PATINA, RUNAS, runaAt, RUNA_PX, pdGlow, pdOut, pdBreath,
  vRocha, vAlvenaria, vViva, vElo, vBronze, vTartaro, vFenda, vLaje, vRuna, BKP, CORRENTE, ESCADA, GRADE, ARGOLA, OSSOS, GRILHAO, ICOR, POCA, ESTALAC, LIQUEN, ELOS, BARREIRA });
}
