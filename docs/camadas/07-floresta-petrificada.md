# A Floresta Petrificada: ficha de implementação

A sétima camada, debaixo da Cidade Afundada, de 1116 a 1302 m. É uma floresta inteira que a terra engoliu há milênios e que virou pedra sem cair: troncos de granito em pé do chão ao teto, raízes que viraram túneis e copas com folhas de cristal. É o único lugar do jogo onde o cristal é abundante.

**O que a diferencia:** é a única camada que foi viva e nunca foi construída. A Cidade de cima é rua e casa, a Fortaleza de baixo é cantaria e bronze, o Abismo é carne e fogo; aqui tudo é tronco, raiz e folha, só que de pedra, frio, silencioso e iluminado por dentro pelo cristal.

---

## 1. Identidade

- **Faixas no jogo:** Bosque Soterrado, Mata de Cristal, Raízes Profundas, Clareira dos Gigantes.
- **Conceito:** antes do vilarejo, antes da cidade, havia uma floresta na superfície. Um afundamento a engoliu de uma vez, com os bichos dentro. Um veio de água rica em sílica escorreu por ela durante eras e trocou a madeira por pedra, folha por folha; onde a seiva se juntou, cresceu cristal. Os bichos que ficaram aprenderam a viver de pedra e viraram pedra também. No fundo, na clareira dos troncos maiores, ainda corre o Cervo de Pedra, o último animal que lembra da luz do sol.
- **Sensação:** maravilha fria e desconfiança. É bonito demais para ser seguro: tudo parece estátua, e algumas estátuas se mexem.
- **Referências:** a Floresta Petrificada do Arizona, as cavernas de cristal de Naica, a Floresta Cristalina de Hollow Knight (os Picos de Cristal), Okami (o cervo), Princesa Mononoke (o Deus-Cervo).

---

## 2. Lugar no mundo

- **Profundidade:** 1116 a 1302 m. Zonas 33 a 36. Nome no código `FLORESTA`, prefixo `FP_`.
- **Nível dos monstros:** 14 + 1 a cada 60 m (até 16), 30% vêm 1 nível acima. Chefe nível 17.

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 33 | Bosque Soterrado | 1116 a 1162 | solo petrificado, casca de pedra | transição: a pedra da Cidade some aos poucos; troncos deitados, raízes descendo do teto, grutas baixas de terra endurecida |
| 34 | Mata de Cristal | 1162 a 1214 | granito verde, folhagem de cristal | troncos em pé do chão ao teto, copas de folhas de cristal em andares, geodos por toda parte: o coração do cristal |
| 35 | Raízes Profundas | 1214 a 1266 | raiz de pedra, seiva vítrea | um emaranhado de raízes gigantes que viram pontes, redes e túneis ocos; seiva vidrada pingando |
| 36 | Clareira dos Gigantes | 1266 a 1302 | granito verde, cerne de pedra | troncos de 4 a 6 blocos de largura, salões altos, a clareira do Cervo e as escadarias dos anões |

- **Entrada:** as duas descidas saem da última faixa da Cidade Afundada. Deste lado, cada uma chega pelo teto do Bosque Soterrado ao longo de uma **raiz gigante petrificada** que atravessa a rocha de cima a baixo: degraus cortados na própria raiz (`FP_RAIZ_ESCADA`) descem uns 18 blocos até a câmara de pouso. Volta-se subindo os mesmos degraus. A primeira faixa lê as posições que a Cidade anotou (o `cdExits`, ou o nome que a ficha 06 der) e abre a raiz ali.
- **Saída:** duas **escadarias dos anões** no chão da Clareira dos Gigantes, longe uma da outra e do outro lado do mundo em relação à clareira do chefe. São poços quadrados de cantaria cortados no granito, com degraus de pedra e corrimão de bronze, e uma porta de bronze arrombada em cima. Descem uns 24 blocos até a primeira faixa da Fortaleza. É a primeira prova de que os anões subiram até aqui (para buscar cristal e platina, e depois para fugir). As posições ficam em `fpExits`.
- **Câmara de pouso:** 12 x 6 blocos, chão plano de granito, duas drusas acesas na parede, sem spawn. Uma ao pé de cada raiz de entrada.

