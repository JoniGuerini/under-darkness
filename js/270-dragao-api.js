'use strict';

/* ================= o Covil do Dragão: ids, faixas e profundidades =================
   Debaixo do Mar Sem Sol a rocha esquenta até ferver a água; mais fundo fica o vulcão de um dragão velho
   (docs/camadas/11-covil-dragao.md). Os kobolds, a cria pequena e covarde dos dragões, cavaram tocas nas paredes dele;
   nos tubos por onde a lava escorreu moram os dracos e as serpes; no fundo, na Cratera do Tesouro, Cinzarel dorme
   sobre um morro de ouro. Aqui nada é do inferno nem foi construído por gente: rocha vulcânica, ouro, ossos de dragão,
   tocas de kobold, luz âmbar e dourada.
   Arquivos (270 a 279; prefixo de função `dg`, de constante `DG_`):
     270-dragao-api       este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     271-dragao-blocos    texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o brilho,
                          o magma correndo por cima da lava
     272-dragao-objetos   os objetos de cena e o plano por faixa (DG_PROP_PLAN)
     273-dragao-kobolds   kobold de falange, fundeiro, fundidor, armadilheiro, montado
     274-dragao-dracos    ninhada de dracos, camaleão de cinza, serpe, draco couraçado, wyrm constritor
     275-dragao-mundo     geração (chaminés, túneis, tubos, leito), as descidas do Mar, os Tubos Frios para baixo,
                          zonas, spawn, nível, partículas, lojas, o dracônio na fornalha
     276-ouro-solto       o ouro que desliza, a avalanche (dgQuake), o ouro derretido (dgMelt), dgArenaSnap e os
                          estados do herói (pés presos, puxado, agarrado)
     277-cinzarel         o chefe: a Cratera do Tesouro (dgDress), Cinzarel, as 3 fases, o lendário
     278-draconio         o metal na forja (9 peças), os materiais e as três bases da camada
     279-dragao-save      nomes das zonas, o save (cinzarel.dead)
   Números (reserva do plano das 5 camadas, 2026-10-11): blocos 736 a 767, paredes 103 a 107, terceira camada 66 a 68,
   zonas 61 a 64. O nível dos monstros e do chefe vem da posição no 129 (layerLo('dragao'), layerBossLvl('dragao')).
   Carrega depois do mundo do Reino Élfico (255) e do Mar Sem Sol, se houver, e antes do 103. */

