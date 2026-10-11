'use strict';

/* ================= ofícios: XP, pontos, efeitos e a aba "Talentos" de Ferraria, Culinária e Encantamento =================
   Dados das árvores no 330-oficios-dados. Aqui:
   1. Estado: `ofi[prof] = { xp, lvl, sk: { id: pontos } }`; 1 ponto por nível do ofício (o nível 1 já tem 1), até OF_MAX_LVL.
   2. XP: fundir uma barra (2 + tier do metal), forjar uma peça (5 + 2 × tier), gravar uma runa (6), uma receita do Criar (1)
      dão XP de Ferraria; cada prato do Odo dá XP de Culinária (4 na brasa, 7 no caldeirão); cada encanto do Teodoro dá XP de
      Encantamento (5 + 4 × a posição da pedra em GEMS).
   3. Efeitos: embrulha tickFurnace (velocidade e o que acontece a cada barra, peça, prato e encanto), rollItem (peça bem
      temperada = +1 nível de item), enchantItem (chances e sorteio duplo), refreshEnc (mostra as chances com os talentos),
      breakTile (pedra a mais), craftOne e refreshCraft (tochas a mais, a receita de carvão), anEngrave (XP da runa),
      startEat, eatFinish, eatCancel, rawDamage e o gancho do comer no HOOK.update (comida), e recalc (bônus no herói).
   4. A tela: uma aba "Talentos" no cabeçalho da forja, da cozinha e da oficina. A árvore é uma placa de pixel art 120×162
      (pedra na forja, tábuas na cozinha, pedra azulada na oficina) com os encaixes, as setas e os talentos por cima; à direita
      o nível, a barra de XP, os pontos, os três galhos e o quadro do talento sob o mouse. Clique esquerdo põe um ponto,
      clique direito tira (se nenhum talento ligado depender dele).
   Visual em css/oficios.css. Salvo como `ofi`. Carrega depois do 235-criar (e de 99, 118 e 189, que embrulha), antes do 24-boot. */

const OF_PROFS = Object.keys(OFICIOS);
const ofNew = () => ({ xp: 0, lvl: 1, sk: {} });
const ofi = Object.fromEntries(OF_PROFS.map(p => [p, ofNew()]));
let ofC4 = 0, ofLastEnc = null, ofKeepEat = false;

/* ---------- pontos e efeitos ---------- */
const ofRank = id => ofi[OF_SK[id].prof].sk[id] || 0;
const ofSpent = p => Object.values(ofi[p].sk).reduce((a, n) => a + n, 0);
const ofPts = p => ofi[p].lvl - ofSpent(p);
// soma de um efeito nos talentos do ofício: valor por ponto × pontos
function ofV(p, key) {
  let v = 0; const S = ofi[p].sk;
  for (const id in S) { const s = OF_SK[id]; for (const [k, n] of s.fx) if (k === key) v += n * S[id]; }
  return v;
}
const ofRoll = (p, key) => Math.random() * 100 < ofV(p, key);
// por que não dá para pôr um ponto: '' se dá
function ofWhy(id) {
  const s = OF_SK[id], S = ofi[s.prof], r = S.sk[id] || 0;
  if (r >= s.max) return 'max';
  if (S.lvl < OF_ROW_LVL[s.r]) return 'lvl';
  if (s.req.some(q => !(S.sk[q] > 0))) return 'req';
  if (ofPts(s.prof) < 1) return 'pts';
  return '';
}
function ofCanSub(id) {
  const s = OF_SK[id], S = ofi[s.prof], r = S.sk[id] || 0;
  if (r <= 0) return false;
  if (r > 1) return true;
  return !Object.keys(S.sk).some(o => S.sk[o] > 0 && OF_SK[o].req.includes(id));
}

/* ---------- XP e níveis ---------- */
function ofGain(p, n) {
  const S = ofi[p]; if (!n || S.lvl >= OF_MAX_LVL) return;
  S.xp += n * (1 + ofV(p, 'xp') / 100);
  let up = 0;
  while (S.lvl < OF_MAX_LVL && S.xp >= ofNeed(S.lvl)) { S.xp -= ofNeed(S.lvl); S.lvl++; up++; }
  if (S.lvl >= OF_MAX_LVL) S.xp = 0;
  if (up) {
    floatText(pl.x + pl.w / 2, pl.y - 16, `${OFICIOS[p].name} ${S.lvl}`, '#ffd27a', 1.1);
    tone(523, 0.14, 'triangle', 0.06); tone(659, 0.16, 'triangle', 0.05, 0, 0.09); tone(784, 0.3, 'triangle', 0.05, 0, 0.18);
  }
  ofDirty(p);
}
const ofMetalTier = bar => Math.max(0, METALS.findIndex(M => M.bar === bar));

