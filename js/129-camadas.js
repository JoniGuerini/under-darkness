'use strict';

/* ================= as camadas: o registro (2026-10-10) =================
   A lista das camadas debaixo do vilarejo, de cima para baixo (docs/camadas/00-geral.md, seção 2). A posição de cada
   uma na lista decide os números que dependem da profundidade: o nível dos monstros, o do chefe, o nível de item do
   metal na forja e a linha da tabela de pedras preciosas (117). Camada nova entra na lista no lugar dela; o Abismo
   fica abaixo de todas as camadas do meio e a Escuridão (220 a 229), o fundo do mundo, sempre logo abaixo dele
   (decisões do Jonathan, 2026-10-10), então os números dos dois seguem a posição. Cada gerador continua dono da sua
   faixa de linhas (o S0 de cada um começa onde a de cima termina).
   Carrega logo depois do 01-base. */

const LAYERS = [
  // Ato I. Debaixo do vilarejo (níveis 1 a 20)
  { id: 'cavernas', nome: 'As Cavernas' },
  { id: 'catedral', nome: 'A Catedral' },
  { id: 'gelo', nome: 'As Cavernas de Gelo' },
  { id: 'mina', nome: 'A Mina Abandonada' },
  // Ato II. O que a superfície esqueceu (21 a 40)
  { id: 'fungo', nome: 'As Minas Fúngicas' },
  { id: 'brejo', nome: 'O Brejo das Bruxas' },          // no lugar da Colmeia (Jonathan, 2026-10-21)
  { id: 'cidade', nome: 'A Cidade Afundada' },
  { id: 'floresta', nome: 'A Floresta Petrificada' },
  // Ato III. Os reinos antigos (41 a 60)
  { id: 'anoes', nome: 'A Fortaleza dos Anões' },
  { id: 'elfos', nome: 'O Reino Élfico' },
  { id: 'mar', nome: 'O Mar Sem Sol' },
  { id: 'dragao', nome: 'O Covil do Dragão' },
  // Ato IV. As profundezas (61 a 80)
  { id: 'titas', nome: 'O Ossário dos Titãs' },
  { id: 'necropole', nome: 'A Necrópole do Rei Eterno' },
  { id: 'antigos', nome: 'A Cidade dos Antigos' },
  { id: 'prisao', nome: 'A Prisão dos Deuses' },
  // Ato V. O fim do mundo (81 a 100)
  { id: 'guerra', nome: 'O Campo da Última Guerra' },
  { id: 'abismo', nome: 'O Abismo' },
  { id: 'acendedores', nome: 'As Ruínas dos Acendedores' },
  { id: 'escuro', nome: 'A Escuridão' }   // o fundo do mundo: sempre a última
];
/* O revamp de 2026-10-21 (Jonathan): 20 camadas de 5 níveis, do 1 ao 100. A Colmeia, a Nave Caída e os Salões do
   Pesadelo saíram da geração (os arquivos 190-199, 240-249 e 300-309 continuam na pasta, fora do index.html, para
   virarem fases paralelas depois). */
const LAYER_D = LAYER_DESIGN * LAYER_K;   // linhas (metros) de cada camada: 186 do desenho vezes LAYER_K (558 desde 2026-10-12)
// posição da camada (1 = as Cavernas), 0 se ela não existe
const layerPos = id => LAYERS.findIndex(L => L.id === id) + 1;
// o topo da camada em metros abaixo do chão do vilarejo
const layerTop = id => (layerPos(id) - 1) * LAYER_D;

/* ---------- os níveis (2026-10-21) ----------
   O nível que o jogador vê: a camada N tem monstros do 5N-4 ao 5N-1 e o chefe no 5N (Cavernas 1 a 4 e chefe 5, ...,
   Nox no 100). As contas de vida, dano, XP e velocidade usam a FORÇA (e.lvl), a escala de antes (2 níveis por camada),
   para o equilíbrio das armas e da forja não mudar: força = nível até o 4, depois 0,4 x nível + 2,5. nvDe(força) dá o
   nível visto de volta. */
const lvlPw = n => n <= 4 ? n : 0.4 * n + 2.5;
const nvDe = p => p <= 4 ? Math.round(p) : Math.round((p - 2.5) / 0.4);
// a força do primeiro monstro da camada (nível visto 5N-4)
const layerLo = id => lvlPw(5 * Math.max(1, layerPos(id)) - 4);
// a força do chefe da camada (nível visto 5N)
const layerBossLvl = id => lvlPw(5 * Math.max(1, layerPos(id)));
// nível de item das peças forjadas com o metal da camada, da quinta em diante (2n - 1)
const layerForgeIl = id => 2 * layerPos(id) - 1;

