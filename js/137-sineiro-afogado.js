'use strict';

/* ================= O Sineiro Afogado: the boss of A Cidade Afundada =================
   The Torre do Sino that 136 cuts at the bottom of the Palácio do Sino (cdBoss: an empty 20 x 50 inside, a marble
   shell 2 thick, the rooftop bridge from the Bairro do Poço near the top on one side and a door at the bottom on the
   other). cdDress (136 calls it) builds the inside, top to bottom: the belfry with the beam, the wheel and the 6 x 6
   bell; three floors of plank and stone with rope ladders between them; the Cisterna Funda, 6 blocks of black water
   between two stone ledges, a dry nook under the far ledge where the door comes in.
   The ringer tolled the bell all night while the ground swallowed the city and drowned in the cistern; he came back
   swollen and huge, still tied to the bell rope. Step into the belfry and the grille shuts the bridge and the door
   (leaving, by portal or by dying, resets it all: the tower is written back cell by cell, water and bell included).
   Three phases, every blow shown before it lands:
     1. the belfry: the bell swing (he hauls, the bell draws back slowly, then sweeps an arc under the beam), the toll
        (he leans on the rope, the bell rings, a ring of sound runs along the floor both ways: jump it), the drip
        (he shakes, black water falls in thick drops, a circle on the floor under each first). At 65% the beam creaks
        and sheds dust for 2 s and the bell falls through the belfry floor and the 3rd floor.
     2. the floors: the bell is stuck in the 2nd floor, its rope up over the wheel; he climbs his rope like a mast.
        The bell pull (the rope goes taut and the hole's edge shakes, 1 s; the bell goes up and comes down on the
        plate marked with cracks and dust, which breaks), the thrown clapper (raised overhead 0.7 s, thrown like a
        hammer, bounces once, comes back on its chain), the muffled toll (the ring runs along the floor and up and
        down the walls 4 blocks: stay in the middle of the floor). At 30% the last floor gives way.
     3. the Cisterna Funda: the bell half sunk in the middle is the island. The dive (he sinks; bubbles rise where he
        will come up, 1 s; he comes up grabbing and drags you in), the toll under the water (rings on the surface
        0.8 s, then a wave throws everyone in the water or on the bell), and every 20 s two afogados climb out at the
        edges.
   The tower keeps the list of plates (pieces of floor) and when each falls (SIN_PLATES). After the kill the floors
   stay broken, the bell stays as the island, and the rope hangs from the beam to the water as a climbable chain:
   with the ladders that are left the hero climbs back to the bridge without digging. Drops the Badalo do Sineiro
   (legendary mace: every 4th hit in a row tolls: a wave round the hero that stuns for 1 s and hurts with the mace)
   and, the first time, one of the layer's three bases. His death is saved (sineiro).
   Plugs in like the Mãe-Esporo (126): cdDress, endBossFight, hitEnemy, killEnemy, breakTile, updatePlayer, recalc,
   makeSave and newWorld are wrapped; the rest through AI/DRAW_E/HOOK. Loads after 136, before 171 and 49. */

// level from the layer's place in the list (129: 2n + 3, 15 as the 6th); written numbers like the monsters', 49 scales
const SIN_L = layerBossLvl('cidade');
const SIN = { hp: Math.round(330 * (1 + 0.3 * (SIN_L - 1)) / 10) * 10, dmg: Math.round(9 * (1 + 0.2 * (SIN_L - 1))), xp: 440, p2: 0.65, p3: 0.3, wave: 0.6 };
const sinState = { dead: false };
ET.sineiro = { name: 'O Sineiro Afogado', w: 28, h: 44, hp: SIN.hp, dmg: SIN.dmg, xp: SIN.xp, kb: 0, fly: true, phase: true, blood: '#3a4a40', boss: true };
const SIN_DROPS = [['badalo_sineiro', 1], ['pocao', 1, 2, 4], ['min_prata', 1, 6, 10], ['moeda_afundada', 1, 4, 8], ['perola_negra', 1, 2, 4], ['corda_alcatroada', 1, 2, 4]];
DROPS.sineiro = SIN_DROPS.filter(([id]) => ITEMS[id]);
let sinBoss = null, sinSnap = null, sinGeoC = null, sinG0 = null;
const sinFx = { gates: [], rings: [], drops: [], clap: null, bubbles: [], surf: [], waves: [], tolls: [], frame: 0 };
const sinBell = { mode: 'hang', u: 120, y: 0, ang: 0, R: 42, vy: 0, t: 0, ring: 0, plate: null, ty: 0, u0: 120, y0: 0 };

/* ---------- the tower's layout, in canonical columns (the bridge on the left; mirrored when it is on the right) ---------- */
// rows from the top of the inside: the beam 0, the belfry floor 9, the 3rd floor 18, the 2nd 27, the 1st 36, the
// cistern ledges 43, the water 44..49
const SIN_FLOORS = [9, 18, 27, 36];
// the plates: what falls, and when (queda: the bell falling at 65%; puxao k: the k-th bell pull; ultimo: at 30%)
const SIN_PLATES = [
  { r: 9, c0: 7, c1: 15, wood: true, at: 'queda' },
  { r: 18, c0: 3, c1: 16, wood: true, at: 'queda' },
  { r: 27, c0: 2, c1: 6, wood: true, at: 'puxao', k: 0 },
  { r: 27, c0: 13, c1: 17, wood: true, at: 'puxao', k: 1 },
  { r: 36, c0: 2, c1: 6, wood: false, at: 'puxao', k: 2 },
  { r: 36, c0: 13, c1: 17, wood: false, at: 'puxao', k: 3 },
  { r: 27, c0: 7, c1: 12, wood: false, at: 'ultimo' },
  { r: 36, c0: 7, c1: 12, wood: false, at: 'ultimo' }
];
const SIN_LADDERS = [[18, 9, 17], [1, 18, 26], [18, 27, 49]];          // column, first row, last row
const SIN_LAMPS = [[2, 1], [17, 1], [17, 10], [2, 19], [19, 28], [0, 37]];
const SIN_CANDLES = [[1, 42], [17, 42]];
const SIN_ROPE_C = 7;                                                    // the rope left hanging after the kill
// the bell as the island (rows 41..46, columns 7..12): solid only under the painted bell; rubble under it
const SIN_BELL_CELLS = [[9, 41], [10, 41]];
for (let r = 42; r <= 45; r++) for (let c = 8; c <= 11; c++) SIN_BELL_CELLS.push([c, r]);
for (let c = 7; c <= 12; c++) SIN_BELL_CELLS.push([c, 46]);
const SIN_RUBBLE = []; for (let r = 47; r <= 49; r++) for (let c = 7; c <= 12; c++) SIN_RUBBLE.push([c, r]);
const SIN_POOLS = [[54, 78], [162, 182]];                               // the ringer's centre in each pool (canonical px)
const SIN_U_POST = 170, SIN_U_RIM = 98, SIN_U_FAR = 142;               // his place in the belfry; the wheel's two rims

/* ---------- geometry ---------- */
function sinGeo() {
  const B = cdBoss; if (!B) return null;
  if (sinGeoC && sinG0 === B) return sinGeoC;
  sinG0 = B;
  return sinGeoC = { x0: B.x0, top: B.top, fy: B.fy, cx: B.cx, s: B.bridge ? B.bridge.side : -1 };
}
const sinLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const sinCol = c => { const g = sinGeo(); return wrapX(g.x0 + (g.s < 0 ? c : 19 - c)); };
const sinI = (c, r) => (sinGeo().top + r) * WW + sinCol(c);
const sinUx = u => { const g = sinGeo(), X = sinLap(g.x0 * T); return g.s < 0 ? X + u : X + 240 - u; };   // canonical px -> world px
const sinXu = x => { const g = sinGeo(), X = sinLap(g.x0 * T); return g.s < 0 ? x - X : X + 240 - x; };   // world px -> canonical px
const sinRy = r => (sinGeo().top + r) * T;
// the tower with its shell: what nothing may break while he fights
function sinGuard(tx, ty) { const g = sinGeo(); if (!g) return false; const dx = wdx(wrapX(tx) - g.x0); return dx >= -3 && dx <= 22 && ty >= g.top - 3 && ty <= g.fy + 2; }
function sinBellCell(tx, ty) { const g = sinGeo(); if (!g || sinBell.mode !== 'sunk') return false; for (const [c, r] of SIN_BELL_CELLS) if (sinCol(c) === wrapX(tx) && g.top + r === ty) return true; return false; }
const sinInBelfry = (tx, ty) => { const g = sinGeo(); return !!g && inCdHall(tx, ty, -1) && ty <= g.top + 8; };
function sinDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const sinDirty = (i) => { if (chunks.size) markDirty(i % WW, (i / WW) | 0); };

/* ---------- the dressing (136 calls cdDress during the build) ---------- */
function cdDress() {
  if (!cdBoss) return;
  sinGeoC = null; const g = sinGeo();
  const put = (c, r, t) => { tiles[sinI(c, r)] = t; };
  for (let r = 0; r < 50; r++) for (let c = 0; c < 20; c++) {
    const i = sinI(c, r); tiles[i] = AIR;
    walls[i] = r <= 9 ? WCD_MARMORE : r <= 18 ? WCD_MADEIRA : r <= 27 ? WCD_MARMORE : r <= 36 ? WCD_MADEIRA : WCD_LIMO;
  }
  for (let c = 0; c < 20; c++) put(c, 0, CD_MADEIRAME);   // the beam
  // the floors: stone at the walls, the plates between (plank or stone)
  for (const r of SIN_FLOORS) for (let c = 0; c < 20; c++) {
    const p = SIN_PLATES.find(q => q.r === r && c >= q.c0 && c <= q.c1);
    put(c, r, p ? (p.wood ? CD_MADEIRAME : CD_CANTARIA) : CD_MARMORE);
  }
  // the cistern: the ledge on the bridge side down to the bottom; on the door side a ledge over the dry nook the door
  // opens into, closed from the water by a wall
  for (let r = 43; r < 50; r++) for (let c = 0; c < 4; c++) put(c, r, CD_MARMORE);
  for (let r = 43; r <= 45; r++) for (let c = 16; c < 20; c++) put(c, r, CD_MARMORE);
  for (let r = 46; r < 50; r++) put(16, r, CD_MARMORE);
  for (const [c, r0, r1] of SIN_LADDERS) for (let r = r0; r <= r1; r++) put(c, r, CD_ESCADA);
  for (const [c, r] of SIN_LAMPS) put(c, r, CD_LANTERNA);
  for (const [c, r] of SIN_CANDLES) put(c, r, CD_VELAS);
  // nothing of the layer's tunnels, links or sweeps touches it
  for (let y = g.top - 2; y <= g.fy + 1; y++) for (let k = -2; k < 22; k++) cdKeep.add(y * WW + wrapX(g.x0 + k));
  // the water: two basins filled with the others (cdWater, after 87); one when the bell stands between them
  for (const c of [5, 14]) cdBasins.push({ x: sinCol(c), y: g.fy - 1, nivel: g.fy - 6, tipo: AGUA_LIMPA, max: 120, box: [wrapX(g.x0 + 4), wrapX(g.x0 + 15), g.fy - 6, g.fy - 1], plugged: true, sin: true });
  Object.assign(sinBell, { mode: sinState.dead ? 'sunk' : 'hang', u: 120, ang: 0, R: 42, vy: 0, t: 0, ring: 0, plate: null });
  sinBell.y = sinBellRestY();
  if (sinState.dead) sinWreck();
}
const sinBellRestY = () => sinBell.mode === 'sunk' ? sinRy(41) : sinBell.mode === 'stuck' ? sinRy(21) : sinRy(0) + 12;   // the crown's top
// the tower as the fight leaves it: every plate down, the bell in the water, the rope hanging to the water
function sinWreck() {
  for (const p of SIN_PLATES) for (let c = p.c0; c <= p.c1; c++) { const i = sinI(c, p.r); tiles[i] = AIR; sinDirty(i); }
  { const i = sinI(SIN_ROPE_C - 1, 9); tiles[i] = AIR; sinDirty(i); }   // the belfry floor's edge beside the rope: the head would catch on it
  sinBellTiles();
  sinRopeTiles();
}
function sinBellTiles() {
  for (const [c, r] of SIN_BELL_CELLS) { const i = sinI(c, r); tiles[i] = CD_BARREIRA; if (agua.length) agua[i] = 0; sinDirty(i); }
  for (const [c, r] of SIN_RUBBLE) { const i = sinI(c, r); tiles[i] = CD_ENTULHO; if (agua.length) agua[i] = 0; sinDirty(i); }
}
function sinRopeTiles() {
  for (let r = 1; r < 50; r++) { const i = sinI(SIN_ROPE_C, r); if (SOLID[tiles[i]]) break; tiles[i] = CD_CORRENTE; sinDirty(i); }
}

