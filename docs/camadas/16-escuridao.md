# A Escuridão: ficha de implementação

A Escuridão é a 16ª e última camada, de 2790 a 2976 m, debaixo do Abismo. É o fundo do mundo e o lugar de onde sobe a escuridão que fica mais grossa a cada camada que o herói desce. Aqui quase não há luz, o mapa esquece o que o herói viu e o próprio terreno muda no escuro; no fundo espera Nox, Aquele Que Apaga.

**O que diferencia a Escuridão das outras:** o Abismo, logo acima, é a camada mais quente, barulhenta e acesa do jogo; a Escuridão é a falta de tudo isso. Em toda outra camada a luz é enfeite; aqui ela é o recurso, a arma e o escudo.

---

## 1. Identidade

- **Nome:** A Escuridão. **Faixas:** A Borda Apagada, O Breu, As Raízes da Noite, O Fundo do Mundo.
- **Conceito:** antes do mundo só havia a Escuridão. Um povo antigo, os **Acendedores**, desceu até aqui com fogo e acendeu braseiros para segurá-la embaixo; o mundo inteiro, camada por camada, foi construído por cima dessa linha de fogo. Os braseiros foram se apagando um por um, e a Escuridão voltou a subir: é por isso que cada camada é mais escura que a de cima. No Abismo, o Príncipe do Caos montava guarda diante da Fenda (ver [15-abismo.md](15-abismo.md)): até o Inferno tem medo do que está aqui.
- **Sensação:** solidão, cegueira, o medo de apagar. O alívio de cada braseiro aceso.
- **Referências:** Darkwood, Amnesia (a luz como recurso), Hollow Knight (o Abismo e o Vazio), Alan Wake (luz que fere), o Mundo Inferior de Dark Souls (o Abismo de Oolacile).
- **Nome do jogo:** "Under Darkness" quer dizer debaixo da Escuridão. A camada 16 é a Escuridão em si, e matar o Nox muda o mundo inteiro (seção 7, o final).

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 65 | A Borda Apagada | 2790 a 2836 | rocha apagada, pedra lavrada | onde o fogo do Inferno acaba; postos de guarda dos Acendedores em ruína, braseiros frios, ossadas agarradas a lanternas |
| 66 | O Breu | 2836 a 2888 | pedra-breu, vidro negro | vãos enormes onde a luz não chega às paredes; poços sem fundo; pontes que só existem na luz |
| 67 | As Raízes da Noite | 2888 a 2940 | raiz da noite, casca de noite | a escuridão vira matéria: raízes pretas do tamanho de torres que sobem pela rocha rumo às camadas de cima |
| 68 | O Fundo do Mundo | 2940 a 2976 | pedra primeva | pedra lisa, mais velha que o mundo; os últimos altares dos Acendedores, os Selos do Fundo e O Escuro Total, a sala do Nox |

- **Entrada:** duas descidas saem do chão dos Templos do Caos, a última faixa do Abismo. Cada uma é um poço redondo de uns 4 blocos onde o fogo acaba: na boca, pedra do caos e braseiros acesos; descendo, a pedra perde a cor, os braseiros da parede do poço ficam mais fracos e o último está apagado. Uma corrente de ferro negro (`AB_CORRENTE`) desce inteira até um **Posto dos Acendedores** na Borda Apagada. Volta-se pela mesma corrente.
- **Câmara de pouso:** o Posto ao pé de cada corrente. Um anel de pedra lavrada, plano, 14 x 6 blocos, com o único **braseiro eterno** da camada (`ES_BRASEIRO` aceso desde a geração; nada o apaga). Ali não nasce monstro e a luz vai longe.
- **Saída:** não há camada 17. No chão do Fundo do Mundo ficam os dois **Selos do Fundo**: discos de pedra lavrada de 6 blocos, com um sol gravado, frios e fechados. São só decoração protegida por enquanto; eles ficam reservados como as duas descidas do endgame (seção 14). Quem gera a camada já deixa os dois anotados em `esSeals`.
- Transição: as últimas 8 linhas dos Templos do Caos esfriam (pedra do caos vira rocha apagada por ruído) e as primeiras 8 da Borda ainda têm lascas de `AB_CAOS`.

## 3. Estrutura e geração (`js/226-escuro-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo "por mundo" multiplica por `WSC`. Roda em pedaços pela geração aos poucos (seção 2 do 00-geral).

1. **Rocha por faixa.** Rocha apagada na Borda, com pedra lavrada só nas ruínas; pedra-breu no Breu, com veios de vidro negro; raiz da noite e casca de noite nas Raízes (as raízes são faixas verticais de 6 a 14 blocos de largura, por ruído esticado no eixo y); pedra primeva no Fundo. As bordas se misturam por ruído.
2. **Cavernas** por autômato. Esparsas na Borda, muito abertas no Breu, quase nenhuma nas Raízes (lá o espaço é escavado entre as raízes), lisas e baixas no Fundo.
3. **Salas por faixa:**