/* ---------- a corrente das camadas (2026-10-21) ----------
   Cada camada diz como ela é vista pela de baixo (camadaInfo); camadaAcima(id) devolve a camada de cima que existe
   (a mais perto na lista que registrou info): primeira linha S0, altura D, topo em metros TOP, o chão natural (soils),
   as duas descidas ({ cx, x0, x1, fy, w, top } em halls e exits), a sala do chefe (boss), o que se sobe (climb), a
   rocha onde as últimas linhas afinam (thin, thinW) e a rocha hospedeira (host). Assim tirar ou pôr uma camada no
   meio só mexe na lista. CAMADA_EXT[id] guarda o que os sistemas comuns (87, 97, 117, 313, 353, 75) precisam saber de
   uma camada nova: ver docs/camadas/00-geral.md, seção "Contrato das camadas novas". */
const CAMADA_INFO = {}, CAMADA_EXT = {};
function camadaInfo(id, f) { CAMADA_INFO[id] = f; }
function camadaExt(id, X) { X.id = id; CAMADA_EXT[id] = Object.assign(CAMADA_EXT[id] || {}, X); return CAMADA_EXT[id]; }
function camadaAcima(id, ate) {
  const k = layerPos(id) - 1;
  for (let j = k - 1; j >= 0; j--) {
    const L = LAYERS[j], f = CAMADA_INFO[L.id]; if (!f) continue;
    let o = null; try { o = f(); } catch (e) { o = null; }
    if (!o) continue;
    o.id = L.id; o.halls = o.halls || o.exits || []; o.exits = o.exits || o.halls; if (o.TOP === undefined) o.TOP = layerTop(L.id);
    if (!o.climb) o.climb = CHAIN; if (o.thin === undefined) o.thin = STONE;
    return o;
  }
  return null;
}

// a info por nomes (resolvidos na hora, quando a camada já existe): camadaNomes('anoes', { on: 'ANOES', S0: 'AN_S0', ... })
const CAMG_FN = new Map();   // um leitor por nome, feito uma vez (eval a cada chamada deixava a geração lenta)
const camG = n => {
  if (!n) return undefined;
  let f = CAMG_FN.get(n);
  if (!f) { f = new Function(`return typeof ${n} !== 'undefined' ? ${n} : undefined;`); CAMG_FN.set(n, f); }
  try { return f(); } catch (e) { return undefined; }
};
function camadaNomes(id, N) {
  camadaInfo(id, () => {
    if (N.on && !camG(N.on)) return null;
    const o = {}; for (const k in N) if (k !== 'on') o[k] = camG(N[k]);
    if (typeof o.S0 !== 'number' || typeof o.D !== 'number') return null;
    return o;
  });
}
camadaNomes('mina', { on: 'MINA', S0: 'MN_S0', D: 'MN_D', soils: 'MN_SOILS', thin: 'MN_ESCORIA', thinW: 'WMN_TIJOLO', halls: 'mnExits', boss: 'mnBoss' });
camadaNomes('fungo', { on: 'FUNGO', S0: 'FG_S0', D: 'FG_D', soils: 'FG_SOILS', thin: 'FG_CARNE', thinW: 'WFG_CARNE', halls: 'fungDown', boss: 'fungBoss', host: 'FG_HOST', climb: 'FG_ESCADA' });
camadaNomes('cidade', { on: 'CIDADE', S0: 'CD_S0', D: 'CD_D', soils: 'CD_SOILS', thin: 'CD_ATERRO', thinW: 'WCD_TIJOLO', halls: 'cdDown', boss: 'cdBoss', host: 'CD_HOST', climb: 'CD_ESCADA' });
camadaNomes('floresta', { on: 'FLORESTA', S0: 'FP_S0', D: 'FP_D', soils: 'FP_SOILS', thin: 'FP_GRANITO', thinW: 'WFP_GRANITO', halls: 'fpExits', boss: 'fpBoss', host: 'FP_HOST', climb: 'FP_RAIZ_ESCADA' });
camadaNomes('anoes', { on: 'ANOES', S0: 'AN_S0', D: 'AN_D', soils: 'AN_SOILS', thin: 'AN_GRANITO', thinW: 'WAN_GRANITO', halls: 'anExits', boss: 'anBoss', host: 'AN_HOST', climb: 'AN_CORRENTE' });
camadaNomes('elfos', { on: 'ELFOS', S0: 'EL_S0', D: 'EL_D', soils: 'EL_SOILS', thin: 'EL_PEDRA_POCO', thinW: 'WEL_POCO', halls: 'elExits', boss: 'elBoss', climb: 'EL_ESCADA', root: 'EL_RAIZ' });
camadaNomes('mar', { on: 'MAR', S0: 'MS_S0', D: 'MS_D', soils: 'MS_SOILS', thin: 'MS_SULFETO', thinW: 'WMS_SULFETO', halls: 'msExits', boss: 'msBoss', climb: 'MS_CORDAME' });
camadaNomes('dragao', { on: 'DRAGAO', S0: 'DG_S0', D: 'DG_D', soils: 'DG_SOILS', thin: 'DG_OBSIDIANA', thinW: 'WDG_OBSIDIANA', halls: 'dgExits', boss: 'dgBoss', climb: 'DG_ESCADA' });
camadaNomes('titas', { on: 'TITAS', S0: 'TT_S0', D: 'TT_D', soils: 'TT_SOILS', thin: 'TT_ROCHA', thinW: 'WTT_ROCHA', halls: 'ttExits', boss: 'ttBoss', climb: 'TT_ESCADA' });
camadaNomes('antigos', { on: 'ANTIGOS', S0: 'AT_S0', D: 'AT_D', soils: 'AT_SOILS', thin: 'AT_THIN', thinW: 'WAT_LAJE', halls: 'atExits', boss: 'atBoss', climb: 'AT_ESCADA' });
camadaNomes('abismo', { on: 'ABISMO', S0: 'AB_S0', D: 'AB_D', soils: 'AB_SOILS', thin: 'AB_BASALTO', thinW: 'WAB_BASALTO', halls: 'abExits', boss: 'abBoss', climb: 'AB_ESCADA' });

