'use strict';

/* ================= o Covil do Dragão: blocos, paredes, terceira camada, minérios, decoração, o magma =================
   Rocha vulcânica de verdade, nada do inferno: nas Chaminés, o tufo bege-ocre poroso, úmido de vapor, com grãos de
   olivina; nos Túneis, o andesito cinza quente em lajes, a pedra-pomes quase branca cheia de furos e a taipa dos
   kobolds (terra prensada em camadas, com escamas cor de cobre); nos Tubos, a lava cordada cinza-chumbo enrugada em
   dobras (o fundo das dobras ainda em brasa) e a obsidiana rajada, vidro cor de mogno com manchas pretas e arestas de
   fratura acesas; no Leito, o osso de dragão marfim rachado de calor, o ouro solto (moedas, anéis e taças amontoados)
   e o ouro endurecido, liso como cera escorrida. O andaime de ossos amarrados com tiras de couro faz pontes e pisos.
   Como o 251, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda acesa,
   sombra e oclusão vêm do 07; paredes e terceira camada só leem o tom. O que brilha e se mexe é desenhado ao vivo, só
   sobre o que está na tela: o magma correndo para um lado por cima da lava do jogo (só dentro do Covil), as brasas nas
   dobras da lava cordada, o ouro que cintila, o derretido que ferve, a cortina de magma das portas da cratera, a
   chama da vela de sebo, o vapor das bicas, a fumaça das fumarolas, a olivina e o fio de cobre que pegam a luz.
   Ids: 270. */