const DRAGAO = true;
const DG_D = LAYER_D;                                   // metros de camada
// a camada logo acima: o Mar Sem Sol se existir, senão o Reino Élfico; { id, S0, D, soils, halls, climb, boss, thin }
// halls são os poços de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }); quem não existe ainda é pulado
function dgAbove() {   // 2026-10-21: a camada de cima vem da lista (129, camadaAcima)
  const a = camadaAcima('dragao'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const DG_TOP = layerTop('dragao');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129; 2026-10-21)
// topo de cada faixa em metros abaixo do DG_TOP: Chaminés de Vapor, Túneis Kobold, Tubos de Lava, Leito de Ouro, (rocha-mãe)
const DG_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const DG_BAND_NAMES = ['chamines', 'tuneis', 'tubos', 'leito'];
const DG_ZONE0 = 61;                                // zonas 61..64 (o 279 põe os nomes no índice)
let DG_S0 = (() => { const a = dgAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (dgBuild acerta)

// blocos sólidos (736 a 749)
// tufo vulcânico (bege-ocre poroso), andesito (cinza quente em lajes), pedra-pomes (quase branca, cheia de furos),
// lava cordada (cinza-chumbo enrugado, brilho nas dobras), obsidiana rajada (vidro mogno com manchas pretas), taipa
// kobold (terra prensada com escamas), andaime de ossos (pontes, atravessa por baixo como a plataforma), osso de dragão,
// ouro solto (desliza, 276), ouro endurecido (não desliza), a cortina de magma das portas da cratera (só na luta),
// carvão e dracônio
const DG_TUFO = 736, DG_ANDESITO = 737, DG_POMES = 738, DG_LAVA_CORDA = 739, DG_OBSIDIANA = 740, DG_TAIPA = 741, DG_ANDAIME = 742, DG_OSSO = 743,
  DG_OURO_SOLTO = 744, DG_OURO_DURO = 745, DG_CORTINA = 747, DG_O_CARVAO = 748, DG_O_DRACONIO = 749;
// o magma corrente é a própria lava do jogo (queima, não é sólida, não empurra: decisão 3 da ficha); o 271 desenha o
// fluxo por cima dela só dentro do Covil
const DG_MAGMA = LAVA;
// 746: a crosta de magma da borda da cratera (sólida, quente por baixo, brilha nas rachas; não queima)
const DG_CROSTA = 746;
// decoração de 1 bloco, não sólida (750 a 761): escada de cravos (escala), corda de couro de draco (escala), bica de
// vapor, olivina, totem kobold, vela de sebo, moedas espalhadas (pegar dá 1 ouro), estalactite de lava (teto), fumarola,
// coluna de lava (do chão ao teto), escama caída, fio de armadilha (rompido solta pedras do teto)
const DG_ESCADA = 750, DG_CORDA = 751, DG_VAPOR = 752, DG_OLIVINA = 753, DG_TOTEM = 754, DG_VELA = 755, DG_MOEDAS = 756, DG_ESTALACT = 757,
  DG_FUMAROLA = 758, DG_COLUNA = 759, DG_ESCAMA = 760, DG_FIO = 761;
// 762: ouro derretido pelo sopro (sólido, machuca quem pisa, brilha; em 3 s endurece em DG_OURO_DURO)
const DG_OURO_QUENTE = 762;
// paredes de fundo
const WDG_TUFO = 103, WDG_ANDESITO = 104, WDG_TAIPA = 105, WDG_LAVA = 106, WDG_OBSIDIANA = 107;
// terceira camada (DEEPT): as paredes do vulcão subindo, o paredão de tocas ao longe, as ossadas de dragão ao longe
const DP_DG_CHAMINE = 66, DP_DG_TOCAS = 67, DP_DG_OSSADA = 68;

// metros abaixo do topo da camada -> linha
const dgY = d => DG_S0 + d;
// em que faixa está uma linha: 0 chaminés, 1 túneis, 2 tubos, 3 leito, -1 acima, 4 abaixo
function dragonBand(ty) { const d = ty - DG_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < DG_BANDS[b + 1]) return b; return 4; }
const inDragao = ty => ty >= DG_S0 && ty < DG_S0 + DG_D;
/* postos enquanto o mundo é gerado:
   dgEntries  as duas chaminés de entrada vindas do Mar { x0, fy, top, land }: a escada de cravos na coluna x0 + 1
   dgLand     as duas câmaras de pouso { x0, fy, w, h, door, side } (chão em fy, ar de fy - h a fy - 1): sem spawn
   dgExits    as duas descidas dos Tubos Frios de onde o Ossário desce { x0, x1, cx, fy, w, top } (w 5: x0..x1)
   dgBoss     a Cratera do Tesouro { cx, x0, x1, w, h, top, fy, doors: [{ x, fy, side }] }: uma tigela de w x h com o
              fundo na linha fy e o ar de top a fy - 1, de x0 a x1; o 275 deixa a caixa sólida (obsidiana) com os
              corredores chegando nas portas (no alto da tigela, a fy - 30) e o 277 veste (dgDress)
   dgDens     as tocas kobold { x0, w, top, fy } e os santuários { ..., shrine: true }
   dgTubes    os tubos de lava { x0, len, fy, top, canal }: canal = magma no fundo, com andaime por cima
   dgNests    os ninhos de draco { cx, cy, w, h, fy }
   dgHoards   as câmaras do tesouro do Leito { x0, w, top, fy } (ouro solto em montes baixos) */
let dgEntries = [], dgLand = [], dgExits = [], dgBoss = null, dgDens = [], dgTubes = [], dgNests = [], dgHoards = [], dgVents = [];
const dgKeep = new Set();   // descidas, pousos, tubos frios, a Cratera: túneis, decoração e objetos não mexem
// dentro da Cratera do Tesouro, com margem m
function inDgHall(tx, ty, m = 0) { const B = dgBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inDgLand = (tx, ty, m = 0) => dgLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// sem monstro num raio de 20 blocos das câmaras de pouso (ficha, seção 2)
const dgSafe = (tx, ty) => dgLand.some(L => Math.abs(wdx(tx - (L.x0 + L.w / 2))) < 20 + L.w / 2 && Math.abs(ty - (L.fy - L.h / 2)) < 20);

/* ---------- estados que o Covil põe no herói (o 276 conta o tempo, desenha e solta) ----------
   pés presos: ouro derretido endureceu em volta dos pés por `sec` s; não anda nem pula (ainda ataca e se defende).
   puxado: a língua do camaleão puxa o herói para (x, y) em pixels com força f (px/s) por até `sec` s; bater no
           camaleão ou ele morrer solta (dgSoltar).
   agarrado: a serpe `e` segura o herói por até `sec` s e ele vai junto com ela (pendurado nas patas); bater nela solta. */
function dgPrender(sec) { if (!pl || pl.dead) return; pl.dgPresoT = Math.max(pl.dgPresoT || 0, sec); }
function dgPuxar(sec, x, y, f = 160, e = null) { if (!pl || pl.dead) return; pl.dgPuxT = sec; pl.dgPuxX = x; pl.dgPuxY = y; pl.dgPuxF = f; pl.dgPuxE = e; }
function dgAgarrar(sec, e) { if (!pl || pl.dead || !e) return; pl.dgAgarT = sec; pl.dgAgarE = e; }
function dgSoltar(e) { if (!pl) return; if (!e || pl.dgPuxE === e) { pl.dgPuxT = 0; pl.dgPuxE = null; } if (!e || pl.dgAgarE === e) { pl.dgAgarT = 0; pl.dgAgarE = null; } }
// as cores do Covil: o âmbar do magma, o ouro, a brasa, o cobre das escamas, o verde da olivina
const DG_COL = { magma: '#ffa020', magmaClaro: '#ffd050', brasa: '#ff6a10', ouro: '#f0cc5a', ouroFundo: '#a87808', cobre: '#c47a3a', olivina: '#9ad050', vapor: '#e8e0d4', osso: '#ddd0ae' };
