'use strict';

/* ================= talentos: a árvore grande do herói em jogo (dados em js/344-talentos-dados.js) =================
   - P abre uma tela que cobre o jogo inteiro (só os globos de vida e mana ficam por cima); P ou Esc fecha. A moldura e
     o cabeçalho são os da torre da Aurélia, como o tabuleiro de runas (js/341); a árvore é pedra escura entalhada com
     sulcos que acendem e medalhões.
   - A arte é pintada uma vez numa folha do tamanho da árvore (fundo com as artes das regiões; sulcos e medalhões, que
     se repintam só quando um nó muda; brilho dos nós ligados; o caminho sob o mouse) e a câmera só move e escala a
     folha com transform. Nada é redesenhado a cada quadro: o brilho pulsa com opacidade em CSS.
   - Arrastar move, a rodinha aproxima e afasta (preso ao ponto sob o mouse). Clique esquerdo num nó liga o caminho mais
     curto até ele, se houver pontos; clique direito devolve um nó que não deixe outro solto. Recomeçar devolve todos.
   - Pontos: 1 por nível do personagem (subir de nível continua sem dar nada direto; o ponto é a recompensa), mais os
     pontos de teste (Menu > Testes > Outros).
   - Os efeitos: os de soma entram no recalc por talentTot (velocidade de ataque e de movimento, esquiva, roubo de vida,
     espinhos); os de porcentagem sobre o total (vida, mana, defesa, crítico, aparo, regeneração) num recalc embrulhado
     aqui, por fora de todos; o dano em hitEnemy (pelo tipo do golpe: físico, corpo a corpo, feitiço e o elemento);
     resistências, dano recebido e Mente sobre Matéria em hurtPlayer e rawDamage; vigor, poções, mana ao matar,
     regeneração de mana e recarga dos feitiços nos lugares deles.
   - Save: chave `arv` (lista de ids) e `arvExtra` (pontos de teste). A árvore antiga salvava `tal`: é ignorado, então
     quem tinha pontos lá recebe todos de volta para gastar aqui.
   Carrega depois do 341-runas e do 339-testes (embrulha recalc, hitEnemy, hurtPlayer, rawDamage, spendVigor,
   drinkPotion, killEnemy, newWorld e makeSave). */

/* ---- estado ---- */
const arv = { on: new Set(['o']), extra: 0 };
let arvFx = {}, arvAny = false;
const arvTotal = () => Math.max(0, (pl.lvl | 0) + (arv.extra | 0));
const arvPoints = () => arvTotal() - (arv.on.size - 1);
function arvRecount() {
  const F = {};
  for (const id of arv.on) for (const [st, v] of ARV[id].fx) F[st] = (F[st] || 0) + v;
  arvFx = F; arvAny = arv.on.size > 1;
}

