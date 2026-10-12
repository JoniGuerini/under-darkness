'use strict';

/* ================= arco e flecha: os dados (2026-10-12) =================
   Pedido do Jonathan: arco e flecha, com flechas à venda e no Criar, e uma aljava.
     - Arco ('bow'): arma de duas mãos, como o montante (tira o escudo, js/62-montante-maos.js), mas o espaço do escudo
       fica para a aljava. Quatro arcos: Curto (Criar e loja), de Caça, Longo e de Osso (loja e saque).
     - Aljava: vai no espaço do escudo e não levanta guarda (como o tomo). Sem aljava o arco não tem de onde tirar
       flecha. A Reforçada põe a flecha no arco 25% mais rápido.
     - Flechas: munição de pilha que fica na mochila. Flecha (madeira e pedra) e Flecha de Ferro (35% mais dano).
       Cada disparo gasta uma; a de ferro sai primeiro.
   Este arquivo só tem os dados e a arte (carrega depois do 346-armas-pesadas; a wiki também).
   As regras com o jogo rodando (mirar, puxar a corda, a flecha voando, pegar outra da aljava) ficam em js/350-arco.js. */

// letras de material: [chave da paleta, tom do heroRamp 0..5]
const BOW_MAT = { w: ['w', 4], W: ['w', 3], h: ['w', 1], G: ['G', 3], g: ['G', 4], k: ['k', 4], s: ['s', 4], r: ['r', 3], A: ['a', 5], a: ['a', 3], L: ['L', 3], l: ['L', 1], b: ['b', 3], B: ['b', 1], f: ['f', 3], F: ['f', 1] };
function bowPaint(rows, pal, seed) {
  const H = rows.length, W = rows[0].length, c = mk(W, H), x = c.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const m = BOW_MAT[rows[j][i]]; if (!m || !pal[m[0]]) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'w' || m[0] === 'L') v += g < 0.13 ? -1 : g > 0.92 ? 1 : 0;   // veio da madeira, couro gasto
    x.fillStyle = heroRamp(pal[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
// o arco em pé, a corda do lado esquerdo (para o arqueiro) e a madeira curvada para a direita (para o alvo)
function bowRows(H, depth) {
  const rows = [], c = (H - 1) / 2;
  for (let j = 0; j < H; j++) {
    const r = ['.', '.', '.', '.', '.', '.', '.'];
    if (j === 0 || j === H - 1) { r[1] = 'k'; rows.push(r.join('')); continue; }
    const u = (j - c) / c, xi = Math.round(1 + depth * (1 - u * u));
    r[xi] = 'W'; r[xi - 1] = 'h';
    if (Math.abs(j - c) <= 1.01) { r[xi] = 'G'; r[xi - 1] = 'G'; if (xi + 1 < 7) r[xi + 1] = 'g'; }
    else if (xi + 1 < 7 && Math.abs(u) < 0.55) r[xi + 1] = 'w';
    rows.push(r.join(''));
  }
  return rows;
}
const BOW_ICON = [
  ".............",
  "....wwWWWWk..",
  "...wWWhhhs...",
  "..wWhh..s....",
  ".wWGh..s.....",
  ".wWG..s......",
  ".WGh.s.......",
  ".Wh.s........",
  ".Whs.........",
  ".Ws..........",
  ".k...........",
  ".............",
  "............."
];
const QUIVER_ICON = [
  "......rA.....",
  ".....rArA....",
  "....aArAr....",
  "....LlaAa....",
  "...LLLl......",
  "...LbLl......",
  "..LLLl.......",
  "..LLLl.......",
  ".LbLl........",
  ".LLLl........",
  ".LLl.........",
  "..l..........",
  "............."
];
// a aljava nas costas do herói (atrás do corpo, as penas aparecem sobre o ombro)
const QUIVER_BACK = [
  "r.A...",
  "rArA..",
  ".aAa..",
  ".LLl..",
  ".LLl..",
  ".LbB..",
  ".LLl..",
  ".LLl..",
  ".LLl..",
  ".LbB..",
  ".LLl..",
  "..l..."
];
const ARROW_ICON = [
  "..........aa.",
  ".........aAa.",
  "........Waa..",
  ".......W.....",
  "......W......",
  ".....W.......",
  "....W........",
  "...W.........",
  "..W..........",
  ".fW..........",
  "fFf..........",
  ".f...........",
  "............."
];

KIND.bow = { name: 'Arco', spd: 0.8, reach: 60, rows: bowRows(17, 4), px: 5.5, py: 8.5, twoHand: true, bow: true, note: 'atira as flechas da aljava' };
WEAPON_TYPES.bow = { trait: 'À distância', spread: 0.25, spd: [0.8, 0.95] };

const BOW_PAL = {
  curto: { w: '#b07a44', G: '#5a3420', k: '#e0d0b0', s: '#e8e0cc' },
  caca: { w: '#6e4422', G: '#3a2412', k: '#c0903f', s: '#e8e0cc' },
  longo: { w: '#c89a5a', G: '#4a2c16', k: '#8a5a2c', s: '#f0e8d4' },
  osso: { w: '#d8ccb0', G: '#5a3420', k: '#8a7a62', s: '#e8e0cc' }
};
const QUIVER_PAL = {
  couro: { L: '#7a4a2a', b: '#c0903f', r: '#b83a3a', a: '#e8e0cc' },
  reforcada: { L: '#4e3e34', b: '#9aa0a8', r: '#3a6ab8', a: '#e8e0cc' }
};
const ARROW_PAL = {
  flecha: { w: '#b07a44', a: '#8a8478', f: '#c84a3a' },
  flecha_ferro: { w: '#8a6a44', a: '#c8ced8', f: '#e8e0cc' }
};
Object.assign(ITEMS, {
  arco_curto: { name: 'Arco Curto', slot: 'weapon', kind: 'bow', rar: 0, pal: BOW_PAL.curto, bowH: 17, desc: 'Um galho de freixo vergado e uma corda de tripa. Atira reto, se o vento ajudar.' },
  arco_caca: { name: 'Arco de Caça', slot: 'weapon', kind: 'bow', rar: 1, pal: BOW_PAL.caca, bowH: 17, desc: 'Madeira escura, curada na fumaça. O de quem vive do que acerta.' },
  arco_longo: { name: 'Arco Longo', slot: 'weapon', kind: 'bow', rar: 2, pal: BOW_PAL.longo, bowH: 21, bowSpd: 1.2, desc: 'Da altura de um homem. A flecha sai mais rápida e cai mais longe.' },
  arco_osso: { name: 'Arco de Osso', slot: 'weapon', kind: 'bow', rar: 2, pal: BOW_PAL.osso, bowH: 17, desc: 'Costelas presas com tendão. Range quando você puxa a corda.' },
  aljava_couro: { name: 'Aljava de Couro', slot: 'shield', quiver: true, nock: 1, rar: 0, pal: QUIVER_PAL.couro, desc: 'Um tubo de couro com alça. Vai nas costas e guarda as flechas da mochila à mão.' },
  aljava_reforcada: { name: 'Aljava Reforçada', slot: 'shield', quiver: true, nock: 1.25, rar: 1, pal: QUIVER_PAL.reforcada, desc: 'Couro grosso com anéis de ferro. A flecha sai dela mais depressa.' },
  flecha: { name: 'Flecha', rar: 0, stack: 99, icon: 'flecha', arrowK: 1, desc: 'Haste de madeira e ponta de pedra lascada. O arco gasta uma por disparo.' },
  flecha_ferro: { name: 'Flecha de Ferro', rar: 0, stack: 99, icon: 'flecha_ferro', arrowK: 1.35, desc: 'Ponta de ferro batido. Entra mais fundo: 35% mais dano. O arco usa estas primeiro.' }
});
Object.assign(BASE_INFO, { arco_curto: [1, 0.85], arco_caca: [3, 0.8], arco_longo: [5, 0.95], arco_osso: [6, 0.85], aljava_couro: [1], aljava_reforcada: [4] });
for (const id of ['arco_curto', 'arco_caca', 'arco_longo', 'arco_osso']) { ITEMS[id].g = 0; ITEM_G[id] = 0; ITEMS[id].twoHand = true; }
for (const id of ['aljava_couro', 'aljava_reforcada', 'flecha', 'flecha_ferro']) { ITEMS[id].g = 1; ITEM_G[id] = 1; }
ICON_ART.flecha = [ARROW_ICON, { W: ARROW_PAL.flecha.w, a: ARROW_PAL.flecha.a, A: '#b4aca0', f: ARROW_PAL.flecha.f, F: '#8a2a2a' }];
ICON_ART.flecha_ferro = [ARROW_ICON, { W: ARROW_PAL.flecha_ferro.w, a: ARROW_PAL.flecha_ferro.a, A: '#f4f6f8', f: ARROW_PAL.flecha_ferro.f, F: '#a8a090' }];
const isBow = id => !!(id && ITEMS[id] && ITEMS[id].slot === 'weapon' && ITEMS[id].kind === 'bow');
const isQuiver = id => !!(id && ITEMS[id] && ITEMS[id].quiver);

// onde aparecem: na loja do Grimaldo (além dos que ele sempre tem, js/350) e com os esqueletos arqueiros
SHOP_GEAR[1].push('arco_curto', 'aljava_couro');
SHOP_GEAR[2].push('arco_caca', 'aljava_couro');
SHOP_GEAR[3].push('arco_longo', 'arco_osso', 'aljava_reforcada');
if (DROPS.archer) DROPS.archer.push(['flecha', 0.45, 1, 4], ['arco_curto', 0.03], ['arco_caca', 0.01]);

/* ---- números: o arco atira de longe, então não ganha o bônus de duas mãos do montante ---- */
{
  const _weaponBase = weaponBase;
  weaponBase = function (s) {
    const b = _weaponBase(s); if (!s || !isBow(s.id)) return b;
    const min = Math.max(1, Math.round(b.min / TWO_HAND_DPS));
    return Object.assign({}, b, { min, max: Math.max(min + 1, Math.round(b.max / TWO_HAND_DPS)) });
  };
  // a aljava rola os modificadores do escudo que não são de defesa (como o tomo)
  const _affixPool = affixPool, DEF = ['def', 'parry', 'thorns'];
  affixPool = function (id, kind, maxTier) {
    const a = _affixPool(id, kind, maxTier);
    return isQuiver(id) ? a.filter(x => !x.lines.some(l => DEF.includes(l[0]))) : a;
  };
  const _gearTipBody = gearTipBody;
  gearTipBody = function (s, cmp) {
    let h = _gearTipBody(s, cmp);
    if (isBow(s.id)) h = h.replace(' golpes/s<', ' disparos/s<');
    if (isQuiver(s.id)) {
      h = h.replace('<small>Escudo · ', '<small>Aljava · ');
      const k = ITEMS[s.id].nock || 1; if (k > 1) h += `<div class="base"><span>Põe a flecha no arco ${Math.round((k - 1) * 100)}% mais rápido</span></div>`;
    }
    return h;
  };
}

/* ---- desenho: o arco na mão (a corda e a flecha entram em js/350), os ícones e a aljava nas costas ---- */
function bowArt(id) { const it = ITEMS[id]; return cached('bw:' + id, () => bowPaint(bowRows(it.bowH || 17, it.bowH > 19 ? 4.4 : 4), it.pal, 81)); }
function quiverBack(id) { return cached('qb:' + id, () => bowPaint(QUIVER_BACK, ITEMS[id].pal, 83)); }
{
  const _weaponFor = weaponFor, _makeIcon = makeIcon, _heroShieldFor = heroShieldFor;
  weaponFor = function (id) { return isBow(id) ? bowArt(id) : _weaponFor(id); };
  heroShieldFor = function (id) { if (!isQuiver(id)) return _heroShieldFor(id); const q = quiverBack(id); return { face: q, side: q }; };
  makeIcon = function (id) {
    let img = null;
    if (isBow(id)) img = bowPaint(BOW_ICON, ITEMS[id].pal, 85);
    else if (isQuiver(id)) img = bowPaint(QUIVER_ICON, ITEMS[id].pal, 86);
    else if (ARROW_PAL[id]) img = bowPaint(ARROW_ICON.map(r => r.replace(/W/g, 'w')), Object.assign({ s: '#e8e0cc' }, ARROW_PAL[id]), 87);
    if (!img) return _makeIcon(id);
    const o = outlined(img); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
