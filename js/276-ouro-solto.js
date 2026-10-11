'use strict';

/* ================= o Covil do Dragão: o ouro que desliza, a avalanche, o ouro derretido, os fios e os estados =================
   O primeiro bloco do jogo que cai (ficha, seção 13): o Ouro Solto (DG_OURO_SOLTO).
   - Um bloco de ouro solto com ar embaixo cai 1; se embaixo é firme mas um dos lados e a diagonal de baixo desse lado
     estão livres, ele escorrega para a diagonal. Dá montes com encosta de 45°, como areia.
   - Só roda numa fila de blocos acordados. Um bloco acorda quando o vizinho de baixo ou do lado muda (minerar, o
     sopro, o pouso do dragão): o setTile é embrulhado. A fila anda 20 vezes por segundo, até 200 movimentos por passo;
     quem não se mexe dorme de novo. O mundo nunca é varrido inteiro.
   - Avalanche (dgQuake(x0, x1, y0, y1, aviso)): o ouro da área treme `aviso` segundos (poeira dourada caindo) e
     depois, por 1,4 s, a camada de cima de cada coluna escorrega encosta abaixo mesmo onde estava assentada: a onda
     desce o monte. Bloco que bate no herói faz dano (DG_GOLD.dmg: o 277 põe metade do dano de Cinzarel) e empurra o
     herói encosta abaixo; o bloco espera o herói sair da frente.
   - Ouro derretido (dgMelt(x, y, r)): o sopro e as bolas de magma derretem ouro solto ou endurecido: vira
     DG_OURO_QUENTE (firme, brilha, queima quem pisa) e em 3 s endurece em DG_OURO_DURO, que não desliza mais.
   - Dentro da Cratera do Tesouro tudo é escrito direto em tiles (nada vai para os diffs: o 277 refaz a sala pelo plano
     e chama dgGoldClear); fora dela é setTile, então vai para o save como qualquer mineração.
   - Minerar ouro solto dá 1 moeda (o bloco solta `ouro`, 271) e, 1 vez em 20, uma Moeda Antiga. Escorregar não dá nada.
   Também aqui:
   - o fio de armadilha (DG_FIO): quem passa por ele o rompe e 3 ou 4 pedras se soltam do teto em volta; a sombra de
     cada uma aparece no chão 0,6 s antes;
   - os estados do herói do 270: pés presos no ouro (dgPrender), puxado pela língua do camaleão (dgPuxar), agarrado e
     carregado pela serpe (dgAgarrar). A morte limpa tudo. */

