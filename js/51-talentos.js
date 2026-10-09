'use strict';

/* ================= talentos: árvore de passivas do guerreiro (inspirada no Path of Exile) =================
   P abre uma tela que cobre o jogo inteiro (só os globos de vida e mana ficam por cima). A árvore é um canvas:
   começa com zoom alto no nó do centro, arrastar com o botão esquerdo move, a rodinha aproxima e afasta.
   Clique esquerdo num nó liga o caminho mais curto até ele (se houver pontos); clique direito devolve um nó
   da ponta (que não deixe outro solto).
   Pontos: 1 por nível do personagem (subir de nível continua sem dar nada direto; o ponto é a recompensa).
   Os efeitos entram no recalc (js/08-estado-entrada.js) por talentTot (somas, junto com os itens) e talentPost
   (multiplicadores e coisas que não existem nos itens). Alguns efeitos embrulham hitEnemy, hurtPlayer e spendVigor.
   Salvo no save como `tal` (lista de ids). Carrega depois do 50-vigor e antes do 29-portal e do 24-boot. */

/* ---- os nós ----
   t: o (início), s (pequeno), n (notável), k (maior). fx: [stat, valor, condição?]. Condição = tipo de arma ou 'shield'.
   Cada nó pequeno tem uma categoria (TAL_CAT) que dá nome, ícone e cor; três seguidos da mesma categoria têm a mesma arte.
   Notáveis e maiores têm nome próprio e usam o ícone da categoria indicada (cat). */
const TAL_COND = { sword: 'com espadas', dagger: 'com adagas', mace: 'com maças', axe: 'com machados', spear: 'com lanças', shield: 'com escudo' };
const TAL_TXT = {
  dmgPct: '+X% de dano', atkSpd: '+X% de velocidade de ataque', crit: '+X% de chance de crítico', critDmg: '+X% de dano crítico',
  lifeSteal: 'X% do dano causado vira vida', thorns: 'Devolve X% do dano recebido de perto', dodge: '+X% de esquiva',
  def: '+X de Defesa', hp: '+X de Vida', hpPct: '+X% de Vida máxima', defPct: '+X% de Defesa', spd: '+X% de velocidade de movimento',
  dmgAdd: '+X a Y de dano', parry: '+X s de janela de aparo', stun: '+X% de chance de atordoar', kb: 'Seus golpes empurram X% mais longe',
  vigCost: 'Bloquear e aparar custam X% menos vigor', riposte: 'Depois de aparar, o próximo golpe em 3 s causa o dobro de dano',
  vsStun: '+X% de dano contra inimigos atordoados', backstab: '+X% de dano ao acertar inimigos pelas costas'
};
// os que vão direto para o total dos itens (em % viram fração)
const TAL_TOT_PCT = ['dmgPct', 'atkSpd', 'crit', 'critDmg', 'lifeSteal', 'thorns', 'dodge', 'spd'], TAL_TOT_FLAT = ['def', 'hp'];

// categorias: nome do nó pequeno, efeito do nó pequeno, ícone e cor de fundo quando ligado
const TAL_CAT = {
  dano: ['Dano corpo a corpo', [['dmgPct', 6]], 'dano', '#3a1416'],
  espada: ['Dano com espadas', [['dmgPct', 10, 'sword']], 'espada', '#2a2418'],
  maca: ['Dano com maças', [['dmgPct', 10, 'mace']], 'maca', '#2a2418'],
  adaga: ['Dano com adagas', [['dmgPct', 10, 'dagger']], 'adaga', '#2a2418'],
  vel: ['Velocidade de ataque', [['atkSpd', 4]], 'vel', '#3a2a0c'],
  crit: ['Chance de crítico', [['crit', 3]], 'crit', '#3a220c'],
  critDmg: ['Dano crítico', [['critDmg', 10]], 'critDmg', '#3a160c'],
  vida: ['Vida', [['hp', 2]], 'vida', '#3a0e14'],
  vidaPct: ['Vida máxima', [['hpPct', 4]], 'vidaPct', '#3a0e14'],
  def: ['Defesa', [['def', 2]], 'def', '#1c2230'],
  aparo: ['Aparo', [['parry', 0.02, 'shield']], 'aparo', '#33280c'],
  vigor: ['Vigor', [['vigCost', 8, 'shield']], 'vigor', '#14301a'],
  espinhos: ['Espinhos', [['thorns', 5]], 'espinhos', '#16260e'],
  atordoar: ['Atordoar', [['stun', 4, 'mace']], 'atordoar', '#2a1a3a'],
  empurrao: ['Empurrão', [['kb', 10]], 'empurrao', '#2e1e10'],
  quebra: ['Golpe nos atordoados', [['vsStun', 10]], 'quebra', '#28183a'],
  esquiva: ['Esquiva', [['dodge', 2]], 'esquiva', '#0e2a2a'],
  sangue: ['Roubo de vida', [['lifeSteal', 1]], 'sangue', '#300a10'],
  passo: ['Velocidade de movimento', [['spd', 3]], 'passo', '#2a1c10']
};

