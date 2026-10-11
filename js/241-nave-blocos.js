'use strict';

/* ================= a Nave Caída: blocos, paredes, terceira camada, minérios, decoração, o neon =================
   Uma nave dos Visitantes enterrada e ainda ligada. Na Cratera, a rocha que o calor da queda fundiu em vidro
   verde-garrafa, liso e rachado em estrela onde as pedras bateram, e a escória preta, borbulhada, com rachaduras
   verdes que ainda brilham. No Casco, as chapas grafite com rebites e emendas, os painéis com faixas de neon (rosa,
   ciano, verde, a cor muda pela posição) e a grade dos pisos com o vão escuro por baixo. Nos Laboratórios, a liga
   branco-perolada com reflexo violeta e rosa, o vidro ciano e a gosma verde endurecida, cheia de bolhas. No Núcleo,
   o metal do reator branco-violeta com as linhas de energia, o cristal de plasma nas 6 cores do adesivo, a barreira
   de energia rosa, o rastro arco-íris do Olho-Cometa, o anel holográfico laranja e o planeta listrado.
   Como o 191 e o 131, cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda
   acesa, sombra e oclusão vêm do 07. Paredes e terceira camada só leem o tom (.v): o neon delas é o tom mais claro
   da própria paleta. A decoração de 1 bloco são sprites de 12x12 em rampas com luz de cima à esquerda; o que pisca
   e se mexe (o tubo que falha, a gota que cai, as faíscas, o holograma girando, as faixas do feixe, o bulbo, a
   estrelinha, o brilho da xenita) é desenhado ao vivo, só sobre o que está na tela. Ids: 240-nave-api. */
const NVART = {};   // ferramentas para 242-nave-objetos, os Visitantes (243, 244), o Olho-Cometa (246) e a xenita (247)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro (seção 12 da ficha) ---- */
pal('nvVidroImp', ['#06120c', '#0c2216', '#143422', '#1e4a30', '#2c6642', '#4a8a5e']);
pal('nvEscoria', ['#0a0a0c', '#16161a', '#222228', '#303038', '#40404a', '#54545e']);
pal('nvCasco', ['#14161c', '#20242c', '#2e3440', '#3e4654', '#525c6c', '#6c7888']);
pal('nvGrade', ['#0a0c10', '#1a1e26', '#2a303a', '#3c4450', '#545e6c', '#76808e']);
pal('nvLiga', ['#4a4660', '#6a6684', '#8e8aa8', '#b4b0cc', '#d6d2ea', '#f2f0ff']);
pal('nvVidro', ['#062028', '#0c3640', '#125262', '#1c7a8c', '#36aec0', '#8ae8f4']);
pal('nvGosma', ['#1a4a06', '#2e7a0c', '#4aa814', '#6cd422', '#94f03c', '#c8ff7a']);
pal('nvPlasma', ['#1a0a2a', '#2e1450', '#4a2478', '#7040a8', '#a070d8', '#e0c8ff']);
pal('nvReator', ['#2a1a3a', '#3e2a56', '#563e78', '#7258a0', '#9478c8', '#c0a8f0']);
pal('nvBarreira', ['#2a0620', '#4a0c3a', '#7a1660', '#b42a8c', '#ff3ec8', '#ffc0ee']);
pal('nvRastro', ['#3a1a4a', '#6a3a8a', '#a070c0', '#d0a8e8', '#f0d8ff', '#ffffff']);
pal('nvAnel', ['#3a1406', '#6a2a0a', '#a84a12', '#e0781e', '#ffa83a', '#ffe0a0']);
pal('nvPlaneta', ['#3a0c0a', '#6a1a12', '#a0301a', '#d0522a', '#f08a3a', '#ffc880']);
// paredes de fundo: sempre bem mais escuras que o chão da frente; o neon do painel é o tom de cima, apagado
pal('nvRochaW', ['#030605', '#050a07', '#08100b', '#0b150f', '#0f1b13', '#142419']);
pal('nvCascoW', ['#05060a', '#080a0e', '#0c0f14', '#10141a', '#151a21', '#1c222b']);
pal('nvLabW', ['#0b0a11', '#100f17', '#16141e', '#1c1a26', '#23202f', '#2c2839']);
pal('nvReatorW', ['#08050c', '#0c0812', '#110b19', '#160f21', '#1c132a', '#2e1a46']);
pal('nvNeonW', ['#05060a', '#090b10', '#0e1117', '#13171f', '#2a0e34', '#5a1a66']);
// a terceira camada: o céu holográfico (o tom 3 e o 4 são o planeta listrado, o 5 as estrelas), as costelas da nave,
// os tanques gigantes (o líquido verde apagado no tom 4 e 5)
pal('dpNvCeu', ['#010106', '#04041a', '#0c0a2e', '#3a1230', '#7a3218', '#d8ecff']);
pal('dpNvCostelas', ['#020203', '#05060a', '#090b10', '#0e1118', '#151a24', '#123848']);
pal('dpNvTanques', ['#020403', '#040806', '#07100a', '#0c1a10', '#123a1a', '#2a7a2e']);

const wrapT = v => ((v % TP) + TP) % TP;
const RX = hexes => hexes.map(h => ph(h));
const mixP = (a, b, t) => { const A = rgb(a), B = rgb(b); return pack(lerp(A[0], B[0], t) | 0, lerp(A[1], B[1], t) | 0, lerp(A[2], B[2], t) | 0); };
// uma rampa de 7 tons a partir de uma cor de neon: do apagado ao miolo quase branco
const neonRamp = hex => [ph(hex, 0.12), ph(hex, 0.25), ph(hex, 0.45), ph(hex, 0.72), ph(hex), mixP(hex, '#ffffff', 0.45), mixP(hex, '#ffffff', 0.82)];
const NEONR = {}; for (const k in NV_NEON_COL) NEONR[k] = neonRamp(NV_NEON_COL[k]);
const ARCR = NV_ARCO.map(neonRamp);                                                       // o arco-íris do adesivo
const VIG = RX(['#1e4a30', '#4a8a5e', '#8ac8a0', '#d8fff0']);                            // o reflexo e a rachadura do vidro
const GLO = RX(['#123a0c', '#2a7a12', '#5ad82a', '#b8ff7a']);                            // a rachadura acesa da escória
const SHEEN = RX(['#e8d0f8', '#f6dcff', '#ffd8f0', '#dcd0ff', '#fff4ff']);                // o reflexo perolado da liga
const ENER = RX(['#7a58c0', '#b090f0', '#e8d8ff', '#ffffff']);                           // as linhas de energia do reator
const GLASS = RX(['#5ad8e8', '#a8f4fc', '#e8ffff']);                                     // o reflexo do vidro de laboratório
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };

/* ---- onde cada cor de neon vai (as texturas, os sprites e os brilhos ao vivo leem a mesma conta) ---- */
const STRIP_K = ['rosa', 'ciano', 'verde'], TUBE_K = ['rosa', 'ciano', 'verde', 'violeta'], STAR_K = ['amarelo', 'rosa', 'ciano'];
// a faixa do painel de neon: trechos de 4 blocos, cada um de uma cor (wx, wy em pixels do mundo)
const stripIdx = (wx, wy) => (hash2(Math.floor(wrapT(wx) / 48), Math.floor(wrapT(wy) / 12), 24131) * 3) | 0;
// a faixa do arco-íris do cristal de plasma em que um pixel cai (0..5, vermelho a violeta)
const plasmaBand = (wx, wy) => { const b = Math.floor((wrapT(wx) * 0.5 + wrapT(wy) + cn(wrapT(wx), wrapT(wy), 12, 12, 24160) * 7 + 240) / 20); return ((b % 6) + 6) % 6; };
// a fileira de tubos de neon: começa no primeiro da esquerda, e a cor (e a falha) sai de onde ela começa
function nvNeonRun(gx, gy) { let s = gx; for (let k = 0; k < 12 && tileAt(s - 1, gy) === NV_NEON; k++) s--; return wrapX(s); }
const nvNeonIdx = (gx, gy) => (hash2(nvNeonRun(gx, gy), gy, 24301) * 4) | 0;
// um tubo em cada cinco é velho e falha: apaga por instantes, gaguejando
function nvNeonOff(gx, gy) { const s = nvNeonRun(gx, gy), h = hash2(s, gy, 24302); if (h > 0.2) return false; const p = (gameTime * (0.11 + h * 0.6) + h * 13) % 1; return p > 0.88 && ((gameTime * 17 + h * 7) | 0) % 3 !== 0; }

