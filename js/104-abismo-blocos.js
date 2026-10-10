'use strict';

/* ================= o Abismo: blocks, back walls, far layer, ores, decorations =================
   The ground of hell: pressed ash from fires that never go out (warm dark grey, fine laminae, charred bits and
   a dying ember), blue-black basalt cracked into hexagonal prisms, black volcanic glass with purple glints
   running across its shell fractures, the black crust over magma split into plates with orange light in every
   crack, living flesh (dark red muscle fibre, raised veins, wet glints, a nodule of fat), a mass of bones pressed
   into dried gore, dirty yellow brimstone in faceted grains, black iron plates riveted at the corners with small
   spiked studs, red-black hell brick with worn runes cut into it, and the twisted chaos stone of the throne with
   purple and red veins. Coal comes back in the basalt; infernita, the abyss's own metal, sits in it as lumps of
   ember-red ore that glow faintly. Like 80-mina-blocos, every material is a seamless 240x240 texture sampled in
   world pixels; outline, lit edge, shade and ambient occlusion come from 07-chunks-luz. Back walls and the far
   layer only read the tone (.v), so they carry no colour accents. Small decorations (a hanging chain and a black
   iron ladder you can climb, bone spikes, a brazier, a flame on the floor, a heap of skulls, an obsidian
   stalagmite, a flesh tendril, a glowing rune stone, chaos crystals, a butcher's hook, a basalt column from
   floor to roof) are 12x12 sprites on ramps lit from the top left. The chunk cache draws them still; braziers,
   flames and runes flicker through their glow (108). Ids: 103-abismo-api. */
const ABART = {};   // helpers shared with 105-abismo-objetos and the demons
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
/* ---- palettes: 6 shades, dark to light ---- */
pal('abCinza', ['#141112', '#221d1d', '#332d2c', '#463f3c', '#5b524e', '#726762']);
pal('abBasalto', ['#0a0c11', '#141821', '#1f2531', '#2b3242', '#394255', '#4b566c']);
pal('abObsidiana', ['#050409', '#0b0912', '#14101d', '#1e182b', '#2a213b', '#382d4f']);
pal('abCrosta', ['#0a0707', '#130f0f', '#1d1716', '#28201e', '#342a27', '#423531']);
pal('abCarne', ['#1c0406', '#33080c', '#4d0f15', '#69181e', '#85262a', '#a23a3a']);
pal('abOsso', ['#17120e', '#2c241c', '#4a3e30', '#6e5f4a', '#958368', '#bba888']);
pal('abEnxofre', ['#262008', '#45390e', '#685716', '#8c771f', '#ac952c', '#c8b244']);
pal('abFerro', ['#08080a', '#111215', '#1b1c21', '#26282f', '#33363f', '#444852']);
pal('abTijolo', ['#0e0405', '#1d0709', '#300c0e', '#471313', '#601b19', '#7a2520']);
pal('abCaos', ['#0b060c', '#170d18', '#241426', '#321c34', '#422444', '#552f56']);
pal('abBarreira', ['#060609', '#0f0f14', '#1a1b22', '#282a33', '#3a3d49', '#525664']);
// back walls: always far darker than the ground in front
pal('abCinzaW', ['#0b0a0a', '#110f0f', '#171414', '#1d1a19', '#24201f', '#2b2625']);
pal('abBasaltoW', ['#06070a', '#0a0c10', '#0e1116', '#13161d', '#181c25', '#1e232d']);
pal('abCarneW', ['#0d0405', '#140607', '#1c080a', '#250b0d', '#2f0f11', '#391415']);
pal('abTijoloW', ['#0c0405', '#130607', '#1b080a', '#240b0c', '#2e0f0f', '#381312']);
pal('abCaosW', ['#090509', '#0e080f', '#140b15', '#1a0f1c', '#211324', '#29182c']);
// the far layer behind the walls: the top shades turn to a red glow from the fires below
pal('dpAbRocha', ['#050303', '#0a0605', '#100907', '#170c09', '#25100a', '#3a170b']);
pal('dpAbRuinas', ['#040203', '#080405', '#0e0607', '#160909', '#240d0b', '#3c150c']);
pal('dpAbCarne', ['#060203', '#0c0405', '#130608', '#1c090b', '#290d0f', '#3a1314']);

const wrapT = v => ((v % TP) + TP) % TP;
const RAMPX = hexes => hexes.map(h => ph(h));
const EMBER = RAMPX(['#5a1404', '#a83a08', '#ff8a20', '#ffd27a']);          // glowing cracks, embers
const MAGMA = RAMPX(['#3a0a04', '#7a1c06', '#c8420b', '#ff8a20', '#ffcf6a']);
const PURP = RAMPX(['#3a2066', '#6a40aa', '#a47ae4', '#e2ccff']);           // obsidian's glints
const VEIN = RAMPX(['#22081e', '#3a1032', '#541a48', '#7a2c62']);           // the flesh's raised veins
const FAT = RAMPX(['#6e3a30', '#9a6650', '#c49478', '#e2bc9a']);
const WET = RAMPX(['#c0605c', '#e8a09a']);
const CHAOSV = RAMPX(['#4a0a2a', '#8a1446', '#d0306a', '#ff7aa8']);         // chaos stone's veins: red ...
const CHAOSP = RAMPX(['#2c0e4e', '#5a1c8e', '#9a44d6', '#d6a2ff']);         // ... and purple
const SULF = RAMPX(['#e0c860', '#f6e698']);
const DIRTY = RAMPX(['#3a3410', '#545018']);
const IRONC = RAMPX(['#0e0e11', '#1c1c21', '#2e2f36', '#44464f', '#5e616c', '#868a96']);
const RUSTD = RAMPX(['#2a0e08', '#46180c', '#642412']);                      // dried blood and rust on the iron
const BONEC = RAMPX(['#4a3e2e', '#7a6a50', '#a89474', '#cfbe9a', '#ece0c0']);

/* staggered hexagons: centres every 10 px across, rows 8 px apart, odd rows shifted half a cell (repeats every 240) */
function hexCells(x, y, s) {
  const r = Math.floor(y / 8); let d1 = 99, d2 = 99, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) {
    const rr = r + j, wr = ((rr % 30) + 30) % 30, off = (wr & 1) * 5, c = Math.floor((x - off) / 10);
    for (let i = -1; i <= 1; i++) {
      const cc = c + i, wc = ((cc % 24) + 24) % 24;
      const px = cc * 10 + off + 5 + (hash2(wc, wr, s) - 0.5) * 2.4, py = rr * 8 + 4 + (hash2(wc, wr, s + 1) - 0.5) * 2, d = Math.hypot(x - px, (y - py) * 1.1);
      if (d < d1) { d2 = d1; d1 = d; id = hash2(wc, wr, s + 2); ox = x - px; oy = y - py; } else if (d < d2) d2 = d;
    }
  }
  return { d1, d2, id, ox, oy };
}

