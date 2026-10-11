'use strict';

/* ================= o Reino Élfico: blocos, paredes, terceira camada, minérios, decoração, o luar =================
   Um reino que ainda funciona, debaixo da terra. Na Mata de Prata, o solo élfico escuro e fofo com fios de raiz de
   prata, os troncos de casca cinza-prata lisa (fios verticais, lenticelas deitadas, nós como olhos) e a copa azul-prata
   colada no teto, folhas compridas penduradas em camadas, com pontos de brilho. Nos Salões, o mármore-lua
   branco-azulado com veios de prata, a pedra lavrada em blocos com ramos e folhas em relevo e um filete de prata
   embutido, e as tábuas claras dos flets, curvas, com a junta em folha e um pino de prata. Na Corte, o mesmo mármore
   rachado e manchado de vinho com veios de ouro velho, a madeira morta preta e retorcida com a seiva carmesim nas
   rachaduras e os prismas de mana sangrenta. No Poço, a pedra azul-petróleo com runas de lua que brilham fraco, a
   Raiz-Mãe com a seiva azul acesa nos sulcos, os prismas de cristal lunar, o espelho d'água parado e a Lua Presa.
   Como o 241 e o 191, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda
   acesa, sombra e oclusão vêm do 07. Paredes e terceira camada só leem o tom (.v). A decoração de 1 bloco são sprites
   de 12x12 em rampas de 7 tons com luz de cima à esquerda; o que brilha e se mexe (a chama da lanterna, o fogo frio
   do braseiro, a flor que abre e fecha, a gota de orvalho que cai, os vaga-lumes, as runas que pulsam, as estrelinhas
   dos cristais e da lunarita, o fio de luz do véu) é desenhado ao vivo, só sobre o que está na tela. Ids: 250. */
const ELART = {};   // ferramentas para 252-elfos-objetos, os elfos (253, 254), a Dama (256) e a lunarita (257)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('elSolo', ['#0e0c11', '#19151c', '#251f29', '#332a36', '#433746', '#574859']);
pal('elMadeira', ['#252a33', '#3e4450', '#5c6472', '#7e8796', '#a4adbb', '#ccd3de']);
pal('elFolhagem', ['#0a1420', '#142638', '#203c56', '#305878', '#4a7a9c', '#7aa6c4']);
pal('elMarmore', ['#465064', '#646f86', '#8893aa', '#adb8cc', '#ced7e6', '#edf2f9']);
pal('elLavrada', ['#363d4b', '#4f5768', '#6b7486', '#8a93a6', '#adb5c5', '#d2d8e3']);
pal('elTabua', ['#3a3024', '#5a4a38', '#7c6a52', '#a08c6e', '#c2b08e', '#e0d2b2']);
pal('elProfano', ['#241015', '#3e1c26', '#5c2e3a', '#7e4a52', '#a47a7c', '#cab4b6']);
pal('elMorta', ['#070609', '#0f0d11', '#18151b', '#221d25', '#2d2630', '#3b323e']);
pal('elSangue', ['#2a0610', '#4e0c1c', '#7a1428', '#b0203a', '#e04a5a', '#ff9aa0']);
pal('elPoco', ['#071216', '#0d1e24', '#142c34', '#1e3e48', '#2a525c', '#3a6a74']);
pal('elRaiz', ['#22262f', '#373d4a', '#505866', '#6e7786', '#929bab', '#bac2d0']);
pal('elCristal', ['#1a2a4a', '#2e4a7a', '#4a72ac', '#78a2d8', '#b0d0f4', '#eef8ff']);
pal('elEspelho', ['#03070c', '#071017', '#0c1822', '#142432', '#203448', '#3e5e80']);
pal('elLua', ['#6a7488', '#8c97ac', '#aeb8cb', '#ccd5e4', '#e6ecf5', '#ffffff']);
pal('elVeu', ['#2a3444', '#4a5a72', '#7a8ca8', '#a8bad4', '#d4e2f4', '#ffffff']);
// paredes de fundo: sempre bem mais escuras que o chão da frente
pal('elMataW', ['#040306', '#070609', '#0b090d', '#0f0c11', '#131016', '#19151c']);
pal('elSalaoW', ['#06070a', '#0a0b0f', '#0e1015', '#13161c', '#191d24', '#20252e']);
pal('elProfanoW', ['#090405', '#0e0608', '#14090b', '#1a0d10', '#211115', '#29161a']);
pal('elPocoW', ['#030709', '#050b0e', '#081013', '#0b1519', '#0f1b20', '#1c4656']);
pal('elFolhasW', ['#03050a', '#050a10', '#080f17', '#0b141e', '#0f1a26', '#152230']);
// a terceira camada: a mata ao longe (o tom 4 e 5 são o luar da Lua Presa entre os troncos), os salões ao longe (a
// pedra branca no tom 4 e 5), as raízes da Árvore-Mãe (a seiva azul no tom 5)
pal('dpElMata', ['#020306', '#05070c', '#0a0e18', '#121a28', '#1e2c44', '#5c7aa8']);
pal('dpElSaloes', ['#030407', '#05070b', '#090c12', '#0e131b', '#161e2a', '#26324a']);
pal('dpElRaizes', ['#020408', '#04070d', '#060b14', '#09101c', '#0d1726', '#1e4a80']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // senos em x ou y só com múltiplos inteiros disto, para a textura não ter emenda
const RX = hexes => hexes.map(h => ph(h));
const mixP = (a, b, t) => { const A = rgb(a), B = rgb(b); return pack(lerp(A[0], B[0], t) | 0, lerp(A[1], B[1], t) | 0, lerp(A[2], B[2], t) | 0); };
const clampR = (R, l) => R[l < 0 ? 0 : l > R.length - 1 ? R.length - 1 : Math.round(l)];
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
// uma folha comprida (lanceolada) ao longo de u: meio comprimento L, meia largura W
const leafIn = (u, w, L, W) => Math.abs(u) < L && Math.abs(w) < W * (1 - (u / L) * (u / L));
const SILV = RX(['#4e5868', '#7c889a', '#aab6c6', '#d8e2ee', '#ffffff']);                 // o filete e os fios de prata
const MOONG = RX(['#14305a', '#244e88', '#3a74b8', '#64a0e0', '#a4cdf8', '#e8f6ff']);    // a luz azul da lua (runas, seiva)
const GOLDV = RX(['#4a300a', '#7a5410', '#b08020', '#d8a83a', '#f4d878']);                // os veios de ouro velho da Corte
const CRIMS = RX(['#3a0610', '#6a0c1c', '#a01a2c', '#d83a48', '#ff8088']);                // a seiva carmesim
const PEBE = RX(['#1e1a22', '#3a3440', '#5a5462', '#7e7888']);                            // pedrinhas no solo
const GLINT = RX(['#9cc8ff', '#d8ecff', '#ffffff']);
// rampas de 7 tons para os prismas: carmesim e branco-azulado
const SANGR = RX(['#1a0208', '#3e0814', '#6a1022', '#9c1a32', '#d02c44', '#ff6a74', '#ffd0d0']);
const LUAR = RX(['#14223e', '#26406c', '#3e64a0', '#6290d0', '#98c0f0', '#d2e8ff', '#ffffff']);

/* runas de lua: glifos de 3x5 (a pedra-do-poço, a pedra rúnica, a parede do poço) */
const RUNES = [
  ['.##', '#..', '#..', '#..', '.##'], ['.#.', '###', '.#.', '#.#', '.#.'], ['#.#', '.#.', '###', '.#.', '#.#'],
  ['##.', '#.#', '##.', '#..', '#..'], ['.#.', '#.#', '.#.', '.#.', '###'], ['#..', '##.', '#.#', '##.', '#..'],
  ['###', '.#.', '.#.', '#.#', '.#.'], ['.#.', '.#.', '#.#', '.#.', '.#.']
];
const runeAt = (k, x, y) => x >= 0 && y >= 0 && x < 3 && y < 5 && RUNES[k][y][x] === '#';

/* ---- o chão sólido ---- */
function vSolo(x, y) {   // solo élfico: terra escura e fofa em torrões, fios de raiz de prata, pedrinhas, um grão de pedra-da-lua
  let v = 2.3 + cn(x, y, 30, 30, 25101) * 1.7 + cn(x, y, 120, 120, 25102) * 0.8 + cg(x, y, 25103) * 0.75;
  const c = cells(x, y, 6, 25104, 1.1);
  if (c.d2 - c.d1 < 0.8) v -= 1.2; else v += -(c.ox + c.oy) * 0.22 + (c.id - 0.5) * 0.8;               // torrões
  const r = Math.abs(cn(wrapT(x + cn(x, y, 8, 24, 25106) * 60), y, 12, 6, 25105));
  if (r < 0.009) { MATX = SILV[r < 0.004 ? 2 : 1]; return -9; }                                           // o fio de raiz
  if (r < 0.016) v -= 0.9;
  if (Math.abs(cn(wrapT(x + cn(x, y, 8, 24, 25106) * 60), y - 1, 12, 6, 25105)) < 0.009) v -= 0.6;     // a sombra embaixo do fio
  const p = cells(x, y, 8, 25109);
  if (p.id < 0.07 && p.d1 < 1.4) { MATX = PEBE[p.ox + p.oy < -0.3 ? 3 : p.ox + p.oy > 0.4 ? 0 : 1]; return -9; }
  if (hash2(x, y, 25108) < 0.0016) { MATX = MOONG[4]; return -9; }
  if (hash2(x, y, 25110) < 0.035) v -= 1.2; else if (hash2(x, y, 25111) < 0.012) v += 1.1;
  return v;
}
function vMadeira(x, y) {   // madeira prateada: casca lisa em fios verticais que ondulam, veios claros, lenticelas deitadas, nós como olhos
  const u = wrapT(x + cn(x, y, 6, 2, 25121) * 28 + cn(x, y, 24, 6, 25122) * 6);
  const g = Math.sin(u * W2 * 30), f = Math.sin(u * W2 * 90 + cn(x, y, 30, 8, 25123) * 3);
  let v = 2.9 + g * 0.45 + f * 0.22 + cn(x, y, 30, 10, 25124) * 0.8 + cg(x, y, 25125) * 0.26;
  if (f > 0.94 && g > -0.2) v += 0.9;                                                                     // veio claro
  if (g < -0.95 && cn(x, y, 12, 3, 25126) > 0.04) return 0.8 + cg(x, y, 25127) * 0.3;                   // fenda comprida
  if (g < -0.8 && g > -0.95 && cn(x, y, 12, 3, 25126) > 0.04) v -= 0.6;
  // lenticelas: traços curtos deitados, a beirada de baixo pega luz
  const X = wrapT(x), Y = wrapT(y), lx = Math.floor(X / 8), ly = Math.floor(Y / 6), hl = hash2(lx, ly, 25128);
  if (hl < 0.2) { const ox = X % 8, oy = Y % 6, oy0 = 1 + ((hl * 40) | 0) % 3, L = 3 + ((hl * 100) | 0) % 3; if (oy === oy0 && ox >= 1 && ox <= L) v = 1.1; else if (oy === oy0 + 1 && ox >= 1 && ox <= L) v += 0.8; }
  // os nós: um olho comprido em pé, anéis em volta, e a "sobrancelha" de casca por cima
  const k = cells(x, y, 40, 25129, 0.55);
  if (k.id < 0.16) {
    if (k.d1 < 1.5) return k.ox + k.oy > 0 ? 1.4 : 0.5;
    if (k.d1 < 4.2) { const rr = k.d1 % 1.4; v = rr < 0.5 ? 1.5 : 3.6 - (k.ox + k.oy) * 0.12; }
    else if (k.oy < -4 && k.oy > -7 && Math.abs(k.ox) < 6 - (-k.oy - 4) * 1.5 && Math.abs(Math.abs(k.ox) * 0.45 + k.oy + 5.2) < 0.6) v -= 1.3;
  }
  return v;
}
// uma folha que cai (aponta para baixo, inclinada um pouco): a célula de cs px, o ângulo saindo do id
function hangLeaf(x, y, cs, s, sy, tilt) { const c = cells(x, y, cs, s, sy), a = 1.5708 + (c.id - 0.5) * tilt, ca = Math.cos(a), sa = Math.sin(a); return { c, ca, sa, u: c.ox * ca + c.oy * sa, w: -c.ox * sa + c.oy * ca }; }
function vFolhagem(x, y) {   // folhagem lunar: folhas compridas azul-prata penduradas em duas camadas, a nervura clara, pontos de brilho
  const L = 6.0, W = 2.2;
  const f = hangLeaf(x, y, 10, 25131, 1, 1.6);
  if (leafIn(f.u, f.w, L, W)) {
    const sd = f.w > 0 ? 1 : -1, ld = sd * 0.707 * (f.sa - f.ca);
    let v = 3.2 + ld * 1.0 + cn(x, y, 30, 30, 25133) * 0.7 + cg(x, y, 25134) * 0.25 - (f.u / L) * 0.4;
    if (Math.abs(f.w) < 0.4) v += 1.0;                                                                    // a nervura
    if (!leafIn(f.u, f.w + sd * 0.9, L, W)) v -= 0.8;                                                     // a borda
    if (hash2(x, y, 25135) < 0.008) { MATX = GLINT[hash2(x, y, 25136) < 0.4 ? 2 : 1]; return -9; }
    return v;
  }
  const b = hangLeaf(x + 5, y + 4, 10, 25132, 1, 2.2);
  if (leafIn(b.u, b.w, L * 0.9, W)) { let v = 1.8 + (b.w > 0 ? -0.3 : 0.3) + cn(x, y, 30, 30, 25137) * 0.5 + cg(x, y, 25138) * 0.2; if (Math.abs(b.w) < 0.4) v += 0.6; return v; }
  if (hash2(x, y, 25139) < 0.006) return 3.6;                                                             // um furinho de luz lá no fundo
  return 0.7 + cn(x, y, 20, 20, 25140) * 0.6 + cg(x, y, 25141) * 0.2;
}
function vMarmore(x, y) {   // mármore-lua: branco-azulado em nuvens macias, veios de prata (miolo claro, beira cinza), uma cintilação
  let v = 3.2 + cn(x, y, 8, 8, 25151) * 1.9 + cn(x, y, 24, 24, 25152) * 0.8 + cg(x, y, 25153) * 0.22;
  const cl = cn(x, y, 6, 12, 25159); if (cl > 0.12) v -= (cl - 0.12) * 4;                                 // a nuvem cinza-azulada
  const wx = wrapT(x + cn(x, y, 8, 8, 25154) * 60), wy = wrapT(y + cn(x, y, 8, 8, 25155) * 60);
  const vein = Math.abs(cn(wx, wy, 6, 6, 25156));
  if (vein < 0.0055) { MATX = SILV[vein < 0.002 ? 4 : 3]; return -9; }
  if (vein < 0.012) v -= 1.8 - vein * 60;
  else if (vein < 0.02) v -= 0.3;
  const v2 = Math.abs(cn(wx, wy, 16, 16, 25157)); if (v2 < 0.005) v -= 1.0; else if (v2 < 0.009) v -= 0.4;   // os veios finos, cinza
  if (hash2(x, y, 25158) < 0.003) v += 1.3;
  return v;
}
/* pedra lavrada: blocos de 24 x 12 desencontrados, chanfro aceso em cima e à esquerda, o filete de prata embutido e,
   embaixo dele, o relevo: um ramo ondulado com folhas alternadas, um par de folhas com a estrela no meio, ou um painel
   rebaixado. O relevo pega luz em cima à esquerda e faz sombra embaixo à direita */
function lavMotif(lx, ly, kind) {
  if (lx < 2 || lx > 20 || ly < 4 || ly > 9) return false;
  if (kind === 0) {   // o ramo
    const ys = 6.6 + Math.sin(lx / 24 * 6.2832 * 1.5) * 1.3;
    if (Math.abs(ly + 0.5 - ys) < 0.55) return true;
    for (let i = 0; i < 4; i++) { const x0 = 3.5 + i * 5, up = i & 1 ? 1 : -1, cx = x0 + 1.2, cy = 6.6 + Math.sin(x0 / 24 * 6.2832 * 1.5) * 1.3 + up * 1.6, dx = lx + 0.5 - cx, dy = ly + 0.5 - cy, u = dx * 0.8 + dy * 0.6 * up, w = -dx * 0.6 * up + dy * 0.8; if (leafIn(u, w, 2.2, 0.95)) return true; }
    return false;
  }
  if (kind === 1) {   // duas folhas deitadas e a estrela de quatro pontas no meio
    const dx = lx + 0.5 - 11.5, dy = ly + 0.5 - 7;
    if (Math.abs(dx) + Math.abs(dy) * 1.6 < 2.2 || (Math.abs(dx) < 0.6 && Math.abs(dy) < 2.6) || (Math.abs(dy) < 0.6 && Math.abs(dx) < 3)) return true;
    for (const s of [-1, 1]) { const u = dx - s * 6.5, w = dy; if (leafIn(u, w, 3.6, 1.5)) return true; }
    return false;
  }
  return false;
}
function vLavrada(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 12), ly = Y % 12, xx = wrapT(X + (row & 1) * 12), col = Math.floor(xx / 24), lx = xx % 24, h = hash2(col, row, 25161);
  if (ly === 11 || lx === 23) return 0.4;                                                                 // a junta
  let v = 2.9 + (h - 0.5) * 0.5 + cn(x, y, 40, 40, 25162) * 0.45 + cg(x, y, 25163) * 0.28;
  if (ly === 0 || lx === 0) v += 1.0; else if (ly === 10 || lx === 22) v -= 0.8;
  if (ly === 2 && lx >= 1 && lx <= 21) { MATX = SILV[lx % 7 === 3 ? 4 : (lx + row) % 3 ? 3 : 2]; return -9; }   // o filete de prata
  if (ly === 3 && lx >= 1 && lx <= 21) return v - 0.8;
  if (ly === 1 && lx >= 1 && lx <= 21) v -= 0.3;
  const kind = h < 0.5 ? 0 : h < 0.78 ? 1 : 2;
  if (kind === 2) {   // painel rebaixado
    if (lx >= 3 && lx <= 19 && ly >= 5 && ly <= 8) { v -= 0.7; if (lx === 3 || ly === 5) v -= 0.7; if (lx === 19 || ly === 8) v += 0.9; }
    return v;
  }
  if (lavMotif(lx, ly, kind)) {
    let r = 3.7 + cg(x, y, 25164) * 0.2;
    if (!lavMotif(lx - 1, ly - 1, kind)) r += 1.0; else if (!lavMotif(lx + 1, ly + 1, kind)) r -= 1.2;
    return r;
  }
  if (lavMotif(lx - 1, ly - 1, kind)) v -= 1.1;                                                           // a sombra do relevo
  return v;
}
/* tábua élfica: duas tábuas por bloco, cada fiada com o seu comprimento, a junta curva em folha (a ponta de uma tábua
   entra na outra), o veio correndo em ondas, um pino de prata perto de cada junta */
