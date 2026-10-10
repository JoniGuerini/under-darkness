'use strict';

/* ================= the Taken of the fungal mines, part two =================
   The other five Tomados (123 has the first five), each moving its own way (docs/camadas/05-minas-fungicas.md, 6):
   - the sprouts (brotos), little lantern mushrooms that hop in a line, each one after the one ahead; they squat and
     hiss, jump on you and hang on: each one drains a little and slows you 5%; a jump or a swing shakes them off.
     A group is one leader that brings its followers when it spawns (e.fgFollower marks the followers);
   - the taken cricket, that crosses the cave in long leaps bouncing off walls and roof like a ball; its legs pulse
     and it trills, then it shoots straight at you; when it misses it sits dazed where it hit;
   - the stilt-walker (pernalta), a wading bird four blocks tall on thin legs; it walks over water and over you with
     its body out of reach; it lifts a leg, a round shadow falls on the floor, it stomps; the stuck leg takes double
     damage, and with a leg broken it falls and fights on the floor, pecking;
   - the taken mule, with a huge cap on its back: slow, never jumps, leaves a mycelium trail that slows you; from the
     front it shakes the cap and lobs three heavy spores (a circle on the floor where each one lands); from behind it
     lifts its rump and kicks;
   - the mycelium jellyfish, that pulses up and down in and out of the water (sinking slowly in the air); its 3-block
     tentacles light up from the top down and whip whatever is below.
   The hero's states (esporado, lento) are 120's helpers; 125 ticks them. Water is 171/172 (both load later: only
   used at run time). Same brush as 55 (cp, ramps, outline, cache). Loads after 123 and before 49 (BAL). */

/* ---------- stats ---------- */
Object.assign(ET, {
  brotos: { name: 'Brotos', w: 7, h: 7, hp: 10, dmg: 5, xp: 5, kb: 1.3, fly: false, blood: '#c4bca2' },
  grilo: { name: 'Grilo Tomado', w: 14, h: 9, hp: 48, dmg: 15, xp: 24, kb: 0.6, fly: true, blood: '#8a7440' },     // fly: its own gravity (it bounces)
  pernalta: { name: 'Pernalta', w: 16, h: 60, hp: 200, dmg: 26, xp: 52, kb: 0.04, fly: true, blood: '#a8b2a6' },   // fly: stands on floor or water by itself
  mula: { name: 'Mula Tomada', w: 28, h: 26, hp: 260, dmg: 24, xp: 56, kb: 0.05, fly: false, blood: '#846652' },
  aguaviva: { name: 'Água-Viva de Micélio', w: 14, h: 12, hp: 45, dmg: 14, xp: 24, kb: 0.7, fly: true, amph: true, blood: '#7accc0' }
});
const FT2_TYPES = ['brotos', 'grilo', 'pernalta', 'mula', 'aguaviva'];
const FT2_BASES = (k) => [['capacete_lanterna', k], ['botas_seiva', k], ['gancho_colheita', k]];
const FT2_DROPS = {
  brotos: [['chapeu_lanterna', 0.3], ['pocao', 0.05], ['min_esporita', 0.05], ...FT2_BASES(0.004)],
  grilo: [['perna_grilo', 0.5], ['pocao', 0.08], ['min_esporita', 0.06], ...FT2_BASES(0.004)],
  pernalta: [['perna_grilo', 0.5, 1, 2], ['pocao', 0.1], ['min_esporita', 0.12, 1, 2], ...FT2_BASES(0.01)],
  mula: [['chapeu_lanterna', 0.5, 1, 2], ['pocao', 0.1], ['min_esporita', 0.12, 1, 2], ...FT2_BASES(0.01)],
  aguaviva: [['po_mariposa', 0.4], ['pocao', 0.08], ['min_esporita', 0.06], ...FT2_BASES(0.004)]
};
function ft2Tables() { for (const k of FT2_TYPES) DROPS[k] = FT2_DROPS[k].filter(([id]) => ITEMS[id]); }
ft2Tables();
Object.assign(NAV_WALKERS, { mula: 1 });
Object.assign(CV_STEP, { mula: 1, pernalta: 1, brotos: 1 });

/* ================= art ================= */
const FT2 = {};
{
const { RB, cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RF = {
  mic: R7(['#1e1c16', '#3a372c', '#5e5a48', '#8a846c', '#b4ac90', '#d8d0b2', '#ece4c8']),      // mycelium: cream, never white
  caule: R7(['#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4', '#efe8d2']),    // mushroom stalk
  chapeu: R7(['#0a2024', '#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']),   // caps and gills
  lume: R7(['#16444a', '#1e6a6e', '#3a9a94', '#5ab4aa', '#7accc0', '#a8e4d8', '#d8fcf0']),     // lit gills
  esporo: R7(['#0c2a2a', '#145048', '#1e7a6a', '#34a890', '#6ad4b4', '#a8eccc', '#c8fce8']),   // spores, as the spore metal
  casca: R7(['#100c06', '#1e170c', '#322814', '#4a3c1e', '#62502a', '#7c6838', '#98824a']),    // the cricket's shell
  pelo: R7(['#120d0a', '#221a14', '#362a20', '#4c3c2e', '#64503e', '#7e6650', '#987e66']),     // the mule's coat
  couro: R7(['#0e0806', '#1a100a', '#2a1a10', '#3c2616', '#50341e', '#664428', '#7c5634']),    // harness leather
  casco: R7(['#080706', '#121010', '#1c1918', '#282422', '#36312d', '#463f3a', '#574f48']),    // hooves
  pena: R7(['#101418', '#1c242a', '#2c363e', '#404c56', '#58666e', '#76848a', '#96a4a8']),     // the heron's grey-blue
  bico: R7(['#1a1406', '#30260c', '#4c3c14', '#6a561e', '#8a722a', '#a68e3c', '#c2aa56']),     // beak and old leg colour
  boca: R7(['#080404', '#140808', '#200c0c', '#2e1212', '#3e1818', '#4e2020', '#602a2a'])
};
// mycelium over an old colour: clumps of cream that leave patches of the old showing; `cov` 0..1
const vnoise = (x, y, s, c) => { const gx = Math.floor(x / c), gy = Math.floor(y / c), fx = x / c - gx, fy = y / c - gy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(gx, gy, s), hash2(gx + 1, gy, s), sx), lerp(hash2(gx, gy + 1, s), hash2(gx + 1, gy + 1, s), sx), sy); };
const myc = (x, y, s, cov) => vnoise(x, y, s, 2.6) * 0.8 + hash2(x, y, s + 3) * 0.2 < cov;
// a lit blob whose pixels turn cream where the mycelium has taken it
function mblob(P, cx, cy, rx, ry, R, s, base, cov, f) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
    const c = typeof cov === 'function' ? cov(x, y, dx, dy) : cov, m = c > 0 && myc(x, y, s, c);
    P.put(x, y, m ? RF.mic : R, base + 1.3 - (dx * 0.8 + dy) * 1.4 - d * 0.7 + cg(x, y, s) * 0.45 + (m ? 0.6 : 0) + (f ? f(x, y, dx, dy) : 0));
  }
}
function mline(P, x0, y0, x1, y1, R, v, s, cov) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n, m = myc(x | 0, y | 0, s, cov); P.put(x, y, m ? RF.mic : R, (typeof v === 'function' ? v(i / n) : v) + (m ? 0.6 : 0)); }
}

/* a sprout, 11 x 11: 0 standing, 1 hopping (stretched), 2 squatting to jump (hissing), 3 clinging (flat, feet spread) */
function broto(pose) {
  const P = cp(11, 11), s = 13101 + pose * 7, hop = pose === 1, sq = pose === 2, cl = pose === 3;
  const cy = hop ? 3.6 : sq ? 5.8 : cl ? 5 : 4.6, rx = hop ? 3.8 : sq ? 5 : cl ? 5.2 : 4.4, ry = hop ? 3 : sq ? 2.4 : cl ? 2.2 : 2.8;
  const st0 = cy + 1, st1 = hop ? 9 : sq ? 9 : 9.4;
  // the stalk: a pale stub with a frill of gills at the top
  for (let y = Math.floor(st0); y <= st1; y++) for (let x = 3.6; x <= 6.4; x++) { const u = (x - 3.6) / 2.8; P.put(x, y, RF.caule, 4.8 - u * 2.2 + cg(x, y, s) * 0.6 - (y - st0) * 0.12); }
  // feet: two nubs (dangling in the hop, spread when it clings)
  if (cl) { P.line(3.4, 9, 1, 10, RF.caule, 3); P.line(6.6, 9, 9.4, 10, RF.caule, 2.4); }
  else if (hop) { P.put(3.6, 10, RF.caule, 3.4); P.put(6.2, 10, RF.caule, 2.6); }
  else { P.put(3, 10, RF.caule, 3.6); P.put(4, 10, RF.caule, 3); P.put(6, 10, RF.caule, 2.8); P.put(7, 10, RF.caule, 2.4); }
  // a face on the stalk: two dark pits, a mouth that opens to hiss
  const fy = Math.min(st1 - 1.4, st0 + 1.6);
  P.put(4.6, fy, RF.boca, 0.6); P.put(6, fy, RF.boca, 0.8);
  if (sq) { P.put(4.8, fy + 1.4, RF.boca, 0.2); P.put(5.8, fy + 1.4, RF.boca, 0.4); } else P.put(5.4, fy + 1.4, RF.boca, 2.2);
  // the gills under the cap: a band of glowing teal
  for (let x = 5.5 - rx + 0.6; x <= 5.5 + rx - 0.6; x++) P.put(x, cy + 0.6, sq ? RF.lume : RF.chapeu, sq ? 5.4 : 4.6 + (x % 2 ? 0.6 : 0));
  // the cap: a teal dome, cream flecks, the old spore dust on top
  for (let y = Math.floor(cy - ry); y <= cy; y++) for (let x = Math.floor(5.5 - rx); x <= 5.5 + rx; x++) {
    const dx = (x + 0.5 - 5.5) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue;
    P.put(x, y, RF.chapeu, 4.4 - dx * 1.1 - dy * 1.2 + cg(x, y, s) * 0.6);
  }
  for (const [x, y] of [[4, cy - ry + 1.2], [6.8, cy - ry + 1.8], [3, cy - 0.6], [8, cy - 0.4]]) P.put(x, y, RF.mic, 5.4);
  return set(P.done());
}

/* the taken cricket, 26 x 15 facing right: 0 sitting, 1-2 trilling (wings up, the big legs pulsing), 3 leaping
   (stretched, hind legs thrown back), 4 dazed (legs splayed, antennae drooping). A stalk of mycelium has grown out of
   its back; the brown shell still shows between the cream crusts */