// cada ramo: [prefixo, ângulo, tronco, [caminho esquerdo, notável], [caminho do meio, notável], [caminho direito, notável], pontas de fora, maior]
// notável/maior: [nome, ícone, efeitos]
const TAL_BRANCH = [
  ['es', -Math.PI / 2, 'dano',
    ['crit', ['Corte Preciso', 'crit', [['crit', 5], ['critDmg', 25]]]],
    ['espada', ['Fio Implacável', 'espada', [['dmgPct', 15, 'sword'], ['crit', 3, 'sword']]]],
    ['vel', ['Dança das Lâminas', 'vel', [['atkSpd', 8], ['spd', 5]]]],
    ['critDmg', 'passo'], ['Mestre de Espadas', 'espada', [['dmgPct', 25, 'sword'], ['atkSpd', 10, 'sword']]]],
  ['eo', 0, 'vida',
    ['aparo', ['Revide', 'aparo', [['riposte', 1, 'shield'], ['parry', 0.03, 'shield']]]],
    ['def', ['Muralha', 'def', [['def', 5], ['vigCost', 15, 'shield']]]],
    ['vigor', ['Braço de Ferro', 'vigor', [['vigCost', 15, 'shield'], ['hp', 3]]]],
    ['espinhos', 'vidaPct'], ['Bastião', 'escudo', [['defPct', 25], ['thorns', 10]]]],
  ['ma', Math.PI / 2, 'dano',
    ['atordoar', ['Crânio Partido', 'atordoar', [['stun', 8, 'mace'], ['vsStun', 30]]]],
    ['maca', ['Força Bruta', 'maca', [['dmgAdd', [1, 2]], ['kb', 20]]]],
    ['empurrao', ['Ombros de Touro', 'empurrao', [['kb', 20], ['hp', 3]]]],
    ['quebra', 'vida'], ['Martelo do Juízo', 'maca', [['dmgPct', 25, 'mace'], ['stun', 10, 'mace']]]],
  ['ad', Math.PI, 'vel',
    ['critDmg', ['Apunhalar', 'apunhalar', [['backstab', 50], ['critDmg', 20, 'dagger']]]],
    ['adaga', ['Golpe Veloz', 'adaga', [['dmgPct', 12, 'dagger'], ['atkSpd', 6, 'dagger']]]],
    ['esquiva', ['Sombra Fugidia', 'esquiva', [['dodge', 5], ['spd', 5]]]],
    ['sangue', 'passo'], ['Sede de Sangue', 'sangue', [['lifeSteal', 3], ['atkSpd', 12, 'dagger']]]]
];
// pontes entre ramos vizinhos (dois nós cada)
const TAL_BRIDGE = ['def', 'vida', 'dano', 'vel'];

const TAL = {}, TAL_LIST = [];
(function buildTree() {
  const add = (id, t, name, fx, a, r, icon) => { const n = { id, t, name, fx, x: Math.cos(a) * r, y: Math.sin(a) * r, icon, nb: [] }; TAL[id] = n; TAL_LIST.push(n); return n; };
  const small = (id, cat, a, r) => { const C = TAL_CAT[cat]; return add(id, 's', C[0], C[1], a, r, cat); };
  const link = (a, b) => { TAL[a].nb.push(b); TAL[b].nb.push(a); };
  const chain = ids => { for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i]); };
  add('o', 'o', 'Guerreiro', [], 0, 0, 'inicio');
  for (const [p, a, trunk, L, M, R, outer, K] of TAL_BRANCH) {
    for (let i = 0; i < 3; i++) small(p + 't' + i, trunk, a, 90 + i * 72);
    chain(['o', p + 't0', p + 't1', p + 't2']);
    [[L, 'L', -0.4], [M, 'M', 0], [R, 'R', 0.4]].forEach(([[cat, [nm, icon, fx]], s, da]) => {
      for (let i = 0; i < 3; i++) small(p + s + i, cat, a + da * (0.8 + i * 0.1), 315 + i * 72);
      add(p + s + 'n', 'n', nm, fx, a + da * 1.05, 545, icon);
      chain([p + 't2', p + s + '0', p + s + '1', p + s + '2', p + s + 'n']);
    });
    add(p + 'k', 'k', K[0], K[2], a, 710, K[1]);
    link(p + 'Mn', p + 'k');
    [['L', -1, outer[0]], ['R', 1, outer[1]]].forEach(([s, sg, cat]) => {
      small(p + s + 'o0', cat, a + sg * 0.36, 630); small(p + s + 'o1', cat, a + sg * 0.2, 690);
      chain([p + s + 'n', p + s + 'o0', p + s + 'o1', p + 'k']);
    });
  }
  TAL_BRIDGE.forEach((cat, i) => {
    const p = TAL_BRANCH[i], q = TAL_BRANCH[(i + 1) % 4], a = p[1] + Math.PI / 4;
    small('p' + i + 'a', cat, a - 0.13, 345); small('p' + i + 'b', cat, a + 0.13, 345);
    chain([p[0] + 'R0', 'p' + i + 'a', 'p' + i + 'b', q[0] + 'L0']);
  });
})();
const TAL_EDGES = []; for (const n of TAL_LIST) for (const m of n.nb) if (n.id < m) TAL_EDGES.push([n, TAL[m]]);

/* ---- estado ---- */
const tal = { on: new Set(['o']) };
const talTotal = () => Math.max(0, pl.lvl | 0);          // 1 ponto por nível
const talPoints = () => talTotal() - (tal.on.size - 1);

/* ---- efeitos ---- */
let talAcc = {};
function talCondOk(c, kind) { return !c || (c === 'shield' ? !!equip.shield : c === kind); }
// chamado pelo recalc depois de somar os itens
function talentTot(tot, kind) {
  talAcc = {};
  for (const id of tal.on) for (const [st, v, c] of TAL[id].fx) {
    if (!talCondOk(c, kind)) continue;
    if (TAL_TOT_PCT.includes(st)) tot[st] += v / 100;
    else if (TAL_TOT_FLAT.includes(st)) tot[st] += v;
    else if (st === 'dmgAdd') { tot.dmgAddMin += v[0]; tot.dmgAddMax += v[1]; }
    else talAcc[st] = (talAcc[st] || 0) + v;
  }
}
// chamado no fim do recalc
function talentPost() {
  const A = talAcc;
  if (A.hpPct) pl.maxHp = Math.round(pl.maxHp * (1 + A.hpPct / 100));
  if (A.defPct) pl.def = Math.round(pl.def * (1 + A.defPct / 100));
  if (A.parry && equip.shield) pl.parry += A.parry;
  if (A.stun) pl.stunCh = (pl.stunCh || 0) + A.stun / 100;
  if (A.kb) pl.kb *= 1 + A.kb / 100;
  pl.tal = { vigCost: A.vigCost || 0, riposte: !!A.riposte, vsStun: A.vsStun || 0, backstab: A.backstab || 0 };
}

