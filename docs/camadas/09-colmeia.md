# A Colmeia: ficha de implementação

A nona camada, debaixo da Fortaleza dos Anões, de 1488 a 1674 m. É o que expulsou os anões: uma colmeia de insetos gigantes que cavou de baixo para cima, engoliu os salões de pedra em cera e resina e guarda, nas câmaras de âmbar, tudo o que prendeu no caminho. Monstros de nível 18 a 20, metal novo Ambrita, chefe A Rainha da Colmeia (nível 21).

**O que a diferencia:** é a única camada **construída por bichos**: tudo é estreito, morno, curvo e hexagonal, sem um único vão grande fora das câmaras de âmbar, o contrário da pedra reta da Fortaleza em cima e do mar aberto e frio embaixo. Do Ninho das Cavernas ela difere pela ordem (favos, cera, mel, luz âmbar) em vez de teia solta no escuro; do Abismo, pelo calor de corpo em vez de fogo.

## 1. Identidade

- **Faixas:** Brecha Tomada, Galerias de Cera, Câmaras de Âmbar, O Berçário.
- **Conceito:** os anões cavaram até ouvir um zumbido debaixo da pedra. A colmeia subiu por esse buraco, encheu os salões de baixo de cera e lacrou os anões que não fugiram dentro da resina. Hoje a colmeia é um organismo só: túneis que respiram, favos cheios de mel e de larva, e no fundo uma esfera de favos onde a Rainha põe ovos sem parar.
- **Sensação:** claustrofobia. Teto sempre perto, curvas que escondem o que vem, zumbido que não para, calor úmido. O herói é o intruso dentro de um corpo vivo que trabalha.
- **Referências:** Hollow Knight (Colmeia), Alien (o ninho), Starship Troopers, os formigueiros cortados ao meio dos livros de ciência.

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 41 | Brecha Tomada | 1488 a 1530 | pedra da Fortaleza, Pedra Tomada, Cera Velha | os salões de baixo dos anões, retos, meio engolidos: cera inchando das paredes, túneis furando o chão |
| 42 | Galerias de Cera | 1530 a 1580 | Cera Velha, Cera Nova, Favo | labirinto de túneis estreitos e salas de favo hexagonais; mel pingando; o trabalho da colmeia |
| 43 | Câmaras de Âmbar | 1580 a 1626 | Resina, Âmbar | câmaras redondas maiores, forradas de resina, com blocos de âmbar e coisas presas dentro; veios de ambrita |
| 44 | O Berçário | 1626 a 1674 | Cera Real, Quitina | câmaras de ovos, galerias reais, a esfera da Rainha; as duas descidas para o mar |

- **Entrada:** as duas descidas saem do chão da última faixa da Fortaleza, nas posições que ela anota (como `mnExits`). Cada uma é uma **brecha**: um buraco torto no piso de pedra, com a borda coberta de crosta de cera escorrida, como uma ferida que inchou. Da brecha desce um tubo de cera de 3 de largura com a **Escada de Favos** inteira (`CM_ESCADA_FAVO`) por 20 a 28 fileiras, até um salão anão da Brecha Tomada. Volta-se pela mesma escada.
- **Câmara de pouso:** ao pé de cada escada, um salão anão de 12 x 6 que a cera ainda não alcançou: piso de pedra plano, uma lanterna anã acesa, sem monstro. É o último lugar com cara de gente.
- **Saída:** dois **Escorredouros de Mel** no chão de câmaras de ovos do Berçário, a pelo menos `WW / 3` um do outro e longe da esfera. São poços onde o mel da colmeia escorre para baixo: paredes de cera brilhando de mel, Escada de Favos inteira até a última fileira, gotas caindo. A camada guarda as posições em `cmExits`; o Mar Sem Sol continua o poço como uma raiz de cera pendurada no teto dele.
- **Nível dos monstros:** 18 + 1 a cada 60 m (18 de 1488 a 1548, 19 até 1608, 20 até o fim). 30% vêm 1 nível acima.

## 3. Estrutura e geração (`js/165-colmeia-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo que é "por mundo" multiplica por `WSC`. Altura máxima de vão fora das Câmaras de Âmbar e da esfera: 12 fileiras. É isso que faz a camada apertar.

