# O Reino Élfico: ficha de implementação

A décima primeira camada, debaixo da Nave Caída e em cima do Abismo, de 1860 a 2046 m. Pedido do Jonathan (2026-10-11): "um novo bioma de elfos, inspiração Senhor dos Anéis e Warcraft". Monstros de nível 23 a 24, metal novo Lunarita, chefe A Dama do Espelho (nível 25).

**O que a diferencia:** é a camada mais **bonita e mais calma de olhar** do jogo, e a mais perigosa de se distrair. Todas as outras são feitas de coisas mortas, quebradas ou monstruosas; aqui o que há é um reino que ainda funciona, com árvores de prata vivas, salões lavrados, lanternas acesas e água que brilha, guardado por quem não quer ninguém lá. A Nave de cima é neon, metal e barulho; o Abismo de baixo é fogo; o Reino Élfico é prata, azul-lua, folha e silêncio. Descendo, a beleza apodrece: a corte que bebeu do poço proibido virou carmesim e ouro, e no fundo a Dama ainda olha o espelho.

## 1. Identidade

- **Faixas:** A Mata de Prata, Os Salões do Rei, A Corte Desterrada, O Poço da Lua.
- **Conceito:** quando o sol dos homens subiu, os Filhos da Lua desceram para debaixo da terra levando um pedaço da lua: a **Lua Presa**, uma esfera de luz fria presa nas raízes da Árvore-Mãe. Debaixo dela plantaram uma mata de prata e lavraram salões na pedra. A Dama, que guardava o Espelho da Lua, olhou demais para dentro dele. Uma parte da corte foi atrás dela e bebeu do poço: viraram os Desterrados, carmesim e ouro, famintos de magia. Os outros ainda guardam a mata e os salões, e para eles o herói é só mais um invasor. Ninguém passa.
- **Sensação:** encanto e vigilância. Tudo é lindo e está escutando. Uma flecha sem dono, um vulto que some entre as folhas, uma luz que segue o herói.
- **Referências:** Senhor dos Anéis (Lothlórien e os flets nas árvores, os salões de Thranduil na floresta, as pontes sem corrimão de Valfenda, a tentação de Galadriel no espelho, os Mortos), Warcraft (as Sentinelas e o glaive, os sabres-da-noite, os fogos-fátuos, os Antigos, os hipogrifos, os poços da lua, a Árvore do Mundo, os elfos sangrentos e os caçadores de demônios vendados).

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 53 | A Mata de Prata | 1860 a 1906 | Solo Élfico, Madeira Prateada, Folhagem Lunar; o Metal do Reator da Nave afinando no topo | clareiras enormes com árvores de prata do chão ao teto, a copa azul-prata no teto, flets (plataformas de tábua) em volta dos troncos com escadas de corda, lanternas élficas penduradas, flores-da-lua e vaga-lumes |
| 54 | Os Salões do Rei | 1906 a 1958 | Mármore-Lua, Pedra Lavrada | salões lavrados com abóbada, colunas de raiz do chão ao teto, abismos com pontes de tábua sem corrimão, escadarias, flâmulas prata e azul |
| 55 | A Corte Desterrada | 1958 a 2010 | Mármore Profanado, Madeira Morta, Cristal de Mana Sangrenta | os mesmos salões em ruína, teto caído, árvores mortas e retorcidas, espinheiros, flâmulas carmesim e ouro, cristais vermelhos acesos |
| 56 | O Poço da Lua | 2010 a 2046 | Pedra-do-Poço, Raiz-Mãe, Cristal Lunar | grutas redondas com poços de água que brilha, as raízes da Árvore-Mãe atravessando tudo, o Espelho da Lua e as duas Raízes Fundas para o Abismo |

- **Monstros:** nível 23 na metade de cima e 24 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, nunca passando de 24 (`layerLvl(layerLo('elfos'), d)`).
- **Entrada:** as duas descidas continuam os dois Rasgos no Casco da Nave (`nvExits`). O casco acaba onde a terra fica escura e cheirosa: o poço de 3 vira um **poço de raízes**, com a **Escada de Corda** élfica (`EL_ESCADA`) inteira, até o **Posto de Guarda**.
- **Câmara de pouso:** ao pé de cada escada, um **Posto de Guarda** de 12 x 6: piso de tábua, paredes de madeira prateada, duas lanternas élficas acesas, sem monstro. Reservado para os pontos de volta.
- **Saída:** duas **Raízes Fundas** no chão do Poço da Lua, a pelo menos `WW / 3` uma da outra e longe do Espelho: poços onde uma raiz da Árvore-Mãe desce para beber do fogo de baixo, a casca queimada nas bordas, com a Escada de Corda até a última fileira. As posições ficam em `elExits` ({ x0, x1, cx, w: 3, fy, top }); o Abismo continua de lá (o 103 lê como `halls`).

