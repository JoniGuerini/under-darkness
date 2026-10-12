'use strict';

/* ================= the beasts of the petrified forest (1 of 2) =================
   Beasts of root, stone and crystal (docs/camadas/07-floresta-petrificada.md, sections 6 and 14). None moves like
   another:
   - the quartz lizard (lagartoqz) only moves while the hero has his back to it (the rule is pl.facing, not the line
     of sight); looked at, it stops dead like a statue (no animation, a glint now and then). Its eyes light up and the
     tail snaps up (0.45 s), then a short leaping bite. Turning to face it during the tell cancels it.
   - the strangling root (estrangula) never walks: a bulb stuck to a wall that GROWS a root along the floor, block by
     block, after the hero (never through a solid block). Under him the tip rises and its leaves tremble (0.6 s), then
     it grabs: held 1 s (fpPrender, 140; 145 applies it) and hurt. Two blows on the root cut it: it pulls back and the
     bulb opens, exposed, for 3 s. Closed, the bulb takes half damage; open, 1.6x.
   - the granite armadillo (tatupedra) plods; to attack it curls into a ball (stone scraping, still 0.7 s) and rolls,
     bouncing off walls (20% speed lost each time), up steps, ramps and fallen trunks. Rolling it hurts (ET touch,
     only while rolling). Head on into a trunk (bark, heartwood, giant trunk blocks) it is dizzy 1.5 s (1.5x damage).
   - the crystal moth (mariposacr) circles the strongest light near it: a lit drusa (FP_DRUSA), a torch on the wall,
     the hero while he holds a torch or wears light. Put the torch away and it drifts off to the nearest drusa. Its
     wings light up whole (0.65 s), then a fan of 5 crystal shards.
   - the stone dryad (driade) walks INSIDE the back wall, dark, where nothing reaches it, and steps out to the front
     plane only to cast: 3 crystal seeds in an arc; where each lands a circle glows 0.8 s, then a 2-block crystal
     spike sprouts for 3 s (it hurts as it sprouts).

   ---- monsters in the back plane (generic: any type can use it) ----
   e.bg = true puts a monster in the back-wall plane. While it is set:
   - drawing: drawEnemy draws it darker (e.bgK, 0..1, brightens it toward the front plane while it steps out) and lays
     the solid front blocks back over it from the chunk images, so it shows only where there is air in front of the
     wall; drawEyes and drawEnemyUI skip it (no eyes, no bar, no warning mark);
   - blows: hitEnemy ignores it; the hero's projectiles pass through it (updateProjs looks the other way);
   - physics: moveEntity does not collide it with blocks and undoes the core's gravity: the type moves the body
     itself with e.vx / e.vy (px/s). Keep ET touch off for such types (the core's touch test does not know the flag).
   - pathing: fpBgFits(x, y, hT) (a body hT cells tall with its feet in cell (x, y) has back wall behind every cell)
     and fpBgNav(e, score) (breadth-first over those cells, 8 neighbours; returns the first step toward the best
     score(x, y, steps)). The type itself decides when to set and clear e.bg.

   ---- a monster's temporary decoration (the strangling root) ----
   e.fpRoot = [{ x, y }] tile cells along the floor, kept in the monster (never in the map), drawn with it and gone
   when it dies. The hero's blade (bladeSweep) and his projectiles hit it: fpRootHit(e).

   Shared: FPB (art: FPB.get(), FPB.RP the card's ramps, FPB.GL glows), FPB_TYPES, fpWatched(e), fpHeroLight(),
   fpMothLight(e), FP_TRONCO (the blocks that stun the ball), fpbClear(). The effects lists fpShards / fpSeeds /
   fpMarks / fpSpikes are cleared on newWorld. 145 sets levels and spawn tables (estrangula: spawn it
   on a floor cell next to a wall; it finds a wall up to 3 blocks away by itself; driade: anywhere a walker fits, it
   sinks into the back wall on its own). Loads after 140-142 and before 144, 145 and 49 (BAL scales the stats). */

/* ---------- stats (level-1 bases from the card; BAL and 145's level do the rest) ---------- */
Object.assign(ET, {
  lagartoqz: { name: 'Lagarto de Quartzo', w: 15, h: 8, hp: 70, dmg: 18, xp: 24, kb: 0.55, fly: false, blood: '#8ad8cc' },
  estrangula: { name: 'Raiz Estranguladora', w: 12, h: 13, hp: 110, dmg: 14, xp: 28, kb: 0, fly: false, blood: '#c4cc6a' },
  tatupedra: { name: 'Tatu de Granito', w: 16, h: 12, hp: 130, dmg: 22, xp: 32, kb: 0.15, fly: false, blood: '#98aa9a', touch: 1 },
  mariposacr: { name: 'Mariposa de Cristal', w: 12, h: 9, hp: 34, dmg: 14, xp: 18, kb: 1.0, fly: true, blood: '#8ad8cc' },
  driade: { name: 'Dríade de Pedra', w: 9, h: 22, hp: 80, dmg: 17, xp: 28, kb: 0.45, fly: false, blood: '#8ad8cc' }
});
const FPB_TYPES = ['lagartoqz', 'estrangula', 'tatupedra', 'mariposacr', 'driade'];

/* ---------- drops (147's materials; the bases are rare: the core multiplies gear by 0.1) ---------- */
const FPB_DROPS = {
  lagartoqz: [['pocao', 0.08], ['min_platina', 0.1]],
  estrangula: [['seiva_vitrea', 0.4, 1, 2], ['pocao', 0.08], ['min_platina', 0.06]],
  tatupedra: [['casca_petrea', 0.4, 1, 2], ['pocao', 0.08], ['min_platina', 0.1], ['escudo_casca', 0.06]],
  mariposacr: [['folha_cristal', 0.4], ['pocao', 0.08], ['min_platina', 0.05], ['manto_folhas', 0.06]],
  driade: [['folha_cristal', 0.2], ['pocao', 0.08], ['min_platina', 0.08], ['manto_folhas', 0.06]]
};
for (const k of FPB_TYPES) DROPS[k] = FPB_DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { lagartoqz: 1, tatupedra: 1, driade: 1 });
Object.assign(CV_STEP, { lagartoqz: 1, tatupedra: 1, driade: 1 });

/* ================= art ================= */
/* Stone and crystal on the card's 6-tone ramps (section 12), lit from the top left, outlined where they touch air
   (CVB.set), crystal eyes. Every pose is painted once (FPB.get) and drawn from the cache. */
const FPB = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  granito: R6(['#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a']),
  casca: R6(['#221c18', '#3a3028', '#54463a', '#6e5e4e', '#8c7a66', '#ae9a84']),
  cerne: R6(['#2e2a22', '#4a4436', '#6a614c', '#8c8266', '#b0a688', '#d2caae']),
  raiz: R6(['#1e1814', '#33291f', '#4c3e2e', '#665440', '#836e56', '#a48c72']),
  cristal: R6(['#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec']),
  seiva: R6(['#2a3010', '#4a5418', '#6e7c22', '#9aa83a', '#c4cc6a', '#e6ecac']),
  musgo: R6(['#141c12', '#1e2c1a', '#2c4026', '#3e5634', '#566e46', '#72885a']),
  boca: R6(['#0c0e0c', '#161a16', '#20261e', '#2c3228', '#3a4234', '#4a5242'])
};
// stone grain: furrows that run along the body and a few pits
const furrow = (s, k = 0.5) => (x, y) => ((x + Math.round(Math.sin(y * 0.9 + s) * 1.2)) % 3 === 0 ? -0.6 * k : 0) + (hash2(x, y, s) < 0.08 ? -0.9 : 0) + (hash2(x, y, s + 1) > 0.95 ? 0.7 : 0);
// a limb along a polyline: a dark rim, then lit from the top left (as 123)
function limb(P, pts, r, R, base, s) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.7; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, 0.6); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1.2) continue; P.put(x, y, R, base + 0.8 - (dx + dy) * 0.9 + cg(x, y, s) * 0.45 + (hash2(x, y, s) < 0.07 ? -0.8 : 0)); } });
}
// a crystal shard standing out of a body: a lit left face, a dark right face, a bright tip
function shard(P, bx, by, h, lean, s) {
  for (let j = 0; j < h; j++) {
    const t = j / h, w = Math.max(0.5, 1.4 * (1 - t)), cx = bx + lean * j;
    for (let i = -w; i <= w; i += 0.5) P.put(cx + i, by - j, RP.cristal, (i < 0 ? 4 : 2.4) + t * 1.2 + (hash2(j, i * 2, s) < 0.15 ? 0.6 : 0));
  }
  P.put(bx + lean * h, by - h, RP.cristal, 5);
}
// a crystal eye: dark socket, a cold bright iris (lit = full white-blue)
function eye(P, x, y, lit) { P.put(x - 0.6, y, RP.boca, 0.4); P.put(x, y, RP.cristal, lit ? 5 : 3.6); P.put(x + 0.6, y, RP.cristal, lit ? 5 : 2.4); if (lit) P.put(x, y - 0.6, RP.cristal, 5); }

/* the quartz lizard, 24 x 12 facing right, feet on row 11: 0 still (statue), 1-2 run, 3 the tell (tail snapped up,
   eyes lit, crouched), 4 the leaping bite (stretched, jaws open) */
