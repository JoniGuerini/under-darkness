'use strict';

/* ================= the village: the one safe place under the sun (Tristram style) ================= */
// everything here is drawn, not built from tiles: the houses can't be mined and the people in them can't be hurt
function inVillage(tx, ty) { return !!surf && Math.abs(wdx(wrapX(tx) - SPX)) <= VIL_HALF && ty < surf[SPX] + 4 && ty >= surf[SPX] - 40; }
function placeName(tx, ty) { return inVillage(tx, ty) && zoneAt(tx, ty) === 0 ? ['Vilarejo', 'aqui nada te ataca'] : [ZONE_NAMES[zoneAt(tx, ty)], ZONE_SUB[zoneAt(tx, ty)]]; }
const WPXV = () => WW * T;
const nearWX = wx => { const W = WPXV(), ref = pl.x + pl.w / 2; return wx + Math.round((ref - wx) / W) * W; };   // the copy of a spot closest to the hero on the ring

/* ---- building art: little pixel painters ---- */
const vr = (x, col, X, Y, W = 1, H = 1) => { x.fillStyle = col; x.fillRect(X, Y, W, H); };
function vNoise(x, X, Y, W, H, cols, s) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const h = hash2(X + i, Y + j, s); x.fillStyle = cols[h < 0.14 ? 0 : h > 0.86 ? 2 : 1]; x.fillRect(X + i, Y + j, 1, 1); } }
const PLASTER = ['#b29c78', '#cdb894', '#dccaa8'], BEAM = ['#3e2716', '#5a3a22', '#7a5232'];
function vBeam(x, X, Y, W, H) { vr(x, BEAM[1], X, Y, W, H); vr(x, BEAM[0], X + W - 1, Y, 1, H); vr(x, BEAM[0], X, Y + H - 1, W, 1); if (W > 2 && H > 2) { vr(x, BEAM[2], X, Y, W - 1, 1); } }
function vStones(x, X, Y, W, H, cols = ['#5e5a56', '#7a766f', '#8e8a82'], s = 5) {
  vr(x, '#3a3634', X, Y, W, H);
  for (let r = 0, y = Y; y < Y + H; r++, y += 5) {
    const off = (r & 1) * 4;
    for (let xx = X - off; xx < X + W; xx += 8) {
      const x0 = Math.max(X, xx + 1), x1 = Math.min(X + W, xx + 8), y1 = Math.min(Y + H, y + 4); if (x1 - x0 < 1) continue;
      const c = cols[Math.floor(hash2(xx, y, s) * cols.length)];
      vr(x, c, x0, y, x1 - x0, y1 - y); vr(x, '#a8a39a', x0, y, x1 - x0, 1);
    }
  }
}
function vRoof(x, X, Y, W, H, inset, cols, edge, thatch) {
  for (let j = 0; j < H; j++) {
    const ins = Math.round((H - 1 - j) / (H - 1) * inset), x0 = X + ins, x1 = X + W - ins;
    for (let i = x0; i < x1; i++) {
      let c;
      if (thatch) { const h = hash2(i, Math.floor(j / 3), 31); c = cols[h < 0.3 ? 0 : h > 0.75 ? 2 : 1]; if (j === H - 1 && hash2(i, 7, 32) < 0.4) continue; }
      else { const row = Math.floor(j / 4), tile = Math.floor((i + (row & 1) * 3) / 6); c = j % 4 === 3 || (i + (row & 1) * 3) % 6 === 0 ? cols[0] : hash2(tile, row, 33) < 0.3 ? cols[2] : cols[1]; }
      vr(x, c, i, Y + j);
    }
    vr(x, edge, x0, Y + j); vr(x, edge, x1 - 1, Y + j);
  }
  vr(x, edge, X + inset, Y, W - inset * 2, 1); vr(x, edge, X, Y + H - 1, W, 1);
}
function vWindow(b, x, X, Y, W, H) {
  vr(x, '#2a1a10', X - 1, Y - 1, W + 2, H + 2); vr(x, '#232a3a', X, Y, W, H); vr(x, '#3a4660', X + 1, Y + 1, 2, 1);
  vr(x, '#2a1a10', X + (W >> 1), Y, 1, H); vr(x, '#2a1a10', X, Y + (H >> 1), W, 1);
  vr(x, '#5a3a22', X - 2, Y + H + 1, W + 4, 2);
  b.wins.push([X, Y, W, H]); b.lights.push([X + W / 2, Y + H / 2, 0.62]);
}
function vDoor(x, X, Y, W, H, cols = ['#3e2614', '#6a4426', '#59391f']) {
  vr(x, '#2a1a10', X - 1, Y - 1, W + 2, H + 1); vr(x, cols[1], X, Y, W, H);
  for (let i = X + 2; i < X + W; i += 3) vr(x, cols[2], i, Y, 1, H);
  vr(x, cols[0], X, Y + 3, W, 1); vr(x, cols[0], X, Y + H - 4, W, 1); vr(x, '#e8c04a', X + W - 3, Y + (H >> 1), 1, 2);
}
function vBarrel(x, X, Y) { vr(x, '#2a1a10', X, Y, 11, 13); vr(x, '#7a4a28', X + 1, Y + 1, 9, 11); vr(x, '#9a6236', X + 2, Y + 1, 2, 11); vr(x, '#4a4e58', X + 1, Y + 3, 9, 1); vr(x, '#4a4e58', X + 1, Y + 9, 9, 1); }
function vFinish(b) { const o = outlined(b.c); b.c = o; b.ox = -1; return b; }
function newB(w, h) { const c = mk(w, h); return { c, x: c.getContext('2d'), wins: [], lights: [], smoke: [] }; }

/* ---- textured painters: every pixel shaded on a 6-step ramp, the same way the ground is ---- */
const RAMP = {
  stone: ['#2a2622', '#433d37', '#5d564e', '#787066', '#948a7e', '#b3a998'],
  stoneB: ['#272526', '#3d3b3e', '#555357', '#6e6c70', '#8a888b', '#aaa8ab'],
  stoneHot: ['#2e1a12', '#4a2a1a', '#6a3c22', '#8c522c', '#b06a36', '#d88a48'],
  wall: ['#1a110a', '#281a10', '#372417', '#48301e', '#5b3d27', '#714e32'],
  beam: ['#1e130b', '#352214', '#4d331d', '#674528', '#815833', '#9e6e40'],
  shingle: ['#24140c', '#3a2214', '#53321c', '#6c4325', '#88562f', '#a56b3b'],
  iron: ['#141519', '#22242a', '#33363d', '#4a4e57', '#6a707b', '#949ca8'],
  steel: ['#3a3f48', '#596069', '#7d858f', '#a3abb5', '#c9d0d8', '#eef2f6'],
  fire: ['#4a1004', '#8a2406', '#c8420b', '#f2701a', '#ffb233', '#fff0a8'],
  hearth: ['#0a0604', '#140a06', '#1f0f08', '#30160a', '#4a200c', '#6a2e12'],
  bark: ['#1c140e', '#2c2018', '#3e2e22', '#52402e', '#6a543c', '#86704e'],
  coal: ['#0c0c0f', '#16161b', '#212128', '#2e2e37', '#41414c', '#5c5c68'],
  leather: ['#1e1009', '#30190e', '#462514', '#5e331b', '#784424', '#94582f'],
  dirt: ['#1f140c', '#2e1f13', '#3f2b1b', '#523925', '#664830', '#7c5a3e']
};
const rampAt = (P, v) => P[v < 0 ? 0 : v > 5 ? 5 : v | 0];
const grn = (px, py, s) => hash2(px, py, s) - 0.5;                       // per-pixel grain
const sn = (px, py, fx, fy, s) => pn(px, py, fx, fy, s) - 0.5;           // smooth noise (fx, fy = features per 240 px)
const vPix = (x, P, v, px, py) => { x.fillStyle = rampAt(P, v); x.fillRect(px, py, 1, 1); };
// fills W×H; fn(px, py, i, j) returns a shade 0..5 on ramp P, a hex colour, or null to leave the pixel alone
function vTex(x, X, Y, W, H, P, fn) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = fn(X + i, Y + j, i, j); if (v === null) continue; if (typeof v === 'string') { x.fillStyle = v; x.fillRect(X + i, Y + j, 1, 1); } else vPix(x, P, v, X + i, Y + j); } }
// rough-cut stones of uneven size, lit from the top left, with mortar, chips and a few odd-coloured stones
// o.soot(px, py) darkens, o.heat(px, py) (0..1) warms stones near a fire
function vMasonry(x, X, Y, W, H, s, o = {}) {
  for (let y = Y, r = 0; y < Y + H; r++) {
    const rh = hash2(r, 0, s) < 0.45 ? 5 : 4;
    for (let xx = X - Math.floor(hash2(r, 1, s) * 6), k = 0; xx < X + W; k++) {
      const sw = 5 + Math.floor(hash2(r, k + 2, s) * 6), tone = (hash2(r, k + 40, s) - 0.5) * 1.2, P0 = hash2(r, k + 80, s) < 0.25 ? (o.ramps ? o.ramps[1] : RAMP.stoneB) : (o.ramps ? o.ramps[0] : RAMP.stone), pit = hash2(r, k + 120, s);
      for (let j = 0; j < rh; j++) for (let i = 0; i < sw; i++) {
        const px = xx + i, py = y + j; if (px < X || px >= X + W || py >= Y + H) continue;
        let v;
        if (i === sw - 1 || j === rh - 1) v = 0.55 + grn(px, py, s + 7) * 0.9;
        else if ((i === 0 || i === sw - 2) && (j === 0 || j === rh - 2) && hash2(px, py, s + 3) < 0.55) v = 1.2;
        else {
          v = 3.05 + tone + grn(px, py, s + 5) * 0.85 + sn(px, py, 90, 90, s + 6) * 0.6;
          if (j === 0) v += 1.05; else if (i === 0) v += 0.5;
          if (j === rh - 2) v -= 0.95; else if (i === sw - 2) v -= 0.5;
          if (hash2(px, py, s + 9) < 0.045) v -= 1.3;
          if (pit < 0.18 && i === 2 + ((pit * 50) | 0) % Math.max(1, sw - 4) && j === 1) v -= 1.4;   // a chip
        }
        if (o.soot) v -= o.soot(px, py);
        const P = o.heat && o.heat(px, py) + grn(px, py, s + 11) * 0.35 > 0.5 ? RAMP.stoneHot : P0;
        vPix(x, P, v, px, py);
      }
      xx += sw;
    }
    y += rh;
  }
}
// upright boards with long grain, dark gaps, a knot here and there and a row of nails
function vBoards(x, X, Y, W, H, P, s, shade) {
  for (let bx = X, k = 0; bx < X + W; k++) {
    const bw = 5 + (hash2(k, 0, s) < 0.4 ? 1 : 0), tone = (hash2(k, 1, s) - 0.5) * 0.8, ky = Y + 4 + Math.floor(hash2(k, 2, s) * (H - 8)), knot = hash2(k, 3, s) < 0.45;
    for (let j = 0; j < H; j++) for (let i = 0; i < bw; i++) {
      const px = bx + i, py = Y + j; if (px >= X + W) continue;
      let v = i === bw - 1 ? 0.35 : 2.75 + tone + sn(px, py, 140, 9, s + 4) * 1.5 + grn(px, py, s + 5) * 0.35;
      if (i === 0) v += 0.55; else if (i === bw - 2) v -= 0.4;
      if (knot && i > 0 && i < bw - 1 && Math.abs(py - ky) + Math.abs(i - (bw >> 1)) * 0.8 < 1.3) v -= 1.6;
      if (shade) v -= shade(px, py);
      vPix(x, P, v, px, py);
    }
    bx += bw;
  }
}
// a squared timber: grain along its length, lit edge, shadowed edge, a crack or two
function vTimber(x, X, Y, W, H, s, vertical = true) {
  vTex(x, X, Y, W, H, RAMP.beam, (px, py, i, j) => {
    const a = vertical ? i : j, n = vertical ? W : H;
    let v = 3 + (vertical ? sn(px, py, 160, 12, s) : sn(px, py, 12, 160, s)) * 1.4 + grn(px, py, s + 1) * 0.3;
    if (a === 0) v += 1.1; else if (a === n - 1) v = 0.4; else if (a === n - 2) v -= 0.7;
    if (hash2(vertical ? px : py, (vertical ? py : px) >> 3, s + 2) < 0.06) v -= 1.2;
    return v;
  });
}