---

## 3. Estrutura e geração (`js/145-floresta-mundo.js`)

`FP_D = 186`, topo dado pelo registro `LAYERS`. Gerado em pedaços (um passo por chamada), na ordem de `regras-de-bioma.md`.

1. **Rocha por faixa.** Solo petrificado em cima, granito verde no meio, raiz de pedra nas Raízes, granito e cerne no fundo. As bordas se misturam por ruído. Nas primeiras 8 linhas a pedra da Cidade (o bloco de massa da ficha 06) vai rareando por ruído e o solo petrificado aparece.
2. **A floresta enterrada** (antes de cavar): o gerador planta a floresta como ela era. Em cada coluna sorteada nasce um tronco (casca por fora, cerne por dentro) com raízes que se abrem embaixo e uma copa de folhagem de cristal em cima. Troncos de 2 a 3 blocos de largura nas faixas 33 a 35 e de 4 a 6 na 36. Um a cada cinco nasce deitado, em diagonal de 20 a 35 graus: vira rampa natural.
3. **Salas, cavando o espaço entre as árvores:**
   - Bosque Soterrado: **grutas de terra** de 12 a 26 x 6 a 10, baixas e compridas, presas entre troncos deitados (8 x `WSC`). Túneis "minhoca" de 3 de altura ligam tudo.
   - Mata de Cristal: **clareiras ocas** de 30 a 50 x 16 a 26 (5 x `WSC`). Cada uma tem 2 a 4 troncos em pé do chão ao teto e as copas viram **andares de folhagem** a 6 e 12 blocos do chão (plataformas de `FP_FOLHA` de 1 de espessura, com buracos).
   - Raízes Profundas: **redes de raiz** de 14 a 24 x 10 a 16 (7 x `WSC`), cortadas por raízes de 1 a 2 de espessura, na horizontal e na diagonal, que servem de piso. Entre elas, **raízes ocas**: túneis de 2 a 3 de altura por dentro de raízes de 5 de espessura, tortos e compridos (até 60 blocos).
   - Clareira dos Gigantes: **salões de troncos gigantes** de 40 a 60 x 20 a 28 (3 x `WSC`) e a **clareira do Cervo** (120 x 24, seção 7).
   - Câmaras de pouso nas duas entradas e um **acampamento anão** abandonado por camada (16 x 7, na faixa 36, perto de uma escadaria): tábuas, fogueira apagada, picaretas de bronze, cestos de cristal.
4. **Ligações:** cipós de pedra (`FP_CIPO`, escalam como corrente) descendo das copas e dos tetos; degraus de raiz em todo desnível de 5 blocos ou mais; os andares de folhagem ligados ao chão por cipó.
5. **Estragos:** troncos que racharam e caíram atravessando salas, montes de cascalho de cristal, solo desabado nas grutas, geodos partidos ao meio mostrando o cristal.
6. **Minérios:** carvão (madeira fóssil) nas faixas 33 a 35, no solo e no granito; platina no granito e na raiz, mais densa nas faixas 35 e 36; cristal em **geodos** (bolhas de 3x3 a 5x5 com casca de granito e miolo de `FP_O_CRISTAL`), 3 vezes mais comuns na Mata de Cristal. Veios multiplicados por `WSC`.
7. **Alcance** a partir das duas entradas (preenchimento e busca com pulo); túneis se faltar.
8. **Decoração de 1 bloco.**
9. **Correção estrutural:** tronco em pé tem que tocar chão e teto; se não toca, vira toco (corta em cima) ou some. Copa sem tronco embaixo sai. Cipó precisa de teto sólido. Folha caída só em chão.
10. **Objetos** (`FP_PROP_PLAN`) com o terreno final, depois `fpClimbFix` (busca andando e pulando a partir da clareira do chefe, do acampamento anão, do fim de cada raiz oca e de cada salão de gigantes até as raízes de entrada) e o `worldLink` do 87 na faixa da camada.

`FP_FOLHA` é sólida mas quebra rápido e deixa a luz passar: o herói anda na copa, e o chão de baixo não fica escuro.

---

