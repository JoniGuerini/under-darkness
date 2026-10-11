'use strict';

/* ================= o Ossário dos Titãs: os nascidos dos titãs =================
   Cinco dos dez bichos da décima quarta camada (docs/camadas/12-ossario-titas.md, seção 6; os carniceiros estão no
   284). Os nascidos são a cria miúda dos titãs: grandes para o herói, pequenos perto dos ossos dos pais. Pele de
   pedra cinza-ocre, bronze velho, pano de pele seca; os avisos acendem em branco-osso e no frio da adamantita.
   - o Ciclope Jovem (ciclope), corcunda e pesado, um olho só; para e fareja com o olho piscando. Agacha e enfia os
     dedos no chão (as pedrinhas tremem, 1 s), arranca uma pedra e a ROLA pelo chão: a pedra segue o terreno, desce
     rampas e se parte na parede;
   - o Hecatônquiro Menor (hecaton), anda de lado com os seis braços abertos. Os braços acendem um a um na ordem em que
     vão bater (0,3 s cada) e ele solta os socos na mesma ordem. Os de cima só acertam quem está no ar, os do meio quem
     está em pé, os de baixo varrem o chão (pula-se por cima): quem lê a ordem desvia;
   - a Mão do Enterrado (maoterra), a mão de um gigante enterrado. Não anda: muda de lugar por baixo do pó, devagar (só
     um risco de pó andando). O pó levanta num círculo de 3 blocos e os dedos saem (0,8 s); quem fica dentro é AGARRADO,
     espremido e jogado contra o chão. Só dá para acertá-la com os dedos de fora;
   - a Titânide Menor (titanide), flutua um palmo acima do chão, sempre em linha reta, sem pular. Bate o cajado de osso
     no chão e uma rachadura branca corre pelo chão até onde o herói está (dá para ver vindo) e solta uma fileira de
     espinhos de osso;
   - a Erínia (erinia), voa sempre para o lado de trás do herói e troca de lado quando ele vira. Só ataca pelas costas:
     o chicote estala no ar uma vez (o aviso) e depois corta; se o herói vira de frente, ela recua.
   O 285 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno), rampas de
   6 tons com luz de cima à esquerda; brilhos pelo HOOK.drawGlow e EYES_E. As peças comuns (TTB: tintas, formas,
   faíscas, sons) ficam aqui e o 284 usa. Prefixo tt1. */

Object.assign(ET, {
  ciclope: { name: 'Ciclope Jovem', w: 14, h: 30, hp: 240, dmg: 28, xp: 50, kb: 0.15, fly: false, blood: '#8a5a3a' },
  hecaton: { name: 'Hecatônquiro Menor', w: 14, h: 26, hp: 150, dmg: 14, xp: 40, kb: 0.4, fly: false, blood: '#8a5a3a' },
  maoterra: { name: 'Mão do Enterrado', w: 22, h: 18, hp: 180, dmg: 24, xp: 40, kb: 0, fly: true, phase: true, blood: '#a89e88' },
  titanide: { name: 'Titânide Menor', w: 10, h: 26, hp: 85, dmg: 21, xp: 32, kb: 0.6, fly: true, blood: '#b8a488' },
  erinia: { name: 'Erínia', w: 10, h: 14, hp: 80, dmg: 17, xp: 30, kb: 0.8, fly: true, blood: '#5a1a2a' }
});
const TT1_TYPES = ['ciclope', 'hecaton', 'maoterra', 'titanide', 'erinia'];
// materiais e bases do 288; filtradas agora e de novo a cada mundo
const TT1_DROPS = {
  ciclope: [['olho_ciclope', 0.12], ['dente_tita', 0.3], ['tutano', 0.25], ['min_adamantita', 0.1], ['pocao', 0.08], ['maca_femur', 0.012], ['elmo_cranio', 0.012]],
  hecaton: [['tutano', 0.35], ['tendao', 0.3], ['min_adamantita', 0.08], ['pocao', 0.08], ['escudo_omoplata', 0.012]],
  maoterra: [['tendao', 0.4, 1, 2], ['dente_tita', 0.2], ['min_adamantita', 0.12], ['pocao', 0.06], ['escudo_omoplata', 0.012]],
  titanide: [['tutano', 0.3], ['min_adamantita', 0.1], ['pocao', 0.1], ['pocao_mana', 0.08], ['elmo_cranio', 0.012]],
  erinia: [['tendao', 0.3], ['min_adamantita', 0.06], ['pocao', 0.08]]
};
function tt1Tables() { for (const k of TT1_TYPES) DROPS[k] = TT1_DROPS[k].filter(([id]) => ITEMS[id]); }
tt1Tables();
Object.assign(NAV_WALKERS, { ciclope: 1, hecaton: 1 });
Object.assign(CV_STEP, { ciclope: 1, hecaton: 1 });

const TT1_CAVA = 1, TT1_BRACO = 0.3, TT1_PO = 0.8, TT1_CAJADO = 0.6, TT1_ESTALO = 0.45;
const TT1_PEDRA_SP = 120, TT1_RACHA_SP = 150, TT1_GARRA_R = 3 * T;

/* ================= peças comuns (o 284 usa) ================= */
const TTB = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const TR = {
  pele: R6(['#221c18', '#3e342c', '#625446', '#8a7860', '#ae9c80', '#d0c0a2']),       // a pele de pedra dos nascidos
  bronzeP: R6(['#24160c', '#462c18', '#6a4426', '#8e6034', '#b28048', '#d4a668']),    // a pele de bronze do hecatônquiro
  marmore: R6(['#3a3630', '#625c52', '#8e877a', '#b6afa0', '#d8d2c4', '#f4f0e6']),    // a titânide
  cabelo: R6(['#0e0c0a', '#1e1a16', '#2e2822', '#443a30', '#5e5044', '#7a6a5a']),
  pano: R6(['#2a1c14', '#46301e', '#64462c', '#84603c', '#a47c52', '#c49c70']),       // pele seca, couro
  osso: R6(['#3a352a', '#5a5444', '#7e7660', '#a29880', '#c8bca0', '#e8e0c8']),
  bronze: R6(['#1a241c', '#2a3a2c', '#3a5240', '#4a6a52', '#6a8a6a', '#a8b88a']),
  pedra: R6(['#1e1c1a', '#34302a', '#4c4638', '#6a6252', '#887e6a', '#a69c86']),
  asa: R6(['#0a080a', '#161216', '#241c22', '#342830', '#463640', '#5c4852']),        // as asas de couro da erínia
  erinia: R6(['#1a1c22', '#2e323c', '#4a5060', '#687082', '#8a92a4', '#b0b8c8']),     // a pele cinza-azulada
  cobra: R6(['#0e1a0e', '#1a2e18', '#2a4624', '#3e6232', '#5a8448', '#82a868']),      // o cabelo de cobras
  sangue: R6(['#200608', '#3e0c10', '#5e141a', '#801e24', '#a42e30', '#c84a44']),
  olho: R6(['#2a2418', '#5a5038', '#8e8460', '#c4bc94', '#ece6c8', '#ffffff']),
  besouro: R6(['#0a0c08', '#141a10', '#20281a', '#2e3826', '#404c34', '#566446']),
  pena: R6(['#0e0c0a', '#1c1814', '#2c2620', '#3e362e', '#544a40', '#6e6254']),
  hiena: R6(['#2a2016', '#4a3a26', '#6e583a', '#927650', '#b49668', '#d2b688']),
  larva: R6(['#3a2a20', '#5e4636', '#86664e', '#ae8a6a', '#d0ae8c', '#ecd2b2'])
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
// um tubo afinando: braços, pernas, rabos
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
// uma perna grossa: coxa, joelho à frente, canela, pé chato
function perna(P, hx, hy, fx, fy, R, base, s, r = 2, kf = 1.2) {
  const kx = (hx + fx) / 2 + kf, ky = (hy + fy) / 2;
  tubo(P, hx, hy, kx, ky, r, r * 0.85, R, base, s);
  tubo(P, kx, ky, fx, fy - r * 0.7, r * 0.85, r * 0.7, R, base + 0.1, s + 1);
  for (let x = fx - r * 0.6; x <= fx + r * 1.4; x += 0.5) P.put(x, fy, R, base - 0.6);
}
// um braço: ombro, cotovelo caindo, o punho
function braco(P, sx, sy, hx, hy, R, base, s, r = 1.6, fist = 1.6) {
  const ex = (sx + hx) / 2 - 0.4, ey = (sy + hy) / 2 + 1.2;
  tubo(P, sx, sy, ex, ey, r, r * 0.85, R, base, s); tubo(P, ex, ey, hx, hy, r * 0.85, r * 0.75, R, base + 0.2, s + 1);
  if (fist) ell(P, hx, hy, fist, fist * 0.9, 0, R, s + 2, base + 0.4);
}
Object.assign(TTB, { R6, TR, setO, ell, tubo, poly, perna, braco, cp, cg });
}

