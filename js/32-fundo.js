'use strict';

/* ================= the surface backdrop: sky, sun and moon, stars, clouds, mountains, forest and fields =================
   Painted once at startup in the same grainy, shaded pixel style as the terrain and the village. Every layer is stored as
   material + tone (0..5) + haze per pixel and then baked into 4 palettes (day, golden hour, dusk, night); a frame only
   blits two baked canvases per layer and crossfades them, so the cost per frame is a handful of drawImage calls. */
const BG = { layers: [], clouds: [], sky: [], skyKey: '', stars: null, twinkle: [], sun: [], moon: [], moonPhase: -1, glow: null };
const BG_STATES = 4; // 0 day, 1 golden hour, 2 dusk / blue hour, 3 night

const bgHex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const bgLerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const bgB = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;
const bgPack = (c, a = 255) => ((a << 24) | (bgB(c[2]) << 16) | (bgB(c[1]) << 8) | bgB(c[0])) >>> 0;
const bgCss = c => `rgb(${bgB(c[0])},${bgB(c[1])},${bgB(c[2])})`;
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// smooth 1D value noise; with a period (in cells) it wraps so layers tile seamlessly
function bgN1(x, s, per) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = per ? ((i % per) + per) % per : i, b = per ? (((i + 1) % per) + per) % per : i + 1; return hash2(a, s, 91) + (hash2(b, s, 91) - hash2(a, s, 91)) * u; }
// noise over a layer's width W with about `cells` bumps across it, wrapping at W
const bgNW = (x, W, cells, s) => bgN1(x / W * cells, s, cells);

/* ---- palettes: each ramp is authored for daylight, the other times of day come from a transform ---- */
const BG_RAMP = {
  1: ['#4a5784', '#586896', '#6878a6', '#7a8bb5', '#8e9fc5', '#a5b5d6'], // far rock, blue with distance
  2: ['#8794bf', '#a0addb', '#b9c6e6', '#d0daf0', '#e6ecf8', '#f9fbff'], // snow
  3: ['#3b5568', '#466375', '#527282', '#61828f', '#72949d', '#87a8ad'], // middle rock, slate
  4: ['#2a4547', '#30504f', '#385b56', '#41675d', '#4b7365', '#577f6d'], // forest seen from far
  5: ['#1d3a2b', '#244530', '#2c5136', '#365e3c', '#416b43', '#4f7a4b'], // pines
  6: ['#4a7536', '#56833c', '#629143', '#71a04b', '#82ad54', '#97bc60'], // meadow
  7: ['#76863a', '#869541', '#97a448', '#a8b252', '#b8bf5d', '#c9cc6b'], // ripe fields
  8: ['#284622', '#305228', '#395f2e', '#436c34', '#4f793a', '#5c8642'], // hedges and round trees
  9: ['#3a2b22', '#46342a', '#523e31', '#5f4938', '#6b5440', '#786049'], // trunks, dirt
  10: ['#efe6cc', '#f1d564', '#e993a6', '#c9a3ea', '#ffffff', '#f6b860'] // flowers (tone = colour)
};
const BG_CLOUD = [
  ['#8c9cc0', '#a5b4d3', '#bccae2', '#d3def0', '#e9f0f9', '#ffffff'],
  ['#6c5584', '#8c6488', '#b37488', '#da8d80', '#f5af84', '#ffdca4'],
  ['#2f2d57', '#3d3866', '#4e4574', '#615282', '#78628e', '#90739a'],
  ['#1b2342', '#222b4e', '#29355a', '#324066', '#3c4b72', '#48587e']
];
const BG_SKY = [
  [[0, '#2c68c8'], [0.42, '#4f90df'], [0.78, '#8ec3ee'], [1, '#cfe8f5']],
  [[0, '#29316c'], [0.3, '#5a4a8a'], [0.58, '#c4637c'], [0.8, '#f2955a'], [1, '#ffd17c']],
  [[0, '#0d1130'], [0.4, '#24285c'], [0.74, '#553d70'], [1, '#9c5866']],
  [[0, '#04071a'], [0.5, '#0a1230'], [0.84, '#141f46'], [1, '#1f2e58']]
];
function bgTint(c, s) {
  if (s === 0) return c;
  if (s === 1) return [c[0] * 1.02 + 34, c[1] * 0.8 + 8, c[2] * 0.6 + 8];
  if (s === 2) return [c[0] * 0.5 + 22, c[1] * 0.44 + 14, c[2] * 0.6 + 38];
  const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; return [l * 0.3 + 10, l * 0.4 + 16, l * 0.62 + 36];
}
function bgSkyAt(s, t) { const st = BG_SKY[s]; for (let i = 1; i < st.length; i++) if (t <= st[i][0]) { const a = st[i - 1], b = st[i]; return bgLerp3(bgHex(a[1]), bgHex(b[1]), (t - a[0]) / (b[0] - a[0])); } return bgHex(st[st.length - 1][1]); }
const BG_PAL = []; // [state][mat][tone] -> rgb
for (let s = 0; s < BG_STATES; s++) { BG_PAL[s] = []; for (const m in BG_RAMP) BG_PAL[s][m] = BG_RAMP[m].map(h => m == 10 && s === 3 ? bgLerp3(bgHex(h), [40, 50, 90], 0.6) : bgTint(bgHex(h), s)); BG_PAL[s][11] = BG_CLOUD[s].map(bgHex); }
const BG_HAZE = [0, 1, 2, 3].map(s => bgLerp3(bgSkyAt(s, 0.9), bgSkyAt(s, 0.6), 0.3));

