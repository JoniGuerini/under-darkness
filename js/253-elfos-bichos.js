'use strict';

/* ================= o Reino Élfico: os guardiões e as fadas, parte um =================
   Cinco dos dez bichos da décima camada (docs/camadas/11-reino-elfico.md, seção 6 e "Revamp de 2026-10-21"; os outros
   cinco estão no 254). Revamp de 2026-10-21: saíram a Sentinela da Lua (o glaive de três lâminas que volta), o
   Sabre-da-Noite e o Antigo da Mata, que eram bonecos do Warcraft; entraram a Guarda-Fronteira, o Cão-Fada e a
   Sílfide. Os ids mudaram junto (a `sentinela` e o `cacador` antigos também apagavam os bichos do Gelo de mesmo nome).
   Os do Reino são altos e finos, de prata, cinza-folha e o verde dos mantos; os avisos acendem em prata e azul. As
   fadas acendem em verde-pálido.
   - a Guarda-Fronteira (fronteira), a guarda élfica da mata com a capa cinza de folha, a cota de prata e a espada
     longa em folha de salgueiro; rápida. A lâmina acende na mão (0,5 s) e vem o corte duplo; depois ela salta para
     trás. De 3 a 7 blocos ela se agacha com a espada acesa para trás (0,55 s) e salta POR CIMA do herói: cai do outro
     lado e corta para trás na hora (quem fica parado leva; quem anda para trás dela, não);
   - o Arqueiro da Mata (arqueiro), de cabelo de prata solto e manto verde-prata; prefere ficar no alto (flets,
     pontes, degraus) e a uns 9 blocos. Puxa a corda e a ponta da flecha brilha (0,7 s): três flechas em leque, em
     arco. Quando o herói chega perto, salta para trás e para cima;
   - o Cão-Fada (caofada), o cù-sìth do folclore: um cão do tamanho de um bezerro, de pelo verde-musgo desgrenhado, a
     cauda enrolada e trançada sobre as costas, as orelhas caídas e os olhos verde-pálidos. Espreita invisível (só um
     tremor no ar). Reaparece e LATE TRÊS VEZES (0,8 s, um anel no ar a cada latido): no terceiro vem o bote longo em
     arco; depois some de novo. Um golpe enquanto espreita o mostra por um instante;
   - o Fogo-Fátuo (fatuo), luzinhas azul-prata em grupos de 3 a 5 (el1Grupo) que giram em volta do herói. O grupo para
     e as luzes incham (0,6 s); cada uma se lança e detona por toque (`touch`, o único daqui) e suga 6 de mana. A que
     erra estoura sozinha, sem dano;
   - a Sílfide (silfide), a fada do ar: pequena, de pele pálida, cabelo de folhas e quatro asas de libélula; voa aos
     trancos a uns 5 blocos. Para no ar, as asas viram um borrão e o vento converge para as mãos dela (0,65 s): sai
     a Rajada, uma meia-lua de vento em linha reta que dá pouco dano e EMPURRA o herói para longe (cuidado com as
     pontes sem corrimão). Golpeada, ou com o herói em cima dela, dispara para longe.
   Os espinhos que correm pelo chão (el1Pisa / el1Rompe: a rachadura de roseira e os espinhos que rompem e prendem os
   pés) ficam aqui porque o desenho e o tempo são os de antes; quem os chama agora é o Cavaleiro de Espinhos (254).
   O 255 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache),
   rampas de 6 tons com luz de cima à esquerda; brilhos pelo HOOK.drawGlow e EYES_E, os pontinhos acesos por cima do
   escuro (HOOK.drawTop). Materiais e bases do 257 (filtrados). Prefixo el1. */

/* ---------- números ---------- */
Object.assign(ET, {
  fronteira: { name: 'Guarda-Fronteira', w: 9, h: 22, hp: 90, dmg: 20, xp: 30, kb: 0.75, fly: false, blood: '#b83a48' },
  arqueiro: { name: 'Arqueiro da Mata', w: 8, h: 22, hp: 70, dmg: 22, xp: 28, kb: 0.9, fly: false, blood: '#b83a48' },
  caofada: { name: 'Cão-Fada', w: 20, h: 12, hp: 140, dmg: 26, xp: 38, kb: 0.45, fly: false, blood: '#4a6a3a' },
  fatuo: { name: 'Fogo-Fátuo', w: 6, h: 6, hp: 26, dmg: 10, xp: 9, kb: 1.2, fly: true, touch: 1, blood: '#c8e4ff' },   // touch: só no bote (atkCD segura o resto)
  silfide: { name: 'Sílfide', w: 10, h: 12, hp: 80, dmg: 22, xp: 30, kb: 1, fly: true, blood: '#c8e8f0' }
});
const EL1_TYPES = ['fronteira', 'arqueiro', 'caofada', 'fatuo', 'silfide'];
// materiais e bases do 257; filtradas agora e de novo a cada mundo
const EL1_DROPS = {
  fronteira: [['folha_prata', 0.4], ['min_lunarita', 0.08], ['pocao', 0.07], ['lamina_folha', 0.015], ['elmo_alado', 0.01]],
  arqueiro: [['folha_prata', 0.3], ['min_lunarita', 0.08], ['pocao', 0.08]],
  caofada: [['pelo_caofada', 0.55, 1, 2], ['min_lunarita', 0.08], ['pocao', 0.08]],
  fatuo: [['essencia_fatua', 0.4], ['min_lunarita', 0.04], ['pocao', 0.04]],
  silfide: [['asa_silfide', 0.55], ['min_lunarita', 0.06], ['pocao', 0.07]]
};
function el1Tables() { for (const k of EL1_TYPES) DROPS[k] = EL1_DROPS[k].filter(([id]) => ITEMS[id]); }
el1Tables();
Object.assign(NAV_WALKERS, { fronteira: 1, arqueiro: 1, caofada: 1 });
Object.assign(CV_STEP, { fronteira: 1, arqueiro: 1, caofada: 1 });
ET.fronteira.climbs = true; ET.arqueiro.climbs = true;   // sobem as escadas de corda (o 356 lê `climbs`)

const EL1_LAMINA = 0.5, EL1_SALTO = 0.55, EL1_CORDA = 0.7, EL1_LATIDO = 0.8, EL1_INCHA = 0.6, EL1_RACHA = 0.55, EL1_SOPRO = 0.65;
const EL1_ARCO_SP = 250, EL1_ARCO_G = 360;        // a flecha: velocidade e a gravidade dela
const EL1_LONGE = 9 * T;                           // a distância do arqueiro
const EL1_RAIZ_W = 13, EL1_RAIZ_H = 26;           // a área dos espinhos (meia-largura, altura) em px
const EL1_RAJ_SP = 190, EL1_RAJ_MAX = 9 * T;       // a rajada da sílfide: velocidade e alcance

/* ---------- as poses (no desenho de 26 x 28 de frente para a direita, o corpo no x 11, os pés na linha 27) ----------
   low: o corpo desce; lean: o tronco vai para a frente; b/f: o pé de trás e o da frente; hn/hf: a mão de perto e a de
   longe; cl: quanto a capa voa; g: o ângulo da espada na mão (0 aponta para a frente) */