function grilo(pose) {
  const W = 26, H = 15, P = cp(W, H), s = 13201 + pose * 5, tr = pose === 1 || pose === 2, leap = pose === 3, dz = pose === 4;
  const lift = pose === 1 ? -1 : pose === 2 ? 0.6 : 0, by = leap ? 7.6 : 9;
  const cov = (x, y) => clamp(0.42 - Math.hypot(x - 17, y - 5) * 0.035, 0.08, 0.45);
  const leg = (x0, y0, x1, y1, v) => P.line(x0, y0, x1, y1, RF.casca, v);
  // far legs, dark and thin
  if (leap) { leg(11, by + 1, 4.6, by + 2.6, 1.4); leg(4.6, by + 2.6, 1, by + 4.6, 1.2); leg(16, by + 2, 20, by + 4, 1.2); }
  else if (dz) { leg(11, by + 1, 6, by - 4, 1.4); leg(6, by - 4, 2, by - 2, 1.2); leg(15, by + 2, 13, H - 1, 1.2); }
  else { leg(7.4, 6, 8.4, H - 1, 1.2); leg(15.6, by + 2, 14.6, H - 1, 1.2); }
  // abdomen: a tapering capsule, ringed, cream at the joints
  for (let y = by - 3; y <= by + 3; y++) for (let x = 2; x <= 15.6; x++) {
    const u = (x - 2) / 13.6, r = 1.4 + Math.sin(Math.min(1, u * 1.25) * Math.PI / 2) * 1.6, dy = (y + 0.5 - by - (1 - u) * 0.6) / r;
    if (Math.abs(dy) > 1) continue;
    const ring = Math.floor(x) % 3 === 0, m = myc(x, y, s, cov(x, y)) || (ring && hash2(x, y, s + 9) < 0.35);
    P.put(x, y, m ? RF.mic : RF.casca, 2.8 - dy * 1.4 - u * 0.3 + cg(x, y, s) * 0.5 + (ring ? -0.9 : 0) + (m ? 1.2 : 0));
  }
  // the wings folded along its back (lifted at the tail end to trill)
  const wr = tr ? (pose === 1 ? 3.2 : 1.8) : 0;
  for (let i = 0; i <= 16; i++) { const t = i / 16, x = 16 - t * 13.4, y = by - 3.2 + t * 0.6 - wr * t; P.put(x, y, RF.casca, 5 - t * 0.8); P.put(x, y + 1, RF.casca, 3.4 - t * 0.6); if (i % 4 === 2) P.put(x, y + 1, RF.casca, 1.6); }
  // the pronotum, a saddle; then the head with its clouded eye
  mblob(P, 17, by - 0.6, 3, 3, RF.casca, s + 2, 3.6, cov, (x, y, dx, dy) => (dy < -0.5 ? 0.6 : 0));
  const hx = leap ? 21.8 : dz ? 21 : 21.4, hy = by + (dz ? 1.2 : 0);
  mblob(P, hx, hy, 2.4, 2.8, RF.casca, s + 3, 3.4, 0.12);
  P.put(hx + 0.6, hy - 1, RF.mic, dz ? 3 : 5.6); P.put(hx + 1.4, hy - 1, RF.mic, dz ? 2.4 : 4.6); P.put(hx + 1, hy - 0.2, RF.esporo, dz ? 1.6 : 4.8);
  P.line(hx + 1.6, hy + 2, hx + 2.4, hy + 3, RF.casca, 2.2);
  // antennae: long threads arching back over it (drooping in front when dazed)
  const ants = dz ? [[[hx + 1.6, hy - 2], [hx + 3.4, hy - 0.6], [hx + 4.4, hy + 2.6]]] : leap ? [[[hx + 0.6, hy - 2.4], [hx - 1, hy - 5], [hx - 7, hy - 6.4]], [[hx + 1.4, hy - 2.2], [hx + 0.4, hy - 4], [hx - 4, hy - 4.8]]]
    : [[[hx + 0.6, hy - 2.6], [hx + 1.4, hy - 6 + lift * 0.4], [hx - 1.6, hy - 8.6 + lift * 0.6], [hx - 4, hy - 8.4 + lift]], [[hx + 1.4, hy - 2.4], [hx + 3, hy - 4.6], [hx + 3.4, hy - 6.6]]];
  for (const ant of ants) for (let i = 0; i < ant.length - 1; i++) P.line(ant[i][0], ant[i][1], ant[i + 1][0], ant[i + 1][1], i ? RF.mic : RF.casca, i ? 4.2 : 3.6);
  // near legs
  if (leap) { leg(16.6, by + 2, 21, by + 3.6, 3); leg(18.6, by + 2, 22.6, by + 2.6, 2.6); }
  else if (dz) { leg(16.6, by + 2, 15, H - 1, 3); leg(18.6, by + 2, 21.6, H - 1, 3); }
  else { leg(16.6, by + 2, 16, H - 1, 3.2); leg(18.6, by + 2, 20, H - 1, 3.2); }
  // the near hind leg: a big drumstick femur with dark chevrons, a thin spined shank
  let hip = [11.6, by + 0.4], knee, foot;
  if (leap) { knee = [5.4, by + 1.6]; foot = [0.4, by + 4]; }
  else if (dz) { knee = [7, 2.2]; foot = [1.6, 4.4]; }
  else { knee = [4.6 + lift * 0.4, 3 + lift]; foot = [9.6, H - 1]; }
  P.line(hip[0] + 0.6, hip[1] + 1.8, knee[0] + 0.8, knee[1] + 1.6, RF.casca, 0.6);   // its shadow on the body
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = lerp(hip[0], knee[0], t), y = lerp(hip[1], knee[1], t), r = 1.9 - t * 1.2, nx = -(knee[1] - hip[1]), ny = knee[0] - hip[0], nl = Math.hypot(nx, ny) || 1;
    for (let k = -r; k <= r + 0.01; k += 0.5) { const side = k / Math.max(0.5, r); P.put(x + nx / nl * k, y + ny / nl * k, i % 4 === 2 && side > -0.6 ? RF.casca : RF.bico, i % 4 === 2 && side > -0.6 ? 2 : 4.6 - side * 1.3); }
  }
  P.put(knee[0], knee[1], RF.mic, 4.6);
  P.line(knee[0], knee[1], foot[0], foot[1], RF.bico, 3.4);
  for (let i = 1; i < 4; i++) { const t = i / 4; P.put(lerp(knee[0], foot[0], t) + (leap ? 0 : 1), lerp(knee[1], foot[1], t) + (leap ? 1 : 0), RF.casca, 2); }   // spines
  if (!leap && !dz) P.line(foot[0], foot[1], foot[0] + 2.4, foot[1], RF.casca, 2.6);
  // the stalk growing out of its back, a teal bud at the tip
  const sx = 9.6, sy = by - 2.6;
  P.line(sx, sy, sx - 1, sy - 4.4, RF.caule, 4.8); P.put(sx - 1.4, sy - 5.2, RF.lume, 5.6); P.put(sx - 0.6, sy - 5.4, RF.lume, 4.6); P.put(sx - 1, sy - 6, RF.lume, 4);
  return set(P.done());
}

/* the taken mule, 44 x 32 facing right: 0-1 walking, 2 shaking the cap (spores puffing), 3 rump up (about to kick),
   4 kicking (hind legs thrown back). A cap as wide as its back, gills glowing under it; the coat still brown on the
   legs and the head, cream where the fungus has spread down from the cap */
function mula(pose) {
  const W = 44, H = 32, P = cp(W, H), s = 13301 + pose * 3, ph = pose === 1 ? 1 : pose === 0 ? -1 : 0, shk = pose === 2, rump = pose === 3, kick = pose === 4;
  const tilt = rump ? -4 : kick ? -2 : 0;   // hindquarters raised
  const cov = (x, y) => clamp(0.82 - Math.hypot(x - 20, (y - 9) * 1.4) * 0.05, 0.05, 0.85);
  const hip = [12, 17 + tilt], sh = [30, 17.4];
  // legs: knee joints, hooves; far side darker
  const leg = (x0, y0, kx, ky, fx, fy, v, ss) => { mline(P, x0, y0, kx, ky, RF.pelo, v + 0.4, ss, 0.12); mline(P, kx, ky, fx, fy - 1, RF.pelo, v, ss + 1, 0.06); P.put(fx, fy, RF.casco, v - 0.4); P.put(fx + 1, fy, RF.casco, v - 1); };
  // far legs
  if (kick) { leg(hip[0], hip[1], 5, 16, 1.4, 13.6, 1.8, s + 10); }
  else leg(hip[0] + 1, hip[1], hip[0] - 0.6 - ph, 24 + (rump ? -1 : 0), hip[0] + 1 - ph * 1.6, H - 1, 1.8, s + 10);
  leg(sh[0] + 1, sh[1], sh[0] + 1.6 + ph, 24.6, sh[0] + 2 + ph * 1.6, H - 1, 1.8, s + 11);
  // tail: a thin rope with a tuft
  if (!kick && !rump) { P.line(7.4, 12 + tilt, 5.6, 20 + tilt, RF.pelo, 2.2); P.blob(5.4, 21 + tilt, 1.2, 1.6, RF.couro, s + 12, 2.4); }
  else { P.line(7.4, 11.6 + tilt, 4, 8, RF.pelo, 2.2); P.blob(3.4, 7.4, 1.4, 1.2, RF.couro, s + 12, 2.4); }
  // body: one long barrel, belly sagging
  for (let y = 10; y <= 21; y++) for (let x = 6; x <= 34; x++) {
    const u = (x - 6) / 28, yc = 15.6 + tilt * (1 - u) * 0.9, ry = 5.2 + Math.sin(u * Math.PI) * 0.8, dx = (u - 0.5) * 2, dy = (y + 0.5 - yc) / ry;
    if (dx * dx * 0.9 + dy * dy > 1) continue;
    const m = myc(x, y, s, cov(x, y));
    P.put(x, y, m ? RF.mic : RF.pelo, 3.6 + 1.3 - (dx * 0.6 + dy) * 1.5 + cg(x, y, s) * 0.5 + (m ? 0.4 : 0) - (dy > 0.6 ? 0.8 : 0));
  }
  // the old harness: a breast strap and a girth with a rusted ring
  for (let y = 11; y <= 20; y++) P.put(28.6 + (y - 11) * 0.12, y, RF.couro, 3 + (y === 11 ? 1 : 0));
  for (let y = 10.4; y <= 20; y++) P.put(17 + (y - 10) * 0.05 + tilt * 0.1, y + tilt * 0.4, RF.couro, 2.6 + (y < 12 ? 1 : 0));
  P.put(17.4, 18 + tilt * 0.4, RB.bronze, 4.6);
  // neck and head, carried low and tired: a long horse's head, a pale muzzle, long ears laid back
  const ears = () => { for (const [ex, ev] of [[-0.6, 2.4], [0.8, 4]]) { P.line(px + ex, py - 0.6, px + ex - 2.2, py - 6.4 + (rump ? 1.4 : 0), RF.pelo, ev); P.line(px + ex + 0.8, py - 0.4, px + ex - 1.2, py - 5.4 + (rump ? 1.4 : 0), RF.pelo, ev - 1.2); P.put(px + ex - 2.2, py - 6.2 + (rump ? 1.4 : 0), RF.mic, ev + 1.4); } };
  const hd = rump ? 3 : kick ? 1.6 : ph * 0.4, px = 36.6, py = 13.4 + hd, mx = 41.6, my = 21 + hd;
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(29, px, t), y = lerp(12.6, py, t) - Math.sin(t * Math.PI) * 0.8, r = 3.6 - t * 1.2; for (let k = -r; k <= r; k += 0.5) P.put(x - k * 0.25, y + k, RF.pelo, 3.8 - k * 0.4 + cg(x, y + k, s) * 0.5 + (myc(x, y + k, s, 0.3 - t * 0.2) ? 0 : 0)); }
  for (let i = 0; i < 6; i++) P.put(30 + i * 1.2, 9.6 + i * 0.6 + hd * i / 6, RF.couro, 1.4 + (i % 2) * 0.8);   // a short dark mane
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(px, mx, t), y = lerp(py, my, t), r = 2.3 - t * 0.7; for (let k = -r; k <= r; k += 0.5) P.put(x + k * 0.55, y - k * 0.55, t > 0.75 ? RF.caule : RF.pelo, (t > 0.75 ? 2.2 : 3.8) + k * 0.5 + cg(x, y, s + 3) * 0.5); }
  P.put(mx + 0.4, my - 0.6, RF.boca, 1); P.put(mx - 0.6, my + 1, RF.boca, 0.6);   // nostril, mouth
  P.put(px + 1.2, py + 0.4, RF.mic, 5.6); P.put(px + 2, py + 0.6, RF.esporo, 3.2);   // a clouded eye
  // near legs
  if (kick) {
    leg(hip[0], hip[1] + 1, 6, 18.6, 1.6, 17.4, 3.4, s + 13);
    P.put(0.6, 16.6, RF.casco, 4.4); P.put(0.6, 17.6, RF.casco, 3);
  } else leg(hip[0] - 0.6, hip[1] + 1, hip[0] - 1 + ph, 24.6 + (rump ? -1 : 0), hip[0] - 0.8 + ph * 1.8, H - 1, 3.4, s + 13);
  leg(sh[0] - 0.6, sh[1] + 1, sh[0] - 0.6 - ph, 25, sh[0] - 0.4 - ph * 1.8, H - 1, 3.4, s + 14);
  // the cap: stalk, then the dome, the glowing gills underneath, a few cream scales on top
  const cx = 19.6 + (shk ? 1.4 : rump ? 1.2 : 0), cy = 9 + (rump ? tilt * 0.6 : 0), crx = 11.6, cry = 7.2;
  for (let y = cy; y <= 12 + tilt * 0.5; y++) for (let x = 17.6; x <= 22.6; x++) P.put(x, y, RF.caule, 4.6 - (x - 17.6) * 0.5 + cg(x, y, s) * 0.6);
  for (let x = cx - crx + 1; x <= cx + crx - 1; x++) { const g = (Math.floor(x) % 2 === 0) ? 0.8 : 0; P.put(x, cy + 0.6, RF.lume, (shk ? 5.6 : 4.8) + g); P.put(x, cy + 1.4, RF.chapeu, 2.6 + g); }
  for (let y = Math.floor(cy - cry); y <= cy + 1; y++) for (let x = Math.floor(cx - crx); x <= cx + crx; x++) {
    const sl = shk ? (y - cy) * 0.2 : rump ? (y - cy) * -0.25 : 0, dx = (x + 0.5 - cx - sl) / crx, dy = (y + 0.5 - cy) / cry;
    const rim = y > cy - 0.5 && Math.abs(dx) > 0.82 && Math.abs(dx) <= 1.02;   // the lip curls down at the edge
    if (!rim && (dy > 0 || dx * dx + dy * dy > 1)) continue;
    P.put(x, y, RF.chapeu, rim ? 2.6 : 4.2 - dx * 1 - dy * 1.8 + cg(x, y, s + 5) * 0.6 - (dy > -0.25 ? 0.9 : 0));
  }
  for (let k = 0; k < 11; k++) { const a = -0.25 - hash2(k, 1, s) * 2.65, d = 0.3 + hash2(k, 2, s) * 0.55, x = cx + Math.cos(a) * crx * d, y = cy + Math.sin(a) * cry * d; P.put(x, y, RF.mic, 5); if (k % 2) P.put(x + 1, y, RF.mic, 4); }
  if (shk) for (let k = 0; k < 7; k++) P.put(cx - 10 + k * 3.4 + hash2(k, 5, s) * 2, cy - cry - 1 - hash2(k, 6, s) * 1.6, RF.esporo, 5 + (k % 2));   // spores shaken up
  ears();
  return set(P.done());
}

