'use strict';

/* ================= a Cidade Afundada: blocks, back walls, far layer, ores, decorations =================
   A city the ground swallowed: dark fill earth full of pottery shards and ground brick, pale worn ashlar cut in
   courses, dark red city brick with its plaster falling off in sheets, street cobbles, slate roof tiles in
   overlapping rows, dark damp floorboards, the green-black wet stone of the cisterns with slime running down it,
   black mud, cracked pale marble with grey veins, the Well's black smooth stone that nobody carved, rubble of the
   fallen facades, the bell tower's iron grille and the walling-up man's fresh brick with its mortar still wet.
   Coal comes back in the fill; silver, the layer's metal, sits in it tarnished nearly black and shines only where
   the pick scrapes it.
   Like 80-mina-blocos and 121-fungo-blocos, every material is a seamless 240x240 texture sampled in world pixels;
   outline, lit edge, shade and ambient occlusion come from 07-chunks-luz. Back walls and the far layer only read
   the tone (.v), so they carry no colour accents. Small decorations (a rope ladder and a cistern chain you can
   climb, cult candles, a looter's lantern, black weed, a roof drip, an offering bowl, a loot bundle, slimy bones,
   a shop sign, a string of cult bells, a cistern column from floor to roof) are 12x12 sprites on ramps lit from
   the top left. Flames, the drip, the swinging sign and the bells are drawn live.
   Ids: 130-cidade-api. */
const CDART = {};   // helpers shared with 132-cidade-objetos, the humans (133, 134), the drowned (135) and the boss (137)
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- palettes: 6 shades, dark to light (card section 12 where it gives one) ---- */
pal('cdAterro', ['#16130f', '#241f19', '#352d24', '#483d31', '#5e5041', '#776654']);
pal('cdCantaria', ['#2a2622', '#403a33', '#5a5248', '#786e60', '#9a8e7c', '#c0b49e']);
pal('cdTijolo', ['#24120e', '#3c1e16', '#58302a', '#74443a', '#925a4c', '#b07a68']);
pal('cdCalcamento', ['#191714', '#292622', '#3b3631', '#4f4942', '#665e55', '#80766a']);
pal('cdTelha', ['#14161c', '#20242c', '#2e343e', '#3e4652', '#525c6a', '#6e7a88']);
pal('cdMadeirame', ['#0e0b08', '#19140e', '#261e16', '#35291e', '#453628', '#584633']);
pal('cdLimo', ['#0c1410', '#14201a', '#1e2e24', '#2a3e30', '#3a5240', '#546c56']);
pal('cdLodo', ['#060605', '#0c0b0a', '#13120f', '#1c1a16', '#26231e', '#322e27']);
pal('cdMarmore', ['#2a2a2e', '#46464a', '#66646a', '#8c8a8c', '#b4b0ae', '#dcd6d0']);
pal('cdPoco', ['#050608', '#0a0c10', '#101318', '#171b22', '#20252e', '#2c323c']);
pal('cdEntulho', ['#1a1714', '#2b2621', '#3e3730', '#534a40', '#6c6153', '#887a68']);
pal('cdFresca', ['#2a140f', '#47231a', '#67382c', '#874e3e', '#a66752', '#c2846c']);
pal('cdGrade', ['#0a0b0d', '#16181c', '#24272c', '#363a40', '#4a5058', '#646c76']);
// back walls: always far darker than the ground in front
pal('cdCantariaW', ['#0c0b0a', '#12100f', '#181614', '#1f1c19', '#26231f', '#2e2a25']);
pal('cdTijoloW', ['#0c0807', '#120b09', '#18100c', '#1f1510', '#261a15', '#2e201a']);
pal('cdLimoW', ['#050806', '#080c09', '#0b100d', '#0e1511', '#121a15', '#16201a']);
pal('cdMadeiraW', ['#090706', '#0e0b08', '#130f0b', '#18130e', '#1e1812', '#241d16']);
pal('cdMarmoreW', ['#0e0e0f', '#141415', '#1a1a1c', '#212123', '#29282a', '#323033']);
// the far layer behind the walls; the city's top shade is a far window somebody lit
pal('dpCdAterro', ['#060504', '#0a0807', '#0e0c0a', '#13100d', '#181511', '#1e1a15']);
pal('dpCdCasas', ['#040405', '#08080a', '#0c0c0f', '#111115', '#17171b', '#4a3418']);
pal('dpCdArcos', ['#040506', '#070809', '#0b0c0e', '#0f1113', '#141619', '#1a1d20']);

const wrapT = v => ((v % TP) + TP) % TP;
const RAMPX = hexes => hexes.map(h => ph(h));
const BRICKC = RAMPX(['#2a1610', '#45251c', '#5e3428', '#784434']);                      // ground brick in the fill
const POT = RAMPX(['#33201a', '#4e3124', '#6c4630', '#87593c', '#9e6e4e']);               // pottery shards
const GLAZE = RAMPX(['#1a2624', '#26372f', '#36483c']);                                   // a glazed shard
const PLASTER = RAMPX(['#2e2a24', '#4a4338', '#635a4a', '#7a6f5c', '#928670']);           // plaster: warm grey, never white
const MORTAR = RAMPX(['#2a2925', '#46443c', '#646056', '#837e70', '#a29c8a']);            // the fresh wet mortar
const SLIME = RAMPX(['#0c180e', '#162a16', '#22401e', '#345a2a', '#4a7438']);
const WETG = RAMPX(['#2e3a3a', '#4a5c5c', '#728888']);                                    // cold wet glints
const RUSTC = RAMPX(['#2a140a', '#4a2412', '#6a361c', '#8a4a26']);
const IRONC = RAMPX(['#0c0d10', '#1c1e22', '#2e3136', '#464a52']);

/* ---- little tools: courses of cut stone with joints at random slots, seamless (rows of rh px, slots of sw px) ---- */
function courses(rh, sw, prob, s) {
  const R = TP / rh, N = TP / sw, J = [];
  for (let r = 0; r < R; r++) { const a = new Uint8Array(N); let last = -9; for (let k = 0; k < N; k++) if (hash2(k, r, s) < prob && k - last > 1) { a[k] = 1; last = k; } if (!a.some(v => v)) a[0] = 1; if (a[0] && a[N - 1]) a[N - 1] = 0; J.push(a); }
  // (x, y) -> { row, ly, lx (px from the block's left joint), w (block width), id }
  return (x, y) => {
    const xx = wrapT(x), yy = wrapT(y), row = Math.floor(yy / rh), ly = yy % rh, a = J[row], k = Math.floor(xx / sw);
    let k0 = k; while (!a[((k0 % N) + N) % N]) k0--;
    let k1 = k + 1; while (!a[((k1 % N) + N) % N]) k1++;
    return { row, ly, lx: xx - k0 * sw, w: (k1 - k0) * sw, id: hash2(((k0 % N) + N) % N, row, s + 1) };
  };
}

