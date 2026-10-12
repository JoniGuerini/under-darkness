# O Abismo: o que muda quando ele descer para a 15ª camada

> **2026-10-12:** a camada tem 558 m, de 8928 a 9486 m abaixo do chão do vilarejo: o desenho de 186 m esticado `LAYER_K = 3` vezes, com as faixas também 3 vezes mais altas e 3 andares de salas por faixa ([00-geral.md](00-geral.md), seção 1b). Os outros metros desta ficha são os do desenho de 186 m, da época em que ela foi escrita; dentro da camada, cada um vale 3. Quedas longas ganham pisos e o minério fica perto da borda (`js/313-quedas-minerios.js`), e a camada só é gerada quando o herói entra na de cima dela (`js/312-gera-aos-poucos.js`).

O Abismo já existe: hoje é a 5ª camada, de 744 a 930 m, logo abaixo da Mina, e a ficha dele continua sendo a [../abismo-spec.md](../abismo-spec.md). Este documento não refaz a ficha: ele lista só o que muda quando o Abismo virar a 15ª camada, de 2604 a 2790 m, entre Os Salões do Pesadelo (14) e A Escuridão (16). Blocos, objetos, os 10 demônios e o jeito de lutar de cada um ficam iguais.

**O que diferencia o Abismo das vizinhas:** os Salões do Pesadelo são o sonho que vira real e a Escuridão é a falta de tudo; o Abismo é o único lugar barulhento, quente e cheio de luz do fundo do mundo. É o último lugar onde ainda tem fogo.

---

## 1. Profundidade: o registro de camadas no lugar dos topos fixos

Hoje a profundidade do Abismo está escrita no código em dois lugares:
- `js/103-abismo-api.js`: `AB_TOP = MN_TOP + 186` e `AB_S0 = MN_S0 + MN_D`.
- `js/108-abismo-mundo.js`: `abBuild` recalcula `AB_S0 = MN_S0 + ...` e as fendas procuram as salas das fornalhas da mina (`mnChambers`, `mnBoss`).

Com o registro `LAYERS` (seção 2 do [00-geral.md](00-geral.md)), o Abismo vira uma entrada da lista com id `abismo`, e o topo dele sai da posição dele na lista:

| | Hoje | Depois |
|---|---|---|
| Posição | 5ª, logo abaixo da mina | 15ª, abaixo dos Salões do Pesadelo |
| Metros | 744 a 930 | 2604 a 2790 |
| `AB_S0` | `MN_S0 + MN_D` | `LAYERS.top('abismo')` |
| Camada de cima | a Mina (ele escolhe duas salas de fornalha) | a camada 14, pelas descidas que ela anotou |

- `AB_TOP` e `AB_S0` deixam de somar a mina e passam a ler o registro. `AB_BANDS` (0, 46, 98, 150, 186), as zonas 21 a 24 e os ids 128 a 152 não mudam.
- **Enquanto as camadas 5 a 14 não existem**, o Abismo é sempre o último da lista (seção 7 do 00-geral). Ele desce sozinho a cada camada nova que entra: não tem número de metro escrito em lugar nenhum.
- **Os números de nível também saem da posição**, para valer no meio do caminho: monstros de 2n+1 a 2n+2, forja 2n−1, bases 2n+1, chefe 2n+3 (n = posição). Na posição 15 isso dá exatamente a tabela do 00-geral: 31 a 32, forja 29, bases 31, chefe 33. Na posição 5, onde ele está hoje, dá 11 a 12 e chefe 13.

## 2. Monstros: nível 31 a 32

