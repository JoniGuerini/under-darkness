'use strict';

/* ================= o Covil do Dragão: os kobolds =================
   Cinco dos dez bichos da camada (docs/camadas/11-covil-dragao.md, seção 6; a cria do dragão está no 274). Os kobolds
   são a cria pequena e covarde dos dragões: 9 x 14 px, cabeça de lagarto, olhos amarelos, escamas cor de tijolo,
   chifrinhos de osso e panos rasgados. Os avisos acendem em âmbar e ouro.
   - o Kobold de Falange (kobfalange) nasce em fila de 3 (kb1Grupos), colados atrás de escudos de escama de draco; a
     fila só avança junta (quem vai na frente espera os de trás). Os três batem a lança no escudo duas vezes (estalo
     seco, as pontas acendem âmbar) e estocam juntos. O escudo segura os golpes de frente e vai rachando: quando o de
     um deles quebra, a fila se desfaz e eles fogem para lados diferentes por uns segundos; depois lutam cada um por si;
   - o Kobold Fundeiro (kobfunda) fica a 6-10 blocos e recua pulando quando o herói chega perto. Gira a funda sobre a
     cabeça (o círculo aparece, o assobio sobe, 0,85 s) e solta uma pedra de obsidiana em arco que quica uma vez no
     chão ou na parede antes de se partir;
   - o Kobold Fundidor (kobfundidor) anda devagar arrastando um caldeirão de ouro derretido num trenó de ossos; não
     pula. Mergulha a concha (ela acende amarela, 0,8 s) e joga um arco de ouro: onde cai, fica uma poça de 3 blocos
     (um efeito, não blocos) que brilha e endurece em 2 s; quem estiver em pé nela nessa hora fica de pés presos 1 s
     (dgPrender, do 270; o 276 faz valer);
   - o Kobold Armadilheiro (kobarmad), de capuz, com um rolo de fio de cobre no ombro: corre na frente do herói,
     estica um fio (DG_FIO, só em bloco de ar, no chão de um túnel) e se esconde agachado (quase invisível, só os
     olhos). Se o herói passa pelo fio sem rompê-lo, sai e arma outro mais à frente; no máximo 2 fios vivos por
     kobold, e os dele somem quando ele morre. Perto demais, a faca brilha (0,45 s) e ele fura. As pedras que caem
     quando o fio rompe são do 276;
   - o Kobold Montado (kobmontado), de elmo de chifres, num lagarto de carga com alforjes: faz passadas de lado a lado
     no túnel e gira nas pontas. Abaixa a lança aos poucos e o lagarto bufa (0,65 s): carga em linha reta. Abaixo de
     40% da vida o lagarto cai morto, o kobold rola no chão (a caixa fica do tamanho de um kobold) e foge; encurralado,
     fura com o toco da lança.
   Nenhum cava bloco. O 275 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp,
   contorno, cache), rampas de 6 tons com luz de cima à esquerda (seção 12); brilhos pelo HOOK.drawGlow e EYES_E, os
   pontinhos acesos por cima do escuro (HOOK.drawTop). Materiais e bases do 278 (filtrados). Prefixo kb1. */

/* ---------- números ---------- */
Object.assign(ET, {
  kobfalange: { name: 'Kobold de Falange', w: 7, h: 13, hp: 60, dmg: 14, xp: 19, kb: 0.9, fly: false, blood: '#a8402a' },
  kobfunda: { name: 'Kobold Fundeiro', w: 7, h: 13, hp: 36, dmg: 12, xp: 14, kb: 1.1, fly: false, blood: '#a8402a' },
  kobfundidor: { name: 'Kobold Fundidor', w: 8, h: 13, hp: 50, dmg: 16, xp: 18, kb: 0.5, fly: false, blood: '#a8402a' },
  kobarmad: { name: 'Kobold Armadilheiro', w: 7, h: 13, hp: 30, dmg: 18, xp: 13, kb: 1.1, fly: false, blood: '#a8402a' },
  kobmontado: { name: 'Kobold Montado', w: 22, h: 20, hp: 90, dmg: 17, xp: 30, kb: 0.3, fly: false, blood: '#8a3020' }
});
const KB1_TYPES = ['kobfalange', 'kobfunda', 'kobfundidor', 'kobarmad', 'kobmontado'];
// materiais e bases do 278; filtradas agora e de novo a cada mundo
const KB1_DROPS = {
  kobfalange: [['moeda_antiga', 0.45, 1, 2], ['escama_draco', 0.05], ['min_draconio', 0.05], ['pocao', 0.06]],
  kobfunda: [['moeda_antiga', 0.4, 1, 2], ['obsidiana_rajada', 0.45, 1, 2], ['escama_draco', 0.04], ['min_draconio', 0.05], ['pocao', 0.07]],
  kobfundidor: [['moeda_antiga', 0.6, 1, 3], ['escama_draco', 0.05], ['min_draconio', 0.1], ['pocao', 0.07]],
  kobarmad: [['moeda_antiga', 0.45, 1, 2], ['escama_draco', 0.04], ['min_draconio', 0.05], ['pocao', 0.07]],
  kobmontado: [['moeda_antiga', 0.55, 1, 3], ['escama_draco', 0.12], ['min_draconio', 0.08], ['pocao', 0.1], ['elmo_chifre_serpe', 0.01]]
};
function kb1Tables() { for (const k of KB1_TYPES) DROPS[k] = KB1_DROPS[k].filter(([id]) => ITEMS[id]); }
kb1Tables();
Object.assign(NAV_WALKERS, { kobfalange: 1, kobfunda: 1, kobarmad: 1 });
Object.assign(CV_STEP, { kobfalange: 1, kobfunda: 1, kobfundidor: 1, kobarmad: 1, kobmontado: 1 });

const KB1_TAP = 0.8, KB1_GIRO = 0.85, KB1_CONCHA = 0.8, KB1_FACA = 0.45, KB1_LANCA = 0.65;
const KB1_PASSO = 9;                               // a distância entre os da fila (px)
const KB1_PEDRA_SP = 250, KB1_PEDRA_G = 420;       // a pedra da funda
const KB1_OURO_G = 520;                            // o ouro jogado pela concha
const KB1_POCA_W = 18, KB1_POCA_T = 2;             // a poça: meia-largura (3 blocos) e o tempo até endurecer
const KB1_CARGA_SP = 190;                          // a carga do lagarto
const KB1_LONGE = 8 * T;                           // a distância do fundeiro

/* ---------- as poses ----------
   Os kobolds a pé são desenhados de frente para a direita com o corpo no x bx e os pés na linha fy do quadro; as
   poses guardam tudo relativo a (bx, fy): low (o corpo desce), lean (o tronco vai para a frente), b/f o pé de trás e o
   da frente, hn/hf a mão de perto e a de longe. a: o ângulo da lança (a ponta fica a 11 px da mão); sh: o centro do
   escudo (atrás das costas quando x < 0); la: o ângulo da concha; ka: o da faca. */
const KB1_FA = [
  { low: 0, lean: 0, b: [-1.4, 0], f: [1.6, 0], hn: [2.8, -7.8], hf: [2.6, -6.6], a: -1.32, sh: [3.6, -7.2] },          // 0 parado
  { low: 0.4, lean: 0.5, b: [-2.8, 0], f: [2.6, 0], hn: [3, -7.6], hf: [2.8, -6.4], a: -1.25, sh: [3.9, -7] },          // 1-2 andando
  { low: 0, lean: 0.5, b: [1.2, 0], f: [-1.4, -0.8], hn: [2.8, -8], hf: [2.6, -6.8], a: -1.38, sh: [3.8, -7.4] },
  { low: 0.6, lean: -0.2, b: [-1.8, 0], f: [2, 0], hn: [1.4, -10.4], hf: [2.6, -6.4], a: -0.5, sh: [3.6, -6.8] },        // 3 a lança erguida (aviso)
  { low: 0.8, lean: 0.2, b: [-1.8, 0], f: [2, 0], hn: [2, -9.2], hf: [2.6, -6.2], a: -0.2, sh: [3.7, -6.6] },            // 4 a lança bate no escudo
  { low: 0.9, lean: 1.5, b: [-3, 0], f: [3.4, 0], hn: [6, -8.2], hf: [4, -6.8], a: -0.06, sh: [5.2, -7] },               // 5 a estocada
  { low: 0.4, lean: 1, b: [-3.2, 0], f: [3, 0], hn: [1.4, -7.4], hf: [-1.8, -7], a: -2.2, sh: [-3, -8.2] },              // 6-7 fugindo
  { low: 0, lean: 1, b: [1.6, 0], f: [-1.6, -1], hn: [1.8, -7.8], hf: [-1.6, -7.4], a: -2.3, sh: [-3, -8.6] }
];
const kb1Ponta = (o, L = 11) => [o.hn[0] + Math.cos(o.a) * L, o.hn[1] + Math.sin(o.a) * L];
const KB1_FU = [
  { low: 0, lean: 0, b: [-1.4, 0], f: [1.6, 0], hn: [2.6, -6.2], hf: [-1.6, -6.4] },                       // 0 parado
  { low: 0.4, lean: 0.5, b: [-2.8, 0], f: [2.6, 0], hn: [3, -6.6], hf: [-2, -6.2] },                       // 1-2 andando
  { low: 0, lean: 0.5, b: [1.2, 0], f: [-1.4, -0.8], hn: [2.2, -6], hf: [-1, -6.8] },
  { low: 0.3, lean: -0.3, b: [-1.8, 0], f: [2, 0], hn: [1.2, -15], hf: [2.4, -7.4] },                      // 3 girando a funda (aviso)
  { low: 0.6, lean: 1.3, b: [-2.6, 0], f: [3, 0], hn: [5.6, -10.2], hf: [-1.4, -6.6] },                    // 4 soltou
  { low: 0, lean: -0.4, b: [-2.2, -2], f: [1.8, -1.4], hn: [3, -8.4], hf: [-2, -8], air: 1 }               // 5 o pulo para trás
];
const KB1_FD = [
  { low: 0.4, lean: 0.9, b: [-2.6, 0], f: [2.4, 0], hn: [3, -8.4], hf: [-3.2, -6.8], la: -2.25 },          // 0-1 puxando
  { low: 0, lean: 0.9, b: [1.2, 0], f: [-1.6, -0.8], hn: [2.6, -8.8], hf: [-3, -7.2], la: -2.3 },
  { low: 1, lean: -1.2, b: [-1.8, 0], f: [2, 0], hn: [-4.6, -12.4], hf: [-3, -7], la: 2.2 },               // 2 a concha no caldeirão (aviso)
  { low: 0.2, lean: 0.7, b: [-2.4, 0], f: [2.6, 0], hn: [3.4, -13.4], hf: [-3, -7], la: -1.1, full: 1 },   // 3 jogou
  { low: 0, lean: 0.3, b: [-1.4, 0], f: [1.6, 0], hn: [2.8, -8.6], hf: [-3, -7.2], la: -2.2 }              // 4 parado
];
const kb1Concha = o => [o.hn[0] + Math.cos(o.la) * 6, o.hn[1] + Math.sin(o.la) * 6];
const KB1_CALD = -12;                               // o centro do caldeirão, relativo ao corpo do fundidor
const KB1_AR = [
  { low: 0.4, lean: 0.3, b: [-1.6, 0], f: [1.6, 0], hn: [2.6, -6.4], hf: [-1.4, -6.6], ka: 0.9 },         // 0 parado
  { low: 0.6, lean: 1.2, b: [-3.2, 0], f: [3, 0], hn: [1.6, -7.6], hf: [0.2, -6.8], ka: 1.2 },             // 1-2 correndo
  { low: 0.2, lean: 1.2, b: [1.6, 0], f: [-1.8, -1], hn: [2.4, -7.2], hf: [-0.6, -7.4], ka: 1 },
  { low: 3.2, lean: 1.6, b: [-2.8, 0], f: [2.6, 0], hn: [5, -1.6], hf: [3.6, -2.6], ka: 1.5 },             // 3 armando o fio
  { low: 4.2, lean: -0.2, b: [-1.6, 0], f: [1.4, 0], hn: [2.4, -5.2], hf: [1.4, -4.8], ka: 1.8, tail: -1 }, // 4 escondido
  { low: 0.8, lean: -0.5, b: [-2, 0], f: [2.2, 0], hn: [-1.2, -11.2], hf: [2.6, -7], ka: -2.4 },          // 5 a faca erguida (aviso)
  { low: 1, lean: 1.6, b: [-3, 0], f: [3.4, 0], hn: [6.2, -7.4], hf: [-1.6, -6.6], ka: 0 },               // 6 a furada
  { low: 0, lean: -0.4, b: [-2.2, -2], f: [1.8, -1.4], hn: [3, -8.4], hf: [-2, -8], ka: 0.6, air: 1 }      // 7 no ar
];
// o kobold que caiu do lagarto: o toco da lança (6 px à frente da mão)
const KB1_AP = [
  { low: 0.3, lean: 0.2, b: [-1.4, 0], f: [1.6, 0], hn: [2.8, -6.8], hf: [-1.4, -6.6], a: -1.1 },          // 0 parado, acuado
  { low: 0.6, lean: 1.2, b: [-3.2, 0], f: [3, 0], hn: [1, -7.4], hf: [0.6, -7], a: -2.4 },                 // 1-2 correndo
  { low: 0.2, lean: 1.2, b: [1.6, 0], f: [-1.8, -1], hn: [1.6, -7.8], hf: [-0.4, -7.4], a: -2.5 },
  { low: 0, lean: -1.4, b: [-2.6, -2.8], f: [2.4, -3.6], hn: [-0.6, -12.6], hf: [3.2, -12], a: -1.9, air: 1 },   // 3 rolando
  { low: 0.8, lean: -0.5, b: [-2, 0], f: [2.2, 0], hn: [-1.2, -10.8], hf: [2.6, -7], a: -0.7 },           // 4 o toco erguido (aviso)
  { low: 1, lean: 1.6, b: [-3, 0], f: [3.4, 0], hn: [6, -7.6], hf: [-1.6, -6.6], a: -0.05 }               // 5 a furada
];
// o montado, no quadro de 46 x 32 (os pés do lagarto na linha 30); o centro da caixa no x KB1_MX
const KB1_MW = 46, KB1_MH = 32, KB1_MFY = 30, KB1_LX = 23, KB1_MX = 26;
const KB1_MO = [
  { ph: 0, la: -1.25 }, { ph: 1, la: -1.22 }, { ph: 2, la: -1.25 }, { ph: 3, la: -1.28 },               // 0-3 andando, a lança em pé
  { brace: 1, la: -0.85 }, { brace: 1, la: -0.45 }, { brace: 1, la: -0.08 },                             // 4-6 a lança descendo (aviso)
  { gal: 0, la: -0.05 }, { gal: 1, la: -0.05 }                                                         // 7-8 a carga
];
// o cavaleiro: a anca, a mão da lança e a da rédea; no quadro
function kb1Sela(o) {
  const bob = o.ph !== undefined ? (o.ph % 2 ? 0.5 : 0) : o.gal !== undefined ? (o.gal ? -0.6 : 0.4) : 0.6;
  const lean = o.brace || o.gal !== undefined ? 1.1 : 0.2, bx = KB1_LX + 1, hip = KB1_MFY - 10.8 + bob;
  return { bob, lean, bx, hip, hn: [bx + 2.6 + lean * 0.8, hip - 2.6], hf: [bx + 4.4 + lean, hip - 2.2] };
}
const kb1MPonta = o => { const S = kb1Sela(o); return [S.hn[0] + Math.cos(o.la) * 15, S.hn[1] + Math.sin(o.la) * 15]; };
// o olho do kobold (relativo ao corpo e aos pés)
const kb1Olho = o => [2.5 + (o.lean || 0) * 0.95, (o.low || 0) - 12.6];

