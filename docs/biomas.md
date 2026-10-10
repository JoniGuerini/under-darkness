# Biomas de Under Darkness

Documento para ler e validar. O que já existe no jogo são as Cavernas (parte 2), a Catedral (parte 3), as Cavernas de Gelo (parte 4) e a Mina Abandonada (parte 5); o resto é ideia.

- Parte 1: o que é um bioma e a ficha com todas as variáveis.
- Parte 2: a primeira camada, As Cavernas (existe).
- Parte 3: a segunda camada, a Catedral Abandonada (existe), com tudo que tem nela.
- Parte 4: a terceira camada, As Cavernas de Gelo (existe).
- Parte 5: a quarta camada, A Mina Abandonada (existe).
- Parte 6: ideia de bioma novo, as Minas Fúngicas, na mesma ficha.
- Parte 7: outras ideias soltas, só o conceito.

As regras técnicas de geração (apoio dos objetos, janelas, colunas, entrada, ordem e testes) continuam em [regras-de-bioma.md](regras-de-bioma.md). Este documento não repete essas regras; ele diz **o que** um bioma tem, e aquele diz **como** gerar sem erro.

Para marcar a validação, troque `[ ]` por `[x]` (aprovado) ou `[-]` (remover) em cada item.

---

# Parte 1. O que é um bioma

Um bioma é **um pedaço do mundo com identidade própria**: o jogador entra, percebe na hora que mudou de lugar (pela pedra, pela luz, pelo som, pelos monstros) e encontra ali desafios e recompensas que não existem em outro canto.

Na prática, quando pedirmos "vamos fazer um bioma novo", isso significa preencher **todas** as seções da ficha abaixo. Se uma seção ficar vazia, o bioma fica com cara de remendo (por exemplo, blocos novos com os monstros de outro bioma).

## A ficha de bioma

### 1. Identidade
- **Nome** do bioma e nome de cada **faixa** (sub-região) que aparece no jogo.
- **Conceito** em 2 ou 3 frases: o que esse lugar foi, o que aconteceu com ele, o que há lá agora.
- **Sensação** que ele deve passar (medo, solidão, opressão, maravilha...).
- **Referências** de jogos, filmes ou arte.

### 2. Lugar no mundo
- **Profundidade** (de quantos metros a quantos metros) ou posição horizontal.
- **Faixas internas**: cada faixa é uma zona do jogo (`cathZone`), com nome no HUD e no mapa, e muda os monstros, a decoração e os minérios.
- **Entrada**: como o jogador chega (portal, escada, poço, rachadura) e de onde.
- **Ligação com outros biomas**: por onde se passa de um para o outro.

### 3. Estrutura e geração
- **Massa**: a rocha natural que envolve tudo.
- **Tipos de sala** (ex.: nave, capela, cripta), com largura e altura, e o que cada uma recebe.
- **Andares** por faixa e como se ligam (portas, corredores, escadas, poços com corrente).
- **Estragos**: desabamentos, buracos, escombros, água, o que for do tema.
- **Elementos estruturais** com regra própria (ex.: colunas que vão do chão ao teto).
- Tudo segue a ordem e os testes de [regras-de-bioma.md](regras-de-bioma.md).

### 4. Blocos (as quatro camadas do mundo)
- **Sólidos da frente**: os blocos que o jogador anda, quebra e coloca. Para cada um: nome, uso, dureza, cor no mapa, item que solta.
- **Decoração de 1 bloco**: coisas pequenas, não sólidas (velas, crânios, teias, raízes), algumas com luz.
- **Paredes de fundo**: o que aparece atrás das salas (sempre bem mais escuro que a frente; sem cor de destaque, porque o jogo só lê o tom da parede: cor no fundo tem que ser objeto).
- **Terceira camada** (a mais distante, atrás da parede): blocos grandes e escuros que dão profundidade.
- **Minérios**: quais aparecem, em que faixa, e em qual pedra eles ficam engastados.

### 5. Objetos de cena (props)
Os objetos maiores que um bloco, pintados uma vez e "assados" na imagem do mundo. Para cada um: nome, tamanho, variações, **apoio** (chão, teto, parede de fundo, janela), faixas onde aparece, se tem luz ou chama, e o que acontece se quebrar o apoio (ele cai).

### 6. Inimigos
- **Família** temática (na catedral: mortos-vivos).
- Para cada inimigo: nome, papel no combate (tanque, distância, rápido, atravessa parede...), ataque principal com aviso claro, vida e dano base, drops.
- **Tabela de spawn por faixa** (pesos e máximo de monstros ao mesmo tempo).
- Regras da casa: sem dano de contato genérico, linha de visão, busca de caminho, XP baixo.

### 7. Chefe
- Quem é, onde fica (sala especial gerada pela semente), fases, ataques, o que solta (item lendário único), o que fica salvo.

### 8. Loot e economia
- **Itens de bloco** que o bioma dá para construir.
- **Baús**: quantos, onde, o que trazem.
- **Drops** dos monstros e materiais exclusivos do bioma (usados na forja, em missões ou na loja).
- **Itens únicos**: lendários ou bases de equipamento temáticas (ligar com a itemização do GDD).

### 9. Luz e atmosfera
- Quanto o lugar é escuro, quais fontes de luz existem (velas, tochas, objetos) e de que **cor**.
- Partículas e efeitos (poeira, gotas, névoa, brasas).
- Paleta geral: as rampas de 6 tons de cada material.

### 10. Som e música
- Tema musical do bioma (hoje só existem "vila" e "caverna").
- Sons de ambiente e sons próprios dos monstros.

### 11. Interface e progressão
- Nome da zona que aparece ao entrar, cor no mapa (Tab).
- Missões do vilarejo ligadas ao bioma (ancião, ferreiro, taverna).
- Nível dos monstros pela profundidade.

### 12. Arte
- Tudo no padrão do vilarejo: pixel art granulada, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, nada de preto ou branco puro dominando.
- Bloco 12x12 px; humanoides 12x22 com os mesmos encaixes do herói.

### 13. Arquivos
- Um arquivo por sistema (API, blocos, objetos, monstros, mundo, chefe), numerados, e uma spec própria em `docs/`.

---

# Parte 2. Bioma 1: As Cavernas (a primeira camada)

Ficha feita em 2026-10-08 a partir das cavernas antigas (que estavam desligadas no código) e implementada em seguida. É a primeira camada debaixo do vilarejo; a catedral fica embaixo dela. Detalhes técnicos (ids, arquivos, ganchos) em [caverna-spec.md](caverna-spec.md).

## 1. Identidade
- **Nome:** As Cavernas.
- **Faixas no jogo:** Grutas Rasas, Galerias de Pedra, O Ninho, Fundações Soterradas.
- **Conceito:** a terra debaixo do vilarejo é oca. Primeiro vêm grutas de terra úmida cortadas pelas raízes do bosque, depois galerias enormes que a água levou mil anos para cavar, com estalactites e cortinas de calcita. Mais fundo, as aranhas tomaram tudo e teceram um ninho do tamanho de uma vila. No fundo do ninho a rocha fica clara e começam a aparecer pedras lavradas: são as fundações da catedral que afundou.
- **Sensação:** começa como exploração (curiosidade, eco, gotas), vira assombro nas galerias grandes e termina em nojo e medo no ninho, onde tudo gruda.
- **Contraste com a catedral:** nada aqui foi construído. Formas orgânicas em vez de salas retas, terra e rocha em vez de cantaria, bichos em vez de mortos-vivos, luz fria de fungo e cristal em vez de vela.
- **Referências:** as cavernas de Terraria, as grutas de Spelunky, o ninho de aranhas de Mirkwood e de Laracna.

## 2. Lugar no mundo
| Faixa | Profundidade | Caráter |
|---|---|---|
| Grutas Rasas | 6 a 60 m | terra úmida, raízes, túneis que serpenteiam, grutas pequenas, cogumelos |
| Galerias de Pedra | 60 a 120 m | rocha, salões grandes e altos, estalactites e estalagmites, cortinas de calcita, poços fundos |
| O Ninho | 120 a 168 m | xisto escuro, teia em tudo, casulos, ovos, ossos das presas, a câmara da Mãe-Teia |
| Fundações Soterradas | 168 a 186 m | a rocha vira calcário e aparecem blocos lavrados caídos: é a transição para a catedral |

- A catedral começa logo abaixo, a 186 m (Átrio Soterrado), e vai até 372 m. O mundo ficou mais alto (440 blocos em vez de 240).
- **Entrada:** a mesma de antes, o pórtico de pedra à direita da placa do vilarejo, com a escadaria quebrada. A escadaria desce uns 14 m em cantaria; depois a pedra lavrada vai rareando, vira terra e a escada acaba numa gruta. Duas ou três bocas naturais de caverna aparecem nos morros, longe do vilarejo.
- **Ligação com a catedral:** duas descidas por mundo no fundo das Fundações, onde o teto do átrio desabou: uma escadaria em ruína que sai de uma gruta e desce até uma sala do átrio. A catedral continua igual por dentro.

