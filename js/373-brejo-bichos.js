'use strict';

/* ================= o Brejo das Bruxas: os bichos do pântano =================
   Cinco dos dez bichos da sexta camada (docs/camadas/06-brejo-bruxas.md, seção 6; as bruxas e os caçadores estão no
   374). Os do pântano: bicho, morto e ave. Pele de lodo, couro de turfa, pena preta; os avisos são a garganta que
   incha, as bolhas na água, o rangido da corda, a pá raspando, o grasnado.
   - o Sapo-Boi (bjsapo, pesado): um sapo do tamanho de um porco. A garganta incha com o coaxar (0,9 s) e ele salta
     alto em cima de onde o herói estava: a sombra da queda aparece no chão. Ao cair, a onda de lama corre pelo chão
     3,5 blocos para cada lado (pula-se por cima);
   - a Sanguessuga (bjsangue, emboscada na água): só nasce na água (o spawner é dela). Escondida, é só um risco em V
     na superfície vindo; as bolhas sobem (0,6 s) e ela salta e gruda. Grudada suga a vida; dois golpes nela a
     arrancam;
   - o Enforcado (bjenforcado, emboscada do teto): pendurado na corda, quieto. A corda range e os olhos abrem
     (0,7 s), ele cai em cima e agarra (estrangula). Depois anda arrastado atrás do herói, braços para a frente: o
     agarrão tem o aviso das mãos subindo (0,5 s);
   - o Homem da Turfa (bjturfeiro): o morto de mil anos que a turfa guardou, curtido e ruivo. Levanta da turfa quando
     o herói passa (1 s, a terra caindo), anda devagar com a pá de turfeiro. Raspa a pá no chão (0,8 s, faíscas e
     o som) e varre rente ao chão: quem pula passa por cima;
   - os Corvos do Patíbulo (bjcorvo, enxame): nascem em bando de 4 ou 5 e rodeiam o herói no alto. Um de cada vez
     grasna (0,5 s, o bico aberto, o olho aceso) e mergulha em linha reta onde o herói estava.
   O 375 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno), rampas de
   6 tons com luz de cima à esquerda; brilhos pelo HOOK.drawGlow e EYES_E. As peças comuns (BJB: tintas, formas,
   faíscas, sons) ficam aqui e o 374 e o 376 usam. Prefixo bj. */

Object.assign(ET, {
  bjsapo: { name: 'Sapo-Boi', w: 18, h: 14, hp: 230, dmg: 26, xp: 28, kb: 0.2, fly: false, amph: true, blood: '#4a5a2a' },
  bjsangue: { name: 'Sanguessuga', w: 14, h: 6, hp: 55, dmg: 7, xp: 14, kb: 0.6, fly: true, swim: true, blood: '#5a0e10' },
  bjenforcado: { name: 'O Enforcado', w: 10, h: 22, hp: 85, dmg: 18, xp: 22, kb: 0.6, fly: false, blood: '#3a2a22' },
  bjturfeiro: { name: 'O Homem da Turfa', w: 12, h: 22, hp: 260, dmg: 26, xp: 28, kb: 0.15, fly: false, blood: '#3a2414' },
  bjcorvo: { name: 'Corvo do Patíbulo', w: 10, h: 8, hp: 22, dmg: 9, xp: 6, kb: 1, fly: true, blood: '#2a1418' }
});
const BJ1_TYPES = ['bjsapo', 'bjsangue', 'bjenforcado', 'bjturfeiro', 'bjcorvo'];
// o ferro-do-brejo e as bases (377); filtradas agora e de novo a cada mundo
const BJ1_DROPS = {
  bjsapo: [['min_ferrobrejo', 0.14], ['pele_sapo', 0.3], ['pocao', 0.08], ['botas_atoleiro', 0.012]],
  bjsangue: [['min_ferrobrejo', 0.06], ['pocao', 0.1]],
  bjenforcado: [['min_ferrobrejo', 0.1], ['corda_forca', 0.3], ['pocao', 0.08], ['chapeu_cacador', 0.012]],
  bjturfeiro: [['min_ferrobrejo', 0.2, 1, 2], ['turfa', 0.4, 1, 3], ['pocao', 0.08], ['fisga_turfeiro', 0.012]],
  bjcorvo: [['min_ferrobrejo', 0.04], ['pena_corvo', 0.3]]
};
function bj1Tables() { for (const k of BJ1_TYPES) DROPS[k] = BJ1_DROPS[k].filter(([id]) => ITEMS[id]); }
bj1Tables();
Object.assign(NAV_WALKERS, { bjturfeiro: 1, bjenforcado: 1 });
Object.assign(CV_STEP, { bjsapo: 1, bjturfeiro: 1, bjenforcado: 1 });

const BJ1_COAXA = 0.9, BJ1_BOLHA = 0.6, BJ1_RANGE = 0.7, BJ1_AGARRA = 0.5, BJ1_LEVANTA = 1, BJ1_RASPA = 0.8, BJ1_GRASNA = 0.5;
const BJ1_ONDA = 3.5 * T;

