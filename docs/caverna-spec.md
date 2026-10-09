# As Cavernas: especificação

A primeira camada debaixo do vilarejo, de 6 a 186 m. A catedral começa logo abaixo, no Átrio (186 m). A ficha do bioma está em `docs/biomas.md` (parte 2); as regras gerais em `docs/regras-de-bioma.md`.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/52-caverna-api.js` | ids de blocos (54 a 73), paredes (13 a 17), camada distante (10 a 13), faixas `CV_BANDS`, `CAVE_D = 186`, zonas 9 a 12, `caveBand`, `cavePortalEnd`, `caveExits`. `CAVERNA = false` desliga a camada inteira. |
| `js/53-caverna-blocos.js` | texturas (terra úmida, argila, rocha, musgo, calcita, cascalho, xisto, teia), paredes, camada distante, minérios na rocha, decoração de 1 bloco, itens de bloco. Exporta `CVART`. |
| `js/54-caverna-objetos.js` | 20 objetos de cena (`caverna: true`) e o plano por faixa `CV_PROP_PLAN`. |
| `js/76-cavernas-novos.js` | fungo esporento (nuvem de esporos, veneno), centopeia das rochas (anda em parede e teto), goblin dinamiteiro (dinamite que quebra blocos); arte, IA, sons, drops, materiais (esporo, patas de centopeia, pólvora), missões e o spawn novo das faixas. |
| `js/55-caverna-bichos.js` | rato, aranha, cuspideira, besouro, filhote; slime (3 cores novas) e morcego repintados; IA, sons, drops, materiais (pele de rato, glândula, quitina). |
| `js/56-caverna-mundo.js` | geração, passagem para a catedral, zonas, níveis, loot, loja, missões, save (`wg: 3`). |
| `js/57-mae-teia.js` | a chefe, a Câmara do Ninho e a Presa da Mãe-Teia. |

## 2. Faixas

| Zona | Faixa | Metros | Material | Monstros |
|---|---|---|---|---|
| 9 | Grutas Rasas | 6 a 60 | terra úmida, argila, rocha | slime, morcego, rato, fungo |
| 10 | Galerias de Pedra | 60 a 120 | rocha, calcita, poços | aranha, besouro, morcego, rato, fungo, centopeia |
| 11 | O Ninho | 120 a 168 | xisto, teia | aranha, cuspideira, besouro, morcego, filhote |
| 12 | Fundações Soterradas | 168 a 186 | rocha virando calcário | aranha, besouro, cuspideira, morcego, centopeia, goblin |

Nível dos monstros: 1 + 1 a cada 50 m (até 4); na catedral começa no 2 e sobe 1 a cada 45 m. Loot por faixa: 1, 1, 2, 2.

## 3. Geração (`cvBuild` antes da catedral, `cvAfter` depois)

1. Rocha por faixa com ruído; a crosta da superfície fica como estava.
2. Grutas por autômato celular, câmaras por faixa, túneis (minhocas) dentro e entre faixas, poços nas galerias.
3. A Câmara do Ninho: 34 x 14, a 158 m, do outro lado do mundo em relação ao vilarejo (`cvBoss`).
4. Duas grutas de saída nas Fundações (`caveExits`); a 45 constrói a escadaria em ruína de cada uma até o átrio. Três bocas naturais.
5. Limpeza: bolsões de ar minúsculos e ilhas de rocha soltas (< 24 blocos).
6. Minérios: carvão 6–186 m, cobre 6–120, ferro 35–186, ouro 100–186.
7. Depois da catedral: o portal de pedra se desfaz em terra, gruta no fim da escada, alcance garantido a partir da entrada (túneis de ligação), forro só em parede e teto, decoração, 12 baús, objetos.

## 4. A Mãe-Teia

- Vida 640 e dano 16 antes da escala (160 / 6 no jogo), nível 4, 260 de XP.
- Entrar na câmara fecha as saídas com teia; sair recomeça a luta. Nada mais nasce na câmara fora da luta.
- Fase 1: mordida e leque de 3 bolas de teia. Fase 2 (60%): sobe no fio, fica sobre o herói com sombra no chão e despenca; os ovos chocam filhotes (até 4, de novo a cada 12 s). Fase 3 (25%): mais rápida, 5 bolas, salta de parede a parede.
- Solta a Presa da Mãe-Teia (adaga lendária: `lgVeneno`, cada golpe envenena por 4 s; crítico e velocidade de ataque), poções, seda e glândulas. Salvo como `teia.dead`.

## 5. Save

`makeSave` grava `wg: 3`. Um save antigo (`wg` 1 ou 2) ganha mundo novo e mantém nível, itens e ouro; o Rei Esqueleto e a Mãe-Teia voltam a viver. Aparece um aviso de novidade ao entrar.
