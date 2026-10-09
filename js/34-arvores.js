'use strict';

/* ================= surface trees, painted as whole sprites =================
   The world still stores trees as TRUNK and LEAVES tiles (chopping, lighting and the map use them), but the chunk renderer
   skips those tiles and this file paints each tree as one hand-shaded sprite in the terrain's grainy style: bark with
   fissures and root flare, branches, and a crown of overlapping leaf clumps lit from the top left. The trunk height
   tells which tree the world grew (3 bush, 5 oak, 6 big oak, 7 pine); each kind has 3 variants picked by position.
   Sprites are baked once on first use, so a frame only blits one canvas per visible tree. */
const TREE_SPR = new Map();
const TR_W = 150, TR_H = 204, TR_BX = 75, TR_BY = TR_H - 3; // sprite size and where the base of the trunk sits

const TR_RAMP = {
  bark: ['#160d08', '#2a1a10', '#3e2818', '#553823', '#6e4a2e', '#8a603b', '#a97c4f'],
  leaf: ['#0b2010', '#123219', '#1a4622', '#235c2b', '#2f7434', '#418c3e', '#5ea74c', '#8cc764'],
  gold: ['#1d200c', '#2e3312', '#434a18', '#5b611f', '#767a28', '#929332', '#b2ab44', '#d4c662'], // a yellower oak for variety
  pine: ['#091a15', '#0f2e22', '#16432d', '#205a39', '#2b7045', '#3c8752', '#55a064', '#7dbd7c'],
  fruit: ['#3a0c10', '#7a1a1c', '#b8322a', '#e8664a', '#ffb08a']
};
const TR_PAL = {}; for (const k in TR_RAMP) TR_PAL[k] = TR_RAMP[k].map(h => { const n = parseInt(h.slice(1), 16); return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0; });
const trN = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash2(i, s, 13) + (hash2(i + 1, s, 13) - hash2(i, s, 13)) * u; };

function treePainter() {
  const col = new Uint32Array(TR_W * TR_H), zb = new Int16Array(TR_W * TR_H).fill(-1);
  const put = (x, y, ramp, tone) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= TR_W || y >= TR_H) return; const P = TR_PAL[ramp]; col[y * TR_W + x] = P[tone < 0 ? 0 : tone >= P.length ? P.length - 1 : Math.round(tone)]; };
  return { col, zb, put };
}

// a trunk from the base up to yTop, lit on the left, with bark fissures, a knot and roots that flare over the grass
function trTrunk(p, s, h, wBot, wTop) {
  const yb = TR_BY, yt = TR_BY - h;
  for (let y = yt; y <= yb; y++) {
    const t = (yb - y) / h, up = yb - y, flare = up < 7 ? (7 - up) * (7 - up) * 0.2 : 0;
    const w = wBot + (wTop - wBot) * t + flare * 2, lean = (trN(y * 0.05, s + 2) - 0.5) * 2.4 * t;
    const L = Math.round(TR_BX - w / 2 + lean), R = Math.round(TR_BX + w / 2 + lean);
    for (let x = L; x <= R; x++) {
      const u = (x - L) / Math.max(1, R - L);
      let tone = 4.4 - u * 3 + (u < 0.2 ? 0.6 : 0);
      const fis = trN((x - L) * 0.85 + trN(y * 0.06, s + 1) * 3, s); if (fis < 0.3) tone -= 1.6; else if (fis > 0.78) tone += 0.6;
      tone += (hash2(x, y, s) - 0.5) * 0.8;
      if (x === L || x === R) tone = 0;
      p.put(x, y, 'bark', tone);
    }
  }
  // a knot
  const ky = yb - Math.round(h * (0.35 + hash2(s, 1, 2) * 0.3)), kx = TR_BX + (hash2(s, 2, 3) < 0.5 ? -1 : 1);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (dx * dx + dy * dy * 0.5 <= 2) p.put(kx + dx, ky + dy, 'bark', dx < 0 && dy < 0 ? 4 : 1);
  p.put(kx, ky, 'bark', 0);
}
// a branch: a tapering bark stroke from (x1,y1) to (x2,y2)
function trBranch(p, s, x1, y1, x2, y2, w1) {
  const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= n; i++) {
    const k = i / n, x = x1 + (x2 - x1) * k + (trN(i * 0.3, s) - 0.5) * 2, y = y1 + (y2 - y1) * k, w = Math.max(1, w1 * (1 - k * 0.75));
    for (let d = -w / 2; d <= w / 2; d++) { const top = d < 0; p.put(x + d * 0.3, y + d, 'bark', d <= -w / 2 + 0.5 || d >= w / 2 - 0.5 ? 0.6 : top ? 4 : 2.4); }
  }
}

