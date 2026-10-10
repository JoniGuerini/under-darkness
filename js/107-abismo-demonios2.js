'use strict';

/* ================= the demons of the abyss, part two =================
   The other five (106 has the first five), each with its own way of moving:
   - the flesh crawler, a skinless thing of too many limbs that runs on floors, walls and roofs; it stops on the
     roof right over you, clicks, and lets go on top of you;
   - the possessed cultist, a robed man with something else looking out of his hood: he vanishes in a puff and
     comes back somewhere else near you, draws a burning circle under your feet and a column of fire rises from it;
   - the infernal gargoyle, that hangs from the roof like one more carving (no glow, no eyes) until you walk under
     it; then it cracks loose, swoops down through you in a long arc and flies back up to hang again;
   - the plague swarm, one creature made of a cloud of flies that spreads out and pulls together; it drifts after
     you, gathers tight, and wraps around you: poison (the fungus's poison from 76, so the elixir resists it);
     few hits kill it;
   - the lava salamander, that swims in the lava with only its back showing (lava doesn't hurt it), surfaces,
     leaps out at you and spits globs of magma; on dry rock it walks slowly back to the lava, spitting.
   The cathedral already has a `gargula`: this one is `gargulainf`.
   Same brush as 55 (cp, ramps, outline, cache). Loads after 106 and before 49 (BAL). */

/* ---------- stats ---------- */
Object.assign(ET, {
  rastejador: { name: 'Rastejador de Carne', w: 16, h: 10, hp: 84, dmg: 20, xp: 34, kb: 0.6, fly: true, crawl: true, blood: '#9a1a1a' },   // fly: no gravity from the loop; it falls on its own
  cultista: { name: 'Cultista Possuído', w: 9, h: 21, hp: 88, dmg: 22, xp: 38, kb: 0.5, fly: false, blood: '#6a0f14' },
  gargulainf: { name: 'Gárgula Infernal', w: 14, h: 14, hp: 150, dmg: 24, xp: 44, kb: 0.2, fly: true, blood: '#5a5450' },
  moscas: { name: 'Enxame da Pestilência', w: 16, h: 14, hp: 26, dmg: 12, xp: 26, kb: 1.4, fly: true, blood: '#1c2410' },
  salamandra: { name: 'Salamandra de Lava', w: 22, h: 9, hp: 120, dmg: 22, xp: 40, kb: 0.35, fly: true, blood: '#ff7a2a' }   // fly: gravity of its own, none while it swims
});
const AB2_TYPES = ['rastejador', 'cultista', 'gargulainf', 'moscas', 'salamandra'];

/* ---------- materials ---------- */
Object.assign(ICON_ART, {
  demonEye: [["..rrrrr..", ".rWvWWWr.", "rWWOOOWWr", "rWOOkOOvr", "rvOOkOOWr", "rWWOOOWWr", ".rWWWvWr.", "..rrrrr.."], { r: '#4a0808', W: '#e4d2b4', v: '#b83a2a', O: '#ff8a1a', k: '#140202' }]
});
Object.assign(ITEMS, {
  olho_demonio: { name: 'Olho de Demônio', rar: 2, stack: 99, icon: 'demonEye', desc: 'Ainda segue você com o olhar. Material.' }
});
if (typeof MAT_VAL !== 'undefined') MAT_VAL.olho_demonio = 22;
// the blocks' items (104), the infernite (110) and the other new materials come from files that load later:
// the tables are filtered when a world starts, once everything is defined
const AB2_DROPS = {
  rastejador: [['carne_viva', 0.6, 1, 2], ['osso', 0.45, 1, 2], ['essencia_demoniaca', 0.15], ['chifre', 0.1], ['pocao', 0.08], ['min_infernita', 0.06], ['grevas_demonio', 0.015]],
  cultista: [['olho_demonio', 0.3], ['essencia_demoniaca', 0.35], ['enxofre', 0.3, 1, 2], ['cinza', 0.3, 1, 2], ['pocao', 0.14], ['min_infernita', 0.08], ['elmo_chifres', 0.02], ['lamina_infernal', 0.004]],
  gargulainf: [['cinza', 0.5, 1, 3], ['chifre', 0.35], ['asa_couro', 0.3], ['po_gargula', 0.2], ['min_infernita', 0.12, 1, 2], ['pocao', 0.08], ['elmo_chifres', 0.025], ['machado_chifre', 0.02]],
  moscas: [['carne_viva', 0.3], ['osso', 0.25], ['enxofre', 0.2], ['pocao', 0.06], ['min_infernita', 0.04]],
  salamandra: [['enxofre', 0.45, 1, 2], ['olho_demonio', 0.12], ['cinza', 0.3, 1, 2], ['presa', 0.2], ['min_infernita', 0.15, 1, 2], ['pocao', 0.1], ['grevas_demonio', 0.02], ['machado_chifre', 0.015]]
};
function ab2Tables() {
  for (const k of AB2_TYPES) DROPS[k] = AB2_DROPS[k].filter(([id]) => ITEMS[id]);
  if (typeof DMG_KIND !== 'undefined') Object.assign(DMG_KIND, { moscas: 'veneno', salamandra: 'fogo' });   // 101 loads later
}
ab2Tables();
Object.assign(NAV_WALKERS, { cultista: 1, salamandra: 1 });
Object.assign(CV_STEP, { cultista: 1, salamandra: 1 });

