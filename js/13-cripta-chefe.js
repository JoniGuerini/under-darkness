'use strict';

/* ================= boss fights and the enemies' update =================
   The crypt of O Carrasco that used to stand in the caves is gone (2026-10-09; the demons live in the abyss now,
   103-109). What stays here: bossFight, the fight in progress ({ e, ...flags }), and the base endBossFight, which
   every boss (46, 57, 74, 85, 109) wraps with its own; and updateEnemies, the per-frame update of every monster. */
let bossFight = null;
function endBossFight() {
  if (!bossFight) return;
  bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
}
function updateEnemies(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  for (const e of enemies) {
    if (e.dead) continue;
    const D = ET[e.type];
    e.t += dt; e.flash -= dt; e.showHp -= dt; e.atkCD -= dt; if (e.parried > 0) e.parried -= dt;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, dx = pcx - ecx, dy = pcy - ecy, dist = Math.hypot(dx, dy);
    // senses: sees you along a free line (checked a few times a second), keeps hunting a short while after
    // losing sight, and only notices you through solid rock when you are right against it
    e.seeT = (e.seeT || 0) - dt;
    if (e.seeT <= 0) { e.seeT = 0.2 + Math.random() * 0.1; e.sees = !pl.dead && dist < 200 && clearPath(e, pl); }
    if (NAV_WALKERS[e.type] && !pl.dead && dist < 240) {
      const cell = Math.floor((e.x + e.w / 2) / T) * 1000 + Math.floor((e.y + e.h + 1) / T);
      e.navT = (e.navT || 0) - dt;
      if (e.onGround && (e.navT <= 0 || cell !== e.navCell)) { e.navT = 0.35 + Math.random() * 0.15; e.navCell = cell; e.nav = navFind(e); }
    } else e.nav = null;
    const hears = e.nav && e.nav.steps <= 22;                            // a way through to you, not too long
    if (e.sees || hears) e.memT = 2.5; else e.memT = (e.memT || 0) - dt;
    const aggro = !pl.dead && (!!e.boss || dist < 40 || e.sees || hears || (e.memT > 0 && dist < 240));
    if (e.stun > 0) { e.stun -= dt; if (D.fly) { const k = Math.pow(0.05, dt); e.vx *= k; e.vy *= k; } else if (e.onGround) e.vx = approach(e.vx, 0, 500 * dt); }
    else AI[e.type](e, dt, dx, dy, dist, aggro);
    if (!D.fly) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
    if (D.phase) { e.x += e.vx * dt; e.y = clamp(e.y + e.vy * dt, 2 * T, (WH - 6) * T); e.onGround = e.hitWall = e.hitCeil = false; }
    else moveEntity(e, dt, e.type === 'zombie' || e.type === 'skeleton' || e.type === 'archer' || e.type === 'guard');
    // only creatures whose body itself hurts (ET touch) harm you on contact
    if (D.touch && !pl.dead && e.stun <= 0 && e.atkCD <= 0 && overlap(e, pl)) {
      const r = hurtPlayer(Math.round(e.dmg * D.touch), ecx, e, false);
      e.atkCD = 0.8; if (r === 'hit' && !D.fly) e.vx = -Math.sign(dx) * 60;
    }
    if (!D.phase && lavaIn(e.x, e.y, e.w, e.h)) { e.lavaT = (e.lavaT || 0) - dt; if (e.lavaT <= 0) { e.lavaT = 0.5; e.hp -= Math.ceil(e.maxHp * 0.2); e.flash = 0.1; e.showHp = 2; if (e.hp <= 0) killEnemy(e); } }
    if (!e.boss && (Math.abs(dx) > VW * 1.3 || Math.abs(dy) > VH * 1.6)) e.dead = true, e.despawn = true;
    // anything that climbs out under the open sky flees back into the dark
    if (!e.boss && !e.dead) { const etx = Math.floor((e.x + e.w / 2) / T), ety = Math.floor((e.y + e.h / 2) / T); if (ety <= surf[wrapX(etx)] && wallAt(etx, ety) === 0) { e.dead = true; e.despawn = true; burst(e.x + e.w / 2, e.y + e.h / 2, 16, '#2a2430', 60, -50, 0.9); } }
  }
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
}
