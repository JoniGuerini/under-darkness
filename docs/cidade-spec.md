# A Cidade Afundada: o que foi feito

A sexta camada, debaixo das Minas Fúngicas, de 930 a 1116 m (2026-10-10). A ficha de desenho, com as faixas, os monstros, o chefe e o loot, é [camadas/06-cidade-afundada.md](camadas/06-cidade-afundada.md); este arquivo diz onde cada parte ficou no código e o que mudou em relação à ficha.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/130-cidade-api.js` | ids de blocos, paredes e camada distante `CD_*`, `CD_S0`, `CD_D`, zonas 29 a 32 (`CD_ZONE0`), `cidadeBand`. `CIDADE = false` desliga a camada. |
| `js/131-cidade-blocos.js` | texturas (`CDART`, paletas `cd*`), paredes, camada distante, decoração de 1 bloco, itens de bloco, os sininhos. |
| `js/132-cidade-objetos.js` | os objetos de cena e o plano por faixa `CD_PROP_PLAN`, o fundo das casas `CD_BACK_FLOOR`. |
| `js/133-cidade-vivos.js` | `humanStep` (fugir, beber, alarme, escadas) e saqueador, besteiro, armadilheiro, telhadeiro. |
| `js/134-cidade-culto.js` | noviços (`cdFollower`), pregador, penitente, emparedador, a marca e a Parede Fresca. |
| `js/135-cidade-afogados.js` | afogado e boiante. |
| `js/136-cidade-mundo.js` | geração (`cdBuild`, `cdAfter`, `cdPlaceProps`, `cdExitClear`, `cdClimbFix`), zonas, spawn, nível, estados do herói, brilhos, lojas, drops das bases. |
| `js/137-sineiro-afogado.js` | o chefe: a torre (`cdDress`), as fases, os pisos que quebram, o Badalo do Sineiro. |
| `js/138-prata.js` | o metal (6 minérios por barra), as 9 peças, os materiais e as três bases da camada. |
| `js/139-cidade-save.js` | nomes das zonas, a água refeita no fim da geração, a água negra, o save (`wg: 11`). |

## 2. Geração, em ordem

1. Rocha por faixa e cavernas ralas por autômato.
2. As entradas: debaixo de cada descida das Minas Fúngicas, um salão-cisterna 40 x 14 com uma laje de cantaria, a casa da guarda (pouso sem spawn) e o poço com cordão e escada.
3. A torre do Sineiro (20 x 50), do lado oposto às entradas, com a ponte de telha no alto e a porta embaixo.
4. O Grande Poço, longe da torre e das entradas: dá para descer de corda até a tampa.
5. Aqueduto, cisternas e esgotos (x `WSC`) com água.
6. Ruas em três andares por faixa, com quarteirões tortos, rachaduras com madeirame e entulho; a praça do Poço, templos (o primeiro de frente para o Poço), acampamentos, casas de 2 e 3 andares com telhado e escada, casas do culto, becos.
7. Adegas que descem, os salões do palácio, túneis ligando tudo, veios de carvão e prata.
8. Água nas cisternas, escadas e correntes nas quedas, decoração e objetos de cena.

## 3. O que mudou junto

- O Abismo desceu para a sétima camada (1116 a 1302 m): monstros 15 e 16, Príncipe nível 17.
- `WH` sobe 186 linhas. Mundos de antes são refeitos (`wg 11`); nível, itens, ouro e o baú da vila continuam.
- Teleporte, ambiente sonoro (cena `cidade`), gemas e wiki ganharam a camada.
- O 87 não apaga mais os cordões e escadas das descidas (antes sumiam os cordões das quedas das Minas Fúngicas).
- Decisões do Jonathan: o Grande Poço desce de corda até a tampa; o saqueador só pega o que caiu de monstro; a Parede Fresca desmorona em 30 s.