/* ================= peças comuns (374 e 376 usam) ================= */
const BJB = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const BR = {
  sapo: R6(['#141a0c', '#222c14', '#34421e', '#4a5a2a', '#62743a', '#7e8e50']),       // o couro verde-lodo do sapo
  barriga: R6(['#3a3420', '#5a5232', '#7a7046', '#9a8e5c', '#b8ac76', '#d4c894']),
  verruga: R6(['#2a2012', '#423220', '#5c4830', '#786040', '#947a52', '#ae9468']),
  olhoA: R6(['#3a2a06', '#6a4e0c', '#9a7414', '#c89c22', '#ecc23a', '#fff07a']),     // o olho dourado do sapo
  sangue: R6(['#120606', '#220a0a', '#3a1010', '#561a16', '#74261e', '#94382a']),    // a sanguessuga, quase preta, vermelha por baixo
  pele: R6(['#1a0e08', '#2c180c', '#422614', '#5a361e', '#72482a', '#8c5c38']),      // a pele curtida da turfa
  morto: R6(['#1e1c1a', '#34302a', '#4a443a', '#625a4c', '#7c725e', '#968c76']),     // a pele cinza do enforcado
  ruivo: R6(['#2a0e06', '#46180a', '#642410', '#843418', '#a44a22', '#c4642e']),     // o cabelo ruivo da turfa
  pano: R6(['#16120e', '#262019', '#383026', '#4c4234', '#625644', '#7a6c56']),
  linho: R6(['#2e2a22', '#4a443a', '#686052', '#867e6c', '#a69c88', '#c4baa4']),
  corda: R6(['#1e160c', '#342614', '#4e3c20', '#6a5430', '#866e42', '#a28a58']),
  pau: R6(['#140c06', '#24180c', '#382614', '#4e3820', '#664c2e', '#80623e']),
  ferro: R6(['#121214', '#1e1e22', '#2e2e34', '#424248', '#5a5a62', '#76767e']),
  ferrugem: R6(['#1e0e06', '#34180a', '#4e2610', '#6c3818', '#8c4e24', '#ac6a36']),
  pena: R6(['#060608', '#0e0e12', '#18181e', '#24242c', '#32323e', '#464a5a']),     // o corvo, com o reflexo azul
  bico: R6(['#0a0a0a', '#161616', '#222222', '#303030', '#444444', '#5c5c5c']),
  osso: R6(['#2a261e', '#4a4436', '#6e6652', '#968c74', '#bcb296', '#ddd4ba']),
  lodo: R6(['#0e0c08', '#1a160e', '#282014', '#382c1c', '#4a3c26', '#5e4e32']),
  couro: R6(['#160e0a', '#261810', '#382418', '#4c3220', '#62422a', '#7a5636']),
  chapeu: R6(['#08080a', '#101012', '#1a1a1e', '#26262a', '#343438', '#46464c']),
  bruxa: R6(['#1a1c14', '#2c3022', '#424834', '#5a6248', '#747e5e', '#909a78']),     // a pele esverdeada das bruxas
  roxo: R6(['#120a14', '#20122a', '#301c3a', '#42284e', '#563666', '#6e4880']),
  vinho: R6(['#1a0608', '#2e0c10', '#44141a', '#5c1e24', '#762a2e', '#90383a']),
  cinzaV: R6(['#1a1a1a', '#2c2c2c', '#424242', '#5a5a5a', '#747474', '#909090']),   // os cabelos brancos das velhas
  vela: R6(['#3a3628', '#5a5440', '#7c745a', '#9e9476', '#c0b694', '#dcd4b4']),
  vidro: R6(['#0e1a10', '#1a3020', '#2a4a30', '#3e6a44', '#5a8e5c', '#82b478']),
  palha: R6(['#2a2010', '#40321a', '#584624', '#725c30', '#8c743e', '#a88e52'])
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
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) P.put(x, y, R, f(x, y));
  }
}
function perna(P, hx, hy, fx, fy, R, base, s, r = 1.4, kf = 0.8) {
  const kx = (hx + fx) / 2 + kf, ky = (hy + fy) / 2;
  tubo(P, hx, hy, kx, ky, r, r * 0.85, R, base, s);
  tubo(P, kx, ky, fx, fy - r * 0.7, r * 0.85, r * 0.7, R, base + 0.1, s + 1);
  for (let x = fx - r * 0.6; x <= fx + r * 1.4; x += 0.5) P.put(x, fy, R, base - 0.6);
}
function braco(P, sx, sy, hx, hy, R, base, s, r = 1.1, fist = 1.1) {
  const ex = (sx + hx) / 2 - 0.4, ey = (sy + hy) / 2 + 1.2;
  tubo(P, sx, sy, ex, ey, r, r * 0.85, R, base, s); tubo(P, ex, ey, hx, hy, r * 0.85, r * 0.75, R, base + 0.2, s + 1);
  if (fist) ell(P, hx, hy, fist, fist * 0.9, 0, R, s + 2, base + 0.4);
}
// uma saia ou um manto longo: do quadril à barra, rasgado embaixo, pregas
function saia(P, x0, x1, y0, y1, R, s, flare = 2, rag = 0.4) {
  poly(P, [[x0, y0], [x1, y0], [x1 + flare, y1], [x0 - flare, y1]], R, (x, y) => 2.8 - (x - (x0 + x1) / 2) * 0.12 + (Math.abs(Math.sin(x * 1.3 + y * 0.12)) < 0.25 ? -1 : 0) + cg(x, y, s) * 0.4 - (y > y1 - 2 && hash2(x, y, s) < rag ? 9 : 0));
}
Object.assign(BJB, { R6, BR, setO, ell, tubo, poly, perna, braco, saia, cp, cg });
}

