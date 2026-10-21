'use strict';

/* ================= o Brejo das Bruxas: blocos, paredes, terceira camada, minérios, decoração, a luz viva =================
   Um pântano debaixo da terra: tudo é molhado, marrom-preto e verde-sujo. A turfa é marrom quase preta em camadas
   fibrosas deitadas, com raizinhas claras e o musgo de turfeira em pontinhos; a lama brilha molhada em riscos de luz
   e faz bolhas; a argila de brejo é cinza-azulada em lâminas finas com manchas de ferrugem; a pedra do brejo é um
   calcário verde-acinzentado em lajes irregulares com o limo escorrido por cima; a tábua são pranchas velhas com veio,
   prego e podre; o sapê é palha em fiadas inclinadas; o pau a pique são varas trançadas com o barro caindo; o menir é
   granito salpicado com líquen e as espirais riscadas; o raizame é um nó de raízes de árvore afogada; a crosta de
   ferro são nódulos de limonita cor de ferrugem; o Espinheiro da Velha são galhos pretos tortos com espinhos e uma
   flor branca aqui e ali (o abrunheiro das bruxas).
   Como o 281, cada material é uma textura contínua de 240x240; contorno, borda acesa, sombra e oclusão vêm do 07. A
   decoração de 1 bloco são sprites de 12x12 em rampas de 7 tons, luz de cima à esquerda; o que brilha e se mexe (o
   fogo-fátuo flutuando, a chama da vela preta, a gota que cai) é desenhado ao vivo, só sobre o que está na tela.
   Ids: 370. */
