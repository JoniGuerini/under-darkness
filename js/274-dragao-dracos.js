'use strict';

/* ================= o Covil do Dragão: a cria do dragão =================
   Cinco dos dez bichos da camada (docs/camadas/11-covil-dragao.md, seção 6; os kobolds estão no 273). Todos de carne e
   escama, nas cores das escamas de draco (do sangue-de-boi ao cobre e ao ocre claro), o camaleão em cinza de cinza; os
   avisos acendem em âmbar e laranja de brasa, nunca em azul.
   - a Ninhada de Dracos (criadraco), 5 a 7 filhotes sem asa que nascem juntos (a ninhada) e andam pelo chão em roda,
     a uns 4 blocos do herói. Um deles guincha: todos param e abrem a boca (o brilho laranja, 0,5 s) e pulam juntos,
     cada um do seu lado. Cada filhote tem pouca vida;
   - o Camaleão de Cinza (camaleao), grudado na parede de fundo, visto de costas, quase invisível (só um tremor na
     textura); anda devagar pelo fundo. Os olhos acendem e a garganta incha (0,7 s): a língua grudenta atravessa até
     8 blocos (precisa de linha livre) e, se pega, puxa o herói até a boca (dgPuxar, 270; o 276 faz o puxão) e morde.
     Bater nele ou ele morrer solta (dgSoltar);
   - a Serpe (serpe), de asa-braço, voa alto em oito e nunca para; sobe nas correntes quentes (lava, fumarolas, bicas,
     colunas de lava embaixo dela). Grito agudo e as patas se abrem (0,6 s): mergulha, agarra o herói (dgAgarrar, 270;
     o 276 leva o herói junto) e carrega por até 6 blocos, mais devagar, e solta (uns 1,5 s, ou quando apanha). É o
     único bicho do jogo que agarra;
   - o Draco Couraçado (dracocour), quadrúpede sem asa, lento, a frente blindada em placas de obsidiana (golpe de frente
     faz 25%). De frente recolhe o pescoço (0,6 s) e dá a mordida esticada; de costas a cauda levanta e as escamas
     chocalham (0,6 s) e ela varre em arco atrás dele;
   - o Wyrm Constritor (wyrm), a serpente longa sem pernas (o corpo é uma corrente de gomos), enrolada nas colunas de
     lava (DG_COLUNA) ou nos andaimes de ossos (DG_ANDAIME); sem nenhum perto, enrola-se no chão. Aperta o corpo (as
     escamas acendem, rangido, 0,8 s) e se solta como mola em linha reta até 12 blocos; depois rasteja até outra coluna.
   O 275 põe o nível e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache), rampas de 6 tons com luz de cima
   à esquerda; brilhos pelo HOOK.drawGlow e EYES_E, os pontinhos acesos por cima do escuro (HOOK.drawTop), a língua no
   HOOK.drawWorld. Materiais e bases do 278 (filtrados: o que não existe é pulado). Prefixo dk2. */

/* ---------- números ---------- */
Object.assign(ET, {
  criadraco: { name: 'Ninhada de Dracos', w: 10, h: 7, hp: 12, dmg: 6, xp: 5, kb: 1.2, fly: false, blood: '#c4602a' },
  camaleao: { name: 'Camaleão de Cinza', w: 14, h: 10, hp: 70, dmg: 15, xp: 24, kb: 0.5, fly: true, blood: '#8a6a58' },
  serpe: { name: 'Serpe', w: 20, h: 12, hp: 110, dmg: 20, xp: 34, kb: 0.5, fly: true, blood: '#c4602a' },
  dracocour: { name: 'Draco Couraçado', w: 26, h: 15, hp: 260, dmg: 26, xp: 52, kb: 0.15, fly: false, blood: '#b8502a' },
  wyrm: { name: 'Wyrm Constritor', w: 12, h: 10, hp: 130, dmg: 22, xp: 40, kb: 0.4, fly: true, blood: '#c4602a' }   // fly: a gravidade dele é feita aqui
});
const DK2_TYPES = ['criadraco', 'camaleao', 'serpe', 'dracocour', 'wyrm'];
// materiais e bases do 278; filtradas agora e de novo a cada mundo
const DK2_DROPS = {
  criadraco: [['escama_draco', 0.15], ['glandula_fogo', 0.12], ['min_draconio', 0.03], ['pocao', 0.03]],
  camaleao: [['escama_draco', 0.35], ['min_draconio', 0.06], ['pocao', 0.07]],
  serpe: [['escama_draco', 0.5, 1, 2], ['glandula_fogo', 0.35], ['min_draconio', 0.08], ['pocao', 0.08], ['couraca_escamas', 0.01], ['elmo_chifre_serpe', 0.01]],
  dracocour: [['escama_draco', 0.6, 1, 3], ['min_draconio', 0.12], ['pocao', 0.1], ['dente_draco', 0.01], ['couraca_escamas', 0.01]],
  wyrm: [['glandula_fogo', 0.45], ['escama_draco', 0.3], ['min_draconio', 0.1], ['pocao', 0.08], ['dente_draco', 0.01]]
};
function dk2Tables() { for (const k of DK2_TYPES) DROPS[k] = DK2_DROPS[k].filter(([id]) => ITEMS[id]); }
dk2Tables();
Object.assign(NAV_WALKERS, { criadraco: 1, dracocour: 1 });
Object.assign(CV_STEP, { criadraco: 1, dracocour: 1 });

const DK2_BOCA = 0.5, DK2_GARGANTA = 0.7, DK2_GRITO = 0.6, DK2_PESCOCO = 0.6, DK2_CAUDA = 0.6, DK2_APERTO = 0.8;
const DK2_LINGUA = 8 * T, DK2_LINGUA_SP = 560;    // a língua: alcance e velocidade
const DK2_CARREGA = 6 * T, DK2_CARREGA_T = 1.5;  // a serpe: quanto carrega
const DK2_MOLA = 12 * T, DK2_MOLA_SP = 400;      // o wyrm: o bote de mola
const DK2_SEG = 15, DK2_SEG_L = 3.6;             // o wyrm: os gomos do corpo

/* ---------- as poses ----------
   o draco couraçado, no desenho de 52 x 26 (o corpo no x 22, os pés na linha 25): h a cabeça, jaw a boca aberta,
   tail [meio, ponta] da cauda, st o passo */
const DK2_DBX = 22;
const DK2_DC = [
  { h: [38, 12.4], jaw: 0, tail: [[5, 15], [0.6, 19]], st: 0 },          // 0-1 parado / andando
  { h: [38.4, 12.8], jaw: 0, tail: [[5, 15.6], [0.6, 18.4]], st: 1 },
  { h: [32.6, 8.4], jaw: 0, tail: [[5, 15], [0.6, 19]], st: 0, back: 1 },  // 2 o pescoço recolhido (aviso)
  { h: [44.4, 13.6], jaw: 1, tail: [[5.4, 15.4], [0.8, 18]], st: 0 },     // 3 a mordida esticada
  { h: [37.4, 12], jaw: 0, tail: [[6, 8], [2.6, 1.6]], st: 0, up: 1 },     // 4 a cauda levantada (aviso)
  { h: [38, 12.6], jaw: 0, tail: [[5, 19], [0.4, 23]], st: 0, low: 1 }     // 5 a varrida
];

/* ================= arte ================= */
const DK2 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const ER = {
  esc: R6(['#2a1410', '#4a2418', '#6e3820', '#9a5428', '#c47a3a', '#e8a85a']),         // a escama de draco
  barriga: R6(['#3a2410', '#6a4420', '#9a6a34', '#c8944a', '#e4b868', '#f8dc98']),     // o ventre ocre
  obs: R6(['#1a0c08', '#2e140c', '#4a2014', '#6a301e', '#8a4630', '#c87a52']),         // as placas do couraçado
  cinza: R6(['#1c1a1a', '#2e2a28', '#48423e', '#6a625c', '#8e857e', '#b4aca4']),       // o camaleão
  papo: R6(['#3a1a10', '#6a3020', '#9a5030', '#c47a4a', '#e0a070', '#f4c8a0']),        // a garganta inflada
  memb: R6(['#200a08', '#3e140c', '#621f10', '#8a3216', '#b24c22', '#d87038']),        // a membrana da asa
  brasa: R6(['#3a0a04', '#6a1a04', '#a83a08', '#e06a10', '#ffa020', '#ffd050']),
  osso: R6(['#3a3020', '#5a4c34', '#7a6a4c', '#9a8a68', '#bcac88', '#ddd0ae']),
  negro: R6(['#0a0606', '#140c0a', '#1e1410', '#2a1c16', '#38261e', '#4a3228']),
  lingua: R6(['#3a1018', '#6a2030', '#9a3446', '#c4505e', '#e07a7a', '#f4aaa0'])
};
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// as escamas: fileiras desencontradas, a borda de baixo de cada uma mais escura
const esc = (x, y) => ((((x + ((y >> 1) % 2) * 1.5) % 3) + 3) % 3 < 0.9 ? -0.7 : 0) + (y % 2 ? 0.15 : -0.2);
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
function tubo(P, x0, y0, x1, y1, r0, r1, R, base, s, f) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) {
      if (ox * ox + oy * oy > r * r + 0.05) continue;
      const X = x + ox, Y = y + oy;
      P.put(X, Y, R, base - (oy / Math.max(0.5, r)) * 1.1 - (ox / Math.max(0.5, r)) * 0.6 + cg(X | 0, Y | 0, s) * 0.35 + (f ? f(X | 0, Y | 0) : 0));
    }
  }
}
// uma curva (ponto a ponto) em tubos, afinando de r0 para r1
function curva(P, pts, r0, r1, R, base, s, f) { const n = pts.length - 1; for (let i = 0; i < n; i++) tubo(P, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], lerp(r0, r1, i / n), lerp(r0, r1, (i + 1) / n), R, base, s + i, f); }
// a curva de Bézier de três pontos em n pedaços
const bez = (a, b, c, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]); } return o; };
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
// uma pata de lagarto: coxa, canela e as garras de osso
function pata(P, hx, hy, fx, fy, R, base, s, r = 1.1, out = 0.8) {
  const kx = (hx + fx) / 2 + out, ky = (hy + fy) / 2 - 0.3;
  tubo(P, hx, hy, kx, ky, r, r * 0.8, R, base, s); tubo(P, kx, ky, fx, fy - 0.6, r * 0.8, r * 0.6, R, base - 0.2, s + 1);
  P.put(fx + 0.8, fy, ER.osso, base + 0.6); P.put(fx - 0.2, fy, ER.osso, base); P.put(fx + 1.6, fy, ER.osso, base + 1);
}

/* ---------- a Ninhada: o filhote, 18 x 11 de frente para a direita (os pés na linha 10) ----------
   0-1 andando, 2 a boca aberta (aviso), 3 o pulo (patas esticadas, a boca aberta) */
const BOCA_PUP = [];
function pup(k) {
  const P = cp(18, 11), s = 27401 + k * 7, gape = k === 2, leap = k === 3, st = k === 1 ? 1 : 0;
  // a cauda: grossa na base, afinando para trás e para cima
  curva(P, bez([5.6, 6.6], [2.2, 7.2], [0.4, leap ? 5.2 : 3.6], 5), 1.4, 0.45, ER.esc, 2.6, s, esc);
  // as patas de longe, mais escuras
  const fb = leap ? [2.8, 8.4] : [st ? 5.2 : 7.4, 10], ff = leap ? [15.2, 8.8] : [st ? 12.4 : 10.2, 10];
  pata(P, 6.6, 7.2, fb[0] + 0.8, fb[1], ER.esc, 1.4, s + 1, 1);
  pata(P, 11, 7.2, ff[0] + 0.8, ff[1], ER.esc, 1.4, s + 2, 1);
  // o corpo: as escamas em cima, o ventre ocre embaixo; a crista de espinhos de osso
  ell(P, 8.4, 6.2, 4.8, 2.7, leap ? -0.12 : 0, ER.esc, s + 3, 2.9, (u, v, x, y) => v > 0.42 ? [ER.barriga, -0.4 + (x % 2 ? 0.3 : 0)] : [ER.esc, esc(x, y)]);
  for (let x = 4.6; x <= 11; x += 1.6) P.put(x, 3.4 + (leap ? (x - 8) * 0.1 : 0) - (x > 7 && x < 10 ? 0.4 : 0), ER.osso, 3.6 + (x > 8 ? 0.6 : 0));
  // as patas de perto
  const nb = leap ? [2, 9] : [st ? 7.4 : 5.2, 10], nf = leap ? [16, 9.4] : [st ? 10.2 : 12.4, 10];
  pata(P, 6, 7.6, nb[0], nb[1], ER.esc, 2.8, s + 4, 1.1);
  pata(P, 11.6, 7.6, nf[0], nf[1], ER.esc, 2.8, s + 5, 1.1);
  // a cabeça: o crânio, o focinho, a boca (aberta no aviso e no pulo, a brasa dentro), o olho âmbar, os chifrinhos
  const open = gape || leap, hx = gape ? 13.2 : 13.6, hy = gape ? 3.6 : 4.6;
  ell(P, hx, hy, 2.5, 2.1, gape ? -0.35 : 0, ER.esc, s + 6, 3.3, (u, v) => [ER.esc, v > 0.5 ? -0.5 : 0]);
  ell(P, hx + 2.3, hy + (gape ? 0.1 : 0.6), 1.7, 1.1, gape ? -0.4 : 0, ER.esc, s + 7, 3.4);
  if (open) {
    const jy = hy + (gape ? 2.6 : 2.2);
    P.line(hx - 0.2, hy + 1.4, hx + 3.4, jy, ER.esc, 2.4); P.line(hx + 0.4, hy + 1.9, hx + 3, jy + 0.4, ER.barriga, 2.6);
    for (let x = hx + 0.8; x <= hx + 3.2; x += 0.5) P.put(x, lerp(hy + 1.1, jy - 0.6, (x - hx) / 3.4), ER.brasa, 4 + (x > hx + 2 ? 1 : 0));
    P.put(hx + 3.4, hy + 0.9, ER.osso, 5); P.put(hx + 2.8, jy - 0.2, ER.osso, 4.6);
    BOCA_PUP[k] = [hx + 2.2, hy + 1.6];
  } else { P.line(hx + 0.6, hy + 1.3, hx + 3.6, hy + 1.2, ER.negro, 1.4); BOCA_PUP[k] = [hx + 2.6, hy + 1.2]; }
  P.put(hx + 0.6, hy - 0.6, ER.brasa, 5); P.put(hx + 0.2, hy - 0.6, ER.negro, 1);
  P.line(hx - 1, hy - 1.4, hx - 2.8, hy - 2.6, ER.osso, 3.6); P.put(hx - 2.9, hy - 2.8, ER.osso, 5);
  return setO(P.done());
}