const TBL = [30, 40, 48, 60];
function vTabua(x, y) {
  const Y = wrapT(y), row = Math.floor(Y / 6), ly = Y % 6, hr = hash2(row, 0, 25171), len = TBL[(hr * 4) | 0];
  if (ly === 5) return 0.5;
  const bend = Math.sin((ly + 0.5) / 5 * Math.PI) * 1.8, xx = wrapT(x + ((hr * 240) | 0) - bend), col = Math.floor(xx / len), lx = xx - col * len, hp = hash2(col, row, 25172);
  if (lx < 1) return 0.6;                                                                                 // a junta em folha
  let v = 3.0 + (hp - 0.5) * 0.8 + cn(x, y, 40, 40, 25173) * 0.4 + cg(x, y, 25174) * 0.25;
  if (ly === 0) v += 1.0; else if (ly === 4) v -= 0.7;
  if (lx < 2) v += 0.6; else if (lx > len - 1.6) v -= 0.6;
  const gr = Math.sin(ly * 1.6 + Math.sin(lx / len * 6.2832 + hp * 6) * 1.6 + hp * 9);                  // o veio
  if (gr > 0.86) v -= 0.55; else if (gr < -0.9) v += 0.35;
  if (Math.abs(lx - 3.2) < 0.6 && ly === 2) { MATX = SILV[3]; return -9; }                              // o pino
  if (Math.abs(lx - 4) < 0.6 && ly === 3) v -= 0.8;
  if (hash2(x, y, 25175) < 0.01) v -= 0.9;
  return v;
}
function vProfano(x, y) {   // mármore profanado: o mármore-lua rachado, manchado de vinho escorrido, veios de ouro velho
  let v = 3.6 + cn(x, y, 8, 8, 25181) * 1.6 + cn(x, y, 40, 40, 25182) * 0.5 + cg(x, y, 25183) * 0.3;
  const st = cn(x, y, 10, 6, 25184) + cn(x, y, 30, 20, 25185) * 0.5;
  if (st > 0.0) v -= Math.min(2.6, 0.6 + st * 8);                                                     // a mancha de vinho
  for (let k = 1; k <= 6; k++) { const s2 = cn(x, y - k * 2, 10, 6, 25184) + cn(x, y - k * 2, 30, 20, 25185) * 0.5; if (s2 > 0.12 && hash2(x, 0, 25186) < 0.35) { v -= 0.9 - k * 0.1; break; } }   // escorrido
  const wx = wrapT(x + cn(x, y, 8, 8, 25187) * 60), wy = wrapT(y + cn(x, y, 8, 8, 25188) * 60), vein = Math.abs(cn(wx, wy, 6, 6, 25189));
  if (vein < 0.0055) { MATX = GOLDV[vein < 0.002 ? 4 : 3]; return -9; }
  if (vein < 0.01) { MATX = GOLDV[1]; return -9; }
  const cr = Math.abs(cn(x, y, 12, 12, 25191));
  if (cr < 0.006) return 0.3;                                                                             // a rachadura
  if (Math.abs(cn(x, y - 1, 12, 12, 25191)) < 0.006) v += 0.9;
  if (cr < 0.014) v -= 0.6;
  return v;
}
function vMorta(x, y) {   // madeira morta: preta, fibras torcendo para um lado e para o outro, rachaduras com a seiva carmesim
  const b = cn(x, y, 6, 4, 25201), dir = b > 0 ? 1 : -1, u = wrapT(x + cn(x, y, 6, 6, 25202) * 30 + dir * y * 0.55), r = u % 5;
  if (Math.abs(b) < 0.012) return 0.3;
  let v = r < 1 ? 0.9 : r < 2 ? 3.6 : r < 3.5 ? 2.8 : 2.0;
  if (Math.abs(b) < 0.03) v -= 0.8;
  v += cn(x, y, 24, 24, 25203) * 1.0 + cg(x, y, 25204) * 0.4;
  const cr = Math.abs(cn(wrapT(x + y * 0.3), y, 12, 8, 25205));
  if (cr < 0.0045) { MATX = CRIMS[cr < 0.002 ? 4 : 3]; return -9; }
  if (cr < 0.008) { MATX = CRIMS[1]; return -9; }
  if (cr < 0.013) v -= 1;
  const k = cells(x, y, 40, 25207, 1.3);
  if (k.id < 0.14 && k.d1 < 4) { if (k.d1 < 1.2) { MATX = CRIMS[2]; return -9; } v = (k.d1 % 1.3) < 0.5 ? 0.6 : 2.8 - (k.ox + k.oy) * 0.12; }
  return v;
}
// prismas: células de 16 px, a aresta acesa à esquerda e escura à direita, o miolo fundo, um fio de luz por dentro
function prismV(x, y, R, s) {
  const c = cells(x, y, 16, s, 0.45), e = c.d2 - c.d1;
  if (e < 0.9) { MATX = R[c.ox < 0 ? 6 : 1]; return -9; }
  let l = 2.9 + (c.id - 0.5) * 1.4 - c.ox * 0.16 + cg(x, y, s + 1) * 0.25;
  if (e < 2.2) l += c.ox < 0 ? 1.1 : -0.8;
  if (Math.abs(c.ox - c.oy * 0.15 + (c.id - 0.5) * 4) < 0.5 && c.d1 < 6) l += 1.4;
  if (hash2(x, y, s + 2) < 0.004) { MATX = R[6]; return -9; }
  MATX = R[Math.max(1, Math.min(5, Math.round(l)))]; return -9;
}
const vSangue = (x, y) => prismV(x, y, SANGR, 25211);
const vCristal = (x, y) => prismV(x, y, LUAR, 25221);
function vPoco(x, y) {   // pedra-do-poço: lajes grandes chanfradas, grão fino, e as runas de lua gravadas que brilham fraco
  let v = 2.6 + cn(x, y, 30, 30, 25231) * 1.1 + cn(x, y, 80, 80, 25232) * 0.5 + cg(x, y, 25233) * 0.45;
  const c = cells(x, y, 30, 25234, 1.25), e = c.d2 - c.d1;
  if (e < 1.0) return 0.5 + cg(x, y, 25235) * 0.3;
  if (e < 2.2) v += c.ox + c.oy < 0 ? 0.8 : -0.7;
  v += (c.id - 0.5) * 0.7;
  const X = wrapT(x), Y = wrapT(y), bx = Math.floor(X / 12), by = Math.floor(Y / 12), hr = hash2(bx, by, 25236);
  if (hr < 0.16) {
    const k = (hr * 50 | 0) % RUNES.length, ox = 3 + ((hr * 300) | 0) % 5, oy = 3 + ((hr * 700) | 0) % 4, lx = X % 12 - ox, ly = Y % 12 - oy;
    if (runeAt(k, lx, ly)) { MATX = MOONG[hr < 0.05 ? 3 : 2]; return -9; }
    if (runeAt(k, lx - 1, ly - 1) || runeAt(k, lx, ly - 1)) v -= 0.9;
  }
  if (hash2(x, y, 25237) < 0.003) { MATX = MOONG[1]; return -9; }
  return v;
}
function vRaizMae(x, y) {   // raiz-mãe: casca prateada em feixes torcidos, sulcos fundos e neles a seiva azul acesa
  const b = cn(x, y, 4, 4, 25241), dir = b > 0 ? 1 : -1, u = wrapT(x + cn(x, y, 6, 6, 25242) * 34 + dir * y * 0.35), r = u % 7;
  if (Math.abs(b) < 0.01) return 0.4;
  let v;
  if (r < 1.2) {   // o sulco: a seiva corre em trechos, acesa
    const sap = cn(x, y, 24, 6, 25243);
    if (sap > -0.02) { MATX = MOONG[sap > 0.12 ? 4 : sap > 0.05 ? 3 : 2]; return -9; }
    return 0.5 + cg(x, y, 25244) * 0.3;
  }
  v = r < 2.2 ? 3.9 : r < 4.5 ? 3.0 : r < 6 ? 2.3 : 1.6;
  if (Math.abs(b) < 0.025) v -= 0.8;
  v += cn(x, y, 24, 24, 25245) * 0.9 + cg(x, y, 25246) * 0.32;
  if (hash2(x, y, 25247) < 0.02) v -= 1;
  return v;
}
function vEspelho(x, y) {   // espelho d'água: escuro e liso, faixas largas e macias, linhas de brilho deitadas que se partem
  const Y = wrapT(y);
  let v = 1.5 + cn(x, y, 4, 30, 25251) * 0.7 + cg(x, y, 25252) * 0.06 - (Y % 12) * 0.03;
  const s = Math.sin(y * W2 * 40 + cn(x, y, 6, 6, 25253) * 3);
  if (s > 0.96) { const d = cn(x, y, 24, 40, 25254); if (d > 0.04) v = d > 0.14 ? 4.6 : 3.4; else if (d > -0.04) v = 2.4; }
  else if (s > 0.85) v += 0.35;
  if (hash2(x, y, 25255) < 0.0018) v = 4.2;                                                             // uma estrela refletida
  return v;
}
function vLua(x, y) {   // a Lua Presa: prata quase branca, mares mais escuros, crateras com a borda acesa em cima à esquerda
  let v = 4.0 + cn(x, y, 8, 8, 25261) * 0.8 + cn(x, y, 30, 30, 25262) * 0.4 + cg(x, y, 25263) * 0.18;
  const m = cn(x, y, 4, 4, 25264) + cn(x, y, 12, 12, 25265) * 0.4; if (m > 0.08) v -= Math.min(1.4, (m - 0.08) * 6);
  const c = cells(x, y, 20, 25266, 1);
  if (c.id < 0.75) {
    const r = 1.6 + c.id * 8;
    if (c.d1 < r) { const q = c.ox + c.oy; if (c.d1 > r - 1.2) v += q < 0 ? 0.9 : -0.6; else v += -0.6 + (q < 0 ? -0.6 : 0.5) * (c.d1 / r); }
    else if (c.d1 < r + 1.5) v += 0.25;
  }
  if (hash2(x, y, 25267) < 0.004) v += 1;
  return v;
}
function vVeu(x, y) {   // o véu de luar (ícone e mapa): fios verticais de luz
  const X = wrapT(x); return 1.5 + (X % 3 === 0 ? 2.8 : 0) + Math.sin(y * W2 * 20 + X) * 0.6 + cg(x, y, 25271) * 0.5;
}

