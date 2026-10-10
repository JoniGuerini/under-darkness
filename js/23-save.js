'use strict';

/* ================= save ================= */
const SAVE_KEY = 'sob-a-terra-v2', OLD_SAVE_KEY = 'sob-a-terra-v1';
function makeSave() { return { wrap: 1, seed, diffs: [...diffs.entries()], p: { x: pl.x, y: pl.y, lvl: pl.lvl, xp: pl.xp, hp: pl.hp, kills: pl.kills }, inv: inv.map(s => !s ? null : ITEMS[s.id].slot ? [s.id, 1, itemRar(s), s.mods || [], s.il] : [s.id, s.n]), eq: Object.fromEntries(EQ_SLOTS.map(k => [k, equip[k] ? [equip[k].id, itemRar(equip[k]), equip[k].mods || [], equip[k].il] : null])), gear: 4, hbv: 2, hb: hb.sel, bt: blockTip, wg: CATEDRAL ? 2 : 1, cp: [...propGone], seen: packSeen(), wt: worldTime, dl: DAY_LEN, tut: tutorialStep, vil: 1, gold: pl.gold, fur: { ore: furnace.ore, fuel: furnace.fuel, out: furnace.out, on: furnace.on, t: furnace.t, goal: furnace.goal } }; }
function saveGame() { if (!tiles) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(makeSave())); } catch (e) { } }
let ringNews = false, gearNews = false, cathNews = false;
function migrateSave(v) {
  // worlds from before the cathedral: a new world under the village; level, items, gold and the chest stay
  if (v && CATEDRAL && v.wg !== 2 && typeof v.seed === 'number') { v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null; v.cp = []; if (v.p) { delete v.p.x; delete v.p.y; } v.wg = 2; cathNews = !!v.p; }
  if (!v || v.wrap === 1) return v;
  v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null;
  if (v.p) { delete v.p.x; delete v.p.y; }
  v.wrap = 1; ringNews = !!v.p; return v;
}
function loadSave() { try { const s = localStorage.getItem(SAVE_KEY); if (s) return JSON.parse(s); const o = localStorage.getItem(OLD_SAVE_KEY); if (!o) return null; const v = JSON.parse(o); v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; if (v.p) { delete v.p.x; delete v.p.y; } v.migrated = true; return v; } catch (e) { return null; } }
function newWorld(sd, sv) {
  generate(sd); diffs.clear(); chunks.clear();
  enemies.length = projs.length = orbs.length = parts.length = texts.length = loot.length = 0;
  bossFight = null; $('bossbar').hidden = true; $('hud').classList.remove('boss');
  if (sv && Array.isArray(sv.diffs)) for (const [i, t] of sv.diffs) { if (i >= 0 && i < tiles.length && t >= 0 && t < NT && !inVillage(i % WW, (i / WW) | 0)) { tiles[i] = t; diffs.set(i, t); } }
  if (sv && typeof sv.seen === 'string') unpackSeen(sv.seen);
  applyPropGone(sv && sv.cp);
  mapNews = !!(sv && sv.p && typeof sv.seen !== 'string'); mapKey = '';
  Object.assign(pl, { lvl: 1, xp: 0, kills: 0, gold: 0, dead: false, vx: 0, vy: 0, atkT: -1, shieldK: 0, invuln: 0, facing: 1, mining: false, digT: 0, digX: -1 });
  hb.sel = sv && sv.hb >= 0 && sv.hb < HB_N ? sv.hb | 0 : 0; toolNews = false; blockTip = !!(sv && sv.bt); hudCache.hb = null;
  worldTime = 0; tutorialStep = 0; tutorialT = 0;
  inv = new Array(INV_N).fill(null); for (const k of EQ_SLOTS) equip[k] = DEFAULT_EQ[k] ? mkItem(DEFAULT_EQ[k], 0) : null;
  // gear: 3 = bases + modifiers (js/48-itemizacao.js). Older gear keeps its rarity and rolls new modifiers to match
  const loadGear = (id, rar, mods, il) => sv.gear >= 2 ? mkItem(id, rar | 0, sv.gear === 3 ? rerollValues(id, mods, il) : mods, il) : ITEMS[id].legend ? mkItem(id) : mkItem(id, clamp(ITEMS[id].rar || 0, 0, 3));
  shopDay = -1; stock = {}; chatIdx = {}; lastVil = null;
  villageNews = !!(sv && sv.p && !sv.vil); pl.gold = sv && sv.gold != null ? Math.max(0, sv.gold | 0) : 0;
  { const f = sv && sv.fur, ok = (q, fit) => q && ITEMS[q.id] && fit(q.id) && q.n > 0 ? { id: q.id, n: Math.min(99, q.n | 0) } : null;
    furnace = { ore: ok(f && f.ore, id => !!FURN[id]), fuel: ok(f && f.fuel, id => id === 'carvao'), out: ok(f && f.out, id => /^barra_/.test(id)), on: !!(f && f.on), t: f && +f.t || 0, made: 0, goal: f && f.goal | 0 }; forgeDirty = true; }
  if (sv && sv.p) { pl.lvl = Math.max(1, sv.p.lvl | 0); pl.xp = Math.max(0, +sv.p.xp || 0); pl.kills = sv.p.kills | 0; worldTime = +sv.wt || 0;
    // saves from the old 7-minute day (started at 08:00): keep the day count and the hour of day
    if (!sv.dl) { const od = 420, d = Math.floor(worldTime / od), h = (8 + (worldTime % od) / od * 24) % 24; worldTime = d * DAY_LEN + ((h - 18 + 24) % 24) / 24 * DAY_LEN; } }
  if (sv && Array.isArray(sv.inv)) {
    sv.inv.forEach((q, i) => { if (!sv.hbv && i >= 6) i += 2;   // old saves: 6 hotbar slots, the backpack started at 6
      if (i < INV_N && Array.isArray(q) && ITEMS[q[0]]) inv[i] = ITEMS[q[0]].slot ? loadGear(q[0], q[2], q[3], q[4]) : { id: q[0], n: clamp(q[1] | 0, 1, stackMax(q[0])) }; });
    if (sv.eq) for (const k of EQ_SLOTS) { const v = sv.eq[k], id = Array.isArray(v) ? v[0] : v; equip[k] = id && ITEMS[id] && slotFits(id, k) ? loadGear(id, Array.isArray(v) ? v[1] : 0, Array.isArray(v) ? v[2] : null, Array.isArray(v) ? v[3] : 0) : null; }
    // saves from before the hotbar: hand out the pickaxe once
    if (!sv.eq || !('tool' in sv.eq)) { if (!inv.some(q => q && ITEMS[q.id].slot === 'tool')) equip.tool = mkItem('picareta_ferro', 0); toolNews = true; }
    gearNews = !sv.gear && !!sv.p;
  } else { addItem('tocha', sv && sv.p && sv.p.torches != null ? Math.max(0, sv.p.torches | 0) : 12); for (const id of ['montante_madeira', 'montante_eclipse', 'elmo_eclipse', 'peitoral_eclipse', 'botas_eclipse']) if (ITEMS[id]) { const i = inv.indexOf(null, HB_BAG); if (i >= 0) inv[i] = mkItem(id, 0); } toolNews = !!(sv && sv.p); }   // every new hero also carries a wooden two-handed sword (js/125-madeira.js) and the Montante do Eclipse (js/130)
  recalc(); buildLook(); pl.hp = pl.maxHp; pl.mana = pl.maxMana;
  const [x, y] = spawnPoint(); pl.x = x; pl.y = y;
  if (sv && sv.p && isFinite(sv.p.x) && isFinite(sv.p.y) && !rectSolid(sv.p.x, sv.p.y, pl.w, pl.h)) { pl.x = sv.p.x; pl.y = sv.p.y; pl.hp = clamp(+sv.p.hp || pl.maxHp, 1, pl.maxHp); }
  cam.x = pl.x - VW / 2; cam.y = pl.y - VH / 2; lastZone = -1;
}
