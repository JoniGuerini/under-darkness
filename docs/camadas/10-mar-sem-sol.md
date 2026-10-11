# O Mar Sem Sol: ficha de implementação

A décima segunda camada (feita em 2026-10-11), debaixo do Reino Élfico e em cima do Abismo, de 2046 a 2232 m. Esta ficha foi escrita quando o Mar seria a décima; os números de verdade (arquivos 260 a 269, zonas 57 a 60, níveis) estão na seção "Como ficou no jogo", no fim. É um mar subterrâneo do tamanho do mundo inteiro, com praias de areia negra, ilhas de rocha, navios que ninguém sabe como chegaram e um fundo onde só a luz dos bichos alcança. Monstros de nível 25 a 26, metal novo Oricalco, chefe O Leviatã (nível 27).

**O que a diferencia:** é a única camada **aberta e molhada**: um vão de 30 fileiras de ar sobre uma superfície de água que dá a volta no mundo, logo depois do aperto quente da Colmeia em cima e antes do fogo do Covil do Dragão embaixo. Ela traz o sistema de água e de nado, que nenhuma outra camada tem; do Abismo difere em tudo: frio, silêncio, escuro azul e espaço demais.

## 1. Identidade

- **Faixas:** Praias Negras, Floresta de Algas, A Fossa, Chaminés Negras.
- **Conceito:** debaixo da colmeia a rocha se abre num mar sem fim. Navios de todas as épocas estão encalhados nas praias ou boiando de quilha para cima, como se o mar os tivesse puxado de outro mundo. A gente-peixe vive em palafitas nas ilhas e adora o que mora no fundo. No chão do mar, fendas quentes soltam fumaça preta: o calor do dragão já chega aqui.
- **Sensação:** vastidão e exposição. Depois de 186 m de túnel, o herói vê longe e se sente pequeno. O perigo não está na curva: está **embaixo**, em qualquer lugar.
- **Referências:** Subnautica, o mar de Moria em O Hobbit, Bioshock (o fundo), Lovecraft (A Sombra sobre Innsmouth), os mapas antigos com "aqui há monstros".

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 45 | Praias Negras | 1674 a 1720 | Rocha do Mar, Areia Negra, Cracas | o grande vão: teto alto com estalactites, a superfície do mar a 1706 m em todo o mundo, praias, ilhas, palafitas, navios encalhados e o naufrágio do Leviatã |
| 46 | Floresta de Algas | 1720 a 1772 | Recife, Coral, Rocha do Mar | a água de cima: plataformas de recife com algas altas, cascos afundados com ar dentro, correntes de âncora; por dentro das ilhas, grutas secas que descem |
| 47 | A Fossa | 1772 a 1824 | Lodo, Rocha do Mar | o fundo e as fendas: água preta, respiradouros de bolhas, o templo afundado da gente-peixe; as grutas secas continuam com sifões curtos |
| 48 | Chaminés Negras | 1824 a 1860 | Sulfeto, Rocha do Mar | debaixo do chão do mar: grutas secas e quentes, chaminés pretas fumegando, poças de água fervente, as descidas para o dragão |

- **Entrada:** os dois Escorredouros de Mel da Colmeia (`cmExits`) furam o teto do vão. De cada um pende uma **Raiz de Cera**: uma coluna de cera escorrida de 3 de largura, do teto até a praia, com a Escada de Favos (`CM_ESCADA_FAVO`) por dentro em toda a altura (uns 26 fileiras), afinando em cera e cracas perto do chão. A geração sempre põe uma praia ou um cabo de rocha debaixo de cada raiz. Volta-se pela mesma escada.
- **Câmara de pouso:** ao pé de cada raiz, uma gruta rasa no penhasco, 12 x 6, chão de areia plano, um anel de conchas luminosas acesas, sem monstro.
- **Saída:** dois **Poços de Vapor** nas Chaminés Negras, a pelo menos `WW / 3` um do outro: chaminés mortas de 3 de largura que descem até a última fileira, paredes de sulfeto que esquentam, vapor subindo devagar e a **Escada de Cordame** (`MS_CORDAME`) que a gente-peixe amarrou. A camada guarda as posições em `msExits` para o Covil do Dragão.
- **Nível dos monstros:** 21 na metade de cima da camada e 22 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, mas nunca passam de 22, então nenhum monstro daqui fica abaixo ou no nível da camada de cima.

## 3. Estrutura e geração (`js/177-mar-mundo.js`)

O mar tem dois caminhos para baixo: o **molhado** (nadar fundo, correntes de âncora, respiradouros) e o **seco** (as grutas por dentro das ilhas, com sifões curtos). O seco é o garantido; o molhado é o mais curto e o que tem mais oricalco.

