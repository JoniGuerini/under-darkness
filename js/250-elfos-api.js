'use strict';

/* ================= o Reino Élfico: ids, faixas e profundidades =================
   A décima camada, debaixo da Fortaleza dos Anões e em cima do Mar Sem Sol (docs/camadas/11-reino-elfico.md). Pedido
   do Jonathan (2026-10-11): elfos, com o Senhor dos Anéis de inspiração. Quando o sol dos homens subiu, os Filhos da
   Lua desceram levando um pedaço da lua, a Lua Presa, e plantaram debaixo dela uma mata de prata; lavraram salões na
   pedra e guardaram o Espelho da Lua. A Dama olhou demais para dentro dele, e uma parte da corte foi atrás dela: a
   Corte Sem Lua, que pôs máscaras, deixou a roseira-brava subir pelos salões e virou gente de conto de fadas escuro.
   Os outros ainda guardam a mata e os salões. Ninguém passa.
   Revamp de 2026-10-21 (o Jonathan: "não era para você literalmente pegar os bonecos do Warcraft"): os monstros com
   cara de Warcraft (sentinela do glaive, sabre-da-noite, antigo, hipogrifo, magíster sangrento, caçador vendado,
   espectro do silêncio) e a Corte Desterrada (carmesim e ouro, o altar de mana) saíram. Ficaram elfos de fantasia
   geral: Tolkien, o folclore das fadas (o cão-fada, a carpideira, a musa, a sílfide) e os contos de fadas escuros (a
   corte tomada pela roseira).
   Arquivos (250 a 259; prefixo de função `el`, de constante `EL_`):
     250-elfos-api        este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     251-elfos-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o brilho
     252-elfos-objetos    os objetos de cena e o plano por faixa (EL_PROP_PLAN)
     253-elfos-bichos     guarda-fronteira, arqueiro da mata, cão-fada, fogo-fátuo, sílfide
     254-elfos-bichos2    guardião do salão, carpideira, encantadora mascarada, musa faminta, cavaleiro de espinhos
     255-elfos-mundo      geração (a mata, os salões, a corte, as grutas), as descidas, as saídas para baixo,
                          zonas, spawn, nível, partículas, lojas, a lunarita na fornalha
     256-dama-espelho     o chefe: O Espelho da Lua, a Dama, as 3 fases, o reflexo, o lendário
     257-lunarita         o metal na forja (9 peças), os materiais e as três bases da camada
     258-elfos-save       nomes das zonas, o save (os itens trocados no revamp)
     259-elfos-estados    enraizado, enlevado, enfeitiçado; a roseira-brava que arranha
   Números (fora da reserva do 00-geral, como a Nave): blocos 672 a 703 (NT subiu para 704), paredes 93 a 97, terceira
   camada 60 a 62, zonas 53 a 56.
   Carrega depois do mundo da camada de cima e antes do mundo da de baixo (a corrente do 129). */

