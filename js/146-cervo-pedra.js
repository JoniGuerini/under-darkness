'use strict';

/* ================= O Cervo de Pedra: the boss of A Floresta Petrificada =================
   The Clareira dos Troncos Gigantes that 145 cuts in the Clareira dos Gigantes (fpBoss: 120 x 24 of air, a crystal
   gravel floor, a ceiling of roots, 4-tall mouths at both ends, seven giant trunks of 4 from floor to ceiling, a rift
   of 10 in the middle). fpDress (145 calls it) dresses it: each giant trunk stands on its roots with an arch under it
   (3 tall: the hero walks under the trunks, the stag is far too big to), two roots rise out of the rift to jump on,
   crystal spikes at the rift's bottom, drusas and fallen crystal leaves.
   The last beast of the forest that remembers the sun: a stag the size of a house, granite skin furred with moss,
   antlers of root. Step into the clearing and the Muralha de Raízes shuts both mouths (leaving, by portal or by
   dying, resets it all: the clearing is kept as a mold, fpBossMold, and written back cell by cell, the trunks back up).
   Three phases, every blow shown before it lands:
     1. the run (100% to 60%): the charge (scrapes the hoof twice, lowers the antlers with green sparks at the tips,
        runs straight to the wall; any giant trunk in the way cracks a second before he reaches it, white crack
        climbing, and falls the way he runs: it becomes a lying platform, sloped, leaning on the next trunk or on the
        floor); the kick (the hind legs glow 0.5 s when the hero is behind him); the rear (up on the hind legs 0.7 s,
        then the front hooves come down: a wave runs 6 blocks each way along the floor; jump it or stand on a trunk).
     2. the flight above (60% to 25%): the antlers flower in crystal. He runs to the far end and leaps up onto the
        lying trunks, staying high; he only comes down when the hero gets close, then runs to the other end. The leaf
        rain (he shakes the antlers; shadows on the ground 1 s before the crystal leaves fall) and the bellow (the
        antlers flash 3 times and the 2 standing trunks nearest the hero crack and fall).
     3. the heart (25% to 0): the skin cracks and the crystal heart shows on the chest (blows there do +50%). He
        leaps from lying trunk to lying trunk and each one he lands on cracks and breaks to gravel (never the last
        two); the dive (from high up, the antlers lower and a line of crystal chips marks the diagonal on the ground
        0.8 s before he comes down along it); every 3 charges or dives he stops 2 s, head low, panting.
   The rift: falling in hurts and puts the hero back on the nearest edge (never kills). The lying trunks are walked
   up like ramps (149: TRQ_RAMP); they always leave 2 blocks under them, so the floor stays open end to end.
   After the kill every giant still standing falls too and they all stay as they fell (diffs). Drops the Galhada do
   Cervo de Pedra (legendary head: +10% speed; running 1 s without stopping charges a lunge: the next blow throws far
   and does +50%; a faint crystal light) and, half the time, one of the layer's three bases. His death is saved
   (cervo) and fpBoss.dead tells the ambience (97) to stop the far hooves.
   Plugs in like the Sineiro (137): fpDress, endBossFight, hitEnemy, killEnemy, breakTile, recalc, makeSave and
   newWorld are wrapped; the rest through AI/DRAW_E/HOOK. Uses 149 for the falling trunks. Loads after 148. */

const FP_L = layerBossLvl('floresta');
const CER = { hp: Math.round(330 * (1 + 0.3 * (FP_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (FP_L - 1))), xp: 520, p2: 0.6, p3: 0.25, spd: 300, wave: 0.6, fall: 0.7 };
const cerState = { dead: false };
let fpBossMold = null, cerBoss = null;
ET.cervo = { name: 'O Cervo de Pedra', w: 60, h: 54, hp: CER.hp, dmg: CER.dmg, xp: CER.xp, kb: 0, fly: true, phase: true, blood: '#566a5a', boss: true };
const CER_DROPS = [['galhada_cervo', 1], ['pocao', 1, 2, 4], ['min_platina', 1, 6, 10], ['folha_cristal', 1, 2, 4], ['casca_petrea', 1, 2, 4], ['olho_prisma', 0.5, 1, 2]];
DROPS.cervo = CER_DROPS.filter(([id]) => ITEMS[id]);
const cerFx = { gates: [], waves: [], leaves: [], dive: null, cracks: [], bars: [], sparks: 0 };
const FP_ARCH = 3;   // the arch under each standing giant (rows above the floor)

/* ---------- the lying giants: three blocks (lengthwise, rising to the right, rising to the left) ---------- */
const FP_TRONCO_D = 346, FP_TRONCO_DR = 347, FP_TRONCO_DL = 348;
{
  const { barkV, cn } = FPART;
  // the giant's bark turned to lie along the trunk: furrows run with it, plates across it (seamless: integer shears)
  const lie = (fx) => bake((x, y) => { const [X, Y] = fx(x, y); const v = barkV(X, Y, 24, 26, 14641, 0.6); const m = cn(x, y, 8, 6, 14648); return m > 0.22 && v > 2 ? v - 0.6 : v; });
  const BK = { d: lie((x, y) => [y, x]), dr: lie((x, y) => [x + 2 * y, 2 * x - y + 240]), dl: lie((x, y) => [x - 2 * y + 480, 2 * x + y]) };
  for (const [t, k] of [[FP_TRONCO_D, 'd'], [FP_TRONCO_DR, 'dr'], [FP_TRONCO_DL, 'dl']]) {
    MAT[t] = [PALS.fpTroncoG, BK[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = 0; PCOL[t] = '#3a3028'; TRQ_RAMP[t] = 1;
  }
}
const fpLying = t => t === FP_TRONCO_D || t === FP_TRONCO_DR || t === FP_TRONCO_DL;

/* ---------- geometry ---------- */
const fpLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const fpPx = c => fpLap(c * T);                          // a column's left edge in world px near the hero
const fpCol = x => wrapX(Math.floor(x / T));
const fpRel = c => wdx(wrapX(c) - fpBoss.x0);           // column -> 0..w-1 inside the clearing
const fpI = (c, r) => r * WW + wrapX(c);
const fpFloorY = () => fpBoss.fy * T;
const fpStanding = k => { const B = fpBoss, Tr = B.trunks[k]; return tiles[fpI(Tr.x + 1, B.top + 4)] === FP_TRONCO_G; };
const fpInRift = c => { const r = wdx(wrapX(c) - fpBoss.rift.x0); return r >= 0 && r < fpBoss.rift.w; };
const cerPcx = () => pl.x + pl.w / 2;
function cerDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }

/* ---------- the dressing (145 calls fpDress during the build) ---------- */
function fpDress() {
  const B = fpBoss; if (!B) return;
  B.dead = cerState.dead;
  const put = (c, r, t) => { tiles[fpI(c, r)] = t; };
  // each giant on its roots: the arch under it
  for (const Tr of B.trunks) for (let j = 0; j < Tr.w; j++) for (let r = B.fy - FP_ARCH; r < B.fy; r++) { put(Tr.x + j, r, AIR); walls[fpI(Tr.x + j, r)] = WFP_CASCA; }
  // two roots rise out of the rift, one block over the floor, to jump on; spikes at the bottom are painted
  const rf = B.rift;
  for (const k of [3, 6]) for (let r = B.fy - 1; r < B.fy + rf.depth; r++) put(rf.x0 + k, r, FP_RAIZ);
  // drusas by the walls and the rift, fallen crystal leaves, pendants from the roof
  const R = mulberry32(seed ^ 0x51c3);
  const floorOk = c => !SOLID[tiles[fpI(c, B.fy - 1)]] && SOLID[tiles[fpI(c, B.fy)]] && !fpInRift(c) && !B.trunks.some(Tr => wdx(wrapX(c) - Tr.x) >= -1 && wdx(wrapX(c) - Tr.x) <= Tr.w);
  const lit = [1, B.w - 2, wdx(rf.x0 - B.x0) - 2, wdx(rf.x0 - B.x0) + rf.w + 1];
  for (let k = 0; k + 1 < B.trunks.length; k++) lit.push(Math.round((fpRel(B.trunks[k].x) + 4 + fpRel(B.trunks[k + 1].x)) / 2) + (k % 2 ? 2 : -2));   // one in each gap
  for (const rc of lit) { const c = B.x0 + rc; if (floorOk(c)) put(c, B.fy - 1, FP_DRUSA); }
  for (let n = 0; n < 26; n++) { const c = B.x0 + ((R() * B.w) | 0); if (floorOk(c) && tiles[fpI(c, B.fy - 1)] === AIR) put(c, B.fy - 1, R() < 0.8 ? FP_FOLHAS : FP_BROTO); }
  for (let n = 0; n < 16; n++) { const c = B.x0 + 2 + ((R() * (B.w - 4)) | 0); if (tiles[fpI(c, B.top)] === AIR && SOLID[tiles[fpI(c, B.top - 1)]]) put(c, B.top, FP_PINGENTE); }
  cerBarsReset();
}

/* ---------- the lying trunks: where each giant lies when it falls ----------
   From its own foot, rising 1 block every 2 columns the way it fell (2 thick, 1 at the low end), never lower than
   2 blocks over the floor, until it leans on something (a standing giant, another lying one, the wall). Nothing
   within reach: it lies along the floor at that same height (and reaches across the rift if it ends over it). */
const FP_LMAX = 20, FP_LFLAT = 18;
function fpLayCells(k, s, own) {
  const B = fpBoss, Tr = B.trunks[k], cs = s > 0 ? Tr.x : Tr.x + Tr.w - 1;
  const ownR = (c) => { const r = wdx(wrapX(c) - Tr.x); return r >= 0 && r < Tr.w; };
  const blocked = (c, r) => { if (r < B.top) return fpI(c, r); const i = fpI(c, r); if (own && own.has(i)) return -1; if (ownR(c) && tiles[i] === FP_TRONCO_G) return -1; return SOLID[tiles[i]] ? i : -1; };
  const inside = c => { const r = fpRel(c); return r >= 0 && r < B.w; };
  const run = (flat) => {
    const cells = []; let sup = -1;
    for (let j = 0; j < (flat ? FP_LFLAT + 12 : FP_LMAX); j++) {
      const c = cs + s * j; if (!inside(c)) { sup = fpI(c, B.fy - 3); break; }
      if (flat && j >= FP_LFLAT && !fpInRift(c) && !fpInRift(c - s)) break;   // past its length, and not hanging over the rift
      // the top surface's height over the floor and the thickness: the underside never comes lower than 2
      const th = j < 2 || (flat && j >= FP_LFLAT - 2 && !fpInRift(c)) ? 1 : 2, top = flat ? 2 + th : 3 + (j >> 1);
      let hit = -1; const add = [];
      for (let q = 0; q < th && hit < 0; q++) { const r = B.fy - top + q, h = blocked(c, r); if (h >= 0) hit = h; else add.push(fpI(c, r)); }
      if (hit >= 0) { sup = hit; break; }
      cells.push(...add);
    }
    return { cells, sup };
  };
  let L = run(false), tile = s > 0 ? FP_TRONCO_DR : FP_TRONCO_DL;
  if (L.sup < 0 || L.cells.length < 10) { L = run(true); tile = FP_TRONCO_D; }
  return { cells: L.cells, sup: L.sup, tile };
}
function cerBarsReset() { cerFx.bars.length = 0; cerFx.cracks.length = 0; }
function cerStamp(bar) { for (const i of bar.cells) if (!SOLID[tiles[i]]) setTile(i % WW, (i / WW) | 0, bar.tile); }
function cerErase(bar) { for (const i of bar.cells) if (fpLying(tiles[i])) setTile(i % WW, (i / WW) | 0, AIR); }
function cerLift() { if (!pl.dead && rectSolid(pl.x, pl.y, pl.w, pl.h)) { let n = 0; while (n++ < 60 && rectSolid(pl.x, pl.y, pl.w, pl.h)) pl.y -= 2; pl.vy = Math.min(pl.vy, 0); } }
// a lying trunk whose prop is gone slides down onto whatever is there now
function cerSettle() {
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (const bar of cerFx.bars) {
      if (bar.sup < 0 || SOLID[tiles[bar.sup]]) continue;
      cerErase(bar); const own = new Set(bar.cells);
      const L = fpLayCells(bar.k, bar.side, own);
      Object.assign(bar, L); cerStamp(bar); moved = true;
      for (const i of bar.cells) if (Math.random() < 0.3) burst((i % WW + 0.5) * T, ((i / WW) | 0) * T, 3, '#6e5e4d', 50, 300, 0.5);
      sfx.cerAssenta();
    }
    if (!moved) break;
  }
  cerLift();
}
// a giant falls: the crack climbs `warn` s, then it topples the way `s` says
function cerTopple(k, s, warn = 1) {
  const B = fpBoss, Tr = B.trunks[k]; if (!fpStanding(k) || cerFx.bars.some(b => b.k === k) || trqFalls.some(f => f.cerK === k)) return null;
  const L = fpLayCells(k, s, null);
  // how far the sprite turns: until it points at the far end of where it will lie
  let far = null; for (const i of L.cells) { const c = fpRel(i % WW); if (!far || (c - far.c) * s > 0 || (c === far.c && i < far.i)) far = { c, i }; }
  const px = (s > 0 ? Tr.x + Tr.w : Tr.x) * T, py = (B.fy - FP_ARCH) * T;
  const ang = far ? clamp(Math.atan2(Math.abs(wdx((far.i % WW) - (s > 0 ? Tr.x + Tr.w : Tr.x))) * T + T / 2, py - ((far.i / WW) | 0) * T), 0.5, 1.62) : 1.2;
  const f = trqFall({ x: Tr.x, y: B.top, w: Tr.w, h: B.fy - FP_ARCH - B.top, side: s, cells: L.cells, tile: L.tile, warn, dur: 0.6, ang, dmg: cerBoss ? Math.round(cerBoss.dmg * CER.fall) : Math.round(ET.cervo.dmg * CER.fall), src: cerBoss,
    onLand: () => { const bar = { k, side: s, cells: L.cells.filter(i => tiles[i] === L.tile), sup: L.sup, tile: L.tile }; cerFx.bars.push(bar); cerSettle(); } });
  f.cerK = k; return f;
}

/* ---------- the mold: the clearing before the fight, written back on a reset ---------- */
function cerMoldTake() {
  const B = fpBoss, X0 = B.x0 - 4, n = B.w + 8, Y0 = B.top - 2, m = B.fy + B.rift.depth + 3 - Y0;
  const S = { X0, Y0, n, m, t: new Uint16Array(n * m), w: new Uint16Array(n * m), d: new Map(), bars: cerFx.bars.map(b => Object.assign({}, b, { cells: b.cells.slice() })) };
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) {
    const i = fpI(X0 + x, Y0 + y), k = y * n + x;
    S.t[k] = tiles[i]; S.w[k] = walls[i];
    if (diffs.has(i)) S.d.set(i, diffs.get(i));
  }
  fpBossMold = S;
}
function cerMoldPut() {
  const S = fpBossMold; if (!S) return;
  for (let y = 0; y < S.m; y++) for (let x = 0; x < S.n; x++) {
    const i = fpI(S.X0 + x, S.Y0 + y), k = y * S.n + x;
    if (tiles[i] !== S.t[k] || walls[i] !== S.w[k]) { tiles[i] = S.t[k]; walls[i] = S.w[k]; if (chunks.size) markDirty(i % WW, (i / WW) | 0); }
    if (S.d.has(i)) diffs.set(i, S.d.get(i)); else diffs.delete(i);
  }
  cerFx.bars.length = 0; for (const b of S.bars) cerFx.bars.push(b);
  mapVer++;
}
// a save made mid-fight keeps the clearing as it was before it
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.cervo = { dead: cerState.dead };
  const S = fpBossMold;
  if (S && cerBoss && bossFight && bossFight.cer) {
    const M = new Map(o.diffs);
    for (let y = 0; y < S.m; y++) for (let x = 0; x < S.n; x++) { const i = fpI(S.X0 + x, S.Y0 + y); if (S.d.has(i)) M.set(i, S.d.get(i)); else M.delete(i); }
    o.diffs = [...M];
  }
  return o;
}; }

