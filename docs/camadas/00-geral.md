# As camadas 5 a 16: regras gerais

Passo 2 do planejamento das 16 camadas (o mapa do passo 1 está em [../camadas.md](../camadas.md)). Esta pasta tem uma ficha de implementação por camada nova, no formato da ficha de bioma (Parte 1 de [../biomas.md](../biomas.md)) e no nível de detalhe da [../abismo-spec.md](../abismo-spec.md). Este arquivo junta o que vale para todas: a progressão, a geração aos poucos, os números de cada camada, as regras da casa e o rodízio das salas de chefe.

| Arquivo | Camada |
|---|---|
| [05-minas-fungicas.md](05-minas-fungicas.md) | 5. As Minas Fúngicas |
| [06-cidade-afundada.md](06-cidade-afundada.md) | 6. A Cidade Afundada |
| [07-floresta-petrificada.md](07-floresta-petrificada.md) | 7. A Floresta Petrificada |
| [08-fortaleza-anoes.md](08-fortaleza-anoes.md) | 8. A Fortaleza dos Anões |
| [09-colmeia.md](09-colmeia.md) | 9. A Colmeia |
| [10-nave-caida.md](10-nave-caida.md) | 10. A Nave Caída (camada extra; as de baixo descem uma posição quando forem feitas) |
| [11-reino-elfico.md](11-reino-elfico.md) | 11. O Reino Élfico (camada extra, debaixo da Nave Caída) |
| [10-mar-sem-sol.md](10-mar-sem-sol.md) | 10. O Mar Sem Sol |
| [11-covil-dragao.md](11-covil-dragao.md) | 11. O Covil do Dragão |
| [12-ossario-titas.md](12-ossario-titas.md) | 12. O Ossário dos Titãs |
| [13-cidade-antigos.md](13-cidade-antigos.md) | 13. A Cidade dos Antigos |
| [14-saloes-pesadelo.md](14-saloes-pesadelo.md) | 14. Os Salões do Pesadelo |
| [15-abismo.md](15-abismo.md) | 15. O Abismo (o que muda quando ele descer) |
| [16-escuridao.md](16-escuridao.md) | 16. A Escuridão |

---

## 1. A tabela das 16 camadas

Cada camada tem 558 m de altura e 4 faixas (desde 2026-10-12; veja a seção 1b). Os números de metros abaixo são os do jogo de hoje, contados do chão do vilarejo. Os números de nível seguem a curva que o jogo já usa: a vida dos monstros cresce 30% por nível e o dano das armas cresce 30% por nível de item, então uma camada nova sobe 2 níveis de monstro e 2 níveis de item.

| # | Camada | Metros | Monstros | Chefe (nível) | Metal | Nível da forja |
|---|---|---|---|---|---|---|
| 1 | As Cavernas | 18 a 558 | 1 a 4 | A Mãe-Teia (4) | Cobre | 2 |
| 2 | A Catedral | 558 a 1116 | 5 a 6 | O Rei Esqueleto (6) | Ferro | 3 |
| 3 | As Cavernas de Gelo | 1116 a 1674 | 7 a 8 | O Yeti Ancestral (9) | Ouro | 5 |
| 4 | A Mina Abandonada | 1674 a 2232 | 9 a 10 | O Rei Goblin (10) | Cobalto | 6 |
| 5 | As Minas Fúngicas | 2232 a 2790 | 11 a 12 | A Mãe-Esporo (13) | Esporita | 9 |
| 6 | A Cidade Afundada | 2790 a 3348 | 13 a 14 | O Sineiro Afogado (15) | Prata | 11 |
| 7 | A Floresta Petrificada | 3348 a 3906 | 15 a 16 | O Cervo de Pedra (17) | Platina | 13 |
| 8 | A Fortaleza dos Anões | 3906 a 4464 | 17 a 18 | O Autômato-Forja (19) | Mithril | 15 |
| 9 | A Colmeia | 4464 a 5022 | 19 a 20 | A Rainha da Colmeia (21) | Ambrita | 17 |
| 10 | A Nave Caída (extra) | 5022 a 5580 | 21 a 22 | O Olho-Cometa (23) | Xenita | 19 |
| 11 | O Reino Élfico (extra) | 5580 a 6138 | 23 a 24 | A Dama do Espelho (25) | Lunarita | 21 |
| 12 | O Mar Sem Sol (feito) | 6138 a 6696 | 25 a 26 | O Leviatã (27) | Oricalco | 23 |
| 11 | O Covil do Dragão | 6696 a 7254 | 23 a 24 | Cinzarel, o Dragão Ancião (25) | Dracônio | 21 |
| 12 | O Ossário dos Titãs | 7254 a 7812 | 25 a 26 | O Último Titã (27) | Adamantita | 23 |
| 13 | A Cidade dos Antigos | 7812 a 8370 | 27 a 28 | O Arquiteto (29) | Ferro Estelar | 25 |
| 14 | Os Salões do Pesadelo | 8370 a 8928 | 29 a 30 | O Sem-Rosto (31) | Onirita | 27 |
| 15 | O Abismo | 8928 a 9486 | 31 a 32 | O Príncipe do Caos (33) | Infernita | 29 |
| 16 | A Escuridão | 9486 a 10044 | 33 a 34 | Nox, Aquele Que Apaga (37) | Noctírio | 31 |

