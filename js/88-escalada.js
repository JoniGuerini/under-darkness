'use strict';

/* ================= the hero climbing ladders, ropes and chains =================
   While climbing the hero is seen from behind: hair, the back of the tunic, the belt, and the gear stowed on
   the back (shield in the middle, weapon across it with the hilt over the shoulder, pickaxe the other way).
     ladder - hands at shoulder width passing from rung to rung, legs stepping, opposite hand and foot together
     rope   - (the mine's rope and the cathedral's chain) hands one over the other on the line above the head,
              knees together and feet clamped on the rope
   The cycle follows the distance actually climbed, so standing still on a ladder holds the pose.
   Reaching the floor he turns back to the side; jumping off he pushes away from the ladder for a moment first,
   and for a short while after leaving he is still reaching for the weapon on his back.
   Painted on the same ramps as 37-heroi (heroPaint, heroRamp, heroArm). Wraps playerPose and compose;
   loads after 62-montante-maos so it is the outermost wrap. */

// back of the body: same 12x18 slot and footprint as HERO_BODY (h hair · s skin · n collar · r cloth · b belt)
const HERO_BACK = [
  "....hhhh....",
  "...hhhhhh...",
  "..hhhhhhhh..",
  "..hhhhhhhh..",
  "..shhhhhhs..",
  "..hhhhhhhh..",
  "...hhhhhh...",
  "....ssss....",
  "....nssn....",
  "...nnnnnn...",
  "..rrrrrrrr..",
  "..rrrRRrrr..",
  "..rrrRRrrr..",
  "..bbbbbbbb..",
  "..rrrRRrrr..",
  "..rrrrrrrr..",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr."
];
// legs from behind (painted by heroLegsFor with the rest of the hero's legs)
Object.assign(HERO_LEGS, {
  clA: ["...PP..pp...", "...FF..pp...", "...FF..pp...", ".......ff..."],   // left foot up a rung
  clM: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FF..ff..."],   // both on the same rung
  clB: ["...PP..pp...", "...PP..ff...", "...PP..ff...", "...FF......."],   // right foot up a rung
  clR: ["....PPpp....", "....PPpp....", ".....Fff....", ".....FF....."],   // knees together, feet clamped on the rope
  clP: ["..PP....pp..", ".PP......pp.", ".FF......ff.", "............"]    // pushing off the ladder
});
for (const k of [...lookCache.keys()]) if (k.startsWith('hl:')) lookCache.delete(k);
if (typeof look !== 'undefined' && look && look.legs && !look.legs.clA) look.legs = heroLegsFor(eqId('feet'));

function heroBackFor(id) {
  return cached('hbk:' + (id || '-'), () => {
    const pal = Object.assign({}, PC, id ? ITEMS[id].pal : BODY_RAGS), tex = heroTex(id);
    const M = {
      h: { ramp: heroRamp(HERO_COL.h), grain: 0.1, tex: 'hair' }, s: { ramp: heroRamp(HERO_COL.s), grain: 0 },
      r: { ramp: heroRamp(pal.r), grain: 0, tex, lip: true }, n: { ramp: heroRamp(pal.R), grain: 0.06 },
      b: { ramp: heroRamp(pal.b), grain: 0.1, under: true }
    };
    return heroPaint(HERO_BACK, L => M[L], 9);
  });
}

const CLIMB = { STRIDE: 14, TURN_T: 0.14, PUSH_T: 0.11, DRAW_T: 0.22 };
const climbA = { view: false, dist: 0, y: null, t: -1, turn: 0, push: 0, draw: 0, kind: 'ladder', was: false };

// what is being climbed: the mine's ladder, or something held like a rope (the mine's rope, the cathedral's chain)
function climbKind() { return typeof MN_ESCADA !== 'undefined' && touchingTile(pl, MN_ESCADA) ? 'ladder' : 'rope'; }
// seen from behind while on the ladder and off the floor, unless an action needs the weapon in hand
function climbBackView() { return pl.climb && !pl.onGround && pl.atkT < 0 && !pl.mining && pl.shieldK < 0.3 && !(pl.useT > 0); }

