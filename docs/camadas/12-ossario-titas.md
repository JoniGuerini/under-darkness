# O Ossário dos Titãs: ficha de implementação

A camada 12, de 2046 a 2232 m, debaixo do Covil do Dragão e em cima da Cidade dos Antigos. É o cemitério dos gigantes que seguravam o mundo: os ossos deles são o próprio terreno, costelas viram arcos, crânios viram cavernas e espinhas viram pontes sobre o vazio. No fundo, meio enterrado, o Último Titã ainda respira, e a luta contra ele é escalar o corpo dele.

**O que a diferencia:** é a única camada em que o terreno é um corpo, na escala do mundo: um osso aqui tem 60 blocos, e o herói anda por dentro dele. Os ossos da Catedral e do Abismo são enfeite do tamanho de gente; aqui não há mortos-vivos, nem carne, nem fogo: só marfim seco, pó, vento e silêncio, depois do calor dourado do Covil.

---

## 1. Identidade

- **Nome:** O Ossário dos Titãs. **Faixas:** Campo das Costelas, A Espinha, Vale dos Crânios, Leito do Último.
- **Conceito:** quando os titãs perderam a guerra, Cronos e os seus foram derrubados para baixo do mundo e ficaram ali. A carne virou pó há eras; sobraram os ossos, as placas de armadura de bronze e as lascas da foice de adamantita que os cortou. Os filhos menores deles (ciclopes, hecatônquiros, erínias) ainda vivem entre os ossos, e os carniceiros vêm de toda parte roer o que resta. No fundo, um titã não morreu de todo.
- **Sensação:** pequenez, vertigem e luto. Tudo é grande demais, quieto demais e muito velho.
- **Referências:** Shadow of the Colossus, o Deus Morto de Hollow Knight, as ossadas de Nausicaä, o mito de Cronos e a Titanomaquia.
- **Contraste com as vizinhas:** o Covil é quente, dourado e cheio de dono; o Ossário é frio, marfim e abandonado. A Cidade dos Antigos, embaixo, é geometria reta; aqui não existe linha reta, só curva de osso.

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 53 | Campo das Costelas | 2046 a 2092 | cinza assentada, rocha fóssil, osso de titã | caixas torácicas como salões em arco, chão de pó de osso, a cinza do vulcão ainda cobrindo os primeiros ossos |
| 54 | A Espinha | 2092 a 2144 | rocha fóssil, osso de titã, cartilagem seca | desfiladeiros fundos cruzados por espinhas: vértebras viram ponte, discos de cartilagem viram degrau |
| 55 | Vale dos Crânios | 2144 a 2196 | osso de titã, esmalte de dente, bronze titânico | crânios como cavernas, órbitas como janelas, dentes como colunas, elmos de bronze tombados |
| 56 | Leito do Último | 2196 a 2232 | osso esponjoso, rocha fóssil, bronze titânico | o osso fica poroso e quente, lascas da foice cravadas, o Leito do Titã |

- **Constantes:** `TT_D = 186`, `TT_BANDS = [0, 46, 98, 150, 186]`, `TT_ZONE0 = 53`, `titanBand(ty)`, topo e `TT_S0` pelo registro `LAYERS`.
- **Nível dos monstros:** 25 na metade de cima da camada e 26 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, mas nunca passam de 26, então nenhum monstro daqui fica abaixo ou no nível da camada de cima.
- **Entrada (vinda do Covil):** as duas descidas dos **Tubos Frios** saem do Leito de Ouro do Covil (`dgExits`): tubos de lava antigos e frios que caem quase na vertical. A escada de cravos dos kobolds vai até a metade; dali para baixo continua uma **escada de ossos amarrados** com tendão, feita pelos catadores. O tubo atravessa a rocha fóssil e sai pela **órbita de um crânio de titã** enterrado no teto do Campo das Costelas: o herói desce pela escada de dentro do crânio e sai pelo buraco do olho. Volta-se pela mesma escada.
- **Câmara de pouso:** dentro do próprio crânio de entrada, no chão da caixa craniana: 16 x 6, plano, 2 lamparinas de tutano, sem monstro num raio de 20 blocos (`ttSafe`).
- **Saída (para a Cidade dos Antigos):** duas **Fendas Retas** no Leito do Último, longe uma da outra e do Leito do Titã. É onde o osso repousa sobre uma pedra lisa e reta demais: a rocha fóssil racha e mostra, embaixo, uma superfície de cantos perfeitos. Desce-se por um **tendão pendurado** (`TT_TENDAO`, escala como corda) uns 30 blocos até o que a camada 13 decidir pôr ali. Gravadas em `ttExits`.