/* ---- solid ground ---- */
// a flat shard lying in the earth, tilted: (ox, oy) from its centre
const shardIn = (ox, oy, id) => { const a = id * 40, ca = Math.cos(a), sa = Math.sin(a), u = ox * ca + oy * sa, w = -ox * sa + oy * ca; return Math.abs(u) / (2.2 + id * 9) + Math.abs(w) / (1.1 + id * 3) < 1; };
function vAterro(x, y) {   // fill earth: dark clods, pottery shards and bits of ground brick, a charcoal fleck
  let v = 2.4 + cn(x, y, 36, 36, 13101) * 1.8 + cn(x, y, 110, 110, 13102) * 0.8 + cg(x, y, 13103) * 0.8;
  const damp = cn(x, y, 14, 20, 13104); if (damp > 0.2) v -= (damp - 0.2) * 4;
  const c = cells(x, y, 11, 13105, 1);
  if (c.id < 0.2) {
    if (shardIn(c.ox, c.oy, c.id)) {
      const R = c.id < 0.12 ? POT : c.id < 0.13 ? GLAZE : BRICKC, lit = !shardIn(c.ox - 1, c.oy - 1, c.id), sh = !shardIn(c.ox + 1, c.oy + 1, c.id);
      MATX = R[Math.max(0, Math.min(R.length - 1, Math.round(1.6 + (lit ? 1.4 : 0) - (sh ? 1.2 : 0) + cg(x, y, 13106) * 0.8)))]; return -9;
    }
    if (shardIn(c.ox - 1, c.oy - 1, c.id)) return 0.5;                                     // its shadow
  }
  const b = cells(x, y, 6, 13107);
  if (b.id < 0.1 && b.d1 < 1.3) { MATX = BRICKC[b.ox + b.oy < 0 ? 2 : b.d1 < 0.7 ? 1 : 0]; return -9; }   // ground brick crumbs
  if (hash2(x, y, 13108) < 0.003) { MATX = IRONC[0]; return -9; }                          // charcoal
  if (hash2(x, y, 13109) < 0.04) v -= 1.3;
  return v;
}
const ashlar = courses(12, 6, 0.27, 13111);
function vCantaria(x, y) {   // pale worn ashlar: cut blocks one course high, chamfered lit top-left edges, chipped corners, mortar lines
  const c = ashlar(x, y), { ly, lx, w } = c;
  if (ly === 11 || lx === 0) return 0.6 + cg(x, y, 13112) * 0.4;                            // mortar
  let v = 3.0 + (c.id - 0.5) * 1.0 + cn(x, y, 30, 30, 13113) * 0.9 + cg(x, y, 13114) * 0.4;
  if (ly === 0) v += 1.1; else if (ly === 1) v += 0.4; else if (ly === 10) v -= 0.9;
  if (lx === 1) v += 0.6; else if (lx === w - 1) v -= 0.7;
  const ch = c.id * 7 % 1;                                                                  // a chipped corner
  if (ch < 0.35 && ((lx + ly < 4 && ch < 0.15) || (w - lx + 11 - ly < 5 && ch >= 0.15))) v = 1.2 + (lx + ly) * 0.1;
  if (hash2(x, y, 13115) < 0.035) v -= 0.9;                                                 // wear pits
  if (Math.abs(cn(x, y, 24, 24, 13116)) < 0.006) v -= 1.4;                                  // a hairline crack
  const stain = cn(x, y, 10, 4, 13117); if (stain > 0.22) v -= (stain - 0.22) * 5;          // damp coming down
  return v;
}
const PCUT = 0.13, plasterM = (x, y) => cn(x, y, 8, 8, 13121) + cn(x, y, 24, 24, 13122) * 0.5 + cn(x, y, 60, 60, 13126) * 0.3;
function brickV(x, y) {   // the brick under it: 10 x 4 courses, each brick its own shade, some burnt dark
  const row = Math.floor(wrapT(y) / 4), ly = wrapT(y) % 4, off = row % 2 ? 5 : 0, lx = wrapT(x + off) % 10, bk = Math.floor(wrapT(x + off) / 10);
  if (ly === 3 || lx === 9) return 0.7 + cg(x, y, 13123) * 0.4;
  const h = hash2(bk, row, 13124);
  let v = 2.8 + (h - 0.5) * 1.3 + (ly === 0 ? 0.8 : ly === 2 ? -0.5 : 0) + (lx === 0 ? 0.4 : lx === 8 ? -0.4 : 0) + cg(x, y, 13125) * 0.5;
  if (h < 0.1) v -= 1.0;
  if (hash2(x, y, 13127) < 0.03) v -= 1;
  return v;
}
function vTijolo(x, y) {   // city brick with the plaster falling off in sheets: the plaster stands proud, lit top-left, shadowing the brick
  const m = plasterM(x, y);
  if (m > PCUT) {
    const lit = plasterM(x - 1, y - 1) <= PCUT, sh = plasterM(x + 1, y + 1) <= PCUT;
    let l = 2.3 + cn(x, y, 20, 20, 13128) * 1.4 + cg(x, y, 13129) * 0.6 + (lit ? 1.4 : 0) - (sh ? 1.4 : 0);
    if (Math.abs(cn(x, y, 14, 14, 13130)) < 0.008) l = 0.4;                                  // cracks in the plaster
    const st = cn(x, y, 6, 14, 13131); if (st > 0.2) l -= 1;                                // stains running down
    MATX = PLASTER[Math.max(0, Math.min(4, Math.round(l)))]; return -9;
  }
  if (plasterM(x - 1, y - 1) > PCUT || plasterM(x, y - 1) > PCUT) return 0.5;               // the plaster's shadow on the brick
  const v = brickV(x, y), damp = cn(x, y, 12, 6, 13132);
  return damp > 0.15 ? v - (damp - 0.15) * 5 : v;
}
const setts = courses(6, 3, 0.36, 13141);
function vCalcamento(x, y) {   // street cobbles: rows of setts, worn domed tops, dirt in the gaps, a few sunk
  const c = setts(x, y), { ly, lx, w } = c;
  if (ly === 5 || lx === 0) { if (hash2(x, y, 13142) < 0.25) { MATX = BRICKC[0]; return -9; } return 0.3 + cg(x, y, 13143) * 0.4; }
  if ((lx === 1 || lx === w - 1) && (ly === 0 || ly === 4)) return 0.9;                     // rounded corners
  const u = (lx - 0.5 - w / 2) / (w / 2);
  let v = 2.8 + (c.id - 0.5) * 1.2 + (1 - u * u) * 0.5 + cg(x, y, 13144) * 0.45;
  if (ly === 0) v += 1.0; else if (ly === 1) v += 0.4; else if (ly === 4) v -= 0.9;
  if (lx === 1) v += 0.5; else if (lx === w - 1) v -= 0.6;
  if (c.id < 0.12) v -= 1.0;                                                                 // a sunk sett
  if (ly === 1 && hash2(x, y, 13145) < 0.12 && c.id > 0.3) v += 1.2;                       // polish where feet went
  return v;
}
function vTelha(x, y) {   // slate tiles in overlapping rows: each lower lip catches the light, a shadow line under it, scalloped corners
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, off = row % 2 ? 4 : 0, lx = wrapT(x + off) % 8, tl = Math.floor(wrapT(x + off) / 8), h = hash2(tl, row, 13151);
  if (h < 0.025) return 0.3 + (ly === 0 ? 0 : 0.4);                                          // a slipped tile: the batten in the dark
  if (ly >= 4 && (lx === 0 || lx === 7)) return ly === 5 ? 0.5 : 1;                          // the round of the lip
  if (lx === 0) return 0.9;
  let v = 2.6 + (h - 0.5) * 1.1 + cg(x, y, 13152) * 0.35 + Math.sin(y * 1.9 + tl) * 0.15;
  if (ly === 0) v = 0.7; else if (ly === 1) v -= 0.7; else if (ly === 4) v += 0.7; else if (ly === 5) v += 1.3;
  if (lx === 1) v += 0.4; else if (lx === 6) v -= 0.4;
  if (h > 0.93 && Math.abs(lx - ly - 1) < 0.6) v = 0.9;                                    // a cracked one
  const wet = cn(x, y, 8, 8, 13153); if (wet > 0.25) v -= 0.6;
  return v;
}
function vMadeirame(x, y) {   // dark damp boards: long grain, black rot, nail heads, a wet sheen on the lit edge
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, L = 30 + (hash2(row, 0, 13161) * 4 | 0) * 6, off = hash2(row, 1, 13162) * TP | 0, lx = wrapT(x + off) % L, board = Math.floor(wrapT(x + off) / L);
  if (ly === 5) return 0.3;
  if (lx === 0) return 0.6;
  let v = 2.8 + (hash2(board, row, 13163) - 0.5) * 1.0 + (ly === 0 ? 0.9 : ly === 4 ? -0.8 : 0) + cg(x, y, 13164) * 0.35;
  v += Math.sin((x + off) * 0.21 + Math.sin((x + off) * 0.04 + row) * 3 + ly * 1.4) * 0.45;   // the grain
  const rot = cn(x, y, 12, 12, 13165); if (rot > 0.2) v -= (rot - 0.2) * 9;
  if ((lx === 2 || lx === L - 2) && (ly === 1 || ly === 3)) { MATX = ly === 1 ? IRONC[2] : RUSTC[1]; return -9; }   // nails
  if (ly === 0 && rot < 0 && hash2(x, y, 13166) < 0.08) { MATX = WETG[1]; return -9; }
  return v;
}
const cistern = courses(12, 6, 0.22, 13171);
const slimeRun = (x, y) => { const sx = x + cn(x, y, 20, 4, 13172) * 10, k = ((sx % 17) + 17) % 17; return k < 1.1 && cn(x, y, 20, 12, 13173) > 0.06; };
function vLimo(x, y) {   // the cisterns' wet stone: big rough blocks rounded by water, slime running down, algae at the joints, wet glints
  const c = cistern(x, y), { ly, lx, w } = c;
  if (ly === 11 || lx === 0) { if (hash2(x, y, 13174) < 0.5) { MATX = SLIME[hash2(x, y, 13175) < 0.4 ? 1 : 0]; return -9; } return 0.4; }
  let v = 2.6 + (c.id - 0.5) * 1.0 + cn(x, y, 24, 24, 13176) * 1.3 + cg(x, y, 13177) * 0.5;
  if (ly === 0) v += 0.9; else if (ly === 10) v -= 1; if (lx === 1) v += 0.5; else if (lx === w - 1) v -= 0.6;
  if (ly <= 2 && hash2(x, 0, 13178 + c.row) < 0.35 - ly * 0.12) { MATX = SLIME[2 - (ly > 0 ? 1 : 0)]; return -9; }   // algae hanging under the joint
  if (slimeRun(x, y)) { MATX = SLIME[cn(x, y, 6, 6, 13179) > 0.15 ? 3 : 2]; return -9; }
  if (slimeRun(x - 1, y)) v -= 0.8;
  if (hash2(x, y, 13180) < 0.006) { MATX = WETG[2]; return -9; }
  if (hash2(x, y, 13181) < 0.04) v -= 1;
  return v;
}
function vLodo(x, y) {   // black mud: smears laid flat, sunk bits of rubble, bubble holes, wet glints
  const sm = Math.sin(y * 0.6 + cn(x, y, 6, 4, 13191) * 9 + Math.sin(x * Math.PI / 30) * 1.2);
  let v = 2.4 + sm * 0.5 + cn(x, y, 30, 30, 13192) * 1.2 + cg(x, y, 13193) * 0.35;
  if (sm > 0.88) v += 0.6;
  const c = cells(x, y, 12, 13194);
  if (c.id < 0.1 && c.d1 < 1.6) { MATX = c.ox + c.oy < -0.4 ? BRICKC[1] : IRONC[c.ox + c.oy > 0.5 ? 0 : 1]; return -9; }
  if (c.id > 0.9 && c.d1 < 1.4) return c.oy < 0 ? 0.3 : 3.8;
  if (sm > 0.8 && hash2(x, y, 13195) < 0.07) { MATX = WETG[hash2(x, y, 13196) < 0.4 ? 1 : 0]; return -9; }
  return v;
}
const slabs = courses(12, 12, 0.5, 13201);
function vMarmore(x, y) {   // cracked pale marble: smooth slabs, grey veins flowing across, dark cracks with a lit lower lip, dirt in the joints
  const c = slabs(x, y), { ly, lx, w } = c;
  if (ly === 11 || lx === 0) return 0.9 + cg(x, y, 13202) * 0.3;
  let v = 2.9 + (c.id - 0.5) * 0.7 + cn(x, y, 20, 20, 13203) * 0.8 + cg(x, y, 13204) * 0.2;
  if (ly === 0) v += 0.8; else if (ly === 10) v -= 0.7; if (lx === 1) v += 0.4; else if (lx === w - 1) v -= 0.5;
  const wx = x + cn(x, y, 6, 6, 13205) * 40, wy = y + cn(x, y, 6, 6, 13206) * 40, vn = Math.abs(cn(wx, wy, 10, 14, 13207));
  if (vn < 0.009) v -= 1.4; else if (vn < 0.02) v -= 0.6;
  const cr = Math.abs(cn(x, y, 30, 30, 13208));
  if (cr < 0.004) return 0.5;
  if (Math.abs(cn(x, y - 1, 30, 30, 13208)) < 0.004) v += 0.9;
  if (hash2(x, y, 13209) < 0.015) v -= 0.8;
  return v;
}
function vPoco(x, y) {   // the Well's stone: black, smooth, unworked; long cold sheens, faint ripples, nothing carved
  let v = 2.3 + cn(x, y, 8, 8, 13211) * 0.9 + cn(x, y, 30, 30, 13212) * 0.4 + cg(x, y, 13213) * 0.12;
  
  const sh = Math.sin((x + y) * 0.045 + cn(x, y, 6, 6, 13215) * 7); if (sh > 0.86) v += (sh - 0.86) * 9;
  if (hash2(x, y, 13216) < 0.0015) v += 2;
  return v;
}
function vEntulho(x, y) {   // rubble: broken ashlar, lumps of brick and plaster, dust in the voids
  const c = cells(x, y, 9, 13221, 1), e = c.d2 - c.d1;
  if (e < 1.1) return hash2(x, y, 13222) < 0.3 ? 1.6 : 0.3;
  const rim = e < 2.2 ? (c.ox + c.oy < 0 ? 1.1 : -0.9) : 0, l = 2.6 - (c.ox + c.oy) * 0.12 + rim + cg(x, y, 13223) * 0.5;
  if (c.id < 0.3) {   // brick, with a mortar line across it
    if (((c.oy + c.id * 30) % 4 + 4) % 4 < 0.9) { MATX = MORTAR[1]; return -9; }
    MATX = BRICKC[Math.max(0, Math.min(3, Math.round(l - 0.6)))]; return -9;
  }
  if (c.id < 0.4) { MATX = PLASTER[Math.max(0, Math.min(4, Math.round(l - 0.3)))]; return -9; }
  if (c.id > 0.93) return 1.6 + cg(x, y, 13224) * 0.6;                                     // a heap of dust
  return l + 0.4;
}
function vFresca(x, y) {   // fresh brick: courses laid in a hurry, bricks askew, thick wet mortar squeezed out of every joint and sagging in drips
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, off = (hash2(row, 0, 13231) * 10) | 0, lx = wrapT(x + off) % 12, bk = Math.floor(wrapT(x + off) / 12), h = hash2(bk, row, 13232), dy = h < 0.35 ? 1 : 0, by = ly - dy;
  const drip = hash2(Math.floor(wrapT(x)), row, 13233), dl = drip < 0.12 ? 2 : drip < 0.3 ? 1 : 0;   // mortar sagging over the brick below
  if (by >= 4 || by < 0 || lx >= 10 || by < dl) {
    const lit = by === 4 || lx === 10 || (by < dl && by === dl - 1);
    MATX = MORTAR[hash2(x, y, 13234) < 0.12 ? 4 : lit ? 3 : by >= 4 && lx < 10 && by === 5 ? 1 : 2]; return -9;
  }
  if (by === dl && dl > 0) return 1.0;                                                     // the shadow under the sag
  let v = 3.1 + (h - 0.5) * 1.0 + (by === 0 ? 0.8 : by === 3 ? -0.7 : 0) + (lx === 0 ? 0.4 : lx === 9 ? -0.6 : 0) + cg(x, y, 13235) * 0.5;
  if (hash2(x, y, 13236) < 0.06) { MATX = MORTAR[3]; return -9; }                            // smears of mortar on the face
  return v;
}
function vGrade(x, y) {   // the grille's texture (item icon, map): bars and a strap over the dark
  const lx = wrapT(x) % 4, ly = wrapT(y) % 12;
  if (ly === 4 || ly === 5) return ly === 4 ? 4 : 2.6;
  return lx === 1 ? 4.4 : lx === 2 ? 2.8 : 0.2;
}

