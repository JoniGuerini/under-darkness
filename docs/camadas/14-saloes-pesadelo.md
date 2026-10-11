# Os Salões do Pesadelo: ficha de implementação

Camada 14, de 2418 a 2604 m, debaixo da Cidade dos Antigos e em cima do Abismo. É o lugar onde o sonho vira real: uma casa que não existe, corredores que se repetem, quartos de infância esquecidos e uma galeria de espelhos onde mora O Sem-Rosto.

**O que a diferencia:** tudo aqui é mole, doméstico e errado. A Cidade de cima é fria e exata; aqui as paredes cedem, os móveis têm o tamanho errado, a luz é amarela de abajur e os lugares se repetem ou levam para onde não deviam. O Abismo de baixo é horror de fogo e carne; o Pesadelo é horror de casa, de criança e de reflexo, sem sangue.

## 0. Como ficou no jogo (implementado em 2026-10-11)

A ficha abaixo é o plano original, com os números antigos (camada 14, `js/210` a `219`, blocos 551 a 575, zonas 61 a 64). No jogo a camada entrou com os números reservados para ela:

- **Posição:** logo acima do Abismo (16ª camada no plano com as camadas novas, 2790 a 2976 m). O registro é `pesadelo` no `js/129-camadas.js`; o Abismo continua sempre por último.
- **Arquivos:** `300-pesadelo-api.js` (ids, faixas, `psAbove`, estados do herói), `301-pesadelo-blocos.js`, `302-pesadelo-objetos.js`, `303-pesadelo-coisas.js` (sonâmbulo, o que corre atrás, homem alto, porta faminta, bonecas), `304-pesadelo-coisas2.js` (mariposa, bailarina, cavalo de balanço, sombra errada, relógio mole), `305-pesadelo-mundo.js` (geração, spawn, fornalha e lojas), `306-pesadelo-sonho.js` (portas, laços, Quadro Torto, Adormecidos, a volta no tempo), `307-sem-rosto.js` (o chefe e a Máscara Sem Rosto), `308-onirita.js` (metal, materiais e as 3 bases), `309-pesadelo-save.js`.
- **Ids:** blocos 832 a 863 (`PS_SONO` 832 ... `PS_COSTURA` 858; 859 a 863 livres), paredes 118 a 122, terceira camada 75 a 77, zonas 73 a 76. A bolsa de blocos tem a página "Salões do Pesadelo".
- **Ordem de geração:** os Salões são feitos dentro do `abBuild` (antes do Abismo), então sempre depois de todas as camadas do meio. O Abismo lê os Salões pelo `abAbove` (as Portas Quentes são as descidas dele).
- **Decisões das perguntas abertas (pela recomendação da ficha):** o laço se desfaz sozinho na 6ª volta; as cópias imitam o herói com 0,5 s de atraso nas fases 1 e 2; minerar não acorda o Adormecido; perto de uma cama com Adormecido (10 blocos) não nasce monstro; sem missões (o jogo não tem mais) e sem erva própria da camada (as ervas seguem o sistema da Marta).
- **O save** guarda os laços desfeitos, os Adormecidos acordados e o Sem-Rosto morto; o número de mundo (`wg`) não mudou.

## 1. Identidade

- **Nome:** Os Salões do Pesadelo. Faixas: A Casa que Não Era, Os Corredores Sem Fim, Os Quartos Esquecidos, A Galeria dos Espelhos.
- **Conceito:** abaixo dos Antigos, a rocha para de obedecer. Tudo que alguém sonhou lá em cima escorre para cá e vira coisa: a casa de infância, o corredor do hospital, o quarto do medo. Quem dorme aqui embaixo (e há gente dormindo) sonha o lugar inteiro, inclusive o metal.
- **Sensação:** inquietação, estranhamento, o "isso está errado" de um sonho ruim. Pouco susto, muita espera.
- **Referências:** P.T. (o corredor em laço), Little Nightmares, Alice no País das Maravilhas, Coraline, os quartos de Silent Hill, Yume Nikki.

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 61 | A Casa que Não Era | 2418 a 2464 | pedra-sono; assoalho e parede forrada nas salas | cômodos de uma casa espalhados na rocha, móveis grandes demais, portas que levam longe |
| 62 | Os Corredores Sem Fim | 2464 a 2516 | azulejo frio, tijolo mole | corredores compridos de hospital e hotel, corredores em laço, escadas que descem para o chão |
| 63 | Os Quartos Esquecidos | 2516 a 2568 | acolchoado, massa de penas, pedra-sono | quartos de criança em grutas macias, lençóis pendurados, brinquedos gigantes, os Adormecidos |
| 64 | A Galeria dos Espelhos | 2568 a 2604 | vidro de espelho, azulejo; assoalho queimado no fundo | salões de espelho, o Salão dos Espelhos do chefe, e no fundo o calor do Abismo começando |

