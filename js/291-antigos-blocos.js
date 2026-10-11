'use strict';

/* ================= a Cidade dos Antigos: blocos, paredes, terceira camada, minérios, decoração, o brilho =================
   Uma cidade medida com régua. A pedra lisa cinza-azulada sem emenda, com um brilho fosco em faixas largas; a laje dos
   Antigos em blocos perfeitos de 24 x 12 com a junta fina e reta caindo sempre na beira do bloco; a laje de glifo com a
   faixa rebaixada e os glifos ciano acesos; o conduto de luz (o cano de liga com o canal de vidro e a luz correndo); o
   bloco de engrenagem (uma engrenagem de pedra de oito dentes encaixada em cada bloco, uma sim, outra meio dente
   girada, como se engrenassem); a chapa antiga verde-cinza escovada, com a canaleta gravada e sem rebite; o ladrilho
   de prumo quadriculado (qualquer lado pode ser o chão). A rocha fria é a única coisa natural e áspera da camada.
   Na Cratera, o vidro preto com o reflexo verde em riscas diagonais e as faces de fratura, e a rocha fundida preta
   com os veios brancos da estrela. O ferro estelar: lascas violeta-prata facetadas com pontinhos brancos que piscam.
   Como o 251, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda acesa e
   oclusão vêm do 07. Paredes e terceira camada só leem o tom (.v). A decoração de 1 bloco são sprites de 12x12 em
   rampas de 7 tons, luz de cima à esquerda. Toda luz é fria (ciano dos glifos, branco da estrela) e tudo que pulsa
   pulsa junto, no compasso único de AT_BEAT segundos (atPulse); nada pisca à toa. Ao vivo, só sobre o que está na tela:
   o pulso que corre nos condutos, os glifos, a lâmpada, o fio que vibra, os cubos que flutuam, a poeira que sobe, as
   estrelinhas do ferro estelar e das lascas, a grade de luz e as setas de prumo. Ids: 290. */
const ATART = {};   // ferramentas para 292-antigos-objetos, os construtos (293, 294), o Arquiteto (297) e a gravidade (296)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX, flipY } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro (ficha, seção 12) ---- */
pal('atPedra', ['#12161e', '#1e2632', '#2e3a4a', '#46566a', '#6a7e94', '#a4b6c8']);
pal('atLaje', ['#161a20', '#262c36', '#3a4250', '#56606e', '#7c8898', '#b0bccc']);
pal('atRocha', ['#0b0d11', '#14171c', '#1d2128', '#282d35', '#343a44', '#444b56']);
pal('atChapa', ['#141814', '#222a24', '#344038', '#4c5a50', '#6a7c70', '#9cb0a2']);
pal('atVidro', ['#060a08', '#0e1a16', '#183028', '#24483c', '#3e6e5c', '#7ab0a0']);
pal('atFundida', ['#050507', '#0b0c10', '#13151a', '#1c1f26', '#272b33', '#363b45']);
pal('atLadrilho', ['#121822', '#222c3a', '#36445a', '#56687e', '#8698b0', '#c8d8e8']);
pal('atGlifo', ['#0a2a30', '#145058', '#2a8a94', '#4ac8d0', '#9af0f0', '#e8ffff']);
// paredes de fundo: escuras e frias, bem abaixo do chão da frente
pal('atPedraW', ['#05070a', '#080b0f', '#0c1015', '#10151c', '#151b24', '#1c2430']);
pal('atLajeW', ['#06070a', '#0a0c10', '#0e1116', '#13171d', '#191e26', '#21272f']);
pal('atGlifoW', ['#05080a', '#090d10', '#0d1216', '#11181d', '#172026', '#1c3a40']);
pal('atMaquinaW', ['#050706', '#090c0a', '#0d110e', '#121713', '#181f1a', '#1f2822']);
pal('atVidroW', ['#030504', '#060a08', '#0a110e', '#0e1814', '#13201b', '#1b2e26']);
// a terceira camada: a cidade ao longe (tom 5: janelas frias), as máquinas paradas, o clarão da estrela atrás da rocha
pal('dpAtCidade', ['#020305', '#05070b', '#090d13', '#0f141d', '#172030', '#2c3c56']);
pal('dpAtMaquinas', ['#020303', '#050706', '#090c0b', '#0e1311', '#141b18', '#1f2a25']);
pal('dpAtEstrela', ['#030405', '#06080b', '#0b0e14', '#151a25', '#283044', '#5c6a88']);

const wrapT = v => ((v % TP) + TP) % TP;
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
const W2 = Math.PI * 2 / TP;   // senos só com múltiplos inteiros disto: a textura não tem emenda
const RX = hexes => hexes.map(h => ph(h));
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
const GL = PALS.atGlifo;                                                                    // a luz dos glifos (6 tons)
const STAR = RX(['#2a303c', '#4a5262', '#7c8698', '#b8c4d6', '#e4ecf8', '#ffffff']);       // o branco da estrela (veios, lascas)
const MICA = RX(['#8ea2ba', '#c4d2e2']);
// o pontilhado ordenado (Bayer 4x4): as passagens de tom ficam num xadrez fino e regular, de máquina, não em ruído
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => BAY[(y & 3) * 4 + (x & 3)] / 16 - 0.47;

/* o compasso: tudo que pulsa na Cidade pulsa junto. atPulse(t) vai de 0 a 1 e volta a cada AT_BEAT segundos;
   atBeat(t) é a fase (0 a 1) dentro do compasso: as estrelinhas piscam juntas no começo dele */
const AT_BEAT = 2.0;
const atBeat = tm => (tm / AT_BEAT) % 1;
const atPulse = tm => 0.5 - 0.5 * Math.cos(tm * 6.2832 / AT_BEAT);

/* os glifos dos Antigos: 5x5, só retas e ângulos retos (a faixa da laje de glifo, a lâmpada, a parede, os murais) */
const GLYPHS = [
  ['#####', '#...#', '#.#.#', '#...#', '#####'], ['#....', '#....', '#####', '....#', '....#'], ['..#..', '..#..', '#####', '..#..', '..#..'],
  ['#####', '....#', '###.#', '#...#', '#####'], ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#####'], ['#####', '#....', '#####', '....#', '#####'],
  ['###..', '#.#..', '#####', '..#.#', '..###'], ['#.###', '#.#..', '#.###', '#...#', '#####']
];
const glyphAt = (k, x, y) => x >= 0 && y >= 0 && x < 5 && y < 5 && GLYPHS[k][y][x] === '#';

/* ---- o chão sólido ---- */
function vPedra(x, y) {   // pedra lisa: sem emenda, nuvens de tom muito largas, o brilho fosco em faixas diagonais, grão finíssimo, mica
  let v = 3.05 + cn(x, y, 6, 6, 29101) * 1.0 + cn(x, y, 20, 20, 29102) * 0.3 + cg(x, y, 29103) * 0.08 + bay(x, y) * 0.55;
  v += Math.sin((x + y) * W2 * 3 + cn(x, y, 4, 4, 29104) * 2.4) * 0.45;
  if (hash2(x, y, 29105) < 0.0035) { MATX = MICA[hash2(x, y, 29106) < 0.3 ? 1 : 0]; return -9; }
  if (hash2(x, y, 29107) < 0.01) v -= 0.6;
  return v;
}
// laje dos Antigos: blocos de 24 x 12 em fiadas desencontradas meio bloco; a junta cai sempre na beira do bloco
function vLaje(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = (Y / 12) | 0, ly = Y % 12, xx = wrapT(X + (row & 1) * 12), col = (xx / 24) | 0, lx = xx % 24, h = hash2(col, row, 29111);
  if (ly === 11 || lx === 23) return 0.6;                                                                 // a junta
  let v = 3.4 + (h - 0.5) * 0.5 + cn(x, y, 10, 10, 29112) * 0.3 + cg(x, y, 29113) * 0.1 + bay(x, y) * 0.25;
  v += Math.sin((x + y) * W2 * 6) * 0.15;                                                                  // o polido
  if (ly === 0 || lx === 0) v += 0.9; else if (ly === 10 || lx === 22) v -= 0.55;
  if (hash2(x, y, 29114) < 0.004) v += 0.9;
  return v;
}
function vRochaFria(x, y) {   // rocha fria: a única natural, áspera, escura, em placas fraturadas e grão grosso
  let v = 2.5 + cn(x, y, 20, 20, 29121) * 1.6 + cn(x, y, 60, 60, 29122) * 0.7 + cg(x, y, 29123) * 0.8;
  const k = cells(x, y, 10, 29124, 1.2), e = k.d2 - k.d1;
  if (e < 0.9) v -= 1.5; else { v += -(k.ox + k.oy) * 0.08 + (k.id - 0.5) * 0.8; if (e < 1.8) v += k.ox + k.oy < 0 ? 0.5 : -0.3; }
  const f = Math.abs(cn(x, y, 14, 14, 29125)); if (f < 0.01) v -= 1.6; else if (f < 0.018) v -= 0.5;
  if (hash2(x, y, 29126) < 0.04) v -= 1.1; else if (hash2(x, y, 29127) < 0.02) v += 1.0;
  return v;
}
/* laje de glifo: uma pedra por bloco; nas linhas 2 a 9 a faixa rebaixada corre de um bloco ao outro sem junta, com o
   filete ciano em cima e embaixo e um glifo aceso no meio (o glifo de cada bloco sai de glifoK) */
