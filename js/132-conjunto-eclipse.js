'use strict';

/* ================= o Conjunto do Eclipse: elmo, peitoral e botas lendários (a espada é o js/130) =================
   Peças únicas (ITEMS[id].legend) no estilo do Montante do Eclipse: obsidiana, ouro e a coroa de luz de um eclipse.
   Todo herói novo encontra as três no baú da vila (27-bau), junto com a espada.
   - Elmo do Eclipse: fechado, um sol eclipsado no alto e a fresta dos olhos acesa. No escuro, mais crítico.
   - Peitoral do Eclipse: placas de obsidiana com o eclipse no peito, estrelas e barra dourada. No escuro, menos dano.
   - Botas do Eclipse: faixa dourada no tornozelo com uma estrela acesa. No escuro, mais velocidade.
   - Conjunto (as 4 peças contam, a espada também): com 2, mais dano no escuro; com 4, eclipse a cada 3 golpes,
     que cura e atordoa (ECL_SET_B).
   "No escuro" é o mesmo da Penumbra: a luz no herói abaixo de ECL.dark (eclInDark do 130).
   As partes acesas de cada desenho ficam em ECL_EMIT (desenho -> camada acesa); o 131 as desenha por cima do escuro.
   Embrulha newWorld, heroHeadFor, heroBodyFor, heroLegsFor, makeIcon, recalc, hitEnemy, eclBurst, hurtPlayer, updatePlayer e
   gearTipBody. Carrega logo depois do 130 (a wiki também). */

const ECL_SET = [ECL_ID, 'elmo_eclipse', 'peitoral_eclipse', 'botas_eclipse'];
const ECL_SET_B = { dark2: 0.1, every4: 3, heal4: 0.05, stun4: 1 };
const ECL_SET_TXT = [
  [2, `No escuro, +${ECL_SET_B.dark2 * 100}% de dano`],
  [4, `Os eclipses vêm a cada ${ECL_SET_B.every4} golpes, curam ${ECL_SET_B.heal4 * 100}% da sua vida máxima e atordoam os inimigos atingidos por ${ECL_SET_B.stun4} s`]
];
// picture -> its lit layer, and picture -> small glows [u, v, colour] on it; the 131 draws both over the dark for any
// piece with ITEMS[id].lit (this set and the 133 too)
const ECL_EMIT = new WeakMap(), GEAR_SPOT = new WeakMap();

// letras: o obsidiana · O sombra · q luz · g ouro · G ouro escuro · c C coroa (acesa) · D d disco · v fresta (acesa) · S estrela (acesa)
const ECL_PAL = { o: '#3a2c52', O: '#1c1228', q: '#54426e', g: '#e0b048', G: '#8a6220', c: '#ffd27a', C: '#fff0c0', D: '#040208', d: '#2a2238', v: '#fff0c0', S: '#b8a8ff', b: '#8a6220', B: '#ffd27a' };
const ECL_LIT = new Set(['c', 'C', 'v', 'S']);
// 12 de largura, como os elmos do 05; oy -3: as três primeiras linhas ficam acima da cabeça
const ECL_HELM = [
  ".....ccc....",
  "....cDDDc...",
  "....cDdDc...",
  "...qqcccqo..",
  "..qoooooooo.",
  ".qoooooooooo",
  ".Oggggggggg.",
  ".OoooooovvO.",
  ".Oooooooooo.",
  "..Ooo.ooOo..",
  "..OO...OO..."
];
const ECL_BODY_ICON = [
  ".gq....qg.",
  "gqoo..ooOg",
  "qoooccoooO",
  "ooocDDcooO",
  "ooooccoooO",
  ".oooooooO.",
  ".bbbBbbbb.",
  ".ooooooOO.",
  "gggggggggg"
];
const ECL_BOOTS_ICON = [
  ".gC....gC..",
  ".oO....oO..",
  ".oO....oO..",
  ".oOo...oOo.",
  ".oOoo..oOoo",
  "ggggg..gggg"
];
// flat colours from ECL_PAL (the shading is in the letters); the lit letters go to a second canvas too
function eclFlat(rows) {
  const H = rows.length, W = rows[0].length, img = mk(W, H), em = mk(W, H), x = img.getContext('2d'), ex = em.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ch = rows[j][i], col = ECL_PAL[ch]; if (!col) continue;
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
    if (ECL_LIT.has(ch)) { ex.fillStyle = col; ex.fillRect(i, j, 1, 1); }
  }
  return { img, em };
}

