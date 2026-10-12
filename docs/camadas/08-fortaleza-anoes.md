# A Fortaleza dos Anões: ficha de implementação

> **2026-10-12:** a camada tem 558 m, de 3906 a 4464 m abaixo do chão do vilarejo: o desenho de 186 m esticado `LAYER_K = 3` vezes, com as faixas também 3 vezes mais altas e 3 andares de salas por faixa ([00-geral.md](00-geral.md), seção 1b). Os outros metros desta ficha são os do desenho de 186 m, da época em que ela foi escrita; dentro da camada, cada um vale 3. Quedas longas ganham pisos e o minério fica perto da borda (`js/313-quedas-minerios.js`), e a camada só é gerada quando o herói entra na de cima dela (`js/312-gera-aos-poucos.js`).

A oitava camada, debaixo da Floresta Petrificada, de 3906 a 4464 m. É Brasafunda, a fortaleza do clã de anões que ensinou a forja à superfície: salões de pedra e bronze, canais de lava em linha reta e forjas de runas que ainda funcionam sozinhas. Os anões não morreram lutando aqui dentro: foram expulsos por algo que subiu de baixo, e só ficaram as máquinas e os fantasmas.

**O que a diferencia:** aqui o fogo é domado. A lava corre em canais retos de pedra, coberta por grades, e serve para trabalhar; no Abismo o fogo é caos e carne, e no Covil do Dragão é vulcão vivo. É a camada mais construída e mais ordenada do jogo depois da Catedral, mas é uma oficina, não um templo.

---

## 1. Identidade

- **Faixas no jogo:** Portões de Bronze, Salões do Clã, Canais de Lava, Forjas de Runas.
- **Conceito:** o Clã da Bigorna cavou a sua fortaleza no granito fundo, desviou um rio de lava por canais e com ele forjou em mithril. Gravavam runas nas máquinas para que trabalhassem sem descanso. Um dia algo começou a cavar de baixo: túneis redondos, cera, zumbido. Os anões fecharam as comportas, ergueram barricadas viradas para baixo e, quando não deu mais, subiram com o que conseguiam carregar. As máquinas ficaram ligadas, cumprindo a última ordem: guardar. Os mortos ficaram também.
- **Gancho do Grimaldo:** a marca do clã (um martelo sobre uma montanha, com três runas embaixo) está em toda porta da fortaleza. É a mesma marca gravada, gasta, na bigorna do Grimaldo, que ele herdou do avô e nunca soube ler. A forja do vilarejo veio daqui, por mãos de anões que subiram.
- **Sensação:** respeito e melancolia. Um lugar grandioso, bem feito e vazio, onde as máquinas continuam trabalhando para ninguém.
- **Referências:** Moria (Senhor dos Anéis), Blackrock Depths (World of Warcraft), Dwarf Fortress, os autômatos de Dwemer em Skyrim.

---

## 2. Lugar no mundo

- **Profundidade:** 3906 a 4464 m. Zonas 37 a 40. Nome no código `ANOES`, prefixo `AN_`.
- **Nível dos monstros:** 17 na metade de cima da camada e 18 da metade para baixo (a partir de 279 m, a metade da camada); 30% vêm 1 nível acima, mas nunca passam de 18, então nenhum monstro daqui fica abaixo ou no nível da camada de cima. Chefe nível 19.

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 37 | Portões de Bronze | 1302 a 1348 | granito anão, cantaria | transição: o granito verde da Floresta some aos poucos; muralhas, portões de bronze arrombados, guaritas, a escadaria de entrada |
| 38 | Salões do Clã | 1348 a 1400 | cantaria, laje gravada | salões com colunas, refeitórios com mesas postas, dormitórios, túmulos dos reis com estátuas |
| 39 | Canais de Lava | 1400 a 1452 | pedra de canal, bronze | lava em canais retos com grades por cima, comportas, engrenagens gigantes, bombas, pontes de bronze |
| 40 | Forjas de Runas | 1452 a 1488 | tijolo refratário, bronze, cera seca | forjas, bigornas de runa, a Grande Forja (chefe), as comportas do fundo seladas e as brechas para baixo |