/* ---------- as faíscas acesas (com o brilho da cor delas) e o pó ---------- */
const ttFx = [], ttFxGl = {};
function ttP(o) { if (ttFx.length < 500) ttFx.push(o); }
function ttSparks(x, y, n, cols, sp = 40, g = 0, life = 0.4, lit = true) {
  if (ttFx.length > 500) return;
  for (let i = 0; i < n; i++) ttP({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1, lit });
}
const ttDust = (x, y, n, sp = 30, up = -40) => { for (let i = 0; i < n; i++) ttP({ x: x + rnd(-3, 3), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(up, up * 0.2), g: 60, life: rnd(0.4, 0.9), max: 0.9, col: ['#a89e88', '#87806e', '#c4bca6'][i % 3], size: 1, lit: false }); };
HOOK.update.push(dt => {
  for (let i = ttFx.length - 1; i >= 0; i--) { const p = ttFx[i]; p.life -= dt; if (p.life <= 0) { ttFx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of ttFx) { if (!p.lit) continue; const g = ttFxGl[p.col] || (ttFxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
// o pó vai no mundo (com a luz); o que acende vai por cima do escuro
HOOK.drawWorld.push((cx, cy) => {
  for (const p of ttFx) { if (p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2) * 0.8; lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of ttFx) { if (!p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
const TT_OSSOC = ['#e8e0c8', '#c8bca0', '#fffaee'], TT_FRIOC = ['#bfe8dc', '#e4f6ee', '#ffffff'], TT_SANG = ['#a42e30', '#c84a44', '#801e24'];
const ttNear = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const ttLive = e => e && !e.dead && enemies.includes(e);
// o chão logo abaixo de (x, y) em px (a linha de cima do bloco), até max blocos
function ttFloor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
function ttBlit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const ttJit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// um ponto do desenho (x, y no quadro com o corpo em bx e os pés em by) no mundo
const ttPt = (e, x, y, bx, by) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];
const TT1_GL = {};
const ttGl = (k, r, col) => TT1_GL[k] || (TT1_GL[k] = glow(r, col));

/* ================= arte ================= */
const TT1 = {};
{
const { TR, setO, ell, tubo, poly, perna, braco, cp, cg } = TTB;

/* ---------- o Ciclope Jovem, 32 x 36: o corpo no x 14, os pés na linha 35 ---------- */
const CI = [
  { low: 0, lean: 0.6, b: [11, 35], f: [17.5, 35], hn: [20, 27], hf: [9.4, 26.4] },                    // 0 parado
  { low: 0.6, lean: 1, b: [9.4, 35], f: [19.4, 35], hn: [21, 26], hf: [8.6, 27] },                     // 1-2 andando
  { low: 0, lean: 1, b: [16.6, 35], f: [12, 34.4], hn: [19, 28], hf: [10.6, 25.6] },
  { low: 5.4, lean: 3.6, b: [9.4, 35], f: [19.4, 35], hn: [24.4, 34.6], hf: [19.6, 34.6], dig: 1 },      // 3 os dedos no chão (o aviso)
  { low: 2, lean: 1.4, b: [9.6, 35], f: [19, 35], hn: [22, 20], hf: [18, 21], rock: [20.6, 18] },        // 4 a pedra erguida
  { low: 3.6, lean: 4.4, b: [8.4, 35], f: [20.4, 35], hn: [26.4, 32.6], hf: [12, 28] }                   // 5 rolou
];
const CI_BX = 14, CI_FY = 35;
function ciclope(k) {
  const o = CI[k], P = cp(32, 36), s = 28301 + k * 7, lo = o.low, le = o.lean;
  const hipY = 24 + lo * 0.5, shX = CI_BX + le * 0.8, shY = 14 + lo, hx = CI_BX + 3.6 + le * 1.2, hy = 10.6 + lo * 1.1;
  // a perna e o braço de longe, mais escuros
  perna(P, CI_BX - 1.4, hipY, o.b[0], o.b[1], TR.pele, 1.7, s, 2.4, 1.6);
  braco(P, shX - 2.6, shY + 1, o.hf[0], o.hf[1], TR.pele, 1.7, s + 1, 1.9, 1.9);
  // a barriga e o lombo corcunda
  ell(P, CI_BX + le * 0.4, 20.4 + lo * 0.7, 6.6, 6.4, 0, TR.pele, s + 2, 2.6, (u, v) => [TR.pele, (v > 0.3 && Math.abs(u) < 0.6 ? 0.4 : 0) + (Math.sin(v * 8) > 0.85 && u > 0 ? -0.6 : 0)]);
  ell(P, shX - 1.2, shY + 0.4, 6.4, 4.4, -0.3, TR.pele, s + 3, 2.8, (u, v) => [TR.pele, v < -0.4 ? 0.5 : 0]);
  for (const [x, y] of [[CI_BX - 4 + le * 0.5, shY - 2.6], [CI_BX - 1.6 + le * 0.6, shY - 3.6], [CI_BX + 1 + le * 0.7, shY - 3.2]]) P.put(x, y, TR.pele, 4.6);   // a espinha saltada
  // o pano de pele seca na cintura, com a tira de tendão
  poly(P, [[CI_BX - 5.6, hipY - 2.2], [CI_BX + 5 + le * 0.3, hipY - 2.2], [CI_BX + 5.4 + le * 0.5, hipY + 3.6], [CI_BX + 1, hipY + 5.4], [CI_BX - 5.2, hipY + 3.4]], TR.pano,
    (x, y) => 2.6 + (y === Math.floor(hipY - 2.2) ? 1.2 : 0) - (x - CI_BX) * 0.08 + (Math.abs(Math.sin(x * 1.4 + y * 0.3)) < 0.25 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  for (let x = CI_BX - 5.4; x <= CI_BX + 5 + le * 0.3; x += 0.5) P.put(x, hipY - 2.4, TR.osso, x > CI_BX + 2 ? 2.4 : 3.4);
  perna(P, CI_BX + 1.6, hipY + 0.4, o.f[0], o.f[1], TR.pele, 2.9, s + 4, 2.6, 1.8);
  // a cabeça: o crânio liso, a testa saltada, o olho enorme na frente, a boca larga com dois dentes de baixo
  ell(P, hx, hy, 4.6, 4.4, 0.1, TR.pele, s + 5, 3, (u, v) => [TR.pele, (v < -0.6 ? 0.5 : 0)]);
  for (let x = hx - 1; x <= hx + 4.4; x += 0.5) P.put(x, hy - 2.4, TR.pele, 4.4);                  // a testa
  for (let x = hx - 0.6; x <= hx + 4; x += 0.5) P.put(x, hy - 1.8, TR.pele, 1.4);                   // a sombra da testa
  ell(P, hx + 2, hy - 0.4, 2.3, 1.7, 0, TR.olho, s + 6, 3.4, (u, v) => [TR.olho, u > 0.2 && Math.abs(v) < 0.6 ? -3 : 0]);   // o olho (a íris escura para a frente)
  P.put(hx + 2.6, hy - 0.6, TR.cabelo, 0);
  for (let x = hx + 0.6; x <= hx + 4.4; x += 0.5) P.put(x, hy + 2.6, TR.pele, 0.8);                 // a boca
  P.put(hx + 1.6, hy + 2.2, TR.osso, 4.6); P.put(hx + 3.6, hy + 2.2, TR.osso, 4.6);                 // os dentes
  P.put(hx - 2.6, hy + 0.4, TR.pele, 1.8); P.put(hx - 2.2, hy + 1, TR.pele, 3.6);                   // a orelha
  // o braço de perto, o punho grande; a pedra
  braco(P, shX + 1.4, shY + 1.4, o.hn[0], o.hn[1], TR.pele, 3, s + 7, 2.1, 2.1);
  if (o.rock) ell(P, o.rock[0], o.rock[1], 3.6, 3.2, 0.3, TR.pedra, s + 8, 3, (u, v, x, y) => [TR.pedra, (hash2(x, y, s) < 0.2 ? -1 : 0)]);
  if (o.dig) for (const x of [o.hn[0] - 1, o.hn[0] + 1.4, o.hf[0]]) P.put(x, 35, TR.pedra, 2.6);   // os dedos sumindo no chão
  return setO(P.done());
}
// a pedra rolando (4 quadros girando)
function pedra(k) {
  const P = cp(10, 10), s = 28331;
  ell(P, 5, 5, 4.4, 4.2, k * Math.PI / 4, TR.pedra, s, 2.8, (u, v, x, y) => {
    const a = Math.atan2(v, u) + k * Math.PI / 4; return [TR.pedra, (Math.sin(a * 3) > 0.7 ? -1.2 : 0) + (Math.cos(a * 2 + 1) > 0.85 ? 0.8 : 0)];
  });
  return setO(P.done());
}

/* ---------- o Hecatônquiro Menor, 36 x 32: o corpo no x 16, os pés na linha 31; seis braços em leque ----------
   os ombros: 3 de cada lado da coluna, em três alturas; o braço k (0..5) vai para cima (0-1), o meio (2-3), embaixo (4-5)
   pose 0 e 1-2 os braços abertos; 3 + k o braço k esticado para a frente no soco */
const HC_BX = 16, HC_FY = 31;
const HC_SH = [[-1.6, 10.4], [1.8, 10.8], [-2, 13.2], [2, 13.6], [-1.6, 16], [1.6, 16.4]];
const HC_OPEN = [[-8.6, 3.6], [9.2, 4.6], [-10.6, 12.4], [11, 12.6], [-8.6, 20], [9.6, 20.6]];
const HC_PUNCH = [[17.4, 3.6], [17.8, 4.4], [18.4, 12.6], [18.8, 13], [17.6, 26.4], [18, 27.4]];
function hecaton(k) {
  const P = cp(36, 32), s = 28341 + k * 5, walk = k === 1 ? 1 : k === 2 ? -1 : 0, punch = k >= 3 ? k - 3 : -1;
  const hipY = 19.4, b = [HC_BX - 3 - walk * 2.4, HC_FY], f = [HC_BX + 3 + walk * 2.4, HC_FY - (walk < 0 ? 0.6 : 0)];
  const hand = j => { const o = j === punch ? HC_PUNCH[j] : HC_OPEN[j], w = punch >= 0 && j !== punch ? 0.4 : 1; return [HC_BX + o[0] * (j === punch ? 1 : w + (1 - w) * 0.6), o[1] + (j === punch ? 0 : Math.sin(j + walk) * 0.6)]; };
  // os braços de trás (ímpares à esquerda no desenho? não: os de índice par saem do lado de trás)
  for (const j of [0, 2, 4]) { const [hx, hy] = hand(j); braco(P, HC_BX + HC_SH[j][0], HC_SH[j][1], hx, hy, TR.bronzeP, 1.6, s + j, 1.2, 1.3); }
  perna(P, HC_BX - 1.6, hipY, b[0], b[1], TR.bronzeP, 1.7, s + 6, 1.9, 1);
  // o tronco largo, as costelas marcadas, o pano
  ell(P, HC_BX, 13.4, 5.2, 7.2, 0, TR.bronzeP, s + 7, 2.8, (u, v, x, y) => [TR.bronzeP, (v > -0.3 && v < 0.6 && (y % 2 === 0) && Math.abs(u) < 0.7 ? -0.7 : 0)]);
  poly(P, [[HC_BX - 4.6, hipY - 1], [HC_BX + 4.6, hipY - 1], [HC_BX + 4, hipY + 4], [HC_BX - 4, hipY + 4]], TR.pano, (x, y) => 2.6 + (y === Math.floor(hipY - 1) ? 1 : 0) + (x % 3 === 0 ? -0.6 : 0) + cg(x, y, s) * 0.4);
  perna(P, HC_BX + 1.6, hipY, f[0], f[1], TR.bronzeP, 2.9, s + 8, 2, 1);
  // a cabeça pequena e baixa, careca, a barba de bronze trançada
  ell(P, HC_BX + 1.2, 5, 3.2, 3.4, 0, TR.bronzeP, s + 9, 3, (u, v) => [TR.bronzeP, v < -0.5 ? 0.6 : 0]);
  P.put(HC_BX + 2.8, 4.4, TR.olho, 4.4); P.put(HC_BX + 2.8, 3.6, TR.bronzeP, 1.2);
  for (let y = 7; y < 10.6; y += 0.5) P.put(HC_BX + 2 + (y > 9 ? 0.5 : 0), y, TR.bronze, y % 1 ? 3.6 : 2.4);
  // os braços da frente
  for (const j of [1, 3, 5]) { const [hx, hy] = hand(j); braco(P, HC_BX + HC_SH[j][0], HC_SH[j][1], hx, hy, TR.bronzeP, 3, s + j + 10, 1.3, 1.4); }
  // braceletes de bronze em cada pulso
  for (let j = 0; j < 6; j++) { const [hx, hy] = hand(j); P.put(hx - Math.sign(hx - HC_BX) * 1.6, hy, TR.bronze, 4); }
  return setO(P.done());
}

/* ---------- a Mão do Enterrado, 44 x 30: a palma no chão (linha 29); 0 as pontas, 1 meio, 2 a mão aberta, 3 fechada ---------- */
function maoterra(k) {
  const P = cp(44, 30), s = 28361 + k * 3, H = [3, 10, 22, 16][k], G = 29;
  // os dedos: quatro e o polegar, nodosos, as unhas grossas de osso
  const fing = k === 3 ? [[14, -0.4], [19, -0.15], [24, 0.15], [29, 0.4]] : [[9, -0.3], [16, -0.1], [24, 0.1], [31, 0.28]];
  fing.forEach(([x0, a], i) => {
    const L = H * (i === 1 || i === 2 ? 1 : 0.86), tx = x0 + Math.sin(a) * L * (k === 3 ? -0.8 : 1), ty = G - L;
    const mx = (x0 + tx) / 2 + (k === 3 ? Math.sign(22 - x0) * 3 : 0), my = (G + ty) / 2;
    tubo(P, x0, G + 1, mx, my, 2.6, 2.3, TR.pele, 2.4, s + i); tubo(P, mx, my, tx, ty, 2.3, 1.7, TR.pele, 2.8, s + i + 4);
    if (k > 0) { P.put(mx - 1, my, TR.pele, 1); P.put(mx + 1, my, TR.pele, 1.2); }     // as dobras do nó
    ell(P, tx, ty - 0.6, 1.6, 1.3, 0, TR.osso, s + i + 8, 3.6);                         // a unha
  });
  if (k >= 2) tubo(P, 36, G + 1, 41, G - 8, 2.6, 2, TR.pele, 2.6, s + 20);              // o polegar
  if (k >= 1) for (let x = 4; x < 41; x++) { const y = G - (k === 1 ? 1 : 3) + Math.round(Math.sin(x * 0.5) * 0.8); P.put(x, y, TR.pele, 2 + cg(x, y, s) * 0.5); P.put(x, y + 1, TR.pele, 1.4); }   // o dorso da mão
  for (let x = 0; x < 44; x++) if (hash2(x, k, s) < 0.55) P.put(x, G, TR.pedra, 3 + hash2(x, 1, s));   // o pó em volta
  return setO(P.done());
}

/* ---------- a Titânide Menor, 22 x 34: o corpo no x 10, a barra da túnica na linha 33 ---------- */
const TI_BX = 10, TI_FY = 33;
function titanide(k) {   // 0 flutuando, 1 o cajado erguido (aviso), 2 o cajado batendo
  const P = cp(22, 34), s = 28381 + k * 5, st = [[15.4, 15, 15.6, 31], [14, 1, 15, 17], [16, 18, 17.6, 34]][k];
  // o cabelo comprido caindo atrás
  poly(P, [[TI_BX - 2, 3], [TI_BX + 2, 3], [TI_BX - 1, 18], [TI_BX - 5, 20], [TI_BX - 4.4, 8]], TR.cabelo, (x, y) => 2.4 + (x % 2 ? 0.6 : 0) + cg(x, y, s) * 0.4);
  // a túnica longa de pano claro, as pregas, a barra rasgada flutuando
  poly(P, [[TI_BX - 3, 9.4], [TI_BX + 3.4, 9.4], [TI_BX + 5, TI_FY - 1], [TI_BX - 5.4, TI_FY]], TR.osso,
    (x, y) => 3 - (x - TI_BX) * 0.12 + (Math.abs(Math.sin(x * 1.3 + y * 0.1)) < 0.25 ? -1 : 0) + cg(x, y, s) * 0.4 - (y > TI_FY - 2 && hash2(x, y, s) < 0.4 ? 1 : 0));
  for (let x = TI_BX - 3; x <= TI_BX + 3.4; x += 0.5) P.put(x, 16, TR.bronze, 3.4);           // o cinto de bronze
  // o braço de trás, o rosto de mármore, o diadema de bronze
  braco(P, TI_BX - 1.4, 10.6, TI_BX - 3, 17, TR.marmore, 1.8, s + 1, 1, 1);
  ell(P, TI_BX + 0.8, 5.4, 2.6, 3.2, 0.1, TR.marmore, s + 2, 3.2, (u, v) => [TR.marmore, u > 0.5 ? -0.4 : 0]);
  P.put(TI_BX + 2.6, 5.8, TR.marmore, 4.6); P.put(TI_BX + 2, 4.8, TR.olho, 5); P.put(TI_BX + 2, 7.6, TR.marmore, 1.4);
  for (let x = TI_BX - 1.6; x <= TI_BX + 3; x += 0.5) P.put(x, 2.6, TR.bronze, x > TI_BX + 2 ? 2.6 : 4.2);
  // o cajado de osso (um fêmur comprido com a cabeça para cima) e o braço de perto segurando
  tubo(P, st[0], st[1], st[2], st[3], 0.9, 0.8, TR.osso, 3, s + 3);
  ell(P, st[0], st[1], 1.8, 1.5, 0, TR.osso, s + 4, 3.8);
  const gy = (st[1] + st[3]) / 2 - 2, gx = st[0] + (st[2] - st[0]) * ((gy - st[1]) / (st[3] - st[1]));
  braco(P, TI_BX + 1.4, 10.6, gx, gy, TR.marmore, 3, s + 5, 1.1, 1.1);
  return setO(P.done());
}

/* ---------- a Erínia, 26 x 22: o corpo no x 13, os pés na linha 21 ---------- */
const ER_BX = 13, ER_FY = 21;
function erinia(k) {   // 0 asas em cima, 1 asas embaixo, 2 o chicote erguido (aviso), 3 o corte
  const P = cp(26, 22), s = 28401 + k * 3, up = k === 0 || k === 2;
  // as asas de couro, dedos de morcego, rasgadas
  for (const side of [-1, 1]) {
    const tipY = up ? 1 : 15, tipX = ER_BX - 3 + side * 9 - 3, base = side < 0 ? 1.6 : 2.6;
    const pts = [[ER_BX - 1, 7], [tipX, tipY], [tipX + 2, tipY + (up ? 6 : -2)], [tipX - side * 2 + 3, tipY + (up ? 9 : 3)], [ER_BX - 1, 11]];
    poly(P, pts, TR.asa, (x, y) => base + (Math.abs((x - ER_BX) * 0.7 + (y - 7)) % 3 < 0.6 ? -0.8 : 0) + cg(x, y, s) * 0.4 - (hash2(x, y, s) < 0.06 ? 3 : 0));
    P.line(ER_BX - 1, 7.6, tipX, tipY, TR.asa, base + 1.6);
  }
  // o corpo magro, a túnica rasgada escura, as pernas finas penduradas
  tubo(P, ER_BX - 0.6, 15, ER_BX - 2, ER_FY, 0.8, 0.6, TR.erinia, 1.8, s + 1); tubo(P, ER_BX + 0.6, 15, ER_BX + 1, ER_FY - 0.6, 0.8, 0.6, TR.erinia, 2.6, s + 2);
  ell(P, ER_BX, 11, 2.4, 4.6, 0.1, TR.sangue, s + 3, 2.2, (u, v, x, y) => [TR.sangue, (v > 0.6 && hash2(x, y, s) < 0.4) ? -1 : 0]);
  // a cabeça: o rosto cinza, os olhos vermelhos (o EYES acende), o cabelo de cobras
  ell(P, ER_BX + 0.8, 4.6, 2.2, 2.6, 0, TR.erinia, s + 4, 3.2);
  P.put(ER_BX + 2.2, 4.2, TR.sangue, 5); P.put(ER_BX + 1.8, 6.4, TR.erinia, 1);
  for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.5; tubo(P, ER_BX + Math.cos(a) * 2, 3.6 + Math.sin(a) * 2, ER_BX + Math.cos(a) * 5 - 1, 3.6 + Math.sin(a) * 4 + (i % 2) * 2, 0.6, 0.4, TR.cobra, 3, s + 5 + i); }
  // o braço de perto e o chicote
  const hn = k === 2 ? [ER_BX - 2, 2] : k === 3 ? [ER_BX + 7, 12] : [ER_BX + 3.4, 12];
  braco(P, ER_BX + 1, 8.6, hn[0], hn[1], TR.erinia, 3, s + 10, 0.7, 0.8);
  if (k === 2) for (let t = 0; t < 1; t += 0.05) P.put(hn[0] - 2 - t * 6 + Math.sin(t * 6) * 1.4, hn[1] + t * 7, TR.pano, 3.6 - t);
  else if (k === 3) for (let t = 0; t < 1; t += 0.04) P.put(hn[0] + t * 5.6, hn[1] + 1 + Math.sin(t * 5) * 2 + t * 4, TR.pano, 3.6 - t);
  else for (let t = 0; t < 1; t += 0.05) P.put(hn[0] + Math.sin(t * 5) * 1.2, hn[1] + t * 8, TR.pano, 3 - t);
  return setO(P.done());
}

TT1.CI = CI;
TT1.get = () => TT1.ready || (TT1.ready = {
  ci: CI.map((_, k) => ciclope(k)), pedra: [0, 1, 2, 3].map(pedra),
  hc: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(hecaton),
  mt: [0, 1, 2, 3].map(maoterra),
  ti: [0, 1, 2].map(titanide),
  er: [0, 1, 2, 3].map(erinia)
});
Object.assign(TT1, { CI_BX, CI_FY, HC_BX, HC_FY, HC_SH, HC_OPEN, HC_PUNCH, TI_BX, TI_FY, ER_BX, ER_FY });
}

/* ================= desenho ================= */
const tt1CiPose = e => e.state === 'dig' ? 3 : e.state === 'lift' ? 4 : e.state === 'roll' ? 5 : Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 5) % 2 : 0;
DRAW_E.ciclope = (e, fx, fy, fl) => ttBlit(cvPick(TT1.get().ci[tt1CiPose(e)], e, fl), e, fx, fy, TT1.CI_BX + 1, TT1.CI_FY + 1, ttJit(e, e.state === 'dig', 40));
EYES_E.ciclope = (e, fx, fy) => {   // o olho: pisca quando fareja; acende branco quando cava
  const o = TT1.CI[tt1CiPose(e)], x = fx + (3.6 + o.lean * 1.2 + 2 - 0.5) * e.facing, y = fy - 1 - (TT1.CI_FY - (10.6 + o.low * 1.1 - 0.4));
  const blink = e.state === 'sniff' && Math.sin(e.t * 9) > 0.4 ? 0 : 1;
  lc.globalAlpha = (e.state === 'dig' ? 0.75 : 0.28) * blink; lc.drawImage(ttGl('olhoB', 5, '#ece6c8'), Math.round(x) - 5, Math.round(y) - 5);
};
WARN_E.ciclope = e => e.state === 'dig';

const tt1HcPose = e => e.state === 'punch' && e.cur >= 0 ? 3 + e.cur : Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 7) % 2 : 0;
DRAW_E.hecaton = (e, fx, fy, fl) => ttBlit(cvPick(TT1.get().hc[tt1HcPose(e)], e, fl), e, fx, fy, TT1.HC_BX + 1, TT1.HC_FY + 1);
EYES_E.hecaton = (e, fx, fy) => {   // os punhos acesos, um a um, na ordem dos socos
  if (e.state !== 'show' && e.state !== 'punch') return;
  const n = e.state === 'show' ? Math.min(e.seq.length, Math.floor(e.showT / TT1_BRACO) + 1) : e.seq.length;
  for (let i = e.state === 'punch' ? e.si : 0; i < n; i++) {
    const j = e.seq[i], o = TT1.HC_OPEN[j], x = fx + o[0] * e.facing, y = fy - 1 - (TT1.HC_FY - o[1]);
    lc.globalAlpha = i === n - 1 && e.state === 'show' ? 0.85 : 0.5; lc.drawImage(ttGl('punho', 6, '#ece6c8'), Math.round(x) - 6, Math.round(y) - 6);
  }
};
WARN_E.hecaton = e => e.state === 'show';

DRAW_E.maoterra = (e, fx, fy, fl) => {
  if (e.state === 'under' || e.state === 'move') return;   // só o risco de pó (drawWorld)
  const k = e.state === 'rise' ? (e.stateT > TT1_PO * 0.5 ? 0 : 1) : e.state === 'hold' || e.state === 'slam' ? 3 : e.state === 'sink' ? (e.stateT > 0.25 ? 1 : 0) : 2;
  const S = TT1.get().mt[k], img = fl ? S.wr : S.r; lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 2);
};
WARN_E.maoterra = e => e.state === 'rise';

const tt1TiBob = e => Math.round(Math.sin(e.t * 2.4 + e.seed) * 1.2);
DRAW_E.titanide = (e, fx, fy, fl) => ttBlit(cvPick(TT1.get().ti[e.state === 'raise' ? 1 : e.state === 'strike' ? 2 : 0], e, fl), e, fx, fy + tt1TiBob(e), TT1.TI_BX + 1, TT1.TI_FY + 1, ttJit(e, e.state === 'raise' && e.stateT < 0.25));
EYES_E.titanide = (e, fx, fy) => {
  const y0 = fy + tt1TiBob(e);
  lc.globalAlpha = 0.3; lc.drawImage(ttGl('olhoB', 5, '#ece6c8'), Math.round(fx + 2 * e.facing) - 5, Math.round(y0 - 1 - (TT1.TI_FY - 4.8)) - 5);
  if (e.state === 'raise') { const q = clamp(1 - e.stateT / TT1_CAJADO, 0, 1); lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(ttGl('frioG', 10, '#bfe8dc'), Math.round(fx + 4 * e.facing) - 10, Math.round(y0 - 1 - (TT1.TI_FY - 1)) - 10); }
};
WARN_E.titanide = e => e.state === 'raise';

DRAW_E.erinia = (e, fx, fy, fl) => {
  const k = e.state === 'crack' ? 2 : e.state === 'lash' ? 3 : Math.floor(e.t * 8) % 2;
  ttBlit(cvPick(TT1.get().er[k], e, fl), e, fx, fy + Math.round(Math.sin(e.t * 4 + e.seed)), TT1.ER_BX + 1, TT1.ER_FY + 1);
};
EYES_E.erinia = (e, fx, fy) => { lc.globalAlpha = e.state === 'crack' || e.state === 'lash' ? 0.8 : 0.4; lc.drawImage(ttGl('olhoR', 4, '#ff5a4a'), Math.round(fx + 2.2 * e.facing) - 4, Math.round(fy - 1 - (TT1.ER_FY - 4.2) + Math.sin(e.t * 4 + e.seed)) - 4); };
WARN_E.erinia = e => e.state === 'crack';

/* ================= comportamento ================= */
const tt1Pedras = [], tt1Rachas = [], tt1Espinhos = [], tt1Estalos = [];

/* ---------- o Ciclope Jovem ---------- */
AI.ciclope = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'dig') {   // os dedos no chão, as pedrinhas tremendo
    e.vx = approach(e.vx, 0, 900 * dt);
    if (Math.random() < dt * 20) { const [x, y] = ttPt(e, 24, 34, TT1.CI_BX, TT1.CI_FY); ttDust(x, y, 1, 20, -30); }
    if (e.stateT <= 0) { e.state = 'lift'; e.stateT = 0.3; sfx.ttArranca(Math.max(0.4, ttNear(e))); }
    return;
  }
  if (e.state === 'lift') { if (e.stateT <= 0) { tt1Rola(e); e.state = 'roll'; e.stateT = 0.45; } return; }
  if (e.state === 'roll') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.2 + Math.random(); } return; }
  if (e.state === 'sniff') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0 || (aggro && e.sees)) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 3 * T ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; if (Math.random() < dt * 0.15) { e.state = 'sniff'; e.stateT = 1.6; sfx.ttFareja(Math.max(0.3, ttNear(e))); return; } }
  walk(e, dt, dir, aggro ? 34 : 18, 500, 260, dy, aggro);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dy) < 3 * T && dist < 14 * T && e.sees) { e.state = 'dig'; e.stateT = TT1_CAVA; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.ttCava(Math.max(0.4, ttNear(e))); }
};
function tt1Rola(e) {
  const [x, y] = ttPt(e, 24, 30, TT1.CI_BX, TT1.CI_FY);
  tt1Pedras.push({ x, y, vx: e.facing * TT1_PEDRA_SP, vy: 0, a: 0, dmg: e.dmg, hit: false, t: 0, owner: e });
  ttDust(x, y + 4, 6, 40); sfx.ttRola(Math.max(0.4, ttNear(e)));
}

