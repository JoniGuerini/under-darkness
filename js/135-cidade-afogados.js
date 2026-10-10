'use strict';

/* ================= the drowned of the Sunken City =================
   The two drowned of the cisterns (docs/camadas/06-cidade-afundada.md, sections 6 and 13). They are not people any
   more: no humanStep (133), no ladders, no fear.
   - the drowned (afogado), a swollen body in the clothes it died in. It walks the bottom of the water without
     floating (ET `bottom`: 172 leaves it alone) and hauls itself up the side of the pool onto the edge; out of the
     water it is slow and heavy and never jumps. It reaches out its dripping arms (0.8 s) and grabs: when the hero is
     near water he is dragged 2 blocks into it and held 1 s (a blow frees him);
   - the one that floats (boiante), a drowned woman that still swims in the air as if under water, slow
     breaststrokes, her hair rising round her head. She opens her mouth and bubbles come out (0.7 s), then a 4-block
     jet of black water that pushes the hero and soaks him (cdEncharcar, 130; 136 makes the jump smaller).
   137 calls spawnEnemy('afogado', ...) at the cistern edges in the boss fight; 136 sets the levels and the spawn
   tables (the drowned only in water or within 4 blocks of it). Water is 171/172 (they load later: run time only).
   Body of the drowned on the hero's compositor (04/37, the arms of 44); the woman with 55's brush (cp, ramps,
   outline, cache). Loads after 134 and before 49 (BAL). */

/* ---------- stats ---------- */
Object.assign(ET, {
  afogado: { name: 'Afogado', w: 10, h: 21, hp: 130, dmg: 20, xp: 30, kb: 0.3, fly: false, bottom: true, amph: true, blood: '#4a5a46' },
  boiante: { name: 'A Que Boia', w: 10, h: 20, hp: 60, dmg: 15, xp: 18, kb: 0.8, fly: true, amph: true, blood: '#4a5a46' }
});
const CDA_TYPES = ['afogado', 'boiante'];
const CDA_BASES = k => [['facao_saqueador', k], ['capuz_poco', k], ['couraca_guarda', k]];
const CDA_DROPS = {
  afogado: [['perola_negra', 0.35], ['moeda_afundada', 0.4, 1, 2], ['pocao', 0.08], ['min_prata', 0.08], ...CDA_BASES(0.034)],
  boiante: [['perola_negra', 0.38], ['pocao', 0.08], ['min_prata', 0.06], ...CDA_BASES(0.034)]
};
function cdaTables() { for (const k of CDA_TYPES) DROPS[k] = CDA_DROPS[k].filter(([id]) => ITEMS[id]); }
cdaTables();
Object.assign(NAV_WALKERS, { afogado: 1 });
Object.assign(CV_STEP, { afogado: 1 });

const CDA_REACH = 0.8, CDA_BUBBLE = 0.7, CDA_JET = 0.4, CDA_JET_LEN = 4 * T, CDA_HOLD = 1, CDA_DRAG = 2 * T;

/* ================= art ================= */
const CDA = {};
{
/* ---------- the drowned: 12 x 18 body on the hero's grid (shoulders 4.5 / 7.5 at row 10.5), 4 rows of legs ----------
   letters: h lank hair, g swollen skin (G a step darker: bruised), e the milky eye, m the mouth, c the clothes,
   d the second cloth (a waistcoat, an apron), b the belt or rope, w the black weed stuck to it */
const body = open => [
  "...hhhhh....",
  "..hhhgghhh..",
  ".hhgggggggh.",
  ".hhgggggggg.",
  ".hhggGgGeGg.",
  ".hhgggggggg.",
  open ? ".hhggggGmmg." : ".hhgggggGgg.",
  open ? "..hhgggGmmg." : "..hhgggGmGg.",
  "..hh.gggGg..",
  "...cddddcc..",
  "..cccddcccc.",
  ".cccwcddcccc",
  ".ccwwcddcCcc",
  ".cCccdddcccc",
  ".bbbbbbbbbbb",
  ".cccCdddcccc",
  "..ccCcccwcc.",
  "..cc.ccc.cc."
];
// sodden trousers, swollen bare feet (the shoes were lost in the water)
const LEGS = {
  idle: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "..FFF.fff..."],
  w0: ["...PP..pp...", "..PP....pp..", "..FF....ff..", ".FFF....fff."],
  w1: ["....Ppp.....", "....PPpp....", "....FFff....", "...FFF.ff..."],
  w2: ["...pp..PP...", "..pp....PP..", "..ff....FF..", ".fff....FFF."],
  w3: ["....pPP.....", "....ppPP....", "....ffFF....", "...ff.FFF..."],
  jump: ["...PP.pp....", "..PP...pp...", "..FF....ff..", "..F......f.."]
};
// three of the city's dead: a labourer in a linen shirt, a clerk in a slate waistcoat, a woman in a brick-red apron
const DRESS = [
  { c: '#4e4a3e', d: '#3e3a30', b: '#2e261a', p: '#2c2e30' },
  { c: '#46443c', d: '#2e343e', b: '#221a14', p: '#262422' },
  { c: '#3e3a36', d: '#5a3028', b: '#2e261e', p: '#302a28' }
];
const SKIN = '#52604a', WEED = '#22342a';
// the skin and the hair keep to the dark: their own ramps (heroRamp lifts the lights toward parchment)
const CDA_SKIN = ['#1a2218', '#2a3626', '#3c4a38', '#52604a', '#66745c', '#7c886c'], CDA_HAIR = ['#060808', '#0a0e0c', '#101614', '#161e1a', '#1e2822', '#28342c'];
const M = (hex, grain, o) => Object.assign({ ramp: heroRamp(hex), grain }, o || {});
function mats(v) {
  const D = DRESS[v];
  return { h: { ramp: CDA_HAIR, grain: 0.3 }, g: { ramp: CDA_SKIN, grain: 0.3 }, e: '#9aa494', m: '#0e1210', c: M(D.c, 0.32, { lip: true }), d: M(D.d, 0.28, { under: true }),
    b: M(D.b, 0.2, { under: true }), w: M(WEED, 0.4, { under: true }) };
}
CDA.body = (v, open) => cached('cdab:' + v + (open ? 'o' : ''), () => { const T0 = mats(v); return heroPaint(body(open), L => T0[L], 61 + v); });
CDA.legs = v => cached('cdal:' + v, () => {
  const T0 = { p: M(DRESS[v].p, 0.3), f: { ramp: CDA_SKIN, grain: 0.25, lip: true } }, o = {};
  for (const k in LEGS) o[k] = heroPaint(LEGS[k], L => T0[L], 67 + v);
  return o;
});
CDA.sleeve = v => DRESS[v].c;
CDA.skin = SKIN;