function bForge() {
  const b = newB(124, 80), x = b.x;
  const roofTop = px => 20 + Math.round((px - 40) * 0.12), roofBot = px => roofTop(px) + 12;
  // the shed's back wall, deep in the shadow of the roof and darkened by soot near the furnace
  vBoards(x, 44, 26, 70, 54, RAMP.wall, 141, (px, py) => { const d = py - roofBot(px); return (d < 3 ? 1.3 : d < 6 ? 0.6 : 0) + (px < 54 ? (54 - px) * 0.06 : 0) - (py > 66 ? 0 : 0); });
  // packed earth floor
  vTex(x, 44, 77, 70, 3, RAMP.dirt, (px, py, i, j) => 2.4 + sn(px, py, 60, 60, 151) * 1.6 + grn(px, py, 152) * 0.8 - (j === 0 ? 0.9 : 0) + (hash2(px, py, 153) < 0.06 ? 1.6 : 0));
  // a rack board with pegs: two blades, a hammer, tongs and horseshoes hanging from it
  vTimber(x, 52, 38, 52, 3, 161, false);
  for (const px of [58, 66, 77, 87, 96]) { vr(x, RAMP.iron[1], px, 41, 1, 1); vr(x, RAMP.iron[4], px, 40, 1, 1); }
  for (const [sx, top, len] of [[57, 42, 13], [65, 44, 11]]) {   // swords, point down, hung by the guard
    vTex(x, sx, top + 5, 3, len, RAMP.steel, (px, py, i, j) => { if (j === len - 1 && i !== 1) return null; return i === 0 ? 4.6 : i === 1 ? 3.2 + grn(px, py, 171) * 0.5 : 1.6; });
    vr(x, RAMP.iron[2], sx - 2, top + 4, 7, 1); vr(x, RAMP.iron[4], sx - 2, top + 3, 7, 1); vr(x, '#e8c04a', sx - 2, top + 3, 1, 1);
    vr(x, RAMP.leather[2], sx + 1, top, 1, 3); vr(x, RAMP.leather[4], sx + 1, top + 1, 1, 1); vr(x, RAMP.iron[4], sx, top - 1, 3, 1);
  }
  vTex(x, 75, 42, 2, 13, RAMP.beam, (px, py, i) => i ? 2.2 : 3.6 + grn(px, py, 172) * 0.6);                // hammer
  vTex(x, 72, 42, 8, 4, RAMP.iron, (px, py, i, j) => (j === 0 ? 4.6 : j === 3 ? 1.4 : 3) + (i === 0 || i === 7 ? -0.6 : 0) + grn(px, py, 173) * 0.5);
  for (const [tx, d] of [[85, 0], [88, 1]]) vTex(x, tx, 42, 1, 14, RAMP.iron, (px, py, i, j) => j > 10 ? null : 3 - d + (j < 2 ? 1 : 0));   // tongs
  vr(x, RAMP.iron[2], 85, 46, 4, 1); vr(x, RAMP.iron[3], 84, 53, 2, 3); vr(x, RAMP.iron[2], 88, 53, 2, 3);
  for (const hx of [94, 98]) { vr(x, RAMP.iron[3], hx, 42, 1, 5); vr(x, RAMP.iron[3], hx + 4, 42, 1, 5); vr(x, RAMP.iron[2], hx + 1, 47, 3, 1); vr(x, RAMP.iron[5], hx, 42, 1, 2); }
  // a shelf with a few bars waiting for the anvil
  vTimber(x, 92, 57, 16, 2, 162, false);
  [[94, '#8a4a24', '#e0884c', '#b5653a'], [99, '#5a5e68', '#d0d6de', '#9aa0aa'], [104, '#8a6a12', '#ffe07a', '#f0c43a']].forEach(([ix, d, l, m]) => { vr(x, d, ix, 54, 4, 3); vr(x, m, ix, 54, 4, 2); vr(x, l, ix + 1, 54, 2, 1); });
  // the lean-to roof: rows of overlapping wooden shingles, a ridge cap and a heavy fascia board
  for (let px = 40; px < 122; px++) {
    const t = roofTop(px);
    for (let j = 0; j < 12; j++) {
      const py = t + j;
      if (j === 0) { vPix(x, RAMP.beam, 1 + (hash2(px, 0, 181) < 0.3 ? 1 : 0), px, py); continue; }
      if (j >= 10) { vPix(x, RAMP.beam, (j === 10 ? 4 : 1.6) + sn(px, py, 12, 160, 182) * 1.2 + grn(px, py, 183) * 0.3, px, py); continue; }
      const row = (j - 1) / 3 | 0, lj = (j - 1) % 3, off = row * 2 + (row === 1 ? 1 : 0), sx = Math.floor((px + off) / 5), li = (px + off) % 5;
      const tone = (hash2(sx, row, 184) - 0.5) * 1.1, gone = hash2(sx, row, 185) < 0.05;
      let v = lj === 0 ? 1.4 : lj === 1 ? 3.1 : 3.7;
      if (li === 0) v = 0.8; else if (li === 1) v += 0.4;
      v += tone + grn(px, py, 186) * 0.45 + sn(px, py, 200, 30, 187) * 0.6;
      if (gone && lj > 0) v = 0.6;
      if (row === 2 && lj === 2 && hash2(px, py, 188) < 0.18) { x.fillStyle = hash2(px, py, 189) < 0.5 ? '#3f5a24' : '#56742e'; x.fillRect(px, py, 1, 1); continue; }   // moss on the eaves
      vPix(x, RAMP.shingle, v, px, py);
    }
    if (hash2(px, 1, 190) < 0.35) vPix(x, RAMP.beam, 0.8, px, t + 12);   // a ragged drip edge
  }
  // posts and a knee brace holding the roof up
  vTimber(x, 44, 30, 4, 50, 191); vTimber(x, 110, 34, 4, 46, 192);
  for (let k = 0; k < 9; k++) { vPix(x, RAMP.beam, 3.6 + grn(k, 0, 193) * 0.6, 109 - k, 45 - k); vPix(x, RAMP.beam, 1.4, 109 - k, 46 - k); vPix(x, RAMP.beam, 2.6, 108 - k, 45 - k); }
  // a shop sign on an iron bracket: an anvil burnt into the board
  vr(x, RAMP.iron[2], 114, 44, 9, 1); vr(x, RAMP.iron[4], 114, 43, 8, 1); vr(x, RAMP.iron[2], 115, 45, 1, 2); vr(x, RAMP.iron[2], 121, 45, 1, 2);
  vTex(x, 113, 47, 11, 8, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 4 : i === 10 || j === 7 ? 1 : 3) + sn(px, py, 12, 160, 194) * 1.1 + grn(px, py, 195) * 0.3);
  vr(x, '#1e140c', 115, 49, 6, 1); vr(x, '#1e140c', 117, 50, 3, 2); vr(x, '#1e140c', 116, 52, 5, 1); vr(x, '#1e140c', 114, 49, 1, 1);
  // the chimney and furnace: one mass of fieldstone, sooty at the top, warm around the fire
  const mouthX = 23, mouthY = 57;
  const heat = (px, py) => { const d = Math.hypot((px - mouthX) * 0.8, py - 62); return d < 10 ? 0.9 : d < 17 ? (17 - d) / 7 * 0.9 : 0; };
  vMasonry(x, 14, 0, 16, 28, 201, { soot: (px, py) => py < 9 ? (9 - py) * 0.22 : 0 });
  vTex(x, 12, 0, 20, 3, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 3.8 : j === 1 ? 2.4 : 0.5) + grn(px, py, 202) * 0.7 - (i === 0 || i === 19 ? 0.8 : 0));   // cap slab
  vr(x, RAMP.coal[0], 18, 0, 8, 1);
  b.smoke.push([22, -1]);
  vMasonry(x, 2, 26, 42, 54, 203, { heat, soot: (px, py) => (Math.abs(px - mouthX) < 12 && py < 46 && py > 26 ? (46 - py) * 0.02 + 0.35 : 0) + (py < 29 ? 0.4 : 0) });
  vTex(x, 1, 26, 44, 2, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4 : 1.4) + grn(px, py, 204) * 0.7);   // capstones along the top
  // the arched mouth: voussoirs around a dark hearth, glowing coals and a few tongues of flame
  const inArch = (px, py, r) => py >= mouthY ? Math.abs(px + 0.5 - mouthX) < r : Math.hypot(px + 0.5 - mouthX, (py + 0.5 - mouthY) * 1.15) < r;
  vTex(x, 8, 43, 30, 30, RAMP.stone, (px, py) => {
    if (inArch(px, py, 10.5)) {
      const coalTop = 65 + Math.round(Math.abs(px + 0.5 - mouthX) * 0.28 + grn(px, 0, 211) * 1.4);
      if (py >= coalTop) { const h = 4.6 - Math.abs(px + 0.5 - mouthX) * 0.18 - (py - coalTop) * 0.25 + grn(px, py, 212) * 1.6; if (hash2(px, py, 213) < 0.28) return rampAt(RAMP.coal, 1 + hash2(px, py, 214) * 2); return rampAt(RAMP.fire, h); }
      for (const [fx, fh] of [[-5, 8], [0, 12], [5, 7]]) {   // three tongues of flame licking up from the coals
        const rel = (66 - py) / fh, hw = 2.8 * (1 - rel) + 0.2, dx = Math.abs(px + 0.5 - mouthX - fx - Math.sin(rel * 3 + fx) * 1.3 * rel);
        if (rel >= 0 && rel < 1 && dx < hw) return rampAt(RAMP.fire, 5.2 - dx / hw * 2.2 - rel * 2.2 + grn(px, py, 216) * 0.5);
      }
      return rampAt(RAMP.hearth, 0.6 + Math.max(0, py - 50) * 0.24 + grn(px, py, 217) * 0.8 - Math.abs(px + 0.5 - mouthX) * 0.05);
    }
    if (py < mouthY + 1 && inArch(px, py, 14.5)) {
      const a = Math.atan2((py + 0.5 - mouthY) * 1.15, px + 0.5 - mouthX), seam = Math.abs(((a / Math.PI * 7) % 1 + 1) % 1 - 0.5) > 0.42, d = Math.hypot(px + 0.5 - mouthX, (py + 0.5 - mouthY) * 1.15);
      const P = heat(px, py) + grn(px, py, 218) * 0.35 > 0.5 ? RAMP.stoneHot : RAMP.stone;
      if (seam || d > 13.8) return rampAt(RAMP.stone, 0.6);
      return rampAt(P, 3.2 + (d > 12.6 ? 0.9 : d < 11.4 ? -0.9 : 0) + grn(px, py, 219) * 0.8 - Math.max(0, 50 - py) * 0.04);
    }
    return null;
  });
  // the hearth ledge and the jambs either side of the mouth
  vTex(x, 9, 72, 29, 4, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4.4 : j === 3 ? 0.6 : 2.7) + grn(px, py, 221) * 0.8 - (i === 0 || i === 28 ? 0.7 : 0));
  vTex(x, 11, 76, 25, 1, RAMP.stone, () => 0.3);
  b.lights.push([23, 62, 0.85]); b.glow = [[23, 64]];
  // a heap of coal at the foot of the furnace and a poker leaning on it
  vTex(x, 1, 72, 9, 8, RAMP.coal, (px, py, i, j) => { const top = 72 + Math.abs(i - 4) * 0.9 + grn(i, 0, 231); if (py < top) return null; return 1.2 + (hash2(px >> 1, py >> 1, 232) < 0.3 ? 2.8 : 0.8) + grn(px, py, 233) * 0.8 - j * 0.15; });
  for (let k = 0; k < 14; k++) vPix(x, RAMP.iron, k < 2 ? 4.6 : 2.6 + (k & 1) * 0.6, 37 - (k >> 2), 66 + k);
  // leather bellows on a stand, nozzle into the side of the furnace
  for (let i = 0; i < 12; i++) {
    const px = 47 + i, t = 68 - Math.round(i * 0.42), bt = 70 + Math.round(i * 0.42);
    vPix(x, RAMP.beam, 3.8 + grn(px, 1, 241) * 0.4, px, t); vPix(x, RAMP.beam, 1.6, px, t + 1);
    for (let py = t + 2; py < bt - 1; py++) vPix(x, RAMP.leather, 2.6 + ((py - t) % 2 ? -0.8 : 0.5) + grn(px, py, 242) * 0.6 - i * 0.03, px, py);
    vPix(x, RAMP.beam, 2.6, px, bt - 1); vPix(x, RAMP.beam, 1, px, bt);
  }
  vr(x, RAMP.beam[2], 58, 63, 2, 13); vr(x, RAMP.beam[4], 58, 63, 1, 13); vr(x, RAMP.iron[3], 43, 68, 4, 2); vr(x, RAMP.iron[5], 43, 68, 4, 1);
  vTimber(x, 50, 74, 2, 4, 243); vTimber(x, 56, 74, 2, 4, 244);
  // the anvil: horn, face, waist and feet, on a squat stump
  vTex(x, 81, 69, 14, 10, RAMP.bark, (px, py, i, j) => j === 0 ? rampAt(RAMP.beam, 4 + (Math.hypot(i - 6.5, 0) % 3 < 1 ? -1 : 0)) : (i === 0 ? 3.6 : i === 13 ? 0.8 : 2.4) + sn(px, py, 160, 14, 251) * 1.6 + grn(px, py, 252) * 0.4 + (hash2(px, py >> 2, 253) < 0.08 ? -1.4 : 0));
  vTex(x, 72, 61, 28, 8, RAMP.iron, (px, py, i, j) => {
    const fx = px - 72, y = py - 61;
    if (y <= 2) { if (fx < 6 && y < Math.round((6 - fx) / 3)) return null; if (fx > 25 && y > 1) return null; return y === 0 ? (fx > 7 && fx < 20 ? rampAt(RAMP.steel, 4.6 + grn(px, py, 254) * 0.6) : 4.2) : y === 1 ? 3 : 1.6; }
    if (y <= 4) return fx >= 11 && fx <= 20 ? (fx === 11 ? 3.4 : fx === 20 ? 1 : 2.2 + grn(px, py, 255) * 0.5) : null;
    if (y <= 6) return fx >= 9 && fx <= 22 ? (y === 5 ? 3.2 : 1.6) + (fx === 9 ? 0.5 : fx === 22 ? -0.8 : 0) + grn(px, py, 256) * 0.4 : null;
    return fx >= 8 && fx <= 23 ? 0.6 : null;
  });
  // a quench tub: water on top, staves and iron hoops
  vTex(x, 99, 66, 12, 14, RAMP.beam, (px, py, i, j) => {
    if (j === 0) return i === 0 || i === 11 ? RAMP.beam[1] : rampAt(RAMP.iron, 3.6);
    if (j === 1) return i === 0 || i === 11 ? 1 : (i > 3 && i < 6 ? '#5a7a94' : hash2(px, 0, 261) < 0.3 ? '#2a3e52' : '#1e2e40');
    if (j === 3 || j === 10) return i === 0 ? 1.2 : rampAt(RAMP.iron, i < 3 ? 4.4 : 2.6 + grn(px, py, 262) * 0.6);
    const st = i % 3 === 2;
    return (st ? 1.2 : 3 + (i < 4 ? 0.7 : i > 8 ? -0.8 : 0)) + sn(px, py, 160, 12, 263) * 1.2 + grn(px, py, 264) * 0.3 - (i === 0 || i === 11 ? 1.4 : 0);
  });
  b.anvil = [89, 61];
  return vFinish(b);
}
/* ---- more textured painters for the rest of the village ---- */
Object.assign(RAMP, {
  plaster: ['#5a4e40', '#7f705c', '#a39276', '#bead8e', '#d3c3a3', '#e6dabd'],
  brick: ['#3a1a12', '#5a2a1c', '#7a3a26', '#94492e', '#ad5a38', '#c46e46'],
  thatch: ['#36260e', '#563e16', '#7a5a22', '#9c782e', '#bc963e', '#d8b45a'],
  clay: ['#361410', '#561f17', '#76301f', '#954029', '#b05434', '#c86c44'],
  slate: ['#13161c', '#1e222c', '#2a303c', '#38404f', '#4a5466', '#606c82'],
  stoneBlue: ['#202329', '#33373f', '#484d57', '#5f656f', '#787e89', '#959ca6'],
  glass: ['#10151f', '#19202e', '#232d40', '#2f3d56', '#45587a', '#6c84a8'],
  amber: ['#5a3a10', '#8a5a18', '#b8822a', '#d8a83e', '#f0cc66', '#fff0b0'],
  green: ['#0f180b', '#182812', '#22361a', '#2e4824', '#3c5c2e', '#4e723a'],
  pot: ['#3a160a', '#5a2410', '#7a3418', '#984422', '#b4582e', '#cc7040'],
  leaf: ['#12240e', '#1d3816', '#2a4e1f', '#3a682a', '#4f8636', '#6aa446']
});
// a sloped roof (trapezoid): thatch in ragged straw layers, or rows of staggered clay tiles or slates
function vRoof2(x, X, Y, W, H, inset, kind, s) {
  const P = RAMP[kind], tw = kind === 'slate' ? 7 : 6;
  for (let j = 0; j < H; j++) {
    const ins = Math.round((H - 1 - j) / (H - 1) * inset), x0 = X + ins, x1 = X + W - ins, py = Y + j;
    for (let px = x0; px < x1; px++) {
      const e = Math.min(px - x0, x1 - 1 - px);
      let v;
      if (kind === 'thatch') {
        const sh = Math.floor(hash2(px >> 1, 0, s) * 3), lj = (j + sh) % 5;
        if (j >= H - 2 && hash2(px, j, s + 1) < (j === H - 1 ? 0.45 : 0.15)) continue;   // straw hanging ragged at the eave
        v = 3 + sn(px, py, 240, 26, s) * 1.8 + grn(px, py, s + 2) * 0.7 + sn(px, py, 30, 30, s + 3) * 0.8;
        if (lj === 0) v += 0.9; else if (lj === 4) v -= 1.3;
        if (hash2(px, py, s + 4) < 0.03) v += 1.5;
      } else {
        const row = j >> 2, lj = j & 3, off = (row & 1) * (tw >> 1), tx = Math.floor((px + off) / tw), li = (px + off) % tw, tone = (hash2(tx, row, s) - 0.5) * 1.3;
        v = (lj === 0 ? 1.3 : lj === 1 ? 3.7 : lj === 2 ? 3.1 : 2.4) + tone + grn(px, py, s + 2) * 0.5;
        if (li === 0) v = lj === 3 ? 0.5 : 1.1; else if (li === tw - 1 && lj === 3) v = 0.9; else if (li === 1) v += 0.3;
        if (hash2(tx, row, s + 5) < 0.06 && lj > 0 && li > 0 && hash2(px, py, s + 6) < 0.45) { x.fillStyle = hash2(px, py, s + 7) < 0.5 ? '#4a5e2a' : '#62783a'; x.fillRect(px, py, 1, 1); continue; }   // moss and lichen
      }
      if (j === 0) v = 1; else if (j === 1) v = Math.max(v, 4.2);
      if (e === 0) v = 0.5; else if (e === 1) v -= 0.8;
      vPix(x, P, v, px, py);
    }
  }
  vTex(x, X, Y + H - 1, W, 1, P, (px, py) => kind === 'thatch' ? null : 0.6);
}
// lime plaster: mottled, a few hairline cracks, grime near the ground and patches fallen off to show the bricks
function vPlaster(x, X, Y, W, H, s, shade) {
  vTex(x, X, Y, W, H, RAMP.plaster, (px, py, i, j) => {
    const pg = pn(px, py, 26, 26, s + 3);
    if (pg > 0.79) {
      const lx = (px + ((py / 3 | 0) & 1) * 3) % 6, ly = py % 3;
      if (ly === 2 || lx === 5) return rampAt(RAMP.plaster, 1 + grn(px, py, s + 8));
      return rampAt(RAMP.brick, 2.8 + (ly === 0 ? 0.8 : 0) + grn(px, py, s + 9) * 0.8 + (hash2(px / 6 | 0, py / 3 | 0, s + 10) - 0.5));
    }
    let v = 3.3 + sn(px, py, 50, 50, s) * 1.1 + sn(px, py, 150, 150, s + 1) * 0.6 + grn(px, py, s + 2) * 0.75;
    if (pg > 0.76) v -= 1.1;   // the lip of a broken patch
    if (Math.abs(sn(px, py, 34, 34, s + 4)) < 0.01) v -= 1.4;
    v -= Math.max(0, j - (H - 7)) * 0.22;
    if (shade) v -= shade(px, py, i, j);
    return v;
  });
}
// a diagonal timber, w pixels thick
function vBrace(x, x0, y0, x1, y1, w, s) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let t = 0; t <= n; t++) { const px = Math.round(x0 + (x1 - x0) * t / n), py = Math.round(y0 + (y1 - y0) * t / n); for (let k = 0; k < w; k++) vPix(x, RAMP.beam, (k === 0 ? 4 : k === w - 1 ? 1 : 2.8) + grn(px, py + k, s) * 0.6, px, py + k); }
}
function vWindow2(b, x, X, Y, W, H, s = 7) {
  vTex(x, X - 1, Y - 1, W + 2, H + 2, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 3.6 : i === W + 1 || j === H + 1 ? 1 : 2.4) + grn(px, py, s) * 0.5);
  vTex(x, X, Y, W, H, RAMP.glass, (px, py, i, j) => { let v = 1.4 + (H - j) * 0.08 + grn(px, py, s + 1) * 0.4; if (((i - j) % 6 + 6) % 6 < 2 && i + j < W) v += 1.6; if (i === 0 || j === 0) v -= 0.5; return v; });
  vTex(x, X + (W >> 1), Y, 1, H, RAMP.beam, () => 2.4); vTex(x, X, Y + (H >> 1), W, 1, RAMP.beam, (px) => px === X ? 1.4 : 3);
  vTimber(x, X - 2, Y + H + 1, W + 4, 2, s + 2, false);
  b.wins.push([X, Y, W, H]); b.lights.push([X + W / 2, Y + H / 2, 0.62]);
}
function vDoor2(x, X, Y, W, H, P = RAMP.beam, s = 9) {
  vTex(x, X - 1, Y - 1, W + 2, H + 1, RAMP.beam, (px, py, i, j) => i === 0 || j === 0 ? 1.6 : 0.8);
  vBoards(x, X, Y, W, H, P, s, (px, py) => py === Y ? 1.2 : py > Y + H - 3 ? 0.5 : 0);
  for (const sy of [Y + 3, Y + H - 4]) { vTex(x, X, sy, W - 2, 1, RAMP.iron, (px) => 2.6 + grn(px, sy, s + 1) * 0.6); vr(x, RAMP.iron[5], X + 1, sy, 1, 1); vr(x, RAMP.iron[5], X + W - 4, sy, 1, 1); }
  vr(x, RAMP.iron[1], X + W - 3, Y + (H >> 1) - 1, 2, 3); vr(x, '#e8c04a', X + W - 3, Y + (H >> 1), 1, 1);
}
function vBarrel2(x, X, Y, s = 3) {
  vTex(x, X, Y, 11, 13, RAMP.beam, (px, py, i, j) => {
    if (i === 0 || i === 10 || j === 12) return 0.4;
    if (j === 0) return rampAt(RAMP.beam, 1);
    if (j === 1) return 2 + sn(px, py, 12, 160, s) * 1.2;
    if (j === 3 || j === 9) return rampAt(RAMP.iron, (i < 4 ? 4.2 : 2.8) - (i > 7 ? 0.8 : 0));
    return (i % 3 === 0 ? 1.6 : 3.5 - Math.abs(i - 3.5) * 0.25) + sn(px, py, 160, 10, s + 1) * 1.1 + grn(px, py, s + 2) * 0.35 - (j === 2 ? 0.8 : 0);
  });
}
function vChimney(b, x, X, W, H, s) {
  vMasonry(x, X, 2, W, H - 2, s, { soot: (px, py) => py < 8 ? (8 - py) * 0.2 : 0 });
  vTex(x, X - 1, 0, W + 2, 3, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 3.8 : j === 1 ? 2.4 : 0.5) + grn(px, py, s + 1) * 0.7 - (i === 0 || i === W + 1 ? 0.8 : 0));
  vr(x, RAMP.coal[0], X + 2, 0, W - 4, 1); b.smoke.push([X + (W >> 1), -1]);
}