const DG_GOLD = { dmg: 0, awake: new Set(), quakes: [], hot: [], acc: 0, hitCD: 0, hotCD: 0 };
const dgGoldFree = t => t === AIR || (!SOLID[t] && t !== LAVA && !!DECO[t] && !DG_CLIMB(t) && t !== DG_FIO);
// o dano de pedra e de ouro caindo no herói quando ninguém disse outro: o golpe de um kobold no nível da camada
const dgBaseDmg = base => { const lvl = typeof layerLo === 'function' ? layerLo('dragao') : 25; return Math.round(base * (1 + 0.2 * (lvl - 1))); };
function dgGoldWake(x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const yy = y + dy; if (yy < 1 || yy >= WH - 1) continue;
    const i = yy * WW + wrapX(x + dx); if (tiles[i] === DG_OURO_SOLTO) DG_GOLD.awake.add(i);
  }
}
let dgGoldWriting = false;
function dgGoldPut(i, t) {
  const x = i % WW, y = (i / WW) | 0;
  if (inDgHall(x, y, 2)) { tiles[i] = t; markDirty(x, y); mapVer++; if (!SOLID[t] && typeof propsLoseSupport === 'function') propsLoseSupport(x, y); }
  else { dgGoldWriting = true; try { setTile(x, y, t); } finally { dgGoldWriting = false; } }
}
// quem mexe num bloco acorda o ouro em volta
{ const _st = setTile; setTile = function (x, y, t) {
  _st(x, y, t);
  if (DRAGAO && !dgGoldWriting && y >= DG_S0 - 2 && y < DG_S0 + DG_D + 2) dgGoldWake(wrapX(x), y);
}; }
function dgGoldClear() { DG_GOLD.awake.clear(); DG_GOLD.quakes.length = 0; }
function dgQuake(x0, x1, y0, y1, warn = 1) { DG_GOLD.quakes.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), t: warn, slide: 1.4 }); }
function dgMelt(tx, ty, r = 1) {
  tx = wrapX(Math.round(tx)); ty = Math.round(ty);
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
    if (dx * dx + dy * dy > r * r + 0.3) continue;
    const y = ty + dy; if (y < 1 || y >= WH - 1) continue;
    const i = y * WW + wrapX(tx + dx), t = tiles[i];
    if (t !== DG_OURO_SOLTO && t !== DG_OURO_DURO) continue;
    dgGoldPut(i, DG_OURO_QUENTE); DG_GOLD.awake.delete(i);
    const h = DG_GOLD.hot.find(o => o.i === i); if (h) h.t = 3; else DG_GOLD.hot.push({ i, t: 3 });
    if (Math.random() < 0.4) burst((wrapX(tx + dx) + 0.5) * T, y * T, 3, '#ffd050', 40, -30, 0.4, 1, true);
  }
}
// a caixa do herói nos próximos pixels: o ouro não entra nela, bate e espera
const plTile = i => {
  if (!pl || pl.dead) return false;
  const x = i % WW, y = (i / WW) | 0, y0 = Math.floor(pl.y / T), y1 = Math.floor((pl.y + pl.h - 0.001) / T);
  if (y < y0 || y > y1) return false;
  const x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + pl.w - 0.001) / T);
  for (let xx = x0; xx <= x1; xx++) if (wrapX(xx) === x) return true;
  return false;
};
function dgGoldHit(dir) {
  if (DG_GOLD.hitCD > 0 || !pl || pl.dead) return;
  DG_GOLD.hitCD = 0.45;
  hurtPlayer(DG_GOLD.dmg || dgBaseDmg(8), pl.x + pl.w / 2 - pl.facing * 50, null, true);   // vem de cima: o escudo não segura
  pl.vx += (dir || (Math.random() < 0.5 ? -1 : 1)) * 160; pl.vy = Math.min(pl.vy, -60);
  burst(pl.x + pl.w / 2, pl.y + 2, 8, '#f0cc5a', 60, 200, 0.4, 1, true);
}
function dgGoldStep() {
  const A = DG_GOLD.awake; if (!A.size && !DG_GOLD.quakes.some(q => q.t <= 0)) return;
  const list = Array.from(A); A.clear();
  list.sort((a, b) => b - a);   // de baixo para cima: o de baixo cai primeiro e abre lugar
  let moves = 0;
  const loose = new Set();
  for (const q of DG_GOLD.quakes) if (q.t <= 0) for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) { const i = y * WW + wrapX(x); if (tiles[i] === DG_OURO_SOLTO && tiles[i - WW] !== DG_OURO_SOLTO && Math.random() < 0.35) { loose.add(i); if (!list.includes(i)) list.push(i); } }
  for (const i of list) {
    if (moves >= 200) { A.add(i); continue; }
    if (tiles[i] !== DG_OURO_SOLTO) continue;
    const x = i % WW, y = (i / WW) | 0; if (y >= WH - 2) continue;
    const dn = i + WW;
    let to = -1, dir = 0;
    if (dgGoldFree(tiles[dn])) to = dn;
    else {
      const ds = Math.random() < 0.5 ? [-1, 1] : [1, -1];
      for (const d of ds) { const s = y * WW + wrapX(x + d), sd = s + WW; if (dgGoldFree(tiles[s]) && dgGoldFree(tiles[sd])) { to = sd; dir = d; break; } }
      if (to < 0 && loose.has(i)) for (const d of ds) { const s = y * WW + wrapX(x + d), sd = s + WW; if (dgGoldFree(tiles[s]) && !dgGoldFree(tiles[sd]) && !dgGoldFree(tiles[i + WW]) && tiles[s + WW] !== DG_OURO_SOLTO) { to = s; dir = d; break; } }
    }
    if (to < 0) continue;
    if (plTile(to)) { dgGoldHit(dir); A.add(i); continue; }   // bateu no herói: empurra e espera
    dgGoldPut(to, DG_OURO_SOLTO); dgGoldPut(i, AIR); moves++;
    A.add(to); dgGoldWake(x, y); dgGoldWake(to % WW, (to / WW) | 0);
    if (Math.random() < 0.06 && pl && Math.abs(wdx(x - Math.floor(pl.x / T))) < 30) sfx.tink();
  }
}
HOOK.update.push(dt => {
  if (!DRAGAO || state !== 'play') return;
  DG_GOLD.hitCD -= dt; DG_GOLD.hotCD -= dt;
  for (let k = DG_GOLD.quakes.length - 1; k >= 0; k--) {
    const q = DG_GOLD.quakes[k];
    if (q.t > 0) {   // o aviso: o ouro treme e solta poeira dourada
      q.t -= dt;
      if (Math.random() < dt * 30) { const x = q.x0 + Math.random() * (q.x1 - q.x0 + 1), y = q.y0 + Math.random() * (q.y1 - q.y0 + 1); if (tileAt(Math.floor(x), Math.floor(y)) === DG_OURO_SOLTO) parts.push({ x: x * T, y: y * T, vx: rnd(-6, 6), vy: rnd(-30, -10), g: 120, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#f0cc5a' : '#fff0a0', size: 1 }); }
      if (q.t <= 0) { shake(3); for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) { const i = y * WW + wrapX(x); if (tiles[i] === DG_OURO_SOLTO) DG_GOLD.awake.add(i); } }
    } else if ((q.slide -= dt) <= 0) DG_GOLD.quakes.splice(k, 1);
  }
  DG_GOLD.acc += dt; let n = 0;
  while (DG_GOLD.acc >= 0.05 && n < 3) { DG_GOLD.acc -= 0.05; n++; dgGoldStep(); }
  if (DG_GOLD.acc > 0.2) DG_GOLD.acc = 0;
  // o derretido endurece
  for (let k = DG_GOLD.hot.length - 1; k >= 0; k--) { const h = DG_GOLD.hot[k]; if ((h.t -= dt) > 0) continue; if (tiles[h.i] === DG_OURO_QUENTE) dgGoldPut(h.i, DG_OURO_DURO); DG_GOLD.hot.splice(k, 1); }
  // quem pisa ou encosta no derretido se queima
  if (pl && !pl.dead && DG_GOLD.hot.length && DG_GOLD.hotCD <= 0 && pl.invuln <= 0 && touchingTile(pl, DG_OURO_QUENTE)) {
    DG_GOLD.hotCD = 0.5;
    const o = typeof dmgCtx !== 'undefined' ? dmgCtx : null; if (typeof dmgCtx !== 'undefined') dmgCtx = 'fogo';
    try { hurtPlayer(Math.max(1, Math.round((DG_GOLD.dmg || dgBaseDmg(8)) * 0.5)), pl.x + pl.w / 2 - pl.facing * 50, null, true); } finally { if (typeof dmgCtx !== 'undefined') dmgCtx = o; }
    burst(pl.x + pl.w / 2, pl.y + pl.h - 2, 5, '#ffd050', 40, -30, 0.3, 1, true);
  }
});
// o derretido conta como tocado também por baixo dos pés
{ const _tt = touchingTile; touchingTile = function (e, t) {
  if (t === DG_OURO_QUENTE && e === pl) { const y = Math.floor((pl.y + pl.h + 1) / T), x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + pl.w - 0.001) / T); for (let x = x0; x <= x1; x++) if (tileAt(x, y) === DG_OURO_QUENTE) return true; }
  return _tt(e, t);
}; }
// minerar ouro solto: 1 vez em 20, uma Moeda Antiga além da moeda comum
{ const _bt = breakTile; breakTile = function (tx, ty) {
  const t = tileAt(tx, ty);
  const r = _bt(tx, ty);
  if (t === DG_OURO_SOLTO && Math.random() < 0.05) dropLoot((tx + 0.5) * T, (ty + 1) * T - 1, 'moeda_antiga', 1, true);
  return r;
}; }
// o tremor do aviso desenhado por cima do ouro: os blocos da área sacodem um pixel
HOOK.drawTop.push((cx, cy) => {
  if (!DRAGAO || !DG_GOLD.quakes.length) return;
  for (const q of DG_GOLD.quakes) {
    if (q.t <= 0) continue;
    lc.fillStyle = '#fff0a0';
    for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) {
      if (tileAt(x, y) !== DG_OURO_SOLTO || tileAt(x, y - 1) === DG_OURO_SOLTO) continue;
      const sx = x * T - cx, sy = y * T - cy; if (sx < -T || sy < -T || sx > VW || sy > VH) continue;
      const j = Math.round(Math.sin(gameTime * 50 + x * 1.7 + y) * 1);
      lc.globalAlpha = 0.6; lc.fillRect(sx + 1 + j, sy, T - 2, 1); lc.globalAlpha = 1;
    }
  }
});