/* ---------- the snapshot: the tower before the fight, written back on a reset ---------- */
function sinSnapTake() {
  const g = sinGeo(), X0 = g.x0 - 2, n = 24, Y0 = g.top - 2, m = g.fy + 2 - Y0;
  const S = { X0, Y0, n, m, t: new Uint16Array(n * m), w: new Uint16Array(n * m), a: new Uint8Array(n * m), d: new Map() };
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) {
    const i = (Y0 + y) * WW + wrapX(X0 + x), k = y * n + x;
    S.t[k] = tiles[i]; S.w[k] = walls[i]; S.a[k] = agua.length ? agua[i] : 0;
    if (diffs.has(i)) S.d.set(i, diffs.get(i));
  }
  sinSnap = S;
}
function sinSnapPut() {
  const S = sinSnap; if (!S) return;
  for (let y = 0; y < S.m; y++) for (let x = 0; x < S.n; x++) {
    const i = (S.Y0 + y) * WW + wrapX(S.X0 + x), k = y * S.n + x;
    if (tiles[i] !== S.t[k] || walls[i] !== S.w[k]) { tiles[i] = S.t[k]; walls[i] = S.w[k]; sinDirty(i); }
    if (agua.length) agua[i] = S.a[k];
    if (S.d.has(i)) diffs.set(i, S.d.get(i)); else diffs.delete(i);
  }
  mapVer++;
}

/* ---------- the grille: over the bridge and the door while he fights ---------- */
function sinGates(on) {
  const B = cdBoss; if (!B) return;
  if (on) {
    sinFx.gates.length = 0;
    for (const O of [B.bridge, B.door]) for (let k = 0; k < 2; k++) for (let y = O.fy - 4; y < O.fy; y++) {
      const x = wrapX(O.x + O.side * k), i = y * WW + x, t = tiles[i]; if (SOLID[t]) continue;
      sinFx.gates.push([i, t]); tiles[i] = CD_BARREIRA; if (agua.length) agua[i] = 0; sinDirty(i);
      if (k === 0) burst(sinLap(x * T + 6), y * T + 2, 3, '#727a84', 40, 200, 0.4);
    }
    sfx.sinGrade();
  } else {
    for (const [i, t] of sinFx.gates) if (tiles[i] === CD_BARREIRA) { tiles[i] = t; sinDirty(i); burst(sinLap((i % WW) * T + 6), ((i / WW) | 0) * T + 6, 3, '#4a5058', 40, 160, 0.5); }
    sinFx.gates.length = 0;
  }
  mapVer++;
}
// nothing breaks the tower while he fights in it; the bell in the water never breaks
{ const _bt = breakTile; breakTile = function (tx, ty) { if ((bossFight && bossFight.sin && sinGuard(tx, ty)) || sinBellCell(tx, ty)) return; return _bt(tx, ty); }; }

/* ---------- the Badalo do Sineiro ---------- */
STAT_DEF.lgBadalo = { t: 'A cada 4º golpe seguido, uma badalada: os inimigos em volta ficam atordoados por 1 s e sofrem o dano da maça', flag: 1 };
STAT_KEYS.push('lgBadalo');
ITEMS.badalo_sineiro = {
  name: 'Badalo do Sineiro', slot: 'weapon', kind: 'mace', rar: 4,
  pal: { w: '#b4c4ac', W: '#6a8c74', l: '#2a4a3c', g: '#3a2a18', G: '#241a10', h: '#2c1f12', p: '#9a7436' },
  legend: [['lgBadalo', 1]],
  desc: 'O badalo do sino da cidade, ainda preso a um pedaço de corrente. Quando bate, a torre inteira lembra.'
};
BASE_INFO.badalo_sineiro = [SIN_L, 0.76];
ITEM_G.badalo_sineiro = 0; ITEMS.badalo_sineiro.g = 0;
DROPS.sineiro = SIN_DROPS.filter(([id]) => ITEMS[id]);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgBadalo || 0;
  if (pl.lg) pl.lg.badalo = b > 0;
  return r;
}; }
// a blow lands: one per swing counts; 1.5 s without landing one starts the count again
const sinBad = { n: 0, at: -9, last: -9, busy: false };
function sinBadaladaHit() {
  if (sinBad.at === pl.atkAt) return;
  sinBad.at = pl.atkAt;
  if (gameTime - sinBad.last > 1.5) sinBad.n = 0;
  sinBad.last = gameTime;
  if (++sinBad.n < 4) return;
  sinBad.n = 0;
  sinBadalada();
}
// the toll: a ring 3 blocks round the hero; whoever is in it is stunned for 1 s and takes the mace's blow
function sinBadalada() {
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2, R = 3 * T;
  sinFx.tolls.push({ x: cx, y: cy, t: 0 });
  sfx.sinBadalo(); shake(2);
  sinBad.busy = true;
  try {
    for (const e of enemies.slice()) {
      if (e.dead || e.cdVoid) continue;
      const nx = clamp(cx, e.x, e.x + e.w), ny = clamp(cy, e.y, e.y + e.h);
      if (Math.hypot(nx - cx, ny - cy) > R) continue;
      const D = ET[e.type];
      hitEnemy(e, Math.sign(e.x + e.w / 2 - cx) || pl.facing, 1, false);
      if (!e.dead && !(D && D.boss) && !e.boss) { e.stun = Math.max(e.stun || 0, 1); e.sinTollT = 1; }
    }
  } finally { sinBad.busy = false; }
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'sineiro' && (e.hidden || e.state === 'intro')) return;   // under the water he can't be reached
  const r = _hit(e, dir, mult, melee);
  if (e && e.type === 'sineiro') e.stun = 0;
  if (melee && !sinBad.busy && pl.lg && pl.lg.badalo && e && !e.cdVoid) sinBadaladaHit();
  return r;
}; }

/* ---------- art ---------- */
const SINA = {};
{
const { cg } = CVART;
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  pele: R6(['#151d19', '#25332b', '#3b4c41', '#566a5a', '#768c78', '#9aae98']),
  roxo: R6(['#1a1620', '#2a2432', '#3e3646', '#54485c', '#6a5c70', '#827488']),
  pano: R6(['#121110', '#1e1b18', '#2c2824', '#3c3630', '#4e463e', '#625850']),
  corda: R6(['#140f0a', '#241a10', '#3a2a18', '#523c24', '#6c5232', '#8a6c44']),
  cabelo: R6(['#0a0e0c', '#121a16', '#1c2620', '#26342c', '#33443a', '#425448']),
  bronze: R6(['#1a1208', '#33240f', '#523a18', '#765424', '#9a7436', '#c0a060']),
  verde: R6(['#0e1a16', '#1a3028', '#2a4a3c', '#3e6a56', '#5a8e74', '#86b49a']),
  ferro: R6(['#101012', '#1c1c22', '#2c2c34', '#40404a', '#585862', '#74747e']),
  pau: R6(['#1a120a', '#2c1f12', '#42301c', '#5a4228', '#745636', '#8e6c46']),
  olho: R6(['#2a3028', '#4a5448', '#6e786a', '#949c8c', '#b4baa8', '#c8ccb8'])
};
const sm = t => t * t * (3 - 2 * t);
function nz(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm(fx - ix), uy = sm(fy - iy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy - 0.5;
}
// the painter (as the Mãe-Esporo's): each ramp remembers its index, so the outline takes the darkest tone of what it rims
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
// a canvas turned by `a` (radians) round (px, py), nearest pixel, onto an n x n canvas with that point in the middle
function turn(src, a, px, py, n) {
  const sw = src.width, sh = src.height, S = new Uint32Array(src.getContext('2d').getImageData(0, 0, sw, sh).data.buffer);
  const o = mk(n, n), ox = o.getContext('2d'), im = ox.createImageData(n, n), D = new Uint32Array(im.data.buffer), ca = Math.cos(a), sa = Math.sin(a), h = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - h, dy = y + 0.5 - h, sx = Math.floor(px + dx * ca + dy * sa), sy = Math.floor(py - dx * sa + dy * ca);
    if (sx >= 0 && sy >= 0 && sx < sw && sy < sh) D[y * n + x] = S[sy * sw + sx];
  }
  ox.putImageData(im, 0, 0); return o;
}

/* the ringer: 64 x 64, facing right, feet on row 62. Swollen and grey-green, the city's sodden smock stuck to him,
   the bell rope wound twice round his belly with the end hanging, a slumped puffy head with pale slit eyes */
