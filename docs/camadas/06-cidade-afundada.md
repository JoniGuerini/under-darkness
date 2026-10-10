# A Cidade Afundada: ficha de implementação

A sexta camada, debaixo das Minas Fúngicas, de 930 a 1116 m. Uma cidade inteira que a terra engoliu de uma vez, torta e meio alagada, com as cisternas no alto, as ruas e casas no meio e o palácio e a torre do sino no fundo. É o único lugar do jogo com gente viva: saqueadores que vieram atrás da prata e o culto do Poço, que adora o que está mais embaixo.

**O que a diferencia:** é a única camada construída por gente e habitada por gente. Os inimigos pensam: sobem escadas, fogem, bebem poção, armam armadilhas, fecham passagens com tijolo e pegam o que está no chão. As Minas Fúngicas, logo acima, são vivas e orgânicas, com luz fria de cogumelo; a Mina é trabalho bruto em rocha; o Abismo é outro mundo. Aqui é pedra lavrada, ruas tortas, água negra e luz de vela, e alguém do outro lado da porta.

---

## 1. Identidade

- **Nome:** A Cidade Afundada. Código: `CIDADE` (`CIDADE = false` desliga a camada), prefixo `CD_`.
- **Faixas:** Cisternas Altas, Ruas Tortas, Bairro do Poço, Palácio do Sino.
- **Conceito:** a cidade ficava num vale, com os reservatórios de água no morro acima dela. Numa noite a terra abriu e engoliu tudo, inclinado: os reservatórios ficaram por cima, as ruas viraram ladeiras em degrau, as casas ficaram tortas. Hoje a água negra das cisternas pinga por tudo. Saqueadores descem pelas raízes do fungo atrás da prata do palácio. E no meio da cidade há o Grande Poço, que já estava ali antes da cidade, e um culto que joga oferendas nele e escuta.
- **Sensação:** tensão e desconfiança. Depois de quatro camadas de bichos e mortos, alguém fala baixo atrás de uma porta, uma vela se apaga, um fio de sininhos toca. O perigo agora observa e planeja.
- **Contraste com as Minas Fúngicas:** lá nada foi construído de propósito e tudo cresce; aqui tudo foi construído e tudo apodrece parado. Lá a luz é viva e fria; aqui é de vela, quente, pouca e frágil.
- **Referências:** Yharnam (Bloodborne), a Velha Gotham, Dunwall (Dishonored), as cisternas de Istambul, *A Sombra de Innsmouth* (o culto e os afogados), Diablo 1 (Tristram por baixo).

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 29 | Cisternas Altas | 930 a 976 | pedra com limo, aterro | os reservatórios e esgotos da cidade (a ideia das Catacumbas Alagadas): salões de colunas meio cheios de água negra, galerias abobadadas com canal, um aqueduto de arcos; os primeiros afogados |
| 30 | Ruas Tortas | 976 a 1028 | aterro, cantaria, tijolo | ruas em ladeira de degraus, fachadas, casas tortas de 2 e 3 andares, telhados que viram caminho, becos verticais, acampamentos dos saqueadores |
| 31 | Bairro do Poço | 1028 a 1080 | cantaria, pedra do Poço | o bairro do culto: o templo, as casas com velas, o Grande Poço no centro; procissões |
| 32 | Palácio do Sino | 1080 a 1116 | mármore rachado, aterro | o palácio afundado, a praça, as adegas furadas por raízes de pedra e a base da Torre do Sino (o chefe) |

