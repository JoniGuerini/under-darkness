'use strict';

/* ================= os Salões do Pesadelo: ids, faixas e profundidades =================
   A camada debaixo da Cidade dos Antigos e em cima do Abismo (docs/camadas/14-saloes-pesadelo.md). O lugar onde o
   sonho vira real: uma casa que não existe, corredores que se repetem, quartos de infância esquecidos e uma galeria de
   espelhos onde mora O Sem-Rosto. Horror de casa, de criança e de reflexo, sem sangue: o que sai dos bichos é pena,
   poeira e caco.
   Arquivos (300 a 309; prefixo de função `ps`, de constante `PS_`):
     300-pesadelo-api        este: ids, faixas, ajudantes de profundidade, a camada de cima, os estados do herói
     301-pesadelo-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, a luz
                             que respira
     302-pesadelo-objetos    os 28 objetos de cena e o plano por faixa (PS_PROP_PLAN)
     303-pesadelo-coisas     sonâmbulo, o que corre atrás, homem alto, porta faminta, bonecas de porcelana
     304-pesadelo-coisas2    mariposa do sono, bailarina da caixinha, cavalo de balanço, sombra errada, relógio mole
     305-pesadelo-mundo      geração (a casa, os corredores, os quartos, a galeria), as Escadas que Afundam, as Portas
                             Quentes, zonas, spawn, nível, partículas, lojas, a onirita na fornalha
     306-pesadelo-sonho      os corredores em laço, as portas que levam longe, os quartos que não existem, os
                             Adormecidos (a regra da onirita), cochilo, agarrado e a volta no tempo
     307-sem-rosto           o chefe: o Salão dos Espelhos, os espelhos, as cópias do herói, as 3 fases, o lendário
     308-onirita             o metal na forja (9 peças), os materiais e as três bases da camada
     309-pesadelo-save       nomes das zonas, laços desfeitos, Adormecidos acordados, o Sem-Rosto
   Números (reserva do coordenador, 2026-10-11): blocos 832 a 863, paredes 118 a 122, terceira camada 75 a 77, zonas 73
   a 76. Posição no registro (129): logo acima do Abismo. A geração roda dentro do abBuild do 108 (o 305 embrulha):
   depois de todas as camadas do meio, logo antes do Abismo, que desce das Portas Quentes (psExits). */

