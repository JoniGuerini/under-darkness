'use strict';

/* ================= o Reino Élfico: o Guardião e a Corte dos Espinhos, parte dois =================
   Cinco dos dez bichos da décima camada (docs/camadas/11-reino-elfico.md, seção 6 e "Revamp de 2026-10-21"; os outros
   cinco estão no 253). Revamp de 2026-10-21: saíram o Hipogrifo, o Espectro Élfico, o Magíster Sangrento e o Caçador
   Vendado (os elfos sangrentos e o caçador de demônios do Warcraft); ficou o Guardião do Salão; entraram a Carpideira,
   a Encantadora Mascarada, a Musa Faminta e o Cavaleiro de Espinhos. Os da Corte (a corte élfica que seguiu a Dama
   para baixo da terra e virou a Corte Sem Lua: máscaras, roseiras, festas que não acabam) vestem ameixa, preto-violeta
   e verde-espinho, com os avisos em verde-pálido de fada e rosa-escuro.
   - o Guardião do Salão (guardiao), alto, de armadura completa de folhas de prata, elmo alado, escudo alto e lança;
     anda devagar e vira devagar. O escudo bloqueia tudo pela frente (só leva dano por trás ou de cima). A ponta da
     lança acende (0,6 s): estocada longa; a cada 3 golpes, o escudo acende (0,6 s) e vem a investida que empurra;
   - a Carpideira (carpideira), a bean sídhe do folclore: a mulher cinza de capuz e mortalha, os cabelos brancos
     compridos, o pente de prata na mão, os olhos de borda vermelha de tanto chorar; atravessa paredes e voa devagar.
     Para, a cabeça vai para trás e a luz em volta treme (1 s): o pranto sai em anel; quem é pego leva dano e é
     EMPURRADO para fora do anel;
   - a Encantadora Mascarada (mascarada), a dama da Corte de vestido ameixa, a máscara de osso com galhos de chifre e
     a coroa de espinhos; três rosas negras giram em volta dela. As rosas param e abrem (0,8 s): saem as pétalas-navalha,
     três, que perseguem o herói devagar; as rosas brotam de novo uma a uma. Se o herói chega perto, ela some num
     redemoinho de pétalas e aparece a uns 5 blocos; no lugar fica um encanto (a figura dela, tremeluzindo) que avança
     sobre o herói por 1,2 s e se desfaz em pétalas, sem dano: quem conhece o truque não se assusta;
   - a Musa Faminta (musa), a leanan sídhe: a musa pálida de cabelo de cobre e a lira de osso, que dá inspiração e
     come a vida. Fica a 5 a 7 blocos. Toca e canta (0,9 s): um fio de luz verde-pálida cresce dela até o herói (o
     aviso); se chega, prende: por até 3 s, a cada meio segundo tira vida do herói e cura a si, e o herói fica enlevado
     (lento e sem magia; elEnlevar, 250; o 259 faz valer). O fio rompe se o herói passa de 9 blocos, se uma pedra fica
     no meio ou se ela é golpeada;
   - o Cavaleiro de Espinhos (cavespinho), o pesado da Corte: a armadura de casca e espinho, o elmo com a crista de
     galhos, a capa ameixa e o montante de aço escuro com a roseira enrolada na lâmina. Perto, ergue o montante (0,7 s)
     e desce num golpe que treme o chão. De 3 a 11 blocos, ergue a espada de ponta para baixo (0,5 s) e a crava: a
     rachadura de roseira corre pelo chão até o herói e os espinhos rompem (dano e enraizado 1,2 s; el1Pisa / el1Rompe
     do 253).
   O 255 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache),
   rampas de 6 tons com luz de cima à esquerda; brilhos pelo HOOK.drawGlow e EYES_E, os pontinhos acesos por cima do
   escuro (HOOK.drawTop). Materiais e bases do 257 (filtrados). Prefixo el2. */

/* ---------- números ---------- */
Object.assign(ET, {
  guardiao: { name: 'Guardião do Salão', w: 10, h: 26, hp: 220, dmg: 27, xp: 46, kb: 0.2, fly: false, blood: '#b83a48' },
  carpideira: { name: 'Carpideira', w: 10, h: 22, hp: 90, dmg: 21, xp: 30, kb: 0.6, fly: true, phase: true, blood: '#d8dcd8' },
  mascarada: { name: 'Encantadora Mascarada', w: 9, h: 23, hp: 100, dmg: 24, xp: 34, kb: 0.8, fly: false, blood: '#b83a48' },
  musa: { name: 'Musa Faminta', w: 9, h: 22, hp: 95, dmg: 22, xp: 34, kb: 0.8, fly: false, blood: '#b83a48' },
  cavespinho: { name: 'Cavaleiro de Espinhos', w: 14, h: 32, hp: 300, dmg: 31, xp: 52, kb: 0.12, fly: false, blood: '#4a6a3a' }
});
const EL2_TYPES = ['guardiao', 'carpideira', 'mascarada', 'musa', 'cavespinho'];
// materiais e bases do 257; filtradas agora e de novo a cada mundo
const EL2_DROPS = {
  guardiao: [['folha_prata', 0.4], ['min_lunarita', 0.1], ['pocao', 0.08], ['escudo_folha', 0.02], ['elmo_alado', 0.01]],
  carpideira: [['lagrima_carpideira', 0.5], ['min_lunarita', 0.06], ['pocao', 0.07]],
  mascarada: [['rosa_negra', 0.4], ['min_lunarita', 0.08], ['pocao', 0.08]],
  musa: [['rosa_negra', 0.3], ['essencia_fatua', 0.2], ['min_lunarita', 0.08], ['pocao', 0.08]],
  cavespinho: [['rosa_negra', 0.5], ['min_lunarita', 0.12], ['pocao', 0.1], ['lamina_folha', 0.02], ['escudo_folha', 0.015]]
};
function el2Tables() { for (const k of EL2_TYPES) DROPS[k] = EL2_DROPS[k].filter(([id]) => ITEMS[id]); }
el2Tables();
Object.assign(NAV_WALKERS, { guardiao: 1, mascarada: 1, musa: 1, cavespinho: 1 });
Object.assign(CV_STEP, { guardiao: 1, mascarada: 1, musa: 1, cavespinho: 1 });

const EL2_LANCA_W = 0.6, EL2_ESCUDO_W = 0.6, EL2_PRANTO = 1, EL2_ROSAS = 0.8, EL2_CANTO = 0.9, EL2_MONTANTE = 0.7, EL2_CRAVA = 0.5;
const EL2_ANEL_R = 7 * T, EL2_ANEL_T = 0.55;     // o pranto: raio e tempo para abrir
const EL2_PET_SP = 80, EL2_PET_VIRA = 1.9;        // as pétalas: velocidade e quanto viram por segundo
const EL2_ENCANTO = 1.2;                          // quanto dura o encanto que fica no lugar da mascarada
const EL2_FIO_MAX = 3, EL2_FIO_LONGE = 9 * T;     // a musa: quanto o fio segura e até onde

/* ---------- as poses ----------
   o guardião, no desenho de 42 x 34 (o corpo no x 14, os pés na linha 33): sh o centro do escudo (na mão de longe);
   hn a mão da lança, a o ângulo dela (a ponta fica a 16 px da mão, o cabo a 9 para trás) */
const EL2_GBX = 14;
const EL2_GD = [
  { low: 0, lean: 0, b: [12, 33], f: [16, 33], sh: [19.4, 18.6], hn: [11.4, 19.6], a: -1.5 },        // 0 parado: a lança de pé
  { low: 0.5, lean: 0.4, b: [10.2, 33], f: [17.8, 33], sh: [19.8, 18.8], hn: [11.6, 19.6], a: -1.38 },
  { low: 0, lean: 0.4, b: [15.8, 33], f: [12.4, 32.6], sh: [19.6, 18.4], hn: [11, 19.2], a: -1.6 },
  { low: 0.8, lean: -0.6, b: [10.4, 33], f: [17.4, 33], sh: [19, 18.8], hn: [9, 15.4], a: -0.04 },     // 3 a lança puxada (aviso)
  { low: 1, lean: 1.4, b: [9.6, 33], f: [19, 33], sh: [20.6, 19.2], hn: [21.4, 15.6], a: 0 },          // 4 a estocada
  { low: 2, lean: 0.8, b: [9.4, 33], f: [17.6, 33], sh: [20.4, 17.6], hn: [9.6, 18.6], a: -0.5 },       // 5 atrás do escudo (aviso)
  { low: 1.4, lean: 2.2, b: [8.4, 33], f: [20.2, 33], sh: [23.4, 18.2], hn: [10.6, 18.6], a: -0.35 }   // 6 a investida
];
const EL2_PONTA_L = 16;
const el2GTip = k => { const o = EL2_GD[k]; return [o.hn[0] + Math.cos(o.a) * EL2_PONTA_L, o.hn[1] + Math.sin(o.a) * EL2_PONTA_L]; };
// a mascarada e a musa (24 x 28, o corpo no x 11, os pés na linha 27): hn a mão de perto, hf a de longe, sw a barra
const EL2_MBX = 11;
const EL2_MG = [
  { lean: 0, sw: 0, hn: [14, 16.4], hf: [8.6, 16.6] },
  { lean: 0.4, sw: 1, hn: [14.4, 16], hf: [8.2, 16.2] },
  { lean: 0.4, sw: -1, hn: [13.6, 16.6], hf: [9, 16] },
  { lean: -0.4, sw: 0, hn: [15.6, 5.6], hf: [7, 5.8], up: 1 },          // 3 as mãos erguidas (aviso)
  { lean: 0.8, sw: 0.6, hn: [18.6, 11.4], hf: [7.4, 14.4] }              // 4 lançou
];
const EL2_MU = [
  { lean: 0, sw: 0, hn: [13.6, 16.6], ly: [8.6, 15.2], hy: 0 },
  { lean: 0.4, sw: 1, hn: [14.2, 16.2], ly: [8.4, 15], hy: 0 },
  { lean: 0.4, sw: -1, hn: [13.4, 16.8], ly: [8.8, 15.4], hy: 0 },
  { lean: -0.6, sw: 0, hn: [16.8, 11.4], ly: [7.8, 11.6], hy: -0.6, sing: 1 },   // 3 cantando (aviso): a cabeça erguida, a lira no peito
  { lean: 1, sw: 0.6, hn: [19, 12.6], ly: [8.4, 12.8], hy: 0.2, sing: 1 }         // 4 o fio preso: inclinada, a mão estendida
];
// o cavaleiro (50 x 50, o corpo no x 18, os pés na linha 49): hn as mãos no punho do montante, g o ângulo da lâmina
const EL2_KBX = 18, EL2_KFY = 49, EL2_LAM = 19;
const EL2_CK = [
  { low: 0, lean: 0, b: [15, 49], f: [21.5, 49], hn: [24, 34], g: 1.3 },          // 0 parado: a ponta apoiada no chão
  { low: 0.6, lean: 0.5, b: [13, 49], f: [23.5, 49], hn: [24.4, 33.6], g: 1.2 },  // 1-2 andando
  { low: 0, lean: 0.5, b: [21, 49], f: [15.6, 48.4], hn: [23.6, 34.2], g: 1.35 },
  { low: 1, lean: -1, b: [13, 49], f: [22, 49], hn: [15, 16], g: -2.5 },          // 3 o montante erguido atrás (aviso)
  { low: 2.5, lean: 2, b: [11.5, 49], f: [24.5, 49], hn: [27, 33], g: 0.62 },     // 4 o golpe no chão
  { low: 0.4, lean: 0.2, b: [14, 49], f: [22, 49], hn: [23, 21], g: 1.57 },       // 5 a espada erguida de ponta para baixo (aviso)
  { low: 2, lean: 1, b: [13, 49], f: [23, 49], hn: [25, 36], g: 1.5 }             // 6 cravada
];
const el2KTip = k => { const o = EL2_CK[k]; return [o.hn[0] + Math.cos(o.g) * EL2_LAM, o.hn[1] + Math.sin(o.g) * EL2_LAM]; };

