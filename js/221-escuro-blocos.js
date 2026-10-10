'use strict';

/* ================= a Escuridão: blocks, back walls, far layer, ores, decorations =================
   The bottom of the world. Ash rock that was hell's ember and went cold (grey, with dead cinders and rusty cracks),
   blue-black darkstone that hardly gives any light back (faint ripples, a cold glint now and then), black glass in
   long sheets with cold streaks of reflection and shell-shaped fractures, the night roots (black fibres running up
   with violet veins) and their bark in rough plates, primeval stone (smooth, pearl-grey, older than the world: it
   shows only when lit), the pale carved sandstone of the Kindlers with suns cut in it and their long thin bricks
   blackened with soot on top. Living dark (a crawling black mass), the penumbra slab (a glass you can barely see,
   that turns to a floor of pale mist when light is on it) and the shadow wall that closes the boss hall.
   Coal comes back in the ash rock; noctirium, the layer's metal, sits in the darkstone as black lumps with a silver
   rim that shows only in light.
   Like 131-cidade-blocos, every material is a seamless 240x240 texture sampled in world pixels; outline, lit edge,
   shade and ambient occlusion come from 07-chunks-luz. Back walls and the far layer only read the tone (.v). Small
   decorations (a cold and a lit brazier, a burnt-out torch, the cold wisp, the Kindlers' chain and a hanging root you
   can climb, black glass spikes and a glass stalagmite, a Kindler's bones hugging an empty lantern, the eyes in the
   dark, a carved sun, a Kindler column from floor to roof, the cold and the lit pyre) are 12x12 sprites on ramps lit
   from the top left. Flames, the wisp, the eyes and the carved suns' warmth are drawn live.
   Ids: 220-escuro-api. */
const ESART = {};   // helpers shared with 222-escuro-objetos, the creatures (224, 225) and the boss (227)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc } = FGART;
/* ---- palettes: 6 shades, dark to light (card section 12) ---- */
pal('esApagada', ['#121012', '#1e1a1a', '#2a2524', '#3a3330', '#4c4440', '#605652']);
pal('esBreu', ['#090a0f', '#11141c', '#1a1e29', '#242a37', '#303848', '#40495e']);
pal('esVidro', ['#08080c', '#0e0d14', '#191826', '#262438', '#3a3852', '#6a6890']);
pal('esRaiz', ['#0c080e', '#18111c', '#251a2c', '#33253e', '#453252', '#5c486c']);
pal('esCasca', ['#0d0a0d', '#191419', '#261e26', '#342a34', '#443844', '#584a58']);
pal('esPrimeva', ['#1a1a1e', '#26262c', '#33333a', '#43434b', '#57575f', '#6e6e76']);
pal('esLavrada', ['#2a241c', '#3a3226', '#4c4232', '#625640', '#7c6e52', '#9a8a68']);
pal('esTijolo', ['#1c1612', '#2a201a', '#3a2c22', '#4c3a2c', '#604a38', '#765c46']);
pal('esVivo', ['#020204', '#05050a', '#090a12', '#0e101c', '#151828', '#20253a']);
pal('esNevoa', ['#1c2230', '#2a3242', '#3c4658', '#525e72', '#6c7a90', '#8a98ae']);
pal('esSombra', ['#030306', '#07060c', '#0c0a14', '#14101e', '#1e182c', '#2a223c']);
// back walls: always far darker than the ground in front; the carved stone is the only one with a warm tone
pal('esApagadaW', ['#070607', '#0a0909', '#0e0c0c', '#121010', '#161414', '#1b1818']);
pal('esBreuW', ['#030305', '#050608', '#07090c', '#0a0c10', '#0d1015', '#11141a']);
pal('esRaizW', ['#050306', '#080509', '#0b070d', '#0f0a12', '#140e18', '#1a121f']);
pal('esLavradaW', ['#0c0a08', '#110e0b', '#16130e', '#1c1812', '#221d16', '#29231b']);
pal('esPrimevaW', ['#09090b', '#0d0d10', '#121216', '#17171c', '#1d1d23', '#24242b']);
// the far layer behind the walls
pal('dpEsNada', ['#010102', '#020204', '#030306', '#040408', '#06060a', '#08080d']);
pal('dpEsRaizes', ['#020103', '#040306', '#060409', '#09060d', '#0d0912', '#140e1a']);
pal('dpEsTorres', ['#020203', '#040405', '#060608', '#09090b', '#0d0c0f', '#3a2410']);

const wrapT = v => ((v % TP) + TP) % TP;
const RAMPX = hexes => hexes.map(h => ph(h));
const CINDER = RAMPX(['#1e0e0a', '#2e1610', '#3e1e14', '#4e2618']);                // dead embers in the ash rock
const RUSTE = RAMPX(['#24120c', '#341a10', '#462416']);
const COLD = RAMPX(['#2c3448', '#46526e', '#6a7a9a', '#a4b4d0']);                 // cold glints, the glass's streaks
const VEIN = RAMPX(['#2a1a3a', '#3c2654', '#523470', '#6c4a8e']);                 // the roots' violet veins
const SOOT = RAMPX(['#0c0a0a', '#141010', '#1c1716']);
const SILVER = RAMPX(['#2a3246', '#7c8aa8', '#b4c2dc', '#d8e2f4']);

