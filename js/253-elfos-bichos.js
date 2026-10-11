'use strict';

/* ================= o Reino Élfico: os guardiões, parte um =================
   Cinco dos dez bichos da décima primeira camada (docs/camadas/11-reino-elfico.md, seção 6; os outros cinco estão no
   254). Os do Reino são altos e finos, de prata, azul-lua, branco e o verde-folha dos mantos; os avisos acendem em
   prata e azul.
   - a Sentinela da Lua (sentinela), a guerreira de capuz azul e armadura de prata com o glaive de três lâminas; rápida.
     O glaive acende azul na mão (0,5 s) e vem o corte duplo; depois ela salta para trás. De 4 a 9 blocos, o glaive
     acende atrás do ombro (0,5 s) e ela o arremessa: ele vai girando em linha e volta para a mão (acerta na ida e na
     volta, uma vez cada);
   - o Arqueiro da Mata (arqueiro), de cabelo de prata solto e manto verde-prata; prefere ficar no alto (flets,
     pontes, degraus) e a uns 9 blocos. Puxa a corda e a ponta da flecha brilha (0,7 s): três flechas em leque, em
     arco. Quando o herói chega perto, salta para trás e para cima;
   - o Sabre-da-Noite (sabre), a pantera violeta-escura de presas longas e a meia-lua de prata na testa; espreita
     invisível (só um tremor no ar). Reaparece agachado, os olhos acendem (0,5 s), e vem o bote longo em arco; depois
     some de novo. Um golpe enquanto espreita o mostra por um instante;
   - o Fogo-Fátuo (fatuo), luzinhas azul-prata em grupos de 3 a 5 (el1Grupo) que giram em volta do herói. O grupo para
     e as luzes incham (0,6 s); cada uma se lança e detona por toque (`touch`, o único daqui) e suga 6 de mana. A que
     erra estoura sozinha, sem dano;
   - o Antigo da Mata (antigo), a árvore viva de casca prateada, copa azul-prata e olhos de seiva azul; lento. Bate o
     pé (0,45 s) e uma rachadura corre pelo chão até onde o herói estava (0,55 s): raízes rompem ali (dano e
     elEnraizar 1,2 s, do 250; o 259 prende os pés). Perto, ergue o galho (0,55 s) e o tapa joga o herói longe.
   O 255 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache),
   rampas de 6 tons com luz de cima à esquerda; brilhos pelo HOOK.drawGlow e EYES_E, os pontinhos acesos por cima do
   escuro (HOOK.drawTop). Materiais e bases do 257 (filtrados). Prefixo el1. */

/* ---------- números ---------- */
Object.assign(ET, {
  sentinela: { name: 'Sentinela da Lua', w: 9, h: 22, hp: 90, dmg: 20, xp: 30, kb: 0.75, fly: false, blood: '#b83a48' },
  arqueiro: { name: 'Arqueiro da Mata', w: 8, h: 22, hp: 70, dmg: 22, xp: 28, kb: 0.9, fly: false, blood: '#b83a48' },
  sabre: { name: 'Sabre-da-Noite', w: 20, h: 11, hp: 140, dmg: 26, xp: 38, kb: 0.45, fly: false, blood: '#8a2a4a' },
  fatuo: { name: 'Fogo-Fátuo', w: 6, h: 6, hp: 26, dmg: 10, xp: 9, kb: 1.2, fly: true, touch: 1, blood: '#c8e4ff' },   // touch: só no bote (atkCD segura o resto)
  antigo: { name: 'Antigo da Mata', w: 16, h: 30, hp: 320, dmg: 32, xp: 52, kb: 0.12, fly: false, blood: '#5a92c8' }
});
const EL1_TYPES = ['sentinela', 'arqueiro', 'sabre', 'fatuo', 'antigo'];
// materiais e bases do 257; filtradas agora e de novo a cada mundo
const EL1_DROPS = {
  sentinela: [['folha_prata', 0.4], ['min_lunarita', 0.08], ['pocao', 0.07], ['glaive_lunar', 0.015], ['elmo_alado', 0.01]],
  arqueiro: [['folha_prata', 0.3], ['min_lunarita', 0.08], ['pocao', 0.08]],
  sabre: [['presa_sabre', 0.55, 1, 2], ['min_lunarita', 0.08], ['pocao', 0.08]],
  fatuo: [['essencia_fatua', 0.4], ['min_lunarita', 0.04], ['pocao', 0.04]],
  antigo: [['folha_prata', 0.6, 1, 3], ['min_lunarita', 0.12], ['pocao', 0.1]]
};
function el1Tables() { for (const k of EL1_TYPES) DROPS[k] = EL1_DROPS[k].filter(([id]) => ITEMS[id]); }
el1Tables();
Object.assign(NAV_WALKERS, { sentinela: 1, arqueiro: 1, sabre: 1, antigo: 1 });
Object.assign(CV_STEP, { sentinela: 1, arqueiro: 1, sabre: 1, antigo: 1 });

const EL1_GLAIVE = 0.5, EL1_TIRO = 0.5, EL1_CORDA = 0.7, EL1_OLHOS = 0.5, EL1_INCHA = 0.6, EL1_PE = 0.45, EL1_RACHA = 0.55, EL1_GALHO = 0.55;
const EL1_GL_SP = 230, EL1_GL_MAX = 9.5 * T;      // o glaive arremessado: velocidade e alcance
const EL1_ARCO_SP = 250, EL1_ARCO_G = 360;        // a flecha: velocidade e a gravidade dela
const EL1_LONGE = 9 * T;                           // a distância do arqueiro
const EL1_RAIZ_W = 13, EL1_RAIZ_H = 26;           // a área das raízes (meia-largura, altura) em px

/* ---------- as poses (no desenho de 26 x 28 de frente para a direita, o corpo no x 11, os pés na linha 27) ----------
   low: o corpo desce; lean: o tronco vai para a frente; b/f: o pé de trás e o da frente; hn/hf: a mão de perto e a de
   longe; cl: quanto o manto voa; g: o ângulo do glaive na mão (null: está voando) */
const EL1_BX = 11;
const EL1_SN = [
  { low: 0, lean: 0, b: [9.2, 27], f: [13.4, 27], hn: [16.2, 16.6], hf: [8.4, 15.8], cl: 0.6, g: 0.5 },          // 0 parada
  { low: 0.5, lean: 0.5, b: [7.2, 27], f: [15.2, 27], hn: [16.4, 15.8], hf: [9.8, 15.8], cl: 1.8, g: 0.3 },        // 1-2 andando
  { low: 0, lean: 0.5, b: [13.2, 27], f: [9.4, 26.6], hn: [15.8, 16.6], hf: [7.6, 15], cl: 1.4, g: 0.8 },
  { low: 1, lean: -0.6, b: [7.4, 27], f: [15.2, 27], hn: [7.4, 4.8], hf: [15.6, 11.4], cl: 1, g: -0.4 },        // 3 o aviso: erguido atrás, aceso
  { low: 1.5, lean: 1.5, b: [6.4, 27], f: [16.6, 27], hn: [19.8, 15], hf: [6.2, 12.4], cl: 2.6, g: 1.2 },        // 4 o primeiro corte, para baixo
  { low: 0.6, lean: 1, b: [7.2, 27], f: [15.8, 27], hn: [19, 6.8], hf: [6.8, 14.2], cl: 2.2, g: -1 },           // 5 o segundo, para cima
  { low: 0.8, lean: -1, b: [7.6, 27], f: [14.8, 27], hn: [4.8, 9.6], hf: [15.8, 10.2], cl: 1, g: 0 },            // 6 o arremesso: para trás
  { low: 0.4, lean: 1.3, b: [7.4, 27], f: [15.6, 27], hn: [19.6, 9.8], hf: [6.4, 13.6], cl: 2, g: null },        // 7 soltou
  { low: 0, lean: 0.2, b: [9.2, 27], f: [13.4, 27], hn: [16, 11.8], hf: [8.4, 15.8], cl: 0.6, g: null },         // 8 a mão aberta esperando
  { low: 0, lean: -0.4, b: [7.8, 24.2], f: [14.4, 25.4], hn: [14.6, 11.8], hf: [7.4, 12.2], cl: 3, g: 0.2, air: 1 }   // 9 o salto para trás
];
// o arqueiro: bow = [x, y, inclinação] da empunhadura (na mão de longe); hn a mão da corda; pull: a corda puxada
const EL1_AR = [
  { low: 0, lean: 0, b: [9.2, 27], f: [13.4, 27], bow: [16.2, 15.4, 0.12], hn: [8.8, 15.6], cl: 0.6 },                // 0 parado
  { low: 0.5, lean: 0.4, b: [7.2, 27], f: [15.2, 27], bow: [16.4, 15, 0.2], hn: [9.6, 15.6], cl: 1.8 },          // 1-2 andando
  { low: 0, lean: 0.4, b: [13.2, 27], f: [9.4, 26.6], bow: [16, 15.6, 0.06], hn: [8, 15], cl: 1.4 },
  { low: 0.4, lean: -0.2, b: [8, 27], f: [15, 27], bow: [18, 10.6, 0], hn: [11.6, 9.2], cl: 0.8, pull: 1 },          // 3 a corda puxada
  { low: 0.4, lean: 0, b: [8, 27], f: [15, 27], bow: [18, 10.6, 0], hn: [8.6, 8.4], cl: 0.8 },                       // 4 soltou
  { low: 0, lean: -0.3, b: [7.8, 24.2], f: [14.4, 25.4], bow: [16.6, 11.6, 0.2], hn: [8.6, 12.4], cl: 3, air: 1 }     // 5 o salto
];
// a ponta da flecha na pose 3 (onde ela brilha e de onde sai)
const EL1_PONTA = [20.4, 10.4];

