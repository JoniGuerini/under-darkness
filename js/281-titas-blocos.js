'use strict';

/* ================= o Ossário dos Titãs: blocos, paredes, terceira camada, minérios, decoração, a luz fria =================
   Um cemitério frio e quieto, todo marfim e pó. O osso de titã é marfim cinzento com o veio fibroso correndo de lado,
   os poros finos deitados e as rachaduras de seco; o esponjoso é um favo de buracos redondos com as traves claras; o
   tutano petrificado é âmbar-rosado, ceroso, em anéis; a rocha fóssil é areia cinza em camadas com conchas em espiral e
   ossinhos presos; o pó de osso é branco sujo, macio, com ondinhas de vento; o esmalte é branco-azulado liso, em fios de
   cima para baixo, com o brilho molhado; a cartilagem seca é amarela, em anéis fibrosos; a cinza assentada é a do
   vulcão do Covil, cinza em camadas finas com pontinhos pretos; o bronze titânico são placas verdes gastas com rebites,
   o azinhavre escorrido e os riscos da guerra. Os Dedos Cerrados são nós de dedos de osso, um sobre o outro.
   Como o 251, cada material é uma textura contínua de 240x240; contorno, borda acesa, sombra e oclusão vêm do 07. A
   decoração de 1 bloco são sprites de 12x12 em rampas de 7 tons com luz de cima à esquerda; o que brilha e se mexe (a
   chama amarela da lamparina, a luz fria da flor-de-cinza, da lasca e da adamantita, o fio de pó que escorre) é
   desenhado ao vivo, só sobre o que está na tela. Ids: 280. */
