'use strict';

/* ================= runas: os dados do tabuleiro de aperfeiçoamento =================
   Pedido do Jonathan (inspirado nas árvores de habilidade do Last Epoch): na torre da Aurélia, um tabuleiro no meio da
   tela com um encaixe no centro. A runa do feitiço vai no encaixe e em volta dela abre uma árvore de 50 nós, todos com
   efeitos diferentes entre si (um nó pode ter vários pontos, mas efeito novo é nó novo). Os 15 feitiços têm árvore:
   5 de raio, 5 de gelo e 5 de fogo.
   Cada árvore tem seis galhos saindo do encaixe:
   - dois galhos do próprio feitiço (os nós que só aquele feitiço tem: mais saltos, mais bolas, a nuvem que segue...),
     escritos nos arquivos de cada escola (js/420-runas-raio, 421-runas-gelo, 422-runas-fogo);
   - Força (dano, crítico, chefes...), Elemento (o que o raio, o gelo ou o fogo fazem a mais), Sustento (mana, vida,
     recarga, eco...) e Caça (bônus por situação), montados aqui a partir da lista RUNE_GEN. Cada feitiço fica só com os
     nós comuns que fazem sentido para ele (sem recarga, sem "Pressa") até completar 50.
   - Pontos: a runa sobe de nível com o uso (cada inimigo que o feitiço acerta dá 1 de experiência). Cada nível dá 1 ponto.
     RUNE_XP(L) é quanto falta do nível L para o L+1.
   - Um nó só aceita ponto se o nó de onde ele sai (parent) já tiver pelo menos 1.
   - O que cada nó faz: `p` soma no número do feitiço (por ponto), `pm` multiplica (1 + v por ponto), `set` troca o
     número quando o nó tem ponto, `g` soma num efeito da runa (RUNE_ST[id], lido em js/423-runas-efeitos e
     424-runas-feiticos). val(r) é o texto do efeito com r pontos, para a dica mostrar o agora e o próximo.
   - A posição de cada nó é calculada aqui (árvore radial, galhos em volta do encaixe).
   As regras (aplicar, ganhar experiência, a janela) ficam em js/341-runas.js. A wiki carrega este arquivo e os 420-422. */

const RUNE_XP = L => 8 + 2 * L;
const RUNE_BOARDS = {}, RUNE_ST = {};
const rnN = v => String(+(+v).toFixed(2)).replace('.', ',');
const rnBase = (id, f) => RUNE_BOARDS[id] ? RUNE_BOARDS[id].base[f] : 0;
const rnS = v => rnN(Math.round(v * 100) / 100) + ' s';
const rnB = px => rnN(Math.round(px / (typeof T !== 'undefined' ? T : 16) * 10) / 10) + ' blocos';

