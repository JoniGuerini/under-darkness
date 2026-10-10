'use strict';

/* ================= the beasts of the Petrified Forest, part two =================
   Five of the ten (docs/camadas/07-floresta-petrificada.md, section 6; 143 has the other five). Beasts of stone,
   root and crystal, all with crystal eyes. None of them moves like another:
   - the hopping seeds (sementes): a swarm of 6 stone seeds that hop all together, on one beat. The swarm crouches
     and rattles as one (0.6 s); the next hop comes down on the hero. A swarm is one leader that brings its 5
     followers on its first step (followers carry e.fpFollower: the spawn cap counts the swarm once);
   - the walking trunk (troncovelho): slow, on roots. It stops and plants itself (the roots dig in, 0.6 s): planted
     it takes half damage, slowly heals, and its roots hurt to touch; pulling them out takes 1 s. The branch creaks
     and rises, then sweeps wide; planted, it lifts a root and stomps, and crystal leaves fall from the ceiling
     (their shadows show on the floor first);
   - the crystal urchin (ourico): walks slowly and turns round when hit. Its 8 spines light one by one, round it;
     when all are lit it fires them in every direction, then it is bald for 3 s (takes more damage);
   - the root serpent (serpraiz): lives in a hole in a trunk or a root and never leaves it. Two eyes light inside the
     hole and the bark creaks; half a second later it strikes straight out, up to 6 blocks, and springs back;
   - the living prism (prismavivo): floats slowly and only stops in a straight line with the hero (a row, a column
     or a diagonal, like a chess queen). A thin line of light shows the aim for 0.9 s, then the beam: it bounces
     once off crystal (foliage FP_FOLHA, geode FP_O_CRISTAL), and once that bounce is spent it goes straight
     through crystal foliage (the only thing in the layer that does).
   Same brush as 55/123/134 (cp, ramps, outline, cache); the ramps are the card's (section 12). Loads after 143 and
   before 145 and 49 (BAL): 145 sets the level and the spawn tables. */

/* ---------- stats (life and damage are level-1 bases: BAL and 145's level do the rest) ---------- */
Object.assign(ET, {
  sementes: { name: 'Sementes Saltadoras', w: 7, h: 7, hp: 12, dmg: 6, xp: 3, kb: 1.2, fly: false, blood: '#74887a' },
  troncovelho: { name: 'Tronco Andante', w: 18, h: 36, hp: 280, dmg: 28, xp: 44, kb: 0.05, fly: false, blood: '#8c7a66' },
  ourico: { name: 'Ouriço de Cristal', w: 14, h: 10, hp: 90, dmg: 15, xp: 22, kb: 0.5, fly: false, blood: '#8ad8cc' },
  serpraiz: { name: 'Serpente de Raiz', w: 9, h: 9, hp: 75, dmg: 21, xp: 20, kb: 0, fly: true, blood: '#836e56' },     // fly: it hangs in its hole
  prismavivo: { name: 'Prisma Vivo', w: 12, h: 16, hp: 50, dmg: 20, xp: 24, kb: 0.6, fly: true, blood: '#8ad8cc' }
});
const FPB2_TYPES = ['sementes', 'troncovelho', 'ourico', 'serpraiz', 'prismavivo'];

/* ---------- drops (147's materials and bases; the core takes gear chances x0.1, so 0.15 is 1.5%) ---------- */
const FPB2_DROPS = {
  sementes: [['pocao', 0.03], ['min_platina', 0.03]],
  troncovelho: [['casca_petrea', 0.4, 1, 2], ['carvao', 0.25, 1, 2], ['pocao', 0.08], ['min_platina', 0.1, 1, 2], ['lanca_raiz', 0.06]],
  ourico: [['pocao', 0.08], ['min_platina', 0.07], ['escudo_casca', 0.06]],
  serpraiz: [['seiva_vitrea', 0.3], ['pocao', 0.08], ['min_platina', 0.07], ['lanca_raiz', 0.06]],
  prismavivo: [['olho_prisma', 0.35], ['pocao', 0.08], ['min_platina', 0.06]]
};
for (const k of FPB2_TYPES) DROPS[k] = FPB2_DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { troncovelho: 1, ourico: 1 });
Object.assign(CV_STEP, { troncovelho: 1, ourico: 1 });

/* ================= art ================= */
const FPB2 = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R6 = hexes => hexes.map(h => ph(h));
const RK = {
  gran: R6(['#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a']),    // green granite
  casca: R6(['#221c18', '#3a3028', '#54463a', '#6e5e4e', '#8c7a66', '#ae9a84']),   // stone bark
  cerne: R6(['#2e2a22', '#4a4436', '#6a614c', '#8c8266', '#b0a688', '#d2caae']),   // heartwood rings
  raiz: R6(['#1e1814', '#33291f', '#4c3e2e', '#665440', '#836e56', '#a48c72']),    // stone root
  cris: R6(['#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec']),    // crystal
  seiva: R6(['#2a3010', '#4a5418', '#6e7c22', '#9aa83a', '#c4cc6a', '#e6ecac']),   // glassy sap
  boca: R6(['#080a08', '#0e1210', '#141a16', '#1c2420', '#26302a', '#2c3a32'])     // hollows, mouths, holes
};
// a thick limb along a polyline: a dark rim one pixel wider, then the limb lit from the top left (as 134)
function limb(P, pts, r, R, base, s) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n, (k + i / n) / (pts.length - 1)); } };
  each((cx, cy) => { const rr = r + 0.7; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, 0.4); });
  each((cx, cy, t) => { const rt = r * (1 - t * 0.35); for (let y = Math.floor(cy - rt); y <= cy + rt; y++) for (let x = Math.floor(cx - rt); x <= cx + rt; x++) { const dx = (x + 0.5 - cx) / rt, dy = (y + 0.5 - cy) / rt; if (dx * dx + dy * dy > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.1 ? -0.8 : 0)); } });
}
// a little cluster of crystal leaves round (x, y)
function leaves(P, x, y, s, n = 5, lit = 0) {
  for (let i = 0; i < n; i++) {
    const a = hash2(i, 1, s) * Math.PI * 2, r = 0.6 + hash2(i, 2, s) * 1.8, lx = x + Math.cos(a) * r, ly = y + Math.sin(a) * r * 0.8;
    const v = 2.6 + lit + hash2(i, 3, s) * 1.6 - (Math.cos(a) + Math.sin(a)) * 0.4;
    P.put(lx, ly, RK.cris, v); P.put(lx + (i % 2 ? 1 : 0), ly + (i % 2 ? 0 : 1), RK.cris, v - 1);
  }
  P.put(x - 0.4, y - 0.6, RK.cris, 4.4 + lit);
}

/* a seed, 11 x 10 (bottom on row 9): 0 sitting, 1 hopping (stretched), 2 crouched (rattling). SEED_EYE: the eye */
const SEED_EYE = [];
function seed(pose) {
  const P = cp(11, 10), s = 14101 + pose * 7, hop = pose === 1, sq = pose === 2;
  const cx = 5.2, cy = hop ? 5.2 : sq ? 6.7 : 6, rx = hop ? 3.3 : sq ? 4.6 : 3.9, ry = hop ? 3.8 : sq ? 2.7 : 3.3;
  // the stone body: green granite, pointed at the back, a furrow down its side
  P.blob(cx, cy, rx, ry, RK.gran, s, 2.2, (x, y, dx, dy) => (Math.abs(dx + 0.2 - dy * 0.2) < 0.11 && dy > -0.4 ? -1.2 : 0) + (dx < -0.75 ? -0.4 : 0));
  P.put(cx - rx - 0.3, cy + 0.3, RK.gran, 1.6);
  // the cap of stone bark over the top, ridged, and a crooked stalk
  for (let y = Math.floor(cy - ry - 0.6); y <= cy - ry * 0.25; y++) for (let x = Math.floor(cx - rx - 0.4); x <= cx + rx + 0.4; x++) {
    const dx = (x + 0.5 - cx) / (rx + 0.5), dy = (y + 0.5 - cy) / (ry + 0.5); if (dx * dx + dy * dy > 1) continue;
    P.put(x, y, RK.casca, 3 - dx * 1.2 - dy * 0.6 + ((x + y) % 2 ? -0.7 : 0) + cg(x, y, s + 1) * 0.5);
  }
  P.put(cx - 0.2, cy - ry - 1, RK.raiz, 3.2); P.put(cx - 1.2, cy - ry - 1.6, RK.raiz, 2.6);
  // a crack of living crystal in its front: the eye
  const ex = cx + rx * 0.5, ey = cy - 0.1 + (sq ? 0.4 : 0);
  P.put(ex, ey, RK.boca, 0.6); P.put(ex + 1, ey, RK.boca, 0.6); P.put(ex, ey, RK.cris, sq ? 5 : 4); P.put(ex - 0.6, ey + 1.2, RK.cris, 2);
  SEED_EYE[pose] = [Math.floor(ex) + 1, Math.floor(ey) + 1];
  return set(P.done());
}

/* the walking trunk, 44 x 52 facing right (the ground is row 47; rows 48-51 are under the floor, where planted roots
   go). arm 0 resting, 1 raised (the creak), 2 swept forward; legs 0 standing, 1-2 walking, 3 roots half in the
   floor (planting, pulling out), 4 planted, 5 planted with the front root lifted (the stomp) */
