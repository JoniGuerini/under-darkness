'use strict';

/* ================= o Ossário dos Titãs: os carniceiros =================
   Os outros cinco bichos da décima quarta camada (docs/camadas/12-ossario-titas.md, seção 6; os nascidos estão no
   283, que também guarda as peças comuns em TTB). Os carniceiros vivem do que sobrou dos titãs: pena preta, quitina,
   pelo de areia, máscara de osso.
   - o Abutre-de-Ossos (abutre), plana em círculos altos sobre o herói, sem bater asa. Grasna e o osso nas garras
     brilha (0,6 s) e larga um fêmur que cai reto. Quando o herói mata alguma coisa perto, desce para comer e fica no
     chão até ser atacado;
   - o Tapete de Besouros (descarna), um tapete de besouros pelo chão que RÓI osso esponjoso, pó e cinza para abrir
     caminho direto até o herói. O tapete se ergue numa onda (chiado subindo) e cobre o herói, mordendo aos poucos; ao
     perder metade da vida se parte em dois tapetes menores;
   - o Parasita da Medula (medula), vive dentro do tutano e do osso, andando por dentro dos blocos sem aparecer. O osso
     racha e solta pó numa linha reta (0,7 s), e um espinho atravessa o bloco por essa linha. Só sai do osso quando o
     bloco dele é quebrado; fora, é uma larva lenta;
   - o Catador de Ossos (catador), anda curvado e pega ossos do chão no caminho. Gira um fêmur acima da cabeça
     (assobio) e arremessa: o osso vai e VOLTA em arco, acertando na ida e na volta;
   - a Hiena Risonha (hiena), anda em volta do herói rindo, sem atacar enquanto ele está parado. Quando o herói golpeia,
     a risada para e as orelhas abaixam (0,4 s): ela morde no fim do golpe dele. Se o herói segura o golpe, ela vai
     embora.
   Prefixo tt2. */

Object.assign(ET, {
  abutre: { name: 'Abutre-de-Ossos', w: 16, h: 10, hp: 50, dmg: 13, xp: 22, kb: 1, fly: true, blood: '#5a1a1a' },
  descarna: { name: 'Tapete de Besouros', w: 14, h: 5, hp: 45, dmg: 9, xp: 18, kb: 0.3, fly: false, blood: '#2e3826' },
  medula: { name: 'Parasita da Medula', w: 10, h: 6, hp: 55, dmg: 19, xp: 24, kb: 0, fly: true, phase: true, blood: '#d0ae8c' },
  catador: { name: 'Catador de Ossos', w: 9, h: 20, hp: 65, dmg: 14, xp: 24, kb: 0.9, fly: false, blood: '#8a3a2a' },
  hiena: { name: 'Hiena Risonha', w: 18, h: 11, hp: 55, dmg: 15, xp: 22, kb: 0.8, fly: false, blood: '#8a3a2a' }
});
const TT2_TYPES = ['abutre', 'descarna', 'medula', 'catador', 'hiena'];
const TT2_DROPS = {
  abutre: [['tendao', 0.2], ['dente_tita', 0.12], ['pocao', 0.06]],
  descarna: [['tutano', 0.2], ['min_adamantita', 0.05], ['pocao', 0.05]],
  medula: [['tutano', 0.55, 1, 2], ['min_adamantita', 0.08], ['pocao', 0.06]],
  catador: [['tendao', 0.45, 1, 2], ['dente_tita', 0.2], ['min_adamantita', 0.08], ['pocao', 0.08], ['maca_femur', 0.012]],
  hiena: [['dente_tita', 0.25], ['tendao', 0.15], ['pocao', 0.07]]
};
function tt2Tables() { for (const k of TT2_TYPES) DROPS[k] = TT2_DROPS[k].filter(([id]) => ITEMS[id]); }
tt2Tables();
Object.assign(NAV_WALKERS, { catador: 1, hiena: 1 });
Object.assign(CV_STEP, { catador: 1, hiena: 1, descarna: 1 });

const TT2_GRASNA = 0.6, TT2_ONDA = 0.5, TT2_RACHA = 0.7, TT2_GIRA = 0.6, TT2_ORELHA = 0.4;
const TT2_BUM_MAX = 8 * T, TT2_BUM_SP = 210;
// o que os besouros roem e onde o parasita mora
const TT2_ROI = t => t === TT_ESPONJA || t === TT_PO || t === TT_CINZA || t === TT_TUTANO;
const TT2_MORA = t => t === TT_OSSO || t === TT_ESPONJA || t === TT_TUTANO;

