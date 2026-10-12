'use strict';

/* ================= a Floresta Petrificada: ids, faixas e profundidades =================
   A sétima camada, debaixo da Cidade Afundada (docs/camadas/07-floresta-petrificada.md). Uma floresta inteira que a
   terra engoliu e que virou pedra sem cair: troncos de granito do chão ao teto, raízes que viraram túneis, copas de
   folhas de cristal. O único lugar do jogo com cristal em toda parte.
   Arquivos (140 a 149, os reservados para a camada 7 no 00-geral; prefixo de função `fp`):
     140-floresta-api      este: ids, faixas, ajudantes de profundidade, os estados que os bichos põem no herói
     141-floresta-blocos   texturas de blocos, paredes, terceira camada, minérios, geodos, decoração, itens de bloco,
                           a folhagem que deixa a luz passar
     142-floresta-objetos  os 28 objetos de cena e o plano por faixa (FP_PROP_PLAN)
     143-floresta-bichos   lagarto de quartzo, raiz estranguladora, tatu de granito, mariposa de cristal, dríade
     144-floresta-bichos2  sementes saltadoras, tronco andante, ouriço de cristal, serpente de raiz, prisma vivo
     145-floresta-mundo    geração (a floresta enterrada), entradas, zonas, spawn, nível, brilhos, partículas, loja
     146-cervo-pedra       o chefe: a Clareira dos Troncos Gigantes, as 3 fases, a Galhada do Cervo de Pedra
     147-platina           o metal na forja (9 peças), os materiais e as três bases da camada
     148-floresta-save     nomes das zonas, o save (wg 12)
     149-troncos-queda     o sistema de troncos que caem e viram plataforma (o 146 usa)
   Decisões do Jonathan (2026-10-10): o uso novo do cristal fica para a Bigorna de Runas da Fortaleza; no máximo 2
   lagartos de quartzo por vez; cair na fenda da clareira dá dano e devolve à borda (não mata).
   Carrega logo depois do 136-cidade-mundo e antes do 103 (o Abismo começa onde esta camada termina). */

const FLORESTA = true;
const FP_D = LAYER_D;                                   // metros de camada
const FP_TOP = CD_TOP + LAYER_D;                        // onde a camada começa, em metros abaixo do chão do vilarejo (1116)
// topo de cada faixa em metros abaixo do FP_TOP: Bosque Soterrado, Mata de Cristal, Raízes Profundas, Clareira dos
// Gigantes, (rocha-mãe)
const FP_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const FP_BAND_NAMES = ['bosque', 'mata', 'raizes', 'clareira'];
const FP_ZONE0 = 33;                                // zonas 33..36 (o 148 põe os nomes depois das da Cidade Afundada)
let FP_S0 = CD_S0 + CD_D;                           // a primeira linha da camada no mundo atual (fpBuild acerta)

// blocos sólidos (320 a 333; 346 a 348 são os troncos deitados do 146)
const FP_SOLO = 320, FP_CASCA = 321, FP_CERNE = 322, FP_GRANITO = 323, FP_RAIZ = 324, FP_FOLHA = 325, FP_SEIVA = 326, FP_MUSGO = 327,
  FP_CASCALHO = 328, FP_TRONCO_G = 329, FP_BARREIRA = 330, FP_O_CARVAO = 331, FP_O_PLATINA = 332, FP_O_CRISTAL = 333;
// decoração de 1 bloco, não sólida (334 a 345): folhas caídas, broto de cristal, cipó de pedra (escala), degraus de
// raiz (escala), estalactite de seiva, samambaia, pinhas, pingente de cristal, ossada, toco, drusa acesa, ninho
const FP_FOLHAS = 334, FP_BROTO = 335, FP_CIPO = 336, FP_RAIZ_ESCADA = 337, FP_PINGO = 338, FP_SAMAMBAIA = 339, FP_PINHAS = 340,
  FP_PINGENTE = 341, FP_OSSADA = 342, FP_TOCO = 343, FP_DRUSA = 344, FP_NINHO = 345;
// paredes de fundo
const WFP_SOLO = 43, WFP_GRANITO = 44, WFP_CASCA = 45, WFP_RAIZ = 46, WFP_CRISTAL = 47;
// terceira camada (DEEPT)
const DP_FP_TRONCOS = 30, DP_FP_COPAS = 31, DP_FP_RAIZES = 32;
// a luz passa por estes blocos como passa pelo ar (com pouca perda): a folhagem de cristal (o 141 embrulha a luz)
const FP_CLEAR = new Uint8Array(NT); FP_CLEAR[FP_FOLHA] = 1;

// metros abaixo do topo da camada -> linha
const fpY = d => FP_S0 + d;
// em que faixa está uma linha: 0 bosque, 1 mata, 2 raízes, 3 clareira, -1 acima (a Cidade), 4 abaixo
function forestBand(ty) { const d = ty - FP_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < FP_BANDS[b + 1]) return b; return 4; }
const inFloresta = ty => ty >= FP_S0 && ty < FP_S0 + FP_D;
// postos enquanto o mundo é gerado: as duas entradas de cima ({ x, fy, top }: os degraus de raiz na coluna x), as duas
// escadarias dos anões que descem ({ x0, x1, cx, fy, w }), a clareira do Cervo { x0, x1, cx, w, h, top, fy, rift,
// trunks } e o acampamento anão { x0, x1, cx, fy }
let fpEntries = [], fpExits = [], fpBoss = null, fpCamp = null;

/* ---------- estados que os bichos põem no herói (o 145 conta o tempo e aplica) ----------
   preso: a raiz estranguladora segura o herói parado por `sec` segundos (não anda nem pula; ataca).
   lento: o mesmo das Minas Fúngicas (fungLentidao, 120). */
function fpPrender(sec) { if (pl.dead) return; pl.fpPresoT = Math.max(pl.fpPresoT || 0, sec); }
