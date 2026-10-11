'use strict';

/* ================= o Mar Sem Sol: blocos, paredes, terceira camada, minérios, decoração, o brilho =================
   Um mar inteiro debaixo da terra, sem céu. Nas Praias Negras, a areia preta fina em ondinhas com grãos de mica e
   cacos de concha, o basalto molhado em colunas com o brilho da água escorrendo, as cracas em cones nos penhascos e
   nos cascos velhos. Na Floresta de Algas, o recife de coral morto claro e furado e o coral vivo em meandros de
   cérebro, rosa e laranja apagados. Na Fossa, o lodo liso em camadas e as pedras entalhadas dos templos da
   gente-peixe, com olhos e peixes em relevo. Nas Chaminés, o sulfeto em faixas de crescimento, ferrugem, enxofre e a
   rachadura laranja que ainda ferve. Os navios: o casco de tábua alcatroada, as cavilhas, e o convés claro e gasto.
   Como o 251, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; paredes e terceira camada
   só leem o tom. A decoração de 1 bloco são sprites de 12x12 em rampas de 7 tons com luz de cima à esquerda; o que
   se mexe (a alga que balança, a chama verde da lanterna, a gota da estalactite, as bolhas da fonte, o vapor do
   respiro, as plumas dos vermes, o pulso das conchas e das anêmonas) é desenhado ao vivo, só sobre o que está na tela.
   Ids: 260. */
