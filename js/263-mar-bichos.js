'use strict';

/* ================= o Mar Sem Sol: a gente-peixe e os bichos do fundo, parte um =================
   Cinco dos dez bichos da décima segunda camada (docs/camadas/10-mar-sem-sol.md, seção 6; os outros cinco estão no
   264). A gente-peixe é curvada, de escamas em dois tons e olhos grandes com um ponto de luz; os bichos do fundo são
   quase pretos, com as partes que brilham em ciano e rosa.
   - o Guerreiro Escamado (escamado, anfíbio): em terra anda curvado; na água nada rápido e espera na beirada, só a
     cabeça de fora. Sai da água até a cintura, braços erguidos e as guelras abrindo (0,7 s); agarra o tornozelo e
     puxa o herói para a água (msPuxar 2 s, do 260; o 269 afunda o herói e solta quando ele golpeia quem puxa);
   - o Xamã das Bolhas (xamamar, anfíbio): fica nas palafitas e nas praias e recua andando de costas. O cajado de coral
     acende ciano e gotas sobem em volta dele (0,8 s); solta uma bolha lenta que persegue o herói e prende (msBolha
     1,5 s: ele flutua e perde fôlego até em terra);
   - o Caranguejo-Ermitão (ermitao, fundo): anda de lado, devagar, dentro de um barril ou de uma figura de proa; anda
     no fundo do mar sem nadar. A pinça sobe aberta e estala duas vezes (0,8 s); a pancada racha o chão na frente
     dele. Golpeado demais, se fecha na casca 2 s (nenhum golpe passa) e sai girando;
   - a Arraia-do-Teto (arraia, ar): plana no vão em curvas largas de S, do teto até dentro do mar, sem parar. A cauda
     sobe por cima do corpo e o ferrão brilha (0,6 s); rasante com chicotada;
   - o Polvo das Ruínas (polvo, água): anda pelas paredes com os braços, toma a cor do que está atrás e passa por
     buracos de 1 bloco (a busca de caminho dele só anda por células com água). Os braços se enrolam para trás e as
     ventosas acendem (0,6 s); chicote de 3 blocos. Ferido, solta tinta (msTinta: a luz cai a zero por 4 s).
   Na água: o anfíbio nada pela IA daqui (o 172 não mexe nele; o empuxo desconta a gravidade do laço); o polvo tem
   `fly` para o laço não puxar e cai sozinho quando sai da água, debatendo-se de volta (o dano de 10% por segundo é
   do 269). O 265 põe o nível e as tabelas de spawn. Pincel: o do 55 (cp) com as rampas de 6 tons, luz de cima à
   esquerda e contorno só onde o desenho toca o ar; os brilhos pelo EYES_E e pelo HOOK.drawGlow, os pontinhos acesos
   por cima do escuro (HOOK.drawTop). Materiais e bases do 267 (filtrados a cada mundo). Prefixo ms1. */

/* ---------- números ---------- */
Object.assign(ET, {
  escamado: { name: 'Guerreiro Escamado', w: 10, h: 22, hp: 110, dmg: 22, xp: 26, kb: 0.7, fly: false, amph: true, blood: '#3a6a5a' },
  xamamar: { name: 'Xamã das Bolhas', w: 10, h: 22, hp: 70, dmg: 18, xp: 22, kb: 0.9, fly: false, amph: true, blood: '#3a6a5a' },
  ermitao: { name: 'Caranguejo-Ermitão', w: 22, h: 16, hp: 280, dmg: 28, xp: 40, kb: 0.15, fly: false, bottom: true, blood: '#a8563a' },
  arraia: { name: 'Arraia-do-Teto', w: 24, h: 8, hp: 80, dmg: 20, xp: 22, kb: 0.6, fly: true, blood: '#2a3a4a' },
  polvo: { name: 'Polvo das Ruínas', w: 10, h: 10, hp: 120, dmg: 20, xp: 28, kb: 0.6, fly: true, swim: true, blood: '#20142a' }   // fly: o laço não põe gravidade (a IA cuida)
});
const MS1_TYPES = ['escamado', 'xamamar', 'ermitao', 'arraia', 'polvo'];
// materiais e bases do 267; filtradas agora e de novo a cada mundo
const MS1_DROPS = {
  escamado: [['escama_abissal', 0.4], ['min_oricalco', 0.08], ['pocao', 0.07], ['tridente_escamado', 0.015]],
  xamamar: [['escama_abissal', 0.3], ['min_oricalco', 0.06], ['pocao', 0.08], ['tridente_escamado', 0.015]],
  ermitao: [['perola_negra', 0.04], ['min_oricalco', 0.1], ['pocao', 0.08], ['cutelo_abordagem', 0.02], ['escudo_carapaca', 0.01]],
  arraia: [['min_oricalco', 0.05], ['pocao', 0.06]],
  polvo: [['tinta_polvo', 0.5], ['min_oricalco', 0.08], ['pocao', 0.07]]
};
function ms1Tables() { for (const k of MS1_TYPES) DROPS[k] = MS1_DROPS[k].filter(([id]) => ITEMS[id]); }
ms1Tables();
Object.assign(NAV_WALKERS, { escamado: 1, xamamar: 1, ermitao: 1 });
Object.assign(CV_STEP, { escamado: 1, xamamar: 1, ermitao: 1 });

const MS1_ERGUE = 0.7, MS1_SEGURA = 2, MS1_CAJADO = 0.8, MS1_PINCA = 0.8, MS1_FECHA = 2, MS1_CAUDA = 0.6, MS1_BRACOS = 0.6;
const MS1_BOLHA_SP = 58, MS1_BOLHA_VIDA = 5, MS1_BOLHA_PRENDE = 1.5;   // a bolha do xamã
const MS1_CHICOTE = 3 * T;                                          // o braço do polvo
const MS1_RACHA = 3 * T;                                            // o chão que a pinça racha, na frente

/* ---------- as poses ----------
   gente-peixe (no desenho de 26 x 28 de frente para a direita, o corpo no x 11, os pés na linha 27): low o corpo
   desce; lean o tronco vai para a frente; b/f o pé de trás e o da frente; hn/hf a mão de perto e a de longe; gill as
   guelras abertas; mouth a boca aberta; str o corpo esticado (nado: o quadro é girado 90 graus) */
const MS1_BX = 11;
const MS1_ES = [
  { low: 0, lean: 0, b: [9, 27], f: [13.6, 27], hn: [15.6, 19], hf: [8.6, 18.6] },                                   // 0 parado
  { low: 0.5, lean: 0.5, b: [7.2, 27], f: [15.2, 27], hn: [17, 18.4], hf: [9.6, 19.2] },                            // 1-2 andando
  { low: 0, lean: 0.5, b: [13, 27], f: [9.4, 26.6], hn: [14.6, 19.4], hf: [7.6, 18.2] },
  { low: -0.6, lean: -1, b: [8.6, 27], f: [14, 27], hn: [17.4, 3.4], hf: [10.4, 4.2], gill: 1, mouth: 1 },          // 3 o aviso: braços erguidos
  { low: 2.2, lean: 2.4, b: [6.6, 27], f: [16.6, 27], hn: [23.8, 25.6], hf: [21.6, 24.8], gill: 1, mouth: 1 },       // 4 o bote no tornozelo
  { low: 1.4, lean: -1.4, b: [8, 27], f: [15.8, 27], hn: [19.6, 22.4], hf: [17.8, 21.2], gill: 1 },                  // 5 segurando, puxando
  { low: 0, lean: 0, b: [10.2, 27], f: [12.6, 26.2], hn: [13.4, 1.4], hf: [10.8, 2.2], str: 1 },                      // 6-7 nadando (girado)
  { low: 0, lean: 0, b: [8.2, 26.2], f: [14.6, 27], hn: [13.6, 1.8], hf: [11, 1.6], str: 1 }
];
// o xamã: st = [x, y, inclinação] da mão do cajado (a mão de perto); o cajado passa pela mão
const MS1_XA = [
  { low: 0, lean: 0, b: [9, 27], f: [13.6, 27], hn: [16.4, 16.4], hf: [8.6, 18.6], st: 0.06 },                      // 0 parado
  { low: 0.5, lean: 0.4, b: [7.2, 27], f: [15.2, 27], hn: [16.8, 16], hf: [9.6, 19.2], st: 0.14 },                  // 1-2 andando
  { low: 0, lean: 0.4, b: [13, 27], f: [9.4, 26.6], hn: [16.2, 16.6], hf: [7.6, 18.2], st: 0 },
  { low: -0.4, lean: -0.6, b: [8.6, 27], f: [14, 27], hn: [16.6, 9.4], hf: [12.6, 11.6], st: -0.05, gill: 1 },      // 3 o cajado erguido, aceso
  { low: 0.6, lean: 1.2, b: [7.4, 27], f: [15.6, 27], hn: [19.2, 13.4], hf: [10, 17.6], st: 0.85, mouth: 1 },      // 4 soltou
  { low: 0, lean: 0, b: [10.2, 27], f: [12.6, 26.2], hn: [13.6, 7], hf: [10.8, 2.2], str: 1, st: 0.04 },            // 5-6 nadando (girado)
  { low: 0, lean: 0, b: [8.2, 26.2], f: [14.6, 27], hn: [13.8, 7.4], hf: [11, 1.6], str: 1, st: 0.04 }
];
// a ponta do cajado (onde a bolha nasce) a partir da mão e da inclinação
const ms1Ponta = o => [o.hn[0] + Math.sin(o.st) * 8.6, o.hn[1] - Math.cos(o.st) * 8.6];
// a cabeça e o olho de uma pose de gente-peixe (o desenho e o EYES_E usam a mesma conta)
function ms1Cab(o) {
  const hunch = o.str ? 0 : 1, sx = MS1_BX + 0.6 * hunch + o.lean * 0.8, sy = 11.4 + o.low - (o.str ? 1.6 : 0);
  const hx = sx + 2.6 * hunch + o.lean * 0.7 + (o.str ? 0.6 : 0), hy = sy - 3.2 + hunch * 0.8 - (o.str ? 1.2 : 0);
  return { hunch, sx, sy, hx, hy, ex: hx + 1.3, ey: hy - 0.8, hipY: 17.6 + o.low - (o.str ? 0.6 : 0) };
}
// o ermitão (36 x 26, o centro em x 17, o chão na linha 25): ph a fase das patas, cl [x, y, ângulo, abertura] da
// pinça grande, low o corpo baixando; 4 é a casca fechada
const MS1_ER = [
  { ph: 0, cl: [30.6, 18.2, 0.15, 0.3], low: 0 },
  { ph: 1, cl: [30.2, 18.8, 0.25, 0.2], low: 0.4 },
  { ph: 0, cl: [29.4, 5, -1.25, 0.95], low: -0.4 },     // 2 a pinça erguida, aberta
  { ph: 0.5, cl: [33, 21.6, 0.95, 0], low: 1.2 },       // 3 a pancada
  { ph: 0, shut: 1, low: 1.6 },                          // 4 fechado na casca
  { ph: 0, cl: [29.4, 5, -1.25, 0.05], low: -0.4 }      // 5 a pinça erguida, fechada (o estalo)
];
// a arraia (40 x 20, o centro em 20, 10): fl a batida das asas (-1 baixas, 1 altas), tail o jeito da cauda
const MS1_AR = [{ fl: 0.2, tail: 0 }, { fl: 1, tail: 1 }, { fl: 0.2, tail: 2 }, { fl: -0.9, tail: 1 }, { fl: 0.5, tail: 3 }, { fl: -0.4, tail: 4, sw: 1 }];
// o ferrão erguido na pose 4 (onde ele brilha)
const MS1_FERRAO = [27, 1.4];
// o polvo (26 x 26, o centro em 13, 13): mt a inclinação do manto; arms [ângulo, comprimento, curva] dos 8 braços
// (os 4 primeiros são os de longe); lit as ventosas acesas
const MS1_PV = [
  { mt: -0.45, my: 7.4, arms: [[1.2, 11, 1.2], [1.75, 12, -1], [2.5, 10, -1.6], [0.6, 10, 1.8], [1.0, 13, 1.6], [1.45, 13, -1.2], [2.05, 12, -1.8], [0.35, 11, 2.2]] },
  { mt: -0.4, my: 7.8, arms: [[1.3, 11, 0.8], [1.85, 12, -1.3], [2.6, 10, -1.2], [0.7, 10, 1.4], [1.1, 13, 1.9], [1.55, 13, -0.8], [2.15, 12, -1.5], [0.45, 11, 1.9]] },
  { mt: -0.2, my: 7.6, arms: [[0.1, 11, 1.2], [0.55, 10, 1.4], [2.65, 10, -1.3], [3.05, 11, -1.1], [0.3, 12, 1.6], [0.95, 11, 1.8], [2.2, 11, -1.7], [2.85, 12, -1.4]] },   // 2 agarrado, braços abertos
  { mt: -0.75, my: 8.4, lit: 1, arms: [[2.4, 12, 2.4], [3.0, 11, 2.6], [-2.3, 11, -2.4], [1.9, 11, 2.2], [2.7, 13, 2.6], [3.35, 12, 2.8], [1.6, 11, 2.4], [-2.7, 12, -2.6]] },   // 3 enrolados para trás, acesos
  { mt: 0.1, my: 7.6, lit: 1, arms: [[2.6, 11, 0.6], [2.95, 10, -0.5], [2.3, 10, 0.9], [0.1, 8, 0.3], [2.7, 12, 0.5], [3.15, 11, -0.7], [2.15, 11, 1.1], [0.0, 9, -0.4]] },   // 4 o chicote (um braço para a frente)
  { mt: 0.85, my: 9.4, arms: [[2.75, 13, 0.3], [2.95, 14, -0.2], [3.2, 13, -0.4], [2.6, 12, 0.45], [2.85, 14, 0.15], [3.05, 14, -0.15], [3.35, 13, -0.45], [2.5, 12, 0.5]] }   // 5 a jato
];