/* ---- efeitos ---- */
// as somas, junto com os itens (chamado de dentro do recalc, js/08)
function talentTot(tot) {
  const F = arvFx;
  for (const k of ['atkSpd', 'spd', 'dodge', 'lifeSteal', 'thorns']) if (F[k]) tot[k] += F[k] / 100;
}
// as porcentagens sobre o total: por fora de todos os outros recalc (montante, magia, ofícios...)
{
  const _recalc = recalc;
  recalc = function () {
    _recalc.apply(this, arguments);
    if (!arvAny) return;
    const F = arvFx, p = k => (F[k] || 0) / 100;
    pl.maxHp = Math.max(1, Math.round(pl.maxHp * (1 + p('hpPct'))));
    pl.maxMana = Math.max(1, Math.round(pl.maxMana * (1 + p('manaPct'))));
    pl.def = Math.max(0, Math.round(pl.def * (1 + p('defPct'))));
    pl.crit = F.noCrit ? 0 : Math.max(0, pl.crit * (1 + p('crit')));
    pl.critDmg = Math.max(0, pl.critDmg * (1 + p('critDmg')));
    if (pl.parry) pl.parry *= 1 + p('parry');
    if (F.stun) pl.stunCh = (pl.stunCh || 0) + p('stun');
    if (F.regen) pl.regenB += pl.maxHp * p('regen');
    // o dano físico entra direto no dano da arma, para a ficha (C) mostrar o mesmo número que sai no golpe
    const w = equip.weapon, k = arvPhysMult(!(w && KIND[ITEMS[w.id].kind] && KIND[ITEMS[w.id].kind].bow));
    if (k !== 1) {
      const r1 = v => Math.round(v * 10) / 10;
      pl.dmgMin = Math.max(1, r1(pl.dmgMin * k)); pl.dmgMax = Math.max(pl.dmgMin, r1(pl.dmgMax * k)); pl.dmg = (pl.dmgMin + pl.dmgMax) / 2;
    }
    // o dano de feitiços soma com o dos cajados, varinhas e tomos (pl.spellPct, js/92)
    if (F.dmgSpell) pl.spellPct = (pl.spellPct || 0) + p('dmgSpell');
    pl.dps = pl.dmg * pl.aps * (1 + Math.min(1, pl.crit) * pl.critDmg);
    if (pl.hp > pl.maxHp) pl.hp = pl.maxHp;
    if (pl.mana > pl.maxMana) pl.mana = pl.maxMana;
  };
}
// o dano: o físico já está no dano da arma (recalc acima); o de feitiço já está no pl.spellPct.
// Aqui só entram o dano geral e o do elemento nos golpes de feitiço.
const ARV_ELEM = { fogo: 'dmgFogo', gelo: 'dmgGelo', raio: 'dmgRaio' };
function arvPhysMult(melee) { const F = arvFx; return Math.max(0, 1 + ((F.dmgAll || 0) + (F.dmgFis || 0) + (melee ? F.dmgMelee || 0 : 0)) / 100); }
function arvElemMult(el) { const F = arvFx; return Math.max(0, 1 + ((F.dmgAll || 0) + (F[ARV_ELEM[el]] || 0)) / 100); }
function arvHitElem() {
  return typeof arcRoll !== 'undefined' && arcRoll ? 'raio' : typeof nevRoll !== 'undefined' && nevRoll ? 'gelo'
    : typeof fogoRoll !== 'undefined' && fogoRoll ? 'fogo' : typeof escRoll !== 'undefined' && escRoll ? escElem || 'raio' : null;
}
{
  const _hit = hitEnemy;
  hitEnemy = function (e, dir, mult = 1, melee = false) {
    const el = arvAny ? arvHitElem() : null;
    return _hit(e, dir, el ? mult * arvElemMult(el) : mult, melee);
  };
}
// a queimadura dos feitiços de fogo não passa pelo hitEnemy: o dano dela segue o dano de fogo da árvore
const ARV_BURN0 = typeof FOGO !== 'undefined' && FOGO.burn ? FOGO.burn.dmg : 0;
{
  const _rc = recalc;
  recalc = function () { _rc.apply(this, arguments); if (ARV_BURN0) FOGO.burn.dmg = ARV_BURN0 * (arvAny ? arvElemMult('fogo') : 1); };   // o de feitiços vem pelo pl.spellPct
}
// o dano recebido: resistências da árvore (por cima das dos elixires) e "recebe menos dano"; aparar que cura
{
  const _hurt = hurtPlayer;
  hurtPlayer = function (dmg, srcX, src, isProj) {
    const F = arvFx;
    if (arvAny && dmg > 0) {
      const k = typeof dmgKindOf === 'function' ? dmgKindOf(src, isProj) : null, all = F.resAll || 0;
      const r = k === 'fogo' ? (F.resFogo || 0) + all : k === 'frio' ? (F.resFrio || 0) + all : k === 'veneno' ? all : 0;
      const m = (1 - Math.min(75, r) / 100) * (1 - Math.min(75, F.lessTaken || 0) / 100);
      if (m !== 1) dmg = Math.max(1, Math.round(dmg * m));
    }
    const res = _hurt(dmg, srcX, src, isProj);
    if (res === 'parry' && F.parryHeal && !pl.dead && pl.hp < pl.maxHp) {
      const h = Math.max(1, Math.round(pl.maxHp * F.parryHeal / 100)); pl.hp = Math.min(pl.maxHp, pl.hp + h);
      floatText(pl.x + pl.w / 2, pl.y - 14, '+' + h, '#7dff8a', 0.8);
    }
    return res;
  };
  // Mente sobre Matéria: parte do golpe sai da mana
  const _raw = rawDamage;
  rawDamage = function (d, kdir) {
    const m = arvFx.mom;
    if (m > 0 && d > 0 && pl.mana >= 1) {
      const take = Math.min(Math.floor(pl.mana), Math.round(d * m / 100));
      if (take > 0) {
        pl.mana -= take; d -= take;
        floatText(pl.x + pl.w / 2, pl.y - 14, '-' + take, '#7fb8ff', 0.9);
        if (d <= 0) { pl.invuln = 0.75; pl.hurtFlash = 0.08; pl.lastHurt = gameTime; sfx.block(); return; }
      }
    }
    return _raw(d, kdir);
  };
}
// vigor do escudo mais barato
{
  const _vig = spendVigor;
  spendVigor = function (parry, boss) {
    const red = Math.min(60, arvFx.vigCost || 0);
    if (!red) return _vig(parry, boss);
    const cost = (parry ? VIG_PARRY : VIG_BLOCK) * (boss ? VIG_BOSS : 1) * (1 - red / 100);
    if (pl.vig - cost > 0) { pl.vig -= cost; pl.vigT = 0; return false; }
    return _vig(parry, boss);
  };
}
// poções curam mais
{
  const _dp = drinkPotion;
  drinkPotion = function () {
    const h0 = pl.potHeal || 0, r = _dp.apply(this, arguments), add = (pl.potHeal || 0) - h0;
    if (add > 0 && arvFx.potion) pl.potHeal += add * arvFx.potion / 100;
    return r;
  };
}
// mana ao matar
{
  const _kill = killEnemy;
  killEnemy = function (e) {
    const r = _kill.apply(this, arguments);
    if (arvFx.manaKill && !pl.dead) pl.mana = Math.min(pl.maxMana, pl.mana + pl.maxMana * arvFx.manaKill / 100);
    return r;
  };
}
// regeneração de mana e recarga dos feitiços
HOOK.update.push(dt => {
  if (!arvAny || pl.dead) return;
  const F = arvFx;
  if (F.manaRegen && pl.mana < pl.maxMana) pl.mana = Math.min(pl.maxMana, pl.mana + dt * 2.2 * F.manaRegen / 100);
  if (F.castSpd > 0) {
    const k = dt * F.castSpd / 100;
    if (typeof arcCD !== 'undefined' && arcCD > 0) arcCD -= k;
    if (typeof nevCD !== 'undefined' && nevCD > 0) nevCD -= k;
    for (const o of [typeof fgCD !== 'undefined' ? fgCD : null, typeof escCD !== 'undefined' ? escCD : null]) if (o) for (const q in o) if (o[q] > 0) o[q] -= k;
  }
});

/* ---- save ---- */
function arvLoad(list) {
  arv.on = new Set(['o']);
  if (Array.isArray(list)) {
    const want = new Set(list.filter(id => ARV[id])); let grew = true;
    while (grew && arvPoints() > 0) {
      grew = false;
      for (const id of want) if (!arv.on.has(id) && ARV[id].nb.some(m => arv.on.has(m)) && arvPoints() > 0) { arv.on.add(id); grew = true; }
    }
  }
  arvRecount();
}
{
  const _ms = makeSave;
  makeSave = function () { const o = _ms(); o.arv = [...arv.on].filter(id => id !== 'o'); if (arv.extra) o.arvExtra = arv.extra; return o; };
  const _nw = newWorld;
  newWorld = function (sd, sv) {
    _nw(sd, sv);
    const hp0 = pl.hp, max0 = pl.maxHp;
    arv.extra = Math.max(0, Math.round(+(sv && sv.arvExtra) || 0));
    arvLoad(sv && sv.arv); recalc();
    const saved = sv && sv.p && +sv.p.hp;
    pl.hp = hp0 >= max0 ? (saved ? clamp(saved, 1, pl.maxHp) : pl.maxHp) : Math.min(hp0, pl.maxHp);
    if (pl.mana > pl.maxMana) pl.mana = pl.maxMana;
    arvDirty = true; arvTesteTxt();
  };
}

