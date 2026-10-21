# O Campo da Última Guerra: ficha de implementação

> **2026-10-21:** feita direto no formato das camadas novas: 558 m (o desenho de 186 m esticado `LAYER_K = 3` vezes, faixas 3 vezes mais altas e 3 andares de salas por faixa, [00-geral.md](00-geral.md), seção 1b). Os metros abaixo são os do desenho de 186 m; dentro da camada cada um vale 3. Nada de metro ou nível fica escrito à mão: o topo é o fim da camada de cima (`camadaAcima('guerra')`) e os níveis saem da posição no registro (129).

Camada 17 (níveis 81 a 85), debaixo da Prisão dos Deuses e em cima do Abismo. É o lugar onde anjos e demônios lutaram a última guerra antes de o Inferno ser fechado embaixo: um campo de batalha sem fim que a terra engoliu, com as armas ainda fincadas no barro e os cavaleiros caídos dos dois lados ainda de pé. No fundo, o General Caído ainda segura o último estandarte.

**O que a diferencia:** é a única camada que é **um lugar de guerra** e não de bicho: tudo foi feito por gente (trincheiras, paliçadas, bastiões, trabucos) e depois largado no meio da luta. Os monstros são soldados, não feras: andam em formação, um protege o outro, um dá força ao outro. Nada aqui é do inferno de verdade (isso é o Abismo, logo abaixo): é terra pisada, ferro de batalha, o mármore dos bastiões dos anjos e a rocha queimada por onde os demônios subiram. A luz é de auréolas caídas, penas e brasas.

## 1. Identidade

- **Nome:** O Campo da Última Guerra. Faixas: Campo das Lâminas, Bastiões Partidos, A Brecha, O Último Estandarte.
- **Conceito:** os dois exércitos se encontraram aqui e nenhum dos dois voltou. A terra cobriu o campo andar por andar; embaixo dele ficou tudo como estava no último dia.
- **Sensação:** luto, peso, um silêncio que ainda soa a ferro. Grandeza triste: os anjos também caíram.
- **Referências:** as guerras do céu de Milton (Paraíso Perdido), os campos de batalha de Berserk e Dark Souls (Farron, Ringed City), os estandartes rasgados e as armaduras de placa da fantasia medieval sombria. Nada futurista.

## 2. Lugar no mundo

| Zona | Faixa | Metros (desenho) | Massa | Caráter |
|---|---|---|---|---|
| 89 | Campo das Lâminas | 0 a 46 | terra de batalha, barro pisado, ferro de batalha | campos abertos de chão plano, trincheiras retas de barro e paliçada, lanças e espadas fincadas em toda parte |
| 90 | Bastiões Partidos | 46 a 98 | mármore celeste, cantaria dos anjos | salões e torres dos anjos, escadas de cerco, patamares de paliçada, penas petrificadas no teto |
| 91 | A Brecha | 98 a 150 | rocha queimada, rocha em brasa, tijolo de fosso | grutas abertas pelos demônios, trincheiras de tijolo, fendas acesas |
| 92 | O Último Estandarte | 150 a 186 | terra, rocha queimada, ferro de batalha | os campos maiores, as Valas dos Caídos, O Campo do Estandarte |

- **Monstros:** `layerLvl(layerLo('guerra'), d)`: 81 em cima, até 84 no fundo (30% vêm 1 nível acima). Vida `×(1 + 0,3(lvl − 1))`, dano `×(1 + 0,2(lvl − 1))`, XP baixo (o 18% de sempre).
- **Entradas:** duas, vindas das saídas da camada de cima (`A.halls`). Cada uma é um poço de 4 de largura com a escada de cerco, que abre no teto de uma **câmara de pouso** 14 x 6 de cantaria, acesa por duas auréolas caídas e com uma espada fincada; não nasce monstro nela. Depois da porta, um campo.
- **Saídas:** duas **Valas dos Caídos** no fundo, longe uma da outra e do Campo do Estandarte: valas de 5 de largura com escada de cerco e um patamar de paliçada, até a última linha. Ficam em `guExits` (`cx`, `fy`, `top`), que o Abismo lê.
- **A descida pelo chefe (353):** o caminho natural para o Abismo sai do chão do Campo do Estandarte e abre quando o General cai.

## 3. Estrutura e geração (`js/405-guerra-mundo.js`)