- **Monstros:** a coluna é o nível dos monstros, do topo ao fundo da camada. Regra do Jonathan (2026-10-10): **cada camada começa 1 nível acima do último da camada de cima**, nunca repete nem volta. Da catedral para baixo são 2 níveis por camada: o primeiro na metade de cima, o segundo da metade para baixo (a partir de 279 m da camada, `LAYER_D / 2`). 30% dos monstros nascem 1 nível acima, mas nunca passam do topo da própria camada. As cavernas, por serem a primeira, vão de 1 a 4 (1 nível a cada 150 m, os 50 m do desenho vezes 3). No código: `layerLvl(primeiro, d)` em `js/52-caverna-api.js`.
- **Nível da forja:** o nível de item das 9 peças forjadas daquele metal. Na camada 5 em diante ele é o nível do primeiro monstro da camada menos 2 (2n − 1, com n a posição da camada): o equipamento forjado é bom para entrar na camada e fica para trás quando o drop dela começa a superar.
- **Barras por metal:** de 5 minérios por barra no cobalto e 6 na infernita, sobe 1 a cada 3 camadas: 6 da esporita à platina, 7 do mithril ao oricalco, 8 do dracônio ao ferro estelar, 9 na onirita e na infernita, 10 no noctírio.
- **Bases e lendários de drop:** as bases temáticas de cada camada (armas e armaduras que só caem lá) nascem no nível do primeiro monstro da camada; o lendário do chefe, no nível do chefe.

---

## 1b. Camadas 3 vezes mais altas (2026-10-12)

Pedido do Jonathan (2026-10-12): as camadas acabavam rápido demais ("3, 4 vezes mais longa").

- **A altura:** cada gerador continua desenhando em 186 m (`LAYER_DESIGN`, `js/01-base.js`) e estica `LAYER_K = 3` vezes. Cada camada tem `LAYER_D = 186 x 3 = 558` linhas, ou 558 m (`js/129-camadas.js`), e o mundo tem `WH = 10130` linhas. As faixas também são 3 vezes mais altas: cada arquivo api faz `X_D = LAYER_D` e `X_BANDS = [valores do desenho].map(v => v * LAYER_K)`, e o topo de cada camada (`X_TOP`) é o da de cima mais `LAYER_D`. A camada na posição N começa a (N − 1) x 558 m do chão do vilarejo.
- **Mais andares, não salas maiores:** cada faixa guarda 3 andares do tamanho da faixa antiga, com as mesmas salas, os mesmos túneis e as mesmas subidas entre andares. Os veios de minério e as salas de chefe ficam no mesmo lugar relativo (um metro do desenho vira 3).
- **Menos penhasco:** nenhuma queda aberta de mais de uns 12 a 15 blocos no caminho normal. O `js/313-quedas-minerios.js` corre depois das ligações (embrulha o `worldLink`) e, em todo poço estreito (até 8 de largura) que cai mais de 12 blocos, põe um piso de lado a lado a cada 12 mais ou menos, com um degrau ao lado (2 de largura) por onde se continua descendo; nos salões largos põe uma laje saindo da parede. Só onde quem anda pode cair dentro, só na rocha natural da camada (nunca em salão, sala de chefe, água ou poço com escada, corrente ou cipó), e um piso que tiraria uma subida que existia é desfeito.
- **Minério na borda:** o mesmo arquivo muda os veios de carvão e do metal de cada camada que ficaram enterrados longe de qualquer vão para a rocha de 0 a 2 blocos da borda, até 80% deles estarem lá. O número de blocos não muda e o minério só vai para as rochas onde ele já nasce.
- **O save:** o número de mundo sobe para 19. Mundos de antes (camadas de 186 m) são refeitos; nível, itens, ouro e o baú da vila continuam.