/* ---- solid ground ---- */
function vApagada(x, y) {   // ash rock gone cold: grey clods, dead cinders, rusty hairline cracks, a pale ash bloom in the hollows
  let v = 2.4 + cn(x, y, 30, 30, 22101) * 1.8 + cn(x, y, 100, 100, 22102) * 0.8 + cg(x, y, 22103) * 0.7;
  const c = cells(x, y, 10, 22104, 1.1);
  if (c.d2 - c.d1 < 0.9) v -= 1.1;                                                          // the joints between clods
  else v += (c.ox + c.oy < 0 ? 0.4 : -0.3);
  if (c.id < 0.07 && c.d1 < 1.6) { MATX = CINDER[c.ox + c.oy < 0 ? 3 : c.d1 < 0.8 ? 2 : 1]; return -9; }   // a dead ember
  const cr = Math.abs(cn(x, y, 22, 22, 22105)); if (cr < 0.006) { MATX = RUSTE[cr < 0.003 ? 2 : 1]; return -9; }
  if (hash2(x, y, 22106) < 0.035) v -= 1.2; else if (hash2(x, y, 22107) < 0.012) v += 1.4;   // pits and ash specks
  return v;
}
function vBreu(x, y) {   // darkstone: blue-black and smooth, low ripples like a held breath, a cold glint once in a long while
  let v = 1.9 + cn(x, y, 40, 40, 22111) * 1.1 + cn(x, y, 12, 12, 22112) * 0.5 + cg(x, y, 22113) * 0.35;
  const rip = Math.sin((x * 0.3 + y) * 0.21 + cn(x, y, 20, 20, 22114) * 9); if (rip > 0.86) v += (rip - 0.86) * 6;
  const fr = Math.abs(cn(x, y, 36, 36, 22115)); if (fr < 0.005) v -= 1.2;
  if (hash2(x, y, 22116) < 0.0025) { MATX = COLD[hash2(x, y, 22117) < 0.3 ? 2 : 1]; return -9; }
  return v;
}
function vVidro(x, y) {   // black glass: long sheets, cold streaks of reflection running down at a slant, shell fractures
  let v = 1.8 + cn(x, y, 50, 50, 22121) * 0.8 + cg(x, y, 22122) * 0.15;
  const s = Math.sin((x - y * 0.55) * 0.09 + cn(x, y, 30, 60, 22123) * 4);
  if (s > 0.94) { MATX = COLD[s > 0.985 ? 3 : s > 0.965 ? 2 : 1]; return -9; }               // the reflection
  if (s > 0.85) v += (s - 0.85) * 18;
  const c = cells(x, y, 16, 22124, 1); const e = c.d2 - c.d1;
  if (e < 0.7) return 0.4;                                                                   // a fracture
  if (e < 1.6) v += c.ox + c.oy < 0 ? 1.2 : -0.6;                                            // its lit lip
  return v;
}
function vRaiz(x, y) {   // night root: black fibres running straight up, twisting a little, violet veins between them, knots
  const w = cn(x, y, 10, 60, 22131) * 18, fx = x + w, f = ((fx % 4) + 4) % 4;
  let v = 2.2 + (f === 0 ? -1.1 : f === 1 ? 0.7 : f === 2 ? 0.2 : -0.3) + cn(x, y, 30, 80, 22132) * 1.0 + cg(x, y, 22133) * 0.4;
  const vein = Math.abs(cn(fx, y, 6, 90, 22134)); if (vein < 0.012) { MATX = VEIN[vein < 0.005 ? 3 : 2]; return -9; }
  const k = cells(x, y, 20, 22135, 0.6); if (k.id < 0.2 && k.d1 < 4) v += 1.2 - k.d1 * 0.35 - (k.ox + k.oy > 0 ? 0.8 : 0);   // a knot
  return v;
}
function vCasca(x, y) {   // bark of the night roots: rough plates split by deep up-and-down fissures
  const c = cells(x, y, 9, 22141, 0.45), e = c.d2 - c.d1;
  if (e < 1.0) return 0.3 + cg(x, y, 22142) * 0.3;
  let v = 2.6 + (c.id - 0.5) * 1.2 + (c.ox < 0 ? 0.6 : -0.4) + cn(x, y, 6, 20, 22143) * 0.9 + cg(x, y, 22144) * 0.5;
  if (Math.abs(cn(x, y, 4, 30, 22145)) < 0.01) { MATX = VEIN[1]; return -9; }
  return v;
}
function vPrimeva(x, y) {   // primeval stone: smooth, pearl-grey, ancient strata soft as cloth, a few hair cracks
  let v = 2.6 + cn(x, y, 80, 80, 22151) * 1.2 + cn(x, y, 26, 26, 22152) * 0.45 + cg(x, y, 22153) * 0.12;
  const st = Math.sin(y * 0.16 + cn(x, y, 60, 20, 22154) * 5); v += st * 0.28;
  if (Math.abs(cn(x, y, 40, 40, 22155)) < 0.004) v -= 1.3;
  return v;
}
const lavCourse = (x, y) => { const row = Math.floor(wrapT(y) / 12), ly = wrapT(y) % 12, off = (row % 2) * 9, lx = wrapT(x + off) % 18, bk = Math.floor(wrapT(x + off) / 18); return { row, ly, lx, bk }; };
function vLavrada(x, y) {   // the Kindlers' carved stone: pale blocks, chamfered lit edges, worn; on some a sun cut in relief
  const { row, ly, lx, bk } = lavCourse(x, y), id = hash2(bk, row, 22161);
  if (ly === 11 || lx === 0) return 0.7 + cg(x, y, 22162) * 0.3;
  let v = 3.0 + (id - 0.5) * 0.9 + cn(x, y, 24, 24, 22163) * 0.8 + cg(x, y, 22164) * 0.4;
  if (ly === 0) v += 1; else if (ly === 10) v -= 0.8;
  if (lx === 1) v += 0.5; else if (lx === 17) v -= 0.7;
  if (id < 0.22) {   // a carved sun: a ring, a boss in the middle, rays
    const dx = lx - 9, dy = ly - 5.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (d < 1.6) v += 1.2; else if (d > 2.4 && d < 3.3) v -= 1.2 + (dx + dy > 0 ? 0.3 : 0); else if (d >= 3.6 && d < 5.4 && Math.abs(Math.sin(a * 4)) > 0.86) v -= 1.0;
  }
  if (hash2(x, y, 22165) < 0.03) v -= 0.8;
  return v;
}
function vTijolo(x, y) {   // the Kindlers' long thin bricks, soot rising black over the top courses of each
  const row = Math.floor(wrapT(y) / 5), ly = wrapT(y) % 5, off = row % 2 ? 8 : 0, lx = wrapT(x + off) % 16, bk = Math.floor(wrapT(x + off) / 16);
  if (ly === 4 || lx === 15) return 0.6 + cg(x, y, 22171) * 0.3;
  const h = hash2(bk, row, 22172);
  let v = 2.9 + (h - 0.5) * 1.2 + (ly === 0 ? 0.8 : ly === 3 ? -0.5 : 0) + (lx === 0 ? 0.4 : lx === 14 ? -0.4 : 0) + cg(x, y, 22173) * 0.45;
  const soot = cn(x, y, 30, 10, 22174) + (1 - ly / 4) * 0.15; if (soot > 0.2) { MATX = SOOT[Math.min(2, Math.floor((soot - 0.2) * 8))]; return -9; }
  return v;
}
function vVivo(x, y) {   // living dark: a mass that folds into itself, fine pale grains caught in it
  let v = 1.5 + cn(x, y, 14, 14, 22181) * 1.6 + cn(x, y, 5, 5, 22182) * 0.7 + cg(x, y, 22183) * 0.4;
  const f = Math.sin(cn(x, y, 22, 22, 22184) * 20); if (f > 0.8) v += 1.2;
  if (hash2(x, y, 22185) < 0.004) v = 4.6;
  return v;
}
function vNevoa(x, y) {   // the penumbra slab, solid: pale mist packed flat, brighter on top, wisps curling
  let v = 3.0 + cn(x, y, 16, 6, 22191) * 1.6 + cn(x, y, 6, 4, 22192) * 0.6 + cg(x, y, 22193) * 0.3;
  if (wrapT(y) % 12 < 2) v += 1;
  return v;
}
function vSombra(x, y) {   // the shadow wall's texture (item icon, map): smoke rising in tongues
  return 1.4 + cn(x, y, 8, 30, 22195) * 2.4 + cg(x, y, 22196) * 0.4;
}

