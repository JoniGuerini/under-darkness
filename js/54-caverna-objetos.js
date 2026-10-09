'use strict';

/* ================= the caves: props =================
   Everything bigger than a block that dresses the caves. On the floor: big stalagmites, a fallen boulder, a
   crystal druse that gives a cold lilac light, clumps of mushrooms (one kind glows), a dead explorer with his
   lamp still lit, a fallen root, spider eggs, a carcass wrapped in web and, down in the Fundações, dressed
   stones fallen from the cathedral above. From the ceiling: big stalactites, curtains of roots, big cocoons
   (one with somebody inside) and a cluster of sleeping bats. On the back wall: a calcite curtain, a vein of
   crystal, cave paintings (the hunters, and the great spider), a fossil, a sheet of web and a carved arch
   half buried. Same 7-tone ramps lit from the top left and dark rim as 43-catedral-objetos; registered with
   defProp, placed by 56-caverna-mundo (CV_PROP_PLAN). */
const CV_PROP_PLAN = {};
{
const { cg, cn } = CVART;
const R7 = hexes => hexes.map(h => ph(h));
const RP = {
  rocha: R7(['#171513', '#26221f', '#3a3430', '#4f4842', '#655c54', '#7c7268', '#968a7e']),
  calcita: R7(['#2a2318', '#4a3e2e', '#6e5e48', '#927e62', '#b3a07e', '#cfbd9a', '#e6d8ba']),
  terra: R7(['#140d08', '#24170e', '#382516', '#4e3520', '#64472d', '#7a5a3c', '#94704e']),
  raiz: R7(['#140c07', '#24170d', '#382515', '#4d3520', '#64472d', '#7c5a3a', '#94704c']),
  cogu: R7(['#1a0f08', '#33200f', '#523418', '#704a24', '#8e6234', '#ad7e48', '#c89a62']),
  caule: R7(['#2a241a', '#3a3226', '#5e5442', '#857a64', '#aaa088', '#cdc4ac', '#e4dcc6']),
  luzcogu: R7(['#06181c', '#0c2a30', '#124248', '#1a6068', '#2a8a92', '#4ab8c0', '#9ae8ee']),
  drusa: R7(['#160a2a', '#2a1650', '#43267a', '#6440a8', '#8a66d0', '#b494ec', '#e4d6ff']),
  osso: R7(['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']),
  seda: R7(['#2e2e36', '#4a4a54', '#6a6a76', '#8c8c98', '#aeaeb8', '#ceced6', '#ececf2']),
  sombra: R7(['#050406', '#08070a', '#0c0a0e', '#100e13', '#151218', '#1a171e', '#201c24']),
  ferro: R7(['#0c0c0f', '#141418', '#24252b', '#383a42', '#50535d', '#6e727e', '#9298a4']),
  ferrugem: R7(['#1a0c06', '#2a140a', '#4a2412', '#6e3a1c', '#8e5228', '#a86a36', '#c08850']),
  vidro: R7(['#3a2a10', '#6a4a18', '#a8782a', '#d8a848', '#f0cc70', '#fae4a0', '#fff6d8']),
  couro: R7(['#120a06', '#1e120a', '#2e1c10', '#422a18', '#583822', '#6e4a2e', '#86603e']),
  pano: R7(['#1a1814', '#2a261e', '#3e382c', '#5a5240', '#7a7058', '#9a8e72', '#b8ac8c']),
  ocre: R7(['#2a120a', '#46200f', '#6a3218', '#8e4622', '#ae5c2e', '#c8783e', '#dc9656']),
  carvao: R7(['#08080a', '#0e0e10', '#161618', '#1e1e22', '#28282c', '#323236', '#3e3e44']),
  ovo: R7(['#2c2a20', '#46422e', '#666046', '#8a8262', '#aaa282', '#c8c0a0', '#e2dcc0']),
  morcego: R7(['#0a0608', '#140c10', '#20141a', '#2c1c24', '#3a262e', '#4a323a', '#5c4048']),
  cantaria: R7(['#24221f', '#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3']),
  fossil: R7(['#2a2216', '#463a26', '#6a5a3c', '#8e7c56', '#ae9c74', '#cab892', '#e2d4b0'])
};
const OUTLINE = ph('#0e0a08');

/* ---- the painter (same as 43's): a w x h buffer of packed colours, each pixel remembers its ramp for the rim ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[y * w + x] = idOf(R); },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 3.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.6 : j === 1 ? 0.6 : 0) + (i === 0 ? 0.7 : 0) - (j === rh - 1 ? 1.6 : 0) - (i === rw - 1 ? 1.1 : 0) + cg(x, y, s) * 0.55 + cn(x, y, 60, 60, s + 1) * 0.5); },
    blob(cx, cy, rx, ry, R, s, base = 3.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1.2 - (dx + dy) * 1.3 - d * 0.6 + cg(x, y, s) * 0.45); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    done(rim = true) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const k = y * w + x; if (src[k]) continue;
          let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
          if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUTLINE;
        }
      }
      const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return cv;
    }
  };
  return P;
}
// a cone of dripstone w wide at its root, len long, hanging (tip down) or standing (tip up), lit from the left, ringed
function cone(P, cx, y0, w, len, hang, R, s, base = 3.4) {
  for (let k = 0; k < len; k++) {
    const t = k / len, half = Math.max(0.5, (1 - Math.pow(t, 0.75)) * w / 2 + Math.sin(k * 0.7 + s) * 0.35), y = hang ? y0 + k : y0 - k, c = cx + Math.sin(t * 2.6 + s) * 0.8;
    for (let x = Math.floor(c - half); x <= Math.ceil(c + half) - 1; x++) {
      const u = (x + 0.5 - (c - half)) / (2 * half);
      P.put(x, y, R, base + 1.8 - u * 3.2 - Math.pow(Math.abs(u - 0.3) * 2, 3) * 0.4 + (k % 4 === (s & 3) ? 0.45 : 0) + cg(x, y, s) * 0.5 + (t > 0.88 ? 0.9 : 0));
    }
  }
}

/* =============================== FLOOR =============================== */
function bigStalagmite(k) {   // 18 x 34 or 14 x 24: a main cone with a smaller one leaning on it, a wet calcite cap
  const w = k ? 14 : 18, h = k ? 24 : 34, P = painter(w, h), s = 3101 + k * 7;
  cone(P, w * 0.42, h - 1, w * 0.62, h - 1, false, RP.rocha, s);
  cone(P, w * 0.78, h - 1, w * 0.36, h * 0.48, false, RP.rocha, s + 3, 3.0);
  for (let y = 0; y < h * 0.35; y++) for (let x = 0; x < w; x++) if (P.has(x, y) && cg(x, y, s + 9) > -0.2) P.put(x, y, RP.calcita, 4 + cg(x, y, s + 5) * 1.4 - (x - w * 0.42) * 0.25);   // flowstone cap
  for (let x = 0; x < w; x++) P.put(x, h - 1, RP.rocha, 1.2 + cg(x, 0, s) * 0.6);   // its foot in the floor
  return P.done();
}
function boulder() {   // 24 x 15: a fallen block of rock, cracked, a little moss, rubble at its foot
  const P = painter(24, 15), s = 3121;
  P.blob(11, 8.5, 10, 6.8, RP.rocha, s, 3.3);
  for (let y = 0; y < 15; y++) for (let x = 0; x < 24; x++) if (P.has(x, y) && Math.abs(cn(x, y, 10, 10, s + 1)) < 0.03) P.put(x, y, RP.rocha, 0.9);   // cracks
  for (let x = 4; x < 16; x++) for (let y = 1; y < 6; y++) if (P.has(x, y) && !P.has(x, y - 2) && hash2(x, y, s + 2) < 0.6) P.put(x, y, RP.rocha, 5.4);   // lit top
  P.blob(20.5, 12.5, 3, 2.4, RP.rocha, s + 3, 2.6); P.blob(2.5, 13, 2.2, 1.8, RP.rocha, s + 4, 3);
  for (let x = 0; x < 24; x++) if (P.has(x, 14)) P.put(x, 14, RP.rocha, 1.3);
  return P.done();
}
function bigDruse() {   // 22 x 17: a geode cracked open, a crown of lilac crystals in a rind of rock
  const P = painter(22, 17), s = 3141;
  P.blob(11, 12, 10.5, 5.5, RP.rocha, s, 2.8);
  P.blob(11, 12.4, 7.4, 3.8, RP.sombra, s, 3);   // the hollow
  const pts = [[4, 13, -0.75, 6], [6.5, 13, -0.4, 9], [9, 14, -0.12, 12], [11.5, 14, 0.08, 14], [14, 14, 0.3, 10], [16.5, 13, 0.55, 8], [18, 13, 0.9, 5], [8, 15, -0.9, 4], [14.5, 15, 1.05, 4]];
  for (const [bx, by, ang, len] of pts) {
    const ux = Math.sin(ang), uy = -Math.cos(ang), wd = len > 9 ? 1.9 : 1.4;
    for (let y = 0; y < 17; y++) for (let x = 0; x < 22; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - by, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const ww = wd * Math.min(1, (len - al) / 2.2); if (Math.abs(pe) > ww) continue;
      P.put(x, y, RP.drusa, (pe < -ww * 0.3 ? 5 : pe > ww * 0.3 ? 2.6 : 6) - (al < 1.5 ? 1.6 : 0) + (al > len - 1.5 ? 0.4 : 0));
    }
  }
  for (let x = 0; x < 22; x++) if (P.has(x, 16)) P.put(x, 16, RP.rocha, 1.2);
  return P.done();
}
function mushClump(glow) {   // 24 x 16: a clump of cave mushrooms of every size; the glowing kind is pale cyan
  const P = painter(24, 16), s = 3161 + glow * 5, C = glow ? RP.luzcogu : RP.cogu;
  const shrooms = glow ? [[5, 9, 3.4], [11, 13, 4.6], [17, 7, 3], [20.5, 4, 2], [2, 4, 1.8], [14.5, 3, 1.6]] : [[4, 7, 3.2], [10, 12, 5], [16, 9, 3.8], [21, 4, 2.2], [7, 3, 1.6], [13.5, 4, 1.8]];
  for (const [cx, hgt, r] of shrooms) {
    const top = 16 - hgt;
    for (let y = top; y < 16; y++) for (let x = Math.round(cx - r * 0.22 - 0.5); x <= Math.round(cx + r * 0.22); x++) P.put(x, y, RP.caule, 4.4 - (x - cx) * 1.2 + cg(x, y, s) * 0.5 - (y - top) * 0.08);
    for (let y = Math.floor(top - r * 0.75); y <= top; y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - top) / (r * 0.75); if (dx * dx + dy * dy > 1 || y > top) continue;
      let v = 4.6 - (dx + dy) * 1.5 + cg(x, y, s + 1) * 0.5; if (y === top) v = glow ? 3 : 1.2;
      if (!glow && hash2(x, y, s + 2) < 0.12 && y < top) v += 1.6; if (glow && hash2(x, y, s + 3) < 0.15) v = 6;
      P.put(x, y, C, v);
    }
  }
  for (let x = 0; x < 24; x++) if (P.has(x, 15)) P.put(x, 15, RP.terra, 2 + cg(x, 0, s) * 0.8);
  return P.done();
}
function deadExplorer() {   // 30 x 13: a skeleton slumped on its pack, the rusty lamp still burning beside it
  const P = painter(30, 13), s = 3181;
  P.blob(7, 8.5, 6.5, 4.2, RP.couro, s, 3);                      // the pack
  P.line(2, 6, 12, 5, RP.couro, 1.5); P.line(3, 9, 11, 9, RP.couro, 1.6);   // straps
  P.rect(10, 3, 3, 9, RP.madeira || RP.raiz, (i, j) => 4 - i * 1.2); // a pick handle across it
  P.line(9, 2, 15, 3, RP.ferro, (t) => 4.5 - t * 2, 2);
  P.blob(16, 5, 2.6, 2.4, RP.osso, s + 1, 4);                    // skull
  P.put(15, 5, RP.sombra, 1); P.put(17, 5, RP.sombra, 1); P.put(16, 7, RP.sombra, 2);
  for (let i = 0; i < 4; i++) P.line(15 + i * 1.5, 8, 14 + i * 1.5, 11, RP.osso, 3.8 - i * 0.3);   // ribs
  P.line(14, 8, 20, 8, RP.osso, 4.2);
  P.line(19, 9, 25, 11, RP.osso, 4.4); P.line(20, 10, 26, 12, RP.osso, 3.6);   // legs
  P.line(13, 7, 11, 11, RP.osso, 3.8);                              // an arm
  P.rect(25, 4, 4, 1, RP.ferrugem, () => 4); P.rect(25, 5, 4, 5, RP.vidro, (i, j) => 5 - i * 0.6 + (j === 2 ? 0.8 : 0)); P.rect(25, 10, 4, 2, RP.ferrugem, (i, j) => 3.4 - i * 0.6 - j);   // the lamp
  P.put(26, 3, RP.ferrugem, 3); P.put(27, 3, RP.ferrugem, 3); P.put(26, 7, RP.vidro, 6); P.put(27, 7, RP.vidro, 6);
  for (let x = 0; x < 30; x++) if (P.has(x, 12)) P.put(x, 12, RP.terra, 1.6);
  return P.done();
}
function fallenRoot() {   // 34 x 9: a thick root torn from the roof, lying in a curve with its hair of rootlets
  const P = painter(34, 9), s = 3201;
  for (let x = 1; x < 33; x++) { const cy = 5 + Math.sin(x * 0.18) * 1.4, r = 2.2 - x * 0.04; for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) { const u = (y + 0.5 - (cy - r)) / (2 * r); if (u < 0 || u > 1) continue; P.put(x, y, RP.raiz, 5 - u * 3.6 + cg(x, y, s) * 0.6 + (Math.abs(cn(x, y, 6, 2, s)) < 0.05 ? -1.2 : 0)); } }
  for (let k = 0; k < 9; k++) { const x0 = 3 + k * 3.4, y0 = 5 + Math.sin(x0 * 0.18) * 1.4; P.line(x0, y0 + 1, x0 + (hash2(k, 0, s) - 0.5) * 5, 8.5, RP.raiz, 2.2); }
  P.blob(32, 5, 1.6, 2.6, RP.raiz, s + 4, 2.4);   // the broken end
  return P.done();
}
function spiderEggs() {   // 22 x 11: a heap of pale eggs glued with silk, one hatched and torn open
  const P = painter(22, 11), s = 3221;
  const eggs = [[4, 8, 2.6], [8.5, 8, 3], [13, 8.5, 2.8], [17.5, 8.5, 2.6], [6.5, 4.5, 2.4], [11, 4.2, 2.6], [15.5, 5, 2.2], [9, 1.8, 1.8]];
  for (const [cx, cy, r] of eggs) P.blob(cx, cy, r, r * 0.92, RP.ovo, s + cx, 3.6);
  P.blob(17.5, 8, 1.6, 1.4, RP.sombra, s, 2.6);   // the torn one
  for (let k = 0; k < 7; k++) { const a = hash2(k, 1, s) * 22, b = hash2(k, 2, s) * 22; P.line(a, hash2(k, 3, s) * 10, b, hash2(k, 4, s) * 10, RP.seda, 5.5); }
  for (let x = 1; x < 21; x++) P.put(x, 10, RP.seda, 2.4 + cg(x, 0, s));
  return P.done();
}
function webCarcass() {   // 24 x 15: something big wrapped tight in silk and left on the floor, a hoof showing
  const P = painter(24, 15), s = 3241;
  for (let y = 2; y < 15; y++) for (let x = 1; x < 23; x++) { const dx = (x + 0.5 - 12) / 11, dy = (y + 0.5 - 9) / 6.2; if (dx * dx + dy * dy > 1) continue; P.put(x, y, RP.seda, 4.2 - (dx + dy) * 1.2 + (((x + y * 2 + s) % 4) === 0 ? -1.4 : 0) + cg(x, y, s) * 0.5); }
  P.rect(1, 9, 3, 2, RP.couro, (i, j) => 3 - j); P.rect(0, 11, 2, 2, RP.sombra, () => 3);   // the hoof
  for (const [x, y] of [[9, 6], [13, 7], [16, 10]]) P.put(x, y, RP.couro, 2);   // the hide under the threads
  for (let k = 0; k < 5; k++) P.line(2 + k * 4.5, 3 + hash2(k, 0, s) * 3, 1 + k * 5, 14, RP.seda, 5.4);
  return P.done();
}
function dressedStone(k) {   // 26 x 13 or 20 x 15: masonry fallen from the cathedral above, the edge of a moulding still on it
  const w = k ? 20 : 26, h = k ? 15 : 13, P = painter(w, h), s = 3261 + k;
  if (!k) { P.box(1, 3, 22, 10, RP.cantaria, s, 3.4); P.rect(1, 5, 22, 1, RP.cantaria, () => 2); P.rect(1, 3, 22, 2, RP.cantaria, (i) => 5 - i * 0.04); P.box(19, 7, 6, 6, RP.cantaria, s + 1, 3); }
  else { P.box(2, 1, 14, 14, RP.cantaria, s, 3.2); for (let y = 3; y < 13; y += 3) P.rect(4, y, 10, 1, RP.cantaria, () => 2.2); P.box(14, 9, 6, 6, RP.cantaria, s + 1, 2.8); }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (P.has(x, y) && Math.abs(cn(x, y, 8, 8, s + 2)) < 0.03) P.put(x, y, RP.cantaria, 1.2);
  for (let x = 0; x < w; x++) if (P.has(x, h - 1)) P.put(x, h - 1, RP.cantaria, 1.4);
  return P.done();
}

