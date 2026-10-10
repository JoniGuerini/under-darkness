'use strict';

/* ================= nomes da forja e equipamento de madeira (2026-10-10) =================
   As peças da bigorna perdem o "Forjado/Forjada" do nome: Espada de Cobre, Montante de Cobalto.
   Onde isso dá o mesmo nome de uma base antiga (Espada de Ferro, Montante de Ferro, Espada de Ouro...),
   a base antiga vira a da forja: SAME_AS_FORGED leva o id velho para o da bigorna em mkItem e rollItem,
   então saves, saques e lojas passam a dar a mesma peça. O id velho continua em ITEMS (o save aponta para ele),
   marcado com `alias`, e a wiki não o lista.
   O herói novo começa com o pior que existe: Espada de Madeira, Montante de Madeira (na mochila, 23-save)
   e o Escudo de Madeira de sempre. A madeira bate WOOD_K do dano de uma peça do nível 1.
   A picareta inicial é a de pedra (mais lenta que a velha de ferro), e a bigorna faz uma picareta de cada metal (PICK_FORGE).
   Carrega depois do 110-infernita (a wiki também). */

for (const id in ITEMS) { const it = ITEMS[id]; if (it.forged) it.name = it.name.replace(/ Forjad[oa]s?(?= de )/, ''); }

/* ---- picaretas: uma por metal na bigorna, e a de pedra do herói novo ----
   Cada metal cava mais rápido e bate mais forte que o anterior. A cabeça usa as cores do metal (as mesmas do elmo). */
const PICK_FORGE = [[1.0, 6], [1.3, 8], [1.65, 10], [2.0, 13], [2.5, 16]];   // [mineração, dano] por metal, na ordem de METALS
METALS.forEach((M, t) => {
  const id = `f_picareta_${M.id}`, [mine, dmg] = PICK_FORGE[t] || PICK_FORGE[PICK_FORGE.length - 1];
  ITEMS[id] = { name: `Picareta de ${M.name}`, slot: 'tool', rar: 0, forged: true, g: 1, dmg, mine, pal: { M: M.M, m: M.m, a: mixHex(M.m, M.M, 0.5), h: '#9a6a3c', H: '#5f3a20' }, desc: `Forjada na bigorna do Grimaldo com 3 barras de ${M.name.toLowerCase()}.` };
  ITEM_G[id] = 1; RECIPES.push({ id, metal: t, bar: M.bar, n: 3 });
});
ITEMS.picareta_pedra = { name: 'Picareta de Pedra', slot: 'tool', rar: 0, g: 1, dmg: 4, mine: 0.75, pal: { M: '#b4aca0', m: '#5e5850', a: '#8a837a', h: '#9a6a3c', H: '#5f3a20' }, desc: 'Uma lasca de pedra amarrada num galho. Cava, mas devagar.' };
ITEM_G.picareta_pedra = 1; BASE_INFO.picareta_pedra = [1];
DEFAULT_EQ.tool = 'picareta_pedra';

const SAME_AS_FORGED = {};
{
  const byName = {}; for (const id in ITEMS) if (ITEMS[id].forged) byName[ITEMS[id].name] = id;
  for (const id in ITEMS) { const it = ITEMS[id], f = byName[it.name]; if (!it.forged && f && it.slot) { SAME_AS_FORGED[id] = f; it.alias = f; } }
  for (const t in DROPS) for (const r of DROPS[t]) if (SAME_AS_FORGED[r[0]]) r[0] = SAME_AS_FORGED[r[0]];
  for (const k in SHOP_GEAR) SHOP_GEAR[k] = [...new Set(SHOP_GEAR[k].map(id => SAME_AS_FORGED[id] || id))];
}
{
  const _mkItem = mkItem, _rollItem = rollItem;
  mkItem = function (id, rar, mods, il) {
    const to = SAME_AS_FORGED[id]; if (!to) return _mkItem(id, rar, mods, il);
    const L0 = baseInfo(to).L; return _mkItem(to, rar, mods, il && il >= L0 ? il : L0);
  };
  rollItem = function (id, z, src) { return _rollItem(SAME_AS_FORGED[id] || id, z, src); };
}

/* ---- madeira ---- */
const WOOD_K = 0.7;
const WOOD_P = { w: '#e8c48a', W: '#b07a44', l: '#6e4422', g: '#5a3a1e', G: '#3a2412', h: '#4a2c16', p: '#8a5a2c' };
Object.assign(ITEMS, {
  espada_madeira: { name: 'Espada de Madeira', slot: 'weapon', kind: 'sword', rar: 0, wood: 1, pal: WOOD_P, desc: 'Um pedaço de tábua lixado até parecer lâmina. Machuca mais o orgulho.' },
  montante_madeira: { name: 'Montante de Madeira', slot: 'weapon', kind: 'greatsword', rar: 0, wood: 1, twoHand: true, pal: WOOD_P, desc: 'Uma viga com cabo. Pesada, lenta e quase sem corte.' }
});
Object.assign(BASE_INFO, { espada_madeira: [1, 0.6], montante_madeira: [1, 1.0] });
ITEM_G.espada_madeira = 1; ITEMS.espada_madeira.g = 1; ITEM_G.montante_madeira = 0; ITEMS.montante_madeira.g = 0;
DEFAULT_EQ.weapon = 'espada_madeira';
{
  const _weaponBase = weaponBase;
  weaponBase = function (s) {
    const b = _weaponBase(s); if (!s || !ITEMS[s.id] || !ITEMS[s.id].wood) return b;
    const min = Math.max(1, Math.round(b.min * WOOD_K));
    return Object.assign({}, b, { min, max: Math.max(min + 1, Math.round(b.max * WOOD_K)) });
  };
}