/* ---- the pieces ---- */
STAT_DEF.lgVisao = { t: 'No escuro, +X% de chance de crítico', pct: 1 };
STAT_DEF.lgSombra = { t: 'No escuro, você recebe X% menos dano', pct: 1 };
STAT_DEF.lgPasso = { t: 'No escuro, +X% de velocidade de movimento', pct: 1 };
STAT_KEYS.push('lgVisao', 'lgSombra', 'lgPasso');
Object.assign(ITEMS, {
  elmo_eclipse: {
    name: 'Elmo do Eclipse', slot: 'head', rar: 4, def: 9, hp: 20, g: 0, start: true, lit: true, art: ECL_HELM, oy: -3, pal: ECL_PAL,
    legend: [['lgVisao', 0.12], ['critDmg', 0.25]],
    desc: 'Fechado como uma noite sem lua. Pela fresta, quem o veste enxerga onde a tocha não chega.'
  },
  peitoral_eclipse: {
    name: 'Peitoral do Eclipse', slot: 'body', rar: 4, def: 13, hp: 30, g: 0, start: true, lit: true,
    pal: { r: '#2e2244', R: '#1c1430', D: '#120a1a', b: '#8a6220', B: '#ffd27a' },
    legend: [['lgSombra', 0.25]],
    desc: 'O sol apagado no peito ainda queima por dentro. A escuridão que chega perto dele se desvia.'
  },
  botas_eclipse: {
    name: 'Botas do Eclipse', slot: 'feet', rar: 4, def: 6, spd: 0.08, g: 3, start: true, lit: true,
    pal: { s: '#3a2c52', S: '#1c1228' },
    legend: [['lgPasso', 0.15], ['dodge', 0.05]],
    desc: 'Não fazem barulho nenhum na pedra. No escuro, parecem andar sozinhas.'
  }
});
for (const id of ECL_SET.slice(1)) { BASE_INFO[id] = [14]; ITEM_G[id] = ITEMS[id].g; }
// every new hero finds the sword and the three pieces in the village chest (js/27-bau.js; the wiki has no chest); same test as 23-save for a new hero
{ const _nw = newWorld; newWorld = function (sd, sv) {
  const r = _nw(sd, sv);
  if (typeof stash !== 'undefined' && !(sv && Array.isArray(sv.inv))) for (const id of ECL_SET) { const i = stash.indexOf(null); if (i >= 0) stash[i] = mkItem(id, 0); }
  return r;
}; }

/* ---- the art on the hero ---- */
{
  const _heroHeadFor = heroHeadFor, _heroBodyFor = heroBodyFor, _heroLegsFor = heroLegsFor, _makeIcon = makeIcon;
  heroHeadFor = function (id) {
    if (id !== 'elmo_eclipse') return _heroHeadFor(id);
    return cached('hh:' + id, () => { const a = eclFlat(ECL_HELM); ECL_EMIT.set(a.img, a.em); GEAR_SPOT.set(a.img, [[6, 1.5, '#ffc860']]); return { img: a.img, oy: ITEMS[id].oy }; });
  };
  // the plate body of 37, then the eclipse on the chest (left of the near arm, which hangs from column 7), gold on the shoulders and the hem, two stars
  const BODY_PX = [
    [3, 10, 'c'], [4, 10, 'C'], [2, 11, 'c'], [3, 11, 'D'], [4, 11, 'D'], [5, 11, 'c'], [3, 12, 'C'], [4, 12, 'c'],
    [1, 10, 'g'], [9, 10, 'G'], [2, 15, 'S'], [5, 16, 'S'],
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => [i, 17, i < 3 ? 'g' : i > 8 ? 'G' : 'g'])
  ];
  heroBodyFor = function (id) {
    const b = _heroBodyFor(id);
    if (id !== 'peitoral_eclipse' || ECL_EMIT.has(b.img)) return b;
    const x = b.img.getContext('2d'), em = mk(b.img.width, b.img.height), ex = em.getContext('2d');
    for (const [i, j, ch] of BODY_PX) { x.fillStyle = ECL_PAL[ch]; x.fillRect(i, j, 1, 1); if (ECL_LIT.has(ch)) { ex.fillStyle = ECL_PAL[ch]; ex.fillRect(i, j, 1, 1); } }
    ECL_EMIT.set(b.img, em); GEAR_SPOT.set(b.img, [[3.5, 11, '#ffc860']]);
    return b;
  };
  // every leg frame (the crouch ones of 89 too): the top of each boot turns gold, its front end a lit star
  heroLegsFor = function (id) {
    const o = _heroLegsFor(id);
    if (id !== 'botas_eclipse') return o;
    // the ramp comes as 'rgb(r,g,b)' or '#rrggbb'; compared as 'r,g,b'
    const rgb = s => s[0] === '#' ? [1, 3, 5].map(k => parseInt(s.slice(k, k + 2), 16)).join(',') : s.replace(/[^\d,]/g, '');
    const boot = new Set(heroRamp(ITEMS[id].pal.s).map(rgb));
    for (const k in o) {
      const c = o[k]; if (ECL_EMIT.has(c)) continue;
      const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, top = [];
      for (let i = 0; i < c.width; i++) for (let j = 0; j < c.height; j++) { const p = (j * c.width + i) * 4; if (d[p + 3] && boot.has(d[p] + ',' + d[p + 1] + ',' + d[p + 2])) { top.push([i, j]); break; } }
      const em = mk(c.width, c.height), ex = em.getContext('2d');
      top.forEach(([i, j], n) => {
        const next = top[n + 1], end = !next || next[0] !== i + 1;   // the front end of this boot's band
        x.fillStyle = end ? ECL_PAL.C : ECL_PAL.g; x.fillRect(i, j, 1, 1);
        if (end) { ex.fillStyle = ECL_PAL.C; ex.fillRect(i, j, 1, 1); }
      });
      ECL_EMIT.set(c, em);
    }
    return o;
  };
  makeIcon = function (id) {
    const rows = id === 'peitoral_eclipse' ? ECL_BODY_ICON : id === 'botas_eclipse' ? ECL_BOOTS_ICON : null;
    if (!rows) return _makeIcon(id);
    const img = eclFlat(rows).img, c = mk(13, 13), x = c.getContext('2d');
    x.drawImage(img, Math.floor((13 - img.width) / 2), Math.floor((13 - img.height) / 2));
    const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}