/* the stilt-walker's body (the legs are drawn apart, they bend): 34 x 22 facing right, the hips at (13, 20):
   0 standing, 1 walking (neck forward), 2 lifting a leg (wings half open for balance), 3 stomping (leaning down,
   beak open) */
function pernBody(pose) {
  const W = 34, H = 22, P = cp(W, H), s = 13401 + pose * 3, lift = pose === 2, st = pose === 3, wk = pose === 1;
  const cov = (x, y) => clamp(0.7 - Math.hypot(x - 14, (y - 8) * 1.2) * 0.045, 0.08, 0.72);
  const by = st ? 15.4 : 14.6;
  // the open wing behind (lifting)
  if (lift) udPolyF(P, [[16, by - 3], [6, 3], [8.6, 6.6], [3, 5.6], [6, 10], [1.6, 10.6], [7, by + 1]], RF.pena, 3.4, 1.6, s + 9);
  // tail: a fan of drab feathers
  for (let k = 0; k < 4; k++) P.line(6, by + 0.6, 0.6 + k * 0.4, by - 1 + k * 1.4, RF.pena, 2.4 + (k === 0 ? 1 : 0));
  // body
  mblob(P, 12.6, by, 8, 4.8, RF.pena, s, 3.4, cov, (x, y, dx, dy) => ((x + y * 2) % 5 === 0 ? -0.7 : 0));
  // the folded wing: long feathers down the side
  for (let k = 0; k < 4; k++) mline(P, 17 - k * 0.6, by - 2 + k * 0.8, 5 + k * 0.4, by + 1 + k * 0.9, RF.pena, 2.6 + (k === 0 ? 1.6 : 0), s + k, 0.35);
  // thighs under the body, to the hips
  P.blob(13.4, by + 4, 2.2, 2, RF.pena, s + 4, 2.4);
  // the neck: an S, cream threads winding up it
  const nk = st ? [[18, by - 1], [22, by + 1], [25, by + 3.4], [27.4, by + 4]] : wk ? [[18.4, by - 2], [22.8, by - 4.4], [23.4, by - 8], [26, by - 9.2]] : [[18, by - 2], [21.6, by - 4], [21.4, by - 8], [23.6, by - 9.6]];
  for (let i = 0; i < nk.length - 1; i++) { P.line(nk[i][0] + 0.7, nk[i][1] + 0.5, nk[i + 1][0] + 0.7, nk[i + 1][1] + 0.5, RF.pena, 2.2); mline(P, nk[i][0], nk[i][1], nk[i + 1][0], nk[i + 1][1], RF.pena, 4.2 - i * 0.3, s + 20 + i, 0.4); }
  const [hx, hy] = nk[nk.length - 1];
  mblob(P, hx, hy, 2.2, 1.8, RF.pena, s + 5, 3.8, 0.3);
  P.put(hx + 0.6, hy - 0.4, RF.mic, 5.6); P.put(hx + 1.2, hy - 0.4, RF.esporo, 3.4);   // a clouded eye
  // the beak: long and dagger-like (open when it stomps)
  const bl = 7.6, ba = st ? 0.6 : 0.16;
  for (let i = 0; i <= 14; i++) { const t = i / 14, x = hx + 1.6 + Math.cos(ba) * bl * t, y = hy + 0.2 + Math.sin(ba) * bl * t; P.put(x, y, RF.bico, 4.6 - t); if (t < 0.8) P.put(x, y + 1, RF.bico, 2.6 - t); }
  if (st) for (let i = 0; i <= 10; i++) { const t = i / 10; P.put(hx + 1.6 + Math.cos(ba + 0.5) * 6 * t, hy + 1.2 + Math.sin(ba + 0.5) * 6 * t, RF.bico, 3 - t); }
  // a crest of fungal frills on the head, glowing at the tips
  for (let k = 0; k < 3; k++) { const x = hx - 0.6 - k * 1, y = hy - 1.4; P.line(x, y, x - 0.8 - k * 0.4, y - 2.8 + k * 0.6, RF.mic, 4.6 - k * 0.6); P.put(x - 0.8 - k * 0.4, y - 3 + k * 0.6, RF.lume, 5.2); }
  // fungal ruffs sprouting on the back
  for (let k = 0; k < 4; k++) { const x = 9 + k * 2.4, y = by - 4.4 + Math.abs(k - 1.5) * 0.4; P.put(x, y, RF.mic, 5.4); P.put(x + 1, y - 0.6, RF.mic, 4.6); if (k % 2) P.put(x + 0.6, y - 1.6, RF.lume, 4.8); }
  return set(P.done());
}
/* the stilt-walker fallen, 36 x 16 facing right: 0 lying (neck up), 1 neck drawn back to peck, 2 pecking */
function pernFallen(pose) {
  const W = 36, H = 16, P = cp(W, H), s = 13451 + pose * 3;
  const cov = (x, y) => clamp(0.66 - Math.hypot(x - 12, (y - 8) * 1.2) * 0.045, 0.08, 0.7);
  // the broken leg trailing behind, the folded one under it
  P.line(6, 12.6, 0.6, 14.4, RF.bico, 2.6); P.line(0.6, 14.4, 2.8, 15, RF.bico, 1.6); P.put(0.6, 13.6, RF.mic, 4);
  for (let k = 0; k < 4; k++) P.line(4, 9.6, 0.4 + k * 0.5, 7.6 + k * 1.2, RF.pena, 2.2 + (k === 0 ? 1 : 0));
  mblob(P, 12, 10.4, 8.6, 4.4, RF.pena, s, 3.2, cov, (x, y, dx, dy) => ((x + y * 2) % 5 === 0 ? -0.7 : 0) + (dy > 0.5 ? -0.6 : 0));
  for (let k = 0; k < 4; k++) mline(P, 17 - k * 0.6, 8 + k * 0.8, 5 + k * 0.4, 10.6 + k * 0.9, RF.pena, 2.6 + (k === 0 ? 1.6 : 0), s + k, 0.35);
  P.line(14, 14, 19, 15, RF.bico, 3.4); for (let k = 0; k < 3; k++) P.put(19.6 + k, 15, RF.bico, 3.6 - k * 0.4);   // the good leg folded under
  const nk = pose === 1 ? [[18, 8.6], [20.6, 5], [19, 2.2], [21.6, 1.2]] : pose === 2 ? [[18, 9], [23, 9.4], [27, 10.6], [29.6, 11.4]] : [[18, 8.6], [21.4, 6.4], [21.6, 3], [24, 1.8]];
  for (let i = 0; i < nk.length - 1; i++) mline(P, nk[i][0], nk[i][1], nk[i + 1][0], nk[i + 1][1], RF.pena, 3.8 - i * 0.3, s + 20 + i, 0.4);
  const [hx, hy] = nk[nk.length - 1];
  mblob(P, hx, hy, 2.2, 1.8, RF.pena, s + 5, 3.8, 0.3);
  P.put(hx + 0.6, hy - 0.4, RF.mic, 5.6); P.put(hx + 1.2, hy - 0.4, RF.esporo, 3.4);
  const ba = pose === 2 ? 0.3 : pose === 1 ? -0.2 : 0.16;
  for (let i = 0; i <= 14; i++) { const t = i / 14, x = hx + 1.6 + Math.cos(ba) * 7.4 * t, y = hy + 0.2 + Math.sin(ba) * 7.4 * t; P.put(x, y, RF.bico, 4.6 - t); if (t < 0.8) P.put(x, y + 1, RF.bico, 2.6 - t); }
  for (let k = 0; k < 3; k++) { const x = hx - 1.4 - k * 1.2, y = hy - 1.6; P.line(x, y, x - 1.6, y - 2.2 + k * 0.4, RF.mic, 4.6 - k * 0.6); }
  return set(P.done());
}
// a polygon filled top (light) to bottom (dark), as 77's udPoly (which loads before: kept local so 124 stands alone)
function udPolyF(P, pts, R, v0, v1, s) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5; let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; }
    if (ins) P.put(x, y, R, lerp(v0, v1, (py - y0) / Math.max(1, y1 - y0)) + cg(x, y, s) * 0.35);
  }
}
/* the stilt-walker's leg pieces, drawn straight down and turned at draw time: the upper bone (3 wide), the shank
   (2 wide), a knee knob and the foot (three splayed toes). The old ochre shows between cream bands */
function legPiece(w, L, s) {
  const P = cp(w, L);
  for (let y = 0; y < L; y++) for (let x = 0; x < w; x++) {
    const m = (y % 9 < 2 && hash2(1, y, s) < 0.8) || (hash2(x, y, s) < 0.12);
    P.put(x, y, m ? RF.mic : RF.bico, (w === 3 ? 4.4 - x * 1.2 : 4 - x * 1.6) + cg(x, y, s) * 0.5 + (m ? 0.8 : 0) - y / L * 0.4);
  }
  return set(P.done());
}
function legKnee() { const P = cp(4, 4); P.blob(2, 2, 2, 2, RF.bico, 13501, 3.6); P.put(1, 1, RF.mic, 5); return set(P.done()); }
function legFoot() { const P = cp(9, 3); P.line(4.5, 0.4, 0, 2, RF.bico, 3.4); P.line(4.5, 0.4, 8.6, 2, RF.bico, 2.6); P.line(4.5, 0.4, 3, 2.4, RF.bico, 3); P.put(4.4, 0, RF.mic, 4.6); return set(P.done()); }

/* the mycelium jellyfish's bell, 20 x 15: 0 open (wide and flat), 1 between, 2 drawn in (tall, narrow),
   3 lit (gills blazing, about to whip). Translucent cream, a ring of teal gonads glowing through */
function bell(pose) {
  const W = 20, H = 15, P = cp(W, H), s = 13601 + pose, lit = pose === 3;
  const rx = pose === 0 ? 8.6 : pose === 2 ? 5.4 : 7, ry = pose === 0 ? 5 : pose === 2 ? 8 : 6.4, cx = 10, cy = 11.4;
  for (let y = Math.floor(cy - ry); y <= cy + 1; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue;
    const rim = dy > -0.2;
    P.put(x, y, RF.mic, 3.8 - dx * 0.9 - dy * 1.4 + cg(x, y, s) * 0.5 - (rim ? 0.6 : 0) + (dx * dx + dy * dy > 0.7 ? 0.6 : 0));
  }
  // the ragged skirt at the rim, alternately longer
  for (let x = Math.floor(cx - rx + 0.4); x <= cx + rx - 0.4; x++) { const l = hash2(x, 1, 13601) < 0.5 ? 1 : 2; for (let k = 1; k <= l; k++) P.put(x, cy + 1 + k, RF.mic, 3 - k * 0.6); }
  // the gonads: four teal crescents round the middle, glowing through the bell
  for (let k = 0; k < 4; k++) { const a = Math.PI * (1.15 + k * 0.23), gx = cx + Math.cos(a) * rx * 0.48, gy = cy - 1 + Math.sin(a) * ry * 0.4; P.put(gx, gy, lit ? RF.lume : RF.chapeu, lit ? 6 : 4.8); P.put(gx + 1, gy, lit ? RF.lume : RF.chapeu, lit ? 5.2 : 4); P.put(gx, gy + 1, RF.chapeu, lit ? 4.4 : 3); }
  // fungal knobs on top
  P.put(cx - 1, cy - ry + 0.6, RF.caule, 5.4); P.put(cx + 1.6, cy - ry + 1.2, RF.caule, 4.6); P.put(cx - 3, cy - ry + 2, RF.mic, 5.6);
  // the mouth arms: short frills under the middle
  for (const ox of [-1.4, 0, 1.4]) { P.put(cx + ox, cy + 2, RF.mic, 4); P.put(cx + ox * 1.2, cy + 3, RF.mic, 3.4); }
  return set(P.done());
}