function bCottage() {
  const b = newB(100, 78), x = b.x;
  vMasonry(x, 4, 71, 92, 7, 302);
  vTex(x, 4, 71, 92, 1, RAMP.stone, (px, py) => 4 + grn(px, py, 303) * 0.8);
  vPlaster(x, 6, 30, 88, 41, 304, (px, py) => py < 36 ? (36 - py) * 0.25 : 0);
  vTimber(x, 6, 30, 3, 41, 305); vTimber(x, 48, 30, 3, 41, 306); vTimber(x, 91, 30, 3, 41, 307); vTimber(x, 6, 30, 88, 3, 308, false); vTimber(x, 6, 50, 88, 2, 309, false);
  vBrace(x, 9, 50, 20, 38, 2, 310); vBrace(x, 79, 38, 90, 50, 2, 311);
  vRoof2(x, 0, 4, 100, 30, 16, 'thatch', 312);
  vChimney(b, x, 69, 10, 16, 301);
  vWindow2(b, x, 21, 39, 13, 10, 313);
  vDoor2(x, 56, 53, 11, 18, RAMP.green, 314);
  vTex(x, 54, 71, 15, 1, RAMP.stoneB, (px) => 4.2 - (px & 1) * 0.6);   // doorstep
  // bundles of herbs drying under the eave
  for (let i = 12; i < 46; i += 5) { vr(x, RAMP.beam[1], i, 33, 1, 2); const L = hash2(i, 1, 52) < 0.5 ? RAMP.leaf : RAMP.thatch; vTex(x, i - 1, 35, 3, 4, L, (px, py, a, j) => j === 3 && a !== 1 ? null : 3 - j * 0.4 + (a === 0 ? 0.8 : a === 2 ? -0.8 : 0) + grn(px, py, 315) * 0.8); }
  // clay pots with flowering plants by the door
  for (const px of [72, 84]) {
    vTex(x, px, 64, 8, 7, RAMP.pot, (qx, qy, i, j) => (j === 6 && (i === 0 || i === 7)) ? null : (j === 0 ? 4.3 : j === 1 ? 1.6 : 3.4 - Math.abs(i - 2.5) * 0.35) + grn(qx, qy, 316) * 0.5 - (i === 7 ? 1 : 0));
    vTex(x, px, 58, 8, 6, RAMP.leaf, (qx, qy, i, j) => { const r = Math.hypot(i - 3.5, (j - 3.5) * 1.3); if (r > 4.2) return null; return 3.2 - j * 0.15 + grn(qx, qy, 317) * 1.4 + (i < 3 && j < 3 ? 0.8 : 0); });
    vr(x, '#e0505a', px + 2, 59, 2, 2); vr(x, '#ff8a90', px + 2, 59, 1, 1); vr(x, '#f0c43a', px + 5, 60, 1, 1); vr(x, '#ffe07a', px + 6, 58, 1, 1);
  }
  // the healer's board: a red cross painted on old wood
  vTex(x, 69, 40, 13, 11, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 3.8 : i === 12 || j === 10 ? 1 : 2.6) + sn(px, py, 12, 160, 318) * 1);
  vTex(x, 70, 41, 11, 9, RAMP.plaster, (px, py) => { const cx = px - 75, cy = py - 45; if ((Math.abs(cx) <= 1 && Math.abs(cy) <= 3) || (Math.abs(cy) <= 1 && Math.abs(cx) <= 3)) return hash2(px, py, 319) < 0.12 ? '#8a2424' : (cx < 0 || cy < 0 ? '#d84848' : '#b83232'); return 4.2 + grn(px, py, 320) * 0.9; });
  return vFinish(b);
}
function bWell() {
  const b = newB(40, 46), x = b.x;
  vTimber(x, 6, 8, 3, 26, 331); vTimber(x, 31, 8, 3, 26, 332); vTimber(x, 6, 12, 28, 2, 333, false);
  vRoof2(x, 0, 0, 40, 9, 6, 'clay', 334);
  // rope, crank and a bucket
  vTex(x, 20, 14, 1, 12, RAMP.thatch, (px, py) => 3.6 + ((py & 1) ? 0.8 : -0.6));
  vTex(x, 4, 12, 2, 2, RAMP.iron, (px, py, i) => i ? 2 : 4); vr(x, RAMP.iron[3], 3, 13, 1, 3);
  vTex(x, 16, 25, 9, 7, RAMP.beam, (px, py, i, j) => i === 0 || i === 8 || j === 6 ? 0.5 : j === 2 ? rampAt(RAMP.iron, i < 4 ? 4.2 : 2.6) : (i % 3 === 0 ? 1.8 : 3.3 - Math.abs(i - 3.5) * 0.25) + sn(px, py, 160, 10, 335) + grn(px, py, 336) * 0.3);
  vTex(x, 17, 24, 7, 1, RAMP.iron, () => 2.6);
  vMasonry(x, 3, 31, 34, 15, 337);
  vTex(x, 2, 30, 36, 3, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4.4 : j === 1 ? 3 : 0.8) + grn(px, py, 338) * 0.8 - (((px + 2) % 9) === 0 && j ? 1.6 : 0));
  vTex(x, 3, 43, 34, 3, RAMP.leaf, (px, py, i, j) => hash2(px, py, 339) < 0.2 + j * 0.15 ? 2.6 + grn(px, py, 340) * 2 : null);   // moss at the foot
  return vFinish(b);
}
function bTavern() {
  const b = newB(136, 108), x = b.x;
  vMasonry(x, 4, 100, 128, 8, 352);
  vTex(x, 4, 100, 128, 1, RAMP.stone, (px, py) => 4 + grn(px, py, 353) * 0.8);
  vPlaster(x, 6, 62, 124, 38, 354, (px, py) => py < 67 ? (67 - py) * 0.25 : 0);
  vPlaster(x, 2, 30, 132, 32, 355, (px, py) => py < 37 ? (37 - py) * 0.25 : 0);
  for (const bx of [6, 44, 88, 127]) vTimber(x, bx, 62, 3, 38, 356 + bx);
  for (const bx of [2, 40, 92, 131]) vTimber(x, bx, 30, 3, 32, 357 + bx);
  vTimber(x, 0, 58, 136, 5, 358, false); vTimber(x, 2, 30, 132, 3, 359, false);
  vBrace(x, 43, 33, 90, 56, 3, 360); vBrace(x, 91, 33, 44, 56, 3, 361);
  vRoof2(x, 0, 2, 136, 30, 22, 'clay', 362);
  vChimney(b, x, 99, 13, 14, 351);
  vWindow2(b, x, 16, 38, 14, 12, 363); vWindow2(b, x, 61, 38, 14, 12, 364); vWindow2(b, x, 106, 38, 14, 12, 365);
  vWindow2(b, x, 20, 72, 16, 13, 366); vWindow2(b, x, 100, 72, 16, 13, 367);
  vDoor2(x, 58, 76, 10, 24, RAMP.beam, 368); vDoor2(x, 68, 76, 10, 24, RAMP.beam, 369);
  vTimber(x, 56, 73, 24, 3, 370, false);
  vTex(x, 55, 100, 26, 1, RAMP.stoneB, (px) => 4.2 - (px & 1) * 0.6);
  // the sign: a foaming mug on a board hanging from an iron bracket
  vTex(x, 80, 64, 16, 1, RAMP.iron, (px) => px < 84 ? 4 : 2.6); vr(x, RAMP.iron[2], 82, 65, 1, 3); vr(x, RAMP.iron[2], 93, 65, 1, 3);
  vTex(x, 79, 67, 18, 12, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 4 : i === 17 || j === 11 ? 0.8 : 2.8) + sn(px, py, 12, 160, 371) * 1.2 + grn(px, py, 372) * 0.3);
  vTex(x, 84, 69, 9, 9, RAMP.amber, (px, py, i, j) => {
    if (i >= 7) return (j >= 3 && j <= 6 && (i === 8 || j === 3 || j === 6)) ? rampAt(RAMP.amber, 2.6) : null;
    if (j < 2) return i === 0 && j === 0 ? null : rampAt(RAMP.plaster, 5 - j * 0.8 + grn(px, py, 373) * 0.6);
    if (j === 8) return rampAt(RAMP.beam, 1);
    return 3.4 + (i === 0 ? 1 : i === 6 ? -1.2 : 0) - j * 0.12 + (hash2(px, py, 374) < 0.1 ? 1.4 : 0);
  });
  vBarrel2(x, 116, 87, 375); vBarrel2(x, 4, 87, 376); vBarrel2(x, 9, 75, 377);
  return vFinish(b);
}
function bElder() {
  const b = newB(96, 80), x = b.x;
  vMasonry(x, 4, 34, 88, 46, 381, { ramps: [RAMP.stoneBlue, RAMP.stoneB], soot: (px, py) => py < 40 ? (40 - py) * 0.18 : 0 });
  vTex(x, 4, 75, 30, 5, RAMP.leaf, (px, py, i, j) => hash2(px, py, 382) < pn(px, py, 40, 40, 383) * 0.9 - 0.15 + j * 0.06 ? 2.6 + grn(px, py, 384) * 2 : null);   // ivy creeping up the corner
  vTex(x, 4, 46, 6, 30, RAMP.leaf, (px, py, i, j) => hash2(px, py, 385) < 0.25 + (5 - i) * 0.05 && Math.abs(sn(px, py, 60, 30, 386)) < 0.18 ? 2.4 + grn(px, py, 387) * 2 : null);
  vRoof2(x, 0, 8, 96, 28, 18, 'slate', 388);
  // a deep-set window under a stone lintel
  vTex(x, 19, 45, 17, 2, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4.2 : 1.6) + grn(px, py, 389) * 0.7);
  vWindow2(b, x, 23, 49, 9, 9, 390);
  vTex(x, 50, 54, 16, 3, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4.2 : j === 2 ? 0.8 : 2.6) + grn(px, py, 391) * 0.7);
  vDoor2(x, 52, 58, 12, 22, RAMP.wall, 392);
  // a lectern with an open book, and a few old tomes stacked by the wall
  vTimber(x, 79, 66, 4, 14, 393); vTimber(x, 75, 63, 12, 3, 394, false); vTimber(x, 77, 78, 8, 2, 395, false);
  vTex(x, 75, 60, 12, 3, RAMP.plaster, (px, py, i, j) => i === 6 ? rampAt(RAMP.plaster, 1.4) : j === 2 ? 2.6 : (i % 2 && j === 1 ? 3.6 : 5) - (i > 6 ? 0.6 : 0));
  vr(x, '#8a1a1a', 81, 63, 1, 3);
  [[68, 74, 8, '#5a1a2a', '#7a2a3a'], [69, 71, 7, '#22324e', '#34486a'], [68, 68, 8, '#2e4a22', '#426632']].forEach(([bx, by, bw, d, l]) => { vr(x, d, bx, by, bw, 3); vr(x, l, bx, by, bw, 1); vr(x, '#e8dcc0', bx + bw - 1, by + 1, 1, 1); vr(x, '#e8c04a', bx + 2, by + 1, 1, 1); });
  return vFinish(b);
}
function bLamp() {
  const b = newB(14, 42), x = b.x;
  vTex(x, 6, 9, 2, 31, RAMP.iron, (px, py, i) => (i ? 1.6 : 3.6) + grn(px, py, 401) * 0.5);
  vTex(x, 4, 38, 6, 4, RAMP.iron, (px, py, i, j) => (j === 0 && (i === 0 || i === 5)) ? null : (j === 0 ? 4 : i < 2 ? 3 : 1.6) + grn(px, py, 402) * 0.5);
  vTex(x, 3, 9, 8, 1, RAMP.iron, (px) => px < 7 ? 3.8 : 2.4);
  vTex(x, 3, 1, 8, 8, RAMP.iron, (px, py, i, j) => (i === 0 || i === 7 || j === 0 || j === 7) ? (i === 0 || j === 0 ? 3.4 : 1.2) : null);
  vTex(x, 4, 2, 6, 6, RAMP.amber, (px, py, i, j) => i === 2 || i === 3 ? rampAt(RAMP.iron, 1.6) : 4.6 - j * 0.3 - (i > 3 ? 0.6 : 0) + grn(px, py, 403) * 0.4);
  vTex(x, 2, 0, 10, 1, RAMP.iron, (px) => px < 6 ? 4 : 2.4); vr(x, RAMP.iron[4], 6, -1, 2, 1);
  b.lights.push([7, 5, 0.9]); b.lamp = [7, 5];
  return vFinish(b);
}
function bSign() {
  const b = newB(28, 34), x = b.x;
  vTimber(x, 12, 4, 3, 30, 411);
  vr(x, RAMP.beam[4], 12, 3, 2, 1);
  // an arrow-shaped board pointing the way down, its pickaxe burnt into the wood
  vTex(x, 1, 7, 26, 9, RAMP.beam, (px, py, i, j) => {
    const tip = i - 21; if (tip > 0 && Math.abs(j - 4) > 4 - tip) return null;
    let v = (j === 0 ? 4.2 : j === 8 ? 1 : 3) + sn(px, py, 12, 200, 412) * 1.3 + grn(px, py, 413) * 0.35;
    if (i === 0) v = 1.6; if (tip > 0 && Math.abs(j - 4) === 4 - tip) v -= 1.4;
    if (j === 4 && hash2(px, 0, 414) < 0.15) v -= 1;
    return v;
  });
  for (const [px, py] of [[5, 8], [6, 9], [7, 10], [8, 11], [9, 12], [4, 9], [3, 10], [5, 7], [8, 9], [9, 10]]) vr(x, '#24170e', px + 2, py, 1, 1);
  vr(x, RAMP.iron[5], 13, 9, 1, 1); vr(x, RAMP.iron[5], 13, 13, 1, 1);
  vTex(x, 8, 30, 12, 4, RAMP.stone, (px, py, i, j) => { const r = Math.hypot(i - 5.5, (j - 4) * 2); return r > 6.5 ? null : 3 - j * 0.3 + grn(px, py, 415) * 1.4 + (j === 1 ? 1 : 0); });
  return vFinish(b);
}
// where things stand, in tiles from the spawn point (x0 = left edge)
const VIL_BUILD = [
  { k: 'forge', x0: -33 }, { k: 'lamp', x0: -21 }, { k: 'cottage', x0: -20 }, { k: 'lamp', x0: -9 }, { k: 'well', x0: -5 },
  { k: 'lamp', x0: 2.4 }, { k: 'tavern', x0: 4 }, { k: 'lamp', x0: 17 }, { k: 'elder', x0: 19 }, { k: 'sign', x0: 30.5 }
];
const BUILDERS = { forge: bForge, cottage: bCottage, well: bWell, tavern: bTavern, elder: bElder, lamp: bLamp, sign: bSign };
function buildVillageArt() { SPR.vil = {}; for (const k in BUILDERS) SPR.vil[k] = BUILDERS[k](); }
// world-pixel position of a building's top-left
function bPos(v) { const b = SPR.vil[v.k]; return [nearWX((SPX + v.x0) * T) + b.ox, surf[SPX] * T - b.c.height + 1]; }
function drawVillage(cx, cy) {
  if (!SPR.vil) return;
  for (const v of VIL_BUILD) { const b = SPR.vil[v.k], [x, y] = bPos(v); if (x - cx > VW || x + b.c.width - cx < 0 || y - cy > VH || y + b.c.height - cy < 0) continue; lc.drawImage(b.c, x - cx, y - cy); }
}
function villageLights(fn) { if (!SPR.vil) return; for (const v of VIL_BUILD) { const b = SPR.vil[v.k], [x, y] = bPos(v); for (const L of b.lights) fn(x + 1 + L[0], y + 1 + L[1], L[2], v, b); } }
const nightK = () => 1 - dayFactor(hourNow());
// after the darkness: windows and lanterns burn warm at dusk and at night, and the forge always does
function drawVillageGlow(cx, cy) {
  if (!SPR.vil) return;
  const nk = nightK(), fl = 0.85 + Math.sin(gameTime * 13) * 0.08 + Math.sin(gameTime * 31) * 0.05;
  lc.globalCompositeOperation = 'lighter';
  for (const v of VIL_BUILD) {
    const b = SPR.vil[v.k], [x, y] = bPos(v); if (x - cx > VW + 40 || x + b.c.width - cx < -40) continue;
    if (b.glow) for (const g of b.glow) { lc.globalAlpha = 0.45 * fl; lc.drawImage(SPR.glow.torch, x + 1 + g[0] - cx - 34, y + 1 + g[1] - cy - 36); }
    if (b.lamp && nk > 0.05) { lc.globalAlpha = 0.5 * nk * fl; lc.drawImage(SPR.glow.torch, x + 1 + b.lamp[0] - cx - 34, y + 1 + b.lamp[1] - cy - 34); }
    if (nk > 0.05) for (const w of b.wins) { lc.globalAlpha = 0.22 * nk * fl; lc.drawImage(SPR.glow.chest, x + 1 + w[0] + w[2] / 2 - cx - 14, y + 1 + w[1] + w[3] / 2 - cy - 12); }
  }
  lc.globalCompositeOperation = 'source-over';
  for (const v of VIL_BUILD) {
    const b = SPR.vil[v.k], [x, y] = bPos(v); if (x - cx > VW || x + b.c.width - cx < 0) continue;
    if (nk > 0.05) for (const w of b.wins) { lc.globalAlpha = 0.8 * nk; lc.fillStyle = '#ffc864'; lc.fillRect(x + 1 + w[0] - cx, y + 1 + w[1] - cy, w[2], w[3]); lc.fillStyle = '#2a1a10'; lc.fillRect(x + 1 + w[0] + (w[2] >> 1) - cx, y + 1 + w[1] - cy, 1, w[3]); lc.fillRect(x + 1 + w[0] - cx, y + 1 + w[1] + (w[3] >> 1) - cy, w[2], 1); }
    lc.globalAlpha = 1;
    if (b.lamp && nk > 0.05) { lc.fillStyle = '#fff3b0'; lc.fillRect(x + 1 + b.lamp[0] - 1 - cx, y + 1 + b.lamp[1] - 2 - cy, 2, 4); }
    if (b.glow) for (const g of b.glow) { const f = Math.floor(gameTime * 8) % 3; lc.fillStyle = '#ffc23d'; lc.fillRect(x + 1 + g[0] - 6 + f * 3 - cx, y + 1 + g[1] + 2 - cy, 2, 2); }
  }
  lc.globalAlpha = 1;
}
function updateVillage(dt) {
  if (!SPR.vil) return;
  const ref = pl.x + pl.w / 2;
  for (const v of VIL_BUILD) {
    const b = SPR.vil[v.k]; if (!b.smoke.length) continue;
    const [x, y] = bPos(v); if (Math.abs(x - ref) > VW) continue;
    for (const s of b.smoke) if (Math.random() < dt * 2.2) parts.push({ x: x + 1 + s[0] + rnd(-2, 2), y: y + 1 + s[1], vx: rnd(-2, 2), vy: rnd(-16, -9), g: -2, life: rnd(1.8, 2.8), max: 2.8, col: Math.random() < 0.5 ? '#3a3640' : '#4a4650', size: 2, smoke: true });
  }
  for (const n of NPCS) updateNpc(n, dt);
}

