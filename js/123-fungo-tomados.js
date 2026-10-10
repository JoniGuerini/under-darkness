'use strict';

/* ================= the Taken of the fungal mines (1 of 2) =================
   People and beasts the fungus took (docs/camadas/05-minas-fungicas.md, section 6). None of them moves like another:
   - the Taken colonist goes in fits: stands, shudders, then lurches three blocks at once; its mycelium arm swells and
     glows green, then shoots three blocks forward (and sticks in the wall for a second when it misses);
   - the mycelium puppet hangs from threads tied to the roof that carry it in long steps, its toes barely touching the
     floor, and hold it up over holes; the threads go taut and glow and fling it into a double kick. A blow above it
     cuts the threads: it drops, crawls a little and dies in 6 s;
   - the sower walks to high ground and roots itself (roots go down, 0.8 s; rooted it can't be pushed); it lobs seeds
     that stick to floor or wall, blink for a second and burst into a one-block spike; tearing its roots out to move
     takes a second and leaves it open;
   - the spore moth circles slowly, always pulled to the strongest light near it (a torch, a lamp, a lantern mushroom,
     the hero); over the hero its wings light up and a curtain of dust two blocks wide falls (damage and "esporado").
     A torch left on the floor away from the hero draws the moths to it;
   - the mycelium carpet is a flat patch that slides over floor, walls and roof at a block a second, hard to tell from
     the threads on the walls; step on it or pass under it and its threads rise and snap (0.5 s): glued (no jumping
     for 2 s, half speed) and bitten.
   The other five are in 124. Same brush as 55, 82 and 106 (cp, ramps, outline, cache). Loads after 122 and before 49
   (BAL); 125 sets the level and the spawn tables. The hero's states (fungEsporar, fungLentidao, fungColar) are 120's. */

/* ---------- stats (life and damage are level-1 bases: BAL and 125's level do the rest) ---------- */
Object.assign(ET, {
  colono: { name: 'Colono Tomado', w: 8, h: 21, hp: 90, dmg: 18, xp: 30, kb: 0.45, fly: false, blood: '#c4bca2' },
  marionete: { name: 'Marionete do Micélio', w: 8, h: 21, hp: 70, dmg: 16, xp: 28, kb: 0.55, fly: true, blood: '#c4bca2' },      // fly: the threads hold it, its own gravity once cut
  semeador: { name: 'Semeador', w: 10, h: 19, hp: 55, dmg: 15, xp: 28, kb: 0.5, fly: false, blood: '#7accc0' },
  mariposa: { name: 'Mariposa-Esporo', w: 12, h: 9, hp: 36, dmg: 13, xp: 22, kb: 1.0, fly: true, blood: '#a8b2a6' },
  tapete: { name: 'Tapete de Micélio', w: 12, h: 6, hp: 50, dmg: 17, xp: 24, kb: 0, fly: true, phase: true, blood: '#c4bca2' }   // phase: it moves cell by cell along the rock itself
});
const FGT_TYPES = ['colono', 'marionete', 'semeador', 'mariposa', 'tapete'];

/* ---------- drops (127's materials; the three bases of the layer are rare) ---------- */
const FGT_BASES = [['capacete_lanterna', 0.004], ['botas_seiva', 0.004], ['gancho_colheita', 0.004]];
const FGT_DROPS = {
  colono: [['fio_micelio', 0.5, 1, 2], ['pocao', 0.08], ['min_esporita', 0.08], ...FGT_BASES],
  marionete: [['fio_micelio', 0.6, 1, 3], ['pocao', 0.08], ['min_esporita', 0.06], ...FGT_BASES],
  semeador: [['chapeu_lanterna', 0.55], ['pocao', 0.08], ['min_esporita', 0.08], ...FGT_BASES],
  mariposa: [['po_mariposa', 0.55, 1, 2], ['pocao', 0.08], ['min_esporita', 0.04], ...FGT_BASES],
  tapete: [['fio_micelio', 0.45, 1, 3], ['pocao', 0.08], ['min_esporita', 0.1], ...FGT_BASES]
};
// trimmed to what exists once everything has loaded (the first world or the first drop)
let fgtReady = false;
function fgtLate() {
  if (fgtReady) return; fgtReady = true;
  for (const k of FGT_TYPES) DROPS[k] = FGT_DROPS[k].filter(([id]) => ITEMS[id]);
  if (typeof DMG_KIND !== 'undefined') DMG_KIND.mariposa = 'veneno';   // 101 loads later
}
for (const k of FGT_TYPES) DROPS[k] = FGT_DROPS[k].filter(([id]) => ITEMS[id]);
{ const _rd = rollDrops; rollDrops = function (e) { fgtLate(); return _rd.apply(this, arguments); }; }
Object.assign(NAV_WALKERS, { colono: 1 });
Object.assign(CV_STEP, { colono: 1, semeador: 1 });

/* ================= art ================= */
const FGT = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RF = {
  mic: R7(['#16150f', '#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4']),       // the cream mycelium (the stalk ramp)
  carne: R7(['#160c10', '#2a1a20', '#4a2c34', '#74464e', '#a0686c', '#c89490', '#ecc8bc']),     // fungus flesh
  lam: R7(['#06181a', '#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']),       // gills: the cold light
  verde: R7(['#0a1a0e', '#14341a', '#1e5228', '#2e7a3a', '#4aa452', '#86d07a', '#c8f0b0']),     // the colonist's arm when it swells
  pele: R7(['#140e0c', '#261c18', '#3c2c24', '#523e32', '#6a5242', '#826854', '#9a8068']),      // the colonists' skin, gone grey
  camisa: R7(['#140c08', '#24160e', '#3a2416', '#523420', '#6c462c', '#86593a', '#9e6e4c']),    // a rust work shirt
  calca: R7(['#0c0e10', '#161a1e', '#22282e', '#30383e', '#404a50', '#525c62', '#667076']),
  couro: R7(['#0e0806', '#1a100a', '#2a1a10', '#3c2618', '#503422', '#66442e', '#7c563a']),
  vestido: R7(['#0c0a12', '#16121e', '#221c2e', '#30283e', '#40364e', '#524662', '#665a74']),  // the puppet's faded indigo dress
  cabelo: R7(['#0a0806', '#140f0b', '#201810', '#2e2216', '#3c2e1e', '#4c3a26', '#5c4830']),
  avental: R7(['#0e0e08', '#1a1a10', '#2a2a1a', '#3c3a26', '#504c32', '#666040', '#7c7650']),   // the sower's olive smock
  asa: R7(['#100c0a', '#1e1814', '#302820', '#44382e', '#5a4a3c', '#72604c', '#8c7860']),       // the moth's old grey-brown
  ocre: R7(['#2a1a06', '#46300c', '#664814', '#88621e', '#aa7e2c', '#c89c44', '#e0bc66']),
  humus: R7(['#0a080c', '#120f14', '#1e1a22', '#2c2632', '#3c3444', '#504658', '#6a5e70']),
  boca: R7(['#0a0406', '#160a0c', '#241014', '#34181c', '#462026', '#5a2a30', '#70363c'])
};
// a thick limb along a polyline: a dark rim one pixel wider, then the limb lit from the top left (as 106)
function limb(P, pts, r, R, base, s, rimV = 0.5) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.8; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.08 ? -0.9 : 0)); } });
}
// the mycelium's grain: stringy light runs and dark pits
const myc = s => (x, y) => ((x * 7 + y * 3 + s) % 5 === 0 ? 1 : 0) + (hash2(x, y, s) < 0.18 ? -1.2 : 0);
// a little mushroom sprouting out of a body: a teal cap lit underneath, a cream stem
function mush(P, x, y, r, s) { P.put(x, y + r * 0.6 + 0.8, RF.mic, 4); P.blob(x, y, r + 0.6, r * 0.6 + 0.4, RF.lam, s, 3.8, (xx, yy, dx, dy) => dy > 0.3 ? 1.6 : 0); }
// is (px, py) inside the polygon
function inPoly(pts, px, py) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; } return ins; }

/* the Taken colonist, 16 x 23 facing right (the hero's 12 x 22 frame at x 2, y 1: shoulders x 6.5 / 9.5, row 11.5).
   0 standing slack, 1 the shudder (head jerked, fibres bristling), 2-3 the lurch, 4 the arm swollen and glowing, drawn
   back, 5 reaching (the arm itself is drawn apart: arm()), 6 stuck (leaning into the pull) */