/* =============================== CEILING =============================== */
function bigStalactite(k) {   // 18 x 34 or 12 x 22: a cluster of hanging cones, the longest one dripping
  const w = k ? 12 : 18, h = k ? 22 : 34, P = painter(w, h), s = 3301 + k * 3;
  for (let x = 0; x < w; x++) P.put(x, 0, RP.rocha, 2 + cg(x, 0, s));
  cone(P, w * 0.45, 0, w * 0.62, h - 3, true, RP.rocha, s);
  cone(P, w * 0.16, 0, w * 0.3, h * 0.42, true, RP.rocha, s + 1, 3);
  cone(P, w * 0.82, 0, w * 0.32, h * 0.55, true, RP.rocha, s + 2, 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (P.has(x, y) && y > h * 0.55 && cg(x, y, s + 4) > -0.1) P.put(x, y, RP.calcita, 3.4 + cg(x, y, s + 5) * 1.2 - (x - w * 0.45) * 0.3);   // wet calcite towards the tip
  P.put(Math.round(w * 0.45 + Math.sin(2.6 + s) * 0.8), h - 1, RP.calcita, 6);   // the drop
  return P.done();
}
function rootCurtain() {   // 28 x 24: roots from the soil above hanging down, tangled, some with tips of dirt
  const P = painter(28, 24), s = 3321;
  for (let x = 0; x < 28; x++) for (let y = 0; y < 2; y++) P.put(x, y, RP.terra, 2.6 + cg(x, y, s) * 0.8 - y);
  for (let k = 0; k < 13; k++) {
    let x = 1 + k * 2.1 + hash2(k, 0, s) * 1.5; const len = 8 + hash2(k, 1, s) * 15, th = k % 4 === 0 ? 2 : 1;
    for (let y = 1; y < len; y++) { x += Math.sin(y * 0.5 + k) * 0.35; for (let i = 0; i < th; i++) P.put(x + i, y, RP.raiz, 4.4 - i * 1.6 - y / len * 1.2 + cg(x, y, s + k) * 0.6); }
    if (hash2(k, 2, s) < 0.35) P.blob(x + 0.5, len, 1.3, 1.6, RP.terra, s + k, 3);   // a clod still stuck at the tip
    if (hash2(k, 3, s) < 0.5) for (let j = 0; j < 4; j++) P.put(x + 1 + j * 0.6, len * 0.5 + j, RP.raiz, 2.4);   // a side rootlet
  }
  return P.done();
}
function bigCocoon(k) {   // 14 x 28: a big cocoon on a twisted thread; k=1 has a face pressed against the silk
  const P = painter(14, 28), s = 3341 + k;
  for (let y = 0; y < 7; y++) P.put(7 + Math.sin(y * 0.9) * 0.6, y, RP.seda, 4.4);
  for (let y = 6; y < 28; y++) { const t = (y - 6) / 21, half = Math.sin(Math.min(1, t * 1.1) * Math.PI) * 5.6 + 0.6; for (let x = Math.floor(7 - half); x <= Math.ceil(7 + half) - 1; x++) { const u = (x + 0.5 - (7 - half)) / (2 * half); P.put(x, y, RP.seda, 4.8 - u * 2.6 + (((y * 3 + x * 2 + s) % 7) < 1 ? -1.4 : 0) + cg(x, y, s) * 0.5); } }
  if (k) {   // a face, a hand
    P.blob(7, 12, 2.6, 2.6, RP.osso, s, 3.2); P.put(6, 12, RP.sombra, 1); P.put(8, 12, RP.sombra, 1); P.put(7, 14, RP.sombra, 2);
    for (let y = 9; y < 16; y++) if (y % 2) P.put(5 + (y % 3), y, RP.seda, 5);
    P.rect(10, 18, 2, 3, RP.osso, (i, j) => 4 - j * 0.6);
  }
  return P.done();
}
function roostingBats() {   // 22 x 11: four bats asleep upside down, wings wrapped (scenery only)
  const P = painter(22, 11), s = 3361;
  for (let x = 0; x < 22; x++) P.put(x, 0, RP.rocha, 2 + cg(x, 0, s));
  const bats = [[3.5, 7], [8.5, 9], [13.5, 6.5], [18, 8.5]];
  for (const [cx, len] of bats) {
    P.put(cx - 1, 1, RP.osso, 2.4); P.put(cx + 0.5, 1, RP.osso, 2.4);   // claws
    for (let y = 2; y < len; y++) { const half = 1.4 + Math.sin((y - 2) / (len - 2) * Math.PI) * 0.9; for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half) - 1; x++) P.put(x, y, RP.morcego, 3.8 - (x + 0.5 - cx + half) / (2 * half) * 2.6 + ((y + x) % 3 === 0 ? 0.6 : 0)); }
    P.put(cx - 1, len, RP.morcego, 2.6); P.put(cx, len, RP.morcego, 2.6); P.put(cx - 1.5, len + 1, RP.morcego, 3.4); P.put(cx + 0.5, len + 1, RP.morcego, 3.4);   // the head, ears down
  }
  return P.done();
}