/* ---- the people ---- */
const HAMMER = ["mmmmm", "mMMMm", "mmmmm", "..h..", "..h..", "..h..", "..h..", "..h..", "..H.."], HAMMER_P = { m: '#3a3c42', M: '#8a909a', h: '#7a4a28', H: '#4a2a18' };
const STAFF = [".kk.", "kGgk", "kggk", ".kk.", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".h..", ".H.."], STAFF_P = { k: '#3a2a1a', G: '#e8fbff', g: '#7fe8ff', h: '#7a5232', H: '#4a3020' };
const MUG = ["wwww.", "WwwW.", "yyyyk", "yYyk.k", "yYyk.k", "yyyykk", "kkkk.."], MUG_P = { w: '#f4ecd8', W: '#d8ccb0', y: '#e8a838', Y: '#ffd27a', k: '#5a3a22' };
const BEARD = ["............", "............", "............", "............", "............", "......wwww..", ".....wWwww..", "....wwWww...", ".....wWw....", "......w....."];
const NPCS = [
  { id: 'ferreiro', name: 'Grimaldo', role: 'o ferreiro', x: -26.9, face: 1, arm: 2.5, ang: 0.6, item: [HAMMER, HAMMER_P, 2.5, 7], beard: { w: '#2a1a12', W: '#3e2a1a' },
    pal: { h: '#2a1a12', H: '#3e2a1a', s: '#d89a6e', S: '#a86a44', e: '#1a1014', r: '#5a3a22', R: '#3e2716', D: '#2a1a0e', b: '#1e1410', B: '#8a6038' }, legs: { S: '#2a1e16', s: '#3e2c20' }, sleeve: ['#d89a6e', '#a86a44'] },
  { id: 'curandeira', name: 'Marta', role: 'a curandeira', x: -13.4, face: 1, arm: 2.25, ang: 0, item: [ICON_ART.potion[0], ICON_ART.potion[1], 4, 7], hood: { c: '#3a5a32', C: '#5a7a44' },
    pal: { h: '#8a7a6a', H: '#a8988a', s: '#e8b894', S: '#c08a66', e: '#2a1a22', r: '#6a7a4a', R: '#4e5a36', D: '#3a4228', b: '#8a5a32', B: '#c8a050' }, legs: { S: '#3a4228', s: '#4e5a36' }, sleeve: ['#6a7a4a', '#4e5a36'] },
  { id: 'taverneiro', name: 'Odo', role: 'o taverneiro', x: 11.2, face: -1, arm: 2.2, ang: 0, item: [MUG, MUG_P, 2, 5],
    pal: { h: '#a8501e', H: '#c8702e', s: '#f0c09a', S: '#c88a66', e: '#2a1a22', r: '#e8e0cc', R: '#bdb39c', D: '#8a8270', b: '#5a3a22', B: '#8a6038' }, legs: { S: '#3a2a1e', s: '#4e3a28' }, sleeve: ['#e8e0cc', '#bdb39c'] },
  { id: 'anciao', name: 'Caetano', role: 'o ancião', x: 25.3, face: -1, arm: 2.0, ang: 0.05, item: [STAFF, STAFF_P, 1.5, 8], beard: { w: '#e8e8e0', W: '#c8c8c0' },
    pal: { h: '#d8d8d0', H: '#f4f4ee', s: '#e0b090', S: '#b8866a', e: '#2a1a22', r: '#3a4a7a', R: '#2a3660', D: '#1e2648', b: '#c9a14a', B: '#f0d080' }, legs: { S: '#1e2648', s: '#2a3660' }, sleeve: ['#3a4a7a', '#2a3660'] }
];
for (const n of NPCS) { n.facing = n.face; n.seed = Math.random() * 10; n.lastP = 0; n.attend = false; }
function buildNpcLooks() {
  for (const n of NPCS) {
    let head = null;
    if (n.beard || n.hood) { const c = mk(12, 10), x = c.getContext('2d'); if (n.hood) x.drawImage(fromRows(HOOD, n.hood), 0, 0); if (n.beard) x.drawImage(fromRows(BEARD, n.beard), 0, 0); head = { img: c, oy: 0 }; }
    n.look = { body: fromRows(PBODY, n.pal), legs: fromRows(LEGS.idle, n.legs), head, item: fromRows(n.item[0], n.item[1]), px: n.item[2], py: n.item[3] };
  }
}
const npcWX = n => nearWX((SPX + n.x) * T);
const groundY = () => surf[SPX] * T;
function updateNpc(n, dt) {
  const dx = pl.x + pl.w / 2 - npcWX(n), near = !pl.dead && Math.abs(dx) < 64 && Math.abs(pl.y + pl.h - groundY()) < 40;
  n.attend = near || talkNpc === n;
  if (n.attend) { if (Math.abs(dx) > 3) n.facing = dx > 0 ? 1 : -1; } else n.facing = n.face;
  if (n.id === 'ferreiro' && !n.attend) {
    const p = (gameTime * 1.1 + n.seed) % 1;
    if (n.lastP < 0.62 && p >= 0.62 && Math.abs(dx) < VW) {
      const [ax, ay] = SPR.vil.forge.anvil, bx = bPos(VIL_BUILD[0])[0] + 1 + ax, by = bPos(VIL_BUILD[0])[1] + 1 + ay;
      for (let k = 0; k < 6; k++) parts.push({ x: bx, y: by, vx: rnd(-50, 50), vy: rnd(-90, -30), g: 300, life: rnd(0.2, 0.45), max: 0.45, col: Math.random() < 0.5 ? '#ffd27a' : '#ff9a3c', size: 1, glow: true });
      if (Math.abs(dx) < 180) sfx.anvil(1 - Math.abs(dx) / 180);
    }
    n.lastP = p;
  }
}
function npcPose(n) {
  const L = n.look; let fA = n.arm + Math.sin(gameTime * 1.3 + n.seed) * 0.05, sA = n.ang;
  if (n.id === 'ferreiro' && !n.attend) {
    const p = (gameTime * 1.1 + n.seed) % 1;
    fA = p < 0.5 ? lerp(1.9, 0.35, easeOut(p / 0.5)) : p < 0.62 ? lerp(0.35, 1.9, ((p - 0.5) / 0.12) ** 2) : 1.9;
    sA = fA - 1.25;
  } else if (n.id === 'ferreiro') { fA = 2.6; sA = 1.6; }
  return {
    body: L.body, legs: L.legs, head: L.head, shield: null,
    back: { ang: -2.6, len: 6, sleeve: n.sleeve[1], hand: n.pal.S, sl: n.id === 'ferreiro' ? 2 : 5 },
    front: { ang: fA, len: 6, sleeve: n.sleeve[0], hand: n.pal.s, sl: n.id === 'ferreiro' ? 2 : 5, item: { img: L.item, ang: sA, px: L.px, py: L.py } },
    flash: false
  };
}
function drawNpcs(cx, cy) {
  if (!SPR.vil) return;
  const gy = groundY() - cy;
  for (const n of NPCS) { const fx = Math.round(npcWX(n)) - cx; if (fx < -40 || fx > VW + 40 || gy < -10 || gy > VH + 60) continue; compose(npcPose(n)); drawComposite(fx, gy, n.facing); }
}
function nearNpc() {
  if (pl.dead || !surf) return null;
  const pcx = pl.x + pl.w / 2; if (Math.abs(pl.y + pl.h - groundY()) > 30) return null;
  let best = null, bd = 22;
  for (const n of NPCS) { const d = Math.abs(pcx - npcWX(n)); if (d < bd) { bd = d; best = n; } }
  return best;
}
// names over the heads (only when you're close) and the "talk" hint, at screen resolution
function drawNpcLabels(cx, cy) {
  if (state !== 'play' || pl.dead || !SPR.vil) return;
  const gy = groundY(); sc.textAlign = 'center'; sc.textBaseline = 'middle';
  for (const n of NPCS) {
    const wx = npcWX(n), d = Math.abs(pl.x + pl.w / 2 - wx); if (d > 110 || Math.abs(pl.y + pl.h - gy) > 60) continue;
    const x = (wx - cx) * S, y = (gy - 30 - cy) * S, near = pl.nearNpc === n;
    sc.globalAlpha = clamp((110 - d) / 30, 0, 1); sc.lineWidth = Math.max(3, S); sc.strokeStyle = '#120d12';
    sc.font = `700 ${Math.round(S * 4)}px "Rubik", system-ui, sans-serif`; sc.strokeText(n.name, x, y); sc.fillStyle = '#ffd27a'; sc.fillText(n.name, x, y);
    sc.font = `600 ${Math.round(S * 3)}px "Rubik", system-ui, sans-serif`; sc.strokeText(n.role, x, y + S * 3.8); sc.fillStyle = '#c4b596'; sc.fillText(n.role, x, y + S * 3.8);
    if (near) { sc.font = `700 ${Math.round(S * 3.2)}px "Rubik", system-ui, sans-serif`; sc.strokeText('E  conversar', x, y - S * 4.6); sc.fillStyle = '#efe2c4'; sc.fillText('E  conversar', x, y - S * 4.6); }
    sc.globalAlpha = 1;
  }
  const sg = VIL_BUILD.find(v => v.k === 'sign'), [sx, sy] = bPos(sg), d = Math.abs(pl.x - sx);
  if (d < 90) { sc.globalAlpha = clamp((90 - d) / 30, 0, 1); sc.font = `700 ${Math.round(S * 3.2)}px "Rubik", system-ui, sans-serif`; const x = (sx + 14 - cx) * S, y = (sy - 4 - cy) * S; sc.lineWidth = Math.max(3, S); sc.strokeStyle = '#120d12'; sc.strokeText(CATEDRAL && !CAVERNA ? 'Catedral  →' : 'Cavernas  →', x, y); sc.fillStyle = '#efe2c4'; sc.fillText(CATEDRAL && !CAVERNA ? 'Catedral  →' : 'Cavernas  →', x, y); sc.globalAlpha = 1; }
}

