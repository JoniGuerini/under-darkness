'use strict';

/* ================= built sprites ================= */
const SPR = {};
function buildSprites() {
  buildVillageArt(); buildNpcLooks();
  SPR.pBody = fromRows(PBODY, PC); SPR.zBody = fromRows(ZBODY, ZC); SPR.skBody = fromRows(SKBODY, SKC);
  SPR.pLegs = {}; SPR.zLegs = {}; SPR.skLegs = {};
  for (const k in LEGS) { SPR.pLegs[k] = fromRows(LEGS[k], PC); SPR.zLegs[k] = fromRows(LEGS[k], ZC); SPR.skLegs[k] = fromRows(LEGS[k], SKC); }
  SPR.sword = fromRows(SWORD, SWORD_P); SPR.swordSk = fromRows(SWORD, SWORD_SK);
  SPR.shieldFace = fromRows(SHIELD_FACE, SHIELD_PAL); SPR.shieldSide = fromRows(SHIELD_SIDE, SHIELD_PAL);
  SPR.slime = SLIME_PALS.map(p => set4(SLIME, p));
  SPR.ghost = [set4(ART_GHOST_A, ART_GHOST_A_P), set4(ART_GHOST_B, ART_GHOST_B_P)];
  SPR.skull = [set4(ART_SKULL_A, ART_SKULL_A_P), set4(ART_SKULL_B, ART_SKULL_B_P)];
  SPR.bow = fromRows(ART_BOW, ART_BOW_P); SPR.spear = fromRows(ART_SPEAR, ART_SPEAR_P);
  SPR.aHood = fromRows(HOOD, { c: '#2e2a22', C: '#4a4434' }); SPR.gHelm = fromRows(HELM, { m: '#5a5e68', M: '#8a909a' });
  SPR.gShield = { face: fromRows(SHIELD_FACE, SH.iron), side: fromRows(SHIELD_SIDE, SH.iron) };
  SPR.deco = { [CANDLE]: fromRows(ART_CANDLE, ART_CANDLE_P) };
  SPR.block = {}; for (const id in ITEMS) { const t = ITEMS[id].block; if (t && MAT[t] && !SPR.block[t]) SPR.block[t] = blockCanvas(t, T, 2, 24, 36); }
  SPR.bat = [set4(BAT_A, BAT_PAL), set4(BAT_B, BAT_PAL)];
  SPR.lurk = [set4(LURK_A, LURK_PAL), set4(LURK_B, LURK_PAL)];
  SPR.glow = { chest: glow(14, '#ffd27a'), rar: [null, glow(8, '#7fd36a'), glow(9, '#62a8ff'), glow(10, '#c27bff'), glow(11, '#ff9a3c')], torch: glow(34, '#ff9a3c'), shroom: glow(16, '#4fe0f0'), crystal: glow(16, '#b77bff'), lava: glow(22, '#ff6a1a'), orb: glow(11, '#c070ff'), orbP: glow(11, '#ffd060'), xp: glow(6, '#c8ff6a'), eye: glow(6, '#ff3a3a'), level: glow(46, '#ffd27a'), spark: glow(6, '#ffe2a0'), fire: glow(11, '#ff6a1a'), altar: glow(20, '#ff3a2a'), eyeY: glow(6, '#ffd23a'), eyeC: glow(7, '#7fe8ff') };
}

/* humanoid compositor: body + arms + held items, then auto-outlined */
const CW = 64, CHT = 64, OX = 26, OY = 26;
let comp, cctx;
function armDraw(c, sx, sy, A) {
  const dx = Math.sin(A.ang), dy = -Math.cos(A.ang);
  for (let t = 0; t <= A.len; t++) { c.fillStyle = t < A.sl ? A.sleeve : A.hand; c.fillRect(Math.round(sx + dx * t - 1), Math.round(sy + dy * t - 1), 2, 2); }
  return [sx + dx * A.len, sy + dy * A.len];
}
// anything that is not a drawable picture is skipped, and the transform always comes back: a throw between save and
// restore used to leave the shared compositor rotated for good (the hero froze and every NPC showed his last frame)
function rotDraw(c, img, x, y, px, py, ang) {
  if (!img || !(img.width > 0 && img.height > 0)) return;
  c.save(); try { c.translate(Math.round(x), Math.round(y)); c.rotate(ang); c.drawImage(img, -px, -py); } finally { c.restore(); }
}
let compRaw, crctx, compSil, csctx;
function compose(P) {
  if (!compRaw) { compRaw = mk(CW, CHT); crctx = compRaw.getContext('2d'); crctx.imageSmoothingEnabled = false; compSil = mk(CW, CHT); csctx = compSil.getContext('2d'); }
  const c = crctx; c.clearRect(0, 0, CW, CHT);
  const bx = OX, by = OY;
  // a body can sit off the hero's grid (wider, taller or shorter villagers, js/117): ox/oy move body, head and shoulders, never the feet
  const ox = P.ox || 0, oy = P.oy || 0, sb = P.sb || [4.5, 10.5], sf = P.sf || [7.5, 10.5];
  const arm = A => A.draw || (A.hero ? heroArmDraw : armDraw);
  if (P.shield && !P.shield.top) c.drawImage(P.shield.img, Math.round(P.shield.cx - P.shield.img.width / 2), Math.round(P.shield.cy - P.shield.img.height / 2));
  if (P.back) { const h = arm(P.back)(c, bx + ox + sb[0], by + oy + sb[1], P.back); if (P.back.item) rotDraw(c, P.back.item.img, h[0], h[1], 2.5, 11, P.back.item.ang); }
  c.drawImage(P.legs, bx, by + 18); c.drawImage(P.body, bx + ox, by + oy);
  if (P.head) c.drawImage(P.head.img, bx + ox, by + oy + P.head.oy);
  if (P.front) { const h = arm(P.front)(c, bx + ox + sf[0], by + oy + sf[1], P.front), it = P.front.item; if (it) rotDraw(c, it.img, h[0], h[1], it.px || 2.5, it.py || 11, it.ang); }
  if (P.shield && P.shield.top) c.drawImage(P.shield.img, Math.round(P.shield.cx - P.shield.img.width / 2), Math.round(P.shield.cy - P.shield.img.height / 2));
  // 1px dark outline: the silhouette shifted four ways, drawn under the figure (no pixel read-back)
  const o = csctx; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, CW, CHT);
  o.drawImage(compRaw, -1, 0); o.drawImage(compRaw, 1, 0); o.drawImage(compRaw, 0, -1); o.drawImage(compRaw, 0, 1);
  o.globalCompositeOperation = 'source-in'; o.fillStyle = '#140d14'; o.fillRect(0, 0, CW, CHT); o.globalCompositeOperation = 'source-over';
  cctx.clearRect(0, 0, CW, CHT); cctx.drawImage(compSil, 0, 0); cctx.drawImage(compRaw, 0, 0);
  if (P.flash) { const c = cctx; c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.85; c.fillStyle = '#fff'; c.fillRect(0, 0, CW, CHT); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  return comp;
}
function drawComposite(feetX, feetY, facing, s = 1) {
  if (facing < 0) { lc.save(); lc.translate(feetX, 0); lc.scale(-1, 1); lc.drawImage(comp, -CW / 2 * s, feetY - (OY + 22) * s, CW * s, CHT * s); lc.restore(); }
  else lc.drawImage(comp, feetX - CW / 2 * s, feetY - (OY + 22) * s, CW * s, CHT * s);
}