/* ---- paredes de fundo (só o tom) ---- */
function vMataW(x, y) {   // terra e raízes: a terra escura, as raízes de prata apagadas descendo em fios
  const v = vSolo(x, y); let w = v === -9 ? 3.1 : v - 0.2;
  const r = Math.abs(cn(wrapT(x + cn(x, y, 12, 4, 25281) * 30), y, 20, 2, 25282));
  if (r < 0.02) w = r < 0.008 ? 3.6 : 2.6;
  return w;
}
/* painel lavrado: placas de 24 x 48 com moldura; dentro, um arco élfico (ponta em cima) rebaixado com uma folha em
   relevo, ou uma faixa de ramo; pilastras entre as placas */
function salaoPanel(x, y, s) {
  const X = wrapT(x), Y = wrapT(y), lx = X % 24, ly = Y % 48, h = hash2(Math.floor(X / 24), Math.floor(Y / 48), s);
  if (lx === 0 || ly === 0) return 0.7;
  let v = 2.9 + cn(x, y, 40, 40, s + 1) * 0.5 + cg(x, y, s + 2) * 0.3;
  if (lx === 1 || ly === 1) v += 1.0; else if (lx === 23 || ly === 47) v -= 0.8;
  if (ly === 44) v += 0.8; else if (ly === 45) v -= 0.7;                                                 // o rodapé
  const hw = ly >= 18 ? 7 : ly >= 7 ? 7 * Math.sqrt(1 - Math.pow((18 - ly) / 11, 1.6)) : -1;
  const ax = Math.abs(lx + 0.5 - 12);
  if (ly <= 41 && hw > 0 && ax < hw) {
    let r = 1.7 + cn(x, y, 20, 20, s + 3) * 0.4 + cg(x, y, s + 4) * 0.2;
    const hwU = ly - 1 >= 7 ? (ly - 1 >= 18 ? 7 : 7 * Math.sqrt(1 - Math.pow((18 - ly + 1) / 11, 1.6))) : -1;
    if (ax > hw - 1 && lx < 12) r -= 0.6; else if (ax > hw - 1) r += 0.6;                                // o lado do arco
    if (hwU < 0 || ax >= hwU) r -= 0.7;                                                                 // a sombra do alto do arco
    if (ly === 41) r += 0.9;
    if (h < 0.6) {   // a folha em relevo
      const u = ly + 0.5 - 27, w = lx + 0.5 - 12;
      if (leafIn(u, w, 9, 3)) { r = 3.3 + (w < 0 ? 0.5 : -0.3) - u * 0.03; if (Math.abs(w) < 0.5) r = 2.3; if (!leafIn(u - 1, w + 1, 9, 3)) r += 0.8; else if (!leafIn(u + 1, w - 1, 9, 3)) r -= 0.9; }
      else if (Math.abs(w) < 0.5 && u > 9 && u < 13) r = 3.0;                                          // o pé da folha
    } else {   // a estrela de oito pontas
      const dx = lx + 0.5 - 12, dy = ly + 0.5 - 27, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy), sp = 2.2 + Math.pow(Math.abs(Math.cos(a * 4)), 6) * 3.4;
      if (d < sp) r = 3.4 - (dx + dy) * 0.08 + (d < 1.2 ? 0.8 : 0);
    }
    return r;
  }
  if (hw > 0 && ax >= hw && ax < hw + 1.2 && ly <= 41) v += lx < 12 ? 0.8 : -0.5;                        // o friso em volta do arco
  return v;
}
const vSalaoW = (x, y) => salaoPanel(x, y, 25291) - 0.1;
function vProfanoW(x, y) {   // ruína profanada: os mesmos painéis, rachados, lascados, manchados de vinho
  let v = salaoPanel(x, y, 25301) - 0.2;
  const st = cn(x, y, 8, 6, 25302) + cn(x, y, 24, 24, 25303) * 0.5; if (st > 0.05) v -= Math.min(1.6, (st - 0.05) * 6);
  const cr = Math.abs(cn(x, y, 10, 10, 25304)); if (cr < 0.006) return 0.2; if (Math.abs(cn(x, y - 1, 10, 10, 25304)) < 0.006) v += 0.7;
  const ch = cells(x, y, 24, 25305, 1); if (ch.id < 0.18 && ch.d1 < 5) v = 1.2 + cg(x, y, 25306) * 0.6 - (ch.ox + ch.oy) * 0.08;   // um pedaço lascado
  return v;
}
function vPocoW(x, y) { const v = vPoco(x, y); return v === -9 ? (MATX === MOONG[1] ? 3.2 : 5.1) : v - 0.3; }
function vFolhasW(x, y) {   // cortina de folhas: a copa escura por trás, folhas penduradas em fios, sem brilho
  const f = hangLeaf(x, y, 8, 25311, 0.7, 0.8);
  if (leafIn(f.u, f.w, 5, 1.8)) { let v = 2.9 + (f.w > 0 ? -0.5 : 0.5) + cn(x, y, 24, 24, 25312) * 0.6 + cg(x, y, 25313) * 0.2; if (Math.abs(f.w) < 0.4) v += 0.6; return v; }
  const X = wrapT(x); if (X % 8 === 3 && cn(x, y, 30, 6, 25314) > -0.1) return 2.2;                    // o fio do ramo
  return 1.0 + cn(x, y, 16, 16, 25315) * 0.6 + cg(x, y, 25316) * 0.2;
}

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpMata(x, y) {   // a mata ao longe: troncos de prata enormes em duas fileiras e, entre eles, o luar da Lua Presa
  const gd = Math.hypot(x - 160, (y - 100) * 1.05);
  let v = 0.5 + cn(x, y, 12, 12, 25321) * 0.5 + cg(x, y, 25322) * 0.15, glow = 0;
  if (gd < 17) return gd > 15.8 ? 4.4 : 5 - (cn(x, y, 24, 24, 25323) > 0.12 ? 0.6 : 0) - (Math.hypot(x - 160 + 6, y - 100 + 6) > 19 ? 0.6 : 0);   // a lua
  if (gd < 88) { glow = (1 - (gd - 17) / 71); glow = Math.pow(glow, 1.6); v = Math.max(v, 0.7 + glow * 3.6 + cg(x, y, 25324) * 0.6); }
  const trunk = (off, slot, s, tone) => {
    const xx = wrapT(x + off), k = Math.floor(xx / slot), lx = xx - k * slot, cx = slot / 2 + (hash2(k, 0, s) - 0.5) * slot * 0.3, hw = slot * (0.16 + hash2(k, 1, s) * 0.14) + Math.sin(y * W2 * 2 + k) * 1.5, ux = lx - cx;
    if (Math.abs(ux) >= hw || Math.abs(wrapD(k * slot + cx - off - 160)) < slot * (0.16 + hash2(k, 1, s) * 0.14) + 19) return -1;   // a clareira onde a lua aparece
    const q = ux / hw, side = (x + off - xx) + k * slot + cx < 160 ? 1 : -1;
    let t = tone - q * 0.4 + (Math.sin(ux * 1.3 + cn(x, y, 4, 2, s + 1) * 6) > 0.7 ? -0.4 : 0) + cg(x, y, s + 2) * 0.2;
    if (glow > 0.05 && q * side > 0.7) t += glow * 2.4;                                                  // o lado que a lua acende
    else if (glow > 0.2) t -= glow * 0.8;                                                                // contra a luz, escuro
    return t;
  };
  const near = trunk(0, 80, 25325, 3.0); if (near >= 0) return near;
  const far = trunk(40, 48, 25326, 2.1); if (far >= 0) return Math.min(far, glow > 0.3 ? 1.2 : 9);
  return v;
}
function vDpSaloes(x, y) {   // os salões ao longe: arcadas de pedra branca, uma ponte sem corrimão, torres finas com a ponta aguda
  const by = wrapT(y) % 120, band = Math.floor(wrapT(y) / 120), X = wrapT(x + band * 60);
  let v = 0.5 + cn(x, y, 10, 10, 25331) * 0.4 + cg(x, y, 25332) * 0.15;
  // as torres: uma a cada 80, com janelinha acesa
  const tx = X % 80, tk = Math.floor(X / 80), tcx = 40 + (hash2(tk, band, 25333) - 0.5) * 30, top = 14 + hash2(tk, band, 25334) * 20, thw = 3 + hash2(tk, band, 25335) * 2;
  if (by >= top && by < 74) {
    const ax = Math.abs(tx + 0.5 - tcx), hw = by < top + 12 ? thw * (by - top) / 12 : thw;
    if (ax < hw) { if (by > top + 16 && by < top + 21 && ax < 1) return 5; return (tx < tcx ? 3.6 : 2.6) + (by === Math.round(top + 12) ? 0.8 : 0) + cg(x, y, 25336) * 0.2; }
  }
  if (by >= 74 && by < 78) return by === 74 ? 4.2 : by === 77 ? 2.2 : 3.2;                                 // a ponte
  if (by >= 78 && by < 120) {   // os arcos por baixo
    const ax = X % 30, d = Math.abs(ax + 0.5 - 15), ay = by - 78;
    if (d > 12) return ax < 15 ? 3.3 : 2.5;                                                               // o pilar
    const hw = ay >= 12 ? 12 : 12 * Math.sqrt(1 - Math.pow((12 - ay) / 12, 1.6));
    if (d >= hw) return 3.0 - ay * 0.02 + (d < hw + 1 ? (ax < 15 ? -0.6 : 0.6) : 0);
    return v + 0.3;
  }
  return v;
}
const DPR = [[40, 1, 0.7, 26, 15], [120, 2, 2.3, 18, 9], [190, 1, 4.1, 30, 12], [86, 3, 1.1, 8, 5]];   // [centro, ondas, fase, amplitude, meia grossura]
function vDpRaizes(x, y) {   // as raízes da Árvore-Mãe ao longe: troncos de raiz descendo, redondos, fibras, a seiva azul em fios
  let v = 0.7 + cn(x, y, 12, 12, 25341) * 0.5 + cg(x, y, 25342) * 0.18;
  for (const [c0, n, p, A, th] of DPR) {
    const d = wrapD(x - (c0 + Math.sin(y * W2 * n + p) * A)), q = d / th;
    if (Math.abs(q) < 1) {
      v = (Math.abs(q) > 0.88 ? 0.6 : 2.7 - q * 1.0 - q * q * 1.0) + Math.sin(y * W2 * 30 + q * 5 + c0) * 0.3 + cg(x, y, 25343) * 0.25;
      if (Math.abs(q - 0.15 + Math.sin(y * W2 * 4 + c0) * 0.4) < 0.07 && cn(x, y, 6, 12, 25344 + c0) > 0) v = 5;   // a seiva
    }
  }
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  solo: bake(vSolo), madeira: bake(vMadeira), folhagem: bake(vFolhagem), marmore: bake(vMarmore), lavrada: bake(vLavrada), tabua: bake(vTabua), profano: bake(vProfano),
  morta: bake(vMorta), sangue: bake(vSangue), poco: bake(vPoco), raiz: bake(vRaizMae), cristal: bake(vCristal), espelho: bake(vEspelho), lua: bake(vLua), veu: bake(vVeu),
  mataW: bake(vMataW), salaoW: bake(vSalaoW), profanoW: bake(vProfanoW), pocoW: bake(vPocoW), folhasW: bake(vFolhasW),
  dpMata: bake(vDpMata), dpSaloes: bake(vDpSaloes), dpRaizes: bake(vDpRaizes)
};
const EL_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [EL_SOLO, 'elSolo', 'solo', 0.6, '#2e2630'], [EL_MADEIRA, 'elMadeira', 'madeira', 0.9, '#7e8796'], [EL_FOLHAGEM, 'elFolhagem', 'folhagem', 0.25, '#4a7a9c'],
  [EL_MARMORE, 'elMarmore', 'marmore', 1.4, '#ced7e6'], [EL_LAVRADA, 'elLavrada', 'lavrada', 1.5, '#8a93a6'], [EL_TABUA, 'elTabua', 'tabua', 0.7, '#c2b08e'],
  [EL_PROFANO, 'elProfano', 'profano', 1.4, '#7a444c'], [EL_MORTA, 'elMorta', 'morta', 0.9, '#2d2630'], [EL_CRISTAL_SANGUE, 'elSangue', 'sangue', 1.6, '#e04a5a'],
  [EL_PEDRA_POCO, 'elPoco', 'poco', 1.5, '#2a525c'], [EL_RAIZ, 'elRaiz', 'raiz', 1.5, '#929bab'], [EL_CRISTAL_LUA, 'elCristal', 'cristal', 1.6, '#b0d0f4'],
  [EL_ESPELHO, 'elEspelho', 'espelho', 0, '#3e5e80'], [EL_LUA, 'elLua', 'lua', 0, '#ffffff']
];
for (const [t, p, k, dig, col] of EL_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [EL_SOLO, EL_MARMORE, EL_PROFANO, EL_PEDRA_POCO]) BLEND[t] = 1;
EMIT[EL_FOLHAGEM] = 0.14; EMIT[EL_CRISTAL_SANGUE] = 0.6; EMIT[EL_PEDRA_POCO] = 0.1; EMIT[EL_RAIZ] = 0.16; EMIT[EL_CRISTAL_LUA] = 0.64; EMIT[EL_ESPELHO] = 0.14; EMIT[EL_LUA] = 1.0;

