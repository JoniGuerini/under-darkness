'use strict';

/* ================= itemization (adapted from Jonathan's GDD, "Itens Base", "Modificadores" and "Gerador de Itens") =================
   Every piece of gear is a white base (ITEMS in 05-itens) plus at most one prefix and one suffix rolled on top of it.
   - The base gives the numbers: a weapon's damage range and speed come from its item level and its type (BASE_INFO + WEAPON_TYPES);
     armour, shields, rings and tools keep the numbers written on the base.
   - The item takes the rarity of its highest modifier: only uncommon ones = Incomum, one rare = Raro, one epic = Épico,
     one legendary = Lendário. No modifier = Comum. Pobre is a damaged base: no modifier and 20% lower numbers.
   - Higher tiers carry more in one piece: rares up to 2 effects, epics up to 3, legendaries change how you fight.
   - Modifier numbers grow with the item level and vary up to 15% each roll.
   - Boss uniques (ITEMS[id].legend: Lâmina Infernal, Coração Infernal, Coroa do Rei Esqueleto) stay hand-written legendaries.
   Loads right after 05-itens. Item instance: { id, n: 1, rar (-1..4), il (item level), mods: [[affixId, v1, v2?], ...], uid }. */

RAR[-1] = 'Pobre'; RAR_COL[-1] = '#9a948c';

// weapon types: same DPS for the same item level; what changes is how much a blow varies (spread) and how fast it is.
// spd = seconds between blows while the button is held (range for the bases of the type). crit = the type's own crit chance.
const WEAPON_TYPES = {
  sword: { trait: 'Equilibrada', spread: 0.28, spd: [0.55, 0.7] },
  dagger: { trait: 'Rápida', spread: 0.2, spd: [0.4, 0.48], crit: 0.05 },
  axe: { trait: 'Imprevisível', spread: 0.5, spd: [0.85, 1.0] },
  mace: { trait: 'Constante', spread: 0.15, spd: [0.7, 0.8] },
  spear: { trait: 'Longa', spread: 0.3, spd: [0.68, 0.8] }
};
// Balance (rebalanced 2026-10-08, Jonathan: small numbers). A white iron sword at level 1 hits 3 to 4, about 1,7 blows/s.
// Weapons grow 30% per item level, like monster life (10-combate spawnEnemy). Monster life and damage, the hero's life and
// the potion are scaled to match in js/49-itens-efeitos.js (BAL).
const weaponDps = L => 5.8 * (1 + 0.3 * (L - 1));
const BASE_CRIT = 0.05, SWING = 0.6;   // SWING: seconds between blows with no weapon
// life numbers written on the bases (rings, helmets, the boss uniques) are scaled by this; pickaxe hits by PICK_K
const LIFE_K = 0.25, PICK_K = 0.3;
// armour: each point of Defesa cuts a share of every blow, with diminishing returns (8 = 35%, 20 = 57%, never past 75%)
const armorCut = def => Math.min(0.75, Math.max(0, def) / (Math.max(0, def) + 15));
const armorTaken = d => Math.max(1, Math.round(d * (1 - armorCut(pl.def))));
// item level and speed of each base. Bases not listed get a level from their old rarity and the middle speed of their type.
const BASE_INFO = {
  espada_ferro: [1, 0.6], cutelo: [1, 0.66], espada_osso: [3, 0.57], espada_ouro: [4, 0.64], lamina_cristal: [6, 0.55], lamina_infernal: [7, 0.62],
  adaga_ferro: [1, 0.42], adaga_osso: [3, 0.44], adaga_cristal: [6, 0.4],
  machado_ferro: [1, 0.9], machado_chifre: [5, 0.98], machado_ouro: [6, 0.86],
  maca_ferro: [1, 0.74], maca_osso: [3, 0.78], maca_ouro: [5, 0.72],
  lanca_ferro: [1, 0.72], lanca_osso: [3, 0.75], lanca_cristal: [6, 0.7],
  capuz: [1], elmo_ferro: [3], elmo_ouro: [5], elmo_osso: [3], elmo_chifres: [5], coroa_espectral: [6], coroa_rei: [7],
  tunica: [1], cota: [3], manto: [5], couraca_osso: [3], armadura_placas: [5], manto_espectral: [6],
  botas_couro: [1], botas_ferro: [3], botas_osso: [3], grevas_demonio: [6],
  escudo_madeira: [1], escudo_ferro: [2], escudo_osso: [3], escudo_ouro: [5], broquel: [2], escudo_torre: [3], escudo_espinhos: [4], escudo_infernal: [6],
  anel_vida: [3], amuleto: [2], pedra_lunar: [5], coracao_infernal: [7], anel_vampiro: [3], anel_espinhos: [4], anel_furia: [3], amuleto_vento: [3], talisma_ossos: [4], lanterna_fantasma: [4],
  picareta_ferro: [1], picareta_ouro: [4], picareta_cristal: [6]
};
// forged pieces: copper, iron, gold, crystal
const FORGE_ILVL = [2, 3, 5, 6], FORGE_SPD = { espada: 0.6, adaga: 0.43, machado: 0.92, maca: 0.75, lanca: 0.73 };
function baseInfo(id) {
  const it = ITEMS[id], b = BASE_INFO[id];
  let L = b ? b[0] : null, spd = b ? b[1] : null;
  const f = /^f_([a-z]+)_([a-z]+)$/.exec(id);
  if (f) { const t = METALS.findIndex(M => M.id === f[2]); if (L == null && t >= 0) L = FORGE_ILVL[t]; if (spd == null) spd = FORGE_SPD[f[1]]; }
  if (L == null) L = [1, 2, 4, 6, 7][clamp(it.rar | 0, 0, 4)];
  if (it.slot === 'weapon' && spd == null) { const T = WEAPON_TYPES[it.kind || 'sword']; spd = (T.spd[0] + T.spd[1]) / 2; }
  return { L, spd };
}

