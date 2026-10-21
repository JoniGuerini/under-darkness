'use strict';

/* ================= As Ruínas dos Acendedores: blocos, paredes, terceira camada, minérios, decoração, a luz viva =================
   Uma cidade de pedra e brasa apagada. A rocha natural é fuliginosa: arenito escuro em camadas, preto de séculos de
   fumaça, manchas de fuligem subindo das rachaduras. A pedra lavrada são os silhares da cidade (a paleta da ficha da
   Escuridão: pedra lavrada), em fiadas desencontradas, o chanfro aceso em cima e à esquerda, as marcas do cinzel e a
   fuligem subindo do pé. A laje das ruas é larga e gasta, com os sulcos das carroças de carvão. A cinza assentada é fina,
   em camadas. A rocha de brasa é a rocha de antes com veios que ainda ardem por dentro (a luz que nasce do lugar). O
   tijolo refratário é vermelho-ocre, vidrado de calor nos faróis e nos fornos. O bronze dos templos ficou preto, só os
   relevos gastos do sol brilham. A escória é vidro preto com bolhas. A Grade Acesa é ferro em brasa; a grelha da
   Fornalha são barras de ferro deitadas sobre o poço.
   Como o 281, cada material é uma textura contínua de 240x240; contorno, borda acesa, sombra e oclusão vêm do 07. A
   decoração de 1 bloco são sprites de 12x12 em rampas de 7 tons com luz de cima à esquerda; o que brilha e se mexe (a
   chama do braseiro, o pulso da fenda de brasa e dos veios, o cintilar da ardorita) é desenhado ao vivo, só sobre o
   que está na tela. */