- **Monstros:** nível 29 na metade de cima da camada e 30 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, mas nunca passam de 30, então nenhum monstro daqui fica abaixo ou no nível da camada de cima.
- **Entrada:** as duas **Escadas que Afundam** saem da Cratera da Estrela (camada 13, posições em `atExits`). Do lado de cima é um vão quadrado de laje com escada embutida. Descendo, as juntas entortam, os degraus ficam de tamanhos diferentes, a laje vira pedra-sono e a escada embutida vira **escada de mão torta** (`PS_ESCADA`). Cerca de 22 blocos abaixo, o vão abre no teto da câmara de pouso, na Casa que Não Era. Volta-se pela mesma escada.
- **Saída:** duas **Portas Quentes** na Galeria dos Espelhos, longe uma da outra e do lado oposto ao Salão dos Espelhos. Cada uma é uma porta de casa solta no meio de um salão, entreaberta, com luz vermelha saindo por baixo. Atrás dela, um poço de 4 blocos desce pela pedra-sono, que vai escurecendo e rachando em vermelho; a escada de mão torta vira, nas últimas linhas, a corrente de ferro negro do Abismo. A ficha 15 decide a chegada lá embaixo. As posições ficam em `psExits`.
- **Câmara de pouso:** uma em cada chegada, 10 x 6, piso de assoalho, um abajur aceso, um tapete; não nasce monstro e nenhuma porta de teletransporte fica nela. Reservada para os pontos de volta.

## 3. Estrutura e geração (`js/215-pesadelo-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md); tudo "por mundo" multiplica por `WSC`.

1. **Rocha por faixa.** Pedra-sono em toda a camada, com ruído grande e mole (bordas arredondadas, nunca retas); acolchoado e penas nos Quartos; vidro de espelho em placas na Galeria. Nas primeiras 6 linhas, a pedra lisa e a laje dos Antigos afinam por ruído e entortam.
2. **Cavernas naturais:** autômato com bolhas grandes e redondas, mais macias que as de qualquer camada.
3. **Salas por faixa:**
   - **Casa que Não Era:** cômodos retangulares de 12 a 24 x 6 a 10 (sala, cozinha, quarto, sótão), com piso de assoalho e parede forrada, soltos dentro da pedra-sono e ligados por túneis redondos. Um cômodo em cada 4 sai com o tamanho errado (móveis o dobro do normal). 10 cômodos por faixa.
   - **Corredores Sem Fim:** corredores retos de 40 a 80 x 4 a 5, de azulejo, com portas na parede de fundo a cada 8 blocos; **corredores em laço** (1 por faixa, vezes `WSC`); escadarias que descem e terminam no chão. 6 corredores por faixa.
   - **Quartos Esquecidos:** grutas macias de 16 a 30 x 10 a 16 forradas de acolchoado, cada uma com uma cama e um **Adormecido** (ver seção 8), brinquedos gigantes e lençóis pendurados do teto. 6 quartos por faixa.
   - **Galeria dos Espelhos:** salões de 30 a 50 x 10 a 14 com placas de vidro de espelho nas paredes e no chão; o **Salão dos Espelhos** (48 x 18) do chefe; os salões das Portas Quentes. 4 salões por faixa.
4. **Ligações:** escada de mão torta e **lençóis amarrados** (`PS_CORDA`, escalável como corda) em todo desnível de 5 blocos ou mais.
5. **Estragos:** nada desaba; as coisas **amolecem**. Pisos de assoalho que cedem em barriga (decoração), paredes forradas descascando e mostrando outra parede por baixo, e nas últimas 8 linhas da camada o assoalho queimado com brasas, rachaduras vermelhas e o ar tremendo de calor.
6. **Minérios:** carvão na pedra-sono; onirita só em volta dos Adormecidos.
7. **Portas que levam longe** e **quartos que não existem** (ver Sistemas novos); depois o **alcance** a partir das duas câmaras de pouso, **sem contar as portas nem os laços**: tudo que importa se alcança andando. `psClimbFix` (como o `mnClimbFix`) a partir do chefe e de cada Adormecido.
8. **Decoração de 1 bloco**, **correção estrutural**, **objetos**. O `worldLink` do 87 roda por último, só nas linhas da camada e fora dos quartos que não existem.