1. **Rocha por faixa.** A cera da Colmeia afina por ruído nas primeiras 6 fileiras e vira `MS_ROCHA`; `MS_RECIFE` e `MS_CORAL` nas plataformas da Floresta, `MS_LODO` no fundo da Fossa, `MS_SULFETO` nas Chaminés. Bordas por ruído.
2. **O vão.** Cava uma cavidade que dá a volta no mundo: teto em 1680 m com ruído de ±4 e estalactites grandes; nível do mar `MS_NIVEL` fixo em 1706 m. O fundo da água varia por ruído largo entre 1730 e 1790 m, com plataformas de recife perto das costas e quedas para o fundo.
3. **Ilhas e costas.** 8 x `WSC` ilhas de rocha que sobem acima do nível do mar, de 20 a 60 de largura, com praias de Areia Negra em rampa (degraus de no máximo 3). Debaixo de cada Raiz de Cera há uma costa garantida. Na região do Leviatã (140 de largura, do outro lado do mundo em relação às raízes) não há ilha: só mar aberto e o naufrágio (seção 7).
4. **Navios.** 5 x `WSC` cascos encalhados nas praias (paredes de `MS_CASCO`, convés de `MS_CONVES`, 24 a 40 de comprimento) e 6 x `WSC` cascos de quilha para cima boiando ou afundados na Floresta, cada um com um **sino de ar**: o oco dentro do casco fica seco. Cada navio na superfície solta uma Corrente de Âncora (`MS_CORRENTE`) até o fundo.
5. **Palafitas.** 3 x `WSC` vilas da gente-peixe nas ilhas: cabanas de casco sobre Estacas de Palafita (`MS_ESTACA`, do fundo até o piso), pontes de convés entre elas, lanternas de óleo.
6. **Grutas das ilhas (o caminho seco).** De cada ilha, 1 a 2 túneis sinuosos de 3 de altura descem por dentro da rocha até as Chaminés Negras, sem nunca abrir para o mar abaixo do nível. Na Fossa, cada túnel passa por 1 ou 2 **sifões**: um U alagado de no máximo 10 blocos de nado. Em todo desnível de 5 ou mais, Escada de Cordame ou Corrente.
7. **A Fossa.** 2 x `WSC` fendas verticais de 8 a 14 de largura no chão do mar, até 1815 m, com Correntes de Âncora (que a gente-peixe prendeu) e **respiradouros** a cada 20 fileiras no máximo. 2 x `WSC` templos afundados no fundo: salas de Pedra Entalhada (`MS_TEMPLO`, 16 a 24 x 8 a 10) com um domo de ar dentro.
8. **Chaminés Negras.** Grutas secas largas (18 a 30 x 8 a 14) ligadas por túneis, com chaminés de sulfeto do chão ao teto, poças pequenas de água fervente (nunca no caminho obrigatório) e os dois Poços de Vapor.
9. **Água.** A geração enche a água por bacias (seção Sistemas novos): primeiro o mar inteiro abaixo de `MS_NIVEL`, ligado ao vão, menos os sinos de ar e os domos marcados; depois cada sifão até a borda dele; depois as poças quentes. Plâncton nas primeiras 4 fileiras do mar em manchas por ruído, e respiradouros na Fossa.
10. **Minérios.** Carvão (`MS_O_CARVAO`) na Rocha do Mar das ilhas e das grutas, 40 veios x `WSC`. Oricalco (`MS_O_ORICALCO`) no Sulfeto e na Rocha do Mar perto das chaminés, 26 veios x `WSC`: metade nas Chaminés, metade nas paredes da Fossa (o caminho molhado paga melhor).
11. **Alcance** a partir das duas raízes, com a busca de nado (Sistemas novos): de cada ilha, de cada templo e dos dois Poços de Vapor tem que dar para voltar. Onde falta, põe Escada de Cordame ou um respiradouro. Depois o `worldLink` do 87 só nesta faixa de linhas.
12. **Decoração de 1 bloco**, **correção estrutural** (estacas e chaminés do chão ao teto, algas em corrente) e **objetos** por último.

## 4. Blocos (`js/173-mar-blocos.js`)

Ids 416 a 447. Sólidos:

| Id | Constante | Nome | Uso | Solta |
|---|---|---|---|---|
| 416 | `MS_AREIA` | Areia Negra | praias e fundo raso; grão preto com brilho de mica | areia_negra |
| 417 | `MS_ROCHA` | Rocha do Mar | massa geral; basalto azul-preto molhado | rocha_mar |
| 418 | `MS_CRACAS` | Rocha de Cracas | penhascos e cascos velhos; áspera, pontos claros | rocha_mar |
| 419 | `MS_RECIFE` | Recife | plataformas da Floresta; coral morto claro, cheio de furos | recife |
| 420 | `MS_CORAL` | Coral Vivo | manchas no recife; rosa e laranja apagados, luz fraquinha | coral |
| 421 | `MS_LODO` | Lodo | fundo da Fossa; mole, quebra rápido | lodo |
| 422 | `MS_SULFETO` | Sulfeto | Chaminés; preto com veios ferrugem e enxofre | sulfeto |
| 423 | `MS_CASCO` | Casco de Navio | paredes de navio; tábua alcatroada | madeira |
| 424 | `MS_CONVES` | Convés | pisos e pontes; tábua clara gasta | madeira |
| 425 | `MS_TEMPLO` | Pedra Entalhada | templos e totens da gente-peixe; peixes e olhos em relevo | pedra_templo |
| 426 | `MS_O_CARVAO` | Veio de Carvão | carvão na rocha | carvao |
| 427 | `MS_O_ORICALCO` | Veio de Oricalco | o metal da camada; verde-dourado, luz fraca | min_oricalco |
| 428 | `MS_BARREIRA` | Onda Parada | parede de água em pé nas bordas da luta do Leviatã; o herói não passa, não quebra | nenhum |

Decoração de 1 bloco (não sólida; toda ela pode estar dentro ou fora da água, porque a água é uma camada à parte):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 429 | `MS_ALGA` | Alga Alta | chão; empilha até 8 em corrente, balança |
| 430 | `MS_ANEMONA` | Anêmona | chão; luz rosa fraca |
| 431 | `MS_CONCHA` | Concha Luminosa | chão; luz ciano média |
| 432 | `MS_CORRENTE` | Corrente de Âncora | pendurada; escala como a `CHAIN`, também debaixo da água |
| 433 | `MS_CORDAME` | Escada de Cordame | escala como a escada da mina |
| 434 | `MS_LANTERNA` | Lanterna de Óleo de Peixe | teto; luz verde-amarelada; só acima da água |
| 435 | `MS_ESTALAC` | Estalactite Pingando | teto |
| 436 | `MS_VERMES` | Vermes-Tubo | chão; Chaminés e Fossa; vermelhos |
| 437 | `MS_ESPINHA` | Espinha de Peixe Grande | chão |
| 438 | `MS_MEXILHAO` | Cacho de Mexilhões | teto |
| 439 | `MS_RESPIRO` | Respiro de Vapor | chão; Chaminés; solta vapor, luz laranja fraca |
| 440 | `MS_ESTACA` | Estaca de Palafita | do chão ao teto (ou ao piso da cabana), regra das colunas |

Ids 441 a 447 ficam livres.

**Paredes de fundo (58 a 62):** `WMS_ROCHA`, `WMS_RECIFE`, `WMS_CASCO`, `WMS_TEMPLO`, `WMS_SULFETO`. Sobre o mar aberto a parede é rasgada em buracos grandes (`FAR`, como o Abismo) para a terceira camada aparecer.

**Terceira camada (39 a 41):** `DP_MS_HORIZONTE` (ilhas e cascos ao longe, com pontinhos de luz), `DP_MS_FUNDO` (azul quase preto com vultos enormes passando), `DP_MS_CHAMINES` (torres de sulfeto ao longe soltando fumaça).

## 5. Objetos de cena (`js/174-mar-objetos.js`)

28 objetos com `mar: true` e `MS_PROP_PLAN` (`chao`, `teto`, `fundo`). Objetos marcados "água" só vão debaixo da água; os outros só fora dela.

- **Praias Negras:** bote virado (chão), âncora caída (chão), barril de óleo (chão), figura de proa caída (chão), canhão enferrujado (chão), mastro quebrado (chão, alto), rede secando em varas (chão + fundo), armadilha de peixe (chão), totem da gente-peixe (chão), braseiro de óleo de peixe (chão, luz verde), farol da gente-peixe (chão, luz forte, só nas ilhas), cabana de palafita (chão, sobre as estacas), lanterna de navio pendurada (teto, luz), redes penduradas (teto).
- **Floresta de Algas:** coral-cérebro (chão, água), coral-leque (chão, água, luz fraca), concha gigante entreaberta (chão, água), ânfora afundada (chão, água), estrela-do-mar (fundo, água), vigia de navio com luz (fundo, dentro dos cascos).
- **A Fossa:** esqueleto de baleia (chão, água, grande), crânio de leviatã antigo (chão, água), estátua do deus-peixe (chão + fundo, templo), mural da gente-peixe (fundo, templo), casco no fundo (fundo, silhueta de navio).
- **Chaminés Negras:** chaminé negra fumegando (chão, grande, animada, luz laranja), vermes-tubo gigantes (chão), crosta de enxofre (chão).

## 6. Inimigos: gente-peixe e bichos do fundo (`js/175-mar-bichos.js` e `js/176-mar-bichos2.js`)

