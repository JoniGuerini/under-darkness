# A Fortaleza dos Anões: o que foi feito

A oitava camada, debaixo da Floresta Petrificada, de 1302 a 1488 m (2026-10-10). A ficha de desenho, com as faixas, os monstros, o chefe e o loot, é [camadas/08-fortaleza-anoes.md](camadas/08-fortaleza-anoes.md); este arquivo diz onde cada parte ficou no código e o que mudou em relação à ficha. A ficha fala em arquivos 150 a 159; no disco eles são 180 a 189 (a numeração 150 já estava em uso).

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/180-anoes-api.js` | ids `AN_*` (blocos 352 a 379, paredes 48 a 52, terceira camada 33 a 35), `AN_S0`, `AN_D`, `AN_BANDS`, zonas 37 a 40 (`AN_ZONE0`), `dwarfBand`, `inAnHall`, os postos da geração, `anQueimar`. |
| `js/181-anoes-blocos.js` | texturas (`ANART`, paletas `an*`), paredes, terceira camada, decoração de 1 bloco, itens de bloco, a alavanca desenhada pelo estado (`anLeverOn`, `anLeverReady`). |
| `js/182-anoes-objetos.js` | os 29 objetos, o plano por faixa `AN_PROP_PLAN`, `AN_BACK_FLOOR` e `anRoomProps` (a mobília de cada tipo de sala). |
| `js/183-anoes-automatos.js` | soldado de bronze, enxame de engrenagens, fornalha ambulante, runa viva, coruja de corda, bomba de lava; `anSoldierAt`. |
| `js/184-anoes-fantasmas.js` | besteiro fantasma, ferreiro fantasma, barba-de-ferro, juramentado. |
| `js/185-anoes-mundo.js` | geração (`anBuild`, `anAfter`, `anPlaceProps`, `anExitClear`, `anClimbFix`), zonas, spawn, nível, fogo no herói, efeitos das bases, partículas, lojas, mithril na fornalha. |
| `js/186-automato-forja.js` | o chefe: a Grande Forja por dentro (`anDress`), o trilho, as alavancas da sala, as fases, o Malho da Grande Forja. |
| `js/187-mithril.js` | o metal, as 9 peças (`leve`), os materiais, o Cinzel de Runas e as três bases. |
| `js/188-anoes-save.js` | nomes das zonas e o save (`wg: 13`, chave `anoes`). |
| `js/189-mecanismos-runas.js` | alavancas e comportas das eclusas, o Cinzel, o Grimaldo e a aba Runas da forja. |

Arquivos de outros donos que receberam uma linha: `01-base` (WH 1760), `129-camadas` (`anoes` antes do Abismo), `103-abismo-api` (o Abismo começa no fim da fortaleza e cava das brechas), `87-mundo-largo` (não cava `anKeep`, `AN_BARREIRA`, `AN_COMPORTA` nem a Grande Forja; a escada que ele põe aqui é a anã), `75-teleporte`, `97-ambiente` (cenário `anoes`), `117-gemas` (linha da camada; a lista agora ignora camada não carregada), `index.html` e a wiki.

## 2. Geração, em ordem

1. Rocha: granito anão com manchas de entulho; a rocha da Floresta afina nas primeiras linhas.
2. Poucas grutas naturais (bolsões redondos de 20 a 41 x 8 a 14, `10 x WSC`).
3. As duas escadarias: de cada descida da Floresta (`fpExits`), um poço de cantaria com escada anã até a sala da guarita (12 x 6, sem spawn) no primeiro andar.
4. A Grande Forja (64 x 28) no último andar, do outro lado do mundo, com casca de 2 e uma porta de cada lado; o 186 monta o lado de dentro.
5. As eclusas (`2 x WSC`, 6 x 28) entre os dois andares dos Canais, antes das salas, para que as salas desviem delas: comporta na boca de cima, corrente até o fundo, alavanca em cada andar.
6. Os andares: um corredor reto de 3 de altura que dá a volta no mundo em cada linha de piso (16, 30, 44, 70, 94, 118, 146, 168 e 182 m abaixo do topo), com as salas de cada faixa encostadas nele (muralhas e guaritas; salões, refeitórios, fileiras de dormitórios, túmulos; salas de canal e de máquinas; forjas), a Oficina do Mestre perto da Grande Forja e as duas forjas arrombadas com as brechas para a Colmeia.
7. Escadas anãs entre os andares, materiais por tipo de sala, seteiras, colunatas, canais de lava com grade, veios de carvão e mithril.
8. Alcance garantido (túneis de serviço retos, escada em todo desnível de 5), barricadas, lâmpadas, decoração, objetos (o 182 mobília as salas), as brechas limpas e a subida garantida.

## 3. O que mudou em relação à ficha (decisões tomadas sem perguntar, com a recomendação da ficha)

1. **O Cinzel de Runas** fica na Oficina do Mestre, num pedestal debaixo da marca do clã; não cai do chefe.
2. **As alavancas** usam a tecla de usar que já existe (E). Na Grande Forja bater com a arma também puxa.
3. **Nenhum anão vivo** por enquanto: só os sinais (a marca, o cinzel, a fala do Grimaldo).

Outros detalhes:

- As alavancas das eclusas não têm recarga longa (0,6 s); as da Grande Forja recarregam em 12 s, como na ficha.
- As runas valem pelo nível de item da peça (`L`): Brasa queima o alvo com `2 + 0,47 L` por segundo (só armas), Pedra dá `1 + 0,4 L` de defesa, Fôlego tira `10 + L`% do vigor gasto ao bloquear (até 40%), Têmpera dá `1 + 0,2 L`% de crítico. Uma runa por peça; gravar de novo troca. A runa vai no save junto da peça (mochila, corpo e baú da vila).
- O par de soldados "um guarda as costas do outro" não foi feito: dois soldados só cobrem os ângulos um do outro.