/* ---------- o Camaleão de Cinza, visto de costas na parede, 26 x 18 com a cabeça para a direita ----------
   0-1 andando (as patas em diagonal), 2 a garganta inflada (aviso), 3 a boca aberta (a língua sai) */
function cama(k) {
  const P = cp(26, 18), s = 27451 + k * 7, c = 9, st = k === 1 ? -1 : 1, inf = k === 2, open = k === 3;
  // a cauda enrolada em espiral para baixo
  const tail = [[7.4, c], [5.4, c + 0.1]], C = [3.4, c + 2.7];
  for (let i = 0; i <= 14; i++) { const f = i / 14 * 1.75 * Math.PI, th = -Math.PI / 2 - f, r = 2.7 * (1 - f / (1.75 * Math.PI) * 0.62); tail.push([C[0] + Math.cos(th) * r, C[1] + Math.sin(th) * r]); }
  curva(P, tail, 1.3, 0.45, ER.cinza, 2.6, s, (x, y) => (x + y) % 3 ? 0 : -0.6);
  // as patas abertas para os lados, os pés em pinça
  const legs = [
    [15.6, c - 2.2, 18.4 - st * 2, c - 6.6], [15.6, c + 2.2, 18.4 + st * 2, c + 6.6],
    [8.6, c - 2, 6.6 + st * 2, c - 6.4], [8.6, c + 2, 6.6 - st * 2, c + 6.4]
  ];
  for (const [hx, hy, fx, fy] of legs) {
    const ex = (hx + fx) / 2 + (fx > hx ? -0.2 : 0.2), ey = hy + (fy - hy) * 0.75;
    tubo(P, hx, hy, ex, ey, 1.2, 0.9, ER.cinza, 2.8, s + 1); tubo(P, ex, ey, fx, fy, 0.9, 0.6, ER.cinza, 2.6, s + 2);
    const sg = Math.sign(fy - hy); P.put(fx - 0.8, fy, ER.cinza, 4); P.put(fx + 0.8, fy, ER.cinza, 3.4); P.put(fx, fy + sg * 0.6, ER.cinza, 2);
  }
  // o corpo: a pele de tubérculos cinza, a crista no meio das costas, umas manchas de fuligem e de brasa velha
  ell(P, 11.4, c, 6.4, 3.4, 0, ER.cinza, s + 3, 2.8, (u, v, x, y) => {
    const h = hash2(x, y, s);
    if (h < 0.035) return [ER.esc, 1.2];
    return [ER.cinza, (h < 0.3 ? 0.7 : h > 0.86 ? -0.8 : 0) + (Math.abs(v) < 0.18 ? 0.8 : 0)];
  });
  for (let x = 6; x <= 16.5; x += 1) P.put(x, c - 0.4, ER.cinza, x % 2 ? 5 : 3.2);
  // a garganta: no aviso incha dos dois lados, quente
  if (inf) { ell(P, 17.6, c - 2.8, 1.9, 1.5, 0.3, ER.papo, s + 4, 3); ell(P, 17.6, c + 2.8, 1.9, 1.5, -0.3, ER.papo, s + 5, 2.6); }
  // a cabeça: o capacete (casco) atrás, o focinho fino, a boca (aberta: o vão escuro e a língua)
  ell(P, 17.2, c, 2.3, 2.6, 0, ER.cinza, s + 6, 3);
  ell(P, 20, c, 3.4, 2.4, 0, ER.cinza, s + 7, 3.2, (u) => [ER.cinza, u > 0.55 ? -0.3 : 0]);
  poly(P, [[21.6, c - 1.6], [24.6, c - 0.5], [24.6, c + 0.5], [21.6, c + 1.6]], ER.cinza, (x, y) => 3.4 - (y - c) * 0.4 + cg(x, y, s) * 0.3);
  P.line(16, c, 19.2, c, ER.cinza, 5); P.put(15.6, c, ER.cinza, 4);   // a quilha do casco
  if (open) { P.line(21.4, c, 24.8, c, ER.negro, 0.6); P.line(22.6, c, 24.8, c, ER.lingua, 3.4); }
  else P.line(22, c + 0.2, 24.4, c + 0.2, ER.cinza, 1.2);
  // os olhos: torres dos dois lados (a pupila âmbar acende no aviso)
  for (const sd of [-1, 1]) { ell(P, 19.8, c + sd * 2.5, 1.3, 1.1, 0, ER.cinza, s + 8, sd < 0 ? 3.4 : 2.8); P.put(20.2, c + sd * 2.5, inf || open ? ER.brasa : ER.negro, inf || open ? 5 : 2); }
  return setO(P.done());
}

/* ---------- a Serpe, 42 x 30 de frente para a direita (o corpo no ponto 19, 15) ----------
   wf: as asas (0 em cima, 1 no meio, 2 embaixo, 3 para trás no mergulho); leg: 0 recolhidas, 1 abertas, 2 segurando;
   cry: a cabeça erguida e a boca aberta */
const ASA = [
  { w: [17, 2.4], f: [[8, 0.6], [4.4, 4.4], [7, 8.6]] },
  { w: [14.6, 7], f: [[3, 4.6], [1.6, 9.6], [6.6, 12.6]] },
  { w: [16.6, 19], f: [[12.6, 29], [7.6, 27], [8.6, 21.4]] },
  { w: [13.6, 8.6], f: [[1, 9], [2, 12.2], [6.6, 13.4]] }
];
function serpe(wf, leg, cry) {
  const P = cp(42, 30), s = 27501 + wf * 7 + leg * 31 + (cry ? 97 : 0), A = ASA[wf];
  const S = [21, 11.6], B = [14.6, 12.8];
  const asa = (dx, dy, dk) => {
    const s0 = [S[0] + dx, S[1] + dy], w = [A.w[0] + dx, A.w[1] + dy], f = A.f.map(p => [p[0] + dx, p[1] + dy]), b = [B[0] + dx, B[1] + dy];
    // a borda de trás em arcos entre os dedos (puxa para dentro)
    const sc = (p, q) => { const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; return [lerp(mx, w[0], 0.22), lerp(my, w[1], 0.22)]; };
    const pts = [s0, w, f[0], sc(f[0], f[1]), f[1], sc(f[1], f[2]), f[2], sc(f[2], b), b];
    poly(P, pts, ER.memb, (x, y) => {
      const dseg = (x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1, u = clamp(((x + 0.5 - x0) * vx + (y + 0.5 - y0) * vy) / L, 0, 1); return Math.hypot(x + 0.5 - x0 - vx * u, y + 0.5 - y0 - vy * u); };
      const d = Math.min(dseg(s0[0], s0[1], w[0], w[1]), ...f.map(p => dseg(w[0], w[1], p[0], p[1])));
      return [ER.memb, 2.3 + 1.4 * Math.exp(-d / 1.6) + cg(x, y, s) * 0.35 - dk + (hash2(x, y, s) < 0.05 ? -0.6 : 0)];
    });
    // o braço e os dedos: osso coberto de escama, claros por cima da membrana
    tubo(P, s0[0], s0[1], w[0], w[1], 1.3, 1, ER.esc, 4 - dk, s + 3);
    for (const p of f) { P.line(w[0], w[1], p[0], p[1], ER.esc, 4.2 - dk); P.line(w[0] + 0.5, w[1] + 0.5, lerp(w[0], p[0], 0.7) + 0.5, lerp(w[1], p[1], 0.7) + 0.5, ER.esc, 2.6 - dk); }
    P.put(w[0] + 0.6, w[1] - 0.8, ER.osso, 4.6 - dk); P.put(w[0] + 1.2, w[1] - 1.4, ER.osso, 5 - dk);   // a garra do pulso
  };
  asa(-1.8, -1.2, 1.4);
  // a cauda: longa, para trás, com a ponta em lança de membrana
  const tl = bez([13.4, 16.2], [6, 15.6], [1.6, wf === 3 ? 16 : 19.4], 6);
  curva(P, tl, 1.8, 0.5, ER.esc, 2.8, s + 5, esc);
  const tp = tl[tl.length - 1];
  poly(P, [[tp[0] + 1, tp[1] - 0.4], [tp[0] - 1.4, tp[1] - 2], [tp[0] - 0.8, tp[1] + 0.6], [tp[0] - 1.4, tp[1] + 2.6]], ER.memb, (x, y) => 3.4 + cg(x, y, s) * 0.4);
  // as patas de longe e o corpo
  const PE = leg === 0 ? [[14.6, 20], [16.6, 20.6]] : leg === 1 ? [[22, 22.4], [24.4, 21.4]] : [[18.6, 24.4], [20.6, 24]];
  pata(P, 16.6, 17.2, PE[0][0], PE[0][1], ER.esc, 1.6, s + 6, 1.2, leg === 0 ? -1.2 : 0.6);
  ell(P, 19, 15, 6.6, 3.9, -0.12, ER.esc, s + 7, 2.9, (u, v, x, y) => v > 0.45 ? [ER.barriga, -0.3 + ((x + y) % 2 ? 0.2 : -0.2)] : [ER.esc, esc(x, y)]);
  for (let x = 14; x <= 23; x += 1.8) P.put(x, 11.2 + (x - 18) * 0.05, ER.osso, 3.8);    // a crista
  pata(P, 18.4, 17.6, PE[1][0], PE[1][1], ER.esc, 3, s + 8, 1.3, leg === 0 ? -1.2 : 0.6);
  if (leg === 1) for (const [ox, oy] of [[1.4, -0.8], [1.8, 0.4], [0.6, 1.2]]) P.line(PE[1][0] + 0.6, PE[1][1], PE[1][0] + 0.6 + ox, PE[1][1] + oy, ER.osso, 4.4);   // as garras abertas
  if (leg === 2) for (const ox of [-0.8, 0.4, 1.6]) P.put(PE[1][0] + ox, PE[1][1] + 1, ER.osso, 3.6);                                                    // fechadas, segurando
  // o pescoço e a cabeça: os chifres para trás, o olho âmbar; no grito a cabeça sobe e a boca abre com a brasa dentro
  const hx = cry ? 30.4 : 31.2, hy = cry ? 6.6 : 8.6;
  curva(P, bez([23.4, 13], [27, 11.6], [hx - 1.4, hy + 0.8], 4), 2.3, 1.6, ER.esc, 3.1, s + 9, esc);
  ell(P, hx, hy, 3, 2.2, cry ? -0.4 : -0.1, ER.esc, s + 10, 3.4);
  poly(P, [[hx + 1.6, hy - 1.6], [hx + 5.8, hy - (cry ? 1.6 : 0.4)], [hx + 5.6, hy + (cry ? -0.6 : 0.8)], [hx + 1.4, hy + 1]], ER.esc, (x, y) => 3.6 - (y - hy) * 0.4 + cg(x, y, s) * 0.3);
  if (cry) {
    poly(P, [[hx + 1, hy + 1], [hx + 5.6, hy + 2.8], [hx + 5, hy + 3.6], [hx, hy + 2]], ER.esc, (x, y) => 2.4 + cg(x, y, s) * 0.3);
    for (let x = hx + 1.4; x < hx + 5.4; x += 0.5) P.put(x, hy + 0.6 + (x - hx) * 0.22, ER.brasa, 4 + (x > hx + 3 ? 1 : 0));
  } else P.line(hx + 1.4, hy + 0.9, hx + 5.4, hy + 0.5, ER.negro, 1.2);
  P.put(hx + 0.9, hy - 0.6, ER.brasa, 5); P.put(hx + 0.4, hy - 0.6, ER.negro, 1);
  for (const [ox, l, b] of [[-0.4, 4.6, 4.6], [0.8, 3.6, 3.4]]) { P.line(hx - 1 + ox, hy - 1.4, hx - 1 + ox - l, hy - 3.4 + (cry ? 0.6 : 0), ER.osso, b); P.put(hx - 1 + ox - l - 0.6, hy - 3 + (cry ? 0.6 : 0), ER.osso, b - 1); }
  asa(0, 0, 0);
  return setO(P.done());
}