const TR_EYE = [];   // [arm * 6 + legs] -> the near eye
function trunk(arm, legs) {
  const W = 44, H = 52, G = 47, P = cp(W, H), s = 14201 + arm * 13 + legs * 5;
  const lean = legs === 5 ? -0.8 : arm === 2 ? 0.7 : arm === 1 ? -0.4 : 0;
  const bx = y => 21 + lean * (39 - y) / 30;
  // the far branch, behind and in shadow, with a dim cluster of crystal leaves
  limb(P, [[bx(15) - 4, 15], [bx(10) - 9, 10], [bx(4) - 12, 5]], 1.3, RK.casca, 0.8, s + 1);
  limb(P, [[bx(10) - 9, 10], [bx(8) - 14, 8.5]], 0.8, RK.casca, 0.6, s + 2);
  leaves(P, bx(4) - 12.6, 3.6, s + 3, 6, -0.6); leaves(P, bx(8) - 15, 7.6, s + 4, 4, -0.8);
  // roots: the legs (polylines from the base of the trunk)
  const ROOTS = [
    [[[15, 37], [12, 42], [9, G]], [[21, 38], [21, 43], [20, G]], [[27, 37], [30, 42], [33, G]]],
    [[[15, 37], [11, 42], [7, G]], [[21, 38], [23, 42], [25, G - 2.6]], [[27, 37], [31, 41], [35, G]]],
    [[[15, 37], [14, 42], [13, G - 2.6]], [[21, 38], [19, 43], [17, G]], [[27, 37], [29, 42], [31, G]]],
    [[[15, 37], [10, 43], [6, G + 1], [5, G + 2.5]], [[21, 38], [21, 44], [21, G + 2.5]], [[27, 37], [32, 43], [36, G + 1], [37, G + 2.5]]],
    [[[14, 36], [8, 42], [3, G], [1.5, H - 1.5]], [[17, 38], [14, 44], [12, G + 2], [11, H - 1]], [[21, 38], [21, 44], [22, H - 1]], [[25, 38], [28, 44], [30, G + 2], [31, H - 1]], [[28, 36], [34, 42], [40, G], [42, H - 1.5]]],
    [[[14, 36], [8, 42], [3, G], [1.5, H - 1.5]], [[17, 38], [14, 44], [12, G + 2], [11, H - 1]], [[21, 38], [21, 44], [22, H - 1]], [[25, 38], [28, 44], [30, G + 2], [31, H - 1]], [[28, 35], [34, 31], [38, 33], [40, 36]]]
  ][legs];
  ROOTS.forEach((r, i) => limb(P, r, i === 0 || (legs >= 4 && i === 1) ? 1.4 : 1.7, RK.raiz, i % 2 ? 1.6 : 2.2, s + 10 + i));
  if (legs >= 3) for (let i = 0; i < 9; i++) { const x = 3 + hash2(i, 1, s) * 38, y = G + 1 + hash2(i, 2, s) * 3; P.put(x, y, RK.raiz, 1.4); P.put(x + 1, y + 0.6, RK.raiz, 1); }   // root hairs in the soil
  // the trunk: furrowed stone bark, lit from the left, flared at the base and broken off at the top
  for (let y = 7; y <= 39; y++) {
    const cx = bx(y), half = 6.8 - (y < 13 ? (13 - y) * 0.22 : 0) + (y > 33 ? (y - 33) * 0.55 : 0);
    for (let x = Math.floor(cx - half); x <= cx + half; x++) {
      if (y < 10 && hash2(x, 0, s + 5) < 0.3 + (10 - y) * 0.15) continue;   // the jagged break
      const u = (x + 0.5 - (cx - half)) / (2 * half), wob = Math.sin(y * 0.33 + x * 0.7) * 0.8;
      const furrow = Math.floor(x - cx + 30 + wob) % 3 === 0 ? -1.2 : 0, crack = hash2(Math.floor(y / 4), x >> 2, s + 6) < 0.07 && y % 4 === 0 ? -0.9 : 0;
      P.put(x, y, RK.casca, 3.6 - u * 2.4 + furrow + crack + cg(x, y, s) * 0.5 + (y < 10 ? 0.5 : 0));
    }
  }
  // a cut branch on its side: the rings of the heartwood
  const kx = bx(28) - 3.4, ky = 28;
  for (let y = Math.floor(ky - 2.4); y <= ky + 2.4; y++) for (let x = Math.floor(kx - 2.1); x <= kx + 2.1; x++) {
    const dx = (x + 0.5 - kx) / 2.1, dy = (y + 0.5 - ky) / 2.4, d = Math.sqrt(dx * dx + dy * dy); if (d > 1) continue;
    P.put(x, y, d > 0.8 ? RK.casca : RK.cerne, d > 0.8 ? 1.4 : 3.6 - Math.floor(d * 4) % 2 * 1.2 - dx * 0.6);
  }
  // the face, a knot of the bark: two hollows with crystal in them, a nose knot, a long split for a mouth
  const fx = bx(16);
  P.blob(fx + 3.4, 15.6, 2, 1.7, RK.boca, s + 7, -0.4); P.blob(fx + 6.6, 15.8, 1.8, 1.6, RK.boca, s + 8, -0.4);
  for (let x = fx + 1.6; x <= fx + 7.6; x++) P.put(x, 13.4 + (x > fx + 4.6 && x < fx + 5.6 ? 0.6 : 0), RK.casca, 4.8);   // the brow
  P.put(fx + 3.6, 15.6, RK.cris, 5); P.put(fx + 6.6, 15.8, RK.cris, 4.6); P.put(fx + 3.6, 16.6, RK.cris, 2.4); P.put(fx + 6.6, 16.8, RK.cris, 2.2);
  P.blob(fx + 5.4, 18.4, 1, 1, RK.casca, s + 9, 3.2);
  P.line(fx + 2.6, 21.4, fx + 7.2, arm === 1 ? 21.6 : 20.8, RK.boca, 0.5); P.line(fx + 3, 22.4, fx + 6.6, 22, RK.casca, 4.2);
  TR_EYE[arm * 6 + legs] = [Math.floor(fx + 3.6) + 1, 16];
  // the near branch: the arm, with crystal leaves on its twigs
  const A = [
    [[[fx + 4, 25], [fx + 9, 29], [fx + 12, 34], [fx + 13, 38]], [[fx + 9, 29], [fx + 13, 27]], [fx + 13.4, 38.6], [fx + 13.8, 26.4]],
    [[[fx + 4, 24], [fx + 10, 17], [fx + 11, 9], [fx + 9, 4]], [[fx + 10.6, 13], [fx + 14, 10]], [fx + 9, 4.2], [fx + 14.6, 9.4]],
    [[[fx + 4, 25], [fx + 11, 26], [fx + 18, 28], [fx + 22, 29]], [[fx + 11, 26], [fx + 14, 22]], [fx + 21.6, 29.6], [fx + 14.4, 21.4]]
  ][arm];
  limb(P, A[0], 1.9, RK.casca, 1.9, s + 20); limb(P, A[1], 0.9, RK.casca, 2.1, s + 21);
  leaves(P, A[2][0], A[2][1], s + 22, 7, arm === 1 ? 0.4 : 0); leaves(P, A[3][0], A[3][1], s + 23, 5);
  return set(P.done());
}

/* the urchin, 20 x 13 facing right (ground row 12): 0-1 walking, 2-3 bald (walking). The spines are separate
   sprites (SPINE[k] dim, SPINE_LIT[k] lit), k = 0 up, then clockwise every 45 degrees */
const UR_C = [9.5, 7.2], UR_R = [5.2, 3.6], UR_EYE = [16, 8];
const urRoot = (k, mir) => { const a = -Math.PI / 2 + k * Math.PI / 4, x = UR_C[0] + Math.cos(a) * UR_R[0], y = UR_C[1] + Math.sin(a) * UR_R[1]; return [mir ? 19 - x : x, y]; };
function urchin(pose) {
  const P = cp(20, 13), s = 14301 + pose * 7, bald = pose >= 2, st = pose % 2 ? 1 : -1;
  // stubby stone feet
  for (const [x, k] of [[5, 0], [13, 1]]) { const o = (k ? st : -st) * 0.7; P.put(x + o, 11, RK.gran, k ? 2.4 : 1.4); P.put(x + o + 1, 11, RK.gran, k ? 2 : 1.2); P.put(x + o, 12, RK.gran, k ? 1.8 : 1); P.put(x + o + 1, 12, RK.gran, 1.4); }
  // the body: a dome of granite (bald: the pale bare stone, the sockets open)
  for (let y = 2; y <= 10; y++) for (let x = 2; x <= 17; x++) {
    const dx = (x + 0.5 - 9.5) / 6.8, dy = (y + 0.5 - 7.6) / 4.9, d = dx * dx + dy * dy; if (d > 1) continue;
    let v = 2.4 + 1.3 - (dx * 0.8 + dy) * 1.3 - d * 0.6 + cg(x, y, s) * 0.5 + (y === 10 ? -1 : 0);
    if (bald) v += 0.4 + (hash2(x, y, s + 1) < 0.15 ? -0.8 : 0);
    else if (hash2(x, y, s + 2) < 0.12) v -= 0.9;
    P.put(x, y, bald ? RK.cerne : RK.gran, v);
  }
  // the sockets the spines sit in
  for (let k = 0; k < 8; k++) { if (k === 4) continue; const [x, y] = urRoot(k, false); P.put(x, y, RK.boca, bald ? 0.4 : 1.2); if (bald) P.put(x + 0.6, y - 0.6, RK.cerne, 4.6); }
  // the snout, a nose, a crystal eye
  P.blob(15.8, 8.8, 2.4, 1.7, bald ? RK.cerne : RK.gran, s + 3, 2.6); P.put(18.2, 8.6, RK.boca, 0.6);
  P.put(UR_EYE[0] - 1, UR_EYE[1] - 1, RK.boca, 0.4); P.put(UR_EYE[0] - 1, UR_EYE[1] - 1, RK.cris, bald ? 3 : 4.6);
  return set(P.done());
}
function spine(k, lit) {
  const P = cp(11, 11), a = -Math.PI / 2 + k * Math.PI / 4, ux = Math.cos(a), uy = Math.sin(a);
  for (let i = 0; i <= 12; i++) { const t = i / 12, d = -3 + t * 6; P.put(5.5 + ux * d, 5.5 + uy * d, RK.cris, (lit ? 3 : 1.4) + t * 2); if (t < 0.5) P.put(5.5 + ux * d - uy * 0.8, 5.5 + uy * d + ux * 0.8, RK.cris, (lit ? 2.4 : 0.8) + t); }
  return set(P.done());
}
/* the serpent: the head, 14 x 10 facing right (0 shut, 1 jaws open); a coil of its root body, 8 x 8 (two shades);
   the hole, 14 x 14 (a dark hollow ringed with a lip of bark) */