| Faixa | Sala | Tamanho (blocos) | O que recebe |
|---|---|---|---|
| Borda | Posto dos Acendedores (ruína) | 16 a 24 x 7 a 9 | pedra lavrada, 1 braseiro frio, ossadas, lanternas penduradas; 6 x `WSC` |
| Borda | Posto de pouso | 14 x 6 | o braseiro eterno; 2 (as descidas) |
| Breu | Grande Vão | 60 a 100 x 20 a 36 | chão em ilhas, 2 a 4 poços sem fundo, lajes de penumbra sobre alguns, um braseiro frio em cada ponta das lajes; 3 x `WSC` |
| Breu | Poço sem fundo | 3 a 6 de largura, 20 a 30 de fundo | espinhos de vidro negro no fundo e uma corrente para subir |
| Raízes | Galeria de Raiz | túnel de 3 a 5 de altura | serpenteia entre as raízes; raízes pendentes nos desníveis |
| Raízes | Nó | 14 a 20 x 10 a 14 | sala redonda dentro de um nó de raiz; braseiro frio no centro; 5 x `WSC` |
| Fundo | Altar Frio | 20 a 30 x 8 a 10 | sóis gravados, pira caída, estátuas; 3 x `WSC` |
| Fundo | O Escuro Total (chefe) | 64 x 26 | seção 7 |
| Fundo | Selo do Fundo | 10 x 5 em volta do disco | 2 |

4. **A Rota dos Acendedores.** Uma linha de braseiros frios liga cada Posto de pouso à sala do Nox, um a cada 25 a 35 blocos de caminho, sempre no chão firme. É o caminho que o herói acende. Os blocos da rota entram em `esKeep`: túneis, decoração e o breu vivo não mexem neles.
5. **Ligações.** Corrente dos Acendedores (`ES_CORRENTE`) na Borda, no Breu e no Fundo; raiz pendente (`ES_RAIZ_PEND`) nas Raízes. Todo desnível de 5 blocos ou mais ganha uma das duas. Os poços sem fundo têm corrente do fundo até a borda.
6. **Estragos.** Bolsões de breu vivo nas partes escuras (só sementes; ele cresce no jogo, seção 13), lascas de vidro negro caídas, lajes de penumbra nos Grandes Vãos. A laje nunca é o único caminho: todo vão que tem laje tem também uma volta por corrente.
7. **Minérios:** carvão na rocha apagada e na raiz, noctírio na pedra-breu e na primeva (veios × `WSC`).
8. **Alcance** a partir dos dois Postos de pouso; o que não for alcançável ganha túnel. Depois `esClimbFix` (busca com o pulo de 3 blocos, como o `mnClimbFix`) a partir da sala do Nox, de cada Nó e de cada Altar.
9. **Decoração de 1 bloco**, correção das colunas e **objetos** por último (sem baús: os baús de loot saíram do jogo). O `worldLink` do 87 roda depois, só nas linhas desta camada.

## 4. Blocos (`js/221-escuro-blocos.js`)