const _talHit = hitEnemy;
hitEnemy = function (e, dir, mult = 1, melee = false) {
  const T = pl.tal;
  if (!T || !melee || !e || e.dead) return _talHit(e, dir, mult, melee);
  if (T.vsStun && e.stun > 0) mult *= 1 + T.vsStun / 100;
  if (T.backstab && !e.boss && !(ET[e.type] || {}).boss && e.facing === dir) mult *= 1 + T.backstab / 100;
  const rip = T.riposte && gameTime < (pl.riposteT || 0);
  if (rip) mult *= 2;
  const hp0 = e.hp;
  _talHit(e, dir, mult, melee);
  if (rip && e.hp < hp0) pl.riposteT = 0;
};
const _talHurt = hurtPlayer;
hurtPlayer = function (...a) {
  const r = _talHurt(...a);
  if (r === 'parry' && pl.tal && pl.tal.riposte) pl.riposteT = gameTime + 3;
  return r;
};
const _talVig = spendVigor;
spendVigor = function (parry, boss) {
  const red = pl.tal ? Math.min(60, pl.tal.vigCost) : 0;
  if (!red) return _talVig(parry, boss);
  const cost = (parry ? VIG_PARRY : VIG_BLOCK) * (boss ? VIG_BOSS : 1) * (1 - red / 100);
  if (pl.vig - cost > 0) { pl.vig -= cost; pl.vigT = 0; return false; }
  return _talVig(parry, boss);
};

/* ---- save ---- */
function talLoad(list) {
  tal.on = new Set(['o']);
  if (!Array.isArray(list)) return;
  const want = new Set(list.filter(id => TAL[id])); let grew = true;
  while (grew && talPoints() > 0) {
    grew = false;
    for (const id of want) if (!tal.on.has(id) && TAL[id].nb.some(m => tal.on.has(m)) && talPoints() > 0) { tal.on.add(id); grew = true; }
  }
}
const _talMakeSave = makeSave;
makeSave = function () { const o = _talMakeSave(); o.tal = [...tal.on].filter(id => id !== 'o'); return o; };
const _talNewWorld = newWorld;
newWorld = function (sd, sv) {
  _talNewWorld(sd, sv);
  const hp0 = pl.hp, max0 = pl.maxHp;
  talLoad(sv && sv.tal); recalc();
  const saved = sv && sv.p && +sv.p.hp;
  pl.hp = hp0 >= max0 ? (saved ? clamp(saved, 1, pl.maxHp) : pl.maxHp) : Math.min(hp0, pl.maxHp);
};

/* ---- arte (pixel art pintada uma vez e guardada) ----
   Cada nó: aro de metal (ferro trancado, bronze disponível, ouro ligado) + fundo + ícone da categoria.
   Não ligado: o ícone fica em tons de cinza. Ligado: colorido, fundo na cor da categoria e halo. */
