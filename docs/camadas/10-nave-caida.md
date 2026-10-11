# A Nave Caída: ficha de implementação

A décima camada, debaixo da Colmeia e em cima do Abismo, de 1674 a 1860 m. Pedido do Jonathan (2026-10-11), a partir das figurinhas de ET dele: homenzinhos verdes, discos voadores com feixe arco-íris, um astronauta, um foguete, o olho com rastro arco-íris, o planeta com anel e a gosma verde. Monstros de nível 21 a 22, metal novo Xenita, chefe O Olho-Cometa (nível 23).

**O que a diferencia:** é a única camada que **não é deste mundo** e a única **cheia de luz**. Todas as outras ficam mais escuras ao descer; aqui o neon da nave acende tudo em verde, rosa, ciano e violeta, como um fliperama enterrado. A Colmeia de cima é morna, curva e orgânica; o Abismo de baixo é fogo e carne; a Nave é metal liso, linhas retas, vidro e luz fria. É a camada mais colorida do jogo e a mais estranha.

## 1. Identidade

- **Faixas:** A Cratera de Impacto, O Casco, Os Laboratórios, O Núcleo.
- **Conceito:** há eras uma nave dos Visitantes caiu do céu. Furou a terra como uma bala e só parou aqui, abaixo de onde a Colmeia cavaria um dia. O reator nunca apagou. Os Visitantes, homenzinhos verdes de olhos pretos e enormes, continuam vivendo dentro dela e continuam fazendo o que vieram fazer: **abduzir**. Os discos sobem pelas rachaduras e levam bichos, gente e coisas das camadas de cima para os laboratórios. Por isso há um astronauta aqui embaixo, foguetes quebrados, cápsulas com aranhas, mortos e goblins dentro, e uma gosma verde que escorre de tudo. No núcleo, num planetário onde a nave ainda projeta o céu de casa, vive o Olho-Cometa, a mente da nave.
- **Sensação:** maravilha e medo ao mesmo tempo. Tudo é bonito, colorido, zumbindo, e tudo está olhando para o herói. Um parque de diversões abandonado que ainda está ligado.
- **Referências:** as figurinhas do Jonathan (o adesivo de ET, o disco com o feixe arco-íris, o olho-cometa, o planeta com anel), Toy Story (os ETs da garra), Mars Attacks!, Destroy All Humans, o neon de Hotline Miami, Metroid (a Frigate Orpheon), Hollow Knight (a Cidade das Lágrimas pela luz).

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 49 | A Cratera de Impacto | 1674 a 1720 | Cera Real da Colmeia afinando, Vidro de Impacto, Escória | onde a nave rasgou a rocha: crateras de vidro verde, destroços do casco enfiados na pedra, cápsulas de fuga caídas, o foguete quebrado, poças de gosma |
| 50 | O Casco | 1720 a 1772 | Chapa do Casco, Grade, Painel de Neon | os corredores da nave: retos, de 4 de altura, com tubos de neon no teto; hangares de discos; as Salas sem Peso; elevadores de feixe |
| 51 | Os Laboratórios | 1772 a 1824 | Liga Alienígena, Vidro de Laboratório, Gosma | as salas brancas e violeta das abduções: cápsulas de espécime, mesas de exame, tanques de gosma, a Galeria dos Espécimes |
| 52 | O Núcleo | 1824 a 1860 | Metal do Reator, Cristal de Plasma | o reator arco-íris, os condutos de plasma, o Planetário do Olho-Cometa, os dois Rasgos no Casco para o Abismo |