/* ---------- o Hecatônquiro Menor ---------- */
AI.hecaton = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'show') {   // os braços acendem um a um
    e.vx = approach(e.vx, 0, 700 * dt); e.showT += dt;
    const n = Math.min(e.seq.length, Math.floor(e.showT / TT1_BRACO) + 1); if (n > (e.shown || 0)) { e.shown = n; sfx.ttAcende(Math.max(0.4, ttNear(e)), n); }
    if (e.showT >= TT1_BRACO * e.seq.length + 0.15) { e.state = 'punch'; e.si = 0; e.cur = -1; e.stateT = 0; }
    return;
  }
  if (e.state === 'punch') {   // os socos na mesma ordem, um a cada 0,22 s
    e.vx = approach(e.vx, 0, 700 * dt);
    if (e.stateT <= 0) {
      if (e.si >= e.seq.length) { e.state = 'walk'; e.cur = -1; e.atkCD = 1.4 + Math.random() * 0.6; return; }
      e.cur = e.seq[e.si++]; e.stateT = 0.22; e.hitThis = false; sfx.ttSoco(Math.max(0.4, ttNear(e)));
      const p = TT1.HC_PUNCH[e.cur], [x, y] = ttPt(e, TT1.HC_BX + p[0], p[1], TT1.HC_BX, TT1.HC_FY); ttSparks(x, y, 3, TT_OSSOC, 40);
    }
    if (e.cur >= 0 && !e.hitThis && !pl.dead) {
      const ecx = e.x + e.w / 2, lv = e.cur >> 1, reach = 22;
      // em cima: acima da cabeça dele (pega quem pulou); no meio: o peito; embaixo: rente ao chão
      const hb = lv === 0 ? { y: e.y - 18, h: 16 } : lv === 1 ? { y: e.y + 4, h: 12 } : { y: e.y + e.h - 7, h: 7 };
      hb.x = e.facing > 0 ? ecx : ecx - reach; hb.w = reach;
      if (overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx += e.facing * 60; ttSparks(pl.x + pl.w / 2, pl.y + pl.h / 2, 4, TT_OSSOC, 60); } }
    }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 16 ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 44 : 20, 600, 270, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 34 && Math.abs(dy) < 20 && clearPath(e, pl)) {
    const n = 3 + (Math.random() < 0.4 ? 1 : 0), seq = [];
    for (let i = 0; i < n; i++) { let j; do j = Math.floor(Math.random() * 6); while (seq.length && (seq[seq.length - 1] >> 1) === (j >> 1) && Math.random() < 0.6); seq.push(j); }
    Object.assign(e, { state: 'show', seq, showT: 0, shown: 0, vx: 0 });
  }
};