/* ---------- the one that floats, 22 x 32 facing right ----------
   poses 0-3 the breaststroke (0 arms out in front, gliding; 1 sweeping out wide; 2 pulled in to the chest; 3 the
   hands pushed forward again), 4 mouth open with the bubbles (the tell), 5 the jet (head thrust forward, mouth wide,
   arms flung back). Her hair rises off her head and spreads, a different drift in each frame; the drowned dress
   billows round her legs */
const { cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RB = {
  pele: R7(['#101812', '#1a261e', '#2a382c', '#3e4e40', '#566854', '#70826a', '#8c9a82']),     // swollen grey-green
  cabelo: R7(['#040606', '#080c0a', '#0e1612', '#16201a', '#1e2a24', '#28362e', '#34443a']),
  vestido: R7(['#0c0e14', '#14181e', '#1e242c', '#2a323c', '#38424c', '#4a545e', '#5e6870']),   // a faded slate dress
  renda: R7(['#262420', '#38342c', '#4e483c', '#666050', '#7e7864', '#968e78', '#aaa28a']),     // the dirty lace collar
  limo: R7(['#0c1410', '#14201a', '#1e2e24', '#2a3e30', '#3a5240', '#546c56', '#6a8470']),       // weed stuck to her
  boca: R7(['#040404', '#060606', '#0a0a0a', '#101010', '#161616', '#1c1c1c', '#222222'])
};
function limb(P, x0, y0, x1, y1, r0, r1, R, v, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) if (ox * ox + oy * oy <= r * r + 0.1) P.put(x + ox, y + oy, R, v + (oy < 0 ? 0.8 : -0.6) + (ox < 0 ? 0.3 : 0) + cg(x + ox | 0, y + oy | 0, s) * 0.5);
  }
}
function boia(pose) {
  const W = 22, H = 32, P = cp(W, H), s = 13501 + pose * 7, mouth = pose === 4, jet = pose === 5;
  const hx = jet ? 12.6 : mouth ? 12 : 11.4, hy = 11, ph = pose * 1.7;
  // the hair: strands rising off the head and drifting all one way, like weed in a slow current
  for (let k = 0; k < 9; k++) {
    const u = (k - 4) / 4, len = 9 + (1 - Math.abs(u)) * 5 + hash2(k, 1, 77) * 3, n = 28;
    const x = hx - 1 + u * 2.6, y = hy - 2.2 + Math.abs(u) * 1.6;
    for (let i = 0; i <= n; i++) {
      const t = i / n, sway = Math.sin(ph + t * 2.6) * 3 * t + Math.sin(ph * 1.3 + t * 6 + k) * 0.7 * t;
      const px = x + u * 5.4 * t + sway - (jet ? t * 4 : mouth ? t * 1.6 : 0), py = y - len * t * (1 - Math.abs(u) * 0.25);
      const v = 4 - t * 1.4 + (k % 3 === 1 ? 0.9 : 0) + cg(px | 0, py | 0, s) * 0.6;
      P.put(px, py, RB.cabelo, v); if (t < 0.3 && k % 2) P.put(px - 0.6, py, RB.cabelo, v - 1);
    }
  }
  // far arm (behind the body)
  const sh = [9.4, 15.4], sf = [12.2, 15.6];
  const armF = [[16.6, 10.6], [14.4, 9.4], [7, 18.6], [13.6, 14.6], [6, 17.6], [3.6, 18.4]][pose];
  const armN = [[18.2, 12.2], [19.4, 17.8], [13.8, 19.4], [17.6, 14.4], [15, 20.4], [6.4, 20.8]][pose];
  const elbF = [(sh[0] + armF[0]) / 2 + 0.4, (sh[1] + armF[1]) / 2 + (pose === 1 ? -2.4 : 1)], elbN = [(sf[0] + armN[0]) / 2 + (pose === 2 ? 2.4 : 0), (sf[1] + armN[1]) / 2 + (pose === 1 ? 1.8 : 1)];
  limb(P, sh[0], sh[1], elbF[0], elbF[1], 1, 0.9, RB.pele, 2, s + 1); limb(P, elbF[0], elbF[1], armF[0], armF[1], 0.9, 0.9, RB.pele, 1.8, s + 2);
  // the dress: a bodice, then a skirt that billows and trails, torn at the hem
  for (let y = 14; y <= 29; y++) {
    const u = (y - 14) / 15, sw = Math.sin(ph * 0.8 + y * 0.45) * u * 1.4, cx = 10.6 - u * 1.2 + sw - (jet ? u * 1.4 : 0);
    const half = y < 20 ? 2.6 + (y - 14) * 0.1 : 3.2 + (y - 20) * 0.42 + Math.sin(ph + y) * 0.4;
    for (let x = Math.floor(cx - half); x <= cx + half; x++) {
      const dx = (x + 0.5 - cx) / half;
      if (y > 26 && hash2(x, y, s + 3) < (y - 26) * 0.28) continue;   // the hem in rags
      const fold = Math.sin((x - cx) * 1.6 + ph) > 0.6 ? -0.8 : 0;
      P.put(x, y, RB.vestido, 3.4 - dx * 1.2 - u * 0.8 + fold + cg(x, y, s) * 0.6);
    }
  }
  for (let x = 8; x <= 13; x++) P.put(x, 14, RB.renda, 4.4 - (x - 8) * 0.25);   // the lace collar
  P.put(9, 15, RB.renda, 3.4); P.put(12, 15, RB.renda, 3);
  for (const [x, y] of [[9, 19], [10, 20], [12, 23], [8, 25], [13, 26]]) P.put(x, y, RB.limo, 3.4 + hash2(x, y, s) * 1.4);   // weed on the dress
  // the legs dangling out of the skirt, bare and swollen
  const lg = Math.sin(ph) * 1.2;
  limb(P, 9.4, 26, 8.6 + lg, 30.6, 0.9, 0.7, RB.pele, 2, s + 4); limb(P, 11.6, 26, 12.4 - lg * 0.6, 30.2, 0.9, 0.7, RB.pele, 2.8, s + 5);
  // neck and the swollen head, face to the right
  limb(P, hx - 1, 12.6, hx - 1.2, 14.4, 1.2, 1.2, RB.pele, 2.6, s + 6);
  P.blob(hx, hy, 3.4, 3.2, RB.pele, s + 7, 3, (x, y, dx) => (dx < -0.2 ? -0.4 : 0));
  // the hair over the crown and down the back of the head
  for (let y = hy - 3.4; y <= hy + 1.6; y++) for (let x = hx - 3.6; x <= hx + 0.6; x++) {
    const dx = (x + 0.5 - hx) / 3.6, dy = (y + 0.5 - hy) / 3.4; if (dx * dx + dy * dy > 1.15 || (dy > -0.3 && dx > -0.3)) continue;
    P.put(x, y, RB.cabelo, 3.6 - dy * 0.6 + cg(x | 0, y | 0, s + 8) * 0.8);
  }
  // the clouded eye, the bruise under it, the mouth
  P.put(hx + 1.6, hy - 0.8, RB.renda, 5.2); P.put(hx + 2.4, hy - 0.8, RB.renda, 4.2); P.put(hx + 1.8, hy + 0.2, RB.pele, 1.4);
  if (jet) { P.blob(hx + 2.2, hy + 2, 1.4, 1.5, RB.boca, s + 9, 1); P.put(hx + 3.2, hy + 1, RB.pele, 4.6); }
  else if (mouth) { P.blob(hx + 2, hy + 1.8, 1, 1.2, RB.boca, s + 9, 1.2); }
  else { P.put(hx + 1.8, hy + 1.8, RB.boca, 2); P.put(hx + 2.6, hy + 1.6, RB.boca, 2.4); }
  // near arm (in front)
  limb(P, sf[0], sf[1], elbN[0], elbN[1], 1.1, 1, RB.pele, 3.6, s + 10); limb(P, elbN[0], elbN[1], armN[0], armN[1], 1, 1, RB.pele, 3.4, s + 11);
  P.put(armN[0] + 0.6, armN[1], RB.pele, 4.6);
  return set(P.done());
}
CDA.get = () => CDA.ready || (CDA.ready = {
  boia: [0, 1, 2, 3, 4, 5].map(boia)
});
CDA.GL = { eye: glow(3, '#9aac94'), drop: glow(4, '#6a8478') };
}

