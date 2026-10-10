'use strict';

/* ================= what the Darkness makes (2): the trail, the shroud, the listener, the hollow kindler, the hand from below =================
   docs/camadas/16-escuridao.md, section 6 (same silhouettes and rim as 224):
   - the trail (rastro, sombra): slides flat over the floor like a shadow and cannot be hit; rises (the eyes light and it
     grows, 0.5 s) for a short lunge, and stays up a moment, open to blows; strong light makes it rise and stay exposed.
   - the shroud (mortalha, sombra): glides in long arcs like a black cloth on the wind; stops over the hero and its edges
     light (0.7 s); if it lands, it wraps him: his sight goes and he takes damage for 2 s or until he hits it.
   - the listener (ouvinte): blind; walks toward noise (blows, the pick, running, jumping). Standing still or crouching,
     the hero vanishes for it. A scream in a cone (the head goes up, pale rings out of the mouth 0.6 s before): it
     pushes and stuns.
   - the hollow kindler (acendedor): a Kindler emptied by the Darkness; walks slow with a lantern of cold blue fire and
     keeps near the lit braziers; raises the lantern back (a trail of light) and throws its flame in an arc: where it
     lands, a pool of cold fire for 4 s that hurts and lights.
   - the hand from below (maofundo, sombra): lives in the bottomless pits; pale fingers show on the edge and scratch the
     stone (0.8 s); the hand grabs whoever is on the edge or on the chain and pulls down.
   Also here: the black glass spikes at the bottom of the pits hurt whoever falls on them. Loads after 224. */

Object.assign(ET, {
  rastro: { name: 'Rastro', w: 12, h: 18, hp: 90, dmg: 22, xp: 34, kb: 0.5, fly: false, sombra: true, blood: '#0c0a12' },
  mortalha: { name: 'Mortalha', w: 16, h: 10, hp: 60, dmg: 14, xp: 26, kb: 0.8, fly: true, sombra: true, blood: '#14101c' },
  ouvinte: { name: 'O Ouvinte', w: 12, h: 24, hp: 110, dmg: 20, xp: 36, kb: 0.5, fly: false, blood: '#2a2028' },
  acendedor: { name: 'Acendedor Oco', w: 10, h: 24, hp: 100, dmg: 20, xp: 34, kb: 0.5, fly: false, blood: '#3a3226' },
  maofundo: { name: 'Mão do Fundo', w: 14, h: 14, hp: 140, dmg: 24, xp: 40, kb: 0, fly: true, sombra: true, blood: '#2a2c34' }
});
const ESC2_TYPES = ['rastro', 'mortalha', 'ouvinte', 'acendedor', 'maofundo'];
const ESC2_DROPS = {
  rastro: [['po_breu', 0.45, 1, 2], ['tocha', 0.15], ['pocao', 0.07]],
  mortalha: [['po_breu', 0.5, 1, 2], ['pocao', 0.07]],
  ouvinte: [['carvao', 0.4, 1, 3], ['tocha', 0.2, 1, 2], ['pocao', 0.1]],
  acendedor: [['lume_fatuo', 0.35], ['tocha', 0.25, 1, 2], ['carvao', 0.3, 1, 2], ['pocao', 0.08]],
  maofundo: [['min_noctirio', 0.3, 1, 2], ['po_breu', 0.3], ['pocao', 0.1]]
};
function esc2Tables() { for (const k of ESC2_TYPES) DROPS[k] = ESC2_DROPS[k].filter(([id]) => ITEMS[id]); if (typeof esBaseDrops === 'function') esBaseDrops(); }
esc2Tables();
Object.assign(NAV_WALKERS, { ouvinte: 1, acendedor: 1 });
Object.assign(CV_STEP, { rastro: 1, ouvinte: 1, acendedor: 1 });
let esWrapT = 0, esWrapBy = null;   // the shroud round the hero (223 draws the dark)
const escCold = [];                 // pools of cold fire: { x, y, t, max }