/* ================= arte ================= */
const EL2 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const ER = {
  pele: R6(['#3c2c30', '#6e5458', '#a8868a', '#d0b2ac', '#ead6cc', '#fbf0e8']),
  prata: R6(['#161c2c', '#323c56', '#58668a', '#8a9abc', '#c2d0e8', '#f2f8ff']),
  lua: R6(['#0a1430', '#142a5c', '#22468e', '#3466b8', '#5a8ede', '#9cc0f4']),
  negro: R6(['#050408', '#0c0a12', '#16121e', '#221c2c', '#30283c', '#443a52']),
  aco: R6(['#0c0e10', '#181c20', '#2a3036', '#40484e', '#5e686e', '#86929a']),       // o aço escuro do montante
  mortalha: R6(['#161c1a', '#28302c', '#3e4842', '#58625c', '#7a847c', '#a6aea6']),   // a mortalha cinza-verde da carpideira
  cabeloB: R6(['#4e525a', '#7a7e86', '#a4a8ae', '#c8cace', '#e4e6e8', '#ffffff']),     // os cabelos brancos
  cinzaPele: R6(['#2a2c30', '#46494e', '#686c70', '#8e9294', '#b4b8b8', '#d8dad8']),    // a pele cinza da morta
  ameixa: R6(['#140a14', '#24121f', '#381c30', '#4e2844', '#68385a', '#864c74']),       // o ameixa da Corte
  rosa: R6(['#12060e', '#22091a', '#360f2a', '#4c183c', '#662450', '#843466']),         // a rosa negra
  espinho: R6(['#080c0a', '#101812', '#18241c', '#223226', '#2e4232', '#3e5642']),      // o verde-preto dos espinhos
  osso: R6(['#3e3a32', '#625c50', '#8a8270', '#b0a890', '#d4ccb4', '#f2ecd8']),         // a máscara de osso
  casca: R6(['#0e0c0a', '#1c1814', '#2c2620', '#3e362c', '#544a3c', '#6e6250']),        // a armadura de casca do cavaleiro
  cabeloN: R6(['#06040a', '#100a16', '#1c1226', '#2a1c38', '#3a284a', '#4e3a60']),      // o cabelo preto-violeta da mascarada
  cobre: R6(['#2a0e06', '#4a1c0c', '#722e14', '#9a4420', '#c4642e', '#e8924a']),        // o cabelo de cobre da musa
  veu: R6(['#2a3430', '#4a5a54', '#6e8078', '#96a89e', '#c0d0c4', '#eef8f0']),          // o vestido de véu da musa
  fada: R6(['#0e2a1c', '#1c4a32', '#2e6e4a', '#4a9468', '#7cc496', '#c0f0d0'])          // a luz de fada
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
// polígono cheio (par-ímpar); f(x, y) -> o tom (na rampa R) ou [rampa, tom] ou null
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
      const v = f(x, y); if (v === null) continue;
      if (typeof v === 'number') P.put(x, y, R, v); else P.put(x, y, v[0], v[1]);
    }
  }
}
function perna(P, hx, hy, fx, fy, R, Rb, base, s, air, r = 1.25) {
  const kx = (hx + fx) / 2 + (air ? 2.4 : 0.9), ky = (hy + fy) / 2 - (air ? 1 : 0);
  tubo(P, hx, hy, kx, ky, r, r * 0.8, R, base, s);
  tubo(P, kx, ky, fx, fy - 1.2, r * 0.8, r * 0.65, Rb, base + 0.2, s + 1);
  P.line(fx - 0.6, fy, fx + 1.8, fy, Rb, base - 0.5); P.put(fx + 1.8, fy - 0.2, Rb, base + 0.6);
}
function braco(P, sx, sy, hx, hy, R, Rm, base, s, Rh = ER.pele, r = 1) {
  const ex = (sx + hx) / 2 - 0.4, ey = (sy + hy) / 2 + 1.2;
  tubo(P, sx, sy, ex, ey, r, r * 0.9, R, base, s); tubo(P, ex, ey, hx, hy, r * 0.9, r * 0.75, Rm || R, base + 0.2, s + 1);
  P.put(hx, hy, Rh, base + 0.8);
}
function orelha(P, hx, hy, R = ER.pele) { P.line(hx - 0.4, hy + 0.4, hx - 3.4, hy - 2.6, R, 3.6); P.put(hx - 3.6, hy - 3, R, 4.6); P.put(hx - 1.4, hy - 0.3, R, 1.8); }
/* ---------- o Guardião do Salão, 42 x 34 ---------- */
// o escudo alto em folha: o aro de prata, a face azul, a nervura da folha em prata
function escudo(P, cx, cy, s, hot) {
  const h = 16, top = cy - h / 2;
  for (let y = Math.floor(top); y <= top + h; y++) {
    const t = (y + 0.5 - top) / h; if (t < 0 || t > 1) continue;
    const hw = 3.6 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.6) + (t > 0.2 && t < 0.7 ? 0.3 : 0);
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x + 0.5 - cx) / Math.max(0.6, hw), rim = Math.abs(u) > 0.72 || t < 0.06 || t > 0.95;
      if (rim) P.put(x, y, ER.prata, u < 0 ? 4.8 - t : 2.6 - t * 0.6);
      else P.put(x, y, ER.lua, 3.4 - u * 0.9 - t * 1.1 + cg(x, y, s) * 0.3 + (hot ? 0.8 : 0));
    }
  }
  for (let y = top + 1.5; y < top + h - 1.5; y += 0.5) P.put(cx - 0.2, y, ER.prata, 4.6);           // a nervura
  for (let i = 0; i < 4; i++) { const y = top + 4 + i * 2.6; P.line(cx, y, cx - 2, y - 1.6, ER.prata, 3.6); P.line(cx, y, cx + 1.8, y - 1.6, ER.prata, 3); }
}
function guardiao(k) {
  const o = EL2_GD[k], P = cp(42, 34), s = 25651 + k * 7, BX = EL2_GBX;
  const hipY = 20.4 + o.low, sx = BX + o.lean, sy = 12 + o.low, hx = BX + 0.6 + o.lean * 1.25, hy = 6.4 + o.low;
  // o manto azul-escuro atrás
  poly(P, [[sx - 1.8, sy - 0.4], [sx + 0.6, sy + 0.4], [sx - 1, hipY + 6], [sx - 2 - o.lean * 0.4, hipY + 10.4], [sx - 5 - o.lean * 0.8, hipY + 9.4], [sx - 3.6, sy + 5]], ER.lua,
    (x, y) => 1.8 + (Math.abs(Math.sin(x * 1.3 + y * 0.2)) < 0.3 ? -0.8 : 0) + cg(x, y, s) * 0.3);
  // o cabo da lança atrás do corpo (a parte de trás da mão)
  const ca = Math.cos(o.a), sa = Math.sin(o.a), bx = o.hn[0] - ca * 9, by = o.hn[1] - sa * 9;
  P.line(bx, by, o.hn[0], o.hn[1], ER.arcoLanca || ER.prata, 2.2);
  // a perna de longe
  perna(P, BX - 0.6, hipY, o.b[0], o.b[1], ER.lua, ER.prata, 1.6, s + 1, false, 1.35);
  // o tronco: a couraça de folhas de prata (escamas), as tassets em folha, o tabardo azul entre as pernas
  poly(P, [[BX - 1.4, hipY], [BX + 1.6, hipY], [BX + 2 + o.lean * 0.3, hipY + 6.4], [BX - 1, hipY + 6.4]], ER.lua, (x, y) => 3 - (y - hipY) * 0.1 + (y >= Math.floor(hipY + 5.8) ? 1.2 : 0));
  poly(P, [[BX - 2.8, hipY - 1.4], [BX + 2.8, hipY - 1.4], [BX + 3.6, hipY + 3.4], [BX - 3.4, hipY + 3.4]], ER.prata,
    (x, y) => 3.4 - (x - BX) * 0.25 + (((x + (y % 2) * 1.5 + 30) % 3) < 0.8 ? -1 : 0) + (y >= Math.floor(hipY + 2.8) ? -0.6 : 0));
  ell(P, sx - 0.1, sy + 3.8, 3, 4.6, o.lean * 0.1, ER.prata, s + 3, 3, (u, v, x, y) => [ER.prata, (((x + (y % 2) * 1.5 + 30) % 3) < 0.7 && v > -0.5 ? -0.9 : 0) + (v < -0.55 ? 0.6 : 0)]);
  P.put(sx + 0.8, sy + 2.6, ER.lua, 5);
  perna(P, BX + 0.8, hipY, o.f[0], o.f[1], ER.lua, ER.prata, 2.8, s + 4, false, 1.35);
  // as grevas: o joelho de prata em folha
  for (const [x, y] of [[(BX + 0.8 + o.f[0]) / 2 + 0.9, (hipY + o.f[1]) / 2], [(BX - 0.6 + o.b[0]) / 2 + 0.9, (hipY + o.b[1]) / 2]]) { P.put(x, y, ER.prata, 5); P.put(x, y - 1, ER.prata, 4); P.put(x + 1, y, ER.prata, 3); }
  // o elmo alado: a cúpula de prata, a viseira com a fresta (os olhos acesos, o EYES_E), as asas para trás
  ell(P, hx - 0.2, hy - 0.6, 2.8, 3.2, 0, ER.prata, s + 5, 3.4, (u, v) => [ER.prata, (u > 0.4 ? -0.4 : 0) + (v < -0.6 ? 0.6 : 0)]);
  P.line(hx + 0.8, hy, hx + 2.8, hy, ER.negro, 0.5); P.put(hx + 1.8, hy + 0.6, ER.negro, 0.5); P.line(hx + 1.8, hy + 1.2, hx + 1.8, hy + 2.2, ER.negro, 1);
  P.put(hx + 2, hy, ER.lua, 5);
  P.line(hx - 1.2, hy + 2.6, hx + 2.4, hy + 2.6, ER.prata, 2.4);   // a borda do elmo no queixo
  for (const [ox, oy, l, b] of [[-1.4, -1.8, 5.6, 5], [-1.6, -0.6, 5.2, 3.8], [-1.6, 0.6, 4.4, 2.8]]) { P.line(hx + ox, hy + oy, hx + ox - l, hy + oy - 3.2 + (oy * 0.6), ER.prata, b); }   // as asas do elmo
  P.put(hx - 0.2, hy - 3.8, ER.prata, 5); P.put(hx + 0.8, hy - 3.6, ER.prata, 4.4);
  // a ombreira em folhas
  ell(P, sx + 0.2, sy + 1, 2.6, 1.7, -0.3, ER.prata, s + 6, 3.6, (u, v, x, y) => [ER.prata, (x % 2 ? -0.6 : 0)]);
  // o escudo (na mão de longe, na frente do corpo)
  escudo(P, o.sh[0], o.sh[1], s + 7, k === 5 || k === 6);
  // o braço de perto e a lança: a haste de madeira clara, a ponta em folha de prata
  braco(P, sx + 0.6, sy + 1.2, o.hn[0], o.hn[1], ER.lua, ER.prata, 3, s + 8);
  const tx = o.hn[0] + ca * EL2_PONTA_L, ty = o.hn[1] + sa * EL2_PONTA_L;
  P.line(o.hn[0], o.hn[1], tx - ca * 3, ty - sa * 3, ER.prata, 3.4);
  P.line(o.hn[0] - sa * 0.6, o.hn[1] + ca * 0.6, tx - ca * 3 - sa * 0.6, ty - sa * 3 + ca * 0.6, ER.prata, 2);
  for (let q = 0; q <= 1; q += 0.12) { const w = Math.sin(q * Math.PI) * 1.3, x = tx - ca * 3.6 * (1 - q), y = ty - sa * 3.6 * (1 - q); P.put(x - sa * w, y + ca * w, ER.prata, 4.6); P.put(x + sa * w, y - ca * w, ER.prata, 3); P.put(x, y, ER.prata, 5); }
  P.put(o.hn[0] + ca * 2, o.hn[1] + sa * 2, ER.lua, 4.6);   // a fita azul na haste
  return setO(P.done());
}

/* ---------- a Carpideira, 26 x 30 (sem pernas: a mortalha some em fiapos) ----------
   0-2 boiando (cabelo e mortalha ondulando), 3 o pranto (a cabeça para trás, a boca aberta, os braços abertos) */
