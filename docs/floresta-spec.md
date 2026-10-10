# A Floresta Petrificada: o que foi feito

A sétima camada, debaixo da Cidade Afundada, de 1116 a 1302 m (2026-10-10). A ficha de desenho, com as faixas, os monstros, o chefe e o loot, é [camadas/07-floresta-petrificada.md](camadas/07-floresta-petrificada.md); este arquivo diz onde cada parte ficou no código e o que mudou em relação à ficha.

## 1. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/140-floresta-api.js` | ids de blocos (320 a 345), paredes (43 a 47, `WFP_SOLO` a `WFP_CRISTAL`) e camada distante (`DP_FP_TRONCOS`, `DP_FP_COPAS`, `DP_FP_RAIZES`), `FP_TOP`, `FP_S0`, `FP_D`, `FP_BANDS`, zonas 33 a 36 (`FP_ZONE0`), `forestBand`, `fpEntries`, `fpExits`, `fpBoss`, `fpCamp`, `FP_CLEAR` e `fpPrender` (a raiz segurando o herói). `FLORESTA = false` desliga a camada. |
| `js/141-floresta-blocos.js` | texturas, paredes, camada distante, minérios e geodos, decoração de 1 bloco, itens de bloco, cipó e degraus de raiz que se escalam, a folhagem que deixa a luz passar e as copas que acendem com luz forte perto. |
| `js/142-floresta-objetos.js` | os 28 objetos de cena (`floresta: true`), o plano por faixa `FP_PROP_PLAN`, `FP_BACK_FLOOR` e `fpPropFlagOk` (acampamento, escadaria, encosta), os brilhos do cristal e a brasa dos anões. |
| `js/143-floresta-bichos.js` | lagarto de quartzo, raiz estranguladora, tatu de granito, mariposa de cristal, dríade; o monstro no plano de fundo (`e.bg`) e a decoração temporária de monstro (`e.fpRoot`). |
| `js/144-floresta-bichos2.js` | sementes saltadoras, tronco andante, ouriço de cristal, serpente de raiz, prisma vivo. |
| `js/145-floresta-mundo.js` | geração (`fpBuild`, `fpAfter`, `fpStructFix`, `fpExitClear`, `fpClimbFix`, `fpPlaceProps`), camada distante, zonas, spawn, nível, o herói preso, partículas, a platina na fornalha e as lojas. |
| `js/146-cervo-pedra.js` | o chefe: a clareira (`fpDress`), os troncos deitados (346 a 348), as 3 fases, o molde da sala, a Galhada do Cervo de Pedra. |
| `js/147-platina.js` | o metal (6 minérios por barra), as 9 peças, os materiais e as três bases da camada. |
| `js/148-floresta-save.js` | nomes das zonas, o save (`wg: 12`), o alcance da Lança de Raiz. |
| `js/149-troncos-queda.js` | o sistema genérico de troncos que caem e viram plataforma (`trqFall`, `TRQ_RAMP`). |

Ordem no `index.html`: o 147 logo depois do 138-prata; 140 a 144, 149 e 145 depois do 136-cidade-mundo (o 149 antes do 145); 148 e 146 depois do 137-sineiro-afogado.

## 2. Geração, em ordem

