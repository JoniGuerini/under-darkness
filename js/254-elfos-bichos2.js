'use strict';

/* ================= o Reino Élfico: os guardiões e os Desterrados, parte dois =================
   Cinco dos dez bichos da décima primeira camada (docs/camadas/11-reino-elfico.md, seção 6; os outros cinco estão no
   253). Os do Reino em prata, azul-lua e branco, com os avisos em prata e azul; os Desterrados em carmesim, vinho e
   ouro velho, com os avisos em carmesim e ouro (e o verde vil do caçador).
   - o Hipogrifo (hipogrifo), meio-águia de penas brancas e azuis, meio-cavalo, o bico de ouro; voa alto em círculos
     em volta do herói. Grita e se encolhe no ar (0,6 s): mergulha em linha reta até onde o herói estava e sobe de novo;
   - o Guardião do Salão (guardiao), alto, de armadura completa de folhas de prata, elmo alado, escudo alto e lança;
     anda devagar e vira devagar. O escudo bloqueia tudo pela frente (só leva dano por trás ou de cima). A ponta da
     lança acende (0,6 s): estocada longa; a cada 3 golpes, o escudo acende (0,6 s) e vem a investida que empurra;
   - o Espectro Élfico (espectro), a elfa morta translúcida, os cabelos boiando; atravessa paredes e voa devagar. Abre
     a boca e a luz em volta treme (1 s): o lamento sai em anel; quem é pego leva dano e fica silenciado 3 s
     (elSilenciar, 250; o 259 faz valer);
   - o Magíster Sangrento (magister), o mago desterrado de manto carmesim e ouro, com três orbes verdes girando em
     volta; mantém distância. As orbes param e acendem (0,8 s) e saem as três, perseguindo o herói devagar; elas voltam
     a crescer uma a uma. Se o herói chega perto, pisca (um estalo dourado) para uns 5 blocos dali;
   - o Caçador Vendado (cacador), o elfo desterrado de olhos vendados, chifres pequenos, as tatuagens verdes que
     acendem e duas lâminas curvas; anda pulando. As tatuagens acendem e ele se agacha (0,5 s): avança em linha reta
     atravessando o herói e deixa no chão um rastro de fogo vil que queima por 2 s. Cai planando com asas de sombra.
   O 255 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache),
   rampas de 6 tons com luz de cima à esquerda; brilhos pelo HOOK.drawGlow e EYES_E, os pontinhos acesos por cima do
   escuro (HOOK.drawTop). Materiais e bases do 257 (filtrados). Prefixo el2. */

/* ---------- números ---------- */
Object.assign(ET, {
  hipogrifo: { name: 'Hipogrifo', w: 18, h: 12, hp: 120, dmg: 25, xp: 36, kb: 0.5, fly: true, blood: '#c83a48' },
  guardiao: { name: 'Guardião do Salão', w: 10, h: 26, hp: 220, dmg: 27, xp: 46, kb: 0.2, fly: false, blood: '#b83a48' },
  espectro: { name: 'Espectro Élfico', w: 10, h: 22, hp: 90, dmg: 21, xp: 30, kb: 0.6, fly: true, phase: true, blood: '#c8e8ff' },
  magister: { name: 'Magíster Sangrento', w: 9, h: 23, hp: 100, dmg: 24, xp: 34, kb: 0.8, fly: false, blood: '#b02030' },
  cacador: { name: 'Caçador Vendado', w: 9, h: 22, hp: 130, dmg: 28, xp: 40, kb: 0.6, fly: false, blood: '#b02030' }
});
const EL2_TYPES = ['hipogrifo', 'guardiao', 'espectro', 'magister', 'cacador'];
// materiais e bases do 257; filtradas agora e de novo a cada mundo
const EL2_DROPS = {
  hipogrifo: [['pena_hipogrifo', 0.6, 1, 2], ['min_lunarita', 0.08], ['pocao', 0.07]],
  guardiao: [['folha_prata', 0.4], ['min_lunarita', 0.1], ['pocao', 0.08], ['escudo_folha', 0.02], ['elmo_alado', 0.01]],
  espectro: [['lagrima_espectro', 0.5], ['min_lunarita', 0.06], ['pocao', 0.07]],
  magister: [['cristal_sangrento', 0.5], ['min_lunarita', 0.08], ['pocao', 0.08]],
  cacador: [['cristal_sangrento', 0.4], ['min_lunarita', 0.08], ['pocao', 0.08]]
};
function el2Tables() { for (const k of EL2_TYPES) DROPS[k] = EL2_DROPS[k].filter(([id]) => ITEMS[id]); }
el2Tables();
Object.assign(NAV_WALKERS, { guardiao: 1, magister: 1, cacador: 1 });
Object.assign(CV_STEP, { guardiao: 1, magister: 1, cacador: 1 });

const EL2_GRITO = 0.6, EL2_LANCA_W = 0.6, EL2_ESCUDO_W = 0.6, EL2_LAMENTO = 1, EL2_ORBES = 0.8, EL2_AGACHA = 0.5;
const EL2_ANEL_R = 7 * T, EL2_ANEL_T = 0.55;     // o lamento: raio e tempo para abrir
const EL2_ORBE_SP = 78, EL2_ORBE_VIRA = 1.9;      // as orbes: velocidade e quanto viram por segundo
const EL2_FOGO_T = 2;                             // quanto o rastro de fogo vil queima

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
// o magíster (24 x 28, o corpo no x 11): hn a mão de perto, hf a de longe, sw a barra do manto
const EL2_MBX = 11;
const EL2_MG = [
  { lean: 0, sw: 0, hn: [14, 16.4], hf: [8.6, 16.6] },
  { lean: 0.4, sw: 1, hn: [14.4, 16], hf: [8.2, 16.2] },
  { lean: 0.4, sw: -1, hn: [13.6, 16.6], hf: [9, 16] },
  { lean: -0.4, sw: 0, hn: [15.6, 5.6], hf: [7, 5.8], up: 1 },          // 3 as mãos erguidas (aviso)
  { lean: 0.8, sw: 0.6, hn: [18.6, 11.4], hf: [7.4, 14.4] }              // 4 lançou
];
// o caçador (26 x 28, o corpo no x 11): b/f os pés, hn/hf as mãos com as lâminas (ângulo an/af)
const EL2_CBX = 11;
const EL2_CC = [
  { low: 1, lean: 0.6, b: [8.4, 27], f: [14.6, 27], hn: [15.6, 16.2], an: 2.2, hf: [8.6, 16.6], af: 2.6 },              // 0 parado, meio agachado
  { low: 0.6, lean: 1, b: [7, 27], f: [15.8, 27], hn: [15.8, 15.6], an: 2, hf: [9.6, 16.4], af: 2.8 },                   // 1-2 andando
  { low: 1, lean: 1, b: [13.4, 27], f: [9.4, 26.6], hn: [14.8, 16.6], an: 2.4, hf: [7.8, 15.4], af: 2.4 },
  { low: 3.4, lean: 1.6, b: [6.6, 27], f: [16, 27], hn: [8.4, 15.4], an: 3.6, hf: [6, 17.6], af: 3.3 },                 // 3 agachado (aviso)
  { low: 2, lean: 3.4, b: [3.6, 25.6], f: [14.8, 27], hn: [21.4, 14.6], an: 0.15, hf: [5.4, 13.2], af: 3.5 },             // 4 o avanço
  { low: 0, lean: -0.2, b: [9.2, 26.4], f: [13.4, 25.4], hn: [16.6, 11.2], an: -0.6, hf: [5.6, 11.4], af: -2.5, air: 1 }    // 5 planando
];

