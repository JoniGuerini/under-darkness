'use strict';

/* ================= as Minas Fúngicas: ids, faixas e profundidades =================
   A quinta camada, debaixo da Mina Abandonada (docs/camadas/05-minas-fungicas.md, docs/fungo-spec.md). Antes dos
   mineiros do cobalto, a colônia de Ferroalto cavou aqui atrás da esporita, um metal verde-azulado que o micélio
   deposita na rocha, e acordou um fungo que tomou as galerias, os bichos e as pessoas. É a camada viva: a rocha, o
   chão, a água e a parede do chefe crescem e soltam esporos; a luz é fria e vem dos próprios cogumelos.
   Arquivos (os números 120 a 128 são os reservados para a camada 5 no 00-geral; os prefixos de função são `fung`,
   porque `fg` já é da escola do fogo, 113):
     120-fungo-api        este: ids, faixas, ajudantes de profundidade
     121-fungo-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco
     122-fungo-objetos    os 28 objetos de cena e o plano por faixa (FG_PROP_PLAN)
     123-fungo-tomados    colono, marionete, semeador, mariposa, tapete
     124-fungo-tomados2   brotos, grilo, pernalta, mula, água-viva
     125-fungo-mundo      geração, as descidas da mina, decoração, zonas, spawn, nível, partículas, loja
     126-mae-esporo       a chefe: a gruta, a parede, os bulbos, as fases, o Lampião da Mãe-Esporo
     127-esporita         o metal na forja (9 peças) e os materiais da camada
     128-fungo-save       nomes das zonas, save (wg 10)
   A água é a do sistema comum (171-agua, 172-nadar). Carrega logo depois do 86-sapo-grutas e antes do 103 (o
   Abismo começa onde esta camada termina). */

const FUNGO = true;
const FG_D = LAYER_D;                                   // metros de camada
const FG_TOP = layerTop('fungo');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129; 2026-10-21)
// topo de cada faixa em metros abaixo do FG_TOP: Galerias Tomadas, Bosque de Chapéus, Grutas Alagadas, Coração do Micélio, (rocha-mãe)
const FG_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const FG_BAND_NAMES = ['galerias', 'bosque', 'grutas', 'coracao'];
const FG_ZONE0 = 25;                                // zonas 25..28 (reservadas no 00-geral; o 128 põe os nomes depois das do Abismo)
let FG_S0 = MN_S0 + MN_D;                           // a primeira linha da camada no mundo atual (fungBuild acerta)

// blocos sólidos (256 a 270)
const FG_XISTO = 256, FG_TOMADA = 257, FG_HUMUS = 258, FG_LODO = 259, FG_TABUA = 260, FG_VIGA = 261, FG_TIJOLO = 262, FG_TRONCO = 263, FG_CHAPEU = 264,
  FG_CARNE = 265, FG_BOLSA = 266, FG_VIVO = 267, FG_BARREIRA = 268, FG_O_CARVAO = 269, FG_O_ESPORITA = 270;
// decoração de 1 bloco, não sólida (272 a 283): o cordão de micélio (escala), a escada da colônia (escala), o cogumelo-
// lanterna, um tufo de cogumelos, fios pendentes, gotejo de seiva, cacho de esporos, ossada tomada, o lampião da
// colônia, junco de micélio, seixos com limo e a escora tomada (do chão ao teto)
const FG_CORDAO = 272, FG_ESCADA = 273, FG_LANTERNA = 274, FG_TUFO = 275, FG_FIOS = 276, FG_GOTEJO = 277, FG_ESPOROS = 278, FG_OSSADA = 279, FG_LAMPIAO = 280,
  FG_JUNCO = 281, FG_SEIXOS = 282, FG_ESCORA = 283;
// paredes de fundo
const WFG_XISTO = 33, WFG_TABUADO = 34, WFG_HUMUS = 35, WFG_MICELIO = 36, WFG_CARNE = 37;
// terceira camada (DEEPT)
const DP_FG_ROCHA = 24, DP_FG_CHAPEUS = 25, DP_FG_COLONIA = 26;

// metros abaixo do topo da camada -> linha
const fungY = d => FG_S0 + d;
// em que faixa está uma linha: 0 galerias, 1 bosque, 2 grutas, 3 coração, -1 acima (a mina), 4 abaixo
function fungoBand(ty) { const d = ty - FG_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < FG_BANDS[b + 1]) return b; return 4; }
// postos enquanto o mundo é gerado: as duas descidas da mina ({ x0, fy, top }, a escada na coluna x0 + 1), as duas
// saídas para baixo (as câmaras de onde o Abismo desce) e a gruta da chefe { x0, x1, w, h, top, fy, cx, lvl0 }
let fungExits = [], fungDown = [], fungBoss = null;

/* ---------- estados que os Tomados e a chefe põem no herói (o 125 conta o tempo e aplica) ----------
   esporado: dano lento (dmg por segundo) por `sec` segundos; o mais forte vale, o tempo não soma.
   lento: anda `k` mais devagar (0,25 = 25%) por `sec` segundos; o mais forte vale.
   colado: sem pulo por `sec` segundos (o tapete de micélio). */
function fungEsporar(dmg, sec) { if (pl.dead) return; pl.fgEsporoDmg = Math.max((pl.fgEsporoT || 0) > 0 ? pl.fgEsporoDmg || 0 : 0, dmg); pl.fgEsporoT = Math.max(pl.fgEsporoT || 0, sec); }
function fungLentidao(k, sec) { if (pl.dead) return; if ((pl.fgLentoT || 0) <= 0 || k >= (pl.fgLentoK || 0)) pl.fgLentoK = k; pl.fgLentoT = Math.max(pl.fgLentoT || 0, sec); }
function fungColar(sec) { if (pl.dead) return; pl.fgColaT = Math.max(pl.fgColaT || 0, sec); }
