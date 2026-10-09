'use strict';

/* ================= the abandoned cathedral: blocks, back walls, far layer, decorations =================
   Natural limestone around the building, then worked stone: big ashlar, worn floor slabs, a checkered
   marble mosaic, cracked and sooty ruins, rubble, cold crypt masonry, an ossuary of skulls, black and
   white marble, carved friezes, grave slabs, mossy stones, fluted pilasters, old brick and the slate of
   the vaults. Every material is baked once into a seamless 240x240 texture sampled in world pixels (like
   03-blocos), so a wall of ashlar reads as one continuous piece of masonry, and 07-chunks-luz draws these
   blocks at no extra cost: outline, lit top edge, shaded underside and ambient occlusion come from there.
   Patterns use sizes that divide 240 so the textures tile without a seam. The ids come from 41-catedral-api.
   Small decorations (column pieces, roots, broken glass, skulls, candles, thick webs) are 12x12 sprites in
   DECO[], painted once on ramps with light from the top left. */

// ids beyond the spec's list, declared here (41-catedral-api reserves 30..46 and walls 5..10)
const CT_FRISO = 47, CT_LAPIDE = 48, CT_MUSGO = 49, CT_MARMORE = 50, CT_PILASTRA = 51, CT_TIJOLO = 52, CT_ARDOSIA = 53;
const WCT_ARCADA = 11, WCT_MARMORE = 12;
const VELAS_PAVIOS = [[[2, 3], [5, 1], [9, 5]], [[3, 4], [7, 2]]];   // per CT_VELAS variation: the pixel above each wick, where the flame goes
const CATART = {};                                                    // painters shared with 43-catedral-objetos
{
/* ---- palettes: 6 shades, dark to light (spec §2), shadows lean cool, lights warm ---- */
pal('calcario', ['#35322e', '#514c45', '#6d675e', '#8a8378', '#a69e91', '#c1b9aa']);
pal('cantaria', ['#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3']);
pal('laje', ['#36332e', '#524d45', '#6f695e', '#8d8677', '#aba291', '#c6bdaa']);
pal('marmore', ['#45423f', '#66625d', '#8a857e', '#aca69c', '#cac4b8', '#e3ddd1']);
pal('marmoreNegro', ['#0e0d10', '#18161b', '#232027', '#2f2b34', '#3d3843', '#4d4754']);
pal('ruina', ['#2e2c2a', '#47443f', '#625e57', '#7e7970', '#9b958a', '#b6b0a3']);
pal('escombro', ['#2a2825', '#403d38', '#58544d', '#716c63', '#8b857b', '#a49e92']);
pal('cripta', ['#17161b', '#222027', '#2d2a33', '#3a3640', '#48434f', '#57515f']);
pal('osso', ['#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']);
pal('tijolo', ['#241c1c', '#3a2e2c', '#52423e', '#6a5650', '#826c64', '#9c847a']);
pal('ardosia', ['#14161c', '#20242c', '#2d323d', '#3b4250', '#4b5466', '#5f697e']);
pal('lapide', ['#2c2c31', '#45454c', '#606068', '#7c7c84', '#9a9aa1', '#b7b7bd']);
// back walls: always far darker than the stone in front (spec)
pal('calcarioW', ['#11100e', '#171614', '#1e1c19', '#25221f', '#2c2925', '#35312c']);
pal('cantariaW', ['#121110', '#181715', '#1f1d1a', '#262420', '#2e2b27', '#37332e']);
pal('rebocoW', ['#13110f', '#1a1714', '#221e1a', '#2a2520', '#332d27', '#3d362e']);
pal('painelW', ['#0b0705', '#110b08', '#18100b', '#1f150e', '#271b12', '#302216']);
pal('criptaW', ['#0b0a0d', '#100f13', '#16151a', '#1c1b21', '#232128', '#2a2830']);
pal('ossoW', ['#110e0a', '#18140f', '#201b14', '#29221a', '#322a20', '#3c3227']);
pal('marmoreW', ['#121112', '#191718', '#201e1f', '#282526', '#302d2d', '#3a3636']);
// the far layer behind the walls: deep and dim, like deepAntiga
pal('dpAlvenaria', ['#0b0a0a', '#131111', '#1a1817', '#221f1e', '#2b2726', '#35302e']);
pal('dpAbobada', ['#0a0a0c', '#111114', '#18181c', '#201f25', '#28272e', '#323039']);
pal('dpCalcario', ['#0c0b0a', '#141210', '#1b1916', '#23201c', '#2b2823', '#34302a']);
pal('dpCripta', ['#070709', '#0c0c0f', '#111115', '#16161b', '#1c1b22', '#22212a']);

/* ---- little tools ---- */
const cg = (x, y, s) => hash2(x, y, s) - 0.5;                         // per-pixel grain
const cn = (x, y, L, LY, s) => pn(x, y, L, LY, s) - 0.5;             // smooth noise, L x LY features per 240 px
const wrapT = v => ((v % TP) + TP) % TP;
// running-bond courses: row height rh, block widths cycling through ws (their sum must divide 240), each row shifted
function bond(x, y, rh, ws, s) {
  const r = Math.floor(y / rh), ly = y - r * rh, per = ws.reduce((a, b) => a + b, 0), off = (hash2(r % (TP / rh), 0, s) * per) | 0;
  let xx = wrapT(x + off), k = 0, i = 0;
  const cyc = Math.floor(xx / per); xx -= cyc * per;
  while (xx >= ws[i]) { xx -= ws[i]; i++; k++; }
  return { r, ly, lx: xx, w: ws[i], id: hash2(cyc * ws.length + k, r % (TP / rh), s + 1) };
}
// a dressed stone face: bevel lit from the top left, mortar joint, tooling, pits, water stains
function dressed(b, rh, x, y, s, o = {}) {
  const { lx, ly, w, id } = b;
  if (ly === rh - 1 || lx === w - 1) return 0.35 + cg(x, y, s + 3) * 0.5;
  if ((lx === 0 || lx === w - 2) && (ly === 0 || ly === rh - 2) && hash2(x, y, s + 4) < 0.5) return 1.3;
  let v = (o.base || 2.9) + (id - 0.5) * (o.tone || 1.0) + cg(x, y, s + 5) * (o.grain || 0.7) + cn(x, y, 60, 60, s + 6) * 0.6;
  if (ly === 0) v += 1.0; else if (lx === 0) v += 0.45;
  if (ly === rh - 2) v -= 0.85; else if (lx === w - 2) v -= 0.45;
  if (o.tool && ly > 0 && ly < rh - 2 && (y + (id * 7 | 0)) % 2 === 0) v -= 0.25;     // chisel striations
  if (hash2(x, y, s + 7) < 0.03) v -= 1.2;                                               // pits
  const st = cn(x, y, 40, 8, s + 8); if (st > 0.3) v -= (st - 0.3) * 4;                  // water stains running down
  return v;
}
// relief from a height field lit from the top left
const relief = (H, x, y, k) => (H(x + 1, y + 1) - H(x - 1, y - 1)) * k;

/* ---- solid stone ---- */
function vCalcario(x, y) {   // natural limestone: soft bedding layers, fractures, pits and the odd fossil shell
  const bedw = cn(x, y, 8, 4, 1501) * 9, bed = (y + bedw) % 16;
  let v = 2.5 + cn(x, y, 30, 30, 1502) * 1.6 + cn(x, y, 100, 100, 1503) * 0.8 + cg(x, y, 1504) * 0.75;
  if (bed < 1) v -= 1.0; else if (bed < 2.2) v += 0.7;
  if (Math.abs(cn(x, y, 18, 18, 1505)) < 0.014) v -= 1.5;                                // fracture
  if (hash2(x, y, 1506) < 0.025) v -= 1.2; else if (hash2(x, y, 1507) < 0.02) v += 1.2;
  const gx = Math.floor(x / 20), gy = Math.floor(y / 20);
  if (hash2(gx, gy, 1508) < 0.12) { const cx = gx * 20 + 4 + hash2(gx, gy, 1509) * 12, cy = gy * 20 + 4 + hash2(gx, gy, 1510) * 12, r = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx); if (r < 2.4) v += (Math.sin(a * 5) > 0 ? 0.9 : -0.4) - r * 0.2; }
  return v;
}
const ROOTP = ['#2a1a10', '#43301e', '#5e4630'].map(h => ph(h));
function vCalcTerra(x, y) {   // limestone with pockets of dirt and a few roots threading through
  const pocket = cn(x, y, 14, 14, 1521) + cn(x, y, 40, 40, 1522) * 0.5;
  const root = Math.abs(cn(x + cn(x, y, 8, 30, 1524) * 40, y, 26, 6, 1523));
  if (root < 0.012 && pocket > -0.05) { MATX = ROOTP[root < 0.005 ? 2 : 1]; return -9; }
  if (root < 0.02 && pocket > -0.05) { MATX = ROOTP[0]; return -9; }
  if (pocket > 0.12) { const d = vDirt(x, y); if (d === -9) return -9; MATX = PALS.dirt[clamp((d * 0.6 - (pocket < 0.16 ? 0.9 : 0.2)) | 0, 0, 3)]; return -9; }
  return vCalcario(x, y) + (pocket > 0.06 ? -0.6 : 0);
}
function vCantaria(x, y) { return dressed(bond(x, y, 12, [24, 24, 12], 1531), 12, x, y, 1532, { tool: 1, base: 2.8 }); }
function vLaje(x, y) {   // worn floor slabs: polished where feet went, chipped corners, a crack here and there
  const b = bond(x, y, 12, [20, 16, 24], 1541), { lx, ly, w, id } = b;
  if (ly === 11 || lx === w - 1) return 0.3 + cg(x, y, 1542) * 0.4;
  let v = 2.6 + (id - 0.5) * 0.9 + cg(x, y, 1543) * 0.6 + cn(x, y, 48, 48, 1544) * 0.5;
  const ux = (lx - w / 2) / (w / 2), uy = (ly - 5.5) / 6; v += (1 - Math.min(1, ux * ux + uy * uy)) * 0.9;
  if (ly === 0) v += 0.9; else if (ly === 10) v -= 0.8; if (lx === 0) v += 0.4; else if (lx === w - 2) v -= 0.4;
  if ((lx < 2 || lx > w - 4) && (ly < 2 || ly > 8) && hash2(x >> 1, y >> 1, 1545) < 0.4) v -= 1.4;
  if (id < 0.3 && Math.abs(cn(x, y, 30, 30, 1546)) < 0.018) v -= 1.6;
  return v;
}
// veined marble: returns the shade and how strongly a vein crosses this pixel
function marbleV(x, y, s, slab) {
  const gx = Math.floor(x / slab), gy = Math.floor(y / slab), lx = x - gx * slab, ly = y - gy * slab;
  let v = 3.1 + cn(x, y, 20, 20, s) * 1.1 + cg(x, y, s + 1) * 0.35;
  const warp = cn(x, y, 12, 12, s + 2) * 0.6, vein = Math.abs(cn(x + warp * 40, y, 16, 24, s + 3)), vein2 = Math.abs(cn(x, y + warp * 30, 40, 30, s + 4));
  let k = 0; if (vein < 0.014) k = 2; else if (vein < 0.028) k = 1; if (vein2 < 0.008) k = Math.max(k, 1);
  if (lx === slab - 1 || ly === slab - 1) v = 1.0; else if (lx === 0 || ly === 0) v += 0.6;
  v += (1 - (lx + ly) / (slab * 2)) * 0.5;
  return [v, k];
}
function vMarmore(x, y) { const [v, k] = marbleV(x, y, 1551, 24); return k === 2 ? v - 1.9 : k === 1 ? v - 0.9 : v; }
function vMarmoreNegro(x, y) { const [v, k] = marbleV(x, y, 1561, 24); return k === 2 ? v + 2.3 : k === 1 ? v + 1.1 : v - 0.6; }
// mosaic: a checker of light and black marble squares, a running border of red and ochre tesserae every 24 rows
const MOS_D = PALS.marmoreNegro, TESS = [['#4a2420', '#64302a', '#7a3d33'], ['#6a4c22', '#86662e', '#a07e3c'], ['#5e5a52', '#7a756a', '#958f82']].map(r => r.map(h => ph(h)));
function vMosaico(x, y) {
  const ly = wrapT(y) % 24;
  if (ly < 6) {   // the border band, 3 px tesserae
    const lx = wrapT(x) % 3, ty = ly % 3, tx = Math.floor(wrapT(x) / 3), row = ly < 3 ? 0 : 1;
    if (lx === 2 || ty === 2) return 0.6 + cg(x, y, 1571) * 0.5;
    const k = (tx + row * 2) % 4 === 0 ? 1 : (tx + row) % 2 ? 0 : 2, h = hash2(tx, Math.floor(y / 3), 1572);
    if (h < 0.07) return 1.0;
    MATX = TESS[k][clamp((h * 2.2 + (lx === 0 && ty === 0 ? 0.7 : 0)) | 0, 0, 2)]; return -9;
  }
  const cx = Math.floor(wrapT(x) / 6), cy = Math.floor((ly - 6) / 6), lx = wrapT(x) % 6, l2 = (ly - 6) % 6;
  const [mv, k] = marbleV(x, y, 1573, 240);
  let v = mv - 1.1 + (lx === 0 || l2 === 0 ? 0.5 : 0) - (lx === 5 || l2 === 5 ? 0.9 : 0);
  if ((cx + cy) & 1) { MATX = shadeOf(MOS_D, v + 1.9 + (k ? 0.9 : 0)); return -9; }
  return v - (k === 2 ? 1.4 : k === 1 ? 0.6 : 0);
}
function vRuina(x, y) {   // cracked ashlar, spalled faces, soot crawling up from old fires
  const b = bond(x, y, 12, [24, 24, 12], 1581); let v = dressed(b, 12, x, y, 1582, { base: 2.6, tool: 1 });
  const c1 = Math.abs(cn(x, y, 24, 24, 1583)), c2 = Math.abs(cn(x, y, 50, 50, 1584));
  if (c1 < 0.013) v = 0.4; else if (c1 < 0.024) v -= 0.9;
  if (c2 < 0.008) v = Math.min(v, 0.9);
  if (b.id < 0.14 && b.ly > 1 && b.ly < 7 && b.lx > 2 && b.lx < b.w - 5) v -= 1.4;
  const soot = cn(x, y, 10, 14, 1585) + cn(x, y, 40, 40, 1586) * 0.4; if (soot > 0.1) v -= (soot - 0.1) * 6;
  return v;
}
function vEscombro(x, y) {   // broken chunks of the old walls, dusty, each a little facet lit from the top left
  const cs = 6, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let d1 = 99, d2 = 99, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, wx = ((cx % 40) + 40) % 40, wy = ((cy % 40) + 40) % 40;
    const px = cx * cs + hash2(wx, wy, 1591) * cs, py = cy * cs + hash2(wx, wy, 1592) * cs, d = Math.hypot(x - px, (y - py) * 1.15);
    if (d < d1) { d2 = d1; d1 = d; id = hash2(wx, wy, 1593); ox = x - px; oy = y - py; } else if (d < d2) d2 = d;
  }
  if (d2 - d1 < 0.9) return 0.25;
  let v = 2.5 + (id - 0.5) * 1.6 + cg(x, y, 1594) * 0.6 - (ox + oy) * 0.12;
  if (d2 - d1 < 1.8) v -= 0.5;
  if (id > 0.85) v += 0.6;   // a worked face among the rubble
  return v;
}
function vCripta(x, y) {   // cold, old masonry: low uneven courses, crumbling joints, damp
  const b = bond(x, y, 6, [10, 14, 6], 1601); let v = dressed(b, 6, x, y, 1602, { base: 2.7, tone: 1.3, grain: 0.85 });
  if (b.ly === 5 && hash2(x >> 1, y, 1603) < 0.35) v = 0.1;
  const damp = cn(x, y, 20, 12, 1604); if (damp > 0.18) v -= (damp - 0.18) * 5;
  return v;
}
function vOssario(x, y) {   // rows of skulls in mortar with a course of long bones under each, 8 x 12 per skull
  const row = Math.floor(y / 12), ly = y - row * 12, off = (row & 1) * 4, lx = wrapT(x + off) % 8, cell = Math.floor(wrapT(x + off) / 8), h = hash2(cell, row % 20, 1611);
  if (ly >= 9) {
    const bl = ly - 9, seg = Math.floor(wrapT(x + row * 5) / 12), sx = wrapT(x + row * 5) % 12;
    if (sx === 11) return 0.4;
    let v = 3.3 - bl * 0.9 + cg(x, y, 1612) * 0.5; if (sx < 2 || sx > 8) v += 0.5; if (bl === 1 && sx > 1 && sx < 9) v -= 0.4;
    return v + (hash2(seg, row, 1613) - 0.5) * 0.6;
  }
  if (h < 0.08) return 1.2 + cg(x, y, 1614) * 1.6 + (hash2(x >> 1, y >> 1, 1615) < 0.4 ? 1.6 : 0);   // a gap stuffed with broken bone
  const dx = lx - 3.5 + (h > 0.9 ? 0.5 : 0), dy = ly - 4.0;
  const skull = (dx * dx) / 12.5 + (dy * dy) / 16 < 1 || (ly >= 6 && ly <= 8 && Math.abs(dx) < 2.4);
  if (!skull) return 0.3 + cg(x, y, 1616) * 0.4;
  if (ly >= 3 && ly <= 4 && (lx === 2 || lx === 5)) return 0.15;
  if (ly === 5 && lx === 3 + (h < 0.5 ? 0 : 1)) return 0.6;
  if (ly === 7 && (lx & 1)) return 0.9;
  let v = 3.7 + (h > 0.75 ? 0.6 : h < 0.25 ? -0.6 : 0) - (dx + dy) * 0.28 - (dx * dx + dy * dy) * 0.05 + cg(x, y, 1617) * 0.5;
  if (ly === 0 || (ly === 1 && Math.abs(dx) > 2)) v -= 0.6;
  return v;
}
function frizeH(x, y) {   // a band of quatrefoils and six-petal roses between two mouldings, 24 x 12
  const lx = wrapT(x) % 24, ly = wrapT(y) % 12;
  if (ly < 2 || ly > 9) return 1.5;
  if (ly === 2 || ly === 9) return 0.4;
  const cx = lx < 12 ? 5.5 : 17.5, dx = lx - cx, dy = ly - 5.5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  if (lx < 12) { const pr = 3.6 + Math.cos(a * 4) * 0.9; return r < pr ? 1.4 - r * 0.15 : 0.2; }
  const pr = 3.4 + Math.cos(a * 6) * 0.5; return r < 1.1 ? 1.6 : r < pr ? 1.1 - Math.abs(Math.sin(a * 3)) * 0.4 : 0.2;
}
function vFriso(x, y) { return 1.7 + frizeH(x, y) * 1.1 + relief(frizeH, x, y, 1.4) + cg(x, y, 1621) * 0.45 + cn(x, y, 40, 40, 1622) * 0.5 - (hash2(x, y, 1623) < 0.02 ? 1 : 0); }
function tombH(x, y) {   // a sunken panel with a raised cross and two lines of worn letters, slabs two blocks wide
  const lx = wrapT(x) % 24, ly = wrapT(y) % 12;
  if (lx < 2 || lx > 21 || ly < 2 || ly > 9) return 1.2;
  if ((lx >= 4 && lx <= 5 && ly >= 3 && ly <= 8) || (ly >= 4 && ly <= 5 && lx >= 3 && lx <= 6)) return 1.1;
  if (lx >= 9 && lx <= 19 && (ly === 4 || ly === 7) && hash2(x >> 1, y, 1631) < 0.75) return 0.2;
  return 0.6;
}
function vLapide(x, y) {
  const lx = wrapT(x) % 24, ly = wrapT(y) % 12;
  if (lx === 23 || ly === 11) return 0.4;
  return 1.6 + tombH(x, y) * 1.3 + relief(tombH, x, y, 1.3) + cg(x, y, 1632) * 0.45 + cn(x, y, 30, 30, 1633) * 0.6 - (hash2(x, y, 1634) < 0.025 ? 1 : 0);
}
const MOSS = ['#141d10', '#1e2a16', '#2e4020', '#3a4e26', '#44582c'].map(h => ph(h));
function vMusgo(x, y) {   // ashlar where the damp gets in: moss in the joints and on the tops of the stones
  const b = bond(x, y, 12, [24, 24, 12], 1641), v = dressed(b, 12, x, y, 1642, { base: 2.6, tool: 1 });
  const damp = cn(x, y, 16, 16, 1643) + cn(x, y, 48, 48, 1644) * 0.4 + 0.06, g = hash2(x, y, 1645), joint = b.ly === 11 || b.lx === b.w - 1 || b.ly === 0;
  if (damp > 0.14 && (joint ? g < damp * 3 : b.ly < 2 ? g < damp * 1.6 : g < (damp - 0.14) * 1.4)) { MATX = MOSS[clamp(((damp - 0.14) * 10 + g * 1.5 + (b.ly < 2 ? 0.8 : 0)) | 0, 0, 4)]; return -9; }
  return v;
}
function vPilastra(x, y) {   // a fluted shaft: round shading across each block, flutes every 3 px, drum joints every 24 px
  const lx = wrapT(x) % 12, ly = wrapT(y) % 24, u = (lx + 0.5) / 12;
  let v = 4.2 - u * 2.6 - Math.pow(Math.abs(u - 0.4) * 2, 3) * 0.9 + cg(x, y, 1651) * 0.4 + cn(x, y, 30, 60, 1652) * 0.5;
  if (lx % 3 === 2) v -= 0.9; else if (lx % 3 === 0) v += 0.3;
  if (ly === 23) v = 0.7; else if (ly === 0) v += 0.6;
  if (hash2(x, y, 1653) < 0.025) v -= 1.1;
  return v;
}
function vTijolo(x, y) {   // small old bricks, worn soft, a few lost
  const b = bond(x, y, 4, [8], 1661), { lx, ly, id } = b;
  if (ly === 3 || lx === 7) return 0.45 + cg(x, y, 1662) * 0.5;
  if (id < 0.05) return 0.8 + cg(x, y, 1663) * 0.4;
  let v = 2.7 + (id - 0.5) * 1.3 + cg(x, y, 1664) * 0.7 + cn(x, y, 36, 36, 1665) * 0.6;
  if (ly === 0) v += 0.8; else if (ly === 2) v -= 0.5; if (lx === 0) v += 0.3; else if (lx === 6) v -= 0.4;
  return v;
}
function vArdosia2(x, y) {   // fish-scale slates of the vault
  const rh = 6, r = Math.floor(y / rh), ly = y - r * rh, off = (r & 1) * 3, lx = wrapT(x + off) % 6, id = hash2(Math.floor(wrapT(x + off) / 6), r % 40, 1671);
  const edge = ly + Math.pow(Math.abs(lx - 2.5) / 2.5, 2) * 2.2;
  if (edge > 5.2) return 0.3;
  let v = 3.1 - ly * 0.35 + (id - 0.5) * 1.0 + cg(x, y, 1672) * 0.5;
  if (lx === 0) v += 0.4; else if (lx === 5) v -= 0.4;
  if (edge > 4.4) v -= 0.8;
  return v;
}