## 3. Estrutura e geração (`js/195-titas-mundo.js`)

Aqui as salas não são cavadas na rocha: são **esqueletos carimbados** e o vazio em volta deles. Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md); "por mundo" multiplica por `WSC`, o Leito do Titã e as duas descidas são únicos.

1. **Rocha base:** rocha fóssil em tudo, cinza assentada nas primeiras 14 linhas (a do Covil vai sumindo por ruído), osso esponjoso por ruído no Leito.
2. **Vazios grandes:** cavernas de autômato bem abertas (o Ossário é amplo, com muito céu escuro por cima), mais os **desfiladeiros** da Espinha: fendas verticais de 12 a 30 de largura e 30 a 45 de fundo.
3. **Esqueletos carimbados** (moldes de blocos com variação por semente):

| Faixa | Peça | Tamanho | Quantos (x `WSC`) | Como vira terreno |
|---|---|---|---|---|
| Costelas | caixa torácica | 50 a 80 x 22 a 30 | 4 | costelas em arco de 2 a 3 de espessura, do chão até o esterno no alto; o vão entre elas é o salão; pó de osso no chão |
| Costelas | osso longo caído | 30 a 60 x 4 a 6 | 6 | fêmur ou úmero deitado: o de cima é chão, o de dentro é oco (tutano) |
| Espinha | espinha-ponte | 40 a 90 x 6 a 10 | 5 | vértebras de 6 x 6 em fila sobre o desfiladeiro, com discos de cartilagem entre elas; as apófises para cima viram ameias |
| Espinha | bacia | 30 x 16 | 3 | a pélvis como um salão com dois arcos laterais |
| Crânios | crânio-caverna | 34 a 50 x 20 a 28 | 4 | casca de osso de 3 de espessura, oca; órbitas são janelas, a boca é a entrada com dentes de esmalte como colunas |
| Crânios | elmo de bronze tombado | 24 x 14 | 3 | casca de bronze titânico com a viseira aberta |
| Leito | mão aberta | 30 x 12 | 2 | os dedos são cinco rampas que sobem até a palma |
| Leito | Leito do Titã | 140 x 56 | 1 | a sala do chefe (seção 7) |

4. **Ligações:** túneis de minhoca entre as peças e 3 por `WSC` entre faixas. Todo desnível de 5 blocos ou mais ganha **escada de ossos amarrados** (`TT_ESCADA`) ou **tendão pendurado** (`TT_TENDAO`). Toda espinha-ponte tem escada nas duas cabeceiras.
5. **Estragos:** costelas quebradas no meio (o arco cai e vira rampa), pó de osso acumulado em encostas, placas de bronze caídas.
6. **Minérios:** carvão (linhito) na rocha fóssil; adamantita na rocha fóssil e no osso de titã, sempre a até 8 blocos de uma lasca da foice ou de bronze (o metal saiu da foice). Veios de 3 a 6; 28 por `WSC` de carvão, 20 por `WSC` de adamantita, mais no Vale e no Leito.
7. **Limpeza e alcance** a partir das duas câmaras de pouso.
8. **Subida garantida** (`ttClimbFix`) a partir do Leito do Titã, dos acampamentos de catador e de cada crânio.
9. **Decoração, correção estrutural** (colunas de dente esticadas ou removidas; costela cujo pé ficou sem chão vira rampa caída) e **objetos** por último. Depois o `worldLink` da camada.

## 4. Blocos (`js/191-titas-blocos.js`)