/* ---------- as faíscas, as gotas e o lodo ---------- */
const bjFx = [], bjFxGl = {};
function bjP(o) { if (bjFx.length < 500) bjFx.push(o); }
function bjSparks(x, y, n, cols, sp = 40, g = 0, life = 0.4, lit = true) {
  if (bjFx.length > 500) return;
  for (let i = 0; i < n; i++) bjP({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1, lit });
}
const BJ_LAMAC = ['#3a2c1c', '#2a2016', '#4e3c26'], BJ_AGUAC = ['#5a4a30', '#7a6a4a', '#3a2c1c'], BJ_TURFAC = ['#2c1e12', '#3e2c1a', '#544028'];
const bjLama = (x, y, n, sp = 40, up = -60, cols = BJ_LAMAC) => { for (let i = 0; i < n; i++) bjP({ x: x + rnd(-3, 3), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(up, up * 0.3), g: 300, life: rnd(0.4, 0.8), max: 0.8, col: cols[i % 3], size: 1, lit: false }); };
HOOK.update.push(dt => {
  for (let i = bjFx.length - 1; i >= 0; i--) { const p = bjFx[i]; p.life -= dt; if (p.life <= 0) { bjFx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of bjFx) { if (!p.lit) continue; const g = bjFxGl[p.col] || (bjFxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawWorld.push((cx, cy) => {
  for (const p of bjFx) { if (p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2) * 0.85; lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of bjFx) { if (!p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
const bjNear = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const bjLive = e => e && !e.dead && enemies.includes(e);
function bjFloor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
// a superfície da água acima de (x, y) em px, ou null se (x, y) não está na água
function bjSurf(x, y) { const tx = Math.floor(x / T); let ty = Math.floor(y / T); if (!aguaAt(tx, ty)) return null; while (ty > 0 && aguaAt(tx, ty - 1)) ty--; return ty * T; }
function bjBlit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const bjJit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
const bjPt = (e, x, y, bx, by) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];
const BJ1_GL = {};
const bjGl = (k, r, col) => BJ1_GL[k] || (BJ1_GL[k] = glow(r, col));
const bjHits = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;

/* ================= arte ================= */
const BJ1 = {};
{
const { BR, setO, ell, tubo, poly, perna, braco, saia, cp, cg } = BJB;

/* ---------- o Sapo-Boi, 28 x 20: o corpo no x 13, a barriga no chão na linha 19 ---------- */
const SA_BX = 13, SA_FY = 19;
function sapo(k) {   // 0 sentado, 1 a garganta inchada (o aviso), 2 no ar (esticado), 3 caindo (achatado)
  const P = cp(28, 20), s = 37301 + k * 7, air = k === 2, sq = k === 3;
  const by = air ? 10 : sq ? 14.4 : 12.6, rx = sq ? 10.6 : air ? 8.4 : 9.4, ry = sq ? 4.4 : air ? 4.6 : 5.6;
  // as patas de trás: a coxa grossa dobrada (esticada no salto)
  if (air) { tubo(P, SA_BX - 5, by + 1, SA_BX - 11, by + 5, 2.6, 1.6, BR.sapo, 2, s); tubo(P, SA_BX - 11, by + 5, SA_BX - 13, by + 8, 1.4, 1, BR.sapo, 2, s + 1); }
  else { ell(P, SA_BX - 6, by + 2.4, 4.4, 3.6, 0.3, BR.sapo, s, 2.2); for (let x = SA_BX - 11; x <= SA_BX - 4; x += 0.5) P.put(x, SA_FY, BR.sapo, 1.6); }
  // o corpo largo, verrugas
  ell(P, SA_BX, by, rx, ry, -0.1, BR.sapo, s + 2, 2.6, (u, v, x, y) => [v > 0.35 ? BR.barriga : BR.sapo, (hash2(x, y, s) < 0.12 && v < 0.2 ? 1.4 : 0) + (v > 0.35 ? -0.4 : 0)]);
  // a garganta: o saco que incha embaixo da boca
  const gs = k === 1 ? 4.6 : 2;
  ell(P, SA_BX + rx * 0.62, by + ry * 0.5, gs, gs * 0.86, 0, BR.barriga, s + 3, k === 1 ? 3.6 : 2.6, (u, v) => [BR.barriga, k === 1 && u < -0.2 && v < -0.2 ? 1 : 0]);
  // a cabeça chata, a boca rasgada larga, os olhos dourados saltados em cima
  ell(P, SA_BX + rx * 0.5, by - ry * 0.55, 5, 3, -0.1, BR.sapo, s + 4, 3);
  for (let x = SA_BX + rx * 0.2; x <= SA_BX + rx + 0.6; x += 0.5) P.put(x, by - ry * 0.2 + (x - SA_BX) * 0.05, BR.sapo, 0.6);
  for (const ox of [-2.4, 1.6]) { ell(P, SA_BX + rx * 0.45 + ox, by - ry - 0.6, 1.8, 1.6, 0, BR.olhoA, s + 5, 3.4); P.put(SA_BX + rx * 0.45 + ox + 0.6, by - ry - 0.6, BR.bico, 0); }
  // a pata da frente
  if (!air) { tubo(P, SA_BX + 4, by + 2, SA_BX + 5.6, SA_FY - 0.6, 1.4, 1.1, BR.sapo, 2.8, s + 6); for (let x = SA_BX + 4.6; x <= SA_BX + 7.6; x += 0.5) P.put(x, SA_FY, BR.sapo, 2.4); }
  else tubo(P, SA_BX + 5, by + 2, SA_BX + 9, by + 4, 1.3, 1, BR.sapo, 2.8, s + 6);
  return setO(P.done());
}

/* ---------- a Sanguessuga, 20 x 10: o corpo no x 10, a barriga na linha 9 ---------- */
function sangue(k) {   // 0-1 ondulando, 2 o bote (a boca aberta, esticada)
  const P = cp(20, 10), s = 37321 + k * 3, L = k === 2 ? 9 : 7, ph0 = k * 1.6;
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, x = 10 - L + t * L * 2, y = 6 + Math.sin(t * 6 + ph0) * (k === 2 ? 0.4 : 1.2), r = 1.2 + Math.sin(t * Math.PI) * 1.6;
    for (let oy = -r; oy <= r; oy += 0.5) P.put(x, y + oy, oy > r * 0.4 ? BR.sangue : BR.sangue, 2.6 - oy / r * 1.4 + (oy > r * 0.4 ? 1.4 : 0) + (i % 4 === 0 ? -0.6 : 0) + cg(x | 0, (y + oy) | 0, s) * 0.3);
  }
  // a ventosa da boca na frente
  ell(P, 10 + L, 6, 1.6, 1.8, 0, BR.sangue, s + 1, 3.4, (u) => [BR.sangue, u > 0.3 && k === 2 ? -3 : 0]);
  if (k === 2) for (const dy of [-1, 1]) P.put(10 + L + 1.4, 6 + dy, BR.osso, 4.6);   // os dentinhos
  return setO(P.done());
}

/* ---------- o Enforcado, 20 x 28: o corpo no x 10, os pés na linha 27 ---------- */
const EN_BX = 10, EN_FY = 27;
function enforcado(k) {   // 0 pendurado (morto), 1 os olhos abertos (aviso), 2 caindo com os braços, 3-4 andando, 5 as mãos subindo (aviso), 6 o agarrão
  const P = cp(20, 28), s = 37331 + k * 5, hang = k <= 2, wk = k === 3 ? 1 : k === 4 ? -1 : 0;
  const neck = [EN_BX + (hang ? 1.6 : 0.6), 8], tilt = hang ? 0.6 : 0.2;
  // as pernas: penduradas com os pés para baixo, ou arrastadas
  if (hang) { tubo(P, EN_BX - 0.8, 17, EN_BX - 1.2, EN_FY - 1, 1.1, 0.9, BR.morto, 1.8, s); tubo(P, EN_BX + 0.8, 17, EN_BX + 1.4, EN_FY, 1.1, 0.9, BR.morto, 2.6, s + 1); }
  else { perna(P, EN_BX - 1, 17, EN_BX - 2 - wk * 2, EN_FY, BR.pano, 1.8, s, 1.2, 0.6); perna(P, EN_BX + 1, 17, EN_BX + 2 + wk * 2, EN_FY, BR.pano, 2.6, s + 1, 1.2, 0.6); }
  // a camisola de linho rasgada, comprida, molhada
  saia(P, EN_BX - 3, EN_BX + 3, 9, 20, BR.linho, s + 2, 1.4, 0.5);
  // os braços: soltos pendurados; caindo para a frente; o agarrão estendido
  const hn = k === 2 ? [[EN_BX + 8, 9], [EN_BX + 7, 12]] : k === 5 ? [[EN_BX + 6, 4], [EN_BX + 5, 6]] : k === 6 ? [[EN_BX + 9, 11], [EN_BX + 9, 13]] : hang ? [[EN_BX - 3, 19], [EN_BX + 3.4, 19]] : [[EN_BX + 7, 12 + wk], [EN_BX + 6, 13 - wk]];
  braco(P, EN_BX - 1.4, 10, hn[0][0], hn[0][1], BR.morto, 1.8, s + 3, 0.9, 0.9);
  // a cabeça caída de lado, o cabelo grudado, a boca aberta
  const hx = EN_BX + 1 + (hang ? 2 : 1.2), hy = 5.6 + (hang ? 0.6 : 0);
  ell(P, hx, hy, 2.6, 3, tilt, BR.morto, s + 4, 3);
  poly(P, [[hx - 3, hy - 3], [hx + 2.6, hy - 3.4], [hx + 2, hy - 1.6], [hx - 1, hy - 1], [hx - 2.6, hy + 3]], BR.pano, (x, y) => 1.8 + (x % 2) * 0.6);
  P.put(hx + 1.4, hy + 1.6, BR.morto, 0.4); P.put(hx + 1, hy + 2, BR.morto, 0.6);
  P.put(hx + 1.2, hy, BR.morto, k === 1 || k >= 2 ? 0 : 1.6);   // o olho (o EYES acende quando abre)
  // a corda no pescoço, o nó atrás da orelha
  for (let x = neck[0] - 2; x <= neck[0] + 2; x += 0.5) P.put(x, neck[1] + (x - neck[0]) * 0.3, BR.corda, 4);
  P.put(neck[0] - 2.4, neck[1] - 1, BR.corda, 4.6); P.put(neck[0] - 2.6, neck[1] - 2, BR.corda, 3.6);
  if (!hang) for (let i = 0; i < 6; i++) P.put(neck[0] - 3 - i * 0.6, neck[1] - 1 + i * 0.9, BR.corda, 3.4 - i * 0.2);   // a ponta da corda arrastando
  braco(P, EN_BX + 1.6, 10.4, hn[1][0], hn[1][1], BR.morto, 3, s + 5, 0.9, 0.9);
  return setO(P.done());
}

/* ---------- o Homem da Turfa, 28 x 28: o corpo no x 12, os pés na linha 27 ---------- */
const TU_BX = 12, TU_FY = 27;
function turfeiro(k) {   // 0 parado, 1-2 andando, 3 a pá raspando o chão (aviso), 4 a varrida
  const P = cp(28, 28), s = 37341 + k * 5, wk = k === 1 ? 1 : k === 2 ? -1 : 0, low = k >= 3 ? 1.6 : 0;
  perna(P, TU_BX - 1.4, 17 + low, TU_BX - 2.4 - wk * 2.2, TU_FY, BR.pele, 1.8, s, 1.5, 0.8);
  // o tronco curtido, magro, as costelas e a corcunda
  ell(P, TU_BX + 0.4, 12 + low, 3.6, 5.6, 0.15, BR.pele, s + 1, 2.6, (u, v, x, y) => [BR.pele, (y % 2 === 0 && v > -0.4 && v < 0.5 && u > -0.4 ? -0.7 : 0)]);
  // o pano de couro na cintura e o cinto de corda
  poly(P, [[TU_BX - 3.6, 16 + low], [TU_BX + 3.6, 16 + low], [TU_BX + 4, 20 + low], [TU_BX - 4, 20.6 + low]], BR.couro, (x, y) => 2.4 + (x % 3 === 0 ? -0.6 : 0) + cg(x, y, s) * 0.4);
  for (let x = TU_BX - 3.6; x <= TU_BX + 3.6; x += 0.5) P.put(x, 16 + low, BR.corda, 3.6);
  perna(P, TU_BX + 1.4, 17 + low, TU_BX + 2.4 + wk * 2.2, TU_FY, BR.pele, 2.8, s + 2, 1.5, 0.8);
  // a cabeça: o crânio afundado, o rosto achatado de couro, o cabelo ruivo trançado
  const hx = TU_BX + 1.6 + low * 0.8, hy = 5 + low * 1.2;
  ell(P, hx, hy, 2.8, 3.2, 0.2, BR.pele, s + 3, 2.8, (u, v) => [BR.pele, v < -0.5 ? 0.5 : 0]);
  for (let i = 0; i < 9; i++) P.put(hx - 2.6 - (i > 4 ? (i - 4) * 0.3 : 0), hy - 2.4 + i * 1.1, BR.ruivo, 3.4 - (i % 2) * 0.8);   // a trança
  for (let x = hx - 2.4; x <= hx + 2; x += 0.5) P.put(x, hy - 3, BR.ruivo, 3.6);
  P.put(hx + 1.4, hy - 0.4, BR.pele, 0.2); P.put(hx + 1, hy + 1.6, BR.pele, 0.6); P.put(hx + 1.8, hy + 1.6, BR.pele, 0.6);
  for (let x = hx - 2; x <= hx + 2; x += 0.5) P.put(x, hy + 3.4, BR.corda, 3.8);   // a corda do sacrifício no pescoço
  // o braço de trás e a pá de turfeiro (cabo comprido, a lâmina de ferro estreita)
  const blade = k === 3 ? [[TU_BX + 4, 13], [TU_BX + 13, TU_FY - 1]] : k === 4 ? [[TU_BX + 3, 17], [TU_BX + 15, TU_FY - 2]] : [[TU_BX + 3, 9], [TU_BX + 7, TU_FY - 3]];
  braco(P, TU_BX - 0.6, 9 + low, blade[0][0] - 1, blade[0][1] + 2, BR.pele, 1.8, s + 4, 1, 1);
  const [a, b] = blade, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  tubo(P, a[0] - ux * 3, a[1] - uy * 3, b[0] - ux * 3, b[1] - uy * 3, 0.7, 0.7, BR.pau, 3, s + 5);
  for (let t = 0; t < 4; t += 0.5) for (let w = -1.4; w <= 1.4; w += 0.5) P.put(b[0] - ux * (3 - t) - uy * w, b[1] - uy * (3 - t) + ux * w, BR.ferrugem, 3.2 - w * 0.6 + (t > 3 ? 1 : 0));
  braco(P, TU_BX + 1.2, 9.4 + low, a[0] + ux * 4, a[1] + uy * 4, BR.pele, 2.8, s + 6, 1, 1);
  return setO(P.done());
}

/* ---------- o Corvo, 16 x 12: o corpo no x 8, a barriga na linha 11 ---------- */
function corvo(k) {   // 0 asas em cima, 1 asas embaixo, 2 grasnando, 3 mergulho (asas fechadas)
  const P = cp(16, 12), s = 37361 + k * 3;
  if (k !== 3) for (const sd of [0, 1]) {
    const up = k === 0 || (k === 2 && sd), tip = up ? [8 - 2 + sd * 2, 0] : [8 - 3 + sd * 3, 11], base = sd ? 3 : 1.8;
    poly(P, [[7, 5], [tip[0] - 5, tip[1]], [tip[0] + 1, tip[1] + (up ? 2 : -1)], [10, 6.4]], BR.pena, (x, y) => base + (x % 2 ? -0.5 : 0.3) + cg(x, y, s) * 0.3);
  }
  ell(P, 7.6, 6.4, k === 3 ? 5 : 3.8, k === 3 ? 1.8 : 2.4, k === 3 ? 0.35 : 0.1, BR.pena, s + 1, 2.8);
  for (let i = 0; i < 4; i++) P.put(3 - i * 0.6, 6.4 + i * 0.3 - (k === 3 ? 1.6 : 0), BR.pena, 2.4 - i * 0.3);   // o rabo
  ell(P, 11.4, 4.6 + (k === 3 ? 2 : 0), 1.8, 1.6, 0, BR.pena, s + 2, 3.2);
  P.put(12, 4 + (k === 3 ? 2 : 0), BR.bico, 0);
  const by = 4.8 + (k === 3 ? 2.2 : 0);
  P.put(13.2, by, BR.bico, 4); P.put(14.2, by + 0.2, BR.bico, 3.4); P.put(15, by + 0.6, BR.bico, 2.6);
  if (k === 2) { P.put(13.4, by + 1.2, BR.bico, 2.4); P.put(14.4, by + 1.8, BR.bico, 2); } else P.put(13.4, by + 0.8, BR.bico, 2.6);
  if (k !== 3) { P.put(7.6, 9.6, BR.bico, 3); P.put(8.6, 9.6, BR.bico, 2.6); }   // as patas
  return setO(P.done());
}

BJ1.get = () => BJ1.ready || (BJ1.ready = {
  sa: [0, 1, 2, 3].map(sapo), sg: [0, 1, 2].map(sangue), en: [0, 1, 2, 3, 4, 5, 6].map(enforcado), tu: [0, 1, 2, 3, 4].map(turfeiro), co: [0, 1, 2, 3].map(corvo)
});
Object.assign(BJ1, { SA_BX, SA_FY, EN_BX, EN_FY, TU_BX, TU_FY });
}

/* ================= desenho ================= */
const bjSaPose = e => e.state === 'croak' ? 1 : e.state === 'leap' ? (e.vy < 120 ? 2 : 3) : e.state === 'land' ? 3 : (e.state === 'hop' && !e.onGround) ? 2 : 0;
DRAW_E.bjsapo = (e, fx, fy, fl) => {
  const k = bjSaPose(e), J = e.state === 'croak' ? bjJit(e, e.stateT < 0.3, 50) : 0;
  bjBlit(cvPick(BJ1.get().sa[k], e, fl), e, fx, fy, BJ1.SA_BX + 1, BJ1.SA_FY + 1, J);
};
WARN_E.bjsapo = e => e.state === 'croak';
EYES_E.bjsapo = (e, fx, fy) => { if (e.state !== 'croak') return; lc.globalAlpha = 0.5; lc.drawImage(bjGl('olhoA', 4, '#ecc23a'), Math.round(fx + 4 * e.facing) - 4, Math.round(fy - 15) - 4); };

DRAW_E.bjsangue = (e, fx, fy, fl) => {
  if (e.state === 'lurk' || e.state === 'ripple' || e.state === 'bubble') return;   // escondida: só a água (drawWorld)
  const k = e.state === 'lunge' || e.state === 'latch' ? 2 : Math.floor(e.t * 6) % 2;
  const S = BJ1.get().sg[k], img = cvPick(S, e, fl); lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 2);
};
WARN_E.bjsangue = e => e.state === 'bubble';

const bjEnPose = e => e.state === 'hang' ? 0 : e.state === 'creak' ? 1 : e.state === 'drop' || e.state === 'choke' ? 2 : e.state === 'reach' ? 5 : e.state === 'grab' ? 6 : Math.abs(e.vx) > 4 && e.onGround ? 3 + Math.floor(e.t * 4) % 2 : 3;
DRAW_E.bjenforcado = (e, fx, fy, fl) => {
  const hang = e.state === 'hang' || e.state === 'creak', sw = hang ? Math.sin(e.t * 1.3 + e.seed) * (e.state === 'creak' ? 0.4 : 1.6) : 0;
  if (hang && e.ropeY !== undefined) {   // a corda até o teto
    const top = Math.round(e.ropeY - cam.y), nx = Math.round(fx + 1.6 * e.facing + sw * 0.4), ny = fy - 20;
    for (let y = top; y < ny; y++) { lc.fillStyle = (y & 3) === 0 ? '#4e3c20' : '#6a5430'; lc.fillRect(nx + Math.round(sw * (y - top) / Math.max(1, ny - top)) - (y & 1 ? 0 : 0), y, 1, 1); }
  }
  bjBlit(cvPick(BJ1.get().en[bjEnPose(e)], e, fl), e, fx + Math.round(sw), fy, BJ1.EN_BX + 1, BJ1.EN_FY + 1, bjJit(e, e.state === 'creak', 30));
};
EYES_E.bjenforcado = (e, fx, fy) => { if (e.state === 'hang') return; const hang = e.state === 'creak', x = fx + (hang ? 4.2 : 3.2) * e.facing, y = fy - 1 - (BJ1.EN_FY - (hang ? 6.2 : 5.6)); lc.globalAlpha = e.state === 'creak' || e.state === 'reach' ? 0.8 : 0.35; lc.drawImage(bjGl('olhoP', 3, '#d8e0c0'), Math.round(x) - 3, Math.round(y) - 3); };
WARN_E.bjenforcado = e => e.state === 'creak' || e.state === 'reach';

const bjTuPose = e => e.state === 'drag' ? 3 : e.state === 'sweep' ? 4 : Math.abs(e.vx) > 3 && e.onGround ? 1 + Math.floor(e.t * 3.4) % 2 : 0;
DRAW_E.bjturfeiro = (e, fx, fy, fl) => {
  const img = cvPick(BJ1.get().tu[bjTuPose(e)], e, fl);
  if (e.state === 'buried') return;
  if (e.state === 'rise') {   // saindo da turfa: o corpo sobe por dentro do chão
    const q = clamp(1 - e.stateT / BJ1_LEVANTA, 0, 1), dy = Math.round((1 - q) * 24);
    lc.save(); lc.beginPath(); lc.rect(fx - 20, fy - 40, 40, 40); lc.clip(); bjBlit(img, e, fx, fy + dy, BJ1.TU_BX + 1, BJ1.TU_FY + 1, bjJit(e, true, 30)); lc.restore(); return;
  }
  bjBlit(img, e, fx, fy, BJ1.TU_BX + 1, BJ1.TU_FY + 1, bjJit(e, e.state === 'drag', 36));
};
EYES_E.bjturfeiro = (e, fx, fy) => { if (e.state === 'buried' || e.state === 'rise') return; const low = e.state === 'drag' || e.state === 'sweep' ? 1.6 : 0; lc.globalAlpha = 0.3; lc.drawImage(bjGl('olhoT', 3, '#c4642e'), Math.round(fx + (3 + low * 0.8) * e.facing) - 3, Math.round(fy - 1 - (BJ1.TU_FY - (4.6 + low * 1.2))) - 3); };
WARN_E.bjturfeiro = e => e.state === 'drag';

DRAW_E.bjcorvo = (e, fx, fy, fl) => {
  const k = e.state === 'caw' ? 2 : e.state === 'dive' ? 3 : Math.floor(e.t * 10 + e.seed) % 2, S = BJ1.get().co[k], img = cvPick(S, e, fl);
  lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 2);
};
EYES_E.bjcorvo = (e, fx, fy) => { if (e.state !== 'caw' && e.state !== 'dive') return; lc.globalAlpha = 0.8; lc.drawImage(bjGl('olhoC', 3, '#ff6040'), Math.round(fx + 3.6 * e.facing) - 3, Math.round(fy - 7 + (e.state === 'dive' ? 2 : 0)) - 3); };
WARN_E.bjcorvo = e => e.state === 'caw';

/* ================= comportamento ================= */
const bj1Ondas = [], bj1Bando = {};

/* ---------- o Sapo-Boi ---------- */
AI.bjsapo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'croak') {   // a garganta incha: o coaxar
    e.vx = approach(e.vx, 0, 900 * dt);
    if (e.stateT <= 0) {   // salta em cima de onde o herói está
      const tx = pl.x + pl.w / 2, d = tx - (e.x + e.w / 2), tFl = 0.9;
      e.state = 'leap'; e.landX = tx; e.vy = -GRAV * tFl / 2; e.vx = clamp(d / tFl, -150, 150); e.leapT0 = 0; e.wasAir = false; sfx.bjSalta(Math.max(0.4, bjNear(e)));
      const f = bjFloor(tx, pl.y + pl.h - 2, 8); e.landY = f !== null ? f : e.y + e.h;
    }
    return;
  }
  if (e.state === 'leap') {
    if (!e.onGround) e.wasAir = true;
    if (e.hitWall) e.vx = 0;
    if (e.wasAir && e.onGround) {   // caiu: a onda de lama corre pelo chão para os dois lados
      e.state = 'land'; e.stateT = 0.8; e.vx = 0; shake(3); sfx.bjCai(Math.max(0.4, bjNear(e, 260)));
      const cx = e.x + e.w / 2, gy = e.y + e.h; bjLama(cx, gy, 14, 70, -110);
      if (!pl.dead && overlap(e, pl)) hurtPlayer(e.dmg, cx, e, false);
      bj1Ondas.push({ x: cx, y: gy, t: 0, r: 0, dmg: Math.round(e.dmg * 0.7), hit: false, owner: e });
    }
    return;
  }
  if (e.state === 'land') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'sit'; e.atkCD = 1.6 + Math.random() * 1.2; } return; }
  // anda aos pulinhos
  if (e.state === 'hop') { if (e.onGround && e.stateT <= 0) e.state = 'sit'; return; }
  e.state = 'sit'; e.vx = approach(e.vx, 0, 600 * dt);
  e.hopT = (e.hopT || 0) - dt;
  if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && e.sees && dist < 12 * T && Math.abs(dy) < 6 * T) { e.state = 'croak'; e.stateT = BJ1_COAXA; sfx.bjCoaxa(Math.max(0.4, bjNear(e, 260))); return; }
  if (e.onGround && e.hopT <= 0) {
    let dir = aggro ? Math.sign(dx) : 0; if (!aggro) { cvWander(e, dt); dir = e.wander; }
    e.hopT = aggro ? 0.7 + Math.random() * 0.4 : 1.4 + Math.random() * 1.6;
    if (dir) { const L = ledgeAhead(e, dir, dy, aggro); if (L === 'stop') return; e.facing = dir; e.vx = dir * (aggro ? 70 : 40); e.vy = -170; e.state = 'hop'; e.stateT = 0.15; }
  }
};