/* ---------- a Mão do Enterrado ---------- */
// fica sempre no chão: o fundo da caixa na linha de cima do bloco do chão
function tt1Assenta(e) { const f = ttFloor(e.x + e.w / 2, e.y + e.h - 4, 6); if (f !== null) e.y = f - e.h; }
AI.maoterra = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = 0; e.vy = 0;
  const cx = e.x + e.w / 2, gy = e.y + e.h;
  if (e.state === 'under' || e.state === 'move') {   // por baixo do pó: anda devagar até debaixo do herói
    e.ttHidden = true;
    if (aggro && Math.abs(dy) < 3 * T && !pl.dead) {
      const tx = pl.x + pl.w / 2, d = tx - cx, sp = 26 * dt, nx = e.x + clamp(d, -sp, sp);
      // só anda onde há chão firme por baixo e ar em cima (não atravessa parede)
      const ftx = Math.floor((nx + e.w / 2) / T), fty = Math.floor(gy / T);
      if (solidAt(ftx, fty) && !solidAt(ftx, fty - 1)) { e.x = nx; e.state = 'move'; } else e.state = 'under';
      tt1Assenta(e);
      if (Math.random() < dt * 12) ttDust(e.x + e.w / 2 + rnd(-4, 4), gy, 1, 10, -20);
      if (Math.abs(d) < T * 1.5 && e.atkCD <= 0) { e.state = 'rise'; e.stateT = TT1_PO; e.ttHidden = false; sfx.ttPo(Math.max(0.5, ttNear(e))); }
    } else e.state = 'under';
    return;
  }
  e.ttHidden = false;
  if (e.state === 'rise') {   // o pó levanta num círculo de 3 blocos
    if (Math.random() < dt * 40) { const a = Math.random() * Math.PI, r = TT1_GARRA_R * Math.sqrt(Math.random()); ttDust(cx + Math.cos(a) * r * (Math.random() < 0.5 ? -1 : 1), gy, 1, 15, -50); }
    if (e.stateT <= 0) {
      e.state = 'grab'; e.stateT = 0.25; sfx.ttAgarra(Math.max(0.5, ttNear(e)));
      const pcx = pl.x + pl.w / 2;
      if (!pl.dead && Math.abs(pcx - cx) < TT1_GARRA_R && pl.y + pl.h > gy - 3 * T && pl.y + pl.h <= gy + 4 && pl.invuln <= 0) {
        const r = hurtPlayer(Math.round(e.dmg * 0.35), cx, e, false);
        if (r === 'hit') { e.state = 'hold'; e.stateT = 1.2; e.squeeze = 0.4; if (typeof elEnraizar === 'function') elEnraizar(1.3); }
      }
    }
    return;
  }
  if (e.state === 'hold') {   // espreme: segura o herói no punho fechado
    if (!pl.dead) { pl.x = lerp(pl.x, cx - pl.w / 2, Math.min(1, dt * 12)); pl.y = Math.min(pl.y, gy - pl.h - 6); pl.vx = 0; pl.vy = 0; if (typeof elEnraizar === 'function') elEnraizar(0.2); }
    e.squeeze -= dt; if (e.squeeze <= 0 && !pl.dead) { e.squeeze = 0.4; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.25), cx + e.facing, null, true); sfx.ttEspreme(0.7); ttDust(cx, gy - 8, 3, 20); }
    if (e.stateT <= 0 || pl.dead) { e.state = 'slam'; e.stateT = 0.5; if (!pl.dead) { pl.invuln = 0; const d = Math.sign(pl.x + pl.w / 2 - cx) || e.facing; pl.vx = d * 220; pl.vy = 160; hurtPlayer(Math.round(e.dmg * 0.6), cx - d * 10, null, true); shake(5); sfx.ttBate(1); ttDust(cx, gy, 12, 60); } }
    return;
  }
  if (e.state === 'grab' || e.state === 'slam') { if (e.stateT <= 0) { e.state = 'out'; e.stateT = 1.1; } return; }
  if (e.state === 'out') { if (e.stateT <= 0) { e.state = 'sink'; e.stateT = 0.5; } return; }
  if (e.state === 'sink') { if (e.stateT <= 0) { e.state = 'under'; e.atkCD = 2.2 + Math.random() * 1.2; } return; }
  e.state = 'under';
};