const SW = 64, SH = 64;
function poseOf(k) {
  const P = { lean: 0, hx: 0, hy: 0, fa: [0.45, 0.75], ba: [0.25, 0.9], fl: [0.18, -0.12], bl: [-0.2, 0.08], mouth: 0.3, dy: 0, look: 0 };
  switch (k) {
    case 1: Object.assign(P, { fl: [0.42, -0.35], bl: [-0.35, 0.15], fa: [0.1, 0.5], ba: [0.6, 0.7], dy: -1 }); break;          // walk
    case 2: Object.assign(P, { fl: [-0.2, 0.05], bl: [0.4, -0.4], fa: [0.55, 0.6], ba: [-0.05, 0.6] }); break;
    case 3: Object.assign(P, { fa: [2.75, 0.15], ba: [2.95, 0.05], lean: -0.05, look: -0.3, mouth: 0.6 }); break;              // arms up on the rope
    case 4: Object.assign(P, { fa: [0.85, -0.55], ba: [0.75, -0.4], lean: -0.22, fl: [0.35, -0.3], bl: [-0.1, 0.1], mouth: 0.8 }); break;   // hauling down
    case 5: Object.assign(P, { fa: [1.75, 0.15], ba: [1.6, 0.25], lean: -0.3, fl: [0.45, -0.55], bl: [-0.25, 0.3], dy: 1, mouth: 0.5 }); break;   // leaning on the rope
    case 6: Object.assign(P, { fa: [1.5, 0.6], ba: [-1.3, -0.5], lean: 0.05, look: -0.15, mouth: 1 }); break;                // shaking
    case 7: Object.assign(P, { fa: [2.95, 0.2], ba: [2.55, 0.6], fl: [0.9, -1.4], bl: [0.2, -0.2], look: -0.4 }); break;      // climbing
    case 8: Object.assign(P, { fa: [2.55, 0.6], ba: [2.95, 0.2], fl: [0.2, -0.2], bl: [0.9, -1.4], look: -0.4 }); break;
    case 9: Object.assign(P, { fa: [3.5, -0.7], ba: [1.3, 0.3], lean: -0.15, look: -0.1, mouth: 0.7 }); break;               // clapper overhead
    case 10: Object.assign(P, { fa: [1.55, -0.05], ba: [0.3, 0.8], lean: 0.22, fl: [0.5, -0.4], bl: [-0.35, 0.1], mouth: 0.9 }); break;   // throw
    case 11: Object.assign(P, { fa: [1.5, 0.05], ba: [1.35, 0.15], lean: 0.28, mouth: 1.3 }); break;                       // grab
    case 12: Object.assign(P, { fa: [1.9, 0.7], ba: [-1.7, -0.6], lean: 0.1, fl: [0.5, -0.6], bl: [-0.4, 0.4] }); break;      // swim
    case 13: Object.assign(P, { fa: [2.4, 0.4], ba: [2.1, 0.3], lean: -0.15, fl: [0.6, -0.9], bl: [0.1, -0.7], mouth: 1.2, look: -0.3 }); break;   // falling
  }
  return P;
}
// the joints of a pose (facing right), for the painter and for the rope and the clapper
function joints(k) {
  const P = poseOf(k), hip = [32, 45 + P.dy], ca = Math.cos(P.lean), sa = Math.sin(P.lean);
  const R = (x, y) => { const dx = x - hip[0], dy = y - hip[1]; return [hip[0] + dx * ca - dy * sa, hip[1] + dx * sa + dy * ca]; };
  const sF = R(37, 26 + P.dy), sB = R(26, 26 + P.dy), head = R(36 + P.hx, 17 + P.hy + P.dy), belly = R(32, 36 + P.dy), chest = R(32, 29 + P.dy);
  const arm = (s, [a, e]) => { const A = a + P.lean, E = [s[0] + Math.sin(A) * 10, s[1] + Math.cos(A) * 10], H = [E[0] + Math.sin(A + e) * 9, E[1] + Math.cos(A + e) * 9]; return { s, e: E, h: H }; };
  const leg = (x, [a, k2]) => { const H = [x, hip[1]], K = [x + Math.sin(a) * 9, hip[1] + Math.cos(a) * 9], F = [K[0] + Math.sin(a + k2) * 9, K[1] + Math.cos(a + k2) * 9]; return { h: H, k: K, f: F }; };
  return { P, hip, head, belly, chest, af: arm(sF, P.fa), ab: arm(sB, P.ba), lf: leg(35, P.fl), lb: leg(28, P.bl) };
}
function paintRinger(k) {
  const Q = pp(SW, SH), J = joints(k), P = J.P, S = 9100 + k * 37;
  const { pele, roxo, pano, corda, cabelo, olho } = PAL;
  const blotch = (x, y) => nz(x, y, 5, 9131) > 0.24 ? -0.6 : 0;
  // the back arm and leg, darker
  const arm = (A, base, back) => {
    Q.tube(A.s[0], A.s[1], A.e[0], A.e[1], 4.8, 4.2, pano, S + (back ? 1 : 2), base, (x, y, t) => (t > 0.8 ? -0.9 : 0));   // the sleeve to the elbow
    Q.tube(A.e[0], A.e[1], A.h[0], A.h[1], 4.0, 3.6, pele, S + (back ? 3 : 4), base - 0.1, (x, y) => blotch(x, y));
    Q.blob(A.h[0], A.h[1] + 0.5, 4.3, 4.1, pele, S + (back ? 5 : 6), base, (x, y, dx, dy) => (dy > 0.1 && ((x + (y >> 1)) % 2) === 0 ? -1 : 0));   // swollen fingers
  };
  const leg = (L, base, back) => {
    Q.tube(L.h[0], L.h[1] - 1, L.k[0], L.k[1], 5.4, 4.6, pano, S + (back ? 7 : 8), base, (x, y, t) => (t > 0.85 && hash2(x, y, 9132) < 0.45 ? null : 0));   // ragged breeches
    Q.tube(L.k[0], L.k[1], L.f[0], L.f[1], 4.4, 3.8, pele, S + (back ? 9 : 10), base - 0.1, (x, y) => blotch(x, y) + (((y + x) % 5) === 0 ? -0.5 : 0));
    Q.blob(L.f[0] + 2.5, L.f[1] - 0.5, 5, 2.6, pele, S + (back ? 11 : 12), base, (x, y, dx, dy) => (dy > 0.4 ? -0.7 : 0));
  };
  arm(J.ab, 1.4, true); leg(J.lb, 1.5, true);
  // the belly, swollen under the smock; the smock torn at the hem
  const [bx, by] = J.belly, [hx, hy] = J.chest;
  Q.blob(bx + 1, by + 2, 15, 13, pele, S + 13, 2.1, (x, y) => blotch(x, y) + (nz(x, y, 4, 9133) > 0.3 ? 0.5 : 0));
  Q.blob(hx, hy, 13.5, 9.5, pano, S + 14, 2.5, (x, y, dx, dy) => (Math.abs(nz(x, y, 6, 9134)) < 0.04 ? -1 : 0));
  Q.blob(bx, by + 1, 14, 11.5, pano, S + 15, 2.3, (x, y, dx, dy) => {
    if (dy > 0.55 && hash2(x, 3, 9135) < 0.55 + (dy - 0.55) * 1.5) return null;   // the hem gone in rags
    if (nz(x, y, 7, 9136) > 0.34) return null;                                    // tears: the skin shows
    return (Math.abs(((x * 0.7 + y * 0.3) % 6) - 3) < 0.6 ? -0.7 : 0);            // the wet folds
  });
  // the rope round the belly, twice, with the knot in front and the end hanging
  for (const ry of [by + 2, by + 6]) for (let x = Math.floor(bx - 15); x <= bx + 15; x++) {
    const dx = (x + 0.5 - bx) / 15, yy = ry + dx * dx * -2 + P.lean * (x - bx) * 0.9; if (Math.abs(dx) > 0.98 || !Q.has(x, yy)) continue;
    for (let j = 0; j < 3; j++) Q.put(x, yy + j - 1, corda, 3.2 - j * 0.9 - dx * 0.8 + (((x + j) % 3) === 0 ? 0.9 : 0) + cg(x, j, 9137) * 0.5);
  }
  Q.blob(bx + 9, by + 4, 3.2, 3, corda, S + 16, 2.6);
  Q.tube(bx + 9, by + 6, bx + 11 + P.lean * 6, by + 17, 1.6, 1.3, corda, S + 17, 2.4, (x, y, t) => ((y & 1) ? 0.6 : -0.3));
  leg(J.lf, 2.3, false);
  // the head: puffy, slumped forward on a thick neck, hair plastered down the back
  const [qx, qy] = J.head, lk = P.look, hy0 = qy + lk * 2;
  Q.tube(hx + 2, hy - 6, qx - 1, qy + 4, 5.8, 5.2, pele, S + 18, 1.8, (x, y, t) => (((y + (x >> 1)) % 3) === 0 ? -0.6 : 0));   // neck rolls
  Q.blob(qx - 4, hy0 + 1.5, 6, 8.5, cabelo, S + 19, 2.0, (x, y) => ((x * 3 + y) % 4 === 0 ? -0.8 : 0));
  Q.blob(qx + 0.5, hy0, 8.6, 8.2, pele, S + 20, 2.0, (x, y, dx, dy) => (dx < -0.5 && dy < 0.35 ? null : (dx > 0.3 && dy > 0.05 ? 0.6 : 0) + (dy > 0.55 ? -0.5 : 0)));   // bloated cheeks, a double chin
  Q.blob(qx - 3.5, hy0 - 5.5, 6.2, 3.4, cabelo, S + 21, 2.3, (x, y) => ((x + y * 2) % 3 === 0 ? -0.9 : 0));
  for (let j = 0; j < 4; j++) Q.tube(qx - 5 - j, hy0 - 3, qx - 7 - j * 1.4, qy + 7 + j * 2, 1.1, 0.8, cabelo, S + 22 + j, 2.2);   // strands down the neck
  Q.blob(qx - 1.5, hy0 + 1.5, 1.8, 2.4, pele, S + 27, 2.2, (x, y, dx, dy) => (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4 ? -1.4 : 0));   // the ear
  // the face: a heavy brow, a swollen lid over a pale slit, a bruised bag under it, a dark open mouth, the nose
  const ex = qx + 4.5, ey = hy0 - 1;
  for (let x = -2; x <= 3; x++) { Q.put(ex + x, ey - 3, pele, 3.6); Q.put(ex + x, ey - 2, pele, 1.2); }
  Q.blob(ex + 0.5, ey, 3, 1.8, pele, S + 26, 3.3);
  for (let x = -1; x <= 1; x++) Q.put(ex + x, ey + 1, olho, x === 0 ? 5 : 4);
  for (let x = -1; x <= 2; x++) Q.put(ex + x, ey + 2, roxo, 2);
  Q.put(qx + 8, hy0 + 1, pele, 4.4); Q.put(qx + 8, hy0 + 2, pele, 3); Q.put(qx + 7, hy0 + 2, pele, 1.4);   // the nose
  const mh = Math.round(1 + P.mouth * 2.4), mx = qx + 3.5, my = hy0 + 4;
  for (let y = 0; y < mh; y++) for (let x = 0; x < 4; x++) Q.put(mx + x, my + y, roxo, y === 0 || x === 0 ? 1 : 0);
  for (let x = 0; x < 4; x++) Q.put(mx + x, my + mh, pele, 3.6);
  if (P.mouth > 0.6) Q.put(mx + 1, my + mh + 1, olho, 2);   // water running out of it
  arm(J.af, 2.2, false);
  // dead skin: bruised in patches
  Q.recolor(pele, roxo, (x, y) => nz(x, y, 6, 9139) > 0.27);
  Q.outline();
  return Q.canvas();
}
const meta = k => { const J = joints(k); return { hf: J.af.h, hb: J.ab.h, waist: [J.belly[0] + 9, J.belly[1] + 4], head: J.head }; };

/* the bell: 72 wide, 86 tall (the crown's loops on rows 0..13, the body from row 14), old bronze gone green in
   streaks, a raised band of letters, the sound bow, a crack up from the lip */
const BW = 72, BH = 86, BC = 14;
const bellHw = y => y < 0 ? 0 : y < 10 ? 15 + 11 * Math.sqrt(y / 10) : y < 46 ? 26 + (y - 10) * 0.07 : y < 58 ? 28.5 + Math.pow((y - 46) / 12, 1.5) * 7.5 : 36;
function paintBell() {
  const Q = pp(BW, BH), { bronze, verde, ferro } = PAL;
  // the crown's three loops
  const loop = (cx, w, top) => { for (let y = top; y < BC + 1; y++) for (let x = cx - w; x <= cx + w; x++) { const dx = (x + 0.5 - cx) / w, dy = (y + 0.5 - (BC + 1)) / (BC + 1 - top); const d = dx * dx + dy * dy; if (d > 1 || d < 0.38) continue; Q.put(x, y, bronze, 3 - dx * 1.2 - dy * 0.6 + cg(x, y, 9141) * 0.6); } };
  loop(36, 7, 2); loop(26, 5, 6); loop(46, 5, 6);
  for (let y = 0; y < 72; y++) {
    const hw = bellHw(y), Y = y + BC;
    for (let x = 0; x < BW; x++) {
      const nx = (x + 0.5 - 36) / hw; if (Math.abs(nx) > 1) continue;
      let v = 2.8 - nx * 1.5 - nx * nx * 1.1 - y / 72 * 0.5 + cg(x, Y, 9142) * 0.55;
      if (nx > -0.66 && nx < -0.4) v += 1.0;                                   // the shine on the left
      if (y < 10) v += 0.6 - (y / 10) * 0.3 - Math.abs(nx) * 0.4;              // the shoulder takes the light
      let R = bronze;
      // the raised rings and the band of letters
      if (y === 10 || y === 26 || y === 52 || y === 62) v += 1.1;
      else if (y === 12 || y === 28 || y === 54 || y === 64) v -= 1.1;
      else if (y > 16 && y < 25) { const gx = Math.floor((x - 36 + nx * 3) / 4), cell = hash2(gx, Math.floor((y - 17) / 3), 9143); if (cell < 0.45 && ((x + y) % 3) !== 0) v -= 0.9; }
      if (y >= 69) v -= (y - 68) * 0.55;                                       // under the lip
      // green: patches, and streaks running down under each ring
      const run = nz(x * 3, y * 0.25, 6, 9144), patch = nz(x, Y, 9, 9145);
      if (patch > 0.18 || (run > 0.22 && y > 12) || (y > 26 && y < 34 && run > 0.05)) { R = verde; v += 0.3; }
      Q.put(x, Y, R, v);
    }
  }
  // the crack, up from the lip
  let cx = 47, cy = BC + 71;
  for (let n = 0; n < 34; n++) { Q.put(cx, cy, ferro, 0); Q.put(cx + 1, cy, bronze, 1); cy--; if (hash2(n, 1, 9146) < 0.35) cx += hash2(n, 2, 9146) < 0.6 ? -1 : 1; }
  // the dark of the mouth along the bottom
  for (let x = 2; x < BW - 2; x++) Q.put(x, BC + 71, ferro, 0);
  Q.outline();
  return Q.canvas();
}
// the wheel on the beam: a wooden wheel, six spokes, the headstock across it (turns with the bell)
const WR = 48;
function paintWheel() {
  const Q = pp(WR, WR), { pau, ferro } = PAL, c = WR / 2;
  for (let y = 0; y < WR; y++) for (let x = 0; x < WR; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy);
    if (r <= 22 && r >= 18) { const g = r > 19.6 && r < 20.8; Q.put(x, y, pau, (g ? 1 : 3.2) - (dx + dy) / 30 + cg(x, y, 9151) * 0.6); }
  }
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3; Q.tube(c + Math.cos(a) * 4, c + Math.sin(a) * 4, c + Math.cos(a) * 19, c + Math.sin(a) * 19, 1.5, 1.2, pau, 9152 + k, 2.2); }
  Q.tube(c - 22, c + 2, c + 22, c + 2, 4.2, 4.2, pau, 9158, 2.6, (x, y, t) => ((x % 7) === 0 ? -0.8 : 0));   // the headstock
  Q.blob(c, c, 4.5, 4.5, ferro, 9159, 2.8);
  Q.outline();
  return Q.canvas();
}
// the clapper: an iron shank with a loop at the top and the heavy ball
function paintClapper() {
  const Q = pp(14, 32), { ferro } = PAL;
  Q.tube(7, 3, 7, 21, 1.8, 2.2, ferro, 9161, 2.8);
  for (let y = 0; y < 6; y++) for (let x = 3; x < 11; x++) { const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 3); if (d < 3.6 && d > 1.8) Q.put(x, y, ferro, 3.2 - (x - 7) * 0.3 - (y - 3) * 0.3); }
  Q.blob(7, 25.5, 6, 6, ferro, 9162, 2.8);
  Q.outline();
  return Q.canvas();
}
// cracks in a marked plate (12 x 12, three of them)
function paintCrack(s) {
  const c = mk(12, 12), x = c.getContext('2d'); let px = 2 + ((hash2(s, 1, 9171) * 8) | 0), py = 0;
  for (let n = 0; n < 16; n++) { x.fillStyle = n % 4 === 0 ? '#c4beb8' : '#0c0a08'; x.fillRect(px, py, 1, 1); if (n % 4 !== 0) { x.fillStyle = 'rgba(200,190,170,0.45)'; x.fillRect(px + 1, py, 1, 1); } py += hash2(n, s, 9172) < 0.7 ? 1 : 0; px += hash2(n, s, 9173) < 0.4 ? -1 : hash2(n, s, 9173) > 0.7 ? 1 : 0; px = clamp(px, 0, 11); if (py > 11) break; }
  return c;
}
const ANG = []; for (let a = -60; a <= 60; a += 5) ANG.push(a * Math.PI / 180);
SINA.get = () => SINA.ready || (SINA.ready = (() => {
  const body = [], meta0 = [];
  for (let k = 0; k <= 13; k++) { const r = paintRinger(k), l = flip(r); body.push({ r, l, wr: whiteOf(r), wl: whiteOf(l) }); meta0.push(meta(k)); }
  const bell = paintBell(), wheel = paintWheel(), clap = paintClapper();
  return {
    body, meta: meta0, bell, wheel, clap,
    bellT: ANG.map(a => turn(bell, -a, 36, BC + 36, 120)), wheelT: ANG.map(a => turn(wheel, -a, WR / 2, WR / 2, WR)),
    clapT: Array.from({ length: 16 }, (_, k) => turn(clap, k * Math.PI / 8, 7, 16, 40)),
    crack: [0, 1, 2].map(paintCrack)
  };
})());
SINA.angIx = a => clamp(Math.round(a * 180 / Math.PI / 5) + 12, 0, ANG.length - 1);
SINA.GL = { eye: glow(6, '#b4c4ac'), bell: glow(30, '#c0a060'), ring: glow(16, '#9ab49a'), toll: glow(40, '#c0a060') };
Object.assign(SINA, { BW, BH, BC, WR, SW, SH });
}

