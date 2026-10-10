# O Covil do Dragão: ficha de implementação

A camada 11, de 1860 a 2046 m, debaixo do Mar Sem Sol e em cima do Ossário dos Titãs. É um vulcão vivo visto por dentro: chaminés de vapor, túneis cavados pelos kobolds, tubos de lava naturais e, no fundo, a cratera onde Cinzarel, o Dragão Ancião, dorme sobre o ouro que juntou em mil anos.

**O que a diferencia:** aqui nada é do inferno nem foi construído por gente: é rocha vulcânica natural, ouro, ossos de dragão e tocas de kobold, com luz âmbar e dourada, enquanto o Abismo é carne, ruína, correntes e luz vermelho-roxa. Do Mar Sem Sol, logo acima, ela herda só o vapor: lá tudo é água e escuro, aqui tudo é seco e brilha.

---

## 1. Identidade

- **Nome:** O Covil do Dragão. **Faixas:** Chaminés de Vapor, Túneis Kobold, Tubos de Lava, Leito de Ouro.
- **Conceito:** debaixo do mar a rocha esquenta até ferver a água. Mais fundo fica o vulcão de um dragão velho. Os kobolds, a cria pequena e covarde dos dragões, cavaram tocas nas paredes dele e vivem de servir e de roubar migalhas do tesouro. Nos tubos por onde a lava escorreu moram os dracos e as serpes. No fundo, na cratera, Cinzarel dorme sobre um monte de ouro do tamanho de um morro, cercado pelos ossos dos dragões que ele matou.
- **Sensação:** calor, cobiça e tensão de ladrão. O jogador entra num lugar que tem dono, e o dono está dormindo.
- **Referências:** Smaug em Erebor (O Hobbit), os kobolds de Dungeons & Dragons, o Dragon Peak de Dark Souls, os tubos de lava do Havaí.
- **Contraste com o Abismo:** lá o fogo é castigo e a pedra sangra; aqui o fogo é só geologia, a pedra é bege, ocre e mogno, e o perigo é um bicho de carne e escama. Nenhum portão, nenhum altar profano, nenhuma carne viva.

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 49 | Chaminés de Vapor | 1860 a 1906 | tufo vulcânico, andesito | onde o mar encontra o calor: chaminés verticais, bicas de vapor, olivina, as primeiras tocas kobold |
| 50 | Túneis Kobold | 1906 a 1958 | andesito, taipa kobold | galerias estreitas e retas, tocas, santuários ao dragão, armadilhas, andaimes de ossos |
| 51 | Tubos de Lava | 1958 a 2010 | lava cordada, obsidiana rajada, pomes | tubos redondos e compridos, canais de magma correndo, ninhos de draco, estalactites de lava |
| 52 | Leito de Ouro | 2010 a 2046 | obsidiana rajada, osso de dragão, ouro solto | câmaras abertas com ouro espalhado, ossadas de dragões antigos, a Cratera do Tesouro |

- **Constantes:** `DG_D = 186`, `DG_BANDS = [0, 46, 98, 150, 186]`, `DG_ZONE0 = 49`, `dragonBand(ty)`, topo e `DG_S0` dados pelo registro `LAYERS`.
- **Nível dos monstros:** 22 + 1 a cada 60 m (até 24), 30% vêm 1 nível acima.
- **Entrada (vinda do Mar Sem Sol):** as duas descidas saem da última faixa do Mar, onde o fundo do mar encontra o calor: uma fonte termal que borbulha no chão, com um tampão de crosta de tufo que segura a água. No meio do tampão abre uma chaminé de vapor de 4 blocos de largura que desce reta uns 30 blocos, com uma **escada de cravos kobold** (pinos de osso cravados na rocha) do começo ao fim. Ela termina na câmara de pouso, já nas Chaminés de Vapor. Volta-se pela mesma escada. A posição das duas fica anotada pelo Mar (`msExits`) e o `dgBuild` lê dali.
- **Câmara de pouso:** ao pé de cada chaminé de entrada, uma gruta de tufo de 14 x 6, chão plano, 2 velas de sebo e uma bica de vapor apagada. Não nasce monstro num raio de 20 blocos (`dgSafe`).
- **Saída (para o Ossário):** duas **descidas dos Tubos Frios** no Leito de Ouro, longe uma da outra e do lado oposto da Cratera do Tesouro. São tubos de lava antigos e já frios que mergulham quase na vertical (5 a 7 blocos de largura, uns 40 de queda). A parede é de lava cordada que vai clareando e virando rocha fóssil no fim. Escada de cravos kobold até a metade; daí para baixo a escada vira ossos amarrados dos catadores do Ossário, e o tubo desemboca no teto da primeira faixa de lá. Gravadas em `dgExits` para o Ossário ler.

