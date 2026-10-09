'use strict';

/* ================= themed villager screens: each trade dresses its own windows ================= */
// openTalk sets body[data-npc] to the villager's id and closeTalk clears it; css/temas-npc.css does the rest.
// The textures are painted here once, pixel by pixel on 6-step ramps like the ground and the houses.
function setNpcTheme(n) { if (n) document.body.dataset.npc = n.id; else delete document.body.dataset.npc; }
// a layer for the smith's rising sparks in each villager window; css shows it only for the themes that use it
for (const sel of ['#talk .card', '#shop .vendor', '#forge .forgep']) { const p = document.querySelector(sel); if (p) { const e = document.createElement('span'); e.className = 'npc-embers'; e.setAttribute('aria-hidden', 'true'); e.innerHTML = '<i></i><i></i>'; p.appendChild(e); } }

// Grimaldo's windows are built from his own shed: the same painters and ramps as bForge in 17-vilarejo.js
(function makeSmithTextures() {
  const url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const T2 = (px, py, s) => hash2(px, py, s) - 0.5;
  // noise that repeats every n pixels, so a strip tiles without a seam (pn wraps at 240 / L cells)
  const wrapN = (px, py, n, fx, fy, s) => pn(px * 240 / n, py * 4, fx, fy, s) - 0.5;
  // the frame is the shed itself: shingled lean-to roof on top, squared posts at the sides, a sill on packed earth below
  const FW = 62, FH = 64, TOP = 16, SIDE = 6, BOT = 8, MID = FW - SIDE * 2;
  const frame = url(FW, FH, x => {
    for (let py = 0; py < FH; py++) for (let px = 0; px < FW; px++) {
      const wx = ((px - SIDE) % MID + MID) % MID;   // x folded onto the repeating middle
      if (py < TOP) {
        if (py === 0) { vPix(x, RAMP.beam, 1 + (hash2(wx, 0, 181) < 0.3 ? 1 : 0), px, py); continue; }
        if (py <= 9) {
          const j = py, row = (j - 1) / 3 | 0, lj = (j - 1) % 3, off = row * 2 + (row === 1 ? 1 : 0), sx = Math.floor((wx + off) / 5), li = (wx + off) % 5;
          const tone = (hash2(sx % 10, row, 184) - 0.5) * 1.1;
          let v = lj === 0 ? 1.4 : lj === 1 ? 3.1 : 3.7;
          if (li === 0) v = 0.8; else if (li === 1) v += 0.4;
          v += tone + T2(wx, py, 186) * 0.45 + wrapN(wx, py, MID, 10, 30, 187) * 0.6;
          if (row === 2 && lj === 2 && hash2(wx, py, 188) < 0.14) { x.fillStyle = hash2(wx, py, 189) < 0.5 ? '#3f5a24' : '#56742e'; x.fillRect(px, py, 1, 1); continue; }
          if (px === 0 || px === FW - 1) v = 0.5;
          vPix(x, RAMP.shingle, v, px, py); continue;
        }
        if (py <= 11) { vPix(x, RAMP.beam, (py === 10 ? 4 : 1.6) + wrapN(wx, py, MID, 6, 60, 182) * 1.2 + T2(wx, py, 183) * 0.3, px, py); continue; }
        if (py === 12) { vPix(x, RAMP.beam, hash2(wx, 1, 190) < 0.35 ? 0.8 : 0.2, px, py); continue; }
      }
      if (px < SIDE || px >= FW - SIDE) {   // posts, lit on the left, deep in shadow on the right
        const i = px < SIDE ? px : px - (FW - SIDE);
        if (i === 0 || i === SIDE - 1) { vPix(x, RAMP.beam, 0.2, px, py); continue; }
        if (py >= FH - 3) { vPix(x, RAMP.stone, (py === FH - 3 ? 4 : 2.4) + T2(px, py, 205) * 0.8, px, py); continue; }
        let v = 3 + (pn(px * 4, py * 240 / FH, 160, 12, px < SIDE ? 191 : 192) - 0.5) * 1.4 + T2(px, py, 193) * 0.3;
        if (i === 1) v += 1.1; else if (i === SIDE - 2) v = 0.6; else if (i === SIDE - 3) v -= 0.6;
        vPix(x, RAMP.beam, v, px, py); continue;
      }
      if (py < TOP) { vPix(x, RAMP.beam, (py === 13 ? 3.8 : py === 15 ? 0.5 : 2.4) + wrapN(wx, py, MID, 6, 60, 194) * 1.1 + T2(wx, py, 195) * 0.3, px, py); continue; }   // tie beam
      if (py >= FH - BOT) {
        const j = py - (FH - BOT);
        if (j < 4) { vPix(x, RAMP.beam, (j === 0 ? 3.9 : j === 3 ? 0.6 : 2.5) + wrapN(wx, py, MID, 6, 60, 196) * 1.1 + T2(wx, py, 197) * 0.3, px, py); continue; }   // sill
        vPix(x, RAMP.dirt, 2.4 + wrapN(wx, py, MID, 10, 60, 151) * 1.6 + T2(wx, py, 152) * 0.8 - (j === 4 ? 0.9 : 0) + (hash2(wx, py, 153) < 0.06 ? 1.6 : 0), px, py); continue;
      }
      x.clearRect(px, py, 1, 1);
    }
  });
  // a small timber frame for buttons and boxes: the same squared beams, nailed at the corners
  const frameSm = url(16, 16, x => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const r = Math.min(px, py, 15 - px, 15 - py); if (r >= 5) continue;
      const lit = py === r || px === r;
      let v; if (r === 0 || r === 4) v = 0.2; else if (r === 1) v = lit ? 4.2 : 1; else v = 2.7 + T2(px, py, 401) * 0.7 - (lit ? 0 : 0.6);
      vPix(x, RAMP.beam, v, px, py);
    }
    for (const [X, Y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { vPix(x, RAMP.iron, 4.6, X, Y); vPix(x, RAMP.iron, 1, X + 1, Y + 1); }
  });
  // the inside of the shed: upright boards, darker at the top under the roof
  const wall = url(60, 60, x => {
    const ws = []; let sum = 0; for (let k = 0; sum < 60; k++) { const w = 5 + (hash2(k, 0, 141) < 0.4 ? 1 : 0); ws.push(Math.min(w, 60 - sum)); sum += w; }
    let bx = 0; ws.forEach((bw, k) => {
      const tone = (hash2(k, 1, 141) - 0.5) * 0.8, ky = 4 + Math.floor(hash2(k, 2, 141) * 52), knot = hash2(k, 3, 141) < 0.18;
      for (let py = 0; py < 60; py++) for (let i = 0; i < bw; i++) {
        const px = bx + i;
        let v = i === bw - 1 ? 0.35 : 2.75 + tone + (pn(px * 4, py * 4, 140, 9, 145) - 0.5) * 1.5 + T2(px, py, 146) * 0.35;
        if (i === 0) v += 0.55; else if (i === bw - 2) v -= 0.4;
        if (knot && i > 0 && i < bw - 1 && Math.abs(py - ky) + Math.abs(i - (bw >> 1)) * 0.8 < 1.3) v -= 1.6;
        vPix(x, RAMP.wall, v, px, py);
      }
      bx += bw;
    });
  });
  // a rack board, like the one the swords hang from: horizontal grain, tiles every 60 pixels
  const board = url(60, 14, x => {
    for (let py = 0; py < 14; py++) for (let px = 0; px < 60; px++) {
      let v = 3 + (pn(px * 4, py * 240 / 14, 12, 160, 161) - 0.5) * 1.4 + T2(px, py, 162) * 0.3;
      if (py === 0) v += 1.1; else if (py === 13) v = 0.4; else if (py === 12) v -= 0.7;
      if (hash2(py >> 0, px >> 3, 163) < 0.05) v -= 1.2;
      vPix(x, RAMP.beam, v, px, py);
    }
  });
  // the furnace wall: the very same fieldstone, warmed near the fire on the left and sooted at the top
  const furnaceStone = url(180, 100, x => {
    const heat = (px, py) => { const d = Math.hypot((px - 26) * 0.7, py - 54); return d < 18 ? 0.9 : d < 34 ? (34 - d) / 16 * 0.9 : 0; };
    vMasonry(x, 0, 0, 180, 100, 203, { heat, soot: (px, py) => (py < 10 ? (10 - py) * 0.06 : 0) + 0.2 });
  });
  // sparks: a sparse scatter of glowing pixels, some with a short tail, scrolled upward by the css
  const embers = url(160, 240, x => {
    const cols = ['#fff0a8', '#ffcf5a', '#ffb233', '#f2701a', '#c8420b'];
    for (let k = 0; k < 30; k++) {
      const X = Math.floor(hash2(k, 1, 551) * 160), Y = Math.floor(hash2(k, 2, 551) * 240), c = Math.floor(hash2(k, 3, 551) * 5);
      x.fillStyle = cols[c]; x.fillRect(X, Y, 1, 1); if (hash2(k, 4, 551) < 0.3) { x.fillStyle = cols[Math.min(4, c + 1)]; x.fillRect(X, Y + 1, 1, 1); }
    }
  });
  // the furnace mouth and the shop sign, cut straight out of the forge sprite
  const hut = bForge().c, crop = (sx, sy, w, h) => url(w, h, x => x.drawImage(hut, sx, sy, w, h, 0, 0, w, h));
  const mouth = crop(7, 42, 33, 36), sign = crop(112, 42, 13, 15);
  const R = document.documentElement.style;
  for (const [k, v] of Object.entries({ frame, 'frame-sm': frameSm, wall, board, stone: furnaceStone, mouth, sign, embers })) R.setProperty('--smith-' + k, `url(${v})`);
})();