/* ---------- a Titânide Menor ---------- */
AI.titanide = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  // flutua um palmo acima do chão, em linha reta (sem pular): o chão de baixo a segura
  const f = ttFloor(e.x + e.w / 2, e.y + e.h - 2, 8), want = f !== null ? f - e.h - 6 : e.y;
  e.vy = clamp((want - e.y) * 6, -60, 120);
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) { e.state = 'strike'; e.stateT = 0.4; tt1Racha(e); } return; }
  if (e.state === 'strike') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) { e.state = 'float'; e.atkCD = 2.4 + Math.random(); } return; }
  e.state = 'float';
  let dir = 0;
  if (aggro) { const ideal = 7 * T; dir = Math.abs(dx) < ideal - T ? -Math.sign(dx) : Math.abs(dx) > ideal + T ? Math.sign(dx) : 0; e.facing = Math.sign(dx) || e.facing; }
  else { cvWander(e, dt); dir = e.wander; if (dir) e.facing = dir; }
  // não desce de beirada: só anda se há chão à frente
  if (dir) { const ahead = ttFloor(e.x + e.w / 2 + dir * 10, e.y + e.h, 3); if (ahead === null) dir = 0; }
  e.vx = approach(e.vx, dir * (aggro ? 30 : 14), 200 * dt);
  if (!aggro || e.atkCD > 0 || pl.dead) return;
  if (dist < 13 * T && Math.abs(dy) < 3 * T && e.sees) { e.state = 'raise'; e.stateT = TT1_CAJADO; sfx.ttCajado(Math.max(0.4, ttNear(e))); }
};
function tt1Racha(e) {
  // a rachadura corre pelo chão do pé dela até onde o herói estava, seguindo o chão (sobe e desce até 2 blocos)
  const x0 = e.x + e.w / 2 + e.facing * 6, tx = pl.x + pl.w / 2, dir = Math.sign(tx - x0) || e.facing, pts = [];
  let gy = ttFloor(x0, e.y + e.h, 4); if (gy === null) return;
  for (let x = x0; dir > 0 ? x <= tx : x >= tx; x += dir * 2) {
    const g = ttFloor(x, gy - 2 * T, 5); if (g === null || Math.abs(g - gy) > 2 * T) break; gy = g; pts.push([x, gy]);
    if (pts.length > 120) break;
  }
  if (!pts.length) return;
  sfx.ttBateCajado(Math.max(0.4, ttNear(e)));
  tt1Rachas.push({ pts, t: 0, dur: pts.length * 2 / TT1_RACHA_SP, dmg: e.dmg, done: false, dir });
}
function tt1Espinha(R) {
  const [ex, ey] = R.pts[R.pts.length - 1];
  tt1Espinhos.push({ x: ex, y: ey, t: 0, seed: Math.random() * 9, hit: false, dmg: R.dmg });
  sfx.ttEspinho(Math.max(0.4, clamp(1 - Math.hypot(pl.x - ex, pl.y - ey) / 260, 0, 1))); ttDust(ex, ey, 10, 50);
}

