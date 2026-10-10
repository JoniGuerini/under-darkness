'use strict';

/* ================= as Minas Fúngicas: blocks, back walls, far layer, ores, decorations =================
   The living ground: blue-grey schist in thin slanted laminae with films of water running down it, the same
   schist under a lumpy pale crust of mycelium (the taken rock), black-violet spore soil that crumbles in the
   hand, grey-green mud with wet glints, the colony's waterlogged planks gone soft and grey, beams with bracket
   fungi growing out of them, grey-green colony brick with threads in the joints, the fibrous dirty white stalk
   and the teal cap of the giant mushrooms (the cap's gills glow on its underside), pale pink mycelium flesh,
   swollen spore sacs, the living floor and the woven wall of the boss hall. Coal comes back in the schist;
   esporita, the layer's metal, sits on it as green-blue plates held by mycelium threads, with a faint light.
   Like 80-mina-blocos, every material is a seamless 240x240 texture sampled in world pixels; outline, lit edge,
   shade and ambient occlusion come from 07-chunks-luz. Back walls and the far layer only read the tone (.v),
   so they carry no colour accents. Small decorations (a mycelium cord and a colony ladder you can climb, lantern
   mushrooms, a tuft, hanging threads, a sap drip, a spore cluster, bones with sprouts, the colony's oil lamp,
   reeds, slimy pebbles, a taken prop from floor to roof) are 12x12 sprites on ramps lit from the top left.
   The cap's gills, the drip's drop and the glows are drawn live; a broken spore sac lets out a cloud.
   Ids: 120-fungo-api. */
const FGART = {};   // helpers shared with 122-fungo-objetos, the Tomados (123, 124) and the boss (126)
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
/* ---- palettes: 6 shades, dark to light (card section 12 where it gives one) ---- */
pal('fgXisto', ['#12181c', '#1e282e', '#2c3a40', '#3e5056', '#56686c', '#7a8c8c']);
pal('fgTomada', ['#1a2024', '#2e383a', '#4a5652', '#74807a', '#a8b2a6', '#d8e0d0']);
pal('fgHumus', ['#120f14', '#1e1a22', '#2c2632', '#3c3444', '#504658', '#6a5e70']);
pal('fgLodo', ['#101412', '#1a201d', '#262e2a', '#323c37', '#424e47', '#56625a']);
pal('fgTabua', ['#121110', '#1e1c19', '#2c2924', '#3c3830', '#4e483d', '#62594b']);
pal('fgViga', ['#0e0c0a', '#1a1612', '#28211a', '#372d23', '#483b2d', '#5a4a38']);
pal('fgTijolo', ['#121614', '#1e2420', '#2c342e', '#3c463e', '#4e5a50', '#647064']);
pal('fgTronco', ['#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4']);
pal('fgChapeu', ['#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']);
pal('fgCarne', ['#2a1a20', '#4a2c34', '#74464e', '#a0686c', '#c89490', '#ecc8bc']);
pal('fgBolsa', ['#1a1912', '#33311f', '#524f30', '#7a7648', '#a39e6a', '#ccc496']);
pal('fgVivo', ['#201a1a', '#3a2e2e', '#5c4c46', '#867664', '#b0a286', '#d6caa8']);
pal('fgBarreira', ['#141216', '#252126', '#3b353a', '#585150', '#7e7568', '#a69a84']);
// back walls: always far darker than the ground in front
pal('fgXistoW', ['#080b0d', '#0c1013', '#101519', '#141b1f', '#192126', '#1e272d']);
pal('fgTabuadoW', ['#0a0908', '#0f0d0b', '#14120f', '#1a1713', '#201c17', '#26221c']);
pal('fgHumusW', ['#09080b', '#0d0b10', '#121016', '#16141b', '#1b1821', '#211d27']);
pal('fgMicelioW', ['#0a0b0b', '#101211', '#161917', '#1d201d', '#252723', '#2e2f29']);
pal('fgCarneW', ['#0e0809', '#140b0d', '#1b0f12', '#221317', '#2a181c', '#321d21']);
// the far layer behind the walls: the top shades turn to the cyan glow of the caps
pal('dpFgRocha', ['#04070a', '#070b0e', '#0a1013', '#0e1518', '#121b1e', '#172225']);
pal('dpFgChapeus', ['#03070a', '#050d10', '#081418', '#0c1e22', '#12303a', '#1a4a50']);
pal('dpFgColonia', ['#040606', '#080b0a', '#0c100f', '#111614', '#161d1a', '#1e2723']);

const wrapT = v => ((v % TP) + TP) % TP;
const RAMPX = hexes => hexes.map(h => ph(h));
const WATER = RAMPX(['#3e5a62', '#6a8c94', '#9cbcc0', '#c4dcd8']);          // films of water on the schist
const MYC = RAMPX(['#4a4436', '#7a705a', '#a89c7e', '#cabf9c', '#e2d8b6']);  // mycelium: cream, never white
const SPORE = RAMPX(['#1a2a14', '#2e4a1e', '#4e7a2e', '#7aac48']);           // spores, slime, moss
const FUNGI = RAMPX(['#3a2c1c', '#5e4a2e', '#86703e', '#ac9658', '#cdb886']); // bracket fungi on the beams
const RUSTF = RAMPX(['#2a1a10', '#46281a', '#5e3a22']);
const GILL = RAMPX(['#16444a', '#2a8a86', '#5ac0b4', '#9ae8d8']);
const PINK = RAMPX(['#5a2e3a', '#8a4a58', '#b87480']);                      // the flesh's veins
const WETP = RAMPX(['#d8b0a8', '#f0d4c8']);
const SAC = RAMPX(['#2e3a1c', '#46582a', '#5e7634']);