// the spores, the gills, the bells
const GL = { teal: glow(10, '#7accc0'), tealBig: glow(18, '#3a9a94'), spore: glow(8, '#6ad4b4'), bell: glow(16, '#7accc0'), eye: glow(5, '#a8e4d8') };
FT2.get = () => FT2.ready || (FT2.ready = {
  broto: [0, 1, 2, 3].map(broto),
  grilo: [0, 1, 2, 3, 4].map(grilo),
  mula: [0, 1, 2, 3, 4].map(mula),
  pern: [0, 1, 2, 3].map(pernBody),
  pernF: [0, 1, 2].map(pernFallen),
  coxa: legPiece(3, 26, 13511), canela: legPiece(2, 26, 13521), joelho: legKnee(), pe: legFoot(),
  bell: [0, 1, 2, 3].map(bell)
});
Object.assign(FT2, { RF, GL });
}

/* ================= drawing ================= */
const ft2Img = (S, f, fl) => f > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l);
DRAW_E.brotos = (e, fx, fy, fl) => {
  if (e.state === 'stuck') return;   // drawn on the hero (after him)
  const B = FT2.get().broto, k = e.state === 'crouch' ? 2 : !e.onGround ? (e.state === 'off' ? 3 : 1) : 0;
  const j = e.state === 'crouch' ? Math.round(Math.sin(e.t * 70) * 0.6) : 0;
  if (e.state === 'off' && !e.onGround) { const S = B[3]; cvRot(e.facing > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l), fx, fy - 5, e.t * 14); return; }
  lc.drawImage(cvPick(B[k], e, fl), fx - 6 + j, fy - 11);
};
EYES_E.brotos = () => { };
DRAW_E.grilo = (e, fx, fy, fl) => {
  const B = FT2.get().grilo;
  if (e.state === 'dazed') {   // where it hit: on the floor, on a wall or upside down on the roof
    const S = B[4], img = ft2Img(S, e.facing, fl), sd = e.dazeSide || 'down';
    const a = sd === 'up' ? Math.PI : sd === 'left' ? Math.PI / 2 : sd === 'right' ? -Math.PI / 2 : 0;
    const cx = sd === 'left' ? fx - e.w / 2 + 6 : sd === 'right' ? fx + e.w / 2 - 6 : fx, cy = sd === 'up' ? fy - e.h + 6 : sd === 'down' ? fy - 8 : fy - e.h / 2;
    cvRot(img, cx, cy, a);
    for (let i = 0; i < 3; i++) { const t = gameTime * 5 + i * 2.1; lc.fillStyle = i ? '#a8e4d8' : '#e6dec4'; lc.fillRect(Math.round(cx + Math.cos(t) * 6), Math.round(cy - 8 + Math.sin(t) * 2), 1, 1); }   // spores circling its head
    return;
  }
  const air = e.state === 'hop' || e.state === 'strike', k = e.state === 'chirp' ? 1 + (Math.floor(e.t * 18) % 2) : air ? 3 : 0;
  if (air) { const a = Math.atan2(e.vy, Math.abs(e.vx) + 1) * (e.state === 'strike' ? 1 : 0.6); cvRot(ft2Img(B[k], e.facing, fl), fx, fy - 7, e.facing > 0 ? a : -a); return; }
  lc.drawImage(cvPick(B[k], e, fl), fx - 14, fy - 15 + (e.state === 'chirp' && Math.floor(e.t * 18) % 2 ? -1 : 0));
};
EYES_E.grilo = (e, fx, fy) => { if (e.state === 'dazed') return; lc.globalAlpha = e.state === 'chirp' || e.state === 'strike' ? 0.8 : 0.35; lc.drawImage(FT2.GL.eye, fx + e.facing * 6 - 5, fy - 13); };
DRAW_E.mula = (e, fx, fy, fl) => {
  const B = FT2.get().mula, k = e.state === 'shake' ? 2 : e.state === 'rump' ? 3 : e.state === 'kick' ? 4 : Math.abs(e.vx) > 3 && e.onGround ? Math.floor(e.t * 3.2) % 2 : 0;
  const j = e.state === 'shake' ? Math.round(Math.sin(e.t * 46)) : e.state === 'rump' ? Math.round(Math.sin(e.t * 30) * 0.6) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 23 + j, fy - 33 + (k === 1 ? -1 : 0));
};
EYES_E.mula = (e, fx, fy) => { lc.globalAlpha = 0.4; lc.drawImage(FT2.GL.eye, fx + e.facing * 16 - 5, fy - 19); };
// the stilt-walker: the far leg, the near leg (bent back at the ankle, as a heron's), then the body on top
function ft2Seg(img, x0, y0, x1, y1) {
  const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2;
  lc.save(); lc.translate(Math.round(x0), Math.round(y0)); lc.rotate(a); lc.drawImage(img, -Math.floor(img.width / 2), -1, img.width, Math.round(L) + 2); lc.restore();
}
function ft2Knee(hx, hy, fx, fy, back) {
  const L = PN_SEG, dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), 2 * L - 0.5) || 1, ux = dx / d, uy = dy / d, h = Math.sqrt(Math.max(0, L * L - d * d / 4));
  let px = -uy, py = ux; if (Math.sign(px) !== back) { px = -px; py = -py; }
  const ex = hx + ux * d, ey = hy + uy * d;   // the foot, pulled into reach
  return [hx + ux * d / 2 + px * h, hy + uy * d / 2 + py * h, ex, ey];
}
DRAW_E.pernalta = (e, fx, fy, fl) => {
  const B = FT2.get();
  if (e.fallen) {
    const k = e.state === 'peckwind' ? 1 : e.state === 'peck' ? 2 : 0, j = e.state === 'collapse' ? Math.round(Math.sin(e.t * 40)) : 0;
    lc.drawImage(cvPick(B.pernF[k], e, fl), fx - 18 + j, fy - 16);
    return;
  }
  const ox = fx - (e.x + e.w / 2), oy = fy - (e.y + e.h), sy = fy - e.h, f = e.facing;
  const bob = e.state === 'stuck' ? Math.round(Math.sin(e.t * 30)) : 0;
  const hx = fx - f, hy = sy + PN_HIP + bob;
  const W = fl ? 'wr' : 'r';
  for (const i of [1, 0]) {   // the far leg first
    const ft = e.feet ? e.feet[i] : { x: e.x + e.w / 2, y: e.y + e.h };
    const hxx = hx + (i ? 2 * f : 0), [kx, ky, ex, ey] = ft2Knee(hxx, hy, ft.x + ox, ft.y + oy, -f);
    const a0 = lc.globalAlpha; if (i) lc.globalAlpha = a0 * 0.8;
    ft2Seg(B.canela[W], kx, ky, ex, ey); ft2Seg(B.coxa[W], hxx, hy, kx, ky);
    lc.drawImage(B.joelho[W], Math.round(kx) - 3, Math.round(ky) - 3);
    lc.drawImage(B.pe[W], Math.round(ex) - 5, Math.round(ey) - 3);
    lc.globalAlpha = a0;
  }
  const k = e.state === 'lift' ? 2 : e.state === 'stomp' || e.state === 'stuck' ? 3 : Math.abs(e.vx) > 3 ? 1 : 0;
  lc.drawImage(cvPick(B.pern[k], e, fl), fx - 18 + (f > 0 ? 0 : 1) - f, hy - 21 + (k === 3 ? 1 : 0));
};
EYES_E.pernalta = (e, fx, fy) => {
  if (e.fallen) { lc.globalAlpha = 0.45; lc.drawImage(FT2.GL.eye, fx + e.facing * (e.state === 'peck' ? 13 : 7) - 5, fy - (e.state === 'peck' ? 7 : 16)); return; }
  const k = e.state === 'stomp' || e.state === 'stuck' ? [11, 2] : Math.abs(e.vx) > 3 ? [10, -9] : [7, -10];
  lc.globalAlpha = e.state === 'lift' ? 0.85 : 0.4; lc.drawImage(FT2.GL.eye, fx + e.facing * k[0] - 5 - e.facing, fy - e.h + PN_HIP - 21 + 14 + k[1] - 5);
};
DRAW_E.aguaviva = (e, fx, fy, fl) => {
  const B = FT2.get().bell, tl = e.tlen || 30, bx = fx, bt = fy - 1;
  // tentacles: four strands waving under the bell; while it charges the light runs down them a block at a time
  const ch = e.state === 'charge', wh = e.state === 'whip', lit = ch ? Math.min(3, 1 + Math.floor((1 - e.stateT / 0.8) * 3)) : wh ? 3 : 0;
  for (let i = 0; i < 4; i++) {
    const base = (i - 1.5) * 3;
    for (let y = 0; y < tl; y++) {
      const u = y / tl, blk = Math.floor(y / 12);
      const sway = wh ? Math.sin(gameTime * 40 + i * 1.3) * u * 5 : Math.sin(gameTime * 2.6 + i * 1.7 + y * 0.2) * u * 2.4 - clamp(e.vx, -30, 30) * 0.01 * y;
      const x = Math.round(bx + base * (wh ? 1.6 : 0.7 + u * 0.4) + sway), on = blk < lit;
      if (fl) lc.fillStyle = '#ffffff';
      else if (on) lc.fillStyle = blk === lit - 1 && ch && Math.floor(gameTime * 20) % 2 ? '#d8fcf0' : y % 3 === 0 ? '#a8e4d8' : '#7accc0';
      else lc.fillStyle = y % 4 === 0 ? '#b4ac90' : u > 0.7 ? '#5e5a48' : '#8a846c';
      lc.fillRect(x, bt + y, 1, 1);
    }
  }
  const ct = e.pulseK > 0, k = ch || wh ? 3 : ct ? 2 : (e.pulseK > -0.25 ? 1 : 0);
  const a0 = lc.globalAlpha; lc.globalAlpha = a0 * (fl ? 1 : 0.88);
  lc.drawImage(cvPick(B[k], e, fl), bx - 11, fy - 16);
  lc.globalAlpha = a0;
};
EYES_E.aguaviva = () => { };
WARN_E.brotos = e => e.state === 'crouch';
WARN_E.grilo = e => e.state === 'chirp';
WARN_E.pernalta = e => e.state === 'lift' || e.state === 'peckwind';
WARN_E.mula = e => e.state === 'shake' || e.state === 'rump';
WARN_E.aguaviva = e => e.state === 'charge';

