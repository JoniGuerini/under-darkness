'use strict';

/* ================= the abandoned mine: shared ids, bands and depths =================
   The fourth layer, under the ice (docs/biomas.md part 5, docs/mina-spec.md). Long ago men dug down through the
   frozen rock after gold and crystal: timbered galleries with rails, shafts with ladders and scaffolds, great
   stopes, and at the bottom the furnaces where they smelted the ore. They never came back up. Goblins found it
   later and made it theirs. Files:
     79-mina-api       this file: ids, bands, depth helpers
     80-mina-blocos    block, back wall, far-layer and decoration textures, ores, block items, the climbable ladder
     81-mina-objetos   props (carts on rails, a winch, crates, powder kegs, bunks, the goblins' tents and loot...)
     82-mina-bichos    the dead miner, the haunted cart, firedamp, the haunted lantern, the false vein, the ore
                       golem and the mole rat: art, AI, drops
     83-mina-goblins   the goblin thief and the goblin foreman (the dynamiter comes from 76-cavernas-novos)
     84-mina-mundo     world generation, the shafts down from the ice, dressing, zones, levels, loot, save
     85-rei-goblin     the boss: the Rei Goblin on his Escavadeira
   Loads after 78-gelo-novos (and before 49, so the monsters get the same BAL scaling). */

const MINA = true;
const MN_D = 186;                                  // metres of mine
const MN_TOP = (typeof IC_TOP !== 'undefined' ? IC_TOP : 372) + 186;   // where the mine starts, metres below the village floor (under the ice)
// band tops in metres below MN_TOP: Galerias Escoradas, Poços e Andaimes, Acampamento Goblin, Fornalhas Esquecidas, (bedrock)
const MN_BANDS = [0, 46, 98, 150, 186];
const MN_BAND_NAMES = ['galerias', 'pocos', 'acampamento', 'fornalhas'];
const MN_ZONE0 = ZONE_NAMES.length;                // zone ids 17..20 (84 pushes the names)
let MN_S0 = IC_S0 + IC_D;                          // the first mine row of the current world (set by mnBuild)

// foreground blocks (solid)
// banded iron rock (red jasper and black iron oxide), loose tailings the miners dumped, rubble, mine planks, timber
// beams, rock worked by picks, furnace brick, slag, quartzite (where the gold is), and the boss hall's iron gate
const MN_FERROSA = 94, MN_REJEITO = 95, MN_ENTULHO = 96, MN_TABUA = 97, MN_VIGA = 98, MN_CAVADA = 99, MN_TIJOLO = 100, MN_ESCORIA = 101, MN_QUARTZITO = 102, MN_BARREIRA = 103;
// the ores again, set in the iron rock (same items as COAL, IRON, GOLD, CRYSTAL)
const MN_O_CARVAO = 104, MN_O_FERRO = 105, MN_O_OURO = 106, MN_O_CRISTAL = 107;
const MN_O_COBALTO = 124;   // cobalt, the mine's metal (2026-10-09); crystal stays as a rarer gem
// one-block decorations (not solid): the timber props (floor to roof, like the ice columns), rails on the gallery
// floors, a miner's lantern on a hook, the ladders (climbed like chains), tools left lying, a heap of stones, a
// rope hanging down a shaft (climbed too), a glowing lump of slag, a goblin's skull-on-a-stick
const MN_ESCORA = 108, MN_TRILHO = 109, MN_LAMPIAO = 110, MN_ESCADA = 111, MN_FERRAMENTA = 112, MN_PEDRAS = 113, MN_CORDA = 114, MN_BRASA = 115, MN_ESTACA = 116;
// back walls
const WMN_FERROSA = 23, WMN_TABUADO = 24, WMN_CAVADA = 25, WMN_TIJOLO = 26, WMN_QUARTZITO = 27;
// far layer (DEEPT)
const DP_MN_ROCHA = 18, DP_MN_ANDAIME = 19, DP_MN_FORNALHA = 20;

// metres below the top of the mine -> tile row
const mnY = d => MN_S0 + d;
// which band a row is in: 0 galerias, 1 poços, 2 acampamento, 3 fornalhas, -1 above (ice) or 4 below (bedrock)
function mineBand(ty) { const d = ty - MN_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < MN_BANDS[b + 1]) return b; return 4; }
// set while the world is built: the two shafts down from the ice ([x, row] of the shaft's top) and the boss hall
let mnExits = [], mnBoss = null;