## 3. Estrutura e geração
- **Massa:** terra úmida no alto, rocha da caverna no meio, xisto escuro no ninho, calcário nas fundações. As bordas entre elas se misturam com ruído (nunca uma linha reta).
- **Tipos de espaço:**

| Faixa | Espaços | Largura x altura |
|---|---|---|
| Grutas Rasas | túneis sinuosos (2 a 4 de altura), grutas pequenas | grutas de 8 a 18 x 5 a 9 |
| Galerias de Pedra | salões naturais grandes, poços verticais, túneis | salões de 20 a 45 x 10 a 22 |
| O Ninho | câmaras redondas ligadas por túneis forrados de teia, a câmara da Mãe-Teia | câmaras de 12 a 24 x 7 a 12; a da chefe 34 x 14 |
| Fundações | grutas baixas, blocos caídos, as descidas para o átrio | grutas de 10 a 20 x 5 a 8 |

- Gerado com ruído e autômato celular (forma orgânica, com bordas e degraus), mais túneis "minhoca" que ligam tudo.
- **Estragos e detalhes:** montes de cascalho, poças de argila, teia sólida tapando passagens no ninho (quebra rápido), pedras lavradas caídas nas fundações.
- **Elementos com regra própria:** estalactites ficam presas no teto e estalagmites no chão; se o bloco que as segura quebrar, elas caem (igual às colunas da catedral).
- Tudo alcançável a partir do pórtico (a geração cava túneis se faltar). Segue a ordem e os testes de [regras-de-bioma.md](regras-de-bioma.md).

## 4. Blocos

### Sólidos da frente
| | Bloco | Uso | Solta |
|---|---|---|---|
| [ ] | Terra úmida | massa das Grutas Rasas, escura, com seixos e raízes | Terra Úmida |
| [ ] | Argila | bolsões avermelhados, cava rápido | Argila |
| [ ] | Rocha da caverna | massa das Galerias, camadas inclinadas e rachaduras | Rocha |
| [ ] | Rocha com musgo | rocha úmida perto das raízes e da água | Rocha |
| [ ] | Calcita | escorrimento cor de creme em volta das estalagmites e nas paredes das galerias | Calcita |
| [ ] | Cascalho | montes de pedra solta embaixo de desabamentos | Cascalho |
| [ ] | Xisto escuro | massa do Ninho, lâminas escuras com brilho de mica | Xisto |
| [ ] | Teia sólida | massa de teia que tapa passagens no Ninho; quebra muito rápido | Seda de Aranha |
| [ ] | Minérios da caverna | carvão e cobre engastados na rocha da caverna (o mesmo minério da catedral, pintado na pedra certa) | o minério |

### Decoração de 1 bloco
| | Nome | Onde | Nota |
|---|---|---|---|
| [ ] | Estalactite | teto das Galerias e do Ninho | ponta e meio; cai se quebrar o teto |
| [ ] | Estalagmite | chão das Galerias | base e ponta; cai se quebrar o chão |
| [ ] | Raízes finas | teto das Grutas Rasas | pendem da terra |
| [ ] | Cogumelo de gruta | chão das Grutas | marrom, sem luz |
| [ ] | Cogumelo azul (o de antes) | chão das Galerias | **luz fria** |
| [ ] | Drusa de cristal | chão e cantos das Galerias | **luz fria** lilás, pequena |
| [ ] | Seixos | chão de todas | |
| [ ] | Casulo pequeno | teto do Ninho | pendurado |
| [ ] | Fios de teia | cantos do Ninho | |
| [ ] | Reaproveitados | | tocha (Grutas), ossos, teia, crânios (Ninho), baú |

### Paredes de fundo
| | Parede | Onde |
|---|---|---|
| [ ] | Terra úmida | Grutas Rasas |
| [ ] | Rocha da caverna | Galerias |
| [ ] | Escorrimento de calcita | salões das Galerias |
| [ ] | Rocha com teia | Ninho |
| [ ] | Xisto | Ninho |
| [ ] | Calcário natural (o da catedral) | Fundações |

### Terceira camada (distante)
| | Bloco | Onde |
|---|---|---|
| [ ] | Terra com raízes distante | Grutas Rasas |
| [ ] | Rocha em camadas distante | Galerias |
| [ ] | Floresta de estalactites distante | salões grandes das Galerias |
| [ ] | Rocha com teia distante | Ninho |
| [ ] | Calcário fundo (o da catedral) | Fundações |

### Minérios
| Minério | Faixa |
|---|---|
| Carvão | 6 a 186 m |
| Cobre | 6 a 186 m (o único metal das cavernas) |
| Ferro, ouro e cristal | não aparecem (um metal por camada, ver `js/102-minerios-camada.js`) |

## 5. Objetos de cena

**No chão**
| | Objeto | Faixas | Nota |
|---|---|---|---|
| [ ] | Estalagmites grandes (2 tamanhos) | Galerias, Ninho | |
| [ ] | Pedregulho | todas | |
| [ ] | Drusa grande de cristal | Galerias | **luz fria** lilás |
| [ ] | Touceira de cogumelos | Grutas, Galerias | um deles brilha, **luz fria** |
| [ ] | Ossada do explorador com lampião | Grutas, Galerias | um aventureiro que não voltou; **luz quente** fraca |
| [ ] | Raiz caída | Grutas | um pedaço de raiz grossa no chão |
| [ ] | Ovos de aranha | Ninho | cacho de ovos claros |
| [ ] | Carcaça enrolada em teia | Ninho | |
| [ ] | Pedra lavrada caída (2) | Fundações | pedaços da catedral |

**No teto**
| | Objeto | Faixas | Nota |
|---|---|---|---|
| [ ] | Estalactites grandes (2 tamanhos) | Galerias, Ninho | |
| [ ] | Raízes pendentes | Grutas | |
| [ ] | Casulo grande (com e sem vítima) | Ninho | |
| [ ] | Morcegos dormindo | Grutas, Galerias | só enfeite |
| [ ] | Teia grande (a da catedral) | Ninho | |

**Na parede de fundo**
| | Objeto | Faixas | Apoio |
|---|---|---|---|
| [ ] | Cortina de calcita | Galerias | pé no chão |
| [ ] | Veio de cristal | Galerias | altura do olho, **luz fria** |
| [ ] | Pinturas rupestres | Grutas, Galerias | altura do olho; caçadores antigos e uma aranha enorme |
| [ ] | Fóssil na rocha | Galerias, Ninho | altura do olho |
| [ ] | Lençol de teia | Ninho | pé no chão |
| [ ] | Arco lavrado meio enterrado | Fundações | pé no chão; o primeiro sinal da catedral |

## 6. Inimigos: os bichos da caverna
| | Inimigo | Papel | Vida / dano base |
|---|---|---|---|
| [ ] | Gosma (repintada, 3 cores por faixa) | pula em cima do herói | 22 / 9 |
| [ ] | Morcego (repintado) | dorme pendurado no teto; acorda, plana e dá rasante para morder | 15 / 8 |
| [ ] | Rato-de-Gruta | rápido e fraco, anda em bando de 2 ou 3, mordida curta | 14 / 6 |
| [ ] | Aranha Tecelã | espera no teto, desce no fio quando o herói passa embaixo, depois corre no chão e dá bote (aviso: se encolhe antes) | 28 / 9 |
| [ ] | Aranha Cuspideira | fica longe e cospe bolas de teia em arco; quem leva fica lento por 2 s | 24 / 7 |
| [ ] | Besouro Couraçado | tanque: a carapaça bloqueia golpes de frente; se encolhe e sai rolando (aviso claro); bate na parede e fica tonto | 60 / 11 |
| [ ] | Filhote de aranha | fundo do Ninho e ovos da Mãe-Teia; fraco e rápido | 8 / 4 |
| [ ] | Fungo Esporento | parado como cogumelo do cenário; perto do herói incha (aviso) e solta uma nuvem de esporos que envenena (perde vida aos poucos, sem empurrão) enquanto ele fica dentro; bater nele também solta a nuvem | 40 / 7 |
| [ ] | Centopeia das Rochas | anda grudada no chão, nas paredes e no teto atrás do herói e morde de qualquer lado; do teto se solta em cima dele; rápida e fraca | 20 / 8 |
| [ ] | Goblin Dinamiteiro | lampião no capacete; fica longe, acende a dinamite (aviso) e joga em arco; ela quica, explode depois de um tempo, fere o herói e os monstros perto e quebra os blocos em volta; foge quando o herói chega perto | 30 / 16 |

Os 10 da camada (regra fixa, sem contar o chefe): os 7 primeiros vêm do `js/55-caverna-bichos.js`, os 3 últimos do `js/76-cavernas-novos.js`. Os números base passam pela mesma escala do combate (vida x0,25, dano x0,4) que todos os monstros. Sem dano de contato: só o bote, a mordida, o pulo, a rolagem, o cuspe, a nuvem e a explosão machucam. Todos usam linha de visão e busca de caminho.

**Nível pela profundidade:** nas cavernas, 1 nível a cada 50 m (níveis 1 a 4). Na catedral, que agora fica mais funda, começa no nível 2 e sobe 1 a cada 45 m (níveis 2 a 6; antes eram 1 a 5).

