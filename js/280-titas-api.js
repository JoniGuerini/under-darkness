'use strict';

/* ================= o Ossário dos Titãs: ids, faixas e profundidades =================
   A décima quarta camada, debaixo do Covil do Dragão e em cima da Cidade dos Antigos (docs/camadas/12-ossario-titas.md).
   O cemitério dos gigantes que seguravam o mundo: quando perderam a guerra, Cronos e os seus foram derrubados para
   baixo de tudo e ficaram. A carne virou pó; sobraram os ossos (costelas viram arcos, crânios viram cavernas, espinhas
   viram pontes), as placas de bronze das armaduras e as lascas da foice de adamantita que os cortou. Os filhos menores
   ainda vivem entre os ossos, os carniceiros vêm roer o resto e, no fundo, o Último Titã ainda respira.
   Arquivos (280 a 289; prefixo de função `tt`, de constante `TT_`):
     280-titas-api         este: ids, faixas, ajudantes de profundidade, a camada de cima
     281-titas-blocos      texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, a luz fria
     282-titas-objetos     os objetos de cena e o plano por faixa (TT_PROP_PLAN)
     283-titas-nascidos    ciclope jovem, hecatônquiro menor, mão do enterrado, titânide menor, erínia
     284-titas-carniceiros abutre-de-ossos, tapete de besouros, parasita da medula, catador de ossos, hiena risonha
     285-titas-mundo       geração (os esqueletos carimbados), as descidas do Covil, as Fendas Retas, zonas, spawn,
                           nível, partículas, lojas, a adamantita na fornalha
     286-corpo-terreno     o sistema novo: partes sólidas que andam (o corpo do titã), o embrulho do rectSolid, carregar,
                           escalar, o tremor, o carimbo final
     287-ultimo-tita       o chefe: o Leito do Titã, as 4 lascas, as 3 fases, os Dedos Cerrados, o lendário
     288-adamantita        o metal na forja (9 peças), os materiais e as três bases da camada (carrega cedo, com os metais)
     289-titas-save        nomes das zonas e a chave do chefe no save
   Números (a reserva do Ossário, 2026-10-11): blocos 768 a 799 (NT pelo menos 800), paredes 108 a 112, terceira
   camada 69 a 71, zonas 65 a 68.
   Carrega depois do mundo da camada de cima (o Covil; se ele ainda não existe, o Mar Sem Sol ou o Reino Élfico) e antes
   do 103 (o Abismo começa onde esta camada termina). */

