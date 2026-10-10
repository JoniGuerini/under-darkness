'use strict';

/* ================= armas mágicas: cajado, varinha e tomo (os dados) =================
   Três bases novas para quem luta com feitiços, vendidas pela maga do vilarejo (js/91-maga.js):
   - Cajado ('staff'): arma de duas mãos. Segue as regras do montante (js/62-montante-maos.js): tira o escudo,
     as duas mãos no cabo e o mesmo golpe de cima para baixo. É o que mais fortalece os feitiços.
   - Varinha ('wand'): arma de uma mão, curta e rápida, que deixa a outra mão livre para o tomo.
   - Tomo: vai no espaço do escudo (ITEMS[id].tome). Não bloqueia nem apara; dá mana e dano de feitiço.
   Corpo a corpo elas batem fraco (MAG_MELEE). O que importam são dois números novos, que também rolam nos modificadores:
     mana      +X de Mana (soma na mana máxima)
     spellPct  +X% de dano dos feitiços (Arco Voltaico e Nevasca)
   Este arquivo só tem os dados (bases, números, modificadores, desenhos e ícones) e carrega logo depois de
   67-nevasca-dados, para a wiki ver também. As regras com o jogo rodando ficam em js/92-magia-regras.js. */

STAT_DEF.mana = { t: '+X de Mana' };
STAT_DEF.spellPct = { t: '+X% de dano dos feitiços', pct: 1 };
STAT_KEYS.push('mana', 'spellPct');

/* ---- os desenhos: letras de material nas mesmas rampas de 6 tons do herói (37-heroi heroRamp) ----
   cajado: k K garras de madeira · W C c pedra (clara, meio, escura) · b B anel de metal · h H madeira · n nó
           r R couro do cabo · f ponteira de metal */