function snakeHead(open) {
  const P = cp(14, 10), s = 14401 + open * 7;
  P.blob(5.6, 4.8, 5.4, 3.4, RK.raiz, s, 2.4, (x, y, dx, dy) => (x % 2 === 0 && dy < 0 ? -0.7 : 0));
  P.blob(10.4, open ? 3.8 : 4.6, 3, 2.2, RK.raiz, s + 1, 2.8);
  for (let x = 2; x <= 10; x += 2) P.put(x, 2.2 + Math.abs(x - 6) * 0.15, RK.casca, 4.6);   // bark ridges along the crown
  P.put(8.2, 2.8, RK.boca, 0.4); P.put(10.2, 3, RK.boca, 0.4); P.put(8.4, 2.6, RK.cris, 5); P.put(10.4, 2.8, RK.cris, 4.6);   // crystal eyes
  if (open) {
    for (let x = 6; x <= 13; x++) { const t = (x - 6) / 7; for (let y = Math.floor(5 + t * 0.2); y <= 5 + t * 3; y++) P.put(x, y, RK.boca, 0.6 + (y > 6 + t * 2 ? 0.8 : 0)); }
    limb(P, [[5, 6.4], [9, 8], [12.6, 9.2]], 0.8, RK.raiz, 1.6, s + 2);                                              // the jaw dropped
    for (const [x, y] of [[9, 5.4], [11, 5], [12.6, 4.6], [10, 7.4], [12, 8.2]]) P.put(x, y, RK.cerne, 5);              // stone fangs
  } else { P.line(6, 5.8, 13, 5.2, RK.boca, 0.6); P.put(12.4, 6, RK.cerne, 4.6); }
  return set(P.done());
}
function snakeSeg(k) {
  const P = cp(8, 8), s = 14411 + k;
  P.blob(4, 4, 3.4, 3.4, RK.raiz, s, k ? 1.8 : 2.3, (x, y, dx, dy) => (Math.abs(dx - dy * 0.3) < 0.18 ? -1.1 : 0));
  return set(P.done());
}
function hole() {
  const P = cp(14, 14), s = 14421;
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
    const dx = (x + 0.5 - 7) / 6.4, dy = (y + 0.5 - 7) / 6.6, d = Math.sqrt(dx * dx + dy * dy); if (d > 1) continue;
    if (d > 0.66) P.put(x, y, RK.casca, 2.6 - (dx + dy) * 1.6 + cg(x, y, s) * 0.6 + (hash2(x, y, s) < 0.15 ? -0.8 : 0));   // the lip of bark
    else P.put(x, y, RK.boca, 1.4 - d * 1.6 + (dx + dy) * 0.6);                                                             // the hollow
  }
  for (const [x, y] of [[4, 10], [9, 11], [6, 12]]) P.put(x, y, RK.raiz, 3);   // root fibres hanging over the lip
  return set(P.done());
}

/* the prism, 16 x 24: a long crystal (two points) with a belt of green stone wrapped in root, and an eye in the
   belt. 0-1 floating (the glint moves), 2 charging (lit from inside). PR_EYE: the eye */
const PR_EYE = [11, 12];
function prism(pose) {
  const P = cp(16, 24), s = 14501 + pose * 5, ch = pose === 2;
  const hw = y => y < 6 ? (y + 0.8) / 6.8 * 6.5 : y < 16 ? 6.5 : Math.max(0.3, (23.6 - y) / 7.6 * 6.5);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
    const h = hw(y), u = (x + 0.5 - 8) / h; if (Math.abs(u) > 1) continue;
    const f = u < -0.38 ? 0 : u < 0.28 ? 1 : 2, edge = Math.abs(u + 0.38) < 0.12 || Math.abs(u - 0.28) < 0.1;
    let v = [4.1, 3.1, 1.7][f] + (y < 6 ? 0.6 : y > 16 ? -0.6 : 0) + cg(x, y, s) * 0.35 + (edge ? (f === 1 ? 0.9 : 0.6) : 0) + (ch ? 0.9 : 0);
    if (hash2(x, y, 14509) < 0.05) v += 1;
    P.put(x, y, RK.cris, v);
  }
  // the glint running down the lit facet
  const gy = pose === 1 ? 13 : 4; for (let i = 0; i < 4; i++) P.put(4.6 - i * 0.2, gy + i, RK.cris, 5);
  if (ch) for (let y = 4; y < 20; y++) P.put(8 + Math.sin(y * 0.9) * 0.6, y, RK.cris, 5);   // the light gathering inside
  // the stone belt, wrapped in root, and the eye in it
  for (let y = 10; y <= 13; y++) for (let x = 0; x < 16; x++) {
    const u = (x + 0.5 - 8) / 7.2; if (Math.abs(u) > 1) continue;
    const wrap = (x + y * 2) % 5 === 0;
    P.put(x, y, wrap ? RK.raiz : RK.gran, (wrap ? 3.6 : 3) - u * 1.5 - (y - 10) * 0.35 + cg(x, y, s + 1) * 0.5);
  }
  P.blob(PR_EYE[0] - 1, PR_EYE[1] - 0.5, 1.6, 1.4, RK.boca, s + 2, 0.2); P.put(PR_EYE[0] - 1, PR_EYE[1] - 1, RK.cris, ch ? 5 : 4.2);
  return set(P.done());
}
// a crystal leaf falling from the ceiling, 7 x 5
function leafImg() {
  const P = cp(7, 5), s = 14521;
  for (let x = 0; x < 7; x++) { const h = Math.sin((x + 0.5) / 7 * Math.PI) * 2.2; for (let y = Math.floor(2.5 - h); y <= 2.5 + h * 0.8; y++) P.put(x, y, RK.cris, 3.6 - (y - 2) * 0.6 + (x === 3 ? 0.8 : 0) + cg(x, y, s) * 0.4); }
  P.put(0, 3, RK.gran, 2.4);
  return set(P.done());
}
const GL = { eye: glow(4, '#8ad8cc'), prism: glow(16, '#2f7e8a'), core: glow(8, '#8ad8cc'), beam: glow(7, '#4fb0b0'), spine: glow(5, '#4fb0b0'), leaf: glow(6, '#4fb0b0'), sap: glow(4, '#9aa83a') };
FPB2.get = () => FPB2.ready || (FPB2.ready = {
  seed: [0, 1, 2].map(seed),
  trunk: [0, 1, 2].map(a => [0, 1, 2, 3, 4, 5].map(l => trunk(a, l))),
  urchin: [0, 1, 2, 3].map(urchin),
  spine: [0, 1, 2, 3, 4, 5, 6, 7].map(k => spine(k, false)), spineLit: [0, 1, 2, 3, 4, 5, 6, 7].map(k => spine(k, true)),
  head: [snakeHead(0), snakeHead(1)], seg: [snakeSeg(0), snakeSeg(1)], hole: hole(),
  prism: [0, 1, 2].map(prism), leaf: leafImg()
});
Object.assign(FPB2, { RK, GL, SEED_EYE, TR_EYE, UR_EYE, PR_EYE, urRoot });
}

/* ================= helpers ================= */
const fpbDust = (x, y, vx, vy, col, life = 0.6, g = 300) => { if (parts.length < 700) parts.push({ x, y, vx, vy, g, life, max: life, col, size: 1 }); };
const fpbHits = (x, y, r, b) => { const nx = clamp(x, b.x, b.x + b.w), ny = clamp(y, b.y, b.y + b.h); return (nx - x) ** 2 + (ny - y) ** 2 <= r * r; };
function fpbWand(e, dt, lo = 2, hi = 3) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.35 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = lo + Math.random() * hi; } }
// where the eye pixel of e lands on screen this frame (drawn again over the dark in drawTop); d: a second eye d px
// further along the facing
function fpbEye(e, x0, y0, img, px, py, d = 0) { e.eyX = x0 + (e.facing > 0 ? px : img.width - 1 - px); e.eyY = y0 + py; e.eyD = d * e.facing; e.eyT = gameTime; }
const fpbNear = e => Math.hypot(e.x + e.w / 2 - pl.x - pl.w / 2, e.y + e.h / 2 - pl.y - pl.h / 2) < 240;

