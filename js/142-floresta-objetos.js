'use strict';

/* ================= the petrified forest: props =================
   Everything bigger than a block that dresses A Floresta Petrificada (docs/camadas/07-floresta-petrificada.md,
   section 5). On the floor: big hollow stumps, short fallen trunks, roots arching out of the ground, boulders with
   stone ferns, the animals the stone caught (a deer standing, a boar lying, a wolf howling, an owl on its stump),
   split geodes and tall crystals lit from inside, a bubble of sap with an insect caught in it, stone bracket fungi at
   the foot of a trunk, heaps of cones and crystal leaves, an old ring of standing stones, and what the dwarves left in
   the Clareira: their dead fire, a basket of crystals, a bronze pick driven into a rock, the rune stones at the head
   of their stairs. Under the roof: hanging crystal canopies, curtains of fine roots, a stone bird on its nest,
   clusters of big pendants, a giant root coming down. On the back wall: wide trunks in relief, a hollow root door to
   nowhere, a huge fossil antler, bark scored by claws, a seam of sap shining in the rock.
   Same painter as 122/132 (6-tone ramps of the card's section 12, lit from the top left, dark rim only where the
   sprite touches air). The game is seen from the side: nothing is drawn as a disc lying on the floor; every prop
   stands on its floor row, hangs from its top row or is a flat piece of the back wall.
   Light only from crystal: the canopies, geodes and pendants (cold green-blue), the tall drusas (blue-white), the
   sap (faint lime), and the dwarves' dead fire (a faint ember that breathes, `anim: { k: 'fp_brasa' }`). The stone
   animals and trees give none. Props of two sizes carry `luzV` (one light list per variation, read by 122's wrapper)
   and an empty `luz`. Crystal props glint now and then (`fpGlint`, drawn by the hooks at the end).
   Registered with defProp (`floresta: true`), placed by 145 from FP_PROP_PLAN (same walk as 136's cdPlaceProps).
   Flags the generator must honour (fpPropFlagOk below checks them all):
     acampamento: true  only inside the dwarves' camp (fpCamp: x0..x1 on its floor fy), never elsewhere;
     escadaria: true    only on a floor within a few blocks of the head of a dwarf stair (fpExits);
     encosta: [d0, d1]  leans on a trunk: variation v needs a solid column on its side d[v] (-1 left, 1 right),
                        right against the sprite, for its whole height (the bracket fungi);
     faixaV: {...}      which variations each band uses (the small crystals in the Mata, both in the Clareira). */
const FP_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const FP_BACK_FLOOR = { fp_tronco_relevo: 1, fp_porta_raiz: 1, fp_galhada: 1 };
// can def (variation v, tile x px, tw x th tiles) stand on the floor row fy? (the flags above; plain props: always)
function fpPropFlagOk(def, v, px, tw, th, fy) {
  if (def.acampamento) { if (!fpCamp || px < fpCamp.x0 || px + tw - 1 > fpCamp.x1 || Math.abs(fy - fpCamp.fy) > 1) return false; }
  if (def.escadaria) { let ok = false; for (const e of fpExits) if (px + tw > e.x0 - 8 && px < e.x1 + 8 && Math.abs(fy - e.fy) <= 3) ok = true; if (!ok) return false; }
  if (def.encosta) {
    const d = def.encosta[v] || 0, cx = d < 0 ? px - 1 : px + tw;
    for (let y = fy - th; y < fy; y++) { const t = tiles[y * WW + ((cx % WW) + WW) % WW]; if (!SOLID[t] || !BLOCKY[t]) return false; }
  }
  return true;
}
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  // the card's ramps (section 12)
  granito: R6(['#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a']),
  casca: R6(['#221c18', '#3a3028', '#54463a', '#6e5e4e', '#8c7a66', '#ae9a84']),
  cerne: R6(['#2e2a22', '#4a4436', '#6a614c', '#8c8266', '#b0a688', '#d2caae']),
  raiz: R6(['#1e1814', '#33291f', '#4c3e2e', '#665440', '#836e56', '#a48c72']),
  cristal: R6(['#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec']),
  seiva: R6(['#2a3010', '#4a5418', '#6e7c22', '#9aa83a', '#c4cc6a', '#e6ecac']),
  platina: R6(['#3a3c44', '#5e626c', '#8a8e98', '#b4b8c0', '#d6d8dc', '#f0f0ec']),
  // the props' own
  feto: R6(['#141e18', '#22342a', '#344a3a', '#4a624c', '#647c62', '#82987c']),
  musgo: R6(['#0e1610', '#18241a', '#223424', '#2e4630', '#3e5a3c', '#52704c']),
  drusa: R6(['#1a2436', '#2c405e', '#4a6c96', '#7ca2cc', '#b2d0ea', '#e2eef6']),
  bronze: R6(['#1e140a', '#3a2612', '#5a3c1a', '#7c5626', '#9e7236', '#c09450']),
  azinhavre: R6(['#102420', '#1a3a32', '#245046', '#34685a', '#4a8270', '#669c88']),
  cinza: R6(['#141414', '#222120', '#33312e', '#47443f', '#5e5a53', '#78736a']),
  brasa: R6(['#1a0a06', '#3a1408', '#6a240a', '#a03a0e', '#d8601a', '#ff9a3a']),
  madeira: R6(['#100c09', '#1e1711', '#2e2319', '#3e3022', '#52402d', '#68523a']),
  couro: R6(['#150e0a', '#271a12', '#3a281c', '#4e3726', '#644832', '#7a5a40']),
  corda: R6(['#1c160e', '#32281a', '#4a3e28', '#625438', '#7c6c4a', '#94845e']),
  trapo: R6(['#1a0e0c', '#2e1814', '#46241e', '#5e322a', '#764438', '#8c5848']),
  cabo: R6(['#1a1612', '#2e2820', '#463c30', '#5e5242', '#786a56', '#94846c']),
  sombra: R6(['#030404', '#060807', '#0a0c0b', '#0e110f', '#131714', '#191e1a'])
};
const OUTLINE = ph('#050706');

