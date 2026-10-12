'use strict';

/* ================= a Escuridão: ids, faixas e profundidades =================
   O fundo do mundo, debaixo do Abismo (docs/camadas/16-escuridao.md). Antes do mundo só havia a Escuridão; os
   Acendedores desceram com fogo e acenderam braseiros para segurá-la embaixo, e o mundo inteiro foi construído por
   cima dessa linha de fogo. Os braseiros se apagaram um por um e ela voltou a subir: é por isso que cada camada é mais
   escura que a de cima. Aqui a luz é o recurso, a arma e o escudo; no fundo espera Nox, Aquele Que Apaga.
   Arquivos (220 a 229, os reservados para a camada 16 no 00-geral; prefixo de função `es`):
     220-escuro-api        este: ids, faixas, ajudantes de profundidade, os postos que a geração anota
     221-escuro-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco
     222-escuro-objetos    os objetos de cena, o Mural dos Acendedores e o plano por faixa (ES_PROP_PLAN)
     223-escuro-luz        a luz como regra: lightAt, o escuro total, o dano da luz, tochas que acabam, braseiros,
                           o mapa que esquece, o breu vivo e a laje de penumbra
     224-escuro-crias      apagador, boca do breu, mariposa negra, vigia sem olhos, colosso de breu
     225-escuro-crias2     rastro, mortalha, ouvinte, acendedor oco, mão do fundo
     226-escuro-mundo      geração, as descidas do Abismo, a rota dos Acendedores, zonas, spawn, nível, partículas
     227-nox               o chefe: O Escuro Total, as seis piras, as 3 fases, o fim e A Última Brasa
     228-noctirio          o metal na forja (9 peças), os materiais e as três bases da camada
     229-escuro-save       nomes das zonas, o save (wg 15)
   Decisões do Jonathan (2026-10-10): a camada fica logo abaixo do Abismo (os números seguem a posição no 129); acender
   braseiro e pira gasta um lume-fátuo (a chama azul do bioma; tocha não acende nenhum dos dois); o herói não tem luz
   própria (0.9.7), então a luz da camada é toda de tochas, braseiros e piras. Carrega logo depois do 109-principe-caos e antes do 87 (o worldLink roda depois). */

const ESCURO = true;
const ES_D = LAYER_D;                                   // metros de camada
const ES_TOP = AB_TOP + LAYER_D;                        // onde a camada começa, em metros abaixo do chão do vilarejo
// topo de cada faixa em metros abaixo do ES_TOP: A Borda Apagada, O Breu, As Raízes da Noite, O Fundo do Mundo, (rocha-mãe)
const ES_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const ES_BAND_NAMES = ['borda', 'breu', 'raizes', 'fundo'];
const ES_ZONE0 = 45;                                // zonas 45..48 (o 229 põe os nomes depois das da Colmeia)
let ES_S0 = AB_S0 + AB_D;                           // a primeira linha da camada no mundo atual (esBuild acerta)

// blocos sólidos (576 a 588)
const ES_APAGADA = 576, ES_BREU = 577, ES_VIDRO = 578, ES_RAIZ = 579, ES_CASCA = 580, ES_PRIMEVA = 581, ES_LAVRADA = 582, ES_TIJOLO = 583,
  ES_BREU_VIVO = 584, ES_PENUMBRA = 585, ES_BARREIRA = 586, ES_O_CARVAO = 587, ES_O_NOCTIRIO = 588;
// decoração de 1 bloco, não sólida (589 a 602): braseiro apagado e aceso, tocha morta, lume-fátuo, corrente dos
// Acendedores (escala), raiz pendente (escala), espinho de vidro negro, estalagmite de vidro, ossada de Acendedor,
// olhos no escuro, sol gravado, coluna dos Acendedores (do chão ao teto), pira apagada e acesa (só na sala do Nox)
const ES_BRASEIRO_FRIO = 589, ES_BRASEIRO = 590, ES_TOCHA_MORTA = 591, ES_LUME = 592, ES_CORRENTE = 593, ES_RAIZ_PEND = 594, ES_ESPINHO = 595,
  ES_ESTALAG = 596, ES_OSSADA = 597, ES_OLHOS = 598, ES_SOL = 599, ES_COLUNA = 600, ES_PIRA_FRIA = 601, ES_PIRA = 602;
// a laje de penumbra com luz em cima: a mesma laje, sólida (o 223 troca uma pela outra; nunca vai para o save)
const ES_PENUMBRA_FIRME = 603;
// paredes de fundo
const WES_APAGADA = 83, WES_BREU = 84, WES_RAIZ = 85, WES_LAVRADA = 86, WES_PRIMEVA = 87;
// terceira camada (DEEPT)
const DP_ES_NADA = 54, DP_ES_RAIZES = 55, DP_ES_TORRES = 56;

// metros abaixo do topo da camada -> linha
const esY = d => ES_S0 + d;
// em que faixa está uma linha: 0 borda, 1 breu, 2 raízes, 3 fundo, -1 acima (o Abismo), 4 abaixo
function escuroBand(ty) { const d = ty - ES_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < ES_BANDS[b + 1]) return b; return 4; }
const inEscuro = ty => ty >= ES_S0 && ty < ES_S0 + ES_D;
// postos enquanto o mundo é gerado: as duas descidas do Abismo ({ x0, fy, land }, a corrente na coluna x0 + 1), os dois
// Postos de pouso ({ x0, fy, w, h, bx }: bx a coluna do braseiro eterno), os dois Selos do Fundo ({ cx, fy }) e a sala
// do Nox { x0, x1, cx, w, h, top, fy, pyres: [[x, y]...], doors: [{ x, fy, side }] }
let esArrivals = [], esLand = [], esSeals = [], esBoss = null;
const esKeep = new Set();   // a rota, as descidas, os Postos, as correntes, a sala do Nox: túneis, decoração e o breu vivo não mexem
// dentro da sala do Nox, com margem m
function inEsHall(tx, ty, m = 0) { const B = esBoss; return !!B && Math.abs(wdx(tx - B.cx)) < B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