/* ================= art ================= */
const ESCB = {};
{
const { cp, set } = CVB;
const cg = CVART.cg, RB = ESCA.RB, rim = ESCA.rim, limb = ESCA.limb;
const R7 = hexes => hexes.map(h => ph(h));
const RC = {
  pano: R7(['#030304', '#07060a', '#0c0a12', '#13101c', '#1c1828', '#282236', '#363048']),
  pele: R7(['#1a1416', '#2a2024', '#3c2e32', '#504046', '#665660', '#7e6c76', '#988690']),     // the listener's grey skin
  manto: R7(['#120e0a', '#1e1810', '#2c2418', '#3a3022', '#4a3e2e', '#5c4e3a', '#706048']),   // the kindler's robe, burnt brown
  ferro: R7(['#050608', '#0c0d10', '#16181c', '#22252a', '#30343a', '#42474e', '#5a6068']),
  lume: R7(['#1c2a44', '#2c4a78', '#4a74b0', '#7aa2dc', '#b4ceff', '#d4e2ff', '#e6f0ff']),
  osso: R7(['#3a3c44', '#5a5e6a', '#7e8494', '#a4aabb', '#c8ceda', '#dfe4ee', '#f2f5fa'])
};
/* the trail, 18 x 22 facing right: 0-1 flat (a smear on the floor), 2 rising (half up), 3 up (a bent shape, arms out), 4 lunge */
function trail(k) {
  const P = cp(18, 22), s = 22501 + k * 3;
  if (k < 2) { for (let x = 0; x < 18; x++) { const h = Math.round((1 - Math.abs(x - 9 + (k ? 1 : -1)) / 9.5) * 2.4); for (let y = 0; y < h; y++) P.put(x, 21 - y, RB.sh, 1.4 + y * 0.4); } return set(P.done()); }
  const up = k === 2 ? 0.55 : 1, lean = k === 4 ? 3 : 0;
  for (let y = Math.round(22 - 20 * up); y < 22; y++) { const t = (y - (22 - 20 * up)) / (20 * up), hw = 2.6 + t * 2.4; for (let x = Math.floor(9 - hw + lean * (1 - t)); x <= 9 + hw + lean * (1 - t); x++) P.put(x, y, RB.sh, 2 - (x - 9) / hw * 0.6 + cg(x, y, s) * 0.4); }
  const hy = 22 - 20 * up + 2; P.blob(10 + lean, hy, 2.6, 2.4, RB.sh, s + 1, 2.4);
  limb(P, 9 + lean, hy + 4, 3, hy + 9, 0.8, 0.6, RB.sh, 1.6, s + 2); limb(P, 10 + lean, hy + 4, 17, hy + (k === 4 ? 4 : 8), 0.9, 0.7, RB.sh, 2.2, s + 3);
  rim(P);
  return set(P.done());
}
/* the shroud, 26 x 16: 0-3 a cloth rippling, 4 the tell (edges lit) */
function shroud(k) {
  const P = cp(26, 16), s = 22521 + k * 2, ph0 = k * 1.57, tell = k === 4;
  for (let x = 0; x < 26; x++) { const top = 4 + Math.sin(x * 0.35 + ph0) * 2.2, bot = 11 + Math.sin(x * 0.28 + ph0 + 1.4) * 3 + (x % 5 === 0 ? 2 : 0); for (let y = Math.floor(top); y <= bot; y++) P.put(x, y, RC.pano, 2.4 - (y - top) / (bot - top) * 1.2 + Math.sin(x * 0.9 + y * 0.4) * 0.5 + cg(x, y, s) * 0.3); }
  rim(P, tell ? 0 : -2);
  return set(P.done());
}
/* the listener, 22 x 30 facing right: 0-3 walk, 4 listening (head tilted, still), 5 the scream (head thrown up, mouth wide) */
function listener(k) {
  const P = cp(22, 30), s = 22541 + k * 4, walk = k < 4 ? [0, 1, 0, -1][k] : 0, scream = k === 5;
  limb(P, 10, 19, 9 - walk * 2, 29, 1.3, 1.1, RC.pele, 1.6, s); limb(P, 12, 19, 13 + walk * 2, 29, 1.3, 1.1, RC.pele, 2.2, s + 1);
  for (let y = 9; y < 20; y++) { const hw = 3.2 - Math.abs(y - 13) * 0.08; for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) P.put(x, y, RC.pele, 2.6 - (x - 11) / hw * 0.8 + (y % 3 === 0 ? -0.8 : 0) + cg(x, y, s + 2) * 0.4); }   // the ribbed body
  const hx = scream ? 12.5 : k === 4 ? 13 : 12, hy = scream ? 3.4 : 5;
  P.blob(hx, hy, 3.4, 3.8, RC.pele, s + 3, 2.8);   // the head: no eyes, a swollen brow
  P.blob(hx - 2.6, hy + 0.4, 1.4, 2.2, RC.pele, s + 4, 3.6);   // the great ear
  P.put(hx - 2.4, hy + 0.4, RC.pele, 0.4);
  if (scream) { P.blob(hx + 2, hy + 1.8, 1.4, 2, RB.sh, s + 5, 0.2); } else { P.put(hx + 2.4, hy + 2, RC.pele, 1); P.put(hx + 3, hy + 2, RC.pele, 1.2); }
  const fa = scream ? [[8, 11], [5, 6]] : [[8, 11], [7 - walk, 20]]; limb(P, fa[0][0], fa[0][1], fa[1][0], fa[1][1], 1, 0.8, RC.pele, 1.4, s + 6);
  const na = scream ? [[14, 11], [18, 7]] : k === 4 ? [[14, 11], [16, 6]] : [[14, 11], [15 + walk, 20]]; limb(P, na[0][0], na[0][1], na[1][0], na[1][1], 1, 0.8, RC.pele, 2.6, s + 7);
  return set(P.done());
}
/* the hollow kindler, 22 x 30 facing right: 0-3 walk (the lantern held up in front), 4 wind (the lantern swung back over the
   shoulder), 5 throw (arm out, the lantern's glass empty for a moment). The flame is drawn live (cold blue) */
