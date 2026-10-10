'use strict';

/* ================= a Floresta Petrificada: blocks, back walls, far layer, ores, geodes, decorations, light =================
   A forest the ground swallowed and turned to stone without letting it fall: hardened brown earth with fossil leaves
   pressed into it, stone bark in vertical furrows and plates, heartwood with pale growth rings and knots, green-grey
   granite full of grains, root stone of twisted fibre bundles, crystal foliage (cyan-green leaves you can see through),
   lime sap gone to glass with bubbles in it, mossy stone, crystal gravel, the boss clearing's giant trunks and the
   woven root wall that shuts it. Coal is fossil wood in the granite; platinum, the layer's metal, runs in pale cold
   veins; geode cores are a crust of crystal points that drop gems from the layer's row of the gem table.
   Like 80, 121 and 131, every material is a seamless 240x240 texture sampled in world pixels; outline, lit edge,
   shade and ambient occlusion come from 07-chunks-luz. Back walls and the far layer only read the tone (.v).
   The one-block decorations (fallen crystal leaves, a crystal sprout, a stone vine and root steps you can climb, a
   sap stalactite, a stone fern, stone pine cones, a crystal pendant, petrified bones, a stump, a lit drusa, a nest
   of stone twigs) are 12x12 sprites on ramps lit from the top left.
   Light: the crystal foliage lets light through like air with a small loss and its canopies wake up when a strong
   light passes near (propLights is wrapped: it runs inside computeLight, after the light sources and before the
   spread, so it just rewrites the loss of the clear tiles; nothing allocated per frame). Glows are cold and cheap.
   Ids: 140-floresta-api. */