// Caetano's windows are his stone house: slate roof with lichen, dressed blue stone at the corners with ivy climbing,
// the masonry wall inside lit by a candle, and his tasks written on the parchment of the book on the lectern
(function makeElderTextures() {
  const url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const T2 = (px, py, s) => hash2(px, py, s) - 0.5;
  const wrapN = (px, py, n, fx, fy, s) => pn(px * 240 / n, py * 4, fx, fy, s) - 0.5;
  const leaf = (x, px, py, v) => vPix(x, RAMP.leaf, v, px, py);
  const FW = 62, FH = 64, TOP = 16, SIDE = 6, BOT = 8, MID = FW - SIDE * 2;
  // ivy hangs on the left post and creeps along the sill: a smooth noise mask decides where the leaves are
  const ivy = (px, py, s) => pn(px * 240 / FW, py * 240 / FH, 6, 6, s);
  const frame = url(FW, FH, x => {
    for (let py = 0; py < FH; py++) for (let px = 0; px < FW; px++) {
      const wx = ((px - SIDE) % MID + MID) % MID;
      if (py < TOP) {
        if (py === 0) { vPix(x, RAMP.slate, 0.6, px, py); continue; }
        if (py <= 10) {   // three rows of slates, staggered, a little moss here and there
          const row = (py - 1) / 3.4 | 0, lj = (py - 1) - Math.round(row * 3.4), off = (row & 1) * 3, tx = Math.floor((wx + off) / 7), li = (wx + off) % 7;
          let v = (lj === 0 ? 1.3 : lj === 1 ? 4 : lj === 2 ? 3.2 : 2.5) + (hash2(tx, row, 701) - 0.5) * 1.3 + T2(wx, py, 702) * 0.5;
          if (li === 0) v = lj === 3 ? 0.5 : 1.1; else if (li === 1) v += 0.3;
          if (sn(wx * 240 / MID, py, 8, 30, 703) > 0.22 && lj > 0 && li > 0 && hash2(wx, py, 704) < 0.55) { x.fillStyle = hash2(wx, py, 705) < 0.5 ? '#4a5e2a' : '#62783a'; x.fillRect(px, py, 1, 1); continue; }
          if (px === 0 || px === FW - 1) v = 0.5;
          vPix(x, RAMP.slate, v, px, py); continue;
        }
        if (py === 11) { vPix(x, RAMP.slate, 0.3, px, py); continue; }   // the eave's shadow
        if (px >= SIDE && px < FW - SIDE || true) {   // a dressed stone lintel, cut in long blocks
          const j = py - 12, bk = Math.floor(wx / 15), li = wx % 15;
          let v = (j === 0 ? 4.4 : j === 3 ? 0.7 : 2.9) + (hash2(bk % 4, 7, 706) - 0.5) * 0.8 + T2(wx, py, 707) * 0.7 + wrapN(wx, py, MID, 20, 60, 708) * 0.6;
          if (li === 14) v = 0.6;
          vPix(x, RAMP.stoneBlue, v, px, py); continue;
        }
      }
      if (px < SIDE || px >= FW - SIDE) {   // corner quoins: big and small dressed blocks taking turns
        const left = px < SIDE, i = left ? px : px - (FW - SIDE), yy = py - TOP, bh = 8, blk = Math.floor(yy / bh), j = yy - blk * bh;
        if (left && py < FH - BOT && ivy(px, py, 711) > 0.58 && hash2(px, py, 712) < 0.75) { leaf(x, px, py, 2.4 + T2(px, py, 713) * 2.4 + (hash2(px, py, 714) < 0.15 ? 1.5 : 0)); continue; }
        if (py >= FH - BOT) { vPix(x, RAMP.stoneB, (py === FH - BOT ? 4 : 2.2) + T2(px, py, 715) * 0.8, px, py); continue; }
        if (i === 0 || i === SIDE - 1) { vPix(x, RAMP.stoneBlue, 0.3, px, py); continue; }
        let v = 3 + (hash2(blk, left ? 1 : 2, 716) - 0.5) * 1 + T2(px, py, 717) * 0.8;
        if (j === 0) v += 1.2; else if (j === bh - 1) v = 0.6; else if (j === bh - 2) v -= 0.8;
        if (i === 1) v += 0.7; else if (i === SIDE - 2) v -= 0.9;
        if (hash2(px, py, 718) < 0.05) v -= 1.2;
        vPix(x, (blk & 1) ? RAMP.stoneBlue : RAMP.stoneB, v, px, py); continue;
      }
      if (py >= FH - BOT) {   // a stone sill, then moss and ivy over the ground
        const j = py - (FH - BOT);
        if (j < 4) { vPix(x, RAMP.stoneB, (j === 0 ? 4.2 : j === 3 ? 0.6 : 2.6) + wrapN(wx, py, MID, 20, 60, 721) * 0.9 + T2(wx, py, 722) * 0.6, px, py); continue; }
        if (wrapN(wx, py, MID, 14, 60, 723) + 0.5 > 0.45 && hash2(wx, py, 724) < 0.8) { leaf(x, px, py, 2 + T2(wx, py, 725) * 2.6 - (j === 4 ? 0.8 : 0)); continue; }
        vPix(x, RAMP.dirt, 2.2 + wrapN(wx, py, MID, 10, 60, 726) * 1.4 + T2(wx, py, 727) * 0.8 - (j === 4 ? 0.9 : 0), px, py); continue;
      }
      x.clearRect(px, py, 1, 1);
    }
  });
  // small frame for boxes and buttons: a dressed stone border
  const frameSm = url(16, 16, x => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const r = Math.min(px, py, 15 - px, 15 - py); if (r >= 5) continue;
      const lit = py === r || px === r;
      let v; if (r === 0 || r === 4) v = 0.25; else if (r === 1) v = lit ? 4.4 : 1.1; else v = 2.8 + T2(px, py, 731) * 0.9 - (lit ? 0 : 0.7);
      vPix(x, RAMP.stoneBlue, v, px, py);
    }
  });
  // the wall inside: the same blue fieldstone as the house, big enough that it never repeats in a window
  const wall = url(360, 240, x => vMasonry(x, 0, 0, 360, 240, 741, { ramps: [RAMP.stoneBlue, RAMP.stoneB] }));
  // a slate slab for the plain buttons, tiles every 60 pixels
  const slab = url(60, 14, x => {
    for (let py = 0; py < 14; py++) for (let px = 0; px < 60; px++) {
      let v = 2.9 + wrapN(px, py * 17, 60, 20, 40, 751) * 1.2 + T2(px, py, 752) * 0.6;
      if (py === 0) v += 1.3; else if (py === 13) v = 0.4; else if (py === 12) v -= 0.8;
      if (hash2(px, py, 753) < 0.04) v -= 1.2;
      vPix(x, RAMP.slate, v + 0.6, px, py);
    }
  });
  // parchment from his book: mottled, foxed with age, tiles both ways
  const PARCH = ['#4a3a26', '#6e5a3c', '#9a8460', '#bfa87e', '#d9c79c', '#ece0bc'];
  const parch = url(120, 120, x => {
    for (let py = 0; py < 120; py++) for (let px = 0; px < 120; px++) {
      let v = 4.25 + (pn(px * 2, py * 2, 8, 8, 761) - 0.5) * 0.9 + (pn(px * 2, py * 2, 30, 30, 762) - 0.5) * 0.6 + T2(px, py, 763) * 0.35;
      const fox = pn(px * 2, py * 2, 12, 12, 764); if (fox > 0.82) v -= (fox - 0.82) * 3.5;
      if (hash2(px, py, 765) < 0.012) v -= 1;
      vPix(x, PARCH, v, px, py);
    }
  });
  // the lectern with its open book, and the window of his house, cut out of the house sprite
  const house = bElder().c, crop = (sx, sy, w, h) => url(w, h, x => x.drawImage(house, sx, sy, w, h, 0, 0, w, h));
  // the lectern and the tomes by its foot, painted again on their own (the same calls as bElder, without the wall)
  const lc_ = mk(24, 24), lx = lc_.getContext('2d'); lx.translate(-66, -58);
  vTimber(lx, 79, 66, 4, 14, 393); vTimber(lx, 75, 63, 12, 3, 394, false); vTimber(lx, 77, 78, 8, 2, 395, false);
  vTex(lx, 75, 60, 12, 3, RAMP.plaster, (px, py, i, j) => i === 6 ? rampAt(RAMP.plaster, 1.4) : j === 2 ? 2.6 : (i % 2 && j === 1 ? 3.6 : 5) - (i > 6 ? 0.6 : 0));
  vr(lx, '#8a1a1a', 81, 63, 1, 3);
  [[67, 77, 8, '#5a1a2a', '#7a2a3a'], [68, 74, 7, '#22324e', '#34486a'], [67, 71, 8, '#2e4a22', '#426632']].forEach(([bx, by, bw, d, l]) => { vr(lx, d, bx, by, bw, 3); vr(lx, l, bx, by, bw, 1); vr(lx, '#e8dcc0', bx + bw - 1, by + 1, 1, 1); vr(lx, '#e8c04a', bx + 2, by + 1, 1, 1); });
  const lectern = outlined(lc_).toDataURL(), window_ = crop(12, 40, 33, 36);
  const R = document.documentElement.style;
  // his wax seal: an uneven blob of red wax with the village's mark pressed in
  const seal = url(15, 15, x => {
    for (let py = 0; py < 15; py++) for (let px = 0; px < 15; px++) {
      const d = Math.hypot(px - 7, py - 7) + (hash2(Math.round(Math.atan2(py - 7, px - 7) * 3), 0, 771) - 0.5) * 1.6;
      if (d > 7.2) continue;
      let v = 3 - (px + py - 14) * 0.12 + T2(px, py, 772) * 0.5;
      if (d > 6.2) v = 1.2; else if (d > 4.6 && d < 5.4) v = (px + py < 14) ? 1.6 : 4.2;   // the pressed ring
      const m = Math.abs(px - 7) + Math.abs(py - 7); if (m === 2 || (px === 7 && Math.abs(py - 7) < 2)) v = (px < 7 || py < 7) ? 1.4 : 4.3;   // the mark
      vPix(x, ['#2a0606', '#4a0a0a', '#6e1010', '#922020', '#b4322c', '#d85a48'], v, px, py);
    }
  });
  for (const [k, v] of Object.entries({ frame, 'frame-sm': frameSm, wall, slab, parch, lectern, window: window_, seal })) R.setProperty('--elder-' + k, `url(${v})`);
})();