const talHash = (x, y, s = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
const TAL_R = { s: 7.5, n: 11.5, k: 14.5, o: 14.5 };
const TAL_ICPAL = {
  w: '#fff6dc', s: '#c8ccd6', S: '#6a7080', i: '#a8c8f0', I: '#4e6c9c', d: '#3c404c', r: '#d23b3b', R: '#7a1a1a', p: '#ff9a9a', g: '#f2c470', G: '#b07a34',
  b: '#9a6234', B: '#5a3418', y: '#ffe06a', o: '#f08a3c', O: '#a8481c', v: '#b080f0', V: '#5a3a8a', t: '#6ae0d0', T: '#2a7a70',
  e: '#8fe070', E: '#3a7a2a', n: '#e6dcc0', N: '#8a7a5c', c: '#9fdcff'
};
// ícones 9x9 (os notáveis e maiores usam o mesmo ícone em dobro)
const TAL_ICON = {
  dano: ['i.......i', 'wi.....iw', '.wi...iw.', '..wi.iw..', '...wiw...', '..GIdIG..', '.G.....G.', 'r.......r', 'R.......R'],
  espada: ['.......wi', '......wiI', '.....wiI.', '....wiI..', 'G..wiI...', '.GwiI....', '..BG.....', '.B..G....', 'B........'],
  maca: ['..i.i.i..', '.iwiiiii.', 'i.wiiiI.i', '.iiiiIII.', '..iIIII..', '....b....', '....b....', '....B....', '...GgG...'],
  adaga: ['....w....', '...wiI...', '...wiI...', '...wiI...', '...wiI...', '.GgggggG.', '....b....', '....B....', '....g....'],
  escudo: ['IiiiiiiiI', 'IwiiiiiiI', 'IwiGgGiiI', 'IiigygiII', 'IiiGgGiII', '.IiiiiII.', '.IiiiIII.', '..IiIII..', '...III...'],
  vel: ['.........', 'oy..oy..o', '.oy..oy..', '..oy..oy.', '...oy..oy', '..oy..oy.', '.oy..oy..', 'oy..oy..o', '.........'],
  crit: ['....y....', '....o....', '.y..o..y.', '...ooo...', 'yoowwwooy', '...ooo...', '.y..o..y.', '....o....', '....y....'],
  critDmg: ['O..r.r..O', '.rorrror.', 'rroywyorr', '.oywwwyo.', 'rrwwwwwrr', '.oywwwyo.', 'rroywyorr', '.rorrror.', 'O..r.r..O'],
  vida: ['.........', '.rr...rr.', 'rprr.rrrr', 'rprrrrrrr', 'rrrrrrrrR', '.rrrrrrR.', '..rrrrR..', '...rrR...', '....R....'],
  vidaPct: ['......e..', '.rr.rreee', 'rprrrr.e.', 'rprrrrr..', 'rrrrrrR..', '.rrrrrR..', '..rrrR...', '...rR....', '....R....'],
  def: ['..iiiii..', '.iwiiiii.', 'iwiiiiiiI', 'iiiiiIIII', 'id.....dI', 'iiiI.IIII', 'iiiI.IIII', '.iiI.III.', '..iI.II..'],
  aparo: ['y...w...y', '.y..w..y.', '..s.w.s..', '...sws...', 'wwwwywwww', '...sws...', '..s.w.s..', '.G..w..G.', 'G.......G'],
  vigor: ['.....eeE.', '....eeE..', '...eeE...', '..eeeeeE.', '.eeeeeE..', '....eeE..', '...eeE...', '..eE.....', '.E.......'],
  espinhos: ['E...e...E', '.E..e..E.', '..EeeeE..', '.eeEeEee.', 'eeEe.eEee', '.eeEeEee.', '..EeeeE..', '.E..e..E.', 'E...e...E'],
  atordoar: ['.y.....y.', 'yyy...yyy', '.y.....y.', '...vvv...', '..vV.Vv..', '..v.vVv..', '..vV.....', '.y.vvv.y.', 'yyy...yyy'],
  empurrao: ['....G....', '....gG...', '....ggG..', 'GGGGgggG.', 'gggggwggG', 'GGGGgggG.', '....ggG..', '....gG...', '....G....'],
  quebra: ['.nnnvnnn.', 'nnnnvnnnn', 'nnnvnnnnn', 'nBBnvnBBn', 'nBBnnvBBn', 'nnnnBnnnN', '.nnnnnnN.', '.n.n.n.N.', '.........'],
  esquiva: ['..tttt...', '.t....t..', '......Tt.', '..ttt..t.', '.t...t.t.', '.t.t..Tt.', '.t..tTt..', '..t......', '...tttt..'],
  sangue: ['....r....', '....r....', '...rpr...', '..rprrr..', '.rprrrrr.', '.rrrrrrR.', '.rrrrrrR.', '..rrrrR..', '...RRR...'],
  passo: ['..bbb....', '..bbB....', '..bbB....', '..bbB....', '..bbbbb..', '.bbbbbbbB', '.BBBBBBBB', '..N...N..', '.........'],
  apunhalar: ['....w..r.', '...wiI...', '...wiI.r.', '...wiI...', '...wiI..r', '.GgggggG.', '....b..R.', '....B....', '....g....'],
  inicio: ['....g....', '...gyg...', '..gyGyg..', '.gyG.Gyg.', 'gyG.w.Gyg', '.gyG.Gyg.', '..gyGyg..', '...gyg...', '....g....']
};
// a cor de fundo de cada ícone quando ligado (as categorias têm a sua; notáveis usam a do ícone)
const TAL_BG = { escudo: '#1c2230', apunhalar: '#300a10', inicio: '#3a2408' };
for (const k in TAL_CAT) TAL_BG[TAL_CAT[k][2]] = TAL_CAT[k][3];
// cinza do que ainda não foi pego: luminância, levemente fria
function talGray(hex, k) {
  const v = parseInt(hex.slice(1), 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255;
  const l = (0.3 * r + 0.59 * g + 0.11 * b) * k;
  const c = x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(l * 0.96) + c(l * 0.96) + c(l * 1.06);
}
// aros: 0 trancado, 1 disponível, 2 ligado
const TAL_RIM = [
  { hi: '#8e8b9c', mid: '#4c4658', lo: '#2a2530', stud: '#a8a4b4' },
  { hi: '#f2c470', mid: '#b07a34', lo: '#5e3c14', stud: '#fff6dc' },
  { hi: '#fff6dc', mid: '#f2c470', lo: '#b07a34', stud: '#fff6dc' }
];
const talImgs = {};
function talNodeImg(node, st, f) {
  const key = node.t + node.icon + st + f; if (talImgs[key]) return talImgs[key];
  const t = node.t, R = TAL_R[t], N = Math.ceil(R * 2) + 2, c = N / 2, P = TAL_RIM[st];
  const b = mk(N, N), g = b.getContext('2d');
  const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const band = t === 's' ? 2 : 3, inner2 = t === 'k' || t === 'o';
  const inside = (x, y) => Math.hypot(x + 0.5 - c, y + 0.5 - c) <= R;
  const bg = st === 2 ? (TAL_BG[node.icon] || '#2a1a10') : st === 1 ? '#1d1a22' : '#141118';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy);
    if (d > R) { if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) put(x, y, '#060408'); continue; }
    const gr = talHash(x, y, st);
    const rim = d > R - band, rim2 = inner2 && d > R - band - 2.2 && d <= R - band - 1.1;
    if (rim || rim2) {
      const l = d ? (-dx - dy) / (d * 1.414) : 0;
      let col = l > 0.4 ? P.hi : l < -0.35 ? P.lo : P.mid;
      if (gr < 0.12) col = col === P.hi ? P.mid : P.lo;
      put(x, y, col);
    } else {
      // fundo com granulado e uma sombra por dentro do aro
      const k = d / (R - band), dark = k > 0.82 || (dx + dy > 0 && k > 0.6);
      let col = bg; if (gr < 0.2) col = talShade(bg, 1.25); if (dark) col = talShade(bg, 0.7);
      put(x, y, col);
    }
  }
  // tachas no aro dos notáveis e dos maiores
  if (t !== 's') { const n = t === 'n' ? 4 : 8; for (let i = 0; i < n; i++) { const a = Math.PI / 4 + i * Math.PI * 2 / n, r = R - 1.5; put(Math.floor(c + Math.cos(a) * r), Math.floor(c + Math.sin(a) * r), P.stud); } }
  // ícone: 1x nos pequenos, 2x nos outros; cinza enquanto não é pego
  const rows = TAL_ICON[node.icon];
  if (rows) {
    const sc = t === 's' ? 1 : 2, w = 9 * sc, ox = Math.round(c - w / 2), oy = Math.round(c - w / 2);
    const colOf = ch => { const h = TAL_ICPAL[ch]; return !h ? null : st === 2 ? h : talGray(h, st === 1 ? 0.72 : 0.42); };
    // sombra de 1 px para o ícone saltar do fundo
    g.fillStyle = 'rgba(0,0,0,.55)';
    rows.forEach((r, y) => { for (let x = 0; x < 9; x++) if (TAL_ICPAL[r[x]]) g.fillRect(ox + x * sc + 1, oy + y * sc + 1, sc, sc); });
    rows.forEach((r, y) => { for (let x = 0; x < 9; x++) { const col = colOf(r[x]); if (!col) continue; g.fillStyle = col; g.fillRect(ox + x * sc, oy + y * sc, sc, sc); } });
    if (sc === 2) rows.forEach((r, y) => { for (let x = 0; x < 9; x++) if (TAL_ICPAL[r[x]] && talHash(x, y, 4) < 0.3) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ox + x * 2 + 1, oy + y * 2 + 1, 1, 1); } });
  }
  const o = mk(N * f, N * f), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(b, 0, 0, N * f, N * f);
  return (talImgs[key] = { img: o, n: N * f });
}
function talShade(hex, k) {
  const v = parseInt(hex.slice(1), 16), c = x => clamp(Math.round(x * k), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(v >> 16 & 255) + c(v >> 8 & 255) + c(v & 255);
}
// halo dos nós ligados: anel pontilhado na cor da categoria
const talHalo = {};
function talHaloImg(node, f) {
  const col = TAL_ICPAL[talMainColor(node.icon)] || '#f0a83c', key = node.t + col + f; if (talHalo[key]) return talHalo[key];
  const R = TAL_R[node.t] + 5, N = Math.ceil(R * 2) + 2, c = N / 2, b = mk(N, N), g = b.getContext('2d');
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c), k = 1 - Math.abs(d - (R - 3.5)) / 3.5;
    if (k <= 0) continue;
    if (k * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 2) { g.fillStyle = k > 0.7 ? col : talShade(col, 0.5); g.fillRect(x, y, 1, 1); }
  }
  const o = mk(N * f, N * f), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(b, 0, 0, N * f, N * f);
  return (talHalo[key] = { img: o, n: N * f });
}
// a cor que mais aparece num ícone (para o halo)
const talMainCache = {};
function talMainColor(icon) {
  if (icon in talMainCache) return talMainCache[icon];
  const n = {}; for (const r of TAL_ICON[icon] || []) for (const ch of r) if (TAL_ICPAL[ch] && !'wSIdBNRV'.includes(ch)) n[ch] = (n[ch] || 0) + 1;
  let best = 'g', m = 0; for (const k in n) if (n[k] > m) { m = n[k]; best = k; }
  return (talMainCache[icon] = best);
}
// pedra escura do fundo, emendável (64x64)
let talStone = null;
function talStoneImg() {
  if (talStone) return talStone;
  const N = 64, b = mk(N, N), g = b.getContext('2d'), TAU = Math.PI * 2;
  const COL = ['#0c0a0f', '#0f0d13', '#121017', '#15121a', '#19151f'];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N * TAU, v = y / N * TAU;
    const s = Math.sin(u * 2 + Math.cos(v * 3)) * 0.5 + Math.sin(v * 2 + u) * 0.35 + Math.cos(u * 5 - v * 4) * 0.2;
    let k = Math.floor((s + 1.1) / 2.2 * 4 + talHash(x, y, 9) * 1.3); k = clamp(k, 0, 4);
    g.fillStyle = COL[k]; g.fillRect(x, y, 1, 1);
    if (talHash(x, y, 3) < 0.012) { g.fillStyle = '#231e2a'; g.fillRect(x, y, 1, 1); }
  }
  return (talStone = b);
}