O molde é o do Covil (275). Em passos:

1. **A rocha por faixa.** As primeiras linhas afinam da rocha de cima para a terra de batalha. Lâminas: terra com bolsões de barro e ferro de batalha. Bastiões: mármore e cantaria. Brecha: rocha queimada com rocha em brasa. Estandarte: terra, rocha queimada e ferro.
2. **As salas.**
   - As duas descidas e os pousos.
   - O Campo do Estandarte, do outro lado do mundo: a caixa maciça de rocha queimada que o 406 veste, e os dois corredores de 24 a 34 blocos até um campo.
   - As duas Valas dos Caídos.
   - Por faixa: campos de chão plano e trincheiras (Lâminas); salões e torres com escada e patamar (Bastiões); grutas e trincheiras de tijolo (Brecha); os campos grandes (Estandarte).
3. **As ligações.** Túneis de minhoca nas Lâminas, na Brecha e no Estandarte, galerias retas com degraus nos Bastiões, e 3 x `WSC` rampas por divisa de andar.
4. **As cascas.** Barro e paliçada nas trincheiras, cantaria e mármore nos bastiões, tijolo de fosso na Brecha, brasa em volta das grutas.
5. **Os veios.** Carvão na terra, no barro e na rocha queimada; belicita perto do ferro de batalha e da rocha queimada.

Depois (`guAfter`):

- tudo alcançável a partir das descidas;
- a decoração de 1 bloco por faixa e os objetos (402).

Por fim:

- O Campo do Estandarte (`guDress`, 406).
- As bocas (`guExitClear`).
- A subida garantida (`guClimbFix`, o mesmo do 275).
- **`guDropFix`:** toda borda com 5 ou mais de queda ganha uma corda de cerco (nos Bastiões, escada de cerco) na coluna da queda, da altura da borda até o chão de baixo. Assim nenhum desnível de 5+ fica sem subida.

O 87 liga o resto depois.

## 4. Blocos (`js/401-guerra-blocos.js`)

Rampas de 6 tons, luz de cima à esquerda, 12 x 12.

| Id | Bloco | Dureza | Notas |
|---|---|---|---|
| 960 | terra de batalha | 0,8 | a massa do Campo, com pontas de ferro e ossos na textura |
| 961 | barro pisado | 0,6 | trincheiras, marcas de bota |
| 962 | ferro de batalha | 1,6 | sucata de armaduras e armas prensada |
| 963 | mármore celeste | 1,5 | a pedra dos bastiões, veio dourado |
| 964 | cantaria dos anjos | 1,6 | o mármore em blocos |
| 965 | rocha queimada | 1,3 | onde os demônios entraram; é o `thin` da camada |
| 966 | rocha em brasa | 1,3 | a mesma ainda acesa por dentro (`EMIT` 0,42): brilha e não queima |
| 967 | penas petrificadas | 1,1 | asas que caíram e viraram pedra |
| 968 | tijolo de fosso | 1,2 | as trincheiras dos demônios |
| 969 | paliçada | 0,5 | estacas amarradas: pisos e pontes |
| 970 | muralha de escudos | 0 | inquebrável: fecha as portas do Campo do Estandarte durante a luta; nunca vai para o save |
| 971 | carvão | | copia o carvão de sempre |
| 972 | belicita | 1,9 | o minério da camada (seção 8) |

- **Decoração, de 976 a 990, sem colisão:** escada de cerco e corda de cerco (as duas escalam, ligadas ao `CHAIN`), lança, espada e elmo fincados, pena de anjo (luz fria e fraca, solta `pena_anjo`), fenda em brasa (luz quente), flâmula rasgada (teto, solta `trapo_estandarte`), flechas fincadas, ossos, corrente, lança gigante, escudo caído, auréola caída (luz dourada; marca os pousos) e espinho de ferro.
- **Paredes, de 138 a 142:** terra, mármore, rocha queimada, tijolo de fosso e paliçada.
- **Terceira camada, de 87 a 89:**
  - o campo ao longe: lanças e estandartes contra o escuro;
  - as muralhas dos anjos ao longe;
  - o clarão do fogo que sobe da Brecha.

## 5. Objetos de cena (`js/402-guerra-objetos.js`)

São 13 objetos, com 2 variantes cada; o plano por faixa fica em `GU_PROP_PLAN`.