Em `js/108-abismo-mundo.js`, perto da linha 490, o `spawnEnemy` embrulhado faz hoje `lvl = 11 + min(1, floor(d / 93))`, com 30% vindo 1 acima sem passar de 12. Muda só a base:
- `11` vira o nível inicial da camada no registro (31 na posição 15). Fica `31 + min(1, floor(d / 93))`: 31 na metade de cima (Portões de Cinza e Rios de Fogo), 32 na metade de baixo; os 30% de sorte nunca passam de 32.
- As fórmulas de vida (×1,3 por nível), dano (×1,2 por nível), XP e ouro continuam as mesmas, só com o nível novo. Um Demônio Brutamontes de nível 31 fica com 10 vezes a vida base, como qualquer monstro de nível 31 das outras camadas.
- As tabelas de spawn (`CATH_SPAWN` das zonas 21 a 24) e os máximos (9 e 10) não mudam.

## 3. O chefe: O Príncipe do Caos no nível 33

Em `js/109-principe-caos.js`, `PR = { hp: 1400, dmg: 30, lvl: 12 }` vira, pela fórmula dos chefes (vida 330 × (1 + 0,3 × (nível − 1)), dano 9 × (1 + 0,2 × (nível − 1))):

| | Hoje (nível 12) | Depois (nível 33) |
|---|---|---|
| Vida | 1400 | 3500 (330 × 10,6) |
| Dano | 30 | 67 (9 × 7,4) |
| XP | 420 | 420 (XP baixo; o nível já multiplica) |

- São os números antes do `BAL` do `js/49-itens-efeitos.js`, como hoje (o 49 corta vida e dano de todo `ET` depois).
- **Lacaios** (`prSpawnFrom`): hoje diabretes e cães saem dos portais com `lvl = 11`, vida ×4 e dano ×3. Passam a nível 32 (um abaixo do chefe, como hoje): vida ×10,3 e dano ×7,2. Os dois números saem de `PR.lvl − 1`, não escritos à mão.
- **Coração do Caos** (`coracao_caos`): `BASE_INFO.coracao_caos = [10]` vira `[33]`, o nível do chefe.
- Fases (60% e 25%), ataques, avisos e a chave de save (`principe.dead`) não mudam.

## 4. A infernita na forja: nível 29 e 9 minérios por barra

- `js/110-infernita.js`: `FORGE_ILVL.push(7)` vira 29. O texto da barra ("Fundida de 6 minérios") vira 9.
- `js/108-abismo-mundo.js`: `FURN.min_infernita = { n: 6 }` vira `n: 9`. Os preços em `MAT_VAL` (minério 40, barra 260) sobem junto com a curva de preço das camadas novas (o valor final fica para a tabela de economia do roadmap).
- **Cuidado com a ordem dos metais.** Hoje `FORGE_ILVL` é uma lista na mesma ordem de `METALS`, e o 110 carrega antes dos arquivos 120 a 219. Com as camadas novas, a infernita entraria na bigorna antes da esporita. Proposta: cada metal guarda o próprio nível (`M.il`) e a posição da camada; `baseInfo` lê `METALS[t].il`, e a bigorna ordena pela posição. Assim nenhuma camada depende da ordem de carregamento.
- **O teto de nível de item.** `mkItem` e `rollItem` (`js/48-itemizacao.js`) prendem o nível em 1 a 12, e `rollRarity` prende a profundidade em 1 a 4. Se a preparação ainda não tiver aberto esse teto (até 40), a infernita de nível 29 sai como 12. É uma linha em cada função, mas tem que estar pronta antes.

## 5. Os itens antigos de demônio sobem de nível

Pela regra do 00-geral (bases temáticas no nível do primeiro monstro, lendário no nível do chefe), em `BASE_INFO` do `js/48-itemizacao.js`:

| Item | Hoje | Depois | Quem solta |
|---|---|---|---|
| `elmo_chifres` (Elmo de Chifres) | 5 | 31 | diabrete, brutamontes, cultista, gárgula |
| `machado_chifre` (Machado de Chifre) | 5 | 31 | brutamontes, gárgula, salamandra |
| `grevas_demonio` (Grevas Demoníacas) | 6 | 31 | cão, brutamontes, rastejador, salamandra |
| `escudo_infernal` (Escudo Infernal) | 6 | 31 | brutamontes |
| `lamina_infernal` (Lâmina Infernal, lendária) | 7 | 31 | brutamontes, alma penada, cultista, o Príncipe |
| `coracao_infernal` (Coração Infernal, lendário) | 7 | 31 | o Príncipe |
| `coracao_caos` (Coração do Caos, lendário) | 10 | 33 | o Príncipe |