/* ---- o chão sólido ---- */
function vVidroImp(x, y) {   // vidro de impacto: verde-garrafa escuro e liso, um reflexo longo inclinado, estrelas de rachadura
  let v = 1.9 + cn(x, y, 60, 60, 24101) * 1.1 + cn(x, y, 16, 16, 24102) * 0.35 + cg(x, y, 24103) * 0.16;
  const sh = Math.sin((x - y * 0.6) * 0.0785 + cn(x, y, 30, 60, 24104) * 0.4);
  if (sh > 0.975) { MATX = VIG[sh > 0.993 ? 2 : 1]; return -9; }                                // o reflexo
  if (sh > 0.86) v += (sh - 0.86) * 10;
  const c = cells(x, y, 30, 24105, 1);
  if (c.id < 0.26) {   // uma estrela de rachaduras onde algo bateu: raios finos e um anel quebrado
    const R = 7 + c.id * 40, d = c.d1;
    if (d < 1.3) { MATX = VIG[3]; return -9; }
    if (d < R) {
      const n = 5 + ((c.id * 40) | 0) % 3, a = Math.atan2(c.oy, c.ox) / 6.2832 * n + c.id * 9, f = a - Math.round(a), perp = Math.abs(f) * 6.2832 / n * d;
      const w = 0.6 * (1 - d / R) + 0.32;
      if (perp < w) { MATX = VIG[d < R * 0.4 ? 2 : 1]; return -9; }
      if (perp < w + 0.9 && f > 0) v -= 1.0;                                                     // a sombra do lado de baixo do raio
      const ring = Math.abs(d - R * 0.55);
      if (ring < 0.5 && hash2(Math.floor(a * 3), 0, 24106) < 0.6) v -= 1.3; else if (ring < 1.3 && d > R * 0.55) v += 0.7;
    }
  }
  if (hash2(x, y, 24107) < 0.004) v += 2;                                                       // um grão de areia preso, aceso
  return v;
}
function vEscoria(x, y) {   // escória: preta, derretida em cordas, poros de bolha, e rachaduras verdes que ainda brilham
  let v = 1.7 + cn(x, y, 24, 24, 24111) * 1.6 + cn(x, y, 80, 80, 24112) * 0.7 + cg(x, y, 24113) * 0.45;
  const rope = Math.sin(x * 0.16 + y * 0.04 + cn(x, y, 20, 40, 24114) * 10); if (rope > 0.78) v += 0.9; else if (rope < -0.85) v -= 0.6;
  const c = cells(x, y, 7, 24115, 1.1);
  if (c.id < 0.28 && c.d1 < 1.6) return c.ox + c.oy > 0.6 ? 2.2 : 0.2;                           // poro: escuro, a borda de baixo pega luz
  const zone = cn(x, y, 8, 8, 24118);
  if (zone > -0.06) {
    const cr = Math.abs(cn(x, y, 16, 16, 24116)) / (0.6 + zone * 3);
    if (cr < 0.012) { MATX = GLO[cr < 0.005 ? 3 : 2]; return -9; }                              // a rachadura acesa
    if (cr < 0.024) { MATX = GLO[hash2(x, y, 24117) < 0.45 ? 1 : 0]; return -9; }                // o verde em volta, apagando
  }
  if (hash2(x, y, 24119) < 0.02) v += 1.2;
  return v;
}
// chapas em fiadas: cada fiada com a sua largura de chapa (24, 40, 48 ou 60) e o seu deslocamento
const PLW = [24, 40, 48, 60];
function plate(x, y, ph0, s) {
  const row = Math.floor(wrapT(y) / ph0), ly = wrapT(y) % ph0, pw = PLW[(hash2(row, 0, s) * 4) | 0], xx = wrapT(x + ((hash2(row, 1, s) * 240) | 0)), lx = xx % pw, id = Math.floor(xx / pw);
  return { row, ly, lx, pw, id, h: hash2(id, row, s + 2) };
}
function vCasco(x, y) {   // chapa do casco: placas grafite em fiadas, emendas fundas, rebites, fuligem e arranhões
  const p = plate(x, y, 12, 24121), { ly, lx, pw, h } = p;
  if (ly === 11 || lx === pw - 1) return 0.3;                                                   // a emenda
  let v = 2.5 + (h - 0.5) * 0.9 + cn(x, y, 60, 6, 24122) * 0.6 + cg(x, y, 24123) * 0.25;      // escovada na horizontal
  if (ly === 0) v += 1.1; else if (ly === 10) v -= 0.8;
  if (lx === 0) v += 0.5; else if (lx === pw - 2) v -= 0.5;
  if ((ly === 2 || ly === 8) && (lx === 2 || lx === pw - 4 || (pw > 40 && lx === (pw >> 1)))) return 5.2;   // rebite
  if ((ly === 3 || ly === 9) && (lx === 3 || lx === pw - 3 || (pw > 40 && lx === (pw >> 1) + 1))) return 1.0;
  if (h < 0.12 && ly > 3 && ly < 8 && lx > 4 && lx < pw - 5) return ly % 2 ? 0.7 : 3.2;          // uma grelha de ventilação
  if (h > 0.9 && Math.abs(lx - ly * 2.2 - h * 30) < 0.6) v -= 1.3;                               // um arranhão
  const soot = cn(x, y, 30, 30, 24124); if (soot > 0.24) v -= (soot - 0.24) * 5;                 // queimado na queda
  return v;
}
function vPainel(x, y) {   // painel de neon: chapa com um canal no meio de cada bloco, a faixa acesa correndo de bloco em bloco
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12, sx = wrapT(x) % 48;
  if (ly === 11) return 0.4;
  if (ly === 4) return 0.5;                                                                      // o canal, fundo
  if (ly === 7) return 3.8;                                                                      // o lábio de baixo do canal
  if (ly === 5 || ly === 6) {
    if (sx === 0 || sx === 47) return 1.2;                                                       // a tampa de cada trecho
    const R = NEONR[STRIP_K[stripIdx(x, y)]];
    MATX = R[ly === 5 ? 6 : (sx + ly) % 9 === 0 ? 5 : 4]; return -9;
  }
  let v = 2.5 + cn(x, y, 50, 8, 24132) * 0.5 + cg(x, y, 24133) * 0.25;
  if (ly === 0) v += 1.1; else if (ly === 3 || ly === 10) v -= 0.6;
  if (lx === 0 && ly > 7) v += 0.5; else if (lx === 11 && ly > 7) return 0.6;                    // a junta de baixo entre painéis
  if (ly === 9 && lx === 9) { MATX = NEONR[STRIP_K[stripIdx(x, y)]][hash2(Math.floor(wrapT(x) / 12), Math.floor(wrapT(y) / 12), 24134) < 0.5 ? 5 : 3]; return -9; }   // o ledzinho
  if (ly === 9 && (lx === 2 || lx === 4 || lx === 6)) v -= 1.1;                                  // a escrita dos Visitantes, gravada
  if (ly === 2 && lx > 1 && lx < 10 && hash2(Math.floor(wrapT(x) / 12), Math.floor(wrapT(y) / 12), 24135) < 0.3) v -= 0.9;
  return v;
}
function vGrade(x, y) {   // grade de piso: um trilho aceso em cima, a treliça em diagonal, o vão escuro por baixo dela
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  if (ly === 0) return 4.5 + cg(x, y, 24141) * 0.4;
  if (ly === 1) return 3.2;
  if (ly === 11) return 0.8;
  if (ly === 10) return 2.4 + cg(x, y, 24142) * 0.3;
  if (lx === 0) return 3.0;                                                                      // o montante entre blocos
  if (lx === 11) return 1.2;
  const a = ((lx + ly) % 4 + 4) % 4, b = ((lx - ly) % 4 + 4) % 4;
  if (a === 0) return 3.6 + cg(x, y, 24143) * 0.3;
  if (b === 0) return 2.6 + cg(x, y, 24144) * 0.3;
  return ly < 4 ? 0.0 : 0.4;                                                                     // o vão
}
function vLiga(x, y) {   // liga alienígena: branco-perolada em placas de cantos redondos, um arco gravado, o reflexo violeta e rosa correndo
  const { ly, lx, pw, h, id, row } = plate(x, y, 12, 24151);
  if (ly === 11 || lx === pw - 1) return 1.3;                                                   // a emenda
  if (Math.min(lx, pw - 2 - lx) + Math.min(ly, 10 - ly) < 2) return 2.0;                         // o canto arredondado
  let v = 3.5 + (h - 0.5) * 0.5 + cn(x, y, 70, 70, 24153) * 0.5 + cg(x, y, 24154) * 0.12;
  if (ly === 0) v += 1.1; else if (ly === 10) v -= 0.9;
  if (lx === 0) v += 0.6; else if (lx === pw - 2) v -= 0.7;
  if (h < 0.18) { const d = Math.hypot(lx - pw / 2, (ly - 13) * 1.3); if (Math.abs(d - 8) < 0.55) v -= 1.2; else if (d > 8 && d < 9.2) v += 0.7; }   // um arco gravado, o sinal deles
  if (h > 0.86 && ly === 5 && lx === pw - 5) { MATX = NEONR.violeta[5]; return -9; }                // uma luzinha
  const s = Math.sin((x + y) * 0.0524 + cn(x, y, 40, 40, 24156) * 1.5);
  if (s > 0.9) { const k = Math.sin((x - y) * 0.0262 + cn(x, y, 20, 20, 24157) * 3); MATX = SHEEN[s > 0.975 ? 4 : k > 0.3 ? 2 : k < -0.3 ? 3 : (s > 0.93 ? 1 : 0)]; return -9; }
  return v;
}
function vVidroLab(x, y) {   // vidro de laboratório: ciano, quase liso, dois reflexos inclinados e o caixilho fino de cada placa
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  let v = 2.4 + cn(x, y, 40, 80, 24161) * 0.7 + cg(x, y, 24162) * 0.1 - ly * 0.05;
  if (ly === 0) v += 1.2; else if (ly === 11) v -= 0.9;
  if (lx === 0) v += 0.4; else if (lx === 11) v -= 0.6;
  const d = wrapT(x * 1 - y * 0.75 + 240) % 30;
  if (d < 1.2) { MATX = GLASS[d < 0.5 ? 2 : 1]; return -9; }
  if (d > 3 && d < 4) { MATX = GLASS[0]; return -9; }
  if (d > 1.2 && d < 3) v += 1.2;
  if (hash2(x, y, 24163) < 0.003) { MATX = GLASS[1]; return -9; }                                // bolhinha presa
  return v;
}
function vGosma(x, y) {   // gosma endurecida: verde-limão, escorrida em fios, bolhas presas, um brilho molhado
  let v = 3.0 + cn(x, y, 30, 30, 24171) * 1.0 + cn(x, y, 8, 8, 24172) * 0.35 + cg(x, y, 24173) * 0.2;
  const dx = x + cn(x, y, 40, 6, 24174) * 10, run = ((dx % 7) + 7) % 7;
  if (run < 1) v += 0.7; else if (run > 5.8) v -= 0.6;
  const c = cells(x, y, 9, 24175, 1);
  if (c.id < 0.34 && c.d1 < 2.6) {   // uma bolha
    if (c.d1 > 1.8) return 1.6;
    if (c.ox < -0.3 && c.oy < -0.3 && c.d1 < 1.4) return 6;
    return 3.9 - c.oy * 0.4;
  }
  if (c.id > 0.9 && c.d1 < 2) v -= 1.4;                                                          // um buraco de bolha estourada
  if (cn(x, y, 50, 20, 24176) > 0.28) v += 1;                                                    // o brilho molhado
  return v;
}
function vPlasma(x, y) {   // cristal de plasma: prismas compridos em pé, cada faixa numa cor do arco-íris, uma aresta acesa e outra
  // na sombra, o miolo fundo e uns fios de luz correndo por dentro
  const b0 = plasmaBand(x, y), b = hash2(x, y, 24184) < 0.12 ? plasmaBand(x + 3, y + 3) : b0, R = ARCR[b];
  const c = cells(x, y, 16, 24181, 0.45), e = c.d2 - c.d1;
  if (e < 0.9) { MATX = R[c.ox < 0 ? 6 : 1]; return -9; }                                       // a aresta: acesa à esquerda, escura à direita
  let l = 2.9 + (c.id - 0.5) * 1.4 - c.ox * 0.16 + cg(x, y, 24182) * 0.25;
  if (e < 2.2) l += c.ox < 0 ? 1.1 : -0.8;
  if (Math.abs(c.ox - c.oy * 0.15 + (c.id - 0.5) * 4) < 0.5 && c.d1 < 6) l += 1.4;               // o fio de luz por dentro do prisma
  if (hash2(x, y, 24183) < 0.004) { MATX = R[6]; return -9; }
  MATX = R[Math.max(1, Math.min(5, Math.round(l)))]; return -9;
}
function vReator(x, y) {   // metal do reator: placas grandes branco-violeta, e as linhas de energia correndo entre elas como circuito
  const p = plate(x, y, 24, 24191), { ly, lx, pw, h } = p;
  if (ly === 23 || lx === pw - 1) return 0.5;
  let v = 2.8 + (h - 0.5) * 0.8 + cn(x, y, 40, 40, 24192) * 0.6 + cg(x, y, 24193) * 0.2;
  if (ly === 0) v += 1.2; else if (ly === 22) v -= 0.8;
  if (lx === 0) v += 0.5; else if (lx === pw - 2) v -= 0.5;
  // o circuito: trilhas pelo meio dos blocos, ligando nós
  const gx = Math.floor((wrapT(x) + 6) / 12) % 20, gy = Math.floor((wrapT(y) + 6) / 12) % 20, tx = (wrapT(x) + 6) % 12, ty = (wrapT(y) + 6) % 12;
  const hor = hash2(gx, gy, 24194) < 0.38, ver = hash2(gx, gy, 24195) < 0.26, horP = hash2((gx + 19) % 20, gy, 24194) < 0.38, verP = hash2(gx, (gy + 19) % 20, 24195) < 0.26;
  if (tx === 0 && ty === 0 && (hor || ver || horP || verP)) { MATX = ENER[3]; return -9; }       // o nó
  if ((ty === 0 && hor) || (tx === 0 && ver)) { MATX = ENER[hash2(x, y, 24196) < 0.2 ? 3 : 2]; return -9; }
  if ((ty === 1 && hor) || (tx === 1 && ver)) v -= 0.9;                                           // a sombra da trilha
  if (h < 0.15 && Math.hypot(lx - pw / 2, ly - 11.5) < 5 && Math.hypot(lx - pw / 2, ly - 11.5) > 3.6) v -= 1;   // uma escotilha redonda
  return v;
}
function vBarreira(x, y) {   // a barreira (para o ícone e o mapa): favos de energia rosa
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  return 2.6 + Math.sin((lx + ly * 0.5) * 1.2) * 1.2 + cg(x, y, 24201) * 0.6;
}
function vRastro(x, y) {   // rastro arco-íris: as 6 faixas do adesivo, uma em cima da outra, com purpurina
  const ly = wrapT(y) % 12, b = Math.min(5, ly >> 1), R = ARCR[b];
  if (hash2(x, y, 24211) < 0.04) { MATX = R[6]; return -9; }
  MATX = R[(ly & 1) ? 4 : 5]; return -9;
}
function vAnel(x, y) {   // anel holográfico: laranja de luz, linhas de varredura, uma grade fina
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  let v = (ly % 2 ? 2.6 : 3.6) + cn(x, y, 30, 6, 24221) * 0.8 + cg(x, y, 24222) * 0.4;
  if (lx % 6 === 0) v += 1; if (ly === 0) v += 1.2;
  return v;
}
function vPlaneta(x, y) {   // o planeta holográfico: listras onduladas de vermelho e laranja, uma tempestade oval
  const yy = y + Math.sin(x * 0.0524) * 3 + cn(x, y, 60, 20, 24231) * 8, band = Math.floor(yy / 5), k = ((band % 3) + 3) % 3, lb = ((yy % 5) + 5) % 5;
  let v = (k === 0 ? 1.8 : k === 1 ? 3.0 : 4.2) + cn(x, y, 24, 8, 24232) * 0.6 + cg(x, y, 24233) * 0.2;
  if (lb < 0.8) v += 0.5;
  const c = cells(x, y, 60, 24234, 2.2); if (c.id < 0.5 && c.d1 < 9) v = 1.4 + c.d1 * 0.25 + (c.d1 < 3 ? 1.6 : 0);
  return v;
}