/* ---- solid ground ---- */
function vCinza(x, y) {   // pressed ash: fine laminae, soft grain, charred bits, pale flecks, now and then an ember not yet out
  const lam = ((y + cn(x, y, 5, 3, 10401) * 18 + cn(x, y, 20, 8, 10402) * 4) % 5 + 5) % 5;
  let v = 2.7 + cn(x, y, 30, 30, 10403) * 1.5 + cn(x, y, 90, 90, 10404) * 0.6 + cg(x, y, 10405) * 1.0 + (lam < 0.8 ? -0.9 : lam < 1.6 ? 0.5 : 0);
  const p = cells(x, y, 20, 10411, 1.3);
  if (p.id < 0.3) { const r = p.d1 / (2.5 + p.id * 8); if (r < 1) { if (hash2(x, y, 10412) < 0.18) return 0.6; return 3.6 + (1 - r) * 0.6 - (p.ox + p.oy) * 0.12 + cg(x, y, 10413) * 0.6; } if (r < 1.25) return 1.2; }   // a clast of pumice, full of holes
  const c = cells(x, y, 6, 10406);
  if (c.id < 0.12 && c.d1 < 1.3) return c.ox + c.oy < 0 ? 1.4 : 0.5;                        // a charred chip
  if (c.id > 0.9 && c.d1 < 1.1) return c.ox + c.oy < 0 ? 5.4 : 4.4;                          // a pale fleck of bone ash
  if (hash2(x, y, 10407) < 0.0035 && cn(x, y, 12, 12, 10408) > 0.1) { MATX = EMBER[hash2(x, y, 10409) < 0.3 ? 1 : 0]; return -9; }
  const k = Math.abs(cn(x, y, 18, 40, 10410)); if (k < 0.006) v -= 1.2;                     // a hairline crack across the beds
  return v;
}
function vBasalto(x, y) {   // basalt in hexagonal prisms seen end on: each face its own tone, lit rim to the top left, dark joints
  const h = hexCells(x, y, 10421), e = h.d2 - h.d1;
  if (e < 0.9) return 0.4 + e * 0.4;
  let v = 2.5 + (h.id - 0.5) * 1.4 + cn(x, y, 40, 40, 10422) * 0.8 + cg(x, y, 10423) * 0.45;
  if (e < 2.2) v += h.ox + h.oy < 0 ? 1.2 : -0.9;                                            // the bevel
  else if (e < 3) v += h.ox + h.oy < 0 ? 0.4 : -0.3;
  if (h.id < 0.2 && Math.abs((h.ox - h.oy * 0.6) + (h.id - 0.1) * 30) < 0.5) v -= 1.3;       // a face cracked across
  if (hash2(x, y, 10424) < 0.02) v -= 1.1;                                                    // vesicles
  if (hash2(x, y, 10425) < 0.0025) v = 5.4;
  return v;
}
function vObsidiana(x, y) {   // obsidian: near-black glass, shell fractures in rings, sharp purple glints at a slant
  let v = 1.9 + cn(x, y, 60, 60, 10431) * 1.2 + cn(x, y, 20, 20, 10432) * 0.4 + cg(x, y, 10433) * 0.2;
  const sh = cells(x, y, 30, 10434, 0.85), ring = sh.d1 % 6;
  if (sh.d2 - sh.d1 < 0.8) return 0.3;                                                         // a fracture edge
  if (ring < 0.7) v += 1.3; else if (ring < 1.4) v -= 0.5;
  if (sh.d2 - sh.d1 < 1.8 && sh.ox + sh.oy < 0) v += 1.6;                                     // the sharp lip of a shell catches the light
  const g = wrapT(x + y * 0.55 + cn(x, y, 24, 24, 10435) * 14) % 40, on = cn(x, y, 12, 12, 10437);
  if (on > 0.02) {   // the glints come and go along their line
    if (g < 0.9) { MATX = PURP[on > 0.12 ? 3 : 2]; return -9; }
    if (g < 1.9) { MATX = PURP[on > 0.1 ? 1 : 0]; return -9; }
  } else if (g < 1.4) v += 1;
  if (hash2(x, y, 10436) < 0.003) { MATX = PURP[3]; return -9; }
  return v;
}
function vCrosta(x, y) {   // magma crust: black plates with ropy wrinkles, split by cracks with orange light inside
  const c = cells(x, y, 20, 10441, 1.05), e = c.d2 - c.d1, hot = cn(x, y, 8, 8, 10442) + (c.id - 0.5) * 0.1;
  if (hot > 0.0) {
    if (e < 0.6) { MATX = MAGMA[hot > 0.16 ? 4 : 3]; return -9; }
    if (e < 1.2) { MATX = MAGMA[hot > 0.1 ? 2 : 1]; return -9; }
    if (e < 2 && hash2(x, y, 10443) < 0.45) { MATX = MAGMA[0]; return -9; }
  } else if (e < 1) { if (hot > -0.08 && hash2(x, y, 10447) < 0.5) { MATX = MAGMA[0]; return -9; } return 0.3; }
  let v = 2.5 + (c.id - 0.5) * 1.2 + cg(x, y, 10444) * 0.5 + cn(x, y, 40, 40, 10445) * 0.6;
  v += Math.sin(c.ox * 0.9 + Math.sin(c.oy * 0.7 + c.id * 9) * 1.6) * 0.45;                  // ropy wrinkles where it flowed and froze
  if (e < 3.4) v += c.ox + c.oy < 0 ? 0.9 : -0.6;
  if (hash2(x, y, 10446) < 0.03) v -= 1;
  return v;
}
function vCarne(x, y) {   // living flesh: muscle fibre in warped strands, raised veins, wet glints, a nodule of fat
  const wx = x + cn(x, y, 6, 6, 10451) * 30, wy = y + cn(x, y, 7, 5, 10452) * 26;
  let v = 2.7 + Math.sin(wx * 0.35 + wy * 0.95) * 0.6 + cn(x, y, 26, 26, 10453) * 1.3 + cg(x, y, 10454) * 0.45;
  const fat = cells(x, y, 24, 10455);
  if (fat.id < 0.22) { const r = fat.d1 / (3 + fat.id * 10); if (r < 1) { MATX = FAT[r < 0.45 && fat.ox + fat.oy < 0 ? 3 : r < 0.75 ? 2 : r < 0.9 ? 1 : 0]; return -9; } }
  const vn = Math.abs(cn(wx, wy, 14, 14, 10456)), vm = Math.abs(cn(wx * 1.3 + 40, wy * 1.3, 30, 30, 10457));
  if (vn < 0.011) { MATX = VEIN[vn < 0.005 ? 3 : 2]; return -9; }
  if (vn < 0.018) { MATX = VEIN[1]; return -9; }
  if (vm < 0.006) { MATX = VEIN[1]; return -9; }
  if (vn < 0.03) v -= 0.9;                                                                     // the shadow beside a vein
  if (hash2(x, y, 10458) < 0.006 && cn(x, y, 20, 20, 10459) > 0) { MATX = WET[hash2(x, y, 10460) < 0.3 ? 1 : 0]; return -9; }
  return v;
}
function vOsso(x, y) {   // bones pressed into dried gore: long bones with knobbed ends lying every which way, a skull now and then
  const cs = 16, n = TP / cs, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let best = -1, bv = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n, h = hash2(wx, wy, 10471);
    const px = cx * cs + 3 + hash2(wx, wy, 10472) * 10, py = cy * cs + 3 + hash2(wx, wy, 10473) * 10, dx = x + 0.5 - px, dy = y + 0.5 - py;
    let hit = -1, lv = 0;
    if (h < 0.12) {   // a skull: a round crown, two dark sockets
      const r = Math.hypot(dx, dy * 1.15); if (r < 4.6) {
        hit = h; lv = 4.4 - (dx + dy) * 0.32 - r * 0.25;
        if ((Math.abs(dx + 1.6) < 1 || Math.abs(dx - 1.6) < 1) && Math.abs(dy - 0.8) < 0.9) lv = 0.3;
        if (Math.abs(dx) < 0.6 && dy > 2 && dy < 3.2) lv = 0.8;
      }
    } else {   // a long bone: a shaft and two knobs
      const a = hash2(wx, wy, 10474) * Math.PI, ux = Math.cos(a), uy = Math.sin(a), L = 6 + hash2(wx, wy, 10475) * 5;
      const al = dx * ux + dy * uy, pe = -dx * uy + dy * ux, ca = Math.max(-L, Math.min(L, al));
      const knob = Math.min(Math.hypot(al - L, Math.abs(pe) - 1.1), Math.hypot(al + L, Math.abs(pe) - 1.1));
      const w = 1.5 + h * 0.7;
      if (Math.abs(pe) < w && Math.abs(al) <= L) { hit = h; lv = 2.9 + (pe / w) * Math.sign(uy - ux || 1) * 1.5 - (Math.abs(pe) / w > 0.8 ? 0.5 : 0); }
      else if (knob < 1.7) { hit = h; lv = 3.9 - knob * 0.8 - (dx + dy) * 0.08; }
      if (hit >= 0 && Math.abs(al - ca) < 0.01 && Math.abs(pe) < 0.3 && hash2(x, y, 10476) < 0.3) lv -= 0.8;
    }
    if (hit > best) { best = hit; bv = lv; }
  }
  if (best >= 0) { MATX = BONEC[Math.max(0, Math.min(4, bv + cg(x, y, 10477) * 0.8 - 0.6 | 0))]; return -9; }
  let v = 1.4 + cn(x, y, 30, 30, 10478) * 1.2 + cg(x, y, 10479) * 0.8;                        // the gore between them
  if (hash2(x, y, 10480) < 0.05) v += 1.2;                                                     // splinters
  return v;
}
function vEnxofre(x, y) {   // brimstone: faceted crystal grains, each split into three faces; dirty stains; bright points
  const c = cells(x, y, 8, 10491, 1), e = c.d2 - c.d1;
  if (e < 0.8) return 0.6 + cg(x, y, 10492) * 0.4;
  const a = Math.atan2(c.oy, c.ox) + c.id * 6.28, f = ((Math.floor(a / 2.094) % 3) + 3) % 3;
  let v = 2.7 + (c.id - 0.5) * 1.2 + (f === 0 ? 1.1 : f === 1 ? 0 : -0.9) + cg(x, y, 10493) * 0.4;
  if (c.d1 < 1 && c.id > 0.78 && c.ox + c.oy < 0.5) { MATX = SULF[c.id > 0.92 ? 1 : 0]; return -9; }             // the point of a crystal
  const st = cn(x, y, 14, 14, 10494); if (st > 0.26) { MATX = DIRTY[st > 0.33 ? 0 : 1]; return -9; }   // dirt in the grain
  if (st > 0.18) v -= 0.8;
  if (e < 1.6) v -= 0.5;
  return v;
}
function vFerroNegro(x, y) {   // black iron: plates 24 x 12 staggered, bevelled, riveted at the corners, a spiked stud on some
  const row = Math.floor(wrapT(y) / 12), ly = wrapT(y) % 12, off = row % 2 ? 12 : 0, lx = wrapT(x + off) % 24, pid = Math.floor(wrapT(x + off) / 24);
  if (ly === 11 || lx === 23) return 0.3;                                                       // the seam
  let v = 2.6 + (hash2(pid, row, 10501) - 0.5) * 0.8 + (ly === 0 ? 1.4 : ly === 10 ? -0.9 : 0) + (lx === 0 ? 0.9 : lx === 22 ? -0.7 : 0) + cg(x, y, 10502) * 0.35;
  v += Math.sin((x - y * 0.3) * 0.5 + pid) * 0.15;
  for (const [rx, ry] of [[2, 2], [20, 2], [2, 8], [20, 8]]) {                                 // rivets
    if (lx === rx && ly === ry) { MATX = IRONC[5]; return -9; }
    if ((lx === rx + 1 && ly === ry) || (lx === rx && ly === ry + 1)) { MATX = IRONC[3]; return -9; }
    if (lx === rx + 1 && ly === ry + 1) return 0.4;
  }
  if (hash2(pid, row, 10503) < 0.35) {                                                         // a small spiked stud, a pyramid
    const dx = lx - 11, dy = ly - 5, m = Math.abs(dx) + Math.abs(dy);
    if (m <= 2) { MATX = m === 0 ? IRONC[5] : dx + dy < 0 || (dx < 0 && dy <= 0) ? IRONC[4] : dx + dy > 0 ? IRONC[1] : IRONC[2]; return -9; }
    if (m === 3 && dx + dy >= 0) return 0.6;
  }
  const st = cn(x, y, 6, 30, 10504); if (st > 0.3 && ly > 2) { MATX = RUSTD[st > 0.38 ? 2 : st > 0.34 ? 1 : 0]; return -9; }   // a run of old blood and rust
  if (Math.abs(cn(x + y, y, 40, 40, 10505)) < 0.006) v += 1.2;                                 // a scratch
  return v;
}
// worn runes cut into the brick: 5 x 5 glyphs
const GLYPHS = [
  ['..#..', '.###.', '..#..', '.#.#.', '#...#'], ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], ['###..', '..#..', '..###', '..#..', '###..'],
  ['.#.#.', '.#.#.', '#####', '..#..', '..#..'], ['#.#.#', '#.#.#', '.###.', '..#..', '.###.'], ['..##.', '.#...', '#####', '...#.', '.##..']
];
function vTijolo(x, y) {   // hell brick: courses 8 high, bricks 16 long, chipped corners, deep mortar, runes worn into a few
  const row = Math.floor(wrapT(y) / 8), ly = wrapT(y) % 8, off = row % 2 ? 8 : 0, lx = wrapT(x + off) % 16, bk = Math.floor(wrapT(x + off) / 16);
  if (ly === 7 || lx === 15) return 0.4 + cg(x, y, 10511) * 0.4;
  const hb = hash2(bk, row, 10512);
  if ((lx === 0 || lx === 14) && (ly === 0 || ly === 6) && hash2(bk, row * 4 + lx + ly, 10513) < 0.6) return 0.7;   // a chipped corner
  let v = 2.6 + (hb - 0.5) * 1.5 + (ly === 0 ? 1 : ly === 6 ? -0.7 : 0) + (lx === 0 ? 0.5 : lx === 14 ? -0.5 : 0) + cg(x, y, 10514) * 0.55 + cn(x, y, 30, 30, 10515) * 0.6;
  if (hb < 0.16) {
    const G = GLYPHS[(hb * 100 | 0) % GLYPHS.length], gx = lx - 5, gy = ly - 1;
    if (gx >= 0 && gx < 5 && gy >= 0 && gy < 5 && G[gy][gx] === '#' && hash2(x, y, 10516) < 0.8) return 0.5;          // the groove
    if (gx >= 0 && gx < 5 && gy >= 1 && gy < 6 && G[gy - 1][gx] === '#' && !(gy < 5 && G[gy][gx] === '#')) v += 1.1;   // its lit lower lip
  }
  if (Math.abs(cn(x, y, 30, 30, 10517)) < 0.008) v -= 1.4;                                     // cracks
  const soot = cn(x, y, 12, 5, 10518); if (soot > 0.08) v -= (soot - 0.08) * 6;
  return v;
}
function vCaos(x, y) {   // chaos stone: twisted bands, folded on themselves, veins of red and purple running through
  const wx = x + cn(x, y, 5, 5, 10521) * 70 + cn(x, y, 13, 13, 10522) * 14, wy = y + cn(x, y, 6, 4, 10523) * 60;
  const b = Math.sin(wx * 0.16 + wy * 0.09 + Math.sin(wy * 0.05) * 2);
  let v = 2.6 + b * 0.8 + cn(x, y, 36, 36, 10524) * 1 + cg(x, y, 10525) * 0.5;
  if (b > 0.85) v += 0.6; else if (b < -0.9) v -= 0.8;
  const vein = Math.abs(cn(wx, wy, 12, 12, 10526)), red = cn(x, y, 3, 3, 10527) > 0;
  if (vein < 0.007) { MATX = (red ? CHAOSV : CHAOSP)[vein < 0.003 ? 3 : 2]; return -9; }
  if (vein < 0.013) { MATX = (red ? CHAOSV : CHAOSP)[hash2(x, y, 10528) < 0.5 ? 1 : 0]; return -9; }
  if (vein < 0.022) v -= 0.9;
  if (hash2(x, y, 10529) < 0.0025) { MATX = CHAOSP[3]; return -9; }
  return v;
}
function vBarreira(x, y) {   // the boss hall's grate: black iron bars, crossbars with spikes, rivets still red hot
  const bx = wrapT(x) % 6, cy = wrapT(y) % 24;
  if (cy < 5) {
    if (cy === 0 && (bx === 2 || bx === 3)) return 3.6;                                         // a spike on the crossbar
    if (cy === 0) return 0.3;
    let v = cy === 1 ? 4.6 : cy === 4 ? 1.2 : 3.2; if (cy === 2 && bx === 1 && wrapT(x) % 12 < 6) { MATX = EMBER[2]; return -9; } if (cy === 3 && bx === 1 && wrapT(x) % 12 < 6) { MATX = EMBER[0]; return -9; }
    return v + cg(x, y, 10531) * 0.3;
  }
  if (bx > 3) return 0.3;
  let v = bx === 0 ? 4.4 : bx === 1 ? 3.6 : bx === 2 ? 2.6 : 1.4; v += cg(x, y, 10532) * 0.3;
  return v;
}