**Spawn por faixa**
| Faixa | Monstros (peso) | Máx. |
|---|---|---|
| Grutas Rasas | gosma 0.3, morcego 0.25, rato 0.3, fungo 0.2 | 6 |
| Galerias de Pedra | morcego 0.17, rato 0.13, aranha 0.22, besouro 0.2, fungo 0.13, centopeia 0.17 | 7 |
| O Ninho | aranha 0.35, cuspideira 0.3, besouro 0.15, morcego 0.1, filhote 0.1 | 8 |
| Fundações | aranha 0.2, cuspideira 0.18, besouro 0.2, morcego 0.12, centopeia 0.15, goblin 0.2 | 8 |

## 7. Chefe: A Mãe-Teia
- **Quem é:** a aranha que teceu o ninho, do tamanho de uma carroça, com o abdômen marcado por uma caveira clara.
- **Onde:** a Câmara do Ninho, uma gruta redonda de 34 x 14 no fundo do Ninho, sorteada pela semente, forrada de teia, com ovos e casulos. Ao entrar, cortinas de teia fecham as saídas; elas somem quando a chefe morre (ou quando o herói morre).
- **Luta (3 fases):**
  1. Anda pelo chão: bote com aviso (ela se encolhe), leque de 3 bolas de teia que deixam o herói lento.
  2. Abaixo de 60% de vida: sobe para o teto, fica pendurada e cai em cima do herói (uma sombra no chão avisa onde), e os ovos da sala chocam filhotes.
  3. Abaixo de 25%: mais rápida, cospe 5 bolas e salta de parede a parede.
- **Vida / dano:** 640 / 16 (antes da escala).
- **Drop:** **Presa da Mãe-Teia** (adaga lendária: veneno que causa dano por 4 s a cada golpe, crítico e velocidade de ataque). Fica salvo que ela morreu.

## 8. Loot e economia
- **Itens de bloco:** terra úmida, argila, rocha, calcita, cascalho, xisto. A teia sólida solta seda.
- **Baús:** até 12, nas grutas e câmaras, longe uns dos outros.
- **Materiais novos (a Marta e o Caetano compram):** Pele de Rato, Seda de Aranha, Glândula de Peçonha, Placa de Quitina.
- **Drops de equipamento:** peças simples (capuz, botas de couro, túnica, adaga e maça de ferro, broquel), raras.
- **Raridade pela profundidade real:** Grutas e Galerias contam como profundidade 1 (sem roxo nem laranja), Ninho e Fundações como 2. Na catedral: Átrio e Nave 2, Claustro 3, Criptas 4.
- **Único:** a Presa da Mãe-Teia.

## 9. Luz e atmosfera
- Escuro de verdade: a luz vem das tochas que você leva, de umas poucas tochas velhas nas Grutas, do lampião da ossada e da **luz fria** dos cogumelos e cristais (azul e lilás).
- Paletas: terra marrom-escura e úmida, rocha cinza-castanha, calcita creme, xisto azul-ardósia, teia branca acinzentada, quitina preta-esverdeada.

## 10. Som e música
- Usa o tema "caverna" que já existe (zumbido, vento, gotas e notas soltas), que agora é de fato o tema das cavernas. A catedral ainda divide esse tema.
- Sons próprios: guincho do rato, chiado da aranha, cuspe, rolagem do besouro, o grito da Mãe-Teia.

## 11. Interface e progressão
- Nome da faixa aparece ao entrar (Grutas Rasas, Galerias de Pedra, O Ninho, Fundações Soterradas) e no mapa.
- Missões do ancião com os materiais novos (seda, pele de rato, quitina, glândula).

## 12. Arte
- Mesmo padrão da catedral e do vilarejo: pixel art granulada, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar.
- Bichos pintados uma vez e guardados (corpo, patas em quadros de animação), como os mortos-vivos.

## 13. Arquivos
| Arquivo | O que tem |
|---|---|
| `js/52-caverna-api.js` | ids dos blocos, paredes e camada distante, faixas, profundidades |
| `js/53-caverna-blocos.js` | texturas dos blocos, paredes, camada distante e decorações; minérios na rocha da caverna; itens de bloco |
| `js/54-caverna-objetos.js` | os objetos de cena |
| `js/55-caverna-bichos.js` | gosma e morcego repintados, rato, aranhas, besouro, filhote: arte, IA, drops, materiais |
| `js/56-caverna-mundo.js` | geração das cavernas, transição, descidas, decoração, baús, objetos, zonas, nível e loot por profundidade, save |
| `js/57-mae-teia.js` | a chefe: câmara, luta, drop |
| `docs/caverna-spec.md` | a parte técnica |

---

# Parte 3. Bioma 2: A Catedral Abandonada (existe)

Levantado do código atual (`js/41` a `js/46`) e de [catedral-spec.md](catedral-spec.md).

## 1. Identidade
- **Nome:** Catedral Abandonada.
- **Faixas no jogo:** Átrio Soterrado, Nave da Catedral, Claustro Profanado, Criptas.
- **Conceito:** uma catedral gótica soterrada há séculos debaixo do vilarejo, com o claustro e as criptas embaixo. Os mortos dela se levantaram.
- **Sensação:** grandiosidade abandonada. Salões enormes no escuro, luz quente de vela, silêncio de igreja.
- **Referências:** a catedral de Tristram em Diablo 1.

## 2. Lugar no mundo
| Faixa | Profundidade | Andares | Caráter |
|---|---|---|---|
| Átrio Soterrado | 186 a 212 m | 1 (a 207 m) | terra virando calcário, escadaria quebrada, raízes, vestíbulos |
| Nave da Catedral | 212 a 268 m | 2 (236 m e 264 m) | salões altos com colunas, bancos, vitrais, órgão |
| Claustro Profanado | 268 a 318 m | 3 (284, 300 e 316 m) | capelas, corredores com arcadas, biblioteca, afrescos |
| Criptas | 318 a 372 m | 3 (333, 348 e 363 m) | corredores baixos, ossários, túmulos |

- Desde 2026-10-08 fica **embaixo das Cavernas** (parte 2): as profundidades acima somam os 186 m das cavernas. Desde 2026-10-09, abaixo de 372 m ficam as Cavernas de Gelo (parte 4).
- **Entrada:** o pórtico de pedra à direita da placa do vilarejo agora leva às Cavernas. Para a catedral se desce pelas Fundações Soterradas, onde o teto do átrio desabou: duas escadarias em ruína por mundo descem de uma gruta até uma sala do átrio.
- A cripta roxa do Carrasco foi **removida** em 2026-10-09. Os demônios dela viraram a quinta camada, O Abismo (`docs/abismo-spec.md`).

## 3. Estrutura e geração
- **Massa:** calcário claro, com bolsões de terra perto do topo e algumas fendas naturais.
- **Salas por faixa:**

| Faixa | Tipos de sala | Largura | Altura |
|---|---|---|---|
| Átrio | vestíbulo, sala | 9 a 18 | 6 a 8 |
| Nave | nave, principal (com altar e órgão), capela | 22 a 50 | 15 a 21 |
| Claustro | capela, claustro, sala, biblioteca | 10 a 30 | 8 a 11 |
| Criptas | cripta, ossário, túmulos | 8 a 22 | 5 a 7 |

- Cada andar dá a volta no mundo inteiro, sala ao lado de sala, ligadas por portas e corredores.
- **Abóbadas** com curva (mais funda na nave), **colunas** entre os vãos (arcadas na nave e no claustro, pilares curtos nas criptas). Capelas podem ter piso de mármore e lambri de madeira na parte de baixo da parede.
- **Entre andares:** poços com corrente para subir e, às vezes, uma escadaria grande.
- **Estragos:** montes de escombros embaixo de buracos na abóbada; cantaria rachada e com musgo (átrio).
- Tudo alcançável a partir da entrada (a geração abre passagens se faltar). Cerca de 80 salas e 370 objetos por mundo.

## 4. Blocos

### Sólidos da frente
| | Bloco | Uso | Solta |
|---|---|---|---|
| [ ] | Calcário | a massa natural; recebe os minérios | Calcário |
| [ ] | Calcário com terra | transição no átrio | Calcário |
| [ ] | Cantaria | paredes lavradas das salas | Cantaria |
| [ ] | Cantaria rachada | bordas de desabamento | Cantaria |
| [ ] | Cantaria com musgo | ruína do átrio | Cantaria |
| [ ] | Laje | piso gasto | Laje |
| [ ] | Mosaico | piso xadrez de mármore com friso | Mosaico |
| [ ] | Mármore | piso das capelas | Mármore |
| [ ] | Mármore negro | degraus, rodapés, molduras | Mármore Negro |
| [ ] | Friso | faixa entalhada com rosáceas sobre portas | Friso |
| [ ] | Pilastra | fuste canelado nas laterais da nave | Pilastra |
| [ ] | Ardósia | telhas em escama da abóbada da nave | Ardósia |
| [ ] | Tijolo velho | remendos no claustro e criptas | Tijolo Velho |
| [ ] | Escombros | montes de pedra solta | Calcário |
| [ ] | Pedra da cripta | alvenaria fria e escura das criptas | Pedra da Cripta |
| [ ] | Lápide | pedra tumular | Pedra da Cripta |
| [ ] | Ossário | parede de crânios e ossos | Osso |
| [ ] | Grade de ferro | sólida, mas vazada (vê-se o fundo) | — |