/* ================= arte ================= */
const MS1 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const MR = {
  escama: R6(['#081412', '#10262a', '#1a3a3c', '#285452', '#3e706a', '#62968a']),      // as escamas (o tom verde)
  escama2: R6(['#0a1020', '#142038', '#1e3050', '#2c466a', '#42628c', '#6686b0']),     // o segundo tom (azulado)
  ventre: R6(['#262e2a', '#404c46', '#5e6c62', '#808e82', '#a8b6a6', '#d2decc']),      // a barriga clara
  fin: R6(['#1e0c18', '#36182a', '#562842', '#7a3c5e', '#a25a84', '#cc84ae']),         // barbatanas e guelras
  olho: R6(['#020608', '#06141a', '#0e3a40', '#2a9490', '#8ae8d8', '#f0fff8']),        // os olhos grandes
  osso: R6(['#3a3628', '#5e5844', '#8a8268', '#b4ac90', '#d8d0b4', '#f4eedc']),        // garras e dentes
  coral: R6(['#3a1418', '#5e2428', '#86383a', '#a8564e', '#c87a66', '#e8a488']),
  alga: R6(['#061410', '#0c2418', '#163a24', '#225430', '#36703e', '#548c4a']),
  concha: R6(['#3a342c', '#5a5248', '#8a8070', '#b8ae9a', '#e0d8c6', '#f6f0e2']),
  ciano: R6(['#0a3a3a', '#1a6a66', '#2a9490', '#4ac0b4', '#8ae8d8', '#e0fff8']),
  crab: R6(['#140806', '#2a100c', '#461a12', '#66281a', '#8a3c26', '#b05a3a']),         // a carapaça
  madeira: R6(['#140c08', '#24160c', '#382214', '#4e321e', '#68462c', '#866040']),      // o barril (casco)
  ferro: R6(['#0a0a0c', '#16161a', '#24242a', '#38383e', '#525258', '#74747c']),
  figura: R6(['#24221e', '#403c34', '#625a4c', '#887e6a', '#aea48c', '#d4ccb2']),       // a figura de proa, a tinta gasta
  ouro: R6(['#221808', '#3e2c0e', '#5e4618', '#826226', '#a8843a', '#d0ac5a']),
  manta: R6(['#030508', '#070c12', '#0e1620', '#16222e', '#223242', '#344a5e']),        // o dorso da arraia
  mantaB: R6(['#1a2028', '#2e3844', '#46525e', '#626e7a', '#86929c', '#b2bcc4']),       // a barriga da arraia
  polvo: R6(['#06040a', '#100a16', '#1c1224', '#2a1a34', '#3a2446', '#4e325a']),        // o polvo, quase preto
  ventosa: R6(['#2a1020', '#4a1a34', '#7a2a52', '#b04478', '#ff8ab0', '#ffd8e8'])
};
// as cores do fundo que o polvo copia (os blocos do mar, um pouco mais escuros)
const ms1Esc = (a, k = 0.8) => a.map(h => { const [r, g, b] = rgb(h); return pack(r * k | 0, g * k | 0, b * k | 0); });
MS1.CAMO = {
  rocha: ms1Esc(['#0a1016', '#142028', '#1e303c', '#2a4250', '#3c5a68', '#567a88']),
  recife: ms1Esc(['#3a3630', '#5a544a', '#7a7264', '#9a9282', '#bab2a0', '#dad2c0'], 0.7),
  coral: ms1Esc(['#3a1418', '#5e2428', '#86383a', '#a8564e', '#c87a66', '#e8a488'], 0.75),
  lodo: ms1Esc(['#0a0c0c', '#141818', '#1e2422', '#28302c', '#343e38', '#44504a'], 1),
  sulfeto: ms1Esc(['#100c08', '#221a10', '#3a2a14', '#5a3e18', '#8a6420', '#c09a3a'], 0.75),
  casco: ms1Esc(['#140c08', '#24160c', '#382214', '#4e321e', '#68462c', '#866040'], 0.9),
  templo: ms1Esc(['#0c1614', '#16262a', '#22383a', '#2e4c4c', '#426662', '#5e8680'], 0.9),
  areia: ms1Esc(['#0c0c10', '#18181e', '#26262e', '#363640', '#4a4a56', '#6a6a7a'], 0.95)
};
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// sem contorno (o polvo disfarçado não tem borda escura)
const setN = cv => { const l = flip(cv); return { r: cv, l, wr: whiteOf(cv), wl: whiteOf(l) }; };
// gira o quadro 90 graus no sentido do relógio (o de cima vai para a direita): sem perder pixel
function rotCW(src) { const c = mk(src.height, src.width), x = c.getContext('2d'); x.translate(src.height, 0); x.rotate(Math.PI / 2); x.drawImage(src, 0, 0); return c; }
// elipse girada com luz de cima à esquerda; pick(u, v, x, y) -> [rampa, ajuste] ou null (pula)
function ell(P, cx, cy, rx, ry, ang, R, s, base, pick) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy, u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry, d = u * u + v * v;
    if (d > 1) continue;
    let RR = R, dv = 0;
    if (pick) { const p = pick(u, v, x, y); if (!p) continue; RR = p[0]; dv = p[1]; }
    P.put(x, y, RR, base + 1 - (px / m * 0.8 + py / m) * 1.5 - d * 0.8 + cg(x, y, s) * 0.45 + dv);
  }
}
// um tubo afinando: braços, pernas, patas
function tubo(P, x0, y0, x1, y1, r0, r1, R, base, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) {
      if (ox * ox + oy * oy > r * r + 0.05) continue;
      P.put(x + ox, y + oy, R, base - (oy / Math.max(0.5, r)) * 1.1 - (ox / Math.max(0.5, r)) * 0.6 + cg(x + ox | 0, y + oy | 0, s) * 0.35);
    }
  }
}
// polígono cheio (par-ímpar), f(x, y) -> o tom (ou null: pula)
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) { const v = f(x, y); if (v !== null) P.put(x, y, R, v); }
  }
}
// as escamas em dois tons: losangos de 2 x 2 alternando, a borda de baixo de cada um mais escura
const escama = (x, y) => [((x >> 1) + (y >> 1)) & 1 ? MR.escama : MR.escama2, (y & 1) ? -0.45 : 0.25];

/* ---------- a gente-peixe: o corpo comum do escamado e do xamã (26 x 28) ---------- */
// a perna curvada da gente-peixe: coxa, joelho para a frente, canela fina e o pé de nadadeira com três dedos
function perna(P, hx, hy, fx, fy, base, s, str) {
  const kx = (hx + fx) / 2 + (str ? 0.4 : 1.8), ky = (hy + fy) / 2 - (str ? 0 : 0.6);
  tubo(P, hx, hy, kx, ky, 1.35, 1.05, MR.escama, base, s);
  tubo(P, kx, ky, fx, fy - 1, 1.05, 0.7, MR.escama2, base + 0.1, s + 1);
  P.line(fx - 0.8, fy, fx + 2.6, fy, MR.fin, base);                                    // a membrana
  for (const [dx, dy] of [[2.8, 0], [2, -0.6], [1, -0.4]]) P.put(fx + dx, fy + dy, MR.escama, base + 0.8);
  P.put(fx + 3.2, fy, MR.osso, base + 1.4);                                             // a garra
}
// o braço comprido: ombro, cotovelo caindo, a mão de garras com a membrana
function braco(P, sx, sy, hx, hy, base, s) {
  const ex = (sx + hx) / 2 - 0.6, ey = (sy + hy) / 2 + 1.4;
  tubo(P, sx, sy, ex, ey, 1.15, 0.9, MR.escama, base, s); tubo(P, ex, ey, hx, hy, 0.9, 0.7, MR.escama2, base + 0.2, s + 1);
  const a = Math.atan2(hy - ey, hx - ex);
  for (const d of [-0.6, 0, 0.6]) { const x = hx + Math.cos(a + d) * 1.8, y = hy + Math.sin(a + d) * 1.8; P.put(x, y, MR.osso, base + 1.4); P.put((x + hx) / 2, (y + hy) / 2, MR.fin, base + 0.6); }
  // a barbatana do antebraço
  P.line(ex - 0.4, ey + 0.6, ex - 1.6, ey + 1.8, MR.fin, base + 0.4);
}
function peixe(P, o, s, xama) {
  const C = ms1Cab(o), { hunch, sx, sy, hx, hy, hipY } = C, str = !!o.str;
  // a perna e o braço de longe, mais escuros
  perna(P, MS1_BX - 0.6, hipY, o.b[0], o.b[1], 1.4, s + 1, str);
  braco(P, sx - 0.8, sy + 0.8, o.hf[0], o.hf[1], 1.4, s + 2);
  // a barbatana das costas: espinhos da nuca até o meio das costas, mais altos quando as guelras abrem
  const fh = (o.gill ? 1.5 : 1) * (str ? 0.7 : 1);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, bx = lerp(hx - 2.2, sx - 2.6 + hunch * 0.4, t), by = lerp(hy - 1.8, sy + 5.4, t), L = (2.4 - Math.abs(t - 0.35) * 1.8) * fh;
    const tx = bx - (str ? 1.6 : 1.4) * L * 0.9, ty = by - (str ? 0.2 : 1) * L * 0.8;
    P.line(bx, by, tx, ty, MR.fin, (j) => 2.2 + j * 1.8);
    if (i < 6) { const nx = lerp(hx - 2.2, sx - 2.6, (i + 1) / 6), ny = lerp(hy - 1.8, sy + 5.4, (i + 1) / 6); P.line(tx + 0.6, ty + 0.6, nx - 0.4, ny, MR.fin, 1.6); }
  }
  // o tronco curvado: as escamas nas costas, a barriga clara na frente
  ell(P, sx - 0.3, sy + 3.4, 2.9, 4.4, (str ? 0 : 0.38) + o.lean * 0.08, MR.escama, s + 3, 2.6, (u, v, x, y) => u > 0.42 && v > -0.4 ? [MR.ventre, (Math.abs(v) < 0.6 ? 0.3 : -0.3) + ((y & 1) ? -0.3 : 0)] : escama(x, y));
  // a tanga de rede e o cinto de concha (o escamado) ou o manto de algas (o xamã, por cima, depois)
  if (!xama) {
    for (let x = MS1_BX - 2.6; x <= MS1_BX + 2.6; x += 0.5) P.put(x, hipY - 0.6, MR.madeira, x > MS1_BX + 1 ? 2 : 3);
    P.put(MS1_BX + 1.4, hipY - 0.6, MR.concha, 4.6);
    poly(P, [[MS1_BX - 2.4, hipY - 0.2], [MS1_BX + 2.4, hipY - 0.2], [MS1_BX + 1.6, hipY + 3.2], [MS1_BX - 1.8, hipY + 2.6]], MR.madeira, (x, y) => ((x + y) & 1) ? 1.6 : null);
  }
  perna(P, MS1_BX + 0.8, hipY, o.f[0], o.f[1], 2.8, s + 4, str);
  if (xama) {   // o manto de algas: dos ombros até os joelhos, em fitas soltas
    const bot = hipY + (str ? 3 : 5.6);
    for (let i = 0; i < 7; i++) {
      const x0 = sx - 2.6 + i * 0.9, L = bot - (sy - 0.4) + (hash2(i, 7, s) * 2.4 - (i === 6 ? 2 : 0));
      for (let j = 0; j <= L * 2; j++) { const y = sy - 0.4 + j * 0.5, x = x0 - (y - sy) * (str ? 0.02 : 0.12) + Math.sin(y * 0.9 + i * 1.7) * 0.4; P.put(x, y, MR.alga, 2.8 - (i % 2) * 0.8 - j * 0.03 + (i === 0 ? -0.6 : 0)); }
    }
    for (let i = 0; i < 4; i++) P.put(sx - 1.4 + i * 1.1, sy + 1.4 + (i & 1) * 0.6, MR.concha, 4.4 - (i & 1) * 0.8);   // o colar de conchas
  }
  // a cabeça de peixe: o crânio largo, a mandíbula de baixo saliente, a boca rasgada, o olho grande, as guelras
  ell(P, hx, hy, 3.3, 2.8, 0.18, MR.escama, s + 5, 2.8, (u, v, x, y) => v > 0.3 && u > -0.2 ? [MR.ventre, -0.2] : escama(x, y));
  ell(P, hx + 1.7, hy + 1.5 + (o.mouth ? 0.7 : 0), 2.3, 1.1, 0.1, MR.ventre, s + 6, 2.4);
  if (o.mouth) { P.line(hx + 0.4, hy + 0.9, hx + 3.8, hy + 0.7, MR.fin, 0.4); P.line(hx + 0.6, hy + 1.4, hx + 3.6, hy + 1.4, MR.fin, 0.2); for (const dx of [1.2, 2.2, 3.2]) { P.put(hx + dx, hy + 0.9, MR.osso, 4.6); P.put(hx + dx - 0.4, hy + 1.6, MR.osso, 3.8); } }
  else { P.line(hx + 0.4, hy + 1, hx + 3.6, hy + 0.8, MR.escama, 0); P.put(hx + 3.2, hy + 1.4, MR.osso, 4); }
  // o olho: o aro escuro, o miolo e o ponto de luz (o EYES_E acende)
  ell(P, C.ex, C.ey, 1.35, 1.35, 0, MR.olho, s + 7, 0.6);
  P.put(C.ex, C.ey, MR.olho, 3); P.put(C.ex - 0.6, C.ey + 0.5, MR.olho, 2); P.put(C.ex + 0.4, C.ey - 0.4, MR.olho, 5);
  P.put(C.ex - 0.4, C.ey - 1.6, MR.escama, 4.4); P.put(C.ex + 0.6, C.ey - 1.6, MR.escama, 4);   // a sobrancelha de escama
  // as guelras: três riscos atrás da cabeça; abertas, rosa vivo
  for (let i = 0; i < 3; i++) { const gx = hx - 1.6 - i * 0.8, gy = hy + 0.2 + i * 0.3; P.line(gx, gy, gx - 0.3, gy + 2, o.gill ? MR.fin : MR.escama, o.gill ? 5 - i * 0.4 : 0.6); if (o.gill) P.put(gx + 0.5, gy + 1, MR.fin, 2); }
  // a crista na cabeça
  P.line(hx - 0.6, hy - 2.6, hx - 2.2, hy - 4 * (o.gill ? 1.3 : 1), MR.fin, 3.4); P.line(hx + 0.6, hy - 2.8, hx - 0.6, hy - 4.2 * (o.gill ? 1.3 : 1), MR.fin, 4);
  return C;
}
// o cajado de coral do xamã: o cabo de coral rosa, os galhos na ponta e o bulbo de luz ciano (aceso: tom 5)
function cajado(P, o, lit) {
  const [hx, hy] = o.hn, sa = Math.sin(o.st), ca = Math.cos(o.st), [tx, ty] = ms1Ponta(o), bx = hx - sa * 11, by = hy + ca * 11;
  P.line(bx, by, tx, ty, MR.coral, (t) => 2 + t * 1.6 + (Math.sin(t * 19) > 0.5 ? 0.8 : 0));
  P.line(bx + ca * 0.6, by + sa * 0.6, tx + ca * 0.6, ty + sa * 0.6, MR.coral, (t) => 1 + t);
  for (const d of [-0.9, 0.8]) { const a = o.st + d, ex = tx + Math.sin(a) * 2.6, ey = ty - Math.cos(a) * 2.6; P.line(tx, ty + 1, ex, ey, MR.coral, 4); P.put(ex, ey, MR.coral, 5); }
  ell(P, tx, ty, 1.3, 1.3, 0, MR.ciano, 9101, lit ? 3.6 : 1.4);
  P.put(tx - 0.4, ty - 0.4, MR.ciano, lit ? 5 : 3);
}
function escamado(k) {
  const o = MS1_ES[k], P = cp(26, 28);
  const C = peixe(P, o, 26301 + k * 7, false);
  braco(P, C.sx + 0.8, C.sy + 0.8, o.hn[0], o.hn[1], 3, 26301 + k * 7 + 8);
  const cv = P.done();
  return setO(o.str ? rotCW(cv) : cv);
}
function xamamar(k) {
  const o = MS1_XA[k], P = cp(26, 28), s = 26351 + k * 7;
  const C = peixe(P, o, s, true);
  // o cocar: três espinhos de coral e uma concha na testa
  const { hx, hy } = C;
  for (const [dx, h, v] of [[-1.6, 4.6, 3], [-0.2, 5.6, 4], [1.2, 4, 3.6]]) P.line(hx + dx, hy - 2.2, hx + dx - 1.2, hy - 2.2 - h, MR.coral, (t) => v - t * 0.8 + (t > 0.85 ? 1.6 : 0));
  ell(P, hx + 0.2, hy - 2.6, 1.4, 1, 0, MR.concha, s + 9, 3.4);
  cajado(P, o, k === 3);
  braco(P, C.sx + 0.8, C.sy + 0.8, o.hn[0], o.hn[1], 3, s + 8);
  const cv = P.done();
  return setO(o.str ? rotCW(cv) : cv);
}

