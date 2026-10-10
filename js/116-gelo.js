'use strict';

/* ================= os quatro feitiços novos de gelo (dados em js/114-escolas-dados.js) =================
   Lança de Gelo, Nova Congelante, Estacas de Gelo e Orbe Glacial. O que é comum (aprender, dica, ferir, frio,
   herói novo) está em js/115-escolas.js. Cada pedaço de gelo só fere o que toca. Carrega depois do 115. */

const glLances = [], glNovas = [], glSpikes = [], glRows = [], glOrbs = [], glShards = [];

sfx.glCast = function (k) {
  if (k === 'nova_gelo') { noise(0.5, 0.16, 3000, 'highpass', 0, 0.6); tone(1500, 0.35, 'triangle', 0.04, -900); return; }
  noise(0.14, 0.09, 3200, 'bandpass', 0, 1); tone(1900 + Math.random() * 300, 0.12, 'triangle', 0.03, -800);
};
sfx.glSpike = function () { noise(0.07, 0.08, 2600, 'bandpass', 0, 1.2); tone(2600 + Math.random() * 900, 0.04, 'triangle', 0.014, -600); };

{
  const _newWorld = newWorld;
  newWorld = function (sd, sv) { _newWorld(sd, sv); for (const a of [glLances, glNovas, glSpikes, glRows, glOrbs, glShards]) a.length = 0; };
}

/* ---- lançar ---- */
ESC_CAST.lanca_gelo = S => {
  const [hx, hy] = handXY(), [mx, my] = mouseWorld(); if (Math.abs(mx - (pl.x + pl.w / 2)) > 2) pl.facing = mx > pl.x + pl.w / 2 ? 1 : -1;
  const a = Math.atan2(my - hy, mx - hx);
  glLances.push({ x: hx, y: hy, vx: Math.cos(a) * S.spd, vy: Math.sin(a) * S.spd, a, t: 0, life: S.len / S.spd });
};
ESC_CAST.nova_gelo = S => {
  glNovas.push({ x: pl.x + pl.w / 2, y: pl.y + pl.h / 2, t: 0, hit: new Set(), S, elem: 'gelo' });
  shake(1.5);
};
ESC_CAST.estacas = S => {
  const [mx] = mouseWorld(); if (Math.abs(mx - (pl.x + pl.w / 2)) > 2) pl.facing = mx > pl.x + pl.w / 2 ? 1 : -1;
  const fy = fgFloor(pl.x + pl.w / 2, pl.y + pl.h - 4);
  if (fy == null) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem chão', '#a8dcf4', 0.8); sfx.bad(); escCD.estacas = 0.3; return false; }
  glRows.push({ x: pl.x + pl.w / 2 + pl.facing * 9, fy, dir: pl.facing, left: S.n, t: 0 });
};
ESC_CAST.orbe = S => {
  const [hx, hy] = handXY(), [tx, ty] = fgAim(S.reach), a = Math.atan2(ty - hy, tx - hx), d = Math.hypot(tx - hx, ty - hy);
  glOrbs.push({ x: hx, y: hy, vx: Math.cos(a) * S.spd, vy: Math.sin(a) * S.spd, go: d / S.spd, t: 0, emit: 0, ang: Math.random() * 6 });
};

/* ---- quebrar gelo ---- */
function glBreak(x, y, n) {
  for (let k = 0; k < n; k++) parts.push({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-60, 60), vy: rnd(-70, 10), g: 320, life: rnd(0.25, 0.5), max: 0.5, col: ['#ffffff', '#d8f4ff', '#8fd0f0'][k % 3], size: 1 });
  burst(x, y, Math.ceil(n / 2), '#e8f8ff', 40, 0, 0.25, 1, true);
}
function glShard(x, y, a, S) { glShards.push({ x, y, vx: Math.cos(a) * S.sspd, vy: Math.sin(a) * S.sspd, t: 0, life: S.slife }); }