### Decoração de 1 bloco
| | Nome | Onde | Nota |
|---|---|---|---|
| [ ] | Coluna | naves, claustros, criptas | não sólida, base, fuste e capitel; vai sempre do chão ao teto e cai inteira se quebrar o apoio |
| [ ] | Raízes | teto do átrio | ponta afinando |
| [ ] | Cacos de vitral | chão do átrio e da nave | pontinhos coloridos |
| [ ] | Crânios | chão do claustro e criptas | pilha pequena |
| [ ] | Velas derretidas | chão | **luz**, chama animada |
| [ ] | Teia grossa | cantos do teto | |
| [ ] | Reaproveitados | | tocha (átrio), vela, ossos, urna, teia, estandarte curto, corrente, baú |

### Paredes de fundo
| | Parede | Onde |
|---|---|---|
| [ ] | Calcário natural | rocha |
| [ ] | Cantaria | átrio |
| [ ] | Arcada cega (arcos finos em relevo) | nave |
| [ ] | Reboco rachado | claustro |
| [ ] | Lambri de madeira | metade de baixo das capelas |
| [ ] | Painel de mármore | capelas |
| [ ] | Pedra da cripta | criptas |
| [ ] | Ossário (crânios em nichos) | ossários |

### Terceira camada (distante)
| | Bloco | Onde |
|---|---|---|
| [ ] | Alvenaria distante | perto das salas |
| [ ] | Nervuras de abóbada | logo acima das salas |
| [ ] | Calcário fundo | longe das salas |
| [ ] | Nichos de túmulo distantes | faixa das criptas |

### Minérios (engastados no calcário)
| Minério | Faixa |
|---|---|
| Carvão | 192 a 370 m |
| Ferro | 192 a 370 m (o único metal da catedral) |
| Cobre, ouro e cristal | não aparecem (um metal por camada) |

## 5. Objetos de cena (31 tipos)

**No chão**
| | Objeto | Faixas | Nota |
|---|---|---|---|
| [ ] | Banco (inteiro, quebrado, tombado) | nave, claustro | fileiras na nave |
| [ ] | Candelabro de pé | nave, claustro, criptas | 3 velas, **luz** |
| [ ] | Estátua de santo (com e sem cabeça) | nave, claustro, criptas | |
| [ ] | Estátua de anjo (asa quebrada) | nave, claustro, criptas | |
| [ ] | Altar | nave, claustro | velas, **luz** |
| [ ] | Púlpito | nave | |
| [ ] | Cadeira do bispo | nave | |
| [ ] | Pia batismal | nave, claustro | |
| [ ] | Sino caído | átrio, nave | |
| [ ] | Arco caído | átrio, nave, claustro | |
| [ ] | Coluna tombada | átrio, nave, claustro | |
| [ ] | Sarcófago (fechado e aberto) | claustro, criptas | |
| [ ] | Caixão (fechado e com ossos) | claustro, criptas | |
| [ ] | Monte de ossos | claustro, criptas | |
| [ ] | Trono do Rei Esqueleto e tapete | sala do trono | só no salão do chefe |

**No teto**
| | Objeto | Faixas | Nota |
|---|---|---|---|
| [ ] | Lustre de ferro com velas | nave, claustro | **luz** |
| [ ] | Incensário | nave, claustro | |
| [ ] | Estandarte rasgado (3 brasões) | nave, claustro, criptas | |
| [ ] | Teia grande | todas | |
| [ ] | Corrente com gancho | claustro, criptas | |
| [ ] | Gaiola com esqueleto | claustro, criptas | |

**Na parede de fundo**
| | Objeto | Faixas | Apoio |
|---|---|---|---|
| [ ] | Vitral alto (2 variações) | nave, claustro | janela |
| [ ] | Rosácea | nave | janela, no centro |
| [ ] | Órgão (um por mundo) | nave principal | pé no chão |
| [ ] | Arco ogival em relevo | todas | pé no chão |
| [ ] | Nichos de túmulo com crânios | criptas | pé no chão |
| [ ] | Cruz torta | nave, claustro, criptas | pé no chão |
| [ ] | Nicho com estatueta | nave, claustro | altura do olho |
| [ ] | Afresco desbotado (2) | claustro | altura do olho |
| [ ] | Brasão | nave, claustro | altura do olho |
| [ ] | Quadro rasgado | claustro | altura do olho |
| [ ] | Tocheiro | todas | altura do olho, **luz** |

## 6. Inimigos: os mortos-vivos
| | Inimigo | Papel | Vida / dano base |
|---|---|---|---|
| [ ] | Zumbi | lento, aguenta, agarra e arranha | 55 / 10 |
| [ ] | Zumbi Vomitador | meia distância, 3 bolas de bile em arco que deixam poça ácida | 45 / 8 |
| [ ] | Esqueleto | espada com preparação clara; às vezes dorme como pilha de ossos e se remonta quando o herói chega | 64 / 14 |
| [ ] | Esqueleto Arqueiro | recua, mira, flecha | 44 / 11 |
| [ ] | Guardião Esquelético | lança e escudo de torre, bloqueia de frente, estocada longa | 90 / 15 |
| [ ] | Espectro | atravessa paredes, some e aparece, investida | 40 / 12 |
| [ ] | Gárgula | parada como estátua (leva só 35% do dano assim); acorda quando o herói passa perto, voa por cima dele e mergulha; leva 65% do dano no voo; sem ninguém por perto, pousa de novo | 70 / 13 |
| [ ] | Acólito Profano | conjurador de capuz que fica longe; atira bolas de fogo roxo e, de tempos em tempos, levanta um esqueleto do chão perto do herói (no máximo 2 vivos por acólito) | 50 / 12 |
| [ ] | Carniçal | morto-vivo de quatro patas, rápido; agacha (aviso) e pula de longe; a mordida faz sangrar (perde vida por 3 s) | 55 / 12 |
| [ ] | Abominação | pilha de cadáveres costurados, o dobro do zumbi, lenta; ergue o gancho (aviso) e bate pegando dos dois lados e jogando longe; ao morrer, 2 zumbis saem de dentro | 260 / 22 |

Os 10 da camada (regra fixa, sem contar o chefe): os 6 primeiros do `js/44-mortos-vivos.js`, os 4 últimos do `js/77-catedral-novos.js`. Vida e dano sobem com a profundidade: começam no nível 2 no átrio e sobem 1 a cada 45 m (até o 6). Antes das cavernas eram 1 a 5. Ao morrer: esqueletos viram montes de ossos, zumbis desabam e afundam.

**Spawn por faixa**
| Faixa | Monstros (peso) | Máx. |
|---|---|---|
| Átrio | zumbi 0.45, esqueleto 0.3, arqueiro 0.12, gárgula 0.22 | 6 |
| Nave | zumbi 0.25, vomitador 0.12, esqueleto 0.23, arqueiro 0.18, gárgula 0.14, acólito 0.12 | 8 |
| Claustro | vomitador 0.12, esqueleto 0.2, guardião 0.2, espectro 0.16, acólito 0.14, carniçal 0.18 | 9 |
| Criptas | zumbi 0.13, esqueleto 0.18, guardião 0.2, espectro 0.22, carniçal 0.17, abominação 0.1 | 10 |

## 7. Chefe: O Rei Esqueleto
- **Onde:** um salão da nave ou do claustro, sorteado pela semente, com estrado, trono, tapete, candelabros e tocheiros. Ao entrar, grades de ferro fecham todas as saídas.
- **Luta (3 fases):** golpe de maça e salto com onda de choque (pular por cima), invoca esqueletos; a partir de 55% de vida, investe e fica tonto se bater na parede; na primeira "morte" desaba e se remonta com metade da vida, e passa a soltar fileiras de espinhos de osso.
- **Vida / dano:** 760 / 20.
- **Drop:** Coroa do Rei Esqueleto (lendária: defesa 5, vida 20, roubo de vida 2%, velocidade de ataque 8%, efeito ao matar). Aparece na cabeça do herói. Fica salvo que o rei morreu.

## 8. Loot e economia
- **Itens de bloco:** 11 (calcário, cantaria, laje, mosaico, mármore, mármore negro, friso, pilastra, tijolo velho, ardósia, pedra da cripta). Ossário solta osso.
- **Baús:** até 16 espalhados pelas salas, longe uns dos outros.
- **Drops:** os de cada monstro (carne, poção, peças de equipamento, raramente anéis).
- **Único:** a Coroa do Rei Esqueleto.

## 9. Luz e atmosfera
- Subsolo escuro; a luz vem só de velas, candelabros, lustres, altar, tocheiros e tochas, todas **quentes** (âmbar), com chama animada e halo.
- Vitrais têm brilho próprio fraco, sem iluminar.
- Paleta: pedra cinza-osso quente na frente, fundo bem mais escuro, toques de bronze, ferro, madeira velha, tecido vermelho gasto e vidro colorido apagado.

