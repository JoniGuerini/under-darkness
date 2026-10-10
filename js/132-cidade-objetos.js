'use strict';

/* ================= the sunken city: props =================
   Everything bigger than a block that dresses A Cidade Afundada (docs/camadas/06-cidade-afundada.md, section 5).
   In the Cisternas Altas: a flat-bottomed punt left at the edge of the black water, rotten barrels, a bucket on its
   chain, the cistern arches. In the Ruas Tortas: a tipped cart, the looters' barricade of furniture and their fire,
   a fallen market stall, a street well with its windlass, a bird cage, a line of rotten washing; on the walls house
   fronts with door and window, a boarded shop door, a house window with its glass broken. In the Bairro do Poço:
   the temple's pews, the altar of the Poço with its candles, a faceless statue, heaps of offerings, a big string of
   bells, the temple gate, the Poço's sign painted on the walls. In the Palácio do Sino: a dry fountain, the palace
   carriage sunk to its axles, an overturned banquet table, a chandelier hanging by one chain, a broken marble stair,
   a cracked stained-glass window, the king's portrait with the face scraped off, the statue in marble.
   Same painter as 122 (6-tone ramps of the card's section 12, lit from the top left, dark rim only where the sprite
   touches air). The game is seen from the side: nothing is drawn as a disc lying on the floor; every prop stands
   on its floor row, hangs from its top row or is a flat piece of the back wall.
   Only what people lit gives light: the looters' fire (`anim: { k: 'cd_fogo' }`, its tongues drawn by the hooks at
   the end), the candles of the altar, of the offerings and at the temple gate (`chamas`, the shared flames).
   Registered with defProp (`cidade: true`), placed by 136 from CD_PROP_PLAN (same walk as 125's fungPlaceProps).
   Flags the generator must honour:
     beira: true      stands only on a floor right at the water's edge (the punt), may touch the water;
     rua: true        only on street floors (CD_CALCAMENTO), never inside a house (the street well);
     templo: true     only inside the temple of the Poço (the pews, the altar); elsewhere in the band, never;
     janela: true     a back-wall window: hung with its sill about 1 block above eye height, in rooms with a wall
                      (houses, palace halls), never in caves or cisterns;
     faixaV: {...}    which variations each band uses (the statue: hooded stone in the Bairro, marble in the Palácio).
   The sunk carriage is painted half buried in its own mound of fill, so it needs no special placement. */
const CD_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const CD_BACK_FLOOR = { cd_arco: 1, cd_fachada: 1, cd_porta_loja: 1, cd_portao: 1, cd_escadaria: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  // the card's ramps (section 12)
  aterro: R6(['#16130f', '#241f19', '#352d24', '#483d31', '#5e5041', '#776654']),
  cantaria: R6(['#2a2622', '#403a33', '#5a5248', '#786e60', '#9a8e7c', '#c0b49e']),
  tijolo: R6(['#24120e', '#3c1e16', '#58302a', '#74443a', '#925a4c', '#b07a68']),
  limo: R6(['#0c1410', '#14201a', '#1e2e24', '#2a3e30', '#3a5240', '#546c56']),
  telha: R6(['#14161c', '#20242c', '#2e343e', '#3e4652', '#525c6a', '#6e7a88']),
  marmore: R6(['#2a2a2e', '#46464a', '#66646a', '#8c8a8c', '#b4b0ae', '#dcd6d0']),
  poco: R6(['#050608', '#0a0c10', '#101318', '#171b22', '#20252e', '#2c323c']),
  prata: R6(['#2a2e34', '#4a5058', '#727a84', '#a0a8b2', '#ccd2da', '#e8ecf0']),
  agua: R6(['#040506', '#08090c', '#0c0e12', '#121418', '#181c20', '#22262c']),
  cera: R6(['#3a2e22', '#6a5a44', '#8a7a5c', '#a89470', '#c4b28a', '#d8c8a0']),
  // the props' own
  chama: R6(['#5a1e06', '#a0400c', '#e06a18', '#ffb84a', '#ffd880', '#fff0b0']),
  brasa: R6(['#1a0a06', '#3a1408', '#6a240a', '#a03a0e', '#d8601a', '#ff9a3a']),
  madeira: R6(['#100c09', '#1e1711', '#2e2319', '#3e3022', '#52402d', '#68523a']),
  ferro: R6(['#0c0e10', '#181c20', '#262c32', '#384046', '#4e585e', '#6a767a']),
  ferrugem: R6(['#1a0e08', '#2e180c', '#4a2612', '#66361a', '#824a24', '#9a6032']),
  ouro: R6(['#1e1608', '#3a2a0e', '#5a4216', '#7c5e22', '#9c7a32', '#bc9a4c']),
  corda: R6(['#1c160e', '#32281a', '#4a3e28', '#625438', '#7c6c4a', '#94845e']),
  couro: R6(['#150e0a', '#271a12', '#3a281c', '#4e3726', '#644832', '#7a5a40']),
  linho: R6(['#1e1c16', '#322e24', '#4a4536', '#635c48', '#7c745c', '#968c70']),
  rubro: R6(['#1a0c0c', '#2e1414', '#481e1c', '#622a26', '#7c3832', '#924840']),
  azul: R6(['#0e1218', '#182029', '#232e3b', '#2f3d4d', '#3e4f61', '#526376']),
  lodo: R6(['#0a0d0b', '#121713', '#1b221d', '#253028', '#304034', '#3e5242']),
  osso: R6(['#2a261e', '#463f34', '#665d4e', '#8a7f6a', '#aca088', '#c8bca2']),
  podre: R6(['#14120c', '#221f14', '#33301e', '#46422a', '#5a5636', '#706a44']),
  vRubro: R6(['#1e0608', '#3a0c10', '#5c1418', '#7e2024', '#a03030', '#c04a44']),
  vAzul: R6(['#060c1c', '#0c1632', '#14224a', '#1e3262', '#2c467c', '#406096']),
  vAmbar: R6(['#2a1806', '#4a2c0a', '#6e4410', '#94601a', '#b67e2a', '#d4a044']),
  sombra: R6(['#030304', '#060607', '#09090b', '#0d0d10', '#121216', '#18181c'])
};
const OUTLINE = ph('#060607');

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
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 60, 60, s + 1) * 0.45); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
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
// paste painter Q into P at (ox, oy), turned by ang around Q's (px, py) (nearest pixel, shades kept)
function blit(P, Q, ox, oy, ang = 0, px = 0, py = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.ceil(Math.hypot(Q.w, Q.h));
  for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) {
    const dx = x + 0.5, dy = y + 0.5, u = Math.floor(dx * ca + dy * sa + px), v = Math.floor(-dx * sa + dy * ca + py);
    if (u < 0 || v < 0 || u >= Q.w || v >= Q.h) continue; const k = v * Q.w + u; if (!Q.c[k]) continue;
    P.put(ox + px + x, oy + py + y, Q.ramps[Q.rid[k]], Q.val[k]);
  }
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
// a plank: grain along its length, lit top and left edge, a nail at each end
function plank(P, x0, y0, len, thick, R, s, vert = false, base = 2.6) {
  for (let a = 0; a < len; a++) for (let b = 0; b < thick; b++) {
    const x = vert ? x0 + b : x0 + a, y = vert ? y0 + a : y0 + b;
    let v = base + (b === 0 ? 0.9 : b === thick - 1 ? -0.9 : 0) + Math.sin(a * 0.45 + b * 1.9 + s) * 0.3 + cg(x, y, s) * 0.45;
    if (a === 0 || a === len - 1) v -= 0.5;
    P.put(x, y, R, v);
  }
  if (len > 5 && thick > 1) { const n = vert ? [[x0 + (thick >> 1), y0 + 1], [x0 + (thick >> 1), y0 + len - 2]] : [[x0 + 1, y0 + (thick >> 1)], [x0 + len - 2, y0 + (thick >> 1)]]; for (const [x, y] of n) P.put(x, y, RP.ferrugem, 3.6); }
}
// dressed stone in courses: blocks lit on their top and left edge, dark joints; keep(x, y) false leaves a hole
function ashlar(P, x0, y0, w, h, R, s, ch = 4, cw = 9, keep = null, base = 2.5) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    const row = Math.floor(y / ch), off = (row % 2) * Math.floor(cw / 2), col = Math.floor((x + off) / cw), ly = y % ch, lx = (x + off) % cw;
    const joint = ly === ch - 1 || lx === cw - 1;
    const v = joint ? base - 1.2 : base + hash2(col, row, s) * 0.9 - 0.3 + (ly === 0 ? 0.8 : 0) + (lx === 0 ? 0.4 : 0) - x / w * 0.7 + cg(X, Y, s) * 0.55;
    P.put(X, Y, R, v);
  }
}
// small bricks (3 high, 6 long) with patches of plaster left on them
function bricks(P, x0, y0, w, h, s, keep = null, plaster = 0.3) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    if (cn(X, Y, 14, 10, s + 5) + 0.5 < plaster) { P.put(X, Y, RP.cantaria, 3.2 - x / w * 0.8 + cg(X, Y, s) * 0.6 + (y === 0 ? 0.6 : 0)); continue; }
    const row = Math.floor(y / 3), off = (row % 2) * 3, col = Math.floor((x + off) / 6), ly = y % 3, lx = (x + off) % 6;
    P.put(X, Y, RP.tijolo, ly === 2 || lx === 5 ? 1 : 2.5 + hash2(col, row, s) * 1 + (ly === 0 ? 0.6 : 0) - x / w * 0.6 + cg(X, Y, s) * 0.5);
  }
}
// a stain over what is painted (limo, mud, soot): patches by noise, bias(x, y) thickens it; the shading is kept
function stain(P, R, cover, s, bias, lift = 0) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] === me) continue;
    const n = cn(x, y, 22, 22, s) + cn(x, y, 70, 70, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.8 + P.val[k] * 0.6 + cg(x, y, s + 2) * 0.6 + lift);
  }
}
// a candle: a stub of tallow with drips; pushes the pixel above its wick (for `chamas`)
const WK = [];
function candle(P, x, base, h, s) {
  WK.push({ x, y: base - h });
  for (let y = base - h + 1; y <= base; y++) { P.put(x, y, RP.cera, 4.6 - (y - base + h) * 0.12 + cg(x, y, s) * 0.4); P.put(x + 1, y, RP.cera, 3 + cg(x + 1, y, s) * 0.4); }
  P.put(x, base - h, RP.sombra, 3);
  if (hash2(x, base, s) < 0.6) P.put(x + 1, base - h + 2, RP.cera, 5);
  P.put(x - 1, base, RP.cera, 4); P.put(x + 2, base, RP.cera, 2.6);
}
// a burnt-out candle stub (no flame)
function stub(P, x, base, h, s) { for (let y = base - h + 1; y <= base; y++) { P.put(x, y, RP.cera, 3.4 + cg(x, y, s) * 0.5); P.put(x + 1, y, RP.cera, 2.2); } P.put(x, base - h, RP.sombra, 2); }
// a hanging chain of iron: links face on, then edge on
function chainV(P, x, y0, y1, R = RP.ferro, base = 3.6) {
  for (let y = y0; y < y1; y++) { const k = (y - y0) % 4; if (k < 2) { P.put(x, y, R, base + (k === 1 ? -1.4 : 0.5)); P.put(x + 1, y, R, base - 1 + (k === 1 ? -1.4 : 0)); } else P.put(x + (k === 2 ? 0 : 1), y, R, base + 0.3); }
}
// a sagging rope from (x0, y0) to (x1, y1), sag pixels at its middle; returns y at x
function rope(P, x0, y0, x1, y1, sag, R = RP.corda, s = 0) {
  const at = x => { const t = (x - x0) / (x1 - x0); return y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag; };
  for (let x = Math.round(x0); x <= x1; x++) P.put(x, at(x), R, (x % 3 === 0 ? 2 : 3.2) + cg(x, 0, s) * 0.4);
  return at;
}
// the Poço's sign: a black round mouth with rings round it (painted or carved on an upright face; never on the floor)
function pocoSign(P, cx, cy, r, ring, inner, s, ringV = 3.6, innerV = 1) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d < r * 0.45) P.put(x, y, inner, innerV + (d < r * 0.2 ? -0.6 : 0) + cg(x, y, s) * 0.3);
    else if (Math.abs(d - r * 0.72) < 0.6 || Math.abs(d - r) < 0.55) P.put(x, y, ring, ringV - (x - cx + y - cy) / r * 0.5 + cg(x, y, s) * 0.5);
  }
}
// a wooden barrel standing (side view): staves, hoops, rim lit; rot k 0..1 eats staves away
function barrel(P, x0, by, w, h, s, rot = 0, lying = false) {
  const L = lying ? w : h, D = lying ? h : w, c = D / 2;
  for (let a = 0; a < L; a++) {
    const t = a / (L - 1), hw = c * (0.74 + 0.26 * Math.sin(t * Math.PI)), hoop = [0.1, 0.9, 0.32, 0.68].some(q => Math.abs(t - q) < 0.5 / L + 0.01);
    for (let b = Math.floor(c - hw); b < c + hw; b++) {
      const u = (b + 0.5 - c) / hw, st = Math.floor((u + 1) * 2.6), edge = Math.abs(((u + 1) * 2.6) % 1) < 0.2;
      const x = lying ? x0 + a : x0 + b, y = lying ? by - h + 1 + b : by - h + 1 + a;
      if (rot && !hoop && hash2(st, 0, s) < rot * 0.6 && Math.abs(u) < 0.7 && t > 0.2 + hash2(st, 1, s) * 0.3 && t < 0.88) { P.put(x, y, RP.madeira, 0.5 + (u < 0 ? 0.5 : 0)); continue; }   // a stave rotted out: the dark inside
      if (hoop) { P.put(x, y, hash2(x, y, s) < 0.25 ? RP.ferrugem : RP.ferro, 3.4 - u * 1.4 + cg(x, y, s) * 0.3); continue; }
      P.put(x, y, RP.madeira, 3.4 - u * 1.5 + (edge ? -1 : 0) + (a === 0 && !lying ? 1.2 : 0) + cg(x, y, s + st) * 0.6);
    }
  }
}
// cloth hanging: from a top line top(x) down to len(x), folds down its length
function drape(P, x0, x1, top, len, R, s, holes = 0) {
  for (let x = x0; x <= x1; x++) { const y0 = top(x), L = len(x); for (let j = 0; j < L; j++) { const y = Math.round(y0 + j); if (holes && cn(x, y, 7, 7, s) + 0.5 < holes * (j / L)) continue; P.put(x, y, R, 3 - (x - x0) / (x1 - x0 + 1) * 0.9 + Math.sin(x * 1.25 + s) * 0.7 - j / L * 0.5 + cg(x, y, s) * 0.4); } }
}
// rubble along the floor row: chunks of R heaped from x0 to x1, up to hgt tall
function rubble(P, x0, x1, by, hgt, R, s) {
  for (let k = 0; k < (x1 - x0) * 0.8; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), t = (x - x0) / (x1 - x0), y = by - hash2(k, 1, s) * hgt * Math.sin(t * Math.PI); P.blob(x, y, 1 + hash2(k, 2, s) * 1.4, 0.8 + hash2(k, 3, s), R, s + k, 2.4); }
  for (let x = x0; x <= x1; x++) if (hash2(x, 4, s) < 0.7) P.put(x, by, R, 1.8 + hash2(x, 5, s));
}