/* ---------- o Draco Couraçado, 52 x 26 ----------
   o corpo de barril em escamas, a frente coberta por faixas de obsidiana (como um tatu), a cabeça larga com a placa por
   cima; as patas grossas e tortas para fora */
// uma faixa da couraça: a borda de cima e a da esquerda claras (a luz), a emenda da direita escura
function faixa(P, cx, cy, rx, ry, a, s) {
  ell(P, cx, cy, rx, ry, a, ER.obs, s, 1.2, (u, v, X, Y) => {
    if (u > 0.68) return [ER.negro, 0.6];
    return [ER.obs, (v < -0.62 ? 3.6 : 0) + (u < -0.55 ? 2 : 0) + (hash2(X, Y, s) < 0.1 ? 1 : 0) + (Math.abs(v) < 0.12 ? 0.6 : 0)];
  });
}
function couracado(k) {
  const o = DK2_DC[k], P = cp(52, 26), s = 27601 + k * 7, BX = DK2_DBX, low = o.back ? 0.8 : 0, st = o.st ? 1 : -1;
  // as patas de longe (mais escuras, um pouco à frente)
  pata(P, 17, 17, 17.6 + st * 1.6, 25, ER.esc, 1.3, s, 1.9, -1);
  pata(P, 32, 17, 33.4 - st * 1.6, 25, ER.esc, 1.3, s + 1, 1.9, 1);
  // a cauda: grossa, com espinhos de osso; levantada no aviso, baixa na varrida
  const tl = bez([12.6, 14], o.tail[0], o.tail[1], 7);
  curva(P, tl, 3.1, 0.8, ER.esc, 2.8, s + 2, esc);
  for (let i = 1; i < tl.length - 1; i++) {
    const [x, y] = tl[i], [x1, y1] = tl[i + 1], nx = y1 - y, ny = -(x1 - x), L = Math.hypot(nx, ny) || 1, sg = ny / L < 0 ? 1 : -1, r = lerp(3.1, 0.8, i / 7) + 0.6;
    P.line(x + nx / L * sg * r * 0.6, y + ny / L * sg * r * 0.6, x + nx / L * sg * (r + 1.6), y + ny / L * sg * (r + 1.6), ER.osso, 4.4 - i * 0.2);
  }
  // o corpo: o barril de escamas, o ventre ocre
  ell(P, 20.6, 14.2 + low * 0.5, 10.2, 5.4, 0, ER.esc, s + 3, 2.9, (u, v, x, y) => v > 0.55 ? [ER.barriga, -0.6 + (x % 3 ? 0 : -0.5)] : [ER.esc, esc(x, y) * 1.2]);
  // as placas pequenas nas costas
  for (let i = 0; i < 4; i++) faixa(P, 12.8 + i * 3, 9.6 + Math.abs(i - 1.5) * 0.4, 1.6, 1.3, -0.2, s + 10 + i);
  // as patas de perto: grossas, o cotovelo para fora, as garras de osso
  pata(P, 14.6, 17.6, 14.2 - st * 1.6, 25, ER.esc, 3, s + 5, 2.4, -1.3);
  pata(P, 29.6, 17.8, 30.2 + st * 1.6, 25, ER.esc, 3, s + 6, 2.4, 1.3);
  // o pescoço curto e grosso
  const nb = bez([28, 12.4 + low], [(29 + o.h[0]) / 2, Math.min(12.4, o.h[1]) - 0.4], [o.h[0] - 2.4, o.h[1] + 0.2], 4);
  curva(P, nb, 3.8, 3, ER.esc, 3, s + 4, esc);
  // a couraça: as faixas de obsidiana do ombro ao pescoço, de trás para a frente
  for (const [x, y, rx, ry, a] of [[23.4, 12, 2.4, 5, 0.12], [26.4, 11.4, 2.5, 5.4, 0.2], [29.4, 11.4, 2.5, 5, 0.32]]) faixa(P, x, y + low, rx, ry, a, s + 20 + x);
  for (let i = 1; i < 4; i++) faixa(P, nb[i][0], nb[i][1] - 0.6, 1.9, 3, 0.3 + i * 0.1, s + 30 + i);
  // a cabeça: larga e baixa, a placa por cima, os chifres curtos para trás, o olho âmbar debaixo da placa
  const hx = o.h[0], hy = o.h[1];
  ell(P, hx, hy + 0.4, 4, 3, 0, ER.esc, s + 7, 3.1, (u, v) => [v > 0.4 ? ER.barriga : ER.esc, v > 0.4 ? -0.6 : 0]);
  poly(P, [[hx + 1.6, hy - 1.6], [hx + 6.6, hy - 0.4], [hx + 6.8, hy + 1], [hx + 1.6, hy + 2]], ER.esc, (x, y) => 3.6 - (y - hy) * 0.5 + cg(x, y, s) * 0.3);
  if (o.jaw) {
    poly(P, [[hx - 1, hy + 1.8], [hx + 6.4, hy + 4.2], [hx + 5.8, hy + 5.4], [hx - 1, hy + 3.4]], ER.barriga, (x, y) => 2.2 + cg(x, y, s) * 0.3);
    for (let x = hx + 0.4; x < hx + 6; x += 0.5) P.put(x, hy + 1.6 + (x - hx) * 0.32, ER.brasa, 3.6 + (x > hx + 3 ? 1 : 0));
    for (const x of [hx + 2.2, hx + 3.8, hx + 5.6]) { P.put(x, hy + 1.3, ER.osso, 5); P.put(x - 0.4, hy + 2.8 + (x - hx) * 0.3, ER.osso, 4.4); }
  } else { P.line(hx + 1, hy + 1.7, hx + 6.6, hy + 1.2, ER.negro, 1); P.put(hx + 5.6, hy + 2, ER.osso, 4.6); }
  poly(P, [[hx - 3.6, hy - 0.8], [hx - 0.8, hy - 3.4], [hx + 3.4, hy - 3], [hx + 5.4, hy - 1.2], [hx + 1.4, hy - 0.4], [hx - 2.6, hy + 0.6]], ER.obs, (x, y) => 1.4 + (y < hy - 2.4 ? 3.4 : 0) + (x > hx + 3.6 ? 1 : 0) + cg(x, y, s) * 0.4);
  P.put(hx + 1.8, hy, ER.brasa, 5); P.put(hx + 1.3, hy, ER.negro, 1);
  for (const [ox, l] of [[-2.8, 3.4], [-1, 2.6]]) { P.line(hx + ox, hy - 2.4, hx + ox - l, hy - 4, ER.osso, 4.6); P.put(hx + ox - l - 0.4, hy - 4.2, ER.osso, 5); }
  return setO(P.done());
}

/* ---------- o Wyrm: a cabeça 17 x 11 de frente para a direita (0 fechada, 1 aberta) e os gomos do corpo ---------- */
function wyrmCab(k) {
  const P = cp(17, 11), s = 27701 + k, open = k === 1, c = 5;
  ell(P, 6, c, 4.4, 3.1, 0, ER.esc, s, 3.1, (u, v, x, y) => v > 0.5 ? [ER.barriga, -0.4] : [ER.esc, esc(x, y)]);
  poly(P, [[8.4, c - 2.4], [15.4, c - (open ? 1.8 : 0.8)], [15.6, c + (open ? -0.6 : 0.6)], [8.6, c + 1.4]], ER.esc, (x, y) => 3.6 - (y - c) * 0.45 + cg(x, y, s) * 0.3);
  if (open) {
    poly(P, [[7.6, c + 1.4], [15.2, c + 3.8], [14.4, c + 4.8], [7.4, c + 3]], ER.esc, (x, y) => 2.3 + cg(x, y, s) * 0.3);
    for (let x = 8.4; x < 14.8; x += 0.5) P.put(x, c + 0.6 + (x - 8) * 0.28, ER.brasa, 3.8 + (x > 11 ? 1 : 0));
    P.put(15, c - 0.2, ER.osso, 5); P.put(14.2, c + 3.6, ER.osso, 4.6);
  } else P.line(9, c + 1.1, 15.2, c + 0.6, ER.negro, 1.2);
  // a crista de espinhos para trás, o olho âmbar
  for (let i = 0; i < 4; i++) P.line(6.6 - i * 1.6, c - 2.4 + i * 0.2, 5 - i * 1.6 - 1.2, c - 4.2 + i * 0.4, ER.osso, 4.2 - i * 0.3);
  P.put(9.2, c - 1, ER.brasa, 5); P.put(8.8, c - 1, ER.negro, 1);
  // o desenho virado de cabeça para baixo (para olhar para a esquerda girando sem ficar de barriga para cima)
  const o = outlined(P.done()), v = mk(o.width, o.height), x = v.getContext('2d'); x.translate(0, o.height); x.scale(1, -1); x.drawImage(o, 0, 0);
  return { r: o, v, wr: whiteOf(o), wv: whiteOf(v) };
}
// um gomo: o disco de escamas com a luz de cima à esquerda; mode 1: o lado de trás da coluna; 2: as bordas acesas
function gomo(r, mode) {
  const n = Math.ceil(r * 2 + 1), P = cp(n, n), c = n / 2, s = 27751 + Math.round(r * 10);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy) / r; if (d > 1) continue;
    const ed = esc(x + 7, y + 3) < -0.3;
    if (mode === 2 && ed) { P.put(x, y, ER.brasa, 4.4 - d * 1.2 + cg(x, y, s) * 0.4); continue; }
    P.put(x, y, ER.esc, 4.4 - (dx + dy) / r * 1.1 - d * 1.2 + cg(x, y, s) * 0.45 + (ed ? -0.6 : 0) - (mode === 1 ? 1.6 : 0) + (dy / r > 0.55 ? 0.6 : 0));
  }
  const o = outlined(P.done());
  return { r: o, w: whiteOf(o) };
}
const GOMO_R = [1.6, 2.1, 2.6, 3.1, 3.6];

DK2.get = () => DK2.ready || (DK2.ready = {
  pup: [0, 1, 2, 3].map(pup),
  cama: [0, 1, 2, 3].map(cama),
  sp: {
    voa: [0, 1, 2].map(w => serpe(w, 0, false)), grito: serpe(0, 1, true), mergulho: serpe(3, 1, false), leva: [0, 1, 2].map(w => serpe(w, 2, false)),
    plana: serpe(1, 0, false)
  },
  dc: DK2_DC.map((_, k) => couracado(k)),
  wc: [0, 1].map(wyrmCab),
  gomo: GOMO_R.map(r => [0, 1, 2].map(m => gomo(r, m)))
});
DK2.BOCA_PUP = BOCA_PUP;
DK2.GL = {
  brasa: glow(4, '#ffa020'), brasaG: glow(10, '#ffa020'), ouro: glow(6, '#ffd050'), ouroG: glow(12, '#ffd050'),
  laranja: glow(8, '#ff6a10'), papo: glow(7, '#ff8a3a')
};
}

/* ================= comportamento e desenho ================= */
const dk2Fx = [], dk2Gritos = [], dk2Arcos = [], dk2Mordidas = [], dk2Ninhadas = [];
{
const near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const q01 = (t, T0) => clamp(1 - t / T0, 0, 1);
const BRASA = ['#ffa020', '#ffd050', '#ff6a10'], CINZA = ['#8e857e', '#b4aca4', '#6a625c'], ESC = ['#c47a3a', '#e8a85a', '#9a5428'], OURO = ['#ffd050', '#fff0a0', '#ffa020'];
function P(o) { if (dk2Fx.length < 400) dk2Fx.push(o); }
function sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (dk2Fx.length > 380) return;
  for (let i = 0; i < n; i++) P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[(Math.random() * cols.length) | 0], size: 1 });
}
// quanto espaço livre há em cima (para os pulos)
function room(e, max = 8) { const x0 = Math.floor((e.x + 1) / T), x1 = Math.floor((e.x + e.w - 1) / T), ty = Math.floor(e.y / T); for (let k = 1; k <= max; k++) for (let x = x0; x <= x1; x++) if (solidAt(x, ty - k)) return (k - 1) * T + (e.y - ty * T); return max * T; }
// o pulo em arco até (tx, ty) (os pés), passando um pouco
function pulo(e, tx, ty, peak = 22, maxV = 260) {
  const ex = e.x + e.w / 2, ey = e.y + e.h, d = tx + Math.sign(tx - ex) * 6 - ex, h = ty - ey;
  const v0 = Math.sqrt(2 * GRAV * clamp(room(e, 4) - 3, 6, peak)), disc = v0 * v0 + 2 * GRAV * h, t = disc > 0 ? (v0 + Math.sqrt(disc)) / GRAV : 0.5;
  e.vy = -v0; e.vx = clamp(d / Math.max(0.3, t), -maxV, maxV); e.onGround = false; e.airT = 0; e.swingHit = false;
  e.facing = Math.sign(e.vx) || e.facing;
}
const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + clamp(d, -k, k); };

/* ---------- desenho dos bichos ---------- */
function blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho na tela (bx: o corpo no desenho, by: a linha dos pés)
const scr = (e, fx, fy, x, y, bx, by) => [fx + (x - bx) * e.facing, fy - 1 - (by - y)];

