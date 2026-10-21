'use strict';

/* Textos escritos à mão para a wiki: o que o código do jogo não diz em palavras.
   Os números (vida, dano, chances, preços, receitas...) NÃO ficam aqui: a wiki lê direto dos arquivos do jogo.
   Se um monstro, morador ou faixa nova entrar no jogo, acrescente a descrição dele aqui. */
/* As profundidades das camadas, em metros abaixo do chão do vilarejo, tiradas do jogo: o topo de cada camada (o X_TOP do
   arquivo api dela; as Cavernas começam no 0 e a Catedral no CAVE_D), as faixas (X_BANDS) e a altura (LAYER_D, 129).
   Os geradores desenham em 186 metros e esticam LAYER_K vezes (01-base); os números que só existem no desenho (os veios
   de minério, o lugar das salas dos chefes) entram aqui em metros do desenho e saem esticados do mesmo jeito. */
const UDW_PROF = (() => {
  const K = typeof LAYER_K !== 'undefined' ? LAYER_K : 1, D = typeof LAYER_D !== 'undefined' ? LAYER_D : 186, DES = typeof LAYER_DESIGN !== 'undefined' ? LAYER_DESIGN : 186;
  const PRE = { cavernas: 'CV', catedral: 'CB', gelo: 'IC', mina: 'MN', fungo: 'FG', cidade: 'CD', floresta: 'FP', anoes: 'AN', brejo: 'BJ', elfos: 'EL', mar: 'MS', dragao: 'DG', titas: 'TT', necropole: 'NC', antigos: 'AT', prisao: 'PD', guerra: 'GU', abismo: 'AB', acendedores: 'AC', escuro: 'ES' };
  const g = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const pos = id => typeof LAYERS !== 'undefined' ? Math.max(0, LAYERS.findIndex(L => L.id === id)) : 0;
  const top = id => { const v = g(PRE[id] + '_TOP'); return typeof v === 'number' ? v : id === 'cavernas' ? 0 : pos(id) * D; };
  const alt = id => { const v = g(PRE[id] + '_D'); return typeof v === 'number' ? v : id === 'cavernas' && typeof CAVE_D !== 'undefined' ? CAVE_D : D; };
  const fim = id => top(id) + alt(id);
  const bands = id => { const v = g(PRE[id] + '_BANDS'); return Array.isArray(v) ? v : [0, 46, 98, 150, 186].map(x => Math.round(x * D / DES)); };
  const m = (id, d) => top(id) + Math.round(d * alt(id) / DES);   // um metro do desenho de 186 m, na camada de verdade
  // os andares da Catedral (45: FLOORS): [primeiro andar abaixo do topo da faixa, distância entre andares, linhas que sobram embaixo]
  const CB_ANDARES = [[21, 18, 3], [26, 28, 2], [18, 16, 4], [13, 15, 14]];
  const andares = b => { const B = bands('catedral'), t = top('catedral'), [off, step, tail] = CB_ANDARES[b], f0 = B[b] + off, n = Math.max(1, Math.floor((B[b + 1] - tail - f0) / step) + 1);
    return n === 1 ? `1 (a ${t + f0} m)` : `${n} (de ${t + f0} a ${t + f0 + (n - 1) * step} m)`; };
  // as 4 faixas de uma camada, com de e ate em metros
  const faixas = (id, L) => { const t = top(id), B = bands(id); return L.map((f, b) => Object.assign({ zona: f.zona, nome: f.nome, de: t + B[b], ate: t + B[b + 1] }, id === 'catedral' ? { andares: andares(b) } : {}, f)); };
  // os minérios de uma camada: [item, de, até] em metros do desenho -> metros de verdade
  const minerios = (id, L) => L.map(([it, a, b]) => [it, m(id, a), m(id, b)]);
  const faixaTxt = id => `de ${top(id)} a ${fim(id)} m`;
  // "A camada 6 de 20, debaixo das Minas Fúngicas e em cima da Cidade Afundada, de 2790 a 3348 m (monstros dos níveis 26 a 29, chefe no 30)"
  const de = n => n.replace(/^As /, 'das ').replace(/^Os /, 'dos ').replace(/^A /, 'da ').replace(/^O /, 'do ');
  const lugar = id => { if (typeof LAYERS === 'undefined') return faixaTxt(id); const k = pos(id), n = k + 1, a = LAYERS[k - 1], b = LAYERS[k + 1];
    return `A camada ${n} de ${LAYERS.length}, ${a ? 'debaixo ' + de(a.nome) : 'debaixo do vilarejo'}${b ? ' e em cima ' + de(b.nome) : ''}, ${faixaTxt(id)} (monstros dos níveis ${5 * n - 4} a ${5 * n - 1}, chefe no ${5 * n})`; };
  return { K, D, top, fim, bands, m, faixas, minerios, faixaTxt, lugar, de };
})();

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
    custodio: 'O guarda de placas de pedra com a alabarda de ferro estelar, do tamanho do herói. Anda em passos exatos de 1 bloco, com um clique e meio segundo parado entre um e outro. Ergue a alabarda e 3 quadrados vermelhos acendem no chão à frente, um por um (0,75 s); a alabarda cai e acerta quem estiver em qualquer um deles.',
    olhovigia: 'O olho de vidro num anel de pedra com quatro aletas. Voa só em linha reta, na horizontal ou na vertical, e vira em ângulo reto. Uma linha fina vermelha liga o olho ao herói (0,8 s) e trava no fim; o raio branco sai por ela até bater na pedra. O escudo de frente segura.',
    agrimensor: 'O teodolito de três pernas com o prumo pendurado. Fica a uns 7 blocos e se crava no chão; duas linhas de medida saem dele e se cruzam onde o herói está (1 s, travam no fim) e um tiro em parábola perfeita cai no cruzamento e estoura.',
    tesselas: 'Dezenas de ladrilhos triangulares voando em formação: em linha quando viajam, em espiral em volta do herói. Um anel acende em volta dele, segue um pouco, trava vermelho e fecha; quem saiu do anel a tempo escapa, e o escudo não segura. Cada golpe derruba tesselas e o anel fica menor e mais fraco.',
    ponteiro: 'Uma barra de ferro estelar de 3 blocos com um eixo em cada ponta, que anda girando meia volta em volta de uma ponta, como um compasso andando. Um arco vermelho fino marca o giro na parede (0,7 s) e vem a varredura rápida em volta da ponta mais perto do herói.',
    cuboerrante: 'Um cubo de pedra lisa de 2 x 2 com um glifo no meio, que anda tombando sobre as arestas; vence degrau de até 2 num tombo e sobe parede tombando, devagar. O canal das arestas acende vermelho e ele se inclina para o herói (0,75 s); depois tomba em cima dele. O Arquiteto chama dois deles na luta.',
    embolo: 'Um pistão que mora dentro da laje das ruas e corredores; da parede só se vê o glifo da ponta. O glifo acende e uma fileira de pontos vermelhos marca o caminho (0,8 s); o pistão atravessa o corredor e empurra o herói. Só leva golpe com o pistão para fora (2 s); depois recolhe e anda por dentro da laje até outro ponto.',
    astrolabio: 'Um núcleo de ferro estelar com três anéis girando, em órbita lenta e redonda em volta de um ponto que segue o herói. Os anéis param, se alinham e brilham (0,9 s); saem três tiros pelos planos dos anéis.',
    obreiro: 'O construto grande e lento de chapa e laje, com um olho de fresta. Arranca blocos de laje da sala e arremessa (o contorno do bloco pisca, 0,9 s); levanta muros de laje entre ele e o herói (até 6 blocos, que quebram e somem quando ele morre); de perto, pisa e o chão racha em volta (0,85 s).',
    estilhaco: 'Uma lasca de luz que voa reto em diagonal e quica nas paredes como um raio refletido. Para, fica branca e mostra a linha pontilhada do trajeto com um ricochete (0,85 s); depois dispara por ela.',
    ciclope: 'Filho pequeno de um titã, com um olho só. Anda devagar e para para farejar, piscando o olho. Agacha e enfia os dedos no chão (as pedrinhas tremem, 1 s), arranca uma pedra e a rola pelo chão: ela segue o terreno, desce as rampas e para na parede.',
    hecaton: 'Anda de lado com os seis braços abertos. Os braços acendem um a um na ordem em que vão bater (alto, meio, baixo) e ele solta os socos nessa mesma ordem: quem lê a ordem desvia.',
    maoterra: 'A mão de um gigante enterrado: só os dedos aparecem no pó, e ela muda de lugar por baixo da terra devagar. O pó levanta num círculo e os dedos saem (0,8 s); quem fica dentro é agarrado, fica preso no lugar e depois é jogado contra o chão.',
    titanide: 'Flutua um palmo acima do chão, sempre em linha reta. Bate o cajado no chão e uma rachadura brilhante corre até o herói (dá para ver vindo); no fim dela sobe uma fileira de espinhos de osso.',
    erinia: 'Voa sempre para trás do herói e troca de lado quando ele vira. Só ataca pelas costas: o chicote estala uma vez no ar e depois corta. Se o herói vira de frente, ela recua.',
    abutre: 'Plana em círculos altos sem bater asa, com um fêmur nas garras. Grasna, o osso brilha (0,6 s) e ele larga o fêmur, que cai reto. Quando o herói mata alguma coisa, desce para comer e fica no chão até ser atacado.',
    descarna: 'Um tapete de besouros que rói osso esponjoso, pó, cinza e tutano para abrir caminho direto até o herói. Ergue-se numa onda com um chiado subindo, cobre o herói e morde aos poucos; com metade da vida se parte em dois tapetes menores.',
    medula: 'Mora dentro do tutano e do osso esponjoso e anda por dentro dos blocos sem aparecer. O osso racha e solta pó numa linha reta (0,7 s) e um espinho atravessa o bloco por essa linha. Só sai quando o bloco dele é quebrado.',
    catador: 'Anda curvado, juntando ossos do chão. Gira um fêmur acima da cabeça (assobio) e arremessa: o osso vai e volta em arco, e acerta na ida e na volta.',
    hiena: 'Anda em volta do herói rindo e não ataca enquanto ele está parado. Quando o herói golpeia, a risada para e as orelhas abaixam (0,4 s): ela morde no fim do golpe. Se o herói segura o golpe, ela vai embora.',
    tita: 'O chefe do Ossário dos Titãs. Veja as fases abaixo.',
    ttLasca: 'Uma das quatro lascas da foice de Cronos cravadas no Último Titã. Só quebra com golpe de perto, e só a lasca da vez.',
    arquiteto: 'O chefe da Cidade dos Antigos. Veja as fases abaixo.',
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
    arqueiro: 'O arqueiro da mata procura um lugar alto e recua aos pulos quando o herói chega perto. Puxa o arco e solta um leque de 3 flechas que caem com a distância.',
    fatuo: 'Fogos-fátuos azuis em grupos de 3 a 5. Cada um incha e eles disparam um atrás do outro e estouram; quem é pego perde vida e 6 de mana.',
    guardiao: 'O guardião do salão, de escudo de folha: o escudo segura todo golpe pela frente, só passa dano por trás ou de cima. Vira devagar. A ponta da lança brilha antes da estocada; a cada 3 ataques o escudo acende e ele avança empurrando.',
    sapo: 'Fica parado no escuro, só os olhos amarelos brilham. Pula atrás do herói em saltos compridos e, de longe, lança a língua: se pegar, puxa o herói para perto e morde.',
    // O Brejo das Bruxas (js/373-brejo-bichos.js e js/374-brejo-bruxas.js)
    bjsapo: 'Pesado. A garganta incha com o coaxar (0,9 s) e a sombra da queda aparece no chão: ele salta alto em cima de onde o herói estava e a onda de lama corre 3,5 blocos para cada lado (pule por cima).',
    bjsangue: 'Emboscada na água: um risco em V e bolhas na superfície (0,6 s) e ela salta e gruda. Suga a vida e deixa o herói mais lento; dois golpes a arrancam. Só nasce na água.',
    bjenforcado: 'Pendurado no teto: a corda range e os olhos abrem (0,7 s), ele cai em cima e estrangula. Depois anda arrastado e agarra com as mãos subindo (0,5 s).',
    bjturfeiro: 'O morto de mil anos que levanta da turfa (1 s). Lento e forte: a pá raspa o chão com faíscas (0,8 s) e ele varre rente ao chão; quem pula passa por cima.',
    bjcorvo: 'Bando de 4 ou 5. Um de cada vez grasna com o bico aberto e o olho aceso (0,5 s) e mergulha em linha reta onde o herói estava.',
    bjvassoura: 'Voa na vassoura. A gargalhada e o frasco verde acendendo (0,7 s) avisam: ela solta o frasco e fica uma poça de veneno no chão por 4 s.',
    bjmao: 'As chamas dos dedos se inclinam para o herói e crescem (0,8 s): quem estiver olhando para ela, a menos de 8 blocos, fica paralisado 1,2 s. De costas, nada. Também recua e investe.',
    bjinquisidor: 'Corpo a corpo, de escudo: bloqueia de frente. A espada erguida brilha (0,55 s) antes do golpe por cima; com os pés plantados (0,4 s) dá o tranco do escudo. Sobe escadas.',
    bjlavadeira: 'De longe torce a mortalha, a água escorrendo (0,8 s), e joga em arco: quem é pego fica enrolado 1,5 s (não ataca e anda a 55%); bater esquerda e direita solta antes.',
    bjbruxa: 'Ergue o boneco e a linha estica dela até o herói (1 s): três alfinetadas, cada uma com um brilho antes. Sair da vista dela ou acertá-la corta a linha.',
    bjvelha: 'A chefe do Brejo das Bruxas. Veja as fases abaixo.',
    // A Necrópole do Rei Eterno (js/383-necropole-legiao.js e js/384-necropole-corte.js)
    legionario: 'Marcha atrás do escudo de torre, que segura todo golpe de frente. Recua a lança 0,5 s (a ponta acende) e estoca 2 blocos; depois baixa o escudo um instante.',
    cavaleiro: 'Pesado. Ergue o montante 0,9 s (a lâmina acende) e racha o chão: o golpe na frente e uma onda de alma correndo pelo chão (pule). A lâmina fica presa um tempo; abaixo da metade da vida ergue em 0,6 s.',
    arauto: 'Não luta de perto e foge. Ergue a trompa 0,8 s e sopra: o anel de som empurra o herói e manda os mortos em volta para a frente por 6 s.',
    embalsamador: 'De longe joga o pote de unguento em arco (0,6 s com o pote erguido), que gruda o herói 0,7 s. Enfaixa um monte de ossos 1,4 s e o morto levanta com metade da vida.',
    coveiro: 'Anda debaixo da terra (um risco de terra). Para debaixo do herói, a terra estufa 0,7 s e ele sai com a pá para cima; depois briga de pá (ergue 0,45 s).',
    necromante: 'Ergue as mãos 0,9 s: o selo verde segue o herói meio segundo, para e solta espinhos de osso. Apanhando de perto, some numa fumaça verde e reaparece longe (a fumaça aparece antes onde ele vai sair).',
    escriba: 'Escreve 1,2 s e o herói fica marcado 2,2 s; se o escriba ainda o vê no fim, a coluna da sentença se desenha no chão e cai meio segundo depois. Quebrar a linha de visão apaga a marca.',
    ncMortalha: 'Voa rente ao teto, para em cima do herói, treme 0,7 s (a sombra escurece no chão) e cai reta. Se pega, envolve: prende e tira vida aos poucos, e apanha em dobro. Se erra, fica estendida.',
    gaveta: 'Fechada na parede, o golpe não entra. Quando o herói passa, a tampa corre e os olhos acendem (0,6 s), o braço de osso sai 4 blocos e puxa; depois fica aberta, a hora de bater.',
    ncFatuo: 'Bando de 4 a 6 rodando em volta do herói. Um de cada vez acende e treme 0,5 s e dispara reto; se erra, volta para a roda.',
    reiEterno: 'O chefe da Necrópole. Veja as fases abaixo.',
    ncAncora: 'Bloco de mármore com o selo que segura uma das três correntes do Coração-Relicário na luta com o Rei Eterno. Toma qualquer golpe.',
    // A Prisão dos Deuses (js/393-prisao-bichos1.js e js/394-prisao-bichos2.js)
    carcereiro: 'Lento. Ergue a chave, os olhos acendem e a marca vermelha aparece no chão (0,7 s), e bate.',
    elos: 'Bando de 3. Se enrolam, chocalham e as juntas acendem azul (0,45 s), e saltam.',
    aguia: 'Voa em roda; para, grita (0,6 s, a mira trava) e mergulha em linha. Se bate na pedra, fica tonta.',
    condenado: 'De longe gira a bola (0,9 s) e arremessa em arco, depois puxa de volta sem atacar; de perto varre rente ao chão (0,45 s).',
    pedraviva: 'Dorme como pedra caída e leva metade do dano assim. Acorda (0,7 s), anda, puxa o braço com a marca no chão (0,6 s) e soca.',
    cria: 'Vem em dupla. Agacha rosnando (0,4 s) e dá o bote.',
    gigante: 'Preso de joelhos, não sai do lugar. Ergue o punho com a marca no chão (1 s) e soca, com uma onda de 6 blocos para os dois lados; atrás dele, pisa com o joelho (0,7 s).',
    pdSerpe: 'Só a cabeça fora da fenda, presa a 5 blocos da base. Incha (0,6 s) e cospe veneno em arco (a poça fica 3 s); de perto recua (0,45 s) e morde.',
    lamento: 'Um véu violeta translúcido. Inspira (0,8 s) e solta 3 gemidos lentos em leque.',
    acorrentador: 'Fica a 5 blocos. O gancho brilha e a linha tracejada liga a mão ao herói (0,6 s): o gancho voa, puxa o herói e a clava desce (0,45 s). O escudo de frente segura o gancho; se erra, fica 0,8 s puxando a corrente de volta.',
    loboatado: 'O chefe da Prisão dos Deuses. Veja as fases abaixo.',
    // O Campo da Última Guerra (js/403-guerra-caidos.js e js/404-guerra-hostes.js)
    gu_cavaleiro: 'Segura os golpes de frente com o escudo. Bate a espada no escudo duas vezes e a lâmina acende: vem o golpe de escudo ou o corte.',
    gu_arqueiro: 'Fica longe. O arco aponta para o alto e 3 marcas vermelhas ficam 0,9 s no chão em volta do herói: a saraivada cai nelas.',
    gu_portaestandarte: 'Quem luta perto dele (6 blocos) bate 30% mais forte; a aura dourada no chão mostra o alcance. A haste sobe por 0,7 s e ele varre na frente.',
    gu_enterrado: 'Dorme debaixo do barro. A lama borbulha 0,7 s debaixo do herói e ele sobe estocando; luta e se enterra de novo.',
    gu_penitente: 'O mangual gira por cima da cabeça e o assobio sobe (0,6 s): avança girando por 1,5 s e depois fica tonto 1,2 s, levando 1,4 vez o dano.',
    gu_serafim: 'Voa alto. A auréola acende e a linha de mira dura 0,7 s (trava nos últimos 0,2 s) e a lança de luz vem por ela.',
    gu_corvos: 'Nasce em bando de 4, voa em roda e mergulha um de cada vez: o corvo para no ar e abre as asas por 0,4 s antes.',
    gu_cerco: 'Ergue a marreta por 1 s e as rachaduras marcam o chão: a marretada e uma onda de choque de 7 blocos pelo chão (pule por cima).',
    gu_clerigo: 'Dá a um aliado um escudo dourado (60% menos dano por 4 s; o brilho mostra quem tem). De perto, o círculo cresce 0,8 s no chão e a consagração explode.',
    gu_lamina: 'Parece uma espada fincada. Treme e brilha 0,6 s e voa reto; crava na parede e fica 2 s presa, levando 1,5 vez o dano. Voando, o golpe só a desvia.',
    general: 'O chefe do Campo da Última Guerra. Veja as fases abaixo.',
    gu_estaca: 'Uma das duas estacas que seguram as cordas do estandarte na luta com o General Caído. Quebradas as duas, a haste pode ser derrubada.',
    gu_haste: 'O pé da haste do estandarte. Só toma dano depois que as duas estacas caem; derrubado, o General perde a proteção.',
    // As Ruínas dos Acendedores (js/413-acendedores-loucos.js e js/414-acendedores-chamas.js)
    turibulo: 'Gira o turíbulo acima da cabeça com rastro de fagulhas (0,6 s) e varre um círculo inteiro em volta. Acende os braseiros frios por onde passa.',
    faroleiro: 'De longe: um fio de luz procura o herói (0,9 s; para de seguir no último terço) e o feixe queima a linha até a pedra.',
    acArauto: 'Apoio. Leva a trompa à boca (0,8 s) e sopra um anel de cinza quente que empurra e queima; os loucos em volta ganham o fervor por 6 s (mais fortes e rápidos).',
    engolidor: 'As bochechas incham e a boca brilha (0,7 s): cospe uma bola de fogo que quica três vezes.',
    alado: 'Voa alto. Marcas brilham no chão (0,8 s) e gotas de cera fervendo caem nelas.',
    fagulhas: 'Um enxame que atravessa pedra. O bolo se aperta num nó branco (0,8 s) e corre em linha reta pelo herói.',
    faminto: 'Parece um braseiro frio. As brasas acendem por baixo da cinza (0,7 s) e ele morde ou salta; acordado, anda pulando nas três pernas.',
    fornoandante: 'Pesado. A porta da barriga abre e clareia (1 s) antes do cone de chamas; ou ergue o pé (0,8 s) e pisa, e uma onda de cinza corre pelo chão dos dois lados (pule).',
    cirio: 'Lento, deixa poças de cera que prendem o passo. A chama cresce (0,8 s) e ele sacode três bolas de cera fervendo.',
    pavio: 'Pendurado num pavio no teto. O laço aceso desce brilhando (0,8 s); quem fica no laço é puxado para cima e queima.',
    ultimoAcendedor: 'O chefe das Ruínas dos Acendedores. Veja as fases abaixo.',
    acLanterna: 'Uma das quatro lanternas de bronze da Fornalha do Mundo. Acesa, protege o Último Acendedor; um golpe corta a corrente e ela cai.',
    // O Reino Élfico depois do revamp de 2026-10-21 (js/253-elfos-bichos.js e js/254-elfos-bichos2.js)
    fronteira: 'Corpo a corpo: pose de golpe (0,5 s) e corte duplo, e recua num salto. Às vezes salta por cima do herói em arco e corta pelas costas ao pousar.',
    caofada: 'Anda invisível. Se revela com três latidos e anéis no ar (0,8 s), dá o bote e some de novo.',
    silfide: 'Voa de ponto em ponto no ar, junta o vento (0,65 s) e solta uma rajada que empurra. Foge quando apanha ou quando o herói chega perto.',
    carpideira: 'Voa e atravessa a rocha. O lamento (1 s, a boca abre e o ar treme) solta um anel que machuca e empurra para longe.',
    mascarada: 'Três rosas negras giram em volta dela. Carrega (0,8 s) e solta pétalas que perseguem; some e deixa no lugar uma cópia de máscara inofensiva.',
    musa: 'Canta (0,9 s, o fio de luz cresce até o herói) e prende o fio por até 3 s: tira vida aos poucos, cura a si e deixa o herói enlevado (lento, sem conjurar). O fio quebra se o herói se afasta 9 blocos, se a rocha corta a linha ou se ela apanha.',
    cavespinho: 'Pesado. Ergue a arma (0,7 s) e dá a pancada de alcance longo; finca o pé (0,5 s) e a roseira racha o chão até o herói e prende os pés dele.',
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
  principeOnde: `O Trono do Caos, um salão de 56 x 20 blocos no fundo do Abismo (cerca de ${UDW_PROF.m('abismo', 182)} m), do outro lado do mundo em relação às fendas, com um trono de ferro negro e osso cravejado de cristais do caos, braseiros e correntes. Ao entrar, grades do caos fecham todas as saídas; sair da sala ou morrer recomeça a luta. Fica salvo que ele morreu. Solta o Coração do Caos, acessório lendário.`,
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
  cervoOnde: `A Clareira dos Troncos Gigantes, 120 x 24 blocos no fundo da Clareira dos Gigantes (cerca de ${UDW_PROF.fim('floresta') - 8} m), do outro lado do mundo em relação às entradas. Sete troncos gigantes de 4 blocos vão do chão ao teto, cada um em pé sobre as raízes, com um arco de 3 blocos embaixo por onde o herói passa (o Cervo não cabe). No meio, uma fenda de 10 blocos com espinhos de cristal no fundo e duas raízes para pular: cair nela tira 12% da vida e devolve à borda, mas nunca mata. Ao entrar, a Muralha de Raízes fecha as duas pontas. Os troncos que ele derruba viram rampas; sair, usar o portal ou morrer recomeça a luta, e a clareira volta como era, com os troncos de pé. Quando ele morre, os troncos que ainda estão em pé caem e ficam assim. Fica salvo que ele morreu. Solta a Galhada do Cervo de Pedra, elmo lendário, e metade das vezes uma das três bases da camada.`,
  rgOnde: `A Oficina da Escavadeira, um salão de 48 x 16 blocos nas Fornalhas Esquecidas (cerca de ${UDW_PROF.m('mina', 180)} m), do outro lado do mundo em relação aos poços de descida, com um trono feito de vagonete, montes de saque e fornalhas. Ao entrar, grades de ferro fecham as saídas. Fica salvo que o rei morreu.`,
  // fases do Yeti Ancestral (docs/biomas.md, parte 4, seção 7, e js/74-yeti-ancestral.js)
  yetiFases: [
    ['Fase 1', 'Soco duplo no chão (levanta os punhos antes) com ondas de choque para os dois lados: pule por cima. De longe arranca um bloco de gelo e arremessa; o bloco se quebra em 3 lascas.'],
    ['Fase 2', 'Abaixo de 60% da vida, ruge: caem sincelos do teto onde as sombras marcam o chão (um em cima do herói) e chegam 2 Lobos da Geada.'],
    ['Fase 3', 'Abaixo de 25%, mais rápido: se agacha e dá um carrinho de barriga de parede a parede (se bater na parede fica tonto, a hora de bater), e sopra um bafo de geada em cone que deixa o herói lento.']
  ],
  yetiOnde: `O Trono de Gelo, um salão de 40 x 16 blocos no Coração do Inverno (cerca de ${UDW_PROF.m('gelo', 178)} m), do outro lado do mundo em relação às descidas, com o trono esculpido no gelo, drusas e sincelos. Ao entrar, paredes de gelo que não dá para cavar fecham as saídas; sair da sala recomeça a luta. Golpes não interrompem os ataques dele. Fica salvo que ele morreu.`,
  // fases da Mãe-Teia (docs/biomas.md, parte 2, seção 7, e js/57-mae-teia.js)
  teiaFases: [
    ['Fase 1', 'No chão: mordida de perto e um leque de 3 bolas de teia que prendem o herói.'],
    ['Fase 2', 'Abaixo de 60% da vida, sobe pelo fio e fica pendurada sobre o herói; uma sombra no chão mostra onde ela vai cair. Os ovos da sala chocam filhotes.'],
    ['Fase 3', 'Abaixo de 25%, fica mais rápida, cospe 5 bolas e salta de uma parede à outra cuspindo do alto.']
  ],
  teiaOnde: `A Câmara do Ninho, uma sala redonda de 34 x 14 blocos no fundo do Ninho (cerca de ${UDW_PROF.m('cavernas', 158)} m), do outro lado do mundo em relação ao vilarejo, com ovos, casulos e lençóis de teia. Ao entrar, cortinas de teia fecham as saídas; sair da sala recomeça a luta. Fica salvo que ela morreu.`,
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
  faixas: UDW_PROF.faixas('catedral', [
    { zona: 5, nome: 'Átrio Soterrado', salas: 'vestíbulo, sala', carater: 'terra virando calcário, escadaria quebrada, raízes, vestíbulos' },
    { zona: 6, nome: 'Nave da Catedral', salas: 'nave, principal (com altar e órgão), capela', carater: 'salões altos com colunas, bancos, vitrais, órgão' },
    { zona: 7, nome: 'Claustro Profanado', salas: 'capela, claustro, sala, biblioteca', carater: 'capelas, corredores com arcadas, biblioteca, afrescos' },
    { zona: 8, nome: 'Criptas', salas: 'cripta, ossário, túmulos', carater: 'corredores baixos, ossários, túmulos' }
  ]),
  minerios: (() => { const t = UDW_PROF.top('catedral'), b = UDW_PROF.fim('catedral'); return [['carvao', t + 6, b - 2], ['min_ferro', t + 6, b - 2]]; })(),
  // faixas das cavernas (js/52-caverna-api.js: CV_BANDS; js/56-caverna-mundo.js) e os minérios delas (56: vein)
  cvFaixas: UDW_PROF.faixas('cavernas', [
    { zona: 9, nome: 'Grutas Rasas', salas: 'grutas e túneis', carater: 'terra úmida e argila, raízes pendentes, cogumelos, pinturas rupestres e fósseis' },
    { zona: 10, nome: 'Galerias de Pedra', salas: 'galerias altas, poços', carater: 'rocha, calcita, cortinas de calcita, drusas e veios de cristal' },
    { zona: 11, nome: 'O Ninho', salas: 'câmaras redondas forradas de teia, a Câmara do Ninho', carater: 'xisto escuro, teia em tudo, casulos, ovos e ossos das presas' },
    { zona: 12, nome: 'Fundações Soterradas', salas: 'grutas de saída com escadarias para o átrio', carater: 'rocha virando calcário, pedra lavrada caída, arcos enterrados: a catedral começando' }
  ]),
  cvMinerios: UDW_PROF.minerios('cavernas', [['carvao', 6, 186], ['min_cobre', 6, 186]]),
  // faixas do gelo (js/69-gelo-api.js: IC_BANDS; js/73-gelo-mundo.js) e os minérios delas (73: vein)
  icFaixas: UDW_PROF.faixas('gelo', [
    { zona: 13, nome: 'Fendas Geladas', salas: 'fendas altas e estreitas, grutas baixas, as duas grutas no pé das descidas', carater: 'o calcário das criptas coberto de geada virando permafrost, tumbas e estátuas da catedral caídas e congeladas, raízes congeladas' },
    { zona: 14, nome: 'Salões de Gelo Azul', salas: 'salões enormes de teto alto', carater: 'gelo azul que brilha fraco, lagos congelados, colunas de gelo, cachoeiras paradas, sincelos em cacho' },
    { zona: 15, nome: 'Covis dos Yetis', salas: 'tocas ligadas por túneis largos', carater: 'permafrost e neve batida, neve no chão, ossadas e presas de mamute, fogueiras apagadas, marcas de garra e pinturas dos yetis' },
    { zona: 16, nome: 'Coração do Inverno', salas: 'grutas de gelo negro, o Trono de Gelo', carater: 'gelo negro antigo com veios azuis que brilham, cristais, gigantes e feras presos no gelo, altares de gelo' }
  ]),
  icMinerios: UDW_PROF.minerios('gelo', [['carvao', 0, 186], ['min_ouro', 0, 186]]),
  // faixas da mina (js/79-mina-api.js: MN_BANDS; js/84-mina-mundo.js) e os minérios delas (84: vein)
  mnFaixas: UDW_PROF.faixas('mina', [
    { zona: 17, nome: 'Galerias Escoradas', salas: 'galerias retas escoradas em níveis fixos, os pés dos dois poços de descida', carater: 'rocha ferrosa listrada de preto e vermelho, escoras e vigas, trilhos com vagonetes, lampiões, ferramentas largadas' },
    { zona: 18, nome: 'Poços e Andaimes', salas: 'poços fundos com escadas e andaimes, galerias de lavra', carater: 'rejeito, guinchos, polias com balde, elevadores, beliches podres, veios de cobalto no quartzito' },
    { zona: 19, nome: 'Acampamento Goblin', salas: 'salões do acampamento com piso de tábua', carater: 'entulho, tendas, fogueiras, jaulas, estandartes, pinturas e o saque dos goblins, estacas com caveira' },
    { zona: 20, nome: 'Fornalhas Esquecidas', salas: 'salões das fornalhas, a Oficina da Escavadeira', carater: 'tijolo de fornalha e escória, fornalhas que ainda brilham, cadinhos, bigornas, engrenagens quebradas, brasas' }
  ]),
  mnMinerios: UDW_PROF.minerios('mina', [['carvao', 0, 186], ['min_cobalto', 0, 186], ['min_cristal', 0, 186]]),
  // faixas das Minas Fúngicas (js/120-fungo-api.js: FG_BANDS; js/125-fungo-mundo.js) e os minérios delas (125: vein)
  fgFaixas: UDW_PROF.faixas('fungo', [
    { zona: 25, nome: 'Galerias Tomadas', salas: 'galerias tortas da colônia de Ferroalto, casas de tijolo, a enfermaria lacrada, as câmaras de pouso no pé das duas descidas', carater: 'xisto úmido e rocha tomada pelo micélio, escoras tomadas, tábuas podres, fios pendentes, os últimos lampiões da colônia' },
    { zona: 26, nome: 'Bosque de Chapéus', salas: 'salões enormes com cogumelos gigantes em escada', carater: 'húmus de esporo, troncos e chapéus de cogumelo que servem de plataforma, cogumelos-lanterna, cachos de esporos, luz ciano' },
    { zona: 27, nome: 'Grutas Alagadas', salas: 'grutas largas com bacias de água parada e passarelas de tábua, túneis meio alagados', carater: 'lodo e xisto, ilhas de lodo, juncos de micélio na beira da água, gotejos de seiva' },
    { zona: 28, nome: 'Coração do Micélio', salas: 'câmaras redondas de carne ligadas por veias, a Gruta da Mãe, as duas raízes-mestras que descem para a Cidade Afundada', carater: 'carne de micélio pulsando, bolsas de esporo nas paredes, cordões de micélio, ossadas tomadas' }
  ]),
  fgMinerios: UDW_PROF.minerios('fungo', [['carvao', 0, 150], ['min_esporita', 0, 186]]),
  // faixas da Cidade Afundada (js/130-cidade-api.js: CD_BANDS; js/136-cidade-mundo.js) e os minérios dela (136: vein)
  cdFaixas: UDW_PROF.faixas('cidade', [
    { zona: 29, nome: 'Cisternas Altas', salas: 'salões de cisterna com colunas e água negra, esgotos abobadados com canal, um aqueduto de arcos, as casas do guarda da cisterna no pé das duas raízes-mestras', carater: 'pedra com limo e aterro, colunas da cisterna, correntes, alga negra, goteiras, barcos de fundo chato, ossos com lodo, os primeiros afogados' },
    { zona: 30, nome: 'Ruas Tortas', salas: 'ruas em ladeira de degraus, casas tortas de 2 e 3 andares, becos verticais, acampamentos dos saqueadores', carater: 'aterro, cantaria e tijolo, calçamento, telhados de ardósia que viram caminho, fachadas, lanternas, carroças tombadas, barricadas, fogueiras' },
    { zona: 31, nome: 'Bairro do Poço', salas: 'o templo do Poço, as casas do culto, o Grande Poço no centro', carater: 'cantaria e pedra do Poço, velas em fila, sininhos, oferendas, bancos do templo, estátuas sem rosto, procissões' },
    { zona: 32, nome: 'Palácio do Sino', salas: 'salões de mármore, adegas (duas são as descidas para a Floresta Petrificada), a Torre do Sino', carater: 'mármore rachado e aterro, lustres caídos, fonte seca, carruagem afundada, vitrais rachados, retratos do rei com o rosto raspado' }
  ]),
  cdMinerios: UDW_PROF.minerios('cidade', [['carvao', 0, 180], ['min_prata', 0, 186]]),
  // faixas da Floresta Petrificada (js/140-floresta-api.js: FP_BANDS; js/145-floresta-mundo.js) e os minérios dela (145: vein)
  fpFaixas: UDW_PROF.faixas('floresta', [
    { zona: 33, nome: 'Bosque Soterrado', salas: 'grutas de terra baixas e compridas presas entre troncos deitados, as câmaras de pouso no pé das duas raízes-mestras', carater: 'solo petrificado e casca de pedra, troncos deitados que viram rampa, cortinas de raízes, samambaias e pinhas de pedra, um javali que virou pedra' },
    { zona: 34, nome: 'Mata de Cristal', salas: 'clareiras ocas com troncos do chão ao teto e andares de folhagem de cristal a 6 e 12 blocos do chão, ligados por cipós de pedra', carater: 'granito verde, folhagem de cristal, três vezes mais geodos, copas e pingentes de cristal acesos, cervos, lobos e corujas de pedra' },
    { zona: 35, nome: 'Raízes Profundas', salas: 'redes de raiz que servem de chão, raízes ocas de até 60 blocos por dentro da rocha', carater: 'raiz de pedra e bolsões de seiva vítrea, estalactites de seiva, veios de seiva brilhando na parede, portas de raiz para lugar nenhum' },
    { zona: 36, nome: 'Clareira dos Gigantes', salas: 'salões de troncos gigantes de 4 a 6 blocos, a Clareira dos Troncos Gigantes, o acampamento anão e as duas escadarias dos anões que descem para a Fortaleza dos Anões', carater: 'granito verde e cerne de pedra, cascalho de cristal, círculo de pedras, picaretas de bronze, marcos anões com runa, a galhada fóssil na parede' }
  ]),
  fpMinerios: UDW_PROF.minerios('floresta', [['carvao', 0, 150], ['min_platina', 0, 186]]),
  // faixas da Fortaleza dos Anões (js/180-anoes-api.js: AN_BANDS; js/185-anoes-mundo.js) e os minérios dela (185: vein)
  anFaixas: UDW_PROF.faixas('anoes', [
    { zona: 37, nome: 'Portões de Bronze', salas: 'muralhas internas com seteiras, guaritas, as duas escadarias do clã que descem da Floresta Petrificada com a sala da guarita no pé', carater: 'granito anão e cantaria, portões de bronze arrombados de baixo, lâmpadas de runa, estátuas de guerreiro, estandartes do clã' },
    { zona: 38, nome: 'Salões do Clã', salas: 'salões com colunata, refeitórios com a mesa ainda posta, fileiras de dormitórios, túmulos com sarcófago e estátua de rei', carater: 'laje gravada e relevo com a marca do clã, lustres de bronze, barris, bancos, beliches de pedra, colunas caídas' },
    { zona: 39, nome: 'Canais de Lava', salas: 'salas de canal com a lava correndo debaixo de grades de bronze, salas de máquinas com passarela e engrenagens, as eclusas com comporta e alavanca', carater: 'pedra de canal e bronze, lava em linha reta, respiros de vapor, guindastes, roldanas, engrenagens gigantes, bombas' },
    { zona: 40, nome: 'Forjas de Runas', salas: 'forjas com fornalha, bigorna de runas e canal curto, a Oficina do Mestre, a Grande Forja e as duas brechas para baixo', carater: 'tijolo refratário e bronze, braseiros, faíscas, fuligem, cera seca e cascas de quitina perto das brechas' }
  ]),
  anMinerios: UDW_PROF.minerios('anoes', [['carvao', 0, 184], ['min_mithril', 0, 184]]),
  // faixas do Reino Élfico (js/250-elfos-api.js: EL_BANDS; js/255-elfos-mundo.js) e os minérios dele (255: vein)
  elFaixas: UDW_PROF.faixas('elfos', [
    { zona: 53, nome: 'A Mata de Prata', salas: 'os dois poços de raízes que descem das salas de descida da Fortaleza dos Anões, com a Escada de Corda até o Posto de Guarda (12 x 6, tábua e madeira prateada, duas lanternas, sem monstros), clareiras com árvores de prata do chão ao teto, copa de folhagem lunar e flets de tábua com escada de corda, grotas de folha', carater: 'solo élfico com fios de prata, bolsões de mármore-lua, folhas de prata caindo, vaga-lumes, lanternas élficas, flores-da-lua e samambaias' },
    { zona: 54, nome: 'Os Salões do Rei', salas: 'salões lavrados com abóbada e colunas de raiz a cada 8 blocos, abismos com uma ponte de tábua sem corrimão, galerias retas e escadarias', carater: 'mármore-lua e pedra lavrada com relevos de folha, flâmulas de prata e azul, braseiros lunares, pedras rúnicas, poeira de luar' },
    { zona: 55, nome: 'A Corte dos Espinhos', salas: 'salões em ruína tomados pela roseira-brava, a mesa do banquete sem fim, anéis de cogumelos das fadas, galerias', carater: 'mármore enredado e lenho de espinheiro, panos cor de ameixa, rosas negras, máscaras da Corte penduradas, pedras-videntes com a luz verde-pálida das fadas, pétalas escuras e esporos no ar' },
    { zona: 56, nome: 'As Grutas da Lua', salas: 'grutas da lua redondas, muitas com uma bacia de luar no fundo, o Espelho da Lua (a sala da Dama) e as duas descidas para o Mar Sem Sol', carater: 'pedra-do-poço com runas acesas, raiz-mãe com seiva azul, cachos de cristal lunar, cogumelos-de-luar, faíscas azuis subindo' }
  ]),
  elMinerios: UDW_PROF.minerios('elfos', [['carvao', 0, 150], ['min_lunarita', 46, 186]]),
  // faixas do Covil do Dragão (js/270-dragao-api.js: DG_BANDS; js/275-dragao-mundo.js) e os minérios dele (275: vein)
  dgFaixas: UDW_PROF.faixas('dragao', [
    { zona: 61, nome: 'Chaminés de Vapor', salas: 'as duas chaminés de entrada (4 de largura, com a escada de cravos kobold descendo uns 30 blocos até a câmara de pouso: uma gruta de tufo de 14 x 6 com 2 velas de sebo e uma bica de vapor apagada, sem monstros num raio de 20 blocos), chaminés verticais de 4 a 7 por 20 a 40 com escada inteira e grutas de vapor de 14 a 24 x 7 a 11', carater: 'tufo vulcânico bege-ocre com lascas de andesito, bicas de vapor, fumarolas, olivina verde, gêiseres de pedra, bacias de água fervendo, crostas de sal e crânios de peixe caídos do mar de cima' },
    { zona: 62, nome: 'Túneis Kobold', salas: 'galerias kobold retas de 30 a 70 por 3 a 4 com fios de armadilha, tocas de 8 a 14 x 5 a 7 com andaime de ossos e fogueira, e santuários ao dragão de 16 x 9 com a estátua de barro e oferendas de ouro solto', carater: 'andesito com bolsões de pomes e paredes de taipa kobold, totens de crânio de draco, velas de sebo, cestos de moedas roubadas, varais de escamas, tambores, pilhas de lanças, jaulas de vime, poeira de pomes caindo' },
    { zona: 63, nome: 'Tubos de Lava', salas: 'tubos de lava redondos e compridos (40 a 110 x 5 a 8), um em cada três com um canal de magma de 2 no fundo e o andaime de ossos por cima, e ninhos de draco de 12 a 18 x 6 a 9', carater: 'lava cordada cinza-chumbo e obsidiana rajada cor de mogno, estalactites e colunas de lava, ovos de draco pulsando laranja, cascas de serpe, bolhas de lava partidas, gotas de lava caindo' },
    { zona: 64, nome: 'Leito de Ouro', salas: 'câmaras do tesouro de 20 a 36 x 10 a 16 com montes baixos de ouro solto, as duas descidas dos Tubos Frios (5 de largura) para a camada de baixo e, do outro lado do mundo, a Cratera do Tesouro de Cinzarel', carater: 'obsidiana rajada com veios de osso de dragão, ouro solto que desliza, crânios e costelas de dragões antigos, taças e coroas, armaduras derretidas no ouro, fagulhas douradas e névoa de calor' }
  ]),
  dgMinerios: UDW_PROF.minerios('dragao', [['carvao', 0, 186], ['min_draconio', 98, 186]]),
  // faixas do Ossário dos Titãs (js/280-titas-api.js: TT_BANDS; js/285-titas-mundo.js) e os minérios dele (285: vein)
  ttFaixas: UDW_PROF.faixas('titas', [
    { zona: 65, nome: 'Campo das Costelas', salas: 'os dois crânios de entrada (a escada desce por dentro e sai pela órbita, câmara de pouso de 16 x 6 com duas lamparinas de tutano, sem monstros), caixas torácicas como salões em arco, acampamentos dos catadores', carater: 'cinza assentada, rocha fóssil e osso de titã, chão de pó de osso, a cinza do vulcão ainda cobrindo os primeiros ossos' },
    { zona: 66, nome: 'A Espinha', salas: 'desfiladeiros fundos cruzados por espinhas: as vértebras viram ponte e os discos de cartilagem viram degrau, com escada de ossos amarrados nas duas cabeceiras', carater: 'rocha fóssil, osso de titã e cartilagem seca, tendões pendurados, pó levantado pelo vento de lado' },
    { zona: 67, nome: 'Vale dos Crânios', salas: 'crânios como cavernas (as órbitas são janelas e os dentes são colunas), elmos de bronze tombados, mãos de pedra saindo do chão', carater: 'osso de titã, esmalte de dente e bronze titânico verde de azinhavre' },
    { zona: 68, nome: 'Leito do Último', salas: 'grutas de osso esponjoso, as duas Fendas Retas que descem para a Cidade dos Antigos e o Leito do Titã (a sala do Último Titã) do outro lado do mundo', carater: 'osso poroso e quente, rocha fóssil e bronze, lascas da foice cravadas brilhando frio, a lâmina da foice na parede do Leito' }
  ]),
  ttMinerios: UDW_PROF.minerios('titas', [['carvao', 0, 186], ['min_adamantita', 0, 186]]),
  // faixas da Cidade dos Antigos (js/290-antigos-api.js: AT_BANDS; js/295-antigos-mundo.js) e os minérios dela (295: vein)
  atFaixas: UDW_PROF.faixas('antigos', [
    { zona: 69, nome: 'As Escadarias', salas: 'os dois Poços dos Antigos (4 de largura, com a escada embutida) que descem da camada de cima até a câmara de pouso (10 x 6, laje, duas lâmpadas de glifo, sem monstros), terraços enormes em degraus de 3 (a cada dois, um degrau de 6 com a escada embutida) e câmaras quadradas de 12 x 12', carater: 'pedra lisa sem emenda e laje dos Antigos, a faixa de glifo acesa atrás de cada sala, obeliscos de medida, estátuas de Antigo, murais de glifos, janelas para lugar nenhum, poeira de estrela subindo reta' },
    { zona: 70, nome: 'A Cidade Inversa', salas: 'quarteirões com prédios de laje no chão e o mesmo prédio pendurado no teto, de cabeça para baixo, ligados por ruas retas e escadarias; as Salas de Prumo (14 x 14, a porta no pé de uma parede do lado), onde golpear o Prumo vira a sala inteira', carater: 'laje e pedra lisa, esferas armilares, pranchetas com a planta gravada, escadas que sobem para o nada, relevos de órbitas, mapas estelares, lustres de anéis concêntricos' },
    { zona: 71, nome: 'As Máquinas', salas: 'salões de máquinas com passarelas de chapa em andares (com vãos de 3 para cair), salas de serviço, poços de pistão com a escada embutida', carater: 'chapa antiga, laje e blocos de engrenagem, condutos de luz no teto com um pulso ciano a cada 2 s, máquinas de engrenagens, pistões e engrenagens de parede gigantes, bobinas de luz; as rachaduras da estrela entram por baixo' },
    { zona: 72, nome: 'A Cratera da Estrela', salas: 'crateras de vidro em tigela, bolsões de rocha fria, a Sala que se Monta (a sala do Arquiteto) do outro lado do mundo, com antessalas de vidro, e as duas Escadas que Afundam para a camada de baixo', carater: 'vidro de cratera preto com reflexo verde, rocha fundida com veios brancos, lascas da estrela, meteoritos cravados, estalactites de vidro, o clarão branco da estrela no fundo' }
  ]),
  atMinerios: UDW_PROF.minerios('antigos', [['carvao', 0, 186], ['min_ferro_estelar', 104, 186]]),
  // faixas do Mar Sem Sol (js/260-mar-api.js: MS_BANDS; js/265-mar-mundo.js) e os minérios dele (265: vein)
  msFaixas: UDW_PROF.faixas('mar', [
    { zona: 57, nome: 'Praias Negras', salas: 'o vão de ar em cima do mar, as duas Câmaras de Pouso debaixo das raízes do Reino, ilhas de basalto com praia de areia negra e túnel seco por dentro, navios encalhados, cascos boiando de quilha para cima com ar dentro, palafitas da gente-peixe com farol', carater: 'areia negra, rocha com cracas, tábua de navio e cordame, botes, âncoras, canhões, mastros quebrados, figuras de proa, redes secando, braseiros de óleo de peixe, plâncton brilhando na água' },
    { zona: 58, nome: 'Floresta de Algas', salas: 'o fundo do mar em patamares, recifes, florestas de algas altas, cascos afundados com bolsões de ar, as grotas', carater: 'recife e coral, algas que balançam, anêmonas, corais-cérebro e corais-leque, conchas gigantes, ânforas, estrelas-do-mar, vigias de navio acesas' },
    { zona: 59, nome: 'A Fossa', salas: 'as duas fendas que descem do fundo do mar, com um templo da gente-peixe no pé de cada uma (a porta debaixo da água, um domo de ar em cima e o túnel de trás para as Chaminés), sifões curtos nos túneis secos', carater: 'lodo e rocha, esqueletos de baleia, crânios de leviatãs antigos, a estátua do deus-peixe e os murais, cascos no fundo, quase sem luz' },
    { zona: 60, nome: 'Chaminés Negras', salas: 'grutas secas ligadas em anel debaixo do chão do mar, poças de água fervente, respiradouros e os dois Poços de Vapor para o Abismo', carater: 'sulfeto com brasa nas juntas, chaminés negras fumegando, vermes-tubo gigantes, crosta de enxofre, mexilhões, vapor subindo' }
  ]),
  msMinerios: UDW_PROF.minerios('mar', [['carvao', 8, 186], ['min_oricalco', 98, 186]]),
  // faixas do Abismo (js/103-abismo-api.js: AB_BANDS; js/108-abismo-mundo.js) e os minérios dele (108: vein)
  abFaixas: UDW_PROF.faixas('abismo', [
    { zona: 21, nome: 'Portões de Cinza', salas: 'salões em ruína de tijolo infernal, os pés das duas fendas', carater: 'rocha de cinza e basalto, cinza caindo do teto, correntes penduradas, braseiros, caveiras, estátuas de demônio, portões arrombados' },
    { zona: 22, nome: 'Rios de Fogo', salas: 'cavernas largas com um lago de lava e uma ponte de ferro negro', carater: 'basalto e obsidiana, crosta de lava brilhando, poças de lava, colunas de basalto, caldeirões, cachoeiras de lava, faíscas subindo' },
    { zona: 23, nome: 'As Entranhas', salas: 'câmaras redondas de carne', carater: 'carne viva e osso, tentáculos e ganchos no teto, sangue pingando, costelas, ovos, casulos, olhos e bocas nas paredes, um coração batendo' },
    { zona: 24, nome: 'Trono do Caos', salas: 'templos de tijolo infernal, o Trono do Caos', carater: 'pedra do caos e enxofre, runas e cristais roxos, altares, pentagramas, obeliscos, púlpitos, brasas roxas subindo' }
  ]),
  abMinerios: UDW_PROF.minerios('abismo', [['carvao', 0, 186], ['min_infernita', 0, 186]]),
  // faixas da Escuridão (js/220-escuro-api.js: ES_BANDS; js/226-escuro-mundo.js) e os minérios dela (226: vein)
  esFaixas: UDW_PROF.faixas('escuro', [
    { zona: 45, nome: 'A Borda Apagada', salas: 'os Postos dos Acendedores em ruína, os dois Postos de pouso no pé das correntes (o único braseiro eterno da camada)', carater: 'rocha apagada, a pedra do caos esfriando, ossadas abraçadas a lanternas, estátuas sem cabeça, obeliscos, poeira preta descendo' },
    { zona: 46, nome: 'O Breu', salas: 'os Grandes Vãos, com o chão em ilhas, poços sem fundo e lajes de penumbra', carater: 'pedra-breu e vidro negro, estalagmites de vidro, olhos no escuro, sombras de ninguém, janelas para o Nada, nenhuma partícula' },
    { zona: 47, nome: 'As Raízes da Noite', salas: 'galerias entre as raízes, os Nós dentro das raízes', carater: 'raiz da noite e casca, raízes pendentes que dá para escalar, raízes-veia, marcas de mão, pó de raiz caindo' },
    { zona: 48, nome: 'O Fundo do Mundo', salas: 'os Altares Frios, os dois Selos do Fundo, O Escuro Total (a sala do Nox)', carater: 'pedra primeva, sóis gravados, colunas e altares dos Acendedores, pedestais vazios, faíscas brancas que somem' }
  ]),
  esMinerios: UDW_PROF.minerios('escuro', [['carvao', 0, 186], ['min_noctirio', 46, 186]]),
  // faixas do Brejo das Bruxas (js/370-brejo-api.js: BJ_BANDS; js/375-brejo-mundo.js) e os minérios dele (375: vein)
  bjFaixas: UDW_PROF.faixas('brejo', [
    { zona: 77, nome: 'A Turfeira', salas: 'as duas câmaras de pouso (16 x 6, tábua, duas velas), bacias de turfa com a poça preta no meio e a mata afogada (troncos, tocos, raízes)', carater: 'turfa e raizame, lama nas primeiras linhas, fogos-fátuos sobre a água, o corpo de turfa meio saído da terra' },
    { zona: 78, nome: 'As Palafitas', salas: 'lagoas largas com plataformas de tábua sobre estacas, cabanas de pau a pique e sapê, passarelas', carater: 'argila e turfa, caldeirãozinho no tripé, varais de trapos e ervas, gaiolas de corvo, espantalhos' },
    { zona: 79, nome: 'O Patíbulo', salas: 'pátios com o cadafalso, as forcas e as cordas penduradas do teto', carater: 'pedra do brejo e argila, gaiolas de enforcado, fogueiras apagadas, pelourinhos, a tábua dos caçadores' },
    { zona: 80, nome: 'O Círculo de Pedras', salas: 'círculos de pedras em pé em volta de uma poça, o Caldeirão (a sala da Velha) e as duas Valas de Escoamento para a Cidade Afundada', carater: 'pedra do brejo e menir com espirais, marcas de bruxa, montes de crânios com velas pretas, bonecos de graveto' }
  ]),
  bjMinerios: UDW_PROF.minerios('brejo', [['carvao', 0, 186], ['min_ferrobrejo', 0, 186]]),
  // faixas da Necrópole do Rei Eterno (js/380-necropole-api.js: NC_BANDS; js/385-necropole-mundo.js) e os minérios dela (385: vein)
  ncFaixas: UDW_PROF.faixas('necropole', [
    { zona: 81, nome: 'Avenidas dos Túmulos', salas: 'as duas capelas da guarda (16 x 6, duas lanternas de alma), ruas compridas de laje com mausoléus de mármore dos dois lados, covas abertas', carater: 'granito negro, terra de cova, lápides, carpideiras de pedra, obeliscos, o sino de finados' },
    { zona: 82, nome: 'Os Columbários', salas: 'salões altos forrados de nichos com galerias desencontradas e correntes, ossuários de crânios', carater: 'parede de nichos, ossuário e cal, urnas, mortalhas no varal, altares dos necromantes' },
    { zona: 83, nome: 'Os Quartéis da Legião', salas: 'salões de cantaria com mezanino e colunas', carater: 'cantaria, estandartes rasgados, armeiros, tambores de guerra, cabides de armadura vazios' },
    { zona: 84, nome: 'A Cripta Real', salas: 'salas reais de mármore negro com colunas, o Salão do Relicário (a sala do Rei Eterno) e as duas Escadas dos Mortos para a Cidade dos Antigos', carater: 'mármore real com veio de ouro, sarcófagos, o brasão do rei, faíscas de alma subindo' }
  ]),
  ncMinerios: UDW_PROF.minerios('necropole', [['carvao', 0, 186], ['min_sepulcrita', 0, 186]]),
  // faixas da Prisão dos Deuses (js/390-prisao-api.js: PD_BANDS; js/395-prisao-mundo.js) e os minérios dela (395: vein)
  pdFaixas: UDW_PROF.faixas('prisao', [
    { zona: 85, nome: 'As Correntes Suspensas', salas: 'os dois Poços do Carcereiro com as câmaras de pouso (10 x 6, ícor pingando), abismos fundos atravessados por pontes de elo gigante caídas em barriga', carater: 'rocha da prisão, beiradas de alvenaria ciclópica, correntes de subir' },
    { zona: 86, nome: 'As Celas de Pedra Viva', salas: 'galerias de celas em andares (19 de altura, piso a cada 6) com grades de ferro, celas soltas', carater: 'pedra viva de veios vermelhos, laje gasta, runas azuis acesas, prisioneiros nas argolas' },
    { zona: 87, nome: 'O Salão dos Gigantes', salas: 'salões enormes com plataformas nas paredes e um gigante preso de joelhos no fundo', carater: 'rocha e alvenaria, ícor pingando, jaulas, relevos dos deuses e do lobo' },
    { zona: 88, nome: 'O Tártaro', salas: 'covas de rocha negra, a Cova das Correntes (a sala do Lobo) e as duas Gargantas para a camada de baixo', carater: 'pedra do Tártaro rachada de luz violeta, espinhos de pedra negra' }
  ]),
  pdMinerios: UDW_PROF.minerios('prisao', [['carvao', 0, 186], ['min_ferro_divino', 46, 186]]),
  // faixas do Campo da Última Guerra (js/400-guerra-api.js: GU_BANDS; js/405-guerra-mundo.js) e os minérios dele (405: vein)
  guFaixas: UDW_PROF.faixas('guerra', [
    { zona: 89, nome: 'Campo das Lâminas', salas: 'as duas câmaras de pouso (14 x 6, cantaria, duas auréolas caídas), campos abertos de chão plano e trincheiras retas de barro e paliçada', carater: 'terra de batalha e barro pisado, lanças e espadas fincadas em toda parte' },
    { zona: 90, nome: 'Bastiões Partidos', salas: 'salões e torres dos anjos, escadas de cerco, patamares de paliçada', carater: 'mármore celeste e cantaria dos anjos, penas petrificadas no teto' },
    { zona: 91, nome: 'A Brecha', salas: 'grutas abertas pelos demônios, trincheiras de tijolo, fendas acesas', carater: 'rocha queimada e rocha em brasa, tijolo de fosso' },
    { zona: 92, nome: 'O Último Estandarte', salas: 'os campos maiores, as duas Valas dos Caídos para o Abismo e o Campo do Estandarte (a sala do General)', carater: 'terra, rocha queimada e ferro de batalha, flâmulas rasgadas' }
  ]),
  guMinerios: UDW_PROF.minerios('guerra', [['carvao', 0, 186], ['min_belicita', 20, 186]]),
  // faixas das Ruínas dos Acendedores (js/410-acendedores-api.js: AC_BANDS; js/415-acendedores-mundo.js) e os minérios delas (415: vein)
  acFaixas: UDW_PROF.faixas('acendedores', [
    { zona: 93, nome: 'Os Faróis Caídos', salas: 'as duas Casas da Guarda (16 x 6, acesas pelas fendas de brasa), cavernas altas com faróis de tijolo em pé e tombados, covas', carater: 'rocha fuliginosa, cinza e tijolo refratário' },
    { zona: 94, nome: 'As Ruas de Cinza', salas: 'ruas largas de laje com casas de pedra lavrada, carroças e poços', carater: 'pedra lavrada e laje com os sulcos das carroças' },
    { zona: 95, nome: 'Os Templos da Chama', salas: 'templos de paredes grossas com colunas e o estrado do altar', carater: 'pedra lavrada e bronze enegrecido; os únicos braseiros acesos, que os turiferários alimentam' },
    { zona: 96, nome: 'A Fornalha do Mundo', salas: 'forjas com chão de escória, a Fornalha do Mundo (a sala do Último Acendedor) e as duas Escadarias do Fundo para a Escuridão', carater: 'rocha de brasa, escória e tijolo' }
  ]),
  acMinerios: UDW_PROF.minerios('acendedores', [['carvao', 0, 186], ['min_ardorita', 0, 186]]),
  // chaves de faixa repetidas entre camadas: o prefixo do objeto (at_, ms_, dg_) escolhe o nome certo
  faixaChavePref: { at_: { cratera: 'Cratera da Estrela' }, ms_: { chamines: 'Chaminés Negras' }, dg_: { chamines: 'Chaminés de Vapor' } },
  faixaChave: { praias: 'Praias Negras', floresta: 'Floresta de Algas', fossa: 'Fossa', chamines: 'Chaminés Negras', brecha: 'Brecha Tomada', camaras: 'Câmaras de Âmbar', bercario: 'Berçário', fendas: 'Fendas', saloes: 'Salões', covis: 'Covis', coracao: 'Coração', atrio: 'Átrio', nave: 'Nave', claustro: 'Claustro', criptas: 'Criptas', grutas: 'Grutas', galerias: 'Galerias', ninho: 'Ninho', fundacoes: 'Fundações', pocos: 'Poços', acampamento: 'Acampamento', fornalhas: 'Fornalhas', portoes: 'Portões', rios: 'Rios de Fogo', bosque: 'Bosque', entranhas: 'Entranhas', trono: 'Trono', cisternas: 'Cisternas', ruas: 'Ruas', bairro: 'Bairro do Poço', palacio: 'Palácio', canais: 'Canais de Lava', forjas: 'Forjas de Runas', borda: 'Borda Apagada', cratera: 'Cratera de Impacto', casco: 'Casco', laboratorios: 'Laboratórios', nucleo: 'Núcleo', breu: 'Breu', raizes: 'Raízes da Noite', fundo: 'Fundo do Mundo', mata: 'Mata de Prata', corte: 'Corte Desterrada', poco: 'Poço da Lua', chamines: 'Chaminés de Vapor', tuneis: 'Túneis Kobold', tubos: 'Tubos de Lava', leito: 'Leito de Ouro', escadarias: 'Escadarias', inversa: 'Cidade Inversa', maquinas: 'Máquinas' },
  // nome de cada bloco do mundo pela constante do jogo (03-blocos, 41/42 catedral, 52/53 cavernas). Os que viram item usam o nome do item.
  blocoNome: {
    MS_AREIA: 'Areia negra', MS_ROCHA: 'Rocha do mar', MS_CRACAS: 'Rocha com cracas', MS_RECIFE: 'Recife', MS_CORAL: 'Coral', MS_LODO: 'Lodo', MS_SULFETO: 'Sulfeto',
    MS_CASCO: 'Casco de navio', MS_CONVES: 'Tábua de convés', MS_TEMPLO: 'Pedra do templo', MS_O_CARVAO: 'Veio de carvão na rocha do mar', MS_O_ORICALCO: 'Veio de oricalco', MS_O_ORICALCO_S: 'Veio de oricalco no sulfeto',
    MS_BARREIRA: 'A Onda Parada (porta do Leviatã)', MS_ALGA: 'Alga', MS_ANEMONA: 'Anêmona', MS_CONCHA: 'Conchas', MS_CORRENTE: 'Corrente de âncora', MS_CORDAME: 'Cordame', MS_LANTERNA: 'Lanterna de óleo de peixe',
    MS_ESTALAC: 'Estalactite molhada', MS_VERMES: 'Vermes-tubo', MS_ESPINHA: 'Espinha de peixe', MS_MEXILHAO: 'Mexilhões', MS_RESPIRO: 'Respiradouro', MS_ESTACA: 'Estaca de palafita', MS_FONTE: 'Fonte de água fervente',
    EL_SOLO: 'Solo élfico', EL_MADEIRA: 'Madeira prateada', EL_FOLHAGEM: 'Folhagem lunar', EL_MARMORE: 'Mármore-lua', EL_LAVRADA: 'Pedra lavrada élfica', EL_TABUA: 'Tábua élfica',
    EL_PEDRA_POCO: 'Pedra-do-poço', EL_RAIZ: 'Raiz-mãe', EL_CRISTAL_LUA: 'Cristal lunar', EL_ESPELHO: "Espelho d'água da Dama",
    EL_BARREIRA: 'Véu de luar', EL_O_CARVAO: 'Veio de carvão no solo élfico', EL_O_LUNARITA: 'Veio de lunarita', EL_LUA: 'A Lua Presa', EL_ESCADA: 'Escada de corda', EL_CIPO: 'Cipó prateado',
    EL_LANTERNA: 'Lanterna élfica', EL_FLOR: 'Flor-da-lua', EL_SAMAMBAIA: 'Samambaia prateada', EL_RUNA: 'Pedra rúnica', EL_BRASEIRO: 'Braseiro lunar', EL_FLAMULA: 'Flâmula',
    EL_ORVALHO: 'Orvalho de lua', EL_COLUNA: 'Coluna de raiz', EL_FOLHAS: 'Folhas caídas', EL_VAGALUME: 'Vaga-lumes', EL_COGUMELO: 'Cogumelo-de-luar', EL_CRISTALINHO: 'Lasca de cristal lunar',
    DG_TUFO: 'Tufo vulcânico', DG_ANDESITO: 'Andesito', DG_POMES: 'Pedra-pomes', DG_LAVA_CORDA: 'Lava cordada', DG_OBSIDIANA: 'Obsidiana rajada', DG_TAIPA: 'Taipa kobold', DG_ANDAIME: 'Andaime de ossos',
    DG_OSSO: 'Osso de dragão', DG_OURO_SOLTO: 'Ouro solto (desliza)', DG_OURO_DURO: 'Ouro endurecido', DG_CROSTA: 'Crosta de magma', DG_CORTINA: 'Cortina de magma da Cratera', DG_O_CARVAO: 'Veio de carvão no tufo',
    DG_O_DRACONIO: 'Veio de dracônio', DG_ESCADA: 'Escada de cravos', DG_CORDA: 'Corda de couro de draco', DG_VAPOR: 'Bica de vapor', DG_OLIVINA: 'Olivina', DG_TOTEM: 'Totem kobold', DG_VELA: 'Vela de sebo',
    DG_MOEDAS: 'Moedas espalhadas', DG_ESTALACT: 'Estalactite de lava', DG_FUMAROLA: 'Fumarola', DG_COLUNA: 'Coluna de lava', DG_ESCAMA: 'Escama caída', DG_FIO: 'Fio de armadilha', DG_OURO_QUENTE: 'Ouro derretido',
    TT_OSSO: 'Osso de titã', TT_ESPONJA: 'Osso esponjoso', TT_TUTANO: 'Tutano petrificado', TT_ROCHA: 'Rocha fóssil', TT_PO: 'Pó de osso', TT_DENTE: 'Esmalte de dente',
    TT_CARTILAGEM: 'Cartilagem seca', TT_CINZA: 'Cinza assentada', TT_BRONZE: 'Bronze titânico', TT_BARREIRA: 'Dedos Cerrados', TT_O_CARVAO: 'Veio de linhito na rocha fóssil',
    TT_O_ADAMANTITA: 'Veio de adamantita', TT_ESCADA: 'Escada de ossos amarrados', TT_TENDAO: 'Tendão pendurado', TT_OSSINHOS: 'Ossinhos', TT_LAMPARINA: 'Lamparina de tutano',
    TT_FLOR: 'Flor-de-cinza', TT_PO_CAI: 'Pó caindo', TT_LIQUEN: 'Líquen', TT_LASCA: 'Lasca da foice', TT_ESTACA: 'Estaca de osso', TT_FOSSIL: 'Fóssil', TT_ESPINHO: 'Espinho de osso',
    TT_COLUNA: 'Coluna de vértebras',
    AT_BARREIRA: 'Grade de luz', AT_TRANSITO: 'Bloco em trânsito', AT_O_CARVAO: 'Veio de carvão na rocha fria', AT_O_ESTELAR: 'Veio de ferro estelar', AT_ESCADA: 'Escada embutida', AT_CORRENTE: 'Corrente de elos quadrados',
    AT_LAMPADA: 'Lâmpada de glifo', AT_LASCA: 'Lasca de estrela', AT_MARCO: 'Marco de medida', AT_ENGRENA: 'Engrenagem solta', AT_FIO: 'Fio de luz', AT_CUBOS: 'Cubos flutuantes', AT_POEIRA: 'Poeira de estrela',
    AT_COLUNA: 'Coluna facetada', AT_ESTALAC: 'Estalactite de vidro', AT_SETA: 'Seta de prumo',
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
    ES_CASCA: 'Casca de noite', ES_BREU_VIVO: 'Breu vivo', ES_PENUMBRA: 'Laje de penumbra', ES_PENUMBRA_FIRME: 'Laje de penumbra acesa', ES_BARREIRA: 'Muro de Sombra', ES_O_CARVAO: 'Veio de carvão na rocha apagada', ES_O_NOCTIRIO: 'Veio de noctírio',
    ES_BRASEIRO_FRIO: 'Braseiro apagado', ES_BRASEIRO: 'Braseiro aceso', ES_TOCHA_MORTA: 'Tocha apagada', ES_LUME: 'Lume-fátuo (dá para pegar)', ES_CORRENTE: 'Corrente dos Acendedores', ES_RAIZ_PEND: 'Raiz pendente',
    ES_ESPINHO: 'Espinho de vidro negro', ES_ESTALAG: 'Estalagmite de vidro', ES_OSSADA: 'Ossada de Acendedor', ES_OLHOS: 'Olhos no escuro', ES_SOL: 'Sol gravado', ES_COLUNA: 'Coluna dos Acendedores',
    ES_PIRA_FRIA: 'Pira apagada', ES_PIRA: 'Pira acesa',
    HB_SANGUE: 'Sanguinária', HB_LIRIO: 'Lírio-das-grutas', HB_LOSNA: 'Losna-da-cripta', HB_GEADA: 'Flor-de-geada', HB_BRASA: 'Raiz-de-brasa',
    BJ_TURFA: 'Turfa', BJ_LAMA: 'Lama (prende o passo)', BJ_ARGILA: 'Argila de brejo', BJ_PEDRA: 'Pedra do brejo', BJ_TABUA: 'Tábua das palafitas', BJ_SAPE: 'Sapê', BJ_PAU_PIQUE: 'Pau a pique', BJ_MENIR: 'Menir',
    BJ_RAIZ: 'Raizame', BJ_CROSTA: 'Crosta de ferro', BJ_BARREIRA: 'Espinheiro da Velha', BJ_O_CARVAO: 'Veio de carvão de turfa', BJ_O_FERRO: 'Veio de ferro-do-brejo', BJ_ESCADA: 'Escada de corda', BJ_CORDA: 'Corda de forca',
    BJ_JUNCO: 'Junco', BJ_FATUO: 'Fogo-fátuo', BJ_MUSGO: 'Barba-de-velho', BJ_POSTE: 'Estaca de palafita', BJ_VELA: 'Vela preta', BJ_OSSOS: 'Ossos no lodo', BJ_AMULETO: 'Amuleto de galhos', BJ_GOTA: 'Goteira', BJ_CRANIO: 'Crânio na estaca', BJ_TOUCEIRA: 'Touceira',
    NC_GRANITO: 'Granito negro', NC_TERRA: 'Terra de cova', NC_LAJE: 'Laje de rua', NC_MARMORE: 'Mármore funerário', NC_TELHA: 'Telha de ardósia', NC_NICHO: 'Parede de nichos', NC_OSSUARIO: 'Ossuário',
    NC_CANTARIA: 'Cantaria da legião', NC_REAL: 'Mármore real', NC_CAL: 'Cal', NC_BARREIRA: 'Rastrilho de ossos', NC_COVA: 'Laje de cova', NC_O_CARVAO: 'Veio de carvão no granito', NC_O_SEPULCRITA: 'Veio de sepulcrita',
    NC_ESCADA: 'Escada de ferro', NC_CORRENTE: 'Corrente', NC_LANTERNA: 'Lanterna de alma', NC_LAPIDE: 'Lápide', NC_FLORES: 'Flores secas', NC_OSSOS: 'Ossos soltos', NC_MORTALHA: 'Mortalha pendurada',
    NC_MUSGO: 'Musgo-de-alma', NC_URNA: 'Urna', NC_LANTERNA_T: 'Lanterna de alma pendurada', NC_RAIZ: 'Raízes brancas', NC_ELMO: 'Elmo caído', NC_LANCAS: 'Lanças fincadas', NC_COLUNA: 'Coluna',
    PD_ROCHA: 'Rocha da Prisão', PD_ALVENARIA: 'Alvenaria ciclópica', PD_PEDRA_VIVA: 'Pedra viva', PD_ELO: 'Elo gigante', PD_BRONZE: 'Bronze antigo', PD_TARTARO: 'Pedra do Tártaro', PD_FENDA: 'Fenda do Tártaro', PD_LAJE: 'Laje gasta',
    PD_RUNA: 'Pedra rúnica', PD_BARREIRA: 'Grade de bronze', PD_O_CARVAO: 'Veio de carvão na rocha da prisão', PD_O_FERRO: 'Veio de ferro divino', PD_CORRENTE: 'Corrente de subir', PD_ESCADA: 'Escada de ferro', PD_GRADE: 'Grade',
    PD_ARGOLA: 'Argola de bronze', PD_OSSOS: 'Ossos', PD_GRILHAO: 'Grilhão', PD_ICOR: 'Ícor pingando', PD_POCA: 'Poça de ícor', PD_ESTALAC: 'Estalactite', PD_LIQUEN: 'Líquen', PD_ELOS: 'Elos soltos',
    GU_TERRA: 'Terra de batalha', GU_ARGILA: 'Barro pisado', GU_SUCATA: 'Ferro de batalha', GU_MARMORE: 'Mármore celeste', GU_CANTARIA: 'Cantaria dos anjos', GU_ESCORIA: 'Rocha queimada', GU_BRASA: 'Rocha em brasa',
    GU_PENAS: 'Penas petrificadas', GU_TIJOLO: 'Tijolo de fosso', GU_PALICADA: 'Paliçada', GU_BARREIRA: 'Muralha de escudos', GU_O_CARVAO: 'Veio de carvão na terra de batalha', GU_O_BELICITA: 'Veio de belicita',
    GU_ESCADA: 'Escada de cerco', GU_CORDA: 'Corda de cerco', GU_LANCA: 'Lança fincada', GU_ESPADA: 'Espada fincada', GU_ELMO: 'Elmo fincado', GU_PENA: 'Pena de anjo', GU_FENDA: 'Fenda em brasa', GU_FLAMULA: 'Flâmula rasgada',
    GU_FLECHAS: 'Flechas fincadas', GU_OSSOS: 'Ossos', GU_GRILHAO: 'Grilhão', GU_COLUNA: 'Coluna', GU_ESCUDO: 'Escudo caído', GU_AUREOLA: 'Auréola caída', GU_CRAVO: 'Cravo',
    AC_ROCHA: 'Rocha fuliginosa', AC_LAVRADA: 'Pedra lavrada', AC_LAJE: 'Laje de rua', AC_CINZA: 'Cinza fria', AC_BRASA: 'Rocha de brasa', AC_TIJOLO: 'Tijolo refratário', AC_BRONZE: 'Bronze enegrecido', AC_ESCORIA: 'Escória',
    AC_BARREIRA: 'Grade acesa', AC_O_CARVAO: 'Veio de carvão na rocha fuliginosa', AC_O_ARDORITA: 'Veio de ardorita', AC_GRELHA: 'Grelha de ferro', AC_ESCADA: 'Escada de ferro', AC_CORRENTE: 'Corrente de lampadário',
    AC_BRASEIRO_FRIO: 'Braseiro frio', AC_BRASEIRO: 'Braseiro aceso', AC_CERA: 'Cera escorrida', AC_CINZEIRO: 'Cinzeiro', AC_PAVIO: 'Pavio pendurado', AC_FULIGEM: 'Fuligem', AC_FENDA: 'Fenda de brasa', AC_LANTERNA: 'Lanterna apagada',
    AC_COLUNA: 'Coluna', AC_OSSADA: 'Ossada', AC_PINGENTE: 'Pingente de cera',
    EL_ENREDADO: 'Mármore enredado', EL_LENHO: 'Lenho de espinheiro', EL_VIDENTE: 'Pedra-vidente', EL_ROSEIRA: 'Roseira-brava',
  },
  paredeNome: {
    WEL_MATA: 'Raízes e solo da mata', WEL_SALAO: 'Painel lavrado dos salões', WEL_PROFANO: 'Painéis ameixa com galhos', WEL_POCO: 'Pedra-do-poço com runas', WEL_FOLHAS: 'Cortina de folhas de prata',
    WDG_TUFO: 'Tufo vulcânico', WDG_ANDESITO: 'Andesito', WDG_TAIPA: 'Taipa kobold', WDG_LAVA: 'Lava cordada escura', WDG_OBSIDIANA: 'Obsidiana rajada',
    WTT_OSSO: 'Osso de titã', WTT_ROCHA: 'Rocha fóssil', WTT_ESPONJA: 'Osso esponjoso', WTT_CRANIO: 'Dentro do crânio', WTT_BRONZE: 'Placas de bronze',
    WAT_PEDRA: 'Pedra lisa', WAT_LAJE: 'Laje de juntas finas', WAT_GLIFO: 'Glifos gravados', WAT_MAQUINA: 'Painéis e eixos da máquina', WAT_VIDRO: 'Vidro fosco',
    1: 'Terra', 2: 'Pedra', 3: 'Pedra funda', 4: 'Cripta', WCT_CALCARIO: 'Calcário', WCT_CANTARIA: 'Cantaria', WCT_REBOCO: 'Reboco', WCT_PAINEL: 'Painel de madeira',
    WCT_CRIPTA: 'Pedra de cripta', WCT_OSSARIO: 'Ossário', WCT_ARCADA: 'Arcada', WCT_MARMORE: 'Mármore', WCV_TERRA: 'Terra úmida', WCV_ROCHA: 'Rocha', WCV_CALCITA: 'Calcita',
    WCV_TEIA: 'Teia', WCV_XISTO: 'Xisto', WIC_CALC: 'Calcário congelado', WIC_ROCHA: 'Rocha gelada', WIC_GELO: 'Gelo azul', WIC_NEVE: 'Neve batida', WIC_NEGRO: 'Gelo negro',
    WMN_FERROSA: 'Rocha ferrosa', WMN_TABUADO: 'Tabuado', WMN_CAVADA: 'Rocha cavada', WMN_TIJOLO: 'Tijolo de fornalha', WMN_QUARTZITO: 'Quartzito',
    WAB_CINZA: 'Rocha de cinza', WAB_BASALTO: 'Basalto', WAB_CARNE: 'Carne viva', WAB_TIJOLO: 'Tijolo infernal', WAB_CAOS: 'Pedra do caos',
    WFG_CARNE: 'Carne de micélio', WCD_CANTARIA: 'Cantaria', WCD_TIJOLO: 'Reboco descascado', WCD_LIMO: 'Pedra com limo', WCD_MADEIRA: 'Tabuado das casas', WCD_MARMORE: 'Mármore',
    WFP_SOLO: 'Solo petrificado', WFP_GRANITO: 'Granito verde', WFP_CASCA: 'Casca de pedra', WFP_RAIZ: 'Raiz de pedra', WFP_CRISTAL: 'Cristal fosco',
    WES_APAGADA: 'Rocha apagada', WES_BREU: 'Pedra-breu', WES_RAIZ: 'Raiz da noite', WES_LAVRADA: 'Pedra lavrada', WES_PRIMEVA: 'Pedra primeva',
    WBJ_TURFA: 'Turfa', WBJ_PEDRA: 'Pedra do brejo', WBJ_TABUA: 'Tábua das cabanas', WBJ_RAIZ: 'Raizame', WBJ_MENIR: 'Pedra escura do Círculo',
    WNC_GRANITO: 'Granito negro', WNC_MARMORE: 'Mármore', WNC_NICHOS: 'Nichos', WNC_OSSOS: 'Ossos', WNC_CANTARIA: 'Cantaria',
    WPD_ROCHA: 'Rocha da Prisão', WPD_ALVENARIA: 'Alvenaria ciclópica', WPD_CELA: 'Cela com a grade', WPD_BRONZE: 'Bronze antigo', WPD_TARTARO: 'Pedra do Tártaro',
    WGU_TERRA: 'Terra de batalha', WGU_MARMORE: 'Mármore celeste', WGU_ESCORIA: 'Rocha queimada', WGU_TIJOLO: 'Tijolo de fosso', WGU_PALICADA: 'Paliçada',
    WAC_ROCHA: 'Rocha fuliginosa', WAC_LAVRADA: 'Pedra lavrada', WAC_TIJOLO: 'Tijolo refratário', WAC_TEMPLO: 'Bronze do templo', WAC_FORNALHA: 'Tijolo da fornalha'
  },
  apoio: { chao: 'No chão', teto: 'No teto', parede: 'Na parede de fundo', janela: 'Janela' },

  catedral: `Uma catedral gótica soterrada há séculos debaixo das cavernas, com o claustro e as criptas embaixo. Os mortos dela se levantaram. ${UDW_PROF.lugar('catedral')}.`,
  catedralEntrada: 'Nas Fundações Soterradas, duas grutas de saída abrem para escadarias em ruína que descem até o átrio.',
  caverna: `${UDW_PROF.lugar('cavernas')}: terra e rocha que vão virando ninho de aranhas e, no fundo, pedra lavrada da catedral que está embaixo. Slimes e morcegos repintados, ratos, aranhas, cuspideiras, besouros, fungos esporentos, centopeias e goblins dinamiteiros. Nenhum morto-vivo.`,
  cavernaEntrada: 'O pórtico de pedra à direita da placa do vilarejo ("Cavernas →"): a escadaria de cantaria desce e vai virando terra até abrir nas Grutas Rasas.',
  gelo: `${UDW_PROF.lugar('gelo')}: um frio mais velho que a catedral subiu pelas rachaduras e congelou tudo. Fendas de geada, salões de gelo azul que brilha, as tocas dos yetis e, no fundo, o gelo negro do Coração do Inverno. O gelo, o gelo azul e o gelo negro escorregam: o herói demora para arrancar e para frear.`,
  geloEntrada: 'Duas salas das Criptas mais baixas têm o chão rachado: uma fenda desce de cada uma até as Fendas Geladas, com degraus de pedra congelada a cada 3 blocos para voltar pulando.',
  mina: `${UDW_PROF.lugar('mina')}: uma mina de cobalto que os mineiros abandonaram quando o fundo começou a matar. Os mortos continuam cavando, o gás e os carrinhos ganharam vida, e os goblins tomaram o lugar: galerias escoradas, poços com andaimes, o acampamento goblin e, no fundo, as fornalhas que nunca apagaram.`,
  minaEntrada: 'Dois poços antigos descem do chão do Coração do Inverno: uma boca de madeira no gelo, um poço revestido de tábuas e uma escada até a primeira galeria. Volta-se pela mesma escada.',
  // sons de ambiente de cada cenário (js/97-ambiente.js)
  catedralSom: 'Um salão enorme e vazio que ecoa: zumbido grave, sussurros sem palavras ao longe (mais nas Criptas), correntes balançando, vento assobiando nas janelas quebradas, gotas e, de vez em quando, um sino que ninguém toca.',
  cavernaSom: 'Ar parado e um ronco grave da rocha, gotas caindo em poças (perto e longe, com eco), pedrinhas rolando e a rocha gemendo lá no fundo. No Ninho, patinhas correndo de um lado ao outro; nas Fundações, correntes.',
  geloSom: 'Vento gelado uivando pelas fendas, o gelo estalando e rangendo devagar, cristais tilintando e gotas de degelo.',
  abismo: `${UDW_PROF.lugar('abismo')}: o inferno de onde vieram os demônios. Cinza, rios de fogo, paredes de carne que respiram e, no fundo, o trono de quem manda em tudo isso. O metal daqui é a infernita.`,
  anoes: `${UDW_PROF.lugar('anoes')}. Brasafunda, a fortaleza do Clã da Bigorna: andares retos de cantaria ligados por corredores que dão a volta no mundo, escadas de pedra entre eles, lava domada em canais com grade por cima e forjas que ainda trabalham sozinhas. Os anões subiram; ficaram as máquinas cumprindo a última ordem (guardar) e os fantasmas. Algo cavou de baixo: cera, quitina e buracos redondos.`,
  anoesEntrada: 'As duas escadarias de pedra dos anões, no fim da Floresta Petrificada, viram um poço quadrado de cantaria com escada anã que desce até a sala da guarita (12 x 6, laje plana, duas lâmpadas de runa, sem monstros), no primeiro andar dos Portões de Bronze. A saída para baixo são as duas salas de descida das Forjas de Runas, que levam ao Reino Élfico.',
  anoesSom: 'Um zumbido grave e contínuo de máquina e o eco seco de salão de pedra. Ao longe, um malho batendo, correntes, sibilo de vapor, uma comporta batendo. Vento nas seteiras dos Portões, um coro grave sem palavras nos Salões, fole e bigorna mais perto nas Forjas e, perto das brechas, um zumbido de inseto vindo de baixo.',
  anoesMecanismos: 'As eclusas (poços de 6 de largura entre os dois andares dos Canais) têm uma comporta de bronze na boca de cima e uma alavanca em cada andar: a tecla de usar (E) perto da alavanca abre ou fecha a comporta. As alavancas ficam salvas. Na Oficina do Mestre, num pedestal debaixo da marca do clã, fica o Cinzel de Runas: levado ao Grimaldo, ele reconhece a marca da bigorna do avô e a forja ganha a aba Runas, que grava uma runa (Brasa, Pedra, Fôlego ou Têmpera) numa peça forjada por 1 runa gravada e 1 barra do metal da peça.',
  autoforjaOnde: 'A Grande Forja, um salão de 64 x 28 blocos nas Forjas de Runas, do outro lado do mundo em relação às escadarias. O Autômato-Forja anda pendurado num trilho de bronze perto do teto; no chão, três trechos de grade sobre um canal de lava; nas paredes, quatro plataformas com alavancas (duas de lava, duas de trava). Ao entrar, portões de runas fecham as duas portas; sair ou morrer reinicia a luta.',
  autoforjaFases: [
    ['Fase 1, o guindaste.', 'Corre pelo trilho e ataca com o braço do malho, a garra e o cadinho de lava, sempre avisando antes. Os braços só levam dano quando estão embaixo; a alavanca de trava abre a portinhola do núcleo, que então leva o dobro.'],
    ['Fase 2, a forja acorda (60%).', 'Solta enxames de engrenagens (no máximo 2), as grades do chão esquentam em sequência e a garra vai puxar uma alavanca de lava; as bicas do teto queimam quem estiver embaixo, inclusive ele.'],
    ['Fase 3, o pêndulo (25%).', 'O trilho arrebenta de um lado e ele balança pendurado na ponta. O trilho caído vira uma rampa: subindo nela, o núcleo fica ao alcance da espada.']
  ],
  mar: `${UDW_PROF.lugar('mar')}. Debaixo das raízes da Árvore-Mãe a rocha se abre num mar que dá a volta no mundo, sem céu e sem sol: praias de areia negra, ilhas de basalto, navios de todas as épocas encalhados ou boiando de quilha para cima, as palafitas da gente-peixe e, no fundo, florestas de algas, as fendas da Fossa com os templos e as Chaminés Negras, que já esquentam com o fogo de baixo. A luz é toda de bicho, de plâncton e dos braseiros de óleo de peixe.`,
  marEntrada: 'Debaixo dos dois poços de raízes das Grutas da Lua do Reino Élfico, a raiz-mãe sai do teto do mar com um cordame pendurado, e cada descida termina numa Câmara de Pouso numa ilha. Para baixo há dois caminhos: o seco, pelos túneis por dentro das ilhas e da Fossa (com sifões curtos), que é o garantido; e o molhado, nadando pelas fendas, de respiradouro em respiradouro, até o templo e o túnel de trás. As duas saídas para o Abismo são os Poços de Vapor nas Chaminés.',
  marSom: 'Sem melodia: ondas quebrando na praia e madeira de navio rangendo em cima; debaixo da água, tudo abafado, bolhas e um canto de baleia distante; nas Chaminés, chiado de vapor e borbulho.',
  marEstados: 'Debaixo da água o fôlego acaba em 10 s (as peças de elmo, peitoral e botas de oricalco dão +2 s cada e não pesam no nado); os respiradouros e os bolsões de ar enchem de novo. O guerreiro escamado agarra o tornozelo e puxa para o fundo; o xamã prende numa bolha que sobe devagar e gasta o fôlego até em terra; o polvo solta tinta que apaga toda a luz por uns segundos. A água das poças das Chaminés ferve: 3% da vida a cada meio segundo. Bichos de água fora da água perdem vida e se debatem de volta.',
  leviataOnde: 'A Nau Sem Nome, num mar aberto de 140 blocos do outro lado do mundo em relação às descidas: a proa de um navio presa num pináculo de recife, com duas correntes de âncora até o fundo, e a meia-nau, a popa e os destroços boiando em volta. Pisar no convés da proa acorda o Leviatã, e duas Ondas Paradas sobem do fundo e fecham o mar. A maré sobe e desce de verdade durante a luta. Morrer ou sair reinicia tudo; fica salvo que ele morreu.',
  leviataFases: [
    ['Fase 1, a maré.', 'Bote: uma sombra sobe com bolhas e ele sai da água em arco, morde e mergulha do outro lado. Rabada: a cauda sobe ao longe, bate, e uma onda corre pela superfície; pular, subir num destroço alto ou estar fundo escapa. Depois de 2 botes ele descansa a cabeça no convés por 2 s e leva o dobro de dano.'],
    ['Fase 2, os arcos (60%).', 'A maré fica mais rápida. Tromba-d\'água: espuma debaixo do herói e uma coluna que o joga para cima. Redemoinho: a água gira e puxa o herói e os destroços para a boca; segurar numa corrente escapa. Chama 2 Tubarões-Cegos uma vez.'],
    ['Fase 3, o fundo (25%).', 'A maré fica alta, a meia-nau quebra e a popa afunda. Ataque por baixo: o destroço treme e solta bolhas, e ele atravessa vindo do fundo. Jato abissal: a garganta acende e um jato varre a superfície. Apagar: ele engole o plâncton e por 8 s a luz do mar cai à metade; só os olhos dele brilham.']
  ],
  leviata: 'O chefe do Mar Sem Sol. Veja as fases abaixo. O corpo inteiro leva golpe, mas só 30% do dano chega na cabeça.',
  elfos: `${UDW_PROF.lugar('elfos')}. Quando o sol dos homens subiu, os Filhos da Lua desceram levando um pedaço da lua, a Lua Presa, e plantaram debaixo dela uma mata de prata; lavraram salões na pedra e guardaram o Espelho da Lua. A Dama olhou demais para dentro dele e se perdeu; a parte da corte que a seguiu virou a Corte Sem Lua, um baile de máscaras que nunca acabou, com a roseira-brava crescendo por cima de tudo. Os outros, elfos e fadas, ainda guardam a mata e os salões, e não deixam ninguém passar.`,
  elfosEntrada: 'As duas descidas saem das duas salas de descida da Fortaleza dos Anões e continuam como um poço de raízes de 3 de largura, revestido de madeira prateada e raiz-mãe, com a Escada de Corda descendo até o Posto de Guarda: uma sala de tábua de 12 x 6 com duas lanternas élficas, onde nenhum monstro nasce. Volta-se pela mesma escada.',
  elfosSom: 'Sem melodia: vento leve nas folhas de prata na Mata, eco longo e claro nos salões com um coro sem palavras ao longe, cristal tilintando e um sino raro nos Salões; sussurros e gemidos na Corte; gotas caindo na água dos poços no fundo.',
  elfosEstados: 'O Cavaleiro de Espinhos e o Guarda-Fronteira deixam o herói enraizado: raízes prendem os pés e ele não anda nem pula, mas ainda ataca, defende e lança magia. A Musa Faminta deixa o herói enlevado: lento e sem conjurar arco, nevasca nem fogo enquanto dura; as notas da canção giram sobre a cabeça. A Dama enfeitiça: fios de luar puxam o herói devagar para ela; andar para o outro lado vence metade do puxão. A roseira-brava da Corte arranha quem passa por ela (um pouco de dano e lentidão).',
  damaEspelhoOnde: 'O Espelho da Lua, uma gruta de 64 x 26 no fundo das Grutas da Lua, do outro lado do mundo em relação às descidas, com o chão de espelho d\'água e a Lua Presa no alto. Duas portas com corredores de serviço; ao entrar, o véu de luar fecha as duas. Fica salvo que a Dama morreu.',
  damaFases: [
    ['A Dama da Luz.', 'Branca e dourada, flutua sobre o espelho d\'água. Raio da Lua (um feixe que cai do alto), Lâminas de Luz (3 crescentes em leque) e Deslize: ela tremeluz e reaparece sobre outra plataforma de raiz.'],
    ['A Tentação (60%).', 'Ela se transforma: pele cinza-azulada, olhos brancos, coroa de espinhos. A Lua Presa fica vermelha e duas Guardas Sombrias entram pelas portas. Encantamento: 3 anéis de prata perseguem o herói e o puxam para ela. Espinhos de Raiz: uma sombra e uma borda escura piscam (0,7 s) e as estacas caem do teto, ficando 5 s no chão.'],
    ['O Reflexo (30%).', 'Um reflexo pálido dela sobe da água do outro lado e repete cada ataque espelhado; não leva dano e se quebra quando ela morre. A cada 12 s a lua pisca e apaga por 3 s: o eclipse.']
  ],
  dama: 'O chefe do Reino Élfico. Veja as fases abaixo.',
  dragao: `${UDW_PROF.lugar('dragao')}: ${UDW_PROF.D} m de vulcão vivo visto por dentro. Debaixo do mar a rocha esquenta até ferver a água; mais fundo fica o vulcão de um dragão velho. Os kobolds, a cria pequena e covarde dos dragões, cavaram tocas nas paredes dele e vivem de servir e de roubar migalhas do tesouro; nos tubos por onde a lava escorreu moram os dracos e as serpes. No fundo, na Cratera do Tesouro, Cinzarel dorme sobre um morro de ouro. Nada aqui é do inferno nem foi construído por gente: rocha vulcânica, ouro, ossos de dragão e luz âmbar.`,
  dragaoEntrada: 'Debaixo das duas descidas da camada de cima, a rocha afina e vira tufo: o poço continua como uma chaminé de vapor de 4 de largura, com a escada de cravos kobold (pinos de osso cravados na rocha) descendo uns 30 blocos até a câmara de pouso, uma gruta de tufo de 14 x 6 com 2 velas de sebo e uma bica de vapor apagada, onde nenhum monstro nasce num raio de 20 blocos. Logo depois da porta vem a primeira gruta de vapor. Volta-se pela mesma escada. Para baixo, as duas descidas dos Tubos Frios, no Leito de Ouro, longe da Cratera: tubos de lava antigos de 5 de largura que mergulham até a camada seguinte.',
  dragaoSom: 'Sem melodia: um ronco grave de magma por baixo de tudo. Vapor chiando e água borbulhando nas Chaminés; estalos, rangidos e cochichos de kobold ao longe nos Túneis; magma borbulhando e estourando nos Tubos; no Leito, gemidos de rocha e, de vez em quando, um rugido abafado: a respiração de quem dorme.',
  dragaoEstados: 'O Kobold Fundidor joga ouro derretido: a poça endurece em 2 s e quem estiver nela fica de pés presos 1 s (não anda nem pula, mas ainda ataca e se defende); o sopro de Cinzarel faz o mesmo com o ouro do monte. A língua do Camaleão de Cinza puxa o herói até a boca (bater nele solta). A Serpe agarra e carrega o herói por até 6 blocos (é o único bicho do jogo que agarra; bater nela solta). O fio de armadilha do Kobold Armadilheiro, quando rompido, solta 3 ou 4 pedras do teto, com a sombra no chão 0,6 s antes. O magma dos canais queima como a lava, mas não empurra.',
  dragaoOuro: 'O primeiro bloco do jogo que cai. Ouro solto com ar embaixo cai; com um lado e a diagonal de baixo livres, escorrega: os montes ficam com encosta de 45 graus, como areia. Só se mexe o ouro que alguém acordou (minerando do lado ou embaixo, o sopro, o pouso do dragão), e quem não se mexe dorme de novo. Minerar um bloco dá 1 moeda de ouro e, 1 vez em 20, uma Moeda Antiga; o ouro que só escorrega não dá nada. O ouro derretido pelo sopro queima quem pisa e em 3 s vira ouro endurecido, que não desliza mais. Fica no Leito de Ouro e nas oferendas dos santuários, nunca em degrau de subida nem debaixo de objeto.',
  cinzarelOnde: 'A Cratera do Tesouro, uma tigela de 90 x 44 no Leito de Ouro, do outro lado do mundo em relação às duas descidas. Paredes de obsidiana rajada em degraus, uma chaminé fechada no teto, o morro de ouro solto no meio com 3 picos (o do meio com 14 de altura), um fosso de magma de 2 de fundo dos dois lados com colunas de abrigo, e duas portas no alto, uma de cada lado, com a escada de cravos descendo até o ouro. Cinzarel dorme enrolado no pico do meio: pisar no morro ou bater nele o acorda (o primeiro golpe nele dormindo conta dobrado) e as cortinas de magma fecham as portas. Sair, usar portal ou morrer refaz a cratera e ele volta a dormir com a vida cheia.',
  cinzarelFases: [
    ['No chão.', 'Mordida (o pescoço recua e a boca acende), varrida de cauda pelo monte (a ponta da cauda sobe e balança 0,8 s) e sopro em linha (o peito incha e o brilho sobe pela garganta, 1 s). O sopro derrete o ouro onde bate: queima por 3 s e depois endurece, e a luta vai trocando ouro que escorrega por chão firme.'],
    ['Voo e avalanche (60%).', 'Ele levanta voo, dá voltas pela cratera e pousa num dos 3 picos ou numa coluna. Antes do pouso o lugar ganha uma sombra que cresce e o ouro treme 1,2 s; o pouso solta uma avalanche de ouro encosta abaixo, que machuca e empurra. Fuja para o ouro endurecido, para trás de uma coluna ou para o pico oposto. Entre pousos ele bate as asas no chão (poeira dourada antes) e o vento empurra 4 blocos.'],
    ['A cratera acorda (25%).', 'O fosso de magma sobe um bloco a cada 20 s (até 4). Ele se agarra na parede e cospe 3 bolas de magma em arco (a boca acende uma vez por bola), que derretem o ouro onde caem; cansado, desce no pico do meio e dá o sopro varrido da esquerda para a direita (abre as asas e vira a cabeça antes).']
  ],
  cinzarel: 'O chefe do Covil do Dragão. Veja as fases abaixo.',
  titas: `${UDW_PROF.lugar('titas')}. Quando os titãs perderam a guerra, Cronos e os seus foram derrubados para baixo do mundo e ficaram ali. A carne virou pó há eras; sobraram os ossos, as placas de armadura de bronze e as lascas da foice de adamantita que os cortou. Os filhos menores deles ainda vivem entre os ossos, os carniceiros vêm de toda parte roer o que resta, e no fundo um titã não morreu de todo.`,
  titasEntrada: 'Dois tubos frios descem da camada de cima até o teto do Campo das Costelas e saem pela órbita de um crânio de titã enterrado: o herói desce pela escada de ossos amarrados por dentro do crânio, e no chão da caixa craniana fica a câmara de pouso (16 x 6, duas lamparinas de tutano, sem monstros perto). Volta-se pela mesma escada.',
  titasSom: 'Sem melodia: vento seco e largo, o assobio do vento nos ossos ocos (o tom muda ao acaso), osso velho rangendo longe com muito eco, pó escorrendo perto, abutre e hiena ao longe, raros. Perto do Leito do Titã, um batimento muito grave a cada 12 s, até ele morrer.',
  titasEscalada: 'O corpo do Último Titã é terreno que se mexe: dá para pisar nele, subir pelo líquen, pelas rachaduras e pelas placas de bronze (como numa corrente) e ser carregado quando ele se move. Quando ele se sacode, quem está agarrado segura e gasta vigor; quem está solto escorrega. Depois que ele morre, o corpo vira blocos de verdade (osso, bronze e osso esponjoso) que se pode escalar e minerar.',
  titaOnde: 'O Leito do Titã, uma caverna de 140 x 56 no Leito do Último, do outro lado do mundo em relação às Fendas Retas. O titã está deitado de bruços com a cabeça para a direita e metade do corpo enterrada no pó: aparecem o braço estendido com a mão aberta no chão, as costas como um morro e a cabeça apoiada no chão. A lâmina da foice de Cronos está cravada na parede do fundo. Ao pisar na mão dele (ou chegar perto), os olhos abrem e os Dedos Cerrados fecham as duas portas; a câmera se afasta um pouco durante a luta. A vida dele é a soma das quatro lascas.',
  titaFases: [
    ['Fase 1, o braço.', 'Só o braço e a cabeça se mexem. Tapa: a mão sobe, a sombra dela cresce no chão e ela bate. Varrida: o pó levanta ao longo do braço e ele passa rente ao chão; pula-se por cima ou sobe-se no próprio braço. Sopro de pó: o peito incha e um cone de pó sai pelo nariz e empurra. Lascas do pulso e do ombro.'],
    ['Fase 2, ele se ergue.', 'Ele se apoia no cotovelo e as costas viram uma parede de escalada. A cada 8 a 10 s se sacode (as costelas rangem e o pó cai, 1 s antes): quem está agarrado segura e gasta vigor, quem está solto cai. Abutres descem do teto. A lasca das costelas fica no alto das costas.'],
    ['Fase 3, a cabeça.', 'Ele procura o herói com a cabeça: Testada (a cabeça recua devagar e desce) e Brilho dos olhos (uma faixa no chão aparece fraca, 1 s, e depois queima; em cima do corpo dele não pega). Depois de uma testada, sobe-se pelos cabelos de líquen até a nuca. A última lasca derruba o titã de vez.']
  ],
  antigos: `${UDW_PROF.lugar('antigos')}. Antes dos titãs e dos dragões, um povo sem nome construiu aqui embaixo uma cidade medida com régua: pedra lisa sem emenda, ângulos perfeitos, prédios pendurados do teto, máquinas que ainda giram para ninguém. Eles sumiram; os vigias e os construtos continuam cuidando da cidade vazia. No fundo, uma estrela caiu há eras e abriu uma cratera de vidro: o metal dela é o Ferro Estelar.`,
  antigosEntrada: 'Debaixo de dois poços do fundo da camada de cima, a rocha em volta da boca vira laje e o poço continua como o Poço dos Antigos: um poço quadrado de 4 de largura, paredes de laje com glifos, a escada embutida correndo por ele, que desce uns 24 blocos e abre no teto da câmara de pouso, uma sala de laje de 10 x 6 com duas lâmpadas de glifo onde nenhum monstro nasce. Da porta dela sai o primeiro terraço. Volta-se pela mesma escada.',
  antigosSom: 'Sem melodia: um grave quase parado e um zumbido fino de lâmpada; cliques secos de mecanismo, sempre no mesmo intervalo; pedra lisa deslizando sobre pedra e um cristal esfriando; nas Máquinas, um pistão grave; na Cratera, estalos e um ronco baixo. Eco longo e limpo, de salão vazio.',
  antigosGravidade: 'Só dentro das Salas de Prumo e da sala do Arquiteto, que são quadradas. Golpear o Prumo (o peso no pedestal no meio da sala) faz o peso balançar e as setas das paredes girarem por 1 s; então a sala inteira gira 90° no sentido do relógio, com o herói, os monstros e os itens dentro, e a câmera gira junto em 0,6 s. O chão fica sempre embaixo na tela: andar, pular, escada, ataque, escudo e mineração seguem iguais. As salas são iguais nas 4 direções, só o veio de ferro estelar muda de lugar, e ele só fica ao alcance com a sala de cabeça para baixo. A direção de cada sala fica salva.',
  arquitetoOnde: 'A Sala que se Monta, na Cratera da Estrela, do outro lado do mundo em relação às descidas: um miolo quadrado de 30 x 30 em 5 x 5 módulos de 6 x 6, com moldura de ladrilho de prumo e uma porta no pé de cada parede do lado, no fim de um corredor que sai de uma antessala de vidro. Ao entrar, a Grade de Luz fecha as duas portas. Se o herói sair ou morrer, a luta reinicia (arranjo inicial, gravidade para baixo, vida cheia). Fica salvo que o Arquiteto morreu; depois disso a sala fica no arranjo inicial e quebra como as outras.',
  arquitetoFases: [
    ['Fase 1.', 'Gravidade para baixo. Régua: uma linha de parede a parede na altura do herói (0,8 s) e uma lâmina de luz corre por ela. Esquadro: dois muros em L sobem em volta do herói (o contorno aparece antes) e prendem por 4 s. Prumo: um fio desce do teto sobre o herói (0,8 s) e o peso cai por ele.'],
    ['A virada (60%).', 'Ele levanta os quatro braços, as bordas dos módulos que vão sair acendem com setas (1,5 s), os módulos trocam de lugar deslizando (1,2 s) e a sala gira: a gravidade vai para a esquerda e a câmera gira junto.'],
    ['Fase 2.', 'Compasso: um círculo riscado em volta do herói por 1 s, depois o anel queima. Chama 2 Cubos Errantes com meia vida. A cada 10 s um módulo troca de lugar, com aviso. Régua e Prumo continuam.'],
    ['Fase 3 (25%).', 'O peito abre e mostra o núcleo: golpes por trás levam 50% a mais. A gravidade vai para cima e, a cada 12 s, vira mais 90° (2 s antes as setas giram e um ronco sobe). Planta: o desenho do próximo arranjo aparece por 2 s e os módulos encaixam nele de uma vez. O módulo onde o herói está nunca se mexe.']
  ],
  abismoEntrada: 'As duas descidas vêm das saídas da camada de cima (hoje as Valas dos Caídos, no fundo do Campo da Última Guerra) e caem num salão em ruína nos Portões de Cinza. Volta-se pela mesma escada.',
  abismoSom: 'Um ronco grave e o fogo ao fundo; correntes balançando nos Portões; lava borbulhando e estalando nos Rios de Fogo; gotas de sangue e um coração batendo nas Entranhas; sussurros no Trono do Caos e, bem longe, alguma coisa grande rugindo.',
  escuro: `${UDW_PROF.lugar('escuro')}, o fundo do mundo. Antes do mundo só havia a Escuridão; os Acendedores desceram até aqui com fogo e acenderam braseiros para segurá-la embaixo, e o mundo inteiro foi construído por cima dessa linha de fogo. Os braseiros se apagaram um por um e ela voltou a subir: é por isso que cada camada é mais escura que a de cima. Aqui não há luz nenhuma de fundo: a luz é o recurso, a arma e o escudo. O metal daqui é o noctírio.`,
  escuroEntrada: 'Dois poços redondos descem das duas Escadarias do Fundo das Ruínas dos Acendedores, com braseiros ladeando a boca. Descendo, a pedra perde a cor; uma corrente dos Acendedores desce inteira até um Posto de pouso na Borda Apagada, um anel de pedra lavrada com o único braseiro eterno da camada, onde nenhum monstro nasce. Volta-se pela mesma corrente.',
  escuroSom: 'Quase silêncio: um ruído grave muito baixo e um eco enorme, tudo parece longe. Uma gota que ecoa tempo demais; um fôlego longe, que para quando o herói para; uma pedra caindo num poço que nunca bate no fundo (Breu); fibras rangendo (Raízes); um tom grave quase inaudível que some perto de um braseiro aceso (Fundo); vento frio pelas frestas (Borda). Perto de um braseiro aceso, o estalo do fogo, o único som acolhedor. Na sala do Nox, nada.',
  escuroLuz: 'Tocha posta na camada vira tocha morta depois de 90 s (20 s na sala do Nox), e os monstros apagam as tochas. Os braseiros apagados acendem só com um lume-fátuo, a chama azul que flutua pelo bioma (encoste nela para pegar; o acendedor oco também solta): tecla de usar perto do braseiro e ele acende azul, e nenhum monstro apaga. Tocha não acende braseiro nem as piras da sala do Nox, que também pedem lume-fátuo. A Rota dos Acendedores, uma linha de braseiros a cada 25 a 35 blocos com um lume-fátuo no caminho de cada um, liga cada Posto à sala do Nox. Luz forte (0,6 ou mais) queima as criaturas da sombra. O mapa desta camada esquece: o que não está aceso some do mapa em 2 minutos, menos a até 14 blocos de um braseiro aceso. O breu vivo cresce no escuro e recua na luz; a laje de penumbra só segura quem pisa com luz em cima dela.',
  cidade: `${UDW_PROF.lugar('cidade')}. Uma cidade inteira que a terra engoliu de uma vez, torta e meio alagada: as cisternas no alto, as ruas e casas no meio, o palácio e a torre do sino no fundo, e no meio do Bairro do Poço o Grande Poço, que já estava ali antes da cidade. É a única camada com gente viva: saqueadores atrás da prata e o culto do Poço. Eles sobem escadas, fogem, bebem poção, armam armadilhas e fecham passagens. Toda luz é feita por gente: velas, lanternas e fogueiras. O metal daqui é a prata.`,
  cidadeEntrada: 'As duas descidas vêm das Valas de Escoamento do fundo do Brejo das Bruxas e furam o teto abobadado de dois salões de cisterna, com uma escada de corda dos saqueadores descendo até uma borda de pedra seca. No pé de cada uma, a casa do guarda da cisterna, de pedra seca e com uma lanterna acesa, onde nenhum monstro nasce. Volta-se pela mesma escada.',
  cidadeSom: 'Ar parado de cidade vazia, com o eco mais longo do jogo, e um vento que passa pelos becos. Ao longe, uma badalada grave e rara, uma porta batendo, passos correndo num telhado, moedas caindo, uma tosse, uma voz baixa sem palavras. Nas Cisternas, água negra batendo nas colunas; nas Ruas, madeira estalando; no Bairro, um canto de muitas vozes numa nota só, que some perto do Poço; no Palácio, eco de mármore.',
  cidadeAgua: 'As cisternas, os esgotos, as partes baixas dos quarteirões e a Cisterna Funda da Torre do Sino têm água negra (a água do jogo, igual em todas as camadas, só mais escura). Dá para nadar; debaixo da água o fôlego dura 10 segundos e depois a vida cai. Equipamento pesado afunda o herói. O Grande Poço não é saída: desce até uma tampa preta que não quebra, e lá não há nada.',
  floresta: `${UDW_PROF.lugar('floresta')}. Uma floresta inteira que a terra engoliu há milênios e que virou pedra sem cair: troncos de granito em pé do chão ao teto, raízes que viraram túneis e copas de folhas de cristal. É a única camada que foi viva e nunca foi construída, e o único lugar com cristal em toda parte. Os bichos que ficaram viraram pedra também, e alguns ainda se mexem. O metal daqui é a platina.`,
  florestaEntrada: 'Debaixo das duas adegas do Palácio do Sino, na Cidade Afundada, uma raiz-mestra petrificada fura a rocha de cima a baixo. Por dentro dela desce um poço com degraus cortados na própria raiz até uma câmara de pouso de 12 x 6 com duas drusas acesas, onde nenhum monstro nasce. Volta-se subindo os mesmos degraus.',
  florestaSom: 'Um vento grave e oco, como ar passando por troncos, e um eco longo e frio. Cristal tilintando em notas soltas (mais na Mata), pedra estalando, casca rangendo, gotas caindo. No Bosque, pedrinhas escorrendo; nas Raízes, gotas de seiva e um gemido grave de madeira; na Clareira, cascos ao longe, que somem quando o Cervo morre.',
  florestaLuz: 'Nenhuma chama própria: a luz vem do cristal, fria e verde-azulada na folhagem e nos geodos, branca-azulada nas drusas, verde-limão na seiva. A folhagem de cristal é sólida para andar, mas a luz passa por ela, e as copas acendem quando o herói chega com tocha. A única luz quente é a brasa da fogueira apagada dos anões.',
  florestaGeodo: 'Bolhas de 3 a 5 blocos com casca de granito e miolo de cristal, três vezes mais comuns na Mata de Cristal. Cada miolo solta de 1 a 3 pedras preciosas, sorteadas pela tabela da camada. A folhagem de cristal às vezes solta uma Folha de Cristal.',
  fungo: `${UDW_PROF.lugar('fungo')}. Antes dos mineiros do cobalto, a colônia de Ferroalto cavou aqui atrás da esporita, um metal verde-azulado que o micélio deixa na rocha, e acordou um fungo que tomou as galerias, os bichos e as pessoas. É a camada viva: a rocha, o chão, a água e a parede da chefe crescem e soltam esporos, e a luz é fria e vem dos próprios cogumelos. O metal daqui é a esporita.`,
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
  cavernas: 'O mundo antigo de cavernas (Cavernas Rasas e Profundas) continua no código, mas está desligado. As cavernas de hoje são outras (js/52 a 57).',
  // O Brejo das Bruxas (docs/camadas/06-brejo-bruxas.md)
  brejo: `${UDW_PROF.lugar('brejo')}. Abaixo do micélio a rocha vira turfa encharcada: um pântano subterrâneo de água parada e preta. As bruxas que fugiram das fogueiras lá de cima fizeram aldeia aqui, em palafitas; os caçadores de bruxas vieram atrás, ergueram forcas e gaiolas, e o brejo engoliu todos. Quase todo inimigo é uma pessoa (a bruxa, o caçador, o enforcado, a lavadeira) ou o que as bruxas fizeram. O metal daqui é o ferro-do-brejo.`,
  brejoEntrada: 'As duas descidas das Minas Fúngicas caem cada uma numa câmara de pouso de tábua, de 16 x 6, com duas velas e uma escada de corda até o teto para voltar a subir. A saída para baixo são as duas Valas de Escoamento no fundo, do outro lado do Caldeirão.',
  brejoSom: 'Sem melodia, eco curto e abafado: gotas, bolhas e o chapinhar na Turfeira; madeira rangendo e tapas na água nas Palafitas; correntes das gaiolas e corvos no Patíbulo; sussurros e cantoria no Círculo.',
  brejoEstados: 'A lama prende o passo (anda a 70%, menos com as Botas de Atoleiro). A Lavadeira enrola o herói (não ataca, anda a 55%), a Mão de Glória paralisa quem olha para ela, a Bruxa da Vassoura e a Velha envenenam, e a Sanguessuga gruda e prende. O Chapéu de Caçador corta pela metade o tempo dos feitiços. A morte limpa tudo.',
  velhaOnde: 'O Caldeirão, uma gruta de 110 x 44 no fundo do Círculo de Pedras, do outro lado do mundo em relação às descidas, sem trono: duas margens secas de turfa nas pontas, água preta funda entre elas e, no meio, uma ilhota com o caldeirão de ferro sobre um fogo de turfa; duas plataformas de tábua sobre estacas cruzam a água. Entrando, o Espinheiro da Velha fecha as duas portas.',
  velhaFases: [
    ['Fase 1, na ilhota.', 'Mexe o caldeirão e o vapor muda de cor (1,2 s): verde, a água da gruta fica venenosa 6 s; preto, a água sobe 2 linhas e cobre a ilhota 5 s (nas plataformas e margens fica-se seco); branco, a névoa e dois corvos. Joga conchadas de caldo fervendo em arco (0,7 s) e, de perto, a unhada (0,55 s).'],
    ['Fase 2, o pilão (60%).', 'Voa. Para em cima do herói, a sombra cresce no chão (1 s) e ela cai com o pilão; a onda de lama corre para os lados (pule). A vassoura: desce à altura do herói, a palha faísca (0,7 s) e varre a gruta de lado.'],
    ['Fase 3 (30%).', 'O caldeirão transborda (1,2 s, a tampa batendo) e o caldo corre pelo chão da ilhota às margens: fique nas plataformas ou pule alto. As mãos dos afogados saem de um círculo de bolhas sob o herói (0,8 s) e prendem um instante.']
  ],
  // A Necrópole do Rei Eterno (docs/camadas/14-necropole.md)
  necropole: `${UDW_PROF.lugar('necropole')}. A cidade dos mortos de um reino inteiro: quando o Rei Eterno se recusou a morrer, mandou enterrar o reino com ele, rua por rua, e levantou o exército para não ficar sozinho. Avenidas de mausoléus, columbários de nichos sem fim, quartéis onde a legião espera de pé e, no fundo, a cripta real. É o espelho escuro da Catedral: aqui os mortos têm posto, ordem e senhor. A luz é a chama de alma, verde-pálida. O metal daqui é a sepulcrita.`,
  necropoleEntrada: 'As duas descidas saem das Fendas Retas do Ossário dos Titãs: um poço de 3 de largura com escada de ferro chumbada e um patamar no meio, que cai dentro da capela da guarda (16 x 6, mármore e laje, duas lanternas de alma acesas), onde nenhum monstro nasce. A saída para baixo são as duas Escadas dos Mortos no fundo da Cripta, com uma corrente até a última linha.',
  necropoleSom: 'Sem melodia: ar parado e frio, eco longo de pedra. Sussurros (mais nos Columbários), correntes rangendo, o sino de finados raro nas Avenidas, laje arrastando, passos em marcha nos Quartéis e, na Cripta, um canto baixo e o coração do rei batendo devagar enquanto ele vive.',
  reiEternoOnde: 'O Salão do Relicário, 120 x 44 na Cripta Real, do outro lado do mundo em relação às descidas: abóbada, chão de mármore real com oito lajes de cova, quatro beirais de laje com escadas de ferro e, no meio, o Coração-Relicário preso por três correntes de alma a três âncoras. Sem trono: o rei não senta. Entrando, o Rastrilho de Ossos fecha as duas portas.',
  reiEternoFases: [
    ['O Coração-Relicário.', 'Enquanto uma corrente segura, o golpe resvala no rei. Quebradas as três âncoras, o coração cai e ele ajoelha, exposto por 10 s ou até perder um terço da vida; depois refaz as âncoras em outros lugares (chão, beirais baixos, beirais altos). Três ciclos, que são as três fases.'],
    ['Os golpes.', 'Lança de Alma (uma linha fina segue o herói 0,7 s e trava), Mão da Cova (círculos claros no chão por 1 s, depois mãos de osso prendem os pés), Foice (ergue atrás da cabeça e varre rente ao chão: pule) e Levantar os Mortos (legionários sobem das lajes de cova mais perto do herói, até três).'],
    ['Fase 3.', 'As Paredes de Osso: a linha verde acende no chão 1,2 s e duas paredes de osso fecham das pontas do Salão até 26 blocos de cada lado, seguram 5 s e voltam. Empurram, não machucam. A foice fica mais rápida.']
  ],
  // A Prisão dos Deuses (docs/camadas/16-prisao-deuses.md)
  prisao: `${UDW_PROF.lugar('prisao')}. Antes de todos os povos, os deuses antigos desceram até aqui para prender o que não podia morrer: abriram abismos e atravessaram neles correntes do tamanho de pontes, cavaram celas na pedra viva, puseram carcereiros de pedra de guarda e foram embora. Os prisioneiros continuam aqui. É a única camada onde o que está preso é o perigo: argolas, grilhões, grades arrebentadas de dentro para fora, gigantes de joelhos. O metal daqui é o ferro divino.`,
  prisaoEntrada: 'As duas descidas saem das salas de descida da Cidade dos Antigos: o Poço do Carcereiro, de 4 de largura e com escada de ferro, até uma câmara de pouso de 10 x 6 com ícor pingando do teto, onde nenhum monstro nasce. A saída para baixo são as duas Gargantas no fundo, poços de 3 de largura com a corrente até a última linha.',
  prisaoSom: 'O ambiente de fundo é o padrão das camadas; os bichos têm passos de pedra, baques, chocalho de corrente e rangidos, e o Lobo rosna, uiva e arrebenta as correntes.',
  loboOnde: 'A Cova das Correntes, 62 x 24 no Tártaro, do outro lado do mundo em relação às descidas: chão de laje reto, moldura de bronze, uma porta no pé de cada lado (a grade de bronze as fecha na luta). Duas correntes partidas pendem do teto e servem de subida; as outras duas, uma de cada parede, seguram a coleira do Lobo.',
  loboFases: [
    ['Fase 1 (100% a 66%).', 'As duas correntes prendem o lobo no meio, a 12 blocos para cada lado. Mordida (agacha rosnando 0,55 s e dá o bote), Uivo (se empina 0,8 s e uma onda corre no chão para os dois lados: pule) e Pedra (cava 0,7 s, a marca acende sob o herói e a pedra cai ali).'],
    ['Fase 2 (66%).', 'Puxa a corrente da esquerda (2 s sem levar dano) e ela arrebenta. Agora chega à parede da direita, e a ponta que ficou na coleira vira chicote: ergue a corrente (0,6 s, um arco vermelho mostra o alcance) e varre.'],
    ['Fase 3 (33%).', 'A da direita arrebenta: livre na sala inteira e mais rápido. Salto (uma sombra vermelha marca o chão debaixo do herói 0,7 s, ele cai ali e solta ondas curtas), uivo duplo e duas pedras de cada vez.']
  ],
  // O Campo da Última Guerra (docs/camadas/17-campo-guerra.md)
  guerra: `${UDW_PROF.lugar('guerra')}. O lugar onde anjos e demônios lutaram a última guerra antes de o Inferno ser fechado embaixo: um campo de batalha sem fim que a terra engoliu, com as armas ainda fincadas no barro e os caídos dos dois lados ainda de pé. Tudo foi feito por gente (trincheiras, paliçadas, bastiões) e largado no meio da luta; os monstros são soldados que andam em formação, um protegendo o outro. O metal daqui é a belicita.`,
  guerraEntrada: 'As duas descidas vêm das saídas da camada de cima: um poço de 4 de largura com escada de cerco, que abre no teto de uma câmara de pouso de 14 x 6 de cantaria, acesa por duas auréolas caídas e com uma espada fincada, onde nenhum monstro nasce. A saída para baixo são as duas Valas dos Caídos no fundo, valas de 5 de largura com escada de cerco até a última linha.',
  guerraSom: 'Vento largo e baixo, assobio e corvos nas Lâminas e no Estandarte; um coro sem palavras e o sino raro nos Bastiões; o ronco do fogo, correntes e rachaduras na Brecha; cascos distantes e o gemido dos caídos no fundo.',
  generalOnde: 'O Campo do Estandarte, um oco de 100 x 30 com teto em arco no fundo da camada, do outro lado do mundo em relação às descidas: chão de ferro de batalha, dois baluartes de cantaria com escada de cerco e, no meio, O Estandarte, a haste com o pano dourado dos anjos presa por duas cordas a duas estacas. Sem trono. Entrando, a muralha de escudos fecha as duas portas.',
  generalFases: [
    ['Fase 1, o estandarte de pé.', 'O General leva 70% menos dano e não passa de 60% da vida. Corte (a espada sobe 0,55 s) e Investida (agacha 0,7 s e a marca corre pelo chão). A cada 8 s o estandarte levanta um Cavaleiro Caído ou um Arqueiro da Chuva de um pilar de luz (até 3). Para derrubar o estandarte, quebre as duas estacas e depois o pé da haste.'],
    ['Fase 2, o estandarte caído.', 'Ele arranca o estandarte do chão (1,6 s) e luta com ele como alabarda: Varrida larga e Investida. A cada 14 s vem A Carga: a corneta soa, marcas de casco cobrem o chão 1,6 s e a cavalaria espectral atravessa o Campo rente ao chão; suba num baluarte ou pule.'],
    ['Fase 3 (33%).', 'Finca o estandarte em chamas no meio do Campo e volta à espada. Salto do Juízo (a sombra cresce 1 s debaixo do herói e a onda corre para os lados), As Fendas (três linhas acendem no chão 1 s e estouram em fogo, a cada 4,5 s) e A Carga a cada 18 s.']
  ],
  // As Ruínas dos Acendedores (docs/camadas/19-ruinas-acendedores.md)
  acendedores: `${UDW_PROF.lugar('acendedores')}. A cidade do povo que acendeu os braseiros para segurar a Escuridão: faróis para vigiar o escuro, ruas de laje das carroças de carvão, templos da chama e, no fundo, a Fornalha do Mundo, que alimentava todos os braseiros. Hoje quase tudo está apagado; os que ficaram enlouqueceram no escuro, e o fogo que restou virou bicho. É a última camada com luz que alguém acende. O metal daqui é a ardorita.`,
  acendedoresEntrada: 'Um poço de 3 de largura desce de cada um de dois templos do Abismo até a Casa da Guarda, a câmara de pouso de 16 x 6 de pedra lavrada acesa pelas fendas de brasa da lareira, onde nenhum monstro nasce. A saída para baixo são as duas Escadarias do Fundo, salas com um poço de 3 até a última linha; a Escuridão põe as entradas dela debaixo delas.',
  acendedoresSom: 'Reverberação longa. O ronco baixo, o vento pelas ruas vazias e o fole da Fornalha; estalos de brasa, o sino de farol batendo com o vento, correntes de lampadário e sussurros de reza nos Templos, um coração de fogo batendo na Fornalha, uma porta batendo nas Ruas.',
  acendedoresEstados: 'A queimadura tira vida aos poucos por um tempo curto, e as poças de cera do Círio Vivo e do Alado de Cera prendem o passo.',
  acendedorOnde: 'A Fornalha do Mundo, uma caixa abobadada de tijolo de 112 x 46 do outro lado do mundo em relação às entradas, sem trono. O chão é a grelha de ferro sobre o poço de brasa, com três lugares de pedra (o estrado do Grande Braseiro e dois pedestais); plataformas de pedra em dois andares dos lados, com correntes; e quatro lanternas de bronze penduradas do teto. Cada lanterna acesa corta 15% do dano que ele toma; derrubada a até 2 blocos dele, queima (12% da vida e 2 s tonto). A Grade Acesa fecha as duas portas.',
  acendedorFases: [
    ['Fase 1.', 'Varada (a ponta da vara fica branca 0,6 s e ele estoca de baixo para cima, 4,5 blocos) e Brasa Lançada (uma marca no chão debaixo do herói 0,9 s; a brasa cai ali e o chão queima 3 s).'],
    ['Fase 2 (2/3).', 'Também a Maré de Brasa: as grelhas acendem do meio para fora (1,5 s) e queimam 3 s. Só a pedra (estrado, pedestais, plataformas) é segura.'],
    ['Fase 3 (1/3).', 'O Grande Braseiro apaga e a sala escurece. Ele salta de plataforma em plataforma: um círculo de brasa marca onde vai cair (0,9 s) e a queda queima em volta.']
  ],
};