/* ================= arte ================= */
const EL1 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const ER = {
  pele: R6(['#3c2c30', '#6e5458', '#a8868a', '#d0b2ac', '#ead6cc', '#fbf0e8']),       // a pele clara dos elfos
  prata: R6(['#161c2c', '#323c56', '#58668a', '#8a9abc', '#c2d0e8', '#f2f8ff']),      // a armadura
  lua: R6(['#0a1430', '#142a5c', '#22468e', '#3466b8', '#5a8ede', '#9cc0f4']),        // o azul-lua do pano
  folha: R6(['#081816', '#123030', '#1e4a48', '#2e6a64', '#4a8e84', '#7ab8a8']),      // o verde-folha dos mantos
  cabelo: R6(['#40485a', '#687284', '#949eb0', '#bcc6d4', '#dfe5ee', '#ffffff']),     // cabelo de prata
  couro: R6(['#24180e', '#3e2a18', '#5e4226', '#806038', '#a6844e', '#ccac70']),      // couro e madeira clara
  arco: R6(['#2e2a26', '#4c4640', '#746c62', '#a09688', '#cac0b0', '#eee8dc']),       // a madeira prateada do arco
  casca: R6(['#141a22', '#262e3a', '#3e4856', '#5e6a78', '#86929e', '#b4c0ca']),      // a casca do Antigo
  copa: R6(['#101a2e', '#1e304c', '#30496c', '#4a6890', '#7690b8', '#b6cce4']),       // as folhas azul-prata
  seiva: R6(['#06204a', '#0c3a80', '#1a62c0', '#3a92f0', '#86c4ff', '#e0f4ff']),      // a seiva acesa
  sabre: R6(['#0c0818', '#18122c', '#271e42', '#382c5c', '#4e3e7a', '#6a58a0']),      // o pelo violeta-escuro
  ventre: R6(['#2a2238', '#443a58', '#62587a', '#857c9c', '#aaa2bc', '#d0cadc']),
  osso: R6(['#5a5448', '#8a8270', '#b4ac98', '#d8d0bc', '#efe8d8', '#ffffff']),       // as presas
  fatuo: R6(['#1a3a6a', '#3a6aa8', '#6a9ad8', '#a6c8f0', '#d8ecff', '#ffffff']),
  olho: R6(['#1a3a6a', '#2a5ea0', '#4a8ad0', '#7ab4f0', '#b8dcff', '#ffffff'])         // os olhos de luar
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
// um tubo afinando: braços, pernas, galhos
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
// a perna fina: coxa, joelho um pouco à frente, a canela (bota ou grevas) e o pé apontando para a frente
function perna(P, hx, hy, fx, fy, R, Rb, base, s, air) {
  const kx = (hx + fx) / 2 + (air ? 2.4 : 0.9), ky = (hy + fy) / 2 - (air ? 1 : 0);
  tubo(P, hx, hy, kx, ky, 1.25, 1, R, base, s);
  tubo(P, kx, ky, fx, fy - 1.2, 1, 0.8, Rb, base + 0.2, s + 1);
  P.line(fx - 0.6, fy, fx + 1.8, fy, Rb, base - 0.5); P.put(fx + 1.8, fy - 0.2, Rb, base + 0.6);
}
// o braço: ombro, cotovelo caindo um pouco, a mão
function braco(P, sx, sy, hx, hy, R, Rm, base, s) {
  const ex = (sx + hx) / 2 - 0.4, ey = (sy + hy) / 2 + 1.2;
  tubo(P, sx, sy, ex, ey, 1, 0.9, R, base, s); tubo(P, ex, ey, hx, hy, 0.9, 0.75, Rm || R, base + 0.2, s + 1);
  P.put(hx, hy, ER.pele, base + 0.8);
}
// o manto: do ombro até abaixo do joelho, voando para trás (cl), com dobras
function manto(P, sx, sy, hipY, cl, R, s, air) {
  const bot = hipY + (air ? 4 : 7.4), back = 3.6 + cl * 1.4;
  poly(P, [[sx - 1.6, sy - 0.6], [sx + 0.6, sy + 0.2], [sx - 0.6, hipY + 2], [sx - 1.4 - cl * 0.5, bot], [sx - back, bot - cl * 0.9], [sx - 3 - cl * 0.6, sy + 4]], R,
    (x, y) => 2.4 - (y - sy) * 0.06 + (Math.abs(Math.sin(x * 1.25 + y * 0.18 + s)) < 0.3 ? -0.9 : 0) + (x > sx - 1.4 ? 0.5 : 0) + cg(x, y, s) * 0.4 + (y >= bot - cl * 0.9 - 0.6 && hash2(x, y, s) < 0.5 ? -0.6 : 0));
}
// o glaive de três lâminas: o miolo de prata e três crescentes curvos, com o fio claro por fora
function glaive(P, cx, cy, ang, sc = 0.85) {
  for (let i = 0; i < 3; i++) {
    const a0 = ang + i * Math.PI * 2 / 3;
    for (let t = 0; t <= 1.001; t += 0.05) {
      const r = (1.3 + t * 4.6) * sc, a = a0 + t * 1.05, w = ((1 - t) * 1.1 + 0.3) * Math.min(1, sc + 0.1);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, nx = Math.cos(a + 1.57), ny = Math.sin(a + 1.57);
      for (let k = -w; k <= w + 0.01; k += 0.5) {
        const edge = k > w - 0.55, inner = k < -w + 0.45 && w > 0.8;   // o fio claro por fora da curva, a sombra por dentro
        P.put(x + nx * k, y + ny * k, ER.prata, edge ? 5 : inner ? 2.2 : 4 - t * 0.8 + (ny * k < 0 ? 0.4 : 0));
      }
    }
  }
  P.put(cx, cy, ER.lua, 5); P.put(cx - 1, cy, ER.prata, 2); P.put(cx + 1, cy, ER.prata, 2.4); P.put(cx, cy - 1, ER.prata, 1.6); P.put(cx, cy + 1, ER.prata, 1.6);   // o miolo com a pedra azul
}
// a cabeça élfica de lado: o rosto fino, o olho (um ponto que o EYES_E acende), a orelha comprida para trás
function rosto(P, hx, hy, s) {
  ell(P, hx + 0.6, hy + 0.4, 1.9, 2.5, 0.15, ER.pele, s, 3.1, (u, v) => (v > 0.6 && u < -0.2 ? null : [ER.pele, u > 0.6 ? -0.4 : 0]));
  P.put(hx + 2.3, hy + 0.6, ER.pele, 4.4);                           // o nariz fino
  P.put(hx + 1.5, hy - 0.2, ER.lua, 4.6); P.put(hx + 1.5, hy - 1, ER.pele, 1.6);   // o olho e a sobrancelha
  P.put(hx + 1.6, hy + 2, ER.pele, 1.8);                             // a boca
}
function orelha(P, hx, hy) { P.line(hx - 0.4, hy + 0.4, hx - 3.2, hy - 2.4, ER.pele, 3.6); P.put(hx - 3.4, hy - 2.8, ER.pele, 4.6); P.put(hx - 1.4, hy - 0.3, ER.pele, 1.8); }

/* ---------- a Sentinela da Lua, 26 x 28 ---------- */
function sentinela(k) {
  const o = EL1_SN[k], P = cp(26, 28), s = 25301 + k * 7;
  const hipY = 16.2 + o.low, sx = EL1_BX + o.lean, sy = 9.4 + o.low, hx = EL1_BX + 0.6 + o.lean * 1.25, hy = 5.4 + o.low;
  manto(P, sx, sy, hipY, o.cl, ER.lua, s, o.air);
  // a perna e o braço de longe, mais escuros
  perna(P, EL1_BX - 0.6, hipY, o.b[0], o.b[1], ER.lua, ER.prata, 1.6, s + 1, o.air);
  braco(P, sx - 0.6, sy + 0.8, o.hf[0], o.hf[1], ER.lua, ER.prata, 1.6, s + 2);
  // o tronco: a couraça de prata, o cinto, a saia azul com a barra de prata
  poly(P, [[EL1_BX - 2.4, hipY - 1.2], [EL1_BX + 2.3, hipY - 1.2], [EL1_BX + 3.2 + o.lean * 0.3, hipY + 2.8], [EL1_BX - 3, hipY + 2.8]], ER.lua,
    (x, y) => (y >= Math.floor(hipY + 2.2) ? (x % 2 ? 4.6 : 3.4) : 2.8 - (x - EL1_BX) * 0.25 + (Math.abs(Math.sin(x * 1.6)) < 0.3 ? -0.8 : 0) + cg(x, y, s) * 0.3));
  ell(P, sx - 0.1, sy + 3.2, 2.5, 3.7, o.lean * 0.12, ER.prata, s + 3, 3, (u, v, x, y) => [ER.prata, (Math.abs(u) < 0.18 && v < 0.5 ? 0.8 : 0) + (v > 0.82 ? -1 : 0)]);
  P.put(sx + 0.6, sy + 2.4, ER.lua, 5);   // a meia-lua no peito
  for (let x = EL1_BX - 2.2; x <= EL1_BX + 2.2; x += 0.5) P.put(x, hipY - 1.2, ER.couro, x > EL1_BX + 1 ? 2 : 3);
  perna(P, EL1_BX + 0.8, hipY, o.f[0], o.f[1], ER.lua, ER.prata, 2.8, s + 4, o.air);
  // a cabeça: o capuz azul atrás e em cima, o rosto de lado, a orelha furando o capuz, uma mecha de prata caindo
  poly(P, [[hx - 3.4, hy + 1.2], [hx + 0.8, hy + 2.8], [sx + 2.4, sy + 1.4], [sx - 2.8, sy + 1.8]], ER.lua, (x, y) => 2.6 + cg(x, y, s) * 0.4 - (y - hy) * 0.1);
  ell(P, hx - 1, hy - 0.6, 2.8, 3.2, -0.25, ER.lua, s + 5, 2.8, (u, v) => [ER.lua, (u > 0.5 ? 0.6 : 0) - (v > 0.5 ? 0.5 : 0)]);
  P.put(hx + 0.4, hy - 3.6, ER.lua, 4.4); P.put(hx + 1.2, hy - 3.2, ER.lua, 4); P.put(hx + 1.9, hy - 2.6, ER.lua, 3.4);   // a ponta do capuz caindo na testa
  rosto(P, hx, hy, s + 6);
  for (let x = hx - 0.6; x <= hx + 2; x += 0.5) P.put(x, hy - 2, ER.lua, x > hx + 1.2 ? 3.6 : 4.8);   // a aba do capuz
  for (let y = hy - 1.6; y <= hy + 2.4; y += 0.5) P.put(hx - 0.8, y, ER.lua, 1.6);                     // a sombra do capuz atrás do rosto
  orelha(P, hx - 0.4, hy);
  P.line(hx + 0.4, hy + 2.4, hx - 0.2, sy + 3.6, ER.cabelo, 4.2); P.put(hx - 0.4, sy + 4, ER.cabelo, 3);
  // o braço de perto, a ombreira em crescente e o glaive
  braco(P, sx + 0.8, sy + 0.8, o.hn[0], o.hn[1], ER.lua, ER.prata, 3, s + 7);
  ell(P, sx + 0.4, sy + 0.8, 2.1, 1.4, -0.3, ER.prata, s + 8, 3.6); P.put(sx - 0.8, sy + 1.4, ER.prata, 5);
  if (o.g !== null) glaive(P, o.hn[0], o.hn[1], o.g);
  return setO(P.done());
}
// o glaive voando, girando (6 quadros de 20 graus: as três lâminas repetem a cada 120)
function glaiveSolto(k) { const P = cp(15, 15); glaive(P, 7.5, 7.5, k * Math.PI / 9, 1.05); return setO(P.done()); }

/* ---------- o Arqueiro da Mata, 26 x 28 ---------- */
// o arco: a empunhadura em (gx, gy), as pontas curvando para trás; a corda reta ou puxada até (px, py)
function arco(P, gx, gy, tilt, pull) {
  const ca = Math.cos(tilt), sa = Math.sin(tilt), pt = t => { const lx = -2.6 * t * t + (Math.abs(t) > 0.85 ? 0.6 : 0), ly = 7.4 * t; return [gx + lx * ca - ly * sa, gy + lx * sa + ly * ca]; };
  let a = pt(-1), b = pt(1);
  if (pull) { P.line(a[0], a[1], pull[0], pull[1], ER.cabelo, 4); P.line(pull[0], pull[1], b[0], b[1], ER.cabelo, 4); }
  else P.line(a[0], a[1], b[0], b[1], ER.cabelo, 3.6);
  for (let t = -1; t <= 1.001; t += 0.05) { const [x, y] = pt(t); P.put(x, y, ER.arco, 3.2 - t * 1.2 + (Math.abs(t) < 0.15 ? -1.6 : 0)); P.put(x + ca * 0.6, y + sa * 0.6, ER.arco, 2 - t); }
  P.put(a[0], a[1], ER.prata, 5); P.put(b[0], b[1], ER.prata, 4);   // as pontas de prata
  return [a, b];
}
function arqueiro(k) {
  const o = EL1_AR[k], P = cp(26, 28), s = 25351 + k * 7;
  const hipY = 16.2 + o.low, sx = EL1_BX + o.lean, sy = 9.4 + o.low, hx = EL1_BX + 0.6 + o.lean * 1.25, hy = 5.4 + o.low;
  manto(P, sx, sy, hipY, o.cl, ER.folha, s, o.air);
  // o cabelo comprido de prata solto nas costas, por cima do manto
  poly(P, [[hx - 2.4, hy - 2.2], [hx + 0.6, hy - 2.8], [hx - 0.8, hy + 2], [sx - 1, sy + 6.4], [sx - 2.6 - o.cl * 0.5, sy + 7.6], [hx - 3.8, hy + 1.6]], ER.cabelo, (x, y) => 3.6 - (y - hy) * 0.14 + (Math.abs(Math.sin(x * 2.1 + y * 0.3)) < 0.35 ? -0.9 : 0) + cg(x, y, s) * 0.4);
  // a aljava nas costas: couro, as penas brancas das flechas para fora
  P.line(sx - 2.6, sy - 1.6, sx - 1.2, sy + 5.4, ER.couro, 2.2); P.line(sx - 3.2, sy - 1.2, sx - 1.8, sy + 5.6, ER.couro, 3.2);
  for (const [ox, oy] of [[-3.4, -2.6], [-2.4, -3], [-3.8, -1.8]]) { P.put(sx + ox, sy + oy, ER.cabelo, 5); P.put(sx + ox + 0.6, sy + oy + 0.6, ER.cabelo, 3.4); }
  perna(P, EL1_BX - 0.6, hipY, o.b[0], o.b[1], ER.folha, ER.couro, 1.2, s + 1, o.air);
  // o braço do arco é o de longe: estica para a frente segurando a empunhadura
  braco(P, sx - 0.4, sy + 0.8, o.bow[0], o.bow[1], ER.folha, ER.couro, 1.8, s + 2);
  // o tronco: túnica verde, o gibão de couro claro com a costura, o cinto
  poly(P, [[EL1_BX - 2.2, hipY - 1.2], [EL1_BX + 2.2, hipY - 1.2], [EL1_BX + 3, hipY + 2.4], [EL1_BX - 2.8, hipY + 2.4]], ER.folha,
    (x, y) => 3 - (x - EL1_BX) * 0.2 + (Math.abs(Math.sin(x * 1.6)) < 0.3 ? -0.8 : 0) + cg(x, y, s) * 0.3 + (y >= Math.floor(hipY + 1.8) ? 0.8 : 0));
  ell(P, sx - 0.1, sy + 3, 2.3, 3.6, o.lean * 0.12, ER.arco, s + 3, 2.8, (u, v) => [ER.arco, (Math.abs(u - 0.1) < 0.14 ? -1.1 : 0) + (v > 0.8 ? -0.8 : 0)]);
  for (let x = EL1_BX - 2; x <= EL1_BX + 2; x += 0.5) P.put(x, hipY - 1.4, ER.couro, x > EL1_BX + 1 ? 1 : 1.8);
  P.put(EL1_BX + 1.2, hipY - 1.4, ER.prata, 5);
  perna(P, EL1_BX + 0.8, hipY, o.f[0], o.f[1], ER.folha, ER.couro, 2.4, s + 4, o.air);
  // o capuz abaixado no pescoço, a cabeça descoberta, o diadema de prata com a pedra azul
  poly(P, [[hx - 3, hy + 2], [hx + 1, hy + 2.8], [sx + 2.2, sy + 1.2], [sx - 2.8, sy + 1.6]], ER.folha, (x, y) => 3 + cg(x, y, s) * 0.4 - (x < hx - 1 ? 0.6 : 0));
  ell(P, hx - 0.4, hy - 0.6, 2.6, 2.5, 0, ER.cabelo, s + 5, 3.2, (u, v, x, y) => [ER.cabelo, (Math.abs(Math.sin(x * 2.2 - y * 0.6)) < 0.3 ? -0.8 : 0)]);
  rosto(P, hx + 0.2, hy + 0.2, s + 6);
  for (let x = hx - 2.2; x <= hx + 2.2; x += 0.5) P.put(x, hy - 1.4 - (x - hx) * 0.12, ER.prata, x > hx + 1 ? 4.6 : 3.4);
  P.put(hx + 1.8, hy - 1.7, ER.lua, 5);
  orelha(P, hx + 0.2, hy + 0.2);
  P.line(hx + 0.6, hy - 2.2, hx + 2.4, hy - 0.6, ER.cabelo, 4.6);   // a franja
  // o arco e a mão da corda; puxado, a flecha na corda com a ponta de prata
  const pull = o.pull ? o.hn : null;
  arco(P, o.bow[0], o.bow[1], o.bow[2], pull);
  if (o.pull) { P.line(o.hn[0], o.hn[1], EL1_PONTA[0] - 1, EL1_PONTA[1], ER.arco, 3.2); P.put(EL1_PONTA[0], EL1_PONTA[1], ER.prata, 5); P.put(EL1_PONTA[0] - 0.8, EL1_PONTA[1] - 0.6, ER.prata, 4); P.put(o.hn[0] - 0.8, o.hn[1] - 0.6, ER.cabelo, 5); }
  P.put(o.bow[0], o.bow[1], ER.pele, 3.6);
  braco(P, sx + 0.8, sy + 0.8, o.hn[0], o.hn[1], ER.folha, ER.couro, 3, s + 7);
  ell(P, sx + 0.3, sy + 0.8, 1.8, 1.2, -0.3, ER.prata, s + 8, 3.4);   // a ombreira de prata
  return setO(P.done());
}

/* ---------- o Sabre-da-Noite, 32 x 16 de frente para a direita (as patas na linha 15) ----------
   0 parado, 1-2 andando, 3 agachado (o aviso), 4 o bote (esticado, as garras para a frente), 5 a queda.
   by: a altura do meio do corpo; bl: o quanto ele estica; fr/rr: as patas da frente e de trás (perto, longe) */
const SB = [
  { by: 8, bl: 0, fr: [[22.6, 15], [20.2, 15]], rr: [[8.8, 15], [6.2, 15]], head: [24.6, 6.2], tail: 0 },
  { by: 7.8, bl: 0.2, fr: [[24.6, 15], [19.4, 15]], rr: [[10.6, 15], [4.8, 15]], head: [24.8, 6], tail: 1 },
  { by: 8.2, bl: -0.2, fr: [[20.6, 15], [23, 14.4]], rr: [[6.4, 15], [9.6, 14.6]], head: [24.6, 6.4], tail: 2 },
  { by: 10.2, bl: 0.4, fr: [[25.4, 15], [23.6, 15]], rr: [[9.6, 15], [8, 15]], head: [25.6, 8.8], tail: 3 },
  { by: 7, bl: 1.6, fr: [[30.4, 9.4], [29, 11.4]], rr: [[2, 12], [3.6, 13.6]], head: [26.6, 5.6], tail: 4 },
  { by: 9.2, bl: 0.6, fr: [[25.6, 15], [23.2, 15]], rr: [[8.6, 14.4], [6, 13.6]], head: [25.4, 7.4], tail: 1 }
];
function sabre(k) {
  const o = SB[k], P = cp(32, 16), s = 25401 + k * 7, by = o.by, st = o.bl;
  // a cauda: longa e grossa, sobe e enrola na ponta (a ponta clara)
  const tw = [[0, -1], [0.6, -0.6], [-0.4, -1.2], [-1, 0.2], [1.6, 0.6]][o.tail];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, x = 7 - st - t * 6.6 + Math.sin(t * 3) * tw[0], y = by - 1.4 - t * 4.6 * (1 + tw[1] * 0.3) + t * t * 3 * (1 - t) - Math.sin(t * 5) * 0.6;
    P.put(x, y, ER.sabre, 3 - t * 0.4 + (t > 0.88 ? 1.4 : 0)); P.put(x, y + 1, ER.sabre, 1.6 - t * 0.4); if (t < 0.4) P.put(x, y - 1, ER.sabre, 2.4);
  }
  // as patas: coxa grossa, a canela fina, a pata larga; as da frente com as garras de fora no bote
  const pata = (x0, y0, f, base, ss, front) => {
    const kx = (x0 + f[0]) / 2 + (front ? -0.6 : 1.2), ky = (y0 + f[1]) / 2 - (front ? 0 : 0.6);
    tubo(P, x0, y0, kx, ky, front ? 1.6 : 2.1, 1.1, ER.sabre, base, ss); tubo(P, kx, ky, f[0], f[1] - 0.8, 1.1, 0.85, ER.sabre, base - 0.2, ss + 1);
    P.line(f[0] - 0.8, f[1], f[0] + 1.4, f[1], ER.sabre, base + 0.4);
    if (k === 4 && front) { P.put(f[0] + 2, f[1] - 0.6, ER.osso, 5); P.put(f[0] + 2.2, f[1] + 0.4, ER.osso, 4); P.put(f[0] + 1.6, f[1] + 1.2, ER.osso, 3.4); }
  };
  pata(20 + st, by + 1.4, o.fr[1], 0.9, s, true); pata(9 - st, by + 0.8, o.rr[1], 0.9, s + 2, false);
  // o corpo comprido: o dorso com a luz e as listras escuras em faixas, a barriga na sombra
  ell(P, 14.6, by, 8.8 + st * 0.6, 3.3 - st * 0.25, 0.02, ER.sabre, s + 3, 2.4, (u, v, x, y) => {
    const stripe = v < 0.35 && Math.abs(Math.sin(x * 0.85 + v * 1.6)) < 0.3 && u < 0.55 && u > -0.85 ? -1.3 : 0;
    return [v > 0.55 ? ER.ventre : ER.sabre, (v < -0.62 ? 1.2 : 0) + stripe + (v > 0.55 ? -1.6 : 0) + (u > 0.45 ? 0.3 : 0)];
  });
  ell(P, 21 + st * 0.6, by + 0.4, 3.1, 3.2, 0, ER.sabre, s + 4, 2.7, (u, v) => [ER.sabre, v < -0.5 ? 0.8 : 0]);   // o ombro
  ell(P, 8.2 - st * 0.6, by - 0.4, 3.2, 3.1, 0, ER.sabre, s + 5, 2.5, (u, v, x, y) => [ER.sabre, (v < -0.5 ? 0.9 : 0) + (Math.abs(Math.sin(x * 0.85 + v)) < 0.3 && v < 0.2 ? -1.2 : 0)]);   // a anca
  // a gola de prata com a pedra azul (a montaria das sentinelas)
  const [hx, hy] = o.head;
  for (let t = 0; t <= 1; t += 0.1) { const x = lerp(hx - 3.4, hx - 2, t), y = lerp(hy - 1.6, hy + 3.4, t); P.put(x, y, ER.prata, 4.6 - t * 1.6); P.put(x - 0.7, y, ER.prata, 2.8 - t); }
  P.put(hx - 2.3, hy + 2.2, ER.lua, 5);
  pata(21 + st, by + 1.6, o.fr[0], 2.8, s + 6, true); pata(9.6 - st, by + 1.2, o.rr[0], 2.6, s + 8, false);
  // a cabeça: o crânio largo, a bochecha com o tufo, o focinho, as orelhas em ponta, as presas longas
  ell(P, hx, hy, 3.4, 2.7, 0.1, ER.sabre, s + 9, 3, (u, v) => [ER.sabre, v < -0.5 ? 0.7 : 0]);
  P.put(hx - 2.6, hy + 2.2, ER.sabre, 2.6); P.put(hx - 2, hy + 2.8, ER.sabre, 2);   // o tufo da bochecha
  ell(P, hx + 2.9, hy + 1, 1.9, 1.3, 0.15, ER.sabre, s + 10, 3.2, (u, v) => [v > 0.25 ? ER.ventre : ER.sabre, v > 0.25 ? -0.6 : 0.4]);
  P.put(hx + 4.6, hy + 0.5, ER.sabre, 0.4);   // o nariz
  for (const [ox, b] of [[-1.6, 2.6], [0, 3.6]]) { P.put(hx + ox, hy - 2.6, ER.sabre, b); P.put(hx + ox + 0.4, hy - 3.6, ER.sabre, b - 0.8); P.put(hx + ox + 0.4, hy - 2.6, ER.ventre, 2); }
  P.line(hx + 3.2, hy + 2, hx + 3, hy + 4.8, ER.osso, 4.6); P.put(hx + 2.8, hy + 5.2, ER.osso, 3.4); P.line(hx + 2.4, hy + 2.2, hx + 2.3, hy + 3.4, ER.osso, 3.2);
  if (k === 4 || k === 3) { P.line(hx + 1.8, hy + 1.8, hx + 3.8, hy + 2.1, ER.sabre, 0); P.put(hx + 3.6, hy + 2.8, ER.osso, 2.6); }   // a boca aberta
  P.put(hx + 1.4, hy - 0.6, ER.olho, 5); P.put(hx + 0.6, hy - 0.6, ER.sabre, 0.8);                       // o olho (o EYES_E acende)
  P.put(hx - 0.4, hy - 1.8, ER.prata, 4.6); P.put(hx + 0.4, hy - 2.1, ER.prata, 5); P.put(hx - 1.2, hy - 1.2, ER.prata, 3.6);   // a meia-lua de prata na testa
  return setO(P.done());
}