const PESADELO = true;
const PS_D = 186;                                   // metros de camada
// a camada logo acima, da mais funda para a mais rasa: quem não existe ainda é pulado. Devolve a primeira linha, a
// altura, o chão natural, a rocha em que as últimas linhas afinam e os poços de onde as descidas saem
function psAbove() {
  const tries = [['ANTIGOS', 'AT'], ['TITAS', 'TT'], ['DRAGAO', 'DG'], ['MAR', 'MS'], ['ELFOS', 'EL'], ['NAVE', 'NV'], ['COLMEIA', 'CM']];
  for (const [flag, p] of tries) {
    let on = false, S0, D; try { on = eval(`typeof ${flag} !== 'undefined' && ${flag}`); S0 = eval(`typeof ${p}_S0 !== 'undefined' ? ${p}_S0 : undefined`); D = eval(`typeof ${p}_D !== 'undefined' ? ${p}_D : 186`); } catch (e) { on = false; }
    if (!on || S0 === undefined) continue;
    const lo = p.toLowerCase(), get = n => { try { return eval(`typeof ${n} !== 'undefined' ? ${n} : undefined`); } catch (e) { return undefined; } };
    return { id: lo, S0, D, soils: get(`${p}_SOILS`) || null, halls: get(`${lo}Exits`) || [], boss: get(`${lo}Boss`) || null,
      climb: get(`${p}_ESCADA`) || CHAIN, thin: p === 'EL' ? get('EL_PEDRA_POCO') : p === 'NV' ? get('NV_REATOR') : p === 'CM' ? get('CM_CERA_REAL') : (get(`${p}_THIN`) || null) };
  }
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
// metros abaixo do chão do vilarejo onde a camada começa (a posição no registro 129)
const PS_TOP = (layerPos('pesadelo') - 1) * 186;
// topo de cada faixa em metros abaixo do PS_TOP: A Casa que Não Era, Os Corredores Sem Fim, Os Quartos Esquecidos, A
// Galeria dos Espelhos, (rocha-mãe)
const PS_BANDS = [0, 46, 98, 150, 186];
const PS_BAND_NAMES = ['casa', 'corredores', 'quartos', 'galeria'];
const PS_ZONE0 = 73;                                // zonas 73..76 (o 309 põe os nomes pelo índice)
let PS_S0 = (() => { try { const a = psAbove(); return a.S0 + a.D; } catch (e) { return 2046; } })();   // psBuild acerta

// blocos sólidos (832 a 845)
// pedra-sono (a massa, lilás e mole), assoalho (tábuas que não batem), parede forrada (papel de parede com flores),
// tijolo mole, azulejo frio, acolchoado (pano estofado com botões), massa de penas (quebra rápido), vidro de espelho,
// assoalho queimado (rachas vermelhas, luz fraca), o Nada (a casca dos quartos que não existem: não quebra), a Moldura
// Fechada (as portas do Salão dos Espelhos na luta), carvão, onirita (muda de cor, luz fraca) e o Veio Desfeito (o
// que sobra quando o Adormecido acorda)
const PS_SONO = 832, PS_ASSOALHO = 833, PS_FORRADA = 834, PS_TIJOLO = 835, PS_AZULEJO = 836, PS_ACOLCHOADO = 837, PS_PENAS = 838, PS_ESPELHO = 839,
  PS_QUEIMADO = 840, PS_NADA = 841, PS_BARREIRA = 842, PS_O_CARVAO = 843, PS_O_ONIRITA = 844, PS_VEIO_DESFEITO = 845;
// decoração de 1 bloco, não sólida (846 a 858): escada de mão torta (escala), lençóis amarrados (escala como corda),
// vela derretida (luz quente fraca), abajur (luz amarela), lâmpada nua (pendurada, balança), brinquedos, despertador
// (os ponteiros andam para trás), penas no chão, fios de lã (pendurados), cacos de espelho, dentes de leite, brasa no
// assoalho (luz vermelha, só no fundo) e a costura (invisível: a emenda dos laços)
const PS_ESCADA = 846, PS_CORDA = 847, PS_VELA = 848, PS_ABAJUR = 849, PS_LAMPADA = 850, PS_BRINQUEDO = 851, PS_DESPERTADOR = 852, PS_PENA = 853,
  PS_LA = 854, PS_CACOS = 855, PS_DENTES = 856, PS_BRASA = 857, PS_COSTURA = 858;
// 859 a 863 ficam livres
// paredes de fundo: papel de parede desbotado, lambri, rocha mole, azulejo, espelho escuro
const WPS_PAPEL = 118, WPS_LAMBRI = 119, WPS_SONO = 120, WPS_AZULEJO = 121, WPS_ESPELHO = 122;
// terceira camada: casas tortas soltas no escuro com uma janela acesa, o corredor que some em perspectiva, o brilho
// vermelho do Abismo lá embaixo
const DP_PS_CASAS = 75, DP_PS_CORREDOR = 76, DP_PS_BRILHO = 77;

const psY = d => PS_S0 + d;
// em que faixa está uma linha: 0 casa, 1 corredores, 2 quartos, 3 galeria, -1 acima, 4 abaixo
function pesadeloBand(ty) { const d = ty - PS_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < PS_BANDS[b + 1]) return b; return 4; }
const inPesadelo = ty => ty >= PS_S0 && ty < PS_S0 + PS_D;
/* postos enquanto o mundo é gerado (305):
   psEntries  as duas Escadas que Afundam { x0, fy, top, land }: a escada torta na coluna x0 + 1, fy o chão de cima
   psLand     as duas câmaras de pouso { x0, fy, w, h } (chão em fy, ar de fy - h a fy - 1): sem spawn, abajur
   psExits    as duas Portas Quentes de onde o Abismo desce { x0, x1, cx, fy, w, top } (o Abismo lê como halls)
   psBoss     o Salão dos Espelhos { cx, x0, x1, w, h, top, fy, doors: [{ x, fy, side }] } (48 x 18 por dentro)
   psRooms    os cômodos da Casa { x0, w, top, fy, big } (big: o cômodo do tamanho errado)
   psHalls    os corredores { x0, len, fy, top } e os salões da Galeria { x0, w, top, fy, gal }
   psBeds     os quartos com cama { cx, x0, w, top, fy, bed: { x, fy } } (o 306 põe o Adormecido)
   psLoops    os corredores em laço { x0, L, fy, top, n } (o 306 vira PS_LOOPS)
   psNowhere  os quartos que não existem { x0, w, h, top, fy, kind } (casca de PS_NADA) */
