'use strict';

/* ================= runas: os efeitos comuns em jogo =================
   Tudo o que os nós comuns (RUNE_GEN, js/340) fazem quando o feitiço acerta, mata ou é lançado, e as peças que os nós
   próprios de cada feitiço usam (js/424-runas-feiticos):
   - rnHit: todo golpe de feitiço passa por aqui (fgHit, escHit e nevHit embrulhados; o Arco Voltaico chama direto).
     Marca qual runa está ferindo (runCur), mexe por um instante nos números do golpe (crítico, frio, choque,
     queimadura), e depois do golpe aplica o que vem com o acerto e com o abate. Cada acerto dá experiência à runa.
   - hitEnemy embrulhado: os bônus de dano por situação (chefe, vida baixa, resfriado...) e a Marca/Cinza de qualquer golpe.
   - rnSub: um golpe derivado (lasca, faísca, estouro) com uma fração do dano do feitiço. Golpe derivado não puxa
     outro estouro (runDepth), então nada vira cascata.
   - rnBlast: estouro em volta de um ponto. rnShots: projéteis pequenos (lascas, faíscas, bolinhas, pedras).
     rnFields: chão que fere, resfria ou acende por um tempo (rastro, geada, chão carregado).
   - Lançar: Eco (lança de novo de graça), Dádiva (devolve a mana), Barreira (escudo). RN_SPEC[id].cast roda depois.
   - hurtPlayer embrulhado: Postura Arcana, Abalo, Barreira e as proteções próprias (Armadura de Gelo, Muralha de Calor).
   Carrega depois de 341-runas e antes de 424-runas-feiticos (que embrulha o castArc). */

let runCur = null, runDepth = 0, rnInCast = null;
const RN_ID = new Map();   // objeto de números do feitiço → id da runa
for (const id in RUNE_BOARDS) RN_ID.set(RUNE_BOARDS[id].P, id);
// RN_SPEC[id] = { mult(e, S), crit(e, S), pre(e, S, F), hit(e, S, dmg, dir, F), kill(e, S), cast(S), hurt(srcX, S) }
const RN_SPEC = {};
const rnSt = id => RUNE_ST[id] || {};
const rnIdOf = F => F ? (F.rn || RN_ID.get(F) || null) : null;
const rnElem = id => RUNE_BOARDS[id] ? RUNE_BOARDS[id].elem : 'raio';
const rnCx = e => e.x + e.w / 2, rnCy = e => e.y + e.h / 2;
const rnAlive = e => e && !e.dead && !(e.boss && e.state === 'intro') && !(e.type === 'ghost' && e.vis < 0.5);
const rnChilled = e => (e.nevChillT || 0) > 0 || (e.nevFrz || 0) > 0;
const RN_COL = { raio: ['#ffffff', '#bfe6ff', '#5aa8ff'], gelo: ['#ffffff', '#d8f4ff', '#8fd0f0'], fogo: ['#fff6d0', '#ffb040', '#ff6a1a'] };
function rnNearest(x, y, r, skip, los = true) {
  let best = null, bd = r;
  for (const e of enemies) { if (!rnAlive(e) || (skip && skip(e))) continue; const d = Math.hypot(rnCx(e) - x, rnCy(e) - y); if (d < bd && (!los || losClear(x, y, rnCx(e), rnCy(e)))) { bd = d; best = e; } }
  return best;
}
// a recarga de cada feitiço mora num lugar diferente
function rnGetCD(id) {
  const k = id.slice(8);
  if (id === 'feitico_arco') return arcCD; if (id === 'feitico_nevasca') return nevCD;
  if (FOGO[k]) return fgCD[k] || 0; return escCD[k] || 0;
}
function rnSetCD(id, v) {
  const k = id.slice(8);
  if (id === 'feitico_arco') arcCD = v; else if (id === 'feitico_nevasca') nevCD = v;
  else if (FOGO[k]) fgCD[k] = v; else escCD[k] = v;
}
// coisas para daqui a pouco (segunda onda, meteoros a mais...)
const rnLaterQ = [];
const rnLater = (t, fn) => rnLaterQ.push({ t, fn });