## 4. Blocos (`js/211-pesadelo-blocos.js`)

Ids 544 a 575. Sólidos:

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 544 | `PS_SONO` | Pedra-Sono | massa geral; cinza-lilás, ondulada, como se estivesse um pouco fora de foco | pedra_sono |
| 545 | `PS_ASSOALHO` | Assoalho | pisos da Casa; tábuas que não batem nas emendas | assoalho |
| 546 | `PS_FORRADA` | Parede Forrada | paredes dos cômodos; papel de parede desbotado com flores | parede_forrada |
| 547 | `PS_TIJOLO` | Tijolo Mole | corredores e arcos; tijolos que se curvam como massa | tijolo_mole |
| 548 | `PS_AZULEJO` | Azulejo Frio | corredores; azulejo verde-água com rejunte sujo | azulejo |
| 549 | `PS_ACOLCHOADO` | Acolchoado | forro dos Quartos; pano estofado com botões | acolchoado |
| 550 | `PS_PENAS` | Massa de Penas | bolsões dos Quartos; quebra rápido, solta penas | penas |
| 551 | `PS_ESPELHO` | Vidro de Espelho | Galeria; brilho frio, um reflexo borrado que se mexe devagar | vidro_espelho |
| 552 | `PS_QUEIMADO` | Assoalho Queimado | últimas linhas da Galeria; tábua preta com rachas vermelhas (luz fraca) | assoalho_queimado |
| 553 | `PS_NADA` | O Nada | casca dos quartos que não existem; preto fosco, não quebra | nenhum |
| 554 | `PS_BARREIRA` | Moldura Fechada | portas do Salão dos Espelhos (só na luta; não quebra) | nenhum |
| 555 | `PS_O_CARVAO` | Veio de Carvão | carvão na pedra-sono | carvao |
| 556 | `PS_O_ONIRITA` | Veio de Onirita | em volta dos Adormecidos; muda de cor devagar (luz fraca) | min_onirita |
| 557 | `PS_VEIO_DESFEITO` | Veio Desfeito | o que sobra do veio quando o Adormecido acorda; pedra-sono com uma marca clara | pedra_sono |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 558 | `PS_ESCADA` | Escada de Mão Torta | escala como a escada da mina |
| 559 | `PS_CORDA` | Lençóis Amarrados | pendurado do teto; escala como corda |
| 560 | `PS_VELA` | Vela Derretida | chão; luz quente fraca, tremula |
| 561 | `PS_ABAJUR` | Abajur | chão; luz amarela média |
| 562 | `PS_LAMPADA` | Lâmpada Nua | pendurada do teto; luz amarela, balança |
| 563 | `PS_BRINQUEDO` | Brinquedos | chão; pião, cubo de letras, soldadinho |
| 564 | `PS_DESPERTADOR` | Despertador | chão; os ponteiros andam para trás |
| 565 | `PS_PENA` | Penas no Chão | chão |
| 566 | `PS_LA` | Fios de Lã | pendurado do teto |
| 567 | `PS_CACOS` | Cacos de Espelho | chão; brilho frio |
| 568 | `PS_DENTES` | Dentes de Leite | chão; montinho |
| 569 | `PS_BRASA` | Brasa no Assoalho | chão; luz vermelha, só nas últimas linhas da camada |
| 570 | `PS_COSTURA` | Costura | invisível, marca a emenda dos corredores em laço |

Os ids 571 a 575 ficam livres.

**Paredes de fundo (78 a 82):** `WPS_PAPEL` (papel de parede desbotado), `WPS_LAMBRI` (madeira de lambri), `WPS_SONO` (rocha mole), `WPS_AZULEJO`, `WPS_ESPELHO` (espelho escuro, sem cor). Escuras; a cor fica com os objetos.

**Terceira camada (51 a 53):** `DP_PS_CASAS` (silhuetas de casas tortas soltas no escuro, com uma janela acesa), `DP_PS_CORREDOR` (um corredor que some em perspectiva, sempre igual), `DP_PS_BRILHO` (um vermelho fundo e distante, só na última faixa: o Abismo lá embaixo).

## 5. Objetos de cena (`js/212-pesadelo-objetos.js`)

