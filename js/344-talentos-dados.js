'use strict';

/* ================= talentos: os dados da árvore grande do herói (a tela e as regras ficam em js/345-talentos.js) =================
   Pedido do Jonathan (2026-10-12): a árvore antiga (js/51) foi apagada e no lugar dela entra uma árvore enorme, no
   espírito da do Path of Exile, com a cara do tabuleiro de runas da Aurélia. Sem classes: a árvore tem todos os
   arquétipos do jogo, cada um numa região com uma arte no fundo (raio, fogo, gelo, vida...).
   - Tudo é porcentagem. Dano: "+X% de dano de fogo" multiplica o golpe por (1 + soma das porcentagens que valem nele).
     Vida, mana, defesa, crítico, aparo: X% a mais sobre o valor que o herói já tem (base + equipamento).
     Esquiva, roubo de vida, espinhos e resistências já são porcentagens: somam pontos percentuais.
   - Tipos de nó: pequeno (um efeito), notável (dois ou três efeitos, maior e com nome) e keystone (efeito enorme, quase
     sempre com um preço). O nó do centro é o começo.
   - Doze regiões em volta do centro, cada uma igual por dentro: entrada (2), três galhos (meio, esquerda, direita) que
     terminam num notável, e do notável do meio sai o caminho da keystone. Pontes ligam as entradas vizinhas (perto do
     centro) e os notáveis de fora de regiões vizinhas (longe do centro).
   - x, y em unidades da arte (1 unidade = 1 pixel da arte); o centro é 0,0.
   A wiki carrega este arquivo (página Talentos). */

// o que cada efeito diz (X = valor)
const ARV_TXT = {
  dmgAll: '+X% de dano', dmgFis: '+X% de dano físico', dmgMelee: '+X% de dano corpo a corpo', dmgSpell: '+X% de dano de feitiços',
  dmgFogo: '+X% de dano de fogo', dmgGelo: '+X% de dano de gelo', dmgRaio: '+X% de dano de raio',
  atkSpd: '+X% de velocidade de ataque', castSpd: '+X% de velocidade de recarga dos feitiços', crit: '+X% de chance de crítico', critDmg: '+X% de dano crítico',
  spd: '+X% de velocidade de movimento', dodge: '+X% de esquiva', lifeSteal: 'X% do dano corpo a corpo vira vida', stun: '+X% de chance de atordoar com golpes',
  thorns: 'Devolve X% do dano recebido de perto', parry: '+X% de janela de aparo', vigCost: 'Bloquear e aparar custam X% menos vigor',
  defPct: '+X% de defesa', resFogo: '+X% de resistência a fogo', resFrio: '+X% de resistência a frio', resAll: '+X% de resistência a fogo, frio e veneno',
  lessTaken: 'Recebe X% menos dano', hpPct: '+X% de vida máxima', regen: 'Regenera X% da vida máxima por segundo', potion: 'Poções curam X% a mais',
  manaPct: '+X% de mana máxima', manaRegen: '+X% de regeneração de mana', manaKill: 'Recupera X% da mana máxima ao matar',
  noCrit: 'Seus golpes nunca são críticos', mom: 'X% do dano recebido sai da mana antes da vida', parryHeal: 'Aparar cura X% da vida máxima'
};
// o nome de um nó pequeno, pelo efeito dele
const ARV_NOME = {
  dmgAll: 'Dano', dmgFis: 'Dano físico', dmgMelee: 'Dano corpo a corpo', dmgSpell: 'Dano de feitiços', dmgFogo: 'Dano de fogo', dmgGelo: 'Dano de gelo',
  dmgRaio: 'Dano de raio', atkSpd: 'Velocidade de ataque', castSpd: 'Recarga dos feitiços', crit: 'Chance de crítico', critDmg: 'Dano crítico',
  spd: 'Velocidade de movimento', dodge: 'Esquiva', lifeSteal: 'Roubo de vida', stun: 'Atordoar', thorns: 'Espinhos', parry: 'Aparo', vigCost: 'Vigor',
  defPct: 'Defesa', resFogo: 'Resistência a fogo', resFrio: 'Resistência a frio', resAll: 'Resistências', hpPct: 'Vida', regen: 'Regeneração',
  potion: 'Poções', manaPct: 'Mana', manaRegen: 'Regeneração de mana', manaKill: 'Mana ao matar'
};
// efeitos que só ligam (sem número)
const ARV_FLAG = { noCrit: 1 };