/* a round crown made of overlapping leaf clumps. Each pixel belongs to the front-most clump that covers it; clumps are
   shaded as little spheres lit from the top left, cast a shadow on the clump behind them, and get a dark outline. */
function trCrown(p, s, ramp, cx, cy, rx, ry, n, fruit) {
  const R = mulberry32(s * 7 + 3), cl = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = i < n * 0.6 ? 0.5 + R() * 0.22 : R() * 0.45;
    const r = (i < n * 0.6 ? 12 : 13) + R() * 5;
    cl.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, r, z: R() + (Math.sin(a) > 0 ? 0.6 : 0) * d, s: (R() * 1e5) | 0 });
  }
  cl.push({ x: cx, y: cy, r: Math.min(rx, ry) * 0.72, z: -1, s: 5 }, { x: cx - rx * 0.35, y: cy + ry * 0.2, r: ry * 0.5, z: -1, s: 6 }, { x: cx + rx * 0.35, y: cy + ry * 0.2, r: ry * 0.5, z: -1, s: 7 });
  cl.sort((a, b) => b.z - a.z); // front first
  const own = new Int16Array(TR_W * TR_H).fill(-1);
  const inside = (c, x, y) => { const dx = x - c.x, dy = y - c.y, ang = Math.atan2(dy, dx), rr = c.r * (0.88 + 0.12 * trN(ang * 2.2 + 10, c.s) + 0.08 * trN(ang * 9, c.s + 1)); return dx * dx + dy * dy <= rr * rr; };
  const x0 = Math.max(0, Math.floor(cx - rx - 18)), x1 = Math.min(TR_W - 1, Math.ceil(cx + rx + 18)), y0 = Math.max(0, Math.floor(cy - ry - 18)), y1 = Math.min(TR_H - 1, Math.ceil(cy + ry + 18));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let i = 0; i < cl.length; i++) if (inside(cl[i], x, y)) { own[y * TR_W + x] = i; break; }
  const at = (x, y) => x < 0 || y < 0 || x >= TR_W || y >= TR_H ? -1 : own[y * TR_W + x];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = at(x, y); if (i < 0) continue;
    const c = cl[i], nx = (x - c.x) / c.r, ny = (y - c.y) / c.r;
    let tone = 3.3 + (-nx * 0.6 - ny * 0.8) * 2.3 + (cy - y) / ry * 0.9 - (x - cx) / rx * 0.5 - Math.max(0, (y - cy) / ry) * 0.8;
    // leaves: little tufts (one bump per 4x3 cell) give the crown a leafy, grainy surface
    const tx = Math.floor(x / 4), ty = Math.floor(y / 3), ox = (x - tx * 4) - 1.5 - (hash2(tx, ty, s) - 0.5) * 2, oy = (y - ty * 3) - 1 - (hash2(tx, ty, s + 1) - 0.5);
    tone += 0.9 - Math.min(1.8, Math.hypot(ox, oy * 1.3) * 0.75) + (hash2(tx, ty, s + 9) - 0.5) * 0.8;
    const g = hash2(x, y, s + 4); if (g < 0.06) tone -= 1.8; else if (g > 0.94 && nx + ny < -0.1) tone += 1.8;
    // the clump in front throws a shadow onto this one
    for (let k = 1; k <= 3; k++) { const j = at(x + 1, y - k); if (j >= 0 && j < i) { tone -= 1.7 - k * 0.35; break; } }
    const edge = at(x - 1, y) < 0 || at(x + 1, y) < 0 || at(x, y - 1) < 0 || at(x, y + 1) < 0;
    const seam = !edge && ((at(x, y - 1) >= 0 && at(x, y - 1) < i) || (at(x - 1, y) >= 0 && at(x - 1, y) < i));
    if (edge) tone = 0; else if (seam) tone -= 1.2;
    else if ((at(x - 1, y - 1) < 0 || at(x, y - 2) < 0) && nx + ny < 0.4) tone += 1; // rim light along the top left
    p.put(x, y, ramp, tone);
  }
  // a few loose leaves poking out of the silhouette
  for (let k = 0; k < 40; k++) { const a = R() * Math.PI * 2, x = Math.round(cx + Math.cos(a) * (rx + 3)), y = Math.round(cy + Math.sin(a) * (ry + 3)); for (let t = 0; t < 6; t++) { const xx = Math.round(x - Math.cos(a) * t), yy = Math.round(y - Math.sin(a) * t); if (at(xx, yy) >= 0) { const ox = xx + Math.round(Math.cos(a) * 1.4), oy = yy + Math.round(Math.sin(a) * 1.4); if (at(ox, oy) < 0) { p.put(ox, oy, ramp, Math.sin(a) < 0 ? 4 : 1); } break; } } }
  if (fruit) for (let k = 0; k < fruit; k++) {
    const a = R() * Math.PI * 2, d = R() * 0.8, x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(cy + Math.sin(a) * ry * d);
    if (at(x, y) < 0 || at(x + 1, y + 1) < 0) continue;
    p.put(x, y, 'fruit', 3); p.put(x + 1, y, 'fruit', 2); p.put(x, y + 1, 'fruit', 2); p.put(x + 1, y + 1, 'fruit', 1); p.put(x, y - 1, 'bark', 1);
    if (hash2(x, y, 1) < 0.5) p.put(x, y, 'fruit', 4);
  }
}