/* ================= arte ================= */
const EL2 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const ER = {
  pele: R6(['#3c2c30', '#6e5458', '#a8868a', '#d0b2ac', '#ead6cc', '#fbf0e8']),
  palida: R6(['#2a2430', '#4a4050', '#726878', '#9a909e', '#c2b8c2', '#e6dee4']),     // a pele cinza do caçador
  prata: R6(['#161c2c', '#323c56', '#58668a', '#8a9abc', '#c2d0e8', '#f2f8ff']),
  lua: R6(['#0a1430', '#142a5c', '#22468e', '#3466b8', '#5a8ede', '#9cc0f4']),
  branco: R6(['#4a5466', '#7a8496', '#a8b2c2', '#d0d8e4', '#eef2f8', '#ffffff']),     // as penas brancas
  pena: R6(['#0c1e48', '#16357a', '#2456aa', '#3a7ad0', '#68a2ec', '#a8ccff']),       // as penas azuis
  cavalo: R6(['#3a3e4a', '#5e6270', '#868a98', '#aeb2be', '#d2d6de', '#f2f4f8']),
  ouro: R6(['#3a2408', '#6a4410', '#a06c1a', '#d09a30', '#f0c050', '#fff0a0']),       // o ouro velho (e o bico)
  carmesim: R6(['#2a0408', '#4e0a12', '#7a121e', '#a81c2c', '#d02a3a', '#f06070']),
  vinho: R6(['#14060c', '#260c16', '#3c1222', '#561a30', '#722640', '#923654']),
  cabeloOuro: R6(['#4a3418', '#7a5a28', '#a8823c', '#d0aa58', '#ecd282', '#fff2c0']),
  negro: R6(['#050408', '#0c0a12', '#16121e', '#221c2c', '#30283c', '#443a52']),
  vil: R6(['#0a2a06', '#145010', '#20801a', '#3ab82a', '#7aff4a', '#d4ffb0']),
  aco: R6(['#121418', '#22262e', '#383e48', '#545c68', '#7a8492', '#a8b2be']),
  fantasma: R6(['#14243a', '#264466', '#3e6890', '#6c98bc', '#a8cce4', '#e8f8ff'])
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

/* ---------- o Hipogrifo, 34 x 26 de frente para a direita ----------
   0-2 batendo as asas (em cima, no meio, embaixo), 3 encolhido gritando (aviso), 4 mergulhando (asas para trás) */
const HW = [   // o pulso e a ponta da asa de perto por quadro
  { w: [13, 2], t: [4.6, 0.4] }, { w: [10.6, 6.6], t: [0.6, 5.6] }, { w: [12.4, 15.6], t: [5.6, 22.4] },
  { w: [12.6, 8.4], t: [5.4, 11.6] }, { w: [11.4, 8.4], t: [1.4, 10.6] }
];
function hipogrifo(k) {
  const P = cp(34, 26), s = 25601 + k * 7, W = HW[k], tuck = k === 3, dive = k === 4;
  const S = [16.4, 10.4], B = [11.6, 12.4];   // o ombro e onde a asa encosta no corpo
  // a asa: penas de cobertura brancas junto do bordo, as rêmiges azuis na ponta, separadas, a borda de trás serrilhada
  const asa = (dx, dy, dark) => {
    const s0 = [S[0] + dx, S[1] + dy], w = [W.w[0] + dx, W.w[1] + dy], t = [W.t[0] + dx, W.t[1] + dy], b = [B[0] + dx, B[1] + dy];
    const back = [], n = 6;
    for (let i = 1; i < n; i++) { const q = i / n, x = lerp(t[0], b[0], q), y = lerp(t[1], b[1], q), nx = (b[1] - t[1]), ny = -(b[0] - t[0]), L = Math.hypot(nx, ny) || 1, sg = ny / L > 0 ? 1 : -1; back.push([x + (i % 2 ? 1.1 : 0) * nx / L * sg, y + (i % 2 ? 1.1 : 0) * ny / L * sg]); }
    const pts = [s0, w, t, ...back, b];
    const ax = t[0] - s0[0], ay = t[1] - s0[1], AL = ax * ax + ay * ay || 1;
    poly(P, pts, ER.branco, (x, y) => {
      const px = x + 0.5 - s0[0], py = y + 0.5 - s0[1], q = clamp((px * ax + py * ay) / AL, 0, 1);
      // a distância até o bordo de ataque (ombro -> pulso -> ponta)
      const dseg = (x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1, u = clamp(((x + 0.5 - x0) * vx + (y + 0.5 - y0) * vy) / L, 0, 1); return Math.hypot(x + 0.5 - x0 - vx * u, y + 0.5 - y0 - vy * u); };
      const d = Math.min(dseg(s0[0], s0[1], w[0], w[1]), dseg(w[0], w[1], t[0], t[1]));
      const ang = Math.atan2(y + 0.5 - w[1], x + 0.5 - w[0]), sep = Math.abs(Math.sin(ang * 7 + d * 0.2)) < 0.2 ? -1 : 0;
      const dk = dark ? -1.4 : 0;
      if (d < 1.1) return [ER.branco, 5 + dk];
      if (q > 0.5 || d > 4.2) return [ER.pena, 3.4 - d * 0.12 + sep + dk + (q > 0.85 ? 0.6 : 0)];
      return [ER.branco, 3.8 - d * 0.25 + (Math.abs(Math.sin(x * 1.6 + y * 0.8)) < 0.3 ? -0.7 : 0) + dk];
    });
  };
  if (!tuck) asa(-1.6, -1.4, true);
  // a cauda de cavalo: fios de prata-azulada caindo para trás
  for (let j = 0; j < 5; j++) { const sw = dive ? -3 : 0; P.line(5.6, 12.2 + j * 0.3, 0.8 + j * 0.3, 16.6 + j * 0.9 + sw * (1 - j * 0.15), ER.cavalo, 3.6 - j * 0.4); }
  P.line(5.6, 12, 1.6, 13.4, ER.cavalo, 4.4);
  // as patas de trás (cavalo): soltas para trás, os cascos escuros
  const tras = (x0, y0, x1, y1, base) => { tubo(P, x0, y0, (x0 + x1) / 2 + 0.6, (y0 + y1) / 2 + 0.8, 1.5, 1.1, ER.cavalo, base, s); tubo(P, (x0 + x1) / 2 + 0.6, (y0 + y1) / 2 + 0.8, x1, y1, 1.1, 0.8, ER.cavalo, base, s + 1); P.put(x1 - 0.6, y1 + 0.6, ER.negro, 3); P.put(x1 + 0.4, y1 + 0.6, ER.negro, 2); };
  tras(8.6, 14.4, dive ? 2.4 : 4, dive ? 17.6 : 20, 1.8);
  // o corpo: a anca de cavalo branca-cinza, o peito de águia em escamas de pena
  ell(P, 10.4, 12.6, 6, 3.9, 0, ER.cavalo, s + 2, 3.2, (u, v) => [ER.cavalo, v > 0.5 ? -0.8 : 0]);
  ell(P, 17.2, 12.2, 5, 4.2, 0.1, ER.branco, s + 3, 3.4, (u, v, x, y) => [ER.branco, ((x + (y % 2) * 1.5) % 3 < 0.8 && v > -0.6 ? -0.9 : 0) + (v > 0.55 ? -0.7 : 0)]);
  tras(10.6, 14.8, dive ? 4.6 : 7.4, dive ? 18.4 : 21, 3);
  // as patas da frente (águia): amarelas de escamas, as garras pretas; encolhidas no grito, para a frente no mergulho
  const garra = (x0, y0, x1, y1, base) => { P.line(x0, y0, x1, y1, ER.ouro, base); P.line(x0 + 0.6, y0, x1 + 0.6, y1, ER.ouro, base - 1); for (const ox of [-0.6, 0.6, 1.6]) P.put(x1 + ox, y1 + 0.8, ER.negro, 3); };
  garra(18.6, 15.4, dive ? 23.4 : tuck ? 19.6 : 19.8, dive ? 18 : tuck ? 17.4 : 19.4, 4);
  // o pescoço e a cabeça: branca, a crista azul para trás, o bico de ouro em gancho; no grito, a cabeça sobe e o bico abre
  const hx = tuck ? 23.4 : dive ? 25 : 24.2, hy = tuck ? 5.4 : dive ? 9 : 6.8;
  ell(P, (17.6 + hx) / 2 + 0.6, (11 + hy) / 2 + 0.6, 2.6, 3.6, -0.6, ER.branco, s + 4, 3.6);
  ell(P, hx, hy, 3, 2.6, 0, ER.branco, s + 5, 3.8, (u, v) => [ER.branco, v > 0.5 ? -0.6 : 0]);
  for (const [ox, oy, l, b] of [[-2, -1.6, 4.4, 4], [-2.4, -0.4, 4.8, 3.4], [-2.2, 0.8, 3.6, 2.6]]) P.line(hx + ox, hy + oy, hx + ox - l, hy + oy - (tuck ? 0.4 : 1.2) + (dive ? 1.4 : 0), ER.pena, b);
  const bk = tuck ? 1 : 0;
  poly(P, [[hx + 2.2, hy - 0.8], [hx + 4.8, hy - 0.2], [hx + 5.4, hy + 1.2], [hx + 4.6, hy + 2.2], [hx + 3.8, hy + 1.2], [hx + 2.2, hy + 1]], ER.ouro, (x, y) => 4 - (y - hy) * 0.6 + (x > hx + 4.4 ? -1 : 0));
  if (bk) { P.line(hx + 2.4, hy + 1.8, hx + 4.4, hy + 3, ER.ouro, 3); P.put(hx + 3, hy + 1.6, ER.carmesim, 2); }
  P.put(hx + 1, hy - 0.6, ER.negro, 0); P.put(hx + 0.6, hy - 1, ER.branco, 5); P.put(hx + 1, hy - 1.4, ER.branco, 2.4);   // o olho
  // a asa de perto
  if (!tuck) asa(0, 0, false);
  else { poly(P, [[S[0], S[1] - 0.6], [W.w[0], W.w[1]], [W.t[0], W.t[1]], [B[0] + 2, B[1] + 2.4]], ER.branco, (x, y) => { const d = y - (W.w[1] + (x - W.w[0]) * 0.3); return d < 1 ? [ER.branco, 4.6] : [ER.pena, 3.2 - d * 0.2 + (Math.abs(Math.sin(x * 1.4)) < 0.25 ? -1 : 0)]; }); }
  return setO(P.done());
}

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

/* ---------- o Espectro Élfico, 26 x 30 (sem pernas: o vestido some em fiapos) ----------
   0-2 boiando (cabelo e vestido ondulando), 3 o lamento (a cabeça para trás, a boca aberta, os braços abertos) */
function espectro(k) {
  const P = cp(26, 30), s = 25701 + k * 7, wail = k === 3, ph = k * 2.1, cx = 12, R = ER.fantasma;
  const hx = cx + (wail ? -0.6 : 0.6), hy = wail ? 6.4 : 6.8;
  // o cabelo comprido boiando para cima e para trás, em mechas
  for (let j = 0; j < 7; j++) {
    let x = hx - 1 + j * 0.3, y = hy - 2.4 + j * 0.4;
    for (let i = 0; i < 14; i++) { x -= 0.75 + j * 0.04; y += Math.sin(i * 0.5 + ph + j * 0.7) * 0.5 - 0.35 + j * 0.05; P.put(x, y, R, 4.2 - i * 0.16 - j * 0.15 + (i % 4 === 0 ? 0.6 : 0)); }
  }
  // o vestido: do peito para baixo, alargando e ondulando, rasgado em fiapos embaixo
  for (let y = 10; y < 30; y++) {
    const t = (y - 10) / 20, hw = 2.6 + t * 4.2, c = cx - t * 1.6 + Math.sin(t * 5 + ph) * 1.2;
    for (let x = Math.floor(c - hw); x <= c + hw; x++) {
      const u = (x + 0.5 - c) / hw, frayed = t > 0.6 && (hash2(x, 0, s) < (t - 0.6) * 2.2 + Math.sin(x * 1.9 + ph) * 0.2);
      if (frayed) continue;
      P.put(x, y, R, 3.4 - u * 1.2 - t * 1.6 + (Math.abs(Math.sin(x * 1.3 + y * 0.12 + ph)) < 0.25 ? -0.8 : 0) + cg(x, y, s) * 0.3);
    }
  }
  // a cintura, o corpete, a gola de folha
  ell(P, cx + 0.3, 11.6, 2.6, 3, 0, R, s + 1, 3.6);
  P.line(cx - 2, 13.6, cx + 2.6, 13.4, R, 4.8);
  // os braços: finos; no lamento, abertos para os lados
  if (wail) { braco(P, cx + 1, 10.4, cx + 7.6, 7.4, R, R, 3.6, s + 2, R, 0.8); braco(P, cx - 1, 10.4, cx - 6.6, 7, R, R, 2.4, s + 3, R, 0.8); }
  else { braco(P, cx - 0.8, 10.6, cx - 2.2, 17.6 + Math.sin(ph) * 0.6, R, R, 2.4, s + 3, R, 0.8); braco(P, cx + 1, 10.6, cx + 3.6, 16.8 + Math.cos(ph) * 0.6, R, R, 3.6, s + 2, R, 0.8); }
  // a cabeça: o rosto fino, os olhos fundos (o EYES_E acende), a orelha; no lamento a boca escura aberta
  ell(P, hx, hy, 2.3, 2.8, wail ? -0.3 : 0.1, R, s + 4, 3.8, (u, v) => [R, u > 0.5 ? -0.4 : 0]);
  orelha(P, hx - 0.2, hy - 0.2, R);
  P.put(hx + 1.2, hy - 0.4, ER.negro, 2); P.put(hx + 1.2, hy - 0.4 + 0.6, R, 1.2);
  if (wail) { ell(P, hx + 1, hy + 1.8, 0.9, 1.4, 0.2, ER.negro, s + 5, 0.4); }
  else P.put(hx + 1.2, hy + 1.6, R, 2);
  P.put(hx + 2.4, hy + 0.4, R, 4.4);
  // a coroa de folhas de prata, apagada
  for (let x = hx - 2; x <= hx + 1.6; x += 0.5) P.put(x, hy - 2.6 - (x > hx ? (x - hx) * 0.3 : 0), R, 5);
  return P.done();
}

/* ---------- o Magíster Sangrento, 24 x 28 ---------- */
function magister(k) {
  const o = EL2_MG[k], P = cp(24, 28), s = 25751 + k * 7, BX = EL2_MBX;
  const sx = BX + o.lean, sy = 9.6, hx = BX + 0.6 + o.lean * 1.2, hy = 5.4;
  // o cabelo de ouro comprido nas costas
  poly(P, [[hx - 2.4, hy - 2.4], [hx + 0.6, hy - 2.8], [hx - 0.6, hy + 2], [sx - 1.4, sy + 7], [sx - 3.2, sy + 7.6], [hx - 3.8, hy + 1.4]], ER.cabeloOuro, (x, y) => 3.6 - (y - hy) * 0.12 + (Math.abs(Math.sin(x * 2.2 + y * 0.3)) < 0.35 ? -0.9 : 0) + cg(x, y, s) * 0.4);
  // o braço de longe
  braco(P, sx - 0.6, sy + 1, o.hf[0], o.hf[1], ER.carmesim, ER.carmesim, 1.6, s + 1);
  // o manto longo até os pés: carmesim com a barra e a faixa do meio em ouro, as dobras; a barra balança no andar
  const hem = 27, sw = o.sw;
  poly(P, [[sx - 2.2, sy], [sx + 2.4, sy], [BX + 4.4 + sw * 0.8, hem], [BX - 4 + sw * 0.4, hem], [BX - 4.6 + sw * 0.4, hem - 1]], ER.carmesim, (x, y) => {
    if (y >= hem - 1) return [ER.ouro, x % 2 ? 4.4 : 3.2];
    const mid = Math.abs(x + 0.5 - (sx + 0.6 + (y - sy) * 0.08)) < 0.6;
    if (mid) return [ER.ouro, 3.6 - (y - sy) * 0.05];
    return [ER.carmesim, 3.4 - (x - BX) * 0.25 - (y - sy) * 0.06 + (Math.abs(Math.sin(x * 1.5 + y * 0.1 + sw)) < 0.3 ? -0.9 : 0) + cg(x, y, s) * 0.3];
  });
  for (let x = BX - 2.4; x <= BX + 2.6; x += 0.5) P.put(x, 16.4, ER.ouro, x > BX + 1 ? 2.6 : 4);   // o cinto de ouro
  P.put(BX + 0.8, 16.4, ER.vil, 4.6);                                                              // a pedra verde
  // a gola alta de ouro e as ombreiras em curva para cima
  poly(P, [[hx - 2.6, hy + 2.4], [hx + 1.4, hy + 3.6], [sx + 2.8, sy + 0.8], [sx - 3, sy + 1.2], [hx - 3.4, hy + 0.4]], ER.vinho, (x, y) => 3 + cg(x, y, s) * 0.3);
  for (let y = hy - 0.6; y < hy + 3.6; y += 0.5) P.put(hx - 3.2 + (y - hy) * 0.2, y, ER.ouro, 4.4 - (y - hy) * 0.3);
  ell(P, sx + 0.2, sy + 1, 2.6, 1.6, -0.3, ER.ouro, s + 2, 3.4); P.put(sx + 2.4, sy - 0.6, ER.ouro, 4.6); P.put(sx + 2.8, sy - 1.4, ER.ouro, 5);
  // a cabeça: o rosto fino, os olhos verdes acesos (EYES_E), a orelha, a franja de ouro, o diadema
  ell(P, hx - 0.4, hy - 0.8, 2.6, 2.4, 0, ER.cabeloOuro, s + 3, 3.4);
  ell(P, hx + 0.6, hy + 0.4, 1.9, 2.5, 0.15, ER.pele, s + 4, 3.1, (u, v) => (v > 0.6 && u < -0.2 ? null : [ER.pele, u > 0.6 ? -0.4 : 0]));
  P.put(hx + 2.3, hy + 0.6, ER.pele, 4.4); P.put(hx + 1.5, hy - 0.2, ER.vil, 4.6); P.put(hx + 1.5, hy - 1, ER.pele, 1.6); P.put(hx + 1.6, hy + 2, ER.pele, 1.8);
  orelha(P, hx, hy);
  P.line(hx + 0.4, hy - 2.4, hx + 2.4, hy - 0.8, ER.cabeloOuro, 4.6);
  for (let x = hx - 2; x <= hx + 2; x += 0.5) P.put(x, hy - 1.8 - (x - hx) * 0.15, ER.ouro, x > hx + 1 ? 4.8 : 3.6);
  P.put(hx + 1.2, hy - 2.6, ER.carmesim, 5);   // a gema do diadema
  // o braço de perto com a manga larga de ouro na boca
  braco(P, sx + 0.8, sy + 1, o.hn[0], o.hn[1], ER.carmesim, ER.carmesim, 3, s + 5, ER.pele, 1.15);
  const mx = (sx + 0.8 + o.hn[0]) / 2, my = (sy + 1 + o.hn[1]) / 2 + 1.2;
  P.put(lerp(mx, o.hn[0], 0.6), lerp(my, o.hn[1], 0.6), ER.ouro, 4.4); P.put(lerp(mx, o.hn[0], 0.6) + 0.6, lerp(my, o.hn[1], 0.6) + 0.6, ER.ouro, 3);
  return setO(P.done());
}
// a orbe vil: o miolo claro, o anel verde, a sombra escura por fora
function orbe(r) {
  const n = Math.ceil(r * 2 + 2), P = cp(n, n), c = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / r; if (d > 1) continue; P.put(x, y, ER.vil, 5.4 - d * 3 - (x + y + 1 - n) * 0.25); }
  const cv = P.done(); return { r: cv, wr: whiteOf(cv) };
}