/* ---- back walls only ---- */
// cracked plaster over the stone, stained and fallen off in places so the masonry shows (the painted frescoes are props)
function vReboco(x, y) {
  const fell = cn(x, y, 12, 12, 1701) + cn(x, y, 40, 40, 1702) * 0.5;
  if (fell > 0.22) { const b = bond(x, y, 6, [12, 18], 1703); return dressed(b, 6, x, y, 1704, { base: 2.4, tone: 0.8 }) - (fell < 0.24 ? 1.0 : 0); }
  let v = 3.1 + cn(x, y, 30, 30, 1705) * 0.9 + cg(x, y, 1706) * 0.45;
  if (fell > 0.19) v += 1.1;                                                                 // the broken rim of the plaster
  if (Math.abs(cn(x, y, 22, 22, 1707)) < 0.01) v -= 1.6;                                   // hairline cracks
  const st = cn(x, y, 30, 6, 1708); if (st > 0.22) v -= (st - 0.22) * 5;                    // damp streaks
  return v;
}
// dark wood wainscot: stiles and rails framing raised panels 24 x 36
function vPainel(x, y) {
  const lx = wrapT(x) % 24, ly = wrapT(y) % 36;
  const grainV = cn(x, y, 120, 8, 1721) * 1.3 + cg(x, y, 1722) * 0.3;
  if (lx < 3 || ly < 3) { const e = lx < 3 ? lx : ly; return 2.8 + (e === 0 ? 0.9 : e === 2 ? -1.2 : 0) + (lx < 3 ? grainV : cn(x, y, 8, 120, 1723) * 1.3); }
  const ix = lx - 3, iy = ly - 3, W = 21, H = 33;
  if (ix === 0 || iy === 0) return 0.6;
  const bev = Math.min(ix, iy, W - 1 - ix, H - 1 - iy);
  if (bev < 3) return 2.6 + (ix < 3 && ix <= iy ? 1.0 : iy < 3 ? 1.2 : -0.9) + grainV;     // the bevel around the raised field
  return 3.0 + grainV + (hash2(x >> 2, y >> 3, 1724) < 0.04 ? -1.5 : 0);
}
// a blind arcade: slim shafts carrying pointed arches, 48 wide and 120 tall
function arcH(x, y) {
  const lx = wrapT(x) % 48, ly = wrapT(y) % 120;
  if (lx < 5) return lx === 0 ? 0.6 : lx === 4 ? 1.0 : 1.7;
  if (ly > 106) return ly === 107 ? 1.7 : 1.2;
  const L = 7, R = 45, sp = 44, rad = R - L;
  const inA = m => ly >= sp ? lx >= L - m && lx <= R + m : Math.hypot(lx - R, ly - sp) < rad + m && Math.hypot(lx - L, ly - sp) < rad + m;
  if (inA(0)) return 0.35;
  if (inA(3)) return 1.7;
  return 1.2;
}
function vArcada(x, y) {
  const h = arcH(x, y), b = bond(x, y, 6, [12, 18], 1731);
  let v = h > 1 ? dressed(b, 6, x, y, 1732, { base: 2.9, tone: 0.8 }) + (h > 1.5 ? 0.5 : 0) : 2.2 + cg(x, y, 1733) * 0.5 + cn(x, y, 30, 30, 1734) * 0.7;
  return v + relief(arcH, x, y, 1.6);
}
function vPainelMarmore(x, y) {   // tall marble panels in dark frames
  const lx = wrapT(x) % 24, ly = wrapT(y) % 40;
  if (lx < 3 || ly < 3) { const e = Math.min(lx, ly); return 2.2 + (e === 0 ? 1 : e === 2 ? -0.9 : 0.2) + cg(x, y, 1741) * 0.4; }
  const [v, k] = marbleV(x, y, 1742, 240); return v - (k === 2 ? 1.6 : k === 1 ? 0.7 : 0) - (lx === 3 || ly === 3 ? 1 : 0);
}