/* ---------- a Erínia ---------- */
AI.erinia = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, back = -pl.facing;   // o lado de trás do herói
  const behind = Math.sign(e.x + e.w / 2 - pcx) === back;
  if (e.state === 'crack' || e.state === 'lash') {
    e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt);
    if (!behind && e.state === 'crack') { e.state = 'flee'; e.stateT = 0.8; return; }   // ele virou: ela recua
    if (e.state === 'crack' && e.stateT <= 0) { e.state = 'lash'; e.stateT = 0.2; e.hitThis = false; sfx.ttChicote(Math.max(0.5, ttNear(e))); }
    if (e.state === 'lash') {
      const ecx = e.x + e.w / 2, hb = { x: e.facing > 0 ? ecx : ecx - 24, y: e.y, w: 24, h: 22 };
      if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') ttSparks(pcx, pcy, 5, TT_SANG, 60); }
      if (e.stateT <= 0) { e.state = 'flee'; e.stateT = 0.6; e.atkCD = 1.2 + Math.random() * 0.8; }
    }
    return;
  }
  let tx, ty;
  if (!aggro) { cvWander(e, dt); tx = e.x + (e.wander || 0) * 40; ty = (e.homeY || e.y) + Math.sin(e.t) * 10; }
  else if (e.state === 'flee') { tx = pcx + (behind ? back : -back) * 70; ty = pcy - 40; if (e.stateT <= 0) e.state = 'fly'; }
  else { e.state = 'fly'; tx = pcx + back * 22; ty = pcy - 10 + Math.sin(e.t * 2.3) * 6; }
  const ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h / 2), sp = aggro ? 110 : 40;
  e.vx = approach(e.vx, clamp(ax * 3, -sp, sp), 360 * dt); e.vy = approach(e.vy, clamp(ay * 3, -sp, sp), 360 * dt);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (Math.sign(e.vx) || e.facing);
  e.flapT = (e.flapT || 0) - dt; if (e.flapT <= 0) { e.flapT = 0.25; const v = ttNear(e, 180); if (v > 0.1) sfx.ttAsa(v * 0.6); }
  if (!aggro || e.atkCD > 0 || pl.dead || e.state === 'flee') return;
  if (behind && Math.abs(dx) < 30 && Math.abs(dy) < 22) { e.state = 'crack'; e.stateT = TT1_ESTALO; sfx.ttEstalo(Math.max(0.5, ttNear(e))); tt1Estalos.push({ e, t: 0 }); }
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.ttHidden) return;   // a mão por baixo do pó, o parasita dentro do osso: o golpe não chega
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !TT1_TYPES.includes(e.type)) return r;
  if (e.type === 'ciclope') { e.stun = Math.min(e.stun, e.state === 'dig' ? 0 : 0.15); ttDust(e.x + e.w / 2, e.y + 10, 2, 30); }
  if (e.type === 'maoterra') { e.vx = 0; e.vy = 0; e.stun = 0; }
  if (e.type === 'titanide' && e.state === 'raise' && e.stun > 0) { e.state = 'float'; e.atkCD = Math.max(e.atkCD, 0.8); }
  if (e.type === 'erinia' && e.state === 'crack') { e.state = 'flee'; e.stateT = 0.7; }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!TT1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, ttNear(e, 260));
  if (e.type === 'maoterra') { ttDust(cx, e.y + e.h, 18, 60, -70); sfx.ttBate(v * 0.7); }
  else if (e.type === 'erinia') { ttSparks(cx, cy, 8, TT_SANG, 50, 120, 0.8, false); sfx.ttGrito(v); }
  else { ttDust(cx, e.y + e.h, 10, 50); sfx.ttCai(v, e.type === 'ciclope' ? 0.7 : 1); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !TT1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2; e.cur = -1;
  if (type === 'maoterra') { e.state = 'under'; e.ttHidden = true; tt1Assenta(e); }
  else if (type === 'titanide') e.state = 'float';
  else if (type === 'erinia') e.state = 'fly';
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: as pedras rolando, as rachaduras, os espinhos ---------- */
function tt1Update(dt) {
  const pcx = pl.x + pl.w / 2;
  const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
  // a pedra rola pelo chão: cai das beiradas, desce rampas, sobe degrau de um bloco se vem rápida, parte na parede
  for (let i = tt1Pedras.length - 1; i >= 0; i--) {
    const S = tt1Pedras[i]; S.t += dt;
    S.vy = Math.min(S.vy + GRAV * dt, MAXFALL); S.a += S.vx * dt / 5;
    const r = 4, nx = S.x + S.vx * dt, tyb = Math.floor((S.y + r - 1) / T), txf = Math.floor((nx + Math.sign(S.vx) * r) / T);
    let broke = false;
    if (solidAt(txf, tyb)) {
      if (!solidAt(txf, tyb - 1) && !solidAt(Math.floor(S.x / T), tyb - 1) && Math.abs(S.vx) > 80) { S.y -= T; S.vx *= 0.8; }
      else broke = true;
    } else S.x = nx;
    const ny = S.y + S.vy * dt;
    if (solidAt(Math.floor(S.x / T), Math.floor((ny + r) / T))) { S.y = Math.floor((ny + r) / T) * T - r; if (S.vy > 120) { ttDust(S.x, S.y + r, 3, 30); sfx.ttQuica(0.4 * ttNear({ x: S.x, y: S.y }, 260)); } S.vy = 0; }
    else S.y = ny;
    if (Math.random() < dt * 10 && S.vy === 0) ttDust(S.x, S.y + r, 1, 15, -15);
    if (!S.hit && hitsHero(S.x, S.y, r)) { const res = hurtPlayer(S.dmg, S.x - Math.sign(S.vx) * 10, null, true); if (res !== 'none' || pl.invuln > 0) { S.hit = true; if (res === 'hit') pl.vx += Math.sign(S.vx) * 120; broke = true; } }
    if (broke || S.t > 8) { ttDust(S.x, S.y, 12, 60); ttSparks(S.x, S.y, 4, ['#887e6a', '#a69c86'], 60, 300, 0.5, false); sfx.ttParte(Math.max(0.2, clamp(1 - Math.hypot(pl.x - S.x, pl.y - S.y) / 260, 0, 1))); tt1Pedras.splice(i, 1); }
  }
  // a rachadura corre; no fim, os espinhos
  for (let i = tt1Rachas.length - 1; i >= 0; i--) {
    const R = tt1Rachas[i]; R.t += dt;
    if (!R.done && R.t >= R.dur) { R.done = true; tt1Espinha(R); }
    if (Math.random() < dt * 25 && !R.done) { const p = R.pts[Math.min(R.pts.length - 1, Math.floor(R.pts.length * R.t / R.dur))]; ttDust(p[0], p[1], 1, 20, -30); }
    if (R.t > R.dur + 1.2) tt1Rachas.splice(i, 1);
  }
  // os espinhos de osso: uma fileira de 5 que sobe rápida, fica e desce; acerta uma vez
  for (let i = tt1Espinhos.length - 1; i >= 0; i--) {
    const S = tt1Espinhos[i]; S.t += dt;
    if (!S.hit && S.t > 0.05 && S.t < 0.6 && !pl.dead && Math.abs(pcx - S.x) < 16 && pl.y + pl.h > S.y - 20 && pl.y < S.y) {
      const res = hurtPlayer(S.dmg, S.x, null, true); if (res !== 'none' || pl.invuln > 0) { S.hit = true; if (res === 'hit') pl.vy = Math.min(pl.vy, -160); }
    }
    if (S.t > 1) tt1Espinhos.splice(i, 1);
  }
  for (let i = tt1Estalos.length - 1; i >= 0; i--) { tt1Estalos[i].t += dt; if (tt1Estalos[i].t > 0.3) tt1Estalos.splice(i, 1); }
}
HOOK.update.push(tt1Update);
function clearTt1Fx() { ttFx.length = 0; tt1Pedras.length = 0; tt1Rachas.length = 0; tt1Espinhos.length = 0; tt1Estalos.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearTt1Fx(); tt1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: só o que tem motivo (o olho do ciclope cavando, o cajado aceso, a rachadura branca)
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'titanide' && e.state === 'raise') addL(e.x + e.w / 2 + e.facing * 4, e.y, 0.4);
    else if (e.type === 'ciclope' && e.state === 'dig') addL(e.x + e.w / 2 + e.facing * 6, e.y + 8, 0.25);
  }
  for (const R of tt1Rachas) if (!R.done) { const p = R.pts[Math.min(R.pts.length - 1, Math.floor(R.pts.length * R.t / R.dur))]; addL(p[0], p[1] - 4, 0.35); }
}; }