/* ---------- o Caçador Vendado, 26 x 28 ----------
   as tatuagens são guardadas (EL2.tat[k]) para acender por cima do escuro */
const TAT = [];
function cacador(k) {
  const o = EL2_CC[k], P = cp(26, 28), s = 25801 + k * 7, BX = EL2_CBX, tat = TAT[k] = [];
  const hipY = 16.2 + o.low, sx = BX + o.lean, sy = 9.6 + o.low, hx = BX + 0.6 + o.lean * 1.15, hy = 5.6 + o.low;
  const tt = (x, y) => { P.put(x, y, ER.vil, 2.6); tat.push([Math.floor(x), Math.floor(y)]); };
  // o cabelo preto comprido, preso alto, caindo para trás; os rabichos da venda
  poly(P, [[hx - 2.4, hy - 2.6], [hx + 0.4, hy - 3], [hx - 1, hy + 1.4], [sx - 2, sy + 5.6], [sx - 4 - (o.air ? 1.6 : 0.6), sy + 5], [hx - 3.8, hy + 0.6]], ER.negro, (x, y) => 3.4 - (y - hy) * 0.15 + (Math.abs(Math.sin(x * 2 + y * 0.4)) < 0.35 ? -1 : 0) + cg(x, y, s) * 0.4);
  P.line(hx - 2.2, hy - 0.6, hx - 6, hy + 0.6 + (k === 4 ? -1.6 : 0), ER.vinho, 1.6); P.line(hx - 2.2, hy, hx - 5.4, hy + 2.4 + (k === 4 ? -1 : 0), ER.vinho, 1);
  // a perna e o braço de longe (com a lâmina)
  perna(P, BX - 0.6, hipY, o.b[0], o.b[1], ER.vinho, ER.negro, 1.4, s + 1, o.air);
  braco(P, sx - 0.6, sy + 0.8, o.hf[0], o.hf[1], ER.palida, ER.palida, 1.6, s + 2, ER.palida);
  lamina(P, o.hf[0], o.hf[1], o.af, true);
  // o tronco nu, magro, com as tatuagens; a calça de couro vinho com o cinto de ouro e a faixa carmesim
  poly(P, [[BX - 2.2, hipY - 1], [BX + 2.2, hipY - 1], [BX + 2.8 + o.lean * 0.3, hipY + 2], [BX - 2.6, hipY + 2]], ER.vinho, (x, y) => 3 - (x - BX) * 0.3 + cg(x, y, s) * 0.3);
  ell(P, sx - 0.1, sy + 3, 2.2, 3.6, o.lean * 0.14, ER.palida, s + 3, 3, (u, v) => [ER.palida, (Math.abs(u - 0.15) < 0.12 && v < 0.4 ? -0.9 : 0) + (v > 0.35 && v < 0.55 ? -0.6 : 0)]);
  for (const [x, y] of [[sx + 0.4, sy + 1.2], [sx + 1.2, sy + 2], [sx + 0.2, sy + 2.8], [sx + 1, sy + 3.8], [sx - 0.6, sy + 4.4], [sx + 0.4, sy + 5.4], [sx - 1.2, sy + 1.8]]) tt(x, y);
  for (let x = BX - 2.2; x <= BX + 2.2; x += 0.5) P.put(x, hipY - 1.2, ER.ouro, x > BX + 1 ? 2.6 : 3.8);
  P.line(BX + 1.4, hipY - 0.8, BX - 1.6, hipY + 2.6, ER.carmesim, 3.6);
  perna(P, BX + 0.8, hipY, o.f[0], o.f[1], ER.vinho, ER.negro, 2.6, s + 4, o.air);
  // a cabeça: o rosto, a venda escura nos olhos, os chifres curvos, a orelha
  ell(P, hx + 0.6, hy + 0.4, 1.9, 2.5, 0.15, ER.palida, s + 5, 3.1, (u, v) => (v > 0.6 && u < -0.2 ? null : [ER.palida, u > 0.6 ? -0.4 : 0]));
  P.put(hx + 2.3, hy + 0.6, ER.palida, 4.4); P.put(hx + 1.6, hy + 2, ER.palida, 1.6);
  for (let x = hx - 1.6; x <= hx + 2.6; x += 0.5) { P.put(x, hy - 0.6, ER.negro, x > hx + 1.4 ? 3 : 2); P.put(x, hy + 0.2, ER.negro, 1.2); }   // a venda
  tt(hx + 0.6, hy - 1.6); tt(hx + 1.4, hy + 1.2);
  orelha(P, hx - 0.6, hy + 0.2, ER.palida);
  for (const [ox, d] of [[-0.6, -1], [0.8, 0.6]]) { P.line(hx + ox, hy - 2.2, hx + ox - 1 + d * 0.4, hy - 4.2, ER.negro, 3.4); P.line(hx + ox - 1 + d * 0.4, hy - 4.2, hx + ox - 2.4 + d * 0.6, hy - 4.6, ER.negro, 4.4); }   // os chifres
  // o braço de perto (as tatuagens em faixas) e a outra lâmina
  braco(P, sx + 0.8, sy + 0.8, o.hn[0], o.hn[1], ER.palida, ER.palida, 3, s + 6, ER.palida);
  for (let q = 0.2; q < 0.9; q += 0.22) tt(lerp(sx + 0.8, o.hn[0], q) + 0.3, lerp(sy + 0.8, o.hn[1], q) + Math.sin(q * 6) * 0.5 + (q > 0.5 ? 0.6 : 0));
  P.put(sx + 0.6, sy + 0.6, ER.vinho, 3.6); P.put(sx - 0.4, sy + 0.4, ER.ouro, 4);   // a ombreira pequena
  lamina(P, o.hn[0], o.hn[1], o.an, false);
  return setO(P.done());
}
// a lâmina curva (um crescente de aço escuro com o fio verde), presa pelo meio na mão
function lamina(P, x0, y0, a, far) {
  for (let t = -1; t <= 1.001; t += 0.08) {
    const r = 5.2, an = a + t * 0.9, cx = x0 - Math.cos(a) * 2.6, cy = y0 - Math.sin(a) * 2.6;
    const x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r, w = (1 - Math.abs(t)) * 0.9 + 0.3;
    for (let q = 0; q <= w; q += 0.5) P.put(x - Math.cos(an) * q, y - Math.sin(an) * q, ER.aco, (far ? 1.6 : 3) - q * 0.6 + (t < -0.6 ? 0.8 : 0));
    P.put(x + Math.cos(an) * 0.4, y + Math.sin(an) * 0.4, ER.vil, far ? 2.4 : 3.6);
  }
  P.put(x0, y0, ER.ouro, far ? 2.6 : 4);
}
// as asas de sombra (abertas quando ele plana): membranas escuras com os dedos, quase sem luz
function asas(k) {
  const P = cp(30, 18), s = 25851 + k;
  for (const sd of [0, 1]) {   // a de trás um pouco mais alta e escura
    const ox = sd ? 0 : 1.4, oy = sd ? -1.4 : 0, b = sd ? 0.8 : 1.6, up = k ? 3.4 : 0;
    const root = [15 + ox, 9 + oy], tips = [[1 + ox, 3 + oy - up], [4 + ox, 11 + oy - up * 0.5], [8 + ox, 15 + oy], [12.6 + ox, 14 + oy]];
    poly(P, [root, [9 + ox, 1 + oy - up], tips[0], [3.6 + ox, 6.6 + oy - up * 0.7], tips[1], [6.4 + ox, 12 + oy - up * 0.3], tips[2], [10.6 + ox, 12.4 + oy], tips[3]], ER.negro,
      (x, y) => b + 1.2 - (y - 2) * 0.08 + cg(x, y, s) * 0.5);
    for (const t of tips) P.line(root[0], root[1], t[0], t[1], ER.vinho, b + 1.6);
    P.line(root[0], root[1], 9 + ox, 1 + oy - up, ER.vinho, b + 2);
  }
  return P.done();
}