/* ================= drawing ================= */
// the drowned: the hero's compositor (body, legs, the arms of 44 in its own cloth and skin)
function cdaArm(ang, len, v, back) { return uvArmA(ang, len, CDA.sleeve(v), CDA.skin, 3, back ? { dark: 1 } : undefined); }
function cdaPose(e) {
  const v = e.cdaV || 0, walking = e.onGround && Math.abs(e.vx) > 3, st = e.state, fl = e.flash > 0;
  const wet = !!e.cdaWet;
  let legs = CDA.legs(v)[!e.onGround && st !== 'climb' ? 'jump' : walking ? WALK[Math.floor(e.t * (wet ? 4 : 3)) % 4] : 'idle'];
  // arms: hanging forward and heavy; under water they drift up a little
  let fa = (wet ? 2.2 : 2.6) + Math.sin(e.t * (wet ? 1.6 : 2.4)) * 0.08, ba = fa + 0.22 + Math.sin(e.t * 2 + 1) * 0.06, open = false, ox = 0, oy = 0;
  if (st === 'reach') {
    const k = clamp(1 - e.stateT / CDA_REACH, 0, 1);
    fa = lerp(2.6, 1.52, easeOut(Math.min(1, k * 1.3))) + Math.sin(e.t * 30) * 0.03 * k; ba = fa + 0.16; open = k > 0.3;
  } else if (st === 'drag' || st === 'hold') { fa = 1.6; ba = 1.74; open = true; ox = -1; }
  else if (st === 'climb') { fa = 0.9 + Math.sin(e.t * 5) * 0.14; ba = 1.1 - Math.sin(e.t * 5) * 0.14; legs = CDA.legs(v).jump; oy = 1; }
  else if (st === 'mount') { fa = 1.2; ba = 1.5; legs = CDA.legs(v).jump; }
  else if (st === 'recover') { fa = 2.9; ba = 3.0; }
  return { body: CDA.body(v, open), legs, ox, oy, back: cdaArm(ba, 8, v, true), front: cdaArm(fa, 8, v, false), flash: fl };
}
DRAW_E.afogado = (e, fx, fy, fl) => {
  if (fx < -40 || fx > VW + 40 || fy < -40 || fy > VH + 60) return;
  compose(cdaPose(e));
  const j = e.state === 'reach' ? Math.round(Math.sin(e.t * 34) * 0.6) : 0;
  drawComposite(fx + j, fy, e.facing);
};
EYES_E.afogado = (e, fx, fy) => {
  const hot = e.state === 'reach' || e.state === 'drag' || e.state === 'hold';
  lc.globalAlpha = hot ? 0.7 : 0.3; lc.drawImage(CDA.GL.eye, fx + e.facing * 2 - 3, fy - 21 + (e.state === 'climb' ? 1 : 0));
};
WARN_E.afogado = e => e.state === 'reach';