/* ---------- drawing ---------- */
function sinPose(e) {
  switch (e.state) {
    case 'intro': return e.stateT > 1.2 ? 0 : 3;
    case 'swingTell': return 3;
    case 'swing': return 4;
    case 'tollTell': return 5;
    case 'toll': return 4;
    case 'shake': return 6;
    case 'creak': return 3;
    case 'fall': case 'rumble': return 13;
    case 'pullTell': return 3;
    case 'pullDo': return 4;
    case 'throwWind': return 9;
    case 'throwWait': return 10;
    case 'climb': case 'hang': return Math.floor(e.t * 3) % 2 ? 7 : 8;
    case 'emerge': case 'hold': return 11;
    case 'swim': case 'dive': return 12;
    default: return e.gnd && Math.abs(e.svx || 0) > 8 ? 1 + (Math.floor(e.t * 4) % 2) : 0;
  }
}
// the frame's top left for a body on screen (feet at fy, centre fx)
const sinFrameXY = (e, fx, fy) => [fx - 32 + (e.state === 'shake' ? Math.round(Math.sin(e.t * 60)) : 0), fy - 63];
function sinHand(e, k) {
  const A = SINA.get(), m = A.meta[k], p = m.hf, x = e.x + e.w / 2 + e.facing * (p[0] - 32), y = e.y + e.h - 63 + p[1];
  return [x, y];
}
DRAW_E.sineiro = (e, fx, fy, fl) => {
  if (e.hidden) return;
  const A = SINA.get(), k = sinPose(e), B = A.body[k], img = e.facing > 0 ? (fl ? B.wr : B.r) : (fl ? B.wl : B.l), [x, y] = sinFrameXY(e, fx, fy);
  if (e.state === 'dive') lc.globalAlpha = Math.max(0, 1 - e.stateT0 * 1.8);
  lc.drawImage(img, x, y);
  // the clapper in his hand while he raises it
  if (e.state === 'throwWind') { const m = A.meta[9].hf, hx = fx + e.facing * (m[0] - 32), hy = fy - 63 + m[1]; lc.drawImage(A.clapT[e.facing > 0 ? 6 : 10], Math.round(hx) - 20, Math.round(hy) - 20); }
  lc.globalAlpha = 1;
};
EYES_E.sineiro = (e, fx, fy) => {
  if (e.hidden) return;
  const m = SINA.get().meta[sinPose(e)].head, x = fx + e.facing * (m[0] + 3.5 - 32), y = fy - 63 + m[1] - 1;
  lc.globalAlpha = WARN_E.sineiro(e) ? 0.75 : 0.35; lc.drawImage(SINA.GL.eye, Math.round(x) - 6, Math.round(y) - 6);
};
WARN_E.sineiro = e => !e.hidden && (e.state === 'swingTell' || e.state === 'tollTell' || e.state === 'shake' || e.state === 'pullTell' || e.state === 'throwWind' || e.state === 'creak' || e.state === 'rumble');
// a rope as a twisted 2 px line (a little sag)
function sinRopeLine(ax, ay, bx, by, cx, cy, sag = 0) {
  const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t + Math.sin(t * Math.PI) * sag;
    lc.fillStyle = (i % 3) === 0 ? '#6c5232' : '#3a2a18'; lc.fillRect(Math.round(x) - cx, Math.round(y) - cy, 2, 1);
    lc.fillStyle = '#140f0a'; lc.fillRect(Math.round(x) - cx + 2, Math.round(y) - cy, 1, 1);
  }
}
// the wheel's centre and the bell's centre (world px)
const sinPivot = () => [sinUx(120), sinRy(0) + 6];
function sinBellC() {
  const b = sinBell;
  if (b.mode === 'hang' || b.mode === 'swing') { const [px, py] = sinPivot(), d = sinGeo().s < 0 ? 1 : -1; return [px + d * Math.sin(b.ang) * b.R, py + Math.cos(b.ang) * b.R, d * b.ang]; }
  return [sinUx(b.u), b.y + 36, 0];
}
HOOK.drawWorld.push((cx, cy) => {
  const g = sinGeo(); if (!g || !pl || Math.abs(wdx(g.cx - Math.floor((cx + VW / 2) / T))) > 50) return;
  const A = SINA.get(), b = sinBell, [px, py] = sinPivot(), e = sinBoss;
  // the wheel on the beam (it turns with the bell while it hangs from it)
  const wa = b.mode === 'hang' || b.mode === 'swing' ? (g.s < 0 ? b.ang : -b.ang) : 0;
  lc.drawImage(A.wheelT[SINA.angIx(wa)], Math.round(px - A.WR / 2) - cx, Math.round(py - A.WR / 2) - cy);
  // the rope from the near rim down to the bell, once it fell
  const [bx, by, ba] = sinBellC(), jit = b.ring > 0 ? Math.round(Math.sin(gameTime * 70) * 1.5 * Math.min(1, b.ring)) : 0;
  if (b.mode !== 'hang' && b.mode !== 'swing' && !(sinState.dead && b.mode === 'sunk')) sinRopeLine(sinUx(SIN_U_RIM), py, bx + (g.s < 0 ? -6 : 6), by - 50, cx, cy, 0);
  // the bell
  if (Math.abs(ba) < 0.01) lc.drawImage(A.bell, Math.round(bx - 36) - cx + jit, Math.round(by - 50) - cy);
  else lc.drawImage(A.bellT[SINA.angIx(ba)], Math.round(bx - 60) - cx, Math.round(by - 60) - cy);
  // his end of the rope: from the far rim to his hands (or his waist)
  if (e && !e.dead && !e.hidden) {
    const k = sinPose(e), m = A.meta[k], two = k === 3 || k === 5 || k === 7 || k === 8 || k === 4;
    const p = two ? m.hf : m.waist, hx = e.x + e.w / 2 + e.facing * (p[0] - 32), hy = e.y + e.h - 63 + p[1];
    sinRopeLine(sinUx(SIN_U_FAR), py, hx, hy, cx, cy, two ? 0 : 10);
    // in front of the bell
    if (b.mode !== 'hang' && b.mode !== 'swing' && Math.abs(e.x + e.w / 2 - bx) < 60 && Math.abs(e.y + e.h / 2 - by) < 70) drawEnemy(e, cx, cy);
  }
  // the clapper and its chain
  const C = sinFx.clap;
  if (C && e) {
    const [hx, hy] = sinHand(e, sinPose(e));
    for (let t = 0.08; t < 1; t += 0.08) { const x = hx + (C.x - hx) * t, y = hy + (C.y - hy) * t + Math.sin(t * Math.PI) * (C.st === 'back' ? 2 : 8); lc.fillStyle = '#40404a'; lc.fillRect(Math.round(x) - cx, Math.round(y) - cy, 2, 2); lc.fillStyle = '#74747e'; lc.fillRect(Math.round(x) - cx, Math.round(y) - cy, 1, 1); }
    lc.drawImage(A.clapT[((Math.round(C.rot / (Math.PI / 8)) % 16) + 16) % 16], Math.round(C.x) - 20 - cx, Math.round(C.y) - 20 - cy);
  }
  // the falling drops
  for (const d of sinFx.drops) if (d.t >= 0 && !d.done) { const x = Math.round(d.x) - cx, y = Math.round(d.y) - cy; lc.fillStyle = '#08090c'; lc.fillRect(x - 2, y - 5, 4, 7); lc.fillRect(x - 1, y - 7, 2, 2); lc.fillStyle = '#22262c'; lc.fillRect(x - 1, y - 4, 1, 3); }
  // the marked plates: cracks
  for (const p of sinMarked()) for (let c = p.c0; c <= p.c1; c++) {
    const x = sinUx(c * 12 + 6) - 6 - cx, y = sinRy(p.r) - cy; lc.globalAlpha = 0.9; lc.drawImage(A.crack[(c + p.r) % 3], x, y); lc.globalAlpha = 1;
  }
});
// the warnings, over the dark: circles under the drops, the rings of sound, the bubbles, the rings on the water
HOOK.drawTop.push((cx, cy) => {
  const g = sinGeo(); if (!g || !pl || (!sinBoss && !sinFx.tolls.length)) return;
  lc.lineWidth = 1;
  for (const d of sinFx.drops) {
    if (d.done || d.t >= 0) continue;
    const k = 1 + d.t / 0.9, x = Math.round(d.x) - cx, y = Math.round(d.land) - cy, r = 10 - k * 4;
    lc.globalAlpha = 0.35 + k * 0.45; lc.strokeStyle = (Math.floor(gameTime * 10) & 1) ? '#9aae98' : '#566a5a';
    lc.beginPath(); lc.ellipse(x + 0.5, y - 1.5, r, r * 0.3, 0, 0, Math.PI * 2); lc.stroke();
  }
  for (const R of sinFx.rings) {
    const a = R.t < 0 ? 0 : Math.max(0, 1 - R.done * 2);
    if (a <= 0) continue;
    for (const F of R.fronts) {
      if (!F.on) continue;
      const x = Math.round(F.x) - cx, y = Math.round(F.y) - cy;
      for (let j = 0; j < 3; j++) {
        lc.globalAlpha = a * (0.7 - j * 0.2); lc.strokeStyle = R.muffled ? '#86907e' : '#c8ccb8';
        lc.beginPath();
        if (F.vert) lc.ellipse(x + 0.5, y + 0.5, 4 + j * 3, 2 + j, 0, Math.PI * (F.dy < 0 ? 1.05 : 0.05), Math.PI * (F.dy < 0 ? 1.95 : 0.95));
        else lc.ellipse(x - F.d * j * 3 + 0.5, y - 5, 2 + j, 6 + j * 2, 0, F.d > 0 ? -Math.PI / 2 : Math.PI / 2, F.d > 0 ? Math.PI / 2 : Math.PI * 1.5);
        lc.stroke();
      }
    }
  }
  for (const B of sinFx.bubbles) { const x = Math.round(B.x) - cx, y = Math.round(B.y) - cy; lc.globalAlpha = 0.7; lc.strokeStyle = '#86907e'; lc.strokeRect(x - 0.5, y - 0.5, B.s + 1, B.s + 1); }
  for (const S of sinFx.surf) {
    const k = S.t / S.max;
    for (let j = 0; j < 2; j++) { const r = 4 + ((k * 2 + j * 0.5) % 1) * 22; lc.globalAlpha = 0.65 * (1 - ((k * 2 + j * 0.5) % 1)); lc.strokeStyle = '#9aae98'; lc.beginPath(); lc.ellipse(Math.round(S.x) - cx + 0.5, Math.round(S.y) - cy + 0.5, r, r * 0.22, 0, 0, Math.PI * 2); lc.stroke(); }
  }
  for (const W of sinFx.waves) {
    const x = Math.round(W.x) - cx, y = Math.round(W.y) - cy;
    for (let j = 0; j < 8; j++) { lc.globalAlpha = 0.8 - j * 0.09; lc.fillStyle = j < 2 ? '#86b49a' : '#3e6a56'; lc.fillRect(x - W.d * j * 2, y - 4 + Math.abs(j - 2), 2, 2); }
  }
  for (const L of sinFx.tolls) { const k = L.t / 0.35, r = 6 + k * 3 * T; lc.globalAlpha = Math.max(0, 0.85 * (1 - k)); lc.strokeStyle = '#c0a060'; lc.beginPath(); lc.arc(Math.round(L.x) - cx + 0.5, Math.round(L.y) - cy + 0.5, r, 0, Math.PI * 2); lc.stroke(); lc.strokeStyle = '#9ab49a'; lc.beginPath(); lc.arc(Math.round(L.x) - cx + 0.5, Math.round(L.y) - cy + 0.5, Math.max(1, r - 3), 0, Math.PI * 2); lc.stroke(); }
  // the marked plates read in the dark
  for (const p of sinMarked()) { lc.globalAlpha = 0.18 + Math.sin(gameTime * 6) * 0.06; lc.fillStyle = '#c4beb8'; const x0 = Math.min(sinUx(p.c0 * 12), sinUx(p.c1 * 12 + 12)); lc.fillRect(x0 - cx, sinRy(p.r) - cy, (p.c1 - p.c0 + 1) * 12, 1); }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const b = sinBell; if (!sinBoss || !(b.ring > 0)) return;
  const [bx, by] = sinBellC(); lc.globalAlpha = Math.min(1, b.ring) * 0.22; lc.drawImage(SINA.GL.bell, Math.round(bx) - cx - 30, Math.round(by) - cy - 30); lc.globalAlpha = 1;
});