- **Monstros:** nível 21 na metade de cima e 22 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, mas nunca passam de 22 (`layerLvl(layerLo('nave'), d)`).
- **Entrada:** as duas descidas saem dos dois Escorredouros de Mel da Colmeia (`cmExits`). O mel acaba onde a pedra virou vidro: o poço continua como um **tubo de chapa rasgada** de 3 de largura, com a **Escada de Serviço** (`NV_ESCADA`, neon) inteira por 20 a 26 fileiras, até a Cápsula de Pouso.
- **Câmara de pouso:** ao pé de cada escada, uma **Cápsula de Pouso** de 12 x 6: piso de grade, paredes de casco, a luz de emergência da nave acesa (dois tubos de neon), sem monstro. Reservada para os pontos de volta.
- **Saída:** dois **Rasgos no Casco** no chão do Núcleo, a pelo menos `WW / 3` um do outro e longe do Planetário: buracos onde o casco abriu na queda, a chapa dobrada para fora e o plasma vazando nas bordas, com a Escada de Serviço até a última fileira. As posições ficam em `nvExits`; o Abismo continua de lá (o 103 lê como `halls`).

## 3. Estrutura e geração (`js/245-nave-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo que é "por mundo" multiplica por `WSC`.

1. **Rocha por faixa.** A Cera Real da Colmeia afina por ruído nas primeiras 10 fileiras e vira Vidro de Impacto. A Cratera é Vidro de Impacto e Escória. Do Casco para baixo a massa é a própria nave: Chapa do Casco (com bolsões de Escória onde a queda amassou), Liga nos Laboratórios e Metal do Reator no Núcleo. As bordas entre faixas são por ruído.
2. **Salas por faixa:**

| Faixa | Espaços | Tamanho | Quantos |
|---|---|---|---|
| Cratera | crateras: tigelas de vidro com a borda de escória, o fundo com poças de gosma | 30 a 50 x 10 a 16 | 5 x `WSC` |
| Cratera | cavernas de impacto (autômato esparso na escória) e destroços do casco (retângulos de chapa enfiados tortos na rocha, ocos por dentro) | 8 a 16 x 5 a 8 | 8 x `WSC` |
| Casco | corredores retos de 4 de altura, piso de grade, teto de chapa com tubo de neon a cada 5 blocos | 40 a 90 de comprimento | 10 x `WSC` |
| Casco | hangares de discos: salas largas de teto alto, com plataformas de grade | 36 a 50 x 12 a 16 | 3 x `WSC` |
| Casco | Salas sem Peso: quadradas, piso e teto de painel de neon violeta, gravidade 35% | 14 a 18 x 14 a 18 | 2 x `WSC` |
| Laboratórios | laboratórios: salas brancas retas com parede de vidro numa das pontas | 20 a 30 x 8 a 11 | 7 x `WSC` |
| Laboratórios | a Galeria dos Espécimes: um corredor longo com cápsulas dos dois lados | 60 a 80 x 8 | 1 x `WSC` |
| Núcleo | salas do reator: redondas, cristal de plasma nas paredes, condutos | 18 a 26 x 12 a 16 | 5 x `WSC` |
| Núcleo | o Planetário (seção 7) | esfera de raio 22 | 1 |

3. **Ligações.** Corredores e túneis ligam as salas de cada faixa. Entre faixas, **elevadores de feixe**: um poço de 3 de largura com o emissor no chão e o feixe arco-íris (`NV_FEIXE`) subindo pelo meio. Quem entra no feixe flutua para cima (escala como corrente, mas sobe sozinho segurando W e desce devagar segurando S). Em todo desnível de 5 ou mais, Escada de Serviço ou Cabo pendurado (`NV_CABO`).
4. **Estragos.** A nave está caída de lado há eras: em 25% dos corredores o piso afundou e virou rampa de destroços; gosma verde escorreu e deixou Poças de Gosma (`NV_POCA`, deixa lento) no chão dos laboratórios e das crateras, nunca nos degraus de subida, nunca no Planetário nem no pouso.
5. **Minérios.** Carvão (`NV_O_CARVAO`) só na Escória, 30 veios x `WSC`. Xenita (`NV_O_XENITA`) no Vidro de Impacto, na Escória e na Liga, 26 veios x `WSC`, metade nos Laboratórios e no Núcleo.
6. **Alcance** a partir das duas Cápsulas de Pouso; `nvClimbFix` saindo do Planetário, de cada laboratório, de cada sala do reator e do pé dos Rasgos.
7. **Decoração de 1 bloco**, depois **correção estrutural** (escoras do chão ao teto), depois **objetos** (`NV_PROP_PLAN`).