---

## 2. Geração aos poucos

**Como ficou no jogo (2026-10-12, `js/312-gera-aos-poucos.js` e o fim do `js/129-camadas.js`):** um mundo novo sai só com a superfície, as Cavernas e a Catedral. Cada camada seguinte é gerada quando o herói entra na de cima dela, com a tela de carregando ("Gerando o mundo") por um instante, então a de baixo está sempre pronta antes de ele chegar. O Teleporte gera o que falta antes de levar o herói. Os geradores entregam o trabalho a `genStage(id, fn)` e os passes de depois (ligações do 87, quedas e minério do 313, pedras do 117, ervas do 94, bacias do 128 e do 139) se registram em `genPos` e rodam depois de cada leva, só nas camadas novas. O save guarda até onde o mundo foi gerado (`gerado`) e o carregar refaz as mesmas levas, uma a uma, do mesmo jeito; a geração com o jogo rodando vê o mundo como a semente deixou e põe por cima o que o jogo mudou. As camadas ainda não geradas já têm o topo previsto, então o mapa, as zonas e o Teleporte sabem onde cada uma vai ficar. O plano abaixo é o de 2026-10-10; o que mudou dele: a primeira leva é de 2 camadas, a folga é de 1 camada e a geração é feita de uma vez, com a tela de carregando, não em pedaços durante o jogo.

Decisão do Jonathan (2026-10-10): um personagem novo nasce com as 4 primeiras camadas geradas. As outras são geradas conforme o herói desce, nunca todas de uma vez.

**A regra:** sempre existem pelo menos 2 camadas prontas abaixo da mais funda que o herói já pisou. Começa com as camadas 1 a 4. Quando o herói pisa na camada 3, a 5 é gerada; na 4, a 6; e assim por diante. Assim a camada nova está pronta muito antes de ele chegar à descida dela.

**Como gerar sem travar o jogo:**
- O mundo já nasce com a altura das 16 camadas (`WH` de cerca de 3.062 linhas), mas tudo abaixo da última camada gerada é rocha-mãe (`BEDROCK`) e não entra no mapa, na luz nem nos objetos. Assim nenhum vetor do mundo precisa crescer depois, e o índice de cada bloco (`y * WW + x`) nunca muda: as alterações salvas (`diffs`) continuam válidas.
- A geração de uma camada roda em pedaços pequenos, no máximo uns 6 ms por quadro, enquanto o jogo segue. Uma camada leva hoje uns 0,7 s de cálculo; em pedaços, fica pronta em poucos segundos de jogo, sem tela de carregamento e sem aviso na tela.
- Se a camada de baixo ainda não estiver pronta quando o herói chegar à descida, a descida fica fechada por entulho até ela ficar pronta. Isso quase nunca acontece, por causa da folga de 2 camadas.
- Cada camada usa a própria semente (`seed` misturada com o número da camada). A camada de cima escolhe onde ficam as duas descidas e deixa isso anotado; a de baixo lê essas posições e abre a entrada ali. Isso é o que `mnExits` e `abExits` já fazem hoje.
- Os passes que hoje rodam no mundo todo (`worldLink` do 87, `mnClimbFix`, alcance) passam a rodar por camada, só na faixa de linhas da camada nova e na emenda com a de cima.

**Save:**
- O save guarda quantas camadas já foram geradas (`gen`). Ao carregar, o jogo gera de novo da 1 até `gen` a partir da semente e aplica as alterações salvas por cima.
- Com muitas camadas o carregamento fica mais lento (uns 0,7 s por camada). Se isso incomodar, dá para guardar as camadas prontas no IndexedDB do navegador, pela semente e pela versão do gerador. Fica para decidir depois de medir.
- **Camada nova no código não refaz o mundo de ninguém:** ela só é gerada quando o herói chegar lá. Só refaz o mundo quem muda a geração de uma camada que o save já tem.