HOOK.drawGlow.push((cx, cy) => {
  for (const R of tt1Rachas) {
    const n = R.done ? R.pts.length : Math.floor(R.pts.length * R.t / R.dur), f = R.done ? Math.max(0, 1 - (R.t - R.dur) / 1.2) : 1;
    lc.globalAlpha = 0.25 * f; for (let j = 0; j < n; j += 3) lc.drawImage(ttGl('racha', 5, '#e4f6ee'), Math.round(R.pts[j][0] - cx) - 5, Math.round(R.pts[j][1] - cy) - 6);
    if (!R.done && n > 0) { const p = R.pts[Math.min(n, R.pts.length - 1)]; lc.globalAlpha = 0.55; lc.drawImage(ttGl('frioG', 10, '#bfe8dc'), Math.round(p[0] - cx) - 10, Math.round(p[1] - cy) - 12); }
  }
  for (const S of tt1Estalos) { if (!ttLive(S.e)) continue; const [x, y] = ttPt(S.e, TT1.ER_BX - 8, 8, TT1.ER_BX, TT1.ER_FY); lc.globalAlpha = 0.7 * (1 - S.t / 0.3); lc.drawImage(ttGl('estalo', 8, '#fff2c0'), Math.round(x - cx) - 8, Math.round(y - cy) - 8); }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): as pedras, os espinhos, o risco de pó da mão andando
HOOK.drawWorld.push((cx, cy) => {
  const B = TT1.get();
  for (const S of tt1Pedras) { const img = B.pedra[((Math.floor(S.a) % 4) + 4) % 4].r; lc.drawImage(img, Math.round(S.x - cx - img.width / 2), Math.round(S.y - cy - img.height / 2)); }
  for (const S of tt1Espinhos) {
    const up = S.t < 0.08 ? S.t / 0.08 : S.t > 0.7 ? Math.max(0, 1 - (S.t - 0.7) / 0.3) : 1;
    for (let j = 0; j < 5; j++) {
      const ox = (j - 2) * 6 + Math.sin(S.seed + j * 2.1) * 1.2, H = (8 + ((j * 5 + (S.seed | 0) * 3) % 6) + (j === 2 ? 6 : 0)) * up, lean = (j - 2) * 0.12;
      for (let y = 0; y < H; y++) {
        const t = y / Math.max(1, H), w = Math.max(0, Math.round((1 - t) * 2)), x = Math.round(S.x - cx + ox + lean * y), yy = Math.round(S.y - cy - y - 1);
        lc.fillStyle = '#3a352a'; lc.fillRect(x - w - 1, yy, w * 2 + 3, 1);
        lc.fillStyle = t > 0.8 ? '#f4eedc' : (y % 3 === 1 ? '#a29880' : '#c8bca0'); lc.fillRect(x - w, yy, w * 2 + 1, 1);
        if (w > 0) { lc.fillStyle = '#e8e0c8'; lc.fillRect(x - w, yy, 1, 1); }
      }
    }
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'maoterra' || (e.state !== 'under' && e.state !== 'move' && e.state !== 'rise')) continue;
    const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.y + e.h - cy);
    if (x < -40 || x > VW + 40 || y < -20 || y > VH + 20) continue;
    // o montinho de pó em cima dos dedos; subindo, o círculo de pó todo
    const R = e.state === 'rise' ? Math.round(TT1_GARRA_R * (1 - e.stateT / TT1_PO)) : 6;
    for (let k = -R; k <= R; k++) { const h = e.state === 'rise' ? (hash2(k, Math.floor(gameTime * 12), 7) < 0.5 ? 1 : 2) : Math.max(0, Math.round(2 - Math.abs(k) / 3 + Math.sin(e.t * 3 + k) * 0.5)); lc.fillStyle = k & 1 ? '#87806e' : '#a89e88'; lc.fillRect(x + k, y - h, 1, h); }
  }
});
// por cima do escuro: a rachadura acesa correndo
HOOK.drawTop.push((cx, cy) => {
  for (const R of tt1Rachas) {
    const n = R.done ? R.pts.length : Math.floor(R.pts.length * R.t / R.dur), f = R.done ? Math.max(0, 1 - (R.t - R.dur) / 1.2) : 1;
    for (let j = 0; j < n; j++) {
      const [x, y] = R.pts[j], hot = !R.done && j > n - 6;
      lc.globalAlpha = f * (hot ? 1 : 0.7); lc.fillStyle = hot ? '#ffffff' : (j % 3 ? '#bfe8dc' : '#e4f6ee');
      lc.fillRect(Math.round(x - cx), Math.round(y - cy) + (j % 4 === 1 ? 1 : 0), 2, 1);
    }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  ttFareja(v = 1) { for (let k = 0; k < 3; k++) noise(0.12, 0.03 * v, 700, 'bandpass', k * 0.18, 2); },
  ttCava(v = 1) { for (let k = 0; k < 6; k++) noise(0.05, 0.05 * v, 900 + k * 120, 'bandpass', k * 0.14, 3); tone(70, 0.9, 'sawtooth', 0.012 * v, 20); },
  ttArranca(v = 1) { noise(0.3, 0.12 * v, 400, 'lowpass'); tone(90, 0.3, 'square', 0.03 * v, -40); },
  ttRola(v = 1) { noise(0.6, 0.06 * v, 260, 'lowpass', 0, 0.6); },
  ttQuica(v = 1) { noise(0.08, 0.06 * v, 300, 'lowpass'); tone(80, 0.08, 'sine', 0.04 * v, -30); },
  ttParte(v = 1) { noise(0.3, 0.12 * v, 700, 'lowpass'); for (let k = 0; k < 4; k++) noise(0.04, 0.04 * v, 1600 + k * 300, 'bandpass', 0.05 + k * 0.05, 4); },
  ttAcende(v = 1, n = 1) { tone(320 + n * 60, 0.12, 'triangle', 0.02 * v, 40); noise(0.06, 0.02 * v, 1400, 'bandpass'); },
  ttSoco(v = 1) { noise(0.1, 0.08 * v, 500, 'lowpass'); tone(110, 0.1, 'sine', 0.05 * v, -50); },
  ttPo(v = 1) { noise(0.8, 0.05 * v, 300, 'lowpass', 0, 0.4); tone(50, 0.8, 'sine', 0.05 * v, -10); },
  ttAgarra(v = 1) { noise(0.25, 0.1 * v, 600, 'lowpass'); tone(70, 0.3, 'sawtooth', 0.03 * v, -30); },
  ttEspreme(v = 1) { tone(140, 0.2, 'sawtooth', 0.02 * v, -60); noise(0.15, 0.03 * v, 900, 'bandpass', 0, 3); },
  ttBate(v = 1) { tone(46, 0.6, 'sine', 0.14 * v, -16); noise(0.4, 0.14 * v, 240, 'lowpass'); },
  ttCajado(v = 1) { tone(520, 0.6, 'sine', 0.014 * v, 260); tone(780, 0.6, 'triangle', 0.006 * v, 300); },
  ttBateCajado(v = 1) { noise(0.15, 0.08 * v, 1200, 'bandpass', 0, 1); tone(220, 0.2, 'triangle', 0.03 * v, -120); },
  ttEspinho(v = 1) { for (let k = 0; k < 5; k++) noise(0.05, 0.06 * v, 1800 + k * 300, 'bandpass', k * 0.03, 4); tone(160, 0.15, 'square', 0.02 * v, 80); },
  ttEstalo(v = 1) { noise(0.03, 0.14 * v, 4000, 'highpass'); tone(2400, 0.04, 'square', 0.02 * v, -1200); },
  ttChicote(v = 1) { noise(0.12, 0.1 * v, 3000, 'bandpass', 0, 1.5); },
  ttAsa(v = 1) { noise(0.1, 0.03 * v, 500, 'lowpass'); },
  ttGrito(v = 1) { tone(900, 0.5, 'sawtooth', 0.02 * v, -500); noise(0.4, 0.03 * v, 2600, 'bandpass', 0, 2); },
  ttCai(v = 1, p = 1) { tone(60 * p, 0.5, 'sine', 0.1 * v, -20); noise(0.4, 0.1 * v, 300 * p, 'lowpass'); }
});
Object.assign(TTB, { ttFx, ttP, ttSparks, ttDust, ttNear, ttLive, ttFloor, ttBlit, ttJit, ttPt, ttGl, TT_OSSOC, TT_FRIOC, TT_SANG });