## 10. Som e música
- Música: usa o tema "caverna" (zumbido grave, vento, notas soltas), o mesmo das Cavernas. **Não há tema próprio da catedral ainda.**
- Sons próprios: ânsia e vômito, ossos se remontando, chefe.

## 11. O que ainda falta na catedral (para decidir)
- [ ] Música própria (órgão distante, coro abafado, sino).
- [ ] Materiais exclusivos da catedral para a forja (ex.: prata benta, cera, relíquia).
- [ ] Missões do vilarejo ligadas à catedral e ao Rei.
- [ ] Partículas: poeira caindo da abóbada, cera pingando.
- [x] O destino da cripta do Carrasco: removida; os demônios viraram O Abismo, a quinta camada (2026-10-09).

---

# Parte 4. Bioma 3: As Cavernas de Gelo (a terceira camada)

Ficha feita em 2026-10-09 a pedido do Jonathan ("um bioma de gelo, cavernas de gelo, uns yetis grandões") e implementada em seguida. É a terceira camada: fica debaixo das criptas da catedral. Detalhes técnicos (ids, arquivos, ganchos) em [gelo-spec.md](gelo-spec.md).

## 1. Identidade
- **Nome:** As Cavernas de Gelo.
- **Faixas no jogo:** Fendas Geladas, Salões de Gelo Azul, Covis dos Yetis, Coração do Inverno.
- **Conceito:** debaixo das criptas a terra para de ser quente. Um frio antigo, mais velho que a catedral, subiu pelas rachaduras e congelou tudo: primeiro as rachaduras do calcário, cheias de geada e de tumbas que escorregaram lá de cima; depois salões enormes de gelo azul, translúcido, com colunas, lagos congelados e cachoeiras paradas no ar. Mais fundo, os yetis fizeram suas tocas no permafrost, com ossos roídos e fogueiras apagadas. No fundo de tudo está o Coração do Inverno: gelo negro, cristais que brilham sozinhos, gigantes presos dentro do gelo e o trono do Yeti Ancestral.
- **Sensação:** silêncio e frio. Começa estranho (a catedral congelada), vira deslumbramento nos salões azuis (a camada mais bonita e mais clara do jogo), passa a ameaça nas tocas (pegadas, ossos, rugidos ao longe) e termina em reverência no Coração, onde as coisas presas no gelo parecem que vão acordar.
- **Contraste com as outras camadas:** a caverna é marrom e úmida, a catedral é cinza, dourada e de vela. O gelo é azul, branco e frio, com luz própria (o gelo azul e os cristais brilham), e o chão escorrega. Os monstros são feras vivas e espíritos do frio, não bichos nem mortos.
- **Referências:** as cavernas de gelo de Terraria, a Skyrim das ruínas congeladas, os yetis de Diablo 2 (Planalto Gelado) e as cavernas de cristal azul da Groenlândia.

## 2. Lugar no mundo
| Faixa | Profundidade | Caráter |
|---|---|---|
| Fendas Geladas | 372 a 418 m | o calcário das criptas coberto de geada vira permafrost; fendas altas e estreitas, tumbas e lápides caídas e congeladas |
| Salões de Gelo Azul | 418 a 476 m | gelo azul translúcido, salões enormes, colunas de gelo, lagos congelados, cachoeiras paradas, sincelos |
| Covis dos Yetis | 476 a 528 m | neve batida e permafrost, tocas redondas, ossos de mamute, fogueiras apagadas, montes de neve |
| Coração do Inverno | 528 a 558 m | gelo negro antigo, cristais que brilham, gigantes e feras presos no gelo, o Trono de Gelo do chefe |

- O mundo fica mais fundo de novo: 640 blocos de altura em vez de 440. Abaixo do Coração só tem a rocha do fundo.
- **Entrada:** duas descidas por mundo, saindo das salas mais baixas das Criptas. O chão da cripta está rachado e o frio entra por ali: uma fenda irregular desce da sala até as Fendas Geladas, com degraus de gelo e geada nas paredes. As duas ficam longe uma da outra e são alcançáveis a partir do vilarejo.
- **Passagem:** as últimas fileiras das Criptas já aparecem com calcário congelado e sincelos; as Fendas começam com calcário congelado, tumbas e pedra lavrada caída que vão sumindo ao descer, até virar só permafrost e gelo (segue a regra de passagem entre camadas).

## 3. Estrutura e geração
- **Massa:** calcário congelado no alto das Fendas, permafrost e rocha gelada no meio, gelo azul nos Salões, neve batida e permafrost nos Covis, gelo negro no Coração. Bordas misturadas com ruído.
- **Tipos de espaço:**

| Faixa | Espaços | Largura x altura |
|---|---|---|
| Fendas Geladas | fendas verticais altas e estreitas, grutas baixas, ligações em zigue-zague | fendas de 4 a 8 x 14 a 26; grutas de 10 a 18 x 5 a 8 |
| Salões de Gelo Azul | salões enormes com teto alto, colunas de gelo do chão ao teto, lagos congelados no chão | salões de 28 a 55 x 14 a 24 |
| Covis dos Yetis | tocas redondas ligadas por túneis largos (o yeti é grande), montes de neve | tocas de 14 a 24 x 8 a 12 |
| Coração do Inverno | grutas de gelo negro e o Trono de Gelo | grutas de 14 a 26 x 8 a 12; o trono 40 x 16 |

- Gerado com ruído e autômato celular, como as cavernas, mais túneis largos (3 a 5 de altura) para os yetis passarem.
- **Elementos com regra própria:**
  - **Gelo escorregadio:** em gelo, gelo azul e gelo negro o herói demora mais para frear e para acelerar. Neve, permafrost e rocha não escorregam.
  - **Lagos congelados:** placas lisas de gelo no chão dos Salões, sempre planas.
  - **Colunas de gelo:** vão sempre do chão ao teto e caem inteiras se quebrar o apoio (igual às colunas da catedral).
  - **Sincelos** ficam presos no teto e caem em corrente se quebrar o bloco que os segura.
  - **Neve no chão:** uma camada fina de neve cobre o chão dos Covis (só chão, nunca parede ou teto).
- Tudo alcançável a partir das descidas (a geração cava túneis se faltar). Segue a ordem e os testes de [regras-de-bioma.md](regras-de-bioma.md).

## 4. Blocos

### Sólidos da frente
| | Bloco | Uso | Solta |
|---|---|---|---|
| [ ] | Calcário congelado | o calcário da catedral com geada branca nas frestas; topo das Fendas | Calcário |
| [ ] | Permafrost | terra e cascalho congelados, castanho-acinzentado com cristais de gelo; massa das Fendas e dos Covis | Permafrost |
| [ ] | Rocha gelada | rocha azul-ardósia com veios de gelo; massa geral | Rocha Gelada |
| [ ] | Neve | fofa, cava muito rápido; chão dos Covis e montes | Neve |
| [ ] | Neve batida | camadas compactadas, mais firme | Neve |
| [ ] | Gelo | branco-azulado, com bolhas presas; **escorrega** | Gelo |
| [ ] | Gelo azul | o gelo antigo e translúcido dos Salões, **luz fria** fraca; **escorrega** | Gelo Azul |
| [ ] | Gelo negro | gelo muito velho, quase preto, com rachaduras azuis; Coração; **escorrega** | Gelo Negro |
| [ ] | Minérios do gelo | carvão e ouro na rocha gelada, ouro também no gelo negro | o minério |

### Decoração de 1 bloco
| | Nome | Onde | Nota |
|---|---|---|---|
| [ ] | Sincelo | teto de todas | ponta e meio; cai em corrente se quebrar o teto |
| [ ] | Estalagmite de gelo | chão dos Salões e do Coração | base e ponta |
| [ ] | Cristal de gelo | chão do Coração e dos Salões | **luz fria** azul |
| [ ] | Cristal pendente | teto do Coração | **luz fria** azul, pendurado |
| [ ] | Montinho de neve | chão dos Covis e das Fendas | |
| [ ] | Ossos congelados | chão dos Covis | |
| [ ] | Reaproveitados | | crânios e lápides (Fendas), baú |

### Paredes de fundo
| | Parede | Onde |
|---|---|---|
| [ ] | Calcário com geada (a da cripta, congelada) | topo das Fendas |
| [ ] | Rocha gelada | Fendas, Covis |
| [ ] | Gelo azul em camadas | Salões |
| [ ] | Neve compactada | Covis |
| [ ] | Gelo negro rachado | Coração |

### Terceira camada (distante)
| | Bloco | Onde |
|---|---|---|
| [ ] | Rocha gelada distante | Fendas |
| [ ] | Geleira azul distante (paredes de gelo enormes) | Salões |
| [ ] | Floresta de sincelos distante | salões grandes |
| [ ] | Gelo negro distante | Coração |