/* ---------- the plates ---------- */
let sinPulls = 0;   // bell pulls done (the next marked plate is SIN_PLATES' puxao k = sinPulls)
const sinPlateUp = p => SOLID[tiles[sinI(p.c0, p.r)]] || SOLID[tiles[sinI(p.c1, p.r)]];
function sinMarked() {
  const e = sinBoss; if (!e || e.dead) return [];
  if (e.state === 'creak') return SIN_PLATES.filter(p => p.at === 'queda' && sinPlateUp(p));
  if (e.state === 'rumble') return SIN_PLATES.filter(p => p.r >= 27 && sinPlateUp(p));
  if (e.ph === 1) { const p = sinNextPlate(); return p ? [p] : []; }
  return [];
}
function sinNextPlate() { for (const p of SIN_PLATES) if (p.at === 'puxao' && sinPlateUp(p)) return p; return null; }
// a plate breaks: the blocks fall away as rubble (no harm), the gap opens
function sinBreak(p) {
  let any = false;
  for (let c = p.c0; c <= p.c1; c++) {
    const i = sinI(c, p.r); if (!SOLID[tiles[i]]) continue;
    any = true; tiles[i] = AIR; sinDirty(i);
    const x = sinUx(c * 12 + 6), y = sinRy(p.r) + 6;
    burst(x, y, 5, p.wood ? '#5a4228' : '#786e60', 70, 520, 0.9, 2); burst(x, y, 4, p.wood ? '#2c1f12' : '#c0b49e', 50, 300, 0.7, 1);
    parts.push({ x, y: y - 4, vx: rnd(-20, 20), vy: rnd(-30, 0), g: 30, life: 1.6, max: 1.6, col: '#8a8478', size: 2, smoke: true });
  }
  if (any) { sfx.sinRacha(p.wood); shake(4); mapVer++; }
}

/* ---------- the fight ---------- */
function sinStart() {
  const g = sinGeo();
  sinSnapTake(); sinGates(true);
  DROPS.sineiro = SIN_DROPS.filter(([id]) => ITEMS[id]);
  const D = ET.sineiro, x = sinUx(SIN_U_POST) - D.w / 2, y = sinRy(9) - D.h;
  const e = spawnEnemy('sineiro', x, y, CD_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: SIN_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, facing: pl.x + pl.w / 2 < e.x + e.w / 2 ? -1 : 1, cd: 1.2, ph: 0, gnd: true, svx: 0, svy: 0, hidden: false, minT: 8, pool: 0, lastHp: D.hp });
  e.state = 'intro'; e.stateT = 2.4; e.stateT0 = 0;
  sinBoss = e; bossFight = { e, sin: true }; sinPulls = 0;
  Object.assign(sinBell, { mode: 'hang', u: 120, ang: 0, R: 42, vy: 0, t: 0, ring: 0, plate: null }); sinBell.y = sinBellRestY();
  sinClear();
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Sineiro Afogado'; bn.lastChild.textContent = 'tocou até a água chegar'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Sineiro Afogado', 'tocou até a água chegar');
  shake(3);
}
function sinClear() { sinFx.rings.length = 0; sinFx.drops.length = 0; sinFx.clap = null; sinFx.bubbles.length = 0; sinFx.surf.length = 0; sinFx.waves.length = 0; pl.sinGrab = null; }
function sinEnd(won) {
  const e = sinBoss; sinBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.sinMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#22262c', 50, 200, 0.4); sinDrop(m); }
  sinClear();
  if (!won) {
    // the tower back as it was: floors, bell, water, the grille open
    if (e) sinDrop(e);
    sinSnapPut(); sinFx.gates.length = 0; sinPulls = 0;
    Object.assign(sinBell, { mode: 'hang', u: 120, ang: 0, R: 42, vy: 0, t: 0, ring: 0, plate: null }); sinBell.y = sinBellRestY();
    return;
  }
  // he sinks for good; the floors stay broken, the bell stays as the island, the rope hangs to the water
  sinState.dead = true;
  sinGates(false);
  if (sinBell.mode !== 'sunk') { sinBell.mode = 'sunk'; sinBell.u = 120; sinBell.y = sinRy(41); }
  sinWreck();
  const x = e ? e.x + e.w / 2 : sinUx(120), y = e ? e.y + e.h / 2 : sinRy(44);
  burst(x, y, 30, '#22262c', 120, 200, 1.2, 2); burst(x, y, 16, '#566a5a', 90, 300, 0.9);
  // the first time: one of the layer's bases too
  const bases = ['facao_saqueador', 'capuz_poco', 'couraca_guarda'].filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.sinMorte();
  showBanner('Vitória', 'o sino calou');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.sin) return sinEnd(won); return _eb(won); }; }
