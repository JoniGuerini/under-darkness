'use strict';

/* ================= ofícios: as árvores de talentos de Ferraria, Culinária e Encantamento (só dados; a wiki carrega também) =================
   Pedido do Jonathan (2026-10-11): árvores no estilo do Diablo 2 para os ofícios. Usar a mecânica dá XP naquele ofício;
   cada nível do ofício dá 1 ponto para gastar na árvore dele. Cada árvore é uma aba "Talentos" na tela de criação dela:
   Ferraria na forja do Grimaldo (a fornalha, a bigorna, as runas e o Criar do inventário dão XP), Culinária na cozinha
   do Odo, Encantamento na oficina do Teodoro. A tela e os efeitos ficam no 331-oficios.js.
   Como no Diablo 2: cada ofício tem três galhos (abas à direita), cada galho é uma grade de 3 colunas e 6 linhas;
   cada linha pede um nível mínimo do ofício (OF_ROW_LVL); um talento só recebe ponto se os que apontam para ele
   (setas, `req`) já tiverem pelo menos 1; cada talento vai até `max` pontos e o efeito cresce a cada ponto.
   fx: [efeito, valor por ponto]; o texto (`t`) troca X pelo total. Ícone: 'i:<item>' (o ícone do item) ou 't:<ícone>'
   (os ícones da árvore de combate, TAL_ICON do 51). */

const OF_MAX_LVL = 30;
const OF_ROW_LVL = [1, 3, 6, 10, 15, 20];
const ofNeed = l => Math.round(12 * Math.pow(l, 1.5));   // XP do nível l para o l+1