const TTART = {};   // ferramentas para 282-titas-objetos, os bichos (283, 284), o corpo (286), o titã (287) e a adamantita (288)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro (a ficha, seção 12) ---- */
pal('ttOsso', ['#3a352a', '#5a5444', '#7e7660', '#a29880', '#c8bca0', '#e8e0c8']);
pal('ttEsponja', ['#4a3c30', '#6a5848', '#8a7660', '#a8947a', '#c4b096', '#dccab0']);
pal('ttTutano', ['#4a2a20', '#6e4030', '#945a42', '#b87a5a', '#d4a07a', '#ecc8a4']);
pal('ttRocha', ['#24221c', '#363228', '#4c4638', '#6a6252', '#887e6a', '#a69c86']);
pal('ttPo', ['#4e4a40', '#6a6556', '#87806e', '#a89e88', '#c4bca6', '#ddd6c2']);
pal('ttDente', ['#4a5458', '#6e7a80', '#94a2a8', '#b8c4ca', '#dce4e8', '#f4f8fa']);
pal('ttCartilagem', ['#4a3e1e', '#6a5a2c', '#8c7a40', '#ae9a58', '#ccb878', '#e6d6a0']);
pal('ttCinza', ['#1e1d1c', '#2e2c2a', '#403d3a', '#55514c', '#6c6862', '#87827a']);
pal('ttBronze', ['#1a241c', '#2a3a2c', '#3a5240', '#4a6a52', '#6a8a6a', '#a8b88a']);
pal('ttDedos', ['#3a352a', '#5a5444', '#7e7660', '#a29880', '#c8bca0', '#f0e8d0']);
// paredes de fundo: sempre bem mais escuras que o chão da frente
pal('ttOssoW', ['#0b0a08', '#100f0c', '#161410', '#1c1a15', '#23201a', '#2b2820']);
pal('ttRochaW', ['#070706', '#0b0a08', '#0f0e0b', '#13120e', '#181612', '#1e1b16']);
pal('ttEsponjaW', ['#0c0907', '#110d0a', '#17120e', '#1d1712', '#241d16', '#2c241b']);
pal('ttCranioW', ['#0d0c0a', '#13110e', '#191713', '#201d18', '#28241e', '#322d25']);
pal('ttBronzeW', ['#050806', '#080c09', '#0b110c', '#0f1610', '#131c15', '#18241a']);
// a terceira camada: as costelas ao longe (o tom 4 e 5 são o osso pegando a pouca luz), os titãs deitados como
// montanhas, a rocha fóssil escura com ossos embutidos
pal('dpTtCostelas', ['#030302', '#060605', '#0b0a08', '#11100c', '#1c1a14', '#2e2a20']);
pal('dpTtTitas', ['#020202', '#050504', '#090807', '#0e0d0b', '#161410', '#24211a']);
pal('dpTtRocha', ['#030302', '#050504', '#080706', '#0b0a08', '#100e0b', '#18150f']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // senos só com múltiplos inteiros disto, para a textura não ter emenda
const RX = hexes => hexes.map(h => ph(h));
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
const IVORY = RX(['#8e8470', '#b4a88e', '#d6ccb2', '#f0e8d4', '#fffaee']);       // o marfim aceso (ossinhos na rocha, traves)
const PORE = RX(['#1e1a14', '#2e2a20', '#423c30']);                             // poros e buracos
const SHELL = RX(['#3e3a30', '#625a48', '#8a806a', '#b2a88e', '#d4cab0']);     // as conchas fósseis
const VERDI = RX(['#1e3a30', '#2e5a48', '#4a8068', '#74a88a', '#a8d0b0']);     // azinhavre
const RIVET = RX(['#1a1e18', '#34402e', '#5a6a4a', '#8a9a70', '#c4ceaa']);
const SOOT = RX(['#0e0d0c', '#1a1816', '#2a2724']);
const FRIO = RX(['#2e4a44', '#4e766c', '#7aa89a', '#a8d4c4', '#d6f2e8', '#ffffff']);   // a luz fria da foice
const GLOSS = RX(['#e4ecef', '#ffffff']);

/* ---- o chão sólido ---- */
function vOsso(x, y) {   // osso de titã: marfim cinzento, o veio fibroso correndo de lado e ondulando, poros deitados, rachaduras de seco
  const fy = y + cn(x, y, 3, 8, 28101) * 26 + cn(x, y, 10, 20, 28102) * 6;
  const g = Math.sin(fy * W2 * 40), f = Math.sin(fy * W2 * 110 + cn(x, y, 20, 6, 28103) * 4);
  let v = 3.3 + g * 0.35 + f * 0.18 + cn(x, y, 12, 12, 28104) * 1.1 + cn(x, y, 40, 40, 28105) * 0.5 + cg(x, y, 28106) * 0.3;
  if (f > 0.9) v += 0.5;                                                                                  // a fibra clara
  // os poros: risquinhos escuros deitados, ao longo do veio
  const X = wrapT(x), Y = wrapT(Math.round(fy)), px = Math.floor(X / 9), py = Math.floor(Y / 5), hp = hash2(px, py, 28107);
  if (hp < 0.22) { const ox = X % 9, oy = Y % 5, L = 2 + ((hp * 50) | 0) % 3; if (oy === 2 && ox >= 2 && ox < 2 + L) return 1.1 + cg(x, y, 28108) * 0.3; if (oy === 3 && ox >= 2 && ox < 2 + L) v += 0.7; }
  // as rachaduras de seco: linhas finas quase retas, a beirada de baixo pega luz
  const ck = Math.abs(cn(wrapT(x + cn(x, y, 6, 6, 28109) * 50), wrapT(y + cn(x, y, 6, 6, 28110) * 50), 5, 5, 28111));
  if (ck < 0.005) return 0.9;
  if (ck < 0.009) v -= 0.8;
  // a mancha de tempo: marfim mais amarelado em nuvens
  const st = cn(x, y, 5, 5, 28112); if (st > 0.25) v -= (st - 0.25) * 2.4;
  if (hash2(x, y, 28113) < 0.006) v += 1.1;
  return v;
}
function vEsponja(x, y) {   // osso esponjoso: favo de buracos redondos de vários tamanhos, as traves claras entre eles, o fundo dos buracos escuro
  const c = cells(x, y, 9, 28121, 1);
  const r = 2.2 + c.id * 2.4, d = c.d1;
  if (d < r) {   // dentro do buraco: o fundo escuro, a borda de cima sombreada (a luz vem de cima à esquerda)
    const sh = (c.ox + c.oy) / r;
    if (d < r - 1.1) return 0.5 + sh * 0.5 + cg(x, y, 28122) * 0.2;
    return sh < 0 ? 0.6 : 2.6;
  }
  let v = 3.2 + cn(x, y, 20, 20, 28123) * 0.9 + cg(x, y, 28124) * 0.35;
  if (c.d2 - c.d1 < 1.4) v += 0.8;                                                                        // a trave fina entre dois buracos
  const c2 = cells(x + 4, y + 4, 5, 28125, 1); if (c2.d1 < 0.9 && c2.id < 0.4) return 1.2;                // poros pequenos nas traves
  return v;
}
function vTutano(x, y) {   // tutano petrificado: âmbar-rosado, ceroso, em anéis largos que ondulam, pontinhos de brilho
  const rx = x + cn(x, y, 4, 4, 28131) * 40, ry = y + cn(x, y, 4, 4, 28132) * 40;
  const ring = Math.sin((rx * 0.6 + ry) * W2 * 16 + cn(x, y, 8, 8, 28133) * 6);
  let v = 3.0 + ring * 0.6 + cn(x, y, 16, 16, 28134) * 1.0 + cg(x, y, 28135) * 0.22;
  if (ring > 0.92) v += 0.8;
  const b = cells(x, y, 14, 28136); if (b.id < 0.18 && b.d1 < 2.4) v += b.ox + b.oy < 0 ? 1.4 : -0.6;   // bolhas de cera
  if (hash2(x, y, 28137) < 0.005) v = 5.2;
  return v;
}
function vRocha(x, y) {   // rocha fóssil: areia cinza em camadas finas, conchas em espiral e ossinhos presos, grãos escuros
  const sy = y + cn(x, y, 3, 6, 28141) * 18;
  const band = Math.sin(sy * W2 * 30) * 0.5 + Math.sin(sy * W2 * 74 + 1.3) * 0.25;
  let v = 2.6 + band * 0.7 + cn(x, y, 18, 18, 28142) * 1.0 + cg(x, y, 28143) * 0.55;
  // as conchas: espirais de 3 a 5 px de raio
  const s = cells(x, y, 30, 28144);
  if (s.id < 0.28) {
    const r = 2.6 + s.id * 7, d = s.d1;
    if (d < r) {
      const a = Math.atan2(s.oy, s.ox), sp = (d / r * 3 - a / 6.2832 + 4) % 1;
      if (sp < 0.22) return 0.5;
      MATX = SHELL[clamp(Math.round(3.2 - (s.ox + s.oy) / r * 1.4 - d / r * 0.8), 0, 4)]; return -9;
    }
    if (d < r + 0.9) return 1.2;
  }
  // os ossinhos: tracinhos claros deitados com as pontas grossas
  const X = wrapT(x), Y = wrapT(y), bx = Math.floor(X / 22), by = Math.floor(Y / 14), hb = hash2(bx, by, 28145);
  if (hb < 0.2) {
    const ox = X % 22 - 4, oy = Y % 14 - 6, L = 8 + ((hb * 60) | 0) % 6, sl = (hb * 13 % 1 - 0.5) * 0.5, yy = oy - ox * sl;
    if (ox >= 0 && ox <= L && Math.abs(yy) < ((ox < 2 || ox > L - 2) ? 1.5 : 0.8)) { MATX = IVORY[yy < 0 ? 3 : ox < 2 || ox > L - 2 ? 2 : 1]; return -9; }
    if (ox >= 0 && ox <= L && yy >= 0.8 && yy < 1.8) v -= 1.0;
  }
  if (hash2(x, y, 28146) < 0.03) v -= 1.0; else if (hash2(x, y, 28147) < 0.012) v += 0.9;
  return v;
}
function vPo(x, y) {   // pó de osso: branco sujo, macio, grão fino, ondinhas de vento deitadas, um ossinho de vez em quando
  const ry = y + cn(x, y, 4, 2, 28151) * 14 + Math.sin(x * W2 * 6) * 3;
  const rip = Math.sin(ry * W2 * 36 + cn(x, y, 10, 4, 28152) * 4);
  let v = 3.2 + rip * 0.35 + cn(x, y, 24, 24, 28153) * 0.6 + cg(x, y, 28154) * 0.7;
  if (rip > 0.85) v += 0.4; else if (rip < -0.85) v -= 0.5;
  const c = cells(x, y, 26, 28155); if (c.id < 0.08 && c.d1 < 2) { MATX = IVORY[c.ox + c.oy < 0 ? 3 : 1]; return -9; }
  if (hash2(x, y, 28156) < 0.02) v -= 1.1;
  return v;
}
function vDente(x, y) {   // esmalte: branco-azulado liso, fios finos de cima para baixo, a faixa de brilho molhado, rachadinhas
  const ux = x + cn(x, y, 6, 2, 28161) * 20;
  const st = Math.sin(ux * W2 * 60) * 0.5 + Math.sin(ux * W2 * 140 + 2) * 0.2;
  let v = 3.4 + st * 0.35 + cn(x, y, 8, 8, 28162) * 0.9 + cg(x, y, 28163) * 0.16;
  const gl = cn(x, y, 4, 10, 28164); if (gl > 0.28 && gl < 0.31) { MATX = GLOSS[gl < 0.295 ? 0 : 1]; return -9; }
  if (gl > 0.2 && gl < 0.34) v += 0.7;
  const ck = Math.abs(cn(wrapT(x + cn(x, y, 6, 6, 28165) * 30), y, 10, 3, 28166)); if (ck < 0.004) return 1.6;
  return v;
}
function vCartilagem(x, y) {   // cartilagem seca: amarelada, anéis fibrosos de lado (o disco visto de perfil), fiapos soltos
  const ry = y + cn(x, y, 4, 4, 28171) * 20;
  const r = Math.sin(ry * W2 * 26) * 0.6 + Math.sin(ry * W2 * 62 + x * W2 * 4) * 0.3;
  let v = 2.9 + r * 0.8 + cn(x, y, 14, 14, 28172) * 0.8 + cg(x, y, 28173) * 0.4;
  const fi = Math.abs(cn(x, wrapT(y + cn(x, y, 10, 10, 28174) * 30), 20, 6, 28175)); if (fi < 0.006) v += 1.2; else if (fi < 0.01) v -= 0.6;
  if (hash2(x, y, 28176) < 0.025) v -= 1.2;
  return v;
}
function vCinza(x, y) {   // cinza assentada: cinza em camadas finas apertadas, pontinhos pretos de carvão, fendas de contração
  const sy = y + cn(x, y, 3, 4, 28181) * 10;
  let v = 2.6 + Math.sin(sy * W2 * 48) * 0.45 + cn(x, y, 22, 22, 28182) * 0.9 + cg(x, y, 28183) * 0.6;
  if (hash2(x, y, 28184) < 0.04) { MATX = SOOT[(hash2(x, y, 28185) * 3) | 0]; return -9; }
  const c = cells(x, y, 30, 28186, 1.6); if (c.d2 - c.d1 < 0.7) v -= 1.3;
  return v;
}
// as placas de bronze: 40 x 24 desencontradas, o chanfro aceso em cima e à esquerda, rebites nos cantos, o azinhavre
// escorrendo dos rebites, os riscos e os amassados da guerra
function vBronze(x, y) {
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 24), sx = (row & 1) * 20, px = wrapT(X + sx), bx = px % 40, by = Y % 24, id = hash2(Math.floor(px / 40), row, 28191);
  let v = 2.9 + cn(x, y, 12, 12, 28192) * 1.0 + cg(x, y, 28193) * 0.35 + (id - 0.5) * 0.6;
  if (by === 0 || bx === 0) return 4.4;                                                                    // o chanfro aceso
  if (by === 1 || bx === 1) v += 0.7;
  if (by === 23 || bx === 39) return 0.8;                                                                  // a junta escura
  if (by === 22 || bx === 38) v -= 0.8;
  for (const [rx, ry] of [[4, 4], [35, 4], [4, 19], [35, 19]]) {                                            // os rebites
    const d = Math.hypot(bx - rx, by - ry);
    if (d < 1.8) { MATX = RIVET[d < 0.8 && bx <= rx && by <= ry ? 4 : bx + by < rx + ry ? 3 : 1]; return -9; }
    if (by > ry + 1 && by < ry + 7 + id * 6 && Math.abs(bx - rx - Math.sin(by * 0.7) * 0.4) < 0.9 && id > 0.3) { MATX = VERDI[by < ry + 4 ? 3 : 2]; return -9; }   // o azinhavre escorrido
  }
  const vd = cn(x, y, 8, 8, 28194); if (vd > 0.22) { MATX = VERDI[clamp(Math.round(1 + (vd - 0.22) * 9 + cg(x, y, 28195) * 1.2), 0, 4)]; return -9; }
  const sc = Math.abs(cn(wrapT(x + y * 0.6), wrapT(y - x * 0.3), 30, 3, 28196)); if (sc < 0.004 && id > 0.4) return 4.6;   // um risco claro
  const dn = cells(x, y, 18, 28197); if (dn.id < 0.1 && dn.d1 < 3) v += dn.ox + dn.oy < 0 ? -0.8 : 0.6;                    // amassado
  return v;
}
// os Dedos Cerrados: falanges grossas deitadas umas sobre as outras, o nó do dedo claro, a unha de esmalte na ponta
function vDedos(x, y) {
  const Y = wrapT(y), row = Math.floor(Y / 16), by = Y % 16, X = wrapT(x + row * 37), seg = Math.floor(X / 30), bx = X % 30;
  const t = by / 15, w = Math.sin(t * Math.PI);
  let v = 1.6 + w * 2.4 - t * 0.6 + cn(x, y, 20, 20, 28201) * 0.6 + cg(x, y, 28202) * 0.25;
  if (by === 0 || by === 15) return 0.6;
  if (bx < 3) v -= 1.4 - bx * 0.4;                                                                          // a dobra entre falanges
  if (bx > 9 && bx < 16 && by > 3 && by < 10) v += 0.6;                                                    // o nó do dedo
  if (hash2(seg, row, 28203) < 0.3 && bx > 22 && by > 4 && by < 11) v = by < 6 ? 5.2 : 4.4;                // a unha
  return v;
}