- **Entrada:** as duas descidas saem da última faixa da Floresta Petrificada: são as **escadarias do clã**, poços quadrados de cantaria com degraus de pedra e corrimão de bronze, abertos sob uma porta de bronze arrombada. Descem uns 24 blocos e chegam a um **pátio de guarita** nos Portões de Bronze. Volta-se pela mesma escadaria (escala como escada). As posições vêm de `fpExits`.
- **Saída:** duas **brechas** no chão das Forjas de Runas, longe uma da outra e da Grande Forja. São buracos redondos que a coisa de baixo furou através de uma comporta do fundo; a borda é forrada de cera seca (`AN_CERA`). A escada de pedra dos anões que descia ali está quebrada e foi remendada com corrente de bronze (`AN_CORRENTE`): desce uns 22 blocos até a primeira faixa da camada 9. O lado de baixo é da ficha da Colmeia. As posições ficam em `anExits`.
- **Câmara de pouso:** 12 x 6, laje plana, duas lâmpadas de runa, sem spawn. Uma ao pé de cada escadaria de entrada: é a sala da guarita.

---

## 3. Estrutura e geração (`js/155-anoes-mundo.js`)

`AN_D = LAYER_D` (558), topo dado pelo `LAYERS`. Gerado em pedaços, na ordem de `regras-de-bioma.md`. A fortaleza é **construída**: salas retangulares em grade, alinhadas em andares, ao contrário da Floresta.

1. **Rocha por faixa.** Granito anão em tudo, com bolsões de rocha natural. Nas primeiras 8 linhas o granito verde da Floresta afina por ruído.
2. **A planta da fortaleza:** cada faixa tem 2 ou 3 **andares** fixos (linhas de piso a cada 14 a 18 blocos), e as salas se alinham neles, como a mina faz com as galerias.
3. **Salas:**
   - Portões: **muralhas** com portão (salões de 30 a 44 x 12 a 16, com um portão de bronze de 4 x 6 caído no chão) e **guaritas** de 10 x 7 com seteiras (6 x `WSC` muralhas). Corredores retos de 3 de altura.
   - Salões do Clã: **grandes salões** de 36 a 56 x 14 a 20 com fileiras de colunas (6 x `WSC`), **refeitórios** de 20 x 8, **dormitórios** de 14 x 6 em fileira, e **túmulos dos reis** de 18 x 10 com estátuas (2 x `WSC`).
   - Canais de Lava: **salas de canal** de 40 a 60 x 12 a 18 (5 x `WSC`): um canal de lava de 3 de largura e 2 de fundo no chão, com grade de bronze por cima em quase todo o comprimento; **salas de máquinas** de 16 a 24 x 16 a 24 com engrenagens gigantes (objetos) e alavancas (4 x `WSC`); **eclusas**: poços de 6 x 20 com comportas que abrem e fecham a passagem.
   - Forjas de Runas: **forjas** de 24 a 32 x 12 (5 x `WSC`), com fornalha, bigornas e um canal curto; a **Oficina do Mestre** (1 por camada, 20 x 10, seção 8); a **Grande Forja** (64 x 28, seção 7).
4. **Ligações:** escadas anãs (`AN_ESCADA`) entre andares e em todo desnível de 5 blocos ou mais; poços com corrente de bronze nas eclusas; pontes de bronze sobre canais abertos.
5. **Estragos e sinais da fuga:** barricadas de entulho viradas para baixo (a pilha encosta na porta do lado de cima), portões arrombados de baixo para cima, colunas caídas nos salões, mesas tombadas, cera seca selando as comportas do fundo (faixa 40), cascas de quitina partidas nos cantos (faixas 39 e 40).
6. **Minérios:** carvão em toda a camada; mithril no granito, raro na faixa 37 e denso nas 39 e 40. Veios vezes `WSC`. Nada de cristal: os anões levaram.
7. **Alcance** a partir das duas escadarias (com pulo) e túneis de serviço retos se faltar.
8. **Decoração de 1 bloco.**
9. **Correção estrutural:** colunas do chão ao teto, ou saem. Grade sobre lava sempre tem apoio dos dois lados. Lava nunca fica no caminho obrigatório: todo canal tem grade ou ponte por cima, ou um degrau de borda de 1 bloco.
10. **Objetos** (`AN_PROP_PLAN`) com o terreno final, `anClimbFix` (a partir da Grande Forja, da Oficina, de cada eclusa e de cada túmulo) e o `worldLink` do 87.

Lava: o bloco `LAVA` (10) que já existe. Aqui ela só aparece **dentro de canais** de pedra de canal (`AN_CANAL`), nunca em lago ou cachoeira solta, e as comportas (`AN_COMPORTA`) mudam por onde ela corre (seção 14).

---