/* ---- the effects ---- */
const eclSetHas = id => EQ_SLOTS.some(k => equip[k] && equip[k].id === id);
const eclSetCount = () => ECL_SET.filter(eclSetHas).length;
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let v = 0, s = 0, p = 0;
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); v += st.lgVisao || 0; s += st.lgSombra || 0; p += st.lgPasso || 0; }
  if (pl.lg) { const n = eclSetCount(); Object.assign(pl.lg, { visao: v, sombra: Math.min(0.8, s), passo: p, eclSet: n, eclEvery: n >= 4 ? ECL_SET_B.every4 : 0 }); }
  return r;
}; }
// in the dark: the helmet's crit and the 2-piece damage, for this blow only
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const L = pl.lg;
  if (!e || e.dead || !melee || !L || !(L.visao || L.eclSet >= 2) || !eclInDark()) return _hit(e, dir, mult, melee);
  if (L.eclSet >= 2) mult *= 1 + ECL_SET_B.dark2;
  const c0 = pl.crit; pl.crit += L.visao || 0;
  try { return _hit(e, dir, mult, melee); } finally { pl.crit = c0; }
}; }
// the full set: every eclipse heals and stuns what it reaches (bosses keep moving)
{ const _eb = eclBurst; eclBurst = function (e) {
  if (!pl.lg || pl.lg.eclSet < 4) return _eb(e);
  const x = e.x + e.w / 2, y = e.y + e.h / 2, near = enemies.filter(o => eclNear(o, x, y));
  _eb(e);
  const h = Math.max(1, Math.round(pl.maxHp * ECL_SET_B.heal4)); pl.hp = Math.min(pl.maxHp, pl.hp + h);
  floatText(pl.x + pl.w / 2, pl.y - 6, '+' + h, '#7dff8a', 0.85);
  for (const o of near) if (!o.dead && !o.boss) o.stun = Math.max(o.stun || 0, ECL_SET_B.stun4);
}; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  if (pl.lg && pl.lg.sombra && eclInDark()) dmg = Math.max(1, Math.round(dmg * (1 - pl.lg.sombra)));
  return _hp(dmg, srcX, src, isProj);
}; }
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!pl.lg || !pl.lg.passo || !eclInDark()) return _up(dt);
  const s = pl.spd; pl.spd = s + pl.lg.passo; try { return _up(dt); } finally { pl.spd = s; }
}; }

/* ---- the set in the tooltip: the pieces you wear in gold, the bonuses you have in green ---- */
{ const _gt = gearTipBody; gearTipBody = function (s, cmp) {
  const h = _gt(s, cmp); if (!s || !ECL_SET.includes(s.id)) return h;
  const n = eclSetCount(), off = '#6e655c';
  const names = ECL_SET.map(id => `<span style="color:${eclSetHas(id) ? '#ffd27a' : off}">${ITEMS[id].name}</span>`).join('');
  const bon = ECL_SET_TXT.map(([k, t]) => `<span style="color:${n >= k ? '#7fd36a' : off}">(${k}) ${t}</span>`).join('');
  return h + `<div class="base eclset"><span style="color:#ff9a3c">Conjunto do Eclipse (${n}/${ECL_SET.length})</span>${names}${bon}</div>`;
}; }