const EL1_BX = 11;
const EL1_FR = [
  { low: 0, lean: 0, b: [9.2, 27], f: [13.4, 27], hn: [15.4, 17.2], hf: [8.4, 15.8], cl: 0.6, g: 1.15 },          // 0 parada: a ponta para baixo
  { low: 0.5, lean: 0.5, b: [7.2, 27], f: [15.2, 27], hn: [15.8, 16.4], hf: [9.8, 15.8], cl: 1.8, g: 0.9 },       // 1-2 andando
  { low: 0, lean: 0.5, b: [13.2, 27], f: [9.4, 26.6], hn: [15.2, 16.8], hf: [7.6, 15], cl: 1.4, g: 1.05 },
  { low: 1, lean: -0.6, b: [7.4, 27], f: [15.2, 27], hn: [8.4, 6.2], hf: [15.6, 11.4], cl: 1, g: -2.2 },         // 3 o aviso: erguida atrás, acesa
  { low: 1.5, lean: 1.5, b: [6.4, 27], f: [16.6, 27], hn: [18.6, 15.4], hf: [6.2, 12.4], cl: 2.6, g: 0.35 },       // 4 o primeiro corte, para baixo
  { low: 0.6, lean: 1, b: [7.2, 27], f: [15.8, 27], hn: [18, 8.4], hf: [6.8, 14.2], cl: 2.2, g: -0.7 },          // 5 o segundo, para cima
  { low: 3, lean: 0.8, b: [6, 27], f: [16, 27], hn: [6.4, 16.4], hf: [14.6, 17.2], cl: 0.4, g: 2.75 },           // 6 agachada para o salto: a lâmina para trás
  { low: -1.4, lean: 0.2, b: [8.4, 22.6], f: [14.4, 22], hn: [14.6, 7.6], hf: [7.6, 11.4], cl: 3.2, g: -1.6, air: 1 },   // 7 no ar, por cima: a lâmina erguida
  { low: 1.8, lean: 1.2, b: [5.6, 27], f: [16.4, 27], hn: [19.2, 16.4], hf: [6, 13.2], cl: 2.4, g: 0.15 },        // 8 o corte para trás ao cair
  { low: 0, lean: -0.4, b: [7.8, 24.2], f: [14.4, 25.4], hn: [14.6, 11.8], hf: [7.4, 12.2], cl: 3, g: 0.5, air: 1 }   // 9 o salto para trás
];
const EL1_LAM_L = 11;   // o comprimento da lâmina em px
const el1Tip = k => { const o = EL1_FR[k]; return [o.hn[0] + Math.cos(o.g) * EL1_LAM_L, o.hn[1] + Math.sin(o.g) * EL1_LAM_L]; };
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
  prata: R6(['#161c2c', '#323c56', '#58668a', '#8a9abc', '#c2d0e8', '#f2f8ff']),      // a cota e a lâmina
  lua: R6(['#0a1430', '#142a5c', '#22468e', '#3466b8', '#5a8ede', '#9cc0f4']),        // o azul-lua
  folha: R6(['#081816', '#123030', '#1e4a48', '#2e6a64', '#4a8e84', '#7ab8a8']),      // o verde-folha dos mantos
  cinza: R6(['#121614', '#222a26', '#36403a', '#4e5a52', '#6c7a70', '#94a296']),      // a capa cinza de folha da fronteira
  cabelo: R6(['#40485a', '#687284', '#949eb0', '#bcc6d4', '#dfe5ee', '#ffffff']),     // cabelo de prata
  couro: R6(['#24180e', '#3e2a18', '#5e4226', '#806038', '#a6844e', '#ccac70']),      // couro e madeira clara
  arco: R6(['#2e2a26', '#4c4640', '#746c62', '#a09688', '#cac0b0', '#eee8dc']),       // a madeira prateada do arco
  cao: R6(['#070c08', '#0e1a12', '#18291c', '#22392a', '#2e4c38', '#40644a']),        // o pelo verde-musgo do cão-fada
  caoV: R6(['#1a2218', '#2c3828', '#40503a', '#56684e', '#708466', '#90a482']),        // a barriga e o focinho
  osso: R6(['#5a5448', '#8a8270', '#b4ac98', '#d8d0bc', '#efe8d8', '#ffffff']),       // os dentes, as unhas
  fatuo: R6(['#1a3a6a', '#3a6aa8', '#6a9ad8', '#a6c8f0', '#d8ecff', '#ffffff']),
  palida: R6(['#3a4450', '#5e6c7a', '#8496a4', '#acbec8', '#d2e2e8', '#f2fafc']),     // a pele azulada da sílfide
  asa: R6(['#2a3a4a', '#4a6278', '#7a96ac', '#a8c4d8', '#d4e8f4', '#ffffff']),        // o vidro das asas
  folhaV: R6(['#0e1e12', '#1a3420', '#2a4e30', '#3e6c44', '#5a8e5a', '#86b47e'])        // o vestido e o cabelo de folhas
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
// a espada longa em folha de salgueiro: o cabo de couro para trás da mão, a guarda curta em folha, a lâmina estreita
// que engorda um pouco a dois terços e afina na ponta; o fio de cima aceso, a sombra embaixo
function espada(P, hx, hy, ang) {
  const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca;
  for (let t = 0.6; t <= 3; t += 0.5) P.put(hx - ca * t, hy - sa * t, ER.couro, 2.6 - t * 0.3);
  P.put(hx - ca * 3.4, hy - sa * 3.4, ER.prata, 3.6);                                   // o pomo
  for (let k = -1.6; k <= 1.6; k += 0.5) P.put(hx + ca * 0.6 + nx * k, hy + sa * 0.6 + ny * k, ER.prata, k < 0 ? 4.4 : 2.6);   // a guarda
  for (let t = 1; t <= EL1_LAM_L; t += 0.35) {
    const q = t / EL1_LAM_L, w = q > 0.92 ? 0.3 : 0.55 + Math.sin(Math.PI * Math.pow(q, 0.75)) * 0.55, x = hx + ca * t, y = hy + sa * t;
    for (let k = -w; k <= w + 0.01; k += 0.45) { const up = nx * k + ny * k < 0; P.put(x + nx * k, y + ny * k, ER.prata, k > w - 0.4 ? (up ? 5.2 : 2) : up ? 4.4 : 3.2); }
    if (q > 0.15 && q < 0.7) P.put(x, y, ER.prata, 2.4);                                 // o sulco do meio
  }
}
// a cabeça élfica de lado: o rosto fino, o olho (um ponto que o EYES_E acende), a orelha comprida para trás
function rosto(P, hx, hy, s) {
  ell(P, hx + 0.6, hy + 0.4, 1.9, 2.5, 0.15, ER.pele, s, 3.1, (u, v) => (v > 0.6 && u < -0.2 ? null : [ER.pele, u > 0.6 ? -0.4 : 0]));
  P.put(hx + 2.3, hy + 0.6, ER.pele, 4.4);                           // o nariz fino
  P.put(hx + 1.5, hy - 0.2, ER.lua, 4.6); P.put(hx + 1.5, hy - 1, ER.pele, 1.6);   // o olho e a sobrancelha
  P.put(hx + 1.6, hy + 2, ER.pele, 1.8);                             // a boca
}
function orelha(P, hx, hy) { P.line(hx - 0.4, hy + 0.4, hx - 3.2, hy - 2.4, ER.pele, 3.6); P.put(hx - 3.4, hy - 2.8, ER.pele, 4.6); P.put(hx - 1.4, hy - 0.3, ER.pele, 1.8); }


/* ---------- a Guarda-Fronteira, 26 x 28 ---------- */
function fronteira(k) {
  const o = EL1_FR[k], P = cp(26, 28), s = 25301 + k * 7;
  const hipY = 16.2 + o.low, sx = EL1_BX + o.lean, sy = 9.4 + o.low, hx = EL1_BX + 0.6 + o.lean * 1.25, hy = 5.4 + o.low;
  // a capa cinza de folha, comprida, voando para trás (as dobras e a barra puída)
  manto(P, sx, sy, hipY, o.cl, ER.cinza, s, o.air);
  // a perna e o braço de longe, mais escuros
  perna(P, EL1_BX - 0.6, hipY, o.b[0], o.b[1], ER.folha, ER.couro, 1.6, s + 1, o.air);
  braco(P, sx - 0.6, sy + 0.8, o.hf[0], o.hf[1], ER.cinza, ER.couro, 1.6, s + 2);
  // o tronco: a túnica verde-folha até a coxa, a cota de prata por baixo aparecendo na barra, o cinto de couro
  poly(P, [[EL1_BX - 2.4, hipY - 1.2], [EL1_BX + 2.3, hipY - 1.2], [EL1_BX + 3.2 + o.lean * 0.3, hipY + 2.8], [EL1_BX - 3, hipY + 2.8]], ER.folha,
    (x, y) => (y >= Math.floor(hipY + 2.2) ? (x % 2 ? 4 : 3) : 2.6 - (x - EL1_BX) * 0.25 + (Math.abs(Math.sin(x * 1.6)) < 0.3 ? -0.8 : 0) + cg(x, y, s) * 0.3));
  for (let x = EL1_BX - 2.6; x <= EL1_BX + 2.8; x += 0.5) P.put(x, hipY + 3, ER.prata, (x * 2 | 0) % 2 ? 4.2 : 2.8);   // a barra da cota
  ell(P, sx - 0.1, sy + 3.2, 2.5, 3.7, o.lean * 0.12, ER.folha, s + 3, 3, (u, v, x, y) => [Math.abs(u) < 0.5 && v < -0.2 ? ER.prata : ER.folha, (Math.abs(u) < 0.18 && v < 0.5 ? 0.6 : 0) + (v > 0.82 ? -1 : 0) + (((x + y) & 1) && Math.abs(u) < 0.5 && v < -0.2 ? -0.7 : 0)]);
  for (let x = EL1_BX - 2.2; x <= EL1_BX + 2.2; x += 0.5) P.put(x, hipY - 1.2, ER.couro, x > EL1_BX + 1 ? 2 : 3);
  perna(P, EL1_BX + 0.8, hipY, o.f[0], o.f[1], ER.folha, ER.couro, 2.8, s + 4, o.air);
  // a cabeça: o capuz cinza caído nos ombros e em cima da cabeça, o rosto de lado, a orelha furando o capuz, a trança
  // de prata saindo por baixo
  poly(P, [[hx - 3.4, hy + 1.2], [hx + 0.8, hy + 2.8], [sx + 2.4, sy + 1.4], [sx - 2.8, sy + 1.8]], ER.cinza, (x, y) => 2.8 + cg(x, y, s) * 0.4 - (y - hy) * 0.1);
  ell(P, hx - 1, hy - 0.6, 2.8, 3.2, -0.25, ER.cinza, s + 5, 3, (u, v) => [ER.cinza, (u > 0.5 ? 0.6 : 0) - (v > 0.5 ? 0.5 : 0)]);
  P.put(hx + 0.4, hy - 3.6, ER.cinza, 4.4); P.put(hx + 1.2, hy - 3.2, ER.cinza, 4); P.put(hx + 1.9, hy - 2.6, ER.cinza, 3.4);
  rosto(P, hx, hy, s + 6);
  for (let x = hx - 0.6; x <= hx + 2; x += 0.5) P.put(x, hy - 2, ER.cinza, x > hx + 1.2 ? 3.6 : 4.8);
  for (let y = hy - 1.6; y <= hy + 2.4; y += 0.5) P.put(hx - 0.8, y, ER.cinza, 1.6);
  orelha(P, hx - 0.4, hy);
  for (let j = 0; j < 6; j++) P.put(hx - 1.6 - j * 0.35 - o.cl * 0.1 * j, hy + 2 + j * 0.9, ER.cabelo, j % 2 ? 3 : 4.4);   // a trança
  // o broche de folha prendendo a capa (o verde aceso)
  P.put(sx + 0.8, sy + 0.6, ER.folha, 5); P.put(sx + 1.4, sy + 0.2, ER.folha, 4); P.put(sx + 0.4, sy + 1, ER.prata, 4.6);
  // o braço de perto e a espada
  braco(P, sx + 0.8, sy + 0.8, o.hn[0], o.hn[1], ER.cinza, ER.couro, 3, s + 7);
  espada(P, o.hn[0], o.hn[1], o.g);
  return setO(P.done());
}

/* ---------- o Cão-Fada, 32 x 16 de frente para a direita (as patas na linha 15) ----------
   0 parado, 1-2 andando, 3 o latido (o aviso: a cabeça erguida, a boca aberta), 4 o bote (esticado), 5 a queda.
   by: a altura do meio do corpo; bl: o quanto ele estica; fr/rr: as patas da frente e de trás (perto, longe) */