/* ================= arte ================= */
const KB1 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const KR = {
  escama: R6(['#2a1410', '#4a2418', '#6e3820', '#9a5428', '#c47a3a', '#e8a85a']),     // as escamas cor de tijolo
  ventre: R6(['#3a2010', '#5c3a1c', '#84582c', '#aa7a40', '#cc9e5c', '#ecc888']),     // a barriga ocre
  pano: R6(['#141616', '#22282a', '#343c3e', '#4a5456', '#667072', '#8a9294']),       // o pano cinza rasgado
  linho: R6(['#2a2418', '#463c2a', '#665a40', '#88795a', '#aa9a78', '#ccbc9a']),      // a estopa do fundeiro
  capuz: R6(['#0e0c0c', '#1a1716', '#282422', '#3a3532', '#504a46', '#6a625c']),      // o capuz do armadilheiro
  couro: R6(['#1a1008', '#2e1e10', '#4a3018', '#684622', '#8a6030', '#ae8048']),
  ferro: R6(['#141210', '#26221e', '#3c3632', '#58504a', '#7c726a', '#a89c92']),
  osso: R6(['#3a3020', '#5a4c34', '#7a6a4c', '#9a8a68', '#bcac88', '#ddd0ae']),       // osso de dragão
  obsid: R6(['#1a0c08', '#2e140c', '#4a2014', '#6a301e', '#8a4630', '#c87a52']),      // obsidiana rajada
  ouro: R6(['#4a3008', '#7a5410', '#a87808', '#d8a830', '#f0cc5a', '#fff0a0']),
  olho: R6(['#3a2804', '#6a4c08', '#a87c10', '#e0b020', '#ffd848', '#fff4a0']),
  cobre: R6(['#3a1a08', '#62300e', '#8c4a18', '#b86a28', '#de9040', '#ffc070']),
  escudo: R6(['#0e1614', '#18261f', '#26392c', '#36503c', '#4c6a4e', '#6a8a64']),     // escamas de draco do escudo, verdete
  lagarto: R6(['#16160e', '#262618', '#3a3a24', '#525234', '#6c6c48', '#8c8a62']),    // o lagarto de carga, oliva poeirento
  lagV: R6(['#2a2618', '#443e28', '#625a3c', '#827854', '#a49870', '#c6ba90']),
  lingua: R6(['#3a1418', '#5e2228', '#86343c', '#ac4e54', '#cc7076', '#e89a9c'])
};
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
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
// um tubo afinando: pernas, braços, cauda, pescoço
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
// polígono cheio (par-ímpar), f(x, y) -> o tom
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) P.put(x, y, R, f(x, y));
  }
}
// a perna de lagarto: coxa, joelho para a frente, o calcanhar alto e o pé com a garra
function perna(P, hx, hy, fx, fy, base, s, air) {
  const kx = hx + (air ? 1.8 : 1.3), ky = hy + Math.max(0.8, (fy - hy) * 0.42), ax = fx - 1, ay = fy - Math.min(1.6, Math.max(0.6, (fy - hy) * 0.35));
  tubo(P, hx, hy, kx, ky, 1, 0.8, KR.escama, base, s);
  tubo(P, kx, ky, ax, ay, 0.65, 0.5, KR.escama, base - 0.2, s + 1);
  P.line(ax, ay + 0.3, fx + 1, fy, KR.escama, base - 0.4);
  P.put(fx + 1.6, fy, KR.osso, base + 1);
}
function braco(P, sx, sy, hx, hy, base, s) {
  const ex = (sx + hx) / 2 - 0.3, ey = (sy + hy) / 2 + 0.9;
  tubo(P, sx, sy, ex, ey, 0.9, 0.75, KR.escama, base, s); tubo(P, ex, ey, hx, hy, 0.75, 0.6, KR.escama, base + 0.2, s + 1);
  P.put(hx, hy, KR.escama, base + 1.2);
}
// a cabeça de lagarto de lado: o crânio, o focinho comprido, o olho amarelo, o sobrolho, dois chifrinhos de osso
function cabeca(P, hx, hy, s, helm) {
  tubo(P, hx - 1.6, hy + 2.6, hx - 0.6, hy + 0.8, 0.95, 0.95, KR.escama, 2.4, s);
  ell(P, hx - 0.3, hy, 2.2, 1.9, -0.12, KR.escama, s, 3.1, (u, v) => [KR.escama, v > 0.55 ? -0.6 : 0]);
  ell(P, hx + 2.9, hy + 0.8, 2.5, 1.05, 0.12, KR.escama, s + 1, 3.2, (u, v) => v > 0.2 ? [KR.ventre, 0.2] : [KR.escama, 0.4]);
  P.line(hx + 0.4, hy + 1.6, hx + 4.6, hy + 1.6, KR.escama, 0.4);    // a boca
  P.put(hx + 5, hy + 0.4, KR.escama, 0.8);                            // a narina
  P.line(hx - 0.2, hy - 1.3, hx + 1.6, hy - 1.1, KR.escama, 5);      // o sobrolho
  P.put(hx + 0.8, hy - 0.3, KR.olho, 5); P.put(hx + 0.2, hy - 0.3, KR.escama, 0.2);   // o olho (o EYES_E acende)
  if (helm) {   // o elmo de chifres (montado): a calota de couro com aro de osso e dois chifres curvos para trás
    ell(P, hx - 0.6, hy - 1.2, 2.5, 1.5, -0.1, KR.couro, s + 2, 2.6, (u, v) => v > 0.35 ? null : [KR.couro, u < -0.4 ? -0.4 : 0]);
    for (let x = hx - 2.8; x <= hx + 1.8; x += 0.5) P.put(x, hy - 0.6, KR.osso, x > hx ? 4.4 : 3.2);
    for (let t = 0; t <= 1; t += 0.08) P.put(hx - 0.6 - t * 3.8, hy - 2.2 - t * 0.8 - t * t * 2.2, KR.osso, 3.4 + t * 1.6);   // o chifre de serpe
    P.put(hx + 0.4, hy - 2.6, KR.osso, 3.8);
    return;
  }
  for (let t = 0; t <= 1; t += 0.1) P.put(hx - 1 - t * 3.4, hy - 1.2 - t * 1.2 - t * t * 0.6, KR.osso, 4.8 - t * 1.4);   // o chifre para trás
  P.put(hx - 0.6, hy - 2, KR.osso, 3.6);
}
// o pano rasgado na cintura (a barra em dentes) e o cinto
function tanga(P, bx, hipY, R, s) {
  poly(P, [[bx - 2.5, hipY - 1.2], [bx + 2.4, hipY - 1.2], [bx + 2.3, hipY + 2.2], [bx + 1.2, hipY + 1.3], [bx + 0.4, hipY + 2.9], [bx - 0.7, hipY + 1.5], [bx - 1.8, hipY + 2.6], [bx - 2.7, hipY + 1.1]], R,
    (x, y) => 3 - (y - hipY) * 0.3 + (x - bx) * 0.12 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.15 ? -1 : 0));
  for (let x = bx - 2.4; x <= bx + 2.4; x += 0.5) P.put(x, hipY - 1.3, KR.couro, x > bx + 1 ? 2 : 3.2);
}
/* o kobold inteiro, de frente para a direita, no quadro com o corpo em bx e os pés na linha fy.
   o: a pose (relativa a bx, fy; o.hip e as mãos absolutos quando montado); R: a rampa do pano; L: { back, mid, front }
   desenham o que vai atrás do tronco, entre a cabeça e o braço de perto, e por cima de tudo. */
function kobold(P, bx, fy, o, s, R, L = {}) {
  const low = o.low || 0, lean = o.lean || 0, sit = o.hip !== undefined;
  const hipY = sit ? o.hip : fy - 5.2 + low, sx = bx + lean * 0.55, sy = hipY - 4.4, hx = bx + 1.1 + lean * 0.95, hy = hipY - 7.4;
  const at = p => sit ? p : [bx + p[0], fy + p[1]];
  const HN = at(o.hn), HF = at(o.hf);
  // a cauda: grossa na anca, afinando até o chão (sentado, cai pelo lombo)
  const droop = sit ? 2.4 : Math.min(4.6, fy - hipY - 0.2), tw = o.tail || 0;
  const r = t => 0.95 * (1 - t) + 0.35;
  let px = bx - 1.2, py = hipY - 0.6;
  for (let i = 1; i <= 8; i++) {
    const t = i / 8, x = bx - 1.4 - t * (6.2 + tw * 1.4) + (tw < 0 ? t * t * 4 : 0), y = hipY - 0.2 - Math.sin(t * 2.2) * 1.2 + t * t * (droop + 1.2) - Math.sin(t * 3) * Math.max(0, tw);
    tubo(P, px, py, x, y, r(t - 1 / 8), r(t), KR.escama, 3 - t * 0.6, s); px = x; py = y;
  }
  if (!sit) perna(P, bx - 0.7, hipY, ...at(o.b), 1.5, s + 1, o.air);
  braco(P, sx - 0.6, sy + 0.6, HF[0], HF[1], 1.5, s + 2);
  if (L.back) L.back(HN, HF, hipY);
  // o tronco: as escamas no lombo, a barriga ocre em gomos na frente
  ell(P, sx, sy + 2.3, 2.3, 3, lean * 0.14, KR.escama, s + 3, 2.8, (u, v, x, y) => u > 0.3 && v > -0.55 ? [KR.ventre, y % 2 ? -0.7 : 0] : [KR.escama, ((x + (y >> 1)) & 1) ? -0.45 : 0.2]);
  tanga(P, bx + lean * 0.2, hipY, R, s + 4);
  if (sit) {   // a perna de perto descendo pelo flanco do lagarto, o pé no estribo
    tubo(P, bx, hipY, bx + 2.6, hipY + 1.3, 1.2, 0.95, KR.escama, 2.8, s + 5);
    tubo(P, bx + 2.6, hipY + 1.3, bx + 1.8, hipY + 4, 0.85, 0.65, KR.escama, 2.6, s + 6);
    P.line(bx + 1.6, hipY + 4.4, bx + 3.4, hipY + 4.4, KR.escama, 2.4);
  } else perna(P, bx + 0.8, hipY, ...at(o.f), 2.8, s + 5, o.air);
  // a tira de pano cruzando o peito
  for (let t = 0; t <= 1; t += 0.12) P.put(sx - 1.6 + t * 3, sy + 0.3 + t * 3.4, R, 3.8 - t * 0.8 + (hash2(t * 9 | 0, 1, s) < 0.3 ? -0.8 : 0));
  cabeca(P, hx, hy, s + 6, o.helm);
  if (L.mid) L.mid(HN, HF, hipY, hx, hy);
  braco(P, sx + 0.7, sy + 0.7, HN[0], HN[1], 3, s + 7);
  if (L.front) L.front(HN, HF, hipY, hx, hy);
}