const MSART = {};   // ferramentas para 262-mar-objetos, os bichos (263, 264), o Leviatã (266) e o oricalco (267)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('msAreia', ['#0c0c10', '#18181e', '#26262e', '#363640', '#4a4a56', '#6a6a7a']);
pal('msRocha', ['#0a1016', '#142028', '#1e303c', '#2a4250', '#3c5a68', '#567a88']);
pal('msCracas', ['#0e1418', '#1c2830', '#2c3c46', '#40525c', '#5a6e78', '#7e929a']);
pal('msRecife', ['#3a3630', '#5a544a', '#7a7264', '#9a9282', '#bab2a0', '#dad2c0']);
pal('msCoral', ['#3a1418', '#5e2428', '#86383a', '#a8564e', '#c87a66', '#e8a488']);
pal('msLodo', ['#0a0c0c', '#141818', '#1e2422', '#28302c', '#343e38', '#44504a']);
pal('msSulfeto', ['#100c08', '#221a10', '#3a2a14', '#5a3e18', '#8a6420', '#c09a3a']);
pal('msCasco', ['#140c08', '#24160c', '#382214', '#4e321e', '#68462c', '#866040']);
pal('msConves', ['#2a2016', '#46382a', '#625040', '#806a54', '#a08a70', '#c4ac90']);
pal('msTemplo', ['#0c1614', '#16262a', '#22383a', '#2e4c4c', '#426662', '#5e8680']);
pal('msBarreira', ['#0e2c4a', '#164264', '#2a6688', '#4a90b0', '#8ac4dc', '#e0f4ff']);
// paredes de fundo: bem mais escuras que o chão da frente
pal('msRochaW', ['#030507', '#05090c', '#080d12', '#0b1218', '#10181f', '#162129']);
pal('msRecifeW', ['#0c0b0a', '#13110f', '#1a1814', '#221f1a', '#2b2721', '#36312a']);
pal('msCascoW', ['#060403', '#0a0705', '#0f0a07', '#140e0a', '#1a130d', '#221911']);
pal('msTemploW', ['#030606', '#050a0a', '#081010', '#0b1515', '#0f1c1b', '#2a6a64']);
pal('msSulfetoW', ['#060403', '#0b0805', '#110c07', '#18110a', '#20160c', '#5a2a0e']);
// a terceira camada: o horizonte (ilhas e cascos ao longe, os pontinhos de luz no tom 5), o fundo (os vultos), as
// chaminés ao longe (a brasa no tom 5)
pal('dpMsHorizonte', ['#010305', '#03070c', '#060d16', '#0a1522', '#122236', '#5ac8c0']);
pal('dpMsFundo', ['#010204', '#020509', '#04080e', '#060c15', '#0a121e', '#1e3a52']);
pal('dpMsChamines', ['#030202', '#070504', '#0c0806', '#120c08', '#1a110a', '#ff7a2a']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // senos só com múltiplos inteiros disto, para a textura não ter emenda
const RX = hexes => hexes.map(h => ph(h));
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
const MICA = RX(['#6a7a8a', '#9aaabb', '#d8e4f0']);                                       // grãos de mica na areia
const SHELL = RX(['#5a5248', '#8a8070', '#b8ae9a', '#e0d8c6']);                           // cacos de concha
const WET = RX(['#3a5a6a', '#5a8090', '#8ab4c4', '#c8e4f0']);                             // o brilho da água escorrendo
const POLIP = RX(['#c86a6a', '#f09a88', '#ffd0b8']);                                       // os pólipos do coral
const RUST = RX(['#3a1a08', '#6a2e0c', '#9a4a14', '#c86a1e']);                            // ferrugem do sulfeto
const ENXOF = RX(['#7a6a10', '#b8a020', '#e8d84a']);                                       // enxofre
const BRASA = RX(['#5a1404', '#a03008', '#e8601a', '#ffa040', '#ffe0a0']);                // a rachadura que ferve
const TAR = RX(['#050302', '#0c0806', '#16100a']);                                         // o piche das juntas
const PEG = RX(['#5a4028', '#8a6440', '#b08a5c']);                                         // cavilhas de madeira
const NAIL = RX(['#2a2420', '#4a4038', '#7a6a5a']);                                        // pregos velhos do convés
const CIANO = RX(['#0a3a3a', '#1a6a66', '#2a9490', '#4ac0b4', '#8ae8d8', '#e0fff8']);     // a luz do plâncton

/* ---- o chão sólido ---- */
function vAreia(x, y) {   // areia negra: grão fino, ondinhas deitadas, mica que brilha, cacos de concha
  const r = Math.sin(y * W2 * 40 + cn(x, y, 10, 4, 26101) * 5 + x * W2 * 6);
  let v = 2.4 + r * 0.45 + cn(x, y, 24, 24, 26102) * 0.9 + cg(x, y, 26103) * 1.0;
  if (r > 0.86) v += 0.6; else if (r < -0.9) v -= 0.5;                                                   // a crista e o vale da ondinha
  if (hash2(x, y, 26104) < 0.006) { MATX = MICA[hash2(x, y, 26105) < 0.3 ? 2 : 1]; return -9; }
  const c = cells(x, y, 10, 26106, 0.8);
  if (c.id < 0.06 && c.d1 < 1.3) { MATX = SHELL[c.ox + c.oy < -0.3 ? 3 : c.ox + c.oy > 0.5 ? 0 : 2]; return -9; }   // um caco
  if (hash2(x, y, 26107) < 0.05) v -= 1.0;
  return v;
}
function vRocha(x, y) {   // rocha do mar: basalto em colunas tortas, juntas fundas, a água escorrendo no topo de cada coluna
  const c = cells(wrapT(x + cn(x, y, 6, 6, 26111) * 8), y, 24, 26112, 1.6), e = c.d2 - c.d1;
  if (e < 0.9) return 0.4 + cg(x, y, 26113) * 0.3;                                                       // a junta
  let v = 2.5 + (c.id - 0.5) * 0.9 + cn(x, y, 30, 30, 26114) * 0.8 + cg(x, y, 26115) * 0.4;
  if (e < 2.0) v += c.ox + c.oy < 0 ? 0.9 : -0.8;                                                        // o chanfro
  const wet = cn(x, y, 20, 3, 26116);                                                                    // os fios d'água, verticais
  if (wet > 0.16 && c.oy < 0) { MATX = WET[wet > 0.24 ? 2 : wet > 0.2 ? 1 : 0]; return -9; }
  if (wet > 0.1) v += 0.6;
  if (hash2(x, y, 26117) < 0.004) { MATX = WET[3]; return -9; }                                          // uma gota que pega luz
  if (hash2(x, y, 26118) < 0.03) v -= 0.9;
  return v;
}
function vCracas(x, y) {   // rocha de cracas: a rocha escura e, em cima, cones de craca com o furo no meio
  let v = 1.9 + cn(x, y, 24, 24, 26121) * 0.8 + cg(x, y, 26122) * 0.4;
  const c = cells(x, y, 8, 26123, 0.9);
  if (c.id < 0.7) {
    const r = 1.8 + c.id * 2.4;
    if (c.d1 < 0.9) return 0.3;                                                                           // o furo
    if (c.d1 < 1.5) return 4.6 - (c.ox + c.oy) * 0.4;                                                    // a boca clara
    if (c.d1 < r) { const s = Math.atan2(c.oy, c.ox); return 3.2 - (c.ox + c.oy) / r * 1.2 + (Math.sin(s * 6) > 0.6 ? 0.6 : 0) + cg(x, y, 26124) * 0.3; }   // as placas do cone
    if (c.d1 < r + 0.8) return c.ox + c.oy > 0 ? 0.8 : 1.6;                                              // a sombra embaixo
  }
  if (hash2(x, y, 26125) < 0.01) v += 1.2;
  return v;
}
function vRecife(x, y) {   // recife: coral morto claro, poroso, furinhos com a borda de baixo acesa
  let v = 3.0 + cn(x, y, 12, 12, 26131) * 1.2 + cn(x, y, 40, 40, 26132) * 0.6 + cg(x, y, 26133) * 0.45;
  const h = cells(x, y, 6, 26134, 1.2);
  if (h.id < 0.45) { const r = 0.9 + h.id * 1.6; if (h.d1 < r) return h.oy > 0.2 ? 1.6 : 0.6; if (h.d1 < r + 0.8) v += h.oy > 0 ? 0.8 : -0.5; }
  const b = cells(x, y, 30, 26135, 1);
  if (b.d2 - b.d1 < 1.0) v -= 1.0;                                                                       // as galhadas antigas
  if (hash2(x, y, 26136) < 0.02) v += 0.9;
  return v;
}
function vCoral(x, y) {   // coral vivo: botões de pólipo redondos e apertados, acesos de cima à esquerda, vales escuros; alguns pólipos acesos
  const c = cells(x, y, 5, 26141, 1.05), e = c.d2 - c.d1, r = c.d1 / 3.2;
  if (e < 0.7 || r > 1) return 0.6 + cg(x, y, 26146) * 0.3;                                               // o vale entre os botões
  let v = 2.5 + (c.id - 0.5) * 0.8 - (c.ox + c.oy) * 0.28 - r * r * 0.9 + cn(x, y, 24, 24, 26144) * 0.6 + cg(x, y, 26145) * 0.3;
  if (r < 0.3 && c.id > 0.9) { MATX = POLIP[c.id > 0.97 ? 2 : 1]; return -9; }                           // o miolo do pólipo, aceso
  return v;
}
function vLodo(x, y) {   // lodo: liso, em camadas deitadas, furinhos de verme, uma ou outra conchinha preta
  const Y = y + cn(x, y, 4, 10, 26151) * 10;
  let v = 2.4 + Math.sin(Y * W2 * 30) * 0.35 + cn(x, y, 30, 30, 26152) * 0.5 + cg(x, y, 26153) * 0.18;
  if (Math.sin(Y * W2 * 10 + 1) > 0.95) v += 0.5;
  const h = cells(x, y, 12, 26154, 1);
  if (h.id < 0.08 && h.d1 < 1) return 0.3;
  if (h.id < 0.08 && h.d1 < 1.8 && h.oy > 0) v += 0.6;
  if (hash2(x, y, 26155) < 0.02) v -= 0.8;
  return v;
}
function vSulfeto(x, y) {   // sulfeto: crosta preta em nódulos, poros, ferrugem e enxofre nas bordas, a rachadura que ainda ferve entre os nódulos
  const c = cells(x, y, 9, 26161, 1.25), e = c.d2 - c.d1;
  if (e < 0.8) {   // a junta: funda e escura; em alguns trechos, brasa
    const cr = cn(x, y, 14, 14, 26165);
    if (cr > 0.27) { MATX = BRASA[cr > 0.31 ? 3 : 2]; return -9; }
    if (cr > 0.23) { MATX = BRASA[0]; return -9; }
    return 0.3 + cg(x, y, 26164) * 0.3;
  }
  let v = 1.7 + (c.id - 0.5) * 0.7 + cn(x, y, 30, 30, 26163) * 0.6 + cg(x, y, 26164) * 0.4;
  if (e < 2.2) v += c.ox + c.oy < 0 ? 0.8 : -0.5;                                                         // a borda do nódulo
  if (hash2(x, y, 26168) < 0.05) v -= 1.1;                                                               // um poro
  const ru = cn(x, y, 12, 12, 26166);
  if (ru > 0.22 && e < 3) { MATX = RUST[Math.min(3, ((ru - 0.22) * 25) | 0)]; return -9; }
  if (c.id < 0.06 && c.d1 < 2) { MATX = ENXOF[c.ox + c.oy < 0 ? 2 : 1]; return -9; }                    // um grão de enxofre
  return v;
}
/* casco: fiadas de tábua alcatroada de 6 px, comprimentos desencontrados, o piche nas juntas, as cavilhas e
   manchas de cracas e de musgo de sal */
function vCasco(x, y) {
  const Y = wrapT(y), row = Math.floor(Y / 6), ly = Y % 6, hr = hash2(row, 0, 26171), len = 40 + ((hr * 4) | 0) * 20;
  if (ly === 5) { MATX = TAR[1]; return -9; }
  const xx = wrapT(x + ((hr * 240) | 0)), col = Math.floor(xx / len), lx = xx - col * len, hp = hash2(col, row, 26172);
  if (lx < 1) { MATX = TAR[0]; return -9; }
  let v = 2.6 + (hp - 0.5) * 0.9 + cn(x, y, 40, 40, 26173) * 0.5 + cg(x, y, 26174) * 0.3;
  if (ly === 0) v += 0.8; else if (ly === 4) v -= 0.6;
  const gr = Math.sin(ly * 1.9 + lx * 0.25 + hp * 9 + Math.sin(lx * 0.1 + hp * 4) * 2);
  if (gr > 0.88) v -= 0.6;
  if ((Math.abs(lx - 3) < 0.6 || Math.abs(lx - len + 4) < 0.6) && ly === 2) { MATX = PEG[1]; return -9; }   // a cavilha
  if ((Math.abs(lx - 3) < 0.6 || Math.abs(lx - len + 4) < 0.6) && ly === 3) v -= 0.8;
  const st = cn(x, y, 10, 10, 26175); if (st > 0.16) v -= 1.1;                                          // a mancha de sal
  const b = cells(x, y, 6, 26176, 1); if (st > 0.12 && b.id < 0.5 && b.d1 < 1.6) return b.d1 < 0.6 ? 0.3 : 3.8 - (b.ox + b.oy) * 0.4;   // cracas
  return v;
}
function vConves(x, y) {   // convés: tábuas claras compridas, gastas no meio, pregos pretos, rachas
  const Y = wrapT(y), row = Math.floor(Y / 4), ly = Y % 4, hr = hash2(row, 0, 26181), len = 60 + ((hr * 3) | 0) * 30;
  if (ly === 3) return 0.6;
  const xx = wrapT(x + ((hr * 240) | 0)), col = Math.floor(xx / len), lx = xx - col * len, hp = hash2(col, row, 26182);
  if (lx < 1) return 0.7;
  let v = 3.0 + (hp - 0.5) * 0.7 + cn(x, y, 30, 30, 26183) * 0.6 + cg(x, y, 26184) * 0.35;
  if (ly === 0) v += 0.6;
  if (Math.abs(lx - len / 2) < len * 0.3) v += 0.3;                                                     // gasto no meio
  if (Math.abs(lx - 2) < 0.6 && ly === 1) { MATX = NAIL[0]; return -9; }
  if (Math.abs(lx - 2) < 0.6 && ly === 2) v -= 0.4;
  const cr = Math.abs(cn(x, y, 6, 30, 26185)); if (cr < 0.006 && ly > 0) v -= 1.2;
  if (hash2(x, y, 26186) < 0.02) v -= 0.8;
  return v;
}
/* pedra entalhada: blocos de 24 x 24 desencontrados; no meio, em relevo, um olho grande (a amêndoa, a pupila em
   fenda), um peixe de lado, ou ondas; o relevo pega luz em cima à esquerda */
function tplMotif(lx, ly, kind) {
  const dx = lx + 0.5 - 12, dy = ly + 0.5 - 12;
  if (kind === 0) { const w = 8 - Math.abs(dx) * 0.0, h = 4.2 * (1 - (dx / 8.5) * (dx / 8.5)); return Math.abs(dx) < 8.5 && Math.abs(dy) < h && !(Math.abs(dx) < 0.8 && Math.abs(dy) < h - 0.6) && !(Math.abs(dy) < h - 1.1 && Math.abs(dx) < 7 && Math.abs(dx) > 1.6) ? true : false; }
  if (kind === 1) { const body = (dx + 1) * (dx + 1) / 42 + dy * dy / 10 < 1, tail = dx > 4.5 && dx < 9 && Math.abs(dy) < (dx - 4.5) * 0.9; const eye = Math.hypot(dx + 4.2, dy + 0.6) < 0.9; return (body || tail) && !eye; }
  if (kind === 2) { const s = Math.sin(lx * 0.55) * 2; return Math.abs(dy - s + 3) < 0.8 || Math.abs(dy - s - 3) < 0.8; }
  return false;
}
function vTemplo(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 24), ly = Y % 24, xx = wrapT(X + (row & 1) * 12), col = Math.floor(xx / 24), lx = xx % 24, h = hash2(col, row, 26191);
  if (ly === 23 || lx === 23) return 0.4;
  let v = 2.7 + (h - 0.5) * 0.6 + cn(x, y, 30, 30, 26192) * 0.6 + cg(x, y, 26193) * 0.35;
  if (ly === 0 || lx === 0) v += 1.0; else if (ly === 22 || lx === 22) v -= 0.8;
  const st = cn(x, y, 8, 8, 26194); if (st > 0.14) v -= 0.9;                                            // o limo
  const kind = h < 0.34 ? 0 : h < 0.62 ? 1 : h < 0.8 ? 2 : 3;
  if (kind === 3) { if (lx >= 4 && lx <= 19 && ly >= 4 && ly <= 19) { v -= 0.6; if (lx === 4 || ly === 4) v -= 0.7; if (lx === 19 || ly === 19) v += 0.8; } return v; }
  if (tplMotif(lx, ly, kind)) {
    let r = 3.6 + cg(x, y, 26195) * 0.2;
    if (!tplMotif(lx - 1, ly - 1, kind)) r += 1.0; else if (!tplMotif(lx + 1, ly + 1, kind)) r -= 1.1;
    return r;
  }
  if (kind === 0 && Math.hypot(lx + 0.5 - 12, ly + 0.5 - 12) < 1.6) return 0.3;                         // a pupila funda
  if (tplMotif(lx - 1, ly - 1, kind)) v -= 1.0;
  return v;
}
function vBarreira(x, y) {   // a Onda Parada: água em pé, correndo para cima, fios de espuma
  const X = wrapT(x);
  let v = 2.4 + Math.sin(X * W2 * 30 + y * W2 * 4) * 0.5 + cn(x, y, 6, 30, 26201) * 1.2 + cg(x, y, 26202) * 0.3;
  const f = Math.abs(cn(x, wrapT(y + X * 0.3), 20, 4, 26203)); if (f < 0.012) v = 5;
  return v;
}