/* ---- tela ---- */
const talEl = document.createElement('div'); talEl.id = 'tal'; talEl.hidden = true;
talEl.innerHTML = `<canvas id="talCv"></canvas>
  <div id="talTop" class="panel"><b>Talentos</b><span><i id="talPts">0</i> pontos</span></div>
  <button class="ghost x" id="talClose" type="button" aria-label="Fechar">×</button>
  <div id="talTip" class="tipbox" hidden></div>`;
document.body.appendChild(talEl);
const talCv = talEl.querySelector('#talCv'), talCg = talCv.getContext('2d'), talTip = talEl.querySelector('#talTip');
const talLow = mk(16, 16), talLg = talLow.getContext('2d');
const tv = { x: 0, y: 0, z: 1.5, zt: 1.5, ax: 0, ay: 0, lw: 0, lh: 0, px: 4, hover: null, path: [], drag: null, parts: [], t: 0, last: 0, raf: 0, shake: null };

function talZMin() { return Math.max(0.12, Math.min(tv.lw, tv.lh) / 1900); }
const TAL_ZMAX = 2.8;
function talF(z) { return z < 1.3 ? 1 : z < 2.3 ? 2 : 3; }
function talToLow(cx, cy) { return [cx * dpr / tv.px, cy * dpr / tv.px]; }
function talScr(n) { return [(n.x - tv.x) * tv.z + tv.lw / 2, (n.y - tv.y) * tv.z + tv.lh / 2]; }
function talWorld(lx, ly) { return [(lx - tv.lw / 2) / tv.z + tv.x, (ly - tv.lh / 2) / tv.z + tv.y]; }