const DGART = {};   // ferramentas para 272 (objetos), 273/274 (os bichos), 277 (Cinzarel) e 278 (dracônio)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro (ficha, seção 12) ---- */
pal('dgTufo', ['#3a2a1a', '#5a4228', '#7a5c3a', '#9a774c', '#b8935e', '#d4b07a']);
pal('dgAndesito', ['#2a2422', '#3e3632', '#544a44', '#6e625a', '#8a7c72', '#a89a8e']);
pal('dgPomes', ['#5a5450', '#7e7872', '#a29c94', '#c4beb4', '#ddd8ce', '#f2eee6']);
pal('dgLavaCorda', ['#1c1a1a', '#2c2826', '#3c3634', '#4e4844', '#645c56', '#7e766e']);
pal('dgObsidiana', ['#1a0c08', '#2e140c', '#4a2014', '#6a301e', '#8a4630', '#c87a52']);
pal('dgTaipa', ['#2a221c', '#40342a', '#58483a', '#725e4c', '#8e7860', '#aa9478']);
pal('dgAndaime', ['#2a2216', '#4a3c28', '#6e5c40', '#968260', '#bcac88', '#ddd0ae']);
pal('dgOsso', ['#3a3020', '#5a4c34', '#7a6a4c', '#9a8a68', '#bcac88', '#ddd0ae']);
pal('dgOuro', ['#4a3008', '#7a5410', '#a87808', '#d8a830', '#f0cc5a', '#fff0a0']);
pal('dgOuroDuro', ['#3e2806', '#6a4a0e', '#946c10', '#c4962a', '#e8c25a', '#fff0b0']);
pal('dgMagma', ['#6a1a04', '#a83a08', '#e06a10', '#ffa020', '#ffd050', '#fff4c0']);
pal('dgCrosta', ['#140a06', '#24120a', '#361c10', '#4a2a1a', '#5e3a26', '#784e36']);
// paredes de fundo: sempre bem mais escuras que o chão da frente, sem cor de destaque (o ouro nunca vai na parede)
pal('dgTufoW', ['#0a0705', '#110c08', '#18110c', '#1f1610', '#271c14', '#30231a']);
pal('dgAndesitoW', ['#070606', '#0c0a0a', '#110e0e', '#171313', '#1d1918', '#24201e']);
pal('dgTaipaW', ['#080605', '#0d0a08', '#130f0c', '#191410', '#201a15', '#28201a']);
pal('dgLavaW', ['#050404', '#090707', '#0d0b0a', '#12100e', '#181513', '#1f1b18']);
pal('dgObsidianaW', ['#070302', '#0c0504', '#120806', '#180b08', '#1f0f0b', '#28150f']);
// a terceira camada: as paredes do vulcão (o tom 5 é o brilho laranja que sobe de baixo), as tocas ao longe (as velas
// no tom 5), as ossadas ao longe (o marfim apagado no tom 4 e 5)
pal('dpDgChamine', ['#040202', '#080404', '#0e0806', '#160c08', '#24120a', '#7a3010']);
pal('dpDgTocas', ['#030202', '#070505', '#0c0908', '#120e0c', '#1a1410', '#8a5a20']);
pal('dpDgOssada', ['#030202', '#060504', '#0b0907', '#110e0b', '#1e1912', '#3a3226']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // senos em x ou y só com múltiplos inteiros disto, para a textura não ter emenda
const RX = hexes => hexes.map(h => ph(h));
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
const BRASA = RX(['#5a1404', '#a03008', '#e06010', '#ffa020', '#ffd060', '#fff4c0']);   // a brasa nas frestas
const OLIV = RX(['#1e2a0c', '#3a5216', '#5a7a22', '#86a836', '#b4d05a', '#e4f4a0']);     // olivina
const COBRE = RX(['#2a1410', '#4a2418', '#6e3820', '#9a5428', '#c47a3a', '#e8a85a']);    // escamas
const OURO = RX(['#4a3008', '#7a5410', '#a87808', '#d8a830', '#f0cc5a', '#fff0a0', '#ffffff']);
const SAL = RX(['#6a6258', '#9a9286', '#c8c0b2', '#ece6da']);

/* ---- o chão sólido ---- */
function vTufo(x, y) {   // tufo vulcânico: cinza de vulcão prensada, bege-ocre, poros redondos, lascas de pedra, grão de olivina, manchas úmidas
  let v = 2.6 + cn(x, y, 24, 24, 27101) * 1.5 + cn(x, y, 80, 80, 27102) * 0.7 + cg(x, y, 27103) * 0.7;
  v += Math.sin((y + cn(x, y, 6, 4, 27104) * 30) * W2 * 16) * 0.25;                                   // camadas de cinza deitadas
  const wet = cn(x, y, 10, 14, 27105); if (wet > 0.18) v -= (wet - 0.18) * 4.5;                       // o vapor deixou manchas úmidas
  const p = cells(x, y, 7, 27106);
  if (p.id < 0.32 && p.d1 < 1.1 + p.id * 2) { if (p.oy < -0.3) return 0.6; return p.ox + p.oy > 0.4 ? 2.6 : 0.9; }   // os poros
  const l = cells(x, y, 15, 27107, 1.4);
  if (l.id < 0.08 && l.d1 < 2.6) { MATX = PALS.dgAndesito[l.ox + l.oy < -0.5 ? 4 : l.ox + l.oy > 0.8 ? 1 : 3]; return -9; }   // lasca de andesito
  if (hash2(x, y, 27108) < 0.0022) { MATX = OLIV[hash2(x, y, 27109) < 0.5 ? 4 : 3]; return -9; }   // grão de olivina
  if (hash2(x, y, 27110) < 0.03) v -= 1.0; else if (hash2(x, y, 27111) < 0.015) v += 1;
  return v;
}
function vAndesito(x, y) {   // andesito: lajes de 30 px partidas na horizontal, chanfro aceso em cima, fenocristais claros
  let v = 2.6 + cn(x, y, 30, 30, 27121) * 1.0 + cn(x, y, 90, 90, 27122) * 0.4 + cg(x, y, 27123) * 0.5;
  const c = cells(x, y, 30, 27124, 1.8), e = c.d2 - c.d1;
  if (e < 1.1) return 0.5 + cg(x, y, 27125) * 0.3;                                                     // a junta
  if (e < 2.4) v += c.oy < 0 ? 0.9 : -0.6;
  v += (c.id - 0.5) * 0.8 - c.oy * 0.03;
  const fx = cells(x, y, 6, 27126, 1.6);
  if (fx.id < 0.12 && fx.d1 < 1.2) v = fx.oy < 0 ? 4.6 : 3.8;                                           // fenocristal de feldspato
  if (Math.abs(cn(x, y, 6, 40, 27127)) < 0.012 && cn(x, y, 30, 4, 27128) > 0) v -= 1.2;               // fissura deitada
  return v;
}
function vPomes(x, y) {   // pedra-pomes: quase branca, espuma de pedra, cheia de furos fundos de todos os tamanhos
  let v = 3.2 + cn(x, y, 20, 20, 27131) * 1.0 + cg(x, y, 27132) * 0.6;
  for (const [cs, s, k] of [[5, 27133, 0.4], [11, 27134, 0.28], [23, 27135, 0.14]]) {
    const c = cells(x, y, cs, s, 1.3);
    if (c.id < k * 1.8 && c.d1 < cs * 0.32) return c.oy < -cs * 0.12 ? 0.5 : c.ox + c.oy > cs * 0.1 ? 2.9 : 1.2;
    if (c.id < k * 1.8 && c.d1 < cs * 0.42) v += c.ox + c.oy > 0 ? 0.9 : -0.8;
  }
  return v;
}
function vLavaCorda(x, y) {   // lava cordada (pahoehoe): dobras como corda torcida, em arcos; o fundo das dobras ainda em brasa
  const u = y + cn(x, y, 6, 6, 27141) * 60 + Math.abs(cn(x, y, 12, 4, 27142)) * 40;
  const f = Math.sin(u * W2 * 40), g = Math.sin(u * W2 * 40 + 1.2);
  let v = 2.4 + f * 0.9 + cn(x, y, 40, 40, 27143) * 0.6 + cg(x, y, 27144) * 0.4;
  if (f > 0.75) v += (g > 0 ? 0.9 : 0.3);                                                              // a crista da dobra
  if (f < -0.9) { const hot = cn(x, y, 8, 8, 27145); if (hot > 0.22) { MATX = BRASA[hot > 0.32 ? 3 : hot > 0.27 ? 2 : 1]; return -9; } return 0.4; }   // o vale: escuro, às vezes em brasa
  if (hash2(x, y, 27146) < 0.004) v += 1.5;                                                            // vidro de lava pegando luz
  return v;
}
function vObsidiana(x, y) {   // obsidiana rajada: vidro mogno com rajadas pretas, fraturas conchoidais com a aresta acesa
  const band = cn(wrapT(x + cn(x, y, 6, 6, 27151) * 70), y, 10, 3, 27152);
  let v = 2.7 + band * 2.2 + cg(x, y, 27153) * 0.18;
  if (band < -0.12) v = 0.7 + (band + 0.5) * 1.5;                                                       // as rajadas pretas
  const c = cells(x, y, 26, 27154, 0.9), e = c.d2 - c.d1;
  if (e < 0.8) { MATX = PALS.dgObsidiana[c.ox + c.oy < 0 ? 5 : 0]; return -9; }                       // a aresta de fratura
  if (c.id < 0.5 && c.d1 % 5 < 0.7) v += c.ox + c.oy < 0 ? 0.9 : -0.6;                                 // as conchas em anéis
  if (Math.abs(c.ox + c.oy - (c.id - 0.5) * 8) < 0.5 && c.d1 < 10) v += 1.5;                          // o reflexo comprido do vidro
  return v;
}
function vTaipa(x, y) {   // taipa kobold: terra socada em camadas de 6 px, marcas de unha, escamas de cobre misturadas
  const Y = wrapT(y), row = Math.floor((Y + Math.floor(cn(x, y, 8, 1, 27161) * 6)) / 6), r = (Y + 600) % 6;
  let v = 2.5 + (hash2(row, 0, 27162) - 0.5) * 1.2 + cn(x, y, 40, 10, 27163) * 0.8 + cg(x, y, 27164) * 0.6;
  if (r === 0) v -= 1; else if (r === 1) v += 0.6;
  const cl = cells(x, y, 14, 27165, 0.6);
  if (cl.id < 0.18 && Math.abs(cl.oy) < 4 && (Math.abs(cl.ox - cl.oy * 0.4) < 0.5 || Math.abs(cl.ox - 2.2 - cl.oy * 0.4) < 0.5)) v -= 1.3;   // riscos de unha
  const s = cells(x, y, 9, 27166);
  if (s.id < 0.07 && s.d1 < 1.6) { MATX = COBRE[s.oy < -0.4 ? 5 : s.oy > 0.5 ? 2 : 4]; return -9; }  // escama de draco na massa
  return v;
}
function vAndaime(x, y) {   // andaime de ossos: ossos compridos deitados em 2 fiadas, amarrados com tiras de couro escuro
  const X = wrapT(x), Y = wrapT(y), fy = Y % 12, row = Math.floor(Y / 12), off = (row * 7) % 12, bx = (X + off) % 24;
  if (fy < 1 || fy === 6) return 0.4;                                                                  // vão entre ossos
  const ly = fy < 6 ? fy - 1 : fy - 7, cy = 2;
  let v = 3.2 - Math.abs(ly - cy) * 0.6 + (ly < cy ? 0.6 : 0) + cg(x, y, 27171) * 0.4;
  if (bx < 3 || bx > 21) v += 0.8;                                                                       // as cabeças do osso, mais grossas
  if (bx >= 10 && bx <= 12) { MATX = PALS.dgTaipa[ly < cy ? 3 : 1]; return -9; }                       // a tira de couro
  if (hash2(x, y, 27172) < 0.04) v -= 0.8;
  return v;
}
function vOsso(x, y) {   // osso de dragão: marfim escurecido, fibras compridas, poros, rachaduras de calor em rede
  const u = wrapT(x + cn(x, y, 4, 8, 27181) * 40);
  let v = 3.0 + Math.sin(u * W2 * 50) * 0.3 + cn(x, y, 30, 30, 27182) * 1.0 + cg(x, y, 27183) * 0.35;
  const c = cells(x, y, 18, 27184, 1);
  if (c.d2 - c.d1 < 0.7) return 0.6;                                                                   // a rede de rachaduras
  if (c.d2 - c.d1 < 1.6) v += c.ox + c.oy < 0 ? 0.6 : -0.7;
  const p = cells(x, y, 5, 27185);
  if (p.id < 0.1 && p.d1 < 0.9) v -= 1.6;
  const burn = cn(x, y, 6, 6, 27186); if (burn > 0.2) v -= (burn - 0.2) * 5;                           // queimado
  return v;
}
function vOuroSolto(x, y) {   // ouro solto: moedas, anéis, o vão escuro entre elas; cada moeda com a borda acesa em cima
  const c = cells(x, y, 6, 27191, 1.35), R = 2.6 + c.id * 0.6;
  if (c.d1 < R) {
    const q = c.ox + c.oy;
    if (c.d1 > R - 0.8) { MATX = OURO[q < 0 ? 5 : 1]; return -9; }                                    // a borda
    if (c.id < 0.1 && c.d1 < 1) { MATX = OURO[0]; return -9; }                                         // anel: o furo
    if (Math.abs(c.ox - c.oy) < 0.5 && c.d1 < 1.4) { MATX = OURO[6]; return -9; }                      // o brilho
    MATX = OURO[Math.max(1, Math.min(5, Math.round(3.2 - q * 0.35 + (c.id - 0.5) * 1.5)))]; return -9;
  }
  if (c.d2 - c.d1 < 0.6) { MATX = OURO[0]; return -9; }
  return 1.6 + cg(x, y, 27192) * 0.4 + cn(x, y, 20, 20, 27193);                                        // os vãos entre moedas
}
function vOuroDuro(x, y) {   // ouro endurecido: derreteu e esfriou como cera, escorrido em gotas, liso, poucas moedas meio afundadas
  const u = y + cn(x, y, 8, 3, 27201) * 50, d = Math.sin(u * W2 * 12);
  let v = 3.0 + d * 0.5 + cn(x, y, 30, 30, 27202) * 1.2 + cg(x, y, 27203) * 0.12;
  if (d > 0.9) v += 1.2; else if (d < -0.92) v -= 1.0;                                                 // as gotas escorridas
  const c = cells(x, y, 20, 27204, 1.4);
  if (c.id < 0.18 && c.d1 < 2.2) v = c.d1 > 1.4 ? (c.oy < 0 ? 4.8 : 1.6) : 3.6;                         // moeda meio afundada
  if (hash2(x, y, 27205) < 0.002) v = 5;
  return v;
}
function vQuente(x, y) {   // ouro derretido: fervendo, quase branco no meio, bolhas
  let v = 3.6 + cn(x, y, 12, 12, 27211) * 1.6 + cg(x, y, 27212) * 0.4;
  const c = cells(x, y, 10, 27213); if (c.id < 0.3 && c.d1 < 1.6) v += c.oy < 0 ? 1.3 : -0.9;
  return v;
}
function vCrosta(x, y) {   // crosta de magma: casca preta em placas, as rachaduras entre elas acesas por baixo
  const c = cells(x, y, 16, 27221, 1.1), e = c.d2 - c.d1;
  if (e < 1.0) { MATX = BRASA[e < 0.5 ? 4 : 3]; return -9; }
  if (e < 1.8) { MATX = BRASA[1]; return -9; }
  return 2.2 + (c.id - 0.5) * 1.2 - (c.ox + c.oy) * 0.07 + cg(x, y, 27222) * 0.5;
}
function vMagma(x, y) {   // a cortina de magma (ícone e mapa): faixas verticais de fogo
  return 2.8 + Math.sin(x * W2 * 20 + cn(x, y, 4, 8, 27231) * 5) * 1.2 + cg(x, y, 27232) * 0.4;
}

/* ---- paredes de fundo (só o tom) ---- */
const vTufoW = (x, y) => { const v = vTufo(x, y); return v === -9 ? 2.6 : v - 0.2; };
const vAndesitoW = (x, y) => vAndesito(x, y) - 0.1;
const vTaipaW = (x, y) => { const v = vTaipa(x, y); return v === -9 ? 2.8 : v; };
const vLavaW = (x, y) => { const v = vLavaCorda(x, y); return v === -9 ? 1.2 : v; };
const vObsidianaW = (x, y) => { const v = vObsidiana(x, y); return v === -9 ? (MATX === PALS.dgObsidiana[5] ? 3.6 : 0.4) : v; };

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpChamine(x, y) {   // as paredes do vulcão subindo ao longe: costelas de rocha em pé, entre elas o brilho laranja vindo de baixo
  const u = wrapT(x + cn(x, y, 3, 6, 27301) * 40), r = Math.sin(u * W2 * 6);
  let v = 1.6 + r * 0.9 + cn(x, y, 20, 20, 27302) * 0.8 + cg(x, y, 27303) * 0.3;
  if (r < -0.75) { v = 2.6 + wrapT(y) / TP * 2.2 + cn(x, y, 6, 20, 27304) * 1.2; if (v > 4.6) v = 5; }   // a fenda acesa (mais clara embaixo)
  return v;
}
function vDpTocas(x, y) {   // um paredão de tocas kobold ao longe: bocas redondas em fileiras, algumas com vela acesa
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 30), cx = (row * 17) % 40, bx = (X + cx) % 40, by = Y % 30;
  let v = 2.4 + cn(x, y, 16, 16, 27311) * 0.9 + cg(x, y, 27312) * 0.3;
  const dx = bx - 20, dy = by - 16, d = Math.hypot(dx, dy * 1.3);
  if (d < 7) { const lit = hash2(Math.floor((X + cx) / 40), row, 27313) < 0.3; if (lit && d < 2.2 && dy > -1) return 5; return lit ? 1.6 - d * 0.08 : 0.4; }
  if (d < 8.5) v += dy < 0 ? 0.9 : -0.6;
  if (Math.abs(by - 26) < 1 && Math.abs(dx) < 11) v += 0.6;                                             // o patamar de cada toca
  return v;
}
function vDpOssada(x, y) {   // esqueletos de dragão enormes ao longe, meio enterrados: costelas em arco e a coluna
  const v = 1.8 + cn(x, y, 16, 16, 27321) * 0.8 + cg(x, y, 27322) * 0.3;
  const X = wrapT(x), Y = wrapT(y);
  for (let k = 0; k < 6; k++) {   // as costelas: arcos que saem da coluna (uma linha em y = 70) e descem
    const dx = wrapD(X - (20 + k * 36)), t = (Y - 70) / 120; if (t < 0 || t > 1) continue;
    const cxr = Math.sin(t * 2.4) * 22; if (Math.abs(dx - cxr) < 3 - t * 1.4) return 4 - Math.abs(dx - cxr) * 0.4 - t;
  }
  if (Math.abs(Y - 70 + Math.sin(X * W2 * 2) * 6) < 4) return X % 14 < 2 ? 1.2 : 4.2 - (Y - 70) * 0.1;   // as vértebras
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  tufo: bake(vTufo), andesito: bake(vAndesito), pomes: bake(vPomes), lavaCorda: bake(vLavaCorda), obsidiana: bake(vObsidiana), taipa: bake(vTaipa), andaime: bake(vAndaime),
  osso: bake(vOsso), ouro: bake(vOuroSolto), ouroDuro: bake(vOuroDuro), quente: bake(vQuente), crosta: bake(vCrosta), magma: bake(vMagma),
  tufoW: bake(vTufoW), andesitoW: bake(vAndesitoW), taipaW: bake(vTaipaW), lavaW: bake(vLavaW), obsidianaW: bake(vObsidianaW),
  dpChamine: bake(vDpChamine), dpTocas: bake(vDpTocas), dpOssada: bake(vDpOssada)
};
const DG_SOLID = [
  // id, paleta, textura, dureza, cor no mapa (ficha, seção 11)
  [DG_TUFO, 'dgTufo', 'tufo', 0.7, '#a8875a'], [DG_ANDESITO, 'dgAndesito', 'andesito', 1.3, '#6e625a'], [DG_POMES, 'dgPomes', 'pomes', 0.3, '#c4beb4'],
  [DG_LAVA_CORDA, 'dgLavaCorda', 'lavaCorda', 1.4, '#4a4440'], [DG_OBSIDIANA, 'dgObsidiana', 'obsidiana', 1.7, '#5a2a1e'], [DG_TAIPA, 'dgTaipa', 'taipa', 0.6, '#725e4c'],
  [DG_ANDAIME, 'dgAndaime', 'andaime', 0.5, '#bcac88'], [DG_OSSO, 'dgOsso', 'osso', 1.5, '#bcac88'], [DG_OURO_SOLTO, 'dgOuro', 'ouro', 0.35, '#d8a830'],
  [DG_OURO_DURO, 'dgOuroDuro', 'ouroDuro', 1.6, '#c4962a'], [DG_OURO_QUENTE, 'dgMagma', 'quente', 0, '#ffd050'], [DG_CROSTA, 'dgCrosta', 'crosta', 1.6, '#4a2a1a']
];
for (const [t, p, k, dig, col] of DG_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [DG_TUFO, DG_ANDESITO, DG_LAVA_CORDA, DG_OBSIDIANA, DG_TAIPA]) BLEND[t] = 1;
EMIT[DG_OURO_SOLTO] = 0.12; EMIT[DG_OURO_DURO] = 0.1; EMIT[DG_OURO_QUENTE] = 0.9; EMIT[DG_CROSTA] = 0.3; EMIT[DG_LAVA_CORDA] = 0.04;