let psEntries = [], psLand = [], psExits = [], psBoss = null, psRooms = [], psHalls = [], psBeds = [], psLoops = [], psNowhere = [];
const psKeep = new Set();   // descidas, pousos, Portas Quentes, o Salão, os laços, os quartos que não existem
// dentro do Salão dos Espelhos, com margem m
function inPsHall(tx, ty, m = 0) { const B = psBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inPsLand = (tx, ty, m = 0) => psLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
const inPsNowhere = (tx, ty, m = 0) => psNowhere.some(N => wdx(tx - N.x0) >= -1 - m && wdx(tx - N.x0) <= N.w + m && ty >= N.top - 1 - m && ty <= N.fy + m);

/* ---------- estados que o pesadelo põe no herói (o 306 conta o tempo, desenha e solta) ----------
   cochilo (mariposa do sono): as pálpebras fecham na tela e o herói fica parado `sec` segundos.
   agarrado (sonâmbulo): preso pelos braços de quem o segura até bater nele (cada golpe solta um pouco).
   volta no tempo (relógio mole): o herói volta para onde estava 2 s antes, se o lugar estiver livre. */
function psCochilar(sec) { if (!pl || pl.dead) return; pl.psSonoT = Math.max(pl.psSonoT || 0, sec); }
function psAgarrar(e, sec) { if (!pl || pl.dead) return; pl.psAgarraT = Math.max(pl.psAgarraT || 0, sec); pl.psAgarraE = e; pl.psAgarraN = 0; }
const psHist = [];   // as posições do herói nos últimos 3 s: [t, x, y]
function psVoltar() {
  if (!pl || pl.dead) return false;
  const t0 = gameTime - 2; let best = null;
  for (const h of psHist) if (h[0] <= t0) best = h; else break;
  if (!best) return false;
  const [_, x, y] = best, ty = Math.floor((y + pl.h) / T);
  if (rectSolid(x, y, pl.w, pl.h) || pesadeloBand(ty) !== pesadeloBand(Math.floor((pl.y + pl.h) / T))) return false;
  pl.psVoltaFx = { x0: pl.x, y0: pl.y, x1: x, y1: y, t: 0.5 };
  pl.x = x; pl.y = y; pl.vx = 0; pl.vy = 0;
  return true;
}
const psStill = () => !!(pl && ((pl.psSonoT || 0) > 0 || (pl.psAgarraT || 0) > 0));
// as cores do pesadelo: o amarelo de abajur, o lilás do sono, o branco frio do espelho, o vermelho do fundo
const PS_COL = { abajur: '#ffd27a', vela: '#ffb860', lilas: '#c09ae0', rosa: '#f0a0c8', turquesa: '#90e8e0', espelho: '#dcf0f4', brasa: '#f07a2a', papel: '#cbb4ba' };