/* ---- back walls ---- */
function vCinzaW(x, y) { const v = vCinza(x, y); return v === -9 ? 3.4 : v; }
function vBasaltoW(x, y) {   // basalt columns seen from the side: upright prisms 8-12 px wide, cross joints, lit left faces
  const k = Math.floor(wrapT(x) / 10), lx = wrapT(x) % 10, jy = wrapT(y + hash2(k, 0, 10541) * 40) % (26 + (hash2(k, 1, 10542) * 3 | 0) * 6);
  if (lx === 9 || jy === 0) return 0.4;
  let v = 2.6 + (hash2(k, Math.floor(wrapT(y + hash2(k, 0, 10541) * 40) / 26), 10543) - 0.5) * 0.9 + (lx < 3 ? 1 : lx > 6 ? -0.8 : 0) + cg(x, y, 10544) * 0.35 + cn(x, y, 30, 30, 10545) * 0.5;
  if (jy === 1) v += 0.9;
  return v;
}
function vCarneW(x, y) {   // a wall of flesh: deep upright folds, a vein between them
  const wx = x + cn(x, y, 4, 8, 10551) * 40, f = Math.sin(wx * 0.32), vn = Math.abs(cn(wx, y, 10, 10, 10552));
  let v = 2.6 + f * 1.1 + cn(x, y, 30, 30, 10553) * 0.8 + cg(x, y, 10554) * 0.4 + Math.sin(y * 0.6 + wx * 0.2) * 0.25;
  if (f < -0.85) v -= 0.9;
  if (vn < 0.012) v = 4.2; else if (vn < 0.022) v -= 0.6;
  return v;
}
function vTijoloW(x, y) { return vTijolo(x, y); }
function vCaosW(x, y) { const v = vCaos(x, y); return v === -9 ? 4.2 : v; }