const ACART = {};   // ferramentas para 412 (objetos), os bichos (413, 414), o chefe (416) e a ardorita (417)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('acRocha', ['#141210', '#211d19', '#2f2a24', '#3f3830', '#51493e', '#665c4e']);
pal('acLavrada', ['#2a241c', '#3a3226', '#4c4232', '#625640', '#7c6e52', '#9a8a68']);
pal('acLaje', ['#221e1a', '#322c26', '#443d34', '#585044', '#6e6454', '#887c68']);
pal('acCinza', ['#262422', '#383532', '#4c4844', '#625d57', '#7c766e', '#98928a']);
pal('acBrasa', ['#110d0b', '#1c1612', '#29201a', '#372a21', '#46362a', '#574535']);
pal('acTijolo', ['#2a120a', '#44200f', '#5e2e16', '#7a3e1f', '#965230', '#b06a44']);
pal('acBronze', ['#140e08', '#24190e', '#382716', '#4e3820', '#684c2c', '#8a663c']);
pal('acEscoria', ['#08080a', '#111115', '#1a1a20', '#25252d', '#33333d', '#4a4a56']);
pal('acGrade', ['#1a0c06', '#3a180a', '#68280e', '#a04416', '#e0742a', '#ffc070']);
pal('acGrelha', ['#0e0c0b', '#1a1715', '#28231f', '#37302a', '#483f37', '#5c5146']);
// paredes de fundo: sempre bem mais escuras que o chão da frente
pal('acRochaW', ['#070605', '#0a0908', '#0e0c0a', '#12100d', '#161310', '#1b1713']);
pal('acLavradaW', ['#0d0b08', '#120f0b', '#18140f', '#1e1912', '#251f17', '#2d251c']);
pal('acTijoloW', ['#0e0705', '#140a07', '#1b0e09', '#22120b', '#2a170e', '#331c11']);
pal('acTemploW', ['#100d0a', '#16120e', '#1d1812', '#251f17', '#2e271d', '#383024']);
pal('acFornalhaW', ['#060504', '#090706', '#0d0a08', '#110d0a', '#16110c', '#1c150f']);
// a terceira camada: os faróis ao longe, a cidade em silhueta, o clarão da Fornalha (os tons de cima avermelham)
pal('dpAcFarois', ['#030302', '#060504', '#0a0807', '#0f0c0a', '#18130f', '#2a1e14']);
pal('dpAcCidade', ['#030302', '#050404', '#090706', '#0d0b09', '#15110d', '#221a12']);
pal('dpAcFornalha', ['#040202', '#080403', '#0e0604', '#160a05', '#241006', '#3a1a08']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // senos só com múltiplos inteiros disto, para a textura não ter emenda
const RX = hexes => hexes.map(h => ph(h));
const EMBER = RX(['#5a1a06', '#9a3a0c', '#d0601a', '#f08a2a', '#ffbe5a', '#ffe6a8']);   // a brasa dos veios
const SOOT = RX(['#0a0908', '#141210', '#1e1b18']);
const CHISEL = RX(['#a89878', '#c2b28e']);
const SUN = RX(['#6a4c22', '#9a7438', '#c8a056', '#ecc882']);                            // o relevo gasto do sol no bronze
const GLASS = RX(['#2a2a36', '#4a4a5c', '#7a7a92', '#b4b4cc']);
const RUST = RX(['#2a140a', '#462414', '#5e341e']);

/* ---- o chão sólido ---- */
function vRocha(x, y) {   // rocha fuliginosa: arenito escuro em camadas deitadas, fuligem em nuvens, poros, rachaduras com a fuligem subindo
  const sy = y + cn(x, y, 3, 6, 41101) * 20 + cn(x, y, 12, 12, 41102) * 5;
  const band = Math.sin(sy * W2 * 26) * 0.5 + Math.sin(sy * W2 * 66 + 1.7) * 0.25;
  let v = 2.6 + band * 0.6 + cn(x, y, 18, 18, 41103) * 1.0 + cn(x, y, 60, 60, 41104) * 0.5 + cg(x, y, 41105) * 0.5;
  const soot = cn(x, y, 6, 4, 41106); if (soot > 0.2) v -= (soot - 0.2) * 3.2;
  const ck = Math.abs(cn(wrapT(x + cn(x, y, 6, 6, 41107) * 40), wrapT(y + cn(x, y, 6, 6, 41108) * 40), 5, 5, 41109));
  if (ck < 0.005) { MATX = SOOT[0]; return -9; }
  if (ck < 0.01) v -= 0.9;
  const p = cells(x, y, 8, 41110); if (p.id < 0.1 && p.d1 < 1.2) return 0.7;
  if (hash2(x, y, 41111) < 0.01) v += 1.1;
  return v;
}
// os silhares: 24 x 12 em fiadas desencontradas, o chanfro aceso em cima e à esquerda, a junta escura, as marcas do
// cinzel em diagonal, a fuligem subindo do pé de cada pedra, uma ou outra pedra lascada
function vLavrada(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 12), sx = (row & 1) * 12 + (row % 3) * 4, px = wrapT(X + sx), bx = px % 24, by = Y % 12, id = hash2(Math.floor(px / 24), row, 41121);
  let v = 3.1 + cn(x, y, 14, 14, 41122) * 0.8 + cg(x, y, 41123) * 0.35 + (id - 0.5) * 0.9;
  if (by === 11 || bx === 23) return 0.5;                                                                  // a junta
  if (by === 0 || bx === 0) return 4.5 + (id > 0.7 ? 0.4 : 0);                                             // o chanfro aceso
  if (by === 1 || bx === 1) v += 0.6;
  if (by === 10 || bx === 22) v -= 0.8;
  if (((bx + by * 2) % 5 === 0) && hash2(x, y, 41124) < 0.5 && by > 2 && by < 9) v += 0.5;                 // o cinzel
  if (((bx + by * 2) % 5 === 1) && hash2(x, y, 41125) < 0.4 && by > 2 && by < 9) v -= 0.5;
  const st = by / 11 * 1.4 + cn(x, y, 10, 3, 41126) * 2 - 0.9; if (st > 0.3 && id < 0.55) v -= (st - 0.3) * 2.2;   // a fuligem do pé
  if (id > 0.88 && bx > 15 && by < 5 && bx - 15 > by) return 1.2;                                          // a quina lascada
  return v;
}
// a laje das ruas: placas largas irregulares, gastas no meio, os sulcos das carroças correndo de lado, rachaduras
function vLaje(x, y) {
  const c = cells(x, y, 26, 41131, 0.7);
  let v = 3.0 + cn(x, y, 20, 20, 41132) * 0.7 + cg(x, y, 41133) * 0.3 + (c.id - 0.5) * 0.8;
  const e = c.d2 - c.d1; if (e < 1.2) return 0.6; if (e < 2.2) v += c.ox + c.oy < 0 ? 0.9 : -0.6;
  v += Math.max(0, 1 - c.d1 / 13) * 0.5;                                                                   // o meio gasto e mais claro
  const rut = Math.sin(y * W2 * 20 + cn(x, y, 8, 2, 41134) * 2); if (rut > 0.93) v -= 1.0; else if (rut > 0.86) v += 0.4;
  const ck = Math.abs(cn(x, wrapT(y + cn(x, y, 6, 6, 41135) * 30), 6, 6, 41136)); if (ck < 0.004) return 0.9;
  return v;
}
function vCinza(x, y) {   // cinza assentada: cinza fina em camadas apertadas, pontinhos pretos de carvão, fendas de contração
  const sy = y + cn(x, y, 3, 4, 41141) * 10;
  let v = 2.8 + Math.sin(sy * W2 * 44) * 0.4 + cn(x, y, 22, 22, 41142) * 0.8 + cg(x, y, 41143) * 0.7;
  if (hash2(x, y, 41144) < 0.035) { MATX = SOOT[(hash2(x, y, 41145) * 3) | 0]; return -9; }
  const c = cells(x, y, 30, 41146, 1.6); if (c.d2 - c.d1 < 0.7) v -= 1.2;
  return v;
}
// a rocha de brasa: a rocha fuliginosa com veios finos que ainda ardem; o veio é brasa pura, a borda dele chamuscada
function vBrasa(x, y) {
  const v0 = vRocha(x, y);
  const vn = Math.abs(cn(wrapT(x + cn(x, y, 5, 5, 41151) * 36), wrapT(y + cn(x, y, 5, 5, 41152) * 36), 4, 4, 41153));
  if (vn < 0.012) { const k = vn < 0.004 ? 5 : vn < 0.008 ? 4 : 3; MATX = EMBER[clamp(k - (hash2(x, y, 41154) < 0.2 ? 1 : 0), 0, 5)]; return -9; }
  if (vn < 0.02) { MATX = EMBER[vn < 0.016 ? 1 : 0]; return -9; }
  if (vn < 0.03) return (v0 === -9 ? 2 : v0) - 0.8;
  return v0;
}
// o tijolo refratário: 12 x 6 em amarração corrida, argamassa clara de cal queimada, o vidrado de calor escuro em manchas
function vTijolo(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 6), px = wrapT(X + (row & 1) * 6), bx = px % 12, by = Y % 6, id = hash2(Math.floor(px / 12), row, 41161);
  let v = 2.9 + cn(x, y, 10, 10, 41162) * 0.7 + cg(x, y, 41163) * 0.45 + (id - 0.5) * 1.0;
  if (by === 5 || bx === 11) return 1.1 + cg(x, y, 41164) * 0.6;
  if (by === 0 || bx === 0) v += 0.8;
  const gl = cn(x, y, 7, 7, 41165); if (gl > 0.24) v -= (gl - 0.24) * 5;                                  // o vidrado de calor
  if (hash2(x, y, 41166) < 0.02) v -= 1.2;
  return v;
}
// o bronze enegrecido: placas com rebites, o metal quase preto, o relevo gasto do sol (raios) que ainda brilha
function vBronze(x, y) {
  const X = wrapT(x), Y = wrapT(y), bx = X % 40, by = Y % 40, cx = bx - 20, cy = by - 20, r = Math.hypot(cx, cy), id = hash2(Math.floor(X / 40), Math.floor(Y / 40), 41171);
  let v = 2.3 + cn(x, y, 10, 10, 41172) * 0.8 + cg(x, y, 41173) * 0.4;
  if (bx === 0 || by === 0) return 4.0; if (bx === 39 || by === 39) return 0.6;
  for (const [rx, ry] of [[4, 4], [35, 4], [4, 35], [35, 35]]) { const d = Math.hypot(bx - rx, by - ry); if (d < 1.6) return d < 0.8 && bx <= rx && by <= ry ? 5 : 3.6; }
  if (id < 0.6) {   // o sol em relevo: o disco e os raios, gastos (as bordas de cima pegam luz)
    const a = Math.atan2(cy, cx), ray = Math.abs(Math.sin(a * 6)) > 0.82 && r > 9 && r < 15;
    if ((r > 5.5 && r < 7) || ray) { const k = (cx + cy < 0 ? 3 : 1) - (hash2(x, y, 41174) < 0.3 ? 1 : 0); MATX = SUN[clamp(k, 0, 3)]; return -9; }
    if (r < 5.5) v += 0.6;
  }
  const w = cn(x, y, 6, 6, 41175); if (w > 0.28) v -= 1.0;
  return v;
}
function vEscoria(x, y) {   // escória: vidro preto, bolhas de vários tamanhos com a borda de cima acesa, fios de brilho
  const c = cells(x, y, 10, 41181, 1);
  let v = 1.8 + cn(x, y, 14, 14, 41182) * 1.2 + cg(x, y, 41183) * 0.25;
  const r = 1.4 + c.id * 3; if (c.id < 0.5 && c.d1 < r) { if (c.d1 > r - 0.9 && c.oy < 0) { MATX = GLASS[c.ox < 0 ? 3 : 2]; return -9; } return 0.4; }
  const fl = Math.abs(cn(wrapT(x * 0.7 + y * 0.3), y, 16, 16, 41184)); if (fl < 0.008) { MATX = GLASS[1]; return -9; }
  return v;
}
// a Grade Acesa: barras de ferro em pé de 4 em 4, travessas a cada 12, o ferro em brasa (o meio mais quente)
function vGrade(x, y) {
  const X = wrapT(x), Y = wrapT(y), bx = X % 6, by = Y % 12;
  const hot = 2.6 + Math.sin(Y * W2 * 4) * 0.4 + cn(x, y, 10, 10, 41191) * 0.8 + cg(x, y, 41192) * 0.3;
  if (by >= 5 && by <= 6) return by === 5 ? hot + 1.6 : hot + 0.4;
  if (bx === 1) return hot + 1.8; if (bx === 2) return hot + 1; if (bx === 3) return hot - 0.6;
  return 0.3 + cg(x, y, 41193) * 0.3;                                                                    // o vão entre as barras
}
// a grelha da Fornalha: barras de ferro deitadas, 3 de ferro e 1 de vão, as pontas rebitadas
function vGrelha(x, y) {
  const Y = wrapT(y), X = wrapT(x), by = Y % 4, bx = X % 24;
  let v = 2.8 + cn(x, y, 12, 12, 41201) * 0.6 + cg(x, y, 41202) * 0.35;
  if (by === 3) { MATX = EMBER[hash2(Math.floor(X / 3), Math.floor(Y / 4), 41203) < 0.2 ? 1 : 0]; return -9; }   // o vão: a brasa lá embaixo, fraca
  if (by === 0) v += 1.1; if (by === 2) v -= 0.8;
  if (bx === 0 && by === 1) return 4.6;
  const rs = cn(x, y, 5, 5, 41204); if (rs > 0.3) { MATX = RUST[clamp(Math.round((rs - 0.3) * 8), 0, 2)]; return -9; }
  return v;
}