/* ================= behaviour ================= */
const PN_HIP = 14, PN_SEG = 26;   // the stilt-walker: hips below the top of its box; each leg bone
function ft2Wander(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
const ft2Wet = (x, y) => typeof aguaAt === 'function' && aguaAt(x, y) > 0;
// the surface under a point: the top of the first solid cell (or of the water, when `water`) at or below the row of
// y, at most `max` rows down; a water surface is followed up to its top. null when there is none
function ft2Floor(px, py, max, water) {
  const tx = Math.floor(px / T), ty = Math.floor(py / T);
  for (let k = 0; k <= max; k++) {
    const y = ty + k;
    if (solidAt(tx, y)) return y * T;
    if (water && ft2Wet(tx, y)) { let top = y; while (top > ty - 6 && ft2Wet(tx, top - 1) && !solidAt(tx, top - 1)) top--; return top * T; }
  }
  return null;
}

/* ---------- the sprouts ---------- */
const FT2_STICK_K = 0.05;   // each one on you: 5% slower
let ft2HissT = 0, ft2DrainT = 0, ft2Ground = true, ft2AtkAt = -1;
function ft2Hop(e, dir, vx, vy) {
  if (dir) { const L = ledgeAhead(e, dir, 0, false); if (L === 'stop') dir = 0; }
  const up = dir ? stepUp(e, dir, 2) : 0;
  e.vy = up ? -Math.sqrt(2 * GRAV * (up * T + 5)) : -vy; e.vx = dir * vx; if (dir) e.facing = dir;
  e.onGround = false; e.hopN = (e.hopN || 0) + 1; e.hopAt = gameTime;
  if (Math.random() < 0.3 && Math.hypot(pl.x - e.x, pl.y - e.y) < 160) sfx.ft2Pip();
}
function ft2Unstick(e, dir) {
  e.state = 'off'; e.stateT = 0.6; e.vx = (dir || (Math.random() < 0.5 ? -1 : 1)) * rnd(70, 120); e.vy = -rnd(120, 180); e.atkCD = 1.4 + Math.random() * 0.8;
  e.y = Math.min(e.y, pl.y + pl.h - e.h - 1);
  if (rectSolid(e.x, e.y, e.w, e.h)) { e.x = pl.x + pl.w / 2 - e.w / 2; e.y = pl.y + 2; }
  burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#d8d0b2', 50, 300, 0.4);
}
AI.brotos = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'stuck') {   // riding on the hero: the update below drains, slows and shakes them off
    if (pl.dead) { ft2Unstick(e, 0); return; }
    e.x = pl.x + pl.w / 2 + e.ox - e.w / 2; e.y = pl.y + e.oy; e.vx = 0; e.vy = -GRAV * dt; e.facing = e.ox < 0 ? 1 : -1;
    return;
  }
  if (e.state === 'off') { if (e.onGround) { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; } return; }
  if (e.state === 'crouch') { e.vx = 0; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) {
    // the jump: a lob that comes down on the hero
    const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, tx = pcx + pl.vx * 0.15 - ecx, ty = pcy - (e.y + e.h / 2), t = clamp(Math.abs(tx) / 150, 0.32, 0.6);
    e.vx = clamp(tx / t, -190, 190); e.vy = clamp((ty - 0.5 * GRAV * t * t) / t, -360, -120);
    e.state = 'leap'; e.stateT = 1; e.onGround = false; sfx.ft2Pip();
  } return; }
  if (e.state === 'leap') {
    if (!pl.dead && overlap(e, pl)) {
      const pcx = pl.x + pl.w / 2, from = Math.sign(ecx - pcx) || -e.facing;
      if (pl.shieldK >= 0.6 && from === pl.facing) { ft2Unstick(e, from); burst(ecx, e.y + e.h / 2, 6, '#ffd27a', 70, 200, 0.3, 1, true); sfx.block(); return; }   // knocked away by the shield
      e.state = 'stuck'; e.ox = clamp(ecx - pcx, -pl.w / 2 - 1, pl.w / 2 + 1); e.oy = clamp(e.y - pl.y, 1, pl.h - e.h - 2); e.vx = 0;
      burst(ecx, e.y + e.h / 2, 5, '#d8d0b2', 40, 200, 0.3); sfx.ft2Stick();
      return;
    }
    if (e.onGround && e.stateT < 0.85) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.8; e.vx = 0; }
    return;
  }
  // a line of them: each follows the one ahead, the leader goes for the hero
  let ahead = e.ahead; while (ahead && ahead.dead) ahead = ahead.ahead; e.ahead = ahead;
  if (!e.onGround) return;
  e.vx = approach(e.vx, 0, 700 * dt);
  e.hop = (e.hop || 0) - dt;
  if (ahead) {
    const tx = ahead.x + ahead.w / 2 - (ahead.facing || 1) * 9, gap = tx - ecx;
    if (ahead.hopN > (e.hopN || 0) && gameTime - ahead.hopAt > 0.13 && Math.abs(gap) > 3) { e.hopN = ahead.hopN - 1; ft2Hop(e, Math.sign(gap), clamp(Math.abs(gap) * 2.4 + 16, 30, 90), 150); }
    else if (e.hop <= 0 && Math.abs(gap) > 20) { e.hop = 0.5; ft2Hop(e, Math.sign(gap), 80, 160); }
    else if (e.hop <= 0 && Math.abs(gap) > 3 && Math.abs(ahead.y - e.y) > 6) { e.hop = 0.5; ft2Hop(e, Math.sign(gap), 40, 170); }
  } else if (e.hop <= 0) {
    let dir = 0;
    if (aggro) {
      e.navT = (e.navT || 0) - 0.5;
      if (!e.sees && (!e.fgNav || e.navT <= 0)) { e.fgNav = navFind(e); e.navT = 1; }
      dir = e.sees || !e.fgNav ? (Math.abs(dx) > 6 ? Math.sign(dx) : 0) : e.fgNav.dir;
    } else { ft2Wander(e, 0.5); dir = e.wander; }
    e.hop = aggro ? 0.42 + Math.random() * 0.2 : 0.9 + Math.random();
    if (dir) ft2Hop(e, dir, aggro ? 70 : 40, aggro ? 160 : 130);
  }
  if (aggro && e.atkCD <= 0 && dist < 60 && dy > -50 && dy < 30 && e.sees) {
    e.state = 'crouch'; e.stateT = 0.4; e.facing = Math.sign(dx) || e.facing;
    if (ft2HissT <= 0) { ft2HissT = 0.25; sfx.ft2Hiss(); }
  }
};
function ft2Brotos(dt) {
  ft2HissT -= dt;
  let n = 0, drain = 0;
  for (const e of enemies) if (!e.dead && e.type === 'brotos' && e.state === 'stuck') { n++; drain += e.dmg * 0.4; }
  if (n && !pl.dead) {
    fungLentidao(Math.min(0.5, FT2_STICK_K * n), 0.25);
    ft2DrainT -= dt;
    if (ft2DrainT <= 0) {   // a little life each half second, with no knockback (as the poison)
      ft2DrainT = 0.5;
      const d = Math.max(1, Math.round(drain * 0.5));
      if (!(typeof modoDeus !== 'undefined' && modoDeus)) { pl.hp -= d; pl.hurtFlash = 0.06; pl.lastHurt = gameTime; pl.regen = 0; if (pl.hp <= 0) { pl.hp = 0; die(); } }
      floatText(pl.x + pl.w / 2, pl.y - 6, '-' + d, '#c4bca2', 0.8);
    }
    // a jump throws them all off; a swing knocks off the two on the side of the blow
    const jumped = ft2Ground && !pl.onGround && pl.vy < -120, swing = pl.atkAt !== undefined && pl.atkAt !== ft2AtkAt;
    if (jumped) { for (const e of enemies) if (!e.dead && e.type === 'brotos' && e.state === 'stuck') ft2Unstick(e, Math.sign(e.ox) || 1); sfx.ft2Shake(); }
    else if (swing) {
      let k = 0; const st = enemies.filter(e => !e.dead && e.type === 'brotos' && e.state === 'stuck').sort((a, b) => b.ox * pl.facing - a.ox * pl.facing);
      for (const e of st) { if (k++ >= 2) break; ft2Unstick(e, pl.facing); }
      sfx.ft2Shake();
    }
  } else ft2DrainT = 0.25;
  ft2Ground = pl.onGround; ft2AtkAt = pl.atkAt;
}

/* ---------- the taken cricket ---------- */
function ft2Leap(e, dir, aggro, dy) {
  e.state = 'hop'; e.bounces = 0; e.facing = dir || e.facing;
  e.vx = (dir || e.facing) * rnd(aggro ? 140 : 90, aggro ? 190 : 130); e.vy = -rnd(210, 270) - (aggro && dy < -20 ? Math.min(140, -dy * 1.4) : 0);
  if (Math.hypot(pl.x - e.x, pl.y - e.y) < 200) sfx.ft2Spring();
}
AI.grilo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, grav = () => { e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); };
  const done = () => { e.pvx = e.vx; e.pvy = e.vy; };
  if (e.state === 'hop') {   // a ball: off the walls and the roof, a last little bounce off the floor
    if (e.hitWall) { e.vx = -(e.pvx || 0) * 0.78; e.facing = Math.sign(e.vx) || -e.facing; e.bounces++; burst(e.vx > 0 ? e.x : e.x + e.w, e.y + e.h / 2, 3, '#7c6838', 40, 300, 0.3); if (dist < 200) sfx.ft2Tick(); }
    if (e.hitCeil) { e.vy = Math.abs(e.pvy || 0) * 0.6; e.bounces++; if (dist < 200) sfx.ft2Tick(); }
    grav();
    if (e.onGround && e.vy >= 0) {
      const v = Math.abs(e.pvy || 0);
      if (v > 230 && e.bounces < 3) { e.vy = -v * 0.42; e.vx *= 0.7; e.bounces++; e.onGround = false; }
      else { e.state = 'sit'; e.stateT = 0.25 + Math.random() * 0.35; e.vx = 0; }
    }
    return done();
  }
  if (e.state === 'chirp') {
    e.vx = 0; grav(); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) parts.push({ x: ecx + rnd(-6, 6), y: e.y + rnd(0, 4), vx: rnd(-8, 8), vy: rnd(-24, -8), g: -10, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#a8e4d8' : '#d8d0b2', size: 1, glow: true });
    if (e.stateT <= 0) {   // straight at him, no gravity
      const tx = pl.x + pl.w / 2 - ecx, ty = pl.y + pl.h / 2 - (e.y + e.h / 2), d = Math.hypot(tx, ty) || 1, sp = 260 + e.lvl * 3;
      e.vx = tx / d * sp; e.vy = ty / d * sp; e.state = 'strike'; e.stateT = 1.2; e.swingHit = false; e.facing = Math.sign(tx) || e.facing; e.sv = [e.vx, e.vy];
      sfx.ft2Spring(); burst(ecx, e.y + e.h, 5, '#7c6838', 60, 300, 0.3);
    }
    return done();
  }
  if (e.state === 'strike') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) {
      e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false);
      e.state = 'hop'; e.bounces = 2; e.vx = -e.sv[0] * 0.35; e.vy = -150;
      return done();
    }
    const hw = e.hitWall, hc = e.hitCeil, hg = e.onGround && e.sv[1] > -20;
    if (hw || hc || hg) {   // missed: it smacks into the rock and sits there dazed
      e.state = 'dazed'; e.stateT = 1; e.vx = 0; e.vy = 0;
      e.dazeSide = hw ? (e.sv[0] < 0 ? 'left' : 'right') : hc ? 'up' : 'down';
      burst(ecx + (hw ? Math.sign(e.sv[0]) * 7 : 0), hc ? e.y : hg ? e.y + e.h : e.y + e.h / 2, 8, '#6e6a5c', 70, 300, 0.4); shake(1.2); sfx.ft2Thunk();
      return done();
    }
    e.vx = e.sv[0]; e.vy = e.sv[1];
    if (Math.random() < dt * 30) parts.push({ x: ecx - e.facing * 6, y: e.y + 4, vx: -e.vx * 0.1, vy: -e.vy * 0.1, g: 0, life: 0.3, max: 0.3, col: '#d8d0b2', size: 1 });
    if (e.stateT <= 0) { e.state = 'hop'; e.bounces = 2; }
    return done();
  }
  if (e.state === 'dazed') {
    e.vx = 0;
    if (e.dazeSide === 'down') grav(); else e.vy = 0;   // stuck to the wall or the roof a moment
    if (e.stateT <= 0) { e.atkCD = 1.2 + Math.random() * 0.6; if (e.dazeSide === 'down') { e.state = 'sit'; e.stateT = 0.3; } else { e.state = 'hop'; e.bounces = 3; e.vx = e.dazeSide === 'left' ? 30 : e.dazeSide === 'right' ? -30 : 0; } }
    return done();
  }
  // sitting: picks the next leap, or trills and goes for him
  if (e.state !== 'sit') { e.state = 'sit'; e.stateT = 0.3; }
  grav(); e.vx = approach(e.vx, 0, 800 * dt);
  if (!e.onGround) { if (e.vy > 60) { e.state = 'hop'; e.bounces = 3; } return done(); }
  if (e.stateT > 0) return done();
  if (aggro && e.atkCD <= 0 && dist < 150 && dist > 20 && clearPath(e, pl)) { e.state = 'chirp'; e.stateT = 0.6; e.facing = Math.sign(dx) || e.facing; sfx.ft2Trill(); return done(); }
  let dir;
  if (aggro) {
    if (!e.sees) { e.navT = (e.navT || 0) - 1; if (e.navT <= 0) { e.fgNav = navFind(e); e.navT = 2; } }
    const navDir = !e.sees && e.fgNav && e.fgNav.dir;
    dir = navDir || (dist < 60 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx) || 1);   // too close: a leap aside, then the trill
  } else { ft2Wander(e, 2); dir = e.wander || (Math.random() < 0.5 ? -1 : 1); if (Math.random() < 0.5) { e.stateT = 0.8 + Math.random(); return done(); } }
  ft2Leap(e, dir, aggro, dy);
  return done();
};