const glifoK = (bx, by) => (hash2(bx, by, 29131) * GLYPHS.length) | 0;
const GLIFO_X = 3, GLIFO_Y = 4;
function vGlifo(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 12, ly = Y % 12, bx = (X / 12) | 0, by = (Y / 12) | 0;
  if (ly >= 2 && ly <= 9) {
    if (ly === 2) { MATX = GL[2]; return -9; }
    if (ly === 9) { MATX = GL[1]; return -9; }
    const k = glifoK(bx, by), gx = lx - GLIFO_X, gy = ly - GLIFO_Y;
    if (glyphAt(k, gx, gy)) { MATX = GL[(gx + gy) % 3 === 0 ? 4 : 3]; return -9; }
    let v = 1.25 + cg(x, y, 29132) * 0.12 + cn(x, y, 12, 12, 29133) * 0.2;
    if (ly === 3) v -= 0.45;                                                                               // o alto do rebaixo, na sombra
    if (glyphAt(k, gx - 1, gy) || glyphAt(k, gx + 1, gy) || glyphAt(k, gx, gy - 1) || glyphAt(k, gx, gy + 1)) v += 0.75;   // o glifo acende a pedra em volta
    return v;
  }
  if (ly === 11 || lx === 11) return 0.6;
  let v = 3.4 + (hash2(bx, by, 29134) - 0.5) * 0.4 + cn(x, y, 10, 10, 29135) * 0.3 + cg(x, y, 29136) * 0.1 + bay(x, y) * 0.25;
  if (ly === 0 || lx === 0) v += 0.9; else if (ly === 10 || lx === 10) v -= 0.55;
  if (ly === 1) v -= 0.3;
  return v;
}
const GLIFO_PX = GLYPHS.map((g, k) => { const a = []; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (glyphAt(k, x, y)) a.push(GLIFO_X + x, GLIFO_Y + y); return a; });
/* conduto de luz: o cano de chapa (borda de cima acesa, de baixo escura), as vedações escuras, o canal de vidro com a
   luz ciano por dentro, as golas a cada dois blocos; o pulso que corre é ao vivo */
const COND_Y0 = 4, COND_Y1 = 7;
function vConduto(x, y) {
  const X = wrapT(x), Y = wrapT(y), ly = Y % 12, lx = X % 24;
  const collar = lx <= 1 || lx >= 22;
  if (ly >= COND_Y0 && ly <= COND_Y1 && !collar) { const core = ly === 5 || ly === 6; MATX = GL[core ? (X % 6 === 0 ? 4 : 3) : ly === COND_Y0 ? 2 : 1]; return -9; }
  let v = 3.0 + cn(x, y, 4, 60, 29141) * 0.35 + cg(x, y, 29142) * 0.1;
  if (ly === 0) v += 1.1; else if (ly === 1) v += 0.45; else if (ly === 3 || ly === 8) v = 0.9; else if (ly === 11) v -= 1.0; else if (ly >= 9) v -= 0.35;
  if (collar) { v = (lx === 0 ? 4.4 : lx === 1 ? 3.5 : lx === 22 ? 2.3 : 1.3) + cg(x, y, 29143) * 0.1; if (ly === 0) v += 0.6; else if (ly === 11) v -= 0.7; else if (ly === 3 || ly === 8) v -= 0.4; }
  return v;
}
/* bloco de engrenagem: em cada bloco uma engrenagem de pedra de oito dentes num encaixe redondo, o furo do eixo
   quadrado; os blocos vizinhos ficam meio dente girados, como se engrenassem */
function vEngrenagem(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 12, ly = Y % 12, bx = (X / 12) | 0, by = (Y / 12) | 0;
  if (lx === 11 || ly === 11) return 0.6;
  const dx = lx + 0.5 - 5.5, dy = ly + 0.5 - 5.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + ((bx + by) & 1 ? Math.PI / 8 : 0);
  const R = Math.cos(a * 8) > 0 ? 5.25 : 4.05;
  if (d < R) {
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return 0.5;                                                  // o furo do eixo
    let g = 3.7 - (dx + dy) * 0.12 + cg(x, y, 29151) * 0.08;
    if (d > R - 0.95) g += dx + dy < 0 ? 0.9 : -0.9;                                                       // a beira dos dentes
    else if (Math.abs(d - 2.4) < 0.5) g += dx + dy < 0 ? -0.8 : 0.5;                                      // o sulco do cubo
    return g;
  }
  if (d < 5.9) { let v = 1.2 + cg(x, y, 29152) * 0.08; if (dx + dy > 0 && d < R + 1.4) v -= 0.6; return v; }   // o encaixe fundo
  let v = 3.0 + cn(x, y, 10, 10, 29153) * 0.25 + cg(x, y, 29154) * 0.1 + bay(x, y) * 0.2;                                   // a moldura
  if (lx === 0 || ly === 0) v += 0.9; else if (lx === 10 || ly === 10) v -= 0.5;
  return v;
}
/* chapa antiga: placas de 24 x 12 desencontradas, escovadas na horizontal, a canaleta gravada a 2 px da beira */
function vChapa(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = (Y / 12) | 0, ly = Y % 12, xx = wrapT(X + (row & 1) * 12), col = (xx / 24) | 0, lx = xx % 24, h = hash2(col, row, 29161);
  if (ly === 11 || lx === 23) return 0.5;
  let v = 2.95 + (h - 0.5) * 0.35 + cn(x, y, 4, 80, 29162) * 0.55 + cg(x, y, 29163) * 0.08 + (Y & 1 ? -0.07 : 0.07);
  if (ly === 0 || lx === 0) v += 0.9; else if (ly === 10 || lx === 22) v -= 0.5;
  const inR = lx >= 2 && lx <= 20 && ly >= 2 && ly <= 8;
  if (inR && (ly === 2 || ly === 8 || lx === 2 || lx === 20)) v -= 1.05;                                  // a canaleta
  else if ((ly === 3 && lx > 2 && lx < 20) || (lx === 3 && ly > 2 && ly < 8) || (ly === 9 && lx >= 2 && lx <= 20) || (lx === 21 && ly >= 2 && ly <= 8)) v += 0.45;
  return v;
}
/* vidro de cratera: preto e liso, faces de fratura em concha com a aresta acesa, riscas de reflexo verde na diagonal */
function vVidro(x, y) {
  let v = 1.7 + cn(x, y, 4, 4, 29171) * 1.1 + cn(x, y, 12, 12, 29172) * 0.45 + cg(x, y, 29173) * 0.07;
  const c = cells(x, y, 30, 29174, 1), e = c.d2 - c.d1;
  if (e < 0.8) return c.ox + c.oy < 0 ? 3.7 : 0.5;                                                       // a aresta da fratura
  if (e < 2) v += c.ox + c.oy < 0 ? 0.7 : -0.4;
  v += (c.id - 0.5) * 0.7 - (c.ox + c.oy) * 0.025;
  const s = Math.sin((x - y) * W2 * 8 + cn(x, y, 6, 6, 29175) * 3);
  if (s > 0.965 && cn(x, y, 10, 10, 29176) > 0.0) v = 4.2 + (s > 0.99 ? 0.8 : 0);                       // o reflexo verde
  else if (s > 0.9) v += 0.5;
  if (hash2(x, y, 29177) < 0.002) v = 5;
  return v;
}
/* rocha fundida: preta, granulada, em placas, rachada pelos veios brancos da estrela (o miolo branco, a beira cinza) */
function vFundida(x, y) {
  let v = 1.9 + cn(x, y, 10, 10, 29181) * 1.0 + cg(x, y, 29182) * 0.45;
  const k = cells(x, y, 14, 29183, 1); v += -(k.ox + k.oy) * 0.04 + (k.id - 0.5) * 0.5; if (k.d2 - k.d1 < 0.8) v -= 0.9;
  const wx = wrapT(x + cn(x, y, 8, 8, 29184) * 50), wy = wrapT(y + cn(x, y, 8, 8, 29185) * 50), vein = Math.abs(cn(wx, wy, 5, 5, 29186)), v2 = Math.abs(cn(wx, wy, 12, 12, 29187));
  if (vein < 0.006) { MATX = STAR[vein < 0.0025 ? 5 : 4]; return -9; }
  if (vein < 0.0105) { MATX = STAR[vein < 0.008 ? 2 : 1]; return -9; }
  if (v2 < 0.0045) { MATX = STAR[v2 < 0.002 ? 4 : 3]; return -9; }                                     // os veios finos
  if (v2 < 0.008) { MATX = STAR[1]; return -9; }
  if (vein < 0.02 || v2 < 0.013) v += 0.7;
  return v;
}
/* ladrilho de prumo: quadriculado de 6 px (dois por bloco), rejunte fino, o claro e o escuro alternados, bisel de cima à esquerda */
function vLadrilho(x, y) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 6, ly = Y % 6, q = (((X / 6) | 0) + ((Y / 6) | 0)) & 1;
  if (lx === 5 || ly === 5) return 1.0;
  let v = (q ? 4.1 : 2.6) + cg(x, y, 29191) * 0.12 + cn(x, y, 10, 10, 29192) * 0.25;
  if (lx === 0 || ly === 0) v += 0.55; else if (lx === 4 || ly === 4) v -= 0.4;
  if (q && lx === 2 && ly === 2) v += 0.5;                                                                 // o ponto de mira no claro
  return v;
}
function vGrade(x, y) {   // a grade de luz (ícone e mapa): barras em pé e deitadas
  const X = wrapT(x), Y = wrapT(y); return 1.0 + (X % 4 === 1 ? 2.6 : 0) + (Y % 6 === 3 ? 2.2 : 0) + cg(x, y, 29195) * 0.3;
}