/* ---------- the Muralha de Raízes over both mouths while he fights ---------- */
function cerGates(on) {
  const B = fpBoss; if (!B) return;
  if (on) {
    cerFx.gates.length = 0;
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) for (let y = B.fy - 4; y < B.fy; y++) {
      const c = s < 0 ? B.x0 - 1 - k : B.x0 + B.w + k, i = fpI(c, y), t = tiles[i]; if (SOLID[t]) continue;
      cerFx.gates.push([i, t]); tiles[i] = FP_BARREIRA; if (chunks.size) markDirty(i % WW, y);
      if (k === 0) burst(fpPx(c) + 6, y * T + 6, 4, '#4c3e2e', 50, 200, 0.5);
    }
    sfx.cerMuralha();
  } else {
    for (const [i, t] of cerFx.gates) if (tiles[i] === FP_BARREIRA) { tiles[i] = t; if (chunks.size) markDirty(i % WW, (i / WW) | 0); burst(fpPx(i % WW) + 6, ((i / WW) | 0) * T + 6, 4, '#33291f', 50, 160, 0.5); }
    cerFx.gates.length = 0; sfx.cerMuralha(true);
  }
  mapVer++;
}
// nothing in the clearing breaks while he fights in it
const cerGuard = (tx, ty) => inFpHall(wrapX(tx), ty, 4);
{ const _bt = breakTile; breakTile = function (tx, ty) { if (bossFight && bossFight.cer && cerGuard(tx, ty)) return; return _bt(tx, ty); }; }

/* ---------- the Galhada do Cervo de Pedra ---------- */
STAT_DEF.lgInvestida = { t: 'Correr 1 s sem parar carrega uma investida: o próximo golpe empurra longe e causa +X% de dano', pct: 1 };
STAT_KEYS.push('lgInvestida');
ITEMS.galhada_cervo = {
  name: 'Galhada do Cervo de Pedra', slot: 'head', rar: 4, def: 8, hp: 20, g: 0,
  art: ["c..r....r..c", ".r.r.c..r.r.", ".rr.rr.rr.r.", "..rrr..rrr..", "...rbbbbr...", "..bBBBBBbb..", "..b......b.."], oy: -5,
  pal: { r: '#665440', b: '#4c3e2e', B: '#836e56', c: '#8ad8cc' },
  legend: [['spd', 0.1], ['lgInvestida', 0.5], ['light', 1]],
  desc: 'A galhada de raiz do último cervo, com as pontas que viraram cristal. Quem a usa não para de correr.'
};
BASE_INFO.galhada_cervo = [FP_L];
ITEM_G.galhada_cervo = 0;
DROPS.cervo = CER_DROPS.filter(([id]) => ITEMS[id]);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let v = 0;
  for (const k of EQ_SLOTS) if (equip[k]) v += itemStats(equip[k]).lgInvestida || 0;
  if (pl.lg) pl.lg.investida = v;
  return r;
}; }
// running 1 s without stopping charges the lunge; the next blow that lands spends it
const cerRun = { t: 0, on: false };
HOOK.update.push(dt => {
  if (!pl || state !== 'play') return;
  if (!(pl.lg && pl.lg.investida > 0) || pl.dead) { cerRun.t = 0; cerRun.on = false; return; }
  const fast = pl.onGround && Math.abs(pl.vx) > 70 * (1 + (pl.spd || 0));
  if (fast) cerRun.t += dt; else if (Math.abs(pl.vx) < 25) cerRun.t = 0;
  if (!cerRun.on && cerRun.t >= 1) { cerRun.on = true; sfx.cerCarga(); burst(pl.x + pl.w / 2, pl.y + 4, 8, '#8ad8cc', 50, 0, 0.5, 1, true); }
  if (cerRun.on && Math.random() < dt * 10) parts.push({ x: pl.x + pl.w / 2 + rnd(-5, 5), y: pl.y - 2 + rnd(-2, 3), vx: -pl.facing * 12, vy: rnd(-8, 4), g: 0, life: 0.4, max: 0.4, col: '#8ad8cc', size: 1, glow: true });
});
// a faint crystal light about the head
HOOK.drawGlow.push((cx, cy) => {
  if (!pl || pl.dead || !(pl.lg && pl.lg.investida > 0)) return;
  lc.globalAlpha = cerRun.on ? 0.42 : 0.2; lc.drawImage(CERA.GL.galhada, Math.round(pl.x + pl.w / 2) - cx - 14, Math.round(pl.y) - cy - 18); lc.globalAlpha = 1;
});

/* ---------- blows on him: the heart on the chest, the lunge of the Galhada ---------- */
function cerHeartHit(e) {
  if (e.ph < 2) return false;
  const pcx = cerPcx(), cx = e.x + e.w / 2, rel = (pcx - cx) * e.facing, py = pl.y + pl.h / 2;
  return rel > 6 && rel < e.w / 2 + 34 && py > e.y - 6 && py < e.y + e.h - 6;
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (!e || e.dead) return _hit(e, dir, mult, melee);
  let lunge = false;
  if (melee && cerRun.on && pl.lg && pl.lg.investida > 0) { lunge = true; mult *= 1 + pl.lg.investida; }
  if (e.type === 'cervo') {
    if (e.state === 'intro') return;
    if (melee && cerHeartHit(e)) { mult *= 1.5; burst(e.x + e.w / 2 + e.facing * 22, e.y + e.h * 0.45, 8, '#d4f4ec', 90, 100, 0.4, 1, true); sfx.cerCerne(); }
  }
  const hp0 = e.hp, r = _hit(e, dir, mult, melee);
  if (lunge && e.hp < hp0) {
    cerRun.on = false; cerRun.t = 0;
    burst(e.x + e.w / 2, e.y + e.h / 2, 12, '#8ad8cc', 110, 120, 0.45, 1, true); shake(3); sfx.cerInvestida();
    if (!e.dead && !e.boss && !ET[e.type].boss) { e.vx = dir * 330; if (!ET[e.type].fly) e.vy = -170; e.stun = Math.max(e.stun || 0, 0.5); }
  }
  if (e.type === 'cervo') e.stun = 0;
  return r;
}; }

/* ---------- art ---------- */
const CERA = {};
{
const { cg } = CVART;
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  pele: R6(['#1c2420', '#2c3a32', '#3e5044', '#566a5a', '#74887a', '#98aa9a']),
  musgo: R6(['#141c10', '#1f2c17', '#2c3e1f', '#3c5228', '#4e6632', '#64803e']),
  raiz: R6(['#1e1814', '#33291f', '#4c3e2e', '#665440', '#836e56', '#a48c72']),
  casca: R6(['#221c18', '#3a3028', '#54463a', '#6e5e4e', '#8c7a66', '#ae9a84']),
  cristal: R6(['#16303a', '#1f5260', '#2f7e8a', '#4fb0b0', '#8ad8cc', '#d4f4ec']),
  casco: R6(['#0c0e0d', '#161a18', '#222826', '#2e3632', '#3c4642', '#4e5a54'])
};
const sm = t => t * t * (3 - 2 * t);
function nz(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm(fx - ix), uy = sm(fy - iy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy - 0.5;
}
// the painter (as the Sineiro's): each ramp remembers its index, so the outline takes the darkest tone of what it rims
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1);
  const P = {
    w, h, c, rid,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; },
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    blob(cx, cy, rx, ry, R, s, base = 2.6, f) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
        const e = f ? f(x, y, dx, dy) : 0; if (e === null) continue;
        P.put(x, y, R, base + 1.2 - (dx * 0.8 + dy) * 1.3 - d * 0.7 + cg(x, y, s) * 0.6 + e);
      }
    },
    tube(ax, ay, bx, by, r0, r1, R, s, base = 2.4, f) {
      const m = Math.max(r0, r1) + 1, x0 = Math.floor(Math.min(ax, bx) - m), x1 = Math.ceil(Math.max(ax, bx) + m), y0 = Math.floor(Math.min(ay, by) - m), y1 = Math.ceil(Math.max(ay, by) + m);
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, r = r0 + (r1 - r0) * t;
        const nx = (px - qx) / r, ny = (py - qy) / r, d = nx * nx + ny * ny; if (d > 1) continue;
        const e = f ? f(x, y, t, nx, ny) : 0; if (e === null) continue;
        P.put(x, y, R, base + 0.9 - (nx * 0.8 + ny) * 1.4 - d * 0.8 + cg(x, y, s) * 0.6 + e);
      }
    },
    outline() {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i]) continue;
        const air = (x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w]) || x === 0 || y === 0 || x === w - 1 || y === h - 1;
        if (air) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    recolor(A, B, test) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (rid[i] !== A.k || !test(x, y)) continue; const v = A.indexOf(c[i]); if (v >= 0) { c[i] = B[v]; rid[i] = B.k; } } },
    canvas() { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(c); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}