28 objetos com `pesadelo: true` e o plano por faixa `PS_PROP_PLAN`.

- **Chão:** cama com Adormecido (61, 63; ver seção 8); berço vazio que balança sozinho (63); mesa posta para ninguém (61); cadeira grande demais (61, 62); piano sem teclas (61); pilha de cartas nunca enviadas (61, 62); casa de bonecas, com uma luz acesa dentro (63); ursinho gigante sentado (63); banheira no meio do corredor (62); escada que desce para dentro do chão (62); porta solta, de par (61 a 64; ver Sistemas novos); cacos grandes de espelho (64).
- **Fundo com pé no chão:** guarda-roupa, às vezes entreaberto e escuro por dentro (61); relógio de pêndulo com os ponteiros para trás (61, 62); moldura de espelho grande (64); mancha de queimado na parede, luz vermelha fraca (64, perto das Portas Quentes).
- **Fundo, altura do olho:** quadro de família sem rostos (61, 62); Quadro Torto (só nos laços; ver Sistemas novos); papel de parede descascado mostrando outro papel (61, 62); placas de número de quarto, todas iguais (62); desenhos de criança (63); espelho de parede pequeno (61 a 64).
- **Janela:** janela com uma noite parada e uma lua grande demais (61; mesma altura na sala).
- **Teto:** lâmpada nua balançando, luz (61, 62); lustre coberto de pano (61); lençóis pendurados (63); móbile de berço que gira (63); gaiola com um pássaro de papel (62).

Os Espelhos do chefe ficam no 217.

## 6. As 10 coisas do pesadelo (`js/213-pesadelo-coisas.js` e `js/214-pesadelo-coisas2.js`)

Nenhuma sangra: o sangue é pena, poeira ou cacos. Cada uma é um medo de sonho com uma regra própria.