/* ---- a layer is a material/tone/haze map that gets baked to one canvas per time of day ---- */
function bgLayer(W, H) { return { W, H, mat: new Uint8Array(W * H), tone: new Uint8Array(W * H), hz: new Uint8Array(W * H), c: [], fill: [] }; }
function bgSet(L, x, y, m, tone, hz) {
  if (y < 0 || y >= L.H) return; x = ((x % L.W) + L.W) % L.W; const k = y * L.W + x;
  L.mat[k] = m; L.tone[k] = tone < 0 ? 0 : tone > 5 ? 5 : Math.round(tone); L.hz[k] = hz < 0 ? 0 : hz > 1 ? 255 : (hz * 255) | 0;
}
function bgBake(L, hazeK = 1, nightK = 1) {
  for (let s = 0; s < BG_STATES; s++) {
    const c = mk(L.W, L.H), x = c.getContext('2d'), img = x.createImageData(L.W, L.H), u = new Uint32Array(img.data.buffer), pal = BG_PAL[s], hz = BG_HAZE[s];
    for (let k = 0; k < L.W * L.H; k++) {
      const m = L.mat[k]; if (!m) continue;
      let col = pal[m][L.tone[k]]; const h = L.hz[k] / 255 * hazeK;
      if (h > 0) { // dither the haze into steps so it stays pixel art instead of a smooth fade
        const px = k % L.W, py = (k / L.W) | 0, q = h * 10, f = Math.floor(q) + ((q % 1) * 16 > BAYER4[(py & 3) * 4 + (px & 3)] ? 1 : 0);
        col = bgLerp3(col, hz, Math.min(1, f / 10) * 0.85);
      }
      if (s && nightK !== 1) { const q = s === 1 ? Math.sqrt(nightK) : nightK; col = [col[0] * q, col[1] * q, col[2] * q]; } // near layers go dark first as the light drops
      u[k] = bgPack(col);
    }
    x.putImageData(img, 0, 0); L.c[s] = c;
    // what to paint under the layer when the camera rises and its bottom edge shows
    const kb = (L.H - 1) * L.W; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < L.W; i += 7) { const m = L.mat[kb + i]; if (!m) continue; const p = img.data, o = (kb + i) * 4; r += p[o]; g += p[o + 1]; b += p[o + 2]; n++; }
    L.fill[s] = n ? bgCss([r / n, g / n, b / n]) : null;
  }
  L.mat = L.tone = L.hz = null; // free the build data
  return L;
}

