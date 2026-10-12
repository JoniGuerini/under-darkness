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
  { id: 'cavernas', nome: 'As Cavernas' },
  { id: 'catedral', nome: 'A Catedral' },
  { id: 'gelo', nome: 'As Cavernas de Gelo' },
  { id: 'mina', nome: 'A Mina Abandonada' },
  { id: 'fungo', nome: 'As Minas Fúngicas' },
  { id: 'cidade', nome: 'A Cidade Afundada' },
  { id: 'floresta', nome: 'A Floresta Petrificada' },
  { id: 'anoes', nome: 'A Fortaleza dos Anões' },
  { id: 'colmeia', nome: 'A Colmeia' },
  { id: 'nave', nome: 'A Nave Caída' },   // a nave dos Visitantes (2026-10-11), pedida pelo Jonathan fora do mapa das 16
  { id: 'elfos', nome: 'O Reino Élfico' },   // os elfos da lua (2026-10-11), pedidos pelo Jonathan: Senhor dos Anéis e Warcraft
  { id: 'mar', nome: 'O Mar Sem Sol' },       // o mar debaixo da terra (2026-10-11, js/260)
  { id: 'dragao', nome: 'O Covil do Dragão' },   // o vulcão de Cinzarel (2026-10-11), debaixo do Mar Sem Sol
  { id: 'titas', nome: 'O Ossário dos Titãs' },   // o cemitério dos gigantes (2026-10-11): debaixo do Covil, em cima da Cidade dos Antigos
  // a Cidade dos Antigos (290-299, 2026-10-11): 15ª, debaixo do Ossário dos Titãs
  { id: 'antigos', nome: 'A Cidade dos Antigos' },
  { id: 'pesadelo', nome: 'Os Salões do Pesadelo' },   // o sonho que vira real (2026-10-11), logo acima do Abismo
  { id: 'abismo', nome: 'O Abismo' },
  { id: 'escuro', nome: 'A Escuridão' }   // o fundo do mundo: fica sempre logo abaixo do Abismo (Jonathan, 2026-10-10)
];
const LAYER_D = LAYER_DESIGN * LAYER_K;   // linhas (metros) de cada camada: 186 do desenho vezes LAYER_K (558 desde 2026-10-12)
// posição da camada (1 = as Cavernas), 0 se ela não existe
const layerPos = id => LAYERS.findIndex(L => L.id === id) + 1;
// nível do primeiro monstro: cada camada começa 1 acima do último nível da de cima (cavernas 1 a 4, depois 2 por camada)
const layerLo = id => { const n = layerPos(id); return n <= 1 ? 1 : 2 * n + 1; };
// nível do chefe das camadas novas e de quem se move com a posição (2n + 3)
const layerBossLvl = id => 2 * layerPos(id) + 3;
// nível de item das peças forjadas com o metal da camada, da quinta em diante (2n - 1)
const layerForgeIl = id => 2 * layerPos(id) - 1;

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
  mar: ['MS_S0', 'MS_D'], dragao: ['DG_S0', 'DG_D'], titas: ['TT_S0', 'TT_D'], antigos: ['AT_S0', 'AT_D'], pesadelo: ['PS_S0', 'PS_D'], abismo: ['AB_S0', 'AB_D'], escuro: ['ES_S0', 'ES_D']
};
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