/* ---- paredes de fundo (só o tom) ---- */
function vRochaW(x, y) { const v = vRocha(x, y); return v === -9 ? 3.2 : v; }
function vRecifeW(x, y) { const v = vRecife(x, y); return v - 0.4; }
function vCascoW(x, y) {   // o casco por dentro: tábuas e as cavernas (costelas) a cada 48 px
  const X = wrapT(x), lx = X % 48;
  if (lx < 6) { let v = 3.2 - Math.abs(lx - 2.5) * 0.5 + cn(x, y, 6, 30, 26211) * 0.6 + cg(x, y, 26212) * 0.3; if (lx === 0) v = 0.6; return v; }
  const v = vCasco(x, y); return v === -9 ? (MATX === PEG[1] ? 3.6 : 0.8) : v - 0.5;
}
function vTemploW(x, y) {   // mosaico: o peixe e o olho em pedrinhas, as pedrinhas do olho com a tinta de plâncton (tom 5)
  const X = wrapT(x), Y = wrapT(y), lx = X % 48, ly = Y % 48;
  if (lx === 0 || ly === 0) return 0.6;
  const tx = lx >> 2, ty = ly >> 2, sx = lx & 3, sy = ly & 3;
  let v = 2.2 + cn(x, y, 24, 24, 26221) * 0.6 + (hash2(Math.floor(X / 4), Math.floor(Y / 4), 26222) - 0.5) * 0.8;
  if (sx === 3 || sy === 3) v -= 0.9;
  const dx = tx - 5.5, dy = ty - 5.5;
  if (Math.abs(dy) < 3.2 * (1 - (dx / 5.5) * (dx / 5.5)) && Math.abs(dx) < 5.5) { v += 1; if (Math.hypot(dx, dy) < 1.4) return sx === 3 || sy === 3 ? 2 : 5; }
  return v;
}
function vSulfetoW(x, y) { const v = vSulfeto(x, y); if (v !== -9) return v - 0.3; return MATX === BRASA[2] || MATX === BRASA[3] ? 5 : 2.6; }

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpHorizonte(x, y) {   // o mar ao longe: ilhas baixas, cascos de quilha para cima e as lanternas verdes das palafitas
  let v = 0.6 + cn(x, y, 12, 12, 26231) * 0.4 + cg(x, y, 26232) * 0.12;
  const Y = wrapT(y), by = Y % 120, band = Math.floor(Y / 120), X = wrapT(x + band * 70);
  if (by > 70) { v = 1.6 + Math.sin(X * W2 * 30 + by * 0.8) * 0.3 + cg(x, y, 26233) * 0.15; if (Math.sin(X * W2 * 12 + by * 1.3) > 0.97) v = 2.6; return v; }   // a água
  const k = Math.floor(X / 80), lx = X % 80, h = hash2(k, band, 26234), cx = 40 + (h - 0.5) * 30, w = 16 + h * 18, top = 70 - (8 + h * 14);
  const d = Math.abs(lx + 0.5 - cx);
  if (h < 0.55 && d < w && by > top + (d / w) * (d / w) * (70 - top)) { v = 2.2 - (lx < cx ? -0.4 : 0.3) + cg(x, y, 26235) * 0.2; if (by > 66) v -= 0.6; if (hash2(Math.floor(X / 2), Math.floor(by / 2), 26236) < 0.012) return 5; return v; }   // a ilha e uma luz
  if (h >= 0.55 && d < w * 0.8 && by > 62 && by <= 70) { const q = (by - 62) / 8; if (d < w * 0.8 * (1 - q * 0.3)) return 2.4 - q * 0.6 + (lx < cx ? 0.4 : 0); }   // o casco virado
  if (h > 0.8 && Math.abs(lx + 0.5 - cx - 10) < 1 && by > 40 && by < 70) return 2.6;                    // um mastro
  return v;
}
function vDpFundo(x, y) {   // o fundo: azul quase preto, fios de luz caindo e, bem longe, um vulto enorme que passa
  let v = 0.6 + cn(x, y, 8, 8, 26241) * 0.5 + cg(x, y, 26242) * 0.12;
  const sh = Math.hypot(wrapD(x - 120) / 70, wrapD(y - 110 + Math.sin(x * W2) * 12) / 14);
  if (sh < 1) v = 1.8 - sh * 0.6 + cn(x, y, 30, 6, 26243) * 0.3;                                       // o vulto
  if (sh < 1 && Math.abs(wrapD(x - 80)) < 1.5 && Math.abs(wrapD(y - 108)) < 1.5) return 5;              // o olho dele
  const r = Math.abs(cn(x, y, 30, 2, 26244)); if (r < 0.01) v += 1.2;
  if (hash2(x, y, 26245) < 0.003) return 4.6;                                                           // plâncton
  return v;
}
function vDpChamines(x, y) {   // as chaminés ao longe: torres pretas, fumaça subindo, a boca em brasa
  let v = 0.7 + cn(x, y, 10, 10, 26251) * 0.5 + cg(x, y, 26252) * 0.12;
  const X = wrapT(x), k = Math.floor(X / 60), lx = X % 60, h = hash2(k, 0, 26253), cx = 30 + (h - 0.5) * 20, top = 40 + h * 80, hw = 4 + h * 5 + (wrapT(y) - top) * 0.06;
  const d = Math.abs(lx + 0.5 - cx), Y = wrapT(y);
  if (Y > top && d < hw) { if (Y < top + 3) return d < hw - 1 ? 5 : 3.4; return 2.2 + (lx < cx ? 0.5 : -0.3) + cn(x, y, 6, 20, 26254) * 0.4 + cg(x, y, 26255) * 0.2; }
  if (Y < top && Y > top - 60 && d < 3 + (top - Y) * 0.25 + Math.sin(Y * 0.2 + k) * 2) v = 1.6 + cn(x, y, 20, 20, 26256) * 0.8;   // a fumaça
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  areia: bake(vAreia), rocha: bake(vRocha), cracas: bake(vCracas), recife: bake(vRecife), coral: bake(vCoral), lodo: bake(vLodo), sulfeto: bake(vSulfeto),
  casco: bake(vCasco), conves: bake(vConves), templo: bake(vTemplo), barreira: bake(vBarreira),
  rochaW: bake(vRochaW), recifeW: bake(vRecifeW), cascoW: bake(vCascoW), temploW: bake(vTemploW), sulfetoW: bake(vSulfetoW),
  dpHorizonte: bake(vDpHorizonte), dpFundo: bake(vDpFundo), dpChamines: bake(vDpChamines)
};
const MS_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [MS_AREIA, 'msAreia', 'areia', 0.45, '#363640'], [MS_ROCHA, 'msRocha', 'rocha', 1.5, '#2a4250'], [MS_CRACAS, 'msCracas', 'cracas', 1.4, '#40525c'],
  [MS_RECIFE, 'msRecife', 'recife', 1.0, '#9a9282'], [MS_CORAL, 'msCoral', 'coral', 0.8, '#a8564e'], [MS_LODO, 'msLodo', 'lodo', 0.5, '#28302c'],
  [MS_SULFETO, 'msSulfeto', 'sulfeto', 1.7, '#5a3e18'], [MS_CASCO, 'msCasco', 'casco', 0.8, '#4e321e'], [MS_CONVES, 'msConves', 'conves', 0.7, '#806a54'],
  [MS_TEMPLO, 'msTemplo', 'templo', 1.6, '#2e4c4c']
];
for (const [t, p, k, dig, col] of MS_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [MS_AREIA, MS_ROCHA, MS_LODO, MS_SULFETO, MS_RECIFE]) BLEND[t] = 1;
EMIT[MS_CORAL] = 0.12; EMIT[MS_SULFETO] = 0.08;

