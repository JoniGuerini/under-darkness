# As Cavernas de Gelo: especificação

A terceira camada, debaixo das Criptas da catedral, de 372 a 558 m (o mundo passou de 440 para 640 blocos de altura). A ficha do bioma está em `docs/biomas.md` (parte 4); as regras gerais em `docs/regras-de-bioma.md`.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/69-gelo-api.js` | ids de blocos (74 a 93), paredes (18 a 22), camada distante (14 a 17), faixas `IC_BANDS`, `IC_D = 186`, zonas 13 a 16 (`IC_ZONE0`), `iceBand`, `IC_SLIP`, `icExits`, `icBoss`. `GELO = false` desliga a camada inteira. |
| `js/70-gelo-blocos.js` | texturas (neve, neve batida, gelo, gelo azul, permafrost, rocha gelada, gelo negro, calcário congelado, veio de gelo, barreira), paredes, camada distante, minérios no gelo (ferro, ouro, cristal), decoração de 1 bloco (sincelo, estalagmite, cristal, cristal de teto, montinho de neve, ossos, coluna de gelo), itens de bloco, quais blocos escorregam. Exporta `ICART`. |
| `js/71-gelo-objetos.js` | 20 objetos de cena (`gelo: true`), o Trono de Gelo e o plano por faixa `IC_PROP_PLAN`. |
| `js/72-gelo-bichos.js` | yeti, lobo da geada, espírito da nevasca, verme da geada, sentinela de gelo, gosma gelada: arte, IA, projéteis (`icThrow`, `icWave`), lentidão do frio (`icSlowT`), sons, drops, materiais. Exporta `ICB` (o yeti em qualquer escala, para o chefe). |
| `js/73-gelo-mundo.js` | geração (`icBuild`, `icAfter`, `icPlaceProps`), camada distante, zonas, spawn, nível, loot, gelo escorregadio, brilhos, neve caindo, loja, missões, save (`wg: 4`). |
| `js/74-yeti-ancestral.js` | o chefe, a sala do trono e o Manto do Yeti Ancestral. |
| `js/78-gelo-novos.js` | sincelo vivo, caçador congelado (arpão que puxa), javali da tundra (investida que quebra gelo), wendigo (some no escuro, grito, foge de tocha); arte, IA, sons, drops, materiais (olho de sincelo, ponta de arpão, presa de javali, galhada), missões e o spawn novo das 4 faixas. |

## 2. Faixas

| Zona | Faixa | Metros | Material | Monstros |
|---|---|---|---|---|
| 13 | Fendas Geladas | 372 a 418 | calcário congelado, permafrost, rocha gelada | lobo, espírito, gosma, verme, sincelo, caçador |
| 14 | Salões de Gelo Azul | 418 a 476 | gelo azul, gelo, lagos congelados | lobo, espírito, sentinela, sincelo, caçador, javali |
| 15 | Covis dos Yetis | 476 a 528 | permafrost, neve batida, neve no chão | yeti, lobo, verme, espírito, javali, wendigo |
| 16 | Coração do Inverno | 528 a 558 | gelo negro, cristais | sentinela, yeti, espírito, lobo, wendigo |

Nível dos monstros: 6 + 1 a cada 60 m (até 8), 30% vêm 1 nível acima. Loot: profundidade 4 em toda a camada. Lobos chegam em bando (1 ou 2 a mais); o verme nasce enterrado.

## 3. Geração

`buildCathedral` ganha mais um passo no fim (73): `icBuild` e `icAfter`. O 74 embrulha por fora para montar a sala do trono.

1. Rocha por faixa com bordas em ruído; o gelo sobe pelas 10 últimas fileiras das Criptas (calcário congelado). Abaixo de 558 m até a rocha-mãe: gelo negro e rocha.
2. Autômato celular (≈27% de ar, como as cavernas), as duas grutas no pé das descidas, o Trono de Gelo (40 x 16, a 550 m, do outro lado do mundo em relação às descidas), câmaras por faixa (grutas, salões de 28 a 55 x 14 a 24, covis, grutas de gelo negro), fendas altas nas Fendas e túneis largos dentro e entre faixas (raio 2,2 nos Covis, onde passa o yeti). Bolsões minúsculos fechados e ilhas soltas removidas.
3. As descidas: em duas salas das Criptas mais baixas, longe uma da outra, o chão se abre numa fenda de 9 blocos que desce até uma gruta com chão garantido a 386 m. Degraus de 3 blocos a cada 3 fileiras, alternando os lados, de baixo até a sala: dá para voltar pulando. Os degraus e o chão debaixo deles ficam fora da decoração e dos túneis (`icLedge`); objetos da cripta que perderam o chão saem (`icPruneProps`).
4. Minérios: carvão (bloco 123, `IC_O_CARVAO`) na rocha e ouro na rocha e no gelo negro, em toda a camada. Um metal por camada (`js/102-minerios-camada.js`).
5. Alcance garantido a partir das descidas: cada bolsão que sobrar ganha um túnel até a parte alcançada.
6. Acabamento: lagos de gelo no chão dos Salões, neve no chão dos Covis, geada nas paredes e tetos das Fendas, veios de gelo que brilham no gelo azul e negro (só parede e teto), colunas de gelo nos Salões (chão ao teto), sincelos em corrente, estalagmites, cristais, montinhos de neve, ossos, crânios e cacos nas Fendas, objetos grandes por último.

## 4. Gelo escorregadio

Gelo, gelo azul, gelo negro, veio e barreira (`IC_SLIP`). Com o herói no chão em cima deles, `updatePlayer` só aplica 22% da mudança de velocidade: demora para arrancar e para frear, e solta pó de gelo. Neve, permafrost, rocha e calcário não escorregam. Os degraus das descidas e o chão da sala do chefe nunca escorregam.

## 5. O Yeti Ancestral

- Vida 900 e dano 22 antes da escala (225 / 9 no jogo), nível 9, 320 de XP. Desenhado com o yeti do 72 refeito a 1,8x (54 x 67), com chifres e cristais nas costas.
- Entrar na sala acende a luta: paredes de gelo que não se cavam fecham as saídas. Sair, morrer ou usar o portal recomeça. Nada mais nasce na sala fora da luta.
- Fase 1: soco duplo com onda de choque para os dois lados (pule); arranca dois blocos e arremessa um que se quebra em 3 lascas.
- Fase 2 (60%): ruge; caem de 5 a 7 sincelos do teto com sombra de aviso (um em cima do herói) e chama 2 lobos (de novo a cada 14 s, no máximo 3).
- Fase 3 (25%): mais rápido; carrinho de barriga de parede a parede (fica tonto 2,2 s se bater, e caem 3 sincelos); bafo de geada em cone que segue o herói devagar, fere a cada 0,3 s e deixa lento 2 s.
- Golpes não interrompem os ataques dele.
- Solta o Manto do Yeti Ancestral (corpo lendário: defesa 7, +8 de vida depois da escala, `lgGeada` 3 s, `lgFirme`), poções, pelo de yeti e lascas de gelo eterno. Salvo como `yeti.dead`.

## 6. Itens e efeitos novos

- `lgGeada`: quem acerta o herói de perto (golpe que entra ou é bloqueado) fica resfriado pela Nevasca (`nevChillT`) por X s.
- `lgFirme`: zera `cvSlowT` e `icSlowT` e cala os avisos "PRESO NA TEIA" e "GELADO".
- Materiais: Pelo de Yeti (14), Presa de Lobo (6), Essência Gélida (12): a Marta compra; Lasca de Gelo Eterno (20): o Grimaldo compra. Três missões novas do ancião.

## 7. Save

`makeSave` grava `wg: 4` e `yeti`. Um save antigo (`wg` 1 a 3) ganha mundo novo e mantém nível, itens e ouro; os três chefes voltam a viver. Aparece um aviso de novidade ao entrar.