/* ---- paredes de fundo (só o tom) ---- */
const vOssoW = (x, y) => { const v = vOsso(x, y); return v === -9 ? 3 : v * 0.85 + 0.4; };
const vRochaW = (x, y) => { const v = vRocha(x, y); return v === -9 ? 3.4 : v; };
const vEsponjaW = (x, y) => { const v = vEsponja(x, y); return v * 0.9 + 0.3; };
function vCranioW(x, y) {   // a curva de dentro do crânio: osso liso em placas grandes costuradas pelas suturas em zigue-zague
  let v = 3 + cn(x, y, 6, 6, 28211) * 1.4 + cg(x, y, 28212) * 0.3;
  const su = Math.abs(cn(wrapT(x + Math.sin(y * W2 * 40) * 3), wrapT(y + Math.sin(x * W2 * 40) * 3), 3, 3, 28213));
  if (su < 0.012) v -= 2.2; else if (su < 0.02) v += 0.6;
  return v;
}
const vBronzeW = (x, y) => { const v = vBronze(x, y); return v === -9 ? (MATX === VERDI[2] || MATX === VERDI[3] ? 3.4 : 2.6) : v; };

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpCostelas(x, y) {   // as costelas ao longe: arcos enormes um atrás do outro, saindo do chão e voltando, o osso aceso em cima
  let v = 1.2 + cn(x, y, 10, 10, 28221) * 0.8 + cg(x, y, 28222) * 0.2;
  for (const [c0, r, w, s] of [[30, 150, 9, 1], [120, 170, 11, 2], [200, 140, 8, 3]]) {
    const dx = wrapD(x - c0), cy = TP * 0.95, d = Math.hypot(dx * 0.55, y - cy) - r * 0.55;
    if (Math.abs(d) < w * (0.6 + 0.4 * Math.abs(Math.sin(dx * 0.02 + s)))) { v = 3.2 + (d < 0 ? 1.3 : -0.4) + cg(x, y, 28223 + s) * 0.4; if (Math.abs(d) < 1) v += 0.6; }
  }
  return v;
}
function vDpTitas(x, y) {   // titãs deitados ao longe, do tamanho de montanhas: o perfil de um corpo de bruços, a cabeça, o ombro
  const sil = TP * 0.72 - (Math.sin(x * W2 * 1) * 18 + Math.sin(x * W2 * 3 + 1) * 10 + Math.max(0, Math.sin(x * W2 * 2 + 2)) * 22 + cn(x, 0, 12, 1, 28231) * 14);
  let v = 0.8 + cn(x, y, 14, 14, 28232) * 0.6 + cg(x, y, 28233) * 0.2;
  if (y > sil) { v = 2.4 + cn(x, y, 20, 20, 28234) * 0.9 + cg(x, y, 28235) * 0.3; if (y < sil + 2) v = 4.6; else if (y < sil + 5) v += 0.9; const rb = Math.sin(x * W2 * 22) ; if (rb > 0.9 && y > sil + 8) v -= 0.8; }
  return v;
}
function vDpRocha(x, y) { const v = vRocha(x, y); return v === -9 ? 3.6 : v * 0.8; }