- **No chão:**
  - o cavalo de guerra morto
  - o monte de armas
  - o cavaleiro morto de pé, preso na lança
  - o trabuco quebrado: só nos campos
  - a estátua de anjo, de 4 de altura
  - o altar de campanha, com velas: só nos bastiões
  - o crânio de demônio, com as órbitas em brasa
  - o tambor de guerra
- **No teto:** o estandarte rasgado e a gaiola de enforcado.
- **No fundo:** os escudos na parede, a asa de pedra (que fica no chão) e as flechas na parede.

A luz vem dos pontos marcados na arte de cada objeto: brilho, brasa e pena.

## 6. Os 10 monstros (`js/403-guerra-caidos.js` e `js/404-guerra-hostes.js`)

Todo ataque tem aviso, e nenhum bicho dá dano de contato. Todos usam a linha de visão. Os que andam usam a busca de caminho (`NAV_WALKERS`), e os humanoides de 12 x 22 sobem escada pelo 356.

| Bicho | Tamanho | Como luta | O aviso |
|---|---|---|---|
| Cavaleiro Caído | 10 x 22 | segura golpes de frente com o escudo (`BLOCK_E`); golpe de escudo e corte | bate a espada no escudo duas vezes, e a lâmina acende |
| Arqueiro da Chuva | 9 x 22 | fica longe; a saraivada cai de cima em 3 pontos em volta do herói | o arco aponta para o alto e 3 marcas vermelhas ficam 0,9 s no chão |
| Porta-Estandarte | 10 x 22 | quem luta perto dele (6 blocos) bate 30% mais forte; varre na frente | a aura dourada no chão mostra o alcance; a haste sobe por 0,7 s |
| Soldado Enterrado | 10 x 22 | dorme debaixo do barro; sobe estocando, luta e se enterra de novo | a lama borbulha 0,7 s debaixo do herói |
| Penitente do Mangual | 10 x 22 | avança girando por 1,5 s e depois fica tonto 1,2 s (leva 1,4 vez o dano) | o mangual gira por cima da cabeça e o assobio sobe por 0,6 s |
| Serafim Quebrado | 10 x 16, voa | fica no alto e joga a lança de luz | a auréola acende e a linha de mira dura 0,7 s; trava nos últimos 0,2 s |
| Revoada de Corvos | 7 x 6, voa | nasce em bando de 4, voa em roda e mergulha um de cada vez | o corvo para no ar e abre as asas por 0,4 s |
| Demônio de Cerco | 14 x 28 | marreta direta e onda de choque de 7 blocos pelo chão (pula-se por cima) | ergue a marreta por 1 s e as rachaduras marcam o chão |
| Clérigo do Juízo | 10 x 22 | dá a um aliado um escudo dourado (60% menos dano por 4 s); de perto, a consagração explode | o brilho mostra quem tem escudo; o círculo cresce 0,8 s no chão |
| Lâmina Errante | 6 x 14, voa | parece uma espada fincada; voa reto, crava na parede e fica 2 s presa (leva 1,5 vez o dano). Voando, o golpe só desvia | treme e brilha por 0,6 s |

**Spawn por faixa:** cada faixa usa 5 ou 6 deles (`CATH_SPAWN`).

| Faixa | Bichos | Máximo ao mesmo tempo |
|---|---|---|
| Lâminas | enterrado, lâmina, corvos, cavaleiro, arqueiro | 8 |
| Bastiões | cavaleiro, serafim, clérigo, penitente, corvos | 9 |
| Brecha | arqueiro, cerco, porta-estandarte, enterrado, lâmina, penitente | 9 |
| Estandarte | cerco, porta-estandarte, serafim, clérigo, arqueiro, cavaleiro | 10 |

Nada nasce nos pousos, no Campo do Estandarte nem nas Valas. Para a morte, o 409 põe os 10 no `MORTE_TIPOS`:

- os de armadura racham em placas e soltam faíscas;
- o serafim e os corvos se desfazem no ar;
- a lâmina se parte em lascas de aço.

## 7. Chefe: O General Caído (`js/406-general-caido.js`)

**O Campo do Estandarte** é um oco de 100 x 30 com teto em arco, no fundo da camada, do outro lado do mundo das descidas.