/* ---- solid ground ---- */
function vXisto(x, y) {   // wet schist: slanted laminae, gently crumpled, thick and thin, mica on the lit lips, films of water running down
  const fol = y + cn(x, y, 4, 3, 12101) * 16 + cn(x, y, 12, 8, 12102) * 4, b = ((fol % 10) + 10) % 10, tone = cn(x, y, 6, 20, 12110);
  let v = 2.6 + (b < 1 ? -1.3 : b < 2 ? 0.9 : b < 6.5 ? 0.1 + tone * 1.8 : b < 7.3 ? -0.6 : 0.3 + tone) + cn(x, y, 30, 30, 12103) * 0.8 + cg(x, y, 12104) * 0.45;
  if (b >= 1 && b < 2 && hash2(x, y, 12105) < 0.08) v += 1.3;                          // a mica glint
  const damp = cn(x, y, 6, 3, 12106);
  if (damp > 0.16) {   // in the damp patches, water runs down the face in short films with a dark edge
    const sx = x + cn(x, y, 20, 4, 12107) * 10, k = ((sx % 20) + 20) % 20, run = cn(x, y, 20, 12, 12111) > 0.08;
    if (k < 0.9 && run) { MATX = WATER[damp > 0.26 && hash2(x, y, 12112) < 0.35 ? 1 : 0]; return -9; }
    if (k < 1.8 && run) v -= 0.6; else if (k > 19.2 && run) v += 0.5;
  }
  if (damp > 0 && hash2(x, y, 12108) < 0.004) { MATX = WATER[3]; return -9; }                // a drop
  if (Math.abs(cn(x, y, 24, 24, 12109)) < 0.006) v -= 1.4;                                   // a joint
  return v;
}
const crust = (x, y) => cn(x, y, 12, 12, 12118) + cn(x, y, 30, 30, 12119) * 0.35;
function vTomada(x, y) {   // taken rock: the schist under a lumpy crust of mycelium, fibres in the crust, threads creeping out over the rock
  const m = crust(x, y), CUT = 0.07;
  if (m > CUT) {
    const lit = crust(x - 1.5, y - 1.5) <= CUT, sh = crust(x + 1.5, y + 1.5) <= CUT;
    const f = Math.sin(x * 0.8 + y * 0.45 + cn(x, y, 16, 16, 12113) * 18), g = cg(x, y, 12114);
    let v = 3.0 + Math.min(0.7, (m - CUT) * 5) + f * 0.3 + g * 0.4;
    if (lit) v += 1.0; if (sh) v -= 1.2;
    const c = cells(x, y, 9, 12115, 1); v += -(c.ox + c.oy) * 0.12 + (c.d2 - c.d1 < 0.8 && c.ox + c.oy > 0 ? -0.6 : 0);   // soft lumps, each lit from the top left
    if (!lit && !sh && f > 0.75 && g > 0.15) { MATX = MYC[g > 0.38 ? 4 : 3]; return -9; }    // a cream fibre
    if (hash2(x, y, 12116) < 0.006) v -= 1.2;                                                // a pore
    return v;
  }
  if (crust(x - 1.5, y - 1.5) > CUT) return 0.6;                                             // the crust's shadow on the rock
  if (m > -0.03 && Math.abs(cn(x, y, 20, 20, 12117)) < 0.01) { MATX = MYC[m > 0.02 ? 2 : 1]; return -9; }   // threads
  const v = vXisto(x, y); return v === -9 ? v : Math.min(v - 0.3, 3.2);
}
function vHumus(x, y) {   // spore soil: soft black-violet crumbs, clods with a lit rim, pale spore specks and fine threads
  let v = 2.5 + cn(x, y, 24, 24, 12121) * 1.4 + cn(x, y, 80, 80, 12122) * 0.6 + cg(x, y, 12123) * 1.0;
  const c = cells(x, y, 9, 12124, 1.1), e = c.d2 - c.d1;
  if (c.id < 0.45) { if (e < 1) v -= 1.1; else if (e < 2.2) v += c.ox + c.oy < 0 ? 0.9 : -0.4; }   // clods
  if (hash2(x, y, 12125) < 0.05) v -= 1.2;                                                   // air between the crumbs
  if (hash2(x, y, 12126) < 0.006) { MATX = MYC[hash2(x, y, 12127) < 0.3 ? 2 : 1]; return -9; }   // a spore speck
  if (Math.abs(cn(x, y, 30, 30, 12128)) < 0.004 && cn(x, y, 8, 8, 12129) > 0.05) { MATX = MYC[0]; return -9; }   // a thread
  return v;
}
function vLodo(x, y) {   // mud: smooth smears laid flat by the water, little stones in it, a bubble hole, wet glints
  const sm = Math.sin(y * 0.55 + cn(x, y, 6, 4, 12131) * 9 + Math.sin(x * Math.PI / 30) * 1.2);
  let v = 2.6 + sm * 0.5 + cn(x, y, 30, 30, 12132) * 1.1 + cg(x, y, 12133) * 0.35;
  if (sm > 0.88) v += 0.6;
  const c = cells(x, y, 12, 12134);
  if (c.id < 0.12 && c.d1 < 1.7) { MATX = (c.ox + c.oy < -0.4 ? WATER[1] : c.ox + c.oy > 0.6 ? RAMPX(['#141a18'])[0] : WATER[0]); return -9; }   // a stone
  if (c.id > 0.9 && c.d1 < 1.4) return c.oy < 0 ? 0.5 : 3.8;                                 // a bubble hole with a lit lower lip
  if (sm > 0.8 && hash2(x, y, 12135) < 0.06) { MATX = WATER[hash2(x, y, 12136) < 0.4 ? 2 : 1]; return -9; }   // wet glints
  if (cn(x, y, 10, 10, 12137) > 0.3 && hash2(x, y, 12138) < 0.25) { MATX = SPORE[1]; return -9; }            // green slime
  return v;
}
function vTabua(x, y) {   // rotten planks: boards 6 px thick, grey and swollen, soft rot, a board gone, threads in the gaps, a rusty nail
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, L = 40 + (hash2(row, 0, 12141) * 3 | 0) * 8, off = hash2(row, 1, 12142) * TP, lx = wrapT(x + off) % L, board = Math.floor(wrapT(x + off) / L);
  if (ly === 5) { if (hash2(x, y, 12143) < 0.3 && cn(x, y, 8, 8, 12144) > 0) { MATX = MYC[1]; return -9; } return 0.4; }   // the gap, threads coming through
  if (lx < 1) return 0.8;
  let v = 3.0 + (hash2(board, row, 12145) - 0.5) * 1.1 + (ly === 0 ? 0.9 : ly === 4 ? -0.8 : 0) + cg(x, y, 12146) * 0.35;
  v += Math.sin((x + off) * 0.19 + Math.sin((x + off) * 0.05 + row) * 3 + ly * 1.3) * 0.4;   // the grain
  const rot = cn(x, y, 14, 14, 12147); if (rot > 0.2) v -= (rot - 0.2) * 9;                    // soft rot, darker and pitted
  if (rot > 0.3 && hash2(x, y, 12148) < 0.3) return 0.6;
  if (rot > 0.16 && rot < 0.2 && hash2(x, y, 12149) < 0.5) { MATX = MYC[hash2(x, y, 12150) < 0.5 ? 1 : 2]; return -9; }   // threads round the rot
  if ((lx === 2 || lx === L - 3) && ly === 2) { MATX = RUSTF[2]; return -9; }
  if ((lx === 2 || lx === L - 3) && ly === 3) { MATX = RUSTF[0]; return -9; }
  return v;
}
function vViga(x, y) {   // a taken beam: long dark grain and checks, bracket fungi growing out of it in shelves
  const c = cells(x, y, 24, 12151, 1);
  if (c.id < 0.55) {   // a bracket: a half disc, lit on top, ringed, a dark shadow under it
    const r = 4 + c.id * 8, dx = c.ox, dy = c.oy;
    if (dy <= 0.5 && Math.hypot(dx, dy * 1.6) < r) {
      const d = Math.hypot(dx, dy * 1.6) / r, ring = (d * 4 + c.id * 3) % 1;
      MATX = FUNGI[Math.max(0, Math.min(4, Math.round(3.4 - d * 1.6 + (dy < -r * 0.3 ? 0.6 : 0) - (dx > r * 0.5 ? 0.8 : 0) - (ring < 0.18 ? 1 : 0) + (d > 0.85 ? 0.6 : 0))))]; return -9;
    }
    if (dy > 0.5 && dy < 2.6 && Math.abs(dx) < r * 0.9) return 0.4;                            // the shadow under the shelf
  }
  let v = 2.8 + cn(x, y, 4, 40, 12152) * 1.6 + Math.sin(y * 1.1 + cn(x, y, 6, 20, 12153) * 6) * 0.45 + cg(x, y, 12154) * 0.3;
  if (Math.abs(cn(x, y, 5, 60, 12155)) < 0.012) v -= 1.6;                                    // a check
  if (Math.abs(cn(x, y, 5, 60, 12155)) < 0.02 && hash2(x, y, 12156) < 0.3) { MATX = MYC[1]; return -9; }   // threads in the check
  const wet = cn(x, y, 10, 6, 12157); if (wet > 0.25) v -= 0.8;
  return v;
}
function vTijolo(x, y) {   // colony brick: 12 x 6 courses, grey-green, each brick its own shade, damp rising, threads along the mortar
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, off = row % 2 ? 6 : 0, lx = wrapT(x + off) % 12, bk = Math.floor(wrapT(x + off) / 12);
  if (ly === 5 || lx === 11) {   // mortar, with the fungus following it
    if (cn(x, y, 8, 8, 12161) > 0.16 && hash2(x, y, 12162) < 0.45) { MATX = MYC[hash2(x, y, 12163) < 0.3 ? 2 : 1]; return -9; }
    return 0.7 + cg(x, y, 12164) * 0.4;
  }
  let v = 3.0 + (hash2(bk, row, 12165) - 0.5) * 1.3 + (ly === 0 ? 0.9 : ly === 4 ? -0.6 : 0) + (lx === 0 ? 0.5 : lx === 10 ? -0.5 : 0) + cg(x, y, 12166) * 0.5;
  const damp = cn(x, y, 12, 6, 12167); if (damp > 0.08) v -= (damp - 0.08) * 6;
  if (Math.abs(cn(x, y, 30, 30, 12168)) < 0.009) v -= 1.5;                                   // a crack
  if (hash2(bk, row, 12169) < 0.07 && damp > 0.15 && hash2(x, y, 12170) < 0.4) { MATX = SPORE[hash2(x, y, 12171) < 0.5 ? 1 : 2]; return -9; }   // moss
  return v;
}
function vTronco(x, y) {   // a giant mushroom's stalk: long fibres running up, grooves between bundles, dirt stains, a few scales peeling
  const wx = x + cn(x, y, 3, 8, 12181) * 22 + Math.sin(y * Math.PI / 60) * 2;
  const f = Math.sin(wx * 1.05), bund = Math.sin(wx * 0.26 + cn(x, y, 6, 4, 12182) * 4);
  let v = 3.4 + f * 0.45 + bund * 0.6 + cn(x, y, 20, 60, 12183) * 0.8 + cg(x, y, 12184) * 0.35;
  if (bund < -0.9) v -= 1.1;                                                                 // a groove
  if (bund > 0.92) v += 0.6;
  const dirt = cn(x, y, 12, 30, 12185); if (dirt > 0.18) v -= (dirt - 0.18) * 8;
  const sc = cells(x, y, 15, 12186, 1.6); if (sc.id < 0.25 && sc.oy > -1 && sc.oy < 1.3 && Math.abs(sc.ox) < 3) v += sc.oy < 0.2 ? 1 : -1.2;   // a peeling scale
  return v;
}
function vChapeu(x, y) {   // a giant cap's flesh: teal skin, raised pale scales, faint bands, wet glints
  const band = Math.sin(y * 0.5 + cn(x, y, 8, 4, 12191) * 8);
  let v = 2.0 + band * 0.4 + cn(x, y, 24, 24, 12192) * 1.0 + cg(x, y, 12193) * 0.4;
  const c = cells(x, y, 10, 12194, 1.2);
  if (c.id < 0.5) { const r = c.d1 / (1.4 + c.id * 3); if (r < 1) return 3.4 + (1 - r) * 0.8 - (c.ox + c.oy) * 0.18; if (r < 1.35 && c.oy > 0) return 1.0; }   // scales and their shadow
  if (hash2(x, y, 12195) < 0.012) v += 1.6;                                                  // a spore pore catching the light
  return v;
}
function vCarne(x, y) {   // mycelium flesh: soft braided strands, pores, darker veins, cream threads and a wet sheen
  const wx = x + cn(x, y, 6, 6, 12201) * 34, wy = y + cn(x, y, 5, 7, 12202) * 30;
  const st = Math.sin(wx * 0.42 + wy * 0.42 + Math.sin(wy * 0.21) * 1.5);
  let v = 2.9 + st * 0.55 + cn(x, y, 26, 26, 12203) * 1.1 + cg(x, y, 12204) * 0.4;
  if (st < -0.88) v -= 1.0; else if (st > 0.9) v += 0.5;
  const vn = Math.abs(cn(wx, wy, 12, 12, 12205));
  if (vn < 0.008) { MATX = PINK[vn < 0.004 ? 0 : 1]; return -9; }
  if (vn < 0.016) v -= 0.7;
  const p = cells(x, y, 10, 12206); if (p.id < 0.25 && p.d1 < 1.2) return p.oy < 0 ? 0.8 : 3.6;   // a pore
  if (Math.abs(cn(x, y, 30, 30, 12207)) < 0.005) { MATX = MYC[2]; return -9; }
  if (hash2(x, y, 12208) < 0.005 && st > 0.3) { MATX = WETP[hash2(x, y, 12209) < 0.3 ? 1 : 0]; return -9; }
  return v;
}
function vBolsa(x, y) {   // spore sacs: one big swollen sac per block and a small one beside it, thin skin with the spores dark inside
  const gx = Math.floor(wrapT(x) / 12), gy = Math.floor(wrapT(y) / 12), lx = wrapT(x) % 12 + 0.5, ly = wrapT(y) % 12 + 0.5, h = hash2(gx, gy, 12211);
  const sacs = [[5.6 + (h - 0.5) * 1.6, 6 + (hash2(gx, gy, 12212) - 0.5) * 1.4, 4.4 + h * 0.9], [h < 0.5 ? 10.4 : 1.6, h < 0.3 ? 2 : 10, 2.0]];
  for (const [cx, cy, r] of sacs) {
    const dx = (lx - cx) / r, dy = (ly - cy) / (r * 0.92), d = Math.hypot(dx, dy);
    if (d > 1) continue;
    let v = 3.3 - (dx + dy) * 1.0 - d * d * 1.1 + cg(x, y, 12213) * 0.2;
    if (Math.hypot(dx + 0.42, dy + 0.42) < 0.2) v = 5.6; else if (Math.hypot(dx + 0.42, dy + 0.42) < 0.32) v += 0.8;   // the sheen on the taut skin
    if (d < 0.7 && d > 0.25 && hash2(x, y, 12214) < 0.06) { MATX = SAC[hash2(x, y, 12215) < 0.5 ? 0 : 1]; return -9; }   // spores showing through
    if (d > 0.6 && Math.abs(Math.sin(Math.atan2(dy, dx) * 4 + h * 9)) < 0.12 && dx + dy > 0) v -= 0.8;   // creases on the shaded side
    return v;
  }
  let v = 0.9 + cg(x, y, 12216) * 0.5;                                                         // the crevices between them
  if (Math.abs(cn(x, y, 24, 24, 12217)) < 0.03) { MATX = MYC[1]; return -9; }
  return v;
}
function vVivo(x, y) {   // living mycelium: a dense mat of cream threads woven two ways, the flesh showing pink between them, a glint of wet
  const a = Math.sin((x + y * 0.6) * 0.9 + cn(x, y, 10, 10, 12221) * 10), b = Math.sin((x - y * 0.8) * 0.75 + cn(x, y, 10, 10, 12222) * 10);
  const top = Math.max(a, b);
  if (top < -0.3 && cn(x, y, 16, 16, 12223) > -0.05) { MATX = PINK[top < -0.7 ? 1 : 2]; return -9; }   // flesh between the threads
  let v = 2.8 + top * 1.0 + cn(x, y, 30, 30, 12224) * 0.8 + cg(x, y, 12225) * 0.3;
  if (top > 0.9) v += 0.6;
  if (hash2(x, y, 12226) < 0.004) { MATX = WETP[1]; return -9; }
  return v;
}
function vBarreira(x, y) {   // the mother's wall: thick upright cords of mycelium, twisted, bound by cross bands, dark gaps between
  const k = Math.floor(wrapT(x) / 8), sway = Math.sin(y * Math.PI / 30 + k * 1.7) * 1.2, lx = wrapT(x + sway) % 8, cy = wrapT(y + k * 9) % 40;
  if (cy < 5) {   // a band of cords wound across
    const tw = ((x + cy * 2) % 6 + 6) % 6;
    return (cy === 0 ? 1.2 : cy === 4 ? 1.0 : 3.6) + (tw < 1 ? -1 : tw < 2.5 ? 0.6 : 0) + cg(x, y, 12231) * 0.4;
  }
  if (lx > 6.3) return 0.3;
  const tw = ((y + lx * 1.2 + k * 3) % 4 + 4) % 4;
  let v = (lx < 1.5 ? 4.2 : lx < 4 ? 3.4 : 2.2) + (tw < 0.9 ? -1.4 : tw < 1.9 ? 0.8 : 0) + cg(x, y, 12232) * 0.35;
  if (hash2(k, Math.floor(wrapT(y) / 20), 12233) < 0.15 && tw > 3.6) v += 0.8;
  return v;
}

