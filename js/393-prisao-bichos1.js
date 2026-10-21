'use strict';

/* ================= a Prisão dos Deuses: os bichos, parte um (e o que os dez dividem) =================
   Cinco dos dez prisioneiros e guardas da décima sexta camada (docs/camadas/16-prisao-deuses.md, seção 6; os outros
   cinco estão no 394). Todo ataque tem aviso: uma pose que se vê de longe, um brilho, um som e, quando o golpe cai no
   chão, a marca vermelha no lugar onde ele vai cair. Encostar não machuca.
   - o Carcereiro de Pedra (carcereiro): o guarda que os deuses talharam e deixaram de vigia, largo, de pedra, com a
     chave do tamanho de um braço. Anda devagar. Perto, ergue a chave acima da cabeça (os olhos da fenda acendem, a
     pedra range, a marca vermelha acende no chão à frente, 0,7 s) e bate: quem estiver na marca leva;
   - os Elos Soltos (elos): pedaços de corrente que a magia da prisão deixou vivos, sempre em bando de três. Rastejam
     como lagarta. Perto, se enrolam (chocalham, as juntas acendem em azul, 0,45 s) e saltam no herói;
   - a Águia do Suplício (aguia): a ave que comia o fígado do titã acorrentado, de penas de bronze escuro. Voa em roda
     por cima; para no ar, abre as asas e grita (o olho acende, 0,6 s; a mira trava no fim) e mergulha em linha reta.
     Se o mergulho bate na pedra, fica tonta;
   - o Condenado da Bola (condenado): o prisioneiro magro de pele cinza com a bola de ferro presa no tornozelo pela
     corrente. Fica longe; gira a bola acima da cabeça (o zunido sobe, 0,9 s) e arremessa em arco; enquanto puxa a
     bola de volta, não ataca. Perto, balança a bola rente ao chão (0,45 s de aviso);
   - a Pedra Viva (pedraviva): parece uma pedra caída. Quando o herói chega, as rachaduras acendem em vermelho e ela
     levanta (0,7 s); anda devagar e, perto, puxa o braço de pedra para trás (a marca acende no chão, 0,6 s) e soca.
     Sem ninguém por perto, afunda de novo. Dormindo, o golpe só lasca (metade do dano) e a acorda.
   Aqui também o que os dez dividem: os tiros (bola, veneno, gemido, gancho), as marcas no chão, as ondas que correm
   rente ao chão, as poças de veneno, as faíscas, e os golpes/mortes/nascimento. O 395 põe o nível (embrulha spawnEnemy
   por fora) e as tabelas de spawn. Materiais e bases do 398 (filtrados). Prefixo pd1. */

/* ---------- números ---------- */
Object.assign(ET, {
  carcereiro: { name: 'Carcereiro de Pedra', w: 14, h: 24, hp: 135, dmg: 25, xp: 36, kb: 0.15, fly: false, blood: '#8a8070' },
  elos: { name: 'Elos Soltos', w: 10, h: 6, hp: 24, dmg: 10, xp: 9, kb: 0.9, fly: false, blood: '#55555f' },
  aguia: { name: 'Águia do Suplício', w: 18, h: 12, hp: 62, dmg: 21, xp: 27, kb: 0.6, fly: true, blood: '#7a2a1a' },
  condenado: { name: 'Condenado da Bola', w: 10, h: 22, hp: 86, dmg: 21, xp: 30, kb: 0.55, fly: false, blood: '#6a1a14' },
  pedraviva: { name: 'Pedra Viva', w: 16, h: 14, hp: 104, dmg: 23, xp: 31, kb: 0.1, fly: false, blood: '#643a32' }
});
const PD1_TYPES = ['carcereiro', 'elos', 'aguia', 'condenado', 'pedraviva'];
// materiais e bases do 398; filtradas agora e de novo a cada mundo (as três bases somam uns 1,5%)
const PD_BASES = [['mangual_grilhao', 0.005], ['elmo_carcereiro', 0.005], ['cota_elos', 0.005]];
const PD1_DROPS = {
  carcereiro: [['coracao_pedra', 0.3], ['min_ferro_divino', 0.09], ['pocao', 0.07], ...PD_BASES],
  elos: [['elo_vivo', 0.4], ['min_ferro_divino', 0.05], ['pocao', 0.05], ...PD_BASES],
  aguia: [['pena_suplicio', 0.45], ['min_ferro_divino', 0.08], ['pocao', 0.07], ...PD_BASES],
  condenado: [['elo_vivo', 0.3], ['min_ferro_divino', 0.08], ['pocao', 0.07], ...PD_BASES],
  pedraviva: [['coracao_pedra', 0.45], ['min_ferro_divino', 0.09], ['pocao', 0.07], ...PD_BASES]
};
function pd1Tables() { for (const k of PD1_TYPES) DROPS[k] = PD1_DROPS[k].filter(([id]) => ITEMS[id]); }
pd1Tables();
Object.assign(NAV_WALKERS, { carcereiro: 1, condenado: 1, pedraviva: 1 });
Object.assign(CV_STEP, { carcereiro: 1, condenado: 1 });
ET.condenado.climbs = true;   // sobe a corrente e a escada de ferro (356)

const PD1_ERGUE = 0.7, PD1_ENROLA = 0.45, PD1_MIRA = 0.6, PD1_GIRA = 0.9, PD1_BALANCA = 0.45, PD1_ACORDA = 0.7, PD1_CARREGA = 0.6;

/* ================= o que os dez dividem ================= */
const pdTiros = [], pdMarcas = [], pdOndas = [], pdPocas = [], pdFx = [], pdFxGl = {};
const pdNear = (e, r = 240) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const pdNearP = (x, y, r = 240) => clamp(1 - Math.hypot(pl.x + pl.w / 2 - x, pl.y + pl.h / 2 - y) / r, 0, 1);
const pdLive = e => e && !e.dead && enemies.includes(e);
const pdHeroIn = (x, y, m = 2) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
const pdBoxHits = (x, y, w, h) => !pl.dead && pl.x < x + w && pl.x + pl.w > x && pl.y < y + h && pl.y + pl.h > y;
function pdP(o) { if (pdFx.length < 500) pdFx.push(o); }
function pdSparks(x, y, n, cols, sp = 50, g = 0, life = 0.4) {
  if (pdFx.length > 470) return;
  for (let i = 0; i < n; i++) pdP({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[(Math.random() * cols.length) | 0] });
}
const PD_FAISCA = ['#fff0c8', '#ffcc4a', '#ffffff'], PD_PO = ['#6a6050', '#8a8070', '#4a4234'], PD_FERRUGEM = ['#8a4a22', '#6a3418', '#a86a3a'];
// a linha do chão debaixo de um ponto (o primeiro sólido em até 6 blocos para baixo), em blocos; -1 se não há
function pdFloorRow(px, py) { const tx = Math.floor(px / T); let ty = Math.floor(py / T); for (let k = 0; k < 7; k++, ty++) if (solidAt(tx, ty) && !solidAt(tx, ty - 1)) return ty; return -1; }
// uma marca vermelha no chão, de x0 a x1 (px) na linha de chão fr (em blocos); t até cair
function pdMarca(x0, x1, fr, t, kind = 'golpe') { const M = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), fr, t: 0, max: t, kind }; pdMarcas.push(M); return M; }
// uma onda que corre rente ao chão a partir de (x, fr) para dir, por dist px; pula-se por cima
function pdOnda(x, fr, dir, dist, dmg, src, sp = 220) { if (pdOndas.length < 40) pdOndas.push({ x, x0: x, fr, dir, dist, dmg, src, sp, hit: false, t: 0 }); }
// um tiro: kind 'bola' | 'veneno' | 'gemido' | 'gancho' | 'pedra'; o dono recebe o aviso de volta (onHit, onEnd)
function pdTiro(o) { if (pdTiros.length >= 80) return null; const S = Object.assign({ t: 0, life: 3, g: 0, r: 3, trail: [], hit: false }, o); pdTiros.push(S); return S; }
// o tempo de voo e as velocidades de um arco que sai de (x0, y0) e cai em (x1, y1) com gravidade g em tf s
function pdArco(x0, y0, x1, y1, g, tf) { return { vx: (x1 - x0) / tf, vy: (y1 - y0) / tf - 0.5 * g * tf }; }