WMAT[WEL_MATA] = [PALS.elMataW, BKV.mataW]; WMAT[WEL_SALAO] = [PALS.elSalaoW, BKV.salaoW]; WMAT[WEL_PROFANO] = [PALS.elProfanoW, BKV.profanoW];
WMAT[WEL_POCO] = [PALS.elPocoW, BKV.pocoW]; WMAT[WEL_FOLHAS] = [PALS.elFolhasW, BKV.folhasW];
DMAT[DP_EL_MATA] = [PALS.dpElMata, BKV.dpMata]; DMAT[DP_EL_SALOES] = [PALS.dpElSaloes, BKV.dpSaloes]; DMAT[DP_EL_RAIZES] = [PALS.dpElRaizes, BKV.dpRaizes];

/* ---- os minérios: carvão no solo, e a lunarita: lascas branco-azuladas em crescente que brilham, no mármore ---- */
oreRamp(EL_O_LUNARITA, ['#16243e', '#2c4468', '#4a6e9a', '#7a9ecc', '#b0ccec', '#e2eefc', '#ffffff']);
const LUN_TIP = new Map();   // semente do bloco -> a ponta da lasca maior (onde a estrelinha pisca, ao vivo)
ORE_PAINT[EL_O_LUNARITA] = function (L, s) {
  const R = ORE_RAMP[EL_O_LUNARITA], n = 1 + (hash2(s, 1, 25401) < 0.75 ? 1 : 0) + (hash2(s, 5, 25401) < 0.35 ? 1 : 0);
  let tip = null, best = -9;
  for (let i = n - 1; i >= 0; i--) {   // as pequenas primeiro, a grande na frente
    const big = i === 0, cx = big ? 4.6 + hash2(s, 2, 25402) * 2.8 : 2.6 + hash2(s, 2 + i, 25402) * 6.8, cy = big ? 4.6 + hash2(s, 3, 25403) * 2.8 : 2.6 + hash2(s, 3 + i, 25403) * 6.8;
    const r = big ? 3.5 + hash2(s, i, 25404) * 0.9 : 1.9 + hash2(s, i, 25404) * 0.6, a = hash2(s, i, 25405) * 6.2832, ox = Math.cos(a) * r * 0.6, oy = Math.sin(a) * r * 0.6, ri = r * 0.86;
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), d2 = Math.hypot(dx - ox, dy - oy);
      if (d > r || d2 < ri) continue;
      let l = 3.2 - (dx + dy) / r * 1.3 + (hash2(x + s, y, 25406) - 0.5) * 0.5;
      if (d > r - 0.8) l += dx + dy < 0 ? 1.1 : -0.9;                                                   // a borda de fora
      else if (d2 < ri + 0.9) l += 1.3;                                                                   // o fio de dentro, claro
      L.put(x, y, ramp(R, Math.min(l, R.length - 2)), l);
      if (big && l > best) { best = l; tip = [x, y]; }
    }
  }
  if (tip) L.put(tip[0], tip[1], R[6], 9);
  for (let i = 0; i < 2; i++) { const x = 1 + (hash2(s, i, 25407) * 10 | 0), y = 1 + (hash2(s, i, 25408) * 10 | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[4 + i], 1); }   // pó de lunarita
  LUN_TIP.set(s, tip);
};
ORE_HALO[EL_O_LUNARITA] = { pal: ['elMarmore', '#5a8ad0', 0.3, 0.12], shade: 0.3 };
ORE_PAINT[EL_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[EL_O_CARVAO] = { pal: ['elSolo', '#020204', 0.5, 0.2], shade: 0 };
MAT[EL_O_CARVAO] = [PALS.elSolo, bakeOre(EL_O_CARVAO, vSolo)]; MAT[EL_O_LUNARITA] = [PALS.elMarmore, bakeOre(EL_O_LUNARITA, vMarmore)];
for (const t of [EL_O_CARVAO, EL_O_LUNARITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[EL_O_CARVAO] = DIG[COAL]; ORE_XP[EL_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[EL_O_CARVAO] = ORE_NAME[COAL]; PCOL[EL_O_CARVAO] = PCOL[COAL]; ORE_ITEM[EL_O_CARVAO] = ORE_ITEM[COAL];
DIG[EL_O_LUNARITA] = 1.8; ORE_XP[EL_O_LUNARITA] = 23; ORE_NAME[EL_O_LUNARITA] = 'Lunarita'; PCOL[EL_O_LUNARITA] = '#b0ccec'; ORE_ITEM[EL_O_LUNARITA] = 'min_lunarita';
EMIT[EL_O_LUNARITA] = 0.3;
const lunTip = (gx, gy) => LUN_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + EL_O_LUNARITA * 7919) | 0);

/* ---- itens de bloco ---- */
const EL_ITEMS = {
  solo_elfico: ['Solo Élfico', EL_SOLO, 'Terra escura e fofa da Mata de Prata, cheia de fiozinhos de raiz que brilham como prata.'],
  madeira_prata: ['Madeira Prateada', EL_MADEIRA, 'Casca cinza-prata, lisa e fria. As árvores de onde ela vem nunca viram o sol.'],
  marmore_lua: ['Mármore-Lua', EL_MARMORE, 'Pedra branco-azulada com veios de prata. Os elfos lavraram salões inteiros nela.'],
  pedra_lavrada: ['Pedra Lavrada', EL_LAVRADA, 'Bloco de mármore com ramos e folhas em relevo e um filete de prata embutido.'],
  tabua_elfica: ['Tábua Élfica', EL_TABUA, 'Tábua clara e curva dos flets e das pontes. Leve, firme, e não range.'],
  marmore_profano: ['Mármore Profanado', EL_PROFANO, 'O mármore da Corte, rachado e manchado de vinho. Os veios viraram ouro velho.'],
  madeira_morta: ['Madeira Morta', EL_MORTA, 'Madeira preta e retorcida. Nas rachaduras ainda escorre uma seiva carmesim.'],
  pedra_poco: ['Pedra-do-Poço', EL_PEDRA_POCO, 'Pedra azul-petróleo do fundo do reino. As runas de lua gravadas nela ainda brilham.'],
  raiz_mae: ['Raiz-Mãe', EL_RAIZ, 'Um pedaço da raiz da Árvore-Mãe. A seiva azul ainda corre acesa pelos sulcos.']
};
for (const id in EL_ITEMS) { const [name, block, desc] = EL_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
// folha_prata é material (o 257 dá o ícone, o preço e quem compra) e também o bloco de Folhagem Lunar
ITEMS.folha_prata = Object.assign(ITEMS.folha_prata || {}, { name: (ITEMS.folha_prata && ITEMS.folha_prata.name) || 'Folha de Prata', rar: (ITEMS.folha_prata && ITEMS.folha_prata.rar) || 0, stack: 99, block: EL_FOLHAGEM,
  desc: (ITEMS.folha_prata && ITEMS.folha_prata.desc) || 'Folha azul-prata da copa das árvores do reino. Não murcha nunca, e brilha fraquinho.' });
BLOCK_DROP[EL_FOLHAGEM] = 'folha_prata';
// os cristais, o espelho, o véu e a lua não soltam nada

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRE = {
  prata: ['#1a1e26', '#363c48', '#5a6270', '#848e9c', '#aeb8c6', '#d6dee8', '#ffffff'],
  casca: ['#16181e', '#2a2e38', '#444a56', '#626a78', '#868e9c', '#acb4c0', '#d4dae4'],
  lua: ['#0e1a36', '#1c3260', '#2e5090', '#4c7cc0', '#7eaae4', '#b8d6f8', '#f0f8ff'],
  madeira: ['#2a2016', '#4a3a28', '#6e5a40', '#94805e', '#b8a47e', '#d8c8a4', '#f2e8cc'],
  folha: ['#0a1820', '#142c36', '#204650', '#2e6068', '#448084', '#64a2a2', '#9ccccc'],
  folhaPrata: ['#101c28', '#1e3246', '#304c66', '#4a6a88', '#6e90ac', '#9cb8d0', '#d6e6f4'],
  carmesim: ['#1a0408', '#3a0a12', '#640f1e', '#921a2c', '#c22c3e', '#e85e6c', '#ffb0b4'],
  ouro: ['#2a1a06', '#4e320a', '#7a5410', '#a87a1c', '#d0a232', '#ecc862', '#fff0b4'],
  marmore: ['#363e4c', '#566070', '#7a8496', '#a0aaba', '#c4ccd8', '#e2e8f0', '#ffffff'],
  morta: ['#040306', '#0a080c', '#121016', '#1c1820', '#26202a', '#322a36', '#403644'],
  branco: ['#3e4656', '#6a7488', '#98a2b4', '#c0c8d6', '#dee4ee', '#f2f6fa', '#ffffff'],
  pedra: ['#08141a', '#10242c', '#1a3640', '#284c56', '#3a646e', '#548088', '#78a0a8'],
  seca: ['#2a2418', '#4a4030', '#6e6450', '#948a72', '#b8b098', '#d8d2be', '#f2eee2']
};
for (const k in DRE) DRE[k] = DRE[k].map(h => ph(h));
const P = DRE.prata, LU = DRE.lua;
// um prisma inclinado saindo de um ponto (o lado da esquerda aceso, o da direita escuro, a aresta do meio clara)
function sprPrism(a, rx0, ry0, ang, len, hw, R) {
  const ux = Math.sin(ang), uy = -Math.cos(ang), nx = -uy, ny = ux;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const px = x + 0.5 - rx0, py = y + 0.5 - ry0, al = px * ux + py * uy, pe = px * nx + py * ny;
    if (al < -0.6 || al > len) continue;
    const w = hw * Math.min(1, (len - al) / (hw * 1.25)); if (Math.abs(pe) > w + 0.15) continue;
    let l = pe < -0.35 ? 4.3 : pe > 0.35 ? 2.2 : 5.2; if (al > len - 1.6) l += 0.7; if (al < 1.2) l -= 1.1;
    a.put(x, y, R, l);
  }
  return [Math.round(rx0 + ux * (len - 0.8) - 0.5), Math.round(ry0 + uy * (len - 0.8) - 0.5)];
}

/* a escada de corda: duas cordas de prata torcidas, degraus de tábua clara amarrados; o topo preso numa travessa de
   madeira, o pé com as pontas das cordas desfiadas */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), W = DRE.madeira, y0 = k === 1 ? 2 : 0, y1 = k === 2 ? 8 : 11;
  for (let y = y0; y <= y1; y++) for (const x0 of [2, 9]) { a.put(x0, y, P, (y + s) % 3 === 0 ? 5.6 : 4.4); a.put(x0 + 1, y, P, (y + s) % 3 === 1 ? 3.6 : 2.2); }
  const rungs = k === 2 ? [2, 6] : [3, 9];
  for (const ry of rungs) {
    for (let x = 3; x <= 9; x++) { a.put(x, ry, W, 5 - (x - 3) * 0.12 + cg(x, ry, s) * 0.3); a.put(x, ry + 1, W, 2.8 - (x - 3) * 0.1); }
    for (const x0 of [2, 9]) { a.put(x0, ry, P, 6); a.put(x0 + 1, ry, P, 5); a.put(x0, ry + 1, P, 3.4); a.put(x0 + 1, ry + 1, P, 2.6); a.put(x0, ry - 1, P, 4.8); }   // a amarração
  }
  if (k === 1) { for (let x = 0; x < 12; x++) { a.put(x, 0, W, 5.2 - x * 0.15); a.put(x, 1, W, 3.2 - x * 0.12); } for (const x0 of [2, 9]) { a.put(x0, 0, P, 5.6); a.put(x0 + 1, 0, P, 4); a.put(x0 + 1, 1, P, 3); } }
  if (k === 2) for (const x0 of [2, 9]) { a.put(x0 - 1, 10, P, 3.6); a.put(x0, 9, P, 4.6); a.put(x0, 10, P, 4); a.put(x0 + 1, 10, P, 2.8); a.put(x0 - 1, 11, P, 3); a.put(x0 + 1, 11, P, 2.4); a.put(x0 + 2, 11, P, 2); }
  return rimOut(a, P[0], false);
}
const ESCADA = [escadaSprite(0, 25501), escadaSprite(1, 25502), escadaSprite(2, 25503)];
/* o cipó prateado: o caule fino ondulando, folhinhas azuis alternadas; o último termina num caracol com um botão */
function cipoSprite(end, s) {
  const a = spr(), F = DRE.folhaPrata, len = end ? 8 : 12, cxAt = y => 5.5 + Math.sin(y * 0.52 + s) * 1.4;
  for (let y = 0; y < len; y++) { const x = Math.round(cxAt(y)); a.put(x, y, P, 4.6 + cg(x, y, s) * 0.4); a.put(x + 1, y, P, 2.6); }
  for (let y = 1 + (s & 1); y < len - 1; y += 3) {   // as folhinhas
    const x = Math.round(cxAt(y)), side = ((y + s) >> 1) & 1 ? 1 : -1, bx = side > 0 ? x + 2 : x - 1;
    a.put(bx, y, F, side < 0 ? 5 : 3.6); a.put(bx + side, y, F, side < 0 ? 4.2 : 3); a.put(bx + side, y + 1, F, side < 0 ? 3.4 : 2.2); a.put(bx, y + 1, F, 2.8); a.put(bx + side * 2, y + 1, F, side < 0 ? 4.6 : 2.6);
  }
  if (end) { const x = Math.round(cxAt(7)); for (const [dx, dy, v] of [[0, 8, 4.4], [-1, 9, 4], [-1, 10, 3.4], [0, 11, 3], [1, 10, 2.6], [1, 9, 3.6]]) a.put(x + dx, dy, P, v); a.put(x, 9, DRE.lua, 5.6); a.put(x, 10, DRE.lua, 4.4); }
  return rimOut(a, P[0], false);
}
const CIPO = [cipoSprite(false, 25511), cipoSprite(false, 25512), cipoSprite(true, 25513)];
/* a lanterna élfica: um fio de prata, a coroa em folha, a gaiola em gota (ponta em cima, redonda embaixo) com três
   costelas de prata e o vidro azul aceso; a chama azul-branca no meio (ela tremula ao vivo) */