/* ---- ícones dos nós: máscaras 11x11 (W branco, Y claro, O meio, R escuro), pintadas na cor do elemento ---- */
const RUNE_ICONS = {
  ricochete: ["...........", ".O.......O.", "OWO.....OWO", ".OY.....YO.", "..Y.....Y..", "...Y...Y...", "...Y.O.Y...", "....YWY....", ".....W.....", "....OWO....", ".....O....."],
  corrente: ["...........", ".RRRR......", ".R..R......", ".R.YYYY....", ".RRYRR.Y...", "...Y...Y...", "...Y..WWWW.", "...YYYYW..W", "......W..W.", "......WWWW.", "..........."],
  bifurcacao: ["W.........W", ".Y.......Y.", "..Y.....Y..", "...O...O...", "....OYO....", ".....W.....", ".....Y.....", "....Y......", ".....O.....", "....O......", "....R......"],
  sobrecarga: ["......WWW..", ".....WYY...", "....WYY....", "...WYY.....", "..WWWWWW...", ".....YYW...", "....YYW....", "...YYW.....", "..OOW......", "..OO.......", "..R........"],
  choque: ["...........", ".....W.....", "..O..Y..O..", "...Y.Y.Y...", "....YWY....", ".WYYWWWYYW.", "....YWY....", "...Y.Y.Y...", "..O..Y..O..", ".....W.....", "..........."],
  ultimo: ["...........", "...OOOOO...", "..O.....O..", ".O..YYY..O.", ".O.Y...Y.O.", ".O.Y.W.Y.O.", ".O.Y...Y.O.", ".O..YYY..O.", "..O.....O..", "...OOOOO...", "..........."],
  alcance: ["...........", "...........", "...........", ".......W...", "........W..", "RROOYYWWWW.", "........W..", ".......W...", "...........", "...........", "..........."],
  salto: ["...........", "...........", "...YYYYY...", "..Y.....Y..", ".Y.......Y.", ".Y.......Y.", "OWO.....OWO", ".O.......O.", "...........", "...........", "..........."],
  fluxo: ["...........", ".....W.....", "....WY.....", "....YYO....", "...YWYOO...", "..YWYYOOR..", "..YYYOOOR..", "..OYOOORR..", "...OOORR...", "....RRR....", "..........."],
  descarga: ["...........", "..WWWWWWW..", "...Y...Y...", "...YOOOY...", "....YOY....", ".....W.....", "....Y.Y....", "...Y.O.Y...", "...YOOOY...", "..WWWWWWW..", "..........."],
  crit: ["...........", ".....W.....", ".....Y.....", "....YWY....", "WYYYWWWYYYW", "..OYWWWYO..", "...OYWYO...", "...Y.O.Y...", "..Y.....Y..", ".O.......O.", "..........."],
  caveira: ["...........", "...OYYYO...", "..OYWWWYO..", ".OYWWWWWYO.", ".OY.WWW.YO.", ".OY..W..YO.", ".OYWWWWWYO.", "..OYW.WYO..", "...YWYWY...", "...O.O.O...", "..........."],
  coracao: ["...........", "..RR...RR..", ".ROOR.ROOR.", "ROYWOROYOOR", "ROYYOOOOOOR", ".ROOOOOOOR.", "..ROOOOOR..", "...ROOOR...", "....ROR....", ".....R.....", "..........."],
  coroa: ["...........", "...........", ".W...W...W.", ".YO.OYO.OY.", ".YOOOYOOOY.", ".YYYYWYYYY.", ".OOOOOOOOO.", ".OWOOWOOWO.", ".RRRRRRRRR.", "...........", "..........."],
  adaga: ["...........", ".........W.", "........WY.", ".......WY..", "......WY...", ".....WY....", "..R.WY.....", "...RO......", "..ROR......", ".RO..R.....", ".R........."],
  area: ["W....Y....W", ".W...Y...W.", "..Y..O..Y..", "...O...O...", "...........", "YYO..W..OYY", "...........", "...O...O...", "..Y..O..Y..", ".W...Y...W.", "W....Y....W"],
  tres: ["...........", "...........", "..W..W..W..", ".WYWWYWWYW.", "..W..W..W..", "..Y..Y..Y..", "..O..O..O..", "..O..O..O..", "..R..R..R..", "...........", "..........."],
  veloz: ["...........", "...........", ".W...W.....", "..Y...Y....", "...O...O...", "....W...W..", "...O...O...", "..Y...Y....", ".W...W.....", "...........", "..........."],
  relogio: ["...........", "...OOOOO...", "..O.....O..", ".O...W...O.", ".O...W...O.", ".O...WWY.O.", ".O.......O.", ".O.......O.", "..O.....O..", "...OOOOO...", "..........."],
  chama: [".....W.....", "....WY.....", "....YY..W..", "...YWY.WY..", "..YWYYYYY..", "..YWWYYOY..", ".OYWWWYYO..", ".OYYWWYOO..", ".ROOYYOOR..", "..RROOORR..", "...RRRRR..."],
  floco: [".....W.....", "...W.Y.W...", "....YWY....", ".W..OYO..W.", "..Y.OYO.Y..", "WYYYYWYYYYW", "..Y.OYO.Y..", ".W..OYO..W.", "....YWY....", "...W.Y.W...", ".....W....."],
  escudo: ["...........", ".OOOOOOOOO.", ".OWWWYYYYO.", ".OWYYYYYYO.", ".OWYYWYYYO.", ".OYYWWWYYO.", "..OYYWYYO..", "..OYYYYYO..", "...OYYYO...", "....OYO....", ".....O....."],
  olho: ["...........", "...........", "...OOOOO...", "..O.YYY.O..", ".O.YWWWY.O.", "O..YWRWY..O", ".O.YWWWY.O.", "..O.YYY.O..", "...OOOOO...", "...........", "..........."],
  eco: ["...........", "..OOOOO....", ".O.....O...", "O...YYY.O..", "O..Y...Y.W.", "O..Y.W.YWYW", "O..Y...Y.W.", "O...YYY.O..", ".O.....O...", "..OOOOO....", "..........."],
  perfura: ["...........", "......O....", "......O..W.", "......O..YW", "WYYYYYOYYYW", "......O..YW", "......O..W.", "......O....", "...........", "...........", "..........."],
  explosao: ["...........", "..W..Y..W..", "...Y.O.Y...", "..W.YWY.W..", ".Y.YWWWY.Y.", "YOOWWWWWOOY", ".Y.YWWWY.Y.", "..W.YWY.W..", "...Y.O.Y...", "..W..Y..W..", "..........."],
  onda: ["...........", "...........", "...........", "..W.....W..", ".Y.......Y.", "Y..O...O..Y", "Y..O.W.O..Y", ".Y.......Y.", "..W.....W..", "...........", "..........."],
  cima: [".....W.....", "....WYW....", "...WYOYW...", "..W.YOY.W..", ".....O.....", ".....O.....", ".....R.....", "...........", ".RRRRRRRRR.", "...........", "..........."],
  ima: ["...........", "..OOO.OOO..", "..OYO.OYO..", "..OYO.OYO..", "..OYO.OYO..", "..OYYYYYO..", "...OYYYO...", "....OOO....", "...........", "..W..W..W..", "..........."],
  mais: ["...........", "....OOO....", "....OWO....", "....OWO....", ".OOOOWOOOO.", ".OWWWWWWWO.", ".OOOOWOOOO.", "....OWO....", "....OWO....", "....OOO....", "..........."],
  livro: ["...........", ".OOOO.OOOO.", ".OWWYOYWWO.", ".OWYYOYYWO.", ".OWYYOYYWO.", ".OWYYOYYWO.", ".OWWYOYWWO.", ".OOOOROOOO.", "....RRR....", "...........", "..........."],
  nuvem: ["...........", "...........", "....OOO....", "..OOYYYOO..", ".OYYWWWYYO.", "OYWWWWWWWYO", ".OOOOOOOOO.", "..W..W..W..", ".W..W..W...", "...........", "..........."],
  espinho: ["...........", ".....W.....", ".....W.....", "....WY.....", "..W.YY..W..", "..Y.YO.WY..", ".WY.YO.YO..", ".YO.OO.YO..", "YYO.OR.OR.W", "RRRRRRRRRRR", "..........."],
  pedra: ["........W..", "......WY...", "....WYY....", "...ROOY....", "..ROOOOR...", ".ROOYOOR...", ".ROOOOOR...", "..RROORR...", "...RRRR....", "...........", "..........."],
  cobra: ["...........", "....OOO....", "...OYWYO...", "..OYWRWYO..", "..OYYYYYOW.", "...OYYO..W.", "....OYO....", "...OYO.....", "..OYO......", "..OYYO.....", "...OOOO...."],
  parede: ["...........", "..W...W..W.", ".WY..WY.WY.", ".YY.YYO.YO.", "YYOYYOOYOO.", "YOOYOOOYOOR", "OOROORROORR", "RRRRRRRRRRR", "...........", "...........", "..........."]
};
const RUNE_COL = {
  raio: { W: '#ffffff', Y: '#bfe6ff', O: '#5aa8ff', R: '#2f5fd0' },
  gelo: { W: '#ffffff', Y: '#d8f4ff', O: '#8fd0f0', R: '#3a7ab0' },
  fogo: { W: '#fff6d0', Y: '#ffd23a', O: '#ff8a1e', R: '#c8320e' }
};