WMAT[WDG_TUFO] = [PALS.dgTufoW, BKV.tufoW]; WMAT[WDG_ANDESITO] = [PALS.dgAndesitoW, BKV.andesitoW]; WMAT[WDG_TAIPA] = [PALS.dgTaipaW, BKV.taipaW];
WMAT[WDG_LAVA] = [PALS.dgLavaW, BKV.lavaW]; WMAT[WDG_OBSIDIANA] = [PALS.dgObsidianaW, BKV.obsidianaW];
DMAT[DP_DG_CHAMINE] = [PALS.dpDgChamine, BKV.dpChamine]; DMAT[DP_DG_TOCAS] = [PALS.dpDgTocas, BKV.dpTocas]; DMAT[DP_DG_OSSADA] = [PALS.dpDgOssada, BKV.dpOssada];

/* ---- os minérios: carvão no tufo e no andesito; o dracônio: escamas de metal escuro com a brasa dourada na borda ---- */
oreRamp(DG_O_DRACONIO, ['#1a0a06', '#3a1a0e', '#6a3418', '#a86020', '#e0a030', '#ffd860', '#fff4c0']);
const DRA_TIP = new Map();   // semente do bloco -> a borda mais acesa (onde a faísca pisca, ao vivo)
ORE_PAINT[DG_O_DRACONIO] = function (L, s) {
  const R = ORE_RAMP[DG_O_DRACONIO], n = 2 + (hash2(s, 1, 27401) < 0.6 ? 1 : 0);
  let tip = null, best = -9;
  for (let i = 0; i < n; i++) {   // placas em forma de escama (ponta para baixo), sobrepostas
    const cx = 3 + hash2(s, 2 + i, 27402) * 6, cy = 3 + hash2(s, 3 + i, 27403) * 5.5, r = 2.4 + hash2(s, i, 27404) * 1.2;
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / (r * 1.25), dp = Math.max(0, dy), dn = Math.min(0, dy), d = dx * dx + dp * dp * 1.6 + dn * dn;
      if (d > 1 || Math.abs(dx) > 1 - dp * 0.6) continue;
      let l = 2.4 - (dx + dy) * 0.9 + (hash2(x + s, y, 27405) - 0.5) * 0.4;
      if (d > 0.7) { l = dy > 0.2 ? 4.6 + (1 - d) * 3 : 1; if (dy > 0.2 && l > best) { best = l; tip = [x, y]; } }   // a borda de baixo em brasa
      L.put(x, y, ramp(R, Math.min(l, R.length - 2)), l);
    }
  }
  if (tip) L.put(tip[0], tip[1], R[6], 9);
  DRA_TIP.set(s, tip);
};
ORE_HALO[DG_O_DRACONIO] = { pal: ['dgObsidiana', '#ff8020', 0.3, 0.12], shade: 0.4 };
ORE_PAINT[DG_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[DG_O_CARVAO] = { pal: ['dgTufo', '#020204', 0.5, 0.2], shade: 0 };
MAT[DG_O_CARVAO] = [PALS.dgTufo, bakeOre(DG_O_CARVAO, vTufo)]; MAT[DG_O_DRACONIO] = [PALS.dgObsidiana, bakeOre(DG_O_DRACONIO, vObsidiana)];
for (const t of [DG_O_CARVAO, DG_O_DRACONIO]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[DG_O_CARVAO] = DIG[COAL]; ORE_XP[DG_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[DG_O_CARVAO] = ORE_NAME[COAL]; PCOL[DG_O_CARVAO] = PCOL[COAL]; ORE_ITEM[DG_O_CARVAO] = ORE_ITEM[COAL];
DIG[DG_O_DRACONIO] = 1.9; ORE_XP[DG_O_DRACONIO] = 25; ORE_NAME[DG_O_DRACONIO] = 'Dracônio'; PCOL[DG_O_DRACONIO] = '#e0a030'; ORE_ITEM[DG_O_DRACONIO] = 'min_draconio';
EMIT[DG_O_DRACONIO] = 0.3;
const draTip = (gx, gy) => DRA_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + DG_O_DRACONIO * 7919) | 0);

/* ---- itens de bloco ---- */
const DG_ITEMS = {
  tufo: ['Tufo Vulcânico', DG_TUFO, 'Cinza de vulcão que virou pedra. Bege, leve e cheia de furinhos. Ainda cheira a enxofre.'],
  andesito: ['Andesito', DG_ANDESITO, 'Pedra cinza e quente das paredes do vulcão. Os kobolds cavam nela com as unhas.'],
  pomes: ['Pedra-Pomes', DG_POMES, 'Espuma de pedra, quase branca. Tão cheia de ar que boiaria na água.'],
  lava_cordada: ['Lava Cordada', DG_LAVA_CORDA, 'Lava que escorreu devagar e esfriou em dobras, como corda torcida.'],
  taipa: ['Taipa Kobold', DG_TAIPA, 'Terra socada em camadas pelos kobolds, com escamas e marcas de unha no meio.'],
  andaime_ossos: ['Andaime de Ossos', DG_ANDAIME, 'Ossos compridos de draco amarrados com tiras de couro. Os kobolds fazem pontes com isso.'],
  osso_dragao: ['Osso de Dragão', DG_OSSO, 'Um pedaço de osso de dragão, marfim escurecido e rachado de calor. Pesa como pedra.'],
  ouro_fundido: ['Ouro Endurecido', DG_OURO_DURO, 'Ouro que derreteu no sopro do dragão e esfriou liso como cera. Não desliza mais.']
};
for (const id in DG_ITEMS) { const [name, block, desc] = DG_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
// a obsidiana rajada é material (o 278 dá o ícone, o preço e quem compra) e também o bloco
ITEMS.obsidiana_rajada = Object.assign(ITEMS.obsidiana_rajada || { name: 'Obsidiana Rajada', rar: 0, desc: 'Vidro de vulcão cor de mogno, com rajadas pretas. Corta como faca.' }, { stack: 99, block: DG_OBSIDIANA });
BLOCK_DROP[DG_OBSIDIANA] = 'obsidiana_rajada';
// o ouro solto vira moeda na mão: 1 ouro por bloco minerado (decisão 1 da ficha); escorregar não dá nada
BLOCK_DROP[DG_OURO_SOLTO] = 'ouro';
// o derretido, a crosta e a cortina não soltam nada

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRE = {
  osso: ['#1e180e', '#3a3020', '#5a4c34', '#7a6a4c', '#9a8a68', '#bcac88', '#ddd0ae'],
  couro: ['#140a06', '#2a160c', '#442614', '#5e381e', '#7a4c2a', '#9a663a', '#bc8650'],
  sebo: ['#2a2210', '#4e4428', '#7a6c46', '#a8986a', '#cec094', '#ece2bc', '#fffbe8'],
  ouro: ['#2a1a04', '#4a3008', '#7a5410', '#a87808', '#d8a830', '#f0cc5a', '#fff0a0'],
  cobre: ['#1a0c08', '#2a1410', '#4a2418', '#6e3820', '#9a5428', '#c47a3a', '#e8a85a'],
  olivina: ['#10180a', '#1e2a0c', '#3a5216', '#5a7a22', '#86a836', '#b4d05a', '#e4f4a0'],
  tufo: ['#1e140c', '#3a2a1a', '#5a4228', '#7a5c3a', '#9a774c', '#b8935e', '#d4b07a'],
  lava: ['#100e0e', '#1c1a1a', '#2c2826', '#3c3634', '#4e4844', '#645c56', '#7e766e'],
  magma: ['#3a0c02', '#6a1a04', '#a83a08', '#e06a10', '#ffa020', '#ffd050', '#fff4c0'],
  ferro: ['#0e0c0c', '#1e1a1a', '#322c2a', '#4a4240', '#665c58', '#867a74', '#a89a92'],
  enxofre: ['#2a2206', '#3a3008', '#6a5a10', '#a89020', '#d8c040', '#f4e478', '#fffbc8']
};
for (const k in DRE) DRE[k] = DRE[k].map(h => ph(h));
const O = DRE.osso, C = DRE.couro;

/* a escada de cravos: pinos de osso cravados na rocha em zigue-zague, a cabeça de cada um gasta pela mão */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr();
  for (const [px, py] of [[2, 1], [7, 4], [2, 7], [7, 10]]) {
    if (k === 2 && py > 8) continue;
    for (let x = px; x < px + 4; x++) { a.put(x, py, O, 5.2 - (x - px) * 0.5 + cg(x, py, s) * 0.3); a.put(x, py + 1, O, 2.6 - (x - px) * 0.3); }
    a.put(px - 1, py, DRE.ferro, 1.5); a.put(px - 1, py + 1, DRE.ferro, 1); a.put(px + 3, py - 1, O, 3.8);   // o buraco na rocha e a ponta
  }
  if (k === 1) for (let x = 3; x < 9; x++) a.put(x, 0, C, 4.4 - x * 0.2);   // a tira de couro de onde se pega no topo
  return rimOut(a, O[0], false);
}
const ESCADA = [escadaSprite(0, 27501), escadaSprite(1, 27502), escadaSprite(2, 27503)];
/* a corda de couro de draco: duas tiras trançadas, um nó a cada 4 */
function cordaSprite(end, s) {
  const a = spr(), len = end ? 9 : 12;
  for (let y = 0; y < len; y++) {
    const ph0 = (y + s) % 4, x0 = 5 + (ph0 < 2 ? 0 : 1);
    a.put(x0, y, C, ph0 === 0 ? 5.6 : 4.2); a.put(x0 + 1, y, C, ph0 === 2 ? 4.6 : 2.6);
    if (ph0 === 3) { a.put(x0 - 1, y, C, 3.6); a.put(x0 + 2, y, C, 2); }
  }
  if (end) { a.put(5, 9, C, 4); a.put(4, 10, C, 3); a.put(6, 10, C, 2.6); a.put(4, 11, C, 2); a.put(7, 11, C, 1.6); }
  return rimOut(a, C[0], false);
}
const CORDA = [cordaSprite(false, 0), cordaSprite(false, 2), cordaSprite(true, 1)];
/* a bica de vapor: um cone baixo de tufo com a boca escura e a crosta de sal em volta; o jato é ao vivo */
function vaporSprite(s) {
  const a = spr(), R = DRE.tufo;
  for (let y = 6; y < 12; y++) { const hw = 1.6 + (y - 6) * 0.85; for (let x = 0; x < 12; x++) { const dx = x + 0.5 - 6; if (Math.abs(dx) > hw) continue; a.put(x, y, R, 4.4 - dx * 0.35 - (y - 6) * 0.2 + cg(x, y, s) * 0.6); } }
  for (let x = 5; x <= 6; x++) { a.put(x, 6, R, 0.4); a.put(x, 7, R, 1.2); }
  for (const [x, y] of [[3, 9], [8, 8], [4, 11], [9, 10]]) pp(a, x, y, SAL[3]);
  return rimOut(a, R[0]);
}
const VAPOR = [vaporSprite(27511), flipX(vaporSprite(27512))];
/* a olivina: um cacho de cristaizinhos verde-garrafa no chão (não é minério); a faísca é ao vivo */
const OLI_TIP = [];
function olivinaSprite(v) {
  const a = spr(), R = DRE.olivina, xs = v ? [[3, 3, 0.5], [6, 5, 0], [9, 3, -0.4]] : [[2.5, 2.6, 0.3], [5.6, 4.4, -0.1], [8.6, 3.4, 0.5], [7, 2, -0.6]];
  let tip = null;
  for (const [bx, h, ang] of xs) for (let j = 0; j < h * 1.6; j++) {
    const y = 11 - j, x = Math.round(bx + ang * j * 0.6);
    a.put(x, y, R, 5 - j * 0.15); a.put(x + 1, y, R, 3 - j * 0.1); if (j === Math.ceil(h * 1.6) - 1 && (!tip || y < tip[1])) tip = [x, y];
  }
  for (let x = 1; x < 11; x++) a.put(x, 11, DRE.tufo, 3 - x * 0.1);
  OLI_TIP[v] = tip;
  return rimOut(a, R[0]);
}
const OLIVINA = [olivinaSprite(0), olivinaSprite(1)];
/* o totem kobold: um pau torto com o crânio de um draco jovem espetado, penas de couro amarradas */
function totemSprite(s) {
  const a = spr();
  for (let y = 4; y < 12; y++) { a.put(5 + (y > 8 ? 1 : 0), y, C, 4.6 - (y - 4) * 0.1); a.put(6 + (y > 8 ? 1 : 0), y, C, 2.6); }
  for (let y = 0; y < 5; y++) for (let x = 2; x < 10; x++) {   // o crânio de lado: focinho comprido para a direita
    const dx = (x + 0.5 - 5) / 3, dy = (y + 0.5 - 2.4) / 2.4, snout = x >= 7 && y >= 2 && y <= 3;
    if (dx * dx + dy * dy > 1 && !snout) continue;
    a.put(x, y, O, 5.4 - dx * 0.8 - dy * 1.2 + cg(x, y, s) * 0.4);
  }
  pp(a, 4, 2, O[0]); pp(a, 5, 2, O[1]); pp(a, 8, 4, O[6]); pp(a, 9, 4, O[5]);   // a órbita e os dentes
  pp(a, 3, 0, O[6]); pp(a, 2, 0, O[4]);   // o chifrinho
  for (const [x, y, k] of [[4, 6, 4], [3, 7, 3], [8, 6, 4], [9, 7, 2]]) pp(a, x, y, DRE.cobre[k]);   // as penas de couro
  return rimOut(a, C[0]);
}
const TOTEM = [totemSprite(27521), flipX(totemSprite(27522))];
/* a vela de sebo: um toco amarelado e torto, escorrido, num pires de barro; a chama é ao vivo */
const VELA_F = [[5, 4], [6, 3]];
function velaSprite(k) {
  const a = spr(), S = DRE.sebo, h = k ? 6 : 5, x0 = k ? 5 : 4;
  for (let y = 11 - h; y < 11; y++) for (let x = x0; x < x0 + 3; x++) a.put(x, y, S, (x === x0 ? 5.4 : x === x0 + 2 ? 2.8 : 4.2) - (y - (11 - h)) * 0.1);
  a.put(x0 - 1, 9, S, 3.6); a.put(x0 - 1, 10, S, 3); a.put(x0 + 3, 8, S, 3);   // escorridos
  for (let x = x0 - 2; x <= x0 + 4; x++) a.put(x, 11, DRE.tufo, 4 - (x - x0 + 2) * 0.35);
  pp(a, VELA_F[k][0], VELA_F[k][1] + 1, DRE.ferro[1]);   // o pavio
  return rimOut(a, S[0]);
}
const VELA = [velaSprite(0), velaSprite(1)];
/* as moedas espalhadas: umas de pé, outras deitadas; a cintilada é ao vivo */
function moedasSprite(s) {
  const a = spr(), R = DRE.ouro;
  for (let i = 0; i < 6; i++) {
    const cx = 1.5 + hash2(i, s, 1) * 9, flat = hash2(i, s, 2) < 0.7, cy = flat ? 10.6 + hash2(i, s, 3) * 0.6 : 9;
    if (flat) for (let x = Math.round(cx - 1.4); x <= cx + 1.4; x++) { a.put(x, Math.round(cy), R, 4.6 - (x - cx) * 0.6); a.put(x, Math.round(cy) + 1, R, 2.2); }
    else for (let y = 7; y < 11; y++) { a.put(Math.round(cx), y, R, 5.2 - (y - 7) * 0.4); a.put(Math.round(cx) + 1, y, R, 3 - (y - 7) * 0.3); }
  }
  return rimOut(a, R[0]);
}
const MOEDAS = [moedasSprite(27531), moedasSprite(27532), moedasSprite(27533)];
/* a estalactite de lava: uma gota comprida de lava cordada pendurada, a ponta ainda em brasa */
function estalactSprite(k, s) {
  const a = spr(), R = DRE.lava, len = 7 + k * 2;
  for (let y = 0; y < len; y++) { const hw = Math.max(0.5, 2.8 * (1 - y / len)), cx = 5.6 + Math.sin(y * 0.7 + s) * 0.4; for (let x = 0; x < 12; x++) { const dx = x + 0.5 - cx; if (Math.abs(dx) > hw) continue; a.put(x, y, R, 4.4 - dx * 0.7 - y * 0.1 + ((y + s) % 3 === 0 ? 0.6 : 0)); } }
  pp(a, 5, len - 1, DRE.magma[3]);
  return rimOut(a, R[0], false);
}
const ESTALACT = [estalactSprite(0, 1), estalactSprite(1, 2)];
/* a fumarola: uma chaminezinha de tufo com crosta de enxofre, a boca alaranjada; a fumaça é ao vivo */
function fumarolaSprite(s) {
  const a = spr(), R = DRE.tufo, E = DRE.enxofre;
  for (let y = 4; y < 12; y++) { const hw = 1.6 + (y - 4) * 0.45; for (let x = 0; x < 12; x++) { const dx = x + 0.5 - 6; if (Math.abs(dx) > hw) continue; const crust = hash2(x, y, s) < 0.3 && Math.abs(dx) > hw - 1.2; a.put(x, y, crust ? E : R, (crust ? 4 : 4.4) - dx * 0.4 - (y - 4) * 0.12); } }
  for (let x = 5; x <= 6; x++) { pp(a, x, 4, DRE.magma[5]); pp(a, x, 5, DRE.magma[3]); }
  return rimOut(a, R[0]);
}
const FUMAROLA = [fumarolaSprite(27541), flipX(fumarolaSprite(27542))];
/* a coluna de lava: onde a gota de lava encontrou o chão: gomos de lava cordada empilhados, a base mais larga */
function colunaSprite(k, s) {   // 0 pé, 1 meio, 2 topo, 3 meio com brasa
  const a = spr(), R = DRE.lava;
  for (let y = 0; y < 12; y++) {
    const gom = Math.sin((y + s) * 1.05) * 0.6, hw = (k === 0 ? 3.4 + (y > 8 ? (y - 8) * 0.6 : 0) : k === 2 ? 2.4 + (y < 3 ? (3 - y) * 0.7 : 0) : 2.6) + gom;
    for (let x = 0; x < 12; x++) { const dx = x + 0.5 - 6; if (Math.abs(dx) > hw) continue; a.put(x, y, R, 4.6 - dx * 0.55 + gom * 0.8 + cg(x, y, s) * 0.3); }
    if (k === 3 && gom < -0.5) { pp(a, 6, y, DRE.magma[4]); pp(a, 5, y, DRE.magma[3]); }
  }
  return rimOut(a, R[0], false);
}
const COLUNA = [colunaSprite(0, 27551), colunaSprite(1, 27552), colunaSprite(2, 27553), colunaSprite(3, 27554)];
/* a escama caída: uma escama de draco cor de cobre, curva, com a borda que pega luz */
function escamaSprite(s) {
  const a = spr(), R = DRE.cobre, cx = 5 + hash2(s, 1, 1) * 2, ang = (hash2(s, 2, 1) - 0.5) * 0.8, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let y = 6; y < 12; y++) for (let x = 0; x < 12; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - 9.6, u = dx * ca + dy * sa, w = -dx * sa + dy * ca, e = (u / 3.6) ** 2 + (w / 1.8) ** 2;
    if (e > 1) continue;
    a.put(x, y, R, e > 0.6 ? (w < 0 ? 6 : 2) : 4.2 - w * 0.8 - Math.abs(u) * 0.2);
  }
  return rimOut(a, R[0]);
}
const ESCAMA = [escamaSprite(27561), escamaSprite(27562), flipX(escamaSprite(27563))];
/* o fio de armadilha: um fio de cobre esticado de parede a parede na altura do joelho, às vezes com um sininho de osso */
function fioSprite(k) {
  const a = spr(), R = DRE.cobre;
  for (let x = 0; x < 12; x++) { pp(a, x, 8, R[5]); pp(a, x, 9, R[2]); }
  if (k) { pp(a, 6, 10, O[5]); pp(a, 5, 10, O[4]); pp(a, 6, 11, O[3]); }
  return a;
}
const FIO = [fioSprite(0), fioSprite(1)];
/* a cortina de magma: fios de fogo caindo, o miolo vazado (a parede aparece); duas fases */
function cortinaSprite(k) {
  const a = spr(), M = PALS.dgMagma;
  for (const x0 of [0, 3, 6, 9]) for (let y = 0; y < 12; y++) {
    const x = x0 + 1 + (Math.sin((y + k * 6 + x0) * 0.6) > 0.3 ? 1 : 0);
    pp(a, x, y, M[(y + x0 + k * 4) % 5 === 0 ? 5 : 3]); pp(a, x + 1, y, M[2]);
  }
  return a;
}
const CORTINA = [cortinaSprite(0), cortinaSprite(1)];

