'use strict';

/* ================= os feitiços de fogo em jogo (dados, números e ícones em js/112-fogo-dados.js) =================
   - Jogo novo: os cinco feitiços de fogo já aprendidos vão para a barra (o que não couber vai para a mochila).
   - Botão direito identifica, botão direito de novo aprende (o mesmo caminho do Arco Voltaico, js/64).
   - Com o feitiço na mão, o clique esquerdo lança na direção do mouse; o Inferno sopra enquanto o botão estiver apertado.
   - Todo golpe de fogo passa por hitEnemy com `fogoRoll` marcado: o dano vem de FOGO, cresce com o dano de feitiço
     das armas mágicas (pl.spellPct, js/92) e os números saem laranja. Golpes contínuos (sopro, parede, queimadura)
     não empurram nem atordoam. Fogo descongela quem a Nevasca congelou.
   - Afinidade: bichos de fogo (DMG_KIND de js/101-tipos-dano) levam metade e não queimam; bichos de frio levam 50% a mais.
   - Na dica, todo feitiço com elemento mostra "Feitiço de Fogo", "de Raio" ou "de Gelo".
   Carrega depois de 101-tipos-dano (embrulha newWorld, quickAction, tipHTML, rollPlayerDmg e floatText). */

let fogoRoll = null;   // [min, max] durante um golpe de fogo
const fgCD = { bola: 0, parede: 0, meteoro: 0, hidra: 0 };
const fgBalls = [], fgBolts = [], fgWalls = [], fgMeteors = [], fgHydras = [], fgFlames = [], fgBooms = [];
let fgBreathSnd = 0, fgFlameId = 1;

{ const _roll = rollPlayerDmg; rollPlayerDmg = function () { return fogoRoll ? (fogoRoll[0] + Math.random() * (fogoRoll[1] - fogoRoll[0] + 1) - 0.01) * (1 + (pl.spellPct || 0)) : _roll(); }; }
{ const _ft = floatText; floatText = function (x, y, text, col, size) { return _ft(x, y, text, fogoRoll && (col === '#ffffff' || col === undefined) ? SPELL_ELEM.fogo.col : col, size); }; }

sfx.fgCast = function () { noise(0.28, 0.16, 900, 'bandpass', 0, 0.8); tone(220, 0.22, 'sawtooth', 0.035, -130); };
sfx.fgBoom = function (big) { noise(big ? 0.75 : 0.4, big ? 0.34 : 0.24, 320, 'lowpass', 0, 0.7); tone(big ? 64 : 110, big ? 0.5 : 0.28, 'square', 0.06, -45); noise(0.18, 0.12, 2400, 'highpass', 0.02, 0.8); };
sfx.fgBreath = function () { noise(0.18, 0.07, 600 + Math.random() * 500, 'bandpass', 0, 0.6); };
sfx.fgSpit = function () { noise(0.12, 0.1, 1300, 'bandpass', 0, 1); tone(330, 0.09, 'triangle', 0.03, -160); };

/* ---- jogo novo: os cinco feitiços já aprendidos ---- */
{
  const _newWorld = newWorld;
  newWorld = function (sd, sv) {
    _newWorld(sd, sv);
    for (const a of [fgBalls, fgBolts, fgWalls, fgMeteors, fgHydras, fgFlames, fgBooms]) a.length = 0;
    if (sv && Array.isArray(sv.inv)) return;
    for (const [k] of FOGO_LIST) {
      let i = inv.findIndex((q, j) => !q && j < HB_BAG); if (i < 0) i = inv.findIndex(q => !q);
      if (i >= 0) inv[i] = mkItem('feitico_' + k);
    }
    invDirty = true; if (typeof hudCache !== 'undefined') hudCache.hb = null;
  };
}

