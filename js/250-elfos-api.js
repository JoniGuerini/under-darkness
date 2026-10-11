'use strict';

/* ================= o Reino Élfico: ids, faixas e profundidades =================
   A décima primeira camada, debaixo da Nave Caída e em cima do Abismo (docs/camadas/11-reino-elfico.md). Pedido do
   Jonathan (2026-10-11): elfos, com o Senhor dos Anéis e o Warcraft de inspiração. Quando o sol dos homens subiu, os
   Filhos da Lua desceram levando um pedaço da lua, a Lua Presa, e plantaram debaixo dela uma mata de prata; lavraram
   salões na pedra e guardaram o Espelho da Lua. A Dama olhou demais para dentro dele, e uma parte da corte bebeu do
   poço com ela: os Desterrados, carmesim e ouro. Os outros ainda guardam a mata e os salões. Ninguém passa.
   Arquivos (250 a 259; prefixo de função `el`, de constante `EL_`):
     250-elfos-api        este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     251-elfos-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o brilho
     252-elfos-objetos    os objetos de cena e o plano por faixa (EL_PROP_PLAN)
     253-elfos-bichos     sentinela, arqueiro, sabre-da-noite, fogo-fátuo, antigo da mata
     254-elfos-bichos2    hipogrifo, guardião do salão, espectro élfico, magíster sangrento, caçador vendado
     255-elfos-mundo      geração (a mata, os salões, a corte, o poço), as descidas da Nave, as saídas para o Abismo,
                          zonas, spawn, nível, partículas, lojas, a lunarita na fornalha
     256-dama-espelho     o chefe: O Espelho da Lua, a Dama, as 3 fases, o reflexo, o lendário
     257-lunarita         o metal na forja (9 peças), os materiais e as três bases da camada
     258-elfos-save       nomes das zonas, o save (wg 17)
     259-elfos-estados    enraizado, silenciado, enfeitiçado; os espinheiros que arranham
   Números (fora da reserva do 00-geral, como a Nave): blocos 672 a 703 (NT subiu para 704), paredes 93 a 97, terceira
   camada 60 a 62, zonas 53 a 56 (depois das da Nave).
   Carrega depois do mundo da Nave (245) e antes do 103 (o Abismo começa onde esta camada termina). */