/* ---- the far layer (DEEPT) ---- */
function vDpAlvenaria(x, y) {   // enormous far blocks with deep joints
  const b = bond(x, y, 24, [48, 36, 36], 1801), { lx, ly, w, id } = b;
  if (ly >= 22 || lx >= w - 2) return 0.2 + cg(x, y, 1802) * 0.4;
  let v = 2.6 + (id - 0.5) * 1.0 + cn(x, y, 30, 30, 1803) * 0.9 + cg(x, y, 1804) * 0.5;
  if (ly < 2) v += 0.9; else if (lx < 2) v += 0.4; if (ly > 19) v -= 0.8;
  return v;
}
function vDpAbobada(x, y) {   // voussoirs fanning around arch centres every 120 px, and the ribs between
  const cx = Math.floor(wrapT(x) / 120) * 120 + 60, cy = Math.floor(wrapT(y) / 120) * 120 + 120, dx = wrapT(x) - cx, dy = wrapT(y) - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  const ring = Math.floor(r / 16), lr = r - ring * 16, seg = Math.floor((a + Math.PI) / (Math.PI / (8 + ring * 3))), la = ((a + Math.PI) / (Math.PI / (8 + ring * 3))) % 1;
  if (lr < 1.2 || la < 0.08) return 0.3;
  let v = 2.5 + (hash2(seg, ring, 1811) - 0.5) * 1.1 + cg(x, y, 1812) * 0.5 + cn(x, y, 30, 30, 1813) * 0.6;
  if (lr < 3) v += 0.9; else if (lr > 13) v -= 0.6;
  if (ring % 3 === 2) v += 0.6;   // a rib
  return v;
}
function vDpCalcario(x, y) { return vCalcario(x, y) * 0.9 + 0.2; }
function vDpCripta(x, y) {   // rows of burial niches seen far off: arched black holes in coarse stone, 24 x 24
  const lx = wrapT(x) % 24, ly = wrapT(y) % 24, inN = lx >= 4 && lx <= 19 && ly >= 6 && ly <= 20 && (ly >= 11 || Math.hypot(lx - 11.5, ly - 11) < 8);
  if (inN) return ly > 18 ? 1.0 : 0.05 + (lx < 6 ? 0.4 : 0);
  let v = 2.5 + cn(x, y, 40, 40, 1821) * 1.0 + cg(x, y, 1822) * 0.6;
  if (ly === 23) v -= 1.2; if (ly === 21) v += 0.8;
  return v;
}