const OFICIOS = {
  forja: {
    name: 'Ferraria', npc: 'Grimaldo',
    tabs: [
      { k: 'fornalha', name: 'Fornalha', sk: [
        { id: 'fole', n: 'Fole Forte', r: 0, c: 0, max: 5, ic: 'i:carvao', fx: [['velFor', 8]], t: 'A fornalha funde X% mais rápido.' },
        { id: 'brasa_mansa', n: 'Brasa Mansa', r: 0, c: 2, max: 5, ic: 't:crit', fx: [['carvao', 6]], t: 'X% de chance de a barra não gastar o carvão.' },
        { id: 'olho_metal', n: 'Olho no Metal', r: 1, c: 1, max: 5, ic: 'i:barra_ouro', req: ['fole'], fx: [['barraExtra', 4]], t: 'X% de chance de sair uma barra a mais.' },
        { id: 'escoria', n: 'Escória Limpa', r: 2, c: 2, max: 5, ic: 'i:min_ferro', req: ['brasa_mansa'], fx: [['minerio', 6]], t: 'X% de chance de um minério voltar para a mochila a cada barra.' },
        { id: 'suor', n: 'Suor de Ferreiro', r: 3, c: 0, max: 5, ic: 't:inicio', req: ['fole'], fx: [['xp', 8]], t: '+X% de experiência de Ferraria.' },
        { id: 'fundidor', n: 'Fundidor Mestre', r: 5, c: 1, max: 1, ic: 'i:barra_cobalto', req: ['olho_metal', 'escoria'], fx: [['quarta', 1]], t: 'A cada quatro barras fundidas, a quarta não gasta minério.' }
      ] },
      { k: 'bigorna', name: 'Bigorna', sk: [
        { id: 'martelo', n: 'Martelo Ritmado', r: 0, c: 1, max: 5, ic: 't:vel', fx: [['velBig', 8]], t: 'A bigorna forja X% mais rápido.' },
        { id: 'mao_economica', n: 'Mão Econômica', r: 1, c: 0, max: 5, ic: 'i:barra_ferro', req: ['martelo'], fx: [['poupaBig', 5]], t: 'X% de chance de as barras da peça voltarem para a mochila.' },
        { id: 'tempera', n: 'Têmpera', r: 1, c: 2, max: 5, ic: 'i:f_espada_ferro', req: ['martelo'], fx: [['ilvl', 6]], t: 'X% de chance de a peça sair mais bem temperada: os encantos do Teodoro nela saem mais fortes.' },
        { id: 'golpe_duplo', n: 'Golpe Duplo', r: 3, c: 0, max: 5, ic: 'i:f_maca_ferro', req: ['mao_economica'], fx: [['pecaExtra', 3]], t: 'X% de chance de forjar uma peça igual de graça.' },
        { id: 'fio_caprichado', n: 'Fio Caprichado', r: 3, c: 2, max: 5, ic: 'i:f_espada_cobre', req: ['tempera'], fx: [['fio', 3]], t: 'Armas forjadas na bigorna causam +X% de dano nas suas mãos.' },
        { id: 'obra_prima', n: 'Obra-Prima', r: 5, c: 1, max: 1, ic: 'i:f_espada_ouro', req: ['golpe_duplo', 'fio_caprichado'], fx: [['obra', 1]], t: 'Toda peça sai bem temperada.' }
      ] },
      { k: 'oficio', name: 'Ofício', sk: [
        { id: 'tocheiro', n: 'Tocheiro', r: 0, c: 0, max: 3, ic: 'i:tocha', fx: [['tocha', 1]], t: 'A tocha do Criar rende +X.' },
        { id: 'sob_medida', n: 'Sob Medida', r: 0, c: 2, max: 3, ic: 'i:f_peitoral_ferro', fx: [['sobMedida', 1]], t: '+X de Defesa por peça de armadura forjada que você veste.' },
        { id: 'carvoeiro', n: 'Carvoeiro', r: 1, c: 0, max: 1, ic: 'i:madeira', req: ['tocheiro'], fx: [['carvoeiro', 1]], t: 'O Criar ganha a receita de carvão: 3 madeiras viram 1 carvão.' },
        { id: 'maos_rapidas', n: 'Mãos Rápidas', r: 2, c: 2, max: 5, ic: 't:passo', req: ['sob_medida'], fx: [['velFor', 5], ['velBig', 5]], t: 'A fornalha e a bigorna trabalham X% mais rápido.' },
        { id: 'pa_carvao', n: 'Pá de Carvão', r: 3, c: 1, max: 2, ic: 'i:carvao', req: ['carvoeiro'], fx: [['pa', 1]], t: 'O carvão do Criar rende +X.' },
        { id: 'alma_forja', n: 'Alma da Forja', r: 5, c: 1, max: 1, ic: 't:critDmg', req: ['pa_carvao', 'maos_rapidas'], fx: [['almaForja', 1]], t: 'A fornalha nunca gasta carvão.' }
      ] }
    ]
  },
  cozinha: {
    name: 'Culinária', npc: 'Odo',
    tabs: [
      { k: 'fogao', name: 'Fogão', sk: [
        { id: 'mao_fogo', n: 'Mão no Fogo', r: 0, c: 0, max: 5, ic: 'i:carne_assada', fx: [['velCk', 10]], t: 'Os pratos ficam prontos X% mais rápido.' },
        { id: 'lenha_seca', n: 'Lenha Seca', r: 0, c: 2, max: 5, ic: 'i:madeira', fx: [['fuel', 8]], t: 'X% de chance de o prato não gastar combustível.' },
        { id: 'avental', n: 'Avental Sujo', r: 1, c: 1, max: 5, ic: 't:inicio', req: ['mao_fogo'], fx: [['xp', 10]], t: '+X% de experiência de Culinária.' },
        { id: 'fogo_alto', n: 'Fogo Alto', r: 2, c: 2, max: 5, ic: 't:vel', req: ['lenha_seca'], fx: [['velCk', 6]], t: 'Os pratos ficam prontos X% mais rápido.' },
        { id: 'caldeirao_grande', n: 'Caldeirão Grande', r: 3, c: 0, max: 1, ic: 'i:ensopado', req: ['mao_fogo'], fx: [['grande', 1]], t: 'O caldeirão cozinha dois pratos de cada vez com um combustível só.' },
        { id: 'fogo_eterno', n: 'Fogo Eterno', r: 5, c: 1, max: 1, ic: 't:crit', req: ['avental', 'fogo_alto'], fx: [['fogoEterno', 1]], t: 'Cozinhar nunca gasta combustível.' }
      ] },
      { k: 'sabor', name: 'Sabor', sk: [
        { id: 'tempero', n: 'Tempero', r: 0, c: 1, max: 5, ic: 'i:cogumelo', fx: [['cura', 6]], t: 'As comidas recuperam +X% de vida.' },
        { id: 'ervas', n: 'Ervas do Caminho', r: 1, c: 0, max: 5, ic: 't:espinhos', req: ['tempero'], fx: [['mana', 2]], t: 'As comidas recuperam +X de mana.' },
        { id: 'digestao', n: 'Digestão Rápida', r: 1, c: 2, max: 5, ic: 't:vel', req: ['tempero'], fx: [['digest', 8]], t: 'A comida recupera tudo em X% menos tempo.' },
        { id: 'barriga_cheia', n: 'Barriga Cheia', r: 3, c: 1, max: 3, ic: 't:def', req: ['ervas'], fx: [['barriga', 2]], t: '+X de Defesa enquanto a comida faz efeito.' },
        { id: 'banquete', n: 'Banquete', r: 5, c: 1, max: 1, ic: 't:vidaPct', req: ['barriga_cheia', 'digestao'], fx: [['banquete', 10]], t: '+X% de Vida máxima enquanto a comida faz efeito.' }
      ] },
      { k: 'mesa', name: 'Mesa', sk: [
        { id: 'garfada', n: 'Garfada Rápida', r: 0, c: 0, max: 5, ic: 'i:carne_crua', fx: [['garfada', 10]], t: 'Comer leva X% menos tempo.' },
        { id: 'mordida', n: 'Primeira Mordida', r: 0, c: 2, max: 5, ic: 't:vida', fx: [['mordida', 8]], t: 'X% da vida da comida volta na hora.' },
        { id: 'estrada', n: 'Comer na Estrada', r: 2, c: 0, max: 1, ic: 't:passo', req: ['garfada'], fx: [['estrada', 1]], t: 'Andar não interrompe a comida: você come andando devagar.' },
        { id: 'estomago', n: 'Estômago de Ferro', r: 2, c: 2, max: 1, ic: 't:escudo', req: ['mordida'], fx: [['estomago', 1]], t: 'Levar dano não interrompe a comida.' },
        { id: 'sobremesa', n: 'Sobremesa', r: 4, c: 1, max: 1, ic: 'i:ensopado', req: ['estrada', 'estomago'], fx: [['sobremesa', 1]], t: 'Comer de novo soma ao que faltava da comida anterior, em vez de trocar.' }
      ] }
    ]
  },
  encanto: {
    name: 'Encantamento', npc: 'Teodoro',
    tabs: [
      { k: 'lapidacao', name: 'Lapidação', sk: [
        { id: 'lupa', n: 'Lupa Firme', r: 0, c: 0, max: 5, ic: 't:vel', fx: [['velEnc', 10]], t: 'O encanto pega X% mais rápido.' },
        { id: 'mao_leve', n: 'Mão Leve', r: 0, c: 2, max: 5, ic: 'i:gema_topazio', fx: [['poupaGema', 5]], t: 'X% de chance de a pedra voltar inteira.' },
        { id: 'estudo', n: 'Estudo das Pedras', r: 1, c: 1, max: 5, ic: 't:inicio', req: ['lupa'], fx: [['xp', 10]], t: '+X% de experiência de Encantamento.' },
        { id: 'lapidario', n: 'Lapidário', r: 3, c: 2, max: 5, ic: 'i:gema_esmeralda', req: ['mao_leve'], fx: [['lapid', 5]], t: 'X% de chance de sair uma pedra preciosa a mais ao minerar uma.' },
        { id: 'pedra_viva', n: 'Pedra Viva', r: 5, c: 1, max: 1, ic: 'i:min_cristal', req: ['estudo', 'lapidario'], fx: [['pedraViva', 1]], t: 'Quando o encanto sai incomum, a pedra volta.' }
      ] },
      { k: 'sorte', name: 'Sorte', sk: [
        { id: 'brilho', n: 'Brilho Interior', r: 0, c: 1, max: 5, ic: 't:crit', fx: [['brilho', 2]], t: 'X% da chance de incomum passa para raro.' },
        { id: 'eco', n: 'Eco do Encanto', r: 1, c: 0, max: 5, ic: 't:esquiva', req: ['brilho'], fx: [['eco', 4]], t: 'X% de chance de sortear duas vezes e ficar com o melhor.' },
        { id: 'veio_raro', n: 'Veio Raro', r: 2, c: 2, max: 5, ic: 'i:gema_safira', req: ['brilho'], fx: [['veio', 2]], t: 'X% da chance de raro passa para épico.' },
        { id: 'sussurro', n: 'Sussurro Lendário', r: 4, c: 1, max: 5, ic: 'i:gema_rubi', req: ['veio_raro'], fx: [['sussurro', 1]], t: 'X% da chance de épico passa para lendário.' },
        { id: 'segunda', n: 'Segunda Chance', r: 5, c: 0, max: 1, ic: 't:critDmg', req: ['eco'], fx: [['segunda', 1]], t: 'Todo encanto é sorteado duas vezes e fica o melhor.' }
      ] },
      { k: 'afinidade', name: 'Afinidades', sk: [
        { id: 'af_topazio', n: 'Afinidade: Topázio', r: 0, c: 0, max: 5, ic: 'i:gema_topazio', fx: [['af:gema_topazio', 3]], t: 'Com topázio, X% da chance de cada raridade sobe para a de cima.' },
        { id: 'af_esmeralda', n: 'Afinidade: Esmeralda', r: 1, c: 1, max: 5, ic: 'i:gema_esmeralda', req: ['af_topazio'], fx: [['af:gema_esmeralda', 3]], t: 'Com esmeralda, X% da chance de cada raridade sobe para a de cima.' },
        { id: 'af_safira', n: 'Afinidade: Safira', r: 2, c: 2, max: 5, ic: 'i:gema_safira', req: ['af_esmeralda'], fx: [['af:gema_safira', 3]], t: 'Com safira, X% da chance de cada raridade sobe para a de cima.' },
        { id: 'af_cristal', n: 'Afinidade: Cristal', r: 3, c: 1, max: 5, ic: 'i:min_cristal', req: ['af_safira'], fx: [['af:min_cristal', 3]], t: 'Com cristal bruto, X% da chance de cada raridade sobe para a de cima.' },
        { id: 'af_rubi', n: 'Afinidade: Rubi', r: 4, c: 0, max: 5, ic: 'i:gema_rubi', req: ['af_cristal'], fx: [['af:gema_rubi', 3]], t: 'Com rubi, X% da chance de cada raridade sobe para a de cima.' },
        { id: 'perfeita', n: 'Lapidação Perfeita', r: 5, c: 1, max: 1, ic: 't:aparo', req: ['af_rubi'], fx: [['velEnc', 50]], t: 'O encanto pega X% mais rápido.' }
      ] }
    ]
  }
};

// índice: OF_SK[id] = { ...talento, prof, tab }
const OF_SK = {};
for (const p in OFICIOS) for (const T of OFICIOS[p].tabs) for (const s of T.sk) OF_SK[s.id] = Object.assign(s, { prof: p, tab: T.k, req: s.req || [] });
const ofTxt = (s, rank) => s.t.replace('X', String(Math.round(s.fx[0][1] * rank * 10) / 10).replace('.', ','));