/* ================= art ================= */
const AB2 = {};
{
const { RB, cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RA = {
  musc: R7(['#1a0406', '#320a0c', '#4e1214', '#6e1c1c', '#902a26', '#b0423a', '#cc6656']),     // skinned muscle
  tend: R7(['#24140e', '#3e241a', '#5c3828', '#7e5038', '#a06c4c', '#c08e68', '#dcb490']),     // sinew and fat
  osso: RB.osso,
  fogo: R7(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),
  boca: R7(['#0a0202', '#160404', '#240808', '#340c0c', '#461212', '#5a1a1a', '#702424']),
  manto: R7(['#0a0305', '#150609', '#230a0f', '#341016', '#48161e', '#5e1e28', '#762a34']),
  faixa: R7(['#1e1404', '#36240a', '#563a10', '#7a5418', '#a07222', '#c4942e', '#e2b848']),    // tarnished gold
  pele: R7(['#141010', '#261e1c', '#3c302c', '#56463e', '#725c50', '#8e7464', '#ac907c']),     // dead grey skin
  veia: R7(['#100410', '#200820', '#341034', '#4a1a46', '#62285a', '#7c3a70', '#985088']),
  chifre: R7(['#0e0a08', '#1e1610', '#32261c', '#4a3a2a', '#665240', '#846c56', '#a48a72']),
  pedra: R7(['#100e0e', '#201d1b', '#332f2c', '#4a4540', '#635d56', '#7f776e', '#a0978b']),
  pedraE: R7(['#080707', '#121010', '#1c1918', '#282422', '#36312d', '#463f3a', '#574f48']),
  mosca: R7(['#040604', '#0a0e08', '#121a0e', '#1c2814', '#28381c', '#3a4e26', '#506a32']),
  asaM: R7(['#3a3e40', '#50565a', '#687074', '#828a8e', '#9ca4a6', '#b8bec0', '#d4dad8']),
  sal: R7(['#0a0303', '#170606', '#270b08', '#3a120c', '#501c10', '#6a2814', '#86361a']),
  salB: R7(['#3a1004', '#5e1e06', '#86300a', '#b04a10', '#d4681a', '#ec8e2e', '#fcb850'])
};

/* the flesh crawler, 26 x 14 facing right, feet down: 0-1 crawling, 2 coiled to drop (mouth open), 3 dropping
   (every limb reaching down), 4 slashing */
function crawler(pose) {
  const W = 26, H = 14, P = cp(W, H), s = 12101 + pose * 7, aim = pose === 2, fall = pose === 3, slash = pose === 4, ph = pose === 1 ? 1 : -1;
  const by = aim ? 9 : fall ? 6 : 8.4;   // the body slung low between the knees
  const hips = [7, 10.4, 13.8, 17.2];
  const limb = (i, far) => {
    const back = i < 2 ? -1 : 1, hx = hips[i] + (far ? -back * 0.8 : 0), hy = by - 0.6, o = ((i + (far ? 1 : 0)) % 2 ? 1 : -1) * ph;
    let kx, ky, fx, fy;
    if (fall) { const sp = i === 0 || i === 3 ? 1 : 0; kx = hx + back * (2.4 + sp * 2.2); ky = by - 2.6 - sp * 1.6 + (far ? 1 : 0); fx = hx + back * (4.6 + sp * 2.6); fy = by + 2.6 + (1 - sp) * 3.4; }   // limbs flung wide, the middle hands reaching down
    else if (aim) { kx = hx + back * 3.2; ky = 2.6 + (far ? 0.8 : 0); fx = hx + back * 5.4; fy = H - 1; }   // coiled, elbows high
    else if (slash && i === 3 && !far) { kx = hx + 3.4; ky = by - 5.4; fx = hx + 7.4; fy = by - 2.4; }
    else { kx = hx + back * 2.8 + o * 0.8; ky = 0.8 + (far ? 1 : 0) + (o > 0 ? 0.8 : 0); fx = hx + back * 4.4 + o * 1.8; fy = H - 1 - (o > 0 ? 0.8 : 0); }
    const v = far ? 1.4 : 3.2;
    P.line(hx, hy, kx, ky, RA.musc, v); P.line(hx - back * 0.6, hy - 0.2, kx - back * 0.4, ky + 0.2, RA.musc, v + (far ? 0.4 : 1.8));   // a thick upper arm, its top edge wet
    P.line(kx, ky, fx, fy, RA.musc, v - 0.2);
    P.put(kx, ky, RA.tend, far ? 2.4 : 4.8); P.put(kx, ky - 1, RA.osso, far ? 2 : 5);   // the elbow, a bone through it
    P.put(fx + back * 0.8, fy, RA.osso, far ? 2.2 : 5.2); P.put(fx - back * 0.4, fy, RA.osso, far ? 1.8 : 4.2);   // claws
  };
  for (let i = 0; i < 4; i++) limb(i, true);
  P.line(5.4, by, 1.4, by + 1.8 + ph * 0.4, RA.musc, 2.4); P.put(0.8, by + 2.2, RA.osso, 4);   // a stump of tail
  // the body: a lump of raw, wet muscle, the grain running across it
  P.blob(12.2, by, 7.6, 2.8, RA.musc, s, 3.2, (x, y, dx, dy) => ((x * 2 + y * 3) % 5 === 0 ? -1.2 : 0) + (dy < -0.3 && hash2(x, y, s) < 0.07 ? 1.4 : 0) + (dy > 0.5 ? -0.9 : 0));
  for (let x = 6; x <= 18; x++) P.put(x, by + 1.4 + Math.sin(x * 0.9) * 0.5, RA.tend, 2 + (x % 3 === 0 ? 1.2 : 0));   // a band of fat and sinew
  for (const [x, y] of [[8.4, by - 0.6], [15.6, by + 0.2]]) { P.put(x, y, RA.veia, 4.4); P.put(x + 1, y + 0.6, RA.veia, 3.2); }
  for (const x of [7.4, 10.2, 13, 15.8]) { P.put(x, by - 2.8, RA.osso, 5.6); P.put(x + 1, by - 2.8, RA.osso, 4.4); P.put(x + 0.5, by - 2, RA.osso, 3); }   // the spine, knob by knob
  for (const x of [11.2, 13.6]) P.line(x, by - 1.4, x + 0.8, by + 0.8, RA.osso, 4);   // two ribs through the meat
  // the head: a bare skull, no lips, one burning eye
  const hx = aim ? 21.8 : slash ? 22.2 : 21.4, hy = by - (aim ? 1.6 : 0.8), open = aim || fall || slash;
  P.blob(hx - 0.4, hy + 0.6, 3, 2.4, RA.musc, s + 3, 3.4);
  P.blob(hx + 0.2, hy - 0.6, 2.6, 1.8, RA.osso, s + 4, 3.8, (x, y) => hash2(x, y, s) < 0.15 ? -1 : 0);
  P.put(hx + 0.8, hy - 0.2, RA.boca, 0.4); P.put(hx + 1.8, hy - 0.2, RA.fogo, 5.6); P.put(hx + 1.8, hy - 1, RA.osso, 2.4);
  const jy = hy + 1.4;
  for (let x = hx - 0.4; x <= hx + 3.6; x++) P.put(x, jy, RA.osso, 5.4 - (x > hx + 2 ? 0.8 : 0));
  if (open) { for (let x = hx; x <= hx + 3.4; x++) { P.put(x, jy + 1, RA.boca, 1.2); P.put(x, jy + 2.2, RA.osso, 4.6); } P.put(hx + 3.8, jy + 2, RA.osso, 4); }
  else for (let x = hx + 0.4; x <= hx + 3; x += 2) P.put(x, jy + 1, RA.osso, 3.6);
  for (let i = 0; i < 4; i++) limb(i, false);
  return set(P.done());
}

/* the possessed cultist, 18 x 26 facing right: 0 still, 1-2 walking, 3 casting (both hands up, burning),
   4 twisting (the thing inside pulls at him: vanishing, coming back) */
function cultist(pose) {
  const W = 18, H = 26, P = cp(W, H), s = 12201 + pose * 3, sw = pose === 1 ? 1 : pose === 2 ? -1 : 0, cast = pose === 3, tw = pose === 4;
  const lean = tw ? -1.2 : 0;
  // the robe: a bell of heavy cloth, folds running down, a ragged hem that sways
  for (let y = 9; y < H; y++) {
    const t = (y - 9) / (H - 9), half = 2.6 + t * 4.4, cx = 8.6 + lean * (1 - t) + sw * t * 0.6;
    for (let x = Math.floor(cx - half); x <= cx + half; x++) {
      const u = (x + 0.5 - (cx - half)) / (2 * half);
      if (y >= H - 2 && hash2(x, y + sw, s) < 0.45) continue;
      const fold = ((x + Math.round(t * 2 * sw)) % 3 === 0) ? -1 : 0;
      P.put(x, y, RA.manto, 4.8 - u * 2.6 - t * 0.5 + fold * 1.2 + cg(x, y, s) * 0.6 + (y >= H - 4 && y < H - 2 ? 0 : 0));
    }
  }
  for (let y = 15; y < H - 2; y++) P.put(9 + sw * (y - 9) / 17 * 0.6, y, RA.boca, 1.4);   // the split in the front of the robe
  for (let x = 2; x < 16; x++) if (!(hash2(x, H - 3 + sw, s) < 0.45)) P.put(x + sw * 0.6, H - 3, RA.faixa, 2.4 + (x % 3 === 0 ? 1.2 : 0) - (x - 2) * 0.08);   // a frayed gold hem
  for (let x = 6; x <= 11.6; x++) P.put(x + lean * 0.6, 14.2, RA.faixa, 2.4 + (x === 8 ? 1.6 : 0));   // a cord belt
  // the chest: a sigil burned through the cloth
  const sx = 9.4 + lean * 0.7, sy = 11.6;
  P.put(sx, sy, RA.fogo, 5.6); P.put(sx - 1, sy + 1, RA.fogo, 3.6); P.put(sx + 1, sy + 1, RA.fogo, 3.6); P.put(sx, sy - 1, RA.fogo, 4); P.put(sx, sy + 1.6, RA.fogo, 3);
  // arms
  if (cast) {
    for (const [ax, hx, hy, v] of [[6.6, 4.4, 1.6, 2.4], [11, 13.6, 1.4, 3.8]]) {
      P.line(ax, 10, hx, hy + 2.4, RA.manto, v); P.line(ax + 0.6, 10, hx + 0.6, hy + 2.6, RA.manto, v - 0.6);   // sleeves fallen back
      P.line(hx, hy + 2.6, hx, hy, RA.pele, v + 1); P.put(hx - 0.8, hy - 0.6, RA.pele, v + 0.6); P.put(hx + 0.8, hy - 0.8, RA.pele, v + 0.8);   // claws spread
      P.put(hx, hy - 1.4, RA.fogo, 6); P.put(hx - 0.6, hy - 2.2, RA.fogo, 4.4); P.put(hx + 0.6, hy - 2.6, RA.fogo, 5);   // fire in the palms
    }
  } else if (tw) {
    P.line(6, 10, 2.6, 13, RA.manto, 2.6); P.line(2.6, 13, 1.6, 11, RA.pele, 3.6);
    P.line(11, 10, 15.4, 8, RA.manto, 3.6); P.line(15.4, 8, 16.6, 6.4, RA.pele, 4.4); P.put(17, 7.2, RA.pele, 3.6);
  } else {
    P.line(6.6, 10, 5.4 - sw * 0.6, 16, RA.manto, 2.4); P.put(5.4 - sw * 0.6, 16.6, RA.pele, 3);
    P.line(10.8, 10, 12.2 + sw * 0.6, 15.6, RA.manto, 3.6); P.line(12.2 + sw * 0.6, 15.6, 12.6 + sw * 0.6, 17, RA.pele, 4.2); P.put(13.4 + sw * 0.6, 17.4, RA.pele, 3.4);   // a long grey hand
  }
  // the hood, and what is inside it
  const hx = 9.2 + lean * 1.6 + (tw ? -0.6 : 0), hy = 5.8 + (tw ? 0.6 : 0);
  P.blob(hx, hy, 3.8, 4.2, RA.manto, s + 1, 3.6, (x, y, dx, dy) => (dy > 0.5 ? -0.8 : 0) + (hash2(x, y, s + 1) < 0.1 ? -0.8 : 0));
  for (let y = hy - 1.6; y <= hy + 2.6; y++) for (let x = hx + 0.2; x <= hx + 3.2; x++) P.put(x, y, RA.boca, 0.6 + (x - hx) * 0.2);   // the shadow under the hood
  P.blob(hx + 2, hy + 0.6, 1.4, 2, RA.pele, s + 2, tw ? 2.4 : 2.8);   // a face, half in the dark
  P.put(hx + 2.2, hy - 0.2, RA.fogo, 6.2); P.put(hx + 3.2, hy - 0.2, RA.fogo, 5);   // the eyes of the thing inside
  P.line(hx + 1.6, hy + 1.8, hx + 3.2, hy + 2.2, RA.boca, 0.2); P.put(hx + 2.4, hy + 2.2, RA.osso, 4.8); P.put(hx + 3, hy + 2.4, RA.osso, 4);   // a grin with too many teeth
  P.put(hx + 2.8, hy + 1, RA.veia, 4.2); P.put(hx + 1.6, hy + 0.4, RA.veia, 3.2);
  // horns through the hood
  P.line(hx - 0.6, hy - 3, hx - 2.6, hy - 5.4, RA.chifre, 4.4); P.put(hx - 3, hy - 5.6, RA.chifre, 5.6); P.put(hx - 3.4, hy - 4.8, RA.chifre, 3.4);
  P.line(hx + 1.2, hy - 3.4, hx + 0.6, hy - 5.6, RA.chifre, 5); P.put(hx + 0.2, hy - 5.6, RA.chifre, 6);
  return set(P.done());
}

/* the infernal gargoyle, 24 x 20 facing right. Stone: 0 crouched (hung upside down from the roof it is a carving
   like any other; no glow, cracks dark). Awake (the cracks burn): 1 cracking loose, 2 wings up, 3 wings down,
   4 diving (wings swept back, claws out) */
function gargoyle(pose) {
  const W = 24, H = 20, P = cp(W, H), s = 12301 + pose * 5, stone = pose === 0, dive = pose === 4, wake = pose === 1;
  // chiselled stone lit from the top left; a few cracks run through it, dark in the statue, burning once it wakes
  const body = (cx, cy, rx, ry, ss, base, nc = 2) => {
    const inside = (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
      const facet = dy < -0.4 ? 0.9 : dx < -0.45 ? 0.4 : dy > 0.45 ? -1 : 0;
      P.put(x, y, RA.pedra, base + facet - d * 0.6 + cg(x, y, ss) * 0.7 + (hash2(x, y, ss) < 0.05 ? -1.4 : 0));
    }
    for (let k = 0; k < nc; k++) {
      let x = cx + (hash2(k, 1, ss) - 0.5) * rx, y = cy - ry * 0.5 + hash2(k, 2, ss) * ry * 0.4, ang = 1.2 + hash2(k, 3, ss) * 1.2;
      for (let i = 0; i < rx + ry; i++) {
        if (!inside(x, y)) break;
        P.put(x, y, stone ? RA.pedraE : RA.fogo, stone ? 1.4 : 3.6 + (i % 3 === 1 ? 1.6 : 0));
        ang += (hash2(k, i, ss) - 0.5) * 1.4; x += Math.cos(ang) * 0.9; y += Math.sin(ang) * 0.9;
      }
    }
  };
  const M = stone ? RA.pedra : RA.pedraE;
  const wing = (pts, v0, v1) => { udPoly(P, pts, M, v0 + 1.4, v1 + 1.2, s + 9); for (let i = 1; i < pts.length - 1; i += 2) P.line(pts[0][0], pts[0][1], pts[i][0], pts[i][1], RA.pedra, stone ? 4.4 : 4.8); };
  if (stone) {
    wing([[10, 8], [4, 0], [5.6, 4], [2, 3], [4.4, 8], [1.6, 9.6], [6, 13], [11, 13]], 1.6, 0.6);
    P.line(7, 16, 3, 17.4, RA.pedra, 2.6); P.line(3, 17.4, 1.4, 15, RA.pedra, 3);   // the tail curled round
    body(11.6, 12, 4.4, 5.2, s, 3.8);
    P.blob(10.4, 16.4, 2.2, 1.8, RA.pedra, s + 4, 2.6); P.blob(14, 16.4, 2.2, 1.8, RA.pedra, s + 5, 3.2);   // haunches
    P.line(9.4, 18, 8, 19, RA.pedra, 2.4); P.line(13.6, 18, 16.4, 19, RA.pedra, 3.6); P.line(7.6, 19, 10.4, 19, RA.pedra, 2.8);   // feet gripping the stone
    P.line(14.2, 10.6, 15.6, 15.4, RA.pedra, 3.6); P.put(16, 16, RA.pedra, 4.4);
  } else {
    const by = dive ? 10.6 : wake ? 11 : 10;
    if (pose === 1) wing([[10.6, 8], [4, 1], [6, 4.6], [1, 4.4], [4.4, 8.6], [1.6, 11], [6, 13], [11, 12]], 2.6, 1);
    if (pose === 2) wing([[11, 8], [3, 0], [6.4, 3.4], [0, 2.6], [4, 6.6], [0, 8], [5, 10], [11, 11]], 3, 1.2);
    if (pose === 3) wing([[11, 8], [5, 19], [5.4, 14], [1, 17.6], [3, 12], [0, 12.4], [5, 9], [11, 11]], 2.6, 1);
    if (dive) wing([[12, 8], [1, 3.6], [4.6, 6.6], [0, 7.6], [4, 9.6], [1, 12], [11, 12.4]], 2.8, 1);
    P.line(7, by + 2, 2.4, by + 5, RA.pedra, 2.8); P.line(2.4, by + 5, 0.6, by + 2.6, RA.pedra, 3.2); P.put(0.4, by + 1.8, RA.chifre, 4.6);   // tail with a barb
    body(12, by + 1, dive ? 5.6 : 4.8, dive ? 3 : 3.8, s, 4.2);
    if (dive) { P.blob(11.4, by + 3, 2.2, 1.6, RA.pedra, s + 4, 3); P.line(15, by + 3, 19.4, by + 5.4, RA.pedra, 3.4); P.line(19.4, by + 5.4, 21.4, by + 5.2, RA.osso, 5); P.line(11, by + 4, 14, by + 6.6, RA.pedra, 2.8); P.line(14, by + 6.6, 15.8, by + 6.8, RA.osso, 4); }   // talons out front
    else {
      P.blob(10.6, by + 4, 2, 1.6, RA.pedra, s + 4, 2.8); P.blob(13.6, by + 4, 2.2, 1.6, RA.pedra, s + 5, 3.4);   // thighs
      P.line(10, by + 5, 9.4, by + 7.6, RA.pedra, 2.6); P.line(13.8, by + 5, 14.4, by + 7.8, RA.pedra, 3.2); P.put(15, by + 8, RA.osso, 4.6); P.put(9.8, by + 8, RA.osso, 3.6);
    }
    P.line(15, by, 18.2, by + 2.4, RA.pedra, 3.8); P.put(18.6, by + 3, RA.osso, 5);   // an arm, claws out
  }
  const hx = dive ? 19 : stone ? 14.6 : 17, hy = dive ? 10.4 : stone ? 6.4 : wake ? 6 : 5.4;
  body(hx, hy, 2.8, 2.6, s + 1, 4.4, stone ? 0 : 1);   // the head
  P.line(hx - 1, hy - 1.8, hx - 3.6, hy - 3.2, RA.chifre, stone ? 3.6 : 4.6); P.line(hx - 3.6, hy - 3.2, hx - 4.6, hy - 2, RA.chifre, stone ? 3.2 : 4.2);   // ram's horns curling back
  P.line(hx + 0.4, hy - 2.2, hx - 1, hy - 4.6, RA.chifre, stone ? 4 : 5.2); P.put(hx - 1.8, hy - 4.6, RA.chifre, stone ? 3.6 : 4.6);
  P.put(hx + 2.8, hy + 0.6, RA.pedra, 4.6); P.put(hx + 2.6, hy + 1.6, RA.osso, stone ? 3.4 : 5); P.put(hx + 1.4, hy + 1.8, RA.osso, stone ? 3 : 4.4);   // snout and fangs
  if (stone) { P.put(hx + 1.2, hy - 0.4, RA.pedraE, 1); P.put(hx + 2, hy - 0.4, RA.pedraE, 2); }   // blind stone eyes
  else { P.put(hx + 1.2, hy - 0.4, RA.fogo, 6); P.put(hx + 2, hy - 0.4, RA.fogo, 4.6); }
  return set(P.done());
}

/* one fly of the swarm, 4 x 3: 0 wings up, 1 wings down (no outline: they are specks) */
function fly(k) {
  const P = cp(4, 3);
  P.put(1, 1, RA.mosca, 2.2); P.put(2, 1, RA.mosca, 5.6); P.put(3, 1, RA.mosca, 1); P.put(1, 2, RA.mosca, 0.6); P.put(2, 2, RA.mosca, 1.4);   // a fat dark body with a green sheen
  if (k === 0) { P.put(1, 0, RA.asaM, 3.2); P.put(2, 0, RA.asaM, 1.6); }   // the wings: a dull glint
  else { P.put(0, 1, RA.asaM, 2.2); P.put(0, 2, RA.asaM, 0.8); }
  const cv = P.done(); return { r: cv, w: whiteOf(cv) };
}

/* the lava salamander, 34 x 14 facing right: 0-1 walking, 2 spitting (head up, mouth full of fire),
   3 leaping (stretched out, legs back), 4 swimming (legs tucked, the tail sweeping) */
function salamander(pose) {
  const W = 34, H = 14, P = cp(W, H), s = 12401 + pose * 3, ph = pose === 1 ? 1 : pose === 0 ? -1 : 0, spit = pose === 2, leap = pose === 3, swim = pose === 4;
  const by = leap ? 6.6 : swim ? 7 : 7.6;
  const legs = (far) => {
    for (const [x, d] of [[11.6, -1], [21.6, 1]]) {
      const o = (far ? -ph : ph) * (d > 0 ? 1 : -1), v = far ? 1.4 : 3;
      let kx, ky, fx, fy;
      if (leap) { kx = x - 3; ky = by + 2.6; fx = x - 6; fy = by + 3; }
      else if (swim) { kx = x - 2.4; ky = by + 2.4; fx = x - 4; fy = by + 2.4; }
      else { kx = x + d * 1.4 + o; ky = by + 3.6; fx = x + d * 2.2 + o * 1.6; fy = H - 1.2; }
      P.line(x + (far ? 0.8 : 0), by + 1.2, kx, ky, RA.sal, v + 0.8); P.line(x + (far ? 0.8 : 0) + 1, by + 1.2, kx + 0.8, ky, RA.sal, v); P.line(kx, ky, fx, fy, RA.sal, v);
      P.put(fx + 1, fy, RA.osso, far ? 2.4 : 4.4); P.put(fx - 0.4, fy, RA.osso, far ? 2 : 3.6); P.put(fx + 1.8, fy - 0.4, RA.osso, far ? 2 : 3.6);
    }
  };
  legs(true);
  // the tail: long, tapering, a slow wave in it
  for (let i = 0; i <= 26; i++) {
    const t = i / 26, x = 10 - t * 10, wv = swim ? Math.sin(t * 5 + 1) * 1.6 * t : leap ? -t * 1.4 : Math.sin(t * 3 + ph) * 0.8 * t, r = 2.1 * (1 - t) + 0.5;
    for (let y = -r; y <= r; y += 0.5) { const belly = y > r * 0.45; P.put(x, by + 0.6 + wv + y, belly ? RA.salB : RA.sal, (belly ? 1.4 : 3.2 - (y + r) / (2 * r) * 1.8) + cg(x * 3, y * 3, s) * 0.6); }
    if (i % 6 === 3 && t < 0.75) P.put(x, by + 0.6 + wv - r * 0.3, RA.fogo, 4.4);
  }
  // the body: black crusted hide, burning cracks and spots, a dull glowing belly
  P.blob(16.4, by, 8.4, 3.2, RA.sal, s, 2.8, (x, y, dx, dy) => (hash2(x, y, s) < 0.06 ? 1.6 : 0) + (dy > 0.5 ? -0.6 : 0));
  for (let x = 9; x <= 24; x++) { const y = by + 2.2 + Math.sin(x * 0.4) * 0.2; P.put(x, y, RA.salB, 2 + cg(x, y, s) * 1.2 + (x % 4 === 0 ? 1 : 0)); }
  for (const [x, y] of [[11.4, -0.8], [15.6, 0.2], [19.4, -1], [22.6, 0]]) { P.put(x, by + y, RA.fogo, 5); P.put(x + 1, by + y, RA.fogo, 3.6); P.put(x, by + y + 1, RA.fogo, 2.4); }
  for (let x = 12; x <= 21; x += 3) { P.put(x, by - 1.8, RA.fogo, 2.4); P.put(x + 1, by - 1.4, RA.fogo, 2); }   // the cracks between the plates
  // the crest: a row of black spines down the back, the tips smouldering
  for (let x = 9; x <= 23; x += 2) { const h = 1.2 + hash2(x, 1, s) * 1.4; P.line(x, by - 2.8, x - 0.6, by - 2.8 - h, RA.sal, 4); if (x % 4 === 1) P.put(x - 0.6, by - 3 - h, RA.fogo, 4.6); }
  // the head: a broad flat wedge, the jaw opens on fire
  const hx = spit ? 27.6 : 27.2, hy = spit ? by - 1.6 : leap ? by - 0.8 : by - 0.2;
  P.blob(hx, hy, 4.8, 2.6, RA.sal, s + 1, 3.2, (x, y) => hash2(x, y, s + 1) < 0.08 ? 1.6 : 0);
  P.line(hx - 1, hy - 2, hx + 4.4, hy - 0.8, RA.sal, 4.6);   // the brow ridge
  P.put(hx + 0.8, hy - 1, RA.fogo, 6.2); P.put(hx + 1.6, hy - 1, RA.fogo, 5);
  if (spit) {
    for (let x = hx - 0.6; x <= hx + 5.2; x++) { P.put(x, hy + 1.2, RA.fogo, 5.6 - (x - hx) * 0.2); P.put(x, hy + 2.2, RA.fogo, 3.8); }
    for (let x = hx - 0.4; x <= hx + 4.4; x++) P.put(x, hy + 3.2, RA.sal, 2.6);
    P.put(hx + 5.6, hy + 1.6, RA.fogo, 6.4);
  } else { P.line(hx - 0.4, hy + 1.4, hx + 4.6, hy + 1, RA.boca, 0.4); P.put(hx + 4, hy + 1.6, RA.osso, 4); P.put(hx + 2.4, hy + 1.6, RA.osso, 3.4); }
  legs(false);
  return set(P.done());
}
// the cultist's hands and circle, the column, the salamander's spots, the globs, the gargoyle's cracks
const GL = { fire: glow(14, '#ff7a2a'), col: glow(30, '#ff6a1a'), rune: glow(18, '#ff3a2a'), warm: glow(12, '#ff9a3a'), ember: glow(8, '#ffb050') };
AB2.get = () => AB2.ready || (AB2.ready = {
  crawl: [0, 1, 2, 3, 4].map(crawler),
  cult: [0, 1, 2, 3, 4].map(cultist),
  garg: [0, 1, 2, 3, 4].map(gargoyle),
  fly: [0, 1].map(fly),
  sal: [0, 1, 2, 3, 4].map(salamander)
});
Object.assign(AB2, { RA, GL });
}

/* ================= drawing ================= */
// the crawler keeps its feet on whatever it holds: floor, roof or wall (as the centipede in 76)
function ab2CrawlXf(e, fx, fy) {
  const side = e.side || 'down', mv = e.mv || [e.facing, 0], hw = 7;   // half the sprite's height (16 / 2, one row sunk)
  let a = 0, vf = e.facing, cx = fx, cy = fy - hw;
  if (side === 'up') { a = Math.PI; vf = -(Math.sign(mv[0]) || e.facing); cy = fy - e.h + hw; }
  else if (side === 'left') { a = Math.PI / 2; vf = mv[1] < 0 ? -1 : 1; cx = fx - e.w / 2 + hw; cy = fy - e.h / 2; }
  else if (side === 'right') { a = -Math.PI / 2; vf = mv[1] < 0 ? 1 : -1; cx = fx + e.w / 2 - hw; cy = fy - e.h / 2; }
  else if (side === 'air') { a = Math.sin(e.t * 9) * 0.25; cy = fy - e.h / 2; }
  return { a, vf, cx, cy };
}
DRAW_E.rastejador = (e, fx, fy, fl) => {
  const B = AB2.get().crawl, k = e.state === 'aim' || e.state === 'rear' ? 2 : e.state === 'drop' ? 3 : e.state === 'slash' ? 4 : Math.hypot(e.vx, e.vy) > 8 ? 1 - (Math.floor(e.t * 12) % 2) : 0;
  const X = ab2CrawlXf(e, fx, fy), S = B[k], img = X.vf > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l);
  const j = e.state === 'aim' ? Math.round(Math.sin(e.t * 60)) : 0;
  cvRot(img, Math.round(X.cx) + j, Math.round(X.cy), X.a);
};
EYES_E.rastejador = (e, fx, fy) => {
  const X = ab2CrawlXf(e, fx, fy), aim = e.state === 'aim' || e.state === 'rear';
  const lx = (aim ? 24.8 : 24.4) - 14, ly = (aim ? 6.6 : 7.2) - 8, px = lx * X.vf, c = Math.cos(X.a), s = Math.sin(X.a);
  lc.globalAlpha = aim ? 0.9 : 0.5; lc.drawImage(SPR.glow.eye, X.cx + px * c - ly * s - 6, X.cy + px * s + ly * c - 6);
};
DRAW_E.cultista = (e, fx, fy, fl) => {
  const vis = e.vis === undefined ? 1 : e.vis; if (vis <= 0.02) return;
  const B = AB2.get().cult, k = e.state === 'cast' ? 3 : e.state === 'vanish' || e.state === 'appear' ? 4 : Math.abs(e.vx) > 5 && e.onGround ? 1 + (Math.floor(e.t * 6) % 2) : 0;
  const j = e.state === 'vanish' || e.state === 'appear' ? Math.round(Math.sin(e.t * 47)) : 0, bob = k === 0 ? Math.round(Math.sin(e.t * 2.2) * 0.5) : 0;
  const a0 = lc.globalAlpha; lc.globalAlpha = a0 * vis;
  lc.drawImage(cvPick(B[k], e, fl), fx - 10 + j, fy - 27 + bob);
  lc.globalAlpha = a0;
};
EYES_E.cultista = (e, fx, fy) => {
  const vis = e.vis === undefined ? 1 : e.vis; if (vis <= 0.02) return;
  const tw = e.state === 'vanish' || e.state === 'appear';
  lc.globalAlpha = (e.state === 'cast' ? 0.95 : 0.6) * vis; lc.drawImage(SPR.glow.eye, fx + e.facing * (tw ? 2 : 3) - 6, fy - 23 + (tw ? 1 : 0));
};
DRAW_E.gargulainf = (e, fx, fy, fl) => {
  const B = AB2.get().garg;
  if (e.state === 'perch' || e.state === 'wake') {   // upside down, its feet on the roof
    const S = B[e.state === 'perch' ? 0 : 1], img = e.facing > 0 ? (fl ? S.wl : S.l) : (fl ? S.wr : S.r), j = e.state === 'wake' ? Math.round(Math.sin(e.t * 50) * 0.8) : 0;
    cvRot(img, fx + j, fy - e.h + 10, Math.PI);
    return;
  }
  const k = e.state === 'dive' ? 4 : e.state === 'poise' ? 1 : 2 + (Math.floor(e.t * 8) % 2);
  lc.drawImage(cvPick(B[k], e, fl), fx - 13, fy - 18);
};
EYES_E.gargulainf = (e, fx, fy) => {
  if (e.state === 'perch') return;   // a statue: nothing burns
  if (e.state === 'wake') { lc.globalAlpha = 0.5 + Math.sin(e.t * 30) * 0.3; lc.drawImage(SPR.glow.eye, fx + e.facing * 4 - 6, fy - e.h + 14 - 6); return; }   // hanging head down
  const hx = e.state === 'dive' ? 8 : 6, hy = e.state === 'dive' ? 8 : e.state === 'poise' ? 13 : 13;
  lc.globalAlpha = 0.85; lc.drawImage(SPR.glow.eye, fx + e.facing * hx - 6, fy - hy - 6);
};
DRAW_E.moscas = (e, fx, fy, fl) => {
  if (!e.flies) return;
  const F = AB2.get().fly, n = ab2FlyCount(e), cx = fx, cy = fy - e.h / 2;
  for (let i = 0; i < n; i++) {
    const [x, y] = ab2FlyPos(e, i), f = F[(Math.floor(e.t * 34 + i * 1.7)) % 2];
    const img = fl ? f.w : f.r, dir = Math.cos(e.t * e.flies[i].f1 + e.flies[i].a) > 0;
    if (dir) lc.drawImage(img, Math.round(cx + x) - 2, Math.round(cy + y) - 1);
    else { lc.save(); lc.translate(Math.round(cx + x) + 2, Math.round(cy + y) - 1); lc.scale(-1, 1); lc.drawImage(img, 0, 0); lc.restore(); }
  }
};
EYES_E.moscas = () => { };
DRAW_E.salamandra = (e, fx, fy, fl) => {
  const B = AB2.get().sal, sw = e.state === 'swim' || e.state === 'surface';
  const k = e.state === 'spit' || e.state === 'crouch' ? 2 : e.state === 'leap' ? 3 : sw ? 4 : Math.abs(e.vx) > 4 && e.onGround ? Math.floor(e.t * 5) % 2 : 0;
  const img = cvPick(B[k], e, fl), x = fx - 18, y = fy - 15 + (e.state === 'surface' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0);
  if (sw && e.lavaTop !== undefined) {   // in the lava only what rises above the surface shows
    const sy = Math.round(e.lavaTop - (Math.round(e.y + e.h) - fy)) + 1, cut = clamp(sy - y, 0, img.height);
    if (cut > 0) lc.drawImage(img, 0, 0, img.width, cut, x, y, img.width, cut);
    return;
  }
  lc.drawImage(img, x, y);
};
EYES_E.salamandra = (e, fx, fy) => {
  const hot = e.state === 'spit' || e.state === 'surface' || e.state === 'crouch';
  const dy = e.state === 'spit' || e.state === 'crouch' ? 9 : e.state === 'leap' ? 9 : 8;
  lc.globalAlpha = hot ? 0.95 : 0.55; lc.drawImage(SPR.glow.eye, fx + e.facing * 11 - 6, fy - dy - 6);
};
WARN_E.rastejador = e => e.state === 'aim' || e.state === 'rear';
WARN_E.cultista = e => e.state === 'cast';
WARN_E.gargulainf = e => e.state === 'wake' || e.state === 'poise';
WARN_E.moscas = e => e.state === 'gather';
WARN_E.salamandra = e => e.state === 'surface' || e.state === 'spit' || e.state === 'crouch';