/* ---- assar e registrar ---- */
const BKV = {
  osso: bake(vOsso), esponja: bake(vEsponja), tutano: bake(vTutano), rocha: bake(vRocha), po: bake(vPo), dente: bake(vDente), cartilagem: bake(vCartilagem),
  cinza: bake(vCinza), bronze: bake(vBronze), dedos: bake(vDedos),
  ossoW: bake(vOssoW), rochaW: bake(vRochaW), esponjaW: bake(vEsponjaW), cranioW: bake(vCranioW), bronzeW: bake(vBronzeW),
  dpCostelas: bake(vDpCostelas), dpTitas: bake(vDpTitas), dpRocha: bake(vDpRocha)
};
const TT_SOLID = [
  // id, paleta, textura, dureza, cor no mapa (a ficha, seção 11)
  [TT_OSSO, 'ttOsso', 'osso', 1.6, '#c8bca0'], [TT_ESPONJA, 'ttEsponja', 'esponja', 0.7, '#a8947a'], [TT_TUTANO, 'ttTutano', 'tutano', 0.9, '#b87a5a'],
  [TT_ROCHA, 'ttRocha', 'rocha', 1.4, '#6a6252'], [TT_PO, 'ttPo', 'po', 0.4, '#a89e88'], [TT_DENTE, 'ttDente', 'dente', 2.0, '#dce4e8'],
  [TT_CARTILAGEM, 'ttCartilagem', 'cartilagem', 0.8, '#ae9a58'], [TT_CINZA, 'ttCinza', 'cinza', 0.6, '#55514c'], [TT_BRONZE, 'ttBronze', 'bronze', 1.9, '#4a6a52']
];
for (const [t, p, k, dig, col] of TT_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [TT_ROCHA, TT_PO, TT_CINZA, TT_ESPONJA]) BLEND[t] = 1;
// os Dedos Cerrados: sólidos, não quebram
MAT[TT_BARREIRA] = [PALS.ttDedos, BKV.dedos]; SOLID[TT_BARREIRA] = 1; BLOCKY[TT_BARREIRA] = 1; DIG[TT_BARREIRA] = 0; PCOL[TT_BARREIRA] = '#e8e0c8';

WMAT[WTT_OSSO] = [PALS.ttOssoW, BKV.ossoW]; WMAT[WTT_ROCHA] = [PALS.ttRochaW, BKV.rochaW]; WMAT[WTT_ESPONJA] = [PALS.ttEsponjaW, BKV.esponjaW];
WMAT[WTT_CRANIO] = [PALS.ttCranioW, BKV.cranioW]; WMAT[WTT_BRONZE] = [PALS.ttBronzeW, BKV.bronzeW];
DMAT[DP_TT_COSTELAS] = [PALS.dpTtCostelas, BKV.dpCostelas]; DMAT[DP_TT_TITAS] = [PALS.dpTtTitas, BKV.dpTitas]; DMAT[DP_TT_ROCHA] = [PALS.dpTtRocha, BKV.dpRocha];