/* ---------- o fio de armadilha: rompido, solta pedras do teto em volta (a sombra no chão 0,6 s antes) ---------- */
const dgPxDx = (a, b) => { const W = WW * T; return ((a - b) % W + W * 1.5) % W - W / 2; };
const dgRocks = [];
let dgFioCD = 0;
function dgTrip(tx, ty) {
  setTile(tx, ty, AIR); sfx.tink(); burst((tx + 0.5) * T, (ty + 0.7) * T, 5, '#e8a85a', 50, 100, 0.3, 1, true);
  const n = 3 + (Math.random() < 0.5 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const x = tx + Math.round((k - (n - 1) / 2) * 1.6 + rnd(-0.6, 0.6));
    let c = ty - 1; while (c > ty - 12 && !solidAt(x, c)) c--;
    if (!solidAt(x, c)) continue;
    let f = ty; while (f < ty + 6 && !solidAt(x, f + 1)) f++;
    dgRocks.push({ x: (x + 0.5) * T, y: (c + 1) * T, vy: 0, wait: 0.6 + k * 0.08, fy: (f + 1) * T, sz: 3 + ((Math.random() * 3) | 0), hit: false });
  }
}
HOOK.update.push(dt => {
  if (!DRAGAO || state !== 'play') return;
  dgFioCD -= dt;
  if (pl && !pl.dead && dgFioCD <= 0 && touchingTile(pl, DG_FIO)) {
    const y0 = Math.floor(pl.y / T), y1 = Math.floor((pl.y + pl.h - 0.001) / T), x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + pl.w - 0.001) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === DG_FIO) { dgTrip(x, y); dgFioCD = 0.3; }
  }
  for (let k = dgRocks.length - 1; k >= 0; k--) {
    const r = dgRocks[k];
    if (r.wait > 0) { r.wait -= dt; if (Math.random() < dt * 20) parts.push({ x: r.x + rnd(-3, 3), y: r.y, vx: 0, vy: 20, g: 200, life: 0.4, max: 0.4, col: '#8a7c72', size: 1 }); continue; }
    r.vy = Math.min(420, r.vy + 900 * dt); r.y += r.vy * dt;
    if (!r.hit && pl && !pl.dead && Math.abs(dgPxDx(r.x, pl.x + pl.w / 2)) < pl.w / 2 + r.sz && r.y > pl.y && r.y - r.sz < pl.y + pl.h) {
      r.hit = true; hurtPlayer(dgBaseDmg(18), pl.x + pl.w / 2 - pl.facing * 50, null, true); shake(2);
    }
    if (r.y >= r.fy || solidAt(Math.floor(r.x / T), Math.floor(r.y / T))) { burst(r.x, Math.min(r.y, r.fy) - 2, 7, '#6e625a', 60, 300, 0.4); sfx.dug(); dgRocks.splice(k, 1); }
  }
});
HOOK.drawTop.push((cx, cy) => {
  if (!dgRocks.length) return;
  for (const r of dgRocks) {
    const x = Math.round(r.x - cx), y = Math.round(r.y - cy);
    if (r.wait > 0) {   // a sombra cresce no chão
      const f = 1 - Math.max(0, r.wait) / 0.6, w = Math.round(2 + f * r.sz * 2);
      lc.globalAlpha = 0.25 + f * 0.35; lc.fillStyle = '#000000'; lc.fillRect(Math.round(r.x - cx) - w, Math.round(r.fy - cy) - 1, w * 2, 2); lc.globalAlpha = 1;
      continue;
    }
    lc.fillStyle = '#2a2422'; lc.fillRect(x - r.sz, y - r.sz * 2, r.sz * 2, r.sz * 2);
    lc.fillStyle = '#6e625a'; lc.fillRect(x - r.sz + 1, y - r.sz * 2 + 1, r.sz * 2 - 2, r.sz * 2 - 2);
    lc.fillStyle = '#a89a8e'; lc.fillRect(x - r.sz + 1, y - r.sz * 2 + 1, r.sz, 1);
  }
});