/* ---------- a Sanguessuga ---------- */
// só se mexe dentro da água: o que sairia dela fica parado (ou cai de volta, se está fora)
function bjSgMove(e, vx, vy, dt) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, nx = cx + vx * dt, ny = cy + vy * dt;
  e.vx = aguaAt(Math.floor(nx / T), Math.floor(cy / T)) ? vx : 0;
  e.vy = aguaAt(Math.floor(cx / T), Math.floor(ny / T)) ? vy : (vy > 0 ? 0 : 0);
}
AI.bjsangue = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, wet = aguaAt(Math.floor(cx / T), Math.floor(cy / T)), pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'latch') {   // grudada: vai junto do herói e suga
    if (pl.dead || !e.latch) { e.state = 'drop'; bjSoltar(e); return; }
    e.x = pl.x + pl.w / 2 - e.w / 2 + e.latchOx; e.y = pl.y + e.latchOy; e.vx = 0; e.vy = 0; e.facing = e.latchOx < 0 ? 1 : -1;
    e.suck -= dt;
    if (e.suck <= 0) { e.suck = 0.6; pl.invuln = 0; const r = hurtPlayer(e.dmg, pcx, null, true); if (r === 'hit') { e.hp = Math.min(e.maxHp, e.hp + e.dmg); bjSparks(pcx, pl.y + pl.h / 2, 3, ['#94382a', '#561a16'], 30, 120, 0.4, false); sfx.bjSuga(0.7); } }
    if (e.stateT <= 0) { e.state = 'drop'; bjSoltar(e); e.atkCD = 3; }
    return;
  }
  if (e.state === 'drop') {   // caiu do herói: rasteja e cai de volta para a água
    e.latch = false;
    if (wet) { e.state = 'lurk'; e.atkCD = Math.max(e.atkCD, 2.5); return; }
    e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); if (e.onGround) e.vx = approach(e.vx, (e.homeX > cx ? 1 : -1) * 20, 200 * dt);
    return;
  }
  if (!wet) { e.state = 'drop'; return; }
  if (e.state === 'lunge') {   // o bote: reto, rápido, até 0,5 s
    e.vx = e.lv[0]; e.vy = e.lv[1];
    if (!pl.dead && overlap(e, pl) && pl.invuln <= 0) {
      const r = hurtPlayer(e.dmg, cx, e, false);
      if (r === 'hit') { e.state = 'latch'; e.latch = true; e.stateT = 3.5; e.suck = 0.6; e.hitsOn = 0; e.latchOx = clamp(cx - pcx, -6, 6) || 4; e.latchOy = 8 + Math.random() * 6; bjPrender(e); sfx.bjGruda(0.9); return; }
      e.state = 'lurk'; e.atkCD = 1.8; return;
    }
    if (e.stateT <= 0) { e.state = 'lurk'; e.atkCD = 1.2; }
    return;
  }
  if (e.state === 'bubble') {   // as bolhas sobem: o aviso
    bjSgMove(e, 0, 0, dt);
    if (Math.random() < dt * 14) { const s = bjSurf(cx, cy); if (s !== null) bjP({ x: cx + rnd(-4, 4), y: s - 1, vx: 0, vy: -10, g: 0, life: 0.3, max: 0.3, col: '#9a8a66', size: 1, lit: false }); }
    if (e.stateT <= 0) { const d = Math.hypot(pcx - cx, pcy - cy) || 1; e.lv = [(pcx - cx) / d * 200, (pcy - cy) / d * 200]; e.state = 'lunge'; e.stateT = 0.5; sfx.bjBote(Math.max(0.5, bjNear(e))); e.facing = Math.sign(pcx - cx) || e.facing; }
    return;
  }
  // escondida: anda devagar no fundo; vê o herói na água ou na beira e vem em V pela superfície
  const near = !pl.dead && aggro && dist < 9 * T && (pl.naAgua > 0 || Math.abs(dy) < 3 * T);
  if (near) {
    e.state = 'ripple';
    const tx = pcx, ty = Math.max(pcy, (bjSurf(cx, cy) || cy) + 8), d = Math.hypot(tx - cx, ty - cy) || 1;
    bjSgMove(e, (tx - cx) / d * 55, (ty - cy) / d * 55, dt); e.facing = Math.sign(tx - cx) || e.facing;
    if (dist < 2.8 * T && e.atkCD <= 0 && clearPath(e, pl)) { e.state = 'bubble'; e.stateT = BJ1_BOLHA; sfx.bjBolhas(Math.max(0.5, bjNear(e))); }
  } else {
    e.state = 'lurk'; cvWander(e, dt);
    bjSgMove(e, (e.wander || 0) * 14, Math.sin(e.t * 0.7 + e.seed) * 8, dt); if (e.wander) e.facing = e.wander;
  }
};

