'use strict';

/* ================= versão do jogo e novidades =================
   VERSAO segue MAIOR.MENOR.CORREÇÃO (ainda 0.x enquanto o jogo está em desenvolvimento):
   - MENOR sobe a cada leva de conteúdo novo (camada, sistema, tela);
   - CORREÇÃO sobe quando só conserta ou ajusta algo que já existia;
   - MAIOR vira 1 no lançamento.
   Toda mudança publicada ganha uma linha aqui: se for de uma versão nova, sobe VERSAO e põe a entrada no topo de NOVIDADES.
   A tela de início (39-titulo) mostra a versão no canto e o menu Novidades. Carrega antes do 39-titulo. */
const VERSAO = '0.10.4';
const NOVIDADES = [
  { v: '0.10.4', data: '10/10/2026', titulo: 'Escuridão de verdade', itens: [
    'Debaixo da terra o escuro é quase total: sem tocha não se vê quase nada. Cogumelos, cristais, lava e as velas da catedral continuam iluminando.'
  ] },
  { v: '0.10.3', data: '10/10/2026', titulo: 'Cavernas no escuro', itens: [
    'As cavernas não têm mais tochas acesas por padrão: a luz é a das tochas que você leva.'
  ] },
  { v: '0.10.2', data: '10/10/2026', titulo: 'Sem missões', itens: [
    'As missões do Caetano saíram do jogo por enquanto; ele continua no vilarejo para conversar.'
  ] },
  { v: '0.10.1', data: '10/10/2026', titulo: 'Retratos nítidos', itens: [
    'Os retratos dos moradores na conversa foram repintados e ficaram nítidos, sem borrão.'
  ] },
  { v: '0.10.0', data: '10/10/2026', titulo: 'A descida', itens: [
    'Tela de início nova: um corte do chão que desce do poço do vilarejo, camada por camada, até a Escuridão, com o herói descendo na corda.'
  ] },
  { v: '0.9.8', data: '10/10/2026', titulo: 'Retrato limpo', itens: [
    'Na forja e na cozinha, o retrato da peça sendo feita mostra só o ícone do item, sem a arte de fundo.'
  ] },
  { v: '0.9.7', data: '10/10/2026', titulo: 'Sem luz própria', itens: [
    'O herói não brilha mais sozinho no escuro: a luz vem das tochas e dos itens com +Luz.'
  ] },
  { v: '0.9.6', data: '10/10/2026', titulo: 'Picaretas', itens: [
    'O herói começa com uma picareta de pedra.',
    'A bigorna forja uma picareta de cada metal.'
  ] },
  { v: '0.9.5', data: '10/10/2026', titulo: 'Começo mais duro', itens: [
    'Personagens novos começam sem poções de vida.',
    'O menu da tela de início não mostra mais a chama ao passar o mouse; só o texto muda de cor.'
  ] },
  { v: '0.9.4', data: '10/10/2026', titulo: 'Tela limpa', itens: [
    'Os avisos que apareciam no alto da tela foram removidos.'
  ] },
  { v: '0.9.3', data: '10/10/2026', titulo: 'Começo de madeira', itens: [
    'O herói começa com espada, montante e escudo de madeira.',
    'As receitas da forja perderam o "Forjado": agora é só Espada de Cobre, Montante de Ferro e assim por diante.'
  ] },
  { v: '0.9.2', data: '10/10/2026', titulo: 'Fim do travamento', itens: [
    'Corrigido o travamento da tela que acontecia pouco depois de entrar nas cavernas.',
    'As janelas da vila e das lojas não derrubam mais o FPS quando estão abertas.'
  ] },
  { v: '0.9.1', data: '10/10/2026', titulo: 'Correções de desempenho', itens: [
    'O jogo libera as imagens das partes do mundo que ficaram longe, para o FPS não cair com o tempo de jogo.',
    'Painel de diagnóstico de desempenho na tecla F9.',
    'O nível dos monstros acompanha a camada em que eles aparecem.',
    'Pedras preciosas em todas as camadas.',
    'A dica dos itens não mostra mais o nível do item.'
  ] },
  { v: '0.9.0', data: '10/10/2026', titulo: 'Personagens e novidades', itens: [
    'Vários personagens, cada um com o seu save. Novo jogo cria o personagem e já entra no mundo.',
    'Carregar, na tela de início, lista os personagens com nível e ouro; dá para excluir qualquer um.',
    'Excluir personagem no menu (Esc).',
    'O herói começa sem feitiço: a Aurélia vende um pergaminho lacrado por escola (Fogo, Raio, Gelo e Metamorfose) e abre o lacre, que vira um feitiço sorteado.',
    'Esta tela de Novidades e a versão do jogo no canto da tela de início.',
    'Não há mais baús de tesouro espalhados pelo mundo; o baú do vilarejo continua.',
    'A wiki ganhou o mapa das 16 camadas planejadas, cada uma com a sua especificação.'
  ] },
  { v: '0.8.0', data: '10/10/2026', titulo: 'O Abismo', itens: [
    'O Abismo, a quinta camada, debaixo da Mina: dez demônios novos e O Príncipe do Caos no fundo.',
    'Infernita, o metal do Abismo, com nove peças na forja.',
    'Escolas de magia: cinco feitiços de fogo, cinco de raio e cinco de gelo.',
    'Teodoro, o encantador, põe modificadores nas peças forjadas usando pedras preciosas, uma por camada.',
    'Cada morador do vilarejo ganhou corpo e roupa próprios.',
    'Dano de veneno, frio e fogo, resistidos pelos elixires.'
  ] },
  { v: '0.7.0', data: '09/10/2026', titulo: 'Magia e ofícios', itens: [
    'Feitiços em pergaminhos: Arco Voltaico, Forma de Morcego e Nevasca.',
    'Aurélia, a maga, com a sua torre, cajados, varinhas e tomos.',
    'Alquimia com a Marta: ervas de cada camada, poções e elixires.',
    'Cozinha com o Odo: pratos que recuperam vida e mana aos poucos.',
    'Sons de ambiente para cada cenário no lugar da música.',
    'O jogo continua rodando quando a janela perde o foco.'
  ] },
  { v: '0.6.0', data: '09/10/2026', titulo: 'Gelo e Mina', itens: [
    'Cavernas de Gelo, com O Yeti Ancestral no Trono de Gelo.',
    'Mina Abandonada, com goblins e O Rei Goblin na Escavadeira.',
    'Mundo três vezes mais largo, com um metal por camada.',
    'Montante, a espada de duas mãos.',
    'O herói sobe escadas, cordas e correntes de costas e agacha com S.'
  ] },
  { v: '0.5.0', data: '09/10/2026', titulo: 'Cavernas e Catedral', itens: [
    'Cavernas debaixo do vilarejo, com A Mãe-Teia na Câmara do Ninho.',
    'Catedral soterrada, com O Rei Esqueleto na sala do trono.',
    'Dez monstros em cada camada.',
    'Árvore de talentos do guerreiro (P).',
    'Portal para o vilarejo na barra de baixo.'
  ] },
  { v: '0.4.0', data: '09/10/2026', titulo: 'Under Darkness', itens: [
    'O jogo virou Under Darkness, com tela de início nova.',
    'Tela de opções com som, vídeo e atalhos.',
    'Céu, montanhas, floresta e árvores pintados à mão; globos grandes de vida e mana.',
    'Herói repintado e cursor do jogo em pixel art.',
    'Mapa (Tab) com as texturas reais do mundo.'
  ] },
  { v: '0.3.0', data: '08/10/2026', titulo: 'Interface', itens: [
    'Menu (Esc) em uma coluna, com Opções e Tela de início.',
    'Baú do vilarejo com 40 casas.',
    'Lojas em forma de vitrine e cartões de missão.',
    'Contador de FPS, quadro de atalhos e tela cheia que volta sozinha.'
  ] },
  { v: '0.2.0', data: '08/10/2026', titulo: 'Vilarejo e forja', itens: [
    'Vilarejo seguro na superfície, com ferreiro, curandeira, taverneiro e ancião.',
    'Forja: carvão, fornalha e bigorna com 32 receitas.',
    'Itens com raridade e propriedades sorteadas.'
  ] },
  { v: '0.1.0', data: '08/10/2026', titulo: 'Sob a Terra', itens: [
    'A primeira versão: um mundo para cavar, monstros com visão e caminho próprios, e o guerreiro subindo de nível.'
  ] }
];