/* =============================== FLOOR =============================== */
function flatBoat() {   // 46 x 18: a flat-bottomed punt of the cisterns at the water's edge, the pole leant on it, black water scum to the waterline
  const P = painter(46, 18), s = 13201, yb = 17;
  for (let x = 1; x < 42; x++) {
    // raked ends: the bottom is flat from 8 to 35, the sides rise to the gunwale at 7
    const lo = x < 8 ? yb - Math.round((8 - x) * 1.2) : x > 35 ? yb - Math.round((x - 35) * 1.5) : yb, top = 7 - (x < 5 ? 1 : 0) - (x > 39 ? 1 : 0);
    for (let y = top; y <= lo; y++) { const ly = (y - top) % 3; P.put(x, y, RP.madeira, (ly === 0 ? 3.4 : ly === 2 ? 1.8 : 2.8) - (x - 1) * 0.02 + cg(x, y, s) * 0.5 - (x % 11 === 0 && ly === 1 ? 0.7 : 0)); }
    P.put(x, top, RP.madeira, 4.4 + cg(x, 0, s) * 0.4); P.put(x, top - 1, RP.madeira, 3);
  }
  for (const x of [12, 22, 32]) for (let y = 6; y < yb; y++) if (P.has(x, y)) P.put(x, y, RP.madeira, 1.6);   // the ribs show through
  // the waterline: limo and scum on the lower strakes
  stain(P, RP.limo, 0.08, s, (x, y) => (y > 11 ? 0.55 : -0.6) + (y > 14 ? 0.3 : 0), 0.4);
  for (let x = 2; x < 41; x++) if (P.has(x, 11) && hash2(x, 6, s) < 0.6) P.put(x, 11, RP.limo, 3.6);
  // a bow ring, its rope trailing to the floor
  P.put(41, 9, RP.ferro, 4); P.put(42, 10, RP.ferro, 3); P.put(41, 11, RP.ferro, 2.6);
  for (let k = 0; k < 7; k++) P.put(42 + k * 0.5, 11 + k, RP.corda, 3 - (k % 2));
  for (let x = 44; x < 46; x++) P.put(x, yb, RP.corda, 3);
  // the pole leant along the boat, its foot on the floor at the left
  P.line(0, 17, 30, 1, RP.madeira, (t) => 4 - t * 0.8, 1); P.line(1, 17, 31, 1, RP.madeira, 2.2, 1);
  // a looter's bundle left in it, over the gunwale
  P.blob(26, 5, 3.6, 2.6, RP.linho, s, 2.6); P.put(26, 2, RP.corda, 3.6); P.put(27, 2, RP.corda, 2.6);
  for (let x = 6; x < 38; x++) if (hash2(x, 7, s) < 0.35) P.put(x, yb, RP.lodo, 2.4 + hash2(x, 8, s));
  return P.done();
}
function barrels(k) {   // 28 x 24 or 36 x 28: rotten barrels, staves sprung, hoops rusted (k 1: one lying across two)
  const W = k ? 36 : 28, H = k ? 28 : 24, P = painter(W, H), s = 13221 + k, yb = H - 1;
  if (!k) { barrel(P, 0, yb, 11, 15, s, 0.25); barrel(P, 11, yb, 11, 13, s + 1, 0.6); barrel(P, 17, yb - 13, 9, 10, s + 2, 0.1); barrel(P, 20, yb, 8, 9, s + 3, 0); }
  else { barrel(P, 1, yb, 11, 15, s, 0.2); barrel(P, 21, yb, 11, 15, s + 1, 0.4); barrel(P, 4, yb - 15, 28, 11, s + 2, 0.3, true); barrel(P, 12, yb, 8, 8, s + 3, 0.7); }
  // the burst one: sprung staves splayed at its foot
  P.line(11, yb, 9, yb - 3, RP.madeira, 2.6, 1); P.line(W - 3, yb, W - 1, yb - 4, RP.madeira, 2.2, 1);
  stain(P, RP.lodo, 0.05, s, (x, y) => (y > H - 6 ? 0.4 : -0.2));
  for (let x = 0; x < W; x++) if (hash2(x, 3, s) < 0.4) P.put(x, yb, RP.madeira, 1.8 + hash2(x, 4, s));
  return P.done();
}
function tippedCart() {   // 48 x 28: a city cart tipped onto its nose, one wheel still on its axle, the other broken and leant on it, a sack spilled
  const P = painter(48, 28), s = 13241, Q = painter(40, 14), yb = 27;
  // the bed: side boards of planks, ribs, a tail board
  for (let j = 0; j < 4; j++) plank(Q, 0, 2 + j * 3, 40, 3, RP.madeira, s + j, false, 2.8 - j * 0.2);
  for (const x of [1, 13, 26, 38]) for (let y = 0; y < 14; y++) Q.put(x, y, RP.madeira, y === 0 ? 4 : 1.8);
  for (let x = 0; x < 40; x++) { Q.put(x, 0, RP.madeira, 4.2 + cg(x, 0, s) * 0.4); Q.put(x, 13, RP.ferro, 2); }
  Q.line(3, 13, 38, 13, RP.ferrugem, 2.6, 1);
  blit(P, Q, 3, 13, -0.3, 0, 13);
  // the back wheel on its axle: rim, spokes, hub (a wheel is upright, seen face on from the side)
  const wx = 36, wy = 18.5, wr = 8.5;
  for (let a = 0; a < 6.3; a += 0.05) { P.put(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, RP.ferro, 3.4 - Math.cos(a + 0.8) * 1.4); P.put(wx + Math.cos(a) * (wr - 1), wy + Math.sin(a) * (wr - 1), RP.madeira, 3 - Math.cos(a + 0.8) * 1.2); P.put(wx + Math.cos(a) * (wr - 2), wy + Math.sin(a) * (wr - 2), RP.madeira, 2); }
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 6 + 0.2; P.line(wx - Math.cos(a) * (wr - 2), wy - Math.sin(a) * (wr - 2), wx + Math.cos(a) * (wr - 2), wy + Math.sin(a) * (wr - 2), RP.madeira, 2.8); }
  P.blob(wx, wy, 1.8, 1.8, RP.ferro, s, 3);
  // the broken wheel leant on the nose: half a rim and three spokes
  for (let a = Math.PI * 0.95; a < Math.PI * 2.05; a += 0.05) { const cx = 9, cy = 21; P.put(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, RP.ferro, 3.2 - Math.cos(a + 0.8)); P.put(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, RP.madeira, 2.8); }
  for (let k = 0; k < 3; k++) { const a = Math.PI * (1.15 + k * 0.33); P.line(9, 21, 9 + Math.cos(a) * 5, 21 + Math.sin(a) * 5, RP.madeira, 2.6); }
  P.rect(5, 21, 9, 1, RP.madeira, (i) => 2.6 - i * 0.1);
  for (let y = 21; y <= yb; y++) { P.put(8, y, RP.madeira, 3); P.put(9, y, RP.madeira, 2); }   // its foot, the broken hub post
  // the shafts, down on the floor to the left
  P.line(0, yb, 10, yb - 3, RP.madeira, 3.2, 1); P.line(0, yb - 1, 6, yb - 3, RP.madeira, 2, 1);
  // a spilled sack and rubble
  P.blob(17, 25, 4.2, 2.6, RP.linho, s + 3, 2.4); P.put(21, 24, RP.corda, 3.4);
  rubble(P, 13, 28, yb, 2, RP.aterro, s + 4);
  stain(P, RP.lodo, 0.02, s, (x, y) => (y > 22 ? 0.35 : -0.2));
  return P.done();
}
function barricade() {   // 46 x 30: the looters' barricade: a table on its side, a wardrobe, crates, a chair on top, a door leant on it, sharpened stakes to the right
  const P = painter(46, 30), s = 13261, yb = 29;
  // the wardrobe standing at the back left: panels, a hinge, a cracked door
  P.box(1, 4, 13, 26, RP.madeira, s, 2.4); P.rect(3, 6, 4, 10, RP.madeira, (i, j) => 1.6 + (j === 0 ? 1 : 0)); P.rect(8, 6, 4, 10, RP.madeira, (i, j) => 1.6 + (j === 0 ? 1 : 0)); P.rect(3, 18, 9, 9, RP.madeira, (i, j) => 1.8 + (i === 0 || j === 0 ? 0.8 : 0));
  P.put(7, 12, RP.ouro, 3); P.line(4, 4, 9, 0, RP.madeira, 2.6, 1);   // a pediment snapped
  // the table on its side: the top as a standing board (planks up and down), its legs out to the left at top and foot
  for (let j = 0; j < 4; j++) plank(P, 14 + j * 4, 10, 20, 4, RP.madeira, s + 4 + j, true, 3 - j * 0.2);
  P.line(12, 12, 6, 12, RP.madeira, 3, 2); P.line(12, 27, 8, 27, RP.madeira, 2.4, 2);
  // crates at its foot, front
  P.box(22, 19, 10, 11, RP.madeira, s + 9, 2.8); P.line(22, 19, 31, 29, RP.madeira, 1.6, 1); P.line(22, 24, 31, 24, RP.madeira, 1.6, 1);
  // a chair upside down on top of the table edge
  P.rect(18, 8, 10, 2, RP.madeira, (i, j) => 3.6 - j - i * 0.08);
  P.line(19, 7, 19, 1, RP.madeira, 3.2, 1); P.line(26, 7, 26, 2, RP.madeira, 2.4, 1); P.line(27, 10, 30, 14, RP.madeira, 2.2, 1); P.line(27, 9, 31, 4, RP.madeira, 2.6, 1);
  // the door leant across the front, planks with an iron band
  const Q = painter(9, 26); for (let j = 0; j < 3; j++) plank(Q, j * 3, 0, 26, 3, RP.madeira, s + 14 + j, true, 2.9 - j * 0.3); Q.rect(0, 5, 9, 1, RP.ferro, (i) => 3 - i * 0.2); Q.rect(0, 19, 9, 1, RP.ferro, (i) => 3 - i * 0.2);
  blit(P, Q, 30, 4, 0.33, 4, 25);
  // stakes sharpened, out to the right (toward whoever comes), a scrap of rag on one
  for (const [y, l] of [[13, 10], [19, 12], [25, 9]]) { P.line(33, y + 3, 33 + l, y, RP.madeira, (t) => 3.6 - t * 0.4, 1); P.line(33, y + 4, 33 + l - 1, y + 1, RP.madeira, 2, 1); P.put(33 + l, y - 1 + 1, RP.madeira, 4.6); }
  P.put(41, 18, RP.rubro, 3); P.put(42, 18, RP.rubro, 2.4); P.put(42, 19, RP.rubro, 2);
  rubble(P, 30, 45, yb, 2, RP.aterro, s + 20);
  return P.done();
}
function lootersFire() {   // 30 x 30: the looters' fire: a ring of stones in a row, logs crossed, a tripod over it with a pot on a chain (the tongues are drawn live)
  const P = painter(30, 30), s = 13281, yb = 29;
  // the tripod: two legs in front, one behind, lashed at the top
  P.line(4, yb, 14, 2, RP.madeira, (t) => 3.4 - t * 0.6, 1); P.line(26, yb, 16, 2, RP.madeira, (t) => 2.6 - t * 0.4, 1); P.line(17, yb - 3, 15, 2, RP.madeira, 1.6, 1);
  P.rect(13, 2, 4, 2, RP.corda, (i, j) => 3.4 - i * 0.4 - j * 0.6);
  chainV(P, 14, 4, 12);
  // the pot: iron, round-bellied, a lid knocked askew, a ladle in it
  for (let y = 12; y < 19; y++) { const t = (y - 12) / 6, hw = 5 * Math.sqrt(Math.max(0.15, 1 - Math.pow(t - 0.3, 2) * 1.6)); for (let x = Math.floor(15 - hw); x < 15 + hw; x++) P.put(x, y, RP.ferro, 3.2 - (x + 0.5 - 15) / hw * 1.3 - t * 0.8 + cg(x, y, s) * 0.4); }
  P.rect(9, 12, 12, 1, RP.ferro, (i) => 4 - i * 0.15); P.put(10, 11, RP.ferro, 3); P.put(19, 11, RP.ferro, 2.4);
  P.line(17, 12, 21, 7, RP.madeira, 3, 1);
  // the logs crossed under it, ends charred, embers between
  P.line(7, yb - 1, 21, yb - 6, RP.madeira, (t) => 2.6 + t * 0.4, 2); P.line(23, yb - 1, 9, yb - 5, RP.madeira, (t) => 2.4 - t * 0.2, 2);
  for (const [x, y] of [[7, yb - 1], [8, yb - 2], [21, yb - 6], [23, yb - 1]]) P.put(x, y, RP.sombra, 3);
  for (let x = 9; x < 22; x++) for (let y = yb - 4; y < yb; y++) if (hash2(x, y, s) < 0.55 - Math.abs(x - 15) * 0.03) P.put(x, y, RP.brasa, 2.6 + hash2(x, y, s + 1) * 3);
  // the stones: a row along the floor, front ones bigger
  for (let k = 0; k < 7; k++) { const x = 3.5 + k * 3.8, r = 1.7 + hash2(k, 0, s) * 0.7; P.blob(x, yb - r * 0.7 + 0.4, r, r * 0.8, RP.cantaria, s + k, 2.6); }
  for (let x = 0; x < 30; x++) if (hash2(x, 2, s) < 0.35) P.put(x, yb, RP.aterro, 2 + hash2(x, 3, s));
  return P.done();
}
function fallenStall() {   // 46 x 28: a market stall come down: one post standing, the awning bar slid to the floor, striped canvas draped, crates and black fruit
  const P = painter(46, 28), s = 13301, yb = 27;
  // the standing post and the broken one
  plank(P, 3, 2, 26, 2, RP.madeira, s, true, 3); plank(P, 38, 17, 11, 2, RP.madeira, s + 1, true, 2.4); P.put(38, 16, RP.madeira, 4); P.put(39, 15, RP.madeira, 3.2);
  // the awning bar from the top of the post down to the floor at the right
  P.line(3, 3, 44, yb - 1, RP.madeira, (t) => 3.4 - t * 0.5, 2);
  // the canvas: faded red and linen stripes, hanging off the bar in folds, torn ragged
  const top = x => 4 + (x - 3) * (yb - 4) / 41, len = x => Math.min(yb - top(x), 7 + Math.sin(x * 0.7) * 2 + (x > 16 && x < 26 ? 3 : 0));
  for (let x = 5; x < 43; x++) { const y0 = top(x) + 1, L = len(x), R = Math.floor((x - 5) / 4) % 2 ? RP.linho : RP.rubro; for (let j = 0; j < L; j++) { const y = Math.round(y0 + j); if (j > L - 2 && hash2(x, j, s) < 0.5) continue; P.put(x, y, R, 3 - j / L * 1.2 + Math.sin(x * 1.4) * 0.6 + cg(x, y, s) * 0.5); } }
  // the counter board tipped down, crates, a basket on its side spilling black fruit
  P.line(7, 17, 22, yb - 1, RP.madeira, (t) => 3.2 - t * 0.4, 2);
  P.box(9, 20, 9, 8, RP.madeira, s + 4, 2.8); P.line(9, 23, 17, 23, RP.madeira, 1.6, 1);
  for (let y = 21; y <= yb; y++) { const hw = 3 + (y - 21) * 0.4; for (let x = Math.round(27 - hw); x <= 27 + hw; x++) P.put(x, y, RP.corda, ((x + y) % 2 ? 3.2 : 2.2) - (x - 27) * 0.1); }
  for (let k = 0; k < 7; k++) P.blob(31 + k * 1.8, yb - 0.6 - (k % 3 === 1 ? 1.2 : 0), 1, 0.9, RP.podre, s + k, 2.4);
  for (let x = 0; x < 46; x++) if (hash2(x, 5, s) < 0.3) P.put(x, yb, RP.aterro, 2 + hash2(x, 6, s));
  return P.done();
}
function streetWell() {   // 30 x 42: a street well: a curb of dressed stone, two posts, a slate hood, the windlass with its crank and rope, the bucket on the rim
  const P = painter(30, 42), s = 13321, yb = 41;
  // the hood: a gable of slate over a beam
  for (let y = 0; y < 7; y++) { const hw = 3 + y * 2; for (let x = Math.round(15 - hw); x <= 15 + hw; x++) P.put(x, y, RP.telha, 3.4 - (x - 15 + hw) / (hw * 2 + 1) * 1.2 + ((x + (y % 2) * 2) % 4 === 0 ? -0.9 : 0) + (y === 6 ? -0.8 : 0) + cg(x, y, s) * 0.5); }
  P.rect(2, 7, 26, 2, RP.madeira, (i, j) => 3.4 - j * 1.2 - i * 0.03);
  // the posts down into the curb
  plank(P, 4, 9, 22, 3, RP.madeira, s + 1, true, 3); plank(P, 23, 9, 22, 3, RP.madeira, s + 2, true, 2.4);
  // the windlass: a roller with the rope wound on it, the crank out to the right
  for (let x = 6; x < 24; x++) for (let y = 15; y < 19; y++) P.put(x, y, x > 9 && x < 20 ? RP.corda : RP.madeira, (y === 15 ? 3.8 : y === 18 ? 1.6 : 2.8) + ((x + y) % 3 === 0 && x > 9 && x < 20 ? -0.8 : 0));
  P.rect(26, 16, 3, 2, RP.ferro, (i, j) => 3.4 - j); P.line(28, 17, 28, 23, RP.ferro, 2.8, 1); P.rect(27, 23, 3, 2, RP.madeira, (i) => 3.4 - i * 0.6);
  // the rope down into the mouth
  for (let y = 19; y < 30; y++) P.put(14, y, RP.corda, 3.2 - (y % 3 === 0 ? 1 : 0));
  // the curb: courses of cantaria, a coping stone on top
  ashlar(P, 1, 31, 28, 11, RP.cantaria, s + 3, 4, 8, null, 2.6);
  P.rect(0, 29, 30, 2, RP.cantaria, (i, j) => 4.4 - j * 1.4 - i * 0.04 + cg(i, j, s) * 0.5);
  // the bucket left on the rim
  for (let y = 23; y < 29; y++) for (let x = 18; x < 24; x++) P.put(x, y, (y === 24 || y === 27) ? RP.ferrugem : RP.madeira, 3 - (x - 18) * 0.3 + cg(x, y, s) * 0.4 + (y === 23 ? 0.8 : 0));
  P.line(18, 23, 21, 20, RP.ferro, 3, 1); P.line(21, 20, 23, 23, RP.ferro, 2.2, 1);
  stain(P, RP.limo, 0, s, (x, y) => (y > 36 ? 0.3 : -0.3) - (P.is(x, y, RP.cantaria) ? 0 : 1));
  return P.done();
}
function pew(k) {   // 32 x 18: a pew of the temple seen from behind: the back board, the seat behind it, carved ends with the Poço's sign (k 1: snapped in two)
  const P = painter(32, 18), s = 13341 + k, yb = 17, Q = painter(32, 18);
  // the ends: tall boards with a round top, the sign carved
  for (const ex of [0, 29]) { for (let y = 1; y <= yb; y++) for (let x = ex; x < ex + 3; x++) Q.put(x, y, RP.madeira, (ex ? 2.2 : 3.2) - (x - ex) * 0.5 + (y === 1 ? 1 : 0) + cg(x, y, s) * 0.5); Q.put(ex + 1, 0, RP.madeira, 3.6); }
  // the back board (two planks), the seat edge showing below it, the rail on top
  plank(Q, 3, 2, 26, 2, RP.madeira, s + 1, false, 3.4); plank(Q, 3, 4, 26, 4, RP.madeira, s + 2, false, 2.6); plank(Q, 3, 8, 26, 3, RP.madeira, s + 3, false, 2.4);
  for (let x = 3; x < 29; x++) { Q.put(x, 11, RP.madeira, 3.4); Q.put(x, 12, RP.madeira, 1.4); }   // the seat's lip
  for (const lx of [9, 21]) for (let y = 13; y <= yb; y++) Q.put(lx, y, RP.madeira, 2);   // middle legs, in the shadow
  pocoSign(Q, 15.5, 6, 2.6, RP.madeira, RP.sombra, s, 1.4, 1);
  if (!k) { blit(P, Q, 0, 0); }
  else {   // snapped: the two halves sag into a V, the break splintered
    const A = painter(16, 18), B = painter(16, 18);
    for (let y = 0; y < 18; y++) for (let x = 0; x < 16; x++) { const kA = y * 32 + x, kB = y * 32 + x + 16; if (Q.c[kA]) A.put(x, y, Q.ramps[Q.rid[kA]], Q.val[kA]); if (Q.c[kB]) B.put(x, y, Q.ramps[Q.rid[kB]], Q.val[kB]); }
    blit(P, A, 0, 0, 0.17, 0, 17); blit(P, B, 16, 0, -0.17, 15, 17);
    for (const [x, y] of [[14, 5], [16, 4], [15, 8], [17, 9]]) P.put(x, y, RP.madeira, 4.4);
  }
  return P.done();
}
function wellAltar() {   // 42 x 28: the altar of the Poço: a slab of the Poço's own black stone on a block, a wax-coloured cloth with the sign, candles on it and at its feet
  const P = painter(42, 28), s = 13361, yb = 27;
  WK.length = 0;
  // the block and the slab: black, smooth, never dressed
  for (let y = 9; y <= yb; y++) for (let x = 5; x < 37; x++) P.put(x, y, RP.poco, 2.8 - (x - 5) / 32 * 1.4 + (x === 5 ? 1.4 : 0) + (y === 9 ? 1 : 0) + cn(x, y, 30, 30, s) * 0.8 + cg(x, y, s) * 0.3);
  for (let x = 2; x < 40; x++) { P.put(x, 7, RP.poco, 4.4 - (x - 2) * 0.04); P.put(x, 8, RP.poco, 2.6 - (x - 2) * 0.03); }
  // the cloth over the front, the sign painted on it in black, its hem frayed, wax spilt down it
  for (let x = 12; x < 30; x++) { const L = 11 + Math.round(Math.sin(x * 0.9) * 1.2 + hash2(x, 0, s)); for (let y = 8; y < 8 + L; y++) P.put(x, y, RP.cera, 3.2 - (x - 12) * 0.06 + Math.sin(x * 1.3) * 0.5 - (y - 8) * 0.06 + cg(x, y, s) * 0.5); }
  pocoSign(P, 21, 13.5, 3.6, RP.sombra, RP.sombra, s, 2.6, 0.5);
  for (const [x, l] of [[7, 5], [33, 7], [25, 4]]) for (let j = 0; j < l; j++) P.put(x, 9 + j, RP.cera, 4.6 - j * 0.3);
  // a bowl of offerings at the middle: a shallow cup with coins heaped over the brim
  for (let y = 4; y < 7; y++) for (let x = 17; x < 25; x++) { const hw = 4 - (y - 4) * 0.9; if (Math.abs(x + 0.5 - 21) > hw) continue; P.put(x, y, RP.ferro, 3.2 - (x - 17) * 0.25); }
  for (let x = 18; x < 24; x++) P.put(x, 3, RP.prata, 3.4 + hash2(x, 1, s) * 1.6 - (x - 18) * 0.2); P.put(20, 2, RP.prata, 4.4); P.put(21, 2, RP.prata, 3.2);
  // candles: a row on the slab, clusters on the floor
  for (const [x, h] of [[4, 4], [8, 6], [12, 3], [28, 5], [32, 3], [36, 6]]) candle(P, x, 6, h, s + x);
  for (const [x, h] of [[0, 4], [2, 6], [38, 5], [40, 3]]) candle(P, x, yb, h, s + 40 + x);
  for (let x = 0; x < 42; x++) if (hash2(x, 6, s) < 0.4) P.put(x, yb, RP.cera, 2.6 + hash2(x, 7, s));
  const cv = P.done(); return [cv, WK.map(w => ({ x: w.x, y: w.y }))];
}
function facelessStatue(k) {   // 22 x 46: a robed figure of the city on its plinth, the face a blank (k 0: hooded, cantaria, the cult's; k 1: a crowned noble in marble, the face scraped away)
  const W = 22, H = 46, P = painter(W, H), s = 13381 + k, R = k ? RP.marmore : RP.cantaria, yb = H - 1, cx = 11;
  // the plinth
  ashlar(P, 2, 37, 18, 9, R, s, 3, 9, null, 2.6); P.rect(1, 35, 20, 2, R, (i, j) => 4.4 - j * 1.4 - i * 0.05);
  // the robe: widening to the foot, deep folds, lit from the left
  for (let y = 12; y < 35; y++) { const t = (y - 12) / 22, hw = 4 + t * 3.4; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; if (Math.abs(u) > 1) continue; P.put(x, y, R, 3.2 - u * 1.4 + Math.sin(x * 1.6 + t * 2) * 0.45 - (y === 34 ? 0.8 : 0) + cg(x, y, s) * 0.45); } }
  // the shoulders and the arms folded (k 0) or one holding a broken sceptre (k 1)
  P.blob(cx, 12, 5.2, 2.4, R, s, 2.8);
  if (!k) { P.rect(8, 18, 7, 3, R, (i, j) => 3.4 - j * 0.8 - i * 0.12); P.put(10, 17, R, 4); }
  else { tube(P, t => [7 + t * 2, 13 + t * 9], () => 2.4, R, s + 1, 2.6); P.line(9, 24, 9, 14, RP.ouro, 3, 1); P.put(9, 13, RP.ouro, 4); P.put(8, 12, RP.ouro, 3); }
  // the head: hood (k 0) or crown (k 1); where the face should be, nothing
  if (!k) {
    P.blob(cx, 6.5, 4.2, 5.2, R, s + 2, 2.6);
    for (let y = 4; y < 11; y++) for (let x = 9; x < 14; x++) if (Math.hypot((x + 0.5 - 11.8) / 2.2, (y + 0.5 - 7.5) / 3.2) < 1) P.put(x, y, R, 1.4 + (y - 4) * 0.08);   // inside the hood
    for (let y = 6; y < 10; y++) for (let x = 10; x < 13; x++) if (Math.hypot((x + 0.5 - 11.8) / 1.5, (y + 0.5 - 8) / 2) < 1) P.put(x, y, R, 3 - (x - 10) * 0.4);    // the blank face, smooth as an egg
  } else {
    P.blob(cx, 7, 3.4, 4, R, s + 2, 2.8);
    for (let y = 5; y < 11; y++) for (let x = 9; x < 15; x++) if (Math.hypot((x + 0.5 - 12) / 2.4, (y + 0.5 - 8) / 3) < 1 && hash2(x, y, s) < 0.85) P.put(x, y, R, 1.6 + hash2(x, y, s + 1) * 2.2);   // gouged
    for (let x = 8; x < 15; x++) P.put(x, 3, RP.ouro, 3.6 - (x - 8) * 0.25); for (const x of [8, 10, 12, 14]) P.put(x, 2, RP.ouro, 3.6 - (x - 8) * 0.2);
  }
  stain(P, k ? RP.aterro : RP.limo, 0, s, (x, y) => (y > 30 ? 0.25 : -0.15) + (y < 8 ? 0.1 : 0));
  rubble(P, 0, 6, yb, 1, R, s + 9);
  return P.done();
}
function offerings() {   // 32 x 16: a heap of offerings for the Poço: bowls of coins and teeth, a doll, tied bundles, a cracked jug, two votive candles
  const P = painter(32, 16), s = 13401, yb = 15;
  WK.length = 0;
  // the heap's body: bundles of cloth and the jug
  P.blob(10, 11.5, 6, 4, RP.linho, s, 2.6); P.blob(20, 12.5, 5, 3, RP.rubro, s + 1, 2.4);
  for (let y = 6; y < 15; y++) { const hw = y < 8 ? 1.4 : 3 - Math.abs(y - 11) * 0.25; for (let x = Math.floor(26 - hw); x <= 26 + hw; x++) P.put(x, y, RP.tijolo, 3.6 - (x + 0.5 - 26) / hw * 1.2 + cg(x, y, s) * 0.4); }
  P.line(27, 8, 25, 13, RP.sombra, 2, 1);   // the crack
  P.put(10, 7, RP.corda, 3.6); P.put(11, 7, RP.corda, 2.6); P.line(5, 11, 15, 11, RP.corda, 2.4, 1);
  // bowls (side view: a shallow cup), coins heaped in one, teeth in the other
  const bowl = (bx, by) => { for (let y = by; y < by + 3; y++) { const hw = 3.4 - (y - by) * 0.9; for (let x = Math.floor(bx - hw); x < bx + hw; x++) P.put(x, y, RP.ferro, 3.2 - (x - bx + hw) * 0.25); } };
  bowl(7, 13); bowl(17, 7);
  for (let x = 5; x < 10; x++) P.put(x, 12, RP.prata, 3.4 + hash2(x, 0, s) * 1.6); P.put(7, 11, RP.prata, 4.6);
  for (let x = 15; x < 20; x++) if (x % 2) P.put(x, 6, RP.osso, 4.4); P.put(16, 6, RP.osso, 3); P.put(18, 5, RP.osso, 4.6);
  // a rag doll sat against the jug, black button eyes, no mouth
  P.blob(22, 6, 1.6, 1.6, RP.linho, s + 3, 3); P.rect(21, 8, 3, 4, RP.azul, (i, j) => 3.2 - i * 0.6 - j * 0.1); P.put(21, 6, RP.sombra, 1); P.put(23, 6, RP.sombra, 1); P.put(20, 12, RP.linho, 2.6); P.put(24, 12, RP.linho, 2);
  // coins spilled along the floor, two votive candles lit
  for (let k = 0; k < 6; k++) P.put(2 + hash2(k, 0, s) * 28, yb, RP.prata, 3 + hash2(k, 1, s) * 2);
  candle(P, 1, yb, 4, s + 7); candle(P, 30, yb, 5, s + 8);
  const cv = P.done(); return [cv, WK.map(w => ({ x: w.x, y: w.y }))];
}
function dryFountain() {   // 46 x 38: the square's fountain, dry: a basin of marble with its moulded lip, a pillar, an upper cup, the broken stump of a fish
  const P = painter(46, 38), s = 13421, yb = 37, cx = 23;
  // the basin: a wall of marble, its lip moulded out on top, old water marks, a crack down it
  ashlar(P, 1, 27, 44, 11, RP.marmore, s, 5, 11, null, 2.4);
  P.rect(0, 25, 46, 2, RP.marmore, (i, j) => 4.6 - j * 1.6 - i * 0.03 + cg(i, j, s) * 0.5);
  for (let x = 2; x < 44; x++) P.put(x, 28, RP.aterro, 3 + cg(x, 0, s));   // the old waterline
  P.line(30, 27, 33, 37, RP.sombra, 3, 1); P.line(31, 27, 34, 37, RP.marmore, 1, 1);
  // the pillar: fluted, from the basin up to the cup
  for (let y = 12; y < 25; y++) for (let x = cx - 3; x <= cx + 3; x++) P.put(x, y, RP.marmore, 3.6 - (x - cx + 3) * 0.4 + ((x - cx) % 2 ? -0.5 : 0) + cg(x, y, s) * 0.4);
  // the upper cup: a shallow bowl, side on (wider at the top, a foot under it)
  for (let y = 7; y < 12; y++) { const hw = 11 - (y - 7) * 1.6; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) P.put(x, y, RP.marmore, (y === 7 ? 4.6 : 3.2) - (x - cx + hw) / (hw * 2) * 1.4 + cg(x, y, s) * 0.5); }
  for (let x = cx - 12; x <= cx + 12; x++) P.put(x, 6, RP.marmore, 4 - (x - cx + 12) * 0.05);
  // stains run down from the cup's lip where the water spilt
  for (const x of [15, 18, 28, 31]) for (let y = 8; y < 11 + hash2(x, 0, s) * 2; y++) if (P.has(x, y)) P.put(x, y, RP.aterro, 2.6);
  // the fish on top, broken off at the gills: its tail and the stump
  for (let y = 0; y < 6; y++) { const hw = 1.6 + (5 - y) * 0.15; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) P.put(x, y, RP.marmore, 3.8 - (x - cx + hw) * 0.6 + cg(x, y, s) * 0.5); }
  for (let x = cx - 2; x <= cx + 2; x++) P.put(x, 0, RP.marmore, 1.6 + hash2(x, 0, s) * 2);   // the broken face
  // pieces of it on the ground, dust and dead leaves at the foot
  rubble(P, 37, 45, yb, 1.5, RP.marmore, s + 5); rubble(P, 1, 6, yb, 1, RP.aterro, s + 6);
  return P.done();
}
function sunkCarriage() {   // 54 x 36: the palace carriage sunk to its axles in fill: the body tilted, a door hanging, gilt trim, the crest, a dead lantern
  const P = painter(54, 36), s = 13441, yb = 35, Q = painter(40, 26);
  // the body: a box with a swelling bottom, panels, a door with its window black, gilt mouldings
  for (let y = 4; y < 24; y++) { const t = (y - 4) / 19, inset = y > 17 ? Math.round(Math.pow((y - 17) / 6, 2) * 6) : 0; for (let x = 2 + inset; x < 38 - inset; x++) Q.put(x, y, RP.azul, 2.8 - (x - 2) / 36 * 1.2 - t * 0.5 + cg(x, y, s) * 0.5); }
  for (let x = 0; x < 40; x++) { Q.put(x, 3, RP.azul, 3.8); Q.put(x, 2, RP.ouro, 3.6 - x * 0.03); }
  for (let x = 3; x < 37; x++) Q.put(x, 1, RP.azul, 3.2);
  for (const x of [5, 11, 18, 26, 33]) Q.put(x, 0, RP.ouro, 3.8);   // the rail on the roof
  for (let x = 3; x < 37; x++) { Q.put(x, 4, RP.ouro, 3.4 - x * 0.03); Q.put(x, 17, RP.ouro, 3 - x * 0.03); }
  for (let y = 5; y < 17; y++) { Q.put(14, y, RP.ouro, 3); Q.put(26, y, RP.ouro, 2.4); }
  for (let y = 6; y < 11; y++) for (let x = 17; x < 24; x++) Q.put(x, y, RP.sombra, 1.4 + (x === 17 || y === 6 ? 0.8 : 0));   // the door's window, black inside
  Q.blob(7.5, 11, 2.4, 2.8, RP.ouro, s + 1, 2.6); Q.put(7, 10, RP.rubro, 3.6); Q.put(8, 11, RP.rubro, 3);   // the crest
  for (let y = 5; y < 16; y++) Q.put(31, y, RP.ouro, 2.6);
  blit(P, Q, 6, 2, 0.08, 20, 20);
  // the coachman's seat and a dead lantern on a bracket
  P.rect(46, 13, 7, 2, RP.madeira, (i, j) => 3.2 - j - i * 0.1); P.line(47, 15, 45, 20, RP.madeira, 2, 1);
  P.line(4, 7, 1, 7, RP.ferro, 3, 1); P.rect(0, 8, 3, 4, RP.ferro, (i, j) => 2.6 - i * 0.5); P.put(1, 9, RP.vAmbar, 1.4);
  // the wheels: upright rims, spokes; the lower halves lost in the fill
  const wheel = (wx, wy, wr, ss) => {
    for (let a = 0; a < 6.3; a += 0.04) { P.put(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, RP.ferro, 3.4 - Math.cos(a + 0.8) * 1.4); P.put(wx + Math.cos(a) * (wr - 1), wy + Math.sin(a) * (wr - 1), RP.madeira, 2.8 - Math.cos(a + 0.8)); }
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 6 + ss; P.line(wx - Math.cos(a) * (wr - 1.5), wy - Math.sin(a) * (wr - 1.5), wx + Math.cos(a) * (wr - 1.5), wy + Math.sin(a) * (wr - 1.5), RP.madeira, 2.6); }
    P.blob(wx, wy, 1.6, 1.6, RP.ouro, s, 2.6);
  };
  wheel(14, 27, 9, 0.2); wheel(41, 28, 7, 0.5);
  // the door hanging open on one hinge, down onto the fill
  P.line(28, 21, 33, 30, RP.azul, 2.4, 3); P.line(28, 21, 33, 30, RP.ouro, 3, 1);
  // the fill: a mound of earth and broken masonry heaped to the axles, highest at the wheels
  for (let x = 0; x < 54; x++) {
    const top = yb - 5.5 - Math.max(0, 3 - Math.abs(x - 14) * 0.3) - Math.max(0, 2.5 - Math.abs(x - 41) * 0.35) + cn(x, 0, 9, 9, s) * 2.4 + (x < 3 || x > 50 ? 3 : 0);
    for (let y = Math.floor(top); y <= yb; y++) P.put(x, y, RP.aterro, 3 - (y - top) * 0.25 - x / 54 * 0.5 + cg(x, y, s) * 0.7 + (y === Math.floor(top) ? 0.9 : 0));
  }
  for (let k = 0; k < 9; k++) { const x = 2 + hash2(k, 0, s) * 50, y = yb - 1 - hash2(k, 1, s) * 4; P.blob(x, y, 1.4, 1, hash2(k, 2, s) < 0.5 ? RP.marmore : RP.tijolo, s + k, 2.6); }
  return P.done();
}
function banquetTable() {   // 54 x 22: the long banquet table, the legs at one end broken so it slopes to the floor, the cloth sliding off, plates and goblets spilled
  const P = painter(54, 22), s = 13461, yb = 21, Q = painter(50, 4);
  plank(Q, 0, 0, 50, 3, RP.madeira, s, false, 3.2); for (let x = 0; x < 50; x++) Q.put(x, 3, RP.ouro, 2.4 - x * 0.02);
  blit(P, Q, 1, 8, 0.2, 0, 1);
  // the standing legs (turned) at the left; the broken pair under the low end
  for (const lx of [3, 9]) for (let y = 11; y <= yb; y++) { const bulge = Math.abs(y - 15) < 2 ? 1 : 0; for (let x = lx - bulge; x < lx + 2 + bulge; x++) P.put(x, y, RP.madeira, (lx === 3 ? 3 : 2.2) - (x - lx) * 0.5 + cg(x, y, s) * 0.4); }
  P.line(40, 17, 43, 20, RP.madeira, 2.4, 2); P.line(46, yb, 50, 17, RP.madeira, 2, 2);
  // the cloth: red with a gold hem, sliding off the high end in a fall of folds
  for (let x = 1; x < 30; x++) { const top = 7 + x * 0.2, L = x < 12 ? 5 + Math.sin(x * 1.1) * 1.4 : 3 + Math.sin(x * 1.3); for (let j = 0; j < L; j++) P.put(x, Math.round(top + j), RP.rubro, 3.2 - j * 0.3 + Math.sin(x * 1.3) * 0.6 + cg(x, j, s) * 0.4); P.put(x, Math.round(top + L), RP.ouro, 3); }
  // plates and goblets slid down to the low end, a candlestick fallen (cold)
  const goblet = (gx, by, lying) => { if (!lying) { P.rect(gx - 1, by - 5, 3, 2, RP.prata, (i, j) => 4 - i * 0.8); P.put(gx, by - 3, RP.prata, 3); P.put(gx, by - 2, RP.prata, 3); P.rect(gx - 1, by - 1, 3, 1, RP.prata, (i) => 3.4 - i * 0.6); } else { P.rect(gx, by - 2, 2, 3, RP.prata, (i, j) => 3.6 - j * 0.6); P.line(gx + 2, by - 1, gx + 4, by - 1, RP.prata, 3, 1); P.put(gx + 5, by, RP.prata, 2.6); P.put(gx + 5, by - 1, RP.prata, 3.4); P.put(gx + 5, by - 2, RP.prata, 2.6); } };
  goblet(24, 12, false); goblet(37, yb, true); goblet(46, yb - 1, false);
  P.rect(28, yb - 1, 6, 1, RP.prata, (i) => 4 - i * 0.3); P.rect(29, yb, 4, 1, RP.prata, (i) => 2.8 - i * 0.3);   // a plate on its rim? no: a plate fallen flat is a line on the floor
  P.line(14, 10, 20, 9, RP.prata, 3.6, 1); P.put(13, 9, RP.prata, 4);
  P.line(48, yb, 53, yb - 2, RP.ouro, 3, 1); P.rect(52, yb - 4, 2, 2, RP.ouro, (i) => 3.4 - i); P.put(53, yb - 5, RP.cera, 3.6);
  for (let k = 0; k < 5; k++) P.put(30 + hash2(k, 0, s) * 20, yb, RP.podre, 2.4 + hash2(k, 1, s));
  return P.done();
}