1. **Rocha por faixa.** A pedra da Fortaleza afina por ruído nas primeiras 10 fileiras e vira `CM_PEDRA_TOMADA`; abaixo dela `CM_CERA`, depois `CM_RESINA` nas Câmaras e `CM_CERA_REAL` no Berçário. Bordas sempre por ruído. Sem autômato de caverna: aqui nada é natural, tudo foi cavado.
2. **Salas e túneis por faixa:**

| Faixa | Espaços | Tamanho | Quantos |
|---|---|---|---|
| Brecha Tomada | salões anões retos com piso de pedra, comidos pela cera nas pontas | 20 a 34 x 6 a 8 | 7 x `WSC` |
| Brecha Tomada | túneis de inseto furando os salões (minhoca estreita) | 3 de altura | 10 x `WSC` |
| Galerias de Cera | túneis ramificados em labirinto, com gargalos | 3 de altura, gargalos de 2 | 30 x `WSC` |
| Galerias de Cera | favais: grupos de 3 a 6 salas hexagonais (retângulo com os 4 cantos chanfrados em degrau) | 9 a 12 x 6 a 8 | 8 x `WSC` |
| Câmaras de Âmbar | câmaras redondas forradas de resina, com 1 a 3 massas de âmbar | 14 a 22 x 10 a 14 | 6 x `WSC` |
| Berçário | câmaras de ovos (ovos no chão e nas paredes) | 12 a 18 x 8 a 10 | 6 x `WSC` |
| Berçário | galerias reais, mais largas e retas, ligando as câmaras à esfera | 4 de altura | 4 x `WSC` |
| Berçário | a esfera da Rainha (seção 7) | 40 x 40 | 1 |

3. **Ligações entre andares.** Em todo desnível de 5 ou mais, Escada de Favos ou Fio de Cera (`CM_FIO_CERA`, escala como a corrente). Entre faixas, 2 x `WSC` poços verticais de 3 de largura com Escada de Favos. Os túneis do labirinto sobem em rampa de degraus de no máximo 3 (o pulo do herói).
4. **Estragos.** Favos derretidos: em 30% das salas de favo, o mel escorreu e deixou Poças de Mel (`CM_POCA_MEL`, deixa o herói lento) no chão, nunca nos degraus de subida, nunca na esfera nem na câmara de pouso. Cera desabada: montes de Cera Nova tapando metade de um túnel (quebra rápido).
5. **Minérios.** Carvão (`CM_O_CARVAO`) na Resina e na Pedra Tomada, 40 veios x `WSC`. Ambrita (`CM_O_AMBRITA`) só na Resina e no Âmbar, 26 veios x `WSC`, dois terços nas Câmaras de Âmbar. Nenhum outro metal (`js/102-minerios-camada.js`).
6. **Alcance** a partir das duas brechas. Busca andando e pulando (`cmClimbFix`, como o `mnClimbFix`), saindo da esfera, de cada câmara de âmbar e de cada câmara de ovos: onde não sobe, põe Escada de Favos do chão alcançado até a borda que falta. Depois o `worldLink` do 87 só na faixa da camada.
7. **Decoração de 1 bloco** (seção 4), com o apoio de cada uma.
8. **Correção estrutural.** Colunas de Cera vão do chão ao teto ou saem; Estalactites de Resina em corrente caem juntas.
9. **Objetos** por último (seção 5), com `CM_PROP_PLAN`.

## 4. Blocos (`js/161-colmeia-blocos.js`)

Ids 384 a 415. Sólidos:

| Id | Constante | Nome | Uso | Solta |
|---|---|---|---|---|
| 384 | `CM_CERA` | Cera Velha | massa geral; amarelo-marrom escuro, camadas finas | cera_bruta (bloco) |
| 385 | `CM_CERA_NOVA` | Cera Nova | paredes de túnel e remendos; amarelo-pálido, quebra muito rápido | cera_bruta |
| 386 | `CM_FAVO` | Favo Vazio | paredes das salas de favo; hexágonos vazados | favo |
| 387 | `CM_FAVO_MEL` | Favo de Mel | dentro dos favais; hexágonos cheios, brilho de mel | favo e mel_escuro (às vezes) |
| 388 | `CM_RESINA` | Resina | massa das Câmaras; vermelho-âmbar escuro, dura | resina |
| 389 | `CM_AMBAR` | Âmbar | massas nas câmaras; translúcido (`SEETHRU`), deixa a luz passar, brilho fraco | ambar |
| 390 | `CM_AMBAR_FOSSIL` | Âmbar com Fóssil | 1 em cada 12 blocos de âmbar; um bichinho ou osso preso dentro | ambar_fossil |
| 391 | `CM_PEDRA_TOMADA` | Pedra Tomada | transição; pedra anã lavrada com cera nas juntas | pedra_tomada |
| 392 | `CM_CERA_REAL` | Cera Real | massa do Berçário; dourado-rosado, morna | cera_real |
| 393 | `CM_QUITINA` | Placas de Quitina | casca da esfera e reforço das galerias reais; preto-esverdeado, muito duro | quitina (já existe) |
| 394 | `CM_OVO` | Ovo Colado | cachos no chão e nas paredes do Berçário; ao quebrar, 30% de chance de sair uma larva | nenhum |
| 395 | `CM_O_CARVAO` | Veio de Carvão | carvão de resina velha | carvao |
| 396 | `CM_O_AMBRITA` | Veio de Ambrita | o metal da camada, na resina e no âmbar; mel endurecido com brilho dourado fraco | min_ambrita |
| 397 | `CM_FAVO_REAL` | Favo Real | os anéis da esfera; quebra com 2 golpes de arma ou picareta; solta larva ou abre caminho | nenhum |
| 398 | `CM_LACRE` | Lacre Real | fecha as duas aberturas da esfera durante a luta; não quebra | nenhum |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 399 | `CM_GOTA_MEL` | Mel Pingando | teto; gota animada |
| 400 | `CM_ESTALAC` | Estalactite de Resina | teto; empilha até 3 em corrente |
| 401 | `CM_ESCADA_FAVO` | Escada de Favos | parede de favos em degrau; escala como a escada da mina |
| 402 | `CM_FIO_CERA` | Fio de Cera | pendurado do teto; escala como a `CHAIN` |
| 403 | `CM_LARVA_LUZ` | Larva Luminosa | chão; luz âmbar-esverdeada fraca, mexe devagar |
| 404 | `CM_CASULO` | Casulo | teto |
| 405 | `CM_OSSOS_ANAO` | Ossos de Anão | chão; com um elmo amassado |
| 406 | `CM_POCA_MEL` | Poça de Mel | chão; deixa o herói 40% mais lento |
| 407 | `CM_BOLHA` | Bolha de Resina | chão; luz âmbar fraca |
| 408 | `CM_ASA` | Asa Caída | chão |
| 409 | `CM_LANTERNA_ANA` | Lanterna Anã | chão; luz quente média (câmara de pouso e salões anões) |
| 410 | `CM_COLUNA` | Coluna de Cera | do chão ao teto, regra das colunas |

Ids 411 a 415 ficam livres.

**Paredes de fundo (53 a 57):** `WCM_PEDRA` (pedra anã com cera nas juntas), `WCM_CERA`, `WCM_FAVO` (hexágonos escuros), `WCM_RESINA`, `WCM_REAL`. Bem escuras, sem cor de destaque.

**Terceira camada (36 a 38):** `DP_CM_FAVOS` (favos gigantes ao longe, em camadas), `DP_CM_AMBAR` (paredes de âmbar com sombras de bichos enormes presos), `DP_CM_FORTALEZA` (salões anões afogados em cera, só na Brecha).

## 5. Objetos de cena (`js/162-colmeia-objetos.js`)

28 objetos com `colmeia: true` e o plano `CM_PROP_PLAN` (formato do `AB_PROP_PLAN`: `chao`, `teto`, `fundo`, chance por 10 blocos e máximo por trecho). Nada de objeto de chão sobre Poça de Mel, ovo, escada ou fio.

- **Brecha Tomada:** estátua anã com cera escorrendo (chão + fundo), bigorna anã coberta de cera (chão), barril de hidromel anão rachado (chão), carrinho de minério anão tomado (chão), porta anã selada com cera (fundo + chão), estandarte anão engolido (fundo), runa anã acesa debaixo da cera (fundo, luz azul fraca), lustre anão tomado por casulos (teto).
- **Galerias de Cera:** favo grande caído (chão), pote de mel rachado (chão), monte de cera mastigada (chão), carcaça de operária (chão), mural de favos com larvas acesas (fundo, luz âmbar), favo pendente (teto), gota de mel gigante (teto, animada).
- **Câmaras de Âmbar:** anão preso no âmbar, em pé, de olhos abertos (chão + fundo, luz âmbar), fera das cavernas presa no âmbar (chão + fundo), parede de âmbar com silhueta enorme (fundo, luz fraca), estalactite de resina grande (teto), bolhão de resina (chão, luz), ninho de vespas de papel (teto).
- **Berçário:** ovo grande pulsando (chão, animado), cacho de ovos (chão), casulo de pupa em pé (chão), pilha de cascas de larva (chão), larva gigante morta (chão), poça de geleia real (chão, luz rosada), cacho de casulos (teto).

