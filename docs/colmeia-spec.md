# A Colmeia: o que foi feito

A nona camada, debaixo da Fortaleza dos Anões, de 1488 a 1674 m (2026-10-10). A ficha de desenho, com as faixas, os insetos, a Rainha e o loot, é [camadas/09-colmeia.md](camadas/09-colmeia.md). Este arquivo diz onde cada parte ficou no código e o que mudou em relação à ficha. Os números de arquivo da ficha (160 a 169) viraram 190 a 199.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/190-colmeia-api.js` | ids de blocos (384 a 411), paredes (53 a 57) e terceira camada (36 a 38) `CM_*`, `CM_S0`, `CM_D`, zonas 41 a 44 (`CM_ZONE0`), `colmeiaBand`, `cmAbove` (a camada de cima que estiver no disco), `cmEntries`, `cmExits`, `cmBoss`, `cmFunnels`, os estados do herói (`cmEncasular`, `cmPorOvo`), o chamado das operárias (`cmChamar`) e `HATCH`. `COLMEIA = false` desliga a camada. |
| `js/191-colmeia-blocos.js` | texturas (`CMART`, paletas `cm*`), hexágonos dos favos, paredes, terceira camada, carvão e ambrita, itens de bloco, a decoração de 1 bloco, Escada de Favos e Fio de Cera escaláveis, a gota de mel que cai, os brilhos. |
| `js/192-colmeia-objetos.js` | os 28 objetos de cena, `CM_PROP_PLAN` e `CM_BACK_FLOOR`. |
| `js/193-colmeia-insetos.js` | operária, soldada porteira, formiga-leão, correição e larva faminta. |
| `js/194-colmeia-insetos2.js` | vespa-resineira, vespa-parasita, zangão, besouro-bombardeiro e cigarra-tambor. |
| `js/195-colmeia-mundo.js` | geração (`cmBuild`, `cmAfter`, `cmPlaceProps`, `cmExitClear`, `cmClimbFix`), terceira camada, zonas, spawn, nível, a formiga-leão de volta aos funis, partículas, a ambrita na fornalha e nas lojas. |
| `js/196-rainha-colmeia.js` | a chefe: a esfera de favos (`cmDress`), as 3 fases, o saco de ovos, o Lacre Real, o reinício e o Ferrão Real. Salva em `rainha`. |
| `js/197-ambrita.js` | o metal (7 minérios por barra), as 9 peças, os materiais e as três bases da camada. Carrega logo depois do 138. |
| `js/198-colmeia-save.js` | nomes das zonas e o save (`wg: 14`). |
| `js/199-colmeia-estados.js` | encasulado, ovo de parasita, poça de mel, blocos que soltam larva (`cmQuebra`), a operária que lacra (`cmBroken`, `cmCanSeal`, `cmSeal`). |

## 2. Geração, em ordem

1. A rocha por faixa: a pedra de cima afina nas últimas 10 linhas e vira Pedra Tomada; depois Cera Velha (com Cera Nova), Resina nas Câmaras e Cera Real no Berçário, bordas por ruído. Sem autômato de caverna.
2. As duas brechas: de duas salas do fundo da camada de cima, um tubo de cera de 3 com a Escada de Favos por 20 a 28 linhas até o pouso (salão anão de 12 x 6 com lanterna, sem spawn), e um salão anão logo depois da porta.
3. A esfera da Rainha do outro lado do mundo: uma caixa sólida de 44 x 44 que o 196 veste, com as duas galerias reais (4 de altura, chão e teto de quitina) saindo das aberturas até uma câmara de ovos de cada lado.
4. Os dois Escorredouros de Mel em câmaras de ovos do fundo, a pelo menos `WW / 3` um do outro e longe da esfera: um poço de 3 forrado de favo de mel com a escada até a última linha. O Abismo continua de lá (`cmExits`).
5. Salões anões na Brecha; favais (3 a 6 salas hexagonais coladas) e o labirinto de galerias de degraus (sobem no máximo 3, gargalos de 2, um túnel para quando encosta em outro) nas Galerias; câmaras redondas de resina com massas de âmbar (1 em 12 com fóssil); câmaras de ovos e galerias reais no Berçário.
6. Túneis de inseto ligando as salas de cada faixa, entre faixas e os poços de 3 com escada; cascas de cada sala; veios de carvão (resina, pedra tomada) e de ambrita (resina, âmbar; dois terços nas Câmaras).
7. Depois: tudo alcançável das brechas, Escada de Favos em todo desnível de 5, mel escorrido em 30% dos favos, montes de cera nova nas Galerias, 3 x `WSC` funis de pó de cera por faixa da formiga-leão, decoração de 1 bloco e objetos.
8. A esfera (`cmDress`), as bocas das brechas, a subida garantida (das aberturas da esfera, das câmaras de âmbar, das de ovos e do pé dos escorredouros até as brechas). O 87 liga o resto.

## 3. Decisões (Jonathan pediu sem perguntas, ficaram as recomendadas)

1. A operária lacra com Cera Nova o que o herói quebrou nos últimos 60 s, nunca no bloco dele nem nos 8 em volta, nunca escada, fio, a esfera, o pouso ou as bocas.
2. A larva come o loot do chão e cresce, mas sempre devolve tudo ao morrer.
3. Túneis de no máximo 12 de altura fora das câmaras de âmbar e da esfera; o zangão só nas Câmaras e no Berçário (e só onde o teto passa de 8).

## 4. O que mudou junto

- O Abismo desceu mais uma camada e continua o último. `WH` sobe 186 linhas. Mundos de antes são refeitos (`wg 14`); nível, itens, ouro e o baú da vila continuam.
- Ambiente sonoro (cena `colmeia` no 97: o zumbido de asas, a respiração da colmeia, eco curto), gemas (117), as ligações do 87 (não mexe na esfera, nas brechas nem nas escadas de favo) e a wiki ganharam a camada.
- Sem missões do ancião (as missões foram tiradas do jogo) e sem baús.