/* ---------- the stilt-walker ---------- */
function ft2PnInit(e) {
  const cx = e.x + e.w / 2, fy = ft2Floor(cx, e.y + e.h - 8, 8, true) ?? e.y + e.h;
  e.feet = [{ x: cx - 5, y: fy, st: 0 }, { x: cx + 5, y: fy, st: 0 }];
  e.legHp = Math.round(e.maxHp * 0.3); e.legOut = -1; e.fallen = false;
}
// the body holds its height over the floor or the water under it; returns that surface (or null)
function ft2PnStand(e, dt) {
  const cx = e.x + e.w / 2, fy = ft2Floor(cx, e.y + e.h - 10, 7, true);
  if (fy == null) { e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); return null; }
  const want = fy - e.h;
  if (e.y < want - 0.5) e.vy = Math.min(e.vy + GRAV * dt, (want - e.y) / dt);
  else e.vy = clamp((want - e.y) / dt, -90, 0);
  return fy;
}
// the feet: planted until the body has moved off them, then one steps (lifted in an arc), the other holds
function ft2PnFeet(e, dt, free) {
  const cx = e.x + e.w / 2, F = e.feet;
  for (let i = 0; i < 2; i++) {
    const f = F[i]; if (i === e.legOut) continue;
    if (f.st > 0) {
      f.u += dt / 0.3; const u = Math.min(1, f.u);
      f.x = lerp(f.x0, f.x1, u); f.y = lerp(f.y0, f.y1, u) - Math.sin(Math.PI * u) * 9;
      if (u >= 1) { f.st = 0; f.y = f.y1; if (Math.abs(pl.x - f.x) < 200) { if (ft2Wet(Math.floor(f.x / T), Math.floor((f.y + 2) / T))) { sfx.ft2Splash(); ft2Ripple(f.x, f.y); } else sfx.ft2Step(); } }
    }
  }
  if (!free || (F[0].st > 0 && e.legOut !== 0) || (F[1].st > 0 && e.legOut !== 1)) return;
  const dir = Math.abs(e.vx) > 2 ? Math.sign(e.vx) : 0;
  let pick = -1, worst = 0;
  for (let i = 0; i < 2; i++) {
    if (i === e.legOut) continue;
    const f = F[i], rest = cx + (dir ? 0 : (i ? 5 : -5));
    const off = dir ? (cx - f.x) * dir : Math.abs(f.x - rest), far = Math.abs(f.x - cx) > 21 || Math.abs((ft2Floor(f.x, f.y - 10, 2, true) ?? f.y) - f.y) > 4;
    const need = far ? 99 : dir ? (off > 7 ? off : 0) : (off > 9 ? off : 0);
    if (need > worst) { worst = need; pick = i; }
  }
  if (pick < 0) return;
  const f = F[pick], x1 = cx + (dir ? dir * 14 : (pick ? 5 : -5)), y1 = ft2Floor(x1, e.y + e.h - 14, 4, true);
  if (y1 == null) return;
  Object.assign(f, { st: 1, u: 0, x0: f.x, y0: f.y, x1, y1 });
}
const ft2Ripples = [];
function ft2Ripple(x, y) { if (ft2Ripples.length < 30) ft2Ripples.push({ x, y, t: 0 }); }
// break the stuck leg: it falls and fights on the floor
function ft2PnFall(e) {
  const cx = e.x + e.w / 2, bot = e.y + e.h;
  e.fallen = true; e.state = 'collapse'; e.stateT = 0.8; e.legOut = -1;
  e.w = 26; e.h = 15; e.x = cx - 13; e.y = bot - 15; e.vx = 0; e.vy = -60;
  for (let k = 0; k < 6 && rectSolid(e.x, e.y, e.w, e.h); k++) { e.w -= 2; e.x += 1; }
  burst(cx, bot - 30, 18, '#a8b2a6', 110, 400, 0.7); burst(cx, bot - 8, 10, '#e6dec4', 80, 300, 0.6); shake(5); sfx.ft2Squawk(); sfx.ft2Snap();
  floatText(cx, bot - 40, 'PERNA QUEBRADA', '#e6dec4', 0.9);
}
AI.pernalta = function (e, dt, dx, dy, dist, aggro) {
  if (!e.feet) ft2PnInit(e);
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.fallen) {   // on the floor: drags itself after the hero and pecks
    e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
    if (e.state === 'collapse') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.8; } return; }
    if (e.state === 'peckwind') { e.vx = 0; if (e.stateT <= 0) { e.state = 'peck'; e.stateT = 0.3; e.swingHit = false; sfx.ft2Peck(); } return; }
    if (e.state === 'peck') {
      e.vx = 0;
      if (!e.swingHit) { e.swingHit = true; const hb = { x: e.facing > 0 ? ecx + 4 : ecx - 26, y: e.y - 2, w: 22, h: e.h + 2 }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(Math.round(e.dmg * 0.8), ecx, e, false); }
      if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.5; }
      return;
    }
    if (!aggro) ft2Wander(e, dt);
    const dir = aggro ? (Math.abs(dx) < 20 ? 0 : Math.sign(dx)) : e.wander;
    if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
    if (dir && e.onGround && ledgeAhead(e, dir, dy, false) === 'stop') e.vx = 0;
    else e.vx = approach(e.vx, dir * (12 + e.lvl * 0.5), 200 * dt);
    if (e.onGround && Math.abs(e.vx) > 2) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.5; burst(ecx - e.facing * 10, e.y + e.h, 2, '#a8b2a6', 30, 200, 0.3); } }
    if (aggro && e.atkCD <= 0 && Math.abs(dx) < 30 && Math.abs(dy) < 18) { e.state = 'peckwind'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.ft2Squawk(); }
    return;
  }
  const fy = ft2PnStand(e, dt);
  e.onGround = fy != null && Math.abs(e.y + e.h - fy) < 2;   // standing: on the water too (so it can step up a bank)
  const F = e.feet, legReach = 21;
  if (e.state === 'lift') {   // a leg drawn up high; the shadow follows the hero, then settles
    e.vx = approach(e.vx, 0, 300 * dt);
    const f = F[e.legOut], k = clamp(1 - e.stateT / 0.8, 0, 1);
    if (k < 0.7 && !pl.dead) { const pcx = pl.x + pl.w / 2; e.shX = lerp(e.shX, clamp(pcx, ecx - legReach, ecx + legReach), Math.min(1, dt * 9)); const sy = ft2Floor(e.shX, e.y + e.h - 14, 6, true); if (sy != null) e.shY = sy; }
    f.x = lerp(f.lx, ecx + (e.shX - ecx) * 0.4, k); f.y = lerp(f.ly, e.y + PN_HIP + 20, Math.sin(k * Math.PI / 2));
    ft2PnFeet(e, dt, false);
    if (e.stateT <= 0) { e.state = 'stomp'; e.stateT = 0.1; f.lx = f.x; f.ly = f.y; }
    return;
  }
  if (e.state === 'stomp') {
    const f = F[e.legOut], k = clamp(1 - e.stateT / 0.1, 0, 1);
    f.x = lerp(f.lx, e.shX, k); f.y = lerp(f.ly, e.shY, k * k);
    if (e.stateT <= 0) {
      f.x = e.shX; f.y = e.shY; e.state = 'stuck'; e.stateT = 1.2; e.shY0 = e.shY;
      const hb = { x: e.shX - 9, y: e.shY - 26, w: 18, h: 26 };
      if (!pl.dead && overlap(hb, pl)) { const r = hurtPlayer(e.dmg, e.shX, e, false); if (r === 'hit') pl.vy = Math.min(pl.vy, -160); }
      const wet = ft2Wet(Math.floor(e.shX / T), Math.floor((e.shY + 2) / T));
      burst(e.shX, e.shY - 1, 12, wet ? '#467472' : '#6e6a5c', 100, 400, 0.5); if (wet) { ft2Ripple(e.shX, e.shY); sfx.ft2Splash(); }
      shake(3); sfx.ft2Stomp();
    }
    return;
  }
  if (e.state === 'stuck') {   // the leg sunk in: it tugs at it
    e.vx = 0; const f = F[e.legOut]; f.x = e.shX + Math.sin(e.t * 33) * 0.6; f.y = e.shY0;
    if (Math.random() < dt * 12) burst(e.shX, e.shY0 - 1, 1, '#6e6a5c', 30, 300, 0.3);
    if (e.stateT <= 0) { e.state = 'pull'; e.stateT = 0.35; sfx.ft2Creak(); }
    return;
  }
  if (e.state === 'pull') {
    e.vx = 0; const f = F[e.legOut], k = clamp(1 - e.stateT / 0.35, 0, 1);
    f.x = lerp(e.shX, ecx, k); f.y = lerp(e.shY0, (ft2Floor(ecx, e.y + e.h - 14, 4, true) ?? e.y + e.h), k) - Math.sin(Math.PI * k) * 10;
    if (e.stateT <= 0) { f.st = 0; f.x = ecx; f.y = ft2Floor(ecx, e.y + e.h - 14, 4, true) ?? e.y + e.h; e.legOut = -1; e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  // walking: stands over the hero
  if (!aggro) ft2Wander(e, dt);
  let dir = aggro ? (Math.abs(dx) < 8 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) { const ahead = ft2Floor(ecx + dir * 14, e.y + e.h - 14, 6, true); if (ahead == null || (fy != null && ahead < fy - 14)) { dir = 0; if (!aggro) e.wander = -e.wander; } }
  if (dir) e.facing = dir;
  e.vx = approach(e.vx, dir * (22 + e.lvl * 0.5), 120 * dt);
  ft2PnFeet(e, dt, true);
  if (aggro && e.atkCD <= 0 && fy != null && Math.abs(dx) < legReach + 2 && dy > 0 && dy < 70 && clearPath(e, pl) && !(F[0].st > 0) && !(F[1].st > 0)) {
    const pcx = pl.x + pl.w / 2, pf = ft2Floor(pcx, pl.y + pl.h - 6, 4, true);
    if (pf != null && Math.abs(pf - fy) < 30) {
      e.legOut = Math.abs(F[0].x - pcx) < Math.abs(F[1].x - pcx) ? 0 : 1;
      const f = F[e.legOut]; f.st = 0; f.lx = f.x; f.ly = f.y; e.shX = clamp(pcx, ecx - legReach, ecx + legReach); e.shY = pf;
      e.state = 'lift'; e.stateT = 0.8; e.facing = Math.sign(dx) || e.facing; sfx.ft2Creak();
    }
  }
};

/* ---------- the taken mule ---------- */
const ft2Trail = [], ft2Spores = [];
// slow and steady: follows the route when it is a walk, never jumps (a step of one block it takes in its stride)
function ft2Plod(e, dt, dir, sp, chase, dy) {
  const nav = chase && e.nav && e.nav.kind !== 'here' && (e.nav.steps > 1 || e.nav.kind !== 'walk') ? e.nav : null;
  if (nav && (nav.kind === 'walk' || nav.kind === 'drop') && nav.dir === e.facing) dir = nav.dir;
  if (dir && e.onGround) { const L = ledgeAhead(e, dir, dy, chase); if ((L === 'stop' && !(nav && nav.kind === 'drop')) || typeof L === 'number' && L > 0) dir = 0; }
  e.vx = approach(e.vx, dir * sp, 160 * dt);
  return dir;
}
function ft2Lob(e) {
  const ox = e.x + e.w / 2 - e.facing * 2, oy = e.y + 2, pcx = pl.x + pl.w / 2, G = 380;
  for (let i = 0; i < 3; i++) {
    const tx = pcx + (i - 1) * 26 + pl.vx * 0.3 + rnd(-4, 4), ty = ft2Floor(tx, pl.y + pl.h - 8, 8, false) ?? (pl.y + pl.h), t = 0.95 + i * 0.1;
    ft2Spores.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * G * t * t) / t, tx, ty, t: 0, T: t, G, dmg: e.dmg });
  }
  burst(ox, oy, 10, '#6ad4b4', 60, -20, 0.6, 1, true); sfx.ft2Puff();
}
AI.mula = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.kickCD = (e.kickCD || 0) - dt;
  const ecx = e.x + e.w / 2, behind = Math.sign(dx) === -e.facing;
  if (e.state === 'shake') {   // the cap shakes, the gills flare, spores rise off it
    e.vx = approach(e.vx, 0, 300 * dt);
    if (Math.random() < dt * 30) parts.push({ x: ecx - e.facing * 2 + rnd(-12, 12), y: e.y + rnd(0, 4), vx: rnd(-14, 14), vy: rnd(-34, -10), g: -6, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#6ad4b4' : '#c4f4e6', size: 1, glow: true });
    if (e.stateT <= 0) { ft2Lob(e); e.state = 'recover'; e.stateT = 0.5; e.atkCD = 2.6 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'rump') { e.vx = 0; if (e.stateT <= 0) { e.state = 'kick'; e.stateT = 0.3; e.swingHit = false; sfx.ft2Kick(); } return; }
  if (e.state === 'kick') {
    e.vx = 0;
    if (!e.swingHit) {
      e.swingHit = true;
      const hb = { x: e.facing > 0 ? e.x - 26 : e.x + e.w, y: e.y + 6, w: 26, h: e.h - 6 };
      if (!pl.dead && overlap(hb, pl)) { const r = hurtPlayer(Math.round(e.dmg * 1.25), ecx, e, false); if (r === 'hit') { pl.vx = -e.facing * 380; pl.vy = -260; } shake(4); }
      burst(e.facing > 0 ? e.x - 6 : e.x + e.w + 6, e.y + 12, 8, '#6e6a5c', 80, 300, 0.4);
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; e.kickCD = 1.8 + Math.random() * 0.6; e.atkCD = Math.max(e.atkCD, 0.8); }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  // turning round is slow: the hero right behind it gets the kick first
  e.turnT = behind && aggro ? (e.turnT || 0) + dt : 0;
  if (aggro && e.turnT > (Math.abs(dx) < 40 ? 1.6 : 0.6)) { e.facing = -e.facing; e.turnT = 0; e.vx *= 0.3; }
  if (!aggro) ft2Wander(e, dt);
  let dir = aggro ? (behind || Math.abs(dx) < 22 ? 0 : e.facing) : e.wander;
  if (!aggro && dir) e.facing = dir;
  dir = ft2Plod(e, dt, dir, 16 + e.lvl * 0.5, aggro, dy);
  // the trail of mycelium under its hind hooves
  if (e.onGround && Math.abs(e.vx) > 3) {
    e.trailT = (e.trailT || 0) - dt;
    if (e.trailT <= 0) { e.trailT = 0.22; const x = ecx - e.facing * 9, y = e.y + e.h, l = ft2Trail[ft2Trail.length - 1]; if (!l || Math.abs(l.x - x) > 4 || l.y !== y) { ft2Trail.push({ x, y, life: 8, s: Math.random() * 100 }); if (ft2Trail.length > 60) ft2Trail.shift(); } }
    e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.45; if (dist < 170) sfx.ft2Clop(); }
  }
  if (!aggro || !e.onGround) return;
  if (behind && e.kickCD <= 0 && Math.abs(dx) < 34 && Math.abs(dy) < 22) { e.state = 'rump'; e.stateT = 0.6; sfx.ft2Bray(); }   // its own clock: the lob doesn't spare your back
  else if (e.atkCD > 0) return;
  else if (!behind && dist < 200 && dist > 26 && losClear(ecx, e.y + 2, pl.x + pl.w / 2, pl.y + 4)) { e.state = 'shake'; e.stateT = 0.75; sfx.ft2Rustle(); }
};

/* ---------- the mycelium jellyfish ---------- */
// the nearest water cell (its centre, px) within r cells, or null
function ft2NearWater(px, py, r) {
  if (typeof aguaAt !== 'function') return null;
  const tx = Math.floor(px / T), ty = Math.floor(py / T); let best = null, bd = 1e9;
  for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (aguaAt(x, y)) { const d = (x - tx) * (x - tx) + (y - ty) * (y - ty); if (d < bd) { bd = d; best = [(x + 0.5) * T, (y + 0.5) * T]; } }
  return best;
}
AI.aguaviva = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, wet = typeof aguaIn === 'function' && aguaIn(e.x, e.y + 2, e.w, e.h - 4) > 0.5;
  // how far the tentacles hang before they reach the floor (3 blocks at most)
  e.tlenT = (e.tlenT || 0) - dt;
  if (e.tlenT <= 0) { e.tlenT = 0.15; const f = ft2Floor(ecx, e.y + e.h, 3, false); e.tlen = clamp(f == null ? 36 : f - (e.y + e.h), 6, 36); }
  e.pulseK = (e.pulseK || 0) - dt;
  if (e.state === 'charge') {   // holds over the hero; the light runs down the tentacles
    e.vx = approach(e.vx, clamp(dx * 2, -18, 18), 120 * dt); e.vy = approach(e.vy, wet ? 0 : 12, 120 * dt);
    if (Math.random() < dt * 20) parts.push({ x: ecx + rnd(-6, 6), y: e.y + e.h + rnd(0, e.tlen * (1 - e.stateT / 0.8)), vx: rnd(-6, 6), vy: rnd(-6, 6), g: 0, life: 0.3, max: 0.3, col: '#a8e4d8', size: 1, glow: true });
    if (e.stateT <= 0) { e.state = 'whip'; e.stateT = 0.3; e.swingHit = false; sfx.ft2Lash(); }
    return;
  }
  if (e.state === 'whip') {
    if (!e.swingHit) { e.swingHit = true; const hb = { x: ecx - 11, y: e.y + e.h - 2, w: 22, h: e.tlen + 2 }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false); }
    e.vx *= Math.pow(0.1, dt); e.vy = approach(e.vy, wet ? 0 : 16, 200 * dt);
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  // where to: over the hero's head; back to its water when it lost him
  let tx, ty;
  const pcx = pl.x + pl.w / 2;
  if (aggro) { tx = pcx + Math.sin(e.t * 0.9 + e.seed) * 6; ty = pl.y - e.h - 6; }
  else {
    if (e.homeX === undefined || (e.homeT = (e.homeT || 0) - dt) <= 0) { e.homeT = 3; const w = ft2NearWater(ecx, ecy, 10); if (w) { e.homeX = w[0]; e.homeY = w[1]; } }
    tx = (e.homeX ?? ecx) + Math.cos(e.t * 0.3 + e.seed) * 30; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.5 + e.seed) * 8;
  }
  // the pulse: draws in (and shoots off), then opens and drifts
  e.pulseT = (e.pulseT || Math.random()) - dt;
  if (e.pulseT <= 0) {
    e.pulseT = wet ? 1 + Math.random() * 0.3 : 1.4; e.pulseK = 0.32;
    const ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1;
    if (wet) {
      e.vx += ux / d * 60; e.vy += uy / d * 60 - 8;
      // the surface just above and the hero out of the water: it breaks out of it
      if (aggro && uy < -12 && !ft2Wet(Math.floor(ecx / T), Math.floor((e.y - 6) / T))) e.vy = Math.min(e.vy, -Math.min(150, Math.sqrt(2 * 70 * (-uy + 6))));
    } else { e.vx += ux / d * 26; e.vy = Math.min(e.vy, uy < -4 ? -46 : uy < 10 ? -26 : -8); }
    if (dist < 170) sfx.ft2Bloop(wet);
  }
  if (wet) { const k = Math.pow(0.3, dt); e.vx *= k; e.vy *= k; }
  else { e.vx *= Math.pow(0.5, dt); e.vy = approach(e.vy, 24, 70 * dt); }   // out of the water it sinks, slowly
  if (e.hitWall) e.vx = -(e.pvx || 0) * 0.5;
  if (e.hitCeil) e.vy = Math.abs(e.vy) + 6;
  if (e.onGround && !wet) e.vx *= Math.pow(0.05, dt);
  if (Math.abs(e.vx) > 4) e.facing = Math.sign(e.vx);
  e.pvx = e.vx;
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 12 && dy > 2 && dy < e.h / 2 + e.tlen + 4 && losClear(ecx, e.y + e.h, pcx, pl.y + 4)) { e.state = 'charge'; e.stateT = 0.8; sfx.ft2Hum(); }
};