### Minérios
| Minério | Faixa |
|---|---|
| Carvão | 372 a 558 m (na rocha gelada) |
| Ouro | 372 a 558 m (o único metal do gelo) |
| Cobre, ferro e cristal | não aparecem (um metal por camada) |

## 5. Objetos de cena

**No chão**
| | Objeto | Faixas | Nota |
|---|---|---|---|
| [ ] | Coluna de gelo | Salões | do chão ao teto, um bloco de largura; cai inteira se quebrar o apoio |
| [ ] | Explorador congelado | Fendas, Salões | um aventureiro preso num bloco de gelo, de pé, com a tocha ainda na mão |
| [ ] | Tumba congelada | Fendas | um sarcófago da cripta que caiu, coberto de gelo |
| [ ] | Presas de mamute | Covis | duas presas curvas saindo da neve |
| [ ] | Ossada de mamute | Covis | costelas enormes e o crânio |
| [ ] | Fogueira apagada dos yetis | Covis | pedras em círculo, ossos, cinza; **luz quente** de brasa bem fraca |
| [ ] | Monte de neve grande | Covis, Fendas | |
| [ ] | Drusa de cristal de gelo | Salões, Coração | **luz fria** azul |
| [ ] | Estátua congelada | Fendas | uma estátua da catedral coberta de gelo |
| [ ] | Altar de gelo | Coração | pedra rúnica antiga com gelo; **luz fria** |
| [ ] | Pedregulho gelado | todas | |
| [ ] | Trono de Gelo | sala do chefe | o trono do Yeti Ancestral: degraus de gelo, encosto com cristais, crânios nos braços, uma pele branca no assento; **luz fria** |

**No teto**
| | Objeto | Faixas | Nota |
|---|---|---|---|
| [ ] | Cacho de sincelos grandes (2 tamanhos) | todas | |
| [ ] | Cristal pendente grande | Coração | **luz fria** |
| [ ] | Raízes congeladas | Fendas | as últimas raízes, cobertas de gelo |

**Na parede de fundo**
| | Objeto | Faixas | Apoio |
|---|---|---|---|
| [ ] | Cachoeira congelada | Salões | pé no chão; uma queda d'água parada no meio |
| [ ] | Veio de gelo azul | Salões, Coração | altura do olho, **luz fria** |
| [ ] | Fera presa no gelo | Coração, Covis | altura do olho; um bicho enorme visto através do gelo |
| [ ] | Gigante preso no gelo | Coração | pé no chão; a silhueta de um gigante dentro da parede |
| [ ] | Marcas de garra | Covis | altura do olho; o yeti marca a toca |
| [ ] | Pinturas dos yetis | Covis | altura do olho; desenhos toscos de caça |

## 6. Inimigos: as feras do gelo
| | Inimigo | Papel | Vida / dano base |
|---|---|---|---|
| [ ] | Yeti | o grandão: anda pesado, levanta os dois punhos (aviso) e soca o chão, soltando uma onda curta pelo chão; de longe arranca um bloco de gelo e arremessa em arco. Quase não recua com golpes | 140 / 20 |
| [ ] | Lobo da Geada | anda em bando de 2 ou 3, rápido; agacha (aviso) e dá um bote longo com mordida | 48 / 12 |
| [ ] | Espírito da Nevasca | voa e atravessa o ar com um rastro de neve; fica longe e atira lascas de gelo que deixam o herói lento por 2 s | 36 / 11 |
| [ ] | Verme da Geada | vive dentro da neve e do gelo; uma rachadura no chão embaixo do herói avisa, e ele sai mordendo de baixo; depois volta a se enterrar | 60 / 14 |
| [ ] | Sentinela de Gelo | um golem de gelo azul: bloqueia golpes de frente com o braço de gelo, dá uma pancada lenta e forte; ao morrer se estilhaça em lascas | 120 / 16 |
| [ ] | Gosma gelada | a gosma, azul clara e com gelo por dentro | 22 / 9 |
| [ ] | Sincelo Vivo | pendurado no teto igual aos sincelos do cenário; despenca quando o herói passa embaixo (dano alto, deixa lento) e depois rasteja mordendo | 34 / 16 |
| [ ] | Caçador Congelado | explorador morto no gelo; de longe mira (aviso) e arremessa um arpão com corda: se pegar, puxa o herói para perto; de perto, machadada | 70 / 14 |
| [ ] | Javali da Tundra | bufa e cava o chão (aviso), investe em linha reta, derruba e joga o herói longe; quebra o gelo no caminho; se bater em outra coisa fica tonto e leva 60% a mais de dano | 110 / 18 |
| [ ] | Wendigo | alto e magro, quase invisível no escuro até chegar perto (os olhos brilham sempre); grita e deixa o herói lento; duas garradas rápidas; foge da luz das tochas | 150 / 20 |

Os 10 da camada (regra fixa, sem contar o chefe): os 6 primeiros do `js/72-gelo-bichos.js`, os 4 últimos do `js/78-gelo-novos.js`. Os números base passam pela mesma escala do combate (vida x0,25, dano x0,4). Sem dano de contato: só o soco, a onda, o bloco, o bote, as lascas, a mordida, a pancada, a queda do sincelo, o arpão, a machadada, a investida e as garras machucam. Todos usam linha de visão e busca de caminho (o espírito voa, o verme anda por dentro do chão).

**Feras do frio:** a Nevasca e qualquer efeito de frio deixam estas feras só levemente lentas e nunca as congelam.

**Nível pela profundidade:** começa no 6 e sobe 1 a cada 60 m (níveis 6 a 8); 30% dos monstros vêm 1 nível acima. Os lobos chegam em bando (mais 1 ou 2 junto) e o verme nasce enterrado.

**Spawn por faixa**
| Faixa | Monstros (peso) | Máx. |
|---|---|---|
| Fendas Geladas | lobo 0.3, espírito 0.22, gosma 0.2, verme 0.13, sincelo 0.18, caçador 0.15 | 8 |
| Salões de Gelo Azul | lobo 0.2, espírito 0.17, sentinela 0.18, sincelo 0.15, caçador 0.15, javali 0.15 | 9 |
| Covis dos Yetis | yeti 0.25, lobo 0.2, verme 0.15, espírito 0.15, javali 0.15, wendigo 0.1 | 9 |
| Coração do Inverno | sentinela 0.28, yeti 0.22, espírito 0.2, lobo 0.15, wendigo 0.15 | 10 |

## 7. Chefe: O Yeti Ancestral
- **Quem é:** o primeiro dos yetis, branco-azulado de velho, com o dobro do tamanho dos outros, chifres curvos e cristais de gelo crescendo nas costas.
- **Onde:** o Trono de Gelo, um salão de 40 x 16 no Coração do Inverno, do outro lado do mundo em relação às descidas, com paredes vidradas de gelo azul, chão de neve batida (não escorrega), o trono esculpido no gelo, drusas, estalagmites e sincelos. Ao entrar, paredes de gelo que não dá para cavar fecham as saídas; elas derretem quando ele morre, quando o herói morre ou sai da sala (aí a luta recomeça).
- **Luta (3 fases):**
  1. Soco duplo no chão com aviso (levanta os punhos) e onda de choque pelo chão; arremessa um bloco de gelo que se quebra em 3 lascas ao cair.
  2. Abaixo de 60% de vida: ruge e o teto solta sincelos enormes (uma sombra no chão avisa onde cada um cai) e chama 2 Lobos da Geada.
  3. Abaixo de 25%: enfurecido, mais rápido; dá um carrinho de barriga de parede a parede (aviso: se agacha), e se bater na parede fica tonto por 2 s e solta sincelos do teto; sopra um bafo de geada em cone que segue o herói devagar e deixa ele lento.
- **Sem recuo:** golpes não interrompem os ataques dele; a janela para bater é depois de cada ataque e quando fica tonto.
- **Vida / dano:** 900 / 22 (antes da escala).
- **Drop:** **Manto do Yeti Ancestral** (armadura de corpo lendária: defesa 7, +8 de vida, inimigos que te acertam de perto ficam resfriados por 3 s, e teia e gelo não te deixam mais lento), poções, pelo de yeti e lascas de gelo eterno. Fica salvo que ele morreu.

## 8. Loot e economia
- **Itens de bloco:** permafrost, rocha gelada, neve, gelo, gelo azul, gelo negro.
- **Baús:** até 12, nas grutas e tocas, longe uns dos outros.
- **Materiais novos (a Marta e o Caetano compram):** Pelo de Yeti, Presa de Lobo, Essência Gélida (do espírito), Lasca de Gelo Eterno (da sentinela).
- **Raridade:** a camada inteira conta como profundidade 4 (a mais alta), como as Criptas.
- **Único:** o Manto do Yeti Ancestral.

## 9. Luz e atmosfera
- A camada mais clara do subterrâneo: o gelo azul e os cristais emitem uma **luz fria** fraca, então os Salões ficam visíveis em tons de azul mesmo sem tocha. Fendas e Covis continuam escuros; o Coração tem pontos de luz azul dos cristais no meio do gelo negro.
- Paletas: branco-neve, azul-gelo claro, azul profundo, cinza-ardósia da rocha, castanho frio do permafrost, quase preto do gelo negro com rachaduras azul elétrico. Os yetis são brancos com sombra azul e pele cinza-escura no rosto e nas mãos.
- Flocos de neve caindo devagar em salões grandes e o bafo do herói visível são detalhes desejáveis.

