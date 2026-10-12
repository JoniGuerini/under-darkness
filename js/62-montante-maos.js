'use strict';

/* ================= the two-handed sword in play (data: js/61-montante.js) =================
   - No shield with it: equipping the montante sends the shield to the bag, equipping a shield sends the montante
     to the bag (whichever you just put on stays). With a full bag the other piece falls at your feet.
   - Both hands on the grip: the near hand holds the hilt under the guard (the usual held-item pivot), the far arm
     is re-aimed every frame at the wrap near the pommel and drawn in front of the chest, so swings, jumps and
     the doll in the inventory all show the two-handed grip.
   - At rest the blade is carried higher, in a guard, instead of hanging from one hand.
   - Sword talents ("com espadas") count for it too.
   Loads after 51-talentos and 58-pulo (it wraps recalc, poseFor, playerPose and talCondOk). */

/* ---- the rule: montante or shield ---- */
const twoHand = { w: null, s: null };   // what was in the hands the last time the numbers were made
function twoHandRule() {
  const w = equip.weapon, s = equip.shield;
  if (!w || !s || !isTwoHand(w.id)) return;
  const off = w !== twoHand.w ? 'shield' : 'weapon', it = equip[off];   // the piece that just arrived stays
  equip[off] = null;
  if (!addInst(it)) loot.push({ x: pl.x + pl.w / 2, y: pl.y + pl.h - 2, vx: rnd(-30, 30), vy: rnd(-110, -70), id: it.id, n: 1, item: it, t: 0, rest: false });
  invDirty = true;
  if (typeof toast === 'function' && state === 'play') toast(off === 'shield' ? 'Espada de duas mãos: o escudo foi para a mochila' : 'Com escudo não dá: a espada de duas mãos foi para a mochila');
}
{
  const _recalc = recalc;
  recalc = function () {
    twoHandRule(); _recalc.apply(this, arguments); twoHand.w = equip.weapon; twoHand.s = equip.shield;
    // its own blow (gsSwing in 61): one chop fills most of the time between blows, like the one-handed swing does
    pl.twoHand = !!(equip.weapon && isTwoHand(equip.weapon.id));
    if (pl.twoHand) pl.atkSpd = clamp(GS_TM.total / (pl.atkPeriod * 0.85), 0.5, 1.6);
  };
}

/* ---- sword talents ---- */
{
  const _talCondOk = talCondOk;
  talCondOk = function (c, kind) { return _talCondOk(c, kind) || (c === 'sword' && kind === 'greatsword'); };
}

