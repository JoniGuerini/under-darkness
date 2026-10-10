'use strict';

/* ================= o Conjunto da Hora Parada: lança, elmo, couraça e botas lendários =================
   Latão, azul-noite e cristal ciano: um relojoeiro que aprendeu a parar o tempo. Peças únicas (ITEMS[id].legend)
   que todo herói novo encontra no baú da vila, junto com o Conjunto do Eclipse.
   - Ponteiro da Hora Parada (lança): a ponta é um ponteiro de relógio, com um cristal no anel. A cada HOR.every
     golpes o tempo para em volta do alvo (os inimigos ficam parados, em sépia, como numa foto antiga); cada golpe
     ecoa um instante depois com parte do dano.
   - Elmo: engrenagem no alto e um monóculo de cristal. Inimigos parados levam mais dano.
   - Couraça: um relógio no peito com o ponteiro andando (para quando o tempo para, gira para trás no Rebobinar) e
     um pêndulo. Uma vez a cada HOR.cd s, o golpe que te mataria te leva HOR.back s para trás no tempo.
   - Botas: quando o tempo para, você fica mais rápido por HOR.haste s.
   - Conjunto (as 4 peças, a lança também): com 2, +10% de velocidade de ataque; com 4, o tempo para a cada 4 golpes
     e, quando volta a correr, cada inimigo sente de uma vez 30% de todo o dano que levou parado.
   Aqui ficam os dados, os desenhos e os efeitos (a wiki carrega este arquivo); o que se desenha por cima do mundo
   (anéis de relógio, sépia, ecos, o rastro do Rebobinar) fica no js/134-hora-brilho.js. As partes acesas vão para
   ECL_EMIT e GEAR_SPOT do 132, e o 131 as desenha por cima do escuro.
   Embrulha newWorld, weaponFor, makeIcon, buildLook, heroHeadFor, heroBodyFor, heroLegsFor, recalc, hitEnemy,
   rawDamage, updatePlayer e gearTipBody. Carrega logo depois do 132 (a wiki também). */

const HOR_ID = 'ponteiro_hora';
const HOR_SET = [HOR_ID, 'elmo_hora', 'couraca_hora', 'botas_hora'];
const HOR = { every: 6, r: 44, echoT: 0.35, cd: 60, back: 3, haste: 3, minHp: 0.25 };
const HOR_SET_B = { atk2: 0.1, every4: 4, release4: 0.3 };
const HOR_SET_TXT = [
  [2, `+${HOR_SET_B.atk2 * 100}% de velocidade de ataque`],
  [4, `O tempo para a cada ${HOR_SET_B.every4} golpes e, quando volta a correr, cada inimigo sente de uma vez ${HOR_SET_B.release4 * 100}% de todo o dano que levou parado`]
];

// letras: a latão claro · A latão · k latão escuro · K sombra · c C cristal (aceso) · w mostrador · n N azul-noite · h H haste
const HOR_PAL = {
  a: '#f0d080', A: '#c89a3a', k: '#7a5418', K: '#0c1220', c: '#5ad8ff', C: '#d8f8ff', w: '#e8dcc0',
  n: '#2c3a58', N: '#18223a', h: '#5a6e96', H: '#8ea2cc', b: '#7a5418', B: '#f0d080'
};
const HOR_LIT = new Set(['c', 'C']);
const HOR_GLOW = '#5ad8ff';