/* the stag: 112 x 132, facing right, hooves on row 128. Granite skin with moss on the back and the neck, a heavy
   chest, long thin legs with the hind hock bent back, a long head with a dark muzzle, antlers of root (crystal leaves
   and tips once they flower) */
const SW = 144, SH = 132, GY = 128, OX = 16;   // the body sits in the middle; the antlers have room ahead and behind
// angles: legs and neck from straight down / straight up, + toward the front; head pitch + nose down
function poseOf(k) {
  const P = { dy: 0, tilt: 0, piv: 0, na: 0.62, hp: 0.25, mouth: 0, fN: [0.06, -0.02], fF: [-0.1, 0.0], hN: [0.4, -0.5, 0.06], hF: [0.28, -0.56, -0.04], ears: 0 };
  const run = (a) => Object.assign(P, a);
  switch (k) {
    case 1: run({ fN: [0.75, 1.05], fF: [0.5, 0.6], hN: [-0.15, -0.95, -0.7], hF: [-0.3, -1.05, -0.85], dy: -2, na: 0.8, hp: 0.3 }); break;          // gallop: reach
    case 2: run({ fN: [-0.35, -0.15], fF: [-0.55, -0.4], hN: [0.95, 0.15, 0.55], hF: [0.8, 0.0, 0.35], dy: 2, na: 0.75, hp: 0.3 }); break;          // gathered
    case 3: run({ fN: [0.25, -0.5], fF: [-0.2, 0.2], hN: [0.6, -0.4, 0.1], hF: [0.1, -0.85, -0.4], dy: -1, na: 0.78, hp: 0.28 }); break;            // between
    case 4: run({ fN: [0.75, 1.05], fF: [0.5, 0.6], hN: [-0.15, -0.95, -0.7], hF: [-0.3, -1.05, -0.85], dy: 0, na: 1.25, hp: 1.05 }); break;          // charging, antlers forward
    case 5: run({ fN: [-0.35, -0.15], fF: [-0.55, -0.4], hN: [0.95, 0.15, 0.55], hF: [0.8, 0.0, 0.35], dy: 3, na: 1.25, hp: 1.05 }); break;
    case 6: run({ fN: [0.25, -0.5], fF: [-0.2, 0.2], hN: [0.6, -0.4, 0.1], hF: [0.1, -0.85, -0.4], dy: 1, na: 1.25, hp: 1.05 }); break;
    case 7: run({ fN: [0.85, -0.65], na: 0.95, hp: 0.65, dy: 1 }); break;                                                                             // pawing
    case 8: run({ na: 1.2, hp: 1.0, dy: 2, fN: [0.2, 0.05], fF: [0.05, -0.05], hN: [0.55, -0.4, 0.1] }); break;                                        // antlers lowered
    case 9: run({ tilt: 0.8, piv: 0, fN: [1.9, 0.9], fF: [1.6, 0.5], hN: [0.15, -0.35, 0.05], hF: [0.05, -0.45, -0.05], na: 0.5, hp: -0.15, mouth: 1 }); break;   // rearing
    case 10: run({ tilt: -0.12, piv: 1, fN: [0.35, 0.1], fF: [0.2, 0.05], hN: [0.2, -0.8, -0.2], hF: [0.1, -0.85, -0.3], na: 1.3, hp: 1.1, dy: 2 }); break;   // the slam
    case 11: run({ tilt: -0.08, piv: 1, na: 1.1, hp: 0.8, hN: [0.7, -0.2, 0.3], hF: [0.6, -0.3, 0.2], dy: 2 }); break;                                // kick: weight forward
    case 12: run({ tilt: -0.3, piv: 1, na: 1.2, hp: 0.9, hN: [-1.2, -1.75, -1.6], hF: [-0.9, -1.4, -1.3], fN: [0.25, 0.05], fF: [0.1, 0.0] }); break;   // kick
    case 13: run({ na: 0.35, hp: -0.25, ears: 1 }); break;                                                                                             // shaking (two frames)
    case 14: run({ na: 0.45, hp: 0.15, ears: -1 }); break;
    case 15: run({ na: 0.25, hp: -0.75, mouth: 1.2 }); break;                                                                                          // the bellow
    case 16: run({ dy: 7, fN: [0.45, -0.55], fF: [0.3, -0.6], hN: [1.0, -1.0, 0.35], hF: [0.9, -1.1, 0.25], na: 0.95, hp: 0.5 }); break;             // crouch
    case 17: run({ dy: -6, tilt: 0.12, fN: [1.35, -0.25], fF: [1.15, -0.45], hN: [0.95, -0.95, -1.25], hF: [0.8, -1.1, -1.35], na: 0.85, hp: 0.45 }); break;   // leap
    case 18: run({ tilt: -0.55, piv: 1, fN: [1.4, 1.2], fF: [1.2, 1.0], hN: [-0.9, -1.4, -1.6], hF: [-1.0, -1.5, -1.7], na: 1.45, hp: 1.2 }); break;     // dive
    case 19: run({ dy: 4, na: 1.55, hp: 1.35, mouth: 0.6, fN: [0.22, 0.12], fF: [-0.25, -0.12], hN: [0.5, -0.4, 0.15], hF: [0.2, -0.6, -0.1] }); break;   // tired
  }
  return P;
}
const NPOSE = 20;
// joints of a pose (facing right): body points turn about the hip (piv 0) or the shoulder (piv 1)
function joints(k) {
  const P = poseOf(k), dy = P.dy, piv = P.piv ? [76, 94 + dy] : [38, 92 + dy], ca = Math.cos(P.tilt), sa = Math.sin(P.tilt);
  const R = (x, y) => { y += dy; const dx = x - piv[0], ddy = y - piv[1]; return [OX + piv[0] + dx * ca + ddy * sa, piv[1] - dx * sa + ddy * ca]; };
  const hip = R(38, 92), sh = R(76, 92), barrel = R(56, 96), rump = R(34, 90), chest = R(78, 96), nb = R(82, 84);
  const na = P.na - P.tilt, head = [nb[0] + Math.sin(na) * 22, nb[1] - Math.cos(na) * 22], hd = P.hp - P.tilt;
  const legs = (root, ang, lens) => { const pts = [root]; let [x, y] = root; for (let j = 0; j < ang.length; j++) { x += Math.sin(ang[j]) * lens[j]; y += Math.cos(ang[j]) * lens[j]; pts.push([x, y]); } return pts; };
  return {
    P, hip, sh, barrel, rump, chest, nb, head, hd,
    fN: legs(R(74, 100), P.fN, [15, 15]), fF: legs(R(70, 99), P.fF, [15, 15]),
    hN: legs(R(40, 98), P.hN, [13, 13, 8]), hF: legs(R(36, 97), P.hF, [13, 13, 8])
  };
}
// a point in the head's frame (x forward along the muzzle, y down) -> sprite
const hpt = (J, x, y) => { const c = Math.cos(J.hd), s = Math.sin(J.hd); return [J.head[0] + x * c - y * s, J.head[1] + x * s + y * c]; };
// the antler: the main beam up and back from the burr, tines forward off it, a brow tine low
const BEAM = [[0, 0], [-5, -9], [-8, -19], [-5, -29], [3, -36]], TINES = [[0, [8, -5]], [1, [7, -16]], [2, [6, -27]], [3, [13, -33]]];
function antlerPts(J, far) {
  const sc = far ? 0.9 : 1, ox = far ? -3 : 0, oy = far ? 1 : 0;
  const P = (q) => hpt(J, -3 + ox + q[0] * sc, -6 + oy + q[1] * sc);
  return { beam: BEAM.map(P), tines: TINES.map(([j, q]) => [P(BEAM[j]), P(q)]) };
}
function paintStag(k, bloom) {
  const Q = pp(SW, SH), J = joints(k), P = J.P, S = 14600 + k * 41;
  const { pele, musgo, raiz, cristal, casco } = PAL;
  const crack = (x, y) => (Math.abs(nz(x, y, 7, 14601)) < 0.03 ? -1.1 : 0) + (hash2(x, y, 14602) < 0.04 ? -0.7 : 0);
  // a leg: thigh/forearm thick, the rest thin, the hoof dark
  const leg = (L, base, back, hind) => {
    const n = L.length - 1;
    for (let j = 0; j < n; j++) {
      const [a, b] = [L[j], L[j + 1]], r0 = j === 0 ? (hind ? 7 : 5.2) : j === 1 ? (hind ? 3.6 : 3.2) : 2.6, r1 = j === 0 ? (hind ? 4.2 : 3.4) : j === 1 ? 2.8 : 2.4;
      Q.tube(a[0], a[1], b[0], b[1], r0, r1, pele, S + j + (back ? 10 : 20), base - (back ? 0.9 : 0), (x, y) => crack(x, y));
    }
    const [hx, hy] = L[n], [px, py] = L[n - 1], ux = hx - px, uy = hy - py, ul = Math.hypot(ux, uy) || 1;
    Q.tube(hx, hy, hx + ux / ul * 4, hy + uy / ul * 4, 2.8, 3.0, casco, S + 30 + (back ? 1 : 0), base + 0.2 - (back ? 0.8 : 0));
  };
  // the antler as root: fibres along it, a pointed tip, crystal leaves and a crystal point when it has flowered
  const antler = (far) => {
    const A = antlerPts(J, far), base = far ? 1.6 : 2.4, fib = (x, y) => (((x + y * 2) % 4) === 0 ? -0.7 : 0) + cg(x, y, 14611) * 0.3;
    for (let j = 0; j < A.beam.length - 1; j++) { const [a, b] = [A.beam[j], A.beam[j + 1]]; Q.tube(a[0], a[1], b[0], b[1], 2.4 - j * 0.35, 2.0 - j * 0.35, raiz, 14612 + j, base, fib); }
    for (const [a, b] of A.tines) Q.tube(a[0], a[1], b[0], b[1], 1.5, 0.75, raiz, 14620, base - 0.1, fib);
    if (bloom) {
      const tips = [A.beam[A.beam.length - 1], ...A.tines.map(t => t[1])];
      for (let j = 0; j < tips.length; j++) {
        const [x, y] = tips[j];
        Q.tube(x, y + 2, x + (j % 2 ? 1 : -1), y - 3, 1.4, 0.6, cristal, 14630 + j, base + 1.4);
        // two little leaves of crystal beside each tip
        for (const d of [-1, 1]) Q.blob(x + d * 2.6, y + 1.5, 1.7, 1.1, cristal, 14640 + j, base + 0.6, (xx, yy, dx, dy) => (dy > 0.3 ? -0.8 : 0.3));
      }
    }
  };
  antler(true);
  leg(J.fF, 2.0, true, false); leg(J.hF, 2.0, true, true);
  // the body: rump, barrel, chest; then the neck and the head
  const [bx, by] = J.barrel, [rx, ry] = J.rump, [cx, cy] = J.chest;
  Q.blob(rx + 1, ry, 14.5, 14, pele, S + 1, 2.0, (x, y) => crack(x, y));
  Q.blob(bx, by, 25, 14.5, pele, S + 2, 1.9, (x, y, dx, dy) => crack(x, y) + (dy > 0.55 ? -0.5 : 0));
  Q.blob(cx - 1, cy, 13.5, 15, pele, S + 3, 2.1, (x, y) => crack(x, y));
  const [nx, ny] = J.nb, [hx, hy] = J.head;
  Q.tube(nx, ny, hx - 1, hy + 3, 10, 6.5, pele, S + 4, 2.1, (x, y, t, a, b) => crack(x, y) + (b > 0.5 ? -0.5 : 0));
  // the mane of moss down the back of the neck: tufts
  for (let j = 0; j < 7; j++) { const t = j / 6, x = nx - 5 + (hx - nx) * t, y = ny - 4 + (hy - ny) * t; Q.blob(x - 4, y, 3.4, 2.6, musgo, S + 40 + j, 2.4, (xx, yy) => (((xx + yy) & 1) ? -0.6 : 0)); }
  // the head: the skull, the long muzzle, the dark nose, the ear, the eye
  const mz = hpt(J, 13, 2), ns = hpt(J, 16, 3);
  Q.blob(hx, hy, 8, 7, pele, S + 5, 2.3, (x, y) => crack(x, y));
  Q.tube(hx + 1, hy + 1, mz[0], mz[1], 5.6, 3.8, pele, S + 6, 2.2, (x, y, t, a, b) => (b > 0.4 ? -0.6 : 0));
  Q.blob(ns[0], ns[1], 2.6, 2.4, casco, S + 7, 2.4);
  if (P.mouth > 0) { const m0 = hpt(J, 9, 4), m1 = hpt(J, 15, 4 + P.mouth * 2.5); Q.tube(m0[0], m0[1], m1[0], m1[1], 1.2, 1.4, casco, S + 8, 0.6); }
  const e0 = hpt(J, -4, -5), e1 = hpt(J, -12 - P.ears * 2, -8 + P.ears * 3);
  Q.tube(e0[0], e0[1], e1[0], e1[1], 2.6, 1.2, pele, S + 9, 2.4, (x, y, t, a, b) => (b > 0.2 ? -1.2 : 0));
  antler(false);
  leg(J.hN, 2.2, false, true); leg(J.fN, 2.2, false, false);
  // the eye: a dark socket with a crystal glint
  const ey = hpt(J, 3, -2.5); Q.put(ey[0], ey[1], casco, 0); Q.put(ey[0] + 1, ey[1], casco, 1); Q.put(ey[0], ey[1] + 1, casco, 0);
  Q.put(ey[0] + 1, ey[1] - 1, cristal, 4);
  // moss on the back, the neck and the brow (whatever faces up); a few pale lichen spots
  Q.recolor(pele, musgo, (x, y) => nz(x, y, 6, 14603) > 0.12 && !Q.has(x, y - 3));
  Q.recolor(pele, musgo, (x, y) => nz(x, y, 4, 14604) > 0.32);
  Q.outline();
  return Q.canvas();
}
// what the drawing needs besides the frame: the eye, the chest (the heart), the antler tips, the hooves
function meta(k) {
  const J = joints(k), A = antlerPts(J, false), F = antlerPts(J, true);
  const last = L => L[L.length - 1];
  return { eye: hpt(J, 3, -2.5), chest: [J.chest[0] + 7, J.chest[1] - 2], tips: [last(A.beam), ...A.tines.map(t => t[1]), last(F.beam)], hind: [last(J.hN), last(J.hF)], front: [last(J.fN), last(J.fF)], head: J.head };
}
// the crystal heart showing through the cracked chest (phase 3): an overlay on the frame
function paintHeart() {
  const Q = pp(24, 24), { cristal, pele } = PAL;
  for (let j = 0; j < 7; j++) {   // cracks out from the middle
    let x = 12, y = 12; const a = j * 0.9 + 0.3;
    for (let n = 0; n < 9; n++) { x += Math.cos(a) * 1.1 + (hash2(j, n, 14650) - 0.5); y += Math.sin(a) * 1.1 + (hash2(n, j, 14651) - 0.5); Q.put(x, y, n < 4 ? cristal : pele, n < 4 ? 4 : 0); }
  }
  Q.blob(12, 12, 4.6, 5.2, cristal, 14652, 3.4, (x, y, dx, dy) => (Math.abs(dx) + Math.abs(dy) > 1.05 ? null : 0.4));
  Q.put(11, 10, cristal, 5); Q.put(12, 10, cristal, 5); Q.put(11, 11, cristal, 5);
  return Q.canvas();
}
// the roots each standing giant stands on: two legs splaying to the floor round the arch
function paintFlare() {
  const W = 72, H = 6 + FP_ARCH * T, Q = pp(W, H), { raiz, casca } = PAL, fib = (x, y) => (((x * 2 + y) % 5) === 0 ? -0.6 : 0);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? 15 : W - 15;
    Q.tube(x0, 1, x0 + s * 6, H - 12, 6, 4.2, casca, 14660 + s, 2.3, fib);
    Q.tube(x0 + s * 6, H - 12, x0 + s * 13, H - 2, 4.2, 2.6, raiz, 14662 + s, 2.2, fib);
    Q.tube(x0 + s * 3, H - 16, x0 + s * 1, H - 1, 2.2, 1.6, raiz, 14664 + s, 1.8, fib);   // a rootlet down the inside
  }
  // the lip of the arch: the trunk's underside, dark
  for (let x = 14; x < W - 14; x++) { const y = 2 + Math.round(Math.sin((x - 14) / (W - 28) * Math.PI) * -1.5 + 1.5); Q.put(x, y, casca, 1); Q.put(x, y + 1, casca, 0); }
  Q.outline();
  return Q.canvas();
}
// spikes of crystal along the rift's bottom
function paintSpikes(n) {
  const W = n * T, H = 22, Q = pp(W, H), { cristal } = PAL;
  for (let x = 2; x < W - 2; x += 3 + ((hash2(x, 1, 14670) * 3) | 0)) {
    const h = 9 + hash2(x, 2, 14671) * 12, lean = (hash2(x, 3, 14672) - 0.5) * 5;
    Q.tube(x, H - 1, x + lean, H - h, 2.4, 0.5, cristal, 14673 + x, 2.6, (xx, yy, t, a) => (a < -0.2 ? 1.2 : a > 0.4 ? -0.9 : 0));
  }
  Q.outline();
  return Q.canvas();
}
CERA.get = () => CERA.ready || (CERA.ready = (() => {
  const frames = [[], []], meta0 = [];
  for (let k = 0; k < NPOSE; k++) meta0.push(meta(k));
  return { frames, meta: meta0, heart: paintHeart(), flare: paintFlare(), spikes: null };
})());
// a frame (pose k, flowered antlers or not), painted the first time it is asked for, with its mirror and its flash
CERA.frame = (k, bloom) => {
  const A = CERA.get(), F = A.frames[bloom ? 1 : 0];
  if (!F[k]) { const r = paintStag(k, bloom), l = flip(r); F[k] = { r, l, wr: whiteOf(r), wl: whiteOf(l) }; }
  return F[k];
};
CERA.spikes = n => { const A = CERA.get(); if (!A.spikes || A.spikes.width !== n * T) A.spikes = paintSpikes(n); return A.spikes; };
CERA.GL = { eye: glow(5, '#8ad8cc'), tip: glow(7, '#8ad8cc'), heart: glow(22, '#8ad8cc'), hoof: glow(9, '#c4cc6a'), galhada: glow(14, '#4fb0b0'), spike: glow(18, '#2f7e8a') };
Object.assign(CERA, { SW, SH, GY, NPOSE });
}