## 4. Blocos (`js/151-anoes-blocos.js`)

Ids 352 a 383.

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 352 | `AN_GRANITO` | Granito Anão | massa geral; cinza-azulado, grão fino | granito_anao |
| 353 | `AN_CANTARIA` | Cantaria Anã | paredes das salas; blocos retos, junta finíssima | cantaria_ana |
| 354 | `AN_LAJE` | Laje Gravada | chão dos salões; faixas de runas apagadas | laje_gravada |
| 355 | `AN_BRONZE` | Chapa de Bronze | máquinas, portas, trilhos; rebites | chapa_bronze |
| 356 | `AN_GRADE` | Grade de Bronze | sobre os canais; sólida para andar, deixa passar luz | grade_bronze |
| 357 | `AN_CANAL` | Pedra de Canal | leito e borda da lava; refratária, lisa | pedra_canal |
| 358 | `AN_TIJOLO` | Tijolo Refratário | forjas e chaminés; amarelo queimado | tijolo_refratario |
| 359 | `AN_EIXO` | Eixo de Engrenagem | peças de máquina; parece girar (animação) | chapa_bronze |
| 360 | `AN_COMPORTA` | Comporta | abre e fecha pela alavanca; não quebra | nenhum |
| 361 | `AN_CERA` | Cera Seca | sela as comportas do fundo e forra as brechas; amarelo-escuro em favos | cera_seca |
| 362 | `AN_BARREIRA` | Portão de Runas | fecha a Grande Forja durante a luta; não quebra | nenhum |
| 363 | `AN_O_CARVAO` | Veio de Carvão | no granito | carvao |
| 364 | `AN_O_MITHRIL` | Veio de Mithril | no granito; prata-azulado, brilho fraco | min_mithril |
| 365 | `AN_ENTULHO` | Barricada | entulho de pedra e bronze empilhado; quebra rápido | granito_anao |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio | Luz |
|---|---|---|---|---|
| 366 | `AN_ESCADA` | Escada Anã | parede; escala como escada | não |
| 367 | `AN_CORRENTE` | Corrente de Bronze | pendurada do teto; escala como `CHAIN` | não |
| 368 | `AN_ALAVANCA` | Alavanca | chão; interativa (seção 14) | brilho fraco na runa |
| 369 | `AN_LAMPADA` | Lâmpada de Runa | parede (olho) | forte, branco-azulada, sem tremer |
| 370 | `AN_BRASEIRO` | Braseiro de Forja | chão | forte, laranja estável |
| 371 | `AN_RUNA` | Runa no Piso | chão | fraca, azul |
| 372 | `AN_BARRIL` | Barril de Cerveja | chão | não |
| 373 | `AN_BIGORNA` | Bigorna Pequena | chão | não |
| 374 | `AN_TENAZ` | Tenazes e Malhos | chão | não |
| 375 | `AN_VAPOR` | Respiro de Vapor | chão; solta vapor (sem dano) | não |
| 376 | `AN_QUITINA` | Casca de Quitina | chão (faixas 39 e 40) | não |
| 377 | `AN_ELMO` | Elmo Anão Caído | chão | não |

Ids 378 a 383 ficam livres.

**Paredes de fundo (48 a 52):** `WAN_GRANITO`, `WAN_CANTARIA`, `WAN_RELEVO` (cantaria com relevos e runas apagadas), `WAN_BRONZE` (painéis de bronze escuro, sem brilho), `WAN_TIJOLO`.

**Terceira camada (33 a 35):** `DP_AN_SALOES` (colunatas e arcos gigantes ao longe), `DP_AN_MAQUINAS` (engrenagens do tamanho de casas e eixos parados), `DP_AN_FORJAS` (chaminés e o brilho laranja das forjas distantes).

---

## 5. Objetos de cena (`js/152-anoes-objetos.js`)

28 objetos com `anoes: true` e `AN_PROP_PLAN`. A Grande Forja e o trilho do chefe ficam no 156.