// máscaras 11x11 (W claro, Y, O, R escuro), pintadas nas cores da região, como os ícones das runas
const ARV_ICON = {
  dmgAll: ['W.........W', '.WY.....YW.', '..WY...YW..', '...WY.YW...', '....WYW....', '....YWY....', '...OY.YO...', '..RO...OR..', '.OR.....RO.', 'R.........R', '...........'],
  dmgSpell: ['...........', '....WWW....', '...W...W...', '..W.YYY.W..', '.W.Y.O.Y.W.', '.W.YOWOY.W.', '.W.Y.O.Y.W.', '..W.YYY.W..', '...W...W...', '....WWW....', '...........'],
  dmgRaio: ['......WW...', '.....WY....', '....WY.....', '...WY......', '..WWWWYY...', '....OYW....', '...OYW.....', '..OYW......', '.ROW.......', '.RO........', '.R.........'],
  dmgFogo: ['.....W.....', '....WY.....', '....YO..W..', '...YOO.WY..', '..YOOOYYO..', '..YOWWOOO..', '.YOWWWWOOR.', '.YOWWWWWOR.', '.OOWWWWOOR.', '..ROOOOORR.', '...RRRRR...'],
  dmgGelo: ['.....W.....', '..O..Y..O..', '...Y.W.Y...', '....YWY....', '..O.YWY.O..', 'WYWWWWWWWYW', '..O.YWY.O..', '....YWY....', '...Y.W.Y...', '..O..Y..O..', '.....W.....'],
  dmgMelee: ['..........W', '.........WY', '........WY.', '.......WY..', '......WY...', '.....WY....', '..O.WY.....', '...OY......', '..ROO......', '.RR..O.....', 'RR.........'],
  dmgFis: ['...........', '.WWWWWWW...', '.WYYYYYYO..', '.WYYYYYYO..', '.OOOOOOOR..', '....OR.....', '....OR.....', '....OR.....', '....OR.....', '...RRRR....', '...........'],
  atkSpd: ['...........', '.W...W.....', '..W...W....', '...Y...Y...', '....Y...Y..', '.....O...O.', '....Y...Y..', '...Y...Y...', '..W...W....', '.R...R.....', '...........'],
  castSpd: ['.WWWWWWWWW.', '..WYYYYYO..', '...WYYYO...', '....WYO....', '.....W.....', '.....Y.....', '....O.O....', '...O.Y.O...', '..OYYYYYO..', '.RRRRRRRRR.', '...........'],
  crit: ['....WWW....', '..WW.Y.WW..', '.W...Y...W.', '.W..OOO..W.', 'W..O...O..W', 'WYYO.W.OYYW', 'W..O...O..W', '.W..OOO..W.', '.W...Y...W.', '..WW.Y.WW..', '....WWW....'],
  critDmg: ['R....W....R', '.O..WYW..O.', '..OYWWWYO..', '..YWW.WWY..', '.WWW...WWW.', 'WYW.....WYW', '.WWW...WWW.', '..YWW.WWY..', '..OYWWWYO..', '.O..WYW..O.', 'R....W....R'],
  spd: ['...........', '..WWW......', '..WYO......', '..WYO..Y...', '..WYO.YO...', '..WYOYO....', '..WYYYYYY..', '.WYYYYYYYO.', '.OOOOOOOOR.', '..R....R...', '...........'],
  dodge: ['...........', '..WWWWW....', '.......W...', '..YYYY..W..', '......Y.W..', '.OOO..Y.W..', '...O.Y..W..', '....Y..W...', '..RR..W....', '...WWW.....', '...........'],
  lifeSteal: ['.....W.....', '.....Y.....', '....YWY....', '....YWO....', '...YWWOO...', '..YWWOOOO..', '..YWOOOOR..', '..YOOOOOR..', '...OOOORR..', '....RRRR...', '...........'],
  stun: ['.W.......W.', 'WYW.....WYW', '.W.......W.', '....OOO....', '...O...O...', '...O.Y.O...', '...O..YO...', '....OOY....', '.W.......W.', 'WYW.....WYW', '.W.......W.'],
  thorns: ['...........', '..W.....W..', '...Y...Y...', 'W..OOOOO..W', '.YOO...OOY.', '..O..W..O..', '.YOO...OOY.', 'W..OOOOO..W', '...Y...Y...', '..W.....W..', '...........'],
  parry: ['W.........W', '.Y.WWWWW.Y.', '..WYYYYYW..', '..WYYWYYO..', '..WYWWWYO..', '..WYYWYYO..', '..OYYYYYO..', '...OYYYO...', '....OYO....', '.....R.....', '...........'],
  vigCost: ['...........', '...OOOOO...', '..O....WO..', '.O....WY.O.', '.O...WY..O.', '.O..WWWW.O.', '.O...YW..O.', '.O..YW...O.', '..OYW...O..', '...OOOOO...', '...........'],
  defPct: ['...WWWWW...', '..WYYYYYO..', '.WYYYYYYYO.', '.WYYYYYYYO.', '.WY.....YO.', '.WYYY.YYYO.', '.WYYY.YYYO.', '.WYYY.YYYO.', '..OYY.YYO..', '...OO.OO...', '...........'],
  resAll: ['....WWW....', '..WW...WW..', '.W..YYY..W.', '.W.Y...Y.W.', 'W.Y.O.O.Y.W', 'W.Y..O..Y.W', 'W.Y.O.O.Y.W', '.W.Y...Y.W.', '.W..YYY..W.', '..RR...RR..', '....RRR....'],
  hpPct: ['...........', '.WWW...WWW.', 'WYYYW.WYYYO', 'WYWYYWYYYYO', 'WYYYYYYYYYO', '.OYYYYYYYO.', '..OYYYYYO..', '...OYYYO...', '....OYO....', '.....R.....', '...........'],
  regen: ['.......W...', '......WWW..', '.WW.WW.W...', 'WYYWYYO....', 'WYYYYYO....', 'WYYYYYO....', '.OYYYO.....', '..OYO......', '...R.......', '...........', '...........'],
  potion: ['....WWW....', '....OYO....', '....OYO....', '...OYYYO...', '..OYWYYYO..', '.OYWWYYYYO.', '.OYWYYYYYO.', '.OYYYYYYYO.', '.ROYYYYYOR.', '..RRRRRRR..', '...........'],
  manaPct: ['....WWW....', '..WWYY.....', '.WYY.......', '.WY........', 'WYO........', 'WYO........', 'WYO........', '.OY.......R', '.OOY.....R.', '..ROOOOORR.', '....RRR....'],
  manaRegen: ['.....W.....', '....WY.....', '...WYYO....', '...WYYO....', '....OO..W..', '.......WYO.', '..W....WYO.', '.WYO....R..', '.WYO.......', '..R........', '...........'],
  manaKill: ['....W......', '...WY......', '...WYO.....', '..WYYOO....', '..WYWYO....', '.WYWWYOO...', '.YWWWYYO...', '.OYWYYOR...', '..OOOORR...', '...RRR.....', '...........'],
  inicio: ['.....W.....', '....WYW....', '...WY.YW...', '..WY.O.YW..', '.WY.OWO.YW.', 'WY.OWWWO.YW', '.WY.OWO.YW.', '..WY.O.YW..', '...WY.YW...', '....WYW....', '.....W.....']
};
// ícone de cada efeito (os que não têm máscara própria pegam emprestada)
const ARV_STAT_IC = { resFogo: 'resAll', resFrio: 'resAll', lessTaken: 'defPct', noCrit: 'dmgFis', mom: 'manaPct', parryHeal: 'parry' };
const arvIcon = st => ARV_ICON[st] ? st : ARV_STAT_IC[st] || 'dmgAll';