// a conifer: stacked drooping tiers of needles, the upper tier hangs in front of the one below
function trPine(p, s, tipY, baseY, maxW) {
  const tiers = 5, own = new Int16Array(TR_W * TR_H).fill(-1), span = baseY - tipY;
  const T0 = []; for (let k = 0; k < tiers; k++) { const f = (k + 1) / tiers; const w = 8 + maxW * Math.pow(f, 0.85); T0.push({ top: tipY + span * (k / tiers) * 0.92 - (k ? 6 : 0), bot: tipY + span * f, w, wl: w * (0.86 + hash2(k, s, 1) * 0.26), wr: w * (0.86 + hash2(k, s, 2) * 0.26) }); }
  const inTier = (t, x, y) => { const dx = Math.abs(x - TR_BX), h = t.bot - t.top; if (y < t.top || y > t.bot + 4) return false; const k = (y - t.top) / h; const hw = (x < TR_BX ? t.wl : t.wr) * Math.min(1, k * 1.05) + (trN(y * 0.9 + t.top, s) - 0.5) * 3 - ((y + (x < TR_BX ? 0 : 2)) % 3) * 1.3; const sag = t.bot - 3 + (dx / t.w) * 6; return dx <= hw && y <= sag; };
  for (let y = 0; y < TR_H; y++) for (let x = 0; x < TR_W; x++) for (let k = 0; k < tiers; k++) if (inTier(T0[k], x, y)) { own[y * TR_W + x] = k; break; }
  const at = (x, y) => x < 0 || y < 0 || x >= TR_W || y >= TR_H ? -1 : own[y * TR_W + x];
  for (let y = 0; y < TR_H; y++) for (let x = 0; x < TR_W; x++) {
    const k = at(x, y); if (k < 0) continue;
    const t = T0[k], dx = (x - TR_BX) / t.w, v = (y - t.top) / (t.bot - t.top);
    let tone = 4.4 - dx * 3.2 - v * 2.2 + (1 - k / tiers) * 0.5 + (v < 0.25 && dx < 0.1 ? 0.8 : 0);
    const sg = x < TR_BX ? 1 : -1, nd = ((x + y * 2 * sg) % 5 + 5) % 5; if (nd === 0) tone -= 0.8; else if (nd === 2 && dx < 0.3) tone += 0.5; // needle sprays fanning down and out
    tone += (hash2(x, y, s) - 0.5) * 0.5;
    for (let j = 1; j <= 3; j++) { const o = at(x, y - j); if (o >= 0 && o < k) { tone -= 1.8 - j * 0.4; break; } } // shade under the tier above
    if (at(x - 1, y) < 0 || at(x + 1, y) < 0 || at(x, y - 1) < 0 || at(x, y + 1) < 0) tone = at(x, y - 1) < 0 && dx < 0.2 ? 2.2 : 0;
    p.put(x, y, 'pine', tone);
  }
  p.put(TR_BX, tipY - 1, 'pine', 0); p.put(TR_BX, tipY - 2, 'pine', 0);
}