## 4. Blocos (`js/241-nave-blocos.js`)

Ids 640 a 671 (fora da reserva do 00-geral: `NT` subiu de 640 para 672). Sólidos:

| Id | Constante | Nome | Uso | Solta | Luz |
|---|---|---|---|---|---|
| 640 | `NV_VIDRO_IMPACTO` | Vidro de Impacto | massa da Cratera; verde-garrafa escuro, liso, rachado em estrela | vidro_impacto | |
| 641 | `NV_ESCORIA` | Escória | bolsões; rocha preta derretida com rachaduras verdes acesas | escoria | fraca, verde |
| 642 | `NV_CASCO` | Chapa do Casco | massa do Casco; placas grafite com rebites e emendas | chapa_casco | |
| 643 | `NV_PAINEL_NEON` | Painel de Neon | paredes e tetos; chapa com faixas de neon (rosa, ciano, verde) | painel_neon | média, da cor da faixa |
| 644 | `NV_GRADE` | Grade | pisos e plataformas; grade de metal com o vão escuro | grade | |
| 645 | `NV_LIGA` | Liga Alienígena | massa dos Laboratórios; branco-perolado com reflexo violeta e rosa | liga | |
| 646 | `NV_VIDRO` | Vidro de Laboratório | paredes de vidro; ciano translúcido, passa luz | vidro_lab | |
| 647 | `NV_GOSMA` | Gosma Endurecida | crostas e tanques; verde-limão vivo, bolhas, escorre | gosma_verde | fraca, verde |
| 648 | `NV_PLASMA` | Cristal de Plasma | Núcleo; cristal com as 6 cores do arco-íris em faixas | nada | forte, arco-íris |
| 649 | `NV_REATOR` | Metal do Reator | massa do Núcleo; branco-violeta, quente, com linhas de energia | metal_reator | fraca, violeta |
| 650 | `NV_BARREIRA` | Barreira de Energia | portas do Planetário (só na luta; não quebra) | nada | média, rosa |
| 651 | `NV_O_CARVAO` | Veio de Carvão | na Escória | carvao | |
| 652 | `NV_O_XENITA` | Veio de Xenita | no vidro, na escória, na liga; cristais verde-neon que piscam | min_xenita | fraca, verde |
| 653 | `NV_RASTRO` | Rastro Arco-Íris | o caminho que o Olho-Cometa deixa; sólido por 4 s, nunca vai para o save | nada | forte |
| 654 | `NV_ANEL` | Anel Holográfico | o anel do planeta do Planetário; plataforma | nada | média, laranja |
| 670 | `NV_PLANETA` | Planeta Holográfico | o planeta do Planetário; listrado de vermelho e laranja como o adesivo | nada | fraca |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 655 | `NV_ESCADA` | Escada de Serviço | parede; escala como a escada da mina; degraus com neon ciano |
| 656 | `NV_CABO` | Cabo Pendurado | teto; escala como a corrente |
| 657 | `NV_NEON` | Tubo de Neon | teto; luz forte, a cor sai da posição (rosa, ciano, verde, violeta); pisca de vez em quando |
| 658 | `NV_GOTA` | Gosma Pingando | teto; a gota cai ao vivo, luz verde fraca |
| 659 | `NV_POCA` | Poça de Gosma | chão; deixa o herói lento (como a poça de mel), luz verde fraca |
| 660 | `NV_CAPACETE` | Capacete de Astronauta | chão; o visor reflete o neon |
| 661 | `NV_DESTROCO` | Destroço | chão; pedaço de chapa torta |
| 662 | `NV_FIACAO` | Fiação Faiscando | teto ou parede; solta faíscas ao vivo |
| 663 | `NV_PLANTA` | Planta Alienígena | chão; bulbo que acende e apaga devagar (luz rosa ou ciano) |
| 664 | `NV_HOLO` | Projetor de Holograma | chão; um planetinha com anel, uma estrela ou um disquinho girando em cima (luz ciano) |
| 665 | `NV_ESCORA` | Escora do Casco | do chão ao teto |
| 666 | `NV_ESTRELA` | Estrelinha de Neon | parede; a estrela de 4 pontas do adesivo, pisca |
| 667 | `NV_POTE` | Pote de Espécime | chão; um bichinho de camada de cima boiando |
| 668 | `NV_FEIXE` | Feixe do Elevador | o poço do elevador; arco-íris translúcido que sobe; escala e levanta (249) |
| 669 | `NV_EMISSOR` | Emissor de Feixe | chão do elevador; disco aceso |