/* ================= the hopping seeds ================= */
// the leader brings its swarm with it on its first step; the swarm (sw) is shared: its members, its beat
function fpbSwarmInit(e) {
  e.fpInit = true; if (e.fpFollower) return;
  const sw = { m: [e], beat: 0.4, phase: 'idle', t: 0, cd: 1, dir: 0, dirT: 0 };
  e.fpSw = sw;
  const D = ET.sementes;
  for (let i = 1; i <= 5; i++) {
    let px = e.x + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 8, py = e.y;
    if (rectSolid(px, py, D.w, D.h) || !solidAt(Math.floor((px + D.w / 2) / T), Math.floor((py + D.h + 2) / T))) { px = e.x; py = e.y; }
    const f = spawnEnemy('sementes', px, py, zoneAt(Math.floor(px / T), Math.floor(py / T)));
    if (!f) continue;
    Object.assign(f, { fpFollower: true, fpInit: true, fpSw: sw, facing: e.facing, lvl: e.lvl, hp: e.hp, maxHp: e.maxHp, dmg: e.dmg, xp: e.xp, gold: e.gold });
    sw.m.push(f);
  }
}
const fpbLead = sw => { for (const o of sw.m) if (!o.dead) return o; return null; };
// the swarm hops on one beat: every seed on the ground jumps the same frame
function fpbSwarmHop(sw, dir, aggro) {
  let cx = 0, n = 0; for (const o of sw.m) if (!o.dead) { cx += o.x; n++; } cx /= n || 1;
  let any = false, i = 0;
  for (const o of sw.m) {
    if (o.dead) continue;
    const slot = cx + (i++ - (n - 1) / 2) * 7;   // each its own place in the swarm, a seed apart
    if (!o.onGround || o.stun > 0 || o.state !== 'walk') continue;
    const pull = clamp((slot - o.x) * 1.6, -45, 45);   // keeps the swarm together
    o.vx = dir * (aggro ? 70 : 34) + pull + rnd(-6, 6); o.vy = aggro ? -165 : -120; o.onGround = false; any = true;
    if (o.hitWall) o.vy = -250;
    if (dir) o.facing = dir;
  }
  return any;
}
AI.sementes = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (!e.fpInit) fpbSwarmInit(e);
  const sw = e.fpSw || (e.fpSw = { m: [e], beat: 0.4, phase: 'idle', t: 0, cd: 1, dir: 0, dirT: 0 });
  const ecx = e.x + e.w / 2;
  if (fpbLead(sw) === e) {   // the one in front keeps the beat for all of them
    e.fpFollower = false;
    sw.cd -= dt; sw.beat -= dt; sw.t -= dt;
    let sAggro = aggro, sees = e.sees;
    for (const o of sw.m) if (!o.dead && o !== e) { if (o.memT > 0 && !pl.dead && Math.hypot(o.x - pl.x, o.y - pl.y) < 240) sAggro = true; if (o.sees) sees = true; }
    if (sw.phase === 'rattle') {
      if (sw.t <= 0) {   // the hop that comes down on the hero, all together
        const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h - 4;
        let i = 0;
        for (const o of sw.m) {
          if (o.dead || o.state !== 'rattle') continue;
          if (!o.onGround) { o.state = 'walk'; continue; }
          const ox = o.x + o.w / 2, tx = pcx + pl.vx * 0.15 + (i++ - 2.5) * 3 - ox, ty = pcy - (o.y + o.h / 2), t = clamp(Math.abs(tx) / 150, 0.32, 0.6);
          o.vx = clamp(tx / t, -200, 200); o.vy = clamp((ty - 0.5 * GRAV * t * t) / t, -380, -130); o.onGround = false;
          o.state = 'pounce'; o.stateT = 1.2; o.swingHit = false; o.facing = Math.sign(tx) || o.facing;
        }
        sw.phase = 'air'; sw.t = 1.2;
        if (fpbNear(e)) sfx.fpbPounce();
      }
    } else if (sw.phase === 'air') {
      let up = false; for (const o of sw.m) if (!o.dead && o.state === 'pounce') up = true;
      if (!up || sw.t <= 0) { sw.phase = 'idle'; sw.cd = 2 + Math.random() * 1.2; sw.beat = 0.5; }
    } else {
      if (sAggro && sw.cd <= 0 && sees && dist < 92 && dy > -60 && dy < 30) {
        let ground = 0, n = 0; for (const o of sw.m) if (!o.dead) { n++; if (o.onGround) ground++; }
        if (ground >= n * 0.6) {   // the swarm crouches and rattles as one
          sw.phase = 'rattle'; sw.t = 0.6;
          for (const o of sw.m) if (!o.dead && o.state === 'walk') { o.state = 'rattle'; o.vx = 0; o.facing = Math.sign(pl.x - o.x) || o.facing; }
          if (fpbNear(e)) sfx.fpbRattle(n);
          return;
        }
      }
      if (sw.beat <= 0) {
        let dir;
        if (sAggro) {
          if (sees || Math.abs(dy) < 20) dir = Math.abs(dx) > 10 ? Math.sign(dx) : 0;
          else { const nv = navFind(e); dir = nv ? nv.dir : Math.sign(dx); }
        } else { sw.dirT--; if (sw.dirT <= 0) { sw.dir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); sw.dirT = 3 + Math.floor(Math.random() * 3); } dir = sw.dir; }
        if (!sAggro && dir && ledgeAhead(e, dir, 0, false) === 'stop') { sw.dir = -dir; dir = 0; }
        sw.beat = sAggro ? 0.62 : 1.05;
        if (fpbSwarmHop(sw, dir, sAggro) && dist < 220) sfx.fpbHop();
      }
    }
  }
  // each seed: its own landing
  if (e.state === 'pounce') {
    if (!e.swingHit && !pl.dead && !e.onGround && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.onGround && e.stateT < 1.1) { e.state = 'walk'; e.vx = 0; burst(ecx, e.y + e.h, 3, '#3e5044', 30, 300, 0.3); }
    return;
  }
  if (e.state === 'rattle') { e.vx = 0; if (sw.phase !== 'rattle') e.state = 'walk'; return; }
  if (e.onGround) e.vx = approach(e.vx, 0, 900 * dt);
};

/* ================= the walking trunk ================= */
const FPB_PLANT_HEAL = 0.025;   // share of its life a planted trunk heals each second
AI.troncovelho = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.plantCD = (e.plantCD || 0) - dt; e.touchCD = (e.touchCD || 0) - dt;
  const ecx = e.x + e.w / 2, st = e.state;
  if (e.planted) {   // healing, and the roots hurt to touch
    if (e.hp < e.maxHp) { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * FPB_PLANT_HEAL * dt); if (Math.random() < dt * 5) fpbDust(e.x + rnd(0, e.w), e.y + e.h - rnd(0, 6), rnd(-3, 3), rnd(-22, -10), Math.random() < 0.5 ? '#c4cc6a' : '#9aa83a', 0.8, -10); }
    if (e.touchCD <= 0 && !pl.dead && overlap({ x: e.x - 12, y: e.y + 4, w: e.w + 24, h: e.h - 4 }, pl)) { e.touchCD = 0.9; hurtPlayer(Math.round(e.dmg * 0.5), ecx, e, false); }
  }
  e.vx = e.planted ? 0 : e.vx;
  if (st === 'rooting') {   // the roots dig into the floor
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 14) fpbDust(ecx + rnd(-16, 16), e.y + e.h - 1, rnd(-20, 20), rnd(-40, -10), '#4c3e2e', 0.5);
    if (e.stateT <= 0) { e.planted = true; e.state = 'planted'; e.plantT = 6 + Math.random() * 2; e.farT = 0; e.atkCD = Math.min(e.atkCD, 0.8); shake(1.5); sfx.fpbRoot(); }
    return;
  }
  if (st === 'uproot') {   // pulling them out again, a full second, creaking
    if (Math.random() < dt * 12) fpbDust(ecx + rnd(-16, 16), e.y + e.h - 1, rnd(-20, 20), rnd(-50, -10), '#4c3e2e', 0.5);
    if (e.stateT <= 0) { e.planted = false; e.state = 'walk'; e.plantCD = 6 + Math.random() * 3; }
    return;
  }
  if (st === 'creak') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'sweep'; e.stateT = 0.28; e.swingHit = false; sfx.fpbSweep(); } return; }
  if (st === 'sweep') {   // a wide sweep of the branch, from behind its shoulder to far in front
    if (!e.swingHit && e.stateT < 0.2) {
      e.swingHit = true;
      const hb = { x: e.facing > 0 ? ecx - 8 : ecx - 40, y: e.y - 6, w: 48, h: e.h + 4 };
      if (!pl.dead && overlap(hb, pl)) { hurtPlayer(e.dmg, ecx, e, false); shake(2); }
      for (let i = 0; i < 6; i++) fpbDust(ecx + e.facing * rnd(10, 38), e.y + rnd(4, 24), e.facing * rnd(20, 60), rnd(-20, 10), '#4fb0b0', 0.4, 120);
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (st === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = e.planted ? 'planted' : 'walk'; e.atkCD = 1.4 + Math.random() * 0.8; } return; }
  if (st === 'lift') { if (e.stateT <= 0) { e.state = 'stomp'; e.stateT = 0.45; fpbStomp(e); } return; }
  if (st === 'stomp') { if (e.stateT <= 0) { e.state = 'planted'; e.atkCD = 2.2 + Math.random() * 1; } return; }
  const close = aggro && Math.abs(dx) < 40 && Math.abs(dy) < 32 && clearPath(e, pl);
  if (st === 'planted') {
    e.plantT -= dt; e.farT = dist > 200 || pl.dead ? e.farT + dt : 0;
    e.facing = aggro ? Math.sign(dx) || e.facing : e.facing;
    if (e.plantT <= 0 || e.farT > 1.5) { e.state = 'uproot'; e.stateT = 1; sfx.fpbCreak(0.8); return; }
    if (aggro && e.atkCD <= 0) {
      if (close) { e.state = 'creak'; e.stateT = 0.7; sfx.fpbCreak(1); }
      else if (dist < 170 && Math.abs(dy) < 90) { e.state = 'lift'; e.stateT = 0.6; sfx.fpbCreak(0.6); }
    }
    return;
  }
  // walking, slowly, on its roots
  if (!aggro) { fpbWand(e, dt, 3, 4); walk(e, dt, e.wander, 9, 200, 220, dy, false); if (e.wander) e.facing = e.wander; }
  else walk(e, dt, Math.abs(dx) > 20 ? Math.sign(dx) : 0, 14 + e.lvl * 0.3, 240, 240, dy, true);
  if (Math.abs(e.vx) > 2) {
    e.facing = Math.sign(e.vx); e.stepT = (e.stepT || 0) - dt;
    if (e.stepT <= 0) { e.stepT = 0.7; if (dist < 200) sfx.fpbStep(); fpbDust(ecx + rnd(-8, 8), e.y + e.h - 1, rnd(-10, 10), rnd(-20, -6), '#4c3e2e', 0.4); }
  }
  if (aggro && e.onGround && e.atkCD <= 0 && close) { e.state = 'creak'; e.stateT = 0.7; e.facing = Math.sign(dx) || e.facing; sfx.fpbCreak(1); return; }
  if (aggro && e.onGround && e.plantCD <= 0 && dist > 46 && dist < 170 && e.sees) { e.state = 'rooting'; e.stateT = 0.6; e.facing = Math.sign(dx) || e.facing; sfx.fpbRoot(); }
};
// the stomp: the floor shakes, and crystal leaves let go of the ceiling over the hero (their shadows first)
const fpbLeaves = [];
function fpbStomp(e) {
  const ecx = e.x + e.w / 2;
  shake(3); sfx.fpbStomp(); burst(ecx + e.facing * 14, e.y + e.h - 2, 12, '#4c3e2e', 80, 350, 0.5);
  const pcx = pl.x + pl.w / 2, OFF = [0, -24 + rnd(-4, 4), 24 + rnd(-4, 4), rnd(-56, 56)];
  OFF.forEach((o, i) => {
    const x = pcx + o + (i ? 0 : clamp(pl.vx, -80, 80) * 0.3), tx = Math.floor(x / T);
    let ty = Math.floor((pl.y + pl.h / 2) / T), k = 0;
    while (k < 10 && !solidAt(tx, ty)) { ty++; k++; }
    if (!solidAt(tx, ty) || solidAt(tx, ty - 1)) return;
    const floorY = ty * T; let cy = ty - 1, n = 0;
    while (n < 16 && !solidAt(tx, cy)) { cy--; n++; }
    fpbLeaves.push({ x, y: (cy + 1) * T + 2, fy: floorY, t: -i * 0.14, sh: 0.9, vy: 0, rot: Math.random() * 6, spin: rnd(-6, 6), dmg: Math.round(e.dmg * 0.6), hit: false });
  });
}