/* ---- back walls ---- */
const vApagadaW = vApagada, vBreuW = vBreu, vRaizW = vRaiz, vLavradaW = vLavrada, vPrimevaW = vPrimeva;

/* ---- far layer ---- */
function vDpNada(x, y) {   // the Nothing behind the torn wall: almost flat black, a slow shapeless swell
  return 1.4 + cn(x, y, 120, 120, 22301) * 1.2 + cn(x, y, 40, 40, 22302) * 0.4 + cg(x, y, 22303) * 0.1;
}
function vDpRaizes(x, y) {   // the giant roots far off, climbing out of sight: wide columns that wander, edges a shade lighter
  const bg = 1.2 + cn(x, y, 40, 40, 22311) * 0.6 + cg(x, y, 22312) * 0.15;
  let v = -1;
  for (let k = 0; k < 4; k++) {
    const slot = 60, cx = k * slot + 30 + Math.sin(y * 0.02 + k * 1.7) * 10 + cn(k * 50, y, 4, 60, 22313 + k) * 18;
    const w = 7 + hash2(k, 0, 22317) * 9 + Math.sin(y * 0.035 + k) * 2;
    let dx = ((x - cx) % TP + TP) % TP; if (dx > TP / 2) dx -= TP;
    if (Math.abs(dx) < w) { const u = dx / w; v = Math.max(v, 2.6 - Math.abs(u) * 0.8 + (u < -0.75 ? 1.0 : 0) + Math.sin((y + k * 13) * 0.4 + u * 6) * 0.25 + cg(x, y, 22318) * 0.2); }
  }
  return v < 0 ? bg : v;
}
function vDpTorres(x, y) {   // the Kindlers' watchtowers far off: slender shafts, a crown, a dead brazier; one in a great many still glows
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 40), k = Math.floor(xx / 60), lx = xx % 60;
  const bg = 1.1 + cn(x, y, 30, 30, 22321) * 0.5 + cg(x, y, 22322) * 0.15;
  if (hash2(k, band, 22323) < 0.35) return bg;
  const cx = 30 + (hash2(k, band, 22324) - 0.5) * 20, hw = 3 + hash2(k, band, 22325) * 2, top = 20 + hash2(k, band, 22326) * 40;
  const dx = lx - cx;
  if (by >= top && Math.abs(dx) < hw) return 2.2 + (dx < -hw + 1 ? 0.6 : 0) + ((by - top) % 14 === 7 && Math.abs(dx) < 1 ? -0.8 : 0) + cg(x, y, 22327) * 0.2;
  if (by >= top - 4 && by < top && Math.abs(dx) < hw + 2) return 2.6 + (by === top - 4 ? 0.6 : 0);   // the crown
  if (by >= top - 7 && by < top - 4 && Math.abs(dx) < 2) return hash2(k, band, 22328) < 0.06 ? 5.4 : 2.0;   // the brazier on top
  return bg;
}

/* ---- bake and register ---- */
const BKV = {
  apagada: bake(vApagada), breu: bake(vBreu), vidro: bake(vVidro), raiz: bake(vRaiz), casca: bake(vCasca), primeva: bake(vPrimeva),
  lavrada: bake(vLavrada), tijolo: bake(vTijolo), vivo: bake(vVivo), nevoa: bake(vNevoa), sombra: bake(vSombra),
  apagadaW: bake(vApagadaW), breuW: bake(vBreuW), raizW: bake(vRaizW), lavradaW: bake(vLavradaW), primevaW: bake(vPrimevaW),
  dpNada: bake(vDpNada), dpRaizes: bake(vDpRaizes), dpTorres: bake(vDpTorres)
};
const ES_SOLID_T = [
  // id, palette, texture, dig, map colour (card section 11: the layer is blue-black on the map)
  [ES_APAGADA, 'esApagada', 'apagada', 0.7, '#2a2524'], [ES_BREU, 'esBreu', 'breu', 0.9, '#14161e'], [ES_VIDRO, 'esVidro', 'vidro', 1.1, '#262438'],
  [ES_RAIZ, 'esRaiz', 'raiz', 0.6, '#2e2036'], [ES_CASCA, 'esCasca', 'casca', 1.4, '#221b22'], [ES_PRIMEVA, 'esPrimeva', 'primeva', 1.6, '#43434b'],
  [ES_LAVRADA, 'esLavrada', 'lavrada', 0.9, '#625640'], [ES_TIJOLO, 'esTijolo', 'tijolo', 0.8, '#4c3a2c'], [ES_BREU_VIVO, 'esVivo', 'vivo', 0.08, '#0e101c']
];
for (const [t, p, k, dig, col] of ES_SOLID_T) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [ES_APAGADA, ES_BREU, ES_RAIZ, ES_PRIMEVA]) BLEND[t] = 1;

WMAT[WES_APAGADA] = [PALS.esApagadaW, BKV.apagadaW]; WMAT[WES_BREU] = [PALS.esBreuW, BKV.breuW]; WMAT[WES_RAIZ] = [PALS.esRaizW, BKV.raizW];
WMAT[WES_LAVRADA] = [PALS.esLavradaW, BKV.lavradaW]; WMAT[WES_PRIMEVA] = [PALS.esPrimevaW, BKV.primevaW];
DMAT[DP_ES_NADA] = [PALS.dpEsNada, BKV.dpNada]; DMAT[DP_ES_RAIZES] = [PALS.dpEsRaizes, BKV.dpRaizes]; DMAT[DP_ES_TORRES] = [PALS.dpEsTorres, BKV.dpTorres];