Ids 480 a 511. Sólidos:

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 480 | `TT_OSSO` | Osso de Titã | costelas, crânios, vértebras; marfim cinzento com veio fibroso, duro | osso_tita |
| 481 | `TT_ESPONJA` | Osso Esponjoso | o miolo dos ossos e a massa do Leito; favo poroso, quebra rápido | osso_esponjoso |
| 482 | `TT_TUTANO` | Tutano Petrificado | dentro dos ossos longos; âmbar-rosado, ceroso | tutano_seco |
| 483 | `TT_ROCHA` | Rocha Fóssil | massa entre os ossos; cinza-areia com conchas e ossinhos | rocha_fossil |
| 484 | `TT_PO` | Pó de Osso | chão das salas; branco sujo, macio | po_osso |
| 485 | `TT_DENTE` | Esmalte | dentes dos crânios; branco-azulado liso, muito duro | esmalte |
| 486 | `TT_CARTILAGEM` | Cartilagem Seca | discos entre vértebras; amarelada, fibrosa | cartilagem |
| 487 | `TT_CINZA` | Cinza Assentada | só nas primeiras linhas; a cinza do vulcão de cima, compactada | cinza_assentada |
| 488 | `TT_BRONZE` | Bronze Titânico | placas de armadura gigante; verde gasto com rebites | bronze_titanico |
| 489 | `TT_BARREIRA` | Dedos Cerrados | os dedos da outra mão do titã fecham as saídas do Leito durante a luta; não quebra | nenhum |
| 490 | `TT_O_CARVAO` | Veio de Carvão | linhito na rocha fóssil | carvao |
| 491 | `TT_O_ADAMANTITA` | Veio de Adamantita | na rocha fóssil e no osso; cinza-esverdeado frio, brilho fraco de aço | min_adamantita |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 492 | `TT_ESCADA` | Escada de Ossos Amarrados | na parede; escala como a escada da mina |
| 493 | `TT_TENDAO` | Tendão Pendurado | do teto; escala como a corda da mina |
| 494 | `TT_OSSINHOS` | Ossinhos | chão |
| 495 | `TT_LAMPARINA` | Lamparina de Tutano | chão; luz amarelo-pálida |
| 496 | `TT_FLOR` | Flor-de-Cinza | chão; planta pálida que cresce no tutano, luz fria fraca |
| 497 | `TT_PO_CAI` | Fio de Pó | teto; pó escorrendo, animado |
| 498 | `TT_LIQUEN` | Líquen de Osso | teto; forro cinza-esverdeado (nunca no chão) |
| 499 | `TT_LASCA` | Lasca da Foice | chão; caco de adamantita cravado, luz fria fraca (decoração; o minério é o veio) |
| 500 | `TT_ESTACA` | Estaca de Catador | chão; pau com ossos e penas pendurados |
| 501 | `TT_FOSSIL` | Concha Fóssil | chão |
| 502 | `TT_ESPINHO` | Lasca de Osso | chão; ponta de osso fincada, não machuca |
| 503 | `TT_COLUNA` | Coluna de Dente | do chão ao teto, nos crânios |

Paredes de fundo (68 a 72): `WTT_OSSO`, `WTT_ROCHA`, `WTT_ESPONJA` (favo visto de dentro), `WTT_CRANIO` (curva interna do crânio), `WTT_BRONZE`. Bem escuras.

Terceira camada (45 a 47): `DP_TT_COSTELAS` (costelas enormes ao longe, uma atrás da outra), `DP_TT_TITAS` (silhuetas de titãs deitados ao longe, do tamanho de montanhas), `DP_TT_ROCHA` (rocha fóssil escura com ossos embutidos).

## 5. Objetos de cena (`js/192-titas-objetos.js`)

28 objetos com `titas: true` e o plano por faixa `TT_PROP_PLAN`.