/* ---- gold, prices and shops ---- */
// what the villagers pay for one of each thing you bring up (gear is priced from its stats instead)
const MAT_VAL = { carvao: 3, barra_cobre: 10, barra_ferro: 24, barra_ouro: 64, barra_cristal: 130, gel: 2, carne: 2, asa: 3, osso: 3, olho: 12, min_cobre: 4, min_ferro: 7, min_ouro: 14, min_cristal: 24, brasa: 10, presa: 10, chifre: 12, ectoplasma: 10, cranio: 10, tocha: 1, pocao: 10, candelabro: 8, tijolo: 1, madeira: 1 };
function itemValue(s) {
  const it = ITEMS[s.id]; if (!it.slot) return MAT_VAL[s.id] || 0;
  return gearValue(s);   // item level and rarity: js/48-itemizacao.js
}
const sellPrice = s => ITEMS[s.id].slot ? Math.max(1, Math.floor(itemValue(s) * 0.25)) : (MAT_VAL[s.id] || 0);
const SHOPS = {
  ferreiro: { title: 'Loja do Grimaldo', buys: id => !!ITEMS[id].slot || ['min_cobre', 'min_ferro', 'min_ouro', 'min_cristal', 'carvao', 'barra_cobre', 'barra_ferro', 'barra_ouro', 'barra_cristal', 'osso', 'chifre', 'presa', 'tijolo'].includes(id), hint: 'A mercadoria muda a cada dia. Compra equipamento, minério, carvão, barras, ossos, chifres e presas.' },
  curandeira: { title: 'Ervas da Marta', buys: id => ['gel', 'asa', 'olho', 'ectoplasma', 'brasa', 'cranio', 'carne', 'pocao'].includes(id), hint: 'Compra gel, asas, carne, olhos, ectoplasma, brasas e crânios.' },
  taverneiro: { title: 'Taverna do Odo', buys: id => ['madeira', 'carvao', 'tocha', 'candelabro'].includes(id), hint: 'Vende carvão para a sua fornalha. Compra madeira e carvão para a lareira, tochas e candelabros.' }
};
let shopDay = -1, stock = {}, talkNpc = null, shopNpc = null, sellArm = null, chatIdx = {}, questCarrasco = 0, bounty = null, villageNews = false, lastVil = null;
const dayNow = () => Math.floor(worldTime / DAY_LEN);
const tierNow = () => pl.lvl >= 12 ? 3 : pl.lvl >= 6 ? 2 : 1;
function restock() {
  shopDay = dayNow();
  const t = tierNow(), pick = a => a[Math.floor(Math.random() * a.length)], gear = [];
  for (let k = 0; k < 10; k++) { const tier = clamp(t - (Math.random() < 0.35 ? 1 : 0), 1, 3); const s = rollItem(pick(CHEST_LOOT[tier]), tier + (Math.random() < 0.25 ? 1 : 0), 'shop'); gear.push({ s, price: itemValue(s) }); }
  gear.sort((a, b) => ITEMS[a.s.id].slot.localeCompare(ITEMS[b.s.id].slot) || a.price - b.price);
  stock.ferreiro = gear;
  stock.curandeira = [{ s: { id: 'pocao', n: 1 }, price: 30, inf: true }];
  stock.taverneiro = [{ s: { id: 'carvao', n: 1 }, price: 8, inf: true }, { s: { id: 'tocha', n: 1 }, price: 4, inf: true }, { s: { id: 'candelabro', n: 1 }, price: 30, inf: true }];
}
const goldTxt = v => `${v} de ouro`;