// a lança na grade de 18 linhas do 05 (a mão corre da linha 8 à 17 na estocada); 5 de largura, a haste na coluna 2
const HOR_ROWS = [
  "..C..",
  "..a..",
  "..A..",
  ".aAk.",
  "aAcAk",
  "aAcAk",
  ".aAk.",
  "..A..",
  "..H..",
  "..h..",
  "..H..",
  "..h..",
  ".kak.",
  "..h..",
  "..H..",
  "..h..",
  ".aAk.",
  "aAcAk"
];
// 12 de largura, como os elmos do 05; oy -3: as três primeiras linhas (a engrenagem) ficam acima da cabeça
const HOR_HELM = [
  "....k.k.k...",
  "....kaAAk...",
  "...kaAcAAk..",
  "..kaaAAAAAk.",
  ".kaAAAAAAAAk",
  ".kAAAAAAAAAk",
  ".kkkkkkkaaak",
  ".kAAAAAacCak",
  ".kAAAAAacckK",
  "..kAA.AAaaK.",
  "..KK...KK..."
];
const HOR_BODY_ICON = [
  ".aA....Aa.",
  "aAnn..nnNa",
  "nnnaaaannN",
  "nnawCwknnN",
  "nnawkwknnN",
  "nnnkkkknnN",
  ".nnnKcKnN.",
  ".bbbbBbbb.",
  "aaaaaaaaaa"
];
const HOR_BOOTS_ICON = [
  ".aC....aC..",
  ".nN....nN..",
  ".nN....nN..",
  ".nNn...nNn.",
  ".nNnn..nNnn",
  "kkkkk..kkkk"
];
function horFlat(rows) {
  const H = rows.length, W = rows[0].length, img = mk(W, H), em = mk(W, H), x = img.getContext('2d'), ex = em.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ch = rows[j][i], col = HOR_PAL[ch]; if (!col) continue;
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
    if (HOR_LIT.has(ch)) { ex.fillStyle = col; ex.fillRect(i, j, 1, 1); }
  }
  return { img, em };
}

/* ---- the spear in the hand: its crystals fill up with the blows towards the next time stop ---- */
const horLive = { cv: null, x: null, em: null, ex: null, k: -1 };
function horPaintSpear(x, ex, charge, glint) {
  const H = HOR_ROWS.length, W = 5;
  x.clearRect(0, 0, W, H); if (ex) ex.clearRect(0, 0, W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let ch = HOR_ROWS[j][i]; if (ch === '.') continue;
    if (ch === 'c') ch = charge >= 1 || (j < 8 ? charge > 0.5 : charge > 0) ? 'C' : 'c';   // full charge: every crystal white
    if (j === 0) ch = glint ? 'C' : 'c';
    const col = HOR_PAL[ch]; x.fillStyle = col; x.fillRect(i, j, 1, 1);
    if (ex && HOR_LIT.has(ch)) { ex.fillStyle = col; ex.fillRect(i, j, 1, 1); }
  }
}
function horCanvas() {
  if (!horLive.cv) {
    horLive.cv = mk(5, HOR_ROWS.length); horLive.x = horLive.cv.getContext('2d');
    horLive.em = mk(5, HOR_ROWS.length); horLive.ex = horLive.em.getContext('2d');
    horPaintSpear(horLive.x, horLive.ex, 0, false);
    ECL_EMIT.set(horLive.cv, horLive.em); GEAR_SPOT.set(horLive.cv, [[2.5, 5, HOR_GLOW]]);
  }
  return horLive.cv;
}
function horTickSpear(charge, glint) {
  horCanvas(); const k = Math.round(charge * 10) * 2 + (glint ? 1 : 0);
  if (horLive.k !== k) { horLive.k = k; horPaintSpear(horLive.x, horLive.ex, charge, glint); }
}