O que precisa de ajuste junto:
- **Itens que caem em outras camadas.** `grevas_demonio` também cai do yeti e do wendigo (`js/72`, `js/78`) No nível 31 elas quebrariam o gelo: saem dessas listas e viram `botas_ferro` no yeti e no wendigo. (O `elmo_chifres` estava no `CHEST_LOOT[3]`, mas os baús de loot já saíram do jogo inteiro.)
- **Itens genéricos que os demônios soltam** (`anel_vampiro`, `anel_furia`, `lanterna_fantasma`, `montante_ouro`) ficam no nível de hoje e **saem** das tabelas de drop do Abismo: no nível 31 eles seriam lixo.
- **Lendários que o jogador já tem.** `mkItem` ignora o nível salvo de um lendário e lê `BASE_INFO` de novo. Sem cuidado, quem já tem a Lâmina Infernal no nível 7 acorda com ela no nível 31. Proposta: o lendário passa a guardar o nível com que caiu, e só os novos nascem no nível novo.

## 6. A entrada: das Fornalhas para os Salões do Pesadelo

- **Hoje:** `abBuild` escolhe duas salas `fornalha` da mina, longe da oficina do Rei Goblin, e cava as fendas no chão delas.
- **Depois:** as duas fendas saem da última faixa da camada 14 (Os Salões do Pesadelo), nas posições que ela anotou como descidas (como o `mnExits` faz hoje). O desenho da fenda continua: o piso do pesadelo racha e fica vermelho, crosta acesa em volta da boca, um poço forrado de ferro negro com a escada até um salão em ruína dos Portões de Cinza. Volta-se pela mesma escada.
- **As fendas das Fornalhas Esquecidas não somem:** viram as duas descidas para a camada 5 (As Minas Fúngicas). Quem gera a boca delas passa a ser a ficha da camada 5; o código das fendas sai do 108 e vira a regra geral "a camada de cima anota, a de baixo abre".
- A transição de material (a escória da mina afinando, a cinza subindo nas últimas 8 linhas de cima) passa a ler os blocos da camada 14 em vez de `MN_SOILS`.

## 7. A sala do chefe: de Trono do Caos para Fenda do Caos

Pedido do Jonathan: menos tronos. O Príncipe fica igual; muda a sala.

**A ideia:** o Príncipe nunca foi rei de nada. Ele é o guarda. No fundo do Abismo há uma rachadura na rocha que desce até a Escuridão, e ele passou a eternidade em pé diante dela, segurando o que sobe. Até o Inferno tem medo do que está embaixo. É a primeira pista física da camada 16.

**A sala (mesmos 56 x 20, mesmo lugar, do outro lado do mundo em relação às fendas):**
- No meio da parede de fundo, no lugar do trono, a **Fenda**: uma rachadura de uns 5 blocos de largura que vai do chão até perto do teto, presa por correntes de ferro negro cravadas na pedra do caos. Dentro dela não tem fundo pintado: só preto, com uma borda roxa que pulsa. Objeto novo `ab_fenda` (apoio `fundo` + `chao`), no lugar de `ab_trono`.
- No chão, embaixo da Fenda, uma **costura de crosta de magma** (`AB_CROSTA`) de 9 blocos, que brilha fraca.
- As duas estátuas, os braseiros grandes, os estandartes, as runas, os crânios e as correntes do teto continuam onde estão.