function lizard(pose) {
  const P = cp(24, 12), s = 14301 + pose * 3, run = pose === 1 ? 1 : pose === 2 ? -1 : 0, tell = pose === 3, leap = pose === 4;
  const by = tell ? 7.6 : leap ? 6.4 : 7, stretch = leap ? 1.2 : 0;
  // the tail: low and long, or snapped up in a curl
  if (tell) limb(P, [[5.6, by], [3, by - 2], [1.6, by - 5], [3, by - 7.4], [4.6, by - 7]], 0.9, RP.granito, 2.6, s + 1);
  else limb(P, [[5.6, by], [3, by + 0.6 + run * 0.4], [0.6, by + 1.2 - run * 0.6]], 1, RP.granito, 2.4, s + 1);
  // the far legs, in shadow
  const legF = leap ? [[15.6, by + 1], [19.6, by + 2.6]] : [[15, by + 1], [15.6 - run * 1.6, 11]], legB = leap ? [[8.4, by + 1], [4.6, by + 3]] : [[8.4, by + 1], [7.8 + run * 1.6, 11]];
  limb(P, [[legF[0][0] - 1.6, legF[0][1]], [legF[1][0] - 1.4, legF[1][1]]], 0.6, RP.granito, 1, s + 2);
  limb(P, [[legB[0][0] - 1.6, legB[0][1]], [legB[1][0] - 1.2, legB[1][1]]], 0.6, RP.granito, 1, s + 3);
  // the body: a long low slab of green granite, banded with quartz along the spine
  P.blob(11.2 + stretch * 0.6, by, 6.8 + stretch, 2.5, RP.granito, s, 2.8, furrow(s));
  for (let x = 6; x <= 16; x++) if ((x + pose) % 3 !== 0) P.put(x + stretch * 0.6, by + 1.6, RP.granito, 1.4);   // belly shade
  // the head: wedge-shaped, the jaw opening on the leap
  const hx = 18.4 + stretch * 1.4, hy = by - 0.6;
  P.blob(hx, hy, 3.2, 2, RP.granito, s + 4, 3.2, furrow(s + 4));
  for (let x = 0; x < 3; x++) P.put(hx + 2.6 + x * 0.8, hy - 0.4 + x * 0.3, RP.granito, 3.2 - x * 0.5);   // snout
  if (leap) { P.line(hx + 0.4, hy + 1.6, hx + 4.4, hy + 3.2, RP.granito, 2.2); P.line(hx + 1, hy + 0.8, hx + 3.6, hy + 1.6, RP.boca, 0.5); P.put(hx + 3, hy + 1.8, RP.cristal, 4.6); P.put(hx + 4, hy + 0.6, RP.cristal, 4.6); }
  else P.line(hx + 0.6, hy + 1, hx + 4, hy + 0.8, RP.boca, 1);
  eye(P, hx + 1, hy - 0.8, tell || leap);
  // quartz spines along the back: a row of small clear crystals
  for (let k = 0; k < 6; k++) { const x = 7 + k * 1.8 + stretch * 0.6, h = 2 + (k === 2 || k === 3 ? 1 : 0) + (tell ? 0.6 : 0); shard(P, x, by - 2.2, h, leap ? -0.25 : -0.1, s + k); }
  shard(P, hx - 0.8, hy - 1.8, 1.6, -0.2, s + 9);
  // the near legs: splayed, clawed
  limb(P, legF, 0.75, RP.granito, 2.8, s + 5); limb(P, legB, 0.75, RP.granito, 2.6, s + 6);
  for (const [lx, ly] of [legF[1], legB[1]]) { P.put(lx + 0.8, ly, RP.cerne, 3); P.put(lx - 0.6, ly, RP.cerne, 2.4); }
  return set(P.done());
}

/* the strangling root's bulb, 16 x 16, its back flat on the wall at x 0 (facing right = growing right):
   0 closed, 1 swelling (the pulse while it grows), 2 straining (the tell: leaves up, sap showing), 3 open (exposed) */
function bulb(pose) {
  const P = cp(16, 16), s = 14401 + pose * 5, open = pose === 3, sw = pose === 1 ? 0.6 : pose === 2 ? 0.4 : 0;
  // roots gripping the wall behind
  for (const [x, y, l] of [[1, 3, 4], [0.6, 8, 5], [1.4, 13, 4]]) limb(P, [[x + 3, y + 1], [x, y], [x, y - l * 0.6]], 0.55, RP.raiz, 1.8, s + x * 7 + y);
  if (open) {
    // the core: glassy lime sap, glowing, the petals peeled back
    P.blob(7.4, 10.2, 3.6, 3.8, RP.seiva, s + 1, 4, (x, y) => (hash2(x, y, s) < 0.12 ? 1 : 0));
    P.put(6.4, 8.8, RP.seiva, 5); P.put(7.2, 8.2, RP.seiva, 5);
    for (const [ax, ay, bx, by] of [[3, 11, 1.4, 4.4], [11, 11, 14.6, 5], [5, 14, 2.6, 15], [10, 14, 13.4, 15.2]]) limb(P, [[ax, ay], [(ax + bx) / 2 + (bx > ax ? 1 : -1), (ay + by) / 2], [bx, by]], 1.1, RP.raiz, 2.8, s + ax);
  } else {
    // the tuber: overlapping plates of root stone, like a fist of bark
    P.blob(7.2, 10 - sw * 0.5, 5.6 + sw, 5.4 + sw, RP.raiz, s + 1, 2.8, furrow(s + 1, 0.8));
    for (let k = 0; k < 4; k++) { const a = -0.6 + k * 0.55; for (let r = 1; r < 5.6; r += 0.5) P.put(7.2 + Math.cos(a - 1.57) * r * 0.3 + (k - 1.5) * 2.4, 10 - Math.sin(a + 1.57) * r * 0.9 + 1, RP.raiz, 1.2); }
    if (pose === 2) for (const [x, y] of [[5, 9], [9, 8.4], [7.4, 12]]) { P.put(x, y, RP.seiva, 4.6); P.put(x + 0.6, y + 0.6, RP.seiva, 3.4); }   // sap in the cracks
  }
  // a crown of crystal leaves on top (raised and spread when straining)
  const up = pose === 2 ? 1.6 : 0;
  for (const [x, a, l] of [[5.6, -2.2, 4], [7.6, -1.6, 5], [9.4, -1.0, 4], [6.8, -2.6, 3]]) {
    const ang = a + (pose === 2 ? (x - 7.5) * -0.15 : 0) - (open ? 0.2 : 0);
    for (let j = 0; j < l + up; j++) { const px = x + Math.cos(ang) * j * 0.9, py = 5 - (open ? -1 : 0) + Math.sin(ang) * j * 0.9; P.put(px, py, RP.cristal, 2.6 + j * 0.5); if (j > 0 && j < l) P.put(px + 0.6, py + 0.4, RP.cristal, 2); }
  }
  return set(P.done());
}
/* one cell of root on the floor, 12 x 6 (a gnarled run of root stone and its rootlets) in 3 variants; the tip, 12 x 8,
   tapering, with two crystal leaves; the tip reared up, 10 x 22 (two frames: the leaves tremble) */
function rootSeg(v) {
  const P = cp(12, 6), s = 14501 + v * 11;
  for (let x = 0; x < 12; x++) {
    const cy = 3.4 + Math.sin(x * 0.7 + v * 2) * 0.6, r = 1.7 + Math.sin(x * 1.3 + v) * 0.3;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) { const u = (y + 0.5 - cy) / r; P.put(x, y, RP.raiz, 3 - u * 1.6 + ((x * 3 + y + v) % 5 === 0 ? -0.9 : 0) + cg(x, y, s) * 0.5); }
  }
  for (let k = 0; k < 2; k++) { const x = 2 + hash2(k, v, s) * 8; P.line(x, 4.6, x + (k ? 1.4 : -1.2), 5.8, RP.raiz, 1.6); }
  if (v === 1) { P.put(6, 1.6, RP.cristal, 3.6); P.put(6.6, 1, RP.cristal, 4.6); }   // a crystal bud
  return set(P.done());
}
function rootTip() {
  const P = cp(12, 8), s = 14531;
  for (let x = 0; x < 9; x++) { const t = x / 9, cy = 5.4 - t * 0.8, r = 1.7 * (1 - t * 0.7); for (let y = Math.floor(cy - r); y <= cy + r; y++) { const u = (y + 0.5 - cy) / r; P.put(x, y, RP.raiz, 3.2 - u * 1.5 + cg(x, y, s) * 0.5); } }
  for (const [x, a] of [[5, -1.9], [7.4, -1.1]]) for (let j = 0; j < 4; j++) P.put(x + Math.cos(a) * j, 3.6 + Math.sin(a) * j, RP.cristal, 2.8 + j * 0.6);
  return set(P.done());
}
function rootRise(f) {
  const P = cp(12, 24), s = 14541 + f;
  const pts = [[1, 23], [3, 19], [4.6, 14], [4.4, 9], [6, 5.4]];
  limb(P, pts, 1.3, RP.raiz, 2.6, s);
  for (let k = 0; k < 3; k++) { const y = 20 - k * 4.6; P.line(pts[1][0] - 0.6, y, pts[1][0] - 2.4 + k * 0.3, y + 1.6, RP.raiz, 1.4); }
  const tr = f ? 0.35 : -0.35;
  for (const [a, l] of [[-2.4, 4], [-1.6, 5], [-0.7, 4], [-3.0, 3]]) for (let j = 1; j <= l; j++) P.put(6 + Math.cos(a + tr) * j, 5 + Math.sin(a + tr) * j, RP.cristal, 2.8 + j * 0.55);
  P.put(6.4, 4.6, RP.seiva, 5);
  return set(P.done());
}
// the root coiled round the hero's legs while he is held, 16 x 14
function rootCoil() {
  const P = cp(16, 14), s = 14551;
  for (let k = 0; k < 3; k++) { const y = 3 + k * 3.6; for (let x = 0; x < 16; x++) { const cy = y + Math.sin(x / 15 * Math.PI) * 1.6 - (x / 15) * 1.4, front = x > 2 && x < 13; P.put(x, cy, RP.raiz, (front ? 3.6 : 1.6) + cg(x, y, s) * 0.5); P.put(x, cy + 1, RP.raiz, front ? 2.4 : 1); } }
  limb(P, [[1, 14], [2, 9], [1.4, 4]], 0.9, RP.raiz, 2.4, s + 1);
  for (let j = 0; j < 4; j++) P.put(13 + j * 0.6, 2 - j * 0.5, RP.cristal, 3 + j * 0.6);
  return set(P.done());
}

/* the granite armadillo, 24 x 14 facing right, feet on row 13: 0-1 walking, 2 curling (half a ball, head tucked),
   3 dizzy (uncurled, slumped); the ball, 15 x 15, in 4 turns of its bands */