/* ---------- a forja: velocidade, barras, peças ---------- */
{ const _tf = tickFurnace; tickFurnace = function (dt) {
  let bar = null, piece = null, dish = null, en = null;
  if (furnace.on && furnace.ore && !furnaceWhy()) {
    const r = FURN[furnace.ore.id]; furnace.t += dt * ofV('forja', 'velFor') / 100;
    if (furnace.t + dt >= r.t) bar = { ore: furnace.ore.id, r };
  }
  if (anvil && forgeOpen()) { anvil.t += dt * ofV('forja', 'velBig') / 100; if (anvil.t + dt >= anvil.dur) piece = anvil.rc; }
  if (ck.pot && cookOpen()) { ck.pot.t += dt * ofV('cozinha', 'velCk') / 100; if (ck.pot.t + dt >= ck.pot.r.t) dish = { r: ck.pot.r, taken: ck.pot.taken.slice() }; }
  if (ench && encOpen()) { ench.t += dt * ofV('encanto', 'velEnc') / 100; if (ench.t + dt >= ENC_T) en = { gem: ench.gem }; }
  ofLastEnc = null;
  _tf(dt);
  if (bar) ofOnBar(bar);
  if (piece) ofOnPiece(piece);
  if (dish) ofOnDish(dish);
  if (en && ofLastEnc) ofOnEnc(ofLastEnc);
}; }
function ofOnBar({ ore, r }) {
  ofGain('forja', 2 + ofMetalTier(r.bar));
  if (ofV('forja', 'almaForja') || ofRoll('forja', 'carvao')) reagGive('carvao', 1);
  if (ofRoll('forja', 'barraExtra')) reagGive(r.bar, 1);
  if (ofRoll('forja', 'minerio')) reagGive(ore, 1);
  if (ofV('forja', 'quarta')) { ofC4 = (ofC4 + 1) % 4; if (!ofC4) reagGive(ore, r.n); }
  invDirty = true; forgeDirty = true;
}
function ofOnPiece(rc) {
  ofGain('forja', 5 + 2 * rc.metal);
  if (ofRoll('forja', 'poupaBig')) reagGive(rc.bar, rc.n);
  if (ofRoll('forja', 'pecaExtra') && bagFree()) { addInst(rollItem(rc.id, rc.metal + 1, 'forge')); sfx.anvil(0.8); }
  invDirty = true; forgeDirty = true;
}
// a peça bem temperada: +1 nível de item, que só aparece quando o Teodoro encanta (os modificadores rolam com o nível)
{ const _ri = rollItem; rollItem = function (id, z, src) {
  const s = _ri(id, z, src);
  if (src === 'forge' && s && !ITEMS[id].legend && (ofV('forja', 'obra') || ofRoll('forja', 'ilvl'))) s.il = Math.min(IL_MAX, (s.il || baseInfo(id).L) + 1);
  return s;
}; }
// a runa gravada no Cinzel também é Ferraria
if (typeof anEngrave === 'function') { const _ae = anEngrave; anEngrave = function () { const n0 = reagHave('runa_gravada'); _ae(); if (reagHave('runa_gravada') < n0) ofGain('forja', 6); }; }

/* ---------- o Criar do inventário: tochas a mais e o carvão do carvoeiro ---------- */
CRAFT_RECIPES.push({ id: 'carvao', n: 1, need: [['madeira', 3]], of: 'carvoeiro' });
const ofCraftN = R => R.n + (R.id === 'tocha' ? ofV('forja', 'tocha') : R.id === 'carvao' ? ofV('forja', 'pa') : 0);
{ const _co = craftOne; craftOne = function (i, e) {
  const R = CRAFT_RECIPES[i];
  if (R.of && !ofRank(R.of)) { bad(e && e.currentTarget); return; }
  const n0 = R.n, k = R.need[0][0], h0 = reagHave(k); R.n = ofCraftN(R);
  try { _co(i, e); } finally { R.n = n0; }
  if (reagHave(k) < h0) ofGain('forja', 1);
}; }
{ const _rc = refreshCraft; refreshCraft = function () {
  _rc();
  if (!craftOpen()) return;
  $('craftBox').querySelectorAll('.crow').forEach(b => {
    const R = CRAFT_RECIPES[+b.dataset.r]; b.hidden = !!(R.of && !ofRank(R.of));
    const n = b.querySelector('.slot.out .n'), v = String(ofCraftN(R)); if (n && n.textContent !== v) n.textContent = v;
  });
}; }

