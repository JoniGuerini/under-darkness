'use strict';

/* ================= the goblins of the mine =================
   The goblins moved into the mine after the miners died. The dynamiter (76-cavernas-novos) left the caves for
   down here. With him: the goblin thief, small and quick, who comes in a gang, runs in, cuts your purse and runs
   off with your gold (kill him and you get it back, with whatever else he stole); and the goblin foreman, big and
   fat, with a whip that reaches far, who cracks it over his gang's heads and drives them faster for a while.
   Same brush as 55. Loads after 82 and before 49 (BAL). */

Object.assign(ET, {
  gatuno: { name: 'Goblin Gatuno', w: 8, h: 13, hp: 30, dmg: 9, xp: 16, kb: 1, fly: false, blood: '#5a7a3a' },
  capataz: { name: 'Capataz Goblin', w: 11, h: 19, hp: 120, dmg: 17, xp: 44, kb: 0.4, fly: false, blood: '#5a7a3a' }
});
Object.assign(DROPS, {
  gatuno: [['pepita', 0.3], ['polvora', 0.25], ['pocao', 0.08], ['adaga_ferro', 0.03], ['anel_vida', 0.012], ['capuz', 0.03]],
  capataz: [['polvora', 0.5, 1, 3], ['engrenagem', 0.3], ['pepita', 0.3, 1, 2], ['pocao', 0.15], ['maca_ferro', 0.035], ['elmo_ferro', 0.03], ['anel_furia', 0.015]]
});
for (const k of ['gatuno', 'capataz']) DROPS[k] = DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { gatuno: 1, capataz: 1 });
Object.assign(CV_STEP, { gatuno: 1, capataz: 1 });
const MN_GOBLINS = { goblin: 1, gatuno: 1, capataz: 1 };

