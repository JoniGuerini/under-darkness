'use strict';

/* ================= a Nave Caída: ids, faixas e profundidades =================
   A décima camada, debaixo da Colmeia e em cima do Abismo (docs/camadas/10-nave-caida.md). Há eras
   uma nave dos Visitantes, os homenzinhos verdes de olhos pretos, caiu do céu, furou a terra e só parou aqui embaixo.
   O reator nunca apagou: a nave inteira ainda acende em neon, as cápsulas de espécime ainda guardam o que eles levaram
   das camadas de cima, os discos ainda saem para abduzir e, no planetário do núcleo, o Olho-Cometa ainda vigia.
   A luz desta camada é toda da própria nave: tubos de neon, painéis, hologramas, a gosma verde e o plasma do reator.
   Arquivos (240 a 249; prefixo de função `nv`, de constante `NV_`):
     240-nave-api          este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     241-nave-blocos       texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o neon
     242-nave-objetos      os objetos de cena e o plano por faixa (NV_PROP_PLAN)
     243-nave-visitantes   visitante, atirador, disco abdutor, olho vigia, gosma viva
     244-nave-visitantes2  olhudinhos, astronauta perdido, cabeção, hipnotizador, foguete errante
     245-nave-mundo        geração (a cratera, o casco, os laboratórios, o núcleo), as descidas da Colmeia, as saídas
                           para o Abismo, zonas, spawn, nível, partículas, lojas, a xenita na fornalha
     246-olho-cometa       o chefe: O Planetário, o Olho-Cometa, as 3 fases, o rastro arco-íris, o lendário
     247-xenita            o metal na forja (9 peças), os materiais e as três bases da camada
     248-nave-save         nomes das zonas, o save (wg 16)
     249-nave-estados      hipnose (controles trocados), abdução (o feixe que puxa), gosma (lento), as Salas sem Peso
                           e o elevador de feixe
   Números fora da reserva do 00-geral (a camada não estava no mapa das 16): blocos 640 a 671 (NT subiu para 672),
   paredes 88 a 92, terceira camada 57 a 59, zonas 49 a 52 (depois das da Escuridão).
   Carrega depois do mundo da Colmeia (195) e antes do 103 (o Abismo começa onde esta camada termina). */