- **Nível dos monstros:** 13 na metade de cima da camada e 14 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, mas nunca passam de 14, então nenhum monstro daqui fica abaixo ou no nível da camada de cima.
- **Entrada (de cima):** as duas raízes-mestras do Coração do Micélio. Cada uma fura o teto abobadado de um salão de cisterna: o cordão de micélio grosso pende do buraco no teto até uma borda de pedra seca na lateral do salão, uns 25 blocos abaixo. Desce-se e sobe-se pelo cordão (escalável como a corrente). Os saqueadores pregaram escadas de corda ao lado: é por onde eles também entram.
- **Saída (para baixo):** duas descidas nas adegas do Palácio do Sino, longe uma da outra. Raízes de pedra da Floresta Petrificada subiram e furaram o piso; entre elas abre-se uma fenda com degraus que os saqueadores talharam e uma escada de corda presa a uma viga, uns 20 blocos de descida. Enquanto a camada 7 não existir, as fendas do Abismo saem dessas mesmas posições (`cdExits`).
- **Câmara de pouso:** uma no pé de cada descida, dentro da cisterna: a casa do guarda da cisterna, 12 x 6, de pedra seca, com uma lanterna acesa e a porta trancada por dentro. Monstro não nasce e humano não entra.
- **O Grande Poço:** não é saída. É um furo redondo de 9 blocos de largura, de paredes de pedra do Poço (preta, lisa, que ninguém lavrou), que desce do Bairro do Poço até perto do fundo da camada e termina numa tampa da mesma pedra, que não quebra (`BEDROCK` por baixo). Correntes com oferendas pendem pela borda. Tocha jogada lá dentro apaga antes de chegar ao fundo. É o gancho quieto para o Abismo e para a Escuridão: nada na tela explica.

## 3. Estrutura e geração (`js/136-cidade-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md); o que é "por mundo" multiplica por `WSC`; a torre do sino e as duas descidas são únicas.

1. **Rocha por faixa.** Aterro (terra com entulho) em tudo; pedra com limo em volta das cisternas; mármore no fundo. Nas primeiras 8 linhas a carne de micélio e o xisto das Minas Fúngicas rareiam, e cordões de micélio descem alguns blocos pelo teto das cisternas.
2. **A grade inclinada.** A cidade é desenhada em quarteirões de 60 a 90 blocos de largura. Cada quarteirão tem uma inclinação sorteada (0 ou 1 bloco a cada 5 a 8, para um lado): ruas, pisos e telhados descem em degraus de 1 bloco seguindo ela. Assim a cidade fica torta sem nenhum degrau maior que o pulo.
3. **Salas por faixa:**

| Faixa | Sala | Tamanho | O que recebe |
|---|---|---|---|
| Cisternas | salão de cisterna | 30 a 50 x 12 a 16 | colunas do chão ao teto a cada 5 blocos, água negra de 3 a 6, passarelas de pedra; 4 x `WSC` |
| Cisternas | esgoto abobadado | 40 a 80 x 4 | canal de água de 1 bloco no meio, calçadas dos lados |
| Cisternas | aqueduto | ponte de arcos de 50 a 80 blocos | atravessa uma caverna natural; 1 x `WSC` |
| Ruas | rua | 60 a 120 x 6 a 8 | calçamento em degraus, fachadas dos dois lados, lanternas |
| Ruas | casa torta | 10 a 16 x 6 por andar, 2 a 3 andares | madeirame, escada de corda entre andares, telhado de telha; 10 x `WSC` |
| Ruas | beco vertical | 3 a 5 de largura, 15 a 30 de altura | escadas de corda; liga ruas de alturas diferentes |
| Ruas | acampamento dos saqueadores | 20 x 10 | barricada de móveis, fogueira, trouxas de saque; 2 x `WSC` |
| Bairro | templo do Poço | 30 x 14 | bancos voltados para o Poço, velas; 1 x `WSC` |
| Bairro | casa do culto | 10 x 6 | velas no chão, símbolos; 6 x `WSC` |
| Bairro | o Grande Poço | 9 x até o fundo | único; ver seção 2 |
| Palácio | salão do palácio | 30 a 40 x 10 a 12 | mármore, escadarias, colunas; 3 x `WSC` |
| Palácio | adega | 16 a 24 x 6 | as duas descidas ficam em duas delas |
| Palácio | Torre do Sino | 20 x 50 | o chefe (seção 7), do outro lado do mundo em relação às descidas |

4. **Ligações:** escadas de corda (casas, becos, acampamentos) e correntes de cisterna (salões de cisterna, poços de balde) em todo desnível de 5 blocos ou mais.
5. **Estragos:** fachadas desabadas em montes de entulho, ruas cortadas por rachaduras (sempre com tábua ou corda para passar), andares de casa caídos, água negra empoçada nas partes baixas de cada quarteirão.
6. **Água:** o sistema comum de água e nado (ficha do Mar Sem Sol, `js/171-agua.js` e `js/172-nadar.js`, a camada `agua` por célula), enchido pela regra de bacia; a cor negra é só o tom de desenho nas zonas 29 a 32. Nunca no caminho obrigatório sem passarela.
7. **Minérios:** carvão no aterro; prata no aterro e na pedra com limo, mais grossa no Palácio.
8. **Alcance** a partir das duas descidas e as câmaras de pouso.
9. **Decoração de 1 bloco**, **correção estrutural** (colunas da cisterna chão ao teto), **objetos** por último.
10. **Subida garantida** (`cdClimbFix`) a partir da torre, de cada acampamento, do templo e de cada salão do palácio; depois o `worldLink` do 87, só nesta camada e na emenda com as Minas Fúngicas.

