'use strict';

/* ================= the wide world: 3x wider (WW 300 -> 900, 2026-10-09) =================
   01-base sets WW and WSC (how many times wider than the old 300-tile ring); the generators of every layer (06, 45,
   56, 73, 84) multiply their world-wide counts by WSC: rooms, chambers, galleries, shafts, tunnels between bands,
   ore veins, chests. The things there is one of (the boss halls, the ways down) stay one or two, so the world is
   three times longer to walk round and the boss halls three times further apart.
   Here, last of all in generation: a check that every open pocket underground is joined to the village. Where a
   pocket of 30 or more open tiles is cut off, a passage is dug from it to the nearest open place that is joined:
   across first, then a climbable shaft (a chain, or a ladder in the mine and the abyss) up or down. Then the save: worlds of the
   old width are remade (wg 6); level, items, gold and the chest stay.
   Loads after 86 (wraps buildCathedral after everyone else) and before 47. */

function worldLink() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const open = i => !SOLID[tiles[i]] || tiles[i] === CV_TEIA;
  const reach = new Uint8Array(NN), st = [];
  const flood = s0 => { if (reach[s0] || !open(s0)) return; reach[s0] = 1; st.push(s0); while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && !reach[nb] && open(nb)) { reach[nb] = 1; st.push(nb); } } };
  flood(I(SPX, surf[SPX] - 2));
  const sacred = (x, y) => (typeof inPsHall === 'function' && (inPsHall(x, y, 3) || inPsNowhere(x, y, 1) || inPsLoop(x, y, 1) || inPsPrize(x, y, 1))) || (typeof inTeiaHall === 'function' && inTeiaHall(x, y, -3)) || (typeof inYetiHall === 'function' && inYetiHall(x, y, -3)) ||
    (typeof inThroneHall === 'function' && inThroneHall(x, y, -3)) || (typeof inRgHall === 'function' && inRgHall(x, y, -3)) || (typeof inAbHall === 'function' && inAbHall(x, y, -3)) ||
    (typeof inMaeHall === 'function' && inMaeHall(x, y, -3)) || (typeof inCdHall === 'function' && inCdHall(x, y, -3)) || (typeof inCmHall === 'function' && inCmHall(x, y, 1)) || (typeof inFpHall === 'function' && inFpHall(x, y, -3)) || (typeof inAnHall === 'function' && inAnHall(x, y, -3)) || (typeof inEsHall === 'function' && inEsHall(x, y, -3)) || (typeof inNvHall === 'function' && inNvHall(x, y, 1)) || (typeof inDgHall === 'function' && inDgHall(x, y, 1)) || (typeof inAtHall === 'function' && (inAtHall(x, y, 1) || inAtPrumo(x, y, 1))) || (typeof inTtHall === 'function' && inTtHall(x, y, -3)) || (typeof inMsHall === 'function' && inMsHall(x, y, 1)) || inVillage(x, y);
  const keepT = t => t === BEDROCK || (typeof PS_BARREIRA !== 'undefined' && (t === PS_BARREIRA || t === PS_NADA)) || (typeof IC_BARREIRA !== 'undefined' && t === IC_BARREIRA) || (typeof MN_BARREIRA !== 'undefined' && t === MN_BARREIRA) ||
    (typeof AB_BARREIRA !== 'undefined' && t === AB_BARREIRA) || (typeof FG_BARREIRA !== 'undefined' && t === FG_BARREIRA) || (typeof CD_BARREIRA !== 'undefined' && t === CD_BARREIRA) || (typeof CD_PEDRA_POCO !== 'undefined' && t === CD_PEDRA_POCO) || (typeof CM_LACRE !== 'undefined' && t === CM_LACRE) || (typeof FP_BARREIRA !== 'undefined' && (t === FP_BARREIRA || t === FP_TRONCO_G)) || (typeof AN_BARREIRA !== 'undefined' && (t === AN_BARREIRA || t === AN_COMPORTA)) ||
    (typeof ES_BARREIRA !== 'undefined' && (t === ES_BARREIRA || t === ES_PENUMBRA || t === ES_PENUMBRA_FIRME)) || (typeof NV_BARREIRA !== 'undefined' && t === NV_BARREIRA) || (typeof AT_BARREIRA !== 'undefined' && (t === AT_BARREIRA || t === AT_TRANSITO)) || (typeof EL_BARREIRA !== 'undefined' && (t === EL_BARREIRA || t === EL_ESPELHO || t === EL_LUA)) || (typeof DG_CORTINA !== 'undefined' && (t === DG_CORTINA || t === DG_OURO_QUENTE)) || (typeof TT_BARREIRA !== 'undefined' && t === TT_BARREIRA) || (typeof MS_BARREIRA !== 'undefined' && t === MS_BARREIRA) || t === LAVA;
  const kept = i => (typeof psKeep !== 'undefined' && psKeep.has(i)) || (typeof icLedge !== 'undefined' && icLedge.has(i)) || (typeof mnKeep !== 'undefined' && mnKeep.has(i)) || (typeof abKeep !== 'undefined' && abKeep.has(i)) || (typeof fungKeep !== 'undefined' && fungKeep.has(i)) || (typeof cdKeep !== 'undefined' && cdKeep.has(i)) || (typeof cmKeep !== 'undefined' && cmKeep.has(i)) || (typeof fpKeep !== 'undefined' && fpKeep.has(i)) || (typeof anKeep !== 'undefined' && anKeep.has(i)) || (typeof esKeep !== 'undefined' && esKeep.has(i)) || (typeof nvKeep !== 'undefined' && nvKeep.has(i)) || (typeof elKeep !== 'undefined' && elKeep.has(i)) || (typeof dgKeep !== 'undefined' && dgKeep.has(i)) || (typeof atKeep !== 'undefined' && atKeep.has(i)) || (typeof ttKeep !== 'undefined' && ttKeep.has(i)) || (typeof msKeep !== 'undefined' && msKeep.has(i));   // the fissure steps, the shafts' timbers, the rifts and bridges
  const dig = (x, y) => { const i = I(x, y); if (y < 2 || y >= WH - 4 || keepT(tiles[i]) || kept(i) || sacred(W1(x), y)) return; if (SOLID[tiles[i]]) tiles[i] = AIR; };
  const climb = y => typeof MS_CORDAME !== 'undefined' && typeof MS_S0 !== 'undefined' && y >= MS_S0 - 2 && y < MS_S0 + MS_D ? MS_CORDAME : typeof TT_ESCADA !== 'undefined' && typeof TT_S0 !== 'undefined' && y >= TT_S0 - 2 && y < TT_S0 + TT_D ? TT_ESCADA : typeof DG_ESCADA !== 'undefined' && typeof DG_S0 !== 'undefined' && DG_S0 && y >= DG_S0 - 2 && y < DG_S0 + DG_D ? DG_ESCADA : typeof AT_ESCADA !== 'undefined' && typeof AT_S0 !== 'undefined' && y >= AT_S0 - 2 && y < AT_S0 + AT_D ? (antigosBand(y) === 3 ? AT_CORRENTE : AT_ESCADA) : typeof PS_ESCADA !== 'undefined' && typeof PS_S0 !== 'undefined' && PESADELO && y >= PS_S0 - 2 && y < PS_S0 + PS_D ? PS_ESCADA : typeof ES_CORRENTE !== 'undefined' && typeof ES_S0 !== 'undefined' && y >= ES_S0 - 2 ? (escuroBand(y) === 2 ? ES_RAIZ_PEND : ES_CORRENTE) : typeof NV_ESCADA !== 'undefined' && typeof NV_S0 !== 'undefined' && y >= NV_S0 - 2 && y < NV_S0 + NV_D ? NV_ESCADA : typeof EL_ESCADA !== 'undefined' && typeof EL_S0 !== 'undefined' && y >= EL_S0 - 2 && y < EL_S0 + EL_D ? EL_ESCADA : typeof CM_ESCADA_FAVO !== 'undefined' && typeof CM_S0 !== 'undefined' && y >= CM_S0 - 2 && y < CM_S0 + CM_D ? CM_ESCADA_FAVO : typeof AB_ESCADA !== 'undefined' && typeof AB_S0 !== 'undefined' && AB_S0 && y >= AB_S0 - 2 ? AB_ESCADA : typeof AN_ESCADA !== 'undefined' && typeof AN_S0 !== 'undefined' && y >= AN_S0 - 2 ? AN_ESCADA : typeof FP_RAIZ_ESCADA !== 'undefined' && typeof FP_S0 !== 'undefined' && y >= FP_S0 - 2 ? FP_RAIZ_ESCADA : typeof CD_ESCADA !== 'undefined' && typeof CD_S0 !== 'undefined' && y >= CD_S0 - 2 ? CD_ESCADA : typeof FG_ESCADA !== 'undefined' && typeof FG_S0 !== 'undefined' && y >= FG_S0 - 2 ? FG_ESCADA : typeof MN_ESCADA !== 'undefined' && typeof MN_S0 !== 'undefined' && y >= MN_S0 - 2 ? MN_ESCADA : CHAIN;
  // the cut-off pockets, biggest first
  const lab = new Int32Array(NN).fill(-1), comps = [];
  for (let s = 0; s < NN; s++) {
    if (lab[s] >= 0 || reach[s] || !open(s)) continue;
    const y0 = (s / WW) | 0; if (y0 < surf[s % WW] + 6) { lab[s] = -2; continue; }   // open sky is not a pocket
    const id = comps.length, cells = [s]; lab[s] = id;
    for (let h = 0; h < cells.length; h++) { const c = cells[h], x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && lab[nb] === -1 && !reach[nb] && open(nb)) { lab[nb] = id; cells.push(nb); } }
    comps.push(cells);
  }
  comps.sort((a, b) => b.length - a.length);
  let links = 0;
  for (const cells of comps) {
    if (cells.length < 30 || reach[cells[0]] || links >= 80) continue;
    // breadth-first out through the rock from the whole pocket to the nearest joined open tile
    const org = new Int32Array(NN).fill(-1), q = cells.slice(); for (const c of cells) org[c] = c;
    let hit = null;
    for (let h = 0; h < q.length && !hit; h++) {
      const c = q[h], x = c % WW, row = c - x;
      for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
        if (nb < 0 || nb >= NN || org[nb] >= 0) continue;
        if (reach[nb]) { hit = [org[c], nb]; break; }
        const ny = (nb / WW) | 0; if (ny >= WH - 4 || keepT(tiles[nb])) continue;
        org[nb] = org[c]; q.push(nb);
      }
    }
    if (!hit) continue;
    // across at the pocket's height (3 tall), then a shaft with something to climb
    const ax = hit[0] % WW, ay = (hit[0] / WW) | 0, bx = ax + wdx(hit[1] % WW - ax), by = (hit[1] / WW) | 0;
    const step = bx >= ax ? 1 : -1;
    for (let x = ax; x !== bx + step; x += step) for (let y = ay - 2; y <= ay; y++) dig(x, y);
    if (by !== ay) {
      const ya = Math.min(ay, by) - 2, yb = Math.max(ay, by);
      for (let y = ya; y <= yb; y++) { dig(bx, y); dig(bx + step, y); }
      for (let y = ya; y <= yb; y++) { const i = I(bx, y); if (tiles[i] === AIR && !sacred(W1(bx), y)) tiles[i] = climb(y); }
    }
    links++;
    flood(hit[0]); flood(I(bx, by));
  }
  // anything left standing on, or hanging from, a tile that was dug away comes down (not the ropes and ladders put on
  // drops on purpose, nor what a layer keeps)
  const rope = t => (typeof MS_CORDAME !== 'undefined' && (t === MS_CORDAME || t === MS_CORRENTE || t === MS_ESTACA)) || (typeof PS_ESCADA !== 'undefined' && (t === PS_ESCADA || t === PS_CORDA)) || (typeof CM_ESCADA_FAVO !== 'undefined' && (t === CM_ESCADA_FAVO || t === CM_FIO_CERA || t === CM_COLUNA)) || (typeof FG_CORDAO !== 'undefined' && t === FG_CORDAO) || (typeof CD_ESCADA !== 'undefined' && (t === CD_ESCADA || t === CD_CORRENTE)) || (typeof FP_CIPO !== 'undefined' && (t === FP_CIPO || t === FP_RAIZ_ESCADA)) || (typeof AN_ESCADA !== 'undefined' && (t === AN_ESCADA || t === AN_CORRENTE)) || (typeof ES_CORRENTE !== 'undefined' && (t === ES_CORRENTE || t === ES_RAIZ_PEND)) || (typeof NV_ESCADA !== 'undefined' && (t === NV_ESCADA || t === NV_CABO || t === NV_FEIXE || t === NV_ESCORA)) || (typeof EL_ESCADA !== 'undefined' && (t === EL_ESCADA || t === EL_CIPO || t === EL_COLUNA)) || (typeof DG_ESCADA !== 'undefined' && (t === DG_ESCADA || t === DG_CORDA)) || (typeof AT_ESCADA !== 'undefined' && (t === AT_ESCADA || t === AT_CORRENTE || t === AT_COLUNA)) || (typeof TT_ESCADA !== 'undefined' && (t === TT_ESCADA || t === TT_TENDAO || t === TT_COLUNA));
  for (let sweep = 0, ch = true; ch && sweep < 8; sweep++) { ch = false;
    for (let i = WW * 2; i < NN - WW; i++) { const t = tiles[i], u = tiles[i - WW], d = tiles[i + WW]; if (((CV_STANDS[t] && !SOLID[d] && d !== t) || (CV_HANGS[t] && !SOLID[u] && u !== t)) && !rope(t) && !kept(i)) { tiles[i] = AIR; ch = true; } } }
  let drop = false; for (let k = PROPS.length - 1; k >= 0; k--) { const p = PROPS[k]; if (p.sup.length && p.sup.some(i => !SOLID[tiles[i]])) { PROPS.splice(k, 1); drop = true; } }
  if (drop) { propBuckets.clear(); propBySup.clear(); const keep = PROPS.slice(); PROPS.length = 0; for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup); }
  return links;
}
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); try { worldLink(); } catch (err) { console.error(err); } }; }

/* ---------- the save: worlds of the old width are remade; level, items, gold and the chest stay ---------- */
let wideNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.wg = 6; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 6) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
    wideNews = !!v.p && v.wrap === 1;
  }
  v.wg = 5; const r = _ms(v); if (r) r.wg = 6; return r;   // 84 knows world 5
}; }
HOOK.update.push(() => {
  if (wideNews && state === 'play') { wideNews = false; setTimeout(() => toast('Novidade: o mundo ficou três vezes mais largo, em todas as camadas. Ele foi refeito; seu nível, itens e ouro continuam.', 'gold'), 900); }
});