/* ---- back walls ---- */
const vCantariaW = vCantaria;
function vTijoloW(x, y) {   // peeling plaster over brick, tone only: the plaster a shade lighter with a shadow below its edge
  const m = plasterM(x, y);
  if (m > PCUT) return 3.0 + cn(x, y, 20, 20, 13241) * 1.0 + cg(x, y, 13242) * 0.4 + (plasterM(x - 1, y - 1) <= PCUT ? 1 : 0) - (plasterM(x + 1, y + 1) <= PCUT ? 1.2 : 0);
  if (plasterM(x - 1, y - 1) > PCUT) return 0.6;
  return brickV(x, y) - 0.3;
}
function vLimoW(x, y) { const v = vLimo(x, y); return v === -9 ? (slimeRun(x, y) ? 3.6 : 1.4) : v; }
function vMadeiraW(x, y) {   // the planking inside the houses: upright boards, a rail every 60 px, rot at the foot
  const col = Math.floor(wrapT(x) / 6), lx = wrapT(x) % 6, by = wrapT(y + (col % 2) * 7) % 60;
  if (lx === 5) return 0.4;
  if (by < 5) return by === 0 ? 4 : by === 4 ? 1.2 : 3.2 + cg(x, y, 13251) * 0.3;
  let v = 2.7 + (hash2(col, 1, 13252) - 0.5) * 1.1 + (lx === 0 ? 0.6 : lx === 4 ? -0.5 : 0) + Math.sin(y * 0.18 + Math.sin(y * 0.03 + col) * 3 + lx) * 0.35 + cg(x, y, 13253) * 0.3;
  if (by === 6 && (lx === 1 || lx === 3)) v = 0.6;                                          // nails
  const rot = cn(x, y, 10, 10, 13254); if (rot > 0.18) v -= (rot - 0.18) * 8;
  return v;
}
function vMarmoreW(x, y) { return vMarmore(x, y) - 0.2; }

/* ---- far layer ---- */
function vDpCdAterro(x, y) {   // fill earth far off: soft clods, pale chunks of old masonry in it
  let v = 2.2 + cn(x, y, 30, 30, 13301) * 1.3 + cn(x, y, 80, 80, 13302) * 0.5 + cg(x, y, 13303) * 0.35;
  const c = cells(x, y, 24, 13304, 1.2);
  if (c.id < 0.25) { const r = 3 + c.id * 14; if (Math.abs(c.ox) < r && Math.abs(c.oy) < r * 0.6) v = 3.2 - (c.ox + c.oy) / r * 0.6 + cg(x, y, 13305) * 0.3; }
  return v;
}
function vDpCdCasas(x, y) {   // the drowned city far away: crooked houses and towers leaning every way, slanted roofs, a rare window lit
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 50), k = Math.floor(xx / 40), lx = xx % 40;
  const haze = 1.2 + Math.max(0, 1 - Math.abs(by - 70) / 60) * 1.0 + cn(x, y, 16, 8, 13311) * 0.5 + cg(x, y, 13312) * 0.25;
  const ground = 110 + Math.sin(x * Math.PI / 30) * 2;
  if (by > ground) return 0.6 + cg(x, y, 13313) * 0.3;
  // two layers of buildings: the near row (each 40 px slot) and towers behind every few slots
  const draw = (kk, llx) => {
    const h = hash2(kk, band, 13314), hw = 11 + h * 7, hh = 26 + hash2(kk, band, 13315) * 40, lean = (hash2(kk, band, 13316) - 0.5) * 0.35, cx = 20 + (hash2(kk, band, 13317) - 0.5) * 6;
    const top = ground - hh, sx = cx + (ground - by) * lean, ux = llx - sx;
    if (by >= top && Math.abs(ux) < hw) {
      const wy = by - top, row = Math.floor(wy / 11), wx = Math.floor((ux + hw) / 7);
      if (wy % 11 > 3 && wy % 11 < 8 && (ux + hw) % 7 > 2 && (ux + hw) % 7 < 5 && wy < hh - 8) return hash2(kk * 9 + wx, row + band * 17, 13318) < 0.008 ? 5.4 : 0.5;   // windows: dark, one in a great many lit
      return 2.0 + (ux < -hw + 2 ? 0.6 : 0) + (wy % 11 === 0 ? -0.4 : 0) + cg(x, y, 13319) * 0.25;
    }
    const pitch = hash2(kk, band, 13320), rh = hw * (0.5 + pitch * 0.7), skew = (pitch - 0.5) * hw;   // a slanted roof, its ridge off-centre
    if (by < top && by >= top - rh) { const t = (top - by) / rh, l = -hw - 1 + (skew + hw + 1) * t, r = hw + 1 - (hw + 1 - skew) * t; if (ux > l && ux < r) return 2.4 + (ux < l + 1.5 ? 1.0 : 0) + cg(x, y, 13321) * 0.2; }
    return -1;
  };
  const near = draw(k, lx); if (near >= 0) return near;
  if (hash2(k, band, 13322) < 0.3) {   // a tower behind, with a pointed cap
    const tx = 20 + (hash2(k, band, 13323) - 0.5) * 20, tw = 4 + hash2(k, band, 13324) * 3, ttop = 12 + hash2(k, band, 13325) * 20, lean = (hash2(k, band, 13326) - 0.5) * 0.2, sx = tx + (ground - by) * lean;
    if (by >= ttop && Math.abs(lx - sx) < tw) return 1.6 + (lx - sx < -tw + 1.5 ? 0.6 : 0) + ((by - ttop) % 9 === 4 && Math.abs(lx - sx) < 1 ? -1 : 0);
    if (by < ttop && by > ttop - tw * 3 && Math.abs(lx - sx) < tw * (by - (ttop - tw * 3)) / (tw * 3)) return 1.9;
  }
  return haze;
}
function vDpCdArcos(x, y) {   // aqueduct and cistern arches marching off into the dark, fading in patches
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 30), lx = xx % 48, k = Math.floor(xx / 48);
  const bg = 1.1 + cn(x, y, 12, 12, 13331) * 0.5 + cg(x, y, 13332) * 0.2;
  const fade = 0.45 + Math.max(0, cn(x, y, 6, 3, 13333) + 0.3) * 1.2;
  let v = -1;
  if (by >= 18 && by < 30) v = 2.8 + (by === 18 ? 0.8 : by === 29 ? -0.6 : 0) + ((xx % 12) === 0 ? -0.8 : 0);   // the deck
  else if (by >= 30 && by < 112) {
    const pier = lx < 9, r = 19.5, dx = lx - 28.5, dy = by - 62;
    if (pier) v = 2.4 + (lx === 0 ? 0.8 : lx === 8 ? -0.6 : 0) + ((by % 8) === 0 ? -0.6 : 0);
    else if (by < 62 && dx * dx + dy * dy > r * r) v = 2.2 + ((by % 8) === 0 ? -0.5 : 0);   // the spandrel
    else if (by < 62 && dx * dx + dy * dy > (r - 3) * (r - 3)) v = 3.0 + (dy < -r * 0.6 ? 0.6 : -0.2) + (Math.floor(Math.atan2(dy, dx) * 6) % 2 ? 0 : -0.5);   // the voussoirs
  }
  if (v < 0) return bg;
  v += cg(x, y, 13334) * 0.3 + (hash2(k, band, 13335) - 0.5) * 0.4;
  return bg + (v + 0.6 - bg) * Math.min(1, fade);
}

