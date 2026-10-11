'use strict';

/* ================= versão do jogo e novidades =================
   VERSAO segue MAIOR.MENOR.CORREÇÃO (ainda 0.x enquanto o jogo está em desenvolvimento):
   - MENOR sobe a cada leva de conteúdo novo (camada, sistema, tela);
   - CORREÇÃO sobe quando só conserta ou ajusta algo que já existia;
   - MAIOR vira 1 no lançamento.
   Toda mudança publicada ganha uma linha aqui: se for de uma versão nova, sobe VERSAO e põe a entrada no topo de NOVIDADES.
   A tela de início (39-titulo) mostra a versão no canto e o menu Novidades. Carrega antes do 39-titulo. */
const VERSAO = '0.28.1';
const NOVIDADES = [
  { v: '0.28.1', data: '11/10/2026', titulo: 'Wiki', itens: [
    'Na wiki, o Covil do Dragão aparece no lugar certo: debaixo do Mar Sem Sol, de 2232 a 2418 m.'
  ] },
  { v: '0.28.0', data: '11/10/2026', titulo: 'Cinco camadas novas', itens: [
    'O Mar Sem Sol (camada 12, 2046 a 2232 m), com O Leviatã e o oricalco.',
    'O Covil do Dragão (camada 13, 2232 a 2418 m), com Cinzarel, o Dragão Ancião, e o dracônio.',
    'O Ossário dos Titãs (camada 14, 2418 a 2604 m), com O Último Titã e a adamantita.',
    'A Cidade dos Antigos (camada 15, 2604 a 2790 m), com O Arquiteto e o ferro estelar.',
    'Os Salões do Pesadelo (camada 16, 2790 a 2976 m), com O Sem-Rosto e a onirita.',
    'O Abismo desceu para 2976 a 3162 m e a Escuridão para 3162 a 3348 m. Mundos de antes são refeitos; nível, itens, ouro e o baú da vila continuam.'
  ] },
  { v: '0.27.0', data: '11/10/2026', titulo: 'Árvores tombam', itens: [
    'A árvore agora aguenta 4 golpes de picareta; a cada golpe ela treme e solta folhas.',
    'No último golpe ela tomba para o lado, some ao tocar o chão e a madeira fica espalhada ao longo de onde ela caiu.'
  ] },
  { v: '0.26.0', data: '11/10/2026', titulo: 'Plataforma', itens: [
    'Nova receita no Criar: 1 madeira vira 8 plataformas. A plataforma é uma tábua fina: você pula através dela por baixo e para em cima, para atravessar buracos e subir penhascos. S + pulo desce por ela.'
  ] },
  { v: '0.25.4', data: '11/10/2026', titulo: 'Ícones dos montantes', itens: [
    'Ícones novos para todos os montantes, incluindo o Montante do Eclipse.'
  ] },
  { v: '0.25.3', data: '11/10/2026', titulo: 'Botão direito', itens: [
    'O botão direito não abre mais o menu do navegador em nenhum lugar do jogo, nem na barra de ações, no HUD ou nas janelas.'
  ] },
  { v: '0.25.2', data: '11/10/2026', titulo: 'A Dama do Espelho', itens: [
    'Nova arte na tela de início: A Dama do Espelho, do Reino Élfico.'
  ] },
  { v: '0.25.1', data: '11/10/2026', titulo: 'Tochas infinitas', itens: [
    'Modo deus (F4, para testes): nova opção Tochas infinitas em Menu > Testes > Modo deus, que põe tocha sem gastar nenhuma.'
  ] },
  { v: '0.25.0', data: '11/10/2026', titulo: 'O Reino Élfico', itens: [
    'O Reino Élfico: nova camada 11 entre a Nave e o Abismo.'
  ] },
  { v: '0.24.0', data: '11/10/2026', titulo: 'A Nave Caída', itens: [
    'Camada 10, A Nave Caída (1674 a 1860 m): uma nave alienígena em neon enterrada debaixo da Colmeia, com visitantes, discos abdutores, hipnose e gosma, o chefe O Olho-Cometa no Planetário e o metal xenita.',
    'O Abismo desceu para 1860 a 2046 m.'
  ] },
  { v: '0.23.0', data: '11/10/2026', titulo: 'Bolsa de blocos', itens: [
    'Botão Blocos no inventário: uma bolsa com uma casa para cada bloco do jogo, separada em páginas por bioma. Todo bloco coletado vai direto para ela e não ocupa mais a mochila.',
    'Arraste um bloco da bolsa para a barra para usar; a pilha da barra se completa sozinha com o que houver na bolsa.'
  ] },
  { v: '0.22.3', data: '10/10/2026', titulo: 'Bichos das Cavernas', itens: [
    'Besouro Couraçado leva dano pela frente (armadura alta em vez de bloqueio total); Rato-de-Gruta um pouco mais lento.'
  ] },
  { v: '0.22.2', data: '10/10/2026', titulo: 'Cozinha', itens: [
    'Na cozinha do Odo, assar é 1 para 1: 1 Carne Crua vira 1 Carne Assada. Todo prato agora gasta 1 madeira ou 1 carvão para o fogo.',
    'A Carne Assada devolve 8 de vida em 8 segundos, já que custa metade da carne.'
  ] },
  { v: '0.22.1', data: '10/10/2026', titulo: 'Cura da Marta', itens: [
    'A Marta volta a curar sua vida e mana de graça.'
  ] },
  { v: '0.22.0', data: '10/10/2026', titulo: 'Árvores', itens: [
    'As árvores cortadas da superfície voltam aos poucos: a cada 4 horas do jogo nasce uma árvore nova em algum lugar longe da vista, até o mundo ter de novo as árvores que tinha.'
  ] },
  { v: '0.21.1', data: '10/10/2026', titulo: 'Carregamento', itens: [
    'A geração do mundo não trava mais se você trocar de aba.'
  ] },
  { v: '0.21.0', data: '10/10/2026', titulo: 'Criar', itens: [
    'Botão Criar no inventário, ao lado do Organizar: 1 carvão + 1 madeira viram 4 tochas, direto na mão. Os materiais podem estar na mochila ou no baú.'
  ] },
  { v: '0.20.2', data: '10/10/2026', titulo: 'Carregando', itens: [
    'Tela de carregamento enquanto o mundo é gerado.'
  ] },
  { v: '0.20.1', data: '10/10/2026', titulo: 'Respirar', itens: [
    'O herói e os moradores do vilarejo, parados, respiram, balançam os braços de leve e piscam de vez em quando.'
  ] },
  { v: '0.20.0', data: '10/10/2026', titulo: 'HUD nova', itens: [
    'O quadro do canto de cima mostra só o relógio do dia.',
    'Casas próprias fora da barra de ação: poção de vida e tocha ao lado do globo de vida, poção de mana ao lado do globo de mana. Tochas e poções vão direto para elas e não ocupam mais a barra.',
    'R bebe a poção de vida, T a de mana, Q põe tocha. Clicar na casa da poção também bebe. No inventário, as três casas ficam debaixo da barra para trocar qual poção fica nelas.'
  ] },
  { v: '0.19.1', data: '10/10/2026', titulo: 'As piras do Nox e a arte da Escuridão', itens: [
    'As seis piras da sala do Nox agora acendem com lume-fátuo, como os braseiros (ajoelhado 1 s); tocha não acende mais. Elas ardem azuis durante a luta.',
    'Ao lado de cada pira fria espera um lume-fátuo. Quando o Nox ou os apagadores apagam uma pira, o lume dela foge voando pela sala e pousa longe: é preciso ir buscá-lo para acender de novo. Se a luta acaba sem vitória, os lumes das piras acesas voltam para o lado delas.',
    'Depois da vitória, as piras acendem sozinhas com fogo quente de verdade.',
    'Nova arte na tela de início: A Escuridão. O herói ergue um lume-fátuo ao lado do único braseiro aceso, e do outro lado do poço sem fundo o Nox estende o braço para a chama; ao longe, a Rota dos Acendedores.'
  ] },
  { v: '0.19.0', data: '10/10/2026', titulo: 'A Escuridão', itens: [
    'Nova camada, o fundo do mundo: A Escuridão (1860 a 2046 m), logo abaixo do Abismo. Dois poços saem do chão dos Templos do Caos e uma corrente desce até um Posto dos Acendedores com o único braseiro eterno da camada.',
    'Quatro faixas: A Borda Apagada, O Breu, As Raízes da Noite e O Fundo do Mundo. Ruínas dos Acendedores, Grandes Vãos com poços sem fundo, raízes do tamanho de torres, altares frios e os dois Selos do Fundo.',
    'Aqui a luz é tudo: quase não há claridade, as tochas viram tocha morta em 90 s e a Rota dos Acendedores (braseiros apagados) leva até o chefe. Luz forte queima as criaturas da sombra.',
    'Lume-fátuo: a chama azul que flutua pelo bioma. Encoste nela para pegar e use num braseiro (tecla de usar) para acendê-lo com uma luz azul que nenhum monstro apaga. Tocha não acende braseiro; os monstros apagam só as tochas que você põe.',
    'O mapa da camada esquece o que não está aceso; o breu vivo cresce no escuro e fecha passagens; a laje de penumbra só segura quem pisa com luz em cima dela.',
    '10 monstros novos: o Apagador, a Boca do Breu, a Mariposa Negra, o Vigia Sem Olhos, o Colosso de Breu, o Rastro, a Mortalha, o Ouvinte, o Acendedor Oco e a Mão do Fundo.',
    'Chefe: Nox, Aquele Que Apaga, no Escuro Total. Só toma dano com luz em cima; acenda as seis piras dos Acendedores (ajoelhado, com uma tocha cada) enquanto ele tenta apagá-las. Matá-lo deixa o mundo inteiro um pouco menos escuro e solta A Última Brasa.',
    'Novo metal: o noctírio, com as 9 peças na bigorna. Bases novas: Lâmina de Vidro Negro, Manto de Breu e Escudo dos Acendedores.',
    'O mundo foi refeito por causa da camada nova; nível, itens, ouro e o baú da vila continuam.'
  ] },
  { v: '0.18.0', data: '10/10/2026', titulo: 'Telas de início', itens: [
    'A tela de início sorteia uma arte a cada abertura: a descida do poço e uma cena de cada camada (Cavernas, Catedral, Gelo, Mina, Minas Fúngicas e Abismo).'
  ] },
  { v: '0.17.0', data: '10/10/2026', titulo: 'A Colmeia', itens: [
    'Camada 9, A Colmeia (1488 a 1674 m): cera, favos e âmbar com anões presos, 10 insetos novos, a chefe A Rainha e a ambrita.',
    'O Abismo desceu para 1674 a 1860 m e continua sendo a última camada.'
  ] },
  { v: '0.16.0', data: '10/10/2026', titulo: 'A Fortaleza dos Anões', itens: [
    'Camada 8, A Fortaleza dos Anões (1302 a 1488 m): salões de granito e bronze, alavancas e comportas, autômatos e fantasmas anões, o chefe O Autômato-Forja e o mithril.'
  ] },
  { v: '0.15.0', data: '10/10/2026', titulo: 'A Floresta Petrificada', itens: [
    'Camada 7, A Floresta Petrificada (1116 a 1302 m): floresta de pedra com folhagem de cristal, 10 bichos novos, chefe O Cervo de Pedra, platina; corrigido um mundo em que a Cidade Afundada não tinha caminho para baixo.'
  ] },
  { v: '0.14.0', data: '10/10/2026', titulo: 'A Cidade Afundada', itens: [
    'Nova camada: A Cidade Afundada (930-1116 m), com ruas, casas, templos, cisternas, o Grande Poço, 10 monstros novos, o chefe O Sineiro Afogado e o metal prata.',
    'O Abismo desceu para 1116-1302 m.',
    'Corrigido: os cordões das quedas das Minas Fúngicas sumiam.'
  ] },
  { v: '0.13.1', data: '10/10/2026', titulo: 'Água com volume', itens: [
    'A água tem volume: desce, se espalha e se nivela.'
  ] },
  { v: '0.13.0', data: '10/10/2026', titulo: 'A Hora Parada', itens: [
    'Conjunto da Hora Parada: Ponteiro (lança), Elmo, Couraça e Botas da Hora Parada, lendários, em latão, azul-noite e cristal ciano. Todo personagem novo já encontra as quatro peças no baú da vila.',
    'O Ponteiro é uma lança com a ponta de ponteiro de relógio. A cada 6 golpes o tempo para em volta do alvo: os inimigos ficam presos no lugar por 2 s, em sépia como uma foto antiga, com um relógio contando o tempo que falta. Cada golpe ainda ecoa um instante depois com 35% do dano.',
    'Elmo: inimigos parados levam 30% mais dano. Botas: quando o tempo para, você fica 30% mais rápido por 3 s.',
    'Couraça: um relógio de verdade no peito, com o ponteiro andando e um pêndulo. Uma vez por minuto, o golpe que te mataria te leva 3 s para trás no tempo.',
    'Bônus de conjunto (a lança conta): com 2 peças, +10% de velocidade de ataque; com as 4, o tempo para a cada 4 golpes e, quando volta a correr, cada inimigo sente de uma vez 30% de todo o dano que levou parado.'
  ] },
  { v: '0.12.0', data: '10/10/2026', titulo: 'O Eclipse', itens: [
    'Conjunto do Eclipse: Elmo, Peitoral e Botas do Eclipse, lendários, em obsidiana e ouro com partes acesas que brilham no escuro. Todo personagem novo já encontra as três peças no baú da vila.',
    'No escuro o conjunto acorda: o elmo dá mais crítico, o peitoral reduz o dano recebido e as botas dão mais velocidade.',
    'Bônus de conjunto (a espada conta): com 2 peças, +10% de dano no escuro; com as 4, o eclipse vem a cada 3 golpes, cura 5% da vida e atordoa os inimigos atingidos por 1 s.',
    'Espada de duas mãos lendária nova, o Montante do Eclipse: lâmina de obsidiana com as bordas acesas, estrelas por dentro e um sol eclipsado no lugar da guarda. Todo personagem novo já a encontra no baú da vila, junto com o conjunto.',
    'A cada 4 golpes que acertam, um eclipse explode no alvo e atinge todos os inimigos em volta. No escuro ela bate 30% mais forte, e o dano crítico sobe 50%.',
    'As bordas da lâmina brilham no escuro, soltam poeira de estrela e deixam um rastro dourado a cada golpe.'
  ] },
  { v: '0.11.5', data: '10/10/2026', titulo: 'Escuridão gradual', itens: [
    'Ao entrar na caverna a escuridão chega aos poucos, ao longo da descida, em vez de trocar de uma vez de um bloco para o outro.'
  ] },
  { v: '0.11.4', data: '10/10/2026', titulo: 'Pentagrama de pé', itens: [
    'No Trono do Caos, o pentagrama não flutua mais: agora é uma laje de pedra do caos em pé sobre um degrau, com o pentagrama entalhado e queimando, sangue escorrendo e velas no chão.',
    'Golpes e aparos empurram bem menos os inimigos: eles recuam um passo em vez de voar longe.'
  ] },
  { v: '0.11.3', data: '10/10/2026', titulo: 'Luz do modo deus', itens: [
    'A Luz total do modo deus não apaga mais as sombras: o subterrâneo fica bem menos escuro, dá para jogar sem tocha, mas a escuridão continua nas bordas.'
  ] },
  { v: '0.11.2', data: '10/10/2026', titulo: 'Modo deus ajustável', itens: [
    'Modo deus (F4, para testes): clareia o subterrâneo e cada parte (vida, mana, dano, luz) liga e desliga em Menu > Testes > Modo deus.'
  ] },
  { v: '0.11.1', data: '10/10/2026', titulo: 'Tocha onde o mouse aponta', itens: [
    'A tocha vai exatamente onde o mouse aponta, sem limite de distância, até dentro de um buraco no meio da parede.'
  ] },
  { v: '0.11.0', data: '10/10/2026', titulo: 'As Minas Fúngicas', itens: [
    'Camada nova debaixo da Mina, de 744 a 930 m: as galerias de uma colônia tomada por um fungo, com cogumelos do tamanho de torres, grutas alagadas e um coração de carne viva.',
    'Água de verdade: dá para nadar, o equipamento pesado afunda e o fôlego dura 10 segundos.',
    'Dez monstros novos, os Tomados, e a chefe A Mãe-Esporo, a parede viva no fundo da Gruta da Mãe. Ela solta o Lampião da Mãe-Esporo.',
    'Metal novo, a esporita, com as 9 peças na bigorna, e três equipamentos que só caem lá: Capacete com Lanterna, Botas de Seiva e Gancho de Colheita.',
    'O Abismo desceu uma camada (930 a 1116 m) e ficou mais forte. O mundo é refeito; seu nível, itens, ouro e o baú da vila continuam.'
  ] },
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
