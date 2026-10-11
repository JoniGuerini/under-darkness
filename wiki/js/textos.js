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
    saqueador: 'Anda em dupla, com cuidado, e sobe escadas de corda como o herói. Corre primeiro para qualquer drop de monstro no chão e guarda; matando ele, solta o que pegou. Puxa o facão para trás e dá duas estocadas. Com pouca vida recua e bebe uma poção que cura 30%, uma vez.',
    besteiro: 'Procura o ponto mais alto por perto (telhado, janela, passarela) e se abaixa atrás do parapeito. Ergue a besta, a ponta brilha e o virote sai reto e rápido; depois gira a manivela para recarregar, exposto. O virote fica cravado na parede 5 s e serve de degrau.',
    armadilheiro: 'Corre na frente do herói para os corredores e becos e arma o caminho: estrepes que ferem e deixam lento e fios de sininhos que, tocados, soltam uma rede de cima (uma sombra quadrada avisa), deixam o herói sem atacar por 1,5 s e chamam os humanos perto. Depois vem com o porrete.',
    telhadeiro: 'Atira um gancho no teto ou numa viga e passa balançando de um telhado a outro, quase nunca no chão. No balanço solta o gancho e cai em diagonal com duas adagas; a sombra dele no chão avisa antes.',
    novicos: 'Procissão de 4 a 6 em fila, cada um com uma vela, seguindo o primeiro e cantando numa nota só. Erguem as velas, o canto sobe e correm todos de uma vez batendo com os castiçais. Matar o da frente desfaz a procissão: os outros fogem.',
    pregador: 'Fica longe, sempre atrás dos outros humanos. Aponta e um anel escuro aparece em volta do herói: marcado por 6 s, os inimigos da camada dão 20% a mais nele e vão direto nele. Sozinho, joga um frasco de água do Poço em arco que deixa uma poça escura que deixa lento.',
    penitente: 'Homem enorme que arrasta uma pedra de poço presa por corrente; anda devagar, não sobe escadas e não foge. Gira a pedra em volta dele por 3 s com o raio crescendo e depois fica tonto. Larga a pedra no chão e quebra o piso de tábua ou o telhado embaixo.',
    emparedador: 'Pedreiro do culto com tijolos nas costas. Não persegue: corre para a passagem estreita mais perto entre o herói e a saída e ergue uma parede de argamassa fresca, uma fileira por vez (o contorno aparece antes). A parede quebra fácil e desmancha sozinha em 30 s. De perto, joga tijolos em arco.',
    afogado: 'Anda no fundo da água sem boiar e sobe para a borda; fora da água é lento e pesado. Estica os braços pingando e agarra: perto da água, arrasta o herói 2 blocos para dentro e o prende 1 s (bater solta). Só nasce na água ou perto dela.',
    boiante: 'Flutua no ar como se ainda estivesse debaixo da água, em braçadas lentas. Abre a boca, saem bolhas e vem um jato de água negra de 4 blocos que empurra e deixa o herói encharcado: pulo menor por 3 s.',
    sineiro: 'Chefe da Cidade Afundada. Veja as fases abaixo.',
    lagartoqz: 'Só se mexe quando o herói está de costas para ele; olhado, para como estátua e só dá um brilho de vez em quando. Os olhos acendem, a cauda estala e vem uma mordida num salto curto; virar de frente durante o aviso cancela o bote. Nunca há mais de 2 ao mesmo tempo.',
    estrangula: 'Um bulbo preso na parede que não anda: cresce uma raiz pelo chão, bloco a bloco, atrás do herói (nunca atravessa bloco). Embaixo dele a ponta se ergue e as folhinhas tremem; depois agarra, prende 1 s e machuca. Dois golpes na raiz cortam: ela recolhe e o bulbo fica aberto 3 s, levando mais dano. Fechado, leva metade.',
    tatupedra: 'Anda devagar. Para atacar se enrola com som de pedra raspando, fica parado um instante e sai rolando, quicando nas paredes e subindo degraus, rampas e troncos deitados; rolando, o corpo machuca. Se bater de frente num tronco fica tonto 1,5 s e leva mais dano.',
    mariposacr: 'Circula a luz mais forte por perto: uma drusa acesa, uma tocha na parede ou o herói com tocha ou peça que brilha. Guardando a tocha, ela vai embora para a drusa mais perto. As asas acendem inteiras e ela solta um leque de 5 lascas de cristal.',
    driade: 'Anda por dentro da parede de fundo, escura, onde nada a alcança, e só sai para o plano da frente para lançar: 3 sementes de cristal em arco. Onde cada uma cai, um círculo brilha e logo brota um espinho de cristal de 2 blocos, que fica 3 s.',
    sementes: 'Bando de 6 sementes de pedra que pulam todas juntas, no mesmo ritmo. O bando se agacha e chacoalha de uma vez; o pulo seguinte cai em cima do herói. O bando conta como um monstro só.',
    troncovelho: 'Anda devagar sobre as raízes, para e se planta no chão: plantado leva metade do dano, se cura aos poucos e as raízes machucam quem encosta; arrancar leva 1 s. O galho range e sobe antes de uma varrida larga; plantado, bate o pé e caem folhas de cristal do teto (as sombras avisam).',
    ourico: 'Anda devagar e vira para o outro lado quando apanha. Os 8 espinhos acendem um por um, em volta dele; quando todos acendem, dispara para todos os lados e fica careca 3 s, levando mais dano.',
    serpraiz: 'Mora num buraco de tronco ou de raiz e nunca sai dele. Dois olhos acendem lá dentro e a casca range; meio segundo depois vem um bote reto de até 6 blocos, e ela volta como mola.',
    prismavivo: 'Flutua devagar e só para quando está em linha reta com o herói: na mesma linha, na mesma coluna ou na diagonal, como a rainha do xadrez. Uma linha fina de luz mostra a mira por 0,9 s e vem o raio, que quica uma vez no cristal e depois atravessa a folhagem de cristal.',
    cervo: 'Chefe da Floresta Petrificada. Veja as fases abaixo.',
    apagaluz: 'Criatura da sombra de braços compridos. Anda até a tocha mais próxima (ou a pira, na sala do Nox), não até o herói, e apaga com a mão; os braseiros acesos com lume-fátuo ele não consegue apagar. Se o herói estiver perto, garra dupla: os braços sobem e os dois olhos brancos se arregalam por 0,6 s. A luz forte o queima no caminho.',
    bocabreu: 'Uma mancha no chão escuro que não anda: só se arrasta devagar quando ninguém está olhando. Um anel de dentes brancos aparece em volta dos pés do herói e ele ouve um fôlego; 0,7 s depois a boca fecha de baixo. Nunca abre em chão aceso.',
    traca: 'Bandos de 5 a 8 que voam para a luz mais forte e ficam rodando em volta dela. Dão um rasante em fila (as asas piscam pálidas antes) e soltam um pó que fecha a vista do herói por 3 s.',
    semolhos: 'Fica parado em bordas altas e vira o rosto liso devagar para o herói. O peito abre num buraco escuro com a borda acesa (0,8 s) e solta uma esfera de breu lenta, que segue o herói um pouco; quem é atingido fica quase cego por 6 s.',
    colosso: 'Massa de breu com rachaduras pálidas. Só se mexe no escuro: com luz em cima (0,35 ou mais) ele congela no meio do passo. No escuro anda rápido. Soco no chão: uma rachadura pálida corre pelo chão até onde vai bater, 0,9 s antes.',
    rastro: 'Desliza achatado pelo chão como uma sombra e não pode ser atingido. Levanta (os olhos acendem e ele cresce em 0,5 s), dá um bote curto e fica de pé um instante, exposto. Na luz forte ele é obrigado a levantar e fica exposto enquanto ela durar.',
    mortalha: 'Plana em arcos longos como um pano preto ao vento. Para em cima do herói e as bordas acendem (0,7 s) antes de cair; se acertar, envolve: a vista some e o herói toma dano por 2 s ou até acertá-la.',
    ouvinte: 'É cego e anda na direção do barulho: golpe, picareta, corrida e pulo. Parado ou agachado, o herói some para ele. Grito em cone (a cabeça sobe e anéis pálidos saem da boca 0,6 s antes): empurra e atordoa.',
    acendedor: 'Um Acendedor esvaziado pela Escuridão. Anda devagar com uma lanterna de chama azul fria (ela ilumina) e fica perto dos braseiros acesos. Ergue a lanterna para trás e arremessa a chama em arco: onde cai, fica uma poça de fogo frio por 4 s que machuca e ilumina.',
    maofundo: 'Mora dentro dos poços sem fundo dos Grandes Vãos. Dedos pálidos aparecem na borda e arranham a pedra (0,8 s); a mão agarra quem está na borda ou na corrente e puxa para baixo, para os espinhos de vidro negro. Escondida no poço, não dá para acertar.',
    nox: 'O chefe da Escuridão. Veja as fases abaixo.',
    visitante: 'O homenzinho verde de olhos pretos. Anda rápido e foge quando fica sozinho, para voltar com outros. A sonda na mão acende verde e estala (0,5 s) e vêm duas estocadas elétricas rápidas.',
    atirador: 'O mesmo homenzinho, com capacete de vidro e pistola de raio; fica a uns 7 blocos. O cano acende rosa e um ponto de mira aparece no herói (0,6 s) antes de três tiros em sequência. Se o herói chega perto, some num estalo de luz ciano e aparece 6 blocos para trás.',
    disco: 'O disquinho com cúpula, sempre voando alto, por cima. A borda gira mais rápido e as luzes correm em volta (0,8 s); abre o feixe arco-íris para baixo por 2 s e quem está nele é puxado para cima até o disco e leva dano ao chegar. Andar para o lado tira o herói do feixe.',
    olho: 'Um olho com veias voando devagar, que nunca chega perto. Uma linha fina vermelha liga o olho ao herói e vai engrossando (1,4 s) até virar um raio contínuo. Quando vê o herói, dá o alarme e os Visitantes por perto vêm ver.',
    gosma: 'Parece Gosma Pingando no teto. A gota incha e brilha (0,5 s) e cai quando o herói passa embaixo; no chão vira uma poça viva que anda devagar. Encostar machuca e gruda: o herói fica 40% mais lento por 2 s.',
    olhudos: 'Bichinhos verdes de três olhos e tentáculos, em grupos de 4 a 6 que pulam juntos. Os três olhos piscam ao mesmo tempo (0,4 s) e o grupo inteiro pula no herói; mordem por toque.',
    astronauta: 'Um astronauta abduzido há muito tempo, com gosma verde por dentro do visor. Anda devagar e pula alto, como na lua: se agacha e o visor acende verde (0,8 s), e o pulo em arco cai em cima do herói com uma onda de choque para os dois lados. Ao morrer, o tanque de oxigênio chia 1 s e estoura.',
    cabecao: 'Uma cabeça cinza enorme flutuando baixo, com um escudo psíquico violeta na frente: só leva dano por trás ou de cima. Os olhos acendem violeta e um destroço do chão sobe tremendo (1 s) antes de ser arremessado. A cada 3 arremessos, puxa o herói 3 blocos para perto.',
    hipnotico: 'O ET de pescoço comprido que faz o sinal de paz e fica atrás dos outros. Faz o "V" com a mão e anéis arco-íris saem crescendo dele (1 s): quem é pego fica hipnotizado 3 s, com os lados trocados. Não ataca de outro jeito e foge se o herói chega perto.',
    foguete: 'Um foguetinho vermelho vivo que dorme grudado na parede ou no teto. A chama acende, sai fumaça e uma seta laranja mira o herói (0,7 s); dispara em linha reta e explode no que bater. Se errar, faz a curva e tenta mais uma vez.',
    olhocometa: 'O chefe da Nave Caída. Veja as fases abaixo.',
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
  principeOnde: 'O Trono do Caos, um salão de 56 x 20 blocos no fundo do Abismo (cerca de 2040 m), do outro lado do mundo em relação às fendas, com um trono de ferro negro e osso cravejado de cristais do caos, braseiros e correntes. Ao entrar, grades do caos fecham todas as saídas; sair da sala ou morrer recomeça a luta. Fica salvo que ele morreu. Solta o Coração do Caos, acessório lendário.',
  sineiroFases: [
    ['Fase 1, o campanário.', 'Puxa a corda e o sino recua devagar antes de varrer um arco embaixo dele; segura a corda com as duas mãos e se inclina antes da badalada, um anel de som que corre pelo chão para os dois lados (pule); se sacode e cai água negra em gotas grossas, com um círculo no chão antes de cada uma. Aos 65% a viga range, solta poeira e o sino cai, quebrando o piso do campanário e o do 3º andar.'],
    ['Fase 2, os andares (65%).', 'Sobe e desce pela corda do sino. Puxa o sino e o solta de novo, quebrando o pedaço de andar marcado por rachaduras e poeira; arranca o badalo e joga como um martelo (quica e volta pela corrente); a badalada abafada corre pelo chão e sobe e desce 4 blocos pelas paredes: fique no meio do andar. Aos 30% o último piso cede.'],
    ['Fase 3, a Cisterna Funda (30%).', 'O sino meio afundado vira a ilha. Ele mergulha, bolhas mostram onde vai sair e sai agarrando e puxando para a água; bate no sino por baixo e uma onda empurra quem estiver na água ou no sino; a cada 20 s sobem 2 afogados das bordas.']
  ],
  sineiroOnde: 'A Torre do Sino, 20 x 50 blocos no Palácio do Sino, do outro lado do mundo em relação às descidas: o campanário no alto, na altura do Bairro do Poço, três andares com escadas de corda e, embaixo, a Cisterna Funda com 6 blocos de água negra. Entra-se pelo campanário, por uma ponte de telhados; a Grade do Campanário fecha a ponte e a porta de baixo. Sair, usar o portal ou morrer recomeça a luta e a torre volta inteira. Depois da morte, a corda do sino fica pendurada até a cisterna e dá para escalar. Fica salvo que ele morreu. Solta o Badalo do Sineiro, maça lendária.',
  noxFases: [
    ['Fase 1 (100% a 60%).', 'Braço de Breu: a borda pálida do braço corre pelo chão 0,8 s e depois ele varre (nas saliências não pega). Sopro que Apaga: ele inspira e todas as chamas da sala se curvam para ele (1 s); depois um cone que apaga piras e tochas e machuca (o lume de cada pira apagada foge pela sala). Anda até a pira acesa mais perto do herói para soprá-la, sempre de fora do círculo dela.'],
    ['Fase 2 (60% a 25%).', 'Afunda e o chão vira um espelho preto. Subida: um anel pálido aparece sob o herói (0,9 s) e ele sobe por ali. Chama mariposas negras e 2 apagadores, que vão direto às piras.'],
    ['Fase 3 (25% a 0).', 'Apaga todas as piras de uma vez, e os seis lumes fogem pela sala. Noite Total: a cada 12 s as bordas da tela fecham por 2 s; quem não estiver no círculo de uma pira acesa toma 1,6 vezes o dano. Acender pira de novo é o único abrigo, e ele vai atrás de quem tenta.']
  ],
  noxOnde: 'O Escuro Total, uma caverna redonda de pedra primeva de 64 x 26 blocos no fim do Fundo do Mundo, do outro lado do mundo em relação às descidas: a única sala do jogo sem luz nenhuma. Saliências de pedra lavrada em três alturas, seis Piras dos Acendedores apagadas (duas no chão, duas a 8 blocos, duas a 15 perto do meio) e correntes para subir; nas paredes, o Mural dos Acendedores. Ao entrar, o Muro de Sombra fecha as portas. Nox só toma dano com luz em cima dele: acender uma pira pede o herói ajoelhado 1 s e gasta um lume-fátuo (ao lado de cada pira fria espera um), e ela arde azul; na luz forte de uma pira ele queima. Pira que ele ou os apagadores apagam solta o lume, que foge voando pela sala e pousa longe: é preciso ir buscá-lo. Depois da vitória as piras acendem sozinhas, com fogo quente de verdade. Tocha posta na sala dura 20 s. Sair, usar o portal ou morrer recomeça a luta. Matá-lo muda o mundo: todas as camadas ficam um pouco menos escuras e o breu vivo para de crescer. Solta A Última Brasa, acessório lendário.',
  // fases do Cervo de Pedra (js/146-cervo-pedra.js)
  cervoFases: [
    ['Fase 1, a corrida.', 'Raspa o casco duas vezes, abaixa a galhada com faíscas verdes nas pontas e corre em linha reta até a parede. Tronco gigante no caminho racha (a rachadura branca sobe antes) e cai para o lado da corrida, virando uma rampa deitada. Com o herói atrás dele, as patas de trás brilham e vem um coice; se empina, bate as patas da frente e uma onda corre 6 blocos pelo chão para cada lado (pule ou suba num tronco).'],
    ['Fase 2, a fuga pelo alto (60%).', 'A galhada floresce em cristal. Ele corre para a ponta mais longe e sobe nos troncos caídos; só desce quando o herói chega perto, e foge para a outra ponta. Sacode a galhada e caem folhas de cristal onde as sombras marcam; berra (a galhada pisca 3 vezes) e os 2 troncos em pé mais perto do herói racham e caem juntos.'],
    ['Fase 3, o cerne (25%).', 'A pele racha e aparece o cerne de cristal no peito: ali o golpe dá +50%. Pula de tronco deitado em tronco deitado, e o tronco onde ele pousa racha e vira cascalho (nunca os dois últimos). Do alto, uma linha de lascas marca no chão a diagonal do mergulho antes de ele descer. A cada 3 investidas ou mergulhos para 2 s, ofegante: a hora de bater no cerne.']
  ],
  cervoOnde: 'A Clareira dos Troncos Gigantes, 120 x 24 blocos no fundo da Clareira dos Gigantes (cerca de 1294 m), do outro lado do mundo em relação às entradas. Sete troncos gigantes de 4 blocos vão do chão ao teto, cada um em pé sobre as raízes, com um arco de 3 blocos embaixo por onde o herói passa (o Cervo não cabe). No meio, uma fenda de 10 blocos com espinhos de cristal no fundo e duas raízes para pular: cair nela tira 12% da vida e devolve à borda, mas nunca mata. Ao entrar, a Muralha de Raízes fecha as duas pontas. Os troncos que ele derruba viram rampas; sair, usar o portal ou morrer recomeça a luta, e a clareira volta como era, com os troncos de pé. Quando ele morre, os troncos que ainda estão em pé caem e ficam assim. Fica salvo que ele morreu. Solta a Galhada do Cervo de Pedra, elmo lendário, e metade das vezes uma das três bases da camada.',
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
    curandeira: 'Alquimista e herborista. Prepara poções de vida, poções de mana e elixires no alambique, com as ervas que você colhe em cada camada e materiais de monstro. Também cura de graça: enche toda a vida e a mana.',
    taverneiro: 'Vende carvão para a fornalha, tochas e candelabros, compra madeira e carvão, conta boatos e cozinha: com a carne crua e os cogumelos que caem dos bichos, faz pratos que se comem parado e devolvem vida e mana aos poucos.',
    anciao: 'O mais velho do vilarejo. Conversa, conta o que sabe das profundezas e dá conselhos.',
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
  // faixas das Minas Fúngicas (js/120-fungo-api.js: FG_BANDS; js/125-fungo-mundo.js) e os minérios delas (125: vein)
  fgFaixas: [
    { zona: 25, nome: 'Galerias Tomadas', de: 744, ate: 790, salas: 'galerias tortas da colônia de Ferroalto, casas de tijolo, a enfermaria lacrada, as câmaras de pouso no pé das duas descidas', carater: 'xisto úmido e rocha tomada pelo micélio, escoras tomadas, tábuas podres, fios pendentes, os últimos lampiões da colônia' },
    { zona: 26, nome: 'Bosque de Chapéus', de: 790, ate: 842, salas: 'salões enormes com cogumelos gigantes em escada', carater: 'húmus de esporo, troncos e chapéus de cogumelo que servem de plataforma, cogumelos-lanterna, cachos de esporos, luz ciano' },
    { zona: 27, nome: 'Grutas Alagadas', de: 842, ate: 894, salas: 'grutas largas com bacias de água parada e passarelas de tábua, túneis meio alagados', carater: 'lodo e xisto, ilhas de lodo, juncos de micélio na beira da água, gotejos de seiva' },
    { zona: 28, nome: 'Coração do Micélio', de: 894, ate: 930, salas: 'câmaras redondas de carne ligadas por veias, a Gruta da Mãe, as duas raízes-mestras que descem para a Cidade Afundada', carater: 'carne de micélio pulsando, bolsas de esporo nas paredes, cordões de micélio, ossadas tomadas' }
  ],
  fgMinerios: [['carvao', 744, 894], ['min_esporita', 744, 930]],
  // faixas da Cidade Afundada (js/130-cidade-api.js: CD_BANDS; js/136-cidade-mundo.js) e os minérios dela (136: vein)
  cdFaixas: [
    { zona: 29, nome: 'Cisternas Altas', de: 930, ate: 976, salas: 'salões de cisterna com colunas e água negra, esgotos abobadados com canal, um aqueduto de arcos, as casas do guarda da cisterna no pé das duas raízes-mestras', carater: 'pedra com limo e aterro, colunas da cisterna, correntes, alga negra, goteiras, barcos de fundo chato, ossos com lodo, os primeiros afogados' },
    { zona: 30, nome: 'Ruas Tortas', de: 976, ate: 1028, salas: 'ruas em ladeira de degraus, casas tortas de 2 e 3 andares, becos verticais, acampamentos dos saqueadores', carater: 'aterro, cantaria e tijolo, calçamento, telhados de ardósia que viram caminho, fachadas, lanternas, carroças tombadas, barricadas, fogueiras' },
    { zona: 31, nome: 'Bairro do Poço', de: 1028, ate: 1080, salas: 'o templo do Poço, as casas do culto, o Grande Poço no centro', carater: 'cantaria e pedra do Poço, velas em fila, sininhos, oferendas, bancos do templo, estátuas sem rosto, procissões' },
    { zona: 32, nome: 'Palácio do Sino', de: 1080, ate: 1116, salas: 'salões de mármore, adegas (duas são as descidas para a Floresta Petrificada), a Torre do Sino', carater: 'mármore rachado e aterro, lustres caídos, fonte seca, carruagem afundada, vitrais rachados, retratos do rei com o rosto raspado' }
  ],
  cdMinerios: [['carvao', 930, 1110], ['min_prata', 930, 1116]],
  // faixas da Floresta Petrificada (js/140-floresta-api.js: FP_BANDS; js/145-floresta-mundo.js) e os minérios dela (145: vein)
  fpFaixas: [
    { zona: 33, nome: 'Bosque Soterrado', de: 1116, ate: 1162, salas: 'grutas de terra baixas e compridas presas entre troncos deitados, as câmaras de pouso no pé das duas raízes-mestras', carater: 'solo petrificado e casca de pedra, troncos deitados que viram rampa, cortinas de raízes, samambaias e pinhas de pedra, um javali que virou pedra' },
    { zona: 34, nome: 'Mata de Cristal', de: 1162, ate: 1214, salas: 'clareiras ocas com troncos do chão ao teto e andares de folhagem de cristal a 6 e 12 blocos do chão, ligados por cipós de pedra', carater: 'granito verde, folhagem de cristal, três vezes mais geodos, copas e pingentes de cristal acesos, cervos, lobos e corujas de pedra' },
    { zona: 35, nome: 'Raízes Profundas', de: 1214, ate: 1266, salas: 'redes de raiz que servem de chão, raízes ocas de até 60 blocos por dentro da rocha', carater: 'raiz de pedra e bolsões de seiva vítrea, estalactites de seiva, veios de seiva brilhando na parede, portas de raiz para lugar nenhum' },
    { zona: 36, nome: 'Clareira dos Gigantes', de: 1266, ate: 1302, salas: 'salões de troncos gigantes de 4 a 6 blocos, a Clareira dos Troncos Gigantes, o acampamento anão e as duas escadarias dos anões que descem para a Fortaleza dos Anões', carater: 'granito verde e cerne de pedra, cascalho de cristal, círculo de pedras, picaretas de bronze, marcos anões com runa, a galhada fóssil na parede' }
  ],
  fpMinerios: [['carvao', 1116, 1266], ['min_platina', 1116, 1302]],
  // faixas da Fortaleza dos Anões (js/180-anoes-api.js: AN_BANDS; js/185-anoes-mundo.js) e os minérios dela (185: vein)
  anFaixas: [
    { zona: 37, nome: 'Portões de Bronze', de: 1302, ate: 1348, salas: 'muralhas internas com seteiras, guaritas, as duas escadarias do clã que descem da Floresta Petrificada com a sala da guarita no pé', carater: 'granito anão e cantaria, portões de bronze arrombados de baixo, lâmpadas de runa, estátuas de guerreiro, estandartes do clã' },
    { zona: 38, nome: 'Salões do Clã', de: 1348, ate: 1400, salas: 'salões com colunata, refeitórios com a mesa ainda posta, fileiras de dormitórios, túmulos com sarcófago e estátua de rei', carater: 'laje gravada e relevo com a marca do clã, lustres de bronze, barris, bancos, beliches de pedra, colunas caídas' },
    { zona: 39, nome: 'Canais de Lava', de: 1400, ate: 1452, salas: 'salas de canal com a lava correndo debaixo de grades de bronze, salas de máquinas com passarela e engrenagens, as eclusas com comporta e alavanca', carater: 'pedra de canal e bronze, lava em linha reta, respiros de vapor, guindastes, roldanas, engrenagens gigantes, bombas' },
    { zona: 40, nome: 'Forjas de Runas', de: 1452, ate: 1488, salas: 'forjas com fornalha, bigorna de runas e canal curto, a Oficina do Mestre, a Grande Forja e as duas brechas para baixo', carater: 'tijolo refratário e bronze, braseiros, faíscas, fuligem, cera seca e cascas de quitina perto das brechas' }
  ],
  anMinerios: [['carvao', 1302, 1486], ['min_mithril', 1302, 1488]],
  // faixas da Colmeia (js/190-colmeia-api.js: CM_BANDS; js/195-colmeia-mundo.js) e os minérios dela (195: vein)
  cmFaixas: [
    { zona: 41, nome: 'Brecha Tomada', de: 1488, ate: 1530, salas: 'as duas brechas que descem das Forjas de Runas, cada uma com um tubo de cera e a Escada de Favos até o pouso (12 x 6, com lanterna anã, sem monstros), salões anões que a cera engoliu pela metade', carater: 'pedra anã virando Pedra Tomada, cera velha escorrendo pelas paredes, ossos de anão, lanternas apagadas, fios de cera' },
    { zona: 42, nome: 'Galerias de Cera', de: 1530, ate: 1580, salas: 'favais (3 a 6 salas hexagonais coladas) e o labirinto de galerias em degrau, com gargalos de 2', carater: 'cera velha e cera nova, favos de mel escorrendo, montes de cera nova, mel pingando, poças de mel que deixam lento, funis de pó de cera da formiga-leão' },
    { zona: 43, nome: 'Câmaras de Âmbar', de: 1580, ate: 1626, salas: 'câmaras redondas de resina com massas de âmbar (1 em 12 com um bicho preso dentro)', carater: 'resina e âmbar brilhando fraco, bolhas de resina, anões e bichos presos no âmbar, os veios de ambrita' },
    { zona: 44, nome: 'O Berçário', de: 1626, ate: 1674, salas: 'câmaras de ovos, as galerias reais de quitina, a esfera da Rainha e os dois Escorredouros de Mel para a Nave Caída', carater: 'cera real e quitina, ovos colados nas paredes, favos reais, larvas luminosas, casulos, um coração batendo dentro dos ovos' }
  ],
  cmMinerios: [['carvao', 1488, 1674], ['min_ambrita', 1488, 1674]],
  // faixas da Nave Caída (js/240-nave-api.js: NV_BANDS; js/245-nave-mundo.js) e os minérios dela (245: vein)
  nvFaixas: [
    { zona: 49, nome: 'A Cratera de Impacto', de: 1674, ate: 1720, salas: 'os dois tubos de chapa rasgada que descem dos Escorredouros de Mel, com a Escada de Serviço até a Cápsula de Pouso (12 x 6, luz de emergência, sem monstros), crateras de vidro com poças de gosma no fundo, cavernas de impacto e destroços do casco enfiados tortos na rocha', carater: 'a cera real da Colmeia virando Vidro de Impacto, escória com rachaduras verdes acesas, cápsulas de fuga caídas, o foguete vermelho de bico na rocha, antenas faiscando, poças de gosma' },
    { zona: 50, nome: 'O Casco', de: 1720, ate: 1772, salas: 'corredores retos de 4 de altura com tubo de neon no teto, hangares de discos com plataformas de grade, as Salas sem Peso e os elevadores de feixe entre as faixas', carater: 'chapa do casco, grade e painéis de neon rosa, ciano e verde, discos estacionados, painéis de controle piscando, cartazes holográficos, ventiladores girando, escotilhas com estrelas' },
    { zona: 51, nome: 'Os Laboratórios', de: 1772, ate: 1824, salas: 'laboratórios brancos e retos com parede de vidro numa ponta e a Galeria dos Espécimes, um corredor longo com cápsulas dos dois lados', carater: 'liga alienígena perolada, vidro ciano, gosma, cápsulas com bichos das camadas de cima, mesas de exame, tanques borbulhando, cérebros em potes, os veios de xenita' },
    { zona: 52, nome: 'O Núcleo', de: 1824, ate: 1860, salas: 'salas redondas do reator com condutos, o Planetário do Olho-Cometa e os dois Rasgos no Casco para o Abismo', carater: 'metal do reator e cristal de plasma arco-íris, pilares de plasma, consoles, anéis de contenção, olhos de vigia pendurados, pó cintilante colorido' }
  ],
  nvMinerios: [['carvao', 1674, 1860], ['min_xenita', 1674, 1860]],
  // faixas do Abismo (js/103-abismo-api.js: AB_BANDS; js/108-abismo-mundo.js) e os minérios dele (108: vein)
  abFaixas: [
    { zona: 21, nome: 'Portões de Cinza', de: 1860, ate: 1906, salas: 'salões em ruína de tijolo infernal, os pés das duas fendas', carater: 'rocha de cinza e basalto, cinza caindo do teto, correntes penduradas, braseiros, caveiras, estátuas de demônio, portões arrombados' },
    { zona: 22, nome: 'Rios de Fogo', de: 1906, ate: 1958, salas: 'cavernas largas com um lago de lava e uma ponte de ferro negro', carater: 'basalto e obsidiana, crosta de lava brilhando, poças de lava, colunas de basalto, caldeirões, cachoeiras de lava, faíscas subindo' },
    { zona: 23, nome: 'As Entranhas', de: 1958, ate: 2010, salas: 'câmaras redondas de carne', carater: 'carne viva e osso, tentáculos e ganchos no teto, sangue pingando, costelas, ovos, casulos, olhos e bocas nas paredes, um coração batendo' },
    { zona: 24, nome: 'Trono do Caos', de: 2010, ate: 2046, salas: 'templos de tijolo infernal, o Trono do Caos', carater: 'pedra do caos e enxofre, runas e cristais roxos, altares, pentagramas, obeliscos, púlpitos, brasas roxas subindo' }
  ],
  abMinerios: [['carvao', 1860, 2046], ['min_infernita', 1860, 2046]],
  // faixas da Escuridão (js/220-escuro-api.js: ES_BANDS; js/226-escuro-mundo.js) e os minérios dela (226: vein)
  esFaixas: [
    { zona: 45, nome: 'A Borda Apagada', de: 2046, ate: 2092, salas: 'os Postos dos Acendedores em ruína, os dois Postos de pouso no pé das correntes (o único braseiro eterno da camada)', carater: 'rocha apagada, a pedra do caos esfriando, ossadas abraçadas a lanternas, estátuas sem cabeça, obeliscos, poeira preta descendo' },
    { zona: 46, nome: 'O Breu', de: 2092, ate: 2144, salas: 'os Grandes Vãos, com o chão em ilhas, poços sem fundo e lajes de penumbra', carater: 'pedra-breu e vidro negro, estalagmites de vidro, olhos no escuro, sombras de ninguém, janelas para o Nada, nenhuma partícula' },
    { zona: 47, nome: 'As Raízes da Noite', de: 2144, ate: 2196, salas: 'galerias entre as raízes, os Nós dentro das raízes', carater: 'raiz da noite e casca, raízes pendentes que dá para escalar, raízes-veia, marcas de mão, pó de raiz caindo' },
    { zona: 48, nome: 'O Fundo do Mundo', de: 2196, ate: 2232, salas: 'os Altares Frios, os dois Selos do Fundo, O Escuro Total (a sala do Nox)', carater: 'pedra primeva, sóis gravados, colunas e altares dos Acendedores, pedestais vazios, faíscas brancas que somem' }
  ],
  esMinerios: [['carvao', 2046, 2232], ['min_noctirio', 2092, 2232]],
  faixaChave: { brecha: 'Brecha Tomada', camaras: 'Câmaras de Âmbar', bercario: 'Berçário', fendas: 'Fendas', saloes: 'Salões', covis: 'Covis', coracao: 'Coração', atrio: 'Átrio', nave: 'Nave', claustro: 'Claustro', criptas: 'Criptas', grutas: 'Grutas', galerias: 'Galerias', ninho: 'Ninho', fundacoes: 'Fundações', pocos: 'Poços', acampamento: 'Acampamento', fornalhas: 'Fornalhas', portoes: 'Portões', rios: 'Rios de Fogo', bosque: 'Bosque', entranhas: 'Entranhas', trono: 'Trono', cisternas: 'Cisternas', ruas: 'Ruas', bairro: 'Bairro do Poço', palacio: 'Palácio', canais: 'Canais de Lava', forjas: 'Forjas de Runas', borda: 'Borda Apagada', cratera: 'Cratera de Impacto', casco: 'Casco', laboratorios: 'Laboratórios', nucleo: 'Núcleo', breu: 'Breu', raizes: 'Raízes da Noite', fundo: 'Fundo do Mundo' },
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
    FG_CORDAO: 'Cordão de micélio', CD_MADEIRAME: 'Madeirame', CD_O_CARVAO: 'Veio de carvão no aterro', CD_O_PRATA: 'Veio de prata', CD_BARREIRA: 'Grade do Campanário', CD_PAREDE_FRESCA: 'Parede Fresca',
    CD_ESCADA: 'Escada de corda', CD_CORRENTE: 'Corrente de cisterna', CD_VELAS: 'Velas do culto', CD_LANTERNA: 'Lanterna de saqueador', CD_ALGA: 'Alga negra', CD_GOTEIRA: 'Goteira',
    CD_OFERENDA: 'Oferenda', CD_TROUXA: 'Trouxa de saque', CD_OSSOS: 'Ossos com lodo', CD_PLACA: 'Placa de loja', CD_SININHOS: 'Sininhos do culto', CD_COLUNA: 'Coluna da cisterna',
    FP_MUSGO: 'Pedra musgosa', FP_TRONCO_G: 'Tronco gigante', FP_BARREIRA: 'Muralha de Raízes', FP_O_CARVAO: 'Veio de carvão (madeira fóssil)', FP_O_PLATINA: 'Veio de platina', FP_O_CRISTAL: 'Miolo de geodo',
    FP_FOLHAS: 'Folhas de cristal caídas', FP_BROTO: 'Broto de cristal', FP_CIPO: 'Cipó de pedra', FP_RAIZ_ESCADA: 'Degraus de raiz', FP_PINGO: 'Estalactite de seiva', FP_SAMAMBAIA: 'Samambaia de pedra',
    FP_PINHAS: 'Pinhas de pedra', FP_PINGENTE: 'Pingente de cristal', FP_OSSADA: 'Ossada petrificada', FP_TOCO: 'Toco petrificado', FP_DRUSA: 'Drusa acesa', FP_NINHO: 'Ninho de gravetos de pedra',
    FP_TRONCO_D: 'Tronco gigante deitado', FP_TRONCO_DR: 'Tronco gigante deitado', FP_TRONCO_DL: 'Tronco gigante deitado',
    CM_CERA: 'Cera velha', CM_CERA_NOVA: 'Cera nova', CM_FAVO: 'Favo', CM_FAVO_MEL: 'Favo de mel', CM_RESINA: 'Resina', CM_AMBAR: 'Âmbar', CM_AMBAR_FOSSIL: 'Âmbar com fóssil',
    CM_PEDRA_TOMADA: 'Pedra tomada', CM_CERA_REAL: 'Cera real', CM_QUITINA: 'Quitina', CM_OVO: 'Ovo colado', CM_O_CARVAO: 'Veio de carvão na resina', CM_O_AMBRITA: 'Veio de ambrita',
    CM_FAVO_REAL: 'Favo real', CM_LACRE: 'Lacre Real', CM_PO_CERA: 'Pó de cera (funil)', CM_GOTA_MEL: 'Mel pingando', CM_ESTALAC: 'Estalactite de resina', CM_ESCADA_FAVO: 'Escada de favos',
    CM_FIO_CERA: 'Fio de cera', CM_LARVA_LUZ: 'Larva luminosa', CM_CASULO: 'Casulo', CM_OSSOS_ANAO: 'Ossos de anão', CM_POCA_MEL: 'Poça de mel', CM_BOLHA: 'Bolha de resina',
    CM_ASA: 'Asa caída', CM_LANTERNA_ANA: 'Lanterna anã', CM_COLUNA: 'Coluna de cera',
    ES_CASCA: 'Casca de noite', ES_BREU_VIVO: 'Breu vivo', ES_PENUMBRA: 'Laje de penumbra', ES_PENUMBRA_FIRME: 'Laje de penumbra acesa', ES_BARREIRA: 'Muro de Sombra', ES_O_CARVAO: 'Veio de carvão na rocha apagada', ES_O_NOCTIRIO: 'Veio de noctírio',
    ES_BRASEIRO_FRIO: 'Braseiro apagado', ES_BRASEIRO: 'Braseiro aceso', ES_TOCHA_MORTA: 'Tocha apagada', ES_LUME: 'Lume-fátuo (dá para pegar)', ES_CORRENTE: 'Corrente dos Acendedores', ES_RAIZ_PEND: 'Raiz pendente',
    ES_ESPINHO: 'Espinho de vidro negro', ES_ESTALAG: 'Estalagmite de vidro', ES_OSSADA: 'Ossada de Acendedor', ES_OLHOS: 'Olhos no escuro', ES_SOL: 'Sol gravado', ES_COLUNA: 'Coluna dos Acendedores',
    ES_PIRA_FRIA: 'Pira apagada', ES_PIRA: 'Pira acesa',
    NV_PLASMA: 'Cristal de plasma', NV_BARREIRA: 'Barreira de Energia', NV_O_CARVAO: 'Veio de carvão na escória', NV_O_XENITA: 'Veio de xenita', NV_RASTRO: 'Rastro arco-íris do Olho-Cometa',
    NV_ANEL: 'Anel holográfico', NV_PLANETA: 'Planeta holográfico', NV_ESCADA: 'Escada de serviço', NV_CABO: 'Cabo pendurado', NV_NEON: 'Tubo de neon', NV_GOTA: 'Gosma pingando',
    NV_POCA: 'Poça de gosma', NV_CAPACETE: 'Capacete de astronauta', NV_DESTROCO: 'Destroço do casco', NV_FIACAO: 'Fiação faiscando', NV_PLANTA: 'Planta alienígena', NV_HOLO: 'Projetor de holograma',
    NV_ESCORA: 'Escora do casco', NV_ESTRELA: 'Estrelinha de neon', NV_POTE: 'Pote de espécime', NV_FEIXE: 'Feixe do elevador', NV_EMISSOR: 'Emissor de feixe',
    HB_SANGUE: 'Sanguinária', HB_LIRIO: 'Lírio-das-grutas', HB_LOSNA: 'Losna-da-cripta', HB_GEADA: 'Flor-de-geada', HB_BRASA: 'Raiz-de-brasa'
  },
  paredeNome: {
    1: 'Terra', 2: 'Pedra', 3: 'Pedra funda', 4: 'Cripta', WCT_CALCARIO: 'Calcário', WCT_CANTARIA: 'Cantaria', WCT_REBOCO: 'Reboco', WCT_PAINEL: 'Painel de madeira',
    WCT_CRIPTA: 'Pedra de cripta', WCT_OSSARIO: 'Ossário', WCT_ARCADA: 'Arcada', WCT_MARMORE: 'Mármore', WCV_TERRA: 'Terra úmida', WCV_ROCHA: 'Rocha', WCV_CALCITA: 'Calcita',
    WCV_TEIA: 'Teia', WCV_XISTO: 'Xisto', WIC_CALC: 'Calcário congelado', WIC_ROCHA: 'Rocha gelada', WIC_GELO: 'Gelo azul', WIC_NEVE: 'Neve batida', WIC_NEGRO: 'Gelo negro',
    WMN_FERROSA: 'Rocha ferrosa', WMN_TABUADO: 'Tabuado', WMN_CAVADA: 'Rocha cavada', WMN_TIJOLO: 'Tijolo de fornalha', WMN_QUARTZITO: 'Quartzito',
    WAB_CINZA: 'Rocha de cinza', WAB_BASALTO: 'Basalto', WAB_CARNE: 'Carne viva', WAB_TIJOLO: 'Tijolo infernal', WAB_CAOS: 'Pedra do caos',
    WFG_CARNE: 'Carne de micélio', WCD_CANTARIA: 'Cantaria', WCD_TIJOLO: 'Reboco descascado', WCD_LIMO: 'Pedra com limo', WCD_MADEIRA: 'Tabuado das casas', WCD_MARMORE: 'Mármore',
    WFP_SOLO: 'Solo petrificado', WFP_GRANITO: 'Granito verde', WFP_CASCA: 'Casca de pedra', WFP_RAIZ: 'Raiz de pedra', WFP_CRISTAL: 'Cristal fosco',
    WCM_PEDRA: 'Pedra tomada', WCM_CERA: 'Cera velha', WCM_FAVO: 'Favo', WCM_RESINA: 'Resina', WCM_REAL: 'Cera real',
    WES_APAGADA: 'Rocha apagada', WES_BREU: 'Pedra-breu', WES_RAIZ: 'Raiz da noite', WES_LAVRADA: 'Pedra lavrada', WES_PRIMEVA: 'Pedra primeva',
    WNV_ROCHA: 'Rocha fundida', WNV_CASCO: 'Painéis do casco', WNV_LAB: 'Painéis de laboratório', WNV_REATOR: 'Reator', WNV_NEON: 'Painel com neon'
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
  abismo: 'A décima primeira camada, debaixo da Nave Caída e logo acima da Escuridão, de 1860 a 2046 m: o inferno de onde vieram os demônios. Cinza, rios de fogo, paredes de carne que respiram e, no fundo, o trono de quem manda em tudo isso. O metal daqui é a infernita.',
  anoes: 'A oitava camada, debaixo da Floresta Petrificada, de 1302 a 1488 m. Brasafunda, a fortaleza do Clã da Bigorna: andares retos de cantaria ligados por corredores que dão a volta no mundo, escadas de pedra entre eles, lava domada em canais com grade por cima e forjas que ainda trabalham sozinhas. Os anões subiram; ficaram as máquinas cumprindo a última ordem (guardar) e os fantasmas. Algo cavou de baixo: cera, quitina e buracos redondos.',
  anoesEntrada: 'As duas escadarias de pedra dos anões, no fim da Floresta Petrificada, viram um poço quadrado de cantaria com escada anã que desce até a sala da guarita (12 x 6, laje plana, duas lâmpadas de runa, sem monstros), no primeiro andar dos Portões de Bronze. A saída para baixo são as duas brechas no chão das Forjas de Runas, buracos redondos forrados de cera seca, com uma corrente de bronze.',
  anoesSom: 'Um zumbido grave e contínuo de máquina e o eco seco de salão de pedra. Ao longe, um malho batendo, correntes, sibilo de vapor, uma comporta batendo. Vento nas seteiras dos Portões, um coro grave sem palavras nos Salões, fole e bigorna mais perto nas Forjas e, perto das brechas, um zumbido de inseto vindo de baixo.',
  anoesMecanismos: 'As eclusas (poços de 6 de largura entre os dois andares dos Canais) têm uma comporta de bronze na boca de cima e uma alavanca em cada andar: a tecla de usar (E) perto da alavanca abre ou fecha a comporta. As alavancas ficam salvas. Na Oficina do Mestre, num pedestal debaixo da marca do clã, fica o Cinzel de Runas: levado ao Grimaldo, ele reconhece a marca da bigorna do avô e a forja ganha a aba Runas, que grava uma runa (Brasa, Pedra, Fôlego ou Têmpera) numa peça forjada por 1 runa gravada e 1 barra do metal da peça.',
  autoforjaOnde: 'A Grande Forja, um salão de 64 x 28 blocos nas Forjas de Runas, do outro lado do mundo em relação às escadarias. O Autômato-Forja anda pendurado num trilho de bronze perto do teto; no chão, três trechos de grade sobre um canal de lava; nas paredes, quatro plataformas com alavancas (duas de lava, duas de trava). Ao entrar, portões de runas fecham as duas portas; sair ou morrer reinicia a luta.',
  colmeia: 'A nona camada, debaixo da Fortaleza dos Anões, de 1488 a 1674 m. Uma colmeia do tamanho de uma cidade que comeu os andares de baixo dos anões: a pedra vira cera, a cera vira favo, o favo vira resina e âmbar e, no fundo, a cera real do Berçário, onde a Rainha põe os ovos. As paredes trabalham: as operárias lacram com cera nova o que o herói quebra. O metal daqui é a ambrita.',
  colmeiaEntrada: 'As duas brechas redondas no chão das Forjas de Runas, com a corrente de bronze dos anões, viram um tubo de cera com a Escada de Favos que desce de 20 a 28 blocos até o pouso (12 x 6, chão plano, lanterna anã, sem monstros), na Brecha Tomada. A saída para baixo são os dois Escorredouros de Mel, no Berçário.',
  colmeiaSom: 'Um zumbido grave de asas que não para, mais forte no Berçário, e uma respiração lenta da colmeia inteira, com eco curto e abafado. Cera estalando, mel caindo em plop, larvas mastigando dentro da parede, um zumbido que cruza a tela e, no Berçário, um coração batendo.',
  colmeiaEstados: 'A vespa-resineira encasula o herói em resina: ele não anda nem ataca até a resina quebrar, e apertar A e D alternados quebra antes. A vespa-parasita põe um ovo no peito: em 5 s ele eclode com o dobro do dano e uma larva, a não ser que a vespa morra antes ou o herói beba uma poção. A poção também quebra o casulo. Pisar no mel deixa 40% mais lento. Quebrar um Ovo Colado ou um Favo Real pode soltar uma larva. A larva faminta come o que está no chão e cresce, mas devolve tudo ao morrer.',
  rainhaOnde: 'A esfera de favos do Berçário, do outro lado do mundo em relação às brechas: uma bola de 44 blocos com casca de quitina e dois anéis de favo real. Duas galerias reais retas chegam às aberturas dos lados, cada uma vinda de uma câmara de ovos. A Rainha fica colada pelo abdômen numa massa de cera real no centro; entrar no oco ou acertá-la faz o Lacre Real fechar as aberturas.',
  rainhaFases: [
    ['Fase 1, presa.', 'Colada no centro: o cântico (o abdômen acende em ondas e os favos perto do herói soltam larvas), o cuspe de geleia (3 bolas em leque) e a ferroada em linha, sempre com aviso. O Favo Real quebra com 2 golpes durante a luta.'],
    ['Fase 2, solta (60%).', 'O abdômen fica para trás como um saco de ovos que cola um ovo na parede a cada 4 s; matar o saco tira vida dela. Ela voa: a investida atravessa a esfera rasgando os favos, e uma vez o lacre abre para entrarem 2 soldadas.'],
    ['Fase 3, a esfera se abre (25%).', 'Arranca o resto dos anéis: leque de 5 ferrões, voo em espiral pingando mel fervente (a marca dourada avisa), o grito real que faz todos os ovos eclodirem, e a investida.']
  ],
  autoforjaFases: [
    ['Fase 1, o guindaste.', 'Corre pelo trilho e ataca com o braço do malho, a garra e o cadinho de lava, sempre avisando antes. Os braços só levam dano quando estão embaixo; a alavanca de trava abre a portinhola do núcleo, que então leva o dobro.'],
    ['Fase 2, a forja acorda (60%).', 'Solta enxames de engrenagens (no máximo 2), as grades do chão esquentam em sequência e a garra vai puxar uma alavanca de lava; as bicas do teto queimam quem estiver embaixo, inclusive ele.'],
    ['Fase 3, o pêndulo (25%).', 'O trilho arrebenta de um lado e ele balança pendurado na ponta. O trilho caído vira uma rampa: subindo nela, o núcleo fica ao alcance da espada.']
  ],
  nave: 'A décima camada, debaixo da Colmeia e em cima do Abismo, de 1674 a 1860 m. Há eras uma nave dos Visitantes, os homenzinhos verdes de olhos pretos, caiu do céu, furou a terra como uma bala e só parou aqui. O reator nunca apagou: a nave inteira ainda acende em neon verde, rosa, ciano e violeta, as cápsulas de espécime ainda guardam o que eles levaram das camadas de cima e os discos ainda saem para abduzir. É a única camada que não é deste mundo e a única cheia de luz: toda ela vem da própria nave e da gosma. O metal daqui é a xenita.',
  naveEntrada: 'Debaixo dos dois Escorredouros de Mel do Berçário da Colmeia, o mel acaba onde a pedra virou vidro e o poço continua como um tubo de chapa rasgada de 3 de largura, com a Escada de Serviço de neon descendo de 20 a 26 blocos até uma Cápsula de Pouso (12 x 6, piso de grade, a luz de emergência acesa, sem monstros), na Cratera de Impacto. Entre as faixas sobem os elevadores de feixe. A saída para baixo são os dois Rasgos no Casco, no fundo do Núcleo.',
  naveSom: 'Sem melodia: o zumbido elétrico grave do reator e o chiado fino do neon, com eco metálico de corredor. Bip-bip de painel, um "uóóó" de disco voador ao longe, escotilhas sibilando, gosma borbulhando, faíscas estalando. Na Cratera, vento e pedra rangendo; nos Laboratórios, bolhas e um bip de monitor cardíaco; no Núcleo, o reator pulsando mais forte.',
  naveEstados: 'O hipnotizador (e o Olho-Cometa) deixa o herói hipnotizado: um anel arco-íris gira na cabeça e andar para a esquerda vai para a direita; só o tempo solta. O feixe do disco abdutor puxa o herói para cima enquanto ele estiver dentro; sair para o lado ou matar o disco faz cair. A gosma viva e a poça de gosma deixam 40% mais lento, com os pés verdes. A poção de vida solta a gosma do corpo, mas não a hipnose. Morrer solta tudo. Nas Salas sem Peso a gravidade cai para 35% e o pulo vai longe; o feixe do elevador escala como corrente, W sobe mais rápido e S desce devagar.',
  olhoCometaOnde: 'O Planetário, uma esfera de raio 22 no Núcleo, do outro lado do mundo em relação às descidas, com casca de metal do reator de 2 blocos e o céu holográfico por dentro. No meio flutua o planeta holográfico listrado de vermelho e laranja, com um anel inclinado de 13 x 4 que serve de plataforma; dos lados, grades a cada 4 fileiras e o chão em bacia embaixo. O rastro arco-íris que o Olho deixa vira chão sólido por 4 s (pisca antes de sumir): é a escada que muda para alcançá-lo lá em cima. Ao entrar, a Barreira de Energia fecha as duas portas; sair, usar o portal ou morrer recomeça a luta, com o anel inteiro e o rastro e os discos sumidos. Fica salvo que ele morreu. Solta a Cauda do Cometa, espada lendária, e na primeira vitória uma das três bases da camada.',
  olhoCometaFases: [
    ['Fase 1, a órbita.', 'Gira em volta do planeta deixando o rastro. Lágrima de luz: a pupila contrai e uma linha de mira aparece (0,7 s) antes da lágrima reta. Piscada: a pálpebra fecha (0,5 s), ele some num estalo e aparece do outro lado do planeta.'],
    ['Fase 2, os discos (60%).', 'Dois Discos Abdutores entram pelas portas, uma vez. O anel passa a girar em setores: um quarto pisca rosa 1 s, some 3 s e volta, e vem o próximo. Investida-cometa: ele recua, a cauda cresce e uma faixa tracejada mostra o caminho (1 s); atravessa a esfera em reta deixando um rastro longo.'],
    ['Fase 3, o olho arregalado (30%).', 'A íris vira um arco-íris girando. Feixe arco-íris: ele para no alto, a pupila dilata e um leque aparece no chão (1,2 s) antes de varrer a esfera de um lado ao outro; o planeta e os blocos sólidos fazem sombra, e se esconder atrás deles salva. Chuva de estrelas: estrelinhas de neon caem do teto, com uma marca no chão 0,6 s antes.']
  ],
  abismoEntrada: 'Os dois Rasgos no Casco, no chão de duas salas do reator no fundo do Núcleo da Nave Caída: buracos onde o casco abriu na queda, a chapa dobrada para fora e o plasma vazando nas bordas, com a Escada de Serviço até o fundo, que cai num salão em ruína nos Portões de Cinza. Volta-se pela mesma escada.',
  abismoSom: 'Um ronco grave e o fogo ao fundo; correntes balançando nos Portões; lava borbulhando e estalando nos Rios de Fogo; gotas de sangue e um coração batendo nas Entranhas; sussurros no Trono do Caos e, bem longe, alguma coisa grande rugindo.',
  escuro: 'A décima segunda camada e o fundo do mundo, debaixo do Abismo, de 2046 a 2232 m. Antes do mundo só havia a Escuridão; os Acendedores desceram até aqui com fogo e acenderam braseiros para segurá-la embaixo, e o mundo inteiro foi construído por cima dessa linha de fogo. Os braseiros se apagaram um por um e ela voltou a subir: é por isso que cada camada é mais escura que a de cima. Aqui não há luz nenhuma de fundo: a luz é o recurso, a arma e o escudo. O metal daqui é o noctírio.',
  escuroEntrada: 'Dois poços redondos saem do chão de dois templos dos Templos do Caos, no fundo do Abismo, com braseiros do Inferno ladeando a boca. Descendo, a pedra do caos perde a cor; uma corrente dos Acendedores desce inteira até um Posto de pouso na Borda Apagada, um anel de pedra lavrada com o único braseiro eterno da camada, onde nenhum monstro nasce. Volta-se pela mesma corrente.',
  escuroSom: 'Quase silêncio: um ruído grave muito baixo e um eco enorme, tudo parece longe. Uma gota que ecoa tempo demais; um fôlego longe, que para quando o herói para; uma pedra caindo num poço que nunca bate no fundo (Breu); fibras rangendo (Raízes); um tom grave quase inaudível que some perto de um braseiro aceso (Fundo); vento frio pelas frestas (Borda). Perto de um braseiro aceso, o estalo do fogo, o único som acolhedor. Na sala do Nox, nada.',
  escuroLuz: 'Tocha posta na camada vira tocha morta depois de 90 s (20 s na sala do Nox), e os monstros apagam as tochas. Os braseiros apagados acendem só com um lume-fátuo, a chama azul que flutua pelo bioma (encoste nela para pegar; o acendedor oco também solta): tecla de usar perto do braseiro e ele acende azul, e nenhum monstro apaga. Tocha não acende braseiro nem as piras da sala do Nox, que também pedem lume-fátuo. A Rota dos Acendedores, uma linha de braseiros a cada 25 a 35 blocos com um lume-fátuo no caminho de cada um, liga cada Posto à sala do Nox. Luz forte (0,6 ou mais) queima as criaturas da sombra. O mapa desta camada esquece: o que não está aceso some do mapa em 2 minutos, menos a até 14 blocos de um braseiro aceso. O breu vivo cresce no escuro e recua na luz; a laje de penumbra só segura quem pisa com luz em cima dela.',
  cidade: 'A sexta camada, debaixo das Minas Fúngicas, de 930 a 1116 m. Uma cidade inteira que a terra engoliu de uma vez, torta e meio alagada: as cisternas no alto, as ruas e casas no meio, o palácio e a torre do sino no fundo, e no meio do Bairro do Poço o Grande Poço, que já estava ali antes da cidade. É a única camada com gente viva: saqueadores atrás da prata e o culto do Poço. Eles sobem escadas, fogem, bebem poção, armam armadilhas e fecham passagens. Toda luz é feita por gente: velas, lanternas e fogueiras. O metal daqui é a prata.',
  cidadeEntrada: 'As duas raízes-mestras do Coração do Micélio furam o teto abobadado de dois salões de cisterna: o cordão de micélio grosso pende do buraco até uma borda de pedra seca uns 25 blocos abaixo, com uma escada de corda dos saqueadores ao lado. No pé de cada uma, a casa do guarda da cisterna, de pedra seca e com uma lanterna acesa, onde nenhum monstro nasce. Volta-se pelo mesmo cordão.',
  cidadeSom: 'Ar parado de cidade vazia, com o eco mais longo do jogo, e um vento que passa pelos becos. Ao longe, uma badalada grave e rara, uma porta batendo, passos correndo num telhado, moedas caindo, uma tosse, uma voz baixa sem palavras. Nas Cisternas, água negra batendo nas colunas; nas Ruas, madeira estalando; no Bairro, um canto de muitas vozes numa nota só, que some perto do Poço; no Palácio, eco de mármore.',
  cidadeAgua: 'As cisternas, os esgotos, as partes baixas dos quarteirões e a Cisterna Funda da Torre do Sino têm água negra (a água do jogo, igual em todas as camadas, só mais escura). Dá para nadar; debaixo da água o fôlego dura 10 segundos e depois a vida cai. Equipamento pesado afunda o herói. O Grande Poço não é saída: desce até uma tampa preta que não quebra, e lá não há nada.',
  floresta: 'A sétima camada, debaixo da Cidade Afundada, de 1116 a 1302 m. Uma floresta inteira que a terra engoliu há milênios e que virou pedra sem cair: troncos de granito em pé do chão ao teto, raízes que viraram túneis e copas de folhas de cristal. É a única camada que foi viva e nunca foi construída, e o único lugar com cristal em toda parte. Os bichos que ficaram viraram pedra também, e alguns ainda se mexem. O metal daqui é a platina.',
  florestaEntrada: 'Debaixo das duas adegas do Palácio do Sino, na Cidade Afundada, uma raiz-mestra petrificada fura a rocha de cima a baixo. Por dentro dela desce um poço com degraus cortados na própria raiz até uma câmara de pouso de 12 x 6 com duas drusas acesas, onde nenhum monstro nasce. Volta-se subindo os mesmos degraus.',
  florestaSom: 'Um vento grave e oco, como ar passando por troncos, e um eco longo e frio. Cristal tilintando em notas soltas (mais na Mata), pedra estalando, casca rangendo, gotas caindo. No Bosque, pedrinhas escorrendo; nas Raízes, gotas de seiva e um gemido grave de madeira; na Clareira, cascos ao longe, que somem quando o Cervo morre.',
  florestaLuz: 'Nenhuma chama própria: a luz vem do cristal, fria e verde-azulada na folhagem e nos geodos, branca-azulada nas drusas, verde-limão na seiva. A folhagem de cristal é sólida para andar, mas a luz passa por ela, e as copas acendem quando o herói chega com tocha. A única luz quente é a brasa da fogueira apagada dos anões.',
  florestaGeodo: 'Bolhas de 3 a 5 blocos com casca de granito e miolo de cristal, três vezes mais comuns na Mata de Cristal. Cada miolo solta de 1 a 3 pedras preciosas, sorteadas pela tabela da camada. A folhagem de cristal às vezes solta uma Folha de Cristal.',
  fungo: 'A quinta camada, debaixo da Mina Abandonada, de 744 a 930 m. Antes dos mineiros do cobalto, a colônia de Ferroalto cavou aqui atrás da esporita, um metal verde-azulado que o micélio deixa na rocha, e acordou um fungo que tomou as galerias, os bichos e as pessoas. É a camada viva: a rocha, o chão, a água e a parede da chefe crescem e soltam esporos, e a luz é fria e vem dos próprios cogumelos. O metal daqui é a esporita.',
  fungoEntrada: 'Dois poços lacrados no chão de duas fornalhas da mina: um anel de tijolo de fornalha com a grade arrombada de baixo para cima, um poço forrado de micélio com uma escada da colônia e um cordão de micélio, até uma câmara de pouso de tábua onde nenhum monstro nasce. Volta-se pela mesma escada.',
  fungoSom: 'Ar úmido e abafado, quase sem eco: gotas caindo na água (mais nas Grutas), esporos estourando com um "puf", madeira encharcada cedendo, passos molhados ao longe e, de vez em quando, um suspiro longo e baixo. No Bosque, um chiado leve de esporos; no Coração, um pulso grave.',
  fungoAgua: 'As grutas alagadas, os túneis meio alagados e a Gruta da Mãe têm água parada (a água do jogo, igual em todas as camadas). Dá para nadar; debaixo da água o fôlego dura 10 segundos e depois a vida cai. Equipamento pesado afunda o herói. As Botas de Seiva andam na água como em terra.',
  maeFases: [
    ['Fase 1.', 'Só os bulbos que abrem na parede levam dano, 3 de cada vez. Um braço de micélio brilha numa linha na sua altura e chicoteia 14 blocos; esporos caem do teto onde os círculos marcam; um bulbo solta brotos a cada 20 s.'],
    ['Fase 2 (60%).', 'O chão vira micélio vivo (deixa lento) e a água sobe 5 linhas e apodrece (machuca). Raízes rompem a lama, ela puxa o ar e arrasta você para perto (o cordão segura), e o braço vem duas vezes.'],
    ['Fase 3 (30%).', 'A gruta escurece, a água chega a 8 linhas (o fôlego conta), os chapéus tremem e afundam até sobrarem dois, o peito dela abre como último ponto fraco e vêm as mariposas.']
  ],
  maeOnde: 'A Gruta da Mãe, uma gruta alagada de 64 x 28 blocos no Coração do Micélio, do outro lado do mundo em relação às descidas. A parede do fundo é ela: uma massa de fungo com o corpo da primeira colona preso no meio. Só os bulbos que abrem na parede levam dano. A água sobe a cada fase. Ao entrar, muralhas de micélio fecham as saídas; sair da gruta ou morrer recomeça a luta. Fica salvo que ela morreu.',
  minaSom: 'Escoras de madeira rangendo, picaretas ao longe, pedrinhas, gotas e, bem longe, um carrinho guinchando nos trilhos. Nas Fornalhas Esquecidas, o ronco e os estalos do fogo e o fole.',
  cavernas: 'O mundo antigo de cavernas (Cavernas Rasas e Profundas) continua no código, mas está desligado. As cavernas de hoje são outras (js/52 a 57).'
};