- **Campo das Costelas:** monte de cinza com ossos saindo (chão), dente solto do tamanho de um homem (chão), acampamento de catador com fogo de tutano (chão, luz), varal de ossinhos (teto), pele seca esticada entre costelas (fundo), pegadas gigantes no pó (fundo + chão), crânio de animal comum perto de um dedo de titã (chão, para dar escala).
- **A Espinha:** apófise quebrada (chão), corrente de bronze partida pendurada (teto), cabeça de lança de titã fincada (chão), disco de cartilagem caído (chão), ninho de abutre (teto, nas pontes), bandeira de bronze rasgada (fundo).
- **Vale dos Crânios:** olho de cristal opaco caído da órbita (chão), cocar de bronze (chão), dente quebrado (chão), elmo de ciclope com um furo só (chão), pintura de catador na parede de osso (fundo), totem de crânio de nascido (chão), pilha de capacetes humanos (chão, para dar escala), teia de tendões secos (teto).
- **Leito do Último:** **lâmina da foice de Cronos** (fundo + chão, 20 x 12, a maior peça da camada, com brilho frio), cabo da foice quebrado (chão), corrente de bronze presa num grilhão gigante (chão), coração de pedra rachado (chão), ampulheta de bronze tombada (chão), lascas da foice em leque (fundo), osso com marcas de corte (chão).

Objetos de chão só sobre osso, rocha, pó ou bronze; nunca sobre cartilagem de ponte (ela é estreita) nem sobre o desfiladeiro.

## 6. Os 10 monstros: os nascidos dos titãs e os carniceiros (`js/193-titas-nascidos.js` e `js/194-titas-carniceiros.js`)

| Tipo | Nome | Papel | Movimento | Ataque e aviso | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `ciclope` | Ciclope Jovem | pesado | anda devagar, para para farejar com o olho piscando | agacha e enfia os dedos no chão (as pedrinhas tremem, 1 s), arranca uma pedra e a **rola** pelo chão; a pedra segue o terreno, desce rampas e para na parede | 240 | 28 | Vale, Leito |
| `hecaton` | Hecatônquiro Menor | corpo a corpo | anda de lado, com os seis braços abertos | os braços acendem um a um na ordem em que vão bater (0,3 s cada) e ele solta a sequência de socos na mesma ordem; quem lê a ordem desvia | 150 | 14 por soco | Espinha, Vale, Leito |
| `maoterra` | Mão do Enterrado | emboscada (chão) | não anda; é a mão de um gigante enterrado que só mostra os dedos no pó; muda de lugar por baixo da terra devagar | o pó levanta num círculo de 3 blocos e os dedos saem (0,8 s); quem fica dentro é **agarrado** e espremido, e depois jogado contra o chão | 180 | 24 | Espinha, Leito |
| `titanide` | Titânide Menor | distância | flutua um palmo acima do chão, sempre em linha reta, sem pular | bate o cajado no chão; uma rachadura brilhante corre pelo chão até o herói (dá para ver vindo) e solta uma fileira de espinhos de osso | 85 | 21 | Vale, Leito |
| `erinia` | Erínia | voador | voa sempre para o lado de trás do herói, trocando de lado quando ele vira | só ataca pelas costas: o chicote estala no ar uma vez (aviso) e depois corta; se o herói vira de frente, ela recua | 80 | 17 | Espinha, Leito |
| `abutre` | Abutre-de-Ossos | voador (bombardeio) | plana em círculos altos sobre o herói, sem bater asa | grasna e o osso nas garras brilha (0,6 s) e larga um fêmur que cai reto; quando o herói mata algo, desce para comer e fica no chão até ser atacado | 50 | 13 | Costelas, Espinha |
| `descarna` | Tapete de Besouros | enxame | um tapete de besouros pelo chão, que **rói** osso esponjoso e pó para abrir caminho direto até o herói | o tapete se ergue numa onda (chiado subindo) e cobre o herói, mordendo aos poucos; ao perder metade da vida se parte em dois tapetes menores | 45 | 9 | Costelas, Vale |
| `medula` | Parasita da Medula | emboscada (dentro do osso) | vive dentro do tutano e do osso esponjoso, andando por dentro dos blocos sem aparecer | o osso racha e solta pó numa linha reta (0,7 s), e um espinho atravessa o bloco por essa linha; só sai do osso quando o bloco dele é quebrado | 55 | 19 | Costelas, Vale |
| `catador` | Catador de Ossos | distância (bumerangue) | anda curvado, pega ossos do chão no caminho | gira um fêmur acima da cabeça (assobio) e arremessa: o osso vai e **volta** em arco, acertando na ida e na volta | 65 | 14 | Costelas, Espinha |
| `hiena` | Hiena Risonha | corpo a corpo (contra-ataque) | anda em volta do herói rindo, sem atacar enquanto ele está parado | quando o herói golpeia, a risada para e as orelhas abaixam (0,4 s): ela morde no fim do golpe dele; se o herói segura o golpe, ela vai embora | 55 | 15 | Costelas, Vale |