function colono(pose) {
  const P = cp(16, 23), s = 23101 + pose * 7;
  const st = pose === 2 ? 1 : pose === 3 ? -1 : 0, lean = pose === 2 || pose === 3 ? 1 : pose === 5 ? 1.4 : pose === 6 ? 2.2 : pose === 4 ? -0.6 : 0, sh = pose === 1 ? 1 : 0;
  // legs: faded work trousers and boots, the far one in shadow; threads climbing the near boot
  limb(P, [[7.2 + lean * 0.4, 17.8], [6.8 - st * 1.2, 20], [6.6 - st * 2, 21.2]], 0.85, RF.calca, 1.2, s + 1);
  P.blob(7 - st * 2, 22, 1.7, 0.9, RF.couro, s + 2, 1.4);
  limb(P, [[9.4 + lean * 0.4, 17.8], [9.8 + st * 1.2, 20], [10.2 + st * 2, 21.2]], 0.9, RF.calca, 2.6, s + 3);
  P.blob(10.8 + st * 2, 22, 1.8, 0.9, RF.couro, s + 4, 2.4);
  for (let k = 0; k < 4; k++) P.put(9.6 + st * 2 + hash2(k, 1, s) * 2, 21.6 - k * 0.9, RF.mic, 4.6 - k * 0.5);
  // the far arm, still a man's arm: a rolled sleeve, a grey hand
  limb(P, [[6.6 + lean, 11.6], [5.8 + lean * 0.6 - sh, 14.8], [6.2 + lean * 0.5, 17.2]], 0.8, RF.camisa, 1.4, s + 5);
  P.blob(6.2 + lean * 0.5, 18, 1, 1, RF.pele, s + 6, 2);
  // the torso: a rust shirt under a leather vest; the mycelium has the near shoulder and runs down the chest
  P.blob(8.4 + lean * 0.6, 14.4, 3.4, 4.2, RF.camisa, s, 3, (x, y, dx, dy) => (dy > 0.6 ? -0.6 : 0) + ((x + y) % 4 === 0 && dy > -0.4 ? -0.8 : 0));
  for (let y = 11; y <= 17; y++) { P.put(6.2 + lean * 0.6 + (y - 11) * 0.06, y, RF.couro, 2.4); P.put(7.2 + lean * 0.6, y, RF.couro, 1.6); }
  for (let x = 5; x <= 12; x++) P.put(x + lean * 0.5, 15.4, RF.couro, x === 9 ? 4.4 : 1.8);
  P.blob(10.2 + lean * 0.7, 11.8, 2.6, 2.4, RF.mic, s + 7, 3.8, myc(s + 7));
  for (const [x, y, l] of [[9.6, 13, 4], [10.8, 13.4, 3], [8.6, 12.6, 2.4], [11.4, 16, 2]]) for (let j = 0; j < l; j++) P.put(x + lean * 0.6 + Math.sin(j + x) * 0.4, y + j, RF.mic, 4.8 - j * 0.6);
  if (sh) for (const [x, y] of [[12.6, 10], [13.4, 11.6], [12, 9]]) P.line(11.4 + lean, 11, x + lean, y, RF.mic, 4.4);   // the fibres bristle
  // the head, hanging forward; the mycelium has grown over the skull and two mushrooms sprout from it
  const hx = 9.2 + lean * 1.1 + sh, hy = 5.8 + (lean > 1 ? 0.8 : lean > 0 ? 0.4 : 0) - sh * 0.4;
  P.blob(hx - 1.4, hy + 3, 1.4, 1.4, RF.pele, s + 8, 2.2);
  P.blob(hx, hy, 2.7, 3, RF.pele, s + 9, 3.4);
  P.blob(hx - 1.4, hy - 1.6, 2.4, 1.9, RF.mic, s + 10, 3.8, (x, y, dx, dy) => (dy > 0.5 ? -1 : 0) + myc(s + 10)(x, y));
  for (let k = 0; k < 4; k++) P.put(hx - 3 + k * 0.3, hy - 0.4 + k, RF.mic, 3.6 - k * 0.4);
  mush(P, hx - 2.4, hy - 3.6, 0.6, s + 11); mush(P, hx + 0.2, hy - 3.6 - sh, 0.9, s + 12);
  P.put(hx + 1.6, hy - 0.2, RF.mic, 5.8); P.put(hx + 2.4, hy - 0.2, RF.boca, 0.6);   // a milky eye; the other socket dark
  P.line(hx + 0.8, hy + 1.8, hx + 2.4, hy + 2.2, RF.boca, 0.8); P.put(hx + 1.4, hy + 2.6, RF.boca, 1.4);   // the jaw hangs
  // the near arm: all mycelium now
  if (pose === 4) {
    limb(P, [[10 + lean, 11.6], [7.4, 12.8], [4.6, 11.4]], 1.35, RF.verde, 3.2, s + 13);
    for (let x = 5; x <= 9; x += 2) P.put(x, 12.2 - (x - 5) * 0.1, RF.mic, 4.8);   // the cream rope showing through
    P.blob(3.4, 11, 2.3, 2.1, RF.verde, s + 14, 3.8, myc(s + 14));
    for (const [x, y] of [[0.6, 9.6], [0.4, 11.6], [1, 13.2], [2.6, 8.4]]) P.line(2.6, 11, x, y, RF.verde, 5.2);
    P.put(3, 10.4, RF.verde, 6.4);
  } else if (pose >= 5) limb(P, [[10 + lean, 11.6], [13.6 + lean * 0.6, 11.6]], 1.05, RF.mic, 3.8, s + 13);
  else {
    limb(P, [[10.4 + lean, 11.6], [11 + lean * 0.6 - sh, 15.4], [11.2 + lean, 18.4]], 0.95, RF.mic, 3.4, s + 13);
    for (let k = 0; k < 3; k++) P.line(11.2 + lean, 18.4, 10.4 + lean + k, 20.4 + (k % 2), RF.mic, 3.6 - k * 0.4);   // a tassel of fibres for a hand
  }
  return set(P.done());
}
// the reaching arm, L px from the shoulder (at x 0, row 4.5): a rope of mycelium, a green vein, a fist of fibres
// (stuck: the tip burst into rootlets gripping the wall)
function arm(L, stuck) {
  const P = cp(L + 6, 9), s = 23201 + L + (stuck ? 50 : 0);
  for (let x = 0; x <= L; x++) {
    const t = x / Math.max(1, L), r = 1.7 - t * 0.6, cy = 4.5 + Math.sin(x * 0.6) * 0.5 * t;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) { const u = (y + 0.5 - cy) / r; P.put(x, y, RF.mic, 4 - u * 1.4 + ((x + y * 3) % 4 === 0 ? -1 : 0) + cg(x, y, s) * 0.4); }
    if (x % 3 === 1) P.put(x, cy - 0.3, RF.verde, 4.8 - t);
  }
  if (stuck) for (const [ex, ey] of [[4, -3.4], [5, -1.2], [5.4, 1], [4.4, 3.2], [2.6, 4]]) P.line(L, 4.5, L + ex, 4.5 + ey, RF.mic, 3.6);
  else { P.blob(L + 1.4, 4.5, 2.2, 2.2, RF.mic, s + 1, 4.2, myc(s + 1)); for (const o of [-2, 0, 2]) P.line(L + 2, 4.5 + o * 0.6, L + 4.6, 4.5 + o * 1.3, RF.mic, 5); P.put(L + 1, 4, RF.verde, 5.4); }
  return set(P.done());
}

/* the mycelium puppet, 16 x 23 facing right (the hero's frame): a thin woman in a long dress, limp, held up by the
   threads that grow out of her wrists and the back of her head. 0 hanging, 1-2 the long step, 3 the threads pulled
   taut (arms up, knees drawn), 4-5 the double kick. MAR_PTS: where the threads come out (far wrist, head, near wrist) */
