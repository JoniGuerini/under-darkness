# O Abismo: especificação

A quinta camada, debaixo da Mina Abandonada, de 744 a 930 m. É o inferno de Under Darkness: o lugar de onde vieram os demônios. Substitui de vez a ideia antiga da Cripta Abandonada (a sala quadrada nas cavernas com diabretes, cães, demônios e o Carrasco), que foi removida do jogo. Do tema antigo ficam só o clima (fogo, carne, correntes, caos) e alguns itens (chifre, presa, Lâmina Infernal, Elmo de Chifres, Grevas Demoníacas, Machado de Chifre), que agora caem dos demônios novos.

## 1. Identidade

- **Conceito:** os mineiros cavaram fundo demais. Abaixo das fornalhas a rocha fica quente, depois mole, depois vermelha, e abre para um mundo que não é deste: rios de fogo, pontes de ferro negro, catedrais de carne viva e, no fundo, o trono de onde o Príncipe do Caos manda os seus para cima.
- **Sensação:** calor, opressão, caos. Tudo pulsa, queima ou observa.
- **Referências:** Diablo 1 (o Inferno), Doom, Terraria (o Submundo), Dante.

## 2. Lugar no mundo

- **Profundidade:** 744 a 930 m (186 m, como as outras camadas). `WH` passa de 830 para 1016.
- **Entrada:** duas **fendas** abertas no chão das Fornalhas Esquecidas (a última faixa da mina): uma rachadura brilhando, com uma escada de ferro negro presa por correntes descendo até a primeira faixa do Abismo. Volta-se pela mesma escada.
- **Faixas (zonas 21 a 24):**

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 21 | Portões de Cinza | 744 a 790 | rocha de cinza, basalto | ruínas de portões e muralhas de tijolo infernal, braseiros, correntes penduradas, cinza caindo |
| 22 | Rios de Fogo | 790 a 842 | basalto, obsidiana, crosta de magma | lagos e cachoeiras de lava, pontes de ferro negro, colunas de basalto |
| 23 | As Entranhas | 842 a 894 | carne, osso | túneis de carne viva que pulsam, ganchos de açougue, tentáculos, ninhos |
| 24 | Trono do Caos | 894 a 930 | pedra do caos, enxofre, tijolo infernal | templos, altares, cristais do caos, runas acesas, a sala do chefe |

## 3. Estrutura e geração (`js/108-abismo-mundo.js`)

1. Rocha por faixa (a escória e o tijolo da mina afinam nas primeiras linhas; a cinza sobe um pouco no fundo da mina).
2. Cavernas naturais (autômato), mais abertas que as da mina: o inferno é feito de vãos grandes.
3. Salas por faixa:
   - Portões: **salões em ruínas** (retângulos com arco, paredes de tijolo infernal, um portão quebrado), ligados por túneis.
   - Rios de Fogo: **cavernas largas com lago de lava no fundo** e pontes de ferro negro por cima; **cachoeiras de lava** caindo do teto em poços.
   - Entranhas: **câmaras redondas de carne**, túneis tortos (minhoca larga), ganchos e tentáculos no teto.
   - Trono do Caos: **templos** (salões quadrados com degraus e altar) e a **sala do chefe, o Trono do Caos** (56 x 20), do outro lado do mundo em relação às fendas.
4. Correntes penduradas (escaláveis, como as da catedral) e escadas de ferro negro em todo desnível de 5 blocos ou mais, para dar para voltar sem cavar.
5. Limpeza (bolsões e ilhas), veios de minério (carvão e **infernita**), alcance a partir das fendas, decoração de 1 bloco, baús e objetos.
6. Subida garantida (`abClimbFix`, como o `mnClimbFix` da mina) e o `worldLink` do 87 roda depois.

Lava: o bloco `LAVA` (10) que já existe (queima quem encosta). Nunca no caminho obrigatório: só no fundo das cavernas grandes, sempre com ponte ou borda por cima.

## 4. Blocos (`js/104-abismo-blocos.js`)