/* ---- bake and register ---- */
const BKC = {
  calcario: bake(vCalcario), calcTerra: bake(vCalcTerra), cantaria: bake(vCantaria), laje: bake(vLaje), mosaico: bake(vMosaico), ruina: bake(vRuina),
  escombro: bake(vEscombro), cripta: bake(vCripta), ossario: bake(vOssario), marmore: bake(vMarmore), marmoreNegro: bake(vMarmoreNegro), friso: bake(vFriso),
  lapide: bake(vLapide), musgo: bake(vMusgo), pilastra: bake(vPilastra), tijolo: bake(vTijolo), ardosia: bake(vArdosia2),
  reboco: bake(vReboco), painel: bake(vPainel), arcada: bake(vArcada), painelMarmore: bake(vPainelMarmore),
  dpAlvenaria: bake(vDpAlvenaria), dpAbobada: bake(vDpAbobada), dpCalcario: bake(vDpCalcario), dpCripta: bake(vDpCripta)
};
const CAT_SOLID = [
  // id, palette, texture, dig, map colour
  [CT_CALCARIO, 'calcario', 'calcario', 0.55, '#8a8378'], [CT_CALC_TERRA, 'calcario', 'calcTerra', 0.4, '#7a6a58'], [CT_CANTARIA, 'cantaria', 'cantaria', 0.9, '#b9b3a7'],
  [CT_LAJE, 'laje', 'laje', 0.9, '#aba291'], [CT_MOSAICO, 'marmore', 'mosaico', 0.9, '#8a857e'], [CT_RUINA, 'ruina', 'ruina', 0.7, '#7e7970'],
  [CT_ESCOMBRO, 'escombro', 'escombro', 0.45, '#716c63'], [CT_CRIPTA, 'cripta', 'cripta', 1.0, '#3a3640'], [CT_OSSARIO, 'osso', 'ossario', 0.6, '#a09078'],
  [CT_MARMORE_NEGRO, 'marmoreNegro', 'marmoreNegro', 1.1, '#2f2b34'], [CT_FRISO, 'cantaria', 'friso', 0.9, '#b0aa9e'], [CT_LAPIDE, 'lapide', 'lapide', 0.9, '#7c7c84'],
  [CT_MUSGO, 'cantaria', 'musgo', 0.7, '#6e7a5a'], [CT_MARMORE, 'marmore', 'marmore', 1.0, '#cac4b8'], [CT_PILASTRA, 'cantaria', 'pilastra', 0.9, '#b5afa2'],
  [CT_TIJOLO, 'tijolo', 'tijolo', 0.7, '#6a5650'], [CT_ARDOSIA, 'ardosia', 'ardosia', 0.8, '#3b4250']
];
for (const [t, p, k, dig, col] of CAT_SOLID) { MAT[t] = [PALS[p], BKC[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
// only the natural rock blends its border into dirt and ore; worked stone keeps clean edges
BLEND[CT_CALCARIO] = 1; BLEND[CT_CALC_TERRA] = 1;

WMAT[WCT_CALCARIO] = [PALS.calcarioW, BKC.calcario]; WMAT[WCT_CANTARIA] = [PALS.cantariaW, BKC.cantaria]; WMAT[WCT_REBOCO] = [PALS.rebocoW, BKC.reboco];
WMAT[WCT_PAINEL] = [PALS.painelW, BKC.painel]; WMAT[WCT_CRIPTA] = [PALS.criptaW, BKC.cripta]; WMAT[WCT_OSSARIO] = [PALS.ossoW, BKC.ossario];
WMAT[WCT_ARCADA] = [PALS.cantariaW, BKC.arcada]; WMAT[WCT_MARMORE] = [PALS.marmoreW, BKC.painelMarmore];

DMAT[DP_CT_ALVENARIA] = [PALS.dpAlvenaria, BKC.dpAlvenaria]; DMAT[DP_CT_ABOBADA] = [PALS.dpAbobada, BKC.dpAbobada];
DMAT[DP_CT_CALCARIO] = [PALS.dpCalcario, BKC.dpCalcario]; DMAT[DP_CT_CRIPTA] = [PALS.dpCripta, BKC.dpCripta];

/* ---- ores sit in limestone now (crystal in crypt stone), so a vein isn't ringed with grey cave rock ---- */
for (const t of [COAL, COPPER, IRON, GOLD]) { ORE_HALO[t].pal[0] = 'calcario'; MAT[t] = [PALS.calcario, bakeOre(t, vCalcario)]; }
ORE_HALO[CRYSTAL].pal[0] = 'cripta'; MAT[CRYSTAL] = [PALS.cripta, bakeOre(CRYSTAL, vCripta)];

/* ---- block items ---- */
const CAT_ITEMS = {
  calcario: ['Calcário', CT_CALCARIO, 'Pedra clara e macia que envolve a catedral.'],
  cantaria: ['Cantaria', CT_CANTARIA, 'Bloco lavrado pelos pedreiros da catedral.'],
  laje: ['Laje', CT_LAJE, 'Laje de piso, gasta por séculos de passos.'],
  mosaico: ['Mosaico', CT_MOSAICO, 'Xadrez de mármore claro e escuro com friso.'],
  pedra_cripta: ['Pedra da Cripta', CT_CRIPTA, 'Alvenaria fria das criptas.'],
  marmore_negro: ['Mármore Negro', CT_MARMORE_NEGRO, 'Mármore escuro dos degraus do altar.'],
  marmore: ['Mármore', CT_MARMORE, 'Mármore branco com veios cinzentos.'],
  friso: ['Friso', CT_FRISO, 'Faixa de pedra com rosáceas entalhadas.'],
  pilastra: ['Pilastra', CT_PILASTRA, 'Fuste canelado de pedra clara.'],
  tijolo_velho: ['Tijolo Velho', CT_TIJOLO, 'Tijolo miúdo, gasto e macio.'],
  ardosia: ['Ardósia', CT_ARDOSIA, 'Telhas de ardósia em escama.']
};
for (const id in CAT_ITEMS) { const [name, block, desc] = CAT_ITEMS[id]; ITEMS[id] = { name, rar: 0, stack: 99, block, desc }; BLOCK_DROP[block] = id; }
BLOCK_DROP[CT_CALC_TERRA] = 'calcario'; BLOCK_DROP[CT_ESCOMBRO] = 'calcario'; BLOCK_DROP[CT_RUINA] = 'cantaria'; BLOCK_DROP[CT_MUSGO] = 'cantaria';
BLOCK_DROP[CT_LAPIDE] = 'pedra_cripta'; BLOCK_DROP[CT_OSSARIO] = 'osso';

/* ================= decorations: 12x12 sprites on ramps ================= */
const DR = {   // ramps as packed colours
  pedra: ['#2a2724', '#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3'],
  osso: ['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6'],
  raiz: ['#170e08', '#2a1a10', '#43301e', '#5e4630', '#7a5e42'],
  cera: ['#3a3226', '#6a5e48', '#a09276', '#cfc2a2', '#ece2c8', '#fff6e2'],
  ferro: ['#0c0c0f', '#141418', '#24252b', '#383a42', '#50535d', '#6e727e', '#9298a4'],
  ferrugem: ['#2a140a', '#4a2412', '#6e3a1c', '#8e5228'],
  teia: ['#4a4a52', '#7a7a84', '#a8a8b2', '#d4d4dc']
};
for (const k in DR) DR[k] = DR[k].map(h => ph(h));
const dPix = (R, v) => R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0];
// paint a 12x12 sprite: fn(x, y) returns a packed colour or 0; outline adds a dark rim where the shape meets air
function dSprite(fn, outline) {
  const a = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) a[y * T + x] = fn(x, y) || 0;
  if (outline) { const o = ph(outline), b = a.slice(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (b[k]) continue; if ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]) || (y < T - 1 && b[k + T])) a[k] = o; } }
  return a;
}
const dFlip = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[y * T + T - 1 - x]; return b; };