/* ---------- drawing ---------- */
function cerPose(e) {
  const run3 = (base) => base + (Math.floor(e.t * (e.state === 'charge' || e.state === 'run' ? 9 : 6)) % 3);
  switch (e.state) {
    case 'intro': return e.stateT0 > 1.0 && e.stateT0 < 2.2 ? 15 : 0;
    case 'pawTell': return e.stateT0 < 0.9 ? (Math.floor(e.stateT0 / 0.3) % 2 ? 7 : 0) : 8;
    case 'charge': return run3(4);
    case 'run': return run3(1);
    case 'stagger': return 19;
    case 'kickTell': return 11;
    case 'kick': return 12;
    case 'rearTell': return 9;
    case 'slam': return 10;
    case 'shake': return Math.floor(e.t * 14) % 2 ? 13 : 14;
    case 'bellow': return 15;
    case 'bloom': return e.stateT0 < 1 ? 13 + (Math.floor(e.t * 10) % 2) : 15;
    case 'heart': return 15;
    case 'crouch': return 16;
    case 'leap': case 'fall': return 17;
    case 'diveTell': return 8;
    case 'dive': return 18;
    case 'tired': return 19;
    case 'walk': return Math.abs(e.svx || 0) > 8 ? 1 + (Math.floor(e.t * 5) % 3) : 0;
    default: return 0;
  }
}
const cerFrameXY = (e, fx, fy) => [fx - (CERA.SW >> 1) + (e.state === 'shake' || e.state === 'stagger' ? Math.round(Math.sin(e.t * 50)) : 0), fy - CERA.GY - 1];
const cerMetaPt = (e, p) => [e.x + e.w / 2 + e.facing * (p[0] - (CERA.SW >> 1)), e.y + e.h - CERA.GY - 1 + p[1]];
DRAW_E.cervo = () => {};   // drawn in the clearing's own pass (wider than the usual cull; trunks lying in front of him)
function cerDraw(e, cx, cy) {
  const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
  if (fx < -80 || fx > VW + 80 || fy < -20 || fy > VH + 140) return;
  const k = cerPose(e), Fr = CERA.frame(k, e.ph >= 1), fl = e.flash > 0, img = e.facing > 0 ? (fl ? Fr.wr : Fr.r) : (fl ? Fr.wl : Fr.l), [x, y] = cerFrameXY(e, fx, fy);
  lc.drawImage(img, x, y);
  if (e.ph >= 2 && !fl) { const m = CERA.get().meta[k].chest, hx = fx + e.facing * (m[0] - (CERA.SW >> 1)), hy = fy - CERA.GY - 1 + m[1]; lc.drawImage(CERA.get().heart, Math.round(hx) - 12, Math.round(hy) - 12); }
}
EYES_E.cervo = (e, fx, fy) => {
  const A = CERA.get(), m = A.meta[cerPose(e)], w = WARN_E.cervo(e);
  const ex = fx + e.facing * (m.eye[0] - (CERA.SW >> 1)), ey = fy - CERA.GY - 1 + m.eye[1];
  lc.globalAlpha = w ? 0.85 : 0.45; lc.drawImage(CERA.GL.eye, Math.round(ex) - 5, Math.round(ey) - 5);
  // green sparks on the antler tips while he lowers them; the flowered tips glow faintly; the heart
  const tipA = e.state === 'pawTell' && e.stateT0 > 0.9 || e.state === 'diveTell' ? 0.8 : e.state === 'bellow' ? (Math.floor(e.stateT0 * 6.6) % 2 ? 0.95 : 0.15) : e.ph >= 1 ? 0.22 : 0;
  if (tipA > 0) for (const p of m.tips) { lc.globalAlpha = tipA * (0.8 + Math.random() * 0.2); lc.drawImage(CERA.GL.tip, Math.round(fx + e.facing * (p[0] - (CERA.SW >> 1))) - 7, Math.round(fy - CERA.GY - 1 + p[1]) - 7); }
  if (e.state === 'kickTell') for (const p of m.hind) { lc.globalAlpha = 0.5 + Math.min(1, e.stateT0 / 0.5) * 0.45; lc.drawImage(CERA.GL.hoof, Math.round(fx + e.facing * (p[0] - (CERA.SW >> 1))) - 9, Math.round(fy - CERA.GY - 1 + p[1]) - 9); }
  if (e.ph >= 2) { lc.globalAlpha = (e.state === 'tired' ? 0.75 : 0.45) + Math.sin(gameTime * 4) * 0.1; lc.drawImage(CERA.GL.heart, Math.round(fx + e.facing * (m.chest[0] - (CERA.SW >> 1))) - 22, Math.round(fy - CERA.GY - 1 + m.chest[1]) - 22); }
};
WARN_E.cervo = e => e.state === 'pawTell' || e.state === 'kickTell' || e.state === 'rearTell' || e.state === 'shake' || e.state === 'bellow' || e.state === 'diveTell';