DECO[DG_ESCADA] = ESCADA; DECO[DG_CORDA] = CORDA; DECO[DG_VAPOR] = VAPOR; DECO[DG_OLIVINA] = OLIVINA; DECO[DG_TOTEM] = TOTEM; DECO[DG_VELA] = VELA;
DECO[DG_MOEDAS] = MOEDAS; DECO[DG_ESTALACT] = ESTALACT; DECO[DG_FUMAROLA] = FUMAROLA; DECO[DG_COLUNA] = COLUNA; DECO[DG_ESCAMA] = ESCAMA; DECO[DG_FIO] = FIO;
// a cortina: sólida mas vazada (a parede aparece entre os fios), como o véu do Reino; não quebra; o 277 queima quem encosta
DECO[DG_CORTINA] = CORTINA; MAT[DG_CORTINA] = [PALS.dgMagma, BKV.magma]; SOLID[DG_CORTINA] = 1; BLOCKY[DG_CORTINA] = 0; SEETHRU[DG_CORTINA] = 1; DIG[DG_CORTINA] = 0; PCOL[DG_CORTINA] = '#ffa020'; EMIT[DG_CORTINA] = 0.85;
const DG_DECO = [
  // id, dureza, cor no mapa, o que solta
  [DG_ESCADA, 0.3, '#bcac88', null], [DG_CORDA, 0.15, '#7a4c2a', null], [DG_VAPOR, 0.4, '#b8935e', null], [DG_OLIVINA, 0.2, '#86a836', null], [DG_TOTEM, 0.15, '#ddd0ae', null],
  [DG_VELA, 0.05, '#ece2bc', null], [DG_MOEDAS, 0.03, '#f0cc5a', 'ouro'], [DG_ESTALACT, 0.2, '#4e4844', null], [DG_FUMAROLA, 0.4, '#d8c040', null], [DG_COLUNA, 0.9, '#4e4844', 'lava_cordada'],
  [DG_ESCAMA, 0.02, '#c47a3a', 'escama_draco'], [DG_FIO, 0.02, '#e8a85a', null]
];
for (const [t, dig, col, drop] of DG_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[DG_VELA] = 0.6; EMIT[DG_FUMAROLA] = 0.45; EMIT[DG_MOEDAS] = 0.12; EMIT[DG_OLIVINA] = 0.08; EMIT[DG_VAPOR] = 0.05; EMIT[DG_FIO] = 0.05; EMIT[DG_ESCAMA] = 0.05;
// o que cai quando o apoio some (56, 87); escada, corda e coluna ficam (atravessam vãos)
CV_HANGS[DG_ESTALACT] = 1;
for (const t of [DG_VAPOR, DG_OLIVINA, DG_TOTEM, DG_VELA, DG_MOEDAS, DG_FUMAROLA, DG_ESCAMA]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[DG_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== DG_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== DG_ESCADA ? arr[2] : arr[0];
DECO_PICK[DG_CORDA] = (gx, gy, arr) => tileAt(gx, gy + 1) === DG_CORDA || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[DG_VAPOR] = (gx, gy, arr) => arr[vr(gx, gy, 27571, 2)];
const oliV = (gx, gy) => vr(gx, gy, 27572, 2);
DECO_PICK[DG_OLIVINA] = (gx, gy, arr) => arr[oliV(gx, gy)];
DECO_PICK[DG_TOTEM] = (gx, gy, arr) => arr[vr(gx, gy, 27573, 2)];
const velaV = (gx, gy) => vr(gx, gy, 27574, 2);
DECO_PICK[DG_VELA] = (gx, gy, arr) => arr[velaV(gx, gy)];
DECO_PICK[DG_MOEDAS] = (gx, gy, arr) => arr[vr(gx, gy, 27575, 3)];
DECO_PICK[DG_ESTALACT] = (gx, gy, arr) => arr[vr(gx, gy, 27576, 2)];
DECO_PICK[DG_FUMAROLA] = (gx, gy, arr) => arr[vr(gx, gy, 27577, 2)];
DECO_PICK[DG_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== DG_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== DG_COLUNA ? arr[2] : arr[hash2(wrapX(gx), gy, 27578) < 0.25 ? 3 : 1];
DECO_PICK[DG_ESCAMA] = (gx, gy, arr) => arr[vr(gx, gy, 27579, 3)];
DECO_PICK[DG_FIO] = (gx, gy, arr) => arr[(gx * 7 + gy) % 5 === 0 ? 1 : 0];
DECO_PICK[DG_CORTINA] = (gx, gy, arr) => arr[(gx + gy) & 1];

// a escada de cravos sobe como a escada da mina (a pose de subir, 88); a corda, como a corrente
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, DG_ESCADA) || _tt(e, DG_CORDA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, DG_ESCADA)); }; }