/* ---------- as armas e os trastes ---------- */
// a lança: o cabo de madeira, a amarração de osso, a ponta em folha (obsidiana ou osso)
function lanca(P, x, y, a, fr = 11, bk = 5, tip = KR.ferro) {
  const c = Math.cos(a), sn = Math.sin(a), nx = -sn, ny = c;
  for (let t = -bk; t <= fr - 2.6; t += 0.5) P.put(x + c * t, y + sn * t, KR.osso, 2.2 + (t < 0 ? -0.6 : 0.3));
  P.put(x + c * (fr - 3.2), y + sn * (fr - 3.2), KR.couro, 1.6);
  for (let t = fr - 2.6; t <= fr + 0.01; t += 0.5) {
    const w = (fr - t) < 0.6 ? 0 : (fr - t) < 1.6 ? 0.5 : 0.8;
    P.put(x + c * t, y + sn * t, tip, 4.4 - (fr - t) * 0.3);
    if (w > 0.4) { P.put(x + c * t + nx * w, y + sn * t + ny * w, tip, 2.4); P.put(x + c * t - nx * w, y + sn * t - ny * w, tip, 5); }
  }
}
// o escudo de escamas de draco: oval alto, escamas em fileiras, o aro de osso e a bossa de ouro
function escudo(P, cx, cy, s) {
  ell(P, cx, cy, 2.7, 4.8, 0, KR.escudo, s, 3, (u, v, x, y) => {
    if (u * u + v * v > 0.62) return [KR.osso, 0.4 - (u > 0 ? 0.8 : 0) - (v > 0.3 ? 0.6 : 0)];
    const row = Math.floor((y - cy + 10) / 2), off = row & 1, edge = (Math.floor(y - cy + 10) & 1) === 1;
    return [KR.escudo, (((x + off) & 1) ? -0.4 : 0.4) + (edge ? -0.8 : 0.2)];
  });
  P.put(cx, cy, KR.ouro, 4.6); P.put(cx - 0.6, cy - 0.6, KR.ouro, 5.4);
}
// a funda pendurada na mão: a corda e a bolsinha com a pedra
function fundaPendurada(P, hx, hy) { P.line(hx, hy, hx - 0.4, hy + 3, KR.linho, 4.2); P.line(hx + 0.4, hy, hx + 0.6, hy + 3, KR.linho, 3.4); P.put(hx, hy + 3.6, KR.couro, 2.6); P.put(hx + 0.6, hy + 3.6, KR.obsid, 4); }
// a concha de ferro (cheia, com ouro)
function concha(P, hx, hy, a, full) {
  const c = Math.cos(a), sn = Math.sin(a);
  for (let t = -1; t <= 5; t += 0.5) P.put(hx + c * t, hy + sn * t, KR.ferro, 3.6 - t * 0.15 + (t < 0 ? -0.8 : 0));
  const cx = hx + c * 6, cy = hy + sn * 6;
  ell(P, cx, cy, 1.5, 1.2, 0, KR.ferro, 31, 2.2);
  if (full) { P.put(cx, cy - 1, KR.ouro, 5); P.put(cx - 1, cy - 1, KR.ouro, 4); P.put(cx + 1, cy - 1, KR.ouro, 4.4); }
}
// o caldeirão de ferro num trenó de ossos, a boca de ouro derretido, a alça e a corrente até a mão
function caldeirao(P, cx, fy, hf, s) {
  P.line(cx - 7.4, fy, cx + 7, fy, KR.osso, 3.4); P.put(cx + 7.6, fy - 0.6, KR.osso, 4.6); P.put(cx - 7.8, fy - 0.6, KR.osso, 4);   // o trenó
  for (const ox of [-4.4, 4]) P.line(cx + ox, fy - 0.6, cx + ox * 0.8, fy - 1.6, KR.osso, 2.4);
  ell(P, cx, fy - 5, 6.2, 4.4, 0, KR.ferro, s, 2.6, (u, v, x, y) => [KR.ferro, (hash2(x, y, s) < 0.12 ? -0.8 : 0) + (v < -0.82 ? 1 : 0)]);
  for (let x = cx - 6.2; x <= cx + 6.2; x += 0.5) { P.put(x, fy - 9, KR.ferro, x < cx - 2 ? 4.4 : 3.4); P.put(x, fy - 8.5, KR.ferro, 1.4); }   // a borda
  for (let x = cx - 5.4; x <= cx + 5.4; x += 0.5) { P.put(x, fy - 9.6, KR.ouro, 4.4 + Math.sin(x * 1.3) * 0.7); if (Math.abs(x - cx) < 4.4) P.put(x, fy - 10.1, KR.ouro, 3.4 + Math.sin(x * 2.1) * 0.6); }   // a boca: ouro derretido
  for (const [ox, L] of [[-3.6, 2], [2.4, 3]]) for (let k = 0; k < L; k++) P.put(cx + ox + k * 0.2, fy - 8.4 + k, KR.ouro, 3.4 - k * 0.7);   // escorridos
  for (let t = 0; t <= 1.001; t += 0.05) P.put(cx - 6 + t * 12, fy - 9.6 - Math.sin(t * Math.PI) * 3.6, KR.ferro, 2.8 + (t < 0.5 ? 1 : 0));   // a alça
  // a corrente da alça até a mão de longe
  const ax = cx + 5.4, ay = fy - 10.4, n = Math.max(2, Math.ceil(Math.hypot(hf[0] - ax, hf[1] - ay) / 1.2));
  for (let i = 0; i <= n; i++) { const t = i / n; P.put(ax + (hf[0] - ax) * t, ay + (hf[1] - ay) * t + Math.sin(t * Math.PI) * 0.8, KR.ferro, i % 2 ? 2.4 : 4); }
}
function faca(P, hx, hy, a) { const c = Math.cos(a), sn = Math.sin(a); P.put(hx - c, hy - sn, KR.couro, 2.4); for (let t = 0.5; t <= 3.6; t += 0.5) P.put(hx + c * t, hy + sn * t, KR.ferro, t > 3 ? 5 : 4 - t * 0.2); }

/* ---------- os kobolds a pé ---------- */
function falange(k, esc) {
  const o = KB1_FA[k], P = cp(30, 20), s = 27301 + k * 7 + (esc ? 0 : 3), bx = 11, fy = 18;
  const sh = esc ? [bx + o.sh[0] + o.lean * 0.4, fy + o.sh[1] + o.low] : null;
  kobold(P, bx, fy, o, s, KR.pano, {
    back: () => { if (sh && sh[0] < bx) escudo(P, sh[0], sh[1], s + 9); },
    mid: () => { if (sh && sh[0] >= bx) escudo(P, sh[0], sh[1], s + 9); },
    front: HN => lanca(P, HN[0], HN[1], o.a)
  });
  return setO(P.done());
}
function fundeiro(k) {
  const o = KB1_FU[k], P = cp(22, 24), s = 27331 + k * 7, bx = 10, fy = 22;
  kobold(P, bx, fy, o, s, KR.linho, {
    back: (HN, HF, hipY) => { ell(P, bx - 2.6, hipY + 0.6, 1.5, 1.6, 0, KR.couro, s + 8, 2.4); P.put(bx - 2.8, hipY - 0.6, KR.obsid, 4.4); },   // a bolsa de pedras
    front: HN => {
      if (k === 3) P.line(HN[0], HN[1], HN[0] + 0.6, HN[1] - 2.2, KR.linho, 4.4);       // a corda sobe (o resto gira no drawTop)
      else if (k === 4) { P.line(HN[0], HN[1], HN[0] + 3.4, HN[1] + 0.8, KR.linho, 4); P.line(HN[0], HN[1], HN[0] + 3, HN[1] - 0.6, KR.linho, 3.2); }
      else fundaPendurada(P, HN[0], HN[1]);
    }
  });
  return setO(P.done());
}
function fundidor(k) {
  const o = KB1_FD[k], P = cp(32, 24), s = 27361 + k * 7, bx = 20, fy = 22;
  caldeirao(P, bx + KB1_CALD, fy, [bx + o.hf[0], fy + o.hf[1]], s + 9);
  kobold(P, bx, fy, o, s, KR.couro, {
    mid: (HN, HF, hipY) => {   // o avental de couro chamuscado por cima do pano
      poly(P, [[bx + 0.6 + o.lean * 0.5, hipY - 5.4], [bx + 2.6 + o.lean * 0.6, hipY - 4.6], [bx + 2.8 + o.lean * 0.3, hipY + 2.4], [bx + 0.2, hipY + 2.6]], KR.couro,
        (x, y) => 3.4 - (y - hipY) * 0.12 + cg(x, y, s) * 0.5 + (hash2(x, y, s + 1) < 0.18 ? -1.2 : 0));
    },
    front: HN => concha(P, HN[0], HN[1], o.la, o.full)
  });
  return setO(P.done());
}
function armadilheiro(k) {
  const o = KB1_AR[k], P = cp(22, 20), s = 27391 + k * 7, bx = 10, fy = 18;
  kobold(P, bx, fy, o, s, KR.capuz, {
    back: (HN, HF, hipY) => {   // o rolo de fio de cobre no ombro
      const cx = bx - 1.4 + o.lean * 0.4, cy = hipY - 4.2;
      for (let a = 0; a < 6.28; a += 0.4) P.put(cx + Math.cos(a) * 1.8, cy + Math.sin(a) * 1.5, KR.cobre, 3.2 + Math.cos(a + 2.4) * 1.4);
    },
    mid: (HN, HF, hipY, hx, hy) => {   // o capuz escuro por cima da cabeça, a ponta caída atrás
      ell(P, hx - 0.8, hy - 0.4, 2.6, 2.3, -0.2, KR.capuz, s + 8, 2.6, (u, v) => u > 0.45 && v > -0.4 ? null : [KR.capuz, (u > 0.2 ? 0.6 : 0) - (v > 0.4 ? 0.6 : 0)]);
      P.line(hx - 3, hy - 0.4, hx - 4.6, hy + 2, KR.capuz, 2); P.put(hx - 4.8, hy + 2.6, KR.capuz, 1.6);
      P.put(hx + 0.9, hy - 0.4, KR.olho, 4.6);
    },
    front: HN => {
      if (k === 3) { P.line(HN[0], HN[1], HN[0] + 2.6, HN[1] + 1.4, KR.cobre, 4.6); P.put(HN[0] + 2.8, HN[1] + 1.6, KR.cobre, 5.6); }   // o fio esticando até o chão
      faca(P, HN[0], HN[1], o.ka);
    }
  });
  return setO(P.done());
}
function apeado(k) {
  const o = Object.assign({ helm: 1 }, KB1_AP[k]), P = cp(22, 20), s = 27421 + k * 7, bx = 10, fy = 18;
  kobold(P, bx, fy, o, s, KR.pano, { front: HN => lanca(P, HN[0], HN[1], o.a, 6, 3, KR.osso) });
  return setO(P.done());
}

/* ---------- o lagarto de carga e o montado ---------- */
function lagarto(P, o, s, morto) {
  const fy = KB1_MFY, cx = KB1_LX, S = o ? kb1Sela(o) : { bob: 0 }, bob = morto ? 0 : S.bob;
  const by = morto ? fy - 2.8 : fy - 6.4 + bob, ry = morto ? 2.7 : 3.8, low = o && (o.brace || o.gal !== undefined) ? 1.2 : 0;
  // as pernas: abertas para os lados; as de longe mais escuras; pares em diagonal andam juntos
  const leg = (hx, off, base, ss, front) => {
    if (morto) { tubo(P, hx, by + 1, hx + (front ? 2.6 : -2.6), fy - 0.4, 1.2, 0.8, KR.lagarto, base, ss); P.put(hx + (front ? 3.6 : -3.6), fy, KR.osso, 3); return; }
    const kx = hx + off * 0.5 + (front ? 0.8 : -0.6), ky = fy - 3.4, fx = hx + off;
    tubo(P, hx, by + 1.4, kx, ky, 1.5, 1.15, KR.lagarto, base, ss);
    tubo(P, kx, ky, fx, fy - 0.8, 1.05, 0.8, KR.lagarto, base - 0.2, ss + 1);
    P.line(fx - 0.6, fy, fx + 2, fy, KR.lagarto, base - 0.4);
    for (const d of [0.6, 1.4, 2.2]) P.put(fx + d, fy, KR.osso, base + 1);
  };
  const ph = o && o.ph !== undefined ? o.ph : 0, gal = o && o.gal !== undefined ? o.gal : -1;
  const off = i => gal >= 0 ? (i < 2 ? (gal ? 3.4 : 0.6) : (gal ? -0.8 : -3.6)) * (i % 2 ? 0.8 : 1) : o && o.brace ? (i < 2 ? 2.4 : -2.4) : [2, 0.4, -2, 0.4][(ph + (i === 1 || i === 2 ? 2 : 0)) % 4];
  leg(cx + 5, off(1), 1.4, s, true); leg(cx - 7.6, off(3), 1.4, s + 2, false);
  // a cauda: grossa, em S, a ponta varrendo o chão
  let px = cx - 9, py = by - 0.2;
  for (let i = 1; i <= 10; i++) { const t = i / 10, x = cx - 9 - t * 12.6, y = by - 0.2 + t * (fy - 1.4 - by) * (morto ? 0.4 : 1) * t - Math.sin(t * 3.4) * (morto ? 0 : 1.2); tubo(P, px, py, x, y, 2.3 * (1 - t) + 0.5, 2.3 * (1 - t - 0.1) + 0.5, KR.lagarto, 2.8 - t * 0.6, s + 3); px = x; py = y; }
  // o corpo: o lombo com faixas e a crista de cravos, a barriga clara
  ell(P, cx, by, 10.5, ry, morto ? 0.04 : 0, KR.lagarto, s + 4, 2.6, (u, v, x, y) => {
    if (v > 0.45) return [KR.lagV, -0.4 + (y % 2 ? -0.5 : 0)];
    const band = Math.abs(Math.sin(x * 0.62)) < 0.28 && v < 0.2 ? -1.1 : 0, spot = hash2(x, y, s) < 0.1 ? 1 : 0;
    return [KR.lagarto, band + spot + (((x + y) & 1) ? -0.25 : 0.15)];
  });
  for (let x = cx - 8; x <= cx + 7; x += 2) P.put(x, by - ry - 0.2, KR.lagarto, 1.6 + (x & 2 ? 0.6 : 0));   // os cravos do lombo
  // o pescoço e a cabeça: grossa, o focinho achatado, o olho pequeno
  const hx = cx + 13.8 + (low ? 1 : 0) + (morto ? 1.6 : 0), hy = morto ? fy - 2.2 : by - 1.2 + low;
  tubo(P, cx + 8.6, by - 0.6, hx - 1.6, hy + 0.2, 2.6, 2.1, KR.lagarto, 2.8, s + 5);
  ell(P, hx, hy, 2.9, 2.2, 0.05, KR.lagarto, s + 6, 3, (u, v) => v > 0.5 ? [KR.lagV, -0.2] : [KR.lagarto, 0]);
  ell(P, hx + 3, hy + 0.7, 2.6, 1.5, 0.08, KR.lagarto, s + 7, 3.2, (u, v) => v > 0.3 ? [KR.lagV, 0] : [KR.lagarto, 0.3]);
  P.line(hx + 0.2, hy + 1.7, hx + 5.4, hy + 1.6, KR.lagarto, 0.4);       // a boca
  P.put(hx + 5.2, hy + 0.2, KR.lagarto, 0.4);                             // a narina
  if (morto) { P.line(hx + 0.2, hy - 0.7, hx + 1.4, hy - 0.7, KR.lagarto, 0.4); P.line(hx + 5.4, hy + 1.8, hx + 7, hy + 2.4, KR.lingua, 3.6); }
  else { P.put(hx + 0.6, hy - 0.8, KR.olho, 2.8); P.put(hx + 0.2, hy - 0.8, KR.lagarto, 0.6); P.line(hx - 0.4, hy - 1.7, hx + 1.6, hy - 1.6, KR.lagarto, 4.4); }
  if (!morto && low) P.line(hx + 1.4, hy + 1.8, hx + 4.6, hy + 2.2, KR.lingua, 2.6);   // a boca entreaberta bufando
  // a manta da sela, os alforjes de couro amarrados atrás, as franjas rasgadas
  const sy = by - ry + 0.4 + (morto ? 1.2 : 0);
  poly(P, [[cx - 3.6, sy - 0.8], [cx + 4.2, sy - 0.8], [cx + 4.8, sy + 3.2], [cx + 3.2, sy + 2.4], [cx + 2.2, sy + 3.8], [cx + 0.6, sy + 2.6], [cx - 0.8, sy + 3.6], [cx - 2.4, sy + 2.4], [cx - 3.8, sy + 3.2]], KR.pano,
    (x, y) => 3 - (y - sy) * 0.3 + cg(x, y, s + 8) * 0.5 + (hash2(x, y, s + 9) < 0.14 ? -1 : 0));
  for (let x = cx - 3.4; x <= cx + 4; x += 0.5) P.put(x, sy - 1.2, KR.couro, 3.6);
  ell(P, cx - 6.2, sy + 0.6, 2.4, 2, 0, KR.couro, s + 10, 2.8); P.line(cx - 7.4, sy - 1, cx - 5, sy - 1.2, KR.linho, 4);
  if (!morto) { ell(P, cx - 9.4, sy + 1.4, 1.6, 1.6, 0, KR.couro, s + 11, 2.4); P.put(cx - 9.4, sy, KR.ouro, 4.6); }   // a bolsinha com uma moeda aparecendo
  leg(cx + 6.6, off(0), 2.8, s + 12, true); leg(cx - 6.2, off(2), 2.8, s + 14, false);
}
function montado(k) {
  const o = KB1_MO[k], P = cp(KB1_MW, KB1_MH), s = 27451 + k * 7, S = kb1Sela(o);
  lagarto(P, o, s, false);
  const pose = { hip: S.hip, lean: S.lean, hn: S.hn, hf: S.hf, helm: 1 }, low = o.brace || o.gal !== undefined;
  kobold(P, S.bx, KB1_MFY, pose, s + 20, KR.pano, {
    mid: (HN, HF) => {   // a rédea da mão de longe até o focinho
      const hx = KB1_LX + 16.8 + (low ? 1 : 0), hy = KB1_MFY - 6.6 + S.bob + (low ? 1.2 : 0);
      for (let t = 0; t <= 1; t += 0.06) P.put(HF[0] + (hx - HF[0]) * t, HF[1] + (hy - HF[1]) * t + Math.sin(t * Math.PI) * 1.2, KR.couro, 3.4);
    },
    front: HN => {
      lanca(P, HN[0], HN[1], o.la, 15, 7, KR.osso);
      if (o.la < -1) {   // o trapo de flâmula na lança em pé
        const c = Math.cos(o.la), sn = Math.sin(o.la), bx0 = HN[0] + c * 9, by0 = HN[1] + sn * 9;
        poly(P, [[bx0, by0], [bx0 - 3.6, by0 + 0.6], [bx0 - 2.4, by0 + 1.4], [bx0 - 3.2, by0 + 2.2], [bx0 + c * 2.4, by0 + sn * 2.4]], KR.escudo, (x, y) => 3.6 + cg(x, y, s) * 0.6);
      }
    }
  });
  return setO(P.done());
}
function lagartoMorto() { const P = cp(KB1_MW, KB1_MH); lagarto(P, null, 27511, true); return setO(P.done()); }