Ids 576 a 607 (576 a 602 usados; 603 a 607 sobram).

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 576 | `ES_APAGADA` | Rocha Apagada | massa da Borda; cinza fria, a brasa do Inferno morta | rocha_apagada |
| 577 | `ES_BREU` | Pedra-Breu | massa do Breu; preto-azulado que quase não devolve luz | pedra_breu |
| 578 | `ES_VIDRO` | Vidro Negro | veios no Breu; liso, com um reflexo frio quando a luz bate | vidro_negro |
| 579 | `ES_RAIZ` | Raiz da Noite | as raízes; fibras pretas com veio roxo-azulado | raiz_noite |
| 580 | `ES_CASCA` | Casca de Noite | a casca das raízes; dura (como o basalto) | raiz_noite |
| 581 | `ES_PRIMEVA` | Pedra Primeva | massa do Fundo; cinza-pérola, só aparece quando acesa | pedra_primeva |
| 582 | `ES_LAVRADA` | Pedra Lavrada | ruínas dos Acendedores; arenito pálido com sóis gravados | pedra_lavrada |
| 583 | `ES_TIJOLO` | Tijolo dos Acendedores | paredes dos Postos e Altares | tijolo_acendedor |
| 584 | `ES_BREU_VIVO` | Breu Vivo | cresce no escuro, recua na luz; quebra muito rápido | nenhum |
| 585 | `ES_PENUMBRA` | Laje de Penumbra | pontes nos Grandes Vãos; só é sólida com luz em cima (seção 13) | nenhum |
| 586 | `ES_BARREIRA` | Muro de Sombra | fecha O Escuro Total durante a luta; não quebra | nenhum |
| 587 | `ES_O_CARVAO` | Veio de Carvão | carvão na rocha apagada e na raiz | carvao |
| 588 | `ES_O_NOCTIRIO` | Veio de Noctírio | o metal; no escuro parece pedra-breu, na luz mostra a borda prateada | min_noctirio |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 589 | `ES_BRASEIRO_FRIO` | Braseiro Apagado | chão; sem luz; acende com uma tocha (vira 590) |
| 590 | `ES_BRASEIRO` | Braseiro Aceso | chão; luz quente forte (`EMIT` 1,3); fere a Escuridão |
| 591 | `ES_TOCHA_MORTA` | Tocha Apagada | onde estava uma tocha do herói; sem luz |
| 592 | `ES_LUME` | Lume-Fátuo | chão ou parede; ponto azul frio, luz 0,3 (não fere ninguém, só guia) |
| 593 | `ES_CORRENTE` | Corrente dos Acendedores | pendurada do teto; escala como a `CHAIN` |
| 594 | `ES_RAIZ_PEND` | Raiz Pendente | pendurada do teto nas Raízes; escala |
| 595 | `ES_ESPINHO` | Espinho de Vidro Negro | chão do fundo dos poços; machuca quem cai |
| 596 | `ES_ESTALAG` | Estalagmite de Vidro | chão |
| 597 | `ES_OSSADA` | Ossada de Acendedor | chão; esqueleto abraçado a uma lanterna vazia |
| 598 | `ES_OLHOS` | Olhos no Escuro | ar, perto da parede; dois pontos pálidos que piscam e somem quando a luz chega |
| 599 | `ES_SOL` | Sol Gravado | chão; disco de pedra que acende fraco perto de um braseiro aceso |
| 600 | `ES_COLUNA` | Coluna dos Acendedores | do chão ao teto (regra das colunas) |
| 601 | `ES_PIRA_FRIA` | Pira Apagada | só na sala do Nox; base de 1 bloco, a chama sai do objeto |
| 602 | `ES_PIRA` | Pira Acesa | só na sala do Nox; `EMIT` 1,6 |

- **Paredes de fundo** (ids 83 a 87): `WES_APAGADA`, `WES_BREU`, `WES_RAIZ`, `WES_LAVRADA`, `WES_PRIMEVA`. As mais escuras do jogo; a lavrada é a única com um tom quente, apagado.
- **Terceira camada** (ids 54 a 56): `DP_ES_NADA` (quase preto, um vazio sem forma; aparece onde a parede de fundo rasga no Breu), `DP_ES_RAIZES` (raízes gigantes subindo ao longe, cortadas pelo topo da tela: elas continuam para cima, pelo mundo todo), `DP_ES_TORRES` (torres de vigia dos Acendedores ao longe, na Borda e no Fundo).

## 5. Objetos de cena (`js/222-escuro-objetos.js`)

28 objetos com `escuro: true` e o plano por faixa `ES_PROP_PLAN` (formato do `MN_PROP_PLAN`). Nenhum tem luz própria, a não ser os marcados.

- **Chão:** estátua de Acendedor de braço erguido (sem a cabeça; Borda, Fundo); ossada abraçada a uma lanterna grande (Borda, Breu); pira caída (Fundo); pilha de tochas apagadas (Borda); vaso de óleo seco (Borda); obelisco quebrado com raios de sol (Borda, Fundo); pedestal vazio (Fundo); anel de pedras dos Acendedores (Borda); carcaça de colosso petrificada (Breu, Fundo); mão de pedra saindo do chão (Breu); toco de raiz cortado (Raízes); altar frio (Fundo); Selo do Fundo (Fundo, só os dois; protegido, não quebra).
- **Teto:** lanterna apagada pendurada na corrente (Borda, Fundo); gaiola de lume vazia (Borda); casulo de mariposas (Breu, Raízes); cacho de raízes pendentes (Raízes); estalactite grande de vidro negro (Breu); estandarte desbotado com sol (Borda).
- **Fundo + chão:** porta selada dos Acendedores (Borda, Fundo); relevo do sol nascente (Fundo); raiz-veia subindo pela parede, de 3 a 5 blocos de altura (Raízes).
- **Fundo (olho):** **o Mural dos Acendedores** (Borda e Fundo, um por faixa): uma coluna de 16 faixas desenhadas uma em cima da outra, com um sol pequeno no topo (o vilarejo) e uma mancha preta subindo do fundo. É o mapa do jogo pintado por quem o construiu; escrita apagada (Borda); sombra de alguém na parede, que não é de ninguém (Breu, Raízes); janela para o Nada, um buraco na parede onde não há terceira camada, só preto (Breu); par de olhos grandes que piscam (Breu, animado); marcas de mão pálidas (Raízes).