/* ---- far layer ---- */
function vDpAbRocha(x, y) {   // far rock in ledges; the red light of lava far below catches the undersides and fills the fissures
  const led = ((y + cn(x, y, 5, 4, 10601) * 26) % 30 + 30) % 30;
  let v = 2.1 + cn(x, y, 28, 28, 10602) * 1.2 + cg(x, y, 10603) * 0.35;
  if (led > 26) v += (led - 26) * 0.7;                       // the underside of a ledge, glowing
  else if (led < 2) v -= 0.9;
  const c = cells(x, y, 30, 10604, 0.8); if (c.d2 - c.d1 < 1.2 && c.oy > -6) v += 2.4 - (c.d2 - c.d1);   // fissures with light in them
  return v;
}
function vDpAbRuinas(x, y) {   // towers and walls far off, black against the glow: battlements, spires, a lit window here and there
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, k = Math.floor(wrapT(x + band * 37) / 40), lx = wrapT(x + band * 37) % 40;
  const tw = 12 + hash2(k, band, 10611) * 14, c0 = 20 - tw / 2, top = 18 + hash2(k, band, 10612) * 60, spire = hash2(k, band, 10613) < 0.45;
  const sky = 2.2 + by / 120 * 2.8 + cn(x, y, 20, 10, 10614) * 0.6 + cg(x, y, 10615) * 0.25;  // the glow rises from below
  const wallTop = 96 + Math.sin(x * 0.05) * 2;
  const inT = lx >= c0 && lx < c0 + tw;
  if (inT && by >= top) {
    const ux = lx - c0;
    if (by < top + 3 && Math.floor(ux / 3) % 2 === 1) return sky;                               // the crenels
    if (hash2(Math.floor(ux / 3), Math.floor((by - top) / 6), 10616 + k) < 0.08 && ux % 3 === 1 && (by - top) % 6 < 3) return 4.6;   // a window
    return 0.7 + (ux < 2 ? 0.6 : 0) + cg(x, y, 10617) * 0.3;
  }
  if (inT && spire && by >= top - 16 && Math.abs(lx - 20) < (by - (top - 16)) / 16 * tw / 2.2) return 0.8;   // a spire
  if (by >= wallTop) return by < wallTop + 2 && Math.floor(x / 4) % 2 ? sky : 1.1 + cg(x, y, 10618) * 0.3;  // the long wall
  return sky;
}
function vDpAbCarne(x, y) {   // walls of flesh far back: great ribbed folds, veins, the dark between them
  const wx = x + cn(x, y, 3, 6, 10621) * 60, f = Math.sin(wx * 0.12), rib = Math.sin(y * 0.22 + wx * 0.05);
  let v = 2.2 + f * 1.2 + (rib > 0.8 ? 0.6 : 0) + cn(x, y, 24, 24, 10622) * 0.7 + cg(x, y, 10623) * 0.3;
  if (f < -0.8) v -= 1;
  if (Math.abs(cn(wx, y, 8, 8, 10624)) < 0.01) v += 1.6;
  return v;
}

