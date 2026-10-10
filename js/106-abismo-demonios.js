'use strict';

/* ================= the demons of the abyss (1 of 2) =================
   What lives under the furnaces. The imp, a little winged devil that flits about in nervous zig-zags, stops dead,
   lights a fire in its hand and throws it; the hellhound, lean and burning, that runs in packs, crouches and pounces
   from a long way off; the brute, a great horned demon that plods, lowers its horns and charges (and stands dazed when
   it hits a wall), or clasps its fists and pounds the floor; the magma worm, that swims through the rock out of sight
   (the floor glows and shakes where it will come out) and bursts up in an arc; and the lost soul, a tormented thing
   that floats through walls, screams (the hero goes slow for a moment) and drains life with a touch.
   The other five are in 107. Same brush as 55 and 82 (cp, ramps, outline, cache). Loads after 105 and before 49 (BAL). */

/* ---------- stats ---------- */
Object.assign(ET, {
  diabrete: { name: 'Diabrete', w: 9, h: 10, hp: 44, dmg: 16, xp: 26, kb: 1.0, fly: true, blood: '#b0301c' },
  caoinferno: { name: 'Cão Infernal', w: 15, h: 10, hp: 64, dmg: 18, xp: 26, kb: 0.7, fly: false, blood: '#7a1414' },
  brutamontes: { name: 'Demônio Brutamontes', w: 16, h: 28, hp: 300, dmg: 30, xp: 70, kb: 0.05, fly: false, blood: '#6a1010' },
  vermemagma: { name: 'Verme de Magma', w: 22, h: 9, hp: 140, dmg: 24, xp: 44, kb: 0.2, fly: true, phase: true, blood: '#ff7a2a' },
  almapenada: { name: 'Alma Penada', w: 11, h: 16, hp: 70, dmg: 18, xp: 36, kb: 0.6, fly: true, phase: true, blood: '#c8bcc0' }
});

/* ---------- materials ---------- */
Object.assign(ICON_ART, {
  demonEssence: [["....r....", "...rR....", "..rRYr...", ".rRYWYr..", ".rRYWYRr.", "..rRYRr..", "...rRr...", "....r...."], { r: '#5a0a1a', R: '#c02a2a', Y: '#ff8a3a', W: '#ffe0a0' }],
  leatherWing: [["k........", "kK.......", "kMK....k.", "kMMK..kK.", "kMMMKkMK.", "kMmMMMMK.", ".kmMmMmk.", "..k.k.k.."], { k: '#1a0606', K: '#7a3a2a', M: '#6a1e16', m: '#4a120e' }]
});
Object.assign(ITEMS, {
  essencia_demoniaca: { name: 'Essência Demoníaca', rar: 2, stack: 99, icon: 'demonEssence', desc: 'Uma brasa que não esfria e não para de sussurrar. Material.' },
  asa_couro: { name: 'Asa de Couro', rar: 1, stack: 99, icon: 'leatherWing', desc: 'Pele fina e quente esticada em ossinhos. Material.' }
});
Object.assign(DROPS, {
  diabrete: [['brasa', 0.45], ['asa_couro', 0.4], ['cinza', 0.3, 1, 2], ['essencia_demoniaca', 0.1], ['pocao', 0.08], ['min_infernita', 0.04], ['anel_vampiro', 0.012], ['elmo_chifres', 0.01]],
  caoinferno: [['presa', 0.55], ['cinza', 0.2], ['essencia_demoniaca', 0.08], ['pocao', 0.08], ['min_infernita', 0.04], ['anel_furia', 0.015], ['grevas_demonio', 0.015]],
  brutamontes: [['chifre', 0.65, 1, 2], ['essencia_demoniaca', 0.25], ['enxofre', 0.3, 1, 2], ['pocao', 0.15], ['min_infernita', 0.12, 1, 2], ['machado_chifre', 0.035], ['elmo_chifres', 0.03], ['grevas_demonio', 0.025], ['montante_ouro', 0.025], ['escudo_infernal', 0.015], ['lamina_infernal', 0.006]],
  vermemagma: [['enxofre', 0.45, 1, 2], ['cinza', 0.4, 1, 3], ['carvao', 0.3, 1, 2], ['min_infernita', 0.15, 1, 2], ['essencia_demoniaca', 0.1], ['pocao', 0.08]],
  almapenada: [['essencia_demoniaca', 0.5], ['cinza', 0.25], ['pocao', 0.1], ['min_infernita', 0.03], ['lanterna_fantasma', 0.015], ['lamina_infernal', 0.004]]
});
// items made by later files (104's block items, 110's ore) count too: the lists are trimmed at the first world or drop
const AB_DEMONS = ['diabrete', 'caoinferno', 'brutamontes', 'vermemagma', 'almapenada'];
let abdReady = false;
function abdLate() {
  if (abdReady) return; abdReady = true;
  for (const k of AB_DEMONS) DROPS[k] = DROPS[k].filter(([id]) => ITEMS[id]);
  if (typeof DMG_KIND !== 'undefined') Object.assign(DMG_KIND, { diabrete: 'fogo', caoinferno: 'fogo', vermemagma: 'fogo' });
}
{ const _rd = rollDrops; rollDrops = function (e) { abdLate(); return _rd.apply(this, arguments); }; }
Object.assign(NAV_WALKERS, { caoinferno: 1, brutamontes: 1 });
Object.assign(CV_STEP, { caoinferno: 1, brutamontes: 1 });

/* ================= art ================= */
const ABD = {};
{
const { RB, cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RD = {
  pele: R7(['#1a0606', '#360c0a', '#561410', '#7a1e16', '#a02c1e', '#c4462c', '#e06a44']),       // demon hide
  carvao: R7(['#0a0606', '#150c0a', '#221310', '#321b16', '#44241c', '#5a3024', '#743e2e']),     // the hound's charred hide
  bruto: R7(['#140606', '#2a0c0a', '#44120e', '#621a14', '#82261a', '#a23424', '#c04a34']),      // the brute's darker red
  chifre: R7(['#1e1610', '#362a1e', '#54442e', '#766244', '#9a8460', '#bea882', '#e0d0aa']),
  casco: R7(['#060404', '#0e0a0a', '#181212', '#241c1a', '#322724', '#443632', '#5a4842']),
  asa: R7(['#100406', '#1e080a', '#300e0e', '#441612', '#5a2018', '#722c20', '#8c3c2c']),
  fogo: R7(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),
  crosta: R7(['#0a0605', '#160d0a', '#24150f', '#342018', '#462c22', '#5c3a2c', '#764c3a']),
  alma: R7(['#16121a', '#2a2430', '#423a48', '#5e5664', '#827a86', '#aaa2aa', '#d8d2d4']),
  ferro: R7(['#0e0e11', '#1c1c21', '#2e2f36', '#44464f', '#5e616c', '#7c808c', '#a2a6b2']),
  pano: R7(['#0c0808', '#16100e', '#221814', '#30221c', '#3e2c24', '#4e382e', '#62463a']),
  boca: R7(['#0a0202', '#180404', '#2a0808', '#3e0e0c', '#561612', '#6e2018', '#8a2c20'])
};
// a filled polygon shaded from top (light) to bottom: wings and wing membranes
function poly(P, pts, R, v0, v1, s) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5; let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; }
    if (ins) P.put(x, y, R, lerp(v0, v1, (py - y0) / Math.max(1, y1 - y0)) + cg(x, y, s) * 0.4);
  }
}
// a thick limb along a polyline: a dark rim one pixel wider, then the limb lit from the top left
function limb(P, pts, r, R, base, s, rimV = 0.5) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.8; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.08 ? -0.9 : 0)); } });
}
// glowing cracks over a hide: short jagged runs of fire colour
function cracks(P, x0, y0, x1, y1, n, s, v = 4.6) {
  for (let k = 0; k < n; k++) {
    let x = x0 + hash2(k, 1, s) * (x1 - x0), y = y0 + hash2(k, 2, s) * (y1 - y0);
    for (let j = 0; j < 3; j++) { P.put(x, y, RD.fogo, v - j * 0.6); x += hash2(k, j + 3, s) < 0.5 ? 1 : 0; y += 1; }
  }
}

