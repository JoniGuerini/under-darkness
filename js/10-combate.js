'use strict';

/* ================= effects ================= */
function burst(x, y, n, col, sp = 80, g = 400, life = 0.5, size = 1, glowy = false) {
  if (parts.length > 700) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = sp * (0.3 + Math.random() * 0.8); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - sp * 0.3, g, life: life * (0.6 + Math.random() * 0.6), max: life, col, size, glow: glowy }); }
}
function floatText(x, y, text, col = '#fff', size = 1) { texts.push({ x, y, text, col, size, life: 0.9, max: 0.9 }); }
function shake(m) { if (!REDUCED) shk.m = Math.max(shk.m, m); }
let lastSpark = 0;

/* ================= enemies ================= */
const ET = {
  // touching a monster does no harm by itself: damage comes from its attacks. A creature whose body hurts
  // (say, a fire elemental) gets `touch: k` and deals dmg*k when you brush it (see updateEnemies).
  slime: { name: 'Gosma', w: 11, h: 8, hp: 22, dmg: 9, xp: 6, kb: 1.0, fly: false },
  zombie: { name: 'Zumbi', w: 8, h: 21, hp: 50, dmg: 13, xp: 14, kb: 0.6, fly: false, blood: '#6a8f4a' },
  bat: { name: 'Morcego', w: 10, h: 7, hp: 15, dmg: 8, xp: 8, kb: 1.2, fly: true, blood: '#7a2a4a' },
  skeleton: { name: 'Esqueleto', w: 8, h: 21, hp: 72, dmg: 20, xp: 24, kb: 0.55, fly: false, blood: '#e8e0cc' },
  archer: { name: 'Esqueleto Arqueiro', w: 8, h: 21, hp: 48, dmg: 15, xp: 22, kb: 0.8, fly: false, blood: '#e8e0cc' },
  guard: { name: 'Guardião Esquelético', w: 8, h: 21, hp: 95, dmg: 22, xp: 34, kb: 0.35, fly: false, blood: '#e8e0cc' },
  ghost: { name: 'Espectro', w: 10, h: 13, hp: 40, dmg: 16, xp: 26, kb: 0.6, fly: true, blood: '#b8d8ec', phase: true },
  skull: { name: 'Caveira Flamejante', w: 9, h: 8, hp: 28, dmg: 18, xp: 20, kb: 1, fly: true, blood: '#ff8a2a' },
  lurker: { name: 'Espreitador', w: 12, h: 12, hp: 95, dmg: 22, xp: 42, kb: 0.4, fly: true, blood: '#7a3a9a' }
};
function spawnEnemy(type, px, py, zone) {
  const D = ET[type];
  let lvl = 1 + Math.floor(Math.max(0, py / T - SURF_BASE) / (CATEDRAL ? 40 : 20)) + (Math.random() < 0.3 ? 1 : 0);
  if (zone === 0 && isNight()) lvl += 1;
  const m = 1 + 0.3 * (lvl - 1);
  const e = {
    type, x: px, y: py, w: D.w, h: D.h, vx: 0, vy: 0, onGround: false, hitWall: false, hitCeil: false, facing: Math.random() < 0.5 ? 1 : -1,
    lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))),
    t: Math.random() * 10, flash: 0, showHp: 0, atkCD: 0.5, stun: 0, parried: 0, dead: false, seed: Math.random() * 100,
    hop: Math.random() * 1.5, wander: 0, wtimer: 0, retreat: 0, state: 'walk', stateT: 0, sAng: 0.9, arm: 2.7, swingHit: false, shoot: 1.5 + Math.random() * 2, charging: false,
    variant: clamp(zone, 0, 3)
  };
  enemies.push(e); return e;
}
function zoneAt(tx, ty) { const d = ty - surf[wrapX(tx)]; if (d < 8) return 0; if (CATEDRAL) return cathZone(tx, ty); if (ty < Z1) return 1; if (ty < Z2) return 2; return 3; }
const ZONE_NAMES = ['Superfície', 'Cavernas Rasas', 'Cavernas Profundas', 'Fundo das Cavernas', 'Fendas Antigas', 'Átrio Soterrado', 'Nave da Catedral', 'Claustro Profanado', 'Criptas'];
const ZONE_SUB = ['onde o sol ainda chega', 'escuro, úmido e cheio de ossos', 'o ar fica pesado', 'algo observa de volta', 'ninguém desce até aqui', 'a terra cede à pedra branca', 'os bancos ainda esperam os fiéis', 'as orações aqui azedaram', 'os mortos não ficaram deitados'];
function lavaIn(x, y, w, h) { const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T); for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === LAVA) return true; return false; }
function trySpawn() {
  if (bossFight) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  const zone = zoneAt(ptx, pty), night = isNight();
  let table, max;
  // the undead: zombies and the odd spectre at night up top, skeleton archers from the shallow caves, guards, spectres and burning skulls deeper down
  // the surface is the one safe place: nothing spawns under the open sky
  if (zone === 0) return;
  if (zone === 1) { table = [['slime', 0.25], ['bat', 0.3], ['skeleton', 0.25], ['archer', 0.2]]; max = 8; }
  else if (zone === 2) { table = [['bat', 0.18], ['skeleton', 0.2], ['archer', 0.15], ['guard', 0.14], ['ghost', 0.12], ['slime', 0.08], ['lurker', 0.13]]; max = 9; }
  else if (zone === 3) { table = [['skeleton', 0.18], ['guard', 0.18], ['archer', 0.12], ['ghost', 0.15], ['skull', 0.15], ['lurker', 0.14], ['bat', 0.08]]; max = 10; }
  else { [table, max] = CATH_SPAWN[zone]; table = table.filter(([t]) => ET[t] && AI[t]); if (!table.length) return; }
  if (enemies.length >= max) return;
  // pesos inteiros ou frações: sorteia na soma (as camadas fundas usam 4, 3, 2...)
  let r = Math.random() * table.reduce((a, q) => a + q[1], 0), type = table[0][0]; for (const [t, w] of table) { if (r < w) { type = t; break; } r -= w; }
  const D = ET[type], halfW = Math.ceil(VW / 2 / T);
  for (let a = 0; a < 24; a++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const tx = ptx + side * (halfW + 2 + Math.floor(Math.random() * 7));
    const ty0 = pty + Math.floor((Math.random() - 0.5) * (zone === 0 ? 14 : 20));
    if (D.fly) {
      if (ty0 < 2 || ty0 >= WH - 5) continue;
      const px = tx * T, py = ty0 * T;
      if (!rectSolid(px, py, D.w, D.h) && !lavaIn(px, py, D.w, D.h) && (zone > 0 ? wallAt(tx, ty0) > 0 : wallAt(tx, ty0) === 0)) { spawnEnemy(type, px, py, zone); return; }
    } else {
      for (let ty = ty0 - 6; ty < ty0 + 9; ty++) {
        if (ty < 2 || ty >= WH - 4) continue;
        const px = tx * T, py = (ty + 1) * T - D.h;
        if (solidAt(tx, ty + 1) && !rectSolid(px, py, D.w, D.h) && !lavaIn(px, py, D.w, D.h + 1)) {
          if ((zone > 0) !== (wallAt(tx, ty) > 0)) break;
          spawnEnemy(type, px, py, zone); return;
        }
      }
    }
  }
}