/* ================= behaviour ================= */
function ab2Wander(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
function ab2Roof(tx, ty, max) { for (let k = 1; k <= max; k++) if (solidAt(tx, ty - k)) return ty - k; return -1; }
// the floor under a point (the row of the first solid tile at or below it), or -1
function ab2FloorRow(tx, ty, max) { for (let k = 0; k <= max; k++) if (solidAt(tx, ty + k)) return ty + k; return -1; }
// a hit that isn't a creature's body (fire, magma): the damage type rides on 101's dmgCtx
function ab2Hurt(dmg, x, kind) {
  if (typeof dmgCtx === 'undefined' || !kind) return hurtPlayer(dmg, x, null, true);
  const o = dmgCtx; dmgCtx = kind;
  try { return hurtPlayer(dmg, x, null, true); } finally { dmgCtx = o; }
}
// the fungus's poison (76): ticks away at life, the elixir of venom cuts it short
function ab2Poison(dmg) {
  if (typeof fgPoisonT === 'undefined' || pl.dead) return;
  if (fgPoisonT <= 0) floatText(pl.x + pl.w / 2, pl.y - 8, 'ENVENENADO', '#9ad83a', 0.8);
  fgPoisonT = Math.max(fgPoisonT, 2.6); fgPoisonDmg = Math.max(fgPoisonDmg, dmg);
}
function ab2Smoke(x, y, n, spread) {
  for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-spread, spread), y: y + rnd(-spread * 1.4, spread * 0.6), vx: rnd(-14, 14), vy: rnd(-26, -6), g: -6, life: rnd(0.6, 1.1), max: 1.1, col: Math.random() < 0.5 ? '#1a0a10' : '#3a1420', size: 1, smoke: true });
}