/* ---------- a cozinha: combustível, caldeirão grande, XP ---------- */
function ofOnDish({ r, taken }) {
  ofGain('cozinha', r.g === 'brasa' ? 4 : 7);
  if (ofV('cozinha', 'fogoEterno') || ofRoll('cozinha', 'fuel')) for (const [id, n] of taken) if (CK_FUEL.includes(id)) reagGive(id, n);
  const P = ck.pot;
  if (r.g === 'caldeirao' && ofV('cozinha', 'grande') && P && P.r === r && P.left > 0 && r.need.every(([id, n]) => reagHave(id) >= n)) {
    for (const [id, n] of r.need) reagTake(id, n);
    reagGive(r.id, 1); P.left--; P.done++; ofGain('cozinha', 7);
    if (P.left <= 0) stopCook(true);
  }
  ck.dirty = true; invDirty = true;
}

/* ---------- o comer: mais rápido, mais forte, andando, sem parar com dano ---------- */
{ const _se = startEat; startEat = function (id) {
  const ok = _se(id);
  if (ok && ck.eat) ck.eat.dur *= Math.max(0.3, 1 - ofV('cozinha', 'garfada') / 100);
  return ok;
}; }
{ const _ef = eatFinish; eatFinish = function () {
  const id = ck.eat && ck.eat.id, before = ck.meal, prev = before ? { hp: before.hp * Math.max(0, before.left), mp: before.mp * Math.max(0, before.left) } : null;
  _ef();
  const M = ck.meal; if (!M || M === before || !id) return;
  const F = ITEMS[id].food;
  let hp = F.hp * (1 + ofV('cozinha', 'cura') / 100), mp = F.mp + ofV('cozinha', 'mana');
  const t = F.t * Math.max(0.3, 1 - ofV('cozinha', 'digest') / 100), now = hp * ofV('cozinha', 'mordida') / 100;
  if (now >= 1) { pl.hp = Math.min(pl.maxHp, pl.hp + Math.round(now)); hp -= now; }
  if (prev && ofV('cozinha', 'sobremesa')) { hp += prev.hp; mp += prev.mp; }
  M.hp = hp / t; M.mp = mp / t; M.left = t;
  ofMealCheck();
}; }
{ const _ec = eatCancel; eatCancel = function () { if (ofKeepEat) return; _ec(); }; }
{ const _rd = rawDamage; rawDamage = function (...a) {
  if (!ck.eat || !ofV('cozinha', 'estomago')) return _rd.apply(this, a);
  ofKeepEat = true; try { return _rd.apply(this, a); } finally { ofKeepEat = false; }
}; }
// andar não interrompe: o gancho do comer (99) não vê as setas de andar enquanto o herói come
{ const i = HOOK.update.findIndex(f => /eatCancel/.test(String(f)));
  if (i >= 0) { const _h = HOOK.update[i]; HOOK.update[i] = function (dt) {
    if (!ck.eat || !ofV('cozinha', 'estrada')) return _h(dt);
    const K = ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'], was = K.map(k => keys[k]);
    K.forEach(k => { keys[k] = false; });
    try { return _h(dt); } finally { K.forEach((k, j) => { keys[k] = was[j]; }); }
  }; }
}
// os bônus que valem enquanto a comida faz efeito entram e saem do recalc
let ofMealOn = false;
function ofMealCheck() { const on = !!ck.meal; if (on !== ofMealOn) { ofMealOn = on; recalc(); } }
HOOK.update.push(ofMealCheck);