const BJART = {};   // ferramentas para 372-brejo-objetos, os bichos (373, 374), a Velha (376) e o ferro (377)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('bjTurfa', ['#120c08', '#1e140c', '#2c1e12', '#3e2c1a', '#544028', '#6c5638']);
pal('bjLama', ['#100c0a', '#1c1612', '#2a221c', '#3a3028', '#4e443a', '#6a6052']);
pal('bjArgila', ['#1e2224', '#2e3436', '#42494a', '#58605e', '#707874', '#8c948c']);
pal('bjPedra', ['#141a16', '#20281f', '#2e382c', '#3e4a3a', '#525e4a', '#6a7560']);
pal('bjTabua', ['#1a120a', '#2a1e12', '#3c2c1a', '#503c24', '#664e30', '#806640']);
pal('bjSape', ['#2a2010', '#40321a', '#584624', '#725c30', '#8c743e', '#a88e52']);
pal('bjPauPique', ['#1e160e', '#302418', '#443424', '#5a4632', '#725a42', '#8c7454']);
pal('bjMenir', ['#1a1c1c', '#2a2e2c', '#3c403c', '#525650', '#6a6e66', '#868a80']);
pal('bjRaiz', ['#140c06', '#22160c', '#342214', '#48301c', '#5e4026', '#765232']);
pal('bjCrosta', ['#1e0e06', '#34180a', '#4e2610', '#6c3818', '#8c4e24', '#ac6a36']);
pal('bjEspinho', ['#08060a', '#100c10', '#1a1418', '#261e22', '#342a2e', '#463a3c']);
// paredes de fundo: bem mais escuras que o chão da frente
pal('bjTurfaW', ['#060403', '#090605', '#0d0907', '#120d09', '#17110c', '#1d1610']);
pal('bjPedraW', ['#050706', '#080a08', '#0b0e0b', '#0f130e', '#131812', '#181e16']);
pal('bjTabuaW', ['#0a0604', '#0f0a06', '#150f09', '#1b140c', '#221a10', '#2a2014']);
pal('bjRaizW', ['#070403', '#0b0705', '#100a07', '#150e09', '#1b130c', '#22180f']);
pal('bjMenirW', ['#060707', '#090a0a', '#0d0f0e', '#121413', '#171a18', '#1d201d']);
// a terceira camada: a mata afogada (troncos mortos em pé na névoa), as palafitas ao longe, as forcas e as pedras
pal('dpBjMata', ['#020302', '#040504', '#070907', '#0b0d0a', '#11140f', '#1a1e16']);
pal('dpBjPalafitas', ['#030202', '#050404', '#080706', '#0c0a08', '#12100c', '#1c1812']);
pal('dpBjForcas', ['#020202', '#050504', '#080807', '#0c0c0a', '#12120f', '#1a1a16']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // senos só com múltiplos inteiros disto, para a textura não ter emenda
const RX = hexes => hexes.map(h => ph(h));
const ROOTL = RX(['#3a2c1c', '#5a4630', '#7a6448', '#9a8462', '#bca67e']);         // as raizinhas claras na turfa
const SPHAG = RX(['#1e2a12', '#2c3c18', '#3e521e', '#566c28', '#748a36']);         // o musgo de turfeira
const LIMO = RX(['#1a2614', '#24361a', '#304a20', '#3e5e28', '#527434']);          // o limo verde escorrido
const RUST = RX(['#3a1a0a', '#5a2a10', '#7c3e18', '#a05424', '#c47038']);          // ferrugem
const GLOSS = RX(['#7a7468', '#a49e90', '#d0cabc']);                               // o brilho molhado
const LIQ = RX(['#3a4230', '#566044', '#727e58', '#909c6c', '#b0ba84']);           // líquen
const BLOSS = RX(['#8a8478', '#c4bcae', '#ece6da', '#fffaf0']);                    // a flor do abrunheiro
const NAIL = RX(['#121212', '#2a2826', '#4a4642', '#6e6862']);

/* ---- o chão sólido ---- */
function vTurfa(x, y) {   // turfa: camadas fibrosas deitadas e onduladas, raizinhas claras, musgo de turfeira em pontinhos
  const sy = y + cn(x, y, 3, 8, 37101) * 22 + cn(x, y, 10, 20, 37102) * 5;
  const L = Math.sin(sy * W2 * 34) * 0.5 + Math.sin(sy * W2 * 90 + cn(x, y, 20, 6, 37103) * 3) * 0.3;
  let v = 2.5 + L * 0.7 + cn(x, y, 14, 14, 37104) * 1.0 + cg(x, y, 37105) * 0.55;
  // as fibras: tracinhos claros deitados ao longo da camada
  const fb = Math.abs(cn(wrapT(x), wrapT(Math.round(sy)), 24, 3, 37106)); if (fb < 0.012) return 3.9 + cg(x, y, 37107) * 0.4;
  if (fb < 0.02) v -= 0.5;
  // as raizinhas: fios claros e finos que descem tortos
  const rt = Math.abs(cn(wrapT(x + cn(x, y, 4, 4, 37108) * 30), y, 9, 2, 37109));
  if (rt < 0.006 && hash2(x >> 3, y >> 4, 37110) < 0.5) { MATX = ROOTL[clamp(Math.round(2.4 + cg(x, y, 37111) * 2), 0, 4)]; return -9; }
  // o musgo: pontinhos verdes em manchas
  const ms = cn(x, y, 8, 8, 37112); if (ms > 0.3 && hash2(x, y, 37113) < 0.22) { MATX = SPHAG[clamp(Math.round(1 + (ms - 0.3) * 8 + cg(x, y, 37114) * 2), 0, 4)]; return -9; }
  if (hash2(x, y, 37115) < 0.03) v -= 1.1;
  return v;
}
function vLama(x, y) {   // lama: lisa, escura, o brilho molhado em riscos deitados, bolhinhas, marcas de escorrer
  const sy = y + cn(x, y, 4, 4, 37121) * 18;
  let v = 2.4 + cn(x, y, 10, 10, 37122) * 1.2 + cn(x, y, 30, 30, 37123) * 0.6 + cg(x, y, 37124) * 0.3 + Math.sin(sy * W2 * 20) * 0.25;
  const gl = cn(x, wrapT(Math.round(sy)), 6, 26, 37125); if (gl > 0.33 && gl < 0.355) { MATX = GLOSS[gl < 0.343 ? 1 : 2]; return -9; }
  if (gl > 0.28 && gl < 0.4) v += 0.7;
  const b = cells(x, y, 16, 37126); if (b.id < 0.16 && b.d1 < 2.2) { if (b.d1 < 1.2) return 0.6; v += b.ox + b.oy < 0 ? 1.2 : -0.5; }   // bolhas
  if (hash2(x, y, 37127) < 0.025) v -= 0.9;
  return v;
}
function vArgila(x, y) {   // argila de brejo: lâminas finas cinza-azuladas, lisa, rachaduras de seco, manchas de ferrugem
  const sy = y + cn(x, y, 2, 4, 37131) * 10;
  let v = 2.9 + Math.sin(sy * W2 * 56) * 0.35 + Math.sin(sy * W2 * 18 + 0.8) * 0.4 + cn(x, y, 20, 20, 37132) * 0.8 + cg(x, y, 37133) * 0.28;
  const c = cells(x, y, 34, 37134, 1.8); if (c.d2 - c.d1 < 0.8) v -= 1.4; else if (c.d2 - c.d1 < 1.4) v += 0.4;
  const rs = cn(x, y, 6, 6, 37135); if (rs > 0.3) { MATX = RUST[clamp(Math.round(1 + (rs - 0.3) * 9 + cg(x, y, 37136) * 1.5), 0, 4)]; return -9; }
  return v;
}
function vPedra(x, y) {   // pedra do brejo: lajes irregulares de calcário esverdeado, juntas escuras, o limo escorrido de cima
  const c = cells(x, y, 30, 37141, 1.4);
  let v = 2.8 + (c.id - 0.5) * 0.9 + cn(x, y, 16, 16, 37142) * 0.9 + cg(x, y, 37143) * 0.45;
  const e = c.d2 - c.d1;
  if (e < 1.2) return 0.7 + cg(x, y, 37144) * 0.3;                                                         // a junta
  if (e < 2.4 && c.oy < 0) v += 0.8;                                                                      // a borda de cima pega luz
  if (e < 2.4 && c.oy > 0) v -= 0.5;
  // o limo: escorre das juntas de cima para baixo, em fios
  const lm = cn(wrapT(x), y, 30, 4, 37145) + (c.oy < -c.d1 * 0.5 ? 0.25 : 0);
  if (lm > 0.28 && hash2(x, y >> 1, 37146) < 0.7) { MATX = LIMO[clamp(Math.round(1 + (lm - 0.28) * 6 + cg(x, y, 37147) * 2), 0, 4)]; return -9; }
  if (hash2(x, y, 37148) < 0.02) v -= 1;
  return v;
}
function vTabua(x, y) {   // tábua: pranchas deitadas de 6, desencontradas, veio, o prego, a fresta escura, o podre esverdeado
  const Y = wrapT(y), row = Math.floor(Y / 6), by = Y % 6, X = wrapT(x + row * 41), seg = Math.floor(X / 48), bx = X % 48, id = hash2(seg, row, 37151);
  if (by === 5) return 0.5;                                                                               // a fresta
  if (bx === 0) return 0.9;
  let v = 2.8 + (id - 0.5) * 0.8 + (by === 0 ? 0.9 : by === 4 ? -0.6 : 0) + cg(x, y, 37152) * 0.4;
  const gr = Math.sin((X + cn(x, y, 4, 2, 37153) * 30) * W2 * 30 + by * 0.6); v += gr * 0.35;          // o veio
  if (Math.abs(cn(x, y, 30, 40, 37154)) < 0.01) v -= 0.8;                                                 // racha
  if ((bx === 3 || bx === 44) && by === 2) { MATX = NAIL[3]; return -9; } if ((bx === 3 || bx === 44) && by === 3) { MATX = RUST[1]; return -9; }   // o prego e a ferrugem dele
  const rot = cn(x, y, 6, 6, 37155); if (rot > 0.32 && id > 0.5) { MATX = LIMO[clamp(Math.round((rot - 0.32) * 10 + cg(x, y, 37156) * 1.5), 0, 4)]; return -9; }
  return v;
}
function vSape(x, y) {   // sapê: a palha em fiadas de 8, os fios inclinados, a beirada de cada fiada fazendo sombra
  const Y = wrapT(y), row = Math.floor(Y / 8), by = Y % 8, X = x + row * 5;
  const st = Math.sin((X * 1.0 + by * 0.6) * W2 * 80 + hash2(Math.floor(X / 3), row, 37161) * 4);
  let v = 2.9 + st * 0.6 - by * 0.18 + cg(x, y, 37162) * 0.5;
  if (by === 7) v -= 1.2;
  if (hash2(x, y, 37163) < 0.04) v += 1.2;
  if (cn(x, y, 8, 8, 37164) > 0.3) v -= 0.8;                                                               // palha podre mais escura
  return v;
}
function vPauPique(x, y) {   // pau a pique: as varas em pé a cada 8, as ripas deitadas trançadas, o barro cobrindo em placas
  const X = wrapT(x), Y = wrapT(y), sx = X % 8, ry = Y % 10;
  let v;
  const mud = cn(x, y, 10, 10, 37171) + cn(x, y, 30, 30, 37172) * 0.5;
  if (mud > 0.05) { v = 2.6 + cn(x, y, 24, 24, 37173) * 0.8 + cg(x, y, 37174) * 0.6; if (mud < 0.09) v -= 1.0; if (hash2(x, y, 37175) < 0.04) v -= 0.8; return v; }
  if (sx < 2) return 3.2 - sx * 0.9 + cg(x, y, 37176) * 0.4;                                                // a vara
  const over = (Math.floor(X / 8) + Math.floor(Y / 10)) & 1;
  v = 2.6 + (ry < 4 ? (over ? 1 : -0.4) : -0.9) + Math.sin(X * 0.8) * 0.2 + cg(x, y, 37177) * 0.4;           // a ripa trançada
  return v;
}
function vMenir(x, y) {   // menir: granito salpicado, líquen pálido em manchas, a espiral riscada
  let v = 2.9 + cn(x, y, 12, 12, 37181) * 0.9 + cn(x, y, 40, 40, 37182) * 0.5 + cg(x, y, 37183) * 0.7;
  if (hash2(x, y, 37184) < 0.05) v += 1.1; else if (hash2(x, y, 37185) < 0.05) v -= 1.1;                 // os grãos do granito
  const s = cells(x, y, 60, 37186);
  if (s.id < 0.4) { const r = 6 + s.id * 14, d = s.d1; if (d < r) { const a = Math.atan2(s.oy, s.ox), sp = (d / r * 3 - a / 6.2832 + 4) % 1; if (sp < 0.12) return 0.9; if (sp < 0.2) v += 0.7; } }   // a espiral
  const lq = cn(x, y, 7, 7, 37187); if (lq > 0.3 && hash2(x, y, 37188) < 0.8) { MATX = LIQ[clamp(Math.round(1 + (lq - 0.3) * 9 + cg(x, y, 37189) * 1.6), 0, 4)]; return -9; }
  return v;
}
function vRaiz(x, y) {   // raizame: tubos de raiz cruzando em ângulos, o vão escuro entre eles
  let best = -1, v = 0.6 + cg(x, y, 37191) * 0.3;
  for (let k = 0; k < 4; k++) {
    const a = (k * 0.9 + 0.4), ux = Math.cos(a), uy = Math.sin(a), d = (x * uy - y * ux) + cn(x, y, 6, 6, 37192 + k) * 30;
    const per = 26 + k * 7, m = ((d % per) + per) % per - per / 2, w = 4 + k % 2 * 2;
    if (Math.abs(m) < w) { const t = m / w; const l = 3.2 - t * 1.4 - t * t * 0.8 + Math.sin((x * ux + y * uy) * 0.7) * 0.3 + cg(x, y, 37196) * 0.4; if (l > best) best = l; }
  }
  return best > 0 ? best : v;
}
function vCrosta(x, y) {   // crosta de ferro: nódulos de limonita, redondos, com a casca clara de cima e o miolo escuro
  const c = cells(x, y, 14, 37201);
  const r = 4 + c.id * 4, d = c.d1;
  if (d < r) { const sh = (c.ox + c.oy) / r; return 3.4 - sh * 1.6 - (d / r) * 0.6 + cg(x, y, 37202) * 0.4 + (d > r - 1 ? -0.6 : 0); }
  return 1.2 + cn(x, y, 20, 20, 37203) * 0.8 + cg(x, y, 37204) * 0.5;
}
function vEspinho(x, y) {   // o Espinheiro da Velha: galhos pretos tortos, espinhos claros, uma flor branca aqui e ali
  let best = -1;
  for (let k = 0; k < 3; k++) {
    const a = 0.5 + k * 1.1, ux = Math.cos(a), uy = Math.sin(a), d = (x * uy - y * ux) + Math.sin((x * ux + y * uy) * W2 * 8) * 10 + cn(x, y, 8, 8, 37211 + k) * 20;
    const per = 18 + k * 5, m = ((d % per) + per) % per - per / 2;
    if (Math.abs(m) < 2.2) { const l = 3 - m * 0.6 + cg(x, y, 37214) * 0.4; if (l > best) best = l; }
    else if (Math.abs(m) < 4.2 && hash2(x >> 1, y >> 1, 37215 + k) < 0.06) { MATX = BLOSS[2]; return -9; }   // o espinho
  }
  const fl = cells(x, y, 40, 37217); if (fl.id < 0.12 && fl.d1 < 2.2) { MATX = BLOSS[fl.ox + fl.oy < 0 ? 3 : 1]; return -9; }   // a flor
  return best > 0 ? best : 0.4 + cg(x, y, 37218) * 0.3;
}

/* ---- paredes de fundo (só o tom) ---- */
const vTurfaW = (x, y) => { const v = vTurfa(x, y); return v === -9 ? 3.2 : v; };
const vPedraW = (x, y) => { const v = vPedra(x, y); return v === -9 ? 3 : v; };
const vTabuaW = (x, y) => { const v = vTabua(x, y); return v === -9 ? 2.4 : v; };
const vRaizW = (x, y) => vRaiz(x, y) * 0.95 + 0.2;
const vMenirW = (x, y) => { const v = vMenir(x, y); return v === -9 ? 3.4 : v * 0.9 + 0.2; };

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpMata(x, y) {   // a mata afogada: troncos mortos em pé, finos, galhos tortos, a névoa clareando embaixo
  let v = 0.8 + (y / TP) * 1.2 + cn(x, y, 6, 6, 37221) * 0.6 + cg(x, y, 37222) * 0.2;
  for (const [c0, w, s] of [[20, 5, 1], [74, 7, 2], [130, 4, 3], [190, 6, 4], [222, 3, 5]]) {
    const cx = c0 + Math.sin(y * W2 * 2 + s) * 4, dx = x - cx;
    if (Math.abs(wrapD(dx)) < w * (0.8 + 0.2 * Math.sin(y * 0.1 + s))) v = 2.6 + (wrapD(dx) < 0 ? 0.7 : -0.3) + cg(x, y, 37223 + s) * 0.3;
    const by = (s * 47) % 180 + 20, bdx = wrapD(x - cx), bl = Math.abs(bdx) < 26 && Math.abs(y - (by - Math.abs(bdx) * (0.6 + s * 0.1))) < 1.6;
    if (bl) v = 2.4;
  }
  return v;
}
function vDpPalafitas(x, y) {   // as palafitas ao longe: cabanas sobre estacas, telhados em ponta, a água lisa embaixo
  const wl = TP * 0.78; let v = 0.7 + cn(x, y, 8, 8, 37231) * 0.5 + cg(x, y, 37232) * 0.2;
  if (y > wl) return 1.2 + Math.sin(y * W2 * 60) * 0.3 + cn(x, y, 20, 4, 37233) * 0.6;
  for (const [c0, w, h, s] of [[30, 36, 40, 1], [110, 30, 34, 2], [176, 40, 46, 3]]) {
    const dx = wrapD(x - c0), base = wl - 26, roof = base - h;
    if (Math.abs(dx) < w / 2 && y > roof + Math.abs(dx) * 0.9 && y < base) v = 2.2 + (dx < 0 ? 0.6 : 0) + (Math.abs(dx) < w / 2 - 3 && y > base - 10 && y < base - 4 && Math.abs(dx) < 3 ? -1.4 : 0) + cg(x, y, 37234 + s) * 0.3;
    if (y >= base && y < wl && Math.abs(dx) < w / 2 && ((dx + 40) % 9) < 2) v = 2;
    if (y >= base && y < base + 2 && Math.abs(dx) < w / 2 + 4) v = 2.6;
  }
  return v;
}
function vDpForcas(x, y) {   // as forcas e as pedras em pé ao longe: postes com a trave e a corda, os menires em fila
  let v = 0.7 + cn(x, y, 10, 10, 37241) * 0.6 + cg(x, y, 37242) * 0.2;
  const gl = TP * 0.8; if (y > gl) v = 1.6 + cn(x, y, 16, 16, 37243) * 0.6;
  for (const [c0, s] of [[40, 1], [150, 2]]) {   // a forca
    const dx = wrapD(x - c0), top = gl - 90;
    if (Math.abs(dx + 18) < 2.5 && y > top && y < gl) v = 2.4 + (dx + 18 < 0 ? 0.5 : 0);
    if (y > top && y < top + 4 && dx > -20 && dx < 14) v = 2.6;
    if (Math.abs(dx - 8) < 0.8 && y > top + 4 && y < top + 30) v = 2.2;
    if (Math.abs(dx - 8) < 3 && y > top + 30 && y < top + 48) v = 1.9;
  }
  for (const [c0, w, h] of [[92, 10, 46], [108, 8, 34], [200, 12, 52], [220, 8, 30]]) { const dx = wrapD(x - c0); if (Math.abs(dx) < w / 2 && y > gl - h + Math.abs(dx) * 0.4) v = 2.1 + (dx < 0 ? 0.5 : 0) + cg(x, y, 37244) * 0.3; }
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  turfa: bake(vTurfa), lama: bake(vLama), argila: bake(vArgila), pedra: bake(vPedra), tabua: bake(vTabua), sape: bake(vSape), pauPique: bake(vPauPique),
  menir: bake(vMenir), raiz: bake(vRaiz), crosta: bake(vCrosta), espinho: bake(vEspinho),
  turfaW: bake(vTurfaW), pedraW: bake(vPedraW), tabuaW: bake(vTabuaW), raizW: bake(vRaizW), menirW: bake(vMenirW),
  dpMata: bake(vDpMata), dpPalafitas: bake(vDpPalafitas), dpForcas: bake(vDpForcas)
};
const BJ_SOLIDS = [
  // id, paleta, textura, dureza, cor no mapa
  [BJ_TURFA, 'bjTurfa', 'turfa', 0.6, '#3e2c1a'], [BJ_LAMA, 'bjLama', 'lama', 0.45, '#3a3028'], [BJ_ARGILA, 'bjArgila', 'argila', 0.8, '#58605e'],
  [BJ_PEDRA, 'bjPedra', 'pedra', 1.3, '#3e4a3a'], [BJ_TABUA, 'bjTabua', 'tabua', 0.5, '#664e30'], [BJ_SAPE, 'bjSape', 'sape', 0.25, '#8c743e'],
  [BJ_PAU_PIQUE, 'bjPauPique', 'pauPique', 0.45, '#5a4632'], [BJ_MENIR, 'bjMenir', 'menir', 2.0, '#6a6e66'], [BJ_RAIZ, 'bjRaiz', 'raiz', 0.7, '#48301c'],
  [BJ_CROSTA, 'bjCrosta', 'crosta', 1.4, '#8c4e24']
];
for (const [t, p, k, dig, col] of BJ_SOLIDS) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [BJ_TURFA, BJ_LAMA, BJ_ARGILA, BJ_PEDRA, BJ_RAIZ]) BLEND[t] = 1;
// o Espinheiro da Velha: sólido, não quebra
MAT[BJ_BARREIRA] = [PALS.bjEspinho, BKV.espinho]; SOLID[BJ_BARREIRA] = 1; BLOCKY[BJ_BARREIRA] = 1; DIG[BJ_BARREIRA] = 0; PCOL[BJ_BARREIRA] = '#261e22';