/* ================= arte ================= */
const TT2 = {};
{
const { TR, setO, ell, tubo, poly, perna, braco, cp, cg } = TTB;

/* ---------- o Abutre-de-Ossos, 34 x 18 (planando) ---------- */
function abutre(k) {   // 0 planando, 1 as asas um pouco acima, 2 com o fêmur nas garras, 3 no chão comendo
  const P = cp(34, 18), s = 28501 + k * 3;
  if (k === 3) {   // em pé no chão, as asas meio abertas por cima da comida, a cabeça baixa
    poly(P, [[9, 6], [22, 5], [26, 12], [6, 13]], TR.pena, (x, y) => 2.2 + (x % 3 === 0 ? -0.6 : 0) + cg(x, y, s) * 0.4 + (y > 11 ? -0.6 : 0));
    ell(P, 16, 10, 5.4, 3.6, 0.2, TR.pena, s + 1, 2.6);
    for (let x = 12; x <= 17; x++) P.put(x, 7.4, TR.osso, 4);   // o colar de penas claras
    tubo(P, 20, 9, 24, 14, 0.9, 0.7, TR.pele, 3.4, s + 2);       // o pescoço pelado
    ell(P, 25, 14.4, 1.8, 1.5, 0, TR.pele, s + 3, 3.4); P.line(26.4, 14.6, 28, 15.6, TR.osso, 4.4);
    perna(P, 15, 12, 14, 17, TR.pele, 2.6, s + 4, 0.6, 0.4); perna(P, 18, 12, 19, 17, TR.pele, 3.2, s + 5, 0.6, 0.4);
    return setO(P.done());
  }
  const up = k === 1 ? -2 : 0;
  // as duas asas abertas, as penas de ponta separadas como dedos
  for (const side of [-1, 1]) {
    const tip = 17 + side * 16;
    poly(P, [[17, 7], [tip, 4 + up], [tip - side * 2, 8 + up * 0.5], [17 + side * 6, 10]], TR.pena, (x, y) => (side < 0 ? 1.8 : 2.6) + (Math.abs(x - 17) % 3 < 1 ? -0.6 : 0) + cg(x, y, s) * 0.4 + (y < 6 ? 0.8 : 0));
    for (let f = 0; f < 4; f++) P.line(tip - side * f * 1.6, 5 + up + f * 0.6, tip + side * 1.4 - side * f * 1.6, 8 + up + f * 0.8, TR.pena, 1.6);
  }
  ell(P, 17, 8.4, 5, 2.6, 0, TR.pena, s + 6, 2.4);
  for (let x = 20; x <= 22; x++) P.put(x, 7, TR.osso, 4);
  tubo(P, 21, 7.6, 25, 7.2, 0.9, 0.8, TR.pele, 3.4, s + 7); ell(P, 26, 7.2, 1.7, 1.4, 0, TR.pele, s + 8, 3.4); P.line(27.4, 7.4, 29, 8.4, TR.osso, 4.4);
  P.put(11, 9.6, TR.pena, 1); P.put(10, 9.6, TR.pena, 2);   // o rabo
  if (k === 2) { tubo(P, 13, 11.6, 21, 11.6, 0.8, 0.8, TR.osso, 3.4, s + 9); ell(P, 12.6, 11.6, 1.4, 1.2, 0, TR.osso, s + 10, 4); ell(P, 21.4, 11.6, 1.4, 1.2, 0, TR.osso, s + 11, 4); }
  P.line(16, 10, 15.4, 11.6, TR.pele, 2.4); P.line(18, 10, 18.4, 11.6, TR.pele, 2.4);
  return setO(P.done());
}
// o fêmur que o abutre larga e o que o catador arremessa: 14 x 6 girando (4 quadros de 45 graus no desenho)
function femur(k) {
  const P = cp(16, 16), a = k * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a), s = 28521;
  tubo(P, 8 - c * 5, 8 - sn * 5, 8 + c * 5, 8 + sn * 5, 0.9, 0.9, TR.osso, 3.4, s);
  for (const d of [-1, 1]) { ell(P, 8 + c * 6 * d - sn * 0.8, 8 + sn * 6 * d + c * 0.8, 1.3, 1.3, 0, TR.osso, s + 1, 3.8); ell(P, 8 + c * 6 * d + sn * 0.8, 8 + sn * 6 * d - c * 0.8, 1.2, 1.2, 0, TR.osso, s + 2, 3.2); }
  return setO(P.done());
}

/* ---------- o Tapete de Besouros, 20 x 8 (0-2 andando), a onda 20 x 16 (3) ---------- */
function besouros(k) {
  const W = 20, H = k === 3 ? 16 : 8, P = cp(W, H), s = 28531 + k * 11, n = k === 3 ? 30 : 20;
  for (let i = 0; i < n; i++) {
    const u = hash2(i, 1, s), x = 2 + u * (W - 4), top = k === 3 ? H - 2 - Math.sin(u * Math.PI) * (H - 4) : H - 3, y = top + hash2(i, 2, s) * (H - 1 - top), a = (hash2(i, 3, s) - 0.5) * 1.4 + (k === 3 ? -0.8 : 0);
    ell(P, x, y, 1.8, 1.2, a, TR.besouro, s + i, 2.6 + hash2(i, 4, s), (uu, vv) => [TR.besouro, vv < -0.2 ? 1.2 : 0]);
    P.put(x + Math.cos(a) * 2, y + Math.sin(a) * 2, TR.besouro, 0.6);   // a cabeça
    if (hash2(i, 5, s) < 0.5) P.put(x - 0.6, y - 0.6, TR.besouro, 5);   // o brilho da casca
  }
  return setO(P.done());
}

/* ---------- o Parasita da Medula fora do osso: a larva branca, 16 x 8, dois quadros ---------- */
function larva(k) {
  const P = cp(16, 8), s = 28541 + k;
  for (let i = 0; i < 6; i++) { const x = 3 + i * 2 + (k && i % 2 ? 0.5 : 0), h = 2.6 - Math.abs(i - 2.5) * 0.25 + (k && i === 3 ? 0.6 : 0); ell(P, x, 5.6 - (k && i > 2 && i < 5 ? 0.8 : 0), 1.4, h, 0, TR.larva, s + i, 3.2, (u, v) => [TR.larva, u > 0.6 ? -1 : 0]); }
  ell(P, 14, 5, 1.6, 1.8, 0, TR.sangue, s + 9, 2.6); P.put(15, 4, TR.osso, 5); P.put(15, 6, TR.osso, 5);   // as presas
  return setO(P.done());
}

/* ---------- o Catador de Ossos, 26 x 26: o corpo no x 11, os pés na linha 25 ---------- */
const CA_BX = 11, CA_FY = 25;
const CA = [
  { low: 1, b: [9, 25], f: [13.4, 25], hn: [16, 15], fe: 0.3 },               // 0 parado, o fêmur na mão
  { low: 1.4, b: [7.6, 25], f: [15, 25], hn: [16.4, 14.6], fe: 0.5 },        // 1-2 andando
  { low: 1, b: [12.6, 25], f: [9.6, 24.6], hn: [15.4, 15.6], fe: 0.2 },
  { low: 0.4, b: [8.4, 25], f: [14.4, 25], hn: [12, 2], fe: null, spin: 1 },  // 3 girando acima da cabeça (o aviso)
  { low: 1.4, b: [7.6, 25], f: [15.6, 25], hn: [19.6, 12], fe: null },        // 4 soltou
  { low: 5, b: [9, 25], f: [15, 25], hn: [19, 24], fe: null }                 // 5 abaixado pegando um osso
];
function catador(k) {
  const o = CA[k], P = cp(26, 26), s = 28551 + k * 5, lo = o.low, sx = CA_BX + 1.4 + lo * 0.4, sy = 9 + lo, hx = CA_BX + 3.4 + lo * 0.6, hy = 6.4 + lo * 1.1;
  perna(P, CA_BX - 0.6, 16.4 + lo * 0.3, o.b[0], o.b[1], TR.pano, 1.7, s, 1.1, 1.4);
  // a capa de pele com ossinhos amarrados, corcunda
  poly(P, [[sx - 5, sy - 2.4], [sx + 1, sy - 3], [sx + 3, sy + 2], [CA_BX + 3, 19 + lo * 0.2], [CA_BX - 5, 20], [CA_BX - 6.4, sy + 3]], TR.pano,
    (x, y) => 2.4 + (y < sy - 1 ? 0.8 : 0) - (y - sy) * 0.04 + (Math.abs(Math.sin(x * 1.3 + y * 0.4)) < 0.22 ? -0.9 : 0) + cg(x, y, s) * 0.4 - (y > 18 && hash2(x, y, s) < 0.4 ? 0.8 : 0));
  for (const [x, y] of [[CA_BX - 4, 14], [CA_BX - 2, 17], [CA_BX - 5, 18]]) { P.put(x, y, TR.osso, 4.4); P.put(x, y + 1, TR.osso, 3); }
  perna(P, CA_BX + 1, 16.6 + lo * 0.3, o.f[0], o.f[1], TR.pano, 2.8, s + 1, 1.2, 1.5);
  // a cabeça: a máscara de crânio de bicho, os olhos fundos, o cabelo preto de baixo
  ell(P, hx - 1, hy + 0.6, 2.8, 2.8, 0, TR.cabelo, s + 2, 2.6);
  ell(P, hx + 0.6, hy, 2.6, 2.8, 0.15, TR.osso, s + 3, 3.4, (u, v) => [TR.osso, (u > 0.1 && u < 0.6 && v > -0.5 && v < 0.1) ? -3 : 0]);
  P.put(hx + 2.4, hy + 1.6, TR.osso, 4.6); P.put(hx + 2.6, hy + 2.4, TR.osso, 3.6);   // o focinho da máscara
  P.line(hx - 1, hy - 2.6, hx - 3.4, hy - 4.6, TR.osso, 4);                          // um chifre partido
  // o braço e o fêmur (na mão, ou girando acima: só o braço erguido; o osso girando vem no desenho)
  braco(P, sx + 0.6, sy, o.hn[0], o.hn[1], TR.pele, 3, s + 4, 1, 1);
  if (o.fe !== null) { const a = o.fe, c = Math.cos(a), sn = Math.sin(a); tubo(P, o.hn[0] - c * 4, o.hn[1] + sn * 4, o.hn[0] + c * 4, o.hn[1] - sn * 4 - 4, 0.8, 0.8, TR.osso, 3.6, s + 5); ell(P, o.hn[0] + c * 4.4, o.hn[1] - sn * 4.4 - 4.4, 1.4, 1.4, 0, TR.osso, s + 6, 4); }
  return setO(P.done());
}