function kindler(k) {
  const P = cp(22, 30), s = 22561 + k * 4, walk = k < 4 ? [0, 1, 0, -1][k] : 0;
  limb(P, 10, 19, 9 - walk, 29, 1.2, 1, RC.manto, 1.6, s); limb(P, 12, 19, 13 + walk, 29, 1.2, 1, RC.manto, 2, s + 1);
  for (let y = 8; y < 26; y++) { const hw = 2.8 + (y - 8) * 0.12; for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) P.put(x, y, RC.manto, 2.6 - (x - 11) / hw * 0.9 + ((x + y * 2) % 6 === 0 ? -0.8 : 0) + cg(x, y, s + 2) * 0.4); }   // the robe, ragged
  for (let x = 6; x < 17; x++) if (hash2(x, k, s) < 0.5) P.put(x, 26, RC.manto, 1.4);
  P.blob(11.5, 5, 3, 3.4, RC.manto, s + 3, 2.4);   // the hood
  for (let y = 4; y < 8; y++) for (let x = 12; x < 15; x++) P.put(x, y, RB.sh, 0.4);   // nothing inside it
  limb(P, 9, 10, 7 - walk, 18, 0.9, 0.8, RC.manto, 1.4, s + 4);
  const L = k === 4 ? [12, 9, 6, 2] : k === 5 ? [13, 10, 20, 8] : [13, 10, 17, 13];
  limb(P, L[0], L[1], L[2], L[3], 1, 0.9, RC.manto, 2.6, s + 5);
  // the lantern at the hand: an iron cage, the glass lit cold (empty just after the throw)
  const lx = Math.round(L[2]) - 2, ly = Math.round(L[3]) + 1;
  for (let y = ly; y < ly + 6; y++) for (let x = lx; x < lx + 4; x++) { const edge = x === lx || x === lx + 3 || y === ly || y === ly + 5; P.put(x, y, edge ? RC.ferro : k === 5 ? RB.sh : RC.lume, edge ? 3.4 : k === 5 ? 0.6 : 4.6 - (y - ly) * 0.3); }
  ESCB.lantern = ESCB.lantern || []; ESCB.lantern[k] = [lx + 2, ly + 3];
  return set(P.done());
}
/* the hand from below, 20 x 20: 0 the fingers on the edge (curled), 1 scratching (spread), 2 the grab (the whole hand up, fingers closing) */
function hand(k) {
  const P = cp(20, 20), s = 22581 + k * 3, O = RC.osso;
  const y0 = k === 2 ? 6 : 12;
  for (let y = y0 + 4; y < 20; y++) for (let x = 6; x < 14; x++) P.put(x, y, O, 2.6 - (x - 6) * 0.15 + cg(x, y, s) * 0.4);   // the back of the hand
  for (let f = 0; f < 4; f++) { const fx = 6.5 + f * 2.2, len = k === 1 ? 7 : k === 2 ? 6 : 5, curl = k === 2 ? 2.2 : k === 0 ? 1.6 : 0.3; limb(P, fx, y0 + 4, fx + (f - 1.5) * (k === 1 ? 0.8 : 0.2), y0 + 4 - len, 0.8, 0.6, O, 3.2, s + f); limb(P, fx + (f - 1.5) * (k === 1 ? 0.8 : 0.2), y0 + 4 - len, fx + curl * (f < 2 ? 0.5 : 1), y0 + 4 - len + curl, 0.6, 0.5, O, 3.8, s + 9 + f); }
  limb(P, 14, y0 + 8, 17, y0 + 4, 0.9, 0.7, O, 3, s + 20);   // the thumb
  rim(P, 0);
  return set(P.done());
}
ESCB.get = () => ESCB.ready || (ESCB.ready = {
  trail: [0, 1, 2, 3, 4].map(trail),
  shroud: [0, 1, 2, 3, 4].map(shroud),
  listener: [0, 1, 2, 3, 4, 5].map(listener),
  kindler: [0, 1, 2, 3, 4, 5].map(kindler),
  hand: [0, 1, 2].map(hand)
});
ESCB.GL = { flame: glow(14, '#7aa2dc'), pool: glow(22, '#4a74b0') };
}