/* ---- mountains: overlapping peaks, each lit from the left, with gullies, rim light, snow caps and haze ---- */
function bgMountains(W, H, o, R) {
  const L = bgLayer(W, H), peaks = [];
  for (let x = 0; x < W;) { peaks.push({ x: x + R() * o.space * 0.6, h: o.hMin + R() * (o.hMax - o.hMin), w: o.wMin + R() * (o.wMax - o.wMin), z: R(), p: o.pow * (0.85 + R() * 0.3), s: (R() * 1e6) | 0 }); x += o.space * (0.55 + R() * 0.7); }
  peaks.sort((a, b) => a.z - b.z);
  const tops = peaks.map(pk => {
    const t = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      const dx = ((x - pk.x) % W + W * 1.5) % W - W / 2, u = Math.abs(dx) / pk.w;
      if (u >= 1) { t[x] = 1e9; continue; }
      const prof = Math.pow(1 - u, pk.p), jag = (bgN1(x * 0.21, pk.s) - 0.5) * o.jag + (bgN1(x * 0.07, pk.s + 5) - 0.5) * o.jag * 2.2;
      t[x] = H - pk.h * prof + jag * (1 - u * 0.5);
    }
    return t;
  });
  const own = new Int16Array(W * H).fill(-1);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { for (let i = peaks.length - 1; i >= 0; i--) if (y >= tops[i][x]) { own[y * W + x] = i; break; } }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = own[y * W + x]; if (i < 0) continue;
    const pk = peaks[i], top = tops[i][x], dy = y - top, dx = ((x - pk.x) % W + W * 1.5) % W - W / 2;
    const ridge = (bgN1(y * 0.18, pk.s + 9) - 0.5) * 5 + dy * 0.08;
    const lit = dx < ridge;
    const sg = lit ? 1 : -1, streak = bgN1((dx + dy * 0.75 * sg) * 0.32, pk.s + 3), streak2 = bgN1((dx + dy * 0.6 * sg) * 0.9, pk.s + 4);
    let tone = (lit ? 3.4 : 1.6) + (streak - 0.5) * 2.2 + (streak2 - 0.5) * 0.9 + (hash2(x, y, pk.s) - 0.5) * 0.95;
    if (dy < 1.5) tone += lit ? 1.4 : 0.6; // bright rim along the crest
    const above = y > 0 ? own[(y - 1) * W + x] : -1; if (above !== i && above >= 0) tone -= 1.6; // a shadow line where one peak passes in front of another
    tone -= Math.max(0, dy / H) * 1.1;
    let m = o.mat;
    if (o.snow && pk.h > o.snowMin) {
      const depth = (pk.h - o.snowMin * 0.8) * 0.36 * (0.55 + 0.9 * bgN1(x * 0.28, pk.s + 7)) * (0.6 + streak * 0.8);
      if (dy < depth) { m = 2; tone = (lit ? 3.8 : 2.1) + (streak - 0.5) * 1.6 + (hash2(x, y, 3) - 0.5) * 0.8 + (dy < 1.5 && lit ? 1.2 : 0); }
    }
    if (o.forest) {
      const fl = H - o.forest * (0.55 + 0.6 * bgNW(x, W, 26, pk.s & 255)), cell = hash2(x >> 1, y >> 1, 41);
      if (y > fl + (cell < 0.35 ? 1 : 0)) { m = 4; tone = (lit ? 2.6 : 1.4) + (hash2(x >> 1, (y + (x & 1)) >> 1, 17) - 0.5) * 1.8 + (y - fl < 1.5 ? 1 : 0); }
    }
    const hz = o.hazeBase + Math.pow(Math.max(0, (y - H * o.hazeFrom) / (H * (1 - o.hazeFrom))), 1.2) * o.haze;
    bgSet(L, x, y, m, tone, hz);
  }
  return L;
}