/* ---------- o Caranguejo-Ermitão, 36 x 26 (o chão na linha 25) ---------- */
// a pinça: a palma em (x, y) apontando para ang, o dedo de cima abre de `op`
function pinca(P, x, y, ang, op, sc, base, s) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  ell(P, x, y, 3.3 * sc, 2.3 * sc, ang, MR.crab, s, base, (u, v) => [MR.crab, v < -0.4 ? 0.7 : 0]);
  const fx = x + ca * 2.6 * sc, fy = y + sa * 2.6 * sc;
  // o dedo fixo (de baixo) e o móvel (de cima, abrindo)
  const a1 = ang + 0.22, a2 = ang - 0.2 - op;
  tubo(P, fx - sa * 0.8, fy + ca * 0.8, fx + Math.cos(a1) * 3.6 * sc, fy + Math.sin(a1) * 3.6 * sc, 1.2 * sc, 0.5, MR.crab, base + 0.2, s + 1);
  tubo(P, fx + sa * 0.8, fy - ca * 0.8, fx + Math.cos(a2) * 3.4 * sc, fy + Math.sin(a2) * 3.4 * sc, 1.1 * sc, 0.5, MR.crab, base + 0.8, s + 2);
  P.put(fx + Math.cos(a1) * 3.8 * sc, fy + Math.sin(a1) * 3.8 * sc, MR.osso, base + 1.6); P.put(fx + Math.cos(a2) * 3.6 * sc, fy + Math.sin(a2) * 3.6 * sc, MR.osso, base + 2.2);
  for (let i = 0; i < 3; i++) P.put(x - ca * (1 - i) + sa * 1.2, y - sa * (1 - i) - ca * 1.2, MR.crab, base + 1.8);   // os carocinhos
}
// as patas: 3 de perto, 3 de longe, cada uma coxa para cima e a ponta no chão
function patas(P, ph, low, base, far, s, shut) {
  for (let i = 0; i < 3; i++) {
    const hx = 21 + i * 2.6 + (far ? 1 : 0), hy = 18 + low + (far ? -0.6 : 0), side = (i + (far ? 1 : 0) + Math.round(ph * 2)) & 1;
    if (shut) { const fx = 18 + i * 3.4 + (far ? 1.6 : 0); P.line(fx, 22.4, fx + 1.4, 24.6, MR.crab, base + 0.6); continue; }
    const fx = hx + 2.4 + i * 1.6 + (side ? 1.4 : -0.6) - (far ? 0.6 : 0), fy = 25, kx = (hx + fx) / 2 + 1.2, ky = hy - 2.6 + (side ? -0.6 : 0.4);
    tubo(P, hx, hy, kx, ky, 0.9, 0.8, MR.crab, base, s + i); tubo(P, kx, ky, fx, fy, 0.8, 0.45, MR.crab, base - 0.2, s + i + 3);
    P.put(fx, fy, MR.osso, base + 0.6);
  }
}
// o barril deitado: as aduelas correndo de lado, os aros de ferro em pé, cracas e um fiapo de alga
function barril(P, cx, cy, s) {
  ell(P, cx, cy, 10.4, 7.6, 0, MR.madeira, s, 2.6, (u, v, x, y) => {
    const st = ((y - cy + 20) | 0) % 3 === 0 ? -1 : 0, hoop = [-0.78, -0.56, 0.56, 0.78].some(h => Math.abs(u - h) < 0.07);
    return hoop ? [MR.ferro, (v < -0.3 ? 1.4 : 0.2) + (hash2(x, y, s) < 0.2 ? -0.8 : 0)] : [MR.madeira, st + (Math.abs(u) > 0.92 ? -0.9 : 0) + Math.abs(v) * -0.4];
  });
  // o tampo de trás (à esquerda) mais escuro, o buraco da frente (à direita) preto
  ell(P, cx - 9.4, cy, 1.4, 6.6, 0, MR.madeira, s + 1, 1.2);
  ell(P, cx + 9.6, cy + 0.4, 1.6, 6, 0, MR.madeira, s + 2, -1.2, (u) => u > 0.2 ? [MR.madeira, 2] : [MR.madeira, -1]);
  for (const [x, y] of [[cx - 5, cy - 6.4], [cx + 3, cy - 6.8], [cx - 1, cy + 6.6], [cx + 6, cy + 5.6]]) { P.put(x, y, MR.concha, 3.4); P.put(x + 1, y, MR.concha, 4.4); P.put(x + 0.5, y - 0.8, MR.concha, 2.4); }
  for (let j = 0; j < 7; j++) P.put(cx - 2 + Math.sin(j * 0.9) * 0.8, cy - 7.4 + j, MR.alga, 3.4 - j * 0.2);
}
// a figura de proa deitada: a mulher de madeira de cabelos dourados, a tinta descascada, quebrada na frente
function figura(P, cx, cy, s) {
  const pts = [[cx - 11, cy - 1.6], [cx - 9.4, cy - 5.4], [cx - 5.4, cy - 7.2], [cx + 3, cy - 7.6], [cx + 9.6, cy - 6.4], [cx + 10.6, cy + 2], [cx + 9.4, cy + 6.6], [cx - 1, cy + 7.4], [cx - 8.6, cy + 5]];
  poly(P, pts, MR.figura, (x, y) => 2.8 - (y - cy) * 0.18 - (x - cx) * 0.03 + cg(x, y, s) * 0.5 + (hash2(x >> 1, y, s) < 0.16 ? -1.4 : 0));
  // o cabelo: ondas de ouro velho correndo para trás (para a direita)
  for (let i = 0; i < 4; i++) for (let x = cx - 6; x < cx + 10; x += 0.5) { const y = cy - 6 + i * 1.6 + Math.sin(x * 0.55 + i) * 0.9; if (hash2(x * 2 | 0, i, s) < 0.12) continue; P.put(x, y, MR.ouro, 3.4 - i * 0.4 + (Math.sin(x * 0.55 + i) > 0.6 ? 1 : 0)); }
  // o rosto de perfil, virado para cima, na ponta da esquerda
  P.line(cx - 11, cy - 1.2, cx - 11.6, cy + 1.2, MR.figura, 4.4); P.put(cx - 12.2, cy + 0.6, MR.figura, 4.8);   // a testa e o nariz
  P.put(cx - 10, cy - 0.4, MR.figura, 0.6); P.line(cx - 10.6, cy - 0.6, cx - 9.4, cy - 0.6, MR.figura, 1.2);       // o olho fechado
  P.put(cx - 11.6, cy + 2.4, MR.coral, 2.6); P.put(cx - 11, cy + 3.2, MR.figura, 1.2);                               // a boca pintada
  P.line(cx - 9, cy + 3.6, cx - 6, cy + 5.4, MR.figura, 1.4);                                                         // o queixo e o pescoço
  // quebrada na frente (à direita): o oco preto e as lascas
  ell(P, cx + 9.4, cy + 0.6, 1.8, 5, 0, MR.madeira, s + 3, -1);
  for (const [x, y] of [[cx + 10.6, cy - 4], [cx + 11, cy + 4.6], [cx + 10.8, cy - 1]]) P.put(x, y, MR.figura, 4.6);
  for (const [x, y] of [[cx - 3, cy + 6.6], [cx + 5, cy + 6.8], [cx - 6, cy - 6.6]]) { P.put(x, y, MR.concha, 3.4); P.put(x + 1, y, MR.concha, 4.4); }
}
function ermitao(k, casca) {
  const o = MS1_ER[k], P = cp(36, 26), s = 26401 + k * 7 + casca * 50, low = o.low, shut = !!o.shut;
  patas(P, o.ph, low, 1.2, true, s, shut);
  // a pinça pequena (de longe), baixa na frente
  if (!shut) { tubo(P, 26, 19 + low, 30, 21.4 + low, 1, 0.9, MR.crab, 1.4, s + 4); pinca(P, 31.6, 21.4 + low, 0.4, 0.15, 0.62, 1.4, s + 5); }
  // o corpo: a carapaça que sai da casca, os olhos de talo
  if (!shut) {
    ell(P, 25, 17.6 + low, 4.4, 3.2, 0.1, MR.crab, s + 6, 2.4, (u, v, x, y) => [MR.crab, (v < -0.5 ? 0.6 : 0) + (hash2(x, y, s) < 0.15 ? -0.8 : 0)]);
    for (const [bx, tx, ty] of [[25.6, 26, 11.6], [27.4, 28.8, 12.4]]) { P.line(bx, 15.4 + low, tx, ty + low, MR.crab, 3.2); ell(P, tx, ty - 0.4 + low, 1, 1, 0, MR.olho, s + 7, 0.8); P.put(tx + 0.3, ty - 0.7 + low, MR.olho, 4.6); }
  }
  // a casca por cima
  const cy = 12.6 + low * 0.5;
  if (casca) figura(P, 14, cy, s + 8); else barril(P, 14, cy, s + 8);
  patas(P, o.ph + 0.5, low, 2.6, false, s + 10, shut);
  if (shut) { P.put(23.6, cy + 1, MR.olho, 4.6); return setO(P.done()); }   // o olho espiando de dentro do oco
  // a pinça grande (de perto): o braço do corpo até a palma
  const [px, py, pa, op] = o.cl;
  const ax = 27.6, ay = 18.4 + low, mx = (ax + px) / 2 + (py < 10 ? 2.2 : 0.4), my = (ay + py) / 2 + (py < 10 ? 1 : 1.2);
  tubo(P, ax, ay, mx, my, 1.4, 1.2, MR.crab, 2.6, s + 11); tubo(P, mx, my, px - Math.cos(pa) * 2.2, py - Math.sin(pa) * 2.2, 1.2, 1.1, MR.crab, 2.8, s + 12);
  pinca(P, px, py, pa, op, 1, 3, s + 13);
  return setO(P.done());
}
// a casca girando (a pose fechada em quatro quartos de volta, sem perder pixel)
function giros(img) { const out = [img]; let c = img; for (let i = 0; i < 3; i++) { c = rotCW(c); out.push(c); } return out; }

/* ---------- a Arraia-do-Teto, 40 x 20 (o centro em 20, 10) ---------- */
function arraia(k) {
  const o = MS1_AR[k], P = cp(40, 20), s = 26451 + k * 7, f = o.fl, sw = o.sw ? 1 : 0;
  // a cauda: um chicote fino com o ferrão claro na ponta
  const tailPt = t => {
    if (o.tail === 3) return [10 - Math.sin(t * Math.PI) * 5 + t * 17, 10 - Math.sin(t * Math.PI * 0.6) * 9];   // por cima do corpo
    if (o.tail === 4) return [10 - Math.sin(t * Math.PI) * 5 + t * 17, 10.6 + Math.sin(t * Math.PI * 0.6) * 8];  // chicoteando por baixo
    return [10 - t * 10.4, 10 + Math.sin(t * 5 + o.tail * 1.8) * 1.4 * t];
  };
  const tailOn = () => { let pr = tailPt(0); for (let i = 1; i <= 26; i++) { const t = i / 26, p = tailPt(t); P.line(pr[0], pr[1], p[0], p[1], MR.manta, 3 - t * 0.8); pr = p; } const e = tailPt(1), q = tailPt(0.94); P.put(e[0], e[1], MR.osso, 4.6); P.put(q[0], q[1], MR.osso, 3.2); };
  if (o.tail !== 3 && o.tail !== 4) tailOn();
  // vista de cima e de lado: um losango largo; a cabeça na frente (direita), as pontas das asas para trás, a de longe
  // em cima e a de perto embaixo, subindo e descendo com a batida
  const head = [33, 10], rear = [10.4, 10], tipF = [17 - sw * 5, 3 - f * 2.5 + sw * 2.5], tipN = [16 - sw * 5, 17 - f * 2.5 - sw * 2.5];
  const asa = (tip, far) => {
    const lead = [lerp(head[0], tip[0], 0.45) + 1.2, lerp(head[1], tip[1], 0.45) + (far ? -1 : 1)], trail = [lerp(tip[0], rear[0], 0.5) + 2, lerp(tip[1], rear[1], 0.5)];
    poly(P, [[head[0] - 3, head[1]], lead, tip, trail, [rear[0] + 2, rear[1]]], MR.manta, (x, y) => {
      const d = Math.abs(y - 10) / Math.max(1, Math.abs(tip[1] - 10)), lit = far ? 1.4 + d * 0.8 : 2.8 - d * 0.9;
      return lit + cg(x, y, s + (far ? 0 : 1)) * 0.45 + (Math.abs(Math.sin(x * 0.55 + y * 0.9)) < 0.14 ? -0.7 : 0) + (x - 20) * 0.03;
    });
    // a borda de ataque clara (a luz de cima à esquerda) e, na de perto subindo, a barriga aparecendo atrás
    P.line(head[0] - 3, head[1] + (far ? -0.6 : 0.6), lead[0], lead[1], far ? MR.manta : MR.mantaB, far ? 4.2 : 1.6);
    P.line(lead[0], lead[1], tip[0], tip[1], far ? MR.manta : MR.mantaB, far ? 3.8 : 1.4);
    if (!far && f > 0.3) P.line(tip[0] + 0.6, tip[1] - 0.6, trail[0], trail[1] - 0.4, MR.mantaB, 2.6);
    return lead;
  };
  const lf = asa(tipF, true);
  // o corpo: a lombada no meio, mais clara, e as guelras embaixo da cabeça
  ell(P, 22, 10, 10.6, 2.2, 0, MR.manta, s + 2, 2.8, (u, v) => [MR.manta, (v < -0.2 ? 0.8 : 0) + (Math.abs(v) < 0.25 ? 0.4 : 0)]);
  const ln = asa(tipN, false);
  // as manchas acesas (ciano) no dorso das duas asas
  for (const [a, b] of [[0.3, 0.45], [0.55, 0.3], [0.45, 0.65]]) { P.put(lerp(lerp(head[0], rear[0], a), tipF[0], b * 0.7), lerp(10, tipF[1], b), MR.ciano, 4); P.put(lerp(lerp(head[0], rear[0], a), tipN[0], b * 0.7), lerp(10, tipN[1], b), MR.ciano, 4.6); }
  P.put(24, 9.6, MR.ciano, 4); P.put(19, 9.8, MR.ciano, 3.6);
  // a cabeça: as nadadeiras cefálicas enroladas para a frente, o olho
  ell(P, 31, 10, 2.6, 1.8, 0, MR.manta, s + 4, 3);
  P.line(32.4, 8.8, 35.6, 8, MR.manta, 3.4); P.put(36, 8.6, MR.manta, 2.6); P.line(32.4, 11.2, 35.6, 12, MR.manta, 2.2); P.put(36, 11.4, MR.manta, 1.6);
  P.put(32, 9.2, MR.olho, 4.6); P.put(31.4, 9.2, MR.olho, 1.2);
  if (o.tail === 3 || o.tail === 4) tailOn();
  void lf; void ln;
  return setO(P.done());
}