/* ---------- o Enforcado ---------- */
AI.bjenforcado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, cx = e.x + e.w / 2;
  if (e.state === 'hang' || e.state === 'creak') {   // pendurado: não cai
    e.vx = 0; e.y = e.hangY; e.vy = -GRAV * dt;
    if (e.state === 'hang') {
      if (!pl.dead && aggro && Math.abs(pcx - cx) < 2.6 * T && pl.y > e.y && pl.y - (e.y + e.h) < 5 * T && clearPath(e, pl)) { e.state = 'creak'; e.stateT = BJ1_RANGE; e.facing = Math.sign(dx) || e.facing; sfx.bjRange(Math.max(0.5, bjNear(e))); }
      return;
    }
    if (e.stateT <= 0) { e.state = 'drop'; e.vy = 40; e.vx = clamp(dx * 2, -60, 60); e.grabbed = false; sfx.bjCorda(Math.max(0.5, bjNear(e))); e.ropeY = undefined; }
    return;
  }
  if (e.state === 'drop') {   // caindo em cima: o agarrão
    if (!e.grabbed && !pl.dead && overlap(e, pl)) { e.grabbed = true; const r = hurtPlayer(e.dmg, cx, e, false); if (r === 'hit') { e.state = 'choke'; e.stateT = 0.9; e.sq = 0.45; if (typeof elEnraizar === 'function') elEnraizar(0.9); } }
    if (e.onGround && e.state === 'drop') { e.state = 'walk'; e.atkCD = 1.2; bjLama(cx, e.y + e.h, 6, 30); }
    return;
  }
  if (e.state === 'choke') {   // estrangula: segura o herói por um instante
    if (!pl.dead) { pl.vx = 0; if (typeof elEnraizar === 'function') elEnraizar(0.2); e.x = lerp(e.x, pl.x + pl.w / 2 - e.w / 2 - e.facing * 6, Math.min(1, dt * 10)); }
    e.sq -= dt; if (e.sq <= 0 && !pl.dead) { e.sq = 0.45; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.35), cx, null, true); sfx.bjEngasga(0.7); }
    if (e.stateT <= 0 || pl.dead) { e.state = 'walk'; e.atkCD = 1.6; if (!pl.dead) pl.vx = e.facing * 120; }
    return;
  }
  if (e.state === 'reach') {   // as mãos sobem (aviso)
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { e.state = 'grab'; e.stateT = 0.3; e.vx = e.facing * 120; e.hitThis = false; }
    return;
  }
  if (e.state === 'grab') {
    const hb = { x: e.facing > 0 ? cx : cx - 18, y: e.y + 4, w: 18, h: 12 };
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, cx, e, false); if (r === 'hit') { e.state = 'choke'; e.stateT = 0.7; e.sq = 0.45; if (typeof elEnraizar === 'function') elEnraizar(0.7); return; } }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 12 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 30 : 12, 400, 240, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (Math.random() < dt * 0.4 && aggro) sfx.bjGeme(Math.max(0.2, bjNear(e) * 0.6));
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && Math.abs(dx) < 26 && Math.abs(dy) < 18 && clearPath(e, pl)) { e.state = 'reach'; e.stateT = BJ1_AGARRA; sfx.bjMaos(Math.max(0.4, bjNear(e))); }
};