function armadillo(pose) {
  const P = cp(24, 14), s = 14601 + pose * 3, st = pose === 1 ? 1 : 0, curl = pose === 2, dizzy = pose === 3;
  if (curl) {
    P.blob(12, 7.6, 7, 6, RP.granito, s, 2.9, furrow(s));
    for (let k = -3; k <= 3; k++) for (let a = -2.6; a <= 0.6; a += 0.08) { const r = 6.6, x = 12 + Math.cos(a) * r * Math.cos(k * 0.18) + k * 1.8 * 0.2, y = 7.6 + Math.sin(a) * r; if (k % 2 === 0) P.put(12 + k * 1.9 + Math.cos(a) * 0.4, y + 0.2, RP.granito, 1.4); }
    P.blob(17.4, 11, 2, 1.6, RP.casca, s + 1, 2.2);   // the head tucked in
    eye(P, 18, 10.6, false);
    for (const x of [8, 15]) P.line(x, 12.4, x + 0.6, 13.4, RP.casca, 1.6);
    return set(P.done());
  }
  // tail, legs (far ones in shade)
  P.line(3, 9.4, 0.4, 11.6 + st * 0.4, RP.granito, 2);
  const lean = dizzy ? 1 : 0;
  for (const [x, o, v] of [[7, st, 1], [15, -st, 1], [8.6, -st, 2.4], [16.6, st, 2.4]]) { limb(P, [[x, 10.4 + lean], [x + o * 1.2, 12.6]], 0.8, RP.casca, v, s + x); P.put(x + o * 1.2 + 0.8, 12.8, RP.cerne, v + 0.6); }
  // the shell: a dome of granite bands across the back, each band lit on top and dark at its seam
  for (let y = 1; y <= 11; y++) for (let x = 2; x <= 19; x++) {
    const dx = (x + 0.5 - 10.6) / 8.6, dy = (y + 0.5 - 10 - lean) / 8.4; if (dx * dx + dy * dy > 1 || y > 10.4 + lean) continue;
    const band = Math.floor((x + 0.5) / 2.6), seam = Math.abs(((x + 0.5) / 2.6) % 1 - 0.5) > 0.42;
    P.put(x, y + lean, RP.granito, 3.4 - (dx * 0.6 + dy) * 1.2 - (seam ? 1.6 : 0) + (band % 2 ? 0.3 : -0.2) + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.05 ? -0.8 : 0));
  }
  for (let x = 4; x <= 18; x += 3) P.put(x, 3 + Math.abs(x - 11) * 0.25 + lean, RP.musgo, 3.6);   // moss in the seams
  for (let x = 3; x <= 19; x++) P.put(x, 10.6 + lean, RP.granito, 1);   // the shell's rim
  // the head: a pointed snout of bark-stone, a crystal eye, a leaf-like ear
  const hx = 20 + (dizzy ? -0.4 : 0), hy = 8.6 + lean + (dizzy ? 1 : 0);
  P.blob(hx, hy, 2.6, 2, RP.casca, s + 2, 3, furrow(s + 2));
  P.line(hx + 1.6, hy + 0.6, hx + 3.6, hy + 1.4, RP.casca, 3.4);
  P.put(hx - 1, hy - 2.2, RP.casca, 3.8); P.put(hx - 1.4, hy - 3, RP.casca, 3);
  if (dizzy) { P.put(hx + 0.4, hy - 0.6, RP.boca, 0.4); P.put(hx + 1, hy - 0.2, RP.boca, 0.4); }   // eyes crossed shut
  else eye(P, hx + 0.6, hy - 0.6, false);
  return set(P.done());
}
function ball(f) {
  const P = cp(15, 15), s = 14651, a = f * Math.PI / 8 + 0.4, ca = Math.cos(a), sa = Math.sin(a);
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
    const dx = (x + 0.5 - 7.5) / 7, dy = (y + 0.5 - 7.5) / 7, d = dx * dx + dy * dy; if (d > 1) continue;
    // the shell's bands as parallel plates across the ball, bowed by the curve, turning as it rolls
    const u = (dx * ca + dy * sa) / Math.sqrt(Math.max(0.15, 1 - (dx * -sa + dy * ca) ** 2)), b = (u + 1) * 2.6, seam = Math.abs(b % 1 - 0.5) > 0.36;
    P.put(x, y, RP.granito, 3.5 - (dx * 0.8 + dy) * 1.3 - d * 0.7 - (seam ? 2 : 0) + (Math.floor(b) % 2 ? 0.25 : -0.1) + cg(x, y, s) * 0.45 + (hash2(x, y, s) < 0.04 ? -0.8 : 0));
  }
  const t = a + 1.9; P.put(7.5 + Math.cos(t) * 5.6, 7.5 + Math.sin(t) * 5.6, RP.casca, 3.6); P.put(7.5 + Math.cos(t + 0.3) * 5, 7.5 + Math.sin(t + 0.3) * 5, RP.casca, 2.6);   // the snout tucked in
  for (const k of [0.6, 2.6, 4.4]) { const xx = 7.5 + Math.cos(a + k) * 5.4, yy = 7.5 + Math.sin(a + k) * 5.4; P.put(xx, yy, RP.musgo, 3.4); }   // moss in the seams
  return set(P.done());
}
/* the crystal moth, 20 x 15 facing right: 0-1 flapping (wings up / down), 2 wings lit whole (the tell) */
function inPoly(pts, px, py) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
function moth(pose) {
  const P = cp(22, 18), s = 14701 + pose, up = pose !== 1, lit = pose === 2;
  // a wing: a pane of crystal in a frame of stone, veins fanning from the root; lit, it burns from inside
  const wing = (pts, root, far) => {
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
      if (!inPoly(pts, x + 0.5, y + 0.5)) continue;
      const edge = !inPoly(pts, x - 0.5, y + 0.5) || !inPoly(pts, x + 1.5, y + 0.5) || !inPoly(pts, x + 0.5, y - 0.5) || !inPoly(pts, x + 0.5, y + 1.5);
      const a = Math.atan2(y + 0.5 - root[1], x + 0.5 - root[0]), r = Math.hypot(x + 0.5 - root[0], y + 0.5 - root[1]);
      const vein = r > 2.4 && Math.abs(Math.sin(a * 5)) < 0.15;
      if (edge || vein) { P.put(x, y, RP.granito, (lit ? 3.6 : 2.2) - (far ? 1 : 0) + (edge && y < root[1] ? 0.6 : 0)); continue; }
      const eyeSpot = !far && Math.hypot(x + 0.5 - (root[0] + (pts[1][0] - root[0]) * 0.55), y + 0.5 - (root[1] + (pts[1][1] - root[1]) * 0.55)) < 1.3;   // an eyespot on the near forewing
      P.put(x, y, RP.cristal, (lit ? 5 - r * 0.05 : 2.2 + (1 - y / 18) * 1.8 + (hash2(x, y, s) < 0.12 ? 0.8 : 0)) - (far ? 1 : 0) + (eyeSpot ? (lit ? 0 : 2) : 0));
    }
  };
  if (up) {
    wing([[10, 10], [5, 1.4], [9.6, 0], [13.6, 8.6]], [11, 10], true);
    wing([[9.4, 10.6], [2, 6], [3.4, 3.6], [10.6, 9.6]], [10, 10.4], false);
    wing([[11.6, 10.4], [6.6, 0.4], [12.4, 0.2], [15.4, 9.2]], [12.4, 10.2], false);
  } else {
    wing([[10.4, 11], [3.4, 17.4], [9, 17.8], [13.8, 11.4]], [11.4, 11.2], true);
    wing([[9.4, 11.4], [0.6, 13.6], [1.6, 16.4], [11, 12]], [10, 11.6], false);
    wing([[11.4, 11.4], [4.6, 17.8], [11.4, 17.8], [15.2, 11.8]], [12.6, 11.6], false);
  }
  // the body: a banded granite abdomen, a furred thorax, a round head
  limb(P, [[4.2, 11.6], [8, 11.2], [12, 10.8]], 1.3, RP.granito, 2.4, s + 1);
  for (let x = 5.2; x <= 10; x += 1.5) P.put(x, 11.8, RP.granito, 0.8);
  P.blob(13, 10.8, 1.9, 1.7, RP.granito, s + 3, 3.2);
  P.blob(15.6, 10.2, 1.7, 1.6, RP.granito, s + 2, 3.4);
  eye(P, 16.4, 9.8, lit);
  for (const [a, l] of [[-0.8, 5], [-1.15, 5]]) for (let j = 1; j <= l; j++) P.put(16 + Math.cos(a) * j, 9 + Math.sin(a) * j, j >= l - 1 ? RP.cristal : RP.granito, j >= l - 1 ? 4.4 : 2.4);   // feathered antennae
  for (const x of [12.4, 14]) P.line(x, 12, x + 0.8, 13.8, RP.granito, 1.6);   // legs tucked
  return set(P.done());
}

/* the stone dryad, 18 x 28 facing right, feet on row 27: 0 standing, 1-2 walking, 3 casting (both arms raised, three
   seeds glowing over the hands), 4 throwing (arm swept forward), 5 stepping out of / into the wall (half sunk: the
   body breaking up into the bark) */