## 4. Blocos (`js/141-floresta-blocos.js`)

Ids 320 a 351.

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 320 | `FP_SOLO` | Solo Petrificado | massa do Bosque; terra marrom endurecida com folhas fósseis | solo_petrificado |
| 321 | `FP_CASCA` | Casca de Pedra | por fora dos troncos; sulcos verticais | casca_pedra |
| 322 | `FP_CERNE` | Cerne de Pedra | por dentro dos troncos; anéis claros | cerne_pedra |
| 323 | `FP_GRANITO` | Granito Verde | massa geral; cinza esverdeado com pintas | granito_verde |
| 324 | `FP_RAIZ` | Raiz de Pedra | massa das Raízes; fibras torcidas | raiz_pedra |
| 325 | `FP_FOLHA` | Folhagem de Cristal | copas e andares; translúcida, luz fraca, quebra rápido | folha_cristal (às vezes) |
| 326 | `FP_SEIVA` | Seiva Vítrea | bolsões nas Raízes; vidro verde-limão translúcido | seiva_vitrea |
| 327 | `FP_MUSGO` | Pedra Musgosa | forro de parede e teto, nunca no chão | granito_verde |
| 328 | `FP_CASCALHO` | Cascalho de Cristal | chão da Mata e da Clareira; estala ao pisar | cascalho_cristal |
| 329 | `FP_TRONCO_G` | Tronco Gigante | troncos da clareira do chefe; não quebra com ferramenta | nenhum |
| 330 | `FP_BARREIRA` | Muralha de Raízes | fecha a clareira durante a luta; não quebra | nenhum |
| 331 | `FP_O_CARVAO` | Veio de Carvão | madeira fóssil no solo e no granito | carvao |
| 332 | `FP_O_PLATINA` | Veio de Platina | no granito e na raiz; branco-acinzentado, brilho frio | min_platina |
| 333 | `FP_O_CRISTAL` | Miolo de Geodo | cristal dentro dos geodos; luz fraca; solta 1 a 3 | min_cristal |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio | Luz |
|---|---|---|---|---|
| 334 | `FP_FOLHAS` | Folhas de Cristal Caídas | chão | fraca, verde fria |
| 335 | `FP_BROTO` | Broto de Cristal | chão | média, ciano |
| 336 | `FP_CIPO` | Cipó de Pedra | pendurado do teto; escala como `CHAIN`; quebrar o de cima derruba a fila | não |
| 337 | `FP_RAIZ_ESCADA` | Degraus de Raiz | encostado em raiz ou tronco; escala como escada | não |
| 338 | `FP_PINGO` | Estalactite de Seiva | teto | fraca, verde-limão |
| 339 | `FP_SAMAMBAIA` | Samambaia de Pedra | chão | não |
| 340 | `FP_PINHAS` | Pinhas de Pedra | chão | não |
| 341 | `FP_PINGENTE` | Pingente de Cristal | teto; tilinta quando algo passa embaixo | fraca |
| 342 | `FP_OSSADA` | Ossada Petrificada | chão | não |
| 343 | `FP_TOCO` | Toco Petrificado | chão | não |
| 344 | `FP_DRUSA` | Drusa Acesa | chão ou parede de raiz | forte, branco-azulada (a "tocha" da camada) |
| 345 | `FP_NINHO` | Ninho de Gravetos de Pedra | chão | não |

Ids 346 a 351 ficam livres.

**Paredes de fundo (43 a 47):** `WFP_SOLO`, `WFP_GRANITO`, `WFP_CASCA` (atrás dos troncos ocos), `WFP_RAIZ`, `WFP_CRISTAL` (cristal escuro e fosco, quase cinza; sem brilho, como manda a regra de parede).

**Terceira camada (30 a 32):** `DP_FP_TRONCOS` (troncos gigantes ao longe, sumindo no escuro), `DP_FP_COPAS` (copas de cristal distantes com pontinhos de brilho parados), `DP_FP_RAIZES` (raízes enormes cruzando o fundo).

---

## 5. Objetos de cena (`js/142-floresta-objetos.js`)

28 objetos com `floresta: true` e o plano `FP_PROP_PLAN` (`chao`, `teto`, `fundo`). Faixas entre parênteses.

