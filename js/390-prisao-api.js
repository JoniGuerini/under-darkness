'use strict';

/* ================= a Prisão dos Deuses: ids, faixas, profundidades e a corrente das camadas =================
   A décima sexta camada (docs/camadas/16-prisao-deuses.md), debaixo da Cidade dos Antigos e em cima do Campo da Última
   Guerra (ou do Abismo, enquanto o Campo não existe). Antes de todos os povos, os deuses antigos desceram até aqui
   para prender o que não podia morrer: abriram abismos e atravessaram neles correntes do tamanho de pontes, cavaram
   celas na pedra viva, puseram carcereiros de pedra de guarda e foram embora. Os prisioneiros continuam aqui. No
   fundo, no Tártaro, o maior deles ainda puxa as duas correntes que sobraram.
   Arquivos (390 a 399; prefixo de função `pd`, de constante `PD_`):
     390-prisao-api        este: ids, faixas, a camada de cima, os postos da geração, a corrente das camadas
     391-prisao-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, o brilho
     392-prisao-objetos    os objetos de cena e o plano por faixa (PD_PROP_PLAN)
     393-prisao-bichos1    carcereiro de pedra, elos soltos, águia do suplício, condenado da bola, pedra viva
     394-prisao-bichos2    cria do lobo, gigante agrilhoado, serpe do fosso, lamento, acorrentador
     395-prisao-mundo      geração (os abismos com as pontes de corrente, as galerias de celas, os salões dos gigantes,
                           o Tártaro), as descidas, as saídas, zonas, spawn, nível, partículas, lojas, a fornalha
     396-prisao-morte      como os bichos da Prisão se desfazem (MORTE_TIPOS do 360)
     397-lobo-atado        o chefe: O Lobo Atado na Cova das Correntes, as 3 fases, o lendário
     398-ferro-divino      o metal na forja (9 peças), os materiais e as três bases da camada
     399-prisao-save       nomes das zonas, o save do chefe
   Números (00-revamp): blocos 928 a 959, paredes 133 a 137, terceira camada 84 a 86, zonas 85 a 88.
   Carrega depois do mundo da camada de cima (295) e antes do 103 (o Abismo começa onde a última camada do meio termina). */

