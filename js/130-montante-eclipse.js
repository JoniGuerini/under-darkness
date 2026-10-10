'use strict';

/* ================= o Montante do Eclipse: espada de duas mãos lendária =================
   Uma peça única (ITEMS[id].legend, como a Presa da Mãe-Teia e o Coração do Caos). Todo herói novo a encontra no
   baú da vila, junto com o conjunto (o 132 põe lá); nenhum monstro solta.
   - Lâmina de obsidiana com as bordas acesas como a coroa de um eclipse, estrelas piscando por dentro e um disco
     negro com um anel de luz no lugar da guarda. O desenho na mão é repintado a cada quadro (ECL_ROWS), o ícone é parado.
   - Eclipse: a cada ECL.every golpes que acertam, explode um eclipse no alvo e todos os inimigos a ECL.r px dele
     levam uma parte do seu dano médio.
   - Penumbra: com pouca luz em volta do herói (LB do 07 abaixo de ECL.dark), os golpes batem mais forte.
   Aqui ficam os dados, os desenhos e os efeitos (a wiki carrega este arquivo); o brilho por cima do escuro, o rastro
   do golpe e as faíscas ficam no js/131-eclipse-brilho.js. Carrega depois do 109 e antes do 49. */

const ECL_ID = 'montante_eclipse';
const ECL = { every: 4, r: 40, dark: 0.3 };

// letras: c coroa (acesa) · B lâmina · S estrela · D disco · d brilho do disco · m M guarda dourada · h H cabo · p P pomo
// mesma grade do montante (7 x 24, a mão na linha 18), então o encaixe, o alcance e o golpe são os mesmos do 61
const ECL_ROWS = [
  "...c...",
  "..cBc..",
  "..cSc..",
  "..cBc..",
  ".cBBBc.",
  ".cBSBc.",
  ".cBBBc.",
  ".cSBBc.",
  ".cBBSc.",
  ".cBBBc.",
  ".cBSBc.",
  ".cBBBc.",
  "ccDDDcc",
  "cDDDDDc",
  "cDdDDDc",
  "cDDDDDc",
  "mcDDDcm",
  "M.ccc.M",
  "...H...",
  "...h...",
  "...H...",
  "...h...",
  "..pPp..",
  "...p..."
];
const ECL_ICON = [
  "...c...",
  "..cBc..",
  "..cSc..",
  ".cBBBc.",
  ".cBSBc.",
  ".cBBBc.",
  "ccDDDcc",
  "cDdDDDc",
  "cDDDDDc",
  "mcDDDcm",
  "M..H..M",
  "..pPp..",
  "...p..."
];
const ECL_COL = {
  B: ['#2a1e3c', '#1c1228', '#110a18'], sheen: '#4a3670',
  corona: ['#a8661e', '#ffc860', '#fff0c0', '#ffffff'],
  starOff: '#3a2c58', starOn: ['#b8a8ff', '#ece6ff'],
  D: '#040208', d: '#2a2238', m: '#e0b048', M: '#8a6220', h: '#4a2a62', H: '#2a163c', p: '#c89a3a', P: '#fff0b0'
};
// the icon sits on a dark slot: the same blade, the obsidian a few steps lighter
const ECL_COL_ICON = Object.assign({}, ECL_COL, { B: ['#54426e', '#3a2c52', '#241834'], D: '#0c0814', d: '#463a5c' });
// paints one frame on `x` and, when given, only the lit pixels on `ex` (the layer drawn over the dark).
// t: seconds, for the shimmer; boost 0..1: the Penumbra lights it up
function eclPaint(rows, x, ex, t, boost, C = ECL_COL) {
  const H = rows.length, W = rows[0].length;
  x.clearRect(0, 0, W, H); if (ex) ex.clearRect(0, 0, W, H);
  const put = (i, j, col, lit) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); if (lit && ex) { ex.fillStyle = col; ex.fillRect(i, j, 1, 1); } };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    if (ch === 'B') {
      const side = i < 3 ? 0 : i === 3 ? 1 : 2;
      put(i, j, Math.sin(j * 0.7 - t * 3) > 0.9 && side < 2 ? C.sheen : C.B[side]);   // a glint running down the obsidian
    } else if (ch === 'c') {
      const w = 0.5 + 0.5 * Math.sin(t * 4 - j * 0.45 + i * 0.9) + boost * 0.35;
      put(i, j, C.corona[w > 1.05 ? 3 : w > 0.62 ? 2 : w > 0.25 ? 1 : 0], true);
    } else if (ch === 'S') {
      const s = Math.sin(t * 2.3 + hash2(i, j, 71) * 6.283);
      if (s > 0.2 - boost * 0.5) put(i, j, C.starOn[s > 0.75 ? 1 : 0], true); else put(i, j, C.starOff);
    } else if (ch === 'P') put(i, j, C.P, true);
    else put(i, j, C[ch]);
  }
}
const eclLive = { cv: null, x: null, em: null, ex: null, t: -1 };
function eclCanvas() {
  if (!eclLive.cv) {
    const W = ECL_ROWS[0].length, H = ECL_ROWS.length;
    eclLive.cv = mk(W, H); eclLive.x = eclLive.cv.getContext('2d');
    eclLive.em = mk(W, H); eclLive.ex = eclLive.em.getContext('2d');
    eclPaint(ECL_ROWS, eclLive.x, eclLive.ex, 0, 0);
  }
  return eclLive.cv;
}
// repaints the blade in the hand (the same canvas, so every pose that holds it moves with it)
function eclTick(t, boost) {
  eclCanvas(); if (eclLive.t === t) return;
  eclLive.t = t; eclPaint(ECL_ROWS, eclLive.x, eclLive.ex, t, boost);
}