/* ---------- o encantador: chances, sorteio duplo, pedra que volta ---------- */
// X% da chance de cada raridade sobe para a de cima, só para raridades que a pedra já alcança
function ofOdds(gemId, odds) {
  const o = odds.slice(), up = (i, pct) => { if (pct <= 0 || !o[i] || !o[i + 1]) return; const k = Math.min(o[i], Math.round(o[i] * pct / 100)); o[i] -= k; o[i + 1] += k; };
  const af = ofV('encanto', 'af:' + gemId); for (let i = 2; i >= 0; i--) up(i, af);
  up(2, ofV('encanto', 'sussurro')); up(1, ofV('encanto', 'veio')); up(0, ofV('encanto', 'brilho'));
  return o;
}
function ofWithOdds(gemId, f) { const g = GEM_OF[gemId]; if (!g) return f(); const o0 = g.odds; g.odds = ofOdds(gemId, o0); try { return f(); } finally { g.odds = o0; } }
{ const _ei = enchantItem; enchantItem = function (s, gemId) {
  return ofWithOdds(gemId, () => {
    let rar = _ei(s, gemId);
    if (ofV('encanto', 'segunda') || ofRoll('encanto', 'eco')) {
      const keep = { mods: s.mods, rar: s.rar, il: s.il }, r2 = _ei(s, gemId);
      if (r2 < rar) Object.assign(s, keep); else rar = r2;
    }
    ofLastEnc = { gem: gemId, rar };
    return rar;
  });
}; }
{ const _re = refreshEnc; refreshEnc = function () { return encOpen() && GEM_OF[encGem] ? ofWithOdds(encGem, () => _re()) : _re(); }; }
function ofOnEnc({ gem, rar }) {
  ofGain('encanto', 5 + 4 * Math.max(0, GEMS.findIndex(g => g.id === gem)));
  if (ofRoll('encanto', 'poupaGema') || (ofV('encanto', 'pedraViva') && rar <= 1)) reagGive(gem, 1);
  encDirty = true; invDirty = true;
}
// o lapidário: às vezes sai uma pedra a mais da rocha
{ const _bt = breakTile; breakTile = function (tx, ty) {
  const t = tileAt(tx, ty), r = _bt(tx, ty), id = ORE_ITEM[t];
  if (id && ITEMS[id] && ITEMS[id].gem && ofRoll('encanto', 'lapid')) dropLoot((tx + 0.5) * T, (ty + 1) * T - 1, id, 1, true);
  return r;
}; }

/* ---------- bônus no herói ---------- */
{ const _rc = recalc; recalc = function () {
  _rc();
  const w = equip.weapon, fio = ofV('forja', 'fio');
  if (fio && w && ITEMS[w.id] && ITEMS[w.id].forged) {
    const k = 1 + fio / 100; pl.dmgMin = Math.max(1, Math.round(pl.dmgMin * k)); pl.dmgMax = Math.max(pl.dmgMin, Math.round(pl.dmgMax * k));
    pl.dmg = (pl.dmgMin + pl.dmgMax) / 2; pl.dps *= k;
  }
  const sm = ofV('forja', 'sobMedida');
  if (sm) for (const k of EQ_SLOTS) { const s = equip[k], it = s && ITEMS[s.id]; if (it && it.forged && (it.slot === 'head' || it.slot === 'body' || it.slot === 'feet')) pl.def += sm; }
  if (ck.meal) {
    pl.def += ofV('cozinha', 'barriga');
    const b = ofV('cozinha', 'banquete'); if (b) pl.maxHp = Math.round(pl.maxHp * (1 + b / 100));
  }
  if (pl.hp > pl.maxHp) pl.hp = pl.maxHp;
}; }

/* ---------- pôr e tirar pontos ---------- */
function ofAdd(id, el) {
  const why = ofWhy(id); if (why) { bad(el); return; }
  const s = OF_SK[id]; ofi[s.prof].sk[id] = (ofi[s.prof].sk[id] || 0) + 1;
  tone(392, 0.16, 'triangle', 0.07); tone(587, 0.22, 'triangle', 0.05, 0, 0.05); noise(0.14, 0.06, 1800, 'bandpass', 0, 0.8);
  if (ofi[s.prof].sk[id] === s.max) tone(784, 0.32, 'sine', 0.05, 0, 0.1);
  ofChanged(s.prof);
}
function ofSub(id, el) {
  if (!ofCanSub(id)) { bad(el); return; }
  const s = OF_SK[id], S = ofi[s.prof]; if (--S.sk[id] <= 0) delete S.sk[id];
  tone(330, 0.14, 'triangle', 0.05, -120); noise(0.1, 0.06, 600, 'lowpass');
  ofChanged(s.prof);
}
function ofChanged(p) {
  ofDirty(p); recalc(); invDirty = true;
  if (p === 'encanto' && typeof encDirty !== 'undefined') encDirty = true;
  if (p === 'forja') { forgeDirty = true; if (typeof refreshCraft === 'function') refreshCraft(); }
  if (p === 'cozinha') ck.dirty = true;
  saveGame();
}

/* ================= a tela ================= */
const OF_BW = 120, OF_BH = 162;
const ofCX = c => 20 + c * 40, ofCY = r => 16 + r * 26;
const OFUI = {};
function ofDirty(p) { const U = OFUI[p]; if (U) U.dirty = true; ofTabPip(p); }
function ofTabPip(p) { const U = OFUI[p]; if (U) U.tabBtn.classList.toggle('pts', ofPts(p) > 0); }