function dryad(pose) {
  const P = cp(18, 28), s = 14801 + pose * 7, st = pose === 1 ? 1 : pose === 2 ? -1 : 0, cast = pose === 3, thr = pose === 4, sink = pose === 5;
  const Y = 2;   // headroom for the raised hands
  // hair: long strands of crystal leaves falling down the back
  for (let k = 0; k < 6; k++) { const x = 8.4 - k * 0.45, y0 = 3.4 + Y + k * 0.5, l = 7 + (k % 3) * 2; for (let j = 0; j < l; j++) { const xx = x - j * 0.16 + Math.sin(j * 0.9 + k) * 0.3; P.put(xx, y0 + j, RP.cristal, 3.6 - j * 0.2 + (k % 2) * 0.4 + (hash2(k, j, s) < 0.15 ? 0.8 : 0) - (k > 3 ? 0.6 : 0)); } }
  // the far arm (a thin branch)
  if (cast) limb(P, [[8, 10.4 + Y], [9.4, 6 + Y], [11.4, 1.6 + Y]], 0.7, RP.casca, 1.4, s + 1);
  else if (thr) limb(P, [[8, 10.4 + Y], [6.4, 13.6 + Y], [5.4, 16 + Y]], 0.7, RP.casca, 1.4, s + 1);
  else limb(P, [[8, 10.4 + Y], [7.2 - st * 0.6, 14.6 + Y], [7.4 - st, 18.2 + Y]], 0.7, RP.casca, 1.4, s + 1);
  // legs: roots of stone, the far one in shade, splaying into rootlet toes
  limb(P, [[8.4, 17.6 + Y], [8 - st * 1.4, 21.6 + Y], [7.4 - st * 2, 24.6 + Y]], 0.9, RP.raiz, 1.6, s + 2);
  limb(P, [[10.2, 17.6 + Y], [10.6 + st * 1.4, 21.6 + Y], [11 + st * 2, 24.6 + Y]], 0.95, RP.raiz, 2.8, s + 3);
  for (const [x, v] of [[7.4 - st * 2, 1.6], [11 + st * 2, 2.8]]) { P.line(x - 1.4, 25 + Y, x + 1.8, 25 + Y, RP.raiz, v); P.put(x + 2.4, 25 + Y, RP.raiz, v - 0.8); P.put(x - 2, 25 + Y, RP.raiz, v - 1); }
  // the body: a slim trunk of bark-stone, furrowed, a knot at the waist, moss on the shoulder
  for (let y = 8; y <= 18; y++) { const half = y < 12 ? 2.3 + (y - 8) * 0.05 : y < 15 ? 1.9 : 2.2 + (y - 15) * 0.35; for (let x = Math.floor(9.4 - half); x <= 9.4 + half; x++) { const u = (x + 0.5 - 9.4) / half; P.put(x, y + Y, RP.casca, 3.2 - u * 1.3 - (y - 8) * 0.06 + ((x + Math.round(Math.sin(y * 0.5) * 1.3)) % 3 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.4); } }
  P.blob(10, 14 + Y, 1.1, 0.9, RP.cerne, s + 4, 3.6); P.put(9.8, 13.8 + Y, RP.cerne, 1.4);
  for (let x = 7.6; x <= 10.6; x++) P.put(x, 8 + Y + (x % 2), RP.musgo, 3.6);
  // the neck and head: a smooth granite face turned forward, crystal eyes, a crown of small leaves
  P.line(10, 7 + Y, 10.4, 8.6 + Y, RP.granito, 2.4);
  P.blob(11, 5 + Y, 2.4, 2.8, RP.granito, s + 5, 3.8, (x, y, dx, dy) => (dy > 0.6 ? -0.5 : 0) + (dx < -0.5 ? -0.6 : 0));
  P.put(13.4, 5.4 + Y, RP.granito, 3.4); P.put(12.6, 7.2 + Y, RP.granito, 1.6);   // nose, mouth
  eye(P, 12.4, 4.4 + Y, cast || thr);
  for (const [x, a, l] of [[9.4, -2.2, 3], [10.6, -1.7, 3], [11.8, -1.2, 2], [8.6, -2.7, 2]]) for (let j = 1; j <= l; j++) P.put(x + Math.cos(a) * j, 2.6 + Y + Math.sin(a) * j, RP.cristal, 3 + j * 0.6);
  // the near arm, and the seeds
  if (cast) {
    limb(P, [[10.8, 10.4 + Y], [13.6, 6.6 + Y], [13.8, 1.8 + Y]], 0.8, RP.casca, 3, s + 6);
    for (const [x, y] of [[10.6, -1.2], [12.6, -1.8], [14.6, -1.2]]) { P.put(x, y + Y, RP.cristal, 5); P.put(x + 0.6, y + Y + 0.6, RP.cristal, 3.6); P.put(x - 0.6, y + Y + 0.6, RP.cristal, 2.6); }
  } else if (thr) {
    limb(P, [[10.8, 10.4 + Y], [13.6, 9.4 + Y], [16.6, 8.2 + Y]], 0.8, RP.casca, 3, s + 6);
    for (let j = 0; j < 3; j++) P.put(17 - j * 0.5, 7.4 + Y + j * 0.6, RP.casca, 2.4);
  } else limb(P, [[10.8, 10.4 + Y], [11.6 + st * 0.6, 14.6 + Y], [11.4 + st, 18.2 + Y]], 0.8, RP.casca, 3, s + 6);
  if (sink) {   // the edge of the body breaking up into the wall: speckled holes, darker
    const c = P.c; for (let y = 0; y < 28; y++) for (let x = 0; x < 18; x++) { const i = y * 18 + x; if (!c[i]) continue; if (hash2(x, y, s) < 0.32) c[i] = 0; else if (hash2(x, y, s + 1) < 0.4) c[i] = RP.granito[1]; }
  }
  return set(P.done());
}

/* the effects: the crystal spike (8 x 24), a seed (5 x 5), a shard (drawn by hand in the draw) */
function spike() {
  const P = cp(10, 24), s = 14901;
  for (let y = 0; y < 24; y++) { const t = y / 23, w = 0.4 + t * 3.6; for (let x = Math.floor(5 - w); x <= 5 + w; x++) { const u = (x + 0.5 - 5) / w; P.put(x, y, RP.cristal, 4.6 - u * 1.8 - t * 1.2 + (Math.abs(u) < 0.15 ? 0.8 : 0) + (hash2(x, y, s) < 0.1 ? 0.6 : 0)); } }
  for (let x = 0; x < 10; x++) { P.put(x, 22, RP.granito, 2.6 - Math.abs(x - 5) * 0.2); P.put(x, 23, RP.granito, 1.6); }   // the stone it split
  for (const [x, y, h] of [[2, 21, 5], [8, 21, 4]]) for (let j = 0; j < h; j++) P.put(x + (x < 5 ? -j * 0.2 : j * 0.2), y - j, RP.cristal, 3 + j * 0.3);
  return set(P.done());
}
function seed() { const P = cp(5, 5), s = 14911; P.blob(2.5, 2.5, 2, 2.2, RP.cristal, s, 3.4); P.put(1.6, 1.4, RP.cristal, 5); return set(P.done()); }
const GL = { crystal: glow(16, '#8ad8cc'), eye: glow(6, '#d4f4ec'), sap: glow(12, '#c4cc6a'), wing: glow(22, '#8ad8cc'), mark: glow(10, '#4fb0b0') };
FPB.get = () => FPB.ready || (FPB.ready = {
  lizard: [0, 1, 2, 3, 4].map(lizard),
  bulb: [0, 1, 2, 3].map(bulb),
  seg: [0, 1, 2].map(rootSeg), tip: rootTip(), rise: [0, 1].map(rootRise), coil: rootCoil(),
  tatu: [0, 1, 2, 3].map(armadillo), ball: [0, 1, 2, 3].map(ball),
  moth: [0, 1, 2].map(moth),
  dryad: [0, 1, 2, 3, 4, 5].map(dryad),
  spike: spike(), seed: seed()
});
Object.assign(FPB, { RP, GL });
}

/* ================= the back plane (generic, keyed on e.bg) ================= */
// a body hT cells tall with its feet in cell (x, y): back wall behind every cell of it
function fpBgFits(x, y, hT) { for (let k = 0; k < hT; k++) if (wallAt(x, y - k) <= 0) return false; return true; }
// breadth-first over the back-wall cells: { tx, ty (first step), gx, gy (goal), steps } or null
const FPBG_N = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
function fpBgNav(e, score, R = 18, maxN = 36) {
  const hT = Math.ceil(e.h / T), sx = Math.floor((e.x + e.w / 2) / T), sy = Math.floor((e.y + e.h - 1) / T);
  if (!fpBgFits(sx, sy, hT)) return null;
  const key = (x, y) => (x - sx + 64) * 512 + (y - sy + 200);
  const seen = new Set([key(sx, sy)]), q = [[sx, sy, 0, null]];
  let best = null, bs = -Infinity;
  for (let i = 0; i < q.length && i < 1600; i++) {
    const [x, y, n, first] = q[i];
    const sc = score(x, y, n); if (sc > bs) { bs = sc; best = q[i]; }
    if (n >= maxN) continue;
    for (const [ddx, ddy] of FPBG_N) {
      const nx = x + ddx, ny = y + ddy;
      if (Math.abs(nx - sx) > R || Math.abs(ny - sy) > R) continue;
      if (ddx && ddy && !(fpBgFits(x + ddx, y, hT) && fpBgFits(x, y + ddy, hT))) continue;   // no cutting corners
      const k = key(nx, ny); if (seen.has(k) || !fpBgFits(nx, ny, hT)) continue; seen.add(k);
      q.push([nx, ny, n + 1, first || [nx, ny]]);
    }
  }
  if (!best || bs === -Infinity) return null;
  const f = best[3] || [best[0], best[1]];
  return { tx: f[0], ty: f[1], gx: best[0], gy: best[1], steps: best[2] };
}
// re-lay the solid front blocks over a back-plane monster, straight from the chunk images
function fpBgCover(e, cx, cy) {
  const x0 = Math.floor((e.x - 10) / T), x1 = Math.floor((e.x + e.w + 10) / T), y0 = Math.floor((e.y - 10) / T), y1 = Math.floor((e.y + e.h + 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!solidAt(tx, ty)) continue;
    const wx = wrapX(tx), ch = chunks.get(Math.floor(ty / CH) * 64 + Math.floor(wx / CH));
    if (ch && !ch.dirty) lc.drawImage(ch.c, (wx % CH) * T, (ty % CH) * T, T, T, tx * T - cx, ty * T - cy, T, T);
    else { lc.fillStyle = '#141814'; lc.fillRect(tx * T - cx, ty * T - cy, T, T); }
  }
}
const FP_TINT = new Map();
{ const _de = drawEnemy; drawEnemy = function (e, cx, cy) {
  if (!e.bg) return _de(e, cx, cy);
  const k = clamp(e.bgK || 0, 0, 1);
  // o tom do fundo sem lc.filter (js/342-tinta.js): o mesmo brightness/saturate, em 12 degraus de k
  if (typeof tintDraw !== 'function') { lc.save(); lc.filter = `brightness(${Math.round(52 + 48 * k)}%) saturate(${Math.round(55 + 45 * k)}%)`; lc.globalAlpha = 0.85 + 0.15 * k; try { _de(e, cx, cy); } finally { lc.restore(); } fpBgCover(e, cx, cy); return; }   // a wiki não carrega o 342
  const q = Math.round(k * 12) / 12, b = Math.round(52 + 48 * q), sa = Math.round(55 + 45 * q), key = b + ':' + sa;
  const Tn = FP_TINT.get(key) || (FP_TINT.set(key, tintMake([['brightness', b / 100], ['saturate', sa / 100]])), FP_TINT.get(key));
  lc.save(); lc.globalAlpha = 0.85 + 0.15 * k;
  try { tintDraw(Tn, () => _de(e, cx, cy)); } finally { lc.restore(); }
  fpBgCover(e, cx, cy);
}; }
{ const _dy = drawEyes; drawEyes = function (e, cx, cy) { if (e.bg) return; return _dy(e, cx, cy); }; }
{ const _du = drawEnemyUI; drawEnemyUI = function (e, cx, cy) { if (e.bg) return; return _du(e, cx, cy); }; }
{ const _me = moveEntity; moveEntity = function (e, dt, step) {
  if (!e.bg) return _me(e, dt, step);
  const D = ET[e.type], vy = D && !D.fly ? e.vy - GRAV * dt : e.vy;   // undo the core's gravity
  e.x += e.vx * dt; e.y += vy * dt; e.vy = vy; e.onGround = e.hitWall = e.hitCeil = false;
}; }
// the hero's shots fly past a monster in the back plane (and the strangling root's cells take them)
{ const _up = updateProjs; updateProjs = function (dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const o = projs[i]; if (o.owner !== 'player') continue;
    for (const e of enemies) if (e.type === 'estrangula' && !e.dead && e.fpRoot && fpRootAt(e, o.x, o.y)) { fpRootHit(e, o.x, o.y); burst(o.x, o.y, 8, '#ffd060', 60, 0, 0.3, 1, true); projs.splice(i, 1); break; }
  }
  let moved = null;
  for (const e of enemies) if (e.bg && !e.dead) { (moved || (moved = [])).push(e); e.x += 1e7; }
  try { return _up(dt); } finally { if (moved) for (const e of moved) e.x -= 1e7; }
}; }