- O chão é de ferro de batalha e é protegido.
- Há duas portas no pé das paredes, de 4 de altura.
- Há dois baluartes de cantaria, de 8 x 5, com a escada de cerco do lado de dentro e duas auréolas em cima.
- No meio fica **O Estandarte**: a haste alta com o pano dourado dos anjos, presa por duas cordas a duas estacas fincadas no chão.
- Não há trono. A sala é o estandarte e a cavalaria que ele ainda chama.

Ao entrar, o General acorda, e a **muralha de escudos** (970, inquebrável) fecha as duas portas. Ele é 12 x 24, de armadura negra com fio de ouro, asas queimadas e coroa de chifres.

**Números:**

| Atributo | Valor |
|---|---|
| Nível | `layerBossLvl('guerra')` |
| Vida | `330 × (1 + 0,3(L − 1))` |
| Dano | `9 × (1 + 0,2(L − 1))` |
| XP | 560 |

O BAL do 49 escala tudo isso depois.

### Fase 1: o estandarte de pé

- Enquanto o estandarte está erguido, o General leva 70% menos dano e não passa de 60% da vida.
- **Corte:** a espada sobe por 0,55 s.
- **Investida:** ele agacha 0,7 s, a marca corre pelo chão e ele avança 6 blocos.
- A cada 8 s, o estandarte levanta um caído:
  - um pilar de luz fica 1,2 s no chão;
  - depois sai dele um Cavaleiro Caído ou um Arqueiro da Chuva;
  - podem existir até 3 ao mesmo tempo, sem XP e sem loot.
- Para derrubar o estandarte:
  1. quebrar as duas estacas, e as cordas soltam;
  2. quebrar o pé da haste, que antes disso não toma dano.

### Fase 2: o estandarte caído

- Ele vai até o estandarte e o arranca do chão (1,6 s, sem tomar dano).
- Daí em diante luta com ele como alabarda:
  - **Varrida:** a haste vai para trás por 0,7 s e passa larga na frente.
  - **Investida.**
- A cada 14 s vem **A Carga**:
  - a corneta soa;
  - marcas de casco cobrem todo o chão por 1,6 s;
  - uma onda de cavalaria espectral atravessa o Campo de porta a porta, a 300 px/s;
  - ela pega quem estiver a até 2 blocos do chão;
  - para escapar, sobe-se num baluarte ou pula-se por cima.

### Fase 3: abaixo de 33%

- Ele finca o estandarte no meio do Campo e o pano pega fogo do inferno.
- Volta à espada.
- **Salto do Juízo:** uma sombra cresce por 1 s no chão debaixo do herói. Ele cai ali, e a onda corre para os dois lados.
- **As Fendas:** a cada 4,5 s, três linhas acendem no chão por 1 s, uma delas debaixo do herói, e estouram em fogo.
- A Carga vem a cada 18 s.

### Reinício e vitória

- **Reinício:** sair do Campo, usar portal ou morrer faz tudo voltar:
  - o estandarte volta de pé, com as estacas;
  - os caídos e o General somem;
  - a muralha abre.
- **Vitória:**
  - cai **A Lança do General** (lendário, seção 8) e uma das três bases;
  - além dela: belicita (6 a 10), medalhas, penas, chifres, poções e ouro;
  - a morte fica no save (`generalCaido.dead`);
  - o caminho do 353 desaba no chão do Campo.

## 8. Loot e economia (`js/407-guerra-metal.js` e 405)

**O metal: a belicita.**

- O aço dos anjos e o ferro dos demônios se fundiram no calor da Brecha. É cinza-vinho, com um fio dourado.
- São 8 minérios por barra.
- Na forja, as 9 peças ficam com o nível de item `layerForgeIl('guerra')`.
- Valores: minério 64, barra 520.

**Carvão:** os veios de sempre.

**As 3 bases raras.** Têm o nível de `layerLo('guerra')` e só caem aqui:

| Base | Tipo | Bônus base |
|---|---|---|
| Espada de Anjo Caído | espada | crítico 18% |
| Escudo de Muralha | escudo-torre | defesa 8, aparo 18%, um pouco mais lento |
| Elmo de Chifres do Caído | elmo | defesa 8, vida +16 |

**O lendário: A Lança do General.**

- É uma lança de raridade 4.
- Dá +6% de dano para cada inimigo a até 5 blocos do herói, até +30%.
- Também dá crítico +5% e dano +10%.