/* ---- paredes de fundo (só o tom) ---- */
const vRochaW = (x, y) => { const v = vRocha(x, y); return v === -9 ? 1 : v; };
const vLavradaW = (x, y) => vLavrada(x, y) * 0.9 + 0.2;
const vTijoloW = (x, y) => vTijolo(x, y) * 0.9 + 0.3;
function vTemploW(x, y) {   // o reboco pintado dos templos: reboco liso descascando, a faixa de chamas pintada em ocre, a fuligem por cima
  const Y = wrapT(y);
  let v = 3.2 + cn(x, y, 8, 8, 41211) * 1.0 + cg(x, y, 41212) * 0.3;
  const fb = Y % 60; if (fb > 20 && fb < 32) { const fl = Math.sin(x * W2 * 24 + Math.sin(fb * 0.5) * 2) * 5 + 26 - fb; v += fl > 0 ? 1.4 : -0.4; }
  const pe = cn(x, y, 5, 5, 41213); if (pe > 0.25) v -= 1.6;                                               // o reboco caído
  const so = cn(x, y, 3, 8, 41214); if (so > 0.2) v -= (so - 0.2) * 3;
  return v;
}
function vFornalhaW(x, y) { const v = vTijolo(x, y); return v * 0.7 + cn(x, y, 4, 4, 41221) * 1.6; }

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpFarois(x, y) {   // faróis ao longe: torres finas em penhascos, a casa da lanterna no alto (apagada), a borda acesa à esquerda
  const cliff = TP * 0.78 - (Math.sin(x * W2 * 2) * 14 + Math.sin(x * W2 * 5 + 1) * 6 + cn(x, 0, 10, 1, 41231) * 10);
  let v = 0.8 + cn(x, y, 14, 14, 41232) * 0.6 + cg(x, y, 41233) * 0.2;
  if (y > cliff) { v = 2.2 + cn(x, y, 18, 18, 41234) * 0.8 + cg(x, y, 41235) * 0.3; if (y < cliff + 2) v = 3.8; }
  for (const [c0, h, w] of [[40, 120, 7], [130, 150, 9], [205, 100, 6]]) {
    const dx = wrapD(x - c0), base = TP * 0.8, top = base - h, ww = w * (1 - (y - top) / h * -0.25);
    if (y > top && y < base && Math.abs(dx) < ww / 2) { v = 2.4 + (dx < -ww / 2 + 1.5 ? 1.4 : 0) - (dx > ww / 2 - 1.5 ? 0.6 : 0) + cg(x, y, 41236) * 0.3; if ((y - top) % 18 < 1) v -= 0.8; }
    if (y > top - 10 && y <= top && Math.abs(dx) < w * 0.8) v = (y - top + 10) % 4 < 1 ? 3.6 : 1.4;     // a casa da lanterna
    if (y > top - 14 && y <= top - 10 && Math.abs(dx) < w * (0.9 - (top - 10 - y) * 0.2)) v = 3;           // o telhado
  }
  return v;
}
function vDpCidade(x, y) {   // a cidade em silhueta: telhados, cúpulas e torres em três planos, janelas pretas
  let v = 0.7 + cn(x, y, 14, 14, 41241) * 0.5 + cg(x, y, 41242) * 0.2;
  for (const [k, base, sc] of [[0, TP * 0.62, 1], [1, TP * 0.78, 1.4], [2, TP * 0.95, 2]]) {
    const bw = 16 * sc, bi = Math.floor(wrapT(x + k * 37) / bw), bx = wrapT(x + k * 37) % bw, hh = (10 + hash2(bi, k, 41243) * 30) * sc;
    const roof = hash2(bi, k, 41244), top = base - hh;
    let ry = top; if (roof < 0.4) ry = top - Math.max(0, bw / 2 - Math.abs(bx - bw / 2)) * 0.7; else if (roof < 0.6) ry = top - Math.sqrt(Math.max(0, (bw / 2) ** 2 - (bx - bw / 2) ** 2)) * 0.8;
    if (y > ry) {
      v = 1.4 + k * 0.5 + cg(x, y, 41245) * 0.2 + (bx < 1.5 ? 0.8 : 0);
      if (y < ry + 1.5) v += 1;
      if ((Math.floor((y - top) / (5 * sc)) % 2 === 1) && bx > 3 && bx < bw - 3 && (Math.floor(bx / (4 * sc)) % 2 === 0)) v = 0.3;
    }
  }
  return v;
}
function vDpFornalha(x, y) {   // o fundo: rocha escura, o clarão da Fornalha subindo de baixo em línguas
  let v = 1.0 + cn(x, y, 16, 16, 41251) * 0.8 + cg(x, y, 41252) * 0.25;
  const h = 1 - y / TP, fl = Math.sin(x * W2 * 7 + cn(x, y, 8, 4, 41253) * 4) * 0.5 + cn(x, y, 6, 3, 41254);
  v += Math.max(0, (1 - h * 1.6) + fl * 0.6) * 3.2;
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  rocha: bake(vRocha), lavrada: bake(vLavrada), laje: bake(vLaje), cinza: bake(vCinza), brasa: bake(vBrasa), tijolo: bake(vTijolo),
  bronze: bake(vBronze), escoria: bake(vEscoria), grade: bake(vGrade), grelha: bake(vGrelha),
  rochaW: bake(vRochaW), lavradaW: bake(vLavradaW), tijoloW: bake(vTijoloW), temploW: bake(vTemploW), fornalhaW: bake(vFornalhaW),
  dpFarois: bake(vDpFarois), dpCidade: bake(vDpCidade), dpFornalha: bake(vDpFornalha)
};
const AC_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [AC_ROCHA, 'acRocha', 'rocha', 1.5, '#3f3830'], [AC_LAVRADA, 'acLavrada', 'lavrada', 1.7, '#7c6e52'], [AC_LAJE, 'acLaje', 'laje', 1.6, '#6e6454'],
  [AC_CINZA, 'acCinza', 'cinza', 0.5, '#625d57'], [AC_BRASA, 'acBrasa', 'brasa', 1.6, '#9a3a0c'], [AC_TIJOLO, 'acTijolo', 'tijolo', 1.4, '#7a3e1f'],
  [AC_BRONZE, 'acBronze', 'bronze', 2.0, '#684c2c'], [AC_ESCORIA, 'acEscoria', 'escoria', 1.2, '#33333d'], [AC_GRELHA, 'acGrelha', 'grelha', 2.2, '#483f37']
];
for (const [t, p, k, dig, col] of AC_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [AC_ROCHA, AC_CINZA, AC_BRASA, AC_ESCORIA]) BLEND[t] = 1;
// a Grade Acesa: sólida, não quebra
MAT[AC_BARREIRA] = [PALS.acGrade, BKV.grade]; SOLID[AC_BARREIRA] = 1; BLOCKY[AC_BARREIRA] = 1; DIG[AC_BARREIRA] = 0; PCOL[AC_BARREIRA] = '#e0742a';
EMIT[AC_BRASA] = 0.42; EMIT[AC_BARREIRA] = 0.5;