/* ---- the ores: coal in the ash rock, and noctirium: black lumps in the darkstone that only show a silver rim ---- */
oreRamp(ES_O_NOCTIRIO, ['#06070a', '#0b0d14', '#151a26', '#2a3246', '#7c8aa8', '#b4c2dc', '#d8e2f4']);
ORE_PAINT[ES_O_NOCTIRIO] = function (L, s) {
  const R = ORE_RAMP[ES_O_NOCTIRIO];
  oreNodes(L, s, R, 220, [2.9, 0.8], [1.4, 0.5], 4);
  // the lumps pushed down to near black: it drinks the light
  for (let k = 0; k < 144; k++) if (L.m[k]) L.put(k % 12, k / 12 | 0, R[Math.max(0, Math.min(2, Math.round(L.l[k] * 0.45)))], L.l[k]);
  // the silver rim: the lit edge of each lump, where it meets the rock
  for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
    const k = y * 12 + x; if (!L.m[k]) continue;
    const edge = !L.m[k - 1] || !L.m[k - 12], far = !L.m[k + 1] || !L.m[k + 12];
    if (edge) L.put(x, y, R[hash2(x, y, s + 221) < 0.3 ? 6 : 5], 9); else if (far && hash2(x, y, s + 222) < 0.5) L.put(x, y, R[3], L.l[k]);
  }
};
ORE_HALO[ES_O_NOCTIRIO] = { pal: ['esBreu', '#2a3246', 0.2, 0.08], shade: 0 };
ORE_PAINT[ES_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[ES_O_CARVAO] = { pal: ['esApagada', '#020204', 0.5, 0.2], shade: 0 };
MAT[ES_O_CARVAO] = [PALS.esApagada, bakeOre(ES_O_CARVAO, vApagada)]; MAT[ES_O_NOCTIRIO] = [PALS.esBreu, bakeOre(ES_O_NOCTIRIO, vBreu)];
for (const t of [ES_O_CARVAO, ES_O_NOCTIRIO]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[ES_O_CARVAO] = DIG[COAL]; ORE_XP[ES_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[ES_O_CARVAO] = ORE_NAME[COAL]; PCOL[ES_O_CARVAO] = PCOL[COAL]; ORE_ITEM[ES_O_CARVAO] = ORE_ITEM[COAL];
DIG[ES_O_NOCTIRIO] = 1.6; ORE_XP[ES_O_NOCTIRIO] = 18; ORE_NAME[ES_O_NOCTIRIO] = 'Noctírio'; PCOL[ES_O_NOCTIRIO] = '#7c8aa8'; ORE_ITEM[ES_O_NOCTIRIO] = 'min_noctirio';

/* ---- block items ---- */
const ES_ITEMS = {
  rocha_apagada: ['Rocha Apagada', ES_APAGADA, 'A brasa do Inferno, morta e fria. Cinza, com restos de fagulha presos dentro.'],
  pedra_breu: ['Pedra-Breu', ES_BREU, 'Preta-azulada. A luz bate nela e quase não volta.'],
  vidro_negro: ['Vidro Negro', ES_VIDRO, 'Liso como água parada. Quando a luz encosta, um reflexo frio corre por dentro.'],
  raiz_noite: ['Raiz da Noite', ES_RAIZ, 'Fibra preta com veios roxos. Dizem que estas raízes sobem pelo mundo inteiro.'],
  pedra_primeva: ['Pedra Primeva', ES_PRIMEVA, 'Cinza-pérola, lisa, mais velha que o mundo. Só aparece quando acesa.'],
  pedra_lavrada: ['Pedra Lavrada', ES_LAVRADA, 'Arenito claro dos Acendedores, com sóis gravados.'],
  tijolo_acendedor: ['Tijolo dos Acendedores', ES_TIJOLO, 'Tijolo comprido e fino, preto de fuligem por cima.']
};
for (const id in ES_ITEMS) { const [name, block, desc] = ES_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[ES_CASCA] = 'raiz_noite';   // the living dark, the penumbra slab and the shadow wall drop nothing

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRE = {
  ferro: ['#050608', '#0c0d10', '#16181c', '#22252a', '#30343a', '#42474e', '#5a6068'],      // the Kindlers' iron, blackened
  pedra: ['#2a241c', '#3a3226', '#4c4232', '#625640', '#7c6e52', '#9a8a68', '#b4a480'],      // carved stone
  cinza: ['#141212', '#201e1c', '#2e2a28', '#3e3a36', '#524c48', '#68625c'],
  carvao: ['#050506', '#0c0c0e', '#141418', '#1e1e24'],
  brasa: ['#3a1206', '#6a200a', '#a0380e', '#d85a18', '#ff8a2a', '#ffc060'],
  azul: ['#0c1424', '#1c2a44', '#2c4a78', '#4a74b0', '#7aa2dc', '#b4ceff'],                 // the cold coals of a brazier lit with a wisp
  madeira: ['#0c0907', '#16110c', '#221a12', '#2e2318', '#3c2e20', '#4c3a28'],
  vidro: ['#06060a', '#0e0d14', '#191826', '#262438', '#3a3852', '#6a6890', '#a4a8d0'],
  raiz: ['#0a070c', '#150f18', '#211726', '#2e2036', '#3e2b48', '#54405e', '#6c4a8e'],
  osso: ['#26221c', '#3e382e', '#5c5444', '#7e745e', '#a09478', '#bcb094', '#d4caae'],
  lume: ['#1c2a44', '#2c4a78', '#4a74b0', '#7aa2dc', '#b4ceff', '#e6f0ff'],
  nevoa: ['#141822', '#1e2432', '#2a3242', '#3c4658', '#525e72', '#6c7a90', '#8a98ae'],
  sombra: ['#020204', '#05050a', '#0a0a12', '#120f1c', '#1c1628', '#281e38', '#3a2c50']
};
for (const k in DRE) DRE[k] = DRE[k].map(h => ph(h));

/* the brazier: a squat iron bowl on a carved plinth; cold: grey ash and lumps of charcoal; lit (with a wisp, 223): a bed
   of cold blue coals (the blue flames are drawn live) */
function brazierSprite(lit, s) {
  const a = spr(), F = DRE.ferro, P = DRE.pedra;
  for (let y = 8; y < 12; y++) { const hw = y === 11 ? 4.5 : 2.6; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) a.put(x, y, P, (y === 8 ? 4.6 : y === 11 ? 3.2 : 3.6) - (x - 1) * 0.22 + cg(x, y, s) * 0.5 + (y === 10 && (x === 4 || x === 7) ? -1.4 : 0)); }
  for (let y = 4; y < 8; y++) { const hw = y === 4 ? 5.6 : y === 5 ? 5.2 : y === 6 ? 4.4 : 3.2; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) a.put(x, y, F, (y === 4 ? 4.8 : 3.4 - (y - 5) * 0.6) - (x - 0) * 0.18 + cg(x, y, s) * 0.4 + (y === 6 && x % 3 === 0 ? 0.8 : 0)); }
  for (const x of [0, 11]) a.put(x, 4, F, 5.4);                                                                     // the rim's lugs
  for (let x = 1; x <= 10; x++) {
    const h = 1 + (hash2(x, s, 2201) < 0.5 ? 1 : 0);
    for (let y = 4 - h; y < 4; y++) {
      if (lit) a.put(x, y, DRE.azul, 2.2 + hash2(x, y, s + 1) * 3.4 - (y < 3 ? 0.8 : 0));
      else a.put(x, y, hash2(x, y, s + 2) < 0.45 ? DRE.carvao : DRE.cinza, 1.4 + hash2(x, y, s + 3) * 2.6);
    }
  }
  return rimOut(a, F[0]);
}
const BRASEIRO_FRIO = [brazierSprite(false, 22401), brazierSprite(false, 22402)], BRASEIRO = [brazierSprite(true, 22403), brazierSprite(true, 22404)];

/* a torch that burnt out: the charred stick, the head gone to black ash with a grey tip */
function deadTorch(s) {
  const a = spr(), W = DRE.madeira;
  for (let y = 4; y < 12; y++) { a.put(5, y, W, 4 - (y - 4) * 0.1 + cg(5, y, s) * 0.5); a.put(6, y, W, 2.4); }
  for (let y = 1; y < 5; y++) for (let x = 4; x <= 7; x++) if (!(y === 1 && (x === 4 || x === 7))) a.put(x, y, y < 2 ? DRE.cinza : DRE.carvao, (y < 2 ? 3.6 : 2) - (x - 4) * 0.4 + hash2(x, y, s) * 1.2);
  return rimOut(a, W[0]);
}
const TOCHA_MORTA = [deadTorch(22411)];

/* the cold wisp: a little pale-blue flame floating, a darker heart; it bobs and glows live */
function wispSprite(s) {
  const a = spr(), L = DRE.lume;
  disc(a, 5.5, 6.5, 1.8, 2.4, L, (dx, dy, d) => 4.6 - d * 2.2 - dy * 0.4);
  a.put(5, 3, L, 3.6); a.put(6, 4, L, 3.2); a.put(5, 7, L, 5.6);
  return a;
}
const LUME = [wispSprite(22421)];

/* the Kindlers' chain: blackened iron links, one face-on then one side-on; the last ends in a ring */
function chainSprite(end, s) {
  const a = spr(), F = DRE.ferro;
  const face = cy => { for (let y = cy - 3; y <= cy + 3; y++) for (let x = 3; x <= 8; x++) { const dx = (x + 0.5 - 6) / 2.6, dy = (y + 0.5 - cy) / 3.6, d = dx * dx + dy * dy; if (d <= 1 && d >= 0.32) a.put(x, y, F, 4.6 - dx * 1.6 - dy * 1.2 + cg(x, y, s) * 0.5 + (dx < -0.5 && dy < 0 ? 1 : 0)); } };
  const side = (y0, y1) => { for (let y = y0; y <= y1; y++) { a.put(5, y, F, 5 + cg(5, y, s) * 0.4 - (y === y0 || y === y1 ? 1 : 0)); a.put(6, y, F, 2.6); } };
  side(-1, 1); face(4.5);
  if (!end) side(8, 12);
  else { for (let y = 8; y <= 11; y++) for (let x = 3; x <= 8; x++) { const dx = (x + 0.5 - 6) / 2.4, dy = (y + 0.5 - 9.8) / 2, d = dx * dx + dy * dy; if (d <= 1 && d >= 0.3) a.put(x, y, F, 4.4 - dx * 1.4 - dy); } }
  return rimOut(a, F[0]);
}
const CORRENTE = [chainSprite(false, 22431), chainSprite(false, 22432), chainSprite(true, 22433)];

/* a night root hanging from the roof: a twisted black cord with a violet vein, fibres sticking out; the last thins out */
function rootSprite(end, s) {
  const a = spr(), R = DRE.raiz, len = end ? 9 : 12;
  for (let y = 0; y < len; y++) {
    const cx = 5.5 + Math.sin(y * 0.55 + s) * 1.2, w = end ? Math.max(1, 3 - y / 3.5) : 3;
    for (let i = 0; i < w; i++) a.put(cx - w / 2 + i, y, R, (i === 0 ? 4.4 : i === Math.ceil(w) - 1 ? 2 : 3.2) + cg(cx | 0, y, s) * 0.5);
    if (((y + s) % 4) === 0) a.put(cx + 0.5, y, R, 6);                                                              // the vein glints
    if (hash2(y, s, 2241) < 0.18) a.put(cx + (hash2(y, s, 2242) < 0.5 ? -2 : 2), y + 1, R, 2.4);                     // a fibre
  }
  return rimOut(a, R[0], false);
}
const RAIZ_PEND = [rootSprite(false, 22441), rootSprite(false, 22442), rootSprite(true, 22443)];

/* black glass spikes at the bottom of the pits: three shards of every height, a cold lit edge */
function spikeSprite(s) {
  const a = spr(), V = DRE.vidro;
  for (const [cx, h, w] of [[2.5, 7 + (s % 3), 2], [6, 10 - (s % 2), 2.6], [9.5, 6 + (s % 4), 2]]) {
    for (let y = 12 - h; y < 12; y++) { const k = (y - (12 - h)) / h, hw = Math.max(0.5, w * k); for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) a.put(x, y, V, (x < cx ? 4.6 : 2.4) + cg(x, y, s) * 0.4 + (x === Math.round(cx - hw) ? 1.4 : 0)); }
    a.put(cx, 12 - h, V, 6.4);
  }
  return rimOut(a, V[0]);
}
const ESPINHO = [spikeSprite(22451), spikeSprite(22452)];

/* a glass stalagmite: a black cone, a long cold reflection down its lit side (stacked: a base and a tip) */
function stalagSprite(k, s) {
  const a = spr(), V = DRE.vidro, top = k === 0 ? 0 : k === 1 ? 2 : 5;
  for (let y = top; y < 12; y++) { const hw = k === 0 ? 2.4 + (y / 12) * 1.8 : 0.6 + (y - top) / (12 - top) * 3.6; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) a.put(x, y, V, 3.6 - (x - 5.5) / hw * 1.4 + cg(x, y, s) * 0.3 + (x === Math.round(5.5 - hw) + 1 && (y + s) % 5 < 3 ? 2.2 : 0)); }
  return rimOut(a, V[0]);
}
const ESTALAG = [stalagSprite(0, 22461), stalagSprite(1, 22462), stalagSprite(2, 22463)];

