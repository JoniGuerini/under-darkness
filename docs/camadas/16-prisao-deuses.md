# A Prisão dos Deuses: ficha de implementação

> **2026-10-21:** camada nova do revamp, feita já no tamanho grande: 558 m, de 8370 a 8928 m abaixo do chão do vilarejo (o desenho de 186 m esticado `LAYER_K = 3` vezes, faixas 3 vezes mais altas). Ela é gerada aos poucos (`js/312-gera-aos-poucos.js`), as quedas longas passam pelo `js/313-quedas-minerios.js`, a borda de cima e a de baixo são seladas pelo `js/353-descida-chefe.js`, e o caminho para baixo abre quando o chefe cai (`js/363-descida-vitoria.js`).

Camada 16, debaixo da Cidade dos Antigos (15) e em cima do Campo da Última Guerra (17). Enquanto o Campo não existe, o Abismo desce das saídas daqui pela corrente `camadaAcima`. Antes de todos os povos, os deuses antigos desceram até aqui para prender o que não podia morrer. Abriram abismos e atravessaram neles correntes do tamanho de pontes, cavaram celas na pedra viva, puseram carcereiros de pedra de guarda e foram embora. Os prisioneiros continuam aqui. No fundo, no Tártaro, o maior deles ainda puxa as duas correntes que sobraram.

**O que a diferencia:** é a única camada onde o que está preso é o perigo. Tudo aponta para dentro e para baixo: argolas, grilhões, grades arrebentadas de dentro para fora, gigantes de joelhos. A Cidade dos Antigos, logo acima, é fria e inteira. Aqui é ferro, bronze e pedra enormes, gastos pelo puxão de coisas vivas. As pontes não foram feitas para andar: são as próprias correntes, caídas em barriga sobre o vazio.

## 1. Identidade

- **Nome:** A Prisão dos Deuses. Faixas: As Correntes Suspensas, As Celas de Pedra Viva, O Salão dos Gigantes, O Tártaro.
- **Conceito:** os deuses foram embora e esqueceram a chave. Ficaram carcereiros de pedra que ainda vigiam, prisioneiros que não morrem e uma prisão grande demais para gente. No fundo está o Lobo, que nem os deuses puderam matar, com duas das quatro correntes ainda presas à coleira.
- **Sensação:** pequenez, peso e um medo de que alguma coisa se solte. O silêncio é quebrado por correntes que rangem sozinhas.
- **Referências:**
  - o Tártaro grego;
  - Fenrir preso pela fita Gleipnir;
  - Prometeu e a águia;
  - os gigantes acorrentados;
  - os grilhões de *Dark Souls* (Anor Londo, a Prisão de Irithyll);
  - *Hollow Knight* (o Coliseu e o Pináculo).

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 85 | As Correntes Suspensas | 8370 a 8508 | rocha da prisão; a pedra dos Antigos afina nas 8 primeiras linhas | abismos fundos atravessados por pontes de elo gigante caídas em barriga, beiradas de alvenaria ciclópica, correntes de subir |
| 86 | As Celas de Pedra Viva | 8508 a 8664 | rocha, bolsões de pedra viva | galerias de celas em andares (19 de altura, piso a cada 6), grades de ferro, laje gasta, runas acesas |
| 87 | O Salão dos Gigantes | 8664 a 8820 | rocha, alvenaria | salões enormes com plataformas nas paredes, gigantes presos de joelhos no fundo, ícor pingando |
| 88 | O Tártaro | 8820 a 8928 | pedra do Tártaro, fenda do Tártaro | covas de rocha negra rachada de luz violeta, espinhos, a Cova das Correntes (o chefe) |

- **Monstros:** o nível sai da posição da camada no registro 129 (`layerLvl(layerLo('prisao'), d)`), como nas outras camadas. Nos testes os bichos nasceram entre o nível 33,7 e o 34,1. O chefe usa `layerBossLvl('prisao')`.
- **Entrada:** duas descidas a partir das salas de descida da Cidade dos Antigos (`A.halls` do `camadaAcima`). Cada uma tem:
  - o **Poço do Carcereiro**, com 4 de largura e uma escada de ferro (`PD_ESCADA`);
  - abaixo dele, uma **câmara de pouso** de 10 x 6, plana, com ícor pingando do teto e uma poça de ícor no chão (a luz natural da camada). Ali não nasce monstro.
- **Saída:** duas **Gargantas** no fundo, longe uma da outra e da Cova. Cada uma é um poço de 3 de largura com a corrente até a última linha. As posições ficam em `pdExits`, que a camada de baixo lê (hoje o Abismo, `abAbove`). O 353 sela as 3 linhas de cada lado da fronteira. O caminho natural para baixo é a rota que o 363 abre quando o Lobo cai.

