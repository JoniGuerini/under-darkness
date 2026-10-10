'use strict';

/* ================= the abandoned cathedral: shared ids, registries and hooks =================
   The cathedral is the only layer under the village for now (the old caves stay in the code but
   are not generated while CATEDRAL is on). Three files paint into it:
     42-catedral-blocos  block, back wall and far-layer textures, block items
     43-catedral-objetos props (pews, statues, stained glass...) registered with defProp
     44-mortos-vivos     the undead: art, animation, AI, drops
   and 45-catedral-mundo builds the world and places everything. See docs/catedral-spec.md. */

const CATEDRAL = true;

// foreground blocks (solid)
const CT_CALCARIO = 30, CT_CALC_TERRA = 31, CT_CANTARIA = 32, CT_LAJE = 33, CT_MOSAICO = 34, CT_RUINA = 35, CT_ESCOMBRO = 36, CT_CRIPTA = 37, CT_OSSARIO = 38, CT_MARMORE_NEGRO = 39, CT_GRADE = 40;
// foreground decorations (not solid, one block)
const CT_COLUNA = 41, CT_RAIZ = 42, CT_CACOS = 43, CT_CRANIOS = 44, CT_VELAS = 45, CT_TEIA = 46;
// back walls (walls[])
const WCT_CALCARIO = 5, WCT_CANTARIA = 6, WCT_REBOCO = 7, WCT_PAINEL = 8, WCT_CRIPTA = 9, WCT_OSSARIO = 10;
// far layer (DEEPT[])
const DP_CT_ALVENARIA = 6, DP_CT_ABOBADA = 7, DP_CT_CALCARIO = 8, DP_CT_CRIPTA = 9;

// a solid block you can see the back wall through (iron grate)
const SEETHRU = new Uint8Array(NT); SEETHRU[GATE] = 1;
// DECO_PICK[t] = (gx, gy, arr) => sprite: which variation of a one-block decoration to draw here
const DECO_PICK = {};
// WICKS[t] = [[[x, y], ...] per variation]: candle wicks inside a one-block decoration that emits light (flames are animated on top)
const WICKS = {};

/* ---------- props: big decorations baked into the chunk images ---------- */
const PROP_DEFS = {};
function propPixels(cv) {
  const w = cv.width, h = cv.height, d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data, px = new Uint32Array(w * h);
  for (let k = 0; k < w * h; k++) { const a = d[k * 4 + 3]; px[k] = a < 128 ? 0 : pack(d[k * 4], d[k * 4 + 1], d[k * 4 + 2]); }
  return { w, h, px };
}
function defProp(id, def) {
  const v = (def.variantes || []).map(propPixels);
  if (!v.length) return;
  PROP_DEFS[id] = Object.assign({ apoio: 'chao', camada: 'frente', faixas: null, luz: null, chamas: null, brilho: '#ffb060' }, def, { id, vars: v });
}

/* ---------- monsters ---------- */
const DRAW_E = {}, EYES_E = {}, WARN_E = {}, BLOCK_E = {};
const HOOK = { update: [], drawWorld: [], drawGlow: [], drawTop: [] };
function runHooks(list, a, b) { for (let i = 0; i < list.length; i++) { try { list[i](a, b); } catch (err) { console.error(err); } } }