**O que muda na luta (pouco):**
- **Entrada:** em vez de se levantar do trono, ele sai de dentro da Fenda, de costas, e se vira (mesmo estado `intro`, mesmos 2,8 s sem tomar dano, mesmo rugido). As correntes da Fenda balançam.
- **Fase 2:** os gêiseres de lava continuam iguais, e um deles sempre sai da costura de crosta (com o mesmo aviso do círculo brilhando). É o único ataque novo de posição: o meio da sala fica perigoso na fase 2.
- **Quando ele morre:** a borda roxa da Fenda apaga devagar e ela fica só preta e fria. Um fio de partículas escuras sobe dela para sempre. Nada abre: as descidas para a 16 são outras (seção 9).
- Grades, reinício ao sair ou morrer, portais, meteoros e mergulho ficam iguais.

## 8. A faixa do fundo: "Trono do Caos" vira "Templos do Caos"

A zona 24 se chama Trono do Caos por causa do trono. Sem trono, ela vira **Templos do Caos**, que é o que ela tem: templos de tijolo infernal, altares, runas e a Fenda. O subtítulo "tudo aqui obedece a alguém" continua. No código: o nome em `ZONE_NAMES` (108), `AB_BAND_NAMES` passa de `trono` para `templos` (103) e a grade `AB_BARREIRA` muda de nome na wiki para "Grade da Fenda do Caos".

## 9. Duas descidas novas para a camada 16

O Abismo passa a ter duas descidas no chão dos Templos do Caos, longe uma da outra e longe da Fenda do Caos, anotadas em `abDown` para a camada 16 ler.

- **Como são:** um poço redondo de uns 4 blocos de largura onde o fogo acaba. Na boca, pedra do caos e braseiros acesos. Descendo, a pedra perde a cor e vira preta, os braseiros presos na parede do poço vão ficando mais fracos e o último está apagado. Uma corrente de ferro negro (`AB_CORRENTE`, escalável) desce até o fim. Volta-se pela mesma corrente.
- Cada uma tem a câmara de pouso na boca, do lado do Abismo: um templo pequeno, plano, com dois braseiros, onde não nasce monstro.
- O resto da descida (a chegada lá embaixo) é da ficha da camada 16.

## 10. Saves que já existem

Quando a camada 5 entrar, todo save de hoje tem o Abismo onde a camada 5 vai ficar.

- **O save passa a guardar a lista de camadas que gerou** (por exemplo `['cavernas', 'catedral', 'gelo', 'mina', 'abismo']`), não só o número. Ao carregar, o jogo compara com `LAYERS`: a primeira posição diferente e tudo abaixo dela é gerado de novo; tudo acima fica como está.
- **Na prática, na primeira vez:** a semente continua a mesma, então as camadas 1 a 4 saem idênticas e as alterações salvas delas (`diffs`) valem. As linhas de 744 m para baixo são geradas de novo como camada 5; as alterações, o mapa visto (`seen`) e os pontos de volta abaixo de 744 m são apagados.
- **O herói fica com** nível, itens, ouro e o baú do vilarejo. As peças de infernita e os itens de demônio que ele já tem guardam o nível com que caíram.
- **O Príncipe volta** (`principe = null`): quem já matou vai encontrá-lo de novo na 15ª, no nível 33. As mortes dos chefes de 1 a 4 continuam salvas.
- **Se o herói estava salvo dentro do Abismo**, ele acorda no vilarejo (como o `js/111-abismo-save.js` já faz ao refazer o mundo).
- Uma linha de novidade na primeira carga, como a do 111 hoje: "O Abismo desceu. Debaixo da Mina agora há as Minas Fúngicas." O 111 deixa de sortear semente nova: ele só refaz o que mudou.
- O mesmo vale para cada camada nova até a 14: o Abismo sempre é o último e é sempre ele que é gerado de novo.

## 10b. Baús

Os baús de loot do Abismo já não existem: os baús aleatórios foram tirados do jogo inteiro (só fica o baú do vilarejo). O Abismo não ganha baú nenhum ao descer; as bases e os lendários de demônio caem só dos monstros e do Príncipe (seção 5). O `abClimbFix` deixa de partir dos `abChestSpots` e parte só da Fenda do Caos, dos templos, das câmaras de carne e dos lagos.