**Preparação no código antes da camada 5** (uma vez só, antes de qualquer camada nova):
1. **Registro de camadas** (`LAYERS`), um arquivo novo antes de todos os geradores. É uma lista em ordem, onde cada camada diz seu id, o nome, as 4 faixas, o gerador, a tabela de monstros, a curva de nível e as descidas. A profundidade de cada uma sai da posição na lista. Mover o Abismo para a 15ª vira trocar a posição dele na lista.
2. **Portar as 5 camadas que existem para o registro:** trocar os `S0` e topos fixos (`CAVE_D`, o início da mina, o do Abismo) pelo topo que o registro dá, e as fórmulas de nível (`56`, `73`, `84`, `108`) pela tabela da seção 1.
3. **Blocos em 16 bits:** `tiles` passa de `Uint8Array` para `Uint16Array`, e `NT` de 192 para 640. Os vetores indexados pelo id do bloco (`SOLID`, `DIG`, `EMIT`...) só crescem. Paredes e terceira camada continuam em 8 bits (sobra espaço).
4. **Geração em pedaços:** o gerador de cada camada vira uma função que faz um passo por chamada (uma faixa, um tipo de sala, um passe), chamada pelo laço do jogo até terminar.
5. **Água e nado**, um sistema só para o jogo inteiro: a água é uma camada própria por célula (`agua`), não um bloco, e o herói nada com barra de fôlego. A especificação completa está na ficha do [Mar Sem Sol](10-mar-sem-sol.md) (Sistemas novos), mas os arquivos (`js/171-agua.js` e `js/172-nadar.js`) entram aqui, na preparação, porque as camadas 5 (a gruta alagada da Mãe-Esporo) e 6 (a cisterna) já usam água.
6. **Níveis de item acima de 12:** hoje `rollItem` e `mkItem` (`js/48-itemizacao.js`) cortam o nível do item em 12. O teto sobe para 40.
7. **Nível de forja por metal:** hoje o nível vem da posição do metal em `METALS` (`FORGE_ILVL`), que segue a ordem em que os arquivos carregam. Cada metal passa a guardar o próprio nível (`il`), assim o Abismo pode carregar antes da esporita sem bagunçar a bigorna.
8. **Lendários guardam o nível de quando caíram:** quem já tem a Lâmina Infernal ou o Coração do Caos não vê o item mudar quando o Abismo descer.
9. **Medir** memória e tempo com o mundo de 16 camadas vazio. A estimativa é de 2,8 milhões de blocos e menos de 60 MB nos vetores.

---

## 3. Números reservados por camada

Para várias camadas poderem ser feitas em paralelo sem brigar por número.

| # | Camada | Arquivos `js/` | Ids de bloco | Paredes | Terceira camada | Zonas (faixas) | Nome no código |
|---|---|---|---|---|---|---|---|
| 5 | Minas Fúngicas | 120 a 129 | 256 a 287 | 33 a 37 | 24 a 26 | 25 a 28 | `FUNGO`, prefixo `FG_` |
| 6 | Cidade Afundada | 130 a 139 | 288 a 319 | 38 a 42 | 27 a 29 | 29 a 32 | `CIDADE`, `CD_` |
| 7 | Floresta Petrificada | 140 a 149 | 320 a 351 | 43 a 47 | 30 a 32 | 33 a 36 | `FLORESTA`, `FP_` |
| 8 | Fortaleza dos Anões | 150 a 159 | 352 a 383 | 48 a 52 | 33 a 35 | 37 a 40 | `ANOES`, `AN_` |
| 9 | Colmeia | 160 a 169 | 384 a 415 | 53 a 57 | 36 a 38 | 41 a 44 | `COLMEIA`, `CM_` |
| 10 | A Nave Caída (feita) | 240 a 249 | 640 a 671 (NT 672) | 88 a 92 | 57 a 59 | 49 a 52 | `NAVE`, `NV_` |
| 11 | O Reino Élfico (feito) | 250 a 259 | 672 a 703 (NT 704) | 93 a 97 | 60 a 62 | 53 a 56 | `ELFOS`, `EL_` |
| 12 | O Mar Sem Sol (feito) | 260 a 269 | 704 a 735 (NT 736) | 98 a 102 | 63 a 65 | 57 a 60 | `MAR`, `MS_` |
| 11 | Covil do Dragão | 180 a 189 | 448 a 479 | 63 a 67 | 42 a 44 | 49 a 52 | `DRAGAO`, `DG_` |
| 12 | Ossário dos Titãs | 190 a 199 | 480 a 511 | 68 a 72 | 45 a 47 | 53 a 56 | `TITAS`, `TT_` |
| 13 | Cidade dos Antigos | 200 a 209 | 512 a 543 | 73 a 77 | 48 a 50 | 57 a 60 | `ANTIGOS`, `AT_` |
| 14 | Salões do Pesadelo | 210 a 219 | 544 a 575 | 78 a 82 | 51 a 53 | 61 a 64 | `PESADELO`, `PS_` |
| 16 | A Escuridão | 220 a 229 | 576 a 607 | 83 a 87 | 54 a 56 | 65 a 68 | `ESCURO`, `ES_` |

