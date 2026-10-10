'use strict';

/* ================= alquimia em jogo: beber, elixires, colher e as ervas voltando a nascer =================
   Os dados (ervas, poções, elixires, receitas, desenhos) ficam em js/94-alquimia-dados.js; a Marta e o alambique
   em js/96-alquimista.js.
   - Beber: clique esquerdo com o frasco na barra, ou botão direito nele no inventário. R bebe a poção de vida que
     melhor cobre o que falta (a menor que cura tudo; senão a maior que houver).
   - Vida: cura ao longo de 5 s, e o que sobra de outra poção soma (`tickPotion` do 10 trocado). Mana: devolve em 2 s.
   - Elixir: dura `ALQ[id].t` segundos de jogo; o mesmo elixir renova o tempo, elixires diferentes somam. Os efeitos
     entram no `recalc` (embrulhado aqui, por fora de todos), aparecem como ícones com o tempo debaixo do quadro do
     canto de cima, vão para o save (`alq`) e acabam se o herói morre.
   - Colher: a picareta arranca a erva com um golpe (BLOCK_DROP); E perto de uma erva também colhe. 30% de chance de
     vir uma a mais. Erva que perde o chão cai e deixa o item.
   - As ervas colhidas voltam a nascer aos poucos (a cada 2 minutos de jogo, umas 35% das que faltam, nunca na
     frente do herói); voltar é só desfazer a diferença guardada no save, porque o lugar vem da semente.
   Carrega antes do 24-boot. */

const ELIX_MANA = 2.2;   // mana por segundo a mais com o Elixir Profano (id elixir_clareza) (o dobro da volta normal)
pl.elix = {}; pl.manaPot = 0; pl.manaRate = 0; pl.potRate = 0; pl.alqCD = 0;

/* ---- vida e mana ao longo do tempo ---- */
tickPotion = function (dt) {
  if (!(pl.potHeal > 0)) return;
  const step = Math.min(pl.potHeal, (pl.potRate || POT_RATE) * dt); pl.potHeal -= step;
  pl.potAcc = (pl.potAcc || 0) + step; const n = Math.floor(pl.potAcc + 1e-6);
  if (n > 0) { pl.potAcc -= n; pl.hp = Math.min(pl.maxHp, pl.hp + n); }
  if (pl.potHeal <= 1e-6) { pl.potHeal = 0; if (pl.potAcc > 0.5) pl.hp = Math.min(pl.maxHp, pl.hp + 1); pl.potAcc = 0; }
};
function tickAlq(dt) {
  pl.alqCD -= dt;
  if (pl.manaPot > 0) { const k = Math.min(pl.manaPot, pl.manaRate * dt); pl.manaPot -= k; pl.mana = Math.min(pl.maxMana, pl.mana + k); }
  if (pl.elix.elixir_clareza && pl.mana < pl.maxMana) pl.mana = Math.min(pl.maxMana, pl.mana + ELIX_MANA * dt);
  let gone = null;
  for (const id in pl.elix) { pl.elix[id] -= dt; if (pl.elix[id] <= 0) { delete pl.elix[id]; gone = id; } }
  if (gone) { recalc(); if (!pl.dead) floatText(pl.x + pl.w / 2, pl.y - 8, `${ALQ[gone].nome} acabou`, '#c4b596', 1); }
}
HOOK.update.push(dt => { if (!pl.dead) tickAlq(dt); updateBuffHud(); herbRegrow(dt); });