/* ---- o golpe ---- */
function rnHit(id, e, F, call, dir) {
  if (!e || e.dead) return call();
  const S = rnSt(id), el = rnElem(id), prev = runCur, sp = RN_SPEC[id];
  const hp0 = e.hp, bk = { crit: pl.crit, critDmg: pl.critDmg, xpB: pl.xpB };
  pl.crit = (pl.crit || 0) + (S.crit || 0) + (e.boss ? S.bossCrit || 0 : 0) + ((e.stun || 0) > 0 ? S.stunCrit || 0 : 0) + (sp && sp.crit ? sp.crit(e, S) || 0 : 0);
  if (S.critD) pl.critDmg = (pl.critDmg || 0.75) + S.critD;
  if (S.xpKill) pl.xpB = (pl.xpB || 0) + S.xpKill;
  const my = { crit: pl.crit, critDmg: pl.critDmg, xpB: pl.xpB };
  const nv = { chill: NEV.chill, freeze: NEV.freeze, freezeAt: NEV.freezeAt }, shk0 = ESC.shock.stun, bd = FOGO.burn.dur;
  if (el === 'gelo') { NEV.chill += S.chillT || 0; NEV.freeze += S.frzT || 0; NEV.freezeAt = Math.max(2, NEV.freezeAt - (S.frzAt || 0)); }
  if (el === 'raio') ESC.shock.stun += S.stunT || 0;
  if (el === 'fogo') FOGO.burn.dur += S.burnT || 0;
  const undo = sp && sp.pre ? sp.pre(e, S, F) : null;
  runCur = id; let ok;
  try { ok = call(); }
  finally {
    runCur = prev;
    // se algo recalculou o herói no meio do golpe (subiu de nível...), fica o valor novo
    for (const f in bk) if (pl[f] === my[f]) pl[f] = bk[f];
    Object.assign(NEV, nv); ESC.shock.stun = shk0; FOGO.burn.dur = bd;
    if (undo) undo();
  }
  const dealt = Math.min(hp0, Math.max(0, hp0 - e.hp));
  if (dealt > 0) {
    if (!dir) dir = rnCx(e) >= pl.x + pl.w / 2 ? 1 : -1;
    rnOnHit(id, S, e, dealt, dir, F);
    if (e.dead) rnOnKill(id, S, e);
  }
  return ok;
}
function rnOnHit(id, S, e, dmg, dir, F) {
  const el = rnElem(id), sp = RN_SPEC[id];
  runGain(id, 1 + (S.xp || 0));
  const c = e.rnCombo; e.rnCombo = c && c.id === id && gameTime - c.t < 2 ? { id, n: c.n + 1, t: gameTime } : { id, n: 1, t: gameTime };
  if (S.leech && !pl.dead) { pl.rnLs = (pl.rnLs || 0) + dmg * S.leech; if (pl.rnLs >= 1) { const h = Math.floor(pl.rnLs); pl.rnLs -= h; pl.hp = Math.min(pl.maxHp, pl.hp + h); } }
  if (S.manaHit) pl.mana = Math.min(pl.maxMana, pl.mana + S.manaHit);
  if (e.dead) return;
  if (S.vuln) { e.rnVulnP = e.rnVulnT > gameTime ? Math.max(e.rnVulnP, S.vuln) : S.vuln; e.rnVulnT = gameTime + 3; }
  if (S.weak) { e.rnWeakP = e.rnWeakT > gameTime ? Math.max(e.rnWeakP, S.weak) : S.weak; e.rnWeakT = gameTime + 3; }
  if (S.knock && !e.boss) { e.vx = dir * 70 * S.knock; if (!(ET[e.type] && ET[e.type].fly)) e.vy = Math.min(e.vy, -40 * S.knock); }
  if (el === 'raio' && S.shockC && Math.random() < S.shockC) rnStun(e, 0.4 + (S.stunT || 0));
  if (S.mercy && !e.boss && e.hp < e.maxHp * S.mercy) { burst(rnCx(e), rnCy(e), 10, RN_COL[el][0], 70, 0, 0.35, 1, true); killEnemy(e); rnOnKill(id, S, e); return; }
  if (runDepth > 0) return;
  if (el === 'raio' && S.zapH && Math.random() < S.zapH) {
    const t = rnNearest(rnCx(e), rnCy(e), 64, q => q === e);
    if (t) { rnZap(rnCx(e), rnCy(e), t); rnSub(id, t, 0.5); }
  }
  if (sp && sp.hit) sp.hit(e, S, dmg, dir, F);
}
function rnOnKill(id, S, e) {
  if (e.rnKilled) return; e.rnKilled = true;
  const el = rnElem(id), sp = RN_SPEC[id], x = rnCx(e), y = rnCy(e);
  if (S.manaKill) pl.mana = Math.min(pl.maxMana, pl.mana + S.manaKill);
  if (S.lifeKill && !pl.dead) { pl.hp = Math.min(pl.maxHp, pl.hp + S.lifeKill); floatText(pl.x + pl.w / 2, pl.y - 6, '+' + S.lifeKill, '#7dff8a', 0.7); }
  if (S.cdKill) rnSetCD(id, rnGetCD(id) - S.cdKill);
  if (S.momentum) pl.rnMomT = gameTime + 3;
  if (runDepth > 0) return;   // um estouro não puxa outro estouro
  if (el === 'raio' && S.chainK) { const t = rnNearest(x, y, 72, q => q === e); if (t) { rnZap(x, y, t); rnSub(id, t, S.chainK); } }
  if (el === 'gelo' && S.shatterK && (e.nevFrz || 0) > 0) for (let k = 0; k < 6; k++) rnShot(id, x, y, k / 6 * Math.PI * 2 + 0.3, 150, 0.35, { frac: 0.4 });
  if (S.boom) rnBlast(id, x, y, 28, S.boom);
  if (sp && sp.kill) sp.kill(e, S);
}
function rnStun(e, t) {
  if (e.dead) return;
  e.stun = Math.max(e.stun || 0, e.boss ? t * 0.3 : t);
  burst(rnCx(e), rnCy(e), 6, '#f2fbff', 60, 0, 0.3, 1, true);
}
function rnZap(x, y, t) { const b = arcBolt([[x, y], [rnCx(t), rnCy(t)]]); b.life = 0.2; arcs.push(b); sfx.rzZap(); }
// somar golpes para congelar com o frio da runa (Frio Longo, Gelo Rápido, Gelo Fundo)
function rnAddStacks(id, e, n) {
  if (!e || e.dead || !(n > 0)) return;
  const S = rnSt(id), nv = { chill: NEV.chill, freeze: NEV.freeze, freezeAt: NEV.freezeAt };
  NEV.chill += S.chillT || 0; NEV.freeze += S.frzT || 0; NEV.freezeAt = Math.max(2, NEV.freezeAt - (S.frzAt || 0));
  try { escChill(e, n); } finally { Object.assign(NEV, nv); }
}
// acender com a queimadura da runa (Brasa Viva, Fogo Lento, Alastrar, Cinza)
function rnIgnite(id, e) {
  if (!rnAlive(e)) return;
  const S = rnSt(id), d = FOGO.burn.dur, prev = runCur;
  FOGO.burn.dur += S.burnT || 0; runCur = id;
  try { fgIgnite(e); } finally { runCur = prev; FOGO.burn.dur = d; }
}