Nenhum deles mergulha do teto, voa em zigue-zague, cava em arco ou anda em matilha. O Ciclope é o único que rola projétil pelo terreno; a Erínia é a única que caça pelas costas; a Hiena é a única que só ataca quando o herói ataca.

**Drops:** `tutano`, `dente_tita`, `tendao`, `olho_ciclope`, poções, `min_adamantita` (daqui para baixo), as bases temáticas raras.

**Spawn por faixa** (`CATH_SPAWN[TT_ZONE0 + i]`):

| Faixa | Monstros (peso) | Ao mesmo tempo |
|---|---|---|
| Campo das Costelas | catador 0,24 · hiena 0,2 · descarna 0,18 · abutre 0,2 · medula 0,18 | até 8 monstros |
| A Espinha | erinia 0,22 · abutre 0,22 · catador 0,18 · hecaton 0,2 · maoterra 0,18 | até 9 monstros |
| Vale dos Crânios | medula 0,16 · ciclope 0,16 · titanide 0,18 · hiena 0,16 · descarna 0,14 · hecaton 0,2 | até 9 monstros |
| Leito do Último | ciclope 0,2 · titanide 0,2 · maoterra 0,18 · erinia 0,2 · hecaton 0,22 | até 10 monstros |

## 7. Chefe: O Último Titã (`js/197-ultimo-tita.js`)

- **Nível 27.** Vida 330 × (1 + 0,3 × 26) = **2904**, dividida em 4 pontos fracos de **726** cada. Dano 9 × (1 + 0,2 × 26) = **56**.
- **A sala é ele.** O **Leito do Titã** é uma caverna de 140 x 56 no Leito do Último, do outro lado do mundo em relação às Fendas Retas. O titã está deitado de bruços, de cabeça para a direita, com a metade esquerda do corpo enterrada no pó. O que aparece: o braço direito estendido (40 blocos, a mão aberta no chão), as costas e o ombro (um morro de 50 x 18), a nuca e a cabeça (16 x 14) apoiada no chão. O corpo tem musgo de líquen, rachaduras e placas de bronze presas: é por elas que se escala.
- **Pontos fracos:** quatro lascas da foice de Cronos ainda cravadas nele, brilhando frio: no **pulso**, no **ombro**, entre as **costelas** (nas costas) e na **nuca**. Cada uma só toma dano de perto, com o herói em pé ou agarrado ao lado dela. Quebrar uma lasca arranca 726 de vida, e o titã urra e se sacode.
- **Entrada na luta:** ao pisar na mão dele, os olhos abrem e os **Dedos Cerrados** (`TT_BARREIRA`, os dedos da mão enterrada) se fecham sobre as duas saídas.
- **Fase 1 (as duas primeiras lascas), o braço:** só o braço e a cabeça se mexem. Ataques: **tapa** (a mão sobe, a sombra dela cresce no chão, 1,2 s, e ela bate esmagando); **varrida** (o ombro range e o pó levanta ao longo do braço, depois o braço passa rente ao chão; pula-se por cima ou sobe-se no próprio braço); **sopro de pó** (o peito incha, pó sai pelo nariz em cone e empurra 5 blocos). O caminho: subir pelo braço quando ele está parado no chão, quebrar a lasca do pulso, correr pelo braço até o ombro e quebrar a segunda.
- **Fase 2 (terceira lasca), ele se ergue:** o titã se apoia no cotovelo e as costas inclinam, virando uma parede de escalada de 30 blocos. Ele **se sacode** a cada 8 a 10 s: aviso de 1 s (as costelas rangem, pó cai de todo o corpo, a tela treme de leve). Quem estiver agarrado num ponto de escalada (líquen, rachadura, placa) segura e gasta vigor; quem estiver em pé solto escorrega e cai. Abutres descem do teto para atrapalhar a escalada. A lasca das costelas fica no alto das costas.
- **Fase 3 (a nuca), a cabeça:** ele vira a cabeça para procurar o herói e tenta esmagá-lo com a testa (a cabeça recua devagar, 1,4 s, e desce). Os olhos fazem um **brilho em linha** pelo chão (a linha aparece fraca, 1 s, antes de ficar forte e machucar). Para chegar à nuca: subir pelos cabelos de líquen atrás da orelha enquanto a cabeça está abaixada depois de uma testada. Quebrar a última lasca derruba o titã de vez.
- **Reinício:** sair do Leito, usar portal ou morrer reinicia: o corpo volta para a pose deitada, as quatro lascas voltam inteiras e os dedos se abrem.
- **Lendário único:** **A Foice de Cronos** (arma, machado): +50% de dano contra inimigos grandes (pesados e chefes), e todo golpe empurra até os que não recuam. Nível de item 27.
- **Save:** `ultimoTita.dead`. Ao morrer, o corpo é **carimbado no mundo**: a pose final vira blocos de verdade (`TT_OSSO`, `TT_BRONZE`, `TT_ESPONJA`) dentro do Leito e vai para os `diffs`. O titã morto vira mais um pedaço do Ossário, que se pode escalar e minerar.