/* ---- a arte: a placa, os encaixes, as setas, os talentos ---- */
const ofBgCache = {};
function ofBoardBg(p) {
  if (ofBgCache[p]) return ofBgCache[p];
  const c = mk(OF_BW, OF_BH), x = c.getContext('2d');
  if (p === 'cozinha') vBoards(x, 0, 0, OF_BW, OF_BH, RAMP.beam, 3302);
  else if (p === 'encanto') vMasonry(x, 0, 0, OF_BW, OF_BH, 3303, { ramps: [RAMP.stoneB, RAMP.stoneBlue] });
  else vMasonry(x, 0, 0, OF_BW, OF_BH, 3301, { heat: (px, py) => py > 132 ? (py - 132) / 30 : 0, soot: (px, py) => py < 10 ? (10 - py) * 0.12 : 0 });
  // a placa escurece para os talentos saltarem; moldura entalhada
  x.fillStyle = 'rgba(8,5,10,.42)'; x.fillRect(0, 0, OF_BW, OF_BH);
  x.fillStyle = '#060408'; x.fillRect(0, 0, OF_BW, 1); x.fillRect(0, OF_BH - 1, OF_BW, 1); x.fillRect(0, 0, 1, OF_BH); x.fillRect(OF_BW - 1, 0, 1, OF_BH);
  x.fillStyle = 'rgba(255,240,210,.10)'; x.fillRect(1, 1, OF_BW - 2, 1); x.fillRect(1, 1, 1, OF_BH - 2);
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(1, OF_BH - 2, OF_BW - 2, 1); x.fillRect(OF_BW - 2, 1, 1, OF_BH - 2);
  return (ofBgCache[p] = c);
}
// um encaixe cavado na placa: borda escura em cima e à esquerda, clara embaixo e à direita
function ofSocket(x, cx, cy) {
  const X = cx - 11, Y = cy - 11;
  x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(X, Y, 22, 22);
  x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(X, Y, 22, 1); x.fillRect(X, Y, 1, 22);
  x.fillStyle = 'rgba(255,236,200,.16)'; x.fillRect(X, Y + 22, 23, 1); x.fillRect(X + 22, Y, 1, 22);
}
// a seta do talento que pede para o que é pedido: desce pela coluna e entra pelo lado (ou por cima, na mesma coluna)
function ofArrow(x, a, b, lit) {
  const col = lit ? '#e8b85a' : '#5c4a38', hi = lit ? '#fff0b8' : '#7a6650';
  const ax = ofCX(a.c), ay = ofCY(a.r) + 12, bx = ofCX(b.c), by = ofCY(b.r), R = [], H = [];
  if (a.c === b.c) {
    const ty = by - 12; R.push([ax - 1, ay, 2, ty - 3 - ay]);
    for (let i = 0; i < 4; i++) H.push([ax - 1 - i, ty - i, 2 + 2 * i, 1]);
  } else {
    const d = a.c < b.c ? 1 : -1, tx = bx - 12 * d;
    R.push([ax - 1, ay, 2, by + 1 - ay]);
    if (d > 0) R.push([ax - 1, by - 1, tx - 3 - (ax - 1), 2]); else R.push([tx + 4, by - 1, ax + 1 - (tx + 4), 2]);
    for (let i = 0; i < 4; i++) H.push([tx - i * d, by - 1 - i, 1, 2 + 2 * i]);
  }
  x.fillStyle = '#0a0608'; for (const [X, Y, W, Hh] of R.concat(H)) x.fillRect(X - 1, Y - 1, W + 2, Hh + 2);
  x.fillStyle = col; for (const [X, Y, W, Hh] of R.concat(H)) x.fillRect(X, Y, W, Hh);
  x.fillStyle = hi; for (const [X, Y, W, Hh] of R) { if (W > Hh) x.fillRect(X, Y, W, 1); else x.fillRect(X, Y, 1, Hh); }
}
function ofDrawBoard(U) {
  const p = U.p, S = ofi[p], T = OFICIOS[p].tabs[U.tab], x = U.cv.getContext('2d');
  x.clearRect(0, 0, OF_BW, OF_BH); x.drawImage(ofBoardBg(p), 0, 0);
  // linhas ainda fechadas pelo nível do ofício ficam na sombra
  OF_ROW_LVL.forEach((L, r) => { if (S.lvl < L) { x.fillStyle = 'rgba(4,2,6,.5)'; x.fillRect(2, ofCY(r) - 13, OF_BW - 4, 26); } });
  for (const s of T.sk) ofSocket(x, ofCX(s.c), ofCY(s.r));
  for (const s of T.sk) for (const q of s.req) { const a = OF_SK[q]; ofArrow(x, a, s, (S.sk[q] || 0) > 0); }
}
// o ícone do talento (20×20): aro de ferro (trancado), bronze (disponível) ou ouro (com pontos); cinza enquanto não tem ponto
const ofIcCache = {};
function ofIconURL(s, st) {
  const key = s.id + st; if (ofIcCache[key]) return ofIcCache[key];
  const N = 20, c = mk(N, N), g = c.getContext('2d'), P = TAL_RIM[Math.min(2, st)];
  const put = (px, py, col) => { g.fillStyle = col; g.fillRect(px, py, 1, 1); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = Math.min(x, y, N - 1 - x, N - 1 - y);
    if (e === 0) { put(x, y, '#060408'); continue; }
    if (e <= 2) { const lit = x + y < N - 1; let col = e === 1 ? (lit ? P.hi : P.lo) : P.mid; if (talHash(x, y, 7) < 0.14) col = P.lo; put(x, y, col); continue; }
    const bg = st >= 2 ? '#2a1c10' : st === 1 ? '#1d1a22' : '#141118';
    put(x, y, talHash(x, y, 2) < 0.2 ? talShade(bg, 1.3) : (e === 3 && x + y >= N - 1) ? talShade(bg, 0.6) : bg);
  }
  // o desenho: o ícone de um item do jogo, ou um ícone da árvore de combate
  const t = mk(16, 16), tg = t.getContext('2d', { willReadFrequently: true });
  const [kind, ref] = s.ic.split(':');
  if (kind === 'i' && ICON[ref]) { const cv = ICON[ref].cv; tg.drawImage(cv, Math.floor((16 - cv.width) / 2), Math.floor((16 - cv.height) / 2)); }
  else if (TAL_ICON[ref]) {
    TAL_ICON[ref].forEach((row, y) => { for (let x = 0; x < 9; x++) { const h = TAL_ICPAL[row[x]]; if (!h) continue; tg.fillStyle = 'rgba(0,0,0,.6)'; tg.fillRect(4 + x, 4 + y, 1, 1); } });
    TAL_ICON[ref].forEach((row, y) => { for (let x = 0; x < 9; x++) { const h = TAL_ICPAL[row[x]]; if (!h) continue; tg.fillStyle = h; tg.fillRect(3 + x, 3 + y, 1, 1); } });
  }
  if (st < 2) {   // cinza, mais apagado quando trancado (uma vez só, guardado no cache)
    const d = tg.getImageData(0, 0, 16, 16), a = d.data, k = st === 1 ? 0.75 : 0.42;
    for (let i = 0; i < a.length; i += 4) { const l = (0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]) * k; a[i] = l * 0.96; a[i + 1] = l * 0.96; a[i + 2] = Math.min(255, l * 1.06); }
    tg.putImageData(d, 0, 0);
  }
  g.drawImage(t, 2, 2);
  return (ofIcCache[key] = c.toDataURL());
}
// 0 trancado (nível do ofício ou seta faltando), 1 disponível, 2 com pontos, 3 no máximo
const ofState = s => { const r = ofRank(s.id); if (r >= s.max) return 3; if (r > 0) return 2; return ofi[s.prof].lvl >= OF_ROW_LVL[s.r] && s.req.every(q => ofRank(q) > 0) ? 1 : 0; };