/* ---------- o Homem da Turfa ---------- */
AI.bjturfeiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const cx = e.x + e.w / 2, gy = e.y + e.h;
  if (e.state === 'buried') {   // debaixo da turfa: não se vê nem se acerta
    e.bjHidden = true; e.vx = 0;
    if (!pl.dead && aggro && dist < 5 * T && Math.abs(dy) < 3 * T) { e.state = 'rise'; e.stateT = BJ1_LEVANTA; sfx.bjLevanta(Math.max(0.5, bjNear(e))); e.facing = Math.sign(dx) || e.facing; }
    return;
  }
  if (e.state === 'rise') {
    e.bjHidden = false; e.vx = 0;
    if (Math.random() < dt * 30) bjLama(cx + rnd(-6, 6), gy, 1, 30, -70, BJ_TURFAC);
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.8; }
    return;
  }
  e.bjHidden = false;
  if (e.state === 'drag') {   // a pá raspa o chão: faíscas e o som
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 22) { const [x, y] = bjPt(e, BJ1.TU_BX + 13, BJ1.TU_FY - 1, BJ1.TU_BX, BJ1.TU_FY); bjSparks(x, y, 1, ['#ffd27a', '#ffb050'], 40, 200, 0.3); }
    if (e.stateT <= 0) { e.state = 'sweep'; e.stateT = 0.3; e.hitThis = false; e.vx = e.facing * 40; sfx.bjVarre(Math.max(0.5, bjNear(e))); }
    return;
  }
  if (e.state === 'sweep') {   // a varrida: rente ao chão, pula-se por cima
    const hb = { x: e.facing > 0 ? cx - 2 : cx - 28, y: gy - 9, w: 30, h: 9 };
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, cx, e, false); if (r === 'hit') { pl.vx += e.facing * 80; pl.vy = Math.min(pl.vy, -80); } }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 16 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 24 : 10, 300, 230, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && Math.abs(dx) < 34 && Math.abs(dy) < 20 && clearPath(e, pl)) { e.state = 'drag'; e.stateT = BJ1_RASPA; e.facing = Math.sign(dx) || e.facing; sfx.bjRaspa(Math.max(0.5, bjNear(e))); }
};