## 8. Loot e economia (`js/198-adamantita.js` e 195)

- **Metal:** **Adamantita**, o metal da foice de Cronos. `min_adamantita` → `barra_adamantita`, **8 minérios por barra**. Nível da forja **23**. A bigorna ganha as 9 peças de adamantita: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. Na arte, aço cinza-esverdeado com o fio quase branco.
- **Carvão:** linhito na rocha fóssil.
- **Materiais próprios:**
  - `tutano` (Tutano de Titã): dos nascidos e do bloco. A Marta compra; serve para a alquimia.
  - `dente_tita` (Dente de Titã): do esmalte e dos ciclopes. O Grimaldo compra.
  - `tendao` (Tendão Seco): dos catadores e do tendão pendurado. O Grimaldo compra; usado em cordas.
  - `olho_ciclope` (Olho de Ciclope): raro, do ciclope. O alquimista compra.
- **Bases temáticas** (só caem aqui, nível de item 25, como drop raro): **Maça de Fêmur** (maça, atordoa mais; cai do ciclope e do catador), **Escudo de Omoplata** (escudo, defesa alta e aparo largo; cai do hecatônquiro e da mão do enterrado), **Elmo de Crânio de Nascido** (elmo, +vida; cai da titânide e do ciclope). O Último Titã solta uma das três garantida, além do lendário.
- **Sem baús:** a camada não tem baús de loot (só o baú do vilarejo existe no jogo). Barras e minério vêm dos veios e dos monstros.
- **Missões do ancião:** 3 (tendões, dentes de titã, uma lasca da foice trazida do Leito).

## 9. Luz e atmosfera

- Escuro, mas o osso é claro e devolve a pouca luz que chega: o lugar parece mais claro do que é. Luz fria e fraca das lascas da foice e das flores-de-cinza, amarelo-pálida das lamparinas de tutano dos catadores.
- **Escala:** a terceira camada (`DP_TT_TITAS`) mostra titãs inteiros ao longe para o herói sentir o tamanho.
- Partículas: pó fino caindo dos ossos, pó levantado pelo vento nos desfiladeiros (de lado), ciscos de cinza só no Campo das Costelas, nada de fogo.

## 10. Som (`js/97-ambiente.js`, paisagem `titas`)