/* ---- the grip ---- */
const GS_GRIP = 2.6;   // px from the near hand down the wrap to where the far hand closes
const GS_REST = { f: 2.0, s: 0.3 };   // guard at rest: near arm a little forward, blade nearly upright
const gsPose = { f: GS_REST.f, s: GS_REST.s, t: -1 };
function holdsTwoHand(P) { return !!(P && P.front && P.front.item && hb.sel === 0 && equip.weapon && isTwoHand(equip.weapon.id) && look && look.weapon === P.front.item.img); }
function gripBothHands(P) {
  if (!holdsTwoHand(P)) return P;
  const F = P.front, it = F.item, r = heroArm(F.hero, F.dark, F.ang, F.len);
  const hx = OX + 7.5 + r.hx, hy = OY + 10.5 + r.hy;                              // the near hand, where the hilt is pinned
  const gx = hx - Math.sin(it.ang) * GS_GRIP, gy = hy + Math.cos(it.ang) * GS_GRIP;  // further down the wrap
  const dx = gx - (OX + 4.5), dy = gy - (OY + 10.5), len = clamp(Math.hypot(dx, dy), 2, 7);
  P.back = Object.assign({}, P.back, { ang: Math.atan2(dx, -dy), len, sl: len - 1, top: true });
  P.shield = null;
  return P;
}
{
  const _poseFor = poseFor;
  poseFor = function () { return gripBothHands(_poseFor.apply(this, arguments)); };
  const _playerPose = playerPose;
  playerPose = function () {
    const P = _playerPose();
    if (!holdsTwoHand(P)) { gsPose.t = -1; return P; }
    const dt = gsPose.t < 0 ? 1 : clamp(gameTime - gsPose.t, 0, 0.1); gsPose.t = gameTime;
    // at rest on the ground the blade is carried in a guard; anything that owns the arms (a swing, a jump) wins
    const rest = pl.atkT < 0 && !pl.mining && pl.onGround && !pl.climb && !(pl.useT > 0) && pl.stunT <= 0 && !(typeof jump !== 'undefined' && jump.ph);
    if (rest) {
      const bob = Math.abs(pl.vx) > 6 ? Math.sin(pl.walk * Math.PI / 2) * 0.08 : 0, k = Math.min(1, dt * 14);
      gsPose.f = lerp(gsPose.f, GS_REST.f + bob, k); gsPose.s = lerp(gsPose.s, GS_REST.s + bob, k);
      P.front.ang = gsPose.f; P.front.item.ang = gsPose.s;
    } else { gsPose.f = P.front.ang; gsPose.s = P.front.item.ang; }
    return gripBothHands(P);
  };
}
// the far arm in front of the chest when both hands hold the hilt: drawn after the body, before the near arm
{
  const _compose = compose;
  compose = function (P) {
    if (!P.back || !P.back.top) return _compose(P);
    const back = P.back, front = P.front, item = front && front.item;
    if (!compRaw) _compose(Object.assign({}, P, { back: null, front: null }));   // first call makes the canvases
    // same layers as compose(), with the far arm moved in front of the chest, then the same outline pass
    const c = crctx; c.clearRect(0, 0, CW, CHT);
    const bx = OX, by = OY;
    if (P.shield && !P.shield.top) c.drawImage(P.shield.img, Math.round(P.shield.cx - P.shield.img.width / 2), Math.round(P.shield.cy - P.shield.img.height / 2));   // a aljava nas costas (js/350)
    c.drawImage(P.legs, bx, by + 18); c.drawImage(P.body, bx, by);
    if (P.head) c.drawImage(P.head.img, bx, by + P.head.oy);
    { const h = heroArmDraw(c, bx + 4.5, by + 10.5, back); if (back.item) rotDraw(c, back.item.img, h[0], h[1], back.item.px || 2.5, back.item.py || 11, back.item.ang); }   // a flecha na mão de trás (js/350)
    if (front) { const h = heroArmDraw(c, bx + 7.5, by + 10.5, front); if (item) rotDraw(c, item.img, h[0], h[1], item.px || 2.5, item.py || 11, item.ang); }
    // far hand closes over the grip: repaint just the hand on top of the blade
    const r = heroArm(back.hero, back.dark, back.ang, back.len), hx = bx + 4.5 + r.hx, hy = by + 10.5 + r.hy, sr = heroRamp(HERO_COL.s);
    c.fillStyle = sr[2]; c.fillRect(Math.round(hx - 1), Math.round(hy - 1), 2, 2); c.fillStyle = sr[3]; c.fillRect(Math.round(hx - 1), Math.round(hy - 1), 1, 1);
    const o = csctx; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, CW, CHT);
    o.drawImage(compRaw, -1, 0); o.drawImage(compRaw, 1, 0); o.drawImage(compRaw, 0, -1); o.drawImage(compRaw, 0, 1);
    o.globalCompositeOperation = 'source-in'; o.fillStyle = '#140d14'; o.fillRect(0, 0, CW, CHT); o.globalCompositeOperation = 'source-over';
    cctx.clearRect(0, 0, CW, CHT); cctx.drawImage(compSil, 0, 0); cctx.drawImage(compRaw, 0, 0);
    if (P.flash) { cctx.globalCompositeOperation = 'source-atop'; cctx.globalAlpha = 0.85; cctx.fillStyle = '#fff'; cctx.fillRect(0, 0, CW, CHT); cctx.globalAlpha = 1; cctx.globalCompositeOperation = 'source-over'; }
    return comp;
  };
}

/* ---- the shield slot shows the sword greyed out while both hands are busy ---- */
{
  const _refreshInv = refreshInv;
  refreshInv = function (force) {
    _refreshInv(force);
    const w = equip.weapon, on = !!(w && isTwoHand(w.id) && !equip.shield && ITEMS[w.id].kind !== 'bow');   // o arco deixa o espaço livre para a aljava
    document.querySelectorAll('.invcard .slot.eq[data-eq="shield"]').forEach(d => {
      d.classList.toggle('duas-maos', on);
      const img = d.querySelector('img'); if (!img) return;
      if (on) { img.src = ICON[w.id].url; img.hidden = false; d._key = 'dm' + w.uid; }
      else if (d._key && String(d._key).startsWith('dm')) { d._key = null; paintSlot(d, null, true); }
    });
  };
}

/* ---- the chop carries the body: lean back 1 px on the raise, forward on the chop, sink 1 px at the impact ---- */
{
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) {
    if (!pl.twoHand || pl.atkT < 0) return _drawPlayer(cx, cy);
    return _drawPlayer(cx - pl.facing * (pl.gsLean || 0), pl.gsSink ? cy - 1 : cy);   // lean back on the raise, forward on the chop
  };
}