// a climbing arm in two pieces, shoulder to elbow then elbow to hand, each a 2px capsule lit from the top-left
function climbSeg(cloth, dark, ang, len, hand) {
  const q = ((Math.round(ang / (Math.PI * 2) * 64) % 64) + 64) % 64, n = Math.max(0, Math.round(len * 2) / 2);
  return cached('cs:' + cloth + dark + q + ':' + n + (hand ? 'h' : ''), () => {
    const a = q / 64 * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a), C = 9, c = mk(C * 2 + 1, C * 2 + 1), x = c.getContext('2d');
    const cr = heroRamp(cloth), sr = heroRamp(HERO_COL.s), sl = hand ? n - 1.6 : n + 1;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const px = i + 0.5 - (C + 0.5), py = j + 0.5 - (C + 0.5);
      const t = clamp(px * dx + py * dy, 0, n), ex = px - dx * t, ey = py - dy * t;
      if (ex * ex + ey * ey > 0.8) continue;
      const side = -ex * 0.6 - ey * 0.8;
      let v = 3 - dark + (side > 0.35 ? 1 : side < -0.35 ? -1 : 0);
      const h = t > sl; if (hand && !h && t > sl - 1.1) v -= 1;   // cuff
      x.fillStyle = (h ? sr : cr)[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
    }
    return { img: c, C, ex: dx * n, ey: dy * n };
  });
}
function climbArmDraw(c, sx, sy, A) {
  const u = climbSeg(A.hero, A.dark, A.ua, A.ul, false);
  c.drawImage(u.img, Math.round(sx - 0.5) - u.C, Math.round(sy - 0.5) - u.C);
  const ex = sx + u.ex, ey = sy + u.ey, f = climbSeg(A.hero, A.dark, A.fa, A.fl, true);
  c.drawImage(f.img, Math.round(ex - 0.5) - f.C, Math.round(ey - 0.5) - f.C);
}

function climbPose(P) {
  const L = look, ph = climbA.dist / CLIMB.STRIDE * Math.PI * 2, s = Math.sin(ph), push = climbA.push > 0;
  let legs, aL, aR;
  if (push) {   // letting go: arms flung out, legs kicking off
    legs = 'clP'; aL = { ua: -1.5, ul: 3, fa: -1.2, fl: 3.5 }; aR = { ua: 1.5, ul: 3, fa: 1.2, fl: 3.5 };
  } else if (climbA.kind === 'ladder') {
    legs = s > 0.35 ? 'clA' : s < -0.35 ? 'clB' : 'clM';
    // hands on the rungs at shoulder width, beside the head: the hand opposite the raised foot is the high one
    aL = { ua: -0.75, ul: 3, fa: -0.1, fl: 3.2 - s * 2.2 }; aR = { ua: 0.75, ul: 3, fa: 0.1, fl: 3.2 + s * 2.2 };
  } else {
    legs = 'clR';
    // hand over hand on the line in front of him: elbows out, both hands closing on the rope over the head
    aL = { ua: -1.0, ul: 3, fa: 0.5, fl: 5.2 + s * 1.8 }; aR = { ua: 1.0, ul: 3, fa: -0.5, fl: 5.2 - s * 1.8 };
  }
  aL.hero = aR.hero = L.arm; aL.dark = s > 0 ? 0 : 1; aR.dark = s > 0 ? 1 : 0;
  return {
    climb: true, kind: climbA.kind, back: heroBackFor(eqId('body')), legs: L.legs[legs] || L.legs.idle, head: L.head,
    armL: aL, armR: aR,
    weapon: L.weapon ? { img: L.weapon, px: L.wpx, py: L.wpy } : null, pick: L.pick, shield: L.shield ? L.shield.face : null,
    flash: pl.hurtFlash > 0
  };
}