/* ================= drawing ================= */
const esc2Walk = e => Math.floor(e.t * 6) % 4;
DRAW_E.rastro = (e, fx, fy, fl) => { const S = ESCB.get().trail, k = e.flat ? Math.floor(e.t * 5) % 2 : e.state === 'rise' ? 2 : e.state === 'lunge' ? 4 : 3; lc.drawImage(cvPick(S[k], e, fl && !e.flat), fx - 9, fy - 21); };
EYES_E.rastro = (e, fx, fy) => { if (e.flat) { lc.globalAlpha = 0.3; lc.fillStyle = ES_COR.EYE; lc.fillRect(fx + e.facing * 3, fy - 1, 1, 1); return; } const y = e.state === 'rise' ? fy - 10 : fy - 18; lc.globalAlpha = 0.9; lc.fillStyle = ES_COR.EYE; lc.fillRect(fx + e.facing * 1, y, 1, 1); lc.fillRect(fx + e.facing * 3, y, 1, 1); if (e.state === 'rise') { lc.globalAlpha = 0.5; lc.drawImage(ESCA.GL.eye, fx + e.facing * 2 - 3, y - 2); } };
WARN_E.rastro = e => e.state === 'rise';
DRAW_E.mortalha = (e, fx, fy, fl) => { const S = ESCB.get().shroud, k = e.state === 'tell' ? 4 : Math.floor(e.t * 5 + e.seed) % 4; lc.drawImage(cvPick(S[k], e, fl), fx - 13, fy - 13); };
EYES_E.mortalha = (e, fx, fy) => { if (e.state !== 'tell') return; lc.globalAlpha = 0.5 + 0.4 * clamp(1 - e.stateT / 0.7, 0, 1); lc.drawImage(ESCA.GL.big, fx - 6, fy - 11); };
WARN_E.mortalha = e => e.state === 'tell';
DRAW_E.ouvinte = (e, fx, fy, fl) => { const S = ESCB.get().listener, k = e.state === 'scream' ? 5 : e.state === 'listen' ? 4 : Math.abs(e.vx) > 4 ? esc2Walk(e) : 4; lc.drawImage(cvPick(S[k], e, fl), fx - 11, fy - 29); };
EYES_E.ouvinte = () => { };
WARN_E.ouvinte = e => e.state === 'scream';
DRAW_E.acendedor = (e, fx, fy, fl) => { const S = ESCB.get().kindler, k = e.state === 'wind' ? 4 : e.state === 'throw' ? 5 : Math.abs(e.vx) > 4 ? esc2Walk(e) : 0; e.lantK = k; lc.drawImage(cvPick(S[k], e, fl), fx - 11, fy - 29); };
const escLantern = e => { const k = e.lantK || 0, L = (ESCB.lantern || [])[k] || [17, 16]; return [e.x + e.w / 2 + (e.facing > 0 ? L[0] - 11 : 11 - L[0]), e.y + e.h - 29 + L[1]]; };
EYES_E.acendedor = (e, fx, fy) => {   // the cold flame in the lantern, over the dark
  if (e.state === 'throw') return;
  const [x, y] = escLantern(e), X = Math.round(x - (e.x + e.w / 2) + fx), Y = Math.round(y - (e.y + e.h) + fy), f = Math.floor(gameTime * 9 + e.seed) % 3;
  lc.globalAlpha = 0.45; lc.drawImage(ESCB.GL.flame, X - 14, Y - 14);
  lc.globalAlpha = 1; lc.fillStyle = '#7aa2dc'; lc.fillRect(X - 1, Y - 1 - (f === 1 ? 1 : 0), 2, 3); lc.fillStyle = '#e6f0ff'; lc.fillRect(X, Y, 1, 1);
};
WARN_E.acendedor = e => e.state === 'wind';
DRAW_E.maofundo = (e, fx, fy, fl) => { if (e.state === 'hidden') return; const S = ESCB.get().hand, k = e.state === 'grab' ? 2 : e.state === 'scratch' ? 1 : 0; lc.drawImage(cvPick(S[k], e, fl), fx - 10, fy - 17); };
EYES_E.maofundo = () => { };
WARN_E.maofundo = e => e.state === 'scratch';

/* ================= behaviour ================= */
/* ---------- the trail ---------- */
AI.rastro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, lit = (e.esL || 0) > 0.6;
  if (lit && e.flat) { e.flat = false; e.state = 'exposed'; e.stateT = 1.2; sfx.escChiado(); }   // the light drags it up
  if (e.state === 'rise') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'lunge'; e.stateT = 0.3; e.vx = e.facing * 220; e.hitDone = false; sfx.escGarra(); } return; }
  if (e.state === 'lunge') {
    if (!e.hitDone && !pl.dead && overlap({ x: e.x - 4, y: e.y, w: e.w + 8, h: e.h }, pl)) { e.hitDone = true; hurtPlayer(e.dmg, ecx, e, false); }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { e.state = 'exposed'; e.stateT = 1.0; }
    return;
  }
  if (e.state === 'exposed') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0 && !lit) { e.state = 'slide'; e.flat = true; e.atkCD = 1.2 + Math.random(); } return; }
  e.state = 'slide'; e.flat = true;
  let dir = 0;
  if (aggro) { const nav = !e.sees && e.nav && e.nav.kind !== 'here' ? e.nav : null; dir = nav ? nav.dir : Math.abs(dx) > 6 ? Math.sign(dx) : 0; }
  else { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 1.5 + Math.random() * 2; } dir = e.wander; }
  if (dir && e.onGround && ledgeAhead(e, dir, dy, aggro) !== 0) dir = 0;
  if (dir) e.facing = dir;
  e.vx = approach(e.vx, dir * (88 + e.lvl), 400 * dt);
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 40 && Math.abs(dy) < 20 && e.onGround) { e.state = 'rise'; e.stateT = 0.5; e.flat = false; e.facing = Math.sign(dx) || e.facing; e.vx = 0; sfx.escChiado(); }
};
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && e.type === 'rastro' && e.flat) { burst(e.x + e.w / 2, e.y + e.h - 2, 4, '#0a0a12', 30, 0, 0.3); return; }   // flat: the blade goes through a shadow
  if (e && !e.dead && e.type === 'mortalha' && esWrapBy === e) { esWrapT = 0; esWrapBy = null; e.state = 'flee'; e.stateT = 1.4; e.atkCD = 3; }   // a blow and it lets go
  return _hit(e, dir, mult, melee);
}; }

