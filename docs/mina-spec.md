# A Mina Abandonada: especificação

A quarta camada, debaixo das Cavernas de Gelo, de 558 a 744 m. A ficha do bioma está em `docs/biomas.md` (parte 5); as regras gerais em `docs/regras-de-bioma.md`.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/79-mina-api.js` | ids de blocos (94 a 116), paredes (23 a 27), camada distante (18 a 20), faixas `MN_BANDS`, `MN_D = 186`, `MN_TOP`, zonas 17 a 20 (`MN_ZONE0`), `mineBand`, `mnExits`, `mnBoss`. `MINA = false` desliga a camada inteira. |
| `js/80-mina-blocos.js` | texturas (rocha ferrosa, rejeito, entulho, tábua, viga, rocha cavada, tijolo de fornalha, escória, quartzito, grade do chefe), paredes, camada distante (rocha, andaimes, fornalhas), minérios (carvão e ferro na rocha ferrosa, ouro e cristal no quartzito; a geração só usa carvão e cristal), decoração de 1 bloco (escora, trilho, lampião, escada, ferramentas, pedras, corda, brasa, estaca com caveira), itens de bloco. |
| `js/81-mina-objetos.js` | 28 objetos de cena (`mina: true`), o Trono do Rei Goblin e o plano por faixa `MN_PROP_PLAN`. |
| `js/82-mina-bichos.js` | mineiro morto, carrinho assombrado, grisu, lampião assombrado, falso veio, golem de minério, rato-toupeira: arte, IA, sons, drops e materiais (engrenagem, pepita, núcleo de minério, óleo de lampião). Exporta `MNB`. |
| `js/83-mina-goblins.js` | goblin gatuno (rouba ouro e foge) e capataz goblin (chicote que acelera os goblins); o goblin dinamiteiro vem do 76. |
| `js/84-mina-mundo.js` | geração (`mnBuild`, `mnAfter`, `mnClimbFix`), camada distante, zonas, spawn, nível, brilhos, poeira e brasas, loja, missões, save (`wg: 5`). |
| `js/85-rei-goblin.js` | o chefe: Oficina da Escavadeira, luta em 3 fases, Capacete do Rei Goblin. |
| `js/86-sapo-grutas.js` | o Sapo das Grutas, que entra no lugar do goblin nas Fundações Soterradas (cavernas). |

## 2. Faixas

| Zona | Faixa | Metros | Material | Monstros |
|---|---|---|---|---|
| 17 | Galerias Escoradas | 558 a 604 | rocha ferrosa, escoras, trilhos | mineiro, carrinho, gatuno, grisu, lampião |
| 18 | Poços e Andaimes | 604 a 656 | rejeito, quartzito, andaimes | mineiro, gatuno, lampião, falso veio, toupeira, grisu |
| 19 | Acampamento Goblin | 656 a 708 | entulho, piso de tábua | gatuno, goblin, capataz, carrinho, toupeira |
| 20 | Fornalhas Esquecidas | 708 a 744 | tijolo de fornalha, escória | golem, goblin, capataz, falso veio, lampião, grisu |

10 monstros na camada, 5 ou 6 por faixa. Nível: 8 + 1 a cada 60 m (até 10), 30% vêm 1 nível acima. Gatunos chegam em bando.

## 3. Geração

`buildCathedral` ganha mais um passo no fim (84): `mnBuild` e `mnAfter`. O 85 embrulha por fora para montar a oficina do chefe, abrir escadas nas paredes dela e rodar `mnClimbFix`.

1. Rocha por faixa; o gelo negro afina nas primeiras linhas e a rocha ferrosa sobe um pouco no fundo do gelo.
2. Cavernas naturais (autômato esparso) e o trabalho dos mineiros: galerias retas em níveis fixos, poços com escadas (os largos com plataformas nos Poços), salões do acampamento, salões das fornalhas e a oficina do chefe (48 x 16), ligados por túneis.
3. Dois poços antigos descem do chão do Coração do Inverno até a primeira galeria, com escada inteira (volta-se pela mesma escada).
4. Limpeza (bolsões pequenos, ilhas soltas) e veios: carvão, cobalto e cristal (pedra preciosa, mais rara) em toda a camada (um metal por camada, `js/102-minerios-camada.js`).
5. Alcance a partir dos dois poços e o acabamento: tábuas onde a galeria cruza caverna, vigas, escoras, trilhos, lampiões, escadas em todo desnível de 5 blocos ou mais, tijolo e escória nas fornalhas, cordas e objetos.

## 4. Subida garantida

`mnClimbFix` faz uma busca andando e pulando (pulo de 3 blocos, escadas sobem) a partir da oficina do chefe e de cada salão do acampamento e das fornalhas. Se não chega aos poços de saída, põe uma escada do chão alcançado até a borda mais alta que falta, ou corta o piso de tábua acima. Testado em 8 sementes: dá para voltar de todos os pontos sem cavar.

## 5. Chefe

O Rei Goblin na Escavadeira (vida 1000, dano 24, nível 10). Fase 1: investida com a broca de parede a parede (fica tremendo ao bater) e dinamites da cabine. Fase 2 (60%): corneta chama goblins, pedras caem do teto a cada batida (sombra antes), broca no teto. Fase 3 (25%): a máquina explode, ele salta com o martelo-picareta, esmaga o chão (onda) e joga feixes de 3 dinamites. Grades de ferro fecham as saídas; blocos da oficina não quebram durante a luta. Solta o Capacete do Rei Goblin (lendário: +30% de ouro dos inimigos, explosões causam 50% menos dano, luz). A morte fica salva (`reiGoblin.dead`).

## 6. Vilarejo

O ferreiro compra engrenagens, pepitas e núcleos de minério; a curandeira compra óleo de lampião e pele de sapo. O ancião ganhou 3 missões da mina (pepitas, engrenagens, núcleo de minério); a missão de pólvora das cavernas virou pele de sapo e a pólvora passou para uma missão da mina.

## 7. Testes

Arena com cada monstro (todos os estados disparam), luta inteira do chefe, geração em 8 sementes (97 a 99% do espaço aberto alcançável, chefe alcançável, sem objetos soltos da mina), subida de volta em 8 sementes, desempenho com 200 monstros em cada faixa (60 fps).