/* ---- paredes de fundo ---- */
function vRochaW(x, y) { const r = vVidroImp(x, y); return r === -9 ? 3.4 : r - 0.2; }
function vCascoW(x, y) {   // painéis do casco por dentro: quadros de 24 com o miolo afundado, e um cano grosso correndo
  const lx = wrapT(x) % 24, ly = wrapT(y) % 24, py = wrapT(y) % 80;
  if (py < 6) return 2.2 + Math.sin(py / 6 * Math.PI) * 2 - (py < 2 ? 0.6 : 0) + ((wrapT(x) % 30) < 2 ? -1.2 : 0);   // o cano
  if (lx === 0 || ly === 0) return 1;
  let v = 2.6 + cn(x, y, 40, 40, 24241) * 0.5 + cg(x, y, 24242) * 0.3;
  if (lx > 2 && lx < 21 && ly > 2 && ly < 21) { v -= 0.6; if (lx === 3 || ly === 3) v -= 0.6; if (lx === 20 || ly === 20) v += 0.9; }
  if (hash2(Math.floor(wrapT(x) / 24), Math.floor(wrapT(y) / 24), 24243) < 0.2 && ly > 8 && ly < 16 && lx > 6 && lx < 18) v = ly % 2 ? 0.6 : 2.8;   // grelha
  return v;
}
function vLabW(x, y) {   // painéis de laboratório: placas altas de cantos redondos, uma janelinha redonda acesa
  const lx = wrapT(x) % 24, ly = wrapT(y) % 40, cd = Math.min(lx, 23 - lx, ly, 39 - ly);
  if (cd === 0) return 1.0;
  let v = 3.0 + cn(x, y, 60, 60, 24251) * 0.4 + cg(x, y, 24252) * 0.15 + (cd === 1 ? (lx === 1 || ly === 1 ? 0.8 : -0.6) : 0);
  if (hash2(Math.floor(wrapT(x) / 24), Math.floor(wrapT(y) / 40), 24253) < 0.35) { const d = Math.hypot(lx - 11.5, ly - 12); if (d < 3) return 4.6 - d * 0.4; if (d < 4) return 1.2; }
  return v;
}
function vReatorW(x, y) { const r = vReator(x, y); return r === -9 ? 5 : r - 0.3; }
function vNeonW(x, y) {   // painel com neon: chapa escura com as linhas de luz correndo por trás, em L
  const ly = wrapT(y) % 40, lx = wrapT(x) % 60, vt = hash2(Math.floor(wrapT(x) / 60), Math.floor(wrapT(y) / 40), 24264) < 0.3, gap = hash2(Math.floor(wrapT(x) / 20), Math.floor(wrapT(y) / 40), 24265) < 0.25;
  if ((ly === 19 && !gap) || (vt && lx === 30 && ly > 19)) return 5.4;
  if (((ly === 18 || ly === 20) && !gap) || (vt && (lx === 29 || lx === 31) && ly > 19)) return 4.2;
  const p = plate(x, y, 20, 24261);
  if (p.ly === 0 || p.lx === 0) return 0.6;
  return 2.2 + cn(x, y, 40, 40, 24262) * 0.8 + cg(x, y, 24263) * 0.3;
}

/* ---- a terceira camada ---- */
function vDpCeu(x, y) {   // o céu holográfico que a nave projeta: nebulosa, estrelas, uma galáxia e o planeta com anel ao longe
  let v = 0.4 + cn(x, y, 40, 40, 24301) * 0.6;
  const n = cn(x, y, 6, 6, 24302) + cn(x, y, 18, 18, 24303) * 0.5 + cn(x, y, 40, 40, 24306) * 0.25; if (n > 0.14) v = Math.min(2.5, 1.2 + (n - 0.14) * 5); if (n > 0 && Math.abs(cn(x, y, 10, 10, 24307)) < 0.015) v = Math.max(v, 2.3);
  // o planeta listrado com o anel inclinado
  const px = x - 172, py = y - 62, ry = py * 0.94 + px * 0.18, rx = px * 0.98 - py * 0.18, rd = (rx * rx) / (40 * 40) + (ry * ry) / (8 * 8);
  const pd = Math.hypot(px, py);
  if (rd > 0.8 && rd < 1.1 && !(pd < 21 && ry < 0)) return 4.2 + (rd < 0.9 ? 0.6 : 0);
  if (pd < 21) { const st = Math.floor((py + 21 + Math.sin(px * 0.2) * 1.5) / 5) % 2; return (st ? 3.2 : 4.4) - (px + py) / 21 * 0.6 - (pd > 19 ? 0.8 : 0); }
  // a galáxia: dois braços em espiral, o miolo aceso
  const gx = x - 62, gy = (y - 172) * 1.6, gr = Math.hypot(gx, gy), ga = Math.atan2(gy, gx);
  if (gr < 46) { const arm = Math.sin(ga * 2 - Math.log(gr + 1) * 4.2); if (gr < 4) return 5; if (gr < 9) return 3.4; if (arm > 0.55) v = Math.max(v, 2.6 - gr / 46 + (arm > 0.85 ? 0.4 : 0)); }
  const h = hash2(x, y, 24304);
  if (h < 0.004) return 5.2; if (h < 0.012) return 2.6;
  const sx = x % 30, sy = y % 30, sk = hash2(Math.floor(x / 30), Math.floor(y / 30), 24305);   // as estrelas grandes, de 4 pontas
  if (sk < 0.25) { const cx = 6 + ((sk * 70) | 0) % 18, cy = 6 + ((sk * 130) | 0) % 18, dx = Math.abs(sx - cx), dy = Math.abs(sy - cy); if (dx + dy === 0) return 5.4; if ((dx === 0 && dy < 3) || (dy === 0 && dx < 3)) return 2.8; }
  return v;
}
function vDpCostelas(x, y) {   // as costelas da nave ao longe: vigas curvas enormes, com furos, longarinas atrás
  let v = 0.9 + cn(x, y, 40, 40, 24311) * 0.5 + cg(x, y, 24312) * 0.15;
  if ((wrapT(y) % 60) < 4) v = 1.8 + ((wrapT(y) % 60) === 0 ? 0.6 : 0);                         // a longarina, mais funda
  for (let k = 0; k < 4; k++) {
    const cx = k * 60 + 30 + Math.sin(y * 6.2832 / 240 + k * 1.3) * 16;
    let dx = ((x - cx) % TP + TP) % TP; if (dx > TP / 2) dx -= TP;
    if (Math.abs(dx) < 7) {
      const u = dx / 7, ly = wrapT(y + k * 17) % 22;
      if (Math.abs(dx) < 4.5 && Math.hypot(dx, ly - 11) < 3) return ly > 11 ? 1.2 : 0.4;        // furo de alívio
      if (Math.abs(dx) > 5.6) return u < 0 ? 3.8 : 1.6;                                           // a aba
      if (ly === 11 && dx === 0 && hash2(Math.floor((y + k * 17) / 22), k, 24313) < 0.25) return 5.2;   // uma luzinha ciano
      return 2.6 - u * 0.6;
    }
  }
  return v;
}
function vDpTanques(x, y) {   // os tanques gigantes em fileiras: vidro, o líquido verde apagado, uma silhueta boiando
  const row = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + row * 20), k = Math.floor(xx / 40), lx = xx % 40;
  const bg = 0.7 + cn(x, y, 30, 30, 24321) * 0.4 + cg(x, y, 24322) * 0.15;
  if (lx < 3 || lx > 36) return bg;
  if (by < 10) return by < 2 ? 1.4 : by === 9 ? 2 : (lx % 6 === 0 ? 1.6 : 3.2 - (lx - 3) * 0.03);   // a tampa
  if (by > 108) return by > 116 ? bg : 2.8 - (by - 109) * 0.15;                                     // a base
  if (lx < 5 || lx > 34) return lx < 5 ? 3.0 : 1.8;                                                 // o vidro, a borda
  const u = (lx - 20) / 15, h = hash2(k, row, 24323);
  let v = 4.0 - Math.abs(u) * 0.9 + cn(x, y, 20, 40, 24324) * 0.4 + (by < 16 ? -1.2 : 0);
  // a silhueta: uma criatura das camadas de cima (corpo, cabeça, braços)
  const sx = lx - 20 - (h - 0.5) * 6, sy = by - 60 - Math.sin(h * 9) * 8;
  const body = (sx * sx) / 36 + (sy * sy) / 300 < 1, head = Math.hypot(sx, sy + 26) < 6, arms = Math.abs(sy + 8 - Math.abs(sx) * 0.5) < 2 && Math.abs(sx) < 13;
  if (h < 0.75 && (body || head || arms)) return 1.2;
  if (hash2(x, y, 24325) < 0.01 && by > 20) return 5.2;                                             // bolha
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  vidroImp: bake(vVidroImp), escoria: bake(vEscoria), casco: bake(vCasco), painel: bake(vPainel), grade: bake(vGrade), liga: bake(vLiga), vidro: bake(vVidroLab),
  gosma: bake(vGosma), plasma: bake(vPlasma), reator: bake(vReator), barreira: bake(vBarreira), rastro: bake(vRastro), anel: bake(vAnel), planeta: bake(vPlaneta),
  rochaW: bake(vRochaW), cascoW: bake(vCascoW), labW: bake(vLabW), reatorW: bake(vReatorW), neonW: bake(vNeonW),
  dpCeu: bake(vDpCeu), dpCostelas: bake(vDpCostelas), dpTanques: bake(vDpTanques)
};
const NV_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [NV_VIDRO_IMPACTO, 'nvVidroImp', 'vidroImp', 0.9, '#1e4a30'], [NV_ESCORIA, 'nvEscoria', 'escoria', 0.75, '#222228'], [NV_CASCO, 'nvCasco', 'casco', 1.3, '#3e4654'],
  [NV_PAINEL_NEON, 'nvCasco', 'painel', 1.1, '#ff3ec8'], [NV_GRADE, 'nvGrade', 'grade', 0.7, '#545e6c'], [NV_LIGA, 'nvLiga', 'liga', 1.3, '#b4b0cc'],
  [NV_VIDRO, 'nvVidro', 'vidro', 0.5, '#36aec0'], [NV_GOSMA, 'nvGosma', 'gosma', 0.3, '#6cd422'], [NV_PLASMA, 'nvPlasma', 'plasma', 1.7, '#c858e0'],
  [NV_REATOR, 'nvReator', 'reator', 1.7, '#7258a0'], [NV_RASTRO, 'nvRastro', 'rastro', 0, '#ffe53a'], [NV_ANEL, 'nvAnel', 'anel', 0, '#ffa83a'], [NV_PLANETA, 'nvPlaneta', 'planeta', 0, '#d0522a']
];
for (const [t, p, k, dig, col] of NV_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [NV_VIDRO_IMPACTO, NV_ESCORIA]) BLEND[t] = 1;
EMIT[NV_ESCORIA] = 0.2; EMIT[NV_PAINEL_NEON] = 0.62; EMIT[NV_GOSMA] = 0.3; EMIT[NV_PLASMA] = 0.92; EMIT[NV_REATOR] = 0.12; EMIT[NV_RASTRO] = 0.95; EMIT[NV_ANEL] = 0.55; EMIT[NV_PLANETA] = 0.25;

