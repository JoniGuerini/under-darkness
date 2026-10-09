'use strict';

/* ================= player ================= */
const REACH = 4.5 * T;
function updatePlayer(dt) {
  if (pl.dead) { pl.deathT += dt; if (pl.deathT > 1.3 && state === 'play') showDeath(); return; }
  const left = keys.KeyA || keys.ArrowLeft, right = keys.KeyD || keys.ArrowRight;
  const jumpHeld = keys.KeyW || keys.Space || keys.ArrowUp;
  // chains: hold W/S to climb, Space jumps off
  const onChain = touchingTile(pl, CHAIN), upHeld = keys.KeyW || keys.ArrowUp, downHeld = keys.KeyS || keys.ArrowDown;
  if (pressed.Space || (!onChain && (pressed.KeyW || pressed.ArrowUp))) pl.jumpBuf = 0.12;
  if (!onChain) pl.climb = false; else if ((upHeld || downHeld) && pl.stunT <= 0) pl.climb = true;
  if (onChain && !pl.chainTip) { pl.chainTip = true; floatText(pl.x + pl.w / 2, pl.y - 12, 'Segure W ou S para usar a corrente', '#d9c7a3', 0.8); }
  if (mouse.lPressed && hb.sel === 0) pl.atkBuf = 0.18;
  const wantShieldRaw = mouse.r || keys.ShiftLeft || keys.ShiftRight;
  const wantShield = wantShieldRaw && !!equip.shield && !pl.guardBroken;   // vigor: js/50-vigor.js
  if (wantShieldRaw && !equip.shield && pl.fullMsg <= 0) { pl.fullMsg = 2; floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem escudo equipado', '#d9c7a3', 0.8); }
  pl.potCD -= dt; tickPotion(dt); tickVigor(dt);
  if (pressed.KeyR) drinkPotion();
  const [mwx] = mouseWorld(); const pcx = pl.x + pl.w / 2;
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  pl.stunT -= dt;

  // cancel attack recovery into shield
  if (wantShield && pl.atkT > ATK_WIND + ATK_SWING) { pl.atkT = -1; pl.lastAtkEnd = gameTime; }
  if (wantShield && pl.atkT < 0) {
    if (!pl.shieldOn) { pl.shieldOn = true; pl.shieldStart = gameTime; }
    pl.shieldK = Math.min(1, pl.shieldK + dt / 0.09);
  } else { pl.shieldOn = false; pl.shieldK = Math.max(0, pl.shieldK - dt / 0.12); }

  if (pl.shieldOn) { const d = mwx - pcx; if (Math.abs(d) > 3) pl.facing = d > 0 ? 1 : -1; }
  else if (pl.atkT < 0 && dir !== 0) pl.facing = dir;

  // attack
  const canStart = (pl.atkT < 0 || pl.atkT > ATK_TOTAL - 0.07) && gameTime - pl.atkAt >= pl.atkPeriod - 0.01;   // weapon speed: js/48-itemizacao.js
  if (hb.sel === 0 && (pl.atkBuf > 0 || mouse.l) && canStart && pl.shieldK < 0.35 && pl.stunT <= 0) {
    const d = mwx - pcx; if (Math.abs(d) > 2) pl.facing = d > 0 ? 1 : -1;
    const combo = pl.atkT >= 0 || gameTime - pl.lastAtkEnd < 0.3;
    pl.atkType = combo ? 1 - pl.atkType : 0;
    pl.atkStart = pl.sAng; pl.atkT = 0; pl.atkAt = gameTime; pl.atkHit.clear(); pl.atkBuf = 0; pl.trail.length = 0;
    if (pl.onGround) pl.vx += pl.facing * 35;
    sfx.swing();
  }
  pl.atkBuf -= dt;

  // pickaxe: holding the left button keeps swinging it
  pl.mining = hb.sel === 1 && !!equip.tool && mouse.l && pl.atkT < 0 && pl.shieldK < 0.35 && pl.stunT <= 0;
  if (!pl.mining) { pl.mineT = MINE_P * 0.3; pl.mineAge = 0; }
  if (hb.sel === 1 && !equip.tool && mouse.lPressed) floatText(pcx, pl.y - 8, 'Sem picareta equipada', '#d9c7a3', 0.8);

  // the backpack row: blocks and torches get placed (hold to keep placing), potions get drunk
  pl.useCD -= dt; pl.useT -= dt;
  const held = heldBag();
  if (held && pl.atkT < 0 && pl.shieldK < 0.35 && pl.stunT <= 0) {
    if (held.it.use) { if (mouse.lPressed && drinkPotion()) pl.useT = 0.2; }
    else if ((held.it.block || held.it.deco || held.s.id === 'tocha') && mouse.l && pl.useCD <= 0) { if (placeHeld(held)) { pl.useCD = 0.13; pl.useT = 0.18; } }
  }

  // movement
  const inLava = lavaIn(pl.x, pl.y, pl.w, pl.h);
  let maxSpd = 82 * (1 + pl.spd); if (pl.shieldK > 0.5) maxSpd *= 0.45; else if (pl.atkT >= 0 && pl.onGround) maxSpd *= 0.55; if (inLava) maxSpd *= 0.5;
  if (pl.stunT <= 0) {
    if (dir !== 0) pl.vx = approach(pl.vx, dir * maxSpd, (pl.onGround ? 950 : 620) * dt);
    else pl.vx = approach(pl.vx, 0, (pl.onGround ? 1100 : 260) * dt);
  } else pl.vx = approach(pl.vx, 0, 300 * dt);
  if (pl.onGround) pl.coyote = 0.09; else pl.coyote -= dt;
  if (pl.jumpBuf > 0 && (pl.coyote > 0 || pl.climb) && pl.stunT <= 0) {
    pl.climb = false; pl.vy = inLava ? -200 : -290; pl.coyote = 0; pl.jumpBuf = 0; pl.onGround = false; sfx.jump();
    burst(pcx, pl.y + pl.h, 4, '#b8a68a', 30, 200, 0.3);
  }
  pl.jumpBuf -= dt;
  if (pl.climb) { pl.vy = upHeld ? -78 : downHeld ? 96 : 0; pl.vx = approach(pl.vx, dir * 42, 900 * dt); }
  else { let g = GRAV; if (pl.vy < 0 && !jumpHeld) g *= 2.2; if (keys.KeyS || keys.ArrowDown) g *= 1.35; pl.vy = Math.min(pl.vy + g * dt, MAXFALL * (inLava ? 0.25 : 1)); }
  const wasAir = !pl.onGround, vyB = pl.vy;
  moveEntity(pl, dt, false);   // no auto step-up: one-block ledges need a jump
  if (wasAir && pl.onGround && vyB > 220) { burst(pl.x + pl.w / 2, pl.y + pl.h, 6, '#b8a68a', 40, 200, 0.35); sfx.land(); if (vyB > 380) shake(1.5); }

  // lava
  if (inLava) { pl.lavaT -= dt; if (pl.lavaT <= 0) { pl.lavaT = 0.5; rawDamage(Math.max(2, Math.round(pl.maxHp * 0.1)), Math.random() < 0.5 ? -1 : 1); pl.vy = -120; floatText(pl.x + pl.w / 2, pl.y - 14, 'QUEIMANDO', '#ff9a3c', 0.8); } } else pl.lavaT = 0;

  // weapon pose: arcs for swords, daggers, axes and maces; a straight thrust for spears. Attack speed scales the whole swing
  if (pl.atkT >= 0) {
    pl.atkT += dt * (pl.atkSpd || 1);
    const t = pl.atkT;
    if (pl.thrust) {
      pl.sAng = 1.52; pl.fArm = 1.58;
      pl.spearPy = t < ATK_WIND ? lerp(12, 8, t / ATK_WIND) : t < ATK_WIND + ATK_SWING ? lerp(8, 17, easeOut((t - ATK_WIND) / ATK_SWING)) : lerp(17, 12, clamp((t - ATK_WIND - ATK_SWING) / 0.12, 0, 1));
    } else { pl.sAng = swordAngle(t, pl.atkType, pl.atkStart); pl.fArm = clamp(pl.sAng * 0.6, -1.25, 1.7); }
    if (pl.atkT >= ATK_WIND && pl.atkT <= ATK_WIND + ATK_SWING + 0.02) {
      if (!pl.thrust) { pl.trail.push(pl.sAng); if (pl.trail.length > 5) pl.trail.shift(); }
      const cx = pl.x + pl.w / 2, reach = pl.reach;
      const hb = pl.thrust ? { x: pl.facing > 0 ? cx : cx - reach, y: pl.y + 3, w: reach, h: 17 } : { x: pl.facing > 0 ? cx - 3 : cx - (reach - 3), y: pl.y - 9, w: reach, h: pl.h + 12 };
      for (const e of enemies) if (!e.dead && !pl.atkHit.has(e) && overlap(hb, e) && clearPath(pl, e)) { pl.atkHit.add(e); hitEnemy(e, pl.facing, 1, true); }
      for (let ty = Math.floor(hb.y / T); ty <= Math.floor((hb.y + hb.h) / T); ty++) for (let tx = Math.floor(hb.x / T); tx <= Math.floor((hb.x + hb.w) / T); tx++) if (tileAt(tx, ty) === URN) breakTile(tx, ty);
    } else if (pl.trail.length) pl.trail.shift();
    if (pl.atkT >= ATK_TOTAL) { pl.atkT = -1; pl.lastAtkEnd = gameTime; pl.trail.length = 0; }
  } else if (pl.mining) mineSwing(dt);
  else {
    let tA = 2.7, tS = 0.9;
    if (!pl.onGround) { tA = 2.35; tS = 0.6; }
    else if (Math.abs(pl.vx) > 6) { const s = Math.sin(pl.walk * Math.PI / 2) * 0.12; tA += s; tS += s; }
    if (pl.climb) { tA = 0.15 + (Math.abs(pl.vy) > 1 ? Math.sin(gameTime * 12) * 0.35 : 0); tS = 0.5; }
    if (pl.shieldK > 0.3) { tA = 2.95; tS = 2.0; }
    else if (pl.useT > 0) tA = aimAngle();
    const k = Math.min(1, dt * 16); pl.fArm = lerp(pl.fArm, tA, k); pl.sAng = lerp(pl.sAng, tS, k);
  }

  if (pl.onGround && Math.abs(pl.vx) > 6) pl.walk += Math.abs(pl.vx) * dt * 0.085; else pl.walk = 0;
  pl.invuln -= dt; pl.hurtFlash -= dt;
  if (pl.mana < pl.maxMana) pl.mana = Math.min(pl.maxMana, pl.mana + dt * 2.2);
  // no base regen: life only comes back from gear bonuses (and potions)
  if (pl.regenB > 0 && gameTime - pl.lastHurt > 4 && pl.hp < pl.maxHp) { pl.regen += dt * pl.regenB; if (pl.regen >= 1) { const n = Math.floor(pl.regen); pl.hp = Math.min(pl.maxHp, pl.hp + n); pl.regen -= n; } }

  updateDig(dt);
}
const MINE_P = 0.3, MINE_HIT = 0.72;
// one pickaxe swing: raise over the shoulder, then strike toward the mouse; damage lands on the strike
function mineSwing(dt) {
  const [mx, my] = mouseWorld();
  const d = mx - (pl.x + pl.w / 2); if (Math.abs(d) > 2) pl.facing = d > 0 ? 1 : -1;
  const sx = pl.x + pl.w / 2 + pl.facing * 1.5, sy = pl.y + pl.h - 11.5;
  const aim = clamp(Math.atan2((mx - sx) * pl.facing, sy - my), 0.3, 2.9);
  const p0 = (pl.mineT % MINE_P) / MINE_P; pl.mineT += dt; pl.mineAge += dt; const p1 = (pl.mineT % MINE_P) / MINE_P;
  const up = aim - 1.85, hitA = aim + 0.12;
  let a;
  if (p1 < 0.5) a = lerp(hitA, up, easeOut(p1 / 0.5));
  else if (p1 < MINE_HIT) { const k = (p1 - 0.5) / (MINE_HIT - 0.5); a = lerp(up, hitA, k * k); }
  else a = hitA;
  const k = pl.mineAge < 0.12 ? Math.min(1, dt * 30) : 1;
  pl.sAng = lerp(pl.sAng, a, k); pl.fArm = lerp(pl.fArm, clamp(a * 0.75 + 0.35, -1.1, 2.7), k);
  if ((p0 < MINE_HIT && p1 >= MINE_HIT) || (p1 < p0 && p0 < MINE_HIT)) pickImpact(sx, sy, aim);
}
function pickImpact(sx, sy, aim) {
  const tg = pl.target;
  const t = tg ? tileAt(tg.tx, tg.ty) : AIR;
  if (tg && tg.inReach && tg.dig && inVillage(tg.tx, tg.ty)) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, PCOL[t] || '#888', 40, 300, 0.3);
    if (pl.hintT <= 0) { pl.hintT = 2.5; floatText(pl.x + pl.w / 2, pl.y - 10, 'Não dá para cavar no vilarejo', '#d9c7a3', 0.8); }
  } else if (tg && tg.inReach && tg.dig && t === CRYPT && cryptLocked(tg.tx, tg.ty)) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 4, '#b77bff', 50, 0, 0.35, 1, true);
    if (pl.hintT <= 0) { pl.hintT = 2.5; floatText(pl.x + pl.w / 2, pl.y - 10, 'Uma força sombria protege a cripta', '#c58cff', 0.8); }
  } else if (tg && tg.inReach && tg.dig && DIG[t] > 0) {
    if (pl.digX !== tg.tx || pl.digY !== tg.ty) { pl.digX = tg.tx; pl.digY = tg.ty; pl.digT = 0; }
    pl.digT += MINE_P * (pl.mine || 1);
    sfx.dig(); if (t === STONE || t === DEEP || ORE_ITEM[t]) sfx.tink();
    burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, PCOL[t] || '#888', 50, 320, 0.35);
    if (pl.digT >= DIG[t] - 1e-6) { breakTile(tg.tx, tg.ty); pl.digT = 0; pl.digX = -1; }
  } else sfx.pswing();
  // the pick head also hurts whatever stands in the way (much weaker than the sword)
  const hx = sx + pl.facing * Math.sin(aim) * 15, hy = sy - Math.cos(aim) * 15, box = { x: hx - 8, y: hy - 8, w: 16, h: 16 };
  const dmg = pl.pickDmg || 4;
  for (const e of enemies) if (!e.dead && overlap(box, e) && clearPath(pl, e)) hitEnemy(e, pl.facing, dmg / pl.dmg);
}
// the closest closed chest within about two blocks of the hero
function nearestChest() {
  if (pl.dead) return null;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, tx0 = Math.floor(pcx / T), ty0 = Math.floor(pcy / T);
  let best = null, bd = 1e9;
  for (let ty = ty0 - 3; ty <= ty0 + 3; ty++) for (let tx = tx0 - 3; tx <= tx0 + 3; tx++) {
    if (tileAt(tx, ty) !== CHEST) continue;
    const dx = (tx + 0.5) * T - pcx, dy = (ty + 0.5) * T - pcy;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 26) continue;
    const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [tx, ty]; }
  }
  return best;
}
function updateDig(dt) {
  const [wx, wy] = mouseWorld(); const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const inReach = Math.hypot((tx + 0.5) * T - pcx, (ty + 0.5) * T - pcy) <= REACH;
  const t = tileAt(tx, ty), pick = hb.sel === 1 && !!equip.tool;
  pl.target = { tx, ty, inReach, dig: DIG[t] > 0 && ty < WH - 1, chest: t === CHEST, pick };
  pl.nearChest = nearestChest(); pl.nearNpc = nearNpc();
  pl.hintT -= dt;
  if (pressed.KeyE) {
    if (pl.nearNpc) { openTalk(pl.nearNpc); return; }
    if (pl.nearChest) { openChest(pl.nearChest[0], pl.nearChest[1]); pl.nearChest = null; return; }
    if (t === CHEST && inReach) { openChest(tx, ty); return; }
    // E used to dig; point old habits to the pickaxe
    if (pl.target.dig && inReach && pl.hintT <= 0) { pl.hintT = 2.5; floatText(pcx, pl.y - 10, pick ? 'Segure o clique esquerdo para minerar' : 'Para minerar, pegue a picareta (2)', '#ffd27a', 0.8); }
  }
  if (!pl.mining || !inReach || tx !== pl.digX || ty !== pl.digY) { pl.digT = 0; pl.digX = -1; }
  if (pressed.KeyQ) placeTorch(tx, ty, inReach);
}
function breakTile(tx, ty) {
  const t = tileAt(tx, ty); let wood = 0;
  if (t === TRUNK || t === LEAVES) {
    const q = [[tx, ty]], seen = new Set(); let n = 0;
    while (q.length && n < 260) { const [x, y] = q.pop(); const k = y * WW + x; if (seen.has(k)) continue; seen.add(k); const tt = tileAt(x, y); if (tt !== TRUNK && tt !== LEAVES) continue; if (t === LEAVES && tt === TRUNK) continue; setTile(x, y, AIR); n++; if (tt === TRUNK) wood++; if (n % 3 === 0) burst((x + 0.5) * T, (y + 0.5) * T, 2, PCOL[tt], 40, 300, 0.4); q.push([x + 1, y], [x - 1, y], [x, y - 1], [x, y + 1]); }
  } else setTile(tx, ty, AIR);
  if (tileAt(tx, ty - 1) === URN || tileAt(tx, ty - 1) === CANDLE) breakTile(tx, ty - 1);
  const above = tileAt(tx, ty - 1); if (above === TUFT || above === FLOWER || above === SHROOM || above === BONES || above === CHEST || above === CHEST_OPEN) { if (above === CHEST) openChest(tx, ty - 1); setTile(tx, ty - 1, AIR); }
  burst((tx + 0.5) * T, (ty + 0.5) * T, 8, PCOL[t] || '#888', 70, 380, 0.5);
  sfx.dug();
  const lx = (tx + 0.5) * T, ly = (ty + 1) * T - 1;
  if (t === TORCH) dropLoot(lx, ly, 'tocha', 1, true);
  if (ORE_ITEM[t]) dropLoot(lx, ly, ORE_ITEM[t], 1, true);
  if (BLOCK_DROP[t]) dropLoot(lx, ly, BLOCK_DROP[t], 1, true);
  if (wood) dropLoot(lx, ly, 'madeira', wood, true);
  if (t === CANDLE) dropLoot(lx, ly, 'candelabro', 1, true);
  if (t === URN) {
    sfx.pot(); burst(lx, ly - 4, 10, '#8a5a3a', 70, 380, 0.5);
    const r = Math.random(); if (r < 0.2) dropLoot(lx, ly, 'tocha', 1, true); else if (r < 0.28) dropLoot(lx, ly, 'pocao', 1, true); else if (r < 0.6) dropLoot(lx, ly, 'ouro', 1 + Math.floor(Math.random() * 5), true);
    if (Math.random() < 0.6) orbs.push({ x: lx, y: ly - 6, vx: rnd(-40, 40), vy: rnd(-90, -50), v: 3, t: 0 });
  }
  if (ORE_XP[t]) { floatText((tx + 0.5) * T, ty * T - 2, ORE_NAME[t], PCOL[t], 0.8); burst((tx + 0.5) * T, (ty + 0.5) * T, 6, PCOL[t], 60, 0, 0.5, 1, true); }
}
function placeTorch(tx, ty, inReach) {
  if (!inReach) return false;
  if (inVillage(tx, ty)) { if (pl.hintT <= 0) { pl.hintT = 2; floatText(pl.x + pl.w / 2, pl.y - 8, 'O vilarejo já tem lanternas', '#d9c7a3', 0.8); } return false; }
  if (countItem('tocha') <= 0) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem tochas', '#d9c7a3', 0.8); return false; }
  if (tileAt(tx, ty) !== AIR && tileAt(tx, ty) !== TUFT) return false;
  const ok = (wallAt(tx, ty) > 0) || solidAt(tx, ty + 1) || solidAt(tx - 1, ty) || solidAt(tx + 1, ty);
  if (!ok) return false;
  setTile(tx, ty, TORCH); removeItem('tocha', 1); sfx.torch();
  burst((tx + 0.5) * T, ty * T + 2, 6, '#ffc23d', 40, -40, 0.5, 1, true);
  return true;
}
function heldBag() { if (hb.sel < 2) return null; const i = hb.sel - 2, s = inv[i]; return s ? { i, s, it: ITEMS[s.id] } : null; }
function aimAngle() { const [mx, my] = mouseWorld(); const sx = pl.x + pl.w / 2 + pl.facing * 1.5, sy = pl.y + pl.h - 11.5; return clamp(Math.atan2((mx - sx) * pl.facing, sy - my), 0.3, 2.9); }
// a block needs an empty spot in reach, something to stick to (a block or the back wall), and nobody standing there
function canPlace(tx, ty) {
  if (ty < 1 || ty >= WH - 3 || inVillage(tx, ty)) return false;
  const t = tileAt(tx, ty); if (t !== AIR && t !== TUFT && t !== FLOWER && t !== WEB) return false;
  const r = { x: tx * T, y: ty * T, w: T, h: T };
  if (!pl.dead && overlap(r, pl)) return false;
  for (const e of enemies) if (!e.dead && overlap(r, e)) return false;
  return solidAt(tx - 1, ty) || solidAt(tx + 1, ty) || solidAt(tx, ty - 1) || solidAt(tx, ty + 1) || wallAt(tx, ty) > 0;
}
function canPlaceDeco(tx, ty) { const t = tileAt(tx, ty); return !inVillage(tx, ty) && (t === AIR || t === TUFT || t === FLOWER || t === WEB) && solidAt(tx, ty + 1); }
function placeHeld(held) {
  const [wx, wy] = mouseWorld(), tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const inReach = Math.hypot((tx + 0.5) * T - pcx, (ty + 0.5) * T - pcy) <= REACH;
  if (held.s.id === 'tocha') return placeTorch(tx, ty, inReach);
  if (held.it.deco) { if (!inReach || !canPlaceDeco(tx, ty)) return false; setTile(tx, ty, held.it.deco); held.s.n--; if (held.s.n <= 0) inv[held.i] = null; invDirty = true; sfx.place(); return true; }
  if (!inReach || !canPlace(tx, ty)) return false;
  setTile(tx, ty, held.it.block);
  held.s.n--; if (held.s.n <= 0) inv[held.i] = null; invDirty = true;
  const d = (tx + 0.5) * T - pcx; if (Math.abs(d) > 2) pl.facing = d > 0 ? 1 : -1;
  sfx.place(); burst((tx + 0.5) * T, (ty + 1) * T - 1, 5, PCOL[held.it.block] || '#888', 40, 300, 0.35);
  return true;
}