/* ---------- o Fogo-Fátuo: a luzinha sem contorno (r o raio do miolo) ---------- */
function fatuo(r) {
  const n = Math.ceil(r * 2 + 3), P = cp(n, n), c = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / r; if (d > 1.15) continue; P.put(x, y, ER.fatuo, 5.6 - d * 3.4 - (x + y - n) * 0.12 + cg(x, y, 25451) * 0.4); }
  const cv = P.done(); return { r: cv, wr: whiteOf(cv) };
}

/* ---------- o Antigo da Mata, 34 x 42 (os pés na linha 41, o tronco no x 16) ----------
   0-1 andando, 2 o pé erguido (aviso), 3 a pisada, 4 o galho erguido (aviso), 5 o tapa */
const AN = [
  { lean: 0, low: 0, b: [12, 41], f: [21, 41], hn: [24.6, 30], hf: [7.6, 29] },
  { lean: 0.4, low: 0.4, b: [14.4, 41], f: [18.8, 40.4], hn: [23.8, 30.6], hf: [8.4, 28.4] },
  { lean: -1, low: -0.6, b: [12.4, 41], f: [23, 35], hn: [26, 25.4], hf: [6, 25.4] },
  { lean: 1.2, low: 1.4, b: [11.4, 41], f: [24, 41], hn: [26.4, 32.4], hf: [7.6, 31.4] },
  { lean: -0.8, low: 0, b: [12, 41], f: [20.6, 41], hn: [9.4, 3.6], hf: [6.4, 27.6] },
  { lean: 1.4, low: 0.6, b: [11.4, 41], f: [22, 41], hn: [32.6, 22], hf: [7, 29.6] }
];
EL1.FACE = 2.6; const EL1_AN_FACE = EL1.FACE;   // o rosto: tantas linhas abaixo do topo do tronco
function antigo(k) {
  const o = AN[k], P = cp(34, 42), s = 25501 + k * 7, cx = 16 + o.lean, ty = 15 + o.low, hipY = 32 + o.low * 0.6;
  // as pernas de raiz: grossas, o pé abre em raízes
  const pe = (hx, f, base, ss) => {
    const kx = (hx + f[0]) / 2 + 0.8, ky = (hipY + f[1]) / 2;
    tubo(P, hx, hipY, kx, ky, 2.7, 2.2, ER.casca, base, ss); tubo(P, kx, ky, f[0], f[1] - 1.6, 2.2, 1.9, ER.casca, base - 0.2, ss + 1);
    for (const dx of [-2.8, 3, 1, -1.2]) P.line(f[0] + dx * 0.3, f[1] - 1.2, f[0] + dx, f[1], ER.casca, base + (dx > 0 ? 0.4 : -0.4));
  };
  pe(cx - 2.4, o.b, 1.2, s);
  // o braço-galho: dois gomos, os dedos de graveto, folhinhas presas
  const galho = (x0, y0, h, base, ss) => {
    const up = h[1] < y0 - 4, mx = (x0 + h[0]) / 2 + (up ? -2 : 0.6), my = (y0 + h[1]) / 2 + (up ? 0 : 1.4);
    tubo(P, x0, y0, mx, my, 2.1, 1.6, ER.casca, base, ss); tubo(P, mx, my, h[0], h[1], 1.6, 0.9, ER.casca, base, ss + 1);
    const a = Math.atan2(h[1] - my, h[0] - mx);
    for (const d of [-0.75, 0, 0.65]) { const L = 2.6 + (d === 0 ? 1 : 0); P.line(h[0], h[1], h[0] + Math.cos(a + d) * L, h[1] + Math.sin(a + d) * L, ER.casca, base + 0.6); }
    for (let i = 0; i < 3; i++) { const t = 0.3 + i * 0.24, lx = lerp(x0, h[0], t), ly = lerp(y0, h[1], t) - 1.8; P.put(lx, ly, ER.copa, base + 1.6); P.put(lx + 1, ly - 0.4, ER.copa, base + 0.8); P.put(lx - 0.6, ly + 0.4, ER.copa, base); }
  };
  galho(cx - 4, ty + 7, o.hf, 1.2, s + 2);
  // o tronco: casca prateada lisa com sulcos verticais e nós, os ombros largos, o pé alargando em raízes
  for (let y = Math.floor(ty - 1); y <= hipY + 1; y++) {
    const t = (y - ty) / (hipY - ty), hw = 4.4 + Math.sin(t * Math.PI) * 1.2 + (t < 0.15 ? (0.15 - t) * 9 : 0) + (t > 0.86 ? (t - 0.86) * 9 : 0), c = cx + (1 - t) * o.lean * 0.6;
    for (let x = Math.floor(c - hw); x <= c + hw; x++) {
      const u = (x + 0.5 - c) / hw, w = (x + 0.5 + Math.sin(y * 0.28 + x * 0.4) * 0.9 + 30) % 2.7, groove = w < 0.75 ? -1.3 : w < 1.2 ? 0.5 : 0;
      P.put(x, y, ER.casca, 3.1 - u * 1.3 - u * u * 0.8 + groove + cg(x, y, s + 3) * 0.2 - (t > 0.9 ? 0.6 : 0));
    }
  }
  ell(P, cx - 1.6, ty + 11, 1.2, 1.5, 0, ER.casca, s + 4, 1); P.put(cx - 2, ty + 10.4, ER.casca, 0); P.put(cx - 1.2, ty + 12.2, ER.casca, 4);   // um nó
  // o rosto: o oco escuro, as sobrancelhas de casca grossas, os olhos de seiva (o EYES_E acende), a boca rachada,
  // a barba de líquen prateado
  const fx = cx + 2.4, fy = ty + EL1_AN_FACE;
  ell(P, fx, fy, 3, 1.6, 0, ER.casca, s + 5, -0.4);
  P.put(fx - 1.4, fy, ER.seiva, 5); P.put(fx + 1.2, fy + 0.2, ER.seiva, 5); P.put(fx - 1.4, fy + 0.8, ER.seiva, 2.6); P.put(fx + 1.2, fy + 1, ER.seiva, 2.6);
  P.line(fx - 3.2, fy - 1.8, fx + 2.8, fy - 1.5, ER.casca, 4.6); P.line(fx - 2.6, fy - 2.6, fx + 1.4, fy - 2.4, ER.casca, 3.8); P.put(fx + 3.4, fy - 1.2, ER.casca, 3);
  P.line(fx + 0.4, fy + 1.6, fx + 1.2, fy + 3, ER.casca, 4);   // o nariz de nó
  P.line(fx - 1.4, fy + 4, fx + 2.2, fy + 3.6, ER.casca, 0.2); P.put(fx + 2.6, fy + 3.4, ER.casca, 0.6);
  for (let i = 0; i < 5; i++) { const x = fx - 1.6 + i, L = 1.6 + hash2(i, 3, s) * 2.6; P.line(x, fy + 4.4, x - 0.4, fy + 4.4 + L, ER.copa, 3.4 - i * 0.3 - (i % 2) * 0.8); }   // a barba de folhas
  // a copa: nuvens de folhas azul-prata em camadas por cima da cabeça, a borda rendada, pontos de luar
  const blobs = [[cx - 9.6, ty - 1.6, 3.6, 2.8], [cx + 9.8, ty - 2.4, 3.8, 2.8], [cx - 6.4, ty - 5.6, 6.4, 4.2], [cx + 5.4, ty - 6.2, 6.6, 4.4], [cx - 0.6, ty - 9.4, 7.8, 4.8]];
  for (const [bx, bY, rx, ry] of blobs) ell(P, bx, bY, rx, ry, 0, ER.copa, s + 6, 2.6, (u, v, x, y) => {
    if (hash2(x, y, s + 7) < 0.25 && u * u + v * v > 0.68) return null;
    return [ER.copa, (hash2(x >> 1, y, s + 8) < 0.28 ? -1 : 0) + (Math.abs(Math.sin(x * 1.1 + y * 1.7)) < 0.18 ? 0.9 : 0) + (v < -0.5 ? 0.6 : 0)];
  });
  for (const [x, y] of [[cx - 3, ty - 3], [cx + 4, ty - 2], [cx - 7.6, ty - 0.6]]) P.line(x, y + 2.6, x + (x < cx ? -1.6 : 1.6), y - 1.4, ER.casca, 3);   // galhos furando a copa
  for (let i = 0; i < 10; i++) { const x = cx - 11 + hash2(i, 1, s) * 22, y = ty - 13 + hash2(i, 2, s) * 11; if (P.c[(y | 0) * P.w + (x | 0)]) P.put(x, y, ER.seiva, 4 + hash2(i, 3, s)); }
  // a perna e o galho de perto
  pe(cx + 2.4, o.f, 2.8, s + 9);
  galho(cx + 2.6, ty + 7.6, o.hn, 3, s + 10);
  return setO(P.done());
}