/* ---- the pieces ---- */
STAT_DEF.lgParada = { t: `A cada ${HOR.every} golpes, o tempo para em volta do alvo: os inimigos ficam parados por X s` };
STAT_DEF.lgEco = { t: 'Cada golpe ecoa um instante depois: +X% do dano no mesmo alvo', pct: 1 };
STAT_DEF.lgParados = { t: 'Inimigos parados no tempo levam +X% de dano', pct: 1 };
STAT_DEF.lgRebobinar = { t: `Uma vez a cada ${HOR.cd} s, o golpe que te mataria te leva X s para trás no tempo` };
STAT_DEF.lgPressa = { t: `Quando o tempo para, você fica X% mais rápido por ${HOR.haste} s`, pct: 1 };
STAT_KEYS.push('lgParada', 'lgEco', 'lgParados', 'lgRebobinar', 'lgPressa');
Object.assign(ITEMS, {
  ponteiro_hora: {
    name: 'Ponteiro da Hora Parada', slot: 'weapon', kind: 'spear', rar: 4, g: 0, start: true, lit: true,
    pal: { w: '#d8f8ff', W: '#c89a3a', l: '#7a5418', g: '#f0d080', G: '#7a5418', h: '#34425e', p: '#5ad8ff' },
    legend: [['lgParada', 2], ['lgEco', 0.35], ['atkSpd', 0.1]],
    desc: 'Arrancado do relógio da torre na hora em que ele parou. Onde a ponta encosta, os segundos esquecem de passar.'
  },
  elmo_hora: {
    name: 'Elmo da Hora Parada', slot: 'head', rar: 4, def: 9, hp: 20, g: 0, start: true, lit: true, art: HOR_HELM, oy: -3, pal: HOR_PAL,
    legend: [['lgParados', 0.3], ['crit', 0.05]],
    desc: 'A engrenagem no alto gira sozinha. Pelo monóculo, tudo parece um pouco mais devagar.'
  },
  couraca_hora: {
    name: 'Couraça da Hora Parada', slot: 'body', rar: 4, def: 13, hp: 30, g: 1, start: true, lit: true,
    pal: { r: '#2c3a58', R: '#18223a', D: '#0c1220', b: '#7a5418', B: '#f0d080' },
    legend: [['lgRebobinar', HOR.back]],
    desc: 'O relógio no peito anda no ritmo de quem a veste. Quando esse ritmo para, ele volta alguns segundos.'
  },
  botas_hora: {
    name: 'Botas da Hora Parada', slot: 'feet', rar: 4, def: 6, spd: 0.08, g: 3, start: true, lit: true,
    pal: { s: '#2c3a58', S: '#18223a' },
    legend: [['lgPressa', 0.3], ['dodge', 0.04]],
    desc: 'O latão do tornozelo tem asas pequenas. Enquanto o mundo espera, elas correm.'
  }
});
BASE_INFO[HOR_ID] = [14, 1.0];
for (const id of HOR_SET) { if (!BASE_INFO[id]) BASE_INFO[id] = [14]; ITEM_G[id] = ITEMS[id].g; }
// every new hero finds this set in the village chest too, after the Eclipse (same test as 23-save for a new hero)
{ const _nw = newWorld; newWorld = function (sd, sv) {
  const r = _nw(sd, sv);
  if (typeof stash !== 'undefined' && !(sv && Array.isArray(sv.inv))) for (const id of HOR_SET) { const i = stash.indexOf(null); if (i >= 0) stash[i] = mkItem(id, 0); }
  return r;
}; }