const MAR_PTS = [];
function marionete(pose) {
  const P = cp(16, 23), s = 23301 + pose * 5, sw = pose === 1 ? 1 : pose === 2 ? -1 : 0, tense = pose === 3, k1 = pose === 4, k2 = pose === 5, kick = k1 || k2;
  const farLeg = tense ? [[7.6, 17], [9.8, 18.4], [9.2, 21]] : k2 ? [[7.6, 17], [11.2, 16.4], [15, 15.4]] : k1 ? [[7.6, 17], [6.4, 19.6], [5.8, 22]] : [[7.6, 17], [7.4 - sw * 1.4, 19.6], [7.2 - sw * 2.4, 22.2]];
  const nearLeg = tense ? [[9, 17], [11.6, 17.8], [11, 20.4]] : k1 ? [[9, 17], [12.4, 16.2], [15.4, 15.6]] : k2 ? [[9, 17], [8.2, 19.6], [7.8, 22]] : [[9, 17], [9.4 + sw * 1.4, 19.6], [9.6 + sw * 2.4, 22.2]];
  limb(P, farLeg, 0.55, RF.pele, 1.2, s + 1); limb(P, nearLeg, 0.6, RF.pele, 2.6, s + 2);
  for (const [lg, v] of [[farLeg, 3.4], [nearLeg, 4.6]]) { const [ax, ay] = lg[2], [bx, by] = lg[1]; P.put(lerp(bx, ax, 0.7), lerp(by, ay, 0.7), RF.mic, v); }   // threads tied round the ankles
  const farArm = tense ? [[6.6, 11], [4.4, 8], [3.8, 4.6]] : kick ? [[6.6, 11], [4.6, 9.4], [3.2, 6.8]] : [[6.6, 11], [5.6, 13.6], [5, 15.4 - sw * 0.6]];
  limb(P, farArm, 0.5, RF.pele, 1.4, s + 3);
  // the dress: long, faded indigo, the hem ragged and grown through with threads
  for (let y = 9; y <= 18; y++) {
    const t = (y - 9) / 9, half = 2.1 + t * 2.3, cx = 8.3 + (tense ? 0.6 * t : 0) + (kick ? (k1 ? 1 : -0.6) * t : sw * t * 1.1) - (tense ? 0.4 : 0);
    const lift = kick && y > 15;
    for (let x = Math.floor(cx - half); x <= cx + half; x++) {
      if (y >= 17 && hash2(x, y + pose, s) < 0.4) continue;
      if (lift && hash2(x, y, s + 1) < 0.5) continue;
      const u = (x + 0.5 - (cx - half)) / (2 * half), fold = (x + Math.round(t * 2 * sw)) % 3 === 0 ? -1 : 0;
      P.put(x, y, RF.vestido, 4.2 - u * 2.2 - t * 0.5 + fold + cg(x, y, s) * 0.5);
    }
  }
  for (let k = 0; k < 5; k++) { const x = 5.4 + k * 1.5 + hash2(k, 2, s), y = 17 + hash2(k, 3, s) * 2; P.put(x, y, RF.mic, 4.4); P.put(x, y + 1, RF.mic, 3.2); }
  P.blob(8.6, 10.4, 2.4, 1.4, RF.mic, s + 4, 3.6, myc(s + 4));   // the collar gone to mycelium
  for (let k = 0; k < 3; k++) P.put(7.4 + k * 1.2, 12 + k * 0.6, RF.mic, 4.2 - k * 0.5);
  // the head lolling forward, long hair hanging, mycelium spilling from the back of the skull where a thread grows
  const hx = tense ? 8.6 : 9.4, hy = tense ? 4.8 : 6;
  P.blob(hx - 0.8, hy, 3.2, 3.4, RF.cabelo, s + 5, 2.8);
  for (let k = 0; k < 4; k++) P.line(hx - 2.6 + k * 0.6, hy + 1, hx - 3 + k * 0.7, hy + 5 + (k % 2), RF.cabelo, 2.6 - k * 0.2);
  P.blob(hx + 0.9, hy + 0.8, 2.1, 2.5, RF.pele, s + 6, 3.4);
  P.line(hx + 1.2, hy + 0.2, hx + 2.2, hy + 0.4, RF.boca, 1.2);   // shut eyes
  P.put(hx + 1.8, hy + 2.4, RF.boca, tense || kick ? 0.4 : 1.4);   // a small open mouth
  P.blob(hx - 2.2, hy - 2, 1.5, 1.4, RF.mic, s + 7, 4, myc(s + 7));
  const nearArm = tense ? [[9.6, 11], [12.4, 8], [13, 4.6]] : kick ? [[9.6, 11], [11.6, 9], [13.2, 6.8]] : [[9.6, 11], [10.4, 13.8], [11.2, 15.4 + sw * 0.6]];
  limb(P, nearArm, 0.55, RF.pele, 3, s + 8);
  for (const [ax, ay] of [farArm[2], nearArm[2]]) P.blob(ax, ay, 0.9, 0.9, RF.mic, s + 9, 5);   // knots of mycelium at the wrists
  MAR_PTS[pose] = [farArm[2], [hx - 2, hy - 2.6], nearArm[2]];
  return set(P.done());
}
/* the puppet cut down, 24 x 10 facing right: lying on her front, dragging herself; 0-1 crawling, 2 grabbing */
function marCrawl(pose) {
  const P = cp(24, 10), s = 23351 + pose * 3, a = pose === 1 ? 1 : 0, grab = pose === 2;
  limb(P, [[7, 7.6], [3.6, 8.2], [0.8, 8.6 + a * 0.4]], 0.55, RF.pele, 1.4, s + 1);   // legs trailing
  limb(P, [[8, 8], [4.6, 8.8], [1.6, 9]], 0.55, RF.pele, 2.6, s + 2);
  limb(P, [[14, 6.6], [12.4 + a, 8.6], [15.6 + a, 9]], 0.5, RF.pele, 1.4, s + 3);   // the far arm, under her
  for (let y = 4; y <= 9; y++) for (let x = 5; x <= 16; x++) {   // the dress spread on the floor
    const dy = (y - 6.8) / 2.6, dx = (x - 10.6) / 5.8; if (dx * dx + dy * dy > 1 || hash2(x, y, s) < (x < 7 ? 0.35 : 0.05)) continue;
    P.put(x, y, RF.vestido, 3.6 - dy * 1.6 + ((x + y) % 3 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.5);
  }
  P.blob(13.4, 5, 1.8, 1.2, RF.mic, s + 4, 4, myc(s + 4));
  for (const [x, y] of [[12.6, 4.4], [14.4, 4]]) { P.line(x, y, x - 1.4, y - 3, RF.mic, 4.2); P.put(x - 1.6, y - 3.6, RF.mic, 2.6); }   // the cut threads
  P.blob(18, 5.6, 2.6, 2.4, RF.cabelo, s + 5, 2.8);
  P.blob(19.4, 6.4, 1.8, 1.8, RF.pele, s + 6, 3.2); P.put(20.4, 6.2, RF.boca, 1);
  const hand = grab ? [23, 3.4] : [22.4 - a, 8.6];
  limb(P, [[15.4, 6], [18.6, grab ? 4.6 : 7.2 - a * 0.6], hand], 0.55, RF.pele, 3, s + 7);
  P.blob(hand[0], hand[1], 0.9, 0.9, RF.mic, s + 8, 4.8);
  return set(P.done());
}

/* the sower, 20 x 24 facing right: a hunched body in an olive smock, a great lantern-cap grown out of its head (the
   gills underneath glow), one arm turned into a seed pod. 0 standing, 1-2 walking, 3 rooted (feet spread), 4 aiming
   (cap thrown back, pod swollen), 5 the shot (pod flung forward, split open), 6 tearing its roots out */
function semeador(pose) {
  const P = cp(20, 24), s = 23401 + pose * 5, st = pose === 1 ? 1 : pose === 2 ? -1 : 0, aim = pose === 4, shot = pose === 5, root = pose === 3 || aim || shot, up = pose === 6;
  const tilt = aim ? -1.4 : shot ? 0.8 : up ? 1 : 0;
  const farLeg = root ? [[9, 16.6], [7.2, 20], [5.6, 23.2]] : up ? [[9, 16.6], [7.6, 19], [7.4, 21.4]] : [[9, 16.6], [8.4 - st, 20], [7.6 - st * 1.8, 23.2]];
  const nearLeg = root ? [[11.4, 16.6], [13.2, 20], [14.6, 23.2]] : up ? [[11.4, 16.6], [13.6, 19.4], [13.8, 22.6]] : [[11.4, 16.6], [12 + st, 20], [12.6 + st * 1.8, 23.2]];
  limb(P, farLeg, 0.7, RF.mic, 1.6, s + 1); limb(P, nearLeg, 0.75, RF.mic, 3, s + 2);
  for (const [lg, v] of [[farLeg, 1.8], [nearLeg, 2.8]]) { const [x, y] = lg[1]; P.put(x, y - 1, RF.calca, v); P.put(x + 0.6, y - 2, RF.calca, v - 0.4); }   // what's left of the trousers
  limb(P, [[8, 11.4], [6.8, 14.6], [7, 17.4]], 0.7, RF.avental, 1.4, s + 3);   // the far arm, knuckles to the knees
  P.blob(10, 13.4, 4, 4.6, RF.avental, s, 3, (x, y, dx, dy) => (dy > 0.6 ? -0.7 : 0) + ((x * 2 + y) % 5 === 0 ? -0.9 : 0));
  P.blob(8.6, 11.4, 2.6, 2, RF.mic, s + 4, 3.8, myc(s + 4)); P.blob(11.6, 16, 1.8, 1.3, RF.mic, s + 5, 3.4, myc(s + 5));
  for (let k = 0; k < 4; k++) P.put(9 + k * 1.3, 17.8 + (k % 2), RF.mic, 3.6);   // the smock's hem gone to threads
  // the head, low and forward under the cap; two points of the same cold light for eyes
  const hx = 13.2 + tilt * 0.3, hy = 9.6;
  P.blob(hx, hy, 2.4, 2.2, RF.pele, s + 6, 2.4);
  P.put(hx + 1, hy - 0.2, RF.lam, 6.4); P.put(hx + 2, hy - 0.2, RF.lam, 5.4);
  limb(P, [[hx - 1.2, hy - 1.4], [10.6 + tilt * 0.5, 6.8]], 0.7, RF.mic, 3.8, s + 7);   // the stalk out of the crown
  // the lantern-cap: a wide dome, translucent teal flecked with cream; the gills underneath glow
  const ccx = 10.2 + tilt, ccy = 4.6, rx = 8.8, ry = 4.2;
  for (let y = 0; y <= 7; y++) for (let x = 0; x < 20; x++) {
    const dx = (x + 0.5 - ccx - (aim ? (4.6 - y) * 0.25 : shot ? -(4.6 - y) * 0.15 : 0)) / rx, dy = (y + 0.5 - ccy) / ry;
    if (dy > 0.45 || dx * dx + dy * dy > 1) continue;
    const gill = dy > 0.18;
    if (gill) P.put(x, y, RF.lam, 5.6 - Math.abs(dx) * 1.6 + ((x & 1) ? -0.8 : 0));
    else P.put(x, y, hash2(x, y, s + 8) < 0.12 ? RF.mic : RF.lam, 3.2 - dy * 1.2 - dx * 0.8 + (hash2(x, y, s + 8) < 0.12 ? 1.6 : 0) + cg(x, y, s) * 0.4);
  }
  // the near arm: the seed pod
  if (aim) { limb(P, [[11.6, 11.6], [9.6, 9.8], [8.2, 8.4]], 0.7, RF.avental, 3, s + 9); P.blob(7, 7.6, 2.6, 2.3, RF.carne, s + 10, 4, (x, y) => ((x + y) % 3 === 0 ? -1 : 0)); P.put(6.4, 6.6, RF.carne, 6.2); }
  else if (shot) { limb(P, [[11.6, 11.6], [15, 11], [17, 10.4]], 0.7, RF.avental, 3, s + 9); P.blob(18, 10.2, 1.6, 1.8, RF.carne, s + 10, 3.6); for (const o of [-1.6, 1.6]) P.line(18.4, 10.2, 19.6, 10.2 + o, RF.carne, 4.4); P.put(18.6, 10.2, RF.boca, 0.6); }
  else { limb(P, [[11.6, 11.6], [13.4, 14.2], [14, 16.4]], 0.7, RF.avental, 3, s + 9); P.blob(14.4, 17.6, 1.8, 1.6, RF.carne, s + 10, 3.6, (x, y) => ((x + y) % 3 === 0 ? -1 : 0)); }
  return set(P.done());
}
// the sower's roots, 20 x 8 (drawn from a row above the floor down into it): k 0..3 as they go down
function roots(k) {
  const P = cp(20, 8), s = 23451 + k, len = 1.6 + k * 1.8;
  for (const [x0, d] of [[5.6, -1], [14.6, 1]]) for (let r = 0; r < 3; r++) {
    let x = x0 + (r - 1) * 0.8, y = 1;
    const dx = d * (r - 0.5) * 0.7 + (r === 1 ? 0 : d * 0.3);
    for (let j = 0; j < len; j++) { P.put(x, y, RF.mic, 4 - j / len * 1.8 - (r === 1 ? 0.6 : 0)); if (j < len * 0.5) P.put(x + 1, y, RF.mic, 3 - j / len); x += dx * (0.5 + hash2(j, r, s) * 0.6); y += 0.85; }
  }
  return set(P.done());
}
// the seed, 5 x 5, and the spike it bursts into, 8 x 13 (base at the bottom)
function seed() { const P = cp(5, 5), s = 23471; P.blob(2.5, 2.5, 1.8, 1.6, RF.carne, s, 4); P.put(2, 1.6, RF.lam, 6); return set(P.done()); }
function spike() {
  const P = cp(8, 13), s = 23481;
  for (let y = 0; y < 13; y++) { const half = 0.4 + y / 12 * 2.8; for (let x = Math.floor(4 - half); x <= 4 + half - 0.01; x++) { const u = (x + 0.5 - (4 - half)) / (2 * half); P.put(x, y, y < 3 ? RF.lam : RF.mic, (y < 3 ? 5.2 : 4.4) - u * 2 - y * 0.05 + ((x + y) % 3 === 0 ? -0.7 : 0) + cg(x, y, s) * 0.4); } }
  return set(P.done());
}

/* the spore moth, 26 x 18 facing right: a moth the fungus took, grey-brown wings eaten through with cream mycelium,
   the eye-spots turned into spore sacs. 0-2 flapping (up, level, down), 3 wings spread and lit, 4 shaking the dust out */
function wing(P, pts, root, dark, lit, s) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, cx = 0, cy = 0;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); cx += x; cy += y; }
  cx /= pts.length; cy /= pts.length; cx = lerp(cx, root[0], -0.15); cy = lerp(cy, root[1], -0.15);
  const ax = cx - root[0], ay = cy - root[1], al = Math.hypot(ax, ay) || 1;
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5; if (!inPoly(pts, px, py)) continue;
    if (hash2(x, y, s) < 0.025) continue;   // eaten through
    const d = Math.hypot(px - cx, py - cy), r0 = Math.hypot(px - root[0], py - root[1]), along = ((px - root[0]) * ax + (py - root[1]) * ay) / (al * al);
    let R = RF.asa, v = 4.1 - (py - y0) / Math.max(1, y1 - y0) * 1.4 + cg(x, y, s) * 0.5;
    const vein = Math.abs((px - root[0]) * ay - (py - root[1]) * ax) / al;
    if (d < 1.4) { R = RF.lam; v = lit ? 6.4 : 4.6 - d; }
    else if (d < 2.4) { R = RF.humus; v = 1.2; }
    else if (r0 < 2.6) { R = RF.mic; v = 4.2 - r0 * 0.2 + cg(x, y, s) * 0.4; }
    else if (Math.abs(along - 1.55) < 0.16) { R = RF.ocre; v = 3.4; }
    else if (vein < 0.5 && along > 0.3 && along < 1.3) { R = RF.mic; v = 3.6; }   // a vein gone to mycelium
    else if ((x * 3 + y) % 7 === 0) v -= 1;
    P.put(x, y, R, v - (dark ? 0.9 : 0));
  }
}
function mariposa(pose) {
  const P = cp(26, 18), s = 23501 + pose * 3, lit = pose === 3;
  // right wings (mirrored for the left): forewing and hindwing, by pose
  const FW = [[[14, 6.4], [16.6, 0], [22, 0.2], [21.6, 5.6], [15, 8.4]], [[14, 6.4], [20, 2.4], [25, 3.6], [24.6, 8.6], [15, 9.2]], [[14, 7], [21.6, 8], [24, 12.4], [19, 13.6], [14.6, 10]], [[14, 6], [20.4, 1.2], [25.4, 2.6], [25.2, 8.6], [15, 9.4]], [[14, 7.4], [20.6, 9.6], [22, 14], [17.6, 14.4], [14.4, 10.4]]][pose];
  const HW = [[[14, 9], [19, 6.6], [20, 11.4], [15, 11.6]], [[14, 9], [21.6, 10], [20.6, 14.4], [16.4, 15], [14, 11.6]], [[14, 9.6], [19, 13], [17.6, 17.4], [14.6, 14]], [[14, 9], [22, 9.6], [21.4, 14.6], [16.6, 15.4], [14, 11.6]], [[14, 9.8], [18, 14], [16.6, 17.6], [14.4, 14.4]]][pose];
  const mir = pts => pts.map(([x, y]) => [26 - x, y]);
  wing(P, mir(HW), [12, 9.4], true, lit, s + 1); wing(P, mir(FW), [12, 7], true, lit, s + 2);
  wing(P, HW, [14, 9.4], false, lit, s + 3); wing(P, FW, [14, 7], false, lit, s + 4);
  // the body: a furred thorax gone to mycelium, a plump banded abdomen, a little head with feathered antennae
  for (let k = 0; k < 5; k++) { const y = 10.4 + k * 1.1, r = 1.7 - k * 0.22; P.blob(13, y, r, r * 0.9, k % 2 ? RF.mic : RF.asa, s + 5 + k, k % 2 ? 3.6 : 3.2); }
  P.blob(13, 7.8, 2, 2.2, RF.asa, s + 10, 3.6, myc(s + 10));
  P.blob(12.6, 7, 1.2, 1, RF.mic, s + 11, 4.6);
  P.blob(13, 4.8, 1.4, 1.2, RF.asa, s + 12, 3.6); P.put(12, 4.6, RF.lam, 5.4); P.put(14, 4.6, RF.lam, 5.4);
  for (const d of [-1, 1]) { const x0 = 13 + d * 0.6, x1 = 13 + d * 4, y1 = 0.6; P.line(x0, 3.8, x1, y1, RF.asa, 3.6); for (let k = 1; k < 4; k++) { const t = k / 4; P.put(lerp(x0, x1, t) + d * 0.8, lerp(3.8, y1, t) + 0.6, RF.mic, 3.6); } }
  return set(P.done());
}