WMAT[WAC_ROCHA] = [PALS.acRochaW, BKV.rochaW]; WMAT[WAC_LAVRADA] = [PALS.acLavradaW, BKV.lavradaW]; WMAT[WAC_TIJOLO] = [PALS.acTijoloW, BKV.tijoloW];
WMAT[WAC_TEMPLO] = [PALS.acTemploW, BKV.temploW]; WMAT[WAC_FORNALHA] = [PALS.acFornalhaW, BKV.fornalhaW];
DMAT[DP_AC_FAROIS] = [PALS.dpAcFarois, BKV.dpFarois]; DMAT[DP_AC_CIDADE] = [PALS.dpAcCidade, BKV.dpCidade]; DMAT[DP_AC_FORNALHA] = [PALS.dpAcFornalha, BKV.dpFornalha];

/* ---- os minérios: carvão na rocha fuliginosa, e a ardorita: pepitas de metal vermelho-dourado que guardam o calor ---- */
oreRamp(AC_O_ARDORITA, ['#2a0e06', '#541c0a', '#8a3410', '#c05a18', '#e88a30', '#ffc068', '#fff0c0']);
const ARD_TIP = new Map();   // semente do bloco -> o ponto mais claro (onde o calor pulsa, ao vivo)
ORE_PAINT[AC_O_ARDORITA] = function (L, s) {
  // três a quatro pepitas redondas e achatadas, com a casca escura de óxido e o miolo quente aparecendo por rachaduras
  const R = ORE_RAMP[AC_O_ARDORITA], n = 3 + (hash2(s, 1, 41401) < 0.4 ? 1 : 0);
  let tip = null, best = -9;
  for (let i = 0; i < n; i++) {
    const cx = 2.5 + hash2(s, 2 + i, 41402) * 7, cy = 2.5 + hash2(s, 3 + i, 41403) * 7, rx = 1.4 + hash2(s, i, 41404) * 1.4, ry = rx * (0.7 + hash2(s, i, 41405) * 0.3);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
      let l = 3.4 - (dx + dy) * 1.1 - d * 0.8 + (hash2(x + s, y, 41406) - 0.5) * 0.6;
      if (Math.abs(dx - dy * 0.6 + hash2(i, s, 41407) - 0.5) < 0.12 && d < 0.7) l = 5.6;               // a rachadura com o miolo quente
      if (d > 0.75) l -= 1.2;
      L.put(x, y, ramp(R, clamp(l, 0, 6)), l);
      if (l > best) { best = l; tip = [x, y]; }
    }
  }
  ARD_TIP.set(s, tip);
};
ORE_HALO[AC_O_ARDORITA] = { pal: ['acRocha', '#8a3410', 0.3, 0.1], shade: 0.15 };
ORE_PAINT[AC_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[AC_O_CARVAO] = { pal: ['acRocha', '#050404', 0.45, 0.18], shade: 0 };
MAT[AC_O_CARVAO] = [PALS.acRocha, bakeOre(AC_O_CARVAO, vRocha)]; MAT[AC_O_ARDORITA] = [PALS.acRocha, bakeOre(AC_O_ARDORITA, vRocha)];
for (const t of [AC_O_CARVAO, AC_O_ARDORITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[AC_O_CARVAO] = DIG[COAL]; ORE_XP[AC_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[AC_O_CARVAO] = ORE_NAME[COAL]; PCOL[AC_O_CARVAO] = PCOL[COAL]; ORE_ITEM[AC_O_CARVAO] = ORE_ITEM[COAL];
DIG[AC_O_ARDORITA] = 2.1; ORE_XP[AC_O_ARDORITA] = 34; ORE_NAME[AC_O_ARDORITA] = 'Ardorita'; PCOL[AC_O_ARDORITA] = '#e88a30'; ORE_ITEM[AC_O_ARDORITA] = 'min_ardorita';
EMIT[AC_O_ARDORITA] = 0.2;
const ardTip = (gx, gy) => ARD_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + AC_O_ARDORITA * 7919) | 0);

/* ---- itens de bloco ---- */
const AC_ITEMS = {
  rocha_fuliginosa: ['Rocha Fuliginosa', AC_ROCHA, 'A pedra debaixo do Abismo, preta de séculos de fumaça. Suja a mão de quem pega.'],
  pedra_lavrada: ['Pedra Lavrada', AC_LAVRADA, 'Um silhar da cidade dos Acendedores, cortado em esquadro. Ainda tem as marcas do cinzel.'],
  laje_rua: ['Laje de Rua', AC_LAJE, 'Uma laje das ruas da cidade, gasta no meio pelos pés e pelas rodas das carroças de carvão.'],
  cinza_fria: ['Cinza Fria', AC_CINZA, 'A cinza que cobre tudo na cidade dos Acendedores. Fina, cinza, e não esquenta mais.'],
  rocha_brasa: ['Rocha de Brasa', AC_BRASA, 'Rocha com veios que ainda ardem por dentro. Ninguém acendeu: ela nasceu assim, perto da Fornalha.'],
  tijolo_refratario: ['Tijolo Refratário', AC_TIJOLO, 'Tijolo de faróis e de fornos, vidrado pelo calor. Aguenta o fogo que derrete o ferro.'],
  bronze_negro: ['Bronze Enegrecido', AC_BRONZE, 'Uma placa de bronze dos templos, preta de fuligem. O sol em relevo ainda brilha onde a mão passou.'],
  escoria: ['Escória', AC_ESCORIA, 'O vidro preto que sobra das forjas. Leve, cheio de bolhas, corta a mão.'],
  grelha_ferro: ['Grelha de Ferro', AC_GRELHA, 'Barras de ferro da grelha da Fornalha do Mundo. Ainda mornas.']
};
for (const id in AC_ITEMS) { const [name, block, desc] = AC_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRT = {
  ferro: ['#0e0d0e', '#1c1a1c', '#2c292a', '#3e3a3a', '#545050', '#6e6a68', '#8c8884'],
  ferrugem: ['#1e0e08', '#341a0e', '#4c2816', '#643822', '#7c4a30', '#946044', '#ae7a5c'],
  cinza: ['#262422', '#3c3936', '#54504c', '#6e6964', '#8a847e', '#a8a29a', '#c4beb4'],
  carvao: ['#060505', '#0e0c0b', '#181513', '#221e1b', '#2e2925', '#3a3430', '#4a433d'],
  brasa: ['#3a0e04', '#6a1e08', '#a0380e', '#d0601a', '#f08a2a', '#ffbe5a', '#ffe6a8'],
  cera: ['#3a3226', '#5a4e3a', '#7e7056', '#a49474', '#c8b896', '#e4d8b8', '#f8f0d8'],
  pavio: ['#0e0b08', '#1e1812', '#2e261c', '#40362a', '#54483a', '#6a5c4a', '#827260'],
  pedra: ['#211c16', '#2f2820', '#40372b', '#544838', '#6a5c48', '#84745a', '#a08e70'],
  osso: ['#2a261e', '#4a4436', '#6e6652', '#968c74', '#bcb296', '#ddd4ba', '#f6f0de'],
  pano: ['#140c0a', '#221410', '#341e16', '#48281c', '#5c3424', '#72422e', '#8a543a'],
  fuligem: ['#030303', '#070606', '#0c0b0a', '#12100f', '#191614', '#211d1a', '#2a2522']
};
for (const k in DRT) DRT[k] = DRT[k].map(h => ph(h));
const FE = DRT.ferro;
/* a escada de ferro: dois banzos de ferro batido com rebites, degraus redondos a cada 4, ferrugem escorrendo; o topo com
   os ganchos de prender, o pé com as sapatas */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), y0 = k === 1 ? 2 : 0, y1 = k === 2 ? 10 : 11;
  for (let y = y0; y <= y1; y++) for (const x0 of [1, 9]) { a.put(x0, y, FE, 4.4 + cg(x0, y, s) * 0.5); a.put(x0 + 1, y, FE, 2.6); if (hash2(x0, y, s) < 0.12) a.put(x0 + 1, y, DRT.ferrugem, 3); }
  for (const ry of [2, 6, 10]) { if (ry < y0 || ry > y1) continue; for (let x = 2; x <= 9; x++) { a.put(x, ry, FE, 5 - (x - 2) * 0.12 + cg(x, ry, s) * 0.4); a.put(x, ry + 1 > 11 ? 11 : ry + 1, FE, 1.8); } a.put(1, ry, FE, 6); a.put(9, ry, FE, 5.6); }
  if (k === 1) for (const x0 of [1, 9]) { a.put(x0, 1, FE, 4.8); a.put(x0 + 1, 0, FE, 4.4); a.put(x0 + 2, 0, FE, 3.4); a.put(x0 + 2, 1, FE, 2); }   // os ganchos
  if (k === 2) for (const x0 of [1, 9]) { a.put(x0 - 1, 11, FE, 3.4); a.put(x0, 11, FE, 4); a.put(x0 + 1, 11, FE, 3); a.put(x0 + 2, 11, FE, 2); }
  for (let j = 0; j < 3; j++) { const x = hash2(j, 1, s) < 0.5 ? 1 : 9, y = 3 + ((hash2(j, 2, s) * 6) | 0); a.put(x, y, DRT.ferrugem, 4); a.put(x, y + 1, DRT.ferrugem, 3); }
  return rimOut(a, FE[0], false);
}
const ESCADA = [escadaSprite(0, 41501), escadaSprite(1, 41502), escadaSprite(2, 41503)];
/* a corrente de lampadário: elos grossos de ferro alternando de frente e de lado, fuligem nos de baixo */
function correnteSprite(v, s) {
  const a = spr();
  for (let k = 0; k < 2; k++) {
    const y0 = k * 6 + (v ? 3 : 0), side = (k + v) & 1;
    if (side) { for (let y = y0; y < y0 + 6; y++) { const yy = y % 12; a.put(5, yy, FE, 4.6 - (y - y0) * 0.3 + cg(5, yy, s) * 0.4); a.put(6, yy, FE, 2.4); } }
    else for (let y = y0; y < y0 + 6; y++) { const yy = y % 12, t = (y - y0) / 5, hw = Math.sin(t * Math.PI) * 2.2 + 0.4; a.put(Math.round(5.5 - hw), yy, FE, 4.8); a.put(Math.round(5.5 + hw), yy, FE, 2.2); if (t < 0.15 || t > 0.85) { a.put(5, yy, FE, 4); a.put(6, yy, FE, 3); } }
  }
  return rimOut(a, FE[0], false);
}
const CORRENTE = [correnteSprite(0, 41511), correnteSprite(1, 41512)];
/* o braseiro: a bacia de ferro batido num tripé, a borda virada, a cinza dentro; o frio tem carvão morto, o aceso tem as
   brasas vivas (a chama é ao vivo) */
const BRAS_F = [6, 3];
function braseiroSprite(lit, v, s) {
  const a = spr();
  for (const [x0, x1] of [[3, 1], [8, 10]]) { for (let y = 7; y < 12; y++) { const x = Math.round(lerp(x0, x1, (y - 7) / 4)); a.put(x, y, FE, x0 < 6 ? 4 : 2.6); } a.put(x1, 11, FE, 3.4); }   // as pernas
  a.put(5, 8, FE, 3); a.put(6, 9, FE, 2.6); a.put(6, 10, FE, 2.4);                                                             // a perna do meio, atrás
  disc(a, 6, 5.4, 5, 2.2, FE, (dx, dy) => 4.2 - dy * 1.4 - dx * 0.8 + cg(dx * 9 | 0, dy * 9 | 0, s) * 0.4);                 // a bacia
  for (let x = 1; x <= 10; x++) a.put(x, 4, FE, x < 4 ? 5.6 : x > 8 ? 3.6 : 4.8);                                            // a borda virada
  for (let x = 2; x <= 9; x++) { const hi = hash2(x, v, s) < 0.5 ? 1 : 0; a.put(x, 3, lit ? DRT.carvao : DRT.cinza, lit ? 3 : 4.6 - hi); if (hi && x > 3 && x < 8) a.put(x, 2, lit ? DRT.carvao : DRT.cinza, 3.4); }
  if (lit) { for (let x = 3; x <= 8; x++) if (hash2(x, 7, s) < 0.6) a.put(x, 3, DRT.brasa, 4 + hash2(x, 8, s) * 2); }
  else { for (let x = 3; x <= 8; x += 2) a.put(x, 3, DRT.carvao, 2); }
  if (!lit && v) { a.put(2, 4, DRT.ferrugem, 3.6); a.put(9, 5, DRT.ferrugem, 3); }
  return rimOut(a, FE[0], true);
}
const BRAS_FRIO = [braseiroSprite(false, 0, 41521), braseiroSprite(false, 1, 41522)], BRAS_ACESO = [braseiroSprite(true, 0, 41523), braseiroSprite(true, 1, 41524)];
/* a cera derramada: tocos de círio derretidos uns sobre os outros, a cera escorrida em poça, os pavios pretos */
function ceraSprite(v, s) {
  const a = spr(), C = DRT.cera;
  for (let x = 0; x < 12; x++) { const h = Math.max(0, 1.6 - Math.abs(x - 6) * 0.25 + (hash2(x, v, s) - 0.5)); for (let y = 11; y > 11 - h; y--) a.put(x, y, C, 3.6 - (11 - y) * 0.2 + cg(x, y, s) * 0.3); }
  const stubs = v ? [[3, 5, 1.6], [7, 7, 1.4], [9, 9, 1]] : [[4, 6, 1.8], [8, 8, 1.4]];
  for (const [cx, top, hw] of stubs) {
    for (let y = top; y < 11; y++) for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { const d = (x + 0.5 - cx) / hw; a.put(x, y, C, 4.4 - d * 1.2 + (y === top ? 1 : 0) + cg(x, y, s) * 0.3); }
    a.put(cx, top - 1, DRT.pavio, 1.4);
    a.put(Math.round(cx + hw), top + 2, C, 5); a.put(Math.round(cx + hw), top + 3, C, 4.4);                                       // a gota escorrida
  }
  return rimOut(a, C[0], true);
}
const CERA = [ceraSprite(0, 41531), ceraSprite(1, 41532), flipX(ceraSprite(1, 41533))];
/* o monte de cinza: cinza fina amontoada, um caco de carvão e um ossinho saindo */
function cinzeiroSprite(v, s) {
  const a = spr(), C = DRT.cinza;
  for (let x = 0; x < 12; x++) { const u = (x + 0.5 - 6) / 6, h = Math.round((v ? 5 : 4) * Math.sqrt(Math.max(0, 1 - u * u)) + (hash2(x, v, s) - 0.5)); for (let y = 11; y > 11 - h; y--) a.put(x, y, C, 3.2 - u * 0.8 + (y === 12 - h ? 1.2 : 0) - (11 - y) * 0.05 + cg(x, y, s) * 0.6); }
  a.put(v ? 3 : 8, 9, DRT.carvao, 2.4); a.put(v ? 4 : 9, 9, DRT.carvao, 1.4);
  if (v) { a.put(7, 8, DRT.osso, 5); a.put(8, 7, DRT.osso, 4.6); a.put(9, 7, DRT.osso, 5.2); }
  return rimOut(a, C[0], true);
}
const CINZEIRO = [cinzeiroSprite(0, 41541), cinzeiroSprite(1, 41542)];
/* os pavios pendurados: cordões trançados pendendo do teto, as pontas pretas de queimadas */
function pavioSprite(v, s) {
  const a = spr(), P = DRT.pavio;
  const cords = v ? [[2, 9], [5, 6], [8, 11], [10, 7]] : [[3, 8], [6, 11], [9, 6]];
  for (const [x0, len] of cords) for (let y = 0; y < len; y++) { const x = x0 + Math.round(Math.sin(y * 0.6 + x0) * 0.5); a.put(x, y, P, y > len - 3 ? 0.6 : 3.6 + ((y + x0) % 2 ? 0.8 : -0.4)); }
  for (let x = 1; x < 11; x++) a.put(x, 0, P, 2.2);
  return rimOut(a, P[0], false);
}
const PAVIO = [pavioSprite(0, 41551), pavioSprite(1, 41552)];
/* o véu de fuligem: a fuligem acumulada no teto, preta e aveludada, com fiapos pendurados */
function fuligemSprite(v, s) {
  const a = spr(), F = DRT.fuligem;
  for (let x = 0; x < 12; x++) { const n = 2 + ((hash2(x, v, s) * 3) | 0) + (x % 5 === v ? 3 : 0); for (let y = 0; y < n; y++) a.put(x, y, F, 4.6 - y * 0.7 + cg(x, y, s) * 1.2); }
  return rimOut(a, F[0], false);
}
const FULIGEM = [fuligemSprite(0, 41561), fuligemSprite(1, 41562), fuligemSprite(2, 41563)];
/* a fenda de brasa: uma lasca de rocha no chão rachada ao meio, a brasa aparecendo (pulsa ao vivo) */
const FENDA_C = [[6, 8], [5, 9]];
function fendaSprite(v, s) {
  const a = spr(), R = DRT.pedra, [cx, cy] = FENDA_C[v];
  for (let x = 0; x < 12; x++) { const u = (x + 0.5 - 6) / 6, h = Math.round(4 * Math.sqrt(Math.max(0, 1 - u * u * 0.9)) + (hash2(x, v, s) - 0.5)); for (let y = 11; y > 11 - h; y--) a.put(x, y, R, 3.4 - u * 0.9 + (y === 12 - h ? 1.2 : 0) + cg(x, y, s) * 0.5); }
  for (let y = cy - 1; y < 12; y++) { const x = cx + Math.round(Math.sin(y * 1.3 + v) * 0.7); a.put(x, y, DRT.brasa, y === cy + 1 ? 6 : 4.6); a.put(x + 1, y, DRT.brasa, 2.6); }
  return rimOut(a, R[0], true);
}
const FENDA = [fendaSprite(0, 41571), fendaSprite(1, 41572)];
/* a lanterna apagada: a gaiola de ferro com as placas de chifre amareladas, o pavio morto, a argola em cima */
function lanternaSprite(v, s) {
  const a = spr();
  for (let y = 0; y < 3; y++) a.put(6, y, FE, 4);                                                    // a argola e a haste
  for (let x = 3; x <= 8; x++) { a.put(x, 3, FE, 5 - (x - 3) * 0.3); a.put(x, 10, FE, 3.4); }        // o chapéu e o fundo
  a.put(4, 2, FE, 4.6); a.put(7, 2, FE, 3.4); a.put(5, 11, FE, 2.6); a.put(6, 11, FE, 2.2);
  for (let y = 4; y < 10; y++) { a.put(3, y, FE, 4.6); a.put(8, y, FE, 2.4); for (let x = 4; x <= 7; x++) a.put(x, y, DRT.cera, (v && y < 6 ? 1.4 : 2.6) - (x - 4) * 0.3 + (x === 4 ? 0.8 : 0)); }
  a.put(5, 7, DRT.pavio, 0.8); a.put(6, 8, DRT.pavio, 1.4);
  return rimOut(a, FE[0], false);
}
const LANTERNA = [lanternaSprite(0, 41581), lanternaSprite(1, 41582)];
/* a coluna de templo: pedra lavrada canelada, a base com o toro, o capitel com folhas de chama */
function colunaSprite(k, s) {   // 0 pé, 1 meio, 2 capitel
  const a = spr(), P = DRT.pedra;
  for (let y = 0; y < 12; y++) {
    const hw = k === 0 && y > 8 ? 5 : k === 0 && y > 6 ? 4.2 : k === 2 && y < 3 ? 5.2 : k === 2 && y < 5 ? 4.4 : 3.4;
    for (let x = Math.floor(5.5 - hw); x <= Math.ceil(5.5 + hw); x++) {
      const d = (x + 0.5 - 6) / hw; if (Math.abs(d) > 1) continue;
      let l = 4.4 - d * 1.6 + cg(x, y, s) * 0.25;
      if (hw === 3.4 && (x % 2 === 0)) l -= 0.9;                                                      // as caneluras
      if ((k === 0 && y === 9) || (k === 2 && y === 2)) l += 0.8;
      a.put(x, y, P, l);
    }
  }
  if (k === 2) for (const x of [1, 4, 7, 10]) { a.put(x, 3, DRT.pedra, 5.4); a.put(x, 4, DRT.pedra, 3.6); }   // as folhas de chama do capitel
  const so = k === 2 ? [0, 1] : []; for (const y of so) for (let x = 1; x < 11; x++) if (hash2(x, y, s) < 0.5) a.put(x, y, DRT.fuligem, 4);
  return rimOut(a, P[0], false);
}
const COLUNA = [colunaSprite(0, 41591), colunaSprite(1, 41592), colunaSprite(2, 41593)];
/* a ossada de Acendedor: sentado encostado, o capuz de pano podre, a tocha morta ainda na mão */
function ossadaSprite(v, s) {
  const a = spr(), O = DRT.osso;
  disc(a, 4, 5, 2.2, 2.2, O, (dx, dy) => 4.8 - dy - dx * 0.8);                                         // o crânio
  a.put(4, 5, O, 0.6); a.put(5, 5, O, 0.8); a.put(4, 7, O, 1.6);
  for (let y = 2; y < 9; y++) for (let x = 1; x <= 7; x++) if ((x < 2 || y < 3 || x > 6) && hash2(x, y, s) < 0.7 && !(x > 2 && x < 6 && y > 3 && y < 8)) a.put(x, y, DRT.pano, 3 + cg(x, y, s));   // o capuz
  for (let y = 8; y < 12; y++) { a.put(3, y, O, 4.4); a.put(4, y, DRT.pano, 2.4); a.put(5, y, DRT.pano, 3); }   // as costelas e o manto
  for (let x = 5; x < 11; x++) { a.put(x, 11, O, 4 - (x - 5) * 0.1); a.put(x, 10, DRT.pano, 2.2); }               // as pernas esticadas
  const tx = v ? 9 : 8; for (let y = 4; y < 10; y++) a.put(tx - (y - 4) * 0.2, y, DRT.pavio, 3.4);                  // a tocha morta
  a.put(tx, 3, DRT.carvao, 3); a.put(tx + 1, 3, DRT.carvao, 2); a.put(tx, 2, DRT.carvao, 1.6);
  a.put(7, 8, O, 5); a.put(7, 7, O, 4.4);                                                                          // a mão na tocha
  return rimOut(a, O[0], true);
}
const OSSADA = [ossadaSprite(0, 41601), flipX(ossadaSprite(1, 41602))];
/* o pingente de cera: a cera que escorreu de um lampadário e endureceu pendurada */
function pingenteSprite(v, s) {
  const a = spr(), C = DRT.cera;
  for (const [cx, len] of v ? [[3, 7], [7, 10], [9, 5]] : [[4, 9], [8, 6]]) for (let y = 0; y < len; y++) { const hw = 1.6 * (1 - y / len) + 0.4; for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) a.put(x, y, C, 4.2 - (x - cx) / hw * 1.2 + cg(x, y, s) * 0.3); }
  for (let x = 1; x < 11; x++) a.put(x, 0, C, 3);
  return rimOut(a, C[0], false);
}
const PINGENTE = [pingenteSprite(0, 41611), pingenteSprite(1, 41612)];