const PRISAO = true;
const PD_D = LAYER_D;                                   // metros de camada
// a camada logo acima (129, camadaAcima): a primeira linha, a altura, o chão natural (afina nas nossas primeiras
// linhas) e as duas descidas de onde as nossas entradas saem ({ x0, x1, cx, fy, w, top })
function pdAbove() {
  const a = camadaAcima('prisao'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, TOP: typeof MN_TOP !== 'undefined' ? MN_TOP : 558, soils: MN_SOILS, halls: [], boss: null };
}
const PD_TOP = layerTop('prisao');   // onde a camada começa, em metros abaixo do chão do vilarejo (129)
// topo de cada faixa em metros abaixo do topo: As Correntes Suspensas, As Celas de Pedra Viva, O Salão dos Gigantes, O Tártaro
const PD_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const PD_BAND_NAMES = ['correntes', 'celas', 'gigantes', 'tartaro'];
const PD_ZONE0 = 85;                                // zonas 85..88 (o 399 põe os nomes)
let PD_S0 = (() => { const a = pdAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (pdBuild acerta)

// blocos sólidos (928 a 939): rocha da prisão (a massa), alvenaria ciclópica (bordas dos abismos, galerias, salões),
// pedra viva (as celas; os veios vermelhos pulsam devagar), elo gigante (as pontes de corrente), bronze antigo
// (molduras, portões, a sala do chefe), pedra do Tártaro (o fundo), fenda do Tártaro (luz violeta fria), laje gasta
// (os pisos andados), pedra rúnica (as runas da prisão ainda acesas), a grade de bronze (portas do chefe, só na luta),
// carvão e ferro divino
const PD_ROCHA = 928, PD_ALVENARIA = 929, PD_PEDRA_VIVA = 930, PD_ELO = 931, PD_BRONZE = 932, PD_TARTARO = 933, PD_FENDA = 934, PD_LAJE = 935,
  PD_RUNA = 936, PD_BARREIRA = 937, PD_O_CARVAO = 938, PD_O_FERRO = 939;
// decoração de 1 bloco, não sólida (940 a 950): a corrente de subir, a escada de ferro cravada na pedra, a grade torta
// das celas (arrebentada por dentro), a argola pendurada do teto, os ossos, o grilhão aberto, a gota de ícor (o sangue
// dos deuses pingando do teto, luz dourada), a poça de ícor, a estalactite, o líquen pálido, os elos soltos.
// 951 a 959 ficam livres.
const PD_CORRENTE = 940, PD_ESCADA = 941, PD_GRADE = 942, PD_ARGOLA = 943, PD_OSSOS = 944, PD_GRILHAO = 945, PD_ICOR = 946, PD_POCA = 947,
  PD_ESTALAC = 948, PD_LIQUEN = 949, PD_ELOS = 950;
// paredes de fundo: rocha, alvenaria ciclópica, a parede das celas (nichos com grade), o bronze com relevo, o Tártaro
const WPD_ROCHA = 133, WPD_ALVENARIA = 134, WPD_CELA = 135, WPD_BRONZE = 136, WPD_TARTARO = 137;
const PD_THIN = PD_ROCHA;   // a rocha em que a camada de baixo afina
// terceira camada (DEEPT): correntes atravessando o vazio, as celas em andares ao longe, o fundo do Tártaro
const DP_PD_ABISMO = 84, DP_PD_CELAS = 85, DP_PD_TARTARO = 86;

const pdY = d => PD_S0 + d;
// em que faixa está uma linha: 0 correntes, 1 celas, 2 gigantes, 3 tártaro, -1 acima, 4 abaixo
function prisaoBand(ty) { const d = ty - PD_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < PD_BANDS[b + 1]) return b; return 4; }
const inPrisao = ty => ty >= PD_S0 && ty < PD_S0 + PD_D;
/* postos enquanto o mundo é gerado:
   pdEntries  as duas descidas da Cidade { x0, fy, top, land }: o Poço do Carcereiro (4 de largura, a escada de ferro na
              coluna x0 + 1)
   pdLand     as duas câmaras de pouso { x0, fy, w, h, door, side } (chão em fy, ar de fy - h a fy - 1): sem spawn, ícor
   pdExits    as duas Gargantas de onde a camada de baixo desce { x0, x1, cx, fy, w, top }
   pdBoss     a Cova das Correntes { cx, x0, y0, w, h, fy, doors: [{ x, fy, side }] }: o miolo w x h em x0..x0+w-1,
              y0..y0+h-1 (o chão é fy = y0 + h; a moldura vai de x0 - 1 a x0 + w); o 397 cuida das correntes
   pdChasms   os abismos das Correntes { x0, w, top, fy, bridge: { y, sag, x0, x1 } }
   pdGals     as galerias de celas { x0, w, top, fy, tiers: [y], cells: [{ x0, w, top, fy }] }
   pdHalls    os salões dos gigantes { x0, w, top, fy, decks: [y] }
   pdPits     as covas do Tártaro { cx, top, fy, w, h, x0 } */
let pdEntries = [], pdLand = [], pdExits = [], pdBoss = null, pdChasms = [], pdGals = [], pdHalls = [], pdPits = [];
const pdKeep = new Set();   // descidas, pousos, saídas, a cova: túneis, decoração e objetos não mexem
// o estado do chefe (o 397 luta; o 399 guarda no save)
const pdChefe = { dead: false };
// dentro da Cova das Correntes (moldura incluída), com margem m. Global: o 353 acha a sala pelo nome (salaFn)
function inPdHall(tx, ty, m = 0) { const B = pdBoss; if (!B) return false; const dx = wdx(tx - B.x0); return dx >= -1 - m && dx <= B.w + m && ty >= B.y0 - 1 - m && ty <= B.fy + m; }
const inPdLand = (tx, ty, m = 0) => pdLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// onde os bichos comuns não entram (a cova: a IA trata a borda como parede)
const pdNoGo = (tx, ty) => inPdHall(tx, ty, 1);

// as cores da Prisão: o ferro escuro, o bronze velho, o dourado do ícor, o vermelho da pedra viva, o violeta do Tártaro,
// o azul frio das runas, o vermelho dos avisos
const PD_COL = { ferro: '#3a3a44', bronze: '#a07a3a', bronzeC: '#d8b060', icor: '#ffcc4a', icorC: '#fff0b0', viva: '#d0402a', vivaC: '#ff8a5a',
  tartaro: '#8a5ad8', tartaroC: '#c8a8ff', runa: '#5ab0e8', runaC: '#b8e8ff', aviso: '#ff3a2a', avisoC: '#ffb08a', branco: '#f4f0e8' };
// o chão da camada: onde decoração e objetos podem ficar (e o que a camada de baixo afina nas primeiras linhas dela)
const PD_SOILS = new Uint8Array(NT);
for (const t of [PD_ROCHA, PD_ALVENARIA, PD_PEDRA_VIVA, PD_ELO, PD_BRONZE, PD_TARTARO, PD_FENDA, PD_LAJE, PD_RUNA, PD_O_CARVAO, PD_O_FERRO]) PD_SOILS[t] = 1;
const PD_CLIMB = t => t === PD_CORRENTE || t === PD_ESCADA || t === CHAIN;

/* ---------- a corrente das camadas (129) ---------- */
camadaNomes('prisao', { on: 'PRISAO', S0: 'PD_S0', D: 'PD_D', soils: 'PD_SOILS', thin: 'PD_THIN', thinW: 'WPD_ROCHA', halls: 'pdExits', boss: 'pdBoss', climb: 'PD_ESCADA' });
camadaExt('prisao', {
  sala: (x, y, m) => inPdHall(x, y, m),
  salaFn: 'inPdHall',
  cor: '#d8a040',                              // a poeira dourada de ícor que guia até a Cova
  keep: () => pdKeep,
  barreira: t => t === PD_BARREIRA,
  subir: y => y >= PD_S0 && y < PD_S0 + PD_D ? PD_CORRENTE : 0,
  corda: t => t === PD_CORRENTE || t === PD_ESCADA,
  escalar: ['PD_CORRENTE', 'PD_ESCADA'],
  tp: () => ({
    nome: 'A Prisão dos Deuses',
    faixas: [0, 1, 2, 3].map(b => ({ nome: ZONE_NAMES[PD_ZONE0 + b] || PD_BAND_NAMES[b], y0: PD_S0 + PD_BANDS[b], y1: Math.min(WH - 8, PD_S0 + PD_BANDS[b + 1]) })),
    entrada: pdLand && pdLand[0] ? [pdLand[0].x0 + (pdLand[0].w >> 1), pdLand[0].fy - 2] : null
  }),
  gemas: { ok: t => t === PD_ROCHA || t === PD_TARTARO, pal: 'pdRocha', host: PD_ROCHA, soils: PD_SOILS },
  minerios: ['PD_O_CARVAO', 'PD_O_FERRO'],
  zona0: PD_ZONE0,
  /* o som (formato do DEF do 97): um ronco grave e fundo, o vento baixo nos abismos; correntes rangendo longe o tempo
     todo, pedra caindo no vazio nas Correntes, portas de cela e sussurros nas Celas, a respiração lenta e o gemido
     dos gigantes no Salão, e no Tártaro o vento frio e, raro, um rugido que vem de muito fundo */
  ambiente: {
    rt: 4.4, damp: 0.3, wet: 0.6,
    beds: [['brown', 'lowpass', 38, 70, 0.8, 0.18, 0.32, 7, c => c.band === 3 ? 1.4 : 1], ['pink', 'bandpass', 220, 520, 1.1, 0.03, 0.1, 5, c => c.band === 0 ? 1.6 : c.band === 3 ? 1.2 : 0.5]],
    ev: [[0.16, 'chains', c => c.band === 0 ? 1.5 : 0.8], [0.05, 'pitStone', c => c.band === 0 ? 1.4 : 0.2], [0.06, 'drip', c => c.band === 1 ? 1 : 0.5, true],
      [0.04, 'door', c => c.band === 1 ? 1.2 : 0], [0.05, 'whisper', c => c.band === 1 || c.band === 3 ? 1 : 0.2], [0.05, 'breath', c => c.band === 2 ? 1.4 : 0],
      [0.04, 'groan', c => c.band === 2 ? 1.4 : 0.3], [0.03, 'crack', c => c.band >= 2 ? 1 : 0.4], [0.06, 'coldWind', c => c.band === 3 ? 1.4 : 0.2],
      [0.012, 'roar', c => c.band === 3 && !pdChefe.dead ? 1 : 0]]
  }
});