EL1.SB = SB; EL1.AN = AN;
EL1.get = () => EL1.ready || (EL1.ready = {
  sn: EL1_SN.map((_, k) => sentinela(k)), gl: [0, 1, 2, 3, 4, 5].map(glaiveSolto),
  ar: EL1_AR.map((_, k) => arqueiro(k)),
  sb: SB.map((_, k) => sabre(k)),
  ft: [2, 2.6, 3.4].map(fatuo),
  an: AN.map((_, k) => antigo(k))
});
EL1.GL = {
  lua: glow(4, '#9cc8ff'), luaG: glow(10, '#9cc8ff'), luaM: glow(16, '#9cc8ff'), prata: glow(6, '#e6eef8'),
  branco: glow(8, '#f8fbff'), seiva: glow(5, '#5ab0ff'), seivaG: glow(12, '#5ab0ff')
};
}

/* ================= desenho ================= */
// a figura com o apoio (ax, ay) no centro dos pés quando olha para a direita
function el1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const el1Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho (x, y no quadro de 26 x 28, ou outro com o corpo em bx e os pés em by) no mundo
const el1Pt = (e, x, y, bx = EL1_BX, by = 27) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];

const el1SnPose = e => {
  const st = e.state;
  if (st === 'wind') return 3;
  if (st === 'slash' || st === 'gap') return e.slashN === 2 ? 5 : 4;
  if (st === 'twind') return 6;
  if (st === 'catch') return e.glaive ? (e.stateT > 0.25 ? 7 : 8) : 0;
  if (st === 'hop') return 9;
  if (e.glaive) return 8;
  return !e.onGround ? 9 : Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 9) % 2 : 0;
};
DRAW_E.sentinela = (e, fx, fy, fl) => {
  const k = el1SnPose(e), bob = k === 0 ? (Math.sin(e.t * 2.6 + e.seed) > 0.7 ? 1 : 0) : 0;
  el1Blit(cvPick(EL1.get().sn[k], e, fl), e, fx, fy + bob, EL1_BX + 1, 29, el1Jit(e, e.state === 'wind' || e.state === 'twind'));
};
EYES_E.sentinela = (e, fx, fy) => {
  const k = el1SnPose(e), o = EL1_SN[k], G = EL1.GL, hx = fx + (EL1_BX + 0.6 + o.lean * 1.25 + 1.5 - EL1_BX) * e.facing, hy = fy - 1 - (27 - (5.4 + o.low - 0.2));
  lc.globalAlpha = 0.35; lc.drawImage(G.lua, Math.round(hx) - 4, Math.round(hy) - 4);   // o olho
  if (o.g === null) return;
  const gx = fx + (o.hn[0] - EL1_BX) * e.facing, gy = fy - 1 - (27 - o.hn[1]);
  if (e.state === 'wind' || e.state === 'twind') { const q = clamp(1 - e.stateT / (e.state === 'wind' ? EL1_GLAIVE : EL1_TIRO), 0, 1); lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(G.luaG, Math.round(gx) - 10, Math.round(gy) - 10); }
  else if (e.state === 'slash' || e.state === 'gap') { lc.globalAlpha = 0.65; lc.drawImage(G.luaG, Math.round(gx) - 10, Math.round(gy) - 10); }
  else { lc.globalAlpha = 0.16; lc.drawImage(G.lua, Math.round(gx) - 4, Math.round(gy) - 4); }
};
WARN_E.sentinela = e => e.state === 'wind' || e.state === 'twind';

const el1ArPose = e => e.state === 'aim' ? 3 : e.state === 'loose' ? 4 : e.state === 'hop' || !e.onGround ? 5 : Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 9) % 2 : 0;
DRAW_E.arqueiro = (e, fx, fy, fl) => el1Blit(cvPick(EL1.get().ar[el1ArPose(e)], e, fl), e, fx, fy, EL1_BX + 1, 29, el1Jit(e, e.state === 'aim' && e.stateT < 0.3, 30));
EYES_E.arqueiro = (e, fx, fy) => {
  const G = EL1.GL, o = EL1_AR[el1ArPose(e)];
  lc.globalAlpha = 0.3; lc.drawImage(G.lua, Math.round(fx + (o.lean * 1.25 + 2.3) * e.facing) - 4, Math.round(fy - 1 - (27 - (5.4 + o.low))) - 4);
  if (e.state !== 'aim') return;
  const q = clamp(1 - e.stateT / EL1_CORDA, 0, 1), x = fx + (EL1_PONTA[0] - EL1_BX) * e.facing, y = fy - 1 - (27 - EL1_PONTA[1]);
  lc.globalAlpha = 0.25 + 0.6 * q; lc.drawImage(G.luaG, Math.round(x) - 10, Math.round(y) - 10);
};
WARN_E.arqueiro = e => e.state === 'aim';

// o sabre: o corpo inteiro some; espreitando, só um tremor (o branco do desenho, quase sem nada, deslocado)
const el1SbPose = e => e.state === 'reveal' ? 3 : e.state === 'pounce' ? (e.vy < 60 ? 4 : 5) : e.state === 'land' ? 5 : !e.onGround ? 5 : Math.abs(e.vx) > 6 ? 1 + Math.floor(e.t * (Math.abs(e.vx) > 60 ? 10 : 6)) % 2 : 0;
DRAW_E.sabre = (e, fx, fy, fl) => {
  const S = EL1.get().sb[el1SbPose(e)], v = e.vis ?? 1;
  if (v < 0.98) {   // o tremor no ar: dois fantasmas brancos fracos, um para cada lado, ondulando
    const w = e.facing > 0 ? S.wr : S.wl, j = Math.sin(e.t * 9 + e.seed) * 1.2;
    lc.globalAlpha = 0.07 * (1 - v); el1Blit(w, e, fx, fy, 16, 17, Math.round(j)); lc.globalAlpha = 0.05 * (1 - v); el1Blit(w, e, fx, fy - 1, 16, 17, -Math.round(j));
  }
  if (v > 0.02) { lc.globalAlpha = v; el1Blit(cvPick(S, e, fl), e, fx, fy, 16, 17, el1Jit(e, e.state === 'reveal' && e.stateT < 0.25, 40)); }
  lc.globalAlpha = 1;
};
EYES_E.sabre = (e, fx, fy) => {
  const v = e.vis ?? 1; if (v < 0.05) return;
  const o = EL1.SB[el1SbPose(e)], x = fx + (o.head[0] + 1.4 - 15) * e.facing, y = fy - 1 - (15 - (o.head[1] - 0.6));
  const hot = e.state === 'reveal' ? 0.4 + 0.55 * clamp(1 - e.stateT / EL1_OLHOS, 0, 1) : e.state === 'pounce' ? 0.8 : 0.25;
  lc.globalAlpha = hot * v; lc.drawImage(e.state === 'reveal' || e.state === 'pounce' ? EL1.GL.luaG : EL1.GL.lua, Math.round(x) - (e.state === 'reveal' || e.state === 'pounce' ? 10 : 4), Math.round(y) - (e.state === 'reveal' || e.state === 'pounce' ? 10 : 4));
};
WARN_E.sabre = e => e.state === 'reveal';

// o fogo-fátuo: o miolo; inchando cresce; o rastro e as faíscas vão no drawTop
const el1FtBob = e => e.state === 'dash' ? 0 : Math.sin(e.t * 3.1 + e.seed) * 1.5;
DRAW_E.fatuo = (e, fx, fy, fl) => {
  const F = EL1.get().ft, k = e.state === 'swell' ? (e.stateT < EL1_INCHA * 0.5 ? 2 : 1) : e.state === 'dash' ? 1 : 0, S = F[k], img = fl ? S.wr : S.r;
  lc.globalAlpha = 0.9; lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - e.h / 2 - img.height / 2 + el1FtBob(e))); lc.globalAlpha = 1;
};
EYES_E.fatuo = (e, fx, fy) => {
  const G = EL1.GL, y = Math.round(fy - e.h / 2 + el1FtBob(e)), sw = e.state === 'swell' ? clamp(1 - e.stateT / EL1_INCHA, 0, 1) : 0;
  lc.globalAlpha = 0.35 + 0.1 * Math.sin(e.t * 7 + e.seed) + sw * 0.5; lc.drawImage(sw > 0.3 || e.state === 'dash' ? G.luaG : G.lua, fx - (sw > 0.3 || e.state === 'dash' ? 10 : 4), y - (sw > 0.3 || e.state === 'dash' ? 10 : 4));
};
WARN_E.fatuo = e => e.state === 'swell';

const el1AnPose = e => e.state === 'stomp' ? 2 : e.state === 'crack' || e.state === 'roots' ? 3 : e.state === 'slapW' ? 4 : e.state === 'slap' ? 5 : e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 3) % 2 : 0;
DRAW_E.antigo = (e, fx, fy, fl) => el1Blit(cvPick(EL1.get().an[el1AnPose(e)], e, fl), e, fx, fy, 17, 43, el1Jit(e, (e.state === 'stomp' || e.state === 'slapW') && e.stateT < 0.25, 36));
EYES_E.antigo = (e, fx, fy) => {
  const o = EL1.AN[el1AnPose(e)], G = EL1.GL, cx = 16 + o.lean, ex = fx + (cx + 2.4 - 16) * e.facing, ey = fy - 1 - (41 - (15 + o.low + EL1.FACE + 0.3));
  const hot = e.state === 'stomp' || e.state === 'slapW' ? 0.7 + 0.25 * Math.sin(e.t * 30) : 0.35 + 0.08 * Math.sin(e.t * 2);
  lc.globalAlpha = hot; for (const ox of [-1.4, 1.2]) lc.drawImage(G.seiva, Math.round(ex + ox * e.facing) - 5, Math.round(ey) - 5);
  if (e.state === 'slapW') { const h = o.hn; lc.globalAlpha = 0.3 + 0.4 * clamp(1 - e.stateT / EL1_GALHO, 0, 1); lc.drawImage(G.seivaG, Math.round(fx + (h[0] - 16) * e.facing) - 12, Math.round(fy - 1 - (41 - h[1])) - 12); }
};
WARN_E.antigo = e => e.state === 'stomp' || e.state === 'slapW';