/* ================= a arte ================= */
const ARV_C = 620, ARV_W = ARV_C * 2;            // a folha: o centro da árvore fica em ARV_C, ARV_C
const ARV_STONE = ['#07060c', '#0e0b16', '#151120', '#1d1830', '#2a2342', '#3a3058', '#4e4274'];
const arvRGB = h => { const v = parseInt(h.slice(1), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
const arvMix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const arvHex = c => '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const ARV_STONE_RGB = ARV_STONE.map(arvRGB);
const arvStone = v => ARV_STONE[clamp(Math.round(v), 0, 6)];
const ARV_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// ruído suave (para a pedra)
function arvNoise(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}

/* ---- as artes das regiões: cada uma devolve o tom (0 nada, 1 escuro ... 4 claro) num quadrado de -1 a 1 ---- */
const arvSeg = (p, q, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = clamp(((p - ax) * dx + (q - ay) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(p - ax - dx * t, q - ay - dy * t); };
function arvInPoly(p, q, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > q) !== (yj > q) && p < (xj - xi) * (q - yi) / (yj - yi) + xi) c = !c; } return c; }
const arvPolyD = (p, q, P) => { let m = 9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, arvSeg(p, q, P[j][0], P[j][1], P[i][0], P[i][1])); return m; };
const arvRot = (p, q, a) => [p * Math.cos(a) + q * Math.sin(a), -p * Math.sin(a) + q * Math.cos(a)];
const ARV_BOLT = [[0.18, -1], [-0.42, 0.08], [-0.04, 0.08], [-0.28, 1], [0.48, -0.18], [0.08, -0.18], [0.36, -1]];
const ARV_TONGUE = [[[-0.78, 0.15], [-0.32, 0.4], [-0.5, -0.5]], [[0.8, 0.25], [0.32, 0.45], [0.6, -0.32]]];
function arvFlame(p, q) {
  const w = p - 0.1 * Math.sin(q * 6 + 1) * (1 - q) / 2;
  if (Math.hypot(w, q - 0.38) < 0.58) return true;
  if (arvInPoly(w, q, [[-0.58, 0.38], [0.58, 0.38], [0.06, -0.98]])) return true;
  return ARV_TONGUE.some(T => arvInPoly(w, q, T));
}
const ARV_ART = {
  arcano(p, q) {
    const d = Math.hypot(p, q);
    if (Math.abs(d - 0.88) < 0.05) return 3;
    if (Math.abs(d - 0.62) < 0.035) return 2;
    if (d < 0.12) return 4;
    if (Math.abs(d - 0.2) < 0.03) return 2;
    if (d < 0.64) for (const o of [-Math.PI / 2, Math.PI / 2]) {
      const V = [0, 1, 2].map(k => [Math.cos(o + k * 2.094) * 0.62, Math.sin(o + k * 2.094) * 0.62]);
      for (let k = 0; k < 3; k++) if (arvSeg(p, q, V[k][0], V[k][1], V[(k + 1) % 3][0], V[(k + 1) % 3][1]) < 0.028) return 3;
    }
    if (d > 0.68 && d < 0.82) {   // as marcas de runa entre os anéis
      const a = Math.atan2(q, p), k = Math.round(a / (Math.PI / 6)), c = k * Math.PI / 6;
      const [u, v] = arvRot(p - Math.cos(c) * 0.75, q - Math.sin(c) * 0.75, c), g = ((k % 3) + 3) % 3;
      if (Math.abs(v) < 0.016 && Math.abs(u) < 0.055) return 4;
      if (g === 0 && Math.abs(u - 0.03) < 0.016 && Math.abs(v) < 0.045) return 4;
      if (g === 1 && Math.abs(u + 0.03) < 0.016 && v > 0 && v < 0.05) return 4;
      if (g === 2 && Math.abs(u) < 0.016 && Math.abs(v) < 0.04) return 4;
    }
    return 0;
  },
  raio(p, q) {
    const inn = arvInPoly(p, q, ARV_BOLT), e = arvPolyD(p, q, ARV_BOLT);
    if (inn) return e < 0.05 ? (p + q * 0.3 < 0.05 ? 4 : 2) : 3;
    return e < 0.11 ? -1 : 0;   // -1: o clarão em volta (pontilhado)
  },
  fogo(p, q) {
    const s = (k) => arvFlame(p / k, (q - 0.42) / k + 0.42);
    return s(0.5) ? 4 : s(0.76) ? 3 : arvFlame(p, q) ? 2 : 0;
  },
  gelo(p, q) {
    const d = Math.hypot(p, q);
    if (d < 0.1) return 4; if (d < 0.17) return 3; if (Math.abs(d - 0.21) < 0.025) return 1;
    const a = Math.atan2(q, p), k = Math.round(a / (Math.PI / 3)), [u, v0] = arvRot(p, q, k * Math.PI / 3), v = Math.abs(v0);
    if (u > 0 && u < 0.95 && v < 0.05) return u > 0.84 ? 4 : 3;
    for (const [u0, L] of [[0.42, 0.24], [0.66, 0.18]]) if (arvSeg(u, v, u0, 0, u0 + L * 0.6, L) < 0.038) return 2;
    if (Math.hypot(u - 0.95, v) < 0.06) return 4;
    return 0;
  },
  agilidade(p, q) {
    const [u, v] = arvRot(p, q, -0.85);   // a pena deitada na diagonal
    if (Math.abs(v) < 0.025 && u > -0.98 && u < 0.92) return 4;
    const w = 0.3 * Math.sqrt(Math.max(0, 1 - u * u)) * (u < -0.55 ? (u + 0.95) / 0.4 : 1);
    if (u > -0.95 && u < 0.92 && Math.abs(v) < w && !(u > 0.12 && u < 0.2 && v > 0)) return Math.sin((u + Math.abs(v) * 0.9) * 30) > 0.2 ? 3 : 2;
    for (let k = 0; k < 3; k++) { const y = 0.45 + k * 0.17; if (p > -0.98 && p < -0.38 + k * 0.12 && Math.abs(q - y - 0.08 * Math.sin(p * 5 + k)) < 0.024) return 2; }
    return 0;
  },
  critico(p, q) {
    const lens = (r) => Math.hypot(p, q - 0.55) < r && Math.hypot(p, q + 0.55) < r;
    const d = Math.hypot(p, q);
    if (Math.abs(p) < 0.02 && Math.abs(q) > 0.55 && Math.abs(q) < 0.98) return 2;
    if (Math.abs(q) < 0.02 && Math.abs(p) > 0.88 && Math.abs(p) < 1) return 2;
    if (!lens(1.0)) return 0;
    if (!lens(0.92)) return q < 0 ? 4 : 3;
    if (Math.abs(p) < 0.06 && Math.abs(q) < 0.24) return 1;
    if (d < 0.36) return d > 0.3 ? 4 : 3;
    return 0;
  },
  corpo(p, q) {
    for (const s of [-1, 1]) {
      const [u, v] = arvRot(p, q, s * Math.PI / 4);
      if (v > -0.98 && v < 0.42) { const w = v < -0.8 ? 0.08 * (v + 0.98) / 0.18 : 0.08; if (Math.abs(u) < w) return Math.abs(u) < 0.016 ? 2 : u * s < 0 ? 4 : 3; }
      if (Math.abs(v - 0.48) < 0.05 && Math.abs(u) < 0.28) return 2;
      if (Math.abs(u) < 0.045 && v > 0.53 && v < 0.84) return 1;
      if (Math.hypot(u, v - 0.9) < 0.075) return 3;
    }
    return 0;
  },
  fisico(p, q) {
    if (Math.abs(p) < 0.62 && q > -0.85 && q < -0.3) { if (Math.abs(p) > 0.5 && (q < -0.78 || q > -0.37)) return 0; return q < -0.76 ? 4 : p > 0.52 ? 2 : 3; }
    if (Math.abs(q + 0.575) < 0.1 && Math.abs(p) > 0.62 && Math.abs(p) < 0.7) return 2;
    if (Math.abs(p) < 0.08 && q >= -0.3 && q < 0.96) { for (const b of [0.15, 0.6]) if (Math.abs(q - b) < 0.04) return 4; return p < -0.02 ? 3 : 2; }
    return 0;
  },
  guarda(p, q) {
    const d = Math.hypot(p, q);
    if (d < 0.5) {
      if (d < 0.12) return 4; if (d < 0.16) return 1;
      const a = Math.atan2(q, p);
      if (Math.abs(d - 0.33) < 0.03 && Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.42) return 4;
      if (d > 0.42) return p + q < 0 ? 4 : 2;
      return 3;
    }
    if (d < 0.97) {
      const a = Math.atan2(q, p), st = Math.PI / 6, k = Math.round(a / st), dl = (a - k * st) * d, w = 0.12 * (0.97 - d) / 0.47;
      if (Math.abs(dl) < w) return dl < 0 ? 3 : 2;
    }
    return 0;
  },
  defesa(p, q) {
    const inS = (p, q) => q > -0.88 && Math.abs(p) < 0.72 * (q < 0.1 ? 1 : Math.max(0, 1 - Math.pow((q - 0.1) / 0.9, 1.6)));
    if (!inS(p, q)) return 0;
    if (!inS(p / 0.84, (q - 0.06) / 0.84)) return p < 0 || q < -0.7 ? 4 : 2;
    if (Math.abs(p) < 0.07 || Math.abs(q + 0.22) < 0.07) return 1;
    return 3;
  },
  vida(p, q) {
    const inn = Math.hypot(p + 0.36, q + 0.28) < 0.42 || Math.hypot(p - 0.36, q + 0.28) < 0.42 || arvInPoly(p, q, [[-0.76, -0.12], [0.76, -0.12], [0, 0.95]]);
    if (!inn) return 0;
    if (Math.hypot(p + 0.44, q + 0.42) < 0.14) return 4;
    if (p + q > 0.45) return 2;
    return 3;
  },
  mana(p, q) {
    for (const [x, y, s] of [[0.42, 0.18, 0.15], [0.62, -0.5, 0.1], [0.12, -0.6, 0.08]]) { const dx = Math.abs(p - x), dy = Math.abs(q - y); if ((dx < 0.022 && dy < s) || (dy < 0.022 && dx < s)) return 4; }
    const d = Math.hypot(p, q);
    if (d > 0.84 || Math.hypot(p - 0.36, q + 0.22) < 0.72) return 0;
    if (d > 0.74) return p < 0.1 ? 4 : 3;
    return Math.hypot(p - 0.36, q + 0.22) < 0.8 ? 2 : 3;
  }
};