// not before his time: each phase is lived through (a blow can only bring him to the next threshold)
const sinFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * SIN.p2) : e.ph === 1 ? Math.floor(e.maxHp * SIN.p3) : (e.state === 'rumble' || e.state === 'sinkfall' || e.hidden) ? 1 : 0;
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'sineiro' && !e.dead) {
    const f = sinFloorHp(e);
    if (f > 0) { e.hp = e.hidden ? Math.max(f, e.lastHp || f) : f; return; }
  }
  return _k(e);
}; }
function sinSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
const sinPcx = () => pl.x + pl.w / 2;
// the floor under a point (world px): the first solid row below, inside the tower
function sinFloorY(x, y) {
  const tx = Math.floor(x / T), g = sinGeo(); let ty = Math.floor(y / T);
  for (; ty < g.fy; ty++) if (solidAt(tx, ty)) return ty * T;
  return g.fy * T;
}
// walking with weight (his own gravity: the body is 'phase' so the game does not move it)
function sinWalk(e, dt, tvx) {
  e.vx = approach(e.vx, tvx, 700 * dt);
  e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
  const vx = e.vx, vy = e.vy; moveEntity(e, dt, true); e.gnd = e.onGround;
  if (e.hitWall) e.vx = 0; else e.vx = vx;
  if (e.onGround || e.hitCeil) e.vy = 0; else e.vy = vy;
  const X = sinUx(0), lo = Math.min(X, sinUx(240)) + 1, hi = Math.max(X, sinUx(240)) - e.w - 1;
  e.x = clamp(e.x, lo, hi);
  if (e.y + e.h >= sinRy(44) + 18 && sinBell.mode !== 'sunk') { e.y = sinRy(44) + 18 - e.h; e.vy = 0; e.gnd = true; }
}
AI.sineiro = function (e, dt) {
  const W = WW * T, d = e.x - pl.x; if (Math.abs(d) > W / 2) e.x -= Math.sign(d) * W;
  e.vx = e.svx || 0; e.vy = e.svy || 0;
  sinBrain(e, dt);
  e.svx = e.vx; e.svy = e.vy; e.vx = e.vy = 0;
  e.lastHp = e.hp;
};
function sinBrain(e, dt) {
  const b = sinBell, pcx = sinPcx(), ecx = e.x + e.w / 2, toPl = Math.sign(pcx - ecx) || e.facing;
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt; e.pullT = (e.pullT || 0) - dt;
  if (!e.hidden && Math.random() < dt * 3) parts.push({ x: e.x + rnd(4, e.w - 4), y: e.y + rnd(10, e.h - 6), vx: 0, vy: 10, g: 300, life: 0.6, max: 0.6, col: '#22262c', size: 1 });   // he drips
  // the thresholds
  if (e.ph === 0 && e.hp <= e.maxHp * SIN.p2 && e.state !== 'intro') { e.ph = 1; sinSet(e, 'creak', 2); sfx.sinViga(); e.hp = Math.min(e.hp, Math.floor(e.maxHp * SIN.p2)); return; }
  if (e.ph === 1 && e.hp <= e.maxHp * SIN.p3 && e.state !== 'creak' && e.state !== 'fall' && b.mode === 'stuck') { e.ph = 2; sinSet(e, 'rumble', 1.3); sfx.sinRonco(); sinFx.clap = null; return; }
  switch (e.state) {
    case 'intro':
      sinWalk(e, dt, 0); e.facing = toPl;
      if (e.stateT < 1.2 && !e.rang) { e.rang = true; sinToll(e, false, true); }
      if (e.stateT <= 0) { sinSet(e, 'idle', 0); e.cd = 0.8; }
      return;
    /* ----- phase 1, the belfry ----- */
    case 'idle': {
      if (e.ph === 2) { sinSwim(e, dt); return; }
      e.facing = toPl;
      if (e.ph === 0) { const post = sinUx(SIN_U_POST) - e.w / 2; sinWalk(e, dt, Math.abs(post - e.x) > 6 ? Math.sign(post - e.x) * 30 : 0); }
      else if (e.climbing) { sinHang(e, dt); if (pl.y + pl.h > e.y + e.h + 30) e.climbing = false; }
      else sinMove2(e, dt);
      if (e.state !== 'idle' || e.cd > 0 || !e.gnd) return;
      const r = Math.random();
      if (e.ph === 0) {
        if (r < 0.42) { sinSet(e, 'swingTell', 0.8); b.mode = 'swing'; b.t = 0; b.dir = Math.sign(sinXu(pcx) - 120) || 1; sfx.sinCorda(); }
        else if (r < 0.74) { sinSet(e, 'tollTell', 1); sfx.sinCorda(0.6); }
        else { sinSet(e, 'shake', 0.6); sfx.sinSacode(); }
        return;
      }
      // phase 2: the bell pull (while a plate is marked), the clapper, the muffled toll
      const P = sinNextPlate();
      if (P && b.mode === 'stuck' && r < 0.4 && !(e.pullT > 0)) { sinSet(e, 'pullTell', 1); b.mode = 'tense'; b.t = 0; sfx.sinCorda(); return; }
      if (r < 0.72 && !sinFx.clap) { sinSet(e, 'throwWind', 0.7); sfx.sinCorrente(0.5); return; }
      sinSet(e, 'tollTell', 1); sfx.sinCorda(0.6);
      return;
    }
    case 'swingTell':
      sinWalk(e, dt, 0);
      if (b.mode !== 'swing') { sinSet(e, 'recover', 0.4); }
      else if (e.stateT <= 0) sinSet(e, 'swing', 2.2);
      return;
    case 'swing': sinWalk(e, dt, 0); if (b.mode !== 'swing') sinSet(e, 'recover', 0.5); return;
    case 'tollTell':
      e.facing = toPl;
      if (e.ph === 1 && e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0);
      if (e.stateT <= 0) { sinToll(e, e.ph === 1); sinSet(e, 'toll', 0.5); }
      return;
    case 'toll': if (e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0); if (e.stateT <= 0) sinSet(e, 'recover', 0.4); return;
    case 'shake':
      sinWalk(e, dt, 0);
      if (Math.random() < dt * 40) parts.push({ x: e.x + rnd(0, e.w), y: e.y + rnd(0, e.h), vx: rnd(-80, 80), vy: rnd(-80, -10), g: 500, life: 0.5, max: 0.5, col: '#22262c', size: 1 });
      if (e.stateT <= 0) { sinDrips(e); sinSet(e, 'recover', 0.4); }
      return;
    case 'recover':
      if (e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0);
      if (e.stateT <= 0) { sinSet(e, 'idle', 0); e.cd = (e.ph === 0 ? 1.0 : 0.8) + Math.random() * 0.7; }
      return;
    case 'creak':   // the beam gives: dust for 2 s, then the bell falls
      sinWalk(e, dt, 0); e.facing = toPl;
      if (Math.random() < dt * 40) { const u = rnd(10, 230); parts.push({ x: sinUx(u), y: sinRy(1), vx: rnd(-6, 6), vy: rnd(10, 40), g: 120, life: 1.4, max: 1.4, col: Math.random() < 0.5 ? '#8a8478' : '#5a4228', size: 1 }); }
      b.ring = Math.max(b.ring, 0.3);
      if (e.stateT <= 0) { b.mode = 'fall'; b.vy = 0; b.ty = sinRy(21); b.u = 120; b.y = sinRy(0) + 12; b.ang = 0; sfx.sinRacha(true); sinSet(e, 'fall', 6); }
      return;
    case 'fall':
      sinWalk(e, dt, 0);
      if ((b.mode === 'stuck' && e.gnd && e.stateT0 > 0.6) || e.stateT <= 0) { sinSet(e, 'recover', 0.8); e.pullT = 2; }
      return;
    /* ----- phase 2, the floors ----- */
    case 'pullTell':
      e.facing = toPl;
      if (e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0);
      if (Math.random() < dt * 30) { const g = sinGeo(), u = rnd(36, 204); parts.push({ x: sinUx(u), y: sinRy(18) + 12, vx: rnd(-4, 4), vy: rnd(10, 30), g: 200, life: 0.9, max: 0.9, col: '#8a8478', size: 1 }); }
      if (e.stateT <= 0) { const P = sinNextPlate(); if (P) { b.mode = 'pull'; b.t = 0; b.plate = P; b.u0 = b.u; b.y0 = b.y; sfx.sinCorda(1.2); sinSet(e, 'pullDo', 6); } else { b.mode = 'stuck'; sinSet(e, 'recover', 0.4); } }
      return;
    case 'pullDo':
      if (e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0);
      if (b.mode === 'stuck') { sinPulls++; e.pullT = 3.5; sinSet(e, 'recover', 0.5); }
      return;
    case 'throwWind':
      e.facing = toPl;
      if (e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0);
      if (e.stateT <= 0) { sinThrow(e); sinSet(e, 'throwWait', 3); }
      return;
    case 'throwWait':
      if (e.climbing) sinHang(e, dt); else sinWalk(e, dt, 0);
      if (!sinFx.clap || e.stateT <= 0) { sinFx.clap = null; sinSet(e, 'recover', 0.4); }
      return;
    case 'climb':
      sinClimb(e, dt);
      return;
    case 'hang':
      sinHang(e, dt); e.facing = toPl;
      if (e.cd <= 0 && e.stateT > 0) { sinSet(e, 'idle', 0); return; }
      if (e.stateT <= 0 || pl.y + pl.h > e.y + e.h + 30) { e.climbing = false; sinSet(e, 'idle', 0); e.cd = Math.max(e.cd, 0.6); }
      return;
    case 'rumble':   // the last floor gives way
      if (e.climbing) { e.climbing = false; }
      sinWalk(e, dt, 0);
      if (Math.random() < dt * 50) { const u = rnd(12, 228), r = Math.random() < 0.5 ? 27 : 36; parts.push({ x: sinUx(u), y: sinRy(r) + 12, vx: rnd(-6, 6), vy: rnd(10, 40), g: 200, life: 1, max: 1, col: '#8a8478', size: 1 }); }
      shake(1.5);
      if (e.stateT <= 0) {
        for (const p of SIN_PLATES) if (p.r >= 27) sinBreak(p);
        b.mode = 'sink'; b.vy = 0; b.ty = sinRy(41); b.u0 = b.u; sinSet(e, 'sinkfall', 6);
      }
      return;
    case 'sinkfall':
      sinWalk(e, dt, 0);
      // into the water with the bell: he goes under and comes up in the pool nearer the hero
      if (b.mode === 'sunk' && e.stateT0 > 0.5 && (e.gnd || e.y + e.h > sinRy(43) || e.stateT <= 0)) {
        sfx.sinAgua(); burst(e.x + e.w / 2, sinRy(44), 24, '#22262c', 140, 300, 0.7);
        e.hidden = true; e.minT = 6; const tg = sinPoolAt(sinPcx()); e.pool = tg.p; e.tx = tg.x; e.noGrab = true; sinSet(e, 'under', 0.9);
      }
      return;
    /* ----- phase 3, the cistern ----- */
    case 'swim': sinSwim(e, dt); return;
    case 'dive':
      sinFloat(e, dt, 30 + e.stateT0 * 60);
      if (e.stateT <= 0) { e.hidden = true; sinSet(e, 'under', 1.0); const tg = sinPoolAt(pcx); e.pool = tg.p; e.tx = tg.x; }
      return;
    case 'under':
      if (Math.random() < dt * 22) sinFx.bubbles.push({ x: e.tx + rnd(-10, 10), y: sinRy(44) + rnd(4, 40), s: Math.random() < 0.3 ? 2 : 1, t: 0 });
      if (Math.random() < dt * 6) sfx.sinBolha();
      if (e.stateT <= 0) { sinEmerge(e, true); }
      return;
    case 'emerge':
      sinFloat(e, dt, 0);
      if (e.stateT <= 0) { sinSet(e, pl.sinGrab ? 'hold' : 'swim', pl.sinGrab ? 1 : 0); e.cd = 1.2 + Math.random() * 0.6; }
      return;
    case 'hold': sinFloat(e, dt, 0); if (e.stateT <= 0 || !pl.sinGrab) { pl.sinGrab = null; sinSet(e, 'swim', 0); e.cd = 1.4; } return;
    case 'ringDive':
      sinFloat(e, dt, 30 + e.stateT0 * 60);
      if (e.stateT <= 0) {
        e.hidden = true; sinSet(e, 'ringTell', 0.8); sfx.sinCorda(0.4);
        const sy = sinRy(44);
        for (const u of [64, 120, 172]) sinFx.surf.push({ x: sinUx(u), y: u === 120 ? sinRy(41) : sy, t: 0, max: 0.8 });
      }
      return;
    case 'ringTell':
      if (e.stateT <= 0) { sinUnderToll(e); sinSet(e, 'under', 0.7); const tg = sinPoolAt(sinUx(Math.random() < 0.5 ? 66 : 172)); e.pool = tg.p; e.tx = tg.x; e.noGrab = true; }
      return;
  }
}
/* phase 2: walking his floor; when the hero is well above, he goes up his rope like a mast and hangs there */
function sinMove2(e, dt) {
  const pcx = sinPcx(), ecx = e.x + e.w / 2, feet = pl.y + pl.h, adx = Math.abs(pcx - ecx);
  if (feet < e.y + e.h - 40 && e.gnd && !pl.dead) { e.climbing = true; sinSet(e, 'climb', 4); return; }
  sinWalk(e, dt, adx > 70 ? Math.sign(pcx - ecx) * 40 : adx < 30 ? -Math.sign(pcx - ecx) * 25 : 0);
}
// up the rope: to the far rim's line, to the hero's height (never above the belfry floor's row)
function sinClimb(e, dt) {
  const tx = sinUx(SIN_U_FAR) - e.w / 2, ty = Math.max(sinRy(1), Math.min(pl.y + pl.h, sinRy(26))) - e.h;
  e.x = approach(e.x, tx, 60 * dt); e.y = approach(e.y, ty, 80 * dt); e.gnd = false; e.vx = e.vy = 0;
  if (Math.random() < dt * 3) sfx.sinCorda(0.3);
  if ((Math.abs(e.x - tx) < 2 && Math.abs(e.y - ty) < 2) || e.stateT <= 0) { sinSet(e, 'hang', 5); e.cd = Math.min(e.cd, 0.5); }
}
function sinHang(e, dt) {
  const ty = Math.max(sinRy(1), Math.min(pl.y + pl.h, sinRy(26))) - e.h;
  e.y = approach(e.y, ty, 40 * dt); e.vx = e.vy = 0; e.gnd = true;
}
/* phase 3: in the water, head and shoulders out */
const sinPoolX = p => sinUx((SIN_POOLS[p][0] + SIN_POOLS[p][1]) / 2);
function sinPoolAt(x) {
  const u = clamp(sinXu(x), 0, 240), p = u < 120 ? 0 : 1, [a, b] = SIN_POOLS[p];
  return { p, x: sinUx(clamp(u, a, b)) };
}
function sinFloat(e, dt, sink) {
  const ty = sinRy(44) - e.h * 0.55 + sink + Math.sin(e.t * 2) * 1.5;
  e.y = approach(e.y, ty, 120 * dt); e.vx = e.vy = 0; e.gnd = false;
}
function sinSwim(e, dt) {
  const pcx = sinPcx(), tg = sinPoolAt(pcx);
  if (e.pool !== tg.p && e.cd < 0.4) { sinSet(e, 'dive', 0.5); e.noGrab = false; return; }
  const [a, b] = SIN_POOLS[e.pool], tx = sinUx(clamp(sinXu(pcx), a, b)) - e.w / 2;
  e.x = approach(e.x, tx, 30 * dt); sinFloat(e, dt, 0); e.facing = Math.sign(pcx - e.x - e.w / 2) || e.facing;
  if (Math.random() < dt * 4) parts.push({ x: e.x + rnd(0, e.w), y: sinRy(44) - 1, vx: rnd(-10, 10), vy: rnd(-20, -5), g: 200, life: 0.5, max: 0.5, col: '#22262c', size: 1 });
  // two afogados climb out at the edges every 20 s
  if ((e.minT -= dt) <= 0) { e.minT = 20; sinAfogados(); }
  if (e.cd > 0) return;
  const r = Math.random();
  if (r < 0.55) { sinSet(e, 'dive', 0.5); e.noGrab = false; sfx.sinAgua(0.5); }
  else { sinSet(e, 'ringDive', 0.5); sfx.sinAgua(0.5); }
}
function sinEmerge(e, grab) {
  e.hidden = false; e.x = e.tx - e.w / 2; e.y = sinRy(44) - e.h * 0.55 + 14; sinSet(e, 'emerge', 0.4);
  sfx.sinAgua(1); sfx.sinGrito(); burst(e.tx, sinRy(44), 22, '#22262c', 130, 300, 0.7); burst(e.tx, sinRy(44), 8, '#566a5a', 80, 200, 0.6);
  if (grab && !e.noGrab && !pl.dead) {
    const pcx = sinPcx(), feet = pl.y + pl.h, sy = sinRy(44);
    if (Math.abs(pcx - e.tx) < 28 && feet > sy - 34 && feet < sy + 72) {
      const r = hurtPlayer(Math.max(1, Math.round(e.dmg * SIN.wave)), e.tx, e, false);
      if (r === 'hit') { pl.sinGrab = { t: 1, x: e.tx - pl.w / 2 + e.facing * 4, y: sy + 2 * T - pl.h + 6 }; }
    }
  }
  e.noGrab = false;
}
function sinAfogados() {
  if (!ET.afogado || !AI.afogado) return;
  let n = 0; for (const m of enemies) if (m.sinMinion && !m.dead) n++;
  if (n >= 4) return;
  for (const u of [50, 190]) {
    const D = ET.afogado, x = sinUx(u) - D.w / 2, y = sinRy(50) - D.h - 1;
    const m = spawnEnemy('afogado', x, y, 3); if (!m || m.dead) continue;
    if (enemies.indexOf(m) < 0) enemies.push(m);
    Object.assign(m, { sinMinion: true, memT: 8, aggro: true, xp: 1, gold: 0 });
    burst(sinUx(u), sinRy(44), 14, '#22262c', 90, 300, 0.6);
  }
  sfx.sinAgua(0.8);
}