**Materiais e quem compra:**

| Material | Valor | Quem compra |
|---|---|---|
| pena de anjo | 30 | a curandeira |
| chifre de demônio | 30 | o ferreiro |
| trapo de estandarte | 26 | o ferreiro |
| medalha de guerra | 95 | o taverneiro |

O ferreiro também compra a belicita e o ferro de batalha.

**Sem baús e sem missões.**

## 9. Luz e atmosfera

- A luz é só natural:
  - auréolas caídas (douradas);
  - penas (frias);
  - fendas e rocha em brasa (quentes);
  - os pontos de brilho dos objetos.
- Partículas por faixa:
  - poeira e cinza fria sobre o campo, nas Lâminas;
  - uma pena clara descendo, nos Bastiões;
  - fagulhas subindo, na Brecha;
  - a poeira levantada pelos cascos, no Estandarte.

## 10. Som

O ambiente fica no formato DEF (`camadaExt.ambiente`):

| Faixa | Sons |
|---|---|
| Lâminas e Estandarte | vento largo e baixo, assobio e corvos |
| Bastiões | um coro sem palavras e o sino raro |
| Brecha | o ronco do fogo embaixo, correntes e rachaduras |
| Estandarte | cascos distantes e o gemido dos caídos |

Cada monstro e o General têm sons próprios: `sfx.gu*` e `sfx.gen*`.

## 11. Arquivos