/* ---- back walls ---- */
function vXistoW(x, y) { const v = vXisto(x, y); return v === -9 ? 3.6 : v; }
function vTabuadoW(x, y) {   // upright boards swollen with damp: each one bulges, warps, rots at the foot; a batten every 48 px
  const col = Math.floor(wrapT(x) / 8), lx = wrapT(x) % 8, by = wrapT(y + hash2(col, 0, 12241) * 20) % 48;
  if (lx === 7) return 0.4;
  if (by < 5) return by === 0 ? 4 : by === 4 ? 1.2 : 3.2 + cg(x, y, 12242) * 0.3;
  let v = 2.7 + (hash2(col, 1, 12243) - 0.5) * 1.1 + (3.5 - Math.abs(lx - 3)) * 0.22 - (lx === 6 ? 0.6 : 0) + Math.sin(y * 0.16 + Math.sin(y * 0.03 + col) * 3 + lx) * 0.35 + cg(x, y, 12244) * 0.3;
  const rot = cn(x, y, 10, 10, 12245); if (rot > 0.18) v -= (rot - 0.18) * 8;
  if (Math.abs(cn(x, y, 20, 20, 12246)) < 0.008) v = 4.2;                                     // a thread across
  return v;
}
function vHumusW(x, y) { const v = vHumus(x, y); return v === -9 ? 3.4 : v; }
function vMicelioW(x, y) {   // rock with a fine net of threads over it, denser in patches
  let v = 2.1 + cn(x, y, 24, 24, 12251) * 1.2 + cg(x, y, 12252) * 0.4;
  const dens = cn(x, y, 8, 8, 12253), n1 = Math.abs(cn(x, y, 20, 20, 12254)), n2 = Math.abs(cn(x * 1.5, y, 40, 40, 12255));
  if (n1 < 0.01 + Math.max(0, dens) * 0.02) return 4.4 - n1 * 60;
  if (dens > 0.05 && n2 < 0.008) return 3.8;
  if (dens > 0.2) v += 0.7;
  return v;
}
function vCarneW(x, y) {   // a wall of flesh: soft rounded folds, pores, the dark between the folds
  const wx = x + cn(x, y, 4, 8, 12261) * 40, f = Math.sin(wx * 0.26 + Math.sin(y * 0.08) * 1.2);
  let v = 2.6 + f * 1.0 + cn(x, y, 30, 30, 12262) * 0.8 + cg(x, y, 12263) * 0.4;
  if (f < -0.85) v -= 1;
  const p = cells(x, y, 12, 12264); if (p.id < 0.2 && p.d1 < 1.3) v = 0.8;
  return v;
}