Paredes de fundo (88 a 92): Rocha Fundida (`WNV_ROCHA`), Painéis do Casco (`WNV_CASCO`), Painéis de Laboratório (`WNV_LAB`), Reator (`WNV_REATOR`), Painel com Neon (`WNV_NEON`, as linhas de luz correndo por trás). Terceira camada (57 a 59): o **céu holográfico** que a nave projeta pelos rasgos (estrelas, uma galáxia, o planeta com anel ao longe), as **costelas da nave** (vigas curvas enormes) e os **tanques gigantes** (silhuetas boiando).

## 5. Objetos de cena (`js/242-nave-objetos.js`)

30 objetos com `nave: true` e o plano `NV_PROP_PLAN` (formato do `CM_PROP_PLAN`: `chao`, `teto`, `fundo`).

- **Cratera de Impacto:** cápsula de fuga caída e aberta (chão), o foguete vermelho quebrado, enfiado de bico na rocha (chão, o do adesivo), placa do casco enfiada torta (chão + fundo), antena quebrada faiscando (chão), cratera fumegante de gosma (chão, luz verde), bandeira de astronauta fincada (chão), pedaço de asa de disco (fundo).
- **O Casco:** disco voador estacionado (chão, o do adesivo, com a cúpula acesa), painel de controle piscando (chão + fundo), cartaz holográfico de neon com um ET acenando (fundo, luz), porta hexagonal fechada (fundo), ventilador grande girando (fundo, animado), luminária de neon pendurada (teto), escotilha com estrelas (fundo, mostra o céu holográfico), caixas de carga alienígenas (chão).
- **Os Laboratórios:** cápsula de espécime com uma criatura das camadas de cima dentro (chão + fundo, luz verde; a criatura varia: aranha, esqueleto, goblin, larva da colmeia, um morcego), mesa de exame com braços mecânicos (chão), tanque de gosma borbulhando (chão, animado, luz), microscópio alienígena (chão), quadro com o diagrama de um humano (fundo), lâmpada cirúrgica (teto), cérebro num pote (chão).
- **O Núcleo:** pilar de plasma arco-íris (chão + fundo, luz forte, animado), conduto de energia (fundo, animado), console do reator (chão), anel de contenção (fundo), cristal de plasma grande (chão, luz), olho de vigia pendurado (teto, segue o herói com a pupila).

## 6. Inimigos: os Visitantes e o que eles trouxeram (`js/243-nave-visitantes.js` e `js/244-nave-visitantes2.js`)

Família nova (ninguém no jogo é alienígena). Sem dano de contato genérico: só a Gosma Viva e os Olhudinhos usam `touch` (eles são o que encostam). Linha de visão, busca de caminho, XP baixo. Os golpes têm aviso claro, sempre em neon: a cor do aviso é a assinatura de cada um.

