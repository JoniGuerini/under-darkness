'use strict';

/* ================= a Necrópole do Rei Eterno: ids, faixas, profundidades e o registro na corrente =================
   A décima quarta camada (posição 14, níveis 66 a 70), debaixo do Ossário dos Titãs e em cima da Cidade dos Antigos
   (docs/camadas/14-necropole.md). A cidade dos mortos de um reino inteiro: quando o Rei Eterno se recusou a morrer, mandou
   enterrar o reino com ele, rua por rua, e levantou o exército para não ficar sozinho. As avenidas de mausoléus, os
   columbários de nichos sem fim, os quartéis onde a legião espera de pé e, no fundo, a cripta real, onde o rei não deitou.
   É o espelho escuro da Catedral (41 a 46): lá, mortos soltos e confusos; aqui, os mortos têm posto, ordem e senhor.
   Arquivos (380 a 389; prefixo de função `nc`, de constante `NC_`):
     380-necropole-api      este: ids, faixas, ajudantes de profundidade, a camada de cima, o registro (camadaNomes e
                            camadaExt)
     381-necropole-blocos   texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, a luz de alma
     382-necropole-objetos  os objetos de cena e o plano por faixa (NC_PROP_PLAN)
     383-necropole-legiao   legionário, cavaleiro da morte, arauto, embalsamador, coveiro (e as peças comuns de arte, NCB)
     384-necropole-corte    necromante, escriba da sentença, mortalha (ncMortalha), gaveta, fogo-fátuo (ncFatuo)
     385-necropole-mundo    geração, as descidas do Ossário, as saídas, zonas, spawn, nível, partículas, lojas, fornalha
     386-necropole-morte    os bichos se desfazem em pedaços (MORTE_TIPOS do 360); carrega depois do 360
     387-rei-eterno         o chefe: o Salão do Relicário, o Coração-Relicário e as três âncoras, os três ciclos, o
                            rastrilho de ossos, o lendário (Filactério do Rei Eterno)
     388-sepulcrita         o metal na forja (9 peças), os materiais e as três bases da camada (carrega cedo, com os metais)
     389-necropole-save     nomes das zonas e a chave do chefe no save
   Números (a reserva do revamp, 2026-10-21): blocos 896 a 927, paredes 128 a 132, terceira camada 81 a 83, zonas 81 a 84.
   Carrega depois do mundo da camada de cima (285, o Ossário) e antes do da camada de baixo (290, os Antigos); antes do 87,
   que lê o CAMADA_EXT ao carregar. */