const SB = [
  { by: 7.6, bl: 0, fr: [[22.6, 15], [20.2, 15]], rr: [[8.8, 15], [6.2, 15]], head: [24.8, 5.6], tail: 0 },
  { by: 7.4, bl: 0.2, fr: [[24.6, 15], [19.4, 15]], rr: [[10.6, 15], [4.8, 15]], head: [25, 5.4], tail: 1 },
  { by: 7.8, bl: -0.2, fr: [[20.6, 15], [23, 14.4]], rr: [[6.4, 15], [9.6, 14.6]], head: [24.8, 5.8], tail: 2 },
  { by: 8.2, bl: 0, fr: [[23.6, 15], [21.6, 15]], rr: [[8.6, 15], [6.6, 15]], head: [25.4, 3.6], tail: 3, bark: 1 },
  { by: 6.6, bl: 1.6, fr: [[30.4, 9.4], [29, 11.4]], rr: [[2, 12], [3.6, 13.6]], head: [26.8, 5.2], tail: 4, bark: 1 },
  { by: 8.6, bl: 0.6, fr: [[25.6, 15], [23.2, 15]], rr: [[8.6, 14.4], [6, 13.6]], head: [25.4, 6.8], tail: 1 }
];
function caofada(k) {
  const o = SB[k], P = cp(32, 16), s = 25401 + k * 7, by = o.by, st = o.bl;
  // a cauda: grossa, sobe por cima das costas e enrola; trançada (gomos claros e escuros alternando)
  const tw = [0, 0.5, -0.4, 0.8, -1.2][o.tail];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26, a = Math.PI * (0.95 - t * 1.25) + tw * 0.15, r = 4.6 - t * 2.2, x = 7.4 - st + Math.cos(a) * r * 0.9 + (t < 0.15 ? -t * 6 : -0.9), y = by - 3.6 - Math.sin(a) * r * 0.85;
    const braid = (i % 4) < 2;
    P.put(x, y, ER.cao, (braid ? 3.6 : 2.2) - t * 0.4); P.put(x, y + 1, ER.cao, braid ? 2 : 1.2); if (t < 0.5) P.put(x - 0.6, y, ER.cao, 2.6);
  }
  // as patas: compridas de cão de caça, o pé largo com as unhas claras
  const pata = (x0, y0, f, base, ss, front) => {
    const kx = (x0 + f[0]) / 2 + (front ? -0.4 : 1.4), ky = (y0 + f[1]) / 2 - (front ? 0 : 0.8);
    tubo(P, x0, y0, kx, ky, front ? 1.5 : 2, 1, ER.cao, base, ss); tubo(P, kx, ky, f[0], f[1] - 0.8, 1, 0.75, ER.cao, base - 0.2, ss + 1);
    P.line(f[0] - 0.8, f[1], f[0] + 1.2, f[1], ER.cao, base + 0.4); P.put(f[0] + 1.6, f[1], ER.osso, 2.4);
  };
  pata(20 + st, by + 1.4, o.fr[1], 0.9, s, true); pata(9 - st, by + 0.8, o.rr[1], 0.9, s + 2, false);
  // o corpo: comprido, o peito fundo, o pelo desgrenhado em mechas (a borda de cima em tufos), a barriga mais clara
  ell(P, 14.4, by, 9.2 + st * 0.6, 3.6 - st * 0.25, 0.02, ER.cao, s + 3, 2.4, (u, v, x, y) => {
    const tuft = Math.abs(Math.sin(x * 1.7 + y * 0.9)) < 0.28 ? -0.9 : Math.abs(Math.sin(x * 1.1 - y * 1.3)) < 0.2 ? 0.8 : 0;
    return [v > 0.6 ? ER.caoV : ER.cao, (v < -0.6 ? 1.1 : 0) + tuft + (v > 0.6 ? -1.6 : 0) + (u > 0.45 ? 0.3 : 0)];
  });
  for (let x = 7; x < 22 + st; x++) if (hash2(x, k, s) < 0.55) { const t = (x - 7) / 15, y = by - 3.4 + Math.abs(t - 0.5) * 1.2 - (hash2(x, 3, s) < 0.4 ? 1 : 0); P.put(x, y, ER.cao, 3.6 + hash2(x, 2, s)); }   // os tufos das costas
  ell(P, 20.6 + st * 0.6, by + 0.6, 3.2, 3.6, 0, ER.cao, s + 4, 2.7, (u, v) => [ER.cao, v < -0.5 ? 0.8 : 0]);   // o peito
  for (let j = 0; j < 4; j++) P.put(19.4 + st * 0.6 + j * 0.8, by + 3.8 + (j % 2), ER.cao, 2.2);                   // a franja do peito
  // a anca
  ell(P, 8 - st * 0.6, by - 0.2, 3.2, 3.2, 0, ER.cao, s + 5, 2.5, (u, v) => [ER.cao, v < -0.5 ? 0.9 : 0]);
  pata(21 + st, by + 1.6, o.fr[0], 2.8, s + 6, true); pata(9.6 - st, by + 1.2, o.rr[0], 2.6, s + 8, false);
  // a cabeça de cão de caça: o crânio, o focinho comprido, o nariz escuro, as orelhas compridas caídas
  const [hx, hy] = o.head;
  tubo(P, 20.4 + st * 0.6, by - 1.6, hx - 1, hy + 1.2, 2.6, 2.2, ER.cao, 2.8, s + 9);                       // o pescoço
  ell(P, hx, hy, 2.8, 2.4, 0.1, ER.cao, s + 10, 3, (u, v) => [ER.cao, v < -0.5 ? 0.7 : 0]);
  ell(P, hx + 3, hy + 1 - (o.bark ? 0.4 : 0), 2.4, 1.2, o.bark ? -0.25 : 0.12, ER.caoV, s + 11, 2.8, (u, v) => [v > 0.3 ? ER.cao : ER.caoV, v > 0.3 ? 1.2 : 0.4]);
  P.put(hx + 5.2, hy + 0.4 - (o.bark ? 0.8 : 0), ER.cao, 0.2); P.put(hx + 5, hy + 1 - (o.bark ? 0.8 : 0), ER.cao, 0);   // o nariz
  if (o.bark) { P.line(hx + 1.6, hy + 2.2, hx + 4.4, hy + 3, ER.cao, 0); P.line(hx + 1.8, hy + 2.8, hx + 4, hy + 3.6, ER.caoV, 1.8); P.put(hx + 3.2, hy + 2.6, ER.osso, 4.4); P.put(hx + 2.2, hy + 2.4, ER.osso, 4); }
  for (let j = 0; j < 5; j++) { P.put(hx - 1.4 - j * 0.25, hy - 1 + j, ER.cao, 3.6 - j * 0.35); P.put(hx - 0.8 - j * 0.25, hy - 0.8 + j, ER.cao, 2.2 - j * 0.2); }   // a orelha caída
  P.put(hx + 1.2, hy - 0.6, ER.caoV, 5); P.put(hx + 0.6, hy - 1.2, ER.cao, 0.6);   // o olho (o EYES_E acende) e a sobrancelha
  return setO(P.done());
}

/* ---------- a Sílfide, 24 x 22 de frente para a direita (o meio do corpo em 11, 10) ----------
   0-2 voando (as asas em três alturas), 3 a rajada (o aviso: as asas abertas, as mãos para a frente, o cabelo
   jogado para a frente), 4 o arranco (o corpo deitado, as asas para trás) */
const SF = [
  { wu: -2.05, wl: 2.75, hx: 13.2, hy: 5.4, lean: 0, arm: 0 }, { wu: -2.45, wl: 2.45, hx: 13.2, hy: 5.6, lean: 0, arm: 0 }, { wu: -2.85, wl: 2.15, hx: 13.2, hy: 5.4, lean: 0, arm: 0 },
  { wu: -1.75, wl: 2.95, hx: 13.8, hy: 5, lean: -0.6, arm: 1 },
  { wu: -2.95, wl: 3.05, hx: 16.4, hy: 7.6, lean: 2.4, arm: 2 }
];
function silfide(k) {
  const o = SF[k], P = cp(24, 22), s = 25451 + k * 7, cx = 11 + o.lean * 0.6, hipY = 13 - (k === 4 ? 2 : 0);
  // as quatro asas de libélula atrás: compridas, de vidro claro, as nervuras mais escuras, a ponta com a mancha azul
  const asa = (rx, ry, ang, L, W, dark) => {
    const m = L + 1;
    for (let y = Math.floor(ry - m); y <= ry + m; y++) for (let x = Math.floor(rx - m); x <= rx + m; x++) {
      const px = x + 0.5 - rx, py = y + 0.5 - ry, u = px * Math.cos(ang) + py * Math.sin(ang), v = -px * Math.sin(ang) + py * Math.cos(ang);
      if (u < 0 || u > L) continue; const hw = W * Math.sin(Math.PI * Math.pow(u / L, 0.7)); if (Math.abs(v) > hw) continue;
      const vein = Math.abs(v) < 0.35 || ((u * 1.3 + Math.abs(v) * 2) % 2.6) < 0.45;
      P.put(x, y, u > L * 0.82 ? ER.lua : ER.asa, (vein ? 2.6 : 4.4) - (dark ? 1.4 : 0) - u / L * 0.6 + (v < 0 ? 0.4 : 0));
    }
  };
  const rx = cx - 1.2, ry = 8.4 + (k === 4 ? 0.6 : 0);
  asa(rx, ry, o.wu - 0.32, 9.5, 1.9, true); asa(rx, ry + 1, o.wl + 0.28, 7.5, 1.6, true);
  // as pernas finas pendendo para trás (os pés descalços), o vestido de folhas em ponta
  const lx = k === 4 ? -5 : -2.4;
  tubo(P, cx - 0.4, hipY, cx + lx - 1, hipY + (k === 4 ? 3 : 6.6), 0.8, 0.55, ER.palida, 2, s);
  tubo(P, cx + 0.4, hipY, cx + lx + 0.6, hipY + (k === 4 ? 4 : 7.2), 0.8, 0.55, ER.palida, 3.2, s + 1);
  for (let i = 0; i < 6; i++) {   // as folhas da saia, em leque para baixo e para trás
    const a = Math.PI / 2 + 0.55 - i * 0.22 + (k === 4 ? 0.9 : 0), L = 3.6 + (i % 2) * 1.2;
    for (let t = 0; t <= L; t += 0.5) { const w = Math.sin(Math.PI * t / L) * 1.1; for (let q = -w; q <= w; q += 0.5) P.put(cx - 0.2 + Math.cos(a) * t - Math.sin(a) * q, hipY - 1 + Math.sin(a) * t + Math.cos(a) * q, ER.folhaV, 3 - t * 0.2 + (q < 0 ? 0.6 : -0.3) + (Math.abs(q) < 0.3 ? 0.6 : 0)); }
  }
  // o tronco fino
  ell(P, cx + 0.2 + o.lean * 0.4, 9.8 - (k === 4 ? 1 : 0), 1.5, 2.6, o.lean * 0.3, ER.palida, s + 2, 3.2);
  for (let x = cx - 1.4; x <= cx + 1.6; x += 0.5) P.put(x + o.lean * 0.4, 8.6 - (k === 4 ? 1 : 0), ER.folhaV, 3.4);   // o corpete de folha
  // o braço de longe
  const sx = cx + 0.4 + o.lean * 0.5, sy = 7.8 - (k === 4 ? 1 : 0);
  const mao = o.arm === 1 ? [sx + 6.4, sy + 0.8] : o.arm === 2 ? [sx + 3, sy + 3.4] : [sx - 1.6, sy + 4.6];
  tubo(P, sx - 0.4, sy, mao[0] - (o.arm === 1 ? 0.6 : 0), mao[1] - 0.6, 0.6, 0.5, ER.palida, 1.8, s + 3);
  // a cabeça: o rosto fino, a orelha comprida, o cabelo de folhas voando para trás (para a frente na rajada)
  const hx = o.hx, hy = o.hy, fw = o.arm === 1 ? 1 : -1;
  for (let j = 0; j < 6; j++) {
    let x = hx - 0.4, y = hy - 1.6 + j * 0.5;
    for (let i = 0; i < 9; i++) { x += fw * (0.7 + j * 0.05); y += Math.sin(i * 0.6 + j + k) * 0.4 + (fw < 0 ? 0.15 : -0.05); P.put(x, y, ER.folhaV, 4 - i * 0.2 - j * 0.18 + (i % 3 === 0 ? 0.6 : 0)); }
  }
  ell(P, hx, hy, 1.9, 2.3, 0.1, ER.palida, s + 4, 3.6, (u, v) => [ER.palida, u > 0.6 ? -0.4 : 0]);
  P.put(hx + 2, hy + 0.4, ER.palida, 4.4); P.put(hx + 1.2, hy - 0.3, ER.lua, 5); P.put(hx + 1.2, hy + 1.6, ER.palida, 1.8);
  P.line(hx - 0.6, hy + 0.2, hx - 3.2, hy - 2.6, ER.palida, 3.6); P.put(hx - 3.4, hy - 3, ER.palida, 4.8);
  for (let x = hx - 1.6; x <= hx + 1.2; x += 0.5) P.put(x, hy - 2.2 - (x > hx ? 0.4 : 0), ER.folhaV, 4.4);   // a coroinha de folhas
  P.put(hx - 0.6, hy - 2.8, ER.folhaV, 5);
  // as asas da frente, por cima de tudo, um pouco abertas
  asa(rx + 0.4, ry - 0.2, o.wu, 10, 2.1, false); asa(rx + 0.4, ry + 0.8, o.wl, 8, 1.7, false);
  // o braço de perto
  const mao2 = o.arm === 1 ? [sx + 6.8, sy + 2.2] : o.arm === 2 ? [sx + 3.6, sy + 4.4] : [sx + 1.6, sy + 5];
  tubo(P, sx + 0.4, sy + 0.4, mao2[0], mao2[1], 0.65, 0.55, ER.palida, 3.4, s + 5);
  return setO(P.done());
}


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