/* ---------- a Hiena Risonha, 28 x 18: o corpo no x 13, os pés na linha 17 ---------- */
const HI_BX = 13, HI_FY = 17;
function hiena(k) {   // 0 parada, 1-2 trotando, 3 orelhas baixas agachada, 4 o bote
  const P = cp(28, 18), s = 28571 + k * 5, low = k === 3 ? 2.4 : k === 4 ? -1 : 0, st = k === 1 ? 1 : k === 2 ? -1 : 0, lunge = k === 4 ? 3 : 0;
  // o corpo: os ombros altos, a garupa baixa (a hiena tem o lombo caído), as pintas escuras
  const shX = HI_BX + 5 + lunge, shY = 6.4 + low, hipX = HI_BX - 5 + lunge * 0.4, hipY = 9 + low * 0.8;
  for (const [fx0, fy0, fx1, sw, b] of [[hipX - 1, hipY + 1, hipX - 2 - st * 2 - lunge * 0.6, 1, 1.7], [shX - 1, shY + 3, shX + st * 2 + lunge, 1, 1.7]]) tubo(P, fx0, fy0, fx1, HI_FY - 0.6, 1.1, 0.8, TR.hiena, b, s + fx0);
  tubo(P, hipX, hipY, shX, shY, 3.6, 4.4, TR.hiena, 2.6, s + 2);
  for (let i = 0; i < 9; i++) { const t = hash2(i, 1, s), x = hipX + (shX - hipX) * t, y = hipY + (shY - hipY) * t + (hash2(i, 2, s) - 0.5) * 4; P.put(x, y, TR.hiena, 0.8); }
  for (let x = shX - 4; x <= shX + 1; x += 0.5) P.put(x, shY - 4.2 + (x - shX) * 0.2, TR.cabelo, 2.4);   // a crina eriçada
  tubo(P, hipX - 3.2, hipY - 1, hipX - 5.4, hipY + 3, 0.7, 0.9, TR.cabelo, 2.4, s + 3);                 // o rabo curto de pincel
  for (const [fx0, fy0, fx1, sw, b] of [[hipX + 1, hipY + 1.4, hipX + 1 + st * 2 + lunge * 0.4, 1, 2.8], [shX + 1, shY + 3.4, shX + 2 - st * 2 + lunge * 1.4, 1, 2.8]]) tubo(P, fx0, fy0, fx1, HI_FY - 0.6, 1.2, 0.85, TR.hiena, b, s + fx0 + 1);
  // a cabeça grande, baixa e para a frente, o focinho escuro, as orelhas redondas (baixas na pose 3)
  const hx = shX + 4.4 + lunge * 0.6, hy = shY + 0.6 + (k === 3 ? 1.6 : 0);
  ell(P, hx, hy, 3.2, 2.6, 0.1, TR.hiena, s + 4, 3);
  ell(P, hx + 3, hy + 0.8, 1.8, 1.4, 0, TR.cabelo, s + 5, 2);
  if (k === 4) { for (let x = hx + 1; x <= hx + 4.6; x += 0.5) P.put(x, hy + 2.2, TR.sangue, 2); P.put(hx + 2.6, hy + 1.6, TR.osso, 5); P.put(hx + 3.6, hy + 2.8, TR.osso, 5); }
  if (k === 3) { P.line(hx - 1.6, hy - 1.4, hx - 4, hy - 0.6, TR.hiena, 3.4); P.line(hx - 0.6, hy - 1.8, hx - 3.4, hy - 1.6, TR.hiena, 2.6); }
  else { ell(P, hx - 1.4, hy - 3, 1.2, 1.4, 0, TR.hiena, s + 6, 3.2); ell(P, hx - 0.2, hy - 3.2, 1.1, 1.3, 0, TR.hiena, s + 7, 2.4); P.put(hx - 1.4, hy - 3, TR.cabelo, 1); }
  P.put(hx + 0.8, hy - 0.6, TR.cabelo, 0);   // o olho
  return setO(P.done());
}

TT2.CA = CA;
TT2.get = () => TT2.ready || (TT2.ready = {
  ab: [0, 1, 2, 3].map(abutre), fe: [0, 1, 2, 3].map(femur),
  be: [0, 1, 2, 3].map(besouros), lv: [0, 1].map(larva),
  ca: CA.map((_, k) => catador(k)), hi: [0, 1, 2, 3, 4].map(hiena)
});
Object.assign(TT2, { CA_BX, CA_FY, HI_BX, HI_FY });
}