const TITAS = true;
const TT_D = LAYER_D;                                   // metros de camada
// lê um nome global que pode não existir ainda (as camadas vizinhas são feitas ao mesmo tempo, os nomes delas podem
// faltar): o eval indireto enxerga as constantes de nível de topo dos outros arquivos
const ttG = n => { try { return (0, eval)(n); } catch (err) { return undefined; } };
// a camada logo acima: a primeira linha, a altura, o chão natural, a rocha em que as últimas linhas afinam, a escada
// dela e os poços de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }); a mais funda que existir
function ttAbove() {
  for (const [on, P, ex, bs] of [['DRAGAO', 'DG', 'dgExits', 'dgBoss'], ['MAR', 'MS', 'msExits', 'msBoss']]) {
    if (!ttG(on) || ttG(P + '_S0') === undefined) continue;
    const climb = ttG(P + '_ESCADA') ?? ttG(P + '_CRAVOS') ?? ttG(P + '_CORDA') ?? CHAIN;
    return { id: P, S0: ttG(P + '_S0'), D: ttG(P + '_D') || 186, soils: ttG(P + '_SOILS') || null, halls: ttG(ex) || [], climb, boss: ttG(bs) || null, thin: STONE };
  }
  if (typeof ELFOS !== 'undefined' && ELFOS && typeof EL_S0 !== 'undefined')
    return { id: 'elfos', S0: EL_S0, D: EL_D, soils: EL_SOILS, halls: elExits, climb: EL_ESCADA, boss: elBoss, thin: EL_PEDRA_POCO };
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const TT_TOP = (ttG('DG_TOP') ?? ttG('MS_TOP') ?? (typeof EL_TOP !== 'undefined' ? EL_TOP : 2046)) + LAYER_D;   // metros abaixo do chão do vilarejo (2418 com as cinco)
// topo de cada faixa em metros abaixo do TT_TOP: Campo das Costelas, A Espinha, Vale dos Crânios, Leito do Último, (rocha-mãe)
const TT_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const TT_BAND_NAMES = ['costelas', 'espinha', 'cranios', 'leito'];
const TT_ZONE0 = 65;                                // zonas 65..68 (o 289 põe os nomes no índice)
let TT_S0 = (() => { const a = ttAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (ttBuild acerta)

// blocos sólidos (768 a 779): osso de titã (marfim com veio fibroso), osso esponjoso (favo poroso), tutano petrificado
// (âmbar-rosado, dentro dos ossos longos), rocha fóssil (a massa entre os ossos, com conchas), pó de osso (o chão das
// salas), esmalte (os dentes), cartilagem seca (os discos da espinha), cinza assentada (a do vulcão do Covil, só nas
// primeiras linhas), bronze titânico (placas de armadura gigante), os Dedos Cerrados (fecham o Leito na luta, não
// quebram), carvão (linhito) e adamantita
const TT_OSSO = 768, TT_ESPONJA = 769, TT_TUTANO = 770, TT_ROCHA = 771, TT_PO = 772, TT_DENTE = 773, TT_CARTILAGEM = 774, TT_CINZA = 775,
  TT_BRONZE = 776, TT_BARREIRA = 777, TT_O_CARVAO = 778, TT_O_ADAMANTITA = 779;
// decoração de 1 bloco, não sólida (780 a 791): escada de ossos amarrados (escala), tendão pendurado (escala como a
// corda), ossinhos, lamparina de tutano (luz amarela pálida), flor-de-cinza (luz fria fraca), fio de pó (teto, escorre),
// líquen de osso (forro do teto), lasca da foice (luz fria), estaca de catador, concha fóssil, lasca de osso fincada,
// coluna de dente (do chão ao teto, nos crânios)
const TT_ESCADA = 780, TT_TENDAO = 781, TT_OSSINHOS = 782, TT_LAMPARINA = 783, TT_FLOR = 784, TT_PO_CAI = 785, TT_LIQUEN = 786, TT_LASCA = 787,
  TT_ESTACA = 788, TT_FOSSIL = 789, TT_ESPINHO = 790, TT_COLUNA = 791;
// 792 a 799 livres
// paredes de fundo: osso, rocha fóssil, favo (o esponjoso visto de dentro), a curva de dentro do crânio, bronze
const WTT_OSSO = 108, WTT_ROCHA = 109, WTT_ESPONJA = 110, WTT_CRANIO = 111, WTT_BRONZE = 112;
// terceira camada (DEEPT): costelas enormes ao longe, titãs deitados do tamanho de montanhas, rocha fóssil com ossos
const DP_TT_COSTELAS = 69, DP_TT_TITAS = 70, DP_TT_ROCHA = 71;

// metros abaixo do topo da camada -> linha
const ttY = d => TT_S0 + d;
// em que faixa está uma linha: 0 costelas, 1 espinha, 2 crânios, 3 leito, -1 acima, 4 abaixo
function titanBand(ty) { const d = ty - TT_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < TT_BANDS[b + 1]) return b; return 4; }
const inTitas = ty => ty >= TT_S0 && ty < TT_S0 + TT_D;
/* postos enquanto o mundo é gerado:
   ttEntries  as duas descidas dos Tubos Frios { x0, fy, top, land }: a escada de ossos na coluna x0 + 1
   ttLand     as duas câmaras de pouso dentro do crânio de entrada { x0, fy, w, h, skull }: sem spawn em 20 blocos
   ttExits    as duas Fendas Retas de onde a camada de baixo desce { x0, x1, cx, fy, w, top } (lidas como halls)
   ttBoss     o Leito do Titã { cx, x0, x1, w, h, top, fy, doors: [{ x, fy, side }] }: a caverna de w x h com o chão na
              linha fy e o ar de top a fy - 1; o 285 deixa a caixa sólida e o 287 veste (ttDress)
   ttCages    as caixas torácicas { cx, x0, w, h, fy, top } · ttBones os ossos longos · ttBridges as espinhas-ponte
   ttPelves   as bacias · ttSkulls os crânios-caverna · ttHelms os elmos tombados · ttHands as mãos abertas
   ttCamps    os acampamentos de catador (lamparinas e estacas) */
let ttEntries = [], ttLand = [], ttExits = [], ttBoss = null, ttCages = [], ttBones = [], ttBridges = [], ttPelves = [], ttSkulls = [], ttHelms = [], ttHands = [], ttCamps = [];
const ttKeep = new Set();   // descidas, pousos, fendas, o Leito: túneis, decoração e objetos não mexem
// dentro do Leito do Titã, com margem m
function inTtHall(tx, ty, m = 0) { const B = ttBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inTtLand = (tx, ty, m = 0) => ttLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// ttSafe: nenhum monstro nasce a menos de 20 blocos de uma câmara de pouso
const ttSafe = (tx, ty) => ttLand.some(L => Math.abs(wdx(tx - (L.x0 + L.w / 2))) < 20 + L.w / 2 && Math.abs(ty - (L.fy - L.h / 2)) < 20);
// as cores do Ossário: o marfim, o pó, o bronze gasto, a luz fria da adamantita, o amarelo pálido do tutano aceso
const TT_COL = { osso: '#c8bca0', marfim: '#e8e0c8', po: '#a89e88', bronze: '#6a8a6a', frio: '#bfe8dc', foice: '#d0e4dc', tutano: '#f0d890', cinza: '#8a8478' };