KB1.get = () => KB1.ready || (KB1.ready = {
  fa: KB1_FA.map((_, k) => falange(k, true)), fb: KB1_FA.map((_, k) => falange(k, false)),
  fu: KB1_FU.map((_, k) => fundeiro(k)),
  fd: KB1_FD.map((_, k) => fundidor(k)),
  ar: KB1_AR.map((_, k) => armadilheiro(k)),
  ap: KB1_AP.map((_, k) => apeado(k)),
  mo: KB1_MO.map((_, k) => montado(k)), morto: lagartoMorto()
});
KB1.GL = {
  olho: glow(3, '#ffd848'), ambar: glow(4, '#ffa020'), ambarG: glow(10, '#ffa020'), ouro: glow(6, '#ffd050'), ouroG: glow(12, '#ffd050'),
  brasa: glow(8, '#ff8a20')
};
}

/* ================= desenho ================= */
// a figura com o apoio (ax, ay) no centro dos pés quando olha para a direita
function kb1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const kb1Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto relativo ao corpo (dx para a frente, dy a partir da linha dos pés) no mundo
const kb1R = (e, dx, dy) => [e.x + e.w / 2 + dx * e.facing, e.y + e.h - 1 + dy];
// -1 no ar, 0/1 o passo, -2 parado
const kb1Andando = (e, k = 9) => !e.onGround ? -1 : Math.abs(e.vx) > 4 ? Math.floor(e.t * k) % 2 : -2;
// os olhos amarelos (fx, fy na tela; rel relativo ao corpo)
function kb1Olhos(e, fx, fy, rel, a = 0.3) { lc.globalAlpha = a; lc.drawImage(KB1.GL.olho, Math.round(fx + rel[0] * e.facing) - 3, Math.round(fy - 1 + rel[1]) - 3); }
function kb1Brilho(img, x, y, a) { lc.globalAlpha = a; lc.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2)); }

const kb1FaPose = e => {
  const st = e.state;
  if (st === 'tap') return e.tapFx > 0 ? 4 : 3;
  if (st === 'thrust' || (st === 'recover' && e.stateT > 0.3)) return 5;
  if (st === 'flee') return 6 + Math.floor(e.t * 12) % 2;
  const w = kb1Andando(e); return w === -1 ? 6 : w >= 0 ? 1 + w : 0;
};
DRAW_E.kobfalange = (e, fx, fy, fl) => { const B = KB1.get(); kb1Blit(cvPick((e.kb1Escudo ? B.fa : B.fb)[kb1FaPose(e)], e, fl), e, fx, fy, 12, 20, kb1Jit(e, e.state === 'tap' && e.tapFx > 0, 60)); };
EYES_E.kobfalange = (e, fx, fy) => {
  const o = KB1_FA[kb1FaPose(e)]; kb1Olhos(e, fx, fy, kb1Olho(o), e.state === 'tap' ? 0.55 : 0.3);
  if (e.state !== 'tap' && e.state !== 'thrust') return;
  const [px, py] = kb1Ponta(o), q = e.state === 'tap' ? clamp(1 - e.stateT / KB1_TAP, 0, 1) : 1;
  kb1Brilho(e.tapFx > 0 || e.state === 'thrust' ? KB1.GL.ambarG : KB1.GL.ambar, fx + px * e.facing, fy - 1 + py, 0.35 + 0.5 * q);
};
WARN_E.kobfalange = e => e.state === 'tap';

const kb1FuPose = e => { if (e.state === 'spin') return 3; if (e.state === 'throw') return 4; if (e.state === 'hop') return 5; const w = kb1Andando(e); return w === -1 ? 5 : w >= 0 ? 1 + w : 0; };
DRAW_E.kobfunda = (e, fx, fy, fl) => kb1Blit(cvPick(KB1.get().fu[kb1FuPose(e)], e, fl), e, fx, fy, 11, 24);
EYES_E.kobfunda = (e, fx, fy) => {
  kb1Olhos(e, fx, fy, kb1Olho(KB1_FU[kb1FuPose(e)]), 0.3);
  if (e.state !== 'spin') return;
  const q = clamp(1 - e.stateT / KB1_GIRO, 0, 1), h = KB1_FU[3].hn;
  kb1Brilho(KB1.GL.ambarG, fx + (h[0] + 0.6) * e.facing, fy - 1 + h[1] - 2.5, 0.25 + 0.55 * q);
};
WARN_E.kobfunda = e => e.state === 'spin';

const kb1FdPose = e => e.state === 'dip' ? 2 : e.state === 'lob' ? 3 : Math.abs(e.vx) > 2 ? Math.floor(e.t * 3) % 2 : 4;
DRAW_E.kobfundidor = (e, fx, fy, fl) => kb1Blit(cvPick(KB1.get().fd[kb1FdPose(e)], e, fl), e, fx, fy, 21, 24, kb1Jit(e, e.state === 'dip' && e.stateT < 0.3, 30));
EYES_E.kobfundidor = (e, fx, fy) => {
  const o = KB1_FD[kb1FdPose(e)]; kb1Olhos(e, fx, fy, kb1Olho(o), 0.3);
  if (e.state !== 'dip' && e.state !== 'lob') return;
  const [cx, cy] = kb1Concha(o), q = e.state === 'dip' ? clamp(1 - e.stateT / KB1_CONCHA, 0, 1) : 1;
  kb1Brilho(KB1.GL.ouroG, fx + cx * e.facing, fy - 1 + cy, 0.3 + 0.6 * q);
};
WARN_E.kobfundidor = e => e.state === 'dip';

const kb1ArPose = e => {
  const st = e.state;
  if (st === 'arm') return 3; if (st === 'hide') return 4; if (st === 'stabW') return 5; if (st === 'stab') return 6;
  if (st === 'hop') return 7;
  const w = kb1Andando(e, 12); return w === -1 ? 7 : w >= 0 ? 1 + w : 0;
};
DRAW_E.kobarmad = (e, fx, fy, fl) => {
  const v = e.vis ?? 1; lc.globalAlpha = 0.12 + 0.88 * v;
  kb1Blit(cvPick(KB1.get().ar[kb1ArPose(e)], e, fl), e, fx, fy, 11, 20, kb1Jit(e, e.state === 'stabW' && e.stateT < 0.2, 50));
  lc.globalAlpha = 1;
};
EYES_E.kobarmad = (e, fx, fy) => {
  const o = KB1_AR[kb1ArPose(e)], v = e.vis ?? 1;
  // escondido: só os olhos piscando na fresta
  kb1Olhos(e, fx, fy, kb1Olho(o), e.state === 'hide' ? (Math.sin(e.t * 1.7 + e.seed) > -0.6 ? 0.5 : 0.08) : 0.3 * v);
  if (e.state !== 'stabW' && e.state !== 'stab') return;
  const c = Math.cos(o.ka), s = Math.sin(o.ka), q = e.state === 'stabW' ? clamp(1 - e.stateT / KB1_FACA, 0, 1) : 1;
  kb1Brilho(KB1.GL.ambarG, fx + (o.hn[0] + c * 3) * e.facing, fy - 1 + o.hn[1] + s * 3, 0.3 + 0.55 * q);
};
WARN_E.kobarmad = e => e.state === 'stabW';

const kb1MoPose = e => {
  const st = e.state;
  if (st === 'lower') return 4 + Math.min(2, Math.floor((1 - e.stateT / KB1_LANCA) * 3));
  if (st === 'charge') return 7 + Math.floor(e.t * 12) % 2;
  if (st === 'stagger') return 4;
  return Math.abs(e.vx) > 3 ? Math.floor(e.t * 7) % 4 : 0;
};
const kb1ApPose = e => {
  const st = e.state;
  if (st === 'tumble') return 3; if (st === 'stabW') return 4; if (st === 'stab') return 5;
  const w = kb1Andando(e, 12); return w === -1 ? 3 : w >= 0 ? 1 + w : 0;
};
DRAW_E.kobmontado = (e, fx, fy, fl) => {
  const B = KB1.get();
  if (e.kb1Pe) { kb1Blit(cvPick(B.ap[kb1ApPose(e)], e, fl), e, fx, fy, 11, 20, kb1Jit(e, e.state === 'stabW' && e.stateT < 0.2, 50)); return; }
  kb1Blit(cvPick(B.mo[kb1MoPose(e)], e, fl), e, fx, fy, KB1_MX + 1, KB1_MFY + 2, kb1Jit(e, e.state === 'stagger' || (e.state === 'lower' && e.stateT < 0.2), 40));
};
EYES_E.kobmontado = (e, fx, fy) => {
  if (e.kb1Pe) {
    const o = KB1_AP[kb1ApPose(e)]; kb1Olhos(e, fx, fy, kb1Olho(o), 0.3);
    if (e.state === 'stabW') { const [px, py] = kb1Ponta(o, 6); kb1Brilho(KB1.GL.ambarG, fx + px * e.facing, fy - 1 + py, 0.3 + 0.55 * clamp(1 - e.stateT / KB1_FACA, 0, 1)); }
    return;
  }
  const o = KB1_MO[kb1MoPose(e)], S = kb1Sela(o), hx = S.bx + 1.1 + S.lean * 0.95, hy = S.hip - 7.4;
  kb1Olhos(e, fx, fy, [hx + 0.9 - KB1_MX, hy - 0.4 - KB1_MFY], 0.35);
  if (e.state !== 'lower' && e.state !== 'charge') return;
  const [px, py] = kb1MPonta(o), q = e.state === 'lower' ? clamp(1 - e.stateT / KB1_LANCA, 0, 1) : 1;
  kb1Brilho(KB1.GL.ambarG, fx + (px - KB1_MX) * e.facing, fy - 1 + py - KB1_MFY, 0.3 + 0.5 * q);
};
WARN_E.kobmontado = e => e.state === 'lower' || e.state === 'stabW';