/* ---- talking ---- */
const pickLine = a => a[Math.floor(Math.random() * a.length)];
function cryptDir() { if (!crypt) return 'em algum lugar'; return wdx(Math.round((crypt.x0 + crypt.x1) / 2) - SPX) > 0 ? 'à direita' : 'à esquerda'; }
const CHAT = {
  ferreiro: [
    (CAVERNA ? 'O ferro daqui vem das grutas debaixo da vila. Traga minério que eu pago bem, e pago na hora.' : 'O ferro daqui vem das Cavernas Rasas. Traga minério que eu pago bem, e pago na hora.'),
    'Machado empurra longe, lança mantém a distância, adaga é rápida e maça atordoa. Escolha conforme o bicho.',
    () => crypt ? 'Dizem que o machado do Carrasco corta escudo como se fosse pão. Só um aparo no tempo certo segura aquilo.' : (CAVERNA ? 'Primeiro vem terra e rocha, depois o ninho das aranhas. Mais embaixo ainda, pedra branca e uma catedral inteira enterrada nela.' : 'Pedra branca debaixo da vila, e uma catedral inteira enterrada nela. Quem diria.'),
    'Troco a mercadoria todo dia. O que não estiver bom hoje pode estar amanhã.',
    'Quanto mais fundo o baú, melhor o que tem dentro. E melhor o que eu consigo te vender depois.'
  ],
  curandeira: [
    'Gel de gosma e asa de morcego viram unguento. Ectoplasma... prefiro não contar o que vira.',
    'Levante o escudo um instante antes do golpe. Eu costuro bem menos gente que aprendeu isso.',
    'Se a vida passar de um terço, volte. Se cair de um terço, volte correndo.',
    'Não cobro para curar. Ninguém deveria pagar para continuar vivo.'
  ],
  taverneiro: [
    () => crypt ? `Um mineiro jurou que viu uma porta de pedra escura ${cryptDir()} da vila, lá nas Cavernas Profundas. Estava bêbado, mas era mineiro.` : 'Um mineiro jurou que ouviu um órgão tocando debaixo da praça. Estava bêbado, mas era mineiro.',
    'Nada lá de baixo sobe até a vila. A luz e as lanternas espantam tudo. Aqui você pode respirar.',
    'Dizem que quem ergue o escudo no último instante devolve até flecha de esqueleto.',
    'Espectro some e aparece. Se o golpe não pega, espere ele ficar visível de novo.',
    'Lava derrete tudo que cai nela. Inclusive aquela espada bonita que você não guardou.',
    'A Marta cura de graça. Diz que é vocação. Eu acho que ela gosta de ter com quem conversar.',
    'O velho Caetano paga por coisa que ninguém quer: osso, gel, asa de morcego. Fale com ele.'
  ],
  anciao: [
    'Antes da vila havia uma capela aqui. Os monges cavaram fundo demais procurando o que não deviam.',
    'O escuro lá embaixo não é só falta de luz. Tem coisa que se alimenta dele.',
    'Cada vez que alguém novo chega, o mundo embaixo da terra muda de lugar. Ninguém sabe por quê.'
  ]
};
const HELLO = {
  ferreiro: ['Bem-vindo à forja. Se o que você carrega não aguenta o que mora lá embaixo, eu tenho coisa melhor.', 'Fale rápido, o ferro esfria.', 'Voltou inteiro? Então a espada está fazendo o serviço.'],
  curandeira: ['Sente-se. Você está sangrando no meu chão.', 'Mais um arranhão para a coleção, imagino.', 'As ervas estão secando, e eu estou aqui. Em que posso ajudar?'],
  taverneiro: ['Entre, sente perto do fogo. Lá embaixo não tem fogo nenhum.', 'O de sempre? Tocha não mata sede, mas mata o escuro.', 'Ouviu os boatos de hoje? Eu ouvi todos.'],
  anciao: ['Ah, mais um que desce. Sente, escute um velho.', 'Os ossos me dizem que você voltou de longe.', 'Fique um pouco. A pressa é o que mais mata lá embaixo.']
};
function talkSay(text, opts) {
  $('talkText').textContent = text; hideQuest();
  const box = $('talkOpts'); box.innerHTML = '';
  opts.forEach(([label, fn, main], i) => { const b = document.createElement('button'); b.type = 'button'; b.className = main ? '' : 'ghost'; b.textContent = label; b.addEventListener('click', () => { sfx.select(); fn(); }); box.appendChild(b); });
}
function talkMenu(n, text) {
  const o = [];
  if (n.id === 'curandeira') o.push(['Curar ferimentos', () => heal(n), true]);
  if (n.id === 'ferreiro') o.push(['Fornalha e bigorna', () => openForge(n), true]);
  if (SHOPS[n.id]) o.push([n.id === 'taverneiro' ? 'Comprar carvão, tochas e velas' : 'Comprar e vender', () => openShop(n), n.id !== 'curandeira' && n.id !== 'ferreiro']);
  if (n.id === 'anciao') { o.push([bountyLabel(), () => bountyTalk(n), true]); if (crypt) o.push([crypt && crypt.bossDead && !questCarrasco ? 'A cripta · contar a vitória' : 'A cripta', () => cryptTalk(n), !!(crypt && crypt.bossDead && !questCarrasco)]); }
  o.push([n.id === 'taverneiro' ? 'Ouvir boatos' : 'Conversar', () => chat(n)]);
  o.push(['Até logo', closeTalk]);
  talkSay(text, o);
}
function chat(n) {
  const L = CHAT[n.id], i = chatIdx[n.id] = ((chatIdx[n.id] ?? -1) + 1) % L.length, line = L[i];
  talkMenu(n, typeof line === 'function' ? line() : line);
}
function heal(n) {
  if (pl.hp >= pl.maxHp) { talkMenu(n, 'Você está inteiro. Por enquanto.'); return; }
  pl.hp = pl.maxHp; sfx.potion(); burst(pl.x + pl.w / 2, pl.y + 10, 18, '#7dff8a', 50, -80, 0.8, 1, true);
  talkMenu(n, pickLine(['Pronto. Tente voltar inteiro da próxima vez.', 'Feito. Não precisa agradecer, só não morra.', 'Costurado. Fica uma cicatriz bonita.']));
}
function newBounty() {
  const t = tierNow(), last = bounty && bounty.id, pool = BOUNTIES.filter(b => b[0] <= t && b[0] >= t - 1 && b[1] !== last && (crypt || (b[1] !== 'chifre' && b[1] !== 'brasa'))), b = pool[Math.floor(Math.random() * pool.length)];
  bounty = { id: b[1], n: b[2], txt: b[3], title: b[4], gold: Math.round(MAT_VAL[b[1]] * b[2] * 2 + 20 * b[0]), xp: Math.max(12, Math.round(xpNeed(pl.lvl) * 0.35)) };
}
const BOUNTIES = [
  [1, 'osso', 8, 'Ossos para o ossuário da capela velha. Os mortos daqui merecem descanso.', 'O ossuário da capela'],
  [1, 'gel', 10, 'Gel de gosma. A Marta faz unguento com isso, e meus joelhos agradecem.', 'Unguento para os joelhos'],
  [1, 'asa', 6, 'Asas de morcego. Para um estudo. Não pergunte qual.', 'Um estudo sobre asas'],
  [1, 'min_cobre', 10, 'Cobre para o sino da capela, que rachou no último inverno.', 'O sino rachado'],
  [1, 'carne', 6, 'Carne podre. Serve de isca para manter os lobos longe dos rebanhos.', 'Isca para os lobos'],
  [2, 'min_ferro', 10, 'Ferro para o Grimaldo forjar uma grade nova para o poço.', 'Uma grade para o poço'],
  [2, 'olho', 3, 'Olhos sombrios. Quero entender o que nos observa lá de baixo.', 'O que nos observa'],
  [2, 'ectoplasma', 4, 'Ectoplasma. Os espectros guardam memórias, e eu quero ler algumas.', 'Memórias de espectro'],
  [2, 'osso', 20, 'Mais ossos. Muitos mais. O ossuário é grande.', 'O ossuário é grande'],
  [3, 'min_ouro', 6, 'Ouro bruto. A vila precisa atravessar o inverno.', 'Ouro para o inverno'],
  [3, 'min_cristal', 4, 'Cristal das profundezas. Ele canta, sabia? Quero ouvir de perto.', 'O cristal que canta'],
  [3, 'cranio', 4, 'Crânios em brasa. Quero saber que fogo os mantém acordados.', 'O fogo dos crânios'],
  [3, 'chifre', 3, 'Chifres de demônio. A prova de que a cripta está sendo limpa.', 'Prova de limpeza'],
  [3, 'brasa', 5, 'Brasas infernais. Fogo que não apaga aquece muita casa.', 'Fogo que não apaga']
];
// the elder's task as a quest card: his words above, then what to bring, how many you have, where it drops, and the pay
function bountyQuest() {
  const have = countItem(bounty.id), ready = have >= bounty.n, b = BOUNTIES.find(r => r[1] === bounty.id && r[2] === bounty.n);
  return {
    kind: 'Tarefa do ancião', title: bounty.title || (b && b[4]) || ITEMS[bounty.id].name, state: ready ? 'ready' : 'open',
    goals: [{ icon: bounty.id, name: `Trazer ${ITEMS[bounty.id].name.toLowerCase()}`, have, need: bounty.n, where: whereFrom(bounty.id) }],
    rewards: [{ icon: 'ouro', text: goldTxt(bounty.gold) }, { icon: 'xp', text: `${bounty.xp} de experiência` }],
    note: ready ? 'Você já tem tudo. Entregue ao Caetano.' : `Faltam ${bounty.n - have}. O que você trouxer fica na mochila até entregar.`
  };
}
function bountyLabel() { if (!bounty) return 'Tarefa'; const h = Math.min(countItem(bounty.id), bounty.n); return h >= bounty.n ? 'Tarefa · pronta' : `Tarefa · ${h}/${bounty.n}`; }
function bountyTalk(n) {
  if (!bounty) newBounty();
  const q = bountyQuest(), back = ['Voltar', () => talkMenu(n, pickLine(HELLO.anciao))];
  if (q.state === 'ready') {
    talkSay(`${bounty.txt} Vejo que você trouxe.`, [['Entregar', () => {
      removeItem(bounty.id, bounty.n); pl.gold += bounty.gold; gainXP(bounty.xp); sfx.coin(); sfx.chest();
      toast(`Tarefa cumprida: +${goldTxt(bounty.gold)} · +${bounty.xp} XP`, 'gold');
      bounty = null; saveGame(); talkMenu(n, 'Obrigado. A vila não esquece quem ajuda. Volte quando quiser outra tarefa.');
    }, true], back]);
  } else talkSay(bounty.txt, [back]);
  showQuest(q);
}
// the Carrasco, as a quest card too; the reward is paid when you come back and tell him
const CARRASCO_GOLD = 400, carrascoXP = () => Math.round(xpNeed(pl.lvl) * 0.5);
function carrascoQuest() {
  const dead = !!(crypt && crypt.bossDead);
  return {
    kind: 'Missão do ancião', title: 'O guardião da cripta', state: questCarrasco ? 'done' : dead ? 'ready' : 'open',
    goals: [{ icon: 'boss', name: 'Derrotar o Carrasco', have: dead ? 1 : 0, need: 1, where: `Na cripta das Cavernas Profundas, ${cryptDir()} do vilarejo` }],
    rewards: [{ icon: 'ouro', text: goldTxt(CARRASCO_GOLD) }, { icon: 'xp', text: `${carrascoXP()} de experiência` }],
    note: questCarrasco ? 'A vila já pagou o que juntou.' : dead ? 'Conte a ele o que aconteceu para receber.' : 'Um monge que não morreu direito. Vá preparado.'
  };
}
function cryptTalk(n) {
  const q = carrascoQuest(), back = ['Voltar', () => talkMenu(n, pickLine(HELLO.anciao))];
  if (q.state === 'ready') talkSay('Você voltou. E o frio parou de subir pelo poço... Diga, o que aconteceu lá embaixo?', [['Contar que o Carrasco caiu', () => {
    questCarrasco = 1; const xp = carrascoXP(); pl.gold += CARRASCO_GOLD; gainXP(xp); sfx.chest(); sfx.coin();
    toast(`O Carrasco caiu: +${goldTxt(CARRASCO_GOLD)} · +${xp} XP`, 'gold'); saveGame();
    talkMenu(n, `Você... conseguiu. Tome, é tudo que a vila juntou: ${goldTxt(CARRASCO_GOLD)}.`);
  }, true], back]);
  else if (q.state === 'done') talkSay('O Carrasco caiu, mas a cripta era só a porta. Há algo mais fundo, no Abismo. Algo que observa de volta.', [back]);
  else talkSay('Embaixo daqui, nas Cavernas Profundas, dorme uma cripta mais velha que a vila. Quem guarda a porta é o Carrasco. Se você o derrubar, volte e me conte.', [back]);
  showQuest(q);
}
function openTalk(n) {
  if (state !== 'play' || pl.dead) return;
  talkNpc = n; n.attend = true; state = 'talk'; mouse.l = mouse.r = false; pl.shieldOn = false; pl.atkT = -1; pl.mining = false;
  $('talkName').textContent = n.name; $('talkRole').textContent = n.role;
  const cv = $('talkCv'), x = cv.getContext('2d'); n.facing = 1; compose(npcPose(n)); x.clearRect(0, 0, 48, 44); x.drawImage(comp, OX - 8, OY - 4, 28, 26, 0, 0, 48, 44.6);
  setNpcTheme(n); $('talk').hidden = false; $('shop').hidden = true; sfx.talk();
  talkMenu(n, pickLine(HELLO[n.id]));
  const b = $('talkOpts').querySelector('button'); if (b) b.focus();
}
function closeTalk() { setNpcTheme(null); cancelHeld(); endDrag(); hideTip(); if (invBuilt) dockInv(false); $('talk').hidden = true; $('shop').hidden = true; $('forge').hidden = true; forgeNpc = null; hideShopTip(); talkNpc = shopNpc = null; sellArm = null; state = 'play'; pressed.KeyE = false; last = performance.now(); saveTimer = Math.min(saveTimer, 1); }