## 3. Estrutura e geração (`js/395-prisao-mundo.js`)

`pdBuild`, em passos:

1. **Rocha por faixa.** Rocha da prisão em tudo. Bolsões de pedra viva nas Celas, pedra do Tártaro no fundo. A pedra de cima afina nas primeiras 8 linhas.
2. **As salas:**
   - **Descidas e pousos** (seção 2).
   - **A Cova das Correntes:** 62 x 24 (`PD_COVA_W`/`PD_COVA_H`), com o chão em `YB-7`, do outro lado do mundo em relação às descidas. Tem os corredores das duas portas e as duas correntes partidas penduradas do teto (`B.hang` em `x0+17` e `x0+w-18`), que servem de subida.
   - **As Gargantas** (seção 2).
   - **Os abismos** (Correntes). A ponte de elo gigante (`PD_ELO`) cai em barriga 10 blocos acima do fundo. As beiradas são de alvenaria, com corrente de subir nas duas pontas.
   - **As grutas** e **as galerias de celas** (Celas): 19 de altura, um piso a cada 6, `PD_GRADE` nas frentes das celas.
   - **As celas soltas.**
   - **Os salões dos gigantes:** plataformas nas paredes, mais curtas quanto mais alto.
   - **Os corredores** e **as covas do Tártaro.**
3. **Ligações e poços.** Túneis tortos (Correntes e Tártaro) e corredores retos com degraus (Celas e Salões). Entre andares, corredores longos e poços de corrente de 4 de largura. A escada do poço desce até o chão da sala de baixo, e não só até o teto dela.
4. **Limpeza, cascas e veios:**
   - cascas de alvenaria ciclópica nas salas feitas;
   - bronze nas portas da Cova;
   - pedra viva, laje e runas nas celas;
   - fenda do Tártaro nas covas de baixo;
   - carvão na rocha;
   - ferro divino fino nas Celas e nos Salões, e grosso no Tártaro.

`pdAfter`, em ordem:

1. Conserta o alcance a partir das descidas.
2. Põe escada (Celas e Salões) ou corrente (Correntes e Tártaro) em todo desnível de 5 ou mais.
3. Roda `pdQuedas()`, que põe corrente ou escada na beira de toda queda de 8 ou mais que sobrou.
4. Põe a decoração de 1 bloco.
5. Põe os objetos com `pdPlaceProps`.

Por fim, `pdExitClear` e `pdClimbFix` garantem a subida da Cova, dos salões, das galerias e das Gargantas. O 353 religa as linhas da camada depois disso. Por isso o `pdQuedas` roda de novo, registrado no `genPos` pelo `DOMContentLoaded`, que carrega depois do 353.

## 4. Blocos (`js/391-prisao-blocos.js`, ids em `js/390-prisao-api.js`)

Sólidos (928 a 939):

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 928 | `PD_ROCHA` | Rocha da Prisão | a massa; granito quase violeta | rocha_prisao |
| 929 | `PD_ALVENARIA` | Alvenaria Ciclópica | beiradas dos abismos, cascas das salas | alvenaria_ciclopica |
| 930 | `PD_PEDRA_VIVA` | Pedra Viva | celas; veios vermelhos que pulsam devagar | pedra_viva |
| 931 | `PD_ELO` | Elo Gigante | as pontes de corrente | elo_gigante |
| 932 | `PD_BRONZE` | Bronze Antigo | molduras, portas da Cova | bronze_antigo |
| 933 | `PD_TARTARO` | Pedra do Tártaro | o fundo; pontos violeta | pedra_tartaro |
| 934 | `PD_FENDA` | Fenda do Tártaro | rachas de luz violeta fria | pedra_tartaro |
| 935 | `PD_LAJE` | Laje Gasta | pisos andados | laje_gasta |
| 936 | `PD_RUNA` | Pedra Rúnica | faixas das celas; runa azul acesa | pedra_runica |
| 937 | `PD_BARREIRA` | grade de bronze | portas da Cova, só durante a luta; não se cava | (nenhum) |
| 938, 939 | `PD_O_CARVAO`, `PD_O_FERRO` | carvão, ferro divino | minérios | carvão, min_ferro_divino |