- **Chão:** toco oco grande (todas), tronco caído curto (33, 34), raiz arqueada saindo do chão (33, 35), pedra com samambaias (33, 34), cervo petrificado de pé (34, 36), javali petrificado deitado (33), lobo petrificado uivando (34), coruja petrificada num toco (34), geodo partido grande, com luz (34, 35), aglomerado de cristais altos, com luz (34, 36), bolha de seiva com um inseto preso (35), cogumelo-prateleira de pedra no pé do tronco (33, 35), monte de pinhas e folhas de cristal (34), círculo de pedras antigo (36), fogueira apagada dos anões (36, acampamento), cesto de cristais dos anões (36, acampamento), picareta de bronze cravada (36), marco de pedra anão com runa (36, perto das escadarias).
- **Teto:** copa de cristal pendente, com luz (34), cortina de raízes finas (33, 35), ninho de pássaro de pedra (34), cacho de pingentes grandes, com luz (34, 36), raiz gigante saindo do teto (35).
- **Fundo + chão:** tronco largo em relevo na parede (todas), porta de raiz oca para lugar nenhum (35), galhada enorme fóssil presa na parede (36).
- **Fundo (olho):** casca com marcas de garra (33, 36), veio de seiva brilhando na parede, com luz (35).

Todo objeto guarda o apoio; quebrar o apoio derruba e fica salvo.

---

## 6. Os 10 monstros: bestas de raiz, de pedra e de cristal (`js/143-floresta-bichos.js` e `js/144-floresta-bichos2.js`)

Vida e dano de nível 1 (o jogo escala). Nenhum tem dano de contato, menos o Tatu rolando e o Tronco plantado (`touch`), e os dois avisam antes.

