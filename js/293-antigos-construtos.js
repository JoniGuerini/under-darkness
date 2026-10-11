'use strict';

/* ================= a Cidade dos Antigos: os construtos, parte um =================
   Cinco dos dez construtos e vigias da décima quinta camada (docs/camadas/13-cidade-antigos.md, seção 6; os outros
   cinco estão no 294). Nada aqui respira nem sangra: o golpe solta faísca branca e pó de pedra. Todos se mexem em
   ângulos retos ou em curvas perfeitas, e todo ataque tem aviso em vermelho (AT_COL.aviso) ou branco. Pedra lisa,
   laje, chapa antiga e ferro estelar; os olhos e as juntas em ciano de glifo. Luz só fria.
   - o Custódio (custodio), o guarda de placas de pedra com a alabarda de ferro estelar, do tamanho do herói. Anda em
     passos exatos de 1 bloco, sempre parando no meio da casa, com um clique e meio segundo parado entre um e outro.
     Ergue a alabarda e uma grade de 3 quadrados vermelhos acende no chão à frente, um por um (0,75 s); a alabarda cai
     nos quadrados (quem estiver em cima de qualquer um deles leva);
   - o Olho-Vigia (olhovigia), o olho de vidro num anel de pedra com quatro aletas; voa só em linha reta, na
     horizontal ou na vertical, para e vira em ângulo reto. Uma linha fina de mira vermelha liga o olho ao herói (0,8 s;
     ela segue o herói e trava nos últimos 0,25 s); depois o raio branco sai pela linha travada até bater na pedra;
   - o Agrimensor (agrimensor), o teodolito de três pernas com o prumo pendurado; anda devagar mantendo uns 7 blocos e
     se crava no chão para atirar. Duas linhas de medida saem dele (da lente e do pé) e se cruzam onde o herói está
     (1 s; travam no fim); um tiro curvo, em parábola perfeita, cai no cruzamento e estoura;
   - o Enxame de Tesselas (tesselas), dezenas de ladrilhos triangulares voando em formação: em linha quando viaja, em
     ponto (uma espiral fechada) quando rodeia o herói em círculo perfeito. O anel de tesselas acende em volta do herói
     (segue 0,55 s, trava vermelho 0,45 s) e fecha; quem saiu do anel a tempo escapa (o escudo não segura: vem de todo
     lado). Cada golpe derruba tesselas; o anel fica menor e mais fraco conforme o enxame perde vida;
   - o Ponteiro (ponteiro), uma barra de ferro estelar de 3 blocos com um eixo em cada ponta; anda girando meia volta em
     volta de uma ponta, como um compasso andando. Um arco fino vermelho aparece na parede marcando o giro (0,7 s) e vem
     a varredura rápida em volta da ponta mais perto do herói.
   Nenhum entra na arena do Arquiteto nem nas Salas de Prumo: atNoGo (290) vale como parede nas decisões de passo. O
   295 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache),
   rampas de 6 tons da seção 12 com luz de cima à esquerda, tudo assado uma vez (AT1.get); brilhos pelo HOOK.drawGlow
   e EYES_E, os avisos e os pontinhos acesos por cima do escuro (HOOK.drawTop). Materiais e bases do 298 (filtrados).
   Prefixo at1. */

/* ---------- números ---------- */
Object.assign(ET, {
  custodio: { name: 'Custódio', w: 10, h: 22, hp: 110, dmg: 22, xp: 34, kb: 0.25, fly: false, blood: '#c8d2dc' },
  olhovigia: { name: 'Olho-Vigia', w: 12, h: 12, hp: 60, dmg: 18, xp: 26, kb: 0.6, fly: true, blood: '#e8f4ff' },
  agrimensor: { name: 'Agrimensor', w: 14, h: 21, hp: 70, dmg: 20, xp: 28, kb: 0.45, fly: false, blood: '#b4bcc8' },
  tesselas: { name: 'Enxame de Tesselas', w: 16, h: 16, hp: 30, dmg: 10, xp: 12, kb: 0.7, fly: true, blood: '#a4b6c8' },
  ponteiro: { name: 'Ponteiro', w: 22, h: 14, hp: 90, dmg: 22, xp: 32, kb: 0, fly: true, phase: true, blood: '#c8d2dc' }   // phase: o 293 põe a barra onde ela está, a física não mexe
});
const AT1_TYPES = ['custodio', 'olhovigia', 'agrimensor', 'tesselas', 'ponteiro'];
// materiais e bases do 298; filtradas agora e de novo a cada mundo (as três bases somam uns 1,5%)
const AT1_BASES = [['lanca_compasso', 0.005], ['elmo_prumo', 0.005], ['couraca_tesselas', 0.005]];
const AT1_DROPS = {
  custodio: [['nucleo_estelar', 0.4], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT1_BASES],
  olhovigia: [['lente_vigia', 0.4], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT1_BASES],
  agrimensor: [['lente_vigia', 0.45], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT1_BASES],
  tesselas: [['tessela', 0.5, 1, 3], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT1_BASES],
  ponteiro: [['tessela', 0.4, 1, 2], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT1_BASES]
};
function at1Tables() { for (const k of AT1_TYPES) DROPS[k] = AT1_DROPS[k].filter(([id]) => ITEMS[id]); }
at1Tables();
Object.assign(NAV_WALKERS, { custodio: 1, agrimensor: 1 });
Object.assign(CV_STEP, { custodio: 1, agrimensor: 1 });

const AT1_PASSO = 0.25, AT1_PAUSA = 0.5, AT1_GRADE = 0.75;      // o custódio: o passo, a parada, a grade acendendo
const AT1_PASSO_SP = T / AT1_PASSO;
const AT1_MIRA = 0.8, AT1_MIRA_TRAVA = 0.25, AT1_RAIO_MAX = 18 * T;   // o olho: a mira, quanto dela fica travada, o alcance
const AT1_MEDE = 1, AT1_MEDE_TRAVA = 0.3, AT1_TIRO_G = 520, AT1_TIRO_R = 15;   // o agrimensor: medir, travar, a gravidade e o raio do estouro
const AT1_TS_N = 28, AT1_TS_JUNTA = 0.55, AT1_TS_TRAVA = 0.45, AT1_TS_FECHA = 0.24;   // as tesselas: quantas, o anel seguindo, travado, fechando
const AT1_PT_L = 36, AT1_ARCO = 0.7, AT1_PT_GIRO = 0.75, AT1_PT_VARRE = 0.22;   // o ponteiro: o comprimento, o arco de aviso, o passo, a varredura

/* ---------- as poses do custódio (no quadro de 52 x 58 virado para a direita: o corpo de 12 x 22 com o meio em x 16,
   o topo do corpo na linha 32 e os pés na 53; a alabarda sobra em volta) ----------
   lg: o passo; lean: o tronco para a frente; low: abaixa; hn: a mão da frente (em relação ao meio e ao topo do corpo);
   a: o ângulo da haste (da mão para a lâmina); bh: a mão de trás solta; two: as duas mãos na haste */
const AT1_CU_B = 16, AT1_CU_Y0 = 32;
const AT1_CU = [
  { lg: 0, lean: 0, hn: [6, 11], a: -1.5, bh: [-5, 12] },                // 0 parado: a alabarda em pé
  { lg: 1, lean: 0.6, hn: [6.5, 11], a: -1.42, bh: [-4.4, 11.6] },       // 1 o passo
  { lg: 0, lean: -0.6, hn: [1, -3], a: -1.95, two: 1 },                   // 2 erguida (o aviso)
  { lg: 0.6, lean: 1, low: 1, hn: [7, 10], a: 0.32, two: 1 }              // 3 o golpe: a lâmina morde o chão
];
/* o agrimensor (26 x 27, o meio em x 13, os pés na linha 25): by a linha do eixo debaixo da cabeça, f os três pés
   (trás, o do fundo, frente), tilt a luneta */
const AT1_AG_B = 13;
const AT1_AG = [
  { by: 11, f: [[4, 25], [13, 25], [22, 25]], tilt: 0 },                       // 0 parado
  { by: 10.5, f: [[6, 25], [11, 24], [21, 25]], tilt: 0 },                     // 1-2 andando
  { by: 10.5, f: [[4, 25], [15, 25], [19, 24]], tilt: 0 },
  { by: 14, f: [[1, 25], [13, 25], [25, 25]], tilt: -0.2, plant: 1 },          // 3 cravado
  { by: 14, f: [[1, 25], [13, 25], [25, 25]], tilt: -0.65, plant: 1 }          // 4 o tiro (a luneta sobe no coice)
];

/* ================= arte ================= */
const AT1 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
// as rampas da ficha (seção 12) e o vermelho dos avisos no mesmo espírito
const AR = {
  pedra: R6(['#12161e', '#1e2632', '#2e3a4a', '#46566a', '#6a7e94', '#a4b6c8']),
  laje: R6(['#161a20', '#262c36', '#3a4250', '#56606e', '#7c8898', '#b0bccc']),
  glifo: R6(['#0a2a30', '#145058', '#2a8a94', '#4ac8d0', '#9af0f0', '#e8ffff']),
  estelar: R6(['#14121e', '#2a2840', '#4a4870', '#7a7ab0', '#b4b8e8', '#f0f4ff']),
  chapa: R6(['#141814', '#222a24', '#344038', '#4c5a50', '#6a7c70', '#9cb0a2']),
  aviso: R6(['#2a0810', '#5a1220', '#a02232', '#ff4a5a', '#ff9aa4', '#ffe0e4'])
};
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
const setU = cv => { const o = outlined(cv); return { r: o, wr: whiteOf(o) }; };
// a placa reta: chanfro claro em cima e à esquerda, sombra embaixo e à direita, grão fino (a cidade é feita à máquina)
function slab(P, x0, y0, x1, y1, R, s, base = 2.8) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    P.put(x, y, R, base + (y === y0 ? 1.2 : 0) + (x === x0 ? 0.5 : 0) - (y === y1 && y1 > y0 ? 1 : 0) - (x === x1 && x1 > x0 ? 0.7 : 0) - (y - y0) * 0.08 + cg(x, y, s) * 0.2);
}
// a barra reta de espessura w (haste, perna, braço): o lado virado para a luz mais claro
function rod(P, x0, y0, x1, y1, w, R, base, s) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, lit = -(nx * 0.6 + ny * 0.8), h = (w - 1) / 2;
  for (let t = 0; t <= L; t += 0.5) for (let k = -h; k <= h + 0.01; k += 0.5) {
    const x = x0 + ux * t + nx * k, y = y0 + uy * t + ny * k;
    P.put(x, y, R, base + (h ? k / h : 0) * lit * 1.1 + cg(x | 0, y | 0, s) * 0.25);
  }
}
// o disco perfeito, luz de cima à esquerda; f(dx, dy, d, x, y) -> false (pula), [rampa, ajuste] ou nada
function disc(P, cx, cy, r, R, s, base = 2.8, f) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy) / r; if (d > 1) continue;
    const g = f ? f(dx, dy, d, x, y) : null; if (g === false) continue;
    P.put(x, y, g && g[0] || R, base - (dx * 0.6 + dy * 0.8) / r * 1.3 + cg(x, y, s) * 0.25 + (g ? g[1] || 0 : 0));
  }
}
// polígono cheio (par-ímpar), f(x, y) -> o tom
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) { const v = f(x, y); if (v !== null) P.put(x, y, v[0], v[1]); }
  }
}
// o braço de placas: ombro, cotovelo (a junta ciano), a mão de chapa
function braco(P, sx, sy, hx, hy, base, s) {
  const ex = (sx + hx) / 2 - 0.5, ey = (sy + hy) / 2 + 1.4;
  rod(P, sx, sy, ex, ey, 2, AR.laje, base, s); rod(P, ex, ey, hx, hy, 2, AR.laje, base + 0.3, s + 1);
  if (base > 2.4) P.put(ex, ey, AR.glifo, 3.6);
  P.put(hx, hy, AR.chapa, base + 0.8); P.put(hx + 1, hy, AR.chapa, base); P.put(hx, hy + 1, AR.chapa, base - 0.4);
}
// a alabarda: haste de laje com anéis de ferro estelar, a lâmina larga do lado n (perpendicular), a ponta e o gancho
function alabarda(P, gx, gy, a, s) {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, lit = nx * 0.6 + ny * 0.8;
  const at = (t, w) => [gx + ux * t + nx * w, gy + uy * t + ny * w];
  for (let t = -8; t <= 21; t += 0.5) for (const w of [-0.5, 0.5]) {
    const [x, y] = at(t, w), ring = ((t + 8) % 7) < 1;
    P.put(x, y, ring ? AR.estelar : AR.laje, (ring ? 3.6 : 2.7) + (w < 0 ? lit : -lit) * 0.9);
  }
  for (let t = 14.5; t <= 22; t += 0.5) {
    const wm = 1.5 + (t - 14.5) / 7.5 * 4;
    for (let w = 1; w <= wm; w += 0.5) {
      const [x, y] = at(t, w), edge = w > wm - 0.9 || t > 21.6;
      P.put(x, y, AR.estelar, edge ? 5 : 2.8 - (w / wm) * 0.4 + (t - 14.5) * 0.08 + (w === 1 ? -0.6 : 0) + cg(x | 0, y | 0, s) * 0.3);
    }
  }
  for (let t = 20; t <= 27; t += 0.5) { const w = (27 - t) / 7 * 1.1; for (let k = -w; k <= w + 0.01; k += 0.5) { const [x, y] = at(t, k); P.put(x, y, AR.estelar, t > 25.5 ? 5 : 3.8 + (k < 0 ? lit : -lit) * 0.8); } }
  for (let t = 16.5; t <= 19.5; t += 0.5) for (let w = -1; w >= -1 - (19.5 - t) * 0.9; w -= 0.5) { const [x, y] = at(t, w); P.put(x, y, AR.estelar, 2.6); }
  const [g1, g2] = at(18.6, 3.2); P.put(g1, g2, AR.glifo, 4.8); const [g3, g4] = at(17.6, 2.4); P.put(g3, g4, AR.glifo, 3.4);
  const [b1, b2] = at(-8, 0); P.put(b1, b2, AR.estelar, 4.2);
}