/* ---------- the shroud ---------- */
AI.mortalha = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'wrap') {
    if (pl.dead || esWrapBy !== e) { e.state = 'flee'; e.stateT = 1.2; return; }
    e.x = pl.x + pl.w / 2 - e.w / 2; e.y = pl.y + 2; e.vx = e.vy = 0;
    e.tick = (e.tick || 0) - dt; if (e.tick <= 0) { e.tick = 0.5; const inv = pl.invuln; pl.invuln = 0; hurtPlayer(Math.max(1, Math.round(e.dmg * 0.45)), ecx, null, true); pl.invuln = Math.min(pl.invuln, 0.2); }
    if ((esWrapT -= dt) <= 0) { esWrapT = 0; esWrapBy = null; e.state = 'flee'; e.stateT = 1.2; e.atkCD = 3; }
    return;
  }
  if (e.state === 'tell') { drag(0.02); e.vy = 0; if (e.stateT <= 0) { e.state = 'drop'; e.stateT = 0.6; e.vy = 230; e.vx = 0; sfx.escPano(1); } return; }
  if (e.state === 'drop') {
    if (!pl.dead && overlap(e, pl) && !esWrapBy && pl.invuln <= 0) { const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { e.state = 'wrap'; esWrapBy = e; esWrapT = 2; e.tick = 0.5; sfx.escPano(1.4); return; } }
    if (e.stateT <= 0 || e.hitCeil || (e.vy === 0 && e.stateT < 0.5)) { e.state = 'flee'; e.stateT = 1.0; e.atkCD = 2.4; }
    return;
  }
  if (e.state === 'flee') { e.vy = approach(e.vy, -70, 300 * dt); drag(0.5); if (e.stateT <= 0) e.state = 'glide'; return; }
  e.state = 'glide';
  // long arcs: a wide swaying approach, then settling over the hero
  let tx, ty;
  if (aggro) { tx = pl.x + pl.w / 2 + Math.sin(e.t * 0.6 + e.seed) * 90; ty = pl.y - 48 + Math.sin(e.t * 1.1 + e.seed) * 18; if (e.atkCD <= 0.6) tx = pl.x + pl.w / 2; }
  else { tx = ecx + Math.sin(e.t * 0.35 + e.seed) * 60; ty = ecy + Math.cos(e.t * 0.5 + e.seed) * 20; }
  const ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1;
  e.vx += ux / d * 120 * dt; e.vy += uy / d * 120 * dt; drag(0.5);
  if (Math.abs(e.vx) > 3) e.facing = Math.sign(e.vx);
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 12 && dy > 20 && dy < 70 && losClear(ecx, ecy, pl.x + pl.w / 2, pl.y)) { e.state = 'tell'; e.stateT = 0.7; sfx.escPano(0.5); }
};

/* ---------- the listener ---------- */
// how much noise the hero makes right now (0 standing still or crouched)
function escNoise() {
  if (pl.dead) return 0;
  const crouching = typeof crouch !== 'undefined' && crouch.k > 0.5;
  if (pl.atkT >= 0) return 1;
  if (pl.mining) return 1;
  if (!pl.onGround && pl.vy < -60) return 0.8;
  if (crouching) return 0;
  if (Math.abs(pl.vx) > 70) return 0.7;
  if (Math.abs(pl.vx) > 20) return 0.35;
  return 0;
}
AI.ouvinte = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, n = escNoise();
  if (n > 0 && dist < 180 * n + 30) { e.heardX = pl.x + pl.w / 2; e.heardY = pl.y + pl.h; e.heardT = 3; } else e.heardT = (e.heardT || 0) - dt;
  if (e.state === 'scream') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) {
      e.state = 'listen'; e.atkCD = 2.4 + Math.random();
      const rdx = pl.x + pl.w / 2 - ecx, rdy = pl.y + pl.h / 2 - (e.y + 6);
      if (!pl.dead && Math.sign(rdx) === e.facing && Math.abs(rdx) < 80 && Math.abs(rdy) < 34) { const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx = e.facing * 280; pl.vy = -120; pl.stunT = Math.max(pl.stunT || 0, 0.8); } }
      escRings.push({ x: ecx + e.facing * 4, y: e.y + 4, dir: e.facing, t: 0, big: true });
      sfx.escGrito();
    }
    return;
  }
  e.state = 'walk';
  if (e.heardT > 0) {
    const hx = e.heardX - ecx;
    if (e.atkCD <= 0 && Math.abs(hx) < 54 && Math.abs(e.heardY - (e.y + e.h)) < 28) { e.state = 'scream'; e.stateT = 0.6; e.facing = Math.sign(hx) || e.facing; for (let k = 0; k < 3; k++) escRings.push({ x: ecx + e.facing * 3, y: e.y + 4, dir: e.facing, t: -k * 0.18, big: false }); return; }
    escWalk(e, dt, Math.abs(hx) > 8 ? Math.sign(hx) : 0, 36 + e.lvl * 0.5, 180, e.heardY - (e.y + e.h), true);
    if (Math.abs(hx) <= 8) e.state = 'listen';
  } else { e.state = 'listen'; e.vx = approach(e.vx, 0, 300 * dt); }
};
const escRings = [];   // the scream's pale rings: { x, y, dir, t, big }