/* ================= drawing ================= */
DRAW_E.lagartoqz = (e, fx, fy, fl) => {
  const B = FPB.get().lizard, k = e.state === 'tell' ? 3 : e.state === 'leap' ? 4 : e.fpStill ? 0 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.animT * 10) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 13, fy - 13);
};
DRAW_E.estrangula = (e, fx, fy, fl) => {
  const A = FPB.get(), cx = Math.round(e.x + e.w / 2) - fx, cy = Math.round(e.y + e.h) - fy, R = e.fpRoot;
  if (R && R.length) {
    const n = R.length;
    for (let i = 0; i < n; i++) {
      const c = R[i], last = i === n - 1, x = c.x * T - cx, y = (c.y + 1) * T - cy, dir = c.d || e.facing;
      if (last && (e.state === 'rise' || e.state === 'grab' || e.state === 'hold')) {
        const S = A.rise[e.state === 'rise' ? Math.floor(e.t * 22) % 2 : 0], j = e.state === 'rise' ? Math.round(Math.sin(e.t * 60) * 0.6) : 0;
        lc.drawImage(dir > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l), x + (dir > 0 ? 0 : -1) + j, y - 25);
        continue;
      }
      const img = last ? A.tip : A.seg[(c.x * 7 + c.y) % 3];
      lc.drawImage(dir > 0 ? img.r : img.l, x - 1, y - 7);
    }
  }
  const k = e.state === 'open' ? 3 : e.state === 'rise' ? 2 : e.state === 'grow' && Math.sin(e.t * 9) > 0.3 ? 1 : 0;
  lc.drawImage(cvPick(A.bulb[k], e, fl), e.facing > 0 ? fx - 7 : fx - 11, fy - 17);
};
DRAW_E.tatupedra = (e, fx, fy, fl) => {
  const A = FPB.get();
  if (e.state === 'roll' || (e.state === 'curl' && e.stateT < 0.35)) {
    const f = ((Math.floor(e.rollA || 0) % 4) + 4) % 4, B = A.ball[f];
    lc.drawImage(cvPick(B, e, fl), fx - 8 + (e.state === 'curl' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0), fy - 17 + 1);
    return;
  }
  const k = e.state === 'curl' || e.state === 'uncurl' ? 2 : e.state === 'dizzy' ? 3 : Math.abs(e.vx) > 4 && e.onGround ? Math.floor(e.t * 4) % 2 : 0;
  lc.drawImage(cvPick(A.tatu[k], e, fl), fx - 13, fy - 15);
};
DRAW_E.mariposacr = (e, fx, fy, fl) => {
  const B = FPB.get().moth, k = e.state === 'lit' ? 2 : Math.floor(e.t * 9 + e.seed) % 2, bob = Math.round(Math.sin(e.t * 3 + e.seed) * 1.5);
  lc.drawImage(cvPick(B[k], e, fl), fx - 13, fy - 16 + bob);
};
DRAW_E.driade = (e, fx, fy, fl) => {
  const B = FPB.get().dryad, st = e.state;
  const k = st === 'cast' ? 3 : st === 'throw' ? 4 : st === 'emerge' || st === 'sink' ? 5 : Math.abs(e.vx) > 4 || Math.abs(e.vy) > 4 ? 1 + (Math.floor(e.t * 5) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 10, fy - 29);
};
EYES_E.lagartoqz = (e, fx, fy) => { if (e.state !== 'tell' && e.state !== 'leap') return; lc.globalAlpha = 0.85; lc.drawImage(FPB.GL.eye, fx + e.facing * 7 - 6, fy - 12); };
EYES_E.estrangula = (e, fx, fy) => { if (e.state !== 'open') return; lc.globalAlpha = 0.5 + Math.sin(e.t * 6) * 0.15; lc.drawImage(FPB.GL.sap, fx - 12, fy - 18); };
EYES_E.tatupedra = () => { };
EYES_E.mariposacr = (e, fx, fy) => { const lit = e.state === 'lit'; lc.globalAlpha = lit ? 0.3 + (0.65 - e.stateT) * 0.5 : 0.14; lc.drawImage(FPB.GL.wing, fx - 22, fy - 28); };
EYES_E.driade = (e, fx, fy) => { const c = e.state === 'cast' || e.state === 'throw'; lc.globalAlpha = c ? 0.8 : 0.35; lc.drawImage(FPB.GL.eye, fx + e.facing * 2 - 6, fy - 28); if (e.state === 'cast') { lc.globalAlpha = 0.6; lc.drawImage(FPB.GL.crystal, fx + e.facing * 1 - 16, fy - 42); } };
WARN_E.lagartoqz = e => e.state === 'tell';
WARN_E.estrangula = e => e.state === 'rise';
WARN_E.tatupedra = e => e.state === 'curl';
WARN_E.mariposacr = e => e.state === 'lit';
WARN_E.driade = e => e.state === 'cast';

/* ================= behaviour ================= */
function fpWander(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
// a puff of stone dust at the feet
const fpDust = (x, y, n = 3) => burst(x, y, n, '#566a5a', 40, 200, 0.4);

/* ---------- the quartz lizard ---------- */
// the hero has it in front of him (the way he faces, not whether he can see it)
function fpWatched(e) {
  if (pl.dead) return false;
  const d = e.x + e.w / 2 - (pl.x + pl.w / 2);
  return Math.abs(d) < 4 || Math.sign(d) === pl.facing;
}
AI.lagartoqz = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, watched = fpWatched(e);
  if (e.state === 'leap') {
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 3, y: e.y - 2, w: e.w + 6, h: e.h + 2 }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); sfx.fpBite(); }
    if (e.onGround && e.stateT < 0.45) { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0 || Math.abs(e.vx) < 5) { e.state = 'walk'; e.atkCD = 1.1 + Math.random() * 0.5; } }
    e.animT += dt; e.fpStill = false; return;
  }
  // looked at: a statue. Not a twitch (a glint on the quartz now and then)
  if (watched) {
    if (!e.fpStill) { e.fpStill = true; if (dist < 200) sfx.fpSettle(); }
    if (e.state === 'tell') { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.3); }
    if (e.onGround) e.vx = 0;
    if (Math.random() < dt * 0.5) parts.push({ x: e.x + rnd(2, e.w - 2), y: e.y + rnd(-2, 2), vx: 0, vy: 0, g: 0, life: 0.35, max: 0.35, col: '#d4f4ec', size: 1, glow: true });
    return;
  }
  e.fpStill = false; e.animT += dt;
  if (e.state === 'tell') {
    e.vx = approach(e.vx, 0, 900 * dt);
    if (e.stateT <= 0) { e.state = 'leap'; e.stateT = 0.9; e.swingHit = false; e.facing = Math.sign(dx) || e.facing; e.vx = e.facing * (150 + e.lvl * 2); e.vy = -180; sfx.fpLeap(); fpDust(ecx, e.y + e.h); }
    return;
  }
  if (!aggro) fpWander(e, dt);
  const dir = aggro ? (Math.abs(dx) < 10 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) e.facing = dir;
  walk(e, dt, dir, aggro ? 78 + e.lvl * 2 : 26, 1100, 260, dy, aggro);
  if (Math.abs(e.vx) > 30 && e.onGround && Math.random() < dt * 6) fpDust(ecx - e.facing * 6, e.y + e.h, 1);
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 40 && Math.abs(dy) < 18) { e.state = 'tell'; e.stateT = 0.45; e.facing = Math.sign(dx) || e.facing; e.vx = 0; sfx.fpTail(); }
};