/* ================= arte ================= */
const PD1 = {};
{
const { cg } = CVART, cp = CVB.cp, set = CVB.set;
const R7 = a => a.map(h => ph(h));
const AR = {
  pedra: R7(['#141210', '#24201c', '#38322a', '#4e463a', '#686050', '#888070', '#b0a690']),
  ferro: R7(['#08080c', '#16161c', '#26262e', '#3a3a44', '#55555f', '#7a7a86', '#a8a8b4']),
  bronze: R7(['#140c04', '#2a1a08', '#4a3010', '#6e4c1a', '#98702c', '#c49a48', '#e8c878']),
  pena: R7(['#0e0806', '#1e120a', '#32200e', '#4a3214', '#664a1e', '#8a6a2e', '#b0904a']),
  bico: R7(['#2a2014', '#4a3a22', '#6e5a36', '#948050', '#b8a46e', '#d8c896', '#f0e8c8']),
  pele: R7(['#141414', '#24262a', '#383a40', '#50525a', '#6a6c74', '#8a8c94', '#b0b2b8']),
  pano: R7(['#100c08', '#1e1810', '#2e2418', '#403222', '#54442e', '#6a583c', '#84704e']),
  viva: R7(['#140a0a', '#241212', '#381c1a', '#4c2824', '#643830', '#7e4a40', '#9a6050']),
  osso: R7(['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']),
  aviso: R7(['#2a0604', '#5a0e08', '#a01c10', '#ff3a2a', '#ff8a5a', '#ffc8a8', '#fff0e0']),
  runa: R7(['#0a1828', '#0e2030', '#1a3a58', '#2a6090', '#5ab0e8', '#a8dcff', '#e8f8ff'])
};
// uma barra de espessura th (haste, braço, perna): o lado virado para a luz mais claro
function rod(P, x0, y0, x1, y1, th, R, base, s) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, lit = -(nx * 0.6 + ny * 0.8), h = (th - 1) / 2;
  for (let t = 0; t <= L; t += 0.5) for (let k = -h; k <= h + 0.01; k += 0.5) { const x = x0 + ux * t + nx * k, y = y0 + uy * t + ny * k; P.put(x, y, R, base + (h ? k / h : 0) * lit * 1.1 + cg(x | 0, y | 0, s) * 0.3); }
}
// o bloco talhado (luz de cima à esquerda)
function slab(P, x0, y0, x1, y1, R, s, base = 3) {
  for (let y = Math.round(y0); y <= y1; y++) for (let x = Math.round(x0); x <= x1; x++) P.put(x, y, R, base + (y === Math.round(y0) ? 1.1 : 0) + (x === Math.round(x0) ? 0.5 : 0) - (y >= y1 - 0.5 ? 0.9 : 0) - (x >= x1 - 0.5 ? 0.6 : 0) + cg(x, y, s) * 0.4);
}
// um anel (elo, argola)
function ring(P, cx, cy, rx, ry, th, R, base, s) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy), di = Math.hypot((x + 0.5 - cx) / Math.max(0.5, rx - th), (y + 0.5 - cy) / Math.max(0.5, ry - th));
    if (d <= 1 && di > 1) P.put(x, y, R, base + 0.6 - (dx * 0.6 + dy * 0.8) * 1.4 + (d > 0.85 ? -0.6 : 0) + cg(x, y, s) * 0.3);
  }
}

/* ---------- o Carcereiro de Pedra: quadro 44 x 42, o meio dos pés em x 16, os pés na linha 40 ----------
   lg: o passo; hand: a mão da chave; a: o ângulo da chave (da mão para os dentes); lean: o tronco para a frente */
const CC = [
  { lg: 0, hand: [24, 24], a: 1.25, lean: 0 },          // 0 parado: a chave para baixo, ao lado
  { lg: 2, hand: [24, 24], a: 1.15, lean: 0.5 },        // 1-2 o passo
  { lg: -2, hand: [24, 23], a: 1.3, lean: 0.5 },
  { lg: 0, hand: [15, 6], a: -2.45, lean: -1 },         // 3 erguida acima da cabeça (o aviso)
  { lg: 1, hand: [27, 22], a: 0.28, lean: 1.5 }         // 4 o golpe: os dentes mordem o chão
];
function carcereiro(k) {
  const o = CC[k], P = cp(44, 42), s = 39901 + k * 7, B = 16, F = 40, R = AR.pedra, ln = r => Math.round(o.lean * (1 - r / 26));
  // a perna de trás, o braço de trás (na sombra)
  slab(P, B - 5 - o.lg, F - 10, B - 1 - o.lg, F, R, s, 1.9);
  rod(P, B - 6 + ln(14), F - 22, B - 8 + ln(8), F - 13, 3, R, 2, s + 1);
  // o tronco: o peito largo de pedra em blocos, o cinto de ferro, a gola de ferro com o elo
  slab(P, B - 7 + ln(10), F - 24, B + 6 + ln(10), F - 13, R, s + 2, 3);
  for (let x = B - 7; x <= B + 6; x++) P.put(x + ln(16), F - 18, R, 1.4);                         // a junta das pedras
  for (let x = B - 2; x <= B + 1; x++) P.put(x + ln(20), F - 22, R, 1.4);
  slab(P, B - 7 + ln(2), F - 13, B + 6 + ln(2), F - 11, AR.ferro, s + 3, 2.6);
  slab(P, B - 4 + ln(26), F - 26, B + 4 + ln(26), F - 25, AR.ferro, s + 4, 3);
  // a perna da frente
  slab(P, B + 1 + o.lg, F - 10, B + 5 + o.lg, F, R, s + 5, 2.8);
  slab(P, B + 1 + o.lg, F - 1, B + 6 + o.lg, F, R, s + 6, 2.4);
  // a cabeça: o elmo quadrado de pedra com a fenda do visor
  const hx = B + ln(30) + (o.lean > 0 ? 1 : 0);
  slab(P, hx - 4, F - 33, hx + 4, F - 27, R, s + 7, 3.3);
  for (let x = hx - 3; x <= hx + 3; x++) P.put(x, F - 30, R, 0.4);
  for (let x = hx - 5; x <= hx + 5; x++) P.put(x, F - 34, R, x < hx ? 4.8 : 4.2);                // a aba
  // a chave: o anel na mão, a haste de ferro, os dentes
  const [gx, gy] = o.hand, ux = Math.cos(o.a), uy = Math.sin(o.a);
  rod(P, gx - ux * 3, gy - uy * 3, gx + ux * 15, gy + uy * 15, 2.5, AR.ferro, 3, s + 8);
  ring(P, gx - ux * 5, gy - uy * 5, 2.8, 2.8, 1.2, AR.ferro, 3, s + 9);
  const nx = -uy, ny = ux, side = o.a < 0 ? -1 : 1;
  for (let t = 11; t <= 15; t++) for (let w = 1; w <= ((t & 1) ? 4 : 2.5); w += 0.5) P.put(gx + ux * t + nx * w * side, gy + uy * t + ny * w * side, AR.ferro, 3.6 - w * 0.3);
  // o braço da frente por cima (o punho fechado na chave)
  rod(P, B + 5 + ln(14), F - 22, gx, gy, 3.5, R, 3.2, s + 10);
  slab(P, gx - 1.5, gy - 1.5, gx + 1.5, gy + 1.5, R, s + 11, 3.4);
  return set(P.done());
}
// o olho do carcereiro na tela (a fenda): relativo ao meio dos pés
PD1.ccOlho = (e, k) => { const o = PD1.CC[k]; return [(Math.round(o.lean * (1 - 30 / 26)) + (o.lean > 0 ? 1 : 0)) + 1.5, -30]; };

/* ---------- os Elos Soltos: três elos de ferro, quadro 16 x 11, os pés na linha 10 ----------
   k 0 deitado, 1 arqueado (o passo da lagarta), 2 enrolado (o aviso), 3 esticado (o salto) */
function elos(k) {
  const P = cp(16, 11), s = 39931 + k * 5, R = AR.ferro;
  const L = k === 0 ? [[3, 8, 0], [8, 8.5, 1], [13, 8, 0]] : k === 1 ? [[3, 8.5, 0], [8, 5, 1], [12.5, 8.5, 0]] : k === 2 ? [[5, 7.5, 0], [8, 4.5, 1], [10.5, 7.5, 0]] : [[2, 6, 0], [8, 6, 1], [14, 6, 0]];
  for (const [x, y, side] of L) {
    if (side) for (let t = -3; t <= 3; t += 0.5) { P.put(x + t, y - 0.5, R, 4.4); P.put(x + t, y + 0.5, R, 2.2); }
    else ring(P, x, y, 3, 2.4, 1.1, R, 2.8, s + x);
  }
  for (const [x, y] of L) P.put(x, y - 2, AR.ferro, 5.4);
  return set(P.done());
}

/* ---------- a Águia do Suplício: quadro 34 x 24, o meio em (17, 14) ----------
   k 0-2 o bater de asas (alto, meio, baixo), 3 o mergulho (asas fechadas para trás), 4 o grito (asas abertas, bico aberto) */