/* ---- the stats an item can carry ---- */
// pct: shown as a percentage (stored as a fraction). per5: shown per 5 s (stored per second).
const STAT_DEF = {
  dmgAdd: { t: '+X a Y de dano', t0: '+Y de dano máximo' },
  dmgPct: { t: '+X% de dano', pct: 1 },
  atkSpd: { t: '+X% de velocidade de ataque', pct: 1 },
  crit: { t: '+X% de chance de crítico', pct: 1 },
  critDmg: { t: '+X% de dano crítico', pct: 1 },
  lifeSteal: { t: 'X% do dano causado vira vida', pct: 1 },
  thorns: { t: 'Devolve X% do dano recebido de perto', pct: 1 },
  dodge: { t: '+X% de esquiva', pct: 1 },
  def: { t: '+X de Defesa' },
  hp: { t: '+X de Vida' },
  parry: { t: '+X s de janela de aparo', dec: 2 },
  spd: { t: '+X% de velocidade de movimento', pct: 1 },
  xp: { t: '+X% de experiência', pct: 1 },
  regen: { t: 'Restaura X de vida a cada 5 s', per5: 1, dec: 1 },
  onKill: { t: 'Restaura X de vida ao derrotar um inimigo' },
  light: { t: '+X de Luz' },
  mine: { t: '+X% de velocidade de mineração', pct: 1 },
  spark: { t: 'Chance ao acertar: 15% de chance de causar X de dano extra' },
  lgFirst: { t: 'Seu primeiro golpe em cada inimigo causa o dobro de dano', flag: 1 },
  lgBlood: { t: 'Cada golpe crítico devolve X% da sua vida máxima', pct: 1 },
  lgFome: { t: 'Cada inimigo derrotado aumenta seu dano em X% por 10 s. Acumula 10 vezes', pct: 1 },
  lgBrasa: { t: 'Chance ao acertar: o alvo queima e sofre X de dano a cada 1 s, por 4 s' },
  lgSino: { t: 'A cada 6 golpes, o próximo atordoa o alvo por 2 s', flag: 1 },
  lgFolego: { t: 'Ao cair abaixo de 15% da vida, recupera X% da vida. Só uma vez a cada 2 min', pct: 1 }
};
// stats the old system used that are still summed (bases, uniques): dmg is the tool's hit
const STAT_KEYS = ['dmg', 'dmgPct', 'atkSpd', 'crit', 'critDmg', 'lifeSteal', 'thorns', 'dodge', 'def', 'hp', 'parry', 'spd', 'xp', 'regen', 'onKill', 'light', 'mine',
  'dmgAddMin', 'dmgAddMax', 'spark', 'lgFirst', 'lgBlood', 'lgFome', 'lgBrasa', 'lgSino', 'lgFolego'];
