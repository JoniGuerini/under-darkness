'use strict';

/* Textos escritos à mão para a wiki: o que o código do jogo não diz em palavras.
   Os números (vida, dano, chances, preços, receitas...) NÃO ficam aqui: a wiki lê direto dos arquivos do jogo.
   Se um monstro, morador ou faixa nova entrar no jogo, acrescente a descrição dele aqui. */
const UDW_TXT = {
  // papel de cada monstro no combate (de docs/biomas.md e do código da IA)
  inimigos: {
    zombie: 'Lento e resistente. Chega perto, agarra e arranha. Ao morrer, desaba e afunda no chão.',
    vomit: 'Meia distância. Cospe 3 bolas de bile em arco que deixam uma poça ácida no chão.',
    skeleton: 'Golpe de espada com preparação clara. Às vezes dorme como um monte de ossos e se remonta quando o herói chega perto.',
    archer: 'Mantém distância: recua, mira e atira flechas. Um aparo no tempo certo devolve a flecha.',
    guard: 'Lança e escudo-torre. Bloqueia de frente e dá uma estocada longa.',
    ghost: 'Atravessa paredes, some e aparece, e investe contra o herói. Só leva dano quando está visível.',
    slime: 'Pula em direção ao herói e sobe degraus de 1 a 2 blocos.',
    bat: 'Voa em zigue-zague e dá rasantes com mordida.',
    skull: 'Caveira em chamas que voa, treme e se lança contra o herói.',
    lurker: 'Olho voador das profundezas que observa de longe e ataca à distância.',
    rei: 'Chefe da catedral. Veja as fases abaixo.',
    rato: 'Pequeno e rápido, vem em bandos de 2 ou 3. Corre até o herói, pula e morde.',
    aranha: 'Às vezes espera pendurada num fio no teto e cai quando o herói passa embaixo. No chão, se agacha e dá um bote.',
    cuspideira: 'Aranha pálida que mantém distância, mira e cospe bolas de teia em arco. Quem leva fica preso na teia e anda pela metade por 2 s.',
    besouro: 'Couraçado e lento. Se agacha, vira uma bola e rola contra o herói; se bater na parede, cai de costas e leva o dobro de dano.',
    filhote: 'Filhote de aranha, fraco e rápido. Sai dos ovos da Mãe-Teia durante a luta.',
    maeteia: 'Chefe das cavernas. Veja as fases abaixo.',
    fungo: 'Fica parado e parece um cogumelo do cenário. Quando o herói chega perto, incha e solta uma nuvem de esporos: quem fica dentro é envenenado e perde vida aos poucos. Bater nele também solta a nuvem. Anda devagar.',
    centopeia: 'Corre pelo chão, pelas paredes e pelo teto atrás do herói e morde de qualquer lado. Do teto, se solta em cima dele. Rápida e fraca.',
    goblin: 'Saiu das cavernas e foi morar na mina, no acampamento dos goblins. Lampião no capacete. Fica longe, acende uma dinamite e joga em arco: ela quica e explode depois de um tempo, ferindo o herói e os monstros perto e quebrando os blocos em volta. Foge quando o herói chega perto.',
    yeti: 'O grandão. Anda pesado e quase não recua com golpes. De perto levanta os dois punhos e soca o chão: o golpe pega quem está na frente e uma onda corre pelo chão (pule por cima). De longe arranca um bloco de gelo e arremessa em arco.',
    lobo: 'Chega em bando de 2 ou 3, rápido. Agacha, dá um bote longo com mordida e recua.',
    espirito: 'Voa e atravessa o ar deixando neve. Fica longe e atira 3 lascas de gelo que deixam o herói lento por 2 s.',
    verme: 'Vive dentro do chão e não leva dano enterrado. Uma rachadura embaixo do herói avisa; ele sai mordendo de baixo, fica exposto um tempo e volta a se enterrar.',
    sentinela: 'Golem de gelo azul. Bloqueia golpes de frente com o braço, dá uma pancada lenta e forte. Ao morrer se estilhaça em 6 lascas que machucam.',
    yetiancestral: 'Chefe das Cavernas de Gelo. Veja as fases abaixo.',
    gargula: 'Fica parada como estátua e leva pouco dano assim. Acorda quando o herói passa perto, voa por cima dele e mergulha. Sem ninguém por perto, pousa de novo.',
    acolito: 'Conjurador de capuz que fica longe. Atira bolas de fogo roxo e, de tempos em tempos, levanta um esqueleto do chão perto do herói (no máximo 2 de cada vez).',
    carnical: 'Morto-vivo de quatro patas, rápido. Agacha e pula de longe; a mordida faz o herói sangrar por 3 s.',
    abominacao: 'Pilha enorme de cadáveres costurados, lenta. Ergue o gancho e bate pegando dos dois lados e jogando o herói longe. Ao morrer, dois zumbis saem de dentro.',
    sincelo: 'Fica pendurado no teto igual aos sincelos do cenário e despenca quando o herói passa embaixo (deixa lento). Depois rasteja e morde.',
    cacador: 'Explorador morto no gelo. De longe arremessa um arpão com corda que puxa o herói para perto; de perto dá machadada.',
    javali: 'Bufa e cava o chão, depois investe em linha reta e joga o herói longe. Quebra o gelo no caminho; se bater em outra coisa fica tonto e leva mais dano.',
    wendigo: 'Alto e magro, quase invisível no escuro até chegar perto; só os olhos brilham. Grita e deixa o herói lento, ataca com duas garradas rápidas e foge da luz das tochas.',
    mineiro: 'Mineiro que morreu lá embaixo e continua trabalhando. Anda devagar até o herói, ergue a picareta e golpeia forte. Se a rocha estiver no caminho, cava através dela.',
    carrinho: 'Parece um vagonete parado nos trilhos. Quando o herói fica na mesma linha, chacoalha, dispara e atropela; ao bater na parede se arrebenta por um tempo e leva mais dano.',
    grisu: 'Bolsão de gás da mina que flutua atrás do herói, incha e explode. Qualquer fogo acende antes: um golpe, uma tocha perto, o fogo do lampião. Um grisu explodindo acende os outros perto.',
    lampiao: 'Lampião que flutua sozinho, longe do alcance da espada, e atira bolas de fogo no herói.',
    falsoveio: 'Parece um veio de ouro no chão. Quando o herói chega perto, abre uma boca cheia de dentes e morde; persegue pulando e volta a se esconder entre os blocos.',
    golem: 'Minério que ganhou corpo, lento e muito resistente. De perto soca o chão: uma onda corre pelo chão e caem pedras do teto. De longe arranca um bloco e arremessa.',
    toupeira: 'Pequena e rápida, morde. Se o herói estiver atrás da rocha, cava um túnel direto até ele.',
    gatuno: 'Goblin pequeno e rápido que anda em bando. Corre até o herói, corta a bolsa e foge com o ouro; matando ele, o ouro volta.',
    capataz: 'Goblin grande com um chicote de longo alcance. Estala o chicote sobre os goblins perto e eles ficam mais rápidos por alguns segundos.',
    reigoblin: 'Chefe da Mina Abandonada. Veja as fases abaixo.',
    sapo: 'Fica parado no escuro, só os olhos amarelos brilham. Pula atrás do herói em saltos compridos e, de longe, lança a língua: se pegar, puxa o herói para perto e morde.',
  },
  // fases do Rei Goblin (js/85-rei-goblin.js)
  rgFases: [
    ['Fase 1', 'Avança com a Escavadeira de broca na frente, de parede a parede; quando bate na parede, a máquina fica tremendo um tempo (é a hora de bater). Da cabine joga dinamites.'],
    ['Fase 2', 'Abaixo de 60% da vida, toca a corneta e goblins chegam correndo dos dois lados. Cada batida na parede derruba pedras do teto (uma sombra marca o chão antes), e ele vira a broca contra o teto.'],
    ['Fase 3', 'Abaixo de 25%, a máquina explode e ele pula fora com o martelo-picareta: salta em cima do herói e esmaga o chão (a onda corre pelo chão), e joga feixes de três dinamites.']
  ],
  principeFases: [
    ['Fase 1', 'Um golpe largo da espada (a lâmina fica branca antes), uma investida pelo chão arrastando a lâmina e deixando fogo para trás (as chamas ficam um tempo) e um leque de fogo pela boca (ele joga a cabeça para trás e a boca brilha).'],
    ['Fase 2', 'Abaixo de 60% da vida: rasga portais de onde saem diabretes e cães infernais, e gêiseres de lava estouram do chão (um anel brilha no chão antes).'],
    ['Fase 3', 'Abaixo de 25%: abre as asas e voa. Chovem meteoros na sala (uma sombra no chão avisa) e ele mergulha de espada sobre o herói; depois do mergulho fica um momento preso no chão.']
  ],
  principeOnde: 'O Trono do Caos, um salão de 56 x 20 blocos no fundo do Abismo (cerca de 926 m), do outro lado do mundo em relação às fendas, com um trono de ferro negro e osso cravejado de cristais do caos, braseiros e correntes. Ao entrar, grades do caos fecham todas as saídas; sair da sala ou morrer recomeça a luta. Fica salvo que ele morreu. Solta o Coração do Caos, acessório lendário.',
  rgOnde: 'A Oficina da Escavadeira, um salão de 48 x 16 blocos nas Fornalhas Esquecidas (cerca de 730 m), do outro lado do mundo em relação aos poços de descida, com um trono feito de vagonete, montes de saque e fornalhas. Ao entrar, grades de ferro fecham as saídas. Fica salvo que o rei morreu.',
  // fases do Yeti Ancestral (docs/biomas.md, parte 4, seção 7, e js/74-yeti-ancestral.js)
  yetiFases: [
    ['Fase 1', 'Soco duplo no chão (levanta os punhos antes) com ondas de choque para os dois lados: pule por cima. De longe arranca um bloco de gelo e arremessa; o bloco se quebra em 3 lascas.'],
    ['Fase 2', 'Abaixo de 60% da vida, ruge: caem sincelos do teto onde as sombras marcam o chão (um em cima do herói) e chegam 2 Lobos da Geada.'],
    ['Fase 3', 'Abaixo de 25%, mais rápido: se agacha e dá um carrinho de barriga de parede a parede (se bater na parede fica tonto, a hora de bater), e sopra um bafo de geada em cone que deixa o herói lento.']
  ],
  yetiOnde: 'O Trono de Gelo, um salão de 40 x 16 blocos no Coração do Inverno (cerca de 550 m), do outro lado do mundo em relação às descidas, com o trono esculpido no gelo, drusas e sincelos. Ao entrar, paredes de gelo que não dá para cavar fecham as saídas; sair da sala recomeça a luta. Golpes não interrompem os ataques dele. Fica salvo que ele morreu.',
  // fases da Mãe-Teia (docs/biomas.md, parte 2, seção 7, e js/57-mae-teia.js)
  teiaFases: [
    ['Fase 1', 'No chão: mordida de perto e um leque de 3 bolas de teia que prendem o herói.'],
    ['Fase 2', 'Abaixo de 60% da vida, sobe pelo fio e fica pendurada sobre o herói; uma sombra no chão mostra onde ela vai cair. Os ovos da sala chocam filhotes.'],
    ['Fase 3', 'Abaixo de 25%, fica mais rápida, cospe 5 bolas e salta de uma parede à outra cuspindo do alto.']
  ],
  teiaOnde: 'A Câmara do Ninho, uma sala redonda de 34 x 14 blocos no fundo do Ninho (cerca de 158 m), do outro lado do mundo em relação ao vilarejo, com ovos, casulos e lençóis de teia. Ao entrar, cortinas de teia fecham as saídas; sair da sala recomeça a luta. Fica salvo que ela morreu.',
  // fases do Rei Esqueleto (docs/biomas.md, parte 2, seção 7, e js/46-rei-esqueleto.js)
  reiFases: [
    ['Fase 1', 'Golpe de maça e salto com onda de choque no chão (pule por cima). Invoca esqueletos.'],
    ['Fase 2', 'A partir de 55% da vida, também investe; se bater na parede, fica tonto.'],
    ['Fase 3', 'Na primeira "morte" ele desmorona e se remonta com metade da vida, e passa a soltar fileiras de espinhos de osso.']
  ],
  reiOnde: 'Um salão da nave ou do claustro, sorteado pela semente do mundo, com estrado, trono, tapete, candelabros e tocheiros. Ao entrar, grades de ferro fecham todas as saídas. Fica salvo que o rei morreu.',

  // o que cada morador faz
  npcs: {
    ferreiro: 'Compra e vende equipamento (a mercadoria muda todo dia e melhora com o seu nível), compra minério, barras, ossos, chifres e presas, e cuida da fornalha e da bigorna.',
    curandeira: 'Alquimista e herborista. Prepara poções de vida, poções de mana e elixires no alambique, com as ervas que você colhe em cada camada e materiais de monstro. Não cura mais de graça.',
    taverneiro: 'Vende carvão para a fornalha, tochas e candelabros, compra madeira e carvão, conta boatos e cozinha: com a carne crua e os cogumelos que caem dos bichos, faz pratos que se comem parado e devolvem vida e mana aos poucos.',
    anciao: 'Dá tarefas de buscar materiais em troca de ouro e experiência.',
    encantador: 'Mora na oficina de pedra à esquerda da forja. Encanta peças: você leva uma peça e uma pedra preciosa, ele sorteia modificadores novos com as chances da pedra. Encantar de novo troca os modificadores. Peças únicas, como as dos chefes, não aceitam encanto.',
    maga: 'Mora na torre de pedra depois da casa do ancião. Vende cajados, varinhas e tomos (a mercadoria muda todo dia) e um pergaminho lacrado de cada escola de magia (fogo, raio, gelo e metamorfose), que só ela sabe abrir. Compra itens mágicos.'
  },

  // faixas da catedral (js/45-catedral-mundo.js: cathBand) e minérios (js/45: vein)
  faixas: [
    { zona: 5, nome: 'Átrio Soterrado', de: 186, ate: 212, andares: '1 (a 207 m)', salas: 'vestíbulo, sala', carater: 'terra virando calcário, escadaria quebrada, raízes, vestíbulos' },
    { zona: 6, nome: 'Nave da Catedral', de: 212, ate: 268, andares: '2 (236 m e 264 m)', salas: 'nave, principal (com altar e órgão), capela', carater: 'salões altos com colunas, bancos, vitrais, órgão' },
    { zona: 7, nome: 'Claustro Profanado', de: 268, ate: 318, andares: '3 (284, 300 e 316 m)', salas: 'capela, claustro, sala, biblioteca', carater: 'capelas, corredores com arcadas, biblioteca, afrescos' },
    { zona: 8, nome: 'Criptas', de: 318, ate: 372, andares: '3 (333, 348 e 363 m)', salas: 'cripta, ossário, túmulos', carater: 'corredores baixos, ossários, túmulos' }
  ],
  minerios: [
    ['carvao', 192, 370], ['min_ferro', 192, 370]
  ],
  // faixas das cavernas (js/52-caverna-api.js: CV_BANDS; js/56-caverna-mundo.js) e os minérios delas (56: vein)
  cvFaixas: [
    { zona: 9, nome: 'Grutas Rasas', de: 6, ate: 60, salas: 'grutas e túneis', carater: 'terra úmida e argila, raízes pendentes, cogumelos, pinturas rupestres e fósseis' },
    { zona: 10, nome: 'Galerias de Pedra', de: 60, ate: 120, salas: 'galerias altas, poços', carater: 'rocha, calcita, cortinas de calcita, drusas e veios de cristal' },
    { zona: 11, nome: 'O Ninho', de: 120, ate: 168, salas: 'câmaras redondas forradas de teia, a Câmara do Ninho', carater: 'xisto escuro, teia em tudo, casulos, ovos e ossos das presas' },
    { zona: 12, nome: 'Fundações Soterradas', de: 168, ate: 186, salas: 'grutas de saída com escadarias para o átrio', carater: 'rocha virando calcário, pedra lavrada caída, arcos enterrados: a catedral começando' }
  ],
  cvMinerios: [['carvao', 6, 186], ['min_cobre', 6, 186]],
  // faixas do gelo (js/69-gelo-api.js: IC_BANDS; js/73-gelo-mundo.js) e os minérios delas (73: vein)
  icFaixas: [
    { zona: 13, nome: 'Fendas Geladas', de: 372, ate: 418, salas: 'fendas altas e estreitas, grutas baixas, as duas grutas no pé das descidas', carater: 'o calcário das criptas coberto de geada virando permafrost, tumbas e estátuas da catedral caídas e congeladas, raízes congeladas' },
    { zona: 14, nome: 'Salões de Gelo Azul', de: 418, ate: 476, salas: 'salões enormes de teto alto', carater: 'gelo azul que brilha fraco, lagos congelados, colunas de gelo, cachoeiras paradas, sincelos em cacho' },
    { zona: 15, nome: 'Covis dos Yetis', de: 476, ate: 528, salas: 'tocas ligadas por túneis largos', carater: 'permafrost e neve batida, neve no chão, ossadas e presas de mamute, fogueiras apagadas, marcas de garra e pinturas dos yetis' },
    { zona: 16, nome: 'Coração do Inverno', de: 528, ate: 558, salas: 'grutas de gelo negro, o Trono de Gelo', carater: 'gelo negro antigo com veios azuis que brilham, cristais, gigantes e feras presos no gelo, altares de gelo' }
  ],
  icMinerios: [['carvao', 372, 558], ['min_ouro', 372, 558]],
  // faixas da mina (js/79-mina-api.js: MN_BANDS; js/84-mina-mundo.js) e os minérios delas (84: vein)
  mnFaixas: [
    { zona: 17, nome: 'Galerias Escoradas', de: 558, ate: 604, salas: 'galerias retas escoradas em níveis fixos, os pés dos dois poços de descida', carater: 'rocha ferrosa listrada de preto e vermelho, escoras e vigas, trilhos com vagonetes, lampiões, ferramentas largadas' },
    { zona: 18, nome: 'Poços e Andaimes', de: 604, ate: 656, salas: 'poços fundos com escadas e andaimes, galerias de lavra', carater: 'rejeito, guinchos, polias com balde, elevadores, beliches podres, veios de cobalto no quartzito' },
    { zona: 19, nome: 'Acampamento Goblin', de: 656, ate: 708, salas: 'salões do acampamento com piso de tábua', carater: 'entulho, tendas, fogueiras, jaulas, estandartes, pinturas e o saque dos goblins, estacas com caveira' },
    { zona: 20, nome: 'Fornalhas Esquecidas', de: 708, ate: 744, salas: 'salões das fornalhas, a Oficina da Escavadeira', carater: 'tijolo de fornalha e escória, fornalhas que ainda brilham, cadinhos, bigornas, engrenagens quebradas, brasas' }
  ],
  mnMinerios: [['carvao', 558, 744], ['min_cobalto', 558, 744], ['min_cristal', 558, 744]],
  // faixas do Abismo (js/103-abismo-api.js: AB_BANDS; js/108-abismo-mundo.js) e os minérios dele (108: vein)
  abFaixas: [
    { zona: 21, nome: 'Portões de Cinza', de: 744, ate: 790, salas: 'salões em ruína de tijolo infernal, os pés das duas fendas', carater: 'rocha de cinza e basalto, cinza caindo do teto, correntes penduradas, braseiros, caveiras, estátuas de demônio, portões arrombados' },
    { zona: 22, nome: 'Rios de Fogo', de: 790, ate: 842, salas: 'cavernas largas com um lago de lava e uma ponte de ferro negro', carater: 'basalto e obsidiana, crosta de lava brilhando, poças de lava, colunas de basalto, caldeirões, cachoeiras de lava, faíscas subindo' },
    { zona: 23, nome: 'As Entranhas', de: 842, ate: 894, salas: 'câmaras redondas de carne', carater: 'carne viva e osso, tentáculos e ganchos no teto, sangue pingando, costelas, ovos, casulos, olhos e bocas nas paredes, um coração batendo' },
    { zona: 24, nome: 'Trono do Caos', de: 894, ate: 930, salas: 'templos de tijolo infernal, o Trono do Caos', carater: 'pedra do caos e enxofre, runas e cristais roxos, altares, pentagramas, obeliscos, púlpitos, brasas roxas subindo' }
  ],
  abMinerios: [['carvao', 744, 930], ['min_infernita', 744, 930]],
  faixaChave: { fendas: 'Fendas', saloes: 'Salões', covis: 'Covis', coracao: 'Coração', atrio: 'Átrio', nave: 'Nave', claustro: 'Claustro', criptas: 'Criptas', grutas: 'Grutas', galerias: 'Galerias', ninho: 'Ninho', fundacoes: 'Fundações', pocos: 'Poços', acampamento: 'Acampamento', fornalhas: 'Fornalhas', portoes: 'Portões', rios: 'Rios de Fogo', entranhas: 'Entranhas', trono: 'Trono' },
  // nome de cada bloco do mundo pela constante do jogo (03-blocos, 41/42 catedral, 52/53 cavernas). Os que viram item usam o nome do item.
  blocoNome: {
    DIRT: 'Terra', GRASS: 'Grama', STONE: 'Pedra', DEEP: 'Pedra funda', BEDROCK: 'Rocha-mãe (fundo do mundo)', LAVA: 'Lava', TRUNK: 'Tronco', LEAVES: 'Folhas',
    TORCH: 'Tocha antiga', SHROOM: 'Cogumelo luminoso', TUFT: 'Capim', FLOWER: 'Flor', BONES: 'Ossos', CANDLE: 'Vela', CHAIN: 'Corrente', WEB: 'Teia',
    BANNER: 'Estandarte', URN: 'Urna', ALTAR: 'Altar', COAL: 'Veio de carvão', COPPER: 'Veio de cobre', IRON: 'Veio de ferro', GOLD: 'Veio de ouro', CRYSTAL: 'Veio de cristal',
    CT_CALC_TERRA: 'Calcário com terra', CT_RUINA: 'Cantaria rachada', CT_ESCOMBRO: 'Escombros', CT_OSSARIO: 'Ossário', CT_GRADE: 'Grade de ferro', CT_COLUNA: 'Coluna',
    CT_RAIZ: 'Raiz', CT_CACOS: 'Cacos', CT_CRANIOS: 'Crânios', CT_VELAS: 'Velas', CT_TEIA: 'Teia', CT_LAPIDE: 'Lápide', CT_MUSGO: 'Cantaria com musgo',
    CV_MUSGO: 'Rocha com musgo', CV_TEIA: 'Massa de teia', CV_O_CARVAO: 'Veio de carvão', CV_O_COBRE: 'Veio de cobre', CV_O_FERRO: 'Veio de ferro', CV_O_OURO: 'Veio de ouro',
    CV_ESTALACTITE: 'Estalactite', CV_ESTALAGMITE: 'Estalagmite', CV_RAIZES: 'Raízes pendentes', CV_COGUMELO: 'Cogumelos', CV_DRUSA: 'Drusa de cristal', CV_SEIXOS: 'Seixos',
    CV_CASULO: 'Casulo', CV_FIOS: 'Fios de teia',
    IC_NEVE_DURA: 'Neve batida', IC_CALC_GELO: 'Calcário congelado', IC_O_CARVAO: 'Veio de carvão', IC_O_FERRO: 'Veio de ferro', IC_O_OURO: 'Veio de ouro', IC_O_CRISTAL: 'Veio de cristal no gelo negro',
    IC_SINCELO: 'Sincelo', IC_ESTALAG: 'Estalagmite de gelo', IC_CRISTAL: 'Cristal de gelo', IC_CRISTAL_TETO: 'Cristal de gelo no teto', IC_NEVE_MONTE: 'Montinho de neve',
    IC_OSSOS: 'Ossos congelados', IC_BARREIRA: 'Parede de gelo do chefe', IC_VEIO: 'Veio de gelo azul', IC_COLUNA: 'Coluna de gelo',
    MN_FERROSA: 'Rocha ferrosa', MN_REJEITO: 'Rejeito', MN_ENTULHO: 'Entulho', MN_TABUA: 'Tábua de mina', MN_VIGA: 'Viga de mina', MN_CAVADA: 'Rocha cavada', MN_TIJOLO: 'Tijolo de fornalha',
    MN_ESCORIA: 'Escória', MN_QUARTZITO: 'Quartzito', MN_BARREIRA: 'Grade de ferro do chefe', MN_O_CARVAO: 'Veio de carvão', MN_O_FERRO: 'Veio de ferro', MN_O_OURO: 'Veio de ouro no quartzito',
    MN_O_COBALTO: 'Veio de cobalto', MN_O_CRISTAL: 'Veio de cristal (pedra preciosa)', MN_ESCORA: 'Escora', MN_TRILHO: 'Trilho', MN_LAMPIAO: 'Lampião no gancho', MN_ESCADA: 'Escada', MN_FERRAMENTA: 'Ferramentas largadas',
    MN_PEDRAS: 'Monte de pedras', MN_CORDA: 'Corda', MN_BRASA: 'Brasa de escória', MN_ESTACA: 'Estaca com caveira',
    AB_CINZA: 'Rocha de cinza', AB_BASALTO: 'Basalto', AB_OBSIDIANA: 'Obsidiana', AB_CROSTA: 'Crosta de lava', AB_CARNE: 'Carne viva', AB_OSSO: 'Osso compactado', AB_ENXOFRE: 'Enxofre',
    AB_FERRO_NEGRO: 'Ferro negro', AB_TIJOLO: 'Tijolo infernal', AB_CAOS: 'Pedra do caos', AB_BARREIRA: 'Grade do Trono do Caos', AB_O_CARVAO: 'Veio de carvão no basalto', AB_O_INFERNITA: 'Veio de infernita',
    AB_CORRENTE: 'Corrente', AB_ESPINHOS: 'Espinhos', AB_BRASEIRO: 'Braseiro', AB_CHAMA: 'Chama', AB_CRANIOS: 'Crânios', AB_ESTALAG: 'Estalagmite de obsidiana', AB_TENTACULO: 'Tentáculo',
    AB_RUNA: 'Runa', AB_CRISTAL: 'Cristal do caos', AB_ESCADA: 'Escada de ferro negro', AB_GANCHO: 'Gancho', AB_COLUNA: 'Coluna de basalto',
    HB_SANGUE: 'Sanguinária', HB_LIRIO: 'Lírio-das-grutas', HB_LOSNA: 'Losna-da-cripta', HB_GEADA: 'Flor-de-geada', HB_BRASA: 'Raiz-de-brasa'
  },
  paredeNome: {
    1: 'Terra', 2: 'Pedra', 3: 'Pedra funda', 4: 'Cripta', WCT_CALCARIO: 'Calcário', WCT_CANTARIA: 'Cantaria', WCT_REBOCO: 'Reboco', WCT_PAINEL: 'Painel de madeira',
    WCT_CRIPTA: 'Pedra de cripta', WCT_OSSARIO: 'Ossário', WCT_ARCADA: 'Arcada', WCT_MARMORE: 'Mármore', WCV_TERRA: 'Terra úmida', WCV_ROCHA: 'Rocha', WCV_CALCITA: 'Calcita',
    WCV_TEIA: 'Teia', WCV_XISTO: 'Xisto', WIC_CALC: 'Calcário congelado', WIC_ROCHA: 'Rocha gelada', WIC_GELO: 'Gelo azul', WIC_NEVE: 'Neve batida', WIC_NEGRO: 'Gelo negro',
    WMN_FERROSA: 'Rocha ferrosa', WMN_TABUADO: 'Tabuado', WMN_CAVADA: 'Rocha cavada', WMN_TIJOLO: 'Tijolo de fornalha', WMN_QUARTZITO: 'Quartzito',
    WAB_CINZA: 'Rocha de cinza', WAB_BASALTO: 'Basalto', WAB_CARNE: 'Carne viva', WAB_TIJOLO: 'Tijolo infernal', WAB_CAOS: 'Pedra do caos'
  },
  apoio: { chao: 'No chão', teto: 'No teto', parede: 'Na parede de fundo', janela: 'Janela' },

  catedral: 'Uma catedral gótica soterrada há séculos debaixo das cavernas, com o claustro e as criptas embaixo. Os mortos dela se levantaram. É a segunda camada, de 186 a 372 m.',
  catedralEntrada: 'Nas Fundações Soterradas, duas grutas de saída abrem para escadarias em ruína que descem até o átrio.',
  caverna: 'A primeira camada debaixo do vilarejo, de 6 a 186 m: terra e rocha que vão virando ninho de aranhas e, no fundo, pedra lavrada da catedral que está embaixo. Slimes e morcegos repintados, ratos, aranhas, cuspideiras, besouros, fungos esporentos, centopeias e goblins dinamiteiros. Nenhum morto-vivo.',
  cavernaEntrada: 'O pórtico de pedra à direita da placa do vilarejo ("Cavernas →"): a escadaria de cantaria desce e vai virando terra até abrir nas Grutas Rasas.',
  gelo: 'A terceira camada, debaixo das criptas da catedral, de 372 a 558 m: um frio mais velho que a catedral subiu pelas rachaduras e congelou tudo. Fendas de geada, salões de gelo azul que brilha, as tocas dos yetis e, no fundo, o gelo negro do Coração do Inverno. O gelo, o gelo azul e o gelo negro escorregam: o herói demora para arrancar e para frear.',
  geloEntrada: 'Duas salas das Criptas mais baixas têm o chão rachado: uma fenda desce de cada uma até as Fendas Geladas, com degraus de pedra congelada a cada 3 blocos para voltar pulando.',
  mina: 'A quarta camada, debaixo das Cavernas de Gelo, de 558 a 744 m: uma mina de cobalto que os mineiros abandonaram quando o fundo começou a matar. Os mortos continuam cavando, o gás e os carrinhos ganharam vida, e os goblins tomaram o lugar: galerias escoradas, poços com andaimes, o acampamento goblin e, no fundo, as fornalhas que nunca apagaram.',
  minaEntrada: 'Dois poços antigos descem do chão do Coração do Inverno: uma boca de madeira no gelo, um poço revestido de tábuas e uma escada até a primeira galeria. Volta-se pela mesma escada.',
  // sons de ambiente de cada cenário (js/97-ambiente.js)
  catedralSom: 'Um salão enorme e vazio que ecoa: zumbido grave, sussurros sem palavras ao longe (mais nas Criptas), correntes balançando, vento assobiando nas janelas quebradas, gotas e, de vez em quando, um sino que ninguém toca.',
  cavernaSom: 'Ar parado e um ronco grave da rocha, gotas caindo em poças (perto e longe, com eco), pedrinhas rolando e a rocha gemendo lá no fundo. No Ninho, patinhas correndo de um lado ao outro; nas Fundações, correntes.',
  geloSom: 'Vento gelado uivando pelas fendas, o gelo estalando e rangendo devagar, cristais tilintando e gotas de degelo.',
  abismo: 'A quinta camada, debaixo da Mina Abandonada, de 744 a 930 m: o inferno de onde vieram os demônios. Cinza, rios de fogo, paredes de carne que respiram e, no fundo, o trono de quem manda em tudo isso. O metal daqui é a infernita.',
  abismoEntrada: 'Duas fendas abertas no chão das Fornalhas Esquecidas, na mina: uma rachadura brilhando em volta da boca, um poço forrado de ferro negro e uma escada até um salão em ruína nos Portões de Cinza. Volta-se pela mesma escada.',
  abismoSom: 'Um ronco grave e o fogo ao fundo; correntes balançando nos Portões; lava borbulhando e estalando nos Rios de Fogo; gotas de sangue e um coração batendo nas Entranhas; sussurros no Trono do Caos e, bem longe, alguma coisa grande rugindo.',
  minaSom: 'Escoras de madeira rangendo, picaretas ao longe, pedrinhas, gotas e, bem longe, um carrinho guinchando nos trilhos. Nas Fornalhas Esquecidas, o ronco e os estalos do fogo e o fole.',
  cavernas: 'O mundo antigo de cavernas (Cavernas Rasas e Profundas) continua no código, mas está desligado. As cavernas de hoje são outras (js/52 a 57).'
};