/* ---- the item ---- */
STAT_DEF.lgEclipse = { t: `A cada ${ECL.every} golpes, um eclipse explode no alvo: X% do seu dano em todos os inimigos em volta`, pct: 1 };
STAT_DEF.lgPenumbra = { t: 'No escuro, seus golpes causam +X% de dano', pct: 1 };
STAT_KEYS.push('lgEclipse', 'lgPenumbra');
ITEMS[ECL_ID] = {
  name: 'Montante do Eclipse', slot: 'weapon', kind: 'greatsword', rar: 4, twoHand: true, g: 0, start: true,
  pal: { w: '#fff0c0', W: '#2a1e3c', l: '#110a18', g: '#e0b048', G: '#8a6220', h: '#4a2a62', p: '#fff0b0' },
  legend: [['lgEclipse', 1.2], ['lgPenumbra', 0.3], ['critDmg', 0.5]],
  desc: 'Forjado na noite em que o sol não voltou. A lâmina bebe a luz em volta; o que sobra arde só nas bordas.'
};
BASE_INFO[ECL_ID] = [14, 1.0];
ITEM_G[ECL_ID] = 0;

{
  const _weaponFor = weaponFor, _makeIcon = makeIcon;
  weaponFor = function (id) { return id === ECL_ID ? eclCanvas() : _weaponFor(id); };
  makeIcon = function (id) {
    if (id !== ECL_ID) return _makeIcon(id);
    const img = mk(ECL_ICON[0].length, ECL_ICON.length); eclPaint(ECL_ICON, img.getContext('2d'), null, 0.6, 0.4, ECL_COL_ICON);
    const c = mk(13, 13), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.save(); x.translate(6.5, 6.5); x.rotate(Math.PI / 4); x.drawImage(img, -img.width / 2, -img.height / 2); x.restore();
    const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}

/* ---- the effects ---- */
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let e = 0, p = 0;
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); e += st.lgEclipse || 0; p += st.lgPenumbra || 0; }
  if (pl.lg) { pl.lg.eclipse = e; pl.lg.penumbra = p; }
  return r;
}; }
// how much light reaches the hero this frame (the light grid of 07); null before the first frame
function eclLightHere() {
  if (typeof LB === 'undefined' || !LB || !LW) return null;
  const i = Math.floor((pl.x + pl.w / 2) / T) - LX0, j = Math.floor((pl.y + pl.h / 2) / T) - LY0;
  return i >= 0 && j >= 0 && i < LW && j < LH ? LB[j * LW + i] : null;
}
const eclInDark = () => { const L = eclLightHere(); return L != null && L < ECL.dark; };
const eclFx = [];   // the bursts being drawn: { x, y, t }
// a foe the eclipse centred on (x, y) reaches: its box within ECL.r px
function eclNear(o, x, y) {
  const dx = Math.max(0, Math.abs(o.x + o.w / 2 - x) - o.w / 2), dy = Math.max(0, Math.abs(o.y + o.h / 2 - y) - o.h / 2);
  return !o.dead && dx * dx + dy * dy <= ECL.r * ECL.r;
}
function eclBurst(e) {
  const x = e.x + e.w / 2, y = e.y + e.h / 2, d = Math.max(1, Math.round(pl.dmg * pl.lg.eclipse));
  eclFx.push({ x, y, t: 0 });
  shake(2.2); if (sfx.slam) sfx.slam();
  floatText(x, e.y - 14, 'ECLIPSE', '#ffd27a', 1);
  for (let k = 0; k < 18; k++) { const a = Math.random() * Math.PI * 2, v = rnd(40, 110); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, life: 0.5, max: 0.5, col: k % 3 ? '#ffd27a' : '#b8a8ff', size: 1, glow: true }); }
  for (const o of enemies.slice()) {
    if (!eclNear(o, x, y)) continue;
    o.hp -= d; o.flash = 0.1; o.showHp = 3;
    floatText(o.x + o.w / 2 + 5, o.y - 6, String(d), '#ffd27a', 0.9);
    if (o.hp <= 0) killEnemy(o);
  }
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const L = pl.lg;
  if (!e || e.dead || !melee || !L || !(L.eclipse || L.penumbra)) return _hit(e, dir, mult, melee);
  if (L.penumbra && eclInDark()) mult *= 1 + L.penumbra;
  const hp0 = e.hp, r = _hit(e, dir, mult, melee);
  if (L.eclipse && e.hp < hp0 && (pl.eclN = (pl.eclN || 0) + 1) >= (L.eclEvery || ECL.every)) { pl.eclN = 0; eclBurst(e); }
  return r;
}; }
HOOK.update.push(dt => { for (let k = eclFx.length - 1; k >= 0; k--) if ((eclFx[k].t += dt) > 0.45) eclFx.splice(k, 1); });