/* column: base, fluted shaft, capital (and a cracked shaft), 10 px wide so it stands proud of the wall */
function colShaft(x, y, crack) {
  if (x < 1 || x > 10) return 0;
  const u = (x - 0.5) / 10, R = DR.pedra;
  let v = 5.0 - u * 3.3 - Math.pow(Math.abs(u - 0.35) * 2, 3) * 0.8 + cg(x, y, 1901) * 0.5;
  if ((x - 1) % 3 === 2) v -= 1.1; else if ((x - 1) % 3 === 0) v += 0.3;
  if (x === 1 || x === 10) v = 0.5;
  if (crack && Math.abs(x - 3 - y * 0.55 - (y > 6 ? (y - 6) * -0.9 : 0)) < 0.6) v = 0.3;
  return dPix(R, v);
}
const COL_BASE = dSprite((x, y) => {   // plinth, a torus moulding, the foot of the shaft
  const R = DR.pedra;
  if (y >= 8) { if (x < 0 || x > 11) return 0; return dPix(R, y === 8 ? 5.5 : y === 11 ? 1 : 3.4 - x * 0.16 + cg(x, y, 1902) * 0.5 - (x === 11 ? 1.5 : 0)); }   // plinth
  if (y >= 5) { const w = y === 6 ? 0 : 1; if (x < w || x > 11 - w) return 0; return dPix(R, (y === 5 ? 5.2 : y === 6 ? 4.2 : 2.3) - x * 0.18 + cg(x, y, 1903) * 0.4); }   // torus
  return colShaft(x, y);
});
const COL_SHAFT = dSprite((x, y) => colShaft(x, y)), COL_SHAFT_CRACK = dSprite((x, y) => colShaft(x, y, 1));
const COL_CAP = dSprite((x, y) => {   // a capital of curling leaves under a square abacus
  const R = DR.pedra;
  if (y <= 2) return dPix(R, (y === 0 ? 5.5 : y === 2 ? 1.5 : 3.6) - x * 0.15 + cg(x, y, 1904) * 0.4);    // abacus
  if (y <= 8) {
    const w = Math.round((y - 3) * 0.5); if (x < w || x > 11 - w) return 0;
    const leaf = Math.floor(x / 4), lx = x % 4, ly = y - 3, curl = ly < 2 && (lx === 0 || lx === 3);
    let v = 4.2 - x * 0.2 - ly * 0.3 + (lx === 1 ? 0.8 : lx === 3 ? -0.9 : 0) + cg(x, y, 1905 + leaf) * 0.4; if (curl) v += 1;
    return dPix(R, v);
  }
  if (y === 9) return x >= 1 && x <= 10 ? dPix(R, 1.2) : 0;   // necking
  return colShaft(x, y);
});