/* ---- the art ---- */
let horBodyArt = null;   // { img, em }: the chest's clock is repainted as time passes (horTickBody)
const horClock = { t: 0, step: -1 };
const HOR_HAND = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];   // round the pin at (3, 12), one step a second
{
  const _weaponFor = weaponFor, _makeIcon = makeIcon, _buildLook = buildLook;
  const _heroHeadFor = heroHeadFor, _heroBodyFor = heroBodyFor, _heroLegsFor = heroLegsFor;
  weaponFor = function (id) { return id === HOR_ID ? horCanvas() : _weaponFor(id); };
  // 5 wide, not the 3 of the spear in 05: the hand holds the middle column
  buildLook = function () { const r = _buildLook.apply(this, arguments); if (look && eqId('weapon') === HOR_ID) look.wpx = 2.5; return r; };
  heroHeadFor = function (id) {
    if (id !== 'elmo_hora') return _heroHeadFor(id);
    return cached('hh:' + id, () => { const a = horFlat(HOR_HELM); ECL_EMIT.set(a.img, a.em); GEAR_SPOT.set(a.img, [[6, 2.5, HOR_GLOW], [9, 7.5, HOR_GLOW]]); return { img: a.img, oy: ITEMS[id].oy }; });
  };
  // the plate body of 37, then a clock on the chest (left of the near arm), the pendulum's glass case under it, brass on the hem
  const FACE = [
    [2, 10, 'a'], [3, 10, 'a'], [4, 10, 'a'],
    [1, 11, 'a'], [2, 11, 'w'], [3, 11, 'w'], [4, 11, 'w'], [5, 11, 'k'],
    [1, 12, 'a'], [2, 12, 'w'], [3, 12, 'k'], [4, 12, 'w'], [5, 12, 'k'],
    [1, 13, 'a'], [2, 13, 'w'], [3, 13, 'w'], [4, 13, 'w'], [5, 13, 'k'],
    [2, 14, 'k'], [3, 14, 'k'], [4, 14, 'k'],
    [2, 15, 'K'], [3, 15, 'A'], [4, 15, 'K'],
    [9, 10, 'a'],
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => [i, 17, i > 8 ? 'k' : 'a'])
  ];
  heroBodyFor = function (id) {
    const b = _heroBodyFor(id);
    if (id !== 'couraca_hora' || ECL_EMIT.has(b.img)) return b;
    const x = b.img.getContext('2d'), em = mk(b.img.width, b.img.height);
    for (const [i, j, ch] of FACE) { x.fillStyle = HOR_PAL[ch]; x.fillRect(i, j, 1, 1); }
    ECL_EMIT.set(b.img, em); GEAR_SPOT.set(b.img, [[3.5, 12.5, HOR_GLOW]]);
    horBodyArt = { img: b.img, em }; horClock.step = -1; horTickBody();
    return b;
  };
  // every leg frame (the crouch ones of 89 too): a brass band on top of each boot, its front end a lit crystal,
  // and a little brass wing sticking up at the back
  heroLegsFor = function (id) {
    const o = _heroLegsFor(id);
    if (id !== 'botas_hora') return o;
    const rgb = s => s[0] === '#' ? [1, 3, 5].map(k => parseInt(s.slice(k, k + 2), 16)).join(',') : s.replace(/[^\d,]/g, '');
    const boot = new Set(heroRamp(ITEMS[id].pal.s).map(rgb));
    for (const k in o) {
      const c = o[k]; if (ECL_EMIT.has(c)) continue;
      const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, top = [];
      for (let i = 0; i < c.width; i++) for (let j = 0; j < c.height; j++) { const p = (j * c.width + i) * 4; if (d[p + 3] && boot.has(d[p] + ',' + d[p + 1] + ',' + d[p + 2])) { top.push([i, j]); break; } }
      const em = mk(c.width, c.height), ex = em.getContext('2d');
      top.forEach(([i, j], n) => {
        const prev = top[n - 1], next = top[n + 1], end = !next || next[0] !== i + 1, start = !prev || prev[0] !== i - 1;
        x.fillStyle = end ? HOR_PAL.c : HOR_PAL.a; x.fillRect(i, j, 1, 1);
        if (end) { ex.fillStyle = HOR_PAL.c; ex.fillRect(i, j, 1, 1); }
        if (start && !end && j > 0) { x.fillStyle = HOR_PAL.A; x.fillRect(i, j - 1, 1, 1); }
      });
      ECL_EMIT.set(c, em);
    }
    return o;
  };
  makeIcon = function (id) {
    if (!HOR_SET.includes(id) || id === 'elmo_hora') return _makeIcon(id);
    const c = mk(13, 13), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    if (id === HOR_ID) {
      const img = mk(5, HOR_ROWS.length); horPaintSpear(img.getContext('2d'), null, 1, true);
      x.save(); x.translate(6.5, 6.5); x.rotate(Math.PI / 4); x.drawImage(img, -img.width / 2, -img.height / 2); x.restore();
    } else { const img = horFlat(id === 'couraca_hora' ? HOR_BODY_ICON : HOR_BOOTS_ICON).img; x.drawImage(img, Math.floor((13 - img.width) / 2), Math.floor((13 - img.height) / 2)); }
    const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
// the chest's clock: the hand steps once a second (horClock.t runs slower, stops or turns back: see the update below);
// the pendulum bob swings in its glass case
function horTickBody() {
  const A = horBodyArt; if (!A) return;
  const t = horClock.t, step = ((Math.floor(t) % 8) + 8) % 8, sw = Math.round(Math.sin(t * Math.PI));
  const key = step * 3 + sw + 1; if (horClock.step === key) return; horClock.step = key;
  const x = A.img.getContext('2d'), ex = A.em.getContext('2d'); ex.clearRect(0, 0, A.em.width, A.em.height);
  for (const [dx, dy] of HOR_HAND) { x.fillStyle = HOR_PAL.w; x.fillRect(3 + dx, 12 + dy, 1, 1); }
  const [hx, hy] = HOR_HAND[step];
  x.fillStyle = ex.fillStyle = HOR_PAL.C; x.fillRect(3 + hx, 12 + hy, 1, 1); ex.fillRect(3 + hx, 12 + hy, 1, 1);
  for (let i = 2; i <= 4; i++) { x.fillStyle = HOR_PAL.K; x.fillRect(i, 16, 1, 1); }
  x.fillStyle = ex.fillStyle = HOR_PAL.c; x.fillRect(3 + sw, 16, 1, 1); ex.fillRect(3 + sw, 16, 1, 1);
}

/* ---- the effects ---- */
const horSetHas = id => EQ_SLOTS.some(k => equip[k] && equip[k].id === id);
const horSetCount = () => HOR_SET.filter(horSetHas).length;
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments), s = {};
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); for (const q of ['lgParada', 'lgEco', 'lgParados', 'lgRebobinar', 'lgPressa']) s[q] = (s[q] || 0) + (st[q] || 0); }
  if (pl.lg) {
    const n = horSetCount();
    Object.assign(pl.lg, { horParada: s.lgParada, horEco: s.lgEco, horParados: s.lgParados, horRebob: s.lgRebobinar, horPressa: s.lgPressa, horSet: n,
      horEvery: n >= 4 ? HOR_SET_B.every4 : HOR.every, horRelease: n >= 4 ? HOR_SET_B.release4 : 0 });
    if (n >= 2 && pl.atkPeriod) { const k = 1 + HOR_SET_B.atk2; pl.atkPeriod /= k; pl.aps = 1 / pl.atkPeriod; pl.atkSpd = clamp(0.31 / (pl.atkPeriod * 0.85), 0.55, 1.4); if (pl.dps) pl.dps *= k; }
  }
  return r;
}; }

