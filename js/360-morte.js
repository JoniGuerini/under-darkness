'use strict';

/* ================= os bichos se desfazem ao morrer (2026-10-14) =================
   Pedido do Jonathan (2026-10-14): um bicho morto só sumia e o loot aparecia. Agora, nos 10 bichos das Cavernas, o
   próprio desenho do bicho se desfaz em pedacinhos das cores dele, como se fosse triturado: os pedaços voam do golpe,
   caem, quicam no chão e somem. Cada um com o seu toque: o rato espirra sangue e lasquinhas de osso, a gosma pinga e
   gruda, o morcego se desfaz devagar no ar, o fungo solta uma última nuvem de esporos que sobe, as aranhas espirram
   gosma e perdem as patas, o besouro racha em placas de casca que quicam, a centopeia se parte gomo por gomo, a
   cuspideira estoura em ácido aceso e o goblin solta faíscas da lanterna. O loot cai no mesmo lugar de antes.
   - O desenho vem do próprio drawEnemy, pintado uma vez num canto do canvas do mundo (que é redesenhado inteiro no
     quadro seguinte) e lido com getImageData; fica em cache por bicho, lado e cor, então cada tipo lê só uma vez.
   - Os pedaços são uma lista própria (MORTE, no máximo MORTE_MAX), com chão: param nos blocos sólidos.
   Carrega logo antes do 355 (que fica por último). */