/* ---- identificar e aprender ---- */
function fgLearn(i, k) {
  const id = 'feitico_' + k;
  if (inv.some(q => q && q.id === id)) { toast('Você já conhece esse feitiço'); bad(null); return; }
  inv[i] = null;
  let s = i; if (s >= HB_BAG) { const f = inv.findIndex((q, j) => !q && j < HB_BAG); if (f >= 0) s = f; }
  inv[s] = mkItem(id);
  sfx.learn(); toast('Feitiço aprendido: ' + ITEMS[id].name, 'gold', RAR_COL[2]);
  burst(pl.x + pl.w / 2, pl.y + 8, 22, '#ffa040', 70, -40, 0.7, 1, true);
  changed(false); hudCache.hb = null;
}
{
  const _quickAction = quickAction;
  quickAction = function (r) {
    const s = r && r.k === 'inv' ? inv[r.i] : null, k = s && fogoKey(s.id);
    if (!k || FOGO_SPELL[s.id] || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _quickAction(r);
    hideTip();
    if (FOGO_SEAL[s.id]) { inv[r.i] = mkItem('perg_' + k); sfx.rare(); toast('Identificado: ' + ITEMS['perg_' + k].name, 'gold', RAR_COL[2]); changed(false); hudCache.hb = null; return; }
    fgLearn(r.i, k);
  };
  // a dica: os números do feitiço de fogo; e o elemento no tipo de qualquer feitiço que tenha um
  const _tipHTML = tipHTML;
  tipHTML = function (s, r, act2) {
    const it = ITEMS[s.id], k = fogoKey(s.id);
    if (k) {
      const rar = itemRar(s), act = act2 != null ? act2 : '';
      const type = it.spell ? 'Feitiço · ' + RAR[rar] : it.scroll === 1 ? 'Pergaminho · Não identificado' : 'Pergaminho · ' + RAR[rar];
      const lines = it.scroll === 1 ? '' : '<ul>' + fogoTipLines(k).map(([a, b]) => `<li><span>${a}</span><b${a === 'Mana' ? ' style="color:#7fb8ff"' : ''}>${b}</b></li>`).join('') + '</ul>';
      return `<span class="tn" style="color:${RAR_COL[rar]}">${it.name}</span><small>${type}</small>${lines}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`.replace(/<small>(Feitiço|Pergaminho) · (?!Não)/, (m, w) => it.elem ? `<small>${w} de ${SPELL_ELEM[it.elem].name} · ` : m);
    }
    const h = _tipHTML(s, r, act2);
    return it && it.elem && SPELL_ELEM[it.elem] ? h.replace(/<small>(Feitiço|Pergaminho) · (?!Não)/, (m, w) => `<small>${w} de ${SPELL_ELEM[it.elem].name} · `) : h;
  };
}

/* ---- ferir com fogo ---- */
const fgAlive = e => !e.dead && !(e.boss && e.state === 'intro') && !(e.type === 'ghost' && e.vis < 0.5);
const fgKind = e => typeof DMG_KIND !== 'undefined' ? DMG_KIND[e.type] || null : null;
const fgAff = e => fgKind(e) === 'fogo' ? FOGO.weakFire : fgKind(e) === 'frio' ? FOGO.weakCold : 1;
function fgIgnite(e) {
  if (fgKind(e) === 'fogo') return;
  if (!(e.fgBurn > 0)) e.fgBurnT = FOGO.burn.tick;
  e.fgBurn = FOGO.burn.dur;
}
// soft: o golpe fere mas não empurra, não atordoa, não segura o tempo nem faz o som de pancada
function fgHit(e, F, dir, soft) {
  if (!fgAlive(e)) return false;
  const hp = e.hp, vx = e.vx, vy = e.vy, st = e.stun, hs = hitstop, sk = shk.m, hit = sfx.hit;
  if (soft) sfx.hit = function () { };
  fogoRoll = [F.min, F.max];
  try { hitEnemy(e, dir, fgAff(e), false); } finally { fogoRoll = null; sfx.hit = hit; }
  if (e.dead) return true;
  if (soft) { hitstop = hs; shk.m = Math.max(sk, Math.min(shk.m, 0.8)); e.vx = vx; e.vy = vy; e.stun = st; }
  if (e.hp >= hp) return false;
  if (e.nevFrz > 0) { e.nevFrz = 0; e.nevChillT = 0; e.nevN = 0; burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#e8f8ff', 60, -40, 0.4, 1, true); }   // o fogo derrete o gelo da Nevasca
  fgIgnite(e);
  return true;
}
function fgExplode(x, y, F, big) {
  for (const e of enemies) {
    if (!fgAlive(e)) continue;
    const nx = clamp(x, e.x, e.x + e.w), ny = clamp(y, e.y, e.y + e.h);
    if (Math.hypot(nx - x, ny - y) > F.r || !losClear(x, y, e.x + e.w / 2, e.y + e.h / 2)) continue;
    fgHit(e, F, e.x + e.w / 2 >= x ? 1 : -1, false);
  }
  fgBooms.push({ x, y, r: F.r, t: 0, life: big ? 0.55 : 0.38 });
  burst(x, y, big ? 34 : 18, '#ffb040', big ? 150 : 110, 120, 0.55, 1, true);
  burst(x, y, big ? 16 : 8, '#fff0b0', 80, 0, 0.3, 1, true);
  for (let k = 0; k < (big ? 10 : 5); k++) parts.push({ x: x + rnd(-6, 6), y: y + rnd(-4, 2), vx: rnd(-20, 20), vy: rnd(-40, -15), g: -15, life: rnd(0.8, 1.4), max: 1.4, col: Math.random() < 0.5 ? '#3a3036' : '#4a4046', size: 2, smoke: true });
  shake(big ? 5 : 2.4); sfx.fgBoom(big);
}

/* ---- mira e chão ---- */
function fgAim(reach) {
  const [mx, my] = mouseWorld(), sx = pl.x + pl.w / 2, sy = pl.y + 10, dx = mx - sx, dy = my - sy, d = Math.hypot(dx, dy), k = d > reach ? reach / d : 1;
  if (Math.abs(dx) > 2) pl.facing = dx > 0 ? 1 : -1;
  return [sx + dx * k, sy + dy * k];
}
// o topo do chão debaixo de (x, y), em pixels do mundo; se o ponto está dentro da rocha, sobe até achar ar
function fgFloor(x, y) {
  const tx = Math.floor(x / T); let ty = Math.floor(y / T);
  if (solidAt(tx, ty)) { for (let k = 0; k < 8 && solidAt(tx, ty); k++) ty--; return solidAt(tx, ty) ? null : (ty + 1) * T; }
  for (let k = 0; k < 16; k++, ty++) if (solidAt(tx, ty + 1)) return (ty + 1) * T;
  return null;
}
// as colunas de uma parede de chamas, cada uma no chão que tem debaixo dela
function fgWall(x, fy, w, F, dur) {
  const cols = [];
  for (let px = x - w / 2; px <= x + w / 2; px += 3) { const f = fgFloor(px, fy - 6); if (f != null && Math.abs(f - fy) <= 18) cols.push([px, f, Math.random() * 10]); }
  if (!cols.length) return false;
  fgWalls.push({ cols, F, t: 0, dur, tick: 0, x0: cols[0][0] - 2, x1: cols[cols.length - 1][0] + 2, seed: Math.random() * 100, low: F !== FOGO.parede });
  return true;
}
const handXY = () => [pl.x + pl.w / 2 + pl.facing * 6, pl.y + 9];

/* ---- lançar ---- */
function castFogo(k) {
  const F = FOGO[k];
  if (k === 'bola') {
    const [hx, hy] = handXY(), [mx, my] = mouseWorld(); if (Math.abs(mx - (pl.x + pl.w / 2)) > 2) pl.facing = mx > pl.x + pl.w / 2 ? 1 : -1;
    const a = Math.atan2(my - hy, mx - hx);
    fgBalls.push({ x: hx, y: hy, vx: Math.cos(a) * F.spd, vy: Math.sin(a) * F.spd, t: 0, life: F.reach / F.spd });
  } else if (k === 'parede') {
    const [tx, ty] = fgAim(F.reach), fy = fgFloor(tx, ty);
    if (fy == null || !fgWall(tx, fy, F.w, F, F.dur)) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem chão', '#ffa040', 0.8); sfx.bad(); fgCD[k] = 0.3; return; }
  } else if (k === 'meteoro') {
    const [tx, ty] = fgAim(F.reach), fy = fgFloor(tx, ty), ly = fy != null ? fy - 3 : ty, side = pl.facing;
    fgMeteors.push({ x0: tx - side * 90, y0: ly - 200, x1: tx, y1: ly, floor: fy, t: 0 });
  } else if (k === 'hidra') {
    const [tx, ty] = fgAim(F.reach), fy = fgFloor(tx, ty);
    if (fy == null) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem chão', '#ffa040', 0.8); sfx.bad(); fgCD[k] = 0.3; return; }
    while (fgHydras.length >= F.n) { const h = fgHydras.shift(); burst(h.x, h.y - 8, 10, '#ff8a1e', 50, -30, 0.4, 1, true); }
    fgHydras.push({ x: tx, y: fy, t: 0, shot: 0.45, face: pl.facing, open: 0, seed: Math.random() * 10 });
    burst(tx, fy - 2, 14, '#ffa040', 70, -60, 0.5, 1, true);
  }
  pl.mana -= F.cost; fgCD[k] = F.cd; pl.useT = 0.28; sfx.fgCast();
}

/* ---- a cada quadro ---- */
const fgBallHit = (x, y) => enemies.find(e => fgAlive(e) && x > e.x - 2 && x < e.x + e.w + 2 && y > e.y - 2 && y < e.y + e.h + 2);
HOOK.update.push(dt => {
  for (const k in fgCD) fgCD[k] -= dt;
  fgBreathSnd -= dt;
  // bolas de fogo
  for (let i = fgBalls.length - 1; i >= 0; i--) {
    const b = fgBalls[i]; b.t += dt;
    let boom = b.t >= b.life;
    const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3));
    for (let s = 0; s < n && !boom; s++) {
      const nx = b.x + b.vx * dt / n, ny = b.y + b.vy * dt / n;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { boom = true; break; }
      b.x = nx; b.y = ny; if (fgBallHit(b.x, b.y)) boom = true;
    }
    if (Math.random() < dt * 40) parts.push({ x: b.x + rnd(-1, 1), y: b.y + rnd(-1, 1), vx: -b.vx * 0.1 + rnd(-10, 10), vy: -b.vy * 0.1 + rnd(-14, 4), g: -20, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ffb040' : '#ff6a1a', size: 1, glow: true });
    if (boom) { fgExplode(b.x, b.y, FOGO.bola, false); fgBalls.splice(i, 1); }
  }
  // cuspidas da hidra
  for (let i = fgBolts.length - 1; i >= 0; i--) {
    const b = fgBolts[i]; b.t += dt; let end = b.t > 1.2;
    const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3));
    for (let s = 0; s < n && !end; s++) {
      const nx = b.x + b.vx * dt / n, ny = b.y + b.vy * dt / n;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { end = true; break; }
      b.x = nx; b.y = ny; const e = fgBallHit(b.x, b.y); if (e) { fgHit(e, FOGO.hidra, b.vx >= 0 ? 1 : -1, false); end = true; }
    }
    if (Math.random() < dt * 30) parts.push({ x: b.x, y: b.y, vx: rnd(-8, 8), vy: rnd(-12, 2), g: -10, life: 0.22, max: 0.22, col: '#ffa040', size: 1, glow: true });
    if (end) { burst(b.x, b.y, 6, '#ffb040', 50, 40, 0.3, 1, true); fgBolts.splice(i, 1); }
  }
  // paredes e chão em chamas
  for (let i = fgWalls.length - 1; i >= 0; i--) {
    const w = fgWalls[i]; w.t += dt; w.tick -= dt;
    if (w.t >= w.dur) { fgWalls.splice(i, 1); continue; }
    const wenv = clamp(Math.min(w.t / 0.25, (w.dur - w.t) / 0.4), 0, 1), wh = (w.low ? 13 : FOGO.parede.h) * wenv;
    if (Math.random() < dt * w.cols.length * 0.45 * wenv) { const c = w.cols[Math.floor(Math.random() * w.cols.length)]; parts.push({ x: c[0] + rnd(-1, 1), y: c[1] - rnd(0.4, 0.9) * wh, vx: rnd(-8, 8), vy: rnd(-46, -22), g: -12, life: rnd(0.35, 0.8), max: 0.8, col: ['#fff0b0', '#ffd23a', '#ffa040', '#ff6a1a'][Math.floor(Math.random() * 4)], size: 1, glow: true }); }
    if (Math.random() < dt * w.cols.length * 0.12 * wenv) { const c = w.cols[Math.floor(Math.random() * w.cols.length)]; parts.push({ x: c[0] + rnd(-2, 2), y: c[1] - wh - rnd(0, 4), vx: rnd(-4, 4), vy: rnd(-16, -8), g: -2, life: rnd(0.9, 1.5), max: 1.5, col: Math.random() < 0.5 ? '#1e1616' : '#2e2422', size: 1, smoke: true }); }
    if (w.tick > 0) continue;
    w.tick = w.F.tick;
    const top = Math.min(...w.cols.map(c => c[1])) - wh * 0.85, bot = Math.max(...w.cols.map(c => c[1]));
    for (const e of enemies) if (fgAlive(e) && e.x + e.w > w.x0 && e.x < w.x1 && e.y + e.h > top && e.y < bot) fgHit(e, w.F, 0, true);
  }
  // meteoros caindo
  for (let i = fgMeteors.length - 1; i >= 0; i--) {
    const m = fgMeteors[i]; m.t += dt;
    const k = Math.min(1, m.t / FOGO.meteoro.delay), e = k * k, x = lerp(m.x0, m.x1, e), y = lerp(m.y0, m.y1, e);
    for (let s = 0; s < 3; s++) parts.push({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-15, 15), vy: rnd(-25, 0), g: -10, life: rnd(0.25, 0.5), max: 0.5, col: ['#fff0b0', '#ffb040', '#ff6a1a', '#c8320e'][Math.floor(Math.random() * 4)], size: Math.random() < 0.4 ? 2 : 1, glow: true });
    if (k < 1) continue;
    fgExplode(m.x1, m.y1, FOGO.meteoro, true);
    if (m.floor != null) fgWall(m.x1, m.floor, 44, { min: 1, max: 2, tick: FOGO.parede.tick }, FOGO.meteoro.patch);
    fgMeteors.splice(i, 1);
  }
  // hidras
  for (let i = fgHydras.length - 1; i >= 0; i--) {
    const h = fgHydras[i]; h.t += dt; h.shot -= dt; h.open -= dt;
    if (h.t >= FOGO.hidra.dur) { burst(h.x, h.y - 8, 12, '#ff8a1e', 50, -30, 0.45, 1, true); fgHydras.splice(i, 1); continue; }
    const hx = h.x + h.face * 6, hy = h.y - 28;
    let tgt = null, bd = FOGO.hidra.range;
    for (const e of enemies) { if (!fgAlive(e)) continue; const d = Math.hypot(e.x + e.w / 2 - hx, e.y + e.h / 2 - hy); if (d < bd && losClear(hx, hy, e.x + e.w / 2, e.y + e.h / 2)) { bd = d; tgt = e; } }
    if (tgt) h.face = tgt.x + tgt.w / 2 >= h.x ? 1 : -1;
    if (tgt && h.shot <= 0 && h.t > 0.3) {
      h.shot = FOGO.hidra.rate; h.open = 0.18;
      const sx = h.x + h.face * 8, sy = hy, tx = tgt.x + tgt.w / 2 + (tgt.vx || 0) * 0.15, ty = tgt.y + tgt.h / 2, a = Math.atan2(ty - sy, tx - sx);
      fgBolts.push({ x: sx, y: sy, vx: Math.cos(a) * FOGO.hidra.spd, vy: Math.sin(a) * FOGO.hidra.spd, t: 0 });
      sfx.fgSpit();
    }
  }
  // fumaça e chamas soltas do sopro
  for (let i = fgFlames.length - 1; i >= 0; i--) {
    const f = fgFlames[i]; f.t += dt;
    const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt;
    if (f.t >= f.life || solidAt(Math.floor(nx / T), Math.floor(ny / T))) {
      if (Math.random() < 0.18) parts.push({ x: f.x + rnd(-2, 2), y: f.y + rnd(-2, 1), vx: f.vx * 0.15 + rnd(-6, 6), vy: rnd(-26, -12), g: -6, life: rnd(0.6, 1), max: 1, col: Math.random() < 0.5 ? '#3a3030' : '#4a3e3a', size: 2, smoke: true });
      fgFlames.splice(i, 1); continue;
    }
    f.x = nx; f.y = ny; f.vx *= 1 - dt * 1.5; f.vy = f.vy * (1 - dt * 1.5) - 30 * dt;
    // o sopro só fere quando a chama encosta no bicho; cada bicho leva no máximo um golpe a cada FOGO.inferno.tick
    let hit = false;
    for (const e of enemies) {
      if (!fgAlive(e) || f.x < e.x - 1 || f.x > e.x + e.w + 1 || f.y < e.y - 1 || f.y > e.y + e.h + 1) continue;
      hit = true;
      if ((e.fgInfCD || 0) <= gameTime) { e.fgInfCD = gameTime + FOGO.inferno.tick; fgHit(e, FOGO.inferno, 0, true); }
      break;
    }
    if (hit && Math.random() < 0.6) fgFlames.splice(i, 1);   // a chama se espalha no corpo
  }
  // gente queimando
  for (const e of enemies) {
    if (!(e.fgBurn > 0) || e.dead) continue;
    e.fgBurn -= dt; e.fgBurnT -= dt;
    if (Math.random() < dt * 14) parts.push({ x: e.x + rnd(0, e.w), y: e.y + rnd(e.h * 0.2, e.h), vx: rnd(-6, 6), vy: rnd(-34, -14), g: -10, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffb040' : '#ff5a1a', size: 1, glow: true });
    if (e.fgBurnT > 0) continue;
    e.fgBurnT += FOGO.burn.tick;
    const d = Math.max(1, Math.round(FOGO.burn.dmg * (1 + (pl.spellPct || 0)) * fgAff(e)));
    e.hp -= d; e.flash = 0.06; e.showHp = 3; e.memT = 4;
    floatText(e.x + e.w / 2, e.y - 4, String(d), SPELL_ELEM.fogo.col, 0.8);
    if (e.hp <= 0) killEnemy(e);
  }
  for (let i = fgBooms.length - 1; i >= 0; i--) { fgBooms[i].t += dt; if (fgBooms[i].t >= fgBooms[i].life) fgBooms.splice(i, 1); }

  // o feitiço na mão
  const held = heldBag(), k = held && FOGO_SPELL[held.s.id];
  if (!k || pl.dead || pl.bat) return;
  if (Math.random() < dt * 7) { const [hx, hy] = handXY(); parts.push({ x: hx + rnd(-1, 1), y: hy + rnd(-1, 2), vx: rnd(-8, 8), vy: rnd(-28, -8), g: -10, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ffd23a' : '#ff6a1a', size: 1, glow: true }); }
  if (!mouse.l || pl.atkT >= 0 || pl.shieldK >= 0.35 || pl.stunT > 0) return;
  if (k === 'inferno') {
    const F = FOGO.inferno;
    if (pl.mana < F.costS * 0.15) { if (mouse.lPressed) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem mana', '#7fb8ff', 0.8); sfx.bad(); } return; }
    pl.mana = Math.max(0, pl.mana - F.costS * dt); pl.useT = Math.max(pl.useT, 0.15);
    const [mx, my] = mouseWorld(); if (Math.abs(mx - (pl.x + pl.w / 2)) > 2) pl.facing = mx > pl.x + pl.w / 2 ? 1 : -1;
    const [hx, hy] = handXY(), a = Math.atan2(my - hy, mx - hx);
    for (let s = 0, n = Math.round(dt * 150 + Math.random()); s < n; s++) {
      const fa = a + rnd(-F.ang, F.ang) * 0.85, sp = rnd(120, 170);
      fgFlames.push({ x: hx, y: hy, vx: Math.cos(fa) * sp, vy: Math.sin(fa) * sp, t: 0, life: F.len / sp * rnd(0.85, 1.15), s: Math.random(), id: fgFlameId++, wx: 0, wy: 0, r: 1, h: 1 });
    }
    // brasas que saltam do jato
    if (Math.random() < dt * 18) { const fa = a + rnd(-F.ang, F.ang), sp = rnd(70, 140), d = rnd(6, F.len * 0.7); parts.push({ x: hx + Math.cos(a) * d, y: hy + Math.sin(a) * d, vx: Math.cos(fa) * sp * 0.5 + rnd(-15, 15), vy: Math.sin(fa) * sp * 0.5 - rnd(10, 40), g: 40, life: rnd(0.3, 0.7), max: 0.7, col: Math.random() < 0.6 ? '#ffd23a' : '#fff6d0', size: 1, glow: true }); }
    if (fgBreathSnd <= 0) { fgBreathSnd = 0.12; sfx.fgBreath(); }
    return;
  }
  if (fgCD[k] > 0) return;
  if (pl.mana < FOGO[k].cost) { if (mouse.lPressed) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem mana', '#7fb8ff', 0.8); sfx.bad(); } fgCD[k] = 0.25; return; }
  castFogo(k);
});

/* ---- desenho ---- */
const FG_RAMP = ['#fff6d0', '#ffd23a', '#ff8a1e', '#e0501a', '#a82a0e'];
const fgCol = k => FG_RAMP[clamp(Math.floor(k * FG_RAMP.length), 0, FG_RAMP.length - 1)];
let fgG = null;
HOOK.drawGlow.push((cx, cy) => {
  if (!fgG) fgG = { s: glow(6, '#ff8a1e'), m: glow(14, '#ff7a1a'), b: glow(30, '#ff6a10') };
  if (!(fgBalls.length || fgBolts.length || fgWalls.length || fgMeteors.length || fgHydras.length || fgFlames.length || fgBooms.length)) return;
  lc.globalCompositeOperation = 'lighter';
  const at = (g, x, y, a) => { lc.globalAlpha = a; lc.drawImage(g, Math.round(x) - cx - g.width / 2, Math.round(y) - cy - g.height / 2); };
  for (const b of fgBalls) at(fgG.m, b.x, b.y, 0.8);
  for (const b of fgBolts) at(fgG.s, b.x, b.y, 0.8);
  for (let i = 0; i < fgFlames.length; i += 3) { const f = fgFlames[i], k = f.t / f.life; at(k < 0.5 ? fgG.s : fgG.m, f.x, f.y, (k < 0.5 ? 0.45 : 0.22) * (1 - k)); }
  for (const w of fgWalls) { const env = clamp(Math.min(w.t / 0.25, (w.dur - w.t) / 0.4), 0, 1); for (let i = 0; i < w.cols.length; i += 2) at(fgG.m, w.cols[i][0], w.cols[i][1] - (w.low ? 4 : 8), (0.32 + 0.08 * Math.sin(gameTime * 9 + i)) * env); }
  for (const m of fgMeteors) { const k = Math.min(1, m.t / FOGO.meteoro.delay), e = k * k; at(fgG.b, lerp(m.x0, m.x1, e), lerp(m.y0, m.y1, e), 0.7); }
  for (const h of fgHydras) at(fgG.m, h.x + h.face * 3, h.y - 14, 0.45);
  for (const b of fgBooms) { const k = b.t / b.life; at(fgG.b, b.x, b.y, 0.9 * (1 - k)); }
  lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
});
function fgDisc(x, y, r, col) { lc.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); lc.fillRect(Math.round(x - w), Math.round(y + j), w * 2 + 1, 1); } }
function drawHydra(h, cx, cy) {
  const life = FOGO.hidra.dur, rise = clamp(Math.min(h.t / 0.3, (life - h.t) / 0.4), 0, 1), X = Math.round(h.x) - cx, Y = Math.round(h.y) - cy, f = h.face;
  const px = (x, y, c) => { lc.fillStyle = c; lc.fillRect(x, y, 1, 1); };
  // monte de rocha rachada, com brasa nas frestas
  const rock = ['#1e1210', '#3a2018', '#5a3020', '#7a4228'];
  for (let j = 0; j < 4; j++) for (let i = -7 + j; i <= 7 - j; i++) {
    const g = hash2(i, j, 7); px(X + i, Y - 1 - j, g < 0.16 ? (g < 0.06 ? '#ffd23a' : '#ff7a1a') : rock[clamp(1 + (j === 3 ? 1 : 0) + (i < 0 ? 1 : 0) - (g > 0.8 ? 1 : 0), 0, 3)]);
  }
  const H = Math.round(22 * rise); if (H < 2) return;
  // pescoço escamado em S: costas escuras, escamas laranja, ventre de placas claras, cristas nas costas
  const sway = j => Math.round((Math.sin(gameTime * 3.5 + h.seed + j * 0.28) * 1.6 - Math.sin(j / 22 * Math.PI) * 2.2 * f) * (j / 22));
  for (let j = 0; j < H; j++) {
    const x0 = X + sway(j), y = Y - 4 - j, w = j < 6 ? 5 : j < 14 ? 4 : 3, l = x0 - (w >> 1);
    px(l - 1, y, '#3a0c06'); px(l + w, y, '#3a0c06');
    for (let i = 0; i < w; i++) {
      const front = f > 0 ? i === w - 1 : i === 0, back = f > 0 ? i === 0 : i === w - 1, sc = (j + i * 2) % 4 === 0;
      px(l + i, y, front ? (j % 2 ? '#ffd27a' : '#f0a850') : back ? '#8a2410' : sc ? '#ff9a3c' : '#d4501a');
    }
    if (j % 4 === 2 && j < H - 3) px(f > 0 ? l - 2 : l + w + 1, y, '#ff6a1a');   // crista
  }
  // cabeça: crânio, focinho comprido, chifre para trás, olho aceso; a boca abre quando cospe
  const hx = X + sway(H), top = Y - 4 - H, op = h.open > 0 ? 2 : 0;
  const head = [
    '..hh.......',
    '.hOOOOO....',
    'kOOOOOOOOk.',
    'kOOeOOOOOOk',
    'kOOOOooooo.'
  ], jaw = 'kOOOoooo...';
  const put = (r, yy) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.') continue; const xx = f > 0 ? hx - 3 + i : hx + 3 - i; px(xx, yy, ch === 'k' ? '#3a0c06' : ch === 'h' ? '#6a1a0a' : ch === 'e' ? '#fff3a0' : ch === 'o' ? '#ffd27a' : (i + yy) % 3 ? '#e0601e' : '#ff9a3c'); } };
  for (let r = 0; r < head.length; r++) put(head[r], top - 5 + r);
  if (op) { const mx = f > 0 ? hx + 2 : hx - 8; lc.fillStyle = '#ffe9a0'; lc.fillRect(mx, top, 7, 1); lc.fillStyle = '#ff8a1e'; lc.fillRect(mx, top + 1, 7, 1); }
  put(jaw, top + op);
  px(f > 0 ? hx - 4 : hx + 4, top - 6, '#8a2410'); px(f > 0 ? hx - 5 : hx + 5, top - 7, '#5a1408');   // ponta do chifre
}
HOOK.drawTop.push((cx, cy) => {
  // sopro: chamas que nascem brancas e morrem vermelhas, e a fumaça por cima
  // jato do Inferno: cada chama é uma bolha de pixels de borda irregular, pintada em camadas (fumaça, vermelho, laranja,
  // amarelo, miolo branco) para que as bolhas se fundam num jato só, quente no bico e frio na ponta. Anima a 14 quadros por segundo.
  if (fgFlames.length) {
    const fq = Math.floor(gameTime * 14);
    const blob = (f, r, col, sd) => {
      const ri = Math.ceil(r), x = Math.round(f.x + f.wx) - cx, y = Math.round(f.y + f.wy) - cy; lc.fillStyle = col;
      for (let j = -ri; j <= ri; j++) {
        const w = Math.sqrt(Math.max(0, r * r - j * j)), a = hash2(f.id, j, fq * 7 + sd), b = hash2(f.id, j, fq * 7 + sd + 3);
        const l = Math.round(w + (a - 0.5) * 1.3), rr = Math.round(w + (b - 0.5) * 1.3); if (l + rr < 0) continue;
        lc.fillRect(x - l, y + j, l + rr + 1, 1);
      }
    };
    for (const f of fgFlames) {
      const k = f.t / f.life, fl = 0.85 + 0.3 * hash2(f.id, fq, 5);
      f.r = (1.1 + k * 3.2 - k * k * 1.2) * (0.75 + f.s * 0.5) * fl; f.h = 1 - k * 1.15 + (f.s - 0.5) * 0.2;
      const ph = f.id * 1.7 + gameTime * 22; f.wx = Math.sin(ph) * k * 1.6; f.wy = Math.cos(ph * 0.8) * k * 1.6 - k * k * 2;
    }
    lc.globalAlpha = 0.35;
    for (const f of fgFlames) if (f.t / f.life > 0.6) blob(f, f.r * 1.15, hash2(f.id, 0, 9) < 0.5 ? '#2e2424' : '#40302c', 1);
    // línguas: na metade de trás do jato cada chama solta uma ponta que lambe para cima
    const tongue = (f, sc, col, sd) => { const k = f.t / f.life; if (k < 0.45 || hash2(f.id, fq, 11) < 0.35) return; const ox = f.wx, oy = f.wy; f.wy -= f.r * (0.8 + k * 0.6); f.wx += Math.sin(f.id + gameTime * 9) * 1.2; blob(f, f.r * sc * 0.5, col, sd + 20); f.wx = ox; f.wy = oy; };
    for (const f of fgFlames) { const k = f.t / f.life; lc.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; const c = f.h > 0.05 ? '#a82a0e' : '#6a1a0a'; blob(f, f.r, c, 2); tongue(f, 1, c, 2); }
    lc.globalAlpha = 1;
    for (const f of fgFlames) if (f.h > 0.18) { blob(f, f.r * 0.8, '#e0501a', 3); tongue(f, 0.75, '#e0501a', 3); }
    for (const f of fgFlames) if (f.h > 0.34) blob(f, f.r * 0.64, '#ff8a1e', 4);
    for (const f of fgFlames) if (f.h > 0.5) blob(f, f.r * 0.48, '#ffd23a', 5);
    for (const f of fgFlames) if (f.h > 0.7) blob(f, Math.max(0.6, f.r * 0.3), '#fff6d0', 6);
  }
  lc.globalAlpha = 1;
  // paredes de chamas e chão em chamas: brasa no chão, línguas de fogo em camadas (vermelho, laranja, amarelo, miolo branco)
  // que sobem e balançam juntas, pontas que se soltam e fuligem no chão queimado. Anima a 14 quadros por segundo.
  const fr = Math.floor(gameTime * 14), tt = fr / 14;
  for (const w of fgWalls) {
    const env = clamp(Math.min(w.t / 0.25, (w.dur - w.t) / 0.4), 0, 1), Hh = (w.low ? 13 : FOGO.parede.h) * env, sd = w.seed;
    const c0 = w.cols[0][0], n = w.cols.length, L = Math.max(1, (n - 1) * 3), xa = Math.round(c0), xb = Math.round(w.cols[n - 1][0]);
    for (let X = xa - 1; X <= xb + 1; X++) {
      const c = w.cols[clamp(Math.round((X - c0) / 3), 0, n - 1)], fy = Math.round(c[1]) - cy, sx = X - cx, u = clamp((X - c0) / L, 0, 1);
      // chão queimado e brasa
      const ge = hash2(X, Math.floor(tt * 3), sd | 0);
      lc.globalAlpha = 0.55 * Math.min(1, env * 2); lc.fillStyle = '#140a08'; lc.fillRect(sx, fy, 1, 2); lc.globalAlpha = 1;
      lc.fillStyle = ge < 0.18 ? '#fff0b0' : ge < 0.5 ? '#ffb040' : ge < 0.8 ? '#e0501a' : '#7a1a08'; lc.fillRect(sx, fy - 1, 1, 1);
      if (hash2(X, 7, sd | 0) < 0.25) { lc.fillStyle = ge < 0.5 ? '#ff8a1e' : '#a82a0e'; lc.fillRect(sx, fy, 1, 1); }   // trinca acesa
      if (Hh < 1.5) continue;
      // altura da língua: ondas que andam, mais alto no meio, cai nas pontas
      const wave = 0.55 + 0.22 * Math.sin(X * 0.42 + tt * 8.5 + sd) + 0.15 * Math.sin(X * 1.07 - tt * 12.5 + sd * 1.7) + 0.08 * Math.sin(X * 2.3 + tt * 5);
      const prof = Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * u)), 0.6), h = Math.round(Hh * prof * wave + (hash2(X, fr, 3) < 0.2 ? 1 : 0));
      if (h < 1) continue;
      const lay = [[1, '#a82a0e'], [0.78, '#e0501a'], [0.55, '#ff9a2a'], [0.34, '#ffd23a'], [0.14, '#fff6d0']];
      for (const [f, col] of lay) { const hh = Math.round(h * f); if (hh < 1 || (f < 0.2 && wave < 0.6)) continue; lc.fillStyle = col; lc.fillRect(sx, fy - 1 - hh, 1, hh); }
      lc.fillStyle = '#5a1408'; lc.fillRect(sx, fy - 2 - h, 1, 1);   // contorno da ponta
      // pedaço de chama que se solta da ponta e sobe
      const lp = hash2(X, Math.floor(tt * 7), sd | 0);
      if (lp < 0.09) { const up = 2 + (fr % 4); lc.fillStyle = lp < 0.04 ? '#ffb040' : '#e0501a'; lc.fillRect(sx, fy - 2 - h - up, 1, lp < 0.03 ? 2 : 1); }
    }
  }
  // bolas de fogo
  for (const b of fgBalls) { fgDisc(b.x - cx, b.y - cy, 3, '#e0501a'); fgDisc(b.x - cx, b.y - cy, 2, '#ffb040'); fgDisc(b.x - cx - (b.vx > 0 ? 0 : 0), b.y - cy, 1, '#fff6d0'); }
  for (const b of fgBolts) { fgDisc(b.x - cx, b.y - cy, 2, '#e0501a'); lc.fillStyle = '#fff0b0'; lc.fillRect(Math.round(b.x) - cx, Math.round(b.y) - cy, 1, 1); }
  // meteoros: a pedra e o aviso no chão
  for (const m of fgMeteors) {
    const k = Math.min(1, m.t / FOGO.meteoro.delay), e = k * k, x = lerp(m.x0, m.x1, e) - cx, y = lerp(m.y0, m.y1, e) - cy;
    fgDisc(x, y, 5, '#ff6a1a'); fgDisc(x, y, 4, '#3a2a26'); lc.fillStyle = '#6a5048'; lc.fillRect(Math.round(x) - 2, Math.round(y) - 3, 3, 2); lc.fillStyle = '#ffb040'; lc.fillRect(Math.round(x) + 2, Math.round(y) + 1, 2, 2);
    if (Math.floor(m.t * 10) % 2 === 0) { lc.fillStyle = '#ff5a1a'; const r = FOGO.meteoro.r * 0.6; for (let a = 0; a < Math.PI * 2; a += 0.25) lc.fillRect(Math.round(m.x1 - cx + Math.cos(a) * r), Math.round(m.y1 - cy + Math.sin(a) * r * 0.25), 1, 1); }
  }
  for (const h of fgHydras) drawHydra(h, cx, cy);
  // explosões: um disco que abre e esfria
  for (const b of fgBooms) {
    // bola de fogo em pixels: frente quente que se abre num anel, miolo que esfria em fumaça, borda rasgada pelo ruído
    const k = b.t / b.life, r = b.r * (0.35 + 0.65 * Math.sqrt(k)), R = Math.ceil(r) + 1, X = Math.round(b.x) - cx, Y = Math.round(b.y) - cy, f = Math.floor(b.t * 20);
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const g = hash2(i + 77, j + f * 13, 5), d = Math.hypot(i, j * 1.15) / r + (g - 0.5) * 0.28;
      if (d > 1) continue;
      const ring = 1 - Math.abs(d - (0.55 + 0.4 * k)) / 0.45;   // a frente do fogo anda para fora
      let v = ring * (1 - k * 0.8) + (1 - d) * Math.max(0, 0.5 - k * 2.2);
      if (v > 0.08 && hash2(i - 31, j + f * 7, 9) > v * 1.7 + 0.15) v = 0;   // falhas: a nuvem fica rendada, não um disco cheio
      if (v < 0.08) { if (k > 0.35 && d < 0.85 && g < 0.5) { lc.globalAlpha = 0.5 * (1 - k); lc.fillStyle = g < 0.25 ? '#2a1e1c' : '#3e302c'; lc.fillRect(X + i, Y + j, 1, 1); lc.globalAlpha = 1; } continue; }
      lc.globalAlpha = v > 0.4 ? 1 : 0.75; lc.fillStyle = v > 0.8 ? '#fff6d0' : v > 0.6 ? '#ffd23a' : v > 0.4 ? '#ff9a2a' : v > 0.22 ? '#e0501a' : '#8a220a';
      lc.fillRect(X + i, Y + j, 1, 1); lc.globalAlpha = 1;
    }
  }
  lc.globalAlpha = 1;
});