/* ---------- a geração aos poucos (2026-10-12) ----------
   Pedido do Jonathan (2026-10-12): o mundo não precisa nascer inteiro; no começo saem a superfície, as Cavernas e a
   Catedral, e cada camada nova sai quando o herói chega na de cima dela (js/312-gera-aos-poucos.js decide quando).
   Cada gerador de camada embrulha buildCathedral como antes, mas entrega o seu trabalho a genStage (que guarda para
   depois enquanto o 312 conduz) e os passes que rodavam depois de todas as camadas (ligações, pedras, ervas, bacias)
   se registram em genPos e rodam depois de cada leva, só sobre as camadas novas (genNovas). */
const GEN_FILA = [], GEN_POS = [];
let genGuarda = false;   // o 312 liga enquanto o buildCathedral roda: os passos das camadas ficam na fila
let genNovas = LAYERS.map(L => L.id);   // as camadas da leva que está rodando
let genFundo = WH;       // a primeira linha que ainda não foi gerada (abaixo dela é só rocha)
let genDeepA = 0;        // o cathedralDeep refaz a camada de trás só desta linha para baixo (312, ao gerar mais)
function genStage(id, fn) { if (genGuarda) GEN_FILA.push({ id, fn }); else fn(); }
function genPos(fn, id) { GEN_POS.push({ fn, id: id || null }); }
const genNova = id => genNovas.includes(id);
// o topo (S0) e a altura de cada camada, pelos nomes de cada gerador
const GEN_NOMES = {
  cavernas: ['CV_S0', 'CAVE_D'], catedral: ['CB_S0', 'Math.round(LAYER_D * CB_F)'], gelo: ['IC_S0', 'IC_D'], mina: ['MN_S0', 'MN_D'], fungo: ['FG_S0', 'FG_D'],
  cidade: ['CD_S0', 'CD_D'], floresta: ['FP_S0', 'FP_D'], anoes: ['AN_S0', 'AN_D'], colmeia: ['CM_S0', 'CM_D'], nave: ['NV_S0', 'NV_D'], elfos: ['EL_S0', 'EL_D'],
  mar: ['MS_S0', 'MS_D'], dragao: ['DG_S0', 'DG_D'], titas: ['TT_S0', 'TT_D'], antigos: ['AT_S0', 'AT_D'], pesadelo: ['PS_S0', 'PS_D'], abismo: ['AB_S0', 'AB_D'], escuro: ['ES_S0', 'ES_D'],
  brejo: ['BJ_S0', 'BJ_D'], necropole: ['NC_S0', 'NC_D'], prisao: ['PD_S0', 'PD_D'], guerra: ['GU_S0', 'GU_D'], acendedores: ['AC_S0', 'AC_D']
};
// a camada de cima que existe neste jogo (a mais perto na lista com linhas)
function layerAcimaId(id) { for (let j = layerPos(id) - 2; j >= 0; j--) if (genLinhas(LAYERS[j].id)) return LAYERS[j].id; return null; }
function genLinhas(id) {   // [primeira linha, linha depois da última] da camada; null se não existe
  const n = GEN_NOMES[id]; if (!n) return null;
  try { const s = (0, eval)(n[0]), d = (0, eval)(n[1]); return typeof s === 'number' && typeof d === 'number' ? [s, Math.min(WH, s + d)] : null; } catch (e) { return null; }
}
// as linhas que a leva atual cobre (das camadas novas)
function genFaixaNova() {
  let a = WH, b = 0;
  for (const id of genNovas) { const r = genLinhas(id); if (r) { a = Math.min(a, r[0]); b = Math.max(b, r[1]); } }
  return a < b ? [a, b] : [0, WH];
}