function aguia(k) {
  const P = cp(34, 24), s = 39941 + k * 7, R = AR.pena, cx = 17, cy = 14;
  const wing = (up, far) => {
    const base = far ? 1.8 : 3, yy = up === 2 ? -9 : up === 1 ? -1 : up === 0 ? 6 : -3, len = up === 3 ? 7 : 14, dir = far ? 1 : -1;
    for (let i = 0; i <= len; i++) {
      const t = i / len, x = cx - 2 + (far ? 2 : -1) + (up === 3 ? -i * 1.2 : -i * 0.9) * (far ? -0.2 : 1) + (far ? i * 0.8 : 0), y = cy - 2 + yy * t + (up === 3 ? i * 0.3 : 0);
      const w = (1 - t * 0.7) * 3.2;
      for (let k2 = 0; k2 <= w; k2 += 0.5) P.put(x + dir * 0.2, y + k2, R, base + 0.8 - k2 * 0.3 + ((i + (k2 | 0)) % 3 === 0 ? -0.8 : 0) + cg(x | 0, (y + k2) | 0, s) * 0.4);
      if (i > len - 4) P.put(x, y + w + 1, R, base - 1);   // as penas da ponta, soltas
    }
  };
  wing(k === 3 ? 3 : k === 4 ? 2 : k, true);
  // o corpo: o peito, o rabo em leque, as garras
  for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 7; x <= cx + 5; x++) { const dx = (x + 0.5 - cx + 1) / 6.5, dy = (y + 0.5 - cy) / 4; if (dx * dx + dy * dy <= 1) P.put(x, y, R, 3.2 - (dx * 0.6 + dy * 0.8) * 1.4 + ((x + y) % 3 === 0 ? -0.5 : 0)); }
  for (let i = 0; i < 6; i++) for (let j = -1 - (i >> 1); j <= 1 + (i >> 1); j++) P.put(cx - 7 - i, cy + j * 0.8 + (k === 3 ? -1 : 0), R, 2.4 - i * 0.15 + (j === 0 ? 0.6 : 0));
  if (k !== 3) for (const fx of [cx - 1, cx + 2]) { P.put(fx, cy + 5, AR.bico, 3); P.put(fx, cy + 6, AR.bico, 2.4); P.put(fx + 1, cy + 7, AR.bico, 4); }
  // a cabeça: pescoço sem penas (a pele escura), o bico curvo de osso, o olho
  const hx = cx + 6, hy = cy - (k === 4 ? 6 : 3);
  for (let y = hy - 2; y <= hy + 2; y++) for (let x = hx - 2; x <= hx + 2; x++) if (Math.hypot(x - hx, y - hy) <= 2.4) P.put(x, y, R, 3.8 - (x - hx) * 0.2 - (y - hy) * 0.3);
  P.put(hx - 1, hy + 3, AR.pele, 2); P.put(hx - 2, hy + 3, AR.pele, 2.6);
  const open = k === 4;
  for (let i = 0; i <= 4; i++) { P.put(hx + 2 + i, hy - 1 + (i > 2 ? i - 2 : 0) * 0.6, AR.bico, 4.6 - i * 0.4); if (!open || i < 2) P.put(hx + 2 + i, hy + 0.5 + (i > 2 ? 1 : 0), AR.bico, 3); }
  if (open) { P.put(hx + 3, hy + 2, AR.bico, 3); P.put(hx + 4, hy + 2.5, AR.bico, 2.6); }
  P.put(hx + 1, hy - 1, AR.aviso, 3);
  wing(k === 3 ? 3 : k === 4 ? 2 : k, false);
  return set(P.done());
}

/* ---------- o Condenado da Bola: quadro 26 x 30, o meio dos pés em x 12, os pés na linha 28 ----------
   k 0 parado, 1-2 o passo, 3 girando (o braço erguido), 4 arremesso (o braço à frente), 5 balançando rente (o aviso),
   6 o balanço; a bola e a corrente vêm por fora (pd1CdBola), daqui sai só o corpo */
const CD = [
  { lg: 0, arm: [16, 15], lean: 0 }, { lg: 2, arm: [15, 15], lean: 0.6 }, { lg: -2, arm: [17, 14], lean: 0.6 },
  { lg: 0, arm: [14, 3], lean: -0.6 }, { lg: 1, arm: [20, 9], lean: 1.4 }, { lg: -1, arm: [6, 17], lean: -0.8 }, { lg: 1, arm: [20, 18], lean: 1.4 }
];
function condenado(k) {
  const o = CD[k], P = cp(26, 30), s = 39961 + k * 7, B = 12, F = 28, R = AR.pele, ln = r => Math.round(o.lean * (1 - r / 20));
  // a perna de trás (o grilhão no tornozelo), o braço de trás magro
  rod(P, B - 1, F - 9, B - 2 - o.lg, F, 2, R, 2, s);
  slab(P, B - 4 - o.lg, F - 2, B - o.lg, F - 1, AR.ferro, s + 1, 2.4);
  rod(P, B - 2 + ln(16), F - 18, B - 4 + ln(8), F - 10, 1.5, R, 1.8, s + 2);
  // o tronco magro: as costelas aparecendo, os trapos amarrados na cintura
  for (let y = F - 19; y <= F - 10; y++) for (let x = B - 3; x <= B + 2; x++) P.put(x + ln(F - y), y, R, 3.2 - (x - B) * 0.3 + ((y & 1) && y < F - 13 ? -0.7 : 0) + cg(x, y, s + 3) * 0.3);
  for (let y = F - 10; y <= F - 7; y++) for (let x = B - 4; x <= B + 3; x++) P.put(x + ln(F - y) + (y === F - 7 && (x & 1) ? 1 : 0), y, AR.pano, 3 - (x - B) * 0.2 + cg(x, y, s + 4) * 0.6);
  // a perna da frente
  rod(P, B + 1, F - 9, B + 2 + o.lg, F, 2, R, 3, s + 5);
  P.put(B + 2 + o.lg, F, R, 3.4); P.put(B + 3 + o.lg, F, R, 3);
  // a cabeça: careca, funda, a barba rala, o olho
  const hx = B + ln(24);
  for (let y = F - 25; y <= F - 20; y++) for (let x = hx - 2; x <= hx + 3; x++) if (Math.hypot(x + 0.5 - hx - 0.5, (y + 0.5 - (F - 22.5)) * 1.1) <= 3) P.put(x, y, R, 3.8 - (x - hx) * 0.3 - (y - F + 22) * 0.3);
  P.put(hx + 2, F - 23, AR.aviso, 3); P.put(hx + 1, F - 21, R, 1.2); P.put(hx + 2, F - 20, R, 1.6);
  // o braço da frente (segura a corrente)
  const [ax, ay] = o.arm, sx = B + 1 + ln(16), sy = F - 18, ex = (sx + ax) / 2 + 0.5, ey = (sy + ay) / 2 + 1;
  rod(P, sx, sy, ex, ey, 1.5, R, 3.4, s + 6); rod(P, ex, ey, ax, ay, 1.5, R, 3.6, s + 7);
  slab(P, ax - 1, ay - 1, ax + 1, ay + 1, AR.ferro, s + 8, 3);   // a algema do pulso
  return set(P.done());
}

/* ---------- a Pedra Viva: quadro 24 x 18, o meio dos pés em x 12, os pés na linha 17 ----------
   k 0 dormindo (só uma pedra), 1 levantada (as costas de pedra, um braço de cada lado, o olho), 2 o braço puxado para
   trás (o aviso), 3 o soco */
function pedraviva(k) {
  const P = cp(24, 18), s = 39981 + k * 5, R = AR.viva, B = 12, F = 17;
  if (k === 0) {
    for (let y = F - 9; y <= F; y++) for (let x = B - 9; x <= B + 9; x++) { const dx = (x + 0.5 - B) / 9.4, dy = (y + 0.5 - F) / 9; if (dx * dx + dy * dy <= 1) P.put(x, y, R, 3 - (dx * 0.6 + dy * 0.8) * 1.6 + cg(x >> 1, y >> 1, s) * 0.8); }
    for (let x = B - 4; x <= B + 3; x++) P.put(x, F - 4 + ((x * 3) % 2), R, 1.2);   // a rachadura
    return set(P.done());
  }
  const up = k === 1 ? 0 : 1;
  // a massa: o lombo de pedra, mais alto, com as placas
  for (let y = F - 13; y <= F - 2; y++) for (let x = B - 8; x <= B + 7; x++) { const dx = (x + 0.5 - B) / 8.4, dy = (y + 0.5 - F + 6) / 7; if (dx * dx + dy * dy <= 1) P.put(x, y, R, 3.1 - (dx * 0.6 + dy * 0.8) * 1.5 + cg(x >> 1, y >> 1, s) * 0.7 + ((x - y) % 5 === 0 ? -0.8 : 0)); }
  // as pernas curtas
  for (const fx of [B - 5, B + 3]) slab(P, fx, F - 3, fx + 2, F, R, s + fx, 2.4);
  // o braço de trás e o da frente (o punho de pedra)
  const fx = k === 3 ? B + 13 : k === 2 ? B - 2 : B + 8, fy = k === 3 ? F - 7 : k === 2 ? F - 15 + up : F - 4;
  rod(P, B + 4, F - 9, fx, fy, 3, R, 3.2, s + 2);
  slab(P, fx - 2, fy - 2, fx + 2, fy + 2, R, s + 3, 3.4);
  rod(P, B - 5, F - 9, B - 9, F - 3, 3, R, 2, s + 4);
  // o olho: uma racha funda no meio do lombo (acende no EYES_E)
  P.put(B + 3, F - 10, R, 0.2); P.put(B + 4, F - 10, R, 0.2); P.put(B + 5, F - 10, R, 0.4);
  return set(P.done());
}