## 10. Som e música
- Por enquanto usa o tema da caverna.
- Sons próprios: rugido do yeti, soco no chão, uivo do lobo, gelo rachando (o aviso do verme), o tilintar do espírito, gelo quebrando ao morrer a sentinela.

## 11. Interface e progressão
- Nome da faixa aparece ao entrar e no mapa.
- Missões do ancião com os materiais novos (pelo de yeti, presa de lobo, essência gélida).

## 12. Arte
- Mesmo padrão das outras camadas: pixel art granulada, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar. O gelo tem bolhas, rachaduras e reflexos de luz em diagonal.

## 13. Arquivos
| Arquivo | O que tem |
|---|---|
| `js/69-gelo-api.js` | ids dos blocos, paredes e camada distante, faixas, profundidades, `GELO` (liga e desliga a camada) |
| `js/70-gelo-blocos.js` | texturas, paredes, camada distante, decoração, minérios no gelo, itens de bloco, gelo escorregadio |
| `js/71-gelo-objetos.js` | os objetos de cena |
| `js/72-gelo-bichos.js` | yeti, lobo, espírito, verme, sentinela, gosma gelada: arte, IA, drops, materiais |
| `js/73-gelo-mundo.js` | geração, descidas das criptas, decoração, baús, objetos, zonas, nível e loot, save |
| `js/74-yeti-ancestral.js` | o chefe: Trono de Gelo, luta, drop |
| `docs/gelo-spec.md` | a parte técnica |

---

# Parte 5. Bioma 4: A Mina Abandonada (a quarta camada)

A parte técnica está em [mina-spec.md](mina-spec.md).

## 1. Identidade
- **Nome:** A Mina Abandonada.
- **Faixas:** Galerias Escoradas, Poços e Andaimes, Acampamento Goblin, Fornalhas Esquecidas.
- **Conceito:** uma mina de cobalto que os mineiros abandonaram quando o fundo começou a matar. Os mortos continuam cavando, o gás e os carrinhos ganharam vida, e os goblins se mudaram para lá com o que sobrou.
- **Clima:** escuro, quente e empoeirado; madeira rangendo, pingos, picaretas ao longe, brasas no fundo.

## 2. Lugar no mundo
- Debaixo das Cavernas de Gelo, de 558 a 744 m.
- **Entrada:** dois poços antigos descem do chão do Coração do Inverno: boca de madeira no gelo, poço revestido de tábuas e escada até a primeira galeria.
- **Saída:** a mesma escada. Toda parte da mina tem caminho de volta sem cavar (escadas em todo desnível alto).

## 3. Estrutura e geração
- Galerias retas e escoradas em níveis fixos, poços com escadas e andaimes, salões do acampamento com piso de tábua, salões das fornalhas e a Oficina da Escavadeira (o chefe), do outro lado do mundo em relação aos poços.
- Cavernas naturais entre as obras dos mineiros, ligadas por túneis.

## 4. Blocos
- **Sólidos:** rocha ferrosa (listrada de preto e vermelho), rejeito, entulho, tábua de mina, viga de mina, rocha cavada, tijolo de fornalha, escória, quartzito, grade de ferro do chefe.
- **Decoração de 1 bloco:** escora, trilho, lampião no gancho, escada, ferramentas largadas, monte de pedras, corda, brasa de escória, estaca com caveira.
- **Paredes de fundo:** rocha ferrosa, tabuado, rocha cavada, tijolo de fornalha, quartzito.
- **Terceira camada:** rocha, andaimes, fornalhas.
- **Minérios:** carvão na rocha ferrosa; cobalto (o único metal da mina) no quartzito e na rocha ferrosa; cristal, mais raro, é pedra preciosa (não vai para a forja, o Grimaldo compra).

## 5. Objetos de cena
28 objetos: vagonete (cheio e vazio), vagonete tombado, guincho, pilha de caixotes, barril de pólvora, beliche podre, mesa com lampião e mapa, bigorna e fole, monte de minério, carrinho de mão, mineiro morto, tenda goblin, saque dos goblins, fogueira goblin, engrenagem quebrada, fornalha, cadinho, polia com balde, lanterna grande, jaula goblin, estandarte goblin, elevador de mina, placa de galeria, ferramentas na parede, mapa da mina, pintura goblin, veio de ouro, e o Trono do Rei Goblin.

## 6. Inimigos: os mineiros e os goblins
| Monstro | O que faz |
|---|---|
| Mineiro Morto | anda até o herói e golpeia com a picareta; cava através da rocha no caminho |
| Carrinho Assombrado | parado nos trilhos até o herói ficar na linha; chacoalha, dispara e se arrebenta na parede |
| Grisu | gás que flutua, incha e explode; qualquer fogo acende antes, e um acende os outros |
| Lampião Assombrado | flutua longe e atira bolas de fogo |
| Falso Veio | um veio de ouro que abre a boca e morde, persegue pulando e se esconde de novo |
| Golem de Minério | lento e duro: soca o chão (onda e pedras do teto), arremessa blocos |
| Rato-Toupeira | rápido, morde e cava túnel até o herói |
| Goblin Dinamiteiro | veio das cavernas: joga dinamite que quica e quebra blocos |
| Goblin Gatuno | em bando; rouba ouro e foge (matando, o ouro volta) |
| Capataz Goblin | chicote longo; acelera os goblins perto |

No lugar do goblin, as Fundações Soterradas (cavernas) ganharam o **Sapo das Grutas**: pula atrás do herói e puxa com a língua.

## 7. Chefe: O Rei Goblin
Na Escavadeira, uma broca a vapor que era dos mineiros. Fase 1: investida com a broca e dinamite da cabine. Fase 2 (60%): corneta que chama goblins, pedras do teto, broca no teto. Fase 3 (25%): a máquina explode e ele luta a pé com o martelo-picareta (salto, onda no chão, feixes de dinamite). Solta o **Capacete do Rei Goblin** (lendário).

## 8. Loot e economia
Materiais novos: engrenagem enferrujada, pepita de ouro, núcleo de minério, óleo de lampião (e a pele de sapo nas cavernas). O ferreiro e a curandeira compram; o ancião tem missões novas para eles.

## 9. Luz e atmosfera
Lampiões, fogueiras, fornalhas e brasas dão luz quente; poeira caindo e brasas subindo nas fornalhas; o quartzito brilha onde tem cobalto e cristal.

## 10. Arquivos
| Arquivo | O que tem |
|---|---|
| `js/79-mina-api.js` | ids, faixas, zonas |
| `js/80-mina-blocos.js` | blocos, paredes, camada distante, decoração |
| `js/81-mina-objetos.js` | objetos de cena |
| `js/82-mina-bichos.js` | os 7 monstros da mina |
| `js/83-mina-goblins.js` | gatuno e capataz |
| `js/84-mina-mundo.js` | geração, spawn, nível, loja, missões, save |
| `js/85-rei-goblin.js` | o chefe |
| `js/86-sapo-grutas.js` | o sapo das cavernas |
| `docs/mina-spec.md` | a parte técnica |

---

# Parte 6. Bioma 5 (ideia): As Minas Fúngicas

## 1. Identidade
- **Nome:** As Minas Fúngicas (nome provisório; alternativa: Galerias de Ferroalto).
- **Faixas:** Galerias Escoradas, Veio Profundo, Lago Subterrâneo, Coração do Micélio.
- **Conceito:** uma colônia de mineração que cavou fundo demais atrás de cristal e despertou um fungo antigo. Os mineiros nunca subiram: o micélio tomou as galerias, os corpos e os túneis inundados.
- **Sensação:** claustrofobia e estranheza. Túneis estreitos de madeira rangendo, e depois cavernas enormes iluminadas por cogumelos azul-esverdeados.
- **Contraste com a catedral:** madeira e terra em vez de pedra lavrada; luz **fria e viva** (bioluminescência) em vez de vela quente; túneis apertados em vez de salões.
- **Referências:** Moria, as minas de Darkest Dungeon, cavernas de cogumelo de Terraria e Hollow Knight.

## 2. Lugar no mundo
- **Onde:** decisão em aberto (ver fim desta parte). Proposta: abaixo da catedral, a partir de ~380 m, o que exige aumentar de novo a altura do mundo.
- **Entrada:** pelo fundo das Criptas, um poço de mina antigo com elevador quebrado (corrente para descer) que a catedral escondia.

| Faixa | Caráter |
|---|---|
| Galerias Escoradas | túneis de 3 a 5 blocos de altura com escoras de madeira, trilhos, primeiras manchas de fungo |
| Veio Profundo | poços verticais, andaimes, escadas de mão, cavernas naturais com veios de minério à mostra |
| Lago Subterrâneo | cavernas largas alagadas, plataformas de madeira, cogumelos gigantes |
| Coração do Micélio | rocha tomada por carne fúngica, cordões de micélio, câmara do chefe |