/* ================= desenho ================= */
DRAW_E.abutre = (e, fx, fy, fl) => {
  const k = e.state === 'eat' || e.state === 'land' ? 3 : e.bone ? 2 : Math.sin(e.t * 1.3 + e.seed) > 0.6 ? 1 : 0;
  const S = TT2.get().ab[k], img = cvPick(S, e, fl); lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + (k === 3 ? 1 : 4));
};
EYES_E.abutre = (e, fx, fy) => {   // o osso nas garras brilhando antes de cair
  if (e.state !== 'aim') return; const q = clamp(1 - e.stateT / TT2_GRASNA, 0, 1);
  lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(ttGl('osso', 7, '#f4eedc'), Math.round(fx) - 7, Math.round(fy - 2) - 7);
};
WARN_E.abutre = e => e.state === 'aim';

DRAW_E.descarna = (e, fx, fy, fl) => {
  if (e.state === 'cover') return;   // em cima do herói: o drawTop desenha por cima dele
  const B = TT2.get().be, k = e.state === 'wave' ? 3 : Math.floor(e.t * 10) % 3, img = cvPick(B[k], e, fl), sc = e.small ? 0.65 : 1;
  const w = Math.round(img.width * sc), h = Math.round(img.height * sc); lc.drawImage(img, Math.round(fx - w / 2), fy - h + 1, w, h);
};
WARN_E.descarna = e => e.state === 'wave';

DRAW_E.medula = (e, fx, fy, fl) => {
  if (e.state !== 'out') return;   // dentro do osso: só as rachaduras (drawWorld)
  const img = cvPick(TT2.get().lv[Math.floor(e.t * 4) % 2], e, fl); lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 1);
};
WARN_E.medula = e => e.state === 'crack' && !e.ttHidden;

const tt2CaPose = e => e.state === 'spin' ? 3 : e.state === 'throw' || e.state === 'wait' ? 4 : e.state === 'pick' ? 5 : Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 8) % 2 : 0;
DRAW_E.catador = (e, fx, fy, fl) => {
  const k = tt2CaPose(e); ttBlit(cvPick(TT2.get().ca[k], e, fl), e, fx, fy, TT2.CA_BX + 1, TT2.CA_FY + 1);
  if (k === 3) { const fe = TT2.get().fe[Math.floor(e.t * 18) % 4].r, x = fx + (12 - TT2.CA_BX) * e.facing, y = fy - 1 - (TT2.CA_FY - 1); lc.drawImage(fe, Math.round(x - fe.width / 2), Math.round(y - fe.height / 2)); }
};
WARN_E.catador = e => e.state === 'spin';

const tt2HiPose = e => e.state === 'duck' ? 3 : e.state === 'bite' ? 4 : Math.abs(e.vx) > 6 && e.onGround ? 1 + Math.floor(e.t * 9) % 2 : 0;
DRAW_E.hiena = (e, fx, fy, fl) => ttBlit(cvPick(TT2.get().hi[tt2HiPose(e)], e, fl), e, fx, fy + (e.state === 'laugh' ? Math.round(Math.abs(Math.sin(e.t * 14))) : 0), TT2.HI_BX + 1, TT2.HI_FY + 1, ttJit(e, e.state === 'duck', 50));
WARN_E.hiena = e => e.state === 'duck';

/* ================= comportamento ================= */
const tt2Ossos = [], tt2Bums = [], tt2Espinhos = [];

/* ---------- o Abutre-de-Ossos ---------- */
AI.abutre = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'land' || e.state === 'eat') {   // desce até a carniça e fica comendo
    const tx = e.food.x, ty = e.food.y;
    if (e.state === 'land') {
      const ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h);
      e.vx = approach(e.vx, clamp(ax * 3, -80, 80), 300 * dt); e.vy = approach(e.vy, clamp(ay * 3, -60, 90), 300 * dt);
      if ((Math.abs(ax) < 6 && Math.abs(ay) < 6) || e.onGround) { e.state = 'eat'; e.stateT = 20; e.vx = 0; }
      if (e.stateT <= 0) e.state = 'glide';
    } else { e.vx = 0; e.vy = 60; if (Math.random() < dt * 2) sfx.ttBica(Math.max(0.2, ttNear(e) * 0.6)); if (e.stateT <= 0) e.state = 'glide'; }
    return;
  }
  if (e.state === 'aim') {   // grasna, o osso brilha
    e.vx *= Math.pow(0.3, dt); e.vy = approach(e.vy, 0, 200 * dt);
    if (e.stateT <= 0) { tt2Larga(e); e.state = 'glide'; e.reload = 2.6 + Math.random(); }
    return;
  }
  e.state = 'glide';
  e.reload = (e.reload || 0) - dt; if (e.reload <= 0 && !e.bone) e.bone = true;
  // os círculos altos: 6 blocos acima do herói (ou de casa), raio 5 blocos, sem bater asa
  const ox = aggro ? pcx : e.homeX, oy = (aggro ? pcy : e.homeY) - 6 * T;
  e.ang = (e.ang || Math.random() * 6) + dt * 0.7;
  let tx = ox + Math.cos(e.ang) * 5 * T, ty = oy + Math.sin(e.ang * 2) * 1.2 * T;
  // sem teto alto, voa mais baixo (fica no ar livre de cima)
  const room = (() => { const x = Math.floor((e.x + e.w / 2) / T); let y = Math.floor(e.y / T); for (let k = 0; k < 8; k++) if (solidAt(x, y - k)) return k; return 8; })();
  if (room < 2) ty += T;
  const ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h / 2);
  e.vx = approach(e.vx, clamp(ax * 1.6, -90, 90), 120 * dt); e.vy = approach(e.vy, clamp(ay * 1.6, -70, 70), 120 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  if (!aggro || e.atkCD > 0 || pl.dead || !e.bone) return;
  if (Math.abs(dx) < 14 && dy > 2 * T && dy < 12 * T && losClear(e.x + e.w / 2, e.y + e.h, pcx, pcy)) { e.state = 'aim'; e.stateT = TT2_GRASNA; sfx.ttGrasna(Math.max(0.4, ttNear(e, 300))); }
};
function tt2Larga(e) {
  e.bone = false; e.atkCD = 1.4;
  tt2Ossos.push({ x: e.x + e.w / 2, y: e.y + e.h + 2, vy: 30, a: 0, dmg: e.dmg, t: 0 });
}

