'use strict';

/* ================= o Mar Sem Sol: ids, faixas e profundidades =================
   A décima segunda camada, debaixo do Reino Élfico (docs/camadas/10-mar-sem-sol.md; o pedido do Jonathan de
   2026-10-11: as cinco camadas que faltam, todas ao mesmo tempo). Debaixo das raízes da Árvore-Mãe a rocha se abre
   num mar que dá a volta no mundo: praias de areia negra, ilhas de basalto molhado, navios de todas as épocas
   encalhados ou boiando de quilha para cima, palafitas da gente-peixe e, no fundo, fendas, templos afundados e as
   chaminés pretas que já esquentam com o calor do dragão. A luz é toda de bicho e de plâncton.
   Arquivos (260 a 269; prefixo de função `ms`, de constante `MS_`):
     260-mar-api        este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     261-mar-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o brilho
     262-mar-objetos    os objetos de cena e o plano por faixa (MS_PROP_PLAN)
     263-mar-bichos     guerreiro escamado, xamã das bolhas, caranguejo-ermitão, arraia-do-teto, polvo das ruínas
     264-mar-bichos2    tubarão-cego, medusa abissal, enguia-trovão, baiacu-de-espinhos, diabo-marinho
     265-mar-mundo      geração (o vão, as ilhas, os navios, as palafitas, a Fossa, as Chaminés), a água, as descidas
                        do Reino, as saídas para baixo, zonas, spawn, nível, partículas, lojas, o oricalco na fornalha
     266-leviata        o chefe: a Nau Sem Nome, a maré, os destroços, o Leviatã, as 3 fases, a Pérola
     267-oricalco       o metal na forja (9 peças), o peso zero na água, os materiais e as três bases da camada
     268-mar-save       nomes das zonas, o tom da água (sem trocar o número do mundo: a integração faz isso)
     269-mar-estados    puxado para o fundo, preso na bolha, a tinta do polvo, a água fervente, os respiradouros
   Números (reserva da integração de 2026-10-11): blocos 704 a 735 (NT sobe para 736), paredes 98 a 102, terceira
   camada 63 a 65, zonas 57 a 60.
   Carrega depois do mundo do Reino (255) e antes do 103 (quem vem embaixo começa onde esta camada termina). */