/* the mycelium carpet, 20 x 12 lying on a floor (the surface is the bottom row; turned for walls and roof): a flat
   tangle of threads. 0-1 still, 2-3 the threads rising and snapping, 4 the bite (threads closed, a mouth under them) */
function tapete(pose) {
  const P = cp(20, 12), s = 23601 + pose * 3;
  for (let x = 1; x <= 18; x++) {
    const t = (x - 9.5) / 8.5, th = Math.round(2.6 - t * t * 1.6 + hash2(x, 0, s) * 0.8);
    for (let y = 12 - th; y <= 11; y++) P.put(x, y, RF.mic, 2.2 + (11 - y) * 0.5 + (hash2(x, y, s) < 0.25 ? -1 : 0) + ((x * 3 + y) % 5 === 0 ? 1.2 : 0));
  }
  for (const x of [5, 9, 12, 15]) P.put(x, 11, RF.carne, 2);
  if (pose <= 1) for (let k = 0; k < 6; k++) { const x = 2 + k * 3 + (pose ? 1 : 0); P.put(x, 9 - (k % 2), RF.mic, 3.2); }
  else if (pose === 2 || pose === 3) {
    for (let k = 0; k < 8; k++) {
      const x0 = 2 + k * 2.2, h = (pose === 2 ? 4 : 7) + hash2(k, 1, s) * 2.4, lean = pose === 3 ? (9.5 - x0) * 0.18 : 0;
      for (let j = 0; j < h; j++) P.put(x0 + lean * j / h * 2 + Math.sin(j * 1.3 + k) * 0.4, 9 - j, RF.mic, 3.6 + j / h * 2);
      if (pose === 3) P.put(x0 + lean * 2 + Math.sign(lean) * 0.8, 9 - h, RF.mic, 5.4);   // hooked tips
    }
  } else {
    P.blob(9.5, 9, 3.2, 1.6, RF.carne, s, 3.2);
    for (let x = 7; x <= 12; x++) P.put(x, 8, RF.mic, 5);
    for (let k = 0; k < 8; k++) { const x0 = 2 + k * 2.2; P.line(x0, 9, 9.5 + (x0 - 9.5) * 0.2, 2.6 + Math.abs(x0 - 9.5) * 0.15, RF.mic, 3.8 + (k % 2) * 0.8); }
  }
  return set(P.done());
}
const GL = { green: glow(14, '#7ad070'), teal: glow(16, '#5ad4c0'), tealS: glow(6, '#7accc0'), cream: glow(8, '#e6dec4'), dust: glow(20, '#8ad4c4') };
FGT.get = () => FGT.ready || (FGT.ready = {
  colono: [0, 1, 2, 3, 4, 5, 6].map(colono),
  armR: [4, 8, 12, 16, 20, 24, 28, 32, 36].map(L => arm(L, false)),
  armS: [4, 8, 12, 16, 20, 24, 28, 32, 36].map(L => arm(L, true)),
  mar: [0, 1, 2, 3, 4, 5].map(marionete),
  marC: [0, 1, 2].map(marCrawl),
  sem: [0, 1, 2, 3, 4, 5, 6].map(semeador),
  roots: [0, 1, 2, 3].map(roots),
  seed: seed(), spike: spike(),
  moth: [0, 1, 2, 3, 4].map(mariposa),
  tap: [0, 1, 2, 3, 4].map(tapete)
});
Object.assign(FGT, { RF, GL, MAR_PTS });
}

/* ================= helpers ================= */
const fgtWet = (x, y) => typeof aguaAt === 'function' && !!aguaAt(Math.floor(x / T), Math.floor(y / T));   // 171 loads later
function fgtWand(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
// the row of the first solid tile above (tx, ty), up to max rows, or -1
function fgtRoof(tx, ty, max) { for (let k = 1; k <= max; k++) if (solidAt(tx, ty - k)) return ty - k; return -1; }
const fgtFiber = (x, y, vx, vy, life = 0.6) => { if (parts.length < 700) parts.push({ x, y, vx, vy, g: 120, life, max: life, col: Math.random() < 0.6 ? '#c4bca2' : '#9a9480', size: 1 }); };
const fgtSpore = (x, y, vx, vy, life = 0.8) => { if (parts.length < 700) parts.push({ x, y, vx, vy, g: 30, life, max: life, col: Math.random() < 0.5 ? '#7accc0' : '#c4f4e6', size: 1, glow: Math.random() < 0.4 }); };
// a 1 px line on the screen (threads)
function fgtLine(x0, y0, x1, y1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; lc.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1); } }

/* ================= the Taken colonist ================= */
// how far the arm can go before it meets rock (px from the shoulder, up to 3 blocks)
function fgtArmRoom(e) {
  const ecx = e.x + e.w / 2, y = Math.floor((e.y + 9.5) / T);
  for (let d = 0; d <= 36; d += 2) if (solidAt(Math.floor((ecx + e.facing * (4 + d)) / T), y)) return d;
  return 36;
}
AI.colono = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'swell') {   // the arm thickens and glows green
    e.vx = approach(e.vx, 0, 900 * dt);
    if (Math.random() < dt * 22) parts.push({ x: ecx - e.facing * 3 + rnd(-3, 3), y: e.y + 9 + rnd(-2, 2), vx: rnd(-8, 8), vy: rnd(-20, -4), g: 0, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#86d07a' : '#c8f0b0', size: 1, glow: true });
    if (e.stateT <= 0) { e.state = 'reach'; e.stateT = 0.3; e.armL = 0; e.armMax = fgtArmRoom(e); e.swingHit = false; sfx.fgtStretch(); }
    return;
  }
  if (e.state === 'reach') {   // three blocks forward in a blink
    e.vx = 0; e.armL = Math.min(e.armMax, e.armL + 260 * dt);
    const L = e.armL, hb = { x: e.facing > 0 ? ecx + 4 : ecx - 4 - L - 4, y: e.y + 6, w: L + 4, h: 8 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl) && losClear(ecx, e.y + 9.5, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.armL >= e.armMax || e.stateT <= 0) {
      if (e.swingHit) { e.state = 'retract'; e.stateT = 0.3; }
      else {   // missed: the tip digs into the wall (or the floor) and holds it a second
        e.state = 'stuck'; e.stateT = 1;
        const tx = ecx + e.facing * (4 + e.armL + 2), ty = e.y + 9.5;
        burst(tx, ty, 8, '#9a9480', 70, 300, 0.4); sfx.fgtStuck();
      }
    }
    return;
  }
  if (e.state === 'stuck') { e.vx = 0; if (Math.random() < dt * 10) fgtFiber(ecx + e.facing * (6 + e.armL), e.y + 9.5, rnd(-20, 20), rnd(-30, 0)); if (e.stateT <= 0) { e.state = 'retract'; e.stateT = 0.3; sfx.fgtRip(); } return; }
  if (e.state === 'retract') { e.vx = 0; e.armL = Math.max(0, e.armL - 140 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; e.pauseT = 0.5; e.armL = 0; } return; }
  if (e.state === 'lurch') {   // three blocks at once, then stops dead
    const before = e.x;
    walk(e, dt, e.lurchDir, 120 + e.lvl * 2, 1800, 260, dy, aggro);
    e.lurchD += Math.abs(e.vx) * dt;
    if (e.lurchD >= 36 || e.stateT <= 0 || (e.hitWall && e.onGround && Math.abs(e.x - before) < 0.01 && e.stateT < 0.5)) { e.state = 'walk'; e.pauseT = 0.7 + Math.random() * 0.6; e.vx *= 0.3; sfx.fgtSquelch(); }
    return;
  }
  // between lurches: stands still, then shudders before the next one
  if (!aggro) fgtWand(e, dt);
  e.vx = approach(e.vx, 0, 900 * dt);
  e.pauseT = (e.pauseT === undefined ? 0.8 : e.pauseT) - dt;
  const shud = e.pauseT < 0.4 && e.pauseT > 0;
  if (shud && !e.trem) { e.trem = true; if (dist < 200) sfx.fgtCreak(); }
  if (!shud) e.trem = false;
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dy) < 20 && Math.abs(dx) < 44 && Math.abs(dx) > 4 && clearPath(e, pl)) {
    e.facing = Math.sign(dx) || e.facing;
    if (fgtArmRoom(e) >= 8) { e.state = 'swell'; e.stateT = 0.6; sfx.fgtSwell(); return; }
  }
  if (e.pauseT <= 0 && e.onGround) {
    let dir = aggro ? (Math.abs(dx) < 18 ? 0 : Math.sign(dx)) : e.wander;
    if (aggro && e.nav && e.nav.kind !== 'here') dir = e.nav.dir || dir;
    if (dir) { e.state = 'lurch'; e.lurchDir = dir; e.lurchD = 0; e.stateT = 0.8; e.facing = dir; }
    else e.pauseT = 0.4;
  }
};