/* ---- Marta and Odo share one recipe: each paints a frame, a wall, a board, a sign and a portrait backdrop from
   their own house, sets them as --<id>-*, and css/temas-npc.css dresses the windows from those (see the
   "villager kit" section there). A new villager only needs a block like these and a few colours in the css. ---- */
(function makeVillagerKits() {
  const url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const T2 = (px, py, s) => hash2(px, py, s) - 0.5;
  const wrapN = (px, py, n, fx, fy, s) => pn(px * 240 / n, py * 4, fx, fy, s) - 0.5;
  const FW = 62, FH = 64, TOP = 16, SIDE = 6, BOT = 8, MID = FW - SIDE * 2;
  // the shared frame shape: roof(wx, py) for the top 11 rows, a timber tie beam under it, squared posts, and foot(wx, j) for the bottom
  const frameOf = (roof, foot, extra) => url(FW, FH, x => {
    for (let py = 0; py < FH; py++) for (let px = 0; px < FW; px++) {
      const wx = ((px - SIDE) % MID + MID) % MID;
      if (py < 11) { const v = roof(x, px, py, wx); if (v !== undefined) vPix(x, v[0], v[1], px, py); continue; }
      if (py === 11) { vPix(x, RAMP.beam, 0.3, px, py); continue; }
      if (px < SIDE || px >= FW - SIDE) {
        const i = px < SIDE ? px : px - (FW - SIDE);
        if (i === 0 || i === SIDE - 1) { vPix(x, RAMP.beam, 0.2, px, py); continue; }
        if (py >= FH - 3) { vPix(x, RAMP.stone, (py === FH - 3 ? 4 : 2.4) + T2(px, py, 905) * 0.8, px, py); continue; }
        let v = 3 + (pn(px * 4, py * 240 / FH, 160, 12, px < SIDE ? 891 : 892) - 0.5) * 1.4 + T2(px, py, 893) * 0.3;
        if (i === 1) v += 1.1; else if (i === SIDE - 2) v = 0.6; else if (i === SIDE - 3) v -= 0.6;
        vPix(x, RAMP.beam, v, px, py); continue;
      }
      if (py < TOP) { vPix(x, RAMP.beam, (py === 12 ? 3.8 : py === 15 ? 0.5 : 2.5) + wrapN(wx, py, MID, 6, 60, 894) * 1.1 + T2(wx, py, 895) * 0.3, px, py); continue; }
      if (py >= FH - BOT) { const v = foot(x, px, py, wx, py - (FH - BOT)); if (v) vPix(x, v[0], v[1], px, py); continue; }
      x.clearRect(px, py, 1, 1);
    }
    if (extra) extra(x);
  });
  const stoneSill = (wx, py, j, s) => [RAMP.stone, (j === 0 ? 4.2 : j === 3 ? 0.6 : 2.7) + (hash2(Math.floor((wx + (j & 1) * 4) / 9), j >> 1, s) - 0.5) * 1.1 + ((wx + (j & 1) * 4) % 9 === 0 ? -1.6 : 0) + T2(wx, py, s + 1) * 0.6];
  // a board tile with horizontal grain on any ramp, tiles every 60 pixels
  const boardOf = (P, s, lift = 0) => url(60, 14, x => {
    for (let py = 0; py < 14; py++) for (let px = 0; px < 60; px++) {
      let v = 3 + lift + (pn(px * 4, py * 240 / 14, 12, 160, s) - 0.5) * 1.4 + T2(px, py, s + 1) * 0.3;
      if (py === 0) v += 1.1; else if (py === 13) v = 0.4; else if (py === 12) v -= 0.7;
      if (hash2(py, px >> 3, s + 2) < 0.05) v -= 1.2;
      vPix(x, P, v, px, py);
    }
  });
  const smallFrame = (P, nails) => url(16, 16, x => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const r = Math.min(px, py, 15 - px, 15 - py); if (r >= 5) continue;
      const lit = py === r || px === r;
      let v; if (r === 0 || r === 4) v = 0.2; else if (r === 1) v = lit ? 4.2 : 1; else v = 2.7 + T2(px, py, 911) * 0.7 - (lit ? 0 : 0.6);
      vPix(x, P, v, px, py);
    }
    if (nails) for (const [X, Y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { vPix(x, nails, 4.6, X, Y); vPix(x, nails, 1, X + 1, Y + 1); }
  });
  const cut = (src, sx, sy, w, h) => url(w, h, x => x.drawImage(src, sx, sy, w, h, 0, 0, w, h));
  const R = document.documentElement.style, put = (id, o) => { for (const k in o) R.setProperty(`--${id}-${k}`, `url(${o[k]})`); };

  // Marta: a thatched cottage, lime plaster between timbers, herbs drying under the eave, flowers by the door
  {
    const roof = (x, px, py, wx) => {
      if (py === 0) return [RAMP.thatch, 1];
      const sh = Math.floor(hash2(wx >> 1, 0, 921) * 3), lj = (py + sh) % 5;
      if (py >= 9 && hash2(wx, py, 922) < (py === 10 ? 0.5 : 0.18)) return [RAMP.beam, 0.3];   // straw hanging ragged at the eave
      let v = 3 + wrapN(wx, py, MID, 40, 26, 923) * 1.8 + T2(wx, py, 924) * 0.7;
      if (lj === 0) v += 0.9; else if (lj === 4) v -= 1.3;
      if (hash2(wx, py, 925) < 0.03) v += 1.5;
      if (px === 0 || px === FW - 1) v = 0.5;
      return [RAMP.thatch, v];
    };
    const foot = (x, px, py, wx, j) => {
      if (j < 4) return stoneSill(wx, py, j, 931);
      // grass with a few flowers
      if (hash2(wx, py, 933) < 0.06 && j < 7) { x.fillStyle = ['#e0505a', '#f0c43a', '#ffe07a', '#c070d8'][Math.floor(hash2(wx, py, 934) * 4)]; x.fillRect(px, py, 1, 1); return null; }
      return [RAMP.leaf, 2.4 + wrapN(wx, py, MID, 20, 60, 935) * 1.6 + T2(wx, py, 936) * 1.4 - (j === 4 ? 0.8 : 0)];
    };
    // bundles of herbs tied to the tie beam
    const herbs = x => { for (const [X, L] of [[14, RAMP.leaf], [30, RAMP.thatch], [46, RAMP.leaf]]) { vPix(x, RAMP.beam, 1, X, 12); vTex(x, X - 1, 13, 3, 3, L, (qx, qy, a, j) => j === 2 && a !== 1 ? null : 3.2 - j * 0.4 + (a === 0 ? 0.8 : a === 2 ? -0.8 : 0) + T2(qx, qy, 937) * 0.8); } };
    const frame = frameOf(roof, foot, herbs);
    const wall = url(360, 240, x => {
      vPlaster(x, 0, 0, 360, 240, 941, () => 0);
      for (const X of [0, 178]) vTimber(x, X, 0, 5, 240, 942 + X);
      vTimber(x, 0, 116, 360, 5, 944, false);
    });
    const house = bCottage().c;
    put('healer', { frame, 'frame-sm': smallFrame(RAMP.beam, RAMP.iron), wall, board: boardOf(RAMP.green, 951, 0.4), sign: cut(house, 70, 41, 13, 11), portrait: cut(house, 13, 33, 33, 36) });
  }

  // Odo: a big tavern, clay tile roof, plaster over timber, panelled inside, barrels and the foaming mug sign
  {
    const roof = (x, px, py, wx) => {
      if (py === 0) return [RAMP.clay, 1];
      const row = (py - 1) >> 2, lj = (py - 1) & 3, off = (row & 1) * 3, tx = Math.floor((wx + off) / 6), li = (wx + off) % 6;
      let v = (lj === 0 ? 1.3 : lj === 1 ? 3.7 : lj === 2 ? 3.1 : 2.4) + (hash2(tx, row, 961) - 0.5) * 1.3 + T2(wx, py, 962) * 0.5;
      if (li === 0) v = lj === 3 ? 0.5 : 1.1; else if (li === 5 && lj === 3) v = 0.9; else if (li === 1) v += 0.3;
      if (px === 0 || px === FW - 1) v = 0.5;
      return [RAMP.clay, v];
    };
    const foot = (x, px, py, wx, j) => j < 4 ? stoneSill(wx, py, j, 971) : [RAMP.dirt, 2.4 + wrapN(wx, py, MID, 10, 60, 972) * 1.6 + T2(wx, py, 973) * 0.8 - (j === 4 ? 0.9 : 0) + (hash2(wx, py, 974) < 0.06 ? 1.6 : 0)];
    const frame = frameOf(roof, foot);
    // the taproom wall: plaster above, a timber rail, dark panelling below
    const wall = url(360, 240, x => {
      vPlaster(x, 0, 0, 360, 130, 981, () => 0);
      for (const X of [0, 120, 240]) vTimber(x, X, 0, 5, 130, 982 + X);
      vTimber(x, 0, 126, 360, 7, 985, false);
      vTex(x, 0, 133, 360, 107, RAMP.bark, (px, py, i, j) => {
        const pnl = i % 60, k = Math.floor(i / 60);
        let v = 2.6 + (pn(px * 2, py * 4, 160, 12, 986) - 0.5) * 1.2 + T2(px, py, 987) * 0.35 + (hash2(k, 0, 988) - 0.5) * 0.5;
        if (pnl === 0) v = 0.6; else if (pnl === 1) v += 1.1;
        if (j === 0) v = 4; else if (j === 1) v = 0.8;
        if (pnl > 6 && pnl < 54 && (j === 12 || j === 95)) v = j === 12 ? 1 : 3.6;
        if (pnl > 6 && pnl < 54 && j > 12 && j < 95 && (pnl === 7 || pnl === 53)) v = pnl === 7 ? 1 : 3.4;
        return v;
      });
    });
    const house = bTavern().c;
    put('tavern', { frame, 'frame-sm': smallFrame(RAMP.bark, RAMP.iron), wall, board: boardOf(RAMP.leather, 991, 0.5), sign: cut(house, 79, 64, 19, 16), portrait: cut(house, 13, 64, 33, 36) });
  }
})();
