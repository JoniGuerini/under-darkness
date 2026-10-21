'use strict';

/* ================= o Brejo das Bruxas: ids, faixas e profundidades =================
   A sexta camada, debaixo das Minas Fúngicas e em cima da Cidade Afundada (docs/camadas/06-brejo-bruxas.md), no lugar
   da Colmeia (Jonathan, 2026-10-21: "uma coisa mais medieval, um pouco mais sombria"). Abaixo do micélio a rocha vira
   turfa encharcada: um pântano subterrâneo de água parada e preta, onde as bruxas que fugiram das fogueiras lá de cima
   fizeram aldeia em palafitas. Os caçadores de bruxas vieram atrás, ergueram forcas e gaiolas, e o brejo engoliu todos:
   os enforcados ainda balançam, os caçadores andam afogados na água rasa, e no fundo, no Círculo de pedras, a Velha do
   Brejo mexe o caldeirão.
   Arquivos (370 a 379; prefixo de função `bj`, de constante `BJ_`):
     370-brejo-api        este: ids, faixas, ajudantes de profundidade, a camada de cima, a corrente (129), os estados
     371-brejo-blocos     texturas de blocos, paredes, terceira camada, minérios, decoração, itens de bloco, a luz viva
     372-brejo-objetos    os objetos de cena e o plano por faixa (BJ_PROP_PLAN)
     373-brejo-bichos     sapo-boi, sanguessuga, enforcado, homem da turfa, corvos do patíbulo
     374-brejo-bichos2    bruxa da vassoura, mão de glória, caçador afogado, lavadeira da noite, bruxa do boneco
     375-brejo-mundo      geração (as bacias, as palafitas, o patíbulo, o círculo), as descidas, zonas, spawn, nível,
                          partículas, lojas, o ferro-do-brejo na fornalha
     376-velha-brejo      o chefe: o Caldeirão, a Velha, as 3 fases, o Pilão da Velha
     377-ferro-brejo      o metal na forja (9 peças), os materiais e as três bases (carrega cedo, com os metais)
     378-brejo-save       nomes das zonas, a água refeita depois das ligações, o tom da água, o save do chefe
     379-brejo-estados    os estados que a camada põe no herói (enrolado, paralisado, envenenado, preso) e o
                          desfazer dos bichos ao morrer (MORTE_TIPOS, carrega depois do 360)
   Números (a reserva do revamp, 2026-10-21): blocos 864 a 895, paredes 123 a 127, terceira camada 78 a 80,
   zonas 77 a 80. Carrega depois do mundo das Minas Fúngicas (126) e antes do 130 (a Cidade desce das saídas daqui). */

const BREJO = true;
const BJ_D = LAYER_D;                                   // metros de camada
// a camada logo acima (129, camadaAcima): as Minas Fúngicas; se ela não existir, a Mina
function bjAbove() {
  const a = camadaAcima('brejo'); if (a) return a;
  return { id: 'mina', S0: MN_S0, D: MN_D, soils: MN_SOILS, host: MN_HOST, halls: [], climb: CHAIN, boss: null, thin: STONE };
}
const BJ_TOP = layerTop('brejo');   // onde a camada começa, em metros abaixo do chão do vilarejo (a posição na lista, 129)
// topo de cada faixa em metros abaixo do BJ_TOP: A Turfeira, As Palafitas, O Patíbulo, O Círculo, (rocha-mãe)
const BJ_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K);
const BJ_BAND_NAMES = ['turfeira', 'palafitas', 'patibulo', 'circulo'];
const BJ_ZONE0 = 77;                                // zonas 77..80 (o 378 põe os nomes no índice)
let BJ_S0 = (() => { const a = bjAbove(); return a.S0 + a.D; })();   // a primeira linha da camada no mundo atual (bjBuild acerta; o 312 também escreve)