/* ---------- blows, deaths, spawning ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead) {
    if (e.type === 'brotos' && e.state === 'stuck') { ft2Unstick(e, dir); }
    if (e.type === 'pernalta' && !e.fallen && melee) {
      // the body is out of reach; below it the blade only finds the thin legs, unless one is stuck in the floor
      const reach = pl.y <= e.y + PN_HIP + 6;
      if (!reach) {
        const f = e.state === 'stuck' && e.feet ? e.feet[e.legOut] : null;
        if (f && Math.abs(pl.x + pl.w / 2 - f.x) < 26) {
          mult *= 2; const hp0 = e.hp; _hit(e, dir, mult, melee); e.stun = 0;
          if (!e.dead) { e.legHp -= hp0 - e.hp; burst(f.x, f.y - 14, 6, '#e6dec4', 70, 300, 0.4); if (e.legHp <= 0) ft2PnFall(e); }
          return;
        }
        mult *= 0.35; burst(pl.x + pl.w / 2 + pl.facing * 10, pl.y + 6, 4, '#c2aa56', 60, 300, 0.3, 1, true);
      }
    }
  }
  const s0 = e ? e.stun : 0;
  const r = _hit(e, dir, mult, melee);
  if (e && (e.type === 'mula' || e.type === 'pernalta') && e.stun > 0 && e.stun < 0.5) e.stun = s0 > 0 ? s0 : 0;   // too heavy to flinch (a mace's daze still holds)
  if (e && e.type === 'grilo' && e.state === 'chirp') { e.state = 'hop'; e.bounces = 2; }   // a blow breaks the trill
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (FT2_TYPES.includes(e.type)) burst(cx, cy, e.type === 'mula' || e.type === 'pernalta' ? 22 : 8, '#d8d0b2', 80, -30, 1, 1);   // a puff of spores
  if (e.type === 'mula' || e.type === 'brotos' || e.type === 'aguaviva') burst(cx, cy - (e.type === 'mula' ? 8 : 0), e.type === 'mula' ? 14 : 4, '#6ad4b4', 60, -10, 0.9, 1, true);
  return r;
}; }
// the sprouts come in a line: the leader brings 4 to 6 more (marked fgFollower: the spawn cap counts the group once);
// the stilt-walker gets its feet; the cricket starts sitting
let ft2Following = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e) return e;
  if (type === 'brotos' && !ft2Following) {
    e.fgLead = true; e.atkCD = 0.6 + Math.random() * 0.6;
    const n = 4 + Math.floor(Math.random() * 3); let prev = e;
    ft2Following = true;
    try {
      for (let i = 0; i < n; i++) {
        let x = e.x - (i + 1) * 8 * e.facing; if (rectSolid(x, e.y, e.w, e.h)) x = e.x;
        const f = spawnEnemy('brotos', x, e.y, zone); if (!f) break;
        f.fgFollower = true; f.ahead = prev; f.facing = e.facing; f.atkCD = 0.8 + Math.random() * 1.4; f.hop = 0.2 + i * 0.1; prev = f;
      }
    } finally { ft2Following = false; }
  }
  if (type === 'pernalta') ft2PnInit(e);
  if (type === 'grilo') { e.state = 'sit'; e.stateT = 0.4; }
  if (type === 'aguaviva') { e.pulseT = Math.random(); e.tlen = 30; }
  return e;
}; }
// the stilt-walker's legs drawn on the hero's side of the scene; the sprouts riding him drawn over him
{ const _dp = drawPlayer; drawPlayer = function (cx, cy) {
  _dp(cx, cy);
  if (pl.dead) return;
  const B = FT2.get().broto;
  for (const e of enemies) {
    if (e.dead || e.type !== 'brotos' || e.state !== 'stuck') continue;
    const x = Math.round(pl.x + pl.w / 2 + e.ox) - cx, y = Math.round(pl.y + e.oy + e.h) - cy, j = Math.round(Math.sin(e.t * 9 + e.seed));
    lc.drawImage(cvPick(B[3], e, e.flash > 0), x - 6, y - 10 + j);
  }
}; }

/* ---------- the spores, the trail, the shadows ---------- */
function ft2Update(dt) {
  ft2Brotos(dt);
  // a cricket or a stilt-walker knocked about in the air still falls
  for (const e of enemies) {
    if (e.dead || !(e.stun > 0)) continue;
    if (e.type === 'grilo' && !e.onGround) { e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); e.state = 'hop'; e.bounces = 3; e.pvy = e.vy; }
    else if (e.type === 'pernalta') { if (e.fallen) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); else ft2PnStand(e, dt); }
    else if (e.type === 'aguaviva' && !(typeof aguaIn === 'function' && aguaIn(e.x, e.y, e.w, e.h) > 0.5)) e.vy = approach(e.vy, 24, 70 * dt);
  }
  // the mule's trail: underfoot it slows the hero
  if (ft2Trail.length) {
    const pcx = pl.x + pl.w / 2, fy = pl.y + pl.h;
    for (let i = ft2Trail.length - 1; i >= 0; i--) {
      const p = ft2Trail[i]; p.life -= dt; if (p.life <= 0) { ft2Trail.splice(i, 1); continue; }
      if (!pl.dead && pl.onGround && Math.abs(p.y - fy) < 3 && Math.abs(p.x - pcx) < 8) fungLentidao(0.25, 3);
    }
  }
  // the heavy spores: an arc onto the circle each one marks
  for (let i = ft2Spores.length - 1; i >= 0; i--) {
    const s = ft2Spores[i]; s.t += dt; s.vy += s.G * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (Math.random() < dt * 20) parts.push({ x: s.x, y: s.y, vx: rnd(-6, 6), vy: rnd(-10, 4), g: 0, life: 0.4, max: 0.4, col: '#6ad4b4', size: 1, glow: true });
    const hitRock = s.vy > 0 && solidAt(Math.floor(s.x / T), Math.floor(s.y / T));
    if (s.t >= s.T || hitRock) {
      const x = hitRock ? s.x : s.tx, y = hitRock ? Math.floor(s.y / T) * T : s.ty;
      if (!pl.dead && Math.abs(pl.x + pl.w / 2 - x) < 15 && pl.y + pl.h > y - 22 && pl.y < y + 2) { const r = hurtPlayer(Math.round(s.dmg * 0.7), x, null, true); if (r === 'hit') fungEsporar(Math.max(1, Math.round(s.dmg * 0.12)), 3); }
      burst(x, y - 2, 14, '#6ad4b4', 90, 200, 0.6, 1, true); burst(x, y - 2, 10, '#d8d0b2', 60, -20, 1, 1);
      if (Math.abs(pl.x - x) < 220) sfx.ft2Pop();
      ft2Spores.splice(i, 1);
    }
  }
  for (let i = ft2Ripples.length - 1; i >= 0; i--) { ft2Ripples[i].t += dt; if (ft2Ripples[i].t > 0.8) ft2Ripples.splice(i, 1); }
}
HOOK.update.push(ft2Update);
// in the scene (lit): the trail, the stilt-walker's shadow
HOOK.drawWorld.push((cx, cy) => {
  for (const p of ft2Trail) {
    const x0 = Math.round(p.x) - cx, y = Math.round(p.y) - cy, a = Math.min(1, p.life / 2);
    if (x0 < -20 || x0 > VW + 20 || y < -10 || y > VH + 10) continue;
    lc.globalAlpha = 0.85 * a;
    for (let i = -6; i <= 6; i++) { const h = hash2(i, 1, p.s | 0); if (h < 0.3) continue; lc.fillStyle = h > 0.8 ? '#e6dec4' : h > 0.55 ? '#b4ac90' : '#6e6a5c'; lc.fillRect(x0 + i, y - 1 - (h > 0.9 ? 1 : 0), 1, 1); }
    lc.fillStyle = '#8a846c'; lc.fillRect(x0 - 3, y - 1, 2, 1); lc.fillRect(x0 + 2, y - 1, 3, 1);
  }
  lc.globalAlpha = 1;
  for (const e of enemies) {
    if (e.dead || e.type !== 'pernalta' || e.fallen || (e.state !== 'lift' && e.state !== 'stomp')) continue;
    const k = e.state === 'lift' ? clamp(1 - e.stateT / 0.8, 0, 1) : 1, x = Math.round(e.shX) - cx, y = Math.round(e.shY) - cy, rx = Math.round(4 + k * 7);
    lc.globalAlpha = 0.25 + k * 0.4; lc.fillStyle = '#060808';
    for (let r = 0; r < 3; r++) { const w = rx - (r === 0 ? 2 : r === 2 ? 1 : 0); lc.fillRect(x - w, y - 3 + r, w * 2, 1); }
  }
  lc.globalAlpha = 1;
});
// over the dark: the spores' landing circles, the shadow's rim, the ripples
HOOK.drawTop.push((cx, cy) => {
  for (const s of ft2Spores) {
    const x = Math.round(s.tx) - cx, y = Math.round(s.ty) - cy, k = clamp(s.t / s.T, 0, 1), rx = 12, ry = 3, pulse = Math.floor(gameTime * 14) % 2;
    lc.globalAlpha = 0.45 + k * 0.5; lc.fillStyle = k > 0.65 && pulse ? '#c8fce8' : '#34a890';
    for (let a = 0; a < 32; a++) { const t = a / 32 * 6.283; lc.fillRect(Math.round(x + Math.cos(t) * rx), Math.round(y - 1 + Math.sin(t) * ry), 1, 1); }
    lc.globalAlpha = 0.35 + k * 0.4; lc.fillStyle = '#6ad4b4';
    const ir = Math.round(rx * (1 - k)); for (let a = 0; a < 20; a++) { const t = a / 20 * 6.283; lc.fillRect(Math.round(x + Math.cos(t) * ir), Math.round(y - 1 + Math.sin(t) * ry * (1 - k)), 1, 1); }
    // the spore itself: a lumpy teal ball with a cream rind
    const sx = Math.round(s.x) - cx, sy = Math.round(s.y) - cy;
    lc.globalAlpha = 1; lc.fillStyle = '#1e3a30'; lc.fillRect(sx - 2, sy - 1, 5, 3); lc.fillRect(sx - 1, sy - 2, 3, 5);
    lc.fillStyle = '#34a890'; lc.fillRect(sx - 1, sy - 1, 3, 3); lc.fillStyle = '#c8fce8'; lc.fillRect(sx - 1, sy - 1, 1, 1); lc.fillStyle = '#d8d0b2'; lc.fillRect(sx + 1, sy, 1, 1);
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'pernalta' || e.fallen || e.state !== 'lift') continue;
    const k = clamp(1 - e.stateT / 0.8, 0, 1), x = Math.round(e.shX) - cx, y = Math.round(e.shY) - cy, rx = 4 + k * 7;
    lc.globalAlpha = 0.2 + k * 0.35; lc.fillStyle = k > 0.7 && Math.floor(gameTime * 14) % 2 ? '#e6dec4' : '#8a846c';
    for (let a = 0; a < 24; a++) { const t = a / 24 * 6.283; lc.fillRect(Math.round(x + Math.cos(t) * rx), Math.round(y - 2 + Math.sin(t) * 1.6), 1, 1); }
  }
  for (const r of ft2Ripples) { const x = Math.round(r.x) - cx, y = Math.round(r.y) - cy, w = Math.round(3 + r.t * 14); lc.globalAlpha = 0.6 * (1 - r.t / 0.8); lc.fillStyle = '#7accc0'; lc.fillRect(x - w, y, 2, 1); lc.fillRect(x + w - 1, y, 2, 1); }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const G = FT2.GL;
  for (const s of ft2Spores) { lc.globalAlpha = 0.7; lc.drawImage(G.spore, s.x - cx - 8, s.y - cy - 8); lc.globalAlpha = 0.15 + 0.3 * s.t / s.T; lc.drawImage(G.teal, s.tx - cx - 10, s.ty - cy - 12); }
  for (const e of enemies) {
    if (e.dead) continue;
    const x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy;
    if (e.type === 'brotos') {
      if (e.state === 'stuck') continue;
      lc.globalAlpha = e.state === 'crouch' ? 0.55 : 0.28; lc.drawImage(G.teal, x - 10, e.y - cy - 8);
    } else if (e.type === 'mula') { lc.globalAlpha = e.state === 'shake' ? 0.85 : 0.45; lc.drawImage(G.tealBig, x - e.facing * 2 - 18, e.y - cy - 12); }
    else if (e.type === 'grilo' && e.state !== 'dazed') { lc.globalAlpha = e.state === 'chirp' ? 0.6 : 0.25; lc.drawImage(G.spore, x - e.facing * 2 - 8, e.y - cy - 12); }
    else if (e.type === 'pernalta' && !e.fallen) { lc.globalAlpha = e.state === 'lift' ? 0.5 : 0.25; lc.drawImage(G.teal, x + e.facing * 6 - 10, e.y - cy - 4); }
    else if (e.type === 'aguaviva') {
      const ch = e.state === 'charge' || e.state === 'whip';
      lc.globalAlpha = ch ? 0.8 : e.pulseK > 0 ? 0.5 : 0.35; lc.drawImage(G.bell, x - 16, e.y - cy - 12);
      if (ch) { const lit = e.state === 'whip' ? 3 : Math.min(3, 1 + Math.floor((1 - e.stateT / 0.8) * 3)), tl = e.tlen || 30; lc.globalAlpha = 0.5; for (let b = 0; b < lit; b++) { const yy = e.y + e.h - cy + Math.min(tl - 4, b * 12 + 6); lc.drawImage(G.teal, x - 10, yy - 10); } }
    }
  }
  for (const e of enemies) {   // the sprouts on the hero glow too
    if (e.dead || e.type !== 'brotos' || e.state !== 'stuck') continue;
    lc.globalAlpha = 0.3; lc.drawImage(G.teal, pl.x + pl.w / 2 + e.ox - cx - 10, pl.y + e.oy - cy - 8);
  }
  lc.globalAlpha = 1;
});
function clearFt2Fx() { ft2Trail.length = 0; ft2Spores.length = 0; ft2Ripples.length = 0; ft2DrainT = 0; ft2AtkAt = -1; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearFt2Fx(); ft2Tables(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  ft2Pip() { tone(1500 + Math.random() * 500, 0.04, 'triangle', 0.012, 500); },
  ft2Hiss() { noise(0.4, 0.05, 5200, 'highpass'); noise(0.3, 0.025, 3000, 'bandpass', 0.05, 3); },
  ft2Stick() { noise(0.1, 0.06, 700, 'lowpass'); tone(260, 0.08, 'sine', 0.03, -120); },
  ft2Shake() { noise(0.12, 0.05, 1600, 'bandpass', 0, 1.5); tone(500, 0.08, 'triangle', 0.02, 300); },
  ft2Trill() { for (let k = 0; k < 9; k++) tone(4200 + (k % 2) * 300, 0.035, 'square', 0.012, -200, k * 0.065); },
  ft2Spring() { tone(220, 0.14, 'triangle', 0.035, 500); noise(0.06, 0.04, 2600, 'bandpass'); },
  ft2Tick() { noise(0.04, 0.05, 2200, 'bandpass', 0, 3); tone(900, 0.04, 'square', 0.015, -400); },
  ft2Thunk() { tone(90, 0.16, 'sine', 0.06, -30); noise(0.1, 0.06, 900, 'lowpass'); },
  ft2Creak() { tone(140, 0.4, 'sawtooth', 0.018, 60); noise(0.3, 0.02, 1200, 'bandpass', 0.05, 4); },
  ft2Stomp() { tone(55, 0.26, 'sine', 0.09, -20); noise(0.22, 0.08, 500, 'lowpass'); },
  ft2Step() { tone(120, 0.06, 'sine', 0.02, -40); noise(0.05, 0.02, 1400, 'bandpass'); },
  ft2Splash() { noise(0.28, 0.05, 900, 'lowpass'); tone(320, 0.12, 'sine', 0.02, -200, 0.03); },
  ft2Squawk() { tone(520, 0.28, 'sawtooth', 0.03, -260); tone(690, 0.22, 'square', 0.012, -300, 0.04); noise(0.2, 0.03, 2400, 'bandpass'); },
  ft2Snap() { noise(0.08, 0.1, 2000, 'highpass'); tone(180, 0.1, 'square', 0.03, -120); },
  ft2Peck() { noise(0.05, 0.06, 1800, 'bandpass'); tone(700, 0.05, 'square', 0.015, -300); },
  ft2Clop() { tone(150, 0.05, 'square', 0.015, -60); noise(0.06, 0.03, 600, 'lowpass'); },
  ft2Bray() { tone(330, 0.22, 'sawtooth', 0.025, -120); tone(240, 0.3, 'sawtooth', 0.022, 80, 0.22); noise(0.4, 0.02, 800, 'bandpass', 0, 2); },
  ft2Rustle() { for (let k = 0; k < 6; k++) noise(0.06, 0.035, 1200 + k * 120, 'bandpass', k * 0.11, 2); tone(110, 0.6, 'triangle', 0.02, -20); },
  ft2Puff() { noise(0.3, 0.07, 600, 'lowpass'); tone(200, 0.2, 'sine', 0.03, -120); },
  ft2Pop() { noise(0.16, 0.08, 800, 'lowpass'); tone(150, 0.1, 'sine', 0.04, -70); },
  ft2Kick() { noise(0.1, 0.1, 700, 'lowpass'); tone(80, 0.15, 'sine', 0.07, -30); },
  ft2Bloop(wet) { tone(wet ? 180 : 260, 0.16, 'sine', wet ? 0.025 : 0.015, wet ? 120 : 80); },
  ft2Hum() { tone(220, 0.8, 'sine', 0.02, 260); tone(440, 0.8, 'triangle', 0.008, 520, 0.05); noise(0.8, 0.015, 3600, 'bandpass', 0, 4); },
  ft2Lash() { noise(0.14, 0.09, 3000, 'bandpass', 0, 1.2); tone(1200, 0.08, 'square', 0.015, -900); }
});