- **Chão:** portão de bronze caído (37), estátua de anão guerreiro com machado (37, 38), estátua de rei sentado (38, túmulos), sarcófago de pedra com tampa rúnica (38), mesa comprida posta e abandonada (38), banco de pedra (38), barril grande com torneira (38), beliche de pedra (38), carcaça de autômato desligado (todas; é a que o Barba-de-Ferro possui), engrenagem caída enorme (39), bomba de lava com tanque (39), fornalha de forja com fole, com luz (40), bigorna de runas grande, com luz (40), suporte de armas com lâminas largas inacabadas (40), carrinho de minério de bronze (37, 39), monte de lingotes velhos (40), barricada de mesas e escudos virada para baixo (39, 40), casulo de cera rachado e vazio (40).
- **Teto:** lustre de bronze com lâmpadas de runa, com luz (38), corrente com gancho de guindaste (39, 40), estandarte do clã (37, 38), roldana com corda (39).
- **Fundo + chão:** porta redonda de bronze do tesouro, arrombada e vazia (38; os anões levaram tudo), engrenagem gigante em relevo, girando devagar (39), **mural do êxodo** (38): anões subindo em fila com bigornas nas costas, e embaixo, pintados em vermelho, vultos com seis pernas.
- **Fundo (olho):** marca do clã em bronze (todas; a mesma da bigorna do Grimaldo), escudo e machados cruzados (37, 38), buraco hexagonal derretido numa chapa de bronze (40).

---

## 6. Os 10 monstros: autômatos de runa e fantasmas dos anões (`js/153-anoes-automatos.js` e `js/154-anoes-fantasmas.js`)

Os autômatos cumprem a última ordem (guardar) e não sangram: soltam faíscas e óleo. Os fantasmas são azulados e meio transparentes. Nenhum tem dano de contato, menos o Enxame de Engrenagens em serra (`touch`, com aviso).