/* ---------- o Polvo das Ruínas, 26 x 26 (o centro em 13, 13) ---------- */
function polvo(k, R) {
  const o = MS1_PV[k], P = cp(26, 26), s = 26501 + k * 7, cam = R !== MR.polvo, Rv = cam ? R : MR.ventosa;
  // um braço: do pé do manto, afinando, curvando; as ventosas por baixo
  const braco = (a0, L, c, base, ss) => {
    let x = 13 + Math.cos(a0) * 1.6, y = 12.4 + Math.sin(a0) * 1.2, a = a0; const n = Math.ceil(L * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = 1.9 * (1 - t) * (1 - t * 0.3) + 0.3;
      for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) if (ox * ox + oy * oy <= r * r + 0.05) P.put(x + ox, y + oy, R, base - oy * 0.5 / Math.max(0.6, r) - ox * 0.3 + cg(x + ox | 0, y + oy | 0, ss) * 0.35);
      if (i % 3 === 1 && t < 0.9) { const sx = x - Math.sin(a) * Math.sign(c || 1) * r * 0.6, sy = y + Math.cos(a) * Math.sign(c || 1) * r * 0.6; P.put(sx, sy, Rv, o.lit && !cam ? 4.4 : (cam ? base + 1.2 : 2.6)); }
      a += c * 1.6 / n * (0.2 + t * t * 2.4); x += Math.cos(a) * 0.5; y += Math.sin(a) * 0.5;
    }
  };
  for (let i = 0; i < 4; i++) { const [a, L, c] = o.arms[i]; braco(a, L, c, 1.4, s + i); }
  // o manto: o saco inclinado para trás, verrugas, o brilho em cima à esquerda
  ell(P, 12.2 + o.mt * 1.6, o.my, 3.9, 5, o.mt, R, s + 5, 2.4, (u, v, x, y) => [R, (hash2(x, y, s) < 0.18 ? 0.8 : 0) + (v < -0.6 ? 0.5 : 0) + (u > 0.5 ? -0.3 : 0)]);
  ell(P, 13.2, 11.8, 3, 2, 0, R, s + 6, 2.2);                                          // a cabeça (entre o manto e os braços)
  for (let i = 4; i < 8; i++) { const [a, L, c] = o.arms[i]; braco(a, L, c, 2.8, s + i); }
  // o olho: bolha em cima da cabeça, a pupila em risco (o ponto de luz)
  ell(P, 15.4, 10.8, 1.5, 1.3, 0, R, s + 7, 3.2);
  if (!cam) { P.put(15.2, 10.8, MR.olho, 0.4); P.put(16.2, 10.8, MR.olho, 0.4); P.put(15.7, 10.8, MR.olho, 4.4); }
  else { P.put(15.4, 10.8, R, 0.6); P.put(16.2, 10.8, R, 0.6); }
  const cv = P.done();
  return cam ? setN(cv) : setO(cv);
}

MS1.get = () => MS1.ready || (MS1.ready = (() => {
  const er = [0, 1].map(c => MS1_ER.map((_, k) => ermitao(k, c)));
  return {
    es: MS1_ES.map((_, k) => escamado(k)),
    xa: MS1_XA.map((_, k) => xamamar(k)),
    er, gir: er.map(E => giros(E[4].r)), girW: er.map(E => giros(E[4].wr)),
    ar: MS1_AR.map((_, k) => arraia(k)),
    pv: MS1_PV.map((_, k) => polvo(k, MR.polvo))
  };
})());
// o polvo disfarçado: as cores do fundo, feitas só quando o fundo aparece
const ms1CamoC = {};
MS1.camo = key => ms1CamoC[key] || (ms1CamoC[key] = MS1_PV.map((_, k) => polvo(k, MS1.CAMO[key])));
MS1.GL = {
  ciano: glow(4, '#6ae8d8'), cianoG: glow(10, '#6ae8d8'), cianoM: glow(16, '#6ae8d8'), rosa: glow(4, '#ff8ab0'), rosaG: glow(9, '#ff8ab0'),
  olho: glow(3, '#8ae8d8'), branco: glow(6, '#e0f4ff'), ambar: glow(4, '#ffc86a')
};
}

/* ================= desenho ================= */
// a figura com o apoio (ax, ay) quando olha para a direita (o desenho de 26 x 28 já com o contorno: corpo em 12, pés em 29)
function ms1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), Math.round(fy - ay)); }
const ms1Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho de gente-peixe (x, y) na tela; girado (nado) vem do quadro de pé, rodado em volta do corpo
function ms1PtS(e, fx, fy, x, y, rot) {
  if (!rot) return [fx + (x - MS1_BX) * e.facing, fy - 1 - (27 - y)];
  // o quadro girado: (x, y) -> (28 - y, x); o corpo (11, 16.5) fica no centro do bicho
  return [fx + ((28 - y) - 11.5) * e.facing, fy - e.h / 2 + (x - 11)];
}

const ms1EsPose = e => {
  const st = e.state;
  if (st === 'rise') return 3;
  if (st === 'grab') return 4;
  if (st === 'hold') return 5;
  if (e.nadando) { if (st === 'swim' && Math.abs(e.vx) > 28 && Math.abs(e.vx) > Math.abs(e.vy) * 0.6) return 6 + Math.floor(e.t * 6) % 2; return 1 + Math.floor(e.t * 3) % 2; }
  if (!e.onGround) return 1;
  return Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 7) % 2 : 0;
};
function ms1DrawPeixe(S, k, e, fx, fy, fl, jit) {
  const img = cvPick(S, e, fl);
  if (k >= 6 || (S.rot)) { lc.drawImage(img, Math.round(e.facing > 0 ? fx - 12.5 : fx - (img.width - 12.5)), Math.round(fy - e.h / 2 - 12)); return; }
  const bob = k === 0 && !e.nadando ? (Math.sin(e.t * 2.4 + e.seed) > 0.7 ? 1 : 0) : e.nadando ? Math.round(Math.sin(e.t * 3 + e.seed)) : 0;
  ms1Blit(img, e, fx, fy + bob, MS1_BX + 1, 29, jit);
}
DRAW_E.escamado = (e, fx, fy, fl) => { const k = ms1EsPose(e); ms1DrawPeixe(MS1.get().es[k], k, e, fx, fy, fl, ms1Jit(e, e.state === 'rise')); };
EYES_E.escamado = (e, fx, fy) => {
  const k = ms1EsPose(e), o = MS1_ES[k], C = ms1Cab(o), [x, y] = ms1PtS(e, fx, fy, C.ex, C.ey, k >= 6), G = MS1.GL;
  lc.globalAlpha = e.state === 'rise' || e.state === 'grab' || e.state === 'hold' ? 0.6 : 0.3; lc.drawImage(G.olho, Math.round(x) - 3, Math.round(y) - 3);
  if (o.gill) { const [gx, gy] = ms1PtS(e, fx, fy, C.hx - 2.4, C.hy + 1.2, false); lc.globalAlpha = 0.35 + 0.25 * Math.sin(e.t * 30); lc.drawImage(G.rosa, Math.round(gx) - 4, Math.round(gy) - 4); }
};
WARN_E.escamado = e => e.state === 'rise';

const ms1XaPose = e => {
  const st = e.state;
  if (st === 'cast') return 3;
  if (st === 'loose') return 4;
  if (e.nadando) { if (Math.abs(e.vx) > 28 && Math.abs(e.vx) > Math.abs(e.vy) * 0.6) return 5 + Math.floor(e.t * 6) % 2; return 1 + Math.floor(e.t * 3) % 2; }
  if (!e.onGround) return 1;
  return Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 7) % 2 : 0;
};
DRAW_E.xamamar = (e, fx, fy, fl) => {
  const k = ms1XaPose(e), S = MS1.get().xa[k], img = cvPick(S, e, fl);
  if (k >= 5) { lc.drawImage(img, Math.round(e.facing > 0 ? fx - 12.5 : fx - (img.width - 12.5)), Math.round(fy - e.h / 2 - 12)); return; }
  const bob = e.nadando ? Math.round(Math.sin(e.t * 3 + e.seed)) : 0;
  ms1Blit(img, e, fx, fy + bob, MS1_BX + 1, 29, ms1Jit(e, e.state === 'cast' && e.stateT < 0.3, 30));
};
EYES_E.xamamar = (e, fx, fy) => {
  const k = ms1XaPose(e), o = MS1_XA[k], C = ms1Cab(o), rot = k >= 5, [x, y] = ms1PtS(e, fx, fy, C.ex, C.ey, rot), G = MS1.GL;
  lc.globalAlpha = 0.3; lc.drawImage(G.olho, Math.round(x) - 3, Math.round(y) - 3);
  const [tx, ty] = ms1Ponta(o), [px, py] = ms1PtS(e, fx, fy, tx, ty, rot);
  if (e.state === 'cast') { const q = clamp(1 - e.stateT / MS1_CAJADO, 0, 1); lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(G.cianoG, Math.round(px) - 10, Math.round(py) - 10); }
  else { lc.globalAlpha = e.state === 'loose' ? 0.6 : 0.22; lc.drawImage(G.ciano, Math.round(px) - 4, Math.round(py) - 4); }
};
WARN_E.xamamar = e => e.state === 'cast';

const ms1ErPose = e => {
  const st = e.state;
  if (st === 'shut' || st === 'spin' || st === 'dizzy') return 4;
  if (st === 'claw') { const t = MS1_PINCA - e.stateT; return (t > 0.25 && t < 0.33) || (t > 0.55 && t < 0.63) ? 5 : 2; }
  if (st === 'slam' || st === 'recover') return 3;
  return e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 5) % 2 : 0;
};
DRAW_E.ermitao = (e, fx, fy, fl) => {
  const B = MS1.get(), c = e.casca | 0, k = ms1ErPose(e);
  if (e.state === 'spin' || (e.state === 'shut' && e.stateT < 0.5)) {
    // girando: os quatro quartos de volta em volta do centro da casca; fechado tremendo antes de sair
    // (o desenho inteiro gira em volta do meio dele: o ponto 18, 13 do quadro; para a esquerda, espelhado)
    const q = e.state === 'spin' ? Math.floor(e.spinA / (Math.PI / 2)) % 4 : 0, img = (fl ? B.girW[c] : B.gir[c])[q];
    const cx = fx + (18 - 17) * e.facing, cy = fy - 1 - (25 - 13), jx = e.state === 'shut' ? Math.round(Math.sin(e.t * 50)) : 0;
    if (e.facing < 0) { lc.save(); lc.translate(Math.round(cx), 0); lc.scale(-1, 1); lc.drawImage(img, Math.round(-img.width / 2) + jx, Math.round(cy - img.height / 2)); lc.restore(); }
    else lc.drawImage(img, Math.round(cx - img.width / 2) + jx, Math.round(cy - img.height / 2));
    return;
  }
  ms1Blit(cvPick(B.er[c][k], e, fl), e, fx, fy, 18, 27, ms1Jit(e, e.state === 'claw' && k === 5, 60));
};
EYES_E.ermitao = (e, fx, fy) => {
  const k = ms1ErPose(e), G = MS1.GL, low = MS1_ER[k].low;
  if (k === 4) { lc.globalAlpha = 0.18; lc.drawImage(G.olho, Math.round(fx + (23.6 - 17) * e.facing) - 3, Math.round(fy - 1 - (25 - 13.4 - low * 0.5)) - 3); return; }
  lc.globalAlpha = e.state === 'claw' ? 0.6 : 0.3;
  for (const [x, y] of [[26, 11.2], [28.8, 12]]) lc.drawImage(G.olho, Math.round(fx + (x - 17) * e.facing) - 3, Math.round(fy - 1 - (25 - y - low)) - 3);
};
WARN_E.ermitao = e => e.state === 'claw' || (e.state === 'shut' && e.stateT < 0.5);

const ms1ArPose = e => e.state === 'tail' ? 4 : e.state === 'swoop' ? 5 : Math.floor(e.t * (e.molhado ? 3 : 5) + e.seed) % 4;
DRAW_E.arraia = (e, fx, fy, fl) => {
  const img = cvPick(MS1.get().ar[ms1ArPose(e)], e, fl);
  ms1Blit(img, e, fx, fy - e.h / 2, 21, 11, ms1Jit(e, e.state === 'tail' && e.stateT < 0.25, 40));
};
EYES_E.arraia = (e, fx, fy) => {
  const G = MS1.GL, cy = fy - e.h / 2, k = ms1ArPose(e);
  lc.globalAlpha = 0.16 + 0.06 * Math.sin(e.t * 2 + e.seed);
  for (const [x, y] of [[23, 9], [18, 12.4]]) lc.drawImage(G.ciano, Math.round(fx + (x - 20) * e.facing) - 4, Math.round(cy + y - 10) - 4);
  lc.globalAlpha = 0.3; lc.drawImage(G.olho, Math.round(fx + (30.4 - 20) * e.facing) - 3, Math.round(cy + 9.4 - 10) - 3);
  if (k === 4) { const q = clamp(1 - e.stateT / MS1_CAUDA, 0, 1); lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(G.rosaG, Math.round(fx + (MS1_FERRAO[0] - 20) * e.facing) - 9, Math.round(cy + MS1_FERRAO[1] - 10) - 9); }
};
WARN_E.arraia = e => e.state === 'tail';