/* ================= physics ================= */
function touchingTile(e, t) { const x0 = Math.floor((e.x + 1) / T), x1 = Math.floor((e.x + e.w - 1) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 1) / T); for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === t) return true; return false; }
function rectSolid(x, y, w, h) { const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T); for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) return true; return false; }
function moveEntity(e, dt, step) {
  e.hitWall = false; e.hitCeil = false;
  const dx = e.vx * dt, nx = Math.max(1, Math.ceil(Math.abs(dx) / 4)), sx = dx / nx;
  for (let i = 0; i < nx; i++) {
    e.x += sx;
    if (rectSolid(e.x, e.y, e.w, e.h)) {
      let stepped = false;
      if (step && e.onGround) for (let lift = 1; lift <= T; lift++) { if (!rectSolid(e.x, e.y - lift, e.w, e.h)) { e.y -= lift; stepped = true; break; } }
      if (!stepped) { if (sx > 0) e.x = Math.floor((e.x + e.w) / T) * T - e.w; else e.x = Math.floor(e.x / T) * T + T; e.vx = 0; e.hitWall = true; break; }
    }
  }
  const dy = e.vy * dt, ny = Math.max(1, Math.ceil(Math.abs(dy) / 4)), sy = dy / ny;
  e.onGround = false;
  for (let i = 0; i < ny; i++) {
    e.y += sy;
    if (rectSolid(e.x, e.y, e.w, e.h)) { if (sy > 0) { e.y = Math.floor((e.y + e.h) / T) * T - e.h; e.onGround = true; } else { e.y = Math.floor(e.y / T) * T + T; e.hitCeil = true; } e.vy = 0; break; }
  }
}