/* the imp, 22 x 20 facing right: 0-2 flapping (wings up, level, down), 3 a fire lit in its raised hand, 4 throw */
function imp(pose) {
  const P = cp(22, 20), s = 10101 + pose * 7, cast = pose === 3, thr = pose === 4;
  const wp = cast ? 0 : thr ? 2 : pose;
  const wing = (dx, dark) => {
    const sh = [9 + dx, 8];
    const tips = wp === 0 ? [[3 + dx, 0], [0 + dx, 3], [1 + dx, 8]] : wp === 1 ? [[1 + dx, 3], [0 + dx, 7], [2 + dx, 11]] : [[2 + dx, 13], [4 + dx, 16], [7 + dx, 16]];
    const mem = wp === 0 ? [sh, tips[0], [3.6 + dx, 3.4], tips[1], [3 + dx, 6.6], tips[2], [8 + dx, 11]] : wp === 1 ? [sh, tips[0], [3 + dx, 5], tips[1], [3.6 + dx, 8.4], tips[2], [8 + dx, 11]] : [sh, tips[0], [4 + dx, 12.6], tips[1], [6 + dx, 13.4], tips[2], [9 + dx, 11]];
    poly(P, mem, RD.asa, dark ? 2.2 : 3.6, dark ? 0.8 : 1.8, s + dx);
    for (const t of tips) P.line(sh[0], sh[1], t[0], t[1], RD.pele, dark ? 2.4 : 3.6);   // the finger bones
    P.put(sh[0] - 0.4, sh[1] - 0.6, RD.chifre, dark ? 3 : 4.4);   // the wrist claw
  };
  wing(3, true);   // the far wing, behind
  // the tail: thin, whipping down and back, an arrowhead at the end
  const tw = pose === 1 ? 1 : pose === 2 ? -1 : 0;
  P.line(8.6, 14, 5.6, 16.4 + tw * 0.5, RD.pele, 3); P.line(5.6, 16.4 + tw * 0.5, 2.6, 15.6 + tw, RD.pele, 2.6);
  P.put(1.6, 15.4 + tw, RD.pele, 4); P.put(1.6, 16.4 + tw, RD.pele, 2.4); P.put(0.8, 15.8 + tw, RD.pele, 3); P.put(2.4, 14.6 + tw, RD.pele, 3.4);
  // legs dangling: thin shins, black hooves
  P.line(10, 15, 9.4, 17.4, RD.pele, 2.4); P.line(9.4, 17.4, 8.4, 18.6, RD.casco, 3);
  P.line(12.4, 15, 12.8, 17.6, RD.pele, 3.4); P.line(12.8, 17.6, 12.2, 19, RD.casco, 3.6);
  // the far arm
  P.line(10, 10.4, 8.6, 13.2, RD.pele, 2.4); P.put(8.4, 13.8, RD.chifre, 3);
  // body: a round pot-belly, ribs on the chest
  P.blob(11.2, 12, 3.4, 3.8, RD.pele, s, 3.4, (x, y, dx, dy) => (dx > 0.2 && dy > -0.2 ? 0.8 : 0) + (dy < -0.2 && (y % 2 === 0) && dx > -0.3 ? -0.7 : 0));
  wing(0, false);   // the near wing
  // head: big, a pointed ear swept back, two little horns, a wide grin
  const hx = 13.2, hy = 6.6;
  P.line(hx - 2, hy - 1, hx - 5, hy - 2.6, RD.pele, 3.6); P.put(hx - 5.6, hy - 3, RD.pele, 4.4);
  P.blob(hx, hy, 3.6, 3.2, RD.pele, s + 1, 3.8);
  P.blob(hx + 2.6, hy + 0.8, 1.6, 1.3, RD.pele, s + 2, 4);   // snout
  P.line(hx - 0.6, hy - 2.6, hx - 1.2, hy - 5, RD.chifre, 4.6); P.put(hx - 0.4, hy - 5.8, RD.chifre, 5.6);
  P.line(hx + 1.4, hy - 2.6, hx + 1.8, hy - 4.6, RD.chifre, 4.2); P.put(hx + 2.4, hy - 5.2, RD.chifre, 5.2);
  P.put(hx + 1.4, hy - 1, RD.boca, 0.4); P.put(hx + 2.2, hy - 1, RD.boca, 0.4); P.put(hx + 1.8, hy - 0.6, RD.fogo, 5.6); P.put(hx + 2.4, hy - 0.6, RD.fogo, 4.4);   // a slit of a burning eye
  P.line(hx + 0.4, hy + 2, hx + 3.6, hy + 1.6, RD.boca, 1); P.put(hx + 1.6, hy + 2, RD.chifre, 5.6); P.put(hx + 2.8, hy + 1.8, RD.chifre, 5.2);   // the grin and its fangs
  // the near arm
  if (cast) { P.line(13, 10.4, 15.6, 8, RD.pele, 3.8); P.line(15.6, 8, 17.4, 5.2, RD.pele, 4.2); P.blob(18.4, 3.6, 2.4, 2.4, RD.fogo, s + 3, 5.2); P.put(18, 3.2, RD.fogo, 6.6); P.put(18.8, 3.8, RD.fogo, 6.4); }
  else if (thr) { P.line(13, 10.4, 17, 10.2, RD.pele, 3.8); P.line(17, 10.2, 20, 9.6, RD.pele, 4.2); P.put(20.8, 9.2, RD.chifre, 4.6); P.put(20.6, 10.2, RD.chifre, 4); P.put(21, 8.2, RD.fogo, 5); }
  else { P.line(13, 10.4, 14.6, 13.2, RD.pele, 3.8); P.line(14.6, 13.2, 16, 13.6, RD.pele, 4); P.put(16.6, 13.4, RD.chifre, 4.6); P.put(16.4, 14.2, RD.chifre, 4); }
  return set(P.done());
}

/* the hellhound, 28 x 16 facing right: 0 standing, 1-2 running (gathered, stretched), 3 crouched to pounce, 4 the pounce */
function hound(pose) {
  const P = cp(28, 16), s = 10201 + pose * 5, H = RD.carvao, low = pose === 3 ? 2 : 0, leap = pose === 4, lift = leap ? -1.6 : 0;
  const by = 8 + low + lift;   // the line of the back's middle
  // legs: [hip/shoulder, knee, foot] far and near
  const L = pose === 1 ? { hf: [[9, by + 1], [11.6, 11.6], [12.6, 15]], ff: [[19, by + 1], [17.4, 12], [15.6, 14.4]], hn: [[8.6, by + 1.4], [11, 12], [12.2, 15]], fn: [[18.6, by + 1.4], [16.8, 12.4], [15.4, 15]] }
    : pose === 2 ? { hf: [[9, by + 1], [6.6, 11.4], [3.4, 13.4]], ff: [[19, by + 1], [22.6, 11], [25.2, 13.4]], hn: [[8.6, by + 1.4], [6.4, 12], [2.6, 14.4]], fn: [[18.6, by + 1.4], [22.4, 11.6], [25.6, 14.6]] }
    : pose === 3 ? { hf: [[9, by], [11.6, 13], [9.4, 15]], ff: [[19, by], [20.4, 13], [21.4, 15]], hn: [[8.6, by + 0.4], [11.4, 13.4], [9, 15]], fn: [[18.6, by + 0.4], [20, 13.4], [21.6, 15]] }
    : leap ? { hf: [[9, by + 1], [5, by + 2.4], [1.4, by + 2]], ff: [[19, by + 1], [23, by], [26.4, by - 1.2]], hn: [[8.6, by + 1.4], [4.6, by + 3.4], [0.6, by + 3]], fn: [[18.6, by + 1.4], [22.6, by + 1.4], [26.6, by + 0.6]] }
    : { hf: [[9, by + 1], [9.6, 11.6], [8.6, 15]], ff: [[19, by + 1], [19.6, 12], [20.6, 15]], hn: [[8.6, by + 1.4], [10.4, 12], [9.6, 15]], fn: [[18.6, by + 1.4], [18.4, 12.2], [19.4, 15]] };
  const leg = (pts, near) => { limb(P, pts, near ? 0.9 : 0.75, H, near ? 3 : 1.4, s + pts[0][0] + (near ? 1 : 0)); const [fx, fy] = pts[2]; P.put(fx + 0.8, fy, RD.chifre, near ? 4.4 : 2.6); P.put(fx - 0.2, fy, RD.casco, near ? 3.6 : 2); };
  // the tail: thin and kinked, an ember at its tip
  const tl = leap ? [[6, by], [2.6, by - 0.6], [0.4, by - 1.6]] : pose === 3 ? [[6, by - 1], [3, by - 4], [1.4, by - 6.4]] : [[6, by - 0.4], [3, by - 2.4 + (pose === 1 ? -1 : 0)], [1.2, by - 4.6 + (pose === 2 ? 1.2 : 0)]];
  P.line(tl[0][0], tl[0][1], tl[1][0], tl[1][1], H, 3.2); P.line(tl[1][0], tl[1][1], tl[2][0], tl[2][1], H, 2.8);
  P.put(tl[2][0], tl[2][1], RD.fogo, 6); P.put(tl[2][0] - 0.6, tl[2][1] - 1, RD.fogo, 4.6); P.put(tl[2][0] + 0.4, tl[2][1] - 1.6, RD.fogo, 3.6);
  leg(L.hf, false); leg(L.ff, false);
  // body: a lean barrel, deep in the chest, tucked at the belly; the ribs show under charred hide
  P.blob(11.6, by, 6.6, 3, H, s, 3.2, (x, y, dx, dy) => (dy > 0.3 && dx < 0.4 ? -1 : 0) + ((x % 2 === 0) && dy > -0.4 && dy < 0.5 && dx > -0.2 ? -0.6 : 0));
  P.blob(17.8, by + 0.4 - (pose === 3 ? 0.6 : 0), 3.6, 3.6, H, s + 1, 3.4);
  cracks(P, 9, by - 1, 17, by + 1, 3, s + 2, 4.2);
  // a ridge of bone spikes down the spine
  for (let k = 0; k < 6; k++) { const x = 7.4 + k * 2.1, y = by - 2.8 - (k > 3 ? 0.4 : 0); P.put(x, y, RD.chifre, 4.4); P.put(x - 0.6, y - 0.8, RD.chifre, 3.2 + (k % 2)); }
  leg(L.hn, true); leg(L.fn, true);
  // head and neck: low and forward; horns swept back; a ruff of fire on the neck
  const hx = leap ? 23.2 : pose === 3 ? 22.4 : 22, hy = leap ? by - 2.2 : pose === 3 ? by - 0.8 : by - 3.2;
  for (let k = 0; k < 6; k++) {   // the ruff: tongues of fire streaming back off the neck
    const bx = 17 + k * 0.9 + (hx - 22) * 0.6, bt = by - 1.8 + (hy - by + 3) * (k / 6), h = 2.6 + hash2(k, pose, s) * 2.2 + (k > 1 && k < 5 ? 1.2 : 0), ln = leap ? -1.1 : -0.7;
    for (let j = 0; j < h; j++) { const x = bx + ln * j; P.put(x, bt - j, RD.fogo, 5.6 - j / h * 3.4); if (j < h * 0.6) P.put(x - 1, bt - j + 0.6, RD.fogo, 3.6 - j / h * 2.6); }
  }
  limb(P, [[18.6, by - 0.6], [hx - 1.4, hy + 0.6]], 1.7, H, 3.4, s + 3);
  P.blob(hx, hy, 3, 2.6, H, s + 4, 4.2);
  const open = leap || pose === 3;
  P.blob(hx + 3, hy + 0.9, 2.4, 1.3, H, s + 5, 4);   // the snout
  if (open) { P.line(hx + 1, hy + 2.4, hx + 4.6, hy + (leap ? 3.8 : 3), H, 2.6); for (let x = hx + 1.4; x < hx + 4.6; x += 1) P.put(x, hy + 1.8 + (x - hx) * 0.2, RD.fogo, 5.4 - (x - hx) * 0.3); P.put(hx + 4.2, hy + 1.6, RD.chifre, 5.6); P.put(hx + 3.4, hy + 3, RD.chifre, 5.2); }   // jaws open on a burning throat
  else { P.line(hx + 1.2, hy + 1.8, hx + 4.4, hy + 1.8, RD.boca, 1); P.put(hx + 3.4, hy + 2.2, RD.chifre, 5.2); }
  P.put(hx + 4.8, hy + 0.2, RD.casco, 1.4);   // nose
  P.put(hx + 1, hy - 0.8, RD.fogo, 6.4); P.put(hx + 1.8, hy - 0.8, RD.fogo, 5.2);   // the burning eye
  P.line(hx - 0.4, hy - 1.8, hx - 3.4, hy - 3.4, RD.chifre, 4.8); P.line(hx - 3.4, hy - 3.4, hx - 4.8, hy - 2.6, RD.chifre, 3.4);   // horns swept back
  P.line(hx + 0.6, hy - 2.2, hx - 1.8, hy - 4.2, RD.chifre, 5.4); P.put(hx - 2.6, hy - 4.4, RD.chifre, 4.2);
  return set(P.done());
}