PD1.get = () => PD1.ready || (PD1.ready = {
  cc: CC.map((_, k) => carcereiro(k)),
  el: [0, 1, 2, 3].map(elos),
  ag: [0, 1, 2, 3, 4].map(aguia),
  cd: CD.map((_, k) => condenado(k)),
  pv: [0, 1, 2, 3].map(pedraviva)
});
PD1.GL = {
  ambar: glow(4, '#ffb030'), ambarG: glow(10, '#ffb030'), aviso: glow(5, '#ff3a2a'), avisoG: glow(10, '#ff3a2a'), avisoM: glow(16, '#ff3a2a'),
  runa: glow(4, '#5ab0e8'), runaG: glow(9, '#5ab0e8'), viva: glow(6, '#d0402a'), vivaG: glow(12, '#ff6a3a'), branco: glow(8, '#fff0c8'),
  verde: glow(6, '#7ad04a'), verdeG: glow(12, '#7ad04a'), violeta: glow(6, '#b08aff'), violetaG: glow(12, '#b08aff'), icor: glow(8, '#ffcc4a')
};
Object.assign(PD1, { AR, rod, slab, ring, cp, set, CC, CD });
}

/* ================= desenho ================= */
// a figura com o apoio (ax, ay) no meio dos pés quando olha para a direita (o contorno soma 1 px)
function pdBlit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax - 1 : fx - (img.width - ax - 1)) + jx), fy - ay - 1); }
const pdJit = (e, on) => on ? (Math.floor(e.t * 30) % 2 ? 1 : 0) : 0;

const pd1CcPose = e => e.state === 'ergue' ? 3 : e.state === 'golpe' || e.state === 'recupera' ? 4 : e.onGround && Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 4) % 2 : 0;
DRAW_E.carcereiro = (e, fx, fy, fl) => pdBlit(cvPick(PD1.get().cc[pd1CcPose(e)], e, fl), e, fx, fy, 16, 40, pdJit(e, e.state === 'ergue' && e.stateT < 0.2));
EYES_E.carcereiro = (e, fx, fy) => {
  const G = PD1.GL, k = pd1CcPose(e), [ox, oy] = PD1.ccOlho(e, k), hot = e.state === 'ergue' || e.state === 'golpe', x = Math.round(fx + ox * e.facing), y = Math.round(fy + oy);
  lc.globalAlpha = hot ? 0.8 : 0.4; lc.drawImage(hot ? G.avisoG : G.ambar, x - (hot ? 10 : 4), y - (hot ? 10 : 4));
};
WARN_E.carcereiro = e => e.state === 'ergue';

const pd1ElPose = e => e.state === 'enrola' ? 2 : e.state === 'salta' ? 3 : Math.abs(e.vx) > 3 ? (Math.floor(e.t * 4) % 2) : 0;
DRAW_E.elos = (e, fx, fy, fl) => pdBlit(cvPick(PD1.get().el[pd1ElPose(e)], e, fl), e, fx, fy, 8, 10, pdJit(e, e.state === 'enrola'));
EYES_E.elos = (e, fx, fy) => { const G = PD1.GL, hot = e.state === 'enrola' || e.state === 'salta'; lc.globalAlpha = hot ? 0.75 : 0.3; lc.drawImage(hot ? G.runaG : G.runa, Math.round(fx) - (hot ? 9 : 4), Math.round(fy - 5) - (hot ? 9 : 4)); };
WARN_E.elos = e => e.state === 'enrola';

const pd1AgPose = e => e.state === 'mira' ? 4 : e.state === 'mergulha' ? 3 : Math.floor(e.t * (e.state === 'sobe' ? 10 : 7)) % 3;
DRAW_E.aguia = (e, fx, fy, fl) => { const S = PD1.get().ag[pd1AgPose(e)]; const img = cvPick(S, e, fl); lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - e.h / 2 - 15)); };
EYES_E.aguia = (e, fx, fy) => {
  const G = PD1.GL, k = pd1AgPose(e), hot = e.state === 'mira', hx = 7 * e.facing, hy = k === 4 ? -10 : -7;
  lc.globalAlpha = hot ? 0.55 + 0.4 * clamp(1 - e.stateT / PD1_MIRA, 0, 1) : 0.3; lc.drawImage(hot ? G.avisoG : G.aviso, Math.round(fx + hx) - (hot ? 10 : 5), Math.round(fy - e.h / 2 + hy + 4) - (hot ? 10 : 5));
};
WARN_E.aguia = e => e.state === 'mira';

const pd1CdPose = e => e.state === 'gira' ? 3 : e.state === 'arremessa' ? 4 : e.state === 'balanca' ? 5 : e.state === 'varre' ? 6 : e.onGround && Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 6) % 2 : 0;
// a mão do condenado (de onde a corrente sai), em pixels do mundo
function pd1CdMao(e) { const o = PD1.CD[pd1CdPose(e)], cx = e.x + e.w / 2, fy = e.y + e.h; return [cx + (o.arm[0] - 12) * e.facing, fy - (28 - o.arm[1])]; }
DRAW_E.condenado = (e, fx, fy, fl) => {
  pdBlit(cvPick(PD1.get().cd[pd1CdPose(e)], e, fl), e, fx, fy, 12, 28, pdJit(e, e.state === 'gira' && e.stateT < 0.25));
  if (e.bolaFora) return;   // a bola está voando: o 393 desenha ela e a corrente
  // a bola na mão: girando acima da cabeça, balançando rente, ou pendurada
  const [mx, my] = pd1CdMao(e), ox = fx - (e.x + e.w / 2), oy = fy - (e.y + e.h);
  let bx, by;
  if (e.state === 'gira') { const a = e.t * (8 + (PD1_GIRA - e.stateT) * 10); bx = mx + Math.cos(a) * 10; by = my - 4 + Math.sin(a) * 4; }
  else if (e.state === 'balanca') { bx = mx - e.facing * 7; by = e.y + e.h - 4; }
  else if (e.state === 'varre') { bx = mx + e.facing * 10; by = e.y + e.h - 5; }
  else { bx = mx + e.facing * 1; by = Math.min(e.y + e.h - 4, my + 9); }
  pd1Corrente(mx + ox, my + oy, bx + ox, by + oy); pd1Bola(bx + ox, by + oy, fl);
};
EYES_E.condenado = (e, fx, fy) => { const G = PD1.GL, hot = e.state === 'gira' || e.state === 'balanca'; const o = PD1.CD[pd1CdPose(e)], x = Math.round(fx + (Math.round(o.lean * (1 - 24 / 20)) + 2) * e.facing), y = Math.round(fy - 23); lc.globalAlpha = hot ? 0.7 : 0.25; lc.drawImage(hot ? G.avisoG : G.aviso, x - (hot ? 10 : 5), y - (hot ? 10 : 5)); };
WARN_E.condenado = e => e.state === 'gira' || e.state === 'balanca';
// a corrente fina (um elo a cada 3 px) e a bola de ferro (6 px), na tela
function pd1Corrente(x0, y0, x1, y1) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.floor(L / 3));
  for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * Math.min(4, L / 10)); lc.fillStyle = '#0a0a0e'; lc.fillRect(x - 1, y - 1, 3, 2); lc.fillStyle = i & 1 ? '#5e5e6a' : '#3a3a44'; lc.fillRect(x - (i & 1 ? 0 : 1), y - 1 + (i & 1), i & 1 ? 1 : 2, 1); }
}
function pd1Bola(x, y, fl) {
  x = Math.round(x); y = Math.round(y);
  lc.fillStyle = '#0a0a0e'; lc.fillRect(x - 3, y - 4, 7, 9); lc.fillRect(x - 4, y - 3, 9, 7);
  lc.fillStyle = fl ? '#ffffff' : '#3a3a44'; lc.fillRect(x - 3, y - 3, 7, 7);
  lc.fillStyle = fl ? '#ffffff' : '#55555f'; lc.fillRect(x - 3, y - 3, 4, 3); lc.fillRect(x - 2, y - 2, 4, 3);
  lc.fillStyle = fl ? '#ffffff' : '#86868f'; lc.fillRect(x - 2, y - 2, 2, 1);
  lc.fillStyle = fl ? '#ffffff' : '#26262e'; lc.fillRect(x + 1, y + 2, 3, 1); lc.fillRect(x + 3, y, 1, 2);
}

