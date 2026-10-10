'use strict';

/* ================= escolas de raio e gelo em jogo (dados e ícones em js/114-escolas-dados.js) =================
   O que é comum às duas escolas e os quatro feitiços novos de raio. Os de gelo ficam em js/116-gelo.js.
   - Jogo novo: o herói já começa sabendo os cinco de raio (com o Arco Voltaico) e os cinco de gelo (com a Nevasca),
     no lugar dos pergaminhos lacrados do Arco e da Nevasca. Saves antigos não mudam.
   - Pergaminhos dos feitiços novos: botão direito identifica, botão direito de novo aprende (como os de fogo).
   - Todo golpe passa por hitEnemy com `escRoll` marcado: dano de ESC, vezes (1 + pl.spellPct), número na cor do elemento.
     Só fere o que o feitiço toca de fato: o risco do raio, o anel, a bola, a lasca.
   - Passo do Trovão teleporta o herói; a Essência Estática (chave pararaios) fica parada no ar e pulsa choques em quem chega perto.
   - Raio: chance de atordoar por um instante (choque). Gelo: resfria e soma para congelar (regras da Nevasca, js/68).
   - Afinidade: bichos de frio levam metade do gelo e bichos de fogo 50% a mais (DMG_KIND de js/101).
   Carrega depois de 113-fogo (embrulha newWorld, quickAction, tipHTML, rollPlayerDmg e floatText). */

let escRoll = null, escElem = null;
const escCD = {};
const ESC_CAST = {};   // ESC_CAST[k] = função que lança (raio aqui, gelo em js/116)
const rzStrikes = [], rzLances = [], rzDashes = [], rzCores = [];

{ const _roll = rollPlayerDmg; rollPlayerDmg = function () { return escRoll ? (escRoll[0] + Math.random() * (escRoll[1] - escRoll[0] + 1) - 0.01) * (1 + (pl.spellPct || 0)) : _roll(); }; }
{ const _ft = floatText; floatText = function (x, y, text, col, size) { return _ft(x, y, text, escElem && (col === '#ffffff' || col === undefined) ? SPELL_ELEM[escElem].col : col, size); }; }

sfx.rzCast = function () { noise(0.12, 0.1, 3800, 'highpass', 0, 1); tone(880, 0.1, 'square', 0.025, 600); };
sfx.rzThunder = function () { noise(0.08, 0.3, 5000, 'highpass', 0, 0.8); noise(0.9, 0.3, 160, 'lowpass', 0.04, 0.6); tone(55, 0.6, 'sawtooth', 0.05, -20, 0.05); };
sfx.rzZap = function () { noise(0.06, 0.08, 4200, 'bandpass', 0, 2); tone(1400 + Math.random() * 600, 0.05, 'square', 0.015, -500); };

/* ---- jogo novo: as duas escolas já aprendidas ---- */
{
  const _newWorld = newWorld;
  const RZ_OLD = { feitico_esfera: 'feitico_pararaios', feitico_nova_raio: 'feitico_passo', perg_esfera: 'perg_pararaios', perg_nova_raio: 'perg_passo', perg_selado_esfera: 'perg_selado_pararaios', perg_selado_nova_raio: 'perg_selado_passo' };
  newWorld = function (sd, sv) {
    // a Esfera Elétrica e a Nova Elétrica viraram Essência Estática e Passo do Trovão: saves de antes trocam de item
    if (sv && Array.isArray(sv.inv)) for (const q of sv.inv) if (Array.isArray(q) && RZ_OLD[q[0]]) q[0] = RZ_OLD[q[0]];
    _newWorld(sd, sv);
    for (const a of [rzStrikes, rzLances, rzDashes, rzCores]) a.length = 0;
    if (sv && Array.isArray(sv.inv)) return;
    // o Arco e a Nevasca, que vinham lacrados, já vêm aprendidos no mesmo lugar
    for (const [seal, spell] of [['perg_selado', 'feitico_arco'], ['perg_selado_n', 'feitico_nevasca']]) {
      const i = inv.findIndex(q => q && q.id === seal); if (i >= 0) inv[i] = mkItem(spell);
    }
    for (const id of [...ESC_SCHOOL.raio, ...ESC_SCHOOL.gelo]) {
      if (!ITEMS[id] || inv.some(q => q && q.id === id)) continue;
      let i = inv.findIndex((q, j) => !q && j < HB_BAG); if (i < 0) i = inv.findIndex(q => !q);
      if (i >= 0) inv[i] = mkItem(id);
    }
    invDirty = true; if (typeof hudCache !== 'undefined') hudCache.hb = null;
  };
}