/* ---- the painter (122's: 6 tones, it remembers each pixel's shade so a stain can keep the lighting) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, ramps, idOf,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    is(x, y, R) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0 && ramps[rid[y * w + x]] === R; },
    v(x, y) { return val[(y | 0) * w + (x | 0)]; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    blob(cx, cy, rx, ry, R, s, base = 2.6, flat = 1e9) { for (let y = Math.floor(cy - ry); y <= Math.min(flat, cy + ry); y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    // rim: the dark outline where the sprite meets air; rimFrom: rows above it get none (a piece that fades into the wall)
    done(rim = true, rimFrom = 0) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = rimFrom; y < h; y++) for (let x = 0; x < w; x++) {
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
// a thick curve: fn(t) -> [x, y], wd(t) its width; round in section, lit from the top left
function tube(P, fn, wd, R, s, base = 2.8, n = 0) {
  const [ax, ay] = fn(0), [bx, by] = fn(1); n = n || Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
// a stain over what is painted (moss, ash, soot): patches by noise, bias(x, y) thickens it; the shading is kept
function stain(P, R, cover, s, bias, lift = 0) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] === me) continue;
    const n = cn(x, y, 22, 22, s) + cn(x, y, 70, 70, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.8 + P.val[k] * 0.6 + cg(x, y, s + 2) * 0.6 + lift);
  }
}
// rubble along the floor row: chunks of R heaped from x0 to x1, up to hgt tall
function rubble(P, x0, x1, by, hgt, R, s) {
  for (let k = 0; k < (x1 - x0) * 0.8; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), t = (x - x0) / (x1 - x0), y = by - hash2(k, 1, s) * hgt * Math.sin(t * Math.PI); P.blob(x, y, 1 + hash2(k, 2, s) * 1.4, 0.8 + hash2(k, 3, s), R, s + k, 2.4, by); }
  for (let x = x0; x <= x1; x++) if (hash2(x, 4, s) < 0.7) P.put(x, by, R, 1.8 + hash2(x, 5, s));
}
// stone bark on a standing trunk: rows y0..y1, centre c(y), half width hw(y); furrows that wander down it, lit from the left
function bark(P, y0, y1, c, hw, R, s, base = 2.7) {
  for (let y = y0; y <= y1; y++) {
    const C = c(y), H = hw(y);
    for (let x = Math.floor(C - H); x <= C + H; x++) {
      const u = (x + 0.5 - C) / H; if (Math.abs(u) > 1) continue;
      const f = (x - C) + Math.sin(y * 0.19 + s) * 0.9 + cn(x, y, 40, 8, s) * 2.4, fr = ((f % 3.4) + 3.4) % 3.4;
      let v = base + 0.2 - u * 1.3 - Math.pow(Math.abs(u), 4) * 0.9 + cg(x, y, s) * 0.45;
      if (fr < 0.9) v -= 1.25; else if (fr < 1.7) v += 0.45;
      if (hash2(x >> 1, y >> 2, s + 3) < 0.04) v -= 1.2;   // a split in the plates
      P.put(x, y, R, v);
    }
  }
}
// fibres twisting along a painted root (darken diagonal strands over what is already R)
function fibres(P, R, s, slope = 1.1, period = 4) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!P.is(x, y, R)) continue;
    const f = x * 0.55 + y * slope + Math.sin(x * 0.21 + y * 0.13 + s) * 1.6 + cn(x, y, 30, 30, s) * 3, fr = ((f % period) + period) % period;
    if (fr < 0.9) P.put(x, y, R, P.v(x, y) - 1.1); else if (fr < 1.5) P.put(x, y, R, P.v(x, y) + 0.35);
  }
}
// a crystal prism with its foot at (x0, yb), length h, width w, leaning by ang (0 up, + to the right, PI hangs down);
// a lit facet on the left, a darker one on the right, a bright core, the point faceted
function prism(P, x0, yb, h, w, ang, R, s, base = 2.8) {
  const sa = Math.sin(ang), ca = Math.cos(ang), hw = w / 2, tipL = Math.max(1.6, w * 0.95), m = Math.ceil(h + w), fl = ca >= 0 ? 1 : -1;
  for (let py = Math.floor(yb - m); py <= yb + m; py++) for (let px = Math.floor(x0 - m); px <= x0 + m; px++) {
    const dx = px + 0.5 - x0, dy = yb + 1 - (py + 0.5), v = dx * sa + dy * ca, u = (dx * ca - dy * sa);
    if (v < 0 || v > h) continue;
    const lim = v > h - tipL ? hw * (h - v) / tipL : hw; if (Math.abs(u) > lim + 0.05) continue;
    const uu = u * fl / hw;
    let c = base + (uu < -0.35 ? 1.1 : uu > 0.35 ? -0.7 : 0.35) + (Math.abs(uu + 0.3) < 0.18 && w > 2.5 ? 1.2 : 0) + cg(px, py, s) * 0.3;
    if (v > h - tipL) c += uu < 0 ? 0.7 : -0.2;
    if (Math.abs(u) > lim - 0.6 && w > 2.5) c -= 0.5;
    c += Math.sin(v / h * Math.PI) * 0.4;
    P.put(px, py, R, c);
  }
}
// a crystal leaf hanging or lying: a lens from (x, y) along angle ang, length L; vein bright
function leaf(P, x, y, L, ang, R, s, base = 3) {
  const sa = Math.sin(ang), ca = Math.cos(ang);
  for (let i = 0; i <= L * 2; i++) {
    const t = i / (L * 2), wd = Math.sin(Math.pow(t, 0.8) * Math.PI) * (L > 4 ? 1.4 : 1), px = x + sa * t * L, py = y - ca * t * L;
    for (let k = -1; k <= 1; k++) { if (Math.abs(k) > wd) continue; const edge = Math.abs(k) > wd - 0.5; P.put(px + ca * k, py + sa * k, R, base + (k === 0 ? 1 : k < 0 ? 0.3 : -0.6) - (edge ? 0.8 : 0) - t * 0.5 + cg(px, py + k, s) * 0.3); }
  }
}
// the brightest crystal pixels of a painter (where the glints go): up to n of them, spread out
function glintsOf(P, n = 5) {
  const out = [], cr = P.idOf(RP.cristal), dr = P.idOf(RP.drusa);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const k = y * P.w + x; if (P.c[k] && (P.rid[k] === cr || P.rid[k] === dr) && P.val[k] >= 4.3) out.push([x, y, hash2(x, y, 977)]); }
  out.sort((a, b) => a[2] - b[2]);
  const pick = [];
  for (const p of out) { if (pick.length >= n) break; if (pick.some(q => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 6)) continue; pick.push([p[0], p[1]]); }
  return pick;
}
const GL = {};   // the glints of the last painter, by its name

/* =============================== FLOOR =============================== */
function hollowStump(k) {   // 32 x 30 or 40 x 38: a big hollow stump of stone, its top snapped into splinters, a black hollow at its foot rimmed with pale heartwood, roots flared into the floor
  const W = k ? 40 : 32, H = k ? 38 : 30, P = painter(W, H), s = 14201 + k, yb = H - 1, cx = W / 2 - 0.5, hw0 = W / 2 - 7;
  bark(P, 0, yb, () => cx, y => hw0 + Math.pow(Math.max(0, (y - yb + 9) / 9), 2) * 5, RP.casca, s);
  // the top: snapped, a tall splinter at the left, a lower jagged break across
  for (let x = 0; x < W; x++) {
    const u = (x - (cx - hw0)) / (2 * hw0), sp = u < 0.32 ? Math.max(0, 1 - Math.abs(u - 0.15) * 5.5) : 0;
    const top = Math.round(H * 0.3 - sp * H * 0.28 + hash2(x, 0, s) * 3 + (u > 0.7 ? (u - 0.7) * 10 : 0));
    for (let y = 0; y < top; y++) P.clear(x, y);
    for (let j = 0; j < 2; j++) if (P.has(x, top + j)) P.put(x, top + j, RP.cerne, 4.2 - j * 1.2 - u * 0.8 + cg(x, j, s) * 0.5);   // the broken edge
  }
  // the hollow: a ragged arch at its foot, black inside, pale heartwood round its lip
  const ac = cx + 1.5, aw = hw0 * 0.4, ay = yb - H * 0.36;
  const inArch = (x, y, g = 0) => { const dx = x + 0.5 - ac, r = aw + g + cn(x, y, 50, 50, s) * 2.2 + (hash2(x, y >> 1, s) - 0.5) * 0.8; return y <= yb && (Math.abs(dx) < r && (y > ay + aw || Math.hypot(dx, (y + 0.5 - (ay + aw)) * 0.8) < r)); };
  for (let y = 0; y <= yb; y++) for (let x = 0; x < W; x++) {
    if (!P.has(x, y)) continue;
    if (inArch(x, y)) P.put(x, y, RP.casca, 0.9 - (y - ay) / (yb - ay) * 0.6 + (x > ac + aw * 0.4 ? 0.3 : 0) + cg(x, y, s) * 0.5);   // the dark inside, its far wall barely seen
    else if (inArch(x, y, 1.2) && hash2(x, y, s + 4) < 0.75) P.put(x, y, RP.cerne, 2.8 - (x - ac) / aw * 0.9 - (y < ay + aw ? -0.4 : 0.4) + cg(x, y, s) * 0.5);
  }
  // inside, a little crystal grown in the dark
  for (const [x, h] of [[ac - 2, 3], [ac, 4], [ac + 2, 2]]) for (let j = 0; j < h; j++) P.put(x, yb - j, RP.cristal, 2.6 + j * 0.3);
  // roots out over the floor each side
  tube(P, t => [cx - hw0 - 2 - t * (cx - hw0 - 2), yb - 4 + t * 3.6], t => 5 - t * 3, RP.casca, s + 2, 2.6);
  tube(P, t => [cx + hw0 + 2 + t * (W - 2 - cx - hw0 - 2), yb - 3.5 + t * 3.2], t => 4.4 - t * 2.6, RP.casca, s + 3, 2.2);
  stain(P, RP.musgo, 0.02, s, (x, y) => (y > yb - 6 ? 0.45 : -0.3) + (x < cx - hw0 + 2 ? 0.15 : 0), 0.3);
  rubble(P, 1, W - 2, yb, 1, RP.granito, s + 9);
  return P.done();
}
function fallenLog(k) {   // 46 x 18 or 40 x 22: a short trunk lying where it fell: furrows along it, one end snapped to splinters of heartwood, moss on its back (k 1: thicker, a broken branch standing up off it)
  const W = k ? 40 : 46, H = k ? 22 : 18, P = painter(W, H), s = 14221 + k, yb = H - 1, r = k ? 7.5 : 6.5, xa = 5, xb = W - 2;
  for (let x = xa; x <= xb; x++) {
    const t = (x - xa) / (xb - xa), rr = r * (1 - t * 0.12), cy = yb + 1 - r * (1 - t * 0.12), cut = x > xb - 3 ? (x - xb + 3) * 0.7 : 0;
    for (let y = Math.floor(cy - rr); y <= yb; y++) {
      const u = (y + 0.5 - cy) / rr; if (Math.abs(u) > 1 - cut * 0.1 && y < yb) continue;
      const f = y + Math.sin(x * 0.17 + s) * 0.9 + cn(x, y, 8, 40, s) * 2.4, fr = ((f % 3.2) + 3.2) % 3.2;
      let v = 2.8 - u * 1.4 - Math.pow(Math.abs(u), 4) * 0.8 + cg(x, y, s) * 0.45 - t * 0.3;
      if (fr < 0.9) v -= 1.2; else if (fr < 1.6) v += 0.4;
      P.put(x, y, RP.casca, v);
    }
    if (x >= xb - 1) for (let y = Math.floor(cy - rr + 1); y <= yb; y++) if (P.has(x, y)) P.put(x, y, RP.cerne, 3 - (x - xb + 1) * 0.8 - (y - cy) / rr * 0.8);   // the old cut, edge on
  }
  // the snapped end: the break is ragged, splinters of pale heartwood stand out of it to the left
  const cy0 = yb + 1 - r;
  for (let j = -Math.floor(r) + 1; j < r; j++) {
    const y = Math.round(cy0 + j), bite = Math.round(hash2(j >> 1, 7, s) * 4);
    for (let i = 0; i < bite; i++) P.clear(xa + i, y);
    const L = hash2(j, 0, s) < 0.45 ? Math.round(2 + hash2(j, 2, s) * 5) : 0;
    for (let i = 0; i < L; i++) P.put(xa + bite - 1 - i, y + (i > 2 && hash2(j, 1, s) < 0.5 ? (j < 0 ? -1 : 1) : 0), RP.cerne, 3.4 - i * 0.3 - j / r * 0.7);
    P.put(xa + bite, y, RP.cerne, 2.8 - j / r);
  }
  mossTop(P, 0.55, s);
  if (k) { tube(P, t => [24 + t * 6, yb - r * 2 + 3 - t * 12], t => 4.2 - t * 1.6, RP.casca, s + 5, 2.6); const [bx, by] = [30, yb - r * 2 + 3 - 12]; for (let i = 0; i < 4; i++) P.put(bx - 1 + i, by - (i % 2), RP.cerne, 3.4 - i * 0.3); }   // a branch standing off it, snapped
  // cones and grit at the foot
  for (const x of [xa + 3, W * 0.55, xb - 6]) P.blob(x, yb - 0.6, 1.6, 1.2, RP.casca, s + x, 3, yb);
  rubble(P, 0, W - 1, yb, 1, RP.granito, s + 9);
  return P.done();
}
function rootArch(k) {   // 44 x 24 or 52 x 30: a root of stone arching out of the floor and back in, fibres twisting along it, fine rootlets under it, heaps of broken ground where it goes in (k 1: a second root crossing it)
  const W = k ? 52 : 44, H = k ? 30 : 24, P = painter(W, H), s = 14241 + k, yb = H - 1;
  if (k) tube(P, t => [W - 6 - t * (W - 18), yb - Math.sin(t * Math.PI) * (H * 0.55)], t => 5 - Math.sin(t * Math.PI) * 1.4, RP.raiz, s + 1, 2.2);
  tube(P, t => [4 + t * (W - (k ? 16 : 10)), yb - Math.sin(t * Math.PI) * (H - 6) + t * 1], t => 7.5 - Math.sin(t * Math.PI) * 2.6, RP.raiz, s, 2.8);
  fibres(P, RP.raiz, s);
  // rootlets hanging under the arch
  for (let x = 8; x < W - 8; x += 3) { let y = -1; for (let yy = yb - 2; yy > 0; yy--) if (P.is(x, yy, RP.raiz)) { y = yy; break; } if (y < 0 || y > yb - 4 || hash2(x, 0, s) < 0.35) continue; const L = 1 + Math.floor(hash2(x, 1, s) * 4); for (let j = 1; j <= L; j++) P.put(x + (j > 2 ? 1 : 0), y + j, RP.raiz, 2.6 - j * 0.3); }
  // the ground broken where it goes in
  rubble(P, 0, 12, yb, 3, RP.granito, s + 5); rubble(P, W - (k ? 18 : 13), W - 1, yb, 3, RP.granito, s + 6);
  mossTop(P, 0.4, s);
  return P.done();
}
// a stone fern: a stem from (x, y) curving out, leaflets either side, the tip curled
function frond(P, x, y, L, ang, curl, s, R = RP.musgo, base = 3.2) {
  let px = x, py = y, a = ang;
  for (let i = 0; i < L; i++) {
    const t = i / L; a += curl * (0.4 + t * 1.6) / L;
    px += Math.sin(a); py -= Math.cos(a);
    P.put(px, py, R, base + 0.6 - t * 0.6 + cg(px, py, s) * 0.3);
    const lf = Math.round((1 - t) * 3 + 0.4);
    if (i > 1 && i % 2 === 0 && t < 0.85) for (const sd of [-1, 1]) for (let j = 1; j <= lf; j++) P.put(px + Math.cos(a) * j * sd + Math.sin(a) * j * 0.5, py + Math.sin(a) * j * sd - Math.cos(a) * j * 0.5, R, base + (sd < 0 ? 0.6 : -0.5) - j * 0.2 + cg(px + j, py, s) * 0.4);
  }
}
function fernRock() {   // 34 x 24: a boulder of green granite, moss on its back, stone ferns grown out at its foot and from a crack in its top
  const W = 34, H = 24, P = painter(W, H), s = 14261, yb = H - 1;
  frond(P, 28, yb - 8, 12, 0.6, 1.7, s + 3, RP.feto, 2.2);   // behind, darker
  for (let y = 6; y <= yb; y++) for (let x = 9; x < W - 2; x++) {
    const dx = (x + 0.5 - 21) / 11.5, dy = (y + 0.5 - 16) / 9.5, d = dx * dx + dy * dy + cn(x, y, 20, 20, s) * 0.35; if (d > 1) continue;
    let v = 3 - dx * 1.1 - dy * 1.2 - d * 0.6 + cn(x, y, 50, 50, s + 1) * 0.8 + cg(x, y, s) * 0.5;
    if (hash2(x, y, s + 2) < 0.08) v += 1;   // the speckle
    P.put(x, y, RP.granito, v);
  }
  P.line(17, 9, 19, 17, RP.granito, 1, 1); P.line(19, 17, 18, 22, RP.granito, 1.2, 1);   // a crack
  mossTop(P, 0.6, s);
  frond(P, 9, yb, 15, -0.5, -1.8, s, RP.feto, 4); frond(P, 11, yb, 12, -0.05, -1.4, s + 1, RP.feto, 3.6); frond(P, 6, yb, 9, -1, -1.2, s + 4, RP.feto, 3.2);
  frond(P, 20, 9, 10, 0.25, 1.5, s + 2, RP.feto, 4.2); frond(P, 18, 9, 7, -0.5, -1.3, s + 5, RP.feto, 3.8);
  rubble(P, 2, W - 1, yb, 1, RP.granito, s + 9);
  return P.done();
}
// moss on the top surfaces only (where the rain of dust settles): patches by noise, a pixel or two thick
function mossTop(P, cover, s, R = RP.musgo) {
  const me = P.idOf(R), mark = [];
  for (let y = 1; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] === me || P.c[k - P.w]) continue;
    if (cn(x, y, 30, 30, s) + 0.5 < 1 - cover) continue;
    mark.push([x, y, 1 + (hash2(x, y, s) < 0.5 ? 1 : 0)]);
  }
  for (const [x, y, d] of mark) for (let j = 0; j < d; j++) if (P.has(x, y + j)) P.put(x, y + j, R, 3.6 - j * 1.1 - x / P.w * 0.6 + cg(x, y + j, s) * 0.6);
}
// stone animals: granite, a little moss on the back, a dull crystal eye (no light), chips and cracks
function stoneAnimal(P, s) {
  mossTop(P, 0.45, s);
  for (let k = 0; k < 14; k++) { const x = (hash2(k, 0, s) * P.w) | 0, y = (hash2(k, 1, s) * P.h) | 0; if (P.is(x, y, RP.granito) && P.is(x + 1, y + 1, RP.granito)) { P.put(x, y, RP.granito, P.v(x, y) - 1.2); P.put(x + 1, y + 1, RP.granito, P.v(x, y) - 0.6); } }
}
function deer() {   // 36 x 46: a deer turned to stone where it stood: head up, listening, antlers of root
  const W = 36, H = 46, P = painter(W, H), s = 14281, yb = H - 1, G = RP.granito;
  // a leg: from the body down to the hoof, through a knee (front) or a hock (hind); thick at the top, thin below
  const leg = (pts, base, sd) => { const n = pts.length - 1; tube(P, t => { const f = t * n, i = Math.min(n - 1, Math.floor(f)), q = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q]; }, t => t < 0.3 ? 3.6 - t * 4 : 2.2 - t * 0.4, G, sd, base); const [hx, hy] = pts[n]; P.put(hx - 1, hy, G, base - 1.2); P.put(hx, hy, G, base - 1); P.put(hx + 1, hy, G, base - 1.6); };
  leg([[17, 28], [17.5, 36], [17, yb - 0.5]], 1.5, s + 1);            // far fore
  leg([[26, 28], [28.5, 36], [27, yb - 0.5]], 1.5, s + 2);            // far hind
  P.blob(21.5, 25, 10.5, 5.4, G, s, 2.8);                              // the barrel
  P.blob(29, 24, 4.8, 5.6, G, s + 3, 2.6);                             // the haunch
  P.blob(14.5, 25.5, 4.4, 5.6, G, s + 4, 3);                           // the chest
  leg([[14, 29], [13.5, 37], [13, yb - 0.5]], 2.8, s + 5);            // near fore
  leg([[30, 28], [32, 36], [30, yb - 0.5]], 2.5, s + 6);              // near hind
  tube(P, t => [14 - t * 5, 23 - t * 10.5], t => 5.6 - t * 2.4, G, s + 7, 3);   // the neck, up
  P.blob(8.2, 11.6, 3.4, 2.8, G, s + 8, 3.1);                          // the head
  tube(P, t => [7 - t * 5, 12 + t * 2.4], t => 3.2 - t * 1.2, G, s + 9, 2.8);   // the muzzle
  P.put(1, 14, RP.sombra, 2); P.put(2, 15, G, 1.4);                    // nose, mouth
  tube(P, t => [10 + t * 4.4, 9.6 - t * 3], t => 2.4 - t * 1.4, G, s + 10, 2.6);   // the ear, up and back
  P.put(7, 11, RP.cristal, 1.4);                                        // the eye, its crystal gone dull
  P.line(31, 19, 33, 18, G, 3.4, 1);                                    // the tail up
  for (let x = 15; x < 28; x++) P.put(x, 30, G, 1.3);                   // the belly's shadow
  // the antlers: root, up and back, tines up off them
  const ant = (x0, sd, base) => {
    const bm = t => [x0 + t * 7 * sd + Math.sin(t * 2) * 1.5, 9 - t * 9];
    tube(P, bm, t => 1.9 - t * 0.9, RP.raiz, s + x0, base);
    for (const [t, l, a] of [[0.2, 4, -0.9], [0.5, 4, -0.3], [0.8, 3, 0.2]]) { const [x, y] = bm(t); P.line(x, y, x + a * l, y - l, RP.raiz, base + 0.5, 1); }
  };
  ant(7.5, -0.45, 1.8); ant(9.5, 1, 3);
  stoneAnimal(P, s);
  rubble(P, 9, 33, yb, 1, RP.granito, s + 19);
  return P.done();
}
function boar() {   // 38 x 17: a boar lying on the floor, legs tucked, a heavy head on the ground, the bristles of its back gone to a ridge, a tusk
  const W = 38, H = 17, P = painter(W, H), s = 14301, yb = H - 1, G = RP.granito;
  P.blob(23, 10.4, 13.6, 6.4, G, s, 2.6, yb);            // the body, its belly on the floor
  P.blob(13, 8.6, 6.4, 7.6, G, s + 1, 2.9, yb);          // the hump of the shoulders
  tube(P, t => [9 - t * 7, 9 + t * 2.4], t => 9.4 - t * 5, G, s + 2, 2.9);   // the head, a long wedge
  for (let y = 9; y <= 13; y++) { P.put(0, y, G, 2.2 + (y === 9 ? 1 : 0)); P.put(1, y, G, 2.8); }   // the snout's disc, end on
  P.put(0, 11, RP.sombra, 2);
  P.line(3, 13, 5, 9, RP.cerne, (t) => 3.8 - t * 0.6, 1); P.put(6, 9, RP.cerne, 3);   // the tusk
  for (let j = 0; j < 5; j++) { P.put(10 + j * 0.3, 4 - j, G, 3.2 - j * 0.2); P.put(11 + j * 0.3, 4 - j, G, 2.2); if (j < 3) P.put(12, 4 - j, G, 1.8); }   // the ear, pricked
  P.put(6, 9, RP.cristal, 1.4);                            // the eye
  for (let x = 8; x < 30; x++) { const bx = x < 14 ? 13 : 23, rx = x < 14 ? 6.4 : 14, ry = x < 14 ? 7.4 : 6.4, cy = x < 14 ? 9 : 10.4, y = Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - Math.pow((x + 0.5 - bx) / rx, 2)))); if (x % 2) P.put(x, y - 1, G, 3.6); P.put(x, y + 1, G, 1.8); }   // the bristle ridge
  P.blob(12, 15.2, 3.4, 1.6, G, s + 4, 2.2, yb); P.put(9, yb, G, 1.4); P.put(10, yb, G, 1.2);   // a fore leg tucked, the hoof
  P.blob(31, 15, 3.6, 1.8, G, s + 5, 2, yb);
  P.line(36, 9, 37, 11, G, 2.6, 1);                       // the tail
  for (let x = 14; x < 34; x++) P.put(x, 14, G, 1.6 + (x % 3 === 0 ? 0.4 : 0));   // the flank's fold
  stoneAnimal(P, s);
  return P.done();
}
function wolf() {   // 26 x 32: a wolf sat on its haunches, head thrown back, howling: the stone took it mid-cry
  const W = 26, H = 32, P = painter(W, H), s = 14321, yb = H - 1, G = RP.granito;
  tube(P, t => [6 - t * 5, yb - 1.4 - Math.sin(t * Math.PI) * 1.4], t => 3.6 - t * 1.4, G, s + 5, 2.2);   // the tail, along the floor
  P.blob(17.5, 29.6, 2.6, 1.6, G, s + 8, 1.6, yb);          // the far forepaw
  P.blob(9.5, 24, 6.2, 6.6, G, s, 2.6, yb);                 // the haunch
  P.blob(7, yb - 0.8, 4.6, 1.6, G, s + 1, 2.3, yb);         // the hind paw
  tube(P, t => [10 + t * 6, 22 - t * 10], t => 8.6 - t * 1.8, G, s + 2, 2.8);   // the back and chest, up
  P.blob(17.4, 17.5, 3.4, 4.8, G, s + 6, 3);                // the chest
  tube(P, t => [17.8, 20 + t * (yb - 21)], t => 2.8 - t * 0.6, G, s + 7, 2.8); P.put(17, yb, G, 2.4); P.put(18, yb, G, 2.6); P.put(19, yb, G, 2);   // the near foreleg
  tube(P, t => [16.6 + t * 1, 13 - t * 5], () => 4.4, G, s + 9, 3);   // the neck
  P.blob(18.4, 6.8, 3.2, 3, G, s + 3, 3.1);                  // the head
  tube(P, t => [19.6 + t * 4.6, 5.6 - t * 5], t => 3.4 - t * 1.6, G, s + 4, 3);   // the muzzle, to the roof
  P.line(21, 5, 23.6, 2, RP.sombra, 2.4, 1);                // the mouth open
  tube(P, t => [16.4 - t * 2.4, 5 - t * 3.6], t => 2.8 - t * 1.6, G, s + 10, 2.6);   // the ear laid back
  P.put(19, 6, RP.cristal, 1.4);
  for (let y = 9; y < 20; y += 2) P.put(14.2 + (y - 9) * 0.1, y, G, 3.8);   // the ruff
  stoneAnimal(P, s);
  return P.done();
}
function owl() {   // 18 x 30: an owl of stone on a short stump, ear tufts up, eyes round and blind, talons over the edge
  const W = 18, H = 30, P = painter(W, H), s = 14341, yb = H - 1, G = RP.granito;
  bark(P, 18, yb, () => 9, y => 5.5 + Math.pow(Math.max(0, (y - yb + 3) / 3), 2) * 2, RP.casca, s);
  for (let x = 3; x < 15; x++) { P.put(x, 18, RP.cerne, 4 - (x - 3) * 0.12); P.put(x, 19, RP.cerne, 2.8 - (x - 3) * 0.1); }   // the cut top, edge on
  P.blob(9, 11, 5.4, 7.4, G, s, 2.8, 18);                 // the body
  for (let y = 9; y < 18; y++) { P.put(4 + (y > 14 ? 1 : 0), y, G, 1.6); P.put(13 - (y > 14 ? 1 : 0), y, G, 1.6); }   // wing edges
  for (let y = 10; y < 17; y += 2) for (let x = 7; x < 12; x += 2) P.put(x + ((y >> 1) % 2), y, G, 3.9);   // breast feathers
  for (const ex of [6.5, 11.5]) for (let y = 3; y < 9; y++) for (let x = Math.floor(ex - 2.5); x <= ex + 2.5; x++) { const d = Math.hypot(x + 0.5 - ex, y + 0.5 - 5.5); if (d < 1.1) P.put(x, y, RP.cristal, 1.6); else if (d < 2.4) P.put(x, y, G, 4.1 - (x - ex) * 0.35 - (y - 5.5) * 0.2); }   // the facial discs, upright
  P.put(9, 6, G, 1.2); P.put(9, 7, RP.cerne, 2.6); P.put(9, 8, RP.cerne, 1.8);   // beak
  P.line(4, 3, 3, 0, G, 3, 1); P.line(14, 3, 15, 0, G, 2.2, 1);   // ear tufts
  for (const x of [6, 7, 10, 11]) { P.put(x, 18, RP.cerne, 1.6); P.put(x, 19, G, 3); }   // talons
  stoneAnimal(P, s);
  return P.done();
}
function geode() {   // 34 x 26: a big geode split in two, the half left standing showing its cut face: a rough shell, a band of chalcedony, a hollow lined with crystal points glowing from inside; a broken piece at its foot
  const W = 34, H = 26, P = painter(W, H), s = 14361, yb = H - 1, cx = 15.5, cy = 13.5, rx = 14.4, ry = 12.6;
  for (let y = 0; y <= yb; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.sqrt(dx * dx + dy * dy) + cn(x, y, 24, 24, s) * 0.12; if (d > 1) continue;
    const a = Math.atan2(dy, dx);
    if (d > 0.82) { P.put(x, y, RP.granito, 2.8 - dx * 1.2 - dy * 1.2 + cg(x, y, s) * 0.6 - (d > 0.95 ? 0.5 : 0)); continue; }   // the rough shell
    if (d > 0.7) { P.put(x, y, RP.cristal, 1.4 + Math.sin(d * 60) * 0.4 - dx * 0.4 - dy * 0.3 + cg(x, y, s) * 0.3); continue; }   // chalcedony bands, dull
    // the points: teeth round the hollow pointing in, bright on their lit face, the hollow dark between them
    const tooth = Math.abs(((a / (Math.PI * 2) * 22 + cn(x, y, 30, 30, s) * 1.2) % 1 + 1) % 1 - 0.5) * 2, reach = 0.7 - (1 - tooth) * 0.42;
    if (d > reach) P.put(x, y, RP.cristal, 3.6 + (tooth > 0.5 ? 0.9 : -0.3) - dx * 0.4 - dy * 0.5 + (0.7 - d) * 2 + cg(x, y, s) * 0.3);
    else P.put(x, y, RP.cristal, 1.6 + (0.3 - d) * 3 + cg(x, y, s) * 0.3);   // the hollow, lit from within
  }
  for (let x = 0; x < W; x++) for (let y = yb + 1; y < H; y++) P.clear(x, y);
  // a broken piece of the other half at its foot (shell out, a few points showing)
  P.blob(29, yb - 2.2, 4.2, 3, RP.granito, s + 2, 2.4, yb); for (const [x, y] of [[27, 22], [28, 21], [30, 21]]) P.put(x, y, RP.cristal, 4);
  rubble(P, 0, W - 1, yb, 1, RP.granito, s + 9);
  GL.geodo = glintsOf(P, 5);
  return P.done();
}
function tallCrystals(k) {   // 26 x 34 or 36 x 48: a cluster of tall drusas out of a heap of broken rock, blue-white, lit from inside
  const W = k ? 36 : 26, H = k ? 48 : 34, P = painter(W, H), s = 14381 + k, yb = H - 1, sc = k ? 1.4 : 1;
  const L = k
    ? [[9, 22, 4, -0.42, 2.2], [27, 26, 4.4, 0.36, 2.2], [14, 34, 5, -0.16, 2.6], [22, 44, 6, 0.06, 2.9], [5, 12, 3, -0.7, 2.6], [31, 13, 3, 0.75, 2.6], [18, 16, 3.4, -0.3, 3], [26, 11, 3, 0.4, 3.1]]
    : [[7, 18, 4, -0.38, 2.4], [18, 20, 4, 0.32, 2.4], [12, 31, 5, 0.04, 2.9], [4, 9, 3, -0.7, 2.7], [22, 10, 3, 0.62, 2.7], [10, 8, 2.6, -0.2, 3.1]];
  for (const [x, h, w, a, b] of L) prism(P, x + 0.5, yb - 3, h, w, a, RP.drusa, s + x, b);
  rubble(P, 0, W - 1, yb, k ? 5 : 4, RP.granito, s + 9);
  for (let i = 0; i < 4 * sc; i++) { const x = 2 + hash2(i, 0, s) * (W - 4); prism(P, x, yb, 2 + hash2(i, 1, s) * 3, 2, (hash2(i, 2, s) - 0.5) * 1.6, RP.drusa, s + i, 2.6); }   // chips in the rubble
  GL['cristais' + k] = glintsOf(P, k ? 7 : 5);
  return P.done();
}
function sapBubble() {   // 22 x 20: a bubble of glassy sap oozed out of the floor and set, an insect with its wings spread caught in it, tiny air beads
  const W = 22, H = 20, P = painter(W, H), s = 14401, yb = H - 1, cx = 11, cy = 11;
  for (let y = 2; y <= yb; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / 8, dy = (y + 0.5 - cy) / 8.4, d = dx * dx + dy * dy, foot = y >= yb - 2 ? (y - yb + 3) * 1.6 : 0;
    if (d > 1 && !(foot > 0 && Math.abs(x + 0.5 - cx) < 5.5 + foot)) continue;
    const e = Math.min(1, d);
    // glass: dark at the rim, light gathered low on the far side, a sheen top left
    P.put(x, y, RP.seiva, 2.1 + (1 - e) * 0.9 + Math.max(0, dx + dy) * 0.9 * (1 - e) - (e > 0.8 ? 0.8 : 0) + cg(x, y, s) * 0.2);
  }
  // the insect, small and dark in the middle: body, wings (half clear), legs, feelers
  const I = RP.raiz;
  for (const sd of [-1, 1]) {
    for (let j = 0; j < 5; j++) for (let i = 1; i < 5 - (j > 2 ? 1 : 0); i++) P.put(cx - 0.5 + i * sd, 8 + j - Math.round(i * 0.4), RP.seiva, 1.3 + ((i + j) % 2) * 0.5);   // wings, veined
    P.line(cx - 0.5 + sd, 12, cx - 0.5 + sd * 3, 14, I, 1, 1); P.line(cx - 0.5 + sd, 10, cx - 0.5 + sd * 3, 9, I, 1, 1);
    P.put(cx - 0.5 + sd * 1.5, 6, I, 1.4); P.put(cx - 0.5 + sd * 2.5, 5, I, 1.4);
  }
  P.rect(cx - 1, 8, 2, 6, I, (i, j) => 1.2 + i * 0.4 - j * 0.05); P.put(cx - 1, 7, I, 1.6); P.put(cx, 7, I, 1.3); P.put(cx - 1, 14, I, 1); P.put(cx - 1, 15, I, 0.8);
  for (const [x, y] of [[6, 7], [15, 13], [6, 14], [14, 6], [16, 10]]) P.put(x, y, RP.seiva, 4.6);   // air beads
  for (let y = 5; y < 9; y++) P.put(6 + (y - 5) * 0.4, y, RP.seiva, 5); P.put(7, 4, RP.seiva, 4.4);   // the sheen, top left
  for (let x = 13; x < 17; x++) P.put(x, 16 - (x - 13) * 0.5, RP.seiva, 4);   // the light gathered low inside
  for (let x = 0; x < W; x++) if (hash2(x, 3, s) < 0.5) P.put(x, yb, RP.granito, 1.8 + hash2(x, 4, s));
  return P.done();
}
function bracketFoot(k) {   // 24 x 30: the foot of a trunk (k 0: on the left, k 1: on the right) with stone bracket fungi stepped up it, pores dark under them
  const W = 24, H = 30, P = painter(W, H), s = 14421 + k, yb = H - 1, X = x => k ? W - 1 - x : x;
  // the bark strip and its flare (the trunk it leans on goes on in the blocks beside it)
  const fl = y => 4 + Math.pow(Math.max(0, (y - yb + 8) / 8), 2) * 7;
  for (let y = 0; y <= yb; y++) { const F = fl(y); for (let x = 0; x <= F; x++) { const u = x / F, f = x + Math.sin(y * 0.2 + s) + cn(x, y, 40, 8, s) * 2, fr = ((f % 3.4) + 3.4) % 3.4; P.put(X(x), y, RP.casca, 2.4 + (k ? u * 0.5 : -u * 0.6) + (fr < 0.9 ? -1.2 : fr < 1.7 ? 0.4 : 0) + cg(x, y, s) * 0.4 - (x >= Math.floor(F) ? 0.7 : 0)); } }
  // the brackets: shells with a domed top in growth bands, a rolled lip, the underside pored and dark
  for (const [y0, w, th] of [[6, 9, 3.4], [12, 13, 4.4], [19, 11, 4], [24, 7, 2.6]]) {
    const x0 = Math.floor(fl(y0)) - 1;
    for (let i = 0; i <= w; i++) {
      const t = i / w, wav = Math.round(Math.sin(i * 1.3 + y0) * 0.4), hh = Math.max(1, Math.round(th * Math.pow(1 - t * t, 0.6))), top = y0 - hh + 1 + Math.round(t * 1.2) + wav;
      for (let j = 0; j < hh; j++) { const band = Math.floor((w - i + j * 1.5) / 2.2) % 2; P.put(X(x0 + i), top + j, RP.cerne, 2.6 + (j === 0 ? 1.1 : 0) - j * 0.35 + (band ? -0.5 : 0.2) - t * 0.4 + (i === w ? -0.6 : 0) + cg(i, top + j, s) * 0.35); }
      if (i < w) P.put(X(x0 + i), top + hh, RP.cerne, 1 + (i % 2) * 0.5);   // the pores
      if (i === w) P.put(X(x0 + i), top, RP.cerne, 4.2);         // the lip catches light
    }
  }
  mossTop(P, 0.35, s);
  rubble(P, 0, W - 1, yb, 1, RP.granito, s + 9);
  return P.done();
}
function coneHeap() {   // 30 x 11: a heap of stone cones and fallen crystal leaves swept against something
  const W = 30, H = 11, P = painter(W, H), s = 14441, yb = H - 1;
  for (let x = 1; x < W - 1; x++) { const h = Math.round(Math.sin((x - 1) / (W - 2) * Math.PI) * 4 + hash2(x, 0, s) * 1.2); for (let j = 0; j <= h; j++) P.put(x, yb - j, hash2(x, j, s) < 0.35 ? RP.cristal : RP.casca, 1.6 + j * 0.25 + hash2(x, j, s + 1) * 0.8); }   // the litter
  const cone = (cx, cy, up) => { const rx = up ? 1.9 : 3, ry = up ? 3 : 1.9; for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue; P.put(x, y, RP.casca, 3 - dx * 1 - dy * 0.8 + ((x + y * 2) % 3 === 0 ? -1.2 : 0.3)); } };
  for (const [x, y, u] of [[6, 7.5, 0], [11, 6, 1], [16, 7.6, 0], [21, 6.4, 1], [25, 8, 0], [14, 4, 0], [9, 8.6, 0]]) cone(x, y, u);
  for (const [x, y, L, a] of [[3, 8, 5, 1.2], [18, 4, 5, -1.1], [23, 9, 4, 1.4], [12, 2.6, 4, 1.7], [27, 7, 3, -1.4]]) leaf(P, x, y, L, a, RP.cristal, s + x, 3);
  return P.done();
}
function stoneCircle() {   // 56 x 30: the old ring of standing stones, seen from its edge: the near stones tall in a row, the far ones lower behind them, one fallen against its neighbour; lichen and a worn spiral
  const W = 56, H = 30, P = painter(W, H), s = 14461, yb = H - 1;
  const stone = (x, w, h, lean, base, sd) => {
    for (let y = yb - h; y <= yb; y++) {
      const t = (y - (yb - h)) / h, hw = w / 2 * (t < 0.25 ? Math.sqrt(t / 0.25) * 0.75 + 0.25 : 1) * (1 + (t > 0.85 ? (t - 0.85) * 0.6 : 0)), c = x + lean * (yb - y);
      for (let xx = Math.floor(c - hw); xx <= c + hw; xx++) { const u = (xx + 0.5 - c) / hw; if (Math.abs(u) > 1) continue; P.put(xx, y, RP.granito, base - u * 1.2 - (t < 0.1 ? -0.6 : 0) + cn(xx, y, 30, 30, sd) * 0.9 + cg(xx, y, sd) * 0.5); }
    }
  };
  for (const [x, w, h, l] of [[13, 6, 14, 0.02], [31, 7, 17, -0.03], [44, 5, 12, 0]]) stone(x, w, h, l, 1.8, s + x);   // far
  for (const [x, w, h, l, b] of [[5, 8, 22, -0.05, 2.9], [22, 9, 27, 0.02, 3], [38, 8, 21, 0.06, 2.8], [50, 6, 17, 0.42, 2.5]]) stone(x, w, h, l, b, s + x);   // near, the last fallen against the third
  // a worn spiral cut in the tallest
  for (let a = 0; a < 12; a += 0.25) { const r = a * 0.28; P.put(22 + Math.cos(a) * r, 12 + Math.sin(a) * r, RP.granito, 1.4); }
  mossTop(P, 0.5, s);
  for (let k = 0; k < 40; k++) { const x = (hash2(k, 0, s) * W) | 0, y = (hash2(k, 1, s) * H) | 0; if (P.is(x, y, RP.granito) && P.is(x + 1, y, RP.granito)) { P.put(x, y, RP.cerne, 1.8 + P.v(x, y) * 0.3); P.put(x + 1, y, RP.cerne, 1.4 + P.v(x, y) * 0.3); } }   // lichen, dim
  rubble(P, 0, W - 1, yb, 1.4, RP.granito, s + 9);
  return P.done();
}
const EMB = [];
function deadFire() {   // 32 x 18: the dwarves' fire, long dead: a ring of stones in a row, charred logs fallen into a heap of grey ash with a few embers still alive under it, a bronze pot tipped on its side, a stick for stirring
  const W = 32, H = 18, P = painter(W, H), s = 14481, yb = H - 1;
  EMB.length = 0;
  // the ash heap and the charred logs on it
  P.line(8, yb - 2, 21, yb - 9, RP.cinza, (t, k) => (k ? 0.6 : 2.2) + t * 0.4, 2); P.line(25, yb - 2, 11, yb - 7, RP.cinza, (t, k) => (k ? 0.8 : 2.6) - t * 0.3, 2);   // charcoal logs, the ash on their tops
  for (let x = 6; x < 26; x++) { const h = Math.round(Math.sin((x - 6) / 20 * Math.PI) * 4 + hash2(x, 0, s) * 1.2); for (let j = 0; j <= h; j++) P.put(x, yb - j, RP.cinza, 3.4 + (j === h ? 0.9 : 0) - (x - 6) * 0.05 + cg(x, j, s) * 0.9); }   // the ash heaped over their feet
  for (const [x, y] of [[21, yb - 9], [22, yb - 9], [21, yb - 8], [11, yb - 7], [25, yb - 2]]) P.put(x, y, RP.cinza, 4);   // grey ends
  for (const [x, y] of [[13, yb - 2], [16, yb - 3], [18, yb - 2], [20, yb - 4], [15, yb - 1], [19, yb - 1]]) { P.put(x, y, RP.brasa, 2.6 + hash2(x, y, s) * 1.2); EMB.push([x, y]); }
  // the stones, a row along the floor, the near ones bigger
  for (let k = 0; k < 7; k++) { const x = 3 + k * 4.4, r = 1.8 + hash2(k, 0, s) * 0.8; P.blob(x, yb - r * 0.7 + 0.4, r, r * 0.8, RP.granito, s + k, 2.6, yb); }
  // the pot, on its side by the fire, its mouth toward us edge on
  for (let y = yb - 5; y <= yb; y++) for (let x = 25; x < 32; x++) { const dy = (y + 0.5 - (yb - 2.4)) / 3, dx = (x + 0.5 - 28.5) / 3.3; if (dx * dx + dy * dy > 1) continue; P.put(x, y, hash2(x, y, s) < 0.3 ? RP.azinhavre : RP.bronze, 3.2 - dx - dy * 0.9 + cg(x, y, s) * 0.3); }
  for (let y = yb - 4; y <= yb - 1; y++) P.put(25, y, RP.bronze, 4); P.put(26, yb - 3, RP.sombra, 2); P.put(26, yb - 2, RP.sombra, 2);
  P.line(0, yb, 7, yb - 7, RP.madeira, (t) => 3 - t * 0.6, 1);   // the stirring stick leant in
  rubble(P, 0, W - 1, yb, 0, RP.cinza, s + 9);
  return P.done();
}
function crystalBasket() {   // 20 x 24: a dwarves' back basket of withy, bound in bronze, its straps, full of crystals; one fallen out
  const W = 20, H = 24, P = painter(W, H), s = 14501, yb = H - 1;
  // crystals over the rim first (the basket front goes over their feet)
  for (const [x, h, a] of [[5, 7, -0.45], [8, 10, -0.12], [11, 8, 0.25], [14, 6, 0.6], [9.5, 5, 0.1], [12.5, 11, 0.06]]) prism(P, x, 9, h, 2.6, a, RP.cristal, s + x, 3);
  for (let y = 8; y <= yb - 1; y++) {
    const t = (y - 8) / (yb - 9), hw = 7 - t * 2.6;
    for (let x = Math.floor(10 - hw); x <= 10 + hw; x++) {
      const u = (x + 0.5 - 10) / hw; if (Math.abs(u) > 1) continue;
      const row = (y - 8) >> 1, over = ((Math.floor((x - 10 + hw) / 2) + row) % 2 === 0);   // the weave: over and under
      P.put(x, y, RP.corda, 3.1 - u * 1.3 + (over ? 0.5 : -0.6) + ((y - 8) % 2 ? -0.5 : 0.2) + cg(x, y, s) * 0.3);
    }
  }
  for (let x = 3; x < 18; x++) { P.put(x, 8, RP.bronze, 4.2 - (x - 3) * 0.12); P.put(x, 9, RP.bronze, 2.6 - (x - 3) * 0.08); }   // the rim
  for (let x = 5; x < 16; x++) P.put(x, 18, RP.bronze, 3.2 - (x - 5) * 0.12);   // a band
  for (let y = 9; y < 21; y++) { P.put(17 - (y - 9) * 0.15, y, RP.couro, 3 - (y % 3 === 0 ? 1 : 0)); P.put(18 - (y - 9) * 0.15, y, RP.couro, 1.8); }   // a strap down the back
  for (let x = 6; x < 15; x++) P.put(x, yb, RP.corda, 1.8);   // the foot
  prism(P, 17.5, yb - 1, 5, 2.4, Math.PI / 2 + 0.15, RP.cristal, s + 30, 2.8);   // one fallen out, lying on its side
  GL.cesto = glintsOf(P, 3);
  return P.done();
}
function bronzePick() {   // 24 x 28: a dwarf's bronze pick driven point first into a rock, the haft standing up crooked, a rag tied on it
  const W = 24, H = 28, P = painter(W, H), s = 14521, yb = H - 1;
  const hx = 10, hy = 17;
  // the haft, old wood gone grey, leather wound near its end, a knob
  P.line(hx, hy, 18, 0, RP.cabo, (t) => 3.8 - t * 0.3, 1); P.line(hx + 1, hy, 19, 0, RP.cabo, 2.2, 1);
  for (let j = 0; j < 6; j++) { const t = 0.08 + j * 0.045, x = hx + (18 - hx) * t, y = hy * (1 - t); P.put(x, y - 1, RP.couro, 3.6 - (j % 2)); P.put(x + 1, y - 1, RP.couro, 2.4 - (j % 2) * 0.5); }
  P.put(18, 0, RP.cabo, 4.2); P.put(19, 0, RP.cabo, 3);
  // the rag, knotted on and hanging
  P.put(15, 6, RP.trapo, 3.6); P.put(16, 6, RP.trapo, 2.6); P.line(16, 7, 18, 11, RP.trapo, (t) => 3 - t, 1); P.line(15, 7, 15.6, 10, RP.trapo, 2.2, 1);
  // the head: across the haft's foot, one point curving up and out, the other in the rock
  tube(P, t => [hx + 0.5 - 8 * t, hy - 4 * t - Math.sin(t * Math.PI) * 1.4], t => 3.8 - t * 3.2, RP.bronze, s, 3.3);
  tube(P, t => [hx + 0.5 + 7 * t, hy + 4 * t], t => 3.8 - t * 2.4, RP.bronze, s + 1, 2.9);
  P.blob(hx + 0.5, hy, 2.2, 2.2, RP.bronze, s + 2, 3.1);   // the eye of the head round the haft
  for (let k = 0; k < 6; k++) { const x = hx - 6 + hash2(k, 0, s) * 10, y = hy - 3 + hash2(k, 1, s) * 6; if (P.is(x, y, RP.bronze)) P.put(x, y, RP.azinhavre, 2.6 + hash2(k, 2, s)); }   // verdigris
  // the rock over the buried point
  for (let y = 17; y <= yb; y++) for (let x = 3; x < 23; x++) { const dx = (x + 0.5 - 13) / 10, dy = (y + 0.5 - (yb + 1)) / 9.5 + cn(x, y, 30, 30, s) * 0.25, d = dx * dx + dy * dy; if (d > 1) continue; if (P.is(x, y, RP.bronze) && x < 14) continue; P.put(x, y, RP.granito, 3 - dx * 1.1 - dy * 1.4 - d * 0.5 + cg(x, y, s) * 0.5); }
  P.line(16, 21, 18, 24, RP.granito, 1, 1); P.line(18, 24, 21, 24, RP.granito, 1.2, 1);   // cracks out from the blow
  rubble(P, 0, W - 1, yb, 1, RP.granito, s + 9);
  return P.done();
}
function runeStone(k) {   // 16 x 32: a dwarf marker stone, squared and capped, a frame cut round a rune (k 0: the way down, an arrow; k 1: the stair rune)
  const W = 16, H = 32, P = painter(W, H), s = 14541 + k, yb = H - 1, G = RP.granito;
  for (let y = 0; y <= yb; y++) {
    const cap = y < 5, hw = cap ? 1.5 + y * 1.2 : 6, c = 8;
    for (let x = Math.floor(c - hw); x < c + hw; x++) { const u = (x + 0.5 - c) / hw; P.put(x, y, G, (cap ? (u < 0 ? 4 : 2.2) : 3 - u * 1.2 + (x === Math.floor(c - hw) ? 0.8 : 0)) + cn(x, y, 30, 30, s) * 0.6 + cg(x, y, s) * 0.45); }
  }
  for (let x = 2; x < 14; x++) { P.put(x, 5, G, 4.2); P.put(x, 6, G, 1.8); }   // the cap's lip
  // the frame: a groove (dark) with its lower lip catching light
  const groove = (x, y) => { P.put(x, y, G, 1.1); P.put(x + (y > 0 ? 0 : 0), y + 1, G, P.has(x, y + 1) ? 3.8 : 0); };
  for (let x = 4; x < 12; x++) { groove(x, 9); groove(x, 25); }
  for (let y = 9; y < 26; y++) { P.put(4, y, G, 1.1); P.put(11, y, G, 1.1); P.put(5, y, G, 3.6); }
  if (!k) { for (let y = 12; y < 22; y++) P.put(7.5, y, G, 1); P.line(5.5, 18, 7.5, 22, G, 1, 1); P.line(9.5, 18, 7.5, 22, G, 1, 1); P.line(6, 14, 9, 14, G, 1, 1); }   // the arrow down, a bar across
  else { let x = 6, y = 12; for (let j = 0; j < 4; j++) { P.line(x, y, x + 1.5, y, G, 1, 1); P.line(x + 1.5, y, x + 1.5, y + 3, G, 1, 1); x += 1; y += 3; } P.line(5.5, 12, 5.5, 24, G, 1, 1); }   // the stair
  stain(P, RP.musgo, 0, s, (x, y) => (y > yb - 6 ? 0.5 : y < 5 ? 0.15 : -0.5), 0.4);
  rubble(P, 0, W - 1, yb, 2, RP.granito, s + 9);
  return P.done();
}