/* ================= comportamento ================= */
const kb1Pedras = [], kb1Ouros = [], kb1Pocas = [], kb1Corpos = [], kb1Grupos = [], kb1Fios = [];
let kb1Agrupando = false;
const kb1Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const kb1Live = e => e && !e.dead && enemies.includes(e);
const KB1_BRASA = ['#ffa020', '#ffd050', '#fff0a0'], KB1_OURO = ['#f0cc5a', '#d8a830', '#fff0a0'], KB1_OBS = ['#8a4630', '#c87a52', '#4a2014'];
const KB1_ESC = ['#865a24', '#ae7c34', '#ddd0ae'], KB1_COBRE = ['#de9040', '#ffc070', '#b86a28'], KB1_VAPOR = ['#d8d0c4', '#a8a096', '#ece6dc'];
function kb1Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (kb1Fx.length > 360) return;
  for (let i = 0; i < n; i++) kb1P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 });
}
// o topo do chão perto de (x, y) em px: sobe se (x, y) está dentro da pedra, desce até max blocos se está no ar
function kb1Chao(x, y, max = 8) {
  const tx = Math.floor(x / T); let ty = Math.floor(y / T);
  if (solidAt(tx, ty)) { for (let k = 0; k < 3 && solidAt(tx, ty - 1); k++) ty--; return solidAt(tx, ty - 1) ? null : ty * T; }
  for (let k = 1; k <= max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T;
  return null;
}
// o arco baixo que leva (ox, oy) até (tx, ty) com a velocidade v e a gravidade g
function kb1Mira(ox, oy, tx, ty, v, g, sd) {
  const X = Math.abs(tx - ox), Y = oy - ty, disc = v ** 4 - g * (g * X * X + 2 * Y * v * v);
  const th = Math.max(0.1, disc >= 0 ? Math.atan((v * v - Math.sqrt(disc)) / (g * Math.max(1, X))) : 0.75);
  return [sd * Math.cos(th) * v, -Math.sin(th) * v];
}
function kb1HopBack(e, vx = 130, vy = 210) { e.state = 'hop'; e.airT = 0; e.vy = -vy; e.vx = -e.facing * vx; e.onGround = false; }
function kb1Hop(e, dt) { e.airT = (e.airT || 0) + dt; if ((e.onGround && e.airT > 0.12) || e.airT > 1.6) { e.state = 'walk'; e.vx *= 0.3; } }

/* ---------- o Kobold de Falange ---------- */
// a fila: refeita uma vez por quadro (quem está vivo, para onde ela olha, quem vai na frente)
function kb1Fila(G) {
  if (G.stamp === gameTime) return G;
  G.stamp = gameTime;
  G.m = G.m.filter(kb1Live);
  if (!G.m.length) return G;
  let cx = 0; for (const o of G.m) cx += o.x + o.w / 2; cx /= G.m.length;
  const pcx = pl.x + pl.w / 2;
  if (!pl.dead && G.m.some(o => o.kb1Ag)) { if (Math.abs(pcx - cx) > 10 || !G.dir) G.dir = Math.sign(pcx - cx) || 1; }
  else G.dir = G.dir || 1;
  G.m.sort((a, b) => (b.x - a.x) * G.dir);
  G.front = G.m[0];
  return G;
}
function kb1Tap(e) { e.state = 'tap'; e.stateT = KB1_TAP; e.tapN = 0; e.tapFx = 0; e.vx = 0; }
AI.kobfalange = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.tapFx = (e.tapFx || 0) - dt; e.kb1Ag = aggro;
  const ecx = e.x + e.w / 2;
  const G = e.grp && !e.grp.broken ? kb1Fila(e.grp) : null, lead = !G || G.front === e;
  if (e.state === 'tap') {   // duas batidas da lança no escudo, a ponta acende
    e.vx = approach(e.vx, 0, 700 * dt);
    const el = KB1_TAP - e.stateT, n = el >= KB1_TAP * 0.6 ? 2 : el >= KB1_TAP * 0.2 ? 1 : 0;
    if (n > e.tapN) {
      e.tapN = n; e.tapFx = 0.11;
      const [px, py] = kb1Ponta(KB1_FA[4]), [x, y] = kb1R(e, px, py); kb1Sparks(x, y, 3, KB1_BRASA, 30, -10, 0.3);
      if (lead) sfx.kb1Bate(Math.max(0.45, kb1Near(e)), n);
    }
    if (e.stateT <= 0) { e.state = 'thrust'; e.stateT = 0.2; e.swingHit = false; e.vx = e.facing * 85; if (lead) sfx.kb1Estoca(Math.max(0.4, kb1Near(e))); }
    return;
  }
  if (e.state === 'thrust') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 24, y: e.y + 1, w: 24, h: 9 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') kb1Sparks(pl.x + pl.w / 2, pl.y + 7, 5, ['#c83a2a', '#ffd050'], 60, 200, 0.4); }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.45; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.1 + Math.random() * 0.6); } return; }
  if (e.state === 'hop') { kb1Hop(e, dt); return; }
  if (e.state === 'flee') {   // a fila desfeita: cada um corre para um lado, guinchando
    const r = walk(e, dt, e.fleeDir, 84, 700, 270, dy, false);
    if (r === 0) e.fleeDir = -e.fleeDir;
    e.facing = e.fleeDir;
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.6 + Math.random() * 0.6; }
    return;
  }
  e.state = 'walk';
  if (G && G.m.length > 1) {
    const i = G.m.indexOf(e), F = G.front, dir = G.dir;
    if (i === 0) {
      // o da frente: anda até a distância da lança, mas espera enquanto os de trás não estão colados
      G.cd = (G.cd ?? 1) - dt;
      let lag = 0; for (let j = 1; j < G.m.length; j++) lag = Math.max(lag, Math.abs(F.x - j * KB1_PASSO * dir - G.m[j].x));
      let mv = 0;
      if (aggro) mv = dx * dir > 20 ? dir : 0;
      else { G.wt = (G.wt || 0) - dt; if (G.wt <= 0) { G.wt = 2 + Math.random() * 3; G.wv = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); } mv = G.wv || 0; if (mv) G.dir = mv; }
      if (lag > 14) mv = 0;
      const r = walk(e, dt, mv, aggro ? 30 + e.lvl * 0.4 : 15, 500, 260, dy, aggro && lag <= 14);
      if (!aggro && mv && r === 0) G.wv = -mv;
      e.facing = aggro ? dir : (mv || dir);
      if (aggro && G.cd <= 0 && e.onGround && !pl.dead && Math.abs(dx) < 32 && Math.abs(dy) < 18 && clearPath(e, pl)) {
        G.cd = 2.6 + Math.random() * 0.8;
        for (const o of G.m) if (o.stun <= 0 && o.state === 'walk') { kb1Tap(o); o.facing = dir; }
      }
      e.stepT = (e.stepT || 0) - dt;
      if (e.onGround && Math.abs(e.vx) > 4 && e.stepT <= 0) { e.stepT = 0.42; const v = kb1Near(e, 200); if (v > 0.05) sfx.kb1Marcha(v); }
    } else {   // os de trás: no lugar deles na fila, colados no da frente
      const tgt = F.x + F.w / 2 - i * KB1_PASSO * dir, d = tgt - ecx, far = Math.abs(d) > 2.5 * T;
      walk(e, dt, Math.abs(d) > 1.5 ? Math.sign(d) : 0, far ? 75 : clamp(Math.abs(F.vx) + Math.abs(d) * 6, 10, 90), 700, 260, dy, far && aggro);
      e.facing = dir;
    }
    return;
  }
  // sozinho (a fila acabou ou se desfez): chega perto, bate, estoca
  let mv = 0;
  if (aggro) mv = Math.abs(dx) > 18 ? Math.sign(dx) : 0; else { cvWander(e, dt); mv = e.wander; }
  walk(e, dt, mv, aggro ? 40 + e.lvl * 0.5 : 18, 600, 270, dy, aggro);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing);
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && Math.abs(dx) < 28 && Math.abs(dy) < 18 && clearPath(e, pl)) kb1Tap(e);
};
// o escudo quebrou: as lascas, e a fila se desfaz (cada um foge para um lado)
function kb1Quebra(e) {
  e.kb1Escudo = false;
  const [x, y] = kb1R(e, 3.6, -7.2);
  kb1Sparks(x, y, 10, KB1_ESC, 70, 260, 0.6); burst(x, y, 8, '#62401a', 80, 300, 0.5);
  sfx.kb1Racha(Math.max(0.5, kb1Near(e)));
  const G = e.grp, m = G && !G.broken ? G.m.filter(kb1Live) : [e];
  if (G) G.broken = true;
  const s = Math.random() < 0.5 ? 1 : -1;
  m.forEach((o, j) => {
    if (o.dead) return;
    o.state = 'flee'; o.stateT = 2.4 + Math.random() * 1.4; o.fleeDir = m.length === 1 ? -o.facing : j % 2 ? -s : s;
    if (o.onGround) { o.vy = -150 - Math.random() * 60; o.onGround = false; }
  });
  sfx.kb1Grito(Math.max(0.5, kb1Near(e)), 1.4);
}

/* ---------- o Kobold Fundeiro ---------- */
AI.kobfunda = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.hopCD = (e.hopCD || 0) - dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'spin') {   // a funda girando sobre a cabeça, cada vez mais rápido
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    const q = clamp(1 - e.stateT / KB1_GIRO, 0, 1); e.giro = (e.giro || 0) + dt * (9 + q * 16);
    if (e.stateT <= 0) { kb1Atira(e); e.state = 'throw'; e.stateT = 0.3; e.atkCD = 1.7 + Math.random() * 0.9; }
    return;
  }
  if (e.state === 'throw') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (e.state === 'hop') { kb1Hop(e, dt); return; }
  e.state = 'walk';
  // o herói chegou perto: pulo para trás
  if (aggro && e.hopCD <= 0 && e.onGround && dist < 3.5 * T) {
    e.facing = Math.sign(dx) || e.facing; kb1HopBack(e, 135, 230); e.hopCD = 1.6 + Math.random();
    sfx.kb1Grito(Math.max(0.3, kb1Near(e)) * 0.7, 1.1);
    return;
  }
  let mv = 0;
  if (aggro) { const adx = Math.abs(dx); mv = adx < KB1_LONGE - 2 * T ? -Math.sign(dx) : adx > KB1_LONGE + 2 * T || !e.sees ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); mv = e.wander; }
  walk(e, dt, mv, aggro ? 50 + e.lvl * 0.5 : 20, 600, 280, dy, aggro && mv === Math.sign(dx));
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing);
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && !pl.dead && dist > 2.5 * T && dist < 14 * T) {
    const h = KB1_FU[3].hn, [hx, hy] = kb1R(e, h[0], h[1] - 2);
    if (losClear(hx, hy, pcx, pcy) || losClear(hx, hy, pcx, pcy - T)) { e.state = 'spin'; e.stateT = KB1_GIRO; e.vx = 0; e.giro = 0; sfx.kb1Assobio(Math.max(0.4, kb1Near(e, 260))); }
    else e.atkCD = 0.4;
  }
};
// a pedra de obsidiana: um arco baixo até o herói (com um pouco de antecipação)
function kb1Atira(e) {
  const h = KB1_FU[4].hn, [ox, oy] = kb1R(e, h[0], h[1] - 1), tx = pl.x + pl.w / 2 + pl.vx * 0.2, ty = pl.y + pl.h * 0.45;
  const [vx, vy] = kb1Mira(ox, oy, tx, ty, KB1_PEDRA_SP, KB1_PEDRA_G, Math.sign(tx - ox) || e.facing);
  kb1Pedras.push({ x: ox, y: oy, vx, vy, b: 0, dmg: e.dmg, life: 3, a: 0 });
  if (kb1Pedras.length > 30) kb1Pedras.shift();
  sfx.kb1Funda(Math.max(0.35, kb1Near(e, 260)));
}

/* ---------- o Kobold Fundidor ---------- */
AI.kobfundidor = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'dip') {   // a concha no caldeirão: borbulha e acende
    e.vx = approach(e.vx, 0, 500 * dt);
    if (Math.random() < dt * 12) { const [x, y] = kb1R(e, KB1_CALD + rnd(-3, 3), -9.6); kb1Sparks(x, y, 1, KB1_OURO, 14, -30, 0.5); }
    if (e.stateT <= 0) { kb1Joga(e); e.state = 'lob'; e.stateT = 0.4; e.atkCD = 2.6 + Math.random(); }
    return;
  }
  if (e.state === 'lob') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let mv = 0;
  if (aggro) { const adx = Math.abs(dx); mv = adx > 8 * T || !e.sees ? Math.sign(dx) : adx < 2.5 * T ? -Math.sign(dx) : 0; }
  else { cvWander(e, dt); mv = e.wander; }
  // devagar e sem pular (jv 0, e não se joga de beirada)
  walk(e, dt, mv, aggro ? 15 + e.lvl * 0.2 : 9, 200, 0, dy, false);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing);
  if (e.onGround && Math.abs(e.vx) > 2) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.7; const v = kb1Near(e, 200); if (v > 0.05) sfx.kb1Arrasta(v); } }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && !pl.dead && dist < 12 * T && Math.abs(dx) > T) { e.state = 'dip'; e.stateT = KB1_CONCHA; e.vx = 0; sfx.kb1Concha(Math.max(0.4, kb1Near(e, 260))); }
};
// o arco de ouro: chega onde o herói pisa (um pouco à frente dele) num tempo que cresce com a distância; num túnel
// baixo o arco achata para não bater no teto
function kb1Joga(e) {
  const [cx, cy] = kb1Concha(KB1_FD[3]), [ox, oy] = kb1R(e, cx, cy), tx = pl.x + pl.w / 2 + pl.vx * 0.35, ty = pl.y + pl.h - 2;
  let room = 8 * T;
  for (const f of [0, 0.5, 1]) { const x = Math.floor(lerp(ox, tx, f) / T), y0 = Math.floor(oy / T); for (let k = 0; k <= 8; k++) if (solidAt(x, y0 - k)) { room = Math.min(room, oy - (y0 - k + 1) * T); break; } }
  let tf = clamp(0.55 + Math.abs(tx - ox) / 420, 0.6, 1.15), vy = 0;
  for (; tf > 0.3; tf -= 0.05) { vy = (ty - oy - 0.5 * KB1_OURO_G * tf * tf) / tf; if (vy >= 0 || vy * vy / (2 * KB1_OURO_G) < room - 4) break; }
  kb1Ouros.push({ x: ox, y: oy, vx: (tx - ox) / tf, vy, dmg: e.dmg, t: 0 });
  if (kb1Ouros.length > 16) kb1Ouros.shift();
  kb1Sparks(ox, oy, 5, KB1_OURO, 40, 200, 0.4);
  sfx.kb1Joga(Math.max(0.35, kb1Near(e, 260)));
}
// a poça: colunas de 2 px rentes ao chão de 3 blocos (só onde há chão); endurece em KB1_POCA_T
function kb1Poca(x, top) {
  const cols = [];
  for (let ox = -KB1_POCA_W; ox < KB1_POCA_W; ox += 2) {
    const px = x + ox, tx = Math.floor(px / T), ty0 = Math.round(top / T);
    for (const k of [0, -1, 1]) { const ty = ty0 + k; if (solidAt(tx, ty) && !solidAt(tx, ty - 1)) { cols.push({ x: px, y: ty * T, h: hash2(px | 0, ty, 2731) }); break; } }
  }
  if (!cols.length) return;
  kb1Pocas.push({ x, y: top, cols, t: 0, hard: false, seed: Math.random() * 100 });
  if (kb1Pocas.length > 10) kb1Pocas.shift();
}

