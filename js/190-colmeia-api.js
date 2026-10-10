'use strict';

/* ================= a Colmeia: ids, faixas e profundidades =================
   A nona camada, debaixo da Fortaleza dos Anões (docs/camadas/09-colmeia.md, docs/colmeia-spec.md). Uma colmeia de
   insetos gigantes que cavou de baixo para cima, engoliu os salões de baixo dos anões em cera e resina e guarda nas
   câmaras de âmbar tudo o que prendeu no caminho. É a única camada construída por bichos: tudo estreito, morno, curvo
   e hexagonal, sem vão grande fora das câmaras de âmbar e da esfera da Rainha.
   Arquivos (190 a 199; os 160 a 169 da ficha ficaram para outra coisa, prefixo de função `cm`):
     190-colmeia-api        este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     191-colmeia-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco
     192-colmeia-objetos    os 28 objetos de cena e o plano por faixa (CM_PROP_PLAN)
     193-colmeia-insetos    operária, soldada porteira, formiga-leão, correição, larva faminta
     194-colmeia-insetos2   vespa-resineira, vespa-parasita, zangão, besouro-bombardeiro, cigarra-tambor
     195-colmeia-mundo      geração (salões tomados, labirinto de cera, favais, câmaras de âmbar, berçário), brechas,
                            escorredouros, funis, zonas, spawn, nível, partículas, lojas
     196-rainha-colmeia     a chefe: a esfera de favos, as 3 fases, o Ferrão Real
     197-ambrita            o metal na forja (9 peças), os materiais e as três bases da camada
     198-colmeia-save       nomes das zonas, o save (wg), os blocos lacrados pelas operárias
     199-colmeia-estados    encasulado, ovo de parasita, blocos que soltam larva (HATCH), a operária que lacra
   Decisões (Jonathan pediu sem perguntas, 2026-10-10; ficaram as recomendadas da ficha): a operária lacra com Cera
   Nova o que o herói quebrou nos últimos 60 s, nunca perto dele; a larva come o loot do chão mas devolve ao morrer;
   túneis de no máximo 12 de altura fora das câmaras, o zangão só nas Câmaras e no Berçário.
   A camada de cima é a que estiver no disco: a Fortaleza (AN_), senão a Floresta (FP_), senão a Cidade (CD_).
   Carrega depois do mundo da camada de cima e antes do 103 (o Abismo começa onde esta camada termina). */

