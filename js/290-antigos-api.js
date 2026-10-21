'use strict';

/* ================= a Cidade dos Antigos: ids, faixas, profundidades e a gravidade =================
   A décima quinta camada (docs/camadas/13-cidade-antigos.md), debaixo do Ossário dos Titãs e em cima dos Salões do
   Pesadelo. Antes dos titãs e dos dragões, um povo sem nome construiu aqui embaixo uma cidade medida com régua: pedra
   lisa sem emenda, ângulos perfeitos, prédios pendurados do teto, máquinas que ainda giram para ninguém. Eles sumiram;
   os vigias e os construtos continuam cuidando da cidade vazia. No fundo, uma estrela caiu há eras e abriu uma cratera
   de vidro: o metal dela é o Ferro Estelar.
   Arquivos (290 a 299; prefixo de função `at`, de constante `AT_`):
     290-antigos-api          este: ids, faixas, a camada de cima, os postos da geração, a gravidade virada (estado)
     291-antigos-blocos       texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o brilho
     292-antigos-objetos      os 28 objetos de cena e o plano por faixa (AT_PROP_PLAN)
     293-antigos-construtos   custódio, olho-vigia, agrimensor, tesselas, ponteiro
     294-antigos-construtos2  cubo errante, êmbolo, astrolábio, obreiro, estilhaço da estrela
     295-antigos-mundo        geração (as escadarias, a cidade inversa, as máquinas, a cratera), as descidas, as saídas,
                              zonas, spawn, nível, partículas, lojas, o ferro estelar na fornalha
     296-antigos-gravidade    a gravidade virada: o herói em 4 direções, a câmera girada, as Salas de Prumo
     297-arquiteto            o chefe: A Sala que se Monta, os módulos, as 3 fases, o lendário
     298-ferro-estelar        o metal na forja (9 peças), os materiais e as três bases da camada
     299-antigos-save         nomes das zonas, o save
   Números (reserva do coordenador, 2026-10-11): blocos 800 a 831 (NT 832), paredes 113 a 117, terceira camada 72 a
   74, zonas 69 a 72. A ficha foi escrita para a 13ª posição (ids 512+, zonas 57+, js 200+); a camada entrou na 15ª, entre
   o Ossário e os Salões do Pesadelo, então os números são os de cima e os níveis saem da posição no registro (129).
   Carrega depois do mundo da camada de cima e antes do 103 (o Abismo começa onde a última camada do meio termina). */

const ANTIGOS = true;
const AT_D = LAYER_D;                                   // metros de camada
/* a camada logo acima: a primeira linha, a altura, o chão natural (o material dela afina nas nossas primeiras linhas)
   e os poços de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }). Quem ainda não existe é pulado: o Ossário,
   o Covil, o Mar Sem Sol e o Reino Élfico, nessa ordem (as cinco camadas novas foram feitas ao mesmo tempo). */