/* ---- far layer ---- */
function vDpFgRocha(x, y) {   // far wet schist: the laminae wide and soft, a damp sheen in streaks
  const b = ((y - x * 0.1 + cn(x, y, 4, 6, 12301) * 30) % 24 + 24) % 24; let v = 2.2 + cn(x, y, 30, 30, 12302) * 1.2 + cg(x, y, 12303) * 0.35;
  if (b < 6) v -= 0.8; else if (b < 8) v += 0.6;
  if (cn(x, y, 16, 6, 12304) > 0.25) v += 0.6;
  return v;
}
function vDpFgChapeus(x, y) {   // giant mushrooms far off, black against the cyan glow of the caps behind them
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 40), k = Math.floor(xx / 60), lx = xx % 60;
  const sky = 1.4 + Math.max(0, 1 - Math.abs(by - 46) / 52) * 2.8 + cn(x, y, 16, 8, 12311) * 0.8 + cg(x, y, 12312) * 0.25;
  const ground = 106 + Math.sin(x * Math.PI / 30) * 2 + cn(x, y, 12, 4, 12313) * 6;
  if (by > ground) return 0.7 + cg(x, y, 12314) * 0.3;
  const capY = 28 + hash2(k, band, 12315) * 38, cw = 12 + hash2(k, band, 12316) * 9, sw = 2 + hash2(k, band, 12317) * 2.2, cx = 30 + (hash2(k, band, 12318) - 0.5) * 10, ch = cw * 0.5, dx = lx - cx;
  if (by <= capY + 1 && by >= capY - ch && (dx * dx) / (cw * cw) + ((capY + 1 - by) * (capY + 1 - by)) / (ch * ch) <= 1) return 0.7 + (dx < -cw * 0.4 && by < capY - ch * 0.5 ? 0.5 : 0) + cg(x, y, 12319) * 0.2;   // the cap
  if (by > capY + 1 && by < capY + 3.5 && Math.abs(dx) < cw * 0.92) return 4.6 - (by - capY) * 0.5;   // the gills glowing under the rim
  const sx = cx + Math.sin(by * 0.05 + k) * 2.5;
  if (by > capY && Math.abs(lx - sx) < sw + Math.max(0, by - ground + 8) * 0.25) return 0.9 + (lx < sx ? 0.3 : 0) + cg(x, y, 12320) * 0.2;   // the stalk
  const s2 = hash2(k, band, 12321), sx2 = (s2 * 50 + 5), sy2 = ground - 6 - s2 * 10;   // a small one in front of the glow
  if (Math.abs(lx - sx2) < 1.2 && by > sy2 && by < ground + 1) return 0.8;
  if (by <= sy2 && by > sy2 - 3 && Math.abs(lx - sx2) < 4 - (sy2 - by)) return 0.8;
  return sky;
}
function vDpFgColonia(x, y) {   // the colony far back: houses with pitched roofs, posts and beams, all hung with threads; a dim window
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 30), k = Math.floor(xx / 80), lx = xx % 80;
  let bg = 2.5 + cn(x, y, 20, 20, 12331) * 0.8 + cg(x, y, 12332) * 0.3 - Math.abs(by - 60) / 90;
  const ground = 108;
  if (by >= ground) return 0.7 + cg(x, y, 12333) * 0.3;
  const hw = 18 + hash2(k, band, 12334) * 10, hh = 22 + hash2(k, band, 12335) * 16, c0 = 40 - hw, roofH = hw * 0.55, top = ground - hh;
  const inX = lx >= c0 && lx < c0 + hw * 2;
  if (inX && by >= top) {   // the house: planks, a door, a dim window
    const ux = lx - c0;
    if (ux > hw - 3 && ux < hw + 3 && by > ground - 11) return 0.5;
    if (hash2(k, band, 12336) < 0.6 && ux > hw * 0.35 && ux < hw * 0.35 + 4 && by > top + 5 && by < top + 9) return 3.4 + cg(x, y, 12337) * 0.4;
    return 0.8 + ((by - top) % 5 === 0 ? -0.3 : 0) + (ux < 2 ? 0.5 : 0) + cg(x, y, 12338) * 0.25;
  }
  if (by < top && by >= top - roofH && Math.abs(lx - 40) < (by - (top - roofH)) / roofH * (hw + 3)) return 0.6 + (Math.abs(lx - 40) > (by - (top - roofH)) / roofH * (hw + 3) - 1.5 && lx < 40 ? 0.7 : 0);   // the roof, its left eave catching the light
  if (lx < 4 && by > 30) return 0.8 + (lx === 0 ? 0.5 : 0);                                  // a post between the houses
  if (by > 30 && by < 34 && (lx < 12 || lx > 70)) return 0.9;                                // a beam
  const th = hash2(Math.floor(xx / 3), band, 12339);                                           // threads hanging from the roofs and beams
  if (xx % 3 === 1 && th < 0.3 && by > 30 && by < 30 + th * 200) return Math.min(bg, 1.6) + 1.2;
  return bg;
}

/* ---- bake and register ---- */
const BKV = {
  xisto: bake(vXisto), tomada: bake(vTomada), humus: bake(vHumus), lodo: bake(vLodo), tabua: bake(vTabua), viga: bake(vViga), tijolo: bake(vTijolo), tronco: bake(vTronco), chapeu: bake(vChapeu),
  carne: bake(vCarne), bolsa: bake(vBolsa), vivo: bake(vVivo), barreira: bake(vBarreira),
  xistoW: bake(vXistoW), tabuadoW: bake(vTabuadoW), humusW: bake(vHumusW), micelioW: bake(vMicelioW), carneW: bake(vCarneW),
  dpRocha: bake(vDpFgRocha), dpChapeus: bake(vDpFgChapeus), dpColonia: bake(vDpFgColonia)
};
const FG_SOLID = [
  // id, palette, texture, dig, map colour (card section 11 where it gives one)
  [FG_XISTO, 'fgXisto', 'xisto', 0.75, '#2c3a40'], [FG_TOMADA, 'fgTomada', 'tomada', 0.8, '#74807a'], [FG_HUMUS, 'fgHumus', 'humus', 0.3, '#3c3444'],
  [FG_LODO, 'fgLodo', 'lodo', 0.28, '#2a3430'], [FG_TABUA, 'fgTabua', 'tabua', 0.3, '#4e483d'], [FG_VIGA, 'fgViga', 'viga', 0.5, '#483b2d'],
  [FG_TIJOLO, 'fgTijolo', 'tijolo', 0.85, '#4e5a50'], [FG_TRONCO, 'fgTronco', 'tronco', 0.5, '#9a9480'], [FG_CHAPEU, 'fgChapeu', 'chapeu', 0.4, '#3a9a94'],
  [FG_CARNE, 'fgCarne', 'carne', 0.4, '#a0686c'], [FG_BOLSA, 'fgBolsa', 'bolsa', 0.15, '#94a06a'], [FG_VIVO, 'fgVivo', 'vivo', 0.6, '#b0a286'],
  [FG_BARREIRA, 'fgBarreira', 'barreira', 0, '#7e7568']
];
for (const [t, p, k, dig, col] of FG_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [FG_XISTO, FG_TOMADA, FG_HUMUS, FG_LODO, FG_CARNE]) BLEND[t] = 1;
EMIT[FG_CHAPEU] = 0.3;   // the gills under the caps (drawn live below)

WMAT[WFG_XISTO] = [PALS.fgXistoW, BKV.xistoW]; WMAT[WFG_TABUADO] = [PALS.fgTabuadoW, BKV.tabuadoW]; WMAT[WFG_HUMUS] = [PALS.fgHumusW, BKV.humusW];
WMAT[WFG_MICELIO] = [PALS.fgMicelioW, BKV.micelioW]; WMAT[WFG_CARNE] = [PALS.fgCarneW, BKV.carneW];
DMAT[DP_FG_ROCHA] = [PALS.dpFgRocha, BKV.dpRocha]; DMAT[DP_FG_CHAPEUS] = [PALS.dpFgChapeus, BKV.dpChapeus]; DMAT[DP_FG_COLONIA] = [PALS.dpFgColonia, BKV.dpColonia];