// a ninhada
const pupPose = e => e.state === 'gape' ? 2 : e.state === 'leap' ? 3 : !e.onGround ? 3 : Math.abs(e.vx) > 6 ? Math.floor(e.t * 10) % 2 : 0;
DRAW_E.criadraco = (e, fx, fy, fl) => blit(cvPick(DK2.get().pup[pupPose(e)], e, fl), e, fx, fy, 9, 12, jit(e, e.state === 'gape', 50));
EYES_E.criadraco = (e, fx, fy) => {
  const k = pupPose(e), b = DK2.BOCA_PUP[k] || [15, 6], G = DK2.GL;
  const [ex, ey] = scr(e, fx, fy, (k === 2 ? 13.2 : 13.6) + 0.6, (k === 2 ? 3.6 : 4.6) - 0.6, 8, 10);
  lc.globalAlpha = 0.35; lc.drawImage(G.brasa, Math.round(ex) - 4, Math.round(ey) - 4);
  if (k === 2 || k === 3) {
    const [mx, my] = scr(e, fx, fy, b[0], b[1], 8, 10), q = k === 2 ? 0.25 + 0.4 * (1 - q01(e.stateT, DK2_BOCA)) : 0.35;
    lc.globalAlpha = q; lc.drawImage(G.brasaG, Math.round(mx) - 10, Math.round(my) - 10);
  }
};
WARN_E.criadraco = e => e.state === 'gape';

// o camaleão: na parede, girado para onde vai (ou para o herói no ataque); quase invisível espreitando
const camaPose = e => e.state === 'warn' ? 2 : e.state === 'tongue' || e.state === 'pull' || e.state === 'bite' || e.state === 'retract' ? 3 : Math.hypot(e.vx, e.vy) > 3 ? Math.floor(e.t * 4) % 2 : 0;
DRAW_E.camaleao = (e, fx, fy, fl) => {
  const S = DK2.get().cama[camaPose(e)], v = e.vis ?? 0, x = Math.round(fx), y = Math.round(fy - e.h / 2), a = e.ang || 0;
  if (v < 0.98) {   // o tremor na textura: dois fantasmas fracos ondulando
    const j = Math.sin(e.t * 7 + e.seed) * 1.1;
    lc.globalAlpha = 0.07 * (1 - v); cvRot(S.wr, x + Math.round(j), y, a); lc.globalAlpha = 0.05 * (1 - v); cvRot(S.wr, x - Math.round(j), y + 1, a);
    lc.globalAlpha = 0.1 * (1 - v); cvRot(S.r, x, y, a);
  }
  if (v > 0.02 || fl) { lc.globalAlpha = Math.max(v, fl ? 0.8 : 0); cvRot(fl ? S.wr : S.r, x + jit(e, e.state === 'warn', 40), y, a); }
  lc.globalAlpha = 1;
};
EYES_E.camaleao = (e, fx, fy) => {
  const v = e.vis ?? 0, hot = e.state === 'warn' ? 0.4 + 0.55 * (1 - q01(e.stateT, DK2_GARGANTA)) : e.state === 'tongue' || e.state === 'pull' || e.state === 'bite' ? 0.8 : 0;
  if (hot <= 0 || v < 0.05) return;
  const G = DK2.GL, a = e.ang || 0, ca = Math.cos(a), sa = Math.sin(a), cx = fx, cy = fy - e.h / 2;
  for (const sd of [-1, 1]) { const x = cx + ca * 7 - sa * sd * 2.5, y = cy + sa * 7 + ca * sd * 2.5; lc.globalAlpha = hot * v; lc.drawImage(G.brasa, Math.round(x) - 4, Math.round(y) - 4); }
  lc.globalAlpha = 0.3 * hot * v; lc.drawImage(G.brasaG, Math.round(cx + ca * 6) - 10, Math.round(cy + sa * 6) - 10);
  if (e.state === 'warn') { lc.globalAlpha = 0.35 * hot; lc.drawImage(G.papo, Math.round(cx + ca * 4.6) - 7, Math.round(cy + sa * 4.6) - 7); }
};
WARN_E.camaleao = e => e.state === 'warn';

// a serpe: as asas batem; mergulhando, o desenho gira para onde voa
const spImg = (e, fl) => {
  const S = DK2.get().sp, f = Math.floor(e.t * (e.state === 'carry' ? 11 : 7));
  const set = e.state === 'cry' ? S.grito : e.state === 'dive' ? S.mergulho : e.state === 'carry' ? S.leva[[0, 1, 2, 1][f % 4]] : e.glide ? S.plana : S.voa[[0, 1, 2, 1][f % 4]];
  return cvPick(set, e, fl);
};
const spBob = e => e.state === 'dive' || e.state === 'cry' ? 0 : Math.round(Math.sin(e.t * 5 + e.seed) * 1.2);
DRAW_E.serpe = (e, fx, fy, fl) => {
  const img = spImg(e, fl), cy = fy - e.h / 2 + spBob(e);
  if (e.state === 'dive') { const a = Math.atan2(e.vy, Math.abs(e.vx) + 1) * e.facing; cvRot(img, Math.round(fx), Math.round(cy), clamp(a, -1.1, 1.1)); return; }
  // o ponto 19, 15 do desenho (20, 16 com o contorno) no centro do corpo
  lc.drawImage(img, Math.round(fx - (e.facing > 0 ? 20 : img.width - 20) + jit(e, e.state === 'cry', 50)), Math.round(cy - 16));
};
EYES_E.serpe = (e, fx, fy) => {
  if (e.state === 'dive') return;
  const G = DK2.GL, cy = fy - e.h / 2 + spBob(e), cry = e.state === 'cry';
  const hx = fx + ((cry ? 30.4 : 31.2) + 0.9 - 19) * e.facing, hy = cy + (cry ? 6.6 : 8.6) - 0.6 - 15;
  lc.globalAlpha = 0.4; lc.drawImage(G.brasa, Math.round(hx) - 4, Math.round(hy) - 4);
  if (cry) { const q = 0.35 + 0.55 * (1 - q01(e.stateT, DK2_GRITO)); lc.globalAlpha = q; lc.drawImage(G.brasaG, Math.round(hx + 3 * e.facing) - 10, Math.round(hy + 1.6) - 10); }
};
WARN_E.serpe = e => e.state === 'cry';

// o draco couraçado
const dcPose = e => e.state === 'neckW' ? 2 : e.state === 'bite' ? 3 : e.state === 'tailW' ? 4 : e.state === 'sweep' ? 5 : e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 3) % 2 : 0;
DRAW_E.dracocour = (e, fx, fy, fl) => {
  const k = dcPose(e), j = jit(e, (k === 2 || k === 4) && e.stateT < 0.35, k === 4 ? 70 : 40);
  blit(cvPick(DK2.get().dc[k], e, fl), e, fx, fy, DK2_DBX + 1, 27, j);
};
EYES_E.dracocour = (e, fx, fy) => {
  const k = dcPose(e), o = DK2_DC[k], G = DK2.GL;
  const [ex, ey] = scr(e, fx, fy, o.h[0] + 1.6, o.h[1] - 0.4, DK2_DBX, 25);
  lc.globalAlpha = 0.45; lc.drawImage(G.brasa, Math.round(ex) - 4, Math.round(ey) - 4);
  if (k === 2 || k === 3) {   // a garganta acesa: o fogo que ele segura antes da mordida
    const q = k === 3 ? 0.7 : 0.3 + 0.55 * (1 - q01(e.stateT, DK2_PESCOCO)), [mx, my] = scr(e, fx, fy, o.h[0] + 3, o.h[1] + 1.6, DK2_DBX, 25);
    lc.globalAlpha = q; lc.drawImage(G.brasaG, Math.round(mx) - 10, Math.round(my) - 10);
  }
  if (k === 4 || k === 5) {   // as escamas da cauda esquentam
    const q = k === 5 ? 0.6 : 0.25 + 0.5 * (1 - q01(e.stateT, DK2_CAUDA)), [tx, ty] = scr(e, fx, fy, o.tail[0][0], o.tail[0][1], DK2_DBX, 25);
    lc.globalAlpha = q; lc.drawImage(G.laranja, Math.round(tx) - 8, Math.round(ty) - 8);
  }
};
WARN_E.dracocour = e => e.state === 'neckW' || e.state === 'tailW';

// o wyrm: a corrente de gomos, da cauda para a cabeça (os de trás da coluna primeiro, mais escuros)
DRAW_E.wyrm = (e, fx, fy, fl) => {
  if (!e.seg && typeof UDW !== 'undefined') e.seg = Array.from({ length: DK2_SEG }, (_, i) => ({ x: e.x + e.w / 2 + 30 - i * DK2_SEG_L, y: e.y + e.h / 2 - 4 + Math.sin(i * 0.7) * 5, z: 1, a: 0 }));   // o retrato da wiki: o corpo em S, sem coluna
  const B = DK2.get(), seg = e.seg; if (!seg) return;
  const ox = Math.round(e.x + e.w / 2) - fx, oy = Math.round(e.y + e.h) - fy, hot = e.state === 'squeeze', moving = e.state === 'seek' || e.state === 'crawl';
  const n = seg.length, sz = i => Math.max(0, Math.min(4, Math.round(4 - i / (n - 1) * 4.4)));
  const one = (i, back) => {
    const p = seg[i], G = B.gomo[sz(i)], m = fl ? -1 : back ? 1 : hot && (i + Math.floor(e.t * 12)) % 3 !== 0 ? 2 : 0, img = m < 0 ? G[0].w : G[m].r;
    let x = p.x, y = p.y;
    if (moving && i > 0) { const a = p.a ?? 0, w = Math.sin(e.t * 9 - i * 0.9) * 1.1; x -= Math.sin(a) * w; y += Math.cos(a) * w; }
    if (hot) x += Math.sin(e.t * 47 + i) * 0.5;
    lc.drawImage(img, Math.round(x - ox - img.width / 2), Math.round(y - oy - img.height / 2));
  };
  for (let i = n - 1; i >= 0; i--) if (seg[i].z < 0) one(i, true);
  for (let i = n - 1; i >= 0; i--) if (!(seg[i].z < 0)) one(i, false);
  // a cabeça, girada para onde olha (o desenho virado de cabeça para baixo quando olha para a esquerda)
  const H = B.wc[e.state === 'squeeze' || e.state === 'spring' ? 1 : 0], a = e.hAng ?? (e.facing > 0 ? 0 : Math.PI), left = Math.cos(a) < 0;
  const img = fl ? (left ? H.wv : H.wr) : (left ? H.v : H.r);
  lc.save(); lc.translate(Math.round(e.x + e.w / 2 - ox), Math.round(e.y + e.h / 2 - oy)); lc.rotate(a); lc.drawImage(img, -7, left ? -img.height + 6 : -6); lc.restore();
};
EYES_E.wyrm = (e, fx, fy) => {
  const G = DK2.GL, a = e.hAng ?? (e.facing > 0 ? 0 : Math.PI), cy = fy - e.h / 2, left = Math.cos(a) < 0;
  const lx = 3.2, ly = left ? 1 : -1;   // o olho em relação ao centro da cabeça (antes de girar)
  const x = fx + Math.cos(a) * lx - Math.sin(a) * ly, y = cy + Math.sin(a) * lx + Math.cos(a) * ly;
  lc.globalAlpha = e.state === 'squeeze' ? 0.8 : 0.4; lc.drawImage(G.brasa, Math.round(x) - 4, Math.round(y) - 4);
};
WARN_E.wyrm = e => e.state === 'squeeze';

