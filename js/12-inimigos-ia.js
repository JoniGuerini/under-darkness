'use strict';

/* ================= enemy AI ================= */
const AI = {
  slime(e, dt, dx, dy, dist, aggro) {
    // its attack is a pounce: only that leap hurts, never just bumping into it
    if (e.pounce && !e.swingHit && !pl.dead && !e.onGround && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    if (e.onGround && e.pounce) { e.pounce = false; e.atkCD = 0.9 + Math.random() * 0.5; }
    if (e.onGround) e.climb = 0;
    else if (e.climb && e.hitWall) e.vx = e.climb * 55;               // still below the lip: keep pushing until it clears
    if (e.onGround) {
      e.vx = approach(e.vx, 0, 600 * dt); e.hop -= dt;
      if (e.hop <= 0) {
        let dir = aggro ? (Math.sign(dx) || 1) : (Math.random() < 0.5 ? -1 : 1);
        if (ledgeAhead(e, dir, dy, aggro) === 'stop') dir = aggro ? 0 : -dir;
        if (dir) e.facing = dir; e.vy = -(160 + Math.random() * 100); e.vx = dir * (45 + Math.random() * 45) * (aggro ? 1.15 : 0.7);
        if (dir) { const air = -2 * e.vy / GRAV, run = floorRun(e, dir, 80), L = run < 4 ? ledgeAhead(e, dir, dy, aggro) : 0;
          if (typeof L === 'number' && L > 0) { e.vy = -270; e.vx = dir * L; } else if (Math.abs(e.vx) * air > run) e.vx = dir * run / air; }
        const up = dir && aggro && dy < 0 ? stepUp(e, dir, 2) : 0;
        if (up) { e.vy = -Math.sqrt(2 * GRAV * (up * T + 6)); e.vx = dir * 55; e.climb = dir; }   // a step between it and you: hop up onto it
        else if (dir && aggro && e.atkCD <= 0 && Math.abs(dx) < 70 && dy < 16 && dy > -40 && clearPath(e, pl)) {   // leap onto the hero
          const vy = -(170 + Math.min(60, -dy * 2.5)), air = -2 * vy / GRAV, vx = clamp(dx / air, -110, 110);
          if (Math.abs(vx) * air <= floorRun(e, dir, 80) + 6) { e.pounce = true; e.swingHit = false; e.vy = vy; e.vx = vx; }
        }
        e.hop = aggro ? 0.6 + Math.random() * 0.7 : 1.4 + Math.random() * 2; e.onGround = false;
      }
    }
  },
  zombie(e, dt, dx, dy, dist, aggro) {
    if (!aggro) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
    e.stateT -= dt;
    if (e.state === 'grab') {                                       // reaches out, then claws whatever is in front
      e.vx = approach(e.vx, 0, 500 * dt);
      if (e.stateT <= 0) {
        const ecx = e.x + e.w / 2, hb = { x: e.facing > 0 ? ecx : ecx - 20, y: e.y + 2, w: 20, h: e.h - 4 };
        if (!pl.dead && overlap(hb, pl) && clearPath(e, pl)) hurtPlayer(e.dmg, ecx, e, false);
        e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6;
      }
      return;
    }
    let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
    if (aggro && Math.abs(dx) < 10) dir = 0;
    if (dir) e.facing = dir; walk(e, dt, dir, 30 + e.lvl * 1.5, 300, 265, dy, aggro);
    if (aggro && Math.abs(dx) < 18 && Math.abs(dy) < 20 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'grab'; e.stateT = 0.55; e.facing = Math.sign(dx) || e.facing; sfx.growl(); }
  },
  bat(e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt;
    if (e.state === 'hover') {                                      // hangs still a moment, then dives to bite
      const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k; e.facing = dx > 0 ? 1 : -1;
      if (e.stateT <= 0) { const d = Math.hypot(dx, dy) || 1; e.vx = dx / d * 165; e.vy = dy / d * 165; e.state = 'dive'; e.stateT = 0.45; e.swingHit = false; }
      return;
    }
    if (e.state === 'dive') {
      if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); e.stateT = 0; }
      if (e.hitWall || e.hitCeil || e.onGround) e.stateT = 0;
      if (e.stateT <= 0) { e.state = 'walk'; e.retreat = 0.8; e.atkCD = 1.1 + Math.random() * 0.6; }
      return;
    }
    let tx, ty;
    if (e.retreat > 0) { e.retreat -= dt; tx = -Math.sign(dx) * 60; ty = -50; }
    else if (aggro && dist < 200) { tx = dx; ty = dy + Math.sin(e.t * 3) * 20; }
    else { tx = Math.cos(e.t * 0.7 + e.seed) * 50; ty = Math.sin(e.t * 1.3 + e.seed) * 30; }
    const d = Math.hypot(tx, ty) || 1, sp = aggro ? 78 : 35, k = Math.min(1, dt * 2.5);
    e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp + Math.sin(e.t * 9) * 25, k);
    e.facing = e.vx >= 0 ? 1 : -1;
    if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
    if (aggro && e.retreat <= 0 && e.atkCD <= 0 && dist < 60 && losClear(e.x + e.w / 2, e.y + e.h / 2, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'hover'; e.stateT = 0.3; }
  },
  skeleton(e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt;
    const ecx = e.x + e.w / 2;
    if (e.state === 'walk') {
      if (!aggro) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
      let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
      if (aggro && Math.abs(dx) < 14) dir = 0;
      if (dir) e.facing = dir; walk(e, dt, dir, 36 + e.lvl, 300, 270, dy, aggro);
      if (aggro && Math.abs(dx) < 27 && Math.abs(dy) < 22 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'wind'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.wind(); }
      e.sAng = lerp(e.sAng, 0.9, Math.min(1, dt * 10)); e.arm = lerp(e.arm, 2.7, Math.min(1, dt * 10));
    } else if (e.state === 'wind') {
      e.vx = approach(e.vx, 0, 600 * dt); const k = easeOut(clamp(1 - e.stateT / 0.5, 0, 1));
      e.sAng = lerp(0.9, -2.0, k); e.arm = lerp(2.7, -1.2, k);
      if (e.stateT <= 0) { e.state = 'swing'; e.stateT = 0.12; e.swingHit = false; sfx.swing(); }
    } else if (e.state === 'swing') {
      const k = clamp(1 - e.stateT / 0.12, 0, 1); e.sAng = lerp(-2.0, 2.5, easeOut(k)); e.arm = clamp(e.sAng * 0.6, -1.25, 1.7);
      if (!e.swingHit && k > 0.25) { e.swingHit = true; const hb = { x: e.facing > 0 ? ecx - 2 : ecx - 26, y: e.y - 8, w: 28, h: e.h + 10 }; if (overlap(hb, pl) && clearPath(e, pl)) hurtPlayer(e.dmg, ecx, e, false); }
      if (e.stateT <= 0 && e.state === 'swing') { e.state = 'recover'; e.stateT = 0.55; }
    } else if (e.state === 'recover') {
      e.vx = approach(e.vx, 0, 600 * dt);
      if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.7 + Math.random() * 0.6; }
    }
  },
  // ---- the undead ----
  archer(e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt;
    const ecx = e.x + e.w / 2, ey = e.y + 8;
    if (e.state === 'walk') {
      let dir = 0;
      if (!aggro) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } dir = e.wander; if (dir) e.facing = dir; }
      else { const adx = Math.abs(dx); dir = adx < 70 ? -Math.sign(dx) : adx > 150 ? Math.sign(dx) : 0; e.facing = Math.sign(dx) || e.facing; }
      walk(e, dt, dir, 30 + e.lvl, 300, 260, dy, aggro && dir === Math.sign(dx));
      e.aim = lerp(e.aim ?? 2.3, 2.3, Math.min(1, dt * 6));
      if (aggro && dist < 230 && e.atkCD <= 0 && e.onGround && losClear(ecx, ey, pl.x + pl.w / 2, pl.y + 9)) { e.state = 'aim'; e.stateT = 0.75; sfx.draw(); }
    } else if (e.state === 'aim') {
      e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
      e.aim = clamp(Math.atan2((pl.x + pl.w / 2 - ecx) * e.facing, -(pl.y + 9 - ey)), 0.5, 2.6);
      if (e.stateT <= 0) {
        const a = Math.atan2(pl.y + 9 - ey, pl.x + pl.w / 2 - ecx);
        projs.push({ x: ecx + e.facing * 6, y: ey, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, dmg: e.dmg, owner: 'enemy', life: 3, t: 0, kind: 'arrow' });
        sfx.bow(); e.state = 'recover'; e.stateT = 0.45;
      }
    } else if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random(); } }
  },
  guard(e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt; e.turnT = (e.turnT || 0) - dt;
    const ecx = e.x + e.w / 2;
    if (e.state === 'walk') {
      let dir;
      if (!aggro) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } dir = e.wander; if (dir) e.facing = dir; }
      else { if (e.turnT <= 0) { e.facing = Math.sign(dx) || e.facing; e.turnT = 0.35; } dir = Math.abs(dx) < (dy < -6 ? 8 : 26) ? 0 : Math.sign(dx); }   // turns a beat late; steps up when you stand higher
      walk(e, dt, dir, 24 + e.lvl, 260, 260, dy, aggro);
      e.reach = lerp(e.reach ?? 12, 12, Math.min(1, dt * 10));
      if (aggro && Math.abs(dx) < 40 && Math.abs(dy) < 22 && e.atkCD <= 0 && e.onGround && Math.sign(dx) === e.facing && clearPath(e, pl)) { e.state = 'wind'; e.stateT = 0.55; sfx.wind(); }
    } else if (e.state === 'wind') {
      e.vx = approach(e.vx, 0, 600 * dt); e.reach = lerp(12, 9, easeOut(clamp(1 - e.stateT / 0.55, 0, 1)));
      if (e.stateT <= 0) { e.state = 'thrust'; e.stateT = 0.16; e.swingHit = false; sfx.swing(); e.vx = ledgeAhead(e, e.facing, 0, false) === 'stop' ? 0 : e.facing * 70; }
    } else if (e.state === 'thrust') {
      const k = clamp(1 - e.stateT / 0.16, 0, 1); e.reach = lerp(9, 17, easeOut(k));
      if (!e.swingHit && k > 0.3) { e.swingHit = true; const hb = { x: e.facing > 0 ? ecx : ecx - 40, y: e.y + 4, w: 40, h: 12 }; if (overlap(hb, pl) && clearPath(e, pl)) hurtPlayer(e.dmg, ecx, e, false); }
      if (e.state === 'thrust' && e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.65; }
    } else if (e.state === 'recover') {
      e.vx = approach(e.vx, 0, 600 * dt); e.reach = lerp(e.reach ?? 12, 12, Math.min(1, dt * 6));
      if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.0 + Math.random() * 0.8; e.turnT = 0; }
    }
  },
  ghost(e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt;
    if (e.vis === undefined) { e.vis = 0.15; e.state = 'drift'; e.stateT = 1 + Math.random(); }
    let tx = dx, ty = dy - 6, sp = 28, vt = 0.18;
    if (e.state === 'drift') {
      if (!aggro) { tx = Math.cos(e.t * 0.4 + e.seed) * 50; ty = Math.sin(e.t * 0.6 + e.seed) * 30; }
      if (aggro && dist < 85 && e.stateT <= 0) { e.state = 'appear'; e.stateT = 0.45; sfx.wail(); }
    } else if (e.state === 'appear') { sp = 8; vt = 1; if (e.stateT <= 0) { e.state = 'lunge'; e.stateT = 0.6; e.swingHit = false; const d = Math.hypot(dx, dy) || 1; e.vx = dx / d * 150; e.vy = dy / d * 150; } }
    else if (e.state === 'lunge') {                                 // only the lunge itself chills you
      vt = 1;
      if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); e.stateT = 0; }
      if (e.stateT <= 0) { e.state = 'fade'; e.stateT = 1.1; }
    }
    else if (e.state === 'fade') { tx = -dx; ty = -dy - 30; sp = 40; vt = 0.15; if (e.stateT <= 0) { e.state = 'drift'; e.stateT = 1.2 + Math.random() * 1.2; } }
    e.vis = approach(e.vis, vt, dt * (vt > e.vis ? 3 : 1.5));
    if (e.state !== 'lunge') { const d = Math.hypot(tx, ty) || 1, k = Math.min(1, dt * 2); e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp + Math.sin(e.t * 2) * 8, k); }
    else { e.vx *= Math.pow(0.4, dt); e.vy *= Math.pow(0.4, dt); }
    e.facing = dx > 0 ? 1 : -1;
  },
  skull(e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt;
    if (Math.random() < dt * 25) parts.push({ x: e.x + e.w / 2 + rnd(-3, 3), y: e.y + 1, vx: rnd(-8, 8) - e.vx * 0.2, vy: rnd(-30, -15), g: -20, life: 0.35, max: 0.35, col: Math.random() < 0.5 ? '#ff7a1a' : '#ffd27a', size: 1, glow: true });
    if (e.state === 'walk') {
      let tx, ty;
      if (aggro) { tx = dx + Math.cos(e.t * 1.3 + e.seed) * 50; ty = dy - 30 + Math.sin(e.t * 2.1) * 14; } else { tx = Math.cos(e.t * 0.7 + e.seed) * 40; ty = Math.sin(e.t * 1.1 + e.seed) * 20; }
      const d = Math.hypot(tx, ty) || 1, sp = aggro ? 60 : 26, k = Math.min(1, dt * 2.5);
      e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
      if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
      e.facing = dx > 0 ? 1 : -1;
      if (aggro && dist < 150 && e.atkCD <= 0 && losClear(e.x + e.w / 2, e.y + e.h / 2, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'shake'; e.stateT = 0.5; sfx.crackle(); }
    } else if (e.state === 'shake') {
      e.vx = approach(e.vx, 0, 400 * dt); e.vy = approach(e.vy, 0, 400 * dt);
      if (e.stateT <= 0) { const a = Math.atan2(dy, dx); e.vx = Math.cos(a) * 230; e.vy = Math.sin(a) * 230; e.state = 'dash'; e.stateT = 0.7; e.swingHit = false; sfx.fire(); }
    } else if (e.state === 'dash') {
      if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
      if (e.state === 'dash' && (e.hitWall || e.hitCeil || e.onGround)) { e.state = 'walk'; e.stun = 0.9; e.atkCD = 1.6; e.vx *= -0.3; e.vy *= -0.3; burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#ff8a2a', 70, 0, 0.35, 1, true); shake(1.5); }
      else if (e.state === 'dash' && e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random(); }
    }
  },
  lurker(e, dt, dx, dy, dist, aggro) {
    let tx, ty;
    if (aggro) { const side = dx > 0 ? -1 : 1; tx = dx + side * 95; ty = dy - 35 + Math.sin(e.t * 1.7) * 15; }
    else { tx = Math.cos(e.t * 0.5 + e.seed) * 40; ty = Math.sin(e.t * 0.8 + e.seed) * 25; }
    const d = Math.hypot(tx, ty) || 1, sp = Math.min(55, d * 1.5), k = Math.min(1, dt * 2);
    e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
    e.facing = dx > 0 ? 1 : -1;
    e.shoot -= dt; e.charging = aggro && e.shoot < 0.45;
    if (aggro && dist < 230 && e.shoot <= 0) {
      const ox = e.x + e.w / 2 + e.facing * 5, oy = e.y + e.h / 2; const pdx = pl.x + pl.w / 2 - ox, pdy = pl.y + 9 - oy; const l = Math.hypot(pdx, pdy) || 1;
      projs.push({ x: ox, y: oy, vx: pdx / l * 120, vy: pdy / l * 120, dmg: e.dmg, owner: 'enemy', life: 5, t: 0 });
      e.shoot = 2.4 + Math.random() * 1.2; sfx.shoot();
    } else if (!aggro && e.shoot < 0.5) e.shoot = 1.5;
  }
};
// ---- ground pathfinding: a short breadth-first search over the spots a walker can stand on ----
const NAV_WALKERS = { zombie: 1, skeleton: 1, guard: 1 };
// ground a walker can stand on: solid blocks and the wooden platform (125 = PLAT, js/239), which is not solid,
// so it never counts as a wall or a ceiling (they jump up through it from below)
function footAt(x, y) { const t = tileAt(x, y); return SOLID[t] === 1 || t === 125; }
function navStand(x, y, hT) { if (!footAt(x, y)) return false; for (let k = 1; k <= hT; k++) if (solidAt(x, y - k)) return false; return true; }
function navClear(x, y0, y1) { for (let y = y0; y <= y1; y++) if (solidAt(x, y)) return false; return true; }
function navMoves(x, y, hT, out) {
  out.length = 0;
  for (const d of [-1, 1]) {
    const nx = x + d;
    for (let up = 2; up >= 1; up--) if (navStand(nx, y - up, hT) && navClear(x, y - hT - up, y - 1)) out.push([nx, y - up, up > 1 || !solidAt(nx, y - up) ? 'up' : 'walk']);   // a platform step needs a hop: no auto step-up onto it
    if (!navClear(nx, y - hT, y - 1)) continue;                       // a wall that side
    if (footAt(nx, y)) { out.push([nx, y, 'walk']); continue; }
    let k = 1; while (k <= 10 && !footAt(nx, y + k)) k++;          // the drop off this edge
    if (k <= 10) out.push([nx, y + k, k <= 3 ? 'walk' : 'drop']);
    if (k > 3) for (let c = 2; c <= 4; c++) {                         // or leap across to the far side
      const gx = x + d * c; if (!navClear(gx - d, y - hT - 1, y - 1)) break;
      for (let dd = -2; dd <= 3; dd++) if (navStand(gx, y + dd, hT)) { out.push([gx, y + dd, 'leap']); break; }
    }
  }
  return out;
}
// first step of the shortest way from e to the floor the hero stands on (null when there is none nearby)
function navFind(e) {
  const hT = Math.ceil(e.h / T), sy = Math.floor((e.y + e.h + 1) / T);
  let sx = Math.floor((e.x + e.w / 2) / T);
  if (!navStand(sx, sy, hT)) sx = navStand(Math.floor((e.x + 1) / T), sy, hT) ? Math.floor((e.x + 1) / T) : Math.floor((e.x + e.w - 1) / T);   // half over an edge
  const px = Math.floor((pl.x + pl.w / 2) / T); let py = Math.floor((pl.y + pl.h + 1) / T);
  for (let k = 0; k < 8 && !footAt(px, py); k++) py++;
  if (!navStand(sx, sy, hT)) return null;
  const R = 22, key = (x, y) => (x - sx + R) * 100 + (y - sy + 50);
  const seen = new Set([key(sx, sy)]), q = [[sx, sy, 0, null]], moves = [];
  for (let i = 0; i < q.length && i < 1600; i++) {
    const [x, y, n, first] = q[i];
    if (Math.abs(x - px) <= 1 && Math.abs(y - py) <= 1) return first ? { ...first, steps: n } : { dir: 0, kind: 'here', steps: 0 };
    if (n >= 30) continue;
    for (const [nx, ny, kind] of navMoves(x, y, hT, moves)) {
      if (Math.abs(nx - sx) > R || Math.abs(ny - sy) > 40) continue;
      const k = key(nx, ny); if (seen.has(k)) continue; seen.add(k);
      q.push([nx, ny, n + 1, first || { dir: Math.sign(nx - x), kind, tx: nx, ty: ny }]);
    }
  }
  return null;
}
// true when at least one straight line between the two bodies (head, chest or feet height) is free of blocks
function clearPath(a, b) {
  const ax = a.x + a.w / 2, bx = b.x + b.w / 2;
  for (const f of [0.5, 0.2, 0.8]) if (losClear(ax, a.y + a.h * f, bx, b.y + b.h * f)) return true;
  return false;
}
// what lies in front of a walker's feet: 0 = fine to keep walking, 'stop' = a drop it should not take,
// or a number = the forward speed of a jump that reaches the ground on the other side
function ledgeAhead(e, dir, dy, chase) {
  const fy = Math.floor((e.y + e.h + 1) / T), fx = Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / T);
  if (solidAt(fx, fy - 1)) return 0;                                      // a wall, not a ledge
  const drop = chase && dy > 2 * T ? 5 : 3;                                // follows you a little further down
  for (let k = 0; k < drop; k++) if (footAt(fx, fy + k)) return 0;
  if (!chase) return 'stop';
  for (let c = 1; c <= 4; c++) {
    const gx = fx + dir * c;
    if (solidAt(gx - dir, fy - 1) || solidAt(gx - dir, fy - 2)) break;   // something overhead blocks the jump
    for (let d = -2; d <= 3; d++) {
      const gy = fy + d;
      if (!footAt(gx, gy) || solidAt(gx, gy - 1) || solidAt(gx, gy - 2)) continue;
      const t = (270 + Math.sqrt(270 * 270 + 2 * GRAV * d * T)) / GRAV;
      return Math.min(150, (c * T + 6) / t);
    }
  }
  return 'stop';
}
// shared ground movement: walks toward dir, hops onto steps, jumps gaps it can clear and halts at the rest
function walk(e, dt, dir, sp, acc, jv, dy, chase) {
  if (e.leapT > 0) {
    e.leapT -= dt;
    if (!e.onGround) { if (e.hitWall && e.leapVx) e.vx = e.leapVx; return dir; }   // a wall stopped it mid-jump: keep pressing on so it climbs over
    e.leapT = 0;
  }
  const nav = chase && e.nav && (e.nav.steps > 1 || e.nav.kind !== 'walk') && e.nav.kind !== 'here' ? e.nav : null;
  if (nav) { dir = nav.dir; e.facing = dir; }
  if (nav && nav.kind === 'up' && e.onGround) {                          // hop up onto the ledge ahead
    const edge = dir > 0 ? nav.tx * T : (nav.tx + 1) * T, front = dir > 0 ? e.x + e.w : e.x;
    if (Math.abs(edge - front) < 8) { e.vy = -Math.max(jv, 270); e.vx = e.leapVx = dir * sp; e.leapT = 0.5; return dir; }
  }
  if (dir && e.onGround) {
    let L = ledgeAhead(e, dir, dy, chase);
    if (L === 'stop' && nav && nav.kind === 'drop') L = 0;               // the route goes down this cliff
    if (L === 'stop') { if (Math.sign(e.vx) === dir) e.vx = 0; if (!chase) e.wander = -dir; return 0; }
    if (L) { e.vy = -270; e.vx = e.leapVx = dir * Math.max(L, Math.abs(e.vx)); e.leapT = 0.8; e.facing = dir; return dir; }
  }
  if (e.onGround && e.vx && Math.sign(e.vx) !== dir && ledgeAhead(e, Math.sign(e.vx), dy, false) === 'stop') e.vx = 0;
  e.vx = approach(e.vx, dir * sp, acc * dt);
  if (e.onGround && e.hitWall && dir) e.vy = -jv;
  return dir;
}
// how many tiles tall (1..max) the wall right in front of e is when it can be hopped onto, else 0
function stepUp(e, dir, max) {
  const fy = Math.floor((e.y + e.h - 1) / T), fx = Math.floor((dir > 0 ? e.x + e.w + 4 : e.x - 4) / T), hT = Math.ceil(e.h / T);
  let k = 0;
  if (solidAt(fx, fy)) { k = 1; while (k <= max && solidAt(fx, fy - k)) k++; if (k > max) return 0; }
  else { for (let j = 0; j < max && !k; j++) if (footAt(fx, fy - j) && !footAt(fx, fy - j - 1)) k = j + 1; if (!k || solidAt(fx, fy - k)) return 0; }   // a platform within reach
  for (let j = 1; j < hT; j++) if (solidAt(fx, fy - k - j)) return 0;     // room to stand on top
  return k;
}
// how far (px, up to max) a walker can travel ahead of its front edge before the floor drops away
function floorRun(e, dir, max) {
  const fy = Math.floor((e.y + e.h + 1) / T), x0 = dir > 0 ? e.x + e.w : e.x;
  for (let s = 0; s <= max; s += 3) { const tx = Math.floor((x0 + dir * s) / T); if (!footAt(tx, fy) && !footAt(tx, fy + 1) && !footAt(tx, fy + 2)) return Math.max(0, s - 3); }
  return max;
}
function losClear(x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6); for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(Math.floor((x0 + (x1 - x0) * t) / T), Math.floor((y0 + (y1 - y0) * t) / T))) return false; } return true; }
function fireball(ox, oy, sp, dmg, off = 0) {
  const a = Math.atan2(pl.y + 9 - oy, pl.x + pl.w / 2 - ox) + off;
  projs.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, owner: 'enemy', life: 5, t: 0, kind: 'fire' });
  sfx.fire();
}