## 11. As 3 missões do ancião

As 3 missões do Abismo (essência demoníaca, olhos de demônio, infernita) saíram do jogo junto com todo o sistema de missões antigo (2026-10-10). Quando o Jonathan refizer o sistema, a camada ganha as dela no lugar novo.

## 12. Wiki e documentos

- `wiki/js/textos.js`: `abismo` (camada, metros, "o trono" vira "a Fenda"), `abismoEntrada` (as fendas saem dos Salões do Pesadelo), `abFaixas` (metros 2604 a 2790 e o nome Templos do Caos), `abMinerios` (metros), `principeOnde` (a Fenda do Caos), o nome da grade.
- `wiki/js/p-biomas.js`: a linha com `de: 744, ate: 930` passa a ler o registro; o subtítulo "A quinta camada" sai da posição.
- `wiki/js/p-inimigos.js`: o rótulo do chefe vira "Fenda do Caos, no fundo do Abismo".
- `docs/abismo-spec.md`: uma nota no topo dizendo que a profundidade, os níveis, a sala e a entrada mudaram, com link para este arquivo. O resto da ficha continua valendo.
- `docs/camadas.md` e `docs/regras-de-bioma.md` (a lista dos metais na ordem da forja põe a infernita depois da onirita), `LEIA-ME.md` (linhas do 103, 108, 109, 111).
- Refazer `wiki/js/docs.js` com `node wiki/ferramentas/atualizar-docs.js`.

## 13. Arquivos que mudam

| Arquivo | O que muda |
|---|---|
| `js/103-abismo-api.js` | `AB_TOP` e `AB_S0` pelo registro; `AB_BAND_NAMES` com `templos`; `abDown` (as descidas para a 16) |
| `js/108-abismo-mundo.js` | `AB_S0` pelo registro; as fendas pelas descidas da camada 14; transição com a camada 14; as duas descidas para a 16; nome da zona 24; nível 31 a 32; `FURN` com 9; preços; drops genéricos fora |
| `js/109-principe-caos.js` | `PR` nível 33 (3500 / 67); lacaios nível 32; `ab_fenda` no lugar do trono; entrada pela Fenda; gêiser da costura; a Fenda apaga quando ele morre; `BASE_INFO.coracao_caos` 33 |
| `js/110-infernita.js` | nível 29 (`M.il`), texto de 9 minérios |
| `js/111-abismo-save.js` | sem semente nova; refaz só as posições que mudaram; o Príncipe volta; lendários guardam o nível |
| `js/48-itemizacao.js` | `BASE_INFO` dos itens de demônio; `baseInfo` lê `METALS[t].il`; teto de nível (se a preparação não fez) |
| `js/72-gelo-bichos.js`, `js/78-gelo-novos.js` | `grevas_demonio` sai do gelo |
| `js/106` e `js/107` | tirar `anel_vampiro`, `anel_furia`, `lanterna_fantasma`, `montante_ouro` dos drops |
| `js/102-minerios-camada.js` | o comentário da tabela de camadas |
| wiki e docs | seção 12 |

`js/104`, `js/105`, `js/97-ambiente.js` (o som do Abismo) e `js/75-teleporte.js` (já lê `AB_S0` e `AB_BANDS`) não mudam.

---

## Decisões em aberto

1. **Os lendários que o jogador já tem sobem para o nível novo ou ficam no nível com que caíram?** Recomendo ficar: quem matou o Príncipe no nível 12 não deve ganhar um Coração do Caos de nível 33 de graça.
2. **O Príncipe volta para quem já matou?** Recomendo que sim: ele é outra luta no nível 33, e o Coração do Caos novo é o prêmio de chegar lá.
3. **O nome da faixa: Templos do Caos?** Recomendo esse, porque descreve o que a faixa tem. A outra opção é "Altares do Caos".