/* ---- as regiões ----
   cor: W Y O R (claro ao escuro). P: efeito dos nós pequenos da entrada e do caminho do meio; A: galho da esquerda;
   B: galho da direita. L, M, R: notáveis [nome, efeitos]. K: keystone [nome, efeitos]. A ordem é a volta no relógio,
   começando em cima. */
const ARV_REG = [
  { k: 'arcano', name: 'Arcano', col: { W: '#f6f0ff', Y: '#d2b8ff', O: '#9a6ade', R: '#6e3cb4' },
    P: [['dmgSpell', 8]], A: [['manaPct', 6]], B: [['castSpd', 5]],
    L: ['Sabedoria Antiga', [['dmgSpell', 15], ['manaPct', 10]]], M: ['Fluxo Arcano', [['dmgSpell', 20], ['castSpd', 10]]], R: ['Mente Afiada', [['castSpd', 15], ['manaRegen', 20]]],
    K: ['Eco Arcano', [['dmgSpell', 40], ['castSpd', 20], ['dmgMelee', -30]]] },
  { k: 'raio', name: 'Raio', col: { W: '#ffffff', Y: '#bfe6ff', O: '#5aa8ff', R: '#2f5fd0' },
    P: [['dmgRaio', 10]], A: [['castSpd', 4]], B: [['dmgSpell', 5]],
    L: ['Condutor', [['dmgRaio', 20], ['castSpd', 8]]], M: ['Fúria do Trovão', [['dmgRaio', 30]]], R: ['Céu Carregado', [['dmgRaio', 15], ['dmgSpell', 10]]],
    K: ['Tempestade Viva', [['dmgRaio', 60], ['castSpd', 10], ['hpPct', -15]]] },
  { k: 'fogo', name: 'Fogo', col: { W: '#fff6dc', Y: '#ffd27a', O: '#f08a3c', R: '#a8481c' },
    P: [['dmgFogo', 10]], A: [['resFogo', 6]], B: [['dmgSpell', 5]],
    L: ['Brasa Viva', [['dmgFogo', 20], ['resFogo', 15]]], M: ['Inferno', [['dmgFogo', 30]]], R: ['Fornalha', [['dmgFogo', 15], ['dmgSpell', 10]]],
    K: ['Pira Eterna', [['dmgFogo', 60], ['resFogo', 25], ['resFrio', -25]]] },
  { k: 'gelo', name: 'Gelo', col: { W: '#ffffff', Y: '#d8f4ff', O: '#8fd8f4', R: '#3a8ab4' },
    P: [['dmgGelo', 10]], A: [['resFrio', 6]], B: [['castSpd', 4]],
    L: ['Pele de Geada', [['resFrio', 20], ['dmgGelo', 15]]], M: ['Inverno Eterno', [['dmgGelo', 30]]], R: ['Frio Cortante', [['dmgGelo', 15], ['castSpd', 8]]],
    K: ['Coração do Inverno', [['dmgGelo', 50], ['resFrio', 40], ['spd', -10]]] },
  { k: 'agilidade', name: 'Agilidade', col: { W: '#f0fff8', Y: '#9ff0dc', O: '#3ac0a0', R: '#1a6a5a' },
    P: [['spd', 3]], A: [['dodge', 1.5]], B: [['atkSpd', 3]],
    L: ['Reflexos', [['dodge', 4], ['spd', 4]]], M: ['Vento nas Botas', [['spd', 10], ['atkSpd', 5]]], R: ['Dança das Lâminas', [['atkSpd', 8], ['dodge', 2]]],
    K: ['Passo Fantasma', [['dodge', 8], ['spd', 15], ['defPct', -30]]] },
  { k: 'critico', name: 'Crítico', col: { W: '#fffbe0', Y: '#ffe06a', O: '#e0a020', R: '#8a5a10' },
    P: [['crit', 10]], A: [['critDmg', 10]], B: [['atkSpd', 3]],
    L: ['Ponto Fraco', [['crit', 25], ['critDmg', 10]]], M: ['Golpe Certeiro', [['crit', 30]]], R: ['Lâmina Cruel', [['critDmg', 30]]],
    K: ['Olhos do Carrasco', [['critDmg', 80], ['crit', -25]]] },
  { k: 'corpo', name: 'Corpo a corpo', col: { W: '#ffffff', Y: '#d0d8e8', O: '#8a96b0', R: '#4a5470' },
    P: [['dmgMelee', 8]], A: [['atkSpd', 3]], B: [['lifeSteal', 0.3]],
    L: ['Mestre de Armas', [['dmgMelee', 20], ['atkSpd', 5]]], M: ['Fúria', [['dmgMelee', 25], ['lifeSteal', 1]]], R: ['Sanguessuga', [['lifeSteal', 1.5], ['dmgMelee', 10]]],
    K: ['Sede de Batalha', [['atkSpd', 25], ['lifeSteal', 2], ['dmgSpell', -40]]] },
  { k: 'fisico', name: 'Físico', col: { W: '#fff0dc', Y: '#e0c49a', O: '#a87a4a', R: '#5e3c20' },
    P: [['dmgFis', 8]], A: [['stun', 2]], B: [['hpPct', 3]],
    L: ['Força Bruta', [['dmgFis', 20], ['stun', 5]]], M: ['Peso do Aço', [['dmgFis', 25], ['hpPct', 5]]], R: ['Quebra-Ossos', [['stun', 6], ['dmgFis', 15]]],
    K: ['Golpe Firme', [['dmgFis', 50], ['noCrit', 1]]] },
  { k: 'guarda', name: 'Guarda', col: { W: '#f4ffe0', Y: '#b8f070', O: '#5aa830', R: '#2a5a18' },
    P: [['thorns', 4]], A: [['parry', 8]], B: [['vigCost', 6]],
    L: ['Revide', [['thorns', 10], ['defPct', 10]]], M: ['Braço de Ferro', [['vigCost', 15], ['parry', 20]]], R: ['Aparo Perfeito', [['parry', 30], ['thorns', 5]]],
    K: ['Muralha Viva', [['parryHeal', 8], ['parry', 50], ['atkSpd', -15]]] },
  { k: 'defesa', name: 'Defesa', col: { W: '#eef2ff', Y: '#b4c4e0', O: '#6a80b0', R: '#34446e' },
    P: [['defPct', 8]], A: [['hpPct', 3]], B: [['resAll', 4]],
    L: ['Couraça', [['defPct', 25]]], M: ['Pedra Viva', [['defPct', 20], ['hpPct', 8]]], R: ['Resiliência', [['resAll', 10], ['defPct', 10]]],
    K: ['Bastião', [['defPct', 50], ['lessTaken', 10], ['spd', -15]]] },
  { k: 'vida', name: 'Vida', col: { W: '#ffe8ec', Y: '#ff8a9a', O: '#d23b4b', R: '#7a1a26' },
    P: [['hpPct', 4]], A: [['regen', 0.1]], B: [['potion', 8]],
    L: ['Vigor', [['hpPct', 12]]], M: ['Coração Forte', [['hpPct', 10], ['regen', 0.3]]], R: ['Alquimista', [['potion', 25], ['regen', 0.2]]],
    K: ['Sangue de Titã', [['hpPct', 40], ['manaPct', -40]]] },
  { k: 'mana', name: 'Mana', col: { W: '#e8f0ff', Y: '#8ab4ff', O: '#3a64e0', R: '#1c2a78' },
    P: [['manaPct', 6]], A: [['manaRegen', 10]], B: [['manaKill', 1]],
    L: ['Poço Fundo', [['manaPct', 20]]], M: ['Maré', [['manaPct', 10], ['manaRegen', 25]]], R: ['Colheita de Almas', [['manaKill', 3], ['manaRegen', 10]]],
    K: ['Mente sobre Matéria', [['mom', 30], ['manaPct', 20]]] }
];
// o centro e as pontes (cores neutras, de bronze)
const ARV_NEUTRO = { W: '#fff6dc', Y: '#f2c470', O: '#b07a34', R: '#5e3c14' };
const ARV_START = ['Andarilho', []];
const ARV_PONTE_IN = [['dmgAll', 4]];                      // entre as entradas de duas regiões, perto do centro
const ARV_PONTE_FORA = [['hpPct', 3], ['manaPct', 3]];     // entre os notáveis de fora de duas regiões