function talState(n) { return tal.on.has(n.id) ? 2 : n.nb.some(m => tal.on.has(m)) ? 1 : 0; }
// caminho mais curto dos nós ligados até `id`, só por nós ainda não ligados
function talPathTo(id) {
  if (tal.on.has(id)) return [];
  const prev = {}, q = []; for (const a of tal.on) { prev[a] = null; q.push(a); }
  while (q.length) {
    const a = q.shift(); if (a === id) break;
    for (const b of TAL[a].nb) if (!(b in prev)) { prev[b] = a; q.push(b); }
  }
  const out = []; for (let a = id; a && !tal.on.has(a); a = prev[a]) out.unshift(a);
  return out;
}
function talCanRemove(id) {
  if (id === 'o' || !tal.on.has(id)) return false;
  const seen = new Set(['o']), q = ['o'];
  while (q.length) { const a = q.shift(); for (const b of TAL[a].nb) if (b !== id && tal.on.has(b) && !seen.has(b)) { seen.add(b); q.push(b); } }
  return seen.size === tal.on.size - 1;
}
function talChanged() { recalc(); hudCache.hb = null; $('talPts').textContent = String(Math.max(0, talPoints())); talEl.classList.toggle('nopts', talPoints() <= 0); saveGame(); }
function talBurst(n, k, col) {
  for (let i = 0; i < k; i++) { const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 70; tv.parts.push({ x: n.x, y: n.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t: 0, life: 0.5 + Math.random() * 0.6, col: col[i % col.length] }); }
}
function talAllocate(id) {
  const path = talPathTo(id);
  if (!path.length) return;
  if (path.length > talPoints()) { tv.shake = { id, t: 0.3 }; tone(110, 0.12, 'square', 0.06, -30); return; }
  path.forEach((p, i) => { tal.on.add(p); talBurst(TAL[p], TAL[p].t === 's' ? 14 : 30, [TAL_ICPAL[talMainColor(TAL[p].icon)] || '#ffd27a', '#ffd27a', '#fff1b8']); });
  const big = path.some(p => TAL[p].t !== 's');
  tone(392, 0.18, 'triangle', 0.08); tone(587, 0.26, 'triangle', 0.06, 0, 0.05); if (big) tone(784, 0.4, 'sine', 0.06, 0, 0.12);
  noise(0.18, 0.08, 1800, 'bandpass', 0, 0.8);
  talChanged(); talHover();
}
function talRefund(id) {
  if (!talCanRemove(id)) { tone(110, 0.12, 'square', 0.06, -30); return; }
  tal.on.delete(id); talBurst(TAL[id], 10, ['#7a4a14', '#4c4658']);
  tone(330, 0.16, 'triangle', 0.06, -120); noise(0.12, 0.08, 600, 'lowpass');
  talChanged(); talHover();
}

/* tooltip */
const talNum = v => String(Math.round(v * 100) / 100).replace('.', ',');
function talFxLine([st, v, c]) {
  let s = TAL_TXT[st];
  if (st === 'dmgAdd') s = v[0] ? s.replace('X', v[0]).replace('Y', v[1]) : `+${v[1]} de dano máximo`;
  else s = s.replace('X', talNum(v));
  return c ? `${s} ${TAL_COND[c]}` : s;
}
const TAL_KIND = { o: 'Início', s: 'Talento', n: 'Talento notável', k: 'Talento maior' };
const TAL_NCOL = { o: '#f0a83c', s: '#efe2c4', n: '#ffd27a', k: '#ffb070' };
function talShowTip(n, cx, cy) {
  if (!n) { talTip.hidden = true; talTip.dataset.id = ''; return; }
  if (talTip.dataset.id !== n.id + tal.on.has(n.id)) {
    talTip.dataset.id = n.id + tal.on.has(n.id);
    talTip.innerHTML = `<div class="tn" style="color:${TAL_NCOL[n.t]}">${n.name}</div><small>${TAL_KIND[n.t]}</small>` +
      (n.fx.length ? `<ul class="talfx">${n.fx.map(f => `<li>${talFxLine(f)}</li>`).join('')}</ul>` : '');
  }
  talTip.hidden = false;
  const r = talTip.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  let x = cx + 22, y = cy + 18; if (x + r.width > W - 8) x = cx - r.width - 18; if (y + r.height > H - 8) y = H - 8 - r.height;
  talTip.style.left = Math.max(8, x) + 'px'; talTip.style.top = Math.max(8, y) + 'px';
}
let talMouse = { x: -1, y: -1 };
function talPick(cx, cy) {
  const [lx, ly] = talToLow(cx, cy), f = talF(tv.z);
  let best = null, bd = 1e9;
  for (const n of TAL_LIST) { const [sx, sy] = talScr(n), d = Math.hypot(sx - lx, sy - ly), r = (TAL_R[n.t] + 1.5) * f; if (d < r && d < bd) { bd = d; best = n; } }
  return best;
}
function talHover() {
  const n = tv.drag && tv.drag.moved ? null : talPick(talMouse.x, talMouse.y);
  tv.hover = n; tv.path = n ? talPathTo(n.id) : [];
  talShowTip(n, talMouse.x, talMouse.y);
  if (n || (tv.drag && tv.drag.moved)) talCv.dataset.click = ''; else delete talCv.dataset.click;
}