/* ---------- o Fogo-Fátuo: a luzinha sem contorno (r o raio do miolo) ---------- */
function fatuo(r) {
  const n = Math.ceil(r * 2 + 3), P = cp(n, n), c = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / r; if (d > 1.15) continue; P.put(x, y, ER.fatuo, 5.6 - d * 3.4 - (x + y - n) * 0.12 + cg(x, y, 25451) * 0.4); }
  const cv = P.done(); return { r: cv, wr: whiteOf(cv) };
}


EL1.SB = SB; EL1.SF = SF;
EL1.get = () => EL1.ready || (EL1.ready = {
  fr: EL1_FR.map((_, k) => fronteira(k)),
  ar: EL1_AR.map((_, k) => arqueiro(k)),
  cf: SB.map((_, k) => caofada(k)),
  ft: [2, 2.6, 3.4].map(fatuo),
  sf: SF.map((_, k) => silfide(k))
});
EL1.GL = {
  lua: glow(4, '#9cc8ff'), luaG: glow(10, '#9cc8ff'), luaM: glow(16, '#9cc8ff'), prata: glow(6, '#e6eef8'),
  branco: glow(8, '#f8fbff'), fada: glow(5, '#b8f0c8'), fadaG: glow(12, '#9ae0b4'), vento: glow(9, '#e0f4ff')
};
}

/* ================= desenho ================= */
// a figura com o apoio (ax, ay) no centro dos pés quando olha para a direita
function el1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const el1Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho (x, y no quadro de 26 x 28, ou outro com o corpo em bx e os pés em by) no mundo
const el1Pt = (e, x, y, bx = EL1_BX, by = 27) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];



const el1FrPose = e => {
  const st = e.state;
  if (st === 'wind') return 3;
  if (st === 'slash' || st === 'gap') return e.slashN === 2 ? 5 : 4;
  if (st === 'vwind' || st === 'vland') return 6;
  if (st === 'vault') return 7;
  if (st === 'vcut') return 8;
  if (st === 'hop') return 9;
  return !e.onGround ? 9 : Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 9) % 2 : 0;
};
const el1FrHot = e => e.state === 'wind' || e.state === 'vwind' || e.state === 'vault' || e.state === 'vland';
DRAW_E.fronteira = (e, fx, fy, fl) => {
  const k = el1FrPose(e), bob = k === 0 ? (Math.sin(e.t * 2.6 + e.seed) > 0.7 ? 1 : 0) : 0;
  el1Blit(cvPick(EL1.get().fr[k], e, fl), e, fx, fy + bob, EL1_BX + 1, 29, el1Jit(e, e.state === 'wind' || e.state === 'vwind'));
};
EYES_E.fronteira = (e, fx, fy) => {
  const k = el1FrPose(e), o = EL1_FR[k], G = EL1.GL, hx = fx + (0.6 + o.lean * 1.25 + 1.5) * e.facing, hy = fy - 1 - (27 - (5.4 + o.low - 0.2));
  lc.globalAlpha = 0.3; lc.drawImage(G.lua, Math.round(hx) - 4, Math.round(hy) - 4);   // o olho
  // a lâmina acesa: o brilho corre do punho até a ponta
  const [tx, ty] = el1Tip(k), hot = el1FrHot(e), sw = e.state === 'slash' || e.state === 'vcut' || e.state === 'gap';
  if (!hot && !sw) return;
  const q = e.state === 'wind' ? clamp(1 - e.stateT / EL1_LAMINA, 0, 1) : e.state === 'vwind' ? clamp(1 - e.stateT / EL1_SALTO, 0, 1) : 1;
  for (let j = 1; j <= 3; j++) {
    const t = j / 3, x = fx + (lerp(o.hn[0], tx, t) - EL1_BX) * e.facing, y = fy - 1 - (27 - lerp(o.hn[1], ty, t));
    lc.globalAlpha = (sw ? 0.5 : 0.2 + 0.5 * q) * (j === 3 ? 1 : 0.7); lc.drawImage(j === 3 ? G.luaG : G.prata, Math.round(x) - (j === 3 ? 10 : 6), Math.round(y) - (j === 3 ? 10 : 6));
  }
};
WARN_E.fronteira = e => e.state === 'wind' || e.state === 'vwind';
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


// o cão-fada: o corpo inteiro some; espreitando, só um tremor (o branco do desenho, quase sem nada, deslocado)
const el1CfPose = e => e.state === 'bark' ? 3 : e.state === 'pounce' ? (e.vy < 60 ? 4 : 5) : e.state === 'land' ? 5 : !e.onGround ? 5 : Math.abs(e.vx) > 6 ? 1 + Math.floor(e.t * (Math.abs(e.vx) > 60 ? 10 : 6)) % 2 : 0;
DRAW_E.caofada = (e, fx, fy, fl) => {
  const S = EL1.get().cf[el1CfPose(e)], v = e.vis ?? 1;
  if (v < 0.98) {   // o tremor no ar: dois fantasmas brancos fracos, um para cada lado, ondulando
    const w = e.facing > 0 ? S.wr : S.wl, j = Math.sin(e.t * 9 + e.seed) * 1.2;
    lc.globalAlpha = 0.07 * (1 - v); el1Blit(w, e, fx, fy, 16, 17, Math.round(j)); lc.globalAlpha = 0.05 * (1 - v); el1Blit(w, e, fx, fy - 1, 16, 17, -Math.round(j));
  }
  // no latido o corpo dá um tranco a cada latido
  const kick = e.state === 'bark' && ((EL1_LATIDO - e.stateT) % 0.27) < 0.06 ? -1 : 0;
  if (v > 0.02) { lc.globalAlpha = v; el1Blit(cvPick(S, e, fl), e, fx, fy + kick, 16, 17); }
  lc.globalAlpha = 1;
};
EYES_E.caofada = (e, fx, fy) => {
  const v = e.vis ?? 1; if (v < 0.05) return;
  const o = EL1.SB[el1CfPose(e)], x = fx + (o.head[0] + 1.2 - 15) * e.facing, y = fy - 1 - (15 - (o.head[1] - 0.6));
  const big = e.state === 'bark' || e.state === 'pounce', hot = e.state === 'bark' ? 0.5 + 0.45 * clamp(1 - e.stateT / EL1_LATIDO, 0, 1) : e.state === 'pounce' ? 0.8 : 0.25;
  lc.globalAlpha = hot * v; lc.drawImage(big ? EL1.GL.fadaG : EL1.GL.fada, Math.round(x) - (big ? 12 : 5), Math.round(y) - (big ? 12 : 5));
};
WARN_E.caofada = e => e.state === 'bark';
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


// a sílfide: voa aos trancos; no aviso as asas viram um borrão (dois quadros de asa por cima, meio apagados)
const el1SfBob = e => e.state === 'dart' ? 0 : Math.sin(e.t * 4.2 + e.seed) * 1.6;
const el1SfPose = e => e.state === 'swind' ? 3 : e.state === 'dart' || e.state === 'gust' ? 4 : Math.floor(e.t * 16 + e.seed) % 3;
DRAW_E.silfide = (e, fx, fy, fl) => {
  const B = EL1.get().sf, k = el1SfPose(e), y = Math.round(fy - e.h / 2 + el1SfBob(e)), jx = el1Jit(e, e.state === 'swind', 50);
  if (e.state === 'swind') {   // o borrão das asas
    lc.globalAlpha = 0.35; el1Blit(cvPick(B[Math.floor(e.t * 40) % 3], e, false), e, fx, y, 12, 11, jx); lc.globalAlpha = 1;
  }
  el1Blit(cvPick(B[k], e, fl), e, fx, y, 12, 11, jx);
};
EYES_E.silfide = (e, fx, fy) => {
  const G = EL1.GL, o = EL1.SF[el1SfPose(e)], y = Math.round(fy - e.h / 2 + el1SfBob(e));
  const ex = fx + (o.hx + 1.2 - 11) * e.facing, ey = y + (o.hy - 0.3 - 10);
  lc.globalAlpha = 0.3; lc.drawImage(G.lua, Math.round(ex) - 4, Math.round(ey) - 4);
  if (e.state !== 'swind') return;
  const q = clamp(1 - e.stateT / EL1_SOPRO, 0, 1), hx = fx + (o.hx - 11 + 4) * e.facing, hy = y - 3;
  lc.globalAlpha = 0.2 + 0.55 * q; lc.drawImage(G.vento, Math.round(hx) - 9, Math.round(hy) - 9);
};
WARN_E.silfide = e => e.state === 'swind';