const horFx = [];      // { kind: 'stop' | 'echo' | 'release' | 'rewind', x, y, t, max, path? }
const horEchoQ = [];   // blows waiting to ring again: { e, t, d }
const horHist = [];    // where the hero was, for the rewind: { t, x, y, hp }
let horReady = 0, horReadyNews = false, horRewT = 0, horHistT = 0, horFlash = 0;
const horStopped = e => e.horT > 0;
const horFxAdd = (kind, x, y, max, extra) => horFx.push(Object.assign({ kind, x, y, t: 0, max }, extra));
function horNear(o, x, y) {
  const dx = Math.max(0, Math.abs(o.x + o.w / 2 - x) - o.w / 2), dy = Math.max(0, Math.abs(o.y + o.h / 2 - y) - o.h / 2);
  return !o.dead && dx * dx + dy * dy <= HOR.r * HOR.r;
}
const horSfx = {
  stop() { tone(1760, 0.05, 'square', 0.04); tone(880, 0.5, 'sine', 0.09, -640, 0.03); noise(0.4, 0.06, 2400, 'bandpass', 0.02, 0.7); },
  tick() { tone(2400, 0.02, 'square', 0.03); },
  rewind() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.08, 'triangle', 0.06, -200, i * 0.05)); noise(0.35, 0.08, 1800, 'bandpass', 0, 0.8); },
  release() { tone(220, 0.25, 'square', 0.08, 220); noise(0.2, 0.15, 900, 'lowpass'); }
};
// the time stops round (x, y): every foe it reaches (bosses keep moving) is pinned where it stands
function horStopAt(e) {
  const L = pl.lg, x = e.x + e.w / 2, y = e.y + e.h / 2, dur = L.horParada;
  horFxAdd('stop', x, y, 0.55); horFlash = 0.45;
  floatText(x, e.y - 14, 'TEMPO PARADO', '#d8f8ff', 1);
  horSfx.stop(); shake(1.5); hitstop = Math.max(hitstop, 0.12);
  for (const o of enemies) {
    if (!horNear(o, x, y) || o.boss) continue;
    if (!horStopped(o)) { o.horX = o.x; o.horY = o.y; o.horAt = o.t; o.horDmg = 0; }
    o.horT = Math.max(o.horT || 0, dur); o.horMax = Math.max(o.horT, o.horMax || 0); o.stun = Math.max(o.stun || 0, o.horT);
  }
  if (L.horPressa) pl.horHaste = gameTime + HOR.haste;
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const L = pl.lg;
  if (!e || e.dead || !L || !(L.horParada || L.horEco || L.horParados)) return _hit(e, dir, mult, melee);
  if (L.horParados && horStopped(e)) mult *= 1 + L.horParados;
  const hp0 = e.hp, r = _hit(e, dir, mult, melee), dealt = hp0 - e.hp;
  if (dealt > 0 && horStopped(e)) e.horDmg = (e.horDmg || 0) + dealt;
  if (!melee || dealt <= 0) return r;
  if (L.horEco) horEchoQ.push({ e, t: HOR.echoT, d: Math.max(1, Math.round(dealt * L.horEco)) });
  if (L.horParada && (pl.horN = (pl.horN || 0) + 1) >= L.horEvery) { pl.horN = 0; horStopAt(e); }
  return r;
}; }
// the blow that would kill you takes you back: where you stood HOR.back s ago, with the life you had then
function horRewind() {
  const t0 = gameTime - HOR.back;
  let k = horHist.findIndex(h => h.t >= t0); if (k < 0) k = 0;
  while (k < horHist.length - 1 && rectSolid(horHist[k].x, horHist[k].y, pl.w, pl.h)) k++;
  const h = horHist[k], path = horHist.slice(k).map(q => [q.x + pl.w / 2, q.y + pl.h / 2]).concat([[pl.x + pl.w / 2, pl.y + pl.h / 2]]);
  pl.x = h.x; pl.y = h.y; pl.vx = 0; pl.vy = 0;
  pl.hp = Math.max(h.hp, Math.ceil(pl.maxHp * HOR.minHp)); pl.invuln = 1.2;
  horReady = gameTime + HOR.cd; horReadyNews = true; horHist.length = 0; horRewT = 0.7;
  horFxAdd('rewind', h.x + pl.w / 2, h.y + pl.h / 2, 0.9, { path });
  floatText(h.x + pl.w / 2, h.y - 10, 'REBOBINAR', '#d8f8ff', 1.2);
  horSfx.rewind(); shake(3); hitstop = Math.max(hitstop, 0.15);
}
{ const _raw = rawDamage; rawDamage = function (d, kdir) {
  const L = pl.lg;
  if (!pl.dead && L && L.horRebob && pl.hp - d <= 0 && gameTime >= horReady && horHist.length) return horRewind();
  return _raw(d, kdir);
}; }
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!pl.lg || !pl.lg.horPressa || !(pl.horHaste > gameTime)) return _up(dt);
  const s = pl.spd; pl.spd = s * (1 + pl.lg.horPressa); try { return _up(dt); } finally { pl.spd = s; }
}; }
HOOK.update.push(dt => {
  const L = pl.lg || {};
  // the stopped: pinned in place, their animation held, their minds off; when time runs again, what they took comes due
  let any = false;
  for (const e of enemies) {
    if (!(e.horT > 0)) continue;
    any = true; e.horT -= dt;
    e.x = e.horX; e.y = e.horY; e.vx = 0; e.vy = 0; e.t = e.horAt; e.stun = Math.max(e.stun || 0, e.horT);
    if (e.horT > 0 || e.dead) continue;
    e.horT = 0; e.horMax = 0;
    if (L.horRelease && e.horDmg > 0) {
      const d = Math.max(1, Math.round(e.horDmg * L.horRelease));
      e.hp -= d; e.flash = 0.12; e.showHp = 3;
      floatText(e.x + e.w / 2, e.y - 8, d + '!', '#f0d080', 1.15); horFxAdd('release', e.x + e.w / 2, e.y + e.h / 2, 0.4);
      horSfx.release(); shake(2);
      if (e.hp <= 0) killEnemy(e);
    }
    e.horDmg = 0;
  }
  // the echoes
  for (let k = horEchoQ.length - 1; k >= 0; k--) {
    const q = horEchoQ[k]; if ((q.t -= dt) > 0) continue;
    horEchoQ.splice(k, 1); const e = q.e; if (e.dead) continue;
    e.hp -= q.d; e.flash = 0.1; e.showHp = 3; if (horStopped(e)) e.horDmg = (e.horDmg || 0) + q.d;
    floatText(e.x + e.w / 2 + 4, e.y - 2, String(q.d), '#9ae8ff', 0.8); horFxAdd('echo', e.x + e.w / 2, e.y + e.h / 2, 0.3);
    horSfx.tick();
    if (e.hp <= 0) killEnemy(e);
  }
  // where the hero has been (a little more than HOR.back s of it)
  if (L.horRebob && !pl.dead) {
    if ((horHistT -= dt) <= 0) { horHistT = 0.1; horHist.push({ t: gameTime, x: pl.x, y: pl.y, hp: pl.hp }); }
    while (horHist.length && horHist[0].t < gameTime - HOR.back - 0.5) horHist.shift();
    if (horReadyNews && gameTime >= horReady) { horReadyNews = false; floatText(pl.x + pl.w / 2, pl.y - 10, 'REBOBINAR PRONTO', '#9ae8ff', 0.8); }
  } else horHist.length = 0;
  // the chest's clock: stands still while time is stopped, spins back while rewinding
  horRewT = Math.max(0, horRewT - dt); horFlash = Math.max(0, horFlash - dt);
  horClock.t += horRewT > 0 ? -dt * 12 : any ? 0 : dt;
  horTickBody();
  if (eqId('weapon') === HOR_ID) horTickSpear(clamp((pl.horN || 0) / (L.horEvery || HOR.every), 0, 1), (gameTime % 1) < 0.12);
  for (let k = horFx.length - 1; k >= 0; k--) if ((horFx[k].t += dt) > horFx[k].max) horFx.splice(k, 1);
});

/* ---- the set in the tooltip: the pieces you wear in gold, the bonuses you have in green ---- */
{ const _gt = gearTipBody; gearTipBody = function (s, cmp) {
  const h = _gt(s, cmp); if (!s || !HOR_SET.includes(s.id)) return h;
  const n = horSetCount(), off = '#6e655c';
  const names = HOR_SET.map(id => `<span style="color:${horSetHas(id) ? '#f0d080' : off}">${ITEMS[id].name}</span>`).join('');
  const bon = HOR_SET_TXT.map(([k, t]) => `<span style="color:${n >= k ? '#7fd36a' : off}">(${k}) ${t}</span>`).join('');
  return h + `<div class="base eclset"><span style="color:#ff9a3c">Conjunto da Hora Parada (${n}/${HOR_SET.length})</span>${names}${bon}</div>`;
}; }