/* ---- montagem ----
   ARV[id] = { id, t ('o' começo, 's' pequeno, 'n' notável, 'k' keystone), name, fx, x, y, reg (índice ou -1), ic, nb: [] } */
const ARV = {}, ARV_LIST = [], ARV_EDGES = [];
const ARV_KIND = { o: 'Início', s: 'Talento', n: 'Talento notável', k: 'Keystone' };
const ARV_R = { s: 8, n: 15, k: 21, o: 17 };
(function () {
  const N = ARV_REG.length, TAU = Math.PI * 2;
  const pol = (a, r) => [Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)];
  const add = (id, t, name, fx, a, r, reg, ic) => { const [x, y] = pol(a, r); const n = { id, t, name, fx, x, y, reg, ic: ic || arvIcon((fx[0] || ['inicio'])[0]), nb: [] }; ARV[id] = n; ARV_LIST.push(n); return n; };
  const small = (id, fx, a, r, reg) => add(id, 's', ARV_NOME[fx[0][0]], fx, a, r, reg);
  const link = (a, b) => { ARV[a].nb.push(b); ARV[b].nb.push(a); };
  const chain = ids => { for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i]); };
  add('o', 'o', ARV_START[0], ARV_START[1], 0, 0, -1, 'inicio');
  ARV_REG.forEach((G, i) => {
    const a = -Math.PI / 2 + i * TAU / N, p = G.k + '.';
    G.a = a;
    small(p + 'e0', G.P, a, 120, i); small(p + 'e1', G.P, a, 175, i);
    small(p + 'm0', G.P, a, 235, i); small(p + 'm1', G.P, a, 292, i);
    add(p + 'M', 'n', G.M[0], G.M[1], a, 360, i);
    chain(['o', p + 'e0', p + 'e1', p + 'm0', p + 'm1', p + 'M']);
    for (const [s, sg, fx, nt] of [['l', -1, G.A, G.L], ['r', 1, G.B, G.R]]) {
      small(p + s + '0', fx, a + sg * 0.14, 232, i); small(p + s + '1', fx, a + sg * 0.17, 288, i); small(p + s + '2', fx, a + sg * 0.18, 344, i);
      add(p + s.toUpperCase(), 'n', nt[0], nt[1], a + sg * 0.19, 402, i);
      chain([p + 'e1', p + s + '0', p + s + '1', p + s + '2', p + s.toUpperCase()]);
    }
    small(p + 'k0', G.P, a, 440, i);
    add(p + 'K', 'k', G.K[0], G.K[1], a, 525, i, arvIcon(G.P[0][0]));
    chain([p + 'M', p + 'k0', p + 'K']);
  });
  // as pontes: cada região com a anterior (no sentido do relógio)
  ARV_REG.forEach((G, i) => {
    const H = ARV_REG[(i + N - 1) % N], a = G.a - Math.PI / N;
    add(G.k + '.pi', 's', 'Dano', ARV_PONTE_IN, a, 128, -1);
    chain([H.k + '.e0', G.k + '.pi', G.k + '.e0']);
    add(G.k + '.pf', 's', 'Andança', ARV_PONTE_FORA, a, 470, -1);
    chain([H.k + '.R', G.k + '.pf', G.k + '.L']);
  });
  for (const n of ARV_LIST) for (const m of n.nb) if (n.id < m) ARV_EDGES.push([n, ARV[m]]);
})();
// as cores de um nó: as da região ou as neutras
const arvCol = n => n.reg >= 0 ? ARV_REG[n.reg].col : ARV_NEUTRO;
// texto de uma linha de efeito
function arvFxLine([st, v]) {
  if (ARV_FLAG[st]) return ARV_TXT[st];
  const s = ARV_TXT[st], num = String(Math.round(Math.abs(v) * 100) / 100).replace('.', ',');
  // os valores negativos (o preço das keystones) só existem nos efeitos que começam com "+X"
  return v >= 0 ? s.replace('X', num) : s.replace('+X', '-' + num);
}