const MAR = true;
const MS_D = 186;                                   // metros de camada
// a camada logo acima: a primeira linha, a altura, o chão natural, a rocha em que as últimas linhas afinam e os
// poços de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }); quem não existe ainda é pulado
function msAbove() {
  if (typeof ELFOS !== 'undefined' && ELFOS && typeof EL_S0 !== 'undefined')
    return { id: 'elfos', S0: EL_S0, D: EL_D, soils: typeof EL_SOILS !== 'undefined' ? EL_SOILS : null, halls: typeof elExits !== 'undefined' ? elExits : [], climb: typeof EL_ESCADA !== 'undefined' ? EL_ESCADA : CHAIN, boss: typeof elBoss !== 'undefined' ? elBoss : null, thin: typeof EL_PEDRA_POCO !== 'undefined' ? EL_PEDRA_POCO : STONE, root: typeof EL_RAIZ !== 'undefined' ? EL_RAIZ : null };
  if (typeof NAVE !== 'undefined' && NAVE && typeof NV_S0 !== 'undefined')
    return { id: 'nave', S0: NV_S0, D: NV_D, soils: typeof NV_SOILS !== 'undefined' ? NV_SOILS : null, halls: typeof nvExits !== 'undefined' ? nvExits : [], climb: typeof NV_ESCADA !== 'undefined' ? NV_ESCADA : CHAIN, boss: typeof nvBoss !== 'undefined' ? nvBoss : null, thin: typeof NV_REATOR !== 'undefined' ? NV_REATOR : STONE, root: null };
  if (typeof COLMEIA !== 'undefined' && COLMEIA && typeof CM_S0 !== 'undefined')
    return { id: 'colmeia', S0: CM_S0, D: CM_D, soils: typeof CM_SOILS !== 'undefined' ? CM_SOILS : null, halls: typeof cmExits !== 'undefined' ? cmExits : [], climb: typeof CM_ESCADA_FAVO !== 'undefined' ? CM_ESCADA_FAVO : CHAIN, boss: typeof cmBoss !== 'undefined' ? cmBoss : null, thin: typeof CM_CERA_REAL !== 'undefined' ? CM_CERA_REAL : STONE, root: null };
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE, root: null };
}
const MS_TOP = (typeof EL_TOP !== 'undefined' ? EL_TOP : 1860) + 186;   // metros abaixo do chão do vilarejo (2046)
// topo de cada faixa em metros abaixo do MS_TOP: Praias Negras, Floresta de Algas, A Fossa, Chaminés Negras, (rocha-mãe)
const MS_BANDS = [0, 46, 98, 150, 186];
const MS_BAND_NAMES = ['praias', 'floresta', 'fossa', 'chamines'];
const MS_ZONE0 = 57;                                // zonas 57..60 (o 268 põe os nomes por índice)
const MS_TETO = 6, MS_NIVEL_D = 32;                 // o teto do vão e o nível do mar, em metros abaixo do topo da camada
let MS_S0 = (() => { const a = msAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (msBuild acerta)
let MS_NIVEL = MS_S0 + MS_NIVEL_D;                  // a primeira linha de água do mar (o msBuild acerta)

// blocos sólidos (704 a 716)
// areia negra (praias e fundo raso), rocha do mar (basalto molhado), rocha de cracas (penhascos e cascos velhos),
// recife (coral morto claro, furado), coral vivo (rosa e laranja apagados, luz fraca), lodo (o fundo da Fossa),
// sulfeto (as Chaminés), casco de navio (tábua alcatroada), convés (tábua clara gasta), pedra entalhada (os templos da
// gente-peixe), carvão, oricalco (na rocha) e a Onda Parada (a parede de água em pé da luta do Leviatã)
const MS_AREIA = 704, MS_ROCHA = 705, MS_CRACAS = 706, MS_RECIFE = 707, MS_CORAL = 708, MS_LODO = 709, MS_SULFETO = 710, MS_CASCO = 711,
  MS_CONVES = 712, MS_TEMPLO = 713, MS_O_CARVAO = 714, MS_O_ORICALCO = 715, MS_BARREIRA = 716;
// decoração de 1 bloco, não sólida (717 a 729): alga alta (empilha), anêmona (luz rosa), concha luminosa (luz ciano),
// corrente de âncora (escala, também debaixo da água), escada de cordame (escala), lanterna de óleo de peixe (teto,
// luz verde), estalactite pingando, vermes-tubo, espinha de peixe grande, cacho de mexilhões (teto), respiro de vapor
// (Chaminés), estaca de palafita (do chão ao piso, regra das colunas) e a fonte de bolhas (o pé dos respiradouros)
const MS_ALGA = 717, MS_ANEMONA = 718, MS_CONCHA = 719, MS_CORRENTE = 720, MS_CORDAME = 721, MS_LANTERNA = 722, MS_ESTALAC = 723,
  MS_VERMES = 724, MS_ESPINHA = 725, MS_MEXILHAO = 726, MS_RESPIRO = 727, MS_ESTACA = 728, MS_FONTE = 729;
// o oricalco também nasce no sulfeto das Chaminés: o mesmo minério sobre a outra rocha (730); 731 a 735 livres
const MS_O_ORICALCO_S = 730;
// paredes de fundo
const WMS_ROCHA = 98, WMS_RECIFE = 99, WMS_CASCO = 100, WMS_TEMPLO = 101, WMS_SULFETO = 102;
// terceira camada (DEEPT): o horizonte (ilhas e cascos ao longe com pontinhos de luz), o fundo (azul quase preto com
// vultos enormes) e as chaminés ao longe soltando fumaça
const DP_MS_HORIZONTE = 63, DP_MS_FUNDO = 64, DP_MS_CHAMINES = 65;

// metros abaixo do topo da camada -> linha
const msY = d => MS_S0 + d;
// em que faixa está uma linha: 0 praias, 1 floresta, 2 fossa, 3 chaminés, -1 acima, 4 abaixo
function marBand(ty) { const d = ty - MS_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < MS_BANDS[b + 1]) return b; return 4; }
const inMar = ty => ty >= MS_S0 && ty < MS_S0 + MS_D;
/* postos enquanto o mundo é gerado:
   msEntries  as duas descidas do Reino { x0, fy, top, land }: o cordame na coluna x0 + 1 desce da raiz até a praia
   msLand     as duas Câmaras de Pouso { x0, fy, w, h } (chão em fy, ar de fy - h a fy - 1): sem spawn, conchas acesas
   msExits    os dois Poços de Vapor de onde a camada de baixo desce { x0, x1, cx, fy, w, top } (lida como halls)
   msBoss     o mar do Leviatã { cx, x0, x1, w, fy, sl, top, bar: [xL, xR] }: mar aberto de 140 de largura com o
              fundo em fy; o 265 deixa só a água, o 266 veste (msDress) com a Nau Sem Nome, o recife e os destroços
   msIslands  as ilhas { x0, x1, cx, top, shore: [xL, xR] } (o topo é a linha do chão mais alto)
   msShips    os navios encalhados { x0, len, deck, dir }; msHulls os cascos de quilha para cima { x0, w, top, bot, air }
   msVillages as palafitas { x0, x1, deck }; msTemples os templos { x0, w, fy, top, dome }; msTrenches as fendas
              { cx, w, top, bot }; msGrottos as grutas secas das Chaminés { cx, cy, w, h, fy } */
let msEntries = [], msLand = [], msExits = [], msBoss = null, msIslands = [], msShips = [], msHulls = [], msVillages = [], msTemples = [], msTrenches = [], msGrottos = [];
const msKeep = new Set();   // descidas, pousos, poços de vapor, a Nau: túneis, decoração e objetos não mexem
// dentro do mar do Leviatã (entre as duas Ondas Paradas, do teto ao fundo), com margem m
function inMsHall(tx, ty, m = 0) { const B = msBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inMsLand = (tx, ty, m = 0) => msLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);

/* ---------- estados que o mar põe no herói (o 269 conta o tempo, desenha e solta) ----------
   puxado: uma mão escamada no tornozelo leva o herói para o fundo por `sec` segundos (afunda a 70 px/s, não nada
     para cima; o fôlego corre); golpear quem puxa solta.
   bolha: preso numa bolha por `sec` segundos: flutua devagar para cima, não anda, perde fôlego até em terra.
   tinta: uma nuvem de tinta de polvo em (x, y) que apaga a luz em volta por `sec` segundos. */
function msPuxar(sec, src) { if (!pl || pl.dead) return; pl.msPuxaT = Math.max(pl.msPuxaT || 0, sec); pl.msPuxaE = src || null; }
function msBolha(sec) { if (!pl || pl.dead) return; pl.msBolhaT = Math.max(pl.msBolhaT || 0, sec); }
const msTintas = [];
function msTinta(x, y, sec = 4, r = 40) { if (msTintas.length < 12) msTintas.push({ x, y, t: 0, sec, r }); }
const msPreso = () => !!(pl && (pl.msBolhaT > 0 || pl.msPuxaT > 0));
// as cores do mar: o ciano do plâncton e das conchas, o rosa das anêmonas, o verde do óleo de peixe, o laranja das chaminés
const MS_COL = { ciano: '#6ae8d8', cianoF: '#2a9490', rosa: '#ff8ab0', oleo: '#c8e05a', laranja: '#ff8a3a', espuma: '#e0f4ff', agua: '#2a6688', oricalco: '#e0d870', sangue: '#3a6a5a' };
