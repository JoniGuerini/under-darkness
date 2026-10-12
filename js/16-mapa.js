'use strict';

/* ================= map (Tab): a Diablo-style overlay of everything you've seen ================= */
let seen = new Uint8Array(0), mapOpen = false, mapVer = 0, mapDrawn = -1, mapKey = '', mapT = -9;
function packSeen() {
  // runs of unseen/seen tiles as varints (2026-10-12: the world got 3x taller and the plain bit map grew to 1.5 MB in the save)
  const out = []; let cur = 0, run = 0;
  const put = n => { while (n >= 128) { out.push((n & 127) | 128); n = Math.floor(n / 128); } out.push(n); };
  for (let i = 0; i < seen.length; i++) { const v = seen[i] ? 1 : 0; if (v === cur) run++; else { put(run); cur = v; run = 1; } }
  put(run);
  const b = Uint8Array.from(out); let s = ''; for (let i = 0; i < b.length; i += 4096) s += String.fromCharCode.apply(null, b.subarray(i, i + 4096));
  try { return 'r1:' + btoa(s); } catch (e) { return ''; }
}
function unpackSeen(str) { try {
  if (str.startsWith('r1:')) {
    const s = atob(str.slice(3)); let i = 0, k = 0, cur = 0;
    while (k < s.length && i < seen.length) { let n = 0, m = 1, c; do { c = s.charCodeAt(k++); n += (c & 127) * m; m *= 128; } while (c & 128 && k < s.length); const e = Math.min(seen.length, i + n); if (cur) seen.fill(1, i, e); i = e; cur ^= 1; }
  } else { const s = atob(str); for (let i = 0; i < seen.length; i++) seen[i] = (s.charCodeAt(i >> 3) >> (i & 7)) & 1; }
  mapVer++; } catch (e) { } }