/* ---------- o Kobold Armadilheiro ---------- */
// onde esticar o fio: no chão de um túnel entre o herói e o kobold, 4 a 11 blocos à frente do herói; o esconderijo
// fica 2 a 4 blocos depois
function kb1Sitio(D) {
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pfy = Math.floor((pl.y + pl.h + 1) / T);
  for (let c = 4; c <= 11; c++) {
    const tx = ptx + D * c;
    for (const dd of [0, -1, 1, -2, 2]) {
      const fy = pfy + dd;
      if (!solidAt(tx, fy) || tileAt(tx, fy - 1) !== AIR || solidAt(tx, fy - 2)) continue;
      let roof = false; for (let k = 3; k <= 5 && !roof; k++) roof = solidAt(tx, fy - k);
      if (!roof) continue;
      if (kb1Fios.some(w => Math.abs(w.x - tx) < 3 && Math.abs(w.y - fy + 1) < 3)) continue;
      if (typeof inDgLand === 'function' && inDgLand(tx, fy)) continue;
      let hx = null;
      for (let h = 4; h >= 2 && hx === null; h--) { const x = tx + D * h; for (const yy of [fy, fy - 1, fy + 1]) if (navStand(x, yy, 2)) { hx = x; break; } }
      if (hx === null) continue;
      return { tx, ty: fy - 1, hx, D };
    }
  }
  return null;
}
function kb1Arma(e) {
  const P = e.plan; if (!P || tileAt(P.tx, P.ty) !== AIR) return false;
  setTile(P.tx, P.ty, DG_FIO);
  kb1Fios.push({ x: P.tx, y: P.ty, o: e });
  // no máximo 2 fios vivos por kobold: o mais velho some
  const meus = kb1Fios.filter(w => w.o === e);
  if (meus.length > 2) { const w = meus[0]; if (tileAt(w.x, w.y) === DG_FIO) setTile(w.x, w.y, AIR); kb1Fios.splice(kb1Fios.indexOf(w), 1); }
  kb1Sparks(P.tx * T + T / 2, P.ty * T + T / 2, 5, KB1_COBRE, 30, 0, 0.4);
  sfx.kb1Fio(Math.max(0.3, kb1Near(e, 240)));
  return true;
}
function kb1Sai(e) { e.state = 'out'; e.stateT = 0.3; e.vis = 1; e.plan = null; sfx.kb1Esconde(Math.max(0.3, kb1Near(e))); }
function kb1Faca(e) { e.state = 'stabW'; e.stateT = KB1_FACA; e.vx = 0; sfx.kb1Faca(Math.max(0.4, kb1Near(e))); }
AI.kobarmad = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.planCD = (e.planCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, want = e.state === 'hide' ? 0 : 1;
  e.vis = approach(e.vis ?? 1, want, dt * (want ? 5 : 1.6));
  const P = e.plan;
  switch (e.state) {
    case 'stabW': e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'stab'; e.stateT = 0.16; e.vx = e.facing * 110; e.swingHit = false; sfx.kb1Corte(Math.max(0.4, kb1Near(e))); } return;
    case 'stab': {
      const hb = { x: e.facing > 0 ? ecx : ecx - 18, y: e.y + 2, w: 18, h: 9 };
      if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') kb1Sparks(pl.x + pl.w / 2, pl.y + 8, 5, ['#c83a2a', '#ffd050'], 60, 200, 0.4); }
      if (e.stateT <= 0) { kb1HopBack(e, 125, 200); e.atkCD = 1.2 + Math.random() * 0.6; e.planCD = 0.5; }
      return;
    }
    case 'hop': kb1Hop(e, dt); return;
    case 'out': e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.planCD = Math.min(e.planCD, 0.2); } return;
    case 'run': {   // correndo até o lugar do fio
      if (!aggro || !P) { e.state = 'walk'; e.plan = null; return; }
      if (dist < 1.6 * T && e.atkCD <= 0) { e.facing = Math.sign(dx) || e.facing; kb1Faca(e); return; }
      const d = P.tx * T + T / 2 - ecx;
      if (Math.abs(d) < 4) { e.state = 'arm'; e.stateT = 0.7; e.vx = 0; e.facing = -P.D; return; }
      walk(e, dt, Math.sign(d), 88, 900, 270, dy, false); e.facing = Math.sign(d) || e.facing;
      if (e.stateT <= 0) { e.state = 'walk'; e.plan = null; e.planCD = 1.5; }
      return;
    }
    case 'arm':   // ajoelhado, esticando o fio
      e.vx = approach(e.vx, 0, 800 * dt);
      if (Math.random() < dt * 10) { const [x, y] = kb1R(e, 5, -1); kb1Sparks(x, y, 1, KB1_COBRE, 15, 0, 0.3); }
      if (e.stateT <= 0) { if (kb1Arma(e)) { e.state = 'back'; e.stateT = 3; } else { e.state = 'walk'; e.plan = null; e.planCD = 0.8; } }
      return;
    case 'back': {   // para o esconderijo
      const d = P ? P.hx * T + T / 2 - ecx : 0;
      if (!P || Math.abs(d) < 4 || e.stateT <= 0) { e.state = 'hide'; e.hideT = 0; e.vx = 0; e.facing = P ? -P.D : e.facing; sfx.kb1Esconde(Math.max(0.3, kb1Near(e)) * 0.7); return; }
      walk(e, dt, Math.sign(d), 80, 900, 270, dy, false); e.facing = Math.sign(d) || e.facing;
      return;
    }
    case 'hide': {   // agachado na fresta, esperando
      e.vx = approach(e.vx, 0, 800 * dt); e.hideT += dt;
      if (dist < 1.6 * T) { kb1Sai(e); e.facing = Math.sign(dx) || e.facing; kb1Faca(e); return; }
      if (!P) { kb1Sai(e); return; }
      const intact = tileAt(P.tx, P.ty) === DG_FIO, wx = P.tx * T + T / 2;
      if (!intact && e.hideT > 0.4) { kb1Sai(e); e.planCD = 1.2; return; }                      // o fio rompeu (ou sumiu)
      if (intact && (pcx - wx) * P.D > 8) { kb1Sai(e); e.planCD = 0.1; return; }                // o herói passou por cima: arma outro mais à frente
      if (e.hideT > 10) kb1Sai(e);
      return;
    }
  }
  e.state = 'walk';
  if (aggro && e.planCD <= 0 && e.onGround && !pl.dead) {
    const D = Math.sign(ecx - pcx) || e.facing, S = kb1Sitio(D);
    if (S) { e.plan = S; e.state = 'run'; e.stateT = 4; sfx.kb1Grito(Math.max(0.3, kb1Near(e)) * 0.6, 1.3); return; }
    e.planCD = 1.2;
  }
  let mv = 0;
  if (aggro) mv = Math.abs(dx) > 14 ? Math.sign(dx) : 0; else { cvWander(e, dt); mv = e.wander; }
  walk(e, dt, mv, aggro ? 52 + e.lvl * 0.5 : 22, 700, 280, dy, aggro);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing);
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && Math.abs(dx) < 20 && Math.abs(dy) < 16 && clearPath(e, pl)) kb1Faca(e);
};

/* ---------- o Kobold Montado ---------- */
AI.kobmontado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (!e.kb1Pe && e.hp < e.maxHp * 0.4) { kb1Desmonta(e); return; }
  if (e.kb1Pe) { kb1Apeado(e, dt, dx, dy, dist, aggro); return; }
  if (e.state === 'lower') {   // a lança desce, o lagarto bufa
    e.vx = approach(e.vx, 0, 500 * dt);
    if (Math.random() < dt * 16) { const [x, y] = kb1R(e, KB1_LX + 19.4 - KB1_MX, -6.4); kb1Sparks(x, y, 1, KB1_VAPOR, 16, -40, 0.5); }
    if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 1.5; e.swingHit = false; e.vx = e.facing * KB1_CARGA_SP; sfx.kb1Grito(Math.max(0.4, kb1Near(e)), 0.9); }
    return;
  }
  if (e.state === 'charge') {
    e.vx = e.facing * KB1_CARGA_SP;
    const hb = { x: e.facing > 0 ? e.x + e.w - 6 : e.x - 14, y: e.y + 2, w: 20, h: e.h - 4 };
    if (!e.swingHit && !pl.dead && (overlap(hb, pl) || overlap(e, pl))) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { pl.vx = e.facing * 260; pl.vy = -170; pl.onGround = false; shake(3); kb1Sparks(pl.x + pl.w / 2, pl.y + 8, 7, ['#c83a2a', '#ffd050'], 70, 200, 0.4); }
      else if (r === 'block' || r === 'parry') { e.state = 'stagger'; e.stateT = r === 'parry' ? 1 : 0.6; e.vx = -e.facing * 40; return; }
    }
    e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.16; const v = kb1Near(e, 260); if (v > 0.05) sfx.kb1Galope(v); burst(ecx - e.facing * 8, e.y + e.h - 1, 2, '#7a6a4c', 30, 200, 0.4); }
    if (e.hitWall) { e.state = 'stagger'; e.stateT = 0.8; e.vx = -e.facing * 50; shake(2 * Math.max(0.3, kb1Near(e))); burst(ecx + e.facing * 12, e.y + e.h - 6, 10, '#7a6a4c', 70, 300, 0.5); sfx.kb1Tromba(Math.max(0.3, kb1Near(e))); return; }
    if (e.onGround && ledgeAhead(e, e.facing, dy, false) === 'stop') { e.state = 'stagger'; e.stateT = 0.5; e.vx = 0; return; }
    if (e.stateT <= 0) { e.state = 'stagger'; e.stateT = 0.45; }
    return;
  }
  if (e.state === 'stagger') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'patrol'; e.atkCD = Math.max(e.atkCD, 1.4 + Math.random() * 0.6); } return; }
  if (e.state === 'turn') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.facing = -e.facing; e.state = 'patrol'; } return; }
  // as passadas: de ponta a ponta do túnel, girando no fim (e quando o herói ficou para trás um tempo)
  e.state = 'patrol';
  const behind = aggro && Math.sign(dx) === -e.facing;
  e.behindT = behind ? (e.behindT || 0) + dt : 0;
  const r = walk(e, dt, e.facing, aggro ? 46 + e.lvl * 0.4 : 26, 260, 0, dy, false);
  if (r === 0 || (e.hitWall && e.onGround) || e.behindT > 1.4) { e.state = 'turn'; e.stateT = 0.35; e.behindT = 0; return; }
  e.stepT = (e.stepT || 0) - dt; if (e.onGround && Math.abs(e.vx) > 4 && e.stepT <= 0) { e.stepT = 0.45; const v = kb1Near(e, 220); if (v > 0.05) sfx.kb1Galope(v * 0.6); }
  e.snortT = (e.snortT ?? 3 + Math.random() * 4) - dt;
  if (e.snortT <= 0) { e.snortT = 4 + Math.random() * 4; const v = kb1Near(e, 200); if (v > 0.08) sfx.kb1Bufa(v * 0.5); }
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && Math.sign(dx) === e.facing && Math.abs(dy) < 2 * T && Math.abs(dx) > 2 * T && Math.abs(dx) < 12 * T && clearPath(e, pl)) {
    e.state = 'lower'; e.stateT = KB1_LANCA; e.vx = 0; sfx.kb1Bufa(Math.max(0.5, kb1Near(e)));
  }
};
// o lagarto cai morto: o corpo fica no chão, o kobold rola e a caixa fica do tamanho dele
function kb1Desmonta(e) {
  const cx = e.x + e.w / 2, by = e.y + e.h;
  kb1Corpos.push({ x: cx, y: by, f: e.facing, t: 0 }); if (kb1Corpos.length > 6) kb1Corpos.shift();
  burst(cx, by - 6, 18, '#8a3020', 100, 380, 0.7); burst(cx, by - 2, 10, '#7a6a4c', 60, 300, 0.6);
  e.w = 7; e.h = 13; e.x = cx - 3.5; e.y = by - 13; e.kb1Pe = true;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.state = 'tumble'; e.airT = 0; e.vy = -170; e.vx = -e.facing * 60; e.onGround = false; e.stun = 0;
  const v = Math.max(0.4, kb1Near(e, 260)); sfx.kb1Lagarto(v); sfx.kb1Grito(v, 1.5);
}
// a pé: foge do herói; encurralado, fura com o toco da lança
function kb1Apeado(e, dt, dx, dy, dist, aggro) {
  const ecx = e.x + e.w / 2;
  if (e.state === 'tumble') { e.airT = (e.airT || 0) + dt; e.vx = approach(e.vx, 0, 100 * dt); if ((e.onGround && e.airT > 0.15) || e.airT > 1.6) { e.state = 'flee'; e.vx = 0; } return; }
  if (e.state === 'stabW') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'stab'; e.stateT = 0.16; e.vx = e.facing * 100; e.swingHit = false; sfx.kb1Corte(Math.max(0.4, kb1Near(e))); } return; }
  if (e.state === 'stab') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 18, y: e.y + 2, w: 18, h: 9 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.stateT <= 0) { e.state = 'flee'; e.atkCD = 1.2 + Math.random() * 0.5; }
    return;
  }
  e.state = 'flee';
  const away = -(Math.sign(dx) || e.facing), r = walk(e, dt, aggro ? away : 0, 84, 800, 280, dy, false);
  const stuck = aggro && (r === 0 || e.hitWall);
  e.facing = stuck || !aggro ? (Math.sign(dx) || e.facing) : away;
  if (stuck && e.atkCD <= 0 && e.onGround && !pl.dead && dist < 2.2 * T && clearPath(e, pl)) { e.facing = Math.sign(dx) || e.facing; e.state = 'stabW'; e.stateT = KB1_FACA; e.vx = 0; sfx.kb1Grito(Math.max(0.4, kb1Near(e)), 1.2); }
}