// the clearing's own pass: the roots under the standing giants, the stag, the lying trunks in front of him, the
// spikes in the rift, the cracks on a trunk he landed on
HOOK.drawWorld.push((cx, cy) => {
  const B = fpBoss; if (!B || !pl || Math.abs(wdx(B.cx - Math.floor((cx + VW / 2) / T))) > B.w / 2 + 50) return;
  const A = CERA.get();
  for (let k = 0; k < B.trunks.length; k++) { if (!fpStanding(k)) continue; const Tr = B.trunks[k]; lc.drawImage(A.flare, fpPx(Tr.x) - 12 - cx, (B.fy - FP_ARCH) * T - 3 - cy); }
  const sp = CERA.spikes(B.rift.w); lc.drawImage(sp, fpPx(B.rift.x0) - cx, (B.fy + B.rift.depth) * T - sp.height - cy);
  const e = cerBoss;
  if (e && !e.dead) {
    cerDraw(e, cx, cy);
    // the lying trunks he runs under stay in front of him: their blocks drawn again from the chunk pictures
    if (e.mode === 'floor') {
      const c0 = Math.floor((e.x - 28) / T), c1 = Math.floor((e.x + e.w + 28) / T), r0 = Math.floor((e.y + e.h - 76) / T), r1 = Math.floor((e.y + e.h - 2) / T);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const t = tileAt(c, r); if (!fpLying(t)) continue;
        const wc = wrapX(c), ch = chunks.get(((r / CH) | 0) * 64 + ((wc / CH) | 0)); if (!ch || ch.dirty) continue;
        lc.drawImage(ch.c, (wc % CH) * T, (r % CH) * T, T, T, c * T - cx, r * T - cy, T, T);
      }
    }
  }
  // a trunk he landed on, cracking
  for (const C of cerFx.cracks) {
    const k = Math.min(1, C.t / C.max);
    for (let j = 0; j < C.bar.cells.length; j++) {
      const i = C.bar.cells[j]; if (hash2(i, 1, 14680) > k) continue;
      const x = fpPx(i % WW) - cx, y = ((i / WW) | 0) * T - cy, h = (hash2(i, 2, 14681) * 8) | 0;
      lc.fillStyle = '#100c0a'; lc.fillRect(x + 2 + h, y + 1, 1, 10); lc.fillStyle = '#d4f4ec'; lc.fillRect(x + 3 + h, y + 1, 1, 10); lc.fillRect(x + 4 + h, y + 5, 2, 1);
    }
  }
});
// the warnings, over the dark: the waves, the leaf shadows, the dive's line of chips
HOOK.drawTop.push((cx, cy) => {
  if (!fpBoss || !pl) return;
  for (const W of cerFx.waves) for (const F of W.fronts) {
    if (!F.on) continue;
    const x = Math.round(F.x) - cx, y = Math.round(W.y) - cy;
    for (let j = 0; j < 7; j++) { lc.globalAlpha = 0.85 - j * 0.1; lc.fillStyle = j < 2 ? '#8ad8cc' : '#566a5a'; lc.fillRect(x - F.d * j * 2, y - 3 - Math.max(0, 3 - Math.abs(j - 2)) * 2, 2, 2); }
  }
  for (const L of cerFx.leaves) {
    if (L.t < 0) {
      const k = 1 + L.t / 1.0, x = Math.round(L.x) - cx, y = Math.round(L.land) - cy, r = 9 - k * 4;
      lc.globalAlpha = 0.3 + k * 0.5; lc.strokeStyle = (Math.floor(gameTime * 10) & 1) ? '#8ad8cc' : '#2f7e8a'; lc.lineWidth = 1;
      lc.beginPath(); lc.ellipse(x + 0.5, y - 1.5, r, r * 0.3, 0, 0, Math.PI * 2); lc.stroke();
      lc.globalAlpha = 0.35 * k; lc.fillStyle = '#05070a'; lc.fillRect(x - r, y - 2, r * 2, 2);
    } else if (!L.done) {
      const x = Math.round(L.x) - cx, y = Math.round(L.y) - cy; lc.globalAlpha = 1;
      lc.fillStyle = '#1f5260'; lc.fillRect(x - 2, y - 1, 5, 3); lc.fillStyle = '#8ad8cc'; lc.fillRect(x - 1, y - 1, 3, 1); lc.fillStyle = '#d4f4ec'; lc.fillRect(x, y, 1, 1);
    }
  }
  const D = cerFx.dive;
  if (D && D.st === 'tell') {
    const k = Math.min(1, D.t / 0.8), n = Math.max(2, Math.ceil(Math.hypot(D.x1 - D.x0, D.y1 - D.y0) / 9));
    for (let j = 1; j <= n; j++) {
      if (j / n > k * 1.1) break;
      const x = Math.round(D.x0 + (D.x1 - D.x0) * j / n) - cx, y = Math.round(D.y0 + (D.y1 - D.y0) * j / n) - cy;
      lc.globalAlpha = 0.55 + 0.4 * ((j + Math.floor(gameTime * 12)) & 1); lc.fillStyle = '#4fb0b0'; lc.fillRect(x - 1, y - 2, 2, 3); lc.fillStyle = '#d4f4ec'; lc.fillRect(x - 1, y - 2, 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const B = fpBoss; if (!B || !pl || Math.abs(wdx(B.cx - Math.floor((cx + VW / 2) / T))) > B.w / 2 + 50) return;
  const x = fpPx(B.rift.x0) - cx, y = (B.fy + B.rift.depth) * T - cy;
  for (let j = 0; j < 3; j++) { lc.globalAlpha = 0.16 + Math.sin(gameTime * 1.3 + j * 2) * 0.04; lc.drawImage(CERA.GL.spike, x + j * B.rift.w * T / 3 + 2, y - 30); }
  lc.globalAlpha = 1;
});

/* ---------- the fight ---------- */
function cerStart() {
  const B = fpBoss, pcol = fpRel(fpCol(cerPcx())), side = pcol < B.w / 2 ? -1 : 1;
  cerMoldTake(); cerGates(true);
  DROPS.cervo = CER_DROPS.filter(([id]) => ITEMS[id]);
  // he waits in the gap past the first giant on the hero's side
  const tr = B.trunks.map((Tr, k) => ({ k, r: fpRel(Tr.x) })).filter(o => fpStanding(o.k)).sort((a, b) => side < 0 ? a.r - b.r : b.r - a.r);
  let gx;
  if (tr.length >= 2) { const a = tr[0], b = tr[1]; gx = side < 0 ? (a.r + 4 + b.r) / 2 : (b.r + 4 + a.r) / 2; }
  else gx = side < 0 ? B.w * 0.3 : B.w * 0.7;
  const D = ET.cervo, x = fpPx(B.x0) + gx * T - D.w / 2, y = fpFloorY() - D.h;
  const e = spawnEnemy('cervo', x, y, FP_ZONE0 + 3);
  if (enemies.indexOf(e) < 0) enemies.push(e);
  Object.assign(e, { boss: true, lvl: FP_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, facing: side < 0 ? -1 : 1, cd: 1.0, ph: 0, svx: 0, mode: 'floor', bar: null, tiredN: 0, lastHp: D.hp });
  cerSet(e, 'intro', 2.8);
  cerBoss = e; bossFight = { e, cer: true };
  cerClear(); CERA.frame(0, false);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Cervo de Pedra'; bn.lastChild.textContent = 'o último que lembra do sol'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Cervo de Pedra', 'o último que lembra do sol');
  shake(3); sfx.cerCascos(1);
}
function cerClear() { cerFx.waves.length = 0; cerFx.leaves.length = 0; cerFx.dive = null; cerFx.cracks.length = 0; }
function cerEnd(won) {
  const e = cerBoss; cerBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  cerClear();
  if (!won) {
    // the clearing back as it was: the giants up, the muralha open
    if (e) cerDrop(e);
    trqClear(); cerMoldPut(); cerFx.gates.length = 0;
    return;
  }
  cerState.dead = true; fpBoss.dead = true;
  cerGates(false);
  const x = e ? e.x + e.w / 2 : fpPx(fpBoss.cx), y = e ? e.y + e.h / 2 : fpFloorY() - 30;
  burst(x, y, 40, '#566a5a', 140, 240, 1.3, 2); burst(x, y, 24, '#8ad8cc', 110, 160, 1.1, 1, true); burst(x, y - 20, 16, '#4c3e2e', 90, 300, 1);
  // half the time, one of the layer's bases too
  const bases = ['lanca_raiz', 'escudo_casca', 'manto_folhas'].filter(id => ITEMS[id]);
  if (bases.length && Math.random() < 0.5) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.cerMorte();
  showBanner('Vitória', 'o último cervo descansa');
  // every giant still standing falls, one after another, and stays as it fell
  cerFellAll();
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.cer) return cerEnd(won); return _eb(won); }; }
// after the kill: the standing giants fall toward the side with more room, one every half second
let cerFellQ = [];
function cerFellAll() {
  const B = fpBoss; cerFellQ = [];
  for (let k = 0; k < B.trunks.length; k++) if (fpStanding(k)) cerFellQ.push({ k, t: 0.8 + cerFellQ.length * 0.55 });
}
function cerRoom(k, s) {   // free columns from giant k toward side s, to the next standing giant or the wall
  const B = fpBoss, Tr = B.trunks[k]; let c = s > 0 ? Tr.x + Tr.w : Tr.x - 1, n = 0;
  while (n < 40) { const r = fpRel(c); if (r < 0 || r >= B.w) break; if (tiles[fpI(c, B.fy - FP_ARCH - 1)] === FP_TRONCO_G) break; c += s; n++; }
  return n;
}
HOOK.update.push(dt => {
  if (!cerFellQ.length || state !== 'play' || !fpBoss) return;
  for (let j = cerFellQ.length - 1; j >= 0; j--) {
    const q = cerFellQ[j]; q.t -= dt; if (q.t > 0) continue;
    cerFellQ.splice(j, 1);
    const s = cerRoom(q.k, 1) >= cerRoom(q.k, -1) ? 1 : -1;
    const f = cerTopple(q.k, s, 0.9); if (f) { f.dmg = 0; f.onLand = (o => () => { o(); if (!cerFellQ.length && !trqFalls.length) saveGame(); })(f.onLand); }
  }
});
// not before his time: each phase is lived through (a blow can only bring him to the next threshold)
const cerFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * CER.p2) : e.ph === 1 ? Math.floor(e.maxHp * CER.p3) : (e.state === 'heart' ? 1 : 0);
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'cervo' && !e.dead) { const f = cerFloorHp(e); if (f > 0) { e.hp = f; return; } }
  return _k(e);
}; }
function cerSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
// the clearing in world px near the hero
const cerLo = () => fpPx(fpBoss.x0) + 2, cerHi = () => fpPx(fpBoss.x0) + fpBoss.w * T - 2;
// the stretch of floor around x (px) between the standing giants (or the walls): where he can go without breaking one
function cerSeg(x) {
  const B = fpBoss; let lo = cerLo(), hi = cerHi();
  for (let k = 0; k < B.trunks.length; k++) { if (!fpStanding(k)) continue; const L = fpPx(B.trunks[k].x), Rr = L + B.trunks[k].w * T; if (Rr <= x) lo = Math.max(lo, Rr + 1); else if (L >= x) hi = Math.min(hi, L - 1); }
  return [lo, hi];
}
// the first standing giant ahead (toward d) of the stag: its face in px, or null
function cerNextGiant(e, d) {
  const B = fpBoss; let best = null;
  for (let k = 0; k < B.trunks.length; k++) {
    if (!fpStanding(k)) continue;
    const Tr = B.trunks[k], face = d > 0 ? fpPx(Tr.x) : fpPx(Tr.x) + Tr.w * T, front = d > 0 ? e.x + e.w : e.x, dist = (face - front) * d;
    if (dist < -Tr.w * T) continue;
    if (!best || dist < best.dist) best = { k, face, dist };
  }
  return best;
}
// floor mode: feet on the gravel, a hop over the rift
function cerFloorY(e) {
  const B = fpBoss, rx0 = fpPx(B.rift.x0) - 6, rx1 = rx0 + B.rift.w * T + 12, c = e.x + e.w / 2;
  if (c > rx0 && c < rx1) return fpFloorY() - Math.sin((c - rx0) / (rx1 - rx0) * Math.PI) * 30;
  return fpFloorY();
}
// moving along the floor at vx (px/s); giants stop him unless he is charging (then they fall); false when stopped
function cerMove(e, dt, vx, smash) {
  const d = Math.sign(vx); let stop = false;
  if (d) {
    const g = cerNextGiant(e, d);
    if (g) {
      if (smash) {
        const eta = g.dist / Math.abs(vx);
        if (eta <= 1.0 && g.dist > -4) { const f = trqFalls.find(o => o.cerK === g.k) || cerTopple(g.k, d, Math.max(0.15, eta)); if (f && g.dist <= 2) trqNow(f); }
      } else if (g.dist <= Math.abs(vx) * dt + 1) { e.x += d * Math.max(0, g.dist - 1); stop = true; vx = 0; }
    }
    e.x += vx * dt;
    const lo = cerLo(), hi = cerHi() - e.w;
    if (e.x <= lo) { e.x = lo; stop = true; } else if (e.x >= hi) { e.x = hi; stop = true; }
  }
  e.mode = 'floor'; e.bar = null;
  e.y = approach(e.y, cerFloorY(e) - e.h, 400 * dt);
  e.svx = vx;
  return !stop;
}
// the leap: an arc from where he is to (x, feet) in time t
function cerLeap(e, x, feet, bar) {
  const t = clamp(Math.hypot(x - e.x, feet - e.y - e.h) / 300, 0.55, 1.0);
  e.leap = { x0: e.x, y0: e.y + e.h, x1: x, y1: feet, t, bar, apex: Math.min(e.y + e.h, feet) - 46 };
  e.facing = Math.sign(x - e.x) || e.facing;
  cerSet(e, 'crouch', 0.3); sfx.cerSalto();
}
function cerLeapTick(e, dt) {
  const L = e.leap, k = Math.min(1, e.stateT0 / L.t), ux = L.x0 + (L.x1 - L.x0) * k;
  // a parabola through the apex: y(k) = (1-k)^2 y0 + 2k(1-k) ym + k^2 y1, with ym set so the top is at the apex
  const ym = 2 * L.apex - (L.y0 + L.y1) / 2, fy = (1 - k) * (1 - k) * L.y0 + 2 * k * (1 - k) * ym + k * k * L.y1;
  e.x = ux; e.y = fy - e.h; e.mode = 'air';
  if (k >= 1) {
    if (L.bar && cerFx.bars.includes(L.bar)) { e.mode = 'perch'; e.bar = L.bar; } else { e.mode = 'floor'; e.bar = null; }
    e.leap = null; burst(e.x + e.w / 2, e.y + e.h, 14, '#566a5a', 80, 300, 0.5); shake(4); sfx.cerPouso();
    return true;
  }
  return false;
}
// the highest point of a lying trunk: where he stands on it
function cerPerchOf(bar) {
  let best = null;
  for (const i of bar.cells) { const c = i % WW, r = (i / WW) | 0; if (SOLID[tileAt(c, r - 1)]) continue; if (!best || r < best.r) best = { c, r }; }
  return best ? { x: fpPx(best.c) + T / 2, feet: best.r * T, c: best.c } : null;
}
// a lying trunk near column `rel` (0..w-1) with a perch high enough
function cerPickBar(nearRel, except, seg) {
  let best = null;
  for (const bar of cerFx.bars) {
    if (bar === except || cerFx.cracks.some(C => C.bar === bar)) continue;
    const p = cerPerchOf(bar); if (!p || p.feet > fpFloorY() - 3 * T) continue;
    if (seg && (p.x < seg[0] + 20 || p.x > seg[1] - 20)) continue;
    const score = Math.abs(fpRel(p.c) - nearRel) - (fpFloorY() - p.feet) / T * 0.6;
    if (!best || score < best.score) best = { bar, p, score };
  }
  return best;
}
// on a lying trunk: his feet follow it (it may have slid)
function cerPerchTick(e, dt) {
  if (!e.bar || !cerFx.bars.includes(e.bar)) { cerSet(e, 'fall', 2); e.mode = 'air'; e.fvy = 0; return; }
  const p = cerPerchOf(e.bar); if (!p) { cerSet(e, 'fall', 2); e.fvy = 0; return; }
  e.x = approach(e.x, p.x - e.w / 2, 60 * dt); e.y = approach(e.y, p.feet - e.h, 200 * dt);
}