| Arquivo | O que tem | Entra depois de |
|---|---|---|
| `js/400-guerra-api.js` | ids, faixas `GU_BANDS`, `GU_ZONE0 = 89`, `guerraBand`, os postos (`guEntries`, `guLand`, `guExits`, `guBoss`...), o registro (`camadaNomes`, `camadaExt`) | 295 (antes do 103) |
| `js/401-guerra-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, escada e corda escaláveis, brilho; o pintor `GUART` | 400 |
| `js/402-guerra-objetos.js` | 13 objetos e `GU_PROP_PLAN` | 401 |
| `js/403-guerra-caidos.js` | os 5 caídos e o `GUE` (marcas, flechas, ondas, lanças, faíscas) | 402 |
| `js/404-guerra-hostes.js` | as 5 hostes | 403 |
| `js/405-guerra-mundo.js` | geração, `guDropFix`, zonas, spawn, nível, partículas, forja, lojas | 404 |
| `js/406-general-caido.js` | o Campo do Estandarte, o General, a Lança, o save do chefe | 287 (antes do 117 e do 49) |
| `js/407-guerra-metal.js` | a belicita, os materiais e as 3 bases | 288 (antes do 110) |
| `js/408-guerra-save.js` | os nomes das zonas 89 a 92, por índice | 299 (antes do 310) |
| `js/409-guerra-morte.js` | o `MORTE_TIPOS` dos 10 | 360 (antes do 361) |

`GUERRA` vale `true` e liga a camada. O wg não sobe.

## 12. Decisões

1. **Sem trono: a sala é o estandarte.** A luta muda três vezes pelo que acontece com o estandarte: de pé ele protege o General e levanta caídos, arrancado vira a arma dele e chama a Carga, fincado em fogo abre as fendas. Para quebrá-lo é preciso ir até as estacas e a haste, longe do General: o herói anda pelo Campo inteiro em vez de ficar parado na frente do chefe.
2. **A Carga é desviada pelo lugar, não pelo reflexo:** os baluartes com escada existem para isso. Os cascos marcam o chão 1,6 s antes, e a onda só pega quem está a até 2 blocos do chão.
3. **Os lacaios do estandarte não dão nada** (sem XP e sem loot), para não virar fazenda.
4. **O General não passa de 60% da vida com o estandarte de pé, nem de 32% antes da fase 3:** as três fases sempre acontecem, mesmo com dano alto.
5. **A muralha de escudos é inquebrável e nunca vai para o save** (filtrada dos `diffs`): um save feito durante a luta não deixa o Campo fechado.
6. **O caminho do 353:** a vitória chama o `endBossFight` do jeito do molde (o embrulho do 406 responde sozinho). Quem abre o caminho é o `js/363-descida-vitoria.js`, que embrulha por fora de todos os chefes.
7. **Corda em todo desnível de 5 (`guDropFix`):** a regra da casa pede escada em todo desnível de 5 ou mais. A busca de subida do 275 (`guClimbFix`) só garante que se volta; o `guDropFix` põe a corda de cerco (nos Bastiões, escada) na própria queda. Ele roda antes e depois do `guClimbFix`: antes, para o `guClimbFix` ter menos a consertar; depois, para os consertos dele.
8. **Os humanoides usam o boneco do herói** (o `heroPaint`, quadro de 40 x 34 com o boneco em 14, 9): mesmos encaixes, armas que passam do corpo (lança, alabarda, arco).

## 13. Como ficou no jogo (2026-10-21)

- **Lugar e números:** 17ª posição do registro. Na cópia de trabalho a camada de cima era a Cidade dos Antigos; `camadaAcima('guerra')` acha a Prisão quando ela existir.
- **Faixas (semente 12345):**

  | Faixa | Linhas |
  |---|---|
  | Lâminas | 7301 a 7439 |
  | Bastiões | 7439 a 7595 |
  | Brecha | 7595 a 7751 |
  | Estandarte | 7751 a 7859 |

- **Níveis:**
  - monstros nascem em `layerLvl(layerLo('guerra'), d)`;
  - o General em `layerBossLvl('guerra')`;
  - as peças de belicita em `layerForgeIl('guerra')`;
  - as bases em `layerLo('guerra')`.
- **Gemas:** a camada pega os blocos de gema 216 a 220 (o 117 passa do 167 desde antes desta camada; nenhum outro bloco usa 168 a 220).

**Testes (Chromium sem tela, pelo `run.sh`):**

- **8 sementes:** 7932, 15851, 23770, 31689, 39608, 47527, 55446 e 63365.
  - Nenhum erro.
  - Sempre 2 entradas, 2 saídas e o Campo do Estandarte alcançável.
  - Alcance a partir das entradas, com as rotas do 353 abertas: 100% em 7 sementes e 99,9% em uma.
  - Alcance a partir do vilarejo, com o `wreach` e as rotas abertas: 100% (semente 12345).
- **Desníveis:** sobram de 10 a 18 bordas de 5 ou mais sem subida por semente (eram 245 antes do `guDropFix`). As de mais de 15 (4 a 7 por semente) são o poço do próprio 353 no chão do Campo. Para comparar, as outras camadas têm de 229 a 3021 bordas assim.
- **As saídas:** o Abismo desce das duas Valas, com o poço dele na mesma coluna, logo abaixo do selo do 353.
- **Teleporte de Testes:** cai dentro de cada uma das 4 faixas, na zona certa (89 a 92), sem ficar dentro da rocha.
- **Os 10 monstros:** todos nascem, entram nos estados de ataque e acertam o herói com o modo deus.
  - Cavaleiro: batida, golpe de escudo e corte.
  - Arqueiro: mira e saraivada.
  - Porta-estandarte: varrida.
  - Enterrado: enterrado, bolha, sobe, estoca.
  - Penitente: giro e tonto.
  - Serafim: mira e lança.
  - Corvos: pairar e mergulho.
  - Cerco: marreta e onda.
  - Clérigo: escudo e consagração.
  - Lâmina: treme, voa, cravada.
- **A luta inteira com `deusOn = true`** (sem o um-golpe-mata; o herói bate devagar), em 84 s:
  - estacas, haste, fase 2 com 3 Cargas, fase 3 com fendas e 2 Saltos do Juízo;
  - até 3 caídos levantados;
  - vitória com a Lança do General e uma base;
  - a muralha abre, o caminho do 353 abre por inteiro (240 de 240 blocos) e o save fica com `generalCaido.dead` sem muralha nos `diffs`.
- **Reinício e save:**
  - sair do Campo e morrer reiniciam tudo: estandarte de pé, nada vivo, muralha aberta, vida cheia ao voltar;
  - depois de salvar e carregar, o General continua morto, a luta não começa e o caminho continua aberto.
- **Tempo de geração (semente a semente):**

  | Passo | Tempo |
  |---|---|
  | `guBuild` | 0,3 a 0,9 s |
  | `guAfter` | 0,3 a 0,6 s |
  | `guClimbFix` | uns 4 s (o mesmo do Covil, 3,8 a 5,9 s, e do Ossário, 3,9 a 5,2 s, na mesma máquina) |
  | `guDropFix` | menos de 0,1 s |