const FPART = {};   // helpers shared with 142-floresta-objetos, the beasts (143, 144) and the boss (146)
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- palettes: 6 shades, dark to light (card section 12 where it gives one) ---- */
pal('fpSolo', ['#18120d', '#2a2019', '#3d3025', '#524132', '#6a5642', '#846e56']);
pal('fpCasca', ['#221c18', '#3a3028', '#54463a', '#6e5e4e', '#8c7a66', '#ae9a84']);
pal('fpCerne', ['#2e2a22', '#4a4436', '#6a614c', '#8c8266', '#b0a688', '#d2caae']);
pal('fpGranito', ['#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a']);
pal('fpRaiz', ['#1e1814', '#33291f', '#4c3e2e', '#665440', '#836e56', '#a48c72']);
pal('fpCristal', ['#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec']);
pal('fpSeiva', ['#2a3010', '#4a5418', '#6e7c22', '#9aa83a', '#c4cc6a', '#e6ecac']);
pal('fpCascalho', ['#1a201c', '#29332d', '#3a473f', '#4e5e53', '#66786b', '#849686']);
pal('fpTroncoG', ['#18140f', '#2a231c', '#3e342a', '#54473a', '#6e5e4d', '#8c7a66']);
pal('fpBarreira', ['#120d0a', '#221a13', '#36291e', '#4a3a2a', '#614c38', '#7a634a']);
// back walls: always far darker than the ground in front
pal('fpSoloW', ['#090706', '#0d0b09', '#12100c', '#171410', '#1d1914', '#231e18']);
pal('fpGranitoW', ['#070908', '#0b0e0c', '#0f1310', '#141914', '#1a1f1a', '#202720']);
pal('fpCascaW', ['#0a0807', '#0f0c0a', '#14110e', '#1a1612', '#201b16', '#27211b']);
pal('fpRaizW', ['#090706', '#0e0b08', '#130f0c', '#191410', '#1f1914', '#261f18']);
pal('fpCristalW', ['#08090a', '#0c0f10', '#111516', '#161b1c', '#1c2223', '#232a2a']);
// the far layer; the canopies' top shade is a still glint of crystal far off
pal('dpFpTroncos', ['#070808', '#0d0f0d', '#141814', '#1b201b', '#232a24', '#2c342d']);
pal('dpFpCopas', ['#030506', '#06090a', '#0a0f10', '#0e1517', '#131c1e', '#3a6a68']);
pal('dpFpRaizes', ['#060504', '#0a0807', '#0f0c0a', '#15110e', '#1b1612', '#221c17']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;   // sines in x or y must use whole multiples of this to stay seamless
const RAMPX = hexes => hexes.map(h => ph(h));
const FOSS = RAMPX(['#1a120c', '#2c1f14', '#43301e', '#5e4429', '#7a5a36', '#977446']);   // a fossil leaf in the earth
const CRYS = RAMPX(['#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec']);   // crystal chips and flecks
const SEIV = RAMPX(['#2a3010', '#4a5418', '#6e7c22', '#9aa83a', '#c4cc6a', '#e6ecac']);
const PEBF = RAMPX(['#2a241e', '#4a4238', '#665c50', '#857a6a']);
const MOSS = RAMPX(['#18201a', '#243026', '#334234', '#435642', '#566a50', '#6c8062']);   // stone moss: muted, never vivid
const GRAN = RAMPX(['#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a']);
const clampR = (R, l) => R[l < 0 ? 0 : l > R.length - 1 ? R.length - 1 : Math.round(l)];
// a pointed leaf (lanceolate) along u: half length L, half width W
const leafIn = (u, w, L, W) => Math.abs(u) < L && Math.abs(w) < W * (1 - (u / L) * (u / L));

/* ---- solid ground ---- */
const fossil = (ox, oy, id) => { const a = id * 53, ca = Math.cos(a), sa = Math.sin(a), L = 4 + id * 7, u = ox * ca + oy * sa, w = -ox * sa + oy * ca; return [u, w, L, L * 0.42]; };
function vSolo(x, y) {   // hardened earth in thin strata, fossil leaves pressed into it (lit lip on the lower right of each hollow), pebbles of granite
  let v = 2.5 + Math.sin(y * W2 * 16 + cn(x, y, 6, 6, 14102) * 8) * 0.35 + cn(x, y, 30, 30, 14103) * 1.3 + cn(x, y, 110, 110, 14104) * 0.6 + cg(x, y, 14105) * 0.7;
  const c = cells(x, y, 18, 14106, 1);
  if (c.id < 0.4) {
    const [u, w, L, W] = fossil(c.ox, c.oy, c.id);
    if (leafIn(u, w, L, W)) {
      const [u1, w1] = fossil(c.ox + 1, c.oy + 1, c.id), [u0, w0] = fossil(c.ox - 1, c.oy - 1, c.id);
      const lit = !leafIn(u1, w1, L, W), sh = !leafIn(u0, w0, L, W), rib = Math.abs(w) < 0.55, vein = ((Math.abs(u) + Math.abs(w) * 1.3) % 2.2) < 0.55;
      MATX = clampR(FOSS, 2.1 + (lit ? 1.5 : 0) - (sh ? 1.5 : 0) + (rib ? 1.1 : 0) + (vein ? 0.5 : 0) + cg(x, y, 14107) * 0.5); return -9;
    }
    if (u < -L && u > -L - 2.4 && Math.abs(w) < 0.5) { MATX = FOSS[1]; return -9; }                     // the stalk
  }
  const p = cells(x, y, 7, 14108);
  if (p.id < 0.06 && p.d1 < 1.4) { MATX = PEBF[p.ox + p.oy < -0.3 ? 3 : p.ox + p.oy > 0.4 ? 0 : 1]; return -9; }
  const cr = Math.abs(cn(x, y, 14, 40, 14109)); if (cr < 0.005) return 0.5; if (Math.abs(cn(x, y - 1, 14, 40, 14109)) < 0.005) v += 0.8;   // compaction cracks
  if (hash2(x, y, 14110) < 0.04) v -= 1.2;
  return v;
}
// stone bark: ridges a column of sp px wide wandering left and right, deep furrows between, each ridge cut into plates
function barkV(x, y, sp, amp, s, deep) {
  const sx = wrapT(x + cn(x, y, 10, 3, s) * amp + cn(x, y, 30, 12, s + 1) * amp * 0.25), col = Math.floor(sx / sp), lx = sx - col * sp, hc = hash2(col, 0, s + 2), f = sp / 8;
  let v;
  if (lx < 1.3 * f) return 0.35 + lx / f * 0.45 * deep + cg(x, y, s + 3) * 0.2;                         // the furrow
  if (lx < 2.6 * f) v = 3.9; else if (lx < sp - 2.4 * f) v = 3.0; else v = 2.1 - (lx - (sp - 2.4 * f)) / f * 0.3;
  const PL = [20, 24, 30, 40][(hc * 4) | 0], py = Math.floor(wrapT(y + hc * 240)) % PL;
  if (py === 0) return 0.8; if (py === 1) v += 0.9; else if (py === PL - 1) v -= 0.6;                   // plates
  v += cn(x, y, 40, 40, s + 4) * 0.8 + cg(x, y, s + 5) * 0.45 + Math.sin(y * W2 * 60 + hc * 9) * 0.15;
  if (hash2(x, y, s + 6) < 0.03) v -= 1;
  const k = cells(x, y, 40, s + 7, 1.6);
  if (k.id < 0.12 && k.d1 < 4.6) { const r = k.d1 % 1.6; v = k.d1 < 1.3 ? 0.6 : r < 0.6 ? 1.3 : 3.2 - (k.ox + k.oy) * 0.12; }   // a knot, an eye in the bark
  return v;
}
const vCasca = (x, y) => barkV(x, y, 8, 22, 14111, 1);
const vTroncoG = (x, y) => { const v = barkV(x, y, 12, 30, 14121, 0.6); const m = cn(x, y, 8, 6, 14128); return m > 0.22 && v > 2 ? v - 0.6 : v; };   // older and darker, patches of dust
function vCerne(x, y) {   // heartwood: vertical grain in growth rings (pale early wood, dark late edge), knots with rings around them, drying checks
  const g = wrapT(x + cn(x, y, 4, 2, 14131) * 40 + cn(x, y, 12, 6, 14132) * 8), r = g % 6;
  let v;
  if (r < 1) v = 3.9 + cg(x, y, 14133) * 0.3; else if (r < 2) v = 1.2; else v = 2.0 + (r - 2) * 0.12 + cn(x, y, 30, 30, 14134) * 0.8 + cg(x, y, 14135) * 0.35;
  const k = cells(x, y, 40, 14136, 1.7);
  if (k.id < 0.2 && k.d1 < 3 + k.id * 16) { const rr = k.d1 % 1.8; v = k.d1 < 1.2 ? 0.8 : rr < 0.6 ? 4.2 : 2.2 - (k.ox + k.oy) * 0.08; }
  if (Math.abs(cn(x, y, 8, 30, 14137)) < 0.004) return 0.4;
  return v;
}
function vGranito(x, y) {   // granite: big slabs with bevelled joints, pale feldspar and dark mica grains, hairline cracks, a rare crystal fleck
  let v = 2.6 + cn(x, y, 30, 30, 14141) * 1.2 + cn(x, y, 90, 90, 14142) * 0.6 + cg(x, y, 14143) * 0.55;
  const c = cells(x, y, 30, 14144, 1.3), e = c.d2 - c.d1;
  if (e < 1.0) return 0.5 + cg(x, y, 14145) * 0.3;
  if (e < 2.2) v += c.ox + c.oy < 0 ? 0.9 : -0.8;
  v += (c.id - 0.5) * 0.8;
  const g = hash2(x >> 1, y >> 1, 14146), h = hash2(x, y, 14147);
  if (g < 0.05 || h < 0.025) v = 4.6 + cg(x, y, 14148) * 0.4; else if (g > 0.94 || h > 0.975) v = 0.9;
  if (h > 0.4 && h < 0.4022) { MATX = CRYS[h < 0.4011 ? 4 : 3]; return -9; }
  if (Math.abs(cn(x, y, 20, 20, 14149)) < 0.005) return 0.6;
  if (Math.abs(cn(x, y - 1, 20, 20, 14149)) < 0.005) v += 0.8;
  return v;
}
function vRaiz(x, y) {   // root stone: bundles of fibres twisting one way and the other, dark seams where the bundles meet, a bead of sap
  const b = cn(x, y, 6, 6, 14151), dir = b > 0 ? 1 : -1, u = x + cn(x, y, 6, 6, 14152) * 30 + dir * y * 0.5, r = wrapT(u) % 4;
  if (Math.abs(b) < 0.014) return 0.4;
  let v = r < 1 ? 1.0 : r < 2 ? 3.8 : r < 3 ? 3.0 : 2.2;
  if (Math.abs(b) < 0.03) v -= 0.9;
  v += cn(x, y, 24, 24, 14153) * 1.0 + cg(x, y, 14154) * 0.4;
  if (hash2(x, y, 14155) < 0.0015) { MATX = SEIV[3]; return -9; }
  return v;
}
function vFolha(x, y) {   // crystal foliage: pointed leaves at every angle, two facets and a pale ridge each, deep teal gaps that glow from inside
  const c = cells(x, y, 10, 14161, 1), a = c.id * 31.4, ca = Math.cos(a), sa = Math.sin(a), u = c.ox * ca + c.oy * sa, w = -c.ox * sa + c.oy * ca, L = 6.4, W = 2.6;
  if (!leafIn(u, w, L, W)) return 1.0 + cn(x, y, 20, 20, 14162) * 0.8 + cg(x, y, 14163) * 0.3 + (hash2(x, y, 14164) < 0.03 ? 1.1 : 0);
  const sd = w > 0 ? 1 : -1, ld = sd * 0.707 * (sa - ca);
  let v = 3.0 + ld * 1.2 + cn(x, y, 12, 12, 14165) * 0.5 + cg(x, y, 14166) * 0.3;
  if (Math.abs(w) < 0.45) v += 1.3;
  if (!leafIn(u, w + sd * 0.9, L, W)) v -= 0.9;                                                        // the rim
  if (Math.abs(u) > L - 1.2) v -= 0.3;
  if (hash2(x, y, 14167) < 0.012) v = 5.5;
  return v;
}
function vSeiva(x, y) {   // sap glass: smooth swirls, flow streaks, bubbles with a dark rim and a highlight, one long cold sheen
  let v = 1.8 + cn(x, y, 6, 6, 14171) * 1.3 + cn(x, y, 16, 16, 14172) * 0.5 + cg(x, y, 14173) * 0.12;
  if (Math.sin((x * 2 + y) * W2 * 3 + cn(x, y, 5, 5, 14174) * 7) > 0.85) v += 0.9;
  if (Math.sin((x + y) * W2 * 4 + cn(x, y, 4, 4, 14175) * 5) > 0.94) v += 1.6;
  const c = cells(x, y, 10, 14176, 1);
  if (c.id < 0.4) { const r = 0.8 + c.id * 7; if (c.d1 < r) { v = c.d1 > r - 0.9 && r > 1.6 ? 1.4 : 3.2; if (c.ox < -r * 0.25 && c.oy < -r * 0.25 && c.d1 < r * 0.75) v = 5.4; } }
  return v;
}
const mossM = (x, y) => cn(x, y, 10, 8, 14181) + cn(x, y, 30, 30, 14182) * 0.5;
function vMusgo(x, y) {   // mossy stone: the granite under lumpy pads of stone moss, lit on top, strands hanging, a shadow under each pad
  const m = mossM(x, y);
  if (m > 0.06) {
    const l = 2.3 + cn(x, y, 48, 48, 14183) * 2.2 + cg(x, y, 14184) * 1.4 + (m < 0.1 ? -0.8 : 0) + (mossM(x, y - 2) <= 0.06 ? 1.2 : 0);
    MATX = clampR(MOSS, l); return -9;
  }
  const hl = 1 + hash2(x, 0, 14185) * 5;
  for (let k = 1; k <= hl; k++) if (mossM(x, y - k) > 0.06) { if (hash2(x, 1, 14186) < 0.4) { MATX = MOSS[k < 2 ? 2 : 1]; return -9; } break; }
  const v = vGranito(x, y); if (v === -9) return -9;
  return mossM(x, y - 1) > 0.06 ? v - 1.1 : v;
}
function vCascalho(x, y) {   // crystal gravel: small granite pebbles lit from the top left, chips of crystal among them, dark gaps
  const c = cells(x, y, 5, 14191, 1.1), e = c.d2 - c.d1;
  if (e < 0.8) return 0.35 + cg(x, y, 14192) * 0.3;
  if (c.id < 0.16) { MATX = CRYS[c.d1 < 0.7 && c.id < 0.05 ? 5 : c.ox + c.oy < 0 ? (c.ox < c.oy ? 4 : 3) : 2]; return -9; }
  return 2.5 + (c.id - 0.5) * 1.4 - (c.ox + c.oy) * 0.22 + (e < 1.6 ? (c.ox + c.oy < 0 ? 0.6 : -0.6) : 0) + cg(x, y, 14193) * 0.45;
}
// the root wall: thick roots woven over and under each other, rounded, fibres along them, black gaps between
const BAR_H = [[20, 2, 1.2, 10, 12], [60, 1, 4.0, 14, 13], [100, 3, 2.2, 8, 11], [140, 2, 5.1, 12, 13], [180, 1, 0.7, 10, 12], [220, 2, 3.3, 8, 11]];   // [y, waves, phase, amplitude, half thickness]
const BAR_V = [[30, 1, 0.4, 16, 12], [90, 2, 3.1, 12, 11], [150, 1, 1.9, 14, 13], [210, 2, 5.0, 10, 11]];
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vBarreira(x, y) {
  let hr = null, vr = null;
  for (let k = 0; k < BAR_H.length && !hr; k++) { const [y0, n, p, A, th] = BAR_H[k], d = wrapD(y - (y0 + Math.sin(x * W2 * n + p) * A)); if (Math.abs(d) < th) hr = { q: d / th, along: x, o: k }; }
  for (let j = 0; j < BAR_V.length && !vr; j++) { const [x0, n, p, A, th] = BAR_V[j], d = wrapD(x - (x0 + Math.sin(y * W2 * n + p) * A)); if (Math.abs(d) < th) vr = { q: d / th, along: y, o: j }; }
  const flip = hr && vr && ((hr.o + vr.o) & 1), best = flip ? vr : hr || vr, under = hr && vr ? (flip ? hr : vr) : null;   // over and under, in turn
  if (!best) return 0.25 + cg(x, y, 14201) * 0.2;
  if (hash2(x, y, 14202) < 0.0025) { MATX = CRYS[4]; return -9; }
  const q = best.q;
  let v = 3.2 - q * 1.4 - q * q * 1.2 + Math.sin(best.along * W2 * 40 + q * 6 + best.o * 2) * 0.35 + cg(x, y, 14203) * 0.4 + cn(x, y, 20, 20, 14204) * 0.6;
  if (Math.abs(q) > 0.86) v = 0.6;
  if (under && Math.abs(q) > 0.7) v -= 0.6;
  return v;
}
function vGeodo(x, y) {   // the geode's core: a crust of crystal points, six faces each lit from the top left, a bright tip, dark seams
  const c = cells(x, y, 6, 14211, 1), e = c.d2 - c.d1;
  if (e < 0.7) return 0.5;
  const a = Math.atan2(c.oy, c.ox), fa = Math.round(a / (Math.PI / 3)) * Math.PI / 3;
  let v = 3.0 - (Math.cos(fa) + Math.sin(fa)) * 0.9 + (c.id - 0.5) * 1.0 - Math.min(c.d1, 4) * 0.15 + cg(x, y, 14212) * 0.2;
  if (c.d1 < 0.9) v = 5.3;
  if (hash2(x, y, 14213) < 0.006) v = 5.6;
  return Math.max(0.6, Math.min(5.6, v));
}

/* ---- back walls (tone only) ---- */
const vSoloW = (x, y) => { const v = vSolo(x, y); return v === -9 ? 1.4 + cg(x, y, 14221) * 0.4 : v; };
const vGranitoW = (x, y) => { const v = vGranito(x, y); return v === -9 ? 2.6 : v; };
const vCascaW = (x, y) => barkV(x, y, 8, 22, 14222, 1);
const vRaizW = (x, y) => { const v = vRaiz(x, y); return v === -9 ? 2.4 : v; };
function vCristalW(x, y) {   // dark matte crystal: broad flat faces, almost grey, no shine at all
  const c = cells(x, y, 10, 14231, 1.2), e = c.d2 - c.d1;
  if (e < 0.9) return 0.8 + cg(x, y, 14232) * 0.2;
  const a = Math.atan2(c.oy, c.ox), fa = Math.round(a / (Math.PI / 3)) * Math.PI / 3;
  return 2.6 - (Math.cos(fa) + Math.sin(fa)) * 0.45 + (c.id - 0.5) * 0.6 + cn(x, y, 20, 20, 14233) * 0.6 + cg(x, y, 14234) * 0.25;
}

/* ---- far layer ---- */
function vDpTroncos(x, y) {   // giant trunks far off, two rows deep, furrowed, fading into the dark in patches
  const haze = 0.9 + cn(x, y, 8, 4, 14241) * 0.5 + cg(x, y, 14242) * 0.2;
  const trunk = (off, slot, s, tone) => {
    const xx = wrapT(x + off), k = Math.floor(xx / slot), lx = xx - k * slot, cx = slot / 2 + (hash2(k, 0, s) - 0.5) * slot * 0.3, hw = slot * (0.14 + hash2(k, 1, s) * 0.2) + Math.sin(y * W2 * 2 + k) * 1.5, ux = lx - cx;
    if (Math.abs(ux) >= hw) return -1;
    const q = ux / hw;
    let v = tone + (q < -0.75 ? 0.8 : 0) - q * 0.5 - (q > 0.8 ? 0.6 : 0) + (Math.sin(ux * 1.4 + cn(x, y, 4, 2, s + 1) * 6) > 0.6 ? -0.5 : 0) + cg(x, y, s + 2) * 0.25;
    const fade = Math.min(1, Math.max(0, 0.5 + cn(x, y, 3, 4, s + 3) * 2.2));
    return haze + (v - haze) * fade;
  };
  const near = trunk(0, 60, 14243, 2.9); if (near >= 0) return near;
  const far = trunk(30, 40, 14247, 2.0); return far >= 0 ? far : haze;
}
function vDpCopas(x, y) {   // distant crystal canopies: lumpy crowns lit on top, still glints in them, thin trunks below
  const c = cells(x, y, 40, 14251, 1.5), r = 9 + c.id * 13 + cn(x, y, 24, 24, 14252) * 8;
  if (c.d1 < r) {
    if (hash2(x, y, 14253) < 0.006 && c.d1 < r - 2) return 5.5;
    return 1.7 - c.oy / r * 0.8 - c.ox / r * 0.3 + (c.d1 > r - 1.5 ? -0.5 : 0) + cn(x, y, 30, 30, 14254) * 0.6 + cg(x, y, 14255) * 0.25;
  }
  if (c.oy > 0 && Math.abs(c.ox + Math.sin(c.oy * 0.2) * 1.5) < 1.6 && c.oy < r + 30) return 1.4 + (c.ox < 0 ? 0.3 : 0);
  return 0.6 + cn(x, y, 10, 10, 14256) * 0.4 + cg(x, y, 14257) * 0.15;
}
const DPR = [[50, 1, 0.7, 38, 16, 0], [160, 2, 2.3, 26, 11, 0], [110, 1, 4.1, 50, 13, 1]];   // [centre, waves, phase, amplitude, half thickness, vertical]
function vDpRaizes(x, y) {   // huge roots crossing the background, rounded, fibres along them
  let v = 0.9 + cn(x, y, 12, 12, 14261) * 0.5 + cg(x, y, 14262) * 0.2;
  for (const [c0, n, p, A, th, vert] of DPR) {
    const a = vert ? y : x, b = vert ? x : y, d = wrapD(b - (c0 + Math.sin(a * W2 * n + p) * A)), q = d / th;
    if (Math.abs(q) < 1) v = (Math.abs(q) > 0.88 ? 0.7 : 2.6 - q * 1.1 - q * q * 0.9) + Math.sin(a * W2 * 30 + q * 5) * 0.3 + cg(x, y, 14263) * 0.25;
  }
  return v;
}

/* ---- bake and register ---- */
const BKV = {
  solo: bake(vSolo), casca: bake(vCasca), cerne: bake(vCerne), granito: bake(vGranito), raiz: bake(vRaiz), folha: bake(vFolha), seiva: bake(vSeiva),
  musgo: bake(vMusgo), cascalho: bake(vCascalho), troncoG: bake(vTroncoG), barreira: bake(vBarreira), geodo: bake(vGeodo),
  soloW: bake(vSoloW), granitoW: bake(vGranitoW), cascaW: bake(vCascaW), raizW: bake(vRaizW), cristalW: bake(vCristalW),
  dpTroncos: bake(vDpTroncos), dpCopas: bake(vDpCopas), dpRaizes: bake(vDpRaizes)
};
const FP_SOLIDS = [
  // id, palette, texture, dig, map colour (card section 11: Bosque, Mata, Raízes, Clareira; geodes #8ad8cc)
  [FP_SOLO, 'fpSolo', 'solo', 0.5, '#4a3e30'], [FP_CASCA, 'fpCasca', 'casca', 0.9, '#54463a'], [FP_CERNE, 'fpCerne', 'cerne', 1.0, '#8c8266'],
  [FP_GRANITO, 'fpGranito', 'granito', 1.05, '#3c5444'], [FP_RAIZ, 'fpRaiz', 'raiz', 0.85, '#4e5a2a'], [FP_FOLHA, 'fpCristal', 'folha', 0.08, '#3a7a78'],
  [FP_SEIVA, 'fpSeiva', 'seiva', 0.5, '#9aa83a'], [FP_MUSGO, 'fpGranito', 'musgo', 1.0, '#3e5044'], [FP_CASCALHO, 'fpCascalho', 'cascalho', 0.45, '#566a5a'],
  [FP_TRONCO_G, 'fpTroncoG', 'troncoG', 0, '#3a3028'], [FP_BARREIRA, 'fpBarreira', 'barreira', 0, '#33291f'], [FP_O_CRISTAL, 'fpCristal', 'geodo', 1.2, '#8ad8cc']
];
for (const [t, p, k, dig, col] of FP_SOLIDS) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [FP_SOLO, FP_GRANITO, FP_RAIZ, FP_MUSGO]) BLEND[t] = 1;
// light: the foliage faintly, the geode core a little more, the sap glass barely
EMIT[FP_FOLHA] = 0.2; EMIT[FP_O_CRISTAL] = 0.34; EMIT[FP_SEIVA] = 0.14;
ORE_XP[FP_O_CRISTAL] = 14; ORE_NAME[FP_O_CRISTAL] = 'Geodo';