const NAVE = true;
const NV_D = LAYER_D;                                   // metros de camada
// a camada logo acima: a primeira linha, a altura, o chão natural, a rocha em que as últimas linhas afinam e os
// escorredouros de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }); quem não existe ainda é pulado
function nvAbove() {
  if (typeof COLMEIA !== 'undefined' && COLMEIA && typeof CM_S0 !== 'undefined')
    return { id: 'colmeia', S0: CM_S0, D: CM_D, soils: typeof CM_SOILS !== 'undefined' ? CM_SOILS : null, host: null, halls: typeof cmExits !== 'undefined' ? cmExits : [], climb: typeof CM_ESCADA_FAVO !== 'undefined' ? CM_ESCADA_FAVO : CHAIN, boss: typeof cmBoss !== 'undefined' ? cmBoss : null, thin: typeof CM_CERA_REAL !== 'undefined' ? CM_CERA_REAL : STONE };
  if (typeof ANOES !== 'undefined' && ANOES && typeof AN_S0 !== 'undefined')
    return { id: 'anoes', S0: AN_S0, D: AN_D, soils: typeof AN_SOILS !== 'undefined' ? AN_SOILS : null, host: null, halls: typeof anExits !== 'undefined' ? anExits : [], climb: typeof AN_CORRENTE !== 'undefined' ? AN_CORRENTE : CHAIN, boss: typeof anBoss !== 'undefined' ? anBoss : null, thin: STONE };
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, host: null, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const NV_TOP = (typeof CM_TOP !== 'undefined' ? CM_TOP : 1488) + LAYER_D;   // metros abaixo do chão do vilarejo (1674)
// topo de cada faixa em metros abaixo do NV_TOP: A Cratera de Impacto, O Casco, Os Laboratórios, O Núcleo, (rocha-mãe)
const NV_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const NV_BAND_NAMES = ['cratera', 'casco', 'laboratorios', 'nucleo'];
const NV_ZONE0 = 49;                                // zonas 49..52 (o 248 põe os nomes depois das da Escuridão)
let NV_S0 = (() => { const a = nvAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (nvBuild acerta)

// blocos sólidos (640 a 654)
// vidro de impacto (a rocha da colmeia que o calor da queda fundiu em vidro verde-escuro), escória com rachaduras
// verdes acesas, chapa do casco, painel de neon (luz), grade de piso, liga alienígena (laboratórios, perolada), vidro
// de laboratório (ciano, translúcido), gosma verde endurecida (mole, luz fraca), cristal de plasma (arco-íris, luz),
// metal do reator (branco-violeta, quente), a barreira de energia das portas do Planetário (não quebra), carvão na
// escória, xenita, o rastro arco-íris do Olho-Cometa (sólido por poucos segundos, nunca vai para o save) e o anel
// holográfico do planeta do Planetário
const NV_VIDRO_IMPACTO = 640, NV_ESCORIA = 641, NV_CASCO = 642, NV_PAINEL_NEON = 643, NV_GRADE = 644, NV_LIGA = 645, NV_VIDRO = 646, NV_GOSMA = 647,
  NV_PLASMA = 648, NV_REATOR = 649, NV_BARREIRA = 650, NV_O_CARVAO = 651, NV_O_XENITA = 652, NV_RASTRO = 653, NV_ANEL = 654;
// decoração de 1 bloco, não sólida (655 a 669): escada de serviço (escala), cabo pendurado (escala como a corrente),
// tubo de neon no teto (luz, cor pela posição), gosma pingando, poça de gosma (lenta), capacete de astronauta, destroço
// pequeno do casco, fiação faiscando, planta alienígena (bulbo que brilha), projetor de holograma (um planetinha, uma
// estrela ou um disco girando em cima), escora do casco (do chão ao teto), estrelinha de neon na parede, potinho de
// espécime, o feixe do elevador (a coluna arco-íris que levanta quem entra; escala) e o emissor do feixe (no chão)
const NV_ESCADA = 655, NV_CABO = 656, NV_NEON = 657, NV_GOTA = 658, NV_POCA = 659, NV_CAPACETE = 660, NV_DESTROCO = 661, NV_FIACAO = 662,
  NV_PLANTA = 663, NV_HOLO = 664, NV_ESCORA = 665, NV_ESTRELA = 666, NV_POTE = 667, NV_FEIXE = 668, NV_EMISSOR = 669;
// o planeta holográfico do Planetário: sólido, listrado de vermelho e laranja como o adesivo (670)
const NV_PLANETA = 670;
// paredes de fundo
const WNV_ROCHA = 88, WNV_CASCO = 89, WNV_LAB = 90, WNV_REATOR = 91, WNV_NEON = 92;
// terceira camada (DEEPT): o céu holográfico que a nave ainda projeta, as costelas da nave ao longe, os tanques gigantes
const DP_NV_CEU = 57, DP_NV_COSTELAS = 58, DP_NV_TANQUES = 59;

// metros abaixo do topo da camada -> linha
const nvY = d => NV_S0 + d;
// em que faixa está uma linha: 0 cratera, 1 casco, 2 laboratórios, 3 núcleo, -1 acima, 4 abaixo
function naveBand(ty) { const d = ty - NV_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < NV_BANDS[b + 1]) return b; return 4; }
const inNave = ty => ty >= NV_S0 && ty < NV_S0 + NV_D;
/* postos enquanto o mundo é gerado:
   nvEntries  as duas descidas da Colmeia { x0, fy, top, land }: a escada de serviço na coluna x0 + 1, fy o chão do pouso
   nvLand     as duas Cápsulas de Pouso { x0, fy, w, h } (chão em fy, ar de fy - h a fy - 1): sem spawn, luz de emergência
   nvExits    os dois Rasgos no Casco de onde o Abismo desce { x0, x1, cx, fy, w, top } (o Abismo lê como halls)
   nvBoss     o Planetário { cx, cy, r, x0, x1, top, bot, fy, doors: [{ x, fy, side }], planet: { cx, cy, r }, ring: { rx, ry } }
              uma esfera de raio r em volta de (cx, cy); o 245 cava a esfera vazia e o 246 veste (nvDress) com o planeta,
              o anel, as portas e a barreira
   nvSemPeso  as Salas sem Peso do Casco { x0, x1, top, fy }: lá dentro a gravidade cai para 35% (249)
   nvLifts    os elevadores de feixe { x, y0, y1 }: a coluna x de y0 (o topo) a y1 (o emissor no chão) */
let nvEntries = [], nvLand = [], nvExits = [], nvBoss = null, nvSemPeso = [], nvLifts = [];
const nvKeep = new Set();   // descidas, pousos, rasgos, elevadores, o Planetário: túneis, decoração e objetos não mexem
// dentro do Planetário, com margem m
function inNvHall(tx, ty, m = 0) { const B = nvBoss; if (!B) return false; const dx = wdx(tx - B.cx), dy = ty - B.cy; return dx * dx + dy * dy <= (B.r + m) * (B.r + m); }
const inNvLand = (tx, ty, m = 0) => nvLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
const inNvSemPeso = (tx, ty) => nvSemPeso.some(S => wdx(tx - S.x0) >= 0 && wdx(tx - S.x0) <= wdx(S.x1 - S.x0) && ty >= S.top && ty < S.fy);

/* ---------- estados que os Visitantes põem no herói (o 249 conta o tempo, desenha e solta) ----------
   hipnose: os controles de andar trocam de lado (A anda para a direita) por `sec` segundos; um anel arco-íris gira em
   volta da cabeça. Poção de vida ou levar dano de novo não solta; o tempo só corre.
   abdução: o herói é puxado para cima até a fonte (um disco) com velocidade `vy` px/s enquanto estiver no feixe; ao
   sair do feixe (ou o disco morrer, ou o feixe acabar) ele cai normalmente.
   gosma: lento como a poça de mel da Colmeia (40% mais lento) por `sec` segundos, os pés verdes. */
function nvHipnotizar(sec) { if (!pl || pl.dead) return; pl.nvHipT = Math.max(pl.nvHipT || 0, sec); }
function nvAbduzir(src, vy = 140) { if (!pl || pl.dead) return; pl.nvAbdSrc = src || null; pl.nvAbdVy = vy; pl.nvAbdT = 0.12; }
function nvGrudar(sec) { if (!pl || pl.dead) return; pl.nvGosmaT = Math.max(pl.nvGosmaT || 0, sec); }
// um alarme: os Visitantes a até r blocos de (x, y) em pixels vêm ver (o disco e o olho vigia disparam; 243 escuta)
const nvAlarms = [];
function nvAlarme(x, y, r = 14) { nvAlarms.push({ x, y, r, t: 0.1 }); }
// as cores do neon da nave, para blocos, objetos, bichos e o chefe: verde-gosma, rosa, ciano, violeta, amarelo e o
// arco-íris do adesivo (vermelho, laranja, amarelo, verde, azul, violeta)
const NV_NEON_COL = { verde: '#7dff3a', rosa: '#ff3ec8', ciano: '#36f0ff', violeta: '#a64dff', amarelo: '#ffe53a', branco: '#e8fbff' };
const NV_ARCO = ['#ff3b3b', '#ff9a2e', '#ffe53a', '#5dff4a', '#3aa8ff', '#9a4dff'];