/* ---- a cada quadro ---- */
HOOK.update.push(dt => {
  // lanças de gelo: param no primeiro inimigo ou bloco
  for (let i = glLances.length - 1; i >= 0; i--) {
    const l = glLances[i]; l.t += dt; let end = l.t >= l.life;
    const n = Math.max(1, Math.ceil(Math.hypot(l.vx, l.vy) * dt / 3));
    for (let s = 0; s < n && !end; s++) {
      const nx = l.x + l.vx * dt / n, ny = l.y + l.vy * dt / n;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { end = true; break; }
      l.x = nx; l.y = ny;
      const e = enemies.find(q => escAlive(q) && escTouch(q, l.x, l.y, 1));
      if (e) { escHit(e, ESC.lanca_gelo, 'gelo', l.vx >= 0 ? 1 : -1, false); end = true; }
    }
    if (Math.random() < dt * 30) parts.push({ x: l.x, y: l.y, vx: rnd(-6, 6), vy: rnd(-6, 6), g: 0, life: 0.3, max: 0.3, col: '#e8f8ff', size: 1, glow: true });
    if (end) { glBreak(l.x, l.y, 10); sfx.nevShatter(); glLances.splice(i, 1); }
  }
  escNovaUpdate(glNovas, dt);
  for (const n of glNovas) if (n.t < n.S.grow) { const r = n.S.r * n.t / n.S.grow; for (let k = 0; k < 2; k++) { const a = Math.random() * Math.PI * 2; parts.push({ x: n.x + Math.cos(a) * r, y: n.y + Math.sin(a) * r, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, g: 30, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#ffffff' : '#bfe8ff', size: 1 }); } }
  // fileiras de estacas: um espinho de cada vez, seguindo o chão
  for (let i = glRows.length - 1; i >= 0; i--) {
    const r = glRows[i], S = ESC.estacas; r.t -= dt;
    while (r.t <= 0 && r.left > 0) {
      r.t += S.step;
      const f = fgFloor(r.x, r.fy - 6);
      if (f == null || Math.abs(f - r.fy) > 18 || solidAt(Math.floor(r.x / T), Math.floor((f - 4) / T))) { r.left = 0; break; }
      r.fy = f; glSpikes.push({ x: r.x, y: f, t: 0, hit: new Set(), h: S.h * rnd(0.8, 1.15), seed: Math.random() * 99 | 0 });
      sfx.glSpike(); r.x += r.dir * S.gap; r.left--;
    }
    if (r.left <= 0) glRows.splice(i, 1);
  }
  for (let i = glSpikes.length - 1; i >= 0; i--) {
    const s = glSpikes[i], S = ESC.estacas; s.t += dt;
    if (s.t >= S.life) { glBreak(s.x, s.y - s.h / 2, 8); glSpikes.splice(i, 1); continue; }
    const h = s.h * Math.min(1, s.t / 0.08);
    for (const e of enemies) if (!s.hit.has(e) && escAlive(e) && e.x < s.x + 3 && e.x + e.w > s.x - 3 && e.y + e.h > s.y - h && e.y < s.y) { s.hit.add(e); escHit(e, S, 'gelo', 0, true); }
  }
  // orbes: andam até a mira cuspindo lascas em volta e estouram no fim
  for (let i = glOrbs.length - 1; i >= 0; i--) {
    const o = glOrbs[i], S = ESC.orbe; o.t += dt; o.emit -= dt;
    if (o.t < o.go) { const nx = o.x + o.vx * dt, ny = o.y + o.vy * dt; if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) o.go = 0; else { o.x = nx; o.y = ny; } }
    while (o.emit <= 0) { o.emit += 1 / S.rate; o.ang += 2.4; glShard(o.x, o.y, o.ang, S); }
    if (o.t >= S.dur) { for (let k = 0; k < S.burst; k++) glShard(o.x, o.y, k / S.burst * Math.PI * 2, S); glBreak(o.x, o.y, 14); sfx.nevShatter(); glOrbs.splice(i, 1); }
  }
  for (let i = glShards.length - 1; i >= 0; i--) {
    const s = glShards[i]; s.t += dt; let end = s.t >= s.life;
    const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
    if (!end && solidAt(Math.floor(nx / T), Math.floor(ny / T))) end = true; else { s.x = nx; s.y = ny; }
    if (!end) { const e = enemies.find(q => escAlive(q) && escTouch(q, s.x, s.y, 1)); if (e) { escHit(e, ESC.orbe, 'gelo', 0, true); end = true; } }
    if (end) { glBreak(s.x, s.y, 3); glShards.splice(i, 1); }
  }
});

/* ---- desenho ---- */
let glG = null;
const GL_ICE = ['#ffffff', '#d8f4ff', '#a8dcf4', '#6ab0dc', '#3a7ab0', '#1e4a78'];
HOOK.drawGlow.push((cx, cy) => {
  if (!(glLances.length || glNovas.length || glSpikes.length || glOrbs.length || glShards.length)) return;
  if (!glG) glG = { s: glow(6, '#a8dcf4'), m: glow(14, '#8fd0f0') };
  lc.globalCompositeOperation = 'lighter';
  const at = (g, x, y, a) => { lc.globalAlpha = a; lc.drawImage(g, Math.round(x) - cx - g.width / 2, Math.round(y) - cy - g.height / 2); };
  for (const l of glLances) at(glG.s, l.x, l.y, 0.6);
  for (const o of glOrbs) at(glG.m, o.x, o.y, 0.55);
  for (const s of glShards) at(glG.s, s.x, s.y, 0.25);
  for (const s of glSpikes) at(glG.s, s.x, s.y - s.h / 2, 0.3);
  for (const n of glNovas) { const r = n.S.r * Math.min(1, n.t / n.S.grow), k = 1 - Math.max(0, n.t - n.S.grow) / 0.25; for (let a = 0; a < Math.PI * 2; a += 0.5) at(glG.s, n.x + Math.cos(a) * r, n.y + Math.sin(a) * r, 0.4 * k); }
  lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
});
HOOK.drawTop.push((cx, cy) => {
  const px = (x, y, c) => { lc.fillStyle = c; lc.fillRect(Math.round(x) - cx, Math.round(y) - cy, 1, 1); };
  // lança: uma estaca afiada na direção do voo, ponta branca, corpo azul, cauda escura
  for (const l of glLances) {
    const ca = Math.cos(l.a), sa = Math.sin(l.a);
    for (let d = -6; d <= 2; d++) {
      const w = d > 0 ? 0 : d > -4 ? 1 : 0, col = d >= 1 ? GL_ICE[0] : d >= -1 ? GL_ICE[1] : d >= -3 ? GL_ICE[2] : d >= -5 ? GL_ICE[3] : GL_ICE[4];
      px(l.x + ca * d, l.y + sa * d, col);
      if (w) { px(l.x + ca * d - sa, l.y + sa * d + ca, d > -2 ? GL_ICE[2] : GL_ICE[4]); px(l.x + ca * d + sa, l.y + sa * d - ca, GL_ICE[1]); }
    }
  }
  // espinhos: um cristal pontudo, claro de um lado e escuro do outro, com o pé quebrando o chão
  for (const s of glSpikes) {
    const S = ESC.estacas, grow = Math.min(1, s.t / 0.08), fade = s.t > S.life - 0.15, h = Math.round(s.h * grow), X = Math.round(s.x) - cx, Y = Math.round(s.y) - cy;
    if (fade && Math.floor(s.t * 30) % 2) continue;
    for (let j = 0; j < h; j++) {
      const q = j / Math.max(1, h), half = Math.round(3.4 * (1 - q) + 0.4);
      for (let i = -half; i <= half; i++) {
        const edge = Math.abs(i) === half, g = hash2(i, j, s.seed);
        lc.fillStyle = edge ? GL_ICE[i < 0 ? 3 : 5] : i < 0 ? GL_ICE[q > 0.7 ? 0 : g < 0.2 ? 0 : 1] : i === 0 ? GL_ICE[2] : GL_ICE[g < 0.15 ? 2 : 3];
        lc.fillRect(X + i, Y - 1 - j, 1, 1);
      }
    }
    if (h > 3) { lc.fillStyle = GL_ICE[0]; lc.fillRect(X, Y - h - 1, 1, 1); }
    for (let i = -4; i <= 4; i++) if (hash2(i, 9, s.seed) < 0.55) { lc.fillStyle = GL_ICE[hash2(i, 3, s.seed) < 0.5 ? 2 : 4]; lc.fillRect(X + i, Y - 1, 1, 1); }   // gelo esparramado no pé
  }
  // orbe: uma bola de gelo facetada que gira, com brilho branco
  for (const o of glOrbs) {
    const X = Math.round(o.x) - cx, Y = Math.round(o.y) - cy, rot = o.t * 4;
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
      const d = Math.hypot(i, j); if (d > 5.2) continue;
      const a = Math.atan2(j, i) + rot, facet = Math.floor(((a % (Math.PI * 2)) + Math.PI * 2) / (Math.PI / 3)) % 6;
      lc.fillStyle = d > 4.4 ? GL_ICE[5] : GL_ICE[[1, 2, 3, 2, 4, 3][facet] - (i + j < -3 ? 1 : 0)];
      lc.fillRect(X + i, Y + j, 1, 1);
    }
    lc.fillStyle = GL_ICE[0]; lc.fillRect(X - 2, Y - 3, 2, 1); lc.fillRect(X - 3, Y - 2, 1, 1);
  }
  // lascas: risquinhos de gelo
  for (const s of glShards) { const n = Math.hypot(s.vx, s.vy) || 1; px(s.x, s.y, GL_ICE[0]); px(s.x - s.vx / n * 1.5, s.y - s.vy / n * 1.5, GL_ICE[2]); px(s.x - s.vx / n * 3, s.y - s.vy / n * 3, GL_ICE[4]); }
  // nova: um anel de cristais
  for (const n of glNovas) {
    const r = n.S.r * Math.min(1, n.t / n.S.grow), k = 1 - Math.max(0, n.t - n.S.grow) / 0.25;
    if (k < 0.3 && Math.floor(n.t * 30) % 2) continue;
    const steps = Math.max(10, Math.round(r * 1.2));
    for (let s = 0; s < steps; s++) {
      const a = s / steps * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), x = n.x + ca * r, y = n.y + sa * r;
      px(x, y, GL_ICE[1]); px(x - ca, y - sa, GL_ICE[3]);
      if (s % 3 === 0) { px(x + ca, y + sa, GL_ICE[0]); px(x + ca * 2, y + sa * 2, GL_ICE[2]); }
    }
  }
});