/* ---------- a Ninhada de Dracos ---------- */
AI.criadraco = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.pupAggro = aggro;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'gape') {   // parado, a boca aberta, a brasa dentro; mira até o último instante
    e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.08) { e.tgX = pcx; e.tgY = pl.y + pl.h; }
    if (Math.random() < dt * 10) { const b = DK2.BOCA_PUP[2]; if (b) sparks(ecx + (b[0] - 8) * e.facing, e.y + e.h - 1 - (10 - b[1]), 1, BRASA, 12, -30, 0.4); }
    if (e.stateT <= 0) { e.state = 'leap'; pulo(e, e.tgX, e.tgY, 26, 240); const v = near(e, 200); if (v > 0.05 && Math.random() < 0.5) sfx.dk2Pulo(v); }
    return;
  }
  if (e.state === 'leap') {
    e.airT += dt;
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { sparks(pcx, pl.y + 10, 4, BRASA, 50); dk2Mordidas.push({ x: pcx, y: pl.y + 9, t: 0, s: 0.6 }); } }
    if (e.onGround && e.airT > 0.1) { e.state = 'land'; e.stateT = 0.35; e.vx *= 0.3; burst(ecx, e.y + e.h, 3, '#6e625a', 30, 300, 0.3); }
    else if (e.airT > 2) { e.state = 'land'; e.stateT = 0.2; }
    return;
  }
  if (e.state === 'land') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1 + Math.random()); } return; }
  e.state = 'walk';
  let dir = 0, chase = false, sp = 46;
  if (aggro) {
    // a roda: metade de cada lado do herói, a uns 3 a 5 blocos, balançando
    const sl = e.slot || 0, side = sl % 2 ? 1 : -1, R = (2.8 + ((sl >> 1) % 3) * 1.1) * T + Math.sin(gameTime * 0.9 + sl * 1.7) * 0.6 * T;
    const tx = pcx + side * R, far = Math.abs(dx) > 7 * T || !e.sees;
    if (far) { dir = Math.sign(dx); chase = true; sp = 62 + e.lvl * 0.4; }
    else { dir = Math.abs(tx - ecx) > 5 ? Math.sign(tx - ecx) : 0; sp = Math.abs(tx - ecx) > 2 * T ? 66 : 34; }
  } else { cvWander(e, dt); dir = e.wander; sp = 24; }
  walk(e, dt, dir, sp, 600, 240, dy, chase);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  e.chirpT = (e.chirpT ?? Math.random() * 4) - dt;
  if (e.chirpT <= 0) { e.chirpT = 2.5 + Math.random() * 4; const v = near(e, 180); if (v > 0.08) sfx.dk2Pio(v * 0.5); }
  // sozinho (a ninhada morreu): ataca por conta própria
  const solo = !e.grp || e.grp.m.length < 2;
  if (solo && aggro && e.atkCD <= 0 && e.onGround && e.sees && Math.abs(dx) < 6 * T && Math.abs(dx) > T && Math.abs(dy) < 3 * T) {
    e.state = 'gape'; e.stateT = DK2_BOCA; e.vx = 0; e.tgX = pcx; e.tgY = pl.y + pl.h; dk2Gritos.push({ e, t: 0, max: DK2_BOCA, k: 0 }); sfx.dk2Guincho(Math.max(0.4, near(e)));
  }
};
// a cada quadro: a ninhada. Quando dá, um guincha e todos abrem a boca ao mesmo tempo; pulam juntos
function ninhadaTick(G, dt) {
  G.m = G.m.filter(o => !o.dead && enemies.includes(o));
  if (!G.m.length) return false;
  if (G.ph === 'gape') { G.t -= dt; if (G.t <= 0) { G.ph = 'idle'; G.cd = 3.2 + Math.random() * 1.6; } return true; }
  G.cd -= dt;
  if (G.cd > 0 || pl.dead || G.m.length < 2 || G.m.some(o => o.state === 'leap' || o.state === 'gape')) return true;
  const go = G.m.find(o => o.pupAggro && o.sees && o.stun <= 0 && o.onGround && Math.hypot(pl.x - o.x, pl.y - o.y) < 7 * T);
  if (!go) return true;
  G.ph = 'gape'; G.t = DK2_BOCA;
  let n = 0;
  for (const o of G.m) if (o.stun <= 0 && o.onGround && o.state === 'walk' && Math.hypot(o.x - pl.x, o.y - pl.y) < 10 * T) { o.state = 'gape'; o.stateT = DK2_BOCA + n * 0.03; o.vx = 0; o.tgX = pl.x + pl.w / 2; o.tgY = pl.y + pl.h; n++; }
  dk2Gritos.push({ e: go, t: 0, max: DK2_BOCA, k: 0 });
  sfx.dk2Guincho(Math.max(0.5, near(go)));
  return true;
}

/* ---------- o Camaleão de Cinza ---------- */
// a parede de fundo: só anda onde há parede atrás e nenhum bloco
const naParede = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return wallAt(tx, ty) > 0 && !solidAt(tx, ty); };
const boca = e => { const a = e.ang || 0; return [e.x + e.w / 2 + Math.cos(a) * 11, e.y + e.h / 2 + Math.sin(a) * 11]; };
AI.camaleao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.showT = (e.showT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const seen = e.state !== 'creep' && e.state !== 'after';
  e.vis = approach(e.vis ?? 0, seen || e.showT > 0 ? 1 : 0, dt * (seen || e.showT > 0 ? 3.5 : 0.9));
  const stop = () => { const k = Math.pow(0.002, dt); e.vx *= k; e.vy *= k; };
  if (e.state === 'warn') {   // os olhos acendem, a garganta incha; vira a cabeça para o herói
    stop(); e.ang = angTo(e.ang || 0, Math.atan2(pcy - ecy, pcx - ecx), dt * 6);
    if (e.stateT > 0.1) { e.tgX = pcx; e.tgY = pcy; }
    if (e.stateT <= 0) { e.state = 'tongue'; e.tongL = 0; const [mx, my] = boca(e); e.tongA = Math.atan2(e.tgY - my, e.tgX - mx); sfx.dk2Lingua(Math.max(0.4, near(e))); }
    return;
  }
  if (e.state === 'tongue') {   // a língua vai reta; pega, bate na pedra ou chega no fim
    stop();
    const [mx, my] = boca(e); e.tongL += DK2_LINGUA_SP * dt;
    const tx = mx + Math.cos(e.tongA) * e.tongL, ty = my + Math.sin(e.tongA) * e.tongL;
    if (!pl.dead && tx > pl.x - 2 && tx < pl.x + pl.w + 2 && ty > pl.y - 2 && ty < pl.y + pl.h + 2) {
      const front = Math.sign(mx - pcx) === pl.facing || Math.abs(mx - pcx) < 3;
      if (pl.shieldK >= 0.6 && front) { burst(tx, ty, 8, '#ffd27a', 80, 120, 0.3, 1, true); sfx.block(); pl.vx -= pl.facing * 40; e.state = 'retract'; e.atkCD = 2.4; return; }
      if (pl.invuln > 0) { e.state = 'retract'; e.atkCD = 1.4; return; }
      e.state = 'pull'; e.stateT = 1.4; e.tongL = Math.hypot(pcx - mx, pcy - my);
      dgPuxar(1.4, mx, my, 230, e); sfx.dk2Gruda(); sparks(tx, ty, 5, ['#e07a7a', '#f4aaa0', '#c4505e'], 30, 60, 0.4);
      return;
    }
    if (e.tongL >= DK2_LINGUA || solidAt(Math.floor(tx / T), Math.floor(ty / T))) { e.state = 'retract'; e.atkCD = 2.4 + Math.random(); if (e.tongL < DK2_LINGUA) sparks(tx, ty, 3, CINZA, 20, 60, 0.3); }
    return;
  }
  if (e.state === 'pull') {   // o 276 puxa; aqui a boca acompanha e morde quando o herói chega
    stop();
    const [mx, my] = boca(e), held = pl.dgPuxE === e && !pl.dead;
    e.ang = angTo(e.ang || 0, Math.atan2(pcy - ecy, pcx - ecx), dt * 4);
    if (held) { pl.dgPuxX = mx; pl.dgPuxY = my; }
    e.tongL = Math.hypot(pcx - mx, pcy - my);
    if (!pl.dead && (e.tongL < 14 || overlap({ x: mx - 6, y: my - 6, w: 12, h: 12 }, pl))) {
      dgSoltar(e); e.state = 'bite'; e.stateT = 0.3;
      const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { dk2Mordidas.push({ x: mx, y: my, t: 0, s: 1 }); sparks(mx, my, 6, BRASA, 50); }
      sfx.dk2Mordida(Math.max(0.5, near(e)));
      return;
    }
    if (!held || e.stateT <= 0) { dgSoltar(e); e.state = 'retract'; e.atkCD = 2.6 + Math.random(); }
    return;
  }
  if (e.state === 'bite') { stop(); e.tongL = 0; if (e.stateT <= 0) { e.state = 'after'; e.stateT = 1; e.atkCD = Math.max(e.atkCD, 2.6 + Math.random()); } return; }
  if (e.state === 'retract') { stop(); e.tongL = Math.max(0, (e.tongL || 0) - 900 * dt); if (e.tongL <= 0) { e.state = 'after'; e.stateT = 1; } return; }
  if (e.state === 'after') { stop(); if (e.stateT <= 0) e.state = 'creep'; return; }
  e.state = 'creep';
  // espreitando: devagar pela parede, a uns 4 a 7 blocos do herói; muda de rumo quando acaba a parede
  e.dirT = (e.dirT || 0) - dt;
  if (e.dirT <= 0 || e.hitWall || e.hitCeil || e.onGround) {
    e.dirT = 1.6 + Math.random() * 2.4;
    let a = Math.random() * 6.28;
    if (aggro) { const b = Math.atan2(dy, dx); a = dist > 7 * T ? b + rnd(-0.6, 0.6) : dist < 4 * T ? b + Math.PI + rnd(-0.6, 0.6) : b + (Math.random() < 0.5 ? 1.57 : -1.57) + rnd(-0.4, 0.4); }
    e.mvA = a;
  }
  const sp = aggro ? 15 : 9, nx = ecx + Math.cos(e.mvA || 0) * 8, ny = ecy + Math.sin(e.mvA || 0) * 8;
  if (naParede(nx, ny)) { e.vx = lerp(e.vx, Math.cos(e.mvA) * sp, Math.min(1, dt * 3)); e.vy = lerp(e.vy, Math.sin(e.mvA) * sp, Math.min(1, dt * 3)); }
  else { e.vx = 0; e.vy = 0; e.dirT = 0; }
  if (Math.hypot(e.vx, e.vy) > 2) e.ang = angTo(e.ang || 0, Math.atan2(e.vy, e.vx), dt * 2.5);
  e.facing = Math.cos(e.ang || 0) >= 0 ? 1 : -1;
  if (aggro && e.atkCD <= 0 && e.sees && dist < DK2_LINGUA - 4 && dist > 1.5 * T) {
    const [mx, my] = boca(e);
    if (losClear(mx, my, pcx, pcy) && losClear(ecx, ecy, pcx, pcy)) { e.state = 'warn'; e.stateT = DK2_GARGANTA; e.tgX = pcx; e.tgY = pcy; sfx.dk2Garganta(Math.max(0.5, near(e))); }
  }
};