## 4. Blocos (`js/131-cidade-blocos.js`)

Ids 288 a 319.

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 288 | `CD_ATERRO` | Aterro | massa geral; terra escura com cacos e tijolo moído | aterro |
| 289 | `CD_CANTARIA` | Cantaria | casas boas, templo, muros; pedra clara gasta | cantaria |
| 290 | `CD_TIJOLO` | Tijolo da Cidade | casas pobres; tijolo vermelho-escuro com reboco caindo | tijolo_cidade |
| 291 | `CD_CALCAMENTO` | Calçamento | piso das ruas e da praça | calcamento |
| 292 | `CD_TELHA` | Telha de Ardósia | telhados; anda-se em cima | telha |
| 293 | `CD_MADEIRAME` | Madeirame | vigas e assoalho das casas, escuro e úmido | madeira |
| 294 | `CD_LIMO` | Pedra com Limo | cisternas e esgotos; pedra verde-preta molhada | pedra_limo |
| 295 | `CD_LODO` | Lodo Negro | fundo das cisternas; cava rápido | lodo_negro |
| 296 | `CD_MARMORE` | Mármore Rachado | palácio e torre | marmore |
| 297 | `CD_PEDRA_POCO` | Pedra do Poço | a borda e as paredes do Grande Poço; preta e lisa, muito dura, não lavrada | pedra_poco |
| 298 | `CD_ENTULHO` | Entulho | fachadas e andares caídos | entulho |
| 299 | `CD_BARREIRA` | Grade do Campanário | fecha as entradas da torre na luta; não quebra | nenhum |
| 300 | `CD_O_CARVAO` | Veio de Carvão | carvão no aterro | carvao |
| 301 | `CD_O_PRATA` | Veio de Prata | o metal da camada, no aterro e na pedra com limo; prata escurecida que brilha onde a picareta raspa | min_prata |

**Decoração de 1 bloco** (não sólida):

| Id | Constante | Nome | Apoio | Luz |
|---|---|---|---|---|
| 302 | `CD_ESCADA` | Escada de Corda | presa em cima; escala como a `MN_ESCADA` | não |
| 303 | `CD_CORRENTE` | Corrente de Cisterna | pendurada do teto; escala como a `CHAIN` | não |
| 304 | `CD_VELAS` | Velas do Culto | chão | quente fraca (0,5) |
| 305 | `CD_LANTERNA` | Lanterna de Saqueador | pendurada do teto ou de viga | quente (0,7) |
| 306 | `CD_ALGA` | Alga Negra | teto e parede das cisternas, em corrente | não |
| 307 | `CD_GOTEIRA` | Goteira | teto; gota animada | não |
| 308 | `CD_OFERENDA` | Oferenda | chão, perto do Poço: tigela com moedas e dentes | não |
| 309 | `CD_TROUXA` | Trouxa de Saque | chão dos acampamentos | não |
| 310 | `CD_OSSOS` | Ossos com Lodo | chão das cisternas | não |
| 311 | `CD_PLACA` | Placa de Loja | pendurada de viga ou teto; balança | não |
| 312 | `CD_SININHOS` | Sininhos do Culto | teto; tilintam quando algo passa embaixo | não |
| 313 | `CD_COLUNA` | Coluna da Cisterna | do chão ao teto, como as colunas da catedral | não |

**Bloco do emparedador:** 314 `CD_PAREDE_FRESCA`, Parede Fresca: tijolo com argamassa mole, sólido; quebra com 1 golpe de picareta ou 2 de arma, não solta item, desmancha sozinha em 30 s e nunca entra no save.

Os ids 315 a 319 sobram. A água não é bloco: é a camada `agua` do sistema comum (seção 13).

**Paredes de fundo** (ids 38 a 42): `WCD_CANTARIA`, `WCD_TIJOLO` (reboco descascado), `WCD_LIMO`, `WCD_MADEIRA` (tabuado de dentro das casas), `WCD_MARMORE`.