/* ---------- o Tapete de Besouros ---------- */
AI.descarna = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'wave') { e.vx = approach(e.vx, 0, 400 * dt); if (Math.random() < dt * 10) sfx.ttChia(Math.max(0.3, ttNear(e)), 1 + (1 - e.stateT / TT2_ONDA)); if (e.stateT <= 0) tt2Cobre(e); return; }
  if (e.state === 'cover') {   // em cima do herói: morde aos poucos e cai fora no fim
    if (pl.dead) { e.state = 'walk'; return; }
    e.x = pl.x + pl.w / 2 - e.w / 2; e.y = pl.y + pl.h - e.h - 4; e.vx = 0; e.vy = 0;
    e.biteT -= dt; if (e.biteT <= 0) { e.biteT = 0.35; pl.invuln = 0; hurtPlayer(Math.max(1, Math.round(e.dmg * 0.4)), pl.x + pl.w / 2 + 1, null, true); sfx.ttMorde(0.5); }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6; e.vx = -e.facing * 60; }
    return;
  }
  if (e.state === 'chew') {   // roendo o bloco da frente
    e.vx = 0; if (Math.random() < dt * 12) { ttDust(e.chewX * T + T / 2, e.chewY * T + T / 2, 1, 20, -20); sfx.ttRoi(0.35 * ttNear(e)); }
    if (e.stateT <= 0) { if (TT2_ROI(tileAt(e.chewX, e.chewY)) && !ttKeep.has(e.chewY * WW + wrapX(e.chewX)) && !inTtHall(e.chewX, e.chewY, 2)) setTile(e.chewX, e.chewY, AIR); e.state = 'walk'; }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 6 ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 46 : 16, 500, 200, dy, aggro);
  if (dir) e.facing = dir;
  // parede de osso mole na frente: rói (direto até o herói, não contorna)
  if (aggro && dir && e.onGround && e.hitWall) {
    const tx = Math.floor((dir > 0 ? e.x + e.w + 2 : e.x - 2) / T), ty = Math.floor((e.y + e.h - 2) / T);
    for (const yy of [ty, ty - 1]) if (TT2_ROI(tileAt(tx, yy))) { e.state = 'chew'; e.stateT = 0.6; e.chewX = tx; e.chewY = yy; break; }
  }
  if (!aggro || e.atkCD > 0 || pl.dead) return;
  if (Math.abs(dx) < 18 && Math.abs(dy) < 14) { e.state = 'wave'; e.stateT = TT2_ONDA; e.vx = 0; }
};
function tt2Cobre(e) {
  const pcx = pl.x + pl.w / 2;
  if (!pl.dead && Math.abs(pcx - (e.x + e.w / 2)) < 20 && Math.abs(pl.y + pl.h - (e.y + e.h)) < 16 && pl.invuln <= 0) {
    const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false);
    if (r === 'hit') { e.state = 'cover'; e.stateT = 1.8; e.biteT = 0.35; sfx.ttMorde(0.8); return; }
  }
  e.state = 'walk'; e.atkCD = 1.2; ttDust(e.x + e.w / 2, e.y + e.h, 6, 40);
}

/* ---------- o Parasita da Medula ---------- */
// procura um bloco de osso por perto (até r blocos) para morar
function tt2Casa(tx, ty, r) {
  let best = null, bd = 1e9;
  for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
    if (!TT2_MORA(tileAt(x, y)) || inTtHall(x, y, 2)) continue;
    // precisa de ar do lado (para o espinho sair)
    if (solidAt(x - 1, y) && solidAt(x + 1, y) && solidAt(x, y - 1) && solidAt(x, y + 1)) continue;
    const d = (x - tx) ** 2 + (y - ty) ** 2; if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
const tt2Pos = (e, x, y) => { e.cx = x; e.cy = y; e.x = x * T + T / 2 - e.w / 2; e.y = y * T + T / 2 - e.h / 2; };
AI.medula = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = 0; e.vy = 0;
  if (e.state === 'out') {   // a larva: cai no chão e rasteja devagar até o herói; morde no contato
    e.ttHidden = false;
    const f = ttFloor(e.x + e.w / 2, e.y + e.h - 2, 12);
    if (f !== null) { if (e.y + e.h < f - 1) e.y = Math.min(f - e.h, e.y + 160 * dt); else e.y = f - e.h; }
    if (aggro) { const d = Math.sign(dx), nx = e.x + d * 12 * dt, tx = Math.floor((nx + e.w / 2 + d * 5) / T), ty = Math.floor((e.y + e.h - 2) / T); if (!solidAt(tx, ty)) { e.x = nx; e.facing = d || e.facing; } }
    if (e.atkCD <= 0 && overlap(e, pl)) { e.atkCD = 1; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    return;
  }
  // dentro do osso: se quebraram o bloco, sai
  if (!TT2_MORA(tileAt(e.cx, e.cy))) { e.state = 'out'; e.ttHidden = false; ttDust(e.x + e.w / 2, e.y + e.h / 2, 10, 50); sfx.ttRoi(0.8); return; }
  e.ttHidden = true;
  if (e.state === 'crack') {   // o osso racha: pó saindo numa linha reta
    if (Math.random() < dt * 30) { const t = Math.random() * e.L; ttDust(e.sx + e.ux * t, e.sy + e.uy * t, 1, 10, -10); }
    if (e.stateT <= 0) { tt2Espinhos.push({ x: e.sx, y: e.sy, ux: e.ux, uy: e.uy, L: e.L, t: 0, hit: false, dmg: e.dmg }); sfx.ttEspinho(Math.max(0.4, ttNear(e))); e.state = 'in'; e.atkCD = 2 + Math.random(); }
    return;
  }
  e.state = 'in';
  // anda por dentro: de bloco de osso em bloco de osso, devagar, para perto do herói
  e.stepT = (e.stepT || 0) - dt;
  if (aggro && e.stepT <= 0) {
    e.stepT = 0.7; const sx = Math.sign(dx), sy = Math.sign(dy);
    for (const [ox, oy] of [[sx, 0], [0, sy], [sx, sy]]) { if (!ox && !oy) continue; const nx = e.cx + ox, ny = e.cy + oy; if (TT2_MORA(tileAt(nx, ny)) && !inTtHall(nx, ny, 2)) { tt2Pos(e, nx, ny); if (Math.random() < 0.5) sfx.ttRoi(0.2 * ttNear(e)); break; } }
  }
  if (!aggro || e.atkCD > 0 || pl.dead || dist > 6 * T) return;
  // a linha: das 8 direções, a mais perto do herói; sai pela face do bloco e precisa de ar até ele
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, a = Math.round(Math.atan2(pcy - (e.cy * T + T / 2), pcx - (e.cx * T + T / 2)) / (Math.PI / 4)) * (Math.PI / 4);
  const ux = Math.round(Math.cos(a) * 1000) / 1000, uy = Math.round(Math.sin(a) * 1000) / 1000;
  const sx = e.cx * T + T / 2 + ux * T * 0.6, sy = e.cy * T + T / 2 + uy * T * 0.6;
  // o herói tem de estar perto da linha
  const px = pcx - sx, py = pcy - sy, along = px * ux + py * uy, off = Math.abs(px * uy - py * ux);
  if (along < 4 || along > 5 * T || off > 10) return;
  let L = 0; for (; L < along + 10; L += 3) if (solidAt(Math.floor((sx + ux * (L + 3)) / T), Math.floor((sy + uy * (L + 3)) / T))) break;
  if (L < along - 6) return;
  Object.assign(e, { state: 'crack', stateT: TT2_RACHA, sx, sy, ux, uy, L: Math.min(L, 5 * T) });
  sfx.ttRacha(Math.max(0.5, ttNear(e)));
};

/* ---------- o Catador de Ossos ---------- */
AI.catador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'spin') {   // gira o fêmur acima da cabeça (assobio)
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    e.whT = (e.whT || 0) - dt; if (e.whT <= 0) { e.whT = 0.14; sfx.ttAssobio(Math.max(0.3, ttNear(e))); }
    if (e.stateT <= 0) { tt2Arremessa(e); e.state = 'throw'; e.stateT = 0.3; }
    return;
  }
  if (e.state === 'throw') { if (e.stateT <= 0) e.state = 'wait'; return; }
  if (e.state === 'wait') {   // de mão vazia esperando o osso voltar; recua se o herói vem
    e.facing = Math.sign(dx) || e.facing;
    walk(e, dt, aggro && dist < 3 * T ? -Math.sign(dx) : 0, 30, 400, 250, dy, false);
    if (!e.bum) { e.state = 'walk'; e.atkCD = 1.4 + Math.random(); }
    return;
  }
  if (e.state === 'pick') { e.vx = 0; if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const want = 6 * T; dir = dist < want - 2 * T ? -Math.sign(dx) : dist > want + T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; if (dir && e.onGround && Math.random() < dt * 0.25) { e.state = 'pick'; e.stateT = 0.8; return; } }
  walk(e, dt, dir, aggro ? 50 : 20, 600, 270, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (dist > 3 * T && dist < 8 * T && Math.abs(dy) < 3 * T && e.sees) { e.state = 'spin'; e.stateT = TT2_GIRA; e.vx = 0; }
};
function tt2Arremessa(e) {
  const [x, y] = ttPt(e, 14, 6, TT2.CA_BX, TT2.CA_FY), d = Math.min(TT2_BUM_MAX, Math.abs(pl.x + pl.w / 2 - x) + 2 * T);
  const B = { x, y, x0: x, y0: y, dir: e.facing, D: d, t: 0, T: d / TT2_BUM_SP * 2.2, owner: e, a: 0, hitOut: false, hitBack: false, dmg: e.dmg };
  tt2Bums.push(B); e.bum = B; sfx.ttArremessa(Math.max(0.4, ttNear(e)));
}

