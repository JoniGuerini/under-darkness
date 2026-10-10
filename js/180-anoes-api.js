'use strict';

/* ================= a Fortaleza dos Anões: ids, faixas e profundidades =================
   A oitava camada, debaixo da Floresta Petrificada (docs/camadas/08-fortaleza-anoes.md, docs/anoes-spec.md). Brasafunda,
   a fortaleza do Clã da Bigorna: salões de cantaria e bronze, lava domada em canais retos com grade por cima, forjas de
   runas que ainda trabalham sozinhas. Os anões subiram; ficaram as máquinas cumprindo a última ordem (guardar) e os
   fantasmas. Algo cavou de baixo (cera, quitina, buracos hexagonais): a Colmeia, a camada 9.
   Arquivos (180 a 189; a ficha fala em 150 a 159, que a numeração do disco já tinha usado; prefixo de função `an`):
     180-anoes-api          este: ids, faixas, ajudantes de profundidade, os postos que a geração preenche
     181-anoes-blocos       texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco
     182-anoes-objetos      os 28 objetos de cena e o plano por faixa (AN_PROP_PLAN)
     183-anoes-automatos    soldado de bronze, enxame de engrenagens, fornalha ambulante, runa viva, coruja de corda, bomba de lava
     184-anoes-fantasmas    besteiro fantasma, ferreiro fantasma, barba-de-ferro, juramentado
     185-anoes-mundo        geração (andares, salas, canais, eclusas), descidas, zonas, spawn, nível, partículas, lojas
     186-automato-forja     o chefe: a Grande Forja (anDress), o trilho, as alavancas da sala, o Malho da Grande Forja
     187-mithril            o metal na fornalha e na bigorna, os materiais, as 3 bases, a brasa domada na fornalha
     188-anoes-save         nomes das zonas, o save (wg 13), a ponte com o 87
     189-mecanismos-runas   alavancas e comportas, o Cinzel e a Bigorna de Runas do Grimaldo
   Decisões em aberto da ficha, tomadas aqui com a recomendação (2026-10-10, o Jonathan pediu sem perguntas):
     1. o Cinzel de Runas fica na Oficina do Mestre (achado explorando), não cai do chefe;
     2. a alavanca usa a tecla de usar que já existe (E); na Grande Forja bater com a arma também puxa;
     3. nenhum anão vivo por enquanto: só os sinais (a marca, o cinzel, a fala do Grimaldo).
   Carrega depois dos arquivos da Floresta Petrificada (140 a 149) e antes do 103 (o Abismo começa onde esta termina). */

const ANOES = true;
const AN_D = 186;                                   // metros de camada
// a camada de cima: a Floresta Petrificada (camada 7) quando existe; sem ela, a Cidade Afundada
const AN_FLORESTA = typeof FP_S0 !== 'undefined';
const AN_TOP = (AN_FLORESTA ? (typeof FP_TOP !== 'undefined' ? FP_TOP : CD_TOP + 186) : CD_TOP) + 186;   // metros abaixo do chão do vilarejo (1302)
// topo de cada faixa em metros abaixo do AN_TOP: Portões de Bronze, Salões do Clã, Canais de Lava, Forjas de Runas, (rocha-mãe)
const AN_BANDS = [0, 46, 98, 150, 186];
const AN_BAND_NAMES = ['portoes', 'saloes', 'canais', 'forjas'];
const AN_ZONE0 = 37;                                // zonas 37..40 (o 188 põe os nomes depois das da Floresta, 33 a 36)
let AN_S0 = AN_FLORESTA ? FP_S0 + FP_D : CD_S0 + CD_D;   // a primeira linha da camada no mundo atual (anBuild acerta)
// a camada de cima, do jeito que o 185 precisa: primeira linha, altura, o chão natural dela, a rocha que afina e as
// duas descidas ({ cx, x0, x1, fy, w, top }: fy é o chão da sala de cima onde o poço abre)
const anAbove = () => AN_FLORESTA
  ? { S0: FP_S0, D: FP_D, soils: typeof FP_SOILS !== 'undefined' ? FP_SOILS : null, thin: typeof FP_GRANITO !== 'undefined' ? FP_GRANITO : 0, thinW: typeof WFP_GRANITO !== 'undefined' ? WFP_GRANITO : 0, exits: typeof fpExits !== 'undefined' ? fpExits : [], boss: typeof fpBoss !== 'undefined' ? fpBoss : null }
  : { S0: CD_S0, D: CD_D, soils: CD_SOILS, thin: CD_ATERRO, thinW: WCD_TIJOLO, exits: cdDown, boss: cdBoss };

