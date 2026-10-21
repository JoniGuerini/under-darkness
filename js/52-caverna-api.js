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
const CAVE_D = CAVERNA ? LAYER_D : 0;                 // metres of caves between the village floor and the cathedral's atrium
// band tops in metres below the village floor: Grutas Rasas, Galerias de Pedra, O Ninho, Fundações Soterradas, (cathedral)
const CV_BANDS = [6, 60, 120, 168, 186].map(v => v * LAYER_K);
const CV_BAND_NAMES = ['grutas', 'galerias', 'ninho', 'fundacoes'];
const CV_ZONE0 = 9;                               // zone ids 9..12 (ZONE_NAMES in 10-combate gets them in 56)
let CV_S0 = 46;                                   // the village floor row of the current world (set by buildCaves)
// monster level in a layer below the caves (Jonathan 2026-10-10): every layer starts 1 above the last level of the one above it.
// lo on the top half, lo + 1 from the middle of the layer down (d: rows below its top); 30% come 1 higher but never past the layer's top (caves 1-4, then layerLo in 129: cathedral 5-6, ice 7-8, mine 9-10, fungal mines 11-12, abyss 13-14)
function layerLvl(lo, d) { const n0 = nvDe(lo), k = Math.min(3, Math.floor(4 * Math.max(0, d) / LAYER_D)); return lvlPw(Math.min(n0 + 3, n0 + k + (Math.random() < 0.3 ? 1 : 0))); }   // 2026-10-21: 4 níveis vistos por camada (5N-4 a 5N-1), um a cada quarto da altura; devolve a força (129)

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

// staggered rock shelves in the tall open wells of a cave layer (Jonathan 2026-10-12: "tá gerando muito penhasco ... meio termo").
// cv: 1 = carved, rows y0..y1-1. In any open span at least 12 wide whose column drops 16 rows or more, every 10 rows a row of
// 6-wide shelves, and 5 rows under it shelves in the gaps of that row: you land on one within 9 rows, and can jump back up
// shelf by shelf. Narrower shafts are left to 313. skip(x, y): rows to leave alone (boss halls). Call it after the cleanup
// of floating islands (the shelves are islands on purpose).
function caveShelves(cv, y0, y1, s, skip) {
  const H = y1 - y0, top = new Uint16Array(WW * H), len = new Uint16Array(WW * H), W1 = x => ((x % WW) + WW) % WW;
  for (let x = 0; x < WW; x++) for (let y = y0, a = -1; y <= y1; y++) {
    const open = y < y1 && cv[y * WW + x];
    if (open && a < 0) a = y;
    if (!open && a >= 0) { for (let k = a; k < y; k++) { const j = (k - y0) * WW + x; top[j] = k - a; len[j] = y - a; } a = -1; }
  }
  const put = [];
  for (let y = y0 + 4; y < y1 - 4; y++) {
    for (let x0 = 0; x0 < WW;) {
      if (!cv[y * WW + x0]) { x0++; continue; }
      let x1 = x0; while (x1 + 1 < WW && cv[y * WW + x1 + 1]) x1++;
      if (x1 - x0 + 1 >= 12) for (let x = x0 + 1; x < x1; x++) {
        const j = (y - y0) * WW + x; if (len[j] < 16 || top[j] < 4 || len[j] - top[j] <= 4 || (skip && skip(x, y))) continue;
        const off = (hash2(x / 48 | 0, 7, s) * 10) | 0, ph = (y + off) % 10; if (ph !== 0 && ph !== 5) continue;
        const pair = ((y + off) / 10) | 0, a = (((x + pair * 3) / 6) | 0) % 2 === 0;
        if (a === (ph === 0)) put.push(y * WW + x);
      }
      x0 = x1 + 1;
    }
  }
  for (const i of put) cv[i] = 0;
  return put.length;
}