/* ---- bake and register ---- */
const BKV = {
  cinza: bake(vCinza), basalto: bake(vBasalto), obsidiana: bake(vObsidiana), crosta: bake(vCrosta), carne: bake(vCarne), osso: bake(vOsso), enxofre: bake(vEnxofre),
  ferro: bake(vFerroNegro), tijolo: bake(vTijolo), caos: bake(vCaos), barreira: bake(vBarreira),
  cinzaW: bake(vCinzaW), basaltoW: bake(vBasaltoW), carneW: bake(vCarneW), tijoloW: bake(vTijoloW), caosW: bake(vCaosW),
  dpRocha: bake(vDpAbRocha), dpRuinas: bake(vDpAbRuinas), dpCarne: bake(vDpAbCarne)
};
const AB_SOLID = [
  // id, palette, texture, dig, map colour
  [AB_CINZA, 'abCinza', 'cinza', 0.45, '#463f3c'], [AB_BASALTO, 'abBasalto', 'basalto', 0.85, '#2b3242'], [AB_OBSIDIANA, 'abObsidiana', 'obsidiana', 1.15, '#2a213b'],
  [AB_CROSTA, 'abCrosta', 'crosta', 0.8, '#7a2a10'], [AB_CARNE, 'abCarne', 'carne', 0.35, '#69181e'], [AB_OSSO, 'abOsso', 'osso', 0.55, '#a89474'],
  [AB_ENXOFRE, 'abEnxofre', 'enxofre', 0.5, '#ac952c'], [AB_FERRO_NEGRO, 'abFerro', 'ferro', 1.0, '#33363f'], [AB_TIJOLO, 'abTijolo', 'tijolo', 0.9, '#601b19'],
  [AB_CAOS, 'abCaos', 'caos', 1.0, '#432645'], [AB_BARREIRA, 'abBarreira', 'barreira', 0, '#3a3d49']
];
for (const [t, p, k, dig, col] of AB_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [AB_CINZA, AB_BASALTO, AB_OBSIDIANA, AB_CROSTA, AB_CARNE, AB_OSSO, AB_ENXOFRE, AB_CAOS]) BLEND[t] = 1;
EMIT[AB_CROSTA] = 0.28;   // the cracks give a little light

WMAT[WAB_CINZA] = [PALS.abCinzaW, BKV.cinzaW]; WMAT[WAB_BASALTO] = [PALS.abBasaltoW, BKV.basaltoW]; WMAT[WAB_CARNE] = [PALS.abCarneW, BKV.carneW];
WMAT[WAB_TIJOLO] = [PALS.abTijoloW, BKV.tijoloW]; WMAT[WAB_CAOS] = [PALS.abCaosW, BKV.caosW];
DMAT[DP_AB_ROCHA] = [PALS.dpAbRocha, BKV.dpRocha]; DMAT[DP_AB_RUINAS] = [PALS.dpAbRuinas, BKV.dpRuinas]; DMAT[DP_AB_CARNE] = [PALS.dpAbCarne, BKV.dpCarne];

/* ---- the ores: coal in the basalt, and infernita: dark angular lumps of metal holding an ember-red heat ---- */
oreRamp(AB_O_INFERNITA, ['#120303', '#2c0806', '#541008', '#8a1a0a', '#c8320e', '#ff6c26', '#ffd690']);
ORE_PAINT[AB_O_INFERNITA] = function (L, s) {
  const R = ORE_RAMP[AB_O_INFERNITA], pts = oreNodes(L, s, R, 60, [2.8, 0.7], [1.3, 0.5], 4);
  // the heat sits in the lit faces as bright specks; a thin glowing seam runs out of the main lump
  for (let k = 0; k < 144; k++) if (L.m[k] && L.l[k] > 3.2 && hash2(k, s, 65) < 0.3) L.put(k % 12, k / 12 | 0, R[5], L.l[k]);
  const a = hash2(s, 2, 66) * 6.28, [x0, y0] = pts[0];
  oreLine(L, x0, y0, x0 + Math.cos(a) * 6, y0 + Math.sin(a) * 4, (x, y) => { if (!L.m[y * 12 + x] && hash2(x + s, y, 67) < 0.75) L.put(x, y, R[3], 1); });
};
ORE_HALO[AB_O_INFERNITA] = { pal: ['abBasalto', '#b02a0c', 0.42, 0.16], shade: 0.35 };
ORE_PAINT[AB_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[AB_O_CARVAO] = { pal: ['abBasalto', '#020204', 0.5, 0.2], shade: 0 };
MAT[AB_O_CARVAO] = [PALS.abBasalto, bakeOre(AB_O_CARVAO, vBasalto)]; MAT[AB_O_INFERNITA] = [PALS.abBasalto, bakeOre(AB_O_INFERNITA, vBasalto)];
for (const t of [AB_O_CARVAO, AB_O_INFERNITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[AB_O_CARVAO] = DIG[COAL]; ORE_XP[AB_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[AB_O_CARVAO] = ORE_NAME[COAL]; PCOL[AB_O_CARVAO] = PCOL[COAL]; ORE_ITEM[AB_O_CARVAO] = ORE_ITEM[COAL];
DIG[AB_O_INFERNITA] = 1.25; ORE_XP[AB_O_INFERNITA] = ORE_XP[CRYSTAL]; ORE_NAME[AB_O_INFERNITA] = 'Infernita'; PCOL[AB_O_INFERNITA] = '#d0381a'; ORE_ITEM[AB_O_INFERNITA] = 'min_infernita';
EMIT[AB_O_INFERNITA] = 0.4;

/* ---- block items ---- */
const AB_ITEMS = {
  cinza: ['Cinza', AB_CINZA, 'Cinza prensada de fogueiras que nunca apagam. Esfarela na mão.'],
  basalto: ['Basalto', AB_BASALTO, 'Rocha preta e azulada que racha em prismas de seis lados.'],
  obsidiana: ['Obsidiana', AB_OBSIDIANA, 'Vidro preto de lava, com um brilho roxo. Corta como faca.'],
  crosta: ['Crosta de Magma', AB_CROSTA, 'Uma casca preta sobre o fogo. Ainda está quente.'],
  carne_viva: ['Carne Viva', AB_CARNE, 'Vermelha, mole e cheia de veias. Às vezes ainda pulsa.'],
  enxofre: ['Enxofre', AB_ENXOFRE, 'Cristais amarelos e sujos. O cheiro não sai das mãos.'],
  ferro_negro: ['Ferro Negro', AB_FERRO_NEGRO, 'Chapas rebitadas com espinhos. Ninguém sabe quem as forjou.'],
  tijolo_infernal: ['Tijolo Infernal', AB_TIJOLO, 'Tijolo vermelho e preto com runas gastas. Não esfria nunca.'],
  pedra_caos: ['Pedra do Caos', AB_CAOS, 'Pedra torcida, com veios roxos e vermelhos. Parece se mexer.']
};
for (const id in AB_ITEMS) { const [name, block, desc] = AB_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[AB_OSSO] = 'osso';

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRA = {
  ferro: ['#08080a', '#121216', '#1e1f25', '#2e3038', '#43464f', '#5e626c', '#868a96'],
  fogo: ['#1a0604', '#5a1404', '#a83a08', '#e8641a', '#ff9a2a', '#ffd070', '#fff4c8'],
  osso: ['#2a2218', '#4a3e2e', '#6e604a', '#958468', '#b8a888', '#d6c8a8', '#f0e6cc'],
  obsid: ['#050409', '#0c0a14', '#17121f', '#241c33', '#362a4e', '#5c4090', '#b496f0'],
  carne: ['#1a0406', '#34080c', '#521016', '#701a20', '#90282c', '#b04440', '#d47a70'],
  runa: ['#1a0a2e', '#3a1466', '#6a26b0', '#9a4ae8', '#c48aff', '#e8ccff', '#ffffff'],
  caos: ['#14061e', '#32104a', '#5a1870', '#901e78', '#c82a6a', '#f0607a', '#ffd0dc'],
  basalto: ['#07080b', '#10131a', '#1a1f29', '#262d3a', '#343d4e', '#465166', '#5c6880'],
  cinza: ['#100d0d', '#1e1a19', '#2e2826', '#403835', '#544a45', '#6a5e58', '#84766e'],
  brasa: ['#0a0707', '#161010', '#241a18', '#5a1404', '#a83a08', '#ff8a20', '#ffd27a']
};
for (const k in DRA) DRA[k] = DRA[k].map(h => ph(h));
const flipY = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[(T - 1 - y) * T + x]; return b; };
const flipX = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[y * T + T - 1 - x]; return b; };
const rimOut = (a, o, top = true) => { const b = a.slice(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (top && y > 0 && b[k - T]) || (y < T - 1 && b[k + T]))) a[k] = o; } return a; };
const spr = () => { const a = new Uint32Array(T * T); a.put = (x, y, R, v) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = dPix(R, v); }; return a; };