WMAT[WMS_ROCHA] = [PALS.msRochaW, BKV.rochaW]; WMAT[WMS_RECIFE] = [PALS.msRecifeW, BKV.recifeW]; WMAT[WMS_CASCO] = [PALS.msCascoW, BKV.cascoW];
WMAT[WMS_TEMPLO] = [PALS.msTemploW, BKV.temploW]; WMAT[WMS_SULFETO] = [PALS.msSulfetoW, BKV.sulfetoW];
DMAT[DP_MS_HORIZONTE] = [PALS.dpMsHorizonte, BKV.dpHorizonte]; DMAT[DP_MS_FUNDO] = [PALS.dpMsFundo, BKV.dpFundo]; DMAT[DP_MS_CHAMINES] = [PALS.dpMsChamines, BKV.dpChamines];

/* ---- os minérios: carvão na rocha, e o oricalco: placas sextavadas verde-douradas, na rocha e no sulfeto ---- */
const ORI_HEX = ['#1a2410', '#2e3e18', '#4a5e20', '#72822c', '#a8a83c', '#e0d870', '#fffbd0'];
oreRamp(MS_O_ORICALCO, ORI_HEX); oreRamp(MS_O_ORICALCO_S, ORI_HEX);
const ORI_TIP = new Map();
function oriPaint(L, s) {
  const R = ORE_RAMP[MS_O_ORICALCO], pts = oreNodes(L, s, R, 26300, [2.7, 0.7], [1.3, 0.5], 6);
  // as placas: um risco claro atravessando o nó maior, como a face lisa de um metal que nunca enferruja
  const p = pts && pts[0];
  if (p && p.length >= 2) { const [cx, cy] = p; oreLine(L, cx - 2, cy + 1, cx + 1, cy - 2, (x, y) => { if (L.m[y * 12 + x]) L.put(x, y, R[5], 6); }); ORI_TIP.set(s, [Math.round(cx), Math.round(cy - 1)]); }
  else ORI_TIP.set(s, null);
  for (let i = 0; i < 2; i++) { const x = 1 + (hash2(s, i, 26301) * 10 | 0), y = 1 + (hash2(s, i, 26302) * 10 | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[3 + i], 1); }   // pó
}
ORE_PAINT[MS_O_ORICALCO] = oriPaint; ORE_PAINT[MS_O_ORICALCO_S] = oriPaint;
ORE_HALO[MS_O_ORICALCO] = { pal: ['msRocha', '#8aa040', 0.3, 0.12], shade: 0.3 };
ORE_HALO[MS_O_ORICALCO_S] = { pal: ['msSulfeto', '#a8a83c', 0.3, 0.12], shade: 0.3 };
ORE_PAINT[MS_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[MS_O_CARVAO] = { pal: ['msRocha', '#020204', 0.5, 0.2], shade: 0 };
MAT[MS_O_CARVAO] = [PALS.msRocha, bakeOre(MS_O_CARVAO, vRocha)];
MAT[MS_O_ORICALCO] = [PALS.msRocha, bakeOre(MS_O_ORICALCO, vRocha)];
MAT[MS_O_ORICALCO_S] = [PALS.msSulfeto, bakeOre(MS_O_ORICALCO_S, vSulfeto)];
for (const t of [MS_O_CARVAO, MS_O_ORICALCO, MS_O_ORICALCO_S]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[MS_O_CARVAO] = DIG[COAL]; ORE_XP[MS_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[MS_O_CARVAO] = ORE_NAME[COAL]; PCOL[MS_O_CARVAO] = PCOL[COAL]; ORE_ITEM[MS_O_CARVAO] = ORE_ITEM[COAL];
for (const t of [MS_O_ORICALCO, MS_O_ORICALCO_S]) { DIG[t] = 1.9; ORE_XP[t] = 25; ORE_NAME[t] = 'Oricalco'; PCOL[t] = '#a8a83c'; ORE_ITEM[t] = 'min_oricalco'; EMIT[t] = 0.22; }
const oriTip = (gx, gy, t) => ORI_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + t * 7919) | 0);

/* ---- itens de bloco ---- */
const MS_ITEMS = {
  areia_negra: ['Areia Negra', MS_AREIA, 'Areia preta e fina das praias do Mar Sem Sol. Tem grãos de mica que brilham quando a luz passa.'],
  rocha_mar: ['Rocha do Mar', MS_ROCHA, 'Basalto em colunas, sempre molhado. A água escorre nele mesmo longe do mar.'],
  rocha_cracas: ['Rocha de Cracas', MS_CRACAS, 'Rocha coberta de cracas. Áspera de cortar a mão.'],
  recife: ['Recife', MS_RECIFE, 'Coral morto, claro e cheio de furinhos. Leve, mas firme.'],
  coral_vivo: ['Coral Vivo', MS_CORAL, 'Coral rosa em meandros. Ainda vivo, e ainda brilha um pouco no escuro.'],
  lodo_fossa: ['Lodo da Fossa', MS_LODO, 'Lodo liso e frio do fundo da Fossa, em camadas finas como papel.'],
  sulfeto: ['Sulfeto', MS_SULFETO, 'Rocha das Chaminés, em faixas de ferrugem e enxofre. Fica quente na mão por muito tempo.'],
  tabua_casco: ['Tábua de Casco', MS_CASCO, 'Tábua de navio, preta de piche, com cavilhas de madeira. Afundou e não apodreceu.'],
  conves: ['Convés', MS_CONVES, 'Tábua clara e gasta de convés, com os pregos pretos de ferro velho.'],
  pedra_entalhada: ['Pedra Entalhada', MS_TEMPLO, 'Bloco dos templos da gente-peixe, com olhos e peixes em relevo. Eles não gostam que levem.']
};
for (const id in MS_ITEMS) { const [name, block, desc] = MS_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRM = {
  alga: ['#061410', '#0c2418', '#163a24', '#225430', '#36703e', '#548c4a', '#80aa66'],
  anemona: ['#2a0a1a', '#4a1430', '#78204a', '#a83468', '#d85a8a', '#ff8ab0', '#ffd0e0'],
  concha: ['#0a2a2a', '#164a48', '#246e6a', '#3a948c', '#5cbcb0', '#94e4d8', '#e0fff8'],
  conchaC: ['#2a2420', '#4a4038', '#6e6254', '#948674', '#b8ac98', '#dad0be', '#f4eee2'],
  ferro: ['#0a0a0c', '#1a1a1e', '#2c2a2e', '#423e40', '#5a5452', '#7a7068', '#9a8c80'],
  ferrugem: ['#1a0a04', '#3a1808', '#5a2a0e', '#7e4016', '#a85a20', '#c87a32', '#e8a058'],
  corda: ['#1a140c', '#2e2416', '#4a3a24', '#6a5636', '#8c744c', '#ac9468', '#d0bc90'],
  madeira: ['#120a06', '#22160c', '#362416', '#4c3420', '#64462c', '#806040', '#a07c58'],
  verde: ['#1a2a06', '#34500c', '#5a8016', '#86b024', '#b4d83a', '#d8f070', '#f8ffc0'],
  rocha: ['#060a0e', '#0e1820', '#1a2a36', '#283e4c', '#3a5664', '#52727e', '#7a9aa4'],
  osso: ['#2a2620', '#4a4438', '#6e6656', '#948a76', '#b8ae98', '#d8d0bc', '#f4eee0'],
  verme: ['#2a0606', '#500c0c', '#7a1414', '#a82020', '#d83a2a', '#ff6a4a', '#ffb090'],
  tubo: ['#1a1814', '#2e2a24', '#4a443a', '#6a6252', '#8a8270', '#aca28e', '#d0c8b4'],
  mexilhao: ['#04060a', '#0a0e16', '#141a24', '#1e2836', '#2c3a4c', '#465a70', '#7a90a8'],
  sulfeto: ['#0a0604', '#1a1008', '#2e1e0c', '#4a3012', '#6a4818', '#8a6420', '#c09a3a'],
  brasa: ['#2a0602', '#5a1404', '#a03008', '#e8601a', '#ffa040', '#ffd080', '#fff4d0'],
  bolha: ['#0e2c4a', '#164264', '#2a6688', '#4a90b0', '#8ac4dc', '#c8ecf8', '#ffffff']
};
for (const k in DRM) DRM[k] = DRM[k].map(h => ph(h));

/* a alga alta: a fita parada (a que balança é ao vivo, por cima); o bloco guarda só o pé enraizado */
function algaPe(s) {
  const a = spr(), G = DRM.alga;
  for (let x = 2; x <= 9; x++) { const h = 9 + (hash2(x, s, 1) < 0.4 ? 1 : 0); for (let y = h; y < 12; y++) a.put(x, y, G, 1.6 + (11 - y) * 0.3 + cg(x, y, s) * 0.4); }   // o tufo de raízes
  return rimOut(a, G[0], false);
}
const ALGA = [algaPe(26401), algaPe(26402)];
/* a anêmona: o pé gordo no chão e os tentáculos em leque, a ponta acesa rosa (o pulso é ao vivo) */
function anemonaSprite(s) {
  const a = spr(), A = DRM.anemona;
  disc(a, 6, 10.4, 3.6, 1.8, A, (dx, dy) => 2.6 - dx * 0.8 - dy * 0.6);
  for (let k = 0; k < 7; k++) {
    const ang = -1.25 + k * (2.5 / 6) + (hash2(k, s, 2) - 0.5) * 0.2, L = 5 + hash2(k, s, 3) * 2.4, ux = Math.sin(ang), uy = -Math.cos(ang);
    for (let i = 0; i <= L * 2; i++) { const t = i / 2, x = 6 + ux * t + Math.sin(t * 0.8 + k) * 0.4, y = 9.6 + uy * t; a.put(x, y, A, t > L - 1.2 ? 6 : 3.4 + t * 0.2 - ux * 0.5); }
  }
  return rimOut(a, A[0], false);
}
const ANEMONA = [anemonaSprite(26411), anemonaSprite(26412), flipX(anemonaSprite(26413))];
/* a concha luminosa: uma vieira aberta no chão, as costelas em leque, a borda acesa ciano */
function conchaSprite(s, k) {
  const a = spr(), C = k ? DRM.concha : DRM.conchaC, L = DRM.concha;
  for (let y = 4; y < 12; y++) for (let x = 0; x < 12; x++) {
    const dx = x + 0.5 - 6, dy = y + 0.5 - 11, r = Math.hypot(dx, dy), ang = Math.atan2(dx, -dy);
    if (r > 6 || dy > 0 || Math.abs(ang) > 1.35) continue;
    let v = 3.4 - dx * 0.18 + (Math.cos(ang * 9) > 0.4 ? 0.9 : -0.4) + cg(x, y, s) * 0.3;
    if (r > 5.1) { a.put(x, y, L, 5.4); continue; }
    a.put(x, y, C, v);
  }
  for (let x = 4; x <= 7; x++) a.put(x, 11, C, 2.2);                                                     // a dobradiça
  return rimOut(a, C[0], false);
}
const CONCHA = [conchaSprite(26421, 0), conchaSprite(26422, 1), flipX(conchaSprite(26423, 0))];
/* a corrente de âncora: elos grossos de ferro, um de frente e o outro de lado, com ferrugem */
function correnteSprite(s) {
  const a = spr(), F = DRM.ferro, R = DRM.ferrugem;
  for (let y = 0; y < 12; y++) {
    const ly = y % 6, front = y < 6;
    if (front) { for (const x of [4, 7]) { if (ly === 0 || ly === 5) continue; a.put(x, y, hash2(x, y, s) < 0.3 ? R : F, x === 4 ? 4.6 : 2.6); } if (ly === 0 || ly === 5) for (let x = 5; x <= 6; x++) a.put(x, y, F, ly === 0 ? 5 : 2.4); if (ly === 1 || ly === 4) { a.put(4, y, F, 3.8); a.put(7, y, F, 2.2); } }
    else { a.put(5, y, hash2(5, y, s) < 0.35 ? R : F, 4.4); a.put(6, y, F, 2.6); }
  }
  return rimOut(a, F[0], false);
}
const CORRENTE = [correnteSprite(26431)];
/* a escada de cordame: as duas cordas grossas torcidas, os degraus de corda amarrados (ratlins) */
function cordameSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), C = DRM.corda, M = DRM.madeira, y0 = k === 1 ? 2 : 0, y1 = k === 2 ? 9 : 11;
  for (let y = y0; y <= y1; y++) for (const x0 of [1, 9]) { a.put(x0, y, C, (y + s) % 3 === 0 ? 5.4 : 4); a.put(x0 + 1, y, C, (y + s) % 3 === 1 ? 3 : 2); }
  for (const ry of k === 2 ? [3, 7] : [2, 8]) { for (let x = 3; x <= 8; x++) a.put(x, ry + Math.round(Math.sin((x - 3) / 5 * Math.PI) * 0.6), C, 4.6 - (x - 3) * 0.2); for (const x0 of [1, 9]) { a.put(x0, ry, C, 6); a.put(x0 + 1, ry, C, 3.6); } }
  if (k === 1) for (let x = 0; x < 12; x++) { a.put(x, 0, M, 5 - x * 0.15); a.put(x, 1, M, 2.8); }      // a verga
  if (k === 2) for (const x0 of [1, 9]) { a.put(x0, 10, C, 4); a.put(x0 - 1, 11, C, 3); a.put(x0 + 1, 11, C, 2.4); a.put(x0 + 2, 11, C, 2); }
  return rimOut(a, C[0], false);
}
const CORDAME = [cordameSprite(0, 26441), cordameSprite(1, 26442), cordameSprite(2, 26443)];
/* a lanterna de óleo de peixe: pendurada num gancho, a gaiola de ferro torta e o vidro verde-amarelado (a chama é ao
   vivo) */