// old modifier ids (saves from before, and the uniques' `legend` lists) and the stat each one gave
const LEGACY_STAT = { cruel: 'dmgPct', pesado: 'dmg', afiado: 'crit', veloz: 'atkSpd', sanguinario: 'lifeSteal', certeiro: 'critDmg', robusto: 'def', vigoroso: 'hp', agil: 'spd', brilhante: 'light', eficiente: 'mine', vampiro: 'lifeSteal', espinhos: 'thorns', raposa: 'dodge', urso: 'hp', furia: 'atkSpd', sabio: 'xp', lua: 'regen', fortaleza: 'def', vento: 'spd', carniceiro: 'onKill', precisao: 'crit', mineiro: 'mine', guardiao: 'parry' };

/* ---- modifiers ----
   tier 1 incomum, 2 raro, 3 épico, 4 lendário (always a suffix). kind p = prefix (an adjective that does not change with gender,
   [singular, plural]), s = suffix. lines: [stat, [base, per level] for each number]. Values are in the shown unit (percent, per 5 s).
   slots: where it can roll (weapon head body feet shield acc tool; "armor" = head body feet; "gear" = everything but the pickaxe). */
const AFFIXES = [
  // ---------- Incomum ----------
  { id: 'cortante', tier: 1, kind: 'p', name: ['Cortante', 'Cortantes'], lines: [['dmgAdd', [0, 0.25], [0.6, 0.4]]], slots: 'weapon' },
  { id: 'firme', tier: 1, kind: 'p', name: ['Firme', 'Firmes'], lines: [['def', [1, 0.3]]], slots: 'armor shield' },
  { id: 'resistente', tier: 1, kind: 'p', name: ['Resistente', 'Resistentes'], lines: [['hp', [2, 0.8]]], slots: 'armor shield acc' },
  { id: 'leve', tier: 1, kind: 'p', name: ['Leve', 'Leves'], lines: [['spd', [3, 0.5]]], slots: 'feet body acc' },
  { id: 'reluzente', tier: 1, kind: 'p', name: ['Reluzente', 'Reluzentes'], lines: [['light', [1, 0.2]]], slots: 'head acc tool' },
  { id: 'vivaz', tier: 1, kind: 'p', name: ['Vivaz', 'Vivazes'], lines: [['regen', [0.8, 0.3]]], slots: 'armor acc' },
  { id: 'do-coveiro', tier: 1, kind: 's', name: 'do Coveiro', lines: [['hp', [2, 0.8]]], slots: 'armor shield acc' },
  { id: 'do-sacristao', tier: 1, kind: 's', name: 'do Sacristão', lines: [['def', [1, 0.3]]], slots: 'armor shield' },
  { id: 'mordaz', tier: 1, kind: 'p', name: ['Mordaz', 'Mordazes'], lines: [['crit', [1, 0.25]]], slots: 'weapon' },
  { id: 'do-soldado', tier: 1, kind: 's', name: 'do Soldado', lines: [['dmgPct', [3, 0.8]]], slots: 'weapon' },
  { id: 'do-rastreador', tier: 1, kind: 's', name: 'do Rastreador', lines: [['critDmg', [8, 2.5]]], slots: 'weapon' },
  { id: 'do-lenhador', tier: 1, kind: 's', name: 'do Lenhador', lines: [['atkSpd', [3, 0.5]]], slots: 'weapon' },
  { id: 'do-novico', tier: 1, kind: 's', name: 'do Noviço', lines: [['xp', [4, 1]]], slots: 'head acc' },
  { id: 'do-peregrino', tier: 1, kind: 's', name: 'do Peregrino', lines: [['spd', [3, 0.5]]], slots: 'feet acc' },
  { id: 'da-vela', tier: 1, kind: 's', name: 'da Vela', lines: [['light', [1, 0.2]]], slots: 'head acc tool' },
  { id: 'do-escavador', tier: 1, kind: 's', name: 'do Escavador', lines: [['mine', [12, 3]]], slots: 'tool' },

  // ---------- Raro ----------
  { id: 'mortal', tier: 2, kind: 'p', name: ['Mortal', 'Mortais'], lines: [['crit', [2, 0.4]]], slots: 'weapon acc' },
  { id: 'atroz', tier: 2, kind: 'p', name: ['Atroz', 'Atrozes'], lines: [['dmgPct', [6, 1.2]]], slots: 'weapon' },
  { id: 'implacavel', tier: 2, kind: 'p', name: ['Implacável', 'Implacáveis'], lines: [['critDmg', [12, 4]]], slots: 'weapon acc' },
  { id: 'ligeiro', tier: 2, kind: 'p', name: ['Ligeiro', 'Ligeiros'], lines: [['atkSpd', [5, 0.8]]], slots: 'weapon acc', g: ['Ligeira', 'Ligeiras'] },
  { id: 'imponente', tier: 2, kind: 'p', name: ['Imponente', 'Imponentes'], lines: [['def', [1, 0.25]], ['hp', [1.5, 0.6]]], slots: 'armor shield' },
  { id: 'esguio', tier: 2, kind: 'p', name: ['Sutil', 'Sutis'], lines: [['dodge', [1.5, 0.3]], ['spd', [2, 0.4]]], slots: 'feet body acc' },
  { id: 'da-nevoa', tier: 2, kind: 's', name: 'da Névoa', lines: [['dodge', [2, 0.4]]], slots: 'armor acc' },
  { id: 'da-sanguessuga', tier: 2, kind: 's', name: 'da Sanguessuga', lines: [['lifeSteal', [1, 0.2]]], slots: 'weapon acc' },
  { id: 'do-espinheiro', tier: 2, kind: 's', name: 'do Espinheiro', lines: [['thorns', [10, 3]]], slots: 'body shield acc' },
  { id: 'do-duelista', tier: 2, kind: 's', name: 'do Duelista', lines: [['parry', [0.02, 0.005]]], slots: 'shield' },
  { id: 'do-acougueiro', tier: 2, kind: 's', name: 'do Açougueiro', lines: [['onKill', [1, 0.3]]], slots: 'weapon acc' },
  { id: 'do-erudito', tier: 2, kind: 's', name: 'do Erudito', lines: [['xp', [6, 1.5]]], slots: 'head acc' },
  { id: 'do-mercenario', tier: 2, kind: 's', name: 'do Mercenário', lines: [['dmgPct', [5, 1.2]], ['atkSpd', [3, 0.5]]], slots: 'weapon' },
  { id: 'do-monge', tier: 2, kind: 's', name: 'do Monge', lines: [['hp', [1.5, 0.6]], ['regen', [0.6, 0.25]]], slots: 'armor acc' },
  { id: 'do-minerador', tier: 2, kind: 's', name: 'do Minerador', lines: [['mine', [18, 4]], ['light', [1, 0.2]]], slots: 'tool' },

  // ---------- Épico ----------
  { id: 'voraz', tier: 3, kind: 'p', name: ['Voraz', 'Vorazes'], lines: [['lifeSteal', [2.5, 0.4]]], slots: 'weapon' },
  { id: 'inabalavel', tier: 3, kind: 'p', name: ['Inabalável', 'Inabaláveis'], lines: [['def', [2, 0.5]], ['hp', [2, 0.9]], ['thorns', [8, 2]]], slots: 'body shield' },
  { id: 'feroz', tier: 3, kind: 'p', name: ['Feroz', 'Ferozes'], lines: [['dmgPct', [5, 1]], ['crit', [1.5, 0.3]], ['lifeSteal', [0.8, 0.15]]], slots: 'weapon' },
  { id: 'celeste', tier: 3, kind: 'p', name: ['Celeste', 'Celestes'], lines: [['hp', [2, 0.7]], ['regen', [0.6, 0.25]], ['light', [1, 0.2]]], slots: 'armor acc' },
  { id: 'das-centelhas', tier: 3, kind: 's', name: 'das Centelhas', lines: [['spark', [1, 0.4]]], slots: 'weapon' },
  { id: 'do-carrasco', tier: 3, kind: 's', name: 'do Carrasco', lines: [['dmgPct', [5, 1]], ['hp', [2, 0.7]], ['crit', [1.5, 0.3]]], slots: 'weapon body' },
  { id: 'da-irmandade', tier: 3, kind: 's', name: 'da Irmandade', lines: [['crit', [1.5, 0.3]], ['dodge', [1.5, 0.3]], ['atkSpd', [3, 0.5]]], slots: 'weapon armor acc' },
  { id: 'da-muralha', tier: 3, kind: 's', name: 'da Muralha', lines: [['parry', [0.02, 0.004]], ['def', [1, 0.3]], ['hp', [1.5, 0.5]]], slots: 'shield' },
  { id: 'do-abade', tier: 3, kind: 's', name: 'do Abade', lines: [['xp', [4, 1]], ['regen', [0.6, 0.2]], ['light', [1, 0.2]]], slots: 'head acc' },

  // ---------- Lendário (always a suffix) ----------
  { id: 'do-primeiro-golpe', tier: 4, kind: 's', name: 'do Primeiro Golpe', lines: [['lgFirst']], slots: 'weapon', flavor: 'Quem bate primeiro bate duas vezes.' },
  { id: 'do-sangue-que-volta', tier: 4, kind: 's', name: 'do Sangue que Volta', lines: [['lgBlood', [3, 0.3]]], slots: 'weapon acc', flavor: 'O que sai pela lâmina volta pela mão.' },
  { id: 'da-fome-do-abismo', tier: 4, kind: 's', name: 'da Fome do Abismo', lines: [['lgFome', [2, 0.3]]], slots: 'gear', flavor: 'Quanto mais come, mais fome tem.' },
  { id: 'da-brasa-que-nao-apaga', tier: 4, kind: 's', name: 'da Brasa que Não Apaga', lines: [['lgBrasa', [1, 0.4]]], slots: 'weapon', flavor: 'Acenderam uma vez. Ninguém conseguiu apagar.' },
  { id: 'do-ultimo-sino', tier: 4, kind: 's', name: 'do Último Sino', lines: [['lgSino']], slots: 'weapon shield', flavor: 'Tocou uma vez, na noite em que a catedral afundou. O som ainda procura onde bater.' },
  { id: 'do-ultimo-folego', tier: 4, kind: 's', name: 'do Último Fôlego', lines: [['lgFolego', [25, 2]]], slots: 'body acc', flavor: 'A terra fecha a porta. Às vezes, devolve quem bateu.' }
];
const AFF = Object.fromEntries(AFFIXES.map(a => [a.id, a]));
const SLOT_GROUPS = { armor: ['head', 'body', 'feet'], gear: ['weapon', 'head', 'body', 'feet', 'shield', 'acc'] };
for (const a of AFFIXES) {
  a.where = new Set(a.slots.split(' ').flatMap(w => SLOT_GROUPS[w] || [w]));
  if (LEGACY_STAT[a.id]) throw new Error('modificador com id antigo: ' + a.id);
  if (a.tier === 4 && a.kind !== 's') throw new Error('lendário é sempre sufixo: ' + a.id);
}
const TIER_WEIGHT = [0, 65, 25, 9, 1];
// rarity odds by where the item comes from: [pobre, comum, incomum, raro, épico, lendário]
// (Épico only from depth 2, Lendário from depth 3)
const RARITY_ODDS = {
  monster: [25, 48, 21, 5, 0.9, 0.1],
  forge: [0, 100, 0, 0, 0, 0],   // the forge makes white pieces only (2026-10-09): modifiers come from the enchanter (118)
  shop: [0, 45, 42, 11, 2, 0]
};
// how deep a spot is, 1..4, for loot: the old caves (1-3) or the layers' bands (Átrio 1, Nave 2, Claustro 3, Criptas and deeper 4)
function lootZone(tx, ty) { const z = zoneAt(tx, ty); return clamp(z >= 5 ? z - 4 : z, 1, 4); }