/* ---- bake and register ---- */
const BKV = {
  aterro: bake(vAterro), cantaria: bake(vCantaria), tijolo: bake(vTijolo), calcamento: bake(vCalcamento), telha: bake(vTelha), madeirame: bake(vMadeirame),
  limo: bake(vLimo), lodo: bake(vLodo), marmore: bake(vMarmore), poco: bake(vPoco), entulho: bake(vEntulho), fresca: bake(vFresca), grade: bake(vGrade),
  cantariaW: bake(vCantariaW), tijoloW: bake(vTijoloW), limoW: bake(vLimoW), madeiraW: bake(vMadeiraW), marmoreW: bake(vMarmoreW),
  dpAterro: bake(vDpCdAterro), dpCasas: bake(vDpCdCasas), dpArcos: bake(vDpCdArcos)
};
const CD_SOLID = [
  // id, palette, texture, dig, map colour (card section 11 where it gives one)
  [CD_ATERRO, 'cdAterro', 'aterro', 0.45, '#483d31'], [CD_CANTARIA, 'cdCantaria', 'cantaria', 0.9, '#786e60'], [CD_TIJOLO, 'cdTijolo', 'tijolo', 0.8, '#74443a'],
  [CD_CALCAMENTO, 'cdCalcamento', 'calcamento', 0.85, '#5a5249'], [CD_TELHA, 'cdTelha', 'telha', 0.6, '#3e4652'], [CD_MADEIRAME, 'cdMadeirame', 'madeirame', 0.45, '#45362a'],
  [CD_LIMO, 'cdLimo', 'limo', 0.8, '#2a3e30'], [CD_LODO, 'cdLodo', 'lodo', 0.25, '#1c1a16'], [CD_MARMORE, 'cdMarmore', 'marmore', 1.0, '#8c8a8c'],
  [CD_PEDRA_POCO, 'cdPoco', 'poco', 2.6, '#101318'], [CD_ENTULHO, 'cdEntulho', 'entulho', 0.5, '#5e5448'], [CD_PAREDE_FRESCA, 'cdFresca', 'fresca', 0.25, '#925a4c']
];
for (const [t, p, k, dig, col] of CD_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [CD_ATERRO, CD_LIMO, CD_LODO]) BLEND[t] = 1;

WMAT[WCD_CANTARIA] = [PALS.cdCantariaW, BKV.cantariaW]; WMAT[WCD_TIJOLO] = [PALS.cdTijoloW, BKV.tijoloW]; WMAT[WCD_LIMO] = [PALS.cdLimoW, BKV.limoW];
WMAT[WCD_MADEIRA] = [PALS.cdMadeiraW, BKV.madeiraW]; WMAT[WCD_MARMORE] = [PALS.cdMarmoreW, BKV.marmoreW];
DMAT[DP_CD_ATERRO] = [PALS.dpCdAterro, BKV.dpAterro]; DMAT[DP_CD_CASAS] = [PALS.dpCdCasas, BKV.dpCasas]; DMAT[DP_CD_ARCOS] = [PALS.dpCdArcos, BKV.dpArcos];