// blocos sólidos (864 a 877): turfa (marrom-preta, fibrosa, em camadas, raizinhas), lama (o atoleiro: brilha molhada,
// prende o passo), argila de brejo (cinza-azulada em lâminas), pedra do brejo (calcário esverdeado com manchas de
// limo, a rocha da camada), tábua (o chão das palafitas e das passarelas), sapê (o telhado das cabanas), pau a pique
// (a parede das cabanas: varas trançadas com barro), menir (granito cinza com líquen e espirais riscadas), raizame (o
// nó de raízes das árvores afogadas), crosta de ferro (a limonita ferrugem onde o ferro-do-brejo nasce), o Espinheiro
// da Velha (fecha o Caldeirão na luta, não quebra), carvão de turfa e ferro-do-brejo
const BJ_TURFA = 864, BJ_LAMA = 865, BJ_ARGILA = 866, BJ_PEDRA = 867, BJ_TABUA = 868, BJ_SAPE = 869, BJ_PAU_PIQUE = 870, BJ_MENIR = 871,
  BJ_RAIZ = 872, BJ_CROSTA = 873, BJ_BARREIRA = 874, BJ_O_CARVAO = 875, BJ_O_FERRO = 876;
// 877 livre
// decoração de 1 bloco, não sólida (878 a 889): escada de corda (escala), corda de forca (escala), junco, fogo-fátuo
// (a luz do gás do pântano, flutua), barba-de-velho (o musgo pendurado do teto), estaca de palafita (do chão até a
// tábua), vela preta (as bruxas acenderam), ossos no lodo, amuleto de galhos (pendurado do teto), goteira, crânio na
// estaca (o aviso dos caçadores), touceira de turfa
const BJ_ESCADA = 878, BJ_CORDA = 879, BJ_JUNCO = 880, BJ_FATUO = 881, BJ_MUSGO = 882, BJ_POSTE = 883, BJ_VELA = 884, BJ_OSSOS = 885,
  BJ_AMULETO = 886, BJ_GOTA = 887, BJ_CRANIO = 888, BJ_TOUCEIRA = 889;
// 890 a 895 livres
// paredes de fundo: turfa, pedra do brejo, tábua (dentro das cabanas), raizame, a pedra escura do Círculo
const WBJ_TURFA = 123, WBJ_PEDRA = 124, WBJ_TABUA = 125, WBJ_RAIZ = 126, WBJ_MENIR = 127;
// terceira camada (DEEPT): a mata afogada ao longe, as palafitas ao longe, as forcas e as pedras em pé ao longe
const DP_BJ_MATA = 78, DP_BJ_PALAFITAS = 79, DP_BJ_FORCAS = 80;

// o chão da camada (decoração e objetos ficam nele) e o que ela pode sobrescrever (o enchimento debaixo de cima)
const BJ_SOILS = new Uint8Array(NT);
for (const t of [BJ_TURFA, BJ_LAMA, BJ_ARGILA, BJ_PEDRA, BJ_TABUA, BJ_SAPE, BJ_PAU_PIQUE, BJ_MENIR, BJ_RAIZ, BJ_CROSTA, BJ_O_CARVAO, BJ_O_FERRO]) BJ_SOILS[t] = 1;
const BJ_HOST = new Uint8Array(NT);
{ const a = bjAbove(); for (let t = 0; t < NT; t++) if ((a.host && a.host[t]) || (a.soils && a.soils[t]) || BJ_SOILS[t]) BJ_HOST[t] = 1; BJ_HOST[BEDROCK] = 0; }