/* ---------- the flesh crawler ---------- */
function ab2Contacts(e) { return { down: rectSolid(e.x, e.y + 1, e.w, e.h), up: rectSolid(e.x, e.y - 1, e.w, e.h), left: rectSolid(e.x - 1, e.y, e.w, e.h), right: rectSolid(e.x + 1, e.y, e.w, e.h) }; }
// which way along the floor is a wall close enough to climb up to the roof (0: none in reach)
function ab2NearWall(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h / 2) / T);
  for (let k = 1; k <= 8; k++) { const l = solidAt(tx - k, ty), r = solidAt(tx + k, ty); if (l || r) return l && r ? (Math.random() < 0.5 ? -1 : 1) : l ? -1 : 1; }
  return 0;
}
AI.rastejador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.dropCD = (e.dropCD === undefined ? 1 : e.dropCD) - dt; e.wallT = (e.wallT || 0) - dt; e.roofOff = (e.roofOff || 0) - dt;
  const C = ab2Contacts(e), wd = C.left ? -1 : C.right ? 1 : 0, any = C.down || C.up || wd, sp = 66 + e.lvl * 2, ecx = e.x + e.w / 2;
  if (e.state === 'drop') {   // let go over the hero: every limb reaching for him
    e.side = 'air'; e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); e.vx = approach(e.vx, clamp(dx * 3, -50, 50), 300 * dt);
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(Math.round(e.dmg * 1.25), ecx, e, false); sfx.ab2Rip(); }
    if ((C.down || e.onGround) && e.vy >= 0) { e.state = 'land'; e.stateT = 0.7; e.vx = 0; e.vy = 0; e.side = 'down'; e.dropCD = 3.5 + Math.random(); burst(ecx, e.y + e.h, 8, '#6e1c1c', 70, 300, 0.4); shake(1.5); sfx.ab2Thud(); }
    return;
  }
  if (e.state === 'fall') {
    e.side = 'air'; e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); e.vx = approach(e.vx, 0, 120 * dt);
    if ((C.down || e.onGround) && e.vy >= 0) { e.state = 'land'; e.stateT = 0.35; e.vy = 0; e.side = 'down'; burst(ecx, e.y + e.h, 4, '#6e1c1c', 40, 200, 0.3); }
    return;
  }
  if (e.state === 'land') { e.side = 'down'; e.vx = approach(e.vx, 0, 600 * dt); e.vy = 30; if (e.stateT <= 0) e.state = 'walk'; return; }
  if (!any) {   // lost its hold: round the corner for a moment, then fall
    e.cornerT = (e.cornerT || 0) - dt;
    if (e.lastN && e.cornerT > 0) { const [nx, ny] = e.lastN, [mx, my] = e.mv || [0, 0]; e.vx = nx * sp * 0.7 - mx * sp * 0.6; e.vy = ny * sp * 0.7 - my * sp * 0.6; return; }
    e.state = e.state === 'aim' ? 'drop' : 'fall'; e.swingHit = false; e.lastN = null; return;
  }
  e.cornerT = 0.3;
  const glue = () => { e.vx = wd * 30 * (C.down || C.up ? 0 : 1); e.vy = C.down ? 30 : C.up ? -30 : 0; };
  if (e.state === 'aim') {   // on the roof over the hero: shudders, clicks, lets go
    glue(); e.vx = clamp(dx * 3, -24, 24); e.side = 'up';
    if (!C.up) { e.state = 'fall'; return; }
    if (e.stateT <= 0) { e.state = 'drop'; e.vy = 40; e.swingHit = false; sfx.ab2Shriek(); }
    return;
  }
  if (e.state === 'rear') { glue(); if (e.stateT <= 0) { e.state = 'slash'; e.stateT = 0.2; if (!pl.dead && overlap({ x: e.x - 6, y: e.y - 6, w: e.w + 12, h: e.h + 12 }, pl)) { hurtPlayer(e.dmg, ecx, e, false); sfx.ab2Rip(); } } return; }
  if (e.state === 'slash') { glue(); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.5; } return; }
  // claws up close, from any side
  if (aggro && e.atkCD <= 0 && !pl.dead && overlap({ x: e.x - 5, y: e.y - 5, w: e.w + 10, h: e.h + 10 }, pl)) { e.state = 'rear'; e.stateT = 0.32; e.facing = Math.sign(dx) || e.facing; sfx.ab2Hiss(); return; }
  // on the roof right over the hero: get ready to drop
  if (C.up && !C.down && aggro && e.dropCD <= 0 && Math.abs(dx) < 10 && dy > 14 && dy < 140 && losClear(ecx, e.y + e.h + 2, pl.x + pl.w / 2, pl.y)) { e.state = 'aim'; e.stateT = 0.6; e.side = 'up'; sfx.ab2Click(); return; }
  // where to: the roof over the hero when there is one and the drop is ready (along the floor to a wall, up it,
  // along the roof); otherwise straight at him
  let wx = 0, wy = 0;
  if (aggro) {
    let roof = e.dropCD <= 0 && !(e.roofOff > 0) ? ab2Roof(Math.floor((pl.x + pl.w / 2) / T), Math.floor(pl.y / T), 9) : -1;
    if (roof >= 0 && C.down && !wd && !C.up) { if (e.wallT <= 0) { e.wallDir = ab2NearWall(e); e.wallT = 1.5; } if (!e.wallDir) { roof = -1; e.roofOff = 2.5; } }   // no wall near: just go for him a while
    if (roof >= 0) {
      wy = -1;
      if (C.up) wx = Math.abs(dx) > 3 ? Math.sign(dx) : 0;
      else if (C.down && !wd) wx = e.wallDir;
      else wx = wd || Math.sign(dx);
    } else { wx = Math.abs(dx) > 4 ? Math.sign(dx) : 0; wy = Math.abs(dy) > 6 ? Math.sign(dy) : 0; }
  } else { ab2Wander(e, dt); wx = e.wander; }
  let vx = 0, vy = 0, side = 'down';
  const floor = d => { vx = d * sp; vy = 30; side = 'down'; };
  const roofW = d => { vx = d * sp; vy = -30; side = 'up'; };
  const wall = my => {
    if (my < 0 && C.up) return roofW(-wd);
    if (my > 0 && C.down) return floor(wx === wd ? 0 : wx || -wd);
    vy = my * sp * 0.85; vx = wd * 30; side = wd < 0 ? 'left' : 'right';
  };
  if (C.up && !C.down && wy <= 0) roofW(wx === wd && wd ? 0 : wx);
  else if (C.up && !C.down) { if (wd) wall(1); else if (aggro && Math.abs(dx) < 12) { e.state = 'fall'; return; } else roofW(wx || e.facing); }
  else if (C.down && !(wy < 0 && wd && (wx === wd || wx === 0))) floor(wx);
  else if (wd && wy >= 0 && wx === -wd && aggro) { e.state = 'fall'; e.vx = wx * 50; e.vy = -40; return; }   // on a wall, the hero the other way: leap off at him
  else if (wd) wall(wy || -1);
  else floor(wx);
  if (side !== e.side) e.wallT = 0;   // a new surface: look for a wall again from here
  e.vx = vx; e.vy = vy; e.side = side;
  e.lastN = side === 'down' ? [0, 1] : side === 'up' ? [0, -1] : side === 'left' ? [-1, 0] : [1, 0];
  if (side === 'down' || side === 'up') { if (vx) { e.facing = Math.sign(vx); e.mv = [Math.sign(vx), 0]; } }
  else e.mv = [0, Math.sign(vy) || -1];
  if (Math.hypot(vx, vy) > 20) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.28; if (dist < 160) sfx.ab2Skitter(); } }
};