## 3. Estrutura e geração (`js/185-dragao-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo que é "por mundo" multiplica por `WSC`; a cratera e as duas descidas são únicas.

1. **Rocha por faixa.** Tufo nas Chaminés, andesito nos Túneis, lava cordada e obsidiana rajada nos Tubos, obsidiana rajada e osso de dragão no Leito. Bordas misturadas com ruído. Nas primeiras 10 linhas a rocha do Mar vai sumindo por ruído e o tufo aparece.
2. **Espaços naturais.** Autômato esparso (o vulcão é rocha cheia, não oca como o Abismo). Pomes em bolsões de 4 a 10 blocos dentro do andesito.
3. **Salas por faixa:**

| Faixa | Espaço | Largura x altura | Quantos (x `WSC`) | O que recebe |
|---|---|---|---|---|
| Chaminés | chaminé vertical | 4 a 7 x 20 a 40 | 6 | escada de cravos inteira, bicas de vapor nas paredes, olivina |
| Chaminés | gruta de vapor | 14 a 24 x 7 a 11 | 8 | fumarolas, olivina, 1 toca kobold de vigia |
| Túneis | galeria kobold | 30 a 70 x 3 a 4 | 10 | reta, com taipa nas paredes, fios de armadilha a cada 15 a 25 blocos |
| Túneis | toca kobold | 8 a 14 x 5 a 7 | 14 | andaime de ossos, totens, velas de sebo, fogueira |
| Túneis | santuário ao dragão | 16 x 9 | 3 | estátua de dragão de barro, oferendas de ouro solto no chão |
| Tubos | tubo de lava | 40 a 110 x 5 a 8 | 8 | seção redonda (minhoca de curva suave), chão de lava cordada, estalactites de lava |
| Tubos | canal de magma | dentro de 1 a cada 3 tubos | 3 | 2 blocos de magma corrente no fundo, andaime de ossos por cima |
| Tubos | ninho de draco | 12 a 18 x 6 a 9 | 5 | ovos, cascas, escamas caídas |
| Leito | câmara do tesouro | 20 a 36 x 10 a 16 | 6 | ouro solto em montes baixos (até 3 de altura), ossada de dragão |
| Leito | Cratera do Tesouro | 90 x 44 | 1 | a sala do chefe (seção 7) |

4. **Ligações.** Túneis de minhoca ligam as salas de cada faixa e 3 por `WSC` descem de uma faixa para a outra. Todo desnível de 5 blocos ou mais ganha escada de cravos (`DG_ESCADA`) ou corda de couro de draco (`DG_CORDA`). As chaminés têm escada inteira.
5. **Estragos.** Desmoronamento de pomes nos Túneis (entulho leve), estalactites de lava nos Tubos, ouro espalhado escorrido pelas rampas no Leito.
6. **Magma.** `DG_MAGMA` só no fundo dos canais e na borda da cratera, sempre com andaime ou borda por cima. Nunca no caminho obrigatório.
7. **Minérios:** carvão no tufo e no andesito; dracônio na obsidiana rajada e no osso de dragão, a até 6 blocos de magma ou de ouro (o metal nasce onde o fogo do dragão bateu). Veios de 3 a 7, 30 por `WSC` de carvão e 22 por `WSC` de dracônio, mais nas faixas 3 e 4.
8. **Limpeza e alcance.** Bolsões e ilhas como as outras camadas; alcance a partir das duas câmaras de pouso; o que não chega ganha túnel.
9. **Subida garantida** (`dgClimbFix`, como o `mnClimbFix`), a partir da cratera, das tocas, dos ninhos e dos santuários. Ouro solto nunca fica em degrau de subida (ele desliza).
10. **Decoração de 1 bloco, colunas** (esticar ou remover), **objetos** por último. Depois o `worldLink` da camada.