A Nave Caída entrou fora do mapa das 16 e usa números que ninguém tinha reservado (a Escuridão já tinha pegado as zonas 45 a 48); as zonas 49 a 52 eram do Covil do Dragão na reserva, então as camadas que ainda faltam usam as próximas zonas livres (53 em diante) e o próximo bloco livre (672 em diante, subindo o NT). O Abismo (15) mantém os números que já tem (`js/103` a `111`, blocos 128 a 152, zonas 21 a 24). Os ids 608 a 639 sobram para o endgame. O Reino Élfico (2026-10-11) foi a segunda camada extra: pegou os blocos 672 a 703 (NT 704), as paredes 93 a 97, a terceira camada 60 a 62 e as zonas 53 a 56; a próxima camada começa no bloco 704, parede 98, terceira camada 63 e zona 57. Cada camada segue o padrão de arquivos das que já existem: API, blocos, objetos, monstros (2 arquivos), mundo, chefe, metal e save. Ninguém mexe nos arquivos de outra camada; quando precisar, embrulha a função (como o jogo já faz).

---

## 4. Regras da casa (valem para toda camada)

- **10 monstros próprios** por camada, sem contar o chefe. Cada faixa usa de 4 a 6, e todos aparecem em pelo menos uma. Os 10 cobrem jeitos diferentes de lutar: corpo a corpo, distância, voador, emboscada (parede, teto ou enterrado), pesado e enxame. Nenhum repete o comportamento de outro da mesma camada, e nenhum copia um monstro de camada anterior com outra cor.
- **Sem dano de contato genérico.** Todo ataque tem aviso claro (pose, brilho, som, marca no chão). Encostar só machuca nos bichos em que isso faz sentido (`touch`).
- Monstros usam linha de visão e busca de caminho. XP baixo, como já é.
- **Um metal por camada, mais carvão.** O metal só cai dos monstros daquela camada ou das de baixo. As pedras preciosas não são metal e seguem a tabela da seção 4b.
- **Duas descidas** por camada, saindo da última faixa da camada de cima. Todo desnível de 5 blocos ou mais tem escada, corrente ou cipó: dá para voltar sem cavar.
- **Sem penhasco no caminho normal** (2026-10-12): nenhuma queda aberta desenhada de mais de uns 12 a 15 blocos onde quem anda pode cair. O `js/313-quedas-minerios.js` põe pisos e lajes nos poços que passam disso (seção 1b).
- **Minério perto da borda** (2026-10-12): 80% do carvão e do metal de cada camada fica a 2 blocos ou menos de um vão (`js/313-quedas-minerios.js`).
- **Uma câmara de pouso** por camada, perto de cada descida: uma sala pequena, plana e iluminada onde não nasce monstro. Ela fica reservada para os pontos de volta que o Jonathan ainda vai desenhar.
- **Sem baús de loot.** Os baús que apareciam nas camadas saíram do jogo (Jonathan, 2026-10-10); só fica o baú do vilarejo. As bases temáticas de cada camada caem como drop raro dos monstros dela, e o chefe solta uma delas na primeira vitória, além do lendário.
- **Arte:** o padrão do vilarejo. Pixel art granulada, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar. Blocos de 12x12; humanoides de 12x22 com os encaixes do herói.
- **Luz natural só onde faz sentido** (Jonathan, 2026-10-10): nenhuma camada ganha tocha, vela, lampião ou braseiro aceso por padrão, a não ser que o lugar explique quem acendeu. A catedral tem as velas e os braseiros dos objetos dela; a mina, os lampiões dos mineiros; o Abismo, o fogo e a lava. Cavernas naturais, o gelo e qualquer lugar selvagem ficam no escuro (o herói não tem luz própria desde a 0.9.7 e leva as tochas). Luz que nasce do próprio lugar vale: cristais, cogumelos, fungo, lava. Nas Minas Fúngicas a luz é dos cogumelos e dos esporos, mais os lampiões da colônia nas galerias dela.
- **Interface limpa:** nada de texto de dica, atalho ou linha extra. O nome da faixa aparece ao entrar, como hoje.
- **Som:** cada camada ganha a sua paisagem sonora no `js/97-ambiente.js` (sem melodia, como as outras).
- **Wiki e docs:** cada camada nova entra na wiki (aba de bioma, inimigos, chefe, forja) e ganha a sua spec em `docs/`.
- **Testes antes de entregar:** os de [../regras-de-bioma.md](../regras-de-bioma.md), em 8 sementes, mais a geração em pedaços (o jogo não pode cair abaixo de 50 quadros por segundo enquanto gera).