const ms1PvPose = e => {
  const st = e.state;
  if (st === 'wind') return 3;
  if (st === 'whip' || st === 'recover') return 4;
  if (st === 'ink' || st === 'flail') return st === 'flail' ? (Math.floor(e.t * 10) % 2 ? 2 : 5) : 5;
  if (e.agarra) return 2;
  return Math.hypot(e.vx, e.vy) > 40 ? 5 : Math.floor(e.t * 1.6 + e.seed) % 2;
};
DRAW_E.polvo = (e, fx, fy, fl) => {
  const k = ms1PvPose(e), cy = fy - e.h / 2, cam = e.camo || 0, jit = ms1Jit(e, e.state === 'flail' || (e.state === 'wind' && e.stateT < 0.25), 40);
  if (cam > 0.02 && !fl) { const C = MS1.camo(e.camoK || 'rocha')[k]; lc.globalAlpha = Math.min(1, cam * 1.4) * 0.92; ms1Blit(e.facing > 0 ? C.r : C.l, e, fx, cy, 13, 13, jit); }
  if (cam < 0.98 || fl) { lc.globalAlpha = fl ? 1 : 1 - cam; ms1Blit(cvPick(MS1.get().pv[k], e, fl), e, fx, cy, 14, 14, jit); }
  lc.globalAlpha = 1;
};
EYES_E.polvo = (e, fx, fy) => {
  const G = MS1.GL, cy = fy - e.h / 2, cam = e.camo || 0;
  lc.globalAlpha = 0.28 - cam * 0.16; lc.drawImage(G.olho, Math.round(fx + (15.7 - 13) * e.facing) - 3, Math.round(cy + 10.8 - 13) - 3);
  if (e.state === 'wind') {
    const q = clamp(1 - e.stateT / MS1_BRACOS, 0, 1); lc.globalAlpha = 0.25 + 0.5 * q;
    for (const [x, y] of [[8, 6], [6, 12], [9, 17], [12, 4]]) lc.drawImage(G.rosa, Math.round(fx + (x - 13) * e.facing) - 4, Math.round(cy + y - 13) - 4);
  }
};
WARN_E.polvo = e => e.state === 'wind';

/* ================= comportamento ================= */
const ms1Bolhas = [], ms1Rachas = [], ms1Chicotes = [], ms1Pops = [];
const ms1Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const MS1_CIANO = ['#6ae8d8', '#8ae8d8', '#e0fff8'], MS1_ROSA = ['#ff8ab0', '#ffd0e0', '#d8608a'], MS1_ESPUMA = ['#e0f4ff', '#c8ecf8', '#8ac4dc'];
function ms1Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (ms1Fx.length > 400) return;
  for (let i = 0; i < n; i++) ms1P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 });
}
// quanto do corpo está na água
const ms1W = e => aguaIn(e.x, e.y, e.w, e.h);
// a superfície: a primeira linha com água na coluna tx, subindo a partir de ty (null se não tem água ali)
function ms1Sup(tx, ty) {
  if (!aguaAt(tx, ty)) { let k = 1; for (; k <= 3 && !aguaAt(tx, ty + k); k++); if (k > 3) return null; ty += k; }
  let y = ty; for (let k = 0; k < 80 && aguaAt(tx, y - 1); k++) y--;
  return y;
}
// a célula com água (e sem pedra) mais perto de (tx, ty), num quadrado de raio r
function ms1AguaPerto(tx, ty, r) {
  let best = null, bd = 1e9;
  for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
    if (!aguaAt(x, y) || solidAt(x, y)) continue;
    const d = Math.abs(x - tx) + Math.abs(y - ty) * 1.2; if (d < bd) { bd = d; best = { tx: x, ty: y, d }; }
  }
  return best;
}
// a busca de caminho de quem nada: só por células com água (e, para quem tem 2 de altura, a de cima livre), por
// lados (4 vizinhas: passa nos buracos de 1 bloco). Vai até o alvo ou, se não chega, até a célula molhada mais perto
// dele. Devolve o caminho [[x, y], ...] (sem a célula de partida) e d, a distância que sobrou até o alvo
const MS1_R = 16, MS1_N = MS1_R * 2 + 1, ms1Prev = new Int32Array(MS1_N * MS1_N), ms1Q = new Int32Array(MS1_N * MS1_N);
function ms1Rota(sx, sy, gx, gy, hT) {
  ms1Prev.fill(-1);
  const id = (x, y) => (y - sy + MS1_R) * MS1_N + (x - sx + MS1_R);
  const ok = (x, y) => !solidAt(x, y) && aguaAt(x, y) && (hT < 2 || !solidAt(x, y - 1));
  const s0 = id(sx, sy); ms1Prev[s0] = s0; ms1Q[0] = s0;
  let h = 0, t = 1, best = s0, bd = Math.abs(wdx(sx - gx)) + Math.abs(sy - gy);
  while (h < t) {
    const c = ms1Q[h++], cx = c % MS1_N - MS1_R + sx, cy = ((c / MS1_N) | 0) - MS1_R + sy;
    const d = Math.abs(wdx(cx - gx)) + Math.abs(cy - gy); if (d < bd) { bd = d; best = c; if (d === 0) break; }
    for (let j = 0; j < 4; j++) {
      const nx = cx + (j === 0 ? 1 : j === 1 ? -1 : 0), ny = cy + (j === 2 ? 1 : j === 3 ? -1 : 0);
      if (Math.abs(nx - sx) > MS1_R || Math.abs(ny - sy) > MS1_R) continue;
      const k = id(nx, ny); if (ms1Prev[k] >= 0 || !ok(nx, ny)) continue;
      ms1Prev[k] = c; ms1Q[t++] = k;
    }
  }
  const path = []; let c = best;
  while (c !== s0 && path.length < 300) { path.push([c % MS1_N - MS1_R + sx, ((c / MS1_N) | 0) - MS1_R + sy]); c = ms1Prev[c]; }
  path.reverse();
  return { path, d: bd };
}
// segue o caminho guardado: o ponto de referência (rx, ry) do corpo vai de centro de célula em centro de célula
function ms1Segue(e, rx, ry, sp, acc, dt) {
  const R = e.rota; if (!R) return false;
  while (e.ri < R.path.length) { const [x, y] = R.path[e.ri]; if (Math.abs(x * T + T / 2 - rx) < 4 && Math.abs(y * T + T / 2 - ry) < 4) e.ri++; else break; }
  if (e.ri >= R.path.length) return false;
  const [x, y] = R.path[e.ri], ddx = x * T + T / 2 - rx, ddy = y * T + T / 2 - ry, d = Math.hypot(ddx, ddy) || 1;
  e.vx = approach(e.vx, ddx / d * sp, acc * dt); e.vy = approach(e.vy, ddy / d * sp, acc * dt);
  return true;
}
// o herói: dentro da água ou não (e quão perto ela está dos pés dele, em células)
const ms1HeroiNada = () => aguaIn(pl.x, pl.y, pl.w, pl.h) > 0.25;
// arrasta o herói de lado na direção de x (sem atravessar pedra)
function ms1Arrasta(x, max) { const nx = pl.x + clamp(x - (pl.x + pl.w / 2), -max, max); if (!rectSolid(nx, pl.y, pl.w, pl.h)) pl.x = nx; }
// um respingo onde a coisa cruza a superfície
function ms1Respingo(x, y, n = 8) { ms1Sparks(x, y, n, MS1_ESPUMA, 50, 260, 0.5); const v = clamp(1 - Math.hypot(pl.x - x, pl.y - y) / 260, 0, 1); if (v > 0.05) sfx.ms1Splash(v); }

/* ---------- o Guerreiro Escamado ---------- */
AI.escamado = function (e, dt, dx, dy, dist, aggro) {
  ms1Escamado(e, dt, dx, dy, dist, aggro);
  if (e.nadando && !e.dead) e.vy -= GRAV * dt;   // o empuxo: o laço põe a gravidade depois desta conta
};
function ms1Escamado(e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.rotaT = (e.rotaT || 0) - dt;
  const ecx = e.x + e.w / 2, w = ms1W(e), was = e.nadando;
  e.nadando = w > 0.4;
  if (e.nadando !== was && was !== undefined && Math.abs(e.vy) > 40) ms1Respingo(ecx, (e.sup ?? Math.floor(e.y / T)) * T, 6);
  if (e.nadando) { e.sup = ms1Sup(Math.floor(ecx / T), Math.floor((e.y + e.h - 4) / T)); e.vy = clamp(e.vy, -160, 90); }
  if (e.state === 'rise') {   // sai da água até a cintura (ou se ergue em terra), braços para cima, guelras abrindo
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.nadando) e.vy = e.lurk && e.sup != null ? clamp((e.sup * T - 13 - e.y) * 6, -120, 60) : approach(e.vy, 0, 300 * dt);
    if (Math.random() < dt * 16) { const [x, y] = [ecx + rnd(-5, 5), e.y + rnd(4, 14)]; ms1P({ x, y, vx: rnd(-6, 6), vy: rnd(10, 30), g: 200, life: 0.5, max: 0.5, col: MS1_ESPUMA[(Math.random() * 3) | 0], size: 1 }); }
    if (e.stateT <= 0) ms1Agarra(e);
    return;
  }
  if (e.state === 'grab') {
    const hb = { x: e.facing > 0 ? ecx - 2 : ecx - 22, y: e.y + 4, w: 24, h: e.h + 2 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') {
        msPuxar(MS1_SEGURA, e); e.state = 'hold'; e.stateT = MS1_SEGURA; e.vx = 0;
        const A = e.nadando ? null : ms1AguaPerto(Math.floor(ecx / T), Math.floor((e.y + e.h) / T), 8); e.marX = A ? A.tx * T + T / 2 : null;
        sfx.ms1Agarra(Math.max(0.5, ms1Near(e))); ms1Sparks(pl.x + pl.w / 2, pl.y + pl.h - 2, 6, MS1_ESPUMA, 50, 200, 0.4);
        return;
      }
    }
    e.vx = approach(e.vx, 0, 500 * dt); if (e.nadando) e.vy = approach(e.vy, 0, 400 * dt);
    if (e.stateT <= 0) { e.state = 'miss'; e.stateT = 0.55; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'hold') { ms1Segura(e, dt); return; }
  if (e.state === 'miss') { e.vx = approach(e.vx, 0, 500 * dt); if (e.nadando) e.vy = approach(e.vy, 0, 300 * dt); if (e.stateT <= 0) e.state = e.nadando ? 'swim' : 'walk'; return; }
  if (e.nadando) ms1EsNada(e, dt, dx, dy, dist, aggro); else ms1EsAnda(e, dt, dx, dy, dist, aggro);
}
// em terra: curvado, devagar; perto, se ergue e agarra
function ms1EsAnda(e, dt, dx, dy, dist, aggro) {
  e.state = 'walk'; e.lurk = false;
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 10 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 40 + e.lvl * 0.4 : 18, 600, 290, dy, aggro);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && Math.abs(dx) < 24 && Math.abs(dy) < 16 && clearPath(e, pl)) ms1Ergue(e);
}
// na água: nada rápido pelo caminho molhado; com o herói em terra perto da beirada, espera na superfície só com a
// cabeça de fora; longe da água, sai e vai a pé
function ms1EsNada(e, dt, dx, dy, dist, aggro) {
  e.state = 'swim';
  const ecx = e.x + e.w / 2, ry = e.y + e.h - 6, pcx = pl.x + pl.w / 2;
  if (!aggro) {   // à toa: boia perto da superfície, vai e volta devagar
    cvWander(e, dt); e.lurk = false;
    e.vx = approach(e.vx, e.wander * 22, 200 * dt);
    e.vy = e.sup != null ? clamp((e.sup * T - 7 - e.y) * 2, -30, 30) : approach(e.vy, 0, 100 * dt);
    if (e.wander) e.facing = e.wander;
    if (e.hitWall) e.wander = -e.wander;
    return;
  }
  if (e.rotaT <= 0) {
    e.rotaT = 0.3 + Math.random() * 0.12;
    e.heroAgua = ms1HeroiNada();
    e.rota = ms1Rota(Math.floor(ecx / T), Math.floor(ry / T), Math.floor(pcx / T), Math.floor((pl.y + pl.h - 4) / T), 2); e.ri = 0;
  }
  const R = e.rota, sp = 95 + e.lvl * 0.5;
  // espera na beirada só se o herói está ao alcance da mão (os pés dele pouco acima da água); num paredão, sai
  e.lurk = !e.heroAgua && R && R.d <= 5 && e.sup != null && pl.y + pl.h > e.sup * T - 3.5 * T;
  const moving = ms1Segue(e, ecx, ry, sp, 420, dt);
  if (!moving) {
    if (e.lurk && e.sup != null) {   // na beirada: só a cabeça de fora, acompanhando o herói de leve
      e.vy = clamp((e.sup * T - 7 - e.y) * 5, -60, 60);
      e.vx = approach(e.vx, clamp(dx, -1, 1) * (Math.abs(dx) > 14 ? 26 : 0), 300 * dt);
    } else if (!e.heroAgua && e.sup != null) {   // o herói longe da água: sai pela beirada e vai a pé
      e.vy = clamp((e.sup * T - 10 - e.y) * 5, -80, 80); e.vx = approach(e.vx, Math.sign(dx) * 60, 300 * dt);
      if (e.y < e.sup * T && (e.hitWall || Math.abs(dx) < 3 * T)) { e.vy = -300; e.vx = Math.sign(dx) * 80; ms1Respingo(ecx, e.sup * T, 6); }
    } else { const d = Math.hypot(dx, dy) || 1; e.vx = approach(e.vx, dx / d * sp * 0.8, 300 * dt); e.vy = approach(e.vy, dy / d * sp * 0.8, 300 * dt); }
  }
  e.facing = Math.sign(dx) || e.facing;
  if (e.atkCD > 0 || pl.dead) return;
  const near = Math.abs(dx) < 26 && clearPath(e, pl);
  if (e.lurk && e.sup != null) { const fy = pl.y + pl.h; if (near && fy > e.sup * T - 3.5 * T && fy < e.sup * T + T) ms1Ergue(e); }
  else if (near && Math.abs(dy) < 24) ms1Ergue(e);
}
function ms1Ergue(e) {
  e.state = 'rise'; e.stateT = MS1_ERGUE; e.vx = 0; e.facing = Math.sign(pl.x + pl.w / 2 - e.x - e.w / 2) || e.facing;
  sfx.ms1Ergue(Math.max(0.4, ms1Near(e)));
}
function ms1Agarra(e) {
  e.state = 'grab'; e.stateT = 0.24; e.swingHit = false; e.vx = e.facing * (e.nadando ? 130 : 110);
  if (e.nadando && e.lurk) e.vy = -40;
  sfx.ms1Bote(Math.max(0.4, ms1Near(e)));
}
// segura o tornozelo: na água afunda junto; em terra arrasta de costas para a água mais perto. Solta quando o tempo
// acaba, quando o 269 solta o herói (golpe em quem puxa) ou quando outro puxa
function ms1Segura(e, dt) {
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  const solto = pl.dead || e.stateT <= 0 || pl.msPuxaE !== e || (e.stateT < MS1_SEGURA - 0.1 && !(pl.msPuxaT > 0));
  if (solto) { e.state = 'miss'; e.stateT = 0.5; e.atkCD = 2.2 + Math.random() * 0.8; return; }
  e.facing = Math.sign(pcx - ecx) || e.facing;
  if (e.nadando) {
    const chao = solidAt(Math.floor(ecx / T), Math.floor((e.y + e.h + 2) / T));
    e.vx = approach(e.vx, 0, 300 * dt); e.vy = chao ? 0 : approach(e.vy, 60, 240 * dt);
  } else e.vx = approach(e.vx, e.marX != null ? Math.sign(wdx(e.marX - ecx) || -e.facing) * 46 : 0, 300 * dt);
  ms1Arrasta(ecx + e.facing * 10, 110 * dt);
  e.gulpT = (e.gulpT || 0) - dt; if (e.gulpT <= 0) { e.gulpT = 0.45; sfx.ms1Puxa(Math.max(0.4, ms1Near(e))); if (e.nadando) ms1P({ x: ecx + rnd(-3, 3), y: e.y + 4, vx: rnd(-4, 4), vy: -30, g: -20, life: 0.8, max: 0.8, col: '#c8ecf8', size: 1 }); }
}