/* ---- the ores: coal in the schist, and esporita: flat green-blue plates of metal stuck on the rock, held by mycelium ---- */
oreRamp(FG_O_ESPORITA, ['#061a1c', '#0c2a2a', '#145048', '#1e7a6a', '#34a890', '#6ad4b4', '#c8fce8']);
ORE_PAINT[FG_O_ESPORITA] = function (L, s) {
  const R = ORE_RAMP[FG_O_ESPORITA], pts = oreNodes(L, s, R, 120, [3.0, 0.8], [1.5, 0.5], 4);
  // the plates' lit edges shine like metal; a few cool glints in the faces
  for (let k = 0; k < 144; k++) if (L.m[k]) { const x = k % 12, y = k / 12 | 0, h = hash2(k, s, 121); if (((x > 0 && !L.m[k - 1]) || (y > 0 && !L.m[k - 12])) && L.l[k] > 2.2) L.put(x, y, R[5], L.l[k]); else if (L.l[k] > 3.3 && h > 0.85) L.put(x, y, R[6], L.l[k]); }
  // cream threads of mycelium running out from the plates over the rock
  for (let i = 0; i < 1; i++) {
    const [x0, y0] = pts[i], a = hash2(s, i, 122) * 6.28, n = 4 + hash2(s, i, 123) * 2;
    oreLine(L, x0, y0, x0 + Math.cos(a) * n, y0 + Math.sin(a) * n, (x, y) => { if (!L.m[y * 12 + x] && hash2(x + s, y, 124) < 0.8) L.put(x, y, MYC[hash2(x, y + s, 125) < 0.5 ? 2 : 1], 1); });
  }
};
ORE_HALO[FG_O_ESPORITA] = { pal: ['fgXisto', '#1e8a74', 0.36, 0.14], shade: 0.3 };
ORE_PAINT[FG_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[FG_O_CARVAO] = { pal: ['fgXisto', '#020204', 0.5, 0.2], shade: 0 };
MAT[FG_O_CARVAO] = [PALS.fgXisto, bakeOre(FG_O_CARVAO, vXisto)]; MAT[FG_O_ESPORITA] = [PALS.fgXisto, bakeOre(FG_O_ESPORITA, vXisto)];
for (const t of [FG_O_CARVAO, FG_O_ESPORITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[FG_O_CARVAO] = DIG[COAL]; ORE_XP[FG_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[FG_O_CARVAO] = ORE_NAME[COAL]; PCOL[FG_O_CARVAO] = PCOL[COAL]; ORE_ITEM[FG_O_CARVAO] = ORE_ITEM[COAL];
DIG[FG_O_ESPORITA] = 1.25; ORE_XP[FG_O_ESPORITA] = 14; ORE_NAME[FG_O_ESPORITA] = 'Esporita'; PCOL[FG_O_ESPORITA] = '#34a890'; ORE_ITEM[FG_O_ESPORITA] = 'min_esporita';
EMIT[FG_O_ESPORITA] = 0.3;

/* ---- block items ---- */
// the cave's schist (53) already owns the id 'xisto', so the wet schist is 'xisto_umido'
const FG_ITEMS = {
  xisto_umido: ['Xisto Úmido', FG_XISTO, 'Pedra azulada em lâminas, sempre molhada. A água escorre entre as camadas.'],
  rocha_tomada: ['Rocha Tomada', FG_TOMADA, 'Xisto coberto por uma crosta de micélio. A crosta é morna.'],
  humus: ['Húmus de Esporo', FG_HUMUS, 'Terra preta e fofa, cheia de esporos. Cava num instante.'],
  lodo: ['Lodo', FG_LODO, 'Barro mole do fundo das grutas. Cheira a água parada.'],
  tijolo_colonia: ['Tijolo da Colônia', FG_TIJOLO, 'Tijolo cinza-esverdeado de Ferroalto. O fungo entrou nas juntas.'],
  tronco_cogumelo: ['Tronco de Cogumelo', FG_TRONCO, 'Fibroso e firme como madeira. Veio de um cogumelo do tamanho de uma torre.'],
  chapeu_cogumelo: ['Chapéu de Cogumelo', FG_CHAPEU, 'Carne macia de um cogumelo gigante. As lamelas ainda brilham um pouco.'],
  carne_micelio: ['Carne de Micélio', FG_CARNE, 'Rosa-pálida e morna. Às vezes pulsa devagar na mão.']
};
for (const id in FG_ITEMS) { const [name, block, desc] = FG_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[FG_TABUA] = 'madeira'; BLOCK_DROP[FG_VIGA] = 'madeira'; BLOCK_DROP[FG_BOLSA] = 'fio_micelio';   // FG_VIVO and FG_BARREIRA drop nothing

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRF = {
  micelio: ['#1e1b16', '#3a3428', '#5c5440', '#82785c', '#a89c7c', '#cabe9c', '#e2d8b8'],
  madeira: ['#0e0d0b', '#1c1915', '#2a2620', '#3a352c', '#4c463a', '#605849', '#776d5a'],
  lanterna: ['#0a2226', '#12404a', '#1a6a70', '#2a9a98', '#5accc0', '#9ef0e0', '#d4fbee'],
  caule: ['#262620', '#44423a', '#666250', '#8a8670', '#aea88e', '#ccc6aa', '#e2dcc0'],
  tufo: ['#18141a', '#2a2228', '#40363a', '#58494a', '#72605c', '#8e7a72', '#a8948a'],
  esporo: ['#0e1e10', '#1a3a1a', '#2a5a26', '#3e7e34', '#5aa848', '#8ad070', '#c4ecaa'],
  seiva: ['#141a08', '#24300e', '#3a4c16', '#56701e', '#78962a', '#a2c040', '#d4ec8a'],
  osso: ['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#cbc0aa', '#e2d8c2'],
  ferro: ['#0c0e0e', '#181c1c', '#283030', '#3a4644', '#4e5e5a', '#6a7c76', '#90a49c'],
  latao: ['#221a08', '#3e300e', '#5e4a16', '#7e6420', '#9e8030', '#bea048', '#dcc274'],
  chama: ['#3a1404', '#7a3008', '#c05a12', '#f08a24', '#ffb04a', '#ffd88a', '#fff0c8'],
  xisto: ['#0e1316', '#182024', '#243034', '#344246', '#485a5e', '#62767a', '#86989a'],
  limo: ['#0e1a10', '#1a2e18', '#28441e', '#3a5e28', '#4e7a34', '#6a9a44', '#8eba5c'],
  carne: ['#2a1a20', '#4a2c34', '#74464e', '#a0686c', '#c89490', '#e6c0b4', '#f2d6c8']
};
for (const k in DRF) DRF[k] = DRF[k].map(h => ph(h));
const flipY = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[(T - 1 - y) * T + x]; return b; };
const flipX = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[y * T + T - 1 - x]; return b; };
const rimOut = (a, o, top = true) => { const b = a.slice(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (top && y > 0 && b[k - T]) || (y < T - 1 && b[k + T]))) a[k] = o; } return a; };
const spr = () => { const a = new Uint32Array(T * T); a.put = (x, y, R, v) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = dPix(R, v); }; return a; };
const disc = (a, cx, cy, rx, ry, R, fn) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d <= 1) a.put(x, y, R, fn(dx, dy, d, x, y)); } };

/* a mycelium cord hanging from the roof: three strands twisted together, a swelling where they knot, fibres
   sticking out; the last piece frays into loose strands */
function cordSprite(end, s) {
  const a = spr(), M = DRF.micelio, len = end ? 7 : 12;
  for (let y = 0; y < len; y++) {
    const cx = 5.5 + Math.sin(y * Math.PI / 6 + s) * 0.5, knot = !end && Math.abs(y - (4 + s % 3)) < 1.6, hw = knot ? 2.4 : 1.6;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const d = (x + 0.5 - cx) / hw; if (Math.abs(d) > 1) continue;
      const tw = ((y * 1.3 - d * 2.2 + s) % 3 + 3) % 3;
      a.put(x, y, M, 4.4 - d * 1.5 + (tw < 0.9 ? 0.9 : tw > 2.2 ? -1 : 0) + cg(x, y, s) * 0.3 + (knot ? 0.3 : 0));
    }
  }
  if (!end) for (const [x, y] of [[3, 2 + s % 4], [8, 8 - s % 3], [2, 9]]) if (hash2(x, y, s) < 0.7) a.put(x, y, M, 4.6);   // fibres
  if (end) for (let k = 0; k < 3; k++) { let x = 4.6 + k * 1.1; for (let y = 7; y < 10 + k; y++) { x += (k - 1) * 0.35; a.put(x, y, M, 4.6 - k * 0.8 - (y - 7) * 0.2); } }
  return rimOut(a, M[0], false);
}
const CORDAO = [cordSprite(false, 12401), cordSprite(false, 12402), cordSprite(true, 12403)];

/* the colony's ladder: grey waterlogged rails, rungs every 4 px, threads wound round a rail; seamless up and down */
function ladderSprite(s) {
  const a = spr(), W = DRF.madeira;
  for (let y = 0; y < T; y++) for (const [x, v] of [[1, 4.8], [2, 3], [9, 4.6], [10, 2.8]]) a.put(x, y, W, v + Math.sin(y * 0.9 + x + s) * 0.3 + cg(x, y, s) * 0.4);
  for (const ry of [2, 6, 10]) for (let x = 3; x <= 8; x++) { a.put(x, ry, W, 4.4 - (x - 3) * 0.15 + cg(x, ry, s) * 0.5); a.put(x, ry + 1, W, 1.4); }
  if (s % 2) for (let y = 3; y < 10; y++) if ((y + s) % 3 !== 0) { a.put(1 + (y % 2), y, DRF.micelio, 5 - (y % 2)); }        // threads wound round the left rail
  else for (const [x, y] of [[9, 4], [10, 5], [9, 8], [3, 6], [4, 7]]) a.put(x, y, DRF.micelio, 4.4);
  return a;
}
const ESCADA = [ladderSprite(12411), ladderSprite(12412)];