/* =============================== CEILING =============================== */
function halfChandelier() {   // 40 x 42: the palace chandelier hung from one chain, the other snapped: the crown tipped steeply, arms of gilt, cold candles, crystal drops
  const P = painter(40, 42), s = 13501, Q = painter(28, 16);
  // the crown seen from the side: a gilt band, a boss under it, six arms curling up in a row, a cup and a cold stub on each, drops under the band
  for (let x = 3; x < 25; x++) { Q.put(x, 9, RP.ouro, 4 - (x - 3) * 0.06); Q.put(x, 10, RP.ouro, 2.6 - (x - 3) * 0.05); Q.put(x, 11, RP.ouro, 1.6); }
  for (let y = 11; y < 15; y++) { const hw = 3 - (y - 11) * 0.7; for (let x = Math.floor(14 - hw); x <= 14 + hw; x++) Q.put(x, y, RP.ouro, 3.6 - (x - 14 + hw) * 0.5); }
  Q.put(14, 15, RP.ouro, 3.6);
  for (let k = 0; k < 6; k++) {
    const ax = 3.5 + k * 4.2, dir = ax < 14 ? -1 : 1;
    for (let j = 0; j < 4; j++) Q.put(ax + dir * (j === 1 || j === 2 ? 1 : 0), 8 - j, RP.ouro, 3.4 - j * 0.2 - (dir > 0 ? 0.5 : 0));
    Q.rect(Math.round(ax) - 1, 4, 3, 1, RP.ouro, (i) => 4 - i * 0.7);
    if (k !== 4) stub(Q, Math.round(ax), 3, 1 + ((k * 5) % 3), s + k);   // cold stubs, one gone
    if (k % 2 === 0) { Q.put(ax, 12, RP.prata, 4.4); Q.put(ax, 13, RP.prata, 3); }
  }
  // tipped: hung by its left end, the right end low
  blit(P, Q, 3, 14, 0.62, 3, 9);
  // the chain still holding, from its hook in the ceiling to the left end of the band
  P.rect(3, 0, 6, 2, RP.ferro, (i, j) => 3.4 - j - i * 0.2);
  chainV(P, 5, 2, 23);
  // the snapped chain, hanging short from its own hook, the broken link
  P.rect(28, 0, 6, 2, RP.ferro, (i, j) => 3 - j - i * 0.2); chainV(P, 30, 2, 12); P.put(31, 12, RP.ferro, 2.6); P.put(30, 13, RP.ferro, 2);
  // a long drop of old wax off the low end
  for (let j = 0; j < 4; j++) P.put(26, 37 + j, RP.cera, 3.6 - j * 0.4);
  return P.done();
}
function birdCage() {   // 16 x 30: a bird cage on a chain, the door hanging open, a perch, a small heap of bones on its floor
  const P = painter(16, 30), s = 13521;
  chainV(P, 7, 0, 7, RP.ferro);
  P.put(7, 7, RP.ferro, 3.4); P.put(8, 7, RP.ferro, 2.6); P.put(7, 8, RP.ferro, 3);   // the hook
  for (let x = 1; x < 15; x++) P.put(x, 9 + Math.round(Math.pow((x + 0.5 - 8) / 7, 2) * 5), RP.ferrugem, 3.6 - (x - 1) * 0.14);   // the dome
  for (const x of [1, 4, 7, 11, 14]) { const y0 = 9 + Math.round(Math.pow((x + 0.5 - 8) / 7, 2) * 5); for (let y = y0 + 1; y < 27; y++) if (!(x === 14 && y > 17 && y < 25)) P.put(x, y, RP.ferrugem, x < 7 ? 3.6 : x === 7 ? 3 : 2.2); }
  P.rect(0, 27, 16, 2, RP.ferrugem, (i, j) => 3.6 - j * 1.4 - i * 0.1);
  for (let y = 18; y < 25; y++) P.put(15, y + (y - 18) * 0.2, RP.ferrugem, 2);   // the door swung out
  P.line(2, 20, 12, 20, RP.madeira, 2.8, 1);
  P.put(6, 26, RP.osso, 4.4); P.put(7, 26, RP.osso, 3.6); P.put(8, 25, RP.osso, 4.6); P.put(9, 26, RP.osso, 3); P.put(5, 26, RP.linho, 2.6);   // a little skull and ribs, a feather
  return P.done(false);
}
function washLine() {   // 52 x 26: a line of washing left to rot: cords from two hooks in the ceiling, a rope sagging between them, a shirt, a sheet, trousers, a stocking
  const P = painter(52, 26), s = 13541;
  for (let y = 0; y < 5; y++) { P.put(1, y, RP.corda, 3 - (y % 2)); P.put(50, y, RP.corda, 2.6 - (y % 2)); }
  const at = rope(P, 1, 5, 50, 5, 5, RP.corda, s);
  // the shirt: shoulders on the line, sleeves out, torn tail
  const sx = 6; for (let y = 0; y < 12; y++) for (let x = sx; x < sx + 9; x++) { const yy = Math.round(at(x) + 1 + y); if (y > 9 && hash2(x, y, s) < 0.5) continue; P.put(x, yy, RP.linho, 3.2 - (x - sx) * 0.12 - y * 0.08 + cg(x, yy, s) * 0.5 + (x === sx + 4 && y < 3 ? -1 : 0)); }
  for (let y = 0; y < 4; y++) { P.put(sx - 1 - y * 0.4, Math.round(at(sx) + 1 + y), RP.linho, 2.8); P.put(sx + 9 + y * 0.4, Math.round(at(sx + 8) + 1 + y), RP.linho, 2.2); }
  // the sheet: long, folded over the line, holes rotted through, dark with damp at the hem
  drape(P, 17, 31, x => Math.round(at(x)) + 1, x => 15 + Math.round(Math.sin(x * 0.8) * 1.6), RP.linho, s + 1, 0.55);
  stain(P, RP.podre, 0, s + 2, (x, y) => (x > 16 && x < 32 ? (y - 12) * 0.06 : -1));
  // the trousers: two legs from a waistband
  const tx = 35; for (let x = tx; x < tx + 6; x++) P.put(x, Math.round(at(x)) + 1, RP.couro, 3.4);
  for (let y = 2; y < 13; y++) for (const lx of [tx, tx + 3.5]) for (let x = Math.round(lx); x < lx + 2.5; x++) P.put(x, Math.round(at(tx + 2)) + y, RP.azul, 3 - (x - tx) * 0.12 - y * 0.05 + cg(x, y, s) * 0.5);
  // the stocking, a peg
  for (let y = 1; y < 8; y++) P.put(45, Math.round(at(45)) + y, RP.rubro, 3 - y * 0.12); P.put(46, Math.round(at(45)) + 7, RP.rubro, 2.6); P.put(46, Math.round(at(45)) + 8, RP.rubro, 2.2);
  for (const x of [8, 13, 18, 30, 36, 40, 45]) P.put(x, Math.round(at(x)) - 1, RP.madeira, 3.6);
  return P.done();
}
function bellString() {   // 46 x 24: the cult's string of bells: a cord sagging from two hooks, a row of small bells and charms on threads, one big bell in the middle
  const P = painter(46, 24), s = 13561;
  for (let y = 0; y < 3; y++) { P.put(1, y, RP.ferro, 3 - y * 0.4); P.put(44, y, RP.ferro, 2.6 - y * 0.4); }
  const at = rope(P, 1, 3, 44, 3, 6, RP.cera, s);
  const bell = (x, y0, h, hw) => { for (let y = 0; y < h; y++) { const w2 = hw * (0.55 + 0.45 * Math.pow(y / (h - 1), 1.6)); for (let xx = Math.floor(x - w2); xx <= x + w2; xx++) P.put(xx, y0 + y, RP.ouro, 3.6 - (xx + 0.5 - x) / w2 * 1.3 - y / h * 0.6 + (y === h - 1 ? -0.8 : 0)); } P.put(x, y0 + h, RP.ferro, 2.6); };
  for (let x = 4; x < 43; x += 3) {
    const y = Math.round(at(x)), L = 2 + ((x * 7) % 4);
    for (let j = 1; j <= L; j++) P.put(x, y + j, RP.cera, 2.8);
    if (Math.abs(x - 22.5) < 2) continue;
    if ((x / 3) % 3 === 2) { P.put(x, y + L + 1, RP.osso, 4.4); P.put(x, y + L + 2, RP.osso, 3.4); }   // a tooth
    else bell(x, y + L + 1, 3, 1.4);
  }
  // the big bell, on a short chain
  const by = Math.round(at(22.5)); chainV(P, 22, by + 1, by + 5); bell(22.5, by + 5, 8, 3.8);
  P.put(22, by + 14, RP.ferro, 3); P.put(23, by + 14, RP.ferro, 2);
  // wax-coloured ribbons hung between
  for (const x of [11, 34]) { const y = Math.round(at(x)); for (let j = 1; j < 9; j++) P.put(x + Math.sin(j * 0.7) * 0.6, y + j, RP.rubro, 3 - j * 0.15); }
  return P.done();
}
function bucketChain(k) {   // 12 x 32 or 12 x 46: a cistern bucket on its long chain, hoops rusted, dripping black water
  const H = k ? 46 : 32, P = painter(12, H), s = 13581 + k, top = H - 12;
  P.rect(3, 0, 6, 2, RP.ferro, (i, j) => 3.4 - j - i * 0.2);
  chainV(P, 5, 2, top - 2);
  P.line(1, top + 1, 5, top - 2, RP.ferro, 3.2, 1); P.line(6, top - 2, 10, top + 1, RP.ferro, 2.4, 1);   // the bail
  for (let y = top + 1; y < top + 10; y++) { const t = (y - top - 1) / 8, hw = 4.6 - t * 0.9; for (let x = Math.floor(6 - hw); x < 6 + hw; x++) { const hoop = y === top + 2 || y === top + 8; P.put(x, y, hoop ? (hash2(x, y, s) < 0.4 ? RP.ferrugem : RP.ferro) : RP.madeira, (hoop ? 3.2 : 3) - (x + 0.5 - 6) / hw * 1.2 + ((x - 1) % 3 === 0 && !hoop ? -0.7 : 0) + cg(x, y, s) * 0.5); } }
  stain(P, RP.limo, 0, s, (x, y) => (y > top + 5 ? 0.3 : y < top ? -1 : -0.1));
  P.put(6, top + 10, RP.agua, 4.4); P.put(6, top + 11, RP.agua, 5);   // a drop about to fall
  return P.done();
}