/* ---------- a Hiena Risonha ---------- */
AI.hiena = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2;
  if (e.state === 'duck') {   // a risada para, as orelhas abaixam: espera o fim do golpe
    e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0 && pl.atkT < 0) { e.state = 'bite'; e.stateT = 0.3; e.hitThis = false; e.vx = e.facing * 200; e.vy = -90; sfx.ttRosna(Math.max(0.5, ttNear(e))); }
    else if (e.stateT < -0.8) e.state = 'circle';
    return;
  }
  if (e.state === 'bite') {
    const ecx = e.x + e.w / 2, hb = { x: e.facing > 0 ? ecx : ecx - 16, y: e.y - 2, w: 16, h: e.h + 4 };
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.stateT <= 0) { e.state = 'circle'; e.vx = -e.facing * 120; e.atkCD = 0.8; e.patT = 0; }
    return;
  }
  if (e.state === 'leave') { walk(e, dt, e.leaveDir, 60, 500, 260, dy, false); e.facing = e.leaveDir; if (e.stateT <= 0) { e.state = 'circle'; e.patT = 0; } return; }
  if (!aggro) { e.state = 'walk'; cvWander(e, dt); walk(e, dt, e.wander, 22, 500, 260, dy, false); if (e.wander) e.facing = e.wander; return; }
  // em volta do herói, rindo, a uns 2 a 3 blocos; vai e volta de um lado para o outro
  e.state = Math.random() < dt * 0.6 ? 'laugh' : e.state === 'laugh' && e.stateT > 0 ? 'laugh' : 'circle';
  if (e.state === 'laugh' && e.stateT <= 0) { e.stateT = 0.7; sfx.ttRi(Math.max(0.3, ttNear(e))); }
  e.side = e.side || (Math.random() < 0.5 ? -1 : 1); e.sideT = (e.sideT || 0) - dt;
  if (e.sideT <= 0) { e.sideT = 1.4 + Math.random() * 1.6; if (Math.random() < 0.5) e.side = -e.side; }
  const tx = pcx + e.side * 2.6 * T, d = tx - (e.x + e.w / 2), dir = Math.abs(d) < 6 ? 0 : Math.sign(d);
  walk(e, dt, dir, 70, 700, 270, dy, true); e.facing = Math.sign(dx) || e.facing;
  // o herói golpeou perto: ela se prepara para morder no fim do golpe
  e.patT = (e.patT || 0) + dt;
  if (pl.atkT >= 0 && pl.atkAt !== e.seenAtk && dist < 4 * T) { e.seenAtk = pl.atkAt; e.patT = 0; if (e.atkCD <= 0) { e.state = 'duck'; e.stateT = TT2_ORELHA; sfx.ttCala(0.5); } }
  // ele segura o golpe por muito tempo: ela desiste e vai embora
  if (e.patT > 7 && dist < 6 * T) { e.state = 'leave'; e.stateT = 5; e.leaveDir = -Math.sign(dx) || 1; e.memT = 0; sfx.ttRi(Math.max(0.3, ttNear(e)) * 0.6); }
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !TT2_TYPES.includes(e.type)) return r;
  if (e.type === 'abutre' && (e.state === 'eat' || e.state === 'land')) { e.state = 'glide'; e.memT = 6; sfx.ttGrasna(0.8); }
  if (e.type === 'descarna') {
    if (e.state === 'cover') { e.state = 'walk'; e.atkCD = 1.4; }
    if (!e.small && e.hp <= e.maxHp / 2) tt2Parte(e);
  }
  if (e.type === 'catador' && e.state === 'spin' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  if (e.type === 'hiena' && (e.state === 'circle' || e.state === 'laugh' || e.state === 'duck')) { e.state = 'circle'; e.atkCD = 0.6; }
  return r;
}; }
// o tapete se parte em dois menores (cada um com a metade da vida que sobrou)
function tt2Parte(e) {
  const hp = Math.max(1, Math.ceil(e.hp / 2));
  for (const d of [-1, 1]) {
    const o = spawnEnemy('descarna', e.x + d * 6, e.y, e.zone);
    if (!o || o.dead) continue;
    Object.assign(o, { small: true, hp, maxHp: hp, w: 9, x: e.x + e.w / 2 - 4.5 + d * 6, dmg: Math.max(1, Math.round(e.dmg * 0.7)), state: 'walk', atkCD: 0.8, vx: d * 80, memT: 4, lvl: e.lvl, xp: Math.max(1, Math.round(e.xp / 2)), gold: Math.max(1, Math.round((e.gold || 1) / 2)) });
  }
  e.dead = true; e.despawn = true; ttDust(e.x + e.w / 2, e.y + e.h, 8, 40); sfx.ttChia(0.7, 1.4);
}
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  // carniça: o abutre mais perto desce para comer
  if (e && !e.boss) { const fx = e.x + e.w / 2, fy = e.y + e.h; for (const a of enemies) if (!a.dead && a.type === 'abutre' && a.state !== 'eat' && Math.hypot(a.x - fx, a.y - fy) < 15 * T) { a.state = 'land'; a.stateT = 4; a.food = { x: fx, y: fy }; break; } }
  if (!TT2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, ttNear(e, 260));
  if (e.type === 'descarna') { ttSparks(cx, cy, 10, ['#404c34', '#566446', '#20281a'], 50, 200, 0.6, false); sfx.ttChia(v, 0.6); }
  else if (e.type === 'medula') { ttSparks(cx, cy, 8, ['#d0ae8c', '#ecd2b2', '#ae8a6a'], 40, 200, 0.6, false); sfx.ttMorde(v); }
  else if (e.type === 'abutre') { ttSparks(cx, cy, 8, ['#2c2620', '#3e362e', '#544a40'], 40, 60, 1.2, false); sfx.ttGrasna(v, 0.7); }
  else { ttDust(cx, e.y + e.h, 8, 40); sfx.ttCai(v, e.type === 'hiena' ? 1.3 : 1.1); }
  if (e.bum) e.bum.owner = null;
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !TT2_TYPES.includes(type)) return e;
  e.zone = zone;
  if (type !== 'medula') for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'medula') {
    const c = tt2Casa(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T), 6);
    if (c) { tt2Pos(e, c[0], c[1]); e.state = 'in'; e.ttHidden = true; } else { e.state = 'out'; e.ttHidden = false; }
  } else if (type === 'abutre') { e.state = 'glide'; e.bone = true; }
  else if (type === 'hiena') e.state = 'circle';
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: os fêmures caindo, os bumerangues, os espinhos do parasita ---------- */
function tt2Update(dt) {
  const pcx = pl.x + pl.w / 2;
  const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
  // o fêmur do abutre: cai reto, quica uma vez e fica um pouco no chão
  for (let i = tt2Ossos.length - 1; i >= 0; i--) {
    const O = tt2Ossos[i]; O.t += dt;
    if (O.rest) { O.rest -= dt; if (O.rest <= 0) tt2Ossos.splice(i, 1); continue; }
    O.vy = Math.min(O.vy + GRAV * dt, MAXFALL); O.a += dt * 6; const ny = O.y + O.vy * dt;
    if (solidAt(Math.floor(O.x / T), Math.floor((ny + 3) / T))) { O.y = Math.floor((ny + 3) / T) * T - 3; O.rest = 1.2; ttDust(O.x, O.y + 3, 5, 30); sfx.ttQuica(0.6 * clamp(1 - Math.hypot(pl.x - O.x, pl.y - O.y) / 260, 0, 1)); continue; }
    O.y = ny;
    if (hitsHero(O.x, O.y, 4)) { const r = hurtPlayer(O.dmg, O.x, null, true); if (r !== 'none' || pl.invuln > 0) { ttSparks(O.x, O.y, 5, TT_OSSOC, 50); tt2Ossos.splice(i, 1); continue; } }
    if (O.t > 6) tt2Ossos.splice(i, 1);
  }
  // o bumerangue: vai em arco até a ponta e volta para a mão; atravessa o ar, bate na pedra e cai
  for (let i = tt2Bums.length - 1; i >= 0; i--) {
    const B = tt2Bums[i], O = B.owner && ttLive(B.owner) ? B.owner : null; B.t += dt; B.a += dt * 20;
    if (B.drop) { B.vy += GRAV * dt; B.x += B.vx * dt; B.y += B.vy * dt; if (solidAt(Math.floor(B.x / T), Math.floor(B.y / T)) || B.t > 5) { ttDust(B.x, B.y, 6, 30); if (O) O.bum = null; tt2Bums.splice(i, 1); } continue; }
    const u = Math.min(1, B.t / B.T), out = Math.sin(u * Math.PI), back = u > 0.5;
    const hx = O ? ttPt(O, 16, 15, TT2.CA_BX, TT2.CA_FY) : [B.x0, B.y0];
    const bx = back ? lerp(B.x0 + B.dir * B.D, hx[0], (u - 0.5) * 2) : B.x0 + B.dir * B.D * Math.sin(u * Math.PI);
    const by = (back ? lerp(B.y0, hx[1], (u - 0.5) * 2) : B.y0) - out * 2.4 * T;
    const ox = B.x, oy = B.y; B.x = bx; B.y = by;
    if (solidAt(Math.floor(B.x / T), Math.floor(B.y / T))) { B.drop = true; B.vx = (B.x - ox) / Math.max(dt, 1e-3) * 0.3; B.vy = -40; sfx.ttQuica(0.6); continue; }
    if (!(back ? B.hitBack : B.hitOut) && hitsHero(B.x, B.y, 4)) {
      const r = hurtPlayer(B.dmg, B.x - B.dir * (back ? -10 : 10), null, true);
      if (r !== 'none' || pl.invuln > 0) { if (back) B.hitBack = true; else B.hitOut = true; ttSparks(B.x, B.y, 4, TT_OSSOC, 50); }
    }
    B.whT = (B.whT || 0) - dt; if (B.whT <= 0) { B.whT = 0.15; const v = clamp(1 - Math.hypot(pl.x - B.x, pl.y - B.y) / 240, 0, 1); if (v > 0.05) sfx.ttAssobio(v * 0.7); }
    if (u >= 1) { if (O) O.bum = null; tt2Bums.splice(i, 1); }
  }
  // o espinho do parasita: sai do bloco pela linha, rápido, fica e recolhe
  for (let i = tt2Espinhos.length - 1; i >= 0; i--) {
    const S = tt2Espinhos[i]; S.t += dt;
    const len = S.L * (S.t < 0.12 ? S.t / 0.12 : S.t > 0.55 ? Math.max(0, 1 - (S.t - 0.55) / 0.2) : 1);
    if (!S.hit && S.t < 0.5 && !pl.dead) {
      for (let d = 0; d <= len; d += 4) if (hitsHero(S.x + S.ux * d, S.y + S.uy * d, 2)) { const r = hurtPlayer(S.dmg, S.x, null, true); if (r !== 'none' || pl.invuln > 0) S.hit = true; break; }
    }
    S.len = len; if (S.t > 0.75) tt2Espinhos.splice(i, 1);
  }
}
HOOK.update.push(tt2Update);
function clearTt2Fx() { tt2Ossos.length = 0; tt2Bums.length = 0; tt2Espinhos.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearTt2Fx(); tt2Tables(); return _nw(sd, sv); }; }