/* ---- beber ---- */
const LIFE_POTS = Object.keys(ALQ).filter(id => ALQ[id].kind === 'life').sort((a, b) => ALQ[a].heal - ALQ[b].heal);
function alqDrink(id) {
  const a = ALQ[id], pcx = pl.x + pl.w / 2; if (!a || pl.dead) return false;
  if (pl.alqCD > 0) return false;
  if (countItem(id) <= 0) { floatText(pcx, pl.y - 8, 'Acabou', '#d9c7a3', 0.8); return false; }
  if (a.kind === 'life') {
    if (pl.hp >= pl.maxHp) { floatText(pcx, pl.y - 8, 'Vida cheia', '#d9c7a3', 0.8); return false; }
    pl.potHeal = (pl.potHeal || 0) + a.heal; pl.potRate = Math.max(POT_RATE, pl.potHeal / 5); pl.potCD = 1;
    floatText(pcx, pl.y - 6, '+' + a.heal, '#7dff8a', 1.1);
  } else if (a.kind === 'mana') {
    if (pl.mana >= pl.maxMana - 0.5) { floatText(pcx, pl.y - 8, 'Mana cheia', '#d9c7a3', 0.8); return false; }
    pl.manaPot += a.mana; pl.manaRate = Math.max(6, pl.manaPot / 2);
    floatText(pcx, pl.y - 6, '+' + a.mana, '#8ab8ff', 1.1);
  } else {
    const had = !!pl.elix[id]; pl.elix[id] = a.t; recalc();
    if (id === 'elixir_vida' && !had) pl.hp = Math.min(pl.maxHp, pl.hp + 8);
    floatText(pcx, pl.y - 8, a.nome, a.liq, 1.2);
  }
  removeItem(id, 1); pl.alqCD = 0.35; invDirty = true;
  burst(pcx, pl.y + 10, 14, a.liq, 50, -80, 0.7, 1, true); sfx.potion();
  return true;
}
// R: a poção de vida que cobre o que falta; o clique na barra: o frasco que está na mão
drinkPotion = function () {
  const held = typeof heldBag === 'function' && mouse.lPressed ? heldBag() : null;
  if (held && ALQ[held.s.id]) return alqDrink(held.s.id);
  const have = LIFE_POTS.filter(id => countItem(id) > 0), pcx = pl.x + pl.w / 2;
  if (!have.length) { floatText(pcx, pl.y - 8, 'Sem poções', '#d9c7a3', 0.8); return false; }
  const miss = pl.maxHp - pl.hp - (pl.potHeal || 0);
  return alqDrink(have.find(id => ALQ[id].heal >= miss) || have[have.length - 1]);
};
// botão direito no inventário
{ const _qa = quickAction; quickAction = function (r) {
  const s = itemAt(r);
  if (s && ALQ[s.id] && state === 'inv' && r.k === 'inv') { pl.alqCD = 0; alqDrink(s.id); if (typeof refreshInv === 'function') refreshInv(); return; }
  return _qa(r);
}; }
// o quadro do canto conta todas as poções de vida
{ const _uh = updateHUD; updateHUD = function () { _uh(); const n = LIFE_POTS.reduce((k, id) => k + countItem(id), 0), e = $('hPot'); if (e && e._n !== n) { e.textContent = String(n); e._n = n; } }; }

/* ---- os efeitos dos elixires, por fora de todos os outros cálculos ---- */
{ const _rc = recalc; recalc = function () {
  _rc();
  const E = pl.elix || {};
  if (E.elixir_furia) { pl.dmgMin = Math.max(1, Math.round(pl.dmgMin * 1.2)); pl.dmgMax = Math.max(pl.dmgMin, Math.round(pl.dmgMax * 1.2)); pl.dmg = (pl.dmgMin + pl.dmgMax) / 2; pl.dps *= 1.2; }
  if (E.elixir_pedra) pl.def += 4;
  if (E.elixir_vida) pl.maxHp += 8;
  if (E.elixir_regen) pl.regenB = (pl.regenB || 0) + 0.5;
  if (E.elixir_espectral) pl.dodge = Math.min(0.4, (pl.dodge || 0) + 0.15);
  if (E.elixir_carnical) pl.lifeSteal = (pl.lifeSteal || 0) + 0.06;
  if (E.elixir_clareza) pl.spellPct = (pl.spellPct || 0) + 0.2;
  pl.res = { veneno: 0, frio: 0, fogo: 0 };
  for (const id in E) { const r = ALQ[id] && ALQ[id].res; if (r) for (const k in r) pl.res[k] = Math.min(0.75, pl.res[k] + r[k]); }
  if (E.elixir_polvora) { pl.atkPeriod /= 1.15; pl.aps = 1 / pl.atkPeriod; pl.atkSpd = clamp(0.31 / (pl.atkPeriod * 0.85), 0.55, 1.4); pl.dps *= 1.15; }
  if (pl.hp > pl.maxHp) pl.hp = pl.maxHp;
}; }
{ const _die = die; die = function () { _die(); pl.elix = {}; pl.manaPot = 0; recalc(); }; }

/* ---- os ícones dos elixires debaixo do quadro do canto ---- */
let buffHud = null;
function updateBuffHud() {
  if (!buffHud) { const w = document.querySelector('#hud .world'); if (!w) return; buffHud = document.createElement('div'); buffHud.id = 'alqBuffs'; w.appendChild(buffHud); buffHud._k = ''; }
  const ids = Object.keys(pl.elix).sort(), key = ids.map(id => id + ':' + Math.ceil(pl.elix[id])).join('|');
  if (key === buffHud._k) return; buffHud._k = key;
  if (buffHud._ids !== ids.join()) {
    buffHud._ids = ids.join();
    buffHud.innerHTML = ids.map(id => `<div class="buff" data-id="${id}"><img src="${ICON[id] ? ICON[id].url : ''}" alt="${ITEMS[id].name}"><span></span></div>`).join('');
  }
  for (const el of buffHud.children) { const s = Math.ceil(pl.elix[el.dataset.id] || 0); el.lastChild.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; el.classList.toggle('low', s <= 30); }
}