/* =============================== BACK WALL =============================== */
function cisternArch() {   // 52 x 50: a cistern arch of mossy dressed stone, black beyond, weed hanging off the arch, the old water line
  const P = painter(52, 50), s = 13601, yb = 49, cx = 26, r = 18;
  const archTop = x => { const dx = (x + 0.5 - cx) / r; return Math.abs(dx) > 1 ? 99 : 26 - Math.sqrt(1 - dx * dx) * r * 0.95; };
  // the dark beyond, the arch ring, the piers
  for (let x = 8; x < 44; x++) for (let y = Math.ceil(archTop(x)); y <= yb; y++) P.put(x, y, RP.sombra, 2.4 - (y - 10) * 0.03 + cg(x, y, s) * 0.6);
  const ring = (X, Y) => { const dx = X + 0.5 - cx, dy = Y + 0.5 - 26; const d = Math.hypot(dx, dy / 0.95); return Y < 27 && d >= r && d < r + 6; };
  for (let y = 0; y < 27; y++) for (let x = 2; x < 50; x++) { if (!ring(x, y)) continue; const a = Math.atan2(y + 0.5 - 26, x + 0.5 - cx), vous = Math.floor(a * 6), d = Math.hypot(x + 0.5 - cx, (y + 0.5 - 26) / 0.95); const joint = Math.abs((a * 6) % 1) < 0.12 || Math.abs((a * 6) % 1) > 0.95; P.put(x, y, RP.limo, joint ? 1.2 : 3 + hash2(vous, 0, s) * 0.8 + (d < r + 1 ? -0.6 : 0) + (d > r + 5 ? 0.6 : 0) - (x - 2) / 48 * 0.8 + cg(x, y, s) * 0.5); }
  ashlar(P, 2, 26, 7, 24, RP.limo, s + 1, 4, 7, null, 2.8); ashlar(P, 43, 26, 7, 24, RP.limo, s + 2, 4, 7, null, 2.2);
  P.rect(1, 24, 9, 2, RP.limo, (i, j) => 4 - j * 1.4 - i * 0.1); P.rect(42, 24, 9, 2, RP.limo, (i, j) => 3.4 - j * 1.4 - i * 0.1);   // the imposts
  // the waterline: a band of black scum on the piers, a lighter salt line above it
  for (let x = 2; x < 50; x++) for (let y = 38; y <= yb; y++) if (P.is(x, y, RP.limo)) P.put(x, y, RP.lodo, P.val[y * 52 + x] * 0.6 + 0.6);
  for (let x = 2; x < 50; x++) if (P.has(x, 37) && !P.is(x, 37, RP.sombra)) P.put(x, 37, RP.cantaria, 2.6 + cg(x, 0, s));
  // weed off the arch's underside, dripping
  for (let x = 10; x < 43; x += 2) { if (hash2(x, 0, s) < 0.3) continue; const y0 = Math.ceil(archTop(x)), L = 2 + hash2(x, 1, s) * 7; for (let j = 0; j < L; j++) P.put(x + Math.sin(j * 0.5 + x) * 0.5, y0 + j, RP.limo, 3.4 - j / L * 1.6); }
  stain(P, RP.lodo, 0, s + 3, (x, y) => (P.is(x, y, RP.sombra) ? -1 : cn(x, y, 8, 30, s + 4) * 0.6 - 0.1));
  return P.done();
}
function houseFront(k) {   // 50 x 52: a slice of a crooked house front: door with its step, a shuttered window, the upper floor jutting on a beam, slate eave (k 0: timber and plaster; k 1: brick with a stone door frame)
  const W = 50, H = 52, P = painter(W, H), s = 13621 + k, yb = H - 1, lean = k ? -0.05 : 0.06;
  const Q = painter(W, H);
  if (!k) {
    // plaster panels between timbers, the plaster fallen in places to the brick
    bricks(Q, 2, 8, 46, 44, s, null, 0.72);
    for (const x of [2, 24, 46]) plank(Q, x, 8, 44, 2, RP.madeira, s + x, true, 2.6);
    plank(Q, 0, 26, 50, 3, RP.madeira, s + 3, false, 3);   // the jetty beam
    Q.line(4, 25, 22, 10, RP.madeira, 2.4, 2); Q.line(26, 10, 44, 25, RP.madeira, 2.2, 2);   // the braces
  } else {
    bricks(Q, 2, 8, 46, 44, s, null, 0.2);
    for (let x = 2; x < 48; x++) Q.put(x, 26, RP.cantaria, 3.2 - x * 0.02);   // a string course
  }
  // the eave: slate on rafter ends
  for (let y = 0; y < 8; y++) for (let x = 0; x < W; x++) Q.put(x, y, RP.telha, 3.4 - y * 0.15 - x * 0.02 + ((x + (y >> 1) * 3) % 6 === 0 ? -1 : 0) + ((y & 1) ? -0.4 : 0) + cg(x, y, s) * 0.5);
  for (let x = 1; x < W; x += 5) { Q.put(x, 8, RP.madeira, 3.2); Q.put(x + 1, 8, RP.madeira, 2); }
  // the door: planks, studs, a stone or timber frame, a step
  const dx = 6, dw = 13, dt = 33;
  for (let y = dt - 2; y < yb - 1; y++) for (let x = dx - 2; x < dx + dw + 2; x++) Q.put(x, y, k ? RP.cantaria : RP.madeira, (k ? 3.4 : 2.8) - (x - dx) * 0.04 + (y === dt - 2 ? 1 : 0) + cg(x, y, s) * 0.5);
  for (let j = 0; j < 4; j++) plank(Q, dx + j * 3 + 1, dt, yb - 1 - dt, 3, RP.madeira, s + 10 + j, true, 2.2 - j * 0.15);
  for (const y of [dt + 3, dt + 12]) for (let x = dx + 1; x < dx + dw; x++) Q.put(x, y, RP.ferro, 2.6);
  Q.put(dx + dw - 2, dt + 8, RP.ferro, 3.8);   // the ring
  Q.rect(dx - 3, yb - 1, dw + 6, 2, RP.cantaria, (i, j) => 3.8 - j * 1.2 - i * 0.05);   // the step
  // the windows: shutters, dark behind (one shutter hanging)
  const win = (wx, wy, ww, wh, hang) => {
    for (let y = wy - 1; y < wy + wh + 1; y++) for (let x = wx - 1; x < wx + ww + 1; x++) Q.put(x, y, k ? RP.cantaria : RP.madeira, (k ? 3.6 : 3) - (y === wy + wh ? 1 : 0));
    for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) Q.put(x, y, RP.sombra, 2 + (x === wx || y === wy ? -1 : 0));
    for (let y = wy; y < wy + wh; y++) for (let x = wx - 5; x < wx; x++) Q.put(x, y, RP.madeira, 2.8 - (x - wx + 5) * 0.1 + ((x - wx) % 2 ? -0.6 : 0));
    if (hang) for (let y = 0; y < wh - 1; y++) for (let x = 0; x < 5; x++) Q.put(wx + ww + 1 + x - y * 0.25, wy + 2 + y + x * 0.4, RP.madeira, 2.4 - x * 0.15 + (x % 2 ? -0.5 : 0));
    else for (let y = wy; y < wy + wh; y++) for (let x = wx + ww; x < wx + ww + 5; x++) Q.put(x, y, RP.madeira, 2.4 - (x - wx - ww) * 0.1 + ((x - wx) % 2 ? -0.5 : 0));
    for (let x = wx - 2; x < wx + ww + 2; x++) Q.put(x, wy + wh + 1, RP.cantaria, 3.6);   // the sill
  };
  win(31, 35, 8, 9, false); win(10, 12, 8, 9, true); win(32, 12, 7, 9, false);
  // lean the whole front with the block, then the grime of water from the eave down
  for (let y = 0; y < H; y++) { const sh = Math.round((yb - y) * lean); for (let x = 0; x < W; x++) { const k2 = y * W + x; if (Q.c[k2]) P.put(x + sh, y, Q.ramps[Q.rid[k2]], Q.val[k2]); } }
  stain(P, RP.lodo, -0.05, s + 4, (x, y) => (P.is(x, y, RP.sombra) || P.is(x, y, RP.telha) ? -1 : cn(x, y, 6, 40, s + 5) * 0.8 + (y > 44 ? 0.2 : 0)));
  return P.done();
}
function shopDoor() {   // 34 x 42: a shop front shut with boards: the wide door behind planks nailed across, the counter shutter down, the empty sign bracket, a looter's chalk mark
  const P = painter(34, 42), s = 13641, yb = 41;
  bricks(P, 0, 4, 34, 38, s, null, 0.45);
  // the lintel beam, the frame
  plank(P, 0, 2, 34, 3, RP.madeira, s + 1, false, 3);
  for (let y = 5; y < yb - 1; y++) { P.put(3, y, RP.madeira, 3); P.put(4, y, RP.madeira, 2.4); P.put(29, y, RP.madeira, 2.6); P.put(30, y, RP.madeira, 1.8); }
  // the opening: the door to the left, the counter shutter to the right, dark gaps
  for (let y = 5; y < yb - 1; y++) for (let x = 5; x < 18; x++) P.put(x, y, RP.madeira, 1.8 + ((x - 5) % 4 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  for (let y = 18; y < yb - 1; y++) for (let x = 18; x < 29; x++) P.put(x, y, RP.cantaria, 2.6 - (x - 18) * 0.05 + (y === 18 ? 1 : 0));   // the counter's stone base
  for (let y = 6; y < 17; y++) for (let x = 18; x < 29; x++) P.put(x, y, RP.madeira, 2.2 + ((y - 6) % 3 === 0 ? 0.8 : 0) - (x - 18) * 0.05);   // the shutter, down
  // planks nailed across the door, crooked
  for (const [y0, y1] of [[10, 13], [22, 20], [31, 34]]) { P.line(3, y0, 19, y1, RP.madeira, (t) => 3.6 - t * 0.4, 3); P.put(4, y0 + 1, RP.ferro, 4); P.put(18, y1 + 1, RP.ferro, 4); }
  P.line(17, 8, 29, 15, RP.madeira, (t) => 3.4 - t * 0.4, 2);
  // the sign bracket, its sign gone, a bit of chain left
  P.line(30, 5, 34, 5, RP.ferro, 3.4, 1); P.line(31, 5, 33, 8, RP.ferro, 2.4, 1); chainV(P, 32, 6, 9);
  // a chalk mark of the looters on the door: a circle crossed
  for (let a = 0; a < 6.3; a += 0.4) P.put(11 + Math.cos(a) * 2.4, 27 + Math.sin(a) * 2.4, RP.cera, 4.6);
  P.line(8, 30, 14, 24, RP.cera, 4.4, 1);
  P.rect(2, yb - 1, 30, 2, RP.cantaria, (i, j) => 3.6 - j * 1.2 - i * 0.05);   // the step
  return P.done();
}
function templeGate() {   // 54 x 58: the gate of the Poço's temple: piers of dressed stone, a round arch, doors of black wood banded in iron, the sign over it in the Poço's black stone, candles at its feet
  const P = painter(54, 58), s = 13661, yb = 57, cx = 27, r = 15;
  WK.length = 0;
  const top = x => { const dx = (x + 0.5 - cx) / r; return Math.abs(dx) > 1 ? 99 : 28 - Math.sqrt(1 - dx * dx) * r; };
  // the piers and the wall above the arch
  ashlar(P, 0, 4, 54, yb - 4, RP.cantaria, s, 4, 9, (X, Y) => !(X >= cx - r && X < cx + r && Y >= top(X)), 2.6);
  for (let x = 0; x < 54; x++) { P.put(x, 2, RP.cantaria, 4.4 - x * 0.03); P.put(x, 3, RP.cantaria, 2.4); }   // the cornice
  // the voussoirs round the arch
  for (let y = 4; y < 29; y++) for (let x = cx - r - 4; x < cx + r + 4; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 28); if (d < r || d > r + 3.5 || y > 28) continue; const a = Math.atan2(y + 0.5 - 28, x + 0.5 - cx); P.put(x, y, RP.cantaria, Math.abs((a * 5) % 1) < 0.15 ? 1.4 : 3.6 - (x - cx) / r * 0.6 + cg(x, y, s) * 0.5); }
  // the doors: vertical boards of black wood, iron bands with studs, the meeting line
  for (let x = cx - r; x < cx + r; x++) for (let y = Math.ceil(top(x)); y < yb - 1; y++) P.put(x, y, RP.madeira, 1.8 - (x - cx + r) * 0.02 + ((x - cx + r) % 4 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.5);
  for (let y = 14; y < yb - 1; y++) P.put(cx, y, RP.sombra, 1);
  for (const y of [22, 34, 47]) for (let x = cx - r + 1; x < cx + r - 1; x++) if (y >= top(x) + 1) { P.put(x, y, RP.ferro, 3 - (x - cx + r) * 0.04); if ((x - cx + r) % 5 === 2) P.put(x, y - 1, RP.ferro, 4); }
  P.put(cx - 3, 38, RP.ferro, 3.8); P.put(cx + 2, 38, RP.ferro, 3.2);   // the rings
  // the sign over the arch: a round of the Poço's own black stone set in, a ring carved round it
  for (let y = 4; y < 14; y++) for (let x = cx - 5; x <= cx + 5; x++) { const d = Math.hypot(x + 0.5 - cx - 0.5, y + 0.5 - 9); if (d < 4.6) P.put(x, y, RP.poco, 3.2 - (x - cx + y - 9) / 5 * 0.7 - (d < 2.2 ? 2 : 0)); else if (d < 5.5) P.put(x, y, RP.cantaria, 1.2); }
  // wax run down from the sill of the sign, the step, the candles at both feet
  for (const [x, l] of [[24, 8], [30, 5]]) for (let j = 0; j < l; j++) P.put(x, 14 + j, RP.cera, 4.2 - j * 0.3);
  P.rect(cx - r - 2, yb - 1, r * 2 + 4, 2, RP.cantaria, (i, j) => 3.8 - j * 1.2 - i * 0.03);
  for (const [x, h] of [[3, 5], [6, 7], [9, 4], [43, 6], [46, 4], [49, 7]]) candle(P, x, yb, h, s + x);
  stain(P, RP.limo, -0.05, s + 2, (x, y) => (P.is(x, y, RP.cantaria) ? (y > 48 ? 0.35 : -0.1) : -1));
  const cv = P.done(); return [cv, WK.map(w => ({ x: w.x, y: w.y }))];
}
function brokenStair() {   // 62 x 46: a marble stair in relief up the wall, broken off two thirds up: treads and risers on a solid flight, a balustrade, the break ragged, pieces at its foot
  const P = painter(62, 46), s = 13681, yb = 45, rise = 3, run = 4, X1 = 40;
  const tread = x => yb - 2 - Math.floor(x / run) * rise;   // the top of the step over column x
  const brk = y => X1 - Math.round((yb - y) * 0.18 + cn(0, y, 3, 3, s) * 5);   // the ragged end of the flight, by row
  for (let x = 0; x < X1 + 4; x++) for (let y = tread(x); y <= yb; y++) {
    if (y < 2 || x > brk(y)) continue;
    const sx = x % run, sy = y - tread(x), nose = sy === 0, lip = sy === 1;
    const core = x > brk(y) - 3 && cn(x, y, 4, 4, s + 2) > -0.15;   // the snapped face shows the rubble core
    if (core) { P.put(x, y, RP.aterro, 2.4 + cg(x, y, s) * 1.2); continue; }
    P.put(x, y, RP.marmore, nose ? 4.6 - x * 0.015 : lip ? 2 : 3 - x * 0.015 - (sy > rise ? 0.4 : 0) + (sx === run - 1 && sy < rise ? -0.4 : 0) + ((y - 1) % 8 === 0 ? -0.7 : 0) + cg(x, y, s) * 0.5);
  }
  // the balustrade: posts on each step, a rail along the slope, its end snapped short of the break
  const rail = x => yb - 2 - x * rise / run - 9;
  for (let x = 1; x < X1 - 6; x++) { P.put(x, Math.round(rail(x)), RP.marmore, 4.4 - x * 0.02); P.put(x, Math.round(rail(x)) + 1, RP.marmore, 2.4); }
  for (let x = 2; x < X1 - 6; x += run) { const y0 = Math.round(rail(x)) + 2, y1 = tread(x); for (let y = y0; y < y1; y++) { const mid = Math.abs(y - (y0 + y1) / 2) < 1.4; P.put(x, y, RP.marmore, 3.8); if (mid) { P.put(x + 1, y, RP.marmore, 2.6); P.put(x - 1, y, RP.marmore, 4.2); } } }
  // pieces of the flight on the floor beyond the break: a whole step, chips, dust
  rubble(P, X1 - 2, 61, yb, 3, RP.marmore, s + 5);
  P.box(48, yb - 3, 8, 4, RP.marmore, s + 6, 2.8); P.box(56, yb - 5, 4, 3, RP.marmore, s + 7, 2.6);
  P.line(40, yb - 2, 47, yb - 6, RP.marmore, 3.6, 2);   // a length of the rail
  stain(P, RP.aterro, -0.12, s + 7, (x, y) => (y > 40 ? 0.3 : -0.1));
  return P.done();
}
function houseWindow(k) {   // 24 x 28: a house window: frame, cross bar, panes broken to black (k 0: shutters, one hanging; k 1: boarded half up)
  const P = painter(24, 28), s = 13701 + k;
  for (let y = 0; y < 26; y++) for (let x = 3; x < 21; x++) P.put(x, y, RP.madeira, 3 - (x - 3) * 0.05 + (y === 0 ? 1 : 0) + cg(x, y, s) * 0.5);
  // the panes: four, some glass left (dull, a sheen at a corner), shards round the holes
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const px = 5 + i * 8, py = 2 + j * 11, broken = (i + j * 2 + k) % 3 !== 1;
    for (let y = py; y < py + 9; y++) for (let x = px; x < px + 6; x++) {
      const hole = broken && Math.hypot(x + 0.5 - px - 3 - (i ? 1 : -0.5), y + 0.5 - py - 4.5) < 3 + hash2(x, y, s) * 1.8;
      P.put(x, y, hole ? RP.sombra : RP.agua, hole ? 1.6 : 3.4 - (x - px) * 0.2 - (y - py) * 0.1 + (x === px && y < py + 3 ? 1.4 : 0));
    }
  }
  for (let y = 0; y < 26; y++) P.put(12, y, RP.madeira, 2.6);
  // the sill
  P.rect(1, 25, 22, 3, RP.cantaria, (i, j) => 4 - j * 1.1 - i * 0.04);
  if (!k) {
    for (let y = 0; y < 25; y++) for (let x = 0; x < 3; x++) P.put(x, y, RP.madeira, 2.8 - x * 0.3 + (y % 4 === 0 ? -0.8 : 0));
    for (let y = 0; y < 20; y++) for (let x = 0; x < 3; x++) P.put(21 + x + y * 0.08, 4 + y + x * 0.5, RP.madeira, 2.2 - x * 0.3 + (y % 4 === 0 ? -0.8 : 0));   // hanging off its lower hinge
  } else {
    for (const [y0, y1] of [[14, 16], [19, 18], [23, 23]]) { P.line(2, y0, 21, y1, RP.madeira, (t) => 3.6 - t * 0.4, 3); P.put(3, y0 + 1, RP.ferro, 4); P.put(20, y1 + 1, RP.ferro, 4); }
  }
  return P.done();
}
function stainedGlass() {   // 30 x 54: a tall arched palace window, leaded diamonds of dull blue and red, a roundel with an amber bell, cracked, a few pieces gone to black
  const P = painter(30, 54), s = 13721, cx = 15, ry = 27;
  const inside = (x, y) => { if (y < 4 || y > 48 || x < 4 || x > 25) return false; if (y < 15) return Math.hypot(x + 0.5 - cx, y + 0.5 - 15) < 11; return true; };
  // the marble frame round the arch, the sill
  for (let y = 0; y < 51; y++) for (let x = 0; x < 30; x++) {
    const inF = y < 15 ? Math.hypot(x + 0.5 - cx, y + 0.5 - 15) < 15 : true;
    if (inF && !inside(x, y)) P.put(x, y, RP.marmore, 3.2 - x * 0.05 + (y < 15 && Math.hypot(x + 0.5 - cx, y + 0.5 - 15) > 14 ? 0.8 : 0) + (x === 3 || x === 26 ? -1 : 0) + cg(x, y, s) * 0.5);
  }
  P.rect(0, 49, 30, 2, RP.marmore, (i, j) => 4.4 - j * 1.4 - i * 0.04);
  // the glass: diamonds by a diagonal lead lattice; the roundel in the middle with a bell in amber on blue
  const inRound = (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - ry) < 7.5;
  const bell = (x, y) => { const t = (y + 0.5 - (ry - 4.5)) / 8; if (t < 0 || t > 1) return false; const hw = 1.4 + Math.pow(t, 1.6) * 3.4; return Math.abs(x + 0.5 - cx) < hw; };
  for (let y = 4; y < 49; y++) for (let x = 4; x < 26; x++) {
    if (!inside(x, y)) continue;
    const dr = Math.hypot(x + 0.5 - cx, y + 0.5 - ry);
    if (Math.abs(dr - 7.5) < 0.7) { P.put(x, y, RP.ferro, 1.6); continue; }
    if (inRound(x, y)) { const b = bell(x, y); if (b !== bell(x - 1, y) || b !== bell(x, y - 1)) { P.put(x, y, RP.ferro, 1.4); continue; } P.put(x, y, b ? RP.vAmbar : RP.vAzul, (b ? 3.2 : 2.2) - (x - cx + y - ry) * 0.05 + cg(x, y, s) * 0.4); continue; }
    const u = x + y, v = x - y; if (u % 5 === 0 || ((v % 5) + 5) % 5 === 0) { P.put(x, y, RP.ferro, 1.4); continue; }
    const cell = Math.floor(u / 5) * 31 + Math.floor((v + 100) / 5), R = y < 15 ? RP.vAzul : hash2(cell, 0, s) < 0.35 ? RP.vRubro : RP.vAzul;
    P.put(x, y, R, 2.4 + hash2(cell, 1, s) * 0.9 - (x - 4) * 0.03 - (y - 4) * 0.01 + cg(x, y, s) * 0.3);
  }
  // the crack: a thin jagged line down from the arch, two diamonds gone along it
  let x = 9, y = 6; for (let k = 0; k < 44 && y < 48; k++) { if (inside(x, y)) P.put(x, y, RP.sombra, 2); x += hash2(k, 1, s) < 0.45 ? 1 : 0; y++; if (x > 21) x = 21; }
  for (const [hx, hy] of [[13, 17], [20, 40]]) for (let yy = hy - 2; yy <= hy + 2; yy++) for (let xx = hx - 2; xx <= hx + 2; xx++) if (Math.abs(xx - hx) + Math.abs(yy - hy) < 2 && inside(xx, yy)) P.put(xx, yy, RP.sombra, 1);
  return P.done();
}
function wellSign(k) {   // 26 x 30: the Poço's sign painted on the wall: a black mouth, two rings of pale lime round it, the paint run down (k 1: older, half flaked off, a hand print)
  const P = painter(26, 30), s = 13741 + k, cx = 13, cy = 12;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 26; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), flake = k && cn(x, y, 6, 6, s) + 0.5 < 0.45;
    if (flake) continue;
    if (d < 4.6) P.put(x, y, RP.poco, 1.6 + cg(x, y, s) * 0.6);
    else if (Math.abs(d - 7.4) < 1.1 || Math.abs(d - 11) < 0.9) P.put(x, y, RP.cera, (k ? 2.6 : 3.4) + cg(x, y, s) * 0.8 - (y - cy) * 0.04);
  }
  // the runs: from the bottom of the rings and the mouth
  for (const [x, l, R] of [[11, 10, RP.poco], [14, 14, RP.poco], [8, 6, RP.cera], [18, 9, RP.cera], [13, 7, RP.cera]]) { const y0 = Math.round(cy + Math.sqrt(Math.max(0, 121 - Math.pow(x + 0.5 - cx, 2)))) - (R === RP.poco ? 7 : 0); for (let j = 0; j < l; j++) if (!k || hash2(x, j, s) < 0.75) P.put(x, Math.min(29, y0 + j), R, (R === RP.poco ? 1.6 : 3) - j * 0.08); }
  if (k) for (const [hx, hy] of [[21, 22], [22, 20], [23, 21], [20, 21], [21, 24], [22, 24], [21, 23], [22, 22], [19, 19], [24, 19], [21, 19]]) P.put(hx, hy, RP.rubro, 2.6);   // a hand print in old red
  return P.done(false);   // paint on the wall: no rim
}
function kingPortrait() {   // 28 x 38: the king's portrait hung from a nail by its cord, a gilt frame, red robe and ermine, the crown; the face scraped down to the canvas
  const P = painter(28, 38), s = 13761;
  P.put(14, 0, RP.ferro, 4); P.line(14, 1, 3, 8, RP.corda, 3, 1); P.line(14, 1, 25, 8, RP.corda, 2.4, 1);
  const Q = painter(28, 30);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 28; x++) { const e = Math.min(x, y, 27 - x, 29 - y); if (e < 3) Q.put(x, y, RP.ouro, (e === 0 ? 3.6 : e === 1 ? 2.6 : 1.8) + (x < 3 || y < 3 ? 0.8 : -0.4) + ((x + y) % 3 === 0 ? 0.6 : 0) + cg(x, y, s) * 0.5); }
  // the dark ground, the robe, ermine collar, the crown, the scraped face
  for (let y = 3; y < 27; y++) for (let x = 3; x < 25; x++) Q.put(x, y, RP.sombra, 3.4 + cg(x, y, s) * 0.5 - y * 0.03);
  for (let y = 16; y < 27; y++) { const hw = 6 + (y - 16) * 0.6; for (let x = Math.floor(14 - hw); x < 14 + hw; x++) if (x > 2 && x < 25) Q.put(x, y, RP.rubro, 3.2 - (x - 14 + hw) / (hw * 2) * 1.4 + cg(x, y, s) * 0.5); }
  for (let x = 8; x < 20; x++) { Q.put(x, 16, RP.linho, 4.4); Q.put(x, 17, RP.linho, (x % 3 === 0 ? 1.4 : 4)); }
  for (let y = 7; y < 16; y++) for (let x = 10; x < 18; x++) if (Math.hypot((x + 0.5 - 14) / 3.8, (y + 0.5 - 11) / 4.6) < 1) Q.put(x, y, RP.linho, 2.4 + hash2(x, y, s) * 2 - (hash2(x + 3, y, s) < 0.3 ? 1.2 : 0));   // scraped to the weave
  for (const [x0, y0, x1, y1] of [[10, 8, 17, 14], [11, 13, 17, 9], [12, 7, 13, 15]]) Q.line(x0, y0, x1, y1, RP.sombra, 2.6, 1);   // knife strokes
  for (let x = 10; x < 18; x++) Q.put(x, 6, RP.ouro, 4 - (x - 10) * 0.2); for (const x of [10, 12, 14, 16]) Q.put(x, 5, RP.ouro, 4.4 - (x - 10) * 0.2);
  blit(P, Q, 0, 8, -0.05, 14, 0);
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, cidade: true }, extra || {}));
const WARM = '#ffa040', CANDLE = '#ffb84a', FIRE = '#ff8a2a';
// floor
def('cd_barco', 'Barco de fundo chato', F, 'frente', ['cisternas'], [flatBoat()], { beira: true });
def('cd_barris', 'Barris podres', F, 'frente', ['cisternas', 'ruas'], [barrels(0), barrels(1)]);
def('cd_carroca', 'Carroça tombada', F, 'frente', ['ruas'], [tippedCart()]);
def('cd_barricada', 'Barricada de móveis', F, 'frente', ['ruas'], [barricade()]);
def('cd_fogueira', 'Fogueira dos saqueadores', F, 'frente', ['ruas'], [lootersFire()], { luz: [{ x: 15, y: 22, r: 1 }], brilho: FIRE, anim: { k: 'cd_fogo', x: 15, y: 26, w: 5, h: 9 } });
def('cd_banca', 'Banca de feira caída', F, 'frente', ['ruas'], [fallenStall()]);
def('cd_poco_rua', 'Poço de rua', F, 'frente', ['ruas'], [streetWell()], { rua: true });
def('cd_bancos', 'Bancos do templo', F, 'frente', ['bairro'], [pew(0), pew(1)], { templo: true });
{ const [cv, w] = wellAltar(); def('cd_altar', 'Altar do Poço', F, 'frente', ['bairro'], [cv], { templo: true, luz: [{ x: 21, y: 2, r: 0.6 }, { x: 2, y: 22, r: 0.35 }, { x: 39, y: 22, r: 0.35 }], chamas: w, brilho: CANDLE }); }
def('cd_estatua', 'Estátua sem rosto', F, 'frente', ['bairro', 'palacio'], [facelessStatue(0), facelessStatue(1)], { faixaV: { bairro: [0], palacio: [1] } });
{ const [cv, w] = offerings(); def('cd_oferendas', 'Pilha de oferendas', F, 'frente', ['bairro'], [cv], { luz: [{ x: 16, y: 10, r: 0.35 }], chamas: w, brilho: CANDLE }); }
def('cd_fonte', 'Fonte seca', F, 'frente', ['palacio'], [dryFountain()]);
def('cd_carruagem', 'Carruagem afundada', F, 'frente', ['palacio'], [sunkCarriage()]);
def('cd_mesa', 'Mesa de banquete virada', F, 'frente', ['palacio'], [banquetTable()]);
// ceiling
def('cd_lustre', 'Lustre caído', C, 'frente', ['palacio'], [halfChandelier()]);
def('cd_gaiola', 'Gaiola de pássaro', C, 'frente', ['ruas'], [birdCage()]);
def('cd_varal', 'Varal com roupa podre', C, 'frente', ['ruas'], [washLine()]);
def('cd_sininhos', 'Fio de sininhos', C, 'frente', ['bairro'], [bellString()]);
def('cd_balde', 'Balde na corrente', C, 'frente', ['cisternas'], [bucketChain(0), bucketChain(1)]);
// back wall, standing on the floor
def('cd_arco', 'Arco de cisterna', W, 'fundo', ['cisternas'], [cisternArch()]);
def('cd_fachada', 'Fachada', W, 'fundo', ['ruas'], [houseFront(0), houseFront(1)]);
def('cd_porta_loja', 'Porta de loja tapada', W, 'fundo', ['ruas'], [shopDoor()]);
{ const [cv, w] = templeGate(); def('cd_portao', 'Portão do templo', W, 'fundo', ['bairro'], [cv], { luz: [{ x: 6, y: 50, r: 0.45 }, { x: 46, y: 50, r: 0.45 }], chamas: w, brilho: CANDLE }); }
def('cd_escadaria', 'Escadaria quebrada', W, 'fundo', ['palacio'], [brokenStair()]);
// back wall, windows
def('cd_janela', 'Janela quebrada', W, 'fundo', ['ruas'], [houseWindow(0), houseWindow(1)], { janela: true });
def('cd_vitral', 'Vitral rachado', W, 'fundo', ['palacio'], [stainedGlass()], { janela: true });
// back wall, eye height
def('cd_simbolo', 'Símbolo do Poço', W, 'fundo', ['bairro'], [wellSign(0), wellSign(1)]);
def('cd_retrato', 'Retrato do rei', W, 'fundo', ['palacio'], [kingPortrait()]);

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
Object.assign(CD_PROP_PLAN, {
  cisternas: { chao: [['cd_barco', 0.3, 1], ['cd_barris', 0.12, 1]], teto: [['cd_balde', 0.2, 2]], fundo: [['cd_arco', 0.12, 2]] },
  ruas: { chao: [['cd_fogueira', 0.05, 1], ['cd_barricada', 0.06, 1], ['cd_carroca', 0.06, 1], ['cd_banca', 0.07, 1], ['cd_poco_rua', 0.05, 1], ['cd_barris', 0.1, 1]], teto: [['cd_varal', 0.1, 1], ['cd_gaiola', 0.08, 1]], fundo: [['cd_fachada', 0.12, 2], ['cd_porta_loja', 0.08, 1], ['cd_janela', 0.15, 2]] },
  bairro: { chao: [['cd_bancos', 0.8, 6], ['cd_altar', 0.2, 1], ['cd_oferendas', 0.12, 1], ['cd_estatua', 0.06, 1]], teto: [['cd_sininhos', 0.15, 2]], fundo: [['cd_portao', 0.05, 1], ['cd_simbolo', 0.14, 2]] },
  palacio: { chao: [['cd_fonte', 0.06, 1], ['cd_carruagem', 0.05, 1], ['cd_mesa', 0.08, 1], ['cd_estatua', 0.1, 2]], teto: [['cd_lustre', 0.12, 1]], fundo: [['cd_escadaria', 0.06, 1], ['cd_vitral', 0.14, 2], ['cd_retrato', 0.1, 1]] }
});
}