Decoração (940 em diante): corrente de subir (4 variações, com a ponta partida), escada de ferro, grade, argola de bronze, ossos, grilhão, ícor (pinga, luz), poça de ícor (luz), estalactite, líquen (luz fraca) e elos soltos. Paredes de fundo 133 a 137: rocha, alvenaria, cela (com a grade), bronze e Tártaro. Terceira camada 84 a 86:
- abismo, com correntes atravessando o vazio ao longe;
- celas em andares ao longe;
- Tártaro.

## 5. Objetos de cena (`js/392-prisao-objetos.js`)

15 objetos, com o plano por faixa em `PD_PROP_PLAN`.
- **No chão:**
  - estátua de carcereiro;
  - bola de ferro com corrente;
  - cepo de pedra;
  - ossada de fera;
  - elo partido;
  - coluna de runas (com luz azul);
  - espinhos de pedra negra (só no Tártaro);
  - porta de bronze selada (no fundo).
- **Pendurado do teto:** jaula.
- **Na parede:**
  - prisioneiro preso (esqueleto nas argolas);
  - grilhões vazios;
  - argolão de bronze;
  - relevo dos deuses e do lobo;
  - racha que pinga ícor (com luz âmbar).
- **Só nos salões:** o gigante preso, no fundo e de joelhos, com 82 x 102.

## 6. Os 10 monstros (`js/393-prisao-bichos1.js` e `js/394-prisao-bichos2.js`)

Encostar não machuca. Todo ataque tem pose de aviso, brilho e som. Quando o golpe cai no chão, uma marca vermelha acende onde ele vai cair.

| Bicho | Vida / dano base | Comportamento e aviso |
|---|---|---|
| Carcereiro de Pedra | 135 / 25 | lento; ergue a chave (olhos acendem, marca no chão, 0,7 s) e bate |
| Elos Soltos | 24 / 10 | bando de 3; se enrolam (chocalham, juntas azuis, 0,45 s) e saltam |
| Águia do Suplício | 62 / 21 | voa em roda; para, grita (0,6 s, mira trava) e mergulha em linha; tonta se bate na pedra |
| Condenado da Bola | 86 / 21 | longe gira a bola (0,9 s) e arremessa em arco, depois puxa de volta sem atacar; perto varre rente ao chão (0,45 s) |
| Pedra Viva | 104 / 23 | dorme como pedra caída (leva metade do dano); acorda (0,7 s), anda, puxa o braço (marca, 0,6 s) e soca |
| Cria do Lobo | 56 / 18 | dupla; agacha rosnando (0,4 s) e dá o bote |
| Gigante Agrilhoado | 270 / 31 | não sai do lugar; ergue o punho (marca, 1 s) e soca, com onda de 6 blocos para os dois lados; atrás dele, pisada do joelho (0,7 s) |
| Serpe do Fosso | 76 / 22 | só a cabeça fora da fenda, presa a 5 blocos da base; incha (0,6 s) e cospe veneno em arco (poça por 3 s); perto recua (0,45 s) e morde |
| Lamento | 52 / 18 | véu violeta translúcido; inspira (0,8 s) e solta 3 gemidos lentos em leque |
| Acorrentador | 92 / 21 | mantém 5 blocos; o gancho brilha e a linha tracejada liga a mão ao herói (0,6 s): o gancho voa, puxa o herói (sem controle por 0,35 s) e a clava desce (0,45 s). O escudo de frente segura o gancho. Se erra, fica 0,8 s puxando a corrente de volta |

Spawn por faixa (`CATH_SPAWN` 85 a 88):
- Correntes: águia, elos, condenado, acorrentador, cria.
- Celas: carcereiro, pedra viva, condenado, elos, lamento.
- Salões: gigante, carcereiro, cria, serpe, águia.
- Tártaro: serpe, lamento, pedra viva, acorrentador, gigante, cria.

Não nasce monstro nos pousos nem na Cova. Um bicho comum que entra na Cova é empurrado para fora.

Mortes (`js/396-prisao-morte.js`, `MORTE_TIPOS` do 360):
- a pedra lasca em placas;
- o ferro solta elos e faíscas;
- a carne espirra sangue e osso;
- o Lamento se desfaz em fumaça.

O gigante e a serpe ficam de fora, porque não cabem na janela de 48 x 44 do 360, e morrem com a explosão de pó do 394.

## 7. Chefe: O Lobo Atado (`js/397-lobo-atado.js`)

"O que nem os deuses puderam matar." Um lobo do tamanho de uma casa (sprite de 80 x 50, corpo 44 x 28), de pelo cinza-chumbo e coleira de bronze. A sala é a Cova das Correntes: 62 x 24, chão de laje reto e moldura de bronze. Há uma porta no pé de cada lado, e a grade de bronze as fecha durante a luta. Duas correntes partidas pendem do teto e servem de subida. As outras duas, uma de cada parede, seguram a coleira. Elas são desenhadas com barriga e brilho.