/* ---- paredes de fundo (só o tom) ---- */
function vPedraW(x, y) { return 2.8 + cn(x, y, 6, 6, 29201) * 1.0 + Math.sin((x + y) * W2 * 3 + cn(x, y, 4, 4, 29202) * 2) * 0.4 + cg(x, y, 29203) * 0.08 + bay(x, y) * 0.5; }
// placas grandes de 24 x 24 com a junta fina (a laje e a parede de glifo)
function lajeSlab(x, y, s) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 24, ly = Y % 24, h = hash2((X / 24) | 0, (Y / 24) | 0, s);
  if (lx === 23 || ly === 23) return 0.5;
  let v = 2.8 + (h - 0.5) * 0.45 + cn(x, y, 12, 12, s + 1) * 0.3 + cg(x, y, s + 2) * 0.14;
  if (lx === 0 || ly === 0) v += 0.8; else if (lx === 22 || ly === 22) v -= 0.5;
  return v;
}
const vLajeW = (x, y) => lajeSlab(x, y, 29211);
function vGlifoW(x, y) {   // glifos gravados em dobro (10 x 10) no meio de metade das placas: o sulco escuro, a beira de baixo acesa
  const v = lajeSlab(x, y, 29221), X = wrapT(x), Y = wrapT(y), h = hash2((X / 24) | 0, (Y / 24) | 0, 29221);
  if (h > 0.55) return v;
  const k = (h * 40 | 0) % GLYPHS.length, gx = (X % 24) - 7, gy = (Y % 24) - 7, at = (a, b) => a >= 0 && b >= 0 && glyphAt(k, a >> 1, b >> 1) && a < 10 && b < 10;
  if (at(gx, gy)) return h < 0.07 ? 4.6 : 1.0;                                                             // umas poucas ainda guardam um resto de luz
  if (at(gx - 1, gy) || at(gx, gy - 1)) return v + 0.7;
  return v;
}
/* a máquina: um eixo em pé a cada 48 px (cilindro com golas), entre eles painéis de 40 x 24 com moldura gravada e frisos */
function vMaquinaW(x, y) {
  const X = wrapT(x), Y = wrapT(y), cx = X % 48;
  if (cx >= 20 && cx < 28) {
    const q = (cx + 0.5 - 24) / 4, cy = Y % 24; let v = 3.0 - q * 1.3 - q * q * 0.9 + cg(x, y, 29231) * 0.1;
    if (cy < 3) v = (cy === 0 ? 3.9 : cy === 1 ? 3.2 : 1.6) - q * 0.9;                                     // a gola
    return v;
  }
  const px = (cx + 20) % 48, py = Y % 24;
  if (px === 0 || py === 0) return 0.7;
  let v = 2.4 + cn(x, y, 10, 10, 29232) * 0.3 + cg(x, y, 29233) * 0.12;
  if (px === 1 || py === 1) v += 0.6; else if (px === 39 || py === 23) v -= 0.5;
  const fr = (px === 4 || px === 35) && py >= 4 && py <= 19 || (py === 4 || py === 19) && px >= 4 && px <= 35;
  if (fr) v -= 0.9; else if ((px === 5 || py === 5) && px > 4 && px < 35 && py > 4 && py < 19) v += 0.4;
  if (py >= 8 && py <= 15 && (py & 1) === 0 && px >= 10 && px <= 29) v -= 1.0;                              // os frisos
  return v;
}
function vVidroW(x, y) {   // vidro fosco: manchas macias, grão de gelo, uma risca diagonal apagada
  let v = 2.4 + cn(x, y, 6, 6, 29241) * 1.2 + cn(x, y, 16, 16, 29242) * 0.4 + cg(x, y, 29243) * 0.3;
  if (Math.sin((x - y) * W2 * 8 + cn(x, y, 6, 6, 29244) * 3) > 0.97) v += 0.9;
  return v;
}

/* ---- a terceira camada ---- */
/* a cidade ao longe: uma laje de teto e uma de chão a cada 240 px; torres em pé no chão (topo em degraus, janelas),
   torres iguais penduradas de cabeça para baixo do teto, e uma torre deitada no vão do meio */
function dpTower(lx, d, hw, h, s, x, y) {   // lx: distância ao eixo, d: distância à base; devolve o tom ou -1
  const step = d >= h - 3 ? 2 : d >= h - 7 ? 1 : 0, w = hw - step * 2;
  if (d < 0 || d >= h || Math.abs(lx) >= w) return -1;
  let v = 2.3 - lx / w * 0.5 + cg(x, y, s) * 0.1 + bay(x, y) * 0.3;
  if (lx < -w + 1.2) v = 3.3; else if (lx > w - 1.2) v = 1.4;
  if (d === h - 1 || d === h - 4 || d === h - 8) v = lx < 0 ? 3.6 : 3.0;                                   // os degraus do topo, acesos
  const wy = d % 6, wx = ((lx + 64) | 0) % 4;
  if (d > 3 && d < h - 9 && Math.abs(lx) < w - 2 && wy >= 2 && wy <= 3 && wx === 1) v = hash2(((lx + 64) | 0) >> 2, (d / 6) | 0, s + 1) < 0.22 ? 4.7 : 1.1;   // as janelas
  return v;
}
function vDpCidade(x, y) {
  const X = wrapT(x), Y = wrapT(y);
  let v = 0.5 + cn(x, y, 10, 10, 29301) * 0.4 + cg(x, y, 29302) * 0.1;
  if (Y >= 14 && Y < 22) return Y === 21 ? 1.2 : 2.0 + (Y === 14 ? 0.8 : 0) + cg(x, y, 29303) * 0.1;        // a laje do teto
  if (Y >= 206 && Y < 214) return Y === 206 ? 2.8 : 1.8 + cg(x, y, 29304) * 0.1;                           // a laje do chão
  const k = (X / 48) | 0, cxU = k * 48 + 24 + (hash2(k, 0, 29305) - 0.5) * 10, hwU = 8 + hash2(k, 1, 29305) * 8, hU = 40 + hash2(k, 2, 29305) * 80;
  const up = dpTower(X + 0.5 - cxU, 205 - Y, hwU, hU, 29306, x, y); if (up >= 0) return up;
  const k2 = (wrapT(X + 24) / 48) | 0, cxD = k2 * 48 + (hash2(k2, 3, 29305) - 0.5) * 8, hwD = 6 + hash2(k2, 4, 29305) * 6, hD = 26 + hash2(k2, 5, 29305) * 46;
  const dn = dpTower(wrapD(X + 0.5 - cxD), Y - 22, hwD, hD, 29307, x, y); if (dn >= 0) return dn;
  const lyD = Y - 112, lxD = wrapD(X - 150);                                                               // a torre deitada
  if (Math.abs(lyD) < 8 && Math.abs(lxD) < 44) { const v2 = dpTower(lyD + 0.5, lxD + 44, 8, 80, 29308, x, y); if (v2 >= 0) return v2; }
  return v;
}
/* as máquinas ao longe: engrenagens gigantes paradas, aro com dentes, seis raios, o cubo e o furo do eixo */
const DPG = [[64, 74, 46, 14], [176, 164, 58, 18], [22, 196, 26, 10], [204, 32, 24, 9], [120, 6, 18, 8]];
function vDpMaquinas(x, y) {
  let v = 0.5 + cn(x, y, 10, 10, 29311) * 0.4 + cg(x, y, 29312) * 0.1;
  for (const [gx0, gy0, R, n] of DPG) {
    const dx = wrapD(x - gx0), dy = wrapD(y - gy0), d = Math.hypot(dx, dy); if (d > R + 5) continue;
    const a = Math.atan2(dy, dx), Ro = Math.cos(a * n) > 0.05 ? R + 4 : R; if (d > Ro) continue;
    const lit = -(dx + dy) / (d + 0.01) * 0.55;
    if (d > R - 6) return (d < R - 5 ? 1.3 : d > R ? 2.4 : 2.9) + lit + cg(x, y, 29313) * 0.12;            // o aro e os dentes
    if (d < 9) return d < 4 ? 0.3 : (d > 8 ? 1.6 : 3.0 + lit);                                             // o cubo e o furo
    const ka = Math.round(a * 6 / 6.2832), sd = d * Math.abs(Math.sin(a - ka * 6.2832 / 6));
    if (sd < 3) return 2.3 + lit + (sd > 2 ? -0.7 : 0) + cg(x, y, 29314) * 0.1;                             // os raios
    return 0.25 + cg(x, y, 29315) * 0.1;                                                                    // o vão, mais fundo
  }
  return v;
}
/* o clarão da estrela: a rocha em placas grandes na frente, a luz branca vazando pelas rachaduras e acendendo as beiras */
function vDpEstrela(x, y) {
  const c = cells(x, y, 60, 29321, 1), e = c.d2 - c.d1, g = 0.8 + cn(x, y, 2, 2, 29322) * 1.0;
  if (e < 1.3) return 3.6 + g * 1.6 + (e < 0.6 ? 0.6 : 0);                                               // a rachadura, com a luz atrás
  const spill = Math.max(0, 1 - e / 10) * (2.6 * g);                                                       // a luz lambendo as beiras
  return Math.max(0.4 + g * 1.5, 1.0 + (c.id - 0.5) * 0.5 - (c.ox + c.oy) * 0.01 + cn(x, y, 12, 12, 29324) * 0.35 + spill) + cg(x, y, 29325) * 0.1 + bay(x, y) * 0.4;
}