/* ================= comportamento ================= */
const el1Sopros = [], el1Aneis = [], el1Flechas = [], el1Grupos = [], el1Rachas = [], el1Raizes = [], el1Pops = [];
let el1Agrupando = false;
const el1Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const el1Live = e => e && !e.dead && enemies.includes(e);
function el1Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (el1Fx.length > 500) return;
  for (let i = 0; i < n; i++) el1P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 });
}
const EL1_LUA = ['#9cc8ff', '#c8e0ff', '#f8fbff'], EL1_PRATA = ['#e6eef8', '#b4c2d6', '#ffffff'], EL1_FADA = ['#5ab88a', '#b8f0c8', '#f4fff0'], EL1_VENTO = ['#e0f4ff', '#c8e4f0', '#ffffff'], EL1_FOLHA = ['#5896b0', '#90c6dc', '#34708c'];
// o chão logo abaixo de (x, y) em px (a linha de cima do bloco), até max blocos
function el1Floor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
// ar livre acima da cabeça (px, até max blocos)
function el1Room(e, max = 8) { const x0 = Math.floor((e.x + 1) / T), x1 = Math.floor((e.x + e.w - 1) / T), ty = Math.floor(e.y / T); for (let k = 1; k <= max; k++) for (let x = x0; x <= x1; x++) if (solidAt(x, ty - k)) return (k - 1) * T + (e.y - ty * T); return max * T; }


/* ---------- a Guarda-Fronteira ---------- */
AI.fronteira = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vaultCD = (e.vaultCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'wind') {   // a lâmina acende na mão, erguida atrás
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) { const [x, y] = el1Pt(e, ...el1Tip(3)); el1Sparks(x, y, 1, EL1_LUA, 20, -20, 0.4); }
    if (e.stateT <= 0) el1Slash(e, 1);
    return;
  }
  if (e.state === 'slash' || e.state === 'vcut') {
    const back = e.state === 'vcut', reach = back ? 24 : 21, up = e.slashN === 2;
    const hb = { x: e.facing > 0 ? ecx - 2 : ecx - reach + 2, y: e.y - (up ? 8 : 2), w: reach, h: e.h + (up ? 8 : 4) };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg * (back ? 1.15 : 1), ecx, e, false); if (r === 'hit') el1Sparks(pcx, pcy, 6, EL1_LUA, 70); }
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) {
      if (back) { e.state = 'walk'; e.atkCD = 0.9 + Math.random() * 0.6; }
      else if (e.slashN === 1) { e.state = 'gap'; e.stateT = 0.1; } else el1HopBack(e);
    }
    return;
  }
  if (e.state === 'gap') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) el1Slash(e, 2); return; }
  if (e.state === 'hop') { e.airT = (e.airT || 0) + dt; if (e.onGround && e.airT > 0.12) { e.state = 'walk'; e.vx *= 0.3; } else if (e.airT > 1.5) e.state = 'walk'; return; }
  if (e.state === 'vwind') {   // agachada, a espada acesa para trás: o salto vem
    e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.12) e.tgX = pcx + (Math.sign(dx) || e.facing) * 2.2 * T;
    if (Math.random() < dt * 16) { const [x, y] = el1Pt(e, ...el1Tip(6)); el1Sparks(x, y, 1, EL1_LUA, 20, -20, 0.4); }
    if (e.stateT <= 0) el1Vault(e);
    return;
  }
  if (e.state === 'vault') {
    e.airT += dt;
    if (e.onGround && e.airT > 0.15) { e.state = 'vland'; e.stateT = 0.09; e.vx *= 0.2; e.facing = Math.sign(pl.x + pl.w / 2 - ecx) || -e.facing; burst(ecx, e.y + e.h, 4, '#6e7a72', 40, 300, 0.35); }
    else if (e.airT > 1.8) { e.state = 'walk'; e.atkCD = 0.8; }
    return;
  }
  if (e.state === 'vland') {   // pousou do outro lado: vira e corta para trás
    e.vx = approach(e.vx, 0, 900 * dt);
    if (e.stateT <= 0) { e.state = 'vcut'; e.stateT = 0.16; e.swingHit = false; e.vx = e.facing * 60; e.slashN = 1; e.arcFx = { n: 3, t: 0 }; sfx.el1Corte(Math.max(0.4, el1Near(e)), 3); }
    return;
  }
  e.state = 'walk';
  let dir = 0, chase = false;
  if (aggro) { dir = Math.abs(dx) < 12 ? 0 : Math.sign(dx); chase = true; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 66 + e.lvl * 0.8 : 28, 800, 290, dy, chase);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 26 && Math.abs(dy) < 16 && clearPath(e, pl)) { e.state = 'wind'; e.stateT = EL1_LAMINA; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el1Lamina(Math.max(0.4, el1Near(e))); }
  else if (e.vaultCD <= 0 && Math.abs(dx) > 3 * T && Math.abs(dx) < 7 * T && Math.abs(dy) < 2 * T && e.sees && pl.onGround) {
    // só salta se cabe por cima (o teto alto) e se há chão do outro lado do herói
    const lx = pcx + Math.sign(dx) * 2.2 * T, fl = el1Floor(lx, pl.y, 4);
    if (el1Room(e, 6) > 4 * T && fl !== null && !rectSolid(lx - e.w / 2, fl - e.h - 1, e.w, e.h) && losClear(ecx, e.y - 2 * T, pcx, pcy - 2 * T)) {
      e.state = 'vwind'; e.stateT = EL1_SALTO; e.vx = 0; e.facing = Math.sign(dx) || e.facing; e.tgX = lx; e.vaultCD = 3.5 + Math.random() * 2;
      sfx.el1Lamina(Math.max(0.4, el1Near(e)), 0.8);
    } else e.vaultCD = 0.6;
  }
};
function el1Slash(e, n) {
  e.state = 'slash'; e.stateT = 0.14; e.slashN = n; e.swingHit = false; e.vx = e.facing * (n === 1 ? 120 : 80);
  sfx.el1Corte(Math.max(0.4, el1Near(e)), n);
  const [x, y] = el1Pt(e, ...el1Tip(n === 2 ? 5 : 4)); el1Sparks(x, y, 4, EL1_LUA, 50);
  e.arcFx = { n, t: 0 };
}
function el1HopBack(e) {
  e.state = 'hop'; e.airT = 0; e.atkCD = 1 + Math.random() * 0.6;
  const room = el1Room(e, 5); e.vy = -Math.min(210, Math.sqrt(2 * GRAV * Math.max(4, room - 2))); e.vx = -e.facing * 150; e.onGround = false;
}
// o salto por cima: o arco alto que passa uns 2 blocos acima da cabeça do herói e cai do outro lado
function el1Vault(e) {
  const ex = e.x + e.w / 2, ey = e.y + e.h, top = Math.min(ey - 4 * T, pl.y - 1.6 * T), room = el1Room(e, 6);
  const H = clamp(ey - top, 3 * T, Math.max(3 * T, room - 2)), v0 = Math.sqrt(2 * GRAV * H);
  const lf = el1Floor(e.tgX, pl.y, 4) ?? ey, h = lf - ey, disc = v0 * v0 + 2 * GRAV * h, t = disc > 0 ? (v0 + Math.sqrt(disc)) / GRAV : 0.8;
  e.vy = -v0; e.vx = clamp((e.tgX - ex) / Math.max(0.4, t), -320, 320); e.onGround = false; e.state = 'vault'; e.airT = 0;
  e.facing = Math.sign(e.vx) || e.facing;
  sfx.el1Salto(Math.max(0.5, el1Near(e)), 1);
  const [x, y] = el1Pt(e, ...el1Tip(6)); el1Sparks(x, y, 5, EL1_LUA, 40, 0, 0.4);
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


/* ---------- o Cão-Fada ---------- */
AI.caofada = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.showT = (e.showT || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  const want = e.state === 'stalk' ? (e.showT > 0 ? 1 : 0) : e.state === 'fade' ? 0 : 1;
  e.vis = approach(e.vis ?? 0, want, dt * (want > (e.vis ?? 0) ? 4 : 2.6));
  if (e.state === 'bark') {   // aparece e late três vezes; mira até o último instante
    e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.12) { e.tgX = pcx; e.tgY = pl.y + pl.h; }
    const el = EL1_LATIDO - e.stateT;
    while ((e.barkN || 0) < 3 && el >= (e.barkN || 0) * 0.27) {
      const o = EL1.SB[3], [x, y] = el1Pt(e, o.head[0] + 4, o.head[1] + 2, 15, 15);
      el1Aneis.push({ x, y, t: 0, n: e.barkN || 0 }); e.barkN = (e.barkN || 0) + 1;
      sfx.el1Latido(Math.max(0.5, el1Near(e, 320)), e.barkN);
    }
    if (e.stateT <= 0) el1Pounce(e);
    return;
  }
  if (e.state === 'pounce') {
    e.airT += dt;
    const hb = { x: e.facing > 0 ? ecx : ecx - 16, y: e.y - 4, w: 16, h: e.h + 4 };
    if (!e.swingHit && !pl.dead && (overlap(hb, pl) || overlap(e, pl))) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') el1Sparks(pcx, pl.y + 8, 6, ['#b83a48', '#ffffff'], 60, 200, 0.4); }
    if (e.onGround && e.airT > 0.12) { e.state = 'land'; e.stateT = 0.45; e.vx *= 0.25; burst(ecx, e.y + e.h, 5, '#3e5a3a', 40, 300, 0.4); }
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
  e.huffT = (e.huffT ?? Math.random() * 4) - dt;
  if (e.huffT <= 0) { e.huffT = 3.5 + Math.random() * 3; const v = el1Near(e, 180); if (v > 0.1) sfx.el1Bufo(v * 0.6); }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && Math.abs(dx) > 2 * T && Math.abs(dx) < 8.5 * T && Math.abs(dy) < 3 * T && el1Room(e, 4) > 2 * T) {
    e.state = 'bark'; e.stateT = EL1_LATIDO; e.barkN = 0; e.vx = 0; e.facing = Math.sign(dx) || e.facing; e.tgX = pcx; e.tgY = pl.y + pl.h;
    el1Sparks(ecx, e.y + e.h / 2, 6, EL1_FADA, 30, -20, 0.5);
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


/* ---------- a Sílfide ---------- */
// voa aos trancos em volta de um ponto a uns 5 blocos do herói, mais alto que ele; para, carrega o vento e sopra
AI.silfide = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.hopT = (e.hopT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const bounce = () => { if (e.hitWall) e.vx *= -0.6; if (e.hitCeil || e.onGround) e.vy = e.onGround ? -60 : e.vy * -0.6; };
  if (e.state === 'swind') {
    const k = Math.pow(0.01, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 30) {   // o vento converge para as mãos
      const [hx, hy] = el1SfMao(e), a = Math.random() * 6.28, r = 14 + Math.random() * 6;
      el1P({ x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r, vx: -Math.cos(a) * r * 2.6, vy: -Math.sin(a) * r * 2.6, g: 0, life: 0.36, max: 0.36, col: EL1_VENTO[(Math.random() * 3) | 0], size: 1 });
    }
    if (e.stateT <= 0) el1Rajada(e);
    return;
  }
  if (e.state === 'gust') { const k = Math.pow(0.05, dt); e.vx *= k; e.vy *= k; if (e.stateT <= 0) e.state = 'fly'; return; }
  if (e.state === 'dart') { bounce(); if (e.stateT <= 0) { e.state = 'fly'; e.hopT = 0; } return; }
  e.state = 'fly';
  if (aggro && dist < 2.2 * T && (e.dartCD || 0) <= gameTime) { el1SfDart(e); return; }   // o herói em cima: dispara para longe
  if (aggro) {
    if (e.hopT <= 0 || !e.goal) {   // o próximo tranco: um ponto novo a uns 5 blocos, de um lado ou do outro, acima
      e.hopT = 0.55 + Math.random() * 0.45;
      const side = Math.abs(dx) > 2 * T && Math.random() < 0.75 ? -Math.sign(dx) : (Math.random() < 0.5 ? -1 : 1);
      for (let i = 0; i < 6; i++) {
        const gx = pcx + side * (4 + Math.random() * 2) * T, gy = pcy - (1.5 + Math.random() * 2.5) * T;
        if (!rectSolid(gx - e.w / 2, gy - e.h / 2, e.w, e.h) && losClear(gx, gy, pcx, pcy)) { e.goal = [gx, gy]; break; }
        if (i === 5) e.goal = [ecx + rnd(-T, T), ecy - T * 0.5];
      }
      const v = el1Near(e, 160); if (v > 0.1) sfx.el1Asas(v * 0.5);
    }
    const [gx, gy] = e.goal, k = Math.min(1, dt * 5);
    e.vx = lerp(e.vx, clamp((gx - ecx) * 4, -150, 150), k); e.vy = lerp(e.vy, clamp((gy - ecy) * 4, -150, 150), k);
  } else {
    const tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.7 + e.seed) * 30, ty = (e.homeY ?? ecy) + Math.sin(e.t * 1.6 + e.seed) * 10, k = Math.min(1, dt * 2);
    e.vx = lerp(e.vx, clamp((tx - ecx) * 2, -40, 40), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 2, -40, 40), k);
  }
  bounce();
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (Math.sign(e.vx) || e.facing);
  if (aggro && e.atkCD <= 0 && e.sees && dist < 8.5 * T && dist > 2.5 * T && Math.abs(dy) < 4 * T) {
    const [hx, hy] = el1SfMao(e);
    if (losClear(hx, hy, pcx, pcy)) { e.state = 'swind'; e.stateT = EL1_SOPRO; sfx.el1Sopro(Math.max(0.4, el1Near(e, 260))); }
    else e.atkCD = 0.4;
  }
};
const el1SfMao = e => [e.x + e.w / 2 + e.facing * 7, e.y + e.h / 2 - 2];
function el1SfDart(e) {
  const a = Math.atan2(e.y - pl.y, e.x - pl.x) + rnd(-0.5, 0.5), sp = 230;
  e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp - 40; e.state = 'dart'; e.stateT = 0.38; e.dartCD = gameTime + 1.2; e.goal = null;
  e.atkCD = Math.max(e.atkCD, 0.5);
  sfx.el1Asas(Math.max(0.4, el1Near(e)), 1.4);
}
// a Rajada: a meia-lua de vento em linha reta
function el1Rajada(e) {
  const [x, y] = el1SfMao(e), a = Math.atan2(pl.y + pl.h / 2 - y, pl.x + pl.w / 2 - x);
  el1Sopros.push({ x, y, vx: Math.cos(a) * EL1_RAJ_SP, vy: Math.sin(a) * EL1_RAJ_SP, a, d: 0, dmg: e.dmg * 0.7, hit: false, t: 0 });
  e.state = 'gust'; e.stateT = 0.3; e.atkCD = 2 + Math.random() * 0.9;
  e.vx = -Math.cos(a) * 70; e.vy = -Math.sin(a) * 70;   // o coice do sopro
  sfx.el1Rajada(Math.max(0.4, el1Near(e, 260)));
}