1. **Rocha por faixa.** Solo petrificado no Bosque (com granito por ruído), granito verde na Mata (parede de cristal fosco aqui e ali), raiz de pedra nas Raízes com bolsões de seiva vítrea, granito e cerne na Clareira. O aterro da Cidade rareia por ruído nas 8 linhas de cima e nas 8 de baixo da fronteira.
2. **A floresta enterrada.** Antes de cavar, troncos inteiros dentro da rocha (casca por fora, cerne por dentro), de 2 a 3 de largura e de 4 a 6 na Clareira; um em cada cinco inclinado. O que as salas cortarem vira toco no chão, raiz no teto ou some na correção do fim.
3. **As duas entradas.** Debaixo de cada adega da Cidade (`cdDown`, as duas descidas do Palácio do Sino), uma **raiz-mestra petrificada**: um poço de 4 de largura forrado de raiz de pedra, com degraus de raiz (`FP_RAIZ_ESCADA`) desde o chão da adega até a câmara de pouso, uns 20 m abaixo do topo da camada. O pouso tem 12 x 6, chão de granito, duas drusas acesas e nenhum spawn.
4. **A clareira do Cervo** (120 x 24, chão a cerca de 178 m da camada), do outro lado do mundo em relação às entradas: bocas de 4 de altura nas duas pontas com corredor curto, chão de cascalho de cristal, teto de raiz, **sete troncos gigantes** (`FP_TRONCO_G`, 4 de largura, do chão ao teto, a cada 14 a 16 blocos) e **a fenda** de 10 x 6 no meio.
5. **As duas escadarias dos anões** no chão da Clareira, longe do Cervo e uma da outra: salas de 14 x 8 de cantaria (`CD_CANTARIA`), em `fpExits`. **O Abismo desce delas**: o 103 (`abAbove`) entrega `fpExits` ao 108, que abre as duas fendas no chão das escadarias.
6. **O acampamento anão**: 16 x 7, chão de tábua (`CD_MADEIRAME`), perto da primeira escadaria; os objetos dele (fogueira apagada, cesto de cristais) só nascem ali.
7. **Salas, cavando entre as árvores** (x `WSC`): 8 grutas de terra no Bosque com um tronco deitado atravessando; 5 clareiras ocas na Mata com 2 a 4 troncos do chão ao teto e andares de folhagem a 6 e 12 do chão; 7 redes de raiz e 3 raízes ocas (túnel de até 60 dentro de uma casca de raiz) nas Raízes; 3 salões de troncos gigantes de 40 a 60 x 20 a 28 na Clareira. Túneis ligam as salas de cada faixa em volta do mundo e algumas entre faixas.
8. **Veios e geodos.** Carvão no solo e no granito (até 150 m da camada); platina no granito e na raiz, mais grossa da Raízes para baixo; geodos de 3 a 5 com casca de granito e miolo de `FP_O_CRISTAL`, três vezes mais na Mata. Cada miolo solta de 1 a 3 pedras pela linha 7 da tabela de pedras.
9. **Depois** (`fpAfter`): tudo alcançável das duas entradas (minhocas e corredores até o maior pedaço solto, repetindo); degraus de raiz em todo desnível de 5 ou mais; um cipó de cada andar de folhagem até o chão; montes de cascalho e solo desabado; a decoração de 1 bloco por faixa; a correção da estrutura (tronco solto no ar some ou vira toco, copa sem apoio sai, cipó e pingente precisam de teto, decoração de chão precisa de chão); os objetos.
10. **Por último:** `fpDress` (146) veste a clareira, `fpExitClear` abre as bocas das raízes-mestras e `fpClimbFix` garante a volta às entradas, andando e pulando, a partir das duas bocas da clareira, do acampamento, de cada salão de gigantes, escadaria e clareira da Mata e do fim de cada raiz oca (põe degraus de raiz onde falta).

## 3. A clareira do Cervo (146)

- Cada tronco gigante fica em pé sobre as raízes com **um arco de 3 blocos embaixo**: o herói passa por baixo, o Cervo não cabe.
- Na fenda, duas raízes sobem até um bloco acima do chão para pular; os espinhos de cristal do fundo são desenhados. **Cair na fenda tira 12% da vida (nunca mata) e devolve o herói à borda mais perto.**
- Ao entrar, a **Muralha de Raízes** (`FP_BARREIRA`) fecha as duas bocas. Nada da clareira quebra durante a luta.
- Os troncos que caem (149) deitam a partir do pé, subindo 1 bloco a cada 2 colunas para o lado da queda, 2 de grossura, sempre com 2 blocos livres embaixo (o chão continua aberto de ponta a ponta), até encostar em outro tronco ou na parede; sem nada perto, deitam reto e podem atravessar a fenda. Os blocos deitados (`FP_TRONCO_D`, `_DR`, `_DL`) **se sobem como rampa** (`TRQ_RAMP`). Durante a queda, quem está embaixo toma dano e é empurrado; a sombra no chão avisa.
- **Sair, usar o portal ou morrer recomeça a luta:** a clareira é guardada como molde (`fpBossMold`) no começo da luta e escrita de volta bloco a bloco, com os troncos de pé e a muralha aberta.
- **Quando ele morre, todos os troncos que ainda estão em pé caem**, um a cada meio segundo, para o lado com mais espaço, e ficam como caíram (entram nos `diffs`).

## 4. O Cervo de Pedra, como ficou

Nível 17 (`layerBossLvl`), vida 330 e dano 9 de base escalados pelo nível. Três fases:

1. **A corrida (100% a 60%)**: investida (raspa o casco 2 vezes, galhada baixa com faíscas verdes, corre até a parede; o tronco no caminho racha antes e cai para o lado da corrida), coice (patas de trás brilham 0,5 s quando o herói está atrás), empinada (0,7 s no alto, depois uma onda de 6 blocos para cada lado).
2. **A fuga pelo alto (60% a 25%)**: a galhada floresce; ele sobe nos troncos caídos e só desce quando o herói chega perto. Chuva de folhas (sombras 1 s antes) e berro (a galhada pisca 3 vezes e os 2 troncos em pé mais perto do herói caem).
3. **O cerne (25% a 0)**: o cerne de cristal aparece no peito (+50% de dano ali); salta de tronco deitado em tronco deitado e cada pouso racha e quebra o tronco (nunca os dois últimos); mergulho com a diagonal marcada no chão 0,8 s antes; a cada 3 investidas ou mergulhos para 2 s, ofegante.