/* ---- golpes derivados: uma fração do dano do feitiço, pelo caminho da escola dele ---- */
function rnSub(id, e, frac, o) {
  if (!rnAlive(e) || !(frac > 0)) return false;
  const B = RUNE_BOARDS[id], P = B.P, el = B.elem;
  const F = { min: Math.max(0.5, (P.min || 1) * frac), max: Math.max(0.5, (P.max || 2) * frac), rn: id, stacks: (o && o.stacks) || 1 };
  const dir = rnCx(e) >= (o && o.x != null ? o.x : pl.x + pl.w / 2) ? 1 : -1;
  runDepth++;
  try { return el === 'fogo' ? fgHit(e, F, dir, true) : escHit(e, F, el, dir, true); } finally { runDepth--; }
}
function rnBlast(id, x, y, r, frac, o) {
  const el = rnElem(id), C = RN_COL[el];
  for (const e of enemies) {
    if (!rnAlive(e)) continue;
    const nx = clamp(x, e.x, e.x + e.w), ny = clamp(y, e.y, e.y + e.h);
    if (Math.hypot(nx - x, ny - y) > r || !losClear(x, y, rnCx(e), rnCy(e))) continue;
    rnSub(id, e, frac, Object.assign({ x }, o));
  }
  if (el === 'fogo') { fgBooms.push({ x, y, r, t: 0, life: 0.34 }); sfx.fgBoom(false); }
  else if (el === 'gelo') { glBreak(x, y, 12); sfx.nevShatter(); }
  else { for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, b = arcBolt([[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r]]); b.life = 0.16; arcs.push(b); } sfx.rzZap(); }
  burst(x, y, Math.round(r * 0.6), C[1], r * 3, 0, 0.35, 1, true); burst(x, y, 6, C[0], 50, 0, 0.2, 1, true);
  shake(1.6);
}