Sem melodia:
- **Base:** vento seco e largo (ruído rosa com filtro passa-banda que muda devagar).
- **Assobio dos ossos:** o vento passando por ossos ocos (ruído com filtro estreito; o tom muda ao acaso, nunca em sequência, para não virar melodia).
- **Rangidos:** osso velho estalando com a mudança de temperatura, longe e com muito eco.
- **Pó:** fio de areia escorrendo, perto.
- **Carniceiros:** grasnado de abutre e risada de hiena ao longe, raros.
- **Leito:** um **batimento** muito lento, uma vez a cada 12 s, que fica mais forte perto do Leito do Titã. Depois que ele morre, para.

## 11. Interface e progressão

- Nomes de zona: Campo das Costelas (`aqui dentro já bateu um coração`), A Espinha (`não olhe para baixo`), Vale dos Crânios (`eles ainda olham para cima`), Leito do Último (`ele ainda respira`).
- Cor no mapa (Tab): osso `#c8bca0`, rocha fóssil `#6a6252`, pó `#a89e88`, bronze `#4a6a52`, esmalte `#dce4e8`, adamantita `#7a948a`.
- No mapa, o titã vivo aparece como um contorno de blocos (os blocos do corpo em repouso), sem ícone.

## 12. Arte (rampas de 6 tons)

| Material | Rampa |
|---|---|
| Osso de titã | `#3a352a` `#5a5444` `#7e7660` `#a29880` `#c8bca0` `#e8e0c8` |
| Osso esponjoso | `#4a3c30` `#6a5848` `#8a7660` `#a8947a` `#c4b096` `#dccab0` |
| Rocha fóssil | `#24221c` `#363228` `#4c4638` `#6a6252` `#887e6a` `#a69c86` |
| Esmalte | `#4a5458` `#6e7a80` `#94a2a8` `#b8c4ca` `#dce4e8` `#f4f8fa` |
| Bronze titânico | `#1a241c` `#2a3a2c` `#3a5240` `#4a6a52` `#6a8a6a` `#a8b88a` |
| Adamantita | `#1c2422` `#2e3a38` `#465652` `#5e7470` `#7a948a` `#d0e4dc` |
| Tutano | `#4a2a20` `#6e4030` `#945a42` `#b87a5a` `#d4a07a` `#ecc8a4` |

Os nascidos são grandes para o jogo (ciclope 18 x 30, hecatônquiro 20 x 24) e os carniceiros são magros e curvados. O titã é desenhado em blocos de 12 x 12, como terreno, com contorno escuro só onde toca o ar.

## 13. Sistema novo: o corpo-terreno (`js/196-corpo-terreno.js`)

O jogo ainda não tem nada sólido que se mexa. O Último Titã precisa de um terreno que anda, que o herói pisa e escala, sem mexer na grade do mundo.

**O que é.** Um corpo é uma lista de **partes** (`TB_PARTS`): braço, antebraço, mão, costas, cabeça. Cada parte tem uma **grade própria** pequena (`Uint16Array`, de 6 x 6 a 50 x 18 células de 12 px) com os blocos dela (`TT_OSSO`, `TT_BRONZE`, `TT_ESPONJA`, mais três células especiais: **pega** onde dá para se agarrar, **lasca** com o ponto fraco, e vazio), e uma posição em pixels (`x`, `y`) no mundo. A parte nunca gira na colisão: ela só **anda** (translação).

**Como se mexe sem quebrar o mundo.**
- A grade do mundo (`tiles`) não é tocada durante a luta. O Leito do Titã é gerado com o vazio de todas as poses já cavado, mais 2 blocos de folga, e o chão do Leito é de blocos protegidos (não quebram durante a luta).
- Os movimentos são **poses prontas**: para cada parte, a geração guarda as posições de cada pose (deitado, tapa no alto, tapa embaixo, varrida, apoiado no cotovelo, cabeça erguida...). A luta só interpola a posição de uma pose para outra.
- Um braço que "gira" é feito de partes em corrente (ombro, braço, antebraço, mão): cada uma anda pelo seu arco, mas continua em pé, alinhada à grade. O desenho pode inclinar até 12 graus para parecer natural; a colisão continua reta. Assim nunca há colisão em ângulo.