## 3. Estrutura e geração (`js/255-elfos-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo que é "por mundo" multiplica por `WSC`.

1. **Rocha por faixa.** O Metal do Reator da Nave afina por ruído nas últimas 10 fileiras de cima e vira Solo Élfico. A Mata é Solo Élfico com bolsões de Mármore-Lua; os Salões são Mármore-Lua com veios de Pedra Lavrada; a Corte é Mármore Profanado com bolsões de Madeira Morta; o Poço é Pedra-do-Poço. Bordas por ruído.
2. **Salas por faixa:**

| Faixa | Espaços | Tamanho | Quantos |
|---|---|---|---|
| Mata | clareiras: elipses largas e altas; 1 a 3 árvores de prata (tronco de 3 do chão ao teto, raízes abertas no pé, a copa de folhagem colada no teto) com flets de tábua em volta e escada de corda | 34 a 56 x 14 a 20 | 5 x `WSC` |
| Mata | grotas de folha (autômato esparso), com folhas caídas e samambaias | 10 a 18 x 6 a 9 | 6 x `WSC` |
| Salões | salões lavrados: retângulo com abóbada em arco, colunas de raiz a cada 8 | 28 a 44 x 10 a 14 | 5 x `WSC` |
| Salões | abismos com ponte: salas altas e estreitas, uma ponte de tábua de 1 bloco atravessando a meia altura, sem corrimão | 18 a 26 x 16 a 22 | 2 x `WSC` |
| Salões | galerias: corredores retos de 5 de altura, piso de pedra lavrada | 30 a 70 de comprimento | 6 x `WSC` |
| Corte | salões em ruína (os dos Salões, com o teto caído em montes de entulho e buracos) | 24 a 40 x 9 a 13 | 5 x `WSC` |
| Corte | bosques mortos: clareiras com árvores de madeira morta retorcidas, sem copa, espinheiros | 26 a 40 x 12 a 16 | 3 x `WSC` |
| Poço | grutas da lua: redondas, um poço de água no fundo (água de verdade, 171), cristais lunares nas paredes | 18 a 28 x 12 a 16 | 5 x `WSC` |
| Poço | o Espelho da Lua (seção 7) | 64 x 26 | 1 |

3. **Ligações.** Na Mata, túneis de raiz (minhoca larga). Nos Salões e na Corte, galerias retas e escadarias (degraus de 1 a cada 2). Entre faixas, **escadarias** e poços com escada de corda; em todo desnível de 5 ou mais, Escada de Corda ou Cipó Prateado (`EL_CIPO`).
4. **Estragos.** Na Corte, 35% dos salões têm o teto caído (montes de Mármore Profanado e entulho); espinheiros (`EL_ESPINHO`) no chão dos bosques mortos (arranham: dano leve ao atravessar), nunca nos degraus de subida, nunca no Espelho nem no pouso.
5. **Minérios.** Carvão (`EL_O_CARVAO`) no Solo Élfico e na Madeira Morta, 28 veios x `WSC`. Lunarita (`EL_O_LUNARITA`) no Mármore-Lua, no Mármore Profanado e na Pedra-do-Poço, 26 veios x `WSC`, metade nos Salões e no Poço.
6. **Alcance** a partir dos dois Postos de Guarda; `elClimbFix` saindo do Espelho, de cada salão, de cada gruta da lua e do pé das Raízes Fundas.
7. **Decoração de 1 bloco**, depois **correção estrutural** (colunas de raiz do chão ao teto), depois **objetos** (`EL_PROP_PLAN`).

## 4. Blocos (`js/251-elfos-blocos.js`)

Ids 672 a 703 (`NT` sobe de 672 para 704). Sólidos:

| Id | Constante | Nome | Uso | Solta | Luz |
|---|---|---|---|---|---|
| 672 | `EL_SOLO` | Solo Élfico | massa da Mata; terra escura e fofa com fios de raiz prateada | solo_elfico | |
| 673 | `EL_MADEIRA` | Madeira Prateada | troncos das árvores de prata; casca cinza-prata lisa, nós, veios claros | madeira_prata | |
| 674 | `EL_FOLHAGEM` | Folhagem Lunar | a copa no teto das clareiras; folhas azul-prata em camadas, pontos de brilho | folha_prata | fraca, azul |
| 675 | `EL_MARMORE` | Mármore-Lua | massa dos Salões; branco-azulado com veios de prata | marmore_lua | |
| 676 | `EL_LAVRADA` | Pedra Lavrada | paredes e pisos dos salões; blocos com folhas e ramos em relevo e um filete de prata | pedra_lavrada | |
| 677 | `EL_TABUA` | Tábua Élfica | flets, pontes e pisos; tábuas curvas de madeira clara com as juntas em folha | tabua_elfica | |
| 678 | `EL_PROFANO` | Mármore Profanado | massa da Corte; mármore rachado, manchado de vinho, veios de ouro velho | marmore_profano | |
| 679 | `EL_MORTA` | Madeira Morta | troncos dos bosques mortos; preta, retorcida, a seiva carmesim nas rachaduras | madeira_morta | |
| 680 | `EL_CRISTAL_SANGUE` | Cristal de Mana Sangrenta | cachos na Corte; prismas carmesim | nada | média, vermelha |
| 681 | `EL_PEDRA_POCO` | Pedra-do-Poço | massa do Poço; azul-petróleo funda, runas de lua gravadas que brilham fraco | pedra_poco | fraca, azul |
| 682 | `EL_RAIZ` | Raiz-Mãe | raízes da Árvore-Mãe atravessando o Poço; casca prateada com a seiva azul acesa nos sulcos | raiz_mae | fraca, azul |
| 683 | `EL_CRISTAL_LUA` | Cristal Lunar | cachos no Poço; prismas branco-azulados | nada | média, azul-branca |
| 684 | `EL_ESPELHO` | Espelho d'Água | o chão do Espelho da Lua: água parada e lisa que reflete; firme; não quebra | nada | fraca |
| 685 | `EL_BARREIRA` | Véu de Luar | portas do Espelho (só na luta; não quebra) | nada | média, prata |
| 686 | `EL_O_CARVAO` | Veio de Carvão | no solo e na madeira morta | carvao | |
| 687 | `EL_O_LUNARITA` | Veio de Lunarita | no mármore e na pedra-do-poço; lascas branco-azuladas em crescente que brilham | min_lunarita | fraca, azul |
| 703 | `EL_LUA` | A Lua Presa | a esfera de luz do Espelho; sólida, não quebra | nada | forte, prata |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 688 | `EL_ESCADA` | Escada de Corda | parede; escala; degraus de tábua clara em cordas prateadas |
| 689 | `EL_CIPO` | Cipó Prateado | teto; escala como a corrente; folhinhas azuis |
| 690 | `EL_LANTERNA` | Lanterna Élfica | teto; a gaiola em gota de prata com a chama azul-branca; luz forte |
| 691 | `EL_FLOR` | Flor-da-Lua | chão; pétalas brancas que abrem e fecham devagar, luz azul fraca |
| 692 | `EL_SAMAMBAIA` | Samambaia Prateada | chão |
| 693 | `EL_RUNA` | Pedra Rúnica | chão; pedrinha com a runa acesa (luz azul) |
| 694 | `EL_BRASEIRO` | Braseiro Lunar | chão; bacia de prata com o fogo azul-frio (luz forte) |
| 695 | `EL_ESPINHO` | Espinheiro Profanado | chão; arbusto preto de espinhos com bagas carmesim; arranha quem atravessa |
| 696 | `EL_FLAMULA` | Flâmula | teto; prata e azul nos Salões, carmesim e ouro na Corte |
| 697 | `EL_ORVALHO` | Orvalho de Lua | teto; a gota de luz cai ao vivo |
| 698 | `EL_COLUNA` | Coluna de Raiz | do chão ao teto (raízes trançadas lavradas) |
| 699 | `EL_FOLHAS` | Folhas Caídas | chão; folhas de prata secas |
| 700 | `EL_VAGALUME` | Vaga-lumes | no ar, encostado na parede; os pontinhos voam ao vivo |
| 701 | `EL_COGUMELO` | Cogumelo-de-luar | chão ou parede; chapéu azul-pálido que brilha (Poço) |
| 702 | `EL_CRISTALINHO` | Lasca de Cristal | chão; cristal lunar pequeno (luz azul) |

