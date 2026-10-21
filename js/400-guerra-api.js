'use strict';

/* ================= O Campo da Última Guerra: ids, faixas, profundidades e o registro na corrente =================
   A décima sétima camada (docs/camadas/17-campo-guerra.md), debaixo da Prisão dos Deuses (ou da camada de cima que
   existir: camadaAcima) e em cima do Abismo. Aqui anjos e demônios lutaram a última guerra antes de o Inferno ser
   fechado embaixo: um campo de batalha sem fim, enterrado, com as armas ainda fincadas no barro e os cavaleiros caídos
   dos dois lados ainda de pé. Nada aqui é do inferno de verdade (isso é o Abismo, logo abaixo): é terra pisada,
   ferro de batalha, o mármore dos bastiões dos anjos e a rocha queimada por onde os demônios entraram.
   Arquivos (400 a 409; prefixo de função `gu`, de constante `GU_`):
     400-guerra-api      este: ids, faixas, a camada de cima, os postos da geração, o registro (camadaNomes, camadaExt)
     401-guerra-blocos   texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, o brilho;
                         o pintor dos objetos e dos guerreiros (GUART)
     402-guerra-objetos  os objetos de cena e o plano por faixa (GU_PROP_PLAN)
     403-guerra-caidos   cavaleiro caído, arqueiro da chuva, porta-estandarte, soldado enterrado, penitente
     404-guerra-hostes   serafim quebrado, revoada de corvos, demônio de cerco, clérigo do juízo, lâmina errante
     405-guerra-mundo    geração (o campo, os bastiões, a brecha, o estandarte), as descidas, as saídas, zonas, spawn,
                         nível, partículas, lojas, a belicita na fornalha
     406-general-caido   o chefe: O Campo do Estandarte, o General Caído, as 3 fases, a Carga, o lendário
     407-guerra-metal    a belicita na forja (9 peças), os materiais e as três bases da camada
     408-guerra-save     nomes das zonas, o save do chefe
     409-guerra-morte    como os dez se desfazem ao morrer (MORTE_TIPOS, depois do 360)
   Números (00-revamp): blocos 960 a 991, paredes 138 a 142, terceira camada 87 a 89, zonas 89 a 92.
   Carrega depois do mundo da camada de cima e antes do 103 (o Abismo começa onde esta termina). */