const LAN_F = [5, 8];
const LAN_HW = [0.8, 1.7, 2.5, 3.1, 3.4, 3.4, 3.0, 2.0];   // meia largura da gota, da linha 4 à 11
function lanternaSprite(k, s) {
  const a = spr();
  for (let y = 0; y < 3; y++) { a.put(5, y, P, (y + k) % 2 ? 4.4 : 3); a.put(6, y, P, (y + k) % 2 ? 2.4 : 3.6); }
  a.put(4, 3, P, 5); a.put(5, 3, P, 5.6); a.put(6, 3, P, 4.4); a.put(7, 3, P, 3); a.put(3, 4, P, 3.6); a.put(8, 4, P, 2.2);   // a coroa
  for (let y = 4; y < 12; y++) {
    const hw = LAN_HW[y - 4];
    for (let x = 0; x < 12; x++) {
      const dx = x + 0.5 - 6; if (Math.abs(dx) > hw) continue;
      const q = dx / hw;
      if (Math.abs(q) > 0.72 || y === 11) a.put(x, y, P, (q < 0 ? 5.2 : 3) - (y === 11 ? 0.8 : 0));       // a armação
      else if (Math.abs(Math.abs(q) - 0.36) < 0.16 && k === 0 && y > 5 && y < 10) a.put(x, y, P, q < 0 ? 4.6 : 3.4);   // as costelas
      else { const d = Math.hypot(x + 0.5 - (LAN_F[0] + 1), (y + 0.5 - (LAN_F[1] + 0.5)) * 0.8); a.put(x, y, LU, 6.2 - d * 1.3 - (q > 0 ? 0.5 : 0)); }
    }
  }
  pp(a, LAN_F[0], LAN_F[1], ph('#ffffff')); pp(a, LAN_F[0] + 1, LAN_F[1], LU[6]); pp(a, LAN_F[0], LAN_F[1] - 1, LU[6]);
  if (k === 1) { pp(a, 3, 7, P[6]); pp(a, 8, 7, P[3]); }
  return rimOut(a, P[0], false);
}
const LANTERNA = [lanternaSprite(0, 25521), lanternaSprite(1, 25522)];
/* a flor-da-lua: caule, duas folhas compridas e o botão fechado branco-azulado; as pétalas abrem e fecham ao vivo */
const FLOR_C = [[6, 3], [6, 5], [5, 3], [5, 5]];
function florSprite(v, s) {
  const a = spr(), F = DRE.folha, W = DRE.branco, [cx, cy] = FLOR_C[v & 1];
  for (let y = 11; y > cy + 1; y--) { const x = Math.round(cx + Math.sin((11 - y) * 0.45 + s) * 0.6); a.put(x, y, F, 4.4 - (11 - y) * 0.05); }
  for (const [dir, len] of [[-1, 4], [1, 3]]) for (let i = 1; i <= len; i++) { const x = cx + dir * i, y = 11 - Math.round(Math.sqrt(i) * 1.4); a.put(x, y, F, (dir < 0 ? 5.2 : 3.4) - i * 0.25); if (i < len) a.put(x, y + 1, F, dir < 0 ? 3.2 : 2.2); }
  a.put(cx, cy - 1, W, 5.6); a.put(cx, cy, W, 4.8); a.put(cx + 1, cy, W, 3.4); a.put(cx - 1, cy, W, 5.2); a.put(cx, cy + 1, W, 3.8); a.put(cx + 1, cy + 1, W, 2.6); a.put(cx - 1, cy + 1, W, 4.2);   // o botão em gota
  pp(a, cx, cy - 2, W[4]); pp(a, cx, cy, LU[5]);
  a.put(cx - 1, cy + 2, F, 4.6); a.put(cx + 1, cy + 2, F, 3); a.put(cx, cy + 2, F, 3.8);                  // as sépalas
  const r = rimOut(a, F[0]);
  return v & 2 ? flipX(r) : r;
}
const FLOR = [florSprite(0, 25531), florSprite(1, 25532)];
/* a samambaia prateada: frondes em arco saindo do pé, os folíolos alternados, a ponta enrolada no broto */
function samambaiaSprite(v, s) {
  const a = spr(), F = DRE.folhaPrata;
  // frondes: arcos saindo do pé, subindo e caindo para fora como uma fonte; os folíolos são tracinhos dos dois lados
  const fr = v === 0 ? [[-1, 5.4, 1.2, 9.2], [1, 5.2, 2.2, 8.6], [-0.3, 1.6, 0.6, 2.4], [0.6, 3.0, 4.6, 6.8]] : [[-1, 4.8, 2.6, 7.6], [1, 5.4, 1.0, 9.4], [0.3, 1.8, 0.8, 2.6], [-0.7, 3.2, 5.0, 7.2]];
  for (const [dir, reach, top, endY] of fr) {
    const x0 = 5.5, y0 = 11.8, x1 = 5.5 + dir * reach * 0.5, y1 = top - 1.5, x2 = 5.5 + dir * reach, y2 = endY;
    const seen = new Set();
    let n = 0;
    for (let t = 0; t <= 1.0001; t += 0.03) {
      const u = 1 - t, px = u * u * x0 + 2 * u * t * x1 + t * t * x2, py = u * u * y0 + 2 * u * t * y1 + t * t * y2, X = Math.floor(px), Y = Math.floor(py), key = X * 16 + Y;
      if (seen.has(key)) continue; seen.add(key); n++;
      a.put(X, Y, F, 4.4 - t * 0.8 + (dir < 0 ? 0.4 : 0));
      if (t > 0.25 && t < 0.92 && n % 2 === 0) {   // os folíolos: um em cima, um embaixo do ráquis
        const tx = 2 * u * (x1 - x0) + 2 * t * (x2 - x1), ty = 2 * u * (y1 - y0) + 2 * t * (y2 - y1);
        if (Math.abs(ty) > Math.abs(tx)) { pp(a, X - 1, Y, F[5]); pp(a, X + 1, Y, F[3]); } else { pp(a, X, Y - 1, F[5]); pp(a, X, Y + 1, F[2]); }
      }
    }
    pp(a, Math.floor(x2), Math.floor(y2), F[6]);
  }
  return rimOut(a, F[0]);
}
const SAMAMBAIA = [samambaiaSprite(0, 25541), samambaiaSprite(1, 25542), flipX(samambaiaSprite(0, 25543)), flipX(samambaiaSprite(1, 25544))];
/* a pedra rúnica: pedrinha em pé de topo redondo, um pouco de musgo azul no pé, a runa gravada e acesa (pulsa ao vivo) */
const RUNA_PX = [];
function runaSprite(k, s) {
  const a = spr(), S = DRE.pedra, M = DRE.folha;
  for (let y = 3; y < 12; y++) for (let x = 2; x <= 9; x++) {
    const dx = (x + 0.5 - 6) / 3.6, top = y < 6 ? Math.hypot(dx, (y + 0.5 - 6) / 3) : Math.abs(dx);
    if (top > 1 || (y === 11 && (x === 2 || x === 9))) continue;
    a.put(x, y, S, 4 - dx * 1.4 - (y - 3) * 0.12 + cg(x, y, s) * 0.5 + (top > 0.82 && dx < 0 ? 0.7 : 0));
  }
  const px = [], ox = 4 + (k === 2 ? 1 : 0), oy = 5;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (runeAt(k * 2 + 1, x, y)) { a.put(ox + x, oy + y, LU, 4.8); px.push(ox + x, oy + y); a.put(ox + x + 1, oy + y + 1, S, 1.6); }
  for (let i = 0; i < px.length; i += 2) pp(a, px[i], px[i + 1], LU[4 + (i % 4 === 0 ? 1 : 0)]);
  for (const [x, y, v] of [[2, 11, 4.2], [3, 11, 3.6], [3, 10, 4], [8, 11, 2.6], [9, 10, 3.2], [9, 11, 2.4]]) a.put(x, y, M, v);
  RUNA_PX[k] = px;
  return rimOut(a, S[0]);
}
const RUNA = [runaSprite(0, 25551), runaSprite(1, 25552), runaSprite(2, 25553)];
/* o braseiro lunar: a bacia de prata num pé fino, as brasas azuis dentro; o fogo frio sobe ao vivo */
function braseiroSprite(s) {
  const a = spr();
  for (let x = 1; x <= 10; x++) { a.put(x, 5, P, x < 3 ? 6 : 5 - (x - 1) * 0.2); a.put(x, 6, P, 4.2 - (x - 1) * 0.25); }
  for (let x = 2; x <= 9; x++) a.put(x, 7, P, 3.4 - (x - 2) * 0.22);
  for (let x = 3; x <= 8; x++) a.put(x, 8, P, 2.6 - (x - 3) * 0.15);
  for (const x of [3, 5, 7]) pp(a, x, 6, P[6]);                                                            // os gomos da bacia
  for (let y = 9; y <= 10; y++) { a.put(5, y, P, 4.6); a.put(6, y, P, 2.6); }
  for (let x = 3; x <= 8; x++) a.put(x, 11, P, 4.4 - (x - 3) * 0.4);
  for (let x = 2; x <= 9; x++) a.put(x, 4, LU, 4 + (hash2(x, 0, s) < 0.4 ? 1.6 : 0) - Math.abs(x - 5.5) * 0.2);   // as brasas
  pp(a, 4, 4, LU[6]); pp(a, 7, 4, LU[5]);
  return rimOut(a, P[0]);
}
const BRASEIRO = [braseiroSprite(25561)];
/* o espinheiro profanado: galhos pretos tortos saindo do pé, espinhos para todo lado, bagas carmesim com um brilho */
const MORTA2 = RX(['#08060a', '#16121a', '#241e2a', '#342c3c', '#463c50', '#5a4e66', '#74668a']);
function espinhoSprite(s) {
  const a = spr(), M = MORTA2, C = DRE.carmesim, ends = [];
  for (let b = 0; b < 4; b++) {
    const ang = -1.25 + b * 0.83 + (hash2(b, 0, s) - 0.5) * 0.4, L = 6 + hash2(b, 1, s) * 4;
    let x = 5.5 + (b - 1.5) * 0.5, y = 11.5;
    for (let i = 0; i < L; i++) {
      const a0 = ang * (0.35 + i / L * 0.65) + Math.sin(i * 1.4 + b * 2) * 0.35; x += Math.sin(a0) * 0.9; y -= Math.cos(a0) * 0.9;
      a.put(x, y, M, 4.6 - i * 0.15 + (Math.sin(a0) < 0 ? 0.5 : -0.3));
      if (i < 3) a.put(x + 1, y, M, 2.4);
      if (i % 2 === 1 && i > 0) { const side = (i + b) & 2 ? 1 : -1; a.put(x + side, y - 1, M, 6); }      // o espinho
    }
    ends.push([x, y]);
  }
  for (let i = 0; i < 4; i++) {   // as bagas
    const [ex, ey] = ends[i]; if (hash2(i, 2, s) < 0.25) continue;
    const bx = Math.round(ex + (hash2(i, 3, s) - 0.5) * 2), by = Math.round(ey + 1 + hash2(i, 4, s) * 1.5);
    a.put(bx, by, C, 4.4); a.put(bx + 1, by, C, 3.2); a.put(bx, by + 1, C, 3); a.put(bx + 1, by + 1, C, 2.2); pp(a, bx, by, C[6]);
  }
  return rimOut(a, M[0]);
}
const ESPINHO = [espinhoSprite(25571), espinhoSprite(25572), flipX(espinhoSprite(25573)), flipX(espinhoSprite(25574))];
/* a flâmula: a vareta no alto, o pano caindo em dobras, o debrum, o emblema (a estrela élfica de prata no pano azul;
   o sol de ouro no pano carmesim, na Corte) e a ponta em rabo de andorinha. 0 sozinha, 1 topo, 2 ponta, 3 meio */