function carpideira(k) {
  const P = cp(26, 30), s = 25701 + k * 7, wail = k === 3, ph = k * 2.1, cx = 12, R = ER.mortalha;
  const hx = cx + (wail ? -0.6 : 0.6), hy = wail ? 6.6 : 7;
  // os cabelos brancos compridos descendo pelas costas até a cintura, em mechas que ondulam
  for (let j = 0; j < 7; j++) {
    let x = hx - 1.2 - j * 0.25, y = hy - 1.6 + j * 0.3;
    for (let i = 0; i < 16; i++) { x -= 0.32 + Math.sin(i * 0.4 + ph + j) * 0.22; y += 0.8; P.put(x, y, ER.cabeloB, 4.2 - i * 0.12 - j * 0.2 + (i % 4 === 0 ? 0.5 : 0) + (j === 6 ? -1 : 0)); }
  }
  // a mortalha: do peito para baixo, alargando e ondulando, rasgada em fiapos embaixo
  for (let y = 10; y < 30; y++) {
    const t = (y - 10) / 20, hw = 2.8 + t * 4, c = cx - t * 1.6 + Math.sin(t * 5 + ph) * 1.2;
    for (let x = Math.floor(c - hw); x <= c + hw; x++) {
      const u = (x + 0.5 - c) / hw, frayed = t > 0.58 && (hash2(x, 0, s) < (t - 0.58) * 2.2 + Math.sin(x * 1.9 + ph) * 0.2);
      if (frayed) continue;
      P.put(x, y, R, 3.2 - u * 1.2 - t * 1.5 + (Math.abs(Math.sin(x * 1.3 + y * 0.12 + ph)) < 0.25 ? -0.9 : 0) + cg(x, y, s) * 0.35);
    }
  }
  // o xale cruzado no peito
  ell(P, cx + 0.3, 11.8, 2.8, 3, 0, R, s + 1, 3.6, (u, v) => [R, Math.abs(u + v * 0.6) < 0.18 ? -1 : 0]);
  // os braços: finos, cinzentos; numa das mãos o pente de prata; no pranto, abertos
  const pente = (x, y) => { for (let i = 0; i < 4; i++) P.put(x - 1 + i * 0.6, y, ER.prata, 4.6 - i * 0.2); for (let i = 0; i < 4; i++) P.put(x - 1 + i * 0.6, y + 1, ER.prata, 2.6); };
  if (wail) { braco(P, cx + 1, 10.4, cx + 7.6, 7.4, R, ER.cinzaPele, 3.4, s + 2, ER.cinzaPele, 0.8); braco(P, cx - 1, 10.4, cx - 6.6, 7, R, ER.cinzaPele, 2.2, s + 3, ER.cinzaPele, 0.8); pente(cx + 8.4, 6.2); }
  else { braco(P, cx - 0.8, 10.6, cx - 2.2, 17.6 + Math.sin(ph) * 0.6, R, ER.cinzaPele, 2.2, s + 3, ER.cinzaPele, 0.8); braco(P, cx + 1, 10.6, cx + 3.6, 16.8 + Math.cos(ph) * 0.6, R, ER.cinzaPele, 3.4, s + 2, ER.cinzaPele, 0.8); pente(cx + 4.4, 16.4 + Math.cos(ph) * 0.6); }
  // a cabeça: o rosto fino e cinza, os olhos fundos de borda vermelha (o EYES_E acende o miolo), a boca aberta no pranto
  ell(P, hx + 0.3, hy, 2.2, 2.7, wail ? -0.3 : 0.1, ER.cinzaPele, s + 4, 3.6, (u, v) => [ER.cinzaPele, u > 0.5 ? -0.4 : 0]);
  P.put(hx + 1.3, hy - 0.4, ER.negro, 1.5); P.put(hx + 0.8, hy - 0.4, ER.rosa, 5); P.put(hx + 1.3, hy + 0.2, ER.rosa, 4.4);
  if (wail) ell(P, hx + 1.1, hy + 1.8, 0.9, 1.5, 0.2, ER.negro, s + 5, 0.4);
  else P.put(hx + 1.3, hy + 1.7, ER.cinzaPele, 1.6);
  // o capuz cinza por cima, aberto na frente (os cabelos saem por baixo dele dos dois lados)
  ell(P, hx - 0.6, hy - 0.8, 3.2, 3.4, wail ? -0.4 : -0.1, R, s + 6, 3.4, (u, v) => (u > 0.35 && v > -0.55 ? null : [R, (v < -0.5 ? 0.7 : 0) + (u < -0.6 ? -0.6 : 0)]));
  for (let y = hy - 1; y <= hy + 3; y += 0.5) P.put(hx + 2.4, y, ER.cabeloB, 4.4 - (y - hy) * 0.2);   // a mecha da frente
  return P.done();
}

/* ---------- a Encantadora Mascarada, 24 x 28 ---------- */
function mascarada(k) {
  const o = EL2_MG[k], P = cp(24, 28), s = 25751 + k * 7, BX = EL2_MBX;
  const sx = BX + o.lean, sy = 9.6, hx = BX + 0.6 + o.lean * 1.2, hy = 5.4;
  // o cabelo preto-violeta comprido nas costas, preso em parte por fitas
  poly(P, [[hx - 2.4, hy - 2.4], [hx + 0.6, hy - 2.8], [hx - 0.6, hy + 2], [sx - 1, sy + 8], [sx - 3.4, sy + 9], [hx - 4, hy + 1.4]], ER.cabeloN, (x, y) => 3.4 - (y - hy) * 0.1 + (Math.abs(Math.sin(x * 2.2 + y * 0.3)) < 0.35 ? -0.9 : 0) + cg(x, y, s) * 0.4);
  braco(P, sx - 0.6, sy + 1, o.hf[0], o.hf[1], ER.ameixa, ER.ameixa, 1.6, s + 1);
  // o vestido longo ameixa até os pés: o corpete justo, a saia em camadas, a barra preta-violeta bordada de espinhos
  const hem = 27, sw = o.sw;
  poly(P, [[sx - 2, sy], [sx + 2.2, sy], [BX + 4.8 + sw * 0.8, hem], [BX - 4.4 + sw * 0.4, hem], [BX - 5 + sw * 0.4, hem - 1]], ER.ameixa, (x, y) => {
    if (y >= hem - 2) { const th = (x + y) % 3 === 0; return [th ? ER.espinho : ER.rosa, th ? 3.6 : (y === hem - 1 ? 2 : 3)]; }
    const tier = (y - sy) % 6 < 0.9 && y > sy + 7;
    return [ER.ameixa, 3.4 - (x - BX) * 0.25 - (y - sy) * 0.05 + (tier ? -1.1 : 0) + (Math.abs(Math.sin(x * 1.5 + y * 0.1 + sw)) < 0.3 ? -0.8 : 0) + cg(x, y, s) * 0.3];
  });
  for (let x = BX - 2.4; x <= BX + 2.6; x += 0.5) P.put(x, 16.4, ER.espinho, x > BX + 1 ? 2.4 : 3.6);   // o cinto de ramo
  P.put(BX + 0.8, 16.2, ER.rosa, 5); P.put(BX + 1.3, 16.6, ER.rosa, 3.6);                              // a rosa do cinto
  // a gola alta em pétalas
  poly(P, [[hx - 2.6, hy + 2.4], [hx + 1.4, hy + 3.6], [sx + 2.8, sy + 0.8], [sx - 3, sy + 1.2], [hx - 3.4, hy + 0.4]], ER.rosa, (x, y) => 3.2 + ((x + y) % 2 ? -0.6 : 0.4) + cg(x, y, s) * 0.3);
  ell(P, sx + 0.2, sy + 1, 2.4, 1.5, -0.3, ER.ameixa, s + 2, 3.6);
  // a cabeça: o queixo pálido aparecendo, a máscara de osso com os furos dos olhos (o EYES_E acende), os galhos de
  // chifre subindo da máscara, a coroa de espinhos
  ell(P, hx - 0.4, hy - 0.8, 2.6, 2.4, 0, ER.cabeloN, s + 3, 3.2);
  ell(P, hx + 0.6, hy + 0.4, 1.9, 2.5, 0.15, ER.pele, s + 4, 3.1, (u, v) => (v > 0.6 && u < -0.2 ? null : [ER.pele, u > 0.6 ? -0.4 : 0]));
  ell(P, hx + 0.9, hy - 0.2, 1.9, 1.6, 0.1, ER.osso, s + 5, 3.6, (u, v) => [ER.osso, (u > 0.5 ? -0.5 : 0) + (Math.abs(Math.sin((u + v) * 6)) < 0.2 ? -0.7 : 0)]);
  P.put(hx + 2.5, hy + 0.1, ER.osso, 3.6); P.put(hx + 1.5, hy - 0.4, ER.negro, 0.5); P.put(hx + 1.6, hy + 1.8, ER.rosa, 3.4);   // a ponta da máscara, o furo do olho, a boca escura
  orelha(P, hx - 0.2, hy);
  for (const [ox, d] of [[0.2, 1], [1.6, 1]]) {   // os galhos de chifre
    let x = hx + ox, y = hy - 1.6;
    for (let i = 0; i < 5; i++) { x += (ox > 1 ? 0.25 : -0.35); y -= 0.8; P.put(x, y, ER.osso, 4 - i * 0.3); if (i === 2) { P.put(x + (ox > 1 ? 0.8 : -0.9), y - 0.4, ER.osso, 3.4); P.put(x + (ox > 1 ? 1.4 : -1.5), y - 0.9, ER.osso, 3); } }
  }
  for (let x = hx - 2; x <= hx + 2; x += 0.5) P.put(x, hy - 1.9 - (x - hx) * 0.12, ER.espinho, x > hx + 1 ? 4.4 : 3);   // a coroa de espinhos
  P.put(hx - 1.2, hy - 2.6, ER.espinho, 4.6); P.put(hx + 0.6, hy - 2.8, ER.espinho, 4.6); P.put(hx - 0.4, hy - 2.3, ER.rosa, 5);
  braco(P, sx + 0.8, sy + 1, o.hn[0], o.hn[1], ER.ameixa, ER.ameixa, 3, s + 6, ER.pele, 1.1);
  return setO(P.done());
}
// a rosa negra (as três que giram, r o raio): as pétalas em espiral, o miolo mais claro
function rosa(r) {
  const n = Math.ceil(r * 2 + 2), P = cp(n, n), c = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy) / r; if (d > 1) continue;
    const a = Math.atan2(dy, dx), sp = Math.sin(a * 2 + d * 7);
    P.put(x, y, ER.rosa, 4.6 - d * 2.2 + (sp < -0.5 ? -1.2 : 0) - (dx + dy) / r * 0.6);
  }
  P.put(c - 0.5, c + r, ER.espinho, 3.4);
  return setO(P.done());
}
// a pétala-navalha (4 ângulos de giro)
function petala(k) {
  const P = cp(7, 7), a = k * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
  for (let t = -2.6; t <= 2.6; t += 0.4) { const w = Math.sqrt(Math.max(0, 1 - (t / 2.7) ** 2)) * 1.2; for (let q = -w; q <= w; q += 0.4) P.put(3.5 + ca * t - sa * q, 3.5 + sa * t + ca * q, ER.rosa, q < -w + 0.5 ? 5.4 : 3.6 - t * 0.2); }
  return P.done();
}

/* ---------- a Musa Faminta, 24 x 28 ---------- */
function musa(k) {
  const o = EL2_MU[k], P = cp(24, 28), s = 25801 + k * 7, BX = EL2_MBX;
  const sx = BX + o.lean, sy = 9.6, hx = BX + 0.6 + o.lean * 1.2, hy = 5.4 + o.hy;
  // o cabelo de cobre solto, comprido até o meio das costas, ondulado
  for (let j = 0; j < 7; j++) {
    let x = hx - 1 - j * 0.3, y = hy - 2.2 + j * 0.45;
    for (let i = 0; i < 15; i++) { x -= 0.28 + (o.sing ? 0.12 : 0) + Math.sin(i * 0.7 + j * 1.3 + k) * 0.2; y += 0.85; P.put(x, y, ER.cobre, 4 - i * 0.14 - j * 0.15 + (i % 3 === 0 ? 0.6 : 0)); }
  }
  // o braço de longe com a lira de osso (as cordas finas)
  const ly = o.ly;
  tubo(P, sx - 0.6, sy + 1, ly[0] + 0.4, ly[1] + 0.6, 0.7, 0.55, ER.pele, 2, s);
  for (let i = 0; i <= 8; i++) { const t = i / 8, x = ly[0] - 1.6 - Math.sin(t * Math.PI) * 1.2, y = ly[1] - 3 + t * 5; P.put(x, y, ER.osso, 4 - t); }
  for (let i = 0; i <= 8; i++) { const t = i / 8, x = ly[0] + 1.6 + Math.sin(t * Math.PI) * 1.2, y = ly[1] - 3 + t * 5; P.put(x, y, ER.osso, 3.4 - t); }
  P.line(ly[0] - 2, ly[1] - 3.2, ly[0] + 2, ly[1] - 3.2, ER.osso, 4.6); P.line(ly[0] - 1, ly[1] + 2, ly[0] + 1, ly[1] + 2, ER.osso, 3);
  for (let c = -1; c <= 1; c++) P.line(ly[0] + c * 0.7, ly[1] - 2.8, ly[0] + c * 0.5, ly[1] + 1.6, ER.veu, 5);   // as cordas
  // o vestido de véu: comprido, leve, a barra em pontas que sobem como névoa
  const hem = 27, sw = o.sw;
  poly(P, [[sx - 1.8, sy], [sx + 2.2, sy], [BX + 4 + sw * 0.8, hem], [BX - 3.6 + sw * 0.4, hem], [BX - 4.2 + sw * 0.4, hem - 1]], ER.veu, (x, y) => {
    if (y >= hem - 1 && hash2(x, y, s) < 0.4) return null;
    return [ER.veu, 3.2 - (x - BX) * 0.25 - (y - sy) * 0.06 + (Math.abs(Math.sin(x * 1.1 + y * 0.18 + sw)) < 0.28 ? -0.9 : 0) + cg(x, y, s) * 0.3];
  });
  for (let x = BX - 2; x <= BX + 2.4; x += 0.5) P.put(x, 15.6, ER.cobre, x > BX + 1 ? 2.6 : 3.8);   // o cordão de cobre
  ell(P, sx + 0.2, sy + 2.4, 2.2, 2.6, o.lean * 0.1, ER.veu, s + 1, 3.6);
  // a cabeça: o rosto muito bonito e pálido, os olhos verdes (EYES_E), a boca aberta no canto
  ell(P, hx + 0.4, hy + 0.2, 2, 2.6, 0.12 - (o.sing ? 0.3 : 0), ER.pele, s + 2, 3.4, (u, v) => [ER.pele, u > 0.6 ? -0.4 : 0]);
  P.put(hx + 2.3, hy + 0.4, ER.pele, 4.4); P.put(hx + 1.4, hy - 0.2, ER.fada, 4.4); P.put(hx + 1.4, hy - 0.9, ER.cobre, 2);
  P.put(hx + 1.6, hy + 1.7, o.sing ? ER.rosa : ER.pele, o.sing ? 2.4 : 2);
  orelha(P, hx - 0.2, hy);
  ell(P, hx - 0.5, hy - 1.4, 2.4, 1.5, 0, ER.cobre, s + 3, 3.6);   // o alto da cabeça
  for (let x = hx - 1.8; x <= hx + 1.8; x += 0.5) P.put(x, hy - 2.4 - (x - hx) * 0.1, ER.fada, x < hx ? 4.6 : 3.4);   // a grinalda de folhas claras
  // o braço de perto
  tubo(P, sx + 0.8, sy + 1, o.hn[0], o.hn[1], 0.75, 0.6, ER.pele, 3.2, s + 4);
  return setO(P.done());
}