const STAFF_ROWS = [
  ".k...K.",
  ".kWCcK.",
  ".kCCcK.",
  ".kcCcK.",
  "..kcK..",
  "..bBb..",
  "...h...",
  "...H...",
  "...h...",
  "...h...",
  "..nh...",
  "...H...",
  "...h...",
  "...h...",
  "...H...",
  "...h...",
  "..bBb..",
  "...r...",
  "...R...",
  "...r...",
  "...R...",
  "...r...",
  "...h...",
  "...f..."
];
const STAFF_ICON = [
  ".k...K.",
  ".kWCcK.",
  ".kcCcK.",
  "..kcK..",
  "..bBb..",
  "...h...",
  "...H...",
  "...h...",
  "...h...",
  "...r...",
  "...R...",
  "...r...",
  "...f..."
];
const WAND_ROWS = [
  ".W.",
  "cCc",
  ".c.",
  ".b.",
  ".h.",
  ".H.",
  ".h.",
  ".h.",
  ".H.",
  ".r.",
  ".R.",
  ".f."
];
// tomo: L l D capa (borda clara, meio, sombra) · u U runa · m M cantoneiras e fecho de metal · p q folhas
const TOME_FACE = [
  "mLLLLLm",
  "LlllllD",
  "LllUllD",
  "LlUuUlM",
  "LUuuuUM",
  "LlUuUlM",
  "LllUllD",
  "LlllllD",
  "mDDDDDm"
];
const TOME_SIDE = [
  "mLLm.",
  "Lppp.",
  "Lpqp.",
  "Lppp.",
  "Lpqp.",
  "LpppM",
  "Lpqp.",
  "Lppp.",
  "Lpqp.",
  "Lppp.",
  "mDDm."
];
const TOME_ICON = [
  "mLLLLLLLLm.",
  "LllllllllDp",
  "LllllUlllDp",
  "LlllUuUllDp",
  "LllUuuuUlMp",
  "LlllUuUllMp",
  "LllllUlllDp",
  "LllllllllDp",
  "LllllllllDp",
  "mDDDDDDDDmp",
  ".pppppppppq"
];
const MAG_MAT = {
  k: ['wood', 3], K: ['wood', 1], W: ['gem', 5], C: ['gem', 3], c: ['gem', 1], b: ['metal', 4], B: ['metal', 2], h: ['wood', 3], H: ['wood', 1], n: ['wood', 2],
  r: ['grip', 3], R: ['grip', 1], f: ['metal', 3],
  L: ['cover', 4], l: ['cover', 2], D: ['cover', 0], u: ['rune', 5], U: ['rune', 3], m: ['metal', 4], M: ['metal', 2], p: ['page', 4], q: ['page', 2]
};
function magPaint(rows, pal, seed) {
  const H = rows.length, W = rows[0].length, c = mk(W, H), x = c.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const m = MAG_MAT[rows[j][i]]; if (!m || !pal[m[0]]) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'wood' || m[0] === 'cover') v += g < 0.14 ? -1 : g > 0.9 ? 1 : 0;   // veio da madeira, couro gasto
    else if (m[0] === 'grip' && g < 0.12) v += 1;
    x.fillStyle = heroRamp(pal[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}

/* ---- as bases ---- */
KIND.staff = { name: 'Cajado', spd: 0.7, reach: 32, kb: 1.3, rows: STAFF_ROWS, px: 3.5, py: 18.5, twoHand: true, magic: true, note: 'fortalece os feitiços, ocupa as duas mãos' };
KIND.wand = { name: 'Varinha', spd: 1.2, reach: 20, rows: WAND_ROWS, px: 1.5, py: 9, magic: true, note: 'fortalece os feitiços, deixa a outra mão para o tomo' };
WEAPON_TYPES.staff = { trait: 'Arcano', spread: 0.25, spd: [0.9, 1.0] };
WEAPON_TYPES.wand = { trait: 'Arcana', spread: 0.2, spd: [0.5, 0.6] };
// corpo a corpo elas batem fraco: o cajado já ganha o bônus de duas mãos (TWO_HAND_DPS) por cima disto
const MAG_MELEE = { staff: 0.5, wand: 0.6 };

const MAG_PAL = {
  freixo: { wood: '#8a5a32', gem: '#e8a838', metal: '#a4a6ad', grip: '#5a3a22' },
  salgueiro: { wood: '#a07a48', gem: '#e8a838', metal: '#a4a6ad', grip: '#5a3a22' },
  osso: { wood: '#d8ccb0', gem: '#9adf5a', metal: '#6a5a4a', grip: '#3a2a20' },
  cristal: { wood: '#3e2c40', gem: '#b88aff', metal: '#e8c04a', grip: '#2a1a3a' },
  couro: { cover: '#6a3a22', rune: '#e8c04a', metal: '#a4a6ad', page: '#e6dabd' },
  tosso: { cover: '#bdb39c', rune: '#d84848', metal: '#5a4c38', page: '#e6dabd' },
  prata: { cover: '#2a2e58', rune: '#9ad8ff', metal: '#dfe6ee', page: '#e6dabd' }
};
Object.assign(ITEMS, {
  cajado_freixo: { name: 'Cajado de Freixo', slot: 'weapon', kind: 'staff', rar: 0, pal: MAG_PAL.freixo, mana: 6, spellPct: 0.25, desc: 'Um galho reto de freixo com uma pedra de âmbar presa nas garras. Bate mal e conduz bem.' },
  cajado_osso: { name: 'Cajado de Osso', slot: 'weapon', kind: 'staff', rar: 1, pal: MAG_PAL.osso, mana: 10, spellPct: 0.35, desc: 'Ossos compridos encaixados um no outro. A pedra verde no alto pulsa como se respirasse.' },
  cajado_cristal: { name: 'Cajado de Cristal', slot: 'weapon', kind: 'staff', rar: 2, pal: MAG_PAL.cristal, mana: 15, spellPct: 0.5, desc: 'Ébano negro e um cristal violeta que nunca esfria. Os feitiços saem dele mais fundos.' },
  varinha_salgueiro: { name: 'Varinha de Salgueiro', slot: 'weapon', kind: 'wand', rar: 0, pal: MAG_PAL.salgueiro, mana: 3, spellPct: 0.12, desc: 'Leve e flexível. Na mão de quem sabe, aponta o feitiço sem tremer.' },
  varinha_osso: { name: 'Varinha de Osso', slot: 'weapon', kind: 'wand', rar: 1, pal: MAG_PAL.osso, mana: 5, spellPct: 0.18, desc: 'Um dedo comprido de alguma coisa que não era gente.' },
  varinha_cristal: { name: 'Varinha de Cristal', slot: 'weapon', kind: 'wand', rar: 2, pal: MAG_PAL.cristal, mana: 8, spellPct: 0.25, desc: 'A ponta violeta acende sozinha quando há magia por perto.' },
  tomo_couro: { name: 'Tomo de Couro', slot: 'shield', tome: true, rar: 0, def: 0, parry: 0, pal: MAG_PAL.couro, mana: 6, spellPct: 0.1, desc: 'Anotações de um aprendiz, com a letra cada vez mais firme. Não segura golpe nenhum.' },
  tomo_osso: { name: 'Tomo de Osso', slot: 'shield', tome: true, rar: 1, def: 0, parry: 0, pal: MAG_PAL.tosso, mana: 10, spellPct: 0.15, desc: 'Capa de osso polido e páginas que cheiram a cripta. As runas vermelhas parecem molhadas.' },
  tomo_prata: { name: 'Tomo de Prata', slot: 'shield', tome: true, rar: 2, def: 0, parry: 0, pal: MAG_PAL.prata, mana: 14, spellPct: 0.2, desc: 'Cantoneiras de prata e uma runa azul que brilha no escuro. Lido em voz baixa, a mana responde.' }
});
Object.assign(BASE_INFO, {
  cajado_freixo: [1, 0.95], cajado_osso: [3, 1.0], cajado_cristal: [5, 0.92],
  varinha_salgueiro: [1, 0.55], varinha_osso: [3, 0.57], varinha_cristal: [5, 0.52],
  tomo_couro: [1], tomo_osso: [3], tomo_prata: [5]
});
const MAGIC_IDS = ['cajado_freixo', 'cajado_osso', 'cajado_cristal', 'varinha_salgueiro', 'varinha_osso', 'varinha_cristal', 'tomo_couro', 'tomo_osso', 'tomo_prata'];
for (const id of MAGIC_IDS) { const it = ITEMS[id]; it.g = it.kind === 'wand' ? 1 : 0; ITEM_G[id] = it.g; if (it.kind === 'staff') it.twoHand = true; }
const isTome = id => !!(id && ITEMS[id] && ITEMS[id].tome);
const isMagicItem = id => !!(id && ITEMS[id] && (ITEMS[id].tome || (ITEMS[id].slot === 'weapon' && KIND[ITEMS[id].kind] && KIND[ITEMS[id].kind].magic)));

// onde aparecem fora da loja da maga: baús, como as outras armas
CHEST_LOOT[1].push('varinha_salgueiro', 'tomo_couro');
CHEST_LOOT[2].push('cajado_freixo', 'varinha_osso', 'tomo_osso');
CHEST_LOOT[3].push('cajado_cristal', 'varinha_cristal', 'tomo_prata');

/* ---- os números ---- */
{
  // corpo a corpo fraco
  const _weaponBase = weaponBase;
  weaponBase = function (s) {
    const b = _weaponBase(s), k = s && MAG_MELEE[ITEMS[s.id].kind]; if (!k) return b;
    const min = Math.max(1, Math.round(b.min * k));
    return Object.assign({}, b, { min, max: Math.max(min + 1, Math.round(b.max * k)) });
  };
  // a mana e o dano de feitiço escritos na base (os tomos já ganham pelo caminho dos escudos; as armas só levam o crítico)
  const _baseStats = baseStats;
  baseStats = function (s) {
    const o = _baseStats(s), it = s && ITEMS[s.id]; if (!it || it.slot !== 'weapon' || !isMagicItem(s.id)) return o;
    const q = itemRar(s) < 0 ? 0.8 : 1;
    o.mana += Math.round((it.mana || 0) * q); o.spellPct += Math.round((it.spellPct || 0) * q * 100) / 100;
    return o;
  };
}

/* ---- modificadores mágicos: só rolam em cajado, varinha e tomo ---- */
const MAGIC_AFFIXES = [
  { id: 'arcano', tier: 1, kind: 'p', name: ['Arcano', 'Arcanos'], g: ['Arcana', 'Arcanas'], lines: [['mana', [3, 0.8]]] },
  { id: 'runico', tier: 1, kind: 'p', name: ['Rúnico', 'Rúnicos'], g: ['Rúnica', 'Rúnicas'], lines: [['spellPct', [5, 1.2]]] },
  { id: 'do-aprendiz', tier: 1, kind: 's', name: 'do Aprendiz', lines: [['spellPct', [5, 1.2]]] },
  { id: 'da-vigilia', tier: 1, kind: 's', name: 'da Vigília', lines: [['mana', [3, 0.8]]] },
  { id: 'astral', tier: 2, kind: 'p', name: ['Astral', 'Astrais'], lines: [['spellPct', [8, 1.6]], ['mana', [2, 0.5]]] },
  { id: 'do-feiticeiro', tier: 2, kind: 's', name: 'do Feiticeiro', lines: [['spellPct', [9, 1.8]]] },
  { id: 'da-mente-clara', tier: 2, kind: 's', name: 'da Mente Clara', lines: [['mana', [5, 1.2]]] },
  { id: 'profano', tier: 3, kind: 'p', name: ['Profano', 'Profanos'], g: ['Profana', 'Profanas'], lines: [['spellPct', [12, 2.2]], ['mana', [3, 0.8]]] },
  { id: 'do-arquimago', tier: 3, kind: 's', name: 'do Arquimago', lines: [['spellPct', [8, 1.5]], ['mana', [4, 1]], ['hp', [1.5, 0.5]]] }
];
for (const a of MAGIC_AFFIXES) { a.magic = true; a.slots = 'magic'; a.where = new Set(['magic']); AFFIXES.push(a); AFF[a.id] = a; }
{
  // as armas mágicas rolam os modificadores de arma e os mágicos; o tomo rola os mágicos e os de escudo que não são de defesa
  const _affixPool = affixPool, DEFENSIVE = ['def', 'parry', 'thorns'];
  affixPool = function (id, kind, maxTier) {
    const base = _affixPool(id, kind, maxTier).filter(a => !a.magic);
    if (!isMagicItem(id)) return base;
    const own = MAGIC_AFFIXES.filter(a => a.kind === kind && a.tier <= maxTier);
    return own.concat(isTome(id) ? base.filter(a => !a.lines.some(l => DEFENSIVE.includes(l[0]))) : base);
  };
  // no cartão do item, o tomo é tomo, não escudo
  const _gearTipBody = gearTipBody;
  gearTipBody = function (s, cmp) { const h = _gearTipBody(s, cmp); return isTome(s.id) ? h.replace('<small>Escudo · ', '<small>Tomo · ') : h; };
}

/* ---- desenho na mão, no corpo e no ícone ---- */
{
  const _weaponFor = weaponFor, _makeIcon = makeIcon, _heroShieldFor = heroShieldFor;
  weaponFor = function (id) {
    const it = ITEMS[id]; if (!isMagicItem(id) || isTome(id)) return _weaponFor(id);
    return cached('w:' + id, () => magPaint(it.kind === 'staff' ? STAFF_ROWS : WAND_ROWS, it.pal, 61));
  };
  heroShieldFor = function (id) {
    if (!isTome(id)) return _heroShieldFor(id);
    return cached('hs:' + id, () => ({ face: magPaint(TOME_FACE, ITEMS[id].pal, 63), side: magPaint(TOME_SIDE, ITEMS[id].pal, 64) }));
  };
  makeIcon = function (id) {
    if (!isMagicItem(id)) return _makeIcon(id);
    const it = ITEMS[id], c = mk(13, 13), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    if (isTome(id)) { const img = magPaint(TOME_ICON, it.pal, 65); x.drawImage(img, 1, 1); }
    else {
      const img = magPaint(it.kind === 'staff' ? STAFF_ICON : WAND_ROWS, it.pal, 62);
      x.save(); x.translate(6.5, 6.5); x.rotate(Math.PI / 4); x.drawImage(img, -img.width / 2, -img.height / 2); x.restore();
    }
    const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