/* ---------- o Custódio ---------- */
function custodio(k) {
  const o = AT1_CU[k], P = cp(52, 58), s = 29301 + k * 7, B = AT1_CU_B, Y0 = AT1_CU_Y0, low = o.low || 0;
  const ox = r => r < 13 ? Math.round(o.lean * (13 - r) / 13) : 0, oy = r => r < 15 ? low : 0;
  const sl = (x0, r0, x1, r1, R, ss, base) => slab(P, B + x0 + ox(r0), Y0 + r0 + oy(r0), B + x1 + ox(r0), Y0 + r1 + oy(r0), R, ss, base);
  const G = [B + o.hn[0], Y0 + o.hn[1]], ua = [Math.cos(o.a), Math.sin(o.a)];
  const BH = o.two ? [G[0] - ua[0] * 5, G[1] - ua[1] * 5] : [B + o.bh[0], Y0 + o.bh[1]];
  // o braço e a ombreira de trás, na sombra
  braco(P, B - 3 + ox(7), Y0 + 7 + oy(7), BH[0], BH[1], 1.6, s + 1);
  sl(-6, 5, -3, 7, AR.pedra, s + 2, 1.8);
  // as pernas: coxa de pedra, canela de laje, o pé reto, a junta do joelho
  const leg = (x0, back, lift) => {
    const d = back ? 1.2 : 0, X0 = B + x0;
    slab(P, X0, Y0 + 15 - lift, X0 + 2, Y0 + 17 - lift, AR.pedra, s + (back ? 3 : 4), 3 - d);
    slab(P, X0, Y0 + 18 - lift, X0 + 2, Y0 + 20 - lift, AR.laje, s + (back ? 5 : 6), 3.1 - d);
    slab(P, X0, Y0 + 21 - lift, X0 + 3, Y0 + 21 - lift, AR.laje, s + 7, 2.6 - d);
    P.put(X0 + 1, Y0 + 17 - lift, AR.glifo, back ? 2 : 3.4);
  };
  leg(-3 - Math.round(o.lg), true, 0);
  // o quadril de chapa; o tronco em dois degraus de pedra (o peito largo, a barriga estreita); o glifo em losango
  slab(P, B - 3, Y0 + 13 + low, B + 2, Y0 + 14, AR.chapa, s + 8, 2.6);
  sl(-3, 10, 2, 12, AR.pedra, s + 9, 2.6);
  sl(-4, 6, 3, 9, AR.pedra, s + 10, 3.2);
  for (const [x, r, v] of [[1, 7, 4], [0, 8, 3.6], [2, 8, 3], [1, 9, 3.2], [1, 8, 5]]) P.put(B + x + ox(r), Y0 + r + oy(r), AR.glifo, v);
  leg(Math.round(o.lg * 2), false, k === 1 ? 1 : 0);
  // a cabeça: o pescoço de chapa, o elmo quadrado, a aba reta em cima, a fenda do visor e o olho
  P.put(B - 1 + ox(5), Y0 + 5 + oy(5), AR.chapa, 1.4); P.put(B + ox(5), Y0 + 5 + oy(5), AR.chapa, 1.8);
  sl(-3, 0, 2, 4, AR.laje, s + 11, 3.2);
  for (let x = -4; x <= 4; x++) P.put(B + x + ox(-1), Y0 - 1 + oy(-1), AR.laje, x < -2 ? 4.9 : 4.4 - (x + 4) * 0.18);
  for (let x = -3; x <= 2; x++) P.put(B + x + ox(0), Y0 + oy(0), AR.laje, 1.6);   // a sombra da aba
  for (let x = 0; x <= 2; x++) P.put(B + x + ox(2), Y0 + 2 + oy(2), AR.glifo, x === 1 ? 4.6 : x === 2 ? 2.6 : 0.6);
  // a alabarda, o braço da frente por cima e a ombreira da frente
  alabarda(P, G[0], G[1], o.a, s + 12);
  braco(P, B + 3 + ox(7), Y0 + 7 + oy(7), G[0], G[1], 3.2, s + 13);
  sl(1, 5, 4, 7, AR.pedra, s + 14, 3.5);
  return setO(P.done());
}

/* ---------- o Olho-Vigia, 20 x 20: as quatro aletas, o anel de pedra com entalhes, o vidro, a íris (vermelha na mira) ---------- */
function olho(aim) {
  const P = cp(20, 20), s = 29401 + aim * 3, c = 10;
  slab(P, 8, 0, 11, 2, AR.laje, s, 3.2); slab(P, 8, 17, 11, 19, AR.laje, s + 1, 2.2); slab(P, 0, 8, 2, 11, AR.laje, s + 2, 3.1); slab(P, 17, 8, 19, 11, AR.laje, s + 3, 2.2);
  for (const [x, y] of [[9, 0], [10, 0], [9, 19], [10, 19], [0, 9], [0, 10], [19, 9], [19, 10]]) P.put(x, y, AR.glifo, 3.6);
  disc(P, c, c, 8.4, AR.pedra, s + 4, 3, (dx, dy, d) => d < 0.74 ? false : [AR.pedra, (((Math.atan2(dy, dx) + 7.069) % 0.7854) < 0.2 ? -1.3 : 0) + (d > 0.93 ? -0.5 : 0)]);
  disc(P, c, c, 6.2, AR.glifo, s + 5, 1, (dx, dy, d) => d > 0.84 ? [AR.glifo, -0.9] : d > 0.38 ? [aim ? AR.aviso : AR.glifo, 2.4 - d * 0.8] : [AR.glifo, -1.4]);
  P.put(7, 7, AR.glifo, 5); P.put(8, 7, AR.glifo, 4.2); P.put(7, 8, AR.glifo, 4.2);
  return setU(P.done());
}

/* ---------- o Agrimensor, 26 x 27 ---------- */
function agrimensor(k) {
  const o = AT1_AG[k], P = cp(26, 27), s = 29501 + k * 7, B = AT1_AG_B, hy = o.by;
  const perna = (f, base, w, ss) => {
    const hx = B, hY = hy + 1.5, mx = (hx + f[0]) / 2, my = (hY + f[1]) / 2, out = Math.sign(f[0] - hx) * 1.6;
    rod(P, hx, hY, mx + out, my - 1, w, AR.estelar, base, ss); rod(P, mx + out, my - 1, f[0], f[1] - 1, w, AR.laje, base, ss + 1);
    P.put(mx + out, my - 1, AR.glifo, base > 2 ? 3.6 : 2.4);
    P.put(f[0], f[1], AR.estelar, base + 1.2); if (o.plant) P.put(f[0], f[1] + 1, AR.estelar, base);
  };
  perna(o.f[1], 1.6, 1.5, s);
  // o eixo: o disco graduado; o prumo pendurado embaixo
  disc(P, B, hy + 0.6, 2.4, AR.estelar, s + 2, 3, (dx, dy, d, x) => d > 0.7 && x % 2 ? [AR.estelar, 1.2] : null);
  for (let y = hy + 3; y <= hy + 6; y++) P.put(B, y, AR.laje, 3.6);
  for (const [x, y, v] of [[0, 7, 4.8], [-1, 8, 3.6], [0, 8, 4], [1, 8, 2.6], [0, 9, 2.8]]) P.put(B + x, hy + y, AR.estelar, v);
  perna(o.f[0], 2.6, 2, s + 3); perna(o.f[2], 2.8, 2, s + 4);
  // a cabeça: a caixa de laje, o nível de bolha em cima, a luneta de chapa e a lente
  slab(P, B - 5, hy - 6, B + 4, hy - 1, AR.laje, s + 5, 3);
  for (let x = B - 5; x <= B + 4; x++) P.put(x, hy - 3, AR.laje, 2.2);
  slab(P, B - 2, hy - 7, B + 1, hy - 7, AR.chapa, s + 6, 3); P.put(B - 1, hy - 7, AR.glifo, 4.4); P.put(B, hy - 7, AR.glifo, 3.4);
  const ca = Math.cos(o.tilt), sa = Math.sin(o.tilt), lx = B + 4.5, ly = hy - 4;
  for (let t = 0; t <= 6; t += 0.5) for (const w of [-0.5, 0.5]) P.put(lx + ca * t - sa * w, ly + sa * t + ca * w, AR.chapa, (t > 5 ? 4 : 2.8) + (w < 0 ? 0.8 : -0.4));
  disc(P, B + 2.5, hy - 3.6, 1.7, AR.glifo, s + 7, 3.4);
  P.put(B - 4, hy - 5, AR.glifo, 3); P.put(B - 3, hy - 5, AR.glifo, 2.4);   // a escala gravada
  return setO(P.done());
}

/* ---------- a tessela: o triângulo (7 x 7) girado; kind 0 laje com o fio ciano no lado da luz, 1 acesa, 2 vermelha ---------- */
function tessela(ang, kind) {
  const P = cp(7, 7), c = 3.5, r = 3.1, s = 29601;
  const pts = [0, 1, 2].map(i => [c + Math.cos(ang + i * 2.0944) * r, c + Math.sin(ang + i * 2.0944) * r]);
  const R = kind === 1 ? AR.glifo : kind === 2 ? AR.aviso : AR.laje;
  poly(P, pts, R, (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    let edge = null, best = 9;
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 3], L = Math.hypot(bx - ax, by - ay), nx = (by - ay) / L, ny = -(bx - ax) / L, d = Math.abs((px - ax) * nx + (py - ay) * ny);
      if (d < best) { best = d; const mx = (ax + bx) / 2 - c, my = (ay + by) / 2 - c; edge = -(mx * 0.6 + my * 0.8) > 0; }
    }
    if (best < 0.85) return kind ? [R, edge ? 5 : 3.6] : [edge ? AR.glifo : AR.laje, edge ? 3.8 : 1.4];
    return [R, (kind ? 3.6 : 3) - ((px - c) * 0.6 + (py - c) * 0.8) * 0.35 + cg(x, y, s) * 0.3];
  });
  return setU(P.done());
}