## 6. Os 10 monstros: o que a Escuridão gera

Família: a Escuridão feita corpo, e o que ela fez dos Acendedores que comeu. Os marcados com **sombra** são feridos pela luz forte (seção 13); os outros não.

Arquivos: `js/224-escuro-crias.js` (os 5 primeiros) e `js/225-escuro-crias2.js` (os 5 últimos).

| Tipo | Nome | Papel | Movimento | Ataque (com o aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `apagaluz` | O Apagador (sombra) | corpo a corpo | anda de braços compridos até a **luz** mais próxima, não até o herói; apaga tochas e braseiros com a mão | se o herói estiver perto, garra dupla (os braços sobem e os dois olhos brancos se arregalam por 0,6 s) | 70 | 16 | Borda, Breu, Fundo |
| `bocabreu` | Boca do Breu (sombra) | emboscada | é uma mancha no chão escuro; não anda, muda de lugar devagar quando ninguém vê | um anel de dentes brancos aparece em volta dos pés do herói e ele ouve um fôlego; 0,7 s depois a boca fecha de baixo. Não abre em chão aceso | 120 | 26 | Breu, Raízes |
| `traca` | Mariposa Negra | enxame | bandos de 5 a 8 que voam para a luz mais forte; cobrem braseiros e tochas e baixam a luz deles | rasante em fila (as asas piscam pálidas antes) e deixa pó que embaça a luz do herói por 3 s | 18 | 8 | Borda, Fundo |
| `semolhos` | Vigia Sem Olhos (sombra) | distância | fica parado em bordas altas; vira o rosto liso devagar para o herói | o peito abre num buraco escuro com a borda acesa (0,8 s) e solta uma esfera de breu lenta; quem é atingido fica com a própria luz pela metade por 6 s | 80 | 18 | Breu, Fundo |
| `colosso` | Colosso de Breu | pesado | **só se mexe no escuro**: com luz em cima (0,35 ou mais) ele congela no meio do passo; no escuro anda rápido | soco no chão: uma rachadura pálida corre pelo chão até onde vai bater, 0,9 s antes | 300 | 30 | Breu, Fundo |
| `rastro` | Rastro (sombra) | corpo a corpo | desliza achatado pelo chão e pelas paredes como uma sombra, sem poder ser atingido | levanta do chão (os olhos acendem e ele cresce em 0,5 s) e dá um bote curto; na luz forte ele é obrigado a levantar e fica exposto | 90 | 22 | Borda, Raízes |
| `mortalha` | Mortalha (sombra) | voador | plana em arcos longos como um pano preto ao vento, sem bater asas | para em cima do herói e as bordas acendem (0,7 s); se acertar, envolve: a luz do herói some e ele toma dano por 2 s ou até acertá-la | 60 | 14 | Breu, Raízes |
| `ouvinte` | O Ouvinte | distância curta | é cego; anda na direção do **barulho**: golpe, picareta, corrida, pulo. Parado ou agachado, o herói some para ele | grito em cone (a cabeça sobe e anéis pálidos saem da boca 0,6 s antes): empurra e atordoa | 110 | 20 | Borda, Raízes |
| `acendedor` | Acendedor Oco | distância em arco | um Acendedor esvaziado pela Escuridão; anda devagar com a lanterna de chama azul fria e guarda os braseiros acesos | ergue a lanterna para trás (rastro de luz) e a arremessa em arco; onde cai, fica uma poça de fogo frio por 4 s, que machuca e ilumina | 100 | 20 | Borda, Raízes |
| `maofundo` | Mão do Fundo (sombra) | emboscada | mora dentro dos poços sem fundo e das bordas dos vãos | dedos pálidos aparecem na borda e arranham a pedra (0,8 s); a mão agarra quem está na borda ou na corrente e puxa para baixo | 140 | 24 | Breu, Fundo |

- **Nível:** 33 na metade de cima da camada e 34 da metade para baixo (a partir de 93 m); 30% vêm 1 acima, mas nunca passam de 34.
- **Drops:** pó de breu (apagaluz, rastro, mortalha), asa de mariposa (traca), núcleo de breu (colosso, semolhos), lume frio (acendedor), `min_noctirio` (colosso, semolhos, maofundo, bocabreu), poções, carvão, tochas (de 1 a 2, 20%) e raramente as bases temáticas (seção 8).
- **Spawn:** só em tile com luz abaixo de 0,15, nunca a menos de 12 blocos de um braseiro aceso, nunca na sala do Nox.

| Faixa | Pesos | Máximo |
|---|---|---|
| A Borda Apagada | apagaluz 0,25, traca 0,25, acendedor 0,2, ouvinte 0,15, rastro 0,15 | Até 8 monstros |
| O Breu | bocabreu 0,2, mortalha 0,2, colosso 0,15, semolhos 0,15, maofundo 0,15, apagaluz 0,15 | Até 8 monstros |
| As Raízes da Noite | rastro 0,22, acendedor 0,2, ouvinte 0,2, bocabreu 0,2, mortalha 0,18 | Até 9 monstros |
| O Fundo do Mundo | colosso 0,2, semolhos 0,2, maofundo 0,2, apagaluz 0,2, traca 0,2 | Até 8 monstros |

## 7. Chefe: Nox, Aquele Que Apaga (`js/227-nox.js`)

**A sala: O Escuro Total.** Uma caverna redonda de pedra primeva, 64 x 26 blocos, no fim do Fundo do Mundo, do outro lado do mundo em relação às duas descidas. É a única sala do jogo sem nenhuma luz própria. Nas paredes há saliências de pedra lavrada em três alturas, e em cada uma duas **Piras dos Acendedores** apagadas (`ES_PIRA_FRIA`): duas no chão, nas pontas; duas a 8 blocos de altura; duas a 15, no alto, perto do meio. Correntes sobem do chão às saliências. As paredes são o Mural dos Acendedores inteiro, que só se vê quando as piras estão acesas.

**Nox:** ninguém vê o corpo dele. No escuro ele é um pedaço mais preto que o preto, com uma borda pálida que tremula e dois olhos como estrelas frias, de uns 40 x 70 px. Quando a luz bate, aparece uma figura alta, magra, sem rosto, feita de fumaça parada.

**Como se luta:**
- Ao entrar, o Muro de Sombra (`ES_BARREIRA`) fecha as saídas e a luz do próprio herói cai para 0,3 (só o corpo dele aparece).
- **Nox só toma dano com luz em cima dele** (0,5 ou mais no centro dele). No escuro, o golpe atravessa fumaça: sem número, sem sangue, com um som oco.
- **Acender uma pira:** encostar nela e apertar a tecla de usar com uma tocha na bolsa. O herói se ajoelha por 1 s (pode ser interrompido) e gasta 1 tocha. Pira acesa tem `EMIT` 1,6: um círculo grande de luz.
- Na luz forte de uma pira (0,6 ou mais), Nox queima: perde 1,5% da vida por segundo, encolhe e recua. Ele não entra no círculo; apaga a pira de longe.
- Tocha posta pelo herói na sala dura 20 s (fora daqui, 90 s) e serve para iluminar Nox de perto por um instante.

| Fase | Quando | Ataques e avisos |
|---|---|---|
| 1 | 100% a 60% | **Braço de Breu:** um braço comprido varre o chão (a borda pálida do braço aparece primeiro, no caminho todo, 0,8 s). **Sopro que Apaga:** ele inspira e todas as chamas da sala se curvam na direção dele (1 s); depois um cone que apaga piras e tochas e machuca. Anda até a pira acesa mais perto do herói para soprá-la. |
| 2 | 60% a 25% | Afunda no chão e o chão vira um espelho preto. **Subida:** um anel pálido aparece sob o herói (0,9 s) e Nox sobe por ele. Chama mariposas (cobrem piras e baixam a luz delas) e 2 apagadores, que saem das paredes e vão direto às piras. |
| 3 | 25% a 0 | **Apagar:** ele apaga todas as piras de uma vez e todo som some por 2 s. Só os olhos dele aparecem. **Noite Total:** a cada 12 s as bordas da tela escurecem para dentro por 2 s; quem não estiver no círculo de uma pira acesa toma um golpe pesado (1,6 vezes o dano). Acender pira de novo é o único abrigo, e ele vai atrás de quem tenta. |

- **Números:** nível 37, vida 3900 (330 × 11,8), dano 74 (9 × 8,2), antes do `BAL` do 49, como os outros chefes. Lacaios no nível 36.
- **A sala muda a luta:** o herói não persegue o chefe, persegue a luz. A pergunta de cada momento é qual pira acender e quando, e as piras do alto são as mais seguras e as mais caras de alcançar.
- **Reinício:** sair da sala, usar o portal ou morrer encerra a luta; as piras voltam a apagar, o muro afunda e a vida dele volta toda.
- **Lendário único:** **A Última Brasa** (acessório, `ultima_brasa`, nível 37): um carvão que não apaga, preso numa gaiola de pedra lavrada. +4 de luz; a luz do herói passa a ferir as criaturas da sombra como um braseiro pequeno; tochas que o herói põe nunca se apagam sozinhas; +15% de dano. Solta também noctírio (6 a 10), núcleos de breu, poções e, com 35% de chance, uma das bases temáticas.
- **Save:** `nox` (`{ dead, kills }`).

**O fim (sem cena longa, o jogador não perde o controle):**
1. Nox para, fica pálido e fino como fumaça e é puxado para baixo, para dentro do chão, sem grito. Dois segundos de silêncio total.
2. As seis piras acendem sozinhas, uma de cada vez, de baixo para cima, com um tom grave e quente cada uma. O Mural aparece inteiro pela primeira vez.
3. Faixa na tela: "A Escuridão recua", subtítulo "a luz chegou ao fundo".
4. **O mundo muda, pouco e para sempre:** a luz ambiente mínima de todas as camadas sobe (de 0,09 para 0,12 no `computeLight`) e a Escuridão ganha a luz ambiente de uma caverna funda (0,09 em vez de 0). O breu vivo para de crescer. Quem voltar às Cavernas vai notar que estão menos escuras.
5. No vilarejo, o ancião ganha uma fala nova, de uma linha, sobre os Acendedores.

## 8. Loot e economia

- **Metal: Noctírio** (`js/228-noctirio.js`). O metal que bebe a luz: preto, com borda prateada. `min_noctirio` vira `barra_noctirio` com **10 minérios por barra**. Nível da forja **31**. As 9 peças na bigorna do Grimaldo: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas de noctírio, nas mesmas proporções da infernita (`M.il = 31`).
- **Materiais:**

| Id | Nome | De quem | Quem compra |
|---|---|---|---|
| `po_breu` | Pó de Breu | apagaluz, rastro, mortalha | alquimista |
| `asa_mariposa` | Asa de Mariposa Negra | traca | curandeira |
| `nucleo_breu` | Núcleo de Breu | colosso, vigia sem olhos | ferreiro |
| `lume_frio` | Lume Frio | acendedor oco | curandeira |

- **Bases temáticas** (nível 33, só caem aqui, como drop raro de monstro e do chefe): `lamina_vidronegro` (Lâmina de Vidro Negro, espada, rápida e com crítico alto), `manto_breu` (Manto de Breu, peitoral, defesa e esquiva no escuro), `escudo_acendedor` (Escudo dos Acendedores, escudo com uma lanterna presa: +2 de luz).
- **Sem baús.** Os baús de loot saíram do jogo (só fica o baú do vilarejo). As bases temáticas caem só como drop raro: `lamina_vidronegro` do rastro e do apagador (1,5%), `manto_breu` da mortalha e do colosso (1,5%), `escudo_acendedor` do acendedor oco (2%). O Nox solta uma das três com 35% de chance.
- **Tochas são a moeda da camada.** Os monstros soltam carvão e algumas tochas; carvão e madeira fazem tochas como hoje. O ferreiro e a curandeira passam a vender tochas em lote.

## 9. Luz e atmosfera

- Ambiente: 0 (nenhuma luz de fundo). A luz do herói vale a metade (seção 13). Luzes da camada: braseiros acesos (quentes, `#ffb060`), lumes-fátuos (azul frio, fracos), lanternas dos acendedores ocos (azul frio), piras (quentes, fortes). O quente é sempre do herói ou dos Acendedores; o frio é da Escuridão.
- Partículas: poeira preta que **desce** devagar na Borda, nada no Breu (o vazio não tem partícula), pó de raiz caindo nas Raízes, faíscas brancas que somem no Fundo. Perto de um braseiro aceso, as partículas fogem da luz.
- `ES_OLHOS` e o vidro negro são desenhados no `drawGlow` só quando a luz no tile é baixa (olhos) ou alta (reflexo).

## 10. Som (`js/97-ambiente.js`, cenário `escuro`)

Quase silêncio. Sem melodia, como os outros.
- **Fundo:** ruído marrom muito baixo (40 a 70 Hz), reverberação enorme (`rt` 5) e pouco som direto: tudo parece longe.
- **Eventos:** uma gota que ecoa tempo demais; um fôlego longe, que para quando o herói para; uma pedra caindo num poço **que nunca bate no fundo** (Breu); fibras rangendo e apertando (Raízes); um tom grave quase inaudível que **para quando um braseiro acende** perto (Fundo); vento frio pelas frestas (Borda).
- Perto de um braseiro aceso: estalo de fogo quente, o único som acolhedor da camada.
- Na sala do Nox, nada de cenário: só o fogo das piras e ele.

## 11. Interface e progressão

- **Nomes das zonas** (`ZONE_NAMES` e `ZONE_SUB`): A Borda Apagada ("aqui o fogo acaba"), O Breu ("a luz não chega às paredes"), As Raízes da Noite ("tudo isto sobe"), O Fundo do Mundo ("não há nada embaixo").
- **Cor no mapa:** azul-preto `#14161e`, com o noctírio em prata `#7c8aa8` e os braseiros acesos em laranja `#ffb060`. O mapa desta camada esquece (seção 13).
- **Teleporte de teste** (`js/75-teleporte.js`): entra "A Escuridão" com as 4 faixas.
- **Missões:** nenhuma agora; esperam o sistema novo do Jonathan.

## 12. Arte

Padrão do vilarejo: granulado, 6 tons, luz de cima à esquerda, contorno só onde toca o ar. Aqui, mais que em qualquer camada, os tons mais claros só aparecem na luz; nada usa preto puro.

| Material | Rampa (do escuro ao claro) |
|---|---|
| Rocha apagada | `#121012` `#1e1a1a` `#2a2524` `#3a3330` `#4c4440` `#605652` |
| Pedra-breu | `#07080c` `#0d0f15` `#14171f` `#1b1f2a` `#242936` `#2e3444` |
| Vidro negro | `#08080c` `#0e0d14` `#191826` `#262438` `#3a3852` `#6a6890` |
| Raiz da noite | `#0a070c` `#150f18` `#211726` `#2e2036` `#3e2b48` `#54405e` |
| Pedra primeva | `#1a1a1e` `#26262c` `#33333a` `#43434b` `#57575f` `#6e6e76` |
| Pedra lavrada | `#2a241c` `#3a3226` `#4c4232` `#625640` `#7c6e52` `#9a8a68` |
| Noctírio | `#06070a` `#0b0d14` `#151a26` `#2a3246` `#7c8aa8` `#d8e2f4` |
| Lume frio | `#1c2a44` `#2c4a78` `#4a74b0` `#7aa2dc` `#b4ceff` `#e6f0ff` |
| Braseiro | `#3a1a08` `#7a3410` `#c05a18` `#f08a2a` `#ffbe5a` `#ffe6a8` |

As criaturas da sombra são silhuetas: corpo nos dois tons mais escuros da pedra-breu, borda de 1 px no tom mais claro do lume frio e os olhos em `#e6f0ff`. Humanoides (apagador, acendedor oco) em 12 x 22 com os encaixes do herói.

## 13. Sistemas novos

### A luz como dano e as regras do escuro (`js/223-escuro-luz.js`)

O jogo já calcula a luz de cada tile perto da câmera: `computeLight` (`js/07-chunks-luz.js`) enche `LB` (luz de 0 a 1 ou mais), numa janela da tela mais 12 tiles de margem, a partir de `EMIT` dos blocos, da luz do herói (`0,86 + 0,08 × pl.light`), dos projéteis, dos objetos (`propLights`) e de alguns monstros. O sistema novo só **lê** isso e muda três números:

1. **`lightAt(tx, ty)`**: lê `LB[(ty − LY0) × LW + tx − LX0]` do último quadro. Fora da janela, usa os braseiros acesos guardados numa lista (`esLit`): `1,3 − 0,088 × distância`. Assim um monstro fora da tela também sabe se está na luz.
2. **Luz ambiente por camada.** Hoje `computeLight` calcula `amb` direto. Ganha um gancho de uma linha, `ambAt(pty)`, que as camadas podem embrulhar. Na Escuridão ele devolve 0 (0,09 depois do Nox). Nas outras não muda nada.
3. **Luz do herói por camada.** Outro gancho de uma linha, `plLightK()`, multiplica o `pv`. Na Escuridão vale 0,5: a luz do herói alcança uns 5 blocos e fica abaixo de 0,6, então não fere ninguém. Com A Última Brasa, a luz dele conta como de braseiro.
4. **Dano da luz:** monstros com `sombra: true` em `ET` tomam por segundo `(L − 0,6) × 0,5 × vida máxima` quando `L = lightAt` do centro passa de 0,6. Uma tocha (1,0) mata um apagador em uns 5 s; um braseiro (1,3) em uns 3. Na busca de caminho, tile com luz 0,6 ou mais custa 8 vezes mais para eles: eles contornam a luz.
5. **Tochas que acabam:** tocha posta na Escuridão vira `ES_TOCHA_MORTA` depois de 90 s (lista `esTorches` com o tempo, não salva; ao carregar, as tochas da camada voltam com 90 s). O apagador e o Nox apagam na hora.
6. **Braseiros:** `ES_BRASEIRO_FRIO` vira `ES_BRASEIRO` com a tecla de usar e uma tocha. É uma troca de bloco comum (`setTile`), então fica salva nos `diffs`. Apagado por um monstro, volta a frio (também salvo).
7. **O mapa esquece:** só nesta camada, cada tile visto ganha uma idade (`esSeenAge`, 1 byte por tile das linhas da camada, uns 170 KB). Uma vez por segundo, tile que não está aceso fica mais velho; com 120 s ele sai de `seen` e some do mapa (Tab). Tile a menos de 14 blocos de um braseiro aceso nunca envelhece. Acender a rota é o jeito de "salvar" o mapa.

### O terreno que muda no escuro

- **Breu vivo** (`ES_BREU_VIVO`): uma vez a cada 4 s, um tile de ar escuro (luz abaixo de 0,05), vizinho de breu vivo e dentro da janela da câmera, vira breu vivo. No máximo 40 por área de 30 x 30, nunca em `esKeep` (rota, descidas, Postos, correntes, sala do Nox). Com luz 0,6 ou mais, ele recua um tile por segundo. Quebra com um golpe de picareta. É escrito direto em `tiles` (não em `diffs`): não vai para o save e o mundo carregado volta sem ele. Fecha passagens atrás do herói, mas nunca prende.
- **Laje de penumbra** (`ES_PENUMBRA`): `SOLID` dela é 0 no vetor, e o `solidAt` embrulhado devolve sólido se `lightAt` do tile for 0,45 ou mais. O herói sozinho (0,43) não basta: precisa de uma tocha ou do braseiro da ponta. No escuro ela é um vidro quase invisível; com luz, um chão de névoa clara. Monstros da sombra não pisam nela.
- Os dois mexem só em linhas da camada 16; nada muda nas outras.

## 14. Ganchos para o endgame

O Jonathan quer um sistema de endgame depois do Nox. Esta ficha não desenha o sistema; só deixa os pontos onde ele encaixa. Os ids de bloco 608 a 639 e os arquivos `js/230` em diante ficam para ele.

- **Nox repetível:** o save guarda `nox.kills`, não só `dead`. A luta já reinicia sozinha e os números saem de `NOX = { lvl, hp, dmg }`, então um sistema futuro só precisa reacender a sala e escolher o nível.
- **Escuridão profunda:** o gerador recebe um `tier` (0 = normal) que já muda três coisas: o nível dos monstros (+3 por tier), o máximo de breu vivo e o `plLightK`. Os dois **Selos do Fundo** são as portas reservadas para esses níveis mais fundos; hoje não abrem.
- **Melhoria com noctírio:** o noctírio e o núcleo de breu continuam úteis depois da forja (o ferreiro compra, mas a ficha não gasta tudo). O endgame pode usá-los para subir o nível de um item. `MAT_VAL` deles fica alto de propósito.
- **Luz como regra reutilizável:** `lightAt`, `ambAt`, `plLightK` e a marca `sombra` em `ET` servem para qualquer camada ou modo futuro.

## 15. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/220-escuro-api.js` | ids 576 a 602, paredes 83 a 87, terceira camada 54 a 56, `ES_BANDS` (0, 46, 98, 150, 186), `ES_ZONE0` (65), `escuroBand`, `esArrivals`, `esSeals`, `esBoss`, `esKeep`. `ESCURO = false` desliga a camada |
| `js/221-escuro-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, corrente e raiz escaláveis |
| `js/222-escuro-objetos.js` | os 28 objetos, o Mural e `ES_PROP_PLAN` |
| `js/223-escuro-luz.js` | `lightAt`, ganchos `ambAt` e `plLightK`, dano da luz, tochas que acabam, braseiros, mapa que esquece, breu vivo, laje de penumbra |
| `js/224-escuro-crias.js` | apagador, boca do breu, mariposa, vigia sem olhos, colosso |
| `js/225-escuro-crias2.js` | rastro, mortalha, ouvinte, acendedor oco, mão do fundo |
| `js/226-escuro-mundo.js` | geração em pedaços, rota dos Acendedores, `esClimbFix`, zonas, spawn, nível, brilhos, partículas, lojas |
| `js/227-nox.js` | Nox, a sala, as piras, o fim e a mudança de luz do mundo |
| `js/228-noctirio.js` | o metal na forja (10 minérios, nível 31) |
| `js/229-escuro-save.js` | `nox`, a idade do mapa não é salva, as piras voltam frias |

Fora da faixa, só ganchos: uma linha em `js/07-chunks-luz.js` (`ambAt` e `plLightK`), o cenário `escuro` no `js/97-ambiente.js`, a camada no `js/75-teleporte.js`, a wiki (aba de bioma, inimigos, chefe, forja e `wiki/js/textos.js`) e a spec `docs/escuridao-spec.md`.

---

## Decisões em aberto

1. **Acender pira e braseiro gasta uma tocha?** Recomendo que sim: faz da tocha o recurso da camada e dá peso à escolha de qual acender.
2. **O mapa esquecer o que não está aceso não é cruel demais?** Recomendo manter, só nesta camada, com os braseiros acesos guardando o mapa em volta: é o que faz do mapa o perigo.
3. **Matar o Nox clareia todas as camadas?** Recomendo que sim, mas pouco (ambiente mínimo de 0,09 para 0,12): é o fim que o nome do jogo pede, sem estragar o clima das outras.