/* ---- os minérios: linhito na rocha fóssil, e a adamantita: lascas de aço cinza-esverdeado com o fio quase branco ---- */
oreRamp(TT_O_ADAMANTITA, ['#141a18', '#1c2422', '#2e3a38', '#465652', '#5e7470', '#7a948a', '#d0e4dc']);
const ADA_TIP = new Map();   // semente do bloco -> o fio da lasca maior (onde o brilho frio corre, ao vivo)
ORE_PAINT[TT_O_ADAMANTITA] = function (L, s) {
  // duas ou três lascas compridas como cacos de lâmina, deitadas em ângulo, o fio claro de um lado, a face escura do outro
  const R = ORE_RAMP[TT_O_ADAMANTITA], n = 2 + (hash2(s, 1, 28401) < 0.45 ? 1 : 0);
  let tip = null, best = -9;
  for (let i = n - 1; i >= 0; i--) {
    const big = i === 0, cx = 3 + hash2(s, 2 + i, 28402) * 6, cy = 3 + hash2(s, 3 + i, 28403) * 6, ang = (hash2(s, i, 28404) - 0.5) * 2.4 + (big ? 0.4 : 0);
    const len = big ? 4.8 + hash2(s, i, 28405) * 1.4 : 2.6 + hash2(s, i, 28405) * 1.2, hw = big ? 1.5 : 1.0, ux = Math.cos(ang), uy = Math.sin(ang);
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const px = x + 0.5 - cx, py = y + 0.5 - cy, al = px * ux + py * uy, pe = -px * uy + py * ux;
      if (Math.abs(al) > len) continue;
      const w = hw * (1 - Math.abs(al) / (len + 0.4)) + 0.35; if (Math.abs(pe) > w) continue;
      let l = pe < 0 ? 4.6 - Math.abs(pe) * 0.4 : 2.4 - pe * 0.6;                                        // o fio de cima aceso, a face de baixo
      if (pe < 0 && Math.abs(pe) > w - 0.6) l = 6;                                                       // o fio
      l += (hash2(x + s, y, 28406) - 0.5) * 0.4;
      L.put(x, y, ramp(R, Math.min(l, 6)), l);
      if (big && l > best) { best = l; tip = [x, y]; }
    }
  }
  for (let i = 0; i < 2; i++) { const x = 1 + (hash2(s, i, 28407) * 10 | 0), y = 1 + (hash2(s, i, 28408) * 10 | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[3 + i], 1); }   // limalha
  ADA_TIP.set(s, tip);
};
ORE_HALO[TT_O_ADAMANTITA] = { pal: ['ttRocha', '#5e7a72', 0.26, 0.1], shade: 0.2 };
ORE_PAINT[TT_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[TT_O_CARVAO] = { pal: ['ttRocha', '#0a0a08', 0.45, 0.18], shade: 0 };
MAT[TT_O_CARVAO] = [PALS.ttRocha, bakeOre(TT_O_CARVAO, vRocha)]; MAT[TT_O_ADAMANTITA] = [PALS.ttRocha, bakeOre(TT_O_ADAMANTITA, vRocha)];
for (const t of [TT_O_CARVAO, TT_O_ADAMANTITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[TT_O_CARVAO] = DIG[COAL]; ORE_XP[TT_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[TT_O_CARVAO] = ORE_NAME[COAL]; PCOL[TT_O_CARVAO] = PCOL[COAL]; ORE_ITEM[TT_O_CARVAO] = ORE_ITEM[COAL];
DIG[TT_O_ADAMANTITA] = 1.9; ORE_XP[TT_O_ADAMANTITA] = 27; ORE_NAME[TT_O_ADAMANTITA] = 'Adamantita'; PCOL[TT_O_ADAMANTITA] = '#7a948a'; ORE_ITEM[TT_O_ADAMANTITA] = 'min_adamantita';
EMIT[TT_O_ADAMANTITA] = 0.22;
const adaTip = (gx, gy) => ADA_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + TT_O_ADAMANTITA * 7919) | 0);

/* ---- itens de bloco ---- */
const TT_ITEMS = {
  osso_tita: ['Osso de Titã', TT_OSSO, 'Um pedaço do osso de um gigante. Marfim cinzento, duro como pedra, com o veio correndo de lado.'],
  osso_esponjoso: ['Osso Esponjoso', TT_ESPONJA, 'O miolo poroso dos ossos dos titãs. Leve, cheio de buracos, quebra fácil.'],
  tutano_seco: ['Tutano Petrificado', TT_TUTANO, 'O tutano de um osso de titã, endurecido em âmbar-rosado. Tem cheiro de cera.'],
  rocha_fossil: ['Rocha Fóssil', TT_ROCHA, 'Areia cinza endurecida em camadas, cheia de conchas e ossinhos de bichos que ninguém mais conhece.'],
  po_osso: ['Pó de Osso', TT_PO, 'O chão do Ossário: o que sobrou de eras de ossos virando poeira.'],
  esmalte: ['Esmalte', TT_DENTE, 'Um pedaço de dente de titã, branco-azulado e liso. A picareta mal risca.'],
  cartilagem: ['Cartilagem Seca', TT_CARTILAGEM, 'Um disco da espinha de um titã, amarelado e fibroso, duro de tão seco.'],
  cinza_assentada: ['Cinza Assentada', TT_CINZA, 'A cinza do vulcão do Covil, que desceu pelas frestas e endureceu em camadas.'],
  bronze_titanico: ['Bronze Titânico', TT_BRONZE, 'Uma placa da armadura de um titã, verde de azinhavre, com rebites do tamanho de um punho.']
};
for (const id in TT_ITEMS) { const [name, block, desc] = TT_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRT = {
  osso: ['#2a261e', '#4a4436', '#6e6652', '#968c74', '#bcb296', '#ddd4ba', '#f6f0de'],
  tendao: ['#2a1a12', '#46301e', '#664830', '#886444', '#a8845c', '#c8a67a', '#e4c8a0'],
  tutano: ['#3a1e16', '#5e3424', '#844e36', '#a86c4c', '#c8906a', '#e2b690', '#f6dcbc'],
  cinza: ['#2a2a28', '#44423e', '#605d58', '#7e7a74', '#9e9a92', '#bebab0', '#dcd8ce'],
  liquen: ['#141a14', '#222c22', '#34402e', '#4a5a40', '#647456', '#80906e', '#a2b08c'],
  foice: ['#141a18', '#24302c', '#3a4a46', '#56706a', '#7a9a90', '#b0d0c4', '#eefaf4'],
  pau: ['#1e140c', '#342418', '#4e3824', '#6a4e34', '#866648', '#a2805e', '#bc9a78'],
  pena: ['#121012', '#222024', '#36323a', '#4c4652', '#666070', '#827c8c', '#a09aaa'],
  concha: ['#2a2620', '#463e32', '#665a48', '#887a62', '#aa9c80', '#cac0a2', '#e6dec4'],
  dente: ['#3a4246', '#5a666c', '#7e8c92', '#a4b2b8', '#c8d2d8', '#e6ecef', '#ffffff'],
  flor: ['#2a3432', '#46544e', '#66766e', '#8a9a90', '#b2c2b6', '#d8e6dc', '#f6fffa']
};
for (const k in DRT) DRT[k] = DRT[k].map(h => ph(h));
const OB = DRT.osso;
// um ossinho deitado (de x0 a x1 na linha y): as cabeças redondas nas pontas, a haste fina
function ossinho(a, x0, x1, y, R = OB, s = 1, tilt = 0) {
  for (let x = x0; x <= x1; x++) { const yy = y + Math.round((x - x0) * tilt); a.put(x, yy, R, 4.4 + cg(x, yy, s) * 0.3); a.put(x, yy + 1, R, 2.6); }
  for (const [xe, ye] of [[x0, y], [x1, y + Math.round((x1 - x0) * tilt)]]) { a.put(xe, ye - 1, R, 5.4); a.put(xe - (xe === x0 ? 1 : -1), ye, R, 4.8); a.put(xe - (xe === x0 ? 1 : -1), ye + 1, R, 2.8); a.put(xe, ye + 2, R, 2.2); }
}
/* a escada de ossos amarrados: duas costelas finas de corrimão, degraus de ossinho amarrados com tendão; o topo com o
   nó de amarra, o pé com as pontas soltas */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), TD = DRT.tendao, y0 = k === 1 ? 1 : 0, y1 = k === 2 ? 9 : 11;
  for (let y = y0; y <= y1; y++) { const w0 = Math.round(Math.sin(y * 0.4 + s) * 0.4); for (const x0 of [1, 9]) { a.put(x0 + w0, y, OB, 4.6 + cg(x0, y, s) * 0.4); a.put(x0 + 1 + w0, y, OB, 2.8); } }
  for (const ry of (k === 2 ? [2, 6] : [2, 7])) {
    for (let x = 2; x <= 9; x++) { a.put(x, ry, OB, 5 - (x - 2) * 0.1 + cg(x, ry, s) * 0.3); a.put(x, ry + 1, OB, 2.6); }
    a.put(3, ry - 1, OB, 5.6); a.put(8, ry - 1, OB, 5.2);                                                 // as cabecinhas do ossinho
    for (const x0 of [1, 9]) { a.put(x0, ry, TD, 4.8); a.put(x0 + 1, ry, TD, 3.6); a.put(x0, ry + 1, TD, 3.4); a.put(x0 + 1, ry + 1, TD, 2.4); a.put(x0 + 1, ry - 1, TD, 4.2); }   // a amarra de tendão
  }
  if (k === 1) { for (let x = 0; x < 12; x++) { a.put(x, 0, TD, 4.6 - x * 0.12); } a.put(1, 1, TD, 3.8); a.put(10, 1, TD, 3.2); }
  if (k === 2) for (const x0 of [1, 9]) { a.put(x0, 10, OB, 3.4); a.put(x0 + 1, 11, OB, 2.2); a.put(x0 - 1, 11, TD, 3); }
  return rimOut(a, OB[0], false);
}
const ESCADA = [escadaSprite(0, 28501), escadaSprite(1, 28502), escadaSprite(2, 28503)];
/* o tendão pendurado: uma fita grossa torcida, fibras claras em espiral; o último termina desfiado */
function tendaoSprite(end, s) {
  const a = spr(), TD = DRT.tendao, len = end ? 9 : 12;
  for (let y = 0; y < len; y++) {
    const cx = 5.5 + Math.sin(y * 0.45 + s) * 0.8, hw = end && y > 6 ? 1.2 : 1.7;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const d = (x + 0.5 - cx) / hw; if (Math.abs(d) > 1) continue;
      const tw = ((y * 0.9 + d * 1.8 + s) % 3 + 3) % 3;
      a.put(x, y, TD, 4 - d * 1.4 + (tw < 0.8 ? 1 : tw > 2.3 ? -0.8 : 0) + cg(x, y, s) * 0.3);
    }
  }
  if (end) for (let k = 0; k < 3; k++) { let x = 4.4 + k * 1.2; for (let y = 8; y < 10 + k; y++) { x += (k - 1) * 0.4; a.put(x, y, TD, 4.2 - (y - 8) * 0.4); } }
  return rimOut(a, TD[0], false);
}
const TENDAO = [tendaoSprite(false, 28511), tendaoSprite(false, 28512), tendaoSprite(true, 28513)];
/* ossinhos no chão: um montinho de ossos de bicho pequeno, uma costelinha em arco, uma vértebra */
function ossinhosSprite(v, s) {
  const a = spr();
  if (v === 0) { ossinho(a, 1, 7, 9, OB, s, 0); ossinho(a, 5, 10, 8, OB, s + 1, 0.15); disc(a, 4, 10.4, 1.6, 1, OB, (dx, dy) => 4.4 - dy - dx * 0.5); }
  else if (v === 1) { for (let k = 0; k < 9; k++) { const t = k / 8, x = 2 + t * 8, y = 10 - Math.sin(t * Math.PI) * 5; a.put(x, y, OB, 5 - t); a.put(x, y + 1, OB, 2.6); } ossinho(a, 1, 5, 10, OB, s, 0); }
  else { disc(a, 6, 9, 2.6, 2, OB, (dx, dy) => 4.6 - dy * 1.2 - dx * 0.5); a.put(6, 9, OB, 1); a.put(3, 7, OB, 5); a.put(9, 7, OB, 4); a.put(6, 6, OB, 5.4); ossinho(a, 8, 11, 11, OB, s, 0); }
  return rimOut(a, OB[0], true);
}
const OSSINHOS = [ossinhosSprite(0, 28521), ossinhosSprite(1, 28522), ossinhosSprite(2, 28523), flipX(ossinhosSprite(0, 28524))];
/* a lamparina de tutano: uma vértebra virada para cima servindo de tigela, o tutano dentro, o pavio (a chama é ao vivo) */
const LAMP_F = [6, 4];
function lamparinaSprite(v, s) {
  const a = spr(), TU = DRT.tutano;
  disc(a, 6, 9.4, 4, 2.2, OB, (dx, dy) => 4.4 - dy * 1.2 - dx * 0.6 + cg(dx * 9 | 0, dy * 9 | 0, s) * 0.3);   // o corpo da vértebra
  for (let x = 3; x <= 9; x++) { a.put(x, 7, OB, 5.4 - (x - 3) * 0.12); a.put(x, 8, TU, x < 5 ? 4.6 : 3.4); }   // a beira e o tutano
  a.put(1, 9, OB, 4); a.put(11, 9, OB, 2.8); a.put(2, 10, OB, 3.2); a.put(10, 10, OB, 2.4);                  // as apófises de lado
  if (v) { a.put(4, 11, OB, 3); a.put(8, 11, OB, 2.6); }
  a.put(6, 6, DRT.pau, 2); a.put(6, 5, DRT.pau, 1);                                                          // o pavio
  return rimOut(a, OB[0], true);
}
const LAMPARINA = [lamparinaSprite(0, 28531), lamparinaSprite(1, 28532)];
/* a flor-de-cinza: caule fino e pálido saindo do pó, folhas estreitas, a corola em sino virada para baixo (acende fria) */
const FLOR_C = [[6, 4], [5, 3]];
function florSprite(v, s) {
  const a = spr(), F = DRT.flor, [fx, fy] = FLOR_C[v];
  for (let y = fy + 1; y < 12; y++) { const x = fx + Math.round(Math.sin(y * 0.5 + s) * 0.6); a.put(x, y, F, 2.6 + (y < 8 ? 0.6 : 0)); }
  for (const [x, y, d] of [[fx - 2, 9, -1], [fx + 2, 8, 1], [fx - 1, 7, -1]]) { a.put(x, y, F, 3.8); a.put(x + d, y - 1, F, 4.4); }
  disc(a, fx + 0.5, fy + 0.6, 2.2, 1.6, F, (dx, dy) => 4.8 - dy * 0.8 - dx * 0.6);                        // o sino
  a.put(fx - 1, fy + 2, F, 5.6); a.put(fx + 1, fy + 2, F, 4.6); a.put(fx, fy + 2, F, 6);                    // a boca do sino
  if (v) a.put(fx + 3, fy + 3, F, 4.8);
  return rimOut(a, F[0], true);
}
const FLOR = [florSprite(0, 28541), florSprite(1, 28542), flipX(florSprite(0, 28543))];
/* o fio de pó: um torrão de pó grudado no teto, o fio escorrendo é ao vivo */
function poCaiSprite(s) { const a = spr(), P = DRT.cinza; for (let x = 3; x <= 8; x++) { a.put(x, 0, P, 5 - Math.abs(x - 5.5) * 0.4); if (x > 3 && x < 8) a.put(x, 1, P, 4 - Math.abs(x - 5.5) * 0.6); } a.put(5, 2, P, 3.4); a.put(6, 2, P, 2.6); return rimOut(a, P[0], false); }
const POCAI = [poCaiSprite(28551)];
/* o líquen de osso: forro cinza-esverdeado no teto, franjas curtas penduradas, tufos */
function liquenSprite(v, s) {
  const a = spr(), L = DRT.liquen;
  for (let x = 0; x < 12; x++) {
    const n = 2 + ((hash2(x, v, s) * 4) | 0) + (x % 4 === v ? 2 : 0);
    for (let y = 0; y < n; y++) a.put(x, y, L, 4.6 - y * 0.6 + cg(x, y, s) * 0.8);
    if (hash2(x, 3, s) < 0.3) a.put(x, n + 1, L, 3);
  }
  return rimOut(a, L[0], false);
}
const LIQUEN = [liquenSprite(0, 28561), liquenSprite(1, 28562), liquenSprite(2, 28563)];
/* a lasca da foice: um caco de lâmina de adamantita cravado de ponta no chão, o fio quase branco (brilha frio) */
const LASCA_TIP = [[5, 1], [7, 2]];
function lascaSprite(v, s) {
  const a = spr(), F = DRT.foice, [tx, ty] = LASCA_TIP[v], bx = v ? 4 : 7;
  for (let y = ty; y < 12; y++) {
    const t = (y - ty) / (11 - ty), cx = lerp(tx, bx, t), hw = 0.6 + t * 1.6;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) { const d = (x + 0.5 - cx) / hw; if (Math.abs(d) > 1) continue; a.put(x, y, F, d < -0.5 ? 6 : d < 0.2 ? 4.4 - t : 2.4 - t * 0.6); }
  }
  for (let x = 2; x <= 10; x++) a.put(x, 11, DRT.cinza, 3 - Math.abs(x - 6) * 0.3);                       // o pó amontoado no pé
  return rimOut(a, F[0], true);
}
const LASCA = [lascaSprite(0, 28571), lascaSprite(1, 28572)];
/* a estaca de catador: um pau fincado com um crânio de bicho na ponta, ossinhos e penas pretas pendurados num fio */
function estacaSprite(v, s) {
  const a = spr(), PA = DRT.pau, PE = DRT.pena;
  for (let y = 3; y < 12; y++) { a.put(6, y, PA, 4 - (y > 9 ? 1 : 0)); a.put(7, y, PA, 2.2); }
  disc(a, 6.5, 2.2, 2.4, 2, OB, (dx, dy) => 4.8 - dy - dx * 0.8); a.put(5, 2, OB, 0.6); a.put(7, 2, OB, 0.6); a.put(6, 4, OB, 1.2);   // o crânio
  for (const [x, y, k] of v ? [[4, 6, 0], [9, 7, 1]] : [[9, 6, 0], [4, 7, 1]]) {
    for (let j = 0; j < 3; j++) a.put(x, y + j, PA, 1.6);
    if (k === 0) { a.put(x, y + 3, PE, 4); a.put(x, y + 4, PE, 3); a.put(x + (x > 6 ? 1 : -1), y + 4, PE, 2.4); a.put(x, y + 5, PE, 1.8); }
    else { a.put(x, y + 3, OB, 5); a.put(x, y + 4, OB, 3.6); }
  }
  return rimOut(a, PA[0], true);
}
const ESTACA = [estacaSprite(0, 28581), estacaSprite(1, 28582)];
/* a concha fóssil: uma espiral de pedra meio enterrada no pó */
function fossilSprite(v, s) {
  const a = spr(), C = DRT.concha, cx = v ? 5.5 : 6.5, cy = 8.5, r = v ? 3 : 3.6;
  disc(a, cx, cy, r, r * 0.9, C, (dx, dy, d, x, y) => { const ang = Math.atan2(dy, dx), sp = (Math.sqrt(d) * 2.6 - ang / 6.2832 + 4) % 1; return sp < 0.2 ? 1.6 : 4.4 - dy * 1.1 - dx * 0.6; });
  for (let x = 1; x <= 10; x++) a.put(x, 11, DRT.cinza, 3.2 - Math.abs(x - cx) * 0.25);
  return rimOut(a, C[0], true);
}
const FOSSIL = [fossilSprite(0, 28591), fossilSprite(1, 28592), flipX(fossilSprite(0, 28593))];
/* a lasca de osso fincada: uma ponta de osso saindo do chão, inclinada */
function espinhoSprite(v, s) {
  const a = spr(), tip = v ? 3 : 8, b0 = v ? 6 : 5;
  for (let y = 1; y < 12; y++) { const t = (y - 1) / 10, cx = lerp(tip, b0, t), hw = 0.4 + t * 1.8; for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) { const d = (x + 0.5 - cx) / hw; if (Math.abs(d) > 1) continue; a.put(x, y, OB, 4.8 - d * 1.4 - t * 0.6 + cg(x, y, s) * 0.3); } }
  return rimOut(a, OB[0], true);
}
const ESPINHO = [espinhoSprite(0, 28601), espinhoSprite(1, 28602)];
/* a coluna de dente: esmalte do chão ao teto, fios verticais, a raiz escura no pé, a coroa gasta em cima */
function colunaSprite(k, s) {   // 0 pé, 1 meio, 2 cabeça
  const a = spr(), D = DRT.dente;
  for (let y = 0; y < 12; y++) {
    const hw = k === 0 ? 3.4 + (y > 8 ? (y - 8) * 0.6 : 0) : k === 2 ? 3.4 + (y < 3 ? (3 - y) * 0.6 : 0) : 3.4;
    for (let x = Math.floor(5.5 - hw); x <= Math.ceil(5.5 + hw); x++) {
      const d = (x + 0.5 - 6) / hw; if (Math.abs(d) > 1) continue;
      let l = 4.6 - d * 1.6 + Math.sin(x * 2.1 + s) * 0.3 + cg(x, y, s) * 0.2;
      if (Math.abs(d + 0.45) < 0.12) l = 6;                                                               // o brilho molhado
      a.put(x, y, k === 0 && y > 8 ? DRT.tendao : D, k === 0 && y > 8 ? l - 1.4 : l);
    }
  }
  return rimOut(a, D[0], false);
}
const COLUNA = [colunaSprite(0, 28611), colunaSprite(1, 28612), colunaSprite(2, 28613)];