**Como é desenhado.** Cada parte é pintada uma vez num canvas próprio (as texturas dos blocos do Ossário, com contorno só onde toca o ar, e o líquen e as rachaduras por cima) e desenhada na posição dela, entre a camada dos blocos e a dos monstros. A luz da parte vem da luz do mundo na posição de cada célula; as lascas somam uma luz fria própria. O mapa mostra a pose deitada.

**Colisão.** O `rectSolid` (em `js/10-combate.js`) é embrulhado: além dos blocos do mundo, ele pergunta a cada parte ativa perto do retângulo se alguma célula sólida dela encosta (`(x - parte.x) / T`). O `moveEntity` não muda. Os monstros também usam o `rectSolid`, então pisam no corpo; a busca de caminho deles não conta o corpo (só voadores entram na luta).

**Pisar e ser carregado.** Antes do passo de física, cada parte calcula quanto andou neste quadro. Quem está em pé em cima dela (pé encostando na fileira de cima de uma célula sólida) ou agarrado nela recebe o mesmo deslocamento. Se uma parte anda **para dentro** do herói, ela o empurra para fora pelo lado mais curto. Se ele ficaria preso entre a parte e o mundo, ele é posto no espaço livre mais perto e toma um dano pequeno, nunca morre esmagado.

**Escalar.** As células **pega** (líquen, rachadura, borda de placa) funcionam como a escada para o sistema de escalada do `js/88-escalada.js`: segurando a direção, o herói se agarra e sobe ou anda de lado pela superfície. Durante o **tremor** (aviso de 1 s), quem está agarrado segura e gasta vigor (`js/50-vigor.js`) a cada segundo; com o vigor no zero, solta. Quem está em pé fora de uma pega escorrega para o lado do tremor e pode cair.

**Pontos fracos.** As células **lasca** são o único alvo de dano do chefe. O golpe do herói testa a área da arma contra elas, como contra um monstro. A picareta não quebra o corpo (faísca e som de pedra).

**Fim.** Na morte, a pose final de cada parte é escrita nos `tiles` (só dentro do vazio do Leito, que é de ar) e salva nos `diffs`. Daí em diante não há mais corpo-terreno: só blocos.

**Desempenho:** no máximo 6 partes, cada uma com menos de 1.000 células; o embrulho do `rectSolid` só olha partes cujo retângulo cruza o do pedido.

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/190-titas-api.js` | ids, `TT_BANDS`, `TT_D`, `TT_ZONE0`, `titanBand`, `ttExits`, `ttBoss`, `ttSafe`. `TITAS = false` desliga a camada. |
| `js/191-titas-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, escada e tendão escaláveis |
| `js/192-titas-objetos.js` | 28 objetos, a lâmina da foice e `TT_PROP_PLAN` |
| `js/193-titas-nascidos.js` | ciclope jovem, hecatônquiro menor, mão do enterrado, titânide menor, erínia |
| `js/194-titas-carniceiros.js` | abutre-de-ossos, tapete de besouros, parasita da medula, catador de ossos, hiena risonha |
| `js/195-titas-mundo.js` | geração com os esqueletos carimbados, entrada pelo crânio, Fendas Retas, zonas, spawn, nível, partículas, loja, missões |
| `js/196-corpo-terreno.js` | partes, poses, desenho, embrulho do `rectSolid`, carregar, escalar, tremor, carimbo final |
| `js/197-ultimo-tita.js` | o chefe: fases, ataques, pontos fracos, dedos cerrados, reinício |
| `js/198-adamantita.js` | o metal na fornalha e na bigorna, as bases temáticas |
| `js/199-titas-save.js` | `ultimoTita.dead`, as missões |

## 15. Decisões em aberto

1. **O titã morto vira terreno de verdade?** Recomendo sim: o Leito vira uma montanha de osso para explorar, e é barato (um carimbo só).
2. **Segurar no tremor gasta vigor?** Hoje o vigor só serve ao escudo. Recomendo sim: dá peso à escalada sem criar barra nova.
3. **Afastar a câmera na luta?** O titã tem 140 blocos de comprimento. Recomendo afastar um pouco (uns 20%) só dentro do Leito durante a luta, para o herói ver os avisos do braço e da cabeça.
