'use strict';

/* ================= talentos: peças antigas que outros arquivos ainda usam =================
   A árvore de talentos do guerreiro que morava aqui foi trocada (2026-10-12) pela árvore grande de js/344-talentos-dados.js
   e js/345-talentos.js. Ficaram só:
   - TAL_ICPAL, TAL_ICON, TAL_RIM, talHash e talShade: ícones 9x9, aros e o granulado que as árvores dos ofícios
     (js/331-oficios.js) desenham;
   - talCondOk: a regra "com espadas / com escudo", que o 62-montante-maos e o 92-magia-regras embrulham. */
const TAL_COND = { sword: 'com espadas', dagger: 'com adagas', mace: 'com maças', axe: 'com machados', spear: 'com lanças', shield: 'com escudo' };
function talCondOk(c, kind) { return !c || (c === 'shield' ? !!equip.shield : c === kind); }

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
// aros: 0 trancado, 1 disponível, 2 ligado
const TAL_RIM = [
  { hi: '#8e8b9c', mid: '#4c4658', lo: '#2a2530', stud: '#a8a4b4' },
  { hi: '#f2c470', mid: '#b07a34', lo: '#5e3c14', stud: '#fff6dc' },
  { hi: '#fff6dc', mid: '#f2c470', lo: '#b07a34', stud: '#fff6dc' }
];
const talHash = (x, y, s = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
function talShade(hex, k) {
  const v = parseInt(hex.slice(1), 16), c = x => clamp(Math.round(x * k), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(v >> 16 & 255) + c(v >> 8 & 255) + c(v & 255);
}