/* the brute, 32 x 36 facing right: 0 standing, 1-2 walking, 3 horns lowered (about to charge), 4 charging,
   5 fists clasped overhead, 6 fists pounded into the floor */
function brute(pose) {
  const P = cp(36, 36), s = 10301 + pose * 9, B = RD.bruto, step = pose === 1 ? 1 : pose === 2 ? -1 : 0;
  const lean = pose === 3 || pose === 4 ? 2.4 : pose === 6 ? 1.6 : 0, dip = pose === 3 || pose === 4 ? 2 : pose === 6 ? 2.4 : pose === 5 ? -0.6 : 0;
  // legs: thick thighs, backward-bent hocks, cloven hooves
  const run = pose === 4;
  const legF = run ? [[13, 24], [9.6, 28.6], [7, 31], [5.6, 34.4]] : pose === 3 ? [[13, 24], [11.4, 29], [9.6, 31.4], [10, 34.4]] : [[13, 24], [14 - step * 2, 29], [12 - step * 2, 31.6], [12.4 - step * 2.4, 34.4]];
  const legN = run ? [[18, 24.6], [22.4, 27.6], [21.4, 31], [23, 34.4]] : pose === 3 ? [[18, 24.6], [21.6, 28.6], [20.4, 31.6], [22, 34.4]] : [[18, 24.6], [20 + step * 2, 29], [18.4 + step * 2, 31.6], [19.2 + step * 2.4, 34.4]];
  // the far arm (shoulder, elbow, fist)
  const armF = pose === 5 ? [[13 + lean, 13 + dip], [11.6, 7], [16, 2.4]] : pose === 6 ? [[13 + lean, 13 + dip], [17, 21], [24, 31.6]] : run ? [[13 + lean, 13 + dip], [8.6, 18], [5, 21]] : pose === 3 ? [[13 + lean, 13 + dip], [11.4, 20], [12.6, 25]] : [[13, 13], [10.4 + step, 19.6], [9.6 + step * 1.4, 25.4]];
  limb(P, armF, 2.2, B, 1.8, s + 1);
  P.blob(armF[2][0], armF[2][1], 2.7, 2.5, B, s + 2, 2, (x, y) => ((x + y) % 3 === 0 ? -0.6 : 0));
  limb(P, legF, 2.4, B, 1.6, s + 3);
  P.blob(legF[3][0], legF[3][1], 2.4, 1.3, RD.casco, s + 4, 2.4); P.put(legF[3][0], legF[3][1], RD.casco, 0.4);
  // the body: a heavy hump of shoulders over a barrel chest; scars, a burning brand on the chest
  P.blob(15 + lean * 0.5, 20 + dip * 0.4, 7.4, 6.6, B, s, 2.8, (x, y, dx, dy) => (dy > 0.4 ? -0.8 : 0) + (dx > 0.25 && dy > -0.5 && dy < 0.5 ? 0.9 : 0) + (dx > 0.25 && (y % 3 === 0) && dy > -0.2 ? -0.9 : 0) + (hash2(x, y, s) < 0.06 ? -1.2 : 0));
  P.blob(14.6 + lean, 13.8 + dip, 8, 5.8, B, s + 5, 3.3, (x, y, dx, dy) => (Math.abs(dx - 0.25) < 0.08 && dy > -0.2 ? -1.2 : 0) + (dy < -0.5 ? 0.6 : 0) + (hash2(x, y, s + 5) < 0.06 ? -1 : 0));
  for (let k = 0; k < 4; k++) P.line(9.6 + lean + k * 1.4, 10.6 + dip + k * 0.2, 10.4 + lean + k * 1.4, 12 + dip + k * 0.2, B, 5.2);   // the hump's knotted muscle catches the light
  for (let k = 0; k < 3; k++) P.put(19 + lean - k * 0.6, 19 + dip + k, B, 1.2);   // scars across the belly
  for (const [x, y] of [[17.6, 15], [18.6, 14.4], [19.4, 15.2], [18.6, 16], [18.4, 17]]) P.put(x + lean, y + dip, RD.fogo, 5.2);   // the brand
  // a loincloth on an iron belt, a skull for a buckle
  for (let x = 9; x <= 21; x++) { P.put(x + lean * 0.3, 23.6 + dip * 0.2, RD.ferro, 3.6 - (x - 9) * 0.1); P.put(x + lean * 0.3, 24.4 + dip * 0.2, RD.ferro, 2); }
  for (let y = 25; y < 29.6; y++) for (let x = 12 + (y - 25) * 0.3; x < 20 - (y - 25) * 0.1; x++) { if (y > 28 && hash2(x, 1, s) < 0.45) continue; P.put(x + lean * 0.3 - (run ? (y - 25) * 0.6 : 0), y + dip * 0.2, RD.pano, 3.4 - (y - 25) * 0.4 + cg(x, y, s) * 0.5 + ((x | 0) % 3 === 0 ? -0.7 : 0)); }
  P.blob(17.4 + lean * 0.3, 24 + dip * 0.2, 1.4, 1.2, RD.chifre, s + 6, 4.4); P.put(17 + lean * 0.3, 24 + dip * 0.2, RD.boca, 0.4); P.put(18 + lean * 0.3, 24 + dip * 0.2, RD.boca, 0.4);
  limb(P, legN, 2.6, B, 2.8, s + 7);
  P.blob(legN[3][0], legN[3][1], 2.6, 1.3, RD.casco, s + 8, 3.4); P.put(legN[3][0] + 0.6, legN[3][1], RD.casco, 0.6);
  // the head: small, slung low in front of the hump; heavy brow, tusks, two great horns
  const hx = pose === 3 || pose === 4 ? 26.6 : pose === 6 ? 25.6 : 24.4, hy = pose === 3 || pose === 4 ? 17.4 : pose === 6 ? 15.6 : pose === 5 ? 11 : 12.4;
  P.blob(hx - 2.4, hy + 0.6, 2.6, 2.6, B, s + 14, 2.6);   // the bull neck
  P.blob(hx, hy, 3.6, 3.4, B, s + 10, 4);
  P.blob(hx + 2.2, hy + 1.6, 2, 1.6, B, s + 11, 3.4);   // the jaw
  P.line(hx - 0.4, hy - 1.4, hx + 3, hy - 1.2, B, 5.2); P.line(hx, hy - 0.6, hx + 3, hy - 0.4, B, 0.6);   // brow over a dark socket
  P.put(hx + 2.2, hy - 0.4, RD.fogo, 6.6); P.put(hx + 1.4, hy - 0.4, RD.fogo, 5);   // eye
  P.line(hx + 3.4, hy + 2.6, hx + 4.4, hy + 0.8, RD.chifre, 5.6); P.line(hx + 1.6, hy + 3, hx + 2, hy + 1.6, RD.chifre, 4.6);   // tusks
  P.put(hx + 4.6, hy + 0.6, RD.casco, 1.4);   // a nostril ring
  if (pose === 3 || pose === 4) {   // horns lowered: the points straight ahead
    for (let k = 0; k <= 8; k++) { const t = k / 8; P.put(hx - 1 + t * 9, hy - 3 - Math.sin(t * 2.6) * 2.2, RD.chifre, 3 + t * 2.6 - (k < 2 ? 1 : 0)); P.put(hx - 1 + t * 9, hy - 2 - Math.sin(t * 2.6) * 2.2, RD.chifre, 2 + t * 2.2); if (k < 5) P.put(hx - 1 + t * 9, hy - 4 - Math.sin(t * 2.6) * 2.2, RD.chifre, 4 + t * 1.6); }
    for (let k = 0; k <= 6; k++) { const t = k / 6; P.put(hx + 1 + t * 6, hy - 4.6 - Math.sin(t * 2.8) * 1.8, RD.chifre, 4.2 + t * 1.8); }
  } else {   // horns up: out from the temples, curving up and forward
    for (let k = 0; k <= 9; k++) { const t = k / 9, x = hx - 1.6 - Math.sin(t * 2.2) * 3 + t * 5, y = hy - 2.4 - t * 7.4; P.put(x, y, RD.chifre, 3 + t * 2.8); if (k < 6) { P.put(x - 1, y, RD.chifre, 2 + t * 2); P.put(x + 1, y, RD.chifre, 3.6 + t * 2); } }
    for (let k = 0; k <= 7; k++) { const t = k / 7, x = hx + 1.4 - Math.sin(t * 2.2) * 1.6 + t * 4.4, y = hy - 3 - t * 5.4; P.put(x, y, RD.chifre, 4 + t * 2); if (k < 4) P.put(x + 1, y, RD.chifre, 4.4 + t); }
  }
  // the near arm, a shackle on the wrist and a few links of broken chain
  const armN = pose === 5 ? [[18.6 + lean, 15 + dip], [23.6, 7.6], [18, 2.6]] : pose === 6 ? [[18.6 + lean, 15 + dip], [24, 21], [28, 31.2]] : run ? [[18.6 + lean, 15 + dip], [15.6, 20.6], [12.4, 22.6]] : pose === 3 ? [[18.6 + lean, 15 + dip], [21.6, 21], [22.4, 26.2]] : [[18.6, 15], [21.6 - step, 20.6], [22.2 - step * 1.4, 26]];
  limb(P, armN, 2.7, B, 3, s + 12);
  const [fx, fy] = armN[2], [ex, ey] = armN[1];
  const wx = lerp(ex, fx, 0.7), wy = lerp(ey, fy, 0.7);
  P.blob(fx, fy, 3, 2.8, B, s + 13, 3.4, (x, y) => ((x + y) % 3 === 0 ? -0.7 : 0));
  for (let k = -2; k <= 2; k++) P.put(wx + k * 0.5, wy - k * 0.2, RD.ferro, 4.6 - Math.abs(k) * 0.6);
  if (pose !== 5) for (let k = 1; k <= 3; k++) P.put(wx - 1 - k * 0.6, wy + k * 1.1, RD.ferro, k % 2 ? 4.6 : 2.6);
  if (pose === 6) for (let k = 0; k < 7; k++) P.put(fx - 3 + k, 35, RD.fogo, 5.6 - Math.abs(k - 3) * 0.7);   // the floor splits under the fists
  return set(P.done());
}