/* a black iron chain: a ring seen face on, then one seen edge on, seamless down; the last piece ends in a broken link */
function chainSprite(end, s) {
  const a = spr(), I = DRA.ferro;
  const ring = y0 => {   // a link seen face on: 4 wide, 5 high, the hole dark
    for (let y = 0; y < 5; y++) for (let x = 4; x <= 7; x++) {
      const yy = y0 + y; if ((y === 0 || y === 4) && (x === 4 || x === 7)) continue;
      if (y > 0 && y < 4 && (x === 5 || x === 6)) { if (y === 1) a.put(x, yy, I, 0.6); continue; }
      a.put(x, yy, I, (x === 4 || y === 0 ? 5 : x === 7 || y === 4 ? 2.4 : 3.6) + cg(x, yy, s) * 0.4);
    }
  };
  const edge = y0 => { for (let y = y0; y < y0 + 3; y++) { a.put(5, y, I, 4.4 + (y === y0 + 1 ? 1 : 0)); a.put(6, y, I, 2.2); } };   // a link edge on
  ring(0); edge(4); ring(6); if (!end) edge(10);
  if (end) { a.put(5, 10, I, 4); a.put(5, 11, I, 3.4); a.put(7, 11, I, 2.6); }   // the last link hangs open
  if (s % 2) { a.put(4, 7, DRA.brasa, 3); a.put(5, 9, DRA.brasa, 3); }        // dried blood on a link
  return rimOut(a, I[0]);
}
const CORRENTE = [chainSprite(false, 10701), chainSprite(false, 10702), chainSprite(true, 10703)];
const CHAIN_LINK = CORRENTE[0];

/* bone spikes standing out of the floor, curved, sharp, a little gore at the root */
function spikesSprite(s) {
  const a = spr(), O = DRA.osso;
  const n = 3 + (s % 2), xs = s % 2 ? [1.5, 4.5, 7.5, 10] : [2.5, 6, 9.5];
  for (let i = 0; i < n; i++) {
    const bx = xs[i], h = 6 + hash2(s, i, 10711) * 5, lean = (hash2(s, i, 10712) - 0.5) * 3.4, w0 = 1.9 + hash2(s, i, 10713) * 0.6;
    for (let y = 0; y < T; y++) {
      const t = (T - 1 - y) / h; if (t > 1) continue;
      const cx = bx + lean * t * t, half = Math.max(0.35, w0 * (1 - t));
      for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) { const d = (x + 0.5 - cx) / half; if (Math.abs(d) > 1) continue; a.put(x, y, O, 4.6 - d * 1.6 - t * 0.4 + cg(x, y, s + i) * 0.4 + (t > 0.82 ? 1 : 0)); }
    }
  }
  for (let x = 0; x < T; x++) if (hash2(x, s, 10714) < 0.6) a.put(x, 11, DRA.carne, 1.6 + hash2(x, s, 10715) * 1.6);   // gore at the root
  return rimOut(a, O[0]);
}
const ESPINHOS = [spikesSprite(10721), spikesSprite(10722)];

/* a brazier: a black iron bowl on three legs, glowing coals and tongues of fire over them */
function brazierSprite(s) {
  const a = spr(), I = DRA.ferro, F = DRA.fogo;
  for (let y = 0; y < 6; y++) for (let x = 1; x < 11; x++) {   // the flames
    const cx = x + 0.5 - 6, tongue = 5.2 - Math.abs(cx) * 0.6 + Math.sin(x * 1.9 + s) * 1.3 + hash2(x, s, 10731) * 1.2, t = (5.5 - y) / Math.max(0.5, tongue);
    if (t > 1 || t < 0) continue;
    a.put(x, y, F, 6.4 - t * 3.6 - Math.abs(cx) * 0.35 + cg(x, y, s) * 0.5);
  }
  for (let x = 2; x < 10; x++) a.put(x, 5, DRA.brasa, 4.6 + hash2(x, s, 10732) * 1.6);   // coals
  for (let y = 6; y < 9; y++) { const hw = 5 - (y - 6) * 1.2; for (let x = Math.round(6 - hw); x < Math.round(6 + hw); x++) a.put(x, y, I, (y === 6 ? 5.2 : 3.6) - (x - 1) * 0.3 + (x % 3 === 0 && y === 7 ? 1 : 0) + cg(x, y, s) * 0.3); }   // the bowl, a lit rim
  a.put(1, 6, I, 4.4); a.put(10, 6, I, 3); a.put(0, 5, I, 4.6); a.put(11, 5, I, 3.2);                               // the horns of the rim
  for (const [x0, dx] of [[3, -1], [6, 0], [8, 1]]) for (let y = 9; y < 12; y++) a.put(x0 + (y > 10 ? dx : 0), y, I, dx < 0 ? 4.4 : dx > 0 ? 2.4 : 3.4);   // the legs
  return rimOut(a, I[0]);
}
const BRASEIRO = [brazierSprite(10741), brazierSprite(10742)];

/* a flame on the bare floor: a bed of cracked embers and the fire licking up from a vent */
function flameSprite(s) {
  const a = spr(), F = DRA.fogo;
  const tongues = [[6 + (s % 3 - 1), 9.5, 2.6], [3 + hash2(s, 1, 10751) * 1.5, 6, 1.7], [9 - hash2(s, 2, 10751) * 1.5, 6.5, 1.8]];
  for (const [cx0, h, w] of tongues) for (let y = 0; y < 11; y++) {
    const t = (10.5 - y) / h; if (t > 1 || t < 0) continue;
    const cx = cx0 + Math.sin(t * 3 + s) * 0.8 * t, half = w * Math.sin(Math.min(1, t * 1.4 + 0.25) * Math.PI) * (1 - t * 0.5) + 0.3;
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) { const d = Math.abs(x + 0.5 - cx) / half; if (d > 1) continue; a.put(x, y, F, Math.max(a[y * T + x] ? 3 : 0, 6.3 - d * 2.6 - t * 3 + cg(x, y, s) * 0.4)); }
  }
  for (let x = 1; x < 11; x++) { a.put(x, 11, DRA.brasa, hash2(x, s, 10752) < 0.35 ? 5 : 1.6); if (Math.abs(x - 6) < 4) a.put(x, 10, DRA.brasa, hash2(x, s, 10753) < 0.5 ? 6 : 4.4); }
  return a;
}
const CHAMA = [flameSprite(10761), flameSprite(10762), flameSprite(10763)];