/* ---- rolling ---- */
let UID = 1;
const pickW = (entries) => { let r = Math.random() * entries.reduce((n, e) => n + e[1], 0); for (const e of entries) { r -= e[1]; if (r <= 0) return e[0]; } return entries[entries.length - 1][0]; };
function affixPool(id, kind, maxTier) { const sl = ITEMS[id].slot; return AFFIXES.filter(a => a.kind === kind && a.where.has(sl) && a.tier <= maxTier); }
function rollValue(spec, L, sd) {
  const v = (spec[0] + spec[1] * L) * (0.85 + Math.random() * 0.3), k = sd.dec === 2 ? 100 : 10;
  if (spec[0] === 0 && !sd.pct && !sd.dec) return Math.max(0, Math.round(v));   // the low end of a damage range can be 0
  return sd.pct || sd.dec ? Math.max(1 / k, Math.round(v * k) / k) : Math.max(1, Math.round(v));
}
function rollAffix(a, L) {
  const out = [a.id];
  for (const [st, ...specs] of a.lines) { const sd = STAT_DEF[st]; for (const sp of specs) out.push(rollValue(sp, L, sd)); }
  // a damage range never comes out upside down
  if (a.lines[0][0] === 'dmgAdd' && out[2] <= out[1]) out[2] = out[1] + 1;
  return out;
}
function rollOne(id, kind, tier, exact, L) {
  const pool = affixPool(id, kind, tier).filter(a => exact ? a.tier === tier : true);
  if (!pool.length) return null;
  const t = exact ? tier : pickW([...new Set(pool.map(a => a.tier))].map(t => [t, TIER_WEIGHT[t]]));
  const list = pool.filter(a => a.tier === t);
  return rollAffix(list[Math.floor(Math.random() * list.length)], L);
}
// modifiers for an item of a given rarity: one of that rarity is guaranteed; 40% of the time the other position gets one too,
// of that rarity or lower. If nothing of that rarity fits the base (a pickaxe), it drops to the best one that does.
function rollMods(id, rar, L) {
  if (rar <= 0 || !ITEMS[id].slot) return [];
  L = L || baseInfo(id).L;
  for (let t = Math.min(4, rar); t >= 1; t--) {
    const kinds = ['p', 's'].filter(k => affixPool(id, k, t).some(a => a.tier === t));
    if (!kinds.length) continue;
    const k = kinds[Math.floor(Math.random() * kinds.length)], mods = [rollOne(id, k, t, true, L)];
    if (Math.random() < 0.4) { const o = rollOne(id, k === 'p' ? 's' : 'p', t, false, L); if (o) mods.push(o); }
    return mods.sort((a, b) => (AFF[a[0]].kind === 'p' ? 0 : 1) - (AFF[b[0]].kind === 'p' ? 0 : 1));
  }
  return [];
}
// saves from before the rebalance: same modifiers, numbers rolled again on the new scale
function rerollValues(id, mods, il) { const L = il || baseInfo(id).L; return (Array.isArray(mods) ? mods : []).map(m => Array.isArray(m) && AFF[m[0]] ? rollAffix(AFF[m[0]], L) : m); }
const modsTier = mods => mods.reduce((t, m) => Math.max(t, AFF[m[0]] ? AFF[m[0]].tier : 0), 0);
const validMod = m => Array.isArray(m) && AFF[m[0]] && m.length === 1 + AFF[m[0]].lines.reduce((n, l) => n + l.length - 1, 0) && m.slice(1).every(v => isFinite(v));
// rar: -1 pobre .. 4 lendário. Mods from an old save (old ids) are rolled again for the same rarity.
function mkItem(id, rar, mods, il) {
  const it = ITEMS[id], L0 = baseInfo(id).L;
  if (it.legend) return { id, n: 1, rar: 4, il: L0, mods: [], uid: UID++ };
  rar = clamp(rar | 0, -1, 4); il = clamp(il | 0 || L0, 1, 12);
  let ms = Array.isArray(mods) ? mods : [];
  if (ms.some(m => !validMod(m))) ms = rollMods(id, rar, il);
  ms = ms.filter(validMod);
  if (rar >= 1 && !ms.length) ms = rollMods(id, rar, il);
  const top = modsTier(ms);
  if (rar >= 1 || top) rar = top;   // the rarity is always the highest modifier
  return { id, n: 1, rar, il, mods: ms.map(m => m.slice()), uid: UID++ };
}
function rollRarity(z, src) {
  const o = (RARITY_ODDS[src] || RARITY_ODDS.monster).slice(), b = clamp(z || 1, 1, 4) - 1;
  o[3] *= 1 + 0.3 * b; o[4] *= 1 + 0.5 * b; o[5] *= 1 + 0.5 * b;
  if (b < 1) o[4] = 0; if (b < 2) o[5] = 0;   // no purple at the first depth, no orange before the third
  return pickW(o.map((w, i) => [i - 1, w]));
}
// src: 'monster' (default), 'forge' or 'shop'. z = zone depth 1..4
function rollItem(id, z, src) {
  if (ITEMS[id].legend) return mkItem(id);
  src = src || 'monster';
  const L0 = baseInfo(id).L, zz = clamp(z || 1, 1, 4);
  const il = clamp(L0 + (src === 'forge' ? 0 : src === 'shop' ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * zz)), 1, 12);
  const rar = rollRarity(zz, src);
  return mkItem(id, rar, rollMods(id, rar, il), il);
}
function itemRar(s) { return !s ? 0 : s.rar != null ? s.rar : (ITEMS[s.id].rar || 0); }