function bakeTree(kind, v, bare) {
  const p = treePainter(), s = kind * 31 + v * 7 + 11, R = mulberry32(s);
  const ramp = kind !== 2 && v === 2 ? 'gold' : 'leaf', fruit = kind === 1 && v === 1 ? 7 : kind === 0 && v === 0 ? 4 : 0;
  const top = { 3: 36, 0: 60, 1: 72, 2: 84 }[kind];
  if (kind === 2) {
    trTrunk(p, s, top + 6, 7, 3);
    if (!bare) trPine(p, s, TR_BY - top - 100, TR_BY - 26, 42 + v * 3);
  } else {
    const wB = kind === 3 ? 10 : kind === 1 ? 14 : 12;
    trTrunk(p, s, top + 6, wB, wB * 0.55);
    const cy = TR_BY - top - (kind === 3 ? 26 : kind === 1 ? 40 : 34), rx = kind === 3 ? 44 : kind === 1 ? 48 : 43, ry = kind === 3 ? 26 : kind === 1 ? 40 : 34;
    // branches reach up into the crown (they show through the gaps, and on a bare trunk they are the whole top)
    const nb = bare ? 3 : 4;
    for (let i = 0; i < nb; i++) {
      const side = i % 2 ? 1 : -1, y1 = TR_BY - top + 4 - i * 4, len = bare ? 8 + R() * 6 : 18 + R() * 12;
      trBranch(p, s + i, TR_BX + side * 2, y1, TR_BX + side * len, y1 - len * (0.7 + R() * 0.4), bare ? 4 : 6);
    }
    if (!bare) trCrown(p, s, ramp, TR_BX + (kind === 1 ? 4 : 0), cy, rx, ry, kind === 3 ? 13 : 17, fruit);
  }
  if (bare) { for (let x = -3; x <= 3; x++) p.put(TR_BX + x, TR_BY - top - 6, 'bark', Math.abs(x) === 3 ? 0 : 5 - Math.abs(x) * 0.5); } // the pale cut where the crown was
  const c = mk(TR_W, TR_H), x = c.getContext('2d'), img = x.createImageData(TR_W, TR_H);
  new Uint32Array(img.data.buffer).set(p.col); x.putImageData(img, 0, 0);
  return c;
}
function treeSprite(kind, v, bare) {
  const key = kind * 10 + v + (bare ? 100 : 0); let c = TREE_SPR.get(key);
  if (!c) { c = bakeTree(kind, v, bare); TREE_SPR.set(key, c); }
  return c;
}
const TREE_KIND = { 3: 3, 5: 0, 6: 1, 7: 2 };

// find every trunk base on screen (or just below it, since crowns reach far up) and paint its tree
function drawTrees(cx, cy) {
  if (!TREE_SPR.size) for (const k of [0, 1, 2, 3]) for (let v = 0; v < 3; v++) treeSprite(k, v, false); // bake the leafy ones up front so walking never hitches
  const gx0 = Math.floor(cx / T) - 6, gx1 = Math.floor((cx + VW) / T) + 6, gy0 = Math.max(0, Math.floor(cy / T) - 1), gy1 = Math.min(WH - 1, Math.floor((cy + VH) / T) + 17);
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    if (tileAt(gx, gy) !== TRUNK || tileAt(gx, gy + 1) === TRUNK) continue;
    let h = 1; while (h < 12 && tileAt(gx, gy - h) === TRUNK) h++;
    const kind = TREE_KIND[h] !== undefined ? TREE_KIND[h] : h < 4 ? 3 : h > 6 ? 2 : 0;
    const crown = tileAt(gx, gy - h) === LEAVES || tileAt(gx - 1, gy - h + 1) === LEAVES || tileAt(gx + 1, gy - h + 1) === LEAVES;
    const spr = treeSprite(kind, (hash2(((gx % WW) + WW) % WW, 0, 77) * 3) | 0, !crown);
    lc.drawImage(spr, gx * T + 6 - TR_BX - cx, (gy + 1) * T - TR_BY - cy);
  }
}