/* ---------- golpes, mortes, nascimento ---------- */
// o escudo da falange: os golpes de frente batem nele e o vão rachando (55% da vida); quebrado, o golpe passa
BLOCK_E.kobfalange = e => !!e.kb1Bloq;
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (!e || e.dead || !KB1_TYPES.includes(e.type)) return _hit(e, dir, mult, melee);
  let quebra = false;
  if (e.type === 'kobfalange' && e.kb1Escudo && e.state !== 'flee' && e.stun <= 0.3 && dir === -e.facing && !(pl.y + pl.h <= e.y + 4)) {
    if (e.kb1EscHp === undefined) e.kb1EscHp = e.maxHp * 0.55;
    e.kb1EscHp -= rollPlayerDmg() * mult;
    if (e.kb1EscHp > 0) { e.kb1Bloq = true; const [x, y] = kb1R(e, 3.6, -7.2); kb1Sparks(x, y, 3, KB1_ESC, 40, 200, 0.3); }
    else quebra = true;
  }
  const r = _hit(e, dir, mult, melee);
  e.kb1Bloq = false;
  if (quebra) kb1Quebra(e);
  if (e.dead) return r;
  if (e.type === 'kobfunda' && e.state === 'spin' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  if (e.type === 'kobfundidor' && e.state === 'dip' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); }
  if (e.type === 'kobarmad' && (e.state === 'hide' || e.state === 'arm')) { kb1Sai(e); e.planCD = 1.5; }
  if (e.type === 'kobmontado' && !e.kb1Pe) {
    e.stun = e.state === 'charge' || e.state === 'lower' ? 0 : Math.min(e.stun, 0.15);
    if (e.hp < e.maxHp * 0.4) kb1Desmonta(e);
  }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!KB1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, kb1Near(e, 260));
  if (e.type === 'kobmontado' && !e.kb1Pe) { kb1Corpos.push({ x: cx, y: e.y + e.h, f: e.facing, t: 0 }); sfx.kb1Lagarto(v); }
  if (e.type === 'kobfundidor') kb1Sparks(cx - e.facing * 12, e.y + e.h - 9, 10, KB1_OURO, 40, 200, 0.7);   // o ouro do caldeirão espirra
  kb1Sparks(cx, cy, 6, KB1_ESC, 50, 200, 0.6);
  sfx.kb1Morre(v);
  kb1Desarma(e);
  return r;
}; }
// os fios de um kobold que morreu (ou sumiu) somem com ele
function kb1Desarma(e) {
  for (let i = kb1Fios.length - 1; i >= 0; i--) { const w = kb1Fios[i]; if (w.o !== e) continue; if (tileAt(w.x, w.y) === DG_FIO) setTile(w.x, w.y, AIR); kb1Fios.splice(i, 1); }
}
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !KB1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.state = type === 'kobmontado' ? 'patrol' : 'walk';
  if (type === 'kobfalange') {
    e.kb1Escudo = true;
    if (!kb1Agrupando) {   // a fila: mais dois atrás deste, olhando para o mesmo lado
      const G = { m: [e], dir: e.facing, broken: false, cd: 1.2 + Math.random() }; kb1Grupos.push(G); e.grp = G;
      kb1Agrupando = true;
      try {
        for (let j = 1; j <= 2; j++) {
          let made = null;
          for (const side of [1, -1]) {
            const x = e.x - side * j * KB1_PASSO * e.facing;
            if (rectSolid(x, e.y, e.w, e.h) || !rectSolid(x, e.y + e.h, e.w, 4 * T)) continue;
            made = spawnEnemy('kobfalange', x, e.y, zone); if (made) break;
          }
          if (made && !made.dead) { made.grp = G; made.facing = e.facing; G.m.push(made); }
        }
      } finally { kb1Agrupando = false; }
    }
  }
  return e;
}; }

/* ---------- a cada quadro: as pedras, o ouro, as poças, os corpos, os fios ---------- */
function kb1Update(dt) {
  for (let i = kb1Grupos.length - 1; i >= 0; i--) { const G = kb1Grupos[i]; G.m = G.m.filter(kb1Live); if (!G.m.length) kb1Grupos.splice(i, 1); }
  const pcx = pl.x + pl.w / 2;
  const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
  const perto = (x, y, r = 240) => clamp(1 - Math.hypot(pl.x - x, pl.y - y) / r, 0, 1);
  // a pedra de obsidiana: quica uma vez (no chão ou na parede) e se parte na segunda
  for (let i = kb1Pedras.length - 1; i >= 0; i--) {
    const S = kb1Pedras[i]; S.life -= dt; S.a += dt * 14;
    S.vy = Math.min(S.vy + KB1_PEDRA_G * dt, 420);
    const nx = S.x + S.vx * dt, ny = S.y + S.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) {
      if (S.b >= 1 || Math.hypot(S.vx, S.vy) < 60) { kb1Sparks(S.x, S.y, 7, KB1_OBS, 50, 300, 0.4); const v = perto(S.x, S.y); if (v > 0.05) sfx.kb1Estilhaca(v); kb1Pedras.splice(i, 1); continue; }
      S.b++;
      const wx = solidAt(Math.floor(nx / T), Math.floor(S.y / T)), wy = solidAt(Math.floor(S.x / T), Math.floor(ny / T));
      if (wx) S.vx *= -0.6; if (wy) S.vy *= -0.55; if (!wx && !wy) { S.vx *= -0.6; S.vy *= -0.55; }
      kb1Sparks(S.x, S.y, 3, KB1_OBS, 30, 200, 0.3);
      const v = perto(S.x, S.y); if (v > 0.05) sfx.kb1Quica(v);
      continue;
    }
    S.x = nx; S.y = ny;
    if (hitsHero(S.x, S.y, 2)) {
      const r = hurtPlayer(S.dmg, pcx - Math.sign(S.vx || 1) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) { kb1Sparks(S.x, S.y, 5, KB1_OBS, 50, 200, 0.4); kb1Pedras.splice(i, 1); continue; }
    }
    if (S.life <= 0) kb1Pedras.splice(i, 1);
  }
  // o ouro jogado: um arco pingando; onde cai vira poça
  for (let i = kb1Ouros.length - 1; i >= 0; i--) {
    const G = kb1Ouros[i]; G.t += dt; G.vy = Math.min(G.vy + KB1_OURO_G * dt, 460);
    if (Math.random() < dt * 30) kb1P({ x: G.x + rnd(-1, 1), y: G.y, vx: rnd(-8, 8), vy: 10, g: 300, life: 0.35, max: 0.35, col: KB1_OURO[(Math.random() * 3) | 0], size: 1 });
    if (hitsHero(G.x, G.y, 3)) {
      hurtPlayer(G.dmg, pcx - Math.sign(G.vx || 1) * 10, null, true);
      const top = kb1Chao(pcx, pl.y + pl.h - 2); if (top !== null) kb1Poca(pcx, top);
      kb1Sparks(G.x, G.y, 8, KB1_OURO, 60, 200, 0.5); sfx.kb1Chia(0.8); kb1Ouros.splice(i, 1); continue;
    }
    const nx = G.x + G.vx * dt, ny = G.y + G.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) {
      if (G.vy < 0 && solidAt(Math.floor(G.x / T), Math.floor(ny / T))) { G.vy = 20; continue; }   // bateu no teto: cai
      const wall = solidAt(Math.floor(nx / T), Math.floor(G.y / T)) && !solidAt(Math.floor(G.x / T), Math.floor(ny / T));
      const top = wall ? kb1Chao(G.x, G.y) : kb1Chao(nx, ny);
      if (top !== null) kb1Poca(wall ? G.x : nx, top);
      kb1Sparks(G.x, G.y, 9, KB1_OURO, 60, 260, 0.5);
      const v = perto(G.x, G.y, 260); if (v > 0.03) sfx.kb1Chia(v);
      kb1Ouros.splice(i, 1); continue;
    }
    G.x = nx; G.y = ny;
    if (G.t > 4) kb1Ouros.splice(i, 1);
  }
  // as poças: brilham e endurecem; quem está em pé nelas nessa hora fica de pés presos
  for (let i = kb1Pocas.length - 1; i >= 0; i--) {
    const P = kb1Pocas[i]; P.t += dt;
    if (!P.hard && P.t >= KB1_POCA_T) {
      P.hard = true;
      const v = perto(P.x, P.y, 260); if (v > 0.03) sfx.kb1Endurece(v);
      const fy = pl.y + pl.h;
      if (!pl.dead && P.cols.some(c => c.x + 2 > pl.x && c.x < pl.x + pl.w && Math.abs(fy - c.y) <= 3)) { dgPrender(1); kb1Sparks(pcx, fy - 1, 8, KB1_OURO, 40, 100, 0.5); }
    }
    if (!P.hard && Math.random() < dt * 4) { const c = P.cols[(Math.random() * P.cols.length) | 0]; kb1P({ x: c.x + 1, y: c.y - 2, vx: rnd(-6, 6), vy: -rnd(10, 30), g: 120, life: 0.4, max: 0.4, col: '#fff0a0', size: 1 }); }
    if (P.t > KB1_POCA_T + 2.5) kb1Pocas.splice(i, 1);
  }
  for (let i = kb1Corpos.length - 1; i >= 0; i--) { kb1Corpos[i].t += dt; if (kb1Corpos[i].t > 4) kb1Corpos.splice(i, 1); }
  // os fios: some da lista o que já rompeu; os de quem sumiu (morto ou longe) somem do mundo
  for (let i = kb1Fios.length - 1; i >= 0; i--) {
    const w = kb1Fios[i];
    if (tileAt(w.x, w.y) !== DG_FIO) { kb1Fios.splice(i, 1); continue; }
    if (w.o.dead) { setTile(w.x, w.y, AIR); kb1Fios.splice(i, 1); }
  }
}
HOOK.update.push(kb1Update);
function clearKb1Fx() { kb1Fx.length = 0; kb1Pedras.length = 0; kb1Ouros.length = 0; kb1Pocas.length = 0; kb1Corpos.length = 0; kb1Grupos.length = 0; kb1Fios.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearKb1Fx(); kb1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: o caldeirão, as pontas acesas, o ouro voando e as poças
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !KB1_TYPES.includes(e.type)) continue;
    if (e.type === 'kobfundidor') { const [x, y] = kb1R(e, KB1_CALD, -9); addL(x, y, e.state === 'dip' ? 0.5 : 0.36); }
    else if (WARN_E[e.type](e)) addL(e.x + e.w / 2, e.y + e.h / 2, 0.3);
  }
  for (const G of kb1Ouros) addL(G.x, G.y, 0.45);
  for (const P of kb1Pocas) if (!P.hard) addL(P.x, P.y - 4, 0.5 * (1 - P.t / KB1_POCA_T * 0.6));
}; }

/* ---------- os efeitos na tela ---------- */
const kb1Fora = (x, y, cx, cy, m = 40) => x - cx < -m || x - cx > VW + m || y - cy < -m || y - cy > VH + m;
// a luz aditiva: o ouro voando, as poças derretidas, o caldeirão
HOOK.drawGlow.push((cx, cy) => {
  const G = KB1.GL;
  for (const g of kb1Ouros) { lc.globalAlpha = 0.6; lc.drawImage(G.ouroG, Math.round(g.x - cx) - 12, Math.round(g.y - cy) - 12); }
  for (const P of kb1Pocas) {
    if (P.hard || kb1Fora(P.x, P.y, cx, cy)) continue;
    const q = P.t / KB1_POCA_T, fl = q > 0.75 ? 0.75 + 0.25 * Math.sin(gameTime * 30) : 1;
    lc.globalAlpha = 0.32 * (1 - q * 0.6) * fl;
    for (let j = 1; j < P.cols.length; j += 3) { const c = P.cols[j]; if (Math.abs(c.x - P.x) <= KB1_POCA_W * Math.min(1, P.t / 0.18)) lc.drawImage(G.ouro, Math.round(c.x - cx) - 6, Math.round(c.y - cy) - 7); }
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'kobfundidor' || kb1Fora(e.x, e.y, cx, cy)) continue;
    const [x, y] = kb1R(e, KB1_CALD, -10); lc.globalAlpha = (e.state === 'dip' ? 0.55 : 0.32) + 0.06 * Math.sin(e.t * 5 + e.seed); lc.drawImage(G.brasa, Math.round(x - cx) - 8, Math.round(y - cy) - 8);
  }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): as pedras girando, as gotas de ouro, as poças, o lagarto morto
