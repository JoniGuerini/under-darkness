'use strict';

/* ================= o Abismo: shared ids, bands and depths =================
   The last layer (129-camadas: the seventh since 2026-10-10, under the sunken city; docs/abismo-spec.md). The miners dug too deep: under the furnaces the
   rock turns hot, then soft, then red, and opens onto a world that is not this one: rivers of fire, bridges of
   black iron, cathedrals of living flesh and, at the bottom, the throne the Prince of Chaos sends his kind up from.
   It replaces the old crypt in the caves (the square room with imps, hounds, demons and the Carrasco), which is gone.
   Files:
     103-abismo-api         this file: ids, bands, depth helpers
     104-abismo-blocos      block, back wall, far-layer and decoration textures, ores, block items, ladder and chain
     105-abismo-objetos     props (broken gates, demon statues, cages, cauldrons, altars, flesh, bones...) and the throne
     106-abismo-demonios    imp, hellhound, brute, magma worm, lost soul
     107-abismo-demonios2   flesh crawler, possessed cultist, gargoyle, plague swarm, lava salamander
     108-abismo-mundo       world generation, the rifts down from the mine, dressing, zones, levels, loot, save
     109-principe-caos      the boss: the Prince of Chaos on the Trono do Caos
     110-infernita          the fifth metal at the forge
   Loads after 86-sapo-grutas and before 87-mundo-largo (whose worldLink must run after the abyss is built). */

const ABISMO = true;
const AB_D = 186;                                   // metres of abyss
// the abyss is always the last layer (129-camadas): it starts under whatever layer is above it, today the fungal mines (120)
const AB_FUNGO = typeof FUNGO !== 'undefined' && FUNGO, AB_CIDADE = typeof CIDADE !== 'undefined' && CIDADE, AB_FLORESTA = typeof FLORESTA !== 'undefined' && FLORESTA, AB_ANOES = typeof ANOES !== 'undefined' && ANOES, AB_COLMEIA = typeof COLMEIA !== 'undefined' && COLMEIA, AB_NAVE = typeof NAVE !== 'undefined' && NAVE;
const AB_TOP = (AB_NAVE ? NV_TOP : AB_COLMEIA ? CM_TOP : AB_ANOES ? AN_TOP : AB_FLORESTA ? FP_TOP : AB_CIDADE ? CD_TOP : AB_FUNGO ? FG_TOP : typeof MN_TOP !== 'undefined' ? MN_TOP : 558) + 186;   // where the abyss starts, metres below the village floor (930)
// band tops in metres below AB_TOP: Portões de Cinza, Rios de Fogo, As Entranhas, Trono do Caos, (bedrock)
const AB_BANDS = [0, 46, 98, 150, 186];
const AB_BAND_NAMES = ['portoes', 'rios', 'entranhas', 'trono'];
const AB_ZONE0 = ZONE_NAMES.length;                 // zone ids 21..24 (108 pushes the names)
let AB_S0 = AB_NAVE ? NV_S0 + NV_D : AB_COLMEIA ? CM_S0 + CM_D : AB_ANOES ? AN_S0 + AN_D : AB_FLORESTA ? FP_S0 + FP_D : AB_CIDADE ? CD_S0 + CD_D : AB_FUNGO ? FG_S0 + FG_D : MN_S0 + MN_D;   // the first abyss row of the current world (set by abBuild)
// the layer right above: its first row and depth, its natural ground (the abyss's ash creeps into it), the rock its
// last rows thin out into, and the halls the two rifts open from
const abAbove = () => AB_NAVE ? { S0: NV_S0, D: NV_D, soils: NV_SOILS, thin: NV_REATOR, thinW: WNV_REATOR, halls: nvExits, boss: nvBoss }
  : AB_COLMEIA ? { S0: CM_S0, D: CM_D, soils: CM_SOILS, thin: CM_CERA_REAL, thinW: WCM_REAL, halls: cmExits, boss: cmBoss }
  : AB_ANOES ? { S0: AN_S0, D: AN_D, soils: AN_SOILS, thin: AN_GRANITO, thinW: WAN_GRANITO, halls: anExits, boss: anBoss }
  : AB_FLORESTA ? { S0: FP_S0, D: FP_D, soils: FP_SOILS, thin: FP_GRANITO, thinW: WFP_GRANITO, halls: fpExits, boss: fpBoss }
  : AB_CIDADE ? { S0: CD_S0, D: CD_D, soils: CD_SOILS, thin: CD_ATERRO, thinW: WCD_TIJOLO, halls: cdDown, boss: cdBoss }
  : AB_FUNGO ? { S0: FG_S0, D: FG_D, soils: FG_SOILS, thin: FG_CARNE, thinW: WFG_CARNE, halls: fungDown, boss: fungBoss }
  : { S0: MN_S0, D: MN_D, soils: MN_SOILS, thin: MN_ESCORIA, thinW: WMN_TIJOLO, halls: mnChambers.filter(c => c.kind === 'fornalha' && !c.boss && c.fy), boss: mnBoss };

// foreground blocks (solid): ash rock, basalt, obsidian, magma crust (glowing cracks), living flesh, packed bone,
// brimstone, black iron (bridges and platforms), hell brick (ruins and temples), chaos stone, the boss hall's gate
const AB_CINZA = 128, AB_BASALTO = 129, AB_OBSIDIANA = 130, AB_CROSTA = 131, AB_CARNE = 132, AB_OSSO = 133, AB_ENXOFRE = 134, AB_FERRO_NEGRO = 135, AB_TIJOLO = 136, AB_CAOS = 137, AB_BARREIRA = 138;
// the ores: coal in the basalt, infernite (the abyss's own metal) in basalt and chaos stone
const AB_O_CARVAO = 139, AB_O_INFERNITA = 140;
// one-block decorations (not solid): a hanging chain (climbed), bone spikes, a brazier, a flame on the floor, a heap of
// skulls, an obsidian stalagmite, a flesh tendril hanging down, a glowing rune, a chaos crystal, the black-iron ladder
// (climbed), a butcher's hook on a chain, a basalt column (floor to roof)
const AB_CORRENTE = 141, AB_ESPINHOS = 142, AB_BRASEIRO = 143, AB_CHAMA = 144, AB_CRANIOS = 145, AB_ESTALAG = 146, AB_TENTACULO = 147, AB_RUNA = 148, AB_CRISTAL = 149, AB_ESCADA = 150, AB_GANCHO = 151, AB_COLUNA = 152;
// back walls
const WAB_CINZA = 28, WAB_BASALTO = 29, WAB_CARNE = 30, WAB_TIJOLO = 31, WAB_CAOS = 32;
// far layer (DEEPT)
const DP_AB_ROCHA = 21, DP_AB_RUINAS = 22, DP_AB_CARNE = 23;

// metres below the top of the abyss -> tile row
const abY = d => AB_S0 + d;
// which band a row is in: 0 portões, 1 rios, 2 entranhas, 3 trono, -1 above (mine) or 4 below (bedrock)
function abyssBand(ty) { const d = ty - AB_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < AB_BANDS[b + 1]) return b; return 4; }
// set while the world is built: the two rifts down from the mine ({ x0, fy, top }: ladder column x0 + 1) and the boss hall
// abBoss = { x0, x1, w, h, top, fy, cx } like mnBoss: the hall spans cx - w/2 .. cx + w/2 - 1, rows top .. fy - 1, floor row fy
let abExits = [], abBoss = null;
