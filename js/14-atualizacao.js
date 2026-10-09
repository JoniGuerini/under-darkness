'use strict';

/* ================= projectiles, orbs, particles ================= */
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const o = projs[i]; o.life -= dt; o.t += dt; o.x += o.vx * dt; o.y += o.vy * dt;
    let dead = o.life <= 0;
    if (!dead && solidAt(Math.floor(o.x / T), Math.floor(o.y / T))) { dead = true; burst(o.x, o.y, o.kind === 'arrow' ? 4 : 8, o.kind === 'arrow' ? '#8a6a44' : o.kind === 'fire' ? '#ff8a3a' : o.owner === 'enemy' ? '#c070ff' : '#ffd060', 60, 0, 0.35, 1, true); }
    if (!dead && o.owner === 'enemy' && !pl.dead && o.x > pl.x - 3 && o.x < pl.x + pl.w + 3 && o.y > pl.y - 3 && o.y < pl.y + pl.h + 3) {
      const pcx = pl.x + pl.w / 2; const srcX = Math.abs(o.vx) > 10 ? pcx - Math.sign(o.vx) * 10 : o.x;
      const r = hurtPlayer(o.dmg, srcX, null, true);
      if (r === 'parry') { o.owner = 'player'; o.vx = -o.vx * 1.5; o.vy = -o.vy * 1.5; o.dmg = 2; o.life = 3; floatText(o.x, o.y - 10, 'REFLETIDO!', '#ffe28a', 0.9); }
      else if (r !== 'none' || pl.invuln > 0) { dead = true; burst(o.x, o.y, 10, o.kind === 'fire' ? '#ff8a3a' : '#c070ff', 70, 0, 0.35, 1, true); }
    }
    if (!dead && o.owner === 'player') for (const e of enemies) { if (!e.dead && o.x > e.x && o.x < e.x + e.w && o.y > e.y && o.y < e.y + e.h) { hitEnemy(e, Math.sign(o.vx) || 1, o.dmg); dead = true; burst(o.x, o.y, 12, '#ffd060', 80, 0, 0.4, 1, true); break; } }
    if (dead) projs.splice(i, 1);
  }
}
function updateOrbs(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i]; o.t += dt;
    if (o.t < 0.4 || pl.dead) { o.vy += 420 * dt; o.vx *= Math.pow(0.2, dt); o.x += o.vx * dt; o.y += o.vy * dt; if (solidAt(Math.floor(o.x / T), Math.floor(o.y / T))) { o.y -= o.vy * dt; o.vy *= -0.4; } }
    else {
      const dx = pcx - o.x, dy = pcy - o.y, d = Math.hypot(dx, dy) || 1, sp = 130 + (o.t - 0.4) * 420;
      o.vx = lerp(o.vx, dx / d * sp, Math.min(1, dt * 8)); o.vy = lerp(o.vy, dy / d * sp, Math.min(1, dt * 8));
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (d < 7) { gainXP(o.v); sfx.xp(); orbs.splice(i, 1); continue; }
    }
    if (o.t > 12) orbs.splice(i, 1);
  }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(p.smoke ? 0.7 : 0.3, dt); if (p.smoke) p.vx += Math.sin(gameTime * 2 + p.y * 0.1) * 6 * dt; }
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.life -= dt; t.y -= dt * 18; if (t.life <= 0) texts.splice(i, 1); }
}

/* ================= time of day ================= */
// a new game starts at 18:00; day is 06:00-18:00, night 18:00-06:00, with dawn and dusk light ramps around those hours
function hourNow() { return (18 + worldTime / DAY_LEN * 24) % 24; }
function dayFactor(h) { if (h < 5 || h >= 19) return 0; if (h < 7) return (h - 5) / 2; if (h < 17) return 1; return 1 - (h - 17) / 2; }
function isNight() { const h = hourNow(); return h >= 18 || h < 6; }