HOOK.drawWorld.push((cx, cy) => {
  for (const S of kb1Pedras) {
    const x = Math.round(S.x - cx), y = Math.round(S.y - cy), k = Math.floor(S.a) & 1;
    lc.fillStyle = '#1a0c08'; lc.fillRect(x - 1, y - 1, 3, 3);
    lc.fillStyle = '#4a2014'; lc.fillRect(x - 1 + k, y - 1, 2, 2); lc.fillStyle = '#c87a52'; lc.fillRect(x - 1 + k, y - 1 + k, 1, 1);
  }
  for (const G of kb1Ouros) {
    const x = Math.round(G.x - cx), y = Math.round(G.y - cy);
    lc.fillStyle = '#7a5410'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#f0cc5a'; lc.fillRect(x - 1, y - 1, 2, 2); lc.fillStyle = '#fff0a0'; lc.fillRect(x - 1, y - 1, 1, 1);
    lc.fillStyle = '#d8a830'; lc.fillRect(Math.round(x - G.vx * 0.02), Math.round(y - G.vy * 0.02), 1, 1);
  }
  for (const P of kb1Pocas) {
    if (kb1Fora(P.x, P.y, cx, cy)) continue;
    const sp = Math.min(1, P.t / 0.18), q = Math.min(1, P.t / KB1_POCA_T), fade = P.hard ? clamp(1 - (P.t - KB1_POCA_T - 1.7) / 0.8, 0, 1) : 1;
    lc.globalAlpha = fade;
    for (const c of P.cols) {
      const ox = c.x - P.x; if (Math.abs(ox) > KB1_POCA_W * sp) continue;
      const edge = 1 - Math.abs(ox + 1) / KB1_POCA_W, th = edge > 0.6 ? 3 : edge > 0.25 ? 2 : 1, x = Math.round(c.x - cx), y = Math.round(c.y - cy);
      let top, low;
      if (!P.hard) {
        const w = Math.sin(gameTime * 7 + c.x * 0.7 + P.seed), crust = c.h < (q - 0.5) * 2;   // a crosta vai tomando a poça
        top = crust ? (w > 0.6 ? '#d8a830' : '#a87808') : w > 0.45 ? '#fff0a0' : '#f0cc5a'; low = crust ? '#7a5410' : '#d8a830';
      } else { top = c.h < 0.25 ? '#d8a830' : '#a87808'; low = '#7a5410'; }
      lc.fillStyle = '#4a3008'; lc.fillRect(x, y - th - 1, 2, 1);
      lc.fillStyle = top; lc.fillRect(x, y - th, 2, 1);
      if (th > 1) { lc.fillStyle = low; lc.fillRect(x, y - th + 1, 2, th - 1); }
    }
  }
  lc.globalAlpha = 1;
  const M = kb1Corpos.length ? KB1.get().morto : null;
  for (const C of kb1Corpos) {
    if (kb1Fora(C.x, C.y, cx, cy, 60)) continue;
    const img = C.f > 0 ? M.r : M.l, x = Math.round(C.x - cx), y = Math.round(C.y - cy);
    lc.globalAlpha = C.t > 3 ? Math.max(0, 4 - C.t) : 1;
    lc.drawImage(img, C.f > 0 ? x - (KB1_MX + 1) : x - (img.width - KB1_MX - 1), y - (KB1_MFY + 2));
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: a funda girando (o círculo e a pedra), as pontas piscando, a concha acesa, a faca
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead || !KB1_TYPES.includes(e.type)) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -60 || fx > VW + 60 || fy < -60 || fy > VH + 60) continue;
    if (e.type === 'kobfunda' && e.state === 'spin') {
      // o círculo da funda sobre a cabeça (achatado), a pedra girando com um rastro
      const h = KB1_FU[3].hn, q = clamp(1 - e.stateT / KB1_GIRO, 0, 1), ox = fx + (h[0] + 0.6) * e.facing, oy = fy - 1 + h[1] - 2.5, rx = 5.5, ry = 2;
      lc.globalAlpha = 0.25 + 0.35 * q; lc.fillStyle = '#ccbc9a';
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; lc.fillRect(Math.round(ox + Math.cos(a) * rx), Math.round(oy + Math.sin(a) * ry), 1, 1); }
      const a = e.giro || 0;
      for (let j = 3; j >= 0; j--) { const b = a - j * 0.35; lc.globalAlpha = j ? (0.6 - j * 0.15) * (0.5 + q * 0.5) : 1; lc.fillStyle = j ? '#ffa020' : '#fff0a0'; lc.fillRect(Math.round(ox + Math.cos(b) * rx), Math.round(oy + Math.sin(b) * ry), 1, 1); }
      lc.globalAlpha = 0.8; lc.fillStyle = '#ccbc9a'; lc.fillRect(Math.round(ox + Math.cos(a) * rx * 0.5), Math.round(oy + Math.sin(a) * ry * 0.5), 1, 1);
      lc.globalAlpha = 1;
    } else if (e.type === 'kobfalange' && (e.state === 'tap' || e.state === 'thrust')) {
      const o = KB1_FA[kb1FaPose(e)], [px, py] = kb1Ponta(o), x = Math.round(fx + px * e.facing), y = Math.round(fy - 1 + py);
      lc.fillStyle = e.tapFx > 0 || Math.floor(now * 14) % 2 ? '#fff0a0' : '#ffa020'; lc.fillRect(x, y, 1, 1);
      if (e.tapFx > 0) { lc.fillStyle = '#ffd050'; lc.fillRect(x - 1, y, 1, 1); lc.fillRect(x + 1, y, 1, 1); lc.fillRect(x, y - 1, 1, 1); lc.fillRect(x, y + 1, 1, 1); }
    } else if (e.type === 'kobfundidor' && (e.state === 'dip' || e.state === 'lob')) {
      const o = KB1_FD[kb1FdPose(e)], [px, py] = kb1Concha(o), x = Math.round(fx + px * e.facing), y = Math.round(fy - 1 + py);
      lc.fillStyle = Math.floor(now * 12) % 2 ? '#fff0a0' : '#f0cc5a'; lc.fillRect(x - 1, y - 1, 2, 1);
    } else if (e.type === 'kobarmad' && e.state === 'stabW') {
      const o = KB1_AR[5], x = Math.round(fx + (o.hn[0] + Math.cos(o.ka) * 3) * e.facing), y = Math.round(fy - 1 + o.hn[1] + Math.sin(o.ka) * 3);
      lc.fillStyle = Math.floor(now * 16) % 2 ? '#fff0a0' : '#ffa020'; lc.fillRect(x, y, 1, 1);
    } else if (e.type === 'kobmontado' && !e.kb1Pe && (e.state === 'lower' || e.state === 'charge')) {
      const [px, py] = kb1MPonta(KB1_MO[kb1MoPose(e)]), x = Math.round(fx + (px - KB1_MX) * e.facing), y = Math.round(fy - 1 + py - KB1_MFY);
      lc.fillStyle = Math.floor(now * 14) % 2 ? '#fff0a0' : '#ffa020'; lc.fillRect(x, y, 1, 1);
    }
  }
  lc.globalAlpha = 1;
  // as poças: bolhinhas estourando no ouro derretido
  for (const P of kb1Pocas) {
    if (P.hard || kb1Fora(P.x, P.y, cx, cy)) continue;
    for (let j = 0; j < P.cols.length; j += 4) {
      const c = P.cols[j], ph = (now * 1.6 + c.h * 7 + P.seed) % 1;
      if (ph > 0.25 || Math.abs(c.x - P.x) > KB1_POCA_W * Math.min(1, P.t / 0.18)) continue;
      lc.globalAlpha = 1 - ph * 4; lc.fillStyle = '#fff0a0'; lc.fillRect(Math.round(c.x - cx), Math.round(c.y - cy) - 3 - Math.round(ph * 8), 1, 1);
    }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  // a falange: a lança batendo seco no escudo (n: qual das duas), a estocada, a marcha, o escudo rachando
  kb1Bate(v = 1, n = 1) { noise(0.05, 0.1 * v, 1700 + n * 300, 'bandpass', 0, 3); tone(480 + n * 90, 0.06, 'square', 0.014 * v, -220); tone(1500 + n * 200, 0.04, 'triangle', 0.01 * v, 0, 0.01); },
  kb1Estoca(v = 1) { noise(0.14, 0.08 * v, 2400, 'bandpass', 0, 1.4); tone(300, 0.12, 'sawtooth', 0.02 * v, -120); },
  kb1Marcha(v = 1) { noise(0.05, 0.03 * v, 500, 'lowpass'); noise(0.04, 0.02 * v, 1400, 'bandpass', 0.06, 3); },
  kb1Racha(v = 1) { noise(0.25, 0.12 * v, 900, 'bandpass', 0, 1.2); for (let k = 0; k < 4; k++) noise(0.04, 0.05 * v, 2000 + k * 400, 'bandpass', 0.03 + k * 0.04, 4); tone(180, 0.2, 'square', 0.02 * v, -80); },
  // o guincho de kobold (p: o tom)
  kb1Grito(v = 1, p = 1) { tone(900 * p, 0.1, 'square', 0.011 * v, 500 * p); tone(1300 * p, 0.08, 'square', 0.007 * v, -300 * p, 0.09); },
  // a funda: o assobio subindo enquanto gira, o estalo da soltura, a pedra quicando e se partindo
  kb1Assobio(v = 1, d = KB1_GIRO) { tone(420, d, 'sine', 0.014 * v, 1100); tone(840, d, 'sine', 0.004 * v, 2200); for (let k = 0; k < 6; k++) noise(0.05, 0.02 * v * (0.5 + k * 0.1), 1200 + k * 260, 'bandpass', k * d / 6, 3); },
  kb1Funda(v = 1) { noise(0.1, 0.07 * v, 3000, 'bandpass', 0, 1.5); tone(1500, 0.1, 'sine', 0.012 * v, -900); },
  kb1Quica(v = 1) { tone(1200, 0.05, 'square', 0.02 * v, -400); noise(0.04, 0.05 * v, 3600, 'highpass'); },
  kb1Estilhaca(v = 1) { noise(0.12, 0.06 * v, 4200, 'highpass'); for (let k = 0; k < 3; k++) tone(2400 + Math.random() * 1200, 0.04, 'sine', 0.01 * v, 0, k * 0.03); },
  // o fundidor: o ouro borbulhando na concha, o arremesso, o chiado onde cai, o estalo do ouro endurecendo, o trenó
  kb1Concha(v = 1) { for (let k = 0; k < 6; k++) tone(140 + Math.random() * 80, 0.08, 'sine', 0.02 * v, 60, k * 0.12); noise(0.7, 0.02 * v, 400, 'lowpass'); tone(600, 0.7, 'triangle', 0.004 * v, 400); },
  kb1Joga(v = 1) { noise(0.18, 0.05 * v, 900, 'bandpass', 0, 1); tone(220, 0.15, 'sine', 0.02 * v, 120); },
  kb1Chia(v = 1) { noise(0.5, 0.05 * v, 5200, 'highpass'); noise(0.2, 0.05 * v, 700, 'lowpass'); },
  kb1Endurece(v = 1) { for (let k = 0; k < 4; k++) noise(0.03, 0.05 * v, 2600 + k * 500, 'bandpass', k * 0.035, 5); tone(900, 0.08, 'triangle', 0.012 * v, -300); },
  kb1Arrasta(v = 1) { noise(0.25, 0.025 * v, 500, 'bandpass', 0, 2); tone(70, 0.2, 'sine', 0.01 * v, -10); },
  // o armadilheiro: o fio de cobre esticando, o farfalhar de se esconder, a faca, o corte
  kb1Fio(v = 1) { tone(1800, 0.25, 'triangle', 0.012 * v, -200); tone(2700, 0.18, 'sine', 0.006 * v, -300, 0.02); },
  kb1Esconde(v = 1) { noise(0.15, 0.03 * v, 700, 'bandpass', 0, 1); },
  kb1Faca(v = 1) { tone(2600, 0.12, 'sine', 0.008 * v, 600); noise(0.08, 0.02 * v, 5000, 'highpass'); },
  kb1Corte(v = 1) { noise(0.1, 0.07 * v, 3000, 'bandpass', 0, 1.2); },
  // o montado: o lagarto bufando, as patadas, a trombada na parede, o lagarto morrendo
  kb1Bufa(v = 1) { noise(0.35, 0.09 * v, 600, 'bandpass', 0, 0.8); noise(0.25, 0.06 * v, 400, 'lowpass', 0.3); tone(90, 0.3, 'sawtooth', 0.02 * v, -30); },
  kb1Galope(v = 1) { tone(70, 0.08, 'sine', 0.06 * v, -20); noise(0.06, 0.04 * v, 300, 'lowpass'); },
  kb1Tromba(v = 1) { tone(55, 0.3, 'sine', 0.1 * v, -20); noise(0.3, 0.1 * v, 300, 'lowpass'); },
  kb1Lagarto(v = 1) { tone(160, 0.5, 'sawtooth', 0.025 * v, -100); noise(0.5, 0.05 * v, 500, 'bandpass', 0, 1); },
  kb1Morre(v = 1) { tone(1100, 0.25, 'square', 0.01 * v, -700); noise(0.15, 0.03 * v, 1500, 'bandpass', 0, 1); }
});

/* ---------- as faíscas acesas (com o brilho da cor delas) ---------- */
const kb1Fx = [], kb1FxGl = {};
function kb1P(o) { if (kb1Fx.length < 360) kb1Fx.push(o); }
HOOK.update.push(dt => {
  for (let i = kb1Fx.length - 1; i >= 0; i--) { const p = kb1Fx[i]; p.life -= dt; if (p.life <= 0) { kb1Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of kb1Fx) { const g = kb1FxGl[p.col] || (kb1FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.45; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of kb1Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
