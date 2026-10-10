'use strict';

/* ================= the ice caves: shared ids, bands and depths =================
   The third layer, under the cathedral's crypts (docs/biomas.md part 4, docs/gelo-spec.md). Files:
     69-gelo-api        this file: ids, bands, depth helpers
     70-gelo-blocos     block, back wall, far-layer and decoration textures, ores in the ice, block items, slippery ice
     71-gelo-objetos    props (ice columns, a frozen explorer, mammoth bones, the yetis' fire, a giant in the ice...)
     72-gelo-bichos     yeti, frost wolf, blizzard spirit, frost worm, ice sentinel, icy slime: art, AI, drops
     73-gelo-mundo      world generation, the way down from the crypts, dressing, zones, levels, loot, save
     74-yeti-ancestral  the boss: the Trono de Gelo, the fight, the drop
   Loads right after 57-mae-teia (and before 49, so the monsters get the same BAL scaling). */

const GELO = true;
const IC_D = 186;                                 // metres of ice
const IC_TOP = (typeof CAVE_D !== 'undefined' ? CAVE_D : 0) + 186;   // where the ice starts, metres below the village floor (under the crypts)
// band tops in metres below IC_TOP: Fendas Geladas, Salões de Gelo Azul, Covis dos Yetis, Coração do Inverno, (bedrock)
const IC_BANDS = [0, 46, 104, 156, 186];
const IC_BAND_NAMES = ['fendas', 'saloes', 'covis', 'coracao'];
const IC_ZONE0 = ZONE_NAMES.length;               // zone ids 13..16 (73 pushes the names)
let IC_S0 = 46 + IC_TOP;                          // the first ice row of the current world (set by icBuild)

// foreground blocks (solid)
const IC_NEVE = 74, IC_NEVE_DURA = 75, IC_GELO = 76, IC_GELO_AZUL = 77, IC_PERMA = 78, IC_ROCHA = 79, IC_GELO_NEGRO = 80, IC_CALC_GELO = 81;
// the ores again, set in the frozen rock (same items as IRON, GOLD, CRYSTAL)
const IC_O_FERRO = 82, IC_O_OURO = 83, IC_O_CRISTAL = 84, IC_O_CARVAO = 123;   // 123: coal in frozen rock (102)
// one-block decorations (not solid)
const IC_SINCELO = 85, IC_ESTALAG = 86, IC_CRISTAL = 87, IC_CRISTAL_TETO = 88, IC_NEVE_MONTE = 89, IC_OSSOS = 90;
// the boss hall's wall of ice (solid, unbreakable while the fight lasts), the glowing ice veins, and the ice
// columns of the great halls (not solid; like the cathedral's, they run floor to roof and fall whole)
const IC_BARREIRA = 91, IC_VEIO = 92, IC_COLUNA = 93;
// back walls
const WIC_CALC = 18, WIC_ROCHA = 19, WIC_GELO = 20, WIC_NEVE = 21, WIC_NEGRO = 22;
// far layer (DEEPT)
const DP_IC_ROCHA = 14, DP_IC_GELO = 15, DP_IC_SINCELOS = 16, DP_IC_NEGRO = 17;

// metres below the top of the ice -> tile row, and back
const icY = d => IC_S0 + d;
// which band a row is in: 0 fendas, 1 salões, 2 covis, 3 coração, -1 above (cathedral) or 4 below (bedrock)
function iceBand(ty) { const d = ty - IC_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < IC_BANDS[b + 1]) return b; return 4; }
// ice you slide on (70 fills it, 73 reads it under the hero)
const IC_SLIP = new Uint8Array(NT);
// set while the world is built: the two ways down from the crypts ([x, row] of the fissure's foot) and the boss hall
let icExits = [], icBoss = null;