/* a Kindler's bones, sitting against nothing, arms round an empty lantern */
function bonesSprite(s) {
  const a = spr(), O = DRE.osso, F = DRE.ferro;
  disc(a, 3.4, 4.6, 2.2, 2.1, O, (dx, dy, d) => 4.6 - dx * 1.1 - dy - d * 0.5);                                     // the skull
  a.put(3, 4, O, 0.6); a.put(4, 4, O, 0.8); a.put(4, 6, O, 1.6);
  for (let y = 7; y < 11; y++) for (let x = 2; x <= 5; x++) if ((y + x) % 2 === 0 || x === 2) a.put(x, y, O, 3.8 - (x - 2) * 0.3);   // ribs
  for (let x = 1; x <= 9; x++) a.put(x, 11, O, 3 - x * 0.12);                                                       // the legs out
  for (let y = 6; y < 11; y++) { a.put(7, y, F, 3.6); a.put(10, y, F, 2); }                                         // the lantern's frame
  for (let x = 7; x <= 10; x++) { a.put(x, 5, F, 4.4 - (x - 7) * 0.4); a.put(x, 10, F, 3); }
  a.put(8, 4, F, 4); a.put(9, 4, F, 2.6);
  for (let y = 6; y < 10; y++) for (let x = 8; x <= 9; x++) a.put(x, y, F, 0.6);                                   // empty, dark
  for (const [x, y] of [[6, 7], [6, 8], [7, 8]]) a.put(x, y, O, 4.4);                                               // the arm round it
  return rimOut(a, O[0]);
}
const OSSADA = [bonesSprite(22471), bonesSprite(22472)];