/* ---- projéteis pequenos ---- */
const rnShots = [];
// o: frac (fração do dano; 0 só acende), g (gravidade), pierce, boom (raio do estouro no fim), size, ign, end(s)
function rnShot(id, x, y, a, spd, life, o) {
  const s = Object.assign({ id, x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, t: 0, life, frac: 0.4, g: 0, pierce: 0, boom: 0, size: 1, hit: new Set(), el: rnElem(id) }, o);
  rnShots.push(s); return s;
}
/* ---- chão (ou ar) que fere, resfria ou acende ---- */
const rnFields = [];
// caixa x0..x1 · y0..y1 · dur · tick · frac (0: só resfria ou acende) · stacks (gelo)
function rnField(id, x0, y0, x1, y1, dur, o) { const f = Object.assign({ id, x0, y0, x1, y1, t: 0, dur, tick: 0.4, cd: 0, frac: 0.3, stacks: 1, el: rnElem(id), seed: Math.random() * 99 | 0 }, o); rnFields.push(f); return f; }
// geada ou brasa num pedaço de chão: uma caixa baixa por coluna de bloco, cada uma no chão que tem debaixo dela
function rnFloorFields(id, x, y, half, dur, o) {
  let n = 0;
  for (let px = x - half; px < x + half; px += T) {
    const f = fgFloor(px + T / 2, y); if (f == null || Math.abs(f - y) > 3 * T) continue;
    rnField(id, px, f - 7, px + T, f, dur, o); n++;
  }
  return n;
}

/* ---- o hitEnemy: bônus por situação, Marca e Cinza ---- */
{
  const _he = hitEnemy;
  hitEnemy = function (e, dir, mult = 1, melee = false) {
    if (e && !e.dead) {
      if (e.rnVulnT > gameTime) mult *= 1 + e.rnVulnP;
      if (e.rnAsh && e.fgBurn > 0) mult *= 1 + e.rnAsh;
      if (runCur) mult = rnMult(runCur, e, mult);
    }
    return _he.call(this, e, dir, mult, melee);
  };
}
function rnMult(id, e, mult) {
  const S = rnSt(id), sp = RUNE_BOARDS[id] && RN_SPEC[id];
  let m = 1 + (S.dmg || 0);
  if (S.pen && mult < 1) mult = 1 - (1 - mult) * (1 - Math.min(1, S.pen));   // a resistência ao elemento vem no mult
  if (e.boss) m += S.boss || 0;
  if (S.exec && e.hp < e.maxHp * 0.35) m += S.exec;
  if (S.full && e.hp >= e.maxHp) m += S.full;
  if (rnChilled(e)) m += (S.chillP || 0) + (S.melt || 0);
  if ((e.nevFrz || 0) > 0) m += S.frozenP || 0;
  if (e.fgBurn > 0) m += S.burnP || 0;
  if ((e.stun || 0) > 0) m += S.stunP || 0;
  if (S.combo && e.rnCombo && e.rnCombo.id === id && gameTime - e.rnCombo.t < 2) m += S.combo * Math.min(5, e.rnCombo.n);
  if (S.momentum && pl.rnMomT > gameTime) m += S.momentum;
  if (S.manaHigh && pl.mana > pl.maxMana * 0.6) m += S.manaHigh;
  if (S.lowLife && pl.hp < pl.maxHp * 0.4) m += S.lowLife;
  const d = Math.hypot(rnCx(e) - (pl.x + pl.w / 2), rnCy(e) - (pl.y + pl.h / 2));
  if (S.far && d > 6 * T) m += S.far;
  if (S.near && d < 3 * T) m += S.near;
  if (sp && sp.mult) m += sp.mult(e, S) || 0;
  if (S.overload && Math.random() < S.overload) { m *= 3; burst(rnCx(e), rnCy(e), 12, '#ffffff', 110, 0, 0.3, 1, true); }
  return mult * m;
}
{ const _oc = onPlayerCrit; onPlayerCrit = function () { if (runCur) { const S = rnSt(runCur); if (S.critMana) pl.mana = Math.min(pl.maxMana, pl.mana + S.critMana); } return _oc.apply(this, arguments); }; }