/* ---------- the possessed cultist ---------- */
const ab2Cols = [];   // the burning circles, and the columns of fire that rise from them
// a patch of floor near the hero, in sight of him, for the cultist to come back on
function ab2TpSpot(e) {
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h - 1) / T);
  for (let a = 0; a < 40; a++) {
    const tx = ptx + (Math.random() < 0.5 ? -1 : 1) * (3 + Math.floor(Math.random() * 6)), ty0 = pty + Math.floor(rnd(-3, 3));
    for (let ty = ty0 - 3; ty <= ty0 + 4; ty++) {
      const px = tx * T + (T - e.w) / 2, py = (ty + 1) * T - e.h - 0.01;
      if (!solidAt(tx, ty + 1) || rectSolid(px, py, e.w, e.h) || lavaIn(px, py, e.w, e.h + 2)) continue;
      if (Math.abs(px - e.x) < 2 * T && Math.abs(py - e.y) < 2 * T) continue;
      if (!losClear(px + e.w / 2, py + 4, pl.x + pl.w / 2, pl.y + 4)) continue;
      return { x: px, y: py };
    }
  }
  return null;
}
function ab2Puff(e) { const x = e.x + e.w / 2, y = e.y + e.h / 2; ab2Smoke(x, y + 4, 18, 5); burst(x, y, 4, '#ff6a2a', 60, -20, 0.5, 1, true); burst(x, y, 8, '#b03024', 50, -10, 0.6); }
function ab2Cast(e) {
  e.state = 'cast'; e.stateT = 1; e.atkCD = 3 + Math.random(); e.facing = Math.sign(pl.x - e.x) || e.facing; sfx.ab2Chant();
  const tx = Math.floor((pl.x + pl.w / 2) / T), fr = ab2FloorRow(tx, Math.floor((pl.y + pl.h - 1) / T), 7);
  if (fr < 0) return;
  ab2Cols.push({ x: pl.x + pl.w / 2, y: fr * T, t: 0, track: 0.45, mark: 1.05, burn: 0.7, dmg: e.dmg, hit: false, lit: false });
}
AI.cultista = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.tpCD = (e.tpCD === undefined ? 1.5 : e.tpCD) - dt; if (e.vis === undefined) e.vis = 1;
  if (e.state === 'vanish') { e.vx = approach(e.vx, 0, 800 * dt); e.vis = clamp(e.stateT / 0.45, 0, 1); if (Math.random() < dt * 30) ab2Smoke(e.x + e.w / 2, e.y + e.h * 0.6, 1, 4); if (e.stateT <= 0) { e.state = 'gone'; e.stateT = 0.4; e.vis = 0; } return; }
  if (e.state === 'gone') {
    e.vx = 0; e.vis = 0;
    if (e.stateT <= 0) { const p = ab2TpSpot(e); if (p) { e.x = p.x; e.y = p.y; e.vy = 0; } e.facing = Math.sign(pl.x - e.x) || e.facing; ab2Puff(e); sfx.ab2Poof(); e.state = 'appear'; e.stateT = 0.4; }
    return;
  }
  if (e.state === 'appear') { e.vx = 0; e.vis = 1 - clamp(e.stateT / 0.4, 0, 1); if (e.stateT <= 0) { e.vis = 1; if (aggro && e.atkCD <= 0.5 && dist < 200) ab2Cast(e); else e.state = 'walk'; } return; }
  if (e.state === 'cast') {
    e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 30) for (const s of [-1, 1]) parts.push({ x: e.x + e.w / 2 + s * 4 + rnd(-1, 1), y: e.y - 4, vx: rnd(-8, 8), vy: rnd(-40, -15), g: -20, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffd070' : '#ff6a1a', size: 1, glow: true });
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.vis = 1;
  if (!aggro) ab2Wander(e, dt);
  const adx = Math.abs(dx), dir = aggro ? (adx > 140 ? Math.sign(dx) : adx < 56 ? -Math.sign(dx) || 1 : 0) : e.wander;
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, 26 + e.lvl, 400, 250, dy, aggro && dir === Math.sign(dx));
  if (!aggro || !e.onGround) return;
  if (e.tpCD <= 0 && (dist < 50 || dist > 160 || !e.sees || Math.random() < dt * 0.4)) { e.state = 'vanish'; e.stateT = 0.45; e.tpCD = 3.5 + Math.random() * 1.5; ab2Puff(e); sfx.ab2Poof(); }
  else if (e.atkCD <= 0 && dist < 180 && e.sees) ab2Cast(e);
};