DECO[TT_ESCADA] = ESCADA; DECO[TT_TENDAO] = TENDAO; DECO[TT_OSSINHOS] = OSSINHOS; DECO[TT_LAMPARINA] = LAMPARINA; DECO[TT_FLOR] = FLOR; DECO[TT_PO_CAI] = POCAI;
DECO[TT_LIQUEN] = LIQUEN; DECO[TT_LASCA] = LASCA; DECO[TT_ESTACA] = ESTACA; DECO[TT_FOSSIL] = FOSSIL; DECO[TT_ESPINHO] = ESPINHO; DECO[TT_COLUNA] = COLUNA;
const TT_DECO = [
  // id, dureza, cor no mapa, o que solta
  [TT_ESCADA, 0.25, '#bcb296', 'osso_tita'], [TT_TENDAO, 0.15, '#a8845c', 'tendao'], [TT_OSSINHOS, 0.03, '#ddd4ba', null], [TT_LAMPARINA, 0.1, '#f0d890', null],
  [TT_FLOR, 0.03, '#d8e6dc', null], [TT_PO_CAI, 0.02, '#9e9a92', null], [TT_LIQUEN, 0.03, '#647456', null], [TT_LASCA, 0.6, '#b0d0c4', null],
  [TT_ESTACA, 0.12, '#866648', null], [TT_FOSSIL, 0.3, '#aa9c80', null], [TT_ESPINHO, 0.2, '#ddd4ba', null], [TT_COLUNA, 1.6, '#e6ecef', 'esmalte']
];
for (const [t, dig, col, drop] of TT_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[TT_LAMPARINA] = 0.85; EMIT[TT_FLOR] = 0.28; EMIT[TT_LASCA] = 0.38;
EMIT[TT_PO_CAI] = 0.02;   // quase nada: só para entrar na lista do 07 e o fio ser desenhado ao vivo
// o que cai quando o apoio some (56, 87); escada, tendão e coluna ficam (atravessam vãos)
for (const t of [TT_PO_CAI, TT_LIQUEN]) CV_HANGS[t] = 1;
for (const t of [TT_OSSINHOS, TT_LAMPARINA, TT_FLOR, TT_LASCA, TT_ESTACA, TT_FOSSIL, TT_ESPINHO]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[TT_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== TT_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== TT_ESCADA ? arr[2] : arr[0];
DECO_PICK[TT_TENDAO] = (gx, gy, arr) => tileAt(gx, gy + 1) === TT_TENDAO || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[TT_OSSINHOS] = (gx, gy, arr) => arr[vr(gx, gy, 28521, 4)];
DECO_PICK[TT_LAMPARINA] = (gx, gy, arr) => arr[vr(gx, gy, 28531, 2)];
const florV = (gx, gy) => vr(gx, gy, 28541, 3);
DECO_PICK[TT_FLOR] = (gx, gy, arr) => arr[florV(gx, gy)];
DECO_PICK[TT_LIQUEN] = (gx, gy, arr) => arr[vr(gx, gy, 28561, 3)];
const lascaV = (gx, gy) => vr(gx, gy, 28571, 2);
DECO_PICK[TT_LASCA] = (gx, gy, arr) => arr[lascaV(gx, gy)];
DECO_PICK[TT_ESTACA] = (gx, gy, arr) => arr[vr(gx, gy, 28581, 2)];
DECO_PICK[TT_FOSSIL] = (gx, gy, arr) => arr[vr(gx, gy, 28591, 3)];
DECO_PICK[TT_ESPINHO] = (gx, gy, arr) => arr[vr(gx, gy, 28601, 2)];
DECO_PICK[TT_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== TT_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== TT_COLUNA ? arr[2] : arr[1];

// a escada de ossos e o tendão se escalam como a corrente da catedral; a escada conta como a escada da mina (a pose de
// subir de frente, 88), o tendão como corda
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, TT_ESCADA) || _tt(e, TT_TENDAO))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, TT_ESCADA)); }; }