## 4. Blocos (`js/181-dragao-blocos.js`)

Ids 448 a 479. Sólidos:

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 448 | `DG_TUFO` | Tufo Vulcânico | massa das Chaminés; bege-ocre poroso, úmido de vapor | tufo |
| 449 | `DG_ANDESITO` | Andesito | massa dos Túneis; cinza-quente em lajes | andesito |
| 450 | `DG_POMES` | Pedra-Pomes | bolsões; quase branca, cheia de furos, quebra rápido | pomes |
| 451 | `DG_LAVA_CORDA` | Lava Cordada | chão e parede dos tubos; cinza-chumbo enrugado em dobras | lava_cordada |
| 452 | `DG_OBSIDIANA` | Obsidiana Rajada | Tubos e Leito; vidro cor de mogno com manchas pretas, dura | obsidiana_rajada |
| 453 | `DG_TAIPA` | Taipa Kobold | paredes das tocas e galerias; cinza prensada com escamas | taipa |
| 454 | `DG_ANDAIME` | Andaime de Ossos | pontes e pisos; ossos de draco amarrados, atravessa por baixo como o piso de tábua da mina | andaime_ossos |
| 455 | `DG_OSSO` | Osso de Dragão | ossadas do Leito; marfim escurecido, rachado de calor | osso_dragao |
| 456 | `DG_OURO_SOLTO` | Ouro Solto | moedas, taças e anéis amontoados; **desliza** (seção Sistemas novos) | 1 `ouro` |
| 457 | `DG_OURO_DURO` | Ouro Endurecido | ouro que derreteu e esfriou; liso, não desliza | ouro_fundido |
| 458 | `DG_MAGMA` | Magma Corrente | não sólido; queima como o `LAVA`; textura correndo para um lado; luz forte | nenhum |
| 459 | `DG_CORTINA` | Cortina de Magma | fecha as saídas da cratera durante a luta; não quebra, queima quem encosta | nenhum |
| 460 | `DG_O_CARVAO` | Veio de Carvão | no tufo e no andesito | carvao |
| 461 | `DG_O_DRACONIO` | Veio de Dracônio | na obsidiana rajada e no osso de dragão; brasa dourada nas frestas, luz fraca | min_draconio |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 462 | `DG_ESCADA` | Escada de Cravos | na parede; escala como a escada da mina |
| 463 | `DG_CORDA` | Corda de Couro de Draco | pendurada do teto; escala como a corda da mina |
| 464 | `DG_VAPOR` | Bica de Vapor | chão; solta um jato de vapor a cada 4 s (só visual) |
| 465 | `DG_OLIVINA` | Olivina | chão; cristaizinhos verdes que refletem a luz (decoração, não é minério) |
| 466 | `DG_TOTEM` | Totem Kobold | chão; crânio de draco num pau |
| 467 | `DG_VELA` | Vela de Sebo | chão; luz âmbar fraca |
| 468 | `DG_MOEDAS` | Moedas Espalhadas | chão; cintila; pegar dá 1 `ouro` |
| 469 | `DG_ESTALACT` | Estalactite de Lava | teto; em corrente (cai junto) |
| 470 | `DG_FUMAROLA` | Fumarola | chão; luz laranja fraca, fumaça subindo |
| 471 | `DG_COLUNA` | Coluna de Lava | do chão ao teto; onde a gota de lava encontrou o chão |
| 472 | `DG_ESCAMA` | Escama Caída | chão; brilho de cobre quando a luz bate |
| 473 | `DG_FIO` | Fio de Armadilha | entre duas paredes; fio de cobre que brilha; ao ser rompido solta pedras do teto (sombra 0,6 s antes) |