/* ---------- a rachadura de roseira (quem chama: o Cavaleiro de Espinhos, 254) ---------- */
// a espada cravada: a rachadura segue o chão, coluna a coluna, do pé até onde o herói pisa agora (ou até o chão acabar)
function el1Pisa(e, ox = 9) {
  const ecx = e.x + e.w / 2, fy = e.y + e.h, pcx = pl.x + pl.w / 2, dir = Math.sign(pcx - ecx) || e.facing;
  const pts = []; let x = ecx + dir * ox, y = fy, ok = true;
  const end = Math.abs(pcx - x) < 6 ? x : pcx;
  for (let n = 0; n < 90 && (dir > 0 ? x <= end : x >= end); n++) {
    const tx = Math.floor(x / T); let top = null;
    for (let k = -2; k <= 3; k++) { const ty = Math.floor((y - 1) / T) + k; if (solidAt(tx, ty) && !solidAt(tx, ty - 1) && !solidAt(tx, ty - 2)) { top = ty * T; break; } }
    if (top === null) { ok = false; break; }
    y = top; pts.push([x, y]); x += dir * 3;
  }
  if (!pts.length) pts.push([ecx + dir * ox, fy]);
  e.state = 'crack'; e.stateT = EL1_RACHA + 0.5; e.facing = dir;
  el1Rachas.push({ pts, t: 0, dur: EL1_RACHA, dmg: e.dmg, done: false, owner: e, dir, ok });
  burst(ecx + dir * ox, fy - 1, 12, '#3a3040', 80, 300, 0.6); el1Sparks(ecx + dir * ox, fy - 2, 5, EL1_FADA, 50, 200, 0.4);
  const v = el1Near(e, 320); if (v > 0.02) { sfx.el1Pisa(v); shake(2 + 3 * v); }
}
// os espinhos rompem: dano e enraizado em quem estiver em cima
function el1Rompe(R) {
  const [x, y] = R.pts[R.pts.length - 1];
  el1Raizes.push({ x, y, t: 0, seed: Math.random() * 100, dir: R.dir });
  burst(x, y - 2, 14, '#2e2436', 90, 300, 0.6); el1Sparks(x, y - 4, 8, EL1_FADA, 60, 120, 0.5);
  for (let i = 0; i < 6; i++) el1P({ x: x + rnd(-10, 10), y: y - rnd(4, 18), vx: rnd(-30, 30), vy: rnd(-60, -20), g: 120, life: 0.9, max: 0.9, col: i % 2 ? '#843466' : '#4c183c', size: 1 });   // pétalas
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
  if (e.type === 'caofada' && (e.state === 'stalk' || e.state === 'fade')) { e.showT = 1.2; e.vis = Math.max(e.vis ?? 0, 0.6); e.atkCD = Math.min(e.atkCD, 0.5); sfx.el1Bufo(0.7, 1.4); }
  if (e.type === 'fronteira' && e.state === 'vwind' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); }   // o golpe corta o salto
  if (e.type === 'arqueiro' && e.state === 'aim' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  if (e.type === 'silfide' && e.state !== 'dart' && (e.dartCD || 0) <= gameTime) el1SfDart(e);   // golpeada: dispara para longe
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!EL1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, el1Near(e, 260));
  if (e.type === 'fronteira' || e.type === 'arqueiro') { el1Sparks(cx, cy - 4, 8, EL1_LUA, 50, -20, 0.8); sfx.el1Morre(v); }
  else if (e.type === 'caofada') { el1Sparks(cx, cy, 10, EL1_FADA, 50, -20, 0.8); sfx.el1Latido(v * 0.6, 0.6); }
  else if (e.type === 'fatuo') { el1Pops.push({ x: cx, y: cy, t: 0, big: false }); el1Sparks(cx, cy, 10, EL1_LUA, 60, 0, 0.5); sfx.el1Estoura(v, false); }
  else if (e.type === 'silfide') { el1Sparks(cx, cy, 12, EL1_VENTO, 50, 40, 0.9); for (let i = 0; i < 5; i++) el1P({ x: cx + rnd(-4, 4), y: cy + rnd(-4, 4), vx: rnd(-30, 30), vy: rnd(-30, 10), g: 60, life: 1.1, max: 1.1, col: i % 2 ? '#5a8e5a' : '#86b47e', size: 1 }); sfx.el1Morre(v * 0.8, 1.3); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !EL1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'caofada') { e.state = 'stalk'; e.vis = 0; }
  else if (type === 'silfide') e.state = 'fly';
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