talCv.addEventListener('pointerdown', e => {
  initAudio();
  if (e.button === 0) { tv.drag = { sx: e.clientX, sy: e.clientY, x: tv.x, y: tv.y, moved: false }; talCv.setPointerCapture(e.pointerId); }
  else if (e.button === 2) { const n = talPick(e.clientX, e.clientY); if (n) talRefund(n.id); }
  e.preventDefault();
});
talCv.addEventListener('pointermove', e => {
  talMouse = { x: e.clientX, y: e.clientY };
  const d = tv.drag;
  if (d) {
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true;
    if (d.moved) { const k = dpr / tv.px / tv.z; tv.x = d.x - dx * k; tv.y = d.y - dy * k; talClampCam(); tv.zt = tv.z; }
  }
  talHover();
});
talCv.addEventListener('pointerup', e => {
  const d = tv.drag; tv.drag = null;
  if (e.button === 0 && d && !d.moved) { const n = talPick(e.clientX, e.clientY); if (n) talAllocate(n.id); }
  talHover();
});
talCv.addEventListener('pointerleave', () => { if (!tv.drag) { tv.hover = null; tv.path = []; talShowTip(null); } });
talCv.addEventListener('contextmenu', e => e.preventDefault());
talCv.addEventListener('wheel', e => {
  e.preventDefault();
  const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
  const k = Math.pow(1.0012, -clamp(d, -240, 240));
  tv.zt = clamp(tv.zt * k, talZMin(), TAL_ZMAX);
  const [lx, ly] = talToLow(e.clientX, e.clientY); tv.ax = lx; tv.ay = ly;
  [tv.wx, tv.wy] = talWorld(lx, ly);
}, { passive: false });
function talClampCam() { const L = 820; const d = Math.hypot(tv.x, tv.y); if (d > L) { tv.x *= L / d; tv.y *= L / d; } }
talEl.querySelector('#talClose').addEventListener('click', closeTalents);