Paredes de fundo (63 a 67): `WDG_TUFO`, `WDG_ANDESITO`, `WDG_TAIPA`, `WDG_LAVA` (lava cordada escura), `WDG_OBSIDIANA`. Bem escuras, sem cor de destaque; o ouro nunca vai na parede, só em objeto.

Terceira camada (42 a 44): `DP_DG_CHAMINE` (as paredes do vulcão subindo, com brilho laranja vindo de baixo), `DP_DG_TOCAS` (um paredão de tocas kobold ao longe, com pontinhos de vela), `DP_DG_OSSADA` (esqueletos de dragões enormes ao longe, meio enterrados).

## 5. Objetos de cena (`js/182-dragao-objetos.js`)

28 objetos com `dragao: true` e o plano por faixa `DG_PROP_PLAN` (`chao`, `teto`, `fundo`).

- **Chaminés:** gêiser de pedra (chão, solta vapor), bacia de água fervendo (chão), rocha com olivina grande (chão), crosta de sal (fundo), crânio de peixe gigante caído do mar de cima (chão), cortina de vapor (fundo, animada).
- **Túneis Kobold:** fogueira kobold com espeto (chão, luz), cesto de moedas roubadas (chão), varal de escamas secando (teto), estátua de dragão de barro (chão, Túneis e santuário), tambor de couro (chão), pilha de lanças (fundo + chão), jaula de vime com um coelho-de-gruta (teto), mapa kobold riscado na parede (fundo), porta de toca de ossos (fundo + chão).
- **Tubos de Lava:** ovo de draco grande (chão, pulsa laranja), ninho de cascas e escamas (chão), casca de serpe trocada (fundo), bolha de lava esfriada partida (chão), estalactite de lava grande (teto), fluxo de lava parado no meio da descida (fundo).
- **Leito de Ouro:** crânio de dragão antigo (chão, dá para andar por dentro: o crânio é de blocos `DG_OSSO`, este é o objeto pequeno de 3 x 2), costela de dragão (fundo + chão), monte de taças e coroas (chão), armadura de cavaleiro derretida no ouro (chão), escudo com dente cravado (fundo), bigorna de reino esquecido afundada no ouro (chão), estandarte de reino esquecido (teto), espada enterrada no ouro (chão).

Objetos de chão nunca sobre ouro solto (ele desliza e o objeto ficaria sem apoio); só sobre ouro endurecido, obsidiana ou osso. Na cratera do chefe os objetos são da sala (seção 7).

## 6. Os 10 monstros: kobolds e a cria do dragão (`js/183-dragao-kobolds.js` e `js/184-dragao-dracos.js`)