/* ---------- the strangling root ---------- */
const FP_ROOT_MAX = 12, FP_ROOT_STEP = 0.3;
// the cell the root may take next from (x, y) toward d: along the floor, a step up or down; never into a block
function fpRootNext(x, y, d) {
  const nx = x + d;
  if (!solidAt(nx, y) && solidAt(nx, y + 1)) return [nx, y];
  if (!solidAt(nx, y) && !solidAt(nx, y + 1) && solidAt(nx, y + 2)) return [nx, y + 1];
  if (solidAt(nx, y) && !solidAt(nx, y - 1) && !solidAt(x, y - 1)) return [nx, y - 1];
  return null;
}
// does a point lie on the root (the low strip of each cell; the reared tip stands two blocks tall)
function fpRootAt(e, px, py) {
  const R = e.fpRoot; if (!R || !R.length) return false;
  const tx = Math.floor(px / T);
  for (let i = 0; i < R.length; i++) {
    const c = R[i]; if (c.x !== tx) continue;
    const bot = (c.y + 1) * T, top = i === R.length - 1 && (e.state === 'rise' || e.state === 'grab' || e.state === 'hold') ? bot - 24 : bot - 8;
    if (py >= top - 2 && py <= bot + 1) return true;
  }
  return false;
}
function fpRootHit(e, x, y) {
  if (e.dead || e.state === 'cut' || e.state === 'open') return;
  e.rootHits = (e.rootHits || 0) + 1; e.memT = 4;
  burst(x, y, 6, '#665440', 70, 380, 0.4); burst(x, y, 3, '#c4cc6a', 50, 300, 0.4, 1, true); sfx.fpCrack(); shake(1);
  if (e.rootHits >= 2) { e.state = 'cut'; e.stateT = 0; e.rootHits = 0; if (pl.fpPresoT > 0 && e.fpHeld) pl.fpPresoT = 0; e.fpHeld = false; sfx.fpSnap(); }
}
// finds its wall the first time it thinks: a block beside it, up to 3 cells away along the floor
function fpRootInit(e) {
  e.fpInit = true; e.fpRoot = []; e.rootHits = 0; e.growT = 0; e.farT = 0;
  const ty = Math.floor((e.y + e.h - 1) / T), tx = Math.floor((e.x + e.w / 2) / T);
  for (let k = 0; k <= 3; k++) for (const d of [-1, 1]) {
    const x = tx + d * k;
    if (k && solidAt(x, ty)) continue;
    if (solidAt(x + d, ty) && solidAt(x, ty + 1) && !solidAt(x, ty)) {
      e.x = d < 0 ? x * T : (x + 1) * T - e.w; e.facing = -d; e.wallSide = d; return;
    }
  }
  e.wallSide = 0;
}
AI.estrangula = function (e, dt, dx, dy, dist, aggro) {
  if (!e.fpInit) fpRootInit(e);
  e.stateT -= dt; e.vx = 0;
  const R = e.fpRoot, tip = R.length ? R[R.length - 1] : null;
  const bx = Math.floor((e.x + e.w / 2) / T), by = Math.floor((e.y + e.h - 1) / T);
  const hx = Math.floor((pl.x + pl.w / 2) / T), hfy = Math.floor((pl.y + pl.h - 1) / T);
  if (e.state === 'walk') { e.state = 'grow'; }
  if (e.state === 'cut' || e.state === 'retract') {   // the root pulls back into the bulb, fast when cut
    e.growT -= dt;
    if (e.growT <= 0) { e.growT = e.state === 'cut' ? 0.05 : 0.22; const c = R.pop(); if (c) burst((c.x + 0.5) * T, (c.y + 1) * T - 3, 2, '#4c3e2e', 30, 300, 0.3); }
    if (!R.length) { if (e.state === 'cut') { e.state = 'open'; e.stateT = 3; sfx.fpOpen(); } else e.state = 'grow'; }
    return;
  }
  if (e.state === 'open') { if (Math.random() < dt * 6) parts.push({ x: e.x + e.w / 2 + rnd(-3, 3), y: e.y + rnd(2, 8), vx: rnd(-6, 6), vy: rnd(-16, -4), g: 0, life: 0.6, max: 0.6, col: '#e6ecac', size: 1, glow: true }); if (e.stateT <= 0) { e.state = 'grow'; e.atkCD = 0.6; sfx.fpClose(); } return; }
  if (e.state === 'rise') {
    if (Math.random() < dt * 14 && tip) parts.push({ x: (tip.x + 0.5) * T + rnd(-3, 3), y: (tip.y + 1) * T - 20 + rnd(-2, 2), vx: rnd(-8, 8), vy: rnd(-6, 6), g: 0, life: 0.25, max: 0.25, col: '#8ad8cc', size: 1, glow: true });
    if (e.stateT <= 0) {
      e.state = 'grab'; e.stateT = 0.25; sfx.fpGrab();
      const box = { x: tip.x * T - 6, y: (tip.y + 1) * T - 26, w: T + 12, h: 26 };
      if (!pl.dead && overlap(box, pl)) { const r = hurtPlayer(e.dmg, (tip.x + 0.5) * T, null, false); if (r === 'hit') { fpPrender(1); e.fpHeld = true; e.state = 'hold'; e.stateT = 1; pl.vx = 0; pl.vy = Math.max(pl.vy, 0); } }
    }
    return;
  }
  if (e.state === 'grab') { if (e.stateT <= 0) { e.state = 'grow'; e.atkCD = 1.2; } return; }
  if (e.state === 'hold') {   // the root wound round his legs: it pulls him onto the tip
    if (tip && !pl.dead) { const tx = (tip.x + 0.5) * T - pl.w / 2; pl.x = approach(pl.x, tx, 40 * dt); pl.vx = 0; }
    if (e.stateT <= 0 || pl.dead) { e.state = 'grow'; e.atkCD = 1.4; e.fpHeld = false; }
    return;
  }
  // growing after the hero, a block at a time; a while without him and it draws back
  const near = !pl.dead && aggro && Math.abs(hx - bx) <= 14 && Math.abs(hfy - by) <= 4;
  e.farT = near ? 0 : e.farT + dt;
  if (e.farT > 4 && R.length) { e.state = 'retract'; e.growT = 0.2; return; }
  if (!near) return;
  const end = tip || { x: bx, y: by };
  const under = tip && Math.abs(pl.x + pl.w / 2 - (tip.x + 0.5) * T) < 13 && hfy <= tip.y && hfy >= tip.y - 2;
  if (under && e.atkCD <= 0) { e.state = 'rise'; e.stateT = 0.6; sfx.fpCreak(); return; }
  const d = Math.sign(hx - end.x);
  if (!d || (e.wallSide && R.length === 0 && d === e.wallSide)) return;
  e.growT -= dt;
  if (e.growT <= 0 && R.length < FP_ROOT_MAX) {
    e.growT = FP_ROOT_STEP;
    if (tip && R.length > 1 && R[R.length - 2].x === tip.x + d) { R.pop(); return; }   // the hero went back past it: it follows
    if (R.length && tip.d && tip.d !== d) { R.pop(); return; }
    const nx = fpRootNext(end.x, end.y, d);
    if (nx) { R.push({ x: nx[0], y: nx[1], d }); sfx.fpGrow(); burst((nx[0] + 0.5) * T, (nx[1] + 1) * T - 1, 3, '#4c3e2e', 40, 300, 0.35); }
  }
};
// the hero's blade cuts the root (each swing counts once)
{ const _bs = bladeSweep; bladeSweep = function () {
  const pts = _bs.apply(this, arguments);
  if (pl.atkHit) for (const e of enemies) {
    if (e.type !== 'estrangula' || e.dead || !e.fpRoot || !e.fpRoot.length) continue;
    const key = 'fpr' + e.seed; if (pl.atkHit.has(key)) continue;
    for (const q of pts) if (fpRootAt(e, q[0], q[1])) { pl.atkHit.add(key); fpRootHit(e, q[0], q[1]); break; }
  }
  return pts;
}; }
// held by the root: drawn coiled round the hero's legs
{ const _dp = drawPlayer; drawPlayer = function (cx, cy) {
  _dp(cx, cy);
  if (pl.dead || !(pl.fpPresoT > 0)) return;
  for (const e of enemies) if (e.type === 'estrangula' && e.fpHeld && !e.dead) { const c = FPB.get().coil; lc.drawImage(e.facing > 0 ? c.r : c.l, Math.round(pl.x + pl.w / 2) - cx - 9, Math.round(pl.y + pl.h) - cy - 15); break; }
}; }

/* ---------- the granite armadillo ---------- */
// the trunk blocks that stun a ball rolling into them head on
const FP_TRONCO = new Uint8Array(NT);
for (const t of [FP_CASCA, FP_CERNE, FP_TRONCO_G, FP_RAIZ]) FP_TRONCO[t] = 1;
AI.tatupedra = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state !== 'roll') e.atkCD = Math.max(e.atkCD, 0.3);   // its body only hurts while it rolls (ET touch)
  e.fpCD = (e.fpCD || 0) - dt;
  if (e.state === 'curl') {
    e.vx = approach(e.vx, 0, 900 * dt);
    if (Math.random() < dt * 10) fpDust(ecx + rnd(-6, 6), e.y + e.h, 1);
    if (e.stateT <= 0) { e.state = 'roll'; e.stateT = 4.5; e.rollV = 220 + e.lvl * 4; e.bounces = 0; e.atkCD = 0; e.rollDir = e.facing; sfx.fpRoll(); }
    return;
  }
  if (e.state === 'roll') {
    e.rollA = (e.rollA || 0) + e.rollV * dt / 9;
    // into a wall: a trunk head on stuns it; anything else throws it back, 20% slower
    if (e.hitWall) {
      const fx = Math.floor((e.rollDir > 0 ? e.x + e.w + 2 : e.x - 2) / T), fy = Math.floor((e.y + e.h - 2) / T);
      let trunk = false; for (let y = fy - 1; y <= fy; y++) if (FP_TRONCO[tileAt(fx, y)]) trunk = true;
      shake(2.5); burst(e.rollDir > 0 ? e.x + e.w : e.x, e.y + e.h / 2, 8, '#566a5a', 90, 300, 0.4);
      if (trunk) { e.state = 'dizzy'; e.stateT = 1.5; e.stun = 1.5; e.vx = -e.rollDir * 60; e.vy = -120; sfx.fpThud(); return; }   // the core's stun: stars over it, no thinking
      e.rollDir = -e.rollDir; e.rollV *= 0.8; e.bounces++; e.vy = Math.min(e.vy, -60); sfx.fpBounce();
    }
    e.facing = e.rollDir; e.vx = e.rollDir * e.rollV;
    if (e.onGround && Math.random() < dt * 12) fpDust(ecx - e.rollDir * 6, e.y + e.h, 1);
    e.rumT = (e.rumT || 0) - dt; if (e.rumT <= 0) { e.rumT = 0.28; if (dist < 220) sfx.fpRumble(); }
    if (e.rollV < 110 || e.bounces >= 4 || e.stateT <= 0) { e.state = 'uncurl'; e.stateT = 0.45; }
    return;
  }
  if (e.state === 'uncurl') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.fpCD = 1.4 + Math.random() * 0.8; } return; }
  if (e.state === 'dizzy') {
    e.vx = approach(e.vx, 0, 300 * dt);
    if (Math.random() < dt * 3) parts.push({ x: ecx + rnd(-5, 5), y: e.y - 3, vx: rnd(-10, 10), vy: -10, g: 0, life: 0.5, max: 0.5, col: '#d4f4ec', size: 1, glow: true });
    if (e.stateT <= 0) { e.state = 'walk'; e.fpCD = 1.2; }
    return;
  }
  if (!aggro) fpWander(e, dt);
  const dir = aggro ? (Math.abs(dx) < 14 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) e.facing = dir;
  walk(e, dt, dir, 20 + e.lvl, 300, 230, dy, aggro);
  if (Math.abs(e.vx) > 4 && e.onGround) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.4; if (dist < 160) sfx.fpStep(); } }
  if (aggro && e.fpCD <= 0 && e.onGround && Math.abs(dy) < 30 && Math.abs(dx) > 20 && dist < 210 && clearPath(e, pl)) { e.state = 'curl'; e.stateT = 0.7; e.facing = Math.sign(dx) || e.facing; e.vx = 0; sfx.fpScrape(); }
};