/* a lantern mushroom: a pale stalk, a domed cap glowing cyan, its gills brighter still under the rim */
function lanternCap(a, cx, base, h, cw, s) {
  const capY = base - h, ch = Math.max(2, cw * 0.55);
  for (let y = capY + 1; y <= base; y++) for (let x = Math.floor(cx - 1); x <= Math.ceil(cx); x++) a.put(x, y, DRF.caule, (x < cx ? 5 : 3.4) - (y - capY) * 0.08 + cg(x, y, s) * 0.4);   // the stalk
  disc(a, cx, capY + 0.5, cw, ch, DRF.lanterna, (dx, dy, d, x, y) => dy > 0.35 ? 0 : 4.6 - dx * 1.1 - dy * 1.2 - d * 0.4 + cg(x, y, s) * 0.4 + (hash2(x, y, s + 1) < 0.15 ? 1.2 : 0));
  for (let x = Math.round(cx - cw + 1); x < Math.round(cx + cw); x++) a.put(x, Math.round(capY + 0.5 + ch * 0.35), DRF.lanterna, x % 2 ? 6.4 : 5.2);       // the gills
}
function lanternSprite(k, s) {
  const a = spr();
  if (k === 0) { lanternCap(a, 6, 11, 6, 4.4, s); for (let x = 3; x < 9; x++) a.put(x, 11, DRF.micelio, 2.6 + hash2(x, s, 1) * 1.5); }
  else if (k === 1) { lanternCap(a, 3.5, 11, 4, 2.6, s + 3); lanternCap(a, 7.5, 11, 7, 3.6, s); }
  else { lanternCap(a, 2.5, 11, 3, 2, s + 5); lanternCap(a, 6, 11, 5, 2.8, s); lanternCap(a, 9.5, 11, 2.5, 1.8, s + 7); }
  return rimOut(a, DRF.lanterna[0]);
}
const LANTERNA = [lanternSprite(0, 12421), lanternSprite(1, 12422), lanternSprite(2, 12423)];

/* a tuft of small dull mushrooms, greyish-violet caps on cream stalks; now and then one with a bluish cap */
function tuftSprite(s) {
  const a = spr(), n = 3 + (s % 3);
  const ms = []; for (let i = 0; i < n; i++) ms.push([1.5 + hash2(s, i, 12431) * 9, 2 + hash2(s, i, 12432) * 4, 1.2 + hash2(s, i, 12433) * 1.4]);
  ms.sort((p, q) => q[1] - p[1]);
  for (const [cx, h, cw] of ms) {
    const capY = 11 - h, R = hash2(cx * 7, h, s) < 0.2 ? DRF.lanterna : DRF.tufo;
    for (let y = Math.round(capY) + 1; y < 12; y++) a.put(cx, y, DRF.caule, 4.2 - (y - capY) * 0.15);
    disc(a, cx + 0.5, capY + 0.6, cw, Math.max(1, cw * 0.7), R, (dx, dy, d, x, y) => dy > 0.4 ? 0 : (R === DRF.lanterna ? 3 : 4.4) - dx * 1.3 - dy * 1.4 + cg(x, y, s) * 0.4);
  }
  return rimOut(a, DRF.tufo[0]);
}
const TUFO = [tuftSprite(12441), tuftSprite(12442), tuftSprite(12443)];

/* fine threads hanging from the roof in a fringe, different lengths, a bead of damp at some tips */
function threadsSprite(s) {
  const a = spr(), M = DRF.micelio, n = 4 + (s % 3);
  for (let k = 0; k < n; k++) {
    const x0 = 1 + hash2(s, k, 12451) * 10, len = 4 + hash2(s, k, 12452) * 8, ph0 = hash2(s, k, 12453) * 6;
    let x = x0; for (let y = 0; y < len; y++) { x = x0 + Math.sin(y * 0.5 + ph0) * 0.8; a.put(x, y, M, 4.8 - y / len * 1.6 - (k % 2) * 0.6); }
    if (hash2(s, k, 12454) < 0.4 && len < 11) a.put(x, Math.floor(len), DRF.lanterna, 5);
  }
  return a;
}
const FIOS = [threadsSprite(12461), threadsSprite(12462), threadsSprite(12463)];

/* a sap drip: a gloss of green sap clinging to the roof, running into a point; the drop is drawn live */
function dripSprite(s) {
  const a = spr(), S = DRF.seiva;
  for (let y = 0; y < 8; y++) { const hw = y < 2 ? 3.5 - y * 0.6 : Math.max(0.5, 2.4 * (1 - (y - 2) / 6)); const cx = 6 + (s % 2 ? 0.4 : -0.3) * (y / 8);
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw - 1); x++) { const d = (x + 0.5 - cx) / hw; if (Math.abs(d) > 1) continue; a.put(x, y, S, 4 - d * 1.6 + (y > 5 ? 0.8 : 0) + cg(x, y, s) * 0.3); } }
  a.put(5, 2, S, 6.2); a.put(5, 3, S, 5.4);   // the gloss
  return rimOut(a, S[0], false);
}
const GOTEJO = [dripSprite(12471), dripSprite(12472)];

/* a cluster of spore pods hanging from the roof on short threads, glowing green */
function sporeSprite(s) {
  const a = spr(), E = DRF.esporo, n = 4 + (s % 3);
  const pods = []; for (let i = 0; i < n; i++) pods.push([2 + hash2(s, i, 12481) * 8, 3 + hash2(s, i, 12482) * 6, 1.1 + hash2(s, i, 12483) * 1.2]);
  for (const [cx, cy] of pods) for (let y = 0; y < cy; y++) a.put(cx + (6 - cx) * (1 - y / cy) * 0.5, y, DRF.micelio, 3.6 - y * 0.15);   // the threads
  for (let y = 0; y < 2; y++) for (let x = 3; x < 9; x++) a.put(x, y, DRF.micelio, 3.4 + (y === 0 ? 0.8 : 0) - (x - 3) * 0.15);   // the mat they hang from
  for (const [cx, cy, r] of pods) disc(a, cx, cy, r, r, E, (dx, dy) => 4.6 - dx * 1.2 - dy * 1.3 + (dx < -0.2 && dy < -0.2 ? 1.2 : 0));
  return rimOut(a, E[0], false);
}
const ESPOROS = [sporeSprite(12491), sporeSprite(12492), sporeSprite(12493)];

/* the bones of a colonist, sprouting: a skull on its side, a long bone, ribs, little caps growing out, threads over them */
function bonesSprite(s) {
  const a = spr(), O = DRF.osso;
  if (s % 2) {
    for (let x = 0; x < 9; x++) { a.put(x, 10, O, 4.6 - x * 0.12); a.put(x, 11, O, 2.4); }   // a long bone
    a.put(0, 9, O, 4.2); a.put(8, 9, O, 4); a.put(9, 10, O, 3.6);
    disc(a, 8.5, 8.2, 3, 2.8, O, (dx, dy, d, x, y) => 5 - dx * 1.2 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.4);   // the skull
    a.put(8, 8, O, 0.4); a.put(9, 8, O, 0.4); a.put(10, 9, O, 1);
  } else {
    for (const rx of [2, 4.5, 7]) for (let y = 7; y < 12; y++) { const x = rx + Math.sin((y - 7) / 5 * Math.PI) * 1.4; a.put(x, y, O, 4.6 - (y - 7) * 0.4); }   // ribs
    for (let x = 1; x < 10; x++) a.put(x, 11, O, 3 - x * 0.1);                                                                            // the spine
  }
  // sprouts: two or three small caps on thin stalks
  for (let i = 0; i < 2 + (s % 2); i++) { const cx = 2 + hash2(s, i, 12501) * 7, h = 2 + hash2(s, i, 12502) * 3, by = s % 2 ? 7 : 7; for (let y = by - h; y < by; y++) a.put(cx, y, DRF.caule, 4.6); a.put(cx - 1, by - h, DRF.lanterna, 3.4); a.put(cx, by - h - 1, DRF.lanterna, 4.8); a.put(cx + 1, by - h, DRF.lanterna, 2.6); a.put(cx, by - h, DRF.lanterna, 4); }
  for (let x = 1; x < 11; x++) if (hash2(x, s, 12503) < 0.35) a.put(x, 9 + (x % 2), DRF.micelio, 4.4);   // threads over the bones
  return rimOut(a, O[0]);
}
const OSSADA = [bonesSprite(12511), bonesSprite(12512)];

/* the colony's oil lamp on the floor: a patinated brass foot, a glass chimney with a small warm flame, a ring on top, threads up the base */
function oilLampSprite(s) {
  const a = spr(), B = DRF.latao;
  a.put(5, 0, DRF.ferro, 4.4); a.put(6, 0, DRF.ferro, 3); a.put(4, 1, DRF.ferro, 4); a.put(7, 1, DRF.ferro, 2.4);   // the ring
  for (let x = 4; x <= 7; x++) a.put(x, 2, B, 4.6 - (x - 4) * 0.6);                                                 // the cap
  for (let y = 3; y <= 7; y++) for (let x = 4; x <= 7; x++) { const g = 6.2 - Math.hypot(x - 5.5, (y - 5.6) * 0.8) * 1.6; a.put(x, y, x === 4 && y < 6 ? DRF.lanterna : DRF.chama, x === 4 && y < 6 ? 2.6 : Math.max(1.4, g)); }   // the chimney, flame inside
  for (let x = 3; x <= 8; x++) a.put(x, 8, B, 4.8 - (x - 3) * 0.4);
  for (let y = 9; y < 12; y++) { const hw = 1.5 + (y - 9) * 0.9; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw); x++) a.put(x, y, hash2(x, y, s) < 0.3 ? DRF.ferro : B, 3.8 - (x - 2) * 0.35 - (y === 11 ? 0.8 : 0)); }   // the foot, green with patina
  for (const [x, y] of [[2, 11], [3, 10], [9, 11], [8, 10], [8, 9]]) if (hash2(x, y, s + 1) < 0.8) a.put(x, y, DRF.micelio, 4.6);
  return rimOut(a, DRF.ferro[0]);
}
const LAMPIAO = [oilLampSprite(12521)];