/* ---- as escolas passam por rnHit ---- */
{ const _f = fgHit; fgHit = function (e, F, dir, soft) { const id = rnIdOf(F); return id ? rnHit(id, e, F, () => _f(e, F, dir, soft), dir) : _f(e, F, dir, soft); }; }
{ const _f = escHit; escHit = function (e, S, elem, dir, soft) { const id = rnIdOf(S); return id ? rnHit(id, e, S, () => _f(e, S, elem, dir, soft), dir) : _f(e, S, elem, dir, soft); }; }
{ const _f = nevHit; nevHit = function (e) { return rnHit('feitico_nevasca', e, NEV, () => _f(e), 0); }; }
// a queimadura lembra de quem acendeu: Brasa Viva, Alastrar e Cinza
{ const _f = fgIgnite; fgIgnite = function (e) { const r = _f(e); if (runCur && rnElem(runCur) === 'fogo' && e.fgBurn > 0) { const S = rnSt(runCur); e.rnBurnD = S.burnD || 0; e.rnSpread = !!S.spread; e.rnAsh = S.ash || 0; } return r; }; }
{
  const _k = killEnemy;
  killEnemy = function (e) {
    const r = _k.apply(this, arguments);
    if (e && e.rnSpread && e.fgBurn > 0) for (const q of enemies) {
      if (q === e || !rnAlive(q) || Math.hypot(rnCx(q) - rnCx(e), rnCy(q) - rnCy(e)) > 44) continue;
      const d = FOGO.burn.dur; FOGO.burn.dur = Math.max(d, e.fgBurn);
      try { fgIgnite(q); } finally { FOGO.burn.dur = d; }
      q.rnBurnD = e.rnBurnD; q.rnSpread = true; q.rnAsh = e.rnAsh;
      burst(rnCx(q), rnCy(q), 8, '#ffb040', 60, -30, 0.4, 1, true);
    }
    return r;
  };
}

/* ---- lançar: Eco, Dádiva, Barreira e o que cada feitiço faz ao lançar ---- */
const rnEchoes = [];
function rnCastWrap(id, fn) {
  return function () {
    const m0 = pl.mana, cd0 = rnGetCD(id), args = arguments, prev = rnInCast;
    rnInCast = id;
    let r; try { r = fn.apply(this, args); } finally { rnInCast = prev; }
    const spent = m0 - pl.mana; if (!(spent > 0) && rnGetCD(id) <= cd0) return r;
    rnOnCast(id, spent, () => { const p = rnInCast; rnInCast = id; try { return fn.apply(this, args); } finally { rnInCast = p; } });
    return r;
  };
}
function rnOnCast(id, spent, again) {
  const S = rnSt(id), sp = RN_SPEC[id];
  if (S.free && spent > 0 && Math.random() < S.free) { pl.mana = Math.min(pl.maxMana, pl.mana + spent); floatText(pl.x + pl.w / 2, pl.y - 10, '+' + Math.round(spent), '#7fb8ff', 0.75); }
  if (S.ward) pl.rnWard = Math.min(5 * S.ward, (pl.rnWard || 0) + S.ward);
  if (sp && sp.cast) sp.cast(S);
  if (S.echo && again && Math.random() < S.echo) rnEchoes.push({ id, t: 0.35, again });
}
castNevasca = rnCastWrap('feitico_nevasca', castNevasca);
{ const _cf = castFogo; castFogo = function (k) { return rnCastWrap('feitico_' + k, _cf).call(this, k); }; }
{ const _ec = escCast; escCast = function (k) { return rnCastWrap('feitico_' + k, _ec).call(this, k); }; }