- **Fase 1 (100% a 66%):** as duas correntes prendem o lobo no meio, a 12 blocos para cada lado.
  - **Mordida:** agacha rosnando (0,55 s) e dá o bote.
  - **Uivo:** se empina (0,8 s) e bate as patas; uma onda corre no chão para os dois lados, e pula-se por cima.
  - **Pedra:** cava (0,7 s), a marca acende sob o herói e a pedra cai ali.
- **Virada (66%):** ele puxa a corrente da esquerda (2 s sem levar dano, os elos acendem) e ela arrebenta. Os blocos da corrente viram corrente de subir na parede. Agora ele chega à parede da direita, e a ponta que ficou na coleira vira chicote.
  - **Chicote:** ergue a corrente (0,6 s, um arco vermelho mostra o alcance) e varre.
- **Virada (33%):** a da direita arrebenta. Ele fica livre na sala inteira e mais rápido.
  - **Salto:** uma sombra vermelha marca o chão debaixo do herói (0,7 s), ele cai ali e solta ondas curtas.
  - O uivo passa a ser duplo, e caem duas pedras de cada vez.
- **Se o herói sai ou morre:** a luta reinicia com vida cheia e as duas correntes inteiras.
- **Dentro da sala:** não se cava, não se coloca bloco e a picareta não atravessa.
- **Números:** vida 340 e dano 10 na base, escalados pelo nível de chefe da camada (`LBQ`); 580 de XP.
- **Ao vencer:** as portas abrem, `pdChefe.dead` é gravado e o 363 abre a rota para baixo.

## 8. Loot e economia (`js/398-ferro-divino.js` e 395)

- **Ferro Divino:** preto, cortado por um fio de ouro. É o metal da camada.
  - 8 minérios por barra na fornalha.
  - Na bigorna fica entre a adamantita e a infernita (`il: layerForgeIl('prisao')`, 31).
  - 9 peças forjadas: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas. O peitoral dá espinho de 0,06.
- **Materiais:**
  - Ícor Divino (das gotas e poças de ícor e do chefe);
  - Elo Vivo;
  - Pena do Suplício;
  - Coração de Pedra;
  - Presa de Lobo.

  A Marta (curandeira) compra ícor, penas e presas. O Grimaldo (ferreiro) compra o ferro divino, os elos e os corações. Os preços estão em `MAT_VAL`.
- **3 bases que só caem aqui** (0,5% cada, de qualquer bicho da camada):
  - Mangual de Grilhão: maça, +4% de crítico;
  - Elmo do Carcereiro: def 9, vida 12;
  - Cota de Elos: def 14, espinho 0,12.
- **Lendário:** A Fita que Prende (acessório, raridade 4), com def e vida. Contra bicho comum, 15% dos golpes de perto amarram o bicho por 1,5 s; o chefe não é amarrado. A amarra é desenhada como corrente.
- **Chefe:** a fita, mais 6 a 10 minérios de ferro divino, 2 a 4 ícores, 2 a 4 presas e 2 a 4 poções.

## 9. Luz e atmosfera

Só luz natural da própria camada; nada de tocha posta:
- ícor pingando e poças de ícor (âmbar quente);
- runas e colunas de runas (azul frio);
- fenda do Tártaro (violeta);
- os veios da pedra viva, que pulsam em vermelho;
- líquen fraco.

O resto é escuro. Partículas por faixa:
- pó de pedra caindo nas Correntes;
- gotas de ícor nos Salões;
- cinza violeta no Tártaro.

## 10. Som

Efeitos novos pelo `sfx` (sintetizados com `tone` e `noise`):
- passos de pedra;
- baque;
- chocalho de corrente;
- arremesso;
- ergue;
- rangido;
- os do Lobo (`lbRosna`, `lbUivo`, `lbBote`, `lbCava`, `lbChicote`, `lbElos`, `lbRange`, `lbArrebenta`, `lbMorte`): rosnado, uivo, bote, cava, chicote, elos, corrente que estica, que arrebenta, e a morte.

O ambiente de fundo é o padrão das camadas.

## 11. Interface e progressão

- **Nomes das zonas** (`js/399-prisao-save.js`), com o subtítulo:
  - As Correntes Suspensas: "pontes que ninguém forjou para andar";
  - As Celas de Pedra Viva: "as grades foram arrebentadas por dentro";
  - O Salão dos Gigantes: "eles ainda respiram, devagar";
  - O Tártaro: "o fundo de onde nada volta".