/* ---- the pine forest ridge: a rolling hill crowned with hundreds of small layered pines ---- */
function bgPines(W, H, ext, R) {
  const L = bgLayer(W, H), ph = [R() * 6.3, R() * 6.3, R() * 6.3];
  const hill = x => H - ext - 26 - Math.sin(x / W * Math.PI * 2 * 3 + ph[0]) * 9 - Math.sin(x / W * Math.PI * 2 * 7 + ph[1]) * 5 - Math.sin(x / W * Math.PI * 2 * 13 + ph[2]) * 2;
  for (let x = 0; x < W; x++) { const t = Math.round(hill(x)); for (let y = t; y < H; y++) { const cy = hash2(x >> 1, y >> 1, 77); bgSet(L, x, y, 5, 1.2 + (cy - 0.5) * 1.8 + (y - t < 2 ? 0.8 : 0) - (y - t) / 30, 0.18 + (y - t) / 60); } }
  const trees = [];
  for (let x = 0; x < W;) { trees.push({ x, h: 9 + R() * 15 + bgNW(x, W, 12, 61) * 8, d: R() }); x += 2 + Math.floor(R() * 4); }
  trees.sort((a, b) => b.d - a.d); // far (hazier) first
  for (const t of trees) {
    const base = Math.round(hill(t.x)) + 3, top = base - Math.round(t.h), hw = t.h * 0.3;
    for (let y = top; y <= base; y++) {
      const k = (y - top) / t.h, tier = ((y - top) % 4) / 4, w = Math.max(0, Math.round(hw * k * (0.75 + tier * 0.45)));
      for (let dx = -w; dx <= w; dx++) {
        const lit = dx < 0, edge = dx === -w;
        const tone = (lit ? 3 : 1.4) + (edge ? 1 : 0) + (tier < 0.25 && lit ? 0.6 : 0) + (hash2(t.x + dx, y, 5) - 0.5) * 0.9 - t.d * 0.8;
        bgSet(L, t.x + dx, y, 5, tone, t.d * 0.35);
      }
    }
    if (hash2(t.x, 1, 2) < 0.5) bgSet(L, t.x, top - 1, 5, 2.5, t.d * 0.35);
  }
  return L;
}

/* ---- near meadows: soft hills cut into fields and pastures, hedgerows, round trees and wildflowers ---- */
function bgMeadows(W, H, ext, R) {
  const L = bgLayer(W, H), ph = [R() * 6.3, R() * 6.3, R() * 6.3];
  const hill = x => H - ext - 24 - Math.sin(x / W * Math.PI * 2 * 2 + ph[0]) * 9 - Math.sin(x / W * Math.PI * 2 * 5 + ph[1]) * 4 - Math.sin(x / W * Math.PI * 2 * 11 + ph[2]) * 1.5;
  const slope = x => hill(x + 3) - hill(x - 3);
  const cuts = []; for (let x = 0; x < W;) { cuts.push({ x, kind: R() < 0.45 ? 'field' : 'meadow', s: (R() * 999) | 0 }); x += 50 + Math.floor(R() * 70); }
  const cellAt = x => { let c = cuts[0]; for (const k of cuts) if (k.x <= x) c = k; return c; };
  for (let x = 0; x < W; x++) {
    const t = Math.round(hill(x)), c = cellAt(x), sl = slope(x), edgeIn = x - c.x;
    for (let y = t; y < H; y++) {
      const d = y - t; let m = 6, tone;
      const shade = 2.6 + clamp(sl * 0.35, -1.3, 1.3) + (d < 1 ? 1.3 : 0) - d / 34;
      if (c.kind === 'field') { m = 7; tone = shade + ((Math.floor((d + Math.sin(x * 0.05) * 1.5) / 2) & 1) ? -0.9 : 0.3) + (hash2(x, y, 9) - 0.5) * 0.8; }
      else tone = shade + (bgNW(x, W, 60, c.s) - 0.5) * 1.2 + (hash2(x, y, 8) - 0.5) * 1.1;
      if (edgeIn < 2 && d > 0 && d < 3) tone -= 1.2; // a faint seam where one field meets the next
      bgSet(L, x, y, m, tone, 0.08 + d / 90);
      if (m === 6 && d > 1 && hash2(x, y, 33) < 0.022) bgSet(L, x, y, 10, Math.floor(hash2(x, y, 34) * 6), 0.1);
    }
    const hb = Math.abs(edgeIn < 8 ? edgeIn - 3 : 99); // a low hedge on the crest where two fields meet
    if (hb < 5) for (let y = t - 4 + hb; y < t + 1; y++) if (hash2(x, y, 6) < 0.85) bgSet(L, x, y, 8, 2.2 - (y - t) * 0.3 + (x < c.x + 3 ? 0.9 : -0.3) + (hash2(x, y, 7) - 0.5) * 1.2, 0.05);
  }
  // round trees standing on the crests
  for (let i = 0; i < W / 70; i++) {
    const tx = Math.floor(R() * W), r = 3 + Math.floor(R() * 4), base = Math.round(hill(tx)), cy = base - 3 - r;
    for (let y = cy + r; y <= base; y++) { bgSet(L, tx, y, 9, 2, 0.05); if (y > cy + r + 1) bgSet(L, tx + 1, y, 9, 1, 0.05); }
    for (let n = 0; n < 3; n++) {
      const ox = (n - 1) * Math.round(r * 0.7), oy = n === 1 ? -Math.round(r * 0.5) : 0, rr = n === 1 ? r : r - 1;
      for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
        if (dx * dx + dy * dy > rr * rr + rr * 0.6) continue;
        const l = (-dx - dy * 1.3) / rr; bgSet(L, tx + ox + dx, cy + oy + dy, 8, 2.4 + l * 1.3 + (hash2(tx + dx, dy, n) - 0.5) * 1.2, 0.04);
      }
    }
  }
  return L;
}