/* ================= comportamento ================= */
const el1Glaives = [], el1Flechas = [], el1Grupos = [], el1Rachas = [], el1Raizes = [], el1Pops = [];
let el1Agrupando = false;
const el1Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const el1Live = e => e && !e.dead && enemies.includes(e);
function el1Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (el1Fx.length > 500) return;
  for (let i = 0; i < n; i++) el1P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 });
}
const EL1_LUA = ['#9cc8ff', '#c8e0ff', '#f8fbff'], EL1_PRATA = ['#e6eef8', '#b4c2d6', '#ffffff'], EL1_SEIVA = ['#3a92f0', '#86c4ff', '#e0f4ff'], EL1_FOLHA = ['#5896b0', '#90c6dc', '#34708c'];
// o chão logo abaixo de (x, y) em px (a linha de cima do bloco), até max blocos
function el1Floor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
// ar livre acima da cabeça (px, até max blocos)
function el1Room(e, max = 8) { const x0 = Math.floor((e.x + 1) / T), x1 = Math.floor((e.x + e.w - 1) / T), ty = Math.floor(e.y / T); for (let k = 1; k <= max; k++) for (let x = x0; x <= x1; x++) if (solidAt(x, ty - k)) return (k - 1) * T + (e.y - ty * T); return max * T; }

/* ---------- a Sentinela da Lua ---------- */
AI.sentinela = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.throwCD = (e.throwCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'wind') {   // o glaive acende azul na mão
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) { const [x, y] = el1Pt(e, EL1_SN[3].hn[0], EL1_SN[3].hn[1]); el1Sparks(x, y, 1, EL1_LUA, 20, -20, 0.4); }
    if (e.stateT <= 0) el1Slash(e, 1);
    return;
  }
  if (e.state === 'slash') {
    const reach = 20, hb = { x: e.facing > 0 ? ecx - 2 : ecx - reach + 2, y: e.y - (e.slashN === 2 ? 8 : 2), w: reach, h: e.h + (e.slashN === 2 ? 8 : 4) };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') el1Sparks(pcx, pcy, 6, EL1_LUA, 70); }
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { if (e.slashN === 1) { e.state = 'gap'; e.stateT = 0.1; } else el1HopBack(e); }
    return;
  }
  if (e.state === 'gap') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) el1Slash(e, 2); return; }
  if (e.state === 'hop') { e.airT = (e.airT || 0) + dt; if (e.onGround && e.airT > 0.12) { e.state = 'walk'; e.vx *= 0.3; } else if (e.airT > 1.5) e.state = 'walk'; return; }
  if (e.state === 'twind') {   // o glaive acende atrás do ombro
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) { const [x, y] = el1Pt(e, EL1_SN[6].hn[0], EL1_SN[6].hn[1]); el1Sparks(x, y, 1, EL1_LUA, 20, -20, 0.4); }
    if (e.stateT <= 0) el1Throw(e);
    return;
  }
  if (e.state === 'catch') {   // o glaive voando: fica, de mão aberta, recuando devagar se o herói vem
    e.facing = Math.sign(dx) || e.facing;
    const dir = aggro && dist < 3 * T ? -Math.sign(dx) : 0;
    walk(e, dt, dir, 34, 400, 260, dy, false);
    if (!e.glaive) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6 + Math.random() * 0.5); }
    return;
  }
  e.state = 'walk';
  let dir = 0, chase = false;
  if (aggro) { dir = Math.abs(dx) < 12 ? 0 : Math.sign(dx); chase = true; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 64 + e.lvl * 0.8 : 28, 800, 290, dy, chase);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 26 && Math.abs(dy) < 16 && clearPath(e, pl)) { e.state = 'wind'; e.stateT = EL1_GLAIVE; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el1Glaive(Math.max(0.4, el1Near(e))); }
  else if (e.throwCD <= 0 && dist > 4 * T && dist < 9 * T && Math.abs(dy) < 5 * T && e.sees) {
    const [hx, hy] = el1Pt(e, EL1_SN[6].hn[0], EL1_SN[6].hn[1]);
    if (losClear(ecx, hy, pcx, pcy) && losClear(hx, hy, pcx, pcy)) { e.state = 'twind'; e.stateT = EL1_TIRO; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el1Glaive(Math.max(0.4, el1Near(e)), 1.3); }
    else e.throwCD = 0.5;
  }
};
function el1Slash(e, n) {
  e.state = 'slash'; e.stateT = 0.14; e.slashN = n; e.swingHit = false; e.vx = e.facing * (n === 1 ? 120 : 80);
  sfx.el1Corte(Math.max(0.4, el1Near(e)), n);
  const k = n === 2 ? 5 : 4, [x, y] = el1Pt(e, EL1_SN[k].hn[0], EL1_SN[k].hn[1]); el1Sparks(x, y, 4, EL1_LUA, 50);
  e.arcFx = { n, t: 0 };
}
function el1HopBack(e) {
  e.state = 'hop'; e.airT = 0; e.atkCD = 1 + Math.random() * 0.6;
  const room = el1Room(e, 5); e.vy = -Math.min(210, Math.sqrt(2 * GRAV * Math.max(4, room - 2))); e.vx = -e.facing * 150; e.onGround = false;
}
function el1Throw(e) {
  const [x, y] = el1Pt(e, EL1_SN[7].hn[0], EL1_SN[7].hn[1]), a = Math.atan2(pl.y + pl.h / 2 - y, pl.x + pl.w / 2 - x);
  const G = { x, y, vx: Math.cos(a) * EL1_GL_SP, vy: Math.sin(a) * EL1_GL_SP, ph: 'out', d: 0, owner: e, hit: false, a: 0, dmg: e.dmg, t: 0, back: 0 };
  el1Glaives.push(G); e.glaive = G; e.state = 'catch'; e.stateT = 0.5; e.throwCD = 3 + Math.random() * 1.5;
  sfx.el1Arremesso(Math.max(0.4, el1Near(e)));
}

/* ---------- o Arqueiro da Mata ---------- */
// o melhor lugar alto por perto: em pé, uns 9 blocos do herói, mais alto que ele (refeito de tempo em tempo)
function el1Alto(e) {
  const hT = Math.ceil(e.h / T), ex = Math.floor((e.x + e.w / 2) / T), ey = Math.floor((e.y + e.h + 1) / T);
  const px = Math.floor((pl.x + pl.w / 2) / T), py = Math.floor((pl.y + pl.h + 1) / T);
  let best = null, bs = -1e9;
  for (let x = ex - 7; x <= ex + 7; x++) for (let y = ey - 6; y <= ey + 3; y++) {
    if (!navStand(x, y, hT)) continue;
    const d = Math.abs(x - px), up = py - y;
    if (d < 5) continue;
    const sc = Math.min(up, 6) * 1.3 - Math.abs(d - 9) * 0.55 - Math.abs(x - ex) * 0.22 - Math.abs(y - ey) * 0.3;
    if (sc > bs) { bs = sc; best = { x, y }; }
  }
  return best;
}
AI.arqueiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.hopCD = (e.hopCD || 0) - dt; e.spotT = (e.spotT || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'aim') {
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { el1Volley(e); e.state = 'loose'; e.stateT = 0.35; e.atkCD = 1.8 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'loose') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (e.state === 'hop') { e.airT = (e.airT || 0) + dt; if (e.onGround && e.airT > 0.12) { e.state = 'walk'; e.vx *= 0.3; e.atkCD = Math.min(e.atkCD, 0.4); } else if (e.airT > 1.6) e.state = 'walk'; return; }
  e.state = 'walk';
  // o herói chegou perto: salta para trás e para cima
  if (aggro && e.hopCD <= 0 && e.onGround && dist < 3.5 * T) {
    const room = el1Room(e, 6); e.vy = -Math.min(330, Math.sqrt(2 * GRAV * Math.max(6, room - 2))); e.vx = -(Math.sign(dx) || e.facing) * 125;
    e.state = 'hop'; e.airT = 0; e.onGround = false; e.hopCD = 2 + Math.random(); e.facing = Math.sign(dx) || e.facing;
    sfx.el1Salto(Math.max(0.4, el1Near(e)));
    return;
  }
  let dir = 0;
  if (aggro) {
    if (e.spotT <= 0) { e.spotT = 1.1 + Math.random() * 0.5; e.spot = el1Alto(e); }
    const S = e.spot, ex = Math.floor(ecx / T), ey = Math.floor((e.y + e.h + 1) / T);
    if (S && (S.x !== ex || S.y !== ey)) {
      dir = Math.sign(S.x - ex);
      // um degrau alto ali do lado: pula para cima dele
      if (S.y < ey - 1 && Math.abs(S.x - ex) <= 2 && e.onGround && e.hopCD <= 0.6) {
        const h = (ey - S.y) * T + 8; e.vy = -Math.min(360, Math.sqrt(2 * GRAV * h)); e.vx = (dir || e.facing) * 60; e.state = 'hop'; e.airT = 0; e.onGround = false; e.hopCD = 0.8;
        return;
      }
    } else { const adx = Math.abs(dx); dir = adx < EL1_LONGE - 2 * T ? -Math.sign(dx) : adx > EL1_LONGE + 2 * T ? Math.sign(dx) : 0; }
  } else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 46 + e.lvl * 0.6 : 24, 600, 300, dy, false);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && dist < 15 * T && dist > 2.5 * T) {
    const [ax, ay] = el1Pt(e, EL1_PONTA[0], EL1_PONTA[1]);
    if (losClear(ax, ay, pcx, pcy) || losClear(ax, ay - T, pcx, pcy - T)) { e.state = 'aim'; e.stateT = EL1_CORDA; e.vx = 0; sfx.el1Corda(Math.max(0.4, el1Near(e, 260))); }
  }
};
// três flechas em leque, em arco: o ângulo baixo que acerta o herói com a gravidade da flecha
function el1Volley(e) {
  const [ox, oy] = el1Pt(e, EL1_PONTA[0], EL1_PONTA[1]), tx = pl.x + pl.w / 2 + pl.vx * 0.15, ty = pl.y + pl.h * 0.4;
  const X = Math.abs(tx - ox), Y = oy - ty, v = EL1_ARCO_SP, g = EL1_ARCO_G, sd = Math.sign(tx - ox) || e.facing;
  const disc = v ** 4 - g * (g * X * X + 2 * Y * v * v);
  let th = disc >= 0 ? Math.atan((v * v - Math.sqrt(disc)) / (g * Math.max(1, X))) : 0.7;
  th = Math.max(th, 0.08);   // sempre um pouco em arco
  for (const off of [-0.11, 0, 0.11]) {
    const a = th + off;
    el1Flechas.push({ x: ox, y: oy, vx: sd * Math.cos(a) * v, vy: -Math.sin(a) * v, dmg: e.dmg, life: 3, stuck: 0, hit: false });
  }
  el1Sparks(ox, oy, 4, EL1_PRATA, 30);
  sfx.el1Flecha(Math.max(0.35, el1Near(e, 260)));
}

/* ---------- o Sabre-da-Noite ---------- */
AI.sabre = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.showT = (e.showT || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  const want = e.state === 'stalk' ? (e.showT > 0 ? 1 : 0) : e.state === 'fade' ? 0 : 1;
  e.vis = approach(e.vis ?? 0, want, dt * (want > (e.vis ?? 0) ? 4 : 2.6));
  if (e.state === 'reveal') {   // agachado, os olhos acendem; mira até o último instante
    e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.12) { e.tgX = pcx; e.tgY = pl.y + pl.h; }
    if (e.stateT <= 0) el1Pounce(e);
    return;
  }
  if (e.state === 'pounce') {
    e.airT += dt;
    const hb = { x: e.facing > 0 ? ecx : ecx - 16, y: e.y - 4, w: 16, h: e.h + 4 };
    if (!e.swingHit && !pl.dead && (overlap(hb, pl) || overlap(e, pl))) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') el1Sparks(pcx, pl.y + 8, 6, ['#c8323c', '#ffffff'], 60, 200, 0.4); }
    if (e.onGround && e.airT > 0.12) { e.state = 'land'; e.stateT = 0.45; e.vx *= 0.25; burst(ecx, e.y + e.h, 5, '#6a5a80', 40, 300, 0.4); }
    else if (e.airT > 2) e.state = 'land', e.stateT = 0.3;
    return;
  }
  if (e.state === 'land') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'fade'; e.stateT = 0.45; sfx.el1Some(Math.max(0.3, el1Near(e))); } return; }
  if (e.state === 'fade') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) { e.state = 'stalk'; e.atkCD = Math.max(e.atkCD, 1.8 + Math.random() * 1.2); } return; }
  e.state = 'stalk';
  // espreitando: chega a uns 5 blocos, devagar, rodeando
  let dir = 0, chase = false, sp = 30;
  if (aggro) {
    const adx = Math.abs(dx);
    if (adx > 6 * T || !e.sees) { dir = Math.sign(dx); chase = true; sp = 74 + e.lvl * 0.6; }
    else if (adx < 3 * T) { dir = -Math.sign(dx); sp = 50; }
    else { e.dz = (e.dz || 0) - dt; if (e.dz <= 0) { e.dz = 0.6 + Math.random() * 0.7; e.dzDir = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); } dir = e.dzDir || 0; sp = 24; }
  } else { cvWander(e, dt); dir = e.wander; sp = 22; }
  walk(e, dt, dir, sp, 600, 280, dy, chase);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  e.purrT = (e.purrT ?? Math.random() * 4) - dt;
  if (e.purrT <= 0) { e.purrT = 3.5 + Math.random() * 3; const v = el1Near(e, 180); if (v > 0.1) sfx.el1Rosnado(v * 0.6); }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && Math.abs(dx) > 2 * T && Math.abs(dx) < 8.5 * T && Math.abs(dy) < 3 * T && el1Room(e, 4) > 2 * T) {
    e.state = 'reveal'; e.stateT = EL1_OLHOS; e.vx = 0; e.facing = Math.sign(dx) || e.facing; e.tgX = pcx; e.tgY = pl.y + pl.h;
    sfx.el1Rosnado(Math.max(0.5, el1Near(e)), 1.4);
    el1Sparks(ecx, e.y + e.h / 2, 6, EL1_LUA, 30, -20, 0.5);
  }
};
// o bote: um arco longo até onde o herói estava (passa um pouco dele)
function el1Pounce(e) {
  const ex = e.x + e.w / 2, ey = e.y + e.h, d = e.tgX + Math.sign(e.tgX - ex) * 8 - ex, h = e.tgY - ey;
  const v0 = Math.sqrt(2 * GRAV * clamp(el1Room(e, 5) - 4, 6, 13)), disc = v0 * v0 + 2 * GRAV * h, t = disc > 0 ? (v0 + Math.sqrt(disc)) / GRAV : 0.5;
  e.vy = -v0; e.vx = clamp(d / Math.max(0.35, t), -280, 280); e.onGround = false; e.state = 'pounce'; e.airT = 0; e.swingHit = false;
  e.facing = Math.sign(e.vx) || e.facing;
  sfx.el1Bote(Math.max(0.4, el1Near(e)));
}