| Tipo | Nome | Papel | Movimento | Ataque e aviso | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `kobfalange` | Kobold de Falange | corpo a corpo | anda em fila de 3, colados atrás de escudos de escama; a fila só avança junta | os três batem a lança no escudo duas vezes (som seco, as pontas brilham), depois estocam juntos; quebrar o escudo do primeiro desfaz a fila e eles fogem para lados diferentes | 60 | 14 | Chaminés, Túneis, Leito |
| `kobfunda` | Kobold Fundeiro | distância | mantém 6 a 10 blocos, recua pulando quando o herói chega perto | gira a funda sobre a cabeça (círculo visível, assobio subindo) e solta uma pedra de obsidiana que quica uma vez no chão ou na parede | 36 | 12 | Chaminés, Túneis |
| `kobfundidor` | Kobold Fundidor | distância (área) | anda devagar puxando um caldeirão de ouro derretido; não pula | mergulha a concha (brilho amarelo) e joga um arco de ouro; onde cai fica uma poça de 3 blocos que endurece em 2 s e **prende os pés** de quem estiver nela (1 s) | 50 | 16 | Túneis, Leito |
| `kobarmad` | Kobold Armadilheiro | emboscada | corre na frente do herói, estica um fio de armadilha (`DG_FIO`) num túnel e se esconde numa fresta | o fio brilha cobre; quem passa solta pedras do teto (sombra antes). Se o herói desviar, ele sai da fresta e arma outro mais à frente | 30 | 18 | Chaminés, Túneis |
| `kobmontado` | Kobold Montado | corpo a corpo (carga) | monta um lagarto de carga e faz passadas de lado a lado no túnel, girando no fim | abaixa a lança (a ponta desce, o lagarto bufa) e passa em linha reta; morto o lagarto, o kobold cai e foge para chamar outro | 90 | 17 | Túneis, Tubos |
| `criadraco` | Ninhada de Dracos | enxame | 5 a 7 filhotes que andam pelo chão em roda, a 4 blocos do herói | um deles guincha, todos param e abrem a boca (brilho laranja 0,5 s), e pulam juntos de lados diferentes; cada filhote tem pouca vida | 12 cada | 6 | Chaminés, Tubos |
| `camaleao` | Camaleão de Cinza | emboscada | grudado na parede de fundo, quase invisível (só um tremor na textura); anda devagar pelo fundo | os olhos acendem e ele infla a garganta (0,7 s); a língua grudenta atravessa até 8 blocos e **puxa** o herói até a boca, que morde | 70 | 15 | Chaminés, Tubos |
| `serpe` | Serpe | voador | voa alto em oito, nunca para, sobe nas correntes quentes | grito agudo e as patas se abrem; desce, **agarra** o herói e carrega por até 6 blocos antes de soltar (bater nela solta antes) | 110 | 20 | Tubos, Leito |
| `dracocour` | Draco Couraçado | pesado | quadrúpede sem asa, lento; a frente é blindada (golpe de frente faz 25%) | de frente: recolhe o pescoço (aviso) e dá uma mordida esticada; de costas: a cauda levanta e as escamas chocalham, e ela varre em arco atrás dele | 260 | 26 | Tubos, Leito |
| `wyrm` | Wyrm Constritor | emboscada (mola) | serpente longa sem asas, enrolada nas colunas de lava ou nos andaimes | aperta o corpo em volta da coluna (as escamas acendem, rangido) e se solta como uma mola em linha reta até 12 blocos; depois rasteja de volta para outra coluna | 130 | 22 | Tubos, Leito |

Nenhum deles cava (isso é do Verme de Magma), nada na lava (Salamandra) ou mergulha do teto (Gárgula). A Serpe é o único bicho do jogo que agarra e carrega; o Camaleão é o único que puxa.

**Drops:** `escama_draco`, `glandula_fogo`, `moeda_antiga`, `obsidiana_rajada`, poções, `min_draconio` (só daqui para baixo), as bases temáticas raras.

**Spawn por faixa** (`CATH_SPAWN[DG_ZONE0 + i]`):

| Faixa | Monstros (peso) | Ao mesmo tempo |
|---|---|---|
| Chaminés | kobfunda 0,24 · kobarmad 0,18 · camaleao 0,2 · criadraco 0,2 · kobfalange 0,18 | até 8 monstros |
| Túneis | kobfalange 0,26 · kobfunda 0,2 · kobarmad 0,16 · kobfundidor 0,2 · kobmontado 0,18 | até 9 monstros |
| Tubos | wyrm 0,2 · serpe 0,18 · camaleao 0,16 · dracocour 0,14 · criadraco 0,16 · kobmontado 0,16 | até 9 monstros |
| Leito | serpe 0,2 · dracocour 0,22 · wyrm 0,2 · kobfundidor 0,18 · kobfalange 0,2 | até 10 monstros |

## 7. Chefe: Cinzarel, o Dragão Ancião (`js/187-cinzarel.js`)