/* ---------- the crystal moth ---------- */
// how much light the hero gives off: a torch in his hand, or the light of his gear (0 = none)
function fpHeroLight() {
  if (pl.dead) return 0;
  const h = typeof heldBag === 'function' ? heldBag() : null;
  if (h && h.s && h.s.id === 'tocha') return 1.3 + 0.1 * (pl.light || 0);
  return pl.light > 0 ? 0.7 + 0.1 * pl.light : 0;
}
// the strongest light near the moth: { x, y, hero } (a drusa, a torch on the wall, the hero) or null
function fpMothLight(e) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, tx0 = Math.floor(ecx / T), ty0 = Math.floor(ecy / T), R = 11, old = e.lure;
  let best = null, bs = 0.05;
  const keep = (x, y) => old && Math.abs(old.x - x) < 8 && Math.abs(old.y - y) < 8 ? 0.08 : 0;
  for (let y = ty0 - R; y <= ty0 + R; y++) for (let x = tx0 - R; x <= tx0 + R; x++) {
    const t = tileAt(x, y), v = t === FP_DRUSA ? 1 : t === TORCH ? 1.1 : 0;
    if (!v) continue;
    const sc = v - 0.04 * Math.hypot(x - tx0, y - ty0) + keep((x + 0.5) * T, (y + 0.5) * T);
    if (sc > bs) { bs = sc; best = { x: (x + 0.5) * T, y: (y + 0.5) * T, hero: false }; }
  }
  const L = fpHeroLight();
  if (L > 0 || e.angryT > 0) {
    const hx = pl.x + pl.w / 2, hy = pl.y + 6, d = Math.hypot(hx - ecx, hy - ecy) / T;
    if (d < 15) { const sc = L + (e.angryT > 0 ? 0.6 : 0) - 0.04 * d + (old && old.hero ? 0.08 : 0); if (sc > bs) { bs = sc; best = { x: hx, y: hy, hero: true }; } }
  }
  if (!best && !(e.lure && e.lure.hero)) {   // nothing near: the nearest drusa further off
    let bd = 1e9;
    for (let y = ty0 - 24; y <= ty0 + 24; y++) for (let x = tx0 - 24; x <= tx0 + 24; x++) if (tileAt(x, y) === FP_DRUSA) { const d = Math.hypot(x - tx0, y - ty0); if (d < bd) { bd = d; best = { x: (x + 0.5) * T, y: (y + 0.5) * T, hero: false }; } }
  }
  return best;
}
AI.mariposacr = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.angryT = (e.angryT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (e.state === 'lit') {   // hanging still, wings burning brighter: the fan is coming
    const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 16) parts.push({ x: ecx + rnd(-9, 9), y: ecy + rnd(-6, 4), vx: rnd(-5, 5), vy: rnd(-5, 5), g: 0, life: 0.3, max: 0.3, col: '#d4f4ec', size: 1, glow: true });
    if (e.stateT <= 0) { fpFan(e); e.state = 'walk'; e.atkCD = 2.4 + Math.random() * 0.8; }
    return;
  }
  e.lureT = (e.lureT || 0) - dt;
  if (e.lureT <= 0) { e.lureT = 0.4 + Math.random() * 0.2; const was = e.lure; e.lure = fpMothLight(e); if (was && was.hero && e.lure && !e.lure.hero) sfx.fpBuzz(0.5); }
  if (e.home === undefined) e.home = { x: ecx, y: ecy };
  const L = e.lure || e.home, r = e.lure ? (e.lure.hero ? 28 : 18) : 26;
  e.orb = (e.orb || e.seed) + dt * (e.lure && e.lure.hero ? 1.9 : 1.3);
  const tx = L.x + Math.cos(e.orb) * r - ecx, ty = L.y - 10 + Math.sin(e.orb * 1.3) * r * 0.55 - ecy;
  const d = Math.hypot(tx, ty) || 1, sp = e.lure ? 70 + e.lvl : 22, k = Math.min(1, dt * 2.2);
  e.vx = lerp(e.vx, tx / d * Math.min(sp, d * 3), k); e.vy = lerp(e.vy, ty / d * Math.min(sp, d * 3), k);
  if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
  if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
  e.buzzT = (e.buzzT || 0) - dt; if (e.buzzT <= 0) { e.buzzT = 1.4 + Math.random() * 1.6; if (dist < 180) sfx.fpBuzz(dist < 90 ? 1 : 0.5); }
  if (Math.random() < dt * 3) parts.push({ x: ecx + rnd(-5, 5), y: ecy + rnd(-2, 3), vx: rnd(-3, 3), vy: rnd(4, 12), g: 0, life: 0.6, max: 0.6, col: '#8ad8cc', size: 1, glow: true });   // crystal dust off the wings
  // it attacks what it is drawn to (or whoever hit it, or someone right under it)
  const wants = (e.lure && e.lure.hero) || e.angryT > 0 || dist < 56;
  if (aggro && wants && e.atkCD <= 0 && dist < 150 && losClear(ecx, ecy, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'lit'; e.stateT = 0.65; sfx.fpChime(); }
};
// five crystal shards in a fan toward the hero
const fpShards = [];
function fpFan(e) {
  const ox = e.x + e.w / 2, oy = e.y + e.h / 2, a0 = Math.atan2(pl.y + pl.h / 2 - oy, pl.x + pl.w / 2 - ox), sp = 150 + e.lvl * 2;
  for (let k = -2; k <= 2; k++) { const a = a0 + k * 0.22; fpShards.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dmg: e.dmg }); }
  burst(ox, oy, 10, '#d4f4ec', 70, 0, 0.3, 1, true); sfx.fpShatter();
}

/* ---------- the stone dryad ---------- */
const fpSeeds = [], fpMarks = [], fpSpikes = [];
// a spot in front of the wall to step out on: feet on a floor, the body in the open, back wall behind, the hero in
// sight 3 to 8 blocks away
function fpDryadSpot(e, x, y, hx, hy, hT) {
  if (!navStand(x, y + 1, hT) || !fpBgFits(x, y, hT)) return false;
  const ax = Math.abs(x - hx); if (ax < 3 || ax > 8 || Math.abs(y - hy) > 3) return false;
  return losClear((x + 0.5) * T, (y - 0.5) * T, pl.x + pl.w / 2, pl.y + pl.h / 2);
}
AI.driade = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, hT = Math.ceil(e.h / T);
  const cx = Math.floor(ecx / T), cy = Math.floor((e.y + e.h - 1) / T);
  const near = !pl.dead && (dist < 300 || aggro);   // inside the wall it feels the hero's steps through the stone
  if (e.state === 'emerge') {   // stepping out of the bark: a little dust, then it is in front
    e.vx = e.vy = 0; e.bgK = 1 - Math.max(0, e.stateT) / 0.5;
    if (Math.random() < dt * 14) fpDust(ecx + rnd(-4, 4), e.y + rnd(4, e.h), 1);
    if (e.stateT <= 0) { e.bg = false; e.bgK = 1; e.state = 'cast'; e.stateT = 0.75; e.facing = Math.sign(dx) || e.facing; sfx.fpChime(); }
    return;
  }
  if (e.state === 'cast') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) parts.push({ x: ecx + rnd(-3, 3), y: e.y - 3 + rnd(-2, 2), vx: rnd(-6, 6), vy: rnd(-12, 0), g: 0, life: 0.35, max: 0.35, col: '#d4f4ec', size: 1, glow: true });
    if (e.stateT <= 0) { fpThrowSeeds(e); e.state = 'throw'; e.stateT = 0.35; }
    return;
  }
  if (e.state === 'throw') { e.vx = 0; if (e.stateT <= 0) { e.state = 'linger'; e.stateT = 0.9; } return; }
  if (e.state === 'linger') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.atkCD = 3 + Math.random() * 1.2; if (fpBgFits(cx, cy, hT)) { e.state = 'sink'; e.stateT = 0.5; sfx.fpSink(); } else e.state = 'walk'; } return; }
  if (e.state === 'sink') {
    e.vx = approach(e.vx, 0, 600 * dt); e.bgK = Math.max(0, e.stateT) / 0.5;
    if (Math.random() < dt * 14) fpDust(ecx + rnd(-4, 4), e.y + rnd(4, e.h), 1);
    if (e.stateT <= 0) { e.bg = true; e.bgK = 0; e.state = 'inwall'; e.vx = e.vy = 0; e.navT = 0; }
    return;
  }
  if (e.state === 'inwall') {
    if (!e.bg) e.bg = true;
    if (!fpBgFits(cx, cy, hT)) {   // the wall ran out under it (dug away): out to the front, or drop
      if (!rectSolid(e.x, e.y, e.w, e.h)) { e.bg = false; e.bgK = 1; e.state = 'walk'; return; }
    }
    // the way through the wall: to a spot near the hero when it may cast, else after him at a distance
    e.fpNavT = (e.fpNavT || 0) - dt;
    if (e.fpNavT <= 0) {
      e.fpNavT = 0.4 + Math.random() * 0.15;
      if (near) {
        const hx = Math.floor((pl.x + pl.w / 2) / T), hy = Math.floor((pl.y + pl.h - 1) / T), ready = e.atkCD <= 0;
        e.fpNav = fpBgNav(e, (x, y, n) => ready && fpDryadSpot(e, x, y, hx, hy, hT) ? 100 - n : -Math.abs(Math.abs(x - hx) - 5) - Math.abs(y - hy) * 0.6 - n * 0.05);
      } else e.fpNav = null;
    }
    const N = e.fpNav;
    if (N && (N.gx !== cx || N.gy !== cy)) {
      const px = N.tx * T + T / 2 - e.w / 2, py = (N.ty + 1) * T - e.h, ddx = px - e.x, ddy = py - e.y, d = Math.hypot(ddx, ddy) || 1, sp = 40 + e.lvl;
      e.vx = ddx / d * Math.min(sp, d / dt); e.vy = ddy / d * Math.min(sp, d / dt);
      if (Math.abs(ddx) > 1) e.facing = Math.sign(ddx);
      if (Math.random() < dt * 0.8 && dist < 160) sfx.fpGrind();
    } else {
      e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt);
      const hx = Math.floor((pl.x + pl.w / 2) / T), hy = Math.floor((pl.y + pl.h - 1) / T);
      if (N && e.atkCD <= 0 && near && fpDryadSpot(e, cx, cy, hx, hy, hT)) {
        e.x = cx * T + T / 2 - e.w / 2; e.y = (cy + 1) * T - e.h;
        if (!rectSolid(e.x, e.y, e.w, e.h)) { e.state = 'emerge'; e.stateT = 0.5; e.bgK = 0; e.facing = Math.sign(dx) || e.facing; sfx.fpEmerge(); }
      }
    }
    return;
  }
  // the front plane: back into the wall as soon as there is one behind it
  e.bg = false;
  if (e.onGround && fpBgFits(cx, cy, hT) && (e.atkCD > 0 || !aggro)) { e.state = 'sink'; e.stateT = 0.5; sfx.fpSink(); return; }
  if (!aggro) fpWander(e, dt);
  const want = aggro ? (Math.abs(dx) > 90 ? Math.sign(dx) : Math.abs(dx) < 40 ? -Math.sign(dx) : 0) : e.wander;
  if (want) e.facing = want;
  walk(e, dt, want, 30 + e.lvl, 400, 250, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (aggro && e.atkCD <= 0 && e.onGround && dist < 140 && clearPath(e, pl)) { e.state = 'cast'; e.stateT = 0.75; sfx.fpChime(); }
};
// three seeds in an arc, landing round the hero
function fpThrowSeeds(e) {
  const ox = e.x + e.w / 2 + e.facing * 4, oy = e.y + 2, G = 520;
  for (const off of [-30, 0, 30]) {
    const tx = pl.x + pl.w / 2 + off + rnd(-4, 4), ty = pl.y + pl.h - 4, t = clamp(Math.abs(tx - ox) / 120, 0.55, 1.05) + rnd(0, 0.08);
    fpSeeds.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * G * t * t) / t, dmg: e.dmg, t: 0 });
  }
  sfx.fpThrow();
}