/* ---------- o Ponteiro: a barra no ângulo k/32 de meia volta (é simétrica), 46 x 46 com o meio no centro ---------- */
function ponteiro(k) {
  const a = k / 32 * Math.PI, N = 46, P = cp(N, N), c = N / 2, s = 29701, L = AT1_PT_L;
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, lit = -(nx * 0.6 + ny * 0.8);
  for (let t = -L / 2 + 2; t <= L / 2 - 2; t += 0.5) for (let w = -1.5; w <= 1.5; w += 0.5) {
    const x = c + ux * t + nx * w, y = c + uy * t + ny * w, rim = Math.abs(w) > 1.2, tick = Math.abs(w) < 0.3 && Math.round(t * 2) % 8 === 0;
    if (tick) P.put(x, y, AR.glifo, 3.6);
    else P.put(x, y, AR.estelar, rim ? (w * lit > 0 ? 4.6 : 1.3) : 2.9 + (w / 1.5) * lit * 1.2 + cg(x | 0, y | 0, s) * 0.25);
  }
  for (const t of [-1, 0, 1]) for (const w of [-1, 0, 1]) if (Math.abs(t) + Math.abs(w) < 2) P.put(c + ux * t + nx * w, c + uy * t + ny * w, AR.glifo, t || w ? 3.6 : 5);
  for (const e of [-1, 1]) disc(P, c + ux * e * L / 2, c + uy * e * L / 2, 3.4, AR.estelar, s + 2 + e, 3, (dx, dy, d) => d < 0.45 ? [AR.glifo, 1.6] : d > 0.8 ? [AR.laje, 0.4] : null);
  return setU(P.done());
}

AT1.get = () => AT1.ready || (AT1.ready = {
  cu: AT1_CU.map((_, k) => custodio(k)),
  ol: [olho(0), olho(1)],
  ag: AT1_AG.map((_, k) => agrimensor(k)),
  ts: [0, 1, 2].map(kind => Array.from({ length: 12 }, (_, i) => tessela(i / 12 * 2.0944, kind))),
  pt: Array.from({ length: 32 }, (_, k) => ponteiro(k))
});
AT1.GL = {
  ciano: glow(4, '#4ac8d0'), cianoG: glow(10, '#4ac8d0'), cianoM: glow(16, '#4ac8d0'), branco: glow(8, '#f0f4ff'), brancoG: glow(14, '#e8f0ff'),
  aviso: glow(5, '#ff4a5a'), avisoG: glow(10, '#ff4a5a'), violeta: glow(6, '#b4b8e8'), violetaG: glow(12, '#b4b8e8')
};
}

/* ================= desenho ================= */
// a figura com o apoio (ax, ay) no meio dos pés quando olha para a direita
function at1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const at1Jit = (e, on) => on ? (Math.floor(e.t * 30) % 2 ? 1 : 0) : 0;

const at1CuPose = e => e.state === 'mark' ? 2 : e.state === 'chop' || e.state === 'recover' ? 3 : e.state === 'step' ? 1 : 0;
// o olho do custódio na tela (o quadro tem o meio em x 16 e os pés na linha 53)
function at1CuOlho(e, fx, fy) { const o = AT1_CU[at1CuPose(e)], lx = 1.5 + Math.round(o.lean * 11 / 13); return [fx + lx * e.facing, fy - 19.5 + (o.low || 0)]; }
DRAW_E.custodio = (e, fx, fy, fl) => at1Blit(cvPick(AT1.get().cu[at1CuPose(e)], e, fl), e, fx, fy, AT1_CU_B + 1, AT1_CU_Y0 + 23, at1Jit(e, e.state === 'mark' && e.stateT > AT1_GRADE - 0.2));
EYES_E.custodio = (e, fx, fy) => {
  const G = AT1.GL, [x, y] = at1CuOlho(e, fx, fy), hot = e.state === 'mark' || e.state === 'chop';
  lc.globalAlpha = hot ? 0.75 : 0.4; lc.drawImage(hot ? G.cianoG : G.ciano, Math.round(x) - (hot ? 10 : 4), Math.round(y) - (hot ? 10 : 4));
  const o = AT1_CU[at1CuPose(e)]; lc.globalAlpha = 0.22; lc.drawImage(G.ciano, Math.round(fx + (1.5 + Math.round(o.lean * 5 / 13)) * e.facing) - 4, Math.round(fy - 13 + (o.low || 0)) - 4);   // o glifo do peito
};
WARN_E.custodio = e => e.state === 'mark';

// o olho: sem balanço nenhum (só linhas retas)
DRAW_E.olhovigia = (e, fx, fy, fl) => { const S = AT1.get().ol[e.state === 'aim' ? 1 : 0], img = fl ? S.wr : S.r; lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - e.h / 2 - img.height / 2)); };
EYES_E.olhovigia = (e, fx, fy) => {
  const G = AT1.GL, y = Math.round(fy - e.h / 2), aim = e.state === 'aim';
  lc.globalAlpha = aim ? 0.55 + 0.35 * clamp(1 - e.stateT / AT1_MIRA, 0, 1) : 0.4; lc.drawImage(aim ? G.avisoG : G.cianoG, fx - 10, y - 10);
};
WARN_E.olhovigia = e => e.state === 'aim';

const at1AgPose = e => e.state === 'recoil' ? 4 : e.state === 'plant' || e.state === 'measure' || e.state === 'unplant' ? 3 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 6) % 2 : 0;
// a lente (de onde sai a linha de cima e o tiro) e o pé da frente, em pixels do mundo
function at1AgPts(e) {
  const o = AT1_AG[at1AgPose(e)], cx = e.x + e.w / 2, fy = e.y + e.h - 1, f = e.facing;
  return { lx: cx + (4.5 + Math.cos(o.tilt) * 6) * f, ly: fy - (25 - (o.by - 4 + Math.sin(o.tilt) * 6)), fx: cx + (o.f[2][0] - AT1_AG_B) * f, fy: fy - 1 };
}
DRAW_E.agrimensor = (e, fx, fy, fl) => at1Blit(cvPick(AT1.get().ag[at1AgPose(e)], e, fl), e, fx, fy, AT1_AG_B + 1, 27, at1Jit(e, e.state === 'plant'));
EYES_E.agrimensor = (e, fx, fy) => {
  const G = AT1.GL, o = AT1_AG[at1AgPose(e)], x = Math.round(fx + 3 * e.facing), y = Math.round(fy - 1 - (25 - (o.by - 3.6))), hot = e.state === 'measure';
  lc.globalAlpha = hot ? 0.7 : 0.35; lc.drawImage(hot ? G.avisoG : G.ciano, x - (hot ? 10 : 4), y - (hot ? 10 : 4));
  lc.globalAlpha = 0.25; lc.drawImage(G.ciano, Math.round(fx - 0.5 * e.facing) - 4, Math.round(fy - 1 - (25 - (o.by - 7))) - 4);   // o nível de bolha
};
WARN_E.agrimensor = e => e.state === 'measure';

// as tesselas: cada ladrilho no mundo (os acesos de novo por cima do escuro, no drawTop)
DRAW_E.tesselas = (e, fx, fy, fl) => {
  const TS = AT1.get().ts[0], ox = fx - (e.x + e.w / 2), oy = fy - (e.y + e.h);
  for (const p of e.tiles) { const S = TS[p.k % 12], img = fl ? S.wr : S.r; lc.drawImage(img, Math.round(p.x + ox) - 4, Math.round(p.y + oy) - 4); }
};
EYES_E.tesselas = (e, fx, fy) => {
  const G = AT1.GL, ring = e.state === 'gather' || e.state === 'lock' || e.state === 'close';
  lc.globalAlpha = ring ? 0.15 : 0.3; lc.drawImage(G.cianoG, fx - 10, Math.round(fy - e.h / 2) - 10);
};
WARN_E.tesselas = e => e.state === 'gather' || e.state === 'lock';

// o ponteiro: a barra pelo meio (e.x + e.w / 2 é o meio dela)
const at1PtK = th => Math.round((((th % Math.PI) + Math.PI) % Math.PI) / Math.PI * 32) % 32;
DRAW_E.ponteiro = (e, fx, fy, fl) => { const S = AT1.get().pt[at1PtK(e.th)], img = fl ? S.wr : S.r; lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - e.h / 2 - img.height / 2)); };
EYES_E.ponteiro = (e, fx, fy) => {
  const G = AT1.GL, mx = fx, my = fy - e.h / 2, ux = Math.cos(e.th), uy = Math.sin(e.th), h = AT1_PT_L / 2, hot = e.state === 'arc' || e.state === 'sweep';
  lc.globalAlpha = 0.6; lc.drawImage(G.cianoG, Math.round(mx - ux * h) - 10, Math.round(my - uy * h) - 10);   // o eixo onde ele gira
  lc.globalAlpha = hot ? 0.8 : 0.3; lc.drawImage(hot ? G.avisoG : G.ciano, Math.round(mx + ux * h) - (hot ? 10 : 4), Math.round(my + uy * h) - (hot ? 10 : 4));
  lc.globalAlpha = 0.25; lc.drawImage(G.ciano, Math.round(mx) - 4, Math.round(my) - 4);
};
WARN_E.ponteiro = e => e.state === 'arc';

/* ================= comportamento ================= */
const at1Raios = [], at1Tiros = [], at1Estouros = [], at1Cacos = [], at1Fx = [], at1FxGl = {};
const at1Near = (e, r = 240) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const at1Live = e => e && !e.dead && enemies.includes(e);
const at1Vedado = (px, py) => atNoGo(Math.floor(px / T), Math.floor(py / T));
const AT1_FAISCA = ['#ffffff', '#e8f0ff', '#9af0f0'], AT1_PO = ['#6a7e94', '#a4b6c8', '#46566a'], AT1_VERM = ['#ff4a5a', '#ffb0b8', '#ffffff'];
function at1P(o) { if (at1Fx.length < 400) at1Fx.push(o); }
function at1Sparks(x, y, n, cols, sp = 50, g = 0, life = 0.4) {
  if (at1Fx.length > 380) return;
  for (let i = 0; i < n; i++) at1P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[(Math.random() * cols.length) | 0] });
}
// um caco que cai: 'ts' uma tessela (k o giro), 'pl' uma lasquinha de placa (col)
function at1Caco(x, y, vx, vy, kind, k, col, life = 1.4) { if (at1Cacos.length < 220) at1Cacos.push({ x, y, vx, vy, kind, k, col, life, max: life, bounce: 0, va: rnd(-12, 12) }); }
function at1Lascas(x, y, n, sp = 70) { for (let i = 0; i < n; i++) at1Caco(x + rnd(-3, 3), y + rnd(-4, 4), rnd(-sp, sp), rnd(-sp * 1.6, -10), 'pl', 0, AT1_PO[(Math.random() * 3) | 0], rnd(0.8, 1.4)); }
const at1HeroIn = (x, y, m = 2) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;