/* ---------- the hollow kindler ---------- */
const escFlames = [];  // thrown cold flames: { x, y, vx, vy, t, dmg, src }
AI.acendedor = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') {
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) {
      e.state = 'throw'; e.stateT = 0.4;
      const [lx, ly] = escLantern(e), tx = pl.x + pl.w / 2, ty = pl.y + pl.h - 4, ft = clamp(Math.abs(tx - lx) / 120, 0.5, 1.2);
      escFlames.push({ x: lx, y: ly, vx: (tx - lx) / ft, vy: (ty - ly) / ft - 0.5 * GRAV * 0.55 * ft, t: 0, dmg: e.dmg, src: e });
      sfx.escLanca();
    }
    return;
  }
  if (e.state === 'throw') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.6 + Math.random() * 1.4; } return; }
  e.state = 'walk';
  if (aggro && e.sees && e.atkCD <= 0 && dist < 150 && dist > 30) { e.state = 'wind'; e.stateT = 0.7; e.facing = Math.sign(dx) || e.facing; sfx.escSopro(0.4); return; }
  // it keeps near the lit braziers (within 20 blocks), walking slow round them; with nothing lit, it wanders
  if ((e.retarget = (e.retarget || 0) - dt) <= 0) { e.retarget = 2; e.home = null; let bd = 400; for (const k of esLit) { const x = k % WW, y = (k / WW) | 0, d = Math.hypot(wdx(x - Math.floor(ecx / T)), y - Math.floor(e.y / T)); if (d < 20 && d < bd) { bd = d; e.home = [x, y]; } } }
  let dir = 0;
  if (aggro && dist > 70) dir = Math.sign(dx);
  else if (e.home) { const hx = wdx(e.home[0] - Math.floor(ecx / T)) * T; e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 2; } dir = Math.abs(hx) > 5 * T ? Math.sign(hx) : e.wander; }
  else { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } dir = e.wander; }
  escWalk(e, dt, dir, 20 + e.lvl * 0.3, 120, dy, aggro);
};

/* ---------- the hand from below ---------- */
// the pit a hand lives in, and the rim row (the first solid tile beside it)
function escPitRim(P) { const x = P.x0 - 1; let y = P.top - 8; while (y < P.bot && !solidAt(x, y)) y++; return y; }
AI.maofundo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const P = e.pit; if (!P) { e.dead = true; return; }
  const cx = (P.x0 + P.w / 2) * T, rimY = e.rimY;
  e.vx = 0; e.vy = 0;
  const hidden = rimY * T + 10, shown = rimY * T - 8;
  const near = !pl.dead && Math.abs(wdx(Math.floor((pl.x + pl.w / 2) / T) - Math.floor(cx / T))) * T < P.w * T / 2 + 22 && pl.y + pl.h > rimY * T - 30 && pl.y < rimY * T + 60;
  if (e.state === 'scratch') {
    e.y = approach(e.y, shown, 60 * dt); e.x = cx - e.w / 2 + Math.sin(e.t * 20) * 1.5;
    if (Math.random() < dt * 10) parts.push({ x: cx + rnd(-8, 8), y: rimY * T, vx: rnd(-10, 10), vy: rnd(-30, -10), g: 300, life: 0.4, max: 0.4, col: '#1e2232', size: 1 });
    if (e.stateT <= 0) {
      e.state = 'grab'; e.stateT = 0.5; e.hitDone = false; sfx.escAgarra();
      if (near && !pl.dead) { const r = hurtPlayer(e.dmg, cx, e, false); if (r === 'hit') { pl.vy = 340; pl.vx = (cx - (pl.x + pl.w / 2)) * 3; pl.onGround = false; pl.stunT = Math.max(pl.stunT || 0, 0.5); e.hitDone = true; } }
    }
    return;
  }
  if (e.state === 'grab') { e.y = approach(e.y, shown - 6, 80 * dt); if (e.stateT <= 0) { e.state = 'hidden'; e.atkCD = 3 + Math.random() * 2; } return; }
  e.state = 'hidden'; e.y = approach(e.y, hidden, 80 * dt); e.x = cx - e.w / 2;
  if (near && e.atkCD <= 0) { e.state = 'scratch'; e.stateT = 0.8; sfx.escArranha(); }
};
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && e.type === 'maofundo' && e.state === 'hidden') return;   // down in the pit: out of reach
  return _hit(e, dir, mult, melee);
}; }