const NECROPOLE = true;
const NC_D = LAYER_D;   // linhas (metros) da camada
// a camada logo acima (129, camadaAcima): a primeira linha, a altura, o chão natural, a rocha que afina e os poços
// de onde as duas descidas saem ({ x0, x1, cx, fy, w, top })
function ncAbove() {
  const a = camadaAcima('necropole'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const NC_TOP = layerTop('necropole');   // onde a camada começa, em metros abaixo do chão do vilarejo
// topo de cada faixa em metros abaixo do topo: Avenidas dos Túmulos, Os Columbários, Os Quartéis da Legião, A Cripta Real
const NC_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const NC_BAND_NAMES = ['avenidas', 'columbarios', 'quarteis', 'cripta'];
const NC_BAND_TITLES = ['Avenidas dos Túmulos', 'Os Columbários', 'Os Quartéis da Legião', 'A Cripta Real'];
const NC_ZONE0 = 81;   // zonas 81 a 84 (o 389 põe os nomes)
let NC_S0 = (() => { const a = ncAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (o 385 acerta)

// blocos sólidos (896 a 909): granito negro (a rocha da camada), terra de cova, laje de rua, mármore funerário, telha
// de ardósia, parede de nichos (columbário), ossuário (crânios e ossos longos em argamassa), cantaria dos quartéis,
// mármore real (negro com veio de ouro), cal (a das covas), o rastrilho de ossos (fecha a sala do rei, não quebra), a
// laje de cova (racha quando os mortos levantam), carvão e sepulcrita
const NC_GRANITO = 896, NC_TERRA = 897, NC_LAJE = 898, NC_MARMORE = 899, NC_TELHA = 900, NC_NICHO = 901, NC_OSSUARIO = 902,
  NC_CANTARIA = 903, NC_REAL = 904, NC_CAL = 905, NC_BARREIRA = 906, NC_COVA = 907, NC_O_CARVAO = 908, NC_O_SEPULCRITA = 909;
// decoração de 1 bloco, não sólida (910 a 923): escada de ferro chumbada (escala), corrente pendurada (escala), lanterna de
// alma no chão (a luz verde-pálida que os necromantes mantêm), lápide pequena, flores secas, ossos soltos, mortalha
// pendurada, musgo-de-alma (a luz fraca que nasce das covas), urna, lanterna de alma pendurada, raízes brancas (das covas
// de cima), elmo caído, lanças fincadas, coluna (do chão ao teto, na cripta)
const NC_ESCADA = 910, NC_CORRENTE = 911, NC_LANTERNA = 912, NC_LAPIDE = 913, NC_FLORES = 914, NC_OSSOS = 915, NC_MORTALHA = 916,
  NC_MUSGO = 917, NC_URNA = 918, NC_LANTERNA_T = 919, NC_RAIZ = 920, NC_ELMO = 921, NC_LANCAS = 922, NC_COLUNA = 923;
// 924 a 927 livres
// paredes de fundo: granito, mármore, nichos, ossos, cantaria
const WNC_GRANITO = 128, WNC_MARMORE = 129, WNC_NICHOS = 130, WNC_OSSOS = 131, WNC_CANTARIA = 132;
// terceira camada (DEEPT): os telhados e as torres da cidade dos mortos ao longe, a parede de nichos sem fim, a legião
// parada no escuro em fileiras
const DP_NC_CIDADE = 81, DP_NC_NICHOS = 82, DP_NC_LEGIAO = 83;

// o chão da camada: onde decoração e objetos podem ficar (o 381 e o 385 preenchem)
const NC_SOILS = new Uint8Array(NT);

// metros abaixo do topo da camada -> linha
const ncY = d => NC_S0 + d;
// em que faixa está uma linha: 0 avenidas, 1 columbários, 2 quartéis, 3 cripta, -1 acima, 4 abaixo
function necroBand(ty) { const d = ty - NC_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < NC_BANDS[b + 1]) return b; return 4; }
const inNecro = ty => ty >= NC_S0 && ty < NC_S0 + NC_D;
/* postos enquanto o mundo é gerado (385):
   ncEntries  as duas descidas do Ossário { x0, fy, top, land }: a escada na coluna x0 + 1
   ncLand     as duas câmaras de pouso (a capela da guarda) { x0, fy, w, h, door, side }: sem spawn em 20 blocos
   ncExits    as duas saídas do fundo de onde a camada de baixo desce { x0, x1, cx, fy, w, top } (lidas como halls)
   ncBoss     o Salão do Relicário { cx, x0, x1, w, h, top, fy, doors: [{ x, fy, side }] }; o 385 deixa a caixa sólida
              e o 387 veste (ncDress)
   ncStreets  as avenidas · ncTombs os mausoléus · ncCols os columbários · ncOss os ossuários · ncHalls os salões dos
   quartéis · ncRoyal as salas da cripta · ncCamps os altares dos necromantes (lanternas acesas) */
let ncEntries = [], ncLand = [], ncExits = [], ncBoss = null, ncStreets = [], ncTombs = [], ncCols = [], ncOss = [], ncHalls = [], ncRoyal = [], ncCamps = [];
const ncKeep = new Set();   // descidas, pousos, saídas, o salão do rei: túneis, decoração e objetos não mexem
// dentro do Salão do Relicário, com margem m (o 353 acha a sala por aqui: inNcHall é global)
function inNcHall(tx, ty, m = 0) { const B = ncBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inNcLand = (tx, ty, m = 0) => ncLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// ncSafe: nenhum monstro nasce a menos de 20 blocos de uma câmara de pouso
const ncSafe = (tx, ty) => ncLand.some(L => Math.abs(wdx(tx - (L.x0 + L.w / 2))) < 20 + L.w / 2 && Math.abs(ty - (L.fy - L.h / 2)) < 20);
// as cores da Necrópole: o verde-pálido das almas, o osso velho, o mármore, o ouro gasto da cripta, o ferro escuro
const NC_COL = { alma: '#b8f0d0', almaF: '#6ad0a0', almaB: '#eafff4', osso: '#d8ccb0', marmore: '#c8c8c0', ouro: '#d8b060', ferro: '#5a5e64', sangue: '#4a2a2a', cera: '#e8dcc0' };

/* ---------- o registro na corrente (129) ---------- */
camadaNomes('necropole', { on: 'NECROPOLE', S0: 'NC_S0', D: 'NC_D', soils: 'NC_SOILS', thin: 'NC_GRANITO', thinW: 'WNC_GRANITO', halls: 'ncExits', boss: 'ncBoss', climb: 'NC_ESCADA' });
camadaExt('necropole', {
  sala: (x, y, m) => inNcHall(x, y, m),
  salaFn: 'inNcHall',
  cor: NC_COL.alma,
  keep: () => ncKeep,
  barreira: t => t === NC_BARREIRA,
  // os poços cavados pelas ligações (87) e o caminho do chefe (353): corrente nos columbários, escada no resto
  subir: y => y >= NC_S0 - 2 && y < NC_S0 + NC_D ? (necroBand(y) === 1 ? NC_CORRENTE : NC_ESCADA) : 0,
  corda: t => t === NC_ESCADA || t === NC_CORRENTE,
  escalar: ['NC_ESCADA', 'NC_CORRENTE'],
  tp: () => ({
    nome: 'A Necrópole do Rei Eterno',
    faixas: NC_BAND_TITLES.map((nome, k) => ({ nome, y0: NC_S0 + NC_BANDS[k], y1: NC_S0 + NC_BANDS[k + 1] })),
    entrada: ncLand.length ? [wrapX(ncLand[0].x0 + (ncLand[0].side > 0 ? 10 : 5)), ncLand[0].fy - 1] : null
  }),
  gemas: { ok: t => t === NC_GRANITO || t === NC_MARMORE, pal: 'ncGranito', host: NC_GRANITO, soils: NC_SOILS },
  minerios: ['NC_O_CARVAO', 'NC_O_SEPULCRITA'],
  // o cenário de som (o formato do DEF do 97): ar parado e frio, eco longo de pedra; sussurros nos columbários, corrente
  // rangendo nos poços, um sino de finados raro nas avenidas, laje arrastando, passos em marcha nos quartéis, o canto
  // baixo na cripta; enquanto o rei vive, um coração lento bate perto do fundo
  ambiente: {
    rt: 5.2, damp: 0.42, wet: 0.6,
    beds: [['brown', 'lowpass', 40, 75, 0.7, 0.12, 0.2, 5], ['pink', 'bandpass', 220, 480, 1.2, 0.02, 0.07, 4, c => c.band === 1 ? 1.4 : 0.8],
      ['white', 'bandpass', 900, 1500, 4, 0.0, 0.025, 3, c => c.band === 3 ? 1.2 : 0.4]],
    ev: [[0.05, 'whisper', c => c.band === 1 ? 1.6 : 0.5], [0.012, 'bell', c => c.band === 0 ? 1 : 0.25], [0.04, 'chains', c => c.band === 1 || c.band === 3 ? 1.2 : 0.4],
      [0.03, 'stoneSlide', c => c.band === 0 ? 1.1 : 0.5], [0.14, 'drip', null, true], [0.025, 'chant', c => c.band === 3 ? 1 : 0.15], [0.018, 'groan'],
      [0.03, 'coldWind', c => c.band === 0 ? 1.2 : 0.5], [0.03, 'roofSteps', c => c.band === 2 ? 1.4 : 0], [0.008, 'crow', c => c.band === 0 ? 1 : 0],
      [0.035, 'murmur', c => c.band === 2 ? 1 : 0.15], [1 / 7, 'heart', c => c.band === 3 && !(typeof ncState !== 'undefined' && ncState.dead) ? 0.5 : 0]]
  },
  zona0: NC_ZONE0
});