WMAT[WFP_SOLO] = [PALS.fpSoloW, BKV.soloW]; WMAT[WFP_GRANITO] = [PALS.fpGranitoW, BKV.granitoW]; WMAT[WFP_CASCA] = [PALS.fpCascaW, BKV.cascaW];
WMAT[WFP_RAIZ] = [PALS.fpRaizW, BKV.raizW]; WMAT[WFP_CRISTAL] = [PALS.fpCristalW, BKV.cristalW];
DMAT[DP_FP_TRONCOS] = [PALS.dpFpTroncos, BKV.dpTroncos]; DMAT[DP_FP_COPAS] = [PALS.dpFpCopas, BKV.dpCopas]; DMAT[DP_FP_RAIZES] = [PALS.dpFpRaizes, BKV.dpRaizes];

/* ---- the ores: fossil-wood coal in the granite, and platinum: pale grey-white veins with a cold shine ---- */
oreRamp(FP_O_PLATINA, ['#1e2024', '#3a3c44', '#5e626c', '#8a8e98', '#b4b8c0', '#d6d8dc', '#f0f0ec']);
ORE_PAINT[FP_O_PLATINA] = function (L, s) {
  const R = ORE_RAMP[FP_O_PLATINA], pts = oreNodes(L, s, R, 140, [2.2, 0.6], [1.1, 0.4]);
  // the vein: a band through the main node, lit along its upper edge
  const [x0, y0] = pts[0], a = (hash2(s, 1, 141) - 0.5) * 1.6 + (hash2(s, 2, 141) < 0.5 ? 0 : Math.PI / 2), n = 4 + hash2(s, 3, 142) * 2.5, ca = Math.cos(a), sa = Math.sin(a);
  oreLine(L, x0 - ca * n, y0 - sa * n, x0 + ca * n, y0 + sa * n, (x, y, f) => {
    const e = Math.min(f, 1 - f); L.put(x, y, R[e < 0.12 ? 2 : 4], 3);
    if (y > 1 && !L.m[(y - 1) * 12 + x] && e > 0.15) L.put(x, y - 1, R[e > 0.3 ? 5 : 3], 4);
    if (y < 10 && !L.m[(y + 1) * 12 + x] && e > 0.25) L.put(x, y + 1, R[1], 1);
  });
  // a cold shine: a short cross on the brightest pixel
  const [bx, by] = pts[0];
  L.put(bx, by, R[6], 9);
  if (hash2(s, 4, 143) < 0.55) for (const [dx, dy] of [[-1, 0], [0, -1]]) { const x = bx + dx, y = by + dy; if (x >= 1 && y >= 1) L.put(x, y, R[5], 8); }
};
ORE_HALO[FP_O_PLATINA] = { pal: ['fpGranito', '#8a8e98', 0.24, 0.08], shade: 0.25 };
ORE_PAINT[FP_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[FP_O_CARVAO] = { pal: ['fpGranito', '#020204', 0.5, 0.2], shade: 0 };
MAT[FP_O_CARVAO] = [PALS.fpGranito, bakeOre(FP_O_CARVAO, vGranito)]; MAT[FP_O_PLATINA] = [PALS.fpGranito, bakeOre(FP_O_PLATINA, vGranito)];
for (const t of [FP_O_CARVAO, FP_O_PLATINA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[FP_O_CARVAO] = DIG[COAL]; ORE_XP[FP_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[FP_O_CARVAO] = ORE_NAME[COAL]; PCOL[FP_O_CARVAO] = PCOL[COAL]; ORE_ITEM[FP_O_CARVAO] = ORE_ITEM[COAL];
DIG[FP_O_PLATINA] = 1.4; ORE_XP[FP_O_PLATINA] = 16; ORE_NAME[FP_O_PLATINA] = 'Platina'; PCOL[FP_O_PLATINA] = '#b4b8c0'; ORE_ITEM[FP_O_PLATINA] = 'min_platina';
EMIT[FP_O_PLATINA] = 0.1;   // barely: the veins catch whatever light there is

/* ---- the geode core's gems: 1 to 3, each rolled by the layer's row of the gem table (117: GEM_SHARE) ---- */
const FP_GEM_IDS = ['gema_topazio', 'gema_esmeralda', 'gema_safira', 'min_cristal', 'gema_rubi'];
function fpGemRoll() {
  const pos = typeof layerPos === 'function' ? layerPos('floresta') : 7;
  const sh = (typeof GEM_SHARE !== 'undefined' && GEM_SHARE[pos]) || [43, 31, 20, 6, 0];
  let tot = 0; for (const n of sh) tot += n;
  let r = Math.random() * tot, g = 0; while (g < sh.length - 1 && r >= sh[g]) { r -= sh[g]; g++; }
  return FP_GEM_IDS[g];
}

/* ---- block items ---- */
const FP_ITEMS = {
  solo_petrificado: ['Solo Petrificado', FP_SOLO, 'Terra que virou pedra com as folhas dentro. Ainda dá para ver as nervuras.'],
  casca_pedra: ['Casca de Pedra', FP_CASCA, 'A casca de uma árvore enterrada, com os sulcos todos em pedra.'],
  cerne_pedra: ['Cerne de Pedra', FP_CERNE, 'O miolo de um tronco petrificado. Os anéis claros continuam lá.'],
  granito_verde: ['Granito Verde', FP_GRANITO, 'Granito cinza-esverdeado, pintado de grãos claros. Bom de construir.'],
  raiz_pedra: ['Raiz de Pedra', FP_RAIZ, 'Fibras de raiz torcidas e endurecidas. Pesa como rocha.'],
  cascalho_cristal: ['Cascalho de Cristal', FP_CASCALHO, 'Pedrisco de granito com lascas de cristal. Estala quando se pisa.'],
  folhagem_cristal: ['Folhagem de Cristal', FP_FOLHA, 'Folhas de cristal presas umas nas outras. A luz passa por elas quase inteira.']
};
for (const id in FP_ITEMS) { const [name, block, desc] = FP_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
// the sap pockets drop the layer's material (147), which also builds: green glass
if (ITEMS.seiva_vitrea) { ITEMS.seiva_vitrea.block = FP_SEIVA; BLOCK_DROP[FP_SEIVA] = 'seiva_vitrea'; }
BLOCK_DROP[FP_MUSGO] = 'granito_verde';   // FP_TRONCO_G, FP_BARREIRA and the geode core drop no block

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRC = {
  cristal: ['#0e2028', '#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec'],
  granito: ['#141a17', '#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a'],
  casca: ['#161210', '#221c18', '#3a3028', '#54463a', '#6e5e4e', '#8c7a66', '#ae9a84'],
  raiz: ['#140f0c', '#1e1814', '#33291f', '#4c3e2e', '#665440', '#836e56', '#a48c72'],
  cerne: ['#1e1b16', '#2e2a22', '#4a4436', '#6a614c', '#8c8266', '#b0a688', '#d2caae'],
  seiva: ['#1a1e0a', '#2a3010', '#4a5418', '#6e7c22', '#9aa83a', '#c4cc6a', '#e6ecac'],
  musgo: ['#121812', '#1c261c', '#28362a', '#364838', '#465c46', '#5a7258', '#72886c'],
  osso: ['#1e1c18', '#2e2b25', '#46423a', '#625c50', '#807868', '#9e9684', '#bab2a0'],
  drusa: ['#141c2c', '#22304a', '#3a5478', '#5a82aa', '#8ab4d6', '#bcdcf0', '#e4f2fa']
};
for (const k in DRC) DRC[k] = DRC[k].map(h => ph(h));
// a leaf lying at (cx, cy), angle a, half length l, half width w: two facets and a pale ridge
function leafSpr(a, cx, cy, ang, l, w, R, s, bias = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let y = Math.floor(cy - l - 1); y <= cy + l + 1; y++) for (let x = Math.floor(cx - l - 1); x <= cx + l + 1; x++) {
    const ox = x + 0.5 - cx, oy = y + 0.5 - cy, u = ox * ca + oy * sa, v = -ox * sa + oy * ca;
    if (!leafIn(u, v, l, w)) continue;
    a.put(x, y, R, 3.4 + bias + (v < 0 ? 0.9 : -0.6) + (Math.abs(v) < 0.45 ? 1.2 : 0) + cg(x, y, s) * 0.4);
  }
}
// a crystal prism from a root point toward angle ang (0 = up): light face left, ridge, dark face right, bright tip
function prismSpr(a, rx, ry, ang, len, hw, R, s) {
  const ux = Math.sin(ang), uy = -Math.cos(ang), nx = -uy, ny = ux;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const px = x + 0.5 - rx, py = y + 0.5 - ry, al = px * ux + py * uy, pe = px * nx + py * ny;
    if (al < -0.5 || al > len) continue;
    const w = hw * Math.min(1, (len - al) / (hw * 1.3));
    if (Math.abs(pe) > w + 0.15) continue;
    a.put(x, y, R, (pe < -0.3 ? 4.4 : pe > 0.3 ? 2.4 : 5.3) + (al > len - 1.5 ? 0.8 : 0) - (al < 1.2 ? 1 : 0) + cg(x, y, s) * 0.3);
  }
  const tx = Math.round(rx + ux * (len - 0.7) - 0.5), ty = Math.round(ry + uy * (len - 0.7) - 0.5); a.put(tx, ty, R, 6);
}

/* fallen crystal leaves: a few lying flat on the floor, one or two tilted up against the others */
function folhasSprite(s) {
  const a = spr(), C = DRC.cristal, n = 4 + (s % 2);
  for (let i = 0; i < n; i++) {
    const cx = 1.8 + hash2(s, i, 1) * 8.4, cy = 9.6 + hash2(s, i, 2) * 1.6, up = hash2(s, i, 3) < 0.25;
    leafSpr(a, cx, up ? cy - 1 : cy, up ? -0.9 + hash2(s, i, 4) * 0.4 : (hash2(s, i, 4) - 0.5) * 0.6, 2.6 + hash2(s, i, 5) * 1.0, 1.35, C, s + i, i === n - 1 ? 0.4 : -0.2);
  }
  return rimOut(a, C[0]);
}
const FOLHAS = [folhasSprite(14301), folhasSprite(14302), folhasSprite(14303)];

/* a crystal sprout: a stone pebble, one to three crystal stems, a pair of crystal leaves opening at each top */
function brotoSprite(shoots, s) {
  const a = spr(), C = DRC.cristal, G = DRC.granito;
  for (const [x0, lean, h] of shoots) {
    for (let k = 0; k <= h; k++) { const x = x0 + lean * k / h, y = 10 - k; a.put(x, y, C, 4.2 + cg(x, y, s) * 0.3); a.put(x + 1, y, C, 2.4); }
    const tx = x0 + lean + 0.5, ty = 10 - h, sz = h > 5 ? 1 : 0.8;
    leafSpr(a, tx - 1.9 * sz, ty - 1.2 * sz, -2.5, 2.8 * sz, 1.35 * sz, C, s + 1, 0.5); leafSpr(a, tx + 2.1 * sz, ty - 1.0 * sz, -0.6, 2.8 * sz, 1.35 * sz, C, s + 2, -0.3);
    a.put(tx, ty - 1, C, 6); a.put(tx, ty, C, 5);
  }
  disc(a, 5.8, 11.4, 3.6, 1.7, G, (dx, dy, d, x, y) => 4.2 - dx * 1.1 - dy * 1.4 + cg(x, y, s) * 0.5);
  return rimOut(a, C[0]);
}
const BROTO = [brotoSprite([[5, 0.6, 6]], 14311), brotoSprite([[3, -0.8, 4], [7, 0.8, 7]], 14312), brotoSprite([[2, -0.4, 3], [6, 0.3, 7]], 14313)];

/* the stone vine: a braided stone stem swaying a little (period 12, seamless), a darker tendril behind it, stone leaves
   hanging off it in pairs; the top piece grips the roof with a spread of root, the end curls round a crystal bud */
function cipoSprite(k, s) {   // 0, 1 middle; 2 top; 3 end
  const a = spr(), G = DRC.granito, M = DRC.musgo, R = DRC.raiz, end = k === 3 ? 8 : 12, ph0 = k === 1 ? 2 : 0;
  for (let y = 0; y < end; y++) { const x = 6.8 + Math.sin(y * Math.PI / 6 + ph0 + 2.4) * 1.4; a.put(x, y, M, 1.6); }   // the tendril behind
  for (let y = 0; y < end; y++) {
    const x = 5 + Math.sin(y * Math.PI / 6 + ph0) * 1.2, br = (y + ph0) % 3 === 0;
    a.put(x, y, G, (br ? 3.2 : 4.6) + cg(x, y, s) * 0.4); a.put(x + 1, y, G, br ? 4 : 2.4);
  }
  const lv = k === 3 ? [[3, -1]] : k === 1 ? [[2, 1], [8, -1]] : [[4, -1], [9, 1]];
  for (const [ly, side] of lv) { const sx = 5.5 + Math.sin(ly * Math.PI / 6 + ph0) * 1.2; leafSpr(a, sx + side * 2.4, ly + 1.6, side < 0 ? 2.1 : 1.05, 2.5, 1.25, M, s + ly, side < 0 ? 0.6 : -0.2); }
  if (k === 2) for (let x = 1; x <= 10; x++) { const d = Math.abs(x - 5.5); if (d < 5) a.put(x, 0, R, 4.2 - d * 0.3 + cg(x, 0, s) * 0.5); if (d < 3) a.put(x, 1, R, 3 - d * 0.3); }
  if (k === 3) { const x = 5 + Math.sin(8 * Math.PI / 6) * 1.2; a.put(x + 1, 8, G, 4); a.put(x + 2, 9, G, 3.4); a.put(x + 1, 10, G, 2.6); a.put(x, 9, DRC.cristal, 5.4); a.put(x, 10, DRC.cristal, 4.4); a.put(x - 1, 10, DRC.cristal, 6); }
  return rimOut(a, G[0], false);
}
const CIPO = [cipoSprite(0, 14321), cipoSprite(1, 14322), cipoSprite(2, 14323), cipoSprite(3, 14324)];

/* root steps: a stone root standing against the wall, round and fibrous; every 6 px a step is cut into it: a dark
   recess over a pale tread of heartwood that juts out a little. The top piece flares into the roof, the bottom one
   into the floor */
function raizEscadaSprite(k, s) {   // 0, 1 middle; 2 top; 3 bottom
  const a = spr(), R = DRC.raiz, C = DRC.cerne;
  for (let y = 0; y < T; y++) {
    const flare = k === 2 ? Math.max(0, 3 - y) * 1.1 : k === 3 ? Math.max(0, y - 8) * 1.1 : 0, l = 3.2 - flare + Math.sin(y * Math.PI / 6 + s) * 0.5, r = 8.4 + flare + Math.sin(y * Math.PI / 6 + s + 2) * 0.5;
    for (let x = Math.max(0, Math.floor(l)); x <= Math.min(11, Math.floor(r)); x++) { const q = (x + 0.5 - (l + r) / 2) / ((r - l) / 2); a.put(x, y, R, 3.7 - q * 1.5 - q * q * 0.8 + (((x * 2 + y) % 5) === 0 ? -0.7 : 0) + cg(x, y, s) * 0.5); }
  }
  for (const ty of k === 1 ? [3, 9] : [5, 11]) {
    for (let x = 3; x <= 8; x++) { a.put(x, ty - 2, R, 0.6); a.put(x, ty - 1, R, 1.2); }
    for (let x = 2; x <= 9; x++) a.put(x, ty, C, 5.2 - (x - 2) * 0.25 + cg(x, ty, s) * 0.4);
    a.put(2, ty - 1, C, 3.4); a.put(9, ty - 1, R, 2);
  }
  return rimOut(a, R[0], false);
}
const RAIZ_ESC = [raizEscadaSprite(0, 14331), raizEscadaSprite(1, 14332), raizEscadaSprite(2, 14333), raizEscadaSprite(3, 14334)];

/* a sap stalactite: a slim cone of lime glass from the roof, a darker core, a lit streak on the left, a bead at the tip */
function pingoSprite(s, list) {
  const a = spr(), S = DRC.seiva;
  for (const [cx0, len, w0] of list) {
    for (let y = 0; y < len; y++) {
      const hw = w0 * Math.pow(1 - y / len, 0.9) + 0.35, cx = cx0 + Math.sin(y * 0.8 + s) * 0.25;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const q = (x + 0.5 - cx) / hw; a.put(x, y, S, (q < -0.4 ? 5 : q > 0.4 ? 2.3 : 3.6) - (Math.abs(q) < 0.3 && y > 1 && y < len - 2 ? 0.8 : 0) + cg(x, y, s) * 0.3); }
    }
    a.put(Math.floor(cx0 - 1), 1, S, 6); a.put(Math.floor(cx0), len, S, 5); a.put(Math.floor(cx0), len + 1, S, 3.6);
    for (let x = Math.floor(cx0 - w0 - 1); x <= cx0 + w0 + 1; x++) a.put(x, 0, DRC.granito, 3.2 - Math.abs(x - cx0) * 0.3);
  }
  return rimOut(a, S[0], false);
}
const PINGO = [pingoSprite(14341, [[5.5, 8, 2.2]]), pingoSprite(14342, [[4.2, 9, 2.4], [8.6, 5, 1.4]])];

/* a stone fern: fronds arching out of a clump, leaflets alternating along them, one tip still curled */
function samambaiaSprite(s, fronds) {
  const a = spr(), M = DRC.musgo;
  for (const [ang, len, curl] of fronds) {
    let px = 5.8, py = 11.2, dx = Math.sin(ang), dy = -Math.cos(ang);
    for (let i = 0; i < len * 2; i++) {
      const t = i / (len * 2); px += dx * 0.5; py += dy * 0.5; dy += 0.022 + curl * 0.012;
      a.put(px, py, M, 3.4 + cg(px, py, s) * 0.3);
      if (i % 2 === 0 && t > 0.12) { const ll = (1 - t) * 1.9 + 0.5, nx = -dy, ny = dx; for (let j = 1; j <= ll; j++) { a.put(px + nx * j, py + ny * j - 0.4, M, 5 - j * 0.4); a.put(px - nx * j, py - ny * j - 0.4, M, 2.6 - j * 0.3); } }
    }
    if (curl) { a.put(px + 1, py, M, 4.6); a.put(px + 1, py + 1, M, 3.4); a.put(px, py + 1, M, 2.6); }
  }
  for (let x = 4; x <= 7; x++) a.put(x, 11, M, 1.8);
  return rimOut(a, M[0]);
}
const SAMAMB = [samambaiaSprite(14351, [[-1.15, 8, 0], [-0.45, 10, 1], [0.3, 10, 0], [1.05, 8, 0]]), samambaiaSprite(14352, [[-0.85, 9, 0], [-0.05, 11, 1], [0.75, 9, 0]])];
SAMAMB.push(flipX(SAMAMB[0]));

/* stone pine cones: two or three lying on the floor, scales in a diamond lattice, each scale's lower lip lit */
function pinhasSprite(list, s) {
  const a = spr(), C = DRC.casca;
  for (const [cx, cy, rx, ry, ang] of list) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let y = Math.floor(cy - 4); y <= cy + 4; y++) for (let x = Math.floor(cx - 4); x <= cx + 4; x++) {
      const ox = x + 0.5 - cx, oy = y + 0.5 - cy, u = ox * ca + oy * sa, w = -ox * sa + oy * ca, d = (u / rx) * (u / rx) + (w / ry) * (w / ry);
      if (d > 1) continue;
      const p = u * 0.75 + w * 0.9 + 9, q = u * 0.75 - w * 0.9 + 9, fp = p - Math.floor(p), fq = q - Math.floor(q);
      const v = fp < 0.24 || fq < 0.24 ? 2.6 : 4.7 + (fp > 0.62 && fq > 0.62 ? 1.1 : 0);
      a.put(x, y, C, v - ox * 0.25 - oy * 0.35 - d * 0.5 + cg(x, y, s) * 0.3);
    }
  }
  return rimOut(a, C[0]);
}
const PINHAS = [pinhasSprite([[3.6, 9.4, 3.2, 2.2, 0.25], [8.8, 10.0, 2.6, 1.8, -0.2]], 14361), pinhasSprite([[3.0, 10.0, 2.6, 1.8, 0.1], [7.6, 8.6, 2.0, 3.2, 0.15]], 14362)];