/* ---------- spawns, deaths ---------- */
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !ESC2_TYPES.includes(type)) return e;
  e.atkCD = 0.8 + Math.random();
  if (type === 'maofundo') {   // it lives in the nearest bottomless pit (within 40 blocks), else nowhere
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    let best = null, bd = 40; for (const P of typeof esPits !== 'undefined' ? esPits : []) { const d = Math.hypot(wdx(P.x0 - tx), P.top - ty); if (d < bd) { bd = d; best = P; } }
    if (!best || enemies.some(o => o !== e && o.type === 'maofundo' && o.pit === best)) { e.dead = true; e.hp = 0; e.esVoid = true; return e; }
    e.pit = best; e.rimY = escPitRim(best); e.state = 'hidden'; e.x = (best.x0 + best.w / 2) * T - e.w / 2; e.y = e.rimY * T + 10;
    return e;
  }
  for (let k = 0; k < 4 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.state = type === 'mortalha' ? 'glide' : type === 'rastro' ? 'slide' : type === 'ouvinte' ? 'listen' : 'walk';
  if (type === 'rastro') e.flat = true;
  return e;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (esWrapBy === e) { esWrapBy = null; esWrapT = 0; }
  const r = _k(e);
  if (ESC2_TYPES.includes(e.type)) { const cx = e.x + e.w / 2, cy = e.y + e.h / 2; for (let k = 0; k < 14; k++) parts.push({ x: cx + rnd(-e.w / 2, e.w / 2), y: cy + rnd(-e.h / 2, e.h / 2), vx: rnd(-14, 14), vy: rnd(-40, -10), g: -8, life: 1.1, max: 1.1, col: e.type === 'acendedor' ? (k % 2 ? '#7aa2dc' : '#2a2420') : k % 3 ? '#0a0a12' : '#2c344c', size: 1, smoke: e.type !== 'acendedor', glow: e.type === 'acendedor' && k % 2 === 1 }); }
  return r;
}; }

