'use strict';

/* ================= As Ruínas dos Acendedores: ids, faixas, profundidades e o registro na corrente =================
   A décima nona camada, debaixo do Abismo e em cima da Escuridão (docs/camadas/19-ruinas-acendedores.md).
   Antes do mundo só havia a Escuridão; os Acendedores desceram com fogo e acenderam os braseiros que a seguram embaixo
   (16-escuridao). Esta é a cidade deles: a última linha de fogo do mundo, construída em pedra lavrada e brasa, com as
   guildas dos portadores do fogo, os faróis que vigiavam a borda do escuro, os templos onde se rezava para a chama e,
   no fundo, a Fornalha do Mundo, onde o fogo era guardado. Os braseiros quase todos se apagaram; os Acendedores que
   ficaram enlouqueceram no escuro e continuam a ronda, acendendo o que ainda acende. No fundo, O Último Acendedor
   ainda alimenta a última chama.
   Arquivos (410 a 419; prefixo de função `ac`, de constante `AC_`):
     410-acendedores-api      este: ids, faixas, ajudantes de profundidade, a camada de cima, o registro (129)
     411-acendedores-blocos   texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, a luz viva
     412-acendedores-objetos  os objetos de cena e o plano por faixa (AC_PROP_PLAN)
     413-acendedores-loucos   os Acendedores que enlouqueceram: turiferário, faroleiro, arauto, engolidor, alado de cera
     414-acendedores-chamas   o que o fogo virou: enxame de fagulhas, braseiro faminto, forno andante, círio vivo, enforcado do pavio
     415-acendedores-mundo    geração, as descidas do Abismo, as saídas para a Escuridão, zonas, spawn, nível, partículas, lojas
     416-ultimo-acendedor     o chefe: a Fornalha do Mundo, as quatro lanternas, a maré de brasa, as 3 fases, o lendário
     417-ardorita             o metal na forja (9 peças), os materiais e as três bases da camada (carrega com os metais)
     418-acendedores-save     nomes das zonas e a chave do chefe no save
     419-acendedores-morte    como os bichos da camada se desfazem (MORTE_TIPOS do 360)
   Números (a reserva do 00-revamp): blocos 992 a 1023, paredes 143 a 147, terceira camada 90 a 92, zonas 93 a 96.
   Carrega depois do mundo do Abismo (109) e antes do 220 (a Escuridão começa onde esta camada termina). */

const ACENDEDORES = true;
const AC_D = LAYER_D;                                   // metros de camada
// a camada logo acima (129, camadaAcima): o Abismo hoje. As descidas do Abismo (abExits) são as fendas de ENTRADA dele
// (no topo); as de baixo são os templos do último andar (abChambers 'templo'), como a Escuridão já usava
function acAbove() {
  const a = camadaAcima('acendedores');
  if (a && a.id === 'abismo') {
    const ab = typeof abBoss !== 'undefined' ? abBoss : null;
    const all = (typeof abChambers !== 'undefined' ? abChambers : []).filter(c => c.kind === 'templo' && c.fy && (!ab || Math.abs(wdx(c.cx - ab.cx)) > ab.w / 2 + 30));
    const low = all.filter(c => c.fy > a.S0 + a.D - 40);
    a.halls = (low.length >= 2 ? low : all).map(c => ({ cx: c.cx, x0: Math.round(c.cx) - 1, fy: c.fy, w: 3, top: c.top }));
    if (typeof AB_ESCADA !== 'undefined') a.climbs = [AB_ESCADA, AB_CORRENTE];
  }
  if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const AC_TOP = layerTop('acendedores');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129)