/* ---------- a cada quadro: as rajadas, as flechas, o grupo, os latidos, as rachaduras, os espinhos ---------- */
function el1Update(dt) {
  for (let i = el1Grupos.length - 1; i >= 0; i--) if (!el1GrupoTick(el1Grupos[i], dt)) el1Grupos.splice(i, 1);
  const pcx = pl.x + pl.w / 2;
  const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
  // a rajada: em linha até o alcance ou a pedra; pouco dano e o empurrão
  for (let i = el1Sopros.length - 1; i >= 0; i--) {
    const S = el1Sopros[i]; S.t += dt;
    const nx = S.x + S.vx * dt, ny = S.y + S.vy * dt; S.d += EL1_RAJ_SP * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T)) || S.d >= EL1_RAJ_MAX) { el1Sparks(S.x, S.y, 6, EL1_VENTO, 50, 0, 0.35); el1Sopros.splice(i, 1); continue; }
    S.x = nx; S.y = ny;
    if (!S.hit && hitsHero(S.x, S.y, 6)) {
      S.hit = true;
      const r = hurtPlayer(S.dmg, pcx - Math.sign(S.vx || 1) * 10, null, true);
      if (r !== 'none') {   // o vento empurra mesmo com o escudo erguido (só menos)
        const k = r === 'hit' ? 1 : 0.5; pl.vx = Math.sign(S.vx || 1) * 380 * k; pl.vy = Math.min(pl.vy, -160 * k); pl.onGround = false;
        el1Sparks(pl.x + pl.w / 2, pl.y + pl.h / 2, 8, EL1_VENTO, 70, 0, 0.4);
      }
      el1Sopros.splice(i, 1); continue;
    }
    if (Math.random() < dt * 40) el1P({ x: S.x + rnd(-3, 3), y: S.y + rnd(-5, 5), vx: -S.vx * 0.15, vy: -S.vy * 0.15, g: 0, life: 0.3, max: 0.3, col: EL1_VENTO[(Math.random() * 3) | 0], size: 1 });
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
  // a rachadura corre pelo chão; no fim, os espinhos
  for (let i = el1Rachas.length - 1; i >= 0; i--) {
    const R = el1Rachas[i]; R.t += dt;
    if (!R.done && R.t >= R.dur) { R.done = true; el1Rompe(R); }
    if (Math.random() < dt * 25 && !R.done) { const p = R.pts[Math.min(R.pts.length - 1, Math.floor(R.pts.length * R.t / R.dur))]; burst(p[0], p[1] - 1, 1, '#3a3040', 40, 300, 0.4); }
    if (R.t > R.dur + 1.2) el1Rachas.splice(i, 1);
  }
  for (let i = el1Raizes.length - 1; i >= 0; i--) { el1Raizes[i].t += dt; if (el1Raizes[i].t > 1) el1Raizes.splice(i, 1); }
  for (let i = el1Pops.length - 1; i >= 0; i--) { el1Pops[i].t += dt; if (el1Pops[i].t > 0.4) el1Pops.splice(i, 1); }
  for (let i = el1Aneis.length - 1; i >= 0; i--) { el1Aneis[i].t += dt; if (el1Aneis[i].t > 0.45) el1Aneis.splice(i, 1); }
  for (const e of enemies) if (e.arcFx) { e.arcFx.t += dt; if (e.arcFx.t > 0.2) e.arcFx = null; }
}
HOOK.update.push(el1Update);
function clearEl1Fx() { el1Fx.length = 0; el1Sopros.length = 0; el1Aneis.length = 0; el1Flechas.length = 0; el1Grupos.length = 0; el1Rachas.length = 0; el1Raizes.length = 0; el1Pops.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearEl1Fx(); el1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: os olhos, a lâmina acesa, as luzinhas, os olhos do cão, as rachaduras, os espinhos
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !EL1_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'fatuo') addL(cx, cy, e.state === 'swell' || e.state === 'dash' ? 0.6 : 0.45);
    else if (e.type === 'caofada') { if ((e.vis ?? 1) > 0.5) addL(cx + e.facing * 8, e.y + 2, e.state === 'bark' ? 0.36 : 0.2); }
    else if (e.type === 'silfide') addL(cx, cy, e.state === 'swind' ? 0.42 : 0.22);
    else addL(cx, cy, el1FrHot(e) || e.state === 'slash' || e.state === 'vcut' || e.state === 'aim' ? 0.45 : 0.24);
  }
  for (const S of el1Sopros) addL(S.x, S.y, 0.32);
  for (const R of el1Rachas) if (!R.done) { const p = R.pts[Math.min(R.pts.length - 1, Math.floor(R.pts.length * R.t / R.dur))]; addL(p[0], p[1] - 4, 0.4); }
  for (const R of el1Raizes) addL(R.x, R.y - 10, 0.5 * (1 - R.t));
}; }