/* ---- o fundo: pintado uma vez, pixel a pixel numa ImageData ---- */
function arvPaintBg(cv) {
  const W = ARV_W, C = ARV_C, g = cv.getContext('2d'), img = g.createImageData(W, W), D = img.data;
  const N = ARV_REG.length, SEC = Math.PI * 2 / N;
  const REG = ARV_REG.map(G => ({ a: G.a, art: ARV_ART[G.k], col: ['', 'R', 'O', 'Y', 'W'].map(k => k && arvRGB(G.col[k])), cx: Math.cos(G.a) * 300, cy: Math.sin(G.a) * 300 }));
  // as artes primeiro, numa grade de tons por região (para achar a borda e fazer a sombra entalhada)
  const H = 104, B = H * 2 + 1, LV = REG.map(R => { const L = new Int8Array(B * B); for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) L[j * B + i] = R.art((i - H) / H, (j - H) / H); return L; });
  const BL = [0, 0.3, 0.36, 0.42, 0.5];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const u = x - C, v = y - C, d = Math.hypot(u, v);
    // a pedra: clareia no meio, granulado e manchas
    let s = 2.15 - Math.max(0, d - 120) / 380 + (hash2(x, y, 3451) - 0.5) * 0.9 + (arvNoise(x, y, 26, 3452) - 0.5) * 1.5 + (arvNoise(x, y, 7, 3453) - 0.5) * 0.5;
    // anéis entalhados: em volta do começo e na borda da árvore
    for (const R of [78, 590]) { const k = Math.abs(d - R); if (k < 0.9) s -= 1.5; else if (k < 2 && d > R) s += 0.9; }
    // as divisas das regiões: sulcos tracejados do centro para fora
    const ang = Math.atan2(v, u), rel = ((ang + Math.PI / 2 + SEC / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), ri = Math.floor(rel / SEC) % N, off = rel - ri * SEC - SEC / 2;
    if (d > 150 && d < 586) { const pd = (SEC / 2 - Math.abs(off)) * d; if ((d % 16) > 5) { if (pd < 0.8) s -= 1.3; else if (pd < 1.8 && off < 0) s += 0.6; } }
    if (d > 600) s -= (d - 600) / 30;
    let c = ARV_STONE_RGB[clamp(Math.round(s), 0, 6)];
    // a cor da região, fraca, sumindo perto das divisas, do centro e da borda
    const R = REG[ri];
    if (d > 130 && d < 600) {
      const w = clamp((SEC / 2 - Math.abs(off)) * d / 40, 0, 1) * clamp((d - 130) / 70, 0, 1) * clamp((600 - d) / 50, 0, 1);
      if (w > 0) c = arvMix(c, R.col[1], 0.2 * w + (ARV_BAYER[(y & 3) * 4 + (x & 3)] / 16 < w * 0.5 ? 0.06 : 0));
    }
    // a arte da região
    const i = Math.round(u - R.cx) + H, j = Math.round(v - R.cy) + H;
    if (i >= 0 && j >= 0 && i < B && j < B) {
      const L = LV[ri];
      let lv = L[j * B + i];
      if (lv === -1) lv = ARV_BAYER[(y & 3) * 4 + (x & 3)] < 6 ? 1 : 0;
      if (lv > 0) {
        if (hash2(x, y, 3454) < 0.16) lv--;
        if (lv > 0) c = arvMix(c, R.col[lv], BL[lv]);
      } else if (i > 0 && j > 0 && L[(j - 1) * B + i - 1] > 0) c = arvMix(c, [0, 0, 0], 0.45);   // a sombra entalhada
    }
    const o = (y * W + x) * 4; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

/* ---- os medalhões: aro de pedra e metal, pedra granulada dentro e o ícone; guardados por tipo, região e estado ---- */
const ARV_RIM = { 1: ['#8a7ab8', '#5a4a88', '#2e2448'], 0: ['#3a3448', '#26203a', '#120e1c'] };
const ARV_ICCOL = { 1: { W: '#c8bce8', Y: '#9a8cc4', O: '#6e5a9c', R: '#4a3a70' }, 0: { W: '#5e5478', Y: '#4a4064', O: '#3a3050', R: '#2a2240' } };
const arvSprites = {};
function arvSprite(n, st) {
  const key = n.t + '|' + n.reg + '|' + n.ic + '|' + st; if (arvSprites[key]) return arvSprites[key];
  const t = n.t, R = ARV_R[t], oct = t === 'k' || t === 'o', pad = 3, c = R + pad, N = c * 2 + 1, cv = mk(N, N), g = cv.getContext('2d');
  const col = arvCol(n), rim = st === 2 ? [col.Y, col.O, col.R] : ARV_RIM[st], put = (x, y, h) => { g.fillStyle = h; g.fillRect(x, y, 1, 1); };
  const band = t === 's' ? 2.4 : 3.2, tint = arvRGB(col.R);
  for (let j = -c; j <= c; j++) for (let i = -c; i <= c; i++) {
    const d0 = Math.hypot(i, j), d = oct ? Math.max(d0, (Math.abs(i) + Math.abs(j)) / 1.3) : d0;
    if (d > R + 0.4) continue;
    let h;
    if (d > R - 1.1) h = '#05040a';
    else if (d > R - band || (t !== 's' && d > R - band - 2.2 && d <= R - band - 1.2)) { const s = i + j; h = rim[s < -R * 0.25 ? 0 : s < R * 0.35 ? 1 : 2]; if (hash2(i, j, 3455) < 0.1) h = rim[Math.min(2, rim.indexOf(h) + 1)]; }
    else {
      const v = (st === 2 ? 2.5 : st === 1 ? 1.9 : 1.3) - j * 0.05 + (hash2(i, j, 3456) - 0.5) * 0.8;
      h = arvStone(v);
      if (st === 2) h = arvHex(arvMix(arvRGB(h), tint, 0.4));
    }
    put(i + c, j + c, h);
  }
  // tachas no aro dos grandes
  if (t !== 's') { const k = t === 'n' ? 4 : 8; for (let q = 0; q < k; q++) { const a = Math.PI / 4 + q * Math.PI * 2 / k, r = R - 1.7; put(Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r), st === 2 ? col.W : st === 1 ? '#c8bce8' : '#4a4064'); } }
  // o ícone (em dobro nos grandes), com sombra de 1 pixel
  const M = ARV_ICON[n.ic], sc = t === 's' ? 1 : 2, C = st === 2 ? col : ARV_ICCOL[st], o = c - Math.floor(11 * sc / 2);
  if (M) for (const pass of [0, 1]) for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    const ch = M[y][x]; if (ch === '.') continue;
    g.fillStyle = pass ? C[ch] : 'rgba(0,0,0,.6)'; g.fillRect(o + x * sc + (pass ? 0 : 1), o + y * sc + (pass ? 0 : 1), sc, sc);
  }
  return (arvSprites[key] = { cv, c });
}
// o brilho de um nó ligado: anel pontilhado na cor da região
const arvHalos = {};
function arvHalo(n) {
  const key = n.t + '|' + n.reg; if (arvHalos[key]) return arvHalos[key];
  const col = arvCol(n), R = ARV_R[n.t] + 6, c = R + 1, N = c * 2 + 1, cv = mk(N, N), g = cv.getContext('2d');
  for (let j = -c; j <= c; j++) for (let i = -c; i <= c; i++) {
    const d = Math.hypot(i, j), k = 1 - Math.abs(d - (R - 3)) / 3.2;
    if (k > 0 && k * 16 > ARV_BAYER[((j + 64) & 3) * 4 + ((i + 64) & 3)] + 2) { g.fillStyle = k > 0.65 ? col.Y : col.O; g.fillRect(i + c, j + c, 1, 1); }
  }
  return (arvHalos[key] = { cv, c });
}
// linha pixel a pixel (quadrados de w)
function arvLine(g, x0, y0, x1, y1, w, col) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)) | 0 || 1, h = w >> 1;
  g.fillStyle = col;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + dx * i / n) - h, Math.round(y0 + dy * i / n) - h, w, w);
}
const arvState = n => arv.on.has(n.id) ? 2 : n.nb.some(m => arv.on.has(m)) ? 1 : 0;
const arvEdgeCol = (a, b) => a.reg >= 0 && (b.reg < 0 || b.reg === a.reg) ? arvCol(a) : arvCol(b);
// os sulcos e os medalhões (só quando algo muda)
function arvDrawTree() {
  const g = $('talTree').getContext('2d'), C = ARV_C;
  g.clearRect(0, 0, ARV_W, ARV_W);
  for (const [a, b] of ARV_EDGES) {
    const x0 = a.x + C, y0 = a.y + C, x1 = b.x + C, y1 = b.y + C, ia = arv.on.has(a.id), ib = arv.on.has(b.id);
    arvLine(g, x0, y0 + 1, x1, y1 + 1, 3, ARV_STONE[4]);
    arvLine(g, x0, y0, x1, y1, 3, ARV_STONE[0]);
    if (ia && ib) { const col = arvEdgeCol(a, b); arvLine(g, x0, y0, x1, y1, 3, col.R); arvLine(g, x0, y0, x1, y1, 1, col.Y); }
    else if (ia || ib) arvLine(g, x0, y0, x1, y1, 1, '#3a3058');
  }
  for (const n of ARV_LIST) { const s = arvSprite(n, n.id === 'o' ? 2 : arvState(n)); g.drawImage(s.cv, n.x + C - s.c, n.y + C - s.c); }
  const h = $('talGlow').getContext('2d'); h.clearRect(0, 0, ARV_W, ARV_W);
  for (const id of arv.on) { const n = ARV[id], s = arvHalo(n); h.drawImage(s.cv, n.x + C - s.c, n.y + C - s.c); }
}
// o caminho sob o mouse e o anel do nó apontado (só quando o mouse muda de nó)
function arvDrawHover() {
  const g = $('talHov').getContext('2d'), C = ARV_C;
  g.clearRect(0, 0, ARV_W, ARV_W);
  const n = tv.hover; if (!n) return;
  const path = tv.path, ok = path.length <= arvPoints(), col = ok ? '#e8d6a8' : '#8a4040', hi = ok ? '#fff6dc' : '#c86060';
  if (path.length) {
    const first = ARV[path[0]], from = first.nb.map(m => ARV[m]).find(m => arv.on.has(m.id)), pts = [from, ...path.map(id => ARV[id])];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; arvLine(g, a.x + C, a.y + C, b.x + C, b.y + C, 3, col); arvLine(g, a.x + C, a.y + C, b.x + C, b.y + C, 1, hi); }
    for (const id of path) { const q = ARV[id], s = arvSprite(q, 1); g.drawImage(s.cv, q.x + C - s.c, q.y + C - s.c); }
  }
  const r = ARV_R[n.t] + 3, steps = Math.max(24, Math.floor(r * 5));
  g.fillStyle = arv.on.has(n.id) ? '#fff6dc' : col;
  for (let i = 0; i < steps; i++) { if (i % 4 === 0) continue; const a = i / steps * Math.PI * 2; g.fillRect(Math.round(n.x + C + Math.cos(a) * r), Math.round(n.y + C + Math.sin(a) * r), 1, 1); }
}