WMAT[WBJ_TURFA] = [PALS.bjTurfaW, BKV.turfaW]; WMAT[WBJ_PEDRA] = [PALS.bjPedraW, BKV.pedraW]; WMAT[WBJ_TABUA] = [PALS.bjTabuaW, BKV.tabuaW];
WMAT[WBJ_RAIZ] = [PALS.bjRaizW, BKV.raizW]; WMAT[WBJ_MENIR] = [PALS.bjMenirW, BKV.menirW];
DMAT[DP_BJ_MATA] = [PALS.dpBjMata, BKV.dpMata]; DMAT[DP_BJ_PALAFITAS] = [PALS.dpBjPalafitas, BKV.dpPalafitas]; DMAT[DP_BJ_FORCAS] = [PALS.dpBjForcas, BKV.dpForcas];

/* ---- os minérios: carvão de turfa (o linhito, na turfa e na argila) e o ferro-do-brejo: nódulos ferrugem com o
   brilho cinza do metal onde a casca quebrou ---- */
oreRamp(BJ_O_FERRO, ['#140a06', '#26120a', '#3e1e10', '#5e3018', '#844624', '#a8643a', '#c8c0b4']);
ORE_PAINT[BJ_O_FERRO] = function (L, s) {
  const R = ORE_RAMP[BJ_O_FERRO], n = 3 + (hash2(s, 1, 37401) < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const cx = 2.4 + hash2(s, 2 + i, 37402) * 7.2, cy = 2.4 + hash2(s, 3 + i, 37403) * 7.2, r = 1.4 + hash2(s, 4 + i, 37404) * 1.4;
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d > r) continue;
      let l = 4 - (dx + dy) / r * 1.3 - d / r * 0.8 + (hash2(x + s, y, 37405) - 0.5) * 0.5;
      if (d < r * 0.45 && dx + dy < 0 && hash2(s, i, 37406) < 0.6) l = 6;                                  // o metal aparecendo
      L.put(x, y, ramp(R, Math.min(l, 6)), l);
    }
  }
};
ORE_HALO[BJ_O_FERRO] = { pal: ['bjTurfa', '#7c3e18', 0.32, 0.12], shade: 0.2, drip: true };
ORE_PAINT[BJ_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[BJ_O_CARVAO] = { pal: ['bjTurfa', '#060504', 0.45, 0.18], shade: 0 };
MAT[BJ_O_CARVAO] = [PALS.bjTurfa, bakeOre(BJ_O_CARVAO, vTurfa)]; MAT[BJ_O_FERRO] = [PALS.bjTurfa, bakeOre(BJ_O_FERRO, vTurfa)];
for (const t of [BJ_O_CARVAO, BJ_O_FERRO]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[BJ_O_CARVAO] = DIG[COAL]; ORE_XP[BJ_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[BJ_O_CARVAO] = ORE_NAME[COAL]; PCOL[BJ_O_CARVAO] = PCOL[COAL]; ORE_ITEM[BJ_O_CARVAO] = ORE_ITEM[COAL];
DIG[BJ_O_FERRO] = 1.2; ORE_XP[BJ_O_FERRO] = 13; ORE_NAME[BJ_O_FERRO] = 'Ferro-do-Brejo'; PCOL[BJ_O_FERRO] = '#a8643a'; ORE_ITEM[BJ_O_FERRO] = 'min_ferrobrejo';

/* ---- itens de bloco ---- */
const BJ_ITEMS = {
  turfa: ['Turfa', BJ_TURFA, 'Terra de brejo feita de mil anos de musgo podre. Seca, queima devagar e fede.'],
  lama_brejo: ['Lama de Brejo', BJ_LAMA, 'Lama preta e mole. Prende o pé de quem pisa.'],
  argila_brejo: ['Argila de Brejo', BJ_ARGILA, 'Argila cinza-azulada, fria, em lâminas. Tem manchas de ferrugem.'],
  pedra_brejo: ['Pedra do Brejo', BJ_PEDRA, 'Calcário esverdeado, coberto de limo. É a rocha do pântano debaixo da terra.'],
  tabua_velha: ['Tábua Velha', BJ_TABUA, 'Uma prancha das palafitas das bruxas, inchada de água. Ainda aguenta peso.'],
  sape: ['Sapê', BJ_SAPE, 'Palha de junco amarrada em feixes, o telhado das cabanas do brejo.'],
  pau_pique: ['Pau a Pique', BJ_PAU_PIQUE, 'Varas trançadas e barro. A parede das cabanas, que nunca seca.'],
  menir: ['Pedra de Menir', BJ_MENIR, 'Granito de uma pedra em pé do Círculo, com uma espiral riscada que ninguém lembra quem fez.'],
  raizame: ['Raizame', BJ_RAIZ, 'Um nó de raízes de árvore afogada, preto e duro.'],
  crosta_ferro: ['Crosta de Ferro', BJ_CROSTA, 'Nódulos de ferrugem que o brejo junta no fundo da água parada.']
};
for (const id in BJ_ITEMS) { const [name, block, desc] = BJ_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }

/* ================= decoração: sprites de 12x12 em rampas de 7 tons ================= */
const DRB = {
  corda: ['#1e160c', '#342614', '#4e3c20', '#6a5430', '#866e42', '#a28a58', '#bea672'],
  pau: ['#140c06', '#24180c', '#382614', '#4e3820', '#664c2e', '#80623e', '#9a7a52'],
  junco: ['#141a0c', '#222c12', '#34421a', '#4a5a24', '#647430', '#80903e', '#9cac50'],
  taboa: ['#1a0e08', '#2c180c', '#422412', '#5a321a', '#724224', '#8c5430', '#a86a40'],
  musgo: ['#121610', '#1e2418', '#2c3422', '#3c462e', '#4e5a3a', '#646e4a', '#7c865e'],
  osso: ['#2a261e', '#4a4436', '#6e6652', '#968c74', '#bcb296', '#ddd4ba', '#f6f0de'],
  lama: ['#0e0a08', '#1a1410', '#2a2018', '#3a2e22', '#4c3e30', '#625040', '#7a6650'],
  vela: ['#060606', '#0e0e10', '#18181c', '#242428', '#323238', '#44444c', '#5c5c66'],
  cera: ['#3a3628', '#5a5440', '#7c745a', '#9e9476', '#c0b694', '#dcd4b4', '#f4eed6'],
  galho: ['#100a06', '#1e140c', '#2e2014', '#402e1c', '#544026', '#6a5232', '#82663e'],
  fatuo: ['#0e2a1e', '#1e4a34', '#36704e', '#5a9a6e', '#88c494', '#bce8c0', '#eefff0'],
  turfa: ['#100a06', '#1c140c', '#2a1e12', '#3a2c1a', '#4e3c26', '#645034', '#7c6644'],
  pano: ['#1a1614', '#2c2622', '#403834', '#564c46', '#6e625a', '#887a70', '#a49488']
};
for (const k in DRB) DRB[k] = DRB[k].map(h => ph(h));
/* a escada de corda: dois cabos torcidos de corrimão, degraus de pau amarrados a cada 4; o topo com o nó de amarra */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), C = DRB.corda, P = DRB.pau;
  for (let y = 0; y < 12; y++) for (const x0 of [1, 9]) {
    const tw = ((y + x0 + s) % 3 + 3) % 3;
    a.put(x0, y, C, 4.4 + (tw < 1 ? 0.8 : -0.4) + cg(x0, y, s) * 0.3); a.put(x0 + 1, y, C, 2.8 + (tw > 1.8 ? 0.6 : 0));
  }
  for (const ry of [1, 5, 9]) {
    if (k === 2 && ry === 9) continue;
    for (let x = 2; x <= 9; x++) { a.put(x, ry, P, 4.6 - (x - 2) * 0.16 + cg(x, ry, s) * 0.5); a.put(x, ry + 1, P, 2.2); }
    for (const x0 of [1, 9]) { a.put(x0, ry, C, 5.2); a.put(x0 + 1, ry + 1, C, 3.4); }   // a amarra
  }
  if (k === 1) { for (let x = 0; x < 12; x++) a.put(x, 0, C, 4.4 - Math.abs(x - 5.5) * 0.1); a.put(0, 1, C, 3); a.put(11, 1, C, 2.6); }
  if (k === 2) for (const x0 of [1, 9]) { a.put(x0 - 1, 11, C, 3.4); a.put(x0 + 2, 11, C, 2.4); }
  return rimOut(a, C[0], false);
}
const ESCADA = [escadaSprite(0, 37501), escadaSprite(1, 37502), escadaSprite(2, 37503), escadaSprite(0, 37504)];
/* a corda de forca: o cânhamo torcido; a ponta de baixo é o laço do enforcado */
function cordaSprite(k, s) {   // 0 meio, 1 meio (outra torção), 2 o laço
  const a = spr(), C = DRB.corda;
  const len = k === 2 ? 4 : 12;
  for (let y = 0; y < len; y++) { const tw = ((y * 1.2 + s) % 3 + 3) % 3; a.put(5, y, C, 4.6 + (tw < 1 ? 0.8 : -0.5)); a.put(6, y, C, 3 + (tw > 1.8 ? 0.7 : 0)); }
  if (k === 2) {
    for (let y = 4; y < 7; y++) { a.put(5, y, C, 5.2 - (y - 4) * 0.3); a.put(6, y, C, 3.8); a.put(4, y, C, 2.4); a.put(7, y, C, 2.2); }   // o nó enrolado
    disc(a, 5.8, 9.2, 3.2, 2.6, C, (dx, dy, d) => d > 0.45 ? 4.4 - dy * 1.4 - dx * 0.8 : -1);                                       // o laço
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const k2 = y * 12 + x; if (a[k2] === C[0] && false) a[k2] = 0; }
  }
  return rimOut(a, C[0], false);
}
const CORDA = [cordaSprite(0, 37511), cordaSprite(1, 37512), cordaSprite(2, 37513)];
/* o junco e a taboa: talos finos, folhas longas caindo, a espiga marrom da taboa */
function juncoSprite(v, s) {
  const a = spr(), J = DRB.junco, Tb = DRB.taboa;
  const stalks = v === 0 ? [[3, 1, -0.1], [6, 3, 0.05], [9, 0, 0.12]] : v === 1 ? [[2, 2, 0.1], [5, 0, -0.05], [8, 4, 0.08], [10, 3, 0.2]] : [[4, 3, -0.15], [7, 1, 0.1]];
  for (const [x0, top, lean] of stalks) {
    for (let y = top; y < 12; y++) { const x = x0 + (11 - y) * lean; a.put(x, y, J, 3.4 + (y < 6 ? 0.8 : 0) - (y > 9 ? 0.8 : 0) + cg(x | 0, y, s) * 0.4); }
    if (hash2(x0, top, s) < 0.6) { const hx = x0 + (11 - top - 2) * lean; for (let y = top + 1; y < top + 4; y++) { a.put(hx, y, Tb, 4.2 - (y - top) * 0.5); a.put(hx + 1, y, Tb, 2.6); } }   // a espiga
  }
  for (const [x, y, d] of [[1, 8, 1], [11, 7, -1]]) for (let k = 0; k < 4; k++) a.put(x + d * k * 0.6, y + k * 0.8, J, 4.6 - k * 0.6);   // folhas caídas
  return rimOut(a, J[0], true);
}
const JUNCO = [juncoSprite(0, 37521), juncoSprite(1, 37522), juncoSprite(2, 37523), flipX(juncoSprite(1, 37524))];
/* o fogo-fátuo: só o miolo (a chama, o brilho e o vaivém são ao vivo) */
function fatuoSprite(s) { const a = spr(), F = DRB.fatuo; a.put(6, 6, F, 6); a.put(5, 6, F, 4.4); a.put(6, 5, F, 5); return a; }
const FATUO = [fatuoSprite(37531)];
/* a barba-de-velho: o musgo cinza-esverdeado pendurado do teto em fios desiguais */
function musgoSprite(v, s) {
  const a = spr(), M = DRB.musgo;
  for (let x = 0; x < 12; x++) {
    const n = 2 + ((hash2(x, v, s) * 5) | 0) + (x % 3 === v ? 4 : 0);
    for (let y = 0; y < n && y < 12; y++) { const sw = Math.round(Math.sin(y * 0.8 + x) * 0.5); a.put(x + sw, y, M, 4.6 - y * 0.35 + cg(x, y, s) * 0.8); }
  }
  return rimOut(a, M[0], false);
}
const MUSGO = [musgoSprite(0, 37541), musgoSprite(1, 37542), musgoSprite(2, 37543)];
/* a estaca de palafita: o pau grosso de 5, o veio, a casca soltando; o pé escuro de molhado com o limo; o topo com o
   entalhe que segura a tábua */
function posteSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), P = DRB.pau, M = DRB.musgo;
  for (let y = 0; y < 12; y++) for (let x = 3; x <= 8; x++) {
    const d = (x - 5.5) / 2.6; let l = 4 - d * 1.6 + Math.sin(y * 1.7 + x * 2 + s) * 0.25 + cg(x, y, s) * 0.4;
    if (x === 5 && (y + s) % 5 === 0) l -= 1.2;                                                               // racha do veio
    if (k === 2) l -= (y > 5 ? 1 : 0.4);
    a.put(x, y, P, l);
  }
  if (k === 2) for (let x = 3; x <= 8; x++) for (let y = 7; y < 12; y++) if (hash2(x, y, s) < 0.45) a.put(x, y, M, 3.4 - (y - 7) * 0.2);
  if (k === 1) { for (let x = 2; x <= 9; x++) a.put(x, 0, P, 5 - Math.abs(x - 5.5) * 0.2); a.put(2, 1, P, 3); a.put(9, 1, P, 2.4); }
  if (k === 0 && s % 2) for (const y of [3, 4]) { a.put(3, y, DRB.corda, 4.8); a.put(8, y, DRB.corda, 3.6); }   // a amarra de corda
  return rimOut(a, P[0], false);
}
const POSTE = [posteSprite(0, 37551), posteSprite(1, 37552), posteSprite(2, 37553), posteSprite(0, 37554)];
/* a vela preta: o toco de sebo preto sobre um morrinho de cera escorrida, o pavio (a chama é ao vivo) */
const VELA_F = [[5, 4], [7, 6]];
function velaSprite(v, s) {
  const a = spr(), V = DRB.vela, C = DRB.cera, [fx, fy] = VELA_F[v], h = 11 - fy;
  for (let y = fy + 1; y < 11; y++) for (let x = fx - 1; x <= fx + 1; x++) a.put(x, y, V, 3.6 - (x - fx) * 1.2 + (y === fy + 1 ? 1 : 0) + cg(x, y, s) * 0.3);
  for (let x = fx - 3; x <= fx + 3; x++) a.put(x, 11, C, 3 - Math.abs(x - fx) * 0.3);                      // a cera escorrida no chão
  a.put(fx + 2, 10, C, 2.4); a.put(fx - 2, 10, C, 3);
  for (let y = fy + 2; y < fy + 2 + ((h * 0.6) | 0); y++) a.put(fx - 1, y, C, 3.4);                           // o pingo escorrendo
  a.put(fx, fy, DRB.pau, 1);                                                                                 // o pavio
  if (v === 0) { a.put(9, 11, V, 2); a.put(9, 10, V, 3); a.put(10, 11, C, 2.6); }                          // um toquinho do lado
  return rimOut(a, V[0], true);
}
const VELA = [velaSprite(0, 37561), velaSprite(1, 37562)];
/* ossos no lodo: um crânio meio afundado, uma costela saindo, a lama em volta */
function ossosSprite(v, s) {
  const a = spr(), O = DRB.osso, L = DRB.lama;
  if (v === 0) {
    disc(a, 5, 8.4, 3.2, 2.8, O, (dx, dy) => 4.6 - dy * 1.2 - dx * 0.8); a.put(4, 8, O, 0.6); a.put(6, 8, O, 0.8); a.put(5, 10, O, 1.4);
    for (let k = 0; k < 4; k++) a.put(9 + k * 0.4, 9 - k, O, 4.4 - k * 0.3);
  } else {
    for (let k = 0; k < 7; k++) { const t = k / 6, x = 2 + t * 8, y = 10 - Math.sin(t * Math.PI) * 4; a.put(x, y, O, 4.8 - t); a.put(x, y + 1, O, 2.4); }
    for (let x = 6; x <= 10; x++) a.put(x, 9, O, 4.2); a.put(5, 8, O, 5);
  }
  for (let x = 0; x < 12; x++) { a.put(x, 11, L, 3 + cg(x, 11, s) * 0.6); if (hash2(x, 1, s) < 0.5) a.put(x, 10, L, 2.6); }
  return rimOut(a, L[0], true);
}
const OSSOS = [ossosSprite(0, 37571), ossosSprite(1, 37572), flipX(ossosSprite(0, 37573))];
/* o amuleto de galhos: um bonequinho de gravetos amarrado em cruz, pendurado num barbante, com uma pena e um osso */
function amuletoSprite(v, s) {
  const a = spr(), G = DRB.galho, C = DRB.corda, O = DRB.osso;
  for (let y = 0; y < 3; y++) a.put(6, y, C, 3.6);
  for (let y = 3; y < 11; y++) a.put(6, y, G, 4.2 - (y > 7 ? 1 : 0));                                       // o corpo
  for (let x = 3; x <= 9; x++) a.put(x, 5, G, 4.4 - Math.abs(x - 6) * 0.2);                                 // os braços
  a.put(4, 10, G, 3.6); a.put(8, 10, G, 3.2); a.put(5, 9, G, 3.8); a.put(7, 9, G, 3.4);                    // as pernas
  disc(a, 6, 3.6, 1.3, 1.1, O, (dx, dy) => 4.8 - dy - dx);                                                    // a cabecinha de osso
  for (const x of [5, 7]) a.put(x, 5, C, 5);                                                                  // a amarra
  if (v) { a.put(10, 6, DRB.vela, 4); a.put(10, 7, DRB.vela, 3); a.put(11, 8, DRB.vela, 2.4); a.put(3, 6, O, 4.6); a.put(3, 7, O, 3.4); }   // a pena preta e o ossinho
  return rimOut(a, G[0], false);
}
const AMULETO = [amuletoSprite(0, 37581), amuletoSprite(1, 37582)];
/* a goteira: a mancha molhada no teto com a gota formando (a queda é ao vivo) */
function gotaSprite(s) { const a = spr(), L = DRB.lama; for (let x = 3; x <= 8; x++) { a.put(x, 0, L, 3.6 - Math.abs(x - 5.5) * 0.3); if (x > 3 && x < 8) a.put(x, 1, L, 2.6); } a.put(5, 2, DRB.cera, 4); a.put(6, 2, L, 2); return rimOut(a, L[0], false); }
const GOTA = [gotaSprite(37591)];
/* o crânio na estaca: o aviso dos caçadores, um crânio de gente num pau fincado, uma fita de pano rasgada */
function cranioSprite(v, s) {
  const a = spr(), P = DRB.pau, O = DRB.osso, N = DRB.pano;
  for (let y = 4; y < 12; y++) { a.put(5, y, P, 4.2); a.put(6, y, P, 2.6); }
  disc(a, 5.6, 2.6, 2.8, 2.4, O, (dx, dy) => 4.8 - dy * 1.1 - dx * 0.9); a.put(4, 2, O, 0.6); a.put(7, 2, O, 0.8); a.put(5, 4, O, 1.2); a.put(6, 4, O, 4); a.put(4, 4, O, 3.6);
  const d = v ? -1 : 1; for (let k = 0; k < 5; k++) a.put(5.5 + d * (1 + k * 0.8), 6 + k * 0.7 + Math.sin(k) * 0.4, N, 3.8 - k * 0.4);
  return rimOut(a, P[0], true);
}
const CRANIO = [cranioSprite(0, 37601), cranioSprite(1, 37602)];
/* a touceira de turfa: um tufo de capim de brejo saindo de um torrão escuro */
function touceiraSprite(v, s) {
  const a = spr(), J = DRB.junco, Tu = DRB.turfa;
  disc(a, 6, 10.4, 4.6, 2, Tu, (dx, dy) => 3.6 - dy - dx * 0.7 + cg(dx * 9 | 0, dy * 9 | 0, s) * 0.5);
  for (let k = 0; k < 9; k++) { const x0 = 2.4 + k * 0.9, top = 3 + ((hash2(k, v, s) * 4) | 0), lean = (k - 4) * 0.12; for (let y = top; y < 10; y++) a.put(x0 + (10 - y) * lean, y, J, 3 + (y < top + 2 ? 1.4 : 0) - (k % 2) * 0.5); }
  return rimOut(a, Tu[0], true);
}
const TOUCEIRA = [touceiraSprite(0, 37611), touceiraSprite(1, 37612), flipX(touceiraSprite(0, 37613))];