/* ================= art ================= */
const MNG = {};
{
const { RB, cp, set } = CVB;
const R7 = hexes => hexes.map(h => ph(h));
const RG = {
  pele: R7(['#141a10', '#22301a', '#344628', '#4a5e38', '#62784a', '#7c925e', '#9cae78']),
  capa: R7(['#0a0c0e', '#121618', '#1c2226', '#283036', '#363f46', '#465058', '#58646c']),
  couro: R7(['#140c06', '#22160c', '#342214', '#4a321e', '#62442a', '#7c5838', '#98704a']),
  colete: R7(['#1a0c0a', '#2e1612', '#46221a', '#5e2e22', '#783c2c', '#924e38', '#ac6448']),
  calca: R7(['#0e0c0a', '#1a1614', '#2a2420', '#3c342e', '#504640', '#665a52', '#7e7066']),
  bota: R7(['#080604', '#120e0a', '#1e1810', '#2c2418', '#3c3222', '#4e422e', '#62543c']),
  metal: R7(['#14161a', '#22262c', '#343a42', '#4a525c', '#646e78', '#828c96', '#a8b2bc']),
  ouro: R7(['#3a2404', '#6a4a0c', '#a87808', '#d8a420', '#f0c43a', '#fce07a', '#fff6c8']),
  saco: R7(['#1c1610', '#30261a', '#463826', '#5e4c34', '#786244', '#927a56', '#ae946c']),
  boca: R7(['#100404', '#200808', '#341010', '#4a1818', '#622222', '#7a2e2e', '#963c3c']),
  olho: R7(['#3a2a04', '#6a5008', '#a88010', '#e0b020', '#ffd840', '#fff080', '#ffffd0'])
};
/* the thief, 15 x 17 facing right: 0 idle, 1-2 run, 3 grab (lunge, knife out), 4 running off with the sack over his shoulder */
function thief(pose) {
  const P = cp(15, 17), s = 9611 + pose, w = pose === 1 || pose === 4 ? 1 : pose === 2 ? -1 : 0, lean = pose >= 3 ? 1 : 0;
  if (pose === 4) { P.blob(3.6, 5.4, 3.2, 3.4, RG.saco, s + 9, 3.6, (x, y) => (x + y) % 4 === 0 ? -0.8 : 0); P.put(2.4, 4, RG.ouro, 6); P.put(4.4, 3.4, RG.ouro, 5); P.line(3, 2, 4.6, 2.6, RG.couro, 3); }   // the sack of gold
  P.line(6 + lean, 11, 5 - w * 1.4, 15.6, RG.calca, 2.6); P.line(7.6 + lean, 11, 8.6 + w * 1.4, 15.6, RG.calca, 3.6);
  P.put(5 - w * 1.4, 16, RG.bota, 3); P.put(8.6 + w * 1.4, 16, RG.bota, 3.6); P.put(9.6 + w * 1.4, 16, RG.bota, 4.2);
  // the hooded cloak, ragged at the hem
  P.blob(6.6 + lean, 8.4, 3, 3.6, RG.capa, s, 3.4, (x, y, dx, dy) => (dy > 0.6 && hash2(x, 0, s) < 0.4 ? -9 : 0) + ((x + y) % 5 === 0 ? -0.6 : 0));
  P.line(3.4 + lean, 9, 2 + lean - w, 12, RG.capa, 2.6);   // cloak tail flying behind
  const hx = 8.4 + lean, hy = 4.6;
  P.line(hx - 2, hy, hx - 5.4, hy - 2.4, RG.pele, 4); P.put(hx - 5.8, hy - 2.8, RG.pele, 3.4);   // the ear poking out of the hood
  P.blob(hx, hy, 3, 2.6, RG.pele, s + 1, 4);
  P.blob(hx - 0.8, hy - 1.4, 3.2, 2.2, RG.capa, s + 2, 3.6, (x, y, dx, dy) => dy > 0.2 && dx > 0.1 ? -9 : 0);   // the hood over the brow
  P.line(hx + 2.6, hy + 0.2, hx + 4.4, hy + 1.2, RG.pele, 4.6);   // a long sharp nose
  P.put(hx + 1.4, hy - 0.4, RG.olho, 5.6); P.put(hx + 0.6, hy - 0.4, RG.olho, 4);   // eyes glinting under it
  P.line(hx + 0.4, hy + 1.8, hx + 2, hy + 2, RG.boca, 1); P.put(hx + 1.6, hy + 1.6, RB.osso, 5.4);   // a sly grin
  if (pose === 3) { P.line(hx - 1, 8, hx + 4.4, 7.4, RG.pele, 4); P.line(hx + 4.6, 7.4, hx + 6.4, 6.4, RG.metal, 5.4); }   // the knife hand out
  else if (pose === 4) P.line(hx - 2, 7.6, 4.4, 4, RG.pele, 3.6);   // holding the sack
  else { P.line(hx - 1, 8, hx + 0.6 + w * 0.6, 11, RG.pele, 3.6); P.line(hx + 0.6 + w * 0.6, 11, hx + 2.4 + w * 0.6, 10.4, RG.metal, 5); }
  return set(P.done());
}
/* the foreman, 20 x 24 facing right: 0 idle, 1-2 walk, 3 whip drawn back, 4 whip cracked forward, 5 whip over his head (driving the gang) */
function foreman(pose) {
  const P = cp(20, 24), s = 9711 + pose, w = pose === 1 ? 1 : pose === 2 ? -1 : 0;
  if (pose === 3) P.line(7, 11, 2.4, 6, RG.pele, 3.4);   // arm back with the whip handle
  P.line(7, 17, 7 - w, 22.6, RG.calca, 2.6); P.line(11, 17, 11 + w, 22.6, RG.calca, 3.6);   // short bandy legs
  P.blob(7 - w, 23, 1.8, 1, RG.bota, s + 4, 2.8); P.blob(11.4 + w, 23, 1.8, 1, RG.bota, s + 5, 3.4);
  P.blob(9.4, 13.6, 5.4, 4.8, RG.pele, s, 3.8);   // the big belly
  P.blob(8.6, 12.6, 5.4, 4.6, RG.colete, s + 1, 3.4, (x, y, dx, dy) => dx > 0.3 ? -9 : (x + y) % 6 === 0 ? -0.6 : 0);   // a leather waistcoat that doesn't close
  for (let x = 4; x <= 14; x++) P.put(x, 16.6, RG.couro, 2.2); P.put(12, 16.6, RG.ouro, 5); P.put(13, 17.4, RG.metal, 5); P.put(13.6, 18.2, RG.metal, 4);   // belt, buckle, keys
  const hx = 11.4, hy = 6.4;
  P.line(hx - 2.6, hy + 0.4, hx - 6.4, hy - 1.4, RG.pele, 4); P.put(hx - 6.8, hy - 1.8, RG.pele, 3.4);   // ear
  P.blob(hx, hy, 3.8, 3.4, RG.pele, s + 2, 4.2);
  P.blob(hx + 0.6, hy + 2.4, 3.6, 1.6, RG.pele, s + 3, 3.4);   // jowls
  P.line(hx + 3.4, hy - 0.2, hx + 5.6, hy + 0.8, RG.pele, 5); P.put(hx + 5.6, hy + 1.4, RG.pele, 3.6);   // nose
  P.put(hx + 2, hy - 1, RB.osso, 6); P.put(hx + 2.6, hy - 1, RB.olho, 5.4); P.line(hx + 0.8, hy - 2, hx + 3, hy - 1.6, RG.pele, 1.4);   // a mean eye under a heavy brow
  if (pose === 5) { P.blob(hx + 2, hy + 2.4, 1.6, 1.2, RG.boca, s + 6, 1.4); P.put(hx + 1.4, hy + 1.6, RB.osso, 5.6); P.put(hx + 2.6, hy + 1.6, RB.osso, 5.2); }   // shouting
  else { P.line(hx + 0.6, hy + 2.4, hx + 3, hy + 2.6, RG.boca, 0.8); P.put(hx + 1, hy + 2, RB.osso, 5.6); }   // a tusk over the lip
  P.blob(hx - 0.4, hy - 3, 4.2, 1.8, RG.metal, s + 7, 3.6, (x, y, dx, dy) => dy > 0.3 ? -1.4 : 0);   // a dented iron pot for a helmet
  for (let x = hx - 4.6; x <= hx + 3.6; x++) P.put(x, hy - 1.6, RG.metal, 2.4);
  if (pose === 3) { }
  else if (pose === 4) P.line(12.6, 11, 17.6, 10.4, RG.pele, 4);
  else if (pose === 5) P.line(12, 10.4, 14.4, 3, RG.pele, 4);
  else { P.line(13, 11, 14 + w * 0.4, 15, RG.pele, 3.8); P.line(14 + w * 0.4, 15, 15.4, 18, RG.couro, 3.4); for (let k = 0; k < 4; k++) P.put(15.6 + (k % 2), 18.6 + k, RG.couro, 2.6); }   // the coiled whip at his side
  return set(P.done());
}
MNG.get = () => MNG.ready || (MNG.ready = { thief: [0, 1, 2, 3, 4].map(thief), boss: [0, 1, 2, 3, 4, 5].map(foreman) });
}