/* ---------- the infernal gargoyle ---------- */
function ab2GgDive(e) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, hx = pl.x + pl.w / 2 + pl.vx * 0.15, hy = pl.y + pl.h / 2;
  let span = 2 * (hx - ecx); if (Math.abs(span) < 64) span = (Math.sign(span) || e.facing) * 64;
  e.span = clamp(span, -240, 240); e.depth = Math.max(24, hy - ecy); e.dx0 = e.x; e.dy0 = e.y;
  e.diveD = clamp(Math.abs(e.span) / 210 + e.depth / 500, 0.75, 1.35); e.diveT = 0; e.swingHit = false; e.state = 'dive'; e.facing = Math.sign(e.span);
  burst(ecx, e.y, 8, '#3d3935', 50, 300, 0.5); sfx.ab2Swoop();
}
AI.gargulainf = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.perchCD = (e.perchCD || 0) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'perch') {
    e.vx = 0; e.vy = -30;
    if (!rectSolid(e.x, e.y - 1, e.w, e.h)) { e.state = 'climb'; e.stateT = 2.5; return; }   // the roof under it is gone
    if (!pl.dead && e.perchCD <= 0 && dy > 6 && dy < 150 && Math.abs(dx) < 84 && (e.sees || dist < 48)) { e.state = 'wake'; e.stateT = 0.6; e.facing = Math.sign(dx) || e.facing; sfx.ab2Crack(); }
    return;
  }
  if (e.state === 'wake') {
    e.vx = 0; e.vy = -30;
    if (Math.random() < dt * 25) parts.push({ x: ecx + rnd(-7, 7), y: e.y + rnd(2, e.h), vx: rnd(-6, 6), vy: rnd(10, 40), g: 400, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#534d48' : '#2a2725', size: 1 });
    if (e.stateT <= 0) ab2GgDive(e);
    return;
  }
  if (e.state === 'poise') { const k = Math.pow(0.02, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) ab2GgDive(e); return; }
  if (e.state === 'dive') {
    e.diveT += dt; const u = Math.min(1, e.diveT / e.diveD);
    const tx = e.dx0 + e.span * u, ty = e.dy0 + e.depth * Math.sin(Math.PI * u);
    e.vx = clamp((tx - e.x) / dt, -420, 420); e.vy = clamp((ty - e.y) / dt, -420, 420);
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') pl.vx = Math.sign(e.span) * 200; }
    if (Math.random() < dt * 30) parts.push({ x: ecx - e.facing * 6, y: e.y + 4, vx: -e.facing * rnd(10, 30), vy: rnd(-10, 10), g: 0, life: 0.35, max: 0.35, col: Math.random() < 0.5 ? '#ff9a2a' : '#e06414', size: 1, glow: true });
    if (u >= 1 || e.hitWall || (e.onGround && u > 0.25)) { e.state = 'climb'; e.stateT = 2.5; e.vy = Math.min(e.vy, -40); e.atkCD = 1.2; if (e.onGround) burst(ecx, e.y + e.h, 6, '#3d3935', 60, 300, 0.4); }
    return;
  }
  if (e.state === 'climb') {   // straight back up to the roof
    e.vy = approach(e.vy, -120, 500 * dt); e.vx = approach(e.vx, -Math.sign(dx) * 20, 300 * dt);
    e.flapT = (e.flapT || 0) - dt; if (e.flapT <= 0) { e.flapT = 0.25; if (dist < 180) sfx.ab2Flap(); }
    if (e.hitCeil || rectSolid(e.x, e.y - 1, e.w, e.h)) { e.state = 'perch'; e.vx = 0; e.vy = 0; e.perchCD = 1.2 + Math.random() * 0.8; burst(ecx, e.y, 6, '#3d3935', 40, 300, 0.4); sfx.ab2Land(); }
    else if (e.stateT <= 0) { e.state = 'hover'; e.stateT = 1.2; }
    return;
  }
  // hover (no roof in reach): flaps above and behind the hero, swoops again; climbs when a roof comes in reach
  if (e.state !== 'hover') { e.state = 'hover'; e.stateT = 1; }
  const hx = pl.x + pl.w / 2 + (ecx < pl.x + pl.w / 2 ? -50 : 50), hy = pl.y - 48;
  if (aggro) { e.vx = approach(e.vx, clamp((hx - ecx) * 2.4, -110, 110), 400 * dt); e.vy = approach(e.vy, clamp((hy - e.y) * 2.4, -110, 110) + Math.sin(e.t * 7) * 24, 400 * dt); e.facing = Math.sign(dx) || e.facing; }
  else { e.vx = approach(e.vx, Math.sin(e.t * 0.7 + e.seed) * 30, 200 * dt); e.vy = approach(e.vy, -20 + Math.sin(e.t * 7) * 24, 300 * dt); }
  if (e.hitWall) { e.vx *= -0.5; e.vy -= 60; }
  e.flapT = (e.flapT || 0) - dt; if (e.flapT <= 0) { e.flapT = 0.25; if (dist < 180) sfx.ab2Flap(); }
  e.roofT = (e.roofT || 0) - dt;
  if (e.roofT <= 0) { e.roofT = 1; const r = ab2Roof(Math.floor(ecx / T), Math.floor(e.y / T), 9); if (r >= 0 && (!aggro || e.atkCD > 0.5)) { e.state = 'climb'; e.stateT = 2.5; return; } }
  if (aggro && e.atkCD <= 0 && e.stateT <= 0 && dist < 160 && losClear(ecx, e.y + e.h / 2, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'poise'; e.stateT = 0.45; sfx.ab2Crack(); }
};

/* ---------- the plague swarm ---------- */
const AB2_FLIES = 44;
function ab2FlySetup(e) {
  e.flies = []; for (let i = 0; i < AB2_FLIES; i++) e.flies.push({ a: Math.random() * 6.28, b: Math.random() * 6.28, r: 0.35 + Math.random() * 0.75, f1: rnd(2.4, 5.6) * (Math.random() < 0.5 ? -1 : 1), f2: rnd(3, 7) });
  e.spread = 10; e.spreadT = 10;
}
const ab2FlyCount = e => e.flies ? Math.max(5, Math.ceil(AB2_FLIES * (0.3 + 0.7 * Math.max(0, e.hp) / e.maxHp))) : 0;
function ab2FlyPos(e, i) {
  const f = e.flies[i], r = e.spread * f.r;
  return [Math.cos(e.t * f.f1 + f.a) * r * 1.15 + Math.sin(e.t * 11 + f.b) * 1.2, Math.sin(e.t * f.f2 + f.b) * r * 0.85 + Math.cos(e.t * 13 + f.a) * 1];
}
AI.moscas = function (e, dt, dx, dy, dist, aggro) {
  if (!e.flies) ab2FlySetup(e);
  e.stateT -= dt; e.spread = lerp(e.spread, e.spreadT, Math.min(1, dt * 4));
  e.buzzT = (e.buzzT || 0) - dt; if (e.buzzT <= 0) { e.buzzT = 0.9 + Math.random() * 0.5; if (dist < 140) sfx.ab2Buzz(e.state === 'engulf' || e.state === 'gather'); }
  if (e.state === 'gather') {   // pulls in tight and dark, then goes for him
    e.spreadT = 5; const k = Math.pow(0.05, dt); e.vx *= k; e.vy *= k;
    if (e.stateT <= 0) { e.state = 'engulf'; e.stateT = 1.9; e.tickT = 0; }
    return;
  }
  if (e.state === 'engulf') {   // round him, everywhere: the poison keeps coming while it holds on
    const tx = pl.x + pl.w / 2 - e.w / 2, ty = pl.y + pl.h / 2 - e.h / 2, k = Math.min(1, dt * 7);
    e.vx = lerp(e.vx, clamp((tx - e.x) * 7, -150, 150), k); e.vy = lerp(e.vy, clamp((ty - e.y) * 7, -150, 150), k);
    const on = !pl.dead && overlap(e, pl); e.spreadT = on ? 12 : 7;
    if (on) { e.tickT -= dt; if (e.tickT <= 0) { e.tickT = 0.35; ab2Poison(Math.max(1, Math.round(e.dmg * 0.45))); } }
    if (e.stateT <= 0 || pl.dead) { e.state = 'scatter'; e.stateT = 1; e.atkCD = 2 + Math.random(); }
    return;
  }
  if (e.state === 'scatter') {
    e.spreadT = 24; const d = dist || 1, k = Math.min(1, dt * 2);
    e.vx = lerp(e.vx, -dx / d * 40, k); e.vy = lerp(e.vy, -dy / d * 30 - 10, k);
    if (e.hitWall) e.vx *= -1; if (e.hitCeil) e.vy = Math.abs(e.vy) + 10; else if (e.onGround) e.vy = -Math.abs(e.vy) - 10;
    if (e.stateT <= 0) e.state = 'walk';
    return;
  }
  // drifting: breathes out and in, follows the hero
  e.spreadT = 14 + Math.sin(e.t * 1.6 + e.seed) * 7;
  let tx, ty;
  if (aggro) { tx = dx + Math.cos(e.t * 0.9 + e.seed) * 18; ty = dy - 4 + Math.sin(e.t * 1.4 + e.seed) * 10; }
  else { tx = Math.cos(e.t * 0.4 + e.seed) * 40; ty = Math.sin(e.t * 0.7 + e.seed) * 20; }
  const d = Math.hypot(tx, ty) || 1, sp = aggro ? 40 + e.lvl : 14, k = Math.min(1, dt * 1.5);
  e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
  if (e.hitWall) { e.vx *= -0.5; if (aggro) e.vy -= 60; }   // a wall in the way: up and over it
  if (e.hitCeil) e.vy = Math.abs(e.vy) + 10; else if (e.onGround) e.vy = -Math.abs(e.vy) - 10;
  if (aggro && e.atkCD <= 0 && dist < 50 && losClear(e.x + e.w / 2, e.y + e.h / 2, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'gather'; e.stateT = 0.6; sfx.ab2Buzz(true); }
};

/* ---------- the lava salamander ---------- */
const ab2Globs = [];
// the row of the lava's surface in a column (from a row at or just above the lava), or -1
function ab2LavaTop(tx, ty) {
  let y = ty; for (let k = 0; k < 3 && tileAt(tx, y) !== LAVA; k++) y++;
  if (tileAt(tx, y) !== LAVA) return -1;
  while (tileAt(tx, y - 1) === LAVA) y--;
  return y;
}
// the nearest lava surface (two tiles wide at least) within reach of a walking salamander (its x in pixels), or null
function ab2FindLava(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T);
  for (let k = 0; k <= 16; k++) for (const s of k ? [-1, 1] : [1]) for (let y = ty - 1; y <= ty + 5; y++) { const x = tx + s * k; if (tileAt(x, y) === LAVA && tileAt(x, y - 1) !== LAVA && !solidAt(x, y - 1) && (tileAt(x - 1, y) === LAVA || tileAt(x + 1, y) === LAVA)) return (x + 0.5) * T; }
  return null;
}
function ab2Spit(e, n) {
  const ox = e.x + e.w / 2 + e.facing * 13, oy = e.y + 1;
  for (let i = 0; i < n; i++) {
    const tx = pl.x + pl.w / 2 + rnd(-12, 12) + pl.vx * 0.3, ty = pl.y + pl.h / 2, t = clamp(Math.abs(tx - ox) / 160, 0.4, 1) * (1 + i * 0.18), G = 420;
    ab2Globs.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * G * t * t) / t, dmg: Math.round(e.dmg * 0.8), life: 3 });
  }
  burst(ox, oy, 6, '#ff9a2a', 60, 200, 0.3, 1, true); sfx.ab2Spit();
}
function ab2Leap(e) {
  const ecx = e.x + e.w / 2, dx = pl.x + pl.w / 2 - ecx, dyf = pl.y + pl.h - (e.y + e.h), t = clamp(Math.abs(dx) / 150, 0.45, 0.85);
  e.vx = clamp(dx / t, -200, 200); e.vy = clamp((dyf - 0.5 * GRAV * t * t) / t, -440, -200);
  e.state = 'leap'; e.swingHit = false; e.spat = false; e.facing = Math.sign(dx) || e.facing;
}
AI.salamandra = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.lavaT = 9;   // the lava doesn't burn it
  const ecx = e.x + e.w / 2, tx = Math.floor(ecx / T), inL = lavaIn(e.x, e.y + e.h - 3, e.w, 3);
  if (inL) { const top = ab2LavaTop(tx, Math.floor(e.y / T)); e.lavaTop = top >= 0 ? top * T : undefined; } else e.lavaTop = undefined;
  const fall = () => { e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); };
  if (e.state === 'leap') {
    fall();
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (!e.spat && e.vy > -30) { e.spat = true; ab2Spit(e, 1); }
    if (inL && e.vy > 0) { e.state = 'swim'; e.atkCD = 1.6 + Math.random(); ab2Splash(ecx, e.lavaTop !== undefined ? e.lavaTop : e.y + e.h); }
    else if (e.onGround) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.6; e.vx = 0; burst(ecx, e.y + e.h, 6, '#3a120c', 50, 300, 0.4); }
    return;
  }
  if (e.state === 'swim' || e.state === 'surface') {
    if (!inL) { e.state = 'walk'; return; }
    // float with the back just out of the lava; swim under the hero
    const want = (e.lavaTop !== undefined ? e.lavaTop : e.y) - e.h * 0.55;
    e.vy = clamp((want - e.y) * 6, -80, 80);
    if (e.state === 'surface') {
      e.vx = approach(e.vx, 0, 400 * dt); e.vy -= 20;
      if (Math.random() < dt * 25) parts.push({ x: ecx + rnd(-10, 10), y: (e.lavaTop || e.y) - 1, vx: rnd(-10, 10), vy: rnd(-60, -20), g: 300, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffd070' : '#ff7a1a', size: 1, glow: true });
      if (e.stateT <= 0) { ab2Leap(e); ab2Splash(ecx, e.lavaTop !== undefined ? e.lavaTop : e.y + e.h); sfx.ab2Splash(); }
      return;
    }
    if (!aggro) ab2Wander(e, dt);
    let dir = aggro ? (Math.abs(dx) < 6 ? 0 : Math.sign(dx)) : e.wander;
    // stay in the pool: turn back where the lava ends
    if (dir && ab2LavaTop(Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / T), Math.floor(e.y / T)) < 0) { if (!aggro) e.wander = -dir; dir = 0; }
    if (dir) e.facing = dir;
    e.vx = approach(e.vx, dir * (44 + e.lvl), 300 * dt);
    if (Math.random() < dt * 3) parts.push({ x: ecx + rnd(-8, 8), y: (e.lavaTop || e.y) - 1, vx: 0, vy: rnd(-20, -8), g: 60, life: 0.5, max: 0.5, col: '#ffb050', size: 1, glow: true });
    if (aggro && e.atkCD <= 0 && Math.abs(dx) < 130 && dy < 24 && dy > -110 && dist < 160 && clearPath(e, pl)) { e.state = 'surface'; e.stateT = 0.55; e.facing = Math.sign(dx) || e.facing; sfx.ab2Bubble(); }
    return;
  }
  if (e.state === 'crouch') { e.vx = approach(e.vx, 0, 600 * dt); fall(); if (e.stateT <= 0) ab2Leap(e); return; }
  if (e.state === 'spit') { e.vx = approach(e.vx, 0, 600 * dt); fall(); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { ab2Spit(e, 2); e.state = 'walk'; e.atkCD = 2.2 + Math.random() * 0.8; } return; }
  // on dry rock: slow; back to the lava if there is any near, spitting at the hero on the way
  if (inL) { e.state = 'swim'; return; }
  e.lavaSeek = (e.lavaSeek || 0) - dt;
  if (e.lavaSeek <= 0) { e.lavaSeek = 1; e.lavaX = ab2FindLava(e); }
  if (e.lavaX != null) {
    const dir = Math.abs(e.lavaX - ecx) < 6 ? e.facing : Math.sign(e.lavaX - ecx);   // at the edge: keep going, in
    if (dir) e.facing = dir;
    e.vx = approach(e.vx, dir * (20 + e.lvl), 300 * dt);
    if (e.onGround && e.hitWall) e.vy = -220;
  } else {
    if (!aggro) ab2Wander(e, dt);
    const dir = aggro ? (Math.abs(dx) > 90 ? Math.sign(dx) : Math.abs(dx) < 20 ? 0 : 0) : e.wander;
    if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
    walk(e, dt, dir, 18 + e.lvl, 300, 230, dy, aggro);
  }
  fall();
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  if (dist < 44 && Math.abs(dy) < 30) { e.state = 'crouch'; e.stateT = 0.45; e.facing = Math.sign(dx) || e.facing; sfx.ab2Hiss(); }
  else if (dist < 170 && losClear(ecx + e.facing * 12, e.y + 2, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'spit'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.ab2Bubble(); }
};
function ab2Splash(x, y) { for (let i = 0; i < 14; i++) parts.push({ x: x + rnd(-8, 8), y: y - 1, vx: rnd(-50, 50), vy: rnd(-150, -50), g: 500, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#ffd070' : '#ff7a1a', size: 1, glow: i % 4 === 0 }); }

/* ---------- blows, deaths, spawning ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead) {
    if (e.type === 'cultista' && e.state === 'gone') return;   // nothing there to hit
    if (e.type === 'gargulainf' && (e.state === 'perch' || e.state === 'wake')) { mult *= 0.5; if (e.state === 'perch') { e.state = 'wake'; e.stateT = 0.3; e.facing = -dir || e.facing; } }   // stone
    if (e.type === 'rastejador' && (e.state === 'walk' || e.state === 'aim') && !rectSolid(e.x, e.y + 1, e.w, e.h)) { e.state = 'fall'; e.vy = 0; }   // knocked off the roof or the wall
    if (e.type === 'moscas') { const n = 6; for (let i = 0; i < n; i++) parts.push({ x: e.x + e.w / 2 + rnd(-6, 6), y: e.y + e.h / 2 + rnd(-6, 6), vx: rnd(-60, 60), vy: rnd(-60, 30), g: 200, life: 0.6, max: 0.6, col: '#0e120c', size: 1 }); if (e.state === 'engulf') { e.state = 'scatter'; e.stateT = 0.8; e.atkCD = Math.max(e.atkCD, 1.6); } }
  }
  return _hit(e, dir, mult, melee);
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (e.type === 'moscas') for (let i = 0; i < 26; i++) parts.push({ x: e.x + e.w / 2 + rnd(-10, 10), y: e.y + e.h / 2 + rnd(-8, 8), vx: rnd(-70, 70), vy: rnd(-90, 20), g: i % 3 ? 300 : -20, life: rnd(0.5, 1.2), max: 1.2, col: i % 4 ? '#0e120c' : '#3a4e26', size: 1 });
  if (e.type === 'cultista') { ab2Smoke(e.x + e.w / 2, e.y + e.h / 2, 18, 6); burst(e.x + e.w / 2, e.y + 6, 12, '#ff6a2a', 80, -40, 0.6, 1, true); }
  if (e.type === 'salamandra') burst(e.x + e.w / 2, e.y + e.h / 2, 16, '#ff9a2a', 110, 300, 0.6, 1, true);
  if (e.type === 'gargulainf') burst(e.x + e.w / 2, e.y + e.h / 2, 16, '#3d3935', 90, 400, 0.7, 2);
  return r;
}; }
// the gargoyle and some crawlers start on the roof; the salamander in the lava when it is spawned in it
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e) return e;
  const toRoof = () => { const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T), r = ab2Roof(tx, ty, 14); if (r >= 0 && ty - r >= 3 && !rectSolid(e.x, (r + 1) * T, e.w, e.h)) { e.y = (r + 1) * T; return true; } return false; };
  if (type === 'gargulainf') { if (toRoof()) { e.state = 'perch'; e.perchCD = 0.5; } else { e.state = 'hover'; e.stateT = 1; } }
  if (type === 'rastejador' && Math.random() < 0.6 && toRoof()) e.side = 'up';
  if (type === 'salamandra') { e.state = lavaIn(e.x, e.y, e.w, e.h + 2) ? 'swim' : 'walk'; e.lavaT = 9; }
  if (type === 'moscas') ab2FlySetup(e);
  return e;
}; }

/* ---------- the circles, the columns and the magma ---------- */
function ab2Update(dt) {
  // the hits that the stun skips: things in the air still fall
  for (const e of enemies) {
    if (e.dead || !(e.stun > 0)) continue;
    if (e.type === 'salamandra') { e.lavaT = 9; if (!lavaIn(e.x, e.y + e.h - 3, e.w, 3)) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); }
    else if (e.type === 'rastejador' && (e.state === 'fall' || e.state === 'drop') && !e.onGround) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
  }
  for (let i = ab2Cols.length - 1; i >= 0; i--) {
    const c = ab2Cols[i]; c.t += dt;
    if (c.t < c.track && !pl.dead) {   // the circle follows the hero for a moment, then stays where he stood
      const tx = Math.floor((pl.x + pl.w / 2) / T), fr = ab2FloorRow(tx, Math.floor((pl.y + pl.h - 1) / T), 7);
      if (fr >= 0) { c.x = lerp(c.x, pl.x + pl.w / 2, Math.min(1, dt * 10)); c.y = fr * T; }
    }
    if (c.t < c.mark) { if (Math.random() < dt * 14) parts.push({ x: c.x + rnd(-11, 11), y: c.y - 1, vx: 0, vy: rnd(-24, -8), g: -10, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#ff4a2a' : '#ffb050', size: 1, glow: true }); continue; }
    if (!c.lit) { c.lit = true; shake(2.5); sfx.ab2Pillar(); burst(c.x, c.y - 2, 16, '#ff9a2a', 120, -80, 0.6, 1, true); }
    if (!c.hit && !pl.dead && overlap({ x: c.x - 9, y: c.y - 50, w: 18, h: 50 }, pl)) { c.hit = true; const r = ab2Hurt(c.dmg, c.x, 'fogo'); if (r === 'hit') pl.vy = Math.min(pl.vy, -220); }
    if (Math.random() < dt * 40) parts.push({ x: c.x + rnd(-6, 6), y: c.y - rnd(4, 44), vx: rnd(-20, 20), vy: rnd(-90, -40), g: -40, life: 0.45, max: 0.45, col: Math.random() < 0.5 ? '#ffd070' : '#ff6a1a', size: 1, glow: true });
    if (c.t > c.mark + c.burn) { ab2Smoke(c.x, c.y - 10, 8, 5); ab2Cols.splice(i, 1); }
  }
  for (let i = ab2Globs.length - 1; i >= 0; i--) {
    const g = ab2Globs[i]; g.life -= dt; g.vy = Math.min(g.vy + 420 * dt, 420); g.x += g.vx * dt; g.y += g.vy * dt;
    if (Math.random() < dt * 30) parts.push({ x: g.x, y: g.y, vx: rnd(-8, 8), vy: rnd(-10, 10), g: 100, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ff9a2a' : '#a83a08', size: 1, glow: true });
    let end = g.life <= 0 || solidAt(Math.floor(g.x / T), Math.floor(g.y / T)) || (g.vy > 0 && tileAt(Math.floor(g.x / T), Math.floor(g.y / T)) === LAVA);
    if (!end && !pl.dead && g.x > pl.x - 3 && g.x < pl.x + pl.w + 3 && g.y > pl.y - 3 && g.y < pl.y + pl.h + 3) { ab2Hurt(g.dmg, g.x - Math.sign(g.vx) * 4, 'fogo'); end = true; }
    if (end) { burst(g.x, g.y, 10, '#ff8a2a', 80, 400, 0.45, 1, true); burst(g.x, g.y, 4, '#3a120c', 50, 400, 0.5); sfx.ab2Sizzle(); ab2Globs.splice(i, 1); }
  }
}
HOOK.update.push(ab2Update);
HOOK.drawTop.push((cx, cy) => {
  for (const c of ab2Cols) {
    const x = Math.round(c.x) - cx, y = Math.round(c.y) - cy;
    if (c.t < c.mark) {   // the circle: a burning ring on the floor, a turning star inside, brighter as it comes
      const k = c.t / c.mark, pulse = Math.floor(gameTime * 16) % 2, rx = 11, ry = 3;
      lc.fillStyle = k > 0.7 && pulse ? '#ffd070' : '#ff4a2a';
      for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283; lc.fillRect(Math.round(x + Math.cos(t) * rx), Math.round(y - 1 + Math.sin(t) * ry), 1, 1); }
      lc.fillStyle = '#b02a14';
      for (let p = 0; p < 5; p++) {
        const a0 = gameTime * 1.5 + p * 2.513, a1 = a0 + 2.513 * 2;
        for (let s = 0; s <= 8; s++) { const t = s / 8, ax = Math.cos(a0) * (rx - 2) * (1 - t) + Math.cos(a1) * (rx - 2) * t, ay = Math.sin(a0) * (ry - 0.6) * (1 - t) + Math.sin(a1) * (ry - 0.6) * t; lc.fillRect(Math.round(x + ax), Math.round(y - 1 + ay), 1, 1); }
      }
      if (k > 0.4) { lc.globalAlpha = (k - 0.4) * 1.4; lc.fillStyle = '#fff4c8'; for (let p = 0; p < 5; p++) { const a = gameTime * 1.5 + p * 1.2566; lc.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y - 1 + Math.sin(a) * ry), 1, 1); } lc.globalAlpha = 1; }
      continue;
    }
    // the column: a roaring pillar of flame, rows of grainy fire, hot white at the core
    const u = (c.t - c.mark) / c.burn, H = Math.round(50 * Math.min(1, u * 6) * (u > 0.75 ? 1 - (u - 0.75) * 2.4 : 1)), fr = Math.floor(gameTime * 24);
    const ramp = ['#3a0c02', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8'];
    for (let r = 0; r < H; r++) {
      const t = r / Math.max(1, H), w = Math.round((8 - t * 4) * (1 + Math.sin(r * 0.7 + fr * 0.9) * 0.15) + hash2(r, fr, 7) * 2);
      for (let i = -w; i <= w; i++) {
        const d = Math.abs(i) / (w + 0.01), n = hash2(i + 20, r + fr * 3, 11);
        if (d > 0.8 && n < 0.45) continue;
        const v = Math.max(0, Math.min(5, Math.floor((1 - d) * 5.2 - t * 1.6 + n * 1.3)));
        lc.fillStyle = ramp[v]; lc.fillRect(x + i, y - 1 - r, 1, 1);
      }
    }
  }
  for (const g of ab2Globs) {   // a glob of magma: a dark crust round a white-hot heart
    const x = Math.round(g.x) - cx, y = Math.round(g.y) - cy;
    lc.fillStyle = '#3a120c'; lc.fillRect(x - 2, y - 1, 4, 3); lc.fillRect(x - 1, y - 2, 2, 5);
    lc.fillStyle = '#e06414'; lc.fillRect(x - 1, y - 1, 2, 2); lc.fillStyle = '#ffd070'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
  for (const e of enemies) {   // the ripple of the lava round a swimming salamander
    if (e.dead || e.type !== 'salamandra' || e.lavaTop === undefined || (e.state !== 'swim' && e.state !== 'surface')) continue;
    const y = Math.round(e.lavaTop) - cy, x0 = Math.round(e.x) - cx, f = Math.floor(gameTime * 8);
    for (let i = -4; i < e.w + 4; i++) { const h = hash2(i, f, 3); if (h < 0.35) continue; lc.fillStyle = h > 0.8 ? '#fff4c8' : '#ffb050'; lc.fillRect(x0 + i, y - (h > 0.9 ? 1 : 0), 1, 1); }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = AB2.GL;
  for (const c of ab2Cols) {
    if (c.t < c.mark) { lc.globalAlpha = 0.25 + c.t / c.mark * 0.5; lc.drawImage(G.rune, c.x - cx - 18, c.y - cy - 18 + 2, 36, 24); }
    else { const u = (c.t - c.mark) / c.burn; lc.globalAlpha = 0.9 * (u > 0.75 ? 1 - (u - 0.75) * 4 : 1); lc.drawImage(G.col, c.x - cx - 30, c.y - cy - 54, 60, 72); }
  }
  for (const g of ab2Globs) { lc.globalAlpha = 0.7; lc.drawImage(G.ember, g.x - cx - 8, g.y - cy - 8); }
  for (const e of enemies) {
    if (e.dead) continue;
    const x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy;
    if (e.type === 'cultista') {
      const vis = e.vis === undefined ? 1 : e.vis;
      if (e.state === 'cast') for (const s of [-1, 1]) { lc.globalAlpha = 0.38 * vis; lc.drawImage(G.fire, x + s * 4 * e.facing - 14, e.y - cy - 4 - 14); }
      else { lc.globalAlpha = 0.3 * vis; lc.drawImage(G.ember, x + e.facing * 1 - 8, e.y - cy + 9 - 8); }   // the sigil on his chest
      if (e.state === 'vanish' || e.state === 'appear') { lc.globalAlpha = 0.3 * (1 - Math.abs(vis - 0.5) * 2); lc.drawImage(G.fire, x - 14, y - 14); }
    } else if (e.type === 'salamandra') { lc.globalAlpha = e.state === 'spit' || e.state === 'surface' || e.state === 'crouch' ? 0.8 : 0.4; lc.drawImage(G.warm, x - 12, y - 12 - 2); }
    else if (e.type === 'gargulainf' && e.state !== 'perch') { lc.globalAlpha = e.state === 'wake' ? 0.25 + Math.sin(e.t * 30) * 0.15 : 0.35; lc.drawImage(G.ember, x - 8, y - 8); }
  }
  lc.globalAlpha = 1;
});
function clearAb2Fx() { ab2Cols.length = 0; ab2Globs.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearAb2Fx(); ab2Tables(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  ab2Skitter() { noise(0.03, 0.025, 3800, 'bandpass', 0, 2); noise(0.03, 0.02, 3000, 'bandpass', 0.06, 2); },
  ab2Click() { for (let k = 0; k < 4; k++) noise(0.02, 0.05, 2600, 'highpass', k * 0.07); tone(90, 0.3, 'sawtooth', 0.02, -30); },
  ab2Shriek() { tone(900, 0.35, 'sawtooth', 0.03, -600); tone(1240, 0.3, 'square', 0.015, -800, 0.03); noise(0.3, 0.04, 2000, 'bandpass'); },
  ab2Hiss() { noise(0.25, 0.05, 4200, 'highpass'); tone(160, 0.2, 'sawtooth', 0.02, -60); },
  ab2Rip() { noise(0.12, 0.08, 900, 'bandpass', 0, 1.5); tone(120, 0.1, 'square', 0.03, -60); },
  ab2Thud() { tone(60, 0.2, 'sine', 0.07, -25); noise(0.15, 0.06, 400, 'lowpass'); },
  ab2Poof() { noise(0.35, 0.07, 700, 'lowpass'); tone(320, 0.3, 'triangle', 0.025, -260); tone(90, 0.35, 'sawtooth', 0.02, -40, 0.05); },
  ab2Chant() { tone(98, 0.9, 'sawtooth', 0.025, -6); tone(147, 0.85, 'sawtooth', 0.018, -8, 0.05); tone(104, 0.8, 'triangle', 0.02, 4, 0.1); noise(0.8, 0.02, 1800, 'bandpass', 0, 3); },
  ab2Pillar() { noise(0.7, 0.16, 500, 'lowpass'); tone(70, 0.6, 'sawtooth', 0.06, -30); noise(0.5, 0.06, 2400, 'bandpass', 0.05, 1); },
  ab2Crack() { noise(0.06, 0.08, 1400, 'bandpass', 0, 2); noise(0.06, 0.07, 1100, 'bandpass', 0.12, 2); tone(55, 0.3, 'sine', 0.05, -15); },
  ab2Swoop() { noise(0.6, 0.06, 600, 'bandpass', 0, 0.8); tone(240, 0.5, 'triangle', 0.02, 260); },
  ab2Flap() { noise(0.08, 0.03, 500, 'lowpass'); },
  ab2Land() { tone(70, 0.15, 'sine', 0.05, -20); noise(0.12, 0.05, 900, 'lowpass'); },
  ab2Buzz(loud) { const v = loud ? 0.022 : 0.01; tone(176, 0.7, 'sawtooth', v, 14); tone(183, 0.7, 'sawtooth', v * 0.8, -10, 0.02); tone(352, 0.5, 'square', v * 0.3, 20, 0.05); },
  ab2Bubble() { for (let k = 0; k < 3; k++) tone(220 + k * 70, 0.08, 'sine', 0.04, 260, k * 0.09); noise(0.3, 0.03, 500, 'lowpass'); },
  ab2Splash() { noise(0.35, 0.08, 800, 'lowpass'); tone(140, 0.2, 'sine', 0.04, -80); },
  ab2Spit() { noise(0.15, 0.07, 900, 'bandpass'); tone(260, 0.12, 'square', 0.025, -180); },
  ab2Sizzle() { noise(0.3, 0.05, 3600, 'highpass'); }
});