/* roots hanging from the ceiling of the atrium: two middles and a tapering tip */
function rootSprite(s, tip) {
  const a = new Uint32Array(T * T);
  const strand = (x0, w0, ph0, k) => {
    for (let y = 0; y < T; y++) {
      const w = tip ? w0 * Math.max(0, 1 - y / (k ? 7 : 11.5)) : w0, cx = x0 + Math.sin((y + ph0) * 0.55) * 1.2;
      if (w < 0.4) break;
      for (let x = Math.floor(cx - w / 2); x <= Math.ceil(cx + w / 2); x++) {
        if (x < 0 || x >= T) continue; const d = (x + 0.5 - cx) / (w / 2 + 0.01); if (Math.abs(d) > 1) continue;
        a[y * T + x] = dPix(DR.raiz, 3.4 - (d + 1) * 1.3 + cg(x, y, s + k) * 0.7 + (hash2(x, y >> 1, s + 9) < 0.15 ? -1 : 0));
      }
    }
  };
  strand(3.5 + hash2(s, 1, 1911) * 2, 3.2, s * 3, 0);
  if (hash2(s, 2, 1912) < 0.8) strand(8.5 + hash2(s, 3, 1911), 1.8, s * 5 + 2, 1);
  if (tip) for (let y = 5; y < 9; y++) { const x = Math.round(5.5 + (y - 5) * 0.8 + hash2(s, 4, 1913)); if (x < T && !a[y * T + x]) a[y * T + x] = dPix(DR.raiz, 2); }   // a rootlet
  const b = a.slice(), o = DR.raiz[0]; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y < T - 1 && b[k + T] && y > 0))) a[k] = o; }
  return a;
}
const RAIZ = [rootSprite(1, 0), rootSprite(2, 0), rootSprite(3, 1)];