/* ---------- os estados do herói: pés presos, puxado, agarrado ---------- */
const DG_MOVE_KEYS = ['KeyA', 'KeyD', 'KeyW', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!DRAGAO || !pl || pl.dead) { if (pl && pl.dead) { pl.dgPresoT = 0; pl.dgPuxT = 0; pl.dgAgarT = 0; pl.dgPuxE = null; pl.dgAgarE = null; } return _up(dt); }
  const preso = (pl.dgPresoT || 0) > 0, pux = (pl.dgPuxT || 0) > 0, agar = (pl.dgAgarT || 0) > 0 && pl.dgAgarE && !pl.dgAgarE.dead;
  const lock = preso || pux || agar, saved = {};
  if (lock) for (const k of DG_MOVE_KEYS) { saved[k] = keys[k]; keys[k] = false; }
  try { _up(dt); } finally { if (lock) for (const k of DG_MOVE_KEYS) keys[k] = saved[k]; }
  if (pl.dead) return;
  if (preso) { pl.dgPresoT = Math.max(0, pl.dgPresoT - dt); if (pl.onGround) pl.vx = 0; }
  // puxado: a língua arrasta o herói até a boca do camaleão (o 274 solta com dgSoltar quando apanha ou morre)
  if (pux) {
    pl.dgPuxT -= dt;
    const E = pl.dgPuxE; if (E && E.dead) { dgSoltar(E); }
    else {
      const tx = pl.dgPuxX, ty = pl.dgPuxY, dx = dgPxDx(tx, pl.x + pl.w / 2), dy = ty - (pl.y + pl.h / 2), d = Math.hypot(dx, dy);
      if (d < 8) pl.dgPuxT = 0;
      else { const vx = pl.vx, vy = pl.vy, s = Math.min(pl.dgPuxF, d / dt); pl.vx = dx / d * s; pl.vy = dy / d * s; moveEntity(pl, dt, false); pl.vx = vx * 0.2; pl.vy = Math.min(vy, 0); }
    }
  }
  // agarrado: vai pendurado nas patas da serpe, sem gravidade; bater nela solta (o 274 chama dgSoltar)
  if ((pl.dgAgarT || 0) > 0) {
    const E = pl.dgAgarE; pl.dgAgarT -= dt;
    if (!E || E.dead) dgSoltar(E);
    else {
      const tx = E.x + E.w / 2, ty = E.y + E.h + pl.h / 2 - 2, dx = dgPxDx(tx, pl.x + pl.w / 2), dy = ty - (pl.y + pl.h / 2);
      pl.vx = dx / Math.max(dt, 0.001); pl.vy = dy / Math.max(dt, 0.001);
      const m = 600; pl.vx = clamp(pl.vx, -m, m); pl.vy = clamp(pl.vy, -m, m);
      moveEntity(pl, dt, false); pl.vx = E.vx || 0; pl.vy = 0;
    }
    if (pl.dgAgarT <= 0) dgSoltar(E);
  }
}; }
// a morte e o portal soltam tudo
HOOK.update.push(() => { if (pl && (pl.dead || state !== 'play')) { if (pl.dgPuxE || pl.dgAgarE) dgSoltar(); } });
HOOK.drawTop.push((cx, cy) => {
  if (!DRAGAO || !pl || pl.dead) return;
  const px = Math.round(pl.x + pl.w / 2 - cx), fy = Math.round(pl.y + pl.h - cy);
  if ((pl.dgPresoT || 0) > 0) {   // a crosta de ouro endurecido em volta dos pés
    lc.fillStyle = '#7a5410'; lc.fillRect(px - 6, fy - 4, 12, 4);
    lc.fillStyle = '#d8a830'; lc.fillRect(px - 5, fy - 4, 10, 2);
    lc.fillStyle = '#fff0a0'; lc.fillRect(px - 4, fy - 4, 3, 1); lc.fillRect(px + 2, fy - 3, 1, 1);
  }
});