/* ================= update ================= */
// keep the hero inside one lap of the ring and everything else on the same lap as the hero
function normalizeWorld() {
  const WPX = WW * T;
  if (pl.x < 0 || pl.x >= WPX) { const sh = pl.x < 0 ? WPX : -WPX; pl.x += sh; cam.x += sh; pl.digX = -1; }
  const ref = pl.x;
  for (const a of [enemies, projs, orbs, loot, parts, texts]) for (const o of a) { const d = o.x - ref; if (d > WPX / 2) o.x -= WPX; else if (d < -WPX / 2) o.x += WPX; }
}
function update(dt) {
  normalizeWorld();
  gameTime += dt; worldTime += dt;
  skyLight = 0.4 + 0.6 * dayFactor(hourNow());
  updatePlayer(dt);
  updateEnemies(dt);
  updateCrypt();
  updateProjs(dt);
  updateOrbs(dt);
  updateLoot(dt);
  updateParts(dt);
  updateVillage(dt);
  runHooks(HOOK.update, dt);
  spawnTimer -= dt; if (spawnTimer <= 0) { spawnTimer = 1.1 + Math.random() * 1.6; trySpawn(); }
  // ambient: lava bubbles, torch embers and smoke, chest sparkle
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2], ex = emitters[i] * T, ey = emitters[i + 1] * T;
    if (t === LAVA) { if (Math.random() < dt * 0.25 && tileAt(emitters[i], emitters[i + 1] - 1) === AIR) burst(ex + T / 2, ey, 2, '#ffb444', 30, 200, 0.6, 1, true); }
    else if (t === CHEST) { if (Math.random() < dt * 0.7) parts.push({ x: ex + rnd(2, T - 2), y: ey + rnd(4, T - 2), vx: 0, vy: -8, g: 0, life: 0.6, max: 0.6, col: '#ffe9a0', size: 1, glow: true }); }
    else if (t === CANDLE) { if (Math.random() < dt * 0.9) parts.push({ x: ex + 6 + rnd(-4, 4), y: ey + 1, vx: rnd(-2, 2), vy: rnd(-12, -6), g: -2, life: rnd(0.8, 1.3), max: 1.3, col: '#141018', size: 1, smoke: true }); }
    else if (t === TORCH) {
      if (Math.random() < dt * 0.8) parts.push({ x: ex + 6, y: ey + 2, vx: rnd(-6, 6), vy: rnd(-26, -12), g: -10, life: 0.7, max: 0.7, col: '#ffb444', size: 1, glow: true });
      if (Math.random() < dt * 2.6) parts.push({ x: ex + rnd(5, 7), y: ey + 1, vx: rnd(-3, 3), vy: rnd(-16, -9), g: -2, life: rnd(1.1, 1.8), max: 1.8, col: Math.random() < 0.5 ? '#0c0a0e' : '#1c1820', size: Math.random() < 0.6 ? 2 : 3, smoke: true });
    }
  }
  zoneCheck -= dt;
  if (zoneCheck <= 0 && !pl.dead) { zoneCheck = 0.5; const ztx = Math.floor((pl.x + 4) / T), zty = Math.floor((pl.y + 10) / T), z = zoneAt(ztx, zty), iv = inVillage(ztx, zty) && z === 0; if (z !== lastZone || iv !== lastVil) { if (lastZone !== -1) { const [a, b] = placeName(ztx, zty); showBanner(a, b); } lastZone = z; lastVil = iv; } }
  saveTimer -= dt; if (saveTimer <= 0) { saveTimer = 12; saveGame(); }
  tutorial(dt);
  updateCamera(dt);
}
function idleUpdate(dt) {
  gameTime += dt;
  skyLight = 0.4 + 0.6 * dayFactor(hourNow());
  updateParts(dt); updateOrbs(dt);
  if (state === 'dead') updateLoot(dt);
  if (state === 'dead') { updateEnemies(dt); updateProjs(dt); }
  updateCamera(dt);
}
// camera locked on the hero: always dead centre, no look-ahead and no easing (hit shake still goes on top)
// whole pixels on both sides so the hero never jitters against the world
function updateCamera(dt) {
  cam.x = Math.round(pl.x + pl.w / 2) - Math.floor(VW / 2);
  cam.y = Math.round(pl.y + pl.h) - Math.round(pl.h / 2) - Math.floor(VH / 2);
  cam.y = clamp(cam.y, 0, WH * T - VH);
  shk.m = Math.max(0, shk.m - dt * 18); shk.x = (Math.random() - 0.5) * shk.m; shk.y = (Math.random() - 0.5) * shk.m;
}
const TUTORIAL = [
  [1.5, 'Você está no vilarejo, o único lugar seguro. Aperte E perto dos moradores para conversar'],
  [5, 'Clique com o botão esquerdo para golpear com a espada'],
  [9, 'Segure o botão direito para levantar o escudo'],
  [13, 'Escudo erguido no instante do golpe = APARAR (atordoa o inimigo)'],
  [17, 'Aperte 2 (ou gire a rodinha) para pegar a picareta e segure o clique esquerdo para minerar'],
  [21, 'Aperte 1 para voltar à espada · Q coloca uma tocha · E abre baús'],
  [24, 'Passando a placa à direita do vilarejo, uma caverna desce até as profundezas. Tem um baú lá embaixo.'],
  [32, 'Aperte I para abrir o inventário e ver seu equipamento'],
  [40, 'Aperte Tab para abrir o mapa de tudo que você já explorou']
];
function tutorial(dt) { if (tutorialStep >= TUTORIAL.length) return; tutorialT += dt; if (tutorialT >= TUTORIAL[tutorialStep][0]) { toast(TUTORIAL[tutorialStep][1]); tutorialStep++; } }