/* ---------- o Custódio: passos de 1 bloco, a grade e a alabarda ---------- */
// dá para dar um passo para dir? 0 não, 1 sim (plano, degrau de 1 bloco ou queda curta), 2 sim pulando um degrau de 2
function at1CuPode(e, dir, aggro, dy) {
  const fr = Math.floor((e.y + e.h + 1) / T), c0 = Math.floor((e.x + e.w / 2) / T), tx = c0 + dir;
  if (atNoGo(tx, fr - 1) || atNoGo(tx, fr - 2) || atNoGo(tx, fr)) return 0;
  const s1 = solidAt(tx, fr - 1), s2 = solidAt(tx, fr - 2), s3 = solidAt(tx, fr - 3);
  if (!s1 && !s2) {
    if (solidAt(tx, fr)) return 1;
    let k = 1; while (k <= 7 && !solidAt(tx, fr + k)) k++;
    if (k <= 2) return 1;
    return aggro && dy > T && k <= 7 && !atNoGo(tx, fr + k - 1) ? 1 : 0;
  }
  if (s1 && !s2 && !s3 && !solidAt(c0, fr - 3) && !atNoGo(tx, fr - 3)) return 1;
  if (aggro && s1 && s2 && !s3 && !solidAt(tx, fr - 4) && !solidAt(c0, fr - 3) && !solidAt(c0, fr - 4) && !atNoGo(tx, fr - 3)) return 2;
  return 0;
}
AI.custodio = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'mark') {
    e.vx = 0;
    const n = Math.min(e.grid.length, Math.floor((AT1_GRADE - e.stateT) / 0.13) + 1);
    if (n > e.gridLit) { e.gridLit = n; sfx.at1Grade(Math.max(0.35, at1Near(e)), n); }
    if (e.stateT <= 0) at1Chop(e);
    return;
  }
  if (e.state === 'chop') { e.vx = 0; if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; } return; }
  if (e.state === 'recover') { e.vx = 0; if (e.stateT <= 0) { e.state = 'pause'; e.stateT = AT1_PAUSA; e.grid = null; } return; }
  if (e.state === 'step') {
    const dir = e.stepDir; e.vx = dir * AT1_PASSO_SP;
    const reached = dir > 0 ? e.x >= e.stepTo - 0.01 : e.x <= e.stepTo + 0.01;
    if (reached || e.hitWall || e.stateT <= -0.3) {
      if (Math.abs(e.x - e.stepTo) < 3 && !rectSolid(e.stepTo, e.y, e.w, e.h)) e.x = e.stepTo;
      e.vx = 0; e.state = 'pause'; e.stateT = AT1_PAUSA;
      const v = at1Near(e, 220); if (v > 0.03) sfx.at1Clique(v);
      if (e.onGround) burst(e.x + e.w / 2 + dir * 3, e.y + e.h, 2, '#6a7e94', 25, 300, 0.3);
    }
    return;
  }
  e.state = 'pause'; e.vx = 0;
  if (!e.onGround) return;   // caindo: cai reto
  if (aggro && e.atkCD <= 0 && !pl.dead) {
    const adx = Math.abs(dx);
    if (adx < 3.6 * T && adx > 3 && Math.abs(dy) < 1.6 * T && clearPath(e, pl)) { at1Mark(e, Math.sign(dx)); return; }
  }
  if (e.stateT > 0) return;
  let dir = 0;
  if (aggro) {   // chega a uma casa do herói; em cima dele, dá um passo para trás
    const adx = Math.abs(dx);
    dir = adx < T * 0.6 && Math.abs(dy) < T ? -e.facing : e.nav && e.nav.kind !== 'here' && e.nav.dir && (adx > T * 1.5 || Math.abs(dy) > T) ? e.nav.dir : adx > T * 1.5 ? Math.sign(dx) : 0;
    if (!dir) e.facing = Math.sign(dx) || e.facing;
  }
  else { cvWander(e, AT1_PASSO + AT1_PAUSA); dir = e.wander; }
  if (!dir) { e.stateT = 0.2; return; }
  const ok = at1CuPode(e, dir, aggro, dy);
  if (!ok) { if (!aggro) e.wander = -dir; e.stateT = 0.3; e.facing = aggro ? Math.sign(dx) || dir : e.facing; return; }
  const tx = Math.floor((e.x + e.w / 2) / T) + dir;
  e.state = 'step'; e.stepDir = dir; e.stepTo = tx * T + T / 2 - e.w / 2; e.stateT = AT1_PASSO; e.facing = aggro && Math.abs(dx) < T * 0.6 ? e.facing : dir;
  if (ok === 2) { e.vy = -Math.sqrt(2 * GRAV * (2 * T + 6)); e.onGround = false; }
};
// a grade: até 3 quadrados no chão à frente (para numa parede); acende um por um
function at1Mark(e, dir) {
  const fr = Math.floor((e.y + e.h + 1) / T), c0 = Math.floor((e.x + e.w / 2) / T);
  e.grid = [];
  for (let i = 1; i <= 3; i++) {
    const tx = c0 + dir * i;
    if (solidAt(tx, fr - 1) && solidAt(tx, fr - 2) || atNoGo(tx, fr - 1)) break;
    let row = fr; for (const r of [fr, fr + 1, fr - 1]) if (solidAt(tx, r) && !solidAt(tx, r - 1)) { row = r; break; }
    e.grid.push({ x: tx, y: row });
  }
  if (!e.grid.length) e.grid.push({ x: c0 + dir, y: fr });
  e.state = 'mark'; e.stateT = AT1_GRADE; e.gridLit = 0; e.facing = dir; e.vx = 0; e.chopT = -1;
  sfx.at1Ergue(Math.max(0.4, at1Near(e)));
}
function at1Chop(e) {
  e.state = 'chop'; e.stateT = 0.18; e.chopT = 0; e.atkCD = 1.5 + Math.random() * 0.6;
  let hit = false;
  for (const g of e.grid) {
    const hb = { x: g.x * T, y: (g.y - 2) * T - 2, w: T, h: 2 * T + 2 };
    if (!hit && !pl.dead && overlap(hb, pl)) { hit = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') at1Sparks(pl.x + pl.w / 2, pl.y + 8, 6, AT1_FAISCA, 70); }
    at1Sparks(g.x * T + T / 2, g.y * T - 1, 4, AT1_FAISCA, 60, 120, 0.4); burst(g.x * T + T / 2, g.y * T - 1, 4, '#6a7e94', 50, 300, 0.4);
  }
  const v = at1Near(e, 300); if (v > 0.02) { sfx.at1Alabarda(v); shake(1 + 2 * v); }
}

/* ---------- o Olho-Vigia: linhas retas, viradas em ângulo reto, a mira e o raio ---------- */
// a caixa do olho andando s (±1) no eixo ax ('h' ou 'v') bate em pedra ou no vedado logo à frente?
function at1OlBate(e, ax, s, m = 3) {
  const x = e.x + (ax === 'h' ? s * m : 0), y = e.y + (ax === 'v' ? s * m : 0);
  if (rectSolid(x, y, e.w, e.h)) return true;
  const ex = ax === 'h' ? (s > 0 ? x + e.w + 6 : x - 6) : x + e.w / 2, ey = ax === 'v' ? (s > 0 ? y + e.h + 6 : y - 6) : y + e.h / 2;
  return at1Vedado(ex, ey);
}
function at1OlPerna(e, aggro, dx) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  let ax = null, goal = 0;
  if (aggro) {
    const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, adx = Math.abs(dx);
    const wx = adx < 4.5 * T || adx > 8.5 * T ? pcx - (Math.sign(dx) || 1) * 6.5 * T : ecx, wy = pcy - 1.5 * T;
    const nx = Math.abs(wx - ecx) > 6, ny = Math.abs(wy - ecy) > 6;
    if (nx && ny) ax = e.ax === 'h' ? 'v' : 'h'; else if (nx) ax = 'h'; else if (ny) ax = 'v';
    if (!ax) { e.state = 'hold'; e.stateT = 0.35; return; }
    goal = ax === 'h' ? wx : wy;
  } else {
    const far = Math.hypot(ecx - e.homeX, ecy - e.homeY) > 7 * T;
    ax = e.ax === 'h' ? 'v' : 'h';
    goal = far ? (ax === 'h' ? e.homeX : e.homeY) : (ax === 'h' ? ecx : ecy) + (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) * (ax === 'h' ? T : T * 0.6);
  }
  const cur = ax === 'h' ? ecx : ecy;
  goal = cur + clamp(goal - cur, -7 * T, 7 * T);
  if (at1OlBate(e, ax, Math.sign(goal - cur) || 1)) {   // aquele lado está fechado: tenta o outro eixo, uns 2 blocos
    ax = ax === 'h' ? 'v' : 'h';
    const c2 = ax === 'h' ? ecx : ecy, s2 = Math.random() < 0.5 ? -1 : 1, s = at1OlBate(e, ax, s2) ? -s2 : s2;
    if (at1OlBate(e, ax, s)) { e.state = 'hold'; e.stateT = 0.5; e.ax = ax; return; }
    goal = c2 + s * 2 * T;
  }
  e.ax = ax; e.goal = goal; e.state = 'move'; e.stateT = 5;
}
AI.olhovigia = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'aim') {
    e.vx = e.vy = 0;
    if (e.stateT > AT1_MIRA_TRAVA) { e.aimX = pcx; e.aimY = pcy; }
    else if (!e.locked) { e.locked = true; sfx.at1Trava(Math.max(0.4, at1Near(e))); }
    if (e.stateT <= 0) at1Raio(e);
    return;
  }
  if (e.state === 'cool') { e.vx = e.vy = 0; if (e.stateT <= 0) { e.state = 'turn'; e.stateT = 0; } return; }
  if (e.state === 'move') {
    const sp = aggro ? 52 + e.lvl * 0.5 : 26, cur = e.ax === 'h' ? ecx : ecy, d = e.goal - cur, s = Math.sign(d);
    if (Math.abs(d) < 1.2 || at1OlBate(e, e.ax, s, 2) || e.stateT <= 0 || (e.ax === 'h' ? e.hitWall : e.hitCeil || e.onGround)) {
      e.vx = e.vy = 0; e.state = 'turn'; e.stateT = 0.24;
      const v = at1Near(e, 200); if (v > 0.05) sfx.at1Vira(v);
    } else { const vv = s * Math.min(sp, Math.abs(d) / Math.max(dt, 0.001)); if (e.ax === 'h') { e.vx = vv; e.vy = 0; } else { e.vy = vv; e.vx = 0; } }
  } else { e.vx = e.vy = 0; }
  e.facing = Math.sign(dx) || e.facing;
  if (aggro && e.atkCD <= 0 && e.sees && dist < 13 * T && !pl.dead && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'aim'; e.stateT = AT1_MIRA; e.vx = e.vy = 0; e.aimX = pcx; e.aimY = pcy; e.locked = false;
    sfx.at1Mira(Math.max(0.4, at1Near(e, 260)));
    return;
  }
  e.humT = (e.humT ?? Math.random() * 4) - dt;
  if (e.humT <= 0) { e.humT = 3 + Math.random() * 3; const v = at1Near(e, 180); if (v > 0.08) sfx.at1Zumbe(v * 0.6); }
  if (e.state !== 'move' && e.stateT <= 0) at1OlPerna(e, aggro, dx);
};
// o raio: sai pela linha travada até a pedra; acerta quem estiver no caminho (o escudo de frente segura)
function at1Raio(e) {
  const x0 = e.x + e.w / 2, y0 = e.y + e.h / 2, a = Math.atan2(e.aimY - y0, e.aimX - x0), ux = Math.cos(a), uy = Math.sin(a);
  let x = x0, y = y0, hit = false, d = 0;
  for (; d < AT1_RAIO_MAX; d += 3) {
    x = x0 + ux * d; y = y0 + uy * d;
    if (d > 6 && solidAt(Math.floor(x / T), Math.floor(y / T))) break;
    if (!hit && at1HeroIn(x, y, 2)) { hit = true; const r = hurtPlayer(e.dmg, x0, null, true); if (r === 'hit') at1Sparks(x, y, 6, AT1_FAISCA, 70); }
  }
  if (at1Raios.length < 30) at1Raios.push({ x0, y0, x1: x, y1: y, t: 0 });
  at1Sparks(x, y, 7, AT1_FAISCA, 60, 60, 0.4); burst(x, y, 3, '#6a7e94', 40, 300, 0.4);
  e.state = 'cool'; e.stateT = 0.4; e.atkCD = 2.3 + Math.random() * 0.9;
  sfx.at1Raio(Math.max(0.35, at1Near(e, 300)));
}