AI.cervo = function (e, dt) {
  const W = WW * T, d = e.x - pl.x; if (Math.abs(d) > W / 2) { e.x -= Math.sign(d) * W; if (e.leap) { e.leap.x0 -= Math.sign(d) * W; e.leap.x1 -= Math.sign(d) * W; } }
  cerBrain(e, dt);
  e.vx = e.vy = 0;
  e.lastHp = e.hp;
};
function cerBrain(e, dt) {
  const B = fpBoss, pcx = cerPcx(), ecx = e.x + e.w / 2, toPl = Math.sign(pcx - ecx) || e.facing, adx = Math.abs(pcx - ecx), feetP = pl.y + pl.h;
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt;
  if (Math.random() < dt * 2) parts.push({ x: e.x + rnd(6, e.w - 6), y: e.y + rnd(4, e.h - 10), vx: rnd(-6, 6), vy: rnd(4, 14), g: 200, life: 0.7, max: 0.7, col: Math.random() < 0.5 ? '#3e5044' : '#566a5a', size: 1 });   // stone dust
  // the thresholds
  const busy = e.state === 'charge' || e.state === 'run' || e.state === 'leap' || e.state === 'crouch' || e.state === 'dive' || e.state === 'fall';
  if (e.ph === 0 && e.hp <= e.maxHp * CER.p2 && e.state !== 'intro' && !busy) { e.ph = 1; e.hp = Math.min(e.hp, Math.floor(e.maxHp * CER.p2)); cerSet(e, 'bloom', 1.8); sfx.cerFlor(); return; }
  if (e.ph === 1 && e.hp <= e.maxHp * CER.p3 && !busy) { e.ph = 2; e.hp = Math.min(e.hp, Math.floor(e.maxHp * CER.p3)); cerSet(e, 'heart', 1.4); sfx.cerRacha(); e.tiredN = 0; return; }
  const onFloor = e.mode === 'floor';
  switch (e.state) {
    case 'intro':
      cerMove(e, dt, 0, false); e.facing = toPl;
      if (e.stateT0 > 1.0 && !e.bellowed) { e.bellowed = true; sfx.cerBerro(); shake(5); }
      if (e.stateT <= 0) { cerSet(e, 'idle', 0); e.cd = 0.6; }
      return;
    case 'idle':
      if (e.mode === 'perch') { cerPerchTick(e, dt); if (e.state !== 'idle') return; e.facing = toPl; return cerPerchThink(e, dt); }
      return cerFloorThink(e, dt);
    case 'walk': {
      const tx = e.walkX, dx = tx - ecx;
      const moving = cerMove(e, dt, Math.abs(dx) > 4 ? Math.sign(dx) * 80 : 0, false);
      if (Math.abs(dx) > 4) e.facing = Math.sign(dx);
      if (Math.abs(dx) <= 4 || !moving || e.stateT <= 0) { cerSet(e, 'idle', 0); e.cd = Math.max(e.cd, 0.2); }
      return;
    }
    /* ----- the charge: pawing, antlers down, then straight to the wall ----- */
    case 'pawTell':
      cerMove(e, dt, 0, false);
      if (e.stateT0 > 0.3 && !e.paw1) { e.paw1 = true; sfx.cerRaspa(); burst(ecx + e.facing * 20, fpFloorY() - 1, 6, '#566a5a', 50, 300, 0.4); }
      if (e.stateT0 > 0.6 && !e.paw2) { e.paw2 = true; sfx.cerRaspa(); burst(ecx + e.facing * 20, fpFloorY() - 1, 6, '#566a5a', 50, 300, 0.4); }
      if (e.stateT0 > 0.9 && !e.low) { e.low = true; sfx.cerFaisca(); }
      if (Math.random() < dt * 20 && e.stateT0 > 0.9) { const m = CERA.get().meta[8].tips, p = m[(Math.random() * m.length) | 0], [x, y] = cerMetaPt(e, p); parts.push({ x, y, vx: rnd(-20, 20), vy: rnd(-30, 0), g: 60, life: 0.35, max: 0.35, col: '#8ad8cc', size: 1, glow: true }); }
      if (e.stateT <= 0) { cerSet(e, 'charge', 8); e.hitP = false; e.dir = e.facing; sfx.cerCascos(1.2); }
      return;
    case 'charge': case 'run': {
      const going = cerMove(e, dt, e.dir * CER.spd * (e.state === 'run' ? 0.9 : 1), e.state === 'charge'); e.facing = e.dir;
      if (Math.random() < dt * 9) sfx.cerCasco();
      if (Math.random() < dt * 30) parts.push({ x: ecx - e.dir * 20, y: fpFloorY() - 2, vx: -e.dir * rnd(20, 60), vy: rnd(-50, -10), g: 300, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#3a473f' : '#849686', size: 1 });
      // the antlers: whoever is in front of them, low enough
      if (e.state === 'charge' && !e.hitP && !pl.dead) {
        const fx = e.dir > 0 ? e.x + e.w : e.x, rel = (pcx - fx) * e.dir;
        if (rel > -26 && rel < 10 && feetP > e.y + e.h - 34 && pl.y < e.y + e.h) {
          e.hitP = true; const r = hurtPlayer(e.dmg, ecx, e, false);
          if (r === 'hit') { pl.vx = e.dir * 330; pl.vy = -230; }
        }
      }
      if (!going) {
        if (e.state === 'run') return cerArrive(e);
        shake(7); sfx.cerParede(); burst(e.dir > 0 ? e.x + e.w : e.x, e.y + e.h - 20, 22, '#566a5a', 120, 300, 0.7);
        e.tiredN++; cerSet(e, 'stagger', 0.7);
      }
      return;
    }
    case 'stagger': cerMove(e, dt, 0, false); if (e.stateT <= 0) cerAfter(e); return;
    /* ----- the kick ----- */
    case 'kickTell': cerMove(e, dt, 0, false); if (e.stateT <= 0) { cerSet(e, 'kick', 0.4); sfx.cerCoice(); e.hitP = false; } return;
    case 'kick':
      cerMove(e, dt, 0, false);
      if (!e.hitP && !pl.dead && e.stateT0 < 0.2) {
        const back = e.facing > 0 ? e.x : e.x + e.w, rel = (back - pcx) * e.facing;
        if (rel > -8 && rel < 44 && feetP > e.y + 10 && pl.y < e.y + e.h) { e.hitP = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx = -e.facing * 300; pl.vy = -200; } }
      }
      if (e.stateT <= 0) { cerSet(e, 'idle', 0); e.cd = 0.5 + Math.random() * 0.4; }
      return;
    /* ----- the rear and the wave ----- */
    case 'rearTell': cerMove(e, dt, 0, false); if (e.stateT <= 0) { cerSet(e, 'slam', 0.45); cerSlam(e); } return;
    case 'slam': cerMove(e, dt, 0, false); if (e.stateT <= 0) { cerSet(e, 'idle', 0); e.cd = 0.6 + Math.random() * 0.5; } return;
    /* ----- phase 2: the flowering, the run to the far end, up on a trunk ----- */
    case 'bloom':
      if (onFloor) cerMove(e, dt, 0, false); else if (e.mode === 'perch') cerPerchTick(e, dt);
      if (Math.random() < dt * 30) { const m = CERA.get().meta[cerPose(e)].tips, p = m[(Math.random() * m.length) | 0], [x, y] = cerMetaPt(e, p); parts.push({ x, y, vx: rnd(-15, 15), vy: rnd(-25, 5), g: 30, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#8ad8cc' : '#d4f4ec', size: 1, glow: true }); }
      if (e.stateT <= 0) cerGoFar(e);
      return;
    case 'heart':
      if (onFloor) cerMove(e, dt, 0, false); else if (e.mode === 'perch') cerPerchTick(e, dt);
      if (e.stateT0 < 0.1 && !e.burst3) { e.burst3 = true; const [x, y] = cerMetaPt(e, CERA.get().meta[15].chest); burst(x, y, 30, '#8ad8cc', 140, 200, 0.8, 1, true); burst(x, y, 20, '#566a5a', 110, 300, 0.7, 2); shake(6); }
      if (e.stateT <= 0) { cerSet(e, 'idle', 0); e.cd = 0.4; }
      return;
    case 'crouch': if (e.mode === 'perch') cerPerchTick(e, dt); if (e.stateT <= 0 && e.leap) { e.leap.x0 = e.x; e.leap.y0 = e.y + e.h; cerSet(e, 'leap', e.leap.t + 0.01); } return;
    case 'leap':
      if (cerLeapTick(e, dt)) {
        if (e.mode === 'perch') { cerSet(e, 'idle', 0); e.perchAt = gameTime; e.cd = e.ph >= 2 ? 0.15 : 0.8; if (e.ph >= 2) cerCrackBar(e.bar); }
        else { cerSet(e, 'idle', 0); e.cd = 0.3; if (e.afterLeap) { const f = e.afterLeap; e.afterLeap = null; f(e); } }
      }
      return;
    case 'fall':   // his trunk broke under him
      cerFx.dive = null; e.fvy = Math.min((e.fvy || 0) + GRAV * dt, MAXFALL); e.y += e.fvy * dt; e.mode = 'air';
      if (e.y + e.h >= cerFloorY(e)) { e.y = cerFloorY(e) - e.h; e.fvy = 0; e.mode = 'floor'; burst(ecx, e.y + e.h, 12, '#566a5a', 70, 300, 0.5); shake(4); sfx.cerPouso(); cerSet(e, 'idle', 0); e.cd = 0.5; }
      return;
    /* ----- from up high ----- */
    case 'shake':
      if (onFloor) cerMove(e, dt, 0, false); else cerPerchTick(e, dt);
      if (Math.random() < dt * 30) parts.push({ x: ecx + rnd(-20, 30) * e.facing, y: e.y - rnd(10, 40), vx: rnd(-60, 60), vy: rnd(-40, 10), g: 200, life: 0.4, max: 0.4, col: '#8ad8cc', size: 1 });
      if (e.stateT <= 0) { cerLeaves(e); cerSet(e, 'idle', 0); e.cd = 1.2 + Math.random() * 0.6; }
      return;
    case 'bellow':
      if (onFloor) cerMove(e, dt, 0, false); else cerPerchTick(e, dt);
      if (e.stateT <= 0) { cerBerro(e); cerSet(e, 'idle', 0); e.cd = 1.4 + Math.random() * 0.6; }
      return;
    case 'diveTell': {
      cerPerchTick(e, dt); const D = cerFx.dive; if (D) D.t += dt; e.facing = D ? Math.sign(D.x1 - D.x0) || e.facing : e.facing;
      if (e.stateT <= 0 && D) { D.st = 'go'; D.t = 0; cerSet(e, 'dive', 2); e.hitP = false; e.mode = 'air'; e.bar = null; sfx.cerMergulho(); }
      return;
    }
    case 'dive': {
      const D = cerFx.dive; if (!D) { cerSet(e, 'fall', 2); return; }
      const L = Math.hypot(D.x1 - D.x0, D.y1 - D.y0) || 1, sp = 470 * dt, fx = e.x + e.w / 2, fy = e.y + e.h, rx = D.x1 - fx, ry = D.y1 - fy, rl = Math.hypot(rx, ry);
      if (rl <= sp) { e.x = D.x1 - e.w / 2; e.y = D.y1 - e.h; }
      else { e.x += rx / rl * sp; e.y += ry / rl * sp; }
      if (!e.hitP && !pl.dead && overlap(e, pl)) { e.hitP = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx = (Math.sign(D.x1 - D.x0) || 1) * 300; pl.vy = -220; } }
      if (rl <= sp || L < 1) {
        cerFx.dive = null; e.mode = 'floor'; e.y = cerFloorY(e) - e.h;
        shake(8); sfx.cerPouso(1.4); burst(e.x + e.w / 2, e.y + e.h, 30, '#8ad8cc', 130, 300, 0.6, 1, true); burst(e.x + e.w / 2, e.y + e.h, 20, '#566a5a', 110, 300, 0.6);
        e.tiredN++; cerSet(e, 'stagger', 0.5);
      }
      return;
    }
    case 'tired':
      if (onFloor) cerMove(e, dt, 0, false); else cerPerchTick(e, dt);
      if (Math.random() < dt * 3) { sfx.cerOfego(); const [x, y] = cerMetaPt(e, CERA.get().meta[19].head); parts.push({ x: x + e.facing * 12, y: y + 6, vx: e.facing * 14, vy: -6, g: -10, life: 0.9, max: 0.9, col: '#74887a', size: 2, smoke: true }); }
      if (e.stateT <= 0) { e.tiredN = 0; cerSet(e, 'idle', 0); e.cd = 0.3; }
      return;
  }
}
// after a charge or a dive: tired every 3 in phase 3, else on
function cerAfter(e) {
  if (e.ph >= 2 && e.tiredN >= 3) { cerSet(e, 'tired', 2); return; }
  cerSet(e, 'idle', 0); e.cd = 0.5 + Math.random() * 0.4;
}
// on the floor: what next
function cerFloorThink(e, dt) {
  const pcx = cerPcx(), ecx = e.x + e.w / 2, toPl = Math.sign(pcx - ecx) || e.facing, adx = Math.abs(pcx - ecx), feetP = pl.y + pl.h;
  cerMove(e, dt, 0, false);
  if (e.cd > 0) { e.facing = adx > 30 ? toPl : e.facing; return; }
  const behind = (pcx - ecx) * e.facing < -10 && adx < e.w / 2 + 40 && Math.abs(feetP - (e.y + e.h)) < 40;
  if (behind && Math.random() < 0.8) { cerSet(e, 'kickTell', 0.5); sfx.cerBufa(); return; }
  e.facing = toPl;
  const r = Math.random();
  if (e.ph === 1) {   // phase 2 on the floor: no more charges; up again, the bellow, the leaves, the rear when close
    const standing = fpBoss.trunks.some((_, k) => fpStanding(k)), near = adx < 8 * T && Math.abs(feetP - (e.y + e.h)) < 3 * T;
    if (standing && r < 0.35) { cerSet(e, 'bellow', 1.0); sfx.cerBerro(); return; }
    if (r < 0.65 && cerPickBar(fpRel(fpCol(ecx)), null, cerSeg(ecx))) { cerGoFar(e); return; }
    if (near && r < 0.85) { cerSet(e, 'rearTell', 0.7); sfx.cerEmpina(); return; }
    cerSet(e, 'shake', 0.9); sfx.cerSacode(); return;
  }
  if (e.ph === 2 && r < 0.4) {   // phase 3: up onto a trunk
    const P = cerPickBar(fpRel(fpCol(ecx)), null, cerSeg(ecx));
    if (P) { cerLeap(e, P.p.x - e.w / 2, P.p.feet, P.bar); return; }
  }
  const near = adx < 8 * T && Math.abs(feetP - (e.y + e.h)) < 3 * T;
  if (near && Math.random() < 0.45) { cerSet(e, 'rearTell', 0.7); sfx.cerEmpina(); return; }
  if (Math.random() < 0.7 || adx > 10 * T) {
    // no room to run that way: he turns and runs the length of the clearing instead
    if ((e.facing > 0 ? cerHi() - e.x - e.w : e.x - cerLo()) < 5 * T) e.facing = -e.facing;
    cerSet(e, 'pawTell', 1.3); e.paw1 = e.paw2 = e.low = false; return; }
  e.walkX = clamp(pcx - toPl * 40, cerLo() + e.w / 2, cerHi() - e.w / 2); cerSet(e, 'walk', 1.6);
}
// up on a trunk: what next
function cerPerchThink(e, dt) {
  const pcx = cerPcx(), ecx = e.x + e.w / 2, adx = Math.abs(pcx - ecx), dy = Math.abs(pl.y + pl.h - (e.y + e.h));
    if (e.ph === 1 && ((adx < 72 && dy < 48) || gameTime - (e.perchAt || 0) > 10)) {   // the hero got close: down, and off to the other end
    const B = fpBoss, side = Math.sign(ecx - pcx) || 1, sg = cerSeg(ecx), lx = clamp(ecx + side * 70, sg[0] + e.w / 2 + 2, sg[1] - e.w / 2 - 2);
    let x = lx; if (fpInRift(fpCol(x))) x = fpPx(B.rift.x0) + (side > 0 ? (B.rift.w + 3) * T : -3 * T);
    cerLeap(e, x - e.w / 2, fpFloorY(), null); e.afterLeap = cerGoFar; return;
  }
  if (e.cd > 0) return;
  const r = Math.random();
  if (e.ph >= 2) {
    if (r < 0.45 && cerDiveTell(e)) return;
    if (r < 0.75) { const P = cerPickBar(fpRel(fpCol(pcx)), e.bar, cerSeg(ecx)); if (P) { cerLeap(e, P.p.x - e.w / 2, P.p.feet, P.bar); return; } }
    if (r < 0.9) { cerSet(e, 'shake', 0.9); sfx.cerSacode(); return; }
    if (!cerDiveTell(e)) { cerSet(e, 'shake', 0.9); sfx.cerSacode(); }
    return;
  }
  const standing = fpBoss.trunks.some((_, k) => fpStanding(k));
  if (standing && r < 0.4) { cerSet(e, 'bellow', 1.0); sfx.cerBerro(); return; }
  cerSet(e, 'shake', 0.9); sfx.cerSacode();
}
// phase 2: run to the end farther from the hero, then up onto the highest trunk near it
function cerGoFar(e) {
  const pcx = cerPcx(), [lo, hi] = cerSeg(e.x + e.w / 2), d = (pcx - lo) > (hi - pcx) ? -1 : 1;
  e.dir = d; e.facing = d; cerSet(e, 'run', 8); e.hitP = true;
}
function cerArrive(e) {
  const ecx = e.x + e.w / 2, P = cerPickBar(fpRel(fpCol(ecx)), null, cerSeg(ecx));
  if (P) { cerLeap(e, P.p.x - e.w / 2, P.p.feet, P.bar); return; }
  cerSet(e, 'idle', 0); e.cd = 0.4;
}
// the wave: the front hooves come down; a ripple runs 6 blocks each way along the floor
function cerSlam(e) {
  const m = CERA.get().meta[10].front[0], [x] = cerMetaPt(e, m);
  shake(7); sfx.cerOnda(); burst(x, fpFloorY() - 2, 20, '#566a5a', 110, 300, 0.6);
  cerFx.waves.push({ y: fpFloorY(), fronts: [-1, 1].map(d => ({ x, x0: x, d, on: true, hit: false })) });
}
// the leaf rain: shadows on the ground (1 s), then crystal leaves from the roof
function cerLeaves(e) {
  const B = fpBoss, pcx = cerPcx(), lo = cerLo() + 6, hi = cerHi() - 6;
  for (let k = 0; k < 6; k++) {
    const x = clamp(k === 0 ? pcx : pcx + rnd(-110, 110), lo, hi);
    let r = B.top + 1; while (r < B.fy + B.rift.depth && !solidAt(fpCol(x), r)) r++;
    cerFx.leaves.push({ x, y: B.top * T + 2, land: r * T, t: -1.0 - k * 0.12, vy: 0, hit: false, done: false, sw: rnd(0, 6) });
  }
}
// the bellow: the two standing giants nearest the hero crack and fall toward him
function cerBerro(e) {
  const B = fpBoss, pcx = cerPcx(), list = [];
  for (let k = 0; k < B.trunks.length; k++) if (fpStanding(k)) { const Tr = B.trunks[k], c = fpPx(Tr.x) + Tr.w * T / 2; list.push({ k, c, d: Math.abs(c - pcx) }); }
  list.sort((a, b) => a.d - b.d);
  for (const o of list.slice(0, 2)) cerTopple(o.k, Math.sign(pcx - o.c) || 1, 1.0);
  shake(5);
}
// phase 3: a trunk he lands on cracks (1 s) and breaks to gravel, but never the last two
function cerCrackBar(bar) {
  if (!bar || cerFx.bars.length <= 2 || cerFx.cracks.some(C => C.bar === bar)) return;
  cerFx.cracks.push({ bar, t: 0, max: 1.3 }); sfx.cerRachaTronco();
}
function cerBreakBar(bar) {
  const j = cerFx.bars.indexOf(bar); if (j < 0) return;
  cerFx.bars.splice(j, 1);
  for (const i of bar.cells) { if (fpLying(tiles[i])) setTile(i % WW, (i / WW) | 0, AIR); const x = fpPx(i % WW) + 6, y = ((i / WW) | 0) * T + 6; burst(x, y, 4, Math.random() < 0.5 ? '#3a473f' : '#849686', 80, 400, 0.7); if (Math.random() < 0.3) burst(x, y, 2, '#8ad8cc', 60, 300, 0.6, 1, true); }
  sfx.cerQuebra(); shake(5);
  cerSettle();
}
// the dive: from up high, at where the hero stands; the line of chips shows it 0.8 s first
function cerDiveTell(e) {
  const pcx = cerPcx(), sg = cerSeg(e.x + e.w / 2); let tx = clamp(pcx, sg[0] + e.w / 2, sg[1] - e.w / 2);
  if (Math.abs(tx - (e.x + e.w / 2)) < 20 && Math.abs(pcx - tx) > 40) return false;   // the hero is past a standing giant
  if (fpInRift(fpCol(tx))) tx = fpPx(fpBoss.rift.x0) + (tx < fpPx(fpBoss.rift.x0) + fpBoss.rift.w * T / 2 ? -3 * T : (fpBoss.rift.w + 3) * T);
  cerFx.dive = { st: 'tell', t: 0, x0: e.x + e.w / 2, y0: e.y + e.h, x1: tx, y1: fpFloorY() };
  e.facing = Math.sign(tx - e.x - e.w / 2) || e.facing;
  cerSet(e, 'diveTell', 0.8); sfx.cerFaisca();
  return true;
}

/* the waves, the leaves, the cracking trunks; the rift */
function cerFxTick(dt) {
  const e = cerBoss, pcx = cerPcx(), feet = pl.y + pl.h;
  for (let n = cerFx.waves.length - 1; n >= 0; n--) {
    const W = cerFx.waves[n]; let live = false;
    for (const F of W.fronts) {
      if (!F.on) continue; live = true;
      F.x += F.d * 170 * dt;
      if (Math.abs(F.x - F.x0) >= 6 * T || F.x < cerLo() || F.x > cerHi()) { F.on = false; continue; }
      if (Math.random() < dt * 40) parts.push({ x: F.x, y: W.y - 1, vx: rnd(-10, 10), vy: rnd(-60, -20), g: 300, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#566a5a' : '#8ad8cc', size: 1 });
      if (!F.hit && e && !pl.dead && Math.abs(pcx - F.x) < 8 && feet > W.y - 5 && feet <= W.y + 2) { F.hit = true; const r = hurtPlayer(Math.max(1, Math.round(e.dmg * CER.wave)), F.x, null, true); if (r === 'hit') { pl.vy = -180; pl.vx = F.d * 120; } }
    }
    if (!live) cerFx.waves.splice(n, 1);
  }
  for (let n = cerFx.leaves.length - 1; n >= 0; n--) {
    const L = cerFx.leaves[n]; L.t += dt; if (L.t < 0) continue;
    if (L.done) { if (L.t > 0.5) cerFx.leaves.splice(n, 1); continue; }
    L.vy = Math.min(L.vy + 900 * dt, 520); L.y += L.vy * dt; L.x += Math.sin(L.t * 9 + L.sw) * 0.4;
    if (!L.hit && e && !pl.dead && Math.abs(pcx - L.x) < pl.w / 2 + 3 && L.y > pl.y && L.y - 6 < pl.y + pl.h) { L.hit = true; hurtPlayer(Math.max(1, Math.round(e.dmg * CER.wave)), L.x, null, true); }
    if (L.y >= L.land) { L.done = true; L.t = 0; burst(L.x, L.land - 1, 8, '#8ad8cc', 70, 300, 0.4, 1, true); burst(L.x, L.land - 1, 4, '#2f7e8a', 50, 300, 0.4); sfx.cerFolha(); }
  }
  for (let n = cerFx.cracks.length - 1; n >= 0; n--) {
    const C = cerFx.cracks[n]; C.t += dt;
    if (Math.random() < dt * 12) { const i = C.bar.cells[(Math.random() * C.bar.cells.length) | 0]; if (i !== undefined) parts.push({ x: fpPx(i % WW) + rnd(0, 12), y: ((i / WW) | 0) * T + 12, vx: rnd(-8, 8), vy: rnd(0, 20), g: 300, life: 0.5, max: 0.5, col: '#6e5e4d', size: 1 }); }
    if (C.t >= C.max) { cerFx.cracks.splice(n, 1); cerBreakBar(C.bar); }
  }
}
// falling into the rift: it hurts and puts the hero back on the nearer edge (never kills)
function cerRiftCheck() {
  const B = fpBoss; if (!B || pl.dead) return;
  const c = fpCol(pl.x + pl.w / 2); if (!fpInRift(c)) return;
  if (pl.y + pl.h < (B.fy + 2) * T) return;
  const rx0 = fpPx(B.rift.x0), mid = rx0 + B.rift.w * T / 2, left = pl.x + pl.w / 2 < mid;
  const tx = left ? rx0 - T : rx0 + B.rift.w * T + T;
  burst(pl.x + pl.w / 2, pl.y + pl.h, 14, '#8ad8cc', 80, 200, 0.5, 1, true);
  const d = Math.min(Math.round(pl.maxHp * 0.12), Math.max(0, Math.floor(pl.hp) - 1));
  pl.x = tx - pl.w / 2; pl.y = fpFloorY() - pl.h - 1; pl.vx = 0; pl.vy = 0;
  if (rectSolid(pl.x, pl.y, pl.w, pl.h)) cerLift();
  if (d > 0) rawDamage(d, left ? -1 : 1); else { pl.invuln = Math.max(pl.invuln, 0.5); }
  pl.vx = 0; pl.vy = -60;
  sfx.cerEspinho();
}
HOOK.update.push(dt => {
  if (typeof FLORESTA === 'undefined' || !FLORESTA || !fpBoss || !pl) return;
  if (state !== 'play') return;
  const ptx = fpCol(pl.x + pl.w / 2), pty = Math.floor((pl.y + pl.h / 2) / T), B = fpBoss;
  // left the clearing mid-fight (a portal, a recall): the fight is off and the clearing goes back as it was
  if (cerBoss && bossFight && bossFight.cer && !pl.dead && !inFpHall(ptx, pty, 1)) { endBossFight(false); return; }
  if (!inFpHall(ptx, pty, 3)) return;
  cerRiftCheck();
  const rel = fpRel(ptx);
  if (!cerState.dead && !bossFight && !pl.dead && rel >= 2 && rel <= B.w - 3 && pty >= B.top && pty < B.fy) cerStart();
  const e = cerBoss;
  if (e && bossFight && bossFight.cer) { if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } } cerFxTick(dt); }
});

/* ---------- sounds: stone hooves, the scrape, the bellow (a low horn through stone), cracking, the crystal ---------- */
Object.assign(sfx, {
  cerCasco() { noise(0.07, 0.07, 240, 'lowpass'); tone(64 + Math.random() * 14, 0.08, 'sine', 0.04, -20); noise(0.03, 0.03, 2400, 'bandpass', 0.01, 2); },
  cerCascos(v = 1) { for (let k = 0; k < 6; k++) { noise(0.07, 0.06 * v, 260, 'lowpass', k * 0.13); tone(60 + (k % 2) * 8, 0.08, 'sine', 0.035 * v, -18, k * 0.13); } },
  cerRaspa() { noise(0.32, 0.08, 1300, 'bandpass', 0, 1.4); noise(0.25, 0.05, 380, 'lowpass', 0.04); for (let k = 0; k < 4; k++) noise(0.03, 0.03, 4200, 'highpass', 0.05 + k * 0.06); },
  cerFaisca() { for (let k = 0; k < 5; k++) tone(1900 + Math.random() * 900, 0.06, 'sine', 0.012, 400, k * 0.07); tone(140, 0.5, 'sawtooth', 0.012, 30); },
  cerBerro() {
    // a bellow through stone: a low sawtooth bending up then down, a hollow fifth, the rasp of the throat
    tone(72, 1.5, 'sawtooth', 0.045, 18); tone(108, 1.3, 'sawtooth', 0.022, 24, 0.05); tone(144, 1.0, 'triangle', 0.02, -30, 0.2);
    noise(1.4, 0.05, 420, 'bandpass', 0, 2.5); noise(0.9, 0.03, 1600, 'bandpass', 0.3, 3);
  },
  cerBufa() { noise(0.35, 0.07, 700, 'bandpass', 0, 1); noise(0.25, 0.05, 300, 'lowpass', 0.1); },
  cerCoice() { tone(90, 0.18, 'square', 0.05, -50); noise(0.2, 0.1, 500, 'lowpass'); noise(0.1, 0.05, 2600, 'bandpass', 0.02); },
  cerEmpina() { tone(70, 0.7, 'sawtooth', 0.03, 30); noise(0.6, 0.04, 900, 'bandpass', 0, 2); },
  cerOnda() { noise(0.8, 0.14, 220, 'lowpass'); tone(42, 0.8, 'sine', 0.08, -10); for (let k = 0; k < 6; k++) noise(0.05, 0.04, 2400, 'bandpass', 0.05 + k * 0.08, 3); },
  cerParede() { noise(0.9, 0.16, 260, 'lowpass'); tone(38, 0.9, 'sine', 0.08, -8); noise(0.4, 0.08, 1500, 'bandpass', 0.05); },
  cerSacode() { for (let k = 0; k < 9; k++) tone(1400 + Math.random() * 1600, 0.12, 'sine', 0.01, 0, k * 0.08); noise(0.8, 0.04, 2600, 'bandpass', 0, 1.5); },
  cerFolha() { tone(1600 + Math.random() * 1200, 0.18, 'sine', 0.014, -200); noise(0.06, 0.03, 4000, 'highpass'); },
  cerFlor() { const N = [784, 988, 1175, 1568, 1319]; for (let k = 0; k < N.length; k++) { tone(N[k], 1.2, 'sine', 0.016, 0, k * 0.18); tone(N[k] * 2.01, 0.6, 'sine', 0.006, 0, k * 0.18); } noise(1.4, 0.03, 3000, 'bandpass', 0, 1); },
  cerRacha() { noise(0.6, 0.12, 500, 'lowpass'); for (let k = 0; k < 8; k++) noise(0.05, 0.05, 2800, 'bandpass', k * 0.09, 4); tone(988, 1.6, 'sine', 0.02, 0, 0.5); tone(1482, 1.4, 'sine', 0.012, 0, 0.55); },
  cerSalto() { noise(0.25, 0.06, 500, 'lowpass'); noise(0.3, 0.04, 1400, 'bandpass', 0.05, 1.2); },
  cerPouso(v = 1) { noise(0.5, 0.12 * v, 240, 'lowpass'); tone(46, 0.5, 'sine', 0.06 * v, -10); },
  cerMergulho() { noise(0.6, 0.07, 900, 'bandpass', 0, 1.2); tone(300, 0.5, 'sawtooth', 0.015, -220); },
  cerRachaTronco() { for (let k = 0; k < 9; k++) noise(0.05, 0.04, 2400 + Math.random() * 1500, 'bandpass', k * 0.1, 4); tone(70, 1, 'sawtooth', 0.015, -15); },
  cerQuebra() { noise(0.7, 0.14, 380, 'lowpass'); for (let k = 0; k < 10; k++) noise(0.04, 0.05, 3000 + Math.random() * 2000, 'bandpass', k * 0.04, 3); tone(1200, 0.4, 'sine', 0.012, -300, 0.05); },
  cerAssenta() { noise(0.4, 0.06, 300, 'lowpass'); tone(52, 0.35, 'sine', 0.03, -8); },
  cerOfego() { noise(0.5, 0.05, 600, 'bandpass', 0, 0.8); noise(0.4, 0.035, 500, 'bandpass', 0.55, 0.8); },
  cerCerne() { tone(1760, 0.3, 'sine', 0.02, -100); tone(2637, 0.2, 'sine', 0.01, 0, 0.02); },
  cerEspinho() { for (let k = 0; k < 4; k++) tone(2000 + Math.random() * 1200, 0.1, 'sine', 0.015, -500, k * 0.03); noise(0.15, 0.06, 1800, 'bandpass'); },
  cerMuralha(open) { for (let k = 0; k < 8; k++) tone(70 + Math.random() * 40, 0.12, 'sawtooth', 0.02, open ? 20 : -20, k * 0.09); noise(0.9, 0.06, 500, 'bandpass', 0, 1.2); noise(0.5, 0.06, 220, 'lowpass', 0.3); },
  cerCarga() { tone(880, 0.15, 'sine', 0.015, 300); tone(1320, 0.2, 'sine', 0.01, 200, 0.05); },
  cerInvestida() { noise(0.25, 0.1, 400, 'lowpass'); tone(110, 0.25, 'square', 0.03, -60); tone(1760, 0.3, 'sine', 0.012, -400); },
  cerMorte() {
    tone(64, 3.2, 'sawtooth', 0.035, -22); tone(96, 2.6, 'sawtooth', 0.016, -30, 0.1); noise(2.6, 0.08, 240, 'lowpass'); noise(1.8, 0.04, 1200, 'bandpass', 0.4, 2);
    const N = [1319, 1175, 988, 784, 659]; for (let k = 0; k < N.length; k++) tone(N[k], 1.6, 'sine', 0.014, 0, 1.2 + k * 0.32);
  }
});

/* ---------- save ---------- */
{ const _nw = newWorld; newWorld = function (sd, sv) {
  cerBoss = null; fpBossMold = null; cerFx.gates.length = 0; cerClear(); cerFellQ = []; trqClear(); cerBarsReset();
  cerState.dead = !!(sv && sv.cervo && sv.cervo.dead);   // before the build: the dressing reads it
  const r = _nw(sd, sv);
  if (fpBoss) fpBoss.dead = cerState.dead;
  return r;
}; }
