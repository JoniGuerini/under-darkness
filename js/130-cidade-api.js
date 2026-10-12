'use strict';

/* ================= a Cidade Afundada: ids, faixas e profundidades =================
   A sexta camada, debaixo das Minas Fúngicas (docs/camadas/06-cidade-afundada.md, docs/cidade-spec.md). Uma cidade
   inteira que a terra engoliu de uma vez, torta e meio alagada: as cisternas no alto, as ruas e casas no meio, o
   palácio e a torre do sino no fundo. É a única camada com gente viva: saqueadores atrás da prata e o culto do Poço.
   Arquivos (130 a 139, os reservados para a camada 6 no 00-geral; prefixo de função `cd`):
     130-cidade-api        este: ids, faixas, ajudantes de profundidade, os estados que os humanos põem no herói
     131-cidade-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco
     132-cidade-objetos    os 28 objetos de cena e o plano por faixa (CD_PROP_PLAN)
     133-cidade-vivos      comportamento humano; saqueador, besteiro, armadilheiro, telhadeiro
     134-cidade-culto      noviços, pregador, penitente, emparedador (e a Parede Fresca)
     135-cidade-afogados   afogado e a que boia
     136-cidade-mundo      geração (quarteirões tortos), descidas, zonas, spawn, nível, partículas, loja
     137-sineiro-afogado   o chefe: a Torre do Sino que desaba, as 3 fases, o Badalo do Sineiro
     138-prata             o metal na forja (9 peças), os materiais e as três bases da camada
     139-cidade-save       nomes das zonas, a água refeita no fim da geração, o tom da água, o save (wg 11)
   Decisões do Jonathan (2026-10-10): dá para descer de corda no Grande Poço até a tampa (não há nada lá); o saqueador
   só pega drop de monstro, nunca o que o herói soltou; a Parede Fresca do emparedador some sozinha em 30 s.
   Carrega logo depois do 126-mae-esporo e antes do 103 (o Abismo começa onde esta camada termina). */

const CIDADE = true;
const CD_D = LAYER_D;                                   // metros de camada
const CD_TOP = FG_TOP + LAYER_D;                        // onde a camada começa, em metros abaixo do chão do vilarejo (930)
// topo de cada faixa em metros abaixo do CD_TOP: Cisternas Altas, Ruas Tortas, Bairro do Poço, Palácio do Sino, (rocha-mãe)
const CD_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const CD_BAND_NAMES = ['cisternas', 'ruas', 'bairro', 'palacio'];
const CD_ZONE0 = 29;                                // zonas 29..32 (o 139 põe os nomes depois das das Minas Fúngicas)
let CD_S0 = FG_S0 + FG_D;                           // a primeira linha da camada no mundo atual (cdBuild acerta)

// blocos sólidos (288 a 301)
const CD_ATERRO = 288, CD_CANTARIA = 289, CD_TIJOLO = 290, CD_CALCAMENTO = 291, CD_TELHA = 292, CD_MADEIRAME = 293, CD_LIMO = 294, CD_LODO = 295,
  CD_MARMORE = 296, CD_PEDRA_POCO = 297, CD_ENTULHO = 298, CD_BARREIRA = 299, CD_O_CARVAO = 300, CD_O_PRATA = 301;
// decoração de 1 bloco, não sólida (302 a 313): escada de corda (escala), corrente de cisterna (escala), velas do
// culto, lanterna de saqueador, alga negra, goteira, oferenda, trouxa de saque, ossos com lodo, placa de loja,
// sininhos do culto, coluna da cisterna (do chão ao teto)
const CD_ESCADA = 302, CD_CORRENTE = 303, CD_VELAS = 304, CD_LANTERNA = 305, CD_ALGA = 306, CD_GOTEIRA = 307, CD_OFERENDA = 308, CD_TROUXA = 309,
  CD_OSSOS = 310, CD_PLACA = 311, CD_SININHOS = 312, CD_COLUNA = 313;
// a Parede Fresca do emparedador: sólida, quebra fácil, some em 30 s, nunca vai para o save
const CD_PAREDE_FRESCA = 314;
// paredes de fundo
const WCD_CANTARIA = 38, WCD_TIJOLO = 39, WCD_LIMO = 40, WCD_MADEIRA = 41, WCD_MARMORE = 42;
// terceira camada (DEEPT)
const DP_CD_ATERRO = 27, DP_CD_CASAS = 28, DP_CD_ARCOS = 29;

// metros abaixo do topo da camada -> linha
const cdY = d => CD_S0 + d;
// em que faixa está uma linha: 0 cisternas, 1 ruas, 2 bairro, 3 palácio, -1 acima (as Minas Fúngicas), 4 abaixo
function cidadeBand(ty) { const d = ty - CD_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < CD_BANDS[b + 1]) return b; return 4; }
const inCidade = ty => ty >= CD_S0 && ty < CD_S0 + CD_D;
// postos enquanto o mundo é gerado: as duas entradas de cima ({ x0, fy, top }, o cordão na coluna x0 + 1), as duas
// adegas de onde o Abismo desce ({ x0, x1, cx, fy, w }), a Torre do Sino { x0, x1, cx, w, top, fy } e o Grande Poço
// { x0, x1, cx, top, bot }
let cdEntries = [], cdDown = [], cdBoss = null, cdPoco = null;

/* ---------- estados que os humanos põem no herói (o 136 conta o tempo e aplica) ----------
   marcado: os inimigos da camada dão 20% a mais e vão direto nele por `sec` segundos (o pregador).
   encharcado: pulo menor por `sec` segundos (a que boia).
   enredado: sem atacar por `sec` segundos (a rede do armadilheiro).
   lento: o mesmo das Minas Fúngicas (fungLentidao, 120). */
function cdMarcar(sec) { if (pl.dead) return; pl.cdMarcaT = Math.max(pl.cdMarcaT || 0, sec); }
function cdEncharcar(sec) { if (pl.dead) return; pl.cdMolhadoT = Math.max(pl.cdMolhadoT || 0, sec); }
function cdEnredar(sec) { if (pl.dead) return; pl.cdRedeT = Math.max(pl.cdRedeT || 0, sec); }
// um alarme: chama os humanos a até r blocos para (x, y) em pixels (133 escuta)
const cdAlarms = [];
function cdAlarme(x, y, r = 20) { cdAlarms.push({ x, y, r, t: 0.1 }); }
