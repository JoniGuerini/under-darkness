'use strict';

/* ================= os Salões do Pesadelo: blocos, paredes, terceira camada, minérios, decoração =================
   Tudo aqui é mole, doméstico e errado (docs/camadas/14-saloes-pesadelo.md, seções 4 e 12). A pedra-sono é lilás e
   parece fora de foco: bolhas grandes e macias sem nenhuma aresta, uma onda lenta passando. O assoalho tem as tábuas
   de comprimentos que não batem e as emendas fora do lugar; a parede forrada é o papel de parede desbotado com as
   flores em losango e as listras, uma emenda descolando; o tijolo mole entorta as fiadas como massa; o azulejo frio é
   verde-água com o rejunte sujo e uma fileira escorregada; o acolchoado é pano estofado em losangos com botões; a
   massa de penas, penas deitadas umas sobre as outras; o vidro de espelho, frio e liso, com um reflexo borrado (o
   brilho que se mexe devagar é desenhado ao vivo); o assoalho queimado, tábua preta com rachas vermelhas. O Nada é
   preto fosco, sem nada. A Moldura Fechada é um espelho de moldura dourada que tapa as portas do Salão na luta.
   Carvão na pedra-sono; a onirita em nódulos lilás que mudam de cor devagar (lilás, rosa, turquesa: ao vivo).
   Como no 131 e no 251: cada material é uma textura sem emenda de 240 x 240 em pixels do mundo; contorno, borda
   acesa, sombra e oclusão vêm do 07. Paredes e terceira camada só leem o tom. Decoração: sprites de 12 x 12 em
   rampas com luz de cima à esquerda. As luzes da camada (vela, abajur, lâmpada, brasa) respiram juntas, devagar,
   8 s por respiração, como alguém dormindo; a lâmpada nua balança, a vela tremula, o despertador anda para trás.
   Ids: 300-pesadelo-api. */
const PSART = {};   // ferramentas para 302-pesadelo-objetos, as coisas (303, 304), o Sem-Rosto (307) e a onirita (308)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro (ficha, seção 12) ---- */
pal('psSono', ['#1a1620', '#2a2434', '#3e364c', '#585068', '#7a7090', '#a69cba']);
pal('psAssoalho', ['#1e140e', '#352418', '#503626', '#6e4c36', '#92684a', '#b88c66']);
pal('psForrada', ['#2a1e24', '#43303a', '#5e4652', '#7e6470', '#a48a94', '#cbb4ba']);
pal('psTijolo', ['#24141a', '#3a2028', '#542e38', '#70404a', '#8e5660', '#ae727a']);
pal('psAzulejo', ['#0e1e1e', '#1a3232', '#2a4a48', '#3e6662', '#5a8a84', '#86b4ac']);
pal('psAcolchoado', ['#24142a', '#3a2244', '#54325e', '#70467c', '#90609c', '#b486bc']);
pal('psPenas', ['#3a343c', '#58505a', '#7a7280', '#a098a6', '#c8c0cc', '#ece6f0']);
pal('psEspelho', ['#0e1418', '#1c2a32', '#34505c', '#5a808e', '#94b8c4', '#dcf0f4']);
pal('psQueimado', ['#120806', '#1e0b07', '#2a0e08', '#3a120a', '#4a160c', '#5e1c0e']);
pal('psNada', ['#000000', '#020203', '#040405', '#060608', '#08080a', '#0a0a0d']);
pal('psMoldura', ['#2a1e0a', '#4a3612', '#7a5a1e', '#a8822e', '#d4ae4a', '#f4dc8a']);
// paredes de fundo: escuras; a cor fica com os objetos
pal('psPapelW', ['#0c080a', '#120c0f', '#181014', '#1f151a', '#271b21', '#302228']);
pal('psLambriW', ['#0a0705', '#0f0b08', '#150f0b', '#1b140e', '#221912', '#2a1f17']);
pal('psSonoW', ['#08070a', '#0c0a0f', '#110e15', '#16121b', '#1c1722', '#231d2a']);
pal('psAzulejoW', ['#050a0a', '#081010', '#0c1616', '#101c1c', '#152322', '#1a2b2a']);
pal('psEspelhoW', ['#05070a', '#080b0f', '#0c1015', '#10151b', '#151b22', '#1c232c']);
// a terceira camada: as casas tortas (a janela acesa no tom 5), o corredor sem fim (a luz do fundo no tom 5), o
// brilho vermelho do Abismo lá embaixo
pal('dpPsCasas', ['#020103', '#050307', '#09060c', '#0e0a12', '#15101a', '#8a6a30']);
pal('dpPsCorredor', ['#020304', '#040607', '#07090b', '#0b0e10', '#101417', '#3a4038']);
pal('dpPsBrilho', ['#030101', '#080202', '#100404', '#1c0606', '#2e0a08', '#5a1408']);

const wrapT = v => ((v % TP) + TP) % TP;
const RX = hexes => hexes.map(h => ph(h));
const W2 = Math.PI * 2 / TP;   // senos só com múltiplos inteiros disto: a textura não tem emenda
const FLOR = RX(['#5a3442', '#8a5466', '#b47c8c', '#d8a8b2']);        // as flores do papel
const VERDE = RX(['#2a3a2a', '#3e5440', '#587258']);                   // as folhinhas do papel
const RACHA = RX(['#5a1406', '#a02a0a', '#e05a14', '#ffb050']);       // as rachas acesas do queimado
const BOTAO = RX(['#1a0e20', '#3a2244', '#7a5a8a', '#c0a0d0']);       // os botões do acolchoado
const PREGO = RX(['#1a1410', '#4a4038', '#8a7e70']);
const REJ = RX(['#1a1c18', '#2e302a', '#46483e']);                     // o rejunte sujo
const REFL = RX(['#3a5866', '#7aa0ae', '#b8d8e2', '#f0ffff']);         // o brilho frio do espelho

