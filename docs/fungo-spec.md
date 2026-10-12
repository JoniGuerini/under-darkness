# As Minas Fúngicas: o que foi feito

> **2026-10-12:** a camada tem 558 m, de 2232 a 2790 m abaixo do chão do vilarejo: o desenho de 186 m esticado `LAYER_K = 3` vezes, com as faixas também 3 vezes mais altas e 3 andares de salas por faixa ([camadas/00-geral.md](camadas/00-geral.md), seção 1b). Os outros metros desta ficha são os do desenho de 186 m, da época em que ela foi escrita; dentro da camada, cada um vale 3. Quedas longas ganham pisos e o minério fica perto da borda (`js/313-quedas-minerios.js`), e a camada só é gerada quando o herói entra na de cima dela (`js/312-gera-aos-poucos.js`).

A quinta camada, debaixo da Mina Abandonada, de 2232 a 2790 m (2026-10-10). A ficha de desenho, com as faixas, os monstros, a chefe e o loot, é [camadas/05-minas-fungicas.md](camadas/05-minas-fungicas.md); este arquivo diz onde cada parte ficou no código e o que mudou em relação à ficha.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/129-camadas.js` | o registro `LAYERS` (a ordem das camadas), `layerPos`, `layerLo`, `layerBossLvl`. Carrega logo depois do 01-base. |
| `js/171-agua.js`, `js/172-nadar.js` | a água comum (`agua`, `aguaBasin`, `aguaTom`) e o nado com fôlego. |
| `js/120-fungo-api.js` | ids de blocos (256 a 283), paredes (33 a 37), camada distante (24 a 26), faixas `FG_BANDS`, `FG_S0`, zonas 25 a 28, os estados esporado, lento e colado. `FUNGO = false` desliga a camada. |
| `js/121-fungo-blocos.js` | texturas, paredes, camada distante, minérios (carvão e esporita), decoração de 1 bloco, itens de bloco, a nuvem de esporos (`FGART`). |
| `js/122-fungo-objetos.js` | 28 objetos de cena `fg_*` e o plano por faixa `FG_PROP_PLAN`. |
| `js/123-fungo-tomados.js` | colono, marionete, semeador, mariposa, tapete. |
| `js/124-fungo-tomados2.js` | brotos (em bando, `fgFollower`), grilo, pernalta, mula, água-viva. |
| `js/125-fungo-mundo.js` | geração (`fungBuild`, `fungAfter`, `fungWater`, `fungExitClear`, `fungClimbFix`), zonas, spawn, nível, os estados no herói, brilhos, loja, drops das bases. |
| `js/126-mae-esporo.js` | a chefe: a gruta, a parede, as fases, o Lampião da Mãe-Esporo. |
| `js/127-esporita.js` | o metal (6 minérios por barra, nível de forja 9), as 9 peças, os materiais e as três bases da camada. |
| `js/128-fungo-save.js` | nomes das zonas, a água refeita no fim da geração, o tom da água, o save (`wg: 10`). |

## 2. Geração, em ordem

1. Rocha por faixa; a mina rareia nas primeiras linhas.
2. Cavernas por autômato, mais abertas no Bosque e nas Grutas.
3. As duas descidas: poços com anel de tijolo de fornalha, escada da colônia e cordão de micélio, saindo das salas de fornalha da mina, até uma câmara de pouso 12 x 6 sem spawn.
4. Gruta da chefe (64 x 28) e as duas câmaras de raiz no Coração, de onde o Abismo desce.
5. Galerias da colônia (onduladas, com escoras, vigas, lampiões), casas de tijolo nas pontas, a enfermaria lacrada.
6. Salas por faixa (x `WSC`): 3 salões de cogumelo, 5 grutas alagadas, 4 túneis com poça, 6 câmaras de carne.
7. Bacias de água com borda fechada (o vazamento vira lodo), cheias de novo depois do 87.
8. Ligação de tudo ao vilarejo, escadas e cordões em quedas de 5 ou mais, decoração e objetos de cena.

## 3. O que mudou junto

- O Abismo desceu para a sexta camada (930 a 1116 m): monstros 13 e 14, Príncipe nível 15, infernita na forja nível 11, linha 6 da tabela de pedras.
- `WH` sobe 186 linhas. Mundos de antes são refeitos (`wg 10`); nível, itens, ouro e o baú da vila continuam.
- Teleporte, ambiente sonoro (cena `fungo`), wiki (aba Fungo, inimigos, textos) e gemas ganharam a camada.
- As bases da camada caem de qualquer Tomado: cerca de 1% somando as três, 3% da mula e da pernalta.