const ELFOS = true;
const EL_D = LAYER_D;                                   // metros de camada
// a camada logo acima: a primeira linha, a altura, o chão natural, a rocha em que as últimas linhas afinam e os
// poços de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }); quem não existe ainda é pulado
function elAbove() {   // 2026-10-21: a camada de cima vem da lista (129, camadaAcima)
  const a = camadaAcima('elfos'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const EL_TOP = layerTop('elfos');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129; 2026-10-21)
// topo de cada faixa em metros abaixo do EL_TOP: A Mata de Prata, Os Salões do Rei, A Corte dos Espinhos, As Grutas da Lua, (rocha-mãe)
const EL_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const EL_BAND_NAMES = ['mata', 'saloes', 'corte', 'poco'];
const EL_ZONE0 = 53;                                // zonas 53..56 (o 258 põe os nomes depois das da Nave)
let EL_S0 = (() => { const a = elAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (elBuild acerta)

// blocos sólidos (672 a 687)
// solo élfico (terra escura com fios de raiz de prata), madeira prateada (os troncos), folhagem lunar (a copa, luz
// fraca), mármore-lua, pedra lavrada (relevos de folha e filete de prata), tábua élfica (flets e pontes), mármore
// enredado (a Corte: rachado, a raiz da roseira nas frestas), lenho de espinheiro (preto-esverdeado, espinhos),
// pedra-vidente (a pedra furada das fadas: os furos acesos de verde-pálido), pedra-do-poço
// (runas acesas), raiz-mãe (a seiva azul nos sulcos), cristal lunar (luz), o espelho d'água do chefe (firme, não
// quebra), o véu de luar das portas (só na luta), carvão e lunarita
const EL_SOLO = 672, EL_MADEIRA = 673, EL_FOLHAGEM = 674, EL_MARMORE = 675, EL_LAVRADA = 676, EL_TABUA = 677, EL_ENREDADO = 678, EL_LENHO = 679,
  EL_VIDENTE = 680, EL_PEDRA_POCO = 681, EL_RAIZ = 682, EL_CRISTAL_LUA = 683, EL_ESPELHO = 684, EL_BARREIRA = 685, EL_O_CARVAO = 686, EL_O_LUNARITA = 687;
// decoração de 1 bloco, não sólida (688 a 702): escada de corda (escala), cipó prateado (escala como a corrente),
// lanterna élfica (teto, luz forte), flor-da-lua (luz fraca), samambaia prateada, pedra rúnica (luz), braseiro lunar
// (fogo azul, luz forte), roseira-brava (arranha), flâmula (prata e azul nos Salões, ameixa desbotada na Corte),
// orvalho de lua (a gota de luz cai), coluna de raiz (do chão ao teto), folhas caídas, vaga-lumes, cogumelo-de-luar e
// lasca de cristal lunar
const EL_ESCADA = 688, EL_CIPO = 689, EL_LANTERNA = 690, EL_FLOR = 691, EL_SAMAMBAIA = 692, EL_RUNA = 693, EL_BRASEIRO = 694, EL_ROSEIRA = 695,
  EL_FLAMULA = 696, EL_ORVALHO = 697, EL_COLUNA = 698, EL_FOLHAS = 699, EL_VAGALUME = 700, EL_COGUMELO = 701, EL_CRISTALINHO = 702;
// a Lua Presa do Espelho da Lua: sólida, não quebra, a luz mais forte da camada (703)
const EL_LUA = 703;
// paredes de fundo
const WEL_MATA = 93, WEL_SALAO = 94, WEL_ENREDADO = 95, WEL_POCO = 96, WEL_FOLHAS = 97;
// terceira camada (DEEPT): a mata de prata ao longe com a Lua Presa, os salões ao longe, as raízes da Árvore-Mãe
const DP_EL_MATA = 60, DP_EL_SALOES = 61, DP_EL_RAIZES = 62;

// metros abaixo do topo da camada -> linha
const elY = d => EL_S0 + d;
// em que faixa está uma linha: 0 mata, 1 salões, 2 corte, 3 poço, -1 acima, 4 abaixo
function elfosBand(ty) { const d = ty - EL_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < EL_BANDS[b + 1]) return b; return 4; }
const inElfos = ty => ty >= EL_S0 && ty < EL_S0 + EL_D;
/* postos enquanto o mundo é gerado:
   elEntries  as duas descidas da camada de cima { x0, fy, top, land }: a escada de corda na coluna x0 + 1, fy o chão do pouso
   elLand     os dois Postos de Guarda { x0, fy, w, h } (chão em fy, ar de fy - h a fy - 1): sem spawn, lanternas
   elExits    as duas Raízes Fundas de onde a camada de baixo desce { x0, x1, cx, fy, w, top } (ela lê como halls)
   elBoss     o Espelho da Lua { cx, x0, x1, w, h, top, fy, doors: [{ x, fy, side }], moon: { cx, cy, r } }
              uma gruta de w x h com o chão (o espelho) na linha fy e o ar de top a fy - 1, de x0 a x1; o 255 deixa a
              caixa sólida e o 256 veste (elDress) com o espelho, as raízes, a lua, as portas e o véu
   elHalls    os salões dos Salões e da Corte { x0, w, top, fy, ruin } (objetos com a flag salao/ruina)
   elGlades   as clareiras da Mata e os bosques mortos { cx, cy, w, h, fy, dead, trees: [x] } (flag clareira)
   elGrottos  as grutas da lua do Poço { cx, cy, w, h, fy, pool } (flag gruta) */
let elEntries = [], elLand = [], elExits = [], elBoss = null, elHalls = [], elGlades = [], elGrottos = [];
const elKeep = new Set();   // descidas, pousos, raízes fundas, o Espelho: túneis, decoração e objetos não mexem
// dentro do Espelho da Lua, com margem m
function inElHall(tx, ty, m = 0) { const B = elBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inElLand = (tx, ty, m = 0) => elLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);

/* ---------- estados que os elfos põem no herói (o 259 conta o tempo, desenha e solta) ----------
   enraizado: raízes prendem os pés por `sec` segundos; não anda nem pula (ainda ataca e se defende).
   enlevado (a Musa Faminta): por `sec` segundos o herói ouve a canção dela: anda devagar e não lança magia (as notas
   giram em volta da cabeça). Entrou no lugar do silenciado do magíster sangrento (revamp de 2026-10-21).
   enfeitiçado (só a Dama): por `sec` segundos o herói é puxado devagar para (x, y) em pixels; andar para longe vence
   metade do puxão. */
function elEnraizar(sec) { if (!pl || pl.dead) return; pl.elRaizT = Math.max(pl.elRaizT || 0, sec); }
function elEnlevar(sec) { if (!pl || pl.dead) return; pl.elEnlT = Math.max(pl.elEnlT || 0, sec); }
function elEnfeiticar(sec, x, y, f = 70) { if (!pl || pl.dead) return; pl.elFeitT = Math.max(pl.elFeitT || 0, sec); pl.elFeitX = x; pl.elFeitY = y; pl.elFeitF = f; }
const elEnlevado = () => !!(pl && pl.elEnlT > 0);
// as cores do Reino: a prata e o azul-lua dos guardiões; a ameixa, a rosa negra e o verde-pálido da luz das fadas na
// Corte dos Espinhos
const EL_COL = { prata: '#e6eef8', lua: '#9cc8ff', luaFunda: '#4a7ad0', branco: '#f8fbff', ameixa: '#864c74', rosa: '#c890b8', fada: '#b8f0c8', fadaFunda: '#5ab88a', folha: '#7ab8c8' };
