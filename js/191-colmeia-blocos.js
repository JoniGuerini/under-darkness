'use strict';

/* ================= a Colmeia: blocos, paredes, terceira camada, minérios, decoração =================
   Uma colmeia que engoliu os salões de baixo dos anões: cera velha em camadas finas, amarelo-marrom e cheia de
   bolsinhas; cera nova pálida e mole, mastigada em grumos; favos vazios com os hexágonos escuros por dentro e os
   cheios de mel, que brilham; a resina vermelho-âmbar, dura e vidrada, escorrida em fios; o âmbar translúcido com
   pó preso dentro (e, num bloco em doze, um bichinho ou um osso); a pedra lavrada dos anões com cera inchando nas
   juntas; a cera real dourado-rosada do Berçário, morna, em dobras; as placas de quitina preto-esverdeadas da esfera
   da Rainha; os cachos de ovos colados; o favo real de alvéolos grandes, tampados; o lacre real, que não quebra; o pó
   de cera dos funis da formiga-leão.
   Como o 131 e o 121, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda
   acesa, sombra e oclusão vêm do 07. Paredes e terceira camada só leem o tom (.v), sem cor de destaque. A decoração
   de 1 bloco (mel pingando, estalactite de resina em corrente, escada de favos e fio de cera que se escalam, larva
   luminosa, casulo, ossos de anão com elmo, poça de mel, bolha de resina, asa caída, lanterna anã, coluna de cera do
   chão ao teto) são sprites de 12x12 em rampas com luz de cima à esquerda; a gota que cai, a larva que se mexe e o
   brilho do âmbar são desenhados ao vivo. Ids: 190-colmeia-api. */
const CMART = {};   // ferramentas para 192-colmeia-objetos, os insetos (193, 194) e a Rainha (196)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro (seção 12 da ficha) ---- */
pal('cmCera', ['#2a1c0c', '#4a3416', '#6e5022', '#94702e', '#b8923e', '#d8b45a']);
pal('cmCeraNova', ['#5a4618', '#8a6e28', '#b8963a', '#d8b850', '#ecd27a', '#fae8a8']);
pal('cmFavo', ['#3a1e04', '#6a3a08', '#a0600e', '#d08a1a', '#f0b030', '#ffd870']);
pal('cmResina', ['#1e0a06', '#3e160a', '#64260e', '#8a3c14', '#b05a1e', '#d07e34']);
pal('cmAmbar', ['#4a2006', '#7a3a0a', '#b0600e', '#d88a1c', '#f4b03a', '#ffd878']);
pal('cmCeraReal', ['#3a2018', '#64382a', '#8e5a40', '#b8825a', '#dcae80', '#f4d6a8']);
pal('cmQuitina', ['#0c120e', '#1a2620', '#2a3e32', '#3e5a48', '#5a7e64', '#8aac8e']);
pal('cmPedra', ['#1c1e24', '#2c3038', '#3e444e', '#525a66', '#6a7480', '#8a94a0']);   // a pedra anã de cima, cinza-azulada
pal('cmOvo', ['#4a2e22', '#7a5440', '#a8806a', '#cca88e', '#e6ccb0', '#f8ead6']);
pal('cmLacre', ['#2a0e06', '#4e1a0a', '#7a2c10', '#a8461a', '#cc6a2a', '#e8963e']);
pal('cmPo', ['#3a2a12', '#5a441e', '#7c602c', '#9a7c3c', '#b6984e', '#d0b468']);
// paredes de fundo: sempre bem mais escuras que o chão da frente
pal('cmPedraW', ['#08090b', '#0d0e11', '#121418', '#17191e', '#1c1f25', '#22262c']);
pal('cmCeraW', ['#0c0804', '#120c06', '#181008', '#1e150a', '#251a0d', '#2c2010']);
pal('cmFavoW', ['#0a0602', '#100903', '#160c04', '#1c1006', '#231408', '#2a190a']);
pal('cmResinaW', ['#0a0403', '#0f0604', '#150806', '#1b0b07', '#210e09', '#28110b']);
pal('cmRealW', ['#0e0806', '#140b09', '#1a0f0c', '#21130f', '#281813', '#301c17']);
// a terceira camada: favos gigantes ao longe, paredes de âmbar com sombras de bichos, salões anões afogados em cera
pal('dpCmFavos', ['#050302', '#080503', '#0c0704', '#110a05', '#160d07', '#1c1009']);
pal('dpCmAmbar', ['#060201', '#0a0402', '#100603', '#160904', '#1e0c05', '#3a1c08']);
pal('dpCmFortaleza', ['#040405', '#070709', '#0b0b0e', '#0f1013', '#141519', '#191b20']);

const wrapT = v => ((v % TP) + TP) % TP;
const RX = hexes => hexes.map(h => ph(h));
const MEL = RX(['#5a2a04', '#8a4808', '#c0700e', '#e8981e', '#ffc040', '#ffe08a', '#fff4c8']);       // mel: corpo e brilho
const AMB = RX(['#5a2806', '#8a4410', '#b8661a', '#e08c28', '#f8b448', '#ffd884', '#fff0c0']);
const RESV = RX(['#2a0c06', '#4a180a', '#702a10', '#98401a', '#c06028', '#e08840', '#f8b468']);      // brilho da resina
const LARV = RX(['#6a5440', '#9a8068', '#c8ac90', '#e4ccb0', '#f4e2ca']);                          // larva cor de cera-real
const INSE = RX(['#0a0806', '#16120c', '#241e14', '#342c1e', '#4a3e2a']);                          // bicho preso no âmbar
const OSSO = RX(['#3a3226', '#5e5240', '#8a7c62', '#b4a68a', '#d8ccb0']);
const CERAJ = RX(['#4a3416', '#6e5022', '#94702e', '#b8923e', '#d8b45a']);                         // cera escorrida nas juntas
const QUIG = RX(['#3e5a48', '#5a7e64', '#8aac8e', '#c0dcc0']);                                     // reflexo da quitina

/* ---- a grade de hexágonos: centros numa grade deslocada (passo sw na linha, sh entre linhas, linhas ímpares
   deslocadas meio passo), a célula é a mais perto (Voronoi com o y achatado vira hexágono) ---- */