// topo de cada faixa em metros abaixo do AC_TOP: Os Faróis Caídos, As Ruas de Cinza, Os Templos da Chama, A Fornalha do Mundo
const AC_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const AC_BAND_NAMES = ['farois', 'ruas', 'templos', 'fornalha'];
const AC_ZONE0 = 93;                                // zonas 93..96 (o 418 põe os nomes no índice)
let AC_S0 = (() => { const a = acAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (acBuild acerta)

// blocos sólidos (992 a 1003): a rocha fuliginosa (a pedra natural, preta de séculos de fumaça), a pedra lavrada (os
// silhares da cidade), a laje das ruas, a cinza assentada, a rocha de brasa (veios que ainda ardem: a luz que nasce do
// lugar), o tijolo refratário (faróis e fornos), o bronze enegrecido (cúpulas, portas de templo), a escória (o vidro
// preto das forjas), a Grade Acesa (fecha a Fornalha na luta, não quebra), carvão e ardorita, e a grelha da Fornalha
const AC_ROCHA = 992, AC_LAVRADA = 993, AC_LAJE = 994, AC_CINZA = 995, AC_BRASA = 996, AC_TIJOLO = 997, AC_BRONZE = 998, AC_ESCORIA = 999,
  AC_BARREIRA = 1000, AC_O_CARVAO = 1001, AC_O_ARDORITA = 1002, AC_GRELHA = 1003;
// decoração de 1 bloco, não sólida (1004 a 1016): escada de ferro (escala), corrente de lampadário (escala), braseiro
// frio, braseiro aceso (só onde um Acendedor louco o mantém), cera derramada, monte de cinza, pavios pendurados, véu de
// fuligem, fenda de brasa (luz do lugar), lanterna apagada, coluna de templo (do chão ao teto), ossada de Acendedor com a
// tocha morta, pingente de cera
const AC_ESCADA = 1004, AC_CORRENTE = 1005, AC_BRASEIRO_FRIO = 1006, AC_BRASEIRO = 1007, AC_CERA = 1008, AC_CINZEIRO = 1009, AC_PAVIO = 1010,
  AC_FULIGEM = 1011, AC_FENDA = 1012, AC_LANTERNA = 1013, AC_COLUNA = 1014, AC_OSSADA = 1015, AC_PINGENTE = 1016;
// 1017 a 1023 livres
// paredes de fundo: rocha fuliginosa, pedra lavrada, tijolo refratário, o reboco pintado dos templos, a fornalha negra
const WAC_ROCHA = 143, WAC_LAVRADA = 144, WAC_TIJOLO = 145, WAC_TEMPLO = 146, WAC_FORNALHA = 147;
// terceira camada (DEEPT): os faróis ao longe, a cidade em silhueta, o clarão da Fornalha lá no fundo
const DP_AC_FAROIS = 90, DP_AC_CIDADE = 91, DP_AC_FORNALHA = 92;

// metros abaixo do topo da camada -> linha
const acY = d => AC_S0 + d;
// em que faixa está uma linha: 0 faróis, 1 ruas, 2 templos, 3 fornalha, -1 acima, 4 abaixo
function acBand(ty) { const d = ty - AC_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < AC_BANDS[b + 1]) return b; return 4; }
const inAcendedores = ty => ty >= AC_S0 && ty < AC_S0 + AC_D;
/* postos enquanto o mundo é gerado:
   acEntries  as duas descidas dos templos do Abismo { x0, fy, land }: a escada de ferro na coluna x0 + 1
   acLand     as duas câmaras de pouso (a Casa da Guarda) { x0, fy, w, h, door: [x...] }: sem spawn em 20 blocos
   acExits    as duas Escadarias do Fundo de onde a Escuridão desce { x0, x1, cx, fy, w, top } (lidas como halls)
   acBoss     a Fornalha do Mundo { cx, w, h, top, fy, doors, ledges, lamps, dais }: o 415 deixa a caixa sólida e o 416 veste
   acRooms    as salas por faixa { cx, cy, w, h, band, kind, x0, fy, top } */
let acEntries = [], acLand = [], acExits = [], acBoss = null, acRooms = [];
const acKeep = new Set();   // descidas, pousos, saídas, a Fornalha: túneis, decoração e objetos não mexem
// dentro da Fornalha do Mundo, com margem m (função de verdade: o 353 acha pelo nome em window)
function inAcHall(tx, ty, m = 0) { const B = acBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + Math.max(m, 0); }
const inAcLand = (tx, ty, m = 0) => acLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// nenhum monstro nasce a menos de 20 blocos de uma câmara de pouso
const acSafe = (tx, ty) => acLand.some(L => Math.abs(wdx(tx - (L.x0 + L.w / 2))) < 20 + L.w / 2 && Math.abs(ty - (L.fy - L.h / 2)) < 20);
// as cores da camada: a brasa, a cinza, a pedra lavrada, o bronze queimado, a cera, a chama branca do pavio eterno
const AC_COL = { brasa: '#f08a2a', brasaC: '#ffbe5a', miolo: '#ffe6a8', cinza: '#8a8278', pedra: '#7c6e52', bronze: '#8a6a3a', cera: '#e8dcb8', branca: '#fff6e0', fumaca: '#3a342e' };

/* ---------- o registro (129): como a camada de baixo nos vê, e o contrato dos sistemas comuns ---------- */
camadaNomes('acendedores', { on: 'ACENDEDORES', S0: 'AC_S0', D: 'AC_D', soils: 'AC_SOILS', thin: 'AC_ROCHA', thinW: 'WAC_ROCHA', halls: 'acExits', boss: 'acBoss', climb: 'AC_ESCADA', host: 'AC_SOILS', mouth: 'AC_BRASEIRO' });
camadaExt('acendedores', {
  sala: (x, y, m) => inAcHall(x, y, m),
  salaFn: 'inAcHall',
  cor: '#ffb060',
  keep: () => acKeep,
  barreira: t => t === AC_BARREIRA,
  subir: y => y >= AC_S0 - 2 && y < AC_S0 + AC_D ? (acBand(y) === 1 || acBand(y) === 3 ? AC_CORRENTE : AC_ESCADA) : 0,
  corda: t => t === AC_ESCADA || t === AC_CORRENTE,
  escalar: ['AC_ESCADA', 'AC_CORRENTE'],
  tp: () => ({
    nome: 'As Ruínas dos Acendedores',
    faixas: [0, 1, 2, 3].map(b => ({ nome: ZONE_NAMES[AC_ZONE0 + b], y0: AC_S0 + AC_BANDS[b], y1: Math.min(WH - 8, AC_S0 + AC_BANDS[b + 1]) })),
    entrada: acLand[0] ? [acLand[0].x0 + 5, acLand[0].fy - 2] : null
  }),
  gemas: { ok: t => t === AC_ROCHA || t === AC_LAVRADA, pal: 'acRocha', host: AC_ROCHA, soils: null },   // o 415 põe o AC_SOILS
  minerios: ['AC_O_CARVAO', 'AC_O_ARDORITA'],
  zona0: AC_ZONE0,
  // o som: o vento passando pelas ruas vazias (rosa, baixo), o crepitar distante de uma chama que ninguém vê, sinos de
  // farol que batem com o vento, correntes de lampadário balançando, a fornalha do fundo respirando (o fole), a rocha
  // gemendo de calor; nos Templos, um sussurro de reza perdido; na Fornalha, um coração de fogo batendo
  ambiente: {
    rt: 3.8, damp: 0.45, wet: 0.55,
    beds: [['brown', 'lowpass', 45, 80, 0.7, 0.28, 0.4, 4], ['pink', 'bandpass', 220, 420, 1.2, 0.04, 0.12, 2.5, c => c.band === 1 ? 1.4 : c.band === 0 ? 1.1 : 0.6],
      ['brown', 'lowpass', 90, 140, 0.9, 0.0, 0.2, 3, c => c.band === 3 ? 1 : 0]],
    ev: [[3, 'pop', c => c.band === 3 ? 0.35 : c.band === 2 ? 0.12 : 0.05], [0.06, 'bell', c => c.band === 0 ? 1 : c.band === 1 ? 0.3 : 0], [0.05, 'whistle', c => c.band <= 1 ? 1 : 0.2],
      [0.06, 'chains', c => c.band === 2 ? 1 : 0.3], [0.05, 'whisper', c => c.band === 2 ? 1 : 0.1], [0.08, 'bellows', c => c.band === 3 ? 1 : 0],
      [0.04, 'heart', c => c.band === 3 ? 0.8 : 0], [0.05, 'groan', c => 0.6], [0.1, 'pebbles', c => c.band <= 1 ? 0.6 : 0.3], [0.04, 'door', c => c.band === 1 ? 1 : 0]]
  }
});