const LTN_F = [6, 8];
function lanternaSprite(s) {
  const a = spr(), F = DRM.ferro, V = DRM.verde;
  for (let y = 0; y < 3; y++) a.put(6, y, F, 3.2);
  a.put(5, 3, F, 4.4); a.put(6, 3, F, 5); a.put(7, 3, F, 3);
  for (let y = 4; y <= 11; y++) for (let x = 3; x <= 9; x++) {
    const top = y === 4 || y === 11, side = x === 3 || x === 9, bar = x === 6 && !top;
    if (top) { a.put(x, y, F, 4 - (x - 3) * 0.3); continue; }
    if (side) { a.put(x, y, F, x === 3 ? 4.4 : 2.4); continue; }
    if (bar) { a.put(x, y, F, 3.4); continue; }
    const d = Math.hypot(x + 0.5 - LTN_F[0], y + 0.5 - LTN_F[1]); a.put(x, y, V, 5.4 - d * 0.8 - (x > 6 ? 0.6 : 0));
  }
  return rimOut(a, F[0], false);
}
const LANTERNA = [lanternaSprite(26451)];
/* a estalactite pingando: uma ponta de rocha molhada com o fio de água e a gota que cresce (a que cai é ao vivo) */
const EST_X = [5, 6];
function estalacSprite(v, s) {
  const a = spr(), R = DRM.rocha, x0 = EST_X[v];
  for (let y = 0; y < 10; y++) { const hw = 3.6 * (1 - y / 10) + (y < 2 ? 1 : 0); for (let x = 0; x < 12; x++) { const dx = x + 0.5 - (x0 + 0.5); if (Math.abs(dx) > hw) continue; a.put(x, y, R, 3.4 - dx * 0.5 + cg(x, y, s) * 0.4 + (Math.abs(dx) < 0.6 ? 1.3 : 0)); } }
  a.put(x0, 10, DRM.bolha, 5);
  return rimOut(a, R[0], false);
}
const ESTALAC = [estalacSprite(0, 26461), estalacSprite(1, 26462)];
/* os vermes-tubo: um maço de tubos claros em pé, das bocas saem as plumas vermelhas (o abre e fecha é ao vivo) */
const VER_P = [[3, 3], [6, 1], [9, 4]];
function vermesSprite(s) {
  const a = spr(), U = DRM.tubo, V = DRM.verme;
  for (const [tx, ty] of VER_P) for (let y = ty + 2; y < 12; y++) { a.put(tx - 1, y, U, 4.8); a.put(tx, y, U, 3.6 + ((y + tx) % 3 === 0 ? 0.6 : 0)); a.put(tx + 1, y, U, 2.2); }
  for (const [tx, ty] of VER_P) { a.put(tx - 1, ty + 1, V, 5); a.put(tx, ty + 1, V, 4.2); a.put(tx + 1, ty + 1, V, 3); }
  return rimOut(a, U[0], false);
}
const VERMES = [vermesSprite(26471), flipX(vermesSprite(26472))];
/* a espinha de um peixe grande: a coluna deitada, as costelas, a cabeça com o olho vazio */
function espinhaSprite(s) {
  const a = spr(), O = DRM.osso;
  for (let x = 1; x <= 9; x++) a.put(x, 9, O, 4.6 - x * 0.08);
  for (let x = 3; x <= 8; x += 2) { const h = 3.6 - Math.abs(x - 5.5) * 0.5; for (let i = 1; i <= h; i++) { a.put(x + i * 0.3, 9 - i, O, 4.2 - i * 0.2); a.put(x + i * 0.3, 9 + i * 0.6, O, 3); } }
  for (let y = 7; y <= 11; y++) for (let x = 9; x <= 11; x++) if (Math.hypot(x - 10, y - 9) < 2.1) a.put(x, y, O, 4.2 - (x - 9) * 0.5);
  pp(a, 10, 8, O[0]); for (const [x, y] of [[0, 8], [0, 10], [1, 7], [1, 11]]) a.put(x, y, O, 3.6);     // a cauda
  return rimOut(a, O[0], false);
}
const ESPINHA = [espinhaSprite(26481), flipX(espinhaSprite(26482))];
/* o cacho de mexilhões no teto: conchas pretas compridas penduradas, a borda azulada, um fio de barba */
function mexilhaoSprite(s) {
  const a = spr(), M = DRM.mexilhao;
  for (let k = 0; k < 5; k++) {
    const cx = 2 + k * 2 + (hash2(k, s, 1) - 0.5), L = 5 + hash2(k, s, 2) * 4, ang = (hash2(k, s, 3) - 0.5) * 0.6;
    for (let i = 0; i <= L; i++) for (let w = -1.4; w <= 1.4; w += 0.7) { const hw = 1.4 * Math.sin((i + 0.5) / (L + 1) * Math.PI); if (Math.abs(w) > hw) continue; const x = cx + Math.sin(ang) * i + w, y = i; a.put(x, y, M, w < 0 ? 4.2 : 2 + (i > L - 1 ? 1.5 : 0)); }
  }
  return rimOut(a, M[0], false);
}
const MEXILHAO = [mexilhaoSprite(26491), flipX(mexilhaoSprite(26492))];
/* o respiro de vapor: um cone baixo de sulfeto com a boca em brasa (o vapor é ao vivo) */
function respiroSprite(s) {
  const a = spr(), S = DRM.sulfeto, B = DRM.brasa;
  for (let y = 4; y < 12; y++) { const hw = 1.6 + (y - 4) * 0.62; for (let x = 0; x < 12; x++) { const dx = x + 0.5 - 6; if (Math.abs(dx) > hw) continue; a.put(x, y, S, 3.4 - dx * 0.4 + cg(x, y, s) * 0.6 + (Math.sin(y * 1.7) > 0.7 ? 0.8 : 0)); } }
  for (const x of [5, 6]) { a.put(x, 4, B, 5); a.put(x, 5, B, 3.6); }
  return rimOut(a, S[0], false);
}
const RESPIRO = [respiroSprite(26501)];
/* a estaca de palafita: um tronco escuro com cracas, amarrado de corda; o pé enterrado, a cabeça sob o piso */
function estacaSprite(k, s) {   // 0 pé, 1 meio, 2 cabeça
  const a = spr(), M = DRM.madeira, C = DRM.corda;
  for (let y = 0; y < 12; y++) for (let x = 3; x <= 8; x++) { const q = (x + 0.5 - 6) / 3; a.put(x, y, M, 3.6 - q * 1.6 - q * q * 0.8 + (Math.sin(y * 2.1 + x) > 0.85 ? -0.8 : 0) + cg(x, y, s) * 0.3); }
  if (k === 1 && hash2(s, 0, 1) < 2) for (let x = 3; x <= 8; x++) { a.put(x, 5, C, 5 - (x - 3) * 0.3); a.put(x, 6, C, 3.2 - (x - 3) * 0.2); }
  if (k === 0) for (let x = 1; x <= 10; x++) { a.put(x, 11, DRM.rocha, 2.6); if (x < 3 || x > 8) a.put(x, 10, DRM.rocha, 2); }
  if (k === 2) for (let x = 2; x <= 9; x++) a.put(x, 0, M, 4.6 - (x - 2) * 0.2);
  for (let i = 0; i < 3; i++) { const x = 3 + (hash2(i, s, 2) * 6 | 0), y = 1 + (hash2(i, s, 3) * 10 | 0); a.put(x, y, DRM.osso, 4.4); }   // cracas
  return rimOut(a, M[0], false);
}
const ESTACA = [estacaSprite(0, 26511), estacaSprite(1, 26512), estacaSprite(2, 26513)];
/* a fonte de bolhas: uma fenda de rocha no chão com a borda de cristal de sal (as bolhas são ao vivo) */
function fonteSprite(s) {
  const a = spr(), R = DRM.rocha, B = DRM.bolha;
  for (let y = 8; y < 12; y++) for (let x = 0; x < 12; x++) { const dx = Math.abs(x + 0.5 - 6); if (dx > 6 - (11 - y) * 0.9) continue; a.put(x, y, R, dx < 1.6 && y < 10 ? 0.5 : 3.2 - (x - 6) * 0.2 + cg(x, y, s) * 0.5); }
  for (const x of [4, 7]) a.put(x, 8, B, 5.4);
  return rimOut(a, R[0], false);
}
const FONTE = [fonteSprite(26521)];
/* a Onda Parada: a parede de água em pé (sólida mas vazada; a parede aparece entre os fios de espuma) */
function barreiraSprite(k) {
  const a = spr(), B = DRM.bolha;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const w = Math.sin((x + k * 3) * 0.8 + (y + k * 5) * 0.35); if (w > 0.55) pp(a, x, y, B[w > 0.9 ? 5 : 3]); else if ((x * 7 + y * 3 + k) % 11 === 0) pp(a, x, y, B[6]); }
  return a;
}
const BARREIRA = [barreiraSprite(0), barreiraSprite(1)];