WMAT[WNV_ROCHA] = [PALS.nvRochaW, BKV.rochaW]; WMAT[WNV_CASCO] = [PALS.nvCascoW, BKV.cascoW]; WMAT[WNV_LAB] = [PALS.nvLabW, BKV.labW];
WMAT[WNV_REATOR] = [PALS.nvReatorW, BKV.reatorW]; WMAT[WNV_NEON] = [PALS.nvNeonW, BKV.neonW];
DMAT[DP_NV_CEU] = [PALS.dpNvCeu, BKV.dpCeu]; DMAT[DP_NV_COSTELAS] = [PALS.dpNvCostelas, BKV.dpCostelas]; DMAT[DP_NV_TANQUES] = [PALS.dpNvTanques, BKV.dpTanques];

/* ---- os minérios: carvão na escória, e a xenita: prismas verde-neon translúcidos que piscam ---- */
oreRamp(NV_O_XENITA, ['#0a3a1a', '#126a2a', '#20a03a', '#3ad44e', '#7dff3a', '#d4ffb0', '#ffffff']);
const XEN_TIP = new Map();   // semente do bloco -> a ponta do prisma maior (onde a estrelinha pisca, ao vivo)
ORE_PAINT[NV_O_XENITA] = function (L, s) {
  const R = ORE_RAMP[NV_O_XENITA], n = 2 + (hash2(s, 1, 24401) < 0.6), bx = 3.6 + hash2(s, 2, 24401) * 4.8, by = 8.4 + hash2(s, 3, 24401) * 1.6, tilt = (hash2(s, 4, 24401) - 0.5) * 0.8;
  let tip = null;
  for (let i = n - 1; i >= 0; i--) {   // os pequenos primeiro, o grande na frente
    const side = i === 0 ? 0 : i === 1 ? -1 : 1, ang = tilt + side * (0.5 + hash2(s, i, 24402) * 0.45);
    const len = i === 0 ? 6.4 + hash2(s, i, 24403) * 2 : 3.4 + hash2(s, i, 24403) * 2, hw = i === 0 ? 1.5 + hash2(s, i, 24404) * 0.4 : 0.9 + hash2(s, i, 24404) * 0.3, rx = bx + side * 1.6;
    orePrism(L, rx, by, ang, len, hw, R, s * 13 + i);
    if (i === 0) tip = [Math.round(rx + Math.sin(ang) * (len - 0.8) - 0.5), Math.round(by - Math.cos(ang) * (len - 0.8) - 0.5)];
  }
  // o miolo escuro de cada prisma (a xenita é translúcida com o coração fundo)
  for (let k = 0; k < 144; k++) if (L.m[k] && L.l[k] > 2.6 && L.l[k] < 4.4 && hash2(k, s, 24405) < 0.35) L.put(k % 12, k / 12 | 0, R[1], L.l[k]);
  XEN_TIP.set(s, tip);
};
ORE_HALO[NV_O_XENITA] = { pal: ['nvVidroImp', '#3ad44e', 0.3, 0.12], shade: 0.3 };
ORE_PAINT[NV_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[NV_O_CARVAO] = { pal: ['nvEscoria', '#020203', 0.5, 0.2], shade: 0 };
MAT[NV_O_CARVAO] = [PALS.nvEscoria, bakeOre(NV_O_CARVAO, vEscoria)]; MAT[NV_O_XENITA] = [PALS.nvVidroImp, bakeOre(NV_O_XENITA, vVidroImp)];
for (const t of [NV_O_CARVAO, NV_O_XENITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[NV_O_CARVAO] = DIG[COAL]; ORE_XP[NV_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[NV_O_CARVAO] = ORE_NAME[COAL]; PCOL[NV_O_CARVAO] = PCOL[COAL]; ORE_ITEM[NV_O_CARVAO] = ORE_ITEM[COAL];
DIG[NV_O_XENITA] = 1.7; ORE_XP[NV_O_XENITA] = 21; ORE_NAME[NV_O_XENITA] = 'Xenita'; PCOL[NV_O_XENITA] = '#3ad44e'; ORE_ITEM[NV_O_XENITA] = 'min_xenita';
EMIT[NV_O_XENITA] = 0.3;
const xenTip = (gx, gy) => XEN_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + NV_O_XENITA * 7919) | 0);

/* ---- itens de bloco ---- */
const NV_ITEMS = {
  vidro_impacto: ['Vidro de Impacto', NV_VIDRO_IMPACTO, 'Rocha que derreteu quando a nave bateu. Verde-garrafa, lisa, rachada em estrela.'],
  escoria: ['Escória', NV_ESCORIA, 'Rocha preta, derretida e borbulhada. As rachaduras ainda brilham verde.'],
  chapa_casco: ['Chapa do Casco', NV_CASCO, 'Uma placa grafite do casco da nave, com rebites. Não amassa nem com picareta.'],
  painel_neon: ['Painel de Neon', NV_PAINEL_NEON, 'Chapa com uma faixa de neon que nunca apaga. Ilumina a casa inteira.'],
  grade: ['Grade', NV_GRADE, 'Grade de piso da nave. Leve, firme, com o vão escuro por baixo.'],
  liga: ['Liga Alienígena', NV_LIGA, 'Metal branco-perolado. Muda de cor conforme o ângulo, violeta, rosa.'],
  vidro_lab: ['Vidro de Laboratório', NV_VIDRO, 'Vidro ciano, frio ao toque. Dá para ver o que tem do outro lado.'],
  metal_reator: ['Metal do Reator', NV_REATOR, 'Placa branco-violeta do núcleo, morna. As linhas de energia ainda correm por ela.']
};
for (const id in NV_ITEMS) { const [name, block, desc] = NV_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
// gosma_verde é material (Marta, Aurélia; o 247 dá o ícone e o preço) e também o bloco de Gosma Endurecida
ITEMS.gosma_verde = Object.assign(ITEMS.gosma_verde || {}, { name: (ITEMS.gosma_verde && ITEMS.gosma_verde.name) || 'Gosma Verde', rar: (ITEMS.gosma_verde && ITEMS.gosma_verde.rar) || 0, stack: 99, block: NV_GOSMA,
  desc: (ITEMS.gosma_verde && ITEMS.gosma_verde.desc) || 'Gosma verde-limão que escorre da nave. Endurece no ar e brilha fraquinho.' });
BLOCK_DROP[NV_GOSMA] = 'gosma_verde';
// o plasma, a barreira, o rastro, o anel e o planeta não soltam nada

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRN = {
  metal: ['#0a0c10', '#14161c', '#20242c', '#2e3440', '#3e4654', '#525c6c', '#7c8898'],
  liga: ['#3a3650', '#6a6684', '#8e8aa8', '#b4b0cc', '#d6d2ea', '#f2f0ff', '#ffffff'],
  gosma: ['#123a04', '#2e7a0c', '#4aa814', '#6cd422', '#94f03c', '#c8ff7a', '#f0ffd8'],
  cabo: ['#050507', '#0c0c10', '#16161c', '#222228', '#303038', '#42424c', '#585864'],
  cobre: ['#3a1806', '#6a300e', '#a0501a', '#d07a30', '#f0a04a', '#ffd08a', '#fff0d0'],
  vidro: ['#0a2a30', '#124650', '#1e6a78', '#3098a8', '#5cc8d8', '#a8f0f8', '#ecffff'],
  branco: ['#2a2e38', '#4a5060', '#7a8292', '#a8b0bc', '#ccd2da', '#e8ecf0', '#ffffff'],
  laranja: ['#3a1406', '#6a2a0a', '#a84a12', '#e0781e', '#ffa83a', '#ffd080', '#fff0d0'],
  visor: ['#04040a', '#0a0a18', '#121428', '#1c2040', '#2a3060'],
  caule: ['#0c0818', '#181030', '#261a48', '#362662', '#4a367e', '#62509a', '#806cb8'],
  folha: ['#061a1a', '#0c2e2c', '#144840', '#1e6458', '#2c8272', '#46a08e', '#6cc0aa'],
  aranha: ['#0a0608', '#1a1014', '#2a1a20', '#3e2830'],
  olho: ['#5a4848', '#a08e8e', '#d8cccc', '#f8f0f0', '#ffffff'],
  larva: ['#5a4a34', '#8a7656', '#b8a07a', '#dcc8a0', '#f4e8cc'],
  morcego: ['#0c0a10', '#1a1620', '#2a2430', '#3c3444']
};
for (const k in DRN) DRN[k] = DRN[k].map(h => ph(h));
const M = DRN.metal;

/* a escada de serviço: dois trilhos de chapa presos na parede, degraus de neon ciano; o topo com a alça que agarra a
   beirada, o pé com as sapatas */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), C = NEONR.ciano;
  for (let y = k === 1 ? 1 : 0; y < 12; y++) { a.put(2, y, M, 5 + cg(2, y, s) * 0.4); a.put(3, y, M, 3.2); a.put(8, y, M, 4.4); a.put(9, y, M, 2.2); }
  if (k === 1) { for (let x = 1; x <= 10; x++) a.put(x, 0, M, x < 4 ? 5.6 : 4.2 - (x - 4) * 0.2); a.put(1, 1, M, 4); a.put(10, 1, M, 2.4); }
  for (const ry of [2, 8]) {
    for (let x = 4; x <= 7; x++) { a.put(x, ry, C, x === 4 || x === 7 ? 5 : 6); a.put(x, ry + 1, C, 3.4); }
    a.put(3, ry, M, 6); a.put(8, ry, M, 5.6); a.put(3, ry + 1, M, 1.6); a.put(8, ry + 1, M, 1.2);
  }
  a.put(2, 5, M, 6.2); a.put(9, 5, M, 3.4);                                                       // o grampo na parede
  if (k === 2) { for (let x = 1; x <= 10; x++) a.put(x, 11, M, x < 5 ? 4.4 : 2.8); a.put(1, 10, M, 4.6); a.put(10, 10, M, 2.6); }
  return rimOut(a, M[0], false);
}
const ESCADA = [escadaSprite(0, 24501), escadaSprite(1, 24502), escadaSprite(2, 24503)];
/* o cabo pendurado: borracha preta grossa em gomos, uma fita amarela de vez em quando; o último termina em fios de
   cobre desfiados */
function caboSprite(end, s) {
  const a = spr(), C = DRN.cabo, Y = DRN.laranja, len = end ? 9 : 12;
  for (let y = 0; y < len; y++) {
    const cx = Math.round(5 + Math.sin(y * 0.5 + s) * 0.8), tape = s % 3 === 0 && (y === 5 || y === 6);
    for (let i = 0; i < 3; i++) { const R = tape ? Y : C; a.put(cx + i, y, R, (i === 0 ? 5 : i === 1 ? 3.4 : 1.8) - (((y + s) % 4) === 0 ? 1 : 0) + cg(cx + i, y, s) * 0.3); }
  }
  if (end) { const cx = Math.round(5 + Math.sin(8 * 0.5 + s) * 0.8) + 1; for (const [dx, dy] of [[-2, 2], [-1, 1], [0, 1], [0, 2], [1, 1], [2, 2], [-1, 2], [1, 2]]) a.put(cx + dx, 8 + dy, DRN.cobre, 4 + dy * 0.6 - Math.abs(dx) * 0.4); a.put(cx - 2, 11, DRN.cobre, 6); a.put(cx + 2, 11, DRN.cobre, 6); }
  return rimOut(a, C[0], false);
}
const CABO = [caboSprite(false, 24511), caboSprite(false, 24512), caboSprite(true, 24513)];
/* o tubo de neon do teto: dois suportes de chapa, a calha, o tubo aceso (miolo quase branco); tampa de metal na ponta
   da fileira. 4 cores x 4 jeitos de ponta */
function neonSprite(col, capL, capR) {
  const a = spr(), N = NEONR[col];
  for (const x of [2, 8]) { a.put(x, 0, M, 4.6); a.put(x, 1, M, 3.4); a.put(x + 1, 0, M, 3); a.put(x + 1, 1, M, 2); }
  for (let x = 0; x < 12; x++) a.put(x, 2, M, 2.2 + (x % 4 === 1 ? 1.4 : 0));
  const x0 = capL ? 1 : 0, x1 = capR ? 10 : 11;
  for (let x = x0; x <= x1; x++) { a.put(x, 3, N, 5); a.put(x, 4, N, 6); a.put(x, 5, N, 4); }
  if (capL) for (let y = 2; y <= 5; y++) a.put(0, y, M, y === 2 ? 4.8 : 3.6);
  if (capR) for (let y = 2; y <= 5; y++) a.put(11, y, M, y === 2 ? 3.4 : 2.2);
  return rimOut(a, M[0], false);
}
const NEON = []; for (const k of TUBE_K) for (let m = 0; m < 4; m++) NEON.push(neonSprite(k, m & 1, m & 2));
/* gosma pingando: uma mancha de gosma grudada no teto, uma gota se formando (a que cai é desenhada ao vivo) */
const GOTA_X = [4, 7];
function gotaSprite(v, s) {
  const a = spr(), G = DRN.gosma, gx = GOTA_X[v];
  for (let x = 1; x <= 10; x++) { const h = 1 + (hash2(x, 0, s) < 0.5 ? 1 : 0) + (Math.abs(x - gx) < 3 ? 1 : 0); for (let y = 0; y < h; y++) a.put(x, y, G, 4.2 - y * 0.8 - (x - 1) * 0.1 + cg(x, y, s) * 0.4); }
  for (let y = 2; y < 5; y++) { a.put(gx, y, G, 4 - (y - 2) * 0.4); a.put(gx + 1, y, G, 2.6); }
  a.put(gx, 5, G, 3); a.put(gx + 1, 5, G, 2); a.put(gx, 3, G, 6);
  return rimOut(a, G[0], false);
}
const GOTA = [gotaSprite(0, 24521), gotaSprite(1, 24522)];
/* poça de gosma no chão: rasa, espalhada, um brilho molhado e uma bolha */
function pocaSprite(s) {
  const a = spr(), G = DRN.gosma;
  for (let x = 0; x < 12; x++) { const h = x < 1 || x > 10 ? 1 : 2 + (hash2(x, 0, s) < 0.35 ? 1 : 0); for (let y = 12 - h; y < 12; y++) a.put(x, y, G, 3.6 + (y === 12 - h ? 1.2 : 0) - (y === 11 ? 1.1 : 0) + cg(x, y, s) * 0.3); }
  for (let x = 2; x < 5; x++) a.put(x, 10, G, 6);
  const bx = 7 + (s % 2); a.put(bx, 8, G, 4.6); a.put(bx + 1, 8, G, 3.6); a.put(bx - 1, 9, G, 4); a.put(bx + 2, 9, G, 2.6); a.put(bx, 8, G, 6);
  return a;
}
const POCA = [pocaSprite(24531), pocaSprite(24532)];
/* o capacete de astronauta caído: a cúpula branca, o visor escuro refletindo o neon (rosa em cima, ciano embaixo),
   o anel laranja do pescoço */
function capaceteSprite(s) {
  const a = spr(), W = DRN.branco, O = DRN.laranja, V = DRN.visor;
  disc(a, 5.8, 7.4, 4.6, 4.2, W, (dx, dy, d) => 4.6 - dx * 1.3 - dy * 1.2 - d * 0.4 + cg(dx * 9, dy * 9, s) * 0.3);
  for (let x = 2; x <= 9; x++) { a.put(x, 11, O, 2.6); a.put(x, 10, O, 4.4 - (x - 2) * 0.25); }
  for (let y = 5; y <= 9; y++) for (let x = 4; x <= 9; x++) {
    const dx = (x + 0.5 - 7) / 2.8, dy = (y + 0.5 - 7.2) / 2.2; if (dx * dx + dy * dy > 1) continue;
    if (dy < -0.45) pp(a, x, y, NEONR.rosa[dx < 0 ? 4 : 3]); else if (dy > 0.5) pp(a, x, y, NEONR.ciano[dx < 0.2 ? 3 : 2]); else pp(a, x, y, V[dx < -0.3 ? 3 : dx > 0.4 ? 1 : 2]);
  }
  pp(a, 5, 6, NEONR.branco[6]); pp(a, 2, 4, W[6]);                                                   // o brilho, a luzinha do capacete
  a.put(3, 3, M, 4); a.put(3, 2, M, 3); pp(a, 3, 1, NEONR.rosa[5]);                                  // a anteninha
  return rimOut(a, W[0]);
}
const CAPACETE = [capaceteSprite(24541), flipX(capaceteSprite(24542))];
/* destroço: um pedaço de chapa do casco dobrado, a borda rasgada, rebites, um fio solto */
function destrocoSprite(s) {
  const a = spr(), bend = 5 + (s % 2);
  for (let x = 0; x < 12; x++) {
    const top = Math.round(6 + Math.abs(x - bend) * 0.5 + Math.sin(x * 1.7 + s) * 1.2 + (x < 2 || x > 9 ? 2 : 0));
    for (let y = Math.max(3, top); y < 12; y++) a.put(x, y, M, (x < bend ? 4.4 : 2.6) + (y === Math.max(3, top) ? 1.4 : 0) - (y === 11 ? 1 : 0) + cg(x, y, s) * 0.5 + (x === bend ? 1.6 : 0));
  }
  for (const [x, y] of [[2, 10], [8, 9]]) { if (a[y * T + x]) { a.put(x, y, M, 6.2); a.put(x + 1, y + 1, M, 1); } }
  const wx = bend + 2; for (let y = 2; y < 7; y++) a.put(wx + (y > 4 ? 1 : 0), y, DRN.laranja, 3.6);
  pp(a, wx + 1, 2, DRN.cobre[6]);
  return rimOut(a, M[0]);
}
const DESTROCO = [destrocoSprite(24551), flipX(destrocoSprite(24552))];
/* a fiação faiscando: a caixa de passagem e três fios (vermelho, amarelo, ciano) caindo em laço; as pontas de cobre
   desfiadas soltam faíscas ao vivo. 0 e 1 no teto, 2 saindo da parede da esquerda, 3 da direita */
const FIA_COL = RX(['#3a0a0a', '#8a1a1a', '#d03a3a', '#ff7a6a']).concat(RX(['#3a3006', '#8a7010', '#e0c030', '#fff08a'])).concat(RX(['#062a34', '#106a80', '#2ac0e0', '#a0f4ff']));
const FIA_PT = [];
function fiacaoSprite(k, s) {
  const a = spr(), C = DRN.cobre; let tip = [6, 10];
  const wire = (pts, ci) => { for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i]; pp(a, x, y, FIA_COL[ci * 4 + (i % 5 === 0 ? 3 : 2)]); if (i % 3 === 1) pp(a, x + 1, y, FIA_COL[ci * 4 + 1]); } };
  if (k < 2) {
    for (let x = 3; x <= 8; x++) { a.put(x, 0, M, 4.6 - (x - 3) * 0.3); a.put(x, 1, M, 3 - (x - 3) * 0.2); }
    let best = -1;
    for (let w = 0; w < 3; w++) {
      const x0 = 4 + w * 2, L = 6 + ((hash2(w, k, s) * 5) | 0), pts = [];
      for (let y = 2; y < 2 + L; y++) pts.push([x0 + Math.round(Math.sin(y * 0.6 + w * 2 + k) * 1.3), y]);
      wire(pts, w); const e = pts[pts.length - 1]; pp(a, e[0], e[1] + 1, C[5]); pp(a, e[0] + 1, e[1] + 1, C[4]);
      if (e[1] > best) { best = e[1]; tip = [e[0], e[1] + 1]; }
    }
  } else {
    const L = k === 2;
    for (let y = 2; y <= 6; y++) { pp(a, L ? 0 : 11, y, M[y === 2 ? 5 : 3]); pp(a, L ? 1 : 10, y, M[y === 2 ? 4 : 2]); }
    for (let w = 0; w < 3; w++) {
      const pts = []; for (let i = 0; i < 7 + w; i++) { const x = L ? 2 + i : 9 - i, y = 3 + w + Math.round(Math.sin(i * 0.45) * 2.2 + i * 0.3); pts.push([x, y]); }
      wire(pts, w); const e = pts[pts.length - 1]; pp(a, e[0] + (L ? 1 : -1), e[1], C[5]);
      if (w === 2) tip = [e[0] + (L ? 1 : -1), e[1]];
    }
  }
  FIA_PT[k] = tip;
  return rimOut(a, M[0], false);
}
const FIACAO = [fiacaoSprite(0, 24561), fiacaoSprite(1, 24562), fiacaoSprite(2, 24563), fiacaoSprite(3, 24564)];
const fiaIdx = (gx, gy) => solidAt(gx, gy - 1) ? (hash2(wrapX(gx), gy, 24565) < 0.5 ? 0 : 1) : solidAt(gx - 1, gy) ? 2 : solidAt(gx + 1, gy) ? 3 : 0;
/* a planta alienígena: um caule violeta curvo, folhas verde-água em fita, o bulbo de neon (rosa ou ciano) com
   pintas; a outra forma é um caule em arco com o bulbo pendurado como lâmpada. O bulbo pulsa ao vivo */