/* ---------- o Xamã das Bolhas ---------- */
AI.xamamar = function (e, dt, dx, dy, dist, aggro) {
  ms1Xama(e, dt, dx, dy, dist, aggro);
  if (e.nadando && !e.dead) e.vy -= GRAV * dt;
};
function ms1Xama(e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, was = e.nadando;
  e.nadando = ms1W(e) > 0.4;
  if (e.nadando !== was && was !== undefined && Math.abs(e.vy) > 40) ms1Respingo(ecx, Math.floor((e.y + e.h / 2) / T) * T, 5);
  if (e.nadando) { e.sup = ms1Sup(Math.floor(ecx / T), Math.floor((e.y + e.h - 4) / T)); e.vy = clamp(e.vy, -160, 90); }
  const boia = () => { if (e.nadando) e.vy = e.sup != null ? clamp((e.sup * T - 9 - e.y) * 4, -80, 80) : approach(e.vy, 0, 200 * dt); };
  if (e.state === 'cast') {   // o cajado acende, gotas sobem em volta
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing; boia();
    if (Math.random() < dt * 20) { const a = Math.random() * 6.28; ms1P({ x: ecx + Math.cos(a) * 7, y: e.y + e.h - 2 - Math.random() * 6, vx: -Math.cos(a) * 6, vy: rnd(-34, -18), g: -10, life: 0.7, max: 0.7, col: MS1_CIANO[(Math.random() * 3) | 0], size: 1 }); }
    if (e.stateT <= 0) { ms1Solta(e); e.state = 'loose'; e.stateT = 0.4; e.atkCD = 2.4 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'loose') { e.vx = approach(e.vx, 0, 700 * dt); boia(); if (e.stateT <= 0) e.state = 'walk'; return; }
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < 5 * T ? -Math.sign(dx) : adx > 9 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  if (e.nadando) {   // nada na superfície, a cabeça de fora, e sobe na primeira beirada
    e.state = 'swim';
    const d = dir || (aggro ? Math.sign(dx) : 0);
    e.vx = approach(e.vx, d * 58, 300 * dt); boia();
    if (e.hitWall && e.sup != null && e.y < e.sup * T) { e.vy = -290; e.vx = d * 60; }
  } else { e.state = 'walk'; walk(e, dt, dir, aggro ? 36 + e.lvl * 0.3 : 16, 500, 270, dy, aggro && Math.abs(dx) > 9 * T); }
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);   // recua de costas, olhando para o herói
  if (aggro && e.atkCD <= 0 && !pl.dead && e.sees && dist < 11 * T && dist > 2 * T && (e.onGround || e.nadando)) {
    const [x, y] = ms1Pt(e, ...ms1Ponta(MS1_XA[3]));
    if (losClear(x, y, pcx, pcy)) { e.state = 'cast'; e.stateT = MS1_CAJADO; e.vx = 0; sfx.ms1Cajado(Math.max(0.4, ms1Near(e, 260))); }
    else e.atkCD = 0.5;
  }
}
// um ponto do desenho de 26 x 28 (corpo em 11, pés em 27) no mundo
const ms1Pt = (e, x, y) => [e.x + e.w / 2 + (x - MS1_BX) * e.facing, e.y + e.h - 1 - (27 - y)];
function ms1Solta(e) {
  const [x, y] = ms1Pt(e, ...ms1Ponta(MS1_XA[4])), a = Math.atan2(pl.y + pl.h / 2 - y, pl.x + pl.w / 2 - x);
  ms1Bolhas.push({ x, y, a, t: 0, dmg: e.dmg, r: 2, seed: Math.random() * 10 });
  ms1Sparks(x, y, 6, MS1_CIANO, 40);
  sfx.ms1Bolha(Math.max(0.4, ms1Near(e, 260)));
}

/* ---------- o Caranguejo-Ermitão ---------- */
AI.ermitao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.shutCD = (e.shutCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'shut') {   // fechado: nenhum golpe passa; no fim treme
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT < 0.5) { e.rattleT = (e.rattleT || 0) - dt; if (e.rattleT <= 0) { e.rattleT = 0.12; sfx.ms1Fecha(Math.max(0.3, ms1Near(e)) * 0.5, 1.5); } }
    if (e.stateT <= 0) { e.state = 'spin'; e.stateT = 1.4; e.facing = Math.sign(dx) || e.facing; e.vx = e.facing * 170; e.spinA = 0; e.swingHit = false; e.bounce = 0; sfx.ms1Gira(Math.max(0.4, ms1Near(e))); }
    return;
  }
  if (e.state === 'spin') {   // sai girando: rola reto, bate na parede e volta uma vez
    e.spinA += dt * 16; e.vx = e.facing * 170;
    if (e.hitWall && e.bounce < 1) { e.bounce++; e.facing = -e.facing; e.vx = e.facing * 170; shake(1.5); ms1Sparks(ecx + e.facing * -12, e.y + 8, 5, ['#866040', '#b8ae9a'], 50, 200, 0.4); }
    if (!e.swingHit && !pl.dead && overlap(e, pl)) {
      e.swingHit = true; const r = hurtPlayer(Math.round(e.dmg * 0.8), ecx, e, false);
      if (r === 'hit') { pl.vx = Math.sign(pcx - ecx || e.facing) * 260; pl.vy = -180; pl.onGround = false; shake(3); }
    }
    if (Math.random() < dt * 20 && e.onGround) burst(ecx - e.facing * 10, e.y + e.h - 1, 1, '#3a3640', 40, 300, 0.4);
    e.rollT = (e.rollT || 0) - dt; if (e.rollT <= 0) { e.rollT = 0.18; const v = ms1Near(e); if (v > 0.05) sfx.ms1Rola(v); }
    if (e.stateT <= 0) { e.state = 'dizzy'; e.stateT = 0.6; e.vx *= 0.3; }
    return;
  }
  if (e.state === 'dizzy') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); } return; }
  if (e.state === 'claw') {   // a pinça erguida, aberta; estala duas vezes
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    const t = MS1_PINCA - e.stateT, n = t > 0.55 ? 2 : t > 0.25 ? 1 : 0;
    if (n > (e.clicks || 0)) { e.clicks = n; sfx.ms1Clique(Math.max(0.4, ms1Near(e))); const [x, y] = ms1PtE(e, 33, 2); ms1Sparks(x, y, 3, ['#f4eedc', '#d8d0b4'], 30, 0, 0.25); }
    if (e.stateT <= 0) ms1Pancada(e);
    return;
  }
  if (e.state === 'slam') {
    if (!e.swingHit && !pl.dead) {
      const hb = { x: e.facing > 0 ? ecx + 2 : ecx - 32, y: e.y - 8, w: 30, h: e.h + 8 };
      if (overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vy = Math.min(pl.vy, -140); pl.onGround = false; } }
    }
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  // de lado: o corpo fica virado para o herói e as patas levam para um lado ou outro
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 22 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 22 + e.lvl * 0.2 : 10, 240, 220, dy, aggro);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  if (e.onGround && Math.abs(e.vx) > 3) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.22; const v = ms1Near(e, 160); if (v > 0.05) sfx.ms1Pata(v); } }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 36 && Math.abs(dy) < 22 && clearPath(e, pl)) { e.state = 'claw'; e.stateT = MS1_PINCA; e.clicks = 0; e.vx = 0; sfx.ms1Ergue(Math.max(0.4, ms1Near(e)), 0.6); }
};
// um ponto do desenho do ermitão (36 x 26, centro 17, chão 25) no mundo
const ms1PtE = (e, x, y) => [e.x + e.w / 2 + (x - 17) * e.facing, e.y + e.h - 1 - (25 - y)];
// a pancada: a pinça desce, o chão racha na frente (a rachadura corre 3 blocos e pega quem estiver em pé ali)
function ms1Pancada(e) {
  e.state = 'slam'; e.stateT = 0.3; e.swingHit = false;
  const [x, y] = ms1PtE(e, 34, 25), fy = e.y + e.h, v = ms1Near(e, 300);
  burst(x, fy - 1, 12, '#4a4a56', 80, 300, 0.6); burst(x, fy - 2, 6, '#b8ae9a', 60, 300, 0.4);
  ms1Rachas.push({ x: x - e.facing * 6, y: fy, dir: e.facing, t: 0, dur: 0.3, len: MS1_RACHA, dmg: Math.round(e.dmg * 0.6), hit: false, seed: Math.random() * 100 });
  if (v > 0.02) { sfx.ms1Pancada(v); shake(2 + 3 * v); }
  void y;
}

/* ---------- a Arraia-do-Teto ---------- */
// a linha do meio das curvas: um pouco abaixo do meio do vão; a curva vai do teto até umas linhas dentro do mar
const ms1ArMeio = () => (MS_NIVEL - 9) * T;
AI.arraia = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const w = ms1W(e) > 0.5; if (w !== e.molhado && e.molhado !== undefined) ms1Respingo(ecx, Math.round(ecy / T) * T, 10); e.molhado = w;
  if (e.state === 'tail') {   // para no ar, a cauda sobe por cima do corpo e o ferrão acende
    const k = Math.pow(0.04, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.1) { e.tgX = pcx; e.tgY = pcy; }
    if (e.stateT <= 0) {   // o rasante: passa pelo herói e sobe
      e.state = 'swoop'; e.stateT = 1.1; e.swingHit = false; e.passou = false;
      const sx = Math.sign(e.tgX - ecx) || e.facing, t = Math.max(0.25, Math.abs(e.tgX - ecx) / 210);
      e.vx = sx * 210; e.vy = clamp((e.tgY - ecy) / t, -160, 260); e.facing = sx;
      sfx.ms1Asa(Math.max(0.5, ms1Near(e, 260)));
    }
    return;
  }
  if (e.state === 'swoop') {
    if (!e.passou && Math.sign(e.tgX - ecx) !== e.facing) e.passou = true;
    if (e.passou) e.vy -= 520 * dt;
    if (!e.swingHit && !pl.dead) {
      const hb = { x: e.x - 6, y: e.y - 4, w: e.w + 12, h: e.h + 12 };
      if (overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { ms1Sparks(pcx, pcy, 6, MS1_ROSA, 60); sfx.ms1Chicote(Math.max(0.5, ms1Near(e))); } }
    }
    if (e.stateT <= 0 || e.hitWall || (e.onGround && e.stateT < 0.95)) { e.state = 'climb'; e.stateT = 0.9; e.atkCD = 2.2 + Math.random() * 1; }
    return;
  }
  if (e.state === 'climb') { e.vy = approach(e.vy, -80, 300 * dt); e.vx = approach(e.vx, e.facing * 60, 200 * dt); if (e.stateT <= 0 || e.hitCeil) { e.state = 'glide'; e.ph = -Math.PI / 2; } return; }
  e.state = 'glide';
  // as curvas de S: anda de lado e a altura segue um seno do teto até dentro do mar
  if (e.dirX === undefined) { e.dirX = e.facing; e.ph = Math.random() * 6.28; e.amp = (9 + Math.random() * 3) * T; e.ondaK = 0.9 + Math.random() * 0.4; }
  const sp = (e.molhado ? 48 : 72) + e.lvl * 0.4;
  e.ph += dt * e.ondaK * (e.molhado ? 0.8 : 1);
  if (aggro) { if (wdx((ecx - pcx) / T) * e.dirX > 10) e.dirX = -e.dirX; }
  else if (Math.abs(wdx((ecx - (e.homeX ?? ecx)) / T)) > 26 && Math.sign(wdx((ecx - e.homeX) / T)) === e.dirX) e.dirX = -e.dirX;
  // pedra na frente: volta; chão ou teto: a curva vira
  if (e.hitWall || rectSolid(e.x + e.dirX * 14, e.y, e.w, e.h)) { e.dirX = -e.dirX; e.vx *= -0.3; }
  if (e.onGround && Math.sin(e.ph) > -0.3) e.ph = -Math.PI / 2; else if (e.hitCeil && Math.sin(e.ph) < 0.3) e.ph = Math.PI / 2;
  const ty = ms1ArMeio() + Math.sin(e.ph) * e.amp;
  e.vx = approach(e.vx, e.dirX * sp, 160 * dt);
  e.vy = approach(e.vy, clamp((ty - ecy) * 1.6, -90, 90), 220 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  e.flapT = (e.flapT ?? Math.random()) - dt; if (e.flapT <= 0) { e.flapT = 0.8; const v = ms1Near(e, 200); if (v > 0.05 && !e.molhado) sfx.ms1Asa(v * 0.4); }
  if (aggro && e.atkCD <= 0 && !pl.dead && e.sees && Math.abs(dx) < 7 * T && Math.abs(dx) > 1.5 * T && dy > -2 * T && dy < 7 * T) {
    e.state = 'tail'; e.stateT = MS1_CAUDA; e.tgX = pcx; e.tgY = pcy; e.facing = Math.sign(dx) || e.facing;
    sfx.ms1Cauda(Math.max(0.4, ms1Near(e, 260)));
  }
};

