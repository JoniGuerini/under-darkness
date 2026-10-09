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
    imp: 'Diabrete voador da cripta do Carrasco.',
    hound: 'Cão infernal rápido que se agacha e salta.',
    brute: 'Demônio com machado, golpes pesados.',
    boss: 'Chefe da cripta roxa. Golpes de machado que atravessam escudo; só um aparo no tempo certo segura. Invoca diabretes.',
    rei: 'Chefe da catedral. Veja as fases abaixo.',
    rato: 'Pequeno e rápido, vem em bandos de 2 ou 3. Corre até o herói, pula e morde.',
    aranha: 'Às vezes espera pendurada num fio no teto e cai quando o herói passa embaixo. No chão, se agacha e dá um bote.',
    cuspideira: 'Aranha pálida que mantém distância, mira e cospe bolas de teia em arco. Quem leva fica preso na teia e anda pela metade por 2 s.',
    besouro: 'Couraçado e lento. Se agacha, vira uma bola e rola contra o herói; se bater na parede, cai de costas e leva o dobro de dano.',
    filhote: 'Filhote de aranha, fraco e rápido. Sai dos ovos da Mãe-Teia durante a luta.',
    maeteia: 'Chefe das cavernas. Veja as fases abaixo.',
    yeti: 'O grandão. Anda pesado e quase não recua com golpes. De perto levanta os dois punhos e soca o chão: o golpe pega quem está na frente e uma onda corre pelo chão (pule por cima). De longe arranca um bloco de gelo e arremessa em arco.',
    lobo: 'Chega em bando de 2 ou 3, rápido. Agacha, dá um bote longo com mordida e recua.',
    espirito: 'Voa e atravessa o ar deixando neve. Fica longe e atira 3 lascas de gelo que deixam o herói lento por 2 s.',
    verme: 'Vive dentro do chão e não leva dano enterrado. Uma rachadura embaixo do herói avisa; ele sai mordendo de baixo, fica exposto um tempo e volta a se enterrar.',
    sentinela: 'Golem de gelo azul. Bloqueia golpes de frente com o braço, dá uma pancada lenta e forte. Ao morrer se estilhaça em 6 lascas que machucam.',
    yetiancestral: 'Chefe das Cavernas de Gelo. Veja as fases abaixo.'
  },
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
  carrascoOnde: 'Na cripta roxa das Cavernas Profundas. Hoje a cripta está escondida: o código existe, mas ela não é gerada.',

  // o que cada morador faz
  npcs: {
    ferreiro: 'Compra e vende equipamento (a mercadoria muda todo dia e melhora com o seu nível), compra minério, barras, ossos, chifres e presas, e cuida da fornalha e da bigorna.',
    curandeira: 'Cura todos os ferimentos de graça, vende Poção de Vida e compra materiais de monstro (gel, asas, carne, olhos, ectoplasma, brasas e crânios).',
    taverneiro: 'Vende carvão para a fornalha, tochas e candelabros, compra madeira e carvão, e conta boatos (um deles aponta a direção da cripta).',
    anciao: 'Dá tarefas de buscar materiais em troca de ouro e experiência, e a missão do Carrasco (quando a cripta existe no mundo).'
  },

  // faixas da catedral (js/45-catedral-mundo.js: cathBand) e minérios (js/45: vein)
  faixas: [
    { zona: 5, nome: 'Átrio Soterrado', de: 186, ate: 212, andares: '1 (a 207 m)', salas: 'vestíbulo, sala', carater: 'terra virando calcário, escadaria quebrada, raízes, vestíbulos' },
    { zona: 6, nome: 'Nave da Catedral', de: 212, ate: 268, andares: '2 (236 m e 264 m)', salas: 'nave, principal (com altar e órgão), capela', carater: 'salões altos com colunas, bancos, vitrais, órgão' },
    { zona: 7, nome: 'Claustro Profanado', de: 268, ate: 318, andares: '3 (284, 300 e 316 m)', salas: 'capela, claustro, sala, biblioteca', carater: 'capelas, corredores com arcadas, biblioteca, afrescos' },
    { zona: 8, nome: 'Criptas', de: 318, ate: 372, andares: '3 (333, 348 e 363 m)', salas: 'cripta, ossário, túmulos', carater: 'corredores baixos, ossários, túmulos' }
  ],
  minerios: [
    ['carvao', 186, 370], ['min_cobre', 186, 296], ['min_ferro', 212, 370], ['min_ouro', 268, 370], ['min_cristal', 318, 370]
  ],
  // faixas das cavernas (js/52-caverna-api.js: CV_BANDS; js/56-caverna-mundo.js) e os minérios delas (56: vein)
  cvFaixas: [
    { zona: 9, nome: 'Grutas Rasas', de: 6, ate: 60, salas: 'grutas e túneis', carater: 'terra úmida e argila, raízes pendentes, cogumelos, pinturas rupestres e fósseis' },
    { zona: 10, nome: 'Galerias de Pedra', de: 60, ate: 120, salas: 'galerias altas, poços', carater: 'rocha, calcita, cortinas de calcita, drusas e veios de cristal' },
    { zona: 11, nome: 'O Ninho', de: 120, ate: 168, salas: 'câmaras redondas forradas de teia, a Câmara do Ninho', carater: 'xisto escuro, teia em tudo, casulos, ovos e ossos das presas' },
    { zona: 12, nome: 'Fundações Soterradas', de: 168, ate: 186, salas: 'grutas de saída com escadarias para o átrio', carater: 'rocha virando calcário, pedra lavrada caída, arcos enterrados: a catedral começando' }
  ],
  cvMinerios: [['carvao', 6, 186], ['min_cobre', 6, 120], ['min_ferro', 35, 186], ['min_ouro', 100, 186]],
  // faixas do gelo (js/69-gelo-api.js: IC_BANDS; js/73-gelo-mundo.js) e os minérios delas (73: vein)
  icFaixas: [
    { zona: 13, nome: 'Fendas Geladas', de: 372, ate: 418, salas: 'fendas altas e estreitas, grutas baixas, as duas grutas no pé das descidas', carater: 'o calcário das criptas coberto de geada virando permafrost, tumbas e estátuas da catedral caídas e congeladas, raízes congeladas' },
    { zona: 14, nome: 'Salões de Gelo Azul', de: 418, ate: 476, salas: 'salões enormes de teto alto', carater: 'gelo azul que brilha fraco, lagos congelados, colunas de gelo, cachoeiras paradas, sincelos em cacho' },
    { zona: 15, nome: 'Covis dos Yetis', de: 476, ate: 528, salas: 'tocas ligadas por túneis largos', carater: 'permafrost e neve batida, neve no chão, ossadas e presas de mamute, fogueiras apagadas, marcas de garra e pinturas dos yetis' },
    { zona: 16, nome: 'Coração do Inverno', de: 528, ate: 558, salas: 'grutas de gelo negro, o Trono de Gelo', carater: 'gelo negro antigo com veios azuis que brilham, cristais, gigantes e feras presos no gelo, altares de gelo' }
  ],
  icMinerios: [['min_ferro', 372, 528], ['min_ouro', 400, 558], ['min_cristal', 418, 558]],
  faixaChave: { fendas: 'Fendas', saloes: 'Salões', covis: 'Covis', coracao: 'Coração', atrio: 'Átrio', nave: 'Nave', claustro: 'Claustro', criptas: 'Criptas', grutas: 'Grutas', galerias: 'Galerias', ninho: 'Ninho', fundacoes: 'Fundações' },
  // nome de cada bloco do mundo pela constante do jogo (03-blocos, 41/42 catedral, 52/53 cavernas). Os que viram item usam o nome do item.
  blocoNome: {
    DIRT: 'Terra', GRASS: 'Grama', STONE: 'Pedra', DEEP: 'Pedra funda', BEDROCK: 'Rocha-mãe (fundo do mundo)', LAVA: 'Lava', TRUNK: 'Tronco', LEAVES: 'Folhas',
    TORCH: 'Tocha antiga', SHROOM: 'Cogumelo luminoso', TUFT: 'Capim', FLOWER: 'Flor', CHEST: 'Baú', BONES: 'Ossos', CANDLE: 'Vela', CHAIN: 'Corrente', WEB: 'Teia',
    BANNER: 'Estandarte', URN: 'Urna', ALTAR: 'Altar', COAL: 'Veio de carvão', COPPER: 'Veio de cobre', IRON: 'Veio de ferro', GOLD: 'Veio de ouro', CRYSTAL: 'Veio de cristal',
    CT_CALC_TERRA: 'Calcário com terra', CT_RUINA: 'Cantaria rachada', CT_ESCOMBRO: 'Escombros', CT_OSSARIO: 'Ossário', CT_GRADE: 'Grade de ferro', CT_COLUNA: 'Coluna',
    CT_RAIZ: 'Raiz', CT_CACOS: 'Cacos', CT_CRANIOS: 'Crânios', CT_VELAS: 'Velas', CT_TEIA: 'Teia', CT_LAPIDE: 'Lápide', CT_MUSGO: 'Cantaria com musgo',
    CV_MUSGO: 'Rocha com musgo', CV_TEIA: 'Massa de teia', CV_O_CARVAO: 'Veio de carvão', CV_O_COBRE: 'Veio de cobre', CV_O_FERRO: 'Veio de ferro', CV_O_OURO: 'Veio de ouro',
    CV_ESTALACTITE: 'Estalactite', CV_ESTALAGMITE: 'Estalagmite', CV_RAIZES: 'Raízes pendentes', CV_COGUMELO: 'Cogumelos', CV_DRUSA: 'Drusa de cristal', CV_SEIXOS: 'Seixos',
    CV_CASULO: 'Casulo', CV_FIOS: 'Fios de teia',
    IC_NEVE_DURA: 'Neve batida', IC_CALC_GELO: 'Calcário congelado', IC_O_FERRO: 'Veio de ferro', IC_O_OURO: 'Veio de ouro', IC_O_CRISTAL: 'Veio de cristal no gelo negro',
    IC_SINCELO: 'Sincelo', IC_ESTALAG: 'Estalagmite de gelo', IC_CRISTAL: 'Cristal de gelo', IC_CRISTAL_TETO: 'Cristal de gelo no teto', IC_NEVE_MONTE: 'Montinho de neve',
    IC_OSSOS: 'Ossos congelados', IC_BARREIRA: 'Parede de gelo do chefe', IC_VEIO: 'Veio de gelo azul', IC_COLUNA: 'Coluna de gelo'
  },
  paredeNome: {
    1: 'Terra', 2: 'Pedra', 3: 'Pedra funda', 4: 'Cripta', WCT_CALCARIO: 'Calcário', WCT_CANTARIA: 'Cantaria', WCT_REBOCO: 'Reboco', WCT_PAINEL: 'Painel de madeira',
    WCT_CRIPTA: 'Pedra de cripta', WCT_OSSARIO: 'Ossário', WCT_ARCADA: 'Arcada', WCT_MARMORE: 'Mármore', WCV_TERRA: 'Terra úmida', WCV_ROCHA: 'Rocha', WCV_CALCITA: 'Calcita',
    WCV_TEIA: 'Teia', WCV_XISTO: 'Xisto', WIC_CALC: 'Calcário congelado', WIC_ROCHA: 'Rocha gelada', WIC_GELO: 'Gelo azul', WIC_NEVE: 'Neve batida', WIC_NEGRO: 'Gelo negro'
  },
  apoio: { chao: 'No chão', teto: 'No teto', parede: 'Na parede de fundo', janela: 'Janela' },

  catedral: 'Uma catedral gótica soterrada há séculos debaixo das cavernas, com o claustro e as criptas embaixo. Os mortos dela se levantaram. É a segunda camada, de 186 a 372 m.',
  catedralEntrada: 'Nas Fundações Soterradas, duas grutas de saída abrem para escadarias em ruína que descem até o átrio.',
  caverna: 'A primeira camada debaixo do vilarejo, de 6 a 186 m: terra e rocha que vão virando ninho de aranhas e, no fundo, pedra lavrada da catedral que está embaixo. Slimes e morcegos repintados, ratos, aranhas, cuspideiras e besouros. Nenhum morto-vivo.',
  cavernaEntrada: 'O pórtico de pedra à direita da placa do vilarejo ("Cavernas →"): a escadaria de cantaria desce e vai virando terra até abrir nas Grutas Rasas.',
  gelo: 'A terceira camada, debaixo das criptas da catedral, de 372 a 558 m: um frio mais velho que a catedral subiu pelas rachaduras e congelou tudo. Fendas de geada, salões de gelo azul que brilha, as tocas dos yetis e, no fundo, o gelo negro do Coração do Inverno. O gelo, o gelo azul e o gelo negro escorregam: o herói demora para arrancar e para frear.',
  geloEntrada: 'Duas salas das Criptas mais baixas têm o chão rachado: uma fenda desce de cada uma até as Fendas Geladas, com degraus de pedra congelada a cada 3 blocos para voltar pulando.',
  cavernas: 'O mundo antigo de cavernas (Cavernas Rasas, Profundas, Abismo e a Cripta do Carrasco) continua no código, mas está desligado. As cavernas de hoje são outras (js/52 a 57).'
};