function openTalents() {
  if (state !== 'play' || pl.dead) return;
  state = 'talents';
  for (const k in keys) keys[k] = false; mouse.l = mouse.r = false;
  talResize();
  tv.x = 0; tv.y = 0; tv.z = tv.zt = Math.min(TAL_ZMAX, Math.max(talZMin(), 1.5)); tv.wx = null; tv.parts.length = 0; tv.drag = null;
  $('talPts').textContent = String(Math.max(0, talPoints())); talEl.classList.toggle('nopts', talPoints() <= 0);
  talEl.hidden = false; document.body.classList.add('tal-open');
  noise(0.3, 0.08, 900, 'bandpass', 0, 0.7); tone(196, 0.3, 'triangle', 0.05, 60);
  tv.last = performance.now(); cancelAnimationFrame(tv.raf); tv.raf = requestAnimationFrame(talFrame);
}
function closeTalents() {
  if (state !== 'talents') return;
  talEl.hidden = true; document.body.classList.remove('tal-open'); talShowTip(null); cancelAnimationFrame(tv.raf);
  state = 'play'; last = performance.now(); saveGame();
}
// P abre e fecha; Esc fecha. Pega a tecla antes do 08-estado-entrada (que usava P para pausar)
addEventListener('keydown', e => {
  if (e.repeat) { if (state === 'talents' && (e.code === 'KeyP' || e.code === 'Escape')) e.stopImmediatePropagation(); return; }
  if (state === 'talents' && (e.code === 'KeyP' || e.code === 'Escape')) { e.preventDefault(); e.stopImmediatePropagation(); closeTalents(); return; }
  if (state === 'talents' && e.code === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (e.code === 'KeyP' && state === 'play' && !(typeof held !== 'undefined' && held)) { e.preventDefault(); e.stopImmediatePropagation(); openTalents(); }
}, true);

function talResize() {
  const w = Math.max(1, Math.floor(innerWidth * dpr)), h = Math.max(1, Math.floor(innerHeight * dpr));
  if (talCv.width !== w || talCv.height !== h) { talCv.width = w; talCv.height = h; }
  tv.px = Math.max(2, Math.round(S / 2)); const lw = Math.ceil(w / tv.px), lh = Math.ceil(h / tv.px);
  if (talLow.width !== lw || talLow.height !== lh) { talLow.width = lw; talLow.height = lh; }
  tv.lw = lw; tv.lh = lh;
}

/* ---- desenho ---- */
function talLine(g, x0, y0, x1, y1, t, col, cull) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)) | 0 || 1, h = t >> 1;
  g.fillStyle = col;
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + dx * i / n) - h, y = Math.round(y0 + dy * i / n) - h; if (x < -t || y < -t || x > cull[0] || y > cull[1]) continue; g.fillRect(x, y, t, t); }
}
function talFrame(now) {
  tv.raf = requestAnimationFrame(talFrame);
  const dt = Math.min(0.05, (now - tv.last) / 1000); tv.last = now; tv.t += dt;
  talResize();
  // zoom suave, preso ao ponto sob o mouse
  tv.zt = clamp(tv.zt, talZMin(), TAL_ZMAX);
  if (Math.abs(tv.zt - tv.z) > 0.0005) {
    tv.z += (tv.zt - tv.z) * Math.min(1, dt * 14);
    if (tv.wx != null) { tv.x = tv.wx - (tv.ax - tv.lw / 2) / tv.z; tv.y = tv.wy - (tv.ay - tv.lh / 2) / tv.z; talClampCam(); }
    talHover();
  } else tv.z = tv.zt;
  const g = talLg, W = tv.lw, H = tv.lh, z = tv.z, f = talF(z), cull = [W, H];
  g.imageSmoothingEnabled = false;
  // fundo: pedra com leve paralaxe
  g.setTransform(1, 0, 0, 1, 0, 0);
  const pat = g.createPattern(talStoneImg(), 'repeat');
  const ox = Math.round(-tv.x * z * 0.35) % 64, oy = Math.round(-tv.y * z * 0.35) % 64;
  g.save(); g.translate(ox, oy); g.fillStyle = pat; g.fillRect(-ox - 64, -oy - 64, W + 128, H + 128); g.restore();
  // anéis gravados na pedra
  const [cx, cy] = talScr({ x: 0, y: 0 });
  for (const [r, col] of [[150, '#1f1a26'], [270, '#211b28'], [500, '#1f1a26'], [710, '#241d2b'], [790, '#1a1620']]) {
    const R = r * z, steps = Math.max(24, Math.floor(R * Math.PI * 2 / 5));
    g.fillStyle = col;
    for (let i = 0; i < steps; i++) { const a = i / steps * Math.PI * 2, x = Math.round(cx + Math.cos(a) * R), y = Math.round(cy + Math.sin(a) * R); if (x >= 0 && y >= 0 && x < W && y < H) g.fillRect(x, y, 1, 1); }
  }
  // ligações
  const hov = new Set(tv.path), lineT = f + 1;
  const pts = talPoints();
  const pathOk = tv.path.length && tv.path.length <= pts;
  for (const [a, b] of TAL_EDGES) {
    const [x0, y0] = talScr(a), [x1, y1] = talScr(b);
    if (Math.max(x0, x1) < -10 || Math.min(x0, x1) > W + 10 || Math.max(y0, y1) < -10 || Math.min(y0, y1) > H + 10) continue;
    const ia = tal.on.has(a.id), ib = tal.on.has(b.id);
    const inPath = (hov.has(a.id) || ia) && (hov.has(b.id) || ib) && (hov.has(a.id) || hov.has(b.id));
    const t = lineT + (ia && ib ? 1 : 0);
    talLine(g, x0, y0 + 1, x1, y1 + 1, t, '#050407', cull);
    if (ia && ib) {
      talLine(g, x0, y0, x1, y1, t + 2, '#4a2a0c', cull);
      talLine(g, x0, y0, x1, y1, t, '#f0a83c', cull);
      // brilho correndo pelo fio
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), k = ((tv.t * 40) % 14);
      g.fillStyle = '#fff1b8';
      for (let s = k; s < n; s += 14) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); g.fillRect(x - (t >> 1), y - (t >> 1), t, t); }
    } else if (inPath) talLine(g, x0, y0, x1, y1, t, pathOk ? '#e8d6a8' : '#8a4040', cull);
    else if (ia || ib) talLine(g, x0, y0, x1, y1, t, '#6e4f2a', cull);
    else talLine(g, x0, y0, x1, y1, t, '#2e2636', cull);
  }
  // nós
  const pulse = 0.55 + 0.45 * Math.sin(tv.t * 3);
  for (const n of TAL_LIST) {
    let [sx, sy] = talScr(n);
    const R = (TAL_R[n.t] + 6) * f; if (sx < -R || sy < -R || sx > W + R || sy > H + R) continue;
    if (tv.shake && tv.shake.id === n.id) sx += Math.round(Math.sin(tv.shake.t * 60) * 2);
    const st = talState(n);
    if (st === 2) { const h = talHaloImg(n, f); g.globalAlpha = 0.45 + 0.35 * pulse; g.drawImage(h.img, Math.round(sx - h.n / 2), Math.round(sy - h.n / 2)); g.globalAlpha = 1; }
    else if (st === 1 && pts > 0) { const h = talHaloImg(n, f); g.globalAlpha = 0.12 + 0.14 * pulse; g.drawImage(h.img, Math.round(sx - h.n / 2), Math.round(sy - h.n / 2)); g.globalAlpha = 1; }
    const im = talNodeImg(n, st, f);
    g.drawImage(im.img, Math.round(sx - im.n / 2), Math.round(sy - im.n / 2));
    // nó sob o mouse ou no caminho
    if (tv.hover === n || hov.has(n.id)) {
      const r = Math.round((TAL_R[n.t] + 2.5) * f), col = tv.hover === n ? '#fff6dc' : pathOk ? '#e8d6a8' : '#8a4040';
      g.fillStyle = col;
      const steps = Math.max(16, Math.floor(r * 4));
      for (let i = 0; i < steps; i++) { if ((i + (tv.t * 12 | 0)) % 4 === 0) continue; const a = i / steps * Math.PI * 2; g.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), 1, 1); }
    }
  }
  if (tv.shake && (tv.shake.t += dt) > 0.3) tv.shake = null;
  // brasas
  if (Math.random() < dt * 6) {
    const lit = TAL_LIST.filter(n => tal.on.has(n.id)); const n = lit[(Math.random() * lit.length) | 0];
    if (n) tv.parts.push({ x: n.x + (Math.random() - 0.5) * 14, y: n.y, vx: (Math.random() - 0.5) * 8, vy: -14 - Math.random() * 16, t: 0, life: 1.2 + Math.random(), col: Math.random() < 0.5 ? '#f0a83c' : '#ffd27a' });
  }
  for (let i = tv.parts.length - 1; i >= 0; i--) {
    const p = tv.parts[i]; p.t += dt; if (p.t >= p.life) { tv.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 1.5;
    const [sx, sy] = talScr(p); g.globalAlpha = 1 - p.t / p.life; g.fillStyle = p.col; g.fillRect(Math.round(sx), Math.round(sy), f > 2 ? 2 : 1, f > 2 ? 2 : 1);
  }
  g.globalAlpha = 1;
  // vinheta pontilhada
  talVignette(g, W, H);
  // para a tela
  talCg.imageSmoothingEnabled = false;
  talCg.drawImage(talLow, 0, 0, W * tv.px, H * tv.px);
}
let talVig = null;
function talVignette(g, W, H) {
  if (!talVig || talVig.width !== W || talVig.height !== H) {
    talVig = mk(W, H); const v = talVig.getContext('2d'), BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const cx = W / 2, cy = H / 2, M = Math.hypot(cx, cy);
    v.fillStyle = '#030205';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - cx) * 0.9, (y - cy) * 1.25) / M, k = clamp((d - 0.42) / 0.55, 0, 1);
      if (k * k * 17 > BAYER[(y & 3) * 4 + (x & 3)] + 1) v.fillRect(x, y, 1, 1);
    }
  }
  g.drawImage(talVig, 0, 0);
}
