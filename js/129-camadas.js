'use strict';

/* ================= as camadas: o registro (2026-10-10) =================
   A lista das camadas debaixo do vilarejo, de cima para baixo (docs/camadas/00-geral.md, seção 2). A posição de cada
   uma na lista decide os números que dependem da profundidade: o nível dos monstros, o do chefe, o nível de item do
   metal na forja e a linha da tabela de pedras preciosas (117). Camada nova entra na lista no lugar dela; o Abismo
   fica sempre por último até as 16 existirem (decisão do Jonathan, 2026-10-10), então os números dele seguem a
   posição. Cada gerador continua dono da sua faixa de linhas (o S0 de cada um começa onde a de cima termina).
   Carrega logo depois do 01-base. */

const LAYERS = [
  { id: 'cavernas', nome: 'As Cavernas' },
  { id: 'catedral', nome: 'A Catedral' },
  { id: 'gelo', nome: 'As Cavernas de Gelo' },
  { id: 'mina', nome: 'A Mina Abandonada' },
  { id: 'fungo', nome: 'As Minas Fúngicas' },
  { id: 'abismo', nome: 'O Abismo' }
];
const LAYER_D = 186;   // metros de cada camada
// posição da camada (1 = as Cavernas), 0 se ela não existe
const layerPos = id => LAYERS.findIndex(L => L.id === id) + 1;
// nível do primeiro monstro: cada camada começa 1 acima do último nível da de cima (cavernas 1 a 4, depois 2 por camada)
const layerLo = id => { const n = layerPos(id); return n <= 1 ? 1 : 2 * n + 1; };
// nível do chefe das camadas novas e de quem se move com a posição (2n + 3)
const layerBossLvl = id => 2 * layerPos(id) + 3;
// nível de item das peças forjadas com o metal da camada, da quinta em diante (2n - 1)
const layerForgeIl = id => 2 * layerPos(id) - 1;