/* mycelium reeds at the water's edge: thin pale stems bending, fluffy spore heads */
function reedSprite(s) {
  const a = spr(), n = 3 + (s % 2);
  for (let k = 0; k < n; k++) {
    const x0 = 1.5 + k * (9 / (n - 1)) + (hash2(s, k, 12531) - 0.5) * 1.5, h = 5 + hash2(s, k, 12532) * 4.5, bend = (hash2(s, k, 12533) - 0.5) * 3, head = hash2(s, k, 12536) < 0.7;
    let tx = x0, ty = 11;
    for (let y = 11; y > 11 - h; y--) { const t = (11 - y) / h; tx = Math.round(x0 + bend * t * t); ty = y; a.put(tx, y, DRF.caule, 1.8 + t * 1.6 + (k % 2 ? -0.5 : 0)); }
    if (head) { for (let y = ty - 1; y < ty + 3; y++) a.put(tx, y, DRF.micelio, 5.6 - (y - ty + 1) * 0.5); a.put(tx + 1, ty, DRF.micelio, 2.4); a.put(tx + 1, ty + 1, DRF.micelio, 2); }   // a soft cream head, shaded on the right
    else a.put(tx + (bend > 0 ? 1 : -1), ty - 1, DRF.caule, 3.8);                             // a bent tip
  }
  for (let x = 0; x < T; x++) if (hash2(x, s, 12534) < 0.6) a.put(x, 11, DRF.limo, 2.6 + hash2(x, s, 12535) * 2.4);
  return a;
}
const JUNCO = [reedSprite(12541), reedSprite(12542)];

/* pebbles of schist with green slime on their tops and a wet glint */
function pebblesSprite(s) {
  const a = spr(), X = DRF.xisto;
  const rock = (cx, cy, rx, ry, sd) => disc(a, cx, cy, rx, ry, X, (dx, dy, d, x, y) => 4.4 - (dx + dy) * 1.4 + cg(x, y, sd) * 0.5);
  if (s % 2) { rock(3.5, 9.6, 3, 2.4, s); rock(8.5, 10.2, 2.8, 1.9, s + 1); rock(6.2, 7.6, 2, 1.8, s + 2); } else { rock(4.5, 9.8, 3.6, 2.2, s); rock(9.6, 10.5, 1.8, 1.5, s + 1); rock(1.4, 10.8, 1.3, 1.2, s + 2); }
  for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (a[y * T + x] && (y === 0 || !a[(y - 1) * T + x]) && hash2(x, y, s) < 0.75) { a.put(x, y, DRF.limo, 4 + hash2(x, y, s + 1) * 2); if (hash2(x, y, s + 2) < 0.4) a.put(x, y + 1, DRF.limo, 2.6); }   // slime on top
  a.put(2, 8, X, 6.4); if (s % 2) a.put(7, 9, X, 6.2);
  return rimOut(a, X[0]);
}
const SEIXOS = [pebblesSprite(12551), pebblesSprite(12552)];

/* a taken prop: the colony's post, grey and soft, a crust of mycelium climbing it; a stone foot, a cap piece with threads under the roof */
function propPiece(k, s) {   // 0 foot, 1 shaft, 2 head
  const a = spr(), W = DRF.madeira, M = DRF.micelio;
  for (let y = 0; y < T; y++) for (let x = 3; x <= 8; x++) {
    const u = (x - 3) / 5; let v = 4.4 - u * 2.6 + Math.sin(y * 0.8 + x * 1.7 + s) * 0.25 + cg(x, y, s) * 0.35;
    if (x === 5 && hash2(y, k, s) < 0.3) v -= 0.9;
    a.put(x, y, W, v);
    const cr = Math.sin(y * 0.45 + s + x * 0.2) + (k === 0 ? (y - 4) * 0.2 : 0) + (hash2(x, y, s) - 0.5) * 0.6;
    if (cr > 0.8) a.put(x + (x < 5 ? -0.4 : 0.4), y, M, 4.6 - u * 2 + (cr > 1.1 ? 0.6 : 0));   // the crust, climbing it in patches
  }
  if (k === 0) { for (let x = 1; x <= 10; x++) for (let y = 9; y < 12; y++) a.put(x, y, DRF.xisto, 3.8 - (y - 9) * 0.7 - x * 0.08 + cg(x, y, s) * 0.5); for (let x = 1; x <= 10; x++) if (hash2(x, s, 2) < 0.55) a.put(x, 9, M, 4.4); a.put(2, 8, M, 4); a.put(9, 8, M, 3.4); }
  if (k === 2) { for (let x = 0; x < T; x++) for (let y = 0; y < 3; y++) a.put(x, y, W, (y === 0 ? 4.6 : y === 2 ? 1.8 : 3.4) - x * 0.06 + cg(x, y, s) * 0.3); for (const x of [1, 2, 9, 10]) for (let y = 3; y < 4 + (x * 7 + s) % 4; y++) a.put(x, y, M, 4.4 - (y - 3) * 0.4); }
  return rimOut(a, W[0]);
}
const ESCORA = [propPiece(0, 12561), propPiece(1, 12562), propPiece(2, 12563), propPiece(1, 12564)];