/* ---------- o Agrimensor: anda, se crava, mede e atira em parábola ---------- */
AI.agrimensor = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2;
  if (e.state === 'plant') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'measure'; e.stateT = AT1_MEDE; at1AgAlvo(e); sfx.at1Mede(Math.max(0.4, at1Near(e, 260))); } return; }
  if (e.state === 'measure') { e.vx = 0; if (e.stateT > AT1_MEDE_TRAVA) { at1AgAlvo(e); e.facing = Math.sign(dx) || e.facing; } if (e.stateT <= 0) at1AgTiro(e); return; }
  if (e.state === 'recoil') { e.vx = 0; if (e.stateT <= 0) { e.state = 'unplant'; e.stateT = 0.35; } return; }
  if (e.state === 'unplant') { e.vx = 0; if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0, chase = false;
  if (aggro) { const adx = Math.abs(dx); chase = adx > 9 * T || !e.sees; dir = (adx < 5 * T ? -1 : chase ? 1 : 0) * (Math.sign(dx) || 1); }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 30 + e.lvl * 0.4 : 15, 500, 250, dy, chase);
  // o vedado vale como parede: não pisa nele (o walk pode ter seguido o caminho)
  if (e.vx) { const s = Math.sign(e.vx), fx = s > 0 ? e.x + e.w + 3 : e.x - 3; if (at1Vedado(fx, e.y + e.h - 2) || at1Vedado(fx, e.y + 2) || at1Vedado(fx, e.y + e.h + 4)) { e.vx = 0; if (!aggro) e.wander = -s; } }
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  if (e.onGround && Math.abs(e.vx) > 3) { e.legT = (e.legT || 0) - dt; if (e.legT <= 0) { e.legT = 0.22; const v = at1Near(e, 200); if (v > 0.05) sfx.at1Perna(v); } }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && dist < 13 * T && Math.abs(dx) > 2 * T && !pl.dead) {
    e.state = 'plant'; e.stateT = 0.3; e.vx = 0; e.facing = Math.sign(dx) || e.facing;
    burst(e.x + e.w / 2, e.y + e.h, 6, '#6a7e94', 50, 300, 0.4); sfx.at1Crava(Math.max(0.4, at1Near(e)));
  }
};
function at1AgAlvo(e) { e.tgX = pl.x + pl.w / 2; e.tgY = pl.y + pl.h * 0.55; }
// o tiro curvo: a parábola que passa exatamente pelo cruzamento no tempo tf
function at1AgTiro(e) {
  const P = at1AgPts(e), ox = P.lx, oy = P.ly - 1, d = Math.hypot(e.tgX - ox, e.tgY - oy), tf = clamp(0.65 + d / 480, 0.7, 1.3);
  const vx = (e.tgX - ox) / tf, vy = (e.tgY - oy) / tf - 0.5 * AT1_TIRO_G * tf;
  if (at1Tiros.length < 40) at1Tiros.push({ x: ox, y: oy, vx, vy, tx: e.tgX, ty: e.tgY, t: 0, tf, dmg: e.dmg, trail: [] });
  e.state = 'recoil'; e.stateT = 0.32; e.atkCD = 2.6 + Math.random() * 0.8;
  at1Sparks(ox, oy, 5, ['#b4b8e8', '#f0f4ff'], 40); sfx.at1Tiro(Math.max(0.4, at1Near(e, 280)));
}
function at1Estoura(S, x, y) {
  if (at1Estouros.length < 40) at1Estouros.push({ x, y, t: 0 });
  at1Sparks(x, y, 10, ['#b4b8e8', '#f0f4ff', '#ffffff'], 80, 60, 0.5); burst(x, y, 6, '#6a7e94', 70, 300, 0.5);
  if (!pl.dead) {
    const nx = clamp(x, pl.x, pl.x + pl.w), ny = clamp(y, pl.y, pl.y + pl.h);
    if (Math.hypot(nx - x, ny - y) < AT1_TIRO_R) hurtPlayer(S.dmg, x, null, true);
  }
  const v = clamp(1 - Math.hypot(pl.x - x, pl.y - y) / 300, 0, 1); if (v > 0.02) { sfx.at1Impacto(v); shake(0.5 + 1.5 * v); }
}

/* ---------- o Enxame de Tesselas: formações, o anel ---------- */
function at1TsInit(e) {
  e.tiles = []; const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  for (let i = 0; i < AT1_TS_N; i++) e.tiles.push({ x: cx + rnd(-8, 8), y: cy + rnd(-8, 8), k: (Math.random() * 12) | 0, sp: Math.random() * 12 });
  e.form = 'ponto'; e.orbA = Math.random() * 6.28; e.orbS = Math.random() < 0.5 ? -1 : 1; e.ringR = 0;
}
// quantas tesselas cabem na vida que sobra (nunca menos de 5)
const at1TsQuer = e => Math.max(5, Math.ceil(AT1_TS_N * Math.max(0, e.hp) / e.maxHp));
function at1TsCai(e, n, dir = 0) {
  for (let i = 0; i < n && e.tiles.length; i++) {
    const p = e.tiles.splice((Math.random() * e.tiles.length) | 0, 1)[0];
    at1Caco(p.x, p.y, (p.x - (e.x + e.w / 2)) * 3 + dir * 50 + rnd(-30, 30), rnd(-110, -30), 'ts', p.k, null, rnd(1.1, 1.7));
  }
}
AI.tesselas = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'gather' || e.state === 'lock' || e.state === 'close') {
    if (e.state === 'gather') {
      const k = Math.min(1, dt * 9); e.rcx = lerp(e.rcx, pcx, k); e.rcy = lerp(e.rcy, pcy, k);
      if (e.stateT <= 0) { e.state = 'lock'; e.stateT = AT1_TS_TRAVA; sfx.at1Trava(Math.max(0.4, at1Near(e)), 0.8); }
    } else if (e.state === 'lock') {
      if (e.stateT <= 0) { e.state = 'close'; e.stateT = AT1_TS_FECHA; e.swingHit = false; sfx.at1Fecha(Math.max(0.4, at1Near(e))); }
    } else {
      e.ringR = e.ringR0 * Math.max(0.08, e.stateT / AT1_TS_FECHA);
      const d = Math.hypot(pcx - e.rcx, pcy - e.rcy);
      if (!e.swingHit && !pl.dead && d < e.ringR0 + 2 && e.ringR <= d + 6) {
        // vem de todo lado: o escudo não segura (o golpe chega por trás dele)
        e.swingHit = true; const frac = e.tiles.length / AT1_TS_N;
        const r = hurtPlayer(Math.max(1, Math.round(e.dmg * (0.5 + 0.5 * frac))), pcx - pl.facing * 12, null, true);
        if (r === 'hit') at1Sparks(pcx, pcy, 8, AT1_VERM, 70);
      }
      if (e.stateT <= 0) { e.state = 'scatter'; e.stateT = 0.5; e.atkCD = 2.6 + Math.random() * 1; e.form = 'ponto'; }
    }
    // o corpo do enxame fica no meio do anel
    e.vx = clamp((e.rcx - ecx) * 6, -170, 170); e.vy = clamp((e.rcy - ecy) * 6, -170, 170);
    if (at1Vedado(ecx + e.vx * 0.1, ecy + e.vy * 0.1)) e.vx = e.vy = 0;
    return;
  }
  if (e.state !== 'scatter' || e.stateT <= 0) e.state = 'fly';
  let tx, ty, sp;
  if (aggro) {
    if (dist > 8 * T || !e.sees) { tx = pcx; ty = pcy - T; sp = 72; e.form = 'linha'; }
    else { e.orbA += dt * 0.75 * e.orbS; tx = pcx + Math.cos(e.orbA) * 4.5 * T; ty = pcy - T * 0.5 + Math.sin(e.orbA) * 3 * T; sp = 64; e.form = 'ponto'; }
  } else { const a = e.t * 0.4 * e.orbS; tx = e.homeX + Math.cos(a) * 3 * T; ty = e.homeY + Math.sin(a) * 1.5 * T; sp = 24; e.form = Math.floor(e.t / 5 + e.seed) % 2 ? 'linha' : 'ponto'; }
  const k = Math.min(1, dt * 3);
  e.vx = lerp(e.vx, clamp((tx - ecx) * 2, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 2, -sp, sp), k);
  if (e.hitWall) { e.vx *= -0.5; e.orbS *= -1; } if (e.hitCeil || e.onGround) e.vy *= -0.5;
  if (at1Vedado(ecx + Math.sign(e.vx) * 12, ecy) ) e.vx = -e.vx * 0.5; if (at1Vedado(ecx, ecy + Math.sign(e.vy) * 12)) e.vy = -e.vy * 0.5;
  e.facing = Math.sign(dx) || e.facing;
  e.chimeT = (e.chimeT ?? Math.random() * 3) - dt;
  if (e.chimeT <= 0) { e.chimeT = 2.5 + Math.random() * 3; const v = at1Near(e, 180); if (v > 0.08) sfx.at1Tessela(v * 0.6); }
  if (aggro && e.atkCD <= 0 && e.sees && dist < 7 * T && !pl.dead && e.state === 'fly' && !at1Vedado(pcx, pcy)) {
    const frac = e.tiles.length / AT1_TS_N;
    e.state = 'gather'; e.stateT = AT1_TS_JUNTA; e.rcx = pcx; e.rcy = pcy; e.ringR0 = e.ringR = (2 + 2.2 * frac) * T; e.form = 'anel';
    sfx.at1Anel(Math.max(0.4, at1Near(e)));
  }
};
// o ponto: anéis concêntricos (1, 6, 12, 18 lugares), cada anel girando para um lado; [anel, ângulo]
// o último anel reparte igual as que sobram; feito uma vez para cada quantidade
const AT1_TS_HEX = [];
function at1TsHex(n) {
  if (AT1_TS_HEX[n]) return AT1_TS_HEX[n];
  const out = [[0, 0]];
  for (let r = 1; out.length < n; r++) { const m = Math.min(6 * r, n - out.length); for (let j = 0; j < m; j++) out.push([r, (j + (r % 2) * 0.5) / m * 6.2832]); }
  return (AT1_TS_HEX[n] = out);
}
// a cada quadro: cada tessela vai para o seu lugar na formação (espiral, linha reta no eixo da viagem, anel)
function at1TsTick(e, dt) {
  const n = e.tiles.length; if (!n) return;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, ring = e.form === 'anel', k = 1 - Math.exp(-dt * (ring ? 14 : 8));
  const hex = at1TsHex(n), hz = Math.abs(e.vx) >= Math.abs(e.vy), ux = hz ? Math.sign(e.vx) || 1 : 0, uy = hz ? 0 : Math.sign(e.vy) || 1;
  for (let i = 0; i < n; i++) {
    const p = e.tiles[i]; let gx, gy;
    if (ring) { const a = i / n * 6.2832 + e.t * 1.4; gx = e.rcx + Math.cos(a) * e.ringR; gy = e.rcy + Math.sin(a) * e.ringR; p.k = Math.round((a + 1.5708) / 2.0944 * 12) % 12; }
    else if (e.form === 'linha') { const o = (i - (n - 1) / 2) * 3.4; gx = cx - ux * o; gy = cy - uy * o; p.sp += dt * 6; p.k = Math.floor(p.sp) % 12; }
    else { const S = hex[i], a = S[1] + e.t * 0.9 * (S[0] % 2 ? -1 : 1) * (e.orbS || 1); gx = cx + Math.cos(a) * S[0] * 4.2; gy = cy + Math.sin(a) * S[0] * 4.2; p.k = (Math.round(a / 2.0944 * 12) % 12 + 12) % 12; }
    p.x += (gx - p.x) * k; p.y += (gy - p.y) * k;
  }
}