/* the magma worm, 36 x 13 facing right: plates of black crust over a molten body; 0-1 crawling, 2 maw open */
function worm(pose) {
  const P = cp(36, 13), s = 10401 + pose * 3, wv = pose === 1 ? 1.4 : 0;
  const seg = k => { const x = 2.4 + k * 3.3, r = 1.7 + k * 0.4, y = 7 + Math.sin(k * 0.9 + wv) * 0.9; return [x, y, r]; };
  for (let k = 0; k < 8; k++) { const [x, y, r] = seg(k); P.blob(x + 1.4, y, r * 0.8, r * 0.82, RD.fogo, s + k, 4.2, (xx, yy, dx, dy) => -Math.abs(dy) * 1.4); }   // the molten body between the plates
  for (let k = 0; k < 8; k++) {
    const [x, y, r] = seg(k);
    P.blob(x, y, r * 0.78, r, RD.crosta, s + 20 + k, 3.6, (xx, yy, dx, dy) => (dx > 0.55 ? -1.6 : 0) + (dx < -0.6 ? 0.8 : 0) + (hash2(xx, yy, s + k) < 0.12 ? 1.2 : 0));   // a crust plate, lit on its back edge, its rim in shadow
    if (k > 0 && k % 2 === 0) { P.put(x - 0.4, y - r * 0.2, RD.fogo, 4.6); P.put(x + 0.4, y + r * 0.4, RD.fogo, 3.6); }   // cracks glowing through
    if (k > 1) { P.put(x - 0.4, y - r - 0.4, RD.crosta, 5); P.put(x - 0.8, y - r - 1.2, RD.crosta, 4); }   // a spine
  }
  for (let k = 0; k < 8; k++) {   // the molten seams between the plates
    const [x, y, r] = seg(k), sx = x + 1.65, h = r * 0.75;
    for (let yy = -h; yy <= h; yy += 0.5) P.put(sx + yy * 0.15, y + yy, RD.fogo, 5.6 - Math.abs(yy) / h * 2.4 + (k > 5 ? 0.4 : 0));
  }
  const hx = 30.4, hy = 6.6;
  P.blob(hx, hy, 3.6, 4.6, RD.crosta, s + 9, 3.8, (x, y, dx, dy) => (hash2(x, y, s + 9) < 0.12 ? 1.2 : 0));
  if (pose === 2) {   // the round maw: a ring of teeth on a burning throat
    P.blob(hx + 2.2, hy, 2, 3.6, RD.fogo, s + 10, 6, (x, y, dx, dy) => -(dx * dx + dy * dy) * 2.4);
    for (let k = -2; k <= 2; k++) { P.put(hx + 1.4 + (Math.abs(k) === 2 ? 0.6 : 0), hy + k * 1.5, RD.chifre, 5.6); P.put(hx + 3.6 - (Math.abs(k) === 2 ? 0.8 : 0), hy + k * 1.4 + 0.6, RD.chifre, 4.6); }
  } else {
    P.line(hx + 3.2, hy - 2.2, hx + 3.2, hy + 2.2, RD.fogo, 4.4);   // the shut maw glowing at the seam
    P.line(hx + 2.4, hy - 3, hx + 4.6, hy - 1.6, RD.chifre, 5); P.line(hx + 2.4, hy + 3, hx + 4.6, hy + 1.6, RD.chifre, 4.4);   // mandibles
  }
  P.put(hx - 0.6, hy - 2, RD.fogo, 6.2); P.put(hx + 0.4, hy - 2.2, RD.fogo, 5);   // a burning eye-pit
  return set(P.done());
}

/* the lost soul, 20 x 28 facing right: a starved pale thing trailing off into smoke, a stretched screaming mouth,
   a broken shackle on one wrist. 0-1 drifting, 2 screaming (head thrown back, arms flung out), 3 reaching, 4 draining */
function soul(pose) {
  const P = cp(20, 28), s = 10501 + pose * 5, A = RD.alma, sway = pose === 1 ? 1 : pose === 0 ? -1 : 0, scream = pose === 2, reach = pose === 3 || pose === 4, lean = pose === 4 ? 1.6 : pose === 3 ? 0.8 : 0;
  // the tail of smoke: thinning, curling back, full of holes
  for (let y = 16; y < 28; y++) {
    const t = (y - 16) / 12, half = (1 - t) * 3.6 + 0.4, cx = 9 - t * 3 + Math.sin(t * 4 + sway) * t * 2;
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) { if (hash2(x, y, s) < t * 0.6) continue; P.put(x, y, A, 3.6 - (x + 0.5 - cx) / half * 1.1 - t * 2 + cg(x, y, s) * 0.6); }
  }
  // hair: long ragged strands streaming back
  for (let k = 0; k < 5; k++) { const y0 = 3 + k * 1.2 - (scream ? 1.2 : 0), len = 5 + hash2(k, 1, s) * 4; for (let j = 0; j < len; j++) P.put(9.2 + lean - j * 0.9, y0 + j * 0.45 + Math.sin(j * 0.8 + k + sway) * 0.6, A, 2.8 - j / len * 1.8 + (k % 2) * 0.6); }
  // the far arm
  const aF = scream ? [[8.4 + lean, 11], [5, 10], [2, 8]] : reach ? [[9.4 + lean, 11], [13.4 + lean, 12], [17 + lean, 11.4]] : [[8.6, 11.4], [7.4 + sway * 0.5, 15], [8 + sway, 18]];
  P.line(aF[0][0], aF[0][1], aF[1][0], aF[1][1], A, 1.8); P.line(aF[1][0], aF[1][1], aF[2][0], aF[2][1], A, 1.6);
  // the body: starved, ribs and spine showing, ragged at the edges, an ember still burning where the heart was
  P.blob(10 + lean * 0.6, 13.6, 3.8, 5, A, s, 3.4, (x, y, dx, dy) => (dy > 0.4 && hash2(x, y, s + 1) < 0.35 ? -9 : 0) + ((y % 2 === 0) && dy > -0.5 && dy < 0.3 && Math.abs(dx) < 0.7 ? -1 : 0));
  P.put(10.6 + lean * 0.6, 13.2, RD.fogo, 4.4); P.put(11.2 + lean * 0.6, 13.6, RD.fogo, 3.4);
  // the head: long and gaunt, two black sockets, the jaw hanging open in a scream that never stops
  const hx = 11.4 + lean, hy = scream ? 5.6 : 6.4, mo = scream ? 3.6 : pose === 4 ? 2.6 : 1.9;
  P.blob(hx, hy, 3.4, 4, A, s + 2, 4.2, (x, y, dx, dy) => (dy < -0.5 ? 0.4 : 0));
  P.blob(hx + 0.4, hy + 3, 2.4, 2 + mo * 0.5, A, s + 3, 3.6);   // the long jaw
  P.blob(hx + 0.6, hy - 0.4, 1, 1.2, RD.boca, s + 4, 0.6); P.blob(hx + 2.8, hy - 0.4, 0.9, 1.1, RD.boca, s + 5, 0.6);   // sockets
  P.blob(hx + 1.8, hy + 2.4 + mo * 0.4, 1.2 + (scream ? 0.5 : 0), mo, RD.boca, s + 6, 0.8, (x, y, dx, dy) => (dy > 0.3 ? 0.8 : 0));   // the mouth
  P.put(hx + 1.2, hy + 2.6 - mo * 0.3, A, 5.6); P.put(hx + 2.4, hy + 2.6 - mo * 0.3, A, 5.2);   // teeth
  // the near arm: long bony fingers; the shackle and its broken chain
  const aN = scream ? [[11 + lean, 11], [15, 9.4], [18.4, 7]] : reach ? [[11 + lean, 11.4], [14.6 + lean, 13.6], [18.6, 13]] : [[11, 11.4], [12.4 - sway * 0.5, 15.2], [12 - sway, 18.4]];
  P.line(aN[0][0], aN[0][1], aN[1][0], aN[1][1], A, 3.8); P.line(aN[1][0], aN[1][1], aN[2][0], aN[2][1], A, 3.4);
  const [fx, fy] = aN[2], dxh = fx - aN[1][0], dyh = fy - aN[1][1], n = Math.hypot(dxh, dyh) || 1;
  for (const o of [-1, 0, 1]) P.line(fx, fy, fx + dxh / n * 1.8 - dyh / n * o * 1.1, fy + dyh / n * 1.8 + dxh / n * o * 1.1, A, 4.6);   // fingers
  const wx = lerp(aN[1][0], fx, 0.55), wy = lerp(aN[1][1], fy, 0.55);
  P.put(wx, wy, RD.ferro, 4.6); P.put(wx, wy + 1, RD.ferro, 3); P.put(wx - 0.8, wy + 0.4, RD.ferro, 3.6);
  if (!scream) for (let k = 1; k <= 3; k++) P.put(wx - k * 0.5, wy + 1 + k * 1.2, RD.ferro, k % 2 ? 4.2 : 2.4);
  return set(P.done());
}
const GL = { fire: glow(10, '#ff8a2a'), hand: glow(16, '#ffa040'), lava: glow(18, '#ff6a1a'), big: glow(30, '#ff7020'), soul: glow(12, '#c8a0a0'), ember: glow(6, '#ff7030'), eyeR: glow(6, '#ff5020') };
ABD.get = () => ABD.ready || (ABD.ready = {
  imp: [0, 1, 2, 3, 4].map(imp),
  hound: [0, 1, 2, 3, 4].map(hound),
  brute: [0, 1, 2, 3, 4, 5, 6].map(brute),
  worm: [0, 1, 2].map(worm),
  soul: [0, 1, 2, 3, 4].map(soul)
});
Object.assign(ABD, { RD, GL, limb, poly });
}