/* ---- o herói apanhando ---- */
const rnHeldId = () => { const h = heldBag(); return h && RUNE_BOARDS[h.s.id] ? h.s.id : null; };
{
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, srcX, src, isProj) {
    if (!pl.dead && dmg > 0 && !(pl.invuln > 0)) {
      const id = rnHeldId(), S = id ? rnSt(id) : {}, sp = id && RN_SPEC[id];
      let k = 1;
      if (S.guard) k *= 1 - S.guard;
      if (src && src.rnWeakT > gameTime) k *= 1 - src.rnWeakP;
      if (sp && sp.hurt) k *= sp.hurt(srcX, S);
      if (pl.rnArmorT > gameTime) k *= 1 - pl.rnArmorP;
      if (k !== 1) dmg = Math.max(1, Math.round(dmg * k));
      if (pl.rnWard > 0) {
        const a = Math.min(pl.rnWard, dmg); pl.rnWard -= a; dmg -= a;
        burst(pl.x + pl.w / 2, pl.y + 8, 8, '#bfe6ff', 60, 0, 0.3, 1, true);
        if (dmg <= 0) { floatText(pl.x + pl.w / 2, pl.y - 8, 'ESCUDO', '#bfe6ff', 0.8); pl.invuln = Math.max(pl.invuln || 0, 0.2); return 'none'; }
      }
    }
    return _hp.call(this, dmg, srcX, src, isProj);
  };
}

/* ---- mundo novo: nada de feitiço de antes ---- */
{
  const _nw = newWorld;
  newWorld = function (sd, sv) {
    _nw(sd, sv);
    for (const a of [rnShots, rnFields, rnEchoes, rnLaterQ]) a.length = 0;
    pl.rnWard = 0; pl.rnArmorT = 0; pl.rnMomT = 0; pl.rnLs = 0; pl.rnRg = 0;
  };
}