// the map is a small copy of the world itself: every explored tile is painted with its own texture
// (MP pixels per tile, sampled from the same block art the chunks use), kept for the whole ring and
// only repainted where something changed, so opening it costs one pass and walking costs almost nothing
const MP = 6, MSTEP = T / MP, MCH = 30, MCW = Math.ceil(WW / MCH), MCHH = Math.ceil(WH / MCH), MCP = MCH * MP;
let mapChunks = null, mapSnap = null, mapSeenRef = null;   // the map in 30x30-tile pieces, so a change only re-uploads its own piece
function mapChunk(x, y) {
  const n = ((y / MCH) | 0) * MCW + ((x / MCH) | 0); let m = mapChunks[n];
  if (!m) { const cv = mk(MCP, MCP), cx = cv.getContext('2d'), img = cx.createImageData(MCP, MCP); m = mapChunks[n] = { cv, cx, img, buf: new Uint32Array(img.data.buffer), dirty: false }; }
  return m;
}
const mapA = (c, a) => ((c & 0x00ffffff) | (a << 24)) >>> 0;
const MAP_A_BLOCK = 215, MAP_A_WALL = 110, MAP_A_DECO = 235;
function paintMapTile(x, y) {
  const m = mapChunk(x, y), k = y * WW + x, RW = MCP, o0 = (y % MCH) * MP * RW + (x % MCH) * MP, b = m.buf; m.dirty = true;
  if (!seen[k]) { for (let py = 0; py < MP; py++) b.fill(0, o0 + py * RW, o0 + py * RW + MP); return; }
  const t = tiles[k], w = walls[k], X0 = x * T, Y0 = y * T;
  if (BLOCKY[t] && MAT[t] && !SEETHRU[t]) {
    const P = MAT[t][0], MV = MAT[t][1].v, MXX = MAT[t][1].x, OUT = P[0];
    const up = !solidAt(x, y - 1), dn = !solidAt(x, y + 1), lf = !solidAt(x - 1, y), rt = !solidAt(x + 1, y);
    for (let py = 0; py < MP; py++) for (let px = 0; px < MP; px++) {
      const q = o0 + py * RW + px;
      if ((up && py === 0) || (dn && py === MP - 1) || (lf && px === 0) || (rt && px === MP - 1)) { b[q] = mapA(OUT, 240); continue; }
      const tk = texAt(X0 + px * MSTEP + 1, Y0 + py * MSTEP + 1);
      if (MXX[tk]) { b[q] = mapA(MXX[tk], MAP_A_BLOCK); continue; }
      let v = MV[tk]; if (up && py === 1) v += 1.7; if (dn && py === MP - 2) v -= 1.2;
      b[q] = mapA(t === GRASS && up && py < 2 ? PALS.grass[py ? 4 : 5] : shadeOf(P, v), MAP_A_BLOCK);
    }
    return;
  }
  // open ground: the back wall, a shade darker and fainter than the rock, so passages read at a glance
  const WM = w && WMAT[w];
  for (let py = 0; py < MP; py++) for (let px = 0; px < MP; px++) {
    const q = o0 + py * RW + px;
    if (!WM) { b[q] = 0; continue; }
    b[q] = mapA(shadeOf(WM[0], WM[1].v[texAt(X0 + px * MSTEP + 1, Y0 + py * MSTEP + 1)] - 1.5), MAP_A_WALL);
  }
  const arr = DECO[t], sp = arr && decoSprite(t, x, y, arr);
  if (sp && sp.length === T * T) for (let py = 0; py < MP; py++) for (let px = 0; px < MP; px++) {
    // keep any lit pixel of the 2x2 it stands for, so thin things (chains, candles) don't vanish
    let c = 0; for (let s = 0; s < MSTEP * MSTEP && !c; s++) c = sp[(py * MSTEP + ((s / MSTEP) | 0)) * T + px * MSTEP + (s % MSTEP)];
    if (c) b[o0 + py * RW + px] = mapA(c, MAP_A_DECO);
  }
}
// repaint whatever changed (newly seen, dug, built) inside the given tile window, plus its neighbours' edges
function refreshMap(x0, y0, x1, y1) {
  const NN = WW * WH;
  if (mapSeenRef !== seen || !mapSnap || mapSnap.length !== NN) { mapSeenRef = seen; mapSnap = new Int16Array(NN).fill(-2); mapChunks = new Array(MCW * MCHH).fill(null); }
  y0 = Math.max(0, y0); y1 = Math.min(WH - 1, y1);
  if (x1 - x0 >= WW) { x0 = 0; x1 = WW - 1; }
  const dirty = [];
  for (let y = y0; y <= y1; y++) for (let xx = x0; xx <= x1; xx++) {
    const x = wrapX(xx), k = y * WW + x, v = seen[k] ? tiles[k] : -1;
    if (v === mapSnap[k]) continue;
    mapSnap[k] = v; dirty.push(x, y);
  }
  if (!dirty.length) return;
  const done = new Set();
  for (let n = 0; n < dirty.length; n += 2) for (const [dx, dy] of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const x = wrapX(dirty[n] + dx), y = dirty[n + 1] + dy; if (y < 0 || y >= WH) continue;
    const k = y * WW + x; if (done.has(k)) continue; done.add(k);
    if (mapSnap[k] === -2 && dx | dy) continue;   // a neighbour the map hasn't reached yet gets painted when it does
    paintMapTile(x, y);
  }
  for (const m of mapChunks) if (m && m.dirty) { m.cx.putImageData(m.img, 0, 0); m.dirty = false; }
}
function drawMap() {
  const W = cvs.width, H = cvs.height, MS = MP * clamp(Math.round(H / 64 / MP), 1, 3), px = (pl.x + pl.w / 2) / T, py = (pl.y + pl.h / 2) / T;
  const cols = Math.ceil(W / MS) + 4, rows = Math.ceil(H / MS) + 4, ox = Math.floor(px) - (cols >> 1), oy = Math.floor(py) - (rows >> 1);
  const key = ox + ',' + oy + ',' + MS + ',' + W + ',' + H;
  if (key !== mapKey || mapSeenRef !== seen || (mapVer !== mapDrawn && gameTime - mapT > 0.2)) { refreshMap(ox - 1, oy - 1, ox + cols, oy + rows); mapKey = key; mapDrawn = mapVer; mapT = gameTime; }
  sc.save(); sc.imageSmoothingEnabled = false;
  sc.fillStyle = 'rgba(6,4,12,0.62)'; sc.fillRect(0, 0, W, H);   // dim the world so the map reads on top of it
  const dx0 = W / 2 - px * MS, dy = Math.round(H / 2 - py * MS);
  sc.globalAlpha = 0.92;
  for (let cy = 0; cy < MCHH; cy++) {
    const y = dy + cy * MCH * MS; if (y > H || y + MCH * MS < 0) continue;
    for (let r = -1; r <= 1; r++) for (let cx = 0; cx < MCW; cx++) {
      const m = mapChunks[cy * MCW + cx]; if (!m) continue;
      const x = Math.round(dx0 + (r * WW + cx * MCH) * MS); if (x > W || x + MCH * MS < 0) continue;
      sc.drawImage(m.cv, x, y, MCH * MS, MCH * MS);
    }
  }
  // the altar stays marked
  sc.globalAlpha = 1;
  for (let j = 0; j < rows; j++) {
    const ty = oy + j; if (ty < 0 || ty >= WH) continue;
    for (let i = 0; i < cols; i++) {
      const tx = ox + i, kk = ty * WW + wrapX(tx); if (!seen[kk]) continue;
      const t = tiles[kk], col = t === ALTAR ? '#ff3a2a' : null; if (!col) continue;
      const d = Math.max(3, Math.round(MS * 0.5)), x = Math.round(W / 2 + (tx + 0.5 - px) * MS - d / 2), y = Math.round(H / 2 + (ty + 0.5 - py) * MS - d / 2);
      sc.fillStyle = '#0a0810'; sc.fillRect(x - 1, y - 1, d + 2, d + 2); sc.fillStyle = col; sc.fillRect(x, y, d, d);
    }
  }
  const at = (tx, ty) => [Math.round(W / 2 + (tx - px) * MS), Math.round(H / 2 + (ty - py) * MS)];
  const label = (text, x, y, col, size, title) => { sc.font = title ? `400 ${Math.round(size * 1.35)}px "Jersey 10", "Rubik", sans-serif` : `700 ${size}px "Rubik", system-ui, sans-serif`; sc.textAlign = 'center'; sc.textBaseline = 'middle'; sc.lineJoin = 'round'; sc.lineWidth = Math.max(3, size * 0.28); sc.strokeStyle = '#0a0810'; sc.strokeText(text, x, y); sc.fillStyle = col; sc.fillText(text, x, y); };
  const fs = Math.max(Math.round(12 * dpr), Math.round(MS * 1.05));
  // the village: a little house over the spawn
  const near = tx => tx + Math.round((px - tx) / WW) * WW;   // the copy of a place closest to you on the ring
  const sy0 = surf[SPX] - 1;
  if (seen[sy0 * WW + SPX]) {
    const [hx, hy] = at(near(SPX) + 0.5, sy0 + 0.5), u = Math.max(2, Math.round(MS / 4));
    sc.fillStyle = '#0a0810'; sc.fillRect(hx - u * 3, hy - u * 2, u * 6, u * 4); sc.fillRect(hx - u * 2, hy - u * 4, u * 4, u * 2);
    sc.fillStyle = '#efe2c4'; sc.fillRect(hx - u * 2, hy - u, u * 4, u * 2.5); sc.fillStyle = '#f0a83c'; sc.fillRect(hx - u * 3 + 1, hy - u * 2, u * 6 - 2, u); sc.fillRect(hx - u * 2 + 1, hy - u * 3, u * 4 - 2, u); sc.fillRect(hx - u + 1, hy - u * 4 + 1, u * 2 - 2, u);
    label('Vilarejo', hx, hy - u * 6, '#efe2c4', fs);
  }
  // you: a blinking arrow pointing where you face
  const cx = W / 2, cy = H / 2, s = Math.max(6, MS * 0.85), f = pl.facing, a = 0.75 + 0.25 * Math.sin(gameTime * 8);
  const tri = (k, col) => { sc.beginPath(); sc.moveTo(cx + f * s * k, cy); sc.lineTo(cx - f * s * 0.7 * k, cy - s * 0.75 * k); sc.lineTo(cx - f * s * 0.35 * k, cy); sc.lineTo(cx - f * s * 0.7 * k, cy + s * 0.75 * k); sc.closePath(); sc.fillStyle = col; sc.fill(); };
  tri(1.35, '#0a0810'); sc.globalAlpha = a; tri(1, '#ffd23f'); sc.globalAlpha = 1;
  // where you are
  const tx = clamp(Math.floor(px), 0, WW - 1), ty = Math.floor((pl.y + pl.h) / T);
  const top = Math.round(14 * dpr) + Math.round(fs * 0.7);
  label(`${ZONE_NAMES[zoneAt(tx, ty)]} · ${Math.max(0, ty - surf[SPX])} m`, W / 2, top, '#f0a83c', Math.round(fs * 1.15), true);
  sc.restore();
}