---

## 4b. Pedras preciosas: as mesmas 5 em todas as camadas

Decisão do Jonathan (2026-10-10). As 5 pedras do encantador (topázio, esmeralda, safira, cristal e rubi) aparecem em todas as camadas, presas na rocha, em grupinhos de 1 ou 2 blocos (36 x `WSC` grupos por camada, cerca de 150 blocos). A camada não tem pedra própria: o que muda é a chance de cada uma. No começo é quase só topázio, esmeralda é rara e o resto não existe. Descendo, as melhores vão ficando menos raras. O rubi nunca vira comum.

| Camada | Topázio | Esmeralda | Safira | Cristal | Rubi |
|---|---|---|---|---|---|
| 1 | 97% | 3% | 0 | 0 | 0 |
| 2 | 90% | 10% | 0 | 0 | 0 |
| 3 | 82% | 16% | 2% | 0 | 0 |
| 4 | 72% | 22% | 6% | 0 | 0 |
| 5 | 62% | 27% | 10% | 1% | 0 |
| 6 | 52% | 30% | 15% | 3% | 0 |
| 7 | 43% | 31% | 20% | 6% | 0 |
| 8 | 35% | 30% | 24% | 10% | 1% |
| 9 | 28% | 28% | 27% | 14% | 3% |
| 10 | 22% | 26% | 28% | 19% | 5% |
| 11 | 17% | 23% | 29% | 23% | 8% |
| 12 | 14% | 21% | 28% | 27% | 10% |
| 13 | 11% | 18% | 28% | 30% | 13% |
| 14 | 9% | 16% | 27% | 32% | 16% |
| 15 | 7% | 14% | 26% | 35% | 18% |
| 16 | 6% | 12% | 25% | 37% | 20% |

- **No jogo hoje (6 camadas):** cavernas, catedral, gelo, mina, Minas Fúngicas e Abismo usam as linhas 1 a 6 (o Abismo usa a linha da posição em que estiver). Por isso o rubi ainda não aparece. Quando o Abismo chegar à 15ª, ele passa a usar a linha 15.
- **No código:** `GEM_SHARE` (as 16 linhas) e `GEM_LAYERS` (a rocha de cada camada) em `js/117-gemas.js`. Cada pedra ganha um bloco próprio para cada rocha (o mesmo desenho sobre a rocha da camada): blocos 153 a 156 e 157 a 167 hoje. Uma camada nova só põe a sua rocha em `GEM_LAYERS`, com os blocos que a linha dela pede.
- **Só da rocha:** as pedras não caem de monstro (o golem da mina deixou de soltar cristal) e a mina não tem mais veio de cristal. A exceção planejada são os geodos da camada 7, que sorteiam pela linha dela.
- **O encantador não muda:** a pedra decide a chance de raridade, como antes.

---

## 5. Salas de chefe: nada de trono por padrão