| Tipo | Nome | Papel | Movimento | Ataque (aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `sonambulo` | Sonâmbulo | corpo a corpo | anda devagar de olhos fechados, braços para a frente; não enxerga: segue barulho (golpe, corrida, pulo) e perde o herói se ele ficar parado | levanta os braços murmurando (1 s) e agarra; segura e aperta até o herói bater nele | 160 | 26 | 61, 63 |
| `perseguidor` | O Que Corre Atrás | corpo a corpo | corre de quatro na velocidade exata do herói, um pouco mais; atravessa as portas de par atrás dele | a respiração fica alta e ele se estica; bote curto quando chega a 2 blocos | 90 | 22 | 62, 64 |
| `homemalto` | Homem Alto | emboscada | só anda quando o herói está de costas para ele; olhando, fica parado como móvel | inclina a cabeça com um rangido e varre com um braço comprido demais | 200 | 30 | 62, 64 |
| `portafaminta` | Porta Faminta | emboscada (parada) | é uma porta da parede de fundo, igual às outras; não sai do lugar | a maçaneta gira e sai luz por baixo; a porta abre e um braço puxa o herói para dentro, mordendo | 240 | 28 | 61, 62 |
| `bonecas` | Bonecas de Porcelana | enxame | grupo de 5 que anda em quadros soltos: some e aparece 1 bloco à frente, como animação quadro a quadro; só se mexem com o herói longe ou piscando a tela | as cabeças giram para trás com um estalo; pulam no herói e mordem | 22 | 8 | 61, 63 |
| `mariposaon` | Mariposa do Sono | voador | voa como quem cai num sonho: desce devagar, planando, e de repente dá um tranco para cima, como quem acorda caindo | bate as asas devagar e uma nuvem de pó cintilante cai em cone embaixo dela (1 s); quem fica 1,5 s na nuvem cochila: as bordas da tela fecham como pálpebras, o herói fica parado 1,5 s e ela morde | 55 | 14 | 61, 63 |
| `bailarina` | Bailarina da Caixinha | distância | desliza girando na ponta do pé, sem andar | a manivela das costas gira e toca uma nota; solta notas em espiral | 80 | 18 | 63, 64 |
| `cavalinho` | Cavalo de Balanço | pesado | gigante, avança balançando: cada balanço anda um pouco | inclina-se para trás com um rangido longo e desaba para a frente, esmagando; o chão some de leve antes | 300 | 30 | 63, 64 |
| `sombraerrada` | Sombra Errada | atravessa (fundo) | anda só pela parede de fundo, onde houver parede; onde não há, não passa | a sombra do próprio herói muda de forma; a mão sai da parede onde ela está | 70 | 20 | 61, 62 |
| `relogiomole` | Relógio Mole | distância (apoio) | um relógio derretido que balança no ar como um pêndulo, de um lado para o outro | o tique-taque acelera e um rastro fantasma do herói aparece; o herói volta para onde estava 2 s antes, e leva um golpe leve | 100 | 12 | 62, 63, 64 |

Detalhes que contam:
- **Sombra Errada:** só leva dano dentro da luz (a do herói, de uma tocha ou de um abajur). No escuro os golpes atravessam.
- **Homem Alto:** "de costas" é o herói virado para o outro lado; com espelho de parede perto, ele também para (ele se vê).
- **Porta Faminta:** só nasce em parede de fundo de cômodo ou corredor, nunca colada numa porta de par.
- **Relógio Mole:** a volta no tempo nunca leva o herói para dentro de bloco nem para fora da faixa; se a posição de 2 s antes estiver ocupada, só dá o golpe.
- **Bonecas:** a vida é de cada boneca; o grupo conta como 1 no máximo de monstros.

**Spawn por faixa:**

| Faixa | Monstros (peso) | Máximo |
|---|---|---|
| 61 Casa que Não Era | sonambulo 0,22; portafaminta 0,16; bonecas 0,2; mariposaon 0,22; sombraerrada 0,2 | Até 8 monstros |
| 62 Corredores Sem Fim | perseguidor 0,22; homemalto 0,2; portafaminta 0,16; relogiomole 0,2; sombraerrada 0,22 | Até 8 monstros |
| 63 Quartos Esquecidos | sonambulo 0,18; bonecas 0,18; cavalinho 0,14; bailarina 0,18; mariposaon 0,16; relogiomole 0,16 | Até 9 monstros |
| 64 Galeria dos Espelhos | homemalto 0,2; perseguidor 0,2; bailarina 0,22; cavalinho 0,16; relogiomole 0,22 | Até 9 monstros |

Drops: `po_de_sono`, `porcelana`, `corda_caixinha`, `ponteiro_mole`, poções, `min_onirita` (só daqui para baixo, raro) e as bases temáticas.

## 7. Chefe: O Sem-Rosto (`js/217-sem-rosto.js`)

**Quem é:** um homem alto de casaco comprido, com um rosto liso, sem olhos, boca ou nariz. Não anda: aparece dentro dos espelhos e sai deles.

**A sala: o Salão dos Espelhos.** Na Galeria dos Espelhos, do lado oposto às Portas Quentes. 48 x 18 por dentro, chão de assoalho escuro, paredes de vidro de espelho, 2 portas (uma em cada ponta) que a Moldura Fechada tapa na luta. Ao longo da sala ficam 6 **Espelhos** grandes (3 x 5 blocos, objetos de chão encostados no fundo), em pontos fixos.

- **Nível 31. Vida 3300, dano 63** (330 x 10 e 9 x 7).
- **A regra da sala:** os espelhos acesos fazem cada um uma **cópia do herói**, com a arma e a armadura dele (ver Sistemas novos). Enquanto houver espelho aceso de pé, o Sem-Rosto não leva dano. Cada espelho tem vida própria (cerca de 8 golpes de arma forjada do nível); quebrar um espelho estilhaça a cópia dele e tira 10% da vida do Sem-Rosto, que grita. Com todos os espelhos acesos quebrados, ele cai para fora do vidro, fica parado 6 s e leva dano cheio.
- **Fase 1 (100% a 60%), 2 espelhos acesos:**
  - **Mão Comprida:** a sombra de uma mão cresce no chão por 1 s; o braço dele sai do espelho e atravessa a sala nessa linha.
  - **Troca:** a superfície de um espelho ondula como água (0,8 s) e ele sai por ela com um golpe de casaco.
  - As cópias imitam o herói com 0,5 s de atraso, espelhadas.
- **Fase 2 (60% a 25%), 3 espelhos acesos:** os quebrados ficam no chão em cacos e outros 3 acendem.
  - **Apagar:** ele passa a mão no próprio rosto; a luz da sala cai pela metade por 4 s, e só os espelhos e as cópias brilham.
  - **Corredor:** a sala parece se esticar: as duas pontas se repetem por 3 s (a mesma ideia do corredor em laço, só no desenho). Quem corre para a porta volta ao meio.
- **Fase 3 (25% a 0), 4 espelhos acesos:** as cópias deixam de imitar e lutam sozinhas, com a arma, o escudo e o aparo do herói. O Sem-Rosto **pega o rosto do herói**: fica com a cara e a roupa dele, no meio das cópias. A única diferença é que a sombra dele no chão está errada. Ataques novos: **Mil Mãos** (mãos saem de todos os espelhos de pé ao mesmo tempo, cada uma com a sua sombra no chão antes).
- **Se o herói sair ou morrer:** a luta reinicia: espelhos inteiros de novo, cópias somem, vida cheia.
- **Lendário:** **Máscara Sem Rosto** (elmo, raridade 4, nível 31). +def, +vida. Uma vez a cada 40 s, o golpe que mataria o herói é absorvido e um reflexo dele aparece por 6 s lutando ao lado, com a arma dele.
- **Save:** `semRosto.dead`. Depois da morte os espelhos ficam quebrados para sempre.

## 8. Loot e economia (`js/218-onirita.js` e 215)

- **Metal: Onirita.** `min_onirita` -> `barra_onirita`, **9 minérios por barra**, forja de **nível 27**. Um metal lilás que muda de cor devagar (lilás, rosa, turquesa), como óleo na água.
- **A regra da onirita: ela só existe enquanto alguém sonha com ela.** Todo veio de onirita nasce em volta de um **Adormecido** (uma pessoa dormindo numa cama, objeto de chão), num raio de 10 blocos. São 2 a 4 Adormecidos por faixa (vezes `WSC`) na Casa e nos Quartos, mais um ou outro nos quartos que não existem.
  - **Barulho acorda.** Luta perto dele acorda: cada golpe dado ou levado e cada explosão a menos de 10 blocos enche um medidor. Minerar não conta. O aviso é na cama: o Adormecido se vira e as letras "Zz" que flutuam em cima dele somem (é desenho, não texto de interface); na terceira vez ele senta na cama.
  - **Acordou, o sonho acaba.** Os veios ainda não minerados em volta viram Veio Desfeito, de uma vez, com um brilho. O que o herói já tinha minerado fica no inventário: onirita sonhada e levada embora é metal de verdade. A fornalha e a bigorna não sabem de nada disso.
  - **Na prática:** antes de minerar, o herói leva os monstros para longe da cama ou luta em outro lugar. Monstros que nascem perto de um Adormecido andam devagar por ali (não correm para ele), para não ser injusto.
  - O estado de cada Adormecido (dormindo, acordado) fica salvo.
- **As 9 peças forjadas:** Espada, Adaga, Machado, Maça, Lança e Montante de Onirita, Elmo, Peitoral e Botas de Onirita, com a cor mudando devagar no desenho.
- **Materiais próprios:**
  - `po_de_sono` (Pó de Sono), da mariposa do sono e do sonâmbulo: a alquimista compra.
  - `porcelana` (Caco de Porcelana), das bonecas e da bailarina: o ferreiro compra.
  - `corda_caixinha` (Corda de Caixinha), da bailarina e do cavalinho: o taverneiro compra.
  - `ponteiro_mole` (Ponteiro Mole), do relógio mole: a curandeira compra.
- **Bases temáticas** (só caem aqui, nível 29, como drop raro: cerca de 1,5% em cada monstro da camada e 1 garantida no Sem-Rosto, além do lendário): **Tesoura de Costura** (adaga, crítico alto), **Capuz de Lençol** (elmo, esquiva), **Pantufas do Sonâmbulo** (botas: velocidade, e os passos não fazem barulho para os monstros que ouvem).
- **Sem baús:** a camada não tem baú de loot (só o baú do vilarejo existe no jogo). O prêmio do fim de cada corredor em laço é um quarto com um Adormecido e veios de onirita mais grossos que os normais.
- **Missões:** o ancião ganha 3 (pó de sono, cacos de porcelana, uma barra de onirita).

## 9. Luz e atmosfera

- Escuro mole, com bolsões de luz quente e amarelada de abajur, vela e lâmpada nua: luz de casa, que deveria acalmar. Todas as luzes da faixa respiram juntas, devagar (8 s), como alguém dormindo.
- Na Galeria, luz fria e branca dos espelhos. Nas últimas 8 linhas, a primeira luz vermelha: brasas no assoalho queimado e um brilho vermelho na terceira camada.
- **Partículas:** penas caindo devagar (de vez em quando uma sobe ao contrário); poeira parada no ar; no fundo da camada, o ar tremendo de calor e cinza fina subindo.

## 10. Som (`js/97-ambiente.js`)

Cenário `pesadelo`, sem melodia:
- **Leito:** ruído rosa abafado, como ouvir de debaixo do cobertor, que sobe e desce como uma respiração lenta (8 s).
- **Eventos:** uma porta fechando longe; passos que param quando o herói para; um tique-taque que vai ficando mais lento; uma nota solta de caixinha de música, sempre a mesma; alguns eventos tocados ao contrário.
- **Eco:** curto e abafado, de quarto com cortina. Nos Corredores, um eco que repete o som 2 vezes iguais.
- **Por faixa:** nos Quartos, uma respiração de criança dormindo perto dos Adormecidos; na Galeria, vidro rangendo e, perto das Portas Quentes, um ronco quente e grave que é o Abismo lá embaixo.

## 11. Interface e progressão

- **Nomes de zona** (zonas 61 a 64) e `ZONE_SUB`: A Casa que Não Era, "você já morou aqui?"; Os Corredores Sem Fim, "você já passou por aqui"; Os Quartos Esquecidos, "fale baixo"; A Galeria dos Espelhos, "ele está atrás de você".
- **Cor no mapa (Tab):** lilás desbotado `#6e5a78` nas três primeiras faixas e cinza-espelho `#7a8a94` na Galeria; o Salão dos Espelhos em branco `#dcf0f4`. Os quartos que não existem não aparecem no mapa (ficam escuros mesmo depois de visitados).
- Nada de texto de dica.

## 12. Arte

Padrão do vilarejo: granulado, rampas de 6 tons, luz de cima à esquerda. Aqui as bordas são moles e um pouco tortas, e as texturas têm a junta fora do lugar (o assoalho não bate, o azulejo escorrega). Humanoides (sonâmbulo, homem alto) 12 x 22 com os encaixes do herói; o homem alto estica até 12 x 34.

| Material | Rampa (escuro para claro) |
|---|---|
| Pedra-Sono | `#1a1620` `#2a2434` `#3e364c` `#585068` `#7a7090` `#a69cba` |
| Papel de parede | `#2a1e24` `#43303a` `#5e4652` `#7e6470` `#a48a94` `#cbb4ba` |
| Assoalho | `#1e140e` `#352418` `#503626` `#6e4c36` `#92684a` `#b88c66` |
| Vidro de Espelho | `#0e1418` `#1c2a32` `#34505c` `#5a808e` `#94b8c4` `#dcf0f4` |
| Onirita | `#1a1030` `#34205a` `#5a3a8a` `#8a64b8` `#c09ae0` `#f2dcff` (os dois tons claros giram para rosa `#f0a0c8` e turquesa `#90e8e0`) |
| Assoalho Queimado | `#120806` `#2a0e08` `#46160c` `#6e2210` `#a83a14` `#f07a2a` |

## 13. Sistemas novos (`js/216-pesadelo-sonho.js`)

### Corredores em laço

- **O que faz:** um corredor de azulejo que se repete. O herói anda para a frente e, sem perceber a emenda, volta ao começo; o corredor é sempre o mesmo, e a cada volta uma coisa pequena muda (uma porta a mais, a luz mais fraca, o quadro virado).
- **Como é feito:** o corredor tem 3 trechos idênticos de comprimento `L` (o mesmo desenho, os mesmos blocos), marcados por `PS_COSTURA`. Quando o herói passa do trecho 2 para o 3 andando para a frente, ele, os monstros, os projéteis e os itens soltos do corredor voltam `L` blocos, e a câmera volta junto no mesmo quadro. Como os trechos são iguais, não se vê o salto. A lista fica em `PS_LOOPS` (retângulo, `L`, voltas dadas).
- **Blocos iguais nos 3 trechos:** quebrar ou pôr um bloco num trecho repete o mesmo nos outros dois (o `setTile` é embrulhado só dentro do retângulo), e isso entra nos `diffs` normalmente.
- **Como sai:** a partir da segunda volta, o **Quadro Torto** aparece num ponto da parede de fundo; quebrar o quadro desfaz o laço para sempre (salvo) e o fim do corredor leva ao quarto que ele guardava (um Adormecido com veios grossos de onirita). Se o herói não achar o quadro, o laço se desfaz sozinho na sexta volta. Andar para trás nunca dá a volta: dá para sair sempre pela entrada. Cavar para fora do corredor também tira o herói do laço.
- **Nunca no caminho obrigatório:** o laço é sempre um galho que leva a um prêmio. 1 por faixa nos Corredores e 1 na Casa, vezes `WSC`.

### Portas que levam longe

- **O que faz:** portas soltas (objeto de chão, 2 x 3) que, com o mesmo gesto de subir escada (W ou seta para cima) na frente delas, levam a outro lugar.
- **Tipos:**
  - **Par:** duas portas iguais na mesma faixa, de 30 a 200 blocos uma da outra. Atalho de ida e volta.
  - **Quarto que não existe:** leva a um cômodo pequeno (12 x 8) carimbado dentro da rocha num lugar sem ligação com nada e fechado por `PS_NADA`, que não quebra. Dentro: um Adormecido com veios, um monstro sozinho que solta uma base temática com chance maior (10%), ou o quarto do herói no vilarejo, vazio. A porta de dentro sempre leva de volta. 6 por camada (vezes `WSC`).
  - **Porta para lugar nenhum:** abre e mostra uma parede de tijolo. Só isso.
- **Como é feito:** usa o escurecimento curto (0,3 s) do teleporte do `js/75-teleporte.js`. Os pares são sorteados pela semente e ficam na lista `PS_PORTAS`. Monstros não usam portas, menos O Que Corre Atrás, que aparece 1 s depois do herói.
- **Regra:** o alcance da geração é conferido sem as portas, então nenhuma é necessária para chegar a lugar nenhum que importe.

### Cópias do espelho (só no chefe)

- **O que faz:** o tipo `reflexo` (não é um dos 10 monstros; só nasce dos Espelhos do chefe). A cópia é desenhada com o mesmo desenho do herói (`drawPlayer` com uma paleta lavada e olhos vazios), com a arma, o escudo e a armadura que o herói está usando naquele momento.
- **O que ela lê do herói:** o tipo de arma (alcance e velocidade da tabela de tipos do `js/05-itens.js`), o dano da arma, o escudo (para aparar na fase 3) e o arco ou a magia (atira o mesmo projétil). Não lê poções, anéis nem efeitos especiais.
- **Números, para não quebrar com equipamento forte:** dano da cópia = 40% do dano da arma do herói, preso entre 18 e 40. Vida fixa de 260. Sem defesa.
- **Imitação (fases 1 e 2):** o jogo guarda os comandos do herói (andar, pular, atacar) num anel de 0,5 s; a cópia repete esses comandos espelhados em volta do eixo do espelho dela. O aviso de cada golpe da cópia é o golpe que o próprio herói acabou de dar.
- **Fase 3:** a cópia ganha uma IA simples de corpo a corpo (ou de distância, se a arma for de longe) que usa o alcance da arma.
- Quebrar o espelho dela estilhaça a cópia na hora.

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/210-pesadelo-api.js` | ids, faixas `PS_BANDS`, `PS_ZONE0 = 61`, `pesadeloBand`, `psEntry`, `psExits`, `psBoss`. `PESADELO = false` desliga a camada. |
| `js/211-pesadelo-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, escada e lençóis escaláveis, itens de bloco |
| `js/212-pesadelo-objetos.js` | 28 objetos e `PS_PROP_PLAN` |
| `js/213-pesadelo-coisas.js` | sonâmbulo, o que corre atrás, homem alto, porta faminta, bonecas |
| `js/214-pesadelo-coisas2.js` | mariposa do sono, bailarina, cavalo de balanço, sombra errada, relógio mole |
| `js/215-pesadelo-mundo.js` | geração em pedaços, entradas e Portas Quentes, zonas, spawn, nível, partículas, loja, missões |
| `js/216-pesadelo-sonho.js` | corredores em laço, portas que levam longe, quartos que não existem, cópias do espelho |
| `js/217-sem-rosto.js` | o chefe e o Salão dos Espelhos |
| `js/218-onirita.js` | o metal, os Adormecidos e a regra do sonho |
| `js/219-pesadelo-save.js` | save da camada (`semRosto.dead`, laços desfeitos, Adormecidos acordados) |

## 15. Decisões em aberto

1. **O laço se desfaz sozinho na sexta volta?** Recomendo que sim: o susto é bom, ficar preso não.
2. **Cópias imitando com atraso nas fases 1 e 2, ou com IA própria desde o começo?** Recomendo a imitação: é a ideia mais nova da luta, e o herói aprende a usar o próprio golpe como aviso.
3. **Minerar acorda o Adormecido?** Recomendo que não: só luta e explosão. Assim a regra pede cuidado sem virar castigo.