/* ---------- o Cavaleiro de Espinhos, 50 x 50 ---------- */
// o montante: o punho de casca, a guarda em galho, a lâmina larga de aço escuro com a roseira enrolada e os acúleos
function montante(P, hx, hy, g) {
  const ca = Math.cos(g), sa = Math.sin(g), nx = -sa, ny = ca;
  for (let t = 0.6; t <= 4.6; t += 0.5) P.put(hx - ca * t, hy - sa * t, ER.casca, 3 - t * 0.2);
  P.put(hx - ca * 5, hy - sa * 5, ER.rosa, 4.6);                                                    // o pomo: uma rosa fechada
  for (let k = -3; k <= 3; k += 0.5) P.put(hx + ca * 0.8 + nx * k + ca * Math.abs(k) * 0.3, hy + sa * 0.8 + ny * k + sa * Math.abs(k) * 0.3, ER.casca, k < 0 ? 4.4 : 2.6);   // a guarda em galho
  for (let t = 1.5; t <= EL2_LAM; t += 0.35) {
    const q = t / EL2_LAM, w = q > 0.9 ? (1 - q) * 14 : 1.5, x = hx + ca * t, y = hy + sa * t;
    for (let k = -w; k <= w + 0.01; k += 0.45) { const up = nx * k + ny * k < 0; P.put(x + nx * k, y + ny * k, ER.aco, Math.abs(k) > w - 0.5 ? (up ? 5 : 2.2) : up ? 3.8 : 2.8); }
    // a roseira enrolada: um ramo em espiral pela lâmina, com os acúleos
    const sp = Math.sin(t * 0.9) * (w + 0.4);
    if (q < 0.8) { P.put(x + nx * sp, y + ny * sp, ER.espinho, 3 + (sp < 0 ? 0.8 : 0)); if ((t * 3 | 0) % 7 === 0) P.put(x + nx * (sp + Math.sign(sp || 1) * 1.1), y + ny * (sp + Math.sign(sp || 1) * 1.1), ER.espinho, 4.4); }
  }
  const rx = hx + ca * EL2_LAM * 0.35, ry = hy + sa * EL2_LAM * 0.35;   // uma rosa presa no ramo
  P.put(rx + nx * 1.6, ry + ny * 1.6, ER.rosa, 4.8); P.put(rx + nx * 2.2, ry + ny * 2.2, ER.rosa, 3.4); P.put(rx + nx * 1.6 + ca, ry + ny * 1.6 + sa, ER.rosa, 3);
}
function cavespinho(k) {
  const o = EL2_CK[k], P = cp(50, 50), s = 25851 + k * 7, BX = EL2_KBX;
  const hipY = 34 + o.low, sx = BX + o.lean, sy = 22 + o.low, hx = BX + 0.8 + o.lean * 1.2, hy = 15 + o.low;
  // a capa ameixa pesada atrás, rasgada e presa de espinhos na barra
  poly(P, [[sx - 3, sy - 1], [sx + 1, sy], [sx - 1.6, hipY + 8], [sx - 3 - o.lean * 0.6, hipY + 14], [sx - 8 - o.lean, hipY + 13], [sx - 6.4, sy + 6]], ER.ameixa,
    (x, y) => (y > hipY + 11 && hash2(x, y, s) < 0.35 ? null : 2.4 + (Math.abs(Math.sin(x * 1.1 + y * 0.18)) < 0.3 ? -0.9 : 0) + cg(x, y, s) * 0.35 - (y - sy) * 0.03));
  // a perna de longe: grossa, a greva de casca
  perna(P, BX - 1, hipY, o.b[0], o.b[1], ER.casca, ER.casca, 1.6, s + 1, false, 2.2);
  // o braço de longe no punho
  braco(P, sx - 1, sy + 1.6, o.hn[0] - 1.4, o.hn[1] + 0.8, ER.casca, ER.casca, 1.6, s + 2, ER.casca, 1.8);
  // o tronco: a couraça de casca em placas, os espinhos saindo das juntas, a fralda de couro escuro
  poly(P, [[BX - 3.4, hipY - 1.4], [BX + 3.6, hipY - 1.4], [BX + 4.6 + o.lean * 0.3, hipY + 4.8], [BX - 4.4, hipY + 4.8]], ER.casca,
    (x, y) => 2.8 - (x - BX) * 0.2 + (((x + 40) % 3) < 0.8 ? -1 : 0) + (y >= Math.floor(hipY + 4) ? -0.7 : 0));
  ell(P, sx, sy + 5, 5, 6.4, o.lean * 0.08, ER.casca, s + 3, 3, (u, v, x, y) => [ER.casca, (Math.abs(Math.sin(y * 0.9 + u * 2)) < 0.22 ? -1.1 : 0) + (v < -0.55 ? 0.7 : 0) + (u > 0.55 ? -0.5 : 0)]);
  for (const [ox, oy] of [[-3.6, 1], [3.8, 2.6], [-1.6, 8.6], [4.2, 8], [0.6, -0.6]]) { P.put(sx + ox, sy + oy, ER.espinho, 3.4); P.put(sx + ox + 0.8, sy + oy - 0.9, ER.osso, 3.6); }   // os acúleos da couraça
  perna(P, BX + 1.4, hipY, o.f[0], o.f[1], ER.casca, ER.casca, 2.8, s + 4, false, 2.3);
  // as joelheiras de nó de madeira
  for (const [x, y] of [[(BX + 1.4 + o.f[0]) / 2 + 1, (hipY + o.f[1]) / 2], [(BX - 1 + o.b[0]) / 2 + 1, (hipY + o.b[1]) / 2]]) { ell(P, x, y, 1.5, 1.3, 0, ER.casca, s + 9, 3.6); P.put(x + 1.2, y - 1, ER.espinho, 4); }
  // a ombreira grande de casca com a rosa
  ell(P, sx + 0.6, sy + 1.4, 4.2, 2.6, -0.25, ER.casca, s + 5, 3.4, (u, v, x, y) => [ER.casca, (x % 3 === 0 ? -0.8 : 0)]);
  P.put(sx + 1.4, sy, ER.rosa, 5); P.put(sx + 2, sy + 0.6, ER.rosa, 3.6); P.put(sx + 0.8, sy + 0.6, ER.rosa, 3);
  // o elmo fechado de casca: a fresta dos olhos (verde-pálido aceso, o EYES_E), a crista de galhos subindo e indo para trás
  ell(P, hx, hy - 0.4, 3.6, 4, 0, ER.casca, s + 6, 3.4, (u, v) => [ER.casca, (u > 0.4 ? -0.5 : 0) + (v < -0.6 ? 0.7 : 0) + (Math.abs(u - 0.1) < 0.12 ? -0.8 : 0)]);
  P.line(hx + 0.8, hy - 0.2, hx + 3.4, hy - 0.2, ER.negro, 0.4); P.put(hx + 2.6, hy - 0.2, ER.fada, 5);
  for (let y = hy + 1.2; y <= hy + 3; y += 0.6) P.put(hx + 2.4, y, ER.negro, 0.8);   // os furos de respirar
  for (const [ox, len, a] of [[-0.6, 7, -1.95], [1, 5.6, -1.55], [-2, 6, -2.4]]) {   // a crista
    let x = hx + ox, y = hy - 3.4;
    for (let i = 0; i < len; i++) { x += Math.cos(a) * 0.9; y += Math.sin(a) * 0.9; P.put(x, y, ER.casca, 4 - i * 0.25); if (i === 3) { P.put(x - 0.9, y - 0.5, ER.casca, 3.2); P.put(x - 1.6, y - 0.6, ER.espinho, 3.6); } }
    P.put(x, y - 0.6, ER.espinho, 4.4);
  }
  // o montante e o braço de perto por cima
  montante(P, o.hn[0], o.hn[1], o.g);
  braco(P, sx + 1.4, sy + 1.6, o.hn[0], o.hn[1], ER.casca, ER.casca, 3, s + 7, ER.casca, 1.9);
  return setO(P.done());
}

EL2.get = () => EL2.ready || (EL2.ready = {
  gd: EL2_GD.map((_, k) => guardiao(k)),
  cp: [0, 1, 2, 3].map(carpideira).map(cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; }),
  mg: EL2_MG.map((_, k) => mascarada(k)), rosa: [1.8, 2.6].map(rosa), pet: [0, 1, 2, 3].map(petala),
  mu: EL2_MU.map((_, k) => musa(k)),
  ck: EL2_CK.map((_, k) => cavespinho(k))
});
EL2.GL = {
  lua: glow(4, '#9cc8ff'), luaG: glow(10, '#9cc8ff'), prata: glow(8, '#e6eef8'), pranto: glow(14, '#dfe6e2'), prantoP: glow(5, '#ff9a9a'),
  fada: glow(4, '#b8f0c8'), fadaG: glow(9, '#9ae0b4'), fadaM: glow(14, '#9ae0b4'), rosa: glow(6, '#c890b8'), rosaG: glow(12, '#a85a90')
};
}

/* ================= desenho ================= */
function el2Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const el2Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho no mundo (bx: o corpo no desenho, by: a linha dos pés)
const el2Pt = (e, x, y, bx, by) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];
const el2Scr = (e, fx, fy, x, y, bx, by) => [fx + (x - bx) * e.facing, fy - 1 - (by - y)];

const el2GdPose = e => e.state === 'wind' ? 3 : e.state === 'thrust' ? 4 : e.state === 'bashW' ? 5 : e.state === 'bash' ? 6 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 5) % 2 : 0;
DRAW_E.guardiao = (e, fx, fy, fl) => el2Blit(cvPick(EL2.get().gd[el2GdPose(e)], e, fl), e, fx, fy, EL2_GBX + 1, 35, el2Jit(e, (e.state === 'wind' || e.state === 'bashW') && e.stateT < 0.3, 40));
EYES_E.guardiao = (e, fx, fy) => {
  const k = el2GdPose(e), o = EL2_GD[k], G = EL2.GL;
  const [ex, ey] = el2Scr(e, fx, fy, EL2_GBX + 0.6 + o.lean * 1.25 + 2, 6.4 + o.low, EL2_GBX, 33);
  lc.globalAlpha = 0.4; lc.drawImage(G.lua, Math.round(ex) - 4, Math.round(ey) - 4);
  if (e.state === 'wind' || e.state === 'thrust') {
    const [tx, ty] = el2GTip(k), [x, y] = el2Scr(e, fx, fy, tx, ty, EL2_GBX, 33), q = e.state === 'thrust' ? 1 : clamp(1 - e.stateT / EL2_LANCA_W, 0, 1);
    lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(G.luaG, Math.round(x) - 10, Math.round(y) - 10);
  } else if (e.state === 'bashW' || e.state === 'bash') {
    const [x, y] = el2Scr(e, fx, fy, o.sh[0], o.sh[1], EL2_GBX, 33), q = e.state === 'bash' ? 1 : clamp(1 - e.stateT / EL2_ESCUDO_W, 0, 1);
    lc.globalAlpha = 0.25 + 0.5 * q; lc.drawImage(G.prata, Math.round(x) - 8, Math.round(y) - 8); lc.drawImage(G.luaG, Math.round(x) - 10, Math.round(y) - 10);
  }
  if (e.shieldHit > 0) { const [x, y] = el2Scr(e, fx, fy, o.sh[0], o.sh[1], EL2_GBX, 33); lc.globalAlpha = e.shieldHit / 0.3 * 0.7; lc.drawImage(G.prata, Math.round(x) - 8, Math.round(y) - 8); }
};
WARN_E.guardiao = e => e.state === 'wind' || e.state === 'bashW';

