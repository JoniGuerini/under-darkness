'use strict';

/* ================= chunk cache ================= */
const chunks = new Map();
function markDirty(x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const gx = wrapX(x + dx), gy = y + dy; if (gy < 0 || gy >= WH) continue;
    const ch = chunks.get(((gy / CH) | 0) * 64 + ((gx / CH) | 0)); if (ch) ch.dirty = true;
  }
}
function setTile(x, y, t) { if (y < 0 || y >= WH) return; x = wrapX(x); const i = y * WW + x; tiles[i] = t; diffs.set(i, t); markDirty(x, y); mapVer++; if (!SOLID[t]) propsLoseSupport(x, y); }
// natural ground blends where two materials meet: the border wanders a few pixels either way and
// leaves specks of the neighbour behind, so dirt fades into stone instead of stopping on a straight line
const BLEND = new Uint8Array(NT); [DIRT, GRASS, STONE, DEEP, BEDROCK, COAL, COPPER, IRON, GOLD, CRYSTAL].forEach(t => { BLEND[t] = 1; });
function edgeNz(a, s) { const n = (f, k) => { const i = Math.floor(f), u = sm3(f - i); return lerp(hash2(i, s, k), hash2(i + 1, s, k), u); }; return n(a / 5, 311) * 0.7 + n(a / 2, 312) * 0.3; }
// which tile's material shows at this pixel: 0 = its own, otherwise the neighbour that reaches over the border
function blendPick(nb, px, py, X, Y, X0, Y0) {
  if (nb[0] && py + 0.5 < (edgeNz(X, Y0 * 3 + 1) - 0.5) * 6) return nb[0];
  if (nb[1] && py + 0.5 > T + (edgeNz(X, (Y0 + T) * 3 + 1) - 0.5) * 6) return nb[1];
  if (nb[2] && px + 0.5 < (edgeNz(Y, X0 * 3 + 2) - 0.5) * 6) return nb[2];
  if (nb[3] && px + 0.5 > T + (edgeNz(Y, (X0 + T) * 3 + 2) - 0.5) * 6) return nb[3];
  const d = [py, T - 1 - py, px, T - 1 - px];
  for (let i = 0; i < 4; i++) if (nb[i] && d[i] < 5) { const f = 1 - d[i] / 5; if (hash2(X >> 1, Y >> 1, 401 + nb[i]) < 0.2 * f * f) return nb[i]; }
  return 0;
}
// which variation of a one-block decoration shows at (gx, gy)
function decoSprite(t, gx, gy, arr) {
  const pk = DECO_PICK[t]; if (pk) return pk(gx, gy, arr);
  return t === TRUNK ? arr[tileAt(gx, gy - 1) === LEAVES ? 2 : hash2(gx, gy, seed + 3) < 0.45 ? 1 : 0] : t === CHAIN ? arr[tileAt(gx, gy + 1) === CHAIN ? 0 : 1] : t === BANNER ? arr[tileAt(gx, gy - 1) === BANNER ? 1 : 0] : t === WEB ? arr[solidAt(gx - 1, gy) ? 0 : 1] : arr[(hash2(gx, gy, seed) * arr.length) | 0];
}
function renderChunk(cx, cy, cv) {
  const ctx = cv.getContext('2d'), SZ = CH * T, img = ctx.createImageData(SZ, SZ), buf = new Uint32Array(img.data.buffer);
  for (let ty = 0; ty < CH; ty++) {
    const gy = cy * CH + ty; if (gy >= WH) break;
    for (let tx = 0; tx < CH; tx++) {
      const gx = cx * CH + tx; if (gx >= WW) break;
      const i = gy * WW + gx, t = tiles[i], w = walls[i], o = ty * T * SZ + tx * T, X0 = gx * T, Y0 = gy * T, XB = X0 % TP, YB = Y0 % TP;
      // where the back wall is torn open, the third layer of blocks shows behind it (js/36-profundeza.js)
      const far = FAR && FAR[i] && w && w !== 4 && t !== LAVA, hp = far && !SOLID[t] ? depthTile(gx, gy) : null;
      // back wall, darkened where rock is close (ambient occlusion) and under overhangs
      if (w && (!SOLID[t] || SEETHRU[t]) && t !== LAVA) {
        const WP = WMAT[w][0], WV = WMAT[w][1].v;
        const su = solidAt(gx, gy - 1), sd = solidAt(gx, gy + 1), sl = solidAt(gx - 1, gy), sr = solidAt(gx + 1, gy);
        const sul = solidAt(gx - 1, gy - 1), sur = solidAt(gx + 1, gy - 1), sdl = solidAt(gx - 1, gy + 1), sdr = solidAt(gx + 1, gy + 1);
        for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
          let v = WV[(YB + py) * TP + XB + px], d = 9;
          if (su) d = Math.min(d, py); if (sd) d = Math.min(d, T - 1 - py); if (sl) d = Math.min(d, px); if (sr) d = Math.min(d, T - 1 - px);
          if (sul) d = Math.min(d, Math.max(px, py)); if (sur) d = Math.min(d, Math.max(T - 1 - px, py)); if (sdl) d = Math.min(d, Math.max(px, T - 1 - py)); if (sdr) d = Math.min(d, Math.max(T - 1 - px, T - 1 - py));
          if (d < 5) v -= (5 - d) * 0.42;
          if (su) v -= Math.max(0, 1 - py / 10) * 0.9;
          if (hp) {
            const h = hp[py * T + px];
            if (h >= 10) { buf[o + py * SZ + px] = deepPix(gx, gy, px, py, Math.max(h - 10, d < 5 ? (5 - d) * 0.8 : 0) + (su ? Math.max(0, 1 - py / 10) * 2 : 0)); continue; }
            if (h === 1) v = Math.min(v, 0.4); else if (h === 2) v += 2.4; else if (h === 3) v += 1;
          }
          buf[o + py * SZ + px] = shadeOf(WP, v);
        }
      }
      if (t === AIR) continue;
      if (t === TRUNK || t === LEAVES) continue; // trees are painted whole by drawTrees (js/34-arvores.js)
      if (BLOCKY[t]) {
        let up, dn, lf, rt;
        if (t === LEAVES) { const f = a => a === LEAVES || a === TRUNK; up = f(tileAt(gx, gy - 1)); dn = f(tileAt(gx, gy + 1)); lf = f(tileAt(gx - 1, gy)); rt = f(tileAt(gx + 1, gy)); }
        else if (t === LAVA) { up = tileAt(gx, gy - 1) !== AIR; dn = lf = rt = true; }
        else { up = solidAt(gx, gy - 1); dn = solidAt(gx, gy + 1); lf = solidAt(gx - 1, gy); rt = solidAt(gx + 1, gy); }
        const P = MAT[t][0], MV = MAT[t][1].v, MXX = MAT[t][1].x, isG = t === GRASS, OUT = P[0], WP = w ? WMAT[w][0] : null, WV = w ? WMAT[w][1].v : null;
        let nb = null;
        if (BLEND[t]) { const own = MAT[t][1], m = n => BLEND[n] && MAT[n][1] !== own ? n : 0; nb = [m(tileAt(gx, gy - 1)), m(tileAt(gx, gy + 1)), m(tileAt(gx - 1, gy)), m(tileAt(gx + 1, gy))]; if (!(nb[0] || nb[1] || nb[2] || nb[3])) nb = null; }
        for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
          const q = o + py * SZ + px;
          const tk = (YB + py) * TP + XB + px;
          if (t === LAVA) { buf[q] = !up && py < 2 ? (py === 0 ? P[5] : P[4]) : shadeOf(P, MV[tk]); continue; }
          const ul = px + py, ur = (T - 1 - px) + py, dl = px + (T - 1 - py), dr = (T - 1 - px) + (T - 1 - py);
          if ((!up && !lf && ul < 2) || (!up && !rt && ur < 2) || (!dn && !lf && dl < 2) || (!dn && !rt && dr < 2)) { const hc = far ? depthTile(gx, gy) : null; if (hc && hc[py * T + px] >= 10) buf[q] = deepPix(gx, gy, px, py, 2); else if (w) buf[q] = shadeOf(WP, WV[tk] - 1.6); continue; }
          const corner = (!up && !lf && ul === 2) || (!up && !rt && ur === 2) || (!dn && !lf && dl === 2) || (!dn && !rt && dr === 2);
          const eu = up ? 99 : py, ed = dn ? 99 : T - 1 - py, el = lf ? 99 : px, er = rt ? 99 : T - 1 - px, e = Math.min(eu, ed, el, er);
          if (isG && !up && py < 5) {
            const on = py < 3 || (py === 3 ? hash2(X0 + px, Y0, 5) < 0.55 : hash2(X0 + px, Y0, 6) < 0.18);
            if (on) { buf[q] = py === 0 || corner || el === 0 || er === 0 ? PALS.grass[0] : py === 1 ? PALS.grass[5] : py === 2 ? PALS.grass[4] : PALS.grass[2]; continue; }
          }
          if (t === LEAVES && e < 2) {
            const along = (eu === e || ed === e) ? X0 + px : Y0 + py;
            const notch = hash2(along >> 2, (gx * 7 + gy) & 1023, 64);
            if (e === 0 ? notch < 0.42 : notch < 0.14) { if (w) buf[q] = shadeOf(WP, WV[tk]); continue; }
          }
          if (e === 0 || corner) { buf[q] = OUT; continue; }
          let PP = P, v;
          const n = nb && !(MAT[t][1].o && MAT[t][1].o[tk]) ? blendPick(nb, px, py, X0 + px, Y0 + py, X0, Y0) : 0;
          if (n) { const NX = MAT[n][1].x[tk]; if (NX && !ORE_XP[n]) { buf[q] = NX; continue; } PP = MAT[n][0]; v = MAT[n][1].v[tk]; if (v === -9) v = 2.4; }
          else { if (MXX[tk]) { buf[q] = MXX[tk]; continue; } v = MV[tk]; }
          if (eu === 1) v += 1.7; else if (eu === 2) v += 0.7;
          if (ed === 1) v -= 1.2; else if (ed === 2) v -= 0.4;
          if (el === 1 || er === 1) v -= 0.35;
          buf[q] = shadeOf(PP, v);
        }
      } else {
        const arr = DECO[t]; if (!arr) continue;
        const sp = decoSprite(t, gx, gy, arr);
        if (sp) for (let k = 0; k < T * T; k++) if (sp[k]) buf[o + ((k / T) | 0) * SZ + (k % T)] = sp[k];
      }
    }
  }
  paintProps(cx, cy, buf, SZ);
  ctx.putImageData(img, 0, 0);
}
function drawChunks(cx, cy) {
  const P = CH * T, NCX = Math.ceil(WW / CH), WPX = WW * T;
  const y0 = Math.floor(cy / P), y1 = Math.floor((cy + VH) / P);
  for (let j = y0; j <= y1; j++) {
    if (j < 0 || j * CH >= WH) continue;
    // each chunk is drawn at its spot and one world-width to either side, so the seam is invisible
    for (let k = -1; k <= 1; k++) for (let i = 0; i < NCX; i++) {
      const px = i * P + k * WPX - cx; if (px + P <= 0 || px >= VW) continue;
      const key = j * 64 + i; let ch = chunks.get(key);
      if (!ch) { ch = { c: mk(P, P), dirty: true }; chunks.set(key, ch); }
      if (ch.dirty) { renderChunk(i, j, ch.c); ch.dirty = false; }
      ch.u = chunkTick;
      lc.drawImage(ch.c, px, j * P - cy);
    }
  }
  // the world is huge now (900 x 1016 tiles, ~3600 chunk images): keep only the ones seen lately, or the video
  // memory fills up as you explore and the frame rate sinks until the screen freezes (2026-10-10)
  if (++chunkTick % 60 === 0 && chunks.size > CHUNK_MAX) {
    const old = [...chunks].sort((a, b) => a[1].u - b[1].u);
    for (let k = 0; k < old.length - CHUNK_KEEP; k++) { old[k][1].c.width = old[k][1].c.height = 0; chunks.delete(old[k][0]); }
  }
}
let chunkTick = 0;
const CHUNK_MAX = 220, CHUNK_KEEP = 150;