/* ---------- the flames, the pools, the rings, the spikes ---------- */
let escSpikeT = 0;
HOOK.update.push(dt => {
  if (esWrapBy && (esWrapBy.dead || pl.dead)) { esWrapBy = null; esWrapT = 0; }
  for (let i = escFlames.length - 1; i >= 0; i--) {
    const f = escFlames[i]; f.t += dt; f.vy += GRAV * 0.55 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    if (Math.random() < dt * 30) parts.push({ x: f.x + rnd(-2, 2), y: f.y + rnd(-2, 2), vx: rnd(-6, 6), vy: rnd(-10, 4), g: -10, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#7aa2dc' : '#b4ceff', size: 1, glow: true });
    const hitPl = !pl.dead && f.x > pl.x - 2 && f.x < pl.x + pl.w + 2 && f.y > pl.y - 2 && f.y < pl.y + pl.h + 2;
    if (hitPl || f.t > 3 || solidAt(Math.floor(f.x / T), Math.floor((f.y + 2) / T))) {
      if (hitPl) hurtPlayer(f.dmg, f.x, f.src, true);
      let gy = Math.floor(f.y / T); for (let k = 0; k < 6 && !solidAt(Math.floor(f.x / T), gy + 1); k++) gy++;
      escCold.push({ x: f.x, y: (gy + 1) * T, t: 0, max: 4, tick: 0, dmg: f.dmg });
      burst(f.x, f.y, 14, '#7aa2dc', 70, 100, 0.5, 1, true); sfx.escPoca();
      escFlames.splice(i, 1);
    }
  }
  for (let i = escCold.length - 1; i >= 0; i--) {
    const c = escCold[i]; c.t += dt; c.tick -= dt;
    if (Math.random() < dt * 14) parts.push({ x: c.x + rnd(-12, 12), y: c.y - 1, vx: rnd(-4, 4), vy: rnd(-26, -10), g: -8, life: 0.6, max: 0.6, col: Math.random() < 0.6 ? '#4a74b0' : '#b4ceff', size: 1, glow: true });
    if (!pl.dead && c.tick <= 0 && Math.abs(pl.x + pl.w / 2 - c.x) < 16 && Math.abs(pl.y + pl.h - c.y) < 8) { c.tick = 0.5; hurtPlayer(Math.max(1, Math.round(c.dmg * 0.3)), c.x, null, true); }
    if (c.t >= c.max) escCold.splice(i, 1);
  }
  for (let i = escRings.length - 1; i >= 0; i--) { escRings[i].t += dt; if (escRings[i].t > 0.6) escRings.splice(i, 1); }
  // the black glass spikes at the bottom of the pits
  if ((escSpikeT -= dt) <= 0 && !pl.dead && ESCURO && inEscuro(Math.floor((pl.y + pl.h) / T))) {
    escSpikeT = 0.15;
    if (touchingTile(pl, ES_ESPINHO) && (pl.vy > 40 || pl.onGround) && pl.invuln <= 0) { rawDamage(Math.max(4, Math.round(pl.maxHp * 0.12)), Math.random() < 0.5 ? -1 : 1); pl.vy = -180; }
  }
});
// cold lights: the kindlers' lanterns and the pools (computeLight calls villageLights with its addL)
{ const _vl = villageLights; villageLights = function (add) {
  _vl(add);
  if (!ESCURO) return;
  for (const e of enemies) if (!e.dead && e.type === 'acendedor' && e.state !== 'throw') { const [x, y] = escLantern(e); add(x, y, 0.55); }
  for (const c of escCold) add(c.x, c.y - 6, 0.7 * (1 - Math.max(0, c.t - c.max + 1)));
  for (const f of escFlames) add(f.x, f.y, 0.6);
}; }
HOOK.drawGlow.push((cx, cy) => {
  for (const c of escCold) { lc.globalAlpha = 0.4 * Math.min(1, (c.max - c.t)); lc.drawImage(ESCB.GL.pool, Math.round(c.x - cx) - 22, Math.round(c.y - cy) - 26); }
  for (const f of escFlames) { lc.globalAlpha = 0.5; lc.drawImage(ESCB.GL.flame, Math.round(f.x - cx) - 14, Math.round(f.y - cy) - 14); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const f of escFlames) { const x = Math.round(f.x - cx), y = Math.round(f.y - cy); lc.fillStyle = '#4a74b0'; lc.fillRect(x - 2, y - 2, 4, 4); lc.fillStyle = '#b4ceff'; lc.fillRect(x - 1, y - 2, 2, 3); lc.fillStyle = '#e6f0ff'; lc.fillRect(x, y - 1, 1, 1); }
  for (const c of escCold) {
    const a = Math.min(1, c.max - c.t), X = Math.round(c.x - cx), Y = Math.round(c.y - cy);
    for (let k = -12; k <= 12; k++) { const h = Math.round((1 - Math.abs(k) / 13) * (3 + Math.abs(Math.sin(gameTime * 8 + k * 1.7)) * 4)); if (h < 1) continue; lc.globalAlpha = a; lc.fillStyle = '#2c4a78'; lc.fillRect(X + k, Y - h, 1, h); lc.fillStyle = '#7aa2dc'; lc.fillRect(X + k, Y - Math.round(h * 0.6), 1, Math.round(h * 0.6)); if (Math.abs(k) < 5) { lc.fillStyle = '#e6f0ff'; lc.fillRect(X + k, Y - 1, 1, 1); } }
  }
  for (const R of escRings) {
    if (R.t < 0) continue;
    const r = 4 + R.t * (R.big ? 120 : 40), a = (1 - R.t / 0.6) * (R.big ? 0.9 : 0.6), X = R.x - cx, Y = R.y - cy;
    lc.globalAlpha = a; lc.fillStyle = '#c8ceda';
    for (let i = -6; i <= 6; i++) { const t = i / 6 * 0.7; lc.fillRect(Math.round(X + R.dir * Math.cos(t) * r), Math.round(Y + Math.sin(t) * r), 1, 1); }
  }
  // the hand's fingers scratching at the edge: pale, over the dark
  for (const e of enemies) {
    if (e.dead || e.type !== 'maofundo' || e.state !== 'scratch') continue;
    const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.rimY * T - cy);
    lc.globalAlpha = 0.7; lc.fillStyle = '#c8ceda'; for (let f = 0; f < 4; f++) { const fx = x - 5 + f * 3 + Math.round(Math.sin(gameTime * 24 + f) * 1); lc.fillRect(fx, y - 2, 1, 3); lc.fillRect(fx + 1, y - 3, 1, 1); }
  }
  lc.globalAlpha = 1;
});
{ const _nw = newWorld; newWorld = function (sd, sv) { escFlames.length = 0; escCold.length = 0; escRings.length = 0; esWrapT = 0; esWrapBy = null; esc2Tables(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  escChiado() { noise(0.4, 0.05, 3400, 'highpass'); tone(300, 0.3, 'sine', 0.015, -200); },
  escPano(v = 1) { noise(0.4, 0.05 * v, 700, 'bandpass', 0, 0.8); noise(0.25, 0.03 * v, 1600, 'bandpass', 0.1, 1.2); },
  escGrito() { tone(620, 0.55, 'sawtooth', 0.05, -260); tone(930, 0.45, 'sawtooth', 0.025, -380, 0.03); noise(0.5, 0.06, 2400, 'bandpass', 0, 2); },
  escLanca() { noise(0.3, 0.06, 1200, 'bandpass', 0, 1); tone(420, 0.25, 'sine', 0.03, -200); },
  escPoca() { noise(0.4, 0.08, 1600, 'bandpass', 0, 0.8); tone(240, 0.3, 'triangle', 0.03, -120); },
  escArranha() { for (let k = 0; k < 6; k++) noise(0.05, 0.04, 2600 + Math.random() * 1200, 'bandpass', k * 0.11, 4); },
  escAgarra() { noise(0.2, 0.12, 500, 'lowpass'); tone(70, 0.3, 'square', 0.05, -30); }
});