// a carpideira: translúcida, boiando; o frio por cima vem do EYES_E
const el2CpBob = e => Math.round(Math.sin(e.t * 1.7 + e.seed) * 1.6);
const el2CpPose = e => e.state === 'wail' || e.state === 'after' ? 3 : Math.floor(e.t * 3 + e.seed) % 3;
DRAW_E.carpideira = (e, fx, fy, fl) => {
  const S = EL2.get().cp[el2CpPose(e)], j = e.state === 'wail' ? Math.round(Math.sin(e.t * 40) * 0.8) : 0;
  lc.globalAlpha = (fl ? 0.9 : 0.7) + 0.08 * Math.sin(e.t * 2.3); el2Blit(cvPick(S, e, fl), e, fx, fy + el2CpBob(e) + 3, 13, 31, j); lc.globalAlpha = 1;
};
EYES_E.carpideira = (e, fx, fy) => {
  const G = EL2.GL, cy = fy - e.h / 2 + el2CpBob(e), w = e.state === 'wail' ? clamp(1 - e.stateT / EL2_PRANTO, 0, 1) : 0;
  lc.globalAlpha = 0.14 + w * 0.3 + 0.04 * Math.sin(e.t * 3); lc.drawImage(G.pranto, Math.round(fx) - 14, Math.round(cy) - 14);
  const wl = e.state === 'wail' || e.state === 'after', ex = fx + (wl ? 0.8 : 1.9) * e.facing, ey = fy + el2CpBob(e) + 3 - 1 - (29 - (wl ? 6.2 : 6.6));
  lc.globalAlpha = 0.45 + w * 0.4; lc.drawImage(G.prantoP, Math.round(ex) - 5, Math.round(ey) - 5);
};
WARN_E.carpideira = e => e.state === 'wail';

const el2MgPose = e => e.state === 'charge' ? 3 : e.state === 'release' ? 4 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 6) % 2 : 0;
DRAW_E.mascarada = (e, fx, fy, fl) => {
  if (e.state === 'blink') {   // reaparecendo do redemoinho: tremeluz
    const a = clamp(e.stateT / 0.3, 0, 1); lc.globalAlpha = 1 - a * 0.7; el2Blit(cvPick(EL2.get().mg[0], e, false), e, fx, fy, EL2_MBX + 1, 29); lc.globalAlpha = a; el2Blit(cvPick(EL2.get().mg[0], e, true), e, fx, fy, EL2_MBX + 1, 29); lc.globalAlpha = 1; return;
  }
  el2Blit(cvPick(EL2.get().mg[el2MgPose(e)], e, fl), e, fx, fy, EL2_MBX + 1, 29, el2Jit(e, e.state === 'charge' && e.stateT < 0.3, 36));
};
// as três rosas em volta (giram; no aviso param e sobem)
const el2RosaPos = (e, i) => { const a = (e.orbA || 0) + i * Math.PI * 2 / 3, cx = e.x + e.w / 2, cy = e.y + e.h * 0.45; return [cx + Math.cos(a) * 10, cy + Math.sin(a) * 4 - (e.state === 'charge' ? 4 : 0), Math.sin(a)]; };
EYES_E.mascarada = (e, fx, fy) => {
  const G = EL2.GL, o = EL2_MG[el2MgPose(e)];
  const [ex, ey] = el2Scr(e, fx, fy, EL2_MBX + 0.6 + o.lean * 1.2 + 1.5, 5, EL2_MBX, 27);
  lc.globalAlpha = 0.45; lc.drawImage(G.fada, Math.round(ex) - 4, Math.round(ey) - 4);
  if (e.state === 'charge') { for (const h of [o.hn, o.hf]) { const [x, y] = el2Scr(e, fx, fy, h[0], h[1], EL2_MBX, 27); lc.globalAlpha = 0.3 + 0.5 * clamp(1 - e.stateT / EL2_ROSAS, 0, 1); lc.drawImage(G.rosaG, Math.round(x) - 12, Math.round(y) - 12); } }
};
WARN_E.mascarada = e => e.state === 'charge';

const el2MuPose = e => e.state === 'sing' ? 3 : e.state === 'link' ? 4 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 6) % 2 : 0;
DRAW_E.musa = (e, fx, fy, fl) => el2Blit(cvPick(EL2.get().mu[el2MuPose(e)], e, fl), e, fx, fy, EL2_MBX + 1, 29, el2Jit(e, e.state === 'sing' && e.stateT < 0.3, 30));
const el2MuMao = e => { const o = EL2_MU[el2MuPose(e)]; return el2Pt(e, o.hn[0], o.hn[1], EL2_MBX, 27); };
EYES_E.musa = (e, fx, fy) => {
  const G = EL2.GL, o = EL2_MU[el2MuPose(e)];
  const [ex, ey] = el2Scr(e, fx, fy, EL2_MBX + 0.6 + o.lean * 1.2 + 1.4, 5.2 + o.hy, EL2_MBX, 27);
  lc.globalAlpha = 0.4; lc.drawImage(G.fada, Math.round(ex) - 4, Math.round(ey) - 4);
  if (e.state === 'sing' || e.state === 'link') { const [x, y] = el2Scr(e, fx, fy, o.ly[0], o.ly[1], EL2_MBX, 27); lc.globalAlpha = 0.35 + 0.15 * Math.sin(e.t * 9); lc.drawImage(G.fadaG, Math.round(x) - 9, Math.round(y) - 9); }
};
WARN_E.musa = e => e.state === 'sing';

const el2CkPose = e => e.state === 'slamW' ? 3 : e.state === 'slam' || e.state === 'slamR' ? 4 : e.state === 'plantW' ? 5 : e.state === 'crack' ? 6 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 3.2) % 2 : 0;
DRAW_E.cavespinho = (e, fx, fy, fl) => el2Blit(cvPick(EL2.get().ck[el2CkPose(e)], e, fl), e, fx, fy, EL2_KBX + 1, EL2_KFY + 2, el2Jit(e, (e.state === 'slamW' || e.state === 'plantW') && e.stateT < 0.25, 36));
EYES_E.cavespinho = (e, fx, fy) => {
  const k = el2CkPose(e), o = EL2_CK[k], G = EL2.GL, hot = e.state === 'slamW' || e.state === 'plantW';
  const [ex, ey] = el2Scr(e, fx, fy, EL2_KBX + 0.8 + o.lean * 1.2 + 2.6, 14.8 + o.low, EL2_KBX, EL2_KFY);
  lc.globalAlpha = hot ? 0.7 + 0.2 * Math.sin(e.t * 30) : 0.35; lc.drawImage(hot ? G.fadaG : G.fada, Math.round(ex) - (hot ? 9 : 4), Math.round(ey) - (hot ? 9 : 4));
  if (hot) {   // a roseira da lâmina acende
    const [tx, ty] = el2KTip(k), q = clamp(1 - e.stateT / (e.state === 'slamW' ? EL2_MONTANTE : EL2_CRAVA), 0, 1);
    for (let j = 1; j <= 3; j++) { const t = j / 3.2, [x, y] = el2Scr(e, fx, fy, lerp(o.hn[0], tx, t), lerp(o.hn[1], ty, t), EL2_KBX, EL2_KFY); lc.globalAlpha = 0.2 + 0.45 * q; lc.drawImage(G.fadaG, Math.round(x) - 9, Math.round(y) - 9); }
  }
};
WARN_E.cavespinho = e => e.state === 'slamW' || e.state === 'plantW';

/* ================= comportamento ================= */
const el2Aneis = [], el2Petalas = [], el2Encantos = [], el2Estalos = [];
const el2Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const el2Ang = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
function el2Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (el2Fx.length > 500) return;
  for (let i = 0; i < n; i++) el2P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 });
}
const EL2_LUA = ['#9cc8ff', '#c8e0ff', '#f8fbff'], EL2_PRATA = ['#e6eef8', '#b4c2d6', '#ffffff'], EL2_FADA = ['#5ab88a', '#b8f0c8', '#f4fff0'], EL2_ROSA = ['#843466', '#c890b8', '#4c183c'], EL2_CINZA = ['#dfe6e2', '#ffffff', '#a6aea6'];
function el2Floor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }

/* ---------- o Guardião do Salão ---------- */
AI.guardiao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // vira devagar: dá tempo de passar por trás dele
  const turn = () => { const want = Math.sign(dx) || e.facing; if (want !== e.facing) { e.turnT = (e.turnT || 0) + dt; if (e.turnT > 0.75) { e.facing = want; e.turnT = 0; if (el2Near(e) > 0.1) sfx.el2Vira(el2Near(e)); } } else e.turnT = 0; };
  if (e.state === 'wind') {   // a lança puxada para trás, a ponta acendendo
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 14) { const [tx, ty] = el2GTip(3), [x, y] = el2Pt(e, tx, ty, EL2_GBX, 33); el2Sparks(x, y, 1, EL2_LUA, 20, -20, 0.4); }
    if (e.stateT <= 0) { e.state = 'thrust'; e.stateT = 0.2; e.swingHit = false; e.vx = e.facing * 70; sfx.el2Estocada(Math.max(0.4, el2Near(e))); }
    return;
  }
  if (e.state === 'thrust') {   // a estocada longa: a ponta vai 2 blocos e meio à frente
    const reach = 34, hb = { x: e.facing > 0 ? ecx : ecx - reach, y: e.y + 4, w: reach, h: 12 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { const [tx, ty] = el2GTip(4), [x, y] = el2Pt(e, tx, ty, EL2_GBX, 33); el2Sparks(x, y, 6, EL2_LUA, 60); } }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; e.atkCD = 1.2 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'bashW') {   // atrás do escudo, que acende
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { e.state = 'bash'; e.stateT = 0.42; e.swingHit = false; sfx.el2Investida(Math.max(0.4, el2Near(e))); }
    return;
  }
  if (e.state === 'bash') {   // a investida: o escudo na frente; quem estiver nele é empurrado longe
    e.vx = e.facing * 210;
    if (!e.swingHit && !pl.dead && overlap({ x: e.facing > 0 ? ecx : ecx - 14, y: e.y, w: 14, h: e.h }, pl)) {
      e.swingHit = true; const r = hurtPlayer(Math.round(e.dmg * 0.8), ecx, e, false);
      if (r === 'hit') { pl.vx = e.facing * 360; pl.vy = -170; pl.onGround = false; shake(4); el2Sparks(pcx, pcy, 10, EL2_PRATA, 70); }
      else if (r === 'block' || r === 'parry') pl.vx = e.facing * 260;   // o escudo do herói segura o golpe, não o empurrão
      e.stateT = Math.min(e.stateT, 0.08);
    }
    if (e.hitWall) { e.stateT = 0; burst(ecx + e.facing * 8, e.y + 10, 6, '#8a9abc', 50, 200, 0.4); }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; e.vx = 0; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { turn(); dir = Math.abs(dx) < 22 ? 0 : Math.sign(dx); if (dir !== e.facing) dir = 0; }
  else { cvWander(e, dt); dir = e.wander; if (dir) e.facing = dir; }
  walk(e, dt, dir, aggro ? 24 + e.lvl * 0.3 : 14, 300, 260, dy, aggro && dir !== 0);
  if (e.onGround && Math.abs(e.vx) > 3) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.5; const v = el2Near(e, 180); if (v > 0.05) sfx.el2Passo(v); } }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead || Math.sign(dx) !== e.facing) return;
  const third = ((e.atkN || 0) + 1) % 3 === 0;
  if (third && Math.abs(dx) < 54 && Math.abs(dy) < 14 && clearPath(e, pl)) { e.atkN = (e.atkN || 0) + 1; e.state = 'bashW'; e.stateT = EL2_ESCUDO_W; e.vx = 0; sfx.el2Escudo(Math.max(0.4, el2Near(e))); }
  else if (!third && Math.abs(dx) < 36 && Math.abs(dy) < 16 && clearPath(e, pl)) { e.atkN = (e.atkN || 0) + 1; e.state = 'wind'; e.stateT = EL2_LANCA_W; e.vx = 0; sfx.el2Lanca(Math.max(0.4, el2Near(e))); }
};