/* ================= the crystal urchin ================= */
const fpbSpines = [];
const FPB_SPINE_T = 0.15;   // time between two spines lighting up
AI.ourico = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.turnT = (e.turnT || 0) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'charge') {   // the spines light one by one, round it
    e.vx = approach(e.vx, 0, 600 * dt);
    const n = Math.min(8, Math.floor((0.0001 + 8 * FPB_SPINE_T - Math.max(0, e.stateT)) / FPB_SPINE_T) + 1);
    if (n > e.lit) { e.lit = n; if (dist < 220) sfx.fpbTick(n); }
    if (e.stateT <= 0) { fpbVolley(e); e.state = 'bald'; e.stateT = 3; e.lit = 0; }
    return;
  }
  const bald = e.state === 'bald';
  if (bald && e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random(); burst(ecx, e.y + 3, 6, "#4fb0b0", 30, 100, 0.4); sfx.fpbRegrow(); }
  // walking: slowly; when hit, it turns round and goes the other way a while
  let dir, chase = aggro;
  if (e.turnT > 0) { dir = e.turnDir; chase = false; }
  else if (aggro) dir = Math.abs(dx) > 14 ? Math.sign(dx) : 0;
  else { fpbWand(e, dt, 2, 3); dir = e.wander; }
  const d = walk(e, dt, dir, bald ? 9 : 13 + e.lvl * 0.2, 260, 230, dy, chase);
  if (d) e.facing = d;
  if (e.turnT > 0 && e.hitWall) e.turnDir = -e.turnDir;
  if (!bald && aggro && e.atkCD <= 0 && e.onGround && dist < 96 && e.sees) { e.state = 'charge'; e.stateT = 8 * FPB_SPINE_T; e.lit = 0; e.vx = 0; }
};
function fpbVolley(e) {
  const cx = e.x + e.w / 2, cy = e.y + 2;
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 4;
    fpbSpines.push({ x: cx + Math.cos(a) * 5, y: cy + Math.sin(a) * 3.5, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, k, dmg: e.dmg, life: 0.85 });
  }
  burst(cx, cy, 10, '#8ad8cc', 70, 150, 0.4, 1, false); sfx.fpbVolley();
}

/* ================= the root serpent ================= */
// the hole: a wall face with air in front of it (where the hero can stand near), else a floor, else a ceiling; if
// there is nothing round it, the hole is wherever it is (its own marker)
function fpbFindHole(e) {
  const cx = Math.floor((e.x + e.w / 2) / T), cy = Math.floor((e.y + e.h / 2) / T);
  let best = null, bs = 1e9;
  for (let dy = -5; dy <= 5; dy++) for (let dx = -7; dx <= 7; dx++) {
    const x = cx + dx, y = cy + dy; if (solidAt(x, y)) continue;
    for (const d of [-1, 1]) {   // d: the side the wall is on
      if (!solidAt(x + d, y) || (!solidAt(x + d, y - 1) && !solidAt(x + d, y + 1))) continue;
      if (solidAt(x - d, y) || solidAt(x - 2 * d, y)) continue;
      let f = 1; while (f <= 4 && !solidAt(x, y + f)) f++;
      const sc = Math.abs(dx) + Math.abs(dy) * 1.5 + (f > 4 ? 6 : f === 1 ? 2 : 0) + Math.random() * 0.5;
      if (sc < bs) { bs = sc; best = { x, y, ox: -d, oy: 0 }; }
    }
  }
  for (const oy of [-1, 1]) for (let dy = -4; dy <= 6 && !best; dy++) for (let dx = 0; dx <= 12 && !best; dx++) {   // a floor, else a ceiling
    const x = cx + (dx % 2 ? (dx + 1) / 2 : -dx / 2), y = cy + dy;
    if (!solidAt(x, y) && solidAt(x, y - oy) && !solidAt(x, y + oy) && !solidAt(x, y + 2 * oy)) best = { x, y, ox: 0, oy };
  }
  if (!best) best = { x: cx, y: cy, ox: e.facing || 1, oy: 0, free: true };
  const { x, y, ox, oy } = best;
  e.mx = best.free ? (x + 0.5) * T : ox > 0 ? x * T : ox < 0 ? (x + 1) * T : (x + 0.5) * T;
  e.my = best.free ? (y + 0.5) * T : oy < 0 ? (y + 1) * T : oy > 0 ? y * T : (y + 0.5) * T;
  e.ox = ox; e.oy = oy; e.sdx = ox; e.sdy = oy; e.len = 0; e.hole = true;
  e.facing = ox ? ox : e.facing;
}
function fpbSnakePlace(e) {   // the body box sits on the head: half a body out of the mouth, plus the stretch
  const L = e.len + 5;
  e.x = e.mx + e.sdx * L - e.w / 2; e.y = e.my + e.sdy * L - e.h / 2; e.vx = 0; e.vy = 0;
}
// how far it can stretch along (ux, uy) before its head would touch rock (up to 6 blocks)
function fpbReach(e, ux, uy) {
  let s = 0;
  for (; s <= 6 * T; s += 2) { const L = s + 5; if (rectSolid(e.mx + ux * L - e.w / 2, e.my + uy * L - e.h / 2, e.w, e.h)) break; }
  return Math.max(0, s - 2);
}
AI.serpraiz = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (!e.hole) fpbFindHole(e);
  const mdx = pl.x + pl.w / 2 - e.mx, mdy = pl.y + pl.h / 2 - e.my, md = Math.hypot(mdx, mdy) || 1;
  e.watch = aggro && md < 130;
  if (e.state === 'tell') {   // two eyes light up inside the hole, the bark creaks
    e.len = 0;
    if (e.stateT <= 0) { e.state = 'strike'; e.swingHit = false; e.reach = Math.min(fpbReach(e, e.sdx, e.sdy), e.aimD + 10); sfx.fpbSnap(); }
  } else if (e.state === 'strike') {   // straight out, fast
    e.len = Math.min(e.reach, e.len + 560 * dt);
    if (e.len >= e.reach) { e.state = 'hold'; e.stateT = 0.22; }
  } else if (e.state === 'hold') { if (e.stateT <= 0) { e.state = 'back'; e.stateT = 0.45; e.len0 = e.len; } }
  else if (e.state === 'back') {   // and back like a spring
    const k = clamp(1 - e.stateT / 0.45, 0, 1);
    e.len = Math.max(0, e.len0 * (1 - k) * (1 - k) + Math.sin(k * Math.PI * 3) * (1 - k) * 5);
    if (e.stateT <= 0) { e.state = 'hide'; e.len = 0; e.atkCD = 1.1 + Math.random() * 0.7; e.sdx = e.ox; e.sdy = e.oy; }
  } else {
    e.state = 'hide'; e.len = 0;
    const ux = mdx / md, uy = mdy / md, out = e.ox * ux + e.oy * uy;
    if (aggro && e.atkCD <= 0 && md < 6 * T + 14 && (out > 0.42 || (e.ox === 0 && e.oy === 0)) && losClear(e.mx + e.ox * 3, e.my + e.oy * 3, pl.x + pl.w / 2, pl.y + pl.h / 2)) {
      e.state = 'tell'; e.stateT = 0.5; e.sdx = ux; e.sdy = uy; e.aimD = md; sfx.fpbCreak(0.45);
    }
  }
  if (Math.abs(e.sdx) > 0.2) e.facing = Math.sign(e.sdx);
  fpbSnakePlace(e);
  if ((e.state === 'strike' || e.state === 'hold') && !e.swingHit && !pl.dead && overlap(e, pl)) {
    e.swingHit = true;
    const r = hurtPlayer(e.dmg, e.x + e.w / 2, null, false);
    if (r === 'parry') { e.state = 'hold'; e.stateT = 1.2; e.stun = 1.2; }   // knocked aside: the head hangs out, open to blows
  }
};