/* ---- a cada quadro ---- */
const rnTouch = (e, x, y, pad) => x > e.x - pad && x < e.x + e.w + pad && y > e.y - pad && y < e.y + e.h + pad;
HOOK.update.push(dt => {
  for (let i = rnLaterQ.length - 1; i >= 0; i--) { const q = rnLaterQ[i]; q.t -= dt; if (q.t > 0) continue; rnLaterQ.splice(i, 1); if (!pl.dead) q.fn(); }
  // o eco: lança de novo sem gastar mana e sem mexer na recarga
  for (let i = rnEchoes.length - 1; i >= 0; i--) {
    const q = rnEchoes[i]; q.t -= dt; if (q.t > 0) continue; rnEchoes.splice(i, 1);
    if (pl.dead) continue;
    const m = pl.mana, cd = rnGetCD(q.id);
    pl.mana = pl.maxMana + 999; try { q.again(); } finally { pl.mana = m; rnSetCD(q.id, cd); }
    floatText(pl.x + pl.w / 2, pl.y - 10, 'ECO', RN_COL[rnElem(q.id)][1], 0.75);
  }
  // com o feitiço na mão: Concentração e Vigília
  const id = rnHeldId();
  if (id && !pl.dead) {
    const S = rnSt(id);
    if (S.regenM) pl.mana = Math.min(pl.maxMana, pl.mana + S.regenM * dt);
    if (S.regenL) { pl.rnRg = (pl.rnRg || 0) + S.regenL * dt; if (pl.rnRg >= 1) { pl.rnRg -= 1; pl.hp = Math.min(pl.maxHp, pl.hp + 1); } }
  }
  // Brasa Viva: a queimadura acesa pela runa fere a mais a cada tique (o tique do js/113 sobe o fgBurnT de volta)
  for (const e of enemies) {
    if (e.dead || !(e.fgBurn > 0)) { if (e.rnBT != null) { e.rnBT = null; e.rnBurnD = 0; e.rnSpread = false; e.rnAsh = 0; } continue; }
    if (e.rnBurnD && e.rnBT != null && e.fgBurnT > e.rnBT + 0.0001) {
      e.rnBAcc = (e.rnBAcc || 0) + FOGO.burn.dmg * (1 + (pl.spellPct || 0)) * fgAff(e) * e.rnBurnD;
      if (e.rnBAcc >= 1) { const d = Math.floor(e.rnBAcc); e.rnBAcc -= d; e.hp -= d; e.flash = 0.06; floatText(rnCx(e) + 4, e.y - 2, String(d), SPELL_ELEM.fogo.col, 0.7); if (e.hp <= 0) killEnemy(e); }
    }
    e.rnBT = e.fgBurnT;
  }
  // projéteis
  for (let i = rnShots.length - 1; i >= 0; i--) {
    const s = rnShots[i]; s.t += dt; let end = s.t >= s.life;
    s.vy += s.g * dt;
    const n = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) * dt / 3));
    for (let k = 0; k < n && !end; k++) {
      const nx = s.x + s.vx * dt / n, ny = s.y + s.vy * dt / n;
      if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { end = true; break; }
      s.x = nx; s.y = ny;
      for (const e of enemies) {
        if (s.hit.has(e) || !rnAlive(e) || !rnTouch(e, s.x, s.y, s.size)) continue;
        s.hit.add(e);
        if (s.frac > 0) rnSub(s.id, e, s.frac, { x: s.x - s.vx * 0.01, stacks: s.stacks });
        if (s.ign) rnIgnite(s.id, e);
        if (s.pierce-- <= 0) { end = true; break; }
      }
    }
    if (Math.random() < dt * 30) parts.push({ x: s.x, y: s.y, vx: rnd(-6, 6), vy: rnd(-6, 6), g: 0, life: 0.2, max: 0.2, col: RN_COL[s.el][1], size: 1, glow: true });
    if (end) {
      rnShots.splice(i, 1);
      if (s.end) s.end(s);
      if (s.boom) rnBlast(s.id, s.x, s.y, s.boom, s.frac);
      else burst(s.x, s.y, 4, RN_COL[s.el][1], 40, 0, 0.2, 1, true);
    }
  }
  // chão
  for (let i = rnFields.length - 1; i >= 0; i--) {
    const f = rnFields[i]; f.t += dt; f.cd -= dt;
    if (f.t >= f.dur) { rnFields.splice(i, 1); continue; }
    if (f.cd > 0) continue; f.cd = f.tick;
    for (const e of enemies) {
      if (!rnAlive(e) || e.x + e.w < f.x0 || e.x > f.x1 || e.y + e.h < f.y0 || e.y > f.y1) continue;
      // as caixas do mesmo feitiço (o rastro inteiro, as colunas de geada) valem como uma só: um toque por vez em cada inimigo
      const ft = e.rnFt || (e.rnFt = {}); if ((ft[f.id] || 0) > gameTime) continue; ft[f.id] = gameTime + f.tick * 0.8;
      if (f.frac > 0) rnSub(f.id, e, f.frac, { x: (f.x0 + f.x1) / 2, stacks: f.stacks });
      else if (f.el === 'gelo') rnAddStacks(f.id, e, f.stacks);
      else if (f.el === 'fogo') rnIgnite(f.id, e);
    }
  }
});
/* ---- desenho dos projéteis e do chão ---- */
HOOK.drawTop.push((cx, cy) => {
  for (const s of rnShots) {
    const C = RN_COL[s.el], x = Math.round(s.x) - cx, y = Math.round(s.y) - cy, sp = Math.hypot(s.vx, s.vy) || 1;
    lc.fillStyle = C[2]; lc.fillRect(Math.round(x - s.vx / sp * 2), Math.round(y - s.vy / sp * 2), 1, 1);
    lc.fillStyle = C[1]; lc.fillRect(Math.round(x - s.vx / sp), Math.round(y - s.vy / sp), 1, 1);
    lc.fillStyle = C[0]; lc.fillRect(x - (s.size > 1 ? 1 : 0), y - (s.size > 1 ? 1 : 0), s.size > 1 ? 2 : 1, s.size > 1 ? 2 : 1);
  }
  // cada caixa de chão chia com pontinhos da cor do elemento, mais perto da base
  for (const f of rnFields) {
    const C = RN_COL[f.el], k = clamp(Math.min(f.t / 0.15, (f.dur - f.t) / 0.4), 0, 1), fl = Math.floor(gameTime * 12), h = f.y1 - f.y0;
    for (let x = Math.floor(f.x0); x < f.x1; x++) {
      const g = hash2(x, fl, f.seed); if (g > 0.4 * k) continue;
      const q = hash2(x, fl + 7, f.seed + 3), y = Math.round(f.y1 - 1 - q * q * h);
      lc.fillStyle = C[q < 0.2 ? 0 : q < 0.6 ? 1 : 2]; lc.fillRect(x - cx, y - cy, 1, 1);
    }
  }
});