/* a crystal pendant: a stone stalk from the roof and a long six-sided crystal hanging point down; a smaller one beside */
function pingenteSprite(list, s) {
  const a = spr(), C = DRC.cristal, G = DRC.granito;
  for (const [cx, len, hw] of list) {
    a.put(cx - 0.5, 0, G, 3.6); a.put(cx - 0.5, 1, G, 2.8);
    for (let y = 2; y < 2 + len; y++) {
      const t = (y - 2) / len, w = hw * (t < 0.15 ? 0.7 : t > 0.7 ? (1 - t) / 0.3 : 1) + 0.2;
      for (let x = Math.floor(cx - w); x < cx + w; x++) { const q = (x + 0.5 - cx) / w; a.put(x, y, C, (q < -0.3 ? 4.6 : q > 0.3 ? 2.5 : 5.4) + (t < 0.15 ? -0.6 : 0) + cg(x, y, s) * 0.3); }
    }
    a.put(Math.floor(cx - 1), 3, C, 6);
  }
  return rimOut(a, C[0], false);
}
const PINGENTE = [pingenteSprite([[5.5, 9, 1.6], [9.0, 5, 1.0]], 14371), pingenteSprite([[3.5, 6, 1.1], [7.0, 9, 1.7]], 14372)];

/* petrified bones: a rib cage curving out of the floor with a spine under it, or a long bone and a small skull; crystal
   has grown in the cracks */