{
  const _playerPose = playerPose;
  playerPose = function () {
    const dt = climbA.t < 0 ? 0 : clamp(gameTime - climbA.t, 0, 0.1); climbA.t = gameTime;
    if (climbA.y !== null && pl.climb) climbA.dist += Math.abs(pl.y - climbA.y) + Math.abs(pl.vx) * dt * 0.5;
    climbA.y = pl.y;
    const view = climbBackView();
    if (view) climbA.kind = climbKind();
    // leaving the back view: a push away if he jumped off, otherwise the turn to the side
    if (climbA.view && !view) {
      if (!pl.climb && !pl.onGround && pl.vy < -100) climbA.push = CLIMB.PUSH_T; else climbA.turn = CLIMB.TURN_T;
      climbA.draw = CLIMB.DRAW_T;
    }
    climbA.view = view;
    climbA.turn -= dt; climbA.push -= dt; climbA.draw -= dt;
    if (view || climbA.push > 0) return climbPose(_playerPose());
    const P = _playerPose();
    if (climbA.draw > 0 && pl.atkT < 0 && hb.sel <= 1 && P.front) {
      // still reaching over the shoulder for the weapon: empty hand coming down from the back
      const k = 1 - climbA.draw / CLIMB.DRAW_T;
      P.front = Object.assign({}, P.front, { item: k > 0.7 ? P.front.item : null, ang: lerp(-0.4, P.front.ang, k) });
      if (P.shield && k < 0.5) P.shield = null;
    }
    if (climbA.turn > 0 && P.back && !P.back.top) P.back = Object.assign({}, P.back, { ang: 3.0, len: 5 });
    return P;
  };
}

// the climbing figure: arms behind or in front of the back depending on how high the hand is, gear on the back
function composeClimb(P) {
  const c = crctx; c.clearRect(0, 0, CW, CHT);
  const bx = OX, by = OY, shL = [bx + 2.5, by + 10.5], shR = [bx + 9.5, by + 10.5];
  c.drawImage(P.legs, bx, by + 18);
  c.drawImage(P.back, bx, by);
  if (P.head) c.drawImage(P.head.img, bx, by + P.head.oy);
  // gear strapped on the back: pickaxe one way, the shield, and the weapon across it with the hilt over the right shoulder
  if (P.pick) rotDraw(c, P.pick, bx + 3, by + 10, 4.5, 11, Math.PI - 0.55);
  if (P.shield) c.drawImage(P.shield, Math.round(bx + 6 - P.shield.width / 2), Math.round(by + 14 - P.shield.height / 2));
  if (P.weapon) rotDraw(c, P.weapon.img, bx + 9.5, by + 7.5, P.weapon.px || 2.5, P.weapon.py || 11, Math.PI + 0.55);
  climbArmDraw(c, shL[0], shL[1], P.armL);
  climbArmDraw(c, shR[0], shR[1], P.armR);
  // the same 1px outline pass as compose()
  const o = csctx; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, CW, CHT);
  o.drawImage(compRaw, -1, 0); o.drawImage(compRaw, 1, 0); o.drawImage(compRaw, 0, -1); o.drawImage(compRaw, 0, 1);
  o.globalCompositeOperation = 'source-in'; o.fillStyle = '#140d14'; o.fillRect(0, 0, CW, CHT); o.globalCompositeOperation = 'source-over';
  cctx.clearRect(0, 0, CW, CHT); cctx.drawImage(compSil, 0, 0); cctx.drawImage(compRaw, 0, 0);
  if (P.flash) { cctx.globalCompositeOperation = 'source-atop'; cctx.globalAlpha = 0.85; cctx.fillStyle = '#fff'; cctx.fillRect(0, 0, CW, CHT); cctx.globalAlpha = 1; cctx.globalCompositeOperation = 'source-over'; }
  return comp;
}
{
  const _compose = compose;
  compose = function (P) {
    if (!P || !P.climb) return _compose(P);
    if (!compRaw) _compose({ body: P.back, legs: P.legs });   // first call makes the canvases
    return composeClimb(P);
  };
}