const PLANTA_B = [[5.5, 4.2], [8.4, 5.6]];
function plantaSprite(shape, col, s) {
  const a = spr(), S = DRN.caule, F = DRN.folha, N = NEONR[col], [bx, by] = PLANTA_B[shape];
  if (shape === 0) { for (let y = 11; y >= 6; y--) { const x = Math.round(5 + Math.sin((11 - y) * 0.45) * 1.2); a.put(x, y, S, 4.4); a.put(x + 1, y, S, 2.6); } }
  else { const pts = [[3, 11], [3, 10], [3, 9], [3, 8], [4, 7], [4, 6], [5, 5], [6, 4], [7, 4], [8, 4], [9, 5], [9, 6]]; for (const [x, y] of pts) { a.put(x, y, S, 4.2); a.put(x + (y > 7 ? 1 : 0), y + (y > 7 ? 0 : 1), S, 2.4); } }
  // as folhas, em fita, saindo do pé
  for (const [x0, dir, len] of [[4, -1, 4], [6, 1, 4], [5, -1, 2]]) for (let i = 0; i < len; i++) { const x = x0 + dir * i, y = 11 - Math.round(i * 0.7) - (len === 2 ? 2 : 0); a.put(x, y, F, 4.6 - i * 0.4 + (dir < 0 ? 0.6 : 0)); }
  disc(a, bx, by, 2.4, 2.6, N, (dx, dy, d) => 5 - dx * 0.9 - dy * 0.9 - d * 1.6);
  pp(a, Math.round(bx + 1), Math.round(by), N[2]); pp(a, Math.round(bx - 1), Math.round(by + 1), N[3]);   // pintas
  if (shape === 0) { a.put(bx - 2, by - 3, S, 4); a.put(bx + 2, by - 3, S, 3); pp(a, bx - 2, by - 4, N[6]); pp(a, bx + 2, by - 4, N[5]); }   // as anteninhas
  return rimOut(a, S[0]);
}
const PLANTA = []; for (const col of ['rosa', 'ciano']) for (let sh = 0; sh < 2; sh++) PLANTA.push(plantaSprite(sh, col, 24571 + sh));
const plantaCol = (gx, gy) => hash2(wrapX(gx), gy, 24572) < 0.5 ? 0 : 1, plantaShape = (gx, gy) => hash2(wrapX(gx), gy, 24573) < 0.6 ? 0 : 1;
/* o projetor de holograma: base de chapa em degraus, a lente ciano acesa, duas luzinhas; o holograma é ao vivo */
function holoSprite(s) {
  const a = spr(), C = NEONR.ciano;
  for (let x = 1; x <= 10; x++) a.put(x, 11, M, 2.6 - (x - 1) * 0.08);
  for (let x = 2; x <= 9; x++) a.put(x, 10, M, 3.8 - (x - 2) * 0.2);
  for (let x = 3; x <= 8; x++) a.put(x, 9, M, 5 - (x - 3) * 0.25);
  for (let x = 4; x <= 7; x++) a.put(x, 8, C, x === 4 || x === 7 ? 4.4 : 6);
  pp(a, 2, 10, NEONR.rosa[5]); pp(a, 9, 10, NEONR.verde[4]);
  return rimOut(a, M[0]);
}
const HOLO = [holoSprite(24581)];
/* a escora do casco: uma viga em I do chão ao teto (abas, alma com furos de alívio, rebites); o pé e a cabeça com chapa
   e mão-francesa */