/* ---------- a Carpideira ---------- */
AI.carpideira = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'wail') {   // a cabeça vai para trás, a luz em volta treme
    drag(0.03); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 20) { const a = Math.random() * 6.28; el2Sparks(ecx + Math.cos(a) * 12, ecy + Math.sin(a) * 12, 1, EL2_CINZA, 10, 0, 0.4); }
    if (e.stateT <= 0) {
      el2Aneis.push({ x: ecx, y: ecy - 4, r: 0, t: 0, hit: false, dmg: e.dmg });
      e.state = 'after'; e.stateT = 0.6; e.atkCD = 3.2 + Math.random() * 1.2;
      sfx.el2Pranto(Math.max(0.5, el2Near(e, 300)));
    }
    return;
  }
  if (e.state === 'after') { drag(0.1); if (e.stateT <= 0) e.state = 'drift'; return; }
  e.state = 'drift';
  let tx, ty;
  if (aggro) { const side = Math.sign(ecx - pcx) || 1; tx = pcx + side * 4 * T + Math.sin(e.t * 0.5 + e.seed) * 10; ty = pcy - 1.5 * T + Math.sin(e.t * 0.8 + e.seed) * 8; }
  else { tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.25 + e.seed) * 40; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.6 + e.seed) * 10; }
  const k = Math.min(1, dt * 1.2), sp = aggro ? 30 : 16;
  e.vx = lerp(e.vx, clamp((tx - ecx) * 0.9, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 0.9, -sp, sp), k);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (Math.abs(e.vx) > 3 ? Math.sign(e.vx) : e.facing);
  e.moanT = (e.moanT ?? Math.random() * 4) - dt;
  if (e.moanT <= 0) { e.moanT = 4 + Math.random() * 4; const v = el2Near(e, 240); if (v > 0.05) sfx.el2Choro(v); }
  // só chora fora da pedra e vendo o herói
  if (aggro && e.atkCD <= 0 && dist < 6 * T && !solidAt(Math.floor(ecx / T), Math.floor(ecy / T)) && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'wail'; e.stateT = EL2_PRANTO; sfx.el2Abre(Math.max(0.5, el2Near(e)));
  }
};

/* ---------- a Encantadora Mascarada ---------- */
AI.mascarada = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.blinkCD = (e.blinkCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // as rosas giram (paradas no aviso) e brotam de volta uma a uma
  if (e.state !== 'charge') e.orbA = (e.orbA || 0) + dt * 2.4;
  if (e.orbN < 3) { e.orbGrow = (e.orbGrow || 0) + dt; if (e.orbGrow > 1.1) { e.orbGrow = 0; e.orbN++; const [x, y] = el2RosaPos(e, e.orbN - 1); el2Sparks(x, y, 4, EL2_ROSA, 20); } }
  if (e.state === 'blink') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.min(e.atkCD, 0.6); } return; }
  if (aggro && e.blinkCD <= 0 && dist < 3 * T && e.state !== 'release' && el2Blink(e, dx)) return;
  if (e.state === 'charge') {   // as rosas param e abrem
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 20) { const [x, y] = el2RosaPos(e, (Math.random() * 3) | 0); el2Sparks(x, y, 1, EL2_ROSA, 15, 30, 0.5); }
    if (e.stateT <= 0) {
      for (let i = 0; i < e.orbN; i++) { const [x, y] = el2RosaPos(e, i), a = Math.atan2(pcy - y, pcx - x) + (i - 1) * 0.5; el2Petalas.push({ x, y, a, t: 0, dmg: e.dmg, life: 4.5 }); }
      e.orbN = 0; e.orbGrow = 0; e.state = 'release'; e.stateT = 0.45; e.atkCD = 3.4 + Math.random();
      sfx.el2Petalas(Math.max(0.4, el2Near(e, 260)));
    }
    return;
  }
  if (e.state === 'release') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < 5.5 * T ? -Math.sign(dx) : adx > 8.5 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 34 + e.lvl * 0.4 : 18, 400, 260, dy, aggro && dir === Math.sign(dx));
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  e.laughT = (e.laughT ?? Math.random() * 4) - dt;
  if (e.laughT <= 0) { e.laughT = 3.5 + Math.random() * 3; const v = el2Near(e, 200); if (v > 0.05) sfx.el2Riso(v); }
  if (aggro && e.atkCD <= 0 && e.orbN === 3 && e.onGround && e.sees && dist < 13 * T && losClear(ecx, e.y + 6, pcx, pcy)) {
    e.state = 'charge'; e.stateT = EL2_ROSAS; e.vx = 0; sfx.el2Abrem(Math.max(0.4, el2Near(e, 260)));
  }
};
// o sumiço: o primeiro chão livre a 5 (ou 6, 4, 7) blocos para longe do herói; um redemoinho de pétalas nos dois lugares
// e, no de saída, o encanto (a figura dela) que avança sobre o herói e se desfaz
function el2Blink(e, dx) {
  const away = -Math.sign(dx) || -e.facing, fy = Math.floor((e.y + e.h + 1) / T);
  for (const sd of [away, -away]) for (const n of [5, 6, 4, 7]) {
    const nx = e.x + sd * n * T, col = Math.floor((nx + e.w / 2) / T);
    if (sd === -away && Math.abs(nx - pl.x) < 3 * T) continue;
    for (const k of [0, -1, 1, -2, 2, -3, 3]) {
      const row = fy + k, ny = row * T - e.h;
      if (!solidAt(col, row) || rectSolid(nx, ny, e.w, e.h) || lavaIn(nx, ny, e.w, e.h)) continue;
      if (!solidAt(Math.floor((nx + 1) / T), row) && !solidAt(Math.floor((nx + e.w - 1) / T), row)) continue;
      el2Encantos.push({ x: e.x, y: e.y, w: e.w, h: e.h, facing: Math.sign(pl.x - e.x) || e.facing, t: 0, seed: e.seed });
      el2Estalos.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, t: 0 }); el2Sparks(e.x + e.w / 2, e.y + e.h / 2, 8, EL2_ROSA, 60, 40, 0.6);
      e.x = nx; e.y = ny; e.vx = 0; e.vy = 0; e.state = 'blink'; e.stateT = 0.3; e.blinkCD = 3.2 + Math.random() * 1.5; e.facing = Math.sign(pl.x - nx) || e.facing;
      el2Estalos.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, t: 0 }); el2Sparks(e.x + e.w / 2, e.y + e.h / 2, 10, EL2_ROSA, 60, 40, 0.6);
      sfx.el2Some(Math.max(0.4, el2Near(e, 260)));
      return true;
    }
  }
  e.blinkCD = 0.8; return false;
}

/* ---------- a Musa Faminta ---------- */
AI.musa = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const [mx, my] = el2MuMao(e);
  if (e.state === 'sing') {   // toca e canta: o fio cresce até o herói
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    e.fio = clamp(1 - e.stateT / EL2_CANTO, 0, 1);
    e.noteT = (e.noteT || 0) - dt; if (e.noteT <= 0) { e.noteT = 0.22; sfx.el2Nota(Math.max(0.4, el2Near(e, 260)), e.noteN = ((e.noteN || 0) + 1) % 5); }
    if (e.stateT <= 0) {
      if (!pl.dead && dist < EL2_FIO_LONGE && losClear(mx, my, pcx, pcy)) { e.state = 'link'; e.stateT = EL2_FIO_MAX; e.drainT = 0.25; sfx.el2Prende(Math.max(0.5, el2Near(e, 260))); }
      else { e.state = 'walk'; e.fio = 0; e.atkCD = 1.2; }
    }
    return;
  }
  if (e.state === 'link') {   // presa: a cada meio segundo tira vida e se cura; o herói fica enlevado
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing; e.fio = 1;
    if (pl.dead || dist > EL2_FIO_LONGE || !losClear(mx, my, pcx, pcy) || e.stateT <= 0) { el2Rompe(e); return; }
    elEnlevar(0.6);
    e.drainT -= dt;
    if (e.drainT <= 0) {
      e.drainT = 0.5;
      const d = Math.max(1, Math.round(armorTaken(e.dmg * 0.3)));
      if (!modoDeus) { pl.hp -= d; pl.regen = 0; floatText(pcx, pl.y - 6, '-' + d, '#b8f0c8', 0.85); if (pl.hp <= 0) { pl.hp = 0; die(); } }
      e.hp = Math.min(e.maxHp || e.hp, e.hp + d); e.showHp = 2;
      for (let i = 0; i < 5; i++) { const t = i / 5; el2P({ x: lerp(pcx, mx, t), y: lerp(pcy, my, t) - Math.sin(t * Math.PI) * 6, vx: (mx - pcx) * 0.9, vy: (my - pcy) * 0.9, g: 0, life: 0.4, max: 0.4, col: EL2_FADA[i % 3], size: 1 }); }
      sfx.el2Suga(Math.max(0.4, el2Near(e, 260)));
    }
    return;
  }
  e.fio = 0;
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < 4.5 * T ? -Math.sign(dx) : adx > 7 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 36 + e.lvl * 0.4 : 18, 400, 260, dy, aggro && dir === Math.sign(dx));
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  e.humT = (e.humT ?? Math.random() * 4) - dt;
  if (e.humT <= 0) { e.humT = 4 + Math.random() * 4; const v = el2Near(e, 220); if (v > 0.05) sfx.el2Cantiga(v); }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && dist > 3 * T && dist < 8 * T && losClear(mx, my, pcx, pcy)) {
    e.state = 'sing'; e.stateT = EL2_CANTO; e.vx = 0; e.fio = 0; e.noteT = 0;
  }
};
function el2Rompe(e) {
  e.state = 'walk'; e.atkCD = 2.4 + Math.random(); 
  if (e.fio > 0.5) { const [mx, my] = el2MuMao(e); el2Sparks(lerp(mx, pl.x + pl.w / 2, 0.5), lerp(my, pl.y + pl.h / 2, 0.5), 8, EL2_FADA, 40, 0, 0.5); sfx.el2Rompe(Math.max(0.4, el2Near(e, 260))); }
  e.fio = 0;
}

/* ---------- o Cavaleiro de Espinhos ---------- */
AI.cavespinho = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'slamW') {   // o montante erguido atrás, a roseira acendendo
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 12) { const [tx, ty] = el2KTip(3), [x, y] = el2Pt(e, tx, ty, EL2_KBX, EL2_KFY); el2Sparks(x, y, 1, EL2_FADA, 20, -20, 0.4); }
    if (e.stateT <= 0) { e.state = 'slam'; e.stateT = 0.16; e.swingHit = false; e.vx = e.facing * 60; sfx.el2Desce(Math.max(0.4, el2Near(e))); }
    return;
  }
  if (e.state === 'slam') {   // desce: de cima até o chão na frente dele
    const reach = 32, hb = { x: e.facing > 0 ? ecx - 4 : ecx - reach + 4, y: e.y - 10, w: reach, h: e.h + 10 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg * 1.2, ecx, e, false); if (r === 'hit') { el2Sparks(pcx, pl.y + 8, 8, EL2_FADA, 60, 200, 0.5); shake(5); } }
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) {
      e.state = 'slamR'; e.stateT = 0.6;
      const [tx] = el2KTip(4), [x] = el2Pt(e, tx, 0, EL2_KBX, EL2_KFY), fy = e.y + e.h;
      burst(x, fy - 1, 12, '#3a3040', 80, 300, 0.6); el2Sparks(x, fy - 3, 6, EL2_FADA, 50, 200, 0.4);
      const v = el2Near(e, 300); if (v > 0.02) { sfx.el2Chao(v); shake(2 + 4 * v); }
    }
    return;
  }
  if (e.state === 'slamR') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.6; } return; }
  if (e.state === 'plantW') {   // a espada erguida de ponta para baixo
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) el1Pisa(e, 22);   // crava: a rachadura de roseira (253)
    return;
  }
  if (e.state === 'crack') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.8 + Math.random() * 0.8; } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 20 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 22 + e.lvl * 0.25 : 11, 260, 270, dy, aggro);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (e.onGround && Math.abs(e.vx) > 3) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.62; const v = el2Near(e, 200); if (v > 0.05) sfx.el2PassoPesado(v); } }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 34 && Math.abs(dy) < 22 && clearPath(e, pl)) { e.state = 'slamW'; e.stateT = EL2_MONTANTE; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el2Ergue(Math.max(0.5, el2Near(e))); }
  else if (e.sees && dist > 3 * T && dist < 11 * T && Math.abs(dy) < 4 * T && pl.onGround) { e.state = 'plantW'; e.stateT = EL2_CRAVA; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el2Ergue(Math.max(0.5, el2Near(e)), 1.3); }
};