Paredes de fundo (93 a 97): Terra e Raízes (`WEL_MATA`), Painel Lavrado (`WEL_SALAO`), Ruína Profanada (`WEL_PROFANO`), Pedra-do-Poço com runas (`WEL_POCO`), Cortina de Folhas (`WEL_FOLHAS`, a copa escura por trás). Terceira camada (60 a 62): a **mata ao longe** (troncos de prata enormes e a Lua Presa entre eles), os **salões ao longe** (arcos, pontes e torres finas de pedra branca), as **raízes da Árvore-Mãe** (troncos de raiz descendo no escuro azul).

## 5. Objetos de cena (`js/252-elfos-objetos.js`)

30 objetos com `elfos: true` e o plano `EL_PROP_PLAN` (formato do `NV_PROP_PLAN`: por faixa `mata`, `saloes`, `corte`, `poco`, listas `chao`, `teto`, `fundo`). Flags de sala: `clareira`, `salao`, `ruina`, `gruta`.

- **A Mata de Prata:** escultura de cervo branco (chão), pedra de vigia com o olho élfico (chão), harpa abandonada (chão), arco e aljava pendurados num gancho (fundo), lanterna de pé alta (chão, luz), banco de raiz (chão), casa de flet pendurada (teto: um quartinho de tábua com telhado de folha), guirlanda de flores-da-lua (teto, luz).
- **Os Salões do Rei:** estátua de rei élfico com a espada apontada para baixo (chão + fundo, a dos Argonath), armadura élfica num cabide (chão), estante de pergaminhos (chão), fonte de prata (chão, animada), tapeçaria da lua (fundo), lustre de galhos com velas azuis (teto, luz), vitral de folha (fundo, luz), mesa longa com cálices (chão).
- **A Corte Desterrada:** estátua de rei quebrada, a cabeça no chão (chão), altar de mana sangrenta com o cristal girando (chão, luz vermelha, animado), gaiola de magíster pendurada (teto), tapeçaria rasgada carmesim e ouro (fundo), árvore morta pequena (chão), trono? não: mesa de alquimia derrubada (chão), braseiro vil de fogo carmesim (chão, luz).
- **O Poço da Lua:** poço da lua de pedra (chão, a água acesa, animado), estátua da Dama coberta de musgo (chão + fundo), arco de raízes (fundo), cristal lunar grande (chão, luz), lanterna flutuante (teto: uma luz numa gota de vidro, sobe e desce), raiz-mãe grossa atravessando a parede (fundo).

## 6. Inimigos: o Reino e os Desterrados (`js/253-elfos-bichos.js` e `js/254-elfos-bichos2.js`)

Família nova (ninguém no jogo é élfico). Sem dano de contato genérico: só os Fogos-Fátuos usam `touch` (eles se detonam encostando). Linha de visão, busca de caminho, XP baixo. Os golpes têm aviso claro: prata e azul nos guardiões do Reino, carmesim e ouro nos Desterrados.