DECO[BJ_ESCADA] = ESCADA; DECO[BJ_CORDA] = CORDA; DECO[BJ_JUNCO] = JUNCO; DECO[BJ_FATUO] = FATUO; DECO[BJ_MUSGO] = MUSGO; DECO[BJ_POSTE] = POSTE;
DECO[BJ_VELA] = VELA; DECO[BJ_OSSOS] = OSSOS; DECO[BJ_AMULETO] = AMULETO; DECO[BJ_GOTA] = GOTA; DECO[BJ_CRANIO] = CRANIO; DECO[BJ_TOUCEIRA] = TOUCEIRA;
const BJ_DECO = [
  // id, dureza, cor no mapa, o que solta
  [BJ_ESCADA, 0.25, '#866e42', 'tabua_velha'], [BJ_CORDA, 0.15, '#a28a58', null], [BJ_JUNCO, 0.03, '#647430', null], [BJ_FATUO, 0.02, '#88c494', null],
  [BJ_MUSGO, 0.03, '#4e5a3a', null], [BJ_POSTE, 0.4, '#664c2e', 'tabua_velha'], [BJ_VELA, 0.05, '#323238', null], [BJ_OSSOS, 0.05, '#bcb296', null],
  [BJ_AMULETO, 0.03, '#544026', null], [BJ_GOTA, 0.02, '#3a2e22', null], [BJ_CRANIO, 0.12, '#bcb296', null], [BJ_TOUCEIRA, 0.05, '#4a5a24', null]
];
for (const [t, dig, col, drop] of BJ_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[BJ_FATUO] = 0.55; EMIT[BJ_VELA] = 0.7;
EMIT[BJ_GOTA] = 0.02;   // quase nada: só para entrar na lista do 07 e a gota ser desenhada ao vivo
// o que cai quando o apoio some (56, 87); a escada, a corda e a estaca ficam (atravessam vãos)
for (const t of [BJ_MUSGO, BJ_AMULETO, BJ_GOTA]) CV_HANGS[t] = 1;
for (const t of [BJ_JUNCO, BJ_VELA, BJ_OSSOS, BJ_CRANIO, BJ_TOUCEIRA]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[BJ_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== BJ_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== BJ_ESCADA && !solidAt(gx, gy + 1) ? arr[2] : arr[(gy & 1) * 3];
DECO_PICK[BJ_CORDA] = (gx, gy, arr) => tileAt(gx, gy + 1) === BJ_CORDA || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[BJ_JUNCO] = (gx, gy, arr) => arr[vr(gx, gy, 37521, 4)];
DECO_PICK[BJ_MUSGO] = (gx, gy, arr) => arr[vr(gx, gy, 37541, 3)];
DECO_PICK[BJ_POSTE] = (gx, gy, arr) => tileAt(gx, gy - 1) !== BJ_POSTE ? arr[1] : tileAt(gx, gy + 1) !== BJ_POSTE ? arr[2] : arr[(gy & 1) * 3];
const velaV = (gx, gy) => vr(gx, gy, 37561, 2);
DECO_PICK[BJ_VELA] = (gx, gy, arr) => arr[velaV(gx, gy)];
DECO_PICK[BJ_OSSOS] = (gx, gy, arr) => arr[vr(gx, gy, 37571, 3)];
DECO_PICK[BJ_AMULETO] = (gx, gy, arr) => arr[vr(gx, gy, 37581, 2)];
DECO_PICK[BJ_CRANIO] = (gx, gy, arr) => arr[vr(gx, gy, 37601, 2)];
DECO_PICK[BJ_TOUCEIRA] = (gx, gy, arr) => arr[vr(gx, gy, 37611, 3)];

// a escada de corda e a corda de forca se escalam como a corrente da catedral; a escada conta como a escada da mina (a
// pose de subir de frente, 88), a corda como corda
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, BJ_ESCADA) || _tt(e, BJ_CORDA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, BJ_ESCADA)); }; }

