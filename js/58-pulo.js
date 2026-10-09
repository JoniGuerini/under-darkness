'use strict';

/* ================= the hero's jump: take-off, rise, apex, fall and landing =================
   Before this the hero kept one leg pose and the idle arms for the whole jump.
   Now the air is read from the vertical speed:
     rise  - near knee driven up, far leg trailing with the toe pointed, front arm reaching up
     apex  - both knees tucked, arms easing out
     fall  - legs reaching down for the floor, arms lifted out for balance (higher when falling far)
     land  - a short crouch on touch-down, the body sinks 1 px, arms drop
   Legs are painted by 37-heroi from these grids (same shading, same 12x4 slot).
   Arms only change when nothing else drives them (no attack, mining, shield, aiming or climbing),
   and every angle eases toward its target so the poses blend instead of popping. */

Object.assign(HERO_LEGS, {
  rise: ["...PP..pppp.", "..PP....fff.", "..FF........", ".F.........."],
  apex: ["..PPP..pppp.", "..FFF...fff.", "............", "............"],
  fall: ["...PP..pp...", "..PP....pp..", "..FF....ff..", "..F......f.."],
  land: ["..PP....pp..", ".PP......pp.", ".FFF....fff.", "............"]
});
// leg sets painted before this file loaded have no new frames: drop them so they repaint
for (const k of [...lookCache.keys()]) if (k.startsWith('hl:')) lookCache.delete(k);
if (typeof look !== 'undefined' && look && look.legs && !look.legs.rise) look.legs = heroLegsFor(eqId('feet'));

const JUMP = {
  RISE: -120, FALL: 120, HIGH: 330,   // vy thresholds (px/s): rising fast / falling / falling far
  LAND_T: 0.13, LAND_VY: 150          // crouch time after a landing harder than this
};
// target arm angles per phase (0 = up, +pi/2 = forward, negative = behind)
const JUMP_ARMS = {
  rise: { f: 0.75, b: -2.55, s: 0.35 },
  apex: { f: 1.25, b: -1.75, s: 0.7 },
  fall: { f: 1.45, b: -1.25, s: 1.0 },
  high: { f: 1.1, b: -1.0, s: 0.8 },
  land: { f: 2.45, b: -2.85, s: 1.1 }
};
const jump = { ph: null, land: 0, air: false, vy: 0, t: -1, f: 0, b: 0, s: 0 };

function jumpPhase() {
  if (pl.climb) return null;
  if (!pl.onGround) return pl.vy < JUMP.RISE ? 'rise' : pl.vy > JUMP.HIGH ? 'high' : pl.vy > JUMP.FALL ? 'fall' : 'apex';
  return jump.land > 0 ? 'land' : null;
}
function jumpTick() {
  const dt = jump.t < 0 ? 0 : clamp(gameTime - jump.t, 0, 0.1); jump.t = gameTime;
  if (dt > 0) {
    if (jump.air && pl.onGround && jump.vy > JUMP.LAND_VY) jump.land = JUMP.LAND_T;
    else jump.land = Math.max(0, jump.land - dt);
    if (Math.abs(pl.vx) > 6 && pl.onGround) jump.land = Math.min(jump.land, 0.05);   // running off a landing cuts the crouch short
    jump.air = !pl.onGround && !pl.climb; jump.vy = pl.vy;
  }
  return dt;
}
// arms are free for the jump pose only when no action owns them
function jumpArmsFree() { return pl.atkT < 0 && !pl.mining && pl.shieldK < 0.3 && !(pl.useT > 0) && pl.stunT <= 0; }

const _playerPoseBase = playerPose;
playerPose = function () {
  const dt = jumpTick(), P = _playerPoseBase(), ph = jumpPhase(), L = look;
  jump.ph = ph;
  if (!ph) { jump.f = P.front.ang; jump.b = P.back.ang; jump.s = P.front.item ? P.front.item.ang : jump.s; return P; }
  const legs = ph === 'high' ? 'fall' : ph;
  if (L.legs[legs]) P.legs = L.legs[legs];
  if (!jumpArmsFree()) { jump.f = P.front.ang; jump.b = P.back.ang; if (P.front.item) jump.s = P.front.item.ang; return P; }
  const A = JUMP_ARMS[ph], k = Math.min(1, dt * (ph === 'land' ? 30 : 14));
  jump.f = lerp(jump.f, A.f, k); jump.b = lerp(jump.b, A.b, k); jump.s = lerp(jump.s, A.s, k);
  P.front.ang = jump.f;
  const it = P.front.item; if (it && hb.sel <= 1) it.ang = jump.s;   // sword or pickaxe follows the swing; small held items stay upright
  // far arm swings; a strapped shield goes with the hand
  P.back.ang = jump.b; P.back.len = 6; P.back.sl = 5;
  if (P.shield) { P.shield.cx = OX + 4.5 + Math.sin(jump.b) * 5.5; P.shield.cy = OY + 10.5 - Math.cos(jump.b) * 5.5; P.shield.img = L.shield.face; P.shield.top = false; }
  return P;
};

// the landing crouch sinks the whole figure by 1 px (the land legs are 3 rows, so the feet stay on the floor)
function drawPlayer(cx, cy) {
  if (pl.dead) return;
  if (pl.invuln > 0 && pl.hurtFlash <= 0 && Math.floor(pl.invuln * 16) % 2 === 0) return;
  compose(playerPose());
  drawComposite(Math.round(pl.x + pl.w / 2) - cx, Math.round(pl.y + pl.h) - cy + (jump.ph === 'land' ? 1 : 0), pl.facing);
}