/* ================= drawing ================= */
DRAW_E.diabrete = (e, fx, fy, fl) => {
  const B = ABD.get().imp, k = e.state === 'cast' ? 3 : e.state === 'throw' ? 4 : [0, 1, 2, 1][Math.floor(e.t * 16) % 4];
  lc.drawImage(cvPick(B[k], e, fl), fx - 12, fy - 18 + Math.round(Math.sin(e.t * 7 + e.seed)));
};
DRAW_E.caoinferno = (e, fx, fy, fl) => {
  const B = ABD.get().hound, k = e.state === 'crouch' ? 3 : e.state === 'pounce' && !e.onGround ? 4 : Math.abs(e.vx) > 8 && e.onGround ? 1 + (Math.floor(e.t * 11) % 2) : !e.onGround ? 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 15 - e.facing * 2, fy - 17);
};
DRAW_E.brutamontes = (e, fx, fy, fl) => {
  const B = ABD.get().brute, st = e.state;
  const k = st === 'lower' ? 3 : st === 'charge' ? (Math.floor(e.t * 10) % 2 ? 4 : 3) : st === 'raise' ? 5 : st === 'punch' ? 6 : st === 'stagger' ? 0 : Math.abs(e.vx) > 4 && e.onGround ? 1 + (Math.floor(e.t * 4) % 2) : 0;
  const j = st === 'lower' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 19 - e.facing * 3 + j, fy - 37 + (st === 'stagger' ? Math.round(Math.abs(Math.sin(e.t * 6))) : 0));
};
DRAW_E.vermemagma = (e, fx, fy, fl) => {
  const B = ABD.get().worm, st = e.state;
  if (st === 'deep' || st === 'rumble') return;   // out of sight (the floor's warning is drawn in drawTop)
  const cx = Math.round(e.x + e.w / 2) - fx, cy = Math.round(e.y + e.h) - fy, ex = fx, ey = fy - e.h / 2;
  if (st === 'leap' || st === 'sink') {
    const vx = st === 'sink' ? e.facing * 30 : e.mvx, vy = st === 'sink' ? 60 : e.mvy, left = vx < 0;
    const img = cvPick(B[st === 'leap' ? 2 : 0], { facing: left ? -1 : 1 }, fl), a = left ? Math.atan2(-vy, -vx) : Math.atan2(vy, vx);
    const clip = st === 'sink' || e.leapT < 0.4, sy = (e.sy !== undefined ? e.sy : e.y + e.h) - cy;
    lc.save(); if (clip) { lc.beginPath(); lc.rect(ex - 40, sy - 60, 80, 60); lc.clip(); }
    let ox = 0, oy = 0; if (st === 'sink') { const t = clamp(1 - e.stateT / 0.5, 0, 1); oy = t * 14; ox = e.facing * t * 6; }
    lc.translate(ex + ox, ey + oy); lc.rotate(a); lc.drawImage(img, -img.width / 2, -img.height / 2); lc.restore();
    return;
  }
  const k = st === 'bite' ? 2 : st === 'crawl' && Math.abs(e.mvx || 0) > 4 ? Math.floor(e.t * 5) % 2 : Math.floor(e.t * 2.5) % 2;
  lc.drawImage(cvPick(B[k], e, fl), fx - 19, fy - 14 + (st === 'exposed' ? Math.round(Math.sin(e.t * 9) * 0.6) : 0));
};
DRAW_E.almapenada = (e, fx, fy, fl) => {
  const B = ABD.get().soul, k = e.state === 'wail' || e.state === 'scream' ? 2 : e.state === 'reach' ? 3 : e.state === 'drain' ? 4 : Math.floor(e.t * 3) % 2;
  const bob = Math.round(Math.sin(e.t * 2.2 + e.seed) * 1.5), inRock = rectSolid(e.x, e.y, e.w, e.h);
  const a0 = lc.globalAlpha; lc.globalAlpha = a0 * (fl ? 1 : inRock ? 0.4 : e.state === 'walk' ? 0.74 : 0.9);
  lc.drawImage(cvPick(B[k], e, fl), fx - 11 - e.facing, fy - 26 + bob + (e.state === 'wail' ? Math.round(Math.sin(e.t * 50) * 0.6) : 0));
  lc.globalAlpha = a0;
};
EYES_E.diabrete = (e, fx, fy) => { lc.globalAlpha = 0.55; lc.drawImage(SPR.glow.eyeY, fx + e.facing * 4 - 6, fy - 17 + Math.round(Math.sin(e.t * 7 + e.seed))); };
EYES_E.caoinferno = (e, fx, fy) => { lc.globalAlpha = e.state === 'crouch' ? 0.9 : 0.5; lc.drawImage(ABD.GL.eyeR, fx + e.facing * (e.state === 'pounce' ? 8 : 6) - 6, fy - (e.state === 'crouch' ? 11 : 13) - 6); };
EYES_E.brutamontes = (e, fx, fy) => { const low = e.state === 'lower' || e.state === 'charge'; lc.globalAlpha = low || e.state === 'raise' ? 0.95 : 0.6; lc.drawImage(ABD.GL.eyeR, fx + e.facing * (low ? 9 : 6) - 6, fy - (low ? 21 : 27) - 6); };
EYES_E.vermemagma = () => { };
EYES_E.almapenada = (e, fx, fy) => { const bob = Math.round(Math.sin(e.t * 2.2 + e.seed) * 1.5); lc.globalAlpha = e.state === 'wail' || e.state === 'reach' ? 0.95 : 0.55; for (const o of [1, 3]) lc.drawImage(ABD.GL.ember, fx + e.facing * o - 6, fy - (e.state === 'wail' ? 20 : 19) + bob - 6); };
WARN_E.diabrete = e => e.state === 'cast';
WARN_E.caoinferno = e => e.state === 'crouch';
WARN_E.brutamontes = e => e.state === 'lower' || e.state === 'raise';
WARN_E.vermemagma = e => e.state === 'rumble';
WARN_E.almapenada = e => e.state === 'wail' || e.state === 'reach';

/* ================= behaviour ================= */
function abWand(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
const abEmber = (x, y, vx, vy, life = 0.5) => { if (parts.length < 700) parts.push({ x, y, vx, vy, g: -30, life, max: life, col: Math.random() < 0.5 ? '#ffd070' : '#ff8a2a', size: 1, glow: true }); };

// the imp: flits about in nervous zig-zags; stops, lights a fire in its hand, throws it, darts off
AI.diabrete = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'cast') {
    const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k; e.facing = dx > 0 ? 1 : -1;
    if (Math.random() < dt * 30) abEmber(ecx + e.facing * 7 + rnd(-2, 2), e.y - 5 + rnd(-2, 2), rnd(-10, 10), rnd(-30, -5), 0.4);
    if (e.stateT <= 0) { fireball(ecx + e.facing * 7, e.y - 4, 150 + e.lvl * 3, e.dmg); e.state = 'throw'; e.stateT = 0.3; }
    return;
  }
  if (e.state === 'throw') { const k = Math.pow(0.1, dt); e.vx *= k; e.vy *= k; if (e.stateT <= 0) { e.state = 'walk'; e.retreat = 0.5; e.atkCD = 1.8 + Math.random() * 1; sfx.abCackle(); } return; }
  // the zig-zag: every fraction of a second it swerves to the other side of its course
  e.zigT = (e.zigT || 0) - dt;
  if (e.zigT <= 0) { e.zigT = 0.18 + Math.random() * 0.26; e.zig = -(e.zig || 1); e.zj = 0.6 + Math.random() * 0.8; }
  let tx, ty;
  if (e.retreat > 0) { e.retreat -= dt; tx = -Math.sign(dx) * 60; ty = -30; }
  else if (aggro) { const side = Math.sign(-dx) || 1; tx = dx + side * 70 + Math.cos(e.t * 0.7 + e.seed) * 30; ty = dy - 42 + Math.sin(e.t * 1.3 + e.seed) * 14; }
  else { tx = Math.cos(e.t * 0.5 + e.seed) * 50; ty = Math.sin(e.t * 0.8 + e.seed) * 24; }
  const d = Math.hypot(tx, ty) || 1, ux = tx / d, uy = ty / d, near = clamp(d / 40, 0.25, 1), sp = aggro ? 70 + e.lvl * 2 : 34;
  const wx = (ux * near - uy * e.zig * e.zj) * sp, wy = (uy * near + ux * e.zig * e.zj * 0.8) * sp, k = Math.min(1, dt * 9);
  e.vx = lerp(e.vx, wx, k); e.vy = lerp(e.vy, wy, k);
  if (aggro) e.facing = dx > 0 ? 1 : -1; else if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
  if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
  if (aggro && e.atkCD <= 0 && dist > 30 && dist < 210 && losClear(ecx, e.y, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'cast'; e.stateT = 0.6; sfx.abFlare(); }
};