EL2.get = () => EL2.ready || (EL2.ready = {
  hg: HW.map((_, k) => hipogrifo(k)),
  gd: EL2_GD.map((_, k) => guardiao(k)),
  ep: [0, 1, 2, 3].map(espectro).map(cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; }),
  mg: EL2_MG.map((_, k) => magister(k)), orb: [1.6, 2.4].map(orbe),
  cc: EL2_CC.map((_, k) => cacador(k)), as: [0, 1].map(asas).map(cv => ({ r: cv, l: flip(cv) }))
});
EL2.TAT = TAT;
EL2.GL = {
  lua: glow(4, '#9cc8ff'), luaG: glow(10, '#9cc8ff'), prata: glow(8, '#e6eef8'), fantasma: glow(14, '#a8d8ff'), fantasmaP: glow(5, '#d8f0ff'),
  vil: glow(4, '#7aff4a'), vilG: glow(9, '#7aff4a'), vilM: glow(14, '#7aff4a'), ouro: glow(6, '#f0c050'), ouroG: glow(14, '#f0c050'),
  carmesim: glow(6, '#d02a3a')
};
}

/* ================= desenho ================= */
function el2Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const el2Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho no mundo (bx: o corpo no desenho, by: a linha dos pés)
const el2Pt = (e, x, y, bx, by) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];
const el2Scr = (e, fx, fy, x, y, bx, by) => [fx + (x - bx) * e.facing, fy - 1 - (by - y)];

// o hipogrifo: as asas batem; no mergulho o desenho gira para a direção do voo
const el2HgPose = e => e.state === 'screech' ? 3 : e.state === 'dive' ? 4 : [0, 1, 2, 1][Math.floor(e.t * (e.state === 'climb' ? 9 : 6)) % 4];
const el2HgBob = e => e.state === 'dive' || e.state === 'screech' ? 0 : Math.round(Math.sin(e.t * 6 + 1) * 1.2);
DRAW_E.hipogrifo = (e, fx, fy, fl) => {
  const k = el2HgPose(e), S = EL2.get().hg[k], img = cvPick(S, e, fl), cy = fy - e.h / 2 + el2HgBob(e);
  if (k === 4) { const a = Math.atan2(e.vy, Math.abs(e.vx) + 1) * e.facing; cvRot(img, Math.round(fx), Math.round(cy), clamp(a, -1.2, 1.2)); return; }
  lc.drawImage(img, Math.round(fx - img.width / 2 + el2Jit(e, k === 3, 50)), Math.round(cy - img.height / 2 - 1));
};
EYES_E.hipogrifo = (e, fx, fy) => {
  if (e.state !== 'screech') return;
  const q = clamp(1 - e.stateT / EL2_GRITO, 0, 1), cy = fy - e.h / 2;
  lc.globalAlpha = 0.3 + 0.55 * q; lc.drawImage(EL2.GL.luaG, Math.round(fx + 7 * e.facing) - 10, Math.round(cy - 8) - 10);
};
WARN_E.hipogrifo = e => e.state === 'screech';

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

// o espectro: translúcido, boiando; a cor fria por cima vem do EYES_E
const el2EpBob = e => Math.round(Math.sin(e.t * 1.7 + e.seed) * 1.6);
const el2EpPose = e => e.state === 'wail' || e.state === 'after' ? 3 : Math.floor(e.t * 3 + e.seed) % 3;
DRAW_E.espectro = (e, fx, fy, fl) => {
  const S = EL2.get().ep[el2EpPose(e)], j = e.state === 'wail' ? Math.round(Math.sin(e.t * 40) * 0.8) : 0;
  lc.globalAlpha = (fl ? 0.9 : 0.62) + 0.08 * Math.sin(e.t * 2.3); el2Blit(cvPick(S, e, fl), e, fx, fy + el2EpBob(e) + 3, 13, 31, j); lc.globalAlpha = 1;
};
EYES_E.espectro = (e, fx, fy) => {
  const G = EL2.GL, cy = fy - e.h / 2 + el2EpBob(e), w = e.state === 'wail' ? clamp(1 - e.stateT / EL2_LAMENTO, 0, 1) : 0;
  lc.globalAlpha = 0.18 + w * 0.3 + 0.05 * Math.sin(e.t * 3); lc.drawImage(G.fantasma, Math.round(fx) - 14, Math.round(cy) - 14);
  const [ex, ey] = [fx + (e.state === 'wail' || e.state === 'after' ? 0.6 : 1.8) * e.facing, fy + el2EpBob(e) + 3 - 1 - (29 - (e.state === 'wail' || e.state === 'after' ? 6 : 6.4))];
  lc.globalAlpha = 0.5 + w * 0.4; lc.drawImage(G.fantasmaP, Math.round(ex) - 5, Math.round(ey) - 5);
};
WARN_E.espectro = e => e.state === 'wail';