/* ================= ao vivo: o magma correndo, as brasas, o ouro, a vela, o vapor, a fumaça ================= */
const DG_GL = {};
const dgGlow = (k, r, col) => DG_GL[k] || (DG_GL[k] = glow(r, col));
const dgOut = cy => cy + VH < (DG_S0 - 6) * T || cy > (DG_S0 + DG_D + 6) * T;
const MAG_C = '#ffa020', OURO_C = '#ffd060', VELA_C = '#ffc070';
const inDgRow = gy => gy >= DG_S0 - 2 && gy < DG_S0 + DG_D + 2;
const isDg = t => t === LAVA || (t >= DG_TUFO && t <= DG_OURO_QUENTE);
HOOK.drawGlow.push((cx, cy) => {
  if (dgOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (!isDg(t)) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case LAVA: if (!inDgRow(gy) || (gx + gy) & 1) break; lc.globalAlpha = 0.16 + Math.sin(tm * 2 + gx * 0.4) * 0.04; lc.drawImage(dgGlow('m22', 22, MAG_C), x + 6 - 22, y + 4 - 22); break;
      case DG_VELA: { const f = 0.9 + Math.sin(tm * 12 + gx) * 0.05 + Math.sin(tm * 27 + gy) * 0.04, [fx, fy] = VELA_F[velaV(gx, gy)]; lc.globalAlpha = 0.28 * f; lc.drawImage(dgGlow('vb', 26, VELA_C), x + fx - 26, y + fy - 26); lc.globalAlpha = 0.45 * f; lc.drawImage(dgGlow('vs', 7, '#fff0c0'), x + fx - 7, y + fy - 7); break; }
      case DG_FUMAROLA: lc.globalAlpha = 0.2 + Math.sin(tm * 3 + gx) * 0.05; lc.drawImage(dgGlow('f14', 14, '#ff8a30'), x + 6 - 14, y + 4 - 14); break;
      case DG_OURO_QUENTE: lc.globalAlpha = 0.28 + Math.sin(tm * 6 + gx + gy) * 0.06; lc.drawImage(dgGlow('q18', 18, OURO_C), x + 6 - 18, y + 6 - 18); break;
      case DG_OURO_SOLTO: case DG_OURO_DURO: if ((gx * 3 + gy * 5) % 4) break; lc.globalAlpha = 0.07; lc.drawImage(dgGlow('o12', 12, OURO_C), x + 6 - 12, y + 6 - 12); break;
      case DG_CROSTA: if ((gx + gy) & 1) break; lc.globalAlpha = 0.1 + Math.sin(tm * 1.4 + gx * 0.6) * 0.04; lc.drawImage(dgGlow('c12', 12, '#ff6a10'), x + 6 - 12, y + 6 - 12); break;
      case DG_CORTINA: lc.globalAlpha = 0.3 + Math.sin(tm * 5 + gy * 0.7) * 0.06; lc.drawImage(dgGlow('k16', 16, MAG_C), x + 6 - 16, y + 6 - 16); break;
      case DG_O_DRACONIO: lc.globalAlpha = 0.1 + Math.max(0, Math.sin(tm * 1.6 + gx * 1.7 + gy)) * 0.08; lc.drawImage(dgGlow('d12', 12, '#ff9030'), x + 6 - 12, y + 6 - 12); break;
      case DG_MOEDAS: lc.globalAlpha = 0.06; lc.drawImage(dgGlow('o10', 10, OURO_C), x + 6 - 10, y + 10 - 10); break;
      case DG_LAVA_CORDA: if ((gx * 5 + gy * 3) % 9) break; lc.globalAlpha = 0.05 + Math.max(0, Math.sin(tm * 0.8 + gx)) * 0.04; lc.drawImage(dgGlow('l10', 10, '#ff6a10'), x + 6 - 10, y + 6 - 10); break;
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (dgOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (!isDg(t)) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case LAVA: {   // o magma corrente: listras claras e crosta escura escorrendo para um lado (decisão 3: só a textura se mexe)
        if (!inDgRow(gy)) break;
        const dir = hash2(Math.floor(wrapX(gx) / 24), Math.floor(gy / 12), 27601) < 0.5 ? -1 : 1;
        for (let k = 0; k < 3; k++) {
          const ly = 2 + k * 4 + ((gx + k) & 1), off = Math.floor(tm * (14 + k * 5) * dir + hash2(k, gy, 27602) * 40);
          for (let j = 0; j < 12; j++) {
            const u = (((gx * T + j - off) % 24) + 24) % 24;
            if (u < 5) { lc.fillStyle = u < 2 ? '#fff4c0' : '#ffd050'; lc.fillRect(x + j, y + ly, 1, 1); }
            else if (u > 18 && k === 1) { lc.fillStyle = '#6a1a04'; lc.fillRect(x + j, y + ly, 1, 1); }
          }
        }
        if (tileAt(gx, gy - 1) !== LAVA && hash2(wrapX(gx) + Math.floor(tm * 1.3), gy, 27603) < 0.06) {   // uma bolha estoura
          const bx = x + vr(gx + Math.floor(tm * 1.3), gy, 27604, 10) + 1; lc.fillStyle = '#ffd050'; lc.fillRect(bx, y - 1, 2, 1); lc.fillStyle = '#fff4c0'; lc.fillRect(bx, y - 2, 1, 1);
        }
        break;
      }
      case DG_VELA: {   // a chama do sebo: amarela, alta, tremendo
        const [fx, fy] = VELA_F[velaV(gx, gy)], f = Math.floor(tm * 10 + gx * 3) % 4;
        lc.fillStyle = '#fff0c0'; lc.fillRect(x + fx, y + fy - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#ffa020'; lc.fillRect(x + fx + (f === 2 ? 1 : f === 3 ? -1 : 0), y + fy - 2, 1, 1);
        break;
      }
      case DG_VAPOR: {   // a cada 4 s um jato de vapor (só visual)
        const ph0 = (tm * 0.25 + hash2(wrapX(gx), gy, 27605)) % 1; if (ph0 > 0.22) break;
        const f = ph0 / 0.22, H = Math.round(6 + f * 20);
        lc.fillStyle = '#e8e0d4';
        for (let j = 0; j < H; j += 2) { lc.globalAlpha = (1 - j / H) * (1 - f * 0.5) * 0.6; const w = 1 + Math.floor(j / 6); lc.fillRect(x + 6 - w + Math.round(Math.sin(j * 0.5 + tm * 9) * 0.8), y + 6 - j, w * 2, 2); }
        lc.globalAlpha = 1; break;
      }
      case DG_FUMAROLA: {   // a fumaça amarelada sobe torta
        for (let k = 0; k < 3; k++) { const ph0 = (tm * 0.4 + k / 3 + hash2(wrapX(gx), gy, 27606)) % 1; lc.globalAlpha = (1 - ph0) * 0.35; lc.fillStyle = k ? '#8a8270' : '#c8b878'; lc.fillRect(x + 6 + Math.round(Math.sin(ph0 * 6 + k) * 2), y + 3 - Math.round(ph0 * 22), 2, 2); }
        lc.globalAlpha = 1; break;
      }
      case DG_OLIVINA: case DG_O_DRACONIO: case DG_MOEDAS: {   // de vez em quando uma faísca
        const ph0 = (tm * 0.3 + hash2(wrapX(gx), gy, 27607) * 7) % 1; if (ph0 > 0.07) break;
        const tp = t === DG_OLIVINA ? OLI_TIP[oliV(gx, gy)] : t === DG_O_DRACONIO ? draTip(gx, gy) : [2 + vr(gx, gy, 27608, 8), 9];
        if (!tp) break;
        const L = ph0 < 0.035 ? 1 : 2; lc.fillStyle = t === DG_OLIVINA ? '#f0ffc0' : '#fff4c0'; lc.fillRect(x + tp[0], y + tp[1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + tp[0] - L + 1, y + tp[1], L * 2 - 1, 1);
        break;
      }
      case DG_OURO_SOLTO: case DG_OURO_DURO: {   // o ouro cintila aqui e ali
        const n = Math.floor(tm * 2 + gx * 0.37); if (hash2(wrapX(gx) + n, gy, 27609) > 0.035) break;
        const sx = x + 2 + vr(gx + n, gy, 27610, 8), sy = y + 2 + vr(gx + n, gy, 27611, 8); lc.fillStyle = '#ffffff'; lc.fillRect(sx, sy - 1, 1, 3); lc.fillRect(sx - 1, sy, 3, 1);
        break;
      }
      case DG_OURO_QUENTE: {   // o derretido ferve
        const ph0 = (tm * 1.5 + hash2(wrapX(gx), gy, 27612) * 3) % 1, bx = x + 2 + vr(gx + Math.floor(tm * 1.5), gy, 27613, 8);
        lc.globalAlpha = 1 - ph0; lc.fillStyle = '#fff4c0'; lc.fillRect(bx, y + 4 - Math.round(ph0 * 3), 2, 1); lc.globalAlpha = 1;
        break;
      }
      case DG_FIO: { const ph0 = (tm * 0.5 + gx * 0.13) % 1; if (ph0 > 0.15) break; lc.fillStyle = '#fff0c0'; lc.fillRect(x + Math.round(ph0 / 0.15 * 11), y + 8, 1, 1); break; }   // o brilho corre pelo cobre
      case DG_CORTINA: { const ly = Math.floor(tm * 14 + gx * 3) % 12; lc.fillStyle = '#fff4c0'; for (const xx of [1, 4, 7, 10]) lc.fillRect(x + xx, y + ly, 1, 2); break; }
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(DGART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, pp, wrapT, W2, RX, BRASA, OLIV, COBRE, OURO, SAL, DRE, dgGlow, DG_GL, dgOut,
  vTufo, vAndesito, vPomes, vLavaCorda, vObsidiana, vTaipa, vAndaime, vOsso, vOuroSolto, vOuroDuro, vQuente, vCrosta,
  ESCADA, CORDA, VAPOR, OLIVINA, TOTEM, VELA, MOEDAS, ESTALACT, FUMAROLA, COLUNA, ESCAMA, FIO, CORTINA, VELA_F });
}
