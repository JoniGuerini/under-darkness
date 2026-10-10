'use strict';

/* ================= the caves: shared ids, bands and depths =================
   The first layer under the village (docs/biomas.md part 2, docs/caverna-spec.md). The cathedral now lies
   under it: 45-catedral-mundo starts its bands CAVE_D metres lower. Files:
     52-caverna-api     this file: ids, bands, depth helpers
     53-caverna-blocos  block, back wall, far-layer and decoration textures, cave ores, block items
     54-caverna-objetos props (stalagmites, crystal geodes, cocoons, cave paintings...)
     55-caverna-bichos  slime and bat repainted, rat, spiders, beetle, spiderling: art, AI, drops
     56-caverna-mundo   world generation, the way down to the cathedral, dressing, zones, levels, loot, save
     57-mae-teia        the boss: her chamber, the fight, the drop
   Loads right after 41-catedral-api. */

const CAVERNA = true;
const CAVE_D = CAVERNA ? 186 : 0;                 // metres of caves between the village floor and the cathedral's atrium
// band tops in metres below the village floor: Grutas Rasas, Galerias de Pedra, O Ninho, Fundações Soterradas, (cathedral)
const CV_BANDS = [6, 60, 120, 168, 186];
const CV_BAND_NAMES = ['grutas', 'galerias', 'ninho', 'fundacoes'];
const CV_ZONE0 = 9;                               // zone ids 9..12 (ZONE_NAMES in 10-combate gets them in 56)
let CV_S0 = 46;                                   // the village floor row of the current world (set by buildCaves)
// monster level in a layer below the caves (Jonathan 2026-10-10): every layer starts 1 above the last level of the one above it.
// lo on the top half, lo + 1 from 93 m down; 30% come 1 higher but never past the layer's top (caves 1-4, then layerLo in 129: cathedral 5-6, ice 7-8, mine 9-10, fungal mines 11-12, abyss 13-14)
function layerLvl(lo, d) { return Math.min(lo + 1, lo + (d >= 93 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0)); }

// foreground blocks (solid)
const CV_TERRA = 54, CV_ARGILA = 55, CV_ROCHA = 56, CV_MUSGO = 57, CV_CALCITA = 58, CV_CASCALHO = 59, CV_XISTO = 60, CV_TEIA = 61;
// the ores again, set in cave rock (same items as COAL..GOLD)
const CV_O_CARVAO = 62, CV_O_COBRE = 63, CV_O_FERRO = 64, CV_O_OURO = 65;
// one-block decorations (not solid)
const CV_ESTALACTITE = 66, CV_ESTALAGMITE = 67, CV_RAIZES = 68, CV_COGUMELO = 69, CV_DRUSA = 70, CV_SEIXOS = 71, CV_CASULO = 72, CV_FIOS = 73;
// back walls
const WCV_TERRA = 13, WCV_ROCHA = 14, WCV_CALCITA = 15, WCV_TEIA = 16, WCV_XISTO = 17;
// far layer (DEEPT)
const DP_CV_TERRA = 10, DP_CV_ROCHA = 11, DP_CV_ESTALAC = 12, DP_CV_TEIA = 13;

// metres below the village floor -> tile row, and back
const cvY = d => CV_S0 + d;
const cvDepth = ty => ty - CV_S0;
// which cave band a row is in: 0 grutas, 1 galerias, 2 ninho, 3 fundações, -1 above (surface) or 4 below (cathedral)
function caveBand(ty) { const d = ty - CV_S0; if (d < CV_BANDS[0]) return -1; for (let b = 0; b < 4; b++) if (d < CV_BANDS[b + 1]) return b; return 4; }
// hanging and standing decorations that fall when the block holding them breaks (56 wires it into propsLoseSupport)
const CV_HANGS = new Uint8Array(NT), CV_STANDS = new Uint8Array(NT);
// set while the world is built: where the portal's stairway ends (45 builds it), and the grottos whose
// right-hand wall opens onto a ruined stairway down to the cathedral's atrium ([x, floor row], 45 builds the stairs)
let cavePortalEnd = null, caveExits = [];