function ossadaSprite(k, s) {
  const a = spr(), O = DRC.osso;
  if (k === 0) {
    for (let x = 0; x < 11; x++) { a.put(x, 11, O, 3.6 - x * 0.1 + ((x % 2) ? -0.8 : 0)); }
    for (const rx of [1.5, 4, 6.5, 9]) for (let y = 5; y < 11; y++) { const t = (y - 5) / 6, x = rx + Math.sin(t * Math.PI) * 1.6 - 0.8; a.put(x, y, O, 4.6 - t * 1.6 + cg(x, y, s) * 0.4); }
  } else {
    for (let x = 1; x < 8; x++) { a.put(x, 10, O, 4.8 - x * 0.1); a.put(x, 11, O, 2.4); }
    a.put(0, 9, O, 4.6); a.put(0, 11, O, 3); a.put(8, 9, O, 4); a.put(8, 11, O, 2.6);
    disc(a, 9.2, 8.6, 2.6, 2.4, O, (dx, dy, d, x, y) => 4.8 - dx * 1.2 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.4);
    a.put(9, 8, O, 0.4); a.put(10, 8, O, 0.6); for (let x = 8; x <= 11; x++) a.put(x, 11, O, 2.2);
  }
  for (let q = 0; q < 144; q++) if (a[q] && hash2(q, s, 14381) < 0.07) a[q] = dPix(DRC.cristal, 3 + hash2(q, s, 14382) * 2.5);
  return rimOut(a, O[0]);
}
const OSSADA = [ossadaSprite(0, 14391), ossadaSprite(1, 14392)];