- **Nível 25.** Vida 330 × (1 + 0,3 × 24) = **2706**. Dano 9 × (1 + 0,2 × 24) = **52**.
- **A sala: a Cratera do Tesouro**, 90 x 44, no Leito de Ouro, do outro lado do mundo em relação às duas descidas. É uma tigela: paredes de obsidiana rajada subindo em degraus irregulares, uma chaminé aberta no teto (só brilho, não dá para sair por ela) e no meio o monte de ouro solto, com 3 picos (o central de 14 blocos de altura, os dois laterais de 8). Entre o monte e as paredes há um fosso raso de magma (2 blocos) com 4 colunas de obsidiana ao redor, que servem de abrigo. Duas entradas, uma de cada lado, no alto da tigela, com escada de cravos descendo até o ouro.
- **Ele dorme.** Ao entrar, Cinzarel está enrolado no pico central. A respiração dele faz o ouro subir e descer devagar. Ele acorda quando o herói pisa no monte ou bate nele; o primeiro golpe nele dormindo conta dobrado. As cortinas de magma (`DG_CORTINA`) descem nas duas entradas.
- **Fase 1 (100% a 60%), no chão:** mordida (o pescoço recua e a boca acende); varrida de cauda pelo monte (a ponta da cauda ergue e balança 0,8 s); **sopro em linha** (o peito incha com brilho laranja que sobe pela garganta, 1 s). O sopro derrete o ouro solto que toca: vira ouro derretido por 3 s (machuca, brilha) e depois endurece (`DG_OURO_DURO`). Assim a luta vai trocando ouro que escorrega por chão firme.
- **Fase 2 (60% a 25%), voo e avalanche:** ele levanta voo, dá uma volta pela cratera e **pousa** num dos 3 picos ou numa das colunas. Antes do pouso o ponto escolhido ganha uma sombra que cresce e o ouro ali treme (1,2 s). O pouso solta uma **avalanche**: o ouro solto da encosta desliza para baixo em onda (sistema da seção 13), empurrando e machucando quem estiver na frente. Para fugir, sobe-se para o ouro endurecido, para trás de uma coluna ou para o pico oposto. Entre pousos ele bate as asas no chão (vento empurra 4 blocos, poeira dourada antes).
- **Fase 3 (25% a 0), a cratera acorda:** o fosso de magma sobe 1 bloco a cada 20 s (no máximo 4). Cinzarel se agarra na parede da tigela e cospe **bolas de magma** em arco (a boca brilha uma vez por bola, 3 seguidas), que derretem o ouro onde caem. Quando cansa, desce e dá um **sopro varrido** da esquerda para a direita (as asas abrem e a cabeça vai para um lado antes). A luta termina no alto do monte.
- **Reinício:** sair da cratera, usar portal ou morrer reinicia. A sala guarda uma cópia dos blocos dela no começo da luta (`dgArenaSnap`) e devolve o ouro, as colunas e o magma como eram; Cinzarel volta a dormir com a vida cheia.
- **Lendário único:** **Escama de Cinzarel** (escudo): defesa alta; aparar um ataque de fogo ou um projétil não toma dano nenhum e devolve uma labareda curta na direção do atacante; brilho âmbar fraco. Nível de item 25.
- **Save:** `cinzarel.dead`. Depois de morto, a cratera fica como terminou (o ouro derretido endurecido fica) e o monte pode ser minerado.

## 8. Loot e economia (`js/188-draconio.js` e 185)

- **Metal:** **Dracônio**, temperado no fogo do dragão. `min_draconio` → `barra_draconio`, **8 minérios por barra**. Nível da forja **20**. A bigorna ganha as 9 peças de dracônio: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Na arte as peças têm escamas gravadas e o fio dourado.
- **Carvão:** veio no tufo e no andesito, como nas outras camadas.
- **Materiais próprios:**
  - `escama_draco` (Escama de Draco): dos dracos e serpes. O Grimaldo compra.
  - `glandula_fogo` (Glândula de Fogo): da serpe, do wyrm e da ninhada. A Marta compra; serve para a alquimia.
  - `moeda_antiga` (Moeda Antiga): dos kobolds e do ouro solto, 1 a cada 20 blocos. O Odo compra caro (colecionador).
  - `obsidiana_rajada` (Obsidiana Rajada): do bloco. O Grimaldo compra.