/* ---------- o Polvo das Ruínas ---------- */
// a cor do fundo: a pedra encostada (ele anda pelas paredes) ou a parede de trás
const MS1_CAMO_T = { [MS_AREIA]: 'areia', [MS_ROCHA]: 'rocha', [MS_CRACAS]: 'rocha', [MS_RECIFE]: 'recife', [MS_CORAL]: 'coral', [MS_LODO]: 'lodo', [MS_SULFETO]: 'sulfeto', [MS_CASCO]: 'casco', [MS_CONVES]: 'casco', [MS_TEMPLO]: 'templo' };
const MS1_CAMO_W = { [WMS_ROCHA]: 'rocha', [WMS_RECIFE]: 'recife', [WMS_CASCO]: 'casco', [WMS_TEMPLO]: 'templo', [WMS_SULFETO]: 'sulfeto' };
function ms1CamoDe(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h / 2) / T);
  let enc = false, key = null;
  for (const [ox, oy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]]) { const t = tileAt(tx + ox, ty + oy); if (SOLID[t]) { enc = true; key = key || MS1_CAMO_T[t] || null; } }
  e.agarra = enc;
  return key || MS1_CAMO_W[wallAt(tx, ty)] || 'rocha';
}
AI.polvo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.rotaT = (e.rotaT || 0) - dt; e.inkCD = (e.inkCD || 0) - dt; e.camoT = (e.camoT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, n = ms1W(e);
  if (e.camoT <= 0) { e.camoT = 0.5; e.camoK = ms1CamoDe(e); }
  // fora da água: cai, se debate e pula de volta para a água mais perto (o 269 tira a vida)
  if (n < 0.5) {
    if (e.state !== 'flail') { e.state = 'flail'; e.stateT = 0; }
    e.camo = approach(e.camo || 0, 0, dt * 3);
    e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
    e.flT = (e.flT || 0) - dt;
    if (e.flT <= 0) { e.flT = 0.4; e.mar = ms1AguaPerto(Math.floor(ecx / T), Math.floor(ecy / T), 8); }
    // para o lado da água; com ela bem embaixo (atrás da pedra) ou sem água perto, um lado só, que vira na parede
    if (e.hitWall) e.flDir = -(e.flDir || 1);
    const A = e.mar, dir = (A && Math.abs(A.tx * T + T / 2 - ecx) > 8 ? Math.sign(wdx(A.tx * T + T / 2 - ecx)) : 0) || e.flDir || (e.flDir = Math.random() < 0.5 ? -1 : 1);
    e.vx = approach(e.vx, dir * 70, 400 * dt);
    if (e.onGround) { e.vy = -150 - Math.random() * 60; e.vx = dir * 80; ms1Sparks(ecx, e.y + e.h, 3, ['#3a2446', '#8ac4dc'], 30, 200, 0.4); }
    if (A) e.facing = dir || e.facing;
    return;
  }
  if (e.state === 'flail') { e.state = 'crawl'; ms1Respingo(ecx, ecy, 6); }
  const damp = k => { const m = Math.pow(k, dt); e.vx *= m; e.vy *= m; };
  if (e.state === 'wind') {   // os braços se enrolam para trás, as ventosas acendem; mira até o fim
    damp(0.02); e.camo = approach(e.camo || 0, 0, dt * 4); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.1) e.mira = Math.atan2(pcy - ecy, pcx - ecx);
    if (e.stateT <= 0) { e.state = 'whip'; e.stateT = 0.24; e.swingHit = false; ms1Chicotes.push({ e, a: e.mira, t: 0, dur: 0.34, seed: Math.random() * 10 }); sfx.ms1Chicote(Math.max(0.4, ms1Near(e))); }
    return;
  }
  if (e.state === 'whip') {
    damp(0.05);
    if (!e.swingHit && !pl.dead) {   // o braço: um segmento de 3 blocos na direção da mira
      const L = MS1_CHICOTE * clamp((0.24 - e.stateT) / 0.12, 0, 1), ca = Math.cos(e.mira), sa = Math.sin(e.mira);
      for (let s = 6; s <= L; s += 3) { const x = ecx + ca * s, y = ecy + sa * s; if (x > pl.x - 2 && x < pl.x + pl.w + 2 && y > pl.y - 2 && y < pl.y + pl.h + 2) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') ms1Sparks(x, y, 5, MS1_ROSA, 50); break; } if (solidAt(Math.floor(x / T), Math.floor(y / T))) break; }
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.45; e.atkCD = 1.6 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'recover') { damp(0.1); if (e.stateT <= 0) e.state = 'crawl'; return; }
  if (e.state === 'ink') {   // foge da nuvem de tinta, a jato
    damp(0.4); e.camo = approach(e.camo || 0, 0.6, dt * 1.5);
    if (e.stateT <= 0) { e.state = 'crawl'; e.rotaT = 0; }
    return;
  }
  e.state = 'crawl';
  // o caminho: com o herói, até ele (ou até a água mais perto dele); à toa, de parede em parede
  if (e.rotaT <= 0) {
    e.rotaT = 0.35 + Math.random() * 0.1;
    let gx, gy;
    if (aggro) { gx = Math.floor(pcx / T); gy = Math.floor(pcy / T); }
    else {
      e.alvoT = (e.alvoT || 0) - 0.4;
      if (!e.alvo || e.alvoT <= 0) {
        e.alvoT = 3 + Math.random() * 3; e.alvo = null;
        const bx = Math.floor((e.homeX ?? ecx) / T), by = Math.floor((e.homeY ?? ecy) / T);
        for (let i = 0; i < 24 && !e.alvo; i++) {
          const x = bx + Math.floor(rnd(-7, 8)), y = by + Math.floor(rnd(-6, 7));
          if (solidAt(x, y) || !aguaAt(x, y)) continue;
          if (solidAt(x - 1, y) || solidAt(x + 1, y) || solidAt(x, y + 1) || solidAt(x, y - 1)) e.alvo = [x, y];
        }
      }
      [gx, gy] = e.alvo || [Math.floor(ecx / T), Math.floor(ecy / T)];
    }
    e.rota = ms1Rota(Math.floor(ecx / T), Math.floor(ecy / T), gx, gy, 1); e.ri = 0;
  }
  const close = aggro && dist < MS1_CHICOTE * 0.8 && losClear(ecx, ecy, pcx, pcy);
  const sp = (aggro ? 60 + e.lvl * 0.4 : 24) * (e.agarra ? 1.1 : 0.9);
  if (close || !ms1Segue(e, ecx, ecy, sp, 260, dt)) damp(0.08);
  if (Math.abs(e.vx) > 6) e.facing = Math.sign(e.vx); else if (aggro) e.facing = Math.sign(dx) || e.facing;
  // o disfarce: parado ou à toa some no fundo; caçando, um pouco; atacando, nada
  e.camo = approach(e.camo || 0, aggro ? (dist > 5 * T ? 0.85 : 0.5) : 1, dt * 0.8);
  e.squT = (e.squT ?? Math.random() * 4) - dt; if (e.squT <= 0) { e.squT = 3 + Math.random() * 4; const v = ms1Near(e, 160); if (v > 0.08) sfx.ms1Polvo(v * 0.6); }
  if (aggro && e.atkCD <= 0 && !pl.dead && dist < MS1_CHICOTE + 4 && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'wind'; e.stateT = MS1_BRACOS; e.mira = Math.atan2(pcy - ecy, pcx - ecx); e.facing = Math.sign(dx) || e.facing;
    sfx.ms1Enrola(Math.max(0.4, ms1Near(e)));
  }
};
// a tinta: sai do polvo ferido, ele foge a jato para o outro lado
function ms1Tinta(e) {
  const x = e.x + e.w / 2, y = e.y + e.h / 2;
  msTinta(x, y, 4, 40);
  e.inkCD = 6; e.state = 'ink'; e.stateT = 0.9;
  const a = Math.atan2(y - (pl.y + pl.h / 2), x - (pl.x + pl.w / 2)); e.vx = Math.cos(a) * 170; e.vy = Math.sin(a) * 170; e.facing = Math.sign(e.vx) || e.facing;
  for (let i = 0; i < 14; i++) ms1P({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-30, 30) - e.vx * 0.15, vy: rnd(-30, 30) - e.vy * 0.15, g: 0, life: 1.2, max: 1.2, col: '#06040a', size: 2, dark: 1 });
  sfx.ms1Tinta(Math.max(0.4, ms1Near(e)));
}

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  // o ermitão fechado: o golpe bate na casca e volta
  if (e && !e.dead && e.type === 'ermitao' && e.state === 'shut') {
    e.memT = 4; const x = e.x + e.w / 2 - dir * 8, y = e.y + 6;
    ms1Sparks(x, y, 5, ['#f4eedc', '#866040', '#b8ae9a'], 50, 200, 0.35); sfx.ms1Fecha(0.7); shake(1);
    return;
  }
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !MS1_TYPES.includes(e.type)) return r;
  if (e.type === 'ermitao') {
    e.stun = Math.min(e.stun, e.state === 'claw' || e.state === 'slam' || e.state === 'spin' ? 0 : 0.1);
    // golpeado demais: 4 golpes ou um quarto da vida em 2,5 s -> fecha
    e.golpes = (e.golpes || []).filter(g => gameTime - g[0] < 2.5); e.golpes.push([gameTime, hp0 - e.hp]);
    const soma = e.golpes.reduce((a, g) => a + g[1], 0);
    if ((e.golpes.length >= 4 || soma >= e.maxHp * 0.25) && (e.shutCD || 0) <= 0 && e.state !== 'spin') {
      e.state = 'shut'; e.stateT = MS1_FECHA; e.shutCD = 8; e.golpes = []; e.vx = 0; e.stun = 0; sfx.ms1Fecha(0.9, 0.8);
    }
  }
  if (e.type === 'escamado' && e.state === 'hold') { e.state = 'miss'; e.stateT = 0.6; e.atkCD = Math.max(e.atkCD, 2); }
  if (e.type === 'escamado' && e.state === 'rise' && e.stun > 0) { e.state = e.nadando ? 'swim' : 'walk'; e.atkCD = Math.max(e.atkCD, 0.7); }
  if (e.type === 'xamamar' && e.state === 'cast' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  if (e.type === 'polvo') { e.camo = 0; if ((e.inkCD || 0) <= 0) ms1Tinta(e); }
  if (e.type === 'arraia' && e.state === 'tail' && e.stun > 0) { e.state = 'glide'; e.atkCD = Math.max(e.atkCD, 0.8); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!MS1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, ms1Near(e, 260));
  if (e.type === 'escamado' || e.type === 'xamamar') { ms1Sparks(cx, cy - 4, 6, MS1_CIANO, 40, -20, 0.8); sfx.ms1Morre(v); if (e.type === 'xamamar') ms1Pops.push({ x: cx, y: cy, t: 0, big: true }); }
  else if (e.type === 'ermitao') { burst(cx, cy, 16, '#4e321e', 90, 300, 0.8); burst(cx, cy, 8, '#b8ae9a', 60, 300, 0.6); sfx.ms1Fecha(v, 0.6); }
  else if (e.type === 'arraia') { ms1Sparks(cx, cy, 10, MS1_CIANO, 50, 60, 0.9); sfx.ms1Morre(v, 0.7); }
  else if (e.type === 'polvo') { msTinta(cx, cy, 3, 30); sfx.ms1Tinta(v); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || e.dead || !MS1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'ermitao') e.casca = Math.random() < 0.5 ? 1 : 0;
  if (type === 'arraia') e.state = 'glide';
  else if (type === 'polvo') { e.state = 'crawl'; e.camo = 1; }
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: as bolhas, as rachaduras, os chicotes ---------- */
function ms1Update(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // a bolha: lenta, persegue o herói virando devagar, balança; estoura na pedra; no herói, prende
  for (let i = ms1Bolhas.length - 1; i >= 0; i--) {
    const B = ms1Bolhas[i]; B.t += dt; B.r = Math.min(5, 2 + B.t * 8);
    const want = Math.atan2(pcy - B.y, pcx - B.x); let da = want - B.a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (!pl.dead) B.a += clamp(da, -1.1 * dt, 1.1 * dt);
    const sp = MS1_BOLHA_SP * (aguaAt(Math.floor(B.x / T), Math.floor(B.y / T)) ? 0.8 : 1);
    B.x += Math.cos(B.a) * sp * dt; B.y += Math.sin(B.a) * sp * dt + Math.sin(B.t * 4 + B.seed) * 8 * dt;
    let pop = B.t > MS1_BOLHA_VIDA || solidAt(Math.floor(B.x / T), Math.floor(B.y / T));
    if (!pop && !pl.dead && B.x > pl.x - B.r && B.x < pl.x + pl.w + B.r && B.y > pl.y - B.r && B.y < pl.y + pl.h + B.r) {
      const r = hurtPlayer(B.dmg, B.x, null, true);
      if (r === 'hit') { msBolha(MS1_BOLHA_PRENDE); sfx.ms1Prende(); }
      if (r !== 'none' || pl.invuln > 0) pop = true;
    }
    if (pop) { ms1Pops.push({ x: B.x, y: B.y, t: 0, big: false }); ms1Sparks(B.x, B.y, 6, MS1_CIANO, 40, 0, 0.35); const v = clamp(1 - Math.hypot(pl.x - B.x, pl.y - B.y) / 240, 0, 1); if (v > 0.05) sfx.ms1Estoura(v); ms1Bolhas.splice(i, 1); }
  }
  // a rachadura corre pelo chão na frente da pinça e pega quem estiver em pé nela
  for (let i = ms1Rachas.length - 1; i >= 0; i--) {
    const R = ms1Rachas[i]; R.t += dt;
    const L = R.len * clamp(R.t / R.dur, 0, 1);
    if (!R.hit && !pl.dead && R.t < R.dur + 0.05 && pl.onGround && Math.abs(pl.y + pl.h - R.y) < 6) {
      const a = Math.min(R.x, R.x + R.dir * L), b = Math.max(R.x, R.x + R.dir * L);
      if (pl.x + pl.w > a && pl.x < b) { R.hit = true; const r = hurtPlayer(R.dmg, pcx - R.dir * 8, null, true); if (r === 'hit') { pl.vy = -160; pl.onGround = false; } }
    }
    if (R.t < R.dur && Math.random() < dt * 40) burst(R.x + R.dir * L, R.y - 1, 1, '#4a4a56', 50, 300, 0.4);
    if (R.t > R.dur + 1.4) ms1Rachas.splice(i, 1);
  }
  for (let i = ms1Chicotes.length - 1; i >= 0; i--) { const C = ms1Chicotes[i]; C.t += dt; if (C.t > C.dur || C.e.dead) ms1Chicotes.splice(i, 1); }
  for (let i = ms1Pops.length - 1; i >= 0; i--) { ms1Pops[i].t += dt; if (ms1Pops[i].t > 0.35) ms1Pops.splice(i, 1); }
}
HOOK.update.push(ms1Update);
function clearMs1Fx() { ms1Fx.length = 0; ms1Bolhas.length = 0; ms1Rachas.length = 0; ms1Chicotes.length = 0; ms1Pops.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearMs1Fx(); ms1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: o cajado aceso, as bolhas, as manchas da arraia, as ventosas
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !MS1_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'xamamar') addL(cx, e.y + 2, e.state === 'cast' || e.state === 'loose' ? 0.5 : 0.18);
    else if (e.type === 'arraia') addL(cx, cy, e.state === 'tail' ? 0.4 : 0.2);
    else if (e.type === 'polvo') { if (e.state === 'wind' || e.state === 'whip') addL(cx, cy, 0.35); }
    else if (e.type === 'escamado' && (e.state === 'rise' || e.state === 'hold')) addL(cx, e.y + 6, 0.2);
  }
  for (const B of ms1Bolhas) addL(B.x, B.y, 0.4);
}; }