/* ---- os nós comuns ----
   th: galho (forca, elem, sust, caca) · par: o nó comum de onde sai · pri: quem fica primeiro quando o feitiço tem nós
   próprios demais (menor = mais importante) · need(P, B): só entra se o feitiço tiver aquilo (recarga, alcance...) */
const hasCd = P => P.cd != null, hasCost = P => P.cost != null || P.costS != null, hasReach = P => P.reach != null;
const RUNE_GEN = [
  // Força
  { k: 'dmg', th: 'forca', par: null, pri: 1, name: 'Potência', max: 5, icon: 'sobrecarga', g: { dmg: 0.06 }, val: r => `Dano: +${6 * r}%` },
  { k: 'crit', th: 'forca', par: 'dmg', pri: 2, name: 'Olho Certeiro', max: 4, icon: 'crit', g: { crit: 0.03 }, val: r => `Chance de crítico: +${3 * r}%` },
  { k: 'critD', th: 'forca', par: 'crit', pri: 6, name: 'Golpe Fundo', max: 3, icon: 'explosao', g: { critD: 0.15 }, val: r => `Dano do crítico: +${15 * r}%` },
  { k: 'full', th: 'forca', par: 'crit', pri: 12, name: 'Primeiro Sangue', max: 2, icon: 'ultimo', g: { full: 0.15 }, val: r => `+${15 * r}% de dano em quem está com a vida cheia` },
  { k: 'pen', th: 'forca', par: 'dmg', pri: 16, need: (P, B) => B.elem !== 'raio', name: 'Penetrar', max: 2, icon: 'perfura', g: { pen: 0.25 }, val: r => r ? `Ignora ${25 * r}% da resistência ao elemento` : 'Bichos resistentes ao elemento levam menos dano' },
  { k: 'boss', th: 'forca', par: 'dmg', pri: 5, name: 'Matador de Reis', max: 3, icon: 'coroa', g: { boss: 0.1 }, val: r => `+${10 * r}% de dano em chefes` },
  { k: 'bossCrit', th: 'forca', par: 'boss', pri: 30, name: 'Coroa Partida', max: 2, icon: 'adaga', g: { bossCrit: 0.05 }, val: r => `+${5 * r}% de chance de crítico em chefes` },
  { k: 'exec', th: 'forca', par: 'critD', pri: 8, name: 'Golpe de Graça', max: 3, icon: 'adaga', g: { exec: 0.12 }, val: r => `+${12 * r}% de dano em quem tem menos de 35% da vida` },
  { k: 'mercy', th: 'forca', par: 'exec', pri: 25, name: 'Misericórdia', max: 2, icon: 'caveira', g: { mercy: 0.05 }, val: r => r ? `Mata na hora quem não é chefe e fica com menos de ${5 * r}% da vida` : 'Nenhum golpe mata na hora' },
  // Caça
  { k: 'combo', th: 'caca', par: null, pri: 14, name: 'Insistência', max: 2, icon: 'tres', g: { combo: 0.04 }, val: r => `Cada acerto seguido no mesmo inimigo dá +${4 * r}% de dano (até 5 vezes)` },
  { k: 'momentum', th: 'caca', par: 'combo', pri: 22, name: 'Embalo', max: 2, icon: 'veloz', g: { momentum: 0.06 }, val: r => `Depois de matar, +${6 * r}% de dano por 3 s` },
  { k: 'far', th: 'caca', par: 'combo', pri: 20, need: (P, B) => !B.near, name: 'Longo Alcance', max: 2, icon: 'alcance', g: { far: 0.1 }, val: r => `+${10 * r}% de dano em quem está a mais de 6 blocos` },
  { k: 'near', th: 'caca', par: 'combo', pri: 20, need: (P, B) => !!B.near, name: 'Queima-Roupa', max: 2, icon: 'area', g: { near: 0.1 }, val: r => `+${10 * r}% de dano em quem está a menos de 3 blocos` },
  { k: 'manaHigh', th: 'caca', par: 'momentum', pri: 18, name: 'Mente Cheia', max: 2, icon: 'fluxo', g: { manaHigh: 0.08 }, val: r => `+${8 * r}% de dano com mais de 60% da mana` },
  { k: 'lowLife', th: 'caca', par: 'momentum', pri: 24, name: 'Desespero', max: 2, icon: 'coracao', g: { lowLife: 0.1 }, val: r => `+${10 * r}% de dano com menos de 40% da vida` },
  { k: 'vuln', th: 'caca', par: 'far', alt: 'near', pri: 11, name: 'Marca', max: 2, icon: 'olho', g: { vuln: 0.08 }, val: r => `Quem é acertado leva +${8 * r}% de todo dano por 3 s` },
  { k: 'weak', th: 'caca', par: 'vuln', pri: 26, name: 'Abalo', max: 2, icon: 'escudo', g: { weak: 0.1 }, val: r => `Quem é acertado bate ${10 * r}% mais fraco por 3 s` },
  { k: 'knock', th: 'caca', par: 'vuln', pri: 31, name: 'Impacto', max: 2, icon: 'cima', g: { knock: 1 }, val: r => r ? `Empurra quem é acertado${r > 1 ? ' com força' : ''}` : 'Não empurra a mais' },
  { k: 'reach', th: 'caca', par: 'far', alt: 'near', pri: 21, need: P => hasReach(P), name: 'Vista Longa', max: 2, icon: 'alcance', pm: { reach: 0.12 }, val: r => `Mira alcança +${12 * r}% mais longe` },
  // Sustento
  { k: 'cost', th: 'sust', par: null, pri: 3, need: P => hasCost(P), name: 'Economia', max: 3, icon: 'fluxo', pm: { cost: -0.08, costS: -0.08 }, val: r => `Mana: −${8 * r}%` },
  { k: 'cd', th: 'sust', par: 'cost', pri: 4, need: P => hasCd(P), name: 'Pressa', max: 3, icon: 'descarga', pm: { cd: -0.07 }, val: r => `Recarga: −${7 * r}%` },
  { k: 'echo', th: 'sust', par: 'cd', pri: 7, need: P => hasCd(P), name: 'Eco', max: 3, icon: 'eco', g: { echo: 0.06 }, val: r => `${6 * r}% de chance de lançar de novo sozinho, de graça` },
  { k: 'cdKill', th: 'sust', par: 'cd', pri: 15, need: P => hasCd(P), name: 'Ímpeto', max: 2, icon: 'relogio', g: { cdKill: 0.15 }, val: r => `Cada abate tira ${rnS(0.15 * r)} da recarga` },
  { k: 'free', th: 'sust', par: 'cost', pri: 10, need: P => hasCd(P) && P.cost != null, name: 'Dádiva', max: 3, icon: 'mais', g: { free: 0.08 }, val: r => `${8 * r}% de chance de não gastar mana` },
  { k: 'leech', th: 'sust', par: 'cost', pri: 9, name: 'Sangue Arcano', max: 3, icon: 'coracao', g: { leech: 0.015 }, val: r => `${rnN(1.5 * r)}% do dano vira vida` },
  { k: 'manaHit', th: 'sust', par: 'leech', pri: 13, name: 'Fio de Mana', max: 3, icon: 'fluxo', g: { manaHit: 0.3 }, val: r => `+${rnN(0.3 * r)} de mana por acerto` },
  { k: 'manaKill', th: 'sust', par: 'manaHit', pri: 17, name: 'Colheita', max: 3, icon: 'caveira', g: { manaKill: 2 }, val: r => `+${2 * r} de mana por abate` },
  { k: 'critMana', th: 'sust', par: 'manaHit', pri: 28, name: 'Faísca de Mana', max: 2, icon: 'crit', g: { critMana: 1 }, val: r => `Cada crítico devolve ${r} de mana` },
  { k: 'lifeKill', th: 'sust', par: 'leech', pri: 19, name: 'Banquete', max: 2, icon: 'coracao', g: { lifeKill: 1 }, val: r => `+${r} de vida por abate` },
  { k: 'guard', th: 'sust', par: 'lifeKill', pri: 21, name: 'Postura Arcana', max: 3, icon: 'escudo', g: { guard: 0.05 }, val: r => `Com o feitiço na mão, leva ${5 * r}% menos dano` },
  { k: 'ward', th: 'sust', par: 'guard', pri: 27, name: 'Barreira', max: 2, icon: 'escudo', g: { ward: 1 }, val: r => r ? `Cada lançamento guarda ${r} de escudo (até ${5 * r}) que absorve dano` : 'Sem escudo' },
  { k: 'regenM', th: 'sust', par: 'guard', pri: 23, name: 'Concentração', max: 2, icon: 'fluxo', g: { regenM: 0.5 }, val: r => `Com o feitiço na mão, +${rnN(0.5 * r)} de mana por segundo` },
  { k: 'regenL', th: 'sust', par: 'regenM', pri: 29, name: 'Vigília', max: 2, icon: 'coracao', g: { regenL: 0.2 }, val: r => `Com o feitiço na mão, +${rnN(0.2 * r)} de vida por segundo` },
  { k: 'xp', th: 'sust', par: null, pri: 32, name: 'Aprendiz', max: 2, icon: 'livro', g: { xp: 0.15 }, val: r => `A runa ganha +${15 * r}% de experiência` },
  { k: 'xpKill', th: 'sust', par: 'xp', pri: 33, name: 'Sabedoria', max: 2, icon: 'livro', g: { xpKill: 0.08 }, val: r => `+${8 * r}% de XP nos abates com o feitiço` },
  // Elemento: raio
  { k: 'shockC', th: 'elem', el: 'raio', par: null, pri: 2, name: 'Choque', max: 3, icon: 'choque', g: { shockC: 0.08 }, val: r => `+${8 * r}% de chance de atordoar` },
  { k: 'stunT', th: 'elem', el: 'raio', par: 'shockC', pri: 9, name: 'Paralisia', max: 2, icon: 'relogio', g: { stunT: 0.15 }, val: r => `Atordoamento dura +${rnS(0.15 * r)}` },
  { k: 'stunP', th: 'elem', el: 'raio', par: 'shockC', pri: 6, name: 'Corrente Viva', max: 3, icon: 'sobrecarga', g: { stunP: 0.12 }, val: r => `+${12 * r}% de dano em quem está atordoado` },
  { k: 'zapH', th: 'elem', el: 'raio', par: 'stunP', pri: 12, name: 'Centelha', max: 3, icon: 'bifurcacao', g: { zapH: 0.08 }, val: r => `${8 * r}% de chance de um acerto saltar para outro inimigo perto, com metade do dano` },
  { k: 'chainK', th: 'elem', el: 'raio', par: 'stunT', pri: 10, name: 'Condução', max: 2, icon: 'corrente', g: { chainK: 0.4 }, val: r => r ? `Quem morre solta um raio no inimigo mais perto (${40 * r}% do dano)` : 'Quem morre não solta raio' },
  { k: 'boomR', th: 'elem', el: 'raio', par: 'chainK', pri: 16, name: 'Descarga Final', max: 2, icon: 'explosao', g: { boom: 0.4 }, val: r => r ? `Quem morre estoura em faíscas em volta (${40 * r}% do dano)` : 'Quem morre não estoura' },
  { k: 'stunCrit', th: 'elem', el: 'raio', par: 'stunP', pri: 22, name: 'Nervo Exposto', max: 2, icon: 'crit', g: { stunCrit: 0.1 }, val: r => `+${10 * r}% de chance de crítico em quem está atordoado` },
  { k: 'overload', th: 'elem', el: 'raio', par: 'zapH', pri: 20, name: 'Sobretensão', max: 2, icon: 'crit', g: { overload: 0.05 }, val: r => `${5 * r}% de chance de um acerto dar o triplo do dano` },
  // Elemento: gelo
  { k: 'chillT', th: 'elem', el: 'gelo', par: null, pri: 2, name: 'Frio Longo', max: 2, icon: 'relogio', g: { chillT: 0.5 }, val: r => `O frio dura +${rnS(0.5 * r)}` },
  { k: 'frzAt', th: 'elem', el: 'gelo', par: 'chillT', pri: 6, name: 'Gelo Rápido', max: 2, icon: 'floco', g: { frzAt: 1 }, val: r => r ? `Congela com ${r} golpe${r > 1 ? 's' : ''} a menos` : 'Congela com o número normal de golpes' },
  { k: 'frzT', th: 'elem', el: 'gelo', par: 'chillT', pri: 9, name: 'Gelo Fundo', max: 3, icon: 'floco', g: { frzT: 0.4 }, val: r => `Fica congelado +${rnS(0.4 * r)}` },
  { k: 'chillP', th: 'elem', el: 'gelo', par: 'frzAt', pri: 10, name: 'Frio que Morde', max: 3, icon: 'sobrecarga', g: { chillP: 0.1 }, val: r => `+${10 * r}% de dano em quem está resfriado` },
  { k: 'frozenP', th: 'elem', el: 'gelo', par: 'frzT', pri: 12, name: 'Quebra-Gelo', max: 2, icon: 'adaga', g: { frozenP: 0.2 }, val: r => `+${20 * r}% de dano em quem está congelado` },
  { k: 'shatterK', th: 'elem', el: 'gelo', par: 'frozenP', pri: 16, name: 'Estilhaçar', max: 1, icon: 'explosao', g: { shatterK: 1 }, val: r => r ? 'Quem morre congelado solta 6 lascas de gelo' : 'Quem morre congelado só se parte' },
  { k: 'boomG', th: 'elem', el: 'gelo', par: 'chillP', pri: 20, name: 'Explosão Gélida', max: 2, icon: 'onda', g: { boom: 0.4 }, val: r => r ? `Quem morre estoura em gelo em volta (${40 * r}% do dano) e resfria` : 'Quem morre não estoura' },
  // Elemento: fogo
  { k: 'burnD', th: 'elem', el: 'fogo', par: null, pri: 2, name: 'Brasa Viva', max: 3, icon: 'chama', g: { burnD: 0.25 }, val: r => `Queimadura: +${25 * r}% de dano` },
  { k: 'burnT', th: 'elem', el: 'fogo', par: 'burnD', pri: 9, name: 'Fogo Lento', max: 3, icon: 'relogio', g: { burnT: 0.5 }, val: r => `Queimadura dura +${rnS(0.5 * r)}` },
  { k: 'burnP', th: 'elem', el: 'fogo', par: 'burnD', pri: 6, name: 'Atiçar', max: 3, icon: 'sobrecarga', g: { burnP: 0.1 }, val: r => `+${10 * r}% de dano em quem está queimando` },
  { k: 'ash', th: 'elem', el: 'fogo', par: 'burnP', pri: 12, name: 'Cinza', max: 2, icon: 'olho', g: { ash: 0.05 }, val: r => `Quem queima leva +${5 * r}% de todo dano` },
  { k: 'spread', th: 'elem', el: 'fogo', par: 'burnT', pri: 10, name: 'Alastrar', max: 1, icon: 'tres', g: { spread: 1 }, val: r => r ? 'Quem morre queimando passa o fogo para quem está perto' : 'O fogo não passa adiante' },
  { k: 'boomF', th: 'elem', el: 'fogo', par: 'spread', pri: 16, name: 'Combustão', max: 2, icon: 'explosao', g: { boom: 0.4 }, val: r => r ? `Quem morre explode em chamas (${40 * r}% do dano)` : 'Quem morre não explode' },
  { k: 'melt', th: 'elem', el: 'fogo', par: 'ash', pri: 20, name: 'Derreter', max: 2, icon: 'floco', g: { melt: 0.15 }, val: r => `+${15 * r}% de dano em quem está resfriado ou congelado` }
];