/* ---------- o Fogo-Fátuo ---------- */
// o grupo gira em volta do herói; quando dá, para, as luzes incham, e cada uma se lança (uma depois da outra)
AI.fatuo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.ftAggro = aggro;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'dash') {
    // tocou no herói (o `touch` do updateEnemies pôs o atkCD): detona
    if (e.atkCD > 0.2 && e.dashT > 0.02) { el1FtBoom(e, true); return; }
    e.dashT += dt; e.atkCD = 0;
    if (e.hitWall || e.hitCeil || e.onGround || e.dashT > 1.1) { el1FtBoom(e, false); return; }
    if (Math.random() < dt * 40) el1P({ x: ecx + rnd(-1, 1), y: ecy + rnd(-1, 1), vx: -e.vx * 0.1, vy: -e.vy * 0.1, g: 0, life: 0.35, max: 0.35, col: EL1_LUA[(Math.random() * 3) | 0], size: 1 });
    return;
  }
  e.atkCD = Math.max(e.atkCD, 0.4);   // fora do bote não queima ninguém
  if (e.state === 'swell') { const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k; if (!e.grp && e.stateT <= 0) el1FtGo(e); return; }
  if (e.state === 'wait') {   // inchada, esperando a vez de se lançar
    const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k;
    if (e.stateT <= 0) el1FtGo(e);
    return;
  }
  e.state = 'float';
  let tx, ty, sp;
  if (aggro) {
    e.orbA = (e.orbA ?? Math.random() * 6.28) + dt * (e.orbS || 1.1);
    const R = (e.orbR || 4) * T; tx = pcx + Math.cos(e.orbA) * R; ty = pcy - T + Math.sin(e.orbA) * R * 0.55; sp = 95;
  } else { tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.6 + e.seed) * 26; ty = (e.homeY ?? ecy) + Math.sin(e.t * 1.3 + e.seed) * 8; sp = 26; }
  const k = Math.min(1, dt * 2.4);
  e.vx = lerp(e.vx, clamp((tx - ecx) * 2, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 2, -sp, sp), k);
  if (e.hitWall) e.vx *= -0.6; if (e.hitCeil || e.onGround) e.vy *= -0.6;
  e.facing = Math.sign(dx) || e.facing;
  e.chimeT = (e.chimeT ?? Math.random() * 3) - dt;
  if (e.chimeT <= 0) { e.chimeT = 2 + Math.random() * 3; const v = el1Near(e, 180); if (v > 0.08) sfx.el1Fatuo(v * 0.6); }
  if (!e.grp && aggro && e.atkCD <= 0.4 && e.sees && dist < 6 * T && Math.random() < dt * 0.5) { e.state = 'swell'; e.stateT = EL1_INCHA; e.ftGo = 0.05; }   // sozinha
};
function el1FtGo(e) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, a = Math.atan2(pl.y + pl.h / 2 - ecy, pl.x + pl.w / 2 - ecx), sp = 215;
  e.state = 'dash'; e.dashT = 0; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.atkCD = 0;
  const v = el1Near(e, 200); if (v > 0.05) sfx.el1Lanca(v);
}
// detona: no herói suga 6 de mana; quem erra estoura sozinha. Sai sem XP nem loot
function el1FtBoom(e, onHero) {
  if (e.dead) return;
  e.dead = true; e.el1Gone = true;
  const x = e.x + e.w / 2, y = e.y + e.h / 2;
  el1Pops.push({ x, y, t: 0, big: onHero });
  el1Sparks(x, y, onHero ? 14 : 8, EL1_LUA, onHero ? 80 : 50, 0, 0.5);
  if (onHero && !pl.dead && gameTime - (pl.lastHurt ?? -9) < 0.6) {   // só quando a luz queimou mesmo (bloqueada não suga)
    const m = Math.min(6, pl.mana || 0); pl.mana = Math.max(0, (pl.mana || 0) - 6);
    if (m > 0) floatText(pl.x + pl.w / 2, pl.y - 14, '-' + Math.round(m) + ' mana', '#9cc8ff', 0.75);
    for (let i = 0; i < 6; i++) el1P({ x: pl.x + pl.w / 2 + rnd(-4, 4), y: pl.y + rnd(2, 16), vx: (x - pl.x) * 0.8 + rnd(-10, 10), vy: (y - pl.y) * 0.8 - 20, g: 0, life: 0.5, max: 0.5, col: '#5a8ede', size: 1 });
    sfx.el1Suga();
  }
  const v = el1Near(e, 220); if (v > 0.03) sfx.el1Estoura(v, onHero);
}
// a cada quadro: o grupo
function el1GrupoTick(G, dt) {
  G.m = G.m.filter(o => !o.dead && enemies.includes(o));
  if (!G.m.length) return false;
  if (G.ph === 'swell') {
    G.t -= dt;
    if (G.t <= 0) {
      G.ph = 'idle'; G.cd = 3 + Math.random() * 1.5;
      let i = 0; for (const o of G.m) if (o.state === 'swell') { o.state = 'wait'; o.stateT = 0.02 + i * 0.16; i++; }
    }
    return true;
  }
  G.cd -= dt;
  if (G.cd > 0 || pl.dead || G.m.some(o => o.state === 'dash' || o.state === 'wait')) return true;
  const go = G.m.find(o => o.ftAggro && o.sees && o.stun <= 0 && Math.hypot(pl.x - o.x, pl.y - o.y) < 6.5 * T);
  if (!go) return true;
  G.ph = 'swell'; G.t = EL1_INCHA;
  for (const o of G.m) if (o.stun <= 0 && o.state === 'float' && Math.hypot(o.x - go.x, o.y - go.y) < 12 * T) { o.state = 'swell'; o.stateT = EL1_INCHA; }
  sfx.el1Incha(Math.max(0.4, el1Near(go)));
  return true;
}

/* ---------- o Antigo da Mata ---------- */
AI.antigo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'stomp') {   // o pé erguido: o alvo é onde o herói pisa agora
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) el1Pisa(e);
    return;
  }
  if (e.state === 'crack' || e.state === 'roots') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.8; } return; }
  if (e.state === 'slapW') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { e.state = 'slap'; e.stateT = 0.2; e.swingHit = false; e.vx = e.facing * 40; sfx.el1Galho(Math.max(0.4, el1Near(e))); }
    return;
  }
  if (e.state === 'slap') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 26, y: e.y + 2, w: 26, h: e.h - 4 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { pl.vx = e.facing * 330; pl.vy = -230; pl.onGround = false; el1Sparks(pcx, pl.y + 8, 8, EL1_FOLHA, 70, 200, 0.5); shake(4); }
    }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 20 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 17 + e.lvl * 0.25 : 9, 200, 260, dy, aggro);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (e.onGround && Math.abs(e.vx) > 3) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.7; const v = el1Near(e, 200); if (v > 0.05) sfx.el1Passo(v); } }
  e.creakT = (e.creakT ?? Math.random() * 5) - dt;
  if (e.creakT <= 0) { e.creakT = 4 + Math.random() * 4; const v = el1Near(e, 220); if (v > 0.05) sfx.el1Range(v); }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 30 && Math.abs(dy) < 22 && clearPath(e, pl)) { e.state = 'slapW'; e.stateT = EL1_GALHO; e.vx = 0; sfx.el1Range(Math.max(0.5, el1Near(e)), 1.4); }
  else if (e.sees && dist < 11 * T && Math.abs(dy) < 4 * T && pl.onGround) { e.state = 'stomp'; e.stateT = EL1_PE; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el1Range(Math.max(0.5, el1Near(e)), 0.8); }
};
// a pisada: a rachadura segue o chão, coluna a coluna, do pé até onde o herói pisa agora (ou até o chão acabar)
function el1Pisa(e) {
  const ecx = e.x + e.w / 2, fy = e.y + e.h, pcx = pl.x + pl.w / 2, dir = Math.sign(pcx - ecx) || e.facing;
  const pts = []; let x = ecx + dir * 9, y = fy, ok = true;
  const end = Math.abs(pcx - x) < 6 ? x : pcx;
  for (let n = 0; n < 90 && (dir > 0 ? x <= end : x >= end); n++) {
    const tx = Math.floor(x / T); let top = null;
    for (let k = -2; k <= 3; k++) { const ty = Math.floor((y - 1) / T) + k; if (solidAt(tx, ty) && !solidAt(tx, ty - 1) && !solidAt(tx, ty - 2)) { top = ty * T; break; } }
    if (top === null) { ok = false; break; }
    y = top; pts.push([x, y]); x += dir * 3;
  }
  if (!pts.length) pts.push([ecx + dir * 9, fy]);
  e.state = 'crack'; e.stateT = EL1_RACHA + 0.5; e.facing = dir;
  el1Rachas.push({ pts, t: 0, dur: EL1_RACHA, dmg: e.dmg, done: false, owner: e, dir, ok });
  burst(ecx + dir * 9, fy - 1, 12, '#5e6a78', 80, 300, 0.6); el1Sparks(ecx + dir * 9, fy - 2, 5, EL1_SEIVA, 50, 200, 0.4);
  const v = el1Near(e, 320); if (v > 0.02) { sfx.el1Pisa(v); shake(2 + 3 * v); }
}
// as raízes rompem: dano e enraizado em quem estiver em cima
function el1Rompe(R) {
  const [x, y] = R.pts[R.pts.length - 1];
  el1Raizes.push({ x, y, t: 0, seed: Math.random() * 100, dir: R.dir });
  burst(x, y - 2, 14, '#3e4856', 90, 300, 0.6); el1Sparks(x, y - 4, 8, EL1_SEIVA, 60, 120, 0.5);
  const v = clamp(1 - Math.hypot(pl.x - x, pl.y - y) / 300, 0, 1); if (v > 0.02) { sfx.el1Raiz(v); shake(1 + 2 * v); }
  if (pl.dead) return;
  const hb = { x: x - EL1_RAIZ_W, y: y - EL1_RAIZ_H, w: EL1_RAIZ_W * 2, h: EL1_RAIZ_H };
  if (overlap(hb, pl)) {
    // vem de baixo: o escudo erguido não segura (o golpe chega por trás dele)
    const r = hurtPlayer(R.dmg, pl.x + pl.w / 2 - pl.facing * 12, null, true);
    if (r === 'hit') { elEnraizar(1.2); pl.vx = 0; pl.vy = Math.min(pl.vy, -60); }
  }
}

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !EL1_TYPES.includes(e.type)) return r;
  if (e.type === 'sabre' && (e.state === 'stalk' || e.state === 'fade')) { e.showT = 1.2; e.vis = Math.max(e.vis ?? 0, 0.6); e.atkCD = Math.min(e.atkCD, 0.5); sfx.el1Rosnado(0.7, 1.6); }
  if (e.type === 'antigo') { e.stun = Math.min(e.stun, e.state === 'stomp' || e.state === 'slapW' ? 0 : 0.1); if (Math.random() < 0.5) sfx.el1Range(0.6, 1.2); el1Sparks(e.x + e.w / 2, e.y + e.h / 2, 3, EL1_FOLHA, 40, 200, 0.6); }
  if (e.type === 'sentinela' && e.state === 'twind' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); }   // o golpe corta o arremesso
  if (e.type === 'arqueiro' && e.state === 'aim' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!EL1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, el1Near(e, 260));
  if (e.type === 'sentinela' || e.type === 'arqueiro') { el1Sparks(cx, cy - 4, 8, EL1_LUA, 50, -20, 0.8); sfx.el1Morre(v); }
  else if (e.type === 'sabre') { el1Sparks(cx, cy, 10, ['#6a58a0', '#9cc8ff', '#e6eef8'], 50, -20, 0.8); sfx.el1Bote(v * 0.7, 0.6); }
  else if (e.type === 'fatuo') { el1Pops.push({ x: cx, y: cy, t: 0, big: false }); el1Sparks(cx, cy, 10, EL1_LUA, 60, 0, 0.5); sfx.el1Estoura(v, false); }
  else if (e.type === 'antigo') { burst(cx, cy, 20, '#5e6a78', 90, 300, 0.8); el1Sparks(cx, e.y + 6, 14, EL1_FOLHA, 70, 120, 1); el1Sparks(cx, cy, 8, EL1_SEIVA, 50, 0, 0.8); sfx.el1Range(v, 0.6); }
  if (e.glaive) e.glaive.owner = null;
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !EL1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'sabre') { e.state = 'stalk'; e.vis = 0; }
  else if (type === 'fatuo') {
    e.state = 'float'; e.orbR = 3.6 + Math.random() * 1.4; e.orbS = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.5); e.orbA = Math.random() * 6.28;
    if (!el1Agrupando) {   // o grupo: 3 a 5 luzes juntas
      const G = { m: [e], ph: 'idle', cd: 1.6 + Math.random(), t: 0 }; el1Grupos.push(G); e.grp = G;
      el1Agrupando = true;
      try {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0, made = 0; i < 14 && made < n; i++) {
          const x = e.x + rnd(-24, 24), y = e.y + rnd(-18, 18);
          if (rectSolid(x, y, e.w, e.h)) continue;
          const o = spawnEnemy('fatuo', x, y, zone);
          if (o && !o.dead) { o.grp = G; G.m.push(o); o.orbS = e.orbS; o.orbR = e.orbR + rnd(-0.6, 0.6); o.orbA = e.orbA + (made + 1) * (6.28 / (n + 1)); made++; }
        }
      } finally { el1Agrupando = false; }
    }
  } else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: os glaives, as flechas, o grupo, as rachaduras, as raízes ---------- */