Sem dano de contato genérico (só a medusa usa `touch`, nos tentáculos). Linha de visão e busca de caminho, que para quem nada é feita só pelas células com água. XP baixo. Coluna "Meio": **anf** anda e nada, **água** só nada, **fundo** anda no chão, até debaixo da água, **ar** voa e mergulha.

| Tipo | Nome | Papel | Meio | Movimento | Ataque (aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|---|
| `escamado` | Guerreiro Escamado | corpo a corpo | anf | em terra anda curvado; na água nada rápido e espera na beirada, só a cabeça de fora | sai da água até a cintura, braços erguidos e as guelras abrindo (0,7 s); agarra o tornozelo e puxa o herói para a água, segura 2 s no fundo (o fôlego cai) | 110 | 22 | Praias, Floresta, Chaminés |
| `xamamar` | Xamã das Bolhas | distância | anf | fica nas palafitas e praias, recua andando de costas | o cajado de coral acende ciano e gotas sobem em volta dele (0,8 s); solta uma bolha lenta que prende o herói: ele flutua 1,5 s e perde fôlego até em terra | 70 | 18 | Praias, Chaminés |
| `ermitao` | Caranguejo-Ermitão | pesado | fundo | anda de lado, devagar, dentro de uma figura de proa ou de um barril; anda no fundo do mar sem nadar | a pinça sobe aberta e estala duas vezes (0,8 s); pancada que racha o chão. Golpeado demais, se fecha 2 s (sem dano) e sai girando | 280 | 28 | Praias, Chaminés |
| `arraia` | Arraia-do-Teto | voador | ar | plana no ar do vão em curvas largas de S e entra e sai do mar sem parar | a cauda sobe por cima do corpo e o ferrão brilha (0,6 s); rasante com chicotada | 80 | 20 | Praias |
| `tubarao` | Tubarão-Cego | caçador | água | circula o herói longe, fechando o círculo; na superfície só a barbatana aparece | vira o corpo de lado, bate a cauda com um chiado e deixa um rastro de espuma (0,7 s); investida reta com mordida. Abaixo de 50% de vida do herói, circula mais perto | 180 | 30 | Praias, Floresta |
| `medusa` | Medusa Abissal | enxame | água | bandos de 4 a 6; o sino contrai e ela sobe, depois afunda devagar; tentáculos de 3 blocos embaixo | os tentáculos acendem de cima para baixo (0,8 s) e dão choque em quem estiver neles. Brilham: são luz | 40 | 14 | Praias, Floresta, Fossa |
| `enguia` | Enguia-Trovão | área | água | nada em ondas compridas, passa rente ao herói sem atacar | o corpo acende segmento a segmento com estalos (1 s); descarga em toda a água ligada num raio de 5. Quem está fora da água não leva | 100 | 24 | Floresta, Fossa |
| `polvo` | Polvo das Ruínas | controle | água | anda pelas paredes com os braços, muda de cor com o fundo, passa por buracos de 1 bloco | os braços se enrolam para trás e as ventosas acendem (0,6 s); chicote de 3 blocos. Ferido, solta tinta: uma nuvem onde a luz cai a zero por 4 s | 120 | 20 | Floresta, Fossa |
| `baiacu` | Baiacu-de-Espinhos | distância | água | boia devagar; incha ao ver o herói; murcho, foge | incha, os espinhos levantam e ele assobia (0,8 s); 8 espinhos para todos os lados; depois fica murcho e lento 2 s | 70 | 16 | Floresta, Fossa, Chaminés |
| `diabomar` | Diabo-Marinho | emboscada | água | parado no escuro; só a isca de luz aparece, balançando como um brilho de loot | a isca para e cai, e um contorno de dentes aparece (0,6 s); bocada enorme em arco. Erra e fica 1 s parado | 160 | 28 | Fossa, Chaminés |

**Spawn por faixa:**

| Faixa | Pesos | Máximo |
|---|---|---|
| Praias Negras | escamado 4, xamamar 3, ermitao 2, arraia 3, tubarao 2, medusa 2 | até 8 monstros |
| Floresta de Algas | tubarao 2, medusa 3, enguia 2, polvo 3, escamado 3, baiacu 2 | até 8 monstros |
| A Fossa | diabomar 3, enguia 2, baiacu 3, polvo 2, medusa 3 | até 7 monstros |
| Chaminés Negras | ermitao 3, xamamar 2, escamado 3, diabomar 2, baiacu 2 | até 8 monstros |

Bichos de água só nascem em células com água em volta toda; os de terra, só em seco. Na Fossa nascem menos e mais longe: o vazio é o medo.

## 7. Chefe: O Leviatã (`js/178-leviata.js`)

**O lugar:** sem sala. Mar aberto na superfície das Praias Negras, do outro lado do mundo em relação às raízes de cera, sobre o naufrágio da **Nau Sem Nome**: um galeão de 60 blocos partido em três. A **proa** está presa num recife (fixa, convés a 4 acima do mar na maré baixa e 1 abaixo na alta), a **meia-nau** boia e sobe e desce com a maré, a **popa** boia de lado. Em volta, 6 destroços menores (tábuas, barris, um pedaço de mastro) de 3 a 5 de largura que boiam. Embaixo, 50 fileiras de água até o fundo.

**Números (nível 23):** vida 330 x (1 + 0,3 x 22) = **2508**; dano 9 x (1 + 0,2 x 22) = **49** (arredondado).

**Começo e limites:** a luta começa quando o herói pisa no convés da proa. Duas Ondas Paradas (`MS_BARREIRA`, 3 de largura) sobem nas bordas, a 70 blocos do centro de cada lado, do fundo do mar até 12 fileiras acima da superfície: o mar em volta fica fechado sem parede de pedra. Morrer, portal ou teleporte reinicia: a maré volta ao meio, os destroços voltam ao lugar da semente, os pedaços quebrados da nau voltam e ele volta com a vida cheia. Blocos da nau não quebram durante a luta.

**Como o lugar muda a luta:** a **maré** sobe e desce 6 fileiras. Na baixa, a proa é um chão firme; na alta, ela afunda e só sobra o que boia. O Leviatã é uma serpente de 40 blocos: cabeça de 5 x 4 e 8 segmentos. Ele sai da água de qualquer lado, e o aviso é sempre na água: bolhas, uma sombra escura subindo e a água estufando onde ele vai sair.

- **Fase 1 (100% a 60%), maré de 40 s.** **Bote:** sombra e bolhas sob um ponto (1,2 s); sai em arco, morde (100%) e mergulha do outro lado, levantando uma onda que balança os destroços. **Rabada:** a ponta da cauda sobe ao longe (1 s); uma onda corre pela superfície (50%) e derruba quem está baixo na água; pular ou subir num destroço alto escapa. **Cabeça no convés:** depois de 2 botes, ele apoia a cabeça na proa 2 s, cansado: é a janela de dano (os olhos levam o dobro).
- **Fase 2 (60%), maré de 24 s.** Ele se enrola na nau: segmentos saem da água em arcos (dá para bater neles, dano baixo; a cabeça é o alvo). **Tromba-d'água:** um círculo de espuma sob o herói (0,8 s) e uma coluna de água o joga 6 blocos para cima (60%). **Redemoinho:** a água começa a girar com um som de ralo (1,5 s); puxa o herói e os destroços para a boca dele; segurar numa Corrente de Âncora da nau ou nadar para fora escapa, quem chega na boca leva 150%. Uma vez na fase, chama 2 Tubarões-Cegos.
- **Fase 3 (25%), maré alta parada.** Ele quebra a meia-nau e puxa a popa para o fundo: sobram a proa debaixo d'água e os destroços boiando. **Ataque por baixo:** atravessa um destroço vindo do fundo (o destroço treme e solta bolhas 1 s antes; 120%). **Jato abissal:** a garganta acende azul por dentro com plâncton (1 s); um jato de água varre a superfície de um lado ao outro (80% por toque). **Apagar:** ele engole o plâncton e a luz do mar cai à metade por 8 s; só os olhos dele brilham.

**Lendário único: Pérola do Leviatã** (acessório, nível 23): fôlego dobrado, nado 30% mais rápido, +vida, e uma vez a cada 30 s, ao cair abaixo de 30% de vida, solta uma onda que empurra todos os inimigos em volta. Luz azul fraca. A morte fica salva em `leviata.dead`. Depois dela, a nau fica parada na maré média.

## 8. Loot e economia

**Metal: Oricalco** (`js/179-oricalco.js`). `min_oricalco` -> `barra_oricalco`, **7 minérios por barra**. Nível da forja **19**. A bigorna ganha as 9 peças de oricalco: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Verde-dourado, com reflexo de água. O metal de Atlântida não pesa na água: elmo, peitoral e botas de oricalco não contam para o peso de nado e cada peça dá +2 s de fôlego.

**Materiais:**

| Item | De onde | Quem compra |
|---|---|---|
| `escama_abissal` | escamados, tubarões, xamãs | Grimaldo |
| `perola_negra` | conchas gigantes, ermitões (raro) | Grimaldo, caro |
| `tinta_polvo` | polvos | Aurélia (pergaminhos) |
| `isca_viva` | diabo-marinho, medusas | Marta (luz e poção) |
| `peixe_cego` | tubarões, baiacus | Odo (cozinha) |

**Bases temáticas** (nível 21, só caem aqui, como drop raro de monstro):
- **Tridente Escamado** (lança), do Guerreiro Escamado e do Xamã, 1,5%: estocada que não perde velocidade na água.
- **Cutelo de Abordagem** (espada), do Caranguejo-Ermitão (estava na casca), 2%: golpe rápido, +crítico.
- **Escudo de Carapaça** (escudo), do Ermitão e do Baiacu, 1%: aparo largo e espinhos fracos.

O Leviatã solta uma das três garantida na primeira morte, além da Pérola. Sem baús na camada.

**Itens de bloco:** Areia Negra, Rocha do Mar, Recife, Coral, Convés, Pedra Entalhada. O ancião ganha 3 missões (escamas, uma pérola negra, tinta de polvo).

## 9. Luz e atmosfera

A camada mais escura até aqui, mas com horizonte. No vão: o plâncton acende a superfície em manchas ciano, as lanternas verdes das palafitas e os faróis das ilhas são pontos longe, e a terceira camada mostra cascos e ilhas no escuro. Na água: a luz morre mais rápido (Sistemas novos), as medusas e as anêmonas são as lâmpadas, e na Fossa só há o que o herói leva e o que quer comê-lo. Nas Chaminés: brilho laranja baixo das chaminés e do vapor. Partículas: gotas grandes caindo do teto no mar, névoa rente à superfície, plâncton subindo devagar, bolhas, vapor e fumaça preta nas Chaminés.

## 10. Som (`js/97-ambiente.js`, cenário `mar`)

Sem melodia. **Leito:** ondas lentas (ruído rosa com um envelope que sobe e desce a cada 8 a 12 s), quase sem vento. **Eco longo e aberto** (4 s, pouco amortecido): o contrário do eco curto da Colmeia. **Eventos:** madeira de navio rangendo longe, uma batida solta de sino de boia, uma gota grande caindo na água, um canto de baleia grave que desliza e some, espirro de água quando algo emerge. **Debaixo da água** (a cabeça do herói dentro): tudo passa por um filtro passa-baixa, entram bolhas e um zumbido grave de pressão. **Por faixa:** a Fossa tem só a pressão e estalos de baleia; as Chaminés, borbulhar e chiado de vapor.

## 11. Interface e progressão

| Zona | Nome | Subtítulo | Cor no mapa |
|---|---|---|---|
| 45 | Praias Negras | o mar que não tem céu | `#3a4a5a` |
| 46 | Floresta de Algas | o chão balança | `#2a5a52` |
| 47 | A Fossa | aqui embaixo, tudo enxerga | `#141e2e` |
| 48 | Chaminés Negras | o fundo do mar ferve | `#5a3a2a` |

A água aparece no mapa (Tab) como uma camada azul por cima. A **barra de fôlego** é uma linha fina azul em cima da hotbar, no mesmo lugar e estilo da barra de vigor, e só aparece enquanto o fôlego não está cheio. Sem texto.

## 12. Arte (paletas, 6 tons do escuro ao claro)

| Material | Rampa |
|---|---|
| Areia Negra | `#0c0c10` `#18181e` `#26262e` `#363640` `#4a4a56` `#6a6a7a` |
| Rocha do Mar | `#0a1016` `#142028` `#1e303c` `#2a4250` `#3c5a68` `#567a88` |
| Recife | `#3a3630` `#5a544a` `#7a7264` `#9a9282` `#bab2a0` `#dad2c0` |
| Coral | `#3a1418` `#5e2428` `#86383a` `#a8564e` `#c87a66` `#e8a488` |
| Sulfeto | `#100c08` `#221a10` `#3a2a14` `#5a3e18` `#8a6420` `#c09a3a` |
| Casco | `#140c08` `#24160c` `#382214` `#4e321e` `#68462c` `#866040` |
| Água (por cima, com transparência) | `#02060c` `#041020` `#081c34` `#0e2c4a` `#164264` `#2a6688` |
| Plâncton | `#0a2a2e` `#10464a` `#1a6a6a` `#2a9490` `#4ac0b4` `#8ae8d8` |
| Oricalco | `#1a2410` `#2e3e18` `#4a5e20` `#72822c` `#a8a83c` `#e0d870` |

Gente-peixe: humanoides de 12x22 com os encaixes do herói, curvados, escamas em 2 tons, olhos grandes com um ponto de luz. Bichos do fundo com partes que brilham (iscas, tentáculos) em ciano e rosa, o resto quase preto. A água desenhada por cima de tudo, mais escura quanto mais fundo, com a linha da superfície clara e ondulando.

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/170-mar-api.js` | ids, `MS_BANDS`, `MS_D = 186`, `MS_ZONE0 = 45`, `MS_NIVEL`, `marBand`, `msExits`, `msBoss`. `MAR = false` desliga a camada |
| `js/171-agua.js` | a camada de água, encher por bacia, enchimento ao cavar, luz, desenho, `aguaIn`, IA de nado |
| `js/172-nadar.js` | o herói na água: nado, fôlego, peso, barra de fôlego, sons |
| `js/173-mar-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, cordame e corrente |
| `js/174-mar-objetos.js` | 28 objetos e `MS_PROP_PLAN` |
| `js/175-mar-bichos.js` | escamado, xamã, ermitão, arraia, polvo |
| `js/176-mar-bichos2.js` | tubarão, medusa, enguia, baiacu, diabo-marinho |
| `js/177-mar-mundo.js` | geração em passos, raízes, ilhas, navios, sifões, fossa, zonas, spawn, nível, partículas, loja, missões, save |
| `js/178-leviata.js` | o naufrágio, a maré, os destroços, a luta, a Pérola |
| `js/179-oricalco.js` | o metal na forja e o peso zero na água |

## Sistemas novos

**1. A água é uma camada própria, não um bloco.** Um vetor `agua` (`Uint8Array`, um byte por célula, como `walls`) guarda o líquido: 0 seco, 1 água, 2 água com plâncton (`EMIT` 0,3), 3 respiradouro (bolhas: enche o fôlego e empurra para cima a 60 px/s), 4 água fervente (queima 3% da vida a cada 0,5 s, como uma lava fraca). Assim uma corrente, uma alga ou uma escada podem estar dentro da água, e os sólidos continuam sólidos. Custa uns 2,8 MB no mundo de 16 camadas. A `LAVA` (10) continua sendo bloco; se lava e água se encostarem, a lava vira Obsidiana (`AB_OBSIDIANA`).

**2. A água não escorre.** Fica parada como a lava. A geração enche por bacia: um ponto e um nível, e enche tudo que estiver ligado abaixo do nível, menos as células marcadas como sino de ar. No jogo, quando um bloco some (cavar, explosão) e a célula vazia encosta em água do lado ou em cima, ela enche, e o enchimento se espalha para os lados e para baixo, nunca para cima, até 64 células. Colocar um bloco tira a água da célula. O mar nunca esvazia. **Save:** nada novo. Ao carregar, depois de aplicar os `diffs`, o jogo refaz a água das bacias da semente e repete o enchimento em cada bloco cavado: o resultado é o mesmo.

**3. O herói na água** (`js/172-nadar.js`, embrulha `updatePlayer`). `aguaIn(x, y, w, h)` diz quanto do corpo está na água; "cabeça dentro" são os 6 px de cima.
- **Movimento:** gravidade a 25%, queda máxima 60 px/s, velocidade de lado a 60%. W ou Espaço dão braçada (sobe 70 px/s enquanto segura); S mergulha mais rápido. Na superfície, W dá um pulo de saída de 2 blocos para subir numa borda. Escadas e correntes funcionam igual debaixo da água.
- **Fôlego:** 10 s com a cabeça dentro. Zerado, perde 8% da vida a cada 0,5 s. Com a cabeça fora, enche 4 vezes mais rápido; no respiradouro, na hora. A partir de 30% as bordas da tela escurecem um pouco e o som do coração entra.
- **Peso (decidido):** a armadura pesada **afunda, mas não mata**. O peso é a soma dos `spd` negativos que o jogo já usa no elmo, no peitoral, nas botas e no escudo (cota de malha 0,04, armadura de placas 0,08, escudo-torre 0,06). Até 0,05 o herói boia: parado, sobe devagar até a superfície. De 0,06 para cima ele afunda a 40 px/s parado, a braçada sobe só 40 px/s, mas ele **anda no fundo** a 60% da velocidade e pula 2 blocos de lá. Motivo: o jogador já entende "pesado é lento", então isso não precisa de explicação; e vira escolha, não castigo: o pesado desce rápido para a Fossa e anda no chão do mar, o leve sobe e cruza a superfície. A armadura de oricalco resolve as duas coisas, e é o motivo de forjar ela aqui.
- **Combate:** golpes 20% mais lentos na água, menos a lança (estocada não perde nada); o empurrão cai à metade. O escudo funciona. Não dá para pôr tocha na água, e uma tocha que fica alagada apaga. Projéteis entram na água com metade da velocidade; os de fogo apagam. O Arco Voltaico (64) na água salta para todo inimigo na mesma água num raio de 4, como a enguia.

**4. Luz na água** (embrulha `computeLight`). Célula com água tem atenuação 0,13 em vez de 0,088 do ar: a luz alcança uns dois terços. O plâncton é fonte de luz pelo vetor `agua`, não pelo bloco. O desenho põe a água por cima da parede e dos objetos, com transparência, mais escura a cada 10 fileiras abaixo da superfície; a linha da superfície ondula (animação no `15-render`, como o brilho da lava).

**5. Os geradores que já existem.** `agua` nasce zerado no mundo todo, então nenhuma camada pronta muda. O `worldLink` do 87 e as buscas de subida tratam água como espaço aberto em todas as direções, com um contador de células seguidas debaixo da água: no máximo 30 sem ar (uns 8 s de nado com folga). Passou disso, o caminho não vale, e a geração põe um respiradouro ou uma corrente. O `trySpawn` não põe monstro de terra em célula molhada nem de água em célula seca. O teleporte (75) não pousa na água. Loot que cai na água afunda devagar até o fundo (não some, como na lava).

**6. Monstros que nadam.** Três marcas novas em `ET`: `swim` (só água: sem gravidade do laço, como a salamandra hoje; anda livre em 2D só por células molhadas, e a busca de caminho só passa por elas), `amph` (com gravidade em terra, nado na água) e `bottom` (ignora o empuxo: anda no fundo com gravidade normal). Um `swim` que acaba fora da água (empurrão na superfície) se debate de volta e perde 10% da vida por segundo. Monstro sem marca nenhuma que cai na água ganha a física do herói leve e não se afoga. Ninguém além do herói tem fôlego.

## Decisões em aberto

1. **A água serve também para a Mãe-Esporo (camada 5) e a cisterna do Sineiro (6).** Recomendo tirar `171-agua.js` e `172-nadar.js` da faixa do Mar e pôr na preparação da seção 2 do 00-geral, antes da camada 5, com esta seção como especificação. As fichas 5 e 6 usam o mesmo vetor `agua`.
2. **Água parada que só enche buracos.** Recomendo manter: igual à lava, barato, e sem precisar salvar nada novo. Água que escorre de verdade fica para depois, se fizer falta.
3. **Limite de peso em 0,06.** Com ele a cota de malha boia e a armadura de placas afunda. Recomendo começar assim e ajustar depois de jogar a Fossa.

## Como ficou no jogo (2026-10-11)

A camada foi feita junto com outras quatro, ao mesmo tempo; as perguntas em aberto foram decididas pela opção recomendada.

- **Lugar:** 12ª camada, de 2046 a 2232 m (`MS_S0` logo abaixo do `EL_S0 + EL_D` do Reino), entre o Reino Élfico e o Abismo. O Abismo desce 186 m e continua o último antes da Escuridão. Desce-se pelos dois poços de raízes do Reino (`elExits`); as duas saídas para baixo são os Poços de Vapor nas Chaminés (`msExits`).
- **Arquivos:** 260-mar-api, 261-mar-blocos, 262-mar-objetos, 263-mar-bichos, 264-mar-bichos2, 265-mar-mundo, 266-leviata, 267-oricalco, 268-mar-save, 269-mar-estados. A água e o nado já existiam (171-agua e 172-nadar); o Mar só usa.
- **Ids:** blocos 704 a 730 (reservados até 735), paredes 98 a 102, terceira camada 63 a 65, zonas 57 a 60.
- **Números:** monstros de nível 25 a 26, Leviatã nível 27, peças de oricalco nível de item 23. **8 minérios por barra** (a regra do 00-geral, como a lunarita), em vez dos 7 desta ficha.
- **Geração:** o mar é um vão aberto com a superfície da água a 32 fileiras do topo. O fundo é feito em patamares de 3, para os objetos caberem e para dar para subir nadando. Por mundo (escala `WSC`):
  - 2 ilhas de chegada, mais ilhas até 2 por `WSC`, cada uma com um túnel seco para as Chaminés;
  - navios, cascos boiando e cascos afundados com bolsões de ar, palafitas;
  - 2 fendas da Fossa com um templo da gente-peixe no fundo (porta debaixo da água, domo de ar em cima);
  - as grutas das Chaminés ligadas em anel, umas com poça fervente;
  - respiradouros em cada fenda e espalhados no mar fundo, longe do Leviatã.
  - As cordas de subir que ficariam no meio da água são tiradas: debaixo da água se nada.
- **Missões:** as 3 missões do ancião não foram feitas (as missões foram tiradas do jogo em 2026-10-10).
- **Prato do Odo:** Peixe-Cego na Brasa (1 peixe-cego e 1 de lenha), 16 de vida em 10 s.
- **Quem compra:**

  | Quem | O quê |
  |---|---|
  | Grimaldo | oricalco, escamas abissais e pérolas negras |
  | Marta | iscas vivas |
  | Aurélia | tinta de polvo |
  | Odo | peixe-cego |

- **Pedras preciosas:** entram na rocha do mar e no sulfeto (linha 12 da tabela do 00-geral).
- **Save:** o número do mundo (`wg`) não mudou nesta camada. As cinco camadas feitas juntas trocam o número uma vez só, na integração. O Leviatã guarda a morte em `leviata`.