/* ---- clouds: lumpy cumulus with flat bellies, lit from above; and thin far streaks ---- */
function bgCloudLayer(W, H, n, big, R) {
  const L = bgLayer(W, H);
  for (let c = 0; c < n; c++) {
    const cx = R() * W, by = (big ? 34 : 14) + R() * (H - (big ? 46 : 24)), cw = big ? 26 + R() * 50 : 16 + R() * 34, lumps = [];
    const nl = big ? 3 + Math.floor(cw / 12) : 3 + Math.floor(cw / 7);
    for (let i = 0; i < nl; i++) { const u = i / (nl - 1) - 0.5, r = big ? (6 + (1 - Math.abs(u) * 1.6) * cw * 0.2) * (0.75 + R() * 0.4) : (2.5 + (1 - Math.abs(u) * 1.7) * 4) * (0.7 + R() * 0.6); lumps.push([cx + u * cw, by - r * (big ? 0.55 : 0.4), r]); }
    const top = Math.min(...lumps.map(l => l[1] - l[2])), ch = by - top;
    for (let y = Math.floor(top); y <= by; y++) for (let x = Math.floor(cx - cw); x <= cx + cw; x++) {
      let best = null, bd = 9; for (const l of lumps) { const dx = (x - l[0]) / l[2], dy = (y - l[1]) / (big ? l[2] : l[2] * 0.7), d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [dx, dy]; } }
      if (bd > 1 || (bd > 0.82 && hash2(x, y, 12) < 0.5)) continue; // ragged dithered edge
      const up = (by - y) / ch, light = -best[0] * 0.45 - best[1] * 0.9;
      const tone = 0.6 + up * 2.6 + light * 1.2 + (hash2(x, y, c) - 0.5) * 0.7 - (by - y < 1.5 ? 0.6 : 0);
      bgSet(L, x, y, 11, tone, 0);
    }
  }
  return L;
}

/* ---- the sky itself: banded gradient with ordered dithering between the bands ---- */
function bgSkyStrip(s, h) {
  const W = 128, c = mk(W, h), x = c.getContext('2d'), img = x.createImageData(W, h), u = new Uint32Array(img.data.buffer), N = 22, horizon = h * 0.62;
  const band = []; for (let i = 0; i < N; i++) band.push(bgPack(bgSkyAt(s, i / (N - 1))));
  for (let y = 0; y < h; y++) {
    const t = Math.min(1, y / horizon) * (N - 1), b0 = Math.floor(t), f = t - b0;
    for (let px = 0; px < W; px++) u[y * W + px] = band[Math.min(N - 1, b0 + (f * 16 > BAYER4[(y & 3) * 4 + (px & 3)] ? 1 : 0))];
  }
  x.putImageData(img, 0, 0); return c;
}