/* =============================== CEILING =============================== */
// a stone branch along the roof, rooted into it at the left: twigs off it, crystal leaves hanging in clusters
function canopy(k) {   // 42 x 28 or 54 x 34: a crystal canopy hanging from a stone branch: leaves of cold green-blue crystal in clusters, lit from inside
  const W = k ? 54 : 42, H = k ? 34 : 28, P = painter(W, H), s = 14561 + k, xe = W - 4, ye = k ? 12 : 9;
  for (let x = 1; x < 17; x++) for (let y = 0; y < 3.4 - Math.abs(x - 8) / 3; y++) P.put(x, y, RP.casca, 2.2 + cg(x, y, s) * 0.5 - y * 0.3);   // its root into the roof
  const br = t => [7 + (xe - 7) * t, 2 + Math.sin(t * Math.PI * 0.9) * ye * 0.6 + t * ye * 0.5];
  tube(P, br, t => 5.6 - t * 3.6, RP.casca, s, 2.2);
  for (let i = 0; i < 6; i++) { const [x, y] = br(0.1 + i * 0.15); P.put(x, y, RP.casca, 0.8); P.put(x + 1, y, RP.casca, 3.4); }   // knots
  const tips = [], lights = [];
  for (const [t, dx, dy] of k ? [[0.22, -3, 11], [0.42, 3, 13], [0.6, -2, 10], [0.78, 3, 11], [0.97, 1, 9]] : [[0.25, -2, 10], [0.5, 2, 11], [0.74, -2, 9], [0.97, 2, 8]]) {
    const [x, y] = br(t); P.line(x, y + 1, x + dx, y + dy, RP.casca, (q) => 2.4 - q * 0.6, 1); tips.push([x + dx, y + dy, x, y + 1]);
  }
  for (const [tx, ty, bx, by] of tips) {
    // leaves along the twig and a long one at its end, each hanging on its own stalk
    for (let i = 0; i < 5; i++) { const q = 0.3 + i * 0.16, x = bx + (tx - bx) * q, y = by + (ty - by) * q, sd = i % 2 ? 1 : -1, a = Math.PI + sd * (0.35 + hash2(i, 1, s + tx) * 0.5); leaf(P, x + sd, y, 4.5 + hash2(i, 2, s + tx) * 3, a, RP.cristal, s + i, 3 + hash2(i, 3, s) * 0.8); }
    leaf(P, tx, ty, 7, Math.PI - 0.08, RP.cristal, s + tx, 3.6);
    lights.push([Math.round(tx), Math.round(ty + 3)]);
  }
  GL['copa' + k] = glintsOf(P, k ? 7 : 5);
  const cv = P.done(); return [cv, lights];
}
function rootCurtain(k) {   // 30 x 30 or 40 x 38: a curtain of fine stone roots hanging from a mat in the roof, some forked, the tips paler
  const W = k ? 40 : 30, H = k ? 38 : 30, P = painter(W, H), s = 14581 + k;
  for (let x = 1; x < W - 1; x++) { const h = 2 + Math.round(hash2(x, 0, s) * 2 - Math.pow(Math.abs(x - W / 2) / (W / 2), 3) * 2); for (let y = 0; y < h; y++) P.put(x, y, RP.raiz, 2.6 - y * 0.4 + cg(x, y, s) * 0.6); }
  for (let x = 2; x < W - 2; x += 2) {
    if (hash2(x, 1, s) < 0.2) continue;
    const L = (H - 2) * (0.35 + hash2(x, 2, s) * 0.65) * (1 - Math.pow(Math.abs(x - W / 2) / (W / 2), 2) * 0.5), ph0 = hash2(x, 3, s) * 6, fork = hash2(x, 4, s) < 0.35;
    for (let y = 2; y < L; y++) {
      const t = y / L, xx = x + Math.sin(y * 0.28 + ph0) * 0.9, thick = t < 0.35 && hash2(x, 5, s) < 0.5;
      P.put(xx, y, RP.raiz, 2.4 + t * 1.6 + cg(xx, y, s) * 0.4); if (thick) P.put(xx + 1, y, RP.raiz, 1.6);
      if (fork && t > 0.6) P.put(xx + (t - 0.6) * 8, y, RP.raiz, 2.8 + t);
      if (hash2(x, y, s + 6) < 0.06) P.put(xx + (hash2(x, y, s + 7) < 0.5 ? -1 : 1), y + 1, RP.raiz, 2.4);   // a root hair
    }
  }
  return P.done();
}
function stoneNest() {   // 28 x 28: a stone branch down from the roof that forks, a nest of stone twigs in the fork, the bird turned to stone on it, one egg
  const W = 28, H = 28, P = painter(W, H), s = 14601;
  for (let x = 0; x < 14; x++) for (let y = 0; y < 3 - Math.abs(x - 6) / 3; y++) P.put(x, y, RP.casca, 2.2 + cg(x, y, s) * 0.5);   // rooted in the roof
  tube(P, t => [6 + t * 8 + Math.sin(t * 3) * 1, t * 24], t => 5.4 - t * 2.6, RP.casca, s, 2.4);   // the limb, down
  tube(P, t => [10 + t * 16, 15 + t * 6 - Math.sin(t * Math.PI) * 3], t => 3.6 - t * 1.8, RP.casca, s + 1, 2.6);   // the fork, out
  for (const [t, a] of [[0.5, 1], [0.85, -1]]) { const x = 10 + t * 16, y = 15 + t * 6 - Math.sin(t * Math.PI) * 3; P.line(x, y + 1, x + a * 2, y + 5, RP.casca, 2, 1); }   // twigs off it
  // the nest: a cup of crossed twigs sat in the fork
  for (let y = 10; y < 17; y++) { const t = (y - 10) / 6, hw = 7.4 - t * 3.6; for (let x = Math.floor(18 - hw); x <= 18 + hw; x++) { const tw = ((x * 2 + y * 3 + ((x + y) % 4 === 0 ? 1 : 0)) % 5); P.put(x, y, tw === 0 || tw === 3 ? RP.sombra : RP.raiz, (tw === 0 || tw === 3 ? 3 : 3 - (x - 18) / hw * 0.9 + (tw === 1 ? 0.8 : 0)) + (y === 10 ? 1 : 0) - t * 0.6 + cg(x, y, s) * 0.4); } }
  for (const [x, y, dx] of [[11, 11, -2], [25, 11, 2], [13, 15, -2], [24, 14, 1]]) P.line(x, y, x + dx, y - 1, RP.raiz, 2.6, 1);   // twigs sticking out
  // the bird: sat low in it, head turned out, tail up
  P.blob(19, 7.6, 5, 3.4, RP.granito, s + 2, 2.8, 10);
  P.blob(14.4, 5.6, 2.4, 2.3, RP.granito, s + 3, 3.1);
  P.put(11.5, 5.6, RP.cerne, 3.2); P.put(12, 6.4, RP.granito, 1.6); P.put(14, 5, RP.cristal, 1.6);
  P.line(23, 6, 27, 3, RP.granito, 2.6, 2);
  for (let x = 17; x < 23; x += 2) P.put(x, 7, RP.granito, 1.6);   // the wing line
  P.blob(25, 9.4, 1.4, 1.6, RP.cerne, s + 4, 3.4, 10);   // the egg at the nest's edge
  return P.done();
}
function pendants(k) {   // 22 x 30 or 30 x 40: a cluster of big crystal pendants from a knob of rock in the roof, the long ones tipped blue-white
  const W = k ? 30 : 22, H = k ? 40 : 30, P = painter(W, H), s = 14621 + k;
  const L = k
    ? [[4, 14, 3, -0.2], [9, 24, 3.6, -0.08], [14.5, 36, 4.6, 0.02], [20, 28, 4, 0.1], [26, 16, 3, 0.22], [11.8, 11, 2.6, -0.14], [17.4, 14, 2.6, 0.08]]
    : [[3.5, 11, 2.8, -0.22], [7.5, 19, 3.4, -0.1], [11.5, 27, 4.2, 0.02], [15.5, 20, 3.4, 0.1], [19, 12, 2.8, 0.22]];
  for (const [x, h, w, a] of L) { prism(P, x, 2, h, w, Math.PI + a, RP.cristal, s + x, 2.8); if (h > 18) prism(P, x + Math.sin(a) * (h - 6) * -1, 2 + (h - 6), 6, w * 0.55, Math.PI + a, RP.drusa, s + x + 1, 3.6); }
  for (let x = 1; x < W - 1; x++) { const h = 2 + Math.round(Math.sin(x / W * Math.PI) * 3 + hash2(x, 0, s)); for (let y = 0; y < h; y++) P.put(x, y, RP.granito, 3.4 - y * 0.5 + (y === h - 1 ? -1 : 0) - (x / W) * 1.2 + cg(x, y, s) * 0.6); }   // the knob of rock
  GL['pingentes' + k] = glintsOf(P, k ? 6 : 4);
  const tips = L.filter(e => e[1] > 15).map(([x, h]) => [Math.round(x), Math.round(2 + h * 0.6)]);
  const cv = P.done(); return [cv, tips];
}
function giantRoot() {   // 34 x 58: a giant root coming down out of the roof, flared where it goes in, twisting as it tapers, rootlets off it, the tip forked, a bead of sap at the end
  const W = 34, H = 58, P = painter(W, H), s = 14641;
  const path = t => [17 + Math.sin(t * 2.6 + 0.4) * 6 - t * 3, t * (H - 6)];
  for (const [t0, dx, len] of [[0.3, 1, 11], [0.48, -1, 9], [0.66, 1, 8], [0.8, -1, 6]]) { const [x, y] = path(t0); tube(P, t => [x + dx * t * len, y + t * len * 1.1 + Math.sin(t * 3) * 1.5], t => 3 - t * 2.2, RP.raiz, s + len, 2.2); }   // rootlets, behind
  tube(P, path, t => 15 * Math.pow(1 - t, 0.9) + 1.6, RP.raiz, s, 2.8);
  for (let x = 1; x < W - 1; x++) { const h = Math.round(5 - Math.abs(x - W / 2) / (W / 2) * 4 + hash2(x, 0, s)); for (let y = 0; y < h; y++) P.put(x, y, RP.raiz, 2.6 - y * 0.2 - (x - W / 2) / W * 1.4 + cg(x, y, s) * 0.5); }   // the flare into the roof
  fibres(P, RP.raiz, s, 0.5, 5);
  const [tx, ty] = path(1); P.line(tx, ty, tx - 2, ty + 4, RP.raiz, 2.8, 1); P.line(tx, ty, tx + 2, ty + 3, RP.raiz, 2.2, 1);
  P.put(tx - 2, ty + 5, RP.seiva, 4.6); P.put(tx - 2, ty + 6, RP.seiva, 3.2);
  return P.done();
}