const COLMEIA = true;
const CM_D = 186;                                   // metros de camada
// a camada logo acima: a primeira linha, a altura, o chão natural, a rocha em que as últimas linhas afinam e as
// salas de onde as duas brechas descem ({ cx, fy } ou { x0, fy }); quem não existe ainda é pulado
function cmAbove() {
  if (typeof ANOES !== 'undefined' && ANOES && typeof AN_S0 !== 'undefined')
    return { id: 'anoes', S0: AN_S0, D: AN_D, soils: typeof AN_SOILS !== 'undefined' ? AN_SOILS : null, host: typeof AN_HOST !== 'undefined' ? AN_HOST : null, halls: typeof anExits !== 'undefined' ? anExits : [], climb: typeof AN_CORRENTE !== 'undefined' ? AN_CORRENTE : CHAIN };
  if (typeof FLORESTA !== 'undefined' && FLORESTA && typeof FP_S0 !== 'undefined')
    return { id: 'floresta', S0: FP_S0, D: FP_D, soils: typeof FP_SOILS !== 'undefined' ? FP_SOILS : null, host: typeof FP_HOST !== 'undefined' ? FP_HOST : null, halls: typeof fpExits !== 'undefined' ? fpExits : [], climb: typeof FP_RAIZ_ESCADA !== 'undefined' ? FP_RAIZ_ESCADA : CHAIN };
  return { id: 'cidade', S0: CD_S0, D: CD_D, soils: CD_SOILS, host: CD_HOST, halls: cdDown, climb: CD_ESCADA };
}
const CM_TOP_ABOVE = (() => { const a = cmAbove(); return a.id === 'anoes' ? (typeof AN_TOP !== 'undefined' ? AN_TOP : null) : a.id === 'floresta' ? (typeof FP_TOP !== 'undefined' ? FP_TOP : null) : CD_TOP; })();
const CM_TOP = (CM_TOP_ABOVE !== null ? CM_TOP_ABOVE : CD_TOP + 186 * (layerPos('colmeia') - layerPos('cidade') - 1)) + 186;   // metros abaixo do chão do vilarejo
// topo de cada faixa em metros abaixo do CM_TOP: Brecha Tomada, Galerias de Cera, Câmaras de Âmbar, O Berçário, (rocha-mãe)
const CM_BANDS = [0, 42, 92, 138, 186];
const CM_BAND_NAMES = ['brecha', 'galerias', 'camaras', 'bercario'];
const CM_ZONE0 = 41;                                // zonas 41..44 (o 198 põe os nomes depois das da Fortaleza)
let CM_S0 = (() => { const a = cmAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (cmBuild acerta)

// blocos sólidos (384 a 398)
const CM_CERA = 384, CM_CERA_NOVA = 385, CM_FAVO = 386, CM_FAVO_MEL = 387, CM_RESINA = 388, CM_AMBAR = 389, CM_AMBAR_FOSSIL = 390, CM_PEDRA_TOMADA = 391,
  CM_CERA_REAL = 392, CM_QUITINA = 393, CM_OVO = 394, CM_O_CARVAO = 395, CM_O_AMBRITA = 396, CM_FAVO_REAL = 397, CM_LACRE = 398;
// decoração de 1 bloco, não sólida (399 a 410): mel pingando, estalactite de resina (até 3 em corrente), escada de
// favos (escala), fio de cera (escala como a corrente), larva luminosa, casulo, ossos de anão, poça de mel (lenta),
// bolha de resina, asa caída, lanterna anã, coluna de cera (do chão ao teto)
const CM_GOTA_MEL = 399, CM_ESTALAC = 400, CM_ESCADA_FAVO = 401, CM_FIO_CERA = 402, CM_LARVA_LUZ = 403, CM_CASULO = 404, CM_OSSOS_ANAO = 405, CM_POCA_MEL = 406,
  CM_BOLHA = 407, CM_ASA = 408, CM_LANTERNA_ANA = 409, CM_COLUNA = 410;
// o pó de cera do funil da formiga-leão: sólido, mas o herói afunda e escorrega para o centro (411)
const CM_PO_CERA = 411;
// paredes de fundo
const WCM_PEDRA = 53, WCM_CERA = 54, WCM_FAVO = 55, WCM_RESINA = 56, WCM_REAL = 57;
// terceira camada (DEEPT)
const DP_CM_FAVOS = 36, DP_CM_AMBAR = 37, DP_CM_FORTALEZA = 38;

// metros abaixo do topo da camada -> linha
const cmY = d => CM_S0 + d;
// em que faixa está uma linha: 0 brecha, 1 galerias, 2 câmaras, 3 berçário, -1 acima, 4 abaixo
function colmeiaBand(ty) { const d = ty - CM_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < CM_BANDS[b + 1]) return b; return 4; }
const inColmeia = ty => ty >= CM_S0 && ty < CM_S0 + CM_D;
// postos enquanto o mundo é gerado: as duas brechas de cima ({ x0, fy, top, land }: a escada na coluna x0 + 1), os
// dois escorredouros de onde o Mar Sem Sol vai descer ({ x0, x1, cx, fy, w }: as posições ficam aqui para a camada de
// baixo), a esfera da Rainha { cx, cy, r, x0, x1, top, bot, doors } e os funis da formiga-leão { cx, fy, r }
let cmEntries = [], cmExits = [], cmBoss = null, cmFunnels = [];

/* ---------- estados que os insetos põem no herói (o 199 conta o tempo, desenha e solta) ----------
   encasulado: resina dura em volta, não anda nem ataca por `sec` segundos; A e D alternados soltam antes (a vespa).
   ovo: um ovo de vespa-parasita no peito; eclode em 5 s (dano dobrado e uma larva) se a vespa não morrer ou ele
   não beber poção antes.
   lento: o mesmo das Minas Fúngicas (fungLentidao, 120), a poça de mel e o funil. */
function cmEncasular(sec) { if (pl.dead) return; pl.cmCasuloT = Math.max(pl.cmCasuloT || 0, sec); pl.cmCasuloK = 0; }
function cmPorOvo(src) { if (pl.dead || (pl.cmOvoT || 0) > 0) return; pl.cmOvoT = 5; pl.cmOvoSrc = src || null; pl.cmOvoDmg = src ? src.dmg : 20; }
// um chamado: as operárias a até r blocos de (x, y) em pixels vêm (a operária bate as antenas; 193 escuta)
const cmCalls = [];
function cmChamar(x, y, r = 12) { cmCalls.push({ x, y, r, t: 0.1 }); }

/* ---------- blocos que soltam bicho (199 faz a quebra) ----------
   HATCH[id] = chance de sair uma larva quando o bloco quebra (pelo herói, pela Rainha, por quem for). Cada bloco solta no
   máximo uma; a larva não conta no limite de spawn da faixa. Fora da Colmeia nada está marcado. */
const HATCH = new Float32Array(NT);
HATCH[CM_OVO] = 0.3; HATCH[CM_FAVO_REAL] = 0.4;