function escoraSprite(k, s) {   // 0 pé, 1 meio, 2 cabeça, 3 meio com furo
  const a = spr();
  for (let y = 0; y < 12; y++) { a.put(2, y, M, 5 + cg(2, y, s) * 0.3); a.put(3, y, M, 3.6); for (let x = 4; x <= 7; x++) a.put(x, y, M, 2.6 - (x === 4 ? 0.7 : 0) + cg(x, y, s) * 0.3); a.put(8, y, M, 3.2); a.put(9, y, M, 1.8); }
  for (const y of [3, 9]) { a.put(2, y, M, 6.4); a.put(9, y, M, 4); a.put(3, y + 1, M, 1.6); }
  if (k === 3) for (let y = 3; y <= 8; y++) for (let x = 4; x <= 7; x++) { const d = Math.hypot(x + 0.5 - 6, (y + 0.5 - 6) * 0.8); if (d < 1.9) a.put(x, y, M, x + y > 11 ? 2.6 : 0.4); }
  if (k === 0) { for (let y = 9; y < 12; y++) for (let x = 0; x < 12; x++) a.put(x, y, M, (y === 9 ? 5 : y === 10 ? 3.4 : 2.2) - x * 0.12); for (const x of [1, 10]) a.put(x, 10, M, 6.2); for (let i = 0; i < 2; i++) { a.put(1 + i, 8 - i, M, 4); a.put(10 - i, 8 - i, M, 2.4); } }
  if (k === 2) { for (let y = 0; y < 3; y++) for (let x = 0; x < 12; x++) a.put(x, y, M, (y === 0 ? 4.6 : y === 1 ? 3.4 : 1.8) - x * 0.12); for (const x of [1, 10]) a.put(x, 1, M, 6.2); for (let i = 0; i < 2; i++) { a.put(1 + i, 3 + i, M, 4); a.put(10 - i, 3 + i, M, 2.4); } }
  return k === 1 || k === 3 ? a : rimOut(a, M[0], k === 0);
}
const ESCORA = [escoraSprite(0, 24591), escoraSprite(1, 24592), escoraSprite(2, 24593), escoraSprite(3, 24594)];
/* a estrelinha de neon da parede, a de 4 pontas do adesivo: amarela, rosa ou ciano, grande ou pequena; pisca ao vivo */
function estrelaSprite(col, big) {
  const a = spr(), N = NEONR[col], R = big ? 5.6 : 4.2;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const dx = Math.abs(x + 0.5 - 6) / R, dy = Math.abs(y + 0.5 - 6) / R, f = Math.sqrt(dx) + Math.sqrt(dy);
    if (f <= 1) a.put(x, y, N, 6.4 - (dx + dy) * 4.2 - (x + y > 12 ? 0.6 : 0));
  }
  return rimOut(a, N[1]);
}
const ESTRELA = []; for (const col of STAR_K) for (const big of [true, false]) ESTRELA.push(estrelaSprite(col, big));
const estrelaIdx = (gx, gy) => (hash2(wrapX(gx), gy, 24601) * 6) | 0;
/* o pote de espécime: vidro grosso com tampa de chapa, o líquido verde aceso e um bichinho das camadas de cima boiando
   (uma aranha, um olho, uma larva da colmeia, um morceguinho) */
function poteSprite(kind, s) {
  const a = spr(), G = DRN.vidro, L = DRN.gosma;
  for (let y = 4; y <= 10; y++) { a.put(2, y, G, 5); a.put(9, y, G, 2.6); for (let x = 3; x <= 8; x++) a.put(x, y, y === 4 ? G : L, y === 4 ? 3.4 : 4.6 - (y - 5) * 0.35 - (x - 3) * 0.15); }
  for (let x = 2; x <= 9; x++) { a.put(x, 11, M, 2.6); a.put(x, 3, M, 4.4 - (x - 2) * 0.2); a.put(x, 2, M, 5.2 - (x - 2) * 0.25); }
  a.put(5, 1, M, 4.6); a.put(6, 1, M, 3);
  for (let y = 5; y <= 9; y++) pp(a, 3, y, G[6]);                                                   // o brilho do vidro
  const cx = 5.8, cy = 7.2;
  if (kind === 0) { disc(a, cx, cy, 1.4, 1.2, DRN.aranha, (dx, dy) => 2.4 - dx - dy); for (const [x, y] of [[4, 6], [4, 8], [7, 6], [7, 8], [3, 7], [8, 7]]) a.put(x, y, DRN.aranha, 1); pp(a, 6, 7, NEONR.rosa[4]); }
  else if (kind === 1) { disc(a, cx, cy, 1.8, 1.8, DRN.olho, (dx, dy) => 3.6 - dx - dy); pp(a, 6, 7, DRN.visor[0]); pp(a, 5, 7, NEONR.ciano[3]); pp(a, 4, 8, ph('#c83a3a')); }
  else if (kind === 2) { for (const [x, y, v] of [[4, 6, 4], [5, 6, 4], [6, 6, 3.4], [7, 7, 3], [7, 8, 2.6], [6, 9, 2.2], [5, 9, 2.4], [4, 8, 3]]) a.put(x, y, DRN.larva, v); }
  else { for (const [x, y] of [[3, 6], [4, 7], [5, 7], [6, 7], [7, 7], [8, 6], [5, 8], [6, 8], [4, 6], [7, 6]]) a.put(x, y, DRN.morcego, x === 5 || x === 6 ? 3 : 1.6); pp(a, 5, 7, NEONR.rosa[5]); }
  return rimOut(a, M[0]);
}
const POTE = [poteSprite(0, 24611), poteSprite(1, 24612), poteSprite(2, 24613), poteSprite(3, 24614)];
/* o feixe do elevador: a coluna arco-íris translúcida (pontinhos ralos, as bordas cheias); as faixas que sobem são ao vivo */
function feixeSprite(v) {
  const a = spr();
  for (let y = 0; y < 12; y++) for (let x = 1; x <= 10; x++) {
    const b = Math.min(5, Math.floor((x - 1) * 0.6)), R = ARCR[b];
    if (x === 1 || x === 10) pp(a, x, y, R[(y + v) % 4 ? 3 : 5]);
    else if (x % 3 === 0 || (y + x) % 4 === 0) pp(a, x, y, R[x % 3 === 0 ? 2 : 1]);
  }
  return a;
}
const FEIXE = [feixeSprite(0), feixeSprite(0)];
/* o emissor do feixe: um disco de chapa no chão, o anel de luzes nas 6 cores, a lente branca no meio */
function emissorSprite(s) {
  const a = spr();
  for (let x = 0; x < 12; x++) { a.put(x, 11, M, 2.4 - x * 0.06); a.put(x, 10, M, 3.6 - x * 0.12); }
  for (let x = 1; x <= 10; x++) a.put(x, 9, M, 4.8 - (x - 1) * 0.2);
  for (let x = 2; x <= 9; x++) pp(a, x, 8, ARCR[Math.min(5, Math.floor((x - 2) * 0.75))][5]);
  for (let x = 4; x <= 7; x++) pp(a, x, 7, NEONR.branco[x === 4 || x === 7 ? 5 : 6]);
  for (const x of [0, 11]) a.put(x, 10, M, 6);
  return rimOut(a, M[0]);
}
const EMISSOR = [emissorSprite(24621)];
/* a barreira de energia: favos de luz rosa com o miolo ralo (a parede de trás aparece); duas fases que se alternam */
const HEXB = CMART.hexGrid(8, 6, 24631);
function barreiraSprite(k) {
  const a = spr(), B = PALS.nvBarreira;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const h = HEXB(x + k * 4, y + k * 3);
    if (h.e < 0.55) pp(a, x, y, B[h.oy < 0 ? 5 : 4]);
    else if (h.e < 1.1 && h.oy < 0) pp(a, x, y, B[2]);
    else if (x % 3 === k && (y + x) % 2 === 0) pp(a, x, y, B[1]);
  }
  return a;
}
const BARREIRA = [barreiraSprite(0), barreiraSprite(1)];