/* ---- stars and the milky way (one canvas), plus a few bright ones that twinkle each frame ---- */
function bgStarField(R) {
  const W = 900, H = 200, c = mk(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), u = new Uint32Array(img.data.buffer);
  for (let y = 0; y < H; y++) for (let px = 0; px < W; px++) {
    // the milky way: a diagonal band of grainy dust with a dark lane through it
    const along = (px + y * 1.6) % W, across = (y - (H * 0.15 + Math.sin(px / W * Math.PI * 2) * 40 + px * 0.0)) / 34;
    const band = Math.exp(-across * across) * (0.55 + 0.45 * bgN1(along * 0.05, 7, Math.round(W * 0.05))) - Math.exp(-(((across - 0.15) * 7) ** 2)) * 0.35;
    const dust = band * (0.5 + hash2(px, y, 21)) * 0.55;
    if (dust > 0.12) u[y * W + px] = bgPack([140 + dust * 60, 150 + dust * 60, 210], Math.min(110, dust * 160) | 0);
    if (hash2(px, y, 22) < band * 0.03) u[y * W + px] = bgPack([200, 210, 255], 150);
  }
  const put = (px, py, col, a) => { px = ((px % W) + W) % W; if (py < 0 || py >= H) return; u[py * W + px] = bgPack(col, a); };
  for (let i = 0; i < 420; i++) {
    const px = Math.floor(R() * W), py = Math.floor(Math.pow(R(), 1.3) * H), b = R(), warm = R();
    const col = warm < 0.15 ? [255, 214, 170] : warm < 0.3 ? [180, 200, 255] : [235, 238, 255];
    put(px, py, col, (70 + b * b * 185) | 0);
    if (b > 0.93) { put(px - 1, py, col, 70); put(px + 1, py, col, 70); put(px, py - 1, col, 70); put(px, py + 1, col, 70); }
  }
  x.putImageData(img, 0, 0);
  const tw = []; for (let i = 0; i < 26; i++) tw.push([R() * W, Math.pow(R(), 1.4) * H * 0.9, R() * 6.3, 1.2 + R() * 2, R() < 0.35]);
  return [c, tw];
}

/* ---- sun (day and low-sun versions) with dithered halo rings, and the moon in 8 phases with craters ---- */
function bgSunSprite(core, mid, rim, halo) {
  const S = 51, c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), u = new Uint32Array(img.data.buffer), o = 25;
  const C = [bgHex(core), bgHex(mid), bgHex(rim), bgHex(halo)];
  for (let y = 0; y < S; y++) for (let px = 0; px < S; px++) {
    const dx = px - o, dy = y - o, d = Math.sqrt(dx * dx + dy * dy), by = BAYER4[(y & 3) * 4 + (px & 3)];
    let col = null, a = 255;
    if (d <= 8.4) col = d < 4.5 + (dx + dy < 0 ? 1 : 0) ? C[0] : d < 7 ? C[1] : C[2];
    else if (d <= 11) { if (by < 9) { col = C[2]; a = 150; } }
    else if (d <= 16) { if (by < 5) { col = C[3]; a = 110; } }
    else if (d <= 24) { if (by < 2 && (Math.abs(dx) < 1.5 || Math.abs(dy) < 1.5 || Math.abs(Math.abs(dx) - Math.abs(dy)) < 1.2)) { col = C[3]; a = 90; } else if (by < 1) { col = C[3]; a = 60; } }
    if (col) u[y * S + px] = bgPack(col, a);
  }
  x.putImageData(img, 0, 0); return c;
}
function bgMoonSprite(ph) {
  const S = 33, c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), u = new Uint32Array(img.data.buffer), o = 16, r = 7.4, th = (ph + 0.5) / 8 * Math.PI * 2;
  const craters = [[-2, -3, 1.8], [2, 1, 2.3], [-3, 3, 1.2], [3, -3, 1], [0, 5, 1.1]];
  for (let y = 0; y < S; y++) for (let px = 0; px < S; px++) {
    const dx = px - o, dy = y - o, d = Math.sqrt(dx * dx + dy * dy), by = BAYER4[(y & 3) * 4 + (px & 3)];
    if (d <= r) {
      const U = dx / r, V = dy / r, lim = Math.sqrt(Math.max(0, 1 - V * V)), lit = th < Math.PI ? U > Math.cos(th) * lim : U < -Math.cos(th) * lim;
      let tone = 0.75 - (U * 0.2 + V * 0.25) + (hash2(px, y, 3) - 0.5) * 0.12;
      for (const [cx, cy, cr] of craters) { const e = Math.hypot(dx - cx, dy - cy); if (e < cr) tone -= 0.22; else if (e < cr + 0.9 && dx - cx < 0) tone += 0.1; }
      if (d > r - 1) tone -= 0.12;
      const col = bgLerp3([150, 160, 196], [246, 248, 255], clamp(tone, 0, 1));
      u[y * S + px] = lit ? bgPack(col) : bgPack(bgLerp3(col, [30, 40, 80], 0.78), 200);
    } else if (d <= r + 3 && by < 6) u[y * S + px] = bgPack([200, 215, 255], 70);
    else if (d <= r + 8 && by < 2) u[y * S + px] = bgPack([170, 190, 255], 45);
  }
  x.putImageData(img, 0, 0); return c;
}
// the warm wash that hugs the horizon around a rising or setting sun
function bgGlowSprite() {
  const W = 260, H = 90, c = mk(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), u = new Uint32Array(img.data.buffer);
  for (let y = 0; y < H; y++) for (let px = 0; px < W; px++) {
    const dx = (px - W / 2) / (W / 2), dy = (y - H * 0.7) / (H * 0.7), d = Math.sqrt(dx * dx + dy * dy); if (d >= 1) continue;
    const q = (1 - d) * 4, step = Math.floor(q) + ((q % 1) * 16 > BAYER4[(y & 3) * 4 + (px & 3)] ? 1 : 0);
    if (step > 0) u[y * W + px] = bgPack(bgLerp3([255, 150, 90], [255, 214, 140], step / 4), step * 38);
  }
  x.putImageData(img, 0, 0); return c;
}