function hexGrid(sw, sh, s) {
  const NX = TP / sw, NY = TP / sh;
  return (x, y) => {
    const r0 = Math.floor(y / sh); let d1 = 1e9, d2 = 1e9, cxB = 0, cyB = 0, id = 0;
    for (let r = r0 - 1; r <= r0 + 1; r++) {
      const off = (((r % NY) + NY) % NY) & 1 ? sw / 2 : 0, c0 = Math.floor((x - off) / sw);
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        const px = c * sw + off + sw / 2, py = r * sh + sh / 2, dx = x + 0.5 - px, dy = (y + 0.5 - py) * 1.12, d = Math.hypot(dx, dy);
        if (d < d1) { d2 = d1; d1 = d; cxB = dx; cyB = dy; id = hash2(((c % NX) + NX) % NX, ((r % NY) + NY) % NY, s); } else if (d < d2) d2 = d;
      }
    }
    return { e: (d2 - d1) / 2, ox: cxB, oy: cyB, id, d: d1 };   // e: distância até a borda da célula
  };
}
// fiadas de pedra lavrada (o mesmo do 131): linhas de rh px, juntas em encaixes de sw px
function courses(rh, sw, prob, s) {
  const R = TP / rh, N = TP / sw, J = [];
  for (let r = 0; r < R; r++) { const a = new Uint8Array(N); let last = -9; for (let k = 0; k < N; k++) if (hash2(k, r, s) < prob && k - last > 1) { a[k] = 1; last = k; } if (!a.some(v => v)) a[0] = 1; if (a[0] && a[N - 1]) a[N - 1] = 0; J.push(a); }
  return (x, y) => {
    const xx = wrapT(x), yy = wrapT(y), row = Math.floor(yy / rh), ly = yy % rh, a = J[row], k = Math.floor(xx / sw);
    let k0 = k; while (!a[((k0 % N) + N) % N]) k0--;
    let k1 = k + 1; while (!a[((k1 % N) + N) % N]) k1++;
    return { row, ly, lx: xx - k0 * sw, w: (k1 - k0) * sw, id: hash2(((k0 % N) + N) % N, row, s + 1) };
  };
}