const cdaBoiaFrame = e => {
  if (e.state === 'bubble') return 4;
  if (e.state === 'jet') return 5;
  const p = ((e.strokeT || 0) % CDA_STROKE) / CDA_STROKE;
  return p < 0.25 ? 1 : p < 0.45 ? 2 : p < 0.6 ? 3 : 0;
};
const cdaBob = e => Math.round(Math.sin(e.t * 1.7 + e.seed) * 1.2);
DRAW_E.boiante = (e, fx, fy, fl) => {
  const B = CDA.get().boia, k = cdaBoiaFrame(e), j = e.state === 'bubble' ? Math.round(Math.sin(e.t * 26) * 0.6) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 11 + j, fy - 28 + cdaBob(e));
};
EYES_E.boiante = (e, fx, fy) => {
  const hot = e.state === 'bubble' || e.state === 'jet', k = cdaBoiaFrame(e), hx = k === 5 ? 1.2 : k === 4 ? 0.6 : 0;
  lc.globalAlpha = hot ? 0.7 : 0.3; lc.drawImage(CDA.GL.eye, fx + e.facing * (2.6 + hx) - 3, fy - 28 + cdaBob(e) + 10 - 3);
};
WARN_E.boiante = e => e.state === 'bubble';

/* ================= behaviour ================= */
const CDA_STROKE = 1.8;   // one breaststroke, seconds
const cdaWetAt = (x, y) => typeof aguaAt === 'function' && aguaAt(Math.floor(x / T), Math.floor(y / T)) > 0;
// which way the nearest water lies from a body standing at (px, feet): 0 when it is already in it, null when there is
// none within r blocks (on the body's rows or up to 3 below its feet)
function cdaWaterSide(px, feet, r) {
  const tx = Math.floor(px / T), ty = Math.floor((feet - 1) / T);
  if (typeof aguaAt !== 'function') return null;
  if (aguaAt(tx, ty) || aguaAt(tx, ty - 1)) return 0;
  for (let k = 1; k <= r; k++) for (const s of [-1, 1]) {
    const x = tx + s * k;
    for (let y = ty - 1; y <= ty + 3; y++) {
      if (aguaAt(x, y)) return s;
      if (solidAt(x, y) && y <= ty) break;   // a wall that side
    }
  }
  return null;
}
// how far (px) the body centred at px must go that way before it is over the water
function cdaWaterDist(px, feet, dir) {
  const tx = Math.floor(px / T), ty = Math.floor((feet - 1) / T);
  for (let k = 0; k <= 5; k++) {
    const x = tx + dir * k;
    for (let y = ty - 1; y <= ty + 3; y++) if (aguaAt(x, y)) return k ? Math.max(0, dir > 0 ? x * T - px : px - (x + 1) * T) + pl.w / 2 + 2 : 0;
  }
  return 0;
}
// a wall right in front of a walker that it can haul itself up (1 to max blocks, room on top): its height, else 0
function cdaWallH(e, dir, max) {
  const fy = Math.floor((e.y + e.h - 1) / T), fx = Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / T), hT = Math.ceil(e.h / T) + 1;
  if (!solidAt(fx, fy)) return 0;
  let k = 1; while (k <= max && solidAt(fx, fy - k)) k++;
  if (k > max) return 0;
  const ox = Math.floor((e.x + e.w / 2) / T);
  for (let j = 0; j < hT; j++) if (solidAt(fx, fy - k - j) || solidAt(ox, fy - k - j)) return 0;   // room to stand up there, and to climb past
  return k;
}
// the drop ahead ends in water: the drowned walks back into it
function cdaWaterAhead(e, dir) {
  const fx = Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / T), fy = Math.floor((e.y + e.h + 1) / T);
  for (let k = -1; k < 10; k++) { if (cdaWetAt(fx * T + 1, (fy + k) * T + 1)) return true; if (solidAt(fx, fy + k)) return false; }
  return false;
}
let cdaHolder = null;   // the drowned that has the hero (one at a time)
function cdaRelease(e, hard) {
  if (cdaHolder === e) cdaHolder = null;
  e.state = 'recover'; e.stateT = hard ? 0.9 : 0.6; e.atkCD = 1.8 + Math.random() * 0.8; e.vx = 0;
}
function cdaDrip(x, y, n) {
  if (parts.length > 650) return;
  for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-1.5, 1.5), y, vx: rnd(-4, 4), vy: rnd(0, 18), g: 420, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#5a6c66' : '#2a3a34', size: 1 });
}