/* ================= the mycelium puppet ================= */
const fgtFallen = e => e.state === 'fall' || e.state === 'crawl' || e.state === 'grab' || e.state === 'claw';
function fgtCut(e) {
  if (e.dead || fgtFallen(e)) return;
  e.state = 'fall'; e.vx *= 0.3; e.vy = 0; e.dieT = 6; e.atkCD = 0.8;
  const ecx = e.x + e.w / 2;
  for (let k = 0; k < 10; k++) fgtFiber(ecx + rnd(-6, 6), e.y - rnd(0, 30), rnd(-30, 30), rnd(-20, 30), 0.8);
  sfx.fgtSnap();
}
AI.marionete = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, wet = fgtWet(ecx, e.y + e.h / 2);
  if (fgtFallen(e)) {   // cut down: its own weight now; crawls a little and dies
    e.vy = Math.min(e.vy + GRAV * dt, wet ? 50 : MAXFALL);
    if (e.state === 'fall') {
      e.vx = approach(e.vx, 0, 200 * dt);
      if (e.onGround) {   // lie down: a long, low body
        const fy = e.y + e.h; e.w = 16; e.h = 7; e.y = fy - 7; e.x = ecx - 8;
        for (const o of [0, 3, -3, 6, -6]) if (!rectSolid(e.x + o, e.y, e.w, e.h)) { e.x += o; break; }
        e.state = 'crawl'; burst(ecx, fy - 1, 8, '#c4bca2', 60, 300, 0.4); sfx.fgtThud();
      }
      return;
    }
    e.dieT -= dt;
    if (e.dieT <= 0) { burst(e.x + e.w / 2, e.y + e.h / 2, 14, '#9a9480', 50, -20, 0.9); killEnemy(e); return; }
    if (Math.random() < dt * 3) fgtFiber(e.x + rnd(0, e.w), e.y + 2, rnd(-6, 6), rnd(-20, -6));
    if (e.state === 'grab') { e.vx = 0; if (e.stateT <= 0) { e.state = 'claw'; e.stateT = 0.25; if (!pl.dead && overlap({ x: e.facing > 0 ? e.x + e.w - 4 : e.x - 10, y: e.y - 6, w: 14, h: e.h + 6 }, pl)) hurtPlayer(Math.max(1, Math.round(e.dmg * 0.5)), ecx, e, false); } return; }
    if (e.state === 'claw') { e.vx = 0; if (e.stateT <= 0) { e.state = 'crawl'; e.atkCD = 1.5; } return; }
    const dir = aggro && Math.abs(dx) > 10 ? Math.sign(dx) : 0;
    if (dir) e.facing = dir;
    e.vx = approach(e.vx, dir * 10, 200 * dt);
    if (aggro && e.atkCD <= 0 && Math.abs(dx) < 18 && Math.abs(dy) < 16) { e.state = 'grab'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.fgtCreak(); }
    return;
  }
  // hanging: the roof it hangs from, and the floor its toes look for
  const tx = Math.floor(ecx / T), ty = Math.floor((e.y + 2) / T), roof = fgtRoof(tx, ty + 1, 16);
  if (roof < 0) { fgtCut(e); return; }   // nothing to hang from
  e.roofY = (roof + 1) * T;
  let fl = -1; const by = Math.floor((e.y + e.h - 2) / T);
  for (let k = 1; k <= 6; k++) if (solidAt(tx, by + k)) { fl = by + k; break; }
  if (fl >= 0) e.rest = fl * T - e.h;
  else if (e.rest === undefined) e.rest = e.y;   // over a hole: the threads hold it where it was
  e.rest = Math.max(e.rest, e.roofY + 2);
  let lift = 0;
  if (e.state === 'tense') {   // the threads go taut and glow: drawn up and back
    e.vx = approach(e.vx, -e.facing * 14, 300 * dt); lift = 7;
    if (Math.random() < dt * 14) fgtSpore(ecx + rnd(-6, 6), e.y - rnd(4, 20), rnd(-4, 4), rnd(-6, 6), 0.4);
    if (e.stateT <= 0) { e.state = 'kick'; e.stateT = 0.5; e.k1 = e.k2 = false; e.vx = e.facing * 190; sfx.fgtKick(); }
  } else if (e.state === 'kick') {   // flung at the hero: two kicks
    const t = 0.5 - e.stateT; lift = 3; e.vx = approach(e.vx, 0, 320 * dt);
    const hb = { x: e.facing > 0 ? ecx - 2 : ecx - 16, y: e.y + 6, w: 18, h: e.h - 6 };
    if (t >= 0.25 && !e.k2s) { e.k2s = true; sfx.fgtKick(); e.vx = e.facing * 110; }
    if (!pl.dead && overlap(hb, pl)) {
      if (t < 0.22 && !e.k1) { e.k1 = true; hurtPlayer(e.dmg, ecx, e, false); }
      else if (t >= 0.25 && !e.k2) { e.k2 = true; hurtPlayer(e.dmg, ecx, e, false); }
    }
    if (e.stateT <= 0) { e.state = 'walk'; e.k2s = false; e.atkCD = 1.4 + Math.random() * 0.6; e.pause = 0.5; e.stepT = 0; }
  } else {
    if (!aggro) fgtWand(e, dt);
    e.pause = (e.pause || 0) - dt;
    if (e.stepT > 0) {   // a long step, toes off the floor
      e.stepT -= dt; const ph = 1 - e.stepT / 0.6; lift = Math.sin(ph * Math.PI) * 10;
      e.vx = e.stepDir * 62 * (wet ? 0.6 : 1);
      if (e.hitWall) e.stepT = 0;
      if (e.stepT <= 0) { e.pause = 0.25 + Math.random() * 0.25; if (dist < 200) sfx.fgtTap(); }
    } else {
      e.vx = approach(e.vx, 0, 500 * dt);
      if (e.pause <= 0) {
        const dir = aggro ? (Math.abs(dx) < 20 ? 0 : Math.sign(dx)) : e.wander;
        if (dir && fgtRoof(tx + dir * 2, ty + 1, 16) >= 0 && !solidAt(tx + dir, Math.floor((e.y + e.h / 2) / T))) { e.stepDir = dir; e.facing = dir; e.stepT = 0.6; }
        else e.pause = 0.3;
      }
    }
    if (aggro && e.atkCD <= 0 && e.stepT <= 0 && Math.abs(dx) < 36 && Math.abs(dy) < 26 && clearPath(e, pl)) { e.state = 'tense'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.fgtTense(); }
  }
  // the threads hold it at its height (toes at the floor), less the lift of the step
  e.vy = clamp((e.rest - lift - e.y) * 12, -220, 220);
  // where the threads meet the roof: they trail the body a little, so they lean as it steps
  if (!e.anc) e.anc = [ecx, ecx, ecx];
  const M = FGT.MAR_PTS[0] || [[5, 15], [7, 3], [11, 15]];
  for (let i = 0; i < 3; i++) { const want = ecx + e.facing * (M[i][0] - 8 + (i - 1) * 2); e.anc[i] = Math.abs(e.anc[i] - want) > 40 ? want : approach(e.anc[i], want, 48 * dt); }
};

/* ================= the sower ================= */
const fgtSeeds = [], fgtSpikes = [];
// a high spot nearby in sight of the hero, not too close to him (tile column x, floor row y)
function fgtHighSpot(e) {
  const hT = Math.ceil(e.h / T), ecx = e.x + e.w / 2, tx0 = Math.floor(ecx / T), fy0 = Math.floor((e.y + e.h + 1) / T);
  const pcx = pl.x + pl.w / 2, pcy = pl.y + 6;
  let best = null, bs = -1e9;
  for (let x = tx0 - 7; x <= tx0 + 7; x++) for (let y = fy0 - 6; y <= fy0 + 2; y++) {
    if (!navStand(x, y, hT) || fgtWet((x + 0.5) * T, (y - 0.5) * T)) continue;
    const hx = (x + 0.5) * T, hy = y * T - e.h + 3, d = Math.hypot(hx - pcx, hy - pcy);
    if (d < 44 || d > 210) continue;
    let sc = (fy0 - y) * 3 - Math.abs(x - tx0) * 0.6;
    if (losClear(hx, hy, pcx, pcy)) sc += 10;
    if (sc > bs) { bs = sc; best = { x, y }; }
  }
  return best || { x: tx0, y: fy0 };
}
function fgtThrowSeed(e) {
  const ox = e.x + e.w / 2 + e.facing * 7, oy = e.y + 2, tx = pl.x + pl.w / 2 + clamp(pl.vx, -90, 90) * 0.3, ty = pl.y + pl.h - 2;
  const t = clamp(Math.hypot(tx - ox, ty - oy) / 150, 0.5, 1.2), G = 420;
  fgtSeeds.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * G * t * t) / t, dmg: e.dmg, t: 0, life: 0, stuck: false });
  sfx.fgtPop();
}
AI.semeador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'root') { e.vx = 0; if (Math.random() < dt * 16) burst(ecx + rnd(-6, 6), e.y + e.h, 1, '#3c3444', 40, 300, 0.3); if (e.stateT <= 0) { e.state = 'rooted'; e.blindT = 0; } return; }
  if (e.state === 'uproot') { e.vx = 0; if (Math.random() < dt * 20) burst(ecx + rnd(-6, 6), e.y + e.h, 1, '#504658', 60, 300, 0.4); if (e.stateT <= 0) { e.state = 'walk'; e.spot = null; e.seekT = 0; e.reT = 0; } return; }
  if (e.state === 'aim') { e.vx = 0; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { fgtThrowSeed(e); e.state = 'shoot'; e.stateT = 0.3; } return; }
  if (e.state === 'shoot') { e.vx = 0; if (e.stateT <= 0) { e.state = 'rooted'; e.atkCD = 1.5 + Math.random() * 0.8; } return; }
  if (e.state === 'rooted') {
    e.vx = 0;
    if (aggro) e.facing = Math.sign(dx) || e.facing;
    const see = !pl.dead && dist < 230 && losClear(ecx + e.facing * 6, e.y + 2, pl.x + pl.w / 2, pl.y + 6);
    e.blindT = see ? 0 : (e.blindT || 0) + dt;
    if (!e.onGround || (aggro && (e.blindT > 2.5 || dist < 32)) || (!aggro && e.blindT > 9)) { e.state = 'uproot'; e.stateT = 1; sfx.fgtUproot(); return; }
    if (see && e.atkCD <= 0) { e.state = 'aim'; e.stateT = 0.55; sfx.fgtAim(); }
    return;
  }
  // walking: up to a high spot in sight of the hero, then down go the roots
  const wet = fgtWet(ecx, e.y + e.h - 2);
  if (!aggro) {
    fgtWand(e, dt); walk(e, dt, e.wander, 18, 300, 250, dy, false); if (e.wander) e.facing = e.wander;
    e.idleT = (e.idleT || 0) + dt;
    if (e.idleT > 7 && e.onGround && !wet) { e.idleT = 0; e.state = 'root'; e.stateT = 0.8; sfx.fgtRoot(); }
    return;
  }
  e.seekT = (e.seekT || 0) + dt; e.reT = (e.reT || 0) - dt;
  if (!e.spot || e.reT <= 0) { e.spot = fgtHighSpot(e); e.reT = 1.2; }
  const ddx = (e.spot.x + 0.5) * T - ecx, there = Math.abs(ddx) < 4;
  if ((there || e.seekT > 5) && e.onGround && !wet && Math.abs(e.vx) < 30) { e.state = 'root'; e.stateT = 0.8; e.seekT = 0; e.facing = Math.sign(dx) || e.facing; sfx.fgtRoot(); return; }
  const dir = there ? 0 : Math.sign(ddx);
  if (dir) e.facing = dir;
  walk(e, dt, dir, 34 + e.lvl, 500, 280, 0, false);
};