/* ---- names ---- */
// the prefix goes right after the first word of the base: "Espada Cortante de Ferro do Coveiro"
function itemName(s) {
  const it = ITEMS[s.id]; if (!it.slot || it.legend || !s.mods || !s.mods.length) return it.name;
  const pl2 = (it.g | 0) >= 2, fem = (it.g | 0) % 2 === 1;
  const p = s.mods.find(m => AFF[m[0]].kind === 'p'), f = s.mods.find(m => AFF[m[0]].kind === 's');
  let nm = it.name;
  if (p) { const a = AFF[p[0]], forms = fem && a.g ? a.g : a.name, adj = forms[pl2 ? 1 : 0], i = nm.indexOf(' '); nm = i < 0 ? nm + ' ' + adj : nm.slice(0, i) + ' ' + adj + nm.slice(i); }
  if (f) nm += ' ' + AFF[f[0]].name;
  return nm;
}

/* ---- numbers ---- */
// the white base: damage range and speed for weapons, the written numbers for everything else (poor bases lose 20%)
function weaponBase(s) {
  const it = ITEMS[s.id], T = WEAPON_TYPES[it.kind || 'sword'], { L, spd } = baseInfo(s.id), q = itemRar(s) < 0 ? 0.8 : 1;
  const avg = weaponDps(L) * spd * q;
  const min = Math.max(1, Math.round(avg * (1 - T.spread))), max = Math.max(min + 1, Math.round(avg * (1 + T.spread)));
  return { min, max, spd, type: T };
}
function baseStats(s) {
  const o = {}, it = s ? ITEMS[s.id] : null; for (const k of STAT_KEYS) o[k] = 0; if (!it || !it.slot) return o;
  const q = itemRar(s) < 0 ? 0.8 : 1;
  if (it.slot === 'weapon') { const T = WEAPON_TYPES[it.kind || 'sword']; o.crit = T.crit || 0; }
  else for (const k of STAT_KEYS) if (it[k] && (k !== 'dmg' || it.slot === 'tool')) o[k] = (k === 'def' || k === 'dmg') && q < 1 ? Math.floor(it[k] * q) : it[k];
  if (it.legend) for (const [k, v] of it.legend) { const st = LEGACY_STAT[k] || k; if (st in o) o[st] += v; }
  if (o.hp) o.hp = Math.max(1, Math.round(o.hp * LIFE_K)); if (o.onKill) o.onKill = Math.max(1, Math.round(o.onKill * LIFE_K));
  if (o.regen) o.regen = Math.round(o.regen * LIFE_K * 50) / 50; if (o.dmg) o.dmg = Math.max(1, Math.round(o.dmg * PICK_K));
  return o;
}
// the lines of one modifier as [stat, values[]] with values already in game units
function modLines(m) {
  const a = AFF[m[0]], out = []; let i = 1;
  for (const [st, ...specs] of a.lines) { out.push([st, m.slice(i, i + specs.length)]); i += specs.length; }
  return out;
}
const toStat = (st, v) => { const sd = STAT_DEF[st]; return sd.pct ? v / 100 : sd.per5 ? v / 5 : v; };
function itemStats(s) {
  const o = baseStats(s); if (!s || !s.mods) return o;
  for (const m of s.mods) if (AFF[m[0]]) for (const [st, vs] of modLines(m)) {
    if (st === 'dmgAdd') { o.dmgAddMin += vs[0]; o.dmgAddMax += vs[1]; }
    else if (STAT_DEF[st].flag) o[st] = 1;
    else o[st] += toStat(st, vs[0]);
  }
  return o;
}
// what a weapon does on its own: range with its flat bonus and its own % damage, blows per second, and DPS
function weaponInfo(s) {
  if (!s) return { min: 1, max: 2, spd: SWING, aps: 1 / SWING, dps: 1.5 / SWING };
  const b = weaponBase(s), st = itemStats(s), k = 1 + st.dmgPct;
  const min = Math.round((b.min + st.dmgAddMin) * k), max = Math.round((b.max + st.dmgAddMax) * k), aps = (1 + st.atkSpd) / b.spd;
  return { min, max, spd: b.spd, aps, dps: (min + max) / 2 * aps, base: b };
}