/* ---- montar a aba numa janela ---- */
function ofMount(p, section, tabs) {
  if (OFUI[p]) return OFUI[p];
  const U = OFUI[p] = { p, section, tab: 0, on: false, hover: null, dirty: true, s: 0, btns: {} };
  const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'tab oftab'; tb.textContent = 'Talentos'; tabs.appendChild(tb); U.tabBtn = tb;
  const root = document.createElement('div'); root.className = 'oftal of-' + p;
  root.innerHTML = `<div class="ofboard"><canvas width="${OF_BW}" height="${OF_BH}" aria-hidden="true"></canvas><div class="ofsks"></div></div>
    <div class="ofside">
      <div class="ofhd"><h4>${OFICIOS[p].name}</h4><span class="oflv"></span></div>
      <div class="ofxp"><i></i><span></span></div>
      <div class="ofpts"><b></b><span>pontos</span></div>
      <div class="ofgal">${OFICIOS[p].tabs.map((T, i) => `<button type="button" class="ofg" data-i="${i}">${T.name}<small></small></button>`).join('')}</div>
      <div class="ofinfo tipbox pdtip"></div>
    </div>`;
  section.appendChild(root); U.root = root; U.cv = root.querySelector('canvas'); U.board = root.querySelector('.ofboard');
  const box = root.querySelector('.ofsks');
  for (const T of OFICIOS[p].tabs) for (const s of T.sk) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ofsk'; b.dataset.id = s.id; b.setAttribute('aria-label', s.n);
    b.innerHTML = '<img alt=""><b class="rk"></b>'; box.appendChild(b); U.btns[s.id] = b;
  }
  root.addEventListener('contextmenu', e => { e.preventDefault(); const b = e.target.closest('.ofsk'); if (b) ofSub(b.dataset.id, b); });
  root.addEventListener('click', e => {
    const b = e.target.closest('.ofsk'); if (b) { ofAdd(b.dataset.id, b); U.hover = b.dataset.id; return; }
    const g = e.target.closest('.ofg'); if (g) { const i = +g.dataset.i; if (U.tab !== i) { U.tab = i; U.hover = null; sfx.select(); U.dirty = true; } }
  });
  root.addEventListener('pointerover', e => { const b = e.target.closest('.ofsk'); if (b && U.hover !== b.dataset.id) { U.hover = b.dataset.id; ofInfo(U); } });
  tb.addEventListener('click', e => { e.stopPropagation(); if (!U.on) { sfx.select(); ofView(p, true); } }, true);
  tabs.addEventListener('click', e => { const t = e.target.closest('.tab'); if (t && t !== tb && U.on) ofView(p, false); }, true);
  ofTabPip(p);
  return U;
}
function ofView(p, on) {
  const U = OFUI[p]; if (!U) return;
  U.on = on; U.section.classList.toggle('ofon', on); U.dirty = true; hideTip();
  ofTabsOn(U);
  if (on) { ofSize(U); ofRender(U); }
  else if (p === 'forja') forgeDirty = true;
  else if (p === 'cozinha') ck.dirty = true;
  else if (p === 'encanto') encDirty = true;
}
function ofTabsOn(U) {
  for (const b of U.tabBtn.parentNode.querySelectorAll('.tab')) {
    if (b === U.tabBtn) b.classList.toggle('on', U.on);
    else if (U.on) b.classList.remove('on');
    else if (b.dataset.base) b.classList.add('on');
  }
}
// tamanho em múltiplos inteiros do pixel da placa
function ofSize(U) {
  const r = U.root, H = r.clientHeight, W = r.clientWidth;
  if (!H || !W) return;
  const s = Math.max(2, Math.min(Math.floor(H / OF_BH), Math.floor((W - 300) / OF_BW), 5));
  if (s === U.s) return; U.s = s;
  U.board.style.width = OF_BW * s + 'px'; U.board.style.height = OF_BH * s + 'px';
  U.root.style.setProperty('--ofs', s);
  for (const id in U.btns) { const k = OF_SK[id], b = U.btns[id]; b.style.left = (ofCX(k.c) - 10) * s + 'px'; b.style.top = (ofCY(k.r) - 10) * s + 'px'; b.style.width = b.style.height = 20 * s + 'px'; }
}
function ofRender(U) {
  if (!U.on) return;
  ofSize(U);
  if (!U.dirty) return; U.dirty = false;
  const p = U.p, S = ofi[p], T = OFICIOS[p].tabs[U.tab];
  ofDrawBoard(U);
  for (const id in U.btns) {
    const k = OF_SK[id], b = U.btns[id], show = k.tab === T.k; b.hidden = !show; if (!show) continue;
    const st = ofState(k), r = ofRank(id), url = ofIconURL(k, st), img = b.firstChild;
    if (img._u !== url) { img.src = url; img._u = url; }
    b.className = 'ofsk st' + st; b.lastChild.textContent = r ? (k.max > 1 ? r : '') : '';
    b.lastChild.hidden = !r || k.max === 1;
  }
  const need = ofNeed(S.lvl), max = S.lvl >= OF_MAX_LVL;
  U.root.querySelector('.oflv').innerHTML = `Nível <b>${S.lvl}</b>`;
  U.root.querySelector('.ofxp i').style.width = max ? '100%' : pct(Math.min(1, S.xp / need));
  U.root.querySelector('.ofxp span').textContent = max ? '' : `${Math.floor(S.xp)} / ${need}`;
  const pts = ofPts(p); U.root.querySelector('.ofpts b').textContent = pts; U.root.querySelector('.ofpts').classList.toggle('none', pts <= 0);
  U.root.querySelectorAll('.ofg').forEach((g, i) => {
    g.classList.toggle('on', i === U.tab);
    const n = OFICIOS[p].tabs[i].sk.reduce((a, k) => a + ofRank(k.id), 0); g.lastChild.textContent = n || '';
  });
  ofInfo(U);
}
// o quadro do talento: nome, pontos, o que faz agora e com o próximo ponto, o que falta
function ofInfo(U) {
  const T = OFICIOS[U.p].tabs[U.tab], s = OF_SK[U.hover] && OF_SK[U.hover].tab === T.k ? OF_SK[U.hover] : T.sk[0];
  const S = ofi[U.p], r = ofRank(s.id), st = ofState(s), col = st >= 2 ? '#ffd27a' : st === 1 ? '#efe2c4' : '#8e8b9c';
  let h = `<div class="tn" style="color:${col}">${s.n}</div><small>${T.name} · ${r} de ${s.max}</small>`;
  if (r > 0) h += `<p>${ofTxt(s, r)}</p>`;
  if (r < s.max) h += `<p class="${r ? 'nx' : ''}">${r ? 'Próximo ponto: ' : ''}${ofTxt(s, r + 1)}</p>`;
  if (S.lvl < OF_ROW_LVL[s.r]) h += `<em class="no">Requer ${OFICIOS[U.p].name} nível ${OF_ROW_LVL[s.r]}</em>`;
  const miss = s.req.filter(q => !(ofRank(q) > 0)); if (miss.length) h += `<em class="no">Requer ${miss.map(q => OF_SK[q].n).join(' e ')}</em>`;
  const box = U.root.querySelector('.ofinfo'); if (box._h !== h) { box.innerHTML = h; box._h = h; }
}
addEventListener('resize', () => { for (const p in OFUI) { const U = OFUI[p]; if (U.on) { U.s = 0; U.dirty = true; } } });