/* ---------- the looters' fire: live tongues over the logs, a light that breathes ---------- */
let cdFireGlow = null;
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'cd_fogo') continue;
    if (!cdFireGlow) cdFireGlow = glow(28, '#ff7a20');
    lc.globalAlpha = 0.32 + Math.sin(gameTime * 11 + p.X) * 0.06 + Math.sin(gameTime * 27) * 0.04; lc.drawImage(cdFireGlow, Math.round(p.X + p.sh + A.x - cx - 28), Math.round(p.Y + A.y - cy - 34));
  }
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'cd_fogo') continue;
    const X = Math.round(p.X + p.sh + A.x - cx), Y = Math.round(p.Y + A.y - cy);
    for (let k = -A.w; k <= A.w; k++) {
      const e = 1 - Math.abs(k) / (A.w + 1), h = Math.round(A.h * e * (0.6 + 0.4 * Math.abs(Math.sin(gameTime * 7 + k * 1.9 + p.X * 0.1))) + Math.sin(gameTime * 13 + k) * 1.2);
      if (h < 1) continue;
      lc.fillStyle = '#c0420c'; lc.fillRect(X + k, Y - h, 1, h);
      lc.fillStyle = '#ff7a1a'; lc.fillRect(X + k, Y - Math.round(h * 0.75), 1, Math.round(h * 0.75));
      if (Math.abs(k) < A.w * 0.6) { lc.fillStyle = '#ffc23d'; lc.fillRect(X + k, Y - Math.round(h * 0.45), 1, Math.round(h * 0.45)); }
      if (Math.abs(k) < 2) { lc.fillStyle = '#fff0b0'; lc.fillRect(X + k, Y - Math.round(h * 0.2), 1, Math.round(h * 0.2)); }
    }
    // a spark rising now and then
    const sp = (gameTime * 1.3 + p.X * 0.01) % 1; lc.fillStyle = '#ffb84a'; lc.fillRect(X + Math.round(Math.sin(sp * 9 + p.X) * 3), Y - A.h - Math.round(sp * 14), 1, 1);
  }
});