/* a petrified stump: bark in furrows, roots flaring at the foot; one cut flat showing the pale rings, one broken jagged */
function tocoSprite(k, s) {
  const a = spr(), B = DRC.casca, C = DRC.cerne, top = k ? 4 : 5;
  for (let y = top; y < T; y++) {
    const fl = Math.max(0, y - 8) * 0.8, l = 2.2 - fl, r = 9.4 + fl;
    for (let x = Math.max(0, Math.round(l)); x <= Math.min(11, Math.round(r)); x++) { const q = (x + 0.5 - 5.8) / ((r - l) / 2); a.put(x, y, B, 3.6 - q * 1.3 + ((x % 2) === 0 ? -0.9 : 0.2) + cg(x, y, s) * 0.5); }
  }
  if (!k) { disc(a, 5.8, 5.2, 3.9, 1.5, C, (dx, dy, d) => { const r = Math.sqrt(d) * 3.4; return r < 0.6 ? 2 : (r % 1.2) < 0.5 ? 5.4 : 3.6 - dy * 0.5; }); for (let x = 2; x <= 9; x++) a.put(x, 6, B, 2.2); }
  else { for (let x = 2; x <= 9; x++) { const h = [3, 1, 2, 0, 1, 3, 2, 1][x - 2]; for (let y = top - h; y < top; y++) a.put(x, y, C, 4.6 - (x - 2) * 0.25 - (top - y) * 0.2); } }
  return rimOut(a, B[0]);
}
const TOCO = [tocoSprite(0, 14401), tocoSprite(1, 14402)];