/* a heap of skulls: two below, one on top; one of them horned */
function skullsSprite(s) {
  const a = spr(), O = DRA.osso;
  const SK = ['.#####.', '#######', '#oo#oo#', '#oo#oo#', '###n###', '.#####.', '.t#t#t.'];   // crown, sockets, nose, teeth
  const skull = (x0, y0, horn) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const ch = SK[y][x]; if (ch === '.') continue;
      a.put(x0 + x, y0 + y, O, ch === 'o' ? (x % 3 === 1 && y === 2 ? 0.2 : 0.8) : ch === 'n' ? 1 : ch === 't' ? 3.4 : 5.2 - (x + y) * 0.36 + cg(x0 + x, y0 + y, s) * 0.4);
    }
    if (horn) for (const [hx, d] of [[0, -1], [6, 1]]) for (let k = 0; k < 3; k++) a.put(x0 + hx + d * (k > 0 ? 1 : 0), y0 - k, O, 4 - k * 0.6 - (d > 0 ? 1 : 0));
  };
  if (s % 2) { skull(-1, 5, false); skull(5, 5, false); skull(2, 1, true); } else { skull(0, 5, true); skull(6, 6, false); }
  return rimOut(a, O[0]);
}
const CRANIOS = [skullsSprite(10771), skullsSprite(10772)];

/* an obsidian stalagmite: black glass, a cutting light down its face, a purple glint near the tip */
function obsidCone(w0, len, s, off = 0) {
  return cvSprite((x, y) => {
    const t = (T - 1 - y) / len; if (t > 1) return 0;
    const half = Math.max(0.3, (1 - Math.pow(t, 0.75)) * w0 / 2), cx = 5.5 + off + Math.sin(t * 2 + s) * 0.3, dx = x + 0.5 - cx - 0.5;
    if (Math.abs(dx) > half) return 0;
    const u = (dx / half + 1) / 2; let v = 3.8 - u * 2.6 + cg(x, y, s) * 0.3;
    if (Math.abs(u - 0.3) < 0.12) v += 2.4;   // the sharp light down its face
    if (t > 0.8) v += 1.2;
    return dPix(DRA.obsid, v);
  }, DRA.obsid[0]);
}
const ESTALAG = [obsidCone(9, 26, 1), obsidCone(7, 11.5, 2), obsidCone(4, 9, 3, -0.5)];   // [base, ponta, ponta fina]

/* a flesh tendril hanging down: a swaying tube with pale suckers along one side; the last piece curls to a tip */
function tendrilSprite(tip, s) {
  const a = spr(), C = DRA.carne;
  const len = tip ? 11 : 12;
  for (let y = 0; y < len; y++) {
    const t = y / 12, cx = 6 + Math.sin(y / 12 * Math.PI * 2 + s) * 1.6 + (tip ? t * t * 2.2 : 0), half = tip ? 2.2 * (1 - t * 0.85) + 0.3 : 2.2;
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const d = (x + 0.5 - cx) / half; if (Math.abs(d) > 1) continue;
      let v = 4.4 - d * 1.8 + cg(x, y, s) * 0.4 + ((y + s) % 3 === 0 ? -0.5 : 0);
      if (d > 0.35 && d < 0.95 && (y + s) % 3 === 1) v = 6;       // suckers
      a.put(x, y, C, v);
    }
  }
  if (tip) { a.put(7 + (s % 2), 11, C, 3); }
  return rimOut(a, C[0], false);
}
const TENTACULO = [tendrilSprite(false, 0), tendrilSprite(true, 0)];

/* a rune stone: a squat stele of ash rock with a glyph burning purple in it */
function runeSprite(g, s) {
  const a = spr(), P = DRA.cinza, R = DRA.runa, G = GLYPHS[g];
  for (let y = 2; y < T; y++) for (let x = 2; x <= 9; x++) {
    const top = y < 4 && ((x === 2 || x === 9) || (y === 2 && (x === 3 || x === 8))); if (top) continue;
    a.put(x, y, P, 4.2 - (x - 2) * 0.34 - (y > 10 ? 0.8 : 0) + (y === 2 || (y === 3 && (x === 3 || x === 8)) ? 1.2 : 0) + cg(x, y, s) * 0.7);
  }
  for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) if (G[gy][gx] === '#') a.put(3.5 + gx, 4 + gy, R, 4.6 + (gx === 2 || gy === 2 ? 1.2 : 0));
  for (let x = 1; x <= 10; x++) a.put(x, 11, P, 1.6 + hash2(x, s, 10781) * 0.8);
  return rimOut(a, P[0]);
}
const RUNA = [runeSprite(0, 10791), runeSprite(4, 10792), runeSprite(5, 10793)];

/* chaos crystals: a cluster of purple-red prisms out of a lump of chaos stone */
function chaosCrystal(s) {
  const a = new Uint32Array(T * T);
  for (let x = 1; x < 11; x++) for (let y = 9; y < 12; y++) if (Math.abs(x - 5.5) < 5 - (11 - y) * 0.8) a[y * T + x] = dPix(DRA.basalto, 3.4 - x * 0.18 - (y - 9) * 0.5 + cg(x, y, s) * 0.6);
  const pts = s === 1 ? [[2.5, 5, -0.5], [5.5, 10, 0.05], [8.5, 7, 0.4]] : [[3, 7, -0.3], [6.5, 9, 0.2], [9.5, 4.5, 0.7], [4.5, 4, -0.8]];
  for (const [bx, len, ang] of pts) {
    const ux = Math.sin(ang), uy = -Math.cos(ang);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - 10, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const w = 1.35 * Math.min(1, (len - al) / 2); if (Math.abs(pe) > w) continue;
      a[y * T + x] = dPix(DRA.caos, (pe < -0.3 ? 4.6 : pe > 0.3 ? 2.6 : 5.8) + (al > len - 1.5 ? 0.8 : 0) - (al < 1 ? 1.4 : 0) - (al / len < 0.5 ? 0.4 : 0));
    }
  }
  return rimOut(a, DRA.caos[0]);
}
const CRISTAL = [chaosCrystal(1), chaosCrystal(2)];

/* the black iron ladder: flat side bars with rivets, round rungs every 4 px, seamless up and down */
function ladderSprite(s) {
  const a = spr(), I = DRA.ferro;
  for (let y = 0; y < T; y++) for (const [x, v] of [[1, 4.8], [2, 3], [9, 4.4], [10, 2.6]]) a.put(x, y, I, v + cg(x, y, s) * 0.3);
  for (const ry of [1, 5, 9]) for (let x = 3; x <= 8; x++) { a.put(x, ry, I, 5 - (x - 3) * 0.2 + cg(x, ry, s) * 0.3); a.put(x, ry + 1, I, 2.4); }
  for (const ry of [3, 7, 11]) { a.put(1, ry, I, 6); a.put(9, ry, I, 5.6); }   // rivets
  if (s % 2) { for (let x = 3; x <= 8; x++) { a.put(x, 5, DRA.brasa, x < 6 ? 3.4 : 1.4); a.put(x, 6, I, 1.2); } a.put(2, 8, DRA.brasa, 3); a.put(2, 9, DRA.brasa, 2.6); }   // a rung bent and rusted
  return a;
}
const ESCADA = [ladderSprite(10801), ladderSprite(10802)];