// the hellhound: runs you down with its pack; crouches, then a long pounce with its jaws open
AI.caoinferno = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'crouch') {
    e.vx = approach(e.vx, 0, 1200 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) abEmber(ecx + rnd(-4, 4), e.y - 2, rnd(-8, 8), rnd(-30, -10));
    if (e.stateT <= 0) { e.state = 'pounce'; e.swingHit = false; e.vx = e.facing * clamp(Math.abs(dx) * 2.3, 150, 290); e.vy = -215; e.stateT = 1.4; sfx.abSnarl(); }
    return;
  }
  if (e.state === 'pounce') {
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (Math.random() < dt * 30) abEmber(ecx - e.facing * 6, e.y + 2, -e.vx * 0.2, rnd(-20, 0), 0.35);
    if ((e.onGround && e.stateT < 1.25) || e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; burst(ecx, e.y + e.h, 5, '#5a3024', 60, 300, 0.3); }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.9 + Math.random() * 0.7; } return; }
  if (!aggro) abWand(e, dt);
  if (aggro && !e.howled) { e.howled = true; if (dist > 50) sfx.abHowl(); }
  let dir = aggro ? (Math.abs(dx) < 10 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) e.facing = dir;
  walk(e, dt, dir, aggro ? 92 + e.lvl * 2 + (e.seed % 10) : 30, 900, 280, dy, aggro);
  if (Math.abs(e.vx) > 40 && Math.random() < dt * 6) abEmber(ecx - e.facing * 8, e.y, -e.vx * 0.1, rnd(-20, -5), 0.4);
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  const adx = Math.abs(dx);
  if (adx < 130 && Math.abs(dy) < 30 && clearPath(e, pl)) { e.state = 'crouch'; e.stateT = adx < 24 ? 0.3 : 0.45; e.facing = Math.sign(dx) || e.facing; sfx.abGrowl(); }
};

// the brute: plods; lowers its horns and charges (dazed when it hits a wall); clasps its fists and pounds the floor
const abQuakes = [];
AI.brutamontes = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'lower') {
    e.vx = approach(e.vx, 0, 800 * dt);
    if (Math.random() < dt * 16) parts.push({ x: ecx - e.facing * 4, y: e.y + e.h - 1, vx: -e.facing * rnd(20, 60), vy: rnd(-40, -10), g: 300, life: 0.4, max: 0.4, col: '#4a3a34', size: 1 });   // pawing the floor
    if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 2.2; e.swingHit = false; sfx.abRoar(); }
    return;
  }
  if (e.state === 'charge') {
    e.vx = e.facing * (190 + e.lvl * 4);
    e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.16; sfx.abStomp(); if (dist < 160) shake(1); }
    if (Math.random() < dt * 30) burst(ecx - e.facing * 8, e.y + e.h, 1, '#4a3a34', 50, 250, 0.4);
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 3, y: e.y, w: e.w + 6, h: e.h }, pl)) {
      e.swingHit = true; const r = hurtPlayer(Math.round(e.dmg * 1.2), ecx - e.facing * 8, e, false);
      if (r === 'hit') { pl.vx = e.facing * 340; pl.vy = -230; }
      if (r === 'parry') { e.state = 'stagger'; e.stateT = 1.6; e.vx = -e.facing * 40; return; }
      e.state = 'skid'; e.stateT = 0.6; return;
    }
    if (e.hitWall) { e.state = 'stagger'; e.stateT = 1.8; e.vx = -e.facing * 50; e.vy = -110; shake(4); sfx.slam && sfx.slam(); burst(ecx + e.facing * 10, e.y + 8, 14, '#3a2a26', 110, 380, 0.6); burst(ecx + e.facing * 10, e.y + 6, 6, '#e0d0aa', 80, 300, 0.4); }
    else if (e.stateT <= 0 || ledgeAhead(e, e.facing, 0, false) === 'stop') { e.state = 'skid'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'skid') { e.vx = approach(e.vx, 0, 500 * dt); if (Math.random() < dt * 30) burst(ecx + e.facing * 6, e.y + e.h, 1, '#4a3a34', 40, 250, 0.3); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; } return; }
  if (e.state === 'stagger') { e.vx = approach(e.vx, 0, 300 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.8 + Math.random() * 0.6; } return; }
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'punch'; e.stateT = 0.55; abPunch(e); } return; }
  if (e.state === 'punch') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.8; } return; }
  if (!aggro) abWand(e, dt);
  let dir = aggro ? (Math.abs(dx) < 16 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) e.facing = dir;
  walk(e, dt, dir, aggro ? 22 + e.lvl : 14, 220, 230, dy, aggro);
  if (Math.abs(e.vx) > 4 && e.onGround) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.5; sfx.abStomp(); if (dist < 120) shake(0.5); } }
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  const adx = Math.abs(dx);
  if (adx < 34 && Math.abs(dy) < 30) { e.state = 'raise'; e.stateT = 0.7; e.facing = Math.sign(dx) || e.facing; sfx.abGrunt(); }
  else if (adx > 60 && adx < 230 && Math.abs(dy) < 20 && clearPath(e, pl)) { e.state = 'lower'; e.stateT = 0.8; e.facing = Math.sign(dx) || e.facing; sfx.abSnort(); }
};
// both fists into the floor: whatever stands in front is hit, and a short shock runs along the floor both ways
function abPunch(e) {
  const ecx = e.x + e.w / 2, gy = e.y + e.h, hb = { x: e.facing > 0 ? ecx : ecx - 30, y: e.y, w: 30, h: e.h };
  shake(5); sfx.abQuake();
  let hit = false;
  if (!pl.dead && overlap(hb, pl)) { hurtPlayer(e.dmg, ecx, e, false); hit = true; }
  if (!hit && !pl.dead && pl.onGround && Math.abs(pl.x + pl.w / 2 - ecx) < 70 && Math.abs(pl.y + pl.h - gy) < 10) { const r = hurtPlayer(Math.round(e.dmg * 0.5), ecx, null, true); if (r === 'hit') pl.vy = -170; }
  abQuakes.push({ x: ecx + e.facing * 14, gy, k: 0, t: 0 });
  burst(ecx + e.facing * 14, gy - 1, 14, '#3a2a26', 100, 380, 0.5); burst(ecx + e.facing * 14, gy - 1, 8, '#ff9a2a', 80, 200, 0.4, 1, true);
}

/* the magma worm: swims through the rock out of sight; under the hero the floor glows and shakes, then it bursts out
   in an arc (breaking the floor there), lies writhing a moment, and melts back into the rock */