function el1Update(dt) {
  for (let i = el1Grupos.length - 1; i >= 0; i--) if (!el1GrupoTick(el1Grupos[i], dt)) el1Grupos.splice(i, 1);
  const pcx = pl.x + pl.w / 2;
  const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
  // o glaive: vai em linha até o alcance (ou a pedra) e volta para a mão; acerta uma vez na ida e uma na volta
  for (let i = el1Glaives.length - 1; i >= 0; i--) {
    const G = el1Glaives[i], O = G.owner && el1Live(G.owner) ? G.owner : null; G.t += dt; G.a += dt * 22;
    if (G.ph === 'out') {
      const nx = G.x + G.vx * dt, ny = G.y + G.vy * dt; G.d += EL1_GL_SP * dt;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T)) || G.d >= EL1_GL_MAX) { G.ph = 'back'; G.hit = false; G.back = 0; el1Sparks(G.x, G.y, 4, EL1_PRATA, 40); if (G.d < EL1_GL_MAX) sfx.el1Tine(0.6); }
      else { G.x = nx; G.y = ny; }
    } else if (G.ph === 'back') {
      if (!O) { G.ph = 'drop'; G.vx *= 0.2; G.vy = -40; }
      else {
        // volta para a mão, acelerando (atravessa a pedra: é magia de lua)
        const [hx, hy] = el1Pt(O, EL1_SN[8].hn[0], EL1_SN[8].hn[1]), a = Math.atan2(hy - G.y, hx - G.x), d = Math.hypot(hx - G.x, hy - G.y);
        G.back += dt; const sp = Math.min(EL1_GL_SP * 1.15, 120 + G.back * 260);
        G.vx = lerp(G.vx, Math.cos(a) * sp, Math.min(1, dt * 9)); G.vy = lerp(G.vy, Math.sin(a) * sp, Math.min(1, dt * 9));
        G.x += G.vx * dt; G.y += G.vy * dt;
        if (d < 7 || G.t > 6) { O.glaive = null; el1Glaives.splice(i, 1); el1Sparks(hx, hy, 5, EL1_LUA, 30); sfx.el1Pega(Math.max(0.3, el1Near(O))); continue; }
      }
    } else {   // sem dona: cai girando e some
      G.vy += GRAV * 0.5 * dt; G.x += G.vx * dt; G.y += G.vy * dt;
      if (solidAt(Math.floor(G.x / T), Math.floor(G.y / T)) || G.t > 5) { el1Sparks(G.x, G.y, 8, EL1_PRATA, 40); el1Glaives.splice(i, 1); continue; }
    }
    if (G.ph !== 'drop' && !G.hit && hitsHero(G.x, G.y, 4)) {
      const r = hurtPlayer(G.dmg, pcx - Math.sign(G.vx || 1) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) { G.hit = true; el1Sparks(G.x, G.y, 6, EL1_LUA, 60); }
    }
    G.humT = (G.humT || 0) - dt; if (G.humT <= 0) { G.humT = 0.16; const v = clamp(1 - Math.hypot(pl.x - G.x, pl.y - G.y) / 240, 0, 1); if (v > 0.05) sfx.el1Gira(v); }
  }
  // as flechas: caem em arco, cravam na pedra e somem
  for (let i = el1Flechas.length - 1; i >= 0; i--) {
    const F = el1Flechas[i]; F.life -= dt;
    if (F.stuck) { F.stuck -= dt; if (F.stuck <= 0) el1Flechas.splice(i, 1); continue; }
    F.vy += EL1_ARCO_G * dt; const nx = F.x + F.vx * dt, ny = F.y + F.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { F.stuck = 1.4; F.x = lerp(F.x, nx, 0.5); F.y = lerp(F.y, ny, 0.5); burst(F.x, F.y, 2, '#8e9cb8', 30, 200, 0.3); continue; }
    F.x = nx; F.y = ny;
    if (hitsHero(F.x, F.y, 2)) {
      const r = hurtPlayer(F.dmg, pcx - Math.sign(F.vx || 1) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) { el1Flechas.splice(i, 1); el1Sparks(F.x, F.y, 4, EL1_PRATA, 40); continue; }
    }
    if (F.life <= 0) el1Flechas.splice(i, 1);
  }
  // a rachadura corre pelo chão; no fim, as raízes
  for (let i = el1Rachas.length - 1; i >= 0; i--) {
    const R = el1Rachas[i]; R.t += dt;
    if (!R.done && R.t >= R.dur) { R.done = true; el1Rompe(R); }
    if (Math.random() < dt * 25 && !R.done) { const p = R.pts[Math.min(R.pts.length - 1, Math.floor(R.pts.length * R.t / R.dur))]; burst(p[0], p[1] - 1, 1, '#5e6a78', 40, 300, 0.4); }
    if (R.t > R.dur + 1.2) el1Rachas.splice(i, 1);
  }
  for (let i = el1Raizes.length - 1; i >= 0; i--) { el1Raizes[i].t += dt; if (el1Raizes[i].t > 1) el1Raizes.splice(i, 1); }
  for (let i = el1Pops.length - 1; i >= 0; i--) { el1Pops[i].t += dt; if (el1Pops[i].t > 0.4) el1Pops.splice(i, 1); }
  for (const e of enemies) if (e.arcFx) { e.arcFx.t += dt; if (e.arcFx.t > 0.2) e.arcFx = null; }
}
HOOK.update.push(el1Update);
function clearEl1Fx() { el1Fx.length = 0; el1Glaives.length = 0; el1Flechas.length = 0; el1Grupos.length = 0; el1Rachas.length = 0; el1Raizes.length = 0; el1Pops.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearEl1Fx(); el1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: os olhos, o glaive aceso, as luzinhas, a seiva do Antigo, as rachaduras
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !EL1_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'fatuo') addL(cx, cy, e.state === 'swell' || e.state === 'dash' ? 0.6 : 0.45);
    else if (e.type === 'antigo') addL(cx, e.y + 10, e.state === 'stomp' || e.state === 'slapW' ? 0.5 : 0.32);
    else if (e.type === 'sabre') { if ((e.vis ?? 1) > 0.5) addL(cx, cy, 0.22); }
    else addL(cx, cy, e.state === 'wind' || e.state === 'twind' || e.state === 'slash' || e.state === 'aim' ? 0.45 : 0.24);
  }
  for (const G of el1Glaives) addL(G.x, G.y, 0.5);
  for (const R of el1Rachas) if (!R.done) { const p = R.pts[Math.min(R.pts.length - 1, Math.floor(R.pts.length * R.t / R.dur))]; addL(p[0], p[1] - 4, 0.4); }
  for (const R of el1Raizes) addL(R.x, R.y - 10, 0.5 * (1 - R.t));
}; }