DECO[NV_ESCADA] = ESCADA; DECO[NV_CABO] = CABO; DECO[NV_NEON] = NEON; DECO[NV_GOTA] = GOTA; DECO[NV_POCA] = POCA; DECO[NV_CAPACETE] = CAPACETE; DECO[NV_DESTROCO] = DESTROCO;
DECO[NV_FIACAO] = FIACAO; DECO[NV_PLANTA] = PLANTA; DECO[NV_HOLO] = HOLO; DECO[NV_ESCORA] = ESCORA; DECO[NV_ESTRELA] = ESTRELA; DECO[NV_POTE] = POTE; DECO[NV_FEIXE] = FEIXE; DECO[NV_EMISSOR] = EMISSOR;
// a barreira: sólida mas vazada (a parede aparece entre os favos), como a parede de sombra da Escuridão; não quebra
DECO[NV_BARREIRA] = BARREIRA; MAT[NV_BARREIRA] = [PALS.nvBarreira, BKV.barreira]; SOLID[NV_BARREIRA] = 1; BLOCKY[NV_BARREIRA] = 0; SEETHRU[NV_BARREIRA] = 1; DIG[NV_BARREIRA] = 0; PCOL[NV_BARREIRA] = '#ff3ec8'; EMIT[NV_BARREIRA] = 0.6;
const NV_DECO = [
  // id, dureza, cor no mapa, o que solta
  [NV_ESCADA, 0.25, '#36f0ff', 'grade'], [NV_CABO, 0.2, '#303038', null], [NV_NEON, 0.1, '#ff3ec8', null], [NV_GOTA, 0.03, '#94f03c', null], [NV_POCA, 0.03, '#6cd422', null],
  [NV_CAPACETE, 0.06, '#ccd2da', null], [NV_DESTROCO, 0.12, '#3e4654', 'chapa_casco'], [NV_FIACAO, 0.05, '#d03a3a', null], [NV_PLANTA, 0.03, '#ff3ec8', null], [NV_HOLO, 0.2, '#36f0ff', null],
  [NV_ESCORA, 0.6, '#3e4654', 'chapa_casco'], [NV_ESTRELA, 0.1, '#ffe53a', null], [NV_POTE, 0.05, '#7dff3a', null], [NV_FEIXE, 0, '#a64dff', null], [NV_EMISSOR, 0, '#e8fbff', null]
];
for (const [t, dig, col, drop] of NV_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[NV_ESCADA] = 0.24; EMIT[NV_NEON] = 0.95; EMIT[NV_GOTA] = 0.2; EMIT[NV_POCA] = 0.3; EMIT[NV_FIACAO] = 0.14; EMIT[NV_PLANTA] = 0.42; EMIT[NV_HOLO] = 0.5;
EMIT[NV_ESTRELA] = 0.34; EMIT[NV_POTE] = 0.3; EMIT[NV_FEIXE] = 0.6; EMIT[NV_EMISSOR] = 0.8;
// o que cai quando o apoio some (56, 87); escada, cabo, escora e feixe ficam (atravessam vãos)
for (const t of [NV_NEON, NV_GOTA, NV_FIACAO]) CV_HANGS[t] = 1;
for (const t of [NV_POCA, NV_CAPACETE, NV_DESTROCO, NV_PLANTA, NV_HOLO, NV_POTE]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[NV_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== NV_ESCADA && solidAt(gx, gy - 1) ? arr[1] : tileAt(gx, gy + 1) !== NV_ESCADA && solidAt(gx, gy + 1) ? arr[2] : arr[0];
DECO_PICK[NV_CABO] = (gx, gy, arr) => tileAt(gx, gy + 1) === NV_CABO || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[NV_NEON] = (gx, gy, arr) => arr[nvNeonIdx(gx, gy) * 4 + (tileAt(gx - 1, gy) !== NV_NEON ? 1 : 0) + (tileAt(gx + 1, gy) !== NV_NEON ? 2 : 0)];
DECO_PICK[NV_GOTA] = (gx, gy, arr) => arr[vr(gx, gy, 24521, 2)];
DECO_PICK[NV_POCA] = (gx, gy, arr) => arr[vr(gx, gy, 24531, 2)];
DECO_PICK[NV_CAPACETE] = (gx, gy, arr) => arr[vr(gx, gy, 24541, 2)];
DECO_PICK[NV_DESTROCO] = (gx, gy, arr) => arr[vr(gx, gy, 24551, 2)];
DECO_PICK[NV_FIACAO] = (gx, gy, arr) => arr[fiaIdx(gx, gy)];
DECO_PICK[NV_PLANTA] = (gx, gy, arr) => arr[plantaCol(gx, gy) * 2 + plantaShape(gx, gy)];
DECO_PICK[NV_ESCORA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== NV_ESCORA ? arr[0] : tileAt(gx, gy - 1) !== NV_ESCORA ? arr[2] : arr[hash2(wrapX(gx), gy, 24595) < 0.3 ? 3 : 1];
DECO_PICK[NV_ESTRELA] = (gx, gy, arr) => arr[estrelaIdx(gx, gy)];
DECO_PICK[NV_POTE] = (gx, gy, arr) => arr[vr(gx, gy, 24611, 4)];
DECO_PICK[NV_FEIXE] = (gx, gy, arr) => arr[gy % 3 === 1 ? 1 : 0];
DECO_PICK[NV_BARREIRA] = (gx, gy, arr) => arr[(gx + gy) & 1];

// a escada de serviço, o cabo e o feixe se escalam como a corrente da catedral; a escada também conta como a escada da
// mina (a pose de subir, 88). O 249 faz o feixe levantar sozinho.
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, NV_ESCADA) || _tt(e, NV_CABO) || _tt(e, NV_FEIXE))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, NV_ESCADA)); }; }