const AB_WDIG = new Uint8Array(NT);
for (const t of [AB_CINZA, AB_BASALTO, AB_CROSTA, AB_CARNE, AB_OSSO, AB_ENXOFRE, AB_CAOS, STONE, DEEP, DIRT]) AB_WDIG[t] = 1;
if (typeof MN_DIGGABLE !== 'undefined') for (let t = 0; t < NT; t++) if (MN_DIGGABLE[t]) AB_WDIG[t] = 1;
// natural rock it may pass: never the boss's hall, the village, iron, brick, the gate, or anything someone put there
function abwRock(tx, ty) {
  if (!AB_WDIG[tileAt(tx, ty)]) return false;
  if ((typeof abGuard === 'function' && abGuard(tx, ty)) || inVillage(tx, ty)) return false;
  return !diffs.has(ty * WW + wrapX(tx));
}
const abwBarred = (tx, ty) => (typeof abGuard === 'function' && abGuard(tx, ty)) || inVillage(tx, ty);
// a way up through the floor under the hero: a natural floor tile with room above it
function abwExit(e) {
  if (pl.dead) return null;
  const px = Math.floor((pl.x + pl.w / 2) / T); let fy = Math.floor((pl.y + pl.h + 1) / T);
  for (let k = 0; k < 4 && !solidAt(px, fy); k++) fy++;
  if (!solidAt(px, fy)) return null;
  const toward = Math.sign((e.x + e.w / 2) / T - px) || 1;
  for (const o of [0, toward, -toward, 2 * toward, -2 * toward]) { const x = px + o; if (abwRock(x, fy) && !solidAt(x, fy - 1) && !solidAt(x, fy - 2) && !abwBarred(x, fy + 1)) return { x, y: fy }; }
  return null;
}
function abwPathOk(x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8); for (let i = 0; i <= n; i++) { const t = i / Math.max(1, n); if (abwBarred(Math.floor((x0 + (x1 - x0) * t) / T), Math.floor((y0 + (y1 - y0) * t) / T))) return false; } return true; }
// on the surface it moves with its own collisions (in the rock it ignores them: ET phase)
function abwPhys(e, dt) {
  e.vx = e.mvx || 0; e.vy = Math.min((e.mvy || 0) + GRAV * dt, MAXFALL);
  moveEntity(e, dt, true);
  e.gnd = e.onGround; e.mvx = e.vx; e.mvy = e.vy; e.vx = 0; e.vy = 0;
}
const abwCentre = (e, x, y) => { e.x = x - e.w / 2; e.y = y - e.h / 2; };
function abwSinkOk(e) { const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h + 1) / T); return e.gnd && abwRock(tx, ty); }
AI.vermemagma = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, hunt = !pl.dead && dist < 230;
  if (e.state === 'walk') e.state = 'crawl';
  if (e.state === 'deep') {
    e.vx = 0; e.vy = 0; e.waitT = (e.waitT || 0) + dt;
    if (hunt && e.atkCD <= 0) {
      const X = abwExit(e);
      if (X && abwPathOk(ecx, ecy, (X.x + 0.5) * T, (X.y + 1.5) * T)) {
        const tx = (X.x + 0.5) * T, ty = (X.y + 1.5) * T, d = Math.hypot(tx - ecx, ty - ecy), sp = 110 + e.lvl * 3;
        if (d < 5) { e.state = 'rumble'; e.stateT = 0.85; e.ex = X.x; e.ey = X.y; e.sy = X.y * T; abwCentre(e, tx, (X.y + 0.5) * T); e.facing = Math.sign(dx) || e.facing; sfx.abRumble(); return; }
        const m = Math.min(d, sp * dt); abwCentre(e, ecx + (tx - ecx) / d * m, ecy + (ty - ecy) / d * m); e.facing = tx > ecx ? 1 : -1; e.waitT = 0;
        if (Math.random() < dt * 3 && rectSolid(e.x, e.y - T, e.w, T) && !rectSolid(e.x, e.y - 2 * T, e.w, T)) parts.push({ x: ecx + rnd(-6, 6), y: Math.floor(e.y / T) * T - 1, vx: rnd(-6, 6), vy: rnd(-20, -6), g: 200, life: 0.4, max: 0.4, col: '#5a4644', size: 1 });   // grit trembling on the floor above
        return;
      }
    }
    if (e.waitT > 5) {   // nowhere to strike from: come up wherever it can
      e.waitT = 0; const tx = Math.floor(ecx / T), ty = Math.floor(ecy / T);
      for (let y = ty; y > ty - 12; y--) for (const x of [tx, tx - 1, tx + 1]) if (abwRock(x, y) && !solidAt(x, y - 1) && !solidAt(x, y - 2)) { e.state = 'rumble'; e.stateT = 0.85; e.ex = x; e.ey = y; e.sy = y * T; abwCentre(e, (x + 0.5) * T, (y + 0.5) * T); sfx.abRumble(); return; }
    }
    return;
  }
  if (e.state === 'rumble') {
    e.vx = 0; e.vy = 0;
    if (Math.random() < dt * 24) { const x = (e.ex + rnd(-0.6, 1.6)) * T; parts.push({ x, y: e.sy - 1, vx: rnd(-10, 10), vy: rnd(-50, -15), g: 300, life: 0.4, max: 0.4, col: Math.random() < 0.4 ? '#ff9a2a' : '#4e4442', size: 1, glow: Math.random() < 0.4 }); }
    if (dist < 140 && Math.random() < dt * 10) shake(0.8);
    if (e.stateT <= 0) {
      if (abwRock(e.ex, e.ey)) { const t = tileAt(e.ex, e.ey); setTile(e.ex, e.ey, AIR); burst((e.ex + 0.5) * T, (e.ey + 0.5) * T, 10, PCOL[t] || '#3c3432', 110, 400, 0.6); }
      const d = Math.sign(dx) || e.facing; e.facing = d;
      e.mvx = clamp(dx * 1.1, -120, 120) || d * 60; e.mvy = -330; e.state = 'leap'; e.leapT = 0; e.swingHit = false;
      burst((e.ex + 0.5) * T, e.sy, 18, '#ff8a2a', 140, 300, 0.6, 1, true); shake(3); sfx.abBurst();
    }
    return;
  }
  if (e.state === 'leap') {
    e.leapT += dt; e.vx = 0; e.vy = 0;
    e.mvy = Math.min(e.mvy + GRAV * 0.8 * dt, MAXFALL);
    const out = e.leapT > 0.18;
    const nx = e.x + e.mvx * dt; if (out && rectSolid(nx, e.y, e.w, e.h)) e.mvx = 0; else e.x = nx;
    const ny = e.y + e.mvy * dt;
    if (out && rectSolid(e.x, ny, e.w, e.h)) {
      if (e.mvy < 0) e.mvy = 0;
      else {   // landed: settle on top (or, if it came down in rock, just melt back in)
        e.y = ny; let k = 0; while (k < 2 * T && rectSolid(e.x, e.y, e.w, e.h)) { e.y -= 1; k++; }
        if (rectSolid(e.x, e.y, e.w, e.h)) { e.state = 'deep'; e.atkCD = 1.2; return; }
        e.state = 'exposed'; e.stateT = 1.8; e.mvx = 0; e.mvy = 0; e.atkCD = 0.5; shake(2); burst(ecx, e.y + e.h, 10, '#ff8a2a', 90, 300, 0.4, 1, true); sfx.abSizzle();
      }
    } else e.y = ny;
    if (Math.random() < dt * 40) abEmber(ecx + rnd(-6, 6), ecy + rnd(-3, 3), rnd(-20, 20) - e.mvx * 0.2, rnd(-20, 20) - e.mvy * 0.2, 0.5);
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y - 3, w: e.w + 4, h: e.h + 6 }, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') pl.vy = Math.min(pl.vy, -240); }
    if (e.y > (WH - 6) * T) { e.state = 'deep'; e.atkCD = 1; }
    return;
  }
  abwPhys(e, dt);
  if (e.state === 'exposed' || e.state === 'bite') {
    e.mvx = approach(e.mvx, 0, 600 * dt);
    if (e.state === 'bite') {
      if (!e.swingHit && !pl.dead && overlap({ x: e.facing > 0 ? ecx : ecx - 22, y: e.y - 3, w: 22, h: e.h + 6 }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
      if (e.stateT <= 1.0) e.state = 'exposed';
    } else if (aggro && e.atkCD <= 0 && Math.abs(dx) < 30 && Math.abs(dy) < 16) { e.facing = Math.sign(dx) || e.facing; e.state = 'bite'; e.swingHit = false; e.mvx = e.facing * 130; e.atkCD = 1.1; e.stateT = Math.max(e.stateT, 1.35); sfx.abSizzle(); }
    if (Math.random() < dt * 6) abEmber(ecx + rnd(-8, 8), e.y + 2, rnd(-6, 6), rnd(-25, -8));
    if (e.stateT <= 0) { if (abwSinkOk(e)) { e.state = 'sink'; e.stateT = 0.5; e.sy = Math.floor((e.y + e.h + 1) / T) * T; sfx.abSizzle(); } else { e.state = 'crawl'; e.stateT = 1.4; } }
    return;
  }
  if (e.state === 'sink') {
    e.mvx = 0;
    if (Math.random() < dt * 30) burst(ecx, e.y + e.h, 1, '#ff8a2a', 50, 300, 0.4, 1, true);
    if (e.stateT <= 0) { e.state = 'deep'; e.atkCD = 0.6 + Math.random() * 0.8; e.waitT = 0; abwCentre(e, ecx, e.sy + T * 1.5); }
    return;
  }
  // crawling on the surface (spawned there, or nowhere to sink): looks for natural rock to melt into
  if (!aggro) abWand(e, dt);
  const dir = aggro ? (Math.sign(dx) || 1) : e.wander;
  if (dir) e.facing = dir;
  e.mvx = approach(e.mvx || 0, dir * (aggro ? 30 : 16), 300 * dt);
  if (e.gnd && e.hitWall) e.mvy = -180;
  if (e.stateT <= 0 && abwSinkOk(e) && (aggro || Math.random() < dt * 0.3)) { e.state = 'sink'; e.stateT = 0.5; e.sy = Math.floor((e.y + e.h + 1) / T) * T; sfx.abSizzle(); }
};

// the lost soul: drifts through walls toward you; a long scream that leaves you slow; a touch that drains your life into it
let abSlowT = 0;
const abWails = [];
AI.almapenada = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.scrCD = (e.scrCD === undefined ? 1.5 : e.scrCD) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  const hunt = !pl.dead && (aggro || dist < 150);
  if (e.state === 'wail') {
    const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k; e.facing = dx > 0 ? 1 : -1;
    if (Math.random() < dt * 20) parts.push({ x: ecx + rnd(-6, 6), y: ecy + rnd(-8, 4), vx: rnd(-8, 8), vy: rnd(-16, -4), g: 0, life: 0.5, max: 0.5, col: '#b8b0b8', size: 1 });
    if (e.stateT <= 0) {
      e.state = 'scream'; e.stateT = 0.6; sfx.abWail(); shake(2);
      abWails.push({ x: ecx + e.facing * 2, y: e.y + 2, r: 4, t: 0 });
      if (!pl.dead && dist < 140 && !(typeof lgFirmeOn === 'function' && lgFirmeOn()) && !(pl.lg && pl.lg.firme)) { abSlowT = Math.max(abSlowT, 2.6); floatText(pl.x + pl.w / 2, pl.y - 8, 'LENTO', '#c8bcc0', 0.8); }
    }
    return;
  }
  if (e.state === 'scream') { e.vx *= Math.pow(0.1, dt); e.vy *= Math.pow(0.1, dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); } return; }
  if (e.state === 'reach') { const k = Math.pow(0.03, dt); e.vx *= k; e.vy *= k; e.facing = dx > 0 ? 1 : -1; if (e.stateT <= 0) { e.state = 'drain'; e.stateT = 0.5; e.swingHit = false; const d = dist || 1; e.vx = dx / d * 150; e.vy = dy / d * 150; sfx.abDrainGo(); } return; }
  if (e.state === 'drain') {
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y, w: e.w + 4, h: e.h }, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { const h = Math.max(1, Math.round(e.dmg * 0.8)); e.hp = Math.min(e.maxHp, e.hp + h); floatText(ecx, e.y - 6, '+' + h, '#c8a0a0', 0.8); sfx.abDrain(); for (let k = 0; k < 8; k++) parts.push({ x: pl.x + pl.w / 2 + rnd(-4, 4), y: pl.y + rnd(4, 14), vx: (ecx - pl.x) * 2, vy: (ecy - pl.y - 8) * 2, g: 0, life: 0.45, max: 0.45, col: '#e05050', size: 1, glow: true }); }
    }
    e.vx *= Math.pow(0.15, dt); e.vy *= Math.pow(0.15, dt);
    if (e.stateT <= 0) { e.state = 'walk'; e.retreat = 0.9; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  let tx, ty;
  if (e.retreat > 0) { e.retreat -= dt; tx = -Math.sign(dx) * 50; ty = -24; }
  else if (hunt) { tx = dx + Math.cos(e.t * 0.9 + e.seed) * 16; ty = dy - 4 + Math.sin(e.t * 1.4 + e.seed) * 10; }
  else { tx = Math.cos(e.t * 0.35 + e.seed) * 50; ty = Math.sin(e.t * 0.6 + e.seed) * 20; }
  const d = Math.hypot(tx, ty) || 1, sp = hunt ? 34 + e.lvl * 1.5 : 14, k = Math.min(1, dt * 1.6);
  e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
  if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
  if (Math.random() < dt * 8) parts.push({ x: ecx + rnd(-3, 3) - e.facing * 3, y: e.y + e.h + rnd(0, 6), vx: rnd(-4, 4) - e.vx * 0.3, vy: rnd(-6, 2), g: 0, life: 0.8, max: 0.8, col: Math.random() < 0.6 ? '#6a626e' : '#a8a0a8', size: 1 });
  if (!hunt || e.atkCD > 0 || pl.dead) return;
  if (dist < 30) { e.state = 'reach'; e.stateT = 0.4; sfx.abMoan(); }
  else if (e.scrCD <= 0 && dist < 120) { e.state = 'wail'; e.stateT = 0.8; e.scrCD = 7 + Math.random() * 3; sfx.abMoan(); }
};