/* ---------- o Ponteiro: meia volta em volta de uma ponta, o arco de aviso, a varredura ---------- */
// as duas pontas: o eixo (pX, pY) e a outra
const at1PtOutra = e => [e.pX + Math.cos(e.th) * AT1_PT_L, e.pY + Math.sin(e.th) * AT1_PT_L];
// põe a caixa no meio da barra
function at1PtCaixa(e) { const ux = Math.cos(e.th), uy = Math.sin(e.th); e.x = e.pX + ux * AT1_PT_L / 2 - e.w / 2; e.y = e.pY + uy * AT1_PT_L / 2 - e.h / 2; }
function at1PtInit(e) {
  const cx = e.x + e.w / 2; let r = Math.floor((e.y + e.h) / T), found = false;
  for (let k = 0; k < 14; k++, r++) if (solidAt(Math.floor(cx / T), r) && !solidAt(Math.floor(cx / T), r - 1)) { found = true; break; }
  e.pY = found ? r * T : e.y + e.h; e.pX = cx - AT1_PT_L / 2; e.th = 0; e.pVy = 0;
  const [ox, oy] = at1PtOutra(e);
  if (solidAt(Math.floor(ox / T), Math.floor((oy - 2) / T))) { e.pX = cx + AT1_PT_L / 2; e.th = Math.PI; }
  e.state = 'rest'; e.stateT = 0.4; at1PtCaixa(e);
}
// prepara a meia volta em volta da ponta que fica do lado dir (ou a ponta piv dada): onde a outra ponta pousa,
// se o arco está livre. Devolve { pX, pY, th0, th1 } ou null
function at1PtGiro(e, dir, piv) {
  const A = [e.pX, e.pY], Bq = at1PtOutra(e), N = piv || (Math.sign(Bq[0] - A[0]) === dir ? Bq : A), O = N === A ? Bq : A, L = AT1_PT_L;
  const row = Math.round(N[1] / T);
  let land = null;
  for (const dr of [0, -1, 1, -2, 2]) {
    const ry = row + dr, dyL = ry * T - N[1]; if (Math.abs(dyL) >= L - 4) continue;
    const lx = N[0] + dir * Math.sqrt(L * L - dyL * dyL), col = Math.floor(lx / T);
    if (solidAt(col, ry) && !solidAt(col, ry - 1) && !atNoGo(col, ry - 1)) { land = [lx, ry * T]; break; }
  }
  if (!land) return null;
  let th0 = Math.atan2(O[1] - N[1], O[0] - N[0]), th1 = Math.atan2(land[1] - N[1], land[0] - N[0]);
  // sempre por cima: para a direita sobe de ~π a ~2π, para a esquerda desce de ~0 a ~-π
  if (dir > 0) { th0 = ((th0 % 6.2832) + 6.2832) % 6.2832; if (th0 < 1.5708) th0 += 6.2832; th1 = ((th1 % 6.2832) + 6.2832) % 6.2832; if (th1 < 3.1416) th1 += 6.2832; }
  else { th0 = Math.atan2(Math.sin(th0), Math.cos(th0)); if (th0 > 1.5708) th0 -= 6.2832; th1 = Math.atan2(Math.sin(th1), Math.cos(th1)); if (th1 > -1.5708) th1 -= 6.2832; }
  if (Math.abs(th1 - th0) > 4.4 || Math.abs(th1 - th0) < 0.6) return null;
  // o arco livre de pedra e do vedado (os pontos rentes ao chão não contam)
  for (let i = 1; i < 12; i++) {
    const a = th0 + (th1 - th0) * i / 12;
    for (const rr of [L * 0.35, L * 0.7, L - 1]) {
      const x = N[0] + Math.cos(a) * rr, y = N[1] + Math.sin(a) * rr; if (y > N[1] - 3) continue;
      const tx = Math.floor(x / T), ty = Math.floor(y / T); if (solidAt(tx, ty) || atNoGo(tx, ty)) return null;
    }
  }
  return { pX: N[0], pY: N[1], th0, th1 };
}
AI.ponteiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = e.vy = 0; e.stun = 0;
  if (e.state === 'flip' || e.state === 'sweep') {
    e.fT += dt; const p = Math.min(1, e.fT / e.fDur), q = e.state === 'sweep' ? p * p : (1 - Math.cos(p * Math.PI)) / 2, prev = e.th;
    e.th = e.th0 + (e.th1 - e.th0) * q;
    if (e.state === 'sweep' && !e.swingHit && !pl.dead) {   // a barra varrendo (três ângulos entre o quadro de antes e este)
      for (let j = 1; j <= 3 && !e.swingHit; j++) {
        const a = prev + (e.th - prev) * j / 3, ux = Math.cos(a), uy = Math.sin(a);
        for (let r = 6; r <= AT1_PT_L + 2 && !e.swingHit; r += 4) if (at1HeroIn(e.pX + ux * r, e.pY + uy * r, 3)) {
          e.swingHit = true; const res = hurtPlayer(e.dmg, e.pX, e, false);
          if (res === 'hit') { at1Sparks(pl.x + pl.w / 2, pl.y + 8, 6, AT1_FAISCA, 70); pl.vx = (pl.x + pl.w / 2 > e.pX ? 1 : -1) * 200; }
        }
      }
    }
    if (p >= 1) {
      e.th = e.th1; const sweep = e.state === 'sweep';
      e.state = 'rest'; e.stateT = sweep ? 0.6 : 0.35; if (sweep) e.atkCD = 1.7 + Math.random() * 0.6;
      const [ox, oy] = at1PtOutra(e); burst(ox, oy, sweep ? 6 : 3, '#6a7e94', 40, 300, 0.35); at1Sparks(ox, oy - 1, sweep ? 5 : 2, AT1_FAISCA, 40, 100, 0.3);
      const v = at1Near(e, 240); if (v > 0.03) sfx.at1Pousa(v, sweep);
    }
    at1PtCaixa(e); return;
  }
  if (e.state === 'arc') { if (e.stateT <= 0) { e.state = 'sweep'; e.fT = 0; e.fDur = AT1_PT_VARRE; e.swingHit = false; sfx.at1Varre(Math.max(0.4, at1Near(e))); } at1PtCaixa(e); return; }
  // sem chão debaixo de nenhuma ponta: cai reto
  const [ox, oy] = at1PtOutra(e), sup = (x, y) => solidAt(Math.floor(x / T), Math.floor((y + 1) / T));
  if (!sup(e.pX, e.pY)) {
    if (sup(ox, oy) && Math.abs(oy - e.pY) < 4) { e.pX = ox; e.pY = oy; e.th += Math.PI; }
    else {
      e.state = 'fall'; e.pVy = Math.min((e.pVy || 0) + GRAV * dt, MAXFALL);
      const ny = e.pY + e.pVy * dt, r = Math.floor(ny / T);
      if (solidAt(Math.floor(e.pX / T), r) || solidAt(Math.floor(ox / T), r)) { e.pY = r * T; e.pVy = 0; e.state = 'rest'; e.stateT = 0.3; e.th = Math.cos(e.th) > 0 ? 0 : Math.PI; const v = at1Near(e, 240); if (v > 0.03) sfx.at1Pousa(v, true); }
      else e.pY = ny;
      at1PtCaixa(e); return;
    }
  }
  e.state = 'rest'; e.pVy = 0;
  if (aggro && e.atkCD <= 0 && !pl.dead && (e.sees || dist < 3 * T)) {
    const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, [bx, by] = at1PtOutra(e);
    const dA = Math.hypot(pcx - e.pX, pcy - e.pY), dB = Math.hypot(pcx - bx, pcy - by), N = dA <= dB ? [e.pX, e.pY] : [bx, by], O = dA <= dB ? [bx, by] : [e.pX, e.pY], d = Math.min(dA, dB);
    if (d < AT1_PT_L + 5 && pcy < N[1] + 6 && pcy > N[1] - AT1_PT_L - 6) {
      const g = at1PtGiro(e, Math.sign(N[0] - O[0]) || 1, N);
      if (g) { Object.assign(e, g); e.th = g.th0; e.state = 'arc'; e.stateT = AT1_ARCO; sfx.at1Arco(Math.max(0.4, at1Near(e))); at1PtCaixa(e); return; }
    }
  }
  if (e.stateT > 0) { at1PtCaixa(e); return; }
  let dir = 0;
  if (aggro) dir = Math.abs(dx) > T ? Math.sign(dx) : 0; else { cvWander(e, AT1_PT_GIRO + 0.35); dir = e.wander; }
  if (dir) {
    const g = at1PtGiro(e, dir);
    if (g) { Object.assign(e, g); e.th = g.th0; e.state = 'flip'; e.fT = 0; e.fDur = AT1_PT_GIRO * (aggro ? 0.85 : 1.2); const v = at1Near(e, 220); if (v > 0.05) sfx.at1Gira(v); }
    else { if (!aggro) e.wander = -dir; e.stateT = 0.4; }
  } else e.stateT = 0.3;
  at1PtCaixa(e);
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (!e || !AT1_TYPES.includes(e.type)) return r;
  if (e.hp < hp0) { at1Sparks(e.x + e.w / 2, e.y + e.h / 2, 6, AT1_FAISCA, 70, 60, 0.35); sfx.at1Golpe(0.8); }
  if (e.dead) return r;
  if (e.type === 'custodio') e.stun = Math.min(e.stun, e.state === 'mark' || e.state === 'chop' ? 0 : 0.12);
  else if (e.type === 'olhovigia') { e.vy = 0; e.vx = (dir || 1) * 25; if (e.state === 'aim' && e.stun > 0) { e.state = 'cool'; e.stateT = 0.3; e.atkCD = Math.max(e.atkCD, 1); } }   // o golpe corta a mira
  else if (e.type === 'agrimensor') e.stun = Math.min(e.stun, e.state === 'plant' || e.state === 'measure' || e.state === 'recoil' ? 0 : 0.2);
  else if (e.type === 'tesselas') { e.stun = Math.min(e.stun, 0.15); const sobra = e.tiles.length - at1TsQuer(e); if (sobra > 0) { at1TsCai(e, sobra, dir); sfx.at1Cai(0.7); } if (e.state === 'gather' || e.state === 'lock') e.ringR0 = e.ringR = Math.min(e.ringR0, (2 + 2.2 * e.tiles.length / AT1_TS_N) * T); }
  else if (e.type === 'ponteiro') { e.stun = 0; e.vx = e.vy = 0; at1PtCaixa(e); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!AT1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, at1Near(e, 260));
  at1Sparks(cx, cy, 10, AT1_FAISCA, 70, 40, 0.6);
  if (e.type === 'custodio') { at1Lascas(cx, cy, 12, 80); burst(cx, e.y + e.h, 14, '#46566a', 70, 300, 0.7); }
  else if (e.type === 'olhovigia') { at1Lascas(cx, cy, 8, 90); at1Estouros.push({ x: cx, y: cy, t: 0, glass: 1 }); }
  else if (e.type === 'agrimensor') at1Lascas(cx, cy, 9, 70);
  else if (e.type === 'tesselas') at1TsCai(e, e.tiles.length, 0);
  else if (e.type === 'ponteiro') { const ux = Math.cos(e.th), uy = Math.sin(e.th); for (let i = 0; i <= 6; i++) at1Caco(e.pX + ux * i * 6, e.pY + uy * i * 6 - 2, rnd(-40, 40), rnd(-120, -40), 'pl', 0, i % 2 ? '#7a7ab0' : '#b4b8e8', rnd(1, 1.5)); }
  sfx.at1Morre(v);
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !AT1_TYPES.includes(type)) return e;
  if (!ET[type].fly) for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'custodio') { e.state = 'pause'; e.stateT = 0.3 + Math.random() * 0.4; }
  else if (type === 'olhovigia') { e.state = 'turn'; e.stateT = 0.2; e.ax = Math.random() < 0.5 ? 'h' : 'v'; }
  else if (type === 'tesselas') { e.state = 'fly'; at1TsInit(e); }
  else if (type === 'ponteiro') at1PtInit(e);
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: os raios, os tiros, os estouros, os cacos, as tesselas ---------- */
function at1Update(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'tesselas' && e.tiles) at1TsTick(e, dt);
    else if (e.type === 'custodio' && e.chopT >= 0) e.chopT += dt;
  }
  for (let i = at1Raios.length - 1; i >= 0; i--) { at1Raios[i].t += dt; if (at1Raios[i].t > 0.32) at1Raios.splice(i, 1); }
  // o tiro curvo: cai na parábola; estoura na pedra, no herói ou no cruzamento
  for (let i = at1Tiros.length - 1; i >= 0; i--) {
    const S = at1Tiros[i]; S.t += dt;
    if (S.t >= S.tf) { at1Estoura(S, S.tx, S.ty); at1Tiros.splice(i, 1); continue; }
    S.vy += AT1_TIRO_G * dt; const nx = S.x + S.vx * dt, ny = S.y + S.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { at1Estoura(S, S.x, S.y); at1Tiros.splice(i, 1); continue; }
    S.x = nx; S.y = ny;
    if (at1HeroIn(S.x, S.y, 2)) { at1Estoura(S, S.x, S.y); at1Tiros.splice(i, 1); continue; }
    S.trail.push(S.x, S.y); if (S.trail.length > 16) S.trail.splice(0, 2);
  }
  for (let i = at1Estouros.length - 1; i >= 0; i--) { at1Estouros[i].t += dt; if (at1Estouros[i].t > 0.4) at1Estouros.splice(i, 1); }
  // os cacos: caem, quicam uma vez e somem
  for (let i = at1Cacos.length - 1; i >= 0; i--) {
    const c = at1Cacos[i]; c.life -= dt; if (c.life <= 0) { at1Cacos.splice(i, 1); continue; }
    c.vy = Math.min(c.vy + GRAV * 0.8 * dt, MAXFALL); const ny = c.y + c.vy * dt, nx = c.x + c.vx * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) {
      if (c.vy > 0 && !solidAt(Math.floor(nx / T), Math.floor(c.y / T))) { c.vy = c.bounce ? 0 : -c.vy * 0.3; c.vx *= 0.4; c.bounce = 1; c.va = 0; if (c.kind === 'ts' && Math.random() < 0.3) { const v = clamp(1 - Math.hypot(pl.x - c.x, pl.y - c.y) / 200, 0, 1); if (v > 0.1) sfx.at1Tine(v * 0.4); } }
      else c.vx *= -0.3;
    } else { c.x = nx; c.y = ny; }
    if (c.kind === 'ts') c.k = (c.k + c.va * dt + 12) % 12;
  }
  for (let i = at1Fx.length - 1; i >= 0; i--) { const p = at1Fx[i]; p.life -= dt; if (p.life <= 0) { at1Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
}
HOOK.update.push(at1Update);
function clearAt1Fx() { at1Raios.length = 0; at1Tiros.length = 0; at1Estouros.length = 0; at1Cacos.length = 0; at1Fx.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearAt1Fx(); at1Tables(); return _nw(sd, sv); }; }