function atAbove() {   // 2026-10-21: a camada de cima vem da lista (129, camadaAcima)
  const a = camadaAcima('antigos'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, TOP: typeof MN_TOP !== 'undefined' ? MN_TOP : 558, soils: MN_SOILS, halls: [], boss: null };
}
const AT_TOP = layerTop('antigos');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129; 2026-10-21)
// topo de cada faixa em metros abaixo do AT_TOP: As Escadarias, A Cidade Inversa, As Máquinas, A Cratera da Estrela
const AT_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const AT_BAND_NAMES = ['escadarias', 'inversa', 'maquinas', 'cratera'];
const AT_ZONE0 = 69;                                // zonas 69..72 (o 299 põe os nomes)
let AT_S0 = (() => { const a = atAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (atBuild acerta)

// blocos sólidos (800 a 813): pedra lisa (a massa), laje dos Antigos (salas e prédios), rocha fria (bolsões naturais,
// o carvão), laje de glifo (luz fraca), conduto de luz (luz média), bloco de engrenagem, chapa antiga (passarelas),
// vidro de cratera, rocha fundida (luz fraca), ladrilho de prumo (Salas de Prumo e a arena), a grade de luz (portas do
// chefe, só na luta), o bloco em trânsito (invisível, só enquanto um módulo da arena desliza), carvão e ferro estelar
const AT_PEDRA = 800, AT_LAJE = 801, AT_ROCHA_FRIA = 802, AT_GLIFO = 803, AT_CONDUTO = 804, AT_ENGRENAGEM = 805, AT_CHAPA = 806, AT_VIDRO = 807,
  AT_FUNDIDA = 808, AT_LADRILHO = 809, AT_BARREIRA = 810, AT_TRANSITO = 811, AT_O_CARVAO = 812, AT_O_ESTELAR = 813;
// decoração de 1 bloco, não sólida (814 a 825): escada embutida (escala), corrente de elos quadrados (escala), lâmpada
// de glifo (teto, luz forte), lasca de estrela (chão, luz branca), marco de medida, engrenagem solta, fio de luz
// (pende do teto, vibra), cubos flutuantes, poeira de estrela, coluna facetada (do chão ao teto), estalactite de
// vidro, seta de prumo (parede das Salas de Prumo: aponta para onde é "baixo" agora). 826 a 831 ficam livres.
const AT_ESCADA = 814, AT_CORRENTE = 815, AT_LAMPADA = 816, AT_LASCA = 817, AT_MARCO = 818, AT_ENGRENA = 819, AT_FIO = 820, AT_CUBOS = 821,
  AT_POEIRA = 822, AT_COLUNA = 823, AT_ESTALAC = 824, AT_SETA = 825;
// paredes de fundo: pedra lisa, laje (juntas finas), glifos gravados, a máquina (painéis e eixos), vidro fosco
const WAT_PEDRA = 113, WAT_LAJE = 114, WAT_GLIFO = 115, WAT_MAQUINA = 116, WAT_VIDRO = 117;
const AT_THIN = AT_PEDRA;   // a rocha em que a camada de baixo afina (o 300 e o 103 procuram AT_THIN)
// terceira camada (DEEPT): torres ao longe (algumas de cabeça para baixo), engrenagens gigantes paradas, o clarão da estrela
const DP_AT_CIDADE = 72, DP_AT_MAQUINAS = 73, DP_AT_ESTRELA = 74;

// metros abaixo do topo da camada -> linha
const atY = d => AT_S0 + d;
// em que faixa está uma linha: 0 escadarias, 1 cidade inversa, 2 máquinas, 3 cratera, -1 acima, 4 abaixo
function antigosBand(ty) { const d = ty - AT_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < AT_BANDS[b + 1]) return b; return 4; }
const inAntigos = ty => ty >= AT_S0 && ty < AT_S0 + AT_D;
/* postos enquanto o mundo é gerado:
   atEntries  as duas descidas do Ossário { x0, fy, top, land }: o Poço dos Antigos (4 de largura), a escada na coluna x0
   atLand     as duas câmaras de pouso { x0, fy, w, h } (chão em fy, ar de fy - h a fy - 1): sem spawn, lâmpadas
   atExits    as duas Escadas que Afundam de onde a camada de baixo desce { x0, x1, cx, fy, w, top }
   atBoss     a Sala que se Monta { cx, x0, y0, w, h, fy, doors: [{ x, fy, side }] }: o miolo 30 x 30 em x0..x0+29,
              y0..y0+29 (o chão de baixo é y0 + 30, a moldura vai de x0 - 1 a x0 + 30); o 295 deixa a caixa sólida e o 297
              monta os módulos dentro
   atTerraces os terraços e câmaras das Escadarias { x0, w, top, fy, kind }
   atBlocks   os quarteirões da Cidade Inversa { x0, w, top, fy, houses: [{ x0, w, h }] }
   atPrumos   as Salas de Prumo { x0, y0, w: 14, h: 14, door: { x, y }, model, rot, pend: { x, y } } (o 296 veste e cuida)
   atHalls    os salões das Máquinas { x0, w, top, fy, decks: [y] }
   atShafts   os poços de pistão { x0, top, fy }
   atCraters  as crateras { cx, cy, w, h, fy, x0 } */
let atEntries = [], atLand = [], atExits = [], atBoss = null, atTerraces = [], atBlocks = [], atPrumos = [], atHalls = [], atShafts = [], atCraters = [];
const atKeep = new Set();   // descidas, pousos, saídas, Salas de Prumo, a arena: túneis, decoração e objetos não mexem
// dentro da arena do Arquiteto (moldura incluída), com margem m
function inAtHall(tx, ty, m = 0) { const B = atBoss; if (!B) return false; const dx = wdx(tx - B.x0); return dx >= -1 - m && dx <= B.w + m && ty >= B.y0 - 1 - m && ty <= B.y0 + B.h + m; }
const inAtLand = (tx, ty, m = 0) => atLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
const inAtPrumo = (tx, ty, m = 0) => atPrumos.some(P => wdx(tx - P.x0) >= -m && wdx(tx - P.x0) < P.w + m && ty >= P.y0 - m && ty < P.y0 + P.h + m);

/* ---------- a gravidade virada (o 296 move o herói e gira a câmera; o 297 decide na arena) ----------
   Só vale dentro dos retângulos de AT_GRAV (a arena e as Salas de Prumo, em blocos: { x0, y0, w, h, dir, kind, ref }).
   dir: 0 baixo, 1 esquerda, 2 cima, 3 direita: para que lado a sala está virada. Virar a gravidade gira os blocos da
   sala inteira em volta do centro (com o herói, os monstros e o que estiver solto dentro), e a câmera gira 0,6 s de volta;
   então, dentro do jogo, a gravidade sempre puxa para baixo e nada da física muda. atGrav fica só por compatibilidade. */
const AT_GRAV = [];
const atGrav = { dir: 0, rect: null, rot: 0, from: 0, to: 0, t: 1 };
// os vetores de cada direção: para onde puxa (gx, gy) e o "direita" do herói (rx, ry), com a câmera girada
const AT_GDIR = [{ gx: 0, gy: 1, rx: 1, ry: 0 }, { gx: -1, gy: 0, rx: 0, ry: 1 }, { gx: 0, gy: -1, rx: -1, ry: 0 }, { gx: 1, gy: 0, rx: 0, ry: -1 }];
function atGravRect(tx, ty) { for (const R of AT_GRAV) if (wdx(tx - R.x0) >= 0 && wdx(tx - R.x0) < R.w && ty >= R.y0 && ty < R.y0 + R.h) return R; return null; }
// a gravidade num ponto do mundo em pixels (projéteis com peso, itens, os cubos do chefe). O 296 vira a gravidade girando
// a sala inteira, então dentro do jogo ela sempre puxa para baixo: R.dir só lembra para que lado a sala está virada.
function atGravAt(px, py) { return 0; }

/* ---------- o que os construtos fazem no herói ----------
   atEmpurrar: o êmbolo e os golpes pesados jogam o herói (vx, vy em px/s); o Prumo do Arquiteto (lendário) anula. */
function atEmpurrar(vx, vy) { if (!pl || pl.dead || (typeof atPrumoEquip === 'function' && atPrumoEquip())) return; pl.vx = vx; pl.vy = vy; pl.onGround = false; }
// as cores da Cidade: o ciano dos glifos, o branco da estrela, o vermelho dos avisos dos vigias, a prata fria das lajes
const AT_COL = { glifo: '#4ac8d0', glifoClaro: '#9af0f0', branco: '#f0f4ff', estrela: '#e8f0ff', aviso: '#ff4a5a', avisoClaro: '#ffb0b8', laje: '#b0bccc', vidro: '#7ab0a0', violeta: '#b4b8e8' };
// o chão da camada: onde decoração e objetos podem ficar (e o que a camada de baixo afina nas primeiras linhas dela)
const AT_SOILS = new Uint8Array(NT);
for (const t of [AT_PEDRA, AT_LAJE, AT_ROCHA_FRIA, AT_GLIFO, AT_CONDUTO, AT_ENGRENAGEM, AT_CHAPA, AT_VIDRO, AT_FUNDIDA, AT_LADRILHO, AT_O_CARVAO, AT_O_ESTELAR]) AT_SOILS[t] = 1;
// onde os construtos comuns não entram (a arena e as Salas de Prumo: a IA trata a borda como parede)
const atNoGo = (tx, ty) => inAtHall(tx, ty, 1) || inAtPrumo(tx, ty, 1);