/* the blows */
// the toll: the bell rings and a ring of sound runs along the floor both ways (muffled: up and down the walls too)
function sinToll(e, muffled, quiet) {
  const b = sinBell; b.ring = 1.6;
  if (muffled) sfx.sinAbafado(); else sfx.sinSino();
  shake(quiet ? 3 : 4);
  if (quiet) return;
  const [bx] = sinBellC(), floorY = muffled ? sinFloorY(sinPcx(), pl.y + pl.h - 2) : sinRy(9), x0 = bx;
  const lo = Math.min(sinUx(0), sinUx(240)) + 2, hi = Math.max(sinUx(0), sinUx(240)) - 2;
  sinFx.rings.push({ t: 0, done: 0, muffled, fronts: [{ x: x0, y: floorY, d: -1, on: true, lim: lo, hit: false }, { x: x0, y: floorY, d: 1, on: true, lim: hi, hit: false }], y: floorY });
  burst(x0, floorY - 2, 10, '#8a8478', 60, 200, 0.5);
}
function sinDrips(e) {
  const pcx = sinPcx(), lo = Math.min(sinUx(6), sinUx(234)), hi = Math.max(sinUx(6), sinUx(234));
  for (let k = 0; k < 4; k++) {
    const x = clamp(k === 0 ? pcx : pcx + rnd(-90, 90), lo, hi), land = sinFloorY(x, sinRy(1) + 14);
    sinFx.drops.push({ x, y: sinRy(1), land, t: -0.9 - k * 0.15, vy: 0, hit: false, done: false });
  }
}
function sinThrow(e) {
  const [hx, hy] = sinHand(e, 9), pcx = sinPcx(), pcy = pl.y + pl.h / 2, tf = 0.75, dx = pcx - hx, dy = pcy - hy;
  sinFx.clap = { x: hx, y: hy, vx: clamp(dx / tf, -320, 320), vy: dy / tf - 0.5 * 900 * tf, st: 'out', bounced: false, hit: false, t: 0, rot: 0 };
  sfx.sinArremesso();
}
function sinUnderToll(e) {
  sfx.sinSubmerso(); shake(5);
  const sy = sinRy(44);
  for (const d of [-1, 1]) sinFx.waves.push({ x: sinUx(120) + d * 36, y: sy, d, t: 0 });
  // whoever is in the water or on the bell is thrown
  const inW = aguaIn(pl.x, pl.y, pl.w, pl.h) > 0, feet = pl.y + pl.h, onBell = Math.abs(sinPcx() - sinUx(120)) < 40 && feet <= sinRy(42) + 2 && feet >= sinRy(40) - 2;
  if (!pl.dead && (inW || onBell)) {
    const dir = Math.sign(sinPcx() - sinUx(120)) || 1, r = hurtPlayer(Math.max(1, Math.round(e.dmg * SIN.wave)), sinUx(120), null, true);
    if (r === 'hit') { pl.vx = dir * 300; pl.vy = -220; }
  }
  for (const m of enemies) if (m.sinMinion && !m.dead && aguaIn(m.x, m.y, m.w, m.h) > 0) { m.vx = Math.sign(m.x - sinUx(120)) * 200; m.stun = Math.max(m.stun, 0.5); }
}

/* the bell, the rings, the drops, the clapper, the bubbles */
function sinFxTick(dt) {
  const e = sinBoss, b = sinBell, g = sinGeo(), pcx = sinPcx();
  if (b.ring > 0) b.ring -= dt;
  const bellHit = (full) => {
    if (!e || pl.dead || b.hitT > 0) return;
    const [bx, by] = sinBellC(), nx = clamp(bx, pl.x, pl.x + pl.w), ny = clamp(by + 4, pl.y, pl.y + pl.h);
    if (Math.hypot(nx - bx, ny - by - 4) < 33) { b.hitT = 1; const r = hurtPlayer(full ? e.dmg : Math.round(e.dmg * SIN.wave), bx, null, true); if (r === 'hit') { pl.vx = (Math.sign(pcx - bx) || 1) * 300; pl.vy = -200; } }
  };
  if (b.hitT > 0) b.hitT -= dt;
  switch (b.mode) {
    case 'swing': {   // draws back slowly (0.8 s), sweeps (0.55 s), swings back and settles
      b.t += dt; const T0 = 0.8, T1 = 1.35, T2 = 2.6, A0 = 1.0, A1 = 0.95, d = b.dir;
      if (b.t < T0) { const k = sm01(b.t / T0); b.ang = -d * A0 * k; b.R = 42 + 12 * k; if (Math.random() < dt * 4) sfx.sinCorda(0.25); }
      else if (b.t < T1) { const k = (b.t - T0) / (T1 - T0); b.ang = d * (-A0 + (A0 + A1) * sm01(k)); b.R = 54; if (!b.whoosh) { b.whoosh = true; sfx.sinBalanco(); b.hitT = 0; } bellHit(true); }
      else if (b.t < T2) { const k = (b.t - T1) / (T2 - T1); b.ang = d * A1 * (1 - sm01(k)); b.R = 54 - 12 * sm01(k); }
      else { b.mode = 'hang'; b.ang = 0; b.R = 42; b.whoosh = false; }
      break;
    }
    case 'fall': {   // the bell drops through the belfry floor and the 3rd floor
      b.vy = Math.min(b.vy + 700 * dt, 420); b.y += b.vy * dt;
      for (const p of SIN_PLATES) if (p.at === 'queda' && sinPlateUp(p) && b.y + 72 >= sinRy(p.r)) { sinBreak(p); b.vy *= 0.55; }
      bellHit(true);
      if (b.y >= b.ty) { b.y = b.ty; b.mode = 'stuck'; b.vy = 0; sfx.sinQueda(); shake(8); burst(sinUx(120), b.y + 72, 30, '#8a8478', 140, 300, 0.8); b.ring = 1.2; }
      break;
    }
    case 'tense':   // the rope goes taut, the hole's edge shakes
      b.t += dt; b.ring = 0.25;
      if (Math.random() < dt * 25) { const u = Math.random() < 0.5 ? rnd(30, 40) : rnd(200, 210); parts.push({ x: sinUx(u), y: sinRy(18) + 12, vx: rnd(-5, 5), vy: rnd(20, 50), g: 300, life: 0.7, max: 0.7, col: '#8a8478', size: 1 }); }
      break;
    case 'pull': {   // up 2 rows, over the marked plate, down on it, caught by the rope, hauled back
      b.t += dt; const P = b.plate, pu = (P.c0 + P.c1 + 1) * 6, ys = sinRy(21), yu = sinRy(19);
      if (b.t < 0.5) { b.y = ys + (yu - ys) * sm01(b.t / 0.5); if (b.t < dt * 1.5) sfx.sinCorda(1); }
      else if (b.t < 0.95) { b.u = b.u0 + (pu - b.u0) * sm01((b.t - 0.5) / 0.45); b.y = yu; b.vy = 0; }
      else if (!b.broke) {
        b.vy = Math.min(b.vy + 900 * dt, 480); b.y += b.vy * dt; bellHit(true);
        if (b.y + 72 >= sinRy(P.r)) { b.broke = true; sinBreak(P); sfx.sinQueda(0.7); b.ring = 0.8; b.catchY = sinRy(P.r) - 72 + 18; }
      } else if (!b.caught) {
        b.vy = Math.min(b.vy + 900 * dt, 480); b.y += b.vy * dt; bellHit(true);
        if (b.y >= b.catchY) { b.y = b.catchY; b.caught = true; b.t2 = 0; b.cy0 = b.y; b.cu0 = b.u; sfx.sinCorda(1.2); }
      } else {
        b.t2 += dt; const k = sm01(Math.min(1, b.t2 / 1.3));
        b.y = b.cy0 + (ys - b.cy0) * k; b.u = b.cu0 + (120 - b.cu0) * sm01(Math.min(1, b.t2 / 1.3 * 1.4));
        if (b.t2 >= 1.3) { b.mode = 'stuck'; b.y = ys; b.u = 120; b.broke = b.caught = false; b.plate = null; }
      }
      break;
    }
    case 'sink': {   // into the cistern: half under, the island
      b.vy = Math.min(b.vy + 700 * dt, 420); b.y += b.vy * dt; b.u = approach(b.u, 120, 60 * dt); bellHit(true);
      if (b.y >= b.ty) {
        b.y = b.ty; b.u = 120; b.mode = 'sunk'; b.vy = 0; sinBellTiles(); mapVer++;
        sfx.sinQueda(1); sfx.sinAgua(1.4); shake(9); b.ring = 1.4;
        burst(sinUx(120), sinRy(44), 50, '#22262c', 200, 300, 0.9); burst(sinUx(120), sinRy(44), 20, '#566a5a', 140, 300, 0.8);
        // the hero is never left inside the bell
        if (!pl.dead && rectSolid(pl.x, pl.y, pl.w, pl.h)) { pl.y = sinRy(40) + T - pl.h - 1; pl.vy = -60; }
      }
      break;
    }
  }
  // the rings of sound
  for (let i = sinFx.rings.length - 1; i >= 0; i--) {
    const R = sinFx.rings[i]; R.t += dt; let live = false;
    for (const F of R.fronts) {
      if (!F.on) continue; live = true;
      if (F.vert) {
        F.y += F.dy * 120 * dt; if (Math.abs(F.y - F.y0) >= 4 * T) { F.on = false; continue; }
        if (!F.hit && !pl.dead && Math.abs(pcx - F.x) < 14 && F.y > pl.y && F.y < pl.y + pl.h) { F.hit = true; sinRingHit(F.x); }
        continue;
      }
      F.x += F.d * 165 * dt;
      if ((F.d < 0 && F.x <= F.lim) || (F.d > 0 && F.x >= F.lim)) {
        F.on = false;
        if (R.muffled) for (const dy of [-1, 1]) R.fronts.push({ x: F.lim + F.d * 2, y: R.y - 6, y0: R.y - 6, vert: true, dy, on: true, hit: false, d: F.d });
        continue;
      }
      const feet = pl.y + pl.h;
      if (!F.hit && !pl.dead && Math.abs(pcx - F.x) < 7 && feet > F.y - 5 && feet <= F.y + 2) { F.hit = true; sinRingHit(F.x); }
      if (Math.random() < dt * 30) parts.push({ x: F.x, y: F.y - 1, vx: rnd(-10, 10), vy: rnd(-40, -10), g: 200, life: 0.4, max: 0.4, col: '#8a8478', size: 1 });
    }
    if (!live) { R.done += dt; if (R.done > 0.5) sinFx.rings.splice(i, 1); }
  }
  // the drops
  for (let i = sinFx.drops.length - 1; i >= 0; i--) {
    const d = sinFx.drops[i]; d.t += dt; if (d.t < 0) continue;
    if (d.done) { if (d.t > 0.6) sinFx.drops.splice(i, 1); continue; }
    d.vy = Math.min(d.vy + 900 * dt, 520); d.y += d.vy * dt;
    if (!d.hit && e && !pl.dead && Math.abs(pcx - d.x) < pl.w / 2 + 3 && d.y > pl.y && d.y - 8 < pl.y + pl.h) { d.hit = true; hurtPlayer(Math.max(1, Math.round(e.dmg * SIN.wave)), d.x, null, true); if (typeof cdEncharcar === 'function') cdEncharcar(3); }
    if (d.y >= d.land) { d.done = true; d.t = 0; burst(d.x, d.land - 1, 10, '#22262c', 70, 400, 0.5); burst(d.x, d.land - 1, 3, '#566a5a', 40, 300, 0.4); sfx.sinGota(); }
  }
  // the clapper: out, one bounce, back on its chain
  const C = sinFx.clap;
  if (C && e) {
    C.t += dt; C.rot += dt * 14 * Math.sign(C.vx || 1);
    const [hx, hy] = sinHand(e, sinPose(e));
    if (C.st === 'out') {
      C.vy = Math.min(C.vy + 900 * dt, 520); const nx = C.x + C.vx * dt, ny = C.y + C.vy * dt;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) {
        if (!C.bounced && C.vy > 0) { C.bounced = true; C.vy = -Math.abs(C.vy) * 0.45; C.vx *= 0.75; sfx.sinQuica(); burst(C.x, C.y + 4, 8, '#8a8478', 60, 300, 0.4); shake(2); }
        else { C.st = 'back'; sfx.sinCorrente(1); }
      } else { C.x = nx; C.y = ny; }
      if (C.bounced && (C.vy > 0 || C.t > 1.6)) { C.st = 'back'; sfx.sinCorrente(1); }
      if (C.t > 2) { C.st = 'back'; }
    } else {
      const dx = hx - C.x, dy = hy - C.y, L = Math.hypot(dx, dy), sp = 340 * dt;
      if (L <= sp + 4) { sinFx.clap = null; }
      else { C.x += dx / L * sp; C.y += dy / L * sp; }
    }
    if (sinFx.clap && !C.hit && !pl.dead && Math.abs(pcx - C.x) < pl.w / 2 + 6 && C.y > pl.y - 6 && C.y < pl.y + pl.h + 6) { C.hit = true; const r = hurtPlayer(e.dmg, C.x, null, true); if (r === 'hit') { pl.vx = (Math.sign(C.vx) || 1) * 240; pl.vy = -180; } }
  }
  // bubbles, rings on the water, the wave
  for (let i = sinFx.bubbles.length - 1; i >= 0; i--) { const B = sinFx.bubbles[i]; B.t += dt; B.y -= 50 * dt; B.x += Math.sin(B.t * 9) * 0.3; if (B.y <= sinRy(44) - 2 || B.t > 1.2) { sinFx.bubbles.splice(i, 1); if (Math.random() < 0.3) burst(B.x, sinRy(44) - 1, 2, '#566a5a', 20, 100, 0.3); } }
  for (let i = sinFx.surf.length - 1; i >= 0; i--) { const S = sinFx.surf[i]; S.t += dt; if (S.t >= S.max) sinFx.surf.splice(i, 1); }
  for (let i = sinFx.waves.length - 1; i >= 0; i--) {
    const W = sinFx.waves[i]; W.t += dt; W.x += W.d * 200 * dt;
    if (Math.random() < dt * 40) parts.push({ x: W.x, y: W.y - 2, vx: W.d * rnd(20, 60), vy: rnd(-90, -30), g: 400, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#22262c' : '#566a5a', size: 1 });
    if (W.t > 0.7) sinFx.waves.splice(i, 1);
  }
  for (let i = sinFx.tolls.length - 1; i >= 0; i--) { const L = sinFx.tolls[i]; L.t += dt; if (L.t > 0.35) sinFx.tolls.splice(i, 1); }
}
const sm01 = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function sinRingHit(x) {
  const e = sinBoss; if (!e) return;
  const r = hurtPlayer(Math.max(1, Math.round(e.dmg * SIN.wave)), x, null, true);
  if (r === 'hit') { pl.vy = -170; pl.vx = (Math.sign(sinPcx() - x) || 1) * 120; }
}
// held under: the grab drags the hero 2 blocks down into the water and holds 1 s
{ const _up = updatePlayer; updatePlayer = function (dt) {
  const r = _up(dt);
  const G = pl.sinGrab;
  if (G && !pl.dead) {
    G.t -= dt; pl.x = approach(pl.x, G.x, 220 * dt); pl.y = approach(pl.y, G.y, 220 * dt); pl.vx = 0; pl.vy = 0;
    if (Math.random() < dt * 10) parts.push({ x: pl.x + pl.w / 2 + rnd(-3, 3), y: pl.y + 2, vx: rnd(-6, 6), vy: rnd(-40, -20), g: -30, life: 0.8, max: 0.8, col: '#566a5a', size: 1 });
    if (G.t <= 0 || !sinBoss) pl.sinGrab = null;
  } else if (G) pl.sinGrab = null;
  return r;
}; }
HOOK.update.push(dt => {
  if (typeof CIDADE === 'undefined' || !CIDADE || !cdBoss || !pl) return;
  sinFx.frame++;
  // the legendary's toll fades even out of the tower
  if (sinFx.tolls.length && !sinBoss) for (let i = sinFx.tolls.length - 1; i >= 0; i--) { const L = sinFx.tolls[i]; L.t += dt; if (L.t > 0.35) sinFx.tolls.splice(i, 1); }
  if (state !== 'play') return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!sinState.dead && !bossFight && !pl.dead && sinInBelfry(ptx, pty)) sinStart();
  const e = sinBoss;
  if (e && bossFight && bossFight.sin && !pl.dead && !inCdHall(ptx, pty, 1)) { endBossFight(false); return; }
  if (e && bossFight && bossFight.sin) { if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } } sinFxTick(dt); }
  // the stun of the Badalo's toll: a little bell over the head
  for (const m of enemies) if (m.sinTollT > 0) { m.sinTollT -= dt; if (Math.random() < dt * 8) parts.push({ x: m.x + m.w / 2 + rnd(-5, 5), y: m.y - 4, vx: 0, vy: -10, g: 0, life: 0.4, max: 0.4, col: '#c0a060', size: 1, glow: true }); }
});