function buildBackdrop() {
  const R = mulberry32(77);
  BG.clouds = [
    { L: bgBake(bgCloudLayer(1300, 70, 22, false, R)), f: 0.03, drift: 1.2, y: 0.08, a: [0.75, 0.85, 0.7, 0.55] },
    { L: bgBake(bgCloudLayer(1500, 110, 13, true, R)), f: 0.07, drift: 3, y: 0.12, a: [1, 1, 0.95, 0.75] }
  ];
  BG.layers = [
    { L: bgBake(bgMountains(1400, 150, { mat: 1, space: 90, hMin: 50, hMax: 128, wMin: 70, wMax: 150, pow: 1.15, jag: 5, snow: true, snowMin: 92, haze: 0.85, hazeBase: 0.12, hazeFrom: 0.3 }, R), 1, 1.3), f: 0.1, drop: 20 },
    { L: bgBake(bgMountains(1200, 110, { mat: 3, space: 70, hMin: 34, hMax: 86, wMin: 55, wMax: 110, pow: 0.95, jag: 3.5, snow: true, snowMin: 78, forest: 30, haze: 0.6, hazeBase: 0.04, hazeFrom: 0.45 }, R), 0.8, 1.1), f: 0.2, drop: 14 },
    { L: bgBake(bgPines(1000, 130, 50, R), 0.7, 0.75), f: 0.34, drop: 60 },
    { L: bgBake(bgMeadows(900, 130, 64, R), 0.6, 0.6), f: 0.52, drop: 72 }
  ];
  [BG.stars, BG.twinkle] = bgStarField(R);
  BG.sun = [bgSunSprite('#fffdf0', '#fff1b4', '#ffd968', '#fff2c0'), bgSunSprite('#fff4d0', '#ffc070', '#ff8a48', '#ffb070')];
  BG.moon = []; for (let p = 0; p < 8; p++) BG.moon.push(bgMoonSprite(p));
  BG.glow = bgGlowSprite();
  BG.sky = []; BG.skyKey = '';
}

// which two baked palettes to show for an hour, and how far between them
const BG_KEYS = [[0, 3], [4.6, 3], [5.5, 2], [6.3, 1], [7.4, 0], [16.4, 0], [17.5, 1], [18.4, 2], [19.4, 3], [24, 3]];
function bgMixAt(h) { for (let i = 1; i < BG_KEYS.length; i++) if (h <= BG_KEYS[i][0]) { const a = BG_KEYS[i - 1], b = BG_KEYS[i]; return [a[1], b[1], (h - a[0]) / (b[0] - a[0])]; } return [3, 3, 0]; }
function bgTile(img, ox, y, alpha) {
  if (alpha <= 0.004) return; const w = img.width; lc.globalAlpha = Math.min(1, alpha);
  for (let x = ox; x < VW; x += w) lc.drawImage(img, x, y);
}
const bgOff = (v, w) => -Math.floor(((v % w) + w) % w);