/* ================= the spore moth ================= */
// what draws the moths: placed torches, lamps, lantern mushrooms, candles; anything else that glows a good deal
const FGT_LURE = new Float32Array(NT);
FGT_LURE[TORCH] = 1; FGT_LURE[CANDLE] = 0.8; FGT_LURE[FG_LANTERNA] = 0.75; FGT_LURE[FG_LAMPIAO] = 0.9;
// props that give light (122's lamps) can be added by wrapping this: add(x, y, strength) in pixels
function fungMothLights(cx, cy, R, add) { }
const fgtCurtains = [];
function fgtBestLight(e) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, tx0 = Math.floor(ecx / T), ty0 = Math.floor(ecy / T), R = 12, old = e.lure;
  let best = null, bs = 0.05;
  // the light it is already circling counts a little more (no flitting between two)
  const keep = (x, y) => old && Math.abs(old.x - x) < 8 && Math.abs(old.y - y) < 8 ? 0.06 : 0;
  for (let y = ty0 - R; y <= ty0 + R; y++) for (let x = tx0 - R; x <= tx0 + R; x++) {
    const t = tileAt(x, y), v = FGT_LURE[t] || (EMIT[t] >= 0.5 ? EMIT[t] : 0);
    if (!v) continue;
    const sc = v - 0.04 * Math.hypot(x - tx0, y - ty0) + keep((x + 0.5) * T, (y + 0.5) * T);
    if (sc > bs) { bs = sc; best = { x: (x + 0.5) * T, y: (y + 0.5) * T, hero: false }; }
  }
  fungMothLights(ecx, ecy, R * T, (x, y, v) => { const sc = v - 0.04 * Math.hypot(x - ecx, y - ecy) / T + keep(x, y); if (sc > bs) { bs = sc; best = { x, y, hero: false }; } });
  if (!pl.dead) {   // the hero's own light (more of it with a lit helmet; a moth that was hit wants him)
    const hx = pl.x + pl.w / 2, hy = pl.y + 6, d = Math.hypot(hx - ecx, hy - ecy) / T;
    if (d < 16) { const sc = 0.6 + 0.1 * (pl.light || 0) + (e.angryT > 0 ? 0.5 : 0) - 0.04 * d + (old && old.hero ? 0.06 : 0); if (sc > bs) { bs = sc; best = { x: hx, y: hy, hero: true }; } }
  }
  return best;
}
AI.mariposa = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.angryT = (e.angryT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (e.state === 'lit') {   // stopped over the hero, wings lit: the dust is coming
    const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k;
    if (Math.random() < dt * 18) fgtSpore(ecx + rnd(-10, 10), ecy + rnd(-6, 4), rnd(-6, 6), rnd(-10, 4), 0.5);
    if (e.stateT <= 0) { fgtCurtain(e); e.state = 'dust'; e.stateT = 0.5; sfx.fgtDust(); }
    return;
  }
  if (e.state === 'dust') { const k = Math.pow(0.05, dt); e.vx *= k; e.vy *= k; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random() * 1.2; e.retreat = 0.7; } return; }
  e.lureT = (e.lureT || 0) - dt;
  if (e.lureT <= 0) { e.lureT = 0.4 + Math.random() * 0.2; e.lure = fgtBestLight(e); }
  const L = e.lure;
  let tx, ty, sp;
  if (e.state === 'hover') {   // settling right over the hero
    tx = pl.x + pl.w / 2 - ecx; ty = pl.y - 22 - ecy; sp = 60 + e.lvl;
    if ((Math.abs(tx) < 5 && Math.abs(ty) < 8) || e.stateT <= 0) { e.state = 'lit'; e.stateT = 0.7; sfx.fgtGlow(); return; }
  } else if (L) {   // wide, slow circles round the light
    e.ang = (e.ang || e.seed) + dt * (0.8 + (e.seed % 1) * 0.3);
    const R = 30 + (e.seed % 8);
    tx = L.x + Math.cos(e.ang) * R - ecx; ty = L.y - 24 + Math.sin(e.ang) * R * 0.45 - ecy; sp = 40 + e.lvl;
  } else { tx = Math.cos(e.t * 0.4 + e.seed) * 50; ty = Math.sin(e.t * 0.7 + e.seed) * 20; sp = 20; }
  if (e.retreat > 0) { e.retreat -= dt; ty -= 40; }
  const d = Math.hypot(tx, ty) || 1, f = Math.min(1, d / 20), k = Math.min(1, dt * 1.6);
  e.vx = lerp(e.vx, tx / d * sp * f, k); e.vy = lerp(e.vy, ty / d * sp * f + Math.sin(e.t * 7 + e.seed) * 14, k);
  if (fgtWet(ecx, ecy + 8)) e.vy = Math.min(e.vy, -45);   // keeps out of the water
  if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
  if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
  if (Math.random() < dt * 2) fgtSpore(ecx + rnd(-4, 4), ecy + 3, rnd(-3, 3), rnd(4, 10), 1);
  e.flapT = (e.flapT || 0) - dt; if (e.flapT <= 0) { e.flapT = 0.9 + Math.random() * 0.6; if (dist < 140) sfx.fgtFlutter(); }
  // the hero right under it (in its light, or close by): settle over him
  if (e.state === 'walk' && !pl.dead && e.atkCD <= 0 && e.retreat <= 0 && ((L && L.hero) || dist < 50) && Math.abs(dx) < 50 && dy > 8 && dy < 80 && losClear(ecx, ecy, pl.x + pl.w / 2, pl.y + 4)) { e.state = 'hover'; e.stateT = 0.7; }
};
// the dust curtain: falls from the moth to the floor, two blocks wide
function fgtCurtain(e) {
  const x = e.x + e.w / 2, top = e.y + e.h; let ty = Math.floor(top / T), k = 0;
  while (k < 14 && !solidAt(Math.floor(x / T), ty)) { ty++; k++; }
  fgtCurtains.push({ x, top, bottom: ty * T, t: 0, dmg: e.dmg, src: e, hit: false });
}

/* ================= the mycelium carpet =================
   It lives in a free cell, against one of its four sides (cur = { x, y, s }; s: 0 floor, 1 wall to the right, 2 roof,
   3 wall to the left) and creeps cell to cell at a block a second: on along the surface, up a wall it meets, or round
   an edge it comes to. */
const FGT_SD = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const FGT_ANG = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
const fgtSideOf = (x, y) => y > 0 ? 0 : x > 0 ? 1 : y < 0 ? 2 : 3;
const fgtPatchPt = c => [(c.x + 0.5 + FGT_SD[c.s][0] * 0.25) * T, (c.y + 0.5 + FGT_SD[c.s][1] * 0.25) * T];
function fgtNext(c, mx, my) {
  const [sx, sy] = FGT_SD[c.s];
  if (solidAt(c.x + mx, c.y + my)) return { x: c.x, y: c.y, s: fgtSideOf(mx, my), dur: 0.6, kind: 'in' };   // a wall ahead: onto it
  if (solidAt(c.x + mx + sx, c.y + my + sy)) return { x: c.x + mx, y: c.y + my, s: c.s, dur: 1, kind: 'on' };
  return { x: c.x + mx + sx, y: c.y + my + sy, s: fgtSideOf(-mx, -my), dur: 1.3, kind: 'out', mx, my };   // round the edge
}
// put the body where it is between two cells (and turn it)
function fgtTapPlace(e) {
  const c = e.cur, n = e.nxt, p = e.prog || 0;
  let [x, y] = fgtPatchPt(c), a = FGT_ANG[c.s], s = c.s;
  if (n) {
    const [x1, y1] = fgtPatchPt(n), a1 = FGT_ANG[n.s];
    let da = a1 - a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    if (n.kind === 'out') {   // round the corner, hugging it
      const kx = x + n.mx * 0.75 * T, ky = y + n.my * 0.75 * T;
      if (p < 0.5) { x = lerp(x, kx, p * 2); y = lerp(y, ky, p * 2); a += da * Math.max(0, p - 0.3) * 1.25; }
      else { x = lerp(kx, x1, p * 2 - 1); y = lerp(ky, y1, p * 2 - 1); a += da * Math.min(1, (p - 0.3) * 1.25); }
    } else { x = lerp(x, x1, p); y = lerp(y, y1, p); a += da * p; }
    if (p > 0.5) s = n.s;
  }
  const flat = s === 0 || s === 2;
  e.w = flat ? 12 : 6; e.h = flat ? 6 : 12; e.x = x - e.w / 2; e.y = y - e.h / 2; e.ang = a; e.side = s;
}
function fgtTapAttach(e, prefer) {
  const tx = Math.floor((e.x + e.w / 2) / T); let ty = Math.floor((e.y + e.h / 2) / T);
  for (let k = 0; k < 4 && solidAt(tx, ty); k++) ty--;
  let fl = ty; while (fl < ty + 8 && !solidAt(tx, fl + 1)) fl++;
  let ce = ty; while (ce > ty - 8 && !solidAt(tx, ce - 1)) ce--;
  const hasF = solidAt(tx, fl + 1) && !solidAt(tx, fl), hasC = solidAt(tx, ce - 1) && !solidAt(tx, ce);
  e.nxt = null; e.prog = 0; e.vx = 0; e.vy = 0;
  if (hasC && (prefer === 'up' || (!hasF && prefer !== 'down'))) e.cur = { x: tx, y: ce, s: 2 };
  else if (hasF) e.cur = { x: tx, y: fl, s: 0 };
  else if (hasC) e.cur = { x: tx, y: ce, s: 2 };
  else { e.state = 'fall'; e.cur = null; return; }
  e.state = 'walk'; fgtTapPlace(e);
}
// is the hero where its threads can reach: standing on it, under it on the roof, or brushing it on a wall
function fgtTapReach(e, pad) {
  if (pl.dead) return false;
  const s = e.side, px = e.x + e.w / 2, py = e.y + e.h / 2, pcx = pl.x + pl.w / 2;
  if (s === 0) return overlap({ x: e.x - 2 - pad, y: e.y - 8 - pad, w: e.w + 4 + pad * 2, h: e.h + 8 + pad }, pl);
  if (s === 2) return Math.abs(pcx - px) < 9 + pad && pl.y > py && pl.y - py < 4.5 * T + pad && losClear(px, py + 4, pcx, pl.y + 2);
  return overlap(s === 1 ? { x: e.x - 8 - pad, y: e.y - 2, w: e.w + 8 + pad, h: e.h + 4 } : { x: e.x, y: e.y - 2, w: e.w + 8 + pad, h: e.h + 4 }, pl);
}
AI.tapete = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.seenT = (e.seenT || 0) - dt;
  if (e.state === 'fall') {   // knocked loose (its rock dug away): drops onto whatever is below
    e.fvy = Math.min((e.fvy || 0) + GRAV * dt, fgtWet(e.x + e.w / 2, e.y) ? 50 : MAXFALL); e.vx = 0; e.vy = 0;   // its own fall (phase: the loop doesn't collide it)
    const ny = e.y + e.fvy * dt;
    if (rectSolid(e.x, ny, e.w, e.h)) { e.y = Math.floor((ny + e.h) / T) * T - e.h; e.fvy = 0; fgtTapAttach(e, 'down'); burst(e.x + e.w / 2, e.y + e.h, 5, '#9a9480', 40, 200, 0.3); }
    else e.y = ny;
    return;
  }
  const c = e.cur;
  if (!c || solidAt(c.x, c.y) || !solidAt(c.x + FGT_SD[c.s][0], c.y + FGT_SD[c.s][1])) { e.state = 'fall'; e.cur = null; e.nxt = null; e.w = 12; e.h = 6; e.fvy = 0; return; }
  if (e.nxt && solidAt(e.nxt.x, e.nxt.y)) { e.nxt = null; e.prog = 0; }
  if (e.state === 'snap') {   // the threads rise and snap
    if (e.side === 2) e.reachL = clamp(pl.y + 4 - (e.y + e.h), 4, 4.5 * T + 4);
    if (Math.random() < dt * 20) fgtFiber(e.x + rnd(0, e.w), e.y + e.h / 2, rnd(-10, 10), rnd(-20, 20), 0.3);
    if (e.stateT <= 0) {
      if (fgtTapReach(e, 4)) {
        const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false);
        if (r === 'hit') { if (typeof fungColar === 'function') fungColar(2); if (typeof fungLentidao === 'function') fungLentidao(0.5, 2); }
        e.state = 'bite'; e.stateT = 0.35; sfx.fgtBite();
      } else { e.state = 'rest'; e.stateT = 0.8; }
    }
    fgtTapPlace(e); e.vx = 0; e.vy = 0; return;
  }
  if (e.state === 'bite') { if (e.stateT <= 0) { e.state = 'rest'; e.stateT = 1.2; e.atkCD = 1.4; } fgtTapPlace(e); e.vx = 0; e.vy = 0; return; }
  if (e.state === 'rest') { if (e.stateT <= 0) e.state = 'walk'; fgtTapPlace(e); e.vx = 0; e.vy = 0; return; }
  // creeping
  if (e.nxt) { e.prog += dt / e.nxt.dur; if (e.prog >= 1) { e.cur = e.nxt; e.nxt = null; e.prog = 0; } }
  if (!e.nxt) {
    const [sx, sy] = FGT_SD[e.cur.s], opts = sx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
    let m = null;
    if (aggro && dist < 170) {   // the way that brings it closer to where the hero's feet are
      const gx = pl.x + pl.w / 2, gy = pl.y + pl.h - 3; let bd = 1e9;
      const [cx0, cy0] = fgtPatchPt(e.cur), here = Math.hypot(cx0 - gx, cy0 - gy);
      for (const o of opts) { const n = fgtNext(e.cur, o[0], o[1]); if (solidAt(n.x, n.y)) continue; const [x, y] = fgtPatchPt(n), d = Math.hypot(x - gx, y - gy) - (e.mv && e.mv[0] === o[0] && e.mv[1] === o[1] ? 4 : 0); if (d < bd) { bd = d; m = o; } }
      if (here < 5) m = null;
    } else {
      e.wtimer -= dt;
      if (!e.mv || e.wtimer <= 0) { e.mv = opts[Math.random() < 0.5 ? 0 : 1]; e.wtimer = 3 + Math.random() * 4; }
      m = opts.find(o => o[0] === e.mv[0] && o[1] === e.mv[1]) || opts[0];
    }
    if (m) { const n = fgtNext(e.cur, m[0], m[1]); if (!solidAt(n.x, n.y)) { e.nxt = n; e.prog = 0; e.mv = m; if (m[0]) e.facing = m[0]; } else e.mv = [-m[0], -m[1]]; }
  }
  fgtTapPlace(e); e.vx = 0; e.vy = 0;
  if (e.atkCD <= 0 && fgtTapReach(e, 0)) { e.state = 'snap'; e.stateT = 0.5; e.seenT = 3; e.reachL = 4; sfx.fgtCrackle(); }
};