/* ================= ao vivo: a chama da lamparina, a luz fria, o fio de pó ================= */
const TT_GL = {};
const ttGlow = (k, r, col) => TT_GL[k] || (TT_GL[k] = glow(r, col));
const ttOut = cy => cy + VH < (TT_S0 - 6) * T || cy > (TT_S0 + TT_D + 6) * T;
const CHAMA = ['#fffbe8', '#ffe9a8', '#f0c870', '#c8904a'];
HOOK.drawGlow.push((cx, cy) => {
  if (ttOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < TT_OSSO || t > TT_COLUNA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case TT_LAMPARINA: {
        const f = 0.9 + Math.sin(tm * 9 + gx) * 0.05 + Math.sin(tm * 21 + gy) * 0.04;
        lc.globalAlpha = 0.3 * f; lc.drawImage(ttGlow('lb', 32, '#f0d890'), x + LAMP_F[0] - 32, y + LAMP_F[1] - 32);
        lc.globalAlpha = 0.45 * f; lc.drawImage(ttGlow('ls', 8, '#fff2c0'), x + LAMP_F[0] - 8, y + LAMP_F[1] - 8);
        break;
      }
      case TT_FLOR: { const [fx, fy] = FLOR_C[florV(gx, gy) === 1 ? 1 : 0], X = florV(gx, gy) === 2 ? 11 - fx : fx; lc.globalAlpha = 0.16 + Math.sin(tm * 1.2 + gx) * 0.05; lc.drawImage(ttGlow('f10', 10, TT_COL.frio), x + X + 0.5 - 10, y + fy + 2 - 10); break; }
      case TT_LASCA: { const [tx, ty] = LASCA_TIP[lascaV(gx, gy)]; lc.globalAlpha = 0.16 + Math.max(0, Math.sin(tm * 1.3 + gx * 0.7)) * 0.1; lc.drawImage(ttGlow('c14', 14, TT_COL.frio), x + tx - 14, y + ty + 3 - 14); break; }
      case TT_O_ADAMANTITA: if ((gx + gy) & 1) break; lc.globalAlpha = 0.07 + Math.max(0, Math.sin(tm * 1.5 + gx * 1.3 + gy)) * 0.06; lc.drawImage(ttGlow('a12', 12, TT_COL.frio), x + 6 - 12, y + 6 - 12); break;
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (ttOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < TT_OSSO || t > TT_COLUNA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case TT_LAMPARINA: {   // a chama pálida: o miolo sobe e desce, uma língua troca de lado
        const f = Math.floor(tm * 8 + gx * 3) % 4, fx = x + LAMP_F[0], fy = y + LAMP_F[1];
        lc.fillStyle = CHAMA[2]; lc.fillRect(fx + (f === 2 ? 1 : f === 3 ? -1 : 0), fy - 2 - (f === 1 ? 1 : 0), 1, 1);
        lc.fillStyle = CHAMA[1]; lc.fillRect(fx, fy - 1, 1, 1); lc.fillStyle = CHAMA[0]; lc.fillRect(fx, fy, 1, 1);
        break;
      }
      case TT_LASCA: case TT_O_ADAMANTITA: {   // um brilho frio corre pelo fio de vez em quando
        const ph0 = (tm * 0.3 + hash2(wrapX(gx), gy, 28701) * 7) % 1; if (ph0 > 0.07) break;
        const tp = t === TT_LASCA ? LASCA_TIP[lascaV(gx, gy)] : adaTip(gx, gy); if (!tp) break;
        const L = ph0 < 0.035 ? 1 : 2; lc.fillStyle = '#ffffff'; lc.fillRect(x + tp[0], y + tp[1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + tp[0] - L + 1, y + tp[1], L * 2 - 1, 1);
        break;
      }
      case TT_PO_CAI: {   // o fio de pó escorrendo do torrão até o chão, em grãos, e um sopro no pé
        let fl = 1; while (fl < 16 && !solidAt(gx, gy + fl)) fl++;
        const H = fl * T - 3, h0 = hash2(wrapX(gx), gy, 28702), on = Math.sin(tm * 0.35 + h0 * 20) > -0.3; if (!on) break;
        lc.fillStyle = '#bebab0';
        for (let k = 0; k < 7; k++) { const p = ((tm * 1.4 + k / 7 + h0) % 1), yy = 3 + p * p * H; lc.globalAlpha = 0.55 + (k & 1) * 0.3; lc.fillRect(x + 5 + ((k * 3) % 3 === 0 ? 0 : 1), y + yy, 1, 1 + (p > 0.4 ? 1 : 0)); }
        const sp = (tm * 2 + h0) % 1; lc.globalAlpha = 0.5 * (1 - sp); lc.fillRect(x + 5 - Math.round(sp * 3), y + fl * T - 1 - Math.round(Math.sin(sp * 3) * 1.5), 1, 1); lc.fillRect(x + 6 + Math.round(sp * 3), y + fl * T - 1 - Math.round(Math.sin(sp * 3) * 1.5), 1, 1);
        lc.globalAlpha = 1;
        break;
      }
      case TT_FLOR: {   // um esporo de luz cai do sino de vez em quando
        const ph0 = (tm * 0.25 + hash2(wrapX(gx), gy, 28703) * 5) % 1; if (ph0 > 0.4) break;
        const [fx, fy] = FLOR_C[florV(gx, gy) === 1 ? 1 : 0], X = florV(gx, gy) === 2 ? 11 - fx : fx;
        lc.globalAlpha = 1 - ph0 / 0.4; lc.fillStyle = '#e8fff6'; lc.fillRect(x + X, y + fy + 3 + Math.round(ph0 * 14), 1, 1); lc.globalAlpha = 1;
        break;
      }
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(TTART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, pp, wrapT, W2, RX, IVORY, PORE, SHELL, VERDI, RIVET, SOOT, FRIO, GLOSS, DRT, ttGlow, TT_GL, ttOut,
  vOsso, vEsponja, vTutano, vRocha, vPo, vDente, vCartilagem, vCinza, vBronze, vDedos, BKV, ESCADA, TENDAO, LASCA, LAMPARINA, LAMP_F, ossinho });
}