const pd1PvPose = e => e.state === 'dorme' || e.state === 'acorda' || e.state === 'afunda' ? (e.state === 'acorda' && e.stateT < PD1_ACORDA * 0.4 ? 1 : 0) : e.state === 'carrega' ? 2 : e.state === 'soco' || e.state === 'recupera' ? 3 : 1;
DRAW_E.pedraviva = (e, fx, fy, fl) => pdBlit(cvPick(PD1.get().pv[pd1PvPose(e)], e, fl), e, fx, fy, 12, 17, pdJit(e, e.state === 'acorda' || e.state === 'carrega' && e.stateT < 0.2));
EYES_E.pedraviva = (e, fx, fy) => {
  const G = PD1.GL; if (e.state === 'dorme') return;
  const hot = e.state === 'acorda' || e.state === 'carrega', k = pd1PvPose(e);
  lc.globalAlpha = hot ? 0.85 : 0.45; lc.drawImage(hot ? G.vivaG : G.viva, Math.round(fx + (k ? 4 : 0) * e.facing) - (hot ? 12 : 6), Math.round(fy - (k ? 10 : 5)) - (hot ? 12 : 6));
};
WARN_E.pedraviva = e => e.state === 'acorda' || e.state === 'carrega';

/* ================= comportamento ================= */
/* ---------- o Carcereiro: anda devagar, ergue a chave (a marca acende) e bate ---------- */
AI.carcereiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'ergue') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) pd1CcBate(e);
    return;
  }
  if (e.state === 'golpe') { e.vx = 0; if (e.stateT <= 0) { e.state = 'recupera'; e.stateT = 0.55; } return; }
  if (e.state === 'recupera') { e.vx = 0; if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 2.8 * T && Math.abs(dy) < 1.6 * T && clearPath(e, pl)) {
    e.facing = Math.sign(dx) || e.facing; e.state = 'ergue'; e.stateT = PD1_ERGUE;
    const fr = pdFloorRow(e.x + e.w / 2, e.y + e.h - 2), cx = e.x + e.w / 2 + e.facing * 4;
    e.marca = fr >= 0 ? pdMarca(cx, cx + e.facing * 30, fr, PD1_ERGUE) : null;
    sfx.pdErgue(Math.max(0.4, pdNear(e)));
    return;
  }
  let dir = 0;
  if (aggro) dir = Math.abs(dx) > T * 1.4 ? Math.sign(dx) : 0;
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 36 : 18, 300, 240, dy, aggro);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  e.passoT = (e.passoT || 0) - dt;
  if (e.onGround && Math.abs(e.vx) > 8 && e.passoT <= 0) { e.passoT = 0.5; const v = pdNear(e, 200); if (v > 0.05) sfx.pdPassoPedra(v); }
};
function pd1CcBate(e) {
  e.state = 'golpe'; e.stateT = 0.16; e.atkCD = 1.6 + Math.random() * 0.6;
  const cx = e.x + e.w / 2, x0 = Math.min(cx + e.facing * 4, cx + e.facing * 34), fy = e.y + e.h;
  if (pdBoxHits(x0, fy - 28, 30, 28)) hurtPlayer(e.dmg, cx, e, false);
  const tx = cx + e.facing * 26; pdSparks(tx, fy - 2, 8, PD_FAISCA, 70, 200, 0.4); burst(tx, fy - 2, 8, '#6a6050', 60, 300, 0.5);
  const v = pdNear(e, 300); if (v > 0.02) { sfx.pdBaque(v); shake(1.5 + 2.5 * v); }
}

/* ---------- os Elos Soltos: rastejam, se enrolam e saltam ---------- */
AI.elos = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'enrola') {
    e.vx = 0;
    if (e.stateT <= 0) {
      e.state = 'salta'; e.stateT = 0.8; e.mordeu = false;
      const d = clamp(Math.abs(dx), T, 4.5 * T); e.vx = e.facing * (d / 0.42); e.vy = -250; e.onGround = false;
      sfx.pdElosSalta(Math.max(0.3, pdNear(e)));
    }
    return;
  }
  if (e.state === 'salta') {
    if (!e.mordeu && overlap(e, pl) && !pl.dead) { e.mordeu = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    if ((e.onGround && e.stateT < 0.7) || e.stateT <= 0) { e.state = 'recupera'; e.stateT = 0.6; e.vx = 0; }
    return;
  }
  if (e.state === 'recupera') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && e.onGround && dist < 4.5 * T && Math.abs(dy) < 2 * T && e.sees) {
    e.facing = Math.sign(dx) || e.facing; e.state = 'enrola'; e.stateT = PD1_ENROLA; e.atkCD = 1.4 + Math.random() * 0.8;
    sfx.pdChocalha(Math.max(0.3, pdNear(e)));
    return;
  }
  // a lagarta: anda em puxões (meio segundo indo, um quarto parado)
  e.lag = ((e.lag || 0) + dt) % 0.75;
  let dir = 0;
  if (aggro) dir = Math.abs(dx) > 6 ? Math.sign(dx) : 0; else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, e.lag < 0.5 ? dir : 0, aggro ? 46 : 20, 500, 200, dy, aggro);
  if (dir) e.facing = dir;
};

/* ---------- a Águia do Suplício: roda por cima, grita e mergulha ---------- */
AI.aguia = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'mira') {
    e.vx = approach(e.vx, 0, 400 * dt); e.vy = approach(e.vy, 0, 400 * dt);
    if (e.stateT > 0.15) { e.alvoX = pcx; e.alvoY = pcy; e.facing = Math.sign(pcx - ecx) || e.facing; }
    if (e.stateT <= 0) {
      const a = Math.atan2(e.alvoY - ecy, e.alvoX - ecx); e.vx = Math.cos(a) * 280; e.vy = Math.sin(a) * 280;
      e.state = 'mergulha'; e.stateT = 0.85; e.feriu = false; sfx.pdMergulho(Math.max(0.4, pdNear(e)));
    }
    return;
  }
  if (e.state === 'mergulha') {
    if (!e.feriu && overlap(e, pl) && !pl.dead) { e.feriu = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.hitWall || e.hitCeil || e.onGround) {   // bateu na pedra: fica tonta
      e.state = 'sobe'; e.stateT = 1.1; e.stun = 0.7; e.vx = -e.vx * 0.2; e.vy = -40;
      burst(ecx, ecy, 8, '#4a3214', 60, 200, 0.5); const v = pdNear(e, 260); if (v > 0.05) sfx.pdBaque(v * 0.6);
      return;
    }
    if (e.stateT <= 0 || (e.feriu && e.stateT < 0.5)) { e.state = 'sobe'; e.stateT = 1.0; }
    return;
  }
  if (e.state === 'sobe') { e.vy = approach(e.vy, -110, 500 * dt); e.vx = approach(e.vx, e.facing * 40, 300 * dt); if (e.stateT <= 0) { e.state = 'roda'; e.stateT = 0; } return; }
  e.state = 'roda';
  // a roda: um ponto acima do herói que gira devagar (ou em volta de casa, sem herói)
  const th = e.t * 0.9 + e.seed;
  const gx = aggro ? pcx + Math.sin(th) * 4.5 * T : e.homeX + Math.sin(th) * 4 * T, gy = aggro ? pcy - 5 * T + Math.cos(th * 1.3) * T : e.homeY + Math.cos(th) * 1.5 * T;
  e.vx = approach(e.vx, clamp((gx - ecx) * 1.6, -90, 90), 160 * dt); e.vy = approach(e.vy, clamp((gy - ecy) * 1.6, -80, 80), 160 * dt);
  if (Math.abs(e.vx) > 6) e.facing = Math.sign(e.vx);
  if (aggro && e.atkCD <= 0 && e.sees && dist < 11 * T && dist > 2 * T && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'mira'; e.stateT = PD1_MIRA; e.alvoX = pcx; e.alvoY = pcy; e.atkCD = 2.4 + Math.random() * 0.8;
    sfx.pdGrito(Math.max(0.4, pdNear(e, 300)));
  }
  e.asaT = (e.asaT ?? Math.random()) - dt;
  if (e.asaT <= 0) { e.asaT = 0.43; const v = pdNear(e, 200); if (v > 0.1) sfx.pdAsa(v * 0.5); }
};