const el2MgPose = e => e.state === 'charge' ? 3 : e.state === 'release' ? 4 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 6) % 2 : 0;
DRAW_E.magister = (e, fx, fy, fl) => {
  if (e.state === 'blink') {   // reaparecendo num estalo: tremeluz
    const a = clamp(e.stateT / 0.3, 0, 1); lc.globalAlpha = 1 - a * 0.7; el2Blit(cvPick(EL2.get().mg[0], e, false), e, fx, fy, EL2_MBX + 1, 29); lc.globalAlpha = a; el2Blit(cvPick(EL2.get().mg[0], e, true), e, fx, fy, EL2_MBX + 1, 29); lc.globalAlpha = 1; return;
  }
  el2Blit(cvPick(EL2.get().mg[el2MgPose(e)], e, fl), e, fx, fy, EL2_MBX + 1, 29, el2Jit(e, e.state === 'charge' && e.stateT < 0.3, 36));
};
// as três orbes em volta (no mundo, para ficarem atrás quando passam por trás)
const el2OrbPos = (e, i) => { const a = (e.orbA || 0) + i * Math.PI * 2 / 3, cx = e.x + e.w / 2, cy = e.y + e.h * 0.45; return [cx + Math.cos(a) * 10, cy + Math.sin(a) * 4 - (e.state === 'charge' ? 4 : 0), Math.sin(a)]; };
EYES_E.magister = (e, fx, fy) => {
  const G = EL2.GL, o = EL2_MG[el2MgPose(e)];
  const [ex, ey] = el2Scr(e, fx, fy, EL2_MBX + 0.6 + o.lean * 1.2 + 1.5, 5.2, EL2_MBX, 27);
  lc.globalAlpha = 0.45; lc.drawImage(G.vil, Math.round(ex) - 4, Math.round(ey) - 4);
  if (e.state === 'charge') { for (const h of [o.hn, o.hf]) { const [x, y] = el2Scr(e, fx, fy, h[0], h[1], EL2_MBX, 27); lc.globalAlpha = 0.3 + 0.5 * clamp(1 - e.stateT / EL2_ORBES, 0, 1); lc.drawImage(G.vilG, Math.round(x) - 9, Math.round(y) - 9); } }
};
WARN_E.magister = e => e.state === 'charge';

const el2CcPose = e => e.state === 'crouch' ? 3 : e.state === 'dash' ? 4 : e.glide ? 5 : !e.onGround ? 1 : Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 8) % 2 : 0;
DRAW_E.cacador = (e, fx, fy, fl) => {
  const B = EL2.get(), k = el2CcPose(e);
  if (k === 5) {   // as asas de sombra atrás, batendo devagar
    const W = B.as[Math.floor(e.t * 4) % 2], img = e.facing > 0 ? W.r : W.l;
    lc.globalAlpha = 0.85; lc.drawImage(img, Math.round(fx + (e.facing > 0 ? -22 : 22 - img.width)), Math.round(fy - 27)); lc.globalAlpha = 1;
  }
  el2Blit(cvPick(B.cc[k], e, fl), e, fx, fy, EL2_CBX + 1, 29, el2Jit(e, e.state === 'crouch' && e.stateT < 0.3, 46));
};
EYES_E.cacador = (e, fx, fy) => {
  const k = el2CcPose(e), o = EL2_CC[k], G = EL2.GL, hot = e.state === "crouch" ? 0.25 + 0.35 * clamp(1 - e.stateT / EL2_AGACHA, 0, 1) : e.state === "dash" ? 0.5 : 0.1;
  const [x, y] = el2Scr(e, fx, fy, EL2_CBX + o.lean, 12 + o.low, EL2_CBX, 27);
  lc.globalAlpha = hot; lc.drawImage(hot > 0.3 ? G.vilM : G.vilG, Math.round(x) - (hot > 0.3 ? 14 : 9), Math.round(y) - (hot > 0.3 ? 14 : 9));
};
WARN_E.cacador = e => e.state === 'crouch';

/* ================= comportamento ================= */
const el2Aneis = [], el2Orbes = [], el2Fogos = [], el2Estalos = [], el2Gritos = [];
const el2Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const el2Ang = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
function el2Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (el2Fx.length > 500) return;
  for (let i = 0; i < n; i++) el2P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 });
}
const EL2_LUA = ['#9cc8ff', '#c8e0ff', '#f8fbff'], EL2_PRATA = ['#e6eef8', '#b4c2d6', '#ffffff'], EL2_VIL = ['#7aff4a', '#d4ffb0', '#3ab82a'], EL2_OURO = ['#f0c050', '#fff0a0', '#d09a30'], EL2_FANT = ['#a8d8ff', '#e8f8ff', '#6c98bc'];
function el2Floor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
function el2Room(e, max = 8) { const x0 = Math.floor((e.x + 1) / T), x1 = Math.floor((e.x + e.w - 1) / T), ty = Math.floor(e.y / T); for (let k = 1; k <= max; k++) for (let x = x0; x <= x1; x++) if (solidAt(x, ty - k)) return (k - 1) * T + (e.y - ty * T); return max * T; }

/* ---------- o Hipogrifo ---------- */
// a altura de voo: uns 5 blocos acima do herói, ou logo abaixo do teto
function el2Ceu(e) {
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor(pl.y / T);
  let y = pl.y - 5 * T;
  for (let k = 1; k <= 7; k++) if (solidAt(tx, ty - k)) { y = Math.max(y, (ty - k + 1) * T + 4); break; }
  return Math.min(y, pl.y - 2 * T - e.h);
}
AI.hipogrifo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'screech') {   // encolhido no ar, o grito; mira até o último instante
    const k = Math.pow(0.03, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.1) { e.tgX = pcx; e.tgY = pcy; }
    if (e.stateT <= 0) {
      const a = Math.atan2(e.tgY - ecy, e.tgX - ecx), sp = 300;
      e.state = 'dive'; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.diveD = Math.hypot(e.tgX - ecx, e.tgY - ecy) + 3 * T; e.diveL = 0; e.swingHit = false;
      sfx.el2Mergulho(Math.max(0.4, el2Near(e, 260)));
    }
    return;
  }
  if (e.state === 'dive') {   // em linha reta; atravessa o herói e segue um pouco, para na pedra
    e.diveL += Math.hypot(e.vx, e.vy) * dt; e.facing = Math.sign(e.vx) || e.facing;
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') el2Sparks(pcx, pcy, 8, EL2_PRATA, 70); }
    if (Math.random() < dt * 30) parts.push({ x: ecx - e.vx * 0.04, y: ecy - e.vy * 0.04, vx: rnd(-10, 10), vy: rnd(-10, 10), g: 30, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#eef2f8' : '#68a2ec', size: 1 });
    if (e.hitWall || e.hitCeil || e.onGround || e.diveL > e.diveD) { e.state = 'climb'; e.stateT = 0.9; e.atkCD = 2.4 + Math.random() * 1.2; if (e.onGround || e.hitWall) burst(ecx, e.y + e.h, 6, '#a8b2c2', 50, 200, 0.4); }
    return;
  }
  if (e.state === 'climb') {   // sobe de novo batendo as asas
    const ty = el2Ceu(e) + e.h / 2, k = Math.min(1, dt * 3);
    e.vx = lerp(e.vx, (Math.sign(e.vx) || e.facing) * 60, k); e.vy = lerp(e.vy, clamp((ty - ecy) * 2.4, -120, 40), k);
    if (e.hitWall) e.vx *= -0.5;
    if (e.stateT <= 0) e.state = 'fly';
    return;
  }
  e.state = 'fly';
  let tx, ty;
  if (aggro) { e.circA = (e.circA ?? Math.random() * 6) + dt * 0.8; tx = pcx + Math.cos(e.circA) * 6 * T; ty = el2Ceu(e) + e.h / 2 + Math.sin(e.circA * 2) * 6; }
  else { tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.35 + e.seed) * 70; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.9 + e.seed) * 10; }
  const k = Math.min(1, dt * 1.6), sp = aggro ? 95 : 50;
  e.vx = lerp(e.vx, clamp((tx - ecx) * 1.3, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 1.4, -60, 60), k);
  if (e.hitWall) e.vx *= -0.5; if (e.hitCeil) e.vy = Math.abs(e.vy) * 0.5; if (e.onGround) e.vy = -60;
  e.facing = Math.abs(e.vx) > 6 ? Math.sign(e.vx) : e.facing;
  e.flapT = (e.flapT ?? Math.random()) - dt;
  if (e.flapT <= 0) { e.flapT = 0.66; const v = el2Near(e, 220); if (v > 0.05) sfx.el2Asa(v); }
  if (aggro && e.atkCD <= 0 && e.sees && dist < 12 * T && dist > 3 * T && dy > T && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'screech'; e.stateT = EL2_GRITO; e.tgX = pcx; e.tgY = pcy; e.facing = Math.sign(dx) || e.facing;
    el2Gritos.push({ e, t: 0 }); sfx.el2Grito(Math.max(0.5, el2Near(e, 300)));
  }
};

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

/* ---------- o Espectro Élfico ---------- */
AI.espectro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'wail') {   // a boca abre, a luz em volta treme
    drag(0.03); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 20) { const a = Math.random() * 6.28; el2Sparks(ecx + Math.cos(a) * 12, ecy + Math.sin(a) * 12, 1, EL2_FANT, 10, 0, 0.4); }
    if (e.stateT <= 0) {
      el2Aneis.push({ x: ecx, y: ecy - 4, r: 0, t: 0, hit: false, dmg: e.dmg });
      e.state = 'after'; e.stateT = 0.6; e.atkCD = 3.2 + Math.random() * 1.2;
      sfx.el2Lamento(Math.max(0.5, el2Near(e, 300)));
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
  if (e.moanT <= 0) { e.moanT = 4 + Math.random() * 4; const v = el2Near(e, 240); if (v > 0.05) sfx.el2Suspiro(v); }
  // só lamenta fora da pedra e vendo o herói
  if (aggro && e.atkCD <= 0 && dist < 6 * T && !solidAt(Math.floor(ecx / T), Math.floor(ecy / T)) && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'wail'; e.stateT = EL2_LAMENTO; sfx.el2Abre(Math.max(0.5, el2Near(e)));
  }
};