/* the eyes in the dark: nothing in the chunk; they are drawn live, and only where no light reaches */
const OLHOS = [spr()];

/* a carved sun: a low slab of the Kindlers' stone, a sun in relief on its face (it warms near a lit brazier, live) */
function sunSprite(s) {
  const a = spr(), P = DRE.pedra;
  for (let y = 6; y < 12; y++) for (let x = 0; x < 12; x++) {
    if (y === 6 && (x === 0 || x === 11)) continue;
    let v = (y === 6 ? 4.8 : 3.4) - x * 0.12 + cg(x, y, s) * 0.4;
    const dx = x - 5.5, dy = y - 9.5, d = Math.hypot(dx, dy * 1.2);
    if (d < 1.4) v += 1.2; else if (d > 2 && d < 2.8) v -= 1.4; else if (d > 3 && y > 6 && Math.abs(Math.sin(Math.atan2(dy, dx) * 4)) > 0.9) v -= 1.1;
    a.put(x, y, P, v);
  }
  return rimOut(a, P[0]);
}
const SOL = [sunSprite(22481)];

/* the Kindlers' column: a shaft of carved stone, a foot, a capital, and on some pieces a band with a sun */
function columnPiece(k, s) {   // 0 foot, 1 shaft, 2 head, 3 shaft with the sun band
  const a = spr(), P = DRE.pedra;
  for (let y = 0; y < 12; y++) for (let x = 3; x <= 8; x++) {
    const u = (x + 0.5 - 6) / 3, v = 4.0 - u * 1.8 - u * u * 0.8 + cg(x, y, s) * 0.4 + ((y + s) % 6 === 0 ? -0.7 : 0);
    a.put(x, y, P, v);
  }
  if (k === 3) { for (let y = 3; y < 9; y++) for (let x = 2; x <= 9; x++) a.put(x, y, P, (y === 3 ? 4.8 : y === 8 ? 2.2 : 3.6) - (x - 2) * 0.25); a.put(5, 5, P, 5.6); a.put(6, 5, P, 4.6); a.put(5, 6, P, 4.4); for (const [x, y] of [[3, 5], [8, 6], [5, 4], [6, 7]]) a.put(x, y, P, 1.4); }
  if (k === 0) for (let y = 8; y < 12; y++) for (let x = 1; x <= 10; x++) a.put(x, y, P, (y === 8 ? 4.8 : 3.4) - (x - 1) * 0.25 - (y - 8) * 0.3 + cg(x, y, s) * 0.4);
  if (k === 2) { for (let y = 0; y < 4; y++) for (let x = 0; x < 12; x++) a.put(x, y, P, (y === 0 ? 2.6 : y === 1 ? 4.6 : 3.2) - x * 0.12 + cg(x, y, s) * 0.3); }
  return rimOut(a, P[0]);
}
const COLUNA = [columnPiece(0, 22491), columnPiece(1, 22492), columnPiece(2, 22493), columnPiece(3, 22494)];

/* the Kindlers' pyre: a tall fire basket of black iron on a carved plinth, cold ash in it or a bed of embers (the great
   flame of a lit pyre is drawn live): blue coals while a wisp burns in it, warm ones after the Nox (227 swaps them) */
function pyreSprite(lit, s, warm) {
  const a = spr(), F = DRE.ferro, P = DRE.pedra;
  for (let y = 7; y < 12; y++) for (let x = 2; x <= 9; x++) a.put(x, y, P, (y === 7 ? 4.8 : 3.4) - (x - 2) * 0.25 + cg(x, y, s) * 0.4 + (y === 9 && x > 3 && x < 8 && (x + y) % 2 ? -1 : 0));
  for (let y = 1; y < 7; y++) { const hw = 1.8 + (6 - y) * 0.7; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) { const bar = (x + y) % 2 === 0 || y === 1 || y === 6; if (bar) a.put(x, y, F, (y === 1 ? 5 : 3.4) - (x - 1) * 0.2); else a.put(x, y, lit ? (warm ? DRE.brasa : DRE.azul) : DRE.cinza, lit ? 2.6 + hash2(x, y, s) * 3 : 1.2 + hash2(x, y, s) * 2); } }
  return rimOut(a, F[0]);
}
const PIRA_FRIA = [pyreSprite(false, 22501)], PIRA = [pyreSprite(true, 22502)], PIRA_QUENTE = [pyreSprite(true, 22502, true)];

/* the shadow wall: smoke that does not move, rising in tongues, a pale rim where it meets the air (see-through) */
function shadowSprite(k, s) {
  const a = spr(), S = DRE.sombra;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const n = Math.sin(x * 1.3 + y * 0.4 + s) + Math.sin(x * 0.7 - y * 0.9 + k * 2); if (n > -0.6) a.put(x, y, S, 1.8 + n * 1.2 + hash2(x, y, s) * 0.8); }
  return a;
}
const BARREIRA = [shadowSprite(0, 22511), shadowSprite(1, 22512)];

/* the penumbra slab: dark, it is a glass you can barely make out (a few cold specks along its edge); with light on it,
   pale mist packed flat with wisps hanging under it */
function slabSprite(firm, s) {
  const a = spr(), N = DRE.nevoa;
  if (!firm) { for (let x = 0; x < 12; x++) { if (hash2(x, 0, s) < 0.45) a.put(x, 0, N, 2.6 + hash2(x, 1, s) * 2); if (hash2(x, 3, s) < 0.12) a.put(x, 3, N, 1.6); } return a; }
  for (let y = 0; y < 5; y++) for (let x = 0; x < 12; x++) a.put(x, y, N, (y === 0 ? 6 : 4.6 - y * 0.5) + Math.sin(x * 0.9 + y + s) * 0.5 + hash2(x, y, s) * 0.6);
  for (let x = 0; x < 12; x++) { const h = hash2(x, 9, s) < 0.4 ? 2 + (hash2(x, 8, s) * 4 | 0) : 0; for (let y = 5; y < 5 + h; y++) a.put(x, y, N, 3.4 - (y - 5) * 0.6); }
  return a;
}
const PENUMBRA = [slabSprite(false, 22521)], PENUMBRA_FIRME = [slabSprite(true, 22522)];