/* broken stained glass lying on the floor */
const GLASS = [['#5a1418', '#8a2228', '#b8403a'], ['#162a5a', '#23428a', '#3e66b8'], ['#6a4410', '#a06c1a', '#d8a03a'], ['#163a22', '#23603a', '#3e8a56'], ['#2a1840', '#46286a', '#6a46a0']].map(r => r.map(h => ph(h)));
function shardsSprite(s) {
  const a = new Uint32Array(T * T);
  for (let i = 0; i < 7; i++) {
    const x0 = 1 + (hash2(s, i, 1921) * 9 | 0), y0 = 9 + (hash2(s, i, 1922) * 2 | 0), g = GLASS[hash2(s, i, 1923) * 5 | 0], big = hash2(s, i, 1924) < 0.4;
    a[y0 * T + x0] = g[1]; if (big) { a[y0 * T + x0 + 1] = g[0]; if (y0 > 9) a[(y0 - 1) * T + x0] = g[2]; } else if (hash2(s, i, 1925) < 0.5) a[(y0 + 1 > 11 ? y0 : y0 + 1) * T + x0] = g[0];
    if (hash2(s, i, 1926) < 0.3) a[y0 * T + x0] = ph('#141214');   // a scrap of lead came
  }
  a[11 * T + 2 + (s % 3) * 3] = GLASS[s % 5][2];   // a glint
  return a;
}
const CACOS = [shardsSprite(1), shardsSprite(2)];

/* small piles of skulls */
function skullAt(a, cx, by, s, tone) {
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const px = cx + x, py = by - 4 + y; if (px < 0 || px >= T || py < 0 || py >= T) continue;
    const dx = x - 2, dy = y - 1.6, inS = dx * dx / 6.2 + dy * dy / 5 < 1 || (y >= 3 && Math.abs(dx) <= 1.2);
    if (!inS) continue;
    let v = 4.4 + tone - (dx + dy) * 0.5 + cg(px, py, s) * 0.5; if (y === 2 && (x === 1 || x === 3)) v = 0.4; if (y === 4 && (x & 1)) v = 1.6;
    a[py * T + px] = dPix(DR.osso, v);
  }
}
function skullPile(s) {
  const a = new Uint32Array(T * T);
  for (let x = 0; x < T; x++) { if (hash2(s, x, 1931) < 0.7) a[11 * T + x] = dPix(DR.osso, 2 + hash2(s, x, 1932) * 2); }   // bone litter
  if (s === 1) { skullAt(a, 0, 11, s, -0.4); skullAt(a, 6, 11, s + 1, 0); skullAt(a, 3, 8, s + 2, 0.4); }
  else { skullAt(a, 1, 11, s, 0.2); a[10 * T + 7] = dPix(DR.osso, 4); a[10 * T + 8] = dPix(DR.osso, 4.5); a[10 * T + 9] = dPix(DR.osso, 4); a[9 * T + 9] = dPix(DR.osso, 5); a[11 * T + 9] = dPix(DR.osso, 2); a[10 * T + 10] = dPix(DR.osso, 3); }
  const b = a.slice(), o = ph('#141010'); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]))) a[k] = o; }
  return a;
}
const CRANIOS = [skullPile(1), skullPile(2)];