/* ================= ao vivo: o neon brilhando, o tubo que falha, a gota, as faíscas, o holograma, o feixe ================= */
const NV_GL = {};
const nvGlow = (k, r, col) => NV_GL[k] || (NV_GL[k] = glow(r, col));
const NCOL = NV_NEON_COL;
const nvOut = cy => !NAVE || cy + VH < (NV_S0 - 6) * T || cy > (NV_S0 + NV_D + 6) * T;
HOOK.drawGlow.push((cx, cy) => {
  if (nvOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < NV_VIDRO_IMPACTO || t > NV_PLANETA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case NV_NEON: {
        if (nvNeonOff(gx, gy)) break;
        const k = TUBE_K[nvNeonIdx(gx, gy)], c = NCOL[k];
        lc.globalAlpha = 0.3 + Math.sin(tm * 50 + gx) * 0.015; lc.drawImage(nvGlow('nb' + k, 30, c), x + 6 - 30, y + 6 - 30);
        lc.globalAlpha = 0.55; lc.drawImage(nvGlow('ns' + k, 10, c), x - 4, y - 1, 20, 10);
        break;
      }
      case NV_PAINEL_NEON: {
        if ((gx + gy * 2) % 3) break;
        const k = STRIP_K[stripIdx(wrapX(gx) * T + 6, gy * T + 6)];
        lc.globalAlpha = 0.24; lc.drawImage(nvGlow('ns' + k, 10, NCOL[k]), x - 14, y - 2, 40, 16);
        break;
      }
      case NV_PLASMA: {
        if ((gx + gy) & 1) break;
        const b = plasmaBand(wrapX(gx) * T + 6, gy * T + 6);
        lc.globalAlpha = 0.16 + Math.sin(tm * 1.7 + gx * 0.5 + gy * 0.3) * 0.05; lc.drawImage(nvGlow('ar' + b, 16, NV_ARCO[b]), x + 6 - 16, y + 6 - 16);
        break;
      }
      case NV_GOSMA: if ((gx * 3 + gy) % 4) break; lc.globalAlpha = 0.1 + Math.sin(tm * 1.1 + gx) * 0.03; lc.drawImage(nvGlow('g12', 12, NCOL.verde), x + 6 - 12, y + 6 - 12); break;
      case NV_ESCORIA: if ((gx + gy * 3) % 4) break; lc.globalAlpha = 0.09 + Math.sin(tm * 0.8 + gx * 1.3 + gy) * 0.03; lc.drawImage(nvGlow('g9', 9, '#5ad82a'), x + 6 - 9, y + 6 - 9); break;
      case NV_O_XENITA: lc.globalAlpha = 0.1 + Math.max(0, Math.sin(tm * 2.1 + gx * 1.7 + gy)) * 0.08; lc.drawImage(nvGlow('g12', 12, NCOL.verde), x + 6 - 12, y + 6 - 12); break;
      case NV_REATOR: if ((gx * 2 + gy) % 6) break; lc.globalAlpha = 0.07; lc.drawImage(nvGlow('v10', 10, '#c0a8f0'), x + 6 - 10, y + 6 - 10); break;
      case NV_RASTRO: lc.globalAlpha = 0.22 + Math.sin(tm * 6 + gx) * 0.05; lc.drawImage(nvGlow('ar' + ((gx + gy) % 6 + 6) % 6, 16, NV_ARCO[((gx + gy) % 6 + 6) % 6]), x + 6 - 16, y + 6 - 16); break;
      case NV_ANEL: if (gx & 1) break; lc.globalAlpha = 0.16 + Math.sin(tm * 3 + gx * 0.4) * 0.04; lc.drawImage(nvGlow('o14', 14, '#ffa83a'), x + 6 - 14, y + 6 - 14); break;
      case NV_PLANETA: if ((gx + gy) % 4) break; lc.globalAlpha = 0.07; lc.drawImage(nvGlow('o14', 14, '#ffa83a'), x + 6 - 14, y + 6 - 14); break;
      case NV_BARREIRA: lc.globalAlpha = 0.18 + Math.sin(tm * 4 + gy * 0.7) * 0.06; lc.drawImage(nvGlow('p14', 14, NCOL.rosa), x + 6 - 14, y + 6 - 14); break;
      case NV_ESCADA: lc.globalAlpha = 0.14; lc.drawImage(nvGlow('ns' + 'ciano', 10, NCOL.ciano), x - 1, y + 1, 14, 9); break;
      case NV_FEIXE: { const b = ((Math.floor(tm * 3) + gy) % 6 + 6) % 6; lc.globalAlpha = 0.1; lc.drawImage(nvGlow('ar' + b, 16, NV_ARCO[b]), x + 6 - 16, y + 6 - 16); lc.globalAlpha = 0.09; lc.drawImage(nvGlow('w12', 12, NCOL.branco), x, y, 12, 12); break; }
      case NV_EMISSOR: lc.globalAlpha = 0.34 + Math.sin(tm * 5) * 0.05; lc.drawImage(nvGlow('w24', 24, NCOL.branco), x + 6 - 24, y + 7 - 24); break;
      case NV_HOLO: lc.globalAlpha = 0.2 + Math.sin(tm * 9 + gx) * 0.03; lc.drawImage(nvGlow('c16', 16, NCOL.ciano), x + 6 - 16, y - 4 - 16); break;
      case NV_PLANTA: { const k = plantaCol(gx, gy) ? 'ciano' : 'rosa', [bx, by] = PLANTA_B[plantaShape(gx, gy)], p = 0.5 + Math.sin(tm * 1.3 + gx * 2.3 + gy) * 0.5; lc.globalAlpha = 0.1 + p * 0.22; lc.drawImage(nvGlow('pl' + k, 12, NCOL[k]), x + bx - 12, y + by - 12); break; }
      case NV_ESTRELA: { const k = STAR_K[estrelaIdx(gx, gy) >> 1], tw = Math.max(0, Math.sin(tm * 2.4 + hash2(wrapX(gx), gy, 24602) * 20)); lc.globalAlpha = 0.14 + tw * 0.16; lc.drawImage(nvGlow('pl' + k, 12, NCOL[k]), x + 6 - 12, y + 6 - 12); break; }
      case NV_POTE: lc.globalAlpha = 0.14; lc.drawImage(nvGlow('g9', 9, '#5ad82a'), x + 6 - 9, y + 7 - 9); break;
      case NV_GOTA: case NV_POCA: lc.globalAlpha = 0.09; lc.drawImage(nvGlow('g9', 9, '#5ad82a'), x + 6 - 9, y + (t === NV_GOTA ? 2 : 10) - 9); break;
      case NV_FIACAO: { const ph0 = (tm * 0.55 + hash2(wrapX(gx), gy, 24566) * 5) % 1; if (ph0 > 0.1) break; const [px, py] = FIA_PT[fiaIdx(gx, gy)]; lc.globalAlpha = 0.45 * (1 - ph0 / 0.1); lc.drawImage(nvGlow('sp', 10, '#bfe8ff'), x + px - 10, y + py - 10); break; }
    }
  }
  lc.globalAlpha = 1;
});
const HOLO_C = ['#36f0ff', '#a8faff', '#e8ffff', '#1a8aa0'];
// o holograma em cima do projetor: um planetinha com anel, uma estrela ou um disquinho, girando, em linhas de varredura
function drawHolo(X, Y, kind, tm, h) {
  const fl = Math.sin(tm * 37 + h * 9) > 0.92 ? 0.35 : 1, scan = Math.floor(tm * 10) % 3;
  lc.globalAlpha = 0.16 * fl; lc.fillStyle = HOLO_C[0];
  for (let k = 0; k < 6; k++) lc.fillRect(X - 1 - (k >> 1), Y + 7 - k, 2 + (k >> 1) * 2, 1);   // o cone de luz saindo da lente
  const px = (dx, dy, c) => { if (((dy + 20 + scan) % 3) === 0) lc.globalAlpha = 0.45 * fl; else lc.globalAlpha = 0.85 * fl; lc.fillStyle = HOLO_C[c]; lc.fillRect(X + dx, Y + dy, 1, 1); };
  if (kind === 0) {   // o planetinha com anel
    const back = [], front = [];
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.2832 + tm * 1.6, rx = Math.round(Math.cos(a) * 5.4), ry = Math.round(Math.sin(a) * 1.4 - Math.cos(a) * 0.6); (Math.sin(a) < 0 ? back : front).push([rx, ry]); }
    for (const [rx, ry] of back) px(rx, ry - 1, 3);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9.5) px(dx, dy - 1, dx + dy < -2 ? 2 : (dy + Math.floor(tm * 4)) % 3 === 0 ? 1 : 0);
    for (const [rx, ry] of front) px(rx, ry - 1, 1);
  } else if (kind === 1) {   // a estrela de 4 pontas girando no próprio eixo
    const sx = Math.abs(Math.cos(tm * 2.2)), L = 4;
    for (let d = -L; d <= L; d++) px(0, d - 1, Math.abs(d) < 2 ? 2 : 0);
    const W = Math.round(L * sx); for (let d = -W; d <= W; d++) if (d) px(d, -1, Math.abs(d) < 2 ? 1 : 0);
    if (sx > 0.5) { px(-1, -2, 1); px(1, 0, 1); px(1, -2, 1); px(-1, 0, 1); }
  } else {   // o disquinho: a cúpula, a borda com as luzinhas correndo
    for (let dx = -1; dx <= 1; dx++) px(dx, -3, 2); for (let dx = -2; dx <= 2; dx++) px(dx, -2, 1);
    for (let dx = -5; dx <= 5; dx++) px(dx, -1, (dx + 20 + Math.floor(tm * 10)) % 4 === 0 ? 2 : 0);
    for (let dx = -3; dx <= 3; dx++) px(dx, 0, 3);
  }
  lc.globalAlpha = 1;
}
const SPARK = ['#ffffff', '#fff6c0', '#ffd23a', '#7ad8ff'];
HOOK.drawTop.push((cx, cy) => {
  if (nvOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < NV_BARREIRA || t > NV_EMISSOR) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case NV_NEON: if (nvNeonOff(gx, gy)) { lc.fillStyle = '#3a404c'; lc.fillRect(x, y + 3, 12, 1); lc.fillStyle = '#262a32'; lc.fillRect(x, y + 4, 12, 2); } break;
      case NV_GOTA: {   // a gota cresce, solta e cai até o chão
        const ph0 = (tm * 0.3 + hash2(wrapX(gx), gy, 24701)) % 1, gxo = GOTA_X[vr(gx, gy, 24521, 2)];
        if (ph0 < 0.8) { if (ph0 > 0.45) { lc.fillStyle = '#94f03c'; lc.fillRect(x + gxo, y + 6, 1, ph0 > 0.65 ? 2 : 1); } break; }
        let fl = 1; while (fl < 10 && !solidAt(gx, gy + fl)) fl++;
        const f = (ph0 - 0.8) / 0.2, dy = 6 + f * f * (fl * T - 6);
        lc.fillStyle = '#6cd422'; lc.fillRect(x + gxo, y + dy, 1, 2); lc.fillStyle = '#c8ff7a'; lc.fillRect(x + gxo, y + dy, 1, 1);
        if (f > 0.93) { lc.fillStyle = '#94f03c'; lc.fillRect(x + gxo - 1, y + fl * T - 1, 1, 1); lc.fillRect(x + gxo + 1, y + fl * T - 1, 1, 1); }
        break;
      }
      case NV_POCA: {   // uma bolha estoura de vez em quando
        const ph0 = (tm * 0.4 + hash2(wrapX(gx), gy, 24702) * 3) % 1; if (ph0 > 0.14) break;
        const bx = x + 3 + vr(gx, gy, 24703, 6), r = ph0 < 0.07 ? 0 : 1; lc.fillStyle = '#d8ff9a';
        if (!r) lc.fillRect(bx, y + 8, 1, 1); else { lc.fillRect(bx - 1, y + 7, 1, 1); lc.fillRect(bx + 1, y + 7, 1, 1); lc.fillRect(bx, y + 6, 1, 1); }
        break;
      }
      case NV_FIACAO: {   // faíscas espirrando da ponta de cobre
        const ph0 = (tm * 0.55 + hash2(wrapX(gx), gy, 24566) * 5) % 1; if (ph0 > 0.1) break;
        const [px, py] = FIA_PT[fiaIdx(gx, gy)], f = ph0 / 0.1, n = Math.floor(tm * 0.55 + hash2(wrapX(gx), gy, 24566) * 5);
        for (let k = 0; k < 5; k++) { const a = hash2(n, k, 24703) * 6.2832, sp = 4 + hash2(n, k, 24704) * 6, sx = Math.round(Math.cos(a) * sp * f), sy = Math.round(Math.sin(a) * sp * f * 0.6 + f * f * 8); lc.fillStyle = SPARK[k % 4]; lc.fillRect(x + px + sx, y + py + sy, 1, 1); }
        lc.fillStyle = '#ffffff'; lc.fillRect(x + px, y + py, 1, 1);
        break;
      }
      case NV_PLANTA: {   // o bulbo acende e apaga devagar
        const [bx, by] = PLANTA_B[plantaShape(gx, gy)], p = 0.5 + Math.sin(tm * 1.3 + gx * 2.3 + gy) * 0.5; if (p < 0.4) break;
        lc.globalAlpha = (p - 0.4) * 1.4; lc.fillStyle = plantaCol(gx, gy) ? '#d8fdff' : '#ffd0f2'; lc.fillRect(x + Math.round(bx) - 1, y + Math.round(by) - 1, 2, 2); lc.globalAlpha = 1;
        break;
      }
      case NV_HOLO: drawHolo(x + 6, y - 6, vr(gx, gy, 24705, 3), tm + hash2(wrapX(gx), gy, 24706) * 9, hash2(wrapX(gx), gy, 24707)); break;
      case NV_ESTRELA: {   // a estrelinha pisca: os raios crescem e somem
        const tw = Math.sin(tm * 2.4 + hash2(wrapX(gx), gy, 24602) * 20); if (tw < 0.55) break;
        const L = 2 + Math.round((tw - 0.55) * 9); lc.globalAlpha = 0.8; lc.fillStyle = '#ffffff';
        lc.fillRect(x + 6, y + 6 - L, 1, L * 2 + 1); lc.fillRect(x + 6 - L, y + 6, L * 2 + 1, 1); lc.globalAlpha = 1;
        break;
      }
      case NV_POTE: { const ph0 = (tm * 0.5 + hash2(wrapX(gx), gy, 24708)) % 1; lc.fillStyle = '#d8ff9a'; lc.fillRect(x + 4 + vr(gx, gy, 24709, 4), y + 10 - Math.round(ph0 * 5), 1, 1); break; }
      case NV_FEIXE: {   // as faixas do arco-íris subindo pela coluna, e um brilho que sobe
        const o = (tm * 26) % 16;
        for (let ly = 0; ly < 12; ly++) {
          const q = ((gy * 12 + ly + o) % 16 + 16) % 16; if (q >= 2) continue;
          lc.globalAlpha = q < 1 ? 0.5 : 0.25;
          for (let b = 0; b < 6; b++) { lc.fillStyle = NV_ARCO[b]; lc.fillRect(x + 1 + Math.round(b * 1.67), y + ly, 2, 1); }
        }
        const sp = (tm * 0.9 + hash2(wrapX(gx), gy, 24710)) % 1; lc.globalAlpha = 0.9; lc.fillStyle = '#ffffff'; lc.fillRect(x + 2 + vr(gx, gy, 24711, 8), y + 11 - Math.round(sp * 12), 1, 1);
        lc.globalAlpha = 1;
        break;
      }
      case NV_EMISSOR: { const k = Math.floor(tm * 8) % 8; lc.fillStyle = '#ffffff'; lc.fillRect(x + 2 + k, y + 8, 1, 1); break; }
      case NV_O_XENITA: {   // de vez em quando a ponta do cristal solta uma estrelinha
        const ph0 = (tm * 0.35 + hash2(wrapX(gx), gy, 24712) * 7) % 1; if (ph0 > 0.08) break;
        const tp = xenTip(gx, gy); if (!tp) break;
        const L = ph0 < 0.04 ? 1 : 2; lc.fillStyle = '#ffffff'; lc.fillRect(x + tp[0], y + tp[1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + tp[0] - L + 1, y + tp[1], L * 2 - 1, 1);
        break;
      }
      case NV_BARREIRA: { const ly = Math.floor(tm * 14 + gx * 3) % 12; lc.globalAlpha = 0.4; lc.fillStyle = '#ffd0f4'; lc.fillRect(x, y + ly, 12, 1); lc.globalAlpha = 1; break; }
      case NV_RASTRO: { const n = Math.floor(tm * 7); if (hash2(wrapX(gx) + n, gy, 24713) < 0.35) { lc.fillStyle = '#ffffff'; lc.fillRect(x + vr(gx + n, gy, 24714, 12), y + vr(gx + n, gy, 24715, 12), 1, 1); } break; }
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(NVART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, pp, wrapT, RX, mixP, neonRamp, NEONR, ARCR, DRN, VIG, GLO, SHEEN, ENER, GLASS,
  STRIP_K, TUBE_K, STAR_K, stripIdx, plasmaBand, nvNeonIdx, nvNeonOff, nvGlow, NV_GL, drawHolo, plate,
  vVidroImp, vEscoria, vCasco, vPainel, vGrade, vLiga, vVidroLab, vGosma, vPlasma, vReator, vRastro, vAnel, vPlaneta, vCascoW, vLabW, vNeonW,
  ESCADA, NEON, CAPACETE, POTE, PLANTA, ESTRELA, HOLO, EMISSOR });
}