/* ---- the ores: coal in the fill, and silver: lumps tarnished nearly black, bright only along the scrapes ---- */
oreRamp(CD_O_PRATA, ['#121418', '#22262c', '#2e3238', '#4a5058', '#727a84', '#ccd2da', '#f4f8fc']);
ORE_PAINT[CD_O_PRATA] = function (L, s) {
  const R = ORE_RAMP[CD_O_PRATA], pts = oreNodes(L, s, R, 130, [2.9, 0.8], [1.4, 0.5]);
  // tarnish: the lumps pushed down to the dark end, a brown-violet bloom on the shaded side
  for (let k = 0; k < 144; k++) if (L.m[k]) { const x = k % 12, y = k / 12 | 0, l = L.l[k] - 0.1; L.put(x, y, l < 1.2 && hash2(k, s, 131) < 0.4 ? ph('#3a3236') : R[Math.max(1, Math.min(4, Math.round(l)))], L.l[k]); }
  // one or two scrapes across the main lump, where the metal shows bright
  for (let i = 0; i < 1 + (hash2(s, 3, 132) < 0.25); i++) {
    const [x0, y0] = pts[i] || pts[0], a = 0.5 + hash2(s, i, 133) * 0.8, n = 1.2 + hash2(s, i, 134) * 1.3;
    oreLine(L, x0 - Math.cos(a) * n, y0 - Math.sin(a) * n, x0 + Math.cos(a) * n, y0 + Math.sin(a) * n, (x, y, f) => { if (L.m[y * 12 + x]) L.put(x, y, R[f > 0.4 && f < 0.6 && i === 0 ? 6 : f > 0.2 && f < 0.8 ? 5 : 4], 9); });
  }
};
ORE_HALO[CD_O_PRATA] = { pal: ['cdAterro', '#3a3e48', 0.28, 0.1], shade: 0 };
ORE_PAINT[CD_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[CD_O_CARVAO] = { pal: ['cdAterro', '#020204', 0.5, 0.2], shade: 0 };
MAT[CD_O_CARVAO] = [PALS.cdAterro, bakeOre(CD_O_CARVAO, vAterro)]; MAT[CD_O_PRATA] = [PALS.cdAterro, bakeOre(CD_O_PRATA, vAterro)];
for (const t of [CD_O_CARVAO, CD_O_PRATA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[CD_O_CARVAO] = DIG[COAL]; ORE_XP[CD_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[CD_O_CARVAO] = ORE_NAME[COAL]; PCOL[CD_O_CARVAO] = PCOL[COAL]; ORE_ITEM[CD_O_CARVAO] = ORE_ITEM[COAL];
DIG[CD_O_PRATA] = 1.3; ORE_XP[CD_O_PRATA] = 15; ORE_NAME[CD_O_PRATA] = 'Prata'; PCOL[CD_O_PRATA] = '#a0a8b2'; ORE_ITEM[CD_O_PRATA] = 'min_prata';
EMIT[CD_O_PRATA] = 0.12;   // barely: the scrapes catch whatever light there is

/* ---- block items ---- */
// the cathedral (42) already owns 'cantaria' and 'marmore', so the city's are 'cantaria_cidade' and 'marmore_rachado'
const CD_ITEMS = {
  aterro: ['Aterro', CD_ATERRO, 'Terra escura cheia de cacos de pote e tijolo moído. A cidade inteira está enterrada nisso.'],
  cantaria_cidade: ['Cantaria', CD_CANTARIA, 'Pedra clara cortada em bloco, gasta nas quinas. Das casas boas e do templo.'],
  tijolo_cidade: ['Tijolo da Cidade', CD_TIJOLO, 'Tijolo vermelho-escuro, ainda com um resto de reboco grudado.'],
  calcamento: ['Calçamento', CD_CALCAMENTO, 'Pedras de rua, lisas no topo de tanto passarem por cima.'],
  telha: ['Telha de Ardósia', CD_TELHA, 'Lâmina de ardósia de um telhado. Dá para andar em cima.'],
  pedra_limo: ['Pedra com Limo', CD_LIMO, 'Pedra das cisternas, verde-preta e sempre molhada. Escorrega na mão.'],
  lodo_negro: ['Lodo Negro', CD_LODO, 'Barro preto do fundo das cisternas. Cheira a água parada há séculos.'],
  marmore_rachado: ['Mármore Rachado', CD_MARMORE, 'Mármore claro do palácio, cheio de rachaduras finas.'],
  pedra_poco: ['Pedra do Poço', CD_PEDRA_POCO, 'Preta, lisa e fria. Ninguém a lavrou: já estava ali antes da cidade.'],
  entulho: ['Entulho', CD_ENTULHO, 'Pedaço de fachada caída: pedra, tijolo e reboco juntos.']
};
for (const id in CD_ITEMS) { const [name, block, desc] = CD_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[CD_MADEIRAME] = 'madeira';   // CD_BARREIRA and CD_PAREDE_FRESCA drop nothing

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRC = {
  corda: ['#120e0a', '#22190f', '#362818', '#4c3922', '#634c2e', '#7a6040', '#93774f'],
  madeira: ['#0e0b08', '#1a140e', '#281f16', '#382c1f', '#4a3a29', '#5e4a34', '#725a40'],
  ferro: ['#0a0b0d', '#16181c', '#24272c', '#363a40', '#4a5058', '#646c76', '#848c96'],
  ferrugem: ['#2a140a', '#4a2412', '#6a361c', '#8a4a26', '#a6603a'],
  cera: ['#1e1812', '#3a2e22', '#6a5a44', '#8a7a5a', '#a89470', '#c4b48c', '#d8c8a0'],
  chama: ['#5a2a08', '#a8500e', '#e07a1a', '#ffb84a', '#ffd884', '#fff0b0'],
  latao: ['#1e1608', '#3a2c10', '#5a4618', '#7a6024', '#9a7c34', '#b89a4c', '#d4b86e'],
  alga: ['#040605', '#0a0f0b', '#111a13', '#18261b', '#213326', '#2c4232', '#3a5440'],
  argila: ['#24140c', '#3e2416', '#5a3620', '#76482c', '#92603c', '#ac7a52', '#c49670'],
  prata: ['#1a1c20', '#2e3238', '#4a5058', '#727a84', '#a0a8b2', '#ccd2da', '#e4e8ee'],
  osso: ['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#c8bca6', '#dcd2be'],
  lodo: ['#060806', '#0c120c', '#142014', '#1e2e1c', '#2a3e26', '#3a5230', '#4e6a3e'],
  pano: ['#1a1610', '#2c261c', '#423a2a', '#5a4f3a', '#72654a', '#8a7c5c', '#a2946e'],
  vermelho: ['#1c0e0c', '#321a16', '#4c2820', '#66382c', '#7e4a3a', '#965c48'],
  pedra: ['#141a16', '#262e28', '#3a423a', '#525a4e', '#6c7262', '#888a78', '#a4a490'],
  agua: ['#2e3a3a', '#4a5c5c', '#728888', '#9ab0ae']
};
for (const k in DRC) DRC[k] = DRC[k].map(h => ph(h));

/* the looters' rope ladder: two tarred ropes twisted, wooden rungs every 6 px lashed with a knot; a top piece tied
   round an iron spike, a bottom piece with the rope ends frayed; seamless up and down */
function ropeLadder(k, s) {   // 0 middle, 1 middle with a skewed rung, 2 top, 3 bottom
  const a = spr(), C = DRC.corda, W = DRC.madeira, end = k === 3 ? 8 : 12;
  for (let y = 0; y < end; y++) for (const x0 of [1, 9]) {
    const tw = ((y + x0) % 3 + 3) % 3;
    a.put(x0, y, C, 4.6 - (tw === 2 ? 1.4 : 0) + cg(x0, y, s) * 0.4); a.put(x0 + 1, y, C, 2.8 - (tw === 0 ? 1 : 0) + cg(x0 + 1, y, s) * 0.4);
  }
  if (k === 3) for (const x0 of [1, 2, 9, 10]) for (let y = 8; y < 9 + ((x0 * 5 + s) % 3); y++) a.put(x0 + (y > 9 ? (x0 < 5 ? -1 : 1) * (x0 % 2) : 0), y, C, 3.6 - (y - 8) * 0.5);
  for (const ry of k === 3 ? [3] : [3, 9]) {
    const skew = k === 1 && ry === 9 ? 1 : 0;
    for (let x = 3; x <= 8; x++) { const yy = ry + (skew && x > 5 ? 1 : 0); a.put(x, yy, W, 4.6 - (x - 3) * 0.2 + cg(x, yy, s) * 0.6); a.put(x, yy + 1, W, 2.0); }
    for (const x of [0, 3, 8, 11]) a.put(x, ry + (skew && x > 5 ? 1 : 0), C, x === 0 || x === 3 ? 4.8 : 3.2);   // the lashing
  }
  if (k === 2) { for (let x = 2; x <= 9; x++) a.put(x, 0, DRC.ferro, 4.4 - (x - 2) * 0.3); a.put(5, 1, DRC.ferro, 3); a.put(6, 1, DRC.ferro, 2.2); for (const x of [2, 3, 8, 9]) a.put(x, 1, C, 4); }
  return rimOut(a, C[0]);
}
const ESCADA = [ropeLadder(0, 13401), ropeLadder(1, 13402), ropeLadder(2, 13403), ropeLadder(3, 13404)];

/* a cistern chain: a link face-on, then one side-on, wet iron with rust in the joins; the last ends in a hook */
function chainSprite(end, s) {
  const a = spr(), F = DRC.ferro;
  const face = (cy) => { for (let y = cy - 3; y <= cy + 3; y++) for (let x = 3; x <= 8; x++) { const dx = (x + 0.5 - 6) / 2.6, dy = (y + 0.5 - cy) / 3.6, d = dx * dx + dy * dy; if (d <= 1 && d >= 0.32) a.put(x, y, F, 4.4 - dx * 1.6 - dy * 1.2 + cg(x, y, s) * 0.5 + (dx < -0.5 && dy < 0 ? 1 : 0)); } };
  const side = (y0, y1) => { for (let y = y0; y <= y1; y++) { a.put(5, y, F, 5 + cg(5, y, s) * 0.4 - (y === y0 || y === y1 ? 1 : 0)); a.put(6, y, F, 2.6); } };
  if (!end) { side(-1, 1); face(4.5); side(8, 12); }
  else { side(-1, 1); face(4.5); a.put(5, 8, F, 4); a.put(6, 8, F, 2.6); for (let y = 9; y <= 10; y++) { a.put(5, y, F, 4.4); a.put(6, y, F, 2.4); } a.put(4, 11, F, 3.4); a.put(5, 11, F, 2.6); a.put(3, 10, F, 4.6); a.put(3, 9, F, 4); }
  for (let k = 0; k < 144; k++) if (a[k] && hash2(k, s, 13410) < 0.12) a[k] = dPix(DRC.ferrugem, 1 + hash2(k, s, 13411) * 3);
  a.put(4, 2 + (s % 2), DRC.agua, 3);   // a wet glint
  return rimOut(a, F[0]);
}
const CORRENTE = [chainSprite(false, 13421), chainSprite(false, 13422), chainSprite(true, 13423)];

/* the cult's candles on the floor: a cluster of tallow candles of every height, wax run down their sides and pooled
   round them; the wicks are dark, the flames are drawn live (CD_WICKS: the pixel above each wick) */
const CD_WICKS = [];
function candleSprite(list, s) {
  const a = spr(), W = DRC.cera, wk = [];
  for (let x = 1; x <= 10; x++) a.put(x, 11, W, 2.6 + hash2(x, s, 1) * 1.2 - (x > 7 ? 0.6 : 0));          // the pool of wax
  for (let x = 2; x <= 9; x++) if (hash2(x, s, 2) < 0.6) a.put(x, 10, W, 3.6);
  for (const [cx, h, w] of list) {
    const top = 11 - h;
    for (let y = top; y < 11; y++) for (let x = cx; x < cx + w; x++) a.put(x, y, W, (x === cx ? 5.2 : w > 2 && x === cx + 1 ? 4.2 : 3.2) - (y - top) * 0.06 + cg(x, y, s) * 0.3);
    for (let x = cx; x < cx + w; x++) a.put(x, top, W, 6);                                                           // the melted rim
    if (hash2(cx, s, 3) < 0.7) for (let y = top + 1; y < top + 2 + (cx % 3); y++) a.put(cx + w - 1 + (y % 2 ? 0 : 0), y, W, 5.4);   // a run of wax
    const wx = cx + (w > 2 ? 1 : 0); a.put(wx, top - 1, DRC.madeira, 0.5); wk.push([wx, top - 2]);
  }
  CD_WICKS.push(wk);
  return rimOut(a, W[0]);
}
const VELAS = [candleSprite([[2, 5, 2], [5, 8, 2], [8, 3, 2]], 13431), candleSprite([[1, 3, 2], [4, 6, 3], [8, 4, 2]], 13432), candleSprite([[3, 7, 2], [6, 2, 2], [8, 5, 2]], 13433)];

/* the looters' lantern, hung by a cord from the roof or a beam: an iron cap with a ring, a frame of four bars, amber
   glass with the flame's light behind it, a heavy base; one has a cracked pane */
function lanternSprite(k, s) {
  const a = spr(), F = DRC.ferro, C = DRC.chama;
  for (let y = 0; y < 2; y++) a.put(6, y, DRC.corda, 4 - y * 0.5);
  a.put(5, 2, F, 4.6); a.put(7, 2, F, 2.6); a.put(6, 2, F, 0.5);                                                   // the ring
  for (let x = 4; x <= 7; x++) a.put(x, 3, F, 4.4 - (x - 4) * 0.5);
  for (let x = 3; x <= 8; x++) a.put(x, 4, F, 4.8 - (x - 3) * 0.5);
  for (let y = 5; y <= 9; y++) for (let x = 3; x <= 8; x++) {
    if (x === 3 || x === 8) { a.put(x, y, F, x === 3 ? 4.2 : 2.2); continue; }
    const g = 5.6 - Math.hypot(x - 5.5, (y - 7.2) * 0.9) * 1.25 - (x > 6 ? 0.5 : 0);
    a.put(x, y, C, Math.max(0.6, g));
  }
  if (k === 1) { a.put(7, 6, F, 1.5); a.put(6, 7, F, 1.5); }                                                        // a crack across a pane, soot
  for (let x = 3; x <= 8; x++) { a.put(x, 10, F, 4.6 - (x - 3) * 0.5); a.put(x, 11, F, 2.4 - (x - 3) * 0.2); }
  return rimOut(a, F[0], false);
}
const LANTERNA = [lanternSprite(0, 13441), lanternSprite(1, 13442)];

/* black weed hanging from the cisterns' roof: limp ribbons with a few swollen bladders, runs like a vine;
   the last piece thins to tatters */
function weedSprite(end, s) {
  const a = spr(), A = DRC.alga, n = 3;
  for (let k = 0; k < n; k++) {
    const x0 = 2.5 + k * 3.4 + (hash2(s, k, 13451) - 0.5) * 1.4, len = end ? 4 + hash2(s, k, 13452) * 6 : 12, ph0 = hash2(s, k, 13453) * 6;
    for (let y = 0; y < len; y++) {
      const x = x0 + Math.sin(y * 0.55 + ph0) * 1.1, w = end && y > len - 3 ? 1 : 2;
      for (let i = 0; i < w; i++) a.put(x + i, y, A, (i === 0 ? 4.4 : 2.6) + Math.sin(y * 0.9 + k) * 0.6 - (k === 1 ? 0.6 : 0));
      if (!end && hash2(k, y, s) < 0.07) { a.put(x - 1, y, A, 5.6); a.put(x + 2, y, A, 3); }                   // a bladder
    }
  }
  return rimOut(a, A[0], false);
}
const ALGA = [weedSprite(false, 13461), weedSprite(false, 13462), weedSprite(true, 13463), weedSprite(true, 13464)];

/* a roof drip: a dark wet stain spreading from a crack, a short beard of slime, a bead at the tip; the drop falls live */
function dripSprite(s) {
  const a = spr();
  for (let y = 0; y < 3; y++) for (let x = 1; x < 11; x++) { const d = Math.abs(x - 5.5) / (5 - y * 1.4); if (d < 1 && hash2(x, y, s) < 0.85 - d * 0.4) a.put(x, y, DRC.lodo, 2.6 - d * 1.2 + (y === 0 ? 0.6 : 0)); }
  for (let y = 2; y < 6; y++) a.put(5 + (y > 3 && s % 2 ? 1 : 0), y, DRC.lodo, 4.4 - (y - 2) * 0.5);
  a.put(4, 1, DRC.agua, 2); a.put(5 + (s % 2), 6, DRC.agua, 3);
  return a;
}
const GOTEIRA = [dripSprite(13471), dripSprite(13472)];

/* an offering: a clay bowl heaped with sunken coins and teeth, one coin and a tooth fallen beside it */
function offeringSprite(s) {
  const a = spr(), A = DRC.argila, P = DRC.prata, O = DRC.osso, L = DRC.latao;
  for (let y = 7; y < 12; y++) { const hw = 4.6 - Math.max(0, y - 9) * 1.2; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) a.put(x, y, A, 4.2 - (x - 1) * 0.3 - (y - 7) * 0.3 + cg(x, y, s) * 0.4); }
  for (let x = 1; x <= 9; x++) a.put(x, 7, A, x < 4 ? 5.6 : 4.4 - (x - 4) * 0.3);                            // the rim
  if (s % 2) for (let x = 3; x <= 6; x++) a.put(x, 9, A, 1.4);                                                  // a painted band
  const heap = [[3, 6, P], [5, 6, L], [7, 6, P], [4, 5, P], [6, 5, L], [5, 4, P]];
  for (const [x, y, R] of heap) { a.put(x, y, R, 4.4); a.put(x + 1, y, R, 2.8); }
  for (const [x, y] of [[2, 6], [8, 5], [6, 4]]) { if (hash2(x, y, s) < 0.75) { a.put(x, y, O, 5.6); a.put(x, y - 1, O, 4.4); } }   // teeth
  a.put(10, 11, P, 4.4); a.put(11, 11, P, 2.6); a.put(0, 11, O, 5.2);
  return rimOut(a, A[0]);
}
const OFERENDA = [offeringSprite(13481), offeringSprite(13482)];

/* a looter's bundle: a sack of sacking tied at the neck with a candlestick poking out; or a red cloth knotted over
   a heap, a silver cup showing through */
function bundleSprite(k, s) {
  const a = spr(), C = k ? DRC.vermelho : DRC.pano;
  disc(a, 5.8, 8.2, 4.8, 3.9, C, (dx, dy, d, x, y) => 4.2 - dx * 1.2 - dy * 1.3 - d * 0.5 + cg(x, y, s) * 0.5 + (Math.sin(x * 1.3 + y * 0.7) > 0.8 ? -0.8 : 0));
  for (let x = 1; x <= 10; x++) a.put(x, 11, C, 1.2);
  if (!k) {
    for (let y = 2; y < 5; y++) for (let x = 5; x <= 7; x++) a.put(x, y, C, 3.8 - (x - 5) * 0.8);                   // the neck
    for (let x = 4; x <= 8; x++) a.put(x, 4, DRC.corda, 4.4 - (x - 4) * 0.4);                                      // the cord
    for (let y = 0; y < 4; y++) { a.put(8 + (y < 2 ? 1 : 0), y, DRC.latao, 5 - y * 0.3); }                          // a candlestick
    a.put(9, 0, DRC.latao, 6);
  } else {
    a.put(5, 3, C, 4.6); a.put(6, 3, C, 3); a.put(4, 4, C, 4); a.put(7, 4, C, 2.6);                                 // the knot
    for (let y = 5; y < 8; y++) for (let x = 7; x <= 9; x++) a.put(x, y, DRC.prata, (x === 7 ? 5.4 : 3.4) - (y - 5) * 0.4);   // the cup
    a.put(7, 5, DRC.prata, 6);
  }
  return rimOut(a, C[0]);
}
const TROUXA = [bundleSprite(0, 13491), bundleSprite(1, 13492)];

/* the bones of someone drowned, under a coat of black slime that hangs off them in drips */
function bonesSprite(s) {
  const a = spr(), O = DRC.osso, Lo = DRC.lodo;
  if (s % 2) {
    for (let x = 0; x < 8; x++) { a.put(x, 10, O, 4.4 - x * 0.12); a.put(x, 11, O, 2.4); }
    a.put(0, 9, O, 4); a.put(7, 9, O, 3.6);
    disc(a, 8.6, 8.4, 3, 2.8, O, (dx, dy, d, x, y) => 4.8 - dx * 1.2 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.4);
    a.put(8, 8, O, 0.4); a.put(9, 8, O, 0.4); a.put(10, 9, O, 1);
  } else {
    for (const rx of [2, 4.5, 7]) for (let y = 7; y < 12; y++) { const x = rx + Math.sin((y - 7) / 5 * Math.PI) * 1.4; a.put(x, y, O, 4.4 - (y - 7) * 0.4); }
    for (let x = 1; x < 10; x++) a.put(x, 11, O, 3 - x * 0.1);
  }
  for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (a[y * T + x] && cn(x * 20, y * 20, 6, 6, s) > 0.02) { a.put(x, y, Lo, 2.6 + hash2(x, y, s) * 1.6); if (y < 11 && hash2(x, y, s + 1) < 0.2 && !a[(y + 1) * T + x]) a.put(x, y + 1, Lo, 1.6); }
  a.put(3, 10, Lo, 6);
  return rimOut(a, Lo[0]);
}
const OSSOS = [bonesSprite(13501), bonesSprite(13502)];

/* a shop sign: in the chunk only the two eyes it hangs from; the chains and the board swing live (drawn lit) */
function signHooks(s) { const a = spr(), F = DRC.ferro; for (const x of [2, 9]) { a.put(x, 0, F, 4.2); a.put(x - 1, 0, F, 2.6); a.put(x, 1, F, 3); } return a; }
const PLACA = [signHooks(13511)];
// the boards: weathered planks with a faded painted sign (a boot, a key, a fish, a cup); 12 x 10, chains included
function signBoard(k, s) {
  const c = mk(T, 10), x = c.getContext('2d'), img = x.createImageData(T, 10), b = new Uint32Array(img.data.buffer), W = DRC.madeira, F = DRC.ferro;
  const put = (px, py, R, v) => { if (px >= 0 && py >= 0 && px < T && py < 10) b[py * T + px] = dPix(R, v); };
  for (const cx of [2, 9]) for (let y = 0; y < 3; y++) put(cx, y, F, y % 2 ? 2.4 : 4.4);
  for (let y = 3; y < 10; y++) for (let px = 0; px < T; px++) {
    if (k === 2 && px > 9 && y > 7) continue;                                                                       // a corner gone
    const edge = y === 3 || y === 9 || px === 0 || px === T - 1;
    put(px, y, W, edge ? (y === 3 || px === 0 ? 5 : 1.6) : 3.2 + (y === 6 ? -0.8 : 0) + Math.sin(px * 0.8 + y) * 0.3 + cg(px, y, s) * 0.5);
  }
  const P = k === 3 ? DRC.vermelho : DRC.latao, pix = [
    [[3, 5], [4, 5], [4, 6], [4, 7], [5, 7], [6, 7], [7, 7], [7, 8], [3, 8], [4, 8], [5, 8], [6, 8]],                  // a boot
    [[3, 5], [4, 5], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [7, 7], [8, 7], [6, 7]],                            // a key
    [[3, 6], [4, 5], [5, 5], [6, 5], [4, 7], [5, 7], [6, 7], [7, 6], [5, 6], [6, 6], [8, 5], [8, 7]],                   // a fish
    [[4, 5], [5, 5], [6, 5], [7, 5], [4, 6], [7, 6], [8, 6], [5, 7], [6, 7], [5, 8], [6, 8], [4, 8], [7, 8]]             // a cup
  ][k];
  for (const [px, py] of pix) if (hash2(px, py, s) < 0.85) put(px, py, P, py < 6 ? 4.4 : 3.4);
  x.putImageData(img, 0, 0); return c;
}
const PLACAS = [0, 1, 2, 3].map(k => signBoard(k, 13521 + k));

/* the cult's bells: in the chunk the nail and knot; the cord with three little bells swings live */
function bellsKnot(s) { const a = spr(); a.put(5, 0, DRC.ferro, 4.4); a.put(6, 0, DRC.ferro, 2.6); a.put(5, 1, DRC.corda, 4); a.put(6, 1, DRC.corda, 2.6); return a; }
const SININHOS = [bellsKnot(13531)];
// one little bell: 4 x 4 (brass, lit top left, a dark mouth, the clapper)
const SINO = (() => { const c = mk(4, 5), x = c.getContext('2d'), L = ['#1e1608', '#5a4618', '#9a7c34', '#d4b86e']; const px = [[1, 0, 2], [2, 0, 1], [0, 1, 3], [1, 1, 2], [2, 1, 2], [3, 1, 1], [0, 2, 2], [1, 2, 2], [2, 2, 1], [3, 2, 1], [0, 3, 0], [1, 3, 0], [2, 3, 0], [3, 3, 0], [1, 4, 1]]; for (const [i, j, l] of px) { x.fillStyle = L[l]; x.fillRect(i, j, 1, 1); } return c; })();

/* the cistern column: a plain round shaft of wet stone, a moulded foot, a block capital under the roof; low on the
   shaft a band of slime where the water stood */
function columnPiece(k, s) {   // 0 foot, 1 shaft, 2 head, 3 shaft with the water line
  const a = spr(), P = DRC.pedra, Sl = DRC.lodo;
  for (let y = 0; y < T; y++) for (let x = 3; x <= 8; x++) {
    const u = (x + 0.5 - 6) / 3, v = 4.2 - u * 1.8 - u * u * 0.8 + cg(x, y, s) * 0.4 + (k === 1 && y === 6 ? -1.4 : 0);
    a.put(x, y, P, v);
    if (k === 3 && y > 4) a.put(x, y, Sl, 3.4 - u * 1.6 + (y === 5 ? 1.6 : 0) + cg(x, y, s) * 0.5);                // slime below the water line
    else if (k === 3 && y === 4 && hash2(x, y, s) < 0.5) a.put(x, y, DRC.agua, 2);
  }
  if (k === 0) { for (let y = 7; y < 9; y++) for (let x = 2; x <= 9; x++) a.put(x, y, P, (y === 7 ? 5 : 3.6) - (x - 2) * 0.3); for (let y = 9; y < 12; y++) for (let x = 1; x <= 10; x++) a.put(x, y, hash2(x, y, s) < 0.35 ? Sl : P, (y === 9 ? 4.8 : 3.4) - (x - 1) * 0.25 - (y - 9) * 0.4 + cg(x, y, s) * 0.4); }
  if (k === 2) { for (let y = 0; y < 3; y++) for (let x = 0; x < T; x++) a.put(x, y, P, (y === 0 ? 3 : y === 1 ? 4.6 : 2.4) - x * 0.12 + cg(x, y, s) * 0.3); for (let y = 3; y < 5; y++) for (let x = 2 - (y - 3); x <= 9 + (y - 3); x++) a.put(x, y, P, (y === 3 ? 3.6 : 4.2) - (x - 1) * 0.25); for (const x of [1, 9]) if (hash2(x, s, 1) < 0.7) a.put(x, 3, Sl, 3); }
  return rimOut(a, P[0]);
}
const COLUNA = [columnPiece(0, 13541), columnPiece(1, 13542), columnPiece(2, 13543), columnPiece(3, 13544)];

/* the bell tower's grille: round iron bars and a riveted strap, rust running down; a top piece ends in spikes */
function grilleSprite(k, s) {
  const a = spr(), F = DRC.ferro;
  for (let y = 0; y < T; y++) for (const x0 of [1, 5, 9]) {
    if (k === 2 && y < 4) { if (y === 0) a.put(x0, 0, F, 5.6); else if (y === 1) { a.put(x0, 1, F, 5); a.put(x0 + 1, 1, F, 3); } else if (y === 2) { a.put(x0 - 1, 2, F, 4.4); a.put(x0, 2, F, 5.2); a.put(x0 + 1, 2, F, 3.4); a.put(x0 + 2, 2, F, 2); } else { a.put(x0, 3, F, 3.6); a.put(x0 + 1, 3, F, 1.6); } continue; }
    a.put(x0, y, F, 4.6 + cg(x0, y, s) * 0.4); a.put(x0 + 1, y, F, 2.4 + cg(x0 + 1, y, s) * 0.4);
  }
  for (let x = 0; x < T; x++) { a.put(x, 4, F, 4.4 - (x % 4 === 3 ? 0.8 : 0)); a.put(x, 5, F, 2.2); }
  for (const x0 of [1, 5, 9]) a.put(x0, 4, F, 6);                                                                 // rivets
  for (let k2 = 0; k2 < 144; k2++) if (a[k2] && hash2(k2, s, 13551) < 0.06) a[k2] = dPix(DRC.ferrugem, 1 + hash2(k2, s, 13552) * 3);
  for (const x0 of [1, 5, 9]) if (hash2(x0, s, 13553) < 0.5) for (let y = 6; y < 6 + hash2(x0, s, 13554) * 5; y++) a.put(x0 + 1, y, DRC.ferrugem, 2);
  return a;
}
const GRADE = [grilleSprite(0, 13561), grilleSprite(1, 13562), grilleSprite(2, 13563)];
// the grille is a solid see-through sprite (like the cathedral's grate): walls show between the bars
DECO[CD_BARREIRA] = GRADE; MAT[CD_BARREIRA] = [PALS.cdGrade, BKV.grade]; SOLID[CD_BARREIRA] = 1; DIG[CD_BARREIRA] = 0; PCOL[CD_BARREIRA] = '#4a5058'; SEETHRU[CD_BARREIRA] = 1;

DECO[CD_ESCADA] = ESCADA; DECO[CD_CORRENTE] = CORRENTE; DECO[CD_VELAS] = VELAS; DECO[CD_LANTERNA] = LANTERNA; DECO[CD_ALGA] = ALGA; DECO[CD_GOTEIRA] = GOTEIRA;
DECO[CD_OFERENDA] = OFERENDA; DECO[CD_TROUXA] = TROUXA; DECO[CD_OSSOS] = OSSOS; DECO[CD_PLACA] = PLACA; DECO[CD_SININHOS] = SININHOS; DECO[CD_COLUNA] = COLUNA;
const CD_DECO = [
  // id, dig, map colour, drop
  [CD_ESCADA, 0.25, '#634c2e', 'madeira'], [CD_CORRENTE, 0.3, '#4a5058', null], [CD_VELAS, 0.05, '#d8c8a0', null], [CD_LANTERNA, 0.1, '#ffb84a', null],
  [CD_ALGA, 0.03, '#213326', null], [CD_GOTEIRA, 0.03, '#2a3e26', null], [CD_OFERENDA, 0.08, '#92603c', 'moeda_afundada'], [CD_TROUXA, 0.1, '#72654a', 'corda_alcatroada'],
  [CD_OSSOS, 0.06, '#aea290', 'osso'], [CD_PLACA, 0.15, '#4a3a29', 'madeira'], [CD_SININHOS, 0.05, '#9a7c34', null], [CD_COLUNA, 0.6, '#6c7262', 'pedra_limo']
];
for (const [t, dig, col, drop] of CD_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[CD_VELAS] = 0.5; EMIT[CD_LANTERNA] = 0.7;
// what falls when its support goes (56, 87); the ladder, the chain and the column are left alone (they span drops)
for (const t of [CD_LANTERNA, CD_ALGA, CD_GOTEIRA, CD_PLACA, CD_SININHOS]) CV_HANGS[t] = 1;
for (const t of [CD_VELAS, CD_OFERENDA, CD_TROUXA, CD_OSSOS]) CV_STANDS[t] = 1;

// which variation goes where
DECO_PICK[CD_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== CD_ESCADA && solidAt(gx, gy - 1) ? arr[2] : tileAt(gx, gy + 1) !== CD_ESCADA && !solidAt(gx, gy + 1) ? arr[3] : arr[hash2(gx, gy, 13571) < 0.2 ? 1 : 0];
DECO_PICK[CD_CORRENTE] = (gx, gy, arr) => tileAt(gx, gy + 1) === CD_CORRENTE || solidAt(gx, gy + 1) ? arr[(gy & 1) ? 1 : 0] : arr[2];
DECO_PICK[CD_ALGA] = (gx, gy, arr) => tileAt(gx, gy + 1) === CD_ALGA ? arr[hash2(gx, gy, 13572) < 0.5 ? 1 : 0] : arr[hash2(gx, gy, 13573) < 0.5 ? 3 : 2];
DECO_PICK[CD_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== CD_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== CD_COLUNA ? arr[2] : tileAt(gx, gy + 2) !== CD_COLUNA && tileAt(gx, gy + 1) === CD_COLUNA ? arr[3] : arr[1];
DECO_PICK[CD_BARREIRA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== CD_BARREIRA && !solidAt(gx, gy - 1) ? arr[2] : arr[hash2(gx, gy, 13574) < 0.5 ? 1 : 0];
const velaVar = (gx, gy) => (hash2(gx, gy, 13575) * 3) | 0;
DECO_PICK[CD_VELAS] = (gx, gy, arr) => arr[velaVar(gx, gy)];

// the rope ladder and the chain are climbed like the cathedral's chains; the ladder also counts as the mine's ladder (the climbing pose, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, CD_CORRENTE) || _tt(e, CD_ESCADA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, CD_ESCADA)); }; }

/* ================= live: glows, flames, the drip, the sign, the bells, the scraped silver ================= */
const CD_GLOW = {};
const cdScraped = new Map();   // silver blocks the pick just scraped: key -> seconds left
HOOK.drawGlow.push((cx, cy) => {
  if (!CIDADE) return;
  if (!CD_GLOW.v) { CD_GLOW.v = glow(16, '#ffa848'); CD_GLOW.l = glow(26, '#ff9a3a'); CD_GLOW.p = glow(9, '#aab6c8'); CD_GLOW.s = glow(12, '#dce6f2'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== CD_VELAS && t !== CD_LANTERNA && t !== CD_O_PRATA) continue;
    const gx = emitters[i], gy = emitters[i + 1];
    if (t === CD_VELAS) { lc.globalAlpha = 0.22 + Math.sin(gameTime * 11 + gx * 1.7) * 0.03 + Math.sin(gameTime * 17 + gy) * 0.02; lc.drawImage(CD_GLOW.v, gx * T + 6 - cx - 16, gy * T + 6 - cy - 16); }
    else if (t === CD_LANTERNA) { lc.globalAlpha = 0.3 + Math.sin(gameTime * 8 + gx * 1.3) * 0.03 + Math.sin(gameTime * 13 + gy) * 0.02; lc.drawImage(CD_GLOW.l, gx * T + 6 - cx - 26, gy * T + 7 - cy - 26); }
    else { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.06 + Math.sin(gameTime * 0.9 + gx * 0.7 + gy) * 0.03; lc.drawImage(CD_GLOW.p, gx * T + 6 - cx - 9, gy * T + 6 - cy - 9); }
  }
  for (const [k, v] of cdScraped) { const c = k.indexOf(','), gx = +k.slice(0, c), gy = +k.slice(c + 1); lc.globalAlpha = Math.min(1, v) * 0.35; lc.drawImage(CD_GLOW.s, gx * T + 6 - cx - 12, gy * T + 6 - cy - 12); }
  lc.globalAlpha = 1;
});
// the pick scraping silver: a bright scratch and a few cold sparks for a moment
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target; _pi(sx, sy, aim);
  if (!tg || !tg.inReach || !tg.dig || tileAt(tg.tx, tg.ty) !== CD_O_PRATA) return;
  cdScraped.set(wrapX(tg.tx) + ',' + tg.ty, 2.5);
  burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 4, '#e4ecf6', 60, 200, 0.4, 1, true);
}; }
// visible signs and bells: rescanned when the view moves a tile or every half second (they are few)
const cdVis = [], cdDrips = []; let cdVisKey = '', cdVisT = 0;
const cdBells = new Map();   // key -> swing energy
function cdSininhos(gx, gy, f = 1) { const k = wrapX(gx) + ',' + gy, e = cdBells.get(k) || 0; if (e < f * 0.6) cdBells.set(k, f); }   // something brushed the bells (133 may wrap it for the sound)
HOOK.update.push(dt => {
  if (!CIDADE) return;
  for (const [k, v] of cdScraped) { if (v - dt <= 0) cdScraped.delete(k); else cdScraped.set(k, v - dt); }
  for (const [k, v] of cdBells) { if (v - dt * 0.5 <= 0) cdBells.delete(k); else cdBells.set(k, v - dt * 0.5); }
  if (state !== 'play') return;
  const cx = cam.x, cy = cam.y;
  const x0 = Math.floor(cx / T) - 1, y0 = Math.max(0, Math.floor(cy / T) - 1), key = x0 + ',' + y0;
  if (key !== cdVisKey || (cdVisT -= dt) <= 0) {
    cdVisKey = key; cdVisT = 0.5; cdVis.length = 0; cdDrips.length = 0;
    const y1 = Math.min(WH - 1, y0 + Math.ceil(VH / T) + 2), x1 = x0 + Math.ceil(VW / T) + 2;
    if (inCidade(y0) || inCidade(y1)) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = tileAt(x, y); if (t === CD_PLACA || t === CD_SININHOS) cdVis.push(x, y, t); else if (t === CD_GOTEIRA) cdDrips.push(x, y); }
  }
  // the bells ring when someone passes right under them
  for (let i = 0; i < cdVis.length; i += 3) {
    if (cdVis[i + 2] !== CD_SININHOS) continue;
    const bx = (cdVis[i] + 0.5) * T, by = cdVis[i + 1] * T;
    const under = e => Math.abs(e.x + e.w / 2 - bx) < 8 && e.y < by + 4 * T && e.y + e.h > by + T;
    let hit = !pl.dead && under(pl) && (Math.abs(pl.vx) > 10 || Math.abs(pl.vy) > 10);
    if (!hit) for (const e of enemies) if (!e.dead && under(e) && Math.abs(e.vx || 0) > 10) { hit = true; break; }
    if (hit) window.cdSininhos(cdVis[i], cdVis[i + 1]);
  }
});
const sx = (gx, cx) => { let x = gx * T - cx; const W = WW * T; if (x < -W / 2) x += W; else if (x > W / 2) x -= W; return x; };
// the sign and the bells, lit like the world
HOOK.drawWorld.push((cx, cy) => {
  if (!CIDADE || !cdVis.length) return;
  for (let i = 0; i < cdVis.length; i += 3) {
    const gx = cdVis[i], gy = cdVis[i + 1], t = cdVis[i + 2]; if (tileAt(gx, gy) !== t) continue;
    const x = sx(gx, cx), y = gy * T - cy;
    if (t === CD_PLACA) {
      const a = Math.sin(gameTime * 0.9 + gx * 1.7) * 0.07 + Math.sin(gameTime * 2.3 + gy) * 0.02, b = PLACAS[(hash2(gx, gy, 13581) * 4) | 0];
      lc.save(); lc.translate(Math.round(x) + 6, y + 1); lc.rotate(a); lc.drawImage(b, -6, 0); lc.restore();
    } else {
      const e = cdBells.get(wrapX(gx) + ',' + gy) || 0;
      for (let k = 0; k < 3; k++) {
        const len = 4 + k * 3 + (hash2(gx, k, 13582) * 3 | 0), a = Math.sin(gameTime * (2.2 + k * 0.7) + gx + k * 2) * (0.04 + e * 0.35), bx = x + 6 + (k - 1) * 3;
        lc.fillStyle = '#4c3922';
        for (let j = 2; j < len; j++) lc.fillRect(Math.round(x + 6 + (k - 1) * 3 * j / len + Math.sin(a) * j), y + j, 1, 1);
        lc.drawImage(SINO, Math.round(bx + Math.sin(a) * len - 1.5), y + len);
      }
    }
  }
});
// over the darkness: candle flames, the lantern's flame, the drip falling
HOOK.drawTop.push((cx, cy) => {
  if (!CIDADE) return;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== CD_VELAS && t !== CD_LANTERNA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === CD_LANTERNA) { const f = Math.floor(gameTime * 9 + gx * 3) % 3; lc.fillStyle = '#ffd884'; lc.fillRect(x + 5, y + 6 + (f === 1 ? 0 : 1), 2, f === 1 ? 3 : 2); lc.fillStyle = '#fff0b0'; lc.fillRect(x + 5 + (f === 2 ? 1 : 0), y + 8, 1, 1); continue; }
    const wk = CD_WICKS[velaVar(gx, gy)];
    for (let k = 0; k < wk.length; k++) { const [px, py] = wk[k], f = Math.floor(gameTime * 8 + gx * 3 + k * 5) % 3; lc.fillStyle = '#ffb84a'; lc.fillRect(x + px, y + py - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#fff0b0'; lc.fillRect(x + px, y + py + 1, 1, 1); }
  }
  for (let i = 0; i < cdDrips.length; i += 2) {
    const gx = cdDrips[i], gy = cdDrips[i + 1], x = gx * T - cx, y = gy * T - cy, ph0 = (gameTime * 0.4 + hash2(gx, gy, 13591)) % 1;
    if (ph0 < 0.72) { lc.fillStyle = '#4a5c5c'; lc.fillRect(x + 5 + (hash2(gx, gy, 13592) < 0.5 ? 0 : 1), y + 7, 1, ph0 > 0.45 ? 2 : 1); continue; }
    let fl = 1; while (fl < 10 && !solidAt(gx, gy + fl)) fl++;
    const fy = (ph0 - 0.72) / 0.28, dy = 7 + fy * fy * (fl * T - 7);
    lc.fillStyle = '#728888'; lc.fillRect(x + 5, y + dy, 1, 2);
  }
});
Object.assign(CDART, { cg, cn, cells, dPix, cvSprite, spr, rimOut, disc, flipX, courses, DRC, BRICKC, POT, GLAZE, PLASTER, MORTAR, SLIME, WETG, RUSTC, IRONC,
  vAterro, vCantaria, vTijolo, brickV, vCalcamento, vTelha, vMadeirame, vLimo, vLodo, vMarmore, vPoco, vEntulho, vFresca, PLACAS, SINO, CD_WICKS, cdScraped, cdBells });
window.cdSininhos = cdSininhos;
}