/* melted candles on the floor: stubs of different heights in a puddle of old wax. The flames are not painted:
   VELAS_PAVIOS lists, per variation, the pixel above each wick where the flame goes */
function candleSprite(i) {
  const a = new Uint32Array(T * T), wicks = VELAS_PAVIOS[i];
  for (let x = 0; x < T; x++) for (let y = 10; y < 12; y++) if (Math.abs(x - 5.5) < (y === 11 ? 5.8 : 4.6)) a[y * T + x] = dPix(DR.cera, (y === 10 ? 3.4 : 2.2) - x * 0.12 + cg(x, y, 1941) * 0.6);   // the wax puddle
  for (const [wx, wy] of wicks) {
    const top = wy + 1;
    for (let y = top + 1; y < 11; y++) for (let x = wx - 1; x <= wx + 1; x++) { if (x < 0 || x >= T) continue; let v = x === wx - 1 ? 4.6 : x === wx ? 3.7 : 2.3; if (y === top + 1) v += 0.6; v += cg(x, y, 1942) * 0.4; a[y * T + x] = dPix(DR.cera, v); }
    a[(top + 2) * T + wx + 1] = dPix(DR.cera, 4.2); if (top + 4 < 11) a[(top + 4) * T + wx - 1] = dPix(DR.cera, 5);   // drips
    a[top * T + wx] = ph('#1c140c');   // the wick
  }
  return a;
}
const VELAS = [candleSprite(0), candleSprite(1)];

/* thick corner web: anchored in the top-left corner (the second one is mirrored for the other side) */
const TEIA_A = (() => {
  const a = new Uint32Array(T * T), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = dPix(DR.teia, v); };
  const spokes = [0.05, 0.42, 0.82, 1.2, 1.52];
  for (const an of spokes) for (let r = 0; r < 12; r += 0.5) { const x = Math.round(Math.cos(an) * r), y = Math.round(Math.sin(an) * r); if (hash2(x, y, 1951) < 0.95) set(x, y, 3 - r * 0.12); }
  for (let ring = 2.6; ring < 11; ring += 2.4) for (let i = 0; i < spokes.length - 1; i++) {   // threads sagging between the spokes
    for (let k = 0; k <= 8; k++) { const t = k / 8, an = spokes[i] + (spokes[i + 1] - spokes[i]) * t, r = ring - Math.sin(t * Math.PI) * 0.7; set(Math.round(Math.cos(an) * r), Math.round(Math.sin(an) * r), 2.4 - ring * 0.08); }
  }
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3 - y; x++) set(x, y, 2.6);   // the matted corner
  return a;
})();
const TEIA = [TEIA_A, dFlip(TEIA_A)];

/* iron grate: a diamond lattice with rivets and rust, the back wall shows through the holes (SEETHRU) */
function grateSprite(s) {
  return dSprite((x, y) => {
    const d1 = (x + y) % 6, d2 = (x - y + 12) % 6;
    if (d1 === 0 || d2 === 0) {
      let v = d1 === 0 ? 4.4 : 3.2; if (d1 === 0 && d2 === 0) v = 6;   // rivet where the bars cross
      if (hash2(x, y, s) < 0.18) return dPix(DR.ferrugem, 1 + hash2(x, y, s + 1) * 3);
      return dPix(DR.ferro, v + cg(x, y, s + 2) * 0.6);
    }
    return 0;
  });
}
const GRADE = [grateSprite(1961), grateSprite(1971)];

DECO[CT_COLUNA] = [COL_BASE, COL_SHAFT, COL_CAP, COL_SHAFT_CRACK];   // [base, fuste, capitel, fuste rachado]
DECO[CT_RAIZ] = RAIZ;                                                   // [meio, meio, ponta]
DECO[CT_CACOS] = CACOS;
DECO[CT_CRANIOS] = CRANIOS;
DECO[CT_VELAS] = VELAS;
DECO[CT_TEIA] = TEIA;                                                   // [canto esquerdo, canto direito]
DECO[CT_GRADE] = GRADE;
SOLID[CT_GRADE] = 1; DIG[CT_GRADE] = 1.0; PCOL[CT_GRADE] = '#50535d';
DIG[CT_COLUNA] = 0.6; DIG[CT_RAIZ] = 0.05; DIG[CT_CACOS] = 0.03; DIG[CT_CRANIOS] = 0.05; DIG[CT_VELAS] = 0.08; DIG[CT_TEIA] = 0.03;
PCOL[CT_COLUNA] = '#b9b3a7'; PCOL[CT_RAIZ] = '#43301e'; PCOL[CT_CACOS] = '#46286a'; PCOL[CT_CRANIOS] = '#c0b298'; PCOL[CT_VELAS] = '#e6ca7a'; PCOL[CT_TEIA] = '#a8a8b2';
EMIT[CT_VELAS] = 0.7; WICKS[CT_VELAS] = VELAS_PAVIOS;
if (typeof SEETHRU !== 'undefined') SEETHRU[CT_GRADE] = 1;
if (typeof DECO_PICK !== 'undefined') {
  // roots: the lowest one in a hanging run ends in the tip
  DECO_PICK[CT_RAIZ] = (gx, gy, arr) => tileAt(gx, gy + 1) === CT_RAIZ ? arr[(hash2(gx, gy, 1981) * 2) | 0] : arr[2];
  // webs hug whichever side has the wall
  DECO_PICK[CT_TEIA] = (gx, gy, arr) => solidAt(gx - 1, gy) || !solidAt(gx + 1, gy) ? arr[0] : arr[1];
}
Object.assign(CATART, { cg, cn, wrapT, bond, dressed, relief, marbleV, frizeH, dPix, DR, GLASS, MOSS, skullAt, vCalcario });
}