/* ---------- golpes, mortes, nascimento ---------- */
const el2Above = e => pl.y + pl.h <= e.y + 6;   // o herói por cima da cabeça
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  // o escudo alto do guardião: de frente não passa nada (por trás ou de cima, sim)
  if (e && !e.dead && e.type === 'guardiao' && dir === -e.facing && !el2Above(e)) {
    e.shieldHit = 0.3; e.memT = 4;
    const [x, y] = el2Pt(e, EL2_GD[el2GdPose(e)].sh[0] + 2, EL2_GD[el2GdPose(e)].sh[1], EL2_GBX, 33);
    el2Sparks(x, y, 10, EL2_PRATA, 70, 60, 0.35);
    sfx.el2Bloqueio(); shake(1); if (melee) pl.vx -= dir * 70;
    return;
  }
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !EL2_TYPES.includes(e.type)) return r;
  if (e.type === 'guardiao') e.stun = Math.min(e.stun, 0.12);
  if (e.type === 'cavespinho') { e.stun = Math.min(e.stun, e.state === 'slamW' || e.state === 'plantW' ? 0 : 0.06); if (Math.random() < 0.4) el2Sparks(e.x + e.w / 2, e.y + e.h / 2, 3, EL2_ROSA, 40, 200, 0.6); }
  if (e.type === 'mascarada' && e.state === 'charge' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); }
  if (e.type === 'musa' && (e.state === 'link' || e.state === 'sing')) el2Rompe(e);   // golpeada, o fio rompe
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!EL2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, el2Near(e, 260));
  if (e.type === 'guardiao') { el2Sparks(cx, cy - 4, 10, EL2_LUA, 50, -10, 0.8); burst(cx, cy, 10, '#8a9abc', 80, 300, 0.6); sfx.el2Bloqueio(); }
  else if (e.type === 'carpideira') { el2Aneis.push({ x: cx, y: cy, r: 0, t: 0, hit: true, dmg: 0, fade: 1 }); el2Sparks(cx, cy, 16, EL2_CINZA, 50, -30, 1); sfx.el2Choro(v, 1.3); }
  else if (e.type === 'mascarada') { el2Estalos.push({ x: cx, y: cy, t: 0 }); el2Sparks(cx, cy, 14, EL2_ROSA, 60, 60, 0.9); sfx.el2Some(v); }
  else if (e.type === 'musa') { el2Sparks(cx, cy, 14, EL2_FADA, 50, -30, 0.9); sfx.el2Rompe(v); }
  else if (e.type === 'cavespinho') { burst(cx, cy, 20, '#3e362c', 90, 300, 0.8); el2Sparks(cx, e.y + 6, 14, EL2_ROSA, 70, 120, 1); el2Sparks(cx, cy, 8, EL2_FADA, 50, 0, 0.8); sfx.el2Chao(v); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !EL2_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.8; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'carpideira') e.state = 'drift';
  else if (type === 'mascarada') { e.state = 'walk'; e.orbN = 3; e.orbA = Math.random() * 6.28; e.blinkCD = 0.6; }
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: os anéis do pranto, as pétalas, os encantos, os redemoinhos ---------- */
function el2Update(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // o pranto: o anel abre até 7 blocos; quem ele alcança leva dano e é empurrado para fora (o escudo erguido segura o
  // dano, não o empurrão inteiro)
  for (let i = el2Aneis.length - 1; i >= 0; i--) {
    const A = el2Aneis[i]; A.t += dt; A.r = EL2_ANEL_R * Math.min(1, A.t / EL2_ANEL_T);
    if (!A.hit && !pl.dead) {
      const d = Math.hypot(pcx - A.x, pcy - A.y);
      if (d <= A.r + 6 && d <= EL2_ANEL_R + 6) {
        A.hit = true;
        const r = hurtPlayer(A.dmg, A.x, null, true), k = r === 'hit' ? 1 : r === 'none' ? 0 : 0.5;
        if (k > 0) { const sd = Math.sign(pcx - A.x) || 1; pl.vx = sd * 320 * k; pl.vy = Math.min(pl.vy, -150 * k); pl.onGround = false; el2Sparks(pcx, pcy, 10, EL2_CINZA, 50, 0, 0.6); }
      }
    }
    if (A.t > EL2_ANEL_T + 0.4) el2Aneis.splice(i, 1);
  }
  // as pétalas-navalha: perseguem o herói virando devagar; somem na pedra ou nele
  for (let i = el2Petalas.length - 1; i >= 0; i--) {
    const O = el2Petalas[i]; O.t += dt; O.life -= dt;
    const want = Math.atan2(pcy - O.y, pcx - O.x); if (!pl.dead) O.a += clamp(el2Ang(want - O.a), -EL2_PET_VIRA * dt, EL2_PET_VIRA * dt);
    const sp = EL2_PET_SP * Math.min(1, 0.4 + O.t * 1.5);
    O.x += Math.cos(O.a) * sp * dt; O.y += Math.sin(O.a) * sp * dt;
    let gone = O.life <= 0 || solidAt(Math.floor(O.x / T), Math.floor(O.y / T));
    if (!gone && !pl.dead && O.x > pl.x - 3 && O.x < pl.x + pl.w + 3 && O.y > pl.y - 3 && O.y < pl.y + pl.h + 3) {
      const r = hurtPlayer(O.dmg, pcx - Math.cos(O.a) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) gone = true;
    }
    if (Math.random() < dt * 14) el2P({ x: O.x, y: O.y, vx: rnd(-6, 6), vy: rnd(-6, 6), g: 30, life: 0.5, max: 0.5, col: EL2_ROSA[(Math.random() * 3) | 0], size: 1 });
    if (gone) { el2Sparks(O.x, O.y, 6, EL2_ROSA, 40, 60, 0.5); el2Petalas.splice(i, 1); const v = clamp(1 - Math.hypot(pl.x - O.x, pl.y - O.y) / 220, 0, 1); if (v > 0.05) sfx.el2Corta(v); }
  }
  // os encantos: a figura avança sobre o herói e se desfaz em pétalas (sem dano)
  for (let i = el2Encantos.length - 1; i >= 0; i--) {
    const E = el2Encantos[i]; E.t += dt;
    const sd = Math.sign(pcx - (E.x + E.w / 2)) || E.facing; E.facing = sd;
    if (E.t > 0.25 && Math.abs(pcx - (E.x + E.w / 2)) > 6) { const nx = E.x + sd * 95 * dt; if (!rectSolid(nx, E.y, E.w, E.h)) E.x = nx; }
    if (E.t >= EL2_ENCANTO) {
      el2Sparks(E.x + E.w / 2, E.y + E.h / 2, 16, EL2_ROSA, 60, 60, 0.9);
      for (let j = 0; j < 8; j++) el2P({ x: E.x + rnd(0, E.w), y: E.y + rnd(0, E.h), vx: rnd(-40, 40), vy: rnd(-50, 0), g: 70, life: 1, max: 1, col: EL2_ROSA[j % 3], size: 1 });
      const v = clamp(1 - Math.hypot(pl.x - E.x, pl.y - E.y) / 240, 0, 1); if (v > 0.05) sfx.el2Desfaz(v);
      el2Encantos.splice(i, 1);
    }
  }
  for (let i = el2Estalos.length - 1; i >= 0; i--) { el2Estalos[i].t += dt; if (el2Estalos[i].t > 0.5) el2Estalos.splice(i, 1); }
  for (const e of enemies) if (e.shieldHit > 0) e.shieldHit -= dt;
}
HOOK.update.push(el2Update);
function clearEl2Fx() { el2Fx.length = 0; el2Aneis.length = 0; el2Petalas.length = 0; el2Encantos.length = 0; el2Estalos.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearEl2Fx(); el2Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: o elmo, a lança, a carpideira, as rosas, a lira, o elmo do cavaleiro, o fio
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !EL2_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'carpideira') addL(cx, cy, e.state === 'wail' ? 0.55 : 0.32);
    else if (e.type === 'mascarada') addL(cx, cy, e.state === 'charge' ? 0.5 : 0.18 + 0.06 * (e.orbN || 0));
    else if (e.type === 'musa') { addL(cx, cy, e.state === 'sing' || e.state === 'link' ? 0.45 : 0.22); if (e.fio > 0) { const [mx, my] = el2MuMao(e); addL(lerp(mx, pl.x + pl.w / 2, e.fio * 0.5), lerp(my, pl.y + pl.h / 2, e.fio * 0.5), 0.3); } }
    else if (e.type === 'cavespinho') addL(cx, e.y + 8, e.state === 'slamW' || e.state === 'plantW' ? 0.5 : 0.24);
    else addL(cx, e.y + 6, e.state === 'wind' || e.state === 'bashW' ? 0.45 : 0.22);
  }
  for (const O of el2Petalas) addL(O.x, O.y, 0.3);
}; }

// a luz aditiva: o anel, as rosas e as pétalas, o fio, os redemoinhos
HOOK.drawGlow.push((cx, cy) => {
  const G = EL2.GL;
  for (const A of el2Aneis) { const f = A.t < EL2_ANEL_T ? 1 : Math.max(0, 1 - (A.t - EL2_ANEL_T) / 0.4); lc.globalAlpha = 0.22 * f; lc.drawImage(G.pranto, Math.round(A.x - cx) - 14, Math.round(A.y - cy) - 14); }
  for (const O of el2Petalas) { lc.globalAlpha = 0.45; lc.drawImage(G.rosa, Math.round(O.x - cx) - 6, Math.round(O.y - cy) - 6); }
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'mascarada') {
      const ch = e.state === 'charge' ? clamp(1 - e.stateT / EL2_ROSAS, 0, 1) : 0;
      for (let i = 0; i < (e.orbN || 0); i++) { const [x, y] = el2RosaPos(e, i); lc.globalAlpha = 0.2 + ch * 0.5; lc.drawImage(ch > 0.3 ? G.rosaG : G.rosa, Math.round(x - cx) - (ch > 0.3 ? 12 : 6), Math.round(y - cy) - (ch > 0.3 ? 12 : 6)); }
    } else if (e.type === 'musa' && e.fio > 0) {
      const [mx, my] = el2MuMao(e), px = pl.x + pl.w / 2, py = pl.y + pl.h / 2;
      lc.globalAlpha = e.state === 'link' ? 0.3 : 0.18; for (let t = 0; t <= e.fio; t += 0.12) lc.drawImage(G.fada, Math.round(lerp(mx, px, t) - cx) - 4, Math.round(lerp(my, py, t) - Math.sin(t * Math.PI) * 6 - cy) - 4);
    }
  }
  for (const s of el2Estalos) { lc.globalAlpha = 0.6 * (1 - s.t / 0.5); lc.drawImage(G.rosaG, Math.round(s.x - cx) - 12, Math.round(s.y - cy) - 12); }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): os encantos da mascarada, tremeluzindo