| Tipo | Nome | Papel | Movimento | Ataque (com aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `lagartoqz` | Lagarto de Quartzo | corpo a corpo | **só se mexe quando o herói está de costas para ele**; olhado, congela como estátua | os olhos acendem e a cauda estala, e ele dá uma mordida em salto curto | 70 | 18 | 34, 36 |
| `estrangula` | Raiz Estranguladora | emboscada (chão) | **não anda: cresce**. É um bulbo preso na parede; estica uma raiz pelo chão, bloco a bloco, atrás do herói | a ponta da raiz se ergue e as folhinhas tremem 0,6 s; depois agarra: o herói fica preso 1 s e toma dano | 110 | 14 | 33, 35 |
| `tatupedra` | Tatu de Granito | pesado | anda devagar; para atacar **vira bola e quica** pelas paredes, subindo rampas e troncos deitados | se enrola com som de pedra raspando e fica parado 0,7 s antes de rolar; rolando, machuca (`touch`); tonto 1,5 s quando bate de frente em tronco | 130 | 22 | 33, 36 |
| `mariposacr` | Mariposa de Cristal | voador | **é atraída pela luz**: circula a fonte de luz mais forte por perto (drusa, tocha, o herói com tocha) | as asas acendem por inteiro e ela solta um leque de 5 lascas | 34 | 14 | 34, 35 |
| `driade` | Dríade de Pedra | distância | **anda dentro da parede de fundo**, escura, onde não dá para atingir; sai para o plano da frente só para lançar | joga 3 sementes de cristal em arco; onde cai, um círculo brilha 0,8 s e brota um espinho de 2 blocos por 3 s | 80 | 17 | 34, 35, 36 |
| `sementes` | Sementes Saltadoras | enxame | bando de 6 sementes de pedra que **pulam todas juntas, no mesmo ritmo** | o bando se agacha e chacoalha junto; no pulo seguinte cai todo em cima do herói | 12 cada | 6 | 33, 34 |
| `troncovelho` | Tronco Andante | pesado | anda devagar sobre raízes; **para e se planta** no chão: plantado toma metade do dano e regenera; arrancar as raízes leva 1 s | o galho range e sobe: varrida larga; plantado, bate o pé e folhas de cristal caem do teto (sombras) | 280 | 28 | 35, 36 |
| `ourico` | Ouriço de Cristal | distância curta | anda devagar e **muda de direção quando é atingido** | os espinhos acendem um por um, em volta; quando todos acendem, dispara 8 em todas as direções. Depois fica careca 3 s (vulnerável) | 90 | 15 | 34, 36 |
| `serpraiz` | Serpente de Raiz | emboscada (parede) | **mora num buraco de tronco ou raiz** e não sai dele; se estica como mola até 6 blocos e volta | dois olhos acendem dentro do buraco e a casca range; meio segundo depois, bote reto | 75 | 21 | 33, 35 |
| `prismavivo` | Prisma Vivo | voador, distância | flutua devagar e **só para em linha reta com o herói** (horizontal, vertical ou diagonal), como uma rainha do xadrez | uma linha fina de luz mostra a mira 0,9 s; depois o raio, que quica uma vez em cristal (folhagem, geodo) | 50 | 20 | 34, 35, 36 |

Detalhes que fazem cada um ser diferente:

- **Lagarto:** a regra é o lado para onde o herói olha, não a linha de visão. Em grupo de 2 ou 3, obriga o herói a virar o tempo todo.
- **Raiz Estranguladora:** a raiz que cresce é decoração temporária (`FP_RAIZ_VIVA`, guardada no monstro, não no mapa). Cortar a raiz (2 golpes) faz ela recolher e o bulbo fica 3 s exposto. Ela não atravessa bloco sólido.
- **Tatu:** a bola segue a física de quique (perde 20% da velocidade a cada parede). Não sobe escada nem cipó.
- **Mariposa:** se o herói guardar a tocha, ela perde o interesse e vai para a drusa mais próxima.
- **Dríade:** usa o mesmo caminho que o herói por dentro da parede de fundo (só onde existe parede de fundo).
- **Prisma:** o raio é a única coisa da camada que atravessa folhagem de cristal.

**Drops:** `casca_petrea`, `folha_cristal`, `seiva_vitrea`, `olho_prisma`, `min_cristal` (comum), `min_platina` (só aqui e abaixo), carvão, poções e as bases da camada (seção 8). XP baixo, como hoje.

**Spawn por faixa** (peso; máximo ao mesmo tempo):

| Faixa | Monstros (peso) | Máximo |
|---|---|---|
| 33 Bosque Soterrado | sementes 30, estrangula 25, serpraiz 20, tatupedra 15 | até 7 monstros |
| 34 Mata de Cristal | mariposacr 22, lagartoqz 20, driade 18, prismavivo 15, ourico 15, sementes 10 | até 8 monstros |
| 35 Raízes Profundas | estrangula 22, serpraiz 22, driade 18, mariposacr 14, troncovelho 12, prismavivo 12 | até 8 monstros |
| 36 Clareira dos Gigantes | troncovelho 24, lagartoqz 22, tatupedra 20, ourico 18, driade 16, prismavivo 10 | até 7 monstros |

Os 10 aparecem em pelo menos uma faixa; cada faixa usa de 4 a 6. O enxame conta como 1 no máximo.

---

## 7. Chefe: O Cervo de Pedra (`js/146-cervo-pedra.js`)

**Quem é:** o último bicho da floresta que lembra do sol. Um cervo do tamanho de uma casa, pele de granito com musgo e uma galhada de raízes. Ele não espera o herói: corre.

**A sala: a Clareira dos Troncos Gigantes.** 120 x 24 blocos na faixa 36, do outro lado do mundo em relação às duas escadarias. Chão quase plano de cascalho de cristal, teto alto de raízes, entradas nas duas pontas. Sete troncos gigantes (`FP_TRONCO_G`, 4 de largura, do chão ao teto) espalhados a cada 14 ou 16 blocos. No meio da sala, uma fenda de 10 blocos com espinhos de cristal no fundo (dá dano e devolve o herói à borda); ela só se atravessa por cima de um tronco caído ou pulando de uma raiz. Ao entrar, a Muralha de Raízes fecha as pontas.

- **Vida:** 330 x (1 + 0,3 x 16) = **1914**. **Dano:** 9 x (1 + 0,2 x 16) = **38**. Nível 17.

**Fase 1 (100% a 60%): a corrida.**
- **Investida:** raspa o casco no chão 2 vezes, abaixa a galhada (faíscas verdes nas pontas) e corre em linha reta até a parede. Se houver tronco no caminho, ele **atravessa**: uma rachadura branca sobe pelo tronco 1 s antes, e o tronco cai para o lado da corrida e vira uma **plataforma deitada**, inclinada, apoiada no chão ou no tronco vizinho.
- **Coice:** se o herói fica atrás dele, as patas de trás brilham 0,5 s e ele dá um coice curto.
- **Empinada:** se ergue nas patas de trás (pose alta, 0,7 s) e bate as da frente: uma onda corre pelo chão 6 blocos para cada lado. Pula-se, ou sobe-se num tronco caído.

**Fase 2 (60% a 25%): a fuga pelo alto.**
- A galhada floresce em cristal. Ele corre para a ponta mais longe e **sobe nos troncos caídos**, ficando no alto; só desce quando o herói chega perto, e então corre para a outra ponta.
- **Chuva de folhas:** sacode a galhada; sombras aparecem no chão 1 s antes das folhas de cristal caírem.
- **Berro:** a galhada pisca 3 vezes e os 2 troncos em pé mais perto do herói racham juntos (rachaduras brancas) e caem. A sala vai virando uma escada de troncos.

**Fase 3 (25% a 0): o cerne.**
- A pele racha e aparece o cerne de cristal no peito (brilha; acertar ali dá +50% de dano).
- **Salto entre troncos:** pula de tronco caído em tronco caído. A cada pouso, o tronco onde ele pousou racha (rachadura sobe 1 s) e quebra em cascalho; nunca quebra os dois últimos, para a sala não ficar sem plataforma.
- **Mergulho:** do alto, abaixa a galhada; uma linha de lascas de cristal marca no chão o caminho da descida em diagonal 0,8 s antes.
- **Cansaço:** a cada 3 investidas ou mergulhos, para ofegante 2 s, com a cabeça baixa: a melhor janela para bater no cerne.

**Como a sala muda a luta:** começa como um corredor plano com obstáculos e termina como um andaime de troncos deitados. O herói não escolhe onde lutar: ele persegue, e o terreno que o Cervo derruba é o caminho para alcançá-lo.

**Se o herói sair ou morrer:** a luta reinicia. O Cervo volta com a vida cheia para o fundo da clareira e os troncos voltam de pé: a sala é guardada como molde (`fpBossMold`) e restaurada inteira, inclusive a fenda. Depois que ele morre, os troncos ficam como caíram (entra nos `diffs`).

**Lendário:** **Galhada do Cervo de Pedra** (slot `head`, raridade 4, nível 17). +10% de velocidade de corrida; correr 1 s sem parar carrega uma **investida**: o próximo golpe empurra longe e causa +50% de dano; luz fraca verde-cristal. **Save:** `cervo.dead`.

---

## 8. Loot e economia (`js/147-platina.js` e 145)

- **Metal: Platina.** `min_platina` -> `barra_platina`, **6 minérios por barra**, forja nível **12**. A bigorna do Grimaldo ganha as 9 peças de platina: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Entra em `FURN` e no gerador de peças forjadas do `js/05-itens.js` por embrulho, como o 110 faz com a infernita.
- **Cristal:** `min_cristal` (o Cristal Bruto que já existe) cai muito aqui: geodos, Ouriço e Prisma. Continua pedra preciosa, não vai para a fornalha; o Grimaldo compra. O `ORE_WHERE` dele passa a dizer "abundante na Floresta Petrificada".
- **Materiais próprios:**

| Id | Nome | De onde | Quem compra |
|---|---|---|---|
| `casca_petrea` | Casca Petrificada | Tronco Andante, Tatu | o ferreiro |
| `folha_cristal` | Folha de Cristal | Mariposa, folhagem quebrada (às vezes) | a alquimista |
| `seiva_vitrea` | Seiva Vítrea | Raiz Estranguladora, bolsões de seiva | a curandeira |
| `olho_prisma` | Olho de Prisma | Prisma Vivo | a maga |

- **Bases temáticas** (só caem aqui, nível 14): **Lança de Raiz Petrificada** (lança, alcance +4), **Escudo de Casca de Pedra** (escudo, mais defesa e aparo baixo), **Manto de Folhas de Cristal** (peitoral leve, dá luz fraca).
- **Sem baús:** a camada não gera baú nenhum (só o baú do vilarejo existe). O loot vem dos monstros, do chefe e dos blocos (geodos, veios).
- **Onde caem as bases:** como drop raro (cerca de 1,5%) de monstros certos: a Lança de Raiz do Tronco Andante e da Serpente de Raiz, o Escudo de Casca do Tatu de Granito e do Ouriço, o Manto de Folhas da Dríade e da Mariposa. O Cervo de Pedra solta uma das 3 com 50% de chance, além da Galhada.
- **Itens de bloco:** granito verde, casca, cerne, folhagem de cristal (bloco que deixa a luz passar) e seiva vítrea (vidro verde) dão material bonito para construir no vilarejo.

---

## 9. Luz e atmosfera

- Escura, mas nunca negra: o cristal ilumina por dentro. Luz fria verde-azulada da folhagem e dos geodos, branca-azulada nas drusas, verde-limão fraca na seiva. **Nenhuma chama própria**: a única luz quente é a fogueira apagada dos anões (brasa fraca) e a tocha do herói.
- A folhagem de cristal deixa a luz passar (não conta como bloco opaco na luz) e soma um pouco de brilho quando há luz forte perto: as copas acendem quando o herói passa com tocha.
- **Partículas:** poeira de cristal cintilando caindo das copas (34), folhas de cristal girando devagar (34, 36), gotas de seiva brilhando (35), pó de pedra quando um bicho se mexe.

---

## 10. Som (`js/97-ambiente.js`)

Cenário novo `floresta`, sem melodia:

- **Leito:** vento muito grave e oco, como ar passando por troncos (ruído marrom em passa-baixa, respirando devagar), e um eco longo e frio.
- **Eventos soltos:** tilintar de cristal (2 ou 3 notas soltas, agudas, de altura sorteada, sem formar frase), estalo de pedra assentando, rangido de casca, gota caindo em vidro.
- **Por faixa:** o Bosque tem terra escorrendo; a Mata, mais tilintar; as Raízes, gotas de seiva e um gemido de madeira grave; a Clareira, **cascos ao longe**, que somem quando o Cervo morre.
- **Monstros:** estalo de cauda (Lagarto), casca rangendo (Serpente), raspar de pedra (Tatu), zumbido de vidro (Mariposa), sino fino subindo (Prisma carregando).

---

## 11. Interface e progressão

- **Nomes de zona:** `ZONE_NAMES.push('Bosque Soterrado', 'Mata de Cristal', 'Raízes Profundas', 'Clareira dos Gigantes')`, ids 33 a 36. Aparece ao entrar, como hoje.
- **Cor no mapa (Tab):** Bosque `#4a3e30`, Mata `#3a7a78`, Raízes `#4e5a2a`, Clareira `#3c5444`. O cristal (geodos) aparece no mapa como pontinhos `#8ad8cc`.
- Nada de texto de dica na tela.
- Missões: nenhuma nesta ficha (o sistema de missões vai ser refeito).

---

## 12. Arte

Padrão do vilarejo: granulado, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar. A pedra é pedra, mas a forma é de árvore: sulcos, anéis, nós e galhos.

| Material | Rampa (escuro para claro) |
|---|---|
| Granito verde | `#1c2420` `#2c3a32` `#3e5044` `#566a5a` `#74887a` `#98aa9a` |
| Casca de pedra | `#221c18` `#3a3028` `#54463a` `#6e5e4e` `#8c7a66` `#ae9a84` |
| Cerne (anéis) | `#2e2a22` `#4a4436` `#6a614c` `#8c8266` `#b0a688` `#d2caae` |
| Raiz de pedra | `#1e1814` `#33291f` `#4c3e2e` `#665440` `#836e56` `#a48c72` |
| Cristal (folha, geodo) | `#16303a` `#1f5260` `#2f7e8a` `#4fb0b0` `#8ad8cc` `#d4f4ec` |
| Seiva vítrea | `#2a3010` `#4a5418` `#6e7c22` `#9aa83a` `#c4cc6a` `#e6ecac` |
| Platina (veio, barra) | `#3a3c44` `#5e626c` `#8a8e98` `#b4b8c0` `#d6d8dc` `#f0f0ec` |

O cristal é a única cor viva da camada; o resto é verde-acinzentado e marrom apagado. Os monstros usam a rampa do material de que são feitos, com olhos de cristal. O Cervo: granito com musgo, galhada de raiz que vira cristal na fase 2 e o cerne `#d4f4ec` na fase 3.

---

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/140-floresta-api.js` | ids, `FP_BANDS`, `FP_D = 186`, `FP_ZONE0`, `forestBand`, `fpExits`, `fpBoss`, entrada no `LAYERS`. `FLORESTA = false` desliga a camada. |
| `js/141-floresta-blocos.js` | texturas, paredes, terceira camada, minérios, geodos, decoração, itens de bloco, cipó e degraus de raiz escaláveis, folhagem translúcida na luz |
| `js/142-floresta-objetos.js` | 28 objetos e `FP_PROP_PLAN` |
| `js/143-floresta-bichos.js` | lagarto, raiz estranguladora, tatu, mariposa, dríade |
| `js/144-floresta-bichos2.js` | sementes, tronco andante, ouriço, serpente de raiz, prisma |
| `js/145-floresta-mundo.js` | geração em passos, a floresta enterrada, zonas, spawn, nível, brilhos, partículas, loja, `fpClimbFix` |
| `js/146-cervo-pedra.js` | o chefe, a clareira, o molde da sala, a Galhada |
| `js/147-platina.js` | o metal na fornalha e na bigorna, as 3 bases |
| `js/148-floresta-save.js` | save da camada (`cervo.dead`, molde da clareira) |
| `js/149-troncos-queda.js` | o sistema de troncos que caem (seção 14) |

---

## 14. Sistemas novos que a camada precisa

- **Troncos que caem e viram plataforma** (`js/149-troncos-queda.js`). Hoje nenhum chefe muda o terreno de forma grande. O sistema recebe um tronco (retângulo de blocos) e um lado; desenha a queda como um sprite girando por 0,6 s; no fim, apaga os blocos em pé e carimba os blocos deitados numa linha inclinada pré-calculada (a geração já guarda as duas posições de cada tronco da clareira). Durante a queda, quem estiver embaixo do tronco toma dano e é empurrado (a sombra no chão é o aviso). Mexe em `tiles` pelo caminho normal de quebra e colocação, então luz, mapa e `diffs` se atualizam sozinhos. Só o 146 usa por enquanto, mas fica genérico para o Titã e o Arquiteto.
- **Monstro no plano de fundo.** A Dríade anda "dentro" da parede de fundo: um sinal `bg: true` que a desenha atrás dos blocos da frente, mais escura, sem caixa de colisão com o herói, e usa a busca de caminho sobre as paredes em vez do ar. Quando sai, o sinal desliga. Embrulha o desenho e o teste de acerto do `12-inimigos-ia.js`.
- **Decoração temporária de monstro.** A raiz da Estranguladora é uma lista de blocos não sólidos que o monstro desenha e testa sozinho, sem tocar no mapa; some quando ele morre.
- **Folhagem translúcida.** `FP_FOLHA` é sólida para andar, mas a luz passa por ela (como passa pelo ar, com perda pequena). Precisa de um vetor `CLEAR[id]` no cálculo de luz do `07-chunks-luz.js`, por embrulho.

---

## 15. Decisões em aberto

1. **Cristal com mais uso.** Hoje o cristal só vende. Com ele abundante aqui, vale dar um uso (por exemplo engastar em peça forjada para +luz ou +crítico)? Recomendo esperar a Bigorna de Runas da Fortaleza e decidir junto, para não criar dois sistemas de encaixe.
2. **O Lagarto de Quartzo** (só anda quando você está de costas) pode irritar em grupo. Recomendo no máximo 2 por vez e testar.
3. **A fenda da clareira do chefe:** cair dá dano e devolve à borda, ou mata? Recomendo dano e devolver, para a perseguição não virar punição.