/* ================= the living prism ================= */
const FPB_Q = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
// a straight line from the prism through which the hero is (8 directions), when the hero is on one
function fpbAligned(e) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2, ddx = pl.x + pl.w / 2 - ex, ddy = pl.y + pl.h / 2 - ey, d = Math.hypot(ddx, ddy);
  if (d < 24) return -1;
  const k = ((Math.round(Math.atan2(ddy, ddx) / (Math.PI / 4)) % 8) + 8) % 8, [qx, qy] = FPB_Q[k], n = Math.hypot(qx, qy);
  return Math.abs(ddx * qy / n - ddy * qx / n) < 5 ? k : -1;
}
// the best spot in a straight line with the hero, near where it floats now
function fpbQueenSpot(e) {
  const hx = pl.x + pl.w / 2, hy = pl.y + pl.h / 2, ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  let best = null, bs = 1e9;
  for (let k = 0; k < 8; k++) {
    const [qx, qy] = FPB_Q[k], diag = qx && qy;
    for (let r = diag ? 3 : 4; r <= (diag ? 6 : 8); r++) {
      const sx = hx + qx * r * T, sy = hy + qy * r * T;
      if (rectSolid(sx - e.w / 2 - 2, sy - e.h / 2 - 2, e.w + 4, e.h + 4) || !losClear(sx, sy, hx, hy)) continue;
      const sc = Math.hypot(sx - ex, sy - ey) + (qy > 0 && !qx ? 30 : 0) + (k === e.banK ? 200 : 0);
      if (sc < bs) { bs = sc; best = { x: sx, y: sy, k }; }
    }
  }
  return best;
}
AI.prismavivo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.spotT = (e.spotT || 0) - dt;
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  if (e.state === 'aim') {   // still; the thin line of light shows where the beam will go
    const k = Math.pow(0.01, dt); e.vx *= k; e.vy *= k;
    if (e.stateT <= 0) { e.state = 'fire'; e.stateT = 0.32; e.swingHit = false; fpbBeamPath(ex, ey, e.bux, e.buy, e.path); sfx.fpbBeam(); }
    return;
  }
  if (e.state === 'fire') {
    e.vx = 0; e.vy = 0;
    if (!e.swingHit && e.stateT > 0.18) { fpbBeamPath(ex, ey, e.bux, e.buy, e.path); if (!pl.dead && fpbBeamHits(e.path, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ex, null, true); } }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random() * 0.8; e.spotT = 0; }
    return;
  }
  // floating: slowly, toward a spot in line with the hero
  let tx = ex, ty = ey, sp = 34;
  if (aggro) {
    if (e.spotT <= 0 || !e.spot) {
      e.spot = fpbQueenSpot(e); e.spotT = 0.5;
      if (e.spot) { if (e.spotK !== e.spot.k) { e.spotK = e.spot.k; e.stuckT = 0; } } else e.banK = -1;
    }
    if (e.spot) { tx = e.spot.x; ty = e.spot.y; }
    else { tx = ex - Math.sign(dx) * Math.max(0, 70 - Math.abs(dx)); ty = pl.y - 20; }
    e.facing = Math.sign(dx) || e.facing;
  } else {
    fpbWand(e, dt, 2, 3); e.hov = (e.hov || 0) + dt;
    tx = ex + e.wander * 30; ty = ey + Math.sin(e.hov * 0.7 + e.seed) * 14; sp = 14;
    if (e.wander) e.facing = e.wander;
  }
  const ddx = tx - ex, ddy = ty - ey, dd = Math.hypot(ddx, ddy);
  const v = Math.min(sp, dd * 2.5), tvx = dd > 0.5 ? ddx / dd * v : 0, tvy = dd > 0.5 ? ddy / dd * v : 0;
  e.vx = approach(e.vx, tvx, 110 * dt); e.vy = approach(e.vy, tvy, 110 * dt);
  e.vy += Math.sin(e.t * 2.1 + e.seed) * 3 * dt;
  if (aggro && e.spot) {
    if (e.hitWall || e.hitCeil) e.stuckT = (e.stuckT || 0) + dt;
    if (e.stuckT > 1.5) { e.banK = e.spot.k; e.spot = null; e.stuckT = 0; }
  }
  // stops only when it is in a straight line with the hero
  const k = aggro && e.atkCD <= 0 ? fpbAligned(e) : -1;
  if (k >= 0 && dist < 130 && losClear(ex, ey, pl.x + pl.w / 2, pl.y + pl.h / 2)) {
    const [qx, qy] = FPB_Q[k], n = Math.hypot(qx, qy);
    e.state = 'aim'; e.stateT = 0.9; e.bux = qx / n; e.buy = qy / n; e.path = e.path || [];
    fpbBeamPath(ex, ey, e.bux, e.buy, e.path);
    if (qx) e.facing = qx;
    sfx.fpbBell();
  }
};
// the beam's path from (x, y) along (ux, uy): [x0, y0, (bounce x, y,) x1, y1]. Bounces once off crystal (foliage
// or geode); once that bounce is spent it goes on through crystal foliage; any other rock stops it
const FPB_BEAM_LEN = 16 * T;
function fpbBeamPath(x, y, ux, uy, out) {
  out.length = 0; out.push(x, y);
  let px = x, py = y, ptx = Math.floor(x / T), pty = Math.floor(y / T), len = 0, bounce = 1, guard = 0;
  while (len < FPB_BEAM_LEN && guard++ < 600) {
    const nx = px + ux * 1.5, ny = py + uy * 1.5, tx = Math.floor(nx / T), ty = Math.floor(ny / T);
    if ((tx !== ptx || ty !== pty) && solidAt(tx, ty)) {
      const t = tileAt(tx, ty);
      if ((t === FP_FOLHA || t === FP_O_CRISTAL) && bounce > 0) {
        bounce--;
        let fx = tx !== ptx, fy = ty !== pty;
        if (fx && fy) { const a = solidAt(tx, pty), b = solidAt(ptx, ty); if (a && !b) fy = false; else if (b && !a) fx = false; }
        if (fx) ux = -ux; if (fy) uy = -uy;
        out.push(px, py);
        continue;
      }
      if (!(t === FP_FOLHA && bounce === 0)) break;
    }
    px = nx; py = ny; ptx = tx; pty = ty; len += 1.5;
  }
  out.push(px, py);
  return out;
}
function fpbBeamHits(P, b) {
  const r = { x: b.x - 1.5, y: b.y - 1.5, w: b.w + 3, h: b.h + 3 };
  for (let i = 0; i + 3 < P.length; i += 2) {
    const x0 = P[i], y0 = P[i + 1], x1 = P[i + 2], y1 = P[i + 3], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let j = 0; j <= n; j++) { const x = x0 + (x1 - x0) * j / n, y = y0 + (y1 - y0) * j / n; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true; }
  }
  return false;
}