/* ---------- os Corvos do Patíbulo ---------- */
AI.bjcorvo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, B = bj1Bando[e.bando] || (bj1Bando[e.bando] = { busy: null, t: 0 });
  if (B.busy && !bjLive(B.busy)) B.busy = null;
  if (e.state === 'caw') {
    e.vx *= Math.pow(0.05, dt); e.vy *= Math.pow(0.05, dt);
    if (e.stateT <= 0) { const cx = e.x + e.w / 2, cy = e.y + e.h / 2, d = Math.hypot(pcx - cx, pcy - cy) || 1; e.dv = [(pcx - cx) / d * 210, (pcy - cy) / d * 210]; e.state = 'dive'; e.stateT = 0.9; e.hitThis = false; }
    return;
  }
  if (e.state === 'dive') {
    e.vx = e.dv[0]; e.vy = e.dv[1]; e.facing = Math.sign(e.vx) || e.facing;
    if (!e.hitThis && !pl.dead && overlap(e, pl)) { e.hitThis = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); e.stateT = 0; }
    if (e.stateT <= 0 || e.hitWall || e.onGround) { e.state = 'circle'; e.atkCD = 2.4 + Math.random() * 2; if (B.busy === e) B.busy = null; e.vy = -90; }
    return;
  }
  e.state = 'circle';
  let tx, ty;
  if (!aggro) { cvWander(e, dt); tx = (e.homeX || e.x) + (e.wander || 0) * 50; ty = (e.homeY || e.y) + Math.sin(e.t + e.seed) * 12; }
  else { const a = e.t * 1.4 + e.seed * 6.28; tx = pcx + Math.cos(a) * 54; ty = pcy - 44 + Math.sin(a * 1.3) * 12; }
  const ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h / 2), sp = aggro ? 110 : 50;
  e.vx = approach(e.vx, clamp(ax * 3, -sp, sp), 400 * dt); e.vy = approach(e.vy, clamp(ay * 3, -sp, sp), 400 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  if (aggro && !B.busy && e.atkCD <= 0 && !pl.dead && dist < 9 * T && e.sees) { B.busy = e; e.state = 'caw'; e.stateT = BJ1_GRASNA; e.facing = Math.sign(dx) || e.facing; sfx.bjGrasna(Math.max(0.4, bjNear(e, 260))); }
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.bjHidden) return;   // o Homem da Turfa debaixo da turfa: o golpe não chega
  if (e && e.type === 'bjsangue' && (e.state === 'lurk' || e.state === 'ripple' || e.state === 'bubble') && !melee) return;   // a flecha não acha o que está debaixo da água
  const r = _hit(e, dir, mult, melee);
  if (!e || !BJ1_TYPES.includes(e.type)) return r;
  if (e.type === 'bjsangue' && e.state === 'latch') { e.hitsOn = (e.hitsOn || 0) + 1; if (e.hitsOn >= 2 && !e.dead) { e.state = 'drop'; e.latch = false; bjSoltar(e); e.atkCD = 3; e.vy = -80; e.vx = -dir * -60; } }
  if (e.type === 'bjturfeiro') e.stun = Math.min(e.stun, e.state === 'drag' ? 0 : 0.12);
  if (e.type === 'bjsapo' && (e.state === 'leap' || e.state === 'croak')) e.stun = 0;
  if (e.type === 'bjenforcado' && (e.state === 'hang' || e.state === 'creak')) { e.state = 'drop'; e.ropeY = undefined; e.grabbed = true; }   // cortado da corda: cai sem agarrar
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!BJ1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, bjNear(e, 260));
  if (e.type === 'bjsangue') bjSoltar(e);
  if (e.type === 'bjcorvo') { sfx.bjGrasna(v * 0.6); bjSparks(cx, cy, 6, ['#18181e', '#24242c', '#32323e'], 50, 80, 0.9, false); }
  else if (e.type === 'bjsapo') { bjLama(cx, e.y + e.h, 12, 50); sfx.bjCai(v * 0.7); }
  else sfx.bjCaiMorto(v);
  return r;
}; }
{ const _sp = spawnEnemy; let flock = false; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !BJ1_TYPES.includes(type)) return e;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'bjsapo') e.state = 'sit';
  else if (type === 'bjsangue') e.state = 'lurk';
  else if (type === 'bjturfeiro') { e.state = Math.random() < 0.75 ? 'buried' : 'walk'; e.bjHidden = e.state === 'buried'; }
  else if (type === 'bjenforcado') bjPendura(e);
  else if (type === 'bjcorvo') {
    e.state = 'circle'; e.bando = e.bando || ('b' + Math.floor(Math.random() * 1e9));
    if (!flock && !bjChefeSpawn) { flock = true; try { const n = 3 + (Math.random() < 0.5 ? 1 : 0); for (let i = 0; i < n; i++) { const o = spawnEnemy('bjcorvo', px + rnd(-20, 20), py + rnd(-12, 12), zone); if (o && !o.dead) { o.bando = e.bando; o.seed = Math.random(); } } } finally { flock = false; } }
  } else e.state = 'walk';
  return e;
}; }
// o enforcado nasce pendurado: procura o teto acima (até 8 blocos) com vão de pelo menos 3 debaixo dele
function bjPendura(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), fy = Math.floor((e.y + e.h - 1) / T);
  for (let k = 3; k < 10; k++) {
    const ty = fy - k; if (ty < 2) break;
    if (solidAt(tx, ty)) { if (k < 4) break; e.ropeY = (ty + 1) * T; e.hangY = Math.min(e.y, e.ropeY + T * 1.5); e.y = e.hangY; e.state = 'hang'; return; }
  }
  e.state = 'walk';
}