/* ---------- a Serpe ---------- */
// a altura do oito: uns 5 blocos acima do herói, ou logo abaixo do teto
function ceu(e) {
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor(pl.y / T);
  let y = pl.y - 5 * T;
  for (let k = 1; k <= 7; k++) if (solidAt(tx, ty - k)) { y = Math.max(y, (ty - k + 1) * T + 8); break; }
  return Math.min(y, pl.y - 2 * T - e.h);
}
// as correntes quentes: lava, fumarola, bica de vapor ou coluna de lava embaixo
function quente(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  for (let k = 1; k <= 10; k++) { const t = tileAt(tx, ty + k); if (t === LAVA || t === DG_FUMAROLA || t === DG_VAPOR || t === DG_COLUNA) return true; if (SOLID[t] === 1) return false; }
  return false;
}
AI.serpe = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  e.heatT = (e.heatT || 0) - dt; if (e.heatT <= 0) { e.heatT = 0.4; e.hot = quente(ecx, ecy); }
  e.glide = false;
  if (e.state === 'cry') {   // o grito agudo, as patas abertas; desacelera e mira
    const k = Math.pow(0.08, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.1) { e.tgX = pcx; e.tgY = pcy; }
    if (e.stateT <= 0) {
      const a = Math.atan2(e.tgY - ecy, e.tgX - ecx), sp = 290;
      e.state = 'dive'; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.diveD = Math.hypot(e.tgX - ecx, e.tgY - ecy) + 3 * T; e.diveL = 0; e.swingHit = false;
      sfx.dk2Mergulho(Math.max(0.4, near(e, 260)));
    }
    return;
  }
  if (e.state === 'dive') {   // desce reta; se pega o herói, agarra
    e.diveL += Math.hypot(e.vx, e.vy) * dt; e.facing = Math.sign(e.vx) || e.facing;
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 6 }, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit' && !pl.dead) {
        dgAgarrar(DK2_CARREGA_T + 0.2, e); e.state = 'carry'; e.stateT = DK2_CARREGA_T; e.carryD = 0; e.carryDir = Math.sign(e.vx) || e.facing;
        e.vx *= 0.3; e.vy = -30; sparks(pcx, pl.y + 4, 8, ESC, 60); sfx.dk2Agarra(); return;
      }
      e.state = 'climb'; e.stateT = 0.9; e.atkCD = 2.4 + Math.random(); e.vy = -120; return;
    }
    if (Math.random() < dt * 24) P({ x: ecx - e.vx * 0.04, y: ecy - e.vy * 0.04, vx: rnd(-10, 10), vy: rnd(-10, 10), g: 0, life: 0.4, max: 0.4, col: BRASA[(Math.random() * 3) | 0], size: 1 });
    if (e.hitWall || e.hitCeil || e.onGround || e.diveL > e.diveD) { e.state = 'climb'; e.stateT = 0.9; e.atkCD = 2.6 + Math.random() * 1.2; if (e.onGround || e.hitWall) burst(ecx, e.y + e.h, 6, '#6e625a', 50, 200, 0.4); }
    return;
  }
  if (e.state === 'carry') {   // carregando: sobe de lado, mais devagar, batendo forte
    const held = pl.dgAgarE === e && !pl.dead;
    e.vx = lerp(e.vx, e.carryDir * 66, Math.min(1, dt * 3)); e.vy = lerp(e.vy, e.hitCeil ? 10 : -34, Math.min(1, dt * 3));
    if (e.hitWall) e.carryDir = -e.carryDir;
    e.facing = e.carryDir; e.carryD += Math.hypot(e.vx, e.vy) * dt;
    e.flapT = (e.flapT ?? 0) - dt; if (e.flapT <= 0) { e.flapT = 0.36; const v = near(e, 220); if (v > 0.05) sfx.dk2Asa(v * 1.3); }
    if (!held || e.stateT <= 0 || e.carryD >= DK2_CARREGA) { dgSoltar(e); e.state = 'climb'; e.stateT = 0.8; e.atkCD = 3 + Math.random(); sfx.dk2Solta(Math.max(0.4, near(e))); }
    return;
  }
  if (e.state === 'climb') {
    const ty = ceu(e) + e.h / 2, k = Math.min(1, dt * 3);
    e.vx = lerp(e.vx, (Math.sign(e.vx) || e.facing) * 70, k); e.vy = lerp(e.vy, clamp((ty - ecy) * 2.4, -120, 40), k);
    if (e.hitWall) e.vx *= -0.5;
    if (e.stateT <= 0) e.state = 'fly';
    return;
  }
  e.state = 'fly';
  // o oito: em volta de um ponto acima do herói (ou de casa); nunca para
  e.fa = (e.fa ?? Math.random() * 6.28) + dt * (aggro ? 0.85 : 0.55);
  const Cx = aggro ? pcx : (e.homeX ?? ecx), Cy = aggro ? ceu(e) + e.h / 2 : (e.homeY ?? ecy), Ax = aggro ? 6 * T : 4 * T;
  const tx = Cx + Math.sin(e.fa) * Ax;
  let ty = Cy + Math.sin(e.fa * 2) * 1.4 * T;
  if (e.hot) ty -= 2 * T;   // a corrente quente leva para cima
  const k = Math.min(1, dt * 1.6), sp = aggro ? 105 : 60;
  e.vx = lerp(e.vx, clamp((tx - ecx) * 1.4, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 1.4, -70, 70), k);
  if (e.hot) { e.vy -= 90 * dt; e.glide = true; if (Math.random() < dt * 6) P({ x: ecx + rnd(-10, 10), y: e.y + e.h + 4, vx: rnd(-4, 4), vy: rnd(-40, -20), g: 0, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#ffa020' : '#e8a85a', size: 1 }); }
  if (Math.hypot(e.vx, e.vy) < 30) e.vx += (Math.sign(e.vx) || e.facing) * 60 * dt;   // nunca para
  if (e.hitWall) e.vx *= -0.5; if (e.hitCeil) e.vy = Math.abs(e.vy) * 0.5; if (e.onGround) e.vy = -60;
  e.facing = Math.abs(e.vx) > 6 ? Math.sign(e.vx) : e.facing;
  e.flapT = (e.flapT ?? Math.random()) - dt;
  if (e.flapT <= 0) { e.flapT = 0.56; const v = near(e, 220); if (v > 0.05 && !e.glide) sfx.dk2Asa(v); }
  if (aggro && e.atkCD <= 0 && e.sees && dist < 11 * T && dist > 2.5 * T && dy > T && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'cry'; e.stateT = DK2_GRITO; e.tgX = pcx; e.tgY = pcy; e.facing = Math.sign(dx) || e.facing;
    dk2Gritos.push({ e, t: 0, max: DK2_GRITO, k: 1 }); sfx.dk2Grito(Math.max(0.5, near(e, 300)));
  }
};

/* ---------- o Draco Couraçado ---------- */
AI.dracocour = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // vira devagar: dá tempo de passar para trás dele
  const turn = () => { const want = Math.sign(dx) || e.facing; if (want !== e.facing) { e.turnT = (e.turnT || 0) + dt; if (e.turnT > 1) { e.facing = want; e.turnT = 0; } } else e.turnT = 0; };
  if (e.state === 'neckW') {   // o pescoço recolhido, a garganta acesa
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 10) { const o = DK2_DC[2]; sparks(ecx + (o.h[0] + 4 - DK2_DBX) * e.facing, e.y + e.h - 1 - (25 - o.h[1] - 1.6), 1, BRASA, 10, -30, 0.4); }
    if (e.stateT <= 0) { e.state = 'bite'; e.stateT = 0.24; e.swingHit = false; e.vx = e.facing * 60; sfx.dk2Bote(Math.max(0.4, near(e))); }
    return;
  }
  if (e.state === 'bite') {   // a mordida esticada: a cabeça vai até uns 2 blocos à frente
    const reach = 24, hb = { x: e.facing > 0 ? e.x + e.w : e.x - reach, y: e.y - 2, w: reach, h: 13 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { dk2Mordidas.push({ x: pcx, y: pl.y + 9, t: 0, s: 1.3 }); sparks(pcx, pl.y + 9, 8, BRASA, 60); } }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; e.atkCD = 1.3 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'tailW') {   // a cauda levanta, as escamas chocalham
    e.vx = approach(e.vx, 0, 600 * dt);
    e.rattleT = (e.rattleT || 0) - dt; if (e.rattleT <= 0) { e.rattleT = 0.12; const v = near(e); if (v > 0.05) sfx.dk2Chocalho(v); }
    if (e.stateT <= 0) { e.state = 'sweep'; e.stateT = 0.34; e.swingHit = false; dk2Arcos.push({ x: ecx - e.facing * 10, y: e.y + e.h * 0.4, d: -e.facing, t: 0 }); sfx.dk2Varre(Math.max(0.4, near(e))); }
    return;
  }
  if (e.state === 'sweep') {   // varre em arco atrás dele; quem está lá voa longe
    const w = 36, hb = { x: e.facing > 0 ? e.x - w + 6 : e.x + e.w - 6, y: e.y - 10, w, h: e.h + 10 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { pl.vx = -e.facing * 320; pl.vy = -180; pl.onGround = false; shake(4); sparks(pcx, pcy, 8, ESC, 60); }
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  const behind = Math.sign(dx) === -e.facing;
  if (aggro) { turn(); dir = Math.abs(dx) < 30 ? 0 : Math.sign(dx); if (dir !== e.facing) dir = 0; }
  else { cvWander(e, dt); dir = e.wander; if (dir) e.facing = dir; }
  walk(e, dt, dir, aggro ? 22 + e.lvl * 0.3 : 12, 260, 240, dy, aggro && dir !== 0);
  if (e.onGround && Math.abs(e.vx) > 3) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.6; const v = near(e, 200); if (v > 0.05) { sfx.dk2Passo(v); if (v > 0.6) shake(0.6); } } }
  e.huffT = (e.huffT ?? Math.random() * 4) - dt;
  if (e.huffT <= 0) { e.huffT = 3 + Math.random() * 3; const v = near(e, 200); if (v > 0.08) { sfx.dk2Bufo(v); const o = DK2_DC[0]; sparks(ecx + (o.h[0] + 6 - DK2_DBX) * e.facing, e.y + e.h - 1 - (25 - o.h[1]), 3, ['#6e625a', '#8a7c72', '#ffa020'], 15, -30, 0.7); } }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (!behind && Math.abs(dx) < 48 && Math.abs(dy) < 18 && clearPath(e, pl)) { e.state = 'neckW'; e.stateT = DK2_PESCOCO; e.vx = 0; sfx.dk2Pescoco(Math.max(0.4, near(e))); }
  else if (behind && Math.abs(dx) < 46 && Math.abs(dy) < 22) { e.state = 'tailW'; e.stateT = DK2_CAUDA; e.vx = 0; e.rattleT = 0; }
};

/* ---------- o Wyrm Constritor ---------- */
// a coluna mais perto (de lava, do chão ao teto; ou um andaime de ossos), menos a última; null: nenhuma
function coluna(e, avoid) {
  const ex = Math.floor((e.x + e.w / 2) / T), ey = Math.floor((e.y + e.h / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  let best = null, bd = 1e9;
  for (let oy = -8; oy <= 8; oy++) for (let ox = -14; ox <= 14; ox++) {
    const tx = ex + ox, ty = ey + oy, t = tileAt(tx, ty);
    if (t !== DG_COLUNA && t !== DG_ANDAIME) continue;
    if (avoid && Math.abs(wdx(tx - avoid.tx)) < 3 && Math.abs(ty - avoid.ty) < 6) continue;
    if (t === DG_ANDAIME && (solidAt(tx, ty - 1) || solidAt(tx, ty - 2))) continue;
    const d = ox * ox + oy * oy * 2;
    if (d < bd) { bd = d; best = { tx, ty, kind: t === DG_COLUNA ? 'v' : 'h' }; }
  }
  if (!best) return null;
  if (best.kind === 'v') {   // na coluna: na altura do herói, dentro dela
    let top = best.ty, bot = best.ty;
    while (tileAt(best.tx, top - 1) === DG_COLUNA && best.ty - top < 20) top--;
    while (tileAt(best.tx, bot + 1) === DG_COLUNA && bot - best.ty < 20) bot++;
    best.ty = clamp(pty, top + 1, Math.max(top + 1, bot - 1));
    best.x = best.tx * T + T / 2; best.y = best.ty * T + T / 2;
  } else { best.x = best.tx * T + T / 2; best.y = best.ty * T - 3; }   // em cima do andaime, o corpo em volta da tábua
  return best;
}
// onde fica cada gomo enrolado (o alvo) e de que lado da coluna (z < 0: atrás)
function enrola(e, i, sq) {
  const C = e.coil, f = e.facing, ph = e.t * (sq ? 3 : 0.6), r = sq ? 3.4 + Math.sin(e.t * 30 + i) * 0.3 : 5.2;
  if (C.kind === 'v') { const a = i * 1.05 + ph; return [C.x + Math.sin(a) * r, C.y - 1 + i * 1.5, Math.cos(a)]; }
  if (C.kind === 'h') { const a = i * 1.05 + ph; return [C.x - f * (i * 1.3 - 5), C.y + 6 + Math.sin(a) * (r + 1), Math.cos(a)]; }
  const a = i * 0.75 + ph * 0.3, rr = Math.max(1.5, 9 - i * 0.55); return [C.x - Math.cos(a) * rr * f, C.y - 3 + Math.sin(a) * rr * 0.4, 1];   // no chão: a espiral achatada
}
function poseCoil(e) {   // a cabeça para fora da coluna, para o lado do herói
  const C = e.coil;
  if (C.kind === 'v') { e.x = C.x + e.facing * 6 - e.w / 2; e.y = C.y - 7 - e.h / 2; }
  else if (C.kind === 'h') { e.x = C.x + e.facing * 7 - e.w / 2; e.y = C.y - 2 - e.h / 2; }
  else { e.x = C.x + e.facing * 4 - e.w / 2; e.y = C.y - 4 - e.h / 2; }
}
function segsTick(e, dt) {
  const seg = e.seg; if (!seg) return;
  const n = seg.length;
  if (e.coil && (e.state === 'coil' || e.state === 'squeeze' || e.state === 'climb')) {
    const k = Math.min(1, dt * (e.state === 'climb' ? 5 : 9)), sq = e.state === 'squeeze';
    for (let i = 0; i < n; i++) { const [x, y, z] = enrola(e, i, sq); seg[i].x = lerp(seg[i].x, x, k); seg[i].y = lerp(seg[i].y, y, k); seg[i].z = z; }
    return;
  }
  // a corrente: cada gomo segue o da frente
  let px = e.x + e.w / 2 - Math.cos(e.hAng ?? 0) * 4, py = e.y + e.h / 2 - Math.sin(e.hAng ?? 0) * 4;
  for (let i = 0; i < n; i++) {
    const s = seg[i], ddx = s.x - px, ddy = s.y - py, d = Math.hypot(ddx, ddy) || 0.001;
    if (d > DK2_SEG_L) { s.x = px + ddx / d * DK2_SEG_L; s.y = py + ddy / d * DK2_SEG_L; }
    s.a = Math.atan2(py - s.y, px - s.x); s.z = 1;
    // rastejando, o corpo assenta no chão
    if (e.state !== 'spring') {
      if (!solidAt(Math.floor(s.x / T), Math.floor((s.y + 3) / T))) s.y += Math.min(60 * dt, 2);
      if (solidAt(Math.floor(s.x / T), Math.floor((s.y + 2) / T))) s.y = Math.floor((s.y + 2) / T) * T - 2.5;
    }
    px = s.x; py = s.y;
  }
}
AI.wyrm = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'coil' || e.state === 'squeeze') {
    e.vx = 0; e.vy = 0;
    if (e.state === 'coil') e.facing = Math.sign(dx) || e.facing;
    poseCoil(e);
    const look = clamp(Math.atan2(pcy - ecy, Math.abs(pcx - ecx) + 1), -1, 1);
    e.hAng = angTo(e.hAng ?? 0, e.facing > 0 ? look : Math.PI - look, dt * 3);
    if (e.state === 'squeeze') {   // aperta a coluna: as escamas acendem, range
      if (e.stateT > 0.1) { e.tgX = pcx; e.tgY = pcy; }
      e.creakT = (e.creakT || 0) - dt; if (e.creakT <= 0) { e.creakT = 0.2; const v = near(e); if (v > 0.05) sfx.dk2Range(v); }
      if (Math.random() < dt * 14 && e.seg) { const s = e.seg[(Math.random() * e.seg.length) | 0]; sparks(s.x, s.y, 1, BRASA, 10, -20, 0.4); }
      if (e.stateT <= 0) {
        const a = Math.atan2(e.tgY - ecy, e.tgX - ecx);
        e.state = 'spring'; e.vx = Math.cos(a) * DK2_MOLA_SP; e.vy = Math.sin(a) * DK2_MOLA_SP; e.springL = 0; e.swingHit = false; e.hAng = a; e.facing = Math.sign(e.vx) || e.facing;
        e.lastCol = e.coil; e.coil = null; sfx.dk2Mola(Math.max(0.5, near(e, 260)));
      }
      return;
    }
    e.hissT = (e.hissT ?? Math.random() * 4) - dt;
    if (e.hissT <= 0) { e.hissT = 3 + Math.random() * 4; const v = near(e, 180); if (v > 0.08) sfx.dk2Sibilo(v * 0.6); }
    if (aggro && e.atkCD <= 0 && dist < DK2_MOLA - T && dist > 1.5 * T && losClear(ecx, ecy, pcx, pcy)) { e.state = 'squeeze'; e.stateT = DK2_APERTO; e.tgX = pcx; e.tgY = pcy; e.creakT = 0; }
    return;
  }
  if (e.state === 'spring') {   // a mola: reta, até bater ou chegar a 12 blocos
    e.springL += Math.hypot(e.vx, e.vy) * dt; e.hAng = Math.atan2(e.vy, e.vx);
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 3, y: e.y - 3, w: e.w + 6, h: e.h + 6 }, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { pl.vx += Math.sign(e.vx) * 180; dk2Mordidas.push({ x: pcx, y: pcy, t: 0, s: 1.2 }); sparks(pcx, pcy, 8, BRASA, 60); }
    }
    if (Math.random() < dt * 30) P({ x: ecx, y: ecy, vx: rnd(-8, 8), vy: rnd(-8, 8), g: 0, life: 0.35, max: 0.35, col: ESC[(Math.random() * 3) | 0], size: 1 });
    if (e.hitWall || e.hitCeil || e.onGround || e.springL > DK2_MOLA) {
      e.state = 'crawl'; e.stateT = 0.9; e.vx *= 0.2; e.vy = Math.min(e.vy, 0) * 0.2; e.atkCD = 2.2 + Math.random();
      if (e.hitWall || e.hitCeil || e.onGround) { burst(ecx, ecy, 6, '#6e625a', 50, 200, 0.4); shake(1.5); }
    }
    return;
  }
  if (e.state === 'climb') {   // sobe (ou desce) pela coluna até o ponto
    const C = e.coil, tx = C.x + e.facing * 6, ty = C.y - 7;
    e.vy = clamp((ty - ecy) * 4, -50, 50); e.vx = clamp((tx - ecx) * 4, -40, 40);
    e.hAng = Math.atan2(e.vy, e.vx || 0.01);
    if (Math.hypot(tx - ecx, ty - ecy) < 3 || e.stateT <= 0) { e.state = 'coil'; e.atkCD = Math.max(e.atkCD, 0.8); }
    return;
  }
  // rastejando no chão (depois da mola, ou indo para outra coluna): a gravidade é daqui
  e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
  if (e.state === 'crawl') { if (e.onGround) e.vx = approach(e.vx, 0, 300 * dt); e.hAng = e.facing > 0 ? 0 : Math.PI; if (e.stateT <= 0) { e.state = 'seek'; e.stateT = 7; e.goal = null; e.findT = 0; } return; }
  e.state = 'seek';
  e.findT = (e.findT || 0) - dt;
  if (!e.goal && e.findT <= 0) { e.findT = 1; e.goal = coluna(e, e.lastCol); }
  e.slitherT = (e.slitherT ?? 0) - dt;
  if (e.slitherT <= 0) { e.slitherT = 0.7; const v = near(e, 160); if (v > 0.1 && Math.abs(e.vx) > 5) sfx.dk2Rasteja(v); }
  if (e.goal) {
    const G = e.goal, ddx = G.x - ecx;
    if (Math.abs(ddx) < 6 && e.onGround) { e.coil = G; e.state = 'climb'; e.stateT = 3; e.facing = Math.sign(dx) || e.facing; return; }
    walk(e, dt, Math.sign(ddx), 44, 300, 230, dy, false);
    e.facing = Math.sign(ddx) || e.facing;
  } else e.vx = approach(e.vx, 0, 200 * dt);
  e.hAng = e.facing > 0 ? 0 : Math.PI;
  // sem coluna (ou demorando demais): enrola-se no chão onde está
  if (e.onGround && (e.stateT <= 0 || (!e.goal && e.findT > 0 && e.findT < 0.9))) {
    e.coil = { x: ecx, y: e.y + e.h, kind: 'g', tx: Math.floor(ecx / T), ty: Math.floor(ecy / T) }; e.state = 'coil'; e.goal = null; e.facing = Math.sign(dx) || e.facing; e.atkCD = Math.max(e.atkCD, 0.8);
  }
};