DECO[MS_ALGA] = ALGA; DECO[MS_ANEMONA] = ANEMONA; DECO[MS_CONCHA] = CONCHA; DECO[MS_CORRENTE] = CORRENTE; DECO[MS_CORDAME] = CORDAME; DECO[MS_LANTERNA] = LANTERNA;
DECO[MS_ESTALAC] = ESTALAC; DECO[MS_VERMES] = VERMES; DECO[MS_ESPINHA] = ESPINHA; DECO[MS_MEXILHAO] = MEXILHAO; DECO[MS_RESPIRO] = RESPIRO; DECO[MS_ESTACA] = ESTACA; DECO[MS_FONTE] = FONTE;
DECO[MS_BARREIRA] = BARREIRA; MAT[MS_BARREIRA] = [PALS.msBarreira, BKV.barreira]; SOLID[MS_BARREIRA] = 1; BLOCKY[MS_BARREIRA] = 0; SEETHRU[MS_BARREIRA] = 1; DIG[MS_BARREIRA] = 0; PCOL[MS_BARREIRA] = '#8ac4dc'; EMIT[MS_BARREIRA] = 0.4;
const MS_DECO = [
  // id, dureza, cor no mapa, o que solta
  [MS_ALGA, 0.05, '#36703e', null], [MS_ANEMONA, 0.05, '#d85a8a', null], [MS_CONCHA, 0.1, '#5cbcb0', null], [MS_CORRENTE, 0.6, '#5a5452', null], [MS_CORDAME, 0.2, '#8c744c', null],
  [MS_LANTERNA, 0.12, '#b4d83a', null], [MS_ESTALAC, 0.4, '#3a5664', null], [MS_VERMES, 0.05, '#d83a2a', null], [MS_ESPINHA, 0.05, '#b8ae98', null], [MS_MEXILHAO, 0.1, '#2c3a4c', null],
  [MS_RESPIRO, 0.6, '#6a4818', null], [MS_ESTACA, 0.8, '#4c3420', 'tabua_casco'], [MS_FONTE, 0, '#4a90b0', null]
];
for (const [t, dig, col, drop] of MS_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[MS_ANEMONA] = 0.4; EMIT[MS_CONCHA] = 0.45; EMIT[MS_LANTERNA] = 0.9; EMIT[MS_RESPIRO] = 0.5; EMIT[MS_FONTE] = 0.18; EMIT[MS_VERMES] = 0.05; EMIT[MS_ALGA] = 0.02; EMIT[MS_ESTALAC] = 0.02;
// o que cai quando o apoio some (56, 87); cordame, corrente e estaca ficam (atravessam vãos)
for (const t of [MS_LANTERNA, MS_ESTALAC, MS_MEXILHAO]) CV_HANGS[t] = 1;
for (const t of [MS_ANEMONA, MS_CONCHA, MS_VERMES, MS_ESPINHA, MS_RESPIRO, MS_FONTE, MS_ALGA]) CV_STANDS[t] = 1;

const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[MS_ALGA] = (gx, gy, arr) => arr[gy & 1];
DECO_PICK[MS_ANEMONA] = (gx, gy, arr) => arr[vr(gx, gy, 26411, 3)];
DECO_PICK[MS_CONCHA] = (gx, gy, arr) => arr[vr(gx, gy, 26421, 3)];
DECO_PICK[MS_CORDAME] = (gx, gy, arr) => tileAt(gx, gy - 1) !== MS_CORDAME ? arr[1] : tileAt(gx, gy + 1) !== MS_CORDAME ? arr[2] : arr[0];
const estV = (gx, gy) => vr(gx, gy, 26461, 2);
DECO_PICK[MS_ESTALAC] = (gx, gy, arr) => arr[estV(gx, gy)];
const verV = (gx, gy) => vr(gx, gy, 26471, 2);
DECO_PICK[MS_VERMES] = (gx, gy, arr) => arr[verV(gx, gy)];
DECO_PICK[MS_ESPINHA] = (gx, gy, arr) => arr[vr(gx, gy, 26481, 2)];
DECO_PICK[MS_MEXILHAO] = (gx, gy, arr) => arr[vr(gx, gy, 26491, 2)];
DECO_PICK[MS_ESTACA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== MS_ESTACA ? arr[0] : tileAt(gx, gy - 1) !== MS_ESTACA ? arr[2] : arr[1];
DECO_PICK[MS_BARREIRA] = (gx, gy, arr) => arr[(gx + gy) & 1];

// o cordame e a corrente de âncora se escalam como a corrente da catedral (também debaixo da água); o cordame também
// conta como a escada da mina (a pose de subir, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, MS_CORDAME) || _tt(e, MS_CORRENTE))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, MS_CORDAME)); }; }

/* ================= ao vivo ================= */
const MS_GL = {};
const msGlow = (k, r, col) => MS_GL[k] || (MS_GL[k] = glow(r, col));
const msOut = cy => cy + VH < (MS_S0 - 6) * T || cy > (MS_S0 + MS_D + 6) * T;
/* a alga balança: a fita sobe do pé, cada bloco de alga um trecho dela, ondulando com a corrente. Só as que estão
   na tela, e só quando a câmera está no mar (o vetor de blocos é lido direto) */
const ALG_C = ['#061410', '#0c2418', '#163a24', '#225430', '#36703e', '#548c4a', '#80aa66'];
function algaCor(i) { return ALG_C[Math.max(0, Math.min(6, i))]; }
HOOK.drawWorld.push((cx, cy) => {
  if (msOut(cy) || !tiles.length) return;
  const x0 = Math.floor(cx / T) - 1, x1 = Math.floor((cx + VW) / T) + 1, y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(WH - 1, Math.floor((cy + VH) / T) + 1), tm = gameTime;
  for (let gx = x0; gx <= x1; gx++) {
    const wx = wrapX(gx);
    for (let gy = y0; gy <= y1; gy++) {
      if (tiles[gy * WW + wx] !== MS_ALGA) continue;
      let base = gy; while (base < WH - 1 && tiles[(base + 1) * WW + wx] === MS_ALGA) base++;   // o pé desta fita
      let top = gy; while (top > 0 && tiles[(top - 1) * WW + wx] === MS_ALGA) top--;
      const H = (base - top + 1) * T, ph0 = hash2(wx, base, 26601) * 6.28, X0 = gx * T - cx, Yb = (base + 1) * T - cy;
      for (const [off, w, sh] of [[3, 2, 0], [7, 2, 1.7]]) {
        for (let p = 4; p < H; p++) {
          const k = p / H, sway = Math.sin(tm * 1.1 + ph0 + p * 0.07 + sh) * k * k * 8 + Math.sin(tm * 2.3 + p * 0.21 + sh) * k * 1.2;
          const X = Math.round(X0 + off + sway), Y = Yb - p; if (Y < -2 || Y > VH + 2) continue;
          lc.fillStyle = algaCor(2 + ((p >> 2) & 1) + (k > 0.6 ? 1 : 0)); lc.fillRect(X, Y, w, 1);
          lc.fillStyle = algaCor(5); lc.fillRect(X, Y, 1, 1);
          if ((p + off) % 9 === 0) { lc.fillStyle = algaCor(4); lc.fillRect(X + (p & 1 ? 2 : -2), Y, 2, 1); }   // uma folha saindo
        }
      }
      gy = base;
    }
  }
});
const VER_TIP = VER_P;
HOOK.drawGlow.push((cx, cy) => {
  if (msOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < MS_AREIA || t > MS_O_ORICALCO_S) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case MS_LANTERNA: { const f = 0.9 + Math.sin(tm * 10 + gx) * 0.05 + Math.sin(tm * 21 + gy) * 0.04; lc.globalAlpha = 0.3 * f; lc.drawImage(msGlow('lb', 34, '#c8e05a'), x + LTN_F[0] - 34, y + LTN_F[1] - 34); lc.globalAlpha = 0.45 * f; lc.drawImage(msGlow('ls', 9, '#f0ffa0'), x + LTN_F[0] - 9, y + LTN_F[1] - 9); break; }
      case MS_ANEMONA: lc.globalAlpha = 0.18 + Math.sin(tm * 1.3 + gx * 0.9 + gy) * 0.07; lc.drawImage(msGlow('a14', 14, MS_COL.rosa), x + 6 - 14, y + 5 - 14); break;
      case MS_CONCHA: lc.globalAlpha = 0.2 + Math.sin(tm * 0.9 + gx * 1.3) * 0.08; lc.drawImage(msGlow('c14', 14, MS_COL.ciano), x + 6 - 14, y + 8 - 14); break;
      case MS_RESPIRO: { const f = 0.85 + Math.sin(tm * 7 + gx) * 0.1; lc.globalAlpha = 0.3 * f; lc.drawImage(msGlow('r22', 22, MS_COL.laranja), x + 6 - 22, y + 4 - 22); break; }
      case MS_FONTE: lc.globalAlpha = 0.12; lc.drawImage(msGlow('f10', 10, '#8ac4dc'), x + 6 - 10, y + 8 - 10); break;
      case MS_CORAL: if ((gx * 3 + gy * 5) % 5) break; lc.globalAlpha = 0.07 + Math.max(0, Math.sin(tm * 0.8 + gx + gy * 1.3)) * 0.06; lc.drawImage(msGlow('k10', 10, '#ff9a8a'), x + 6 - 10, y + 6 - 10); break;
      case MS_SULFETO: if ((gx + gy * 3) % 6) break; lc.globalAlpha = 0.07 + Math.sin(tm * 1.7 + gx) * 0.03; lc.drawImage(msGlow('s10', 10, MS_COL.laranja), x + 6 - 10, y + 6 - 10); break;
      case MS_O_ORICALCO: case MS_O_ORICALCO_S: lc.globalAlpha = 0.1 + Math.max(0, Math.sin(tm * 1.6 + gx * 1.7 + gy)) * 0.07; lc.drawImage(msGlow('o12', 12, MS_COL.oricalco), x + 6 - 12, y + 6 - 12); break;
      case MS_VERMES: lc.globalAlpha = 0.08; lc.drawImage(msGlow('v8', 8, '#ff6a4a'), x + 6 - 8, y + 3 - 8); break;
      case MS_BARREIRA: lc.globalAlpha = 0.14 + Math.sin(tm * 3 + gy * 0.7) * 0.05; lc.drawImage(msGlow('b14', 14, MS_COL.espuma), x + 6 - 14, y + 6 - 14); break;
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (msOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < MS_AREIA || t > MS_O_ORICALCO_S) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case MS_LANTERNA: { const f = Math.floor(tm * 8 + gx * 3) % 4, fx = x + LTN_F[0], fy = y + LTN_F[1]; lc.fillStyle = '#f8ffc0'; lc.fillRect(fx - 1, fy - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#d8f070'; lc.fillRect(fx - 1 + (f === 2 ? 1 : f === 3 ? -1 : 0), fy - 2, 1, 1); break; }
      case MS_ANEMONA: {   // as pontas dos tentáculos pulsam
        const p = 0.5 + Math.sin(tm * 1.3 + gx * 0.9 + gy) * 0.5; if (p < 0.5) break;
        lc.globalAlpha = (p - 0.5) * 2; lc.fillStyle = '#ffd0e0';
        for (let k = 0; k < 7; k += 2) { const ang = -1.25 + k * (2.5 / 6), L = 6; lc.fillRect(x + Math.round(6 + Math.sin(ang) * L), y + Math.round(9.6 - Math.cos(ang) * L), 1, 1); }
        lc.globalAlpha = 1; break;
      }
      case MS_ESTALAC: case MS_FONTE: case MS_RESPIRO: break;   // desenhados abaixo, fora do laço dos que brilham
      case MS_VERMES: {   // as plumas abrem e fecham
        const o = Math.sin(tm * 0.7 + hash2(wrapX(gx), gy, 26602) * 9); if (o < 0) break;
        lc.fillStyle = '#ff6a4a';
        for (const [tx, ty] of VER_TIP) { const X = x + (verV(gx, gy) ? 11 - tx : tx), Y = y + ty; lc.fillRect(X - 1, Y - Math.round(o * 2), 1, Math.round(o * 2) + 1); lc.fillRect(X + 1, Y - Math.round(o * 2), 1, Math.round(o * 2) + 1); lc.fillStyle = '#ffb090'; lc.fillRect(X, Y - Math.round(o * 2.5), 1, 1); lc.fillStyle = '#ff6a4a'; }
        break;
      }
      case MS_O_ORICALCO: case MS_O_ORICALCO_S: {   // de vez em quando uma faísca dourada na face lisa
        const ph0 = (tm * 0.3 + hash2(wrapX(gx), gy, 26603) * 7) % 1; if (ph0 > 0.07) break;
        const tp = oriTip(gx, gy, t); if (!tp) break;
        lc.fillStyle = '#fffbd0'; lc.fillRect(x + tp[0], y + tp[1] - 1, 1, 3); lc.fillRect(x + tp[0] - 1, y + tp[1], 3, 1);
        break;
      }
    }
  }
});
/* o que se mexe e não é luz (a gota da estalactite, as bolhas da fonte, o vapor do respiro): desenhado no mundo, antes
   da luz; as bolhas e o vapor só nos blocos que o 07 contou como emissores (estão na tela) */
HOOK.drawWorld.push((cx, cy) => {
  if (msOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== MS_ESTALAC && t !== MS_FONTE && t !== MS_RESPIRO) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === MS_ESTALAC) {   // a gota cresce, solta e cai até o chão ou a água
      const ph0 = (tm * 0.25 + hash2(wrapX(gx), gy, 26604)) % 1, gxo = EST_X[estV(gx, gy)];
      if (ph0 < 0.75) { if (ph0 > 0.4) { lc.fillStyle = '#8ac4dc'; lc.fillRect(x + gxo, y + 10, 1, ph0 > 0.6 ? 2 : 1); } }
      else {
        let fl = 1; while (fl < 16 && !solidAt(gx, gy + fl) && !aguaAt(gx, gy + fl)) fl++;
        const f = (ph0 - 0.75) / 0.25, dy = 10 + f * f * (fl * T - 10);
        lc.fillStyle = '#4a90b0'; lc.fillRect(x + gxo, y + dy, 1, 2); lc.fillStyle = '#e0f4ff'; lc.fillRect(x + gxo, y + dy + 1, 1, 1);
      }
    } else if (t === MS_FONTE) {   // um colar de bolhas subindo, balançando
      for (let k = 0; k < 4; k++) {
        const ph0 = (tm * 0.5 + k * 0.25 + hash2(wrapX(gx), gy, 26605)) % 1, Y = y + 8 - ph0 * 60, X = x + 5 + Math.round(Math.sin(tm * 3 + k * 2 + ph0 * 8) * 2);
        if (!aguaAt(gx, Math.floor((Y + cy) / T))) continue;
        const r = ph0 > 0.5 ? 2 : 1; lc.globalAlpha = 0.8; lc.fillStyle = '#c8ecf8'; lc.fillRect(X, Y, r, r); lc.fillStyle = '#ffffff'; lc.fillRect(X, Y, 1, 1);
      }
      lc.globalAlpha = 1;
    } else {   // o vapor: bolinhas cinza subindo e abrindo
      for (let k = 0; k < 5; k++) {
        const ph0 = (tm * 0.6 + k * 0.2 + hash2(wrapX(gx), gy, 26606)) % 1, Y = y + 4 - ph0 * 40, X = x + 6 + Math.round(Math.sin(tm * 2 + k * 1.7) * (1 + ph0 * 4)), r = 1 + Math.round(ph0 * 3);
        lc.globalAlpha = 0.5 * (1 - ph0); lc.fillStyle = '#c8b8a8'; lc.fillRect(X - (r >> 1), Y - (r >> 1), r, r);
      }
      lc.globalAlpha = 1;
    }
  }
});

Object.assign(MSART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, pp, wrapT, W2, RX, DRM, BKV, CIANO, BRASA, WET, SHELL, ORI_HEX, msGlow, msOut, vAreia, vRocha, vCasco, vConves, vTemplo, vCoral, vRecife });
}