/* ================= drawing ================= */
DRAW_E.colono = (e, fx, fy, fl) => {
  const B = FGT.get(), st = e.state, shud = st === 'walk' && e.trem;
  const k = st === 'swell' ? 4 : st === 'reach' || st === 'retract' ? 5 : st === 'stuck' ? 6 : st === 'lurch' ? 2 + (Math.floor(e.t * 9) % 2) : shud ? 1 : 0;
  const j = shud ? (Math.floor(e.t * 30) % 2 ? 1 : -1) : st === 'swell' ? Math.round(Math.sin(e.t * 40) * 0.6) : st === 'stuck' ? Math.round(Math.sin(e.t * 25)) : 0;
  lc.drawImage(cvPick(B.colono[k], e, fl), fx - 8 + j, fy - 23);
  if (k >= 5 && e.armL > 1) {
    const A = st === 'stuck' ? B.armS : B.armR, img = cvPick(A[clamp(Math.round(e.armL / 4) - 1, 0, A.length - 1)], e, fl);
    lc.drawImage(img, e.facing > 0 ? fx + 4 + j : fx - 4 - img.width + j, fy - 16);
  }
};
DRAW_E.marionete = (e, fx, fy, fl) => {
  const B = FGT.get(), st = e.state;
  if (fgtFallen(e)) {
    const a0 = lc.globalAlpha; if (e.dieT < 1.5 && !fl) lc.globalAlpha = a0 * (Math.floor(e.t * 12) % 2 ? 0.55 : 1);
    if (st === 'fall') lc.drawImage(cvPick(B.mar[0], e, fl), fx - 8, fy - 23);
    else { const k = st === 'grab' || st === 'claw' ? 2 : Math.abs(e.vx) > 3 ? Math.floor(e.t * 3) % 2 : 0; lc.drawImage(cvPick(B.marC[k], e, fl), fx - 12, fy - 10); }
    lc.globalAlpha = a0; return;
  }
  const k = st === 'tense' ? 3 : st === 'kick' ? (e.stateT > 0.25 ? 4 : 5) : e.stepT > 0 ? (e.stepT > 0.3 ? 1 : 2) : 0;
  // the threads first, behind her: from the roof down to her wrists and the back of her head
  if (e.anc && e.roofY !== undefined) {
    const M = FGT.MAR_PTS[k], camX = Math.round(e.x + e.w / 2) - fx, camY = Math.round(e.y + e.h) - fy, ry = Math.round(e.roofY) - camY;
    const taut = st === 'tense' || st === 'kick';
    lc.fillStyle = taut ? (Math.floor(e.t * 20) % 2 ? '#c8f0b0' : '#86d07a') : '#8a8472';
    const a0 = lc.globalAlpha; if (!taut) lc.globalAlpha = a0 * 0.75;
    for (let i = 0; i < 3; i++) { const [px, py] = M[i], sx = e.facing > 0 ? fx - 8 + px : fx + 8 - px, sy = fy - 23 + py; fgtLine(Math.round(e.anc[i]) - camX, ry, sx, sy); }
    lc.globalAlpha = a0;
  }
  lc.drawImage(cvPick(B.mar[k], e, fl), fx - 8, fy - 23);
};
DRAW_E.semeador = (e, fx, fy, fl) => {
  const B = FGT.get(), st = e.state, rooted = st === 'rooted' || st === 'aim' || st === 'shoot';
  const rk = st === 'root' ? clamp(Math.floor((1 - e.stateT / 0.8) * 4), 0, 3) : st === 'uproot' ? clamp(Math.floor(e.stateT * 4), 0, 3) : rooted ? 3 : -1;
  if (rk >= 0) lc.drawImage(cvPick(B.roots[rk], e, fl), fx - 10, fy - 2);
  const k = st === 'aim' ? 4 : st === 'shoot' ? 5 : st === 'uproot' ? 6 : rooted || st === 'root' ? 3 : Math.abs(e.vx) > 5 && e.onGround ? 1 + (Math.floor(e.t * 6) % 2) : 0;
  const j = st === 'uproot' ? Math.round(Math.sin(e.t * 34)) : st === 'aim' ? Math.round(Math.sin(e.t * 50) * 0.5) : 0;
  lc.drawImage(cvPick(B.sem[k], e, fl), fx - 10 + j, fy - 24);
};
DRAW_E.mariposa = (e, fx, fy, fl) => {
  const B = FGT.get().moth, st = e.state, k = st === 'lit' ? 3 : st === 'dust' ? (Math.floor(e.t * 20) % 2 ? 4 : 2) : [0, 1, 2, 1][Math.floor(e.t * 9) % 4];
  const bob = st === 'lit' ? 0 : Math.round(Math.sin(e.t * 3 + e.seed) * 1.2);
  lc.drawImage(cvPick(B[k], e, fl), fx - 13, fy - e.h / 2 - 9 + bob);
};
DRAW_E.tapete = (e, fx, fy, fl) => {
  const B = FGT.get().tap, st = e.state;
  const k = st === 'snap' ? (e.stateT > 0.25 ? 2 : 3) : st === 'bite' ? 4 : Math.floor(e.t * 1.5) % 2;
  const px = fx, py = fy - e.h / 2, a = e.ang || 0;
  const hid = (st === 'walk' || st === 'fall') && e.seenT <= 0 && !fl, a0 = lc.globalAlpha;
  if (hid) lc.globalAlpha = a0 * 0.42;
  cvRot(cvPick(B[k], e, fl), Math.round(px + Math.sin(a) * 3), Math.round(py - Math.cos(a) * 3), a);
  lc.globalAlpha = a0;
  // from the roof the threads reach all the way down to the hero
  if (e.side === 2 && (st === 'snap' || st === 'bite') && e.reachL > 6) {
    const L = st === 'bite' ? e.reachL : e.reachL * clamp((0.5 - e.stateT) / 0.4, 0, 1);
    lc.fillStyle = st === 'bite' ? '#e6dec4' : '#c4bca2';
    for (let i = 0; i < 5; i++) { const x0 = px - 5 + i * 2.5; let x = x0; for (let y = 0; y < L; y++) { x = x0 + Math.sin(y * 0.3 + i * 2 + e.t * 8) * (st === 'bite' ? 0.6 : 1.2) - (x0 - px) * (y / Math.max(1, L)) * 0.6; lc.fillRect(Math.round(x), Math.round(py + 3 + y), 1, 1); } }
  }
};
EYES_E.colono = (e, fx, fy) => { lc.globalAlpha = 0.3; lc.drawImage(SPR.glow.eye, fx + e.facing * 3 - 6, fy - 24); };
EYES_E.marionete = () => { };
EYES_E.semeador = (e, fx, fy) => { if (e.state === 'uproot') return; lc.globalAlpha = e.state === 'aim' ? 0.9 : 0.5; lc.drawImage(FGT.GL.tealS, fx + e.facing * 4 - 6, fy - 15 - 6); };
EYES_E.mariposa = () => { };
EYES_E.tapete = () => { };
WARN_E.colono = e => e.state === 'swell';
WARN_E.marionete = e => e.state === 'tense' || e.state === 'grab';
WARN_E.semeador = e => e.state === 'aim';
WARN_E.mariposa = e => e.state === 'lit';
WARN_E.tapete = e => e.state === 'snap';