/* ---- montar uma árvore ----
   specs: os nós próprios do feitiço, cada um { k, name, max, icon, par, br (0 ou 1: em qual dos dois galhos), p/pm/set/g, val }.
   P: o objeto de números do feitiço (ARC, NEV, FOGO.bola...). elem: raio, gelo ou fogo. near: feitiço de perto. */
const RB_RING = [0, 30, 54, 78, 102, 126, 148];
const RB_EX = 1.4;   // o tabuleiro é mais largo que alto
const RB_GAP = 25, RB_HOLE = 36, RB_HW = 186, RB_HH = 134;   // distância mínima entre nós, o vão do encaixe, meia largura e meia altura úteis
const clampN = (v, a, b) => v < a ? a : v > b ? b : v;
function runeBoard(id, o) {
  const B = { id, P: o.P, elem: o.elem, near: !!o.near, base: Object.assign({}, o.P), col: RUNE_COL[o.elem], legacy: o.legacy || {} };
  const own = o.nodes.map(q => Object.assign({ br: 0 }, q, { own: true }));
  let gen = RUNE_GEN.filter(q => (!q.el || q.el === o.elem) && (!q.need || q.need(B.P, B)) && !(o.skip || []).includes(q.k));
  gen.sort((a, b) => a.pri - b.pri);
  gen = gen.slice(0, Math.max(0, 50 - own.length)).map(q => Object.assign({}, q));
  // o pai de um nó comum que ficou de fora: sobe até achar um que ficou (ou vira raiz do galho)
  const keep = new Set(gen.map(q => q.k)), byG = {}; for (const q of RUNE_GEN) byG[q.k] = q;
  for (const q of gen) { let p = q.par; if (p && !keep.has(p) && q.alt && keep.has(q.alt)) p = q.alt; while (p && !keep.has(p)) p = byG[p] && byG[p].par; q.par = p || null; }
  // a chave do nó no save: o Arco Voltaico guarda os nomes de antes (sobrecarga, choque, fluxo, descarga)
  const ren = B.legacy;
  for (const q of gen) { if (ren[q.k]) { const nk = ren[q.k]; for (const z of gen) if (z.par === q.k) z.par = nk; q.k = nk; } }
  const nodes = own.concat(gen);
  if (nodes.length !== 50 && typeof console !== 'undefined') console.warn('runas: ' + id + ' tem ' + nodes.length + ' nós');
  B.nodes = nodes; B.byK = {}; for (const q of nodes) { if (B.byK[q.k]) console.warn('runas: nó repetido ' + id + '.' + q.k); B.byK[q.k] = q; }
  for (const q of nodes) if (q.par && !B.byK[q.par]) { console.warn('runas: pai sumido ' + id + '.' + q.k); q.par = null; }
  for (const q of nodes) q.parent = q.par || null;
  B.maxLvl = nodes.reduce((a, q) => a + q.max, 0);
  runeLayout(B);
  B.apply = n => runeApply(B, n);
  RUNE_BOARDS[id] = B; RUNE_ST[id] = {};
  return B;
}
// galhos em volta do encaixe: própria A, Força, Elemento, própria B, Sustento, Caça; cada galho fica com um pedaço
// do círculo do tamanho das suas folhas, e cada nó fica no anel da sua profundidade
function runeLayout(B) {
  const kids = {}; for (const q of B.nodes) (kids[q.parent || '#'] = kids[q.parent || '#'] || []).push(q);
  const order = { 0: 0, forca: 1, elem: 2, 1: 3, sust: 4, caca: 5 };
  const branchOf = q => q.own ? String(q.br) : q.th;
  const roots = (kids['#'] || []).slice().sort((a, b) => order[branchOf(a)] - order[branchOf(b)]);
  const leaves = q => { const c = kids[q.k]; return c ? c.reduce((a, z) => a + leaves(z), 0) : 1; };
  // um galho muito fundo encolhe para caber no último anel
  const depth = q => 1 + Math.max(0, ...(kids[q.k] || []).map(depth));
  const total = roots.reduce((a, q) => a + leaves(q), 0);
  let a0 = -Math.PI / 2 - Math.PI / total * leaves(roots[0] || { k: '' });
  const place = (q, a, span, d) => {
    q.ang = a + span / 2; q.dep = d;
    const R = RB_RING[Math.min(d, RB_RING.length - 1)];
    q.x = Math.round(Math.cos(q.ang) * R * RB_EX); q.y = Math.round(Math.sin(q.ang) * R);
    let s = a; const c = kids[q.k] || [], L = leaves(q);
    for (const z of c) { const w = span * leaves(z) / L; place(z, s, w, d + 1); s += w; }
  };
  for (const q of roots) { const w = Math.PI * 2 * leaves(q) / total; place(q, a0, w, 1); a0 += w; }
  B.maxDep = Math.max(...B.nodes.map(q => q.dep));
  // afasta os nós que ficaram perto demais, puxando cada um de volta para o seu lugar no anel e para perto do pai
  const N = B.nodes, D = RB_GAP;
  for (const q of N) { q.ax = q.x; q.ay = q.y; }
  for (let it = 0; it < 260; it++) {
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= D) continue; if (d < 0.01) { dx = 1; dy = 0; d = 1; }
      const m = (D - d) / 2 / d; a.x -= dx * m; a.y -= dy * m; b.x += dx * m; b.y += dy * m;
    }
    for (const q of N) {
      q.x += (q.ax - q.x) * 0.04; q.y += (q.ay - q.y) * 0.04;
      const p = q.parent ? B.byK[q.parent] : { x: 0, y: 0 }, pd = Math.hypot(q.x - p.x, q.y - p.y);
      if (pd > D * 1.6) { const k = (pd - D * 1.6) / pd * 0.1; q.x -= (q.x - p.x) * k; q.y -= (q.y - p.y) * k; }
      const cd = Math.hypot(q.x, q.y); if (cd < RB_HOLE) { q.x *= RB_HOLE / (cd || 1); q.y *= RB_HOLE / (cd || 1); }
      q.x = clampN(q.x, -RB_HW, RB_HW); q.y = clampN(q.y, -RB_HH, RB_HH);
    }
  }
  for (const q of N) { q.x = Math.round(q.x); q.y = Math.round(q.y); delete q.ax; delete q.ay; }
}
// recalcula os números do feitiço e os efeitos da runa a partir dos pontos (n[k] = pontos no nó k)
function runeApply(B, n) {
  const P = B.P, S = {};
  for (const f of Object.keys(P)) if (!(f in B.base)) delete P[f];   // o que um nó com set criou some quando ele é desfeito
  Object.assign(P, B.base);
  for (const q of B.nodes) {
    const r = n[q.k] | 0; if (!r) continue;
    if (q.p) for (const f in q.p) if (P[f] != null) P[f] += q.p[f] * r;
    if (q.set) for (const f in q.set) P[f] = q.set[f];
    if (q.g) for (const f in q.g) S[f] = (S[f] || 0) + q.g[f] * r;
  }
  for (const q of B.nodes) { const r = n[q.k] | 0; if (r && q.pm) for (const f in q.pm) if (P[f] != null) P[f] *= 1 + q.pm[f] * r; }
  if (P.cd != null) P.cd = Math.max(0.12, P.cd);
  if (P.cost != null) P.cost = Math.max(1, Math.round(P.cost * 10) / 10);
  RUNE_ST[B.id] = S;
}