/* ---------- the drowned ---------- */
AI.afogado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, wet = cdaWetAt(ecx, e.y + e.h * 0.45);
  e.cdaWet = wet; e.dryT = wet ? 0 : (e.dryT || 0) + dt;
  if (wet && e.vy > 60) e.vy = 60;   // sinks heavy and slow; never floats
  if (!wet && e.dryT < 6 && Math.random() < dt * (6 - e.dryT) * 0.8) cdaDrip(ecx + rnd(-4, 4), e.y + rnd(8, 18), 1);   // still running with water
  if (e.gurgT === undefined) e.gurgT = 2 + Math.random() * 4;
  if (aggro && dist < 170 && (e.gurgT -= dt) <= 0) { e.gurgT = 3 + Math.random() * 4; sfx.cdaGurgle(0.6); }

  if (e.state === 'reach') {   // the arms come up, dripping; then the grab
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 22) cdaDrip(ecx + e.facing * rnd(6, 11), e.y + 9, 1);
    if (e.stateT > 0) return;
    const hb = { x: e.facing > 0 ? ecx : ecx - 22, y: e.y + 2, w: 22, h: e.h - 2 };
    e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.8;
    if (pl.dead || !overlap(hb, pl) || !clearPath(e, pl)) { sfx.cdaMiss(); return; }
    const r = hurtPlayer(e.dmg, ecx, e, false);
    sfx.cdaSlap();
    if (r !== 'hit' || cdaHolder) return;
    const side = cdaWaterSide(pl.x + pl.w / 2, pl.y + pl.h, 3);
    if (side === null) return;
    // the grab: he goes with it, 2 blocks into the water
    cdaHolder = e; e.state = 'drag'; e.dragDir = side || (Math.sign(ecx - (pl.x + pl.w / 2)) || -e.facing);
    e.dragLeft = Math.min(5 * T, cdaWaterDist(pl.x + pl.w / 2, pl.y + pl.h, e.dragDir) + CDA_DRAG); e.stateT = 0.4 + e.dragLeft / 52;
    e.hx = pl.x; e.hy = pl.y; e.slip = 0; pl.vx = 0; pl.vy = 0;
    burst(pl.x + pl.w / 2, pl.y + 8, 8, '#2a3a34', 50, 300, 0.4);
    return;
  }
  if (e.state === 'drag' || e.state === 'hold') {
    if (pl.dead || cdaHolder !== e) { cdaRelease(e); return; }
    // only the drowned moves him: whatever he did this frame (walking, jumping, swimming up) is undone
    if (!rectSolid(e.hx, e.hy, pl.w, pl.h)) { pl.x = e.hx; pl.y = e.hy; }
    pl.vx = 0; pl.vy = 0;
    if (e.state === 'drag') {   // it walks back into the water with him
      e.vx = e.dragDir * 46;
      if (e.dragLeft <= 0 || e.stateT <= 0 || (e.hitWall && e.onGround)) { e.state = 'hold'; e.stateT = CDA_HOLD; sfx.cdaGurgle(1); }
    } else e.vx = approach(e.vx, 0, 400 * dt);
    // he goes where its hands are, and down with it (never up)
    const hxT = ecx + e.facing * 10 - pl.w / 2, hyT = e.y + e.h - pl.h - 2;
    const mx = clamp(hxT - pl.x, -110 * dt, 110 * dt), my = clamp(hyT - pl.y, 0, 90 * dt);
    if (mx && !rectSolid(pl.x + mx, pl.y, pl.w, pl.h)) { pl.x += mx; if (e.state === 'drag') e.dragLeft -= mx * e.dragDir; }
    if (my && !rectSolid(pl.x, pl.y + my, pl.w, pl.h)) pl.y += my;
    e.hx = pl.x; e.hy = pl.y;
    const pcx = pl.x + pl.w / 2;
    if (Math.hypot(hxT - pl.x, hyT - pl.y) > 30) { e.slip = (e.slip || 0) + dt; if (e.slip > 0.4) { cdaRelease(e); return; } } else e.slip = 0;
    if (Math.random() < dt * 8 && cdaWetAt(pcx, pl.y + 3)) parts.push({ x: pcx + rnd(-3, 3), y: pl.y + 2, vx: rnd(-6, 6), vy: rnd(-40, -20), g: -30, life: 0.8, max: 0.8, col: '#8a9a98', size: 1 });
    if (e.state === 'hold' && e.stateT <= 0) cdaRelease(e);
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (e.state === 'climb') {   // hauls itself up the side, hand over hand
    e.vx = e.climbDir * 14; e.vy = -30 - GRAV * dt; e.facing = e.climbDir;
    if (Math.random() < dt * 6) cdaDrip(ecx + e.climbDir * 4, e.y + 4, 1);
    if (e.y + e.h <= e.climbTop - 1) { e.state = 'mount'; e.stateT = 0.45; e.vy = -60 - GRAV * dt; e.vx = e.climbDir * 34; sfx.cdaSlap(0.5); }
    else if (e.hitCeil || e.stateT <= 0 || !solidAt(Math.floor((e.climbDir > 0 ? e.x + e.w + 3 : e.x - 3) / T), Math.floor((e.y + e.h - 1) / T))) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.4); }
    return;
  }
  if (e.state === 'mount') { e.vx = e.climbDir * 34; if (e.stateT <= 0 || e.onGround) { e.state = 'walk'; e.vx = 0; } return; }

  // walking: on the bottom of the water at a fair pace, out of it slow and heavy
  e.state = 'walk';
  const sp = wet ? 32 + e.lvl * 0.6 : 15 + e.lvl * 0.35;
  let dir = 0;
  if (aggro) {
    const nav = !e.sees && e.nav && e.nav.kind !== 'here' ? e.nav : null;
    dir = nav ? nav.dir : Math.abs(dx) > 7 ? Math.sign(dx) : 0;
  } else {
    // with nothing to hunt it goes back to the water it came out of
    if (!wet && e.homeX !== undefined && Math.abs(e.homeX - ecx) > T) dir = Math.sign(e.homeX - ecx);
    else { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } dir = e.wander; }
  }
  if (dir && e.onGround) {
    const L = ledgeAhead(e, dir, dy, aggro);
    if (L !== 0 && !cdaWaterAhead(e, dir)) { if (!aggro) e.wander = -dir; dir = 0; }   // it never leaps
  }
  if (dir) e.facing = dir;
  e.vx = approach(e.vx, dir * sp, (wet ? 180 : 120) * dt);
  // a wall too tall to step: it climbs (out of the water up to 6 blocks, on dry land 2) when the hero is up there
  if (dir && e.onGround && (e.hitWall || Math.abs(e.vx) < 2)) {
    const wantUp = aggro ? dy < -4 || (e.nav && e.nav.kind === 'up') : !wet && e.homeX !== undefined;
    const h = wantUp ? cdaWallH(e, dir, wet ? 6 : 2) : 0;
    if (h > 1 || (h === 1 && e.hitWall)) {
      const fy = Math.floor((e.y + e.h - 1) / T);
      e.state = 'climb'; e.climbDir = dir; e.climbTop = (fy - h + 1) * T; e.stateT = 1.2 + h * 0.6;
      if (wet) sfx.cdaSplash(0.5);
      return;
    }
  }
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 24 && dy > -24 && dy < 18 && e.onGround && clearPath(e, pl)) {
    e.state = 'reach'; e.stateT = CDA_REACH; e.facing = Math.sign(dx) || e.facing; e.vx = 0; sfx.cdaGurgle(1);
  }
};