/* ---------- blows, the pack, the effects ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead) {
    if (e.type === 'vermemagma' && (e.state === 'deep' || e.state === 'rumble' || e.state === 'sink')) return;   // in the rock, out of reach
    if (e.type === 'vermemagma' && e.state === 'exposed') mult *= 1.3;
    if (e.type === 'brutamontes' && e.state === 'stagger') mult *= 1.6;
  }
  const st = e && e.state, r = _hit(e, dir, mult, melee);
  if (e && !e.dead) {
    if (e.type === 'vermemagma') { e.stun = 0; e.mvx = (e.mvx || 0) + dir * 40; e.vx = 0; e.vy = 0; }   // heavy, and its own physics
    if (e.type === 'brutamontes' && (st === 'charge' || st === 'raise' || st === 'punch' || st === 'lower')) { e.stun = 0; e.vx = st === 'charge' ? e.facing * (190 + e.lvl * 4) : 0; }   // too big to stagger mid-attack
  }
  return r;
}; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp(dmg, srcX, src, isProj);
  if (src && (r === 'block' || r === 'parry')) {
    if (src.type === 'vermemagma') { src.vx = 0; src.vy = 0; src.stun = 0; }
    else if (src.type === 'caoinferno' && src.state === 'pounce') { src.state = 'recover'; src.stateT = r === 'parry' ? 1.2 : 0.5; }
    else if (src.type === 'almapenada') { src.state = 'walk'; src.retreat = 1; }
  }
  return r;
}; }
// hellhounds come in packs of two or three (a summoner sets spawnEnemy.pack to get just one)
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'caoinferno' && !spawnEnemy.pack) {
    spawnEnemy.pack = true;
    try { const n = 1 + (Math.random() < 0.5 ? 1 : 0); for (let k = 1; k <= n; k++) { const x = px - Math.sign(pl.x - px || 1) * k * 18; if (!rectSolid(x, py, e.w, e.h)) { const o = spawnEnemy('caoinferno', x, py, zone); if (o) o.lvl = e.lvl; } } } finally { spawnEnemy.pack = false; }
  }
  if (e && type === 'vermemagma') { e.state = 'crawl'; e.mvx = 0; e.mvy = 0; e.stateT = 0.6; }
  return e;
}; }
// the scream's slowness (only when nothing else already slows the hero)
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (abSlowT <= 0 || (typeof cvSlowT !== 'undefined' && cvSlowT > 0) || (typeof icSlowT !== 'undefined' && icSlowT > 0)) return _up(dt);
  const s = pl.spd; pl.spd = (1 + s) * 0.5 - 1; try { return _up(dt); } finally { pl.spd = s; }
}; }
function abdUpdate(dt) {
  if (abSlowT > 0) { abSlowT -= dt; if (pl.dead || (pl.lg && pl.lg.firme)) abSlowT = 0; }
  for (let i = abWails.length - 1; i >= 0; i--) { const w = abWails[i]; w.t += dt; w.r += 160 * dt; if (w.t > 0.7) abWails.splice(i, 1); }
  // the floor shock: dust and sparks running out both ways from the brute's fists
  for (let i = abQuakes.length - 1; i >= 0; i--) {
    const q = abQuakes[i]; q.t += dt;
    while (q.k < 5 && q.t > q.k * 0.05) { q.k++; for (const d of [-1, 1]) { const x = q.x + d * q.k * 13; burst(x, q.gy - 1, 3, '#4a3a34', 60, 300, 0.45); burst(x, q.gy - 1, 1, '#ff9a2a', 50, 200, 0.35, 1, true); } }
    if (q.k >= 5) abQuakes.splice(i, 1);
  }
}
HOOK.update.push(abdUpdate);
HOOK.drawTop.push((cx, cy) => {
  // the floor glowing and splitting where the worm will come out
  for (const e of enemies) {
    if (e.dead || e.type !== 'vermemagma' || e.state !== 'rumble') continue;
    const t = clamp(1 - e.stateT / 0.85, 0, 1), x0 = Math.round(e.ex * T) - cx, y0 = Math.round(e.sy) - cy, j = Math.round(Math.sin(gameTime * 60) * t);
    lc.fillStyle = t > 0.6 && Math.floor(gameTime * 20) % 2 ? '#fff4c8' : '#ff9a2a';
    const n = 3 + Math.round(t * 4);
    for (let k = 0; k < n; k++) { const s = (k * 37) % 11, x = x0 - 6 + Math.round((k / n) * (T + 12)) + j; lc.fillRect(x, y0 + (s % 2), 2, 1); if (k % 2) lc.fillRect(x + 1, y0 + 1 + (s % 3), 1, 1 + Math.round(t * 2)); }
  }
  // the scream's rings
  for (const w of abWails) { const a = 1 - w.t / 0.7; lc.strokeStyle = `rgba(200,188,192,${(a * 0.45).toFixed(3)})`; lc.lineWidth = 1; lc.beginPath(); lc.ellipse(Math.round(w.x) - cx, Math.round(w.y) - cy, w.r, w.r * 0.7, 0, 0, Math.PI * 2); lc.stroke(); }
  // pale hands clinging to the slowed hero
  if (abSlowT > 0 && !pl.dead) {
    const a = Math.min(1, abSlowT * 1.5), x = Math.round(pl.x + pl.w / 2) - cx, y = Math.round(pl.y) - cy;
    for (let k = 0; k < 4; k++) { const ang = gameTime * 2.4 + k * 1.57, px = Math.round(x + Math.cos(ang) * 7), py = Math.round(y + 10 + Math.sin(ang) * 9); lc.fillStyle = `rgba(200,188,192,${(a * 0.6).toFixed(3)})`; lc.fillRect(px, py, 1, 2); lc.fillRect(px - 1, py + 2, 3, 1); }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = ABD.GL;
  for (const e of enemies) {
    if (e.dead) continue;
    const x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy;
    if (e.type === 'diabrete') { if (e.state === 'cast') { lc.globalAlpha = 0.75 + Math.sin(gameTime * 30) * 0.2; lc.drawImage(G.hand, x + e.facing * 7 - 16, e.y - cy - 4 - 16); } else { lc.globalAlpha = 0.3; lc.drawImage(G.fire, x - 10, y - 10); } }
    else if (e.type === 'caoinferno') { lc.globalAlpha = e.state === 'crouch' ? 0.75 : 0.45; lc.drawImage(G.fire, x + e.facing * 3 - 10, e.y - cy - 2 - 10); }
    else if (e.type === 'brutamontes') { lc.globalAlpha = 0.3; lc.drawImage(G.ember, x + e.facing * 3 - 6, y - 4 - 6); }
    else if (e.type === 'vermemagma') {
      if (e.state === 'deep') continue;
      if (e.state === 'rumble') { const t = clamp(1 - e.stateT / 0.85, 0, 1); lc.globalAlpha = 0.3 + t * 0.6; lc.drawImage(G.big, (e.ex + 0.5) * T - cx - 30, e.sy - cy - 30); continue; }
      lc.globalAlpha = e.state === 'leap' ? 0.55 : 0.28; lc.drawImage(G.lava, x - 18, y - 18);
    }
    else if (e.type === 'almapenada') { lc.globalAlpha = e.state === 'wail' || e.state === 'scream' ? 0.6 : 0.3; lc.drawImage(G.soul, x - 12, y - 12); lc.globalAlpha = 0.5; lc.drawImage(G.ember, x + e.facing - 6, y - 2 - 6); }
  }
  lc.globalAlpha = 1;
});
function clearAbdFx() { abQuakes.length = 0; abWails.length = 0; abSlowT = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { abdLate(); clearAbdFx(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  abCackle() { for (let k = 0; k < 3; k++) tone(900 + k * 120, 0.05, 'square', 0.02, -300, k * 0.07); },
  abFlare() { noise(0.35, 0.06, 1200, 'bandpass', 0, 1.5); tone(220, 0.35, 'sawtooth', 0.025, 260); },
  abHowl() { tone(330, 0.8, 'sawtooth', 0.025, 180); tone(495, 0.7, 'triangle', 0.02, 140, 0.05); noise(0.6, 0.03, 900, 'bandpass', 0, 2); },
  abGrowl() { tone(85, 0.35, 'sawtooth', 0.04, -10); noise(0.35, 0.05, 400, 'lowpass', 0, 2); },
  abSnarl() { noise(0.18, 0.08, 1400, 'bandpass', 0, 1.2); tone(160, 0.15, 'sawtooth', 0.04, -80); },
  abSnort() { noise(0.25, 0.08, 500, 'lowpass', 0, 2); noise(0.2, 0.07, 600, 'lowpass', 0.3, 2); noise(0.2, 0.07, 600, 'lowpass', 0.55, 2); },
  abRoar() { noise(0.7, 0.12, 320, 'lowpass', 0, 1.4); tone(75, 0.7, 'sawtooth', 0.06, -25); tone(110, 0.6, 'square', 0.02, -40, 0.05); },
  abGrunt() { tone(95, 0.3, 'sawtooth', 0.05, -30); noise(0.25, 0.06, 350, 'lowpass'); },
  abStomp() { tone(48, 0.2, 'sine', 0.07, -15); noise(0.14, 0.05, 260, 'lowpass'); },
  abQuake() { noise(0.45, 0.18, 200, 'lowpass'); tone(55, 0.4, 'sine', 0.1, -25); noise(0.2, 0.06, 2200, 'highpass', 0.05); },
  abRumble() { noise(0.9, 0.08, 140, 'lowpass', 0, 1); tone(40, 0.9, 'sine', 0.06, 20); },
  abBurst() { noise(0.4, 0.14, 500, 'lowpass'); noise(0.5, 0.06, 1800, 'bandpass', 0.05, 0.8); tone(120, 0.3, 'sawtooth', 0.04, -70); },
  abSizzle() { noise(0.35, 0.05, 3600, 'highpass'); },
  abMoan() { tone(260, 0.6, 'sine', 0.025, -60); tone(266, 0.6, 'sine', 0.02, -70, 0.05); },
  abWail() { tone(700, 0.9, 'sawtooth', 0.03, 500); tone(1050, 0.8, 'triangle', 0.02, 700, 0.05); noise(0.8, 0.04, 2400, 'bandpass', 0, 3); },
  abDrainGo() { noise(0.2, 0.05, 900, 'bandpass', 0, 2); },
  abDrain() { tone(500, 0.35, 'sine', 0.03, -350); tone(250, 0.35, 'triangle', 0.02, -150, 0.05); }
});