**Terceira camada** (ids 27 a 29): `DP_CD_ATERRO` (terra com entulho ao longe), `DP_CD_CASAS` (silhuetas de casas tortas, torres e telhados inclinados), `DP_CD_ARCOS` (arcos de aqueduto e de cisterna sumindo no escuro).

## 5. Objetos de cena (`js/132-cidade-objetos.js`)

28 objetos com `cidade: true` e `CD_PROP_PLAN`. Faixas: C = Cisternas Altas, R = Ruas Tortas, B = Bairro do Poço, P = Palácio do Sino.

- **Chão:** barco de fundo chato (C, na beira da água); pilha de barris podres (C, R); carroça tombada (R); barricada de móveis (R); fogueira dos saqueadores (R, luz quente); banca de feira caída (R); poço de rua com sarilho (R); bancos do templo (B); altar do Poço com velas (B, luz quente); estátua sem rosto (B, P); pilha de oferendas (B); fonte seca da praça (P); carruagem do palácio afundada até o eixo (P); mesa de banquete virada (P).
- **Teto:** lustre caído pela metade (P); gaiola de pássaro (R); varal com roupa podre (R); fio de sininhos grande (B); balde na corrente (C).
- **Fundo, com pé no chão:** arco de cisterna (C); fachada com porta e janela (R); porta de loja com tábuas (R); portão do templo (B); escadaria quebrada em relevo (P).
- **Fundo, janela:** janela de casa com vidro quebrado (R), vitral do palácio rachado (P).
- **Fundo, altura do olho:** símbolo do Poço pintado (B); retrato do rei com o rosto raspado (P).

Todos guardam os blocos de apoio; quebrar o apoio derruba o objeto, e isso fica salvo.

## 6. Os 10 da cidade (`js/133-cidade-vivos.js`, `js/134-cidade-culto.js`, `js/135-cidade-afogados.js`)

Família: gente viva (saqueadores e o culto do Poço) e os afogados da cisterna. Os humanos usam o **comportamento humano** da seção 13 (escadas, fuga, portas, alarme).