/* ---------- o Magíster Sangrento ---------- */
AI.magister = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.blinkCD = (e.blinkCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // as orbes giram (paradas no aviso) e crescem de volta uma a uma
  if (e.state !== 'charge') e.orbA = (e.orbA || 0) + dt * 2.4;
  if (e.orbN < 3) { e.orbGrow = (e.orbGrow || 0) + dt; if (e.orbGrow > 1.1) { e.orbGrow = 0; e.orbN++; const [x, y] = el2OrbPos(e, e.orbN - 1); el2Sparks(x, y, 4, EL2_VIL, 20); } }
  if (e.state === 'blink') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.min(e.atkCD, 0.6); } return; }
  if (aggro && e.blinkCD <= 0 && dist < 3 * T && e.state !== 'release' && el2Blink(e, dx)) return;
  if (e.state === 'charge') {   // as orbes param e acendem
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 20) { const [x, y] = el2OrbPos(e, (Math.random() * 3) | 0); el2Sparks(x, y, 1, EL2_VIL, 15, -20, 0.4); }
    if (e.stateT <= 0) {
      for (let i = 0; i < e.orbN; i++) { const [x, y] = el2OrbPos(e, i), a = Math.atan2(pcy - y, pcx - x) + (i - 1) * 0.5; el2Orbes.push({ x, y, a, t: 0, dmg: e.dmg, life: 4.5 }); }
      e.orbN = 0; e.orbGrow = 0; e.state = 'release'; e.stateT = 0.45; e.atkCD = 3.4 + Math.random();
      sfx.el2Dispara(Math.max(0.4, el2Near(e, 260)));
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
  e.hissT = (e.hissT ?? Math.random() * 4) - dt;
  if (e.hissT <= 0) { e.hissT = 3 + Math.random() * 3; const v = el2Near(e, 200); if (v > 0.05) sfx.el2Sussurro(v); }
  if (aggro && e.atkCD <= 0 && e.orbN === 3 && e.onGround && e.sees && dist < 13 * T && losClear(ecx, e.y + 6, pcx, pcy)) {
    e.state = 'charge'; e.stateT = EL2_ORBES; e.vx = 0; sfx.el2Carga(Math.max(0.4, el2Near(e, 260)));
  }
};
// a piscada: o primeiro chão livre a 5 (ou 6, 4, 7) blocos para longe do herói; um estalo dourado nos dois lugares
function el2Blink(e, dx) {
  const away = -Math.sign(dx) || -e.facing, fy = Math.floor((e.y + e.h + 1) / T);
  for (const sd of [away, -away]) for (const n of [5, 6, 4, 7]) {
    const nx = e.x + sd * n * T, col = Math.floor((nx + e.w / 2) / T);
    if (sd === -away && Math.abs(nx - pl.x) < 3 * T) continue;
    for (const k of [0, -1, 1, -2, 2, -3, 3]) {
      const row = fy + k, ny = row * T - e.h;
      if (!solidAt(col, row) || rectSolid(nx, ny, e.w, e.h) || lavaIn(nx, ny, e.w, e.h)) continue;
      if (!solidAt(Math.floor((nx + 1) / T), row) && !solidAt(Math.floor((nx + e.w - 1) / T), row)) continue;
      el2Estalos.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, t: 0 }); el2Sparks(e.x + e.w / 2, e.y + e.h / 2, 10, EL2_OURO, 70, 0, 0.4);
      e.x = nx; e.y = ny; e.vx = 0; e.vy = 0; e.state = 'blink'; e.stateT = 0.3; e.blinkCD = 3.2 + Math.random() * 1.5; e.facing = Math.sign(pl.x - nx) || e.facing;
      el2Estalos.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, t: 0 }); el2Sparks(e.x + e.w / 2, e.y + e.h / 2, 10, EL2_OURO, 70, 0, 0.4);
      sfx.el2Pisca(Math.max(0.4, el2Near(e, 260)));
      return true;
    }
  }
  e.blinkCD = 0.8; return false;
}

/* ---------- o Caçador Vendado ---------- */
AI.cacador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // cai planando nas asas de sombra
  e.glide = !e.onGround && e.vy > 30 && e.state !== 'dash';
  if (e.glide) e.vy = Math.min(e.vy, 50);
  if (e.state === 'crouch') {   // as tatuagens acendem, agachado; a linha é reta, na direção do herói
    e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 24) { const t = EL2.TAT[3]; if (t && t.length) { const p = t[(Math.random() * t.length) | 0], [x, y] = el2Pt(e, p[0], p[1], EL2_CBX, 27); el2Sparks(x, y, 1, EL2_VIL, 15, -40, 0.5); } }
    if (e.stateT <= 0) { e.state = 'dash'; e.stateT = 0.42; e.swingHit = false; e.dashX = ecx; e.lastFire = ecx; sfx.el2Avanco(Math.max(0.4, el2Near(e))); }
    return;
  }
  if (e.state === 'dash') {   // avança reto atravessando o herói; o fogo vil fica no chão por onde passou
    e.vx = e.facing * 330; e.vy = Math.min(e.vy, 0);
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 4, y: e.y, w: e.w + 8, h: e.h }, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') el2Sparks(pcx, pcy, 8, EL2_VIL, 70); }
    if (Math.abs(ecx - e.lastFire) >= 5) {
      const f = el2Floor(ecx, e.y + e.h - 2, 2);
      if (f !== null) el2Fogos.push({ x: ecx, y: f, t: 0, seed: Math.random() * 100, dmg: Math.max(1, Math.round(e.dmg * 0.35)) });
      e.lastFire = ecx;
    }
    if (Math.random() < dt * 40) el2Sparks(ecx - e.facing * 4, e.y + 10, 1, EL2_VIL, 20, 0, 0.3);
    if (e.hitWall || e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; e.vx = e.facing * 40; e.atkCD = 1.8 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.facing = Math.sign(dx) || e.facing; } return; }
  e.state = 'walk';
  let dir = 0, chase = false;
  if (aggro) { const adx = Math.abs(dx); dir = adx > 5 * T || !e.sees ? Math.sign(dx) : adx < 2.5 * T ? -Math.sign(dx) : 0; chase = dir === Math.sign(dx); }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 58 + e.lvl * 0.6 : 26, 600, 300, dy, chase);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  // anda pulando
  if (e.onGround && dir && Math.random() < dt * 1.6 && el2Room(e, 3) > T) { e.vy = -170; e.onGround = false; }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && Math.abs(dx) > 2 * T && Math.abs(dx) < 8 * T && Math.abs(dy) < 1.5 * T) {
    e.state = 'crouch'; e.stateT = EL2_AGACHA; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.el2Tatuagem(Math.max(0.4, el2Near(e)));
  }
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
  if (e.type === 'hipogrifo' && e.state === 'screech' && e.stun > 0) { e.state = 'fly'; e.atkCD = Math.max(e.atkCD, 1.2); }   // o golpe corta o grito
  if (e.type === 'magister' && e.state === 'charge' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); }
  if (e.type === 'cacador' && e.state === 'dash') e.stun = 0;   // no avanço não para
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!EL2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, el2Near(e, 260));
  if (e.type === 'hipogrifo') { for (let i = 0; i < 14; i++) parts.push({ x: cx + rnd(-6, 6), y: cy + rnd(-4, 4), vx: rnd(-50, 50), vy: rnd(-70, 10), g: 60, life: rnd(0.8, 1.6), max: 1.6, col: Math.random() < 0.6 ? '#eef2f8' : '#68a2ec', size: 1 }); sfx.el2Grito(v * 0.7, 0.7); }
  else if (e.type === 'guardiao') { el2Sparks(cx, cy - 4, 10, EL2_LUA, 50, -10, 0.8); burst(cx, cy, 10, '#8a9abc', 80, 300, 0.6); sfx.el2Bloqueio(); }
  else if (e.type === 'espectro') { el2Aneis.push({ x: cx, y: cy, r: 0, t: 0, hit: true, dmg: 0, fade: 1 }); el2Sparks(cx, cy, 16, EL2_FANT, 50, -30, 1); sfx.el2Suspiro(v, 1.4); }
  else if (e.type === 'magister') { el2Estalos.push({ x: cx, y: cy, t: 0 }); el2Sparks(cx, cy, 12, EL2_VIL, 60, -20, 0.8); el2Sparks(cx, cy, 8, EL2_OURO, 50, 0, 0.6); sfx.el2Pisca(v); }
  else if (e.type === 'cacador') { el2Sparks(cx, cy, 14, EL2_VIL, 60, -30, 0.8); sfx.el2Tatuagem(v, 0.6); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !EL2_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.8; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'hipogrifo') { e.state = 'fly'; e.circA = Math.random() * 6.28; }
  else if (type === 'espectro') e.state = 'drift';
  else if (type === 'magister') { e.state = 'walk'; e.orbN = 3; e.orbA = Math.random() * 6.28; e.blinkCD = 0.6; }
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: os anéis do lamento, as orbes, o fogo vil, os estalos ---------- */
function el2Update(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // o lamento: o anel abre até 7 blocos; quem ele alcança leva dano e fica silenciado (o escudo erguido segura)
  for (let i = el2Aneis.length - 1; i >= 0; i--) {
    const A = el2Aneis[i]; A.t += dt; A.r = EL2_ANEL_R * Math.min(1, A.t / EL2_ANEL_T);
    if (!A.hit && !pl.dead) {
      const d = Math.hypot(pcx - A.x, pcy - A.y);
      if (d <= A.r + 6 && d <= EL2_ANEL_R + 6) {
        A.hit = true;
        const r = hurtPlayer(A.dmg, A.x, null, true);
        if (r === 'hit') { elSilenciar(3); el2Sparks(pcx, pl.y - 4, 10, EL2_PRATA, 30, -20, 0.8); sfx.el2Silencio(); }
      }
    }
    if (A.t > EL2_ANEL_T + 0.4) el2Aneis.splice(i, 1);
  }
  // as orbes vis: perseguem o herói virando devagar; estouram na pedra ou nele
  for (let i = el2Orbes.length - 1; i >= 0; i--) {
    const O = el2Orbes[i]; O.t += dt; O.life -= dt;
    const want = Math.atan2(pcy - O.y, pcx - O.x); if (!pl.dead) O.a += clamp(el2Ang(want - O.a), -EL2_ORBE_VIRA * dt, EL2_ORBE_VIRA * dt);
    const sp = EL2_ORBE_SP * Math.min(1, 0.4 + O.t * 1.5);
    O.x += Math.cos(O.a) * sp * dt; O.y += Math.sin(O.a) * sp * dt;
    let gone = O.life <= 0 || solidAt(Math.floor(O.x / T), Math.floor(O.y / T));
    if (!gone && !pl.dead && O.x > pl.x - 3 && O.x < pl.x + pl.w + 3 && O.y > pl.y - 3 && O.y < pl.y + pl.h + 3) {
      const r = hurtPlayer(O.dmg, pcx - Math.cos(O.a) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) gone = true;
    }
    if (Math.random() < dt * 20) el2P({ x: O.x, y: O.y, vx: rnd(-6, 6), vy: rnd(-6, 6) - 8, g: -10, life: 0.4, max: 0.4, col: EL2_VIL[(Math.random() * 3) | 0], size: 1 });
    if (gone) { el2Sparks(O.x, O.y, 8, EL2_VIL, 50, 0, 0.4); el2Estalos.push({ x: O.x, y: O.y, t: 0.15, vil: true }); el2Orbes.splice(i, 1); const v = clamp(1 - Math.hypot(pl.x - O.x, pl.y - O.y) / 220, 0, 1); if (v > 0.05) sfx.el2OrbeEstoura(v); }
  }
  // o fogo vil no chão: queima quem pisa (a cada meio segundo)
  el2Burn -= dt;
  for (let i = el2Fogos.length - 1; i >= 0; i--) {
    const F = el2Fogos[i]; F.t += dt;
    if (F.t > EL2_FOGO_T) { el2Fogos.splice(i, 1); continue; }
    if (el2Burn <= 0 && !pl.dead && Math.abs(pcx - F.x) < pl.w / 2 + 3 && Math.abs(pl.y + pl.h - F.y) < 5) {
      el2Burn = 0.5; const r = hurtPlayer(F.dmg, pcx - pl.facing * 12, null, true);   // vem do chão: o escudo não segura
      if (r === 'hit') el2Sparks(pcx, pl.y + pl.h - 2, 6, EL2_VIL, 30, -60, 0.5);
    }
    if (Math.random() < dt * 3) el2P({ x: F.x + rnd(-2, 2), y: F.y - 3, vx: rnd(-4, 4), vy: rnd(-30, -15), g: -10, life: 0.5, max: 0.5, col: EL2_VIL[(Math.random() * 3) | 0], size: 1 });
  }
  for (let i = el2Estalos.length - 1; i >= 0; i--) { el2Estalos[i].t += dt; if (el2Estalos[i].t > 0.4) el2Estalos.splice(i, 1); }
  for (let i = el2Gritos.length - 1; i >= 0; i--) { el2Gritos[i].t += dt; if (el2Gritos[i].t > EL2_GRITO + 0.1 || el2Gritos[i].e.dead) el2Gritos.splice(i, 1); }
  for (const e of enemies) if (e.shieldHit > 0) e.shieldHit -= dt;
  // o fogo do avanço chia
  if (el2Fogos.length) { el2FogoSom -= dt; if (el2FogoSom <= 0) { el2FogoSom = 0.5; const F = el2Fogos[el2Fogos.length - 1], v = clamp(1 - Math.hypot(pl.x - F.x, pl.y - F.y) / 200, 0, 1); if (v > 0.05) sfx.el2Fogo(v); } }
}
let el2Burn = 0, el2FogoSom = 0;
HOOK.update.push(el2Update);
function clearEl2Fx() { el2Fx.length = 0; el2Aneis.length = 0; el2Orbes.length = 0; el2Fogos.length = 0; el2Estalos.length = 0; el2Gritos.length = 0; el2Burn = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearEl2Fx(); el2Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: o elmo, a lança, o espectro, as orbes e os olhos verdes, as tatuagens, o fogo vil
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !EL2_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'espectro') addL(cx, cy, e.state === 'wail' ? 0.6 : 0.4);
    else if (e.type === 'magister') addL(cx, cy, e.state === 'charge' ? 0.6 : 0.2 + 0.1 * (e.orbN || 0));
    else if (e.type === 'cacador') addL(cx, cy, e.state === 'crouch' || e.state === 'dash' ? 0.55 : 0.25);
    else if (e.type === 'guardiao') addL(cx, e.y + 6, e.state === 'wind' || e.state === 'bashW' ? 0.45 : 0.22);
    else addL(cx, cy, e.state === 'screech' ? 0.4 : 0.2);
  }
  for (const O of el2Orbes) addL(O.x, O.y, 0.5);
  for (let i = 0; i < el2Fogos.length; i += 2) addL(el2Fogos[i].x, el2Fogos[i].y - 4, 0.4 * (1 - el2Fogos[i].t / EL2_FOGO_T));
}; }