// a luz fria que eles dão: os olhos de glifo, a grade, a mira, o anel, as pontas do ponteiro
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !AT1_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'custodio') { addL(cx, e.y + 4, e.state === 'mark' || e.state === 'chop' ? 0.4 : 0.22); if (e.grid && e.state === 'mark') for (const g of e.grid) addL(g.x * T + T / 2, g.y * T - 4, 0.25); }
    else if (e.type === 'olhovigia') addL(cx, cy, e.state === 'aim' ? 0.55 : 0.35);
    else if (e.type === 'tesselas') addL(e.form === 'anel' ? e.rcx : cx, e.form === 'anel' ? e.rcy : cy, e.form === 'anel' ? 0.45 : 0.25);
    else if (e.type === 'ponteiro') addL(e.pX, e.pY - 4, 0.3);
    else addL(cx, e.y + 4, e.state === 'measure' ? 0.4 : 0.22);
  }
  for (const R of at1Raios) addL(R.x1, R.y1, 0.5 * (1 - R.t / 0.32));
  for (const S of at1Tiros) addL(S.x, S.y, 0.35);
}; }

// a luz aditiva: os raios, os tiros, os estouros, as faíscas, o golpe da alabarda
HOOK.drawGlow.push((cx, cy) => {
  const G = AT1.GL;
  for (const R of at1Raios) {
    const f = 1 - R.t / 0.32, L = Math.hypot(R.x1 - R.x0, R.y1 - R.y0), n = Math.max(1, Math.floor(L / 10));
    lc.globalAlpha = 0.35 * f; for (let i = 0; i <= n; i++) { const t = i / n; lc.drawImage(G.branco, Math.round(lerp(R.x0, R.x1, t) - cx) - 8, Math.round(lerp(R.y0, R.y1, t) - cy) - 8); }
    lc.globalAlpha = 0.7 * f; lc.drawImage(G.brancoG, Math.round(R.x1 - cx) - 14, Math.round(R.y1 - cy) - 14);
  }
  for (const S of at1Tiros) { lc.globalAlpha = 0.6; lc.drawImage(G.violetaG, Math.round(S.x - cx) - 12, Math.round(S.y - cy) - 12); }
  for (const X of at1Estouros) { lc.globalAlpha = 0.8 * (1 - X.t / 0.4); lc.drawImage(X.glass ? G.cianoM : G.violetaG, Math.round(X.x - cx) - (X.glass ? 16 : 12), Math.round(X.y - cy) - (X.glass ? 16 : 12)); }
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'custodio' && e.grid && (e.state === 'mark' || e.chopT >= 0 && e.chopT < 0.4)) {
      const chop = e.state !== 'mark';
      for (let i = 0; i < e.grid.length; i++) { if (!chop && i >= e.gridLit) continue; const g = e.grid[i]; lc.globalAlpha = chop ? 0.7 * (1 - e.chopT / 0.4) : 0.3; lc.drawImage(chop ? G.brancoG : G.aviso, Math.round(g.x * T + T / 2 - cx) - (chop ? 14 : 5), Math.round(g.y * T - 5 - cy) - (chop ? 14 : 5)); }
    } else if (e.type === 'tesselas' && (e.state === 'gather' || e.state === 'lock' || e.state === 'close')) {
      lc.globalAlpha = 0.18; const red = e.state !== 'gather';
      for (let i = 0; i < e.tiles.length; i += 3) { const p = e.tiles[i]; lc.drawImage(red ? G.aviso : G.ciano, Math.round(p.x - cx) - (red ? 5 : 4), Math.round(p.y - cy) - (red ? 5 : 4)); }
    }
  }
  for (const p of at1Fx) { const g = at1FxGl[p.col] || (at1FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): os cacos que caem
HOOK.drawWorld.push((cx, cy) => {
  if (!at1Cacos.length) return;
  const TS = AT1.get().ts[0];
  for (const c of at1Cacos) {
    lc.globalAlpha = Math.min(1, c.life / c.max * 2.5);
    if (c.kind === 'ts') lc.drawImage(TS[Math.floor(c.k) % 12].r, Math.round(c.x - cx) - 4, Math.round(c.y - cy) - 4);
    else { lc.fillStyle = '#12161e'; lc.fillRect(Math.round(c.x - cx) - 1, Math.round(c.y - cy) - 1, 3, 3); lc.fillStyle = c.col; lc.fillRect(Math.round(c.x - cx), Math.round(c.y - cy), 2, 1); }
  }
  lc.globalAlpha = 1;
});
// uma linha de pixels de (x0, y0) a (x1, y1) na tela: um pixel a cada `step`, cores alternando em `cols`
function at1Linha(x0, y0, x1, y1, step, cols, from = 0, to = 1) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.floor(L / step));
  for (let i = Math.floor(n * from); i <= n * to; i++) { const t = i / n; lc.fillStyle = cols[i % cols.length]; lc.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1); }
}
// por cima do escuro: a grade, a mira, as linhas de medida e o cruzamento, o anel, o arco do ponteiro, os raios, os
// tiros, as pupilas e as faíscas
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime, blink = Math.floor(now * 14) % 2, TS = AT1.get().ts;
  for (const e of enemies) {
    if (e.dead) continue;
    const ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
    if (ex < -260 || ex > VW + 260 || ey < -260 || ey > VH + 260) continue;
    if (e.type === 'custodio' && e.grid) {
      // a grade: um quadrado vermelho em pé sobre cada casa do chão, com a borda acesa no piso; no golpe, branco
      const chop = e.state !== 'mark'; if (chop && !(e.chopT >= 0 && e.chopT < 0.4)) continue;
      const late = !chop && e.stateT < 0.25;
      for (let i = 0; i < e.grid.length; i++) {
        if (!chop && i >= e.gridLit) continue;
        const g = e.grid[i], x = g.x * T - cx, y = g.y * T - cy;
        lc.globalAlpha = chop ? 1 - e.chopT / 0.4 : late && blink ? 0.55 : 0.95;
        lc.fillStyle = chop ? '#ffffff' : AT_COL.aviso;
        lc.fillRect(x + 1, y - T + 1, T - 2, 1); lc.fillRect(x + 1, y - 2, T - 2, 1); lc.fillRect(x + 1, y - T + 1, 1, T - 2); lc.fillRect(x + T - 2, y - T + 1, 1, T - 2);
        lc.fillStyle = chop ? '#e8f0ff' : AT_COL.avisoClaro; lc.fillRect(x, y - 1, T, 1);
        lc.fillRect(x + 1, y - T + 1, 1, 1); lc.fillRect(x + T - 2, y - T + 1, 1, 1);
        if (!chop) { lc.globalAlpha *= 0.28; lc.fillStyle = AT_COL.aviso; lc.fillRect(x + 2, y - T + 2, T - 4, T - 4); lc.globalAlpha = late && blink ? 0.6 : 1; lc.fillStyle = '#ffd0d6'; lc.fillRect(x + 5, y - 7, 2, 2); }
        else { lc.fillStyle = '#ffffff'; lc.fillRect(x + 1, y - 5 - Math.round(e.chopT * 20), T - 2, 1); }
      }
      lc.globalAlpha = 1;
    } else if (e.type === 'olhovigia') {
      const x = ex, y = ey, aim = e.state === 'aim';
      const tx = aim ? e.aimX - cx : pl.x + pl.w / 2 - cx, ty = aim ? e.aimY - cy : pl.y + pl.h / 2 - cy, a = Math.atan2(ty - y, tx - x);
      if (aim) {   // a linha fina de mira; travada, cheia e piscando
        const locked = e.stateT <= AT1_MIRA_TRAVA, q = clamp(1 - e.stateT / AT1_MIRA, 0, 1);
        lc.globalAlpha = 0.45 + 0.5 * q; at1Linha(x + Math.cos(a) * 7, y + Math.sin(a) * 7, tx, ty, locked ? 1 : 2, locked ? (blink ? ['#ffffff', AT_COL.aviso] : [AT_COL.aviso]) : [AT_COL.aviso, '#a02232']);
        lc.globalAlpha = 1; lc.fillStyle = locked && blink ? '#ffffff' : AT_COL.aviso;
        lc.fillRect(Math.round(tx) - 3, Math.round(ty), 2, 1); lc.fillRect(Math.round(tx) + 2, Math.round(ty), 2, 1); lc.fillRect(Math.round(tx), Math.round(ty) - 3, 1, 2); lc.fillRect(Math.round(tx), Math.round(ty) + 2, 1, 2);
      }
      // a pupila: um quadradinho aceso virado para onde ele olha
      const px = Math.round(x + Math.cos(a) * 1.6 - 1), py = Math.round(y + Math.sin(a) * 1.6 - 1);
      lc.fillStyle = aim ? '#ffd0d6' : '#e8ffff'; lc.fillRect(px, py, 2, 2); lc.fillStyle = aim ? AT_COL.aviso : AT_COL.glifo; lc.fillRect(px + (Math.cos(a) > 0 ? -1 : 2), py, 1, 2);
    } else if (e.type === 'agrimensor' && e.state === 'measure') {
      // as duas linhas de medida: da lente e do pé, crescendo até o alvo e passando um pouco; os riscos de escala
      const P = at1AgPts(e), q = clamp((AT1_MEDE - e.stateT) / 0.45, 0, 1), locked = e.stateT <= AT1_MEDE_TRAVA, tx = e.tgX - cx, ty = e.tgY - cy;
      for (const [ox, oy] of [[P.lx - cx, P.ly - cy], [P.fx - cx, P.fy - cy]]) {
        const ex2 = ox + (tx - ox) * 1.15, ey2 = oy + (ty - oy) * 1.15;
        lc.globalAlpha = 0.8; at1Linha(ox, oy, ex2, ey2, 2, locked && blink ? ['#ffffff'] : [AT_COL.aviso], 0, q);
        const L = Math.hypot(ex2 - ox, ey2 - oy), ux = (ex2 - ox) / L, uy = (ey2 - oy) / L;
        lc.fillStyle = AT_COL.avisoClaro; for (let d = 12; d < L * q; d += 12) { lc.fillRect(Math.round(ox + ux * d - uy * 1.5), Math.round(oy + uy * d + ux * 1.5), 1, 1); lc.fillRect(Math.round(ox + ux * d + uy * 1.5), Math.round(oy + uy * d - ux * 1.5), 1, 1); }
      }
      if (q >= 1) at1Cruz(tx, ty, locked, blink);
      lc.globalAlpha = 1;
    } else if (e.type === 'tesselas' && e.tiles) {
      const ring = e.state === 'gather' || e.state === 'lock' || e.state === 'close', n = e.tiles.length;
      if (ring) {   // o anel aceso: varre em volta enquanto junta, fica vermelho travado
        const red = e.state !== 'gather', lit = e.state === 'gather' ? clamp(1 - e.stateT / AT1_TS_JUNTA, 0, 1) * 1.3 : 1;
        for (let i = 0; i < n; i++) {
          if (!red && i / n > lit) continue;
          const p = e.tiles[i], kind = red ? 2 : 1;
          lc.drawImage(TS[kind][p.k % 12].r, Math.round(p.x - cx) - 4, Math.round(p.y - cy) - 4);
        }
        if (e.state !== 'gather') { lc.globalAlpha = blink ? 0.8 : 0.4; lc.fillStyle = AT_COL.aviso; const R = e.ringR + 5; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832 - now * 0.8; lc.fillRect(Math.round(e.rcx - cx + Math.cos(a) * R), Math.round(e.rcy - cy + Math.sin(a) * R), 1, 1); } lc.globalAlpha = 1; }
      } else {   // o fio ciano de cada tessela no escuro
        lc.fillStyle = AT_COL.glifo; lc.globalAlpha = 0.7;
        for (let i = 0; i < n; i += 2) { const p = e.tiles[i]; lc.fillRect(Math.round(p.x - cx) - 1, Math.round(p.y - cy) - 1, 1, 1); }
        lc.globalAlpha = 1;
      }
    } else if (e.type === 'ponteiro' && e.state === 'arc') {
      // o arco fino na parede: de onde a barra está até onde ela vai bater, crescendo; a borda de fora, o raio do fim
      const q = clamp((AT1_ARCO - e.stateT) / (AT1_ARCO * 0.6), 0, 1), px = e.pX - cx, py = e.pY - cy, R = AT1_PT_L + 1, n = 40;
      lc.globalAlpha = e.stateT < 0.2 && blink ? 0.5 : 0.9;
      for (let i = 0; i <= n * q; i++) { const a = e.th0 + (e.th1 - e.th0) * i / n; lc.fillStyle = i % 4 ? AT_COL.aviso : AT_COL.avisoClaro; lc.fillRect(Math.round(px + Math.cos(a) * R), Math.round(py + Math.sin(a) * R), 1, 1); if (i % 2 === 0) { lc.fillStyle = '#a02232'; lc.fillRect(Math.round(px + Math.cos(a) * (R - 4)), Math.round(py + Math.sin(a) * (R - 4)), 1, 1); } }
      if (q >= 1) { lc.globalAlpha = 0.8; at1Linha(px, py, px + Math.cos(e.th1) * R, py + Math.sin(e.th1) * R, 2, [AT_COL.aviso]); }
      lc.globalAlpha = 1; lc.fillStyle = blink ? '#ffffff' : AT_COL.avisoClaro; lc.fillRect(Math.round(px) - 1, Math.round(py) - 2, 2, 2);
    } else if (e.type === 'ponteiro' && e.state === 'sweep') {
      // o rastro branco da varredura
      const px = e.pX - cx, py = e.pY - cy; lc.fillStyle = '#ffffff';
      for (let j = 1; j <= 5; j++) { const a = e.th - (e.th1 - e.th0) * 0.05 * j; lc.globalAlpha = 0.7 - j * 0.12; for (const r of [AT1_PT_L * 0.7, AT1_PT_L - 1]) lc.fillRect(Math.round(px + Math.cos(a) * r), Math.round(py + Math.sin(a) * r), 1, 1); }
      lc.globalAlpha = 1;
    }
  }
  // o cruzamento continua marcado enquanto o tiro voa
  for (const S of at1Tiros) at1Cruz(S.tx - cx, S.ty - cy, true, blink);
  // os raios: o miolo branco, a borda ciano
  for (const R of at1Raios) {
    const f = 1 - R.t / 0.32, x0 = R.x0 - cx, y0 = R.y0 - cy, x1 = R.x1 - cx, y1 = R.y1 - cy, L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    lc.globalAlpha = f; at1Linha(x0, y0, x1, y1, 1, ['#ffffff']);
    if (R.t < 0.16) { lc.globalAlpha = f * 0.8; at1Linha(x0 + nx, y0 + ny, x1 + nx, y1 + ny, 1, [AT_COL.glifoClaro]); at1Linha(x0 - nx, y0 - ny, x1 - nx, y1 - ny, 1, [AT_COL.glifo]); }
  }
  lc.globalAlpha = 1;
  // os tiros curvos: o miolo prata-violeta e o rastro
  for (const S of at1Tiros) {
    for (let j = 0; j < S.trail.length; j += 2) { lc.globalAlpha = (j + 2) / S.trail.length * 0.7; lc.fillStyle = '#7a7ab0'; lc.fillRect(Math.round(S.trail[j] - cx), Math.round(S.trail[j + 1] - cy), 1, 1); }
    const x = Math.round(S.x - cx), y = Math.round(S.y - cy); lc.globalAlpha = 1;
    lc.fillStyle = '#14121e'; lc.fillRect(x - 2, y - 2, 4, 4); lc.fillStyle = '#b4b8e8'; lc.fillRect(x - 1, y - 1, 2, 2); lc.fillStyle = '#ffffff'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
  // os estouros: um anel quadrado de luz que abre (o do olho morto, um círculo de vidro)
  for (const X of at1Estouros) {
    const q = X.t / 0.4, r = 2 + q * (X.glass ? 12 : AT1_TIRO_R), x = Math.round(X.x - cx), y = Math.round(X.y - cy);
    lc.globalAlpha = 1 - q; lc.fillStyle = q < 0.35 ? '#ffffff' : X.glass ? AT_COL.glifoClaro : '#b4b8e8';
    if (X.glass) for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; lc.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
    else { const R = Math.round(r); lc.fillRect(x - R, y - R, R * 2 + 1, 1); lc.fillRect(x - R, y + R, R * 2 + 1, 1); lc.fillRect(x - R, y - R, 1, R * 2 + 1); lc.fillRect(x + R, y - R, 1, R * 2 + 1); }
  }
  for (const p of at1Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); }
  lc.globalAlpha = 1;
});
// o cruzamento das linhas de medida: um quadrado com mira em cruz
function at1Cruz(x, y, locked, blink) {
  x = Math.round(x); y = Math.round(y);
  lc.globalAlpha = 0.95; lc.fillStyle = locked && blink ? '#ffffff' : AT_COL.aviso;
  lc.fillRect(x - 4, y - 4, 3, 1); lc.fillRect(x + 2, y - 4, 3, 1); lc.fillRect(x - 4, y + 4, 3, 1); lc.fillRect(x + 2, y + 4, 3, 1);
  lc.fillRect(x - 4, y - 3, 1, 2); lc.fillRect(x + 4, y - 3, 1, 2); lc.fillRect(x - 4, y + 2, 1, 2); lc.fillRect(x + 4, y + 2, 1, 2);
  lc.fillStyle = AT_COL.avisoClaro; lc.fillRect(x, y, 1, 1);
  lc.globalAlpha = 1;
}