/* =============================== BACK WALL =============================== */
function reliefTrunk(k) {   // 46 x 72 or 54 x 84: a wide trunk half sunk in the rock of the wall, buttress roots on the floor, the top going into the stone (k 1: a knot hole with crystal in it, a broken branch)
  const W = k ? 54 : 46, H = k ? 84 : 72, P = painter(W, H), s = 14661 + k, yb = H - 1, cx = W / 2, hw = k ? 14 : 12, fade = 18;
  bark(P, 0, yb, y => cx + Math.sin(y * 0.04 + s) * 1.6, y => hw + Math.pow(Math.max(0, (y - yb + 14) / 14), 2) * 6, RP.casca, s, 2.4);
  for (const sd of [-1, 1]) tube(P, t => [cx + sd * (hw - 3 + t * (W / 2 - hw + 1)), yb - 20 + Math.pow(t, 0.55) * 19.4], t => 8 - t * 5, RP.casca, s + sd, sd < 0 ? 2.2 : 1.6);   // buttress roots, curving down into the floor
  for (let y = yb - 20; y <= yb; y++) for (let x = 0; x < W; x++) if (P.is(x, y, RP.casca) && Math.abs(x - cx) > hw - 2) { const f = (y - Math.abs(x - cx) * 0.8) + cn(x, y, 30, 30, s) * 3, fr = ((f % 3.4) + 3.4) % 3.4; if (fr < 0.9) P.put(x, y, RP.casca, P.v(x, y) - 1); }   // their furrows
  if (k) {
    tube(P, t => [cx - hw + 1 - t * 12, 30 - t * 10], t => 7 - t * 2, RP.casca, s + 4, 2.4);
    for (let y = 18; y < 24; y++) for (let x = 0; x < 7; x++) if (P.is(x, y, RP.casca) && hash2(x, y, s) < 0.7) P.put(x, y, RP.cerne, 3.4 - (y - 18) * 0.2);   // the break
    for (let y = 40; y < 52; y++) for (let x = Math.floor(cx - 1); x < cx + 9; x++) { const d = Math.hypot((x + 0.5 - cx - 4) / 4.4, (y + 0.5 - 46) / 6); if (d < 0.8) P.put(x, y, RP.sombra, 1.6 + (y - 40) * 0.08); else if (d < 1.1) P.put(x, y, RP.cerne, 3.6 - (y - 40) * 0.12 - (x - cx) * 0.1); }   // the knot hole
    for (const [x, h, a] of [[cx + 3, 4, -0.3], [cx + 4.5, 6, 0.05], [cx + 6, 3, 0.5]]) prism(P, x, 50, h, 2, a, RP.cristal, s + x, 2.2);
  }
  // the top goes into the wall: thinner, darker, broken up
  for (let y = 0; y < fade; y++) for (let x = 0; x < W; x++) { if (!P.has(x, y)) continue; const q = y / fade; if (hash2(x, y, s + 8) > q * 1.2 + 0.05) P.clear(x, y); else P.put(x, y, RP.casca, P.v(x, y) - (1 - q) * 1.2); }
  stain(P, RP.musgo, 0.02, s, (x, y) => (y > yb - 10 ? 0.4 : -0.3), 0.2);
  rubble(P, 2, W - 3, yb, 1, RP.granito, s + 9);
  return P.done(true, fade);
}
function rootDoor() {   // 38 x 46: two great roots grown into a pointed arch on the wall, twisted together at the top, a doorway between them that goes nowhere: black, and stone a hand's depth in
  const W = 38, H = 46, P = painter(W, H), s = 14681, yb = H - 1, cx = 19;
  const inside = (x, y) => { const t = (yb - y) / (yb - 7); if (t < 0 || t > 1) return false; const hw = 11.5 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t - 0.35) / 0.65, 1.6))); return Math.abs(x + 0.5 - cx) < hw; };
  for (let y = 6; y <= yb; y++) for (let x = 6; x < 33; x++) if (inside(x, y)) {
    const back = cn(x, y, 30, 30, s) + 0.5, crack = Math.abs(cn(x, y, 24, 24, s + 1)) < 0.03;
    P.put(x, y, crack ? RP.sombra : RP.granito, crack ? 1 : 0.2 + back * 0.9 + (yb - y) / 70 + cg(x, y, s) * 0.3);   // bare rock closing it, barely seen
  }
  for (const sd of [-1, 1]) tube(P, t => { const a = t * Math.PI / 2; return [cx + sd * (13.5 * Math.cos(a) * 1) , yb - Math.sin(a) * (yb - 6) - (t > 0.9 ? (t - 0.9) * 20 : 0)]; }, t => 8 - t * 3, RP.raiz, s + sd, sd < 0 ? 2.9 : 2.4);
  P.blob(cx, 6, 5, 4, RP.raiz, s + 3, 2.8);   // the knot where they twist
  tube(P, t => [cx - 1 + t * 3, 4 - t * 4], t => 4 - t * 2, RP.raiz, s + 4, 2.4);
  fibres(P, RP.raiz, s, 1.4);
  tube(P, t => [4 + t * 30, yb - 0.6 + Math.sin(t * Math.PI) * -0.8], () => 3, RP.raiz, s + 5, 2.6);   // the root threshold
  for (let x = 12; x < 27; x += 3) { const L = 2 + Math.round(hash2(x, 0, s) * 5); for (let j = 0; j < L; j++) P.put(x, 9 + j + Math.round(Math.abs(x - cx) * 0.4), RP.raiz, 2.4 - j * 0.15); }   // rootlets inside the top
  return P.done();
}
function fossilAntler() {   // 62 x 48: a huge antler, fossil, held in the wall by patches of granite: the beam sweeping up from its burr on the floor, tines up off it, cracked across
  const W = 62, H = 48, P = painter(W, H), s = 14701, yb = H - 1;
  const bz = (t, a, b, c) => (1 - t) * (1 - t) * a + 2 * t * (1 - t) * b + t * t * c, beam = t => [bz(t, 9, 12, 50), bz(t, 42, 6, 10)];
  for (const [t, a, L] of [[0.07, -1.15, 13], [0.36, -0.35, 15], [0.56, -0.1, 14], [0.74, 0.1, 12]]) {
    const [x, y] = beam(t); tube(P, q => [x + Math.sin(a) * L * q - q * q * 3, y - Math.cos(a) * L * q], q => (4.8 - t * 1.6) * (1 - q * 0.82), RP.cerne, s + L, 2.9);
  }
  tube(P, beam, t => 7.6 - t * 5.4, RP.cerne, s, 2.7);
  { const [x, y] = beam(1); tube(P, q => [x + q * 6, y - q * 8 - q * q * 2], q => 2.4 - q * 1.6, RP.cerne, s + 7, 2.9); }   // the beam's end turns up into the last point
  P.blob(9, yb - 4, 5.8, 4.4, RP.cerne, s + 1, 2.4, yb);   // the burr
  for (let k = 0; k < 12; k++) { const a = Math.PI + k / 12 * Math.PI; P.put(9 + Math.cos(a) * 5.4, yb - 4 + Math.sin(a) * 4.2, RP.cerne, 3.6 + (k % 2) * 0.6); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (P.is(x, y, RP.cerne) && hash2(x >> 1, y >> 1, s) < 0.12) P.put(x, y, RP.cerne, P.v(x, y) - 0.6);   // the pitted surface
  for (let k = 0; k < 6; k++) { const [x, y] = beam(0.12 + k * 0.15); for (let j = -5; j <= 5; j++) if (P.is(x + j * 0.4, y + j, RP.cerne)) P.put(x + j * 0.4, y + j, RP.cerne, 1.2); }   // cracks across
  // the granite still holding it: patches over the beam and round the burr
  const patch = (cx, cy, rx, ry, sd) => { for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) { const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) + cn(x, y, 60, 60, sd) * 1.1 + (hash2(x, y, sd) - 0.5) * 0.25; if (d < 1 && y <= yb && P.has(x, y)) P.put(x, y, RP.granito, 2.2 - (x - cx) / rx * 0.6 - (y - cy) / ry * 0.5 + cg(x, y, sd) * 0.6); } };   // only over the antler: the rock it is still set in
  { const [x, y] = beam(0.2); patch(x, y, 5, 6, s + 3); } { const [x, y] = beam(0.6); patch(x, y + 1, 6, 4, s + 4); }
  patch(6, yb - 2, 7, 4, s + 2);
  mossTop(P, 0.3, s);
  rubble(P, 0, 20, yb, 2, RP.granito, s + 9);
  return P.done();
}
function clawBark(k) {   // 24 x 32 or 30 x 38: a slab of stone bark on the wall scored by something with claws: four gouges, the pale heartwood in them (k 1: older marks across, newer over them)
  const W = k ? 30 : 24, H = k ? 38 : 32, P = painter(W, H), s = 14721 + k;
  for (let y = 0; y < H; y++) {
    const e0 = 1 + cn(0, y, 1, 30, s) * 4 + (y < 4 ? (4 - y) * 0.6 : 0), e1 = W - 2 + cn(9, y, 1, 30, s + 1) * 4 - (y > H - 5 ? (y - H + 5) * 0.6 : 0);
    for (let x = 0; x < W; x++) {
      if (x < e0 || x > e1) continue;
      if ((y < 3 && hash2(x >> 1, 0, s) < (3 - y) * 0.35) || (y > H - 4 && hash2(x >> 1, 1, s) < (y - H + 4) * 0.35)) continue;   // the broken ends
      const f = x + Math.sin(y * 0.2 + s) * 0.9 + cn(x, y, 40, 8, s) * 2.4, fr = ((f % 3.4) + 3.4) % 3.4;
      P.put(x, y, RP.casca, 2.5 - (x - e0) / (e1 - e0) * 1.1 + (fr < 0.9 ? -0.6 : fr < 1.7 ? 0.3 : 0) + cg(x, y, s) * 0.4);
    }
  }
  // a gouge: tapered at both ends, the shadow on its upper left, the heartwood lit on its lower right
  const gouge = (x0, y0, x1, y1, deep) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * 1.2, y = y0 + (y1 - y0) * t, w = Math.sin(t * Math.PI); if (!P.has(x, y)) continue; P.put(x, y, deep ? RP.sombra : RP.casca, deep ? 2.4 : 1); if (w > 0.35 && deep) P.put(x + 1, y, RP.cerne, 3.8 - t); else if (w > 0.35) P.put(x + 1, y, RP.cerne, 2.4); } };
  if (k) for (let j = 0; j < 3; j++) gouge(3 + j, 24 + j * 3, 20 + j * 2, 18 + j * 3, false);   // older, across
  for (let j = 0; j < 4; j++) gouge((k ? 3 : 1) + j * 4, 4 + Math.abs(j - 1.5) * 1.6, (k ? 14 : 11) + j * 3.4, H - 5 - Math.abs(j - 1.5) * 2, true);
  return P.done();
}
function sapSeam() {   // 32 x 26: a crack in the rock of the wall running with glassy sap, lime and shining, drops hanging off its lowest points
  const W = 32, H = 26, P = painter(W, H), s = 14741;
  const crack = (x0, y0, x1, y1, w, sd) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t + cn(i, 0, 60, 60, sd) * 4, y = y0 + (y1 - y0) * t, ww = w * Math.min(1, Math.sin(t * Math.PI) * 2.5); if (ww > 1.2) { P.put(x - 1, y, RP.sombra, 2); P.put(x + 2, y, RP.sombra, 1); P.put(x + 1, y, RP.seiva, 3); } else { P.put(x - 1, y, RP.sombra, 2.4); P.put(x + 1, y, RP.sombra, 1.4); } P.put(x, y, RP.seiva, 4.2 + cg(x, y, sd) * 0.6); } };
  crack(5, 2, 25, 21, 2, s); crack(6, 2, 26, 21, 2, s); crack(13, 9, 6, 18, 1, s + 1); crack(19, 14, 28, 8, 1, s + 2); crack(9, 4, 4, 9, 1, s + 3);
  for (const [x, y, L] of [[24, 21, 3], [6, 18, 2], [26, 9, 2]]) for (let j = 1; j <= L; j++) P.put(x, y + j, RP.seiva, j === L ? 5 : 3.2);   // drops
  return P.done(false);   // part of the wall: no rim
}
/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, floresta: true }, extra || {}));
const CRYSTAL = '#5ad8c8', DRUSA = '#b8dcff', SAP = '#c4d860', EMBER = '#d86a2a';
const ALL = ['bosque', 'mata', 'raizes', 'clareira'];
// floor
def('fp_toco', 'Toco oco grande', F, 'frente', ALL, [hollowStump(0), hollowStump(1)]);
def('fp_tronco_caido', 'Tronco caído', F, 'frente', ['bosque', 'mata'], [fallenLog(0), fallenLog(1)]);
def('fp_raiz_arco', 'Raiz arqueada', F, 'frente', ['bosque', 'raizes'], [rootArch(0), rootArch(1)]);
def('fp_samambaias', 'Pedra com samambaias', F, 'frente', ['bosque', 'mata'], [fernRock()]);
def('fp_cervo', 'Cervo petrificado', F, 'frente', ['mata', 'clareira'], [deer()]);
def('fp_javali', 'Javali petrificado', F, 'frente', ['bosque'], [boar()]);
def('fp_lobo', 'Lobo petrificado', F, 'frente', ['mata'], [wolf()]);
def('fp_coruja', 'Coruja petrificada', F, 'frente', ['mata'], [owl()]);
def('fp_geodo', 'Geodo partido', F, 'frente', ['mata', 'raizes'], [geode()], { luz: [{ x: 16, y: 13, r: 0.7 }], brilho: CRYSTAL, fpGlint: [GL.geodo] });
def('fp_cristais', 'Cristais altos', F, 'frente', ['mata', 'clareira'], [tallCrystals(0), tallCrystals(1)], { luz: [], luzV: [[{ x: 13, y: 12, r: 0.75 }], [{ x: 21, y: 16, r: 0.85 }, { x: 9, y: 30, r: 0.4 }, { x: 28, y: 30, r: 0.4 }]], brilho: DRUSA, faixaV: { mata: [0], clareira: [0, 1] }, fpGlint: [GL.cristais0, GL.cristais1] });
def('fp_seiva_inseto', 'Bolha de seiva', F, 'frente', ['raizes'], [sapBubble()], { luz: [{ x: 10, y: 11, r: 0.32 }], brilho: SAP });
def('fp_orelhas', 'Orelhas-de-pau de pedra', F, 'frente', ['bosque', 'raizes'], [bracketFoot(0), bracketFoot(1)], { encosta: [-1, 1] });
def('fp_pinhas', 'Pinhas e folhas de cristal', F, 'frente', ['mata'], [coneHeap()]);
def('fp_circulo', 'Círculo de pedras', F, 'frente', ['clareira'], [stoneCircle()]);
{ const cv = deadFire(); def('fp_fogueira', 'Fogueira apagada', F, 'frente', ['clareira'], [cv], { acampamento: true, luz: [{ x: 16, y: 16, r: 0.3 }], brilho: EMBER, anim: { k: 'fp_brasa', x: 16, y: 16, pts: EMB.slice() } }); }
def('fp_cesto', 'Cesto de cristais', F, 'frente', ['clareira'], [crystalBasket()], { acampamento: true, luz: [{ x: 10, y: 6, r: 0.3 }], brilho: CRYSTAL, fpGlint: [GL.cesto] });
def('fp_picareta', 'Picareta de bronze', F, 'frente', ['clareira'], [bronzePick()]);
def('fp_marco', 'Marco anão', F, 'frente', ['clareira'], [runeStone(0), runeStone(1)], { escadaria: true });
// ceiling
{ const [c0, l0] = canopy(0), [c1, l1] = canopy(1); def('fp_copa', 'Copa de cristal', C, 'frente', ['mata'], [c0, c1], { luz: [], luzV: [l0.map(([x, y]) => ({ x, y, r: 0.42 })), l1.map(([x, y]) => ({ x, y, r: 0.42 }))], brilho: CRYSTAL, fpGlint: [GL.copa0, GL.copa1] }); }
def('fp_cortina_raiz', 'Cortina de raízes', C, 'frente', ['bosque', 'raizes'], [rootCurtain(0), rootCurtain(1)]);
def('fp_ninho', 'Ninho de pedra', C, 'frente', ['mata'], [stoneNest()]);
{ const [c0, t0] = pendants(0), [c1, t1] = pendants(1); def('fp_pingentes', 'Pingentes de cristal', C, 'frente', ['mata', 'clareira'], [c0, c1], { luz: [], luzV: [t0.map(([x, y]) => ({ x, y, r: 0.4 })), t1.map(([x, y]) => ({ x, y, r: 0.45 }))], brilho: CRYSTAL, fpGlint: [GL.pingentes0, GL.pingentes1] }); }
def('fp_raiz_teto', 'Raiz gigante', C, 'frente', ['raizes'], [giantRoot()]);
// back wall, standing on the floor
def('fp_tronco_relevo', 'Tronco na parede', W, 'fundo', ALL, [reliefTrunk(0), reliefTrunk(1)]);
def('fp_porta_raiz', 'Porta de raiz', W, 'fundo', ['raizes'], [rootDoor()]);
def('fp_galhada', 'Galhada fóssil', W, 'fundo', ['clareira'], [fossilAntler()]);
// back wall, eye height
def('fp_garras', 'Casca arranhada', W, 'fundo', ['bosque', 'clareira'], [clawBark(0), clawBark(1)]);
def('fp_veio_seiva', 'Veio de seiva', W, 'fundo', ['raizes'], [sapSeam()], { luz: [{ x: 16, y: 13, r: 0.4 }], brilho: SAP });

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
// (the camp's fire and basket and the rune stones are listed where they belong; fpPropFlagOk keeps them in their place)
Object.assign(FP_PROP_PLAN, {
  bosque: { chao: [['fp_toco', 0.1, 1], ['fp_tronco_caido', 0.12, 1], ['fp_raiz_arco', 0.1, 1], ['fp_samambaias', 0.14, 1], ['fp_javali', 0.05, 1], ['fp_orelhas', 0.12, 1]], teto: [['fp_cortina_raiz', 0.18, 2]], fundo: [['fp_tronco_relevo', 0.08, 1], ['fp_garras', 0.07, 1]] },
  mata: { chao: [['fp_cristais', 0.14, 2], ['fp_samambaias', 0.1, 1], ['fp_tronco_caido', 0.08, 1], ['fp_toco', 0.06, 1], ['fp_geodo', 0.06, 1], ['fp_pinhas', 0.14, 1], ['fp_cervo', 0.05, 1], ['fp_lobo', 0.04, 1], ['fp_coruja', 0.05, 1]], teto: [['fp_copa', 0.2, 2], ['fp_pingentes', 0.14, 2], ['fp_ninho', 0.06, 1]], fundo: [['fp_tronco_relevo', 0.08, 1]] },
  raizes: { chao: [['fp_raiz_arco', 0.14, 2], ['fp_geodo', 0.07, 1], ['fp_seiva_inseto', 0.1, 1], ['fp_orelhas', 0.1, 1], ['fp_toco', 0.05, 1]], teto: [['fp_cortina_raiz', 0.2, 2], ['fp_raiz_teto', 0.1, 1]], fundo: [['fp_veio_seiva', 0.12, 2], ['fp_porta_raiz', 0.06, 1], ['fp_tronco_relevo', 0.06, 1]] },
  clareira: { chao: [['fp_fogueira', 1, 1], ['fp_cesto', 1, 2], ['fp_marco', 1, 1], ['fp_cristais', 0.12, 2], ['fp_circulo', 0.05, 1], ['fp_picareta', 0.05, 1], ['fp_cervo', 0.05, 1], ['fp_toco', 0.05, 1]], teto: [['fp_pingentes', 0.15, 2]], fundo: [['fp_tronco_relevo', 0.08, 1], ['fp_galhada', 0.04, 1], ['fp_garras', 0.06, 1]] }
});
}