/* ---- identificar, aprender e a dica ---- */
function escLearn(i, k) {
  const id = 'feitico_' + k;
  if (inv.some(q => q && q.id === id)) { toast('Você já conhece esse feitiço'); bad(null); return; }
  inv[i] = null;
  let s = i; if (s >= HB_BAG) { const f = inv.findIndex((q, j) => !q && j < HB_BAG); if (f >= 0) s = f; }
  inv[s] = mkItem(id);
  sfx.learn(); toast('Feitiço aprendido: ' + ITEMS[id].name, 'gold', RAR_COL[2]);
  burst(pl.x + pl.w / 2, pl.y + 8, 22, SPELL_ELEM[ESC_ELEM[k]].col, 70, -40, 0.7, 1, true);
  changed(false); hudCache.hb = null;
}
{
  const _quickAction = quickAction;
  quickAction = function (r) {
    const s = r && r.k === 'inv' ? inv[r.i] : null, k = s && escKey(s.id);
    if (!k || ESC_SPELL[s.id] || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _quickAction(r);
    hideTip();
    if (ESC_SEAL[s.id]) { inv[r.i] = mkItem('perg_' + k); sfx.rare(); toast('Identificado: ' + ITEMS['perg_' + k].name, 'gold', RAR_COL[2]); changed(false); hudCache.hb = null; return; }
    escLearn(r.i, k);
  };
  const _tipHTML = tipHTML;
  tipHTML = function (s, r, act2) {
    const it = ITEMS[s.id], k = escKey(s.id);
    if (!k) return _tipHTML(s, r, act2);
    const rar = itemRar(s), act = act2 != null ? act2 : '', el = SPELL_ELEM[ESC_ELEM[k]].name;
    const type = it.spell ? `Feitiço de ${el} · ${RAR[rar]}` : it.scroll === 1 ? 'Pergaminho · Não identificado' : `Pergaminho de ${el} · ${RAR[rar]}`;
    const lines = it.scroll === 1 ? '' : '<ul>' + escTipLines(k).map(([a, b]) => `<li><span>${a}</span><b${a === 'Mana' ? ' style="color:#7fb8ff"' : ''}>${b}</b></li>`).join('') + '</ul>';
    return `<span class="tn" style="color:${RAR_COL[rar]}">${it.name}</span><small>${type}</small>${lines}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
  };
}

/* ---- ferir ---- */
const escAlive = e => !e.dead && !(e.boss && e.state === 'intro') && !(e.type === 'ghost' && e.vis < 0.5);
const escTouch = (e, x, y, pad = 1) => x > e.x - pad && x < e.x + e.w + pad && y > e.y - pad && y < e.y + e.h + pad;
function escAff(e, elem) {
  const kd = typeof DMG_KIND !== 'undefined' ? DMG_KIND[e.type] : null;
  if (elem !== 'gelo' || !kd) return 1;
  return kd === 'frio' ? ESC.weakSame : kd === 'fogo' ? ESC.weakOpp : 1;
}
// o frio dos feitiços de gelo: as mesmas regras da Nevasca, somando `stacks` de uma vez
function escChill(e, stacks) {
  if (typeof NEV === 'undefined') return;
  e.nevChillT = NEV.chill;
  if ((e.nevFrz || 0) > 0) return;
  e.nevN = (e.nevN || 0) + stacks;
  if (!e.boss && e.nevN >= NEV.freezeAt && !((e.nevImm || 0) > 0)) {
    e.nevN = 0; e.nevFrz = NEV.freeze; e.nevSeed = Math.floor(Math.random() * 1e6);
    sfx.nevFreeze(); floatText(e.x + e.w / 2, e.y - 10, 'CONGELADO', '#a8dcf4', 0.9);
    burst(e.x + e.w / 2, e.y + e.h / 2, 12, '#e8f8ff', 70, 0, 0.45, 1, true);
  }
}
// soft: fere sem empurrar, sem atordoar, sem segurar o tempo e sem o som de pancada
function escHit(e, S, elem, dir, soft) {
  if (!escAlive(e)) return false;
  const hp = e.hp, vx = e.vx, vy = e.vy, st = e.stun, hs = hitstop, sk = shk.m, hit = sfx.hit;
  if (soft) sfx.hit = function () { };
  escRoll = [S.min, S.max]; escElem = elem;
  try { hitEnemy(e, dir, escAff(e, elem), false); } finally { escRoll = null; escElem = null; sfx.hit = hit; }
  if (e.dead) return true;
  if (soft) { hitstop = hs; shk.m = Math.max(sk, Math.min(shk.m, 0.8)); e.vx = vx; e.vy = vy; e.stun = st; }
  if (e.hp >= hp) return false;
  if (elem === 'raio') {
    const st2 = S.stun || (Math.random() < ESC.shock.chance ? ESC.shock.stun : 0);
    if (st2) { e.stun = Math.max(e.stun || 0, e.boss ? st2 * 0.3 : st2); burst(e.x + e.w / 2, e.y + e.h / 2, 6, '#bfe6ff', 60, 0, 0.3, 1, true); }
  } else if (elem === 'gelo') escChill(e, S.stacks || 1);
  return true;
}

/* ---- raio: lançar ---- */
function rzCeil(x, fy, max) {   // o teto acima de um ponto (ou o alto, se não houver)
  const tx = Math.floor(x / T); let ty = Math.floor((fy - 2) / T);
  for (let k = 0; k < max; k++, ty--) if (solidAt(tx, ty - 1)) return ty * T;
  return fy - max * T;
}
ESC_CAST.relampago = S => {
  const [tx, ty] = fgAim(S.reach), fy = fgFloor(tx, ty), bot = fy != null ? fy : ty, top = rzCeil(tx, bot, 12);
  rzStrikes.push({ x: tx, top, bot, t: 0, done: false });
};
ESC_CAST.lanca_raio = S => {
  const [hx, hy] = handXY(), [mx, my] = mouseWorld(); if (Math.abs(mx - (pl.x + pl.w / 2)) > 2) pl.facing = mx > pl.x + pl.w / 2 ? 1 : -1;
  const a = Math.atan2(my - hy, mx - hx);
  rzLances.push({ x: hx, y: hy, vx: Math.cos(a) * S.spd, vy: Math.sin(a) * S.spd, t: 0, life: S.len / S.spd, hit: new Set(), trail: [[hx, hy]] });
};
// o herói cabe em (x, y)?
const rzFits = (x, y) => { for (let tx = Math.floor(x / T); tx <= Math.floor((x + pl.w - 0.01) / T); tx++) for (let ty = Math.floor(y / T); ty <= Math.floor((y + pl.h - 0.01) / T); ty++) if (solidAt(tx, ty)) return false; return true; };
ESC_CAST.passo = S => {
  const [mx, my] = mouseWorld(), x0 = pl.x, y0 = pl.y, dx = mx - (pl.x + pl.w / 2), dy = my - (pl.y + pl.h / 2), d = Math.hypot(dx, dy);
  if (d < 6) return false;
  const L = Math.min(d, S.reach), ux = dx / d, uy = dy / d;
  let x = x0, y = y0;
  for (let s = 2; s <= L; s += 2) { const nx = x0 + ux * s, ny = y0 + uy * s; if (!rzFits(nx, ny)) break; x = nx; y = ny; }
  if (Math.hypot(x - x0, y - y0) < 6) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem espaço', '#8fd0ff', 0.8); sfx.bad(); escCD.passo = 0.3; return false; }
  const ax = x0 + pl.w / 2, ay = y0 + pl.h / 2, bx = x + pl.w / 2, by = y + pl.h / 2;
  // tudo que o corpo do herói atravessou leva o raio
  const hit = new Set();
  for (let s = 0, n = Math.ceil(Math.hypot(bx - ax, by - ay) / 3); s <= n; s++) {
    const px = ax + (bx - ax) * s / n, py = ay + (by - ay) * s / n;
    for (const e of enemies) if (!hit.has(e) && escAlive(e) && e.x < px + pl.w / 2 && e.x + e.w > px - pl.w / 2 && e.y < py + pl.h / 2 && e.y + e.h > py - pl.h / 2) hit.add(e);
  }
  for (const e of hit) escHit(e, S, 'raio', Math.sign(bx - ax) || 1, false);
  pl.x = x; pl.y = y; pl.vx = ux * 60; pl.vy = Math.min(0, uy * 60); pl.invuln = Math.max(pl.invuln || 0, S.inv);
  if (Math.abs(dx) > 2) pl.facing = dx > 0 ? 1 : -1;
  for (let k = 0; k < 3; k++) { const a = arcBolt([[ax, ay + rnd(-6, 6)], [(ax + bx) / 2 + rnd(-4, 4), (ay + by) / 2 + rnd(-6, 6)], [bx, by + rnd(-6, 6)]]); a.life = 0.28; arcs.push(a); }
  rzDashes.push({ ax, ay, bx, by, t: 0 });
  burst(ax, ay, 14, '#8fd0ff', 90, 0, 0.35, 1, true); burst(bx, by, 18, '#bfe6ff', 110, 0, 0.4, 1, true);
  shake(2); sfx.rzThunder();
};
ESC_CAST.pararaios = S => {
  let [tx, ty] = fgAim(S.reach);
  for (let k = 0; k < 24 && solidAt(Math.floor(tx / T), Math.floor(ty / T)); k++) ty -= 2;   // dentro da rocha, sobe até o ar
  if (solidAt(Math.floor(tx / T), Math.floor(ty / T))) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem espaço', '#8fd0ff', 0.8); sfx.bad(); escCD.pararaios = 0.3; return false; }
  for (const c of rzCores) burst(c.x, c.y, 12, '#8fd0ff', 60, 0, 0.3, 1, true);
  rzCores.length = 0;
  rzCores.push({ x: tx, y: ty, t: 0, pulse: 0.3, flash: 0, idle: 0, seed: Math.random() * 99 | 0 });
  burst(tx, ty, 16, '#bfe6ff', 90, 0, 0.35, 1, true);
};
function escCast(k) {
  const S = ESC[k];
  if (ESC_CAST[k](S) === false) return;
  pl.mana -= S.cost; escCD[k] = S.cd; pl.useT = 0.28;
  if (ESC_ELEM[k] === 'raio' && k !== 'passo') sfx.rzCast(); else if (ESC_ELEM[k] === 'gelo' && sfx.glCast) sfx.glCast(k);
}

/* ---- a cada quadro ---- */
const rzPart = (x, y, sp) => parts.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp, sp), g: 0, life: rnd(0.12, 0.3), max: 0.3, col: Math.random() < 0.5 ? '#bfe6ff' : '#5aa8ff', size: 1, glow: true });
// uma novidade comum às duas escolas: o anel que sai do herói e fere quem a borda toca
function escNovaUpdate(arr, dt) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const n = arr[i], S = n.S; n.t += dt;
    if (n.t >= S.grow + 0.25) { arr.splice(i, 1); continue; }
    const r = S.r * Math.min(1, n.t / S.grow);
    for (const e of enemies) {
      if (n.hit.has(e) || !escAlive(e)) continue;
      const nx = clamp(n.x, e.x, e.x + e.w), ny = clamp(n.y, e.y, e.y + e.h);
      if (Math.hypot(nx - n.x, ny - n.y) > r || !losClear(n.x, n.y, e.x + e.w / 2, e.y + e.h / 2)) continue;
      n.hit.add(e);
      const dir = e.x + e.w / 2 >= n.x ? 1 : -1;
      escHit(e, S, n.elem, dir, !S.push);
    }
  }
}
HOOK.update.push(dt => {
  for (const k in escCD) escCD[k] -= dt;
  // relâmpagos
  for (let i = rzStrikes.length - 1; i >= 0; i--) {
    const s = rzStrikes[i], S = ESC.relampago; s.t += dt;
    if (!s.done && Math.random() < dt * 30) rzPart(s.x + rnd(-6, 6), s.top + rnd(0, 6), 30);   // o alto chiando antes de cair
    if (!s.done && s.t >= S.delay) {
      s.done = true;
      for (let k = 0; k < 2; k++) { const a = arcBolt([[s.x + rnd(-3, 3), s.top], [s.x + rnd(-6, 6), (s.top + s.bot) / 2], [s.x, s.bot]]); a.life = 0.32; arcs.push(a); }
      for (const e of enemies) if (escAlive(e) && e.x - S.w < s.x && e.x + e.w + S.w > s.x && e.y + e.h > s.top && e.y < s.bot) escHit(e, S, 'raio', 0, false);
      burst(s.x, s.bot - 1, 18, '#bfe6ff', 120, 300, 0.4, 1, true); burst(s.x, s.bot - 1, 8, '#ffffff', 60, 0, 0.2, 1, true);
      shake(3); sfx.rzThunder();
    }
    if (s.t >= S.delay + 0.35) rzStrikes.splice(i, 1);
  }
  // lanças de raio: atravessam todo mundo que tocam
  for (let i = rzLances.length - 1; i >= 0; i--) {
    const l = rzLances[i]; l.t += dt; let end = l.t >= l.life;
    const n = Math.max(1, Math.ceil(Math.hypot(l.vx, l.vy) * dt / 3));
    for (let s = 0; s < n && !end; s++) {
      const nx = l.x + l.vx * dt / n, ny = l.y + l.vy * dt / n;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { end = true; break; }
      l.x = nx; l.y = ny;
      for (const e of enemies) if (!l.hit.has(e) && escAlive(e) && escTouch(e, l.x, l.y, 2)) { l.hit.add(e); escHit(e, ESC.lanca_raio, 'raio', l.vx >= 0 ? 1 : -1, true); burst(l.x, l.y, 6, '#bfe6ff', 70, 0, 0.25, 1, true); }
    }
    l.trail.push([l.x, l.y]); if (l.trail.length > 6) l.trail.shift();
    if (Math.random() < dt * 40) rzPart(l.x, l.y, 25);
    if (end) { burst(l.x, l.y, 8, '#8fd0ff', 60, 0, 0.3, 1, true); rzLances.splice(i, 1); }
  }
  // rastro do Passo do Trovão
  for (let i = rzDashes.length - 1; i >= 0; i--) { rzDashes[i].t += dt; if (rzDashes[i].t >= 0.35) rzDashes.splice(i, 1); }
  // essência estática: parada no ar, pulsa choques em até n bichos perto; cada choque é um raio que encosta no bicho
  for (let i = rzCores.length - 1; i >= 0; i--) {
    const c = rzCores[i], S = ESC.pararaios; c.t += dt; c.pulse -= dt; c.flash -= dt; c.idle -= dt;
    if (c.t >= S.dur) { burst(c.x, c.y, 20, '#8fd0ff', 100, 0, 0.45, 1, true); burst(c.x, c.y, 8, '#ffffff', 50, 0, 0.25, 1, true); sfx.rzZap(); rzCores.splice(i, 1); continue; }
    const cy = c.y + Math.sin(c.t * 3) * 1.5;
    if (Math.random() < dt * 10) rzPart(c.x + rnd(-5, 5), cy + rnd(-5, 5), 22);
    if (c.idle <= 0) {   // fiapos soltos chiando em volta, sem ferir
      c.idle = rnd(0.12, 0.3); const a = Math.random() * Math.PI * 2, l = rnd(8, 16);
      const b = arcBolt([[c.x, cy], [c.x + Math.cos(a) * l, cy + Math.sin(a) * l]]); b.life = 0.07; arcs.push(b);
    }
    if (c.pulse > 0) continue;
    const near = enemies.filter(e => escAlive(e)).map(e => [e, Math.hypot(clamp(c.x, e.x, e.x + e.w) - c.x, clamp(cy, e.y, e.y + e.h) - cy)])
      .filter(([e, d]) => d <= S.range && losClear(c.x, cy, e.x + e.w / 2, e.y + e.h / 2)).sort((a, b) => a[1] - b[1]).slice(0, S.n);
    if (!near.length) { c.pulse = 0.08; continue; }
    c.pulse = S.pulse; c.flash = 0.14;
    for (const [e] of near) { const b = arcBolt([[c.x, cy], [e.x + e.w / 2, e.y + e.h / 2]]); b.life = 0.16; arcs.push(b); escHit(e, S, 'raio', 0, true); }
    sfx.rzZap();
  }

  // o feitiço na mão
  const held = heldBag(), k = held && ESC_SPELL[held.s.id];
  if (!k || pl.dead || pl.bat) return;
  const raio = ESC_ELEM[k] === 'raio';
  if (Math.random() < dt * 7) { const [hx, hy] = handXY(); parts.push({ x: hx + rnd(-1, 1), y: hy + rnd(-1, 2), vx: rnd(-10, 10), vy: rnd(-24, -6), g: 0, life: 0.28, max: 0.28, col: raio ? (Math.random() < 0.5 ? '#bfe6ff' : '#5aa8ff') : (Math.random() < 0.5 ? '#ffffff' : '#a8dcf4'), size: 1, glow: true }); }
  if (!mouse.l || (escCD[k] || 0) > 0 || pl.atkT >= 0 || pl.shieldK >= 0.35 || pl.stunT > 0) return;
  if (pl.mana < ESC[k].cost) { if (mouse.lPressed) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem mana', '#7fb8ff', 0.8); sfx.bad(); } escCD[k] = 0.25; return; }
  escCast(k);
});

/* ---- raio: desenho ---- */
let rzG = null;
HOOK.drawGlow.push((cx, cy) => {
  if (!(rzStrikes.length || rzLances.length || rzDashes.length || rzCores.length)) return;
  if (!rzG) rzG = { s: glow(6, '#5aa8ff'), m: glow(14, '#4a9cff'), b: glow(34, '#5aa8ff') };
  lc.globalCompositeOperation = 'lighter';
  const at = (g, x, y, a) => { lc.globalAlpha = a; lc.drawImage(g, Math.round(x) - cx - g.width / 2, Math.round(y) - cy - g.height / 2); };
  for (const s of rzStrikes) { if (s.done) { const k = 1 - (s.t - ESC.relampago.delay) / 0.35; at(rzG.b, s.x, s.bot - 6, 0.9 * k); for (let y = s.top; y < s.bot; y += 14) at(rzG.m, s.x, y, 0.35 * k); } else at(rzG.s, s.x, s.top + 3, 0.6); }
  for (const l of rzLances) at(rzG.m, l.x, l.y, 0.8);
  for (const d of rzDashes) { const k = 1 - d.t / 0.35; for (let s = 0; s <= 6; s++) at(rzG.m, d.ax + (d.bx - d.ax) * s / 6, d.ay + (d.by - d.ay) * s / 6, 0.45 * k); }
  for (const c of rzCores) { const y = c.y + Math.sin(c.t * 3) * 1.5; at(rzG.m, c.x, y, 0.3 + 0.08 * Math.sin(gameTime * 23)); if (c.flash > 0) at(rzG.b, c.x, y, 0.45 * c.flash / 0.14); }
  lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
});
HOOK.drawTop.push((cx, cy) => {
  const px = (x, y, c) => { lc.fillStyle = c; lc.fillRect(Math.round(x) - cx, Math.round(y) - cy, 1, 1); };
  // o alto chiando antes do relâmpago: uma nuvenzinha de faíscas
  for (const s of rzStrikes) if (!s.done) { const f = Math.floor(s.t * 24); for (let i = -5; i <= 5; i++) { const g = hash2(i, f, 3); if (g < 0.5) px(s.x + i, s.top + 1 + Math.floor(g * 4), g < 0.15 ? '#ffffff' : g < 0.3 ? '#bfe6ff' : '#2f5fd0'); } }
  // lanças: um risco com miolo branco e rabo que se apaga
  for (const l of rzLances) {
    for (let i = 0; i < l.trail.length - 1; i++) {
      const [ax, ay] = l.trail[i], [bx, by] = l.trail[i + 1], k = (i + 1) / l.trail.length;
      arcLine(ax - cx + rnd(-1, 1), ay - cy + rnd(-1, 1), bx - cx, by - cy, (x, y) => { lc.fillStyle = k > 0.6 ? '#bfe6ff' : '#2f6fe0'; lc.fillRect(x, y, 1, 1); });
    }
    lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(l.x) - cx - 1, Math.round(l.y) - cy, 3, 1); lc.fillRect(Math.round(l.x) - cx, Math.round(l.y) - cy - 1, 1, 3);
  }
  // Passo do Trovão: a silhueta do herói fica para trás em riscos azuis que se apagam
  for (const d of rzDashes) {
    const k = d.t / 0.35, n = Math.ceil(Math.hypot(d.bx - d.ax, d.by - d.ay) / 4);
    for (let s = 0; s <= n; s++) {
      const q = s / n; if (q < k) continue;
      const x = d.ax + (d.bx - d.ax) * q, y = d.ay + (d.by - d.ay) * q;
      for (let j = -9; j <= 9; j += 3) if (hash2(s, j, Math.floor(d.t * 30)) < 0.55) px(x + (hash2(s, j, 4) - 0.5) * 6, y + j, hash2(s, j, 8) < 0.3 ? '#ffffff' : q > 0.7 ? '#bfe6ff' : '#5aa8ff');
    }
  }
  // essência estática: um nó de energia sem forma fixa (borda que ferve a cada quadro), miolo branco,
  // faíscas que giram em volta e pontas de raio que saltam para fora; no pulso ela incha e clareia
  for (const c of rzCores) {
    const S = ESC.pararaios, X = Math.round(c.x) - cx, Y = Math.round(c.y + Math.sin(c.t * 3) * 1.5) - cy, f = Math.floor(gameTime * 14);
    if (c.t > S.dur - 0.6 && Math.floor(c.t * 20) % 2) continue;
    const grow = Math.min(1, c.t / 0.2), fl = c.flash > 0 ? 1 : 0, R = (5.4 + fl * 1.5) * grow;
    for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
      const d = Math.hypot(i, j), a = Math.atan2(j, i), edge = R + (hash2(Math.round((a + Math.PI) * 2.2), f, c.seed) - 0.5) * 2.4;
      if (d > edge) continue;
      const q = d / Math.max(0.5, edge);
      lc.fillStyle = q < 0.3 + fl * 0.2 ? '#ffffff' : q < 0.6 ? '#bfe6ff' : q < 0.85 ? '#5aa8ff' : '#2f5fd0';
      lc.fillRect(X + i, Y + j, 1, 1);
    }
    for (let k = 0; k < 4; k++) {   // o coração: quatro braços de luz que giram dentro do nó, com um ponto escuro entre eles
      const a = c.t * 6 + k * Math.PI / 2;
      for (let s = 1; s <= Math.round(R * 0.75); s++) { lc.fillStyle = s < 3 ? '#ffffff' : '#e8f6ff'; lc.fillRect(X + Math.round(Math.cos(a) * s), Y + Math.round(Math.sin(a) * s), 1, 1); }
      const b = a + Math.PI / 4; lc.fillStyle = '#5aa8ff'; lc.fillRect(X + Math.round(Math.cos(b) * R * 0.5), Y + Math.round(Math.sin(b) * R * 0.5), 1, 1);
    }
    for (let k = 0; k < 3; k++) {   // faíscas em órbita, cada uma com um rabinho
      const a = c.t * (5 + k) + k * 2.1, r = 10 + k;
      for (let s = 0; s < 3; s++) { const b = a - s * 0.22; lc.fillStyle = s === 0 ? '#ffffff' : s === 1 ? '#8fd0ff' : '#2f5fd0'; lc.fillRect(X + Math.round(Math.cos(b) * r), Y + Math.round(Math.sin(b) * r * 0.75), 1, 1); }
    }
    for (let k = 0; k < 4; k++) {   // pontas de raio que nascem da borda e somem
      if (hash2(k, f, c.seed + 3) < 0.45) continue;
      let a = hash2(k, f, c.seed + 5) * Math.PI * 2, x = X + Math.cos(a) * R, y = Y + Math.sin(a) * R;
      for (let s = 0; s < 3 + fl * 2; s++) { a += (hash2(k * 7 + s, f, 9) - 0.5) * 1.6; x += Math.cos(a) * 1.6; y += Math.sin(a) * 1.6; lc.fillStyle = s < 2 ? '#bfe6ff' : '#5aa8ff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1); }
    }
  }
});