/* ---------- sons: pedra, vidro e mecanismo; nada de voz ---------- */
Object.assign(sfx, {
  // o custódio: o clique do passo com o baque da pedra, a alabarda erguendo, a grade acendendo, a queda
  at1Clique(v = 1) { tone(1900, 0.03, 'square', 0.016 * v, -700); noise(0.03, 0.04 * v, 3200, 'bandpass', 0, 4); tone(120, 0.08, 'sine', 0.05 * v, -40); },
  at1Ergue(v = 1) { noise(0.35, 0.03 * v, 900, 'bandpass', 0, 2); tone(180, 0.35, 'triangle', 0.02 * v, 160); },
  at1Grade(v = 1, i = 1) { tone(660 + i * 220, 0.07, 'square', 0.014 * v); tone(1320 + i * 440, 0.05, 'sine', 0.006 * v, 0, 0.01); },
  at1Alabarda(v = 1) { noise(0.25, 0.12 * v, 500, 'lowpass'); tone(90, 0.3, 'sine', 0.1 * v, -40); noise(0.08, 0.05 * v, 4200, 'highpass'); tone(2400, 0.45, 'sine', 0.01 * v, -120, 0.02); },
  // o olho: o zumbido, a virada, a mira subindo, a trava, o raio
  at1Zumbe(v = 1) { tone(220, 0.6, 'sine', 0.008 * v, 10); tone(440, 0.6, 'sine', 0.003 * v, 20); },
  at1Vira(v = 1) { tone(2600, 0.025, 'square', 0.008 * v); tone(1300, 0.04, 'sine', 0.01 * v, 0, 0.03); },
  at1Mira(v = 1) { tone(900, 0.8, 'sine', 0.012 * v, 900); tone(1800, 0.8, 'sine', 0.004 * v, 1800); },
  at1Trava(v = 1, p = 1) { tone(2400 * p, 0.06, 'square', 0.012 * v); tone(3200 * p, 0.08, 'sine', 0.01 * v, 0, 0.05); },
  at1Raio(v = 1) { tone(3400, 0.28, 'sawtooth', 0.016 * v, -2800); noise(0.22, 0.05 * v, 6000, 'highpass'); tone(150, 0.22, 'square', 0.02 * v, -60); },
  // o agrimensor: as pernas, a cravada, as medidas tiquetaqueando, o tiro e o estouro
  at1Perna(v = 1) { tone(900 + Math.random() * 200, 0.02, 'square', 0.006 * v); },
  at1Crava(v = 1) { noise(0.12, 0.07 * v, 300, 'lowpass'); for (let k = 0; k < 3; k++) tone(260 - k * 30, 0.05, 'square', 0.02 * v, -80, k * 0.05); },
  at1Mede(v = 1) { for (let k = 0; k < 5; k++) { tone(1500, 0.03, 'square', 0.008 * v, 0, k * 0.17); tone(2000, 0.03, 'square', 0.006 * v, 0, k * 0.17 + 0.085); } },
  at1Tiro(v = 1) { tone(520, 0.25, 'triangle', 0.03 * v, -260); noise(0.1, 0.04 * v, 1500, 'bandpass'); },
  at1Impacto(v = 1) { noise(0.3, 0.1 * v, 700, 'lowpass'); tone(110, 0.25, 'sine', 0.07 * v, -60); tone(2600, 0.2, 'sine', 0.01 * v, -800); },
  // as tesselas: tilintar de ladrilhos, o anel subindo, o fechar, as que caem
  at1Tessela(v = 1) { for (let k = 0; k < 3; k++) tone(2600 + Math.random() * 1400, 0.04, 'triangle', 0.008 * v, 0, k * 0.05); },
  at1Anel(v = 1) { tone(600, 0.6, 'sine', 0.014 * v, 600); for (let k = 0; k < 6; k++) tone(1800 + k * 200, 0.04, 'triangle', 0.007 * v, 0, k * 0.08); },
  at1Fecha(v = 1) { noise(0.24, 0.08 * v, 2600, 'bandpass', 0, 1.5); tone(1800, 0.2, 'square', 0.012 * v, -1500); },
  at1Cai(v = 1) { for (let k = 0; k < 4; k++) tone(3000 - k * 380, 0.05, 'triangle', 0.012 * v, -300, k * 0.06); },
  at1Tine(v = 1) { tone(3200 + Math.random() * 800, 0.06, 'triangle', 0.012 * v, -200); },
  // o ponteiro: o giro grave, o pouso na pedra, o arco de aviso, a varredura
  at1Gira(v = 1) { noise(0.6, 0.025 * v, 320, 'bandpass', 0, 2); tone(70, 0.6, 'sine', 0.03 * v, 30); },
  at1Pousa(v = 1, big = false) { tone(big ? 90 : 130, 0.12, 'sine', 0.06 * v, -40); noise(0.06, 0.05 * v, 2200, 'bandpass', 0, 3); },
  at1Arco(v = 1) { tone(1100, 0.7, 'sine', 0.012 * v, -500); tone(1650, 0.5, 'sine', 0.005 * v, -700, 0.1); },
  at1Varre(v = 1) { noise(0.25, 0.12 * v, 1200, 'bandpass', 0, 0.8); tone(320, 0.2, 'sawtooth', 0.03 * v, -220); },
  // todos: pedra batida, a morte (placas se soltando e um tilintar descendo)
  at1Golpe(v = 1) { noise(0.08, 0.05 * v, 2600, 'bandpass', 0, 2); tone(1300 + Math.random() * 600, 0.15, 'sine', 0.01 * v, -200); },
  at1Morre(v = 1) { noise(0.6, 0.1 * v, 600, 'lowpass'); for (let k = 0; k < 6; k++) tone(2400 - k * 250, 0.08, 'triangle', 0.012 * v, -100, k * 0.07); tone(80, 0.6, 'sine', 0.06 * v, -30); }
});