// the see-through solid pieces (walls show between): the shadow wall and the firm slab; the soft slab is not solid
DECO[ES_BARREIRA] = BARREIRA; MAT[ES_BARREIRA] = [PALS.esSombra, BKV.sombra]; SOLID[ES_BARREIRA] = 1; DIG[ES_BARREIRA] = 0; PCOL[ES_BARREIRA] = '#1e182c'; SEETHRU[ES_BARREIRA] = 1;
DECO[ES_PENUMBRA_FIRME] = PENUMBRA_FIRME; MAT[ES_PENUMBRA_FIRME] = [PALS.esNevoa, BKV.nevoa]; SOLID[ES_PENUMBRA_FIRME] = 1; DIG[ES_PENUMBRA_FIRME] = 0; PCOL[ES_PENUMBRA_FIRME] = '#525e72'; SEETHRU[ES_PENUMBRA_FIRME] = 1;
DECO[ES_PENUMBRA] = PENUMBRA; MAT[ES_PENUMBRA] = [PALS.esNevoa, BKV.nevoa]; DIG[ES_PENUMBRA] = 0; PCOL[ES_PENUMBRA] = '#1c2230';

DECO[ES_BRASEIRO_FRIO] = BRASEIRO_FRIO; DECO[ES_BRASEIRO] = BRASEIRO; DECO[ES_TOCHA_MORTA] = TOCHA_MORTA; DECO[ES_LUME] = LUME; DECO[ES_CORRENTE] = CORRENTE;
DECO[ES_RAIZ_PEND] = RAIZ_PEND; DECO[ES_ESPINHO] = ESPINHO; DECO[ES_ESTALAG] = ESTALAG; DECO[ES_OSSADA] = OSSADA; DECO[ES_OLHOS] = OLHOS; DECO[ES_SOL] = SOL;
DECO[ES_COLUNA] = COLUNA; DECO[ES_PIRA_FRIA] = PIRA_FRIA; DECO[ES_PIRA] = PIRA;
const ES_DECO = [
  // id, dig, map colour, drop
  [ES_BRASEIRO_FRIO, 0, '#3a3330', null], [ES_BRASEIRO, 0, '#7aa2dc', null], [ES_TOCHA_MORTA, 0.05, '#2e2318', 'carvao'], [ES_LUME, 0.03, '#b4ceff', 'lume_fatuo'],
  [ES_CORRENTE, 0.3, '#30343a', null], [ES_RAIZ_PEND, 0.2, '#3e2b48', 'raiz_noite'], [ES_ESPINHO, 0.4, '#262438', 'vidro_negro'], [ES_ESTALAG, 0.5, '#262438', 'vidro_negro'],
  [ES_OSSADA, 0.06, '#a09478', 'osso'], [ES_OLHOS, 0.01, '#14161e', null], [ES_SOL, 0.8, '#7c6e52', 'pedra_lavrada'], [ES_COLUNA, 0.7, '#7c6e52', 'pedra_lavrada'],
  [ES_PIRA_FRIA, 0, '#42474e', null], [ES_PIRA, 0, '#9ab8ec', null]
];
for (const [t, dig, col, drop] of ES_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[ES_BRASEIRO] = 1.3; EMIT[ES_PIRA] = 1.6; EMIT[ES_LUME] = 0.3;
// what falls when its support goes (56, 87); the chain, the hanging root and the column are left alone (they span drops)
for (const t of [ES_BRASEIRO_FRIO, ES_BRASEIRO, ES_ESPINHO, ES_ESTALAG, ES_OSSADA, ES_SOL, ES_PIRA_FRIA, ES_PIRA]) CV_STANDS[t] = 1;

// which variation goes where
const vr = (gx, gy, s, n) => (hash2(gx, gy, s) * n) | 0;
DECO_PICK[ES_BRASEIRO_FRIO] = (gx, gy, arr) => arr[vr(gx, gy, 22601, 2)];
DECO_PICK[ES_BRASEIRO] = (gx, gy, arr) => arr[vr(gx, gy, 22601, 2)];
DECO_PICK[ES_CORRENTE] = (gx, gy, arr) => tileAt(gx, gy + 1) === ES_CORRENTE || solidAt(gx, gy + 1) ? arr[(gy & 1) ? 1 : 0] : arr[2];
DECO_PICK[ES_RAIZ_PEND] = (gx, gy, arr) => tileAt(gx, gy + 1) === ES_RAIZ_PEND || solidAt(gx, gy + 1) ? arr[vr(gx, gy, 22602, 2)] : arr[2];
DECO_PICK[ES_ESPINHO] = (gx, gy, arr) => arr[vr(gx, gy, 22603, 2)];
DECO_PICK[ES_ESTALAG] = (gx, gy, arr) => tileAt(gx, gy - 1) === ES_ESTALAG ? arr[0] : tileAt(gx, gy + 1) === ES_ESTALAG ? arr[1] : arr[hash2(gx, gy, 22604) < 0.5 ? 1 : 2];
DECO_PICK[ES_OSSADA] = (gx, gy, arr) => arr[vr(gx, gy, 22605, 2)];
DECO_PICK[ES_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== ES_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== ES_COLUNA ? arr[2] : arr[hash2(gx, gy, 22606) < 0.25 ? 3 : 1];
DECO_PICK[ES_BARREIRA] = (gx, gy, arr) => arr[(gx + gy) & 1];

// the chain and the hanging root are climbed like the cathedral's chains (and count as a ladder for the climbing pose, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, ES_CORRENTE) || _tt(e, ES_RAIZ_PEND))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, ES_CORRENTE)); }; }

/* ================= live: the braziers' and pyres' fire, the wisps, the eyes in the dark, the warm suns ================= */
const ES_GLOW = {};
const sx = (gx, cx) => { let x = gx * T - cx; const W = WW * T; if (x < -W / 2) x += W; else if (x > W / 2) x -= W; return x; };
// how lit a tile is right now (the light grid of 07), 0 outside the grid
const esLB = (gx, gy) => { if (!LB) return 0; const i = gx - LX0, j = gy - LY0; if (i < 0 || j < 0 || i >= LW || j >= LH) { const i2 = wrapX(gx) - wrapX(LX0); return i2 >= 0 && i2 < LW && j >= 0 && j < LH ? LB[j * LW + i2] : 0; } return LB[j * LW + i]; };
HOOK.drawGlow.push((cx, cy) => {
  if (!ESCURO || cy + VH < (ES_S0 - 6) * T) return;
  if (!ES_GLOW.b) { ES_GLOW.b = glow(30, '#6a94dc'); ES_GLOW.p = glow(44, '#ffa848'); ES_GLOW.pc = glow(44, '#5a86d0'); ES_GLOW.l = glow(14, '#7aa2dc'); ES_GLOW.s = glow(12, '#8eaee6'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== ES_BRASEIRO && t !== ES_PIRA && t !== ES_LUME) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === ES_BRASEIRO) { lc.globalAlpha = 0.36 + Math.sin(gameTime * 9 + gx * 1.3) * 0.04 + Math.sin(gameTime * 14 + gy) * 0.03; lc.drawImage(ES_GLOW.b, x + 6 - 30, y + 2 - 30); }
    else if (t === ES_PIRA) { lc.globalAlpha = 0.42 + Math.sin(gameTime * 7 + gx) * 0.05 + Math.sin(gameTime * 12 + gy) * 0.03; lc.drawImage(esPyreWarm() ? ES_GLOW.p : ES_GLOW.pc, x + 6 - 44, y - 6 - 44); }
    else { const b = Math.sin(gameTime * 1.7 + gx * 2.1) * 1.5; lc.globalAlpha = 0.26 + Math.sin(gameTime * 2.3 + gx) * 0.06; lc.drawImage(ES_GLOW.l, x + 6 - 14, y + 7 + b - 14); }
  }
  // a carved sun near a lit brazier holds a little of its warmth
  for (let i = 0; i < esVis.length; i += 3) {
    if (esVis[i + 2] !== ES_SOL) continue;
    const gx = esVis[i], gy = esVis[i + 1], k = esSunWarm(gx, gy); if (k <= 0) continue;
    lc.globalAlpha = 0.16 * k + Math.sin(gameTime * 1.3 + gx) * 0.02 * k; lc.drawImage(ES_GLOW.s, gx * T + 6 - cx - 12, gy * T + 9 - cy - 12);
  }
  lc.globalAlpha = 1;
});
// lit braziers within 6 tiles warm a carved sun (0..1)
function esSunWarm(gx, gy) { let best = 0; for (let i = 0; i < emitters.length; i += 3) { const t = emitters[i + 2]; if (t !== ES_BRASEIRO && t !== ES_PIRA) continue; const d = Math.hypot(wdx(emitters[i] - gx), emitters[i + 1] - gy); if (d < 6) best = Math.max(best, 1 - d / 6); } return best; }
// visible eyes and suns: rescanned when the view moves a tile or every half second (they are few)
const esVis = []; let esVisKey = '', esVisT = 0;
const esBlink = new Map();   // eyes: key -> blink phase
HOOK.update.push(dt => {
  if (!ESCURO || state !== 'play') return;
  const x0 = Math.floor(cam.x / T) - 1, y0 = Math.max(0, Math.floor(cam.y / T) - 1), key = x0 + ',' + y0;
  if (key !== esVisKey || (esVisT -= dt) <= 0) {
    esVisKey = key; esVisT = 0.5; esVis.length = 0;
    const y1 = Math.min(WH - 1, y0 + Math.ceil(VH / T) + 2), x1 = x0 + Math.ceil(VW / T) + 2;
    if (inEscuro(y0) || inEscuro(y1)) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = tileAt(x, y); if (t === ES_OLHOS || t === ES_SOL) esVis.push(x, y, t); }
  }
});
const ES_FIRE_WARM = ['#b8380c', '#ff7a1a', '#ffc23d', '#fff0b0', '#ffb84a'], ES_FIRE_COLD = ['#1c3a78', '#3a6ac0', '#7aa2dc', '#e6f0ff', '#b4ceff'];
const esPyreWarm = () => typeof noxState !== 'undefined' && noxState.dead;
// over the darkness: the fire of the braziers and pyres, the eyes (only where it is dark: light makes them go)
HOOK.drawTop.push((cx, cy) => {
  if (!ESCURO || cy + VH < (ES_S0 - 6) * T) return;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== ES_BRASEIRO && t !== ES_PIRA) continue;
    const gx = emitters[i], gy = emitters[i + 1], X = gx * T - cx + 6, Y = gy * T - cy + (t === ES_PIRA ? 1 : 3), big = t === ES_PIRA, W = big ? 4 : 3, H = big ? 16 : 10;
    const C = big && esPyreWarm() ? ES_FIRE_WARM : ES_FIRE_COLD;   // everything burns the wisps' cold blue; the pyres, the true warm fire once the Nox is gone
    for (let k = -W; k <= W; k++) {
      const e = 1 - Math.abs(k) / (W + 1), h = Math.round(H * e * (0.6 + 0.4 * Math.abs(Math.sin(gameTime * (big ? 7 : 5) + k * 1.9 + gx * 0.7))) + Math.sin(gameTime * (big ? 13 : 9) + k + gy) * 1.2);
      if (h < 1) continue;
      lc.fillStyle = C[0]; lc.fillRect(X + k, Y - h, 1, h);
      lc.fillStyle = C[1]; lc.fillRect(X + k, Y - Math.round(h * 0.75), 1, Math.round(h * 0.75));
      if (Math.abs(k) < W * 0.6) { lc.fillStyle = C[2]; lc.fillRect(X + k, Y - Math.round(h * 0.45), 1, Math.round(h * 0.45)); }
      if (Math.abs(k) < 2) { lc.fillStyle = C[3]; lc.fillRect(X + k, Y - Math.round(h * 0.2), 1, Math.round(h * 0.2)); }
    }
    const sp = (gameTime * (big ? 1.6 : 0.9) + gx * 0.13) % 1; lc.fillStyle = C[4]; lc.fillRect(X + Math.round(Math.sin(sp * 9 + gx) * 3), Y - H - Math.round(sp * (big ? 22 : 14)), 1, 1);
  }
  for (let i = 0; i < esVis.length; i += 3) {
    if (esVis[i + 2] !== ES_OLHOS) continue;
    const gx = esVis[i], gy = esVis[i + 1]; if (tileAt(gx, gy) !== ES_OLHOS) continue;
    const L = esLB(gx, gy); if (L > 0.15) continue;
    const ph0 = (gameTime * 0.23 + hash2(gx, gy, 22611) * 7) % 1, open = ph0 < 0.55 && !(ph0 > 0.3 && ph0 < 0.33);
    if (!open) continue;
    const X = sx(gx, cx) + 3 + (hash2(gx, gy, 22612) * 3 | 0), Y = gy * T - cy + 5, a = (1 - L / 0.15) * (ph0 < 0.05 ? ph0 / 0.05 : ph0 > 0.5 ? (0.55 - ph0) / 0.05 : 1);
    lc.globalAlpha = 0.75 * a; lc.fillStyle = '#d8e2f4'; lc.fillRect(X, Y, 1, 1); lc.fillRect(X + 4, Y, 1, 1);
    lc.globalAlpha = 0.3 * a; lc.fillRect(X - 1, Y, 1, 1); lc.fillRect(X + 5, Y, 1, 1);
  }
  lc.globalAlpha = 1;
});
Object.assign(ESART, { cg, cn, cells, dPix, spr, rimOut, disc, DRE, CINDER, COLD, VEIN, SOOT, SILVER, vApagada, vBreu, vVidro, vRaiz, vCasca, vPrimeva, vLavrada, vTijolo, esLB, esVis, PIRA, PIRA_QUENTE, ES_GLOW });
}