/* ================= combat ================= */
const ATK_WIND = 0.06, ATK_SWING = 0.11, ATK_TOTAL = 0.31;
function swordAngle(t, type, start) {
  const wind = type === 0 ? -1.95 : 2.95, end = type === 0 ? 2.5 : -1.75;
  if (t < ATK_WIND) return lerp(start, wind, t / ATK_WIND);
  if (t < ATK_WIND + ATK_SWING) return lerp(wind, end, easeOut((t - ATK_WIND) / ATK_SWING));
  return end;
}
function hitEnemy(e, dir, mult = 1, melee = false) {
  if (e.dead || (e.boss && e.state === 'intro')) return;
  e.memT = 4;   // whatever hurts it, it now hunts
  // a spectre that hasn't taken shape yet: the blade passes right through
  if (e.type === 'ghost' && e.vis < 0.5) { burst(e.x + e.w / 2, e.y + e.h / 2, 2, '#b8d8ec', 30, 0, 0.3, 1, true); return; }
  // a guard with its shield up, facing the blow: it glances off
  if (BLOCK_E[e.type] ? BLOCK_E[e.type](e, dir) : e.type === 'guard' && e.state === 'walk' && e.stun <= 0 && dir === -e.facing) {
    burst(e.x + e.w / 2 + e.facing * 6, e.y + 9, 8, '#ffd27a', 80, 120, 0.3, 1, true); floatText(e.x + e.w / 2, e.y - 4, 'BLOQUEADO', '#d9c7a3', 0.8);
    sfx.block(); shake(1); pl.vx -= dir * 60; e.vx = dir * 30; return;
  }
  let dmg = rollPlayerDmg() * mult; const crit = Math.random() < pl.crit; if (crit) { dmg *= 1 + (pl.critDmg || 0.75); onPlayerCrit(); }   // damage range: js/48-itemizacao + 49
  const punish = e.parried > 0; if (punish) dmg *= 1.5;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.1; e.showHp = 3.5;
  const D = ET[e.type];
  const poise = D.boss || (e.type === 'skeleton' && (e.state === 'wind' || e.state === 'swing')) || (e.type === 'guard' && (e.state === 'wind' || e.state === 'thrust'));
  // a blow only nudges it: a small step back and a little hop (heavier weapons and Empurrão add a bit, not a throw)
  const kbW = melee ? 1 + (pl.kb - 1) * 0.35 : 1;
  if (!poise) { e.vx = dir * 45 * D.kb * kbW; e.vy = D.fly ? -15 : -35 * D.kb; e.stun = Math.max(e.stun, 0.25); }
  else e.vx = dir * 10;
  if (melee) {
    if (pl.stunCh && !poise && !D.boss && Math.random() < pl.stunCh) e.stun = Math.max(e.stun, 0.9);   // maces
    if (pl.lifeSteal > 0 && !pl.dead && pl.hp < pl.maxHp) { pl.lsAcc += dmg * pl.lifeSteal; if (pl.lsAcc >= 1) { const h = Math.floor(pl.lsAcc); pl.lsAcc -= h; pl.hp = Math.min(pl.maxHp, pl.hp + h); if (h >= 2) floatText(pl.x + pl.w / 2, pl.y - 6, '+' + h, '#7dff8a', 0.7); } }
  }
  const col = D.blood || SLIME_BLOOD[e.variant];
  burst(e.x + e.w / 2, e.y + e.h / 2, 7, col, 90, 420, 0.5);
  floatText(e.x + e.w / 2, e.y - 4, crit ? dmg + '!' : String(dmg), crit ? '#ffd23f' : punish ? '#ffb070' : '#ffffff', crit ? 1.35 : 1);
  hitstop = Math.max(hitstop, crit ? 0.07 : 0.045); shake(crit ? 3.5 : 2.2); sfx.hit(crit);
  if (e.type === 'ghost') { e.state = 'fade'; e.stateT = 1.0; }
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; pl.kills++;
  const D = ET[e.type], col = D.blood || SLIME_BLOOD[e.variant];
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  burst(cx, cy, 22, col, 120, 380, 0.7, 1); burst(cx, cy, 8, '#ffffff', 60, 0, 0.3, 1, true);
  const xpv = Math.round(e.xp * (1 + pl.xpB));
  const n = clamp(Math.round(xpv / 4), 2, 12); const per = Math.floor(xpv / n); let rem = xpv;
  for (let i = 0; i < n; i++) { const v = i === n - 1 ? rem : per; rem -= v; if (v > 0) orbs.push({ x: cx, y: cy, vx: rnd(-70, 70), vy: rnd(-150, -60), v, t: 0 }); }
  floatText(cx, e.y - 12, `+${xpv} XP`, '#c8ff6a', 0.9);
  sfx.kill();
  rollDrops(e);
  if (pl.onKill > 0 && !pl.dead && pl.hp < pl.maxHp) { const h = Math.min(pl.onKill, pl.maxHp - pl.hp); pl.hp += h; floatText(pl.x + pl.w / 2, pl.y - 6, '+' + Math.round(h), '#7dff8a', 0.75); }
  if (e.boss) { burst(cx, cy, 60, '#2a0a14', 160, 200, 1.4); burst(cx, cy, 30, '#ff7a3a', 140, 60, 1, 1, true); shake(8); hitstop = Math.max(hitstop, 0.25); sfx.level(); endBossFight(true); }
}
const loot = [];
// soft = a mined block: it just hops out of its hole instead of flying
function dropGear(x, y, id, z) { loot.push({ x, y, vx: rnd(-45, 45), vy: rnd(-150, -85), id, n: 1, item: rollItem(id, z), t: 0, rest: false }); }
function dropLoot(x, y, id, n = 1, soft = false) { if (ITEMS[id] && n > 0) loot.push({ x, y, vx: soft ? rnd(-22, 22) : rnd(-45, 45), vy: soft ? rnd(-85, -45) : rnd(-150, -85), id, n, t: 0, rest: false }); }
// how generous monsters are, on top of each table: gear is rare, potions and torches uncommon, materials about half the time
// (bosses always pay out in full)
const DROP_RATE = { gear: 0.1, use: 0.4, mat: 0.5 };
function rollDrops(e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, lm = 1 + 0.1 * (e.lvl - 1);
  for (const [id, ch, a, b] of DROPS[e.type]) {
    const it = ITEMS[id], k = e.boss ? 1 : it.slot ? DROP_RATE.gear * lm : (it.use || id === 'tocha') ? DROP_RATE.use : DROP_RATE.mat;
    if (Math.random() >= ch * k) continue;
    if (it.slot) dropGear(cx, cy, id, lootZone(Math.floor(cx / T), Math.floor(cy / T)));
    else dropLoot(cx, cy, id, a ? a + Math.floor(Math.random() * ((b || a) - a + 1)) : 1);
  }
  if (e.type !== 'slime' && !e.boss && Math.random() < 0.06) dropLoot(cx, cy, 'tocha', 1);
  if (e.boss) dropLoot(cx, cy, 'ouro', 250 + Math.floor(Math.random() * 100));
  else if (Math.random() < 0.55) dropLoot(cx, cy, 'ouro', Math.max(1, Math.round((e.gold || e.xp) * rnd(0.5, 1))));
}
function pickupMsg(id, n, item) {
  const it = ITEMS[id];
  if (it.gold) { floatText(pl.x + pl.w / 2, pl.y - 10, `+${n} de ouro`, '#ffd27a', 0.75); sfx.coin(); return; }
  if (item) {
    const r = itemRar(item), nm = itemName(item);
    floatText(pl.x + pl.w / 2, pl.y - 10, '+' + nm, RAR_COL[r], 0.75);
    if (r >= 1) { toast(`Você encontrou: ${nm} (aperte I para ver)`, 'gold', RAR_COL[r]); sfx.rare(); } else sfx.pickup();
    return;
  }
  if (it.block) {
    sfx.pickup();
    if (!blockTip) { blockTip = true; const i = inv.findIndex(s => s && s.id === id); toast(i >= 0 && i < HB_BAG ? `Blocos minerados vão para a mochila. ${it.name} já está na barra: aperte ${(i + 3) % 10} e clique para colocar.` : 'Blocos minerados vão para a mochila. Arraste para a fileira de baixo do inventário (I) para usar pela barra.', 'gold'); }
    return;
  }
  floatText(pl.x + pl.w / 2, pl.y - 10, `+${n > 1 ? n + ' ' : ''}${it.name}`, RAR_COL[it.rar], 0.75);
  if (it.slot) { toast(`Você encontrou: ${it.name} (aperte I para ver)`, 'gold', RAR_COL[it.rar]); sfx.rare(); } else sfx.pickup();
}
const LOOT_HW = 4, LOOT_H = 8;
function lootHit(x, yb) { return rectSolid(x - LOOT_HW, yb - LOOT_H, LOOT_HW * 2, LOOT_H); }
// a drop stuck in rock (a block placed on it, a monster dying against a wall) moves to the nearest open tile:
// sideways first, then down, and up only as a last resort
function unstickLoot(o) {
  const tx = Math.floor(o.x / T), ty = Math.floor((o.y - 1) / T);
  let best = null, bc = 1e9;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) {
    const x = tx + dx, y = ty + dy; if (solidAt(x, y)) continue;
    const c = Math.abs(dx) + Math.abs(dy) * 1.5 + (dy < 0 ? 0.75 : 0);
    if (c < bc) { bc = c; best = [x, y]; }
  }
  if (best) { o.x = (best[0] + 0.5) * T; o.y = (best[1] + 1) * T - 0.01; o.vx = 0; o.vy = 0; }
}
function updateLoot(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  pl.fullMsg -= dt;
  for (let i = loot.length - 1; i >= 0; i--) {
    const o = loot[i]; o.t += dt;
    // anything that falls into lava is gone
    if (lavaIn(o.x - LOOT_HW, o.y - LOOT_H, LOOT_HW * 2, LOOT_H)) {
      burst(o.x, o.y - 4, 10, '#2a2226', 40, -60, 0.8); burst(o.x, o.y - 4, 6, '#ff8a2a', 60, -40, 0.4, 1, true); sfx.sizzle();
      if (o.item && itemRar(o.item) >= 1) floatText(o.x, o.y - 12, itemName(o.item) + ' derreteu', '#ff8a3a', 0.75);
      loot.splice(i, 1); continue;
    }
    const dx = pcx - o.x, dy = pcy - (o.y - 5), d = Math.hypot(dx, dy);
    const fits = !!ITEMS[o.id].gold || canFit(o.id);
    if (!pl.dead && o.t > 0.5 && d < 40 && fits) {
      const sp = 90 + (40 - d) * 6, k = Math.min(1, dt * 10); o.rest = false;
      o.vx = lerp(o.vx, dx / (d || 1) * sp, k); o.vy = lerp(o.vy, dy / (d || 1) * sp, k); o.x += o.vx * dt; o.y += o.vy * dt;
      if (d < 9) { const left = o.item ? (addInst(o.item) ? 0 : 1) : ITEMS[o.id].gold ? (pl.gold += o.n, 0) : addItem(o.id, o.n), got = o.n - left; if (got > 0) pickupMsg(o.id, got, o.item); if (left > 0) o.n = left; else { loot.splice(i, 1); continue; } }
    } else {
      if (!fits && d < 12 && pl.fullMsg <= 0 && !pl.dead) { pl.fullMsg = 2.5; floatText(pcx, pl.y - 10, 'Mochila cheia', '#ffb4a8', 0.8); }
      // a small 8x8 box that collides on both axes, so drops fit one-block gaps and never climb through rock
      if (lootHit(o.x, o.y)) unstickLoot(o);
      o.vy = Math.min(o.vy + GRAV * 0.8 * dt, 300); o.vx *= Math.pow(o.rest ? 0.02 : 0.08, dt);
      const nx = o.x + o.vx * dt;
      if (lootHit(nx, o.y)) o.vx = -o.vx * 0.3; else o.x = nx;
      const ny = o.y + o.vy * dt;
      if (!lootHit(o.x, ny)) { o.y = ny; o.rest = false; }
      else if (o.vy > 0) { const land = Math.floor(ny / T) * T - 0.01; if (!lootHit(o.x, land)) o.y = land; o.vy = 0; o.rest = true; }
      else o.vy = 0;
    }
    if (o.t > 300) loot.splice(i, 1);
  }
}
const POT_HEAL = 12, POT_RATE = POT_HEAL / 5;
function tickPotion(dt) {
  if (!(pl.potHeal > 0)) return;
  const step = Math.min(pl.potHeal, POT_RATE * dt); pl.potHeal -= step;
  pl.potAcc = (pl.potAcc || 0) + step; const n = Math.floor(pl.potAcc + 1e-6);
  if (n > 0) { pl.potAcc -= n; pl.hp = Math.min(pl.maxHp, pl.hp + n); }
  if (pl.potHeal <= 1e-6) { pl.potHeal = 0; if (pl.potAcc > 0.5) pl.hp = Math.min(pl.maxHp, pl.hp + 1); pl.potAcc = 0; }
}
function drinkPotion() {
  if (pl.dead || pl.potCD > 0) return false;
  const pcx = pl.x + pl.w / 2;
  if (countItem('pocao') <= 0) { floatText(pcx, pl.y - 8, 'Sem poções', '#d9c7a3', 0.8); return false; }
  if (pl.hp >= pl.maxHp) { floatText(pcx, pl.y - 8, 'Vida cheia', '#d9c7a3', 0.8); return false; }
  // flat 30 life spread over 5 s; another potion adds to what is still flowing
  pl.potHeal = (pl.potHeal || 0) + POT_HEAL; removeItem('pocao', 1); pl.potCD = 1;
  floatText(pcx, pl.y - 6, '+' + POT_HEAL, '#7dff8a', 1.1); burst(pcx, pl.y + 10, 14, '#ff8a9a', 50, -80, 0.7, 1, true); sfx.potion();
  return true;
}
function gainXP(v) {
  pl.xp += v;
  while (pl.xp >= xpNeed(pl.lvl)) {
    pl.xp -= xpNeed(pl.lvl); pl.lvl++;
    const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
    burst(cx, cy, 40, '#ffd27a', 140, -60, 1.1, 1, true); levelFlash = 1;
    floatText(cx, pl.y - 16, `NÍVEL ${pl.lvl}!`, '#ffd27a', 1.6);
    toast(`Nível ${pl.lvl}!`, 'gold');
    sfx.level();
  }
}
let levelFlash = 0, hurtVig = 0;
function hurtPlayer(dmg, srcX, src, isProj) {
  if (pl.dead) return 'none';
  const pcx = pl.x + pl.w / 2, rel = srcX - pcx;
  const front = Math.abs(rel) < 3 || Math.sign(rel) === pl.facing;
  if (pl.shieldK >= 0.6 && front) {
    const parry = gameTime - pl.shieldStart < pl.parry;
    const fx = pcx + pl.facing * 9, fy = pl.y + 8;
    burst(fx, fy, parry ? 18 : 9, parry ? '#fff1b8' : '#ffd27a', parry ? 140 : 90, 120, 0.35, 1, true);
    pl.vx -= pl.facing * (parry ? 20 : 80);
    if (src && !isProj) {
      const D = ET[src.type];
      const nudge = D.boss ? 0.3 : 1;   // a parry staggers it in place, it doesn't throw it across the room
      src.vx = pl.facing * (parry ? 70 : 50) * D.kb * nudge; if (!D.fly) src.vy = -40 * D.kb * nudge;
      src.stun = parry ? 1.4 : 0.35; src.atkCD = Math.max(src.atkCD, parry ? 1.6 : 0.6);
      if (parry) src.parried = 1.5;
      if (src.type === 'skeleton') { src.state = 'walk'; src.sAng = 0.9; }
      if (src.type === 'guard') { src.state = 'recover'; src.stateT = parry ? 1.2 : 0.6; }
      if (src.type === 'skull') { src.state = 'walk'; src.atkCD = 1.6; }
      if (src.type === 'ghost') { src.state = 'fade'; src.stateT = 1.1; }
      if (src.type === 'bat') src.retreat = 0.9;
    }
    floatText(fx, fy - 8, parry ? 'APARADO!' : 'BLOQUEIO', parry ? '#ffe28a' : '#d9c7a3', parry ? 1.15 : 0.8);
    // the executioner's axe still bites through a plain block; only a parry stops it clean
    if (!parry && src && ET[src.type].boss && pl.invuln <= 0) rawDamage(armorTaken(dmg * 0.35), rel > 0 ? -1 : 1);
    if (parry) { sfx.parry(); hitstop = Math.max(hitstop, 0.09); shake(3); } else { sfx.block(); shake(1.5); }
    spendVigor(parry, !!(src && ET[src.type].boss));   // js/50-vigor.js
    return parry ? 'parry' : 'block';
  }
  if (pl.invuln > 0) return 'none';
  if (pl.dodge > 0 && Math.random() < pl.dodge) { floatText(pl.x + pl.w / 2, pl.y - 8, 'ESQUIVA', '#c8f4ff', 0.9); pl.invuln = 0.25; sfx.dodge(); return 'none'; }
  const taken = armorTaken(dmg);   // armour: js/48-itemizacao.js
  rawDamage(taken, rel > 0 ? -1 : 1);
  // thorns: whoever hit you up close takes a share of it back
  if (pl.thorns > 0 && src && !isProj && !src.dead) { const r = Math.max(1, Math.round(taken * pl.thorns)); src.hp -= r; src.flash = 0.1; src.showHp = 3; floatText(src.x + src.w / 2, src.y - 4, String(r), '#9fd65a', 0.85); if (src.hp <= 0) killEnemy(src); }
  return 'hit';
}
function rawDamage(d, kdir) {
  pl.hp -= d; pl.invuln = 0.75; pl.hurtFlash = 0.12; pl.lastHurt = gameTime; pl.stunT = 0.16; pl.regen = 0;
  pl.vx = kdir * 170; pl.vy = -150; pl.onGround = false;
  burst(pl.x + pl.w / 2, pl.y + 8, 10, '#c8323c', 90, 420, 0.5);
  floatText(pl.x + pl.w / 2, pl.y - 6, '-' + d, '#ff5a5a', 1.1);
  sfx.hurt(); shake(4); hurtVig = 0.5;
  if (pl.hp <= 0) { pl.hp = 0; die(); }
}
function die() {
  if (bossFight) endBossFight(false);
  resetVigor(); pl.dead = true; pl.deathT = 0; pl.potHeal = 0; pl.potAcc = 0; pl.atkT = -1; pl.shieldK = 0;
  burst(pl.x + pl.w / 2, pl.y + 10, 30, '#c8323c', 120, 380, 0.9); burst(pl.x + pl.w / 2, pl.y + 10, 14, '#d6c39a', 90, 380, 0.9);
  const lost = Math.floor(pl.xp * 0.3); pl.xp -= lost; pl.lostXp = lost;
  sfx.death(); shake(6);
}