- **Bases temáticas** (só caem aqui, nível de item 22, como drop raro): **Dente de Draco** (adaga, crítico alto; cai do draco couraçado e do wyrm), **Couraça de Escamas** (peitoral, resistência a fogo; cai da serpe e do draco couraçado), **Elmo de Chifre de Serpe** (elmo, +velocidade de ataque; cai da serpe e do kobold montado). Cinzarel solta uma das três garantida, além do lendário.
- **Sem baús:** a camada não tem baús de loot (só o baú do vilarejo existe no jogo). Barras e minério vêm dos veios e dos monstros.
- **Missões do ancião:** 3 (escamas de draco, glândulas de fogo, uma coroa do Leito de Ouro).

## 9. Luz e atmosfera

- Escuro médio, mais claro que o Mar Sem Sol. Luz âmbar-amarela do magma (forte), laranja das fumarolas e ovos, âmbar fraco das velas de sebo.
- **Brilho do ouro:** ouro solto, ouro endurecido e moedas devolvem a luz que chega neles com um tom dourado (somam 30% de luz amarela à luz do bloco). A cratera fica clara por causa disso.
- Partículas: vapor subindo nas Chaminés, poeira de pomes nos Túneis, gotas de lava esfriando e caindo nos Tubos, fagulhas douradas e uma névoa de calor (ondulação leve) no Leito. Nada de cinza caindo (isso é do Abismo).

## 10. Som (`js/97-ambiente.js`, paisagem `dragao`)

Sem melodia, como as outras:
- **Base:** ruído marrom grave e quente, com um ronco de rocha (filtro passa-baixa em 80 Hz) que sobe e desce devagar.
- **Chaminés:** chiado de vapor (ruído branco com filtro alto) em jatos curtos; borbulho de água fervendo.
- **Túneis:** estalos de pedra, cliques e chiados curtos dos kobolds ao longe (vozes agudas abafadas), um tambor de couro de vez em quando.
- **Tubos:** fluxo de magma (ruído rosa grave e contínuo), estalo de lava esfriando.
- **Leito:** tilintar de moedas escorregando; e a cada 25 a 35 s **a respiração do dragão**, um sopro grave e longo que vem do lado da cratera (mais alto quanto mais perto). Depois que Cinzarel morre, a respiração para.

## 11. Interface e progressão

- Nomes de zona: Chaminés de Vapor (`o mar ferve aqui embaixo`), Túneis Kobold (`alguém cavou isto com as unhas`), Tubos de Lava (`a pedra já correu por aqui`), Leito de Ouro (`tudo isto tem dono`).
- Cor no mapa (Tab): tufo `#a8875a`, andesito `#6e625a`, lava cordada `#4a4440`, obsidiana rajada `#5a2a1e`, ouro `#d8a830`, magma `#ffa020`.

## 12. Arte (rampas de 6 tons, do mais escuro ao mais claro)

| Material | Rampa |
|---|---|
| Tufo | `#3a2a1a` `#5a4228` `#7a5c3a` `#9a774c` `#b8935e` `#d4b07a` |
| Andesito | `#2a2422` `#3e3632` `#544a44` `#6e625a` `#8a7c72` `#a89a8e` |
| Lava cordada | `#1c1a1a` `#2c2826` `#3c3634` `#4e4844` `#645c56` `#ff9a40` (brilho nas dobras) |
| Obsidiana rajada | `#1a0c08` `#2e140c` `#4a2014` `#6a301e` `#8a4630` `#c87a52` |
| Ouro | `#4a3008` `#7a5410` `#a87808` `#d8a830` `#f0cc5a` `#fff0a0` |
| Osso de dragão | `#3a3020` `#5a4c34` `#7a6a4c` `#9a8a68` `#bcac88` `#ddd0ae` |
| Magma | `#6a1a04` `#a83a08` `#e06a10` `#ffa020` `#ffd050` `#fff4c0` |
| Escama de draco | `#2a1410` `#4a2418` `#6e3820` `#9a5428` `#c47a3a` `#e8a85a` |