// metros abaixo do topo da camada -> linha
const bjY = d => BJ_S0 + d;
// em que faixa está uma linha: 0 turfeira, 1 palafitas, 2 patíbulo, 3 círculo, -1 acima, 4 abaixo
function brejoBand(ty) { const d = ty - BJ_S0; if (d < 0) return -1; for (let b = 0; b < 4; b++) if (d < BJ_BANDS[b + 1]) return b; return 4; }
const inBrejo = ty => ty >= BJ_S0 && ty < BJ_S0 + BJ_D;
/* postos enquanto o mundo é gerado:
   bjEntries  as duas descidas das Minas Fúngicas { x0, fy, top, land }: a escada de corda na coluna x0 + 1
   bjLand     as duas câmaras de pouso { x0, fy, w, h, door, side }: chão em fy, ar de fy - h a fy - 1; sem spawn
   bjExits    as duas Valas de Escoamento de onde a Cidade desce { x0, x1, cx, fy, w, top, C } (lidas como halls)
   bjBoss     o Caldeirão { cx, x0, x1, w, h, top, fy, wl, doors: [{ x, fy, side }] }: a caverna de w x h com o chão
              (o fundo da água) na linha fy, o nível da água em wl; o 375 deixa a caixa sólida e o 376 veste (bjDress)
   bjPools    as poças e lagoas { x0, x1, fy, wl, kind } (o 378 enche; wl = a fileira de cima da água)
   bjHuts     as cabanas em palafita { x0, w, fy, top, door } · bjDecks as plataformas { x0, w, y }
   bjGallows  os patíbulos { cx, fy } · bjCircles os círculos de pedras { cx, fy, r } · bjMires os atoleiros */
let bjEntries = [], bjLand = [], bjExits = [], bjBoss = null, bjPools = [], bjHuts = [], bjDecks = [], bjGallows = [], bjCircles = [], bjMires = [], bjCh = [];
const bjKeep = new Set();
let bjChefeSpawn = false;   // o chefe (376) chamando ajudantes: sem bando, sem nível de faixa, sem o vazio perto do Caldeirão   // descidas, pousos, valas, o Caldeirão: túneis, decoração e objetos não mexem
// dentro do Caldeirão, com margem m
function inBjHall(tx, ty, m = 0) { const B = bjBoss; if (!B) return false; return Math.abs(wdx(tx - B.cx)) <= B.w / 2 + m && ty >= B.top - m && ty <= B.fy + m; }
const inBjLand = (tx, ty, m = 0) => bjLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy + m);
// nenhum monstro nasce a menos de 20 blocos de uma câmara de pouso
const bjSafe = (tx, ty) => bjLand.some(L => Math.abs(wdx(tx - (L.x0 + L.w / 2))) < 20 + L.w / 2 && Math.abs(ty - (L.fy - L.h / 2)) < 20);

/* ---------- a corrente das camadas (129): como a Cidade vê o Brejo, e o que os sistemas comuns precisam ---------- */
camadaNomes('brejo', { on: 'BREJO', S0: 'BJ_S0', D: 'BJ_D', soils: 'BJ_SOILS', thin: 'BJ_ARGILA', thinW: 'WBJ_PEDRA', halls: 'bjExits', boss: 'bjBoss', host: 'BJ_HOST', climb: 'BJ_ESCADA' });
const BJ_YB = () => Math.min(WH - 8, BJ_S0 + BJ_D);   // a linha depois da última da camada
camadaExt('brejo', {
  sala: (x, y, m) => inBjHall(x, y, m), salaFn: 'inBjHall', cor: '#b8d890',
  keep: () => bjKeep,
  barreira: t => t === BJ_BARREIRA,
  subir: y => y >= BJ_S0 && y < BJ_YB() ? BJ_ESCADA : 0,
  corda: t => t === BJ_ESCADA || t === BJ_CORDA || t === BJ_POSTE,
  escalar: ['BJ_ESCADA', 'BJ_CORDA'],
  tp: () => ({
    nome: 'O Brejo das Bruxas',
    faixas: [0, 1, 2, 3].map(b => ({ nome: ZONE_NAMES[BJ_ZONE0 + b] || BJ_BAND_NAMES[b], y0: BJ_S0 + BJ_BANDS[b], y1: Math.min(WH - 8, BJ_S0 + BJ_BANDS[b + 1]) })),
    entrada: bjLand[0] ? [bjLand[0].x0 + 6, bjLand[0].fy - 2] : null
  }),
  gemas: { ok: t => t === BJ_PEDRA || t === BJ_ARGILA, pal: 'bjPedra', host: BJ_PEDRA, soils: BJ_SOILS },
  minerios: ['BJ_O_CARVAO', 'BJ_O_FERRO'],
  zona0: BJ_ZONE0,
  // o brejo: abafado e molhado, o eco curto da água parada; sapos, gotas, a madeira das palafitas rangendo, as
  // correntes das gaiolas, o vento nas cordas do patíbulo, sussurros e cantoria no Círculo. Sem melodia.
  ambiente: {
    rt: 2.2, damp: 0.7, wet: 0.32,
    beds: [['brown', 'lowpass', 60, 110, 0.7, 0.32, 0.46, 3.5], ['pink', 'lowpass', 180, 360, 0.8, 0.05, 0.13, 4],
      ['white', 'bandpass', 700, 1500, 3, 0.0, 0.04, 2.4, c => c.band === 2 ? 1.2 : 0.4]],
    ev: [[0.35, 'drip', c => c.band === 0 ? 1.4 : 0.8, true], [0.16, 'plop', c => c.band <= 1 ? 1.4 : 0.6], [0.1, 'bubble', c => c.band === 0 ? 1.2 : 0.6], [0.06, 'sog', c => c.band === 0 ? 1.4 : 0.6],
      [0.07, 'slap', c => c.band === 1 ? 1.3 : 0.4], [0.06, 'creakWood', c => c.band === 1 ? 1.5 : c.band === 2 ? 1 : 0.3], [0.04, 'chains', c => c.band === 2 ? 1.6 : c.band === 3 ? 0.6 : 0.1],
      [0.03, 'crow', c => c.band === 2 ? 1.8 : 0.5], [0.03, 'wetStep'], [0.05, 'whisper', c => c.band === 3 ? 1.6 : c.band === 2 ? 0.7 : 0.3], [0.08, 'chant', c => c.band === 3 ? 1 : 0],
      [0.02, 'sigh', c => c.band === 2 ? 1.2 : 0.5], [0.02, 'groan']]
  }
});