/* ---------- glints on the crystal, and the dwarves' ember that breathes ---------- */
// a glint: now and then one bright pixel on a crystal face flares into a little cross and fades
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], G = p.def.fpGlint; if (!G) continue;
    const L = G[p.v] || G[0]; if (!L) continue;
    for (let j = 0; j < L.length; j++) {
      const ph = (gameTime * 0.35 + j * 0.37 + ((p.X * 13 + p.Y * 7) % 97) / 97) % 1; if (ph > 0.07) continue;
      const a = 1 - Math.abs(ph - 0.035) / 0.035, X = Math.round(p.X + p.sh + L[j][0] - cx), Y = Math.round(p.Y + L[j][1] - cy);
      lc.globalAlpha = 0.9 * a; lc.fillStyle = '#e4fbf4'; lc.fillRect(X, Y, 1, 1);
      if (a > 0.5) { lc.globalAlpha = 0.55 * a; lc.fillRect(X - 1, Y, 3, 1); lc.fillRect(X, Y - 1, 1, 3); }
    }
  }
  lc.globalAlpha = 1;
});
let fpEmberGlow = null;
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'fp_brasa') continue;
    if (!fpEmberGlow) fpEmberGlow = glow(18, '#c8501a');
    lc.globalAlpha = 0.16 + Math.sin(gameTime * 1.3 + p.X) * 0.05; lc.drawImage(fpEmberGlow, Math.round(p.X + p.sh + A.x - cx - 18), Math.round(p.Y + A.y - cy - 18));
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'fp_brasa') continue;
    for (let j = 0; j < A.pts.length; j++) {
      const b = Math.sin(gameTime * (0.9 + j * 0.23) + j * 2.1 + p.X * 0.1); if (b < 0.2) continue;
      lc.globalAlpha = (b - 0.2) * 0.9; lc.fillStyle = b > 0.8 ? '#ff9a3a' : '#c8501a';
      lc.fillRect(Math.round(p.X + p.sh + A.pts[j][0] - cx), Math.round(p.Y + A.pts[j][1] - cy), 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