/* ---------- the one that floats ---------- */
AI.boiante = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  e.strokeT = (e.strokeT || 0) + dt;
  const drag = (k) => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  const mouthX = () => e.x + e.w / 2 + e.facing * 3.5, mouthY = () => e.y + e.h - 15 + cdaBob(e);
  if (e.sees) { e.lsx = pcx; e.lsy = pcy; }
  if (e.state === 'bubble') {   // the mouth opens, bubbles come out; she turns to follow him until the last moment
    drag(0.08);
    if (e.stateT > 0.2) { e.aim = Math.atan2(pcy - mouthY(), pcx - mouthX()); e.facing = Math.cos(e.aim) >= 0 ? 1 : -1; e.aim = cdaClampAim(e.aim, e.facing); }
    if (Math.random() < dt * 16) cdaBubbles.push({ x: mouthX() + rnd(-1, 1), y: mouthY(), vx: Math.cos(e.aim || 0) * 10 + rnd(-6, 6), vy: rnd(-26, -14), t: 0, life: 0.6 + Math.random() * 0.5, r: Math.random() < 0.3 ? 2 : 1 });
    if (e.stateT <= 0) { e.state = 'jet'; e.stateT = CDA_JET; e.jetHit = false; e.jetT = 0; sfx.cdaJet(); }
    return;
  }
  if (e.state === 'jet') {   // the black water: a straight jet of 4 blocks
    e.jetT += dt; drag(0.2);
    const ux = Math.cos(e.aim), uy = Math.sin(e.aim);
    e.vx -= ux * 40 * dt; e.vy -= uy * 40 * dt;   // the jet pushes her back a little
    const L = cdaJetLen(e, mouthX(), mouthY());
    if (!e.jetHit && !pl.dead && cdaJetHits(mouthX(), mouthY(), ux, uy, L)) {
      e.jetHit = true;
      const r = hurtPlayer(e.dmg, mouthX(), e, true);
      if (r === 'hit') { pl.vx = ux * 230; pl.vy = Math.min(pl.vy, uy * 200 - 70); pl.onGround = false; cdEncharcar(3); sfx.cdaSplash(1); }
      else if (r === 'block') { pl.vx += ux * 110; sfx.cdaSplash(0.6); }
      burst(pcx - ux * 4, pcy, 10, '#1a2024', 70, 300, 0.5);
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; e.atkCD = 2.2 + Math.random() * 1; }
    return;
  }
  if (e.state === 'recover') { drag(0.3); e.vy = approach(e.vy, 6, 20 * dt); if (e.stateT <= 0) e.state = 'swim'; return; }
  e.state = 'swim';
  // where to: a little above the hero and off to her side; back to her drift when she lost him
  let tx, ty;
  if (aggro) {
    if (e.side === undefined || Math.random() < dt * 0.15) e.side = Math.sign(ecx - pcx) || 1;
    if (e.sees || e.lsx === undefined) { tx = pcx + e.side * 40; ty = pl.y - 4 + Math.sin(e.t * 0.7 + e.seed) * 6; }
    else { tx = e.lsx; ty = e.lsy - 10; }
  } else {
    if (e.homeX === undefined) { e.homeX = ecx; e.homeY = ecy; }
    tx = e.homeX + Math.cos(e.t * 0.25 + e.seed) * 36; ty = e.homeY + Math.sin(e.t * 0.4 + e.seed) * 10;
  }
  // the stroke: the pull drives her on, then a long glide
  const p = (e.strokeT % CDA_STROKE) / CDA_STROKE, ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1;
  if (p > 0.1 && p < 0.45 && d > 6) { const a = (aggro ? 120 : 70) * dt; e.vx += ux / d * a; e.vy += uy / d * a * 0.8 - 14 * dt; }
  else e.vy += 8 * dt;   // gliding, she settles a little
  drag(0.45);
  if (e.hitWall) { e.vx = -(e.pvx || 0) * 0.3; e.vy -= 30 * dt * 10; }
  if (e.hitCeil) e.vy = Math.abs(e.vy) + 4;
  e.pvx = e.vx;
  if (Math.abs(dx) > 3) e.facing = aggro ? Math.sign(dx) : Math.abs(e.vx) > 2 ? Math.sign(e.vx) : e.facing;
  if (aggro && e.atkCD <= 0 && dist < 62 && dist > 12 && losClear(mouthX(), mouthY(), pcx, pcy)) {
    e.state = 'bubble'; e.stateT = CDA_BUBBLE; e.facing = Math.sign(dx) || e.facing; e.aim = cdaClampAim(Math.atan2(pcy - mouthY(), pcx - mouthX()), e.facing); sfx.cdaBubbles();
  }
};
// she spits forward: never straight up or down, never behind her
function cdaClampAim(a, f) {
  const lim = 1.1;
  if (f > 0) return clamp(a, -lim, lim);
  let b = a < 0 ? a + Math.PI * 2 : a;   // around PI
  return clamp(b, Math.PI - lim, Math.PI + lim);
}
// how far the jet goes before it hits rock (at most 4 blocks), and whether it crosses the hero
function cdaJetLen(e, x0, y0) {
  const ux = Math.cos(e.aim), uy = Math.sin(e.aim);
  for (let s = 0; s <= CDA_JET_LEN; s += 3) if (solidAt(Math.floor((x0 + ux * s) / T), Math.floor((y0 + uy * s) / T))) return s;
  return CDA_JET_LEN;
}
function cdaJetHits(x0, y0, ux, uy, L) {
  const r = { x: pl.x - 2, y: pl.y - 2, w: pl.w + 4, h: pl.h + 4 };
  for (let s = 2; s <= L; s += 3) { const x = x0 + ux * s, y = y0 + uy * s; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true; }
  return false;
}

