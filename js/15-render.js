'use strict';

/* ================= render ================= */
// the sky, sun, moon, clouds and the mountains behind the surface live in js/32-fundo.js (buildBackdrop, drawSky)

function poseFor(k, fArm, sAng, legs, flash) {
  const ke = easeOut(k), bx = OX, by = OY, L = look;
  const scx = lerp(bx - 0.5, bx + 13.5, ke), scy = lerp(by + 14, by + 10.5, ke);
  const bdx = scx - (bx + 4.5), bdy = scy - (by + 10.5); const bLen = Math.min(6, Math.hypot(bdx, bdy));
  return {
    body: L.body, legs: L.legs[legs], head: L.head,
    shield: L.shield ? { img: k < 0.5 ? L.shield.face : L.shield.side, cx: scx, cy: scy, top: k > 0.8 } : null,
    back: { ang: Math.atan2(bdx, -bdy), len: bLen, sleeve: L.sleeveD, hand: PC.S, sl: bLen - 1, hero: L.arm, dark: 1 },
    front: { ang: fArm, len: 6, sleeve: L.sleeve, hand: PC.s, sl: 5, item: heldItem(L, sAng), hero: L.arm, dark: 0 },
    flash
  };
}
// what a dropped item looks like on the ground: a mini block, the small item art, or the full icon for gear
function dropSprite(id) {
  return cached('ds:' + id, () => { const it = ITEMS[id]; if (it.block) return blockCanvas(it.block, 8, 1, 30, 18); const h = handSprite(id); return h ? outlined(h) : ICON[id].cv; });
}
function handSprite(id) {
  return cached('hs:' + id, () => {
    const it = ITEMS[id];
    if (it.block) return blockCanvas(it.block, 7, 1, 30, 18);
    if (it.deco) return fromRows(ART_CANDLE2, ART_CANDLE2_P);
    if (it.icon === 'ore') return oreIconArt(id);
    const a = ICON_ART[it.icon]; return a ? fromRows(a[0], it.iconPal || a[1]) : null;
  });
}
// only a real picture goes in the hand (gear such as a shield carried in the backpack has none: the hand stays empty)
{ const _hs = handSprite; handSprite = function (id) { const c = _hs(id); return c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0 ? c : null; }; }
function heldItem(L, ang) {
  if (hb.sel === 0) return L.weapon ? { img: L.weapon, ang, px: L.wpx, py: L.spear && pl.atkT >= 0 ? pl.spearPy : L.wpy } : null;
  if (hb.sel === 1) return L.pick ? { img: L.pick, ang, px: 4.5, py: 11 } : null;
  const s = inv[hb.sel - 2]; if (!s) return null;
  const img = handSprite(s.id); return img ? { img, ang: 0, px: img.width / 2, py: img.height - 1 } : null;
}
function playerPose() {
  let legs = 'idle'; if (pl.climb) legs = Math.abs(pl.vy) > 1 ? WALK[Math.floor(gameTime * 8) % 4] : 'jump'; else if (!pl.onGround) legs = 'jump'; else if (Math.abs(pl.vx) > 6) legs = WALK[Math.floor(pl.walk) % 4];
  return poseFor(pl.shieldK, pl.fArm, pl.sAng, legs, pl.hurtFlash > 0);
}
function drawPlayer(cx, cy) {
  if (pl.dead) return;
  if (pl.invuln > 0 && pl.hurtFlash <= 0 && Math.floor(pl.invuln * 16) % 2 === 0) return;
  compose(playerPose());
  drawComposite(Math.round(pl.x + pl.w / 2) - cx, Math.round(pl.y + pl.h) - cy, pl.facing);
}
function drawSmear(cx, cy) {
  if (pl.dead || pl.trail.length < 2) return;
  const sx = Math.round(pl.x + pl.w / 2) - cx + pl.facing * 1.5, sy = Math.round(pl.y + pl.h) - cy - 11.5;
  const a0 = pl.trail[0], a1 = pl.trail[pl.trail.length - 1];
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.06));
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n), fade = i / n;
    const k0 = (pl.reach || 28) / 28;
    for (let r = Math.round(10 * k0); r <= Math.round(19 * k0); r++) {
      lc.globalAlpha = (r > 15 * k0 ? 0.75 : 0.35) * (0.3 + 0.7 * fade);
      lc.fillStyle = r > 17 * k0 ? '#ffffff' : '#dfe9f5';
      lc.fillRect(Math.round(sx + pl.facing * Math.sin(a) * r), Math.round(sy - Math.cos(a) * r), 1, 1);
    }
  }
  lc.globalAlpha = 1;
}
function enemyPose(e) {
  const walk = e.onGround && Math.abs(e.vx) > 4;
  if (e.type === 'zombie') {
    const legs = !e.onGround ? 'jump' : walk ? WALK[Math.floor(e.t * 6) % 4] : 'idle';
    return { body: SPR.zBody, legs: SPR.zLegs[legs], back: { ang: 1.72 + Math.sin(e.t * 4 + 1) * 0.06, len: 7, sleeve: ZC.R, hand: ZC.S, sl: 2 }, front: { ang: 1.5 + Math.sin(e.t * 4) * 0.06, len: 7, sleeve: ZC.r, hand: ZC.s, sl: 2 }, flash: e.flash > 0 };
  }
  const legs = !e.onGround ? 'jump' : walk ? WALK[Math.floor(e.t * 7) % 4] : 'idle';
  if (e.type === 'archer') {
    const aiming = e.state === 'aim', a = e.aim ?? 2.3;
    return { body: SPR.skBody, legs: SPR.skLegs[legs], head: { img: SPR.aHood, oy: 0 }, back: { ang: aiming ? a : 2.9, len: aiming ? 3 : 5, sleeve: SKC.O, hand: SKC.O, sl: 9 }, front: { ang: a, len: 6, sleeve: SKC.o, hand: SKC.o, sl: 9, item: { img: SPR.bow, ang: a - Math.PI / 2, px: 2, py: 6 } }, flash: e.flash > 0 };
  }
  if (e.type === 'guard') {
    const up = e.state === 'walk', bx = OX, by = OY;
    return { body: SPR.skBody, legs: SPR.skLegs[legs], head: { img: SPR.gHelm, oy: -1 }, shield: up ? { img: SPR.gShield.side, cx: bx + 13.5, cy: by + 10.5, top: true } : { img: SPR.gShield.face, cx: bx - 0.5, cy: by + 14, top: false }, back: { ang: up ? 1.6 : 2.9, len: 5, sleeve: SKC.O, hand: SKC.O, sl: 9 }, front: { ang: 1.75, len: 6, sleeve: SKC.o, hand: SKC.o, sl: 9, item: { img: SPR.spear, ang: Math.PI / 2, px: 1.5, py: e.reach ?? 12 } }, flash: e.flash > 0 };
  }
  return { body: SPR.skBody, legs: SPR.skLegs[legs], back: { ang: 2.9, len: 5, sleeve: SKC.O, hand: SKC.O, sl: 9 }, front: { ang: e.arm, len: 6, sleeve: SKC.o, hand: SKC.o, sl: 9, item: { img: SPR.swordSk, ang: e.sAng } }, flash: e.flash > 0 };
}
function drawEnemy(e, cx, cy) {
  const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
  if (fx < -40 || fx > VW + 40 || fy < -40 || fy > VH + 60) return;
  const fl = e.flash > 0;
  if (DRAW_E[e.type]) { DRAW_E[e.type](e, fx, fy, fl); return; }
  if (e.type === 'slime') {
    const set = SPR.slime[e.variant]; let w = 14, h = 11;
    if (e.onGround) { if (e.hop < 0.22 && e.stun <= 0) { w = 16; h = 9; } else if (Math.sin(e.t * 6) > 0.6) { w = 15; h = 10; } }
    else if (e.vy < 0) { w = 12; h = 13; } else { w = 13; h = 12; }
    lc.drawImage(e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l), fx - (w >> 1), fy - h + 1, w, h);
  } else if (e.type === 'bat') {
    const set = SPR.bat[Math.floor(e.t * 11) % 2];
    lc.drawImage(e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l), fx - 8, fy - 9);
  } else if (e.type === 'lurker') {
    const set = SPR.lurk[Math.floor(e.t * 4) % 2], bob = Math.round(Math.sin(e.t * 2.2) * 1.5);
    lc.drawImage(e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l), fx - 8, fy - 14 + bob);
  } else if (e.type === 'ghost') {
    const set = SPR.ghost[Math.floor(e.t * 5) % 2], bob = Math.round(Math.sin(e.t * 2.4) * 1.5);
    lc.globalAlpha = 0.16 + (e.vis || 0) * 0.74;
    lc.drawImage(e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l), fx - 7, fy - 16 + bob);
    lc.globalAlpha = 1;
  } else if (e.type === 'skull') {
    const set = SPR.skull[Math.floor(e.t * 9) % 2], j = e.state === 'shake' ? Math.round(Math.sin(e.t * 70)) : 0;
    lc.drawImage(e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l), fx - 6 + j, fy - 11);
  } else if (e.boss) { compose(enemyPose(e)); drawComposite(fx, fy, e.facing, 2); }
  else { compose(enemyPose(e)); drawComposite(fx, fy, e.facing); }
}
function drawEnemyUI(e, cx, cy) {
  const fx = Math.round(e.x + e.w / 2) - cx, top = Math.round(e.y) - cy;
  if (fx < -40 || fx > VW + 40) return;
  if (e.showHp > 0 && !e.boss && !(e.type === 'ghost' && e.vis < 0.4)) { const bw = 14, x0 = fx - 7, y0 = top - 6; lc.fillStyle = '#140c10'; lc.fillRect(x0 - 1, y0 - 1, bw + 2, 4); lc.fillStyle = '#4a1418'; lc.fillRect(x0, y0, bw, 2); lc.fillStyle = e.parried > 0 ? '#ffb070' : '#e04848'; lc.fillRect(x0, y0, Math.max(1, Math.ceil(bw * e.hp / e.maxHp)), 2); }
  if (e.stun > 0.4) { for (let i = 0; i < 3; i++) { const a = gameTime * 6 + i * 2.1; lc.fillStyle = i === 0 ? '#fff6b0' : '#ffd23f'; lc.fillRect(Math.round(fx + Math.cos(a) * 6), Math.round(top - 9 + Math.sin(a) * 2), 1, 1); } }
  const warn = WARN_E[e.type] ? WARN_E[e.type](e) : (e.type === 'skeleton' || e.type === 'guard') && e.state === 'wind' || e.type === 'archer' && e.state === 'aim' || e.type === 'skull' && e.state === 'shake' || e.boss && (e.state === 'wind' || e.state === 'crouch' || e.state === 'cast');
  if (warn) { const y0 = top - (e.boss ? 18 : 13); lc.fillStyle = '#140c10'; lc.fillRect(fx - 2, y0 - 1, 4, 8); lc.fillStyle = '#ff4a3a'; lc.fillRect(fx - 1, y0, 2, 4); lc.fillRect(fx - 1, y0 + 5, 2, 1); }
}
function drawEyes(e, cx, cy) {
  const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
  if (fx < -20 || fx > VW + 20 || fy < -20 || fy > VH + 30) return;
  if (EYES_E[e.type]) { EYES_E[e.type](e, fx, fy); lc.globalAlpha = 1; return; }
  if (e.type === 'bat') { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx - 6, fy - 10); lc.globalAlpha = 1; }
  else if (e.type === 'lurker') { const bob = Math.round(Math.sin(e.t * 2.2) * 1.5); lc.globalAlpha = e.charging ? 0.9 : 0.45; lc.drawImage(e.charging ? SPR.glow.orb : SPR.glow.eye, fx - (e.charging ? 11 : 6), fy - 7 + bob - (e.charging ? 11 : 6)); lc.globalAlpha = 1; }
  else if (e.type === 'ghost') { lc.globalAlpha = (e.vis || 0) * 0.8; lc.drawImage(SPR.glow.eyeC, fx - 7, fy - 18 + Math.round(Math.sin(e.t * 2.4) * 1.5)); lc.globalAlpha = 1; }
  else if (e.type === 'skull') { lc.globalAlpha = e.state === 'shake' || e.state === 'dash' ? 0.9 : 0.55; lc.drawImage(SPR.glow.fire, fx - 11, fy - 15); lc.globalAlpha = 1; }
  else if ((e.type === 'archer' && e.state === 'aim') || (e.type === 'guard' && e.state === 'wind')) { lc.globalAlpha = 0.7; lc.drawImage(SPR.glow.eye, fx + e.facing * 2 - 6, fy - 25); lc.globalAlpha = 1; }
  else if (e.type === 'skeleton' && e.state === 'wind') { lc.globalAlpha = 0.7; lc.drawImage(SPR.glow.eye, fx + e.facing * 2 - 6, fy - 25); lc.globalAlpha = 1; }
  else if (e.type === 'zombie') { lc.globalAlpha = 0.3; lc.drawImage(SPR.glow.eye, fx + e.facing * 2 - 6, fy - 24); lc.globalAlpha = 1; }
  else if (e.boss) {
    lc.globalAlpha = 0.6 + Math.sin(gameTime * 5) * 0.15; lc.drawImage(SPR.glow.eyeY, fx + e.facing * 3 - 6, fy - 42);
    if (e.charging) { lc.globalAlpha = 0.85; lc.drawImage(SPR.glow.fire, fx + e.facing * 8 - 11, fy - 44); }
    lc.globalAlpha = 1;
  }
}
const CRACK = [[5, 5], [6, 6], [4, 4], [7, 5], [5, 7], [8, 4], [3, 6], [6, 8], [8, 8], [3, 3], [9, 3], [2, 7], [7, 9], [9, 6], [2, 2], [10, 9], [4, 9], [9, 10], [1, 5], [6, 2], [10, 2], [2, 10], [5, 1], [11, 6]];
function drawWorldUI(cx, cy) {
  const tg = pl.target; if (!tg || pl.dead || state !== 'play') return;
  const x = tg.tx * T - cx, y = tg.ty * T - cy;
  const hh = heldBag();
  if (hh && hh.it.deco && tg.inReach && canPlaceDeco(tg.tx, tg.ty)) { lc.globalAlpha = 0.55; lc.drawImage(SPR.deco[hh.it.deco], x, y); lc.globalAlpha = 1; }
  if (hh && hh.it.block && tg.inReach) {
    const t0 = tileAt(tg.tx, tg.ty);
    if (canPlace(tg.tx, tg.ty)) { lc.globalAlpha = 0.5 + Math.sin(gameTime * 6) * 0.1; lc.drawImage(SPR.block[hh.it.block], x, y); lc.globalAlpha = 0.6; lc.strokeStyle = '#fff'; lc.lineWidth = 1; lc.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1); lc.globalAlpha = 1; }
    else if (t0 === AIR || t0 === TUFT || t0 === FLOWER) { lc.globalAlpha = 0.55; lc.strokeStyle = '#ff6a5a'; lc.lineWidth = 1; lc.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1); lc.globalAlpha = 1; }
  }
  if (tg.dig && tg.inReach && tg.pick) { lc.globalAlpha = mouse.l ? 0.85 : 0.35; lc.strokeStyle = '#fff'; lc.lineWidth = 1; lc.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1); lc.globalAlpha = 1; }
  if (pl.digX === tg.tx && pl.digY === tg.ty && pl.digT > 0) { const t = tileAt(tg.tx, tg.ty); const n = Math.floor(CRACK.length * Math.min(1, pl.digT / DIG[t])); lc.fillStyle = '#0d0a10'; for (let i = 0; i < n; i++) lc.fillRect(x + CRACK[i][0], y + CRACK[i][1], 1, 1); }
}
// contorno + preenchimento de um texto da tela (sc), pintados uma vez numa figura pequena e reaproveitados: os números que
// voam e as etiquetas dos bichos eram contornados (strokeText) de novo em todo quadro, o que pesava num golpe em muitos
// bichos (2026-10-12). Usa o textAlign/textBaseline/lineJoin que o sc tiver na hora, como antes.
const TXT = new Map(), txtCtx = mk(1, 1).getContext('2d');
if (document.fonts) document.fonts.addEventListener('loadingdone', () => TXT.clear());
function outlinedText(text, x, y, font, lw, stroke, fill) {
  const al = sc.textAlign, bl = sc.textBaseline, lj = sc.lineJoin, k = font + '|' + lw + '|' + stroke + '|' + fill + '|' + al + bl + lj + '|' + text;
  let c = TXT.get(k);
  if (!c) {
    const m = txtCtx; m.font = font; m.textAlign = al; m.textBaseline = bl;
    const q = m.measureText(text), pad = Math.ceil(lw / 2) + 2;
    const L = Math.ceil(q.actualBoundingBoxLeft) + pad, R = Math.ceil(q.actualBoundingBoxRight) + pad, A = Math.ceil(q.actualBoundingBoxAscent) + pad, D = Math.ceil(q.actualBoundingBoxDescent) + pad;
    const cv = mk(Math.max(1, L + R), Math.max(1, A + D)), x2 = cv.getContext('2d');
    x2.font = font; x2.textAlign = al; x2.textBaseline = bl; x2.lineJoin = lj; x2.lineWidth = lw; x2.strokeStyle = stroke; x2.strokeText(text, L, A); x2.fillStyle = fill; x2.fillText(text, L, A);
    c = { cv, L, A }; if (TXT.size > 400) TXT.clear(); TXT.set(k, c);
  }
  sc.drawImage(c.cv, Math.round(x) - c.L, Math.round(y) - c.A);
}
function render() {
  const cx = Math.round(cam.x + shk.x), cy = Math.round(cam.y + shk.y);
  lc.imageSmoothingEnabled = false;
  drawSky(cx, cy);
  drawVillage(cx, cy);
  drawChunks(cx, cy);
  drawTrees(cx, cy);
  drawNpcs(cx, cy);
  for (const e of enemies) drawEnemy(e, cx, cy);
  runHooks(HOOK.drawWorld, cx, cy);
  drawPlayer(cx, cy);
  drawSmear(cx, cy);
  for (const p of parts) if (!p.glow) { lc.globalAlpha = p.smoke ? Math.min(0.85, p.life / p.max * 1.4) : Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; const sz = p.smoke ? p.size + Math.floor((1 - p.life / p.max) * 2) : p.size; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, sz, sz); }
  lc.globalAlpha = 1;
  // light
  computeLight(cx, cy);
  lc.imageSmoothingEnabled = true; lc.drawImage(lightCv, LX0 * T - cx, LY0 * T - cy, LW * T, LH * T); lc.imageSmoothingEnabled = false;
  // glows (additive)
  lc.globalCompositeOperation = 'lighter';
  const fl = 0.85 + Math.sin(gameTime * 13) * 0.08 + Math.sin(gameTime * 31) * 0.05;
  for (let i = 0; i < emitters.length; i += 3) {
    const gx = emitters[i], gy = emitters[i + 1], t = emitters[i + 2], x = gx * T + T / 2 - cx, y = gy * T + T / 2 - cy;
    if (t === TORCH) { lc.globalAlpha = 0.32 * fl; lc.drawImage(SPR.glow.torch, x - 34, y - 36); }
    else if (t === CANDLE) { lc.globalAlpha = 0.26 * fl; lc.drawImage(SPR.glow.torch, x - 34, y - 40); }
    else if (t === ALTAR) { lc.globalAlpha = 0.3 + Math.sin(gameTime * 2.5) * 0.08; lc.drawImage(SPR.glow.altar, x - 20, y - 22); }
    else if (t === SHROOM) { lc.globalAlpha = 0.22; lc.drawImage(SPR.glow.shroom, x - 16, y - 13); }
    else if (t === CRYSTAL) { lc.globalAlpha = 0.16 + Math.sin(gameTime * 2 + gx) * 0.05; lc.drawImage(SPR.glow.crystal, x - 16, y - 16); }
    else if (t === LAVA && tileAt(gx, gy - 1) !== LAVA && (gx & 1)) { lc.globalAlpha = 0.28; lc.drawImage(SPR.glow.lava, x - 22, y - 28); }
  }
  for (const o of projs) { if (o.kind === 'arrow') continue; lc.globalAlpha = 0.85; lc.drawImage(o.kind === 'fire' && o.owner === 'enemy' ? SPR.glow.fire : o.owner === 'enemy' ? SPR.glow.orb : SPR.glow.orbP, Math.round(o.x) - cx - 11, Math.round(o.y) - cy - 11); }
  for (const o of orbs) { lc.globalAlpha = 0.7; lc.drawImage(SPR.glow.xp, Math.round(o.x) - cx - 6, Math.round(o.y) - cy - 6); }
  for (const e of enemies) drawEyes(e, cx, cy);
  drawPropGlows(cx, cy, fl);
  runHooks(HOOK.drawGlow, cx, cy); lc.globalAlpha = 1; lc.globalCompositeOperation = 'lighter';
  if (levelFlash > 0 && !pl.dead) { lc.globalAlpha = levelFlash * 0.6; lc.drawImage(SPR.glow.level, Math.round(pl.x + pl.w / 2) - cx - 46, Math.round(pl.y + pl.h / 2) - cy - 46); }
  for (const p of parts) if (p.glow) { lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.6; lc.drawImage(SPR.glow.spark, Math.round(p.x) - cx - 6, Math.round(p.y) - cy - 6); }
  lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
  // bright pixels on top of the darkness
  // candle flames and the altar's ember on top of the dark
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== CANDLE && t !== ALTAR) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === ALTAR) { lc.fillStyle = Math.sin(gameTime * 4 + gx) > 0 ? '#ffc0a0' : '#ff6a4a'; lc.fillRect(x + 5, y + 4, 2, 1); continue; }
    const v = (hash2(gx, gy, seed) * 2) | 0, xs = v ? [5] : [1, 5, 9], top = v ? 1 : 0;
    for (let k = 0; k < xs.length; k++) { const f = Math.floor(gameTime * 8 + gx * 3 + k * 5) % 3; lc.fillStyle = '#ff7a1a'; lc.fillRect(x + xs[k], y + top - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#fff3b0'; lc.fillRect(x + xs[k], y + top + 1, 1, 1); }
  }
  for (let i = 0; i < emitters.length; i += 3) {
    if (emitters[i + 2] !== TORCH) continue;
    const x = emitters[i] * T - cx, y = emitters[i + 1] * T - cy, f = Math.floor(gameTime * 9 + emitters[i] * 3) % 3;
    lc.fillStyle = '#c0420c'; lc.fillRect(x + 4, y + 3, 4, 3);
    lc.fillStyle = '#ff7a1a'; lc.fillRect(x + 4 + (f === 2 ? 1 : 0), y + 2, 3, 3); lc.fillRect(x + 5, y + 1 - (f === 1 ? 1 : 0), 2, 2);
    lc.fillStyle = '#ffc23d'; lc.fillRect(x + 5, y + 3, 2, 2); lc.fillStyle = '#fff3b0'; lc.fillRect(x + 5 + (f === 0 ? 1 : 0), y + 4, 1, 1);
  }
  drawPropFlames(cx, cy);
  for (const p of parts) if (p.glow) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size, p.size); }
  lc.globalAlpha = 1;
  runHooks(HOOK.drawTop, cx, cy); lc.globalAlpha = 1;
  for (const o of projs) {
    if (o.kind === 'arrow') { const sp = Math.hypot(o.vx, o.vy) || 1, ux = o.vx / sp, uy = o.vy / sp, ax = o.x - cx, ay = o.y - cy; for (let k = 0; k < 8; k++) { lc.fillStyle = k < 2 ? '#c8ced8' : k > 5 ? '#e8e0cc' : '#8a6a44'; lc.fillRect(Math.round(ax - ux * k), Math.round(ay - uy * k), 1, 1); } continue; }
    const x = Math.round(o.x) - cx, y = Math.round(o.y) - cy; lc.fillStyle = '#140c18'; lc.fillRect(x - 2, y - 3, 5, 7); lc.fillRect(x - 3, y - 2, 7, 5); lc.fillStyle = o.kind === 'fire' && o.owner === 'enemy' ? '#ff6a1a' : o.owner === 'enemy' ? '#b45cff' : '#ffc23d'; lc.fillRect(x - 2, y - 2, 5, 5); lc.fillStyle = o.kind === 'fire' && o.owner === 'enemy' ? '#fff0b0' : o.owner === 'enemy' ? '#f0d8ff' : '#fff6c8'; lc.fillRect(x - 1, y - 1, 2, 2); }
  for (const o of orbs) { const x = Math.round(o.x) - cx, y = Math.round(o.y) - cy; lc.fillStyle = '#e8ff9a'; lc.fillRect(x - 1, y - 1, 2, 2); lc.fillStyle = '#7fbf3a'; lc.fillRect(x, y, 1, 1); }
  // dropped items stay visible in the dark
  for (const o of loot) {
    const ic = dropSprite(o.id), x = Math.round(o.x) - cx, y = Math.round(o.y) - cy;
    if (x < -20 || x > VW + 20 || y < -20 || y > VH + 20) continue;
    const r = o.item ? itemRar(o.item) : ITEMS[o.id].rar, bob = o.rest ? -Math.round((Math.sin(gameTime * 3 + o.x * 0.7) + 1) * 0.5) : 0;
    if (r > 0) { const g = SPR.glow.rar[r]; lc.globalCompositeOperation = 'lighter'; lc.globalAlpha = 0.4 + 0.15 * Math.sin(gameTime * 4 + o.x); lc.drawImage(g, x - g.width / 2, y - ic.height / 2 - g.height / 2 + bob); lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1; }
    lc.drawImage(ic, x - (ic.width >> 1), y - ic.height + 1 + bob);
  }
  drawVillageGlow(cx, cy);
  for (const e of enemies) drawEnemyUI(e, cx, cy);
  drawWorldUI(cx, cy);
  // upscale
  sc.imageSmoothingEnabled = false;
  sc.drawImage(low, 0, 0, VW * S, VH * S);
  // floating text at screen resolution
  if (texts.length) {
    sc.textAlign = 'center'; sc.textBaseline = 'middle'; sc.lineJoin = 'round';
    for (const t of texts) {
      const a = Math.min(1, t.life / t.max * 2.5), fs = Math.round(S * 4.1 * t.size * (1 + Math.max(0, t.life - t.max + 0.12) * 3));
      sc.globalAlpha = a;
      outlinedText(t.text, (t.x - cx) * S, (t.y - cy) * S, `800 ${fs}px "Rubik", system-ui, sans-serif`, Math.max(3, S * 1.25), '#120d12', t.col);
    }
    sc.globalAlpha = 1;
  }
  drawNpcLabels(cx, cy);
  // enemy level tags
  sc.font = `600 ${Math.round(S * 3.1)}px "Rubik", system-ui, sans-serif`; sc.textAlign = 'center';
  if (mapOpen && state === 'play') drawMap();
  for (const e of enemies) if (e.showHp > 0 && !e.boss && !(e.type === 'ghost' && e.vis < 0.4)) outlinedText(`${ET[e.type].name} · Nv ${e.lvl}`, (e.x + e.w / 2 - cx) * S, (e.y - cy - 9) * S, sc.font, Math.max(2, S * 0.8), '#120d12', '#efe2c4');
}