const ELFOS = true;
const EL_D = 186;                                   // metros de camada
// a camada logo acima: a primeira linha, a altura, o chão natural, a rocha em que as últimas linhas afinam e os
// poços de onde as duas descidas saem ({ x0, x1, cx, fy, w, top }); quem não existe ainda é pulado
function elAbove() {
  if (typeof NAVE !== 'undefined' && NAVE && typeof NV_S0 !== 'undefined')
    return { id: 'nave', S0: NV_S0, D: NV_D, soils: typeof NV_SOILS !== 'undefined' ? NV_SOILS : null, halls: typeof nvExits !== 'undefined' ? nvExits : [], climb: typeof NV_ESCADA !== 'undefined' ? NV_ESCADA : CHAIN, boss: typeof nvBoss !== 'undefined' ? nvBoss : null, thin: typeof NV_REATOR !== 'undefined' ? NV_REATOR : STONE };
  if (typeof COLMEIA !== 'undefined' && COLMEIA && typeof CM_S0 !== 'undefined')
    return { id: 'colmeia', S0: CM_S0, D: CM_D, soils: typeof CM_SOILS !== 'undefined' ? CM_SOILS : null, halls: typeof cmExits !== 'undefined' ? cmExits : [], climb: typeof CM_ESCADA_FAVO !== 'undefined' ? CM_ESCADA_FAVO : CHAIN, boss: typeof cmBoss !== 'undefined' ? cmBoss : null, thin: typeof CM_CERA_REAL !== 'undefined' ? CM_CERA_REAL : STONE };
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const EL_TOP = (typeof NV_TOP !== 'undefined' ? NV_TOP : 1674) + 186;   // metros abaixo do chão do vilarejo (1860)
// topo de cada faixa em metros abaixo do EL_TOP: A Mata de Prata, Os Salões do Rei, A Corte Desterrada, O Poço da Lua, (rocha-mãe)
const EL_BANDS = [0, 46, 98, 150, 186];
const EL_BAND_NAMES = ['mata', 'saloes', 'corte', 'poco'];
const EL_ZONE0 = 53;                                // zonas 53..56 (o 258 põe os nomes depois das da Nave)
let EL_S0 = (() => { const a = elAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (elBuild acerta)

// blocos sólidos (672 a 687)
// solo élfico (terra escura com fios de raiz de prata), madeira prateada (os troncos), folhagem lunar (a copa, luz
// fraca), mármore-lua, pedra lavrada (relevos de folha e filete de prata), tábua élfica (flets e pontes), mármore
// profanado (a Corte), madeira morta (preta, seiva carmesim), cristal de mana sangrenta (luz vermelha), pedra-do-poço
// (runas acesas), raiz-mãe (a seiva azul nos sulcos), cristal lunar (luz), o espelho d'água do chefe (firme, não
// quebra), o véu de luar das portas (só na luta), carvão e lunarita
const EL_SOLO = 672, EL_MADEIRA = 673, EL_FOLHAGEM = 674, EL_MARMORE = 675, EL_LAVRADA = 676, EL_TABUA = 677, EL_PROFANO = 678, EL_MORTA = 679,
  EL_CRISTAL_SANGUE = 680, EL_PEDRA_POCO = 681, EL_RAIZ = 682, EL_CRISTAL_LUA = 683, EL_ESPELHO = 684, EL_BARREIRA = 685, EL_O_CARVAO = 686, EL_O_LUNARITA = 687;
// decoração de 1 bloco, não sólida (688 a 702): escada de corda (escala), cipó prateado (escala como a corrente),
// lanterna élfica (teto, luz forte), flor-da-lua (luz fraca), samambaia prateada, pedra rúnica (luz), braseiro lunar
// (fogo azul, luz forte), espinheiro profanado (arranha), flâmula (prata e azul nos Salões, carmesim e ouro na Corte),
// orvalho de lua (a gota de luz cai), coluna de raiz (do chão ao teto), folhas caídas, vaga-lumes, cogumelo-de-luar e
// lasca de cristal lunar
const EL_ESCADA = 688, EL_CIPO = 689, EL_LANTERNA = 690, EL_FLOR = 691, EL_SAMAMBAIA = 692, EL_RUNA = 693, EL_BRASEIRO = 694, EL_ESPINHO = 695,
  EL_FLAMULA = 696, EL_ORVALHO = 697, EL_COLUNA = 698, EL_FOLHAS = 699, EL_VAGALUME = 700, EL_COGUMELO = 701, EL_CRISTALINHO = 702;
// a Lua Presa do Espelho da Lua: sólida, não quebra, a luz mais forte da camada (703)
const EL_LUA = 703;
// paredes de fundo
const WEL_MATA = 93, WEL_SALAO = 94, WEL_PROFANO = 95, WEL_POCO = 96, WEL_FOLHAS = 97;
// terceira camada (DEEPT): a mata de prata ao longe com a Lua Presa, os salões ao longe, as raízes da Árvore-Mãe
const DP_EL_MATA = 60, DP_EL_SALOES = 61, DP_EL_RAIZES = 62;

// metros abaixo do topo da camada -> linha
const elY = d => EL_S0 + d;
// em que faixa está uma linha: 0 mata, 1 salões, 2 corte, 3 poço, -1 acima, 4 abaixo
function elfosBand(ty) { const d = ty - EL_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < EL_BANDS[b + 1]) return b; return 4; }
const inElfos = ty => ty >= EL_S0 && ty < EL_S0 + EL_D;
/* postos enquanto o mundo é gerado:
   elEntries  as duas descidas da Nave { x0, fy, top, land }: a escada de corda na coluna x0 + 1, fy o chão do pouso
   elLand     os dois Postos de Guarda { x0, fy, w, h } (chão em fy, ar de fy - h a fy - 1): sem spawn, lanternas
   elExits    as duas Raízes Fundas de onde o Abismo desce { x0, x1, cx, fy, w, top } (o Abismo lê como halls)
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
   silenciado: um selo prateado acima da cabeça por `sec` segundos; não lança magia nem bebe poção.
   enfeitiçado (só a Dama): por `sec` segundos o herói é puxado devagar para (x, y) em pixels; andar para longe vence
   metade do puxão. */
function elEnraizar(sec) { if (!pl || pl.dead) return; pl.elRaizT = Math.max(pl.elRaizT || 0, sec); }
function elSilenciar(sec) { if (!pl || pl.dead) return; pl.elSilT = Math.max(pl.elSilT || 0, sec); }
function elEnfeiticar(sec, x, y, f = 70) { if (!pl || pl.dead) return; pl.elFeitT = Math.max(pl.elFeitT || 0, sec); pl.elFeitX = x; pl.elFeitY = y; pl.elFeitF = f; }
const elSilenced = () => !!(pl && pl.elSilT > 0);
// as cores do Reino: a prata e o azul-lua dos guardiões, o carmesim e o ouro dos Desterrados, o verde vil dos caçadores
const EL_COL = { prata: '#e6eef8', lua: '#9cc8ff', luaFunda: '#4a7ad0', branco: '#f8fbff', carmesim: '#d02a3a', ouro: '#f0c050', vil: '#7aff4a', folha: '#7ab8c8' };