| Tipo | Nome | Papel | Movimento | Ataque (com aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `soldbronze` | Soldado de Bronze | corpo a corpo | **marcha rígida**: anda em passos fixos e só vira parado, em 0,5 s; escudo sempre virado para o herói | a runa do peito fica vermelha e ele estoca com a lança atrás do escudo. De frente, o escudo bloqueia; é preciso pular por cima ou bater nas costas | 120 | 20 | 37, 38, 40 |
| `besteiroan` | Besteiro Fantasma | distância | **só existe nas seteiras**: aparece numa, atira, some e reaparece em outra da mesma sala | a seteira acende azul e se ouve o clique da besta 0,8 s antes; o virote atravessa 1 bloco de parede | 45 | 22 | 37, 38 |
| `engrenagens` | Enxame de Engrenagens | enxame | 5 rodinhas dentadas que rolam pelo chão e sobem degraus de 1 bloco, cada uma por si | quando 3 ou mais se encostam, encaixam com um clique e faíscas, e viram **uma serra** que corre reta pelo chão (`touch`) até bater na parede e se desmontar | 14 cada | 7 | 39, 40 |
| `fornalhaamb` | Fornalha Ambulante | pesado | anda devagar com uma fornalha no peito; **sem combustível, vai até o canal de lava mais perto** para recarregar (fica de costas 2 s) | a porta da fornalha brilha e o fole incha: jato de brasa em cone de 4 blocos. Com a porta aberta, toma o dobro de dano | 300 | 28 | 39, 40 |
| `ferreirofant` | Ferreiro Fantasma | distância | **preso à sua bigorna**: flutua num raio de 8 blocos em volta dela, atravessando parede; se a bigorna quebrar, ele some | ergue o malho e a runa dele brilha; arremessa o malho, que vai e **volta** como bumerangue | 70 | 19 | 38, 40 |
| `runaviva` | Runa Viva | emboscada (superfícies) | parece uma runa gravada; **desliza achatada pelo chão, parede e teto**, como um adesivo | as bordas descolam e um zumbido sobe 0,7 s; ela salta da superfície girando como disco em linha reta e volta a grudar onde bater | 40 | 24 | 37, 39, 40 |
| `coruja` | Coruja de Corda | voador | voa em **círculos largos** em volta do herói; a cada 3 voltas **pousa e dá corda** (a chave gira nas costas, 2 s parada) | os olhos piscam 3 vezes; rajada de 3 pregos de latão | 55 | 13 | 37, 38, 39 |
| `bombalava` | Bomba de Lava | distância, terreno | anda ao longo dos canais e **não se afasta mais de 10 blocos deles** | o tanque das costas fica laranja e o bico treme 1 s; cospe uma bolha de lava em arco que vira **poça de pedra quente**: queima por 2 s, depois esfria e vira bloco de pedra (some em 20 s) | 140 | 20 | 39, 40 |
| `barbaferro` | Barba-de-Ferro | apoio (fantasma) | atravessa paredes **em linha reta até a carcaça de autômato mais perto** e entra nela | deixa um rastro azul até a carcaça (o aviso); 1,5 s depois a carcaça acorda como Soldado de Bronze. Sozinho, só dá um toque gelado fraco | 60 | 10 | 38, 39, 40 |
| `juramentado` | Juramentado | duelista | fantasma de guerreiro que **anda sempre de frente, sem atravessar parede**; quando vê o herói, finca o machado | desenha um **círculo de runas** de 7 blocos em volta dos dois: o herói não sai até um cair ou passarem 12 s. Dentro, o círculo pulsa antes de cada golpe giratório | 150 | 24 | 38, 40 |

Detalhes que fazem cada um ser diferente:

- **Soldado:** é o tanque que obriga a mudar de lado. Em par, um guarda as costas do outro.
- **Besteiro:** as seteiras são blocos de cantaria com uma fenda (guaritas e muralhas). Sala sem seteira não tem besteiro.
- **Engrenagens:** sozinhas são fracas e lentas; o perigo é deixar 3 se juntarem.
- **Barba-de-Ferro:** matar ele antes de chegar à carcaça impede o Soldado. Quebrar a carcaça (objeto) também.
- **Bomba de Lava:** é o único monstro que muda o terreno. As pedras que ela cria podem fechar passagem por alguns segundos ou virar degrau.

**Drops:** `runa_gravada`, `mola_runica`, `brasa_domada`, `barba_espectral`, `min_mithril` (só aqui e abaixo), carvão, poções e as bases da camada. XP baixo.

**Spawn por faixa** (peso; máximo ao mesmo tempo):

| Faixa | Monstros (peso) | Máximo |
|---|---|---|
| 37 Portões de Bronze | soldbronze 30, besteiroan 25, coruja 25, runaviva 20 | até 7 monstros |
| 38 Salões do Clã | soldbronze 20, juramentado 18, ferreirofant 16, barbaferro 16, besteiroan 15, coruja 15 | até 8 monstros |
| 39 Canais de Lava | bombalava 24, engrenagens 22, fornalhaamb 18, runaviva 14, barbaferro 12, coruja 10 | até 8 monstros |
| 40 Forjas de Runas | fornalhaamb 20, ferreirofant 18, engrenagens 18, juramentado 16, soldbronze 14, runaviva 14 | até 8 monstros |

O Barba-de-Ferro conta o Soldado que ele acorda no máximo da faixa. O Ferreiro só nasce perto de uma bigorna; o Besteiro, só em sala com seteira.

---

## 7. Chefe: O Autômato-Forja (`js/156-automato-forja.js`)

**Quem é:** a máquina que movia a Grande Forja: uma ponte rolante com corpo de fornalha, um cadinho de metal derretido embaixo e dois braços (um malho e uma garra). Os anões a deixaram ligada para segurar a porta enquanto fugiam. Ela ainda segura.

**A sala: dentro da Grande Forja.** 64 x 28 na faixa 40, do outro lado do mundo em relação às duas escadarias. Um **trilho de bronze** corre de parede a parede a 3 blocos do teto, e o chefe anda pendurado nele. O chão tem 3 trechos de grade de bronze sobre um canal de lava que atravessa a sala. No teto há duas **bicas de lava** (calhas de bronze) em pontos fixos. Nas paredes laterais, quatro **alavancas** dos anões em plataformas de cantaria com escada: duas de **lava** (abrem a bica correspondente) e duas de **trava** (enfiam uma barra nas engrenagens do trilho). Ao entrar, os Portões de Runas fecham as duas saídas.

- **Vida:** 330 x (1 + 0,3 x 18) = **2112**. **Dano:** 9 x (1 + 0,2 x 18) = **41**. Nível 19.

**As alavancas:** o herói usa uma alavanca com a tecla de usar. Cada uma recarrega em 12 s (a runa dela apaga e volta a acender).
- **Lava:** a bica pinga 1 s e despeja uma coluna de lava por 3 s. Se o chefe estiver embaixo, perde 6% da vida máxima e superaquece: fica vermelho e lento por 3 s. A lava escorre pela grade para o canal, sem ficar no chão.
- **Trava:** o trilho para por 4 s com um estalo; o chefe fica preso no lugar e abre a escotilha do **núcleo** (brilha), que só pode ser atingido assim (+100% de dano). Fora da trava, só os braços tomam dano, quando estão embaixo.

**Fase 1 (100% a 60%): a ponte rolante.**
- Corre pelo trilho acompanhando o herói por cima.
- **Malho:** o braço sobe e a sombra dele fica no chão 0,8 s; desce e solta faíscas 2 blocos para cada lado.
- **Cadinho:** inclina e pinga gotas brilhantes por 1 s; derrama metal numa faixa de 3 blocos que fica acesa no chão por 4 s (queima).
- **Garra:** gira e assobia 0,7 s, depois desce reta. Se pega o herói, sobe e solta do alto.

**Fase 2 (60% a 25%): a forja acorda.**
- Acelera no trilho e solta 2 Enxames de Engrenagens por uma escotilha (sempre 2 no máximo).
- **Grades em brasa:** as grades do chão acendem em sequência, de um lado para o outro (cada uma fica laranja 1 s, depois queima por 2 s), empurrando o herói para as plataformas das alavancas.
- **Mão na alavanca:** às vezes a garra vai até uma alavanca de lava e puxa ela (o braço estica devagar até a parede): a bica cai onde o herói estiver perto. Bater na garra esticada (3 golpes) a faz soltar.

**Fase 3 (25% a 0): o trilho cede.**
- Um suporte do trilho arrebenta (estalo e poeira caindo 1 s antes) e o trilho fica **inclinado**, preso só de um lado. O chefe fica pendurado na ponta baixa e **balança como pêndulo**, varrendo a sala com o corpo: a corrente range e ele recua antes de cada balanço.
- O trilho inclinado vira **rampa**: o herói sobe por ele até as costas do chefe, onde o núcleo fica exposto no topo do balanço.
- As travas agora param o pêndulo no ponto onde ele estiver (4 s). A lava da bica passa a cair também quando o pêndulo cruza embaixo dela.

**Como a sala muda a luta:** o chefe nunca está no chão. O herói luta embaixo de uma máquina, usando as alavancas da sala para pará-la ou queimá-la: o mesmo que os anões faziam para trabalhar.

**Se o herói sair ou morrer:** a luta reinicia: vida cheia, trilho inteiro e reto, alavancas carregadas, grades frias, engrenagens somem. O trilho quebrado e o estado das alavancas não vão para os `diffs` até o chefe morrer; depois disso o trilho fica caído e as alavancas viram decoração.

**Lendário:** **Malho da Grande Forja** (slot `weapon`, maça, raridade 4, nível 19). Cada golpe seguido no mesmo alvo esquenta a cabeça do malho; no 4º, solta um anel de brasa (dano de fogo em volta, 2 blocos). Luz laranja fraca. **Save:** `autoforja.dead`.

---

## 8. Loot e economia (`js/157-mithril.js` e 155)

- **Metal: Mithril.** `min_mithril` -> `barra_mithril`, **7 minérios por barra**, forja nível **15**. As 9 peças de mithril na bigorna: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Leve: as peças de mithril pesam menos no vigor (mesma regra das outras, só que com o menor custo da lista).
- **Materiais próprios:**

| Id | Nome | De onde | Quem compra |
|---|---|---|---|
| `runa_gravada` | Runa Gravada | Soldado, Runa Viva, Coruja | o ferreiro (e a Bigorna de Runas) |
| `mola_runica` | Mola Rúnica | Coruja, Engrenagens | o ferreiro |
| `brasa_domada` | Brasa Domada | Fornalha Ambulante, Bomba de Lava | o ferreiro; na fornalha vale **2 carvões** |
| `barba_espectral` | Barba Espectral | Juramentado, Ferreiro, Barba-de-Ferro, Besteiro | a maga |

- **Bases temáticas** (só caem aqui, nível 17): **Machado de Guerra do Clã** (machado, empurra mais e acerta 2 alvos), **Elmo do Clã com Viseira** (elmo, mais defesa contra golpes de cima), **Escudo de Bronze Rúnico** (escudo, aparo alto e pesado).
- **Sem baús:** a camada não gera baú nenhum (só o baú do vilarejo existe). O loot vem dos monstros, do chefe e dos veios.
- **Onde caem as bases:** como drop raro (cerca de 1,5%) de monstros certos: o Machado de Guerra do Juramentado e do Soldado de Bronze, o Elmo do Clã do Besteiro e do Ferreiro Fantasma, o Escudo de Bronze Rúnico da Fornalha Ambulante e do Soldado. O Autômato-Forja solta uma das 3 com 50% de chance, além do Malho.

**O que o Grimaldo ganha: a Bigorna de Runas.**
- Na **Oficina do Mestre** (sala única da faixa 40), num pedestal sob a marca do clã, fica o **Cinzel de Runas** (`cinzel_runico`, item único, não vende).
- Quando o herói volta ao vilarejo com o cinzel na mochila e fala com o Grimaldo, ele fica com o cinzel (uma fala curta dele, reconhecendo a marca da bigorna do avô). Não é missão: é uma troca direta, sem registro.
- A partir daí a janela da forja ganha uma aba **Runas**, e a bigorna dele passa a ter a marca acesa em azul.
- **A aba Runas:** grava **uma** runa numa peça forjada (`f_*`) de qualquer metal. Custa 1 `runa_gravada` e 1 barra do metal da peça. As 4 runas: **Brasa** (dano de fogo nos golpes), **Pedra** (+defesa), **Fôlego** (+vigor) e **Têmpera** (+crítico), com valor pelo nível de item da peça. Gravar de novo troca a runa.
- É o que faz o equipamento forjado continuar útil por mais tempo, e dá uso para a `runa_gravada` que sobra.

---

## 9. Luz e atmosfera

- **Luz estável:** a lava dos canais dá luz laranja forte e **parada** (sem tremer, ao contrário do Abismo); as lâmpadas de runa dão branco-azulado frio; os braseiros de forja, laranja firme. Os salões são mais claros que as outras camadas fundas: foram feitos para trabalhar.
- **Partículas:** vapor subindo dos respiros e das grades (39), faíscas regulares saindo das forjas (40), fuligem caindo devagar das chaminés (40), poeira fina nos salões (38). Nenhuma cinza, nenhuma brasa solta no ar, nenhum sangue.
- **O sinal da Colmeia:** na faixa 40, perto das brechas, a luz das lâmpadas pisca de leve e a cera seca brilha em amarelo sujo.

---

## 10. Som (`js/97-ambiente.js`)

Cenário novo `anoes`, sem melodia:

- **Leito:** um zumbido grave e contínuo de máquina (ruído marrom em passa-banda baixo) e o eco seco de salão de pedra.
- **Eventos soltos:** batida de malho distante (uma ou duas, em tempo irregular), tique de engrenagem, sibilo de vapor, corrente rangendo, uma comporta batendo longe.
- **Por faixa:** os Portões têm vento passando nas seteiras; os Salões, um **coro grave de vozes sem palavras** numa nota só, muito baixo, que vem e vai (os fantasmas); os Canais, lava escorrendo lenta e regular (não borbulha como no Abismo); as Forjas, fole e bigorna mais perto. Perto das brechas, um **zumbido de inseto** muito baixo vem de baixo.
- **Monstros:** passo metálico duplo (Soldado), clique de besta (Besteiro), clique de encaixe (Engrenagens), fole (Fornalha), corda dando volta (Coruja), suspiro gelado (fantasmas).

---

## 11. Interface e progressão

- **Nomes de zona:** `ZONE_NAMES.push('Portões de Bronze', 'Salões do Clã', 'Canais de Lava', 'Forjas de Runas')`, ids 37 a 40.
- **Cor no mapa (Tab):** Portões `#5a646e`, Salões `#6a6052`, Canais `#8a3a14`, Forjas `#7a5a2a`. Os canais de lava aparecem no mapa como linhas `#e8700e`.
- Nada de texto de dica na tela. As alavancas não têm rótulo: a runa acesa na alavanca diz que ela está pronta.

---

## 12. Arte

Padrão do vilarejo: granulado, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar. Tudo é reto, simétrico e bem acabado, mas gasto: bronze com pátina, pedra com quinas lascadas.

| Material | Rampa (escuro para claro) |
|---|---|
| Granito anão | `#1e2228` `#2e343c` `#424a54` `#5a646e` `#7a848c` `#9ea6ac` |
| Bronze | `#2a1a0c` `#4a2e14` `#70461e` `#9a6a2c` `#c49448` `#e8c27a` |
| Pátina (detalhe do bronze) | `#1a2a24` `#264036` `#345a4a` `#4a7a62` `#6a9a7e` `#94bca0` |
| Tijolo refratário | `#3a2a18` `#5a4024` `#7a5832` `#9a7444` `#bc9660` `#dcbc88` |
| Lava dos canais | `#3a0c04` `#7a1e06` `#b8400a` `#e8700e` `#ffa62a` `#ffe08a` |
| Runa acesa | `#0e2a3a` `#145070` `#1e7aa8` `#3aa8d8` `#7ad0f0` `#d0f4ff` |
| Mithril (veio, barra) | `#1e2a3a` `#2e4258` `#46627e` `#6a8eac` `#9cc0d8` `#d8eef8` |
| Cera seca | `#2e220c` `#4a3814` `#6a521e` `#8a6c2a` `#a8883e` `#c6a65a` |

Os autômatos são de bronze com runas azuis; os fantasmas, na rampa da runa com 50% de transparência e barbas compridas. O Autômato-Forja: bronze e tijolo, fornalha aberta no peito (lava), runas azuis nos braços.

---

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/150-anoes-api.js` | ids, `AN_BANDS`, `AN_D = LAYER_D` (558), `AN_ZONE0`, `dwarfBand`, `anExits`, `anBoss`, entrada no `LAYERS`. `ANOES = false` desliga a camada. |
| `js/151-anoes-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, grade translúcida na luz, escada e corrente escaláveis |
| `js/152-anoes-objetos.js` | 28 objetos e `AN_PROP_PLAN` |
| `js/153-anoes-automatos.js` | soldado, engrenagens, fornalha, runa viva, coruja, bomba de lava |
| `js/154-anoes-fantasmas.js` | besteiro, ferreiro, barba-de-ferro, juramentado |
| `js/155-anoes-mundo.js` | geração em passos, andares, canais, zonas, spawn, nível, partículas, loja, `anClimbFix` |
| `js/156-automato-forja.js` | o chefe, a Grande Forja, o trilho, as alavancas da sala, o Malho |
| `js/157-mithril.js` | o metal na fornalha e na bigorna, as 3 bases, `brasa_domada` na fornalha |
| `js/158-anoes-save.js` | save da camada (`autoforja.dead`, alavancas e comportas, cinzel entregue) |
| `js/159-mecanismos-runas.js` | alavancas e comportas, e a Bigorna de Runas do Grimaldo (seção 14) |

---

## 14. Sistemas novos que a camada precisa

- **Alavancas e comportas** (`js/159-mecanismos-runas.js`). Uma alavanca (`AN_ALAVANCA`) guarda uma lista de alvos; usar a alavanca troca o estado deles: `AN_COMPORTA` vira ar ou volta a sólida (com animação de 0,4 s), e uma bica de lava liga ou desliga. A geração cria os pares (alavanca e alvos) junto com as eclusas. O estado de cada alavanca vai no save da camada, não nos `diffs`. Usa a tecla de usar que já existe (a do baú do vilarejo). A lava liberada só corre por canal que já existe (troca a lava de lugar, não cria lava solta), então não precisa de simulação de líquido.
- **Chefe pendurado num trilho.** O Autômato-Forja não usa gravidade nem busca de caminho: a posição dele é um número ao longo do trilho (e, na fase 3, um ângulo de pêndulo). Fica todo no 156, sem mexer na IA geral.
- **Bigorna de Runas** (no 159, embrulhando o `js/18-forja.js`): uma aba nova na janela da forja, aberta quando `anoes.cinzel` estiver salvo. Grava `rune` na peça forjada; o `js/49-itens-efeitos.js` lê a runa como mais uma linha de efeito. Peças sem runa continuam iguais, e saves antigos não mudam.
- **Possessão de carcaça.** As carcaças de autômato são objetos de cena; o Barba-de-Ferro troca uma carcaça por um Soldado de Bronze vivo (remove o objeto, cria o monstro no mesmo lugar). Se o Soldado morrer, a carcaça não volta.
- **Círculo de duelo.** O círculo do Juramentado é uma barreira temporária desenhada (não é bloco): impede o herói de sair do raio e some quando um dos dois cai ou o tempo acaba.

---

## 15. Decisões em aberto

1. **O Cinzel de Runas** fica na Oficina do Mestre (achado explorando) ou cai do Autômato-Forja? Recomendo a Oficina: a Bigorna de Runas não deve exigir matar o chefe, e a Oficina fica perto da Grande Forja de qualquer jeito.
2. **Alavanca precisa de tecla?** Recomendo usar a tecla de usar que já existe, sem tecla nova, e deixar bater com a arma também funcionar nas alavancas da Grande Forja (para não travar a luta).
3. **Os anões vivos:** a história diz que eles subiram. Vale ter um anão vivo em algum lugar do jogo (no vilarejo, depois da Fortaleza)? Recomendo deixar para o sistema de missões novo, e por enquanto só os sinais (marca, cinzel, acampamento da Floresta).