`NT` sobe de 128 para 192. Ids 128 a 152.

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 128 | `AB_CINZA` | Rocha de Cinza | massa dos Portões; cinza prensada, cinza-escuro quente | cinza |
| 129 | `AB_BASALTO` | Basalto | massa geral; preto-azulado em prismas hexagonais | basalto |
| 130 | `AB_OBSIDIANA` | Obsidiana | perto da lava; vidro preto com reflexo roxo, dura | obsidiana |
| 131 | `AB_CROSTA` | Crosta de Magma | borda dos lagos; rocha preta com rachaduras laranja acesas (luz fraca) | crosta |
| 132 | `AB_CARNE` | Carne Viva | massa das Entranhas; vermelho-escuro, veias, mole | carne_viva |
| 133 | `AB_OSSO` | Massa de Ossos | Entranhas; ossos prensados | osso (item que já existe, se houver) |
| 134 | `AB_ENXOFRE` | Enxofre | Trono; amarelo sujo, cristalino | enxofre |
| 135 | `AB_FERRO_NEGRO` | Ferro Negro | pontes e plataformas; chapas rebitadas com espinhos | ferro_negro |
| 136 | `AB_TIJOLO` | Tijolo Infernal | ruínas e templos; tijolo vermelho-preto com runas gastas | tijolo_infernal |
| 137 | `AB_CAOS` | Pedra do Caos | massa do Trono; pedra torcida com veios roxo-vermelhos | pedra_caos |
| 138 | `AB_BARREIRA` | Grade do Caos | portões da sala do chefe (só durante a luta; não quebra) | nenhum |
| 139 | `AB_O_CARVAO` | Veio de Carvão | carvão no basalto | carvao |
| 140 | `AB_O_INFERNITA` | Veio de Infernita | o metal do Abismo, no basalto e na pedra do caos; vermelho-brasa, luz fraca | min_infernita |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio |
|---|---|---|---|
| 141 | `AB_CORRENTE` | Corrente | pendurada do teto; escala como a `CHAIN` |
| 142 | `AB_ESPINHOS` | Espinhos de Osso | chão |
| 143 | `AB_BRASEIRO` | Braseiro | chão; luz quente forte |
| 144 | `AB_CHAMA` | Chama no Chão | chão; luz, tremula |
| 145 | `AB_CRANIOS` | Pilha de Crânios | chão |
| 146 | `AB_ESTALAG` | Estalagmite de Obsidiana | chão |
| 147 | `AB_TENTACULO` | Tentáculo | pendurado do teto; balança |
| 148 | `AB_RUNA` | Runa Acesa | chão; luz roxa pulsando |
| 149 | `AB_CRISTAL` | Cristal do Caos | chão; luz roxo-vermelha |
| 150 | `AB_ESCADA` | Escada de Ferro Negro | escala como a escada da mina |
| 151 | `AB_GANCHO` | Gancho de Açougue | pendurado do teto |
| 152 | `AB_COLUNA` | Coluna de Basalto | do chão ao teto (como as colunas do gelo) |

Paredes de fundo (ids 28 a 32): `WAB_CINZA`, `WAB_BASALTO`, `WAB_CARNE`, `WAB_TIJOLO`, `WAB_CAOS`. Bem escuras, sem cor de destaque.

Terceira camada (ids 21 a 23): `DP_AB_ROCHA` (rocha escura com brilho de lava distante por baixo), `DP_AB_RUINAS` (torres e muralhas infernais ao longe), `DP_AB_CARNE` (paredes de carne ao longe).

## 5. Objetos de cena (`js/105-abismo-objetos.js`)

28 objetos com `abismo: true` e o plano por faixa `AB_PROP_PLAN` (mesmo formato do `MN_PROP_PLAN`: `chao`, `teto`, `fundo`). O Trono do Caos, da sala do chefe, fica no 109. Exemplos: portão de ferro quebrado, estátua de demônio, pilar com crânios, jaula pendurada, jaula com esqueleto, caldeirão de ferro em fogo, altar de sacrifício, pentagrama no chão, pira de ossos, estandarte rasgado, roda de tortura, cavaletes de ferro, pilha de correntes, ovo de demônio, casulo de carne, coração pulsando na parede, olho na parede, boca na parede, costelas gigantes, crânio gigante, cristal do caos grande, fonte de lava (bacia), obelisco com runas, caveira com velas, livro profano no púlpito, espinhos gigantes, ponte quebrada (fundo), cachoeira de lava pequena (fundo, animada).

## 6. Os 10 demônios (`js/106-abismo-demonios.js` e `js/107-abismo-demonios2.js`)

Cada um com um jeito próprio de se mover.