/* ---------- o Condenado da Bola: fica longe, gira e arremessa a bola, puxa de volta ---------- */
AI.condenado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'gira') {
    e.vx = approach(e.vx, 0, 500 * dt); e.facing = Math.sign(dx) || e.facing;
    e.zuT = (e.zuT || 0) - dt; if (e.zuT <= 0) { e.zuT = 0.22; sfx.pdZunido(Math.max(0.3, pdNear(e)), 1 + (PD1_GIRA - e.stateT)); }
    if (e.stateT <= 0) pd1CdLanca(e, pcx, pcy);
    return;
  }
  if (e.state === 'arremessa') { e.vx = 0; if (e.stateT <= 0) e.state = 'puxa'; return; }
  if (e.state === 'puxa') { e.vx = 0; if (!e.bolaFora) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; } return; }
  if (e.state === 'balanca') { e.vx = 0; if (e.stateT <= 0) pd1CdVarre(e); return; }
  if (e.state === 'varre') { e.vx = 0; if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && e.onGround) {
    if (Math.abs(dx) < 3 * T && Math.abs(dy) < 1.5 * T) { e.facing = Math.sign(dx) || e.facing; e.state = 'balanca'; e.stateT = PD1_BALANCA; sfx.pdZunido(Math.max(0.4, pdNear(e)), 0.8); return; }
    if (dist > 3 * T && dist < 10 * T && e.sees && clearPath(e, pl)) { e.facing = Math.sign(dx) || e.facing; e.state = 'gira'; e.stateT = PD1_GIRA; return; }
  }
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < 4 * T ? -Math.sign(dx) : adx > 8 * T || !e.sees ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 44 : 20, 400, 260, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
};
function pd1CdLanca(e, px, py) {
  e.state = 'arremessa'; e.stateT = 0.3;
  const [mx, my] = pd1CdMao(e), d = Math.hypot(px - mx, py - my), tf = clamp(d / 210, 0.45, 1.05), v = pdArco(mx, my - 4, px, py, 600, tf);
  e.bolaFora = pdTiro({ kind: 'bola', x: mx, y: my - 4, vx: v.vx, vy: v.vy, g: 600, r: 4, dmg: e.dmg, src: e, life: 3, rolando: false });
  sfx.pdArremesso(Math.max(0.4, pdNear(e)));
}
function pd1CdVarre(e) {
  e.state = 'varre'; e.stateT = 0.4; e.atkCD = 1.5 + Math.random() * 0.5;
  const cx = e.x + e.w / 2, fy = e.y + e.h, x0 = Math.min(cx, cx + e.facing * 38);
  if (pdBoxHits(x0, fy - 12, 38, 12)) hurtPlayer(e.dmg, cx, e, false);
  burst(cx + e.facing * 20, fy - 2, 6, '#6a6050', 60, 300, 0.4); sfx.pdBaque(Math.max(0.3, pdNear(e)) * 0.6);
}

/* ---------- a Pedra Viva: dorme, acorda, anda, carrega o soco, afunda ---------- */
AI.pedraviva = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'dorme') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (!pl.dead && dist < 5 * T && Math.abs(dy) < 3 * T && e.sees) pd1PvAcorda(e);
    return;
  }
  if (e.state === 'acorda') { e.vx = 0; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'walk'; e.calmo = 0; e.atkCD = Math.max(e.atkCD, 0.3); } return; }
  if (e.state === 'afunda') { e.vx = 0; if (e.stateT <= 0) e.state = 'dorme'; return; }
  if (e.state === 'carrega') { e.vx = 0; if (e.stateT <= 0) pd1PvSoca(e); return; }
  if (e.state === 'soco') { e.vx = 0; if (e.stateT <= 0) { e.state = 'recupera'; e.stateT = 0.7; } return; }
  if (e.state === 'recupera') { e.vx = 0; if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  e.calmo = aggro ? 0 : (e.calmo || 0) + dt;
  if (e.calmo > 6) { e.state = 'afunda'; e.stateT = 0.8; sfx.pdAfunda(Math.max(0.2, pdNear(e))); return; }
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 2.4 * T && Math.abs(dy) < 1.5 * T) {
    e.facing = Math.sign(dx) || e.facing; e.state = 'carrega'; e.stateT = PD1_CARREGA;
    const fr = pdFloorRow(e.x + e.w / 2, e.y + e.h - 2), cx = e.x + e.w / 2 + e.facing * 6;
    e.marca = fr >= 0 ? pdMarca(cx, cx + e.facing * 22, fr, PD1_CARREGA) : null;
    sfx.pdRange(Math.max(0.4, pdNear(e)));
    return;
  }
  const dir = aggro && Math.abs(dx) > T * 1.4 ? Math.sign(dx) : 0;
  walk(e, dt, dir, 24, 200, 230, dy, aggro);
  if (dir) e.facing = dir;
};
function pd1PvAcorda(e) { e.state = 'acorda'; e.stateT = PD1_ACORDA; sfx.pdRacha(Math.max(0.4, pdNear(e))); burst(e.x + e.w / 2, e.y + e.h - 4, 8, '#643a32', 40, 300, 0.5); }
function pd1PvSoca(e) {
  e.state = 'soco'; e.stateT = 0.18; e.atkCD = 1.8 + Math.random() * 0.6;
  const cx = e.x + e.w / 2, fy = e.y + e.h, x0 = Math.min(cx + e.facing * 4, cx + e.facing * 28);
  if (pdBoxHits(x0, fy - 16, 24, 16)) hurtPlayer(e.dmg, cx, e, false);
  burst(cx + e.facing * 18, fy - 4, 8, '#643a32', 70, 300, 0.4); pdSparks(cx + e.facing * 18, fy - 6, 5, ['#ff6a3a', '#ffb08a'], 60, 100, 0.35);
  const v = pdNear(e, 260); if (v > 0.02) { sfx.pdBaque(v * 0.8); shake(1 + 1.5 * v); }
}

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'pedraviva' && !e.dead && e.state === 'dorme') { mult = (mult || 1) * 0.5; const r = _hit(e, dir, mult, melee); if (!e.dead) { pd1PvAcorda(e); e.stun = 0; } pdSparks(e.x + e.w / 2, e.y + e.h / 2, 6, PD_FAISCA, 60, 120, 0.3); return r; }
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (!e || !PD1_TYPES.includes(e.type)) return r;
  if (e.hp < hp0 && (e.type === 'carcereiro' || e.type === 'pedraviva')) { pdSparks(e.x + e.w / 2, e.y + e.h / 2, 5, PD_FAISCA, 60, 120, 0.3); sfx.pdGolpePedra(0.7); }
  if (e.dead) return r;
  if (e.type === 'carcereiro') e.stun = Math.min(e.stun, e.state === 'ergue' || e.state === 'golpe' ? 0 : 0.12);
  else if (e.type === 'pedraviva') e.stun = Math.min(e.stun, e.state === 'carrega' || e.state === 'soco' ? 0 : 0.1);
  else if (e.type === 'aguia' && e.state === 'mira' && e.stun > 0) { e.state = 'sobe'; e.stateT = 0.7; e.atkCD = Math.max(e.atkCD, 1); }   // o golpe corta o grito
  else if (e.type === 'condenado' && (e.state === 'gira' || e.state === 'balanca') && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  else if (e.type === 'elos' && e.state === 'enrola' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!PD1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, pdNear(e, 260));
  if (e.type === 'carcereiro' || e.type === 'pedraviva') { burst(cx, e.y + e.h, 14, e.type === 'pedraviva' ? '#4c2824' : '#4e463a', 70, 300, 0.7); sfx.pdMorrePedra(v); }
  else if (e.type === 'elos') { pdSparks(cx, cy, 6, ['#5ab0e8', '#a8dcff'], 50, 0, 0.5); sfx.pdElosMorre(v); }
  else if (e.type === 'aguia') { burst(cx, cy, 12, '#4a3214', 60, 120, 0.9); sfx.pdAguiaMorre(v); }
  else { sfx.pdMorre(v); }
  if (e.type === 'condenado' && e.bolaFora) e.bolaFora.solta = true;
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !PD1_TYPES.includes(type)) return e;
  if (!ET[type].fly) for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  e.state = type === 'pedraviva' ? 'dorme' : type === 'aguia' ? 'roda' : 'walk';
  // os elos vêm em bando de três
  if (type === 'elos' && !pdGrupoSpawn) {
    pdGrupoSpawn = true;
    try { for (let k = 0; k < 2; k++) { const x = px + (k ? -1 : 1) * (8 + Math.random() * 10); if (!rectSolid(x, py, e.w, e.h)) spawnEnemy('elos', x, py, zone); } } finally { pdGrupoSpawn = false; }
  }
  return e;
}; }
let pdGrupoSpawn = false;