/* ================= a tela ================= */
const talEl = document.createElement('div'); talEl.id = 'tal'; talEl.hidden = true;
talEl.innerHTML = `<div id="talView"><div id="talWorld">
    <canvas id="talBg" width="${ARV_W}" height="${ARV_W}"></canvas><canvas id="talGlow" width="${ARV_W}" height="${ARV_W}"></canvas>
    <canvas id="talTree" width="${ARV_W}" height="${ARV_W}"></canvas><canvas id="talHov" width="${ARV_W}" height="${ARV_W}"></canvas>
  </div></div>
  <div id="talFrame"></div>
  <header id="talTop"><h3>Talentos</h3><span id="talPts"></span><button class="ghost" id="talReset" type="button">Recomeçar</button><button class="ghost" id="talClose" type="button" aria-label="Fechar">×</button></header>
  <div id="talTip" class="tipbox" hidden></div>`;
document.body.appendChild(talEl);
const talView = $('talView'), talWorld = $('talWorld'), talTip = $('talTip');
const tv = { x: 0, y: 0, z: 2, zt: 2, ax: 0, ay: 0, wx: 0, wy: 0, anim: 0, hover: null, path: [], drag: null, painted: false, seen: false };
let arvDirty = true;

const talZMin = () => Math.min(innerWidth, innerHeight) / 1260;
const TAL_ZMAX = 6;
function talApply() {
  const L = 640;   // a câmera não sai da árvore
  const d = Math.hypot(tv.x, tv.y); if (d > L) { tv.x *= L / d; tv.y *= L / d; }
  talWorld.style.transform = `translate(${Math.round(innerWidth / 2 - (tv.x + ARV_C) * tv.z)}px,${Math.round(innerHeight / 2 - (tv.y + ARV_C) * tv.z)}px) scale(${tv.z})`;
}
const talToWorld = (cx, cy) => [(cx - innerWidth / 2) / tv.z + tv.x, (cy - innerHeight / 2) / tv.z + tv.y];
function talPick(cx, cy) {
  const [wx, wy] = talToWorld(cx, cy); let best = null, bd = 1e9;
  for (const n of ARV_LIST) { const d = Math.hypot(n.x - wx, n.y - wy); if (d < ARV_R[n.t] + 2 && d < bd) { bd = d; best = n; } }
  return best;
}
// caminho mais curto dos nós ligados até `id`, só por nós ainda não ligados
function arvPathTo(id) {
  if (arv.on.has(id)) return [];
  const prev = {}, q = []; for (const a of arv.on) { prev[a] = null; q.push(a); }
  for (let i = 0; i < q.length; i++) { const a = q[i]; if (a === id) break; for (const b of ARV[a].nb) if (!(b in prev)) { prev[b] = a; q.push(b); } }
  const out = []; for (let a = id; a && !arv.on.has(a); a = prev[a]) out.unshift(a);
  return out;
}
function arvCanRemove(id) {
  if (id === 'o' || !arv.on.has(id)) return false;
  const seen = new Set(['o']), q = ['o'];
  for (let i = 0; i < q.length; i++) for (const b of ARV[q[i]].nb) if (b !== id && arv.on.has(b) && !seen.has(b)) { seen.add(b); q.push(b); }
  return seen.size === arv.on.size - 1;
}
function talRefresh() {
  const p = Math.max(0, arvPoints());
  $('talPts').innerHTML = `<b>${p}</b> ${p === 1 ? 'ponto' : 'pontos'}`;
  talEl.classList.toggle('nopts', p <= 0);
  $('talReset').disabled = arv.on.size <= 1;
}
function talChanged() {
  arvRecount(); recalc(); if (typeof hudCache !== 'undefined') hudCache.hb = null;
  arvDrawTree(); talRefresh(); arvTesteTxt(); saveGame();
}
// faíscas quando um nó acende (elementos pequenos dentro da folha; só transform e opacidade)
function talBurst(n, k) {
  const col = arvCol(n);
  for (let i = 0; i < k; i++) {
    const a = Math.random() * Math.PI * 2, r = ARV_R[n.t] + 6 + Math.random() * 18, s = document.createElement('i');
    s.className = 'talSpark'; s.style.left = n.x + ARV_C + 'px'; s.style.top = n.y + ARV_C + 'px'; s.style.background = [col.W, col.Y, col.O][i % 3];
    talWorld.appendChild(s);
    const an = s.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r - 6}px)`, opacity: 0 }], { duration: 450 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)' });
    an.onfinish = () => s.remove();
  }
}
function talAllocate(id) {
  const path = arvPathTo(id);
  if (!path.length) return;
  if (path.length > arvPoints()) { tone(110, 0.12, 'square', 0.06, -30); return; }
  for (const p of path) { arv.on.add(p); talBurst(ARV[p], ARV[p].t === 's' ? 8 : 18); }
  const big = path.some(p => ARV[p].t !== 's'), key = path.some(p => ARV[p].t === 'k');
  [523, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.05, 0, i * 0.06)); noise(0.2, 0.06, 5000, 'highpass', 0.08);
  if (big) tone(392, 0.4, 'sine', 0.05, 0, 0.12);
  if (key) { tone(196, 0.7, 'triangle', 0.06, 0, 0.05); noise(0.5, 0.08, 700, 'bandpass', 0.05, 0.6); }
  talChanged(); talHover(true);
}
function talRefund(id) {
  if (!arvCanRemove(id)) { tone(110, 0.12, 'square', 0.06, -30); return; }
  arv.on.delete(id); tone(392, 0.12, 'triangle', 0.04, -120);
  talChanged(); talHover(true);
}
function talResetAll() {
  if (arv.on.size <= 1) return;
  arv.on = new Set(['o']); tone(330, 0.3, 'triangle', 0.05, -160); noise(0.25, 0.08, 600, 'lowpass');
  talChanged(); talHover(true);
}

/* dica */
const ARV_TIPCOL = { o: '#ffd27a', s: null, n: null, k: null };
function talShowTip(n, cx, cy) {
  if (!n) { talTip.hidden = true; talTip.dataset.k = ''; return; }
  const k = n.id + '|' + arv.on.has(n.id);
  if (talTip.dataset.k !== k) {
    talTip.dataset.k = k;
    const col = ARV_TIPCOL[n.t] || (n.t === 's' ? '#efe2c4' : arvCol(n).Y);
    talTip.className = 'tipbox' + (n.t === 'k' ? ' tk' : '');
    talTip.innerHTML = `<span class="tn" style="color:${col}">${n.name}</span><small>${ARV_KIND[n.t]}${n.reg >= 0 ? ' · ' + ARV_REG[n.reg].name : ''}</small>` +
      (n.fx.length ? `<ul>${n.fx.map(f => `<li class="${f[1] < 0 ? 'neg' : ''}">${arvFxLine(f)}</li>`).join('')}</ul>` : '');
  }
  talTip.hidden = false;
  const w = talTip.offsetWidth, h = talTip.offsetHeight; let x = cx + 22, y = cy + 18;
  if (x + w > innerWidth - 8) x = cx - w - 18; if (y + h > innerHeight - 8) y = innerHeight - 8 - h;
  talTip.style.left = Math.max(8, x) + 'px'; talTip.style.top = Math.max(8, y) + 'px';
}
let talMouse = { x: -1, y: -1 };
function talHover(force) {
  const n = tv.drag && tv.drag.moved ? null : talPick(talMouse.x, talMouse.y);
  if (n !== tv.hover || force) { tv.hover = n; tv.path = n ? arvPathTo(n.id) : []; arvDrawHover(); }
  talShowTip(n, talMouse.x, talMouse.y);
  talView.style.cursor = tv.drag && tv.drag.moved ? 'grabbing' : n ? 'pointer' : '';
}

talView.addEventListener('pointerdown', e => {
  initAudio();
  if (e.button === 0) { tv.drag = { sx: e.clientX, sy: e.clientY, x: tv.x, y: tv.y, moved: false }; talView.setPointerCapture(e.pointerId); }
  else if (e.button === 2) { const n = talPick(e.clientX, e.clientY); if (n) talRefund(n.id); }
  e.preventDefault();
});
talView.addEventListener('pointermove', e => {
  talMouse = { x: e.clientX, y: e.clientY };
  const d = tv.drag;
  if (d) {
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true;
    if (d.moved) { tv.x = d.x - dx / tv.z; tv.y = d.y - dy / tv.z; tv.zt = tv.z; talApply(); }
  }
  talHover();
});
talView.addEventListener('pointerup', e => {
  const d = tv.drag; tv.drag = null;
  if (e.button === 0 && d && !d.moved) { const n = talPick(e.clientX, e.clientY); if (n) talAllocate(n.id); }
  talHover();
});
talView.addEventListener('pointerleave', () => { if (!tv.drag) { tv.hover = null; tv.path = []; arvDrawHover(); talShowTip(null); } });
talEl.addEventListener('contextmenu', e => e.preventDefault());
talView.addEventListener('wheel', e => {
  e.preventDefault();
  const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
  tv.zt = clamp(tv.zt * Math.pow(1.0015, -clamp(d, -240, 240)), talZMin(), TAL_ZMAX);
  tv.ax = e.clientX; tv.ay = e.clientY; [tv.wx, tv.wy] = talToWorld(e.clientX, e.clientY);
  if (!tv.anim) tv.anim = requestAnimationFrame(talZoomStep);
}, { passive: false });
// o zoom anda suave até o alvo e para (só mexe no transform)
let talZLast = 0;
function talZoomStep(now) {
  const dt = Math.min(0.05, talZLast ? (now - talZLast) / 1000 : 0.016); talZLast = now;
  tv.z += (tv.zt - tv.z) * Math.min(1, dt * 16);
  if (Math.abs(tv.zt - tv.z) < 0.002) tv.z = tv.zt;
  tv.x = tv.wx - (tv.ax - innerWidth / 2) / tv.z; tv.y = tv.wy - (tv.ay - innerHeight / 2) / tv.z;
  talApply(); talHover();
  if (tv.z !== tv.zt && state === 'talents') tv.anim = requestAnimationFrame(talZoomStep); else { tv.anim = 0; talZLast = 0; }
}
$('talClose').addEventListener('click', () => closeTalents());
$('talReset').addEventListener('click', () => talResetAll());
addEventListener('resize', () => { if (state === 'talents') { tv.zt = tv.z = clamp(tv.z, talZMin(), TAL_ZMAX); talApply(); } });

function openTalents() {
  if (state !== 'play' || pl.dead) return;
  state = 'talents';
  for (const k in keys) keys[k] = false; mouse.l = mouse.r = false;
  if (!tv.painted) { tv.painted = true; arvPaintBg($('talBg')); }
  if (arvDirty) { arvDirty = false; arvDrawTree(); }
  if (!tv.seen) { tv.seen = true; tv.x = 0; tv.y = 0; tv.z = tv.zt = clamp(Math.min(innerWidth, innerHeight) / 560, talZMin(), TAL_ZMAX); }
  tv.drag = null; tv.hover = null; tv.path = []; arvDrawHover(); talApply(); talRefresh();
  talEl.hidden = false; document.body.classList.add('tal-open');
  noise(0.3, 0.08, 900, 'bandpass', 0, 0.7); tone(196, 0.3, 'triangle', 0.05, 60);
}
function closeTalents() {
  if (state !== 'talents') return;
  talEl.hidden = true; document.body.classList.remove('tal-open'); talShowTip(null);
  if (tv.anim) { cancelAnimationFrame(tv.anim); tv.anim = 0; tv.z = tv.zt; }
  state = 'play'; last = performance.now(); saveGame();
}
// P abre e fecha; Esc fecha. Pega a tecla antes do 08-estado-entrada
addEventListener('keydown', e => {
  if (state === 'talents' && (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Tab')) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat && e.code !== 'Tab') closeTalents(); return; }
  if (e.code === 'KeyP' && !e.repeat && state === 'play' && !(typeof held !== 'undefined' && held)) { e.preventDefault(); e.stopImmediatePropagation(); openTalents(); }
}, true);

/* ---- Menu > Testes, aba Outros: pontos de talento para testar (fica junto das runas, 339-testes) ---- */
function arvTesteTxt() { const s = document.getElementById('tArvPts'); if (s) s.textContent = `${Math.max(0, arvPoints())} livres`; }
(function () {
  const box = document.querySelector('#testes .tmundo'); if (!box) return;
  const c = document.createElement('div'); c.className = 'tcell';
  c.innerHTML = `<em>Talentos</em><strong id="tArvPts"></strong><button type="button" class="ghost" id="tArvMais">+10 pontos</button>`;
  box.appendChild(c);
  $('tArvMais').addEventListener('click', () => { arv.extra = (arv.extra | 0) + 10; arvDirty = true; arvTesteTxt(); saveGame(); });
  arvTesteTxt();
})();
arvRecount();