| Tipo | Nome | Movimento | Ataque (com aviso) | Faixas |
|---|---|---|---|---|
| `diabrete` | Diabrete | voa em zigue-zague nervoso | para, a mão acende, joga bola de fogo | Portões, Rios, Trono |
| `caoinferno` | Cão Infernal | corre rápido no chão, em matilha | se agacha e dá um bote longo | Portões, Rios |
| `brutamontes` | Demônio Brutamontes | anda pesado, devagar | abaixa os chifres e investe; soco no chão | Entranhas, Trono |
| `vermemagma` | Verme de Magma | cava através da rocha | some na rocha, o chão treme e brilha onde vai sair, sai em arco | Rios, Trono |
| `almapenada` | Alma Penada | flutua atravessando paredes | grito: o herói fica lento; toque que drena vida | Portões, Entranhas |
| `rastejador` | Rastejador de Carne | anda pelas paredes e pelo teto | para em cima do herói e se solta | Entranhas |
| `cultista` | Cultista Possuído | some e reaparece (teletransporte) | círculo no chão, depois coluna de fogo nele | Portões, Trono |
| `gargula` | Gárgula | pousada imóvel como estátua no teto | mergulho em rasante e volta para o teto | Portões, Trono |
| `moscas` | Enxame da Pestilência | nuvem que se espalha e se junta | envolve o herói: veneno | Entranhas |
| `salamandra` | Salamandra de Lava | nada dentro da lava | salta da lava e cospe magma; fora dela anda devagar | Rios |

Nível: 10 + 1 a cada 60 m (até 12), 30% vêm 1 nível acima.

Drops: `chifre`, `presa`, `cinza` e os materiais novos (`essencia_demoniaca`, `enxofre`, `asa_couro`, `olho_demonio`), poções, `min_infernita` (só aqui), e de vez em quando os itens antigos de demônio (Elmo de Chifres, Grevas Demoníacas, Machado de Chifre, Lâmina Infernal rara).

## 7. Chefe: O Príncipe do Caos (`js/109-principe-caos.js`)

Sala: o Trono do Caos (56 x 20), na última faixa, do outro lado do mundo em relação às fendas. Grades do caos fecham as saídas na luta (sair, portal ou morrer reinicia).

- **Fase 1:** demônio alto de chifres, com espada de fogo. Golpe largo (aviso: a espada brilha), avanço com a espada arrastando fogo no chão, sopro de fogo em leque.
- **Fase 2 (60%):** abre portais e chama diabretes e cães; gêiseres de lava saem do chão (círculo brilhando antes).
- **Fase 3 (25%):** abre as asas e voa; chuva de meteoros (sombra no chão antes), mergulho com a espada.

Vida 1400, dano 30, nível 12. Solta o lendário **Coração do Caos** (acessório: +dano de fogo, cura ao matar, luz vermelha). A morte fica salva (`principe.dead`).

## 8. Loot e economia (`js/110-infernita.js` e 108)

- Metal novo: **Infernita** (`min_infernita` -> `barra_infernita`, 6 minérios por barra), o quinto da forja, depois do cobalto. A bigorna ganha as 9 peças de infernita (espada, adaga, machado, maça, lança, montante, elmo, peitoral, botas).
- Materiais novos: essência demoníaca, enxofre, asa de couro, olho de demônio. O ferreiro compra enxofre e olhos; a curandeira compra essência.
- O ancião ganha 3 missões do Abismo.

## 9. Luz e atmosfera

Luz quente em tudo (lava, braseiros, crosta), roxa nas runas e cristais. Cinza caindo nos Portões, faíscas subindo nos Rios, gotas de sangue nas Entranhas, brasas roxas no Trono. Som de fundo: rugido grave distante, lava borbulhando.

## 10. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/103-abismo-api.js` | ids, faixas `AB_BANDS`, `AB_D = 186`, `AB_ZONE0`, `abyssBand`, `abExits`, `abBoss`. `ABISMO = false` desliga a camada. |
| `js/104-abismo-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, escada e corrente escaláveis |
| `js/105-abismo-objetos.js` | 28 objetos, o Trono do Caos e `AB_PROP_PLAN` |
| `js/106-abismo-demonios.js` | diabrete, cão infernal, brutamontes, verme de magma, alma penada |
| `js/107-abismo-demonios2.js` | rastejador, cultista, gárgula, moscas, salamandra |
| `js/108-abismo-mundo.js` | geração, fendas, zonas, spawn, nível, brilhos, partículas, loja, missões, save |
| `js/109-principe-caos.js` | o chefe |
| `js/110-infernita.js` | o metal novo na forja |