/* ---- value at the shops ---- */
const RAR_VALUE = { '-1': 0.5, 0: 1, 1: 1.7, 2: 2.8, 3: 5, 4: 10 };
function gearValue(s) {
  const it = ITEMS[s.id], L = s.il || baseInfo(s.id).L;
  const k = it.slot === 'weapon' ? 1.2 : it.slot === 'body' || it.slot === 'shield' ? 1.1 : it.slot === 'acc' ? 1.3 : it.slot === 'tool' ? 1.1 : 0.9;
  return Math.max(3, Math.round((8 + 6 * Math.pow(L, 1.35)) * k * RAR_VALUE[itemRar(s)]));
}

/* ---- tooltip (WoW / GDD style): name, type, item level, damage and speed, DPS, base numbers, effects in green, flavour ----
   Holding Ctrl splits every summed line into one per origin, with the name piece it came from. */
const fmtN = (v, d = 1) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace('.', ',').replace(/,0+$/, '');
function statText(st, vs) {
  const sd = STAT_DEF[st]; let i = 0;
  const neg = vs[0] < 0, shown = vs.map(v => { v = Math.abs(v); return sd.pct ? fmtN(v * 100, 1) : sd.per5 ? fmtN(v * 5, 1) : sd.dec ? fmtN(v, 2) : String(Math.round(v)); });
  if (sd.t0 && vs[0] === 0) return sd.t0.replace('Y', shown[1]);
  const t = sd.t.replace(/X|Y/g, () => shown[i++]);
  return neg ? t.replace(/^\+/, '−') : t;
}
const ctrlHeld = () => !!(keys.ControlLeft || keys.ControlRight);
const titleCase = w => w.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
function effectLines(s) {
  const it = ITEMS[s.id], groups = new Map();
  const add = (st, vs, from, col) => {
    let g = groups.get(st); if (!g) { g = { st, vs: vs.map(() => 0), parts: [] }; groups.set(st, g); }
    g.vs = g.vs.map((v, i) => v + vs[i]); g.parts.push({ vs, from, col });
  };
  // the base's own effect (rings, amulets, uniques): everything but the plain numbers shown above it
  const b = baseStats(s);
  for (const k of STAT_KEYS) if (b[k] && STAT_DEF[k] && !['def', 'parry'].includes(k) && !(k === 'mine' && it.slot === 'tool')) add(k, [b[k]], it.name, RAR_COL[itemRar(s)]);
  for (const m of s.mods || []) { const a = AFF[m[0]]; if (!a) continue; const piece = Array.isArray(a.name) ? a.name[0] : a.name;
    for (const [st, vs] of modLines(m)) add(st, st === 'dmgAdd' ? vs : [toStat(st, vs[0])], titleCase(piece), RAR_COL[a.tier]); }
  const split = ctrlHeld(), out = [];
  for (const g of groups.values()) {
    if (split && g.parts.length > 1) for (const p of g.parts) out.push(`${statText(g.st, p.vs)} <i style="color:${p.col}">(${p.from})</i>`);
    else out.push(statText(g.st, g.vs) + (split ? ` <i style="color:${g.parts[0].col}">(${g.parts[0].from})</i>` : ''));
  }
  return out;
}
const SLOT_TYPE = { head: 'Cabeça', body: 'Corpo', feet: 'Pés', shield: 'Escudo', acc: 'Acessório', tool: 'Ferramenta' };
function gearTipBody(s, cmp) {
  const it = ITEMS[s.id], rar = itemRar(s), up = (d, f) => Math.abs(d) < 1e-6 ? '' : ` <span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${f(Math.abs(d))}</span>`;
  const K = it.slot === 'weapon' ? KIND[it.kind || 'sword'] : null, T = K ? WEAPON_TYPES[it.kind || 'sword'] : null;
  let h = `<small>${K ? K.name + ' · ' + T.trait : SLOT_TYPE[it.slot]} · ${it.legend ? 'Lendário' : RAR[rar]}</small><span class="il">Nível do item ${s.il || baseInfo(s.id).L}</span>`;
  const b = baseStats(s);
  if (K) {
    const w = weaponInfo(s), c = cmp !== undefined ? weaponInfo(cmp) : null;
    h += `<div class="wdmg"><span>${w.min} – ${w.max} de dano</span><span>${fmtN(w.aps, 1)} golpes/s</span></div>`;
    h += `<span class="dps">(${fmtN(w.dps, 1)} de dano por segundo)${c ? up(w.dps - c.dps, v => fmtN(v, 1)) : ''}</span>`;
  }
  const cs = cmp !== undefined ? baseStats(cmp) : null, rows = [];
  if (b.def || (cs && cs.def && it.slot !== 'weapon')) rows.push(`${b.def} de Defesa${cs ? up(b.def - cs.def, v => String(v)) : ''}`);
  if (b.parry) rows.push(`Janela de aparo ${fmtN(b.parry, 2)} s${cs ? up(b.parry - cs.parry, v => fmtN(v, 2) + ' s') : ''}`);
  if (it.slot === 'tool') { if (b.mine) rows.push(`Mineração ${Math.round(b.mine * 100)}%`); if (b.dmg) rows.push(`${b.dmg} de dano ao acertar`); }
  if (rows.length) h += `<div class="base">${rows.map(r => `<span>${r}</span>`).join('')}</div>`;
  const fx = effectLines(s);
  if (fx.length) h += `<div class="fx">${fx.map(l => `<span>${l}</span>`).join('')}</div>`;
  const lg = (s.mods || []).map(m => AFF[m[0]]).find(a => a && a.flavor);
  if (lg) h += `<p class="flavor">"${lg.flavor}"</p>`;
  return h;
}