/* ---- o chão sólido ---- */
function vCera(x, y) {   // cera velha: camadas finas onduladas, cada uma de um tom, bolsinhas escuras, um grão de pólen
  const wv = y + cn(x, y, 40, 8, 19101) * 6 + Math.sin(x * Math.PI * 2 * 6 / TP + cn(x, y, 24, 24, 19102) * 3) * 1.4;
  const lay = Math.floor(wv / 3), ly = ((wv % 3) + 3) % 3;
  let v = 2.4 + (hash2(lay, 0, 19103) - 0.5) * 1.3 + cn(x, y, 60, 60, 19104) * 0.8 + cg(x, y, 19105) * 0.5;
  if (ly < 0.7) v += 0.7; else if (ly > 2.4) v -= 0.6;                                         // o lábio de cada camada pega a luz
  const c = cells(x, y, 9, 19106, 1.6);
  if (c.id < 0.16 && c.d1 < 1.6) return c.oy < -0.4 ? 0.3 : 0.8;                               // bolsinha de ar
  if (c.id < 0.16 && c.d1 < 2.4 && c.oy > 0) v += 0.8;                                         // a borda de baixo da bolsinha acesa
  if (hash2(x, y, 19107) < 0.004) { MATX = MEL[4]; return -9; }                               // pólen
  if (hash2(x, y, 19108) < 0.03) v -= 1;
  return v;
}
function vCeraNova(x, y) {   // cera nova: grumos mastigados e colados, macia, quase sem sombra, marcas de mandíbula
  const c = cells(x, y, 7, 19111, 1.2);
  let v = 3.0 - c.d1 * 0.22 + (c.id - 0.5) * 0.8 + cn(x, y, 30, 30, 19112) * 0.5 + cg(x, y, 19113) * 0.35;
  if (c.d2 - c.d1 < 0.9) v = 1.6 + cg(x, y, 19114) * 0.4;                                      // a costura entre dois grumos
  else if (c.ox < -1.2 && c.oy < -1) v += 0.9;                                                 // o alto de cada grumo, aceso
  else if (c.ox > 1.5 && c.oy > 1.2) v -= 0.6;
  if (c.id > 0.86 && Math.abs(c.ox + c.oy * 0.6) < 0.5 && c.d1 < 2.6) v -= 1.1;                // marca de mandíbula
  return v;
}
const HEXF = hexGrid(8, 6, 19121);
function vFavo(x, y) {   // favo vazio: paredes de cera clara entre alvéolos escuros, o fundo do alvéolo em sombra de cima
  const h = HEXF(x, y);
  if (h.e < 0.8) return 4.2 + cg(x, y, 19122) * 0.4 + (h.oy < 0 ? 0.3 : -0.2);                 // a parede fina, acesa
  if (h.e < 1.4) return 3.1 + (h.oy < 0 ? -0.6 : 0.5);                                         // o chanfro da parede
  // dentro: escuro, a borda de cima faz sombra, o fundo de baixo pega reflexo
  let v = 0.9 + (h.oy > 1 ? 0.9 : 0) + (h.ox > 1.2 ? 0.3 : 0) + cg(x, y, 19123) * 0.3;
  if (h.id < 0.12) v += 0.8;                                                                    // um alvéolo com resto de cera
  return v;
}
function vFavoMel(x, y) {   // favo de mel: os alvéolos cheios, o mel com um brilho no alto à esquerda, alguns tampados de cera
  const h = HEXF(x, y);
  if (h.e < 0.8) return 4.4 + cg(x, y, 19131) * 0.4;
  if (h.e < 1.3) return 3.2 + (h.oy < 0 ? -0.5 : 0.4);
  if (h.id < 0.18) return 3.6 - h.d * 0.25 + (h.ox < -0.5 && h.oy < -0.5 ? 0.9 : 0) + cg(x, y, 19132) * 0.3;   // tampado
  const l = 3.4 - (h.ox + h.oy) * 0.35 - h.d * 0.18 + cg(x, y, 19133) * 0.3;
  MATX = (h.ox > -2.2 && h.ox < -0.8 && h.oy > -2 && h.oy < -0.6) ? MEL[6] : MEL[Math.max(1, Math.min(5, Math.round(l)))];
  return -9;
}
function vResina(x, y) {   // resina: escura e vidrada, escorrida em fios verticais, bolhas presas, um reflexo longo e frio
  const sx = x + cn(x, y, 30, 6, 19141) * 14, run = ((sx % 9) + 9) % 9;
  let v = 2.1 + cn(x, y, 50, 120, 19142) * 1.2 + cg(x, y, 19143) * 0.3;
  if (run < 1.2) v += 1.0; else if (run > 7.5) v -= 0.7;                                       // os fios escorridos
  const c = cells(x, y, 10, 19144, 1);
  if (c.id < 0.22 && c.d1 < 1.8) { MATX = RESV[c.ox < 0 && c.oy < 0 ? 5 : c.d1 < 1 ? 3 : 4]; return -9; }   // bolha presa, acesa por dentro
  if (c.id < 0.22 && c.d1 < 2.3) v -= 0.8;
  const sh = cn(x, y, 80, 16, 19145); if (sh > 0.28 && run < 3) { MATX = RESV[5]; return -9; }   // o reflexo vidrado
  return v;
}
function vAmbar(x, y) {   // âmbar: claro e fundo ao mesmo tempo, nuvens de pó presas, fissuras que brilham, a luz de dentro
  let l = 3.2 + cn(x, y, 40, 40, 19151) * 1.3 + cn(x, y, 12, 12, 19152) * 0.4;
  const fis = Math.abs(cn(x, y, 28, 28, 19153)); if (fis < 0.012) l += 1.6;                    // fissura acesa
  if (cn(x, y, 20, 20, 19154) > 0.3) l -= 0.9;                                                 // pó preso, uma nuvem escura funda
  if (hash2(x, y, 19155) < 0.01) l -= 1.6;                                                     // um grão
  const t = wrapT(y) % 12, s = wrapT(x) % 12; if (t + s < 3 && hash2(Math.floor(x / 12), Math.floor(y / 12), 19156) < 0.4) l += 1.2;   // brilho no canto aceso
  MATX = AMB[Math.max(0, Math.min(6, Math.round(l)))]; return -9;
}
// um bichinho ou um osso preso no meio de cada bloco do âmbar com fóssil (a textura é alinhada ao bloco: 240 = 20 x 12)
function vAmbarFossil(x, y) {
  const r = vAmbar(x, y), gx = Math.floor(wrapT(x) / 12), gy = Math.floor(wrapT(y) / 12), lx = wrapT(x) % 12 - 5.5, ly = wrapT(y) % 12 - 5.5, k = hash2(gx, gy, 19161);
  const a = k * 6.28, ca = Math.cos(a), sa = Math.sin(a), u = lx * ca + ly * sa, w = -lx * sa + ly * ca;
  if (k < 0.55) {   // um inseto: corpo em 3 gomos, patinhas
    const body = (u * u) / 9 + (w * w) / 1.6 < 1 || ((u - 3.2) ** 2) / 1.4 + (w * w) / 1.2 < 1;
    const leg = Math.abs(w) < 3 && Math.abs(w) > 1 && (Math.abs(u + 1) < 0.5 || Math.abs(u - 1) < 0.5);
    const wing = k < 0.3 && w < -0.5 && w > -3.4 && u > -2 && u < 2.5;
    if (body) { MATX = INSE[u < 0 && w < 0 ? 3 : 1]; return -9; }
    if (leg) { MATX = INSE[0]; return -9; }
    if (wing) { MATX = AMB[5]; return -9; }
  } else {          // um ossinho
    if (Math.abs(w) < 0.8 && Math.abs(u) < 4 || ((Math.abs(u) - 3.8) ** 2 + (Math.abs(w) - 0.7) ** 2) < 1.1) { MATX = OSSO[w < 0 ? 4 : 2]; return -9; }
  }
  return r;
}
const dwarf = courses(6, 6, 0.32, 19171);
function vPedraTomada(x, y) {   // pedra anã lavrada em fiadas retas, cera escorrendo das juntas e inchando nos cantos
  const c = dwarf(x, y), { ly, lx, w } = c;
  const wax = cn(x, y, 30, 30, 19172) + (c.id - 0.5) * 0.3;
  if (ly === 5 || lx === 0) { if (wax > -0.05) { MATX = CERAJ[ly === 5 ? 2 : 1]; return -9; } return 0.5; }   // a junta, cheia de cera
  if (wax > 0.18 && (ly < 2 || lx < 2)) { MATX = CERAJ[ly === 0 ? 4 : 3]; return -9; }        // a cera inchando pela beira
  if (wax > 0.25 && ly > 3) { const d = Math.floor(cn(x, 0, 60, 4, 19173) * 9 + 4); if (lx % 7 === ((d % 7) + 7) % 7) { MATX = CERAJ[2]; return -9; } }   // um fio escorrido
  let v = 3.0 + (c.id - 0.5) * 0.9 + cn(x, y, 36, 36, 19174) * 0.6 + cg(x, y, 19175) * 0.35;
  if (ly === 0) v += 1.0; else if (ly === 4) v -= 0.8;
  if (lx === 1) v += 0.4; else if (lx === w - 1) v -= 0.6;
  if (hash2(Math.floor(wrapT(x) / 6), c.row, 19176) < 0.08 && lx > 1 && lx < w - 1 && ly === 2) v += 0.9;   // uma runa riscada, apagada
  return v;
}
function vCeraReal(x, y) {   // cera real: dobras largas e macias, como cera morna escorrida em lençóis, poros finos
  const fx = y * 0.9 + cn(x, y, 60, 30, 19181) * 16, fold = ((fx % 7) + 7) % 7;
  let v = 2.9 + cn(x, y, 80, 80, 19183) * 0.6 + cg(x, y, 19184) * 0.3;
  if (fold < 1.2) v += 0.8; else if (fold > 5.8) v -= 0.7;                                    // o lábio de cada dobra, aceso; a sombra debaixo
  if (hash2(x, y, 19185) < 0.03) v -= 0.8;
  if (hash2(x >> 1, y >> 1, 19186) < 0.004) v += 1.4;
  return v;
}
const PLAC = hexGrid(12, 10, 19191);
function vQuitina(x, y) {   // placas de quitina: escamas grandes sobrepostas, cada uma com um reflexo frio no alto
  const h = PLAC(x, y);
  if (h.e < 0.9) return 0.4;
  let v = 2.2 + (h.id - 0.5) * 0.8 - h.oy * 0.18 + cg(x, y, 19192) * 0.3;
  if (h.oy > 2.6) v -= 0.9;                                                                     // a borda de baixo some debaixo da placa seguinte
  if (h.oy < -1.5 && h.oy > -3.2 && Math.abs(h.ox + 1) < 2.2) { MATX = QUIG[h.id < 0.5 ? 1 : 2]; return -9; }
  return v;
}
const OVOS = hexGrid(6, 10, 19201);
function vOvo(x, y) {   // ovos colados: ovais cor de creme em pé, apertados uns nos outros, com a gosma escura entre eles
  const h = OVOS(x, y), ex = h.ox / 3.1, ey = h.oy / 4.4, d = Math.hypot(ex, ey);
  if (d > 1) return 0.5 + cg(x, y, 19202) * 0.3;                                               // a gosma entre os ovos
  if (d > 0.82 && h.oy > 0) return 1.6;                                                         // a sombra embaixo de cada ovo
  let v = 3.8 - ex * 0.9 - ey * 1.1 + cg(x, y, 19203) * 0.25;
  if (ex < -0.2 && ex > -0.6 && ey < -0.3 && ey > -0.75) v = 5.3;                               // o brilho úmido
  if (h.id < 0.2 && d < 0.45) v = 2.2;                                                          // uma sombra dentro (algo se mexe)
  return v;
}
const HEXR = hexGrid(12, 10, 19211);
function vFavoReal(x, y) {   // favo real: alvéolos grandes de cera real, a maioria tampados com uma cúpula, alguns abertos com a larva
  const h = HEXR(x, y);
  if (h.e < 1) return 4.4 + cg(x, y, 19212) * 0.3;
  if (h.e < 1.8) return 3.0 + (h.oy < 0 ? -0.7 : 0.6);
  if (h.id < 0.25) {   // aberto: a larva enrolada lá dentro
    const r = Math.hypot(h.ox + 0.3, h.oy * 1.1);
    if (r < 2.6 && r > 0.8) { MATX = LARV[Math.max(0, Math.min(4, Math.round(3 - (h.ox + h.oy) * 0.4)))]; return -9; }
    return 0.8 + (h.oy > 1 ? 0.8 : 0);
  }
  return 3.4 - h.d * 0.28 - (h.ox + h.oy) * 0.25 + (h.ox < -1 && h.oy < -1 && h.d < 3 ? 1.2 : 0) + cg(x, y, 19213) * 0.25;
}
function vLacre(x, y) {   // o lacre real: cera vermelha-escura derramada em ondas, um selo de favo gravado, duro
  const h = HEXR(x + 6, y + 5);
  let v = 2.4 + Math.sin(y * 0.6 + cn(x, y, 20, 20, 19221) * 8) * 0.6 + cn(x, y, 50, 50, 19222) * 0.6 + cg(x, y, 19223) * 0.25;
  if (h.e < 0.7) v -= 1.1; else if (h.e < 1.3 && h.oy < 0) v += 0.8;
  return v;
}
function vPo(x, y) {   // pó de cera solto: grãos, sem estrutura, um sulco escorrendo para o centro
  let v = 2.6 + cg(x, y, 19231) * 1.6 + cn(x, y, 20, 20, 19232) * 0.8;
  if (hash2(x, y, 19233) < 0.06) v += 1.4;
  return v;
}