/* ================= drawing ================= */
DRAW_E.sementes = (e, fx, fy, fl) => {
  const B = FPB2.get().seed, k = e.state === 'rattle' ? 2 : !e.onGround ? 1 : 0;
  const j = e.state === 'rattle' ? (Math.sin(e.t * 70 + e.seed * 3) > 0 ? 1 : 0) : 0, img = cvPick(B[k], e, fl);
  const x0 = fx - 6 + j, y0 = fy - 11;
  lc.drawImage(img, x0, y0);
  fpbEye(e, x0, y0, img, FPB2.SEED_EYE[k][0], FPB2.SEED_EYE[k][1]);
};
DRAW_E.troncovelho = (e, fx, fy, fl) => {
  const D = FPB2.get().trunk, st = e.state;
  const arm = st === 'creak' ? 1 : st === 'sweep' ? 2 : 0;
  const legs = st === 'rooting' || st === 'uproot' ? 3 : st === 'lift' ? 5 : e.planted ? 4 : Math.abs(e.vx) > 2 && e.onGround ? 1 + (Math.floor(e.t * 2.6) % 2) : 0;
  const j = st === 'creak' || st === 'uproot' || st === 'lift' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0, img = cvPick(D[arm][legs], e, fl);
  const x0 = fx - 23 + j, y0 = fy - 48 - (st === 'lift' ? 1 : 0);
  lc.drawImage(img, x0, y0);
  const E = FPB2.TR_EYE[arm * 6 + legs]; fpbEye(e, x0, y0, img, E[0], E[1], 3);
};
DRAW_E.ourico = (e, fx, fy, fl) => {
  const D = FPB2.get(), bald = e.state === 'bald';
  const k = (bald ? 2 : 0) + (Math.abs(e.vx) > 2 && e.onGround ? Math.floor(e.t * 5) % 2 : 0);
  const j = e.state === 'charge' && e.lit >= 7 ? Math.round(Math.sin(e.t * 60)) : 0, img = cvPick(D.urchin[k], e, fl), x0 = fx - 11 + j, y0 = fy - 14;
  e.ux0 = x0; e.uy0 = y0;
  if (!bald) for (let s = 0; s < 8; s++) if (s !== 4) fpbDrawSpine(e, s, x0, y0, fl);
  lc.drawImage(img, x0, y0);
  fpbEye(e, x0, y0, img, FPB2.UR_EYE[0], FPB2.UR_EYE[1]);
};
// spine s (sprite space: 0 up, clockwise) sits on its socket and points out
function fpbDrawSpine(e, s, x0, y0, fl, onlyLit) {
  const D = FPB2.get(), mir = e.facing < 0, [rx, ry] = FPB2.urRoot(s, mir), kw = mir ? (8 - s) % 8 : s, a = -Math.PI / 2 + kw * Math.PI / 4;
  const lit = e.state === 'charge' && s < e.lit;
  if (onlyLit && !lit) return;
  const img = fl ? D.spine[kw].wr : (lit ? D.spineLit[kw] : D.spine[kw]).r;
  lc.drawImage(img, Math.round(x0 + 1 + rx + Math.cos(a) * 3 - 6.5), Math.round(y0 + 1 + ry + Math.sin(a) * 2.6 - 6.5));
}
const fpbCam = (e, fx, fy) => [Math.round(e.x + e.w / 2) - fx, Math.round(e.y + e.h) - fy];
DRAW_E.serpraiz = (e, fx, fy, fl) => {
  if (!e.hole) return;
  const D = FPB2.get(), [cX, cY] = fpbCam(e, fx, fy), mx = Math.round(e.mx) - cX, my = Math.round(e.my) - cY;
  lc.drawImage(D.hole.r, mx - 8, my - 8);
  e.hsx = mx; e.hsy = my; e.eyT = gameTime;
  if (e.state === 'hide' || e.state === 'tell') return;   // inside: only its eyes (drawn over the dark)
  const L = e.len + 5, ux = e.sdx, uy = e.sdy, n = Math.floor(L / 4), wav = e.state === 'back' ? 2.4 : 0.6;
  for (let i = 0; i <= n; i++) {   // the root body, a spring of coils from the mouth out to the head
    const d = i * 4, w = Math.sin(i * 1.7 + e.t * (e.state === 'back' ? 30 : 6)) * wav * Math.min(1, i / 2);
    const img = D.seg[i % 2]; lc.drawImage(fl ? img.wr : img.r, Math.round(mx + ux * d - uy * w) - 5, Math.round(my + uy * d + ux * w) - 5);
  }
  const H = D.head[e.state === 'strike' || e.state === 'hold' ? 1 : 0], hx = Math.round(mx + ux * L), hy = Math.round(my + uy * L), a = Math.atan2(uy, ux);
  if (ux >= 0) cvRot(fl ? H.wr : H.r, hx, hy, a); else cvRot(fl ? H.wl : H.l, hx, hy, a - Math.PI);
};
DRAW_E.prismavivo = (e, fx, fy, fl) => {
  const D = FPB2.get().prism, st = e.state, k = st === 'aim' || st === 'fire' ? 2 : Math.floor(e.t * 1.5) % 2;
  const bob = Math.round(Math.sin(e.t * 2 + e.seed) * 1.5), img = cvPick(D[k], e, fl), x0 = fx - 9, y0 = fy - 8 - 13 + bob;
  const j = st === 'aim' && e.stateT < 0.3 ? Math.round(Math.sin(e.t * 80) * 0.6) : 0;
  lc.drawImage(img, x0 + j, y0);
  fpbEye(e, x0 + j, y0, img, FPB2.PR_EYE[0], FPB2.PR_EYE[1]);
};
for (const t of FPB2_TYPES) EYES_E[t] = (e, fx, fy) => {
  if (e.eyT !== gameTime) return;
  if (t === 'serpraiz') {
    const a = e.state === 'tell' ? 0.95 : e.state === 'hide' ? (e.watch ? 0.3 : 0) : 0.55; if (!a) return;
    lc.globalAlpha = a; lc.drawImage(FPB2.GL.eye, e.hsx - 4 + e.ox * 2 - 2, e.hsy - 5 + e.oy * 2); lc.drawImage(FPB2.GL.eye, e.hsx - 4 + e.ox * 2 + 2, e.hsy - 5 + e.oy * 2);
    return;
  }
  const hot = (t === 'sementes' && e.state === 'rattle') || (t === 'troncovelho' && (e.state === 'creak' || e.state === 'lift')) || (t === 'ourico' && e.state === 'charge') || (t === 'prismavivo' && e.state === 'aim');
  lc.globalAlpha = hot ? 0.9 : 0.4; lc.drawImage(FPB2.GL.eye, e.eyX - 4, e.eyY - 4);
  if (e.eyD) lc.drawImage(FPB2.GL.eye, e.eyX + e.eyD - 4, e.eyY - 4);
};
WARN_E.sementes = e => e.state === 'rattle' && !e.fpFollower;   // one mark for the swarm
WARN_E.troncovelho = e => e.state === 'creak' || e.state === 'lift' || e.state === 'rooting';
WARN_E.ourico = e => e.state === 'charge';
WARN_E.serpraiz = e => e.state === 'tell';
WARN_E.prismavivo = e => e.state === 'aim';