Pedido do Jonathan (2026-10-10): os chefes estavam caindo sempre no "chefe sentado no trono". Daqui para frente, cada chefe tem uma sala com uma ideia própria, que muda como se luta. Trono só se fizer muito sentido. Nas 12 camadas novas não tem nenhum.

| # | Chefe | A sala | O que ela muda na luta |
|---|---|---|---|
| 1 | A Mãe-Teia | ninho no teto | desce do teto pelo fio (já existe) |
| 2 | O Rei Esqueleto | salão do trono | o único trono da lista (já existe) |
| 3 | O Yeti Ancestral | Trono de Gelo | já existe; quando o gelo for revisto, dá para trocar o trono por um covil de ossos |
| 4 | O Rei Goblin | oficina da escavadeira | ele vem na escavadeira que tritura a parede (já existe) |
| 5 | A Mãe-Esporo | gruta alagada tomada pelo fungo | ela é a parede: cresce no fundo da gruta, o chão vira micélio e a água sobe com esporos |
| 6 | O Sineiro Afogado | a torre do sino, inteira | luta vertical; o sino derruba os andares e a luta desce pela torre até a cisterna |
| 7 | O Cervo de Pedra | a clareira dos troncos gigantes | perseguição; ele corre, atravessa troncos e derruba árvores de pedra que viram plataforma |
| 8 | O Autômato-Forja | dentro da grande forja | ele corre num trilho do teto como uma ponte rolante; alavancas dos anões soltam lava e travam engrenagens |
| 9 | A Rainha da Colmeia | a câmara dos ovos, uma esfera de favos | os favos quebram; cada favo aberto solta larvas ou abre caminho para chegar nela |
| 10 | O Leviatã | mar aberto, sobre os destroços de um navio | sem sala; os destroços sobem e afundam com a maré e ele sai da água de qualquer lado |
| 11 | Cinzarel, o Dragão Ancião | a cratera do tesouro | ele dorme no monte de ouro; o ouro desliza como avalanche quando ele pousa |
| 12 | O Último Titã | o próprio titã | ele é o terreno; o herói escala o corpo dele para chegar nos pontos fracos |
| 13 | O Arquiteto | uma sala que se monta sozinha | os blocos trocam de lugar a cada fase e a gravidade vira de lado |
| 14 | O Sem-Rosto | o salão dos espelhos | cada espelho faz uma cópia do herói com a arma dele; quebrar os espelhos é o caminho |
| 15 | O Príncipe do Caos | Trono do Caos | já existe; quando o Abismo descer, a sala vira a Fenda do Caos, sem trono ([15-abismo.md](15-abismo.md)) |
| 16 | Nox, Aquele Que Apaga | o escuro total | só a luz o machuca; ele apaga as tochas e o herói precisa acender braseiros |

---

## 5b. Famílias de monstro por camada

Para nenhuma camada repetir a cara de outra.

| # | Família |
|---|---|
| 5 | os Tomados: gente e bicho virando fungo |
| 6 | gente viva (saqueadores e o culto do Poço) e os afogados da cisterna |
| 7 | bestas de raiz, de pedra e de cristal |
| 8 | autômatos de runa e fantasmas dos anões |
| 9 | insetos da colmeia |
| 10 | gente-peixe e bichos do fundo do mar |
| 11 | kobolds e dracos, a cria do dragão |
| 12 | os nascidos dos titãs e os carniceiros dos ossos |
| 13 | construtos e vigias dos Antigos |
| 14 | as coisas do pesadelo |
| 15 | demônios (já existem) |
| 16 | o que a Escuridão gera |

---

## 6. Endgame

A camada 16 tem minério (noctírio) porque o Jonathan quer um sistema de endgame depois do Nox. A ficha da camada 16 deixa ganchos para ele, mas não desenha o sistema. Os ids de bloco 608 a 639 e os arquivos `js/230` em diante ficam reservados para ele.

---

## 7. Ordem sugerida

O roadmap é o passo 3, mas a ordem natural é esta: primeiro a preparação (seção 2: registro, 16 bits, geração em pedaços, medir), depois uma camada por vez de cima para baixo, da 5 à 14, depois a 16. O Abismo desce para a 15ª quando a camada 14 estiver pronta. Até lá ele continua logo abaixo da camada nova mais funda que existir.