/* ---- chão sólido ---- */
function vSono(x, y) {   // pedra-sono: bolhas grandes e macias, nenhuma aresta, uma onda lenta atravessando, poros claros
  const c = cells(x, y, 24, 30101, 1.0), e = c.d2 - c.d1;
  let v = 2.5 + cn(x, y, 60, 60, 30102) * 1.6 + cn(x, y, 20, 20, 30103) * 0.5 + cg(x, y, 30104) * 0.22;
  v += (c.ox + c.oy < 0 ? 0.35 : -0.25) * Math.min(1, c.d1 / 8);   // cada bolha acesa de cima à esquerda
  if (e < 3) v -= (3 - e) * 0.32;                                 // a junta mole entre as bolhas
  v += Math.sin(x * W2 * 3 + y * W2 * 2 + cn(x, y, 40, 40, 30105) * 4) * 0.3;   // a onda
  if (hash2(x, y, 30106) < 0.01) v += 1.1;
  return v;
}
// as tábuas: 6 de altura, comprimento sorteado por fiada, e a emenda de cada fiada em lugar nenhum
const plankAt = (x, y, s) => {
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, L = [24, 30, 40, 48, 60][(hash2(row, 0, s) * 5) | 0], off = (hash2(row, 1, s) * L) | 0;
  const xx = wrapT(x + off), bk = Math.floor(xx / L), lx = xx % L;
  return { row, ly, lx, bk, L, id: hash2(bk, row, s + 2) };
};
function vAssoalho(x, y) {   // assoalho: tábuas de comprimentos que não batem, veio comprido, prego na ponta, uma tábua mais escura
  const p = plankAt(x, y, 30111);
  if (p.ly === 5 || p.lx === 0) return 0.5 + cg(x, y, 30112) * 0.3;
  let v = 2.6 + (p.id - 0.5) * 1.3 + (p.ly === 0 ? 0.8 : p.ly === 4 ? -0.6 : 0) + (p.lx === 1 ? 0.4 : p.lx === p.L - 1 ? -0.5 : 0);
  v += Math.sin((x + p.bk * 37) * 0.31 + Math.sin(y * 0.9 + p.bk) * 1.6) * 0.35 + cg(x, y, 30113) * 0.4;   // o veio
  const k = Math.hypot(p.lx - p.L * (0.3 + p.id * 0.4), (p.ly - 2.5) * 2.2); if (k < 2.2 && p.id > 0.6) v -= (2.2 - k) * 0.6;   // um nó
  if ((p.lx === 2 || p.lx === p.L - 3) && p.ly === 2) { MATX = PREGO[p.lx === 2 ? 2 : 1]; return -9; }
  return v;
}
function vForrada(x, y) {   // parede forrada: listras finas, flores em losango, desbotada em manchas, uma emenda descolando
  const sx = wrapT(x) % 24, sy = wrapT(y) % 24, gx = Math.floor(wrapT(x) / 24), gy = Math.floor(wrapT(y) / 24);
  let v = 3.1 + cn(x, y, 50, 50, 30121) * 1.1 + cg(x, y, 30122) * 0.25;
  if (sx === 11 || sx === 12) v -= 0.5;                              // a listra
  if (sx === 0) { v -= 1.4; if (hash2(gx, Math.floor(wrapT(y) / 8), 30123) < 0.3) v += 2.2; }   // a emenda do rolo, descolando
  const fx = (sx + (gy & 1 ? 12 : 0)) % 24 - 6, fy = sy - 12, d = Math.hypot(fx, fy);   // a flor no meio do losango
  if (d < 3.2) {
    const a = Math.atan2(fy, fx), pet = Math.cos(a * 5) * 0.8 + 2.2;
    if (d < 1.1) { MATX = FLOR[3]; return -9; }
    if (d < pet) { MATX = FLOR[fx + fy < 0 ? 2 : d > pet - 0.8 ? 0 : 1]; return -9; }
  }
  if (Math.abs(fx - 3) < 1 && fy > 2 && fy < 6) { MATX = VERDE[1]; return -9; }   // a folhinha
  if (cn(x, y, 30, 30, 30124) > 0.3) v -= 0.6;                     // desbotado
  return v;
}
function vTijolo(x, y) {   // tijolo mole: fiadas de 6 que entortam como massa, juntas grossas, uma ou outra barriga
  const bend = Math.round(Math.sin(x * W2 * 4 + cn(x, y, 60, 60, 30131) * 3) * 2);
  const yy = wrapT(y + bend), row = Math.floor(yy / 6), ly = yy % 6, off = row & 1 ? 9 : 0, xx = wrapT(x + off), bk = Math.floor(xx / 18), lx = xx % 18;
  if (ly === 5 || lx === 0) return 0.6 + cg(x, y, 30132) * 0.3;
  let v = 2.8 + (hash2(bk, row, 30133) - 0.5) * 1.1 + (ly === 0 ? 0.9 : ly === 4 ? -0.6 : 0) + (lx === 1 ? 0.4 : lx === 17 ? -0.5 : 0) + cg(x, y, 30134) * 0.45;
  const bel = Math.hypot(lx - 9, (ly - 2.5) * 2); if (hash2(bk, row, 30135) < 0.2 && bel < 5) v += (5 - bel) * 0.16;
  return v;
}
function vAzulejo(x, y) {   // azulejo frio: quadrados de 10, rejunte sujo, o brilho no canto, uma fileira escorregada
  const row = Math.floor(wrapT(y) / 10), slip = hash2(row, 0, 30141) < 0.25 ? 4 : 0, xx = wrapT(x + slip), lx = xx % 10, ly = wrapT(y) % 10, bk = Math.floor(xx / 10);
  if (lx === 0 || ly === 0) { MATX = REJ[hash2(x, y, 30142) < 0.3 ? 0 : hash2(x, y, 30143) < 0.5 ? 1 : 2]; return -9; }
  let v = 3.0 + (hash2(bk, row, 30144) - 0.5) * 0.6 + (ly === 1 ? 0.7 : ly === 9 ? -0.6 : 0) + (lx === 1 ? 0.4 : lx === 9 ? -0.5 : 0) + cg(x, y, 30145) * 0.2;
  if (lx >= 2 && lx <= 3 && ly >= 2 && ly <= 3) v += 1.4;           // o brilho
  if (hash2(bk, row, 30146) < 0.08) { const cr = Math.abs((lx - ly) + (hash2(bk, row, 30147) - 0.5) * 4); if (cr < 0.6) v -= 1.8; }   // trincado
  if (cn(x, y, 24, 40, 30148) > 0.32) v -= 0.7;                    // a sujeira escorrendo
  return v;
}
function vAcolchoado(x, y) {   // acolchoado: losangos estofados, os botões fundos nas pontas, o pano em volta inchado
  const u = (x + y) / 14, w = (x - y) / 14, fu = u - Math.floor(u) - 0.5, fw = w - Math.floor(w) - 0.5, d = Math.hypot(fu, fw);
  const ex = Math.max(Math.abs(fu), Math.abs(fw));
  let v = 3.2 - ex * 3.2 + (fu + fw < 0 ? 0 : -0.3) - fu * 0.8 + cg(x, y, 30151) * 0.3 + cn(x, y, 40, 40, 30152) * 0.6;
  if (ex > 0.46) v -= 1.2;                                            // a costura
  const bu = Math.hypot(Math.abs(fu) - 0.5, Math.abs(fw) - 0.5);
  if (bu < 0.09) { MATX = BOTAO[bu < 0.04 ? 3 : 2]; return -9; }
  if (bu < 0.14) { MATX = BOTAO[0]; return -9; }
  return v;
}
function vPenas(x, y) {   // massa de penas: penas deitadas em camadas, o cálamo claro no meio, as farpas abrindo
  const c = cells(x, y, 9, 30161, 1.6), a = c.id * 1.2 - 0.6, ca = Math.cos(a), sa = Math.sin(a);
  const u = c.ox * ca + c.oy * sa, w = -c.ox * sa + c.oy * ca;
  let v = 3.0 + cn(x, y, 40, 40, 30162) * 0.8 + cg(x, y, 30163) * 0.35;
  if (Math.abs(w) < 0.6 && Math.abs(u) < 6) v += 1.2;               // o cálamo
  else v += Math.sin(u * 2.4 + w * 0.8) * 0.4 + (w < 0 ? 0.3 : -0.4);
  if (c.d2 - c.d1 < 1) v -= 1.1;
  return v;
}
function vEspelho(x, y) {   // vidro de espelho: liso e frio, faixas largas e macias, um reflexo borrado, o risco claro inclinado
  let v = 2.4 + cn(x, y, 80, 80, 30171) * 1.0 + Math.sin(x * W2 * 2 - y * W2 * 3) * 0.5 + cg(x, y, 30172) * 0.08;
  const s = Math.sin((x * 0.9 - y) * W2 * 6 + cn(x, y, 60, 60, 30173) * 3);
  if (s > 0.95) { MATX = REFL[s > 0.99 ? 3 : 2]; return -9; }
  if (s > 0.86) v += (s - 0.86) * 14;
  if (cn(x, y, 30, 50, 30174) > 0.35) v -= 0.8;                    // a mancha do reflexo
  return v;
}
function vQueimado(x, y) {   // assoalho queimado: as mesmas tábuas, pretas, com escamas de carvão e rachas vermelhas acesas
  const p = plankAt(x, y, 30181);
  if (p.ly === 5 || p.lx === 0) { if (hash2(x, y, 30182) < 0.4) { MATX = RACHA[1]; return -9; } return 0.3; }
  const c = cells(x, y, 5, 30183, 1.8);
  let v = 2.2 + (p.id - 0.5) * 0.8 + (p.ly === 0 ? 0.6 : 0) + cg(x, y, 30184) * 0.5 + (c.d2 - c.d1 < 0.8 ? -1.2 : 0);
  const cr = Math.abs(cn(x, y, 18, 18, 30185)); if (cr < 0.012) { MATX = RACHA[cr < 0.004 ? 3 : cr < 0.008 ? 2 : 1]; return -9; }
  return v;
}
function vNada(x, y) { return 1.2 + cg(x, y, 30191) * 0.2; }   // o Nada: preto fosco, nem grão
function vMoldura(x, y) {   // a Moldura Fechada (ícone e mapa): moldura dourada e o espelho escuro no meio
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  if (lx < 2 || lx > 9 || ly < 2 || ly > 9) return 3.2 + (lx < 2 || ly < 2 ? 1.2 : -0.6) + cg(x, y, 30195) * 0.5;
  return 0.6 + (lx + ly) * 0.06;
}
/* ---- paredes de fundo ---- */
function vPapelW(x, y) { const v = vForrada(x, y); return v === -9 ? (MATX === FLOR[3] || MATX === FLOR[2] ? 4.4 : 3.4) : v - 0.2; }
function vLambriW(x, y) {   // lambri: réguas verticais de 8 com a junta funda e o rodapé a cada 30
  const lx = wrapT(x) % 8, ly = wrapT(y) % 30;
  if (ly < 3) return ly === 0 ? 4 : 2.6 - ly * 0.3;
  let v = 2.8 + (lx === 0 ? -1.6 : lx === 1 ? 0.6 : lx === 7 ? -0.5 : 0) + Math.sin(y * 0.4 + Math.floor(wrapT(x) / 8) * 3) * 0.25 + cg(x, y, 30201) * 0.4;
  return v;
}
const vSonoW = (x, y) => vSono(x, y) - 0.2;
function vAzulejoW(x, y) { const v = vAzulejo(x, y); return v === -9 ? 0.8 : v - 0.2; }
function vEspelhoW(x, y) { const v = vEspelho(x, y); return v === -9 ? 4.6 : v; }
/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpCasas(x, y) {   // casas tortas soltas no escuro: o telhado pontudo inclinado, a parede, uma janela acesa
  let v = 0.6 + cn(x, y, 60, 60, 30211) * 0.4;
  for (const [cx, cy, w, h, tilt, k] of [[40, 150, 46, 40, 0.18, 0], [150, 90, 36, 30, -0.22, 1], [210, 190, 30, 26, 0.1, 2], [96, 40, 28, 22, -0.12, 3]]) {
    const dx = wrapD(x - cx), dy = wrapD(y - cy), rx = dx + dy * tilt;
    if (Math.abs(rx) < w / 2 && dy > -h / 2 && dy < h / 2) {
      v = 2.6 + (rx < 0 ? 0.4 : -0.2) + cg(x, y, 30212) * 0.3;
      const wx = rx - (k & 1 ? -w / 5 : w / 6), wy = dy - h / 8;
      if (Math.abs(wx) < 3.5 && Math.abs(wy) < 4.5) v = Math.abs(wx) < 0.5 || Math.abs(wy) < 0.5 ? 2 : k === 1 ? 2.2 : 5;   // a janela (uma apagada)
    } else if (dy <= -h / 2 && dy > -h / 2 - w * 0.45 && Math.abs(rx) < (dy + h / 2 + w * 0.45) * 1.1) v = 3.2 + cg(x, y, 30213) * 0.3;   // o telhado
  }
  return v;
}
function vDpCorredor(x, y) {   // o corredor que some em perspectiva: as linhas do chão e do teto correndo para um ponto, portas iguais
  const cx = 120, cy = 120, dx = wrapD(x - cx), dy = wrapD(y - cy), ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax < 6 && ay < 9) return 5 - Math.max(ax / 6, ay / 9) * 1.5;   // a luz do fim
  const r = Math.max(ax, ay * 1.3), ring = Math.log(r + 1) * 4.2;
  let v = 1.6 + (ay * 1.3 > ax ? 0.4 : -0.1) + cg(x, y, 30221) * 0.2;
  if ((ring % 1) < 0.12) v += 1.2;                                     // os batentes repetindo
  if (Math.abs(Math.abs(dx) - Math.abs(dy) * 1.3) < 1.2) v -= 0.8;     // os cantos
  if (ay * 1.3 < ax && (ring % 1) > 0.3 && (ring % 1) < 0.6 && ay < ax * 0.55 && dy < 0) v += 0.9;   // as portas
  return Math.max(0, v - r * 0.004);
}
function vDpBrilho(x, y) {   // o vermelho fundo e distante: rocha escura com fendas que respiram o fogo de baixo
  let v = 1.4 + cn(x, y, 80, 80, 30231) * 1.2 + cg(x, y, 30232) * 0.2;
  const cr = Math.abs(cn(x, y, 40, 40, 30233)); if (cr < 0.02) v = 5 - cr * 60;
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  sono: bake(vSono), assoalho: bake(vAssoalho), forrada: bake(vForrada), tijolo: bake(vTijolo), azulejo: bake(vAzulejo), acolchoado: bake(vAcolchoado),
  penas: bake(vPenas), espelho: bake(vEspelho), queimado: bake(vQueimado), nada: bake(vNada), moldura: bake(vMoldura),
  papelW: bake(vPapelW), lambriW: bake(vLambriW), sonoW: bake(vSonoW), azulejoW: bake(vAzulejoW), espelhoW: bake(vEspelhoW),
  dpCasas: bake(vDpCasas), dpCorredor: bake(vDpCorredor), dpBrilho: bake(vDpBrilho)
};
const PS_SOLID = [
  // id, paleta, textura, dureza, cor no mapa (lilás desbotado nas três primeiras faixas, cinza-espelho na Galeria)
  [PS_SONO, 'psSono', 'sono', 1.2, '#6e5a78'], [PS_ASSOALHO, 'psAssoalho', 'assoalho', 0.8, '#6e4c36'], [PS_FORRADA, 'psForrada', 'forrada', 0.9, '#7e6470'],
  [PS_TIJOLO, 'psTijolo', 'tijolo', 1.1, '#70404a'], [PS_AZULEJO, 'psAzulejo', 'azulejo', 1.3, '#5a8a84'], [PS_ACOLCHOADO, 'psAcolchoado', 'acolchoado', 0.6, '#70467c'],
  [PS_PENAS, 'psPenas', 'penas', 0.2, '#a098a6'], [PS_ESPELHO, 'psEspelho', 'espelho', 1.5, '#7a8a94'], [PS_QUEIMADO, 'psQueimado', 'queimado', 1.0, '#4a160c'],
  [PS_NADA, 'psNada', 'nada', 0, '#000000']
];
for (const [t, p, k, dig, col] of PS_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [PS_SONO, PS_PENAS, PS_ACOLCHOADO]) BLEND[t] = 1;
EMIT[PS_QUEIMADO] = 0.12; EMIT[PS_ESPELHO] = 0.08;