/* ---- paredes de fundo ---- */
const vPedraW = vPedraTomada;
function vCeraW(x, y) { return vCera(x, y) - 0.2; }
function vFavoW(x, y) { const h = HEXF(x, y); return h.e < 0.8 ? 3.6 : h.e < 1.4 ? 2.6 : 1.0 + (h.oy > 1 ? 0.8 : 0) + cg(x, y, 19241) * 0.4; }
function vResinaW(x, y) { const r = vResina(x, y); return r === -9 ? 3.4 : r; }
function vRealW(x, y) { return vCeraReal(x, y); }

/* ---- a terceira camada ---- */
function vDpFavos(x, y) {   // favos gigantes ao longe, em duas camadas: hexágonos enormes, os de trás mais apagados
  const A = hexGrid(40, 30, 19251)(x, y), B = hexGrid(24, 20, 19252)(x + 11, y + 7);
  let v = 1.6 + cn(x, y, 40, 40, 19253) * 0.5;
  if (B.e < 1.2) v = 2.4; else if (B.e < 2.2 && B.oy < 0) v = 2.0;
  if (A.e < 1.6) v = 3.4; else if (A.e < 3 && A.oy < 0) v = 2.8; else if (A.e > 3 && A.oy > 6) v += 0.5;
  return v + cg(x, y, 19254) * 0.25;
}
function vDpAmbar(x, y) {   // paredes de âmbar ao longe com sombras de bichos enormes presos (asas, patas), quase sem cor
  let v = 1.8 + cn(x, y, 30, 60, 19261) * 1.0 + cn(x, y, 8, 8, 19262) * 0.3;
  const gx = Math.floor(x / 120), lx = (x % 120) - 60, ly = (y % 120) - 60, k = hash2(gx, Math.floor(y / 120), 19263);
  const body = (lx * lx) / (900 + k * 600) + (ly * ly) / 160 < 1, wing = ly < -6 && ly > -40 && Math.abs(lx + 10) < 30 - ly * 0.3, leg = Math.abs(ly - 10 - Math.abs(lx) * 0.4) < 2 && Math.abs(lx) < 34;
  if (body || leg) v -= 1.2; else if (wing && k < 0.6) v -= 0.6;
  if (hash2(x, y, 19264) < 0.002) v = 5;                                                       // um grão aceso
  return v;
}
function vDpFortaleza(x, y) {   // salões anões afogados em cera: arcos e colunas retas, a cera subindo por baixo
  const lx = x % 60, ly = y % 80, col = lx < 8, arch = ly < 34 && Math.hypot(lx - 34, ly - 34) > 26 && lx >= 8;
  let v = 1.4 + cn(x, y, 50, 50, 19271) * 0.5;
  if (col || arch) v = 2.6 + (lx === 0 || ly === 0 ? 0.6 : 0) + ((ly % 10) === 0 ? -0.5 : 0);
  const wax = 60 - cn(x, y, 30, 10, 19272) * 30; if (ly > wax) v = 2.0 + Math.sin(x * 0.2) * 0.3;   // a cera subindo
  return v + cg(x, y, 19273) * 0.25;
}

/* ---- assar e registrar ---- */
const BKV = {
  cera: bake(vCera), ceraNova: bake(vCeraNova), favo: bake(vFavo), favoMel: bake(vFavoMel), resina: bake(vResina), ambar: bake(vAmbar), fossil: bake(vAmbarFossil),
  pedra: bake(vPedraTomada), ceraReal: bake(vCeraReal), quitina: bake(vQuitina), ovo: bake(vOvo), favoReal: bake(vFavoReal), lacre: bake(vLacre), po: bake(vPo),
  pedraW: bake(vPedraW), ceraW: bake(vCeraW), favoW: bake(vFavoW), resinaW: bake(vResinaW), realW: bake(vRealW),
  dpFavos: bake(vDpFavos), dpAmbar: bake(vDpAmbar), dpFortaleza: bake(vDpFortaleza)
};
const CM_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [CM_CERA, 'cmCera', 'cera', 0.55, '#6e5022'], [CM_CERA_NOVA, 'cmCeraNova', 'ceraNova', 0.15, '#b8963a'], [CM_FAVO, 'cmFavo', 'favo', 0.4, '#a0600e'],
  [CM_FAVO_MEL, 'cmFavo', 'favoMel', 0.45, '#d08a1a'], [CM_RESINA, 'cmResina', 'resina', 1.1, '#64260e'], [CM_AMBAR, 'cmAmbar', 'ambar', 1.0, '#d88a1c'],
  [CM_AMBAR_FOSSIL, 'cmAmbar', 'fossil', 1.0, '#b0600e'], [CM_PEDRA_TOMADA, 'cmPedra', 'pedra', 1.1, '#525a66'], [CM_CERA_REAL, 'cmCeraReal', 'ceraReal', 0.6, '#b8825a'],
  [CM_QUITINA, 'cmQuitina', 'quitina', 2.2, '#2a3e32'], [CM_OVO, 'cmOvo', 'ovo', 0.3, '#c8ae96'], [CM_FAVO_REAL, 'cmCeraReal', 'favoReal', 0.5, '#dcae80'],
  [CM_LACRE, 'cmLacre', 'lacre', 0, '#7a2c10'], [CM_PO_CERA, 'cmPo', 'po', 0.12, '#9a7c3c']
];
for (const [t, p, k, dig, col] of CM_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [CM_CERA, CM_CERA_NOVA, CM_CERA_REAL, CM_PO_CERA]) BLEND[t] = 1;
EMIT[CM_AMBAR] = 0.18; EMIT[CM_AMBAR_FOSSIL] = 0.18; EMIT[CM_FAVO_MEL] = 0.06;

WMAT[WCM_PEDRA] = [PALS.cmPedraW, BKV.pedraW]; WMAT[WCM_CERA] = [PALS.cmCeraW, BKV.ceraW]; WMAT[WCM_FAVO] = [PALS.cmFavoW, BKV.favoW];
WMAT[WCM_RESINA] = [PALS.cmResinaW, BKV.resinaW]; WMAT[WCM_REAL] = [PALS.cmRealW, BKV.realW];
DMAT[DP_CM_FAVOS] = [PALS.dpCmFavos, BKV.dpFavos]; DMAT[DP_CM_AMBAR] = [PALS.dpCmAmbar, BKV.dpAmbar]; DMAT[DP_CM_FORTALEZA] = [PALS.dpCmFortaleza, BKV.dpFortaleza];