/* =============================== BACK WALL =============================== */
function calciteCurtain() {   // 26 x 38: flowstone poured down the wall in folds, pooling at the bottom
  const P = painter(26, 38), s = 3401;
  for (let y = 0; y < 38; y++) {
    const spread = y < 30 ? 7 + y * 0.18 : 12.5 + (y - 30) * 0.15, cx = 13 + Math.sin(y * 0.08) * 1.2;
    for (let x = 0; x < 26; x++) {
      const dx = x + 0.5 - cx; if (Math.abs(dx) > spread) continue;
      const fold = Math.sin((dx + cn(x, y, 4, 2, s) * 6) * 1.3);
      let v = 3.6 + fold * 1.1 - Math.abs(dx) / spread * 1.2 + cg(x, y, s) * 0.4;
      if (y > 33) v = 4 - (y - 33) * 0.4 + cg(x, y, s + 1) * 0.6 + ((x + y) % 4 === 0 ? 0.8 : 0);
      if (y < 30 && Math.abs(dx) > spread - 1.4 && (y * 7 + x) % 9 < 3) continue;   // ragged edges where it thins out
      P.put(x, y, RP.calcita, v);
    }
  }
  for (let k = 0; k < 5; k++) { const x = 6 + k * 3.4, len = 3 + hash2(k, 0, s) * 4; for (let j = 0; j < len; j++) P.put(x, 32 + j * 0.3, RP.calcita, 5.6); }
  return P.done();
}
function crystalVein() {   // 28 x 18: a seam of violet crystal glittering in the rock face (gives a faint light)
  const P = painter(28, 18), s = 3421;
  for (let x = 0; x < 28; x++) { const cy = 9 + Math.sin(x * 0.22 + 1) * 3.2, th = 2.2 + Math.sin(x * 0.4) * 0.8; for (let y = Math.floor(cy - th - 1.5); y <= cy + th + 1.5; y++) P.put(x, y, RP.rocha, 2.6 + cg(x, y, s) * 0.8 - Math.abs(y - cy) * 0.2); for (let y = Math.floor(cy - th); y <= cy + th; y++) P.put(x, y, RP.drusa, 3.2 + cg(x, y, s + 1) * 1.6 + (y < cy ? 1 : -0.6)); }
  const pts = [[5, 1], [9, -1], [13, 1], [16, -1], [20, 1], [24, -1]];
  for (const [x, dir] of pts) { const cy = 9 + Math.sin(x * 0.22 + 1) * 3.2; for (let k = 0; k < 4; k++) { P.put(x, cy + dir * (2 + k), RP.drusa, 6 - k * 0.6); if (k < 2) P.put(x + 1, cy + dir * (2 + k), RP.drusa, 3.8); } }
  return P.done(false);
}
function cavePainting(k) {   // 42 x 22: ochre and soot on the rock: k=0 a hunt (stick men, a deer, spears), k=1 the great spider over little men
  const P = painter(42, 22), s = 3441 + k, fade = (x, y) => hash2(x, y, s) < 0.22;   // worn away in places
  const dot = (x, y, R, v) => { if (!fade(x | 0, y | 0)) P.put(x, y, R, v + cg(x, y, s) * 0.6); };
  const man = (x, y, R, sp) => { for (let j = 0; j < 4; j++) dot(x, y + j, R, 3.6); dot(x, y - 1, R, 4); dot(x - 1, y + 1, R, 3.4); dot(x + 1, y + 1, R, 3.4); dot(x - 1, y + 4, R, 3.4); dot(x + 1, y + 5, R, 3.4); dot(x + 1, y + 4, R, 3.4); if (sp) for (let i = 0; i < 5; i++) dot(x + 2 + i, y - 1 + i * 0.4, RP.carvao, 4); };
  if (!k) {
    // a deer
    for (let x = 22; x < 33; x++) for (let y = 8; y < 12; y++) if (Math.abs(x - 27.5) / 5.5 + Math.abs(y - 10) / 2.4 < 1.15) dot(x, y, RP.ocre, 3.6);
    for (const lx of [23, 25, 30, 32]) for (let y = 12; y < 16; y++) dot(lx, y, RP.ocre, 3.4);
    for (let y = 5; y < 9; y++) dot(33, y, RP.ocre, 3.4); dot(34, 5, RP.ocre, 3.6); dot(35, 5, RP.ocre, 3.6);
    for (const [ax, ay] of [[32, 4], [31, 3], [33, 2], [34, 3], [35, 2]]) dot(ax, ay, RP.carvao, 4.2);   // antlers
    man(6, 10, RP.carvao, 1); man(13, 9, RP.carvao, 1); man(17, 12, RP.ocre, 0);
    for (let x = 4; x < 38; x += 2) dot(x, 18, RP.ocre, 3);   // the ground line
    for (const [hx, hy] of [[38, 4], [3, 3]]) { for (let a = 0; a < 6.2; a += 0.7) dot(hx + Math.cos(a) * 1.6, hy + Math.sin(a) * 1.6, RP.ocre, 4); dot(hx, hy, RP.ocre, 4.4); }   // two hand prints
  } else {
    // the great spider: body, eight bent legs
    for (let x = 14; x < 28; x++) for (let y = 2; y < 12; y++) { const a = Math.hypot((x - 21) / 4.5, (y - 8) / 3.6), b = Math.hypot((x - 21) / 3, (y - 3.5) / 2.2); if (a < 1 || b < 1) dot(x, y, RP.carvao, 3.6 + (a < 0.5 ? 0.6 : 0)); }
    for (let i = 0; i < 4; i++) for (const d of [-1, 1]) { const kx = 21 + d * (6 + i * 2.2), ky = 2 + i * 1.5; P.line(21 + d * 3, 6 + i * 0.8, kx, ky, RP.carvao, 3.4); P.line(kx, ky, kx + d * 2.5, 12 + i * 1.4, RP.carvao, 3.4); }
    dot(20, 5, RP.ocre, 5); dot(22, 5, RP.ocre, 5);   // eyes in ochre
    man(5, 14, RP.ocre, 1); man(10, 15, RP.ocre, 0); man(33, 14, RP.ocre, 1); man(37, 15, RP.ocre, 0);
    for (let x = 2; x < 41; x += 2) dot(x, 20.5, RP.ocre, 3);
    for (let y = 0; y < 22; y++) for (let x = 0; x < 42; x++) if (fade(x, y) && P.has(x, y) && hash2(x, y, s + 9) < 0.5) P.clear(x, y);
  }
  return P.done(false);
}
function fossil() {   // 28 x 16: a long-dead creature in the rock: a coiled shell and a spine of vertebrae
  const P = painter(28, 16), s = 3461;
  for (let a = 0; a < 15; a += 0.08) { const r = 0.4 + a * 0.42, x = 7 + Math.cos(a) * r, y = 8 + Math.sin(a) * r; P.put(x, y, RP.fossil, 4.6 - (Math.sin(a) + Math.cos(a)) * 0.6); if (((a * 12) | 0) % 5 === 0) P.put(x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9, RP.fossil, 2.4); }
  for (let i = 0; i < 9; i++) { const x = 15 + i * 1.5, y = 9 + Math.sin(i * 0.5) * 1.6; P.blob(x, y, 0.9, 1.3, RP.fossil, s + i, 3.8); P.put(x, y - 2, RP.fossil, 3.2); P.put(x, y + 2, RP.fossil, 3); }
  P.blob(27, 9, 1.2, 1.2, RP.fossil, s, 3.4);
  return P.done(false);
}
function webSheet() {   // 32 x 30: a whole curtain of web from the floor to well over the head, layered and torn
  const P = painter(32, 30), s = 3481;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 32; x++) {
    const a = Math.abs(cn(x * 1.4, y, 10, 20, s)), b = Math.abs(cn(x + y * 0.7, y, 14, 14, s + 1)), sheet = cn(x, y, 8, 6, s + 2), edge = Math.min(x, 31 - x, y * 1.4, 29 - y + 6);
    if (edge < 1) continue;
    if (a < 0.045 || b < 0.035) P.put(x, y, RP.seda, 4.6 - y * 0.03);
    else if (sheet > -0.04 && hash2(x, y, s + 3) < 0.45 + sheet * 2) P.put(x, y, RP.seda, 2.4 + sheet * 5);
  }
  for (const [x, y] of [[8, 9], [22, 15], [15, 22]]) { P.blob(x, y, 1.4, 1.2, RP.sombra, s, 3); }   // flies, a beetle, something
  return P.done(false);
}
function buriedArch() {   // 42 x 32: a carved arch of the cathedral sticking out of the cave wall, half of it under the earth
  const P = painter(42, 32), s = 3501;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 42; x++) {
    const dx = x + 0.5 - 21, dy = y + 0.5 - 18, r = Math.hypot(dx, dy * 1.05);
    if (y < 18 && r > 13 && r < 19) P.put(x, y, RP.cantaria, 3.4 - dx * 0.03 - (r > 17.6 ? 1.4 : r < 14 ? -0.8 : 0) + cg(x, y, s) * 0.5 + (Math.abs(dx) < 1.4 && r > 15 ? 1 : 0));   // voussoirs, keystone
    if (y >= 18 && (Math.abs(dx) > 13 && Math.abs(dx) < 19)) P.put(x, y, RP.cantaria, 3.2 - (Math.abs(dx) > 17.6 ? 1.2 : 0) + cg(x, y, s) * 0.5 + (y % 5 === 0 ? -1 : 0));   // jambs
  }
  for (let a = 0.15; a < Math.PI; a += 0.32) { const x = 21 + Math.cos(Math.PI + a) * 16, y = 18 + Math.sin(Math.PI + a) * 15.3; P.line(21 + Math.cos(Math.PI + a) * 13.2, 18 + Math.sin(Math.PI + a) * 12.6, x + Math.cos(Math.PI + a) * 2.6, y + Math.sin(Math.PI + a) * 2.4, RP.cantaria, 1.3); }   // joints
  // the earth that buried it, sloping up to the right
  for (let x = 0; x < 42; x++) { const top = 31 - x * 0.32 + Math.sin(x * 0.5) * 1.4 - (x > 26 ? (x - 26) * 0.5 : 0); for (let y = Math.max(0, Math.floor(top)); y < 32; y++) P.put(x, y, RP.terra, 2.6 + cg(x, y, s + 1) * 0.9 - (y - top < 1 ? -1.2 : 0)); }
  // the bricked-up opening behind, very dark
  for (let y = 4; y < 32; y++) for (let x = 0; x < 42; x++) { if (P.has(x, y)) continue; const r = Math.hypot(x + 0.5 - 21, (y + 0.5 - 18) * 1.05); if ((y < 18 && r <= 13) || (y >= 18 && Math.abs(x + 0.5 - 21) <= 13)) P.put(x, y, RP.sombra, 2.6 + cg(x, y, s + 2) * 0.6 + ((y % 4 === 0 || (x + (y >> 2) * 3) % 7 === 0) ? -1 : 0)); }
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, caverna: true }, extra || {}));
const ALL = ['grutas', 'galerias', 'ninho', 'fundacoes'];
// floor
def('cv_estalagmite', 'Estalagmite grande', F, 'frente', ALL, [bigStalagmite(0), bigStalagmite(1)]);
def('cv_pedregulho', 'Pedregulho', F, 'frente', ALL, [boulder()]);
def('cv_drusa', 'Drusa de cristal', F, 'frente', ['galerias', 'ninho', 'fundacoes'], [bigDruse()], { luz: [{ x: 11, y: 8, r: 0.75 }], brilho: '#a888f0' });
def('cv_cogumelos', 'Touceira de cogumelos', F, 'frente', ['grutas', 'galerias'], [mushClump(0)]);
def('cv_cogumelos_luz', 'Cogumelos luminosos', F, 'frente', ['grutas', 'galerias', 'ninho'], [mushClump(1)], { luz: [{ x: 12, y: 6, r: 0.6 }], brilho: '#5ad8e0' });
def('cv_explorador', 'Ossada do explorador', F, 'frente', ALL, [deadExplorer()], { luz: [{ x: 27, y: 7, r: 0.8 }], chamas: [{ x: 26, y: 6 }], brilho: '#ffb060' });
def('cv_raiz_caida', 'Raiz caída', F, 'frente', ['grutas'], [fallenRoot()]);
def('cv_ovos', 'Ovos de aranha', F, 'frente', ['galerias', 'ninho', 'fundacoes'], [spiderEggs()]);
def('cv_carcaca', 'Carcaça na teia', F, 'frente', ['ninho', 'fundacoes'], [webCarcass()]);
def('cv_pedra_lavrada', 'Pedra lavrada caída', F, 'frente', ['fundacoes'], [dressedStone(0), dressedStone(1)]);
// ceiling
def('cv_estalactite', 'Estalactite grande', C, 'frente', ALL, [bigStalactite(0), bigStalactite(1)]);
def('cv_raizes', 'Raízes pendentes', C, 'frente', ['grutas'], [rootCurtain()]);
def('cv_casulo', 'Casulo grande', C, 'frente', ['galerias', 'ninho', 'fundacoes'], [bigCocoon(0), bigCocoon(1)]);
def('cv_morcegos', 'Morcegos dormindo', C, 'frente', ['grutas', 'galerias'], [roostingBats()]);
// back wall
def('cv_cortina', 'Cortina de calcita', W, 'fundo', ['galerias', 'fundacoes'], [calciteCurtain()]);
def('cv_veio', 'Veio de cristal', W, 'fundo', ['galerias', 'ninho', 'fundacoes'], [crystalVein()], { luz: [{ x: 14, y: 9, r: 0.55 }], brilho: '#a888f0' });
def('cv_pintura', 'Pintura rupestre', W, 'fundo', ['grutas', 'galerias'], [cavePainting(0), cavePainting(1)]);
def('cv_fossil', 'Fóssil', W, 'fundo', ['grutas', 'galerias'], [fossil()]);
def('cv_lencol_teia', 'Lençol de teia', W, 'fundo', ['ninho', 'fundacoes'], [webSheet()]);
def('cv_arco_enterrado', 'Arco enterrado', W, 'fundo', ['fundacoes'], [buriedArch()]);

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
// (back-wall pieces on 'chao' stand on the floor; the rest hang at eye height)
Object.assign(CV_PROP_PLAN, {
  grutas: { chao: [['cv_estalagmite', 0.25, 1], ['cv_pedregulho', 0.25, 1], ['cv_cogumelos', 0.3, 1], ['cv_cogumelos_luz', 0.12, 1], ['cv_raiz_caida', 0.2, 1], ['cv_explorador', 0.03, 1]], teto: [['cv_estalactite', 0.3, 2], ['cv_raizes', 0.4, 2], ['cv_morcegos', 0.12, 1]], fundo: [['cv_pintura', 0.06, 1], ['cv_fossil', 0.08, 1]] },
  galerias: { chao: [['cv_estalagmite', 0.45, 2], ['cv_pedregulho', 0.25, 1], ['cv_drusa', 0.1, 1], ['cv_cogumelos', 0.15, 1], ['cv_cogumelos_luz', 0.15, 1], ['cv_ovos', 0.1, 1], ['cv_explorador', 0.04, 1]], teto: [['cv_estalactite', 0.6, 3], ['cv_casulo', 0.12, 1], ['cv_morcegos', 0.15, 1], ['teia_grande', 0.12, 1]], fundo: [['cv_cortina', 0.18, 1], ['cv_veio', 0.1, 1], ['cv_pintura', 0.05, 1], ['cv_fossil', 0.05, 1]] },
  ninho: { chao: [['cv_ovos', 0.4, 2], ['cv_carcaca', 0.25, 1], ['cv_estalagmite', 0.2, 1], ['cv_drusa', 0.08, 1], ['cv_cogumelos_luz', 0.1, 1], ['cv_explorador', 0.05, 1]], teto: [['cv_casulo', 0.45, 2], ['teia_grande', 0.4, 2], ['cv_estalactite', 0.2, 1]], fundo: [['cv_lencol_teia', 0.3, 1], ['cv_veio', 0.08, 1]] },
  fundacoes: { chao: [['cv_pedra_lavrada', 0.4, 2], ['cv_estalagmite', 0.25, 1], ['cv_pedregulho', 0.2, 1], ['cv_ovos', 0.12, 1], ['cv_carcaca', 0.1, 1], ['cv_drusa', 0.06, 1], ['cv_explorador', 0.04, 1]], teto: [['cv_estalactite', 0.45, 2], ['cv_casulo', 0.2, 1], ['teia_grande', 0.2, 1]], fundo: [['cv_arco_enterrado', 0.12, 1], ['cv_cortina', 0.12, 1], ['cv_lencol_teia', 0.1, 1], ['cv_veio', 0.06, 1]] }
});
}
// back-wall pieces that stand on the floor instead of hanging at eye height
const CV_BACK_FLOOR = { cv_cortina: 1, cv_lencol_teia: 1, cv_arco_enterrado: 1 };