/* a butcher's hook on its chain, a scrap of meat still on it now and then */
function hookSprite(meat, s) {
  const a = spr(), I = DRA.ferro;
  for (let y = 0; y < 4; y++) { a.put(5, y, I, 4.6 - (y % 2) * 1.4); a.put(6, y, I, 2.4); }
  for (let x = 4; x <= 7; x++) { a.put(x, 4, I, 4.6 - (x - 4) * 0.6); a.put(x, 5, I, 2.2); }   // the collar
  for (let y = 6; y < 10; y++) { a.put(6, y, I, 4.6); a.put(7, y, I, 2.6); }                   // the shank
  for (const [x, y, v] of [[6, 10, 4], [5, 11, 3.6], [4, 11, 3.2], [3, 10, 3.4], [3, 9, 4.4], [2, 8, 4], [3, 8, 2.4], [7, 10, 2.2]]) a.put(x, y, I, v);   // the curve and the point
  if (meat) for (let y = 7; y < 12; y++) for (let x = 2; x < 6; x++) { const d = Math.hypot(x - 3.5, (y - 9.5) * 0.8); if (d < 2.2 && !(x === 3 && y === 9)) a.put(x, y, DRA.carne, 4.6 - d - (x - 3) * 0.3 + cg(x, y, s) * 0.8); }
  return rimOut(a, I[0]);
}
const GANCHO = [hookSprite(false, 10811), hookSprite(true, 10812)];

/* a basalt column: one prism standing from floor to roof, three faces, a cross joint now and then; a broken foot and head */
function columnPiece(k, s) {   // 0 foot, 1 shaft, 2 head
  const B = DRA.basalto;
  return cvSprite((x, y) => {
    let half = 3.6;
    if (k === 0) half += Math.max(0, (y - 7) * 0.55); if (k === 2) half += Math.max(0, (4 - y) * 0.55);
    const dx = x + 0.5 - 6; if (Math.abs(dx) > half) return 0;
    const u = (dx / half + 1) / 2, face = u < 0.3 ? 0 : u < 0.72 ? 1 : 2;
    let v = (face === 0 ? 4.8 : face === 1 ? 3.4 : 1.8) + cg(x, y, s) * 0.45;
    if (face === 1 && (u < 0.34 || u > 0.68)) v -= 0.6;                                  // the arrises between faces
    if (k === 1 && s % 2 && y === 5) v = 0.6; else if (k === 1 && s % 2 && y === 6) v += 1;   // a cross joint
    if ((k === 0 && y > 9) || (k === 2 && y < 2)) v -= 0.6 + hash2(x, y, s) * 0.8;
    return dPix(B, v);
  }, B[0]);
}
const COLUNA = [columnPiece(0, 10821), columnPiece(1, 10822), columnPiece(2, 10823), columnPiece(1, 10824)];

DECO[AB_CORRENTE] = CORRENTE; DECO[AB_ESPINHOS] = ESPINHOS; DECO[AB_BRASEIRO] = BRASEIRO; DECO[AB_CHAMA] = CHAMA; DECO[AB_CRANIOS] = CRANIOS; DECO[AB_ESTALAG] = ESTALAG;
DECO[AB_TENTACULO] = TENTACULO; DECO[AB_RUNA] = RUNA; DECO[AB_CRISTAL] = CRISTAL; DECO[AB_ESCADA] = ESCADA; DECO[AB_GANCHO] = GANCHO; DECO[AB_COLUNA] = COLUNA;
const AB_DECO = [
  // id, dig, map colour, drop
  [AB_CORRENTE, 0.15, '#43464f', null], [AB_ESPINHOS, 0.12, '#d6c8a8', 'osso'], [AB_BRASEIRO, 0.2, '#ff8a20', null], [AB_CHAMA, 0.05, '#ffb04a', null],
  [AB_CRANIOS, 0.08, '#d6c8a8', 'osso'], [AB_ESTALAG, 0.3, '#362a4e', 'obsidiana'], [AB_TENTACULO, 0.08, '#90282c', 'carne_viva'], [AB_RUNA, 0.3, '#9a4ae8', 'cinza'],
  [AB_CRISTAL, 0.25, '#c82a6a', null], [AB_ESCADA, 0.3, '#5e626c', null], [AB_GANCHO, 0.15, '#5e626c', null], [AB_COLUNA, 0.6, '#343d4e', 'basalto']
];
for (const [t, dig, col, drop] of AB_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[AB_BRASEIRO] = 1.0; EMIT[AB_CHAMA] = 0.8; EMIT[AB_RUNA] = 0.5; EMIT[AB_CRISTAL] = 0.5;
for (const t of [AB_CORRENTE, AB_TENTACULO, AB_GANCHO, AB_COLUNA]) CV_HANGS[t] = 1;
for (const t of [AB_ESPINHOS, AB_BRASEIRO, AB_CHAMA, AB_CRANIOS, AB_ESTALAG, AB_RUNA, AB_CRISTAL, AB_COLUNA]) CV_STANDS[t] = 1;

// which variation goes where
DECO_PICK[AB_CORRENTE] = (gx, gy, arr) => tileAt(gx, gy + 1) === AB_CORRENTE ? arr[hash2(gx, gy, 10831) < 0.15 ? 1 : 0] : arr[2];
DECO_PICK[AB_GANCHO] = (gx, gy, arr) => tileAt(gx, gy + 1) === AB_GANCHO ? CHAIN_LINK : arr[hash2(gx, gy, 10832) < 0.35 ? 1 : 0];
DECO_PICK[AB_TENTACULO] = (gx, gy, arr) => tileAt(gx, gy + 1) === AB_TENTACULO ? arr[0] : arr[1];
DECO_PICK[AB_ESTALAG] = (gx, gy, arr) => tileAt(gx, gy - 1) === AB_ESTALAG ? arr[0] : tileAt(gx, gy + 1) === AB_ESTALAG ? arr[1] : arr[hash2(gx, gy, 10833) < 0.5 ? 1 : 2];
DECO_PICK[AB_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== AB_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== AB_COLUNA ? arr[2] : arr[hash2(gx, gy, 10834) < 0.3 ? 3 : 1];
DECO_PICK[AB_ESCADA] = (gx, gy, arr) => arr[hash2(gx, gy, 10835) < 0.15 ? 1 : 0];

// the chain and the ladder are climbed like the cathedral's chains; the ladder also counts as the mine's ladder (the climbing pose, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, AB_CORRENTE) || _tt(e, AB_ESCADA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, AB_ESCADA)); }; }

Object.assign(ABART, { cg, cn, cells, hexCells, DRA, dPix, cvSprite, spr, rimOut, flipX, flipY, GLYPHS, vCinza, vBasalto, vObsidiana, vCrosta, vCarne, vOsso, vEnxofre, vFerroNegro, vTijolo, vCaos, EMBER, MAGMA, PURP, VEIN, CHAOSV, CHAOSP, IRONC, CHAIN_LINK });
}