| Tipo | Nome | Papel | Movimento | Ataque (aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `sentinela` | Sentinela da Lua | corpo a corpo e arremesso | a guerreira élfica de capuz e armadura prateada, rápida, salta para trás depois de golpear | o glaive de três lâminas acende azul na mão (0,5 s); corte duplo. De 4 a 9 blocos, **arremessa o glaive**: ele vai girando em linha e **volta** para a mão (acerta na ida e na volta) | 90 | 20 | Mata, Salões |
| `arqueiro` | Arqueiro da Mata | distância | o arqueiro élfico de manto verde-prata, prefere ficar no alto (flets, pontes); mantém 9 blocos | puxa a corda e a ponta da flecha brilha (0,7 s); **três flechas em leque** em arco. Quando o herói chega perto, salta para trás e para cima | 70 | 22 | Mata, Salões, Corte |
| `sabre` | Sabre-da-Noite | emboscada | a pantera élfica violeta-escura de presas longas; fica **invisível** (só um tremor no ar) enquanto espreita | reaparece agachada, os olhos acendem (0,5 s); **bote** longo em arco com garras. Depois some de novo | 140 | 26 | Mata, Poço |
| `fatuo` | Fogo-Fátuo | enxame | luzinhas azul-prata que boiam em grupos de 3 a 5, giram em volta do herói | o grupo para e as luzes incham (0,6 s); cada uma **se lança e detona** no herói (por toque) e **suga 6 de mana** | 26 | 10 | Mata, Poço |
| `antigo` | Antigo da Mata | pesado | a árvore viva de casca prateada, braços de galho, olhos de seiva azul; lenta | bate o pé e o chão racha em linha até o herói (1 s): **raízes rompem** do chão sob o herói (dano e **enraizado** 1,2 s). Perto, um tapa de galho que empurra longe | 320 | 32 | Mata, Corte |
| `hipogrifo` | Hipogrifo | voador, mergulho | o meio-águia meio-cavalo de penas brancas e azuis; voa alto em círculos | grita e se encolhe no ar (0,6 s); **mergulho** em linha até o herói, e sobe de novo | 120 | 25 | Salões, Poço |
| `guardiao` | Guardião do Salão | tanque | o guarda do rei, armadura completa de folhas de prata, escudo alto e lança; anda devagar | o escudo levanta: **bloqueia tudo pela frente** (só leva dano por trás ou de cima). A ponta da lança brilha (0,6 s): **estocada longa**; a cada 3, **investida de escudo** que empurra o herói | 220 | 27 | Salões, Corte |
| `espectro` | Espectro Élfico | assombração | a elfa morta, translúcida, cabelos boiando; atravessa paredes e voa devagar | abre a boca e a luz em volta treme (1 s): **lamento** em anel; quem é pego fica **silenciado** 3 s (não lança magia nem bebe poção) e leva dano | 90 | 21 | Salões, Corte, Poço |
| `magister` | Magíster Sangrento | conjurador | o mago élfico desterrado de manto carmesim e ouro, com três orbes verdes girando em volta; mantém distância | as orbes param e acendem (0,8 s); **dispara as três orbes** que perseguem o herói devagar. Quando o herói chega perto, **pisca** (teleporte curto, um estalo dourado) | 100 | 24 | Corte, Poço |
| `cacador` | Caçador Vendado | investida | o elfo desterrado de olhos vendados e tatuagens que brilham, duas lâminas curvas; anda pulando | as tatuagens acendem e ele se agacha (0,5 s); **avança** em linha reta atravessando o herói, deixando um **rastro de fogo vil** no chão que queima por 2 s; cai planando com asas de sombra | 130 | 28 | Corte, Poço |

**Estados novos no herói** (`js/259-elfos-estados.js`): **Enraizado** (raízes nos pés; não anda nem pula, ainda ataca; 1,2 s), **Silenciado** (um selo prateado acima da cabeça; não lança magia nem bebe poção; 3 s), **Enfeitiçado** (só o chefe: o herói é puxado devagar para a Dama; andar para longe vence o puxão pela metade).

**Spawn por faixa:**

| Faixa | Pesos | Máximo |
|---|---|---|
| A Mata de Prata | sentinela 4, arqueiro 3, sabre 2, fatuo 3, antigo 2 | até 8 monstros |
| Os Salões do Rei | sentinela 3, arqueiro 3, guardiao 3, hipogrifo 2, espectro 2 | até 9 monstros |
| A Corte Desterrada | guardiao 2, espectro 3, magister 3, cacador 3, antigo 2, arqueiro 2 | até 9 monstros |
| O Poço da Lua | fatuo 3, sabre 2, hipogrifo 2, magister 2, cacador 3, espectro 2 | até 10 monstros |

## 7. Chefe: A Dama do Espelho (`js/256-dama-espelho.js`)

**A sala: O Espelho da Lua.** Uma gruta larga (64 x 26) no Poço, do outro lado do mundo em relação às descidas, debaixo das raízes da Árvore-Mãe. O teto é um emaranhado de Raiz-Mãe. No meio, a 7 blocos do teto, pendurada nas raízes, a **Lua Presa** (`EL_LUA`, um disco sólido de raio 3, a luz mais forte da camada). O chão é o **Espelho d'Água** (`EL_ESPELHO`): uma lâmina parada que reflete a sala de cabeça para baixo. Plataformas de raiz (`EL_RAIZ`) dos lados, em 3 alturas alternadas, e duas portas nas pontas, na altura do chão.

**Números (nível 25):** vida 360 x (1 + 0,3 x 24) = **2952**; dano 9 x (1 + 0,2 x 24) = **52**.

**Como a sala muda a luta:** a Dama paira sobre o espelho e o reflexo dela aparece no chão. A Lua é a única luz forte: quando ela escurece, só a tocha do herói ilumina.

- **Fase 1 (100% a 60%), a Dama da Luz.** Branca e dourada, linda. **Raio da Lua:** um círculo prateado marca o chão (0,8 s) e um pilar de luz cai ali (70%). **Lâminas de Luz:** ela abre os braços (0,6 s) e solta 3 crescentes em leque (50% cada). **Deslize:** some num brilho e aparece em outra plataforma.
- **Fase 2 (60%), a Tentação.** A Dama cresce, a pele vira cinza-azulada, os olhos brancos, o vestido escurece; a Lua Presa fica **vermelha**. Duas **Sentinelas Sombrias** (as Sentinelas da Lua, translúcidas) saem das portas uma vez. **Encantamento:** ela estende a mão e anéis prateados vêm até o herói (1 s): **enfeitiçado** 2,5 s (puxado para ela). **Espinhos de Raiz:** sombras marcam o chão (0,7 s) e raízes pontudas descem do teto ali (60%).
- **Fase 3 (30%), o Reflexo.** O espelho acorda: o **reflexo** da Dama sobe do chão do outro lado da sala (espelhado no meio da sala) e repete tudo o que ela faz, do lado de lá; não leva dano e some quando ela morre. A cada 12 s a Lua **apaga** por 3 s (eclipse): só a tocha do herói.

**Barreira e reinício:** ao entrar na gruta, o Véu de Luar (`EL_BARREIRA`) fecha as duas portas. Sair (portal, teleporte) ou morrer reinicia: as raízes somem, a Lua volta branca, as Sentinelas Sombrias e o reflexo somem e a Dama volta com a vida cheia. Os blocos da sala não quebram fora da luta.

**Lendário único: Lágrima da Lua** (lança, nível 25). Cada golpe tem 30% de chamar um raio de lua fino sobre o alvo (50% do golpe). A ponta é prata clara com uma gota azul acesa, luz 1. A morte fica salva em `damaEspelho.dead`.

## 8. Metal, materiais e bases (`js/257-lunarita.js`)

- **Lunarita:** o metal da camada. Lascas branco-azuladas em crescente dentro do mármore, que brilham fraco. **8 minérios por barra** (a regra do 00-geral: 8 do dracônio em diante). Nível de forja `layerForgeIl('elfos')` = **21**; o peitoral dá luz 1.
- **Materiais:** folha de prata (Antigo, Sentinela; Marta), pena de hipogrifo (Hipogrifo; Aurélia), essência fátua (Fogo-Fátuo; Aurélia), presa de sabre (Sabre; Grimaldo), cristal sangrento (Magíster, Caçador; Aurélia paga caro), lágrima de espectro (Espectro; Marta).
- **Bases que só caem aqui** (no nível do primeiro monstro, 23): **Glaive Lunar** (lança, a da Sentinela), **Escudo de Folha** (escudo, o do Guardião), **Elmo Alado** (cabeça, das Sentinelas e Guardiões).

## 9. Som, save, vizinhos

- **Som** (97): a Mata com vento nas folhas, um sininho de vidro longe, corujas; os Salões com eco de pedra e água correndo; a Corte com um zumbido de cristal e brasas; o Poço com gotas e o zumbido grave da Lua. Sem melodia.
- **Save** (`js/258-elfos-save.js`): mundos de antes da camada são refeitos (wg 17); nível, itens, ouro e o baú da vila continuam.
- **O Abismo** desce para 2046 a 2232 m (12ª posição: monstros 25 a 26, chefe 27, infernita forja 23) e a Escuridão para 2232 a 2418 m. `WH` sobe de 2318 para 2504.

## 10. Decisões (tomadas pela opção recomendada, "me surpreenda")

- **Nome e lugar:** "O Reino Élfico", 11ª camada, entre a Nave e o Abismo, como a Nave entrou entre a Colmeia e o Abismo.
- **Elfos do bem ou do mal?** Os dois: os do Reino (prata e azul) guardam e atacam invasores; os Desterrados (carmesim e ouro) são os corrompidos. Nenhum elfo é amigável (não há NPC novo).
- **Chefe:** a Dama do Espelho (a tentação de Galadriel + o poço da lua de Warcraft), numa gruta com espelho d'água e a lua presa, sem trono.
- **Metal:** Lunarita (o mithril continua só dos anões).
- **Água:** os poços das grutas da lua usam a água de verdade (171), rasos; o espelho do chefe é bloco firme, para a luta não virar nado.