/* ---- os minérios: carvão de resina velha, e a ambrita: mel endurecido com brilho dourado fraco, em gotas facetadas ---- */
oreRamp(CM_O_AMBRITA, ['#4a2a08', '#7a4a10', '#b0761c', '#dca032', '#f6c856', '#fff0a8', '#fffbe0']);
ORE_PAINT[CM_O_AMBRITA] = function (L, s) {
  const R = ORE_RAMP[CM_O_AMBRITA], pts = oreNodes(L, s, R, 196, [2.6, 0.8], [1.3, 0.5], 6);
  // o miolo mais escuro: cada gota tem um coração cor de mel queimado
  for (const [x0, y0] of pts) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) { const x = Math.round(x0 + dx), y = Math.round(y0 + dy); if (x >= 1 && y >= 1 && x <= 10 && y <= 10 && L.m[y * 12 + x]) L.put(x, y, R[1], 1.5); }
  // e um ponto de luz no alto da gota maior
  const [px, py] = pts[0]; const x = Math.round(px - 1), y = Math.round(py - 1); if (x >= 1 && y >= 1 && L.m[y * 12 + x]) L.put(x, y, R[6], 9);
};
ORE_HALO[CM_O_AMBRITA] = { pal: ['cmResina', '#c08020', 0.3, 0.12], shade: 0.2 };
ORE_PAINT[CM_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[CM_O_CARVAO] = { pal: ['cmResina', '#020102', 0.5, 0.2], shade: 0 };
MAT[CM_O_CARVAO] = [PALS.cmResina, bakeOre(CM_O_CARVAO, vResina)]; MAT[CM_O_AMBRITA] = [PALS.cmResina, bakeOre(CM_O_AMBRITA, vResina)];
for (const t of [CM_O_CARVAO, CM_O_AMBRITA]) { SOLID[t] = 1; BLOCKY[t] = 1; }
DIG[CM_O_CARVAO] = DIG[COAL]; ORE_XP[CM_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[CM_O_CARVAO] = ORE_NAME[COAL]; PCOL[CM_O_CARVAO] = PCOL[COAL]; ORE_ITEM[CM_O_CARVAO] = ORE_ITEM[COAL];
DIG[CM_O_AMBRITA] = 1.5; ORE_XP[CM_O_AMBRITA] = 19; ORE_NAME[CM_O_AMBRITA] = 'Ambrita'; PCOL[CM_O_AMBRITA] = '#dca032'; ORE_ITEM[CM_O_AMBRITA] = 'min_ambrita';
EMIT[CM_O_AMBRITA] = 0.14;

/* ---- itens de bloco ---- */
// cera_bruta, o material que o Grimaldo compra, também é o bloco da Cera Velha (o 197 define o ícone e o preço)
const CM_ITEMS = {
  cera_bruta: ['Cera Bruta', CM_CERA, 'Cera velha da colmeia, em camadas. O Grimaldo faz molde de fundição com ela; também serve de bloco.'],
  favo: ['Favo Vazio', CM_FAVO, 'Um pedaço de parede de favo, leve e oco. Os hexágonos são perfeitos demais para serem acaso.'],
  resina: ['Resina', CM_RESINA, 'Resina vermelho-escura, dura como vidro. Cheira a pinheiro queimado.'],
  ambar: ['Âmbar', CM_AMBAR, 'Bloco translúcido cor de mel que brilha fraco no escuro. Bom para janela.'],
  pedra_tomada: ['Pedra Tomada', CM_PEDRA_TOMADA, 'Pedra lavrada dos anões, com cera endurecida nas juntas.'],
  cera_real: ['Cera Real', CM_CERA_REAL, 'Cera dourado-rosada do Berçário. Ainda morna.']
};
for (const id in CM_ITEMS) { const [name, block, desc] = CM_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[CM_CERA_NOVA] = 'cera_bruta'; BLOCK_DROP[CM_FAVO_MEL] = 'favo'; BLOCK_DROP[CM_PO_CERA] = 'cera_bruta';
if (ITEMS.ambar_fossil) BLOCK_DROP[CM_AMBAR_FOSSIL] = 'ambar_fossil';
if (ITEMS.quitina) BLOCK_DROP[CM_QUITINA] = 'quitina';
// CM_OVO, CM_FAVO_REAL e CM_LACRE não soltam nada; o favo de mel às vezes solta mel escuro (abaixo)
{ const _bt = breakTile; breakTile = function (tx, ty) {
  const t = tileAt(tx, ty); _bt(tx, ty);
  if (t === CM_FAVO_MEL && ITEMS.mel_escuro && Math.random() < 0.35) dropLoot((tx + 0.5) * T, (ty + 1) * T - 1, 'mel_escuro', 1, true);
}; }

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRM = {
  cera: ['#2a1c0c', '#4a3416', '#6e5022', '#94702e', '#b8923e', '#d8b45a', '#ecd27a'],
  favo: ['#3a1e04', '#6a3a08', '#a0600e', '#d08a1a', '#f0b030', '#ffd870', '#fff0b0'],
  mel: ['#5a2a04', '#8a4808', '#c0700e', '#e8981e', '#ffc040', '#ffe08a', '#fff4c8'],
  resina: ['#1e0a06', '#3e160a', '#64260e', '#8a3c14', '#b05a1e', '#d07e34', '#eca060'],
  real: ['#3a2018', '#64382a', '#8e5a40', '#b8825a', '#dcae80', '#f4d6a8', '#fff0d8'],
  larva: ['#4a3a2a', '#7a644e', '#a88c72', '#ccb094', '#e4ccb0', '#f4e2ca', '#fff6e8'],
  luz: ['#2a3a10', '#4a6418', '#78942a', '#a8c440', '#d0e870', '#ecfcb0', '#ffffe0'],
  osso: ['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#c8bca6', '#dcd2be'],
  ferro: ['#0a0b0d', '#16181c', '#24272c', '#363a40', '#4a5058', '#646c76', '#848c96'],
  bronze: ['#1a1006', '#2e1e0c', '#4a3214', '#6a4a1e', '#8a642a', '#aa8240', '#caa25c'],
  asa: ['#1a1a18', '#2e2e2a', '#4a4a44', '#6e6e64', '#9a9a8c', '#c4c4b4', '#e8e8d8'],
  seda: ['#2a2620', '#4a4438', '#6e6656', '#968c78', '#b8ae98', '#d4cab4', '#ece4d0'],
  chama: ['#5a2a08', '#a8500e', '#e07a1a', '#ffb84a', '#ffd884', '#fff0b0', '#ffffff']
};
for (const k in DRM) DRM[k] = DRM[k].map(h => ph(h));

/* mel pingando do teto: uma mancha de mel grudada, uma gota se formando (a que cai é desenhada ao vivo) */
function gotaSprite(s) {
  const a = spr(), M = DRM.mel;
  for (let x = 2; x <= 9; x++) { const h = 1 + (hash2(x, 0, s) < 0.5 ? 1 : 0) + (x > 3 && x < 8 ? 1 : 0); for (let y = 0; y < h; y++) a.put(x, y, M, 4 - y * 0.7 - (x - 2) * 0.12 + cg(x, y, s) * 0.4); }
  const gx = 4 + (s % 3); for (let y = 2; y < 5 + (s & 1); y++) { a.put(gx, y, M, 3.6 - (y - 2) * 0.3); a.put(gx + 1, y, M, 2.4); }
  a.put(gx, 3, M, 6);
  return rimOut(a, M[0], false);
}
const GOTA = [gotaSprite(19301), gotaSprite(19302)];
/* estalactite de resina: base larga presa no teto, afina em ponta; empilha até 3 (base, meio, ponta) */
function estalacSprite(k, s) {   // 0 base, 1 meio, 2 ponta, 3 base que já é ponta
  const a = spr(), R = DRM.resina, w0 = k === 0 || k === 3 ? 4.6 : k === 1 ? 3 : 2, w1 = k === 0 ? 3 : k === 1 ? 2 : 0.4, cx = 5.5 + (s % 2) * 0.5;
  for (let y = 0; y < 12; y++) {
    const f = y / 11, hw = (k === 3 ? lerp(4.6, 0.3, f) : lerp(w0, w1, f));
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) { const d = (x + 0.5 - cx) / Math.max(0.6, hw); if (Math.abs(d) > 1) continue; a.put(x, y, R, 3.6 - d * 1.8 + (d < -0.3 && d > -0.7 ? 1.8 : 0) + cg(x, y, s) * 0.3); }
  }
  return rimOut(a, R[0], false);
}
const ESTALAC = [estalacSprite(0, 19311), estalacSprite(1, 19312), estalacSprite(2, 19313), estalacSprite(3, 19314)];
/* a escada de favos: uma faixa de alvéolos colados na parede, cada degrau um alvéolo com a borda grossa */
function escadaSprite(k, s) {   // 0 meio, 1 meio deslocado, 2 topo, 3 pé
  const a = spr(), F = DRM.cera, off = k === 1 ? 1 : 0;
  for (const [cy, cx] of [[2.5, 3.5 + off], [8.5, 7.5 - off]]) {
    if (k === 3 && cy > 6 && false) continue;
    for (let y = Math.floor(cy - 3); y <= cy + 3; y++) for (let x = Math.floor(cx - 3.5); x <= cx + 3.5; x++) {
      const dx = Math.abs(x + 0.5 - cx), dy = Math.abs(y + 0.5 - cy), hx = dx + dy * 0.58;
      if (hx > 3.5 || dy > 3) continue;
      const rim = hx > 2.3 || dy > 2.2;
      a.put(x, y, F, rim ? 4.6 - (y + 0.5 - cy) * 0.4 - (x + 0.5 - cx) * 0.2 + cg(x, y, s) * 0.4 : (y + 0.5 > cy ? 2.4 : 1.2));
    }
  }
  if (k === 2) for (let x = 1; x <= 10; x++) a.put(x, 0, F, 3.4 + cg(x, 0, s) * 0.5);
  if (k === 3) for (let x = 2; x <= 9; x++) a.put(x, 11, F, 2.6);
  return rimOut(a, F[0]);
}
const ESCADA = [escadaSprite(0, 19321), escadaSprite(1, 19322), escadaSprite(2, 19323), escadaSprite(3, 19324)];
/* o fio de cera: um cordão grosso de cera pálida torcido, gotas endurecidas; o último termina numa lágrima */
function fioSprite(end, s) {
  const a = spr(), C = RX(['#3a2e16', '#6a5426', '#9a7e3a', '#c4a452', '#e4c870', '#f8e4a0', '#fff6d0']), len = end ? 9 : 12;
  for (let y = 0; y < len; y++) {
    const cx = 5.6 + Math.sin(y * Math.PI / 6 + s) * 0.6, bulb = Math.abs(y - (3 + s % 5)) < 1.2;
    for (let x = Math.floor(cx - 2); x <= Math.ceil(cx + 2); x++) { const d = (x + 0.5 - cx) / (bulb ? 2 : 1.4); if (Math.abs(d) > 1) continue; a.put(x, y, C, 4.2 - d * 1.6 + (((y + s) % 4) === 0 ? -0.8 : 0) + cg(x, y, s) * 0.3); }
  }
  if (end) disc(a, 5.6, 9.5, 1.6, 2, C, (dx, dy) => 4.4 - dx - dy * 1.2);
  return rimOut(a, C[0], false);
}
const FIO = [fioSprite(false, 19331), fioSprite(false, 19332), fioSprite(true, 19333)];
/* larva luminosa no chão: um gomo pálido com a cauda acesa verde-âmbar (a cauda pisca ao vivo, no drawTop) */
function larvaSprite(s, flip) {
  const a = spr(), L = DRM.larva, G = DRM.luz;
  for (let k = 0; k < 4; k++) disc(a, 3 + k * 1.8, 9.2 - (k === 1 ? 0.6 : 0), 1.7 - k * 0.15, 1.6 - k * 0.1, k === 3 ? G : L, (dx, dy) => (k === 3 ? 4.6 : 4) - dx * 0.6 - dy * 1.4 + cg(k, s, 1) * 0.3);
  a.put(2, 8, L, 1); a.put(2, 9, L, 1);   // a boca
  return rimOut(flip ? flipX(a) : a, L[0]);
}
const LARVA = [larvaSprite(19341, false), larvaSprite(19342, true)];
/* casulo pendurado do teto: um fio, depois o casulo de seda cinza-palha enrolado em voltas */
function casuloSprite(s) {
  const a = spr(), S = DRM.seda;
  for (let y = 0; y < 3; y++) a.put(5 + (y & 1), y, S, 3);
  disc(a, 5.8, 7.2, 2.8, 4.4, S, (dx, dy, d, x, y) => 3.6 - dx * 1 - dy * 0.8 - d * 0.6 + (((y * 2 + Math.round(dx * 2)) % 3) === 0 ? -0.9 : 0) + cg(x, y, s) * 0.3);
  return rimOut(a, S[0], false);
}
const CASULO = [casuloSprite(19351), casuloSprite(19352)];
/* ossos de anão no chão: uma costela, um fêmur, e o elmo amassado de lado */
function ossosSprite(s) {
  const a = spr(), O = DRM.osso, F = DRM.ferro;
  for (let x = 1; x <= 7; x++) a.put(x, 11, O, 3.4 - (x === 1 || x === 7 ? -1 : 0));
  for (let x = 2; x <= 6; x++) a.put(x, 10, O, 4.4); a.put(1, 10, O, 5); a.put(7, 10, O, 5);
  for (let k = 0; k < 3; k++) for (let y = 8; y <= 10; y++) a.put(3 + k * 2, y, O, 3.6 - (y - 8) * 0.4);
  // o elmo: cúpula de ferro amassada com o chifre de bronze quebrado
  disc(a, 9, 9.8, 2.6, 2.2, F, (dx, dy) => 3.8 - dx * 1.2 - dy * 1.2 + (dx > 0.3 && dy < -0.1 ? -1.4 : 0));
  for (let x = 6; x <= 11; x++) a.put(x, 11, F, 2.6);
  a.put(11, 7, DRM.bronze, 4.4); a.put(11, 8, DRM.bronze, 3.4);
  return rimOut(a, O[0]);
}
const OSSOS = [ossosSprite(19361), (() => flipX(ossosSprite(19362)))()];
/* poça de mel: uma camada rasa espalhada no chão, com um brilho largo */
function pocaSprite(s) {
  const a = spr(), M = DRM.mel;
  for (let x = 0; x < 12; x++) { const h = x < 1 || x > 10 ? 1 : 2 + (hash2(x, 0, s) < 0.3 ? 1 : 0); for (let y = 12 - h; y < 12; y++) a.put(x, y, M, 3.4 + (y === 12 - h ? 1.4 : 0) - (y === 11 ? 1 : 0) + cg(x, y, s) * 0.3); }
  for (let x = 3; x < 7; x++) a.put(x, 10, M, 6);
  return a;
}
const POCA = [pocaSprite(19371), pocaSprite(19372)];
/* bolha de resina no chão: uma gota grande de resina vidrada com a luz âmbar de dentro */
function bolhaSprite(s) {
  const a = spr(), R = DRM.resina, Mv = DRM.mel;
  disc(a, 6, 8.2, 4, 3.9, R, (dx, dy, d) => 3.4 - dx * 0.8 - dy * 1.1 + (d < 0.35 ? 2 : 0));
  disc(a, 6.4, 8.6, 1.5, 1.4, Mv, (dx, dy) => 4.8 - dy);
  a.put(4, 6, R, 6); a.put(5, 5, R, 5.4);
  return rimOut(a, R[0]);
}
const BOLHA = [bolhaSprite(19381)];
/* asa caída: uma asa translúcida de inseto, nervuras escuras, deitada de lado no chão */
function asaSprite(s, flip) {
  const a = spr(), A = DRM.asa;
  for (let y = 7; y < 12; y++) for (let x = 0; x < 12; x++) {
    const u = (x - 1) / 10, w = (y - 7.5) / 4, inside = u >= 0 && u <= 1 && Math.abs(w - 0.15) < Math.sin(u * Math.PI) * 0.75 + 0.1;
    if (!inside) continue;
    const vein = ((x + y * 2) % 4 === 0) || y === 9;
    a.put(x, y, A, vein ? 2 : 4.6 - u * 1 + cg(x, y, s) * 0.4);
  }
  return rimOut(flip ? flipX(a) : a, A[1]);
}
const ASA = [asaSprite(19391, false), asaSprite(19392, true)];
/* lanterna anã no chão: base de bronze, gaiola de ferro, vidro grosso aceso (a chama é desenhada ao vivo) */
function lanternaSprite(s) {
  const a = spr(), B = DRM.bronze, F = DRM.ferro, C = DRM.chama;
  for (let x = 3; x <= 8; x++) { a.put(x, 11, B, 2.4); a.put(x, 10, B, 4.4 - (x - 3) * 0.3); }
  for (let y = 4; y <= 9; y++) { a.put(3, y, F, 4); a.put(8, y, F, 2.6); for (let x = 4; x <= 7; x++) a.put(x, y, C, 3.2 - Math.abs(x - 5.5) * 0.5 + (y > 6 ? 0.6 : 0)); }
  for (let x = 3; x <= 8; x++) { a.put(x, 3, B, 4.2 - (x - 3) * 0.3); }
  a.put(5, 2, F, 4); a.put(6, 2, F, 2.6); a.put(5, 1, F, 3.2);
  return rimOut(a, F[0]);
}
const LANTERNA = [lanternaSprite(19401)];
/* a coluna de cera: tronco de cera escorrida do chão ao teto, mais grossa no pé e no topo */
function colunaSprite(k, s) {   // 0 pé, 1 tronco, 2 topo
  const a = spr(), C = DRM.cera;
  for (let y = 0; y < 12; y++) {
    const hw = k === 0 ? lerp(3, 5.5, y / 11) : k === 2 ? lerp(5.5, 3, y / 11) : 3 + Math.sin((y + s) * 0.9) * 0.4;
    for (let x = Math.floor(5.5 - hw); x <= Math.ceil(5.5 + hw); x++) { const d = (x + 0.5 - 5.5) / hw; if (Math.abs(d) > 1) continue; a.put(x, y, C, 4 - d * 1.6 + (((y * 3 + x + s) % 7) === 0 ? -0.9 : 0) + cg(x, y, s) * 0.3); }
  }
  return a;
}
const COLUNA = [colunaSprite(0, 19411), colunaSprite(1, 19412), colunaSprite(2, 19413)];

DECO[CM_GOTA_MEL] = GOTA; DECO[CM_ESTALAC] = ESTALAC; DECO[CM_ESCADA_FAVO] = ESCADA; DECO[CM_FIO_CERA] = FIO; DECO[CM_LARVA_LUZ] = LARVA; DECO[CM_CASULO] = CASULO;
DECO[CM_OSSOS_ANAO] = OSSOS; DECO[CM_POCA_MEL] = POCA; DECO[CM_BOLHA] = BOLHA; DECO[CM_ASA] = ASA; DECO[CM_LANTERNA_ANA] = LANTERNA; DECO[CM_COLUNA] = COLUNA;
const CM_DECO = [
  // id, dureza, cor no mapa, o que solta
  [CM_GOTA_MEL, 0.03, '#e8981e', null], [CM_ESTALAC, 0.2, '#8a3c14', 'resina'], [CM_ESCADA_FAVO, 0.25, '#94702e', 'cera_bruta'], [CM_FIO_CERA, 0.2, '#c4a452', 'cera_bruta'],
  [CM_LARVA_LUZ, 0.05, '#a8c440', null], [CM_CASULO, 0.1, '#968c78', null], [CM_OSSOS_ANAO, 0.06, '#aea290', 'osso'], [CM_POCA_MEL, 0.03, '#c0700e', 'mel_escuro'],
  [CM_BOLHA, 0.2, '#b05a1e', 'resina'], [CM_ASA, 0.03, '#9a9a8c', null], [CM_LANTERNA_ANA, 0.1, '#ffb84a', null], [CM_COLUNA, 0.5, '#94702e', 'cera_bruta']
];
for (const [t, dig, col, drop] of CM_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[CM_LARVA_LUZ] = 0.32; EMIT[CM_BOLHA] = 0.3; EMIT[CM_LANTERNA_ANA] = 0.62; EMIT[CM_GOTA_MEL] = 0.08;
// o que cai quando o apoio some (56, 87); escada, fio e coluna ficam (atravessam vãos)
for (const t of [CM_GOTA_MEL, CM_ESTALAC, CM_CASULO]) CV_HANGS[t] = 1;
for (const t of [CM_LARVA_LUZ, CM_OSSOS_ANAO, CM_POCA_MEL, CM_BOLHA, CM_ASA, CM_LANTERNA_ANA]) CV_STANDS[t] = 1;

// que variação vai onde
DECO_PICK[CM_ESTALAC] = (gx, gy, arr) => { const up = tileAt(gx, gy - 1) === CM_ESTALAC, dn = tileAt(gx, gy + 1) === CM_ESTALAC; return !up && !dn ? arr[3] : !up ? arr[0] : dn ? arr[1] : arr[2]; };
DECO_PICK[CM_ESCADA_FAVO] = (gx, gy, arr) => tileAt(gx, gy - 1) !== CM_ESCADA_FAVO && solidAt(gx, gy - 1) ? arr[2] : tileAt(gx, gy + 1) !== CM_ESCADA_FAVO && !solidAt(gx, gy + 1) ? arr[3] : arr[gy & 1];
DECO_PICK[CM_FIO_CERA] = (gx, gy, arr) => tileAt(gx, gy + 1) === CM_FIO_CERA || solidAt(gx, gy + 1) ? arr[(gy & 1) ? 1 : 0] : arr[2];
DECO_PICK[CM_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== CM_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== CM_COLUNA ? arr[2] : arr[1];

// a escada de favos e o fio de cera se escalam como a corrente da catedral; a escada também conta como a escada da mina (a pose de subir, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, CM_FIO_CERA) || _tt(e, CM_ESCADA_FAVO))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, CM_ESCADA_FAVO)); }; }

/* ================= ao vivo: brilhos, a gota que cai, a cauda da larva, a chama da lanterna ================= */
const CM_GL = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!COLMEIA || cy + VH < (CM_S0 - 6) * T || cy > (CM_S0 + CM_D + 6) * T) return;
  if (!CM_GL.a) { CM_GL.a = glow(14, '#f4a838'); CM_GL.l = glow(12, '#c8e860'); CM_GL.b = glow(14, '#e08830'); CM_GL.n = glow(26, '#ffc070'); CM_GL.m = glow(8, '#ffc040'); CM_GL.o = glow(9, '#f0c050'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2], gx = emitters[i], gy = emitters[i + 1];
    if (t === CM_AMBAR || t === CM_AMBAR_FOSSIL) { if ((gx * 3 + gy) % 3) continue; lc.globalAlpha = 0.13 + Math.sin(gameTime * 0.7 + gx * 0.9 + gy * 0.4) * 0.03; lc.drawImage(CM_GL.a, gx * T + 6 - cx - 14, gy * T + 6 - cy - 14); }
    else if (t === CM_LARVA_LUZ) { lc.globalAlpha = 0.2 + Math.sin(gameTime * 1.6 + gx * 2.1) * 0.06; lc.drawImage(CM_GL.l, gx * T + 9 - cx - 12, gy * T + 9 - cy - 12); }
    else if (t === CM_BOLHA) { lc.globalAlpha = 0.2 + Math.sin(gameTime * 0.9 + gx) * 0.03; lc.drawImage(CM_GL.b, gx * T + 6 - cx - 14, gy * T + 8 - cy - 14); }
    else if (t === CM_LANTERNA_ANA) { lc.globalAlpha = 0.3 + Math.sin(gameTime * 7 + gx * 1.3) * 0.02 + Math.sin(gameTime * 13 + gy) * 0.015; lc.drawImage(CM_GL.n, gx * T + 6 - cx - 26, gy * T + 6 - cy - 26); }
    else if (t === CM_FAVO_MEL) { if ((gx + gy * 2) % 4) continue; lc.globalAlpha = 0.07; lc.drawImage(CM_GL.m, gx * T + 6 - cx - 8, gy * T + 6 - cy - 8); }
    else if (t === CM_O_AMBRITA) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.08 + Math.sin(gameTime * 0.8 + gx * 0.7) * 0.03; lc.drawImage(CM_GL.o, gx * T + 6 - cx - 9, gy * T + 6 - cy - 9); }
  }
  lc.globalAlpha = 1;
});
// as gotas de mel visíveis: reescaneadas quando a vista anda um bloco ou a cada meio segundo
const cmDrips = []; let cmVisKey = '', cmVisT = 0;
HOOK.update.push(dt => {
  if (!COLMEIA || state !== 'play') return;
  const x0 = Math.floor(cam.x / T) - 1, y0 = Math.max(0, Math.floor(cam.y / T) - 1), key = x0 + ',' + y0;
  if (key === cmVisKey && (cmVisT -= dt) > 0) return;
  cmVisKey = key; cmVisT = 0.5; cmDrips.length = 0;
  const y1 = Math.min(WH - 1, y0 + Math.ceil(VH / T) + 2), x1 = x0 + Math.ceil(VW / T) + 2;
  if (inColmeia(y0) || inColmeia(y1)) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === CM_GOTA_MEL) cmDrips.push(x, y);
});
HOOK.drawTop.push((cx, cy) => {
  if (!COLMEIA) return;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== CM_LANTERNA_ANA && t !== CM_LARVA_LUZ) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === CM_LANTERNA_ANA) { const f = Math.floor(gameTime * 8 + gx * 3) % 3; lc.fillStyle = '#ffe0a0'; lc.fillRect(x + 5, y + 6 + (f === 1 ? 0 : 1), 2, f === 1 ? 3 : 2); lc.fillStyle = '#ffffff'; lc.fillRect(x + 5 + (f === 2 ? 1 : 0), y + 8, 1, 1); continue; }
    // a cauda da larva acende e apaga devagar
    const k = 0.5 + Math.sin(gameTime * 1.6 + gx * 2.1) * 0.5, fl = hash2(gx, gy, seed) * 2 | 0;
    lc.globalAlpha = 0.35 + k * 0.5; lc.fillStyle = '#ecfcb0'; lc.fillRect(x + (fl ? 3 : 8), y + 9, 1, 1); lc.globalAlpha = 1;
  }
  for (let i = 0; i < cmDrips.length; i += 2) {
    const gx = cmDrips[i], gy = cmDrips[i + 1], x = gx * T - cx, y = gy * T - cy, ph0 = (gameTime * 0.25 + hash2(gx, gy, 19501)) % 1, gxo = 4 + (hash2(gx, gy, 19502) * 3 | 0);
    if (ph0 < 0.8) { if (ph0 > 0.5) { lc.fillStyle = '#ffc040'; lc.fillRect(x + gxo, y + 5, 1, ph0 > 0.68 ? 2 : 1); } continue; }
    let fl = 1; while (fl < 10 && !solidAt(gx, gy + fl)) fl++;
    const fy = (ph0 - 0.8) / 0.2, dy = 6 + fy * fy * (fl * T - 6);
    lc.fillStyle = '#e8981e'; lc.fillRect(x + gxo, y + dy, 1, 2); lc.fillStyle = '#ffe08a'; lc.fillRect(x + gxo, y + dy, 1, 1);
  }
});
Object.assign(CMART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, hexGrid, courses, DRM, MEL, AMB, RESV, LARV, INSE, OSSO, CERAJ, QUIG,
  vCera, vCeraNova, vFavo, vFavoMel, vResina, vAmbar, vPedraTomada, vCeraReal, vQuitina, vOvo, vFavoReal, vLacre });
}