const GUERRA = true;
const GU_D = LAYER_D;                                    // metros de camada
// a camada logo acima: { id, S0, D, soils, halls, climb, boss, thin, thinW }; sem nenhuma, a mina (nunca acontece no jogo)
function guAbove() {
  const a = camadaAcima('guerra'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, halls: [], climb: CHAIN, boss: null, thin: STONE, thinW: 2 };
}
const GU_TOP = layerTop('guerra');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129)
// topo de cada faixa em metros abaixo do topo: O Campo das Lâminas, Os Bastiões de Luz, A Brecha, O Estandarte Caído
const GU_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const GU_BAND_NAMES = ['laminas', 'bastioes', 'brecha', 'estandarte'];
const GU_ZONE0 = 89;                                    // zonas 89..92 (o 408 põe os nomes)
let GU_S0 = (() => { const a = guAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (guBuild acerta)

// blocos sólidos (960 a 972): terra de batalha (a massa do Campo, cheia de pontas de ferro), barro pisado (as trincheiras),
// ferro de batalha (sucata de armaduras e armas prensada), mármore celeste (a pedra dos bastiões dos anjos), cantaria
// dos anjos (o mármore lavrado em blocos), rocha queimada (onde os demônios entraram), rocha em brasa (a mesma, ainda
// acesa por dentro: brilha e não queima), penas petrificadas (as asas que caíram e viraram pedra), tijolo de fosso (as
// trincheiras demoníacas), paliçada (estacas amarradas: pisos e pontes), a muralha de escudos que fecha o Campo do
// Estandarte durante a luta, o carvão e a belicita
const GU_TERRA = 960, GU_ARGILA = 961, GU_SUCATA = 962, GU_MARMORE = 963, GU_CANTARIA = 964, GU_ESCORIA = 965, GU_BRASA = 966,
  GU_PENAS = 967, GU_TIJOLO = 968, GU_PALICADA = 969, GU_BARREIRA = 970, GU_O_CARVAO = 971, GU_O_BELICITA = 972;
// decoração de 1 bloco, não sólida (976 a 990): escada de cerco (escala), corda de cerco (escala), lança fincada,
// espada fincada, elmo caído, pena de anjo (luz fraca e fria), fenda em brasa (luz quente), flâmula rasgada (teto),
// flechas fincadas, ossos de soldado, corrente pendurada (teto), lança gigante (do chão ao teto), escudo caído, auréola
// caída (luz dourada: os pousos), espinho de ferro. 973 a 975 e 991 ficam livres.
const GU_ESCADA = 976, GU_CORDA = 977, GU_LANCA = 978, GU_ESPADA = 979, GU_ELMO = 980, GU_PENA = 981, GU_FENDA = 982, GU_FLAMULA = 983,
  GU_FLECHAS = 984, GU_OSSOS = 985, GU_GRILHAO = 986, GU_COLUNA = 987, GU_ESCUDO = 988, GU_AUREOLA = 989, GU_CRAVO = 990;
// paredes de fundo: terra de batalha, mármore celeste, rocha queimada, tijolo de fosso, paliçada
const WGU_TERRA = 138, WGU_MARMORE = 139, WGU_ESCORIA = 140, WGU_TIJOLO = 141, WGU_PALICADA = 142;
// terceira camada (DEEPT): o campo ao longe (lanças e estandartes contra o escuro), as muralhas dos anjos ao longe, o
// clarão do fogo que sobe da brecha
const DP_GU_CAMPO = 87, DP_GU_MURALHA = 88, DP_GU_FOGO = 89;
const GU_THIN = GU_ESCORIA;   // a rocha em que as últimas linhas afinam (o Abismo procura thin)

// metros abaixo do topo da camada -> linha
const guY = d => GU_S0 + d;
// em que faixa está uma linha: 0 lâminas, 1 bastiões, 2 brecha, 3 estandarte, -1 acima, 4 abaixo
function guerraBand(ty) { const d = ty - GU_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < GU_BANDS[b + 1]) return b; return 4; }
const inGuerra = ty => ty >= GU_S0 && ty < GU_S0 + GU_D;
/* postos enquanto o mundo é gerado:
   guEntries  as duas descidas vindas de cima { x0, fy, top, land }: o poço de 4 com a escada de cerco na coluna x0 + 1
   guLand     as duas câmaras de pouso { x0, fy, w, h, door, side } (chão em fy, ar de fy - h a fy - 1): sem spawn,
              acesas pelas auréolas caídas
   guExits    as duas Valas dos Caídos, de onde o Abismo desce { x0, x1, cx, fy, w: 5, top, C }
   guBoss     O Campo do Estandarte { cx, x0, w, h, top, fy, doors: [{ x, fy, side }] }: o ar de top a fy - 1, de
              cx - w/2 a cx + w/2 - 1; o 405 deixa a caixa sólida com os corredores e o 406 escreve dentro (guDress)
   guFields   os campos abertos (as grutas largas de chão plano) { cx, cy, w, h, fy, band }
   guForts    os salões dos bastiões { x0, w, top, fy }
   guTowers   as torres dos bastiões (poços com escada) { x0, w, top, fy }
   guTrench   as trincheiras (corredores retos) { x0, len, fy, h, band } */
let guEntries = [], guLand = [], guExits = [], guBoss = null, guFields = [], guForts = [], guTowers = [], guTrench = [];
const guKeep = new Set();   // descidas, pousos, saídas, o Campo do Estandarte: túneis, decoração e objetos não mexem
// dentro do Campo do Estandarte, com margem m
function inGuHall(tx, ty, m = 0) { const B = guBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inGuLand = (tx, ty, m = 0) => guLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// sem monstro num raio de 20 blocos das câmaras de pouso
const guSafe = (tx, ty) => guLand.some(L => Math.abs(wdx(tx - (L.x0 + L.w / 2))) < 20 + L.w / 2 && Math.abs(ty - (L.fy - L.h / 2)) < 20);
// as cores do Campo: o ouro dos anjos, a brasa dos demônios, o ferro velho, o barro, o sangue seco
const GU_COL = { ouro: '#f0d070', ouroClaro: '#fff4c0', luz: '#fff0b8', brasa: '#ff6a1a', brasaClara: '#ffb050', ferro: '#8a8a90', barro: '#6a5038', sangue: '#5a1810', aviso: '#ff4a3a' };
// o chão da camada: onde decoração e objetos podem ficar (e o que a camada de baixo afina nas primeiras linhas dela)
const GU_SOILS = new Uint8Array(NT);
for (const t of [GU_TERRA, GU_ARGILA, GU_SUCATA, GU_MARMORE, GU_CANTARIA, GU_ESCORIA, GU_BRASA, GU_PENAS, GU_TIJOLO, GU_PALICADA, GU_O_CARVAO, GU_O_BELICITA]) GU_SOILS[t] = 1;

/* ---------- o registro na corrente (129) ---------- */
camadaNomes('guerra', { on: 'GUERRA', S0: 'GU_S0', D: 'GU_D', soils: 'GU_SOILS', thin: 'GU_THIN', thinW: 'WGU_ESCORIA', halls: 'guExits', boss: 'guBoss', climb: 'GU_ESCADA' });
camadaExt('guerra', {
  sala: (x, y, m) => inGuHall(x, y, m),
  salaMargem: 1,
  salaFn: 'inGuHall',
  cor: '#ffd890',
  keep: () => guKeep,
  barreira: t => t === GU_BARREIRA,
  subir: y => y >= GU_S0 - 2 && y < GU_S0 + GU_D ? (guerraBand(y) === 1 ? GU_ESCADA : GU_CORDA) : 0,
  corda: t => t === GU_ESCADA || t === GU_CORDA || t === GU_COLUNA,
  escalar: ['GU_ESCADA', 'GU_CORDA'],
  tp: () => ({
    nome: 'O Campo da Última Guerra',
    faixas: [0, 1, 2, 3].map(b => ({ nome: ZONE_NAMES[GU_ZONE0 + b] || GU_BAND_NAMES[b], y0: GU_S0 + GU_BANDS[b], y1: Math.min(WH - 8, GU_S0 + GU_BANDS[b + 1]) })),
    entrada: guLand[0] ? [guLand[0].x0 + 6, guLand[0].fy - 2] : null
  }),
  gemas: { ok: t => t === GU_TERRA || t === GU_ESCORIA, pal: 'guTerra', host: GU_TERRA, soils: GU_SOILS },
  minerios: ['GU_O_CARVAO', 'GU_O_BELICITA'],
  zona0: GU_ZONE0,
  // o som: vento largo e baixo sobre o campo, ferro rangendo ao longe, um corvo; nos Bastiões um coro sem palavras e
  // o sino raro; na Brecha o ronco do fogo embaixo e correntes; no Estandarte cascos distantes, o gemido dos caídos
  ambiente: {
    rt: 4.2, damp: 0.4, wet: 0.55,
    beds: [['pink', 'bandpass', 140, 420, 0.9, 0.05, 0.15, 4.5, c => c.band === 0 || c.band === 3 ? 1.3 : 0.8], ['brown', 'lowpass', 40, 75, 0.7, 0.12, 0.24, 5, c => c.band === 2 ? 1.6 : 0.8],
      ['pink', 'bandpass', 260, 380, 2, 0.01, 0.06, 4, c => c.band === 1 ? 1.4 : 0.2]],
    ev: [[0.05, 'coldWind', c => c.band === 0 || c.band === 3 ? 1.2 : 0.4], [0.03, 'whistle', c => c.band === 0 ? 1 : 0.3], [0.014, 'crow', c => c.band === 0 || c.band === 3 ? 1 : 0.2],
      [0.04, 'chains', c => c.band === 2 ? 1.3 : 0.4], [0.005, 'bell', c => c.band === 1 ? 1 : 0.1], [0.08, 'chant', c => c.band === 1 ? 0.8 : 0],
      [0.02, 'hooves', c => c.band === 3 ? 1.2 : 0.3], [0.025, 'groan', c => c.band >= 2 ? 1 : 0.4], [0.04, 'whisper', c => c.band === 3 ? 0.8 : 0.2],
      [0.012, 'roar', c => c.band === 2 ? 1 : 0.1], [0.04, 'crack', c => c.band === 2 ? 1 : 0.3]]
  }
});