/* ---------- golpes, mortes, nascimento ---------- */
const above = e => pl.y + pl.h <= e.y + 4;   // o herói por cima
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  // a couraça do draco: de frente o golpe faz 25%
  const armour = !!(e && !e.dead && e.type === 'dracocour' && dir === -e.facing && !above(e));
  const r = _hit(e, dir, armour ? mult * 0.25 : mult, melee);
  if (!e || !DK2_TYPES.includes(e.type)) return r;
  if (armour) { sparks(e.x + e.w / 2 + 9 * e.facing, e.y + 2, 8, OURO, 70, 120, 0.35); sfx.dk2Couraca(); }
  if (e.dead) return r;
  if (e.type === 'dracocour') e.stun = Math.min(e.stun, e.state === 'neckW' || e.state === 'tailW' || e.state === 'bite' || e.state === 'sweep' ? 0 : 0.1);
  if (e.type === 'camaleao') {   // apanhando solta a língua e aparece
    dgSoltar(e); e.showT = 1.4; e.vis = Math.max(e.vis ?? 0, 0.7);
    if (e.state === 'tongue' || e.state === 'pull' || e.state === 'warn') { e.state = 'retract'; e.atkCD = Math.max(e.atkCD, 1.6); }
  }
  if (e.type === 'serpe') {
    if (e.state === 'carry') { dgSoltar(e); e.state = 'climb'; e.stateT = 0.9; e.atkCD = Math.max(e.atkCD, 2.6); sfx.dk2Solta(0.8); }
    else if (e.state === 'cry' && e.stun > 0) { e.state = 'fly'; e.atkCD = Math.max(e.atkCD, 1.2); }
  }
  if (e.type === 'wyrm') {
    if (e.state === 'spring') e.stun = 0;
    else if (e.state === 'coil' || e.state === 'squeeze' || e.state === 'climb') { e.stun = 0; e.vx = 0; e.vy = 0; if (e.state === 'squeeze' && Math.random() < 0.35) { e.state = 'coil'; e.atkCD = 0.6; } }
  }
  if (e.type === 'criadraco' && e.state === 'gape' && e.stun > 0) e.state = 'walk';
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!DK2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, near(e, 260));
  if (e.type === 'criadraco') { sparks(cx, cy, 5, BRASA, 40, -20, 0.5); sfx.dk2Pio(v, 0.7); }
  else if (e.type === 'camaleao') { dgSoltar(e); e.vis = 1; sparks(cx, cy, 10, CINZA, 40, 40, 0.7); burst(cx, cy, 10, '#6a625c', 60, 100, 0.8); sfx.dk2Garganta(v, 0.6); }
  else if (e.type === 'serpe') { dgSoltar(e); for (let i = 0; i < 12; i++) P({ x: cx + rnd(-8, 8), y: cy + rnd(-4, 4), vx: rnd(-40, 40), vy: rnd(-60, 10), g: 80, life: rnd(0.6, 1.2), max: 1.2, col: ESC[(Math.random() * 3) | 0], size: 1 }); sfx.dk2Grito(v * 0.7, 0.6); }
  else if (e.type === 'dracocour') { burst(cx, cy, 16, '#4a2014', 90, 300, 0.7); sparks(cx, e.y + 4, 10, OURO, 60, 100, 0.8); sfx.dk2Couraca(); sfx.dk2Bufo(v, 0.6); }
  else if (e.type === 'wyrm') { if (e.seg) for (let i = 0; i < e.seg.length; i += 2) sparks(e.seg[i].x, e.seg[i].y, 2, i % 4 ? ESC : BRASA, 30, 60, 0.6); sfx.dk2Sibilo(v, 0.6); }
  return r;
}; }
let agrupando = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !DK2_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.8; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'criadraco') {
    e.state = 'walk'; e.slot = 0;
    if (!agrupando) {   // a ninhada: 5 a 7 filhotes juntos
      const G = { m: [e], ph: 'idle', cd: 1.8 + Math.random(), t: 0 }; dk2Ninhadas.push(G); e.grp = G;
      agrupando = true;
      try {
        const n = 4 + Math.floor(Math.random() * 3);
        for (let i = 0, made = 0; i < 20 && made < n; i++) {
          const x = e.x + rnd(-30, 30), y = e.y + rnd(-12, 4);
          if (rectSolid(x, y, e.w, e.h) || lavaIn(x, y, e.w, e.h)) continue;
          const o = spawnEnemy('criadraco', x, y, zone);
          if (o && !o.dead) { o.grp = G; G.m.push(o); o.slot = made + 1; made++; }
        }
      } finally { agrupando = false; }
    }
  } else if (type === 'camaleao') { e.state = 'creep'; e.vis = 0; e.ang = e.facing > 0 ? 0 : Math.PI; }
  else if (type === 'serpe') { e.state = 'fly'; e.fa = Math.random() * 6.28; }
  else if (type === 'wyrm') {
    e.seg = []; for (let i = 0; i < DK2_SEG; i++) e.seg.push({ x: e.x + e.w / 2 - e.facing * (4 + i * DK2_SEG_L), y: e.y + e.h / 2, z: 1, a: 0 });
    const C = coluna(e, null);
    if (C && Math.abs(wdx(C.tx - Math.floor((e.x + e.w / 2) / T))) < 9) {   // de tocaia: já nasce enrolado
      e.coil = C; e.state = 'coil'; poseCoil(e);
      for (let i = 0; i < DK2_SEG; i++) { const [x, y, z] = enrola(e, i, false); e.seg[i].x = x; e.seg[i].y = y; e.seg[i].z = z; }
    } else { e.state = 'seek'; e.stateT = 7; }
  } else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: a ninhada, os gomos, os gritos, os arcos, as mordidas, as faíscas ---------- */
HOOK.update.push(dt => {
  for (let i = dk2Ninhadas.length - 1; i >= 0; i--) if (!ninhadaTick(dk2Ninhadas[i], dt)) dk2Ninhadas.splice(i, 1);
  for (const e of enemies) if (!e.dead && e.type === 'wyrm') segsTick(e, dt);
  for (let i = dk2Gritos.length - 1; i >= 0; i--) { const g = dk2Gritos[i]; g.t += dt; if (g.t > g.max + 0.1 || g.e.dead) dk2Gritos.splice(i, 1); }
  for (let i = dk2Arcos.length - 1; i >= 0; i--) { dk2Arcos[i].t += dt; if (dk2Arcos[i].t > 0.4) dk2Arcos.splice(i, 1); }
  for (let i = dk2Mordidas.length - 1; i >= 0; i--) { dk2Mordidas[i].t += dt; if (dk2Mordidas[i].t > 0.25) dk2Mordidas.splice(i, 1); }
  for (let i = dk2Fx.length - 1; i >= 0; i--) { const p = dk2Fx[i]; p.life -= dt; if (p.life <= 0) { dk2Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  // quem sumiu (morto ou longe demais) não segura mais o herói
  const a = pl.dgPuxE, b = pl.dgAgarE;
  if (a && DK2_TYPES.includes(a.type) && (a.dead || !enemies.includes(a))) dgSoltar(a);
  if (b && DK2_TYPES.includes(b.type) && (b.dead || !enemies.includes(b))) dgSoltar(b);
});
function clearFx() { dk2Fx.length = 0; dk2Gritos.length = 0; dk2Arcos.length = 0; dk2Mordidas.length = 0; dk2Ninhadas.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearFx(); dk2Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: as bocas acesas, os olhos, as escamas quentes
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !DK2_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'criadraco') { if (e.state === 'gape' || e.state === 'leap') addL(cx, cy, 0.3); }
    else if (e.type === 'camaleao') { if (e.state === 'warn' || e.state === 'tongue' || e.state === 'pull') addL(cx, cy, 0.3); }
    else if (e.type === 'serpe') addL(cx, cy, e.state === 'cry' ? 0.4 : 0.12);
    else if (e.type === 'dracocour') addL(cx, cy, e.state === 'neckW' || e.state === 'bite' || e.state === 'tailW' ? 0.4 : 0.15);
    else if (e.type === 'wyrm') addL(cx, cy, e.state === 'squeeze' ? 0.55 : 0.15);
  }
}; }