## 3. Estrutura e geração
- **Massa:** xisto escuro e argila; veios de minério mais grossos que na catedral.
- **Tipos de sala:** galeria (túnel com escoras), câmara de extração (mais larga, com guindaste), dormitório dos mineiros, depósito, poço vertical, caverna natural, gruta alagada, câmara do micélio.
- **Estrutura com regra própria:** escoras de madeira (poste e viga) sempre do chão ao teto, como as colunas; se quebrar, o teto daquele trecho **desaba** (escombros caem), o que vira um perigo e uma armadilha.
- **Trilhos** seguem o chão das galerias; **água** parada nas grutas (se o jogo ainda não tem água, entra como bloco decorativo raso ou fica para depois).
- **Estragos:** desabamentos antigos, galerias inundadas até a metade, fungo rompendo as paredes.

## 4. Blocos

### Sólidos da frente
| | Bloco | Uso |
|---|---|---|
| [ ] | Xisto | a massa natural; recebe minérios |
| [ ] | Argila úmida | bolsões macios, cava rápido |
| [ ] | Rocha britada | entulho de desabamento |
| [ ] | Tábua de mina | pisos e plataformas |
| [ ] | Viga escorada | vigas horizontais do teto |
| [ ] | Rocha fúngica | pedra coberta de fungo, solta esporos ao quebrar |
| [ ] | Carne de micélio | parede orgânica do Coração (pulsa devagar) |
| [ ] | Grade de mina | grade de ferro dos elevadores |

### Decoração de 1 bloco
| | Nome | Nota |
|---|---|---|
| [ ] | Escora (poste) | não sólida, chão ao teto, base, meio e topo |
| [ ] | Trilho | no chão das galerias |
| [ ] | Cogumelo pequeno (3 cores) | **luz fria** |
| [ ] | Cordão de micélio | pendurado do teto, como as raízes |
| [ ] | Lanterna de mineiro | **luz quente**, rara, só nas galerias de cima |
| [ ] | Picareta enferrujada, balde, pá | chão |
| [ ] | Gotejo | teto das grutas, gota animada |

### Paredes de fundo
| | Parede |
|---|---|
| [ ] | Xisto natural |
| [ ] | Tabuado (paredes de madeira das galerias) |
| [ ] | Rocha cavada (marcas de picareta) |
| [ ] | Fungo de parede (manchas, sem cor própria: a cor vem dos objetos) |
| [ ] | Micélio (fios finos) |

### Terceira camada
| | Bloco |
|---|---|
| [ ] | Xisto distante |
| [ ] | Andaimes distantes (galerias vistas lá no fundo) |
| [ ] | Cogumelos gigantes distantes (silhuetas) |

### Minérios
- Carvão, ferro e ouro em veios grossos; **cristal** comum aqui (era o que os mineiros buscavam).
- [ ] Minério novo: **Esporita**, cristal verde-azulado que só existe no Coração do Micélio (material de equipamento novo).

## 5. Objetos de cena
**No chão**
| | Objeto | Nota |
|---|---|---|
| [ ] | Vagonete (inteiro e tombado, cheio de minério) | sobre o trilho |
| [ ] | Guindaste de madeira | câmaras de extração |
| [ ] | Pilha de caixotes | depósito |
| [ ] | Barril de pólvora | depósito; pode explodir (ideia para depois) |
| [ ] | Beliche podre | dormitório |
| [ ] | Mesa com lampião e mapa | dormitório, **luz** |
| [ ] | Bigorna velha e fole | oficina da mina |
| [ ] | Cogumelo gigante (3 tamanhos) | grutas, **luz fria** |
| [ ] | Mineiro fossilizado no fungo | estátua macabra, preso na parede |
| [ ] | Monte de minério | perto dos vagonetes |

**No teto**
| | Objeto | Nota |
|---|---|---|
| [ ] | Polia com corda e balde | poços |
| [ ] | Lampião pendurado | **luz quente** |
| [ ] | Cacho de esporos brilhantes | **luz fria**, solta partículas |
| [ ] | Estalactite fúngica | grutas |

**Na parede de fundo**
| | Objeto | Apoio |
|---|---|---|
| [ ] | Elevador de mina (estrutura e gaiola) | pé no chão |
| [ ] | Placa de galeria ("Galeria 3", com seta) | altura do olho |
| [ ] | Ferramentas penduradas | altura do olho |
| [ ] | Mapa da mina riscado | altura do olho |
| [ ] | Repisa de cogumelos de prateleira | altura do olho, **luz fria** |
| [ ] | Rombo no tabuado mostrando a rocha | pé no chão |

## 6. Inimigos: os Tomados (família fúngica)
| | Inimigo | Papel |
|---|---|---|
| [ ] | Mineiro Tomado | lento, picareta com preparação longa, golpe forte |
| [ ] | Capataz Tomado | lampião numa mão e chicote; puxa o herói para perto |
| [ ] | Rastejante | aranha-fungo do teto, desce por um fio e morde, sobe de novo |
| [ ] | Bolor Andante | massa que solta nuvem de esporos (veneno lento, área no chão como a poça do vomitador) |
| [ ] | Toupeira Cega | escava pela terra macia e emerge embaixo do herói (aviso: o chão treme) |
| [ ] | Sentinela de Esporita | cristal vivo, parado, atira estilhaços; fraco por trás |

**Spawn por faixa (rascunho)**
| Faixa | Monstros |
|---|---|
| Galerias Escoradas | Mineiro Tomado, Rastejante |
| Veio Profundo | Mineiro, Capataz, Rastejante, Toupeira |
| Lago Subterrâneo | Mineiro, Bolor, Rastejante, Toupeira |
| Coração do Micélio | Capataz, Bolor, Toupeira, Sentinela |

## 7. Chefe: A Mãe-Esporo
- **Onde:** câmara redonda no Coração do Micélio, paredes de carne de micélio.
- **Ideia:** um cogumelo colossal enraizado no chão e no teto, com o corpo do primeiro capataz preso no tronco.
- **Fases:** 1) chuva de esporos em áreas marcadas e invoca Rastejantes; 2) raízes saem do chão em linha (aviso pelo chão rachando) e o capataz se solta para lutar ao lado; 3) a câmara escurece, só os pontos fracos brilham.
- **Drop lendário (ideia):** **Lampião da Mãe-Esporo** (acessório de luz: ilumina em volta do herói, regenera vida devagar enquanto parado no escuro).

## 8. Loot e economia
- Itens de bloco: xisto, tábua, viga, argila.
- Baús e **vagonetes saqueáveis** com minério e ferramentas.
- Materiais novos: **Esporita** (minério), **Esporo** (drop, poção nova), **Couro de toupeira**.
- Bases de equipamento temáticas: picareta de mineiro (ferramenta e arma), capacete com lanterna, botas de borracha de seiva.

## 9. Luz e atmosfera
- Galerias de cima: escuro com lampiões quentes raros.
- Mais fundo: a luz passa a ser **toda fria** (azul, verde, ciano) dos cogumelos, mais forte que velas, cobrindo áreas grandes.
- Partículas: esporos flutuando, gotas caindo, poeira quando uma escora range.
- Paletas: madeira úmida, xisto azulado, fungo verde-azulado, carne de micélio rosada pálida.

## 10. Som e música
- Tema próprio: madeira rangendo, pingos com eco, um pulso grave lento (o "coração" do fungo) que fica mais forte perto do chefe.
- Sons: picareta distante batendo na rocha (sem ninguém lá), rangido de escora antes de desabar.

## 11. Decisões em aberto
- [ ] **Onde fica:** (a) abaixo da catedral, aumentando a altura do mundo; (b) ao lado da catedral, na mesma profundidade, dividindo o mundo na horizontal; (c) dentro das Cavernas, como uma faixa delas. Recomendo (a), porque mantém a progressão "quanto mais fundo, mais perigoso".
- [ ] Água de verdade (nadar) ou só decorativa.
- [ ] Escoras que desabam o teto: perigo divertido ou irritante?

---

# Parte 7. Outras ideias soltas (só o conceito)

Para escolher quais viram ficha completa depois.

| | Bioma | Ideia em uma linha |
|---|---|---|
| [ ] | **Catacumbas Alagadas** | esgotos e cisternas romanas abaixo do vilarejo, água negra, ratos gigantes e afogados |
| [ ] | **Forja dos Anões** | cidade de pedra e bronze abandonada, lava canalizada, autômatos de ferro, a origem da forja do Grimaldo |
| [ ] | **Floresta Petrificada** | uma floresta inteira engolida pela terra e virada pedra, árvores de cristal, bestas de raiz |
| [x] | **O Abismo** (no lugar da antiga cripta do Carrasco) | FEITO em 2026-10-09: a quinta camada, debaixo da mina (744 a 930 m), 10 demônios e o Príncipe do Caos. Ficha em `docs/abismo-spec.md` |
| [ ] | **Cidade Afundada** | uma cidade inteira soterrada com ruas, casas e torres tortas, saqueadores e cultistas vivos (inimigos humanos) |