/* ---- assar e registrar ---- */
const BKV = {
  pedra: bake(vPedra), laje: bake(vLaje), rocha: bake(vRochaFria), glifo: bake(vGlifo), conduto: bake(vConduto), engrenagem: bake(vEngrenagem), chapa: bake(vChapa),
  vidro: bake(vVidro), fundida: bake(vFundida), ladrilho: bake(vLadrilho), grade: bake(vGrade),
  pedraW: bake(vPedraW), lajeW: bake(vLajeW), glifoW: bake(vGlifoW), maquinaW: bake(vMaquinaW), vidroW: bake(vVidroW),
  dpCidade: bake(vDpCidade), dpMaquinas: bake(vDpMaquinas), dpEstrela: bake(vDpEstrela)
};
const AT_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [AT_PEDRA, 'atPedra', 'pedra', 1.8, '#46566a'], [AT_LAJE, 'atLaje', 'laje', 2.0, '#7c8898'], [AT_ROCHA_FRIA, 'atRocha', 'rocha', 1.6, '#2c313a'],
  [AT_GLIFO, 'atLaje', 'glifo', 2.1, '#4ac8d0'], [AT_CONDUTO, 'atChapa', 'conduto', 1.9, '#4ac8d0'], [AT_ENGRENAGEM, 'atLaje', 'engrenagem', 2.0, '#56606e'],
  [AT_CHAPA, 'atChapa', 'chapa', 2.2, '#4c5a50'], [AT_VIDRO, 'atVidro', 'vidro', 1.9, '#2e4a44'], [AT_FUNDIDA, 'atFundida', 'fundida', 1.8, '#24262e'],
  [AT_LADRILHO, 'atLadrilho', 'ladrilho', 2.0, '#c8d8e8']
];
for (const [t, p, k, dig, col] of AT_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
// só o que é natural (ou derretido) se mistura com o vizinho; o que foi construído tem a beira reta
for (const t of [AT_PEDRA, AT_ROCHA_FRIA, AT_VIDRO, AT_FUNDIDA]) BLEND[t] = 1;
EMIT[AT_GLIFO] = 0.22; EMIT[AT_CONDUTO] = 0.45; EMIT[AT_FUNDIDA] = 0.1;

WMAT[WAT_PEDRA] = [PALS.atPedraW, BKV.pedraW]; WMAT[WAT_LAJE] = [PALS.atLajeW, BKV.lajeW]; WMAT[WAT_GLIFO] = [PALS.atGlifoW, BKV.glifoW];
WMAT[WAT_MAQUINA] = [PALS.atMaquinaW, BKV.maquinaW]; WMAT[WAT_VIDRO] = [PALS.atVidroW, BKV.vidroW];
DMAT[DP_AT_CIDADE] = [PALS.dpAtCidade, BKV.dpCidade]; DMAT[DP_AT_MAQUINAS] = [PALS.dpAtMaquinas, BKV.dpMaquinas]; DMAT[DP_AT_ESTRELA] = [PALS.dpAtEstrela, BKV.dpEstrela];

/* ---- os minérios: carvão na rocha fria, e o ferro estelar: lascas facetadas violeta-prata na rocha fundida, com
   pontinhos brancos de estrela que piscam todos juntos no compasso ---- */
oreRamp(AT_O_ESTELAR, ['#14121e', '#2a2840', '#4a4870', '#7a7ab0', '#b4b8e8', '#f0f4ff', '#ffffff']);
const EST_STAR = new Map();   // semente do bloco -> os pontinhos de estrela [x, y, x, y...]
ORE_PAINT[AT_O_ESTELAR] = function (L, s) {
  const R = ORE_RAMP[AT_O_ESTELAR];
  oreNodes(L, s, R, 29401, [2.7, 0.6], [1.4, 0.4], 6);
  const st = [];
  for (let i = 0; i < 24 && st.length < 4; i++) { const x = 2 + (hash2(s, i, 29402) * 8 | 0), y = 2 + (hash2(s, i, 29403) * 8 | 0); if (L.m[y * 12 + x] && L.l[y * 12 + x] > 1.8) { L.put(x, y, R[6], 9); st.push(x, y); } }
  for (let i = 0; i < 3; i++) { const x = 1 + (hash2(s, i, 29404) * 10 | 0), y = 1 + (hash2(s, i, 29405) * 10 | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[3 + (i & 1)], 1); }   // pó de estrela em volta
  EST_STAR.set(s, st);
};
ORE_HALO[AT_O_ESTELAR] = { pal: ['atFundida', '#6a6ab0', 0.32, 0.12], shade: 0.35 };
ORE_PAINT[AT_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[AT_O_CARVAO] = { pal: ['atRocha', '#020203', 0.5, 0.2], shade: 0 };
// a rocha de cada minério sai da textura já assada (assar de novo custaria um terço de segundo)
const fromBK = B => (x, y) => { const k = y * TP + x; if (B.v[k] === -9) { MATX = B.x[k]; return -9; } return B.v[k]; };
MAT[AT_O_CARVAO] = [PALS.atRocha, bakeOre(AT_O_CARVAO, fromBK(BKV.rocha))]; MAT[AT_O_ESTELAR] = [PALS.atFundida, bakeOre(AT_O_ESTELAR, fromBK(BKV.fundida))];
for (const t of [AT_O_CARVAO, AT_O_ESTELAR]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[AT_O_CARVAO] = DIG[COAL]; ORE_XP[AT_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[AT_O_CARVAO] = ORE_NAME[COAL]; PCOL[AT_O_CARVAO] = PCOL[COAL]; ORE_ITEM[AT_O_CARVAO] = ORE_ITEM[COAL];
DIG[AT_O_ESTELAR] = 1.9; ORE_XP[AT_O_ESTELAR] = 27; ORE_NAME[AT_O_ESTELAR] = 'Ferro Estelar'; PCOL[AT_O_ESTELAR] = '#b4b8e8'; ORE_ITEM[AT_O_ESTELAR] = 'min_ferro_estelar';
EMIT[AT_O_ESTELAR] = 0.28;
const estStars = (gx, gy) => EST_STAR.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + AT_O_ESTELAR * 7919) | 0);

/* ---- itens de bloco ---- */
const AT_ITEMS = {
  pedra_lisa: ['Pedra Lisa', AT_PEDRA, 'Pedra cinza-azulada sem uma emenda. Alguém a poliu até ela parar de parecer pedra.'],
  laje_antiga: ['Laje dos Antigos', AT_LAJE, 'Bloco de ângulos perfeitos. A junta entre duas lajes é tão fina que não passa um fio de cabelo.'],
  rocha_fria: ['Rocha Fria', AT_ROCHA_FRIA, 'Rocha escura e áspera. A única coisa lá embaixo que ninguém mediu.'],
  laje_glifo: ['Laje de Glifo', AT_GLIFO, 'Laje com uma faixa de glifos que ainda acende em ciano. Ninguém sabe o que ela diz.'],
  conduto: ['Conduto de Luz', AT_CONDUTO, 'Tubo de liga antiga. A luz corre por dentro dele no mesmo compasso de sempre.'],
  engrenagem_pedra: ['Bloco de Engrenagem', AT_ENGRENAGEM, 'Uma engrenagem de pedra encaixada na laje. Os dentes não têm um risco de desgaste.'],
  chapa_antiga: ['Chapa Antiga', AT_CHAPA, 'Liga verde-cinza das passarelas, fria e sem um rebite: foi feita inteira, de uma vez.'],
  vidro_cratera: ['Vidro de Cratera', AT_VIDRO, 'Rocha que a estrela derreteu e virou vidro preto. Lá dentro, um reflexo verde.'],
  rocha_fundida: ['Rocha Fundida', AT_FUNDIDA, 'Rocha preta da borda da cratera, rachada de veios brancos que ainda brilham.'],
  ladrilho_prumo: ['Ladrilho de Prumo', AT_LADRILHO, 'Ladrilho quadriculado das Salas de Prumo. Qualquer lado dele pode ser o chão.']
};
for (const id in AT_ITEMS) { const [name, block, desc] = AT_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
// a grade de luz, o bloco em trânsito e a decoração não soltam nada (só a lasca de estrela, o pó estelar do 298)

/* ================= decoração: sprites de 12x12 em rampas de 7 tons ================= */
const DRA = {
  laje: ['#0c0f14', '#1c2129', '#2f3742', '#48525f', '#6a7686', '#94a2b4', '#c6d2e0'],
  pedra: ['#0b0f15', '#172029', '#273342', '#3c4c60', '#5a6e86', '#889eb6', '#bacce0'],
  chapa: ['#0c100d', '#1a221c', '#2c372f', '#435146', '#617266', '#8a9e90', '#b8cabc'],
  glifo: ['#06181c', '#0a2a30', '#145058', '#2a8a94', '#4ac8d0', '#9af0f0', '#e8ffff'],
  estrela: ['#2a303c', '#4a5262', '#7c8698', '#b8c4d6', '#dce6f4', '#f0f4ff', '#ffffff'],
  vidro: ['#040806', '#0e1a16', '#183028', '#24483c', '#3e6e5c', '#7ab0a0', '#bce0d4'],
  estelar: ['#14121e', '#2a2840', '#4a4870', '#7a7ab0', '#b4b8e8', '#f0f4ff', '#ffffff']
};
for (const k in DRA) DRA[k] = RX(DRA[k]);
const LJ = DRA.laje, G7 = DRA.glifo;
// gira um sprite 90° no sentido do relógio (na tela): baixo vira esquerda, esquerda vira cima
const rot90 = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[(T - 1 - x) * T + y]; return b; };
// um sprite de 12x12 (ou menor) num canvas, para desenhar ao vivo sem alocar nada
function sprCanvas(a, w = T, h = T) { const c = mk(w, h), x = c.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(a); x.putImageData(img, 0, 0); return c; }

/* a escada embutida: dois trilhos de barra quadrada, degraus retos a cada 6 px; no topo a verga com um glifo, no pé as sapatas */
function escadaSprite(k) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), y0 = k === 1 ? 2 : 0, y1 = k === 2 ? 9 : 11;
  for (let y = y0; y <= y1; y++) { a.put(1, y, LJ, 5.2); a.put(2, y, LJ, 3.6); a.put(9, y, LJ, 4.4); a.put(10, y, LJ, 2.6); }
  for (const ry of [3, 9]) { if (ry > y1) continue; for (let x = 3; x <= 8; x++) { a.put(x, ry, LJ, 5.6 - (x - 3) * 0.12); a.put(x, ry + 1, LJ, 2.4); } }
  if (k === 1) { for (const x0 of [0, 8]) for (let x = x0; x < x0 + 4; x++) { a.put(x, 0, LJ, x === x0 ? 5.6 : 4.6 - (x - x0) * 0.3); a.put(x, 1, LJ, 2.6); } pp(a, 5, 1, G7[5]); pp(a, 6, 1, G7[4]); }   // os remates e o glifo
  if (k === 2) for (const x0 of [0, 8]) for (let x = x0; x < x0 + 4; x++) { a.put(x, 10, LJ, x === x0 ? 5.2 : 4.2); a.put(x, 11, LJ, 2.4); }
  return rimOut(a, LJ[0], false);
}
const ESCADA = [escadaSprite(0), escadaSprite(1), escadaSprite(2)];
/* a corrente de elos quadrados: um elo de frente (quadrado vazado), o seguinte de lado (barra); a ponta é um prumo */
function correnteSprite(end) {
  const a = spr(), C = DRA.chapa;
  for (let y = 0; y <= 6; y++) for (let x = 3; x <= 8; x++) { if (x !== 3 && x !== 8 && y !== 0 && y !== 6) continue; a.put(x, y, C, x === 3 || y === 0 ? 5.2 : 2.8); }
  pp(a, 3, 0, C[6]);
  if (!end) { a.put(5, 0, C, 4.4); a.put(6, 0, C, 2.4); }                                                // o elo de cima passando
  for (let y = 6; y <= (end ? 8 : 11); y++) { a.put(5, y, C, 4.6); a.put(6, y, C, 2.6); }
  if (end) { for (let y = 9; y <= 11; y++) for (let x = 4; x <= 7; x++) { if (y === 11 && (x === 4 || x === 7)) continue; a.put(x, y, C, (x === 4 ? 5.4 : x === 7 ? 2.4 : 3.8) - (y - 9) * 0.4); } pp(a, 4, 9, C[6]); }   // o prumo
  return rimOut(a, C[0], false);
}
const CORRENTE = [correnteSprite(false), correnteSprite(true)];
/* a lâmpada de glifo: a placa presa no teto, a haste, a caixa quadrada de laje com o vidro ciano e o glifo branco dentro */
const LAMP_PX = [];
function lampadaSprite() {
  const a = spr();
  for (let x = 3; x <= 8; x++) { a.put(x, 0, LJ, 5.2 - (x - 3) * 0.2); a.put(x, 1, LJ, 2.8); }
  for (let y = 2; y <= 3; y++) { a.put(5, y, LJ, 4.6); a.put(6, y, LJ, 2.6); }
  for (let y = 4; y <= 10; y++) for (let x = 2; x <= 9; x++) {
    if (x === 2 || y === 4) a.put(x, y, LJ, 5.4); else if (x === 9 || y === 10) a.put(x, y, LJ, 2.4);
    else { const d = Math.hypot(x + 0.5 - 6, y + 0.5 - 7.5); a.put(x, y, G7, 5.4 - d * 0.75); }
  }
  for (const [x, y] of [[4, 6], [5, 6], [6, 6], [7, 6], [4, 7], [4, 8], [5, 8], [6, 8], [7, 8], [7, 9]]) { pp(a, x, y, G7[6]); LAMP_PX.push(x, y); }
  a.put(5, 11, LJ, 4); a.put(6, 11, LJ, 2.4);
  return rimOut(a, LJ[0], false);
}
const LAMPADA = [lampadaSprite()];
/* a lasca de estrela: prismas brancos saindo do chão, um maior; a ponta pisca no compasso */
const LAS_TIP = [];
function lascaSprite(v) {
  const a = spr(), R = DRA.estrela, base = v === 0 ? [[3.4, -0.55, 3.8], [8.4, 0.6, 3.2], [6, 0.1, 7.6]] : [[8, 0.5, 4.2], [4.2, -0.35, 6.8], [6.4, 0.15, 3]];
  let tip = null;
  for (const [bx, ang, len] of base) { const t = ELART.sprPrism(a, bx, 11.6, ang, len, len > 5 ? 1.6 : 1.1, R); if (len > 5) tip = t; }
  for (let x = 3; x <= 9; x++) a.put(x, 11, DRA.estelar, 3.2 - (x - 3) * 0.2);
  LAS_TIP[v] = tip;
  return rimOut(a, DRA.estelar[0]);
}
const LASCA = [lascaSprite(0), lascaSprite(1)];
/* o marco de medida: pilar quadrado de laje com a ponta em pirâmide, riscas de medida (as longas a cada 4), o plinto */
function marcoSprite(v) {
  const a = spr();
  pp(a, 5, 0, LJ[6]); a.put(6, 0, LJ, 4);
  for (let x = 4; x <= 7; x++) a.put(x, 1, LJ, x === 4 ? 5.6 : x === 7 ? 2.6 : 4.4);
  for (let y = 2; y <= 9; y++) for (let x = 4; x <= 7; x++) a.put(x, y, LJ, (x === 4 ? 5.2 : x === 5 ? 4.4 : x === 6 ? 3.6 : 2.5) + cg(x, y, 29501) * 0.1);
  for (let y = 3; y <= 9; y += 2) { const long = (y - 3) % 4 === 0; for (let x = long ? 4 : 6; x <= 7; x++) a.put(x, y, LJ, 1.2); }
  if (v) { pp(a, 5, 2, G7[5]); }
  for (let x = 2; x <= 9; x++) { a.put(x, 10, LJ, x === 2 ? 5.6 : 4.6 - (x - 2) * 0.2); a.put(x, 11, LJ, 2.6 - (x - 2) * 0.1); }
  return rimOut(a, LJ[0]);
}
const MARCO = [marcoSprite(0), marcoSprite(1)];
/* a engrenagem solta: de pé no chão, encostada; oito dentes, o furo quadrado, o sulco do cubo */
function engrenaSprite(v) {
  const a = spr(), R = LJ, r0 = v ? 3.6 : 4.4, cx = v ? 7 : 5.6, cy = 11.6 - r0 - 1.1, off = v ? 0.4 : 0;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), an = Math.atan2(dy, dx) + off, Rr = Math.cos(an * 8) > 0 ? r0 + 1.1 : r0;
    if (d > Rr) continue;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;                                                    // o furo
    let l = 4.0 - (dx + dy) / r0 * 1.2;
    if (d > Rr - 0.9) l += dx + dy < 0 ? 1.0 : -1.0; else if (Math.abs(d - r0 * 0.5) < 0.45) l -= 1.1;
    a.put(x, y, R, l);
  }
  if (v) for (let x = 0; x <= 4; x++) { a.put(x, 10, R, x === 0 ? 5.2 : 4.2 - x * 0.2); a.put(x, 11, R, 2.4); }   // uma barra de medida caída
  return rimOut(a, R[0]);
}
const ENGRENA = [engrenaSprite(0), engrenaSprite(1)];
/* o fio de luz: só a presilha no teto; o fio que vibra e a gota de luz da ponta são ao vivo */
const FIO_X = 5, FIO_L = 10;
function fioSprite() { const a = spr(); for (let x = 4; x <= 7; x++) { a.put(x, 0, LJ, x === 4 ? 5.4 : 4.2 - (x - 4) * 0.4); a.put(x, 1, LJ, 2.4); } pp(a, FIO_X, 2, G7[4]); return rimOut(a, LJ[0], false); }
const FIO = [fioSprite()];
/* os cubos flutuantes: no chão só a placa com o glifo que os segura; os três cubinhos são ao vivo (CUBO_CV) */
function cubosSprite() { const a = spr(); for (let x = 2; x <= 9; x++) { a.put(x, 10, LJ, x === 2 ? 5.2 : 4.0 - (x - 2) * 0.15); a.put(x, 11, LJ, 2.2); } pp(a, 5, 10, G7[5]); pp(a, 6, 10, G7[4]); return rimOut(a, LJ[0]); }
const CUBOS = [cubosSprite()];
const CUBO_DEF = [[1, 3, 3], [5, 1, 4], [9, 4, 3]];   // x, y do canto de cima à esquerda, lado
function cuboCanvas(n) {
  const S = n + 2, a = new Uint32Array(S * S), C = DRA.pedra;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) a[(y + 1) * S + x + 1] = dPix(C, y === 0 ? 5.6 : x === 0 ? 4.4 : x === n - 1 ? 2.2 : 3.4);
  if (n > 3) a[(2) * S + 2] = G7[5];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const k = y * S + x; if (a[k]) continue; const n4 = (x > 0 && a[k - 1] && a[k - 1] !== C[0]) || (x < S - 1 && a[k + 1] && a[k + 1] !== C[0]) || (y > 0 && a[k - S] && a[k - S] !== C[0]) || (y < S - 1 && a[k + S] && a[k + S] !== C[0]); if (n4) a[k] = C[0]; }
  return sprCanvas(a, S, S);
}
const CUBO_CV = CUBO_DEF.map(c => cuboCanvas(c[2]));
/* a poeira de estrela: grãozinhos brancos e violeta no chão, uns morrinhos; ela solta um grão que sobe reto (ao vivo) */
function poeiraSprite(s) {
  const a = spr(), W = DRA.estrela, V = DRA.estelar;
  for (let i = 0; i < 9; i++) { const x = 1 + (hash2(s, i, 1) * 10 | 0), y = 9 + (hash2(s, i, 2) * 3 | 0), b = hash2(s, i, 3); a.put(x, y, b < 0.3 ? W : V, b < 0.15 ? 6 : 3 + b * 2); }
  for (let k = 0; k < 2; k++) { const x = 2 + (hash2(s, k, 4) * 7 | 0); a.put(x, 11, V, 4.6); a.put(x + 1, 11, V, 3.2); a.put(x, 10, W, 5.4); }
  return rimOut(a, V[0]);
}
const POEIRA = [poeiraSprite(29511), poeiraSprite(29512), poeiraSprite(29513)];
/* a coluna facetada: oito faces lisas (a da esquerda acesa, as da direita no escuro, a aresta clara); pé de plinto em
   degraus, cabeça em laje, um meio com o anel de glifo */