// blocos sólidos (352 a 365)
const AN_GRANITO = 352, AN_CANTARIA = 353, AN_LAJE = 354, AN_BRONZE = 355, AN_GRADE = 356, AN_CANAL = 357, AN_TIJOLO = 358, AN_EIXO = 359,
  AN_COMPORTA = 360, AN_CERA = 361, AN_BARREIRA = 362, AN_O_CARVAO = 363, AN_O_MITHRIL = 364, AN_ENTULHO = 365;
// decoração de 1 bloco, não sólida (366 a 377): escada anã (escala), corrente de bronze (escala), alavanca, lâmpada de
// runa, braseiro de forja, runa no piso, barril de cerveja, bigorna pequena, tenazes e malhos, respiro de vapor,
// casca de quitina, elmo anão caído
const AN_ESCADA = 366, AN_CORRENTE = 367, AN_ALAVANCA = 368, AN_LAMPADA = 369, AN_BRASEIRO = 370, AN_RUNA = 371, AN_BARRIL = 372, AN_BIGORNA = 373,
  AN_TENAZ = 374, AN_VAPOR = 375, AN_QUITINA = 376, AN_ELMO = 377;
// sólidos que vêm depois: a seteira (cantaria com fenda: o besteiro aparece nela) e a pedra quente que a Bomba de Lava
// deixa (some em 20 s, nunca vai para o save)
const AN_SETEIRA = 378, AN_PEDRA_QUENTE = 379;
// paredes de fundo
const WAN_GRANITO = 48, WAN_CANTARIA = 49, WAN_RELEVO = 50, WAN_BRONZE = 51, WAN_TIJOLO = 52;
// terceira camada (DEEPT)
const DP_AN_SALOES = 33, DP_AN_MAQUINAS = 34, DP_AN_FORJAS = 35;

// metros abaixo do topo da camada -> linha
const anY = d => AN_S0 + d;
// em que faixa está uma linha: 0 portões, 1 salões, 2 canais, 3 forjas, -1 acima, 4 abaixo
function dwarfBand(ty) { const d = ty - AN_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < AN_BANDS[b + 1]) return b; return 4; }
const inAnoes = ty => ty >= AN_S0 && ty < AN_S0 + AN_D;

/* ---------- postos preenchidos pelo 185 enquanto o mundo é gerado ----------
   anEntries: as duas escadarias do clã que descem da Floresta ({ x0, fy, top, land }: x0..x0+3 o poço, a escada anã na
   coluna x0 + 1; land é a guarita de pouso { x0, fy, w: 12, h: 6 }).
   anExits: as duas brechas para a Colmeia, no chão das Forjas ({ cx, x0, x1, fy, w, top, bot }: o buraco ocupa
   x0..x1, fy é a fileira do chão da sala, a corrente de bronze desce na coluna cx de fy até bot, a última linha
   cavada aqui; a camada 9 continua dali para baixo).
   anBoss: a Grande Forja { x0, x1, cx, w: 64, h: 28, top, fy, doors: [{ side, x, fy }] }: o ar do lado de dentro vai de
   top a fy - 1, o chão é a fileira fy, a casca tem 2 de espessura; as duas portas (4 de altura) ficam rentes ao chão
   nos dois lados. O 186 (anDress) monta o lado de dentro: trilho, canal, grades, plataformas, alavancas e bicas.
   anOficina: a Oficina do Mestre { x0, fy, w: 20, h: 10, cx } com o pedestal do Cinzel (o 189 desenha e entrega).
   anLevers: as alavancas da geração (as das eclusas): { x, y, targets: [i...] } com x, y a célula da alavanca e
   targets as células de AN_COMPORTA que ela abre e fecha. O estado vai no save da camada (188), não nos diffs.
   anChannels: os canais de lava { x0, x1, y }: y é a linha da lava de cima (2 de fundo), x0..x1 inclusivo.
   anSlits: as seteiras { x, y, room } (o 184 escolhe onde o besteiro aparece).
   anCarcacas: preenchido pelo 182/185 com os objetos de carcaça de autômato colocados (o 184 possui). */
let anEntries = [], anExits = [], anBoss = null, anOficina = null, anLevers = [], anChannels = [], anSlits = [], anRooms = [];
const anKeep = new Set();   // as escadarias, a guarita, as comportas e as bordas dos canais: túneis e decoração não mexem
// dentro da Grande Forja, com margem m
function inAnHall(tx, ty, m = 0) { const B = anBoss; return !!B && Math.abs(wdx(tx - B.cx)) < B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }

/* ---------- o que os monstros da camada põem no herói (o 185 conta o tempo) ----------
   queimando: a poça de pedra quente da Bomba de Lava, o cadinho e as grades em brasa do chefe: dano de fogo por tick.
   preso no círculo: o círculo de duelo do Juramentado (o 184 guarda o círculo e empurra o herói de volta). */
function anQueimar(sec, dps) { if (pl.dead) return; pl.anFogoT = Math.max(pl.anFogoT || 0, sec); pl.anFogoD = Math.max(pl.anFogoD || 0, dps); }