/* ---------- desenho dos efeitos ---------- */
function dot(x, y, cx, cy) { lc.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); }
const onScr = (x, y, cx, cy, m = 60) => x - cx > -m && x - cx < VW + m && y - cy > -m && y - cy < VH + m;
// no mundo (atrás do herói): a língua do camaleão, da boca até a ponta (ou até o herói, puxando)
HOOK.drawWorld.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || e.type !== 'camaleao' || !(e.tongL > 0) || !(e.state === 'tongue' || e.state === 'pull' || e.state === 'retract')) continue;
    if (!onScr(e.x, e.y, cx, cy, 120)) continue;
    const [mx, my] = boca(e);
    let a = e.tongA ?? 0, L = e.tongL;
    if (e.state === 'pull') { const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2; a = Math.atan2(pcy - my, pcx - mx); L = Math.hypot(pcx - mx, pcy - my); }
    const ca = Math.cos(a), sa = Math.sin(a), n = Math.max(1, Math.ceil(L)), wob = e.state === 'retract' ? 1.2 : e.state === 'pull' ? 0.2 : 0.4;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = Math.sin(t * Math.PI) * Math.sin(gameTime * 30 + t * 9) * wob, x = mx + ca * i - sa * w, y = my + sa * i + ca * w;
      lc.fillStyle = '#6a2030'; dot(x, y + 1, cx, cy); lc.fillStyle = i % 3 ? '#c4505e' : '#9a3446'; dot(x, y, cx, cy);
      if (i % 4 === 1) { lc.fillStyle = '#e07a7a'; dot(x - sa * 0.6, y - 0.6, cx, cy); }
    }
    // a ponta grudenta
    const X = Math.round(mx + ca * L - cx), Y = Math.round(my + sa * L - cy);
    lc.fillStyle = '#9a3446'; lc.fillRect(X - 2, Y - 1, 4, 3); lc.fillRect(X - 1, Y - 2, 2, 5);
    lc.fillStyle = '#e07a7a'; lc.fillRect(X - 1, Y - 1, 2, 2); lc.fillStyle = '#f4aaa0'; lc.fillRect(X - 1, Y - 1, 1, 1);
  }
});
// a luz aditiva: as faíscas, as mordidas, os gomos quentes do wyrm, a varrida
const fxGl = {};
HOOK.drawGlow.push((cx, cy) => {
  const G = DK2.GL;
  for (const p of dk2Fx) { const g = fxGl[p.col] || (fxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  for (const m of dk2Mordidas) { lc.globalAlpha = 0.7 * (1 - m.t / 0.25); lc.drawImage(G.ouroG, Math.round(m.x - cx) - 12, Math.round(m.y - cy) - 12); }
  for (const e of enemies) {
    if (e.dead || e.type !== 'wyrm' || e.state !== 'squeeze' || !e.seg || !onScr(e.x, e.y, cx, cy)) continue;
    const q = 0.25 + 0.45 * (1 - q01(e.stateT, DK2_APERTO));
    for (let i = 0; i < e.seg.length; i += 3) { lc.globalAlpha = q * (0.7 + 0.3 * Math.sin(gameTime * 20 + i)); lc.drawImage(G.laranja, Math.round(e.seg[i].x - cx) - 8, Math.round(e.seg[i].y - cy) - 8); }
  }
  for (const A of dk2Arcos) { lc.globalAlpha = 0.35 * (1 - A.t / 0.4); lc.drawImage(G.brasaG, Math.round(A.x + A.d * 18 - cx) - 10, Math.round(A.y - cy) - 10); }
  lc.globalAlpha = 1;
});
// por cima do escuro: as bocas acesas da ninhada, os olhos do camaleão, os gritos, a varrida, as escamas do wyrm e do
// couraçado, as mordidas, as faíscas
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead || !DK2_TYPES.includes(e.type) || !onScr(e.x, e.y, cx, cy)) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (e.type === 'criadraco' && (e.state === 'gape' || e.state === 'leap')) {
      const b = DK2.BOCA_PUP[e.state === 'gape' ? 2 : 3]; if (!b) continue;
      lc.globalAlpha = 1; lc.fillStyle = Math.floor(now * 16 + e.seed) % 2 ? '#ffd050' : '#ffa020'; lc.fillRect(Math.round(fx + (b[0] - 8) * e.facing), Math.round(fy - 1 - (10 - b[1])), 1, 1);
    } else if (e.type === 'camaleao' && (e.vis ?? 0) > 0.3 && (e.state === 'warn' || e.state === 'tongue' || e.state === 'pull')) {
      const a = e.ang || 0, ca = Math.cos(a), sa = Math.sin(a), y0 = fy - e.h / 2;
      lc.globalAlpha = e.vis; lc.fillStyle = '#ffd050';
      for (const sd of [-1, 1]) lc.fillRect(Math.round(fx + ca * 7.2 - sa * sd * 2.5), Math.round(y0 + sa * 7.2 + ca * sd * 2.5), 1, 1);
    } else if (e.type === 'camaleao' && e.state === 'creep' && (e.vis ?? 0) < 0.3) {
      // o tremor: um pixel claro correndo pelo contorno de vez em quando
      if (Math.sin(now * 1.3 + e.seed) > 0.6) { const a = now * 3 + e.seed; lc.globalAlpha = 0.18; lc.fillStyle = '#b4aca4'; lc.fillRect(Math.round(fx + Math.cos(a) * 9), Math.round(fy - e.h / 2 + Math.sin(a * 1.3) * 3.5), 1, 1); }
    } else if (e.type === 'wyrm' && e.state === 'squeeze' && e.seg) {
      lc.globalAlpha = 1;
      for (let i = 0; i < e.seg.length; i++) { if ((i + Math.floor(now * 14)) % 3) continue; const s = e.seg[i]; lc.fillStyle = i % 2 ? '#ffd050' : '#ffa020'; lc.fillRect(Math.round(s.x - cx + Math.sin(i * 2.1) * 1.4), Math.round(s.y - cy - 1), 1, 1); }
    } else if (e.type === 'dracocour' && e.state === 'tailW') {
      // as escamas da cauda chocalhando: faíscas pulando ao longo dela
      const o = DK2_DC[4];
      for (let j = 0; j < 5; j++) {
        const t = (j + 0.5) / 5, u = 1 - t, x = u * u * 12 + 2 * u * t * o.tail[0][0] + t * t * o.tail[1][0], y = u * u * 14.6 + 2 * u * t * o.tail[0][1] + t * t * o.tail[1][1];
        lc.globalAlpha = (j + Math.floor(now * 18)) % 2 ? 1 : 0.45; lc.fillStyle = j % 2 ? '#ffd050' : '#ffa020';
        lc.fillRect(Math.round(fx + (x - DK2_DBX) * e.facing + Math.sin(now * 50 + j) * 1.5), Math.round(fy - 1 - (25 - y) - 2 + Math.cos(now * 43 + j * 2)), 1, 1);
      }
    } else if (e.type === 'dracocour' && e.state === 'neckW') {
      const o = DK2_DC[2]; lc.globalAlpha = 1; lc.fillStyle = Math.floor(now * 14) % 2 ? '#ffd050' : '#ff6a10';
      lc.fillRect(Math.round(fx + (o.h[0] + 3 - DK2_DBX) * e.facing), Math.round(fy - 1 - (25 - o.h[1] - 1.4)), 1, 1);
    }
  }
  // os gritos: arcos saindo da boca (laranja na ninhada, claros e agudos na serpe)
  for (const g of dk2Gritos) {
    const e = g.e, ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    const bx = g.k ? ecx + 16 * e.facing : ecx + 7 * e.facing, by = g.k ? ecy - 7 : ecy - 3;
    for (let j = 0; j < 3; j++) {
      const p = (g.t * (g.k ? 2.8 : 2.2) + j / 3) % 1, r = 2 + p * (g.k ? 10 : 7);
      lc.globalAlpha = (1 - p) * 0.85; lc.fillStyle = g.k ? (j ? '#ffd050' : '#fff0c0') : (j ? '#ffa020' : '#ffd050');
      for (let i = -3; i <= 3; i++) { const a = i * 0.24 - (g.k ? 0.3 : 0.5); dot(bx + Math.cos(a) * r * e.facing, by + Math.sin(a) * r, cx, cy); }
    }
  }
  // a varrida da cauda: o arco atrás do couraçado
  for (const A of dk2Arcos) {
    const p = A.t / 0.4, f = 1 - p;
    for (let c = 0; c < 3; c++) {
      const r = 18 + c * 4, n = 16;
      lc.globalAlpha = f * (0.9 - c * 0.25); lc.fillStyle = c === 0 ? '#fff0c0' : c === 1 ? '#ffd050' : '#ffa020';
      for (let i = 0; i <= n; i++) { const t = i / n; if (t > p * 1.6 + 0.2) break; const a = -1.3 + t * 2.1; dot(A.x + A.d * Math.cos(a) * r, A.y + Math.sin(a) * r * 0.75, cx, cy); }
    }
  }
  // as mordidas: dentes fechando
  for (const m of dk2Mordidas) {
    const p = m.t / 0.25, g = Math.round((1 - p) * 4 * m.s) + 1;
    lc.globalAlpha = 1 - p; lc.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i++) { dot(m.x + i * 2, m.y - g, cx, cy); dot(m.x + i * 2 + 1, m.y + g, cx, cy); }
    lc.fillStyle = '#ffd050'; dot(m.x, m.y - g - 1, cx, cy);
  }
  for (const p of dk2Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
}

/* ---------- sons ---------- */
Object.assign(sfx, {
  // a ninhada: o pio, o guincho que chama o pulo, o pulo, a mordida
  dk2Pio(v = 1, p = 1) { tone(1500 * p, 0.08, 'square', 0.008 * v, 500 * p); tone(1900 * p, 0.06, 'square', 0.005 * v, -300 * p, 0.08); },
  dk2Guincho(v = 1) { for (let k = 0; k < 3; k++) tone(1700 + k * 260, 0.32, 'sawtooth', 0.012 * v, 700, k * 0.04); noise(0.3, 0.02 * v, 3400, 'bandpass', 0, 3); },
  dk2Pulo(v = 1) { noise(0.12, 0.03 * v, 1600, 'bandpass', 0, 1.5); tone(500, 0.1, 'square', 0.008 * v, 300); },
  dk2Mordida(v = 1) { noise(0.08, 0.07 * v, 2200, 'bandpass', 0, 1.2); tone(240, 0.1, 'square', 0.02 * v, -120); tone(900, 0.05, 'triangle', 0.012 * v, -400, 0.03); },
  // o camaleão: a garganta inchando (um coaxar seco), a língua estalando, o grude
  dk2Garganta(v = 1, p = 1) { tone(120 * p, 0.6, 'sawtooth', 0.02 * v, 60 * p); tone(240 * p, 0.6, 'triangle', 0.008 * v, 80 * p); noise(0.6, 0.012 * v, 600, 'bandpass', 0, 3); },
  dk2Lingua(v = 1) { noise(0.12, 0.08 * v, 3000, 'bandpass', 0, 1); tone(1400, 0.12, 'sine', 0.02 * v, -900); },
  dk2Gruda() { noise(0.18, 0.06, 700, 'lowpass'); tone(300, 0.2, 'sine', 0.03, -180); tone(180, 0.25, 'square', 0.008, -80, 0.05); },
  // a serpe: as asas de couro, o grito agudo, o mergulho, agarrar e soltar
  dk2Asa(v = 1) { noise(0.18, 0.035 * v, 360, 'bandpass', 0, 0.8); },
  dk2Grito(v = 1, p = 1) { tone(2600 * p, 0.5, 'sawtooth', 0.016 * v, -1200 * p); tone(3100 * p, 0.42, 'square', 0.006 * v, -1500 * p, 0.04); noise(0.45, 0.022 * v, 4200, 'bandpass', 0, 4); },
  dk2Mergulho(v = 1) { noise(0.5, 0.07 * v, 1100, 'bandpass', 0, 0.6); tone(520, 0.45, 'sine', 0.014 * v, -280); },
  dk2Agarra() { noise(0.14, 0.09, 1400, 'bandpass', 0, 1); tone(200, 0.2, 'square', 0.025, -90); tone(1800, 0.25, 'sawtooth', 0.01, -800, 0.05); },
  dk2Solta(v = 1) { tone(1600, 0.25, 'sawtooth', 0.01 * v, 600); noise(0.2, 0.03 * v, 600, 'bandpass', 0, 1); },
  // o couraçado: os passos pesados, o bufo de fumaça, o pescoço recolhendo (um chiado), o bote, o chocalho, a varrida,
  // o golpe na couraça
  dk2Passo(v = 1) { tone(70, 0.16, 'sine', 0.05 * v, -25); noise(0.1, 0.03 * v, 300, 'lowpass'); },
  dk2Bufo(v = 1, p = 1) { noise(0.45, 0.04 * v, 500 * p, 'bandpass', 0, 0.8); tone(90 * p, 0.4, 'sawtooth', 0.01 * v, -30); },
  dk2Pescoco(v = 1) { noise(0.6, 0.035 * v, 2600, 'bandpass', 0, 2); tone(110, 0.6, 'sawtooth', 0.016 * v, 60); },
  dk2Bote(v = 1) { noise(0.12, 0.08 * v, 1600, 'bandpass', 0, 1); tone(160, 0.14, 'square', 0.03 * v, -80); },
  dk2Chocalho(v = 1) { for (let k = 0; k < 3; k++) noise(0.03, 0.03 * v, 3800 + k * 600, 'bandpass', k * 0.035, 5); },
  dk2Varre(v = 1) { noise(0.32, 0.08 * v, 800, 'bandpass', 0, 0.7); tone(140, 0.3, 'sawtooth', 0.02 * v, -60); },
  dk2Couraca() { tone(700, 0.14, 'square', 0.03, -300); tone(1400, 0.1, 'triangle', 0.016, -500); noise(0.08, 0.05, 2600, 'bandpass', 0, 2); },
  // o wyrm: o sibilo, o rangido do aperto, a mola, o rastejar
  dk2Sibilo(v = 1, p = 1) { noise(0.7, 0.03 * v, 5200 * p, 'highpass'); tone(160 * p, 0.5, 'sine', 0.006 * v, -40); },
  dk2Range(v = 1) { tone(90 + Math.random() * 40, 0.18, 'sawtooth', 0.016 * v, 30); noise(0.16, 0.02 * v, 900, 'bandpass', 0, 6); },
  dk2Mola(v = 1) { noise(0.3, 0.09 * v, 1300, 'bandpass', 0, 0.7); tone(180, 0.3, 'sawtooth', 0.024 * v, 260); },
  dk2Rasteja(v = 1) { noise(0.35, 0.014 * v, 1800, 'bandpass', 0, 1.5); }
});