/* ================= lighting ================= */
let LX0 = 0, LY0 = 0, LW = 0, LH = 0, LB = null, DB = null, lightCv = null, lightCx = null, lightImg = null, lightU = null;
const emitters = [];
let skyLight = 1;
const DARK = { amb: 0.02, ex: 1.15, cap: 0.992 };   // a escuridão do subterrâneo (ajuste aqui)
function computeLight(cx, cy) {
  const M = 12;
  const x0 = Math.floor(cx / T) - M, y0 = Math.floor(cy / T) - M;
  const w = Math.ceil(VW / T) + M * 2 + 2, h = Math.ceil(VH / T) + M * 2 + 2;
  if (w !== LW || h !== LH || !lightCv) { LW = w; LH = h; LB = new Float32Array(w * h); DB = new Float32Array(w * h); lightCv = mk(w, h); lightCx = lightCv.getContext('2d'); lightImg = lightCx.createImageData(w, h); lightU = new Uint32Array(lightImg.data.buffer); }
  LX0 = x0; LY0 = y0; emitters.length = 0;
  const vx0 = x0 + M - 1, vx1 = x0 + M + Math.ceil(VW / T) + 1, vy0 = y0 + M - 1, vy1 = y0 + M + Math.ceil(VH / T) + 1;
  const sky = skyLight;
  for (let j = 0; j < h; j++) {
    const gy = y0 + j, row = j * w;
    for (let i = 0; i < w; i++) {
      const gx = x0 + i, k = row + i; let L = 0, d = 0.088;
      if (gy < 0) L = sky;
      else if (gy >= WH) d = 0.45;
      else {
        const ti = gy * WW + wrapX(gx), t = tiles[ti];
        if (SOLID[t] && t !== GATE) d = 0.28; else { if (t === LEAVES) d = 0.15; if (walls[ti] === 0) L = sky; }
        if (agua.length && agua[ti]) { if (d < 0.13) d = 0.13; if (agua[ti] === 2 && L < 0.3) L = 0.3; }   // water dims the light faster; plankton glows (js/171-agua.js)
        const em = EMIT[t]; if (em > 0) { if (em > L) L = em; if (gx >= vx0 && gx <= vx1 && gy >= vy0 && gy <= vy1) emitters.push(gx, gy, t); }
      }
      LB[k] = L; DB[k] = d;
    }
  }
  const addL = (wx, wy, v) => { const i = Math.floor(wx / T) - x0, j = Math.floor(wy / T) - y0; if (i >= 0 && j >= 0 && i < w && j < h) { const k = j * w + i; if (LB[k] < v) LB[k] = v; } };
  // o herói não tem luz própria (Jonathan, 2026-10-10): só itens com +Luz
  if (!pl.dead && pl.light > 0) { const pv = 0.7 + 0.08 * pl.light; addL(pl.x + pl.w / 2, pl.y + 4, pv); addL(pl.x + pl.w / 2, pl.y + pl.h - 4, pv); }
  for (const o of projs) if (o.kind !== 'arrow') addL(o.x, o.y, 0.6);
  villageLights((x, y, v) => addL(x, y, v));
  propLights(addL, x0, y0, w, h);
  for (const e of enemies) if (e.type === 'lurker' || e.type === 'skull' || e.type === 'ghost') addL(e.x + e.w / 2, e.y + e.h / 2, e.type === 'skull' ? 0.5 : e.type === 'ghost' ? 0.3 * (e.vis || 0) : 0.32); else if (e.boss) { addL(e.x + e.w / 2, e.y + 8, 0.5); addL(e.x + e.w / 2, e.y + e.h - 6, 0.45); }
  for (let it = 0; it < 2; it++) {
    for (let j = 0; j < h; j++) {
      const r = j * w;
      for (let i = 1; i < w; i++) { const k = r + i, v = LB[k - 1] - DB[k]; if (v > LB[k]) LB[k] = v; }
      for (let i = w - 2; i >= 0; i--) { const k = r + i, v = LB[k + 1] - DB[k]; if (v > LB[k]) LB[k] = v; }
    }
    for (let i = 0; i < w; i++) {
      for (let j = 1; j < h; j++) { const k = j * w + i, v = LB[k - w] - DB[k]; if (v > LB[k]) LB[k] = v; }
      for (let j = h - 2; j >= 0; j--) { const k = j * w + i, v = LB[k + w] - DB[k]; if (v > LB[k]) LB[k] = v; }
    }
  }
  // fog of war for the map: anything lit on screen counts as seen
  let fresh = 0;
  for (let gy = Math.max(0, vy0); gy <= Math.min(WH - 1, vy1); gy++) for (let gx = vx0; gx <= vx1; gx++) { const idx = gy * WW + wrapX(gx); if (!seen[idx] && LB[(gy - y0) * w + gx - x0] > 0.1) { seen[idx] = 1; fresh++; } }
  if (fresh) mapVer++;
  const pty = (pl.y + pl.h / 2) / T, top = pty < surf[clamp(Math.floor((pl.x + 4) / T), 0, WW - 1)] + 6;
  const amb = top ? 0.1 : DARK.amb, ex = top ? 1.45 : DARK.ex, cap = top ? 0.97 : DARK.cap;
  for (let k = 0; k < w * h; k++) { let a = 1 - Math.max(LB[k], amb); a = a <= 0 ? 0 : Math.pow(a, ex) * cap; lightU[k] = pack(4, 3, 10, (a * 255) | 0); }
  lightCx.putImageData(lightImg, 0, 0);
}