/* ---------- a cada quadro: os tiros, as marcas, as ondas, as poças, as faíscas ---------- */
function pdUpdate(dt) {
  for (let i = pdTiros.length - 1; i >= 0; i--) {
    const S = pdTiros[i]; S.t += dt;
    if (pdTiroTick(S, dt)) pdTiros.splice(i, 1);
  }
  for (let i = pdMarcas.length - 1; i >= 0; i--) { const M = pdMarcas[i]; M.t += dt; if (M.t > M.max + 0.25) pdMarcas.splice(i, 1); }
  // as ondas: correm rente ao chão; quem está de pé no chão onde ela passa leva (pular por cima escapa)
  for (let i = pdOndas.length - 1; i >= 0; i--) {
    const O = pdOndas[i]; O.t += dt; const nx = O.x + O.dir * O.sp * dt;
    const tx = Math.floor(nx / T);
    if (Math.abs(nx - O.x0) > O.dist || solidAt(tx, O.fr - 1) || !solidAt(tx, O.fr)) { pdOndas.splice(i, 1); continue; }
    O.x = nx;
    if (!O.hit && !pl.dead && Math.abs(pl.x + pl.w / 2 - O.x) < 6 && pl.y + pl.h > O.fr * T - 14 && pl.y + pl.h <= O.fr * T + 2) { O.hit = true; hurtPlayer(O.dmg, O.x - O.dir * 10, null, true); }
    if (Math.random() < dt * 30) burst(O.x, O.fr * T - 1, 1, '#6a6050', 40, 300, 0.4);
  }
  // as poças de veneno: quem pisa leva um pouco a cada 0,6 s
  for (let i = pdPocas.length - 1; i >= 0; i--) {
    const Q = pdPocas[i]; Q.t += dt; if (Q.t > Q.max) { pdPocas.splice(i, 1); continue; }
    Q.cd -= dt;
    if (Q.cd <= 0 && !pl.dead && pl.x + pl.w > Q.x0 && pl.x < Q.x1 && Math.abs(pl.y + pl.h - Q.fr * T) < 3) { Q.cd = 0.6; hurtPlayer(Q.dmg, (Q.x0 + Q.x1) / 2, null, true); }
  }
  for (let i = pdFx.length - 1; i >= 0; i--) { const p = pdFx[i]; p.life -= dt; if (p.life <= 0) { pdFx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
}
HOOK.update.push(pdUpdate);
// um tiro anda; true quando acabou
function pdTiroTick(S, dt) {
  const src = S.src;
  if (S.kind === 'bola') {
    // a bola voa em arco; no chão rola um pouco e para; depois o condenado puxa de volta pela corrente
    const dono = pdLive(src) ? src : null;
    if (S.solta || !dono) { S.life -= dt; if (S.life <= 0) return true; }
    if (S.volta) {
      if (!dono) return true;
      const [mx, my] = pd1CdMao(dono), d = Math.hypot(mx - S.x, my - S.y);
      if (d < 8) { dono.bolaFora = null; return true; }
      const sp = 260; S.x += (mx - S.x) / d * sp * dt; S.y += (my - S.y) / d * sp * dt;
      return false;
    }
    if (S.rolando) {
      S.vx = approach(S.vx, 0, 220 * dt); const nx = S.x + S.vx * dt;
      if (!solidAt(Math.floor(nx / T), Math.floor(S.y / T))) S.x = nx; else S.vx = 0;
      S.parado = (S.parado || 0) + (Math.abs(S.vx) < 5 ? dt : 0);
      if (S.parado > 0.5 && dono) { S.volta = true; sfx.pdPuxa(Math.max(0.3, pdNearP(S.x, S.y))); }
      return false;
    }
    S.vy += S.g * dt; const nx = S.x + S.vx * dt, ny = S.y + S.vy * dt;
    if (dono && Math.hypot(nx - (dono.x + dono.w / 2), ny - dono.y) > 11 * T) { S.vx *= 0.3; S.vy = Math.max(0, S.vy); }   // a corrente acabou
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) {
      if (S.vy > 0 && !solidAt(Math.floor(nx / T), Math.floor(S.y / T))) { S.y = Math.floor(ny / T) * T - 4; S.x = nx; S.rolando = true; S.vx *= 0.5; burst(S.x, S.y + 3, 6, '#6a6050', 50, 300, 0.4); const v = pdNearP(S.x, S.y); if (v > 0.03) { sfx.pdBaque(v * 0.7); shake(v * 2); } }
      else { S.vx = -S.vx * 0.3; }
      return false;
    }
    S.x = nx; S.y = ny;
    if (!S.hit && pdHeroIn(S.x, S.y, 4)) { S.hit = true; hurtPlayer(S.dmg, S.x - Math.sign(S.vx) * 8, null, true); S.vx *= -0.3; }
    return false;
  }
  if (S.kind === 'gancho') return pdGanchoTick(S, dt);
  // os outros: andam (com ou sem peso) e acabam na pedra, no herói ou no fim da vida
  S.life -= dt; if (S.life <= 0) { if (S.onEnd) S.onEnd(S, S.x, S.y, false); return true; }
  S.vy += S.g * dt; const nx = S.x + S.vx * dt, ny = S.y + S.vy * dt;
  if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { if (S.onEnd) S.onEnd(S, S.x, S.y, true); return true; }
  S.x = nx; S.y = ny;
  S.trail.push(S.x, S.y); if (S.trail.length > 12) S.trail.splice(0, 2);
  if (pdHeroIn(S.x, S.y, S.r)) { hurtPlayer(S.dmg, S.x - Math.sign(S.vx || 1) * 6, null, true); if (S.onEnd) S.onEnd(S, S.x, S.y, false, true); return true; }
  return false;
}
// o gancho do acorrentador (394 põe a lógica de puxar): aqui só o voo e a volta
let pdGanchoTick = S => true;
function clearPdFx() { pdTiros.length = 0; pdMarcas.length = 0; pdOndas.length = 0; pdPocas.length = 0; pdFx.length = 0; for (const e of enemies) if (e.bolaFora) e.bolaFora = null; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearPdFx(); pd1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: os olhos acesos no aviso, a pedra viva acordando, os tiros que brilham
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.state === 'ergue' || e.state === 'carrega' || e.state === 'acorda' || e.state === 'mira' || e.state === 'gira' || e.state === 'enrola') addL(e.x + e.w / 2, e.y + 4, 0.28);
  }
  for (const S of pdTiros) if (S.kind === 'gemido' || S.kind === 'veneno') addL(S.x, S.y, 0.35);
  for (const Q of pdPocas) addL((Q.x0 + Q.x1) / 2, Q.fr * T - 3, 0.25);
}; }