const COL_F = [0, 0, 5.0, 5.8, 4.8, 4.1, 3.7, 3.0, 2.4, 1.7];
function colunaSprite(k) {   // 0 pé, 1 meio, 2 cabeça, 3 meio com o anel de glifo
  const a = spr();
  for (let y = 0; y < 12; y++) for (let x = 2; x <= 9; x++) a.put(x, y, LJ, COL_F[x] + cg(x, y, 29521) * 0.08);
  if (k === 3) for (let x = 2; x <= 9; x++) { a.put(x, 5, G7, x < 5 ? 5.6 : 4.4 - (x - 5) * 0.3); a.put(x, 6, G7, x < 5 ? 4.2 : 3.4 - (x - 5) * 0.3); a.put(x, 4, LJ, 1.2); a.put(x, 7, LJ, 1.2); }
  if (k === 0) { for (let x = 1; x <= 10; x++) { a.put(x, 8, LJ, x === 1 ? 5.4 : 4.8 - (x - 1) * 0.25); a.put(x, 9, LJ, 2.6); } for (let x = 0; x <= 11; x++) { a.put(x, 10, LJ, x === 0 ? 5.6 : 4.6 - x * 0.2); a.put(x, 11, LJ, 2.4); } }
  if (k === 2) { for (let x = 0; x <= 11; x++) { a.put(x, 0, LJ, 5.4 - x * 0.18); a.put(x, 1, LJ, 3.0); } for (let x = 1; x <= 10; x++) { a.put(x, 2, LJ, x === 1 ? 5 : 4.2 - (x - 1) * 0.2); a.put(x, 3, LJ, 1.8); } }
  return k === 1 || k === 3 ? rimOut(a, LJ[0], false) : rimOut(a, LJ[0], k === 0);
}
const COLUNA = [colunaSprite(0), colunaSprite(1), colunaSprite(2), colunaSprite(3)];
/* a estalactite de vidro: um prisma de vidro preto caindo do teto, a face da esquerda com o reflexo verde, a ponta clara */
function estalacSprite(v) {
  const a = spr(), R = DRA.vidro, list = v === 0 ? [[5.6, 4, 11]] : [[4.4, 3.4, 9], [8.6, 2, 5]];
  for (const [cx, hw, len] of list) for (let y = 0; y < len; y++) {
    const w = hw * (1 - y / len); for (let x = 0; x < 12; x++) { const q = (x + 0.5 - cx) / Math.max(0.6, w); if (Math.abs(q) > 1) continue; a.put(x, y, R, q < -0.4 ? 5.2 - y * 0.08 : q < 0.15 ? 3.6 : 2.0 + (y > len - 3 ? 1 : 0)); }
    pp(a, Math.round(cx - 0.6), len - 1, R[6]);
  }
  return rimOut(a, R[0], false);
}
const ESTALAC = [estalacSprite(0), estalacSprite(1), flipX(estalacSprite(0)), flipX(estalacSprite(1))];
/* a seta de prumo: uma placa quadrada de laje (sempre acesa de cima à esquerda) com a seta gravada e acesa, nas quatro
   direções: 0 baixo, 1 esquerda, 2 cima, 3 direita (a da ficha: aponta para onde é "baixo" agora) */