function flamulaSprite(cor, k) {
  const a = spr(), C = cor ? DRE.carmesim : DRE.lua, G = cor ? DRE.ouro : P, rod = k === 0 || k === 1, point = k === 0 || k === 2;
  const y0 = rod ? 2 : 0, yEnd = k === 0 ? 11 : k === 2 ? 11 : 11;
  if (rod) { for (let x = 1; x <= 10; x++) { a.put(x, 0, G, 5.4 - x * 0.2); a.put(x, 1, G, 3.4 - x * 0.15); } pp(a, 0, 0, G[6]); pp(a, 11, 0, G[4]); pp(a, 0, 1, G[3]); pp(a, 11, 1, G[2]); }
  for (let y = y0; y <= yEnd; y++) for (let x = 2; x <= 9; x++) {
    if (point) { const cut = y - (k === 0 ? 7 : 7); if (cut > 0 && Math.abs(x + 0.5 - 6) < cut * 1.0) continue; }
    const fold = Math.sin((x - 2) * 1.05 + (cor ? 0.5 : 0)) * 0.7;
    if (x === 2 || x === 9) a.put(x, y, G, x === 2 ? 4.8 : 3);
    else a.put(x, y, C, 3.6 + fold - (y - y0) * 0.05 + (x === 3 ? 0.4 : 0));
  }
  if (point) { for (let y = 8; y <= 11; y++) { const d = y - 7; for (const x of [Math.floor(6 - d), Math.ceil(5 + d)]) if (x > 2 && x < 9) a.put(x, y, G, x < 6 ? 4.6 : 3); } }
  if (k === 0 || k === 1) {   // o emblema
    const ey = k === 0 ? 4.5 : 6;
    if (!cor) { for (const [dx, dy, v] of [[0, -2, 5], [0, -1, 6], [-1, 0, 5.4], [0, 0, 6.4], [1, 0, 4.8], [0, 1, 5], [0, 2, 4], [-2, 0, 4.6], [2, 0, 3.8], [-1, -1, 4.4], [1, 1, 3.4], [1, -1, 4.2], [-1, 1, 4.2]]) a.put(5 + dx, Math.round(ey) + dy, P, v); }
    else { for (const [dx, dy, v] of [[0, -2, 5], [-1, -1, 5.2], [1, -1, 4.4], [-2, 0, 4.6], [2, 0, 3.6], [-1, 1, 4.2], [1, 1, 3.4], [0, 2, 3.4], [0, 0, 6]]) a.put(5 + dx, Math.round(ey) + dy, G, v); a.put(6, Math.round(ey), DRE.carmesim, 2); }
  }
  return rimOut(a, C[0], false);
}
const FLAMULA = []; for (const cor of [0, 1]) for (let k = 0; k < 4; k++) FLAMULA.push(flamulaSprite(cor, k));
/* o orvalho de lua: um tufo de musgo de prata no teto e a gota de luz se formando (a que cai é ao vivo) */
const ORV_X = [5, 7];
function orvalhoSprite(v, s) {
  const a = spr(), F = DRE.folhaPrata, gx = ORV_X[v];
  for (let x = 1; x <= 10; x++) { const h = 1 + (hash2(x, 0, s) < 0.5 ? 1 : 0) + (Math.abs(x - gx) < 2 ? 1 : 0); for (let y = 0; y < h; y++) a.put(x, y, F, 4.4 - y * 1.0 - (x - 1) * 0.12 + cg(x, y, s) * 0.5); }
  for (const dx of [-2, 3]) { const x = gx + dx; if (x > 0 && x < 11) a.put(x, 2 + (dx > 0 ? 1 : 0), F, 3); }
  a.put(gx, 3, LU, 4.4); a.put(gx, 4, LU, 5.6); a.put(gx + 1, 4, LU, 3.6); pp(a, gx, 5, LU[5]);
  return rimOut(a, F[0], false);
}
const ORVALHO = [orvalhoSprite(0, 25581), orvalhoSprite(1, 25582)];
/* a coluna de raiz: duas raízes trançadas lavradas, por cima e por baixo uma da outra, com os sulcos; o pé abre em
   dedos de raiz, a cabeça abre em folhas lavradas no teto; um meio tem o anel de prata */
function colunaSprite(k, s) {   // 0 pé, 1 meio, 2 cabeça, 3 meio com o anel
  const a = spr(), C = DRE.casca;
  for (let y = 0; y < 12; y++) for (let x = 3; x <= 8; x++) a.put(x, y, C, 1.2 + (x < 5 ? 0.4 : 0));   // o miolo, no fundo
  for (let y = 0; y < 12; y++) {
    const ph0 = (y + 0.5) / 12 * 6.2832, sA = Math.sin(ph0), cA = Math.cos(ph0);
    const strands = [[6 + sA * 2.2, cA > 0, 0], [6 - sA * 2.2, cA <= 0, 1]];
    if (strands[0][1]) strands.reverse();   // o de trás primeiro
    for (const [cx, fr, id] of strands) for (let x = 0; x < 12; x++) {
      const q = (x + 0.5 - cx) / 2.3; if (Math.abs(q) > 1) continue;
      let v = Math.abs(q) > 0.78 ? 1.0 : 4.0 - q * 1.7 - q * q * 0.6 + (fr ? 0.4 : -1.0) + cg(x, y, s) * 0.25;
      if (Math.abs(q + 0.1) < 0.25 && (y + id * 2) % 4 === 0 && Math.abs(q) <= 0.78) v -= 1.2;             // o entalhe
      a.put(x, y, C, v);
    }
  }
  if (k === 3) for (let x = 2; x <= 9; x++) { a.put(x, 5, P, 5.6 - (x - 2) * 0.35); a.put(x, 6, P, 3.4 - (x - 2) * 0.25); a.put(x, 4, C, 1); a.put(x, 7, C, 1); }
  if (k === 0) {   // o pé: dedos de raiz abrindo no chão
    for (let y = 7; y < 12; y++) { const sp = (y - 6) * 1.15; for (let x = 0; x < 12; x++) { const d = Math.abs(x + 0.5 - 6); if (d < 2.6 || d > 2.6 + sp) continue; const toe = Math.sin((x + 0.5 - 6) * 1.5); if (y < 11 && toe < -0.2) continue; a.put(x, y, C, (x < 6 ? 4.6 : 2.6) + (y === 11 ? -0.8 : 0) - (d > 1.8 + sp ? 0.8 : 0)); } }
  }
  if (k === 2) {   // a cabeça: um capitel de folhas lavradas abrindo no teto, um aro de prata
    for (let y = 0; y < 5; y++) { const sp = (4 - y) * 1.3; for (let x = 0; x < 12; x++) { const d = Math.abs(x + 0.5 - 6); if (d > 2.6 + sp) continue; const lf = ((x + y) % 3); a.put(x, y, C, (y === 0 ? 4.6 : 3.6) - (x - 6) * 0.25 + (lf === 0 ? 0.7 : lf === 2 ? -0.7 : 0) - (d > 1.6 + sp ? 1 : 0)); } }
    for (let x = 2; x <= 9; x++) a.put(x, 5, P, 5 - (x - 2) * 0.35);
  }
  return k === 1 || k === 3 ? rimOut(a, C[0], false) : rimOut(a, C[0], k === 0);
}
const COLUNA = [colunaSprite(0, 25591), colunaSprite(1, 25592), colunaSprite(2, 25593), colunaSprite(3, 25594)];
/* folhas caídas: folhinhas secas de prata (e uma ou outra amarelada) no chão, deitadas, uma de lado */
function folhasSprite(s) {
  const a = spr(), O = DRE.folhaPrata[0];
  const n = 4 + ((hash2(s, 0, 1) * 2) | 0);
  for (let i = 0; i < n; i++) {
    const R = hash2(i, s, 2) < 0.3 ? DRE.seca : DRE.folhaPrata, cx = 1.8 + i * (8.4 / (n - 1)) + (hash2(i, s, 3) - 0.5) * 1.2, cy = 10.4 + hash2(i, s, 4) * 0.8 - (i === 1 ? 1.2 : 0), ang = (hash2(i, s, 5) - 0.5) * (i === 1 ? 1.6 : 0.7);
    const ca = Math.cos(ang), sa = Math.sin(ang), at = (x, y, sc) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = dx * ca + dy * sa, w = -dx * sa + dy * ca; return leafIn(u, w, 2.6 * sc, 1.1 * sc) ? w : null; };
    for (let y = 6; y < 12; y++) for (let x = 0; x < 12; x++) { const w = at(x, y, 1); if (w !== null) a.put(x, y, R, 4.6 - w * 1.4 + (Math.abs(w) < 0.3 ? 0.9 : 0)); }
  }
  return rimOut(a, O);
}
const FOLHAS = [folhasSprite(25601), folhasSprite(25602), folhasSprite(25603)];
/* os vaga-lumes: o bloco fica vazio; os pontinhos são todos ao vivo */
const VAGALUME = [spr()];
/* o cogumelo-de-luar: no chão, dois ou três chapéus azul-pálidos com pintas e o pé branco; na parede, orelhas em
   prateleira (a da direita é o espelho) */