Solta a **Galhada do Cervo de Pedra** (elmo lendário, nível 17: +10% de velocidade; correr 1 s sem parar carrega uma investida: o próximo golpe empurra longe e dá +50%; luz fraca), poções, platina, folhas de cristal, casca petrificada, às vezes olho de prisma, e metade das vezes uma das três bases da camada. A morte fica no save (`cervo.dead`) e faz sumir os cascos do ambiente.

## 5. Os monstros, como ficaram

Níveis 15 e 16 (`layerLvl` com a posição no `LAYERS`); nada nasce no pouso, na clareira do Cervo nem no acampamento.

- **Lagarto de Quartzo**: só anda com o herói de costas (vale o `pl.facing`, não a linha de visão); olhado, para como estátua. Olhos acendem e a cauda estala 0,45 s, depois mordida em salto curto; virar de frente durante o aviso cancela. **No máximo 2 ao mesmo tempo.**
- **Raiz Estranguladora**: bulbo na parede que cresce uma raiz pelo chão atrás do herói (guardada no monstro, nunca no mapa; não atravessa bloco). A ponta treme 0,6 s e agarra: herói preso 1 s (anda nem pula, mas ataca). Dois golpes na raiz cortam, e o bulbo fica aberto 3 s (1,6x de dano); fechado leva metade.
- **Tatu de Granito**: enrola 0,7 s e rola quicando (perde 20% a cada parede), subindo degraus, rampas e troncos deitados; só machuca rolando. De frente num tronco fica tonto 1,5 s (1,5x de dano).
- **Mariposa de Cristal**: circula a luz mais forte (drusa, tocha na parede, herói com tocha ou peça com luz); sem tocha, vai para a drusa. Asas acendem 0,65 s e sai um leque de 5 lascas.
- **Dríade de Pedra**: anda dentro da parede de fundo (`e.bg`: escura, sem colisão, golpes e projéteis passam), com busca de caminho pelas paredes; sai só para lançar 3 sementes em arco que viram espinhos de 2 blocos por 3 s.
- **Sementes Saltadoras**: um líder e 5 seguidores que pulam juntos; o bando conta como 1 no limite de monstros.
- **Tronco Andante**: planta-se (0,6 s): metade do dano, cura devagar, raízes machucam; arrancar leva 1 s. Varrida larga; plantado, pisa e caem folhas de cristal do teto.
- **Ouriço de Cristal**: vira quando apanha; 8 espinhos acendem um a um e disparam em todas as direções; depois fica careca 3 s.
- **Serpente de Raiz**: mora num buraco de tronco ou raiz e não sai; olhos acendem, meio segundo depois bote reto de até 6 blocos.
- **Prisma Vivo**: só para em linha, coluna ou diagonal com o herói; mira 0,9 s e raio que quica uma vez em cristal e depois atravessa a folhagem.

Spawn (145): Bosque sementes, estranguladora, serpente e tatu (até 7); Mata mariposa, lagarto, dríade, prisma, ouriço e sementes (até 8); Raízes estranguladora, serpente, dríade, mariposa, tronco andante e prisma (até 8); Clareira tronco andante, lagarto, tatu, ouriço, dríade e prisma (até 7). Os pesos são os da ficha.

## 6. Itens

- **Platina** (147): `min_platina` -> `barra_platina`, 6 por barra na fornalha; 9 peças na bigorna (espada, adaga, machado, maça, lança, montante, elmo, peitoral, botas), nível de item pela posição da camada (`layerForgeIl`).
- **Materiais**: casca petrificada (ferreiro), folha de cristal (curandeira; também cai da folhagem quebrada), seiva vítrea (curandeira; os bolsões de seiva dão o bloco), olho de prisma (maga).
- **Bases da camada** (nível 15, cerca de 0,6% por morte dos monstros certos): Lança de Raiz Petrificada (lança com 1 bloco a mais de alcance; tronco andante e serpente), Escudo de Casca de Pedra (defesa alta, aparo baixo; tatu e ouriço), Manto de Folhas de Cristal (peitoral leve com luz; dríade e mariposa).
- **Blocos para construir**: solo petrificado, casca, cerne, granito verde, raiz, cascalho de cristal e folhagem de cristal.

## 7. O que mudou junto

- O Abismo desceu para a oitava camada (1302 a 1488 m): monstros 17 e 18, Príncipe nível 19. Ele desce das escadarias dos anões (`abAbove` no 103).
- `WH` sobe 186 linhas (1388 para 1574). Mundos de antes são refeitos (`wg 12`); nível, itens, ouro e o baú da vila continuam.
- Teleporte (75), ambiente sonoro (cena `floresta`, 97), pedras na rocha (117) e wiki ganharam a camada.
- Decisões do Jonathan: o uso novo do cristal fica para a Bigorna de Runas da Fortaleza; no máximo 2 lagartos de quartzo por vez; cair na fenda da clareira dá dano e devolve à borda (não mata).