WMAT[WPS_PAPEL] = [PALS.psPapelW, BKV.papelW]; WMAT[WPS_LAMBRI] = [PALS.psLambriW, BKV.lambriW]; WMAT[WPS_SONO] = [PALS.psSonoW, BKV.sonoW];
WMAT[WPS_AZULEJO] = [PALS.psAzulejoW, BKV.azulejoW]; WMAT[WPS_ESPELHO] = [PALS.psEspelhoW, BKV.espelhoW];
DMAT[DP_PS_CASAS] = [PALS.dpPsCasas, BKV.dpCasas]; DMAT[DP_PS_CORREDOR] = [PALS.dpPsCorredor, BKV.dpCorredor]; DMAT[DP_PS_BRILHO] = [PALS.dpPsBrilho, BKV.dpBrilho];

/* ---- os minérios: carvão na pedra-sono; a onirita em nódulos lisos, como óleo na água (a cor gira ao vivo) ---- */
oreRamp(PS_O_ONIRITA, ['#1a1030', '#34205a', '#5a3a8a', '#8a64b8', '#c09ae0', '#f2dcff', '#ffffff']);
const ONI_SPOT = new Map();   // semente do bloco -> os pixels mais claros (onde o rosa e o turquesa passam, ao vivo)
ORE_PAINT[PS_O_ONIRITA] = function (L, s) {
  const R = ORE_RAMP[PS_O_ONIRITA], n = 2 + (hash2(s, 1, 30401) < 0.5 ? 1 : 0), spots = [];
  for (let i = 0; i < n; i++) {
    const big = i === 0, cx = big ? 4.4 + hash2(s, 2, 30402) * 3.2 : 2.4 + hash2(s, 2 + i, 30402) * 7.2, cy = big ? 4.4 + hash2(s, 3, 30403) * 3.2 : 2.4 + hash2(s, 3 + i, 30403) * 7.2;
    const rx = big ? 3.2 + hash2(s, i, 30404) * 0.8 : 1.6 + hash2(s, i, 30404) * 0.6, ry = rx * (0.7 + hash2(s, i, 30405) * 0.3);
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
      // a bolha lisa: clara em cima à esquerda, um anel de cor de óleo no meio
      let l = 3.1 - (dx + dy) * 1.2 - d * 0.6 + Math.sin(d * 7 + s) * 0.35;
      if (d > 0.72) l += dx + dy < 0 ? 0.6 : -1;
      L.put(x, y, ramp(R, Math.min(l, R.length - 2)), l);
      if (l > 3.9) spots.push(x, y);
    }
  }
  ONI_SPOT.set(s, spots);
};
ORE_HALO[PS_O_ONIRITA] = { pal: ['psSono', '#8a64b8', 0.3, 0.14], shade: 0.3 };
ORE_PAINT[PS_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[PS_O_CARVAO] = { pal: ['psSono', '#020204', 0.5, 0.2], shade: 0 };
MAT[PS_O_CARVAO] = [PALS.psSono, bakeOre(PS_O_CARVAO, vSono)]; MAT[PS_O_ONIRITA] = [PALS.psSono, bakeOre(PS_O_ONIRITA, vSono)];
for (const t of [PS_O_CARVAO, PS_O_ONIRITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[PS_O_CARVAO] = DIG[COAL]; ORE_XP[PS_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[PS_O_CARVAO] = ORE_NAME[COAL]; PCOL[PS_O_CARVAO] = PCOL[COAL]; ORE_ITEM[PS_O_CARVAO] = ORE_ITEM[COAL];
DIG[PS_O_ONIRITA] = 2.0; ORE_XP[PS_O_ONIRITA] = 29; ORE_NAME[PS_O_ONIRITA] = 'Onirita'; PCOL[PS_O_ONIRITA] = '#c09ae0'; ORE_ITEM[PS_O_ONIRITA] = 'min_onirita';
EMIT[PS_O_ONIRITA] = 0.3;
const oniSpots = (gx, gy) => ONI_SPOT.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + PS_O_ONIRITA * 7919) | 0);
// o Veio Desfeito: a pedra-sono com uma marca clara onde o veio estava (um anel pálido, vazio)
function vDesfeito(x, y) {
  const v = vSono(x, y), lx = wrapT(x) % 12 - 5.5, ly = wrapT(y) % 12 - 5.5, d = Math.hypot(lx, ly * 1.2);
  if (d > 2.4 && d < 3.6) return v + 1.6 - Math.abs(d - 3) * 1.5;
  if (d <= 2.4) return v - 0.6;
  return v;
}
MAT[PS_VEIO_DESFEITO] = [PALS.psSono, bake(vDesfeito)]; SOLID[PS_VEIO_DESFEITO] = 1; BLOCKY[PS_VEIO_DESFEITO] = 1; BLEND[PS_VEIO_DESFEITO] = 1; DIG[PS_VEIO_DESFEITO] = 1.2; PCOL[PS_VEIO_DESFEITO] = '#8a7a98';

/* ---- itens de bloco ---- */
const PS_ITEMS = {
  pedra_sono: ['Pedra-Sono', PS_SONO, 'Pedra lilás e mole, como se estivesse um pouco fora de foco. Dá vontade de deitar a cabeça nela.'],
  assoalho: ['Assoalho', PS_ASSOALHO, 'Tábuas de uma casa que ninguém lembra. As emendas não batem.'],
  parede_forrada: ['Parede Forrada', PS_FORRADA, 'Um pedaço de parede com papel de flores desbotado. Por baixo tem outro papel.'],
  tijolo_mole: ['Tijolo Mole', PS_TIJOLO, 'Tijolo que entorta na mão como massa e volta devagar.'],
  azulejo: ['Azulejo Frio', PS_AZULEJO, 'Azulejo verde-água de corredor de hospital. O rejunte está sujo.'],
  acolchoado: ['Acolchoado', PS_ACOLCHOADO, 'Pano estofado com botões, das paredes dos quartos. Abafa tudo.'],
  penas: ['Penas', PS_PENAS, 'Um punhado de penas de travesseiro, apertadas até virar bloco.'],
  vidro_espelho: ['Vidro de Espelho', PS_ESPELHO, 'Vidro frio. O reflexo nele se mexe um pouco depois de você.'],
  assoalho_queimado: ['Assoalho Queimado', PS_QUEIMADO, 'Tábua preta do fundo da camada. Ainda está quente e as rachas brilham.']
};
for (const id in PS_ITEMS) { const [name, block, desc] = PS_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[PS_VEIO_DESFEITO] = 'pedra_sono';
// o Nada e a Moldura não soltam nada (não quebram)

/* ================= decoração: sprites de 12 x 12 em rampas ================= */
const DRE = {
  madeira: ['#1e140e', '#352418', '#503626', '#6e4c36', '#92684a', '#b88c66', '#dcb48a'],
  lencol: ['#3a3640', '#5a5462', '#7e7888', '#a29cac', '#c6c0ce', '#e4e0ea', '#ffffff'],
  cera: ['#4a3a2a', '#7a6448', '#a8906a', '#cebc94', '#e8dcbc', '#f8f0dc', '#ffffff'],
  pano: ['#3a1a10', '#5e2c18', '#8a4424', '#b4642e', '#d88e44', '#f0b868', '#ffe0a0'],
  metal: ['#141416', '#2a2a30', '#4a4a54', '#727280', '#a0a0ae', '#cacad6', '#f0f0f8'],
  vidro: ['#2a2410', '#5a4a1c', '#a08830', '#e0c450', '#f8e488', '#fff4c0', '#ffffff'],
  brinq: ['#2a0a0a', '#5a1414', '#8a2020', '#b83a2a', '#e0603a', '#f49a5a', '#ffd0a0'],
  azul: ['#0a1630', '#14285a', '#203e84', '#3058aa', '#4e7ccc', '#7aa4e4', '#c0d8f8'],
  pena: ['#4a4450', '#6e6878', '#948e9e', '#bab4c4', '#dcd6e4', '#f4f0f8', '#ffffff'],
  la: ['#3a1022', '#5e1a36', '#88284e', '#b03e6a', '#d0608a', '#ec90b0', '#ffc8dc'],
  espelho: ['#0e1418', '#1c2a32', '#34505c', '#5a808e', '#94b8c4', '#dcf0f4', '#ffffff'],
  dente: ['#4a4436', '#7a705a', '#a89c80', '#d0c6a8', '#ece4cc', '#faf6e8', '#ffffff'],
  brasa: ['#1a0604', '#3a0c06', '#6a1608', '#a82a0a', '#e05a14', '#ff9a3a', '#ffe0a0'],
  ouro: ['#2a1e0a', '#4a3612', '#7a5a1e', '#a8822e', '#d4ae4a', '#f4dc8a', '#fffad0']
};
for (const k in DRE) DRE[k] = DRE[k].map(h => ph(h));
const M = DRE.madeira;

// a escada de mão torta: os dois trilhos inclinados, os degraus de tamanhos e alturas diferentes
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), y0 = k === 1 ? 1 : 0, y1 = k === 2 ? 10 : 11, lean = (hash2(s, 0, 3) - 0.5) * 1.6;
  for (let y = y0; y <= y1; y++) { const o = Math.round(lean * (y - 6) / 6); a.put(2 + o, y, M, 4.6); a.put(3 + o, y, M, 2.6); a.put(8 + o, y + (y & 1 ? 0 : 0), M, 4.2); a.put(9 + o, y, M, 2.2); }
  const rungs = k === 2 ? [3, 7] : [2 + ((hash2(s, 1, 3) * 2) | 0), 7 + ((hash2(s, 2, 3) * 2) | 0)];
  for (const ry of rungs) { const tilt = hash2(s, ry, 4) < 0.5 ? 1 : 0, o = Math.round(lean * (ry - 6) / 6); for (let x = 3; x <= 8; x++) { a.put(x + o, ry + (tilt && x > 6 ? 1 : 0), M, 5 - (x - 3) * 0.2 + cg(x, ry, s) * 0.4); a.put(x + o, ry + 1 + (tilt && x > 6 ? 1 : 0), M, 1.8); } }
  if (k === 1) { a.put(2, 0, M, 5.4); a.put(8, 0, M, 5); }
  return rimOut(a, M[0], false);
}
const ESCADA = [escadaSprite(0, 30501), escadaSprite(1, 30502), escadaSprite(2, 30503)];
// lençóis amarrados: o pano torcido, um nó a cada bloco, a ponta solta embaixo
function cordaSprite(end, s) {
  const a = spr(), L = DRE.lencol, len = end ? 10 : 12;
  for (let y = 0; y < len; y++) {
    const cx = 5.5 + Math.sin(y * 0.7 + s) * 0.8, hw = 1.6 + Math.sin(y * 1.3 + s) * 0.5;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) a.put(x, y, L, 3.6 - (x - cx) * 0.7 + ((y + x) % 3 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  }
  const ky = end ? 2 : 5; for (let x = 3; x <= 8; x++) { a.put(x, ky, L, 5 - Math.abs(x - 5) * 0.5); a.put(x, ky + 1, L, 2.4); }   // o nó
  if (end) { for (const [x, y, v] of [[3, 10, 3], [4, 11, 2.6], [7, 10, 3.4], [8, 11, 2.2], [5, 11, 4]]) a.put(x, y, L, v); }   // a ponta desfiada
  return rimOut(a, L[0], false);
}
const CORDA = [cordaSprite(false, 30511), cordaSprite(false, 30512), cordaSprite(true, 30513)];
// a vela derretida: a cera escorrida numa poça, o pavio preto (a chama é ao vivo)
const VELA_F = [[5, 2], [6, 4]];
function velaSprite(v, s) {
  const a = spr(), C = DRE.cera, top = v ? 5 : 3, x0 = v ? 5 : 4, w = v ? 2 : 3;
  for (let y = top; y < 11; y++) for (let x = x0; x < x0 + w; x++) a.put(x, y, C, 4.4 - (x - x0) * 0.9 + cg(x, y, s) * 0.3);
  for (let x = x0 - 3; x <= x0 + w + 2; x++) { a.put(x, 11, C, 3.2 - Math.abs(x - x0 - 1) * 0.3); if (Math.abs(x - x0 - 1) < 3) a.put(x, 10, C, 3.6); }   // a poça
  for (const [dx, h] of [[-1, 3], [w, 4]]) for (let y = top + 1; y < top + 1 + h; y++) a.put(x0 + dx, y, C, 3.8);   // as gotas escorridas
  a.put(VELA_F[v][0], top - 1, DRE.metal, 0.6);
  return rimOut(a, C[0], false);
}
const VELA = [velaSprite(0, 30521), velaSprite(1, 30522)];
// o abajur: a cúpula de pano plissado com a franja, o pé torneado, a base redonda (a lâmpada acesa é ao vivo)
function abajurSprite(s) {
  const a = spr(), P = DRE.pano, W = DRE.madeira;
  for (let y = 0; y < 5; y++) { const hw = 2 + y * 0.7; for (let x = Math.floor(5.5 - hw); x <= 5.5 + hw; x++) a.put(x, y, P, 4.4 - (x - 5.5) / hw * 1.2 - y * 0.2 + ((x & 1) ? -0.5 : 0)); }
  for (let x = 2; x <= 9; x += 2) a.put(x, 5, P, 2.4);   // a franja
  for (let y = 5; y < 10; y++) { a.put(5, y, W, 4.4 - (y === 7 ? -0.6 : 0)); a.put(6, y, W, 2.4); }
  for (let x = 3; x <= 8; x++) { a.put(x, 10, W, 4 - (x - 3) * 0.3); a.put(x, 11, W, 1.8); }
  return rimOut(a, P[0], false);
}
const ABAJUR = [abajurSprite(30531)];
// a lâmpada nua: o fio do teto e a rosca; o bulbo (que balança) é ao vivo
function lampadaSprite(s) { const a = spr(), K = DRE.metal; for (let y = 0; y < 5; y++) a.put(5, y, K, 1.6 + (y & 1) * 0.6); a.put(4, 5, K, 3.4); a.put(5, 5, K, 4.4); a.put(6, 5, K, 2.4); return rimOut(a, K[0], false); }
const LAMPADA = [lampadaSprite(30541)];
// os brinquedos: um pião, um cubo de letras, um soldadinho
function brinquedoSprite(k, s) {
  const a = spr(), B = DRE.brinq, Z = DRE.azul, W = DRE.madeira;
  if (k === 0) {   // o pião deitado de lado
    disc(a, 5.5, 8, 4, 2.5, B, (dx, dy) => 3.4 - dx - dy * 1.2 + (Math.abs(dy) < 0.25 ? 1 : 0));
    for (let x = 9; x <= 11; x++) a.put(x, 8, W, 3.6 - (x - 9) * 0.5); a.put(1, 8, W, 2);
  } else if (k === 1) {   // o cubo de letras: a face da frente com a letra
    for (let y = 4; y < 12; y++) for (let x = 2; x < 10; x++) a.put(x, y, Z, 3.2 + (y === 4 ? 1.2 : 0) + (x === 2 ? 0.6 : 0) - (y === 11 || x === 9 ? 1 : 0));
    for (const [x, y] of [[4, 6], [5, 6], [6, 6], [4, 7], [4, 8], [5, 8], [6, 8], [4, 9], [4, 10]]) a.put(x + 0.5, y, DRE.cera, 5);   // um F, ou um E incompleto
  } else {   // o soldadinho de chumbo: a barretina, a farda vermelha, a calça azul
    for (let y = 0; y < 3; y++) for (let x = 4; x < 7; x++) a.put(x, y, Z, 2.6 + (x === 4 ? 1 : 0));
    for (let x = 4; x < 7; x++) a.put(x, 3, DRE.cera, 4.6);
    for (let y = 4; y < 8; y++) for (let x = 4; x < 7; x++) a.put(x, y, B, 3.4 + (x === 4 ? 0.8 : 0) - (x === 6 ? 0.8 : 0));
    for (let y = 8; y < 11; y++) { a.put(4, y, Z, 3); a.put(6, y, Z, 2); }
    for (let x = 3; x < 8; x++) a.put(x, 11, W, 3 - (x - 3) * 0.3);
    for (let y = 1; y < 8; y++) a.put(8, y, DRE.metal, 4.6 - y * 0.2);   // a baioneta no ombro
  }
  return rimOut(a, B[0], false);
}
const BRINQUEDO = [brinquedoSprite(0, 30551), brinquedoSprite(1, 30552), brinquedoSprite(2, 30553)];
// o despertador: o corpo redondo de lata, os dois sinos em cima, os pés; os ponteiros são ao vivo (para trás)
const DESP_C = [6, 6.5];
function despertadorSprite(s) {
  const a = spr(), K = DRE.metal, B = DRE.brinq;
  disc(a, 6, 6.5, 4.2, 4.2, B, (dx, dy) => 3.6 - dx - dy);
  disc(a, 6, 6.5, 3, 3, DRE.cera, (dx, dy, d) => 4.8 - d * 0.6);
  for (const x of [2, 9]) { disc(a, x + 0.5, 2, 1.6, 1.4, K, (dx, dy) => 4.4 - dx - dy); }
  a.put(5.5, 1.5, K, 4); a.put(6, 1, K, 4.6);
  for (const x of [3, 8]) { a.put(x, 11, K, 3); a.put(x + (x < 6 ? -1 : 1), 11, K, 2); }
  for (const [dx, dy] of [[0, -2.4], [2.4, 0], [0, 2.4], [-2.4, 0]]) a.put(6 + dx, 6.5 + dy, K, 1.2);   // as marcas das horas
  return rimOut(a, K[0], false);
}
const DESPERTADOR = [despertadorSprite(30561)];
// penas no chão
function penaSprite(s) { const a = spr(), P = DRE.pena; for (let i = 0; i < 3; i++) { const cx = 2.5 + hash2(s, i, 1) * 7, cy = 9 + hash2(s, i, 2) * 2, ang = hash2(s, i, 3) * 3; for (let t = -3; t <= 3; t += 0.5) { const x = cx + Math.cos(ang) * t, y = cy + Math.sin(ang) * t * 0.4; a.put(x, y, P, 4.8 - Math.abs(t) * 0.3); a.put(x + 0.5, y + 1, P, 2.8 - Math.abs(t) * 0.2); } } return rimOut(a, P[0], false); }
const PENA = [penaSprite(30571), penaSprite(30572)];
// fios de lã pendurados: dois ou três fios cor-de-rosa caindo do teto, um novelo na ponta de um
function laSprite(s) {
  const a = spr(), L = DRE.la;
  for (let i = 0; i < 3; i++) { const x0 = 3 + i * 3 + ((hash2(s, i, 1) * 2) | 0), len = 5 + ((hash2(s, i, 2) * 6) | 0); for (let y = 0; y < len; y++) a.put(x0 + Math.round(Math.sin(y * 0.6 + i) * 0.7), y, L, 3.6 + ((y + i) & 1 ? 0.6 : -0.4)); }
  disc(a, 6.5, 9.5, 2.3, 2, L, (dx, dy) => 3.6 - dx - dy + (Math.sin((dx - dy) * 6) > 0.5 ? 0.8 : 0));
  return rimOut(a, L[0], false);
}
const LA = [laSprite(30581)];
// cacos de espelho no chão: três lascas frias com o brilho na ponta
const CACO_TIP = [];
function cacosSprite(v) {
  const a = spr(), E = DRE.espelho; let tip = null;
  for (let i = 0; i < 3; i++) {
    const cx = 2.5 + i * 3.2 + hash2(v, i, 5) * 1.5, h = 2 + hash2(v, i, 6) * (i === 1 ? 4 : 2.5), lean = (hash2(v, i, 7) - 0.5) * 2;
    for (let y = 0; y < h; y++) { const yy = 11 - y, w = Math.max(0, (1 - y / h) * 1.8); for (let x = Math.floor(cx - w + lean * y / h); x <= cx + w + lean * y / h; x++) a.put(x, yy, E, 3.4 + (x < cx + lean * y / h ? 1.2 : -0.6) + y * 0.2); }
    if (i === 1) tip = [Math.round(cx + lean), Math.round(11 - h + 1)];
  }
  CACO_TIP[v] = tip;
  return rimOut(a, E[0], false);
}
const CACOS = [cacosSprite(0), cacosSprite(1)];
// dentes de leite: um montinho de dentinhos brancos
function dentesSprite(s) { const a = spr(), D = DRE.dente; for (let i = 0; i < 7; i++) { const x = 3 + hash2(s, i, 1) * 6, y = 9.5 + hash2(s, i, 2) * 1.5 - (i > 4 ? 1.4 : 0); disc(a, x, y, 1.1, 1.2, D, (dx, dy) => 4.2 - dx - dy); a.put(x - 0.5, y + 1, D, 2.4); } return rimOut(a, D[0], false); }
const DENTES = [dentesSprite(30591)];
// brasa no assoalho: um monte de carvão aceso (o brilho respira ao vivo)
function brasaSprite(s) { const a = spr(), B = DRE.brasa; for (let i = 0; i < 6; i++) { const x = 2.5 + hash2(s, i, 1) * 7, y = 10 + hash2(s, i, 2) * 1.5; disc(a, x, y, 1.6, 1.2, B, (dx, dy) => hash2(i, s, 9) < 0.4 ? 5 - dy : 1.6 - dx * 0.5 - dy * 0.5); } return rimOut(a, B[0], false); }
const BRASA = [brasaSprite(30601), brasaSprite(30602)];
// a costura: invisível (só marca a emenda dos laços)
const COSTURA = [spr()];
// a Moldura Fechada: moldura dourada e o vidro escuro, sólida e vazada só na moldura
function molduraSprite(k) {
  const a = spr(), O = DRE.ouro, E = DRE.espelho;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const edgeX = x < 2 || x > 9, edgeY = (k & 1 && y < 2) || (k & 2 && y > 9);
    if (edgeX || edgeY) a.put(x, y, O, 3.4 + (x === 0 || y === 0 ? 1.4 : x === 11 || y === 11 ? -1 : 0) + ((x + y) % 4 === 0 ? 0.6 : 0));
    else a.put(x, y, E, 1.4 + (x - y) * 0.05 + (x === 2 || y === 2 ? 0.6 : 0));
  }
  return a;
}
const MOLDURA = [molduraSprite(0), molduraSprite(1), molduraSprite(2), molduraSprite(3)];

DECO[PS_ESCADA] = ESCADA; DECO[PS_CORDA] = CORDA; DECO[PS_VELA] = VELA; DECO[PS_ABAJUR] = ABAJUR; DECO[PS_LAMPADA] = LAMPADA; DECO[PS_BRINQUEDO] = BRINQUEDO;
DECO[PS_DESPERTADOR] = DESPERTADOR; DECO[PS_PENA] = PENA; DECO[PS_LA] = LA; DECO[PS_CACOS] = CACOS; DECO[PS_DENTES] = DENTES; DECO[PS_BRASA] = BRASA; DECO[PS_COSTURA] = COSTURA;
DECO[PS_BARREIRA] = MOLDURA; MAT[PS_BARREIRA] = [PALS.psMoldura, BKV.moldura]; SOLID[PS_BARREIRA] = 1; BLOCKY[PS_BARREIRA] = 0; SEETHRU[PS_BARREIRA] = 1; DIG[PS_BARREIRA] = 0; PCOL[PS_BARREIRA] = '#dcf0f4'; EMIT[PS_BARREIRA] = 0.4;
const PS_DECO = [
  // id, dureza, cor no mapa, o que solta
  [PS_ESCADA, 0.25, '#92684a', 'assoalho'], [PS_CORDA, 0.15, '#c6c0ce', null], [PS_VELA, 0.05, '#f8f0dc', null], [PS_ABAJUR, 0.2, '#f0b868', null], [PS_LAMPADA, 0.1, '#fff4c0', null],
  [PS_BRINQUEDO, 0.1, '#e0603a', null], [PS_DESPERTADOR, 0.15, '#b83a2a', null], [PS_PENA, 0.02, '#dcd6e4', null], [PS_LA, 0.05, '#d0608a', null], [PS_CACOS, 0.1, '#94b8c4', null],
  [PS_DENTES, 0.05, '#ece4cc', null], [PS_BRASA, 0.1, '#e05a14', null], [PS_COSTURA, 0, '#000000', null]
];
for (const [t, dig, col, drop] of PS_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[PS_VELA] = 0.55; EMIT[PS_ABAJUR] = 0.85; EMIT[PS_LAMPADA] = 0.9; EMIT[PS_CACOS] = 0.18; EMIT[PS_BRASA] = 0.6;
// o que cai quando o apoio some (56, 87); escada e lençóis ficam (atravessam vãos)
for (const t of [PS_LAMPADA, PS_LA]) CV_HANGS[t] = 1;
for (const t of [PS_VELA, PS_ABAJUR, PS_BRINQUEDO, PS_DESPERTADOR, PS_PENA, PS_CACOS, PS_DENTES, PS_BRASA]) CV_STANDS[t] = 1;

const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[PS_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== PS_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== PS_ESCADA ? arr[2] : arr[0];
DECO_PICK[PS_CORDA] = (gx, gy, arr) => tileAt(gx, gy + 1) === PS_CORDA || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
const velaV = (gx, gy) => vr(gx, gy, 30521, 2);
DECO_PICK[PS_VELA] = (gx, gy, arr) => arr[velaV(gx, gy)];
DECO_PICK[PS_BRINQUEDO] = (gx, gy, arr) => arr[vr(gx, gy, 30551, 3)];
DECO_PICK[PS_PENA] = (gx, gy, arr) => arr[vr(gx, gy, 30571, 2)];
const cacoV = (gx, gy) => vr(gx, gy, 30581, 2);
DECO_PICK[PS_CACOS] = (gx, gy, arr) => arr[cacoV(gx, gy)];
DECO_PICK[PS_BRASA] = (gx, gy, arr) => arr[vr(gx, gy, 30601, 2)];
DECO_PICK[PS_BARREIRA] = (gx, gy, arr) => arr[(tileAt(gx, gy - 1) !== PS_BARREIRA ? 1 : 0) + (tileAt(gx, gy + 1) !== PS_BARREIRA ? 2 : 0)];

// a escada torta e os lençóis se escalam como a corrente da catedral; a escada também conta como a da mina (88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, PS_ESCADA) || _tt(e, PS_CORDA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, PS_ESCADA)); }; }

/* ================= ao vivo: a respiração das luzes, a chama, o bulbo, os ponteiros, a onirita, o espelho ================= */
const PS_GL = {};
const psGlow = (k, r, col) => PS_GL[k] || (PS_GL[k] = glow(r, col));
const psOut = cy => cy + VH < (PS_S0 - 6) * T || cy > (PS_S0 + PS_D + 6) * T;
// a respiração: 8 s, de 0 (expira, mais fraca) a 1 (inspira); todas as luzes da camada juntas
const psBreath = () => 0.5 + 0.5 * Math.sin(gameTime * Math.PI * 2 / 8);
// a cor da onirita agora: lilás, rosa, turquesa, devagar, cada bloco um pouco defasado
const ONI_COLS = [[192, 154, 224], [240, 160, 200], [144, 232, 224]];
function oniCol(ph) { const p = ((ph % 3) + 3) % 3, i = Math.floor(p), f = p - i, A = ONI_COLS[i], B = ONI_COLS[(i + 1) % 3], s = f * f * (3 - 2 * f); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * s)},${Math.round(A[1] + (B[1] - A[1]) * s)},${Math.round(A[2] + (B[2] - A[2]) * s)})`; }
// o balanço da lâmpada (em px na ponta do fio)
const lampSwing = (gx, gy) => Math.sin(gameTime * 1.3 + hash2(wrapX(gx), gy, 30701) * 9) * 1.6;
HOOK.drawGlow.push((cx, cy) => {
  if (psOut(cy)) return;
  const tm = gameTime, br = 0.72 + 0.28 * psBreath();
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < PS_SONO || t > PS_COSTURA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case PS_ABAJUR: lc.globalAlpha = 0.3 * br; lc.drawImage(psGlow('ab', 36, PS_COL.abajur), x + 6 - 36, y + 4 - 36); lc.globalAlpha = 0.4 * br; lc.drawImage(psGlow('as', 9, '#fff0c0'), x + 6 - 9, y + 5 - 9); break;
      case PS_LAMPADA: { const sw = lampSwing(gx, gy); lc.globalAlpha = 0.32 * br; lc.drawImage(psGlow('lb', 38, '#ffe0a0'), x + 6 + sw - 38, y + 8 - 38); lc.globalAlpha = 0.45 * br; lc.drawImage(psGlow('ls', 8, '#fffbe0'), x + 6 + sw - 8, y + 8 - 8); break; }
      case PS_VELA: { const f = 0.9 + Math.sin(tm * 11 + gx) * 0.06 + Math.sin(tm * 23 + gy) * 0.04, [fx, fy] = VELA_F[velaV(gx, gy)]; lc.globalAlpha = 0.28 * f * br; lc.drawImage(psGlow('vb', 22, PS_COL.vela), x + fx - 22, y + fy - 22); break; }
      case PS_BRASA: lc.globalAlpha = (0.25 + Math.sin(tm * 2.1 + gx * 0.7) * 0.06) * br; lc.drawImage(psGlow('br', 16, '#ff5a1a'), x + 6 - 16, y + 9 - 16); break;
      case PS_CACOS: lc.globalAlpha = 0.12; lc.drawImage(psGlow('ca', 9, PS_COL.espelho), x + 6 - 9, y + 9 - 9); break;
      case PS_QUEIMADO: if ((gx + gy * 3) % 5) break; lc.globalAlpha = 0.1 + Math.sin(tm * 1.7 + gx) * 0.04; lc.drawImage(psGlow('qb', 12, '#ff4a10'), x + 6 - 12, y + 6 - 12); break;
      case PS_ESPELHO: if ((gx + gy) % 4) break; lc.globalAlpha = 0.05; lc.drawImage(psGlow('eb', 12, PS_COL.espelho), x + 6 - 12, y + 6 - 12); break;
      case PS_O_ONIRITA: { const c = oniCol(tm * 0.12 + (gx + gy) * 0.09), k = 'o' + c; lc.globalAlpha = 0.14 + Math.sin(tm * 1.4 + gx) * 0.04; lc.drawImage(PS_GL[k] || (PS_GL[k] = glow(12, c)), x + 6 - 12, y + 6 - 12); break; }
      case PS_BARREIRA: lc.globalAlpha = 0.14 + Math.sin(tm * 2 + gy * 0.6) * 0.05; lc.drawImage(psGlow('mb', 14, PS_COL.espelho), x + 6 - 14, y + 6 - 14); break;
    }
  }
  lc.globalAlpha = 1;
});
const CHAMA = ['#ffffff', '#ffe8a0', '#ffb860', '#e0702a'];
HOOK.drawTop.push((cx, cy) => {
  if (psOut(cy)) return;
  const tm = gameTime;
  // as cores da onirita passam aos poucos (só 12 por quadro, para não pesar: a cor muda devagar)
  if (PS_GL.n === undefined) PS_GL.n = 0;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < PS_SONO || t > PS_COSTURA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case PS_VELA: {   // a chama: um fiapo amarelo que tremula e às vezes se inclina
        const [fx, fy] = VELA_F[velaV(gx, gy)], f = Math.floor(tm * 9 + gx * 3) % 4;
        lc.fillStyle = CHAMA[3]; lc.fillRect(x + fx, y + fy - 1, 1, 2); lc.fillStyle = CHAMA[1]; lc.fillRect(x + fx + (f === 2 ? 1 : f === 3 ? -1 : 0), y + fy - 2 - (f === 1 ? 1 : 0), 1, 1); lc.fillStyle = CHAMA[0]; lc.fillRect(x + fx, y + fy - 1, 1, 1);
        break;
      }
      case PS_ABAJUR: { lc.globalAlpha = 0.65 + 0.3 * psBreath(); lc.fillStyle = '#fff0c0'; lc.fillRect(x + 4, y + 4, 4, 1); lc.fillStyle = '#ffd27a'; lc.fillRect(x + 3, y + 5, 6, 1); lc.globalAlpha = 1; break; }   // a luz por baixo da cúpula
      case PS_LAMPADA: {   // o bulbo balançando na ponta do fio
        const sw = Math.round(lampSwing(gx, gy)), bx = x + 5 + sw, by = y + 6;
        lc.fillStyle = '#c0a050'; lc.fillRect(bx, by, 2, 1); lc.fillStyle = '#fff4c0'; lc.fillRect(bx - 1, by + 1, 4, 3); lc.fillStyle = '#ffffff'; lc.fillRect(bx, by + 1, 1, 2); lc.fillStyle = '#e0c450'; lc.fillRect(bx, by + 4, 2, 1);
        break;
      }
      case PS_DESPERTADOR: {   // os ponteiros andando para trás: o grande uma volta a cada 6 s, o pequeno a cada 72
        const [hx, hy] = DESP_C, a1 = -tm * Math.PI * 2 / 6 + hash2(wrapX(gx), gy, 30702) * 6, a2 = -tm * Math.PI * 2 / 72;
        lc.fillStyle = '#1a1416';
        for (let k = 1; k <= 2; k++) lc.fillRect(Math.round(x + hx + Math.sin(a1) * k), Math.round(y + hy - Math.cos(a1) * k), 1, 1);
        lc.fillRect(Math.round(x + hx + Math.sin(a2)), Math.round(y + hy - Math.cos(a2)), 1, 1);
        break;
      }
      case PS_O_ONIRITA: {   // os pixels mais claros pegam a cor de agora
        const sp = oniSpots(gx, gy); if (!sp) break;
        lc.globalAlpha = 0.7; lc.fillStyle = oniCol(tm * 0.12 + (gx + gy) * 0.09 + 0.5);
        for (let k = 0; k < sp.length; k += 2) lc.fillRect(x + sp[k], y + sp[k + 1], 1, 1);
        lc.globalAlpha = 1; break;
      }
      case PS_ESPELHO: {   // o reflexo borrado que se mexe devagar: uma mancha clara deslizando
        if ((gx * 7 + gy * 3) % 5) break;
        const ph0 = (tm * 0.07 + hash2(wrapX(gx), gy, 30703)) % 1; if (ph0 > 0.4) break;
        lc.globalAlpha = Math.sin(ph0 / 0.4 * Math.PI) * 0.22; lc.fillStyle = '#dcf0f4'; lc.fillRect(x + Math.round(ph0 / 0.4 * 7), y + 2 + vr(gx, gy, 30704, 6), 3, 3); lc.globalAlpha = 1;
        break;
      }
      case PS_CACOS: { const n = Math.floor(tm * 1.2 + gx * 0.7); if (hash2(wrapX(gx) + n, gy, 30705) > 0.1) break; const tp = CACO_TIP[cacoV(gx, gy)]; if (!tp) break; lc.fillStyle = '#ffffff'; lc.fillRect(x + tp[0], y + tp[1] - 1, 1, 3); lc.fillRect(x + tp[0] - 1, y + tp[1], 3, 1); break; }
      case PS_BRASA: { const ph0 = (tm * 0.6 + hash2(wrapX(gx), gy, 30706) * 5) % 1; if (ph0 > 0.6) break; lc.globalAlpha = 1 - ph0 / 0.6; lc.fillStyle = ph0 < 0.2 ? '#ffd090' : '#ff6a2a'; lc.fillRect(x + 3 + vr(gx + Math.floor(tm * 0.6), gy, 30707, 6), y + 8 - Math.round(ph0 * 16), 1, 1); lc.globalAlpha = 1; break; }
      case PS_BARREIRA: { const ph0 = (tm * 0.3 + gy * 0.13) % 1; lc.globalAlpha = 0.35; lc.fillStyle = '#ffffff'; lc.fillRect(x + 2 + Math.round(ph0 * 7), y + 2, 1, 8); lc.globalAlpha = 1; break; }
    }
  }
});

/* a luz num bloco agora (o LB do 07): a Sombra Errada só leva dano dentro da luz */
function psLightAt(tx, ty) {
  if (typeof LB === 'undefined' || !LB) return 0;
  const lx = wrapX(tx) - LX0, ly = ty - LY0; if (lx < 0 || ly < 0 || lx >= LW || ly >= LH) return 0;
  return LB[ly * LW + lx] || 0;
}
Object.assign(PSART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, wrapT, W2, RX, DRE, psGlow, PS_GL, psOut, psBreath, oniCol, psLightAt,
  vSono, vAssoalho, vForrada, vTijolo, vAzulejo, vAcolchoado, vPenas, vEspelho, vQueimado, vNada, plankAt });
}