function cogumeloSprite(k, s) {
  const a = spr(), W = DRE.branco;
  if (k < 2) {
    const caps = k === 0 ? [[4, 6, 3.2, 1.8, 11], [8.6, 8.4, 2, 1.3, 11]] : [[6.5, 5, 3.4, 2, 11], [2.8, 9, 1.6, 1.1, 11], [9.4, 9.4, 1.4, 1, 11]];
    for (const [cx, cy, rx, ry, base] of caps) {
      for (let y = Math.round(cy + 1); y <= base; y++) { a.put(Math.round(cx - 0.5), y, W, 4.4 - (y - cy) * 0.15); if (rx > 2.5) a.put(Math.round(cx + 0.5), y, W, 2.6); }
      for (let y = Math.floor(cy - ry); y <= cy + 0.5; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1 || dy > 0.4) continue;
        a.put(x, y, LU, 5 - dx * 1.1 - dy * 1.4 + (dy > 0.05 ? -2 : 0));
      }
      pp(a, Math.round(cx - rx * 0.4), Math.round(cy - ry * 0.5), LU[6]); pp(a, Math.round(cx + rx * 0.3), Math.round(cy - ry * 0.2), W[5]);
    }
  } else {   // na parede da esquerda
    for (const [cy, r] of [[3.5, 4], [8, 3]]) for (let y = Math.floor(cy - 2); y <= cy + 1; y++) for (let x = 0; x < r + 1; x++) {
      const dx = x / r, dy = (y + 0.5 - cy) / 1.6; if (dx * dx + dy * dy > 1) continue;
      a.put(x, y, LU, dy > 0.3 ? 2.4 + (x % 2) * 0.6 : 5 - dx * 1.4 - dy * 0.8);
    }
    pp(a, 1, 2, LU[6]);
  }
  return rimOut(a, LU[0]);
}
const COGUMELO = [cogumeloSprite(0, 25611), cogumeloSprite(1, 25612), flipX(cogumeloSprite(0, 25613)), cogumeloSprite(2, 25614), flipX(cogumeloSprite(2, 25615))];
/* a lasca de cristal: um cachinho de prismas lunares no chão; a ponta do maior solta a estrelinha ao vivo */
const CRI_TIP = [];
function cristalinhoSprite(v) {
  const a = spr(), R = DRE.lua, base = v === 0 ? [[3.6, -0.6, 4], [8.2, 0.7, 3.4], [6, 0.05, 7]] : [[7.8, 0.4, 4.4], [5.6, 0.1, 3], [4.2, -0.25, 6.4]];
  let tip = null;
  for (let i = 0; i < base.length; i++) { const [bx, ang, len] = base[i], t = sprPrism(a, bx, 11.6, ang, len, len > 5 ? 1.6 : 1.1, R); if (len > 5) tip = t; }
  for (let x = 2; x <= 9; x++) a.put(x, 11, DRE.pedra, 3.4 - (x - 2) * 0.2);
  CRI_TIP[v] = tip;
  return rimOut(a, R[0]);
}
const CRISTALINHO = [cristalinhoSprite(0), cristalinhoSprite(1)];
/* o véu de luar: fios de luz prateada caindo do alto, com folhinhas de filigrana presas neles; o miolo é vazio (a
   parede aparece); duas fases que se alternam */
function veuSprite(k) {
  const a = spr(), V = PALS.elVeu;
  for (const x0 of [1, 5, 9]) for (let y = 0; y < 12; y++) {
    const x = x0 + (Math.sin((y + k * 6 + x0 * 2) * 0.52) > 0.5 ? 1 : 0);
    pp(a, x, y, V[(y + x0 + k * 3) % 6 === 0 ? 5 : 3]);
    if ((y + x0 + k * 3) % 6 === 3) { pp(a, x - 1, y, V[2]); pp(a, x + 1, y, V[2]); pp(a, x, y, V[5]); }   // a folhinha de filigrana
  }
  return a;
}
const VEU = [veuSprite(0), veuSprite(1)];