HOOK.drawWorld.push((cx, cy) => {
  if (!el2Encantos.length) return;
  const B = EL2.get();
  for (const E of el2Encantos) {
    const q = E.t / EL2_ENCANTO, img = (E.facing > 0 ? B.mg[3].r : B.mg[3].l), fx = Math.round(E.x + E.w / 2) - cx, fy = Math.round(E.y + E.h) - cy;
    const j = Math.round(Math.sin(gameTime * 30 + E.seed) * 1);
    lc.globalAlpha = (0.55 + 0.25 * Math.sin(gameTime * 17 + E.seed)) * (q > 0.8 ? (1 - q) / 0.2 : 1);
    lc.drawImage(img, (E.facing > 0 ? fx - (EL2_MBX + 1) : fx - (img.width - EL2_MBX - 1)) + j, fy - 29);
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: o tremor antes do pranto e o anel, as rosas, as pétalas, o fio e as notas, a roseira acesa do
// montante, a ponta da lança, o escudo, os redemoinhos
function el2Dot(x, y, cx, cy, sz = 1) { lc.fillRect(Math.round(x - cx), Math.round(y - cy), sz, sz); }
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime, B = EL2.get();
  for (const e of enemies) {
    if (e.dead) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -60 || fx > VW + 60 || fy < -60 || fy > VH + 60) continue;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    if (e.type === 'carpideira' && e.state === 'wail') {
      // a luz em volta treme: um anel de pontinhos que vibra e aperta
      const q = clamp(1 - e.stateT / EL2_PRANTO, 0, 1), r = 16 - q * 6, n = 22;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + now * 2, w = Math.sin(now * 40 + i * 2.3) * (1 + q * 1.5);
        lc.globalAlpha = 0.35 + 0.5 * q; lc.fillStyle = i % 3 ? '#dfe6e2' : '#ffffff'; el2Dot(ecx + Math.cos(a) * (r + w), ecy - 3 + Math.sin(a) * (r + w), cx, cy);
      }
      // as lágrimas: dois fios vermelhos descendo do rosto
      lc.globalAlpha = 0.8; lc.fillStyle = '#c84a5a'; const ex = ecx + e.facing * 1, ey = e.y + el2CpBob(e) - 1; for (let k = 0; k < 3; k++) el2Dot(ex, ey + k + (now * 8 % 2 | 0), cx, cy);
    } else if (e.type === 'mascarada') {
      // as rosas negras girando; no aviso param, sobem e abrem (piscando por dentro)
      const ch = e.state === 'charge' ? clamp(1 - e.stateT / EL2_ROSAS, 0, 1) : 0;
      for (let i = 0; i < (e.orbN || 0); i++) {
        const [x, y] = el2RosaPos(e, i), img = B.rosa[ch > 0.4 ? 1 : 0].r;
        lc.globalAlpha = 1; lc.drawImage(img, Math.round(x - cx - img.width / 2), Math.round(y - cy - img.height / 2));
        if (ch > 0.4 && Math.floor(now * 16) % 2) { lc.fillStyle = '#f4d8ea'; el2Dot(x, y, cx, cy); }
      }
      if ((e.orbN || 0) < 3) { const [x, y] = el2RosaPos(e, e.orbN || 0), q = (e.orbGrow || 0) / 1.1; lc.globalAlpha = 0.3 + 0.5 * q; lc.fillStyle = '#843466'; el2Dot(x, y, cx, cy); }
      const o = EL2_MG[el2MgPose(e)], [ex, ey] = el2Scr(e, fx, fy, EL2_MBX + 0.6 + o.lean * 1.2 + 1.5, 5, EL2_MBX, 27);
      lc.globalAlpha = 1; lc.fillStyle = '#d8ffe4'; lc.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    } else if (e.type === 'musa' && e.fio > 0) {
      // o fio: uma linha fina em arco, da mão até onde chegou; as notas correndo nele
      const [mx, my] = el2MuMao(e), px = pl.x + pl.w / 2, py = pl.y + pl.h / 2, n = Math.max(4, Math.round(Math.hypot(px - mx, py - my) / 2.5)), link = e.state === 'link';
      for (let i = 0; i <= n * e.fio; i++) {
        const t = i / n, x = lerp(mx, px, t), y = lerp(my, py, t) - Math.sin(t * Math.PI) * 6 + Math.sin(now * 14 + i * 0.7) * (link ? 0.8 : 0.4);
        lc.globalAlpha = link ? 0.85 : 0.5 + 0.4 * t; lc.fillStyle = (i + Math.floor(now * (link ? -18 : 12))) % 6 === 0 ? '#f4fff0' : '#8ce0a8'; el2Dot(x, y, cx, cy);
      }
      if (!link) { const t = e.fio, x = lerp(mx, px, t), y = lerp(my, py, t) - Math.sin(t * Math.PI) * 6; lc.globalAlpha = 1; lc.fillStyle = '#ffffff'; el2Dot(x - 1, y, cx, cy, 2); }   // a ponta que avança
    } else if (e.type === 'cavespinho' && (e.state === 'slamW' || e.state === 'plantW')) {
      // pontinhos verdes subindo pela roseira da lâmina
      const k = el2CkPose(e), o = EL2_CK[k], [tx, ty] = el2KTip(k);
      for (let j = 0; j < 4; j++) { const t = (now * 1.8 + j / 4) % 1, [x, y] = el2Scr(e, fx, fy, lerp(o.hn[0], tx, t), lerp(o.hn[1], ty, t), EL2_KBX, EL2_KFY); lc.globalAlpha = 0.9; lc.fillStyle = j ? '#b8f0c8' : '#f4fff0'; lc.fillRect(Math.round(x), Math.round(y), 1, 1); }
      const [ex, ey] = el2Scr(e, fx, fy, EL2_KBX + 0.8 + o.lean * 1.2 + 2.6, 14.8 + o.low, EL2_KBX, EL2_KFY); lc.fillStyle = Math.floor(now * 16) % 2 ? '#f4fff0' : '#8ce0a8'; lc.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    } else if (e.type === 'guardiao' && (e.state === 'wind' || e.state === 'thrust')) {
      const [tx, ty] = el2GTip(el2GdPose(e)), [x, y] = el2Scr(e, fx, fy, tx, ty, EL2_GBX, 33);
      lc.globalAlpha = 1; lc.fillStyle = Math.floor(now * 14) % 2 ? '#ffffff' : '#c8e0ff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (e.state === 'wind') for (let j = 0; j < 3; j++) { const a = now * 9 + j * 2.09, r = 5 - clamp(1 - e.stateT / EL2_LANCA_W, 0, 1) * 3; lc.fillStyle = j ? '#9cc8ff' : '#ffffff'; lc.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
    } else if (e.type === 'guardiao' && (e.state === 'bashW' || e.state === 'bash')) {
      // o aro do escudo aceso, a luz correndo por ele
      const o = EL2_GD[el2GdPose(e)], n = 16;
      for (let i = 0; i < n; i++) { const t = i / n, yy = o.sh[1] - 8 + t * 16, hw = 3.6 * Math.pow(Math.sin(Math.PI * t), 0.6) + 0.6, on = (i + Math.floor(now * 20)) % 4 === 0; for (const sd of [-1, 1]) { const [x, y] = el2Scr(e, fx, fy, o.sh[0] + sd * hw, yy, EL2_GBX, 33); lc.globalAlpha = on ? 1 : 0.5; lc.fillStyle = on ? '#ffffff' : '#9cc8ff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1); } }
    }
  }
  // o anel do pranto: três aros ondulando, branco e cinza
  for (const A of el2Aneis) {
    const f = A.t < EL2_ANEL_T ? 1 : Math.max(0, 1 - (A.t - EL2_ANEL_T) / 0.4);
    for (let c = 0; c < 3; c++) {
      const r = A.r - c * 3; if (r < 2) continue;
      const n = Math.max(18, Math.round(r * 1.7));
      lc.globalAlpha = f * (A.fade ? 0.5 : 0.9 - c * 0.22); lc.fillStyle = c === 0 ? '#ffffff' : c === 1 ? '#dfe6e2' : '#7a847c';
      for (let i = 0; i < n; i++) { const a = i / n * 6.28, w = Math.sin(a * 6 + now * 12 + c) * 1.2; el2Dot(A.x + Math.cos(a) * (r + w), A.y + Math.sin(a) * (r + w), cx, cy); }
    }
  }
  // as pétalas voando: girando, com a borda clara cortante
  for (const O of el2Petalas) {
    const img = B.pet[Math.floor(O.t * 14) % 4]; lc.globalAlpha = 1; lc.drawImage(img, Math.round(O.x - cx - 3.5), Math.round(O.y - cy - 3.5));
    lc.fillStyle = '#f4d8ea'; el2Dot(O.x, O.y, cx, cy);
    lc.fillStyle = '#843466'; for (let k = 1; k <= 3; k++) { lc.globalAlpha = 0.6 - k * 0.15; el2Dot(O.x - Math.cos(O.a) * k * 2.5, O.y - Math.sin(O.a) * k * 2.5, cx, cy); }
  }
  // os redemoinhos de pétalas do sumiço
  for (const s of el2Estalos) {
    const p = s.t / 0.5, n = 12;
    for (let i = 0; i < n; i++) { const a = i / n * 6.28 + p * 7, r = 3 + p * 10 + (i % 3); lc.globalAlpha = 1 - p; lc.fillStyle = i % 3 ? '#843466' : '#c890b8'; el2Dot(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 1.3 - p * 6, cx, cy, i % 4 ? 1 : 2); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  // o guardião: os passos de armadura, a lança acendendo, a estocada, o escudo, a investida, o bloqueio
  el2Passo(v = 1) { noise(0.06, 0.03 * v, 2400, 'bandpass', 0, 3); tone(140, 0.06, 'sine', 0.02 * v, -40); },
  el2Vira(v = 1) { noise(0.12, 0.02 * v, 3000, 'bandpass', 0, 4); },
  el2Lanca(v = 1) { tone(880, 0.55, 'sine', 0.016 * v, 660); tone(1320, 0.55, 'triangle', 0.006 * v, 900); },
  el2Estocada(v = 1) { noise(0.14, 0.07 * v, 2800, 'bandpass', 0, 1.2); tone(1500, 0.08, 'sine', 0.02 * v, -600); },
  el2Escudo(v = 1) { tone(220, 0.6, 'triangle', 0.03 * v, 120); for (let k = 0; k < 3; k++) tone(1100 + k * 330, 0.1, 'sine', 0.01 * v, 0, 0.2 + k * 0.12); },
  el2Investida(v = 1) { noise(0.4, 0.08 * v, 600, 'lowpass'); tone(110, 0.35, 'sawtooth', 0.025 * v, -40); },
  el2Bloqueio() { tone(1200, 0.18, 'sine', 0.04, -400); tone(2400, 0.12, 'triangle', 0.014, -800); noise(0.1, 0.04, 4200, 'highpass'); },
  // a carpideira: o choro baixo, a boca abrindo, o pranto
  el2Choro(v = 1, p = 1) { for (let k = 0; k < 3; k++) tone((480 - k * 40) * p, 0.5, 'sine', 0.012 * v, -120 * p, k * 0.42); noise(1.2, 0.006 * v, 1600, 'bandpass', 0, 2); },
  el2Abre(v = 1) { tone(300, 1, 'sine', 0.018 * v, 500); tone(304, 1, 'triangle', 0.008 * v, 520); noise(1, 0.012 * v, 2600, 'bandpass', 0, 3); },
  el2Pranto(v = 1) { for (let k = 0; k < 3; k++) tone(980 + k * 120, 1, 'sawtooth', 0.011 * v, -520 - k * 60, k * 0.04); tone(490, 1, 'sine', 0.028 * v, -240); noise(0.8, 0.03 * v, 3200, 'bandpass', 0, 1); },
  // a mascarada: o riso abafado atrás da máscara, as rosas abrindo, as pétalas, o sumiço, o encanto desfazendo
  el2Riso(v = 1) { for (let k = 0; k < 4; k++) tone(620 + Math.random() * 60, 0.07, 'triangle', 0.01 * v, -80, k * 0.11); },
  el2Abrem(v = 1) { for (let k = 0; k < 3; k++) tone(520 + k * 180, 0.3, 'sine', 0.012 * v, 160, 0.12 + k * 0.2); noise(0.8, 0.012 * v, 2400, 'bandpass', 0, 3); },
  el2Petalas(v = 1) { for (let k = 0; k < 3; k++) noise(0.14, 0.05 * v, 3800 + k * 400, 'bandpass', k * 0.06, 2); tone(900, 0.2, 'sine', 0.012 * v, -300); },
  el2Corta(v = 1) { noise(0.06, 0.04 * v, 5200, 'bandpass', 0, 2); },
  el2Some(v = 1) { noise(0.35, 0.05 * v, 3000, 'bandpass', 0, 1.2); tone(1400, 0.25, 'sine', 0.014 * v, -900); },
  el2Desfaz(v = 1) { for (let k = 0; k < 5; k++) tone(1800 - k * 200, 0.1, 'sine', 0.008 * v, -100, k * 0.05); noise(0.4, 0.012 * v, 4400, 'highpass'); },
  // a musa: a cantiga, as notas da lira, o fio prendendo, a vida passando, o fio rompendo
  el2Cantiga(v = 1) { const s = [0, 3, 5, 7, 5]; for (let k = 0; k < 5; k++) tone(440 * Math.pow(2, s[k] / 12), 0.3, 'sine', 0.01 * v, 0, k * 0.28); },
  el2Nota(v = 1, n = 0) { const s = [0, 3, 7, 10, 12]; tone(523 * Math.pow(2, s[n] / 12), 0.35, 'triangle', 0.016 * v, -4); tone(1046 * Math.pow(2, s[n] / 12), 0.2, 'sine', 0.004 * v, 0); },
  el2Prende(v = 1) { tone(660, 0.5, 'sine', 0.02 * v, 220); tone(990, 0.5, 'sine', 0.01 * v, 330, 0.05); },
  el2Suga(v = 1) { tone(520, 0.18, 'sine', 0.012 * v, -200); tone(780, 0.14, 'sine', 0.006 * v, -260, 0.04); },
  el2Rompe(v = 1) { tone(1760, 0.2, 'triangle', 0.02 * v, -1200); noise(0.1, 0.02 * v, 5000, 'highpass'); },
  // o cavaleiro: os passos pesados, o montante erguendo (a casca rangendo), o golpe, o chão
  el2PassoPesado(v = 1) { noise(0.14, 0.05 * v, 240, 'lowpass'); tone(62, 0.14, 'sine', 0.04 * v, -20); noise(0.05, 0.012 * v, 2400, 'bandpass', 0.02, 3); },
  el2Ergue(v = 1, p = 1) { tone(95 * p, 0.6, 'sawtooth', 0.014 * v, 40 * p); noise(0.6, 0.018 * v, 520 * p, 'bandpass', 0, 3); },
  el2Desce(v = 1) { noise(0.2, 0.08 * v, 900, 'bandpass', 0, 0.8); tone(180, 0.15, 'sawtooth', 0.02 * v, -100); },
  el2Chao(v = 1) { tone(46, 0.55, 'sine', 0.13 * v, -16); noise(0.4, 0.12 * v, 240, 'lowpass'); for (let k = 0; k < 4; k++) noise(0.03, 0.03 * v, 1900 + Math.random() * 900, 'bandpass', 0.06 + k * 0.06, 3); }
});
/* ---------- as faíscas acesas (com o brilho da cor delas, não o brilho quente das partículas comuns) ---------- */
const el2Fx = [], el2FxGl = {};
function el2P(o) { if (el2Fx.length < 500) el2Fx.push(o); }
HOOK.update.push(dt => {
  for (let i = el2Fx.length - 1; i >= 0; i--) { const p = el2Fx[i]; p.life -= dt; if (p.life <= 0) { el2Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of el2Fx) { const g = el2FxGl[p.col] || (el2FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of el2Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