DECO[AC_ESCADA] = ESCADA; DECO[AC_CORRENTE] = CORRENTE; DECO[AC_BRASEIRO_FRIO] = BRAS_FRIO; DECO[AC_BRASEIRO] = BRAS_ACESO; DECO[AC_CERA] = CERA; DECO[AC_CINZEIRO] = CINZEIRO;
DECO[AC_PAVIO] = PAVIO; DECO[AC_FULIGEM] = FULIGEM; DECO[AC_FENDA] = FENDA; DECO[AC_LANTERNA] = LANTERNA; DECO[AC_COLUNA] = COLUNA; DECO[AC_OSSADA] = OSSADA; DECO[AC_PINGENTE] = PINGENTE;
const AC_DECO = [
  // id, dureza, cor no mapa, o que solta
  [AC_ESCADA, 0.3, '#545050', null], [AC_CORRENTE, 0.25, '#3e3a3a', null], [AC_BRASEIRO_FRIO, 0.3, '#545050', null], [AC_BRASEIRO, 0.3, '#f08a2a', null],
  [AC_CERA, 0.05, '#c8b896', 'cera_acendedor'], [AC_CINZEIRO, 0.03, '#8a847e', null], [AC_PAVIO, 0.03, '#40362a', null], [AC_FULIGEM, 0.02, '#12100f', null],
  [AC_FENDA, 0.4, '#d0601a', null], [AC_LANTERNA, 0.2, '#545050', null], [AC_COLUNA, 1.7, '#84745a', 'pedra_lavrada'], [AC_OSSADA, 0.1, '#bcb296', null], [AC_PINGENTE, 0.05, '#c8b896', null]
];
for (const [t, dig, col, drop] of AC_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[AC_BRASEIRO] = 0.95; EMIT[AC_FENDA] = 0.6;
EMIT[AC_BRASEIRO_FRIO] = 0.01;   // quase nada: entra na lista do 07 (o 413 acende os que um turiferário encontra)
// o que cai quando o apoio some; escada, corrente e coluna ficam (atravessam vãos)
for (const t of [AC_PAVIO, AC_FULIGEM, AC_LANTERNA, AC_PINGENTE]) CV_HANGS[t] = 1;
for (const t of [AC_BRASEIRO_FRIO, AC_BRASEIRO, AC_CERA, AC_CINZEIRO, AC_FENDA, AC_OSSADA]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[AC_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== AC_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== AC_ESCADA ? arr[2] : arr[0];
DECO_PICK[AC_CORRENTE] = (gx, gy, arr) => arr[gy & 1];
DECO_PICK[AC_BRASEIRO_FRIO] = (gx, gy, arr) => arr[vr(gx, gy, 41521, 2)];
DECO_PICK[AC_BRASEIRO] = (gx, gy, arr) => arr[vr(gx, gy, 41523, 2)];
DECO_PICK[AC_CERA] = (gx, gy, arr) => arr[vr(gx, gy, 41531, 3)];
DECO_PICK[AC_CINZEIRO] = (gx, gy, arr) => arr[vr(gx, gy, 41541, 2)];
DECO_PICK[AC_PAVIO] = (gx, gy, arr) => arr[vr(gx, gy, 41551, 2)];
DECO_PICK[AC_FULIGEM] = (gx, gy, arr) => arr[vr(gx, gy, 41561, 3)];
const fendaV = (gx, gy) => vr(gx, gy, 41571, 2);
DECO_PICK[AC_FENDA] = (gx, gy, arr) => arr[fendaV(gx, gy)];
DECO_PICK[AC_LANTERNA] = (gx, gy, arr) => arr[vr(gx, gy, 41581, 2)];
DECO_PICK[AC_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== AC_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== AC_COLUNA ? arr[2] : arr[1];
DECO_PICK[AC_OSSADA] = (gx, gy, arr) => arr[vr(gx, gy, 41601, 2)];
DECO_PICK[AC_PINGENTE] = (gx, gy, arr) => arr[vr(gx, gy, 41611, 2)];

// a escada de ferro e a corrente se escalam como a corrente da catedral; a escada conta como a escada da mina (a pose de
// subir de frente, 88), a corrente como corda
{ const _ac = touchingTile; touchingTile = function (e, t) { return _ac(e, t) || (t === CHAIN && (_ac(e, AC_ESCADA) || _ac(e, AC_CORRENTE))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _ac(e, AC_ESCADA)); }; }

/* ================= ao vivo: a chama dos braseiros, o pulso da brasa, o cintilar da ardorita ================= */
const AC_GL = {};
const acGlow = (k, r, col) => AC_GL[k] || (AC_GL[k] = glow(r, col));
const acOut = cy => cy + VH < (AC_S0 - 6) * T || cy > (AC_S0 + AC_D + 6) * T;
const CHAMA = ['#fff6d8', '#ffd27a', '#f08a2a', '#b03a10'];
HOOK.drawGlow.push((cx, cy) => {
  if (acOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < AC_ROCHA || t > AC_PINGENTE) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case AC_BRASEIRO: {
        const f = 0.9 + Math.sin(tm * 8 + gx) * 0.06 + Math.sin(tm * 19 + gy) * 0.04;
        lc.globalAlpha = 0.32 * f; lc.drawImage(acGlow('bb', 34, AC_COL.brasa), x + BRAS_F[0] - 34, y + BRAS_F[1] - 36);
        lc.globalAlpha = 0.5 * f; lc.drawImage(acGlow('bs', 9, AC_COL.miolo), x + BRAS_F[0] - 9, y + BRAS_F[1] - 11);
        break;
      }
      case AC_FENDA: { const [fx, fy] = FENDA_C[fendaV(gx, gy)]; lc.globalAlpha = 0.18 + Math.max(0, Math.sin(tm * 1.1 + gx * 0.9)) * 0.14; lc.drawImage(acGlow('f12', 12, AC_COL.brasa), x + fx - 12, y + fy - 12); break; }
      case AC_BRASA: if ((gx * 3 + gy) % 3) break; lc.globalAlpha = 0.06 + Math.max(0, Math.sin(tm * 0.8 + gx * 0.7 + gy * 1.3)) * 0.07; lc.drawImage(acGlow('v14', 14, AC_COL.brasa), x + 6 - 14, y + 6 - 14); break;
      case AC_O_ARDORITA: if ((gx + gy) & 1) break; lc.globalAlpha = 0.07 + Math.max(0, Math.sin(tm * 1.4 + gx * 1.3 + gy)) * 0.06; lc.drawImage(acGlow('a12', 12, AC_COL.brasaC), x + 6 - 12, y + 6 - 12); break;
      case AC_BARREIRA: lc.globalAlpha = 0.12 + Math.sin(tm * 3 + gy) * 0.04; lc.drawImage(acGlow('g14', 14, AC_COL.brasa), x + 6 - 14, y + 6 - 14); break;
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (acOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < AC_ROCHA || t > AC_PINGENTE) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case AC_BRASEIRO: {   // a chama: três línguas que sobem e trocam de altura, uma fagulha de vez em quando
        const fx = x + BRAS_F[0], fy = y + BRAS_F[1];
        for (let c = -2; c <= 2; c++) {
          const h = Math.round((3 - Math.abs(c)) * 1.3 + (Math.sin(tm * 9 + c * 1.7 + gx) + 1) * 1.4);
          for (let j = 0; j < h; j++) { const q = j / Math.max(1, h); lc.fillStyle = q < 0.3 && Math.abs(c) < 2 ? CHAMA[0] : q < 0.6 ? CHAMA[1] : q < 0.85 ? CHAMA[2] : CHAMA[3]; lc.fillRect(fx + c, fy - j, 1, 1); }
        }
        const sp = (tm * 0.9 + hash2(wrapX(gx), gy, 41701)) % 1; if (sp < 0.5) { lc.globalAlpha = 1 - sp * 2; lc.fillStyle = CHAMA[1]; lc.fillRect(fx + Math.round(Math.sin(sp * 9 + gx) * 2), fy - 6 - Math.round(sp * 16), 1, 1); lc.globalAlpha = 1; }
        break;
      }
      case AC_FENDA: {   // uma fagulha sobe da rachadura de vez em quando
        const ph0 = (tm * 0.4 + hash2(wrapX(gx), gy, 41702) * 5) % 1; if (ph0 > 0.3) break;
        const [fx, fy] = FENDA_C[fendaV(gx, gy)]; lc.globalAlpha = 1 - ph0 / 0.3; lc.fillStyle = CHAMA[1]; lc.fillRect(x + fx + Math.round(Math.sin(ph0 * 20) * 1.5), y + fy - 2 - Math.round(ph0 * 30), 1, 1); lc.globalAlpha = 1;
        break;
      }
      case AC_O_ARDORITA: {   // o miolo quente pulsa
        const ph0 = (tm * 0.35 + hash2(wrapX(gx), gy, 41703) * 7) % 1; if (ph0 > 0.08) break;
        const tp = ardTip(gx, gy); if (!tp) break; lc.fillStyle = '#fff0c0'; lc.fillRect(x + tp[0] - 1, y + tp[1], 3, 1); lc.fillRect(x + tp[0], y + tp[1] - 1, 1, 3);
        break;
      }
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(ACART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, wrapT, W2, RX, EMBER, SOOT, SUN, GLASS, RUST, DRT, acGlow, AC_GL, acOut, CHAMA, BRAS_F,
  vRocha, vLavrada, vLaje, vCinza, vBrasa, vTijolo, vBronze, vEscoria, vGrade, vGrelha, BKV, ESCADA, CORRENTE });
}