/* ---------- blows, deaths, spawning ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && e.type === 'afogado' && (e.state === 'drag' || e.state === 'hold')) {   // a blow and it lets go
    cdaRelease(e, true); sfx.cdaSplash(0.7);
  }
  const s0 = e ? e.stun : 0, r = _hit(e, dir, mult, melee);
  if (e && e.type === 'afogado' && !e.dead && e.state === 'climb') { e.state = 'walk'; }   // knocked off the wall
  if (e && e.type === 'boiante' && e.state === 'bubble' && e.stun > 0) { e.state = 'recover'; e.stateT = 0.4; e.atkCD = Math.max(e.atkCD, 1.2); }   // a blow chokes the jet
  if (e && e.type === 'afogado' && e.stun > 0 && e.stun < 0.5 && e.state === 'reach') e.stun = s0 > 0 ? s0 : 0.12;   // heavy: it barely flinches mid-reach
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (cdaHolder === e) cdaHolder = null;
  const r = _k(e);
  if (CDA_TYPES.includes(e.type)) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    burst(cx, cy, 16, '#121618', 90, 300, 0.8, 1);   // the black water it was full of
    for (let i = 0; i < 6; i++) cdaBubbles.push({ x: cx + rnd(-5, 5), y: cy + rnd(-6, 6), vx: rnd(-8, 8), vy: rnd(-30, -12), t: 0, life: 0.8 + Math.random() * 0.6, r: i % 3 ? 1 : 2 });
    sfx.cdaGurgle(0.8);
  }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !CDA_TYPES.includes(type)) return e;
  e.cdaV = Math.floor(e.seed * 3) % 3;
  // spawned into rock (the edge of a cistern): up into the first free spot
  for (let k = 0; k < 4 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  if (type === 'afogado') {
    e.state = 'walk'; e.atkCD = 0.8 + Math.random() * 0.6;
    const side = cdaWaterSide(e.x + e.w / 2, e.y + e.h, 4);
    if (side === 0) e.homeX = e.x + e.w / 2; else if (side !== null) e.homeX = e.x + e.w / 2 + side * 2 * T;
  } else { e.state = 'swim'; e.strokeT = Math.random() * CDA_STROKE; e.atkCD = 1 + Math.random(); }
  return e;
}; }

/* ---------- the bubbles and the jet ---------- */
const cdaBubbles = [];
function cdaUpdate(dt) {
  if (cdaHolder && (cdaHolder.dead || !enemies.includes(cdaHolder))) cdaHolder = null;
  for (let i = cdaBubbles.length - 1; i >= 0; i--) {
    const b = cdaBubbles[i]; b.t += dt; b.x += (b.vx + Math.sin(b.t * 9 + i) * 6) * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.3, dt);
    if (b.t > b.life || solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) { if (Math.random() < 0.25 && Math.abs(b.x - pl.x) < 200) sfx.cdaPop(); cdaBubbles.splice(i, 1); }
  }
  // a boiante knocked about still settles slowly, as in water
  for (const e of enemies) if (!e.dead && e.type === 'boiante' && e.stun > 0) e.vy = approach(e.vy, 10, 40 * dt);
}
HOOK.update.push(cdaUpdate);
// the jet, in the scene: a band of black water, glints running along it, spray at the end
HOOK.drawWorld.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || e.type !== 'boiante' || e.state !== 'jet') continue;
    const x0 = e.x + e.w / 2 + e.facing * 3.5, y0 = e.y + e.h - 15 + cdaBob(e), ux = Math.cos(e.aim), uy = Math.sin(e.aim);
    const L = Math.min(cdaJetLen(e, x0, y0), e.jetT / 0.08 * CDA_JET_LEN), fade = clamp(e.stateT / 0.12, 0, 1);
    for (let s = 0; s <= L; s += 1) {
      const w = Math.sin(s * 0.7 - gameTime * 40) * 0.8, th = 1 + Math.min(2, s / 14), nx = -uy, ny = ux;
      for (let k = -th; k <= th; k++) {
        const x = Math.round(x0 + ux * s + nx * (k + w)) - cx, y = Math.round(y0 + uy * s + ny * (k + w)) - cy;
        const edge = Math.abs(k) >= th - 0.5, glint = ((s + Math.floor(gameTime * 60)) % 7 === 0) && k === -Math.floor(th);
        lc.globalAlpha = (edge ? 0.6 : 0.9) * fade; lc.fillStyle = glint ? '#4a5660' : edge ? '#181c20' : (s % 3 ? '#0c0e12' : '#121418');
        lc.fillRect(x, y, 1, 1);
      }
    }
    if (L > 4) for (let k = 0; k < 5; k++) {   // the spray where it breaks
      const a = e.aim + Math.sin(gameTime * 30 + k * 2) * 0.9, r = 2 + ((gameTime * 50 + k * 7) % 5);
      lc.globalAlpha = 0.8 * fade; lc.fillStyle = k % 2 ? '#22262c' : '#3a444c';
      lc.fillRect(Math.round(x0 + ux * L + Math.cos(a) * r) - cx, Math.round(y0 + uy * L + Math.sin(a) * r) - cy, 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
// over the dark: the bubbles (the tell) and the drips on the reaching arms, faint, as pale rings of water
HOOK.drawTop.push((cx, cy) => {
  for (const b of cdaBubbles) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy, a = Math.min(1, (b.life - b.t) * 3) * 0.7;
    if (x < -4 || x > VW + 4 || y < -4 || y > VH + 4) continue;
    lc.globalAlpha = a; lc.fillStyle = '#7e9298';
    if (b.r > 1) { lc.fillRect(x - 1, y - 2, 2, 1); lc.fillRect(x - 1, y + 1, 2, 1); lc.fillRect(x - 2, y - 1, 1, 2); lc.fillRect(x + 1, y - 1, 1, 2); lc.fillStyle = '#b4c2c0'; lc.fillRect(x - 1, y - 1, 1, 1); }
    else { lc.fillRect(x, y, 1, 1); lc.globalAlpha = a * 0.5; lc.fillRect(x + 1, y, 1, 1); }
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'afogado' || e.state !== 'reach') continue;
    const k = clamp(1 - e.stateT / CDA_REACH, 0, 1), x = Math.round(e.x + e.w / 2 + e.facing * (4 + k * 6)) - cx, y = Math.round(e.y + 10 - k * 2) - cy;
    for (let i = 0; i < 3; i++) { const t = (gameTime * 2.2 + i * 0.33) % 1; lc.globalAlpha = 0.55 * (1 - t) * k; lc.fillStyle = '#7e9298'; lc.fillRect(x + e.facing * i * 2, y + Math.round(t * 12), 1, 1 + (t < 0.2 ? 1 : 0)); }
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || e.type !== 'boiante' || (e.state !== 'bubble' && e.state !== 'jet')) continue;
    lc.globalAlpha = e.state === 'jet' ? 0.25 : 0.15 + 0.15 * clamp(1 - e.stateT / CDA_BUBBLE, 0, 1);
    lc.drawImage(CDA.GL.drop, e.x + e.w / 2 + e.facing * 4 - cx - 4, e.y + e.h - 15 - cy - 4);
  }
  lc.globalAlpha = 1;
});
function clearCdaFx() { cdaBubbles.length = 0; cdaHolder = null; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearCdaFx(); cdaTables(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  // a throat full of water: a low bubbling groan
  cdaGurgle(v = 1) { tone(92, 0.5, 'sawtooth', 0.016 * v, -30); noise(0.5, 0.03 * v, 420, 'bandpass', 0, 6); for (let k = 0; k < 5; k++) tone(160 + Math.random() * 120, 0.05, 'sine', 0.018 * v, 160, 0.06 + k * 0.08); },
  cdaSlap(v = 1) { noise(0.12, 0.09 * v, 900, 'lowpass'); tone(130, 0.1, 'sine', 0.05 * v, -60); noise(0.18, 0.03 * v, 2200, 'bandpass', 0.04, 2); },
  cdaMiss() { noise(0.1, 0.03, 1200, 'bandpass', 0, 2); },
  cdaSplash(v = 1) { noise(0.26, 0.06 * v, 900, 'lowpass'); noise(0.14, 0.03 * v, 2600, 'bandpass', 0.03); tone(300, 0.12, 'sine', 0.02 * v, -180); },
  cdaBubbles() { for (let k = 0; k < 8; k++) tone(260 + Math.random() * 260, 0.06, 'sine', 0.02, 240, k * 0.08); noise(0.6, 0.015, 600, 'bandpass', 0, 5); },
  cdaPop() { tone(500 + Math.random() * 400, 0.03, 'sine', 0.008, 300); },
  cdaJet() { noise(0.42, 0.08, 700, 'lowpass'); noise(0.36, 0.04, 1800, 'bandpass', 0.02, 1.5); tone(110, 0.3, 'sawtooth', 0.02, -40); }
});
