'use strict';

/* ================= the two-handed sword (montante) =================
   A new weapon kind, 'greatsword': a long blade held with both hands. It is slow, reaches farther and pushes harder,
   and it hits harder per second than a one-handed weapon of the same item level, because it costs you the shield.
   This file only adds the data (bases, forge pieces, drops, chests, the sprite and the icon) and loads right after
   37-heroi, so the wiki picks it up too. The rules that need the game running (no shield while it is equipped,
   both hands on the grip, sword talents) live in js/62-montante-maos.js. */

// the blade is painted from material letters on the same 6-step ramps as the hero (37-heroi heroRamp):
// w edge light · W blade · F fuller · l back edge · k lugs · g G d crossguard · h H leather wrap · p P q pommel
const GS_ROWS = [
  "...w...",
  "..wWl..",
  "..wWl..",
  "..wWl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  "..wWl..",
  "..wWl..",
  ".kwWlk.",
  "gGGGGGd",
  "G..h..d",
  "...h...",
  "...H...",
  "...h...",
  "...H...",
  "..pPq..",
  "...q..."
];
// the same sword cut down to the 13 rows an inventory icon has
const GS_ICON = [
  "...w...",
  "..wWl..",
  "..wWl..",
  "..wFl..",
  "..wFl..",
  "..wFl..",
  ".kwWlk.",
  "gGGGGGd",
  "G..h..d",
  "...H...",
  "...h...",
  "..pPq..",
  "...q..."
];
const GS_MAT = { w: ['W', 5], W: ['W', 3], F: ['W', 1], l: ['l', 2], k: ['g', 4], g: ['g', 4], G: ['g', 3], d: ['G', 2], h: ['h', 3], H: ['h', 1], p: ['p', 5], P: ['p', 3], q: ['p', 1] };
function gsPaint(rows, pal) {
  const H = rows.length, W = rows[0].length, c = mk(W, H), x = c.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const m = GS_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, 23);
    if (m[0] === 'h') v += g < 0.12 ? 1 : 0;                         // worn leather
    else if (m[0] === 'W' && v === 3 && j > 0 && j % 5 === 2) v += 1; // a glint running down the steel
    x.fillStyle = heroRamp(pal[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}

KIND.greatsword = { name: 'Espada de Duas Mãos', spd: 0.6, reach: 36, kb: 1.5, rows: GS_ROWS, px: 3.5, py: 18.5, twoHand: true, note: 'golpes lentos e largos, ocupa as duas mãos' };
WEAPON_TYPES.greatsword = { trait: 'Pesada', spread: 0.3, spd: [0.95, 1.1] };
// no shield: the two-handed blows carry 30% more damage per second than a one-handed weapon of the same item level
const TWO_HAND_DPS = 1.3;
const isTwoHand = id => !!(id && ITEMS[id] && ITEMS[id].slot === 'weapon' && KIND[ITEMS[id].kind || 'sword'].twoHand);

Object.assign(ITEMS, {
  montante_ferro: { name: 'Montante de Ferro', slot: 'weapon', kind: 'greatsword', rar: 0, pal: SWORD_P, desc: 'Comprido como um homem. Precisa das duas mãos e de espaço para girar.' },
  montante_osso: { name: 'Montante de Osso', slot: 'weapon', kind: 'greatsword', rar: 1, pal: SW.bone, desc: 'Uma espinha inteira afiada até virar lâmina.' },
  montante_ouro: { name: 'Montante Dourado', slot: 'weapon', kind: 'greatsword', rar: 2, pal: SW.gold, desc: 'Pesado como um sino. Cada golpe parece uma badalada.' },
  montante_cristal: { name: 'Montante de Cristal', slot: 'weapon', kind: 'greatsword', rar: 3, pal: SW.crys, desc: 'Canta baixinho enquanto corta o ar.' }
});
Object.assign(BASE_INFO, { montante_ferro: [2, 1.0], montante_osso: [4, 1.05], montante_ouro: [5, 0.98], montante_cristal: [6, 0.95] });
FORGE_SPD.montante = 1.0;
// forged: 6 bars, after the spear of each metal at the anvil
METALS.forEach((M, t) => {
  const id = `f_montante_${M.id}`;
  ITEMS[id] = { name: `Montante Forjado de ${M.name}`, slot: 'weapon', kind: 'greatsword', rar: 0, forged: true, pal: M.wp, desc: `Forjado na bigorna do Grimaldo com 6 barras de ${M.name.toLowerCase()}.` };
  const at = RECIPES.findIndex(r => r.id === `f_lanca_${M.id}`);
  RECIPES.splice(at < 0 ? RECIPES.length : at + 1, 0, { id, metal: t, bar: M.bar, n: 6 });
});
for (const id in ITEMS) if (ITEMS[id].kind === 'greatsword') { ITEM_G[id] = 0; ITEMS[id].g = 0; ITEMS[id].twoHand = true; }

// where they turn up
DROPS.skeleton.push(['montante_ferro', 0.02]);
DROPS.guard.push(['montante_osso', 0.02]);
DROPS.brute.push(['montante_ouro', 0.025]);
DROPS.lurker.push(['montante_cristal', 0.02]);
CHEST_LOOT[1].push('montante_ferro');
CHEST_LOOT[2].push('montante_ferro', 'montante_osso');
CHEST_LOOT[3].push('montante_ouro', 'montante_cristal');

// the bigger blade hits harder per second (see TWO_HAND_DPS)
{
  const _weaponBase = weaponBase;
  weaponBase = function (s) {
    const b = _weaponBase(s); if (!s || !isTwoHand(s.id)) return b;
    const k = TWO_HAND_DPS, min = Math.max(1, Math.round(b.min * k));
    return Object.assign({}, b, { min, max: Math.max(min + 1, Math.round(b.max * k)) });
  };
}
// shaded sprite in the hand; the short version for the icon
{
  const _weaponFor = weaponFor, _makeIcon = makeIcon;
  weaponFor = function (id) { return isTwoHand(id) ? cached('w:' + id, () => gsPaint(GS_ROWS, ITEMS[id].pal)) : _weaponFor(id); };
  makeIcon = function (id) {
    if (!isTwoHand(id)) return _makeIcon(id);
    const img = cached('gi:' + id, () => gsPaint(GS_ICON, ITEMS[id].pal)), c = mk(13, 13), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.save(); x.translate(6.5, 6.5); x.rotate(Math.PI / 4); x.drawImage(img, -img.width / 2, -img.height / 2); x.restore();
    const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