const MORTE = [], MORTE_MAX = 900, MORTE_CACHE = new Map();
const MORTE_TIPOS = {
  //          pedaço  força  gravidade  quica  ar     extra
  rato:       { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 12, osso: 4 },
  slime:      { px: 2, sp: 0.45, g: 460, bq: 0,   ar: 0, gota: 1 },
  bat:        { px: 2, sp: 0.4, g: 150, bq: 0.2, ar: 2.2, sangue: 6, flutua: 1 },
  fungo:      { px: 2, sp: 0.5, g: 520, bq: 0.25, ar: 0, esporos: 26 },
  aranha:     { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 10, patas: 6 },
  filhote:    { px: 1, sp: 0.5, g: 560, bq: 0.3, ar: 0, sangue: 5, patas: 4 },
  besouro:    { px: 3, sp: 0.55, g: 620, bq: 0.45, ar: 0, sangue: 6, placa: 1 },
  centopeia:  { px: 2, sp: 0.45, g: 560, bq: 0.3, ar: 0, sangue: 8, gomos: 1 },
  cuspideira: { px: 2, sp: 0.6, g: 540, bq: 0.25, ar: 0, acido: 14, patas: 4 },
  goblin:     { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 8, faiscas: 14 }
};
// o desenho do bicho como ele está agora, em pixels (cor, x, y), com o centro de baixo em (0, 0)
function morteFoto(e) {
  const key = e.type + (e.facing > 0 ? 'r' : 'l') + (e.variant | 0);
  let f = MORTE_CACHE.get(key); if (f) return f;
  const W = 48, H = 44, fl = e.flash; f = [];
  lc.save();
  try {
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, W, H);
    e.flash = 0; drawEnemy(e, Math.round(e.x + e.w / 2) - 24, Math.round(e.y + e.h) - 36);
    const d = lc.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (d[k + 3] > 140) f.push(`rgb(${d[k]},${d[k + 1]},${d[k + 2]})`, x - 24, y - 36); }
  } catch (err) { f = []; }
  finally { e.flash = fl; lc.restore(); }
  MORTE_CACHE.set(key, f); return f;
}
function morteBit(x, y, vx, vy, col, o) {
  if (MORTE.length >= MORTE_MAX) return;
  MORTE.push(Object.assign({ x, y, vx, vy, col, w: 1, h: 1, g: 520, bq: 0.3, ar: 0, life: 0.9 + Math.random() * 0.7, d: 0, glow: false }, o));
}
function morteDesfaz(e, hitDir) {
  const M = MORTE_TIPOS[e.type]; if (!M) return false;
  const bx = e.x + e.w / 2, by = e.y + e.h, cx = bx, cy = e.y + e.h / 2, D = ET[e.type], blood = D.blood || '#6a8a3a';
  const f = morteFoto(e); if (!f.length) return false;
  const pk = M.px, dir = hitDir || (pl.x + pl.w / 2 < cx ? 1 : -1);
  // agrupa os pixels em pedaços pk x pk: cada pedaço fica com a cor do seu pixel de cima à esquerda
  const seen = new Set();
  for (let i = 0; i < f.length; i += 3) {
    const px = f[i + 1], py = f[i + 2], gx = Math.floor(px / pk), gy = Math.floor(py / pk), k = gx * 1000 + gy; if (seen.has(k)) continue; seen.add(k);
    const x = bx + gx * pk, y = by + gy * pk, ax = x - cx, ay = y - cy, r = Math.hypot(ax, ay) || 1;
    const s = (40 + Math.random() * 80) * M.sp;
    let vx = ax / r * s + dir * (20 + Math.random() * 50) * M.sp, vy = ay / r * s - (90 + Math.random() * 110) * M.sp;
    let delay = 0;
    if (M.gomos) delay = Math.abs(ax) / (e.w + 1) * 0.25;                           // a centopeia se parte gomo por gomo
    if (M.flutua) { vx *= 0.6; vy *= 0.5; }                                         // o morcego se desfaz no ar
    morteBit(x, y, vx, vy, f[i], { w: pk, h: pk, g: M.g, bq: M.bq, ar: M.ar, d: delay, life: (M.flutua ? 1.0 : 1.6) + Math.random() * 1.2, gruda: !!M.gota });
  }
  const sp = (n, col, o) => { for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4; const s = 40 + Math.random() * 90; morteBit(cx + (Math.random() - 0.5) * e.w * 0.6, cy + (Math.random() - 0.5) * e.h * 0.5, Math.cos(a) * s + dir * 40, Math.sin(a) * s, col, o); } };
  if (M.sangue) sp(M.sangue, blood, { g: 560, bq: 0, gruda: true, life: 1.4 + Math.random() });
  if (M.osso) sp(M.osso, '#e6dcc4', { g: 560, bq: 0.4 });
  if (M.gota) sp(10, f[0], { w: 2, h: 2, g: 380, bq: 0, gruda: true, life: 1.8 });
  if (M.esporos) for (let k = 0; k < M.esporos; k++) morteBit(cx + (Math.random() - 0.5) * 10, cy + (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 50, -20 - Math.random() * 40, Math.random() < 0.5 ? '#b8e060' : '#e0f498', { g: -14, bq: 0, ar: 1.6, life: 1.2 + Math.random() * 1.2, glow: true, solto: true });
  if (M.patas) sp(M.patas, '#1a1410', { w: 1, h: 3, g: 540, bq: 0.35 });
  if (M.acido) sp(M.acido, '#c8f060', { g: 520, bq: 0, gruda: true, glow: true, life: 1.2 + Math.random() * 0.6 });
  if (M.faiscas) for (let k = 0; k < M.faiscas; k++) { const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 110; morteBit(cx + e.facing * 3, e.y + 4, Math.cos(a) * s, Math.sin(a) * s - 40, Math.random() < 0.5 ? '#ffd060' : '#ff8a2a', { g: 300, bq: 0.2, glow: true, life: 0.4 + Math.random() * 0.5 }); }
  burst(cx, cy, 3, '#ffffff', 50, 0, 0.15, 1, true);   // o clarão do golpe, curtinho
  return true;
}
// o killEnemy embrulhado: nos bichos da lista os pedaços tomam o lugar da poça de sangue de antes
{ const _ke = killEnemy; killEnemy = function (e) {
  if (!e || e.dead || e.boss || !MORTE_TIPOS[e.type] || e.despawn) return _ke.apply(this, arguments);
  let ok = false; try { ok = morteDesfaz(e, e.lastHitDir); } catch (err) { console.error(err); }
  if (!ok) return _ke.apply(this, arguments);
  const _b = burst; burst = function () { };
  try { return _ke.apply(this, arguments); } finally { burst = _b; }
}; }
{ const _h = hitEnemy; hitEnemy = function (e, dir) { if (e && dir) e.lastHitDir = dir; return _h.apply(this, arguments); }; }
HOOK.update.push(dt => {
  if (!MORTE.length) return;
  let n = 0;
  for (let i = 0; i < MORTE.length; i++) {
    const p = MORTE[i];
    if (p.d > 0) { p.d -= dt; MORTE[n++] = p; continue; }
    p.life -= dt; if (p.life <= 0) continue;
    if (!p.parado) {
      if (p.ar) { const k = Math.pow(0.5, dt * p.ar); p.vx *= k; if (p.vy > 0 || p.solto) p.vy *= k; }
      p.vy += p.g * dt;
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (!p.solto && solidAt(Math.floor(nx / T), Math.floor(p.y / T))) p.vx = -p.vx * 0.3; else p.x = nx;
      if (!p.solto && p.vy > 0 && solidAt(Math.floor(p.x / T), Math.floor((ny + p.h) / T))) {
        p.y = Math.floor((ny + p.h) / T) * T - p.h;
        if (p.gruda || Math.abs(p.vy) < 60) { p.parado = true; p.vx = p.vy = 0; } else { p.vy = -p.vy * p.bq; p.vx *= 0.6; }
      } else p.y = ny;
    }
    MORTE[n++] = p;
  }
  MORTE.length = n;
});
HOOK.drawWorld.push((cx, cy) => {
  for (const p of MORTE) {
    if (p.d > 0 || p.glow) continue;
    lc.globalAlpha = Math.min(1, p.life * 1.6); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.w, p.h);
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of MORTE) {
    if (p.d > 0 || !p.glow) continue;
    lc.globalAlpha = Math.min(1, p.life * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.w, p.h);
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  let k = 0;
  for (const p of MORTE) { if (p.d > 0 || !p.glow || (k++ & 1)) continue; lc.globalAlpha = Math.min(1, p.life * 2) * 0.4; lc.drawImage(SPR.glow.spark, Math.round(p.x) - cx - 6, Math.round(p.y) - cy - 6); }
  lc.globalAlpha = 1;
});
{ const _nw = newWorld; newWorld = function (sd, sv) { MORTE.length = 0; return _nw(sd, sv); }; }