/* the lit drusa: a fist of blue-white crystals out of a lump of granite; on the floor or out of a root wall */
function drusaSprite(k, s) {
  const a = spr(), D = DRC.drusa, G = DRC.granito;
  if (k < 2) {
    const list = k ? [[4.5, -0.55, 4, 1.1], [7.6, 0.6, 5, 1.2], [6, 0.05, 8.5, 1.7]] : [[3.6, -0.7, 5, 1.2], [8.2, 0.45, 6, 1.3], [5.6, -0.1, 8.5, 1.8], [7, 0.9, 3, 0.9]];
    for (const [rx, ang, len, hw] of list) prismSpr(a, rx, 10.6, ang, len, hw, D, s);
    disc(a, 6, 11.6, 4.6, 1.6, G, (dx, dy, d, x, y) => 4.0 - dx * 1.1 - dy * 1.4 + cg(x, y, s) * 0.5);
  } else {
    disc(a, 0.4, 6.5, 1.6, 4.2, G, (dx, dy, d, x, y) => 4.0 - dx * 1.1 - dy * 1.3 + cg(x, y, s) * 0.5);
    for (const [ry, ang, len, hw] of [[3.4, 0.45, 4.5, 1.0], [9.8, 1.5, 4.5, 0.9], [7.0, 0.9, 8, 1.5]]) prismSpr(a, 1.0, ry, ang, len, hw, D, s);
  }
  return rimOut(a, D[0]);
}
const DRUSA = [drusaSprite(0, 14411), drusaSprite(1, 14412), drusaSprite(2, 14413)];
DRUSA.push(flipX(DRUSA[2]));

/* a nest of stone twigs: a bowl of crossed twigs lit on top, two pale stone eggs in it, one cracked with crystal inside */
function ninhoSprite(s) {
  const a = spr(), R = DRC.raiz, O = DRC.osso;
  disc(a, 4.4, 6.8, 1.7, 2.2, O, (dx, dy, d) => 5.6 - dx * 1.3 - dy * 1.3 - d * 0.6);
  disc(a, 7.4, 7.2, 1.6, 2.0, O, (dx, dy, d) => 5.2 - dx * 1.3 - dy * 1.3 - d * 0.6);
  if (s % 2) { a.put(7, 6, DRC.cristal, 5); a.put(8, 7, DRC.cristal, 4); a.put(7, 7, O, 1.5); }
  for (let y = 8; y < 12; y++) { const hw = 5.4 - (y - 8) * 0.7; for (let x = Math.round(5.8 - hw); x <= Math.round(5.8 + hw); x++) { const tw = Math.sin(x * 1.7 + y * 2.3 + s) + Math.sin(x * 0.9 - y * 3.1); a.put(x, y, R, (y === 8 ? 4.6 : 3.2) + (tw > 0.8 ? 1 : tw < -0.8 ? -1.4 : 0) - (y - 8) * 0.4 + cg(x, y, s) * 0.5); } }
  for (const [x, y] of [[0, 7], [11, 8], [1, 6], [10, 7]]) a.put(x, y, R, 4);   // twig ends sticking out
  return rimOut(a, R[0]);
}
const NINHO = [ninhoSprite(14421), ninhoSprite(14422)];

DECO[FP_FOLHAS] = FOLHAS; DECO[FP_BROTO] = BROTO; DECO[FP_CIPO] = CIPO; DECO[FP_RAIZ_ESCADA] = RAIZ_ESC; DECO[FP_PINGO] = PINGO; DECO[FP_SAMAMBAIA] = SAMAMB;
DECO[FP_PINHAS] = PINHAS; DECO[FP_PINGENTE] = PINGENTE; DECO[FP_OSSADA] = OSSADA; DECO[FP_TOCO] = TOCO; DECO[FP_DRUSA] = DRUSA; DECO[FP_NINHO] = NINHO;
const FP_DECO = [
  // id, dig, map colour, drop
  [FP_FOLHAS, 0.03, '#4fb0b0', null], [FP_BROTO, 0.08, '#8ad8cc', null], [FP_CIPO, 0.12, '#566a5a', null], [FP_RAIZ_ESCADA, 0.4, '#665440', 'raiz_pedra'],
  [FP_PINGO, 0.05, '#c4cc6a', null], [FP_SAMAMBAIA, 0.04, '#465c46', null], [FP_PINHAS, 0.05, '#6e5e4e', null], [FP_PINGENTE, 0.06, '#8ad8cc', null],
  [FP_OSSADA, 0.06, '#9e9684', 'osso'], [FP_TOCO, 0.5, '#6e5e4e', 'cerne_pedra'], [FP_DRUSA, 0.15, '#bcdcf0', null], [FP_NINHO, 0.06, '#4c3e2e', null]
];
for (const [t, dig, col, drop] of FP_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[FP_FOLHAS] = 0.24; EMIT[FP_BROTO] = 0.45; EMIT[FP_PINGO] = 0.22; EMIT[FP_PINGENTE] = 0.26; EMIT[FP_DRUSA] = 0.86;
// what falls when its support goes (56, 87): a vine column comes down whole when its top loses the roof
for (const t of [FP_CIPO, FP_PINGO, FP_PINGENTE]) CV_HANGS[t] = 1;
for (const t of [FP_FOLHAS, FP_BROTO, FP_SAMAMBAIA, FP_PINHAS, FP_OSSADA, FP_TOCO, FP_NINHO]) CV_STANDS[t] = 1;

// which variation goes where
DECO_PICK[FP_CIPO] = (gx, gy, arr) => tileAt(gx, gy - 1) !== FP_CIPO && solidAt(gx, gy - 1) ? arr[2] : tileAt(gx, gy + 1) !== FP_CIPO ? arr[3] : arr[hash2(gx, gy, 14431) < 0.4 ? 1 : 0];
DECO_PICK[FP_RAIZ_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== FP_RAIZ_ESCADA && solidAt(gx, gy - 1) ? arr[2] : tileAt(gx, gy + 1) !== FP_RAIZ_ESCADA && solidAt(gx, gy + 1) ? arr[3] : arr[(gy & 1) ? 1 : 0];
DECO_PICK[FP_DRUSA] = (gx, gy, arr) => solidAt(gx, gy + 1) ? arr[hash2(gx, gy, 14432) < 0.5 ? 1 : 0] : solidAt(gx - 1, gy) ? arr[2] : solidAt(gx + 1, gy) ? arr[3] : arr[0];

// the vine is climbed like the cathedral's chains; the root steps like a ladder too (the mine's climbing pose, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, FP_CIPO) || _tt(e, FP_RAIZ_ESCADA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, FP_RAIZ_ESCADA)); }; }

// what breaking gives besides the block: a crystal leaf now and then, and the geode's gems
{ const _bt = breakTile; breakTile = function (tx, ty) {
  const t = tileAt(tx, ty); _bt(tx, ty);
  if (t < FP_SOLO || t > FP_NINHO || tileAt(tx, ty) === t) return;
  const lx = (tx + 0.5) * T, ly = (ty + 1) * T - 1;
  if ((t === FP_FOLHA && Math.random() < 0.25) || (t === FP_FOLHAS && Math.random() < 0.15)) dropLoot(lx, ly, 'folha_cristal', 1, true);
  if (t === FP_O_CRISTAL) {
    for (let n = 1 + ((Math.random() * 3) | 0); n > 0; n--) dropLoot(lx, ly, fpGemRoll(), 1, true);
    burst(lx, ly - 6, 10, '#8ad8cc', 70, 260, 0.5, 1, true);
  } else if (t === FP_FOLHA || t === FP_FOLHAS || t === FP_BROTO || t === FP_PINGENTE || t === FP_DRUSA) burst(lx, ly - 6, 5, t === FP_DRUSA ? '#bcdcf0' : '#8ad8cc', 50, 220, 0.4, 1, true);
}; }

/* ================= light: the foliage lets light through; canopies wake when a strong light comes near =================
   propLights runs inside computeLight after the sources are laid (LB) and the loss per tile is set (DB), and before
   the spread: here the clear tiles get a small loss instead of the rock's, and a little light of their own near the
   hero's light, a torch or a drusa. Typed arrays and a fixed source list only. */
const FP_CLEAR_LOSS = 0.105, FP_WAKE_R = 9, FP_WAKE = 0.5;
const fpSrc = new Float32Array(3 * 12); let fpNs = 0;   // the strong lights of this frame (the glows read them too)
function fpClearLight(x0, y0, w, h) {
  if (!LB || !DB) return;
  const gy0 = Math.max(0, y0), gy1 = Math.min(WH - 1, y0 + h - 1);
  fpNs = 0; if (gy1 < gy0) return;
  // the strong lights in the window: the hero's own light, then torches and drusas (emitters were just collected)
  let ns = 0;
  if (!pl.dead && pl.light > 0) { fpSrc[0] = (pl.x + pl.w / 2) / T; fpSrc[1] = (pl.y + pl.h / 2) / T; fpSrc[2] = 1; ns = 1; }
  for (let i = 0; i < emitters.length && ns < 12; i += 3) { const e = EMIT[emitters[i + 2]]; if (e >= 0.8) { fpSrc[ns * 3] = emitters[i] + 0.5; fpSrc[ns * 3 + 1] = emitters[i + 1] + 0.5; fpSrc[ns * 3 + 2] = e; ns++; } }
  fpNs = ns; const R2 = FP_WAKE_R * FP_WAKE_R;
  for (let gy = gy0; gy <= gy1; gy++) {
    const row = gy * WW, j = (gy - y0) * w;
    for (let i = 0; i < w; i++) {
      let gx = x0 + i; if (gx < 0) gx += WW; else if (gx >= WW) gx -= WW;
      if (!FP_CLEAR[tiles[row + gx]]) continue;
      const k = j + i; if (DB[k] > FP_CLEAR_LOSS) DB[k] = FP_CLEAR_LOSS;
      for (let s = 0; s < ns; s++) {
        const dx = x0 + i + 0.5 - fpSrc[s * 3], dy = gy + 0.5 - fpSrc[s * 3 + 1], d2 = dx * dx + dy * dy;
        if (d2 < R2) { const b = FP_WAKE * fpSrc[s * 3 + 2] * (1 - Math.sqrt(d2) / FP_WAKE_R); if (LB[k] < b) LB[k] = b; }
      }
    }
  }
}
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) { _pl(addL, x0, y0, w, h); fpClearLight(x0, y0, w, h); }; }

