'use strict';

/* ================= o Mar Sem Sol: o que o mar faz com o herói =================
   Carrega depois do 172-nadar (embrulha o updatePlayer dele por fora) e da cozinha do Odo (98).
   - puxado (msPuxar, do escamado): a mão escamada no tornozelo leva o herói para o fundo a 70 px/s e para o lado de
     quem puxa; ele não nada para cima. Em terra, é arrastado para a água. Solta quando o tempo acaba ou quem puxa morre.
   - bolha (msBolha, do xamã): o herói fica preso numa bolha que sobe devagar; não anda e perde fôlego até em terra
     (zerado, a mesma perda de vida do afogamento).
   - tinta (msTinta, do polvo): uma nuvem preta onde a luz cai a zero por uns segundos (um véu escuro por cima da luz).
   - água fervente (AGUA_FERVE, nas poças das Chaminés): 3% da vida a cada 0,5 s com o corpo dentro.
   - bicho de água (`swim`) fora da água: perde 10% da vida por segundo (a IA de cada um o faz se debater de volta).
   - o oricalco: elmo, peitoral e botas de oricalco não contam no peso de nado e cada peça dá +2 s de fôlego.
   - a Pérola do Leviatã (266): os embrulhos de fôlego e nado dela são postos aqui, depois do 172 (msPerolaWraps).
   - o prato do Odo: Peixe-Cego na Brasa (1 peixe-cego, 1 de lenha). */

// a wiki carrega este arquivo só pelo prato do Odo: o resto precisa do jogo (172, 10, o herói)
if (typeof tickFolego === 'function' && typeof updatePlayer === 'function') {
/* ---------- o oricalco: não pesa, e guarda ar ---------- */
const msOricalcoPecas = () => { let n = 0; for (const k of ['head', 'body', 'feet']) { const s = equip[k], it = s && ITEMS[s.id]; if (it && it.oricalco) n++; } return n; };
{ const _pe = pesoHeroi; pesoHeroi = function () {
  let w = _pe();
  for (const k of ['head', 'body', 'feet']) { const s = equip[k], it = s && ITEMS[s.id]; if (it && it.oricalco && it.spd < 0) w += it.spd; }
  return Math.max(0, w);
}; }
// +2 s por peça: o fôlego gasta mais devagar (10 s viram 12, 14, 16)
{ const _tf = tickFolego; tickFolego = function (dt) {
  const f0 = pl.folego; _tf(dt);
  const n = msOricalcoPecas(); if (n && pl.folego < f0) pl.folego = f0 - (f0 - pl.folego) * FOLEGO_MAX / (FOLEGO_MAX + 2 * n);
}; }
if (typeof msPerolaWraps === 'function') msPerolaWraps();

/* ---------- os estados ---------- */
let msBolhaDano = 0.5, msFerveT = 0.5;
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (pl.dead) { pl.msPuxaT = pl.msBolhaT = 0; pl.msPuxaE = null; return _up(dt); }
  const x0 = pl.x, y0 = pl.y, f0 = pl.folego, bolha = pl.msBolhaT > 0, puxa = pl.msPuxaT > 0;
  const r = _up(dt);
  if (pl.dead) return r;
  if (bolha) {   // flutua 25 px/s para cima, parado no lugar
    pl.msBolhaT -= dt;
    const ny = y0 - 25 * dt;
    pl.x = x0; pl.vx = 0;
    if (!rectSolid(pl.x, ny, pl.w, pl.h)) { pl.y = ny; pl.vy = 0; } else { pl.y = y0; pl.vy = 0; }
    pl.folego = Math.max(0, Math.min(f0, pl.folego) - dt);
    if (pl.folego <= 0 && (msBolhaDano -= dt) <= 0) { msBolhaDano = 0.5; afogar(Math.max(1, Math.round(pl.maxHp * 0.08))); }
    if (pl.msBolhaT <= 0) { pl.msBolhaT = 0; burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 10, '#bfe8f0', 60, -40); if (sfx.splash) sfx.splash(0.5); }
  } else if (puxa) {   // para o fundo e para o lado de quem puxa
    pl.msPuxaT -= dt;
    const E = pl.msPuxaE, alive = E && !E.dead && E.hp > 0;
    if (E && !alive) pl.msPuxaT = 0;
    const tx = alive ? E.x + E.w / 2 : pl.x + pl.w / 2, dir = Math.sign(tx - (pl.x + pl.w / 2)), wet = pl.naAgua > 0.2;
    const nx = pl.x + dir * (wet ? 40 : 90) * dt; if (Math.abs(tx - (pl.x + pl.w / 2)) > 4 && !rectSolid(nx, pl.y, pl.w, pl.h)) pl.x = nx;
    if (wet) { const ny = Math.max(pl.y, y0) + 70 * dt; if (!rectSolid(pl.x, ny, pl.w, pl.h)) { pl.y = ny; pl.vy = 70; } else pl.vy = 0; }
    if (pl.msPuxaT <= 0) { pl.msPuxaT = 0; pl.msPuxaE = null; }
  }
  // a água fervente
  if (agua.length && !godMode()) {
    let ferve = false;
    const a0 = Math.floor(pl.x / T), a1 = Math.floor((pl.x + pl.w - 0.01) / T), b0 = Math.floor(pl.y / T), b1 = Math.floor((pl.y + pl.h - 0.01) / T);
    for (let ty = b0; ty <= b1 && !ferve; ty++) for (let tx = a0; tx <= a1; tx++) if (aguaAt(tx, ty) === AGUA_FERVE) { ferve = true; break; }
    if (ferve) { if ((msFerveT -= dt) <= 0) { msFerveT = 0.5; afogar(Math.max(1, Math.round(pl.maxHp * 0.03))); for (let k = 0; k < 3; k++) parts.push({ x: pl.x + rnd(0, pl.w), y: pl.y + rnd(0, pl.h), vx: rnd(-8, 8), vy: rnd(-50, -30), g: -20, life: 0.8, max: 0.8, col: '#e8e0d0', size: 1 }); } }
    else msFerveT = Math.min(msFerveT, 0.25);
  }
  return r;
}; }
// golpear quem puxa solta o tornozelo
{ const _ke = killEnemy; killEnemy = function (e) { if (pl.msPuxaE === e) { pl.msPuxaT = 0; pl.msPuxaE = null; } return _ke(e); }; }