// o osso que o abutre vai largar brilha (só o aviso)
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) if (!e.dead && e.type === 'abutre' && e.state === 'aim') addL(e.x + e.w / 2, e.y + e.h, 0.3);
}; }
HOOK.drawWorld.push((cx, cy) => {
  const B = TT2.get();
  for (const O of tt2Ossos) { const img = B.fe[O.rest ? 0 : Math.floor(O.a) % 4].r; lc.drawImage(img, Math.round(O.x - cx - img.width / 2), Math.round(O.y - cy - img.height / 2)); }
  for (const b of tt2Bums) { const img = B.fe[Math.floor(b.a) % 4].r; lc.drawImage(img, Math.round(b.x - cx - img.width / 2), Math.round(b.y - cy - img.height / 2)); }
  // o espinho do parasita: osso pontudo saindo da face do bloco
  for (const S of tt2Espinhos) {
    const n = Math.floor(S.len || 0);
    for (let d = 0; d <= n; d++) {
      const t = d / Math.max(1, S.L), w = Math.max(0, Math.round((1 - t) * 2)), x = Math.round(S.x + S.ux * d - cx), y = Math.round(S.y + S.uy * d - cy);
      lc.fillStyle = '#3a352a'; lc.fillRect(x - w - 1, y - w - 1, w * 2 + 3, w * 2 + 3);
      lc.fillStyle = d > n - 3 ? '#f4eedc' : (d % 3 === 1 ? '#a29880' : '#c8bca0'); lc.fillRect(x - w, y - w, w * 2 + 1, w * 2 + 1);
    }
  }
  // o parasita dentro do osso: rachinhas no bloco dele; no aviso, a linha de rachadura até a face
  for (const e of enemies) {
    if (e.dead || e.type !== 'medula' || !e.ttHidden) continue;
    const x0 = e.cx * T - cx, y0 = e.cy * T - cy; if (x0 < -20 || x0 > VW + 20 || y0 < -20 || y0 > VH + 20) continue;
    const k = Math.floor(e.t * 2) % 3; lc.fillStyle = 'rgba(20,16,10,0.55)';
    for (let j = 0; j < 4; j++) lc.fillRect(Math.round(x0 + 3 + ((j * 5 + k * 3) % 7)), Math.round(y0 + 3 + ((j * 3 + k) % 6)), 1, 1);
    if (e.state === 'crack') { const q = 1 - e.stateT / TT2_RACHA; lc.fillStyle = '#1a1610'; for (let d = -T * 0.6; d < e.L * q; d += 1) lc.fillRect(Math.round(e.sx + e.ux * d - cx), Math.round(e.sy + e.uy * d - cy), 1, 1); }
  }
});
// por cima do herói: o tapete de besouros cobrindo
HOOK.drawTop.push((cx, cy) => {
  const B = TT2.get().be;
  for (const e of enemies) {
    if (e.dead || e.type !== 'descarna' || e.state !== 'cover') continue;
    const img = B[3].r, w = e.small ? 14 : 20, h = e.small ? 14 : 18;
    lc.drawImage(img, Math.round(pl.x + pl.w / 2 - cx - w / 2 + Math.sin(e.t * 30)), Math.round(pl.y + pl.h - cy - h), w, h);
  }
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  ttGrasna(v = 1, p = 1) { tone(320 * p, 0.35, 'sawtooth', 0.025 * v, -140); noise(0.35, 0.03 * v, 1100 * p, 'bandpass', 0, 2); tone(260 * p, 0.25, 'square', 0.008 * v, -80, 0.2); },
  ttBica(v = 1) { noise(0.04, 0.04 * v, 1600, 'bandpass', 0, 4); },
  ttChia(v = 1, p = 1) { noise(0.25, 0.03 * v, 3200 * p, 'bandpass', 0, 3); for (let k = 0; k < 3; k++) noise(0.03, 0.02 * v, 4200 * p, 'highpass', 0.03 + k * 0.06); },
  ttRoi(v = 1) { for (let k = 0; k < 3; k++) noise(0.04, 0.04 * v, 2400 + k * 300, 'bandpass', k * 0.05, 5); },
  ttMorde(v = 1) { noise(0.08, 0.06 * v, 1400, 'bandpass', 0, 2); tone(180, 0.08, 'square', 0.015 * v, -60); },
  ttRacha(v = 1) { for (let k = 0; k < 6; k++) noise(0.04, 0.05 * v, 1200 + k * 200, 'bandpass', k * 0.1, 4); },
  ttAssobio(v = 1) { tone(900 + Math.random() * 300, 0.1, 'sine', 0.012 * v, 400); noise(0.1, 0.02 * v, 2400, 'bandpass', 0, 3); },
  ttArremessa(v = 1) { noise(0.18, 0.06 * v, 1600, 'bandpass', 0, 1); tone(500, 0.15, 'triangle', 0.016 * v, -200); },
  ttRi(v = 1) { for (let k = 0; k < 6; k++) tone(520 + (k % 2) * 180 + Math.random() * 40, 0.08, 'sawtooth', 0.016 * v, 120, k * 0.1); },
  ttCala(v = 1) { tone(300, 0.2, 'sine', 0.012 * v, -120); },
  ttRosna(v = 1) { tone(110, 0.3, 'sawtooth', 0.03 * v, -40); noise(0.3, 0.06 * v, 600, 'lowpass'); }
});