/* ---------- sounds: the big bell, the muffled one, the one under the water; the beam, the rope, the water ---------- */
function sinBellTone(f, vol, len, damp) {
  // a bell: the hum, the prime, the minor third, the fifth, the nominal (each with its own decay), then the strike
  const P = [[0.5, 1, 1], [1, 0.8, 0.8], [1.2, 0.5, 0.6], [1.5, 0.35, 0.5], [2, 0.45, 0.42], [2.66, 0.2, 0.3], [3.01, 0.14, 0.22]];
  for (const [r, v, d] of P) { if (damp && r > 2) continue; tone(f * r, len * d, 'sine', vol * v, -f * r * 0.004); tone(f * r * 1.004, len * d * 0.9, 'sine', vol * v * 0.5); }
}
Object.assign(sfx, {
  sinSino() { sinBellTone(98, 0.05, 4.2, false); noise(0.08, 0.1, 2200, 'bandpass', 0, 2); noise(0.5, 0.03, 300, 'lowpass'); },
  sinAbafado() { sinBellTone(92, 0.045, 1.8, true); noise(0.3, 0.07, 260, 'lowpass'); tone(46, 1.2, 'sine', 0.05, -4); },
  sinSubmerso() { sinBellTone(70, 0.04, 2.2, true); noise(1.2, 0.07, 200, 'lowpass'); for (let k = 0; k < 6; k++) tone(320 + Math.random() * 300, 0.08, 'sine', 0.012, 260, 0.3 + k * 0.09); },
  sinViga() { for (let k = 0; k < 12; k++) tone(80 + Math.random() * 50, 0.07, 'sawtooth', 0.025, -25, k * 0.16 + Math.random() * 0.05); noise(2, 0.04, 500, 'bandpass', 0, 6); tone(52, 2, 'sine', 0.03, 8); },
  sinCorda(v = 1) { tone(150 + Math.random() * 40, 0.4 * v + 0.15, 'sawtooth', 0.012 * v + 0.006, 50); noise(0.35 * v + 0.1, 0.025 * v + 0.01, 1300, 'bandpass', 0, 7); },
  sinBalanco() { noise(0.55, 0.08, 500, 'bandpass', 0, 1.5); tone(70, 0.5, 'sine', 0.04, 30); },
  sinRacha(wood) { noise(0.5, 0.12, wood ? 700 : 400, 'lowpass'); noise(0.25, 0.06, wood ? 2600 : 1600, 'bandpass', 0.03); tone(wood ? 110 : 70, 0.35, 'square', 0.03, -40); for (let k = 0; k < 4; k++) noise(0.05, 0.05, 3000, 'highpass', 0.08 + k * 0.07); },
  sinQueda(v = 1) { sinBellTone(82, 0.04 * v, 2.8, false); noise(0.8, 0.13 * v, 320, 'lowpass'); tone(44, 0.9, 'sine', 0.06 * v, -6); },
  sinAgua(v = 1) { noise(0.6 * v, 0.1 * v, 700, 'lowpass'); noise(0.3, 0.05 * v, 2400, 'bandpass', 0.05); tone(180, 0.2, 'sine', 0.02 * v, -120); },
  sinBolha() { tone(380 + Math.random() * 300, 0.06, 'sine', 0.012, 240); },
  sinGrito() { tone(78, 1.1, 'sawtooth', 0.03, -18); noise(1.0, 0.04, 420, 'bandpass', 0, 3); for (let k = 0; k < 4; k++) tone(260 + Math.random() * 200, 0.07, 'sine', 0.012, 200, 0.2 + k * 0.12); },
  sinSacode() { noise(0.7, 0.07, 1500, 'bandpass', 0, 1.5); noise(0.6, 0.04, 400, 'lowpass', 0.05); },
  sinGota() { noise(0.12, 0.05, 1100, 'bandpass'); tone(520, 0.08, 'sine', 0.02, -320); },
  sinArremesso() { noise(0.32, 0.08, 900, 'bandpass', 0, 1.2); for (let k = 0; k < 5; k++) noise(0.04, 0.035, 3400, 'highpass', 0.04 + k * 0.05); },
  sinQuica() { tone(150, 0.16, 'square', 0.04, -60); noise(0.14, 0.08, 800, 'lowpass'); tone(620, 0.6, 'sine', 0.02); tone(744, 0.5, 'sine', 0.012); },
  sinCorrente(v = 1) { for (let k = 0; k < 6; k++) { noise(0.04, 0.03 * v, 3000 + Math.random() * 1200, 'bandpass', k * 0.05, 3); tone(900 + Math.random() * 400, 0.04, 'triangle', 0.006 * v, 0, k * 0.05); } },
  sinRonco() { noise(1.3, 0.08, 160, 'lowpass'); tone(40, 1.3, 'sawtooth', 0.03, 6); for (let k = 0; k < 6; k++) noise(0.06, 0.05, 2200, 'bandpass', 0.15 + k * 0.18); },
  sinGrade() { tone(88, 0.4, 'square', 0.04, -20); noise(0.4, 0.08, 1400, 'bandpass'); tone(420, 0.5, 'triangle', 0.02, -40); tone(560, 0.4, 'triangle', 0.012, -50, 0.05); },
  sinMorte() { sinBellTone(74, 0.04, 5, false); tone(74 * 1.06, 3, 'sine', 0.025, -4, 0.02); noise(2.5, 0.05, 260, 'lowpass'); noise(1.6, 0.03, 1400, 'bandpass', 0.5); },
  sinBadalo() { sinBellTone(330, 0.03, 1.2, false); noise(0.05, 0.08, 3000, 'bandpass', 0, 2); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.sineiro = { dead: sinState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  sinBoss = null; sinSnap = null; sinFx.gates.length = 0; sinClear(); sinFx.tolls.length = 0; sinPulls = 0;
  sinState.dead = !!(sv && sv.sineiro && sv.sineiro.dead);   // before the build: the dressing reads it
  sinGeoC = null;
  return _nw(sd, sv);
}; }