/* ---------- blows, deaths, the effects ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.bg) return;   // in the back plane: nothing reaches it
  if (e && !e.dead) {
    if (e.type === 'estrangula') {
      if (e.state === 'open') mult *= 1.6;
      else { mult *= 0.5; burst(e.x + e.w / 2, e.y + 4, 4, '#836e56', 50, 300, 0.3); sfx.fpTok(); }
    }
    if (e.type === 'tatupedra' && e.state === 'dizzy') mult *= 1.5;
    if (e.type === 'mariposacr') e.angryT = 6;
  }
  const st = e && e.state, r = _hit(e, dir, mult, melee);
  if (e && !e.dead) {
    if (e.type === 'estrangula') { e.vx = 0; e.vy = 0; e.stun = 0; }
    if (e.type === 'tatupedra' && st === 'roll') { e.stun = 0; }   // a ball doesn't stop for a blow
    if (e.type === 'driade' && (st === 'linger' || st === 'cast')) e.stateT = Math.min(e.stateT, 0.25);   // hurt in the open, it hurries back
  }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'estrangula' && e.fpRoot) { for (const c of e.fpRoot) burst((c.x + 0.5) * T, (c.y + 1) * T - 3, 4, '#4c3e2e', 50, 300, 0.5); e.fpRoot.length = 0; e.fpHeld = false; }
  if (e && e.bg) e.bg = false;
  return _k(e);
}; }
function fpbUpdate(dt) {
  // the moth's shards
  for (let i = fpShards.length - 1; i >= 0; i--) {
    const s = fpShards[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
    let end = s.t > 2 || solidAt(Math.floor(s.x / T), Math.floor(s.y / T));
    if (!end && !pl.dead && s.x > pl.x - 2 && s.x < pl.x + pl.w + 2 && s.y > pl.y - 2 && s.y < pl.y + pl.h + 2) { hurtPlayer(s.dmg, s.x - Math.sign(s.vx) * 6, null, true); end = true; }
    if (end) { burst(s.x, s.y, 4, '#8ad8cc', 50, 300, 0.3, 1, true); if (Math.random() < 0.4) sfx.fpTink(); fpShards.splice(i, 1); }
  }
  // the dryad's seeds: in an arc until they hit stone, then the glowing circle where they lie
  for (let i = fpSeeds.length - 1; i >= 0; i--) {
    const s = fpSeeds[i]; s.t += dt; s.vy = Math.min(s.vy + 520 * dt, 400);
    const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T)) || s.t > 3) {
      // find the floor under where it stopped (a seed that struck a wall slides down it)
      let tx = Math.floor(s.x / T), ty = Math.floor(s.y / T); for (let k = 0; k < 8 && !solidAt(tx, ty + 1); k++) ty++;
      if (solidAt(tx, ty)) ty--;
      fpMarks.push({ x: clamp(s.x, tx * T + 3, tx * T + T - 3), y: (ty + 1) * T, t: 0.8, dmg: s.dmg });
      burst(s.x, s.y, 4, '#8ad8cc', 40, 300, 0.3, 1, true); sfx.fpTink(); fpSeeds.splice(i, 1); continue;
    }
    s.x = nx; s.y = ny;
  }
  // the circles glow, then the spikes sprout (they hurt as they come up) and stand 3 s
  for (let i = fpMarks.length - 1; i >= 0; i--) {
    const m = fpMarks[i]; m.t -= dt;
    if (m.t > 0) continue;
    fpSpikes.push({ x: m.x, y: m.y, t: 3, g: 0 }); fpMarks.splice(i, 1);
    if (!pl.dead && pl.x + pl.w > m.x - 5 && pl.x < m.x + 5 && pl.y + pl.h > m.y - 24 && pl.y < m.y) { const r = hurtPlayer(m.dmg, m.x, null, true); if (r === 'hit') pl.vy = -230; }
    burst(m.x, m.y - 2, 8, '#8ad8cc', 70, 300, 0.4, 1, true); shake(1.2); sfx.fpSprout();
  }
  for (let i = fpSpikes.length - 1; i >= 0; i--) { const s = fpSpikes[i]; s.t -= dt; s.g = Math.min(1, s.g + dt * 10); if (s.t <= 0) { burst(s.x, s.y - 10, 8, '#4fb0b0', 40, 300, 0.5); fpSpikes.splice(i, 1); } }
}
HOOK.update.push(fpbUpdate);
HOOK.drawWorld.push((cx, cy) => {
  if (!fpSeeds.length && !fpSpikes.length && !fpMarks.length) return;
  const A = FPB.get();
  for (const m of fpMarks) {   // the circle on the floor: a ring of crystal light that tightens
    const x = Math.round(m.x) - cx, y = Math.round(m.y) - cy, k = 1 - m.t / 0.8, r = 7 - k * 2;
    lc.fillStyle = Math.floor(m.t * 16) % 2 ? '#8ad8cc' : '#4fb0b0';
    for (let a = 0; a < 6.28; a += 0.4) lc.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 1 + Math.sin(a) * r * 0.3), 1, 1);
  }
  for (const s of fpSpikes) {
    const img = A.spike.r, h = Math.round(img.height * s.g), x = Math.round(s.x) - cx - (img.width >> 1), y = Math.round(s.y) - cy;
    lc.globalAlpha = Math.min(1, s.t / 0.3); lc.drawImage(img, 0, 0, img.width, h, x, y - h, img.width, h); lc.globalAlpha = 1;
  }
  for (const s of fpSeeds) lc.drawImage(A.seed.r, Math.round(s.x) - cx - 3, Math.round(s.y) - cy - 3);
});
HOOK.drawTop.push((cx, cy) => {
  for (const s of fpShards) {   // a sliver of crystal along its flight, bright at the point
    const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, x = s.x - cx, y = s.y - cy;
    for (let k = 0; k < 5; k++) { lc.fillStyle = k === 0 ? '#d4f4ec' : k < 3 ? '#8ad8cc' : '#2f7e8a'; lc.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), 1, 1); }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = FPB.GL;
  for (const e of enemies) if (e.bg && e.type === 'driade' && !e.dead) {   // two faint glints moving in the wall (not through solid stone)
    const hx = e.x + e.w / 2 + e.facing * 2, hy = e.y + 4; if (solidAt(Math.floor(hx / T), Math.floor(hy / T))) continue;
    lc.globalAlpha = 0.22 + Math.sin(e.t * 3) * 0.06; lc.drawImage(G.eye, Math.round(hx) - cx - 6, Math.round(hy) - cy - 6);
  }
  for (const s of fpShards) { lc.globalAlpha = 0.5; lc.drawImage(G.eye, Math.round(s.x) - cx - 6, Math.round(s.y) - cy - 6); }
  for (const s of fpSeeds) { lc.globalAlpha = 0.6; lc.drawImage(G.eye, Math.round(s.x) - cx - 6, Math.round(s.y) - cy - 6); }
  for (const m of fpMarks) { lc.globalAlpha = 0.45 + (1 - m.t / 0.8) * 0.4; lc.drawImage(G.mark, Math.round(m.x) - cx - 10, Math.round(m.y) - cy - 12); }
  for (const s of fpSpikes) { lc.globalAlpha = 0.4 * Math.min(1, s.t / 0.3); lc.drawImage(G.crystal, Math.round(s.x) - cx - 16, Math.round(s.y) - cy - 26); }
  lc.globalAlpha = 1;
});
function fpbClear() { fpShards.length = 0; fpSeeds.length = 0; fpMarks.length = 0; fpSpikes.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { fpbClear(); return _nw(sd, sv); }; }
// a lizard that is spawned still starts as a statue; the root starts without a root
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'lagartoqz') e.animT = 0;
  if (e && type === 'estrangula') { e.fpInit = false; e.fpRoot = []; }
  return e;
}; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  fpTail() { noise(0.035, 0.09, 3400, 'highpass'); tone(1100, 0.04, 'square', 0.025, -700); noise(0.05, 0.05, 1800, 'bandpass', 0.06, 4); },   // the tail cracks like a whip of stone
  fpLeap() { noise(0.12, 0.05, 700, 'lowpass'); },
  fpBite() { noise(0.06, 0.08, 1500, 'bandpass', 0, 2); tone(260, 0.06, 'square', 0.03, -120); },
  fpSettle() { noise(0.05, 0.03, 900, 'bandpass', 0, 3); tone(2600, 0.05, 'sine', 0.01, 200, 0.02); },   // a stone ticking still, a glint
  fpGrow() { noise(0.12, 0.04, 380, 'lowpass'); tone(90, 0.1, 'triangle', 0.02, -20); },
  fpCreak() { tone(120, 0.55, 'sawtooth', 0.025, 60); noise(0.55, 0.03, 600, 'bandpass', 0, 6); },
  fpGrab() { noise(0.1, 0.09, 500, 'lowpass'); tone(160, 0.12, 'square', 0.03, -80); },
  fpCrack() { noise(0.07, 0.08, 1200, 'bandpass', 0, 2); tone(420, 0.05, 'square', 0.02, -200); },
  fpSnap() { noise(0.18, 0.09, 900, 'lowpass'); tone(220, 0.2, 'sawtooth', 0.03, -150); },
  fpOpen() { tone(300, 0.4, 'triangle', 0.03, 180); noise(0.3, 0.03, 2400, 'highpass'); },
  fpClose() { tone(260, 0.25, 'triangle', 0.025, -120); noise(0.15, 0.04, 500, 'lowpass'); },
  fpTok() { tone(180, 0.05, 'square', 0.03, -60); noise(0.04, 0.05, 800, 'lowpass'); },
  fpScrape() { noise(0.7, 0.06, 520, 'bandpass', 0, 3); tone(62, 0.7, 'sawtooth', 0.025, 20); noise(0.3, 0.04, 1600, 'bandpass', 0.35, 5); },   // the shell grinding shut
  fpRoll() { tone(55, 0.5, 'sawtooth', 0.03, 15); noise(0.4, 0.05, 400, 'lowpass'); },
  fpRumble() { noise(0.26, 0.035, 260, 'lowpass'); },
  fpBounce() { tone(90, 0.14, 'sine', 0.07, -40); noise(0.1, 0.06, 900, 'lowpass'); },
  fpThud() { tone(60, 0.3, 'sine', 0.09, -25); noise(0.25, 0.08, 500, 'lowpass'); tone(1500, 0.5, 'sine', 0.01, -300, 0.15); },
  fpStep() { tone(70, 0.12, 'sine', 0.035, -20); noise(0.08, 0.025, 400, 'lowpass'); },
  fpBuzz(v = 1) { tone(1250, 0.22, 'triangle', 0.008 * v, 80); tone(1880, 0.18, 'sine', 0.006 * v, -60, 0.04); },   // the hum of glass wings
  fpChime() { tone(1320, 0.5, 'sine', 0.025, 500); tone(1980, 0.45, 'sine', 0.015, 700, 0.08); },
  fpShatter() { noise(0.12, 0.06, 4200, 'highpass'); for (let k = 0; k < 4; k++) tone(2200 + k * 420, 0.09, 'sine', 0.012, 0, k * 0.03); },
  fpTink() { tone(2600 + Math.random() * 900, 0.08, 'sine', 0.014); },
  fpThrow() { noise(0.1, 0.04, 1200, 'bandpass'); tone(880, 0.15, 'sine', 0.015, 400); },
  fpSprout() { tone(1600, 0.25, 'sine', 0.02, -600); noise(0.12, 0.06, 2600, 'highpass'); },
  fpSink() { noise(0.45, 0.05, 340, 'lowpass'); tone(80, 0.45, 'triangle', 0.025, -20); },
  fpEmerge() { noise(0.45, 0.05, 420, 'lowpass'); tone(70, 0.45, 'triangle', 0.025, 30); },
  fpGrind() { noise(0.3, 0.02, 300, 'lowpass'); }
});