/* ---- pendurar nas três janelas ---- */
// a forja: o cabeçalho já tem abas (Fornalha, Bigorna e às vezes Runas)
{ const _bf = buildForgeUI; buildForgeUI = function () {
  const first = !forgeBuilt; _bf(); if (!first) return;
  ofMount('forja', document.querySelector('#forge .forgep'), document.querySelector('#forge .tabs'));
}; }
{ const _of = openForge; openForge = function (n) { _of(n); ofView('forja', false); }; }
{ const _rf = refreshForge; refreshForge = function () {
  const r = _rf();
  for (const p in OFUI) { const U = OFUI[p]; if (!U.on) continue; if (p === 'forja' ? !forgeOpen() : p === 'cozinha' ? !cookOpen() : !encOpen()) continue; ofTabsOn(U); ofRender(U); }
  return r;
}; }
// a cozinha: ganha abas no cabeçalho (Cozinha e Talentos)
function ofHeadTabs(section, base) {
  const h3 = section.querySelector('.ch h3'), tabs = document.createElement('div'); tabs.className = 'tabs'; tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = `<button class="tab on" type="button" data-base="1">${base}</button>`;
  h3.after(tabs); return tabs;
}
{ const _bc = buildCookUI; buildCookUI = function () {
  const first = !ck.built; _bc(); if (!first) return;
  const sec = document.querySelector('#cozinha .forgep'); ofMount('cozinha', sec, ofHeadTabs(sec, 'Cozinha'));
}; }
{ const _oc = openCook; openCook = function (n) { _oc(n); ofView('cozinha', false); }; }
// a oficina do Teodoro (a janela nasce na primeira vez que abre)
{ const _be = buildEncUI; buildEncUI = function () {
  const first = !encBuilt; _be(); if (!first) return;
  const sec = document.querySelector('#enc .encp'); ofMount('encanto', sec, ofHeadTabs(sec, 'Encantar'));
}; }
{ const _oe = openEnc; openEnc = function (n) { _oe(n); ofView('encanto', false); }; }

/* ---------- save ---------- */
{ const _ms = makeSave; makeSave = function () {
  const v = _ms();
  v.ofi = Object.fromEntries(OF_PROFS.map(p => [p, [Math.round(ofi[p].xp * 10) / 10, ofi[p].lvl, ofi[p].sk]]));
  v.ofi.c4 = ofC4;
  return v;
}; }
function ofLoad(o) {
  for (const p of OF_PROFS) {
    const S = ofi[p] = ofNew(), q = o && o[p]; if (!Array.isArray(q)) continue;
    S.lvl = clamp(q[1] | 0 || 1, 1, OF_MAX_LVL); S.xp = Math.max(0, +q[0] || 0);
    for (const id in q[2] || {}) { const s = OF_SK[id]; if (s && s.prof === p) { const n = clamp(q[2][id] | 0, 0, s.max); if (n) S.sk[id] = n; } }
    if (ofSpent(p) > S.lvl) S.sk = {};
  }
  ofC4 = o && +o.c4 || 0; ofMealOn = false;
  for (const p of OF_PROFS) ofDirty(p);
}
{ const _nw = newWorld; newWorld = function (sd, sv) { const r = _nw(sd, sv); ofLoad(sv && sv.ofi); recalc(); return r; }; }