const SETA_PX = [];
function setaMask() { const m = new Uint8Array(T * T), on = (x, y) => { m[y * T + x] = 1; }; for (let y = 2; y <= 5; y++) { on(5, y); on(6, y); } for (let y = 6; y <= 9; y++) for (let x = 2 + (y - 6); x <= 9 - (y - 6); x++) on(x, y); return m; }
function setaSprite(dir) {
  let m = setaMask(); for (let i = 0; i < dir; i++) m = rot90(m);
  const a = spr(), px = [];
  for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
    if (m[y * T + x]) { a.put(x, y, G7, 4.6); px.push(x, y); continue; }
    let l = x === 1 || y === 1 ? 5.0 : x === 10 || y === 10 ? 2.4 : 3.6 + cg(x, y, 29531) * 0.1;
    if ((x > 1 && m[y * T + x - 1]) || (y > 1 && m[(y - 1) * T + x])) l -= 1.4;                            // o sulco da seta faz sombra
    a.put(x, y, LJ, l);
  }
  SETA_PX[dir] = px;
  return rimOut(a, LJ[0]);
}
const SETA = [0, 1, 2, 3].map(setaSprite);
const SETA_CV = SETA.map(a => sprCanvas(a));   // para o 296/297 desenharem a seta girando no aviso
/* a grade de luz: barras em pé e deitadas de luz ciano, o cruzamento branco; o miolo é vazio (a parede aparece) */
function gradeSprite(k) {
  const a = spr();
  for (let y = 0; y < 12; y++) for (const x of [1, 5, 9]) pp(a, x + k, y, G7[(y + x) % 4 === 0 ? 5 : 4]);
  for (const y of [3, 9]) for (let x = 0; x < 12; x++) { const cross = (x - k) % 4 === 1; pp(a, x, y, cross ? G7[6] : G7[3]); }
  return a;
}
const GRADE = [gradeSprite(0), gradeSprite(1)];