Kobolds: 9 x 14, cabeça de lagarto, olhos amarelos, escamas cor de tijolo, panos rasgados. Dracos sem asa, serpes com asa-braço, o wyrm sem pernas. Cinzarel: uns 120 x 70 px, escamas cor de cinza com bordas de brasa, chifres para trás, a barriga coberta de moedas grudadas.

## 13. Sistema novo: o ouro solto (`js/186-ouro-solto.js`)

O jogo ainda não tem bloco que cai. O Covil precisa de um só: `DG_OURO_SOLTO`.

- **O que faz:** um bloco de ouro solto com ar embaixo cai 1 bloco. Se embaixo é sólido mas um dos lados de baixo (diagonal) está livre e o lado está livre, ele escorrega para essa diagonal. Isso dá montes com encosta de 45 graus, como areia.
- **Quando roda:** só numa fila de blocos "acordados". Um bloco acorda quando o vizinho de baixo ou do lado muda (minerar, sopro, pouso do dragão). A fila roda 20 vezes por segundo, no máximo 200 movimentos por passo. Bloco que não se mexe dorme de novo. Assim o mundo inteiro não é varrido nunca.
- **Avalanche:** o chefe pode acordar uma área inteira de uma vez (`dgQuake(x0, x1)`); a onda vai descendo a encosta. Bloco caindo que passa pelo herói faz dano (metade do dano do chefe) e empurra para baixo da encosta. O aviso é o tremor dos blocos da área antes (0,8 a 1,2 s).
- **Save:** cada movimento é uma troca de bloco normal, então vai para os `diffs` como qualquer mineração.
- **Onde existe:** só no Leito de Ouro e nas oferendas dos santuários. A geração nunca põe ouro solto em degrau de subida nem embaixo de objeto, e o `dgClimbFix` ignora caminhos que passam por ele.
- **Chefe:** o `dgArenaSnap` guarda os blocos da cratera ao começar a luta e os devolve ao reiniciar.

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/180-dragao-api.js` | ids, `DG_BANDS`, `DG_D`, `DG_ZONE0`, `dragonBand`, `dgExits`, `dgBoss`, `dgSafe`. `DRAGAO = false` desliga a camada. |
| `js/181-dragao-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, escada e corda escaláveis, o magma corrente |
| `js/182-dragao-objetos.js` | 28 objetos e `DG_PROP_PLAN` |
| `js/183-dragao-kobolds.js` | kobold de falange, fundeiro, fundidor, armadilheiro, montado |
| `js/184-dragao-dracos.js` | ninhada de dracos, camaleão de cinza, serpe, draco couraçado, wyrm constritor |
| `js/185-dragao-mundo.js` | geração em passos, chaminés de entrada, Tubos Frios, zonas, spawn, nível, brilho do ouro, partículas, loja, missões |
| `js/186-ouro-solto.js` | o ouro que desliza, a avalanche, `dgArenaSnap` |
| `js/187-cinzarel.js` | o chefe e a Cratera do Tesouro |
| `js/188-draconio.js` | o metal na fornalha e na bigorna, as bases temáticas |
| `js/189-dragao-save.js` | `cinzarel.dead`, o estado do monte, as missões |

## 15. Decisões em aberto

1. **Quanto ouro dá o ouro solto?** Um monte grande pode virar fonte infinita de dinheiro. Recomendo 1 moeda por bloco minerado e nada quando o bloco só desliza.
2. **O golpe no dragão dormindo.** Recomendo manter o golpe dobrado: premia quem chega quieto, combina com o clima de ladrão e não muda a luta depois.
3. **O magma corrente empurra o herói?** Seria um perigo novo nos canais. Recomendo não: ele queima como a lava de hoje, e o movimento fica só na textura.