/* ---------- blows ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const st = e && e.state, heading = e ? Math.sign(e.turnT > 0 ? e.turnDir : e.vx) || e.facing : 0;
  if (e && !e.dead) {
    if (e.type === 'troncovelho' && e.planted) mult *= 0.5;          // rooted, it takes half
    else if (e.type === 'ourico' && st === 'bald') mult *= 1.5;      // bald, the soft stone shows
  }
  const r = _hit(e, dir, mult, melee);
  if (e && !e.dead) {
    if (e.type === 'troncovelho' && (e.planted || st === 'creak' || st === 'sweep' || st === 'rooting')) { e.vx = 0; e.vy = 0; e.stun = 0; }
    else if (e.type === 'ourico' && st !== 'charge') {   // it turns round and walks the other way a while
      e.turnDir = -heading; e.turnT = 1.4 + Math.random() * 0.6; e.facing = e.turnDir;
    } else if (e.type === 'serpraiz') { e.vx = 0; e.vy = 0; }
    else if (e.type === 'prismavivo' && st === 'aim') { e.state = 'walk'; e.atkCD = 1.2; e.spotT = 0; }   // a blow spoils the aim
  }
  return r;
}; }
{ const _ke = killEnemy; killEnemy = function (e) {
  const r = _ke(e);
  if (FPB2_TYPES.includes(e.type) && fpbNear(e)) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'prismavivo' || e.type === 'ourico') { burst(cx, cy, 14, '#8ad8cc', 100, 300, 0.6); sfx.fpbShatter(); }
    else if (e.type === 'troncovelho') { burst(cx, cy, 20, '#54463a', 100, 380, 0.8); sfx.fpbFall(); }
    else sfx.fpbCrack();
  }
  return r;
}; }

/* ---------- the spines, the leaves, the beams ---------- */
function fpb2Update(dt) {
  for (let i = fpbSpines.length - 1; i >= 0; i--) {
    const p = fpbSpines[i], nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; p.life -= dt;
    const hitPl = !pl.dead && fpbHits(nx, ny, 2, pl), hitW = solidAt(Math.floor(nx / T), Math.floor(ny / T));
    if (hitPl || hitW || p.life <= 0) {
      if (hitPl) hurtPlayer(p.dmg, nx, null, true);
      if (hitPl || hitW) { burst(nx, ny, 4, "#8ad8cc", 50, 200, 0.3); if (Math.hypot(nx - pl.x, ny - pl.y) < 200) sfx.fpbTink(); }
      fpbSpines.splice(i, 1); continue;
    }
    p.x = nx; p.y = ny;
  }
  for (let i = fpbLeaves.length - 1; i >= 0; i--) {
    const L = fpbLeaves[i]; L.t += dt;
    if (L.t < L.sh) { if (L.t > 0 && Math.random() < dt * 8) fpbDust(L.x + rnd(-3, 3), L.y + 1, 0, 20, '#4fb0b0', 0.4, 200); continue; }   // the leaf trembling on the ceiling, its shadow growing
    L.vy = Math.min(L.vy + 700 * dt, 420); L.y += L.vy * dt; L.rot += L.spin * dt;
    if (!L.hit && !pl.dead && fpbHits(L.x, L.y, 3, pl)) { L.hit = true; hurtPlayer(L.dmg, L.x, null, true); }
    if (L.y >= L.fy - 2) { burst(L.x, L.fy - 2, 8, "#8ad8cc", 70, 300, 0.4); if (Math.hypot(L.x - pl.x, L.fy - pl.y) < 220) sfx.fpbTink(); fpbLeaves.splice(i, 1); }
  }
}
HOOK.update.push(fpb2Update);
HOOK.drawWorld.push((cx, cy) => {
  const D = FPB2.get();
  for (const p of fpbSpines) lc.drawImage(D.spineLit[p.k].r, Math.round(p.x) - cx - 6, Math.round(p.y) - cy - 6);
  for (const L of fpbLeaves) if (L.t >= L.sh || L.t > 0) cvRot(D.leaf.r, Math.round(L.x) - cx, Math.round(L.y) - cy, L.t >= L.sh ? L.rot : Math.sin(gameTime * 30) * 0.2);
});
HOOK.drawGlow.push((cx, cy) => {
  const G = FPB2.GL;
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'prismavivo') {
      const x = Math.round(e.x + e.w / 2) - cx, y = Math.round(e.y + e.h / 2) - cy, aim = e.state === 'aim' ? 1 - e.stateT / 0.9 : 0;
      lc.globalAlpha = 0.28 + aim * 0.4 + Math.sin(gameTime * 2 + e.seed) * 0.05; lc.drawImage(G.prism, x - 16, y - 16);
      if (aim || e.state === 'fire') { lc.globalAlpha = 0.4 + aim * 0.5; lc.drawImage(G.core, x - 8, y - 8); }
      if (e.state === 'fire' && e.path) fpbPathDo(e.path, 7, (px, py) => { lc.globalAlpha = 0.45 * e.stateT / 0.32 + 0.1; lc.drawImage(G.beam, Math.round(px) - cx - 7, Math.round(py) - cy - 7); });
    } else if (e.type === 'ourico' && e.state === 'charge' && e.ux0 !== undefined) {
      lc.globalAlpha = 0.12 + e.lit * 0.05; lc.drawImage(G.prism, e.ux0 + 11 - 16, e.uy0 + 8 - 16);
    } else if (e.type === 'troncovelho' && e.planted && e.hp < e.maxHp) {
      lc.globalAlpha = 0.25; lc.drawImage(G.sap, Math.round(e.x + e.w / 2) - cx - 4, Math.round(e.y + e.h) - cy - 6);
    }
  }
  for (const p of fpbSpines) { lc.globalAlpha = 0.4 * Math.min(1, (0.85 - p.life) / 0.12); lc.drawImage(G.spine, Math.round(p.x) - cx - 5, Math.round(p.y) - cy - 5); }
  for (const L of fpbLeaves) if (L.t > 0) { lc.globalAlpha = 0.5; lc.drawImage(G.leaf, Math.round(L.x) - cx - 6, Math.round(L.y) - cy - 6); }
  lc.globalAlpha = 1;
});
// every n px along a beam path
function fpbPathDo(P, step, fn) {
  for (let i = 0; i + 3 < P.length; i += 2) {
    const x0 = P[i], y0 = P[i + 1], x1 = P[i + 2], y1 = P[i + 3], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let j = 0; j <= n; j++) fn(x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n, j / n, i);
  }
}
// over the dark: the eyes, lit spines, the leaves' shadows, the aim line and the beam
HOOK.drawTop.push((cx, cy) => {
  const D = FPB2.get();
  for (const e of enemies) {
    if (e.dead || e.eyT !== gameTime || !FPB2_TYPES.includes(e.type)) continue;
    if (e.type === 'serpraiz') {
      const a = e.state === 'tell' ? 1 : e.state === 'hide' ? (e.watch ? 0.55 : 0) : 0; if (!a) continue;
      const x = e.hsx + e.ox * 2, y = e.hsy - 1 + e.oy * 2, px = e.ox ? 0 : 2, py = e.ox ? 2 : 0;
      lc.globalAlpha = a; lc.fillStyle = e.state === 'tell' ? '#d4f4ec' : '#4fb0b0';
      lc.fillRect(x - px, y - py, 1, 1); lc.fillRect(x + px, y + py, 1, 1);
      continue;
    }
    const hot = (e.type === 'sementes' && e.state === 'rattle') || (e.type === 'troncovelho' && (e.state === 'creak' || e.state === 'lift')) || (e.type === 'ourico' && e.state === 'charge') || (e.type === 'prismavivo' && e.state === 'aim');
    lc.globalAlpha = 1; lc.fillStyle = hot ? '#d4f4ec' : '#8ad8cc';
    lc.fillRect(e.eyX, e.eyY, 1, 1); if (e.eyD) lc.fillRect(e.eyX + e.eyD, e.eyY, 1, 1);
    if (e.type === 'ourico' && e.state === 'charge') for (let s = 0; s < 8; s++) if (s !== 4) fpbDrawSpine(e, s, e.ux0, e.uy0, false, true);
  }
  for (const L of fpbLeaves) {   // the shadow on the floor where a leaf will land
    if (L.t <= 0) continue;
    const k = Math.min(1, L.t / L.sh), w = Math.round(2 + k * 5), x = Math.round(L.x) - cx, y = Math.round(L.fy) - cy;
    lc.globalAlpha = 0.18 + k * 0.3; lc.fillStyle = '#4fb0b0'; lc.fillRect(x - w - 3, y - 1, w * 2 + 7, 1); lc.fillRect(x - w - 2, y, w * 2 + 5, 1);   // the leaf's glow on the floor
    lc.globalAlpha = 0.55 + k * 0.4; lc.fillStyle = '#060a08'; lc.fillRect(x - w, y - 1, w * 2 + 1, 2); lc.fillRect(x - w + 1, y + 1, w * 2 - 1, 1);   // and its shadow in the middle
    lc.globalAlpha = 0.4 + k * 0.5; lc.fillStyle = '#8ad8cc'; lc.fillRect(x - w - 1, y - 1, 1, 1); lc.fillRect(x + w + 1, y - 1, 1, 1);
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'prismavivo' || !e.path) continue;
    if (e.state === 'aim') {   // a thin line of light along where the beam will go
      const k = 1 - e.stateT / 0.9;
      fpbPathDo(e.path, 1, (px, py, t, seg) => { if (((px + py) | 0) % 3 === Math.floor(gameTime * 20) % 3 && k < 0.6) return; lc.globalAlpha = (0.25 + k * 0.55) * (seg ? 0.7 : 1); lc.fillStyle = k > 0.7 ? '#d4f4ec' : '#8ad8cc'; lc.fillRect(Math.round(px) - cx, Math.round(py) - cy, 1, 1); });
    } else if (e.state === 'fire') {
      const a = Math.min(1, e.stateT / 0.32 + 0.2);
      fpbPathDo(e.path, 1, (px, py) => {
        const x = Math.round(px) - cx, y = Math.round(py) - cy;
        lc.globalAlpha = a * 0.8; lc.fillStyle = '#4fb0b0'; lc.fillRect(x - 1, y - 1, 3, 3);
        lc.globalAlpha = a; lc.fillStyle = '#d4f4ec'; lc.fillRect(x, y, 1, 1);
      });
      if (e.path.length > 4) { lc.globalAlpha = a; lc.fillStyle = '#d4f4ec'; const x = Math.round(e.path[2]) - cx, y = Math.round(e.path[3]) - cy; lc.fillRect(x - 2, y, 5, 1); lc.fillRect(x, y - 2, 1, 5); }   // the bounce flash
    }
  }
  lc.globalAlpha = 1;
});
// the crystal lights its surroundings: the prisms, an urchin's lit spines, a beam
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'prismavivo') { addL(e.x + e.w / 2, e.y + e.h / 2, e.state === 'aim' || e.state === 'fire' ? 0.45 : 0.25); if (e.state === 'fire' && e.path) for (let i = 2; i < e.path.length; i += 2) addL(e.path[i], e.path[i + 1], 0.35); }
    else if (e.type === 'ourico' && e.state === 'charge') addL(e.x + e.w / 2, e.y + 2, 0.08 + e.lit * 0.03);
  }
}; }
function clearFpbFx() { fpbSpines.length = 0; fpbLeaves.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearFpbFx(); return _nw(sd, sv); }; }

/* ---------- sounds: stone, bark and glass ---------- */
Object.assign(sfx, {
  // the swarm: one clack of six little stones landing together; the rattle, stones shaken in a gourd
  fpbHop() { noise(0.05, 0.03, 2600, 'bandpass', 0, 3); tone(820, 0.04, 'square', 0.008, -200); noise(0.05, 0.025, 1900, 'bandpass', 0.3, 3); },
  fpbRattle(n) { const v = 0.012 + Math.min(6, n) * 0.003; for (let k = 0; k < 9; k++) noise(0.04, v, 2200 + (k % 3) * 500, 'bandpass', k * 0.065, 4); },
  fpbPounce() { noise(0.12, 0.03, 1400, 'bandpass', 0, 1.5); },
  // bark creaking: a slow saw of low wood, the grain catching (k: how long)
  fpbCreak(k = 1) { const n = Math.max(2, Math.round(5 * k)); for (let i = 0; i < n; i++) { tone(150 + i * 12 + Math.random() * 20, 0.16, 'sawtooth', 0.012, 40, i * 0.12); noise(0.12, 0.02, 700 + Math.random() * 300, 'bandpass', i * 0.12, 5); } },
  fpbSweep() { noise(0.3, 0.06, 500, 'bandpass', 0, 1.2); noise(0.22, 0.02, 3000, 'highpass', 0.04); },
  fpbStep() { tone(70, 0.12, 'sine', 0.025, -15); noise(0.1, 0.015, 400, 'lowpass'); },
  fpbRoot() { noise(0.6, 0.05, 260, 'lowpass', 0, 1); noise(0.4, 0.015, 1500, 'bandpass', 0.1, 4); tone(55, 0.5, 'sine', 0.03, -10); },
  fpbStomp() { tone(48, 0.4, 'sine', 0.09, -16); noise(0.4, 0.08, 220, 'lowpass'); tone(2100, 0.3, 'triangle', 0.008, 300, 0.12); },
  // glass: a tick that climbs as each spine lights, the volley, a shard landing
  fpbTick(n) { tone(900 + n * 150, 0.08, 'triangle', 0.018, 40); tone(1800 + n * 300, 0.05, 'sine', 0.006); },
  fpbVolley() { for (let k = 0; k < 4; k++) tone(2200 + k * 400, 0.12, 'triangle', 0.012, -400, k * 0.015); noise(0.18, 0.05, 4200, 'highpass'); },
  fpbTink() { tone(2600 + Math.random() * 1200, 0.1, 'triangle', 0.01, -300); noise(0.06, 0.02, 5000, 'highpass'); },
  fpbRegrow() { tone(1300, 0.25, 'sine', 0.008, 600); },
  // the serpent: the snap of its strike
  fpbSnap() { noise(0.08, 0.06, 1100, 'bandpass', 0, 2); tone(260, 0.07, 'square', 0.02, -140); noise(0.2, 0.02, 500, 'bandpass', 0.05, 3); },
  // the prism: a thin glass bell rising for the 0.9 s of the aim, then the beam
  fpbBell() { tone(740, 0.9, 'sine', 0.016, 740); tone(1110, 0.85, 'sine', 0.008, 1110, 0.03); tone(2220, 0.6, 'triangle', 0.004, 1400, 0.25); },
  fpbBeam() { tone(1480, 0.3, 'triangle', 0.03, -700); tone(2960, 0.22, 'sine', 0.012, -1200); noise(0.25, 0.04, 3600, 'bandpass', 0, 2); },
  fpbShatter() { for (let k = 0; k < 5; k++) tone(1800 + Math.random() * 2400, 0.14, 'triangle', 0.012, -500, k * 0.03); noise(0.25, 0.05, 4500, 'highpass'); },
  fpbCrack() { noise(0.12, 0.05, 1200, 'bandpass', 0, 2); tone(300, 0.06, 'square', 0.015, -150); },
  fpbFall() { noise(0.7, 0.08, 300, 'lowpass', 0, 1); tone(60, 0.5, 'sine', 0.06, -25); noise(0.3, 0.03, 1400, 'bandpass', 0.15, 3); }
});