// a luz aditiva: as marcas, os tiros acesos, as faíscas
HOOK.drawGlow.push((cx, cy) => {
  const G = PD1.GL;
  for (const M of pdMarcas) {
    const q = clamp(M.t / M.max, 0, 1), y = M.fr * T - cy - 3, fall = M.t > M.max;
    lc.globalAlpha = fall ? 0.6 * (1 - (M.t - M.max) / 0.25) : 0.12 + q * 0.2;
    for (let x = M.x0; x <= M.x1; x += 8) lc.drawImage(fall ? G.branco : G.aviso, Math.round(x - cx) - (fall ? 8 : 5), Math.round(y) - (fall ? 8 : 5));
  }
  for (const S of pdTiros) {
    if (S.kind === 'gemido') { lc.globalAlpha = 0.6; lc.drawImage(G.violetaG, Math.round(S.x - cx) - 12, Math.round(S.y - cy) - 12); }
    else if (S.kind === 'veneno') { lc.globalAlpha = 0.5; lc.drawImage(G.verdeG, Math.round(S.x - cx) - 12, Math.round(S.y - cy) - 12); }
    else if (S.kind === 'gancho') { lc.globalAlpha = 0.4; lc.drawImage(G.branco, Math.round(S.x - cx) - 8, Math.round(S.y - cy) - 8); }
  }
  for (const Q of pdPocas) { lc.globalAlpha = 0.25 * (1 - Q.t / Q.max); for (let x = Q.x0; x < Q.x1; x += 10) lc.drawImage(G.verde, Math.round(x - cx) - 6 + 5, Math.round(Q.fr * T - cy) - 8); }
  for (const p of pdFx) { const g = pdFxGl[p.col] || (pdFxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): a bola voando e a corrente até a mão
HOOK.drawWorld.push((cx, cy) => {
  for (const S of pdTiros) {
    if (S.kind !== 'bola') continue;
    const d = pdLive(S.src) ? S.src : null;
    if (d) { const [mx, my] = pd1CdMao(d); pd1Corrente(mx - cx, my - cy, S.x - cx, S.y - cy); }
    pd1Bola(S.x - cx, S.y - cy, false);
  }
});
// por cima do escuro: as marcas no chão, a mira da águia, as ondas, as poças, os tiros acesos, as faíscas
HOOK.drawTop.push((cx, cy) => {
  const blink = Math.floor(gameTime * 14) % 2;
  for (const M of pdMarcas) {
    const q = clamp(M.t / M.max, 0, 1), y = M.fr * T - cy, fall = M.t > M.max, late = !fall && M.max - M.t < 0.2;
    lc.globalAlpha = fall ? 1 - (M.t - M.max) / 0.25 : late && blink ? 0.5 : 0.9;
    const x0 = Math.round(M.x0 - cx), x1 = Math.round(M.x1 - cx), w = x1 - x0;
    lc.fillStyle = fall ? '#fff0c8' : PD_COL.aviso; lc.fillRect(x0, y - 1, w, 1);
    lc.fillStyle = fall ? '#ffffff' : PD_COL.avisoC; lc.fillRect(x0, y - 2, Math.round(w * (fall ? 1 : q)), 1);
    if (!fall) { lc.fillStyle = PD_COL.aviso; for (let x = x0; x <= x1; x += 6) lc.fillRect(x, y - 4 - Math.round(q * 3), 1, 2 + Math.round(q * 2)); lc.fillRect(x0, y - 6, 1, 5); lc.fillRect(x1, y - 6, 1, 5); }
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'aguia' || e.state !== 'mira') continue;
    // a mira da águia: um losango vermelho no alvo, cheio quando trava
    const x = Math.round(e.alvoX - cx), y = Math.round(e.alvoY - cy), lock = e.stateT <= 0.15;
    lc.globalAlpha = lock && blink ? 0.5 : 0.9; lc.fillStyle = lock ? '#ffffff' : PD_COL.aviso;
    for (let k = 0; k <= 4; k++) { lc.fillRect(x - 5 + k, y - k, 1, 1); lc.fillRect(x + 5 - k, y - k, 1, 1); lc.fillRect(x - 5 + k, y + k, 1, 1); lc.fillRect(x + 5 - k, y + k, 1, 1); }
    if (lock) lc.fillRect(x, y, 1, 1);
  }
  for (const O of pdOndas) {
    const x = Math.round(O.x - cx), y = O.fr * T - cy;
    lc.globalAlpha = 0.95; lc.fillStyle = '#fff0c8'; lc.fillRect(x - 1, y - 5, 3, 4); lc.fillStyle = PD_COL.avisoC; lc.fillRect(x - 3 * O.dir, y - 3, 2, 2); lc.fillRect(x - 6 * O.dir, y - 2, 2, 1);
  }
  for (const Q of pdPocas) {
    const k = 1 - Q.t / Q.max, y = Q.fr * T - cy;
    lc.globalAlpha = 0.85 * Math.min(1, k * 3); lc.fillStyle = '#4a8a2a'; lc.fillRect(Math.round(Q.x0 - cx), y - 2, Math.round(Q.x1 - Q.x0), 2);
    lc.fillStyle = '#9ae060'; for (let x = Q.x0 + 2; x < Q.x1 - 1; x += 5) if ((Math.floor(gameTime * 3 + x) % 4) === 0) lc.fillRect(Math.round(x - cx), y - 3 - (Math.floor(gameTime * 6 + x) % 3), 1, 1);
  }
  for (const S of pdTiros) {
    if (S.kind === 'gemido') {
      const x = Math.round(S.x - cx), y = Math.round(S.y - cy);
      for (let j = 0; j < S.trail.length; j += 2) { lc.globalAlpha = (j + 2) / S.trail.length * 0.6; lc.fillStyle = '#8a5ad8'; lc.fillRect(Math.round(S.trail[j] - cx), Math.round(S.trail[j + 1] - cy), 1, 1); }
      lc.globalAlpha = 1; lc.fillStyle = '#2e1a4a'; lc.fillRect(x - 2, y - 2, 5, 5); lc.fillStyle = '#b08aff'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#ffffff'; lc.fillRect(x, y - 1, 1, 1);
    } else if (S.kind === 'veneno') {
      const x = Math.round(S.x - cx), y = Math.round(S.y - cy);
      lc.globalAlpha = 1; lc.fillStyle = '#1a3a0e'; lc.fillRect(x - 2, y - 2, 4, 4); lc.fillStyle = '#7ad04a'; lc.fillRect(x - 1, y - 1, 2, 2); lc.fillStyle = '#d8ffb0'; lc.fillRect(x - 1, y - 1, 1, 1);
    } else if (S.kind === 'pedra') {
      const x = Math.round(S.x - cx), y = Math.round(S.y - cy);
      lc.globalAlpha = 1; lc.fillStyle = '#0a0808'; lc.fillRect(x - 4, y - 4, 9, 9); lc.fillStyle = '#3c3444'; lc.fillRect(x - 3, y - 3, 7, 7); lc.fillStyle = '#6c6074'; lc.fillRect(x - 3, y - 3, 3, 2); lc.fillStyle = '#26202e'; lc.fillRect(x + 1, y + 1, 3, 3);
    }
  }
  for (const p of pdFx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); }
  lc.globalAlpha = 1;
});

/* ---------- sons: pedra, ferro e asa; o grito da águia é a única voz ---------- */
Object.assign(sfx, {
  pdPassoPedra(v = 1) { tone(80, 0.12, 'sine', 0.05 * v, -30); noise(0.08, 0.04 * v, 500, 'lowpass'); },
  pdErgue(v = 1) { noise(0.6, 0.04 * v, 700, 'bandpass', 0, 2); tone(140, 0.6, 'triangle', 0.025 * v, 120); },
  pdBaque(v = 1) { noise(0.3, 0.14 * v, 450, 'lowpass'); tone(70, 0.35, 'sine', 0.1 * v, -35); noise(0.06, 0.05 * v, 3200, 'highpass'); },
  pdGolpePedra(v = 1) { noise(0.08, 0.06 * v, 2200, 'bandpass', 0, 2); tone(900 + Math.random() * 400, 0.12, 'sine', 0.012 * v, -200); },
  pdMorrePedra(v = 1) { noise(0.7, 0.12 * v, 500, 'lowpass'); tone(60, 0.7, 'sine', 0.07 * v, -25); for (let k = 0; k < 4; k++) noise(0.06, 0.04 * v, 1500, 'bandpass', k * 0.09, 3); },
  pdChocalha(v = 1) { for (let k = 0; k < 6; k++) tone(1800 + Math.random() * 1200, 0.03, 'square', 0.008 * v, -400, k * 0.06); },
  pdElosSalta(v = 1) { for (let k = 0; k < 3; k++) tone(1400 + k * 300, 0.04, 'triangle', 0.012 * v, 0, k * 0.03); noise(0.1, 0.03 * v, 2500, 'highpass'); },
  pdElosMorre(v = 1) { for (let k = 0; k < 6; k++) tone(2600 - k * 280, 0.06, 'triangle', 0.012 * v, -200, k * 0.05); },
  pdGrito(v = 1) { tone(1700, 0.5, 'sawtooth', 0.025 * v, -900); tone(2400, 0.4, 'square', 0.008 * v, -1200, 0.05); noise(0.4, 0.03 * v, 3000, 'bandpass', 0, 2); },
  pdMergulho(v = 1) { noise(0.7, 0.06 * v, 1200, 'bandpass', 0, 0.8); tone(600, 0.6, 'sine', 0.01 * v, -300); },
  pdAsa(v = 1) { noise(0.12, 0.03 * v, 700, 'lowpass'); },
  pdAguiaMorre(v = 1) { tone(1400, 0.6, 'sawtooth', 0.02 * v, -1100); noise(0.5, 0.05 * v, 900, 'lowpass'); },
  pdZunido(v = 1, p = 1) { noise(0.18, 0.04 * v, 400 + p * 500, 'bandpass', 0, 1.5); },
  pdArremesso(v = 1) { noise(0.25, 0.06 * v, 800, 'bandpass', 0, 1); tone(220, 0.2, 'triangle', 0.02 * v, -120); for (let k = 0; k < 4; k++) tone(1200 + k * 150, 0.03, 'square', 0.006 * v, 0, 0.05 + k * 0.04); },
  pdPuxa(v = 1) { for (let k = 0; k < 8; k++) tone(900 + Math.random() * 500, 0.03, 'square', 0.006 * v, -200, k * 0.07); },
  pdRacha(v = 1) { noise(0.4, 0.08 * v, 900, 'bandpass', 0, 2); tone(110, 0.5, 'sawtooth', 0.02 * v, -40); for (let k = 0; k < 3; k++) noise(0.05, 0.05 * v, 2600, 'highpass', 0.1 + k * 0.12); },
  pdRange(v = 1) { noise(0.55, 0.05 * v, 600, 'bandpass', 0, 2); tone(95, 0.55, 'sawtooth', 0.02 * v, 40); },
  pdAfunda(v = 1) { noise(0.7, 0.05 * v, 300, 'lowpass'); tone(70, 0.7, 'sine', 0.04 * v, -30); },
  pdMorre(v = 1) { noise(0.4, 0.06 * v, 700, 'lowpass'); tone(160, 0.5, 'sine', 0.03 * v, -90); }
});