// a luz aditiva: o glaive voando, o arco do corte, as rachaduras, as raízes, os estouros
HOOK.drawGlow.push((cx, cy) => {
  const G = EL1.GL;
  for (const g of el1Glaives) { lc.globalAlpha = 0.55; lc.drawImage(G.luaG, Math.round(g.x - cx) - 10, Math.round(g.y - cy) - 10); }
  for (const R of el1Rachas) {
    const n = R.done ? R.pts.length : Math.floor(R.pts.length * R.t / R.dur), f = R.done ? Math.max(0, 1 - (R.t - R.dur) / 1.2) : 1;
    lc.globalAlpha = 0.2 * f; for (let j = 0; j < n; j += 3) lc.drawImage(G.seiva, Math.round(R.pts[j][0] - cx) - 5, Math.round(R.pts[j][1] - cy) - 6);
    if (!R.done && n > 0) { const p = R.pts[Math.min(n, R.pts.length - 1)]; lc.globalAlpha = 0.55; lc.drawImage(G.seivaG, Math.round(p[0] - cx) - 12, Math.round(p[1] - cy) - 14); }
  }
  for (const R of el1Raizes) { lc.globalAlpha = 0.5 * (1 - R.t); lc.drawImage(G.seivaG, Math.round(R.x - cx) - 12, Math.round(R.y - cy) - 22); }
  for (const p of el1Pops) { lc.globalAlpha = (p.big ? 0.9 : 0.6) * (1 - p.t / 0.4); lc.drawImage(G.luaM, Math.round(p.x - cx) - 16, Math.round(p.y - cy) - 16); }
  for (const e of enemies) {
    if (e.dead || e.type !== 'sentinela' || !e.arcFx) continue;
    const k = e.arcFx.n === 2 ? 5 : 4, [x, y] = el1Pt(e, EL1_SN[k].hn[0], EL1_SN[k].hn[1]); lc.globalAlpha = 0.4 * (1 - e.arcFx.t / 0.2); lc.drawImage(G.luaG, Math.round(x - cx) - 10, Math.round(y - cy) - 10);
  }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): o glaive girando, as flechas, as raízes
HOOK.drawWorld.push((cx, cy) => {
  const B = EL1.get();
  for (const g of el1Glaives) { const img = B.gl[Math.floor(g.a) % 6].r; lc.drawImage(img, Math.round(g.x - cx - img.width / 2), Math.round(g.y - cy - img.height / 2)); }
  for (const F of el1Flechas) {
    const sp = Math.hypot(F.vx, F.vy) || 1, ux = F.vx / sp, uy = F.vy / sp, x = F.x - cx, y = F.y - cy;
    lc.globalAlpha = F.stuck ? Math.min(1, F.stuck * 2) : 1;
    for (let k = 0; k < 9; k++) { lc.fillStyle = k < 2 ? '#e6eef8' : k > 6 ? '#f8fbff' : k === 2 ? '#8a9abc' : '#a09688'; lc.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), 1, 1); }
    lc.fillStyle = '#c2d0e8'; lc.fillRect(Math.round(x - ux * 7 - uy), Math.round(y - uy * 7 + ux), 1, 1); lc.fillRect(Math.round(x - ux * 7 + uy), Math.round(y - uy * 7 - ux), 1, 1);
  }
  lc.globalAlpha = 1;
  // as raízes: pontas de casca saindo do chão em leque, sobem rápido, ficam e voltam para baixo
  for (const R of el1Raizes) {
    const up = R.t < 0.12 ? R.t / 0.12 : R.t > 0.7 ? Math.max(0, 1 - (R.t - 0.7) / 0.3) : 1;
    for (let j = 0; j < 7; j++) {
      const ox = (j - 3) * 3.6 + Math.sin(R.seed + j * 2.3) * 1.2, H = (10 + ((j * 7 + R.seed * 3) % 9) + (j === 3 ? 8 : 0)) * up, lean = (j - 3) * 0.22;
      for (let y = 0; y < H; y++) {
        const t = y / Math.max(1, H), w = Math.max(0, Math.round((1 - t) * 2.2)), x = Math.round(R.x - cx + ox + lean * y + Math.sin(y * 0.5 + j) * 0.6), yy = Math.round(R.y - cy - y);
        lc.fillStyle = '#262e3a'; lc.fillRect(x - w - 1, yy, w * 2 + 3, 1);
        lc.fillStyle = t > 0.85 ? '#b4c0ca' : (y % 4 === 1 ? '#3e4856' : '#5e6a78'); lc.fillRect(x - w, yy, w * 2 + 1, 1);
        if (w > 0) { lc.fillStyle = '#86929e'; lc.fillRect(x - w, yy, 1, 1); }
      }
    }
  }
});
// por cima do escuro: o arco prata do corte, o rastro do glaive, a rachadura acesa, os veios azuis das raízes, as
// luzinhas dos fátuos e o anel de quem estoura
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -60 || fx > VW + 60 || fy < -60 || fy > VH + 60) continue;
    if (e.type === 'sentinela' && e.arcFx) {
      // o crescente do corte: um arco fino de prata na frente dela
      const p = e.arcFx.t / 0.2, up = e.arcFx.n === 2, r = 13, n = 16;
      lc.globalAlpha = 1 - p;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), a = up ? lerp(1.2, -1.5, t) : lerp(-1.4, 1.1, t); if (t > 0.3 + p * 0.9) continue;
        const x = fx + Math.cos(a) * r * e.facing + e.facing * 2, y = fy - 13 + Math.sin(a) * r * 0.9;
        lc.fillStyle = i % 3 === 0 ? '#ffffff' : '#c8e0ff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1); lc.fillStyle = '#5a8ede'; lc.fillRect(Math.round(x - Math.cos(a) * e.facing), Math.round(y - Math.sin(a)), 1, 1);
      }
    } else if (e.type === 'sentinela' && (e.state === 'wind' || e.state === 'twind')) {
      // faíscas azuis girando em volta da mão
      const o = EL1_SN[e.state === 'wind' ? 3 : 6], x = fx + (o.hn[0] - EL1_BX) * e.facing, y = fy - 1 - (27 - o.hn[1]), q = clamp(1 - e.stateT / EL1_GLAIVE, 0, 1);
      for (let j = 0; j < 3; j++) { const a = now * 9 + j * 2.09; lc.fillStyle = j ? '#9cc8ff' : '#ffffff'; lc.fillRect(Math.round(x + Math.cos(a) * (6 - q * 2)), Math.round(y + Math.sin(a) * (6 - q * 2)), 1, 1); }
    } else if (e.type === 'arqueiro' && e.state === 'aim') {
      const q = clamp(1 - e.stateT / EL1_CORDA, 0, 1), x = fx + (EL1_PONTA[0] - EL1_BX) * e.facing, y = fy - 1 - (27 - EL1_PONTA[1]);
      lc.fillStyle = Math.floor(now * 14) % 2 ? '#ffffff' : '#c8e0ff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (q > 0.5) { lc.globalAlpha = q; lc.fillStyle = '#9cc8ff'; lc.fillRect(Math.round(x + e.facing), Math.round(y), 1, 1); lc.fillRect(Math.round(x), Math.round(y - 1), 1, 1); lc.globalAlpha = 1; }
    } else if (e.type === 'fatuo') {
      // a chama: um miolo branco e um rabicho que treme para cima
      const y = Math.round(fy - e.h / 2 + el1FtBob(e)), sw = e.state === 'swell' ? clamp(1 - e.stateT / EL1_INCHA, 0, 1) : e.state === 'wait' ? 1 : 0;
      lc.fillStyle = '#ffffff'; lc.fillRect(fx - 1, y - 1, 2, 2);
      for (let j = 1; j <= 3; j++) { lc.globalAlpha = 0.8 - j * 0.2; lc.fillStyle = j === 1 ? '#d8ecff' : '#9cc8ff'; lc.fillRect(Math.round(fx - 0.5 + Math.sin(now * 12 + j + e.seed) * 0.8), y - 1 - j, 1, 1); }
      if (sw > 0) {   // inchando: um anel fino de pontinhos girando
        const r = 3 + sw * 3, n = 8; lc.globalAlpha = 0.5 + sw * 0.5; lc.fillStyle = '#e6eef8';
        for (let i = 0; i < n; i++) { const a = i / n * 6.28 + now * 7; lc.fillRect(Math.round(fx + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
      }
      lc.globalAlpha = 1;
    } else if (e.type === 'sabre' && e.state === 'reveal') {
      const o = EL1.SB[3], x = fx + (o.head[0] + 1.4 - 15) * e.facing, y = fy - 1 - (15 - (o.head[1] - 0.6));
      lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
    } else if (e.type === 'antigo' && (e.state === 'stomp' || e.state === 'slapW')) {
      const o = EL1.AN[el1AnPose(e)], ex = fx + (o.lean + 2.4) * e.facing, ey = fy - 1 - (41 - (15 + o.low + EL1.FACE));
      lc.fillStyle = Math.floor(now * 16) % 2 ? '#e0f4ff' : '#86c4ff'; for (const ox of [-1.4, 1.2]) lc.fillRect(Math.round(ex + ox * e.facing), Math.round(ey), 1, 1);
    }
  }
  // a rachadura: a linha escura com o veio azul aceso, correndo até o alvo; a ponta treme
  for (const R of el1Rachas) {
    const n = R.done ? R.pts.length : Math.floor(R.pts.length * R.t / R.dur), f = R.done ? Math.max(0, 1 - (R.t - R.dur) / 1.2) : 1;
    for (let j = 0; j < n; j++) {
      const [x, y] = R.pts[j], wob = Math.round(Math.sin(j * 1.7 + R.dir) * 0.7), sx = Math.round(x - cx), sy = Math.round(y - cy) - 1 + wob;
      lc.globalAlpha = f; lc.fillStyle = '#0c1220'; lc.fillRect(sx, sy, 3, 1);
      lc.fillStyle = j % 4 === 0 ? '#e0f4ff' : '#3a92f0'; lc.fillRect(sx + 1, sy, 1, 1);
      if (j % 5 === 2) { lc.fillStyle = '#0c1220'; lc.fillRect(sx + 1, sy - 1, 1, 1); }
    }
    if (!R.done && n < R.pts.length) {   // o alvo: um círculo de pontinhos azuis no chão onde as raízes vão romper
      const [x, y] = R.pts[R.pts.length - 1], q = R.t / R.dur;
      lc.globalAlpha = 0.5 + 0.5 * q; lc.fillStyle = Math.floor(now * 12) % 2 ? '#86c4ff' : '#3a92f0';
      for (let i = -EL1_RAIZ_W; i <= EL1_RAIZ_W; i += 3) lc.fillRect(Math.round(x + i - cx), Math.round(y - cy) - 1 - (Math.abs(i) < 4 ? 1 : 0), 1, 1);
    }
  }
  lc.globalAlpha = 1;
  // as raízes: os veios de seiva acesos nelas
  for (const R of el1Raizes) {
    const up = R.t < 0.12 ? R.t / 0.12 : R.t > 0.7 ? Math.max(0, 1 - (R.t - 0.7) / 0.3) : 1;
    lc.fillStyle = '#86c4ff';
    for (let j = 0; j < 7; j += 2) { const ox = (j - 3) * 3.6 + Math.sin(R.seed + j * 2.3) * 1.2, H = (10 + ((j * 7 + R.seed * 3) % 9) + (j === 3 ? 8 : 0)) * up; for (let y = 2; y < H - 2; y += 3) lc.fillRect(Math.round(R.x - cx + ox + (j - 3) * 0.22 * y + Math.sin(y * 0.5 + j) * 0.6), Math.round(R.y - cy - y), 1, 1); }
  }
  // o rastro do glaive voando: três pontos de prata seguindo cada lâmina
  for (const g of el1Glaives) {
    for (let j = 0; j < 3; j++) { const a = g.a * 0.9 + j * 2.09; lc.fillStyle = j ? '#9cc8ff' : '#ffffff'; lc.fillRect(Math.round(g.x - cx + Math.cos(a) * 7), Math.round(g.y - cy + Math.sin(a) * 7), 1, 1); }
  }
  for (const p of el1Pops) {
    const q = p.t / 0.4, r = 2 + q * (p.big ? 12 : 7), n = p.big ? 20 : 12;
    lc.globalAlpha = 1 - q; lc.fillStyle = q < 0.4 ? '#ffffff' : '#9cc8ff';
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; lc.fillRect(Math.round(p.x - cx + Math.cos(a) * r), Math.round(p.y - cy + Math.sin(a) * r), 1, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  // o glaive acendendo: um anel de vidro subindo (p: o tom)
  el1Glaive(v = 1, p = 1) { tone(660 * p, 0.45, 'sine', 0.022 * v, 520 * p); tone(990 * p, 0.45, 'triangle', 0.008 * v, 700 * p); for (let k = 0; k < 4; k++) tone(1760 * p + k * 220, 0.06, 'sine', 0.008 * v, 0, 0.1 + k * 0.09); },
  el1Corte(v = 1, n = 1) { noise(0.12, 0.07 * v, n === 2 ? 3400 : 2600, 'bandpass', 0, 1.2); tone(n === 2 ? 1400 : 1100, 0.1, 'sine', 0.02 * v, -500); },
  el1Arremesso(v = 1) { noise(0.2, 0.06 * v, 2000, 'bandpass', 0, 1); tone(880, 0.18, 'triangle', 0.016 * v, 300); },
  el1Gira(v = 1) { noise(0.1, 0.022 * v, 3000 + Math.random() * 600, 'bandpass', 0, 2); },
  el1Tine(v = 1) { tone(2200, 0.18, 'sine', 0.02 * v, -300); tone(3300, 0.1, 'sine', 0.008 * v, -500); },
  el1Pega(v = 1) { tone(1320, 0.12, 'sine', 0.022 * v, 200); tone(1980, 0.16, 'sine', 0.01 * v, 0, 0.03); },
  el1Salto(v = 1) { noise(0.12, 0.03 * v, 1200, 'bandpass', 0, 1); },
  // o arco: a corda rangendo, o "tuc" da flecha saindo
  el1Corda(v = 1) { tone(140, 0.6, 'sawtooth', 0.006 * v, 60); noise(0.6, 0.012 * v, 900, 'bandpass', 0, 4); tone(1600, 0.5, 'sine', 0.004 * v, 400, 0.2); },
  el1Flecha(v = 1) { for (let k = 0; k < 3; k++) { noise(0.06, 0.05 * v, 1800 + k * 300, 'bandpass', k * 0.03, 2); tone(320 - k * 30, 0.05, 'triangle', 0.02 * v, -120, k * 0.03); } },
  // o sabre: rosnado grave, o bote, o sumiço (um brilho que desce)
  el1Rosnado(v = 1, p = 1) { tone(70 * p, 0.6, 'sawtooth', 0.02 * v, -10); noise(0.6, 0.03 * v, 260 * p, 'lowpass', 0, 1); },
  el1Bote(v = 1, p = 1) { noise(0.3, 0.08 * v, 700 * p, 'lowpass'); tone(160 * p, 0.3, 'sawtooth', 0.03 * v, -90); tone(90 * p, 0.35, 'square', 0.012 * v, -40, 0.05); },
  el1Some(v = 1) { for (let k = 0; k < 5; k++) tone(2400 - k * 260, 0.08, 'sine', 0.008 * v, -200, k * 0.05); noise(0.3, 0.01 * v, 6000, 'highpass'); },
  // os fátuos: sininhos de vidro
  el1Fatuo(v = 1) { const f = 1800 + Math.random() * 900; tone(f, 0.25, 'sine', 0.012 * v, 30); tone(f * 1.5, 0.2, 'sine', 0.005 * v, -30, 0.06); },
  el1Incha(v = 1) { for (let k = 0; k < 6; k++) tone(1200 + k * 180, 0.1, 'sine', 0.012 * v, 200, k * 0.09); tone(600, 0.6, 'triangle', 0.01 * v, 600); },
  el1Lanca(v = 1) { tone(2600, 0.12, 'sine', 0.014 * v, -1400); noise(0.08, 0.02 * v, 5000, 'highpass'); },
  el1Estoura(v = 1, big = false) { tone(big ? 1400 : 2000, 0.2, 'sine', 0.03 * v, -900); noise(0.12, 0.04 * v, 4800, 'highpass'); for (let k = 0; k < 3; k++) tone(2600 + Math.random() * 1200, 0.06, 'sine', 0.01 * v, 0, 0.04 + k * 0.05); },
  el1Suga() { for (let k = 0; k < 4; k++) tone(900 - k * 140, 0.14, 'sine', 0.02, -160, k * 0.06); },
  // o Antigo: o rangido da madeira, os passos pesados, a pisada, a rachadura, as raízes, o galho
  el1Range(v = 1, p = 1) { tone(90 * p, 0.7, 'sawtooth', 0.016 * v, 40 * p); noise(0.7, 0.02 * v, 500 * p, 'bandpass', 0, 3); tone(140 * p, 0.4, 'square', 0.004 * v, -30, 0.25); },
  el1Passo(v = 1) { noise(0.12, 0.05 * v, 220, 'lowpass'); tone(60, 0.12, 'sine', 0.04 * v, -20); },
  el1Pisa(v = 1) { tone(48, 0.6, 'sine', 0.14 * v, -18); noise(0.4, 0.14 * v, 240, 'lowpass'); for (let k = 0; k < 6; k++) noise(0.03, 0.04 * v, 1800 + Math.random() * 1200, 'bandpass', 0.08 + k * 0.07, 3); },
  el1Raiz(v = 1) { noise(0.3, 0.12 * v, 500, 'lowpass'); for (let k = 0; k < 5; k++) noise(0.04, 0.05 * v, 1400 + k * 200, 'bandpass', k * 0.025, 4); tone(110, 0.3, 'sawtooth', 0.02 * v, 120); },
  el1Galho(v = 1) { noise(0.25, 0.1 * v, 600, 'bandpass', 0, 0.8); tone(120, 0.2, 'sine', 0.04 * v, -50); },
  el1Morre(v = 1) { tone(880, 0.6, 'sine', 0.025 * v, -300); tone(1320, 0.5, 'sine', 0.01 * v, -500, 0.05); noise(0.4, 0.015 * v, 5000, 'highpass'); }
});

/* ---------- as faíscas acesas (com o brilho da cor delas, não o brilho quente das partículas comuns) ---------- */
const el1Fx = [], el1FxGl = {};
function el1P(o) { if (el1Fx.length < 500) el1Fx.push(o); }
HOOK.update.push(dt => {
  for (let i = el1Fx.length - 1; i >= 0; i--) { const p = el1Fx[i]; p.life -= dt; if (p.life <= 0) { el1Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of el1Fx) { const g = el1FxGl[p.col] || (el1FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of el1Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