function drawSky(cx, cy) {
  const h = hourNow(), df = dayFactor(h), [sa, sb, k] = bgMixAt(h), wt = [0, 0, 0, 0]; wt[sa] += 1 - k; wt[sb] += k;
  if (BG.skyKey !== VH + '') { BG.sky = [0, 1, 2, 3].map(s => bgSkyStrip(s, VH)); BG.skyKey = VH + ''; }
  // sky: the first state opaque, the second faded over it
  lc.globalAlpha = 1; bgTile(BG.sky[sa], 0, 0, 1); bgTile(BG.sky[sb], 0, 0, k);
  const G = SURF_BASE * T - cy, mid = VH * 0.55, yOff = (G - mid) * 0.12;
  // stars and milky way slide slowly through the night
  const night = clamp(1 - df * 1.6, 0, 1);
  if (night > 0) {
    const sw = BG.stars.width, sx = bgOff(cx * 0.02 + h * 14, sw);
    bgTile(BG.stars, sx, Math.round(yOff), night);
    lc.fillStyle = '#ffffff';
    for (const s of BG.twinkle) {
      const a = night * (0.45 + 0.55 * Math.sin(gameTime * s[3] + s[2]) ** 2), px = Math.floor(((s[0] + sx) % sw + sw) % sw), py = Math.floor(s[1] + yOff);
      if (px >= VW) continue;
      lc.globalAlpha = a; lc.fillRect(px, py, 1, 1);
      if (s[4]) { lc.globalAlpha = a * 0.45; lc.fillRect(px - 1, py, 3, 1); lc.fillRect(px, py - 1, 1, 3); }
    }
  }
  // sun or moon on its arc
  let bodyK, isSun;
  if (h >= 6 && h < 18) { bodyK = (h - 6) / 12; isSun = true; } else { bodyK = ((h + 24 - 18) % 24) / 12; isSun = false; }
  const bx = Math.round(VW * (0.08 + 0.84 * bodyK)), by = Math.round(VH * 0.5 - Math.sin(bodyK * Math.PI) * VH * 0.36 + yOff);
  if (isSun) {
    const low = clamp(wt[1] + wt[2] * 0.6, 0, 1);
    if (low > 0.02) bgTile(BG.glow, bx - 130, Math.round(mid + (G - mid) * 0.1) - 70, low * 0.9);
    lc.globalAlpha = 1; lc.drawImage(BG.sun[0], bx - 25, by - 25);
    if (low > 0.02) { lc.globalAlpha = low; lc.drawImage(BG.sun[1], bx - 25, by - 25); }
  } else {
    const ph = typeof luaFase === 'function' ? luaFase() : ((Math.floor(worldTime / DAY_LEN) + 4) % 8 + 8) % 8; // the first night has a full moon; phases in js/337-lua.js
    lc.globalAlpha = clamp(1 - wt[0] - wt[1] * 0.5, 0.25, 1); lc.drawImage(BG.moon[ph], bx - 16, by - 16);
  }
  // clouds drift with the wind
  for (const C of BG.clouds) {
    const w = C.L.W, ox = bgOff(cx * C.f + gameTime * C.drift, w), y = Math.round(VH * C.y + yOff * 1.5);
    const a = C.a[sa] * (1 - k) + C.a[sb] * k;
    bgTile(C.L.c[sa], ox, y, a); bgTile(C.L.c[sb], ox, y, a * k);
  }
  // mountains, forest and fields, back to front
  for (const B of BG.layers) {
    const L = B.L, ox = bgOff(cx * B.f, L.W), base = Math.round(mid + (G - mid) * B.f) + B.drop, top = base - L.H;
    bgTile(L.c[sa], ox, top, 1); bgTile(L.c[sb], ox, top, k);
    if (base < VH) { lc.globalAlpha = 1; lc.fillStyle = L.fill[sa]; lc.fillRect(0, base, VW, VH - base); if (k > 0.004) { lc.globalAlpha = k; lc.fillStyle = L.fill[sb]; lc.fillRect(0, base, VW, VH - base); } }
  }
  lc.globalAlpha = 1;
}