/* ---------- a cada quadro: as ondas de lama do sapo ---------- */
function bj1Update(dt) {
  for (let i = bj1Ondas.length - 1; i >= 0; i--) {
    const O = bj1Ondas[i]; O.t += dt; O.r = Math.min(BJ1_ONDA, O.t * 150);
    // a onda acerta quem está no chão (com os pés perto da altura dela) na frente da crista
    if (!O.hit && !pl.dead) { const pcx = pl.x + pl.w / 2, d = Math.abs(pcx - O.x), feet = pl.y + pl.h; if (d < O.r + 4 && d > O.r - 10 && Math.abs(feet - O.y) < 6 && pl.onGround) { O.hit = true; const r = hurtPlayer(O.dmg, O.x, null, true); if (r === 'hit') { pl.vy = -150; pl.vx += Math.sign(pcx - O.x) * 90; } } }
    if (Math.random() < dt * 30) for (const s of [-1, 1]) bjLama(O.x + s * O.r, O.y, 1, 20, -60);
    if (O.t > BJ1_ONDA / 150 + 0.2) bj1Ondas.splice(i, 1);
  }
  for (const k in bj1Bando) if (!bj1Bando[k].busy && Math.random() < dt * 0.05) delete bj1Bando[k];
}
HOOK.update.push(bj1Update);
// quem não se pendura fica parado no ar: um pouco de gravidade enquanto atordoado (o 13 não chama a IA)
HOOK.update.push(dt => { for (const e of enemies) if (e.type === 'bjsangue' && !e.dead && e.stun > 0 && !aguaAt(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h / 2) / T))) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); });
function clearBj1Fx() { bjFx.length = 0; bj1Ondas.length = 0; for (const k in bj1Bando) delete bj1Bando[k]; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearBj1Fx(); bj1Tables(); return _nw(sd, sv); }; }

// no mundo: a sombra do sapo caindo, a onda de lama, o V da sanguessuga na água e as bolhas
HOOK.drawWorld.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'bjsapo' && e.state === 'leap' && e.landY !== undefined) {
      const x = Math.round(e.landX - cx), y = Math.round(e.landY - cy), q = clamp(1 - Math.abs((e.y + e.h) - e.landY) / 120, 0.2, 1), w = Math.round(6 + q * 8);
      lc.globalAlpha = 0.45 * q; lc.fillStyle = '#000'; lc.fillRect(x - w, y - 1, w * 2, 2); lc.fillRect(x - w + 2, y - 2, w * 2 - 4, 1); lc.globalAlpha = 1;
    } else if (e.type === 'bjsangue' && (e.state === 'ripple' || e.state === 'lurk' || e.state === 'bubble')) {
      const ex = e.x + e.w / 2, s = bjSurf(ex, e.y + e.h / 2); if (s === null) continue;
      const depth = e.y - s; if (e.state === 'lurk' && depth > 2 * T) continue;
      const x = Math.round(ex - cx), y = Math.round(s - cy), L = e.state === 'ripple' ? 7 : 3, fd = e.facing;
      lc.fillStyle = '#7a6a4a'; lc.globalAlpha = e.state === 'lurk' ? 0.35 : 0.75;
      for (let k = 0; k < L; k++) { lc.fillRect(x - fd * k - (k & 1), y + (k > 3 ? 1 : 0), 1, 1); if (k) lc.fillRect(x - fd * k, y + 1 + (k >> 1) * 0 , 1, 1); }
      if (e.state === 'ripple') { lc.fillStyle = '#9a8a66'; lc.fillRect(x - 1, y, 3, 1); }
      lc.globalAlpha = 1;
    }
  }
  for (const O of bj1Ondas) {   // a crista de lama correndo
    const y = Math.round(O.y - cy), a = 1 - O.t / (BJ1_ONDA / 150 + 0.2);
    lc.globalAlpha = Math.max(0, a); for (const s of [-1, 1]) { const x = Math.round(O.x + s * O.r - cx); lc.fillStyle = '#4e3c26'; lc.fillRect(x - 2, y - 3, 4, 3); lc.fillStyle = '#6a5438'; lc.fillRect(x - 1, y - 4, 2, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  bjCoaxa(v = 1) { for (let k = 0; k < 3; k++) { tone(70 + k * 6, 0.22, 'sawtooth', 0.05 * v, -20, k * 0.26); noise(0.18, 0.03 * v, 240, 'lowpass', k * 0.26, 2); } },
  bjSalta(v = 1) { noise(0.2, 0.08 * v, 500, 'lowpass'); tone(110, 0.2, 'sine', 0.04 * v, 80); },
  bjCai(v = 1) { tone(48, 0.5, 'sine', 0.14 * v, -18); noise(0.4, 0.12 * v, 320, 'lowpass'); noise(0.25, 0.05 * v, 1400, 'bandpass', 0.05, 1.2); },
  bjBolhas(v = 1) { for (let k = 0; k < 6; k++) tone(260 + Math.random() * 300, 0.05, 'sine', 0.02 * v, 200, k * 0.09); },
  bjBote(v = 1) { noise(0.15, 0.08 * v, 900, 'lowpass'); tone(300, 0.1, 'sine', 0.02 * v, -150); },
  bjGruda(v = 1) { noise(0.12, 0.08 * v, 600, 'bandpass', 0, 2); tone(160, 0.15, 'sawtooth', 0.02 * v, -60); },
  bjSuga(v = 1) { noise(0.2, 0.04 * v, 400, 'bandpass', 0, 3); tone(90, 0.2, 'sine', 0.03 * v, -20); },
  bjRange(v = 1) { tone(180, 0.6, 'sawtooth', 0.012 * v, -40); noise(0.6, 0.02 * v, 900, 'bandpass', 0, 6); tone(240, 0.3, 'triangle', 0.008 * v, -60, 0.3); },
  bjCorda(v = 1) { noise(0.1, 0.06 * v, 2200, 'bandpass', 0, 2); tone(420, 0.06, 'square', 0.01 * v, -300); },
  bjEngasga(v = 1) { tone(130, 0.25, 'sawtooth', 0.02 * v, -50); noise(0.2, 0.03 * v, 700, 'bandpass', 0, 4); },
  bjMaos(v = 1) { noise(0.3, 0.03 * v, 500, 'bandpass', 0, 2); tone(100, 0.4, 'sine', 0.02 * v, 30); },
  bjGeme(v = 1) { tone(110 + Math.random() * 30, 0.9, 'sawtooth', 0.008 * v, -30); },
  bjLevanta(v = 1) { noise(1, 0.07 * v, 260, 'lowpass', 0, 0.5); tone(60, 1, 'sine', 0.04 * v, 20); tone(90, 0.6, 'sawtooth', 0.01 * v, -20, 0.4); },
  bjRaspa(v = 1) { for (let k = 0; k < 5; k++) noise(0.12, 0.05 * v, 2400 + k * 200, 'bandpass', k * 0.15, 5); },
  bjVarre(v = 1) { noise(0.25, 0.1 * v, 900, 'bandpass', 0, 1); tone(150, 0.2, 'triangle', 0.03 * v, -80); },
  bjGrasna(v = 1) { tone(620, 0.16, 'sawtooth', 0.03 * v, -260); tone(560, 0.14, 'sawtooth', 0.025 * v, -220, 0.2); noise(0.3, 0.02 * v, 1800, 'bandpass', 0, 3); },
  bjCaiMorto(v = 1) { noise(0.35, 0.09 * v, 380, 'lowpass'); tone(70, 0.35, 'sine', 0.06 * v, -20); }
});
Object.assign(BJB, { bjFx, bjP, bjSparks, bjLama, bjNear, bjLive, bjFloor, bjSurf, bjBlit, bjJit, bjPt, bjGl, bjHits, BJ_LAMAC, BJ_AGUAC, BJ_TURFAC });