// a luz aditiva: as bolhas, os estouros, o braço do polvo aceso
HOOK.drawGlow.push((cx, cy) => {
  const G = MS1.GL;
  for (const B of ms1Bolhas) { lc.globalAlpha = 0.5; lc.drawImage(G.cianoG, Math.round(B.x - cx) - 10, Math.round(B.y - cy) - 10); }
  for (const p of ms1Pops) { lc.globalAlpha = (p.big ? 0.8 : 0.6) * (1 - p.t / 0.35); lc.drawImage(G.cianoM, Math.round(p.x - cx) - 16, Math.round(p.y - cy) - 16); }
  for (const C of ms1Chicotes) {
    const e = C.e, L = MS1_CHICOTE * clamp(C.t / 0.12, 0, 1) * (C.t > 0.24 ? Math.max(0, 1 - (C.t - 0.24) / 0.1) : 1), ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    lc.globalAlpha = 0.35; for (let s = 8; s <= L; s += 8) lc.drawImage(G.rosa, Math.round(ex + Math.cos(C.a) * s - cx) - 4, Math.round(ey + Math.sin(C.a) * s - cy) - 4);
  }
  lc.globalAlpha = 1;
});
// no mundo (com a luz e a água por cima): a bolha, o braço do chicote, a rachadura
HOOK.drawWorld.push((cx, cy) => {
  for (const B of ms1Bolhas) {
    const x = Math.round(B.x - cx), y = Math.round(B.y - cy), r = B.r, wob = Math.sin(B.t * 9 + B.seed) * 0.6;
    if (x < -10 || x > VW + 10 || y < -10 || y > VH + 10) continue;
    lc.globalAlpha = 0.25; lc.fillStyle = '#8ae8d8'; lc.beginPath(); lc.ellipse(x, y, r + wob, r - wob, 0, 0, 6.283); lc.fill();
    lc.globalAlpha = 0.9; lc.fillStyle = '#4ac0b4';
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; lc.fillRect(Math.round(x + Math.cos(a) * (r + wob)), Math.round(y + Math.sin(a) * (r - wob)), 1, 1); }
    lc.fillStyle = '#e0fff8'; lc.fillRect(x - Math.ceil(r * 0.5), y - Math.ceil(r * 0.5), 1, 1); lc.fillRect(x - Math.ceil(r * 0.5) + 1, y - Math.ceil(r * 0.5), 1, 1);
  }
  lc.globalAlpha = 1;
  // o braço do polvo: um tentáculo que estica até 3 blocos, afinando, as ventosas rosa por baixo
  for (const C of ms1Chicotes) {
    const e = C.e, k = clamp(C.t / 0.12, 0, 1) * (C.t > 0.24 ? Math.max(0, 1 - (C.t - 0.24) / 0.1) : 1), L = MS1_CHICOTE * k, ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
    const ca = Math.cos(C.a), sa = Math.sin(C.a);
    for (let s = 3; s <= L; s += 1) {
      const t = s / MS1_CHICOTE, wv = Math.sin(t * 8 - C.t * 30 + C.seed) * 1.6 * (1 - t) * (1 - k * 0.6), x = ex + ca * s - sa * wv, y = ey + sa * s + ca * wv, r = Math.max(0, Math.round((1 - t) * 1.6));
      lc.fillStyle = '#100a16'; lc.fillRect(Math.round(x) - r - 1, Math.round(y) - r - 1, r * 2 + 3, r * 2 + 3);
      lc.fillStyle = t < 0.5 ? '#2a1a34' : '#3a2446'; lc.fillRect(Math.round(x) - r, Math.round(y) - r, r * 2 + 1, r * 2 + 1);
      if (s % 3 === 0) { lc.fillStyle = '#b04478'; lc.fillRect(Math.round(x + sa * (r + 0.5)), Math.round(y - ca * -(r + 0.5)), 1, 1); }
    }
  }
  // a rachadura do ermitão: a linha escura correndo no chão com lascas
  for (const R of ms1Rachas) {
    const L = R.len * clamp(R.t / R.dur, 0, 1), f = R.t > R.dur ? Math.max(0, 1 - (R.t - R.dur) / 1.4) : 1;
    lc.globalAlpha = f;
    for (let s = 0; s <= L; s += 1) {
      const x = Math.round(R.x + R.dir * s - cx), wob = Math.round(Math.sin(s * 0.7 + R.seed) * 0.8), y = Math.round(R.y - cy) - 1 + wob;
      lc.fillStyle = '#05080a'; lc.fillRect(x, y, 1, 1);
      if (s % 5 === 2) { lc.fillStyle = '#05080a'; lc.fillRect(x, y - 1, 1, 1); lc.fillStyle = '#4a4a56'; lc.fillRect(x + 1, y - 2, 1, 1); }
    }
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: os pontos de luz dos olhos grandes, o bulbo do cajado, o ferrão, as ventosas acesas, os
// estouros das bolhas
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead || !MS1_TYPES.includes(e.type)) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -40 || fx > VW + 40 || fy < -40 || fy > VH + 60) continue;
    if (e.type === 'escamado' || e.type === 'xamamar') {
      const xa = e.type === 'xamamar', k = xa ? ms1XaPose(e) : ms1EsPose(e), o = (xa ? MS1_XA : MS1_ES)[k], rot = k >= (xa ? 5 : 6), C = ms1Cab(o);
      const [x, y] = ms1PtS(e, fx, fy, C.ex + 0.4, C.ey - 0.4, rot);
      lc.fillStyle = e.state === 'rise' || e.state === 'grab' ? '#ffffff' : '#8ae8d8'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (xa && e.state === 'cast') {
        const [tx, ty] = ms1Ponta(o), [px, py] = ms1PtS(e, fx, fy, tx, ty, rot), q = clamp(1 - e.stateT / MS1_CAJADO, 0, 1);
        lc.fillStyle = Math.floor(now * 14) % 2 ? '#ffffff' : '#8ae8d8'; lc.fillRect(Math.round(px), Math.round(py), 1, 1);
        lc.globalAlpha = 0.5 + q * 0.5; lc.fillStyle = '#6ae8d8'; for (let j = 0; j < 3; j++) { const a = now * 7 + j * 2.09; lc.fillRect(Math.round(px + Math.cos(a) * (6 - q * 3)), Math.round(py + Math.sin(a) * (6 - q * 3)), 1, 1); }
        lc.globalAlpha = 1;
      }
    } else if (e.type === 'arraia' && e.state === 'tail') {
      lc.fillStyle = Math.floor(now * 16) % 2 ? '#ffd0e0' : '#ff8ab0'; lc.fillRect(Math.round(fx + (MS1_FERRAO[0] - 20) * e.facing), Math.round(fy - e.h / 2 + MS1_FERRAO[1] - 10), 1, 1);
    } else if (e.type === 'polvo' && e.state === 'wind') {
      lc.fillStyle = Math.floor(now * 14) % 2 ? '#ffd0e0' : '#ff8ab0';
      for (const [x, y] of [[8, 6], [6, 12], [9, 17], [12, 4], [5, 9]]) lc.fillRect(Math.round(fx + (x - 13) * e.facing), Math.round(fy - e.h / 2 + y - 13), 1, 1);
    } else if (e.type === 'ermitao' && e.state === 'claw') {
      lc.fillStyle = '#e0fff8'; for (const [x, y] of [[26, 11.2], [28.8, 12]]) lc.fillRect(Math.round(fx + (x - 17) * e.facing), Math.round(fy - 1 - (25 - y + 0.4)), 1, 1);
    }
  }
  for (const p of ms1Pops) {
    const q = p.t / 0.35, r = 2 + q * (p.big ? 10 : 6), n = p.big ? 16 : 10;
    lc.globalAlpha = 1 - q; lc.fillStyle = q < 0.4 ? '#e0fff8' : '#6ae8d8';
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; lc.fillRect(Math.round(p.x - cx + Math.cos(a) * r), Math.round(p.y - cy + Math.sin(a) * r), 1, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  // a gente-peixe: a água escorrendo de quem sai, o chiado das guelras, o bote molhado, o gorgolejo de quem puxa
  ms1Ergue(v = 1, p = 1) { noise(0.5, 0.05 * v, 900 * p, 'bandpass', 0, 0.8); noise(0.4, 0.03 * v, 3200 * p, 'highpass', 0.15); tone(160 * p, 0.4, 'sawtooth', 0.01 * v, -40); },
  ms1Bote(v = 1) { noise(0.16, 0.08 * v, 700, 'lowpass'); tone(220, 0.12, 'triangle', 0.03 * v, -120); },
  ms1Agarra(v = 1) { noise(0.12, 0.1 * v, 500, 'lowpass'); tone(110, 0.2, 'sine', 0.05 * v, -40); for (let k = 0; k < 3; k++) tone(500 + k * 140, 0.05, 'sine', 0.012 * v, 200, 0.08 + k * 0.05); },
  ms1Puxa(v = 1) { for (let k = 0; k < 3; k++) tone(180 + Math.random() * 160, 0.07, 'sine', 0.02 * v, 140, k * 0.06); noise(0.25, 0.02 * v, 400, 'lowpass'); },
  ms1Splash(v = 1) { noise(0.35, 0.09 * v, 1400, 'bandpass', 0, 0.6); noise(0.2, 0.04 * v, 400, 'lowpass', 0.05); },
  // o xamã: bolhinhas de vidro subindo, a bolha saindo, o estouro, o herói preso
  ms1Cajado(v = 1) { for (let k = 0; k < 6; k++) tone(700 + k * 160 + Math.random() * 60, 0.08, 'sine', 0.012 * v, 300, k * 0.11); tone(330, 0.7, 'triangle', 0.008 * v, 330); },
  ms1Bolha(v = 1) { tone(240, 0.3, 'sine', 0.04 * v, 420); tone(180, 0.2, 'sine', 0.02 * v, 200, 0.05); },
  ms1Estoura(v = 1) { tone(900, 0.08, 'sine', 0.03 * v, -500); noise(0.06, 0.03 * v, 3000, 'highpass'); },
  ms1Prende() { tone(160, 0.6, 'sine', 0.05, 80); for (let k = 0; k < 4; k++) tone(400 + k * 90, 0.12, 'sine', 0.015, 120, 0.05 + k * 0.08); },
  // o ermitão: as patinhas na pedra, o estalo da pinça, a pancada, a casca fechando, rolando
  ms1Pata(v = 1) { noise(0.03, 0.025 * v, 3000 + Math.random() * 800, 'bandpass', 0, 4); },
  ms1Clique(v = 1) { noise(0.03, 0.12 * v, 2600, 'bandpass', 0, 6); tone(1800, 0.03, 'square', 0.015 * v, -600); },
  ms1Pancada(v = 1) { tone(52, 0.5, 'sine', 0.14 * v, -18); noise(0.35, 0.13 * v, 260, 'lowpass'); for (let k = 0; k < 5; k++) noise(0.03, 0.04 * v, 1600 + Math.random() * 1200, 'bandpass', 0.06 + k * 0.06, 3); },
  ms1Fecha(v = 1, p = 1) { noise(0.1, 0.09 * v, 500 * p, 'bandpass', 0, 1.5); tone(140 * p, 0.12, 'square', 0.02 * v, -50); },
  ms1Gira(v = 1) { noise(0.5, 0.06 * v, 300, 'lowpass'); tone(90, 0.5, 'sawtooth', 0.02 * v, 60); },
  ms1Rola(v = 1) { noise(0.12, 0.04 * v, 260 + Math.random() * 120, 'lowpass'); },
  // a arraia: o bater das asas, a cauda subindo (um chiado), a chicotada
  ms1Asa(v = 1) { noise(0.35, 0.04 * v, 500, 'bandpass', 0, 0.7); },
  ms1Cauda(v = 1) { noise(0.5, 0.03 * v, 4200, 'highpass'); tone(1200, 0.5, 'sine', 0.006 * v, 900); },
  ms1Chicote(v = 1) { noise(0.08, 0.1 * v, 2400, 'bandpass', 0, 1.4); tone(700, 0.06, 'triangle', 0.02 * v, -400); },
  // o polvo: um estalo molhado, os braços se enrolando, a tinta
  ms1Polvo(v = 1) { noise(0.15, 0.04 * v, 600, 'bandpass', 0, 2); tone(120 + Math.random() * 60, 0.12, 'sine', 0.02 * v, 40); },
  ms1Enrola(v = 1) { for (let k = 0; k < 4; k++) noise(0.06, 0.04 * v, 700 + k * 150, 'bandpass', k * 0.1, 3); tone(90, 0.5, 'sine', 0.02 * v, 50); },
  ms1Tinta(v = 1) { noise(0.5, 0.07 * v, 300, 'lowpass'); tone(70, 0.5, 'sine', 0.04 * v, -20); },
  ms1Morre(v = 1, p = 1) { tone(300 * p, 0.6, 'sine', 0.025 * v, -180); for (let k = 0; k < 4; k++) tone(400 + Math.random() * 400, 0.06, 'sine', 0.01 * v, 200, 0.1 + k * 0.08); noise(0.4, 0.02 * v, 800, 'lowpass'); }
});

/* ---------- as faíscas acesas (com o brilho da cor delas) e a tinta (escura, sem brilho) ---------- */
const ms1Fx = [], ms1FxGl = {};
function ms1P(o) { if (ms1Fx.length < 400) ms1Fx.push(o); }
HOOK.update.push(dt => {
  for (let i = ms1Fx.length - 1; i >= 0; i--) { const p = ms1Fx[i]; p.life -= dt; if (p.life <= 0) { ms1Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of ms1Fx) { if (p.dark) continue; const g = ms1FxGl[p.col] || (ms1FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.45; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of ms1Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2) * (p.dark ? 0.8 : 1); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