/* As camadas na ordem do jogo (LAYERS, js/129-camadas.js; revamp de 2026-10-21: 20 camadas de 5 níveis). Para cada uma:
   o prefixo das constantes, o nome curto da aba, a chave das faixas e dos minérios em UDW_TXT, o chefe (com o lugar e as
   chaves do texto de onde fica e das fases) e os monstros que só aparecem em situações especiais. A ordem e os níveis
   NÃO ficam aqui: saem do LAYERS (camada N: monstros 5N-4 a 5N-1, chefe 5N). */
const UDW_CAMADAS_DEF = {
  cavernas: { pre: 'CV', curto: 'Cavernas', fx: 'cvFaixas', mi: 'cvMinerios', lead: 'caverna', chefe: ['maeteia', 'Câmara do Ninho, no fundo do Ninho', 'teiaOnde', 'teiaFases'], extra: { filhote: 'Só sai dos ovos durante a luta com a Mãe-Teia' } },
  catedral: { pre: 'CB', curto: 'Catedral', nome: 'A Catedral Abandonada', fx: 'faixas', mi: 'minerios', chefe: ['rei', 'Sala do trono, na Nave ou no Claustro', 'reiOnde', 'reiFases'] },
  gelo: { pre: 'IC', curto: 'Gelo', fx: 'icFaixas', mi: 'icMinerios', chefe: ['yetiancestral', 'Trono de Gelo, no Coração do Inverno', 'yetiOnde', 'yetiFases'] },
  mina: { pre: 'MN', curto: 'Mina', fx: 'mnFaixas', mi: 'mnMinerios', chefe: ['reigoblin', 'Oficina da Escavadeira, nas Fornalhas Esquecidas', 'rgOnde', 'rgFases'] },
  fungo: { pre: 'FG', curto: 'Fungo', fx: 'fgFaixas', mi: 'fgMinerios', chefe: ['maeesporo', 'Gruta da Mãe, no Coração do Micélio', 'maeOnde', 'maeFases'], extra: { aguaviva: 'Nasce só na água das Grutas Alagadas e do Coração' } },
  brejo: { pre: 'BJ', curto: 'Brejo', fx: 'bjFaixas', mi: 'bjMinerios', chefe: ['bjvelha', 'O Caldeirão, no fundo do Círculo de Pedras', 'velhaOnde', 'velhaFases'], extra: { bjsangue: 'Nasce só na água das bacias e lagoas' }, extras: [['Estados', 'brejoEstados']] },
  cidade: { pre: 'CD', curto: 'Cidade', fx: 'cdFaixas', mi: 'cdMinerios', chefe: ['sineiro', 'Torre do Sino, no Palácio do Sino', 'sineiroOnde', 'sineiroFases'] },
  floresta: { pre: 'FP', curto: 'Floresta', fx: 'fpFaixas', mi: 'fpMinerios', chefe: ['cervo', 'Clareira dos Troncos Gigantes, na Clareira dos Gigantes', 'cervoOnde', 'cervoFases'] },
  anoes: { pre: 'AN', curto: 'Anões', fx: 'anFaixas', mi: 'anMinerios', chefe: ['autoforja', 'A Grande Forja, nas Forjas de Runas', 'autoforjaOnde', 'autoforjaFases'] },
  elfos: { pre: 'EL', curto: 'Elfos', fx: 'elFaixas', mi: 'elMinerios', chefe: ['dama', 'O Espelho da Lua, nas Grutas da Lua', 'damaEspelhoOnde', 'damaFases'], extra: { fatuo: 'Vem em grupos de 3 a 5' } },
  mar: { pre: 'MS', curto: 'Mar', fx: 'msFaixas', mi: 'msMinerios', chefe: ['leviata', 'A Nau Sem Nome, no mar aberto das Praias Negras', 'leviataOnde', 'leviataFases'], extra: { polvo: 'Some na cor da rocha e solta tinta quando apanha', ermitao: 'Fecha a concha e não leva dano por 2 s' } },
  dragao: { pre: 'DG', curto: 'Dragão', fx: 'dgFaixas', mi: 'dgMinerios', chefe: ['cinzarel', 'A Cratera do Tesouro, no Leito de Ouro', 'cinzarelOnde', 'cinzarelFases'] },
  titas: { pre: 'TT', curto: 'Titãs', fx: 'ttFaixas', mi: 'ttMinerios', chefe: ['tita', 'O Leito do Titã, no Leito do Último', 'titaOnde', 'titaFases'], extra: { ttLasca: 'Só na luta com o Último Titã: as quatro lascas da foice cravadas no corpo dele' } },
  necropole: { pre: 'NC', curto: 'Necrópole', fx: 'ncFaixas', mi: 'ncMinerios', chefe: ['reiEterno', 'O Salão do Relicário, na Cripta Real', 'reiEternoOnde', 'reiEternoFases'], extra: { ncAncora: 'Só na luta com o Rei Eterno: as três âncoras das correntes do Coração-Relicário' } },
  antigos: { pre: 'AT', curto: 'Antigos', fx: 'atFaixas', mi: 'atMinerios', chefe: ['arquiteto', 'A Sala que se Monta, na Cratera da Estrela', 'arquitetoOnde', 'arquitetoFases'] },
  prisao: { pre: 'PD', curto: 'Prisão', fx: 'pdFaixas', mi: 'pdMinerios', chefe: ['loboatado', 'A Cova das Correntes, no Tártaro', 'loboOnde', 'loboFases'] },
  guerra: { pre: 'GU', curto: 'Guerra', fx: 'guFaixas', mi: 'guMinerios', chefe: ['general', 'O Campo do Estandarte, no Último Estandarte', 'generalOnde', 'generalFases'], extra: { gu_estaca: 'Só na luta com o General Caído: as duas estacas das cordas do estandarte', gu_haste: 'Só na luta com o General Caído: o pé da haste do estandarte' } },
  abismo: { pre: 'AB', curto: 'Abismo', fx: 'abFaixas', mi: 'abMinerios', chefe: ['principecaos', 'Trono do Caos, no fundo do Abismo', 'principeOnde', 'principeFases'] },
  acendedores: { pre: 'AC', curto: 'Acendedores', fx: 'acFaixas', mi: 'acMinerios', chefe: ['ultimoAcendedor', 'A Fornalha do Mundo, no fundo da camada', 'acendedorOnde', 'acendedorFases'], extra: { acLanterna: 'Só na luta com o Último Acendedor: as quatro lanternas de bronze do teto' }, extras: [['Estados', 'acendedoresEstados']] },
  escuro: { pre: 'ES', curto: 'Escuridão', fx: 'esFaixas', mi: 'esMinerios', chefe: ['nox', 'O Escuro Total, no Fundo do Mundo', 'noxOnde', 'noxFases'], extra: { maofundo: 'Nasce só nos poços sem fundo dos Grandes Vãos', traca: 'Vem em bandos de 5 a 8' } }
};
// as camadas na ordem do jogo, com a posição e os níveis vistos (o 129 decide; camadas sem entrada aqui aparecem só com o nome)
const UDW_CAMADAS = () => (typeof LAYERS === 'undefined' ? [] : LAYERS).map((L, k) => Object.assign({ id: L.id, nome: L.nome, curto: L.nome, pre: '' }, UDW_CAMADAS_DEF[L.id] || {},
  { pos: k + 1, nvLo: 5 * (k + 1) - 4, nvHi: 5 * (k + 1) - 1, nvChefe: 5 * (k + 1), de: UDW_PROF.top(L.id), ate: UDW_PROF.fim(L.id) }));