A Esfera da Rainha não é objeto: é feita de blocos (seção 7).

## 6. Inimigos: os insetos da colmeia (`js/163-colmeia-insetos.js` e `js/164-colmeia-insetos2.js`)

Todos insetos, nenhum morto-vivo, nenhuma aranha. Sem dano de contato genérico (só a correição usa `touch`, porque ela é um tapete de bichos). Linha de visão, busca de caminho, XP baixo na escala dos demônios.

| Tipo | Nome | Papel | Movimento | Ataque (aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `operaria` | Operária | corpo a corpo | anda no chão carregando uma bola de cera; ao ver o herói para e bate as antenas (chama as outras num raio de 12) | as mandíbulas abrem com um estalo e as pontas brilham amarelo; duas mordidas seguidas. Volta para lacrar com Cera Nova os blocos que o herói quebrou | 80 | 18 | Brecha, Galerias, Berçário |
| `soldada` | Soldada Porteira | pesado | anda devagar com a cabeça chata baixa; nos túneis, tampa o túnel inteiro com a cabeça e avança empurrando | de frente leva só 20% do dano; empurra o herói contra a parede (esmaga se ele ficar preso). Ataque: a cabeça sobe e treme (0,8 s), cabeçada que joga 3 blocos; nessa hora a mandíbula fica exposta | 260 | 28 | Brecha, Galerias, Berçário |
| `formigaleao` | Formiga-Leão | emboscada (enterrada) | fica no fundo de um funil de pó de cera no chão; se o herói escapa, cava e muda de funil (um montinho andando) | quem pisa na borda escorrega para o centro; os grãos tremem e as pinças saem do pó (0,6 s) e fecham | 150 | 26 | Galerias, Câmaras |
| `correicao` | Correição | enxame | uma fileira de 12 formigas que corre como um rio pelo chão, paredes e teto, seguindo o herói | a fileira é visível e chia de longe; onde passa por cima do herói morde (toque). Cada golpe mata algumas formigas; a fileira encurta | 60 | 8 | Brecha, Galerias |
| `vespa` | Vespa-Resineira | distância | voa parada no ar, depois dá um tiro reto de 4 blocos para outro ponto, e para de novo | curva o abdômen para a frente e o ferrão brilha âmbar (0,5 s); atira um dardo de resina. 3 dardos em 4 s **encasulam** o herói por 1 s | 56 | 17 | Brecha, Câmaras |
| `parasita` | Vespa-Parasita | voador | voo trêmulo e irregular, sempre a 5 blocos; chega perto só para picar | o abdômen dobra para baixo e o ferrão reluz com um zumbido agudo (0,5 s); a picada põe um **ovo** no herói, que eclode em 5 s (dano dobrado e uma larva) se ele não matar a vespa ou beber poção antes | 48 | 14 | Câmaras, Berçário |
| `zangao` | Zangão | voador pesado | circula alto e devagar nas câmaras grandes; só aparece onde o teto passa de 8 | a sombra dele aparece no chão e o zumbido engrossa (1 s); mergulha, agarra o herói, sobe 4 blocos e solta | 150 | 22 | Câmaras, Berçário |
| `bombardeiro` | Besouro-Bombardeiro | distância curta | anda e para de lado para o herói, nunca de frente | vira de costas, o abdômen incha e fica vermelho (0,7 s); jato fervente em cone de 4 blocos que deixa vapor no ar por 1 s | 120 | 24 | Galerias, Câmaras |
| `cigarra` | Cigarra-Tambor | controle | presa na parede; salta de uma parede para a outra do túnel ou da câmara | o abdômen vibra e anéis visíveis crescem com um chiado subindo (1 s); onda de som em anel que empurra, interrompe golpe e escudo e tira 30 de vigor | 90 | 16 | Brecha, Câmaras |
| `larva` | Larva Faminta | corpo a corpo fraco | rasteja em sanfona; nasce de ovos, favos e da vespa-parasita; vem em grupos de 3 a 5 | ergue a frente e a boca redonda abre com dentes em espiral (0,5 s); pula e gruda, mastigando até levar um golpe. Come o loot do chão e cresce (+50% de vida); devolve o item ao morrer | 36 | 10 | Galerias, Berçário |

**Estados novos no herói** (`js/169-colmeia-estados.js`): **Encasulado** (resina dura em volta: não anda nem ataca por 1 s, apertar A e D alternado solta antes) e **Ovo de Parasita** (um ponto que pulsa no peito, com som de coração pequeno).

**Spawn por faixa:**

| Faixa | Pesos | Máximo |
|---|---|---|
| Brecha Tomada | operaria 4, soldada 2, correicao 2, vespa 3, cigarra 2 | até 8 monstros |
| Galerias de Cera | operaria 4, soldada 2, correicao 3, formigaleao 2, larva 3, bombardeiro 2 | até 9 monstros |
| Câmaras de Âmbar | vespa 3, zangao 2, bombardeiro 2, cigarra 2, formigaleao 2, parasita 2 | até 8 monstros |
| O Berçário | larva 4, parasita 3, zangao 2, soldada 2, operaria 3 | até 10 monstros |

A Formiga-Leão não nasce pelo spawn comum: a geração cava os funis (3 x `WSC` por faixa onde ela aparece) e ela mora lá; o spawn só repõe as mortas. Funil nunca no caminho obrigatório.

## 7. Chefe: A Rainha da Colmeia (`js/166-rainha-colmeia.js`)

**A sala:** a câmara dos ovos, uma **esfera de favos** de 40 x 40 no Berçário, do outro lado do mundo em relação às brechas. Por fora, uma casca de Quitina de 2 blocos. Por dentro, dois anéis de Favo Real (raio 9 a 11 e 14 a 16) separados por galerias curvas de 2 a 3 de altura, com saliências de favo a cada 3 fileiras para subir pelos lados. No centro, um oco de raio 6 onde a Rainha está presa à massa de favos pelo abdômen. Duas aberturas na casca (esquerda e direita, na altura do centro) dão nas galerias reais. A esfera não tem chão reto: a luta é toda em curva.

**Números (nível 21):** vida 330 x (1 + 0,3 x 20) = **2310**; dano 9 x (1 + 0,2 x 20) = **45**.

**Como a sala muda a luta:** os favos são escudo e ninho ao mesmo tempo. Para chegar nela o herói quebra Favo Real (2 golpes): 40% dos favos soltam uma larva, os outros só abrem caminho. Ele escolhe por onde cavar, e cada atalho custa larvas. Os favos de mel que ele quebra pingam e a esfera vai ficando mais aberta a cada fase.

- **Fase 1 (100% a 60%), a Rainha presa.** Ela não se move, só gira a cabeça. **Cântico:** o abdômen acende em ondas e um anel de luz sai dela (1,2 s); os favos intactos num raio de 6 do herói soltam larvas. **Cuspe de geleia:** a garganta incha rosada (0,6 s); três bolas de geleia real em leque pelas aberturas dos anéis (60% do dano). **Ferroada curta:** se o herói chega ao oco, o ferrão recua e pinga (0,8 s) e estoca em linha (100%).
- **Fase 2 (60%), ela se solta.** O abdômen se rompe e fica no oco como um saco de ovos que põe um Ovo Colado na parede interna a cada 4 s (eclode em 6 s; o saco tem 15% da vida dela e morre com 3 golpes fortes). Ela voa pela esfera. **Investida que rasga favos:** recua, as asas viram borrão e uma linha de poeira marca o caminho (1 s); atravessa a esfera em reta e destrói todo Favo Real no caminho (90%). **Guarda real:** uma vez na fase, o Lacre se abre um instante e entram 2 Soldadas.
- **Fase 3 (25%), a esfera se abre.** Ela arranca o que sobrou dos anéis; a esfera vira uma bolha oca com saliências soltas. **Leque de ferrões:** ergue o abdômen pulsando (0,7 s); 5 ferrões em leque (50% cada). **Voo em espiral:** gira colada na parede interna e pinga mel fervente; cada gota tem uma marca dourada onde vai cair (0,6 s, 40%). **Grito real:** asas abertas e um tremor (1,5 s); todos os ovos ainda na parede eclodem de uma vez.

**Lacre e reinício:** ao entrar no oco ou acertar a Rainha, o Lacre Real (`CM_LACRE`) cresce nas duas aberturas. Sair (portal, teleporte) ou morrer reinicia: a esfera é refeita a partir da semente (anéis, saliências e oco), as larvas e ovos somem e ela volta presa com a vida cheia. Blocos da esfera não quebram com picareta fora da luta.

**Lendário único: Ferrão Real** (adaga, nível 21). Cada acerto põe uma dose de veneno da colmeia no inimigo (até 5). Na quinta dose o veneno estoura e causa 150% do golpe. Lâmina cor de mel com luz âmbar fraca. A morte fica salva em `rainha.dead`.

## 8. Loot e economia

**Metal: Ambrita** (`js/167-ambrita.js`). `min_ambrita` -> `barra_ambrita`, **7 minérios por barra**. Nível da forja **16**. A bigorna ganha as 9 peças de ambrita: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Cor de mel translúcido com miolo mais escuro; o peitoral de ambrita dá luz 1 (o mel brilha). O minério só cai dos insetos desta camada e das de baixo.

**Materiais:**

| Item | De onde | Quem compra |
|---|---|---|
| `cera_bruta` | operárias, blocos de cera | Grimaldo (molde de fundição) |
| `mel_escuro` | Favo de Mel, larvas | Odo (cozinha) e Marta |
| `geleia_real` | larvas grandes, saco de ovos da Rainha | Marta (poção forte) e Aurélia |
| `ferrao` | vespas, zangões | Grimaldo |
| `ambar_fossil` | bloco Âmbar com Fóssil | Grimaldo, caro (pedra rara como o cristal) |

**Bases temáticas** (nível 18, só caem aqui, como drop raro de monstro):
- **Lança-Ferrão** (lança), da Vespa-Resineira e do Zangão, 1,5%: estocada longa, +crítico.
- **Escudo de Favo** (escudo), da Soldada Porteira, 2%: aparo largo, leve.
- **Elmo de Âmbar** (elmo), da Cigarra-Tambor e da Operária, 1%: luz 1, um mosquito preso dentro.

A Rainha solta uma das três garantida na primeira morte, além do Ferrão Real. Sem baús na camada.

**Itens de bloco:** Cera Velha, Cera Nova, Favo, Resina, Âmbar (bloco translúcido que deixa passar luz, bom para janela), Cera Real. O ancião ganha 3 missões (mel escuro, ferrões, um âmbar com fóssil).

## 9. Luz e atmosfera

Escura, mas morna. A luz vem do âmbar (passa a luz e brilha fraco, `EMIT` 0,18), das larvas luminosas, dos murais de favo e das bolhas de resina: tudo âmbar, mel e um verde de larva. As lanternas anãs da Brecha são a única luz branca-quente e somem ao descer. Nenhuma fonte forte: o herói vê pouco à frente nas curvas, e é isso que dá medo. Partículas: pó de cera boiando devagar, gotas de mel caindo do teto, escamas de asa brilhando quando um voador passa, vapor na frente do bombardeiro.

## 10. Som (`js/97-ambiente.js`, cenário `colmeia`)

Sem melodia. **Leito:** zumbido grave contínuo (ruído marrom num filtro estreito entre 110 e 180 Hz, com o volume batendo de 6 a 9 vezes por segundo, como asas), mais uma "respiração" lenta da colmeia (filtro que abre e fecha a cada 7 s). **Eco curto e abafado** (0,4 s, bem amortecido): o som não vai longe, o lugar fecha em volta. **Eventos:** patinhas correndo dentro da parede (passa de um lado ao outro), cera estalando, plop grosso de mel, larva mastigando, um zumbido que cruza a tela e some. **Por faixa:** a Brecha tem pedra rangendo e uma corrente anã batendo longe; as Câmaras, estalos de resina endurecendo; o Berçário, um pulsar lento e úmido (os ovos) e o zumbido mais alto. Na esfera, o zumbido da Rainha cobre tudo.

## 11. Interface e progressão

| Zona | Nome | Subtítulo | Cor no mapa |
|---|---|---|---|
| 41 | Brecha Tomada | onde a cera engoliu a pedra | `#8a7448` |
| 42 | Galerias de Cera | as paredes trabalham | `#b08a3a` |
| 43 | Câmaras de Âmbar | o que entra não sai | `#a8541c` |
| 44 | O Berçário | algo bate dentro dos ovos | `#c08868` |

Nenhum texto de dica: o encasulado e o ovo se explicam pela arte e pelo som. A barra da vida da Rainha aparece como nos outros chefes.

## 12. Arte (paletas, 6 tons do escuro ao claro)

| Material | Rampa |
|---|---|
| Cera Velha | `#2a1c0c` `#4a3416` `#6e5022` `#94702e` `#b8923e` `#d8b45a` |
| Cera Nova | `#5a4618` `#8a6e28` `#b8963a` `#d8b850` `#ecd27a` `#fae8a8` |
| Favo e Mel | `#3a1e04` `#6a3a08` `#a0600e` `#d08a1a` `#f0b030` `#ffd870` |
| Resina | `#1e0a06` `#3e160a` `#64260e` `#8a3c14` `#b05a1e` `#d07e34` |
| Âmbar | `#4a2006` `#7a3a0a` `#b0600e` `#d88a1c` `#f4b03a` `#ffd878` |
| Cera Real | `#3a2018` `#64382a` `#8e5a40` `#b8825a` `#dcae80` `#f4d6a8` |
| Quitina | `#0c120e` `#1a2620` `#2a3e32` `#3e5a48` `#5a7e64` `#8aac8e` |
| Ambrita | `#4a2a08` `#7a4a10` `#b0761c` `#dca032` `#f6c856` `#fff0a8` |

Insetos: carapaças escuras com bordas de luz âmbar vinda das paredes, asas com 2 tons translúcidos e um brilho fino. Larvas cor de cera-real, quase sem contorno. A Rainha: corpo de quitina escura, abdômen enorme cor de mel com veias de luz, coroa de antenas.

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/160-colmeia-api.js` | ids, `CM_BANDS`, `CM_D = 186`, `CM_ZONE0 = 41`, `colmeiaBand`, `cmExits`, `cmBoss`. `COLMEIA = false` desliga a camada |
| `js/161-colmeia-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, Escada de Favos e Fio de Cera escaláveis, Poça de Mel |
| `js/162-colmeia-objetos.js` | 28 objetos e `CM_PROP_PLAN` |
| `js/163-colmeia-insetos.js` | operária, soldada, formiga-leão, correição, larva |
| `js/164-colmeia-insetos2.js` | vespa, parasita, zangão, bombardeiro, cigarra |
| `js/165-colmeia-mundo.js` | geração em passos, brechas, escorredouros, funis, zonas, spawn, nível, partículas, loja, missões |
| `js/166-rainha-colmeia.js` | a esfera, a luta, o Ferrão Real |
| `js/167-ambrita.js` | o metal na forja |
| `js/168-colmeia-save.js` | `gen`, `rainha.dead`, blocos lacrados pelas operárias |
| `js/169-colmeia-estados.js` | encasulado, ovo de parasita, blocos que soltam larva, operária que lacra |

## Sistemas novos

1. **Blocos que soltam monstro** (`CM_OVO`, `CM_FAVO_REAL`). Um vetor `HATCH[id]` com a chance e o tipo. Quando `breakTile` quebra um desses, chama `spawnEnemy('larva', ...)` no lugar. Não conta no limite de spawn da faixa, mas cada bloco solta no máximo uma larva. Fora da Colmeia o vetor está vazio, então nada muda.
2. **Operária que lacra.** O jogo guarda os blocos que o herói quebrou nesta camada nos últimos 60 s. Uma operária que vê um deles anda até lá e põe Cera Nova (passa por `setTile`, entra nos `diffs` e no save). Nunca lacra o bloco onde o herói está nem os 8 em volta, nunca escada, fio ou a esfera. É o que faz a colmeia parecer viva.
3. **Encasulado e Ovo de Parasita.** Dois estados no herói, como o lento e o tonto que já existem: um contador em `pl` e um desenho por cima do herói. Poção e morte limpam os dois.

## Decisões em aberto

1. **A operária desfazer o que o herói cava pode irritar.** Recomendo manter, com o limite de 60 s e a regra dos 8 blocos em volta: incomoda só quem tenta furar atalho no meio da briga.
2. **A larva come o loot do chão.** Recomendo manter, mas ela sempre devolve o item ao morrer: é só pressa, nunca perda.
3. **Altura máxima de 12 nos túneis.** Pode ficar apertado demais para o zangão e para o montante. Recomendo manter os 12 e deixar o zangão só nas Câmaras e no Berçário, como está na tabela.