DECO[FG_CORDAO] = CORDAO; DECO[FG_ESCADA] = ESCADA; DECO[FG_LANTERNA] = LANTERNA; DECO[FG_TUFO] = TUFO; DECO[FG_FIOS] = FIOS; DECO[FG_GOTEJO] = GOTEJO;
DECO[FG_ESPOROS] = ESPOROS; DECO[FG_OSSADA] = OSSADA; DECO[FG_LAMPIAO] = LAMPIAO; DECO[FG_JUNCO] = JUNCO; DECO[FG_SEIXOS] = SEIXOS; DECO[FG_ESCORA] = ESCORA;
const FG_DECO = [
  // id, dig, map colour, drop
  [FG_CORDAO, 0.12, '#a89c7c', null], [FG_ESCADA, 0.25, '#605849', 'madeira'], [FG_LANTERNA, 0.08, '#5accc0', null], [FG_TUFO, 0.03, '#72605c', null],
  [FG_FIOS, 0.03, '#a89c7c', null], [FG_GOTEJO, 0.05, '#78962a', null], [FG_ESPOROS, 0.06, '#5aa848', null], [FG_OSSADA, 0.06, '#aea290', null],
  [FG_LAMPIAO, 0.1, '#ffb04a', null], [FG_JUNCO, 0.03, '#aea88e', null], [FG_SEIXOS, 0.08, '#485a5e', 'xisto_umido'], [FG_ESCORA, 0.4, '#605849', 'madeira']
];
for (const [t, dig, col, drop] of FG_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[FG_LANTERNA] = 0.8; EMIT[FG_GOTEJO] = 0.2; EMIT[FG_ESPOROS] = 0.4; EMIT[FG_LAMPIAO] = 0.5;
for (const t of [FG_CORDAO, FG_FIOS, FG_GOTEJO, FG_ESPOROS, FG_ESCORA]) CV_HANGS[t] = 1;
for (const t of [FG_LANTERNA, FG_TUFO, FG_OSSADA, FG_LAMPIAO, FG_JUNCO, FG_SEIXOS, FG_ESCORA]) CV_STANDS[t] = 1;

// which variation goes where
DECO_PICK[FG_CORDAO] = (gx, gy, arr) => tileAt(gx, gy + 1) === FG_CORDAO ? arr[hash2(gx, gy, 12571) < 0.5 ? 1 : 0] : arr[2];
DECO_PICK[FG_ESCORA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== FG_ESCORA ? arr[0] : tileAt(gx, gy - 1) !== FG_ESCORA ? arr[2] : arr[hash2(gx, gy, 12572) < 0.3 ? 3 : 1];
DECO_PICK[FG_ESCADA] = (gx, gy, arr) => arr[hash2(gx, gy, 12573) < 0.25 ? 1 : 0];

// the cord and the ladder are climbed like the cathedral's chains; the ladder also counts as the mine's ladder (the climbing pose, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, FG_CORDAO) || _tt(e, FG_ESCADA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, FG_ESCADA)); }; }

/* ================= live: glows, the caps' gills, the sap drop, spores, the spore sac ================= */
// the gills under a cap: a strip of lamellae, a few variations, drawn over the darkness where a cap has air below it
const GILLH = ['#16444a', '#2a8a86', '#5ac0b4', '#9ae8d8'];
const FG_GILLS = [0, 1, 2].map(s => { const c = mk(T, 4), x = c.getContext('2d'); for (let i = 0; i < T; i++) for (let j = 0; j < 4; j++) { const on = (i + s) % 2 === 0, l = on ? (j === 0 ? 3 : j === 1 ? 2 : hash2(i, s, 12581) < 0.5 ? 1 : -1) : (j === 0 ? 1 : -1); if (l < 0) continue; x.fillStyle = GILLH[l]; x.fillRect(i, j, 1, 1); } return c; });
const FG_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!FUNGO) return;
  if (!FG_GLOW.l) { FG_GLOW.l = glow(24, '#4ad8c8'); FG_GLOW.e = glow(14, '#7ad860'); FG_GLOW.d = glow(8, '#a0d050'); FG_GLOW.p = glow(18, '#ffb060'); FG_GLOW.c = glow(12, '#3ac0b0'); FG_GLOW.o = glow(10, '#34c8a0'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < FG_XISTO || t > FG_ESCORA) continue;
    const gx = emitters[i], gy = emitters[i + 1];
    if (t === FG_LANTERNA) { lc.globalAlpha = 0.3 + Math.sin(gameTime * 1.3 + gx * 0.9) * 0.05; lc.drawImage(FG_GLOW.l, gx * T + 6 - cx - 24, gy * T + 6 - cy - 24); }
    else if (t === FG_ESPOROS) { lc.globalAlpha = 0.2 + Math.sin(gameTime * 1.7 + gx) * 0.05; lc.drawImage(FG_GLOW.e, gx * T + 6 - cx - 14, gy * T + 5 - cy - 14); }
    else if (t === FG_GOTEJO) { lc.globalAlpha = 0.16; lc.drawImage(FG_GLOW.d, gx * T + 6 - cx - 8, gy * T + 5 - cy - 8); }
    else if (t === FG_LAMPIAO) { lc.globalAlpha = 0.24 + Math.sin(gameTime * 9 + gx * 1.3) * 0.03 + Math.sin(gameTime * 14 + gy) * 0.02; lc.drawImage(FG_GLOW.p, gx * T + 6 - cx - 18, gy * T + 5 - cy - 18); }
    else if (t === FG_CHAPEU) { if (solidAt(gx, gy + 1) || (gx & 1)) continue; lc.globalAlpha = 0.16 + Math.sin(gameTime * 0.9 + gx * 0.4) * 0.04; lc.drawImage(FG_GLOW.c, gx * T + 6 - cx - 12, gy * T + 14 - cy - 12); }
    else if (t === FG_O_ESPORITA) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.12 + Math.sin(gameTime * 1.1 + gx * 0.7 + gy) * 0.04; lc.drawImage(FG_GLOW.o, gx * T + 6 - cx - 10, gy * T + 6 - cy - 10); }
  }
  lc.globalAlpha = 1;
});
// a spore sac swelling and trembling when the pick strikes it or the block beside it; key -> seconds left
const fungSwell = new Map();
let fungSacCv = null;
const fungClouds = [];
function fungSporeCloud(x, y) {
  fungClouds.push({ x, y, t: 0, s: Math.random() * 100 });
  burst(x, y, 14, '#8a9a5a', 50, -10, 1.6, 1); burst(x, y, 6, '#c4ecaa', 30, -6, 1.2, 1, true);
  if (typeof noise === 'function') { noise(0.28, 0.06, 700, 'lowpass'); noise(0.12, 0.03, 2400, 'bandpass', 0.02); }
}
{ const _bt = breakTile; breakTile = function (tx, ty) { const t = tileAt(tx, ty); _bt(tx, ty); if (t === FG_BOLSA) { fungSwell.delete(wrapX(tx) + ',' + ty); fungSporeCloud((tx + 0.5) * T, (ty + 0.5) * T); } }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target; _pi(sx, sy, aim);
  if (!tg || !tg.inReach || !tg.dig) return;
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (tileAt(tg.tx + dx, tg.ty + dy) === FG_BOLSA) fungSwell.set(wrapX(tg.tx + dx) + ',' + (tg.ty + dy), 0.55);
}; }
HOOK.update.push(dt => {
  if (!FUNGO) return;
  for (const [k, v] of fungSwell) { if (v - dt <= 0) fungSwell.delete(k); else fungSwell.set(k, v - dt); }
  for (let i = fungClouds.length - 1; i >= 0; i--) if ((fungClouds[i].t += dt) > 2.4) fungClouds.splice(i, 1);
  // spores drifting off the clusters in view
  if (state !== 'play' || parts.length > 500) return;
  for (let i = 0; i < emitters.length; i += 3) {
    if (emitters[i + 2] !== FG_ESPOROS || Math.random() > dt * 0.7) continue;
    parts.push({ x: emitters[i] * T + 2 + Math.random() * 8, y: emitters[i + 1] * T + 8, vx: rnd(-3, 3), vy: rnd(3, 8), g: -1, life: 2.6, max: 2.6, col: Math.random() < 0.5 ? '#8ad070' : '#c4ecaa', size: 1, glow: true });
  }
});
// the swelling sac, redrawn a little bigger and shaking over its own tile (lit like the world, so before the light)
HOOK.drawWorld.push((cx, cy) => {
  if (!fungSwell.size) return;
  if (!fungSacCv) fungSacCv = blockCanvas(FG_BOLSA, T, 2, 24, 36);
  for (const [k, v] of fungSwell) {
    const [gx, gy] = k.split(',').map(Number); if (tileAt(gx, gy) !== FG_BOLSA) continue;
    const s = 1 + Math.sin((0.55 - v) / 0.55 * Math.PI) * 2, j = Math.sin(gameTime * 60 + gx) * 0.8;
    let x = gx * T - cx; const W = WW * T; if (x < -W / 2) x += W; else if (x > W / 2) x -= W;
    lc.drawImage(fungSacCv, Math.round(x - s + j), Math.round(gy * T - cy - s * 1.4), T + s * 2, T + s * 2);
  }
});
// over the darkness: the cap gills, the falling sap drop, the spore clouds
const FG_PUFF = (() => { const r = 16, c = mk(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(40,52,38,1)'); g.addColorStop(0.55, 'rgba(34,44,32,0.85)'); g.addColorStop(1, 'rgba(26,34,26,0)'); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c; })();
HOOK.drawTop.push((cx, cy) => {
  if (!FUNGO) return;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== FG_CHAPEU && t !== FG_GOTEJO) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === FG_CHAPEU) { if (solidAt(gx, gy + 1)) continue; lc.globalAlpha = 0.85; lc.drawImage(FG_GILLS[(gx * 7 + gy) % 3], x, y + 9); continue; }
    // the drop swells at the tip, lets go, falls to the floor below
    const ph0 = (gameTime * 0.45 + hash2(gx, gy, 12591)) % 1;
    lc.globalAlpha = 1;
    if (ph0 < 0.7) { lc.fillStyle = '#a2c040'; lc.fillRect(x + 5, y + 8, 2, ph0 > 0.4 ? 2 : 1); continue; }
    let fl = 1; while (fl < 8 && !solidAt(gx, gy + fl)) fl++;
    const fy = (ph0 - 0.7) / 0.3, dy = 8 + fy * fy * (fl * T - 8);
    lc.fillStyle = '#d4ec8a'; lc.fillRect(x + 5, y + dy, 1, 2);
  }
  for (const c of fungClouds) {
    const k = c.t / 2.4, r = 10 + 30 * (1 - (1 - k) * (1 - k)), a = c.t < 1.6 ? Math.min(1, c.t * 6) * 0.95 : 0.95 * (1 - (c.t - 1.6) / 0.8);
    lc.globalAlpha = Math.max(0, a);
    for (let j = 0; j < 9; j++) {
      const an = j * 2.39 + c.s, rr = j === 0 ? 0 : r * (0.35 + hash2(j, 0, c.s | 0) * 0.5), px = c.x + Math.cos(an) * rr + Math.sin(c.t * 1.3 + j) * 3, py = c.y + Math.sin(an) * rr * 0.75 - c.t * 6, sz = r * (0.9 + hash2(j, 1, c.s | 0) * 0.4);
      lc.drawImage(FG_PUFF, Math.round(px - cx - sz), Math.round(py - cy - sz), sz * 2, sz * 2);
    }
  }
  lc.globalAlpha = 1;
});

Object.assign(FGART, { cg, cn, cells, dPix, cvSprite, spr, rimOut, disc, flipX, flipY, DRF, WATER, MYC, SPORE, FUNGI, GILL, PINK, SAC, vXisto, vTomada, vHumus, vLodo, vTabua, vViga, vTijolo, vTronco, vChapeu, vCarne, vBolsa, vVivo, vBarreira, fungSporeCloud, fungSwell, fungClouds });
}