/* ================= drawing ================= */
DRAW_E.gatuno = (e, fx, fy, fl) => {
  const B = MNG.get().thief, k = e.state === 'grab' ? 3 : e.loot > 0 && e.state === 'flee' ? 4 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.t * 12) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 8, fy - 17);
};
DRAW_E.capataz = (e, fx, fy, fl) => {
  const B = MNG.get().boss, k = e.state === 'wind' ? 3 : e.state === 'crack' ? 4 : e.state === 'order' ? 5 : Math.abs(e.vx) > 5 && e.onGround ? 1 + (Math.floor(e.t * 6) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 10, fy - 24);
};
EYES_E.gatuno = (e, fx, fy) => { lc.globalAlpha = 0.45; lc.drawImage(SPR.glow.eye, fx + e.facing * 3 - 6, fy - 19); };
EYES_E.capataz = (e, fx, fy) => { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx + e.facing * 4 - 6, fy - 25); };
WARN_E.gatuno = () => false;
WARN_E.capataz = e => e.state === 'wind' || e.state === 'order';

/* ================= behaviour ================= */
const mngWand = (e, dt) => { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } };
// the thief: rushes in, cuts the purse and legs it with the gold; empty purse, a quick stab and back off
AI.gatuno = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'grab') {
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 4, y: e.y, w: e.w + 8, h: e.h }, pl)) {
      e.swingHit = true;
      const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit' && pl.gold > 0) {
        const n = Math.min(pl.gold, Math.max(3, Math.round(pl.gold * 0.12) + e.lvl * 2));
        pl.gold -= n; e.loot = (e.loot || 0) + n;
        floatText(pl.x + pl.w / 2, pl.y - 10, '-' + n + ' ouro', '#f0c43a', 0.9); sfx.coin && sfx.coin(); sfx.mngSnicker();
        e.state = 'flee'; e.stateT = 7; return;
      }
    }
    if (e.stateT <= 0) { e.state = 'flee'; e.stateT = 0.8 + Math.random() * 0.5; }
    return;
  }
  if (e.state === 'flee') {
    const d = -Math.sign(dx) || e.facing; e.facing = d;
    walk(e, dt, d, (e.loot ? 92 : 70) + e.lvl * 2, 1200, 280, dy, false);
    if (e.loot && Math.random() < dt * 6) burst(ecx, e.y + 4, 1, '#f0c43a', 30, 300, 0.4, 1, true);   // coins dribbling out of the sack
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = e.loot ? 0.5 : 0.6 + Math.random() * 0.5; }
    return;
  }
  if (!aggro) mngWand(e, dt);
  let dir = aggro ? (Math.abs(dx) < 8 ? 0 : Math.sign(dx)) : e.wander;
  if (e.loot && aggro) dir = -Math.sign(dx) || 1;   // already got something: keep away
  if (dir) e.facing = dir;
  walk(e, dt, dir, 66 + e.lvl * 2, 1000, 280, dy, aggro);
  if (aggro && !e.loot && e.atkCD <= 0 && Math.abs(dx) < 26 && Math.abs(dy) < 14) { e.state = 'grab'; e.stateT = 0.3; e.swingHit = false; e.facing = Math.sign(dx) || e.facing; e.vx = e.facing * 170; e.vy = -60; sfx.pswing && sfx.pswing(); }
};
// the foreman: keeps you at the end of his whip; now and then cracks it over his head and the goblins near him speed up
AI.capataz = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.orderCD = (e.orderCD === undefined ? 2 + Math.random() * 3 : e.orderCD) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { e.state = 'crack'; e.stateT = 0.35; e.whipT = 0.35; const hb = { x: e.facing > 0 ? ecx : ecx - 58, y: e.y + 2, w: 58, h: 12 }; if (!pl.dead && overlap(hb, pl)) { const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') pl.vx = -e.facing * 120 + pl.vx * 0.2; } sfx.mngCrack(); } return; }
  if (e.state === 'crack') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.3 + Math.random() * 0.6; } return; }
  if (e.state === 'order') {
    e.vx = 0;
    if (e.stateT <= 0.3 && !e.ordered) {
      e.ordered = true; sfx.mngCrack(); sfx.mngShout(); shake(1.5);
      for (const o of enemies) if (!o.dead && MN_GOBLINS[o.type] && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 230) { o.haste = 6; floatText(o.x + o.w / 2, o.y - 6, '!', '#ff6a4a', 1.1); }
    }
    if (e.stateT <= 0) { e.state = 'walk'; e.ordered = false; }
    return;
  }
  if (!aggro) mngWand(e, dt);
  const adx = Math.abs(dx);
  let dir = aggro ? (adx > 60 ? Math.sign(dx) : adx < 30 ? -Math.sign(dx) : 0) : e.wander;
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, 30 + e.lvl, 500, 240, dy, aggro && dir === Math.sign(dx));
  if (!aggro || !e.onGround) return;
  if (e.orderCD <= 0) {
    e.orderCD = 9 + Math.random() * 3;
    if (enemies.some(o => !o.dead && MN_GOBLINS[o.type] && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 230)) { e.state = 'order'; e.stateT = 0.8; return; }
  }
  if (e.atkCD <= 0 && adx < 60 && Math.abs(dy) < 18) { e.state = 'wind'; e.stateT = 0.45; e.facing = Math.sign(dx) || e.facing; }
};
// the driven goblins: faster and quicker to strike, a red glint over them while it lasts
{ const _w = walk; walk = function (e, dt, dir, sp, acc, jv, dy, chase) { return _w(e, dt, dir, e.haste > 0 ? sp * 1.5 : sp, acc, jv, dy, chase); }; }
function mngUpdate(dt) {
  for (const e of enemies) if (e.haste > 0 && !e.dead) { e.haste -= dt; e.atkCD -= dt * 0.6; if (Math.random() < dt * 10) parts.push({ x: e.x + e.w / 2 + rnd(-3, 3), y: e.y + rnd(0, 4), vx: rnd(-8, 8), vy: rnd(-30, -10), g: 0, life: 0.4, max: 0.4, col: '#ff6a4a', size: 1, glow: true }); }
  for (const e of enemies) if (e.whipT > 0) e.whipT -= dt;
}
HOOK.update.push(mngUpdate);
// the whip: a lash that snaps out to its full length and curls back
HOOK.drawTop.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || e.type !== 'capataz' || !(e.whipT > 0) && e.state !== 'order') continue;
    const hx = Math.round(e.x + e.w / 2 + e.facing * 7) - cx, hy = Math.round(e.y + 10) - cy;
    lc.fillStyle = '#4a321e';
    if (e.state === 'order') { const a = e.t * 18; for (let k = 0; k < 18; k++) { const r = k * 1.2, ang = a + k * 0.35; lc.fillRect(Math.round(hx + Math.cos(ang) * r * 0.9), Math.round(hy - 10 + Math.sin(ang) * r * 0.4 - k * 0.4), 1, 1); } continue; }
    const p = 1 - e.whipT / 0.35, L = 52 * Math.min(1, p * 2.4);
    for (let k = 0; k <= L; k += 1) { const t = k / 52; lc.fillRect(Math.round(hx + e.facing * k), Math.round(hy + Math.sin(t * Math.PI * 2 + p * 6) * 3 * (1 - t) * (1 - p)), 1, 1); }
    if (p < 0.5) { lc.fillStyle = '#fff4c8'; lc.fillRect(Math.round(hx + e.facing * L), hy - 1, 1, 1); }
  }
});
// thieves come in gangs; whatever a thief stole falls out when he dies
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'gatuno' && !spawnEnemy.gang) {
    spawnEnemy.gang = true;
    try { const n = 1 + (Math.random() < 0.5 ? 1 : 0); for (let k = 1; k <= n; k++) { const x = px - Math.sign(pl.x - px || 1) * k * 14; if (!rectSolid(x, py, e.w, e.h)) { const o = spawnEnemy('gatuno', x, py, zone); if (o) { o.lvl = e.lvl; o.mnMinion = e.mnMinion; } } } } finally { spawnEnemy.gang = false; }
  }
  return e;
}; }
{ const _k = killEnemy; killEnemy = function (e) { const r = _k(e); if (e.type === 'gatuno' && e.loot > 0) { dropLoot(e.x + e.w / 2, e.y + e.h / 2, 'ouro', e.loot); e.loot = 0; } return r; }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  mngCrack() { noise(0.05, 0.12, 4000, 'highpass'); tone(2400, 0.04, 'square', 0.03, -1800); },
  mngShout() { tone(220, 0.25, 'sawtooth', 0.04, 80); tone(180, 0.3, 'square', 0.025, 60, 0.12); },
  mngSnicker() { for (let k = 0; k < 3; k++) tone(900 + k * 60, 0.05, 'square', 0.02, -200, k * 0.08); }
});