DECO[AT_ESCADA] = ESCADA; DECO[AT_CORRENTE] = CORRENTE; DECO[AT_LAMPADA] = LAMPADA; DECO[AT_LASCA] = LASCA; DECO[AT_MARCO] = MARCO; DECO[AT_ENGRENA] = ENGRENA;
DECO[AT_FIO] = FIO; DECO[AT_CUBOS] = CUBOS; DECO[AT_POEIRA] = POEIRA; DECO[AT_COLUNA] = COLUNA; DECO[AT_ESTALAC] = ESTALAC; DECO[AT_SETA] = SETA;
// a grade de luz: sólida mas vazada, como o véu élfico; não quebra
DECO[AT_BARREIRA] = GRADE; MAT[AT_BARREIRA] = [PALS.atGlifo, BKV.grade]; SOLID[AT_BARREIRA] = 1; BLOCKY[AT_BARREIRA] = 0; SEETHRU[AT_BARREIRA] = 1; DIG[AT_BARREIRA] = 0; PCOL[AT_BARREIRA] = '#9af0f0'; EMIT[AT_BARREIRA] = 0.55;
// o bloco em trânsito: sólido e invisível (não desenha nada, a parede aparece; no mapa também), não quebra
DECO[AT_TRANSITO] = [spr()]; SOLID[AT_TRANSITO] = 1; BLOCKY[AT_TRANSITO] = 0; SEETHRU[AT_TRANSITO] = 1; DIG[AT_TRANSITO] = 0;
const AT_DECO = [
  // id, dureza, cor no mapa
  [AT_ESCADA, 0.4, '#7c8898'], [AT_CORRENTE, 0.2, '#6a7c70'], [AT_LAMPADA, 0.3, '#9af0f0'], [AT_LASCA, 0.5, '#f0f4ff'], [AT_MARCO, 0.6, '#7c8898'], [AT_ENGRENA, 0.4, '#56606e'],
  [AT_FIO, 0.05, '#9af0f0'], [AT_CUBOS, 0.2, '#6a7e94'], [AT_POEIRA, 0.03, '#b4b8e8'], [AT_COLUNA, 1.6, '#7c8898'], [AT_ESTALAC, 0.4, '#3e6e5c'], [AT_SETA, 0, '#4ac8d0']
];
for (const [t, dig, col] of AT_DECO) { DIG[t] = dig; PCOL[t] = col; }
if (ITEMS.po_estelar) BLOCK_DROP[AT_LASCA] = 'po_estelar';
EMIT[AT_LAMPADA] = 0.95; EMIT[AT_LASCA] = 0.6; EMIT[AT_FIO] = 0.25; EMIT[AT_CUBOS] = 0.1; EMIT[AT_POEIRA] = 0.15; EMIT[AT_SETA] = 0.2;
// o que cai quando o apoio some (56, 87); escada, corrente e coluna ficam
for (const t of [AT_LAMPADA, AT_FIO, AT_ESTALAC]) CV_HANGS[t] = 1;
for (const t of [AT_LASCA, AT_MARCO, AT_ENGRENA, AT_CUBOS, AT_POEIRA]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[AT_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== AT_ESCADA && !solidAt(gx, gy - 1) ? arr[1] : tileAt(gx, gy + 1) !== AT_ESCADA ? arr[2] : arr[0];
DECO_PICK[AT_CORRENTE] = (gx, gy, arr) => arr[tileAt(gx, gy + 1) === AT_CORRENTE ? 0 : 1];
const lasV = (gx, gy) => vr(gx, gy, 29541, 2);
DECO_PICK[AT_LASCA] = (gx, gy, arr) => arr[lasV(gx, gy)];
DECO_PICK[AT_MARCO] = (gx, gy, arr) => arr[vr(gx, gy, 29542, 2)];
DECO_PICK[AT_ENGRENA] = (gx, gy, arr) => arr[vr(gx, gy, 29543, 2)];
DECO_PICK[AT_POEIRA] = (gx, gy, arr) => arr[vr(gx, gy, 29544, 3)];
DECO_PICK[AT_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== AT_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== AT_COLUNA ? arr[2] : arr[hash2(wrapX(gx), gy, 29545) < 0.22 ? 3 : 1];
DECO_PICK[AT_ESTALAC] = (gx, gy, arr) => arr[vr(gx, gy, 29546, 4)];
const setaDir = (gx, gy) => { const R = typeof atGravRect === 'function' ? atGravRect(gx, gy) : null; return R ? R.dir & 3 : 0; };
DECO_PICK[AT_SETA] = (gx, gy, arr) => arr[setaDir(gx, gy)];
DECO_PICK[AT_BARREIRA] = (gx, gy, arr) => arr[0];
// quando a gravidade de um retângulo vira, as setas dele precisam ser redesenhadas (o 296 e o 297 chamam isto)
function atSetaDirty(R) { if (!R) return; for (let y = R.y0; y < R.y0 + R.h; y++) for (let x = R.x0; x < R.x0 + R.w; x++) if (tileAt(x, y) === AT_SETA) markDirty(wrapX(x), y); }

// a escada embutida conta como a escada da mina (a pose de subir) e as duas, escada e corrente, como a corrente da catedral
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, AT_ESCADA) || _tt(e, AT_CORRENTE))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, AT_ESCADA)); }; }