| Tipo | Nome | Papel | Movimento | Ataque (aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `visitante` | Visitante | corpo a corpo | o homenzinho verde de olhos pretos; anda rápido, foge quando fica sozinho e volta com outros | a sonda na mão acende verde e estala (0,5 s); duas estocadas elétricas rápidas | 70 | 17 | Cratera, Casco, Núcleo |
| `atirador` | Visitante de Capacete | distância | o mesmo homenzinho com capacete de vidro e pistola de raio; mantém 7 blocos | o cano da pistola acende rosa e um ponto de mira aparece no herói (0,6 s); três tiros de raio em sequência. Quando o herói chega perto, **teleporta** 6 blocos para trás (um estalo de luz ciano) | 64 | 19 | Casco, Laboratórios, Núcleo |
| `disco` | Disco Abdutor | voador, controle | o disquinho com a cúpula do adesivo; voa alto, sempre por cima | a borda gira mais rápido e luzes coloridas correm em volta (0,8 s); abre o **feixe arco-íris** para baixo por 2 s: quem está nele é **puxado para cima** até o disco e leva dano ao chegar; o herói sai do feixe andando para o lado | 90 | 22 | Casco, Núcleo |
| `olho` | Olho Vigia | atirador de longe | o olho com veias do adesivo, voando devagar; nunca chega perto | uma linha fina vermelha liga o olho ao herói e vai engrossando (1,4 s); um raio contínuo de 0,6 s nessa linha. Quando vê o herói, dá o **alarme** (todos os Visitantes num raio de 14 vêm) | 60 | 24 | Casco, Núcleo |
| `gosma` | Gosma Viva | emboscada (teto) | uma poça verde pendurada no teto que parece Gosma Pingando; cai quando o herói passa embaixo | a gota no teto incha e brilha (0,5 s) e cai; no chão vira poça viva que anda devagar e gruda: quem pisa fica **grudado** (lento por 2 s) e leva dano por toque | 110 | 14 | Cratera, Laboratórios |
| `olhudos` | Olhudinhos | enxame | os bichinhos verdes de três olhos e tentáculos do adesivo; vêm em grupos de 4 a 6 e pulam juntos | os três olhos piscam ao mesmo tempo (0,4 s) e o grupo inteiro pula no herói; mordem por toque | 30 | 9 | Cratera, Laboratórios |
| `astronauta` | Astronauta Perdido | pesado | um astronauta abduzido há muito tempo, com a gosma verde por dentro do visor; anda devagar e pula alto, como na lua | se agacha e o visor acende verde (0,8 s); um pulo enorme em arco que cai em cima do herói com **onda de choque** dos dois lados. Ao morrer, o tanque de oxigênio chia (1 s) e **estoura** | 280 | 30 | Cratera, Laboratórios |
| `cabecao` | Cabeção | conjurador | a cabeça cinza enorme de olhos pretos brilhantes, flutuando baixo; um escudo psíquico violeta na frente (só leva dano por trás ou de cima) | os olhos acendem violeta e um destroço do chão sobe tremendo (1 s); **telecinese**: arremessa o destroço no herói. A cada 3 arremessos, puxa o herói 3 blocos para perto | 200 | 26 | Laboratórios, Núcleo |
| `hipnotico` | Hipnotizador | controle | o ET de pescoço comprido que faz o sinal de paz; fica atrás dos outros | faz o "V" com a mão e anéis arco-íris saem crescendo dele (1 s); quem é pego fica **hipnotizado** 3 s: andar para a esquerda vai para a direita. Não ataca de outro jeito; foge se o herói chega perto | 70 | 0 | Casco, Laboratórios |
| `foguete` | Foguete Errante | mergulho | um foguetinho vermelho de nariz redondo, vivo; dorme grudado na parede ou no teto | a chama acende e a fumaça sai (0,7 s), mira o herói (uma seta laranja aparece); dispara em linha reta, explode no que bater (raio de 2 blocos). Se errar, faz a curva e tenta mais uma vez | 50 | 28 | Cratera, Casco |

**Estados novos no herói** (`js/249-nave-estados.js`): **Hipnotizado** (anel arco-íris girando na cabeça; os controles de andar trocam de lado), **Abduzido** (puxado para cima pelo feixe, com o arco-íris em volta dele), **Grudado** (pés verdes, 40% mais lento). Poção de vida solta o grudado, nunca a hipnose.

**Spawn por faixa:**

| Faixa | Pesos | Máximo |
|---|---|---|
| A Cratera de Impacto | visitante 4, gosma 3, astronauta 2, olhudos 3, foguete 2 | até 8 monstros |
| O Casco | visitante 3, atirador 3, disco 2, foguete 2, hipnotico 2, olho 2 | até 9 monstros |
| Os Laboratórios | gosma 2, olhudos 3, cabecao 2, hipnotico 2, astronauta 2, atirador 2 | até 9 monstros |
| O Núcleo | disco 3, olho 3, cabecao 2, atirador 3, visitante 2 | até 10 monstros |

## 7. Chefe: O Olho-Cometa (`js/246-olho-cometa.js`)

**A sala: O Planetário.** Uma esfera de raio 22 no Núcleo, do outro lado do mundo em relação às descidas. Por fora, uma casca de Metal do Reator de 2 blocos; por dentro, a parede é o céu holográfico (estrelas que piscam). No centro flutua o **planeta holográfico** com anel, o do adesivo: um disco de raio 5 listrado de vermelho e laranja (`NV_PLANETA`, sólido) e o **anel**: uma elipse inclinada de blocos `NV_ANEL` (raio 13 x 4) que dá a volta no planeta e serve de plataforma curva. Plataformas de grade nas laterais da esfera (a cada 4 fileiras, alternadas) e o chão curvo embaixo. Duas portas na casca, à esquerda e à direita, na altura do chão.

**Números (nível 23):** vida 340 x (1 + 0,3 x 22) = **2584**; dano 9 x (1 + 0,2 x 22) = **49**.

**Como a sala muda a luta:** o Olho voa em volta do planeta e **o rastro arco-íris dele vira chão**: atrás dele fica uma faixa de `NV_RASTRO` que é sólida por 4 s e depois some, piscando antes. O herói sobe pelo rastro para alcançar o Olho lá em cima. O anel é a plataforma fixa; o rastro é a escada que muda.

- **Fase 1 (100% a 60%), a órbita.** Ele gira em volta do planeta deixando o rastro. **Lágrima de luz:** a pupila contrai e uma linha de mira aparece (0,7 s); dispara uma lágrima de luz em linha reta (60%). **Piscada:** a pálpebra fecha (0,5 s) e ele some num estalo e aparece do outro lado do planeta.
- **Fase 2 (60%), os discos.** Dois Discos Abdutores saem das portas da casca (uma vez na fase). O anel começa a **girar em setores**: um quarto do anel pisca rosa (1 s) e some por 3 s, depois volta, girando. **Investida-cometa:** ele recua, a cauda cresce e uma faixa tracejada mostra o caminho (1 s); atravessa a esfera em reta deixando um rastro longo (90%).
- **Fase 3 (30%), o olho arregalado.** A íris vira arco-íris girando. **Feixe arco-íris:** ele para no alto, a pupila dilata e um cone aparece no chão (1,2 s); varre a esfera de um lado ao outro com um raio arco-íris largo (100%); o planeta bloqueia o raio, então se esconder atrás dele salva. **Chuva de estrelas:** estrelinhas de neon caem do teto com uma marca no chão onde vão cair (0,6 s, 40% cada).

**Barreira e reinício:** ao entrar na esfera, a Barreira de Energia (`NV_BARREIRA`) fecha as duas portas. Sair (portal, teleporte) ou morrer reinicia: o rastro some, o anel volta inteiro, os discos somem e o Olho volta com a vida cheia. Os blocos da esfera não quebram fora da luta.

**Lendário único: Cauda do Cometa** (espada, nível 23). Cada golpe deixa um rastro arco-íris curto no ar que corta de novo meio segundo depois (50% do golpe). A lâmina é um degradê das 6 cores do adesivo, com luz 1. A morte fica salva em `olhoCometa.dead`.

## 8. Loot e economia

**Metal: Xenita** (`js/247-xenita.js`). `min_xenita` -> `barra_xenita`, **7 minérios por barra**. Nível da forja **19** (2n − 1 na posição 10). A bigorna ganha as 9 peças de xenita: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Verde-neon translúcido com miolo escuro e brilho fraco; o peitoral de xenita dá luz 1. O minério só cai dos Visitantes desta camada e das de baixo.

**Materiais:**

| Item | De onde | Quem compra |
|---|---|---|
| `gosma_verde` | Gosma Viva, Olhudinhos, bloco de gosma | Marta (poção) e Aurélia |
| `chip_alien` | Visitantes, discos, painéis de neon | Grimaldo e Teodoro (encantamento) |
| `olho_vigia` | Olho Vigia | Marta e Aurélia |
| `cristal_plasma` | Cabeção, salas do reator | Aurélia, caro |
| `oxigenio` | o tanque do Astronauta Perdido | Grimaldo |

**Bases temáticas** (nível 21, só caem aqui, como drop raro de monstro):
- **Pistola de Raio** (cajado de magia, o do Visitante de Capacete), 1,5%: dispara um raio rosa reto.
- **Escudo de Disco** (escudo, do Disco Abdutor), 2%: um disquinho com a cúpula; aparo largo.
- **Capacete de Astronauta** (elmo, do Astronauta Perdido), 1%: luz 1, o visor reflete o neon.

O Olho-Cometa solta uma das três garantida na primeira morte, além da Cauda do Cometa. Sem baús na camada.

**Itens de bloco:** Vidro de Impacto, Escória, Chapa do Casco, Painel de Neon (luz, bom para iluminar a casa), Grade, Liga, Vidro de Laboratório (translúcido), Gosma Endurecida.

## 9. Luz e atmosfera

A camada mais clara do jogo, e de propósito: **a nave está ligada**. A luz vem toda dela e da gosma, por isso faz sentido (regra da luz natural): tubos de neon nos tetos dos corredores, painéis de neon, hologramas, a gosma verde, as plantas alienígenas, o plasma do reator. As cores são as das figurinhas: verde-gosma `#7dff3a`, rosa `#ff3ec8`, ciano `#36f0ff`, violeta `#a64dff`, amarelo `#ffe53a` e o arco-íris do feixe. A Cratera é a parte escura (só a gosma e a escória brilham); o neon acende de verdade a partir do Casco; o Núcleo é o mais claro. Alguns tubos de neon piscam e falham de vez em quando: a nave é velha. Partículas: faíscas da fiação, bolhas de gosma subindo, pó cintilante colorido boiando no Núcleo, estrelinhas no Planetário.

## 10. Som (`js/97-ambiente.js`, cenário `nave`)

Sem melodia. **Leito:** zumbido elétrico grave de reator (uma senoide em 60 Hz com o harmônico de 120, batendo devagar) e o chiado fino do neon. **Eco metálico** médio (corredor de metal). **Eventos:** bip-bip de painel, um "uóóó" de teremim curto e distante (o som clássico de disco voador, uma senoide com vibrato subindo e descendo), porta de escotilha sibilando, gosma borbulhando, faísca estalando. **Por faixa:** a Cratera tem vento e pedra rangendo; os Laboratórios, bolhas e um bip de monitor cardíaco; o Núcleo, o reator pulsando mais forte.

## 11. Interface e progressão

| Zona | Nome | Subtítulo | Cor no mapa |
|---|---|---|---|
| 49 | A Cratera de Impacto | onde ela caiu | `#3c6a3a` |
| 50 | O Casco | as luzes ainda acendem | `#5a6a8a` |
| 51 | Os Laboratórios | eles levaram de tudo | `#b8a8d8` |
| 52 | O Núcleo | o olho está aberto | `#c858e0` |

Nenhum texto de dica: a hipnose, a abdução e a gosma se explicam pela arte e pelo som.

## 12. Arte (paletas, 6 tons do escuro ao claro)

| Material | Rampa |
|---|---|
| Vidro de Impacto | `#06120c` `#0c2216` `#143422` `#1e4a30` `#2c6642` `#4a8a5e` |
| Escória | `#0a0a0c` `#16161a` `#222228` `#303038` `#40404a` `#54545e` |
| Chapa do Casco | `#14161c` `#20242c` `#2e3440` `#3e4654` `#525c6c` `#6c7888` |
| Liga Alienígena | `#4a4660` `#6a6684` `#8e8aa8` `#b4b0cc` `#d6d2ea` `#f2f0ff` |
| Gosma | `#1a4a06` `#2e7a0c` `#4aa814` `#6cd422` `#94f03c` `#c8ff7a` |
| Metal do Reator | `#2a1a3a` `#3e2a56` `#563e78` `#7258a0` `#9478c8` `#c0a8f0` |
| Xenita | `#0a3a1a` `#126a2a` `#20a03a` `#3ad44e` `#7dff3a` `#d4ffb0` |

Os Visitantes: pele verde-limão do adesivo (`#2e7a0c` a `#c8ff7a`), olhos pretos enormes com um ponto de brilho branco, o contorno escuro só onde toca o ar, a luz de neon da camada nas bordas. O Olho-Cometa: o olho branco do adesivo com a íris amarela e a pupila preta, a cauda nas 6 cores, a pálpebra violeta.

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/240-nave-api.js` | ids, `NV_BANDS`, `NV_D = 186`, `NV_ZONE0 = 49`, `naveBand`, `nvAbove`, `nvEntries`, `nvLand`, `nvExits`, `nvBoss`, os estados do herói. `NAVE = false` desliga a camada |
| `js/241-nave-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, o neon ao vivo, a escada e o cabo escaláveis |
| `js/242-nave-objetos.js` | os objetos e `NV_PROP_PLAN` |
| `js/243-nave-visitantes.js` | visitante, atirador, disco, olho, gosma |
| `js/244-nave-visitantes2.js` | olhudinhos, astronauta, cabeção, hipnotizador, foguete |
| `js/245-nave-mundo.js` | geração, descidas, rasgos, elevadores, zonas, spawn, nível, partículas, loja |
| `js/246-olho-cometa.js` | o Planetário, a luta, a Cauda do Cometa |
| `js/247-xenita.js` | o metal na forja |
| `js/248-nave-save.js` | nomes das zonas, `wg 16` |
| `js/249-nave-estados.js` | hipnose, abdução, gosma, Salas sem Peso, o elevador de feixe |

## Decisões tomadas (Jonathan pediu sem perguntas, 2026-10-11)

1. **Onde a camada entra.** Logo abaixo da Colmeia, como a décima, e o Abismo desce mais 186 m (continua sendo a penúltima, com a Escuridão no fundo). O mapa das 16 camadas ganha uma camada a mais: o Mar Sem Sol e as que vêm depois andam uma posição para baixo quando forem feitas. Escolhi não trocar nenhuma camada planejada.
2. **Números próprios.** A camada não estava no mapa, então não usa os números reservados de ninguém: blocos 640 a 671 (`NT` sobe para 672), arquivos 240 a 249, paredes 88 a 92, terceira camada 57 a 59, zonas 49 a 52.
3. **A luz forte.** A regra da luz natural vale: toda luz daqui é da nave ou da gosma. É a exceção que confirma a regra, a camada mais clara do jogo.
4. **A bicicleta e a música** do pedido original foram cancelados pelo Jonathan; nada disso entra.