// a luz aditiva: o arco do corte, a rajada, as rachaduras, os espinhos, os estouros, os latidos
HOOK.drawGlow.push((cx, cy) => {
  const G = EL1.GL;
  for (const S of el1Sopros) { lc.globalAlpha = 0.4; lc.drawImage(G.vento, Math.round(S.x - cx) - 9, Math.round(S.y - cy) - 9); }
  for (const R of el1Rachas) {
    const n = R.done ? R.pts.length : Math.floor(R.pts.length * R.t / R.dur), f = R.done ? Math.max(0, 1 - (R.t - R.dur) / 1.2) : 1;
    lc.globalAlpha = 0.2 * f; for (let j = 0; j < n; j += 3) lc.drawImage(G.fada, Math.round(R.pts[j][0] - cx) - 5, Math.round(R.pts[j][1] - cy) - 6);
    if (!R.done && n > 0) { const p = R.pts[Math.min(n, R.pts.length - 1)]; lc.globalAlpha = 0.55; lc.drawImage(G.fadaG, Math.round(p[0] - cx) - 12, Math.round(p[1] - cy) - 14); }
  }
  for (const R of el1Raizes) { lc.globalAlpha = 0.45 * (1 - R.t); lc.drawImage(G.fadaG, Math.round(R.x - cx) - 12, Math.round(R.y - cy) - 22); }
  for (const p of el1Pops) { lc.globalAlpha = (p.big ? 0.9 : 0.6) * (1 - p.t / 0.4); lc.drawImage(G.luaM, Math.round(p.x - cx) - 16, Math.round(p.y - cy) - 16); }
  for (const A of el1Aneis) { lc.globalAlpha = 0.35 * (1 - A.t / 0.45); lc.drawImage(G.fadaG, Math.round(A.x - cx) - 12, Math.round(A.y - cy) - 12); }
  for (const e of enemies) {
    if (e.dead || e.type !== 'fronteira' || !e.arcFx) continue;
    const [x, y] = el1Pt(e, ...el1Tip(e.arcFx.n === 2 ? 5 : e.arcFx.n === 3 ? 8 : 4)); lc.globalAlpha = 0.4 * (1 - e.arcFx.t / 0.2); lc.drawImage(G.luaG, Math.round(x - cx) - 10, Math.round(y - cy) - 10);
  }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): as flechas, os espinhos
HOOK.drawWorld.push((cx, cy) => {
  for (const F of el1Flechas) {
    const sp = Math.hypot(F.vx, F.vy) || 1, ux = F.vx / sp, uy = F.vy / sp, x = F.x - cx, y = F.y - cy;
    lc.globalAlpha = F.stuck ? Math.min(1, F.stuck * 2) : 1;
    for (let k = 0; k < 9; k++) { lc.fillStyle = k < 2 ? '#e6eef8' : k > 6 ? '#f8fbff' : k === 2 ? '#8a9abc' : '#a09688'; lc.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), 1, 1); }
    lc.fillStyle = '#c2d0e8'; lc.fillRect(Math.round(x - ux * 7 - uy), Math.round(y - uy * 7 + ux), 1, 1); lc.fillRect(Math.round(x - ux * 7 + uy), Math.round(y - uy * 7 - ux), 1, 1);
  }
  lc.globalAlpha = 1;
  // os espinhos: ramos de roseira-brava saindo do chão em leque, com os acúleos para os lados, sobem rápido, ficam e
  // voltam para baixo; uma rosa negra no alto de alguns
  for (const R of el1Raizes) {
    const up = R.t < 0.12 ? R.t / 0.12 : R.t > 0.7 ? Math.max(0, 1 - (R.t - 0.7) / 0.3) : 1;
    for (let j = 0; j < 7; j++) {
      const ox = (j - 3) * 3.6 + Math.sin(R.seed + j * 2.3) * 1.2, H = (10 + ((j * 7 + R.seed * 3) % 9) + (j === 3 ? 8 : 0)) * up, lean = (j - 3) * 0.22;
      let tx = 0, ty = 0;
      for (let y = 0; y < H; y++) {
        const t = y / Math.max(1, H), w = Math.max(0, Math.round((1 - t) * 1.6)), x = Math.round(R.x - cx + ox + lean * y + Math.sin(y * 0.45 + j) * 0.9), yy = Math.round(R.y - cy - y);
        lc.fillStyle = '#080c0a'; lc.fillRect(x - w - 1, yy, w * 2 + 3, 1);
        lc.fillStyle = t > 0.85 ? '#3e5642' : (y % 4 === 1 ? '#18241c' : '#223226'); lc.fillRect(x - w, yy, w * 2 + 1, 1);
        if (w > 0) { lc.fillStyle = '#2e4232'; lc.fillRect(x - w, yy, 1, 1); }
        if (y % 4 === 2 && t < 0.85) { const s = ((y >> 2) + j) % 2 ? 1 : -1; lc.fillStyle = '#5a6a4a'; lc.fillRect(x + s * (w + 2), yy - 1, 1, 1); lc.fillStyle = '#101812'; lc.fillRect(x + s * (w + 1), yy, 1, 1); }   // o acúleo
        tx = x; ty = yy;
      }
      if (j % 3 === 1 && up > 0.6) {   // a rosa negra
        lc.fillStyle = '#12060e'; lc.fillRect(tx - 2, ty - 2, 4, 3); lc.fillStyle = '#4c183c'; lc.fillRect(tx - 1, ty - 2, 3, 2); lc.fillStyle = '#843466'; lc.fillRect(tx - 1, ty - 2, 1, 1); lc.fillStyle = '#22091a'; lc.fillRect(tx, ty - 1, 1, 1);
      }
    }
  }
});
// por cima do escuro: o arco prata do corte, as faíscas na lâmina, a ponta da flecha, os fátuos, os anéis dos latidos,
// o vento da sílfide, a rachadura acesa, os pontinhos verdes dos espinhos, os estouros
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -60 || fx > VW + 60 || fy < -60 || fy > VH + 60) continue;
    if (e.type === 'fronteira' && e.arcFx) {
      // o crescente do corte: um arco fino de prata na frente dela (o de trás, baixo e largo)
      const p = e.arcFx.t / 0.2, up = e.arcFx.n === 2, low = e.arcFx.n === 3, r = low ? 15 : 13, n = 16;
      lc.globalAlpha = 1 - p;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), a = up ? lerp(1.2, -1.5, t) : low ? lerp(-0.9, 1.3, t) : lerp(-1.4, 1.1, t); if (t > 0.3 + p * 0.9) continue;
        const x = fx + Math.cos(a) * r * e.facing + e.facing * 2, y = fy - (low ? 9 : 13) + Math.sin(a) * r * (low ? 0.6 : 0.9);
        lc.fillStyle = i % 3 === 0 ? '#ffffff' : '#c8e0ff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1); lc.fillStyle = '#5a8ede'; lc.fillRect(Math.round(x - Math.cos(a) * e.facing), Math.round(y - Math.sin(a)), 1, 1);
      }
    } else if (e.type === 'fronteira' && (e.state === 'wind' || e.state === 'vwind')) {
      // faíscas de prata subindo pela lâmina, da guarda até a ponta
      const k = el1FrPose(e), o = EL1_FR[k], [tx, ty] = el1Tip(k), q = clamp(1 - e.stateT / (e.state === 'wind' ? EL1_LAMINA : EL1_SALTO), 0, 1);
      for (let j = 0; j < 3; j++) { const t = (now * 2.2 + j / 3) % 1; if (t > 0.3 + q * 0.7) continue; lc.fillStyle = j ? '#c8e0ff' : '#ffffff'; lc.fillRect(Math.round(fx + (lerp(o.hn[0], tx, t) - EL1_BX) * e.facing), Math.round(fy - 1 - (27 - lerp(o.hn[1], ty, t))), 1, 1); }
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
    } else if (e.type === 'caofada' && e.state === 'bark') {
      const o = EL1.SB[3], x = fx + (o.head[0] + 1.2 - 15) * e.facing, y = fy - 1 - (15 - (o.head[1] - 0.6));
      lc.fillStyle = '#f4fff0'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
    } else if (e.type === 'silfide' && e.state === 'swind') {
      // as linhas de vento girando em volta das mãos, apertando
      const q = clamp(1 - e.stateT / EL1_SOPRO, 0, 1), y = Math.round(fy - e.h / 2 + el1SfBob(e)) - 2, x = fx + e.facing * 7, r = 10 - q * 6;
      for (let j = 0; j < 4; j++) for (let s = 0; s < 4; s++) { const a = now * 8 + j * 1.57 + s * 0.18; lc.globalAlpha = (0.4 + q * 0.5) * (1 - s * 0.2); lc.fillStyle = s ? '#c8e4f0' : '#ffffff'; lc.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.7), 1, 1); }
      lc.globalAlpha = 1;
    }
  }
  // os latidos: um anel de pontinhos verde-pálidos que abre na frente da boca
  for (const A of el1Aneis) {
    const q = A.t / 0.45, r = 3 + q * 13, n = 14;
    lc.globalAlpha = (1 - q) * 0.9; lc.fillStyle = q < 0.3 ? '#f4fff0' : '#b8f0c8';
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; lc.fillRect(Math.round(A.x - cx + Math.cos(a) * r), Math.round(A.y - cy + Math.sin(a) * r * 0.8), 1, 1); }
  }
  // a rajada: a meia-lua de vento, aberta para trás
  for (const S of el1Sopros) {
    const ux = Math.cos(S.a), uy = Math.sin(S.a), nx = -uy, ny = ux;
    for (let i = -5; i <= 5; i++) {
      const b = Math.abs(i) / 5, back = b * b * 5, x = S.x - cx + nx * i * 1.1 - ux * back, y = S.y - cy + ny * i * 1.1 - uy * back;
      lc.globalAlpha = 0.9 - b * 0.5; lc.fillStyle = b < 0.3 ? '#ffffff' : '#c8e4f0'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (b < 0.7) { lc.globalAlpha = 0.4; lc.fillRect(Math.round(x - ux * 2), Math.round(y - uy * 2), 1, 1); }
    }
  }
  lc.globalAlpha = 1;
  // a rachadura: a linha escura com o veio verde-pálido aceso, correndo até o alvo
  for (const R of el1Rachas) {
    const n = R.done ? R.pts.length : Math.floor(R.pts.length * R.t / R.dur), f = R.done ? Math.max(0, 1 - (R.t - R.dur) / 1.2) : 1;
    for (let j = 0; j < n; j++) {
      const [x, y] = R.pts[j], wob = Math.round(Math.sin(j * 1.7 + R.dir) * 0.7), sx = Math.round(x - cx), sy = Math.round(y - cy) - 1 + wob;
      lc.globalAlpha = f; lc.fillStyle = '#080c0a'; lc.fillRect(sx, sy, 3, 1);
      lc.fillStyle = j % 4 === 0 ? '#f4fff0' : '#5ab88a'; lc.fillRect(sx + 1, sy, 1, 1);
      if (j % 5 === 2) { lc.fillStyle = '#18241c'; lc.fillRect(sx + 1, sy - 1, 1, 1); lc.fillRect(sx + 1, sy - 2, 1, 1); }   // um broto de espinho
    }
    if (!R.done && n < R.pts.length) {   // o alvo: um círculo de pontinhos verdes no chão onde os espinhos vão romper
      const [x, y] = R.pts[R.pts.length - 1], q = R.t / R.dur;
      lc.globalAlpha = 0.5 + 0.5 * q; lc.fillStyle = Math.floor(now * 12) % 2 ? '#b8f0c8' : '#5ab88a';
      for (let i = -EL1_RAIZ_W; i <= EL1_RAIZ_W; i += 3) lc.fillRect(Math.round(x + i - cx), Math.round(y - cy) - 1 - (Math.abs(i) < 4 ? 1 : 0), 1, 1);
    }
  }
  lc.globalAlpha = 1;
  // os espinhos: pontinhos de luz de fada presos nos ramos
  for (const R of el1Raizes) {
    const up = R.t < 0.12 ? R.t / 0.12 : R.t > 0.7 ? Math.max(0, 1 - (R.t - 0.7) / 0.3) : 1;
    lc.fillStyle = '#b8f0c8';
    for (let j = 0; j < 7; j += 2) { const ox = (j - 3) * 3.6 + Math.sin(R.seed + j * 2.3) * 1.2, H = (10 + ((j * 7 + R.seed * 3) % 9) + (j === 3 ? 8 : 0)) * up; for (let y = 3; y < H - 3; y += 5) lc.fillRect(Math.round(R.x - cx + ox + (j - 3) * 0.22 * y + Math.sin(y * 0.45 + j) * 0.9), Math.round(R.y - cy - y), 1, 1); }
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
  // a lâmina acendendo: um fio de vidro subindo (p: o tom)
  el1Lamina(v = 1, p = 1) { tone(780 * p, 0.4, 'sine', 0.018 * v, 600 * p); noise(0.35, 0.012 * v, 5200 * p, 'bandpass', 0, 3); for (let k = 0; k < 3; k++) tone(2200 * p + k * 260, 0.05, 'sine', 0.007 * v, 0, 0.12 + k * 0.08); },
  el1Corte(v = 1, n = 1) { noise(0.12, 0.07 * v, n === 2 ? 3400 : n === 3 ? 2200 : 2600, 'bandpass', 0, 1.2); tone(n === 2 ? 1400 : n === 3 ? 900 : 1100, 0.1, 'sine', 0.02 * v, -500); },
  el1Salto(v = 1, big = 0) { noise(big ? 0.22 : 0.12, (big ? 0.05 : 0.03) * v, big ? 800 : 1200, 'bandpass', 0, 1); if (big) noise(0.3, 0.02 * v, 3000, 'highpass', 0.05); },
  // o arco: a corda rangendo, o "tuc" da flecha saindo
  el1Corda(v = 1) { tone(140, 0.6, 'sawtooth', 0.006 * v, 60); noise(0.6, 0.012 * v, 900, 'bandpass', 0, 4); tone(1600, 0.5, 'sine', 0.004 * v, 400, 0.2); },
  el1Flecha(v = 1) { for (let k = 0; k < 3; k++) { noise(0.06, 0.05 * v, 1800 + k * 300, 'bandpass', k * 0.03, 2); tone(320 - k * 30, 0.05, 'triangle', 0.02 * v, -120, k * 0.03); } },
  // o cão-fada: o bufo grave, o latido fundo (k: qual dos três, sobe um pouco), o bote, o sumiço
  el1Bufo(v = 1, p = 1) { noise(0.35, 0.03 * v, 300 * p, 'lowpass', 0, 1); tone(60 * p, 0.35, 'sawtooth', 0.012 * v, -10); },
  el1Latido(v = 1, k = 1) { const f = 120 + k * 14; tone(f, 0.16, 'sawtooth', 0.05 * v, -50); tone(f * 2, 0.1, 'square', 0.014 * v, -120); noise(0.14, 0.07 * v, 700 + k * 80, 'bandpass', 0, 1.4); tone(f * 0.5, 0.25, 'sine', 0.05 * v, -20, 0.02); },
  el1Bote(v = 1, p = 1) { noise(0.3, 0.08 * v, 700 * p, 'lowpass'); tone(160 * p, 0.3, 'sawtooth', 0.03 * v, -90); tone(90 * p, 0.35, 'square', 0.012 * v, -40, 0.05); },
  el1Some(v = 1) { for (let k = 0; k < 5; k++) tone(2400 - k * 260, 0.08, 'sine', 0.008 * v, -200, k * 0.05); noise(0.3, 0.01 * v, 6000, 'highpass'); },
  // os fátuos: sininhos de vidro
  el1Fatuo(v = 1) { const f = 1800 + Math.random() * 900; tone(f, 0.25, 'sine', 0.012 * v, 30); tone(f * 1.5, 0.2, 'sine', 0.005 * v, -30, 0.06); },
  el1Incha(v = 1) { for (let k = 0; k < 6; k++) tone(1200 + k * 180, 0.1, 'sine', 0.012 * v, 200, k * 0.09); tone(600, 0.6, 'triangle', 0.01 * v, 600); },
  el1Lanca(v = 1) { tone(2600, 0.12, 'sine', 0.014 * v, -1400); noise(0.08, 0.02 * v, 5000, 'highpass'); },
  el1Estoura(v = 1, big = false) { tone(big ? 1400 : 2000, 0.2, 'sine', 0.03 * v, -900); noise(0.12, 0.04 * v, 4800, 'highpass'); for (let k = 0; k < 3; k++) tone(2600 + Math.random() * 1200, 0.06, 'sine', 0.01 * v, 0, 0.04 + k * 0.05); },
  el1Suga() { for (let k = 0; k < 4; k++) tone(900 - k * 140, 0.14, 'sine', 0.02, -160, k * 0.06); },
  // a sílfide: o zumbido das asas, o vento enchendo, a rajada
  el1Asas(v = 1, p = 1) { noise(0.18, 0.02 * v, 180 * p, 'bandpass', 0, 6); tone(90 * p, 0.18, 'square', 0.004 * v, 10); },
  el1Sopro(v = 1) { noise(EL1_SOPRO, 0.035 * v, 900, 'bandpass', 0, 0.9); tone(300, EL1_SOPRO, 'sine', 0.006 * v, 500); },
  el1Rajada(v = 1) { noise(0.4, 0.08 * v, 1400, 'bandpass', 0, 0.7); noise(0.25, 0.03 * v, 4000, 'highpass', 0.04); },
  // os espinhos: a espada cravando, a rachadura, os ramos rompendo
  el1Pisa(v = 1) { tone(52, 0.5, 'sine', 0.12 * v, -18); noise(0.35, 0.12 * v, 260, 'lowpass'); for (let k = 0; k < 6; k++) noise(0.03, 0.04 * v, 1800 + Math.random() * 1200, 'bandpass', 0.08 + k * 0.07, 3); },
  el1Raiz(v = 1) { noise(0.3, 0.1 * v, 600, 'lowpass'); for (let k = 0; k < 7; k++) noise(0.03, 0.05 * v, 2200 + k * 200, 'bandpass', k * 0.02, 5); tone(130, 0.25, 'sawtooth', 0.016 * v, 160); },
  el1Morre(v = 1, p = 1) { tone(880 * p, 0.6, 'sine', 0.025 * v, -300); tone(1320 * p, 0.5, 'sine', 0.01 * v, -500, 0.05); noise(0.4, 0.015 * v, 5000, 'highpass'); }
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