/* ================= ao vivo: o fogo-fátuo, a chama da vela preta, a gota ================= */
const BJ_GL = {};
const bjGlow = (k, r, col) => BJ_GL[k] || (BJ_GL[k] = glow(r, col));
const bjOut = cy => cy + VH < (BJ_S0 - 6) * T || cy > (BJ_S0 + BJ_D + 6) * T;
// o fogo-fátuo vagueia: um ponto que sobe e desce e escorrega de lado, some e volta (nunca muito longe do bloco)
const fatuoPos = (gx, gy, tm) => { const h = hash2(wrapX(gx), gy, 37701) * 50; return [6 + Math.sin(tm * 0.7 + h) * 5 + Math.sin(tm * 1.9 + h * 2) * 1.5, 6 + Math.sin(tm * 1.1 + h * 1.3) * 3]; };
const fatuoVis = (gx, gy, tm) => { const h = hash2(wrapX(gx), gy, 37702) * 30; const s = Math.sin(tm * 0.45 + h) + Math.sin(tm * 1.3 + h) * 0.3; return clamp((s + 0.6) * 1.4, 0, 1); };
const CHAMA = ['#fff6e0', '#ffe2a0', '#f0b860', '#b8702a'];
HOOK.drawGlow.push((cx, cy) => {
  if (bjOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < BJ_ESCADA || t > BJ_TOUCEIRA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === BJ_FATUO) {
      const [px, py] = fatuoPos(gx, gy, tm), vi = fatuoVis(gx, gy, tm); if (vi <= 0) continue;
      lc.globalAlpha = 0.32 * vi; lc.drawImage(bjGlow('fb', 26, BJ_COL.fatuo), x + px - 26, y + py - 26);
      lc.globalAlpha = 0.6 * vi; lc.drawImage(bjGlow('fs', 7, BJ_COL.fatuoFrio), x + px - 7, y + py - 7);
    } else if (t === BJ_VELA) {
      const [fx, fy] = VELA_F[velaV(gx, gy)], f = 0.9 + Math.sin(tm * 10 + gx) * 0.06 + Math.sin(tm * 23 + gy) * 0.04;
      lc.globalAlpha = 0.26 * f; lc.drawImage(bjGlow('vb', 28, BJ_COL.vela), x + fx - 28, y + fy - 30);
      lc.globalAlpha = 0.45 * f; lc.drawImage(bjGlow('vs', 7, '#fff0c8'), x + fx - 7, y + fy - 9);
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (bjOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < BJ_ESCADA || t > BJ_TOUCEIRA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === BJ_FATUO) {   // a chaminha fria: o miolo quase branco, a língua verde balançando, um rastro que some
      const [px, py] = fatuoPos(gx, gy, tm), vi = fatuoVis(gx, gy, tm); if (vi <= 0.15) continue;
      const X = Math.round(x + px), Y = Math.round(y + py), f = Math.floor(tm * 7 + gx) % 3;
      lc.globalAlpha = vi * 0.5; lc.fillStyle = '#5a9a6e'; const [qx, qy] = fatuoPos(gx, gy, tm - 0.25); lc.fillRect(Math.round(x + qx), Math.round(y + qy), 1, 1);
      lc.globalAlpha = vi; lc.fillStyle = '#88c494'; lc.fillRect(X - 1, Y - 1, 3, 2); lc.fillRect(X + (f === 1 ? 1 : f === 2 ? -1 : 0), Y - 3, 1, 2);
      lc.fillStyle = '#eefff0'; lc.fillRect(X, Y - 1, 1, 2);
    } else if (t === BJ_VELA) {   // a chama: o miolo, a língua trocando de lado
      const [fx, fy] = VELA_F[velaV(gx, gy)], f = Math.floor(tm * 9 + gx * 3) % 4, X = x + fx, Y = y + fy;
      lc.fillStyle = CHAMA[2]; lc.fillRect(X + (f === 2 ? 1 : f === 3 ? -1 : 0), Y - 3 - (f === 1 ? 1 : 0), 1, 1);
      lc.fillStyle = CHAMA[1]; lc.fillRect(X, Y - 2, 1, 1); lc.fillStyle = CHAMA[0]; lc.fillRect(X, Y - 1, 1, 1);
    } else if (t === BJ_GOTA) {   // a gota cresce, cai e espirra no chão (ou faz um anel na água)
      const h0 = hash2(wrapX(gx), gy, 37703), per = 2.4 + h0 * 2.6, p = ((tm + h0 * 9) % per) / per;
      let fl = 1; while (fl < 20 && !solidAt(gx, gy + fl) && !aguaAt(gx, gy + fl)) fl++;
      const H = fl * T - 3;
      lc.fillStyle = '#9a8e76';
      if (p < 0.55) { lc.globalAlpha = 0.5 + p; lc.fillRect(x + 5, y + 3, 1, 1 + (p > 0.35 ? 1 : 0)); }
      else if (p < 0.8) { const q = (p - 0.55) / 0.25, yy = 3 + q * q * H; lc.globalAlpha = 0.8; lc.fillRect(x + 5, y + yy, 1, 2); }
      else { const q = (p - 0.8) / 0.2; lc.globalAlpha = 0.6 * (1 - q); const wy = y + fl * T - 1; lc.fillRect(x + 5 - Math.round(q * 3), wy - Math.round(Math.sin(q * 3) * 2), 1, 1); lc.fillRect(x + 6 + Math.round(q * 3), wy - Math.round(Math.sin(q * 3) * 2), 1, 1); }
      lc.globalAlpha = 1;
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(BJART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, wrapT, W2, RX, ROOTL, SPHAG, LIMO, RUST, GLOSS, LIQ, BLOSS, NAIL, DRB, bjGlow, BJ_GL, bjOut,
  vTurfa, vLama, vArgila, vPedra, vTabua, vSape, vPauPique, vMenir, vRaiz, vCrosta, vEspinho, BKV, ESCADA, CORDA, VELA, VELA_F, CHAMA });
}
