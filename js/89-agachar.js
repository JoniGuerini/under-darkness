'use strict';

/* ================= the hero crouching =================
   Holding S (or the down arrow) standing on the ground, away from ladders, ropes and chains, he crouches:
   knees bent out, the whole figure sinking 3 px (1, 2, then 3, so it eases down and back up), weapon arm
   drawn in a little lower and forward, ready.
   Only the look changes: hitbox, speed and everything else S does stay the same.
   Legs are painted by 37-heroi from these grids. Wraps playerPose and drawComposite (only while the hero
   is being drawn); loads after 88-escalada. */

Object.assign(HERO_LEGS, {
  ag1: ["..PP....pp..", ".PP......pp.", ".FFF....fff.", "............"],   // going down: feet at row 2, figure 1 px lower
  ag2: [".PPP....ppp.", "FFF......fff", "............", "............"],   // feet at row 1, figure 2 px lower
  ag3: ["FFF......fff", "............", "............", "............"]    // all the way down: knees under the tunic, figure 3 px lower
});
for (const k of [...lookCache.keys()]) if (k.startsWith('hl:')) lookCache.delete(k);
if (typeof look !== 'undefined' && look && look.legs && !look.legs.ag3) look.legs = heroLegsFor(eqId('feet'));

const CROUCH_T = 0.09;   // seconds to get all the way down (and back up)
const crouch = { k: 0, t: -1, dy: 0, drawing: false };

function crouchWanted() {
  const down = keys.KeyS || keys.ArrowDown;
  return !!down && pl.onGround && !pl.climb && !pl.dead && !(typeof touchingTile === 'function' && touchingTile(pl, CHAIN));
}
{
  const _playerPose = playerPose;
  playerPose = function () {
    const P = _playerPose();
    const dt = crouch.t < 0 ? 0 : clamp(gameTime - crouch.t, 0, 0.1); crouch.t = gameTime;
    crouch.k = clamp(crouch.k + (crouchWanted() ? 1 : -1) * dt / CROUCH_T, 0, 1);
    if (!pl.onGround || pl.climb || P.climb) crouch.k = 0;
    crouch.dy = Math.round(crouch.k * 3);
    if (crouch.dy && look.legs.ag3) P.legs = look.legs['ag' + crouch.dy];
    // arms free (no swing, pickaxe, shield or item use): the near arm comes in low and forward
    if (crouch.k > 0 && P.front && !P.climb && pl.atkT < 0 && !pl.mining && pl.shieldK < 0.3 && !(pl.useT > 0) && !(typeof holdsTwoHand === 'function' && holdsTwoHand(P))) {   // the montante keeps its two-hand guard
      P.front = Object.assign({}, P.front, { ang: lerp(P.front.ang, 2.25, crouch.k) });
      if (P.front.item && hb.sel <= 1) P.front.item = Object.assign({}, P.front.item, { ang: lerp(P.front.item.ang, 1.25, crouch.k) });
    }
    return P;
  };
}
{
  const _drawComposite = drawComposite;
  drawComposite = function (feetX, feetY, facing, s) { return _drawComposite(feetX, feetY + (crouch.drawing ? crouch.dy : 0), facing, s); };
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) { crouch.drawing = true; try { return _drawPlayer(cx, cy); } finally { crouch.drawing = false; } };
}
