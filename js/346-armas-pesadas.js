'use strict';

/* ================= o machado e a maça de duas mãos, e a maça de bloco (2026-10-12) =================
   Dois tipos novos de arma de duas mãos, ao lado do montante (js/61-montante.js), com as mesmas regras:
   tiram o escudo, as duas mãos no cabo, 30% mais dano por segundo (TWO_HAND_DPS), porque KIND.<tipo>.twoHand.
     greataxe  - Machado de Guerra: lâmina larga em meia-lua e um esporão atrás. Golpes largos, empurra um pouco mais.
     greatmace - Marreta: um bloco do metal na ponta de um cabo comprido. A mais lenta; atordoa e bate no chão.
   A bigorna do Grimaldo faz os dois em todo metal, logo depois do montante (machadao 6 barras, marreta 7).
   A maça de uma mão troca a bola por um bloco retangular do material, e as três passam a ter a pintura granulada
   das armas do herói (rampas do heroRamp, grão no couro e no metal).
   Os golpes de cada arma (2 ou 3 por tipo, todos diferentes) ficam em js/347-golpes.js.
   Carrega depois do 125-madeira (os nomes da forja já perderam o "Forjado"); a wiki também. */

// letras de material de GS_MAT (61-montante): w W F l = metal, k g G d = colar, h H = cabo, p P q = ponteira
const GAXE_ROWS = [
  "....k....",
  "....h.w..",
  "....hwWw.",
  "...ghWWWw",
  "..lGhFWWw",
  ".llGhFWWw",
  "..lGhFWWw",
  "...ghWWWw",
  "....hwWw.",
  "....h.w..",
  "....g....",
  "....h....",
  "....h....",
  "....h....",
  "....H....",
  "....h....",
  "....h....",
  "....H....",
  "....h....",
  "....H....",
  "....h....",
  "....H....",
  "...pPq...",
  "....q...."
];
const GMACE_ROWS = [
  ".wwwwwwl.",
  "wWWWWWWWl",
  "wWWWWWWWl",
  "wWWWWWWFl",
  "wWWWWWWFl",
  ".lFFFFFl.",
  "...kGk...",
  "....h....",
  "....h....",
  "....h....",
  "....h....",
  "....H....",
  "....h....",
  "....h....",
  "....H....",
  "....h....",
  "....H....",
  "....h....",
  "....H....",
  "....h....",
  "....H....",
  "....h....",
  "...pPq...",
  "....q...."
];
// a maça de uma mão: um bloco retangular (5x4) em vez da bola, com colar e cabo curto
const MACE_BLOCK = [
  "wwwwl",
  "wWWWl",
  "wWWFl",
  "lllll",
  ".kGk.",
  "..h..",
  "..H..",
  "..h..",
  "..H..",
  "..h..",
  "..H..",
  "..p.."
];
// ícones pintados direto na diagonal de 45°, de canto a canto como o do montante (cabeça em cima à direita)
const GAXE_ICON = [
  "..wwW......kk",
  ".wWWWW....hkk",
  "wWWWFWl..hhH.",
  "wWWFFFl.hhH..",
  "wWFFllllhHl..",
  ".wWl..hhHWl..",
  "..w..GhH.....",
  "....hGd......",
  "...hhH.......",
  "..hGH........",
  ".hhH.........",
  "phH..........",
  "pq..........."
];
const GMACE_ICON = [
  ".......ww....",
  "......wWWw...",
  ".....lWWWWw..",
  "......lWFFWw.",
  "......GlWFWWw",
  "......hGlWWWl",
  ".....GhHGlWl.",
  "....hGd...l..",
  "...hhH.......",
  "..hGH........",
  ".hhH.........",
  "phH..........",
  "pq..........."
];
// como gsPaint, mais o grão do metal batido: pontos um tom acima ou abaixo espalhados pela cabeça
function hvPaint(rows, pal, seed) {
  const H = rows.length, W = rows[0].length, c = mk(W, H), x = c.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const m = GS_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'h') v += g < 0.12 ? 1 : 0;
    else if (m[0] === 'W' || m[0] === 'l') v += g < 0.14 ? -1 : g > 0.9 ? 1 : 0;
    x.fillStyle = heroRamp(pal[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}

KIND.mace.rows = MACE_BLOCK;
KIND.greataxe = { name: 'Machado de Duas Mãos', spd: 0.55, reach: 34, kb: 1.6, rows: GAXE_ROWS, px: 4.5, py: 18.5, twoHand: true, note: 'golpes largos e pesados, ocupa as duas mãos' };
KIND.greatmace = { name: 'Maça de Duas Mãos', spd: 0.5, reach: 33, kb: 1.4, stun: 0.45, rows: GMACE_ROWS, px: 4.5, py: 18.5, twoHand: true, note: 'esmaga o chão e atordoa (45%), ocupa as duas mãos' };
WEAPON_TYPES.greataxe = { trait: 'Brutal', spread: 0.45, spd: [1.0, 1.15] };
WEAPON_TYPES.greatmace = { trait: 'Esmagadora', spread: 0.15, spd: [1.05, 1.2] };
Object.assign(FORGE_SPD, { machadao: 1.08, marreta: 1.12 });

// a bigorna: os dois em todo metal, logo depois do montante do mesmo metal
const HEAVY_PIECES = [
  ['machadao', 'Machado de Guerra', 0, 6, 'greataxe', 'Forjado'],
  ['marreta', 'Marreta', 1, 7, 'greatmace', 'Forjada']
];
METALS.forEach((M, t) => {
  let at = RECIPES.findIndex(r => r.id === `f_montante_${M.id}`);
  for (const [pc, nm, g, n, kind, f] of HEAVY_PIECES) {
    const id = `f_${pc}_${M.id}`; if (ITEMS[id]) continue;
    ITEMS[id] = { name: `${nm} de ${M.name}`, slot: 'weapon', kind, rar: 0, forged: true, twoHand: true, g, pal: M.wp, desc: `${f} na bigorna do Grimaldo com ${n} barras de ${M.name.toLowerCase()}.` };
    ITEM_G[id] = g;
    const r = { id, metal: t, bar: M.bar, n };
    if (at < 0) RECIPES.push(r); else RECIPES.splice(++at, 0, r);
  }
});

// onde mais aparecem: raros nos esqueletos e guardas, e na loja do Grimaldo
if (ITEMS.f_machadao_ferro) { DROPS.skeleton.push(['f_machadao_ferro', 0.015]); SHOP_GEAR[2].push('f_machadao_ferro'); }
if (ITEMS.f_marreta_ferro) { DROPS.guard.push(['f_marreta_ferro', 0.015]); SHOP_GEAR[2].push('f_marreta_ferro'); }
if (ITEMS.f_machadao_ouro) SHOP_GEAR[3].push('f_machadao_ouro', 'f_marreta_ouro');

// sprite na mão e ícone: os dois novos com a arte deles; a maça de uma mão com o bloco pintado e girado como as outras
{
  const HV = { greataxe: [GAXE_ROWS, GAXE_ICON, 71], greatmace: [GMACE_ROWS, GMACE_ICON, 73] };
  const kindOf = id => ITEMS[id] && ITEMS[id].slot === 'weapon' ? ITEMS[id].kind || 'sword' : null;
  const _weaponFor = weaponFor, _makeIcon = makeIcon;
  weaponFor = function (id) {
    const k = kindOf(id);
    if (HV[k]) return cached('w:' + id, () => hvPaint(HV[k][0], ITEMS[id].pal, HV[k][2]));
    if (k === 'mace') return cached('w:' + id, () => hvPaint(MACE_BLOCK, ITEMS[id].pal, 75));
    return _weaponFor(id);
  };
  makeIcon = function (id) {
    const k = kindOf(id); if (!HV[k]) return _makeIcon(id);
    const o = outlined(hvPaint(HV[k][1], ITEMS[id].pal, HV[k][2] + 1)); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