/* ---------- estados que o Brejo põe no herói (o 379 conta o tempo, desenha e solta) ----------
   enrolado: a mortalha molhada da lavadeira enrola o herói: sem atacar, anda a 55%, por `sec` s (bater as teclas de
             andar depressa solta antes).
   paralisado: a Mão de Glória: o herói fica parado (não anda, não pula, não ataca) por `sec` s; o escudo cai.
   envenenado: perde `dps` de vida por segundo por `sec` s (a poça da vassoura, a água verde do caldeirão).
   preso: a sanguessuga `e` grudada suga a vida; bater duas vezes nela ou ela morrer solta (bjSoltar). */
function bjEnrolar(sec) { if (!pl || pl.dead) return; pl.bjEnrolT = Math.max(pl.bjEnrolT || 0, sec * bjResiste()); pl.bjEnrolK = 0; }
function bjParalisar(sec) { if (!pl || pl.dead) return; pl.bjParaT = Math.max(pl.bjParaT || 0, sec * bjResiste()); }
function bjEnvenenar(sec, dps) { if (!pl || pl.dead) return; pl.bjVenT = Math.max(pl.bjVenT || 0, sec); pl.bjVenD = Math.max(dps, (pl.bjVenT > 0 ? pl.bjVenD || 0 : 0)); }
function bjPrender(e) { if (!pl || pl.dead || !e) return; pl.bjPresoE = e; }
function bjSoltar(e) { if (!pl) return; if (!e || pl.bjPresoE === e) pl.bjPresoE = null; }
// o Chapéu de Caçador de Bruxas (377): maldição e feitiço duram a metade
function bjResiste() { const h = equip && equip.head && ITEMS[equip.head.id]; return h && h.bjCaca ? 0.5 : 1; }
// as cores do Brejo: a água preta de turfa, o verde do fogo-fátuo, a chama da vela preta, a ferrugem, o veneno
const BJ_COL = { agua: '#2a1c0e', fatuo: '#a8e8b0', fatuoFrio: '#c8f0ff', vela: '#ffcf7a', ferrugem: '#a8542a', veneno: '#8ad04a', venenoClaro: '#c8f07a', turfa: '#3a2a1c', osso: '#cfc4a4' };