| Tipo | Nome | Papel | Movimento | Ataque (com aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `saqueador` | Saqueador | corpo a corpo | anda com cuidado, sobe escadas de corda como o herói, e corre primeiro para qualquer item no chão (drop de monstro) para pegar; matando, ele solta o que pegou | puxa o facão para trás (0,5 s) e dá duas estocadas; com pouca vida recua e bebe uma poção (som de vidro, 1 s) que cura 30%, uma vez | 85 | 18 | C, R, P |
| `besteiro` | Besteiro | distância | procura o ponto mais alto por perto (telhado, janela, passarela) e se abaixa atrás do parapeito | ergue a besta e a ponta brilha (0,9 s), virote reto e rápido; depois recarrega girando a manivela (2 s, exposto). O virote fica cravado na parede 5 s e serve de degrau | 55 | 22 | R |
| `armadilheiro` | Armadilheiro | emboscada | corre na frente do herói para os corredores e becos e arma coisas no caminho; só luta quando o herói cai numa | arma estrepes (brilho de metal no chão) que ferem e deixam lento, e fios de sininhos esticados: tocar o fio dispara uma rede de cima (sombra quadrada 0,4 s antes) que impede de atacar por 1,5 s, e chama os humanos perto. Depois vem com o porrete (ergue, 0,6 s) | 60 | 16 | C, R |
| `telhadeiro` | Telhadeiro | corpo a corpo rápido | atira um gancho no teto ou numa viga e passa balançando de um telhado a outro, nunca andando no chão se puder | no balanço, solta o gancho e cai em diagonal com duas adagas; a sombra dele aparece no chão (0,5 s) antes | 65 | 17 | R, P |
| `novicos` | Noviços do Poço | enxame | procissão de 4 a 6 em fila, cada um com uma vela, seguindo o primeiro, devagar e cantando numa nota só | erguem as velas e o canto sobe (0,6 s), depois correm todos de uma vez e batem com os castiçais. Matar o da frente desfaz a procissão: os outros fogem | 14 | 6 | B |
| `pregador` | Pregador do Poço | apoio | fica longe e sempre atrás dos outros humanos, andando de costas | aponta para o herói e um anel escuro aparece em volta dele (1 s): o herói fica **marcado** por 6 s e os inimigos da camada dão 20% a mais nele e vão direto nele. Sozinho, joga um frasco de água do Poço (arco visível) que deixa uma poça escura que deixa lento | 70 | 14 | B, P |
| `penitente` | Penitente | pesado | homem enorme que arrasta uma pedra de poço presa por corrente nas costas; anda devagar e não sobe escadas | começa a girar a pedra devagar, a corrente range (1 s), e gira em volta dele por 3 s com raio crescendo; depois fica tonto 1,5 s. Também larga a pedra no chão: piso de tábua ou telhado embaixo dele quebra | 290 | 30 | B, P |
| `emparedador` | Emparedador | controle | pedreiro do culto com uma pilha de tijolos nas costas; não persegue: corre para a passagem estreita (até 3 de altura) mais perto entre o herói e a saída e se planta lá | ergue uma parede de argamassa fresca na passagem, uma fileira por vez, com o contorno da fileira aparecendo transparente 1 s antes; fecha o herói junto com os outros humanos. De perto, ergue um tijolo acima da cabeça (0,6 s) e joga em arco | 90 | 15 | B, P |
| `afogado` | Afogado | corpo a corpo da água | anda no fundo da água sem boiar e sobe para a borda; fora da água é lento e pesado | estica os braços pingando (0,8 s) e agarra: se o herói estiver perto da água, é arrastado 2 blocos para dentro e fica preso 1 s (bater solta) | 130 | 20 | C, R, P |
| `boiante` | A Que Boia | voadora | flutua no ar como se ainda estivesse debaixo da água, em braçadas lentas, com o cabelo flutuando | abre a boca e saem bolhas (0,7 s), depois um jato de água negra de 4 blocos que empurra e deixa o herói **encharcado** (pulo menor por 3 s) | 60 | 15 | C, B |

**O que não repetem:** o saqueador não rouba ouro do herói como o gatuno, pega o que está no chão; o pregador não levanta mortos nem acelera ninguém, marca o herói; o besteiro recarrega e usa altura, ao contrário do arqueiro; o telhadeiro é o único que balança; nenhum se teletransporta como o cultista possuído do Abismo; o penitente é o único que quebra o piso; o emparedador é o único que muda o terreno para prender o herói.

**Spawn por faixa:**

| Faixa | Monstros (peso) | Máximo |
|---|---|---|
| Cisternas Altas | afogado 30, boiante 25, saqueador 25, armadilheiro 20 | até 7 monstros |
| Ruas Tortas | saqueador 25, besteiro 20, telhadeiro 20, armadilheiro 20, afogado 15 | até 8 monstros |
| Bairro do Poço | novicos 25, pregador 15, emparedador 20, penitente 20, boiante 20 | até 8 monstros |
| Palácio do Sino | saqueador 20, telhadeiro 15, pregador 15, penitente 15, emparedador 15, afogado 20 | até 8 monstros |

A procissão conta como 1 no máximo. O afogado só nasce em água ou a até 4 blocos dela. Saqueadores nascem em dupla perto dos acampamentos.

**Drops:** `moeda_afundada`, `cera_poco`, `corda_alcatroada`, `perola_negra` (seção 8), poções (o saqueador solta a dele se não bebeu), `min_prata`, as bases temáticas raras.

## 7. Chefe: O Sineiro Afogado (`js/137-sineiro-afogado.js`)

**A sala:** a Torre do Sino, inteira, 20 x 50, no Palácio do Sino, do outro lado do mundo em relação às descidas. O topo, o campanário, fica na altura do Bairro do Poço; a base é a **Cisterna Funda**, alagada. Dentro, de cima para baixo: o campanário (o sino de 6 x 6 pendurado numa viga), três andares de assoalho e pedra com escadas de corda, e a cisterna com 6 blocos de água negra. O herói entra pelo campanário, por uma ponte de telhados do Bairro do Poço. A Grade do Campanário fecha a ponte e a porta de baixo quando a luta começa.

**Quem é:** o sineiro da cidade, que tocou o sino a noite toda enquanto a terra engolia tudo e morreu afogado na cisterna da torre. Voltou inchado e enorme, ainda amarrado à corda do sino.

**Números (nível 15):** vida 330 x (1 + 0,3 x 14) = **1720**; dano 9 x (1 + 0,2 x 14) = **34** no golpe cheio (o sino, o badalo), 60% nas ondas e nos jatos.

**Fase 1, o campanário (100% a 65%):**
- **Balanço do sino:** ele puxa a corda, o sino recua devagar (0,8 s) e varre um arco embaixo dele. Ficar fora do arco ou pular por cima no fim do balanço.
- **Badalada:** ele segura a corda com as duas mãos e se inclina (1 s); o sino toca e um anel de som corre pelo chão nos dois sentidos. Pular o anel.
- **Gotejo:** ele se sacode e cai água negra em gotas grossas, cada uma com um círculo no chão antes.
- Aos 65%, a viga range e solta poeira por 2 s, e o sino cai, **quebrando o piso do campanário e o do 3º andar**. Herói e sineiro caem junto pelo buraco (o jogo não tem dano de queda).

**Fase 2, os andares (65% a 30%):** o sino ficou preso no 2º andar, com a corda subindo pelo buraco. O sineiro sobe e desce pela corda como por um mastro.
- **Puxão do sino:** a corda estica e a borda do buraco treme (1 s); ele puxa o sino para cima e o solta: o sino cai de novo e **quebra mais um pedaço de andar** (sempre o que está marcado por rachaduras e poeira). Cada queda abre caminho para baixo e tira chão do herói.
- **Badalo arremessado:** ele arranca o badalo, ergue acima da cabeça (0,7 s) e joga como um martelo; o badalo quica uma vez e volta para a mão dele pela corrente.
- **Badalada abafada:** como a da fase 1, mas o anel corre nas paredes também (sobe e desce 4 blocos): ficar no meio do andar.
- Aos 30%, o último piso cede e tudo vai para a cisterna.

**Fase 3, a Cisterna Funda (30% a 0%):** o sino está meio afundado no meio da água e vira a ilha principal; sobram bordas de pedra dos lados.
- **Mergulho:** ele some na água; bolhas sobem onde ele vai sair (1 s); sai agarrando e puxa para a água.
- **Badalada debaixo da água:** ele bate no sino por baixo: anéis na superfície (0,8 s) e uma onda empurra todo mundo que estiver na água ou em cima do sino.
- **Os afogados da torre:** a cada 20 s sobem 2 afogados das bordas.

**Reinício:** sair, usar o portal ou morrer reinicia a luta: os andares e o sino voltam ao estado de antes (a torre guarda o desenho original e o reescreve), a água volta a 6 blocos, a grade abre. Os blocos da torre não quebram com a picareta durante a luta.

**Depois da morte:** os andares ficam quebrados, mas a corda do sino fica pendurada do campanário até a cisterna e vira escalável (como a corrente), e as escadas de corda dos andares que sobraram continuam lá: dá para subir de volta sem cavar. A morte fica salva (`sineiro.dead`).

**Lendário:** **Badalo do Sineiro** (arma, maça, nível 15). A cada 4º golpe seguido, uma badalada: onda em volta do herói (3 blocos) que atordoa os inimigos por 1 s e faz o dano da maça nos que estiverem nela.

## 8. Loot e economia (`js/138-prata.js` e 136)

- **Metal:** **Prata** (`min_prata` -> `barra_prata`, **6 minérios por barra**), o sétimo da forja, depois da esporita. Nível da forja **11**. A bigorna ganha as 9 peças: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas de prata.
- **Materiais próprios:**

| Id | Nome | Cai de | Quem compra |
|---|---|---|---|
| `moeda_afundada` | Moeda Afundada | saqueador, afogado, armadilheiro | Odo (coleciona; paga bem) |
| `cera_poco` | Cera do Poço | noviços, pregador, emparedador | Marta (alquimia) |
| `corda_alcatroada` | Corda Alcatroada | telhadeiro, armadilheiro, besteiro | Grimaldo |
| `perola_negra` | Pérola Negra | afogado, boiante, penitente | Aurélia, a maga |

- **Bases temáticas** (nível 13, só caem aqui, como drop raro: cerca de 1% de cada monstro da cidade, 3% do penitente, e o Sineiro solta uma das três garantida na primeira morte): **Facão do Saqueador** (adaga; crítico maior pelas costas), **Capuz do Poço** (elmo; os inimigos demoram mais para notar o herói), **Couraça da Guarda da Cidade** (peitoral; a armadura da guarda antiga, com o brasão raspado).
- **Sem baús:** a camada não tem baú nenhum (só o baú do vilarejo existe no jogo). O loot vem dos monstros, dos veios e do chefe.
- **Missões do ancião (Caetano):** 3 novas: moedas afundadas, pérolas negras e uma barra de prata.

## 9. Luz e atmosfera

- A camada mais escura até aqui fora do Abismo: não há luz natural nem cogumelo. Toda luz é **feita por gente**: velas do culto (âmbar fraco), lanternas e fogueiras dos saqueadores (laranja), e a prata, que só brilha onde a picareta raspou.
- **Cisternas Altas:** quase breu; a água negra devolve um brilho fosco das lanternas.
- **Ruas Tortas:** ilhas de luz laranja nos acampamentos, ruas escuras entre elas.
- **Bairro do Poço:** muitas velas em fila; perto do Poço a luz cai pela metade (o Poço "bebe" a luz: raio de luz menor a até 12 blocos dele).
- **Palácio do Sino:** mármore pálido que pega qualquer luz de longe.
- **Partículas:** gotas caindo do teto (todas), anéis na água negra, poeira de reboco nas Ruas, fumaça fina das velas no Bairro, pó de mármore no Palácio.

## 10. Som (`js/97-ambiente.js`)

Cenário novo `cidade`, sem melodia:
- **Leito:** ar parado de cidade vazia, com eco longo de pedra (o eco mais longo do jogo, de rua e de praça), e um sopro de vento que passa pelos becos.
- **Eventos:** uma badalada grave e única ao longe, rara (nunca duas seguidas, para não virar melodia); porta batendo; passos correndo num telhado; moedas caindo; uma tosse; uma voz falando baixo sem palavras; água pingando em água.
- **Por faixa:** nas Cisternas, água negra batendo nas colunas; nas Ruas, madeira de casa estalando; no Bairro do Poço, um canto de muitas vozes numa nota só, contínuo, que some perto do Poço (perto do Poço o som fica abafado e quase some); no Palácio, eco de mármore.
- **Monstros:** humanos têm voz (grunhido, ofego, um grito curto ao fugir), mas nunca texto na tela. A manivela da besta, o tilintar dos sininhos, o canto dos noviços, a corrente do penitente, a colher de pedreiro do emparedador raspando argamassa.

## 11. Interface e progressão

- **Nomes de zona** (empurrados pelo 136): Cisternas Altas, Ruas Tortas, Bairro do Poço, Palácio do Sino.
- **Cor no mapa (Tab):** aterro `#483d31`, cantaria `#786e60`, tijolo `#74443a`, telha `#3e4652`, pedra com limo `#2a3e30`, mármore `#8c8a8c`, pedra do Poço `#101318`, água `#121418`, prata `#a0a8b2`.
- **Progressão:** monstros 13 a 14; forja de prata no nível 11; bases no 13; chefe e lendário no 15.

## 12. Arte

Padrão do vilarejo: granulado, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar. Os humanos são 12 x 22 com os encaixes do herói, e por isso podem usar as peças de roupa e arma do próprio herói pintadas de novo (capuz, gibão, facão). A cidade é a primeira camada com linhas retas tortas: toda parede e todo telhado seguem a inclinação do quarteirão.

| Material | Rampa (escuro para claro) |
|---|---|
| Aterro | `#16130f` `#241f19` `#352d24` `#483d31` `#5e5041` `#776654` |
| Cantaria | `#2a2622` `#403a33` `#5a5248` `#786e60` `#9a8e7c` `#c0b49e` |
| Tijolo da cidade | `#24120e` `#3c1e16` `#58302a` `#74443a` `#925a4c` `#b07a68` |
| Pedra com limo | `#0c1410` `#14201a` `#1e2e24` `#2a3e30` `#3a5240` `#546c56` |
| Telha de ardósia | `#14161c` `#20242c` `#2e343e` `#3e4652` `#525c6a` `#6e7a88` |
| Mármore rachado | `#2a2a2e` `#46464a` `#66646a` `#8c8a8c` `#b4b0ae` `#dcd6d0` |
| Pedra do Poço | `#050608` `#0a0c10` `#101318` `#171b22` `#20252e` `#2c323c` |
| Prata | `#2a2e34` `#4a5058` `#727a84` `#a0a8b2` `#ccd2da` `#f4f8fc` |
| Água negra | `#040506` `#08090c` `#0c0e12` `#121418` `#181c20` `#22262c` (80% opaca) |
| Vela e chama | `#3a2e22` `#6a5a44` `#a89470` `#d8c8a0` `#ffb84a` `#fff0b0` |

Os afogados são inchados e cinza-esverdeados, com a roupa da cidade colada no corpo; os cultistas usam capuz cor de cera suja; os saqueadores, couro remendado e lanterna na cintura.

## 13. Sistemas novos

**Comportamento humano (`js/133-cidade-vivos.js`).** Os primeiros inimigos que agem como gente. Um conjunto de regras que os 7 humanos usam (os afogados não):
- **Escadas e cordas:** a busca de caminho deles inclui escada de corda, corrente e degraus, como o herói.
- **Fuga:** abaixo de 25% de vida, a maioria recua para longe do herói e, se tiver, bebe a poção. O penitente e os noviços com líder vivo não fogem.
- **Pegar itens:** o saqueador vai até drops de monstro no chão a até 10 blocos e guarda; ao morrer, solta tudo.
- **Alarme:** um fio de sininhos tocado, ou um humano fugindo, chama os humanos a até 20 blocos para aquele ponto.
- **Fechar passagem:** o emparedador acha a passagem estreita entre o herói e a saída mais perto (a mesma busca de caminho, ao contrário) e só ergue a parede se o herói não estiver dentro dela.
- Entra como uma camada a mais na IA (`AI[tipo]` chama `humanStep(e)` antes do próprio passo), sem mexer na IA dos outros monstros.

**Torre que desaba (`js/137-sineiro-afogado.js`).** O chefe muda o terreno em roteiro: a torre guarda uma lista de **placas** (pedaços de piso) com o momento em que cada uma cai. Quando cai, os blocos viram entulho que cai (partículas, sem dano) e o espaço abre. Ao reiniciar, a torre reescreve os blocos guardados. Os blocos da torre ficam protegidos da picareta enquanto o chefe estiver vivo e a luta ativa.

**Água:** usa o sistema comum da ficha do Mar Sem Sol (`js/171-agua.js`, `js/172-nadar.js`); não cria nada novo. O afogado usa a marca `bottom` (anda no fundo); na fase 3 do Sineiro o fôlego comum vale na Cisterna Funda.

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/130-cidade-api.js` | ids, faixas `CD_BANDS`, `CD_D = 186`, topo pelo registro `LAYERS`, `CD_ZONE0` (29), `cidadeBand`, `cdExits`, `cdBoss`, o Grande Poço (`cdPoco`). `CIDADE = false` desliga a camada |
| `js/131-cidade-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, escada de corda e corrente escaláveis |
| `js/132-cidade-objetos.js` | os 28 objetos e `CD_PROP_PLAN` |
| `js/133-cidade-vivos.js` | comportamento humano; saqueador, besteiro, armadilheiro (estrepes, fios, rede), telhadeiro |
| `js/134-cidade-culto.js` | noviços, pregador, penitente, emparedador (e a Parede Fresca) |
| `js/135-cidade-afogados.js` | afogado e a que boia |
| `js/136-cidade-mundo.js` | geração em pedaços (grade inclinada, quarteirões), descidas, zonas, spawn, nível, partículas, loja, missões |
| `js/137-sineiro-afogado.js` | o chefe: a torre, as placas que caem, as 3 fases, o Badalo do Sineiro |
| `js/138-prata.js` | o metal na forja (9 peças) e os materiais |
| `js/139-cidade-save.js` | `sineiro.dead`, objetos caídos |
| `docs/cidade-spec.md` | a spec técnica depois de implementar |

## 15. Decisões em aberto

1. **O Grande Poço: dá para descer de corda até a tampa?** Recomendo sim: o herói chega à tampa preta, ouve o som sumir e não acha nada. O mistério fica para as camadas 15 e 16.
2. **O saqueador pode pegar itens que o próprio herói soltou no chão, não só drops de monstro?** Recomendo só drops de monstro: perder um item do inventário irrita mais do que assusta.
3. **A Parede Fresca do emparedador some sozinha em 30 s ou fica até alguém quebrar?** Recomendo 30 s: prende na luta, mas nunca deixa um caminho fechado para trás.