/* ---------- blows, the threads, the effects ---------- */
// what the hero's blade swept this frame (the puppet's threads can be cut with it)
let fgtBlade = null;
{ const _bs = bladeSweep; bladeSweep = function () { const r = _bs.apply(this, arguments); fgtBlade = r; return r; }; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead) {
    if (e.type === 'semeador' && e.state === 'uproot') mult *= 1.5;   // pulling its roots out, it can't guard
  }
  const st = e && e.state, r = _hit(e, dir, mult, melee);
  if (e && !e.dead) {
    if (e.type === 'semeador' && (st === 'root' || st === 'rooted' || st === 'aim' || st === 'shoot')) { e.vx = 0; e.vy = 0; e.stun = 0; }   // rooted: it doesn't budge
    else if (e.type === 'colono' && (st === 'reach' || st === 'stuck' || st === 'retract')) { e.vx = 0; e.stun = 0; }
    else if (e.type === 'tapete') { e.vx = 0; e.vy = 0; e.seenT = 3; }
    else if (e.type === 'mariposa') e.angryT = 6;
    else if (e.type === 'marionete' && melee && !fgtFallen(e) && pl.y + pl.h < e.y + 8) fgtCut(e);   // a blow from above cuts the threads
  }
  return r;
}; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp(dmg, srcX, src, isProj);
  if (src && (r === 'block' || r === 'parry')) {
    if (src.type === 'colono' && src.state === 'reach') { src.state = 'retract'; src.stateT = 0.3; }
    else if (src.type === 'marionete' && src.state === 'kick') src.k1 = src.k2 = true;
  }
  return r;
}; }
// the puppet's threads cut by a blade or a shot passing through them
function fgtThreadHit(e, x, y) {
  if (e.roofY === undefined || !e.anc || y < e.roofY - 2 || y > e.y - 6) return false;   // only above its head
  const x0 = Math.min(e.anc[0], e.anc[2], e.x) - 3, x1 = Math.max(e.anc[0], e.anc[2], e.x + e.w) + 3;
  return x >= x0 && x <= x1;
}
function fgtUpdate(dt) {
  const any = enemies.length > 0;
  // the puppets' threads
  if (any) for (const e of enemies) {
    if (e.dead || e.type !== 'marionete' || fgtFallen(e)) continue;
    if (fgtBlade && fgtBlade.some(q => fgtThreadHit(e, q[0], q[1]))) { fgtCut(e); continue; }
    for (const p of projs) if (p.owner !== 'enemy' && fgtThreadHit(e, p.x, p.y)) { fgtCut(e); break; }
  }
  fgtBlade = null;
  // seeds in flight, seeds stuck and blinking, spikes
  for (let i = fgtSeeds.length - 1; i >= 0; i--) {
    const s = fgtSeeds[i];
    if (!s.stuck) {
      s.vy = Math.min(s.vy + 420 * dt, 400); s.life += dt;
      const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt, ctx = Math.floor(nx / T), cty = Math.floor(ny / T);
      if (solidAt(ctx, cty)) {   // sticks to the face it came through
        const ox = Math.floor(s.x / T), oy = Math.floor(s.y / T);
        if (ox !== ctx && !solidAt(ox, cty)) { s.nx = ox < ctx ? -1 : 1; s.ny = 0; s.x = ox < ctx ? ctx * T - 0.5 : (ctx + 1) * T + 0.5; s.y = ny; }
        else { s.nx = 0; s.ny = oy < cty ? -1 : 1; s.y = oy < cty ? cty * T - 0.5 : (cty + 1) * T + 0.5; s.x = nx; }
        s.stuck = true; s.t = 1; s.cx = ctx; s.cy = cty; sfx.fgtStick();
        burst(s.x, s.y, 4, '#a0686c', 40, 200, 0.3);
      } else { s.x = nx; s.y = ny; if (s.life > 4 || s.y > WH * T) fgtSeeds.splice(i, 1); }
      continue;
    }
    s.t -= dt;
    if (!solidAt(s.cx, s.cy)) { burst(s.x, s.y, 4, '#a0686c', 40, 200, 0.3); fgtSeeds.splice(i, 1); continue; }
    if (s.t <= 0) {   // the spike: a block of thorn out of the surface
      fgtSeeds.splice(i, 1);
      const k = { x: s.x, y: s.y, nx: s.nx, ny: s.ny, t: 0, dmg: s.dmg, hit: false };
      fgtSpikes.push(k); sfx.fgtBurst();
      burst(s.x + s.nx * 6, s.y + s.ny * 6, 10, '#c4bca2', 90, 300, 0.4); burst(s.x, s.y, 5, '#7accc0', 60, 100, 0.4, 1, true);
    }
  }
  for (let i = fgtSpikes.length - 1; i >= 0; i--) {
    const k = fgtSpikes[i]; k.t += dt;
    if (!k.hit && k.t < 0.2 && !pl.dead) {
      const hb = k.ny ? { x: k.x - 5, y: k.ny < 0 ? k.y - 12 : k.y, w: 10, h: 12 } : { x: k.nx > 0 ? k.x : k.x - 12, y: k.y - 5, w: 12, h: 10 };
      if (overlap(hb, pl)) { k.hit = true; const r = hurtPlayer(k.dmg, k.x, null, true); if (r === 'hit' && k.ny < 0) pl.vy = Math.min(pl.vy, -200); }
    }
    if (k.t > 0.8) { burst(k.x + k.nx * 5, k.y + k.ny * 5, 5, '#9a9480', 30, 200, 0.4); fgtSpikes.splice(i, 1); }
  }
  // the moths' dust curtains
  for (let i = fgtCurtains.length - 1; i >= 0; i--) {
    const c = fgtCurtains[i]; c.t += dt;
    const front = Math.min(c.bottom, c.top + 160 * c.t);
    if (!c.hit && c.t < 1.1 && !pl.dead && overlap({ x: c.x - 12, y: c.top, w: 24, h: front - c.top }, pl)) {
      c.hit = true; const r = hurtPlayer(c.dmg, c.x, c.src, true);
      if ((r === 'hit' || r === 'block') && typeof fungEsporar === 'function') fungEsporar(Math.max(1, Math.round(c.dmg * 0.2)), 3);
    }
    if (c.t < 1) for (let n = 0; n < 3; n++) if (Math.random() < dt * 25) fgtSpore(c.x + rnd(-12, 12), rnd(c.top, front), rnd(-4, 4), rnd(50, 90), 0.5);
    if (c.t > 1.4) fgtCurtains.splice(i, 1);
  }
}
HOOK.update.push(fgtUpdate);
HOOK.drawWorld.push((cx, cy) => {
  const B = FGT.get();
  for (const s of fgtSeeds) {
    const x = Math.round(s.x) - cx, y = Math.round(s.y) - cy;
    if (!s.stuck) { lc.drawImage(B.seed.r, x - 2, y - 2); continue; }
    const blink = Math.floor((1 - s.t) * (s.t < 0.4 ? 18 : 8)) % 2;
    lc.drawImage(blink ? B.seed.wr : B.seed.r, x - 2 + s.nx, y - 2 + s.ny);
  }
  for (const k of fgtSpikes) {
    const img = B.spike.r, h = img.height, rise = Math.min(1, k.t / 0.07), sh = Math.max(1, Math.round(h * rise)), a = k.ny < 0 ? 0 : k.ny > 0 ? Math.PI : k.nx > 0 ? Math.PI / 2 : -Math.PI / 2;
    const a0 = lc.globalAlpha; if (k.t > 0.6) lc.globalAlpha = a0 * (1 - (k.t - 0.6) / 0.2);
    lc.save(); lc.translate(Math.round(k.x) - cx, Math.round(k.y) - cy); lc.rotate(a); lc.drawImage(img, 0, 0, img.width, sh, -img.width / 2, -sh, img.width, sh); lc.restore();
    lc.globalAlpha = a0;
  }
  for (const c of fgtCurtains) {   // streaks of falling spores, ragged at the front
    const front = Math.min(c.bottom, c.top + 160 * c.t), a = c.t < 1 ? 0.2 : 0.2 * (1 - (c.t - 1) / 0.4);
    if (a <= 0) continue;
    lc.fillStyle = `rgba(160,200,188,${a.toFixed(3)})`;
    const x0 = Math.round(c.x - 12) - cx, y0 = Math.round(c.top) - cy, h = front - c.top;
    for (let i = 0; i < 12; i++) { const k = hash2(i, 7, 23701), l = Math.round(h * (0.7 + k * 0.3)); if (l > 0) lc.fillRect(x0 + i * 2, y0, 1 + (i % 2), l); }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = FGT.GL;
  for (const e of enemies) {
    if (e.dead) continue;
    const x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy;
    if (e.type === 'colono') {
      if (e.state === 'swell') { lc.globalAlpha = 0.5 + Math.sin(gameTime * 30) * 0.2; lc.drawImage(G.green, x - e.facing * 7 - 14, e.y - cy + 9 - 14); }
      else if (e.state === 'reach' || e.state === 'stuck') { lc.globalAlpha = 0.35; lc.drawImage(G.green, x + e.facing * (6 + e.armL) - 14, e.y - cy + 9 - 14); }
    } else if (e.type === 'semeador') {   // the lantern-cap
      lc.globalAlpha = e.state === 'aim' ? 0.75 : 0.4 + Math.sin(gameTime * 1.6 + e.seed) * 0.08; lc.drawImage(G.teal, x - 16, e.y - cy - 6 - 16);
    } else if (e.type === 'mariposa') {
      if (e.state === 'lit' || e.state === 'dust') { lc.globalAlpha = e.state === 'lit' ? 0.5 + (1 - e.stateT / 0.7) * 0.4 : 0.45; lc.drawImage(G.dust, x - 20, y - 4 - 20); }
      else { lc.globalAlpha = 0.18; lc.drawImage(G.tealS, x - 6, y - 2 - 6); }
    } else if (e.type === 'marionete' && e.state === 'tense') { lc.globalAlpha = 0.5; lc.drawImage(G.green, x - 14, e.y - cy - 14); }
  }
  for (const s of fgtSeeds) if (s.stuck && Math.floor((1 - s.t) * (s.t < 0.4 ? 18 : 8)) % 2) { lc.globalAlpha = 0.8; lc.drawImage(G.tealS, s.x - cx - 6, s.y - cy - 6); }
  for (const c of fgtCurtains) if (c.t < 1) { lc.globalAlpha = 0.22 * (1 - c.t); const front = Math.min(c.bottom, c.top + 160 * c.t); lc.drawImage(G.dust, c.x - cx - 20, (c.top + front) / 2 - cy - 20); }
  lc.globalAlpha = 1;
});
// the lantern-cap and the lit moths light the cave a little
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'semeador') addL(e.x + e.w / 2, e.y - 2, e.state === 'aim' ? 0.55 : 0.42);
    else if (e.type === 'mariposa' && (e.state === 'lit' || e.state === 'dust')) addL(e.x + e.w / 2, e.y + e.h / 2, 0.5);
    else if (e.type === 'colono' && e.state === 'swell') addL(e.x + e.w / 2, e.y + 9, 0.35);
  }
}; }
// set up on arrival: the carpet finds its surface, the puppet its roof
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'tapete') { e.seenT = 0; fgtTapAttach(e, Math.random() < 0.35 ? 'up' : 'down'); }
  if (e && type === 'marionete') { e.stepT = 0; e.pause = 0.3; }
  if (e && type === 'colono') { e.pauseT = 0.4 + Math.random() * 0.8; e.armL = 0; }
  return e;
}; }
function clearFgtFx() { fgtSeeds.length = 0; fgtSpikes.length = 0; fgtCurtains.length = 0; fgtBlade = null; }
{ const _nw = newWorld; newWorld = function (sd, sv) { fgtLate(); clearFgtFx(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  fgtCreak() { tone(90, 0.35, 'sawtooth', 0.025, -20); noise(0.3, 0.04, 500, 'bandpass', 0, 3); },
  fgtSwell() { tone(140, 0.55, 'triangle', 0.03, 120); noise(0.5, 0.04, 700, 'lowpass', 0, 2); },
  fgtStretch() { noise(0.18, 0.07, 900, 'bandpass', 0, 1.5); tone(220, 0.16, 'sawtooth', 0.025, 380); },
  fgtStuck() { noise(0.12, 0.08, 400, 'lowpass'); tone(110, 0.1, 'square', 0.03, -60); },
  fgtRip() { noise(0.2, 0.06, 1400, 'bandpass', 0, 2); },
  fgtSquelch() { noise(0.1, 0.05, 600, 'lowpass', 0, 2); tone(70, 0.1, 'sine', 0.04, -20); },
  fgtTense() { tone(300, 0.5, 'triangle', 0.02, 500); tone(450, 0.45, 'sine', 0.015, 700, 0.03); },
  fgtKick() { noise(0.12, 0.06, 1800, 'bandpass', 0, 1.2); },
  fgtTap() { noise(0.04, 0.03, 900, 'lowpass'); },
  fgtSnap() { tone(1400, 0.08, 'square', 0.025, -900); tone(900, 0.1, 'square', 0.02, -600, 0.05); noise(0.15, 0.04, 3000, 'highpass'); },
  fgtThud() { tone(60, 0.15, 'sine', 0.06, -20); noise(0.12, 0.05, 300, 'lowpass'); },
  fgtRoot() { noise(0.7, 0.06, 260, 'lowpass', 0, 1.5); tone(55, 0.6, 'sine', 0.04, -15); },
  fgtUproot() { for (let k = 0; k < 4; k++) noise(0.12, 0.06, 500, 'lowpass', k * 0.22, 2); },
  fgtAim() { tone(180, 0.5, 'sine', 0.03, 160); noise(0.4, 0.03, 900, 'bandpass', 0, 4); },
  fgtPop() { tone(240, 0.08, 'square', 0.03, -140); noise(0.08, 0.06, 700, 'lowpass'); },
  fgtStick() { noise(0.06, 0.05, 500, 'lowpass'); },
  fgtBurst() { noise(0.18, 0.09, 1100, 'bandpass', 0, 1.2); tone(160, 0.14, 'sawtooth', 0.035, -90); },
  fgtFlutter() { noise(0.25, 0.02, 400, 'bandpass', 0, 3); noise(0.2, 0.02, 380, 'bandpass', 0.12, 3); },
  fgtGlow() { tone(520, 0.7, 'sine', 0.02, 300); tone(780, 0.6, 'sine', 0.014, 400, 0.08); },
  fgtDust() { noise(0.8, 0.05, 2600, 'highpass'); noise(0.6, 0.03, 900, 'bandpass', 0.1, 2); },
  fgtCrackle() { for (let k = 0; k < 5; k++) noise(0.03, 0.05, 2400, 'highpass', k * 0.09); },
  fgtBite() { noise(0.08, 0.08, 1000, 'lowpass'); tone(150, 0.08, 'square', 0.03, -70); }
});