/* ---------- bichos de água fora da água ---------- */
HOOK.update.push(dt => {
  if (!agua.length || !MAR) return;
  for (const e of enemies) {
    if (e.dead || e.boss) continue; const D = ET[e.type]; if (!D || !D.swim) continue;
    if (aguaIn(e.x, e.y, e.w, e.h) > 0) { e.msSecoT = 0.5; continue; }
    e.msSecoT = (e.msSecoT === undefined ? 0.5 : e.msSecoT) - dt;
    if (e.msSecoT <= 0) { e.msSecoT = 0.5; e.hp -= Math.max(1, Math.ceil(e.maxHp * 0.05)); e.flash = 0.08; e.showHp = 1.5; if (e.hp <= 0) killEnemy(e); }
  }
  // as nuvens de tinta
  for (let i = msTintas.length - 1; i >= 0; i--) { const q = msTintas[i]; q.t += dt; if (q.t >= q.sec) msTintas.splice(i, 1); }
});

/* ---------- o desenho: a bolha em volta do herói, a mão no tornozelo, o véu da tinta ---------- */
let msVeu = null;
const msVeuCv = () => {
  if (msVeu) return msVeu;
  const R = 64, cv = mk(R * 2, R * 2), x = cv.getContext('2d'), g = x.createRadialGradient(R, R, 0, R, R, R);
  g.addColorStop(0, 'rgba(2,2,6,1)'); g.addColorStop(0.55, 'rgba(2,2,6,0.95)'); g.addColorStop(1, 'rgba(2,2,6,0)');
  x.fillStyle = g; x.fillRect(0, 0, R * 2, R * 2); return (msVeu = cv);
};
HOOK.drawTop.push((cx, cy) => {
  if (!MAR) return;
  // a tinta: o véu escuro (a luz cai a zero) e os rolos de tinta mexendo por cima
  for (const q of msTintas) {
    const k = Math.min(1, q.t * 4) * Math.min(1, (q.sec - q.t) * 1.5), r = q.r * (0.7 + Math.min(1, q.t) * 0.5), X = Math.round(q.x - cx), Y = Math.round(q.y - cy);
    if (X < -r * 2 || X > VW + r * 2 || Y < -r * 2 || Y > VH + r * 2) continue;
    lc.globalAlpha = k; lc.drawImage(msVeuCv(), X - r * 1.2, Y - r * 1.2, r * 2.4, r * 2.4);
    for (let j = 0; j < 7; j++) { const h = hash2(j, q.x | 0, 7), a = h * 6.28 + q.t * (0.4 + h * 0.3), d = r * (0.2 + h * 0.6), s = 6 + ((h * 9) | 0); lc.globalAlpha = 0.55 * k; lc.fillStyle = j % 2 ? '#0c0a14' : '#18142a'; lc.fillRect(Math.round(X + Math.cos(a) * d - s / 2), Math.round(Y + Math.sin(a) * d * 0.7 - s / 2), s, s); }
  }
  lc.globalAlpha = 1;
  if (pl.dead) return;
  const X = Math.round(pl.x - cx), Y = Math.round(pl.y - cy);
  if (pl.msBolhaT > 0) {   // a bolha: um aro claro, o reflexo em cima à esquerda, uns pontinhos
    const r = 13 + Math.sin(gameTime * 6) * 0.6, ox = X + pl.w / 2, oy = Y + pl.h / 2;
    lc.fillStyle = '#9fdcef';
    for (let a = 0; a < 64; a++) { const t = a / 64 * 6.283, px = Math.round(ox + Math.cos(t) * r), py = Math.round(oy + Math.sin(t) * r * 1.1); lc.globalAlpha = 0.45 + 0.35 * Math.max(0, -Math.cos(t + 0.8)); lc.fillRect(px, py, 1, 1); }
    lc.globalAlpha = 0.85; lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(ox - r * 0.55), Math.round(oy - r * 0.6), 3, 1); lc.fillRect(Math.round(ox - r * 0.62), Math.round(oy - r * 0.45), 1, 2);
    lc.globalAlpha = 0.12; lc.fillStyle = '#6ae8d8'; lc.fillRect(Math.round(ox - r * 0.7), Math.round(oy - r * 0.75), Math.round(r * 1.4), Math.round(r * 1.5));
  }
  if (pl.msPuxaT > 0) {   // a mão escamada no tornozelo: dedos verdes com garra
    const fx = X + (pl.facing > 0 ? 2 : pl.w - 6), fy = Y + pl.h - 4, sh = Math.round(Math.sin(gameTime * 18));
    lc.globalAlpha = 1;
    lc.fillStyle = '#0e2c2a'; lc.fillRect(fx - 1, fy + 3, 6, 4);
    lc.fillStyle = '#225c56'; lc.fillRect(fx, fy + sh, 4, 4); lc.fillStyle = '#347a70'; lc.fillRect(fx, fy + sh, 4, 1); lc.fillRect(fx, fy + sh, 1, 3);
    lc.fillStyle = '#d8d0b8'; lc.fillRect(fx - 1, fy + sh, 1, 1); lc.fillRect(fx + 4, fy + sh + 1, 1, 1);
  }
  lc.globalAlpha = 1;
});
}

/* ---------- o prato do Odo ---------- */
{ const G = COZINHA.find(g => g.k === 'brasa');
  if (G && ITEMS.peixe_assado && !CK_REC.peixe_assado) { const r = { id: 'peixe_assado', t: 3, need: [['peixe_cego', 1]], fuel: 1, g: 'brasa' }; G.items.push(r); CK_REC.peixe_assado = r; } }