/* ---- colher ---- */
function harvestHerb(tx, ty, src) {
  const t = tileAt(tx, ty), h = HERB_OF[t]; if (!h) return false;
  setTile(tx, ty, AIR);
  const lx = (tx + 0.5) * T, ly = (ty + 1) * T - 1;
  dropLoot(lx, ly, h.id, Math.random() < 0.3 ? 2 : 1, true);
  burst(lx, ly - 5, 8, PCOL[t], 45, 260, 0.45); sfx.dug();
  return true;
}
// a picareta: o BLOCK_DROP já deixa uma; aqui só a chance de vir outra
{ const _bt = breakTile; breakTile = function (tx, ty) { const t = tileAt(tx, ty); _bt(tx, ty); if (HERB_OF[t] && Math.random() < 0.3) dropLoot((tx + 0.5) * T, (ty + 1) * T - 1, HERB_OF[t].id, 1, true); }; }
// E perto de uma erva, quando não tem morador mais perto
{ const _ud = updateDig; updateDig = function (dt) {
  if (pressed.KeyE && state === 'play' && !pl.dead && !nearNpc()) {   // (the loot chests are gone, 2026-10-10)
    const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2, tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T); let best = null, bd = 1e9;
    for (let ty = ty0 - 2; ty <= ty0 + 2; ty++) for (let tx = tx0 - 3; tx <= tx0 + 3; tx++) {
      if (!HERB_OF[tileAt(tx, ty)]) continue;
      const d = Math.hypot((tx + 0.5) * T - cx, (ty + 0.5) * T - cy); if (d < 34 && d < bd) { bd = d; best = [tx, ty]; }
    }
    if (best) { harvestHerb(best[0], best[1]); pressed.KeyE = false; }
  }
  return _ud(dt);
}; }
// o chão debaixo some: a erva cai e o item fica
{ const _pls = propsLoseSupport; propsLoseSupport = function (x, y) {
  const up = tileAt(x, y - 1);
  if (HERB_OF[up] && !SOLID[tileAt(x, y)]) dropLoot((x + 0.5) * T, y * T - 1, HERB_OF[up].id, 1, true);
  return _pls(x, y);
}; }

/* ---- as ervas voltam a nascer ---- */
let herbClock = 0;
function herbRegrow(dt) {
  herbClock += dt; if (herbClock < 120) return; herbClock = 0;
  const px = (pl.x + pl.w / 2) / T, py = (pl.y + pl.h / 2) / T;
  for (const [i, t] of HERB_SPOTS) {
    if (tiles[i] !== AIR || Math.random() > 0.35) continue;
    const x = i % WW, y = (i / WW) | 0;
    if (Math.abs(wdx(x - px)) < VW / T / 2 + 4 && Math.abs(y - py) < VH / T / 2 + 4) continue;   // nunca na frente do herói
    if (!SOLID[tileAt(x, y + 1)] || tileAt(x, y - 1) !== AIR) continue;
    tiles[i] = t; diffs.delete(i); markDirty(x, y); mapVer++;
  }
}

/* ---- o brilho do lírio e da raiz ---- */
const ALQ_GLOW = { [HB_LIRIO]: glow(12, '#8ab8ff'), [HB_BRASA]: glow(12, '#ff8a2a'), [HB_GEADA]: glow(10, '#c8f0ff') };
HOOK.drawGlow.push((cx, cy) => {
  for (let i = 0; i < emitters.length; i += 3) {
    const g = ALQ_GLOW[emitters[i + 2]]; if (!g) continue;
    const gx = emitters[i], gy = emitters[i + 1];
    lc.globalAlpha = 0.18 + Math.sin(gameTime * 1.5 + gx * 0.9) * 0.05; lc.drawImage(g, gx * T + 6 - cx - 12, gy * T + 6 - cy - 12);
  }
  lc.globalAlpha = 1;
});

/* ---- save ---- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); const el = {}; for (const id in pl.elix) el[id] = Math.round(pl.elix[id]); o.alq = { el }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  pl.elix = {}; pl.manaPot = 0; pl.potRate = 0; herbClock = 0;
  const el = sv && sv.alq && sv.alq.el; if (el) for (const id in el) if (ALQ[id] && ALQ[id].kind === 'elixir' && el[id] > 0) pl.elix[id] = Math.min(ALQ[id].t, +el[id]);
  _nw(sd, sv);   // o recalc de dentro já soma os elixires que voltaram
}; }