DECO[EL_ESCADA] = ESCADA; DECO[EL_CIPO] = CIPO; DECO[EL_LANTERNA] = LANTERNA; DECO[EL_FLOR] = FLOR; DECO[EL_SAMAMBAIA] = SAMAMBAIA; DECO[EL_RUNA] = RUNA; DECO[EL_BRASEIRO] = BRASEIRO;
DECO[EL_ESPINHO] = ESPINHO; DECO[EL_FLAMULA] = FLAMULA; DECO[EL_ORVALHO] = ORVALHO; DECO[EL_COLUNA] = COLUNA; DECO[EL_FOLHAS] = FOLHAS; DECO[EL_VAGALUME] = VAGALUME;
DECO[EL_COGUMELO] = COGUMELO; DECO[EL_CRISTALINHO] = CRISTALINHO;
// o véu: sólido mas vazado (a parede aparece entre os fios), como a barreira da Nave; não quebra
DECO[EL_BARREIRA] = VEU; MAT[EL_BARREIRA] = [PALS.elVeu, BKV.veu]; SOLID[EL_BARREIRA] = 1; BLOCKY[EL_BARREIRA] = 0; SEETHRU[EL_BARREIRA] = 1; DIG[EL_BARREIRA] = 0; PCOL[EL_BARREIRA] = '#e6eef8'; EMIT[EL_BARREIRA] = 0.55;
const EL_DECO = [
  // id, dureza, cor no mapa, o que solta
  [EL_ESCADA, 0.25, '#c2b08e', 'tabua_elfica'], [EL_CIPO, 0.15, '#9cb8d0', null], [EL_LANTERNA, 0.12, '#b8d6f8', null], [EL_FLOR, 0.03, '#f2f6fa', null], [EL_SAMAMBAIA, 0.03, '#6e90ac', null],
  [EL_RUNA, 0.5, '#4c7cc0', null], [EL_BRASEIRO, 0.4, '#aeb8c6', null], [EL_ESPINHO, 0.08, '#c22c3e', null], [EL_FLAMULA, 0.08, '#4c7cc0', null], [EL_ORVALHO, 0.03, '#b8d6f8', null],
  [EL_COLUNA, 0.9, '#868e9c', 'madeira_prata'], [EL_FOLHAS, 0.02, '#9cb8d0', null], [EL_VAGALUME, 0, '#c8ffe8', null], [EL_COGUMELO, 0.04, '#7eaae4', null], [EL_CRISTALINHO, 0.3, '#d2e8ff', null]
];
for (const [t, dig, col, drop] of EL_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[EL_LANTERNA] = 0.95; EMIT[EL_FLOR] = 0.3; EMIT[EL_RUNA] = 0.36; EMIT[EL_BRASEIRO] = 0.9; EMIT[EL_ORVALHO] = 0.2; EMIT[EL_VAGALUME] = 0.26; EMIT[EL_COGUMELO] = 0.42; EMIT[EL_CRISTALINHO] = 0.45;
// o que cai quando o apoio some (56, 87); escada, cipó e coluna ficam (atravessam vãos)
for (const t of [EL_LANTERNA, EL_ORVALHO, EL_FLAMULA]) CV_HANGS[t] = 1;
for (const t of [EL_FLOR, EL_SAMAMBAIA, EL_RUNA, EL_BRASEIRO, EL_ESPINHO, EL_FOLHAS, EL_COGUMELO, EL_CRISTALINHO]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[EL_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== EL_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== EL_ESCADA ? arr[2] : arr[0];
DECO_PICK[EL_CIPO] = (gx, gy, arr) => tileAt(gx, gy + 1) === EL_CIPO || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[EL_LANTERNA] = (gx, gy, arr) => arr[vr(gx, gy, 25521, 2)];
const florV = (gx, gy) => vr(gx, gy, 25531, 4);
DECO_PICK[EL_FLOR] = (gx, gy, arr) => { const v = florV(gx, gy); return v & 2 ? flipCache(arr, v & 1) : arr[v & 1]; };
const FLIPC = new Map(); function flipCache(arr, i) { let f = FLIPC.get(arr[i]); if (!f) { f = flipX(arr[i]); FLIPC.set(arr[i], f); } return f; }
DECO_PICK[EL_SAMAMBAIA] = (gx, gy, arr) => arr[vr(gx, gy, 25541, 4)];
const runaK = (gx, gy) => vr(gx, gy, 25551, 3);
DECO_PICK[EL_RUNA] = (gx, gy, arr) => arr[runaK(gx, gy)];
DECO_PICK[EL_ESPINHO] = (gx, gy, arr) => arr[vr(gx, gy, 25571, 4)];
DECO_PICK[EL_FLAMULA] = (gx, gy, arr) => { const c = elfosBand(gy) === 2 ? 4 : 0, up = tileAt(gx, gy - 1) === EL_FLAMULA, dn = tileAt(gx, gy + 1) === EL_FLAMULA; return arr[c + (up && dn ? 3 : up ? 2 : dn ? 1 : 0)]; };
const orvV = (gx, gy) => vr(gx, gy, 25581, 2);
DECO_PICK[EL_ORVALHO] = (gx, gy, arr) => arr[orvV(gx, gy)];
DECO_PICK[EL_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== EL_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== EL_COLUNA ? arr[2] : arr[hash2(wrapX(gx), gy, 25595) < 0.25 ? 3 : 1];
DECO_PICK[EL_FOLHAS] = (gx, gy, arr) => arr[vr(gx, gy, 25601, 3)];
DECO_PICK[EL_COGUMELO] = (gx, gy, arr) => solidAt(gx, gy + 1) ? arr[vr(gx, gy, 25611, 3)] : solidAt(gx - 1, gy) ? arr[3] : solidAt(gx + 1, gy) ? arr[4] : arr[0];
const criV = (gx, gy) => vr(gx, gy, 25621, 2);
DECO_PICK[EL_CRISTALINHO] = (gx, gy, arr) => arr[criV(gx, gy)];
DECO_PICK[EL_BARREIRA] = (gx, gy, arr) => arr[(gx + gy) & 1];

// a escada de corda e o cipó se escalam como a corrente da catedral; a escada também conta como a escada da mina (a
// pose de subir, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, EL_ESCADA) || _tt(e, EL_CIPO))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, EL_ESCADA)); }; }

/* ================= ao vivo: o luar, a chama, o fogo frio, a flor, o orvalho, os vaga-lumes, as estrelinhas ================= */
const EL_GL = {};
const elGlow = (k, r, col) => EL_GL[k] || (EL_GL[k] = glow(r, col));
const elOut = cy => cy + VH < (EL_S0 - 6) * T || cy > (EL_S0 + EL_D + 6) * T;
// quanto a flor-da-lua está aberta agora (0 fechada, 1 aberta): abre e fecha devagar, cada uma no seu tempo
const florOpen = (gx, gy, tm) => { const s = Math.sin(tm * 0.21 + hash2(wrapX(gx), gy, 25701) * 40); return s < -0.2 ? 0 : Math.min(1, (s + 0.2) * 1.6); };
// onde está o vaga-lume k do bloco agora (em pixels do bloco), no VGP
const VGP = [0, 0];
function vgPos(gx, gy, k, tm) {
  const h = hash2(wrapX(gx) * 3 + k, gy, 25711), sp = 0.35 + h * 0.5;
  VGP[0] = 6 + Math.sin(tm * sp + h * 30) * 9 + Math.sin(tm * sp * 2.3 + k) * 3;
  VGP[1] = 6 + Math.cos(tm * sp * 0.8 + h * 17) * 6 + Math.sin(tm * sp * 3.1 + k * 2) * 2;
  return 0.5 + Math.sin(tm * (1.3 + h) + h * 20) * 0.5;   // o pisca
}
const LUA_C = '#e6eef8', AZUL_C = '#9cc8ff', FOGO_C = '#7ab4ff';
HOOK.drawGlow.push((cx, cy) => {
  if (elOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < EL_SOLO || t > EL_LUA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case EL_LANTERNA: {
        const f = 0.92 + Math.sin(tm * 11 + gx) * 0.04 + Math.sin(tm * 23 + gy) * 0.03;
        lc.globalAlpha = 0.3 * f; lc.drawImage(elGlow('lb', 34, '#b8d8ff'), x + LAN_F[0] - 34, y + LAN_F[1] - 34);
        lc.globalAlpha = 0.5 * f; lc.drawImage(elGlow('ls', 9, '#e0f0ff'), x + LAN_F[0] - 9, y + LAN_F[1] - 9);
        break;
      }
      case EL_BRASEIRO: { const f = 0.9 + Math.sin(tm * 9 + gx * 2) * 0.06 + Math.sin(tm * 21) * 0.04; lc.globalAlpha = 0.32 * f; lc.drawImage(elGlow('fb', 30, FOGO_C), x + 6 - 30, y + 2 - 30); lc.globalAlpha = 0.4 * f; lc.drawImage(elGlow('fs', 10, '#c0e0ff'), x + 6 - 10, y + 1 - 10); break; }
      case EL_CRISTAL_LUA: if ((gx + gy) & 1) break; lc.globalAlpha = 0.15 + Math.sin(tm * 1.6 + gx * 0.5 + gy * 0.3) * 0.05; lc.drawImage(elGlow('c16', 16, '#b0d0ff'), x + 6 - 16, y + 6 - 16); break;
      case EL_CRISTAL_SANGUE: if ((gx + gy) & 1) break; lc.globalAlpha = 0.15 + Math.sin(tm * 1.9 + gx * 0.7 + gy * 0.2) * 0.05; lc.drawImage(elGlow('r16', 16, '#ff3a4a'), x + 6 - 16, y + 6 - 16); break;
      case EL_RUNA: { const p = 0.5 + Math.sin(tm * 1.4 + hash2(wrapX(gx), gy, 25702) * 20) * 0.5; lc.globalAlpha = 0.1 + p * 0.18; lc.drawImage(elGlow('b12', 12, AZUL_C), x + 6 - 12, y + 7 - 12); break; }
      case EL_FLOR: { const o = florOpen(gx, gy, tm), [fx, fy] = FLOR_C[florV(gx, gy) & 1], X = florV(gx, gy) & 2 ? 11 - fx : fx; lc.globalAlpha = 0.06 + o * 0.2; lc.drawImage(elGlow('b10', 10, AZUL_C), x + X + 0.5 - 10, y + fy - 10); break; }
      case EL_COGUMELO: lc.globalAlpha = 0.16 + Math.sin(tm * 1.1 + gx * 1.7 + gy) * 0.05; lc.drawImage(elGlow('b12', 12, AZUL_C), x + 6 - 12, y + 6 - 12); break;
      case EL_CRISTALINHO: lc.globalAlpha = 0.2 + Math.sin(tm * 1.5 + gx) * 0.04; lc.drawImage(elGlow('w12', 12, '#c8e4ff'), x + 6 - 12, y + 8 - 12); break;
      case EL_ORVALHO: lc.globalAlpha = 0.12; lc.drawImage(elGlow('b8', 8, AZUL_C), x + ORV_X[orvV(gx, gy)] - 8, y + 4 - 8); break;
      case EL_VAGALUME: for (let k = 0; k < 3; k++) { const b = vgPos(gx, gy, k, tm); if (b < 0.2) continue; lc.globalAlpha = 0.28 * b; lc.drawImage(elGlow('v5', 5, '#b8ffd8'), x + VGP[0] - 5, y + VGP[1] - 5); } break;
      case EL_FOLHAGEM: if ((gx * 3 + gy * 5) % 7) break; lc.globalAlpha = 0.06 + Math.max(0, Math.sin(tm * 0.9 + gx * 1.3 + gy)) * 0.06; lc.drawImage(elGlow('b10', 10, AZUL_C), x + 6 - 10, y + 6 - 10); break;
      case EL_PEDRA_POCO: if ((gx + gy * 3) % 7) break; lc.globalAlpha = 0.06 + Math.sin(tm * 0.7 + gx) * 0.02; lc.drawImage(elGlow('p10', 10, '#4a9ac8'), x + 6 - 10, y + 6 - 10); break;
      case EL_RAIZ: if ((gx * 2 + gy) % 4) break; lc.globalAlpha = 0.07 + Math.sin(tm * 0.8 + gy * 0.6) * 0.03; lc.drawImage(elGlow('s10', 10, '#5aa8ff'), x + 6 - 10, y + 6 - 10); break;
      case EL_ESPELHO: if ((gx + gy) % 3) break; lc.globalAlpha = 0.05; lc.drawImage(elGlow('b12', 12, AZUL_C), x + 6 - 12, y + 2 - 12); break;
      case EL_O_LUNARITA: lc.globalAlpha = 0.1 + Math.max(0, Math.sin(tm * 1.8 + gx * 1.7 + gy)) * 0.07; lc.drawImage(elGlow('b12', 12, AZUL_C), x + 6 - 12, y + 6 - 12); break;
      case EL_LUA: if ((gx + gy) & 1) break; lc.globalAlpha = 0.1; lc.drawImage(elGlow('m20', 20, LUA_C), x + 6 - 20, y + 6 - 20); break;
      case EL_BARREIRA: lc.globalAlpha = 0.15 + Math.sin(tm * 3 + gy * 0.7) * 0.05; lc.drawImage(elGlow('m14', 14, LUA_C), x + 6 - 14, y + 6 - 14); break;
    }
  }
  lc.globalAlpha = 1;
});
const FOGO = ['#ffffff', '#d8f0ff', '#9cd0ff', '#5a9aff', '#2e5ad0'];
const PETALA = ['#ffffff', '#e8f2ff', '#b8d4f4'];
HOOK.drawTop.push((cx, cy) => {
  if (elOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < EL_SOLO || t > EL_LUA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case EL_LANTERNA: {   // a chama tremula: o miolo sobe e desce, uma língua troca de lado
        const f = Math.floor(tm * 9 + gx * 3) % 4, fx = x + LAN_F[0], fy = y + LAN_F[1];
        lc.fillStyle = '#ffffff'; lc.fillRect(fx, fy - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#c8e6ff'; lc.fillRect(fx + (f === 2 ? 1 : f === 3 ? -1 : 0), fy - 2, 1, 1);
        break;
      }
      case EL_BRASEIRO: {   // o fogo frio: línguas azuis subindo da bacia, cada uma no seu ritmo, faíscas soltas
        const h0 = hash2(wrapX(gx), gy, 25703) * 9;
        for (let k = 0; k < 5; k++) {
          const fx = x + 2 + k * 2 - (k > 2 ? 1 : 0), H = Math.round(3 + (k === 2 ? 3 : k === 1 || k === 3 ? 1.5 : 0) + Math.sin(tm * (7 + k) + k * 1.9 + h0) * 1.6), sw = Math.round(Math.sin(tm * 5 + k + h0) * 0.7);
          for (let j = 0; j < H; j++) { lc.fillStyle = FOGO[Math.min(4, Math.floor(j / H * 4.2) + (k === 0 || k === 4 ? 1 : 0))]; lc.fillRect(fx + (j > H / 2 ? sw : 0), y + 4 - j, 1, 1); }
        }
        const sp = (tm * 0.8 + h0) % 1; lc.globalAlpha = 1 - sp; lc.fillStyle = '#c8e6ff'; lc.fillRect(x + 3 + vr(gx + Math.floor(tm * 0.8 + h0), gy, 25704, 6), y - 2 - Math.round(sp * 10), 1, 1); lc.globalAlpha = 1;
        break;
      }
      case EL_FLOR: {   // as pétalas abrem em estrela em volta do botão
        const o = florOpen(gx, gy, tm); if (o < 0.15) break;
        const v = florV(gx, gy), [fx0, fy] = FLOR_C[v & 1], fx = v & 2 ? 11 - fx0 : fx0, L = Math.round(o * 2.6);
        for (let k = 0; k < 6; k++) {
          const a = k * 1.0472 - 1.5708 + 0.5236, ux = Math.cos(a), uy = Math.sin(a) * 0.85;
          for (let j = 1; j <= L; j++) { lc.fillStyle = PETALA[j === 1 ? 1 : j === L ? 2 : 0]; lc.fillRect(x + fx + Math.round(ux * j), y + fy + Math.round(uy * j), 1, 1); }
        }
        lc.fillStyle = '#9cc8ff'; lc.fillRect(x + fx, y + fy, 1, 1);
        break;
      }
      case EL_ORVALHO: {   // a gota cresce, solta e cai até o chão, e respinga
        const ph0 = (tm * 0.22 + hash2(wrapX(gx), gy, 25705)) % 1, gxo = ORV_X[orvV(gx, gy)];
        if (ph0 < 0.8) { if (ph0 > 0.45) { lc.fillStyle = '#d8ecff'; lc.fillRect(x + gxo, y + 6, 1, ph0 > 0.65 ? 2 : 1); } break; }
        let fl = 1; while (fl < 14 && !solidAt(gx, gy + fl)) fl++;
        const f = (ph0 - 0.8) / 0.2, dy = 6 + f * f * (fl * T - 6);
        lc.fillStyle = '#7aa8e0'; lc.fillRect(x + gxo, y + dy, 1, 2); lc.fillStyle = '#ffffff'; lc.fillRect(x + gxo, y + dy + 1, 1, 1);
        if (f > 0.93) { lc.fillStyle = '#b8d6f8'; lc.fillRect(x + gxo - 1, y + fl * T - 2, 1, 1); lc.fillRect(x + gxo + 1, y + fl * T - 2, 1, 1); lc.fillRect(x + gxo - 2, y + fl * T - 1, 1, 1); lc.fillRect(x + gxo + 2, y + fl * T - 1, 1, 1); }
        break;
      }
      case EL_VAGALUME: for (let k = 0; k < 3; k++) { const b = vgPos(gx, gy, k, tm); if (b < 0.2) continue; lc.globalAlpha = Math.min(1, b * 1.3); lc.fillStyle = b > 0.7 ? '#f0fff8' : '#a8f0c8'; lc.fillRect(x + Math.round(VGP[0]), y + Math.round(VGP[1]), 1, 1); } lc.globalAlpha = 1; break;
      case EL_RUNA: {   // a runa acende e apaga devagar
        const p = 0.5 + Math.sin(tm * 1.4 + hash2(wrapX(gx), gy, 25702) * 20) * 0.5; if (p < 0.35) break;
        const px = RUNA_PX[runaK(gx, gy)]; lc.globalAlpha = (p - 0.35) * 1.2; lc.fillStyle = '#d8ecff';
        for (let k = 0; k < px.length; k += 2) lc.fillRect(x + px[k], y + px[k + 1], 1, 1);
        lc.globalAlpha = 1; break;
      }
      case EL_COGUMELO: { const ph0 = (tm * 0.3 + hash2(wrapX(gx), gy, 25706) * 5) % 1; if (ph0 > 0.5) break; lc.globalAlpha = 1 - ph0 * 2; lc.fillStyle = '#b8d6f8'; lc.fillRect(x + 3 + vr(gx, gy, 25707, 6), y + 4 - Math.round(ph0 * 12), 1, 1); lc.globalAlpha = 1; break; }   // um esporo de luz subindo
      case EL_CRISTALINHO: case EL_O_LUNARITA: {   // de vez em quando a ponta solta uma estrelinha
        const ph0 = (tm * 0.33 + hash2(wrapX(gx), gy, 25708) * 7) % 1; if (ph0 > 0.08) break;
        const tp = t === EL_CRISTALINHO ? CRI_TIP[criV(gx, gy)] : lunTip(gx, gy); if (!tp) break;
        const L = ph0 < 0.04 ? 1 : 2; lc.fillStyle = '#ffffff'; lc.fillRect(x + tp[0], y + tp[1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + tp[0] - L + 1, y + tp[1], L * 2 - 1, 1);
        break;
      }
      case EL_CRISTAL_LUA: case EL_CRISTAL_SANGUE: {   // uma faísca rápida numa aresta
        const n = Math.floor(tm * 3 + gx * 0.7); if (hash2(wrapX(gx) + n, gy, 25709) > 0.06) break;
        lc.fillStyle = t === EL_CRISTAL_LUA ? '#ffffff' : '#ffd0d0'; const sx = x + 2 + vr(gx + n, gy, 25710, 8), sy = y + 2 + vr(gx + n, gy, 25711, 8); lc.fillRect(sx, sy - 1, 1, 3); lc.fillRect(sx - 1, sy, 3, 1);
        break;
      }
      case EL_FOLHAGEM: { const n = Math.floor(tm * 1.5 + gx * 0.37); if (hash2(wrapX(gx) + n, gy, 25712) > 0.05) break; lc.fillStyle = '#e8f6ff'; lc.fillRect(x + vr(gx + n, gy, 25713, 12), y + vr(gx + n, gy, 25714, 12), 1, 1); break; }
      case EL_ESPELHO: {   // um brilho deitado corre devagar pela água
        const ph0 = (tm * 0.12 + hash2(wrapX(gx), gy, 25715)) % 1; if (ph0 > 0.3) break;
        lc.globalAlpha = Math.sin(ph0 / 0.3 * Math.PI) * 0.35; lc.fillStyle = '#c8dcf0'; lc.fillRect(x + Math.round(ph0 / 0.3 * 8), y + 3 + vr(gx, gy, 25716, 6), 4, 1); lc.globalAlpha = 1;
        break;
      }
      case EL_BARREIRA: { const ly = Math.floor(tm * 10 + gx * 3) % 12; lc.globalAlpha = 0.45; lc.fillStyle = '#ffffff'; for (const xx of [1, 5, 9]) lc.fillRect(x + xx, y + ly, 1, 2); lc.globalAlpha = 1; break; }
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(ELART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, pp, wrapT, W2, RX, mixP, clampR, leafIn, hangLeaf, sprPrism, prismV,
  SILV, MOONG, GOLDV, CRIMS, GLINT, SANGR, LUAR, DRE, RUNES, runeAt, elGlow, EL_GL, elOut, florOpen,
  vSolo, vMadeira, vFolhagem, vMarmore, vLavrada, vTabua, vProfano, vMorta, vSangue, vCristal, vPoco, vRaizMae, vEspelho, vLua, vVeu, salaoPanel, vMataW, vSalaoW, vProfanoW, vPocoW, vFolhasW,
  ESCADA, CIPO, LANTERNA, FLOR, SAMAMBAIA, RUNA, BRASEIRO, ESPINHO, FLAMULA, ORVALHO, COLUNA, FOLHAS, COGUMELO, CRISTALINHO, VEU, LAN_F });
}