/* ================= live: cold glows, the sap drip ================= */
const FP_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!FLORESTA) return;
  if (!FP_GLOW.f) { FP_GLOW.f = glow(12, '#3fa8a4'); FP_GLOW.g = glow(14, '#6ad0c4'); FP_GLOW.d = glow(30, '#a8d0ee'); FP_GLOW.b = glow(16, '#5ad0c8'); FP_GLOW.s = glow(10, '#b8c45a'); FP_GLOW.p = glow(9, '#8ad8cc'); FP_GLOW.c = glow(4, '#d4f4ec'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < FP_SOLO || t > FP_NINHO) continue;
    const gx = emitters[i], gy = emitters[i + 1], px = gx * T + 6 - cx, py = gy * T + 6 - cy;
    if (t === FP_FOLHA) {
      // canopies: every other tile glows faintly, more when a strong light is near (the sources of fpClearLight)
      if ((gx + gy) & 1) continue;
      let a = 0.05 + Math.sin(gameTime * 0.7 + gx * 0.9 + gy * 0.4) * 0.02;
      for (let s = 0; s < fpNs; s++) { const dx = gx + 0.5 - fpSrc[s * 3], dy = gy + 0.5 - fpSrc[s * 3 + 1], d2 = dx * dx + dy * dy; if (d2 < 64) a += 0.16 * fpSrc[s * 3 + 2] * (1 - Math.sqrt(d2) / 8); }
      if (a > 0.3) a = 0.3;
      lc.globalAlpha = a; lc.drawImage(FP_GLOW.f, px - 12, py - 12);
    } else if (t === FP_DRUSA) { lc.globalAlpha = 0.24 + Math.sin(gameTime * 1.3 + gx * 1.7) * 0.03; lc.drawImage(FP_GLOW.d, px - 30, py - 30); }
    else if (t === FP_O_CRISTAL) { lc.globalAlpha = 0.11 + Math.sin(gameTime * 0.8 + gx + gy * 1.3) * 0.03; lc.drawImage(FP_GLOW.g, px - 14, py - 14); }
    else if (t === FP_BROTO) { lc.globalAlpha = 0.17 + Math.sin(gameTime * 1.1 + gx * 2.1) * 0.03; lc.drawImage(FP_GLOW.b, px - 16, py - 14); }
    else if (t === FP_PINGO) { lc.globalAlpha = 0.12 + Math.sin(gameTime * 0.9 + gx) * 0.02; lc.drawImage(FP_GLOW.s, px - 10, py - 12); }
    else if (t === FP_SEIVA) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.05 + Math.sin(gameTime * 0.6 + gx * 0.8 + gy) * 0.02; lc.drawImage(FP_GLOW.s, px - 10, py - 10); }
    else if (t === FP_PINGENTE) { lc.globalAlpha = 0.12 + Math.sin(gameTime * 1.7 + gx * 1.3) * 0.03; lc.drawImage(FP_GLOW.p, px - 9, py - 7); }
    else if (t === FP_FOLHAS) { lc.globalAlpha = 0.08 + Math.sin(gameTime * 0.9 + gx * 1.9) * 0.02; lc.drawImage(FP_GLOW.p, px - 9, py - 5); }
    // a still sparkle on a crystal now and then
    if ((t === FP_DRUSA || t === FP_O_CRISTAL || t === FP_PINGENTE) && ((gameTime * 0.5 + hash2(gx, gy, 14441) * 7) % 7) < 0.25) { lc.globalAlpha = 0.6; lc.drawImage(FP_GLOW.c, px - 4 + ((hash2(gx, gy, 14442) * 6) | 0) - 3, py - 4 - ((hash2(gx, gy, 14443) * 5) | 0)); }
  }
  lc.globalAlpha = 1;
});
// the sap stalactites drip slowly: a glowing bead swells and falls (visible ones rescanned when the view moves)
const fpDrips = []; let fpDripKey = '', fpDripT = 0;
HOOK.update.push(dt => {
  if (!FLORESTA || state !== 'play') return;
  const x0 = Math.floor(cam.x / T) - 1, y0 = Math.max(0, Math.floor(cam.y / T) - 1), key = x0 + ',' + y0;
  if (key === fpDripKey && (fpDripT -= dt) > 0) return;
  fpDripKey = key; fpDripT = 0.5; fpDrips.length = 0;
  const y1 = Math.min(WH - 1, y0 + Math.ceil(VH / T) + 2), x1 = x0 + Math.ceil(VW / T) + 2;
  if (!inFloresta(y0) && !inFloresta(y1)) return;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === FP_PINGO) fpDrips.push(x, y);
});
HOOK.drawTop.push((cx, cy) => {
  if (!FLORESTA) return;
  for (let i = 0; i < fpDrips.length; i += 2) {
    const gx = fpDrips[i], gy = fpDrips[i + 1], x = gx * T - cx, y = gy * T - cy, ph0 = (gameTime * 0.22 + hash2(gx, gy, 14451)) % 1, bx = x + 5 + (hash2(gx, gy, 14452) < 0.5 ? 0 : 1);
    if (ph0 < 0.8) { if (ph0 > 0.4) { lc.fillStyle = '#c4cc6a'; lc.fillRect(bx, y + 9, 1, ph0 > 0.65 ? 2 : 1); } continue; }
    let fl = 1; while (fl < 10 && !solidAt(gx, gy + fl)) fl++;
    const f = (ph0 - 0.8) / 0.2, dy = 9 + f * f * (fl * T - 9);
    lc.fillStyle = '#e6ecac'; lc.fillRect(bx, y + dy, 1, 2);
  }
});

Object.assign(FPART, { cg, cn, cells, dPix, cvSprite, spr, rimOut, disc, flipX, wrapT, W2, leafIn, leafSpr, prismSpr, clampR, DRC, FOSS, CRYS, SEIV, MOSS, GRAN,
  vSolo, vCasca, vCerne, vGranito, vRaiz, vFolha, vSeiva, vMusgo, vCascalho, vTroncoG, vBarreira, vGeodo, barkV, BKV, fpGemRoll, fpClearLight, FP_GLOW });
}