// no mundo: as orbes que giram em volta do magíster (as de trás ficam atrás dele? não: são luz; vão no drawTop)
// a luz aditiva: o anel, as orbes, o fogo, os estalos
HOOK.drawGlow.push((cx, cy) => {
  const G = EL2.GL;
  for (const A of el2Aneis) { const f = A.t < EL2_ANEL_T ? 1 : Math.max(0, 1 - (A.t - EL2_ANEL_T) / 0.4); lc.globalAlpha = 0.25 * f; lc.drawImage(G.fantasma, Math.round(A.x - cx) - 14, Math.round(A.y - cy) - 14); }
  for (const O of el2Orbes) { lc.globalAlpha = 0.6; lc.drawImage(G.vilG, Math.round(O.x - cx) - 9, Math.round(O.y - cy) - 9); }
  for (const e of enemies) {
    if (e.dead || e.type !== 'magister') continue;
    const ch = e.state === 'charge' ? clamp(1 - e.stateT / EL2_ORBES, 0, 1) : 0;
    for (let i = 0; i < (e.orbN || 0); i++) { const [x, y] = el2OrbPos(e, i); lc.globalAlpha = 0.35 + ch * 0.5; lc.drawImage(ch > 0.3 ? G.vilM : G.vilG, Math.round(x - cx) - (ch > 0.3 ? 14 : 9), Math.round(y - cy) - (ch > 0.3 ? 14 : 9)); }
  }
  for (let i = 0; i < el2Fogos.length; i += 2) { const F = el2Fogos[i], f = 1 - F.t / EL2_FOGO_T; lc.globalAlpha = 0.35 * f; lc.drawImage(G.vilG, Math.round(F.x - cx) - 9, Math.round(F.y - cy) - 12); }
  for (const s of el2Estalos) { lc.globalAlpha = 0.8 * (1 - s.t / 0.4); lc.drawImage(s.vil ? G.vilM : G.ouroG, Math.round(s.x - cx) - 14, Math.round(s.y - cy) - 14); }
  lc.globalAlpha = 1;
});
// por cima do escuro: o anel do lamento e o tremor antes dele, as orbes, o fogo vil, as tatuagens acesas, a ponta da
// lança, o grito do hipogrifo, os estalos dourados
function el2Dot(x, y, cx, cy, sz = 1) { lc.fillRect(Math.round(x - cx), Math.round(y - cy), sz, sz); }
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime, B = EL2.get();
  for (const e of enemies) {
    if (e.dead) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -60 || fx > VW + 60 || fy < -60 || fy > VH + 60) continue;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    if (e.type === 'espectro' && e.state === 'wail') {
      // a luz em volta treme: um anel de pontinhos que vibra e aperta
      const q = clamp(1 - e.stateT / EL2_LAMENTO, 0, 1), r = 16 - q * 6, n = 22;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + now * 2, w = Math.sin(now * 40 + i * 2.3) * (1 + q * 1.5);
        lc.globalAlpha = 0.35 + 0.5 * q; lc.fillStyle = i % 3 ? '#a8d8ff' : '#ffffff'; el2Dot(ecx + Math.cos(a) * (r + w), ecy - 3 + Math.sin(a) * (r + w), cx, cy);
      }
    } else if (e.type === 'magister') {
      // as orbes: o miolo claro e o anel; no aviso param, crescem e piscam
      const ch = e.state === 'charge' ? clamp(1 - e.stateT / EL2_ORBES, 0, 1) : 0;
      for (let i = 0; i < (e.orbN || 0); i++) {
        const [x, y] = el2OrbPos(e, i), img = B.orb[ch > 0.4 ? 1 : 0].r;
        lc.globalAlpha = 1; lc.drawImage(img, Math.round(x - cx - img.width / 2), Math.round(y - cy - img.height / 2));
        if (ch > 0.4 && Math.floor(now * 16) % 2) { lc.fillStyle = '#ffffff'; el2Dot(x, y, cx, cy); }
      }
      // o crescendo: a orbe que está voltando, um pontinho
      if ((e.orbN || 0) < 3) { const [x, y] = el2OrbPos(e, e.orbN || 0), q = (e.orbGrow || 0) / 1.1; lc.globalAlpha = 0.3 + 0.5 * q; lc.fillStyle = '#7aff4a'; el2Dot(x, y, cx, cy); }
      const o = EL2_MG[el2MgPose(e)], [ex, ey] = el2Scr(e, fx, fy, EL2_MBX + 0.6 + o.lean * 1.2 + 1.5, 5.2, EL2_MBX, 27);
      lc.globalAlpha = 1; lc.fillStyle = '#b8ff8a'; lc.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    } else if (e.type === 'cacador') {
      // as tatuagens: verde vil por cima do escuro, acesas no aviso e no avanço, pulsando fraco no resto
      const k = el2CcPose(e), t = EL2.TAT[k], hot = e.state === 'crouch' ? 0.5 + 0.5 * clamp(1 - e.stateT / EL2_AGACHA, 0, 1) : e.state === 'dash' ? 1 : 0.35 + 0.15 * Math.sin(now * 3 + e.seed);
      if (t) for (let j = 0; j < t.length; j++) { const [x, y] = el2Scr(e, fx, fy, t[j][0] + 0.5, t[j][1], EL2_CBX, 27); lc.globalAlpha = hot * (0.7 + 0.3 * Math.sin(now * 9 + j)); lc.fillStyle = hot > 0.7 && (j + Math.floor(now * 10)) % 3 === 0 ? '#d4ffb0' : '#7aff4a'; lc.fillRect(Math.round(x - (e.facing < 0 ? 1 : 0)), Math.round(y), 1, 1); }
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
  // o grito do hipogrifo: arcos brancos saindo do bico
  for (const g of el2Gritos) {
    const e = g.e, ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, bx = ecx + 9 * e.facing, by = ecy - 6;
    for (let j = 0; j < 3; j++) { const p = (g.t * 2.4 + j / 3) % 1, r = 2 + p * 9; lc.globalAlpha = (1 - p) * 0.85; lc.fillStyle = j ? '#c8e0ff' : '#ffffff'; for (let i = -3; i <= 3; i++) { const a = i * 0.22; el2Dot(bx + Math.cos(a) * r * e.facing, by + Math.sin(a) * r, cx, cy); } }
  }
  // o anel do lamento: três aros ondulando, prata e azul-gelo
  for (const A of el2Aneis) {
    const f = A.t < EL2_ANEL_T ? 1 : Math.max(0, 1 - (A.t - EL2_ANEL_T) / 0.4);
    for (let c = 0; c < 3; c++) {
      const r = A.r - c * 3; if (r < 2) continue;
      const n = Math.max(18, Math.round(r * 1.7));
      lc.globalAlpha = f * (A.fade ? 0.5 : 0.9 - c * 0.22); lc.fillStyle = c === 0 ? '#ffffff' : c === 1 ? '#a8d8ff' : '#6c98bc';
      for (let i = 0; i < n; i++) { const a = i / n * 6.28, w = Math.sin(a * 6 + now * 12 + c) * 1.2; el2Dot(A.x + Math.cos(a) * (r + w), A.y + Math.sin(a) * (r + w), cx, cy); }
    }
  }
  // as orbes voando: o miolo e o rastro
  for (const O of el2Orbes) {
    const img = B.orb[1].r; lc.globalAlpha = 1; lc.drawImage(img, Math.round(O.x - cx - img.width / 2), Math.round(O.y - cy - img.height / 2));
    lc.fillStyle = '#ffffff'; el2Dot(O.x, O.y, cx, cy);
    lc.fillStyle = '#3ab82a'; for (let k = 1; k <= 3; k++) { lc.globalAlpha = 0.7 - k * 0.18; el2Dot(O.x - Math.cos(O.a) * k * 2.5, O.y - Math.sin(O.a) * k * 2.5, cx, cy); }
  }
  // o fogo vil: chamas pequenas tremendo no chão, verde por fora, claro por dentro, baixando no fim
  for (const F of el2Fogos) {
    const f = 1 - F.t / EL2_FOGO_T, x0 = Math.round(F.x - cx), y0 = Math.round(F.y - cy);
    if (x0 < -8 || x0 > VW + 8 || y0 < -8 || y0 > VH + 8) continue;
    for (let j = -2; j <= 2; j++) {
      const h = Math.max(0, Math.round((2 + Math.abs(Math.sin(now * 11 + F.seed + j * 1.7)) * 3.4) * Math.min(1, f * 1.6) - Math.abs(j) * 0.8));
      for (let y = 0; y < h; y++) { lc.globalAlpha = 1; lc.fillStyle = y < 1 ? '#3ab82a' : y < h - 1 ? '#7aff4a' : '#d4ffb0'; if (j === 0 && y < h - 1 && y > 0) lc.fillStyle = '#d4ffb0'; lc.fillRect(x0 + j, y0 - 1 - y, 1, 1); }
    }
  }
  // os estalos dourados da piscada
  for (const s of el2Estalos) {
    if (s.vil) continue;
    const p = s.t / 0.4, r = 3 + p * 11, n = 18;
    lc.globalAlpha = 1 - p; lc.fillStyle = p < 0.4 ? '#fff0a0' : '#f0c050';
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; el2Dot(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 1.3, cx, cy); }
    if (p < 0.3) { lc.fillStyle = '#ffffff'; el2Dot(s.x - 1, s.y - 6, cx, cy); lc.fillRect(Math.round(s.x - cx) - 1, Math.round(s.y - cy) - 6, 2, 12); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  // o hipogrifo: as asas, o grito agudo de águia, o mergulho
  el2Asa(v = 1) { noise(0.16, 0.03 * v, 500, 'bandpass', 0, 0.8); },
  el2Grito(v = 1, p = 1) { tone(2200 * p, 0.45, 'sawtooth', 0.016 * v, -900 * p); tone(1800 * p, 0.4, 'square', 0.006 * v, -700 * p, 0.05); noise(0.4, 0.02 * v, 3200, 'bandpass', 0, 3); },
  el2Mergulho(v = 1) { noise(0.5, 0.07 * v, 1400, 'bandpass', 0, 0.6); tone(600, 0.45, 'sine', 0.015 * v, -300); },
  // o guardião: os passos de armadura, a lança acendendo, a estocada, o escudo, a investida, o bloqueio
  el2Passo(v = 1) { noise(0.06, 0.03 * v, 2400, 'bandpass', 0, 3); tone(140, 0.06, 'sine', 0.02 * v, -40); },
  el2Vira(v = 1) { noise(0.12, 0.02 * v, 3000, 'bandpass', 0, 4); },
  el2Lanca(v = 1) { tone(880, 0.55, 'sine', 0.016 * v, 660); tone(1320, 0.55, 'triangle', 0.006 * v, 900); },
  el2Estocada(v = 1) { noise(0.14, 0.07 * v, 2800, 'bandpass', 0, 1.2); tone(1500, 0.08, 'sine', 0.02 * v, -600); },
  el2Escudo(v = 1) { tone(220, 0.6, 'triangle', 0.03 * v, 120); for (let k = 0; k < 3; k++) tone(1100 + k * 330, 0.1, 'sine', 0.01 * v, 0, 0.2 + k * 0.12); },
  el2Investida(v = 1) { noise(0.4, 0.08 * v, 600, 'lowpass'); tone(110, 0.35, 'sawtooth', 0.025 * v, -40); },
  el2Bloqueio() { tone(1200, 0.18, 'sine', 0.04, -400); tone(2400, 0.12, 'triangle', 0.014, -800); noise(0.1, 0.04, 4200, 'highpass'); },
  // o espectro: o suspiro, a boca abrindo, o lamento, o herói silenciado
  el2Suspiro(v = 1, p = 1) { tone(520 * p, 1.2, 'sine', 0.016 * v, -160 * p); tone(780 * p, 1, 'sine', 0.006 * v, -220 * p, 0.1); noise(1, 0.008 * v, 1800, 'bandpass', 0, 2); },
  el2Abre(v = 1) { tone(300, 1, 'sine', 0.02 * v, 500); tone(304, 1, 'triangle', 0.008 * v, 520); noise(1, 0.012 * v, 2600, 'bandpass', 0, 3); },
  el2Lamento(v = 1) { for (let k = 0; k < 3; k++) tone(880 + k * 140, 0.9, 'sawtooth', 0.012 * v, -420 - k * 60, k * 0.03); tone(440, 0.9, 'sine', 0.03 * v, -200); noise(0.7, 0.03 * v, 3000, 'bandpass', 0, 1); },
  el2Silencio() { tone(1760, 0.5, 'sine', 0.02, -1200); tone(1320, 0.5, 'sine', 0.012, -900, 0.05); },
  // o magíster: o sussurro, a carga, o disparo, a piscada dourada, a orbe estourando
  el2Sussurro(v = 1) { noise(0.6, 0.012 * v, 3600, 'bandpass', 0, 4); tone(196, 0.6, 'sine', 0.008 * v, 20); },
  el2Carga(v = 1) { tone(160, 0.8, 'sawtooth', 0.012 * v, 300); for (let k = 0; k < 3; k++) tone(660 + k * 220, 0.25, 'sine', 0.012 * v, 200, 0.15 + k * 0.2); },
  el2Dispara(v = 1) { for (let k = 0; k < 3; k++) { tone(520 - k * 60, 0.2, 'triangle', 0.02 * v, -200, k * 0.06); noise(0.1, 0.03 * v, 1800, 'bandpass', k * 0.06, 2); } },
  el2Pisca(v = 1) { tone(400, 0.12, 'sine', 0.04 * v, 2200); noise(0.1, 0.05 * v, 6000, 'highpass'); tone(2600, 0.14, 'sine', 0.02 * v, -1800, 0.1); },
  el2OrbeEstoura(v = 1) { noise(0.14, 0.05 * v, 900, 'bandpass', 0, 1); tone(300, 0.12, 'square', 0.012 * v, -160); },
  // o caçador: as tatuagens acendendo, o avanço, o fogo vil chiando
  el2Tatuagem(v = 1, p = 1) { tone(110 * p, 0.5, 'sawtooth', 0.02 * v, 200 * p); noise(0.5, 0.03 * v, 1600, 'bandpass', 0, 2); },
  el2Avanco(v = 1) { noise(0.35, 0.09 * v, 1800, 'bandpass', 0, 0.8); tone(200, 0.3, 'sawtooth', 0.02 * v, 300); tone(90, 0.25, 'square', 0.012 * v, -30, 0.05); },
  el2Fogo(v = 1) { noise(0.45, 0.025 * v, 1200, 'bandpass', 0, 1.2); }
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