- **Barra do chefe:** "O Lobo Atado / o que nem os deuses puderam matar".
- **Sem dica nem aviso na tela:** as viradas de fase não mostram faixa, e o que muda se vê no lobo e nas correntes.
- **Save:** grava `prisao_chefe.dead`. Enquanto o lobo vive, os blocos da Cova não vão para o save. O número de mundo (wg) não muda.

## 12. Arte

Pixel art em rampas de tons, na mesma escala das outras camadas. Ferro quase preto com ferrugem, bronze com pátina verde, pedra violeta-acinzentada, pedra viva vermelha e o ouro do ícor. As folhas estão em `/mnt/project-files/revamp/prisao/`:
- `monstros.png`;
- `blocos-decoracao.png`;
- `objetos.png`;
- `itens.png`;
- `faixa-1.png` a `faixa-4.png`;
- `chefe-lobo-*.png`;
- `mapa-camada.png`.

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/390-prisao-api.js` | ids, faixas, `pdAbove`, postos da geração, `inPdHall`/`inPdLand`, a corrente das camadas |
| `js/391-prisao-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, brilho, itens de bloco |
| `js/392-prisao-objetos.js` | os 15 objetos e `PD_PROP_PLAN` |
| `js/393-prisao-bichos1.js` | 5 bichos e o que os 10 dividem (tiros, marcas, ondas, poças, faíscas, drops) |
| `js/394-prisao-bichos2.js` | os outros 5 |
| `js/395-prisao-mundo.js` | geração, quedas, subida garantida, objetos, terceira camada, zonas, spawn, nível, partículas, fornalha, lojas |
| `js/396-prisao-morte.js` | mortes no 360 |
| `js/397-lobo-atado.js` | o chefe, a sala, o lendário |
| `js/398-ferro-divino.js` | o metal, as 9 peças, os materiais, as 3 bases |
| `js/399-prisao-save.js` | nomes das zonas, save do chefe |

Ordem no `index.html`:
- o 398 vem logo depois do 288-adamantita;
- o 390 ao 395 vêm depois do 295-antigos-mundo;
- o 399 vem depois do 299-antigos-save;
- o 397 vem depois do 287-ultimo-tita;
- o 396 vem depois do 361-fontes;
- o 355-vida-recalc continua o último.

## 14. Decisões

- **O metal é o Ferro Divino**, porque oricalco já estava em uso.
- **O chefe é o Lobo Atado** (Fenrir) e não um titã, porque já existe o Último Titã. A sala muda a luta pelas correntes que o seguram e arrebentam por fase, como o brief pede.
- **As entradas e saídas ficam seladas pelo 353,** como ele faz em todas as camadas. A descida natural é a rota aberta pelo 363 depois do chefe. O caminho não é remendado dentro do chefe: o embrulho do `endBossFight` do 397 só cuida da própria sala.
- **As faixas de virada de fase foram tiradas** ("uma corrente a menos" e "livre"), pela regra de interface limpa.
- **O gigante e a serpe ficam fora do 360,** porque são grandes demais para a janela.
- **O `pdQuedas` roda depois do religamento do 353,** porque sem isso o religamento reabria quedas longas.
- **Os números do chefe e dos bichos seguem a fórmula da casa** (`layerLvl` e `layerBossLvl`). O brief fala em "níveis 76 a 80"; o jogo deu nível 33 a 34 para os bichos daqui. Fica para quem junta as camadas conferir se a escala está certa.

## 15. Como ficou no jogo (2026-10-21)

- **8 sementes testadas** (12345, 1, 2, 3, 777, 4242, 99999, 31337), sem erro.
  - Do pouso, 99,9% a 100% do espaço aberto da camada é alcançável.
  - A boca da Cova e o topo das Gargantas são alcançáveis.
  - A rota `descida.rotas.prisao` existe em todas.
  - Sobrou uma só queda longa, dentro de um poço que tem escada.
- **Os 10 bichos** nascem (nível 33,7 a 34,1) e acertam o herói pelos golpes avisados. Todos os estados de ataque foram vistos.
- **O chefe**, numa luta lenta, mostrou:
  - fase 1: cava, empina/uiva, agacha/bote;
  - fase 2: o mesmo e ergue/chicoteia;
  - fase 3: o mesmo e mira/salto.

  As correntes arrebentam nas viradas e viram corrente de subir. Ele morre, as portas abrem, `pdChefe.dead` fica gravado, a rota abre (135 de 135 células) e a fita cai.
- **A geração da camada** levou de 2,5 a 6,5 s numa máquina carregada.