/* ================= ao vivo: o pulso dos condutos, os glifos, a lâmpada, o fio, os cubos, a poeira, as estrelinhas ================= */
const AT_GL = {};
const atGlow = (k, r, col) => AT_GL[k] || (AT_GL[k] = glow(r, col));
const atOut = cy => cy + VH < (AT_S0 - 6) * T || cy > (AT_S0 + AT_D + 6) * T;
// o pulso que corre nos condutos: um trecho de luz de COND_LEN px a cada COND_GAP px, que anda COND_GAP px por compasso
const COND_GAP = 96, COND_LEN = 7;
const condS = (gx, tm) => ((atBeat(tm) * COND_GAP - wrapX(gx) * T) % COND_GAP + COND_GAP) % COND_GAP;   // onde começa o pulso, em px do bloco
const CIANO = '#4ac8d0', CIANO_C = '#9af0f0', BRANCO = '#f0f4ff';
HOOK.drawGlow.push((cx, cy) => {
  if (atOut(cy)) return;
  const tm = gameTime, p = atPulse(tm);
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < AT_PEDRA || t > AT_SETA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case AT_LAMPADA: lc.globalAlpha = 0.26 + p * 0.06; lc.drawImage(atGlow('lb', 36, '#8ae8f0'), x + 6 - 36, y + 7 - 36); lc.globalAlpha = 0.4 + p * 0.15; lc.drawImage(atGlow('ls', 9, '#d8ffff'), x + 6 - 9, y + 7 - 9); break;
      case AT_GLIFO: if ((gx + gy) & 1) break; lc.globalAlpha = 0.07 + p * 0.07; lc.drawImage(atGlow('g12', 12, CIANO), x + 6 - 12, y + 6 - 12); break;
      case AT_CONDUTO: {
        if (!(gx & 1)) { lc.globalAlpha = 0.08; lc.drawImage(atGlow('g12', 12, CIANO), x + 6 - 12, y + 6 - 12); }
        const s = condS(gx, tm); if (s < T) { lc.globalAlpha = 0.35; lc.drawImage(atGlow('c10', 10, CIANO_C), x + s + 3 - 10, y + 6 - 10); }
        break;
      }
      case AT_FUNDIDA: if ((gx + gy * 3) % 5) break; lc.globalAlpha = 0.04 + p * 0.05; lc.drawImage(atGlow('w10', 10, '#d8e4ff'), x + 6 - 10, y + 6 - 10); break;
      case AT_O_ESTELAR: lc.globalAlpha = 0.08 + p * 0.08; lc.drawImage(atGlow('v12', 12, '#b4b8e8'), x + 6 - 12, y + 6 - 12); break;
      case AT_LASCA: lc.globalAlpha = 0.2 + p * 0.08; lc.drawImage(atGlow('w16', 16, '#e8f0ff'), x + 6 - 16, y + 7 - 16); break;
      case AT_FIO: lc.globalAlpha = 0.12 + p * 0.06; lc.drawImage(atGlow('g8', 8, CIANO_C), x + FIO_X - 8, y + FIO_L - 8); break;
      case AT_CUBOS: lc.globalAlpha = 0.06 + p * 0.04; lc.drawImage(atGlow('g8', 8, CIANO_C), x + 6 - 8, y + 4 - 8); break;
      case AT_POEIRA: lc.globalAlpha = 0.06 + p * 0.05; lc.drawImage(atGlow('v8', 8, '#c8ccf0'), x + 6 - 8, y + 10 - 8); break;
      case AT_SETA: lc.globalAlpha = 0.08 + p * 0.1; lc.drawImage(atGlow('g8', 8, CIANO), x + 6 - 8, y + 6 - 8); break;
      case AT_BARREIRA: lc.globalAlpha = 0.14 + p * 0.06; lc.drawImage(atGlow('b14', 14, CIANO), x + 6 - 14, y + 6 - 14); break;
    }
  }
  lc.globalAlpha = 1;
});
const pxList = (x, y, a, col, al) => { lc.globalAlpha = al; lc.fillStyle = col; for (let k = 0; k < a.length; k += 2) lc.fillRect(x + a[k], y + a[k + 1], 1, 1); };
HOOK.drawTop.push((cx, cy) => {
  if (atOut(cy)) return;
  const tm = gameTime, p = atPulse(tm), bt = atBeat(tm), flash = bt < 0.1;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < AT_PEDRA || t > AT_SETA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case AT_CONDUTO: {   // o trecho de luz correndo no canal: a frente branca, a cauda ciano
        const s = condS(gx, tm);
        for (let k = 0; k < COND_LEN; k++) {
          let px = s + COND_LEN - 1 - k; if (px >= COND_GAP) px -= COND_GAP; if (px < 0 || px >= T) continue;
          const wx = (wrapX(gx) * T + px) % 24; if (wx <= 1 || wx >= 22) continue;                                // a gola tampa
          lc.globalAlpha = 1 - k / COND_LEN * 0.8; lc.fillStyle = k < 2 ? '#ffffff' : CIANO_C; lc.fillRect(x + px, y + 5, 1, 2);
          if (k < 3) { lc.globalAlpha *= 0.6; lc.fillStyle = CIANO; lc.fillRect(x + px, y + COND_Y0, 1, 1); lc.fillRect(x + px, y + COND_Y1, 1, 1); }
        }
        break;
      }
      case AT_GLIFO: if (p > 0.3) pxList(x, y, GLIFO_PX[glifoK(wrapX(gx) % 20, gy % 20)], CIANO_C, (p - 0.3) * 0.9); break;
      case AT_LAMPADA: pxList(x, y, LAMP_PX, '#ffffff', 0.3 + p * 0.7); break;
      case AT_SETA: if (p > 0.25) pxList(x, y, SETA_PX[setaDir(gx, gy)], CIANO_C, (p - 0.25) * 1.1); break;
      case AT_FIO: {   // o fio vibra: a onda cresce para a ponta; a gota de luz da ponta acende no compasso
        for (let k = 0; k < FIO_L - 2; k++) { const yy = 3 + k, ox = Math.round(Math.sin(tm * 17 + k * 0.9) * 0.55 * (k / (FIO_L - 2)) * 1.6); lc.globalAlpha = 0.9; lc.fillStyle = k & 1 ? CIANO : CIANO_C; lc.fillRect(x + FIO_X + ox, y + yy, 1, 1); }
        const ox = Math.round(Math.sin(tm * 17 + (FIO_L - 2) * 0.9) * 0.88); lc.globalAlpha = 0.7 + p * 0.3; lc.fillStyle = '#ffffff'; lc.fillRect(x + FIO_X + ox, y + FIO_L + 1, 1, 1); lc.fillStyle = CIANO_C; lc.fillRect(x + FIO_X + ox - 1, y + FIO_L + 1, 1, 1); lc.fillRect(x + FIO_X + ox, y + FIO_L, 1, 1);
        break;
      }
      case AT_POEIRA: {   // um grão sobe reto, devagar, e apaga (cada bloco no seu tempo, sempre o mesmo intervalo)
        const ph0 = (tm * 0.18 + hash2(wrapX(gx), gy, 29601)) % 1; if (ph0 > 0.6) break;
        lc.globalAlpha = 1 - ph0 / 0.6; lc.fillStyle = ph0 < 0.2 ? '#ffffff' : '#c8ccf0'; lc.fillRect(x + 2 + vr(gx, gy, 29602, 8), y + 9 - Math.round(ph0 / 0.6 * 22), 1, 1);
        break;
      }
      case AT_O_ESTELAR: case AT_LASCA: {   // as estrelinhas piscam juntas no começo do compasso
        if (!flash) break;
        const L = bt < 0.05 ? 2 : 1; lc.globalAlpha = 1; lc.fillStyle = '#ffffff';
        if (t === AT_LASCA) { const tp = LAS_TIP[lasV(gx, gy)]; if (tp) { lc.fillRect(x + tp[0], y + tp[1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + tp[0] - L + 1, y + tp[1], L * 2 - 1, 1); } break; }
        const st = estStars(gx, gy); if (!st) break;
        for (let k = 0; k < st.length; k += 2) { lc.fillRect(x + st[k], y + st[k + 1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + st[k] - L + 1, y + st[k + 1], L * 2 - 1, 1); }
        break;
      }
      case AT_BARREIRA: { const ly = Math.floor(bt * 12); lc.globalAlpha = 0.5; lc.fillStyle = '#e8ffff'; lc.fillRect(x, y + ly, T, 1); break; }   // a varredura desce junta em toda a grade
    }
  }
  lc.globalAlpha = 1;
});
// os cubos flutuam antes da luz (a luz do lugar pinta eles): sobem e descem 1 px, os três em onda, todos no compasso
HOOK.drawWorld.push((cx, cy) => {
  if (atOut(cy)) return;
  const ph0 = atBeat(gameTime) * 6.2832;
  for (let i = 0; i < emitters.length; i += 3) {
    if (emitters[i + 2] !== AT_CUBOS) continue;
    const x = emitters[i] * T - cx, y = emitters[i + 1] * T - cy;
    for (let k = 0; k < 3; k++) { const c = CUBO_DEF[k]; lc.drawImage(CUBO_CV[k], x + c[0] - 1, y + c[1] - 1 + Math.round(Math.sin(ph0 + k * 2.094))); }
  }
});
Object.assign(ATART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, flipY, pp, wrapT, wrapD, W2, RX, rot90, sprCanvas,
  GL, STAR, MICA, DRA, GLYPHS, glyphAt, glifoK, GLIFO_PX, AT_BEAT, atBeat, atPulse, atGlow, AT_GL, atOut, atSetaDirty, setaDir,
  vPedra, vLaje, vRochaFria, vGlifo, vConduto, vEngrenagem, vChapa, vVidro, vFundida, vLadrilho, vGrade, lajeSlab, vPedraW, vLajeW, vGlifoW, vMaquinaW, vVidroW,
  vDpCidade, vDpMaquinas, vDpEstrela, BKV,
  ESCADA, CORRENTE, LAMPADA, LASCA, MARCO, ENGRENA, FIO, CUBOS, POEIRA, COLUNA, ESTALAC, SETA, SETA_CV, SETA_PX, GRADE, CUBO_CV, CUBO_DEF, LAMP_PX, LAS_TIP, estStars,
  COND_GAP, COND_LEN, condS });
}
