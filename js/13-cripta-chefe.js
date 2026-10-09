'use strict';

/* ================= the crypt: boss fight ================= */
let bossFight = null, cryptWhisper = false;
function setGates(on) { for (const [x, y] of crypt.boss.doors) { const i = y * WW + x; if (on ? tiles[i] === AIR : tiles[i] === GATE) { tiles[i] = on ? GATE : AIR; markDirty(x, y); } } mapVer++; }
function updateCrypt() {
  if (!crypt || pl.dead) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T), B = crypt.boss;
  if (!crypt.bossDead && !bossFight && ptx >= B.x0 + 2 && ptx <= B.x1 - 2 && pty >= B.y0 && pty <= B.y1) startBossFight();
  if (!cryptWhisper && !inCrypt(ptx, pty) && ptx > crypt.x0 - 28 && ptx < crypt.x1 + 28 && pty > crypt.y0 - 22 && pty < crypt.y1 + 22) { cryptWhisper = true; toast('Um frio estranho vem de algum lugar aqui perto…'); }
}
function startBossFight() {
  const B = crypt.boss;
  setGates(true);
  const side = pl.x + pl.w / 2 < (B.altar + 0.5) * T ? 1 : -1;
  const e = spawnEnemy('boss', (B.altar + 0.5) * T - 8 + side * 18, B.fy * T - 40, 4);
  Object.assign(e, { boss: true, lvl: 10, hp: ET.boss.hp, maxHp: ET.boss.hp, dmg: ET.boss.dmg, xp: 450, state: 'intro', stateT: 1.4, cd: 0.6, chargeCD: 3, castCD: 2, summons: 0, facing: -side, arm: 2.6, sAng: 0.9, windT: 0.68 });
  bossFight = { e };
  burst(e.x + 8, e.y + 20, 40, '#1a0a12', 120, -60, 1.2); burst(e.x + 8, e.y + 20, 16, '#ff5a2a', 90, 0, 0.6, 1, true);
  sfx.gate(); sfx.roar(); shake(5); showBanner('O Carrasco', 'guardião da cripta');
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
}
function endBossFight(won) {
  if (!bossFight) return;
  const e = bossFight.e; bossFight = null;
  setGates(false);
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  if (!won) { for (let k = enemies.length - 1; k >= 0; k--) { const m = enemies[k]; if (m === e || (m.type === 'imp' && inBossHall(Math.floor(m.x / T), Math.floor(m.y / T)))) enemies.splice(k, 1); } return; }
  crypt.bossDead = true;
  const B = crypt.boss, cx = B.altar + 2;
  if (tileAt(cx, B.y1) === AIR) setTile(cx, B.y1, CHEST);
  showBanner('Vitória', 'o Carrasco caiu');
  toast('A força sombria se dissipou: agora dá para minerar os tijolos da cripta. Um baú apareceu ao lado do altar.', 'gold');
  saveGame();
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
    else moveEntity(e, dt, e.type === 'zombie' || e.type === 'skeleton' || e.type === 'brute' || e.type === 'hound' || e.type === 'boss' || e.type === 'archer' || e.type === 'guard');
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
