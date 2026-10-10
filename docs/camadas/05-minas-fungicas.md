# As Minas Fúngicas: ficha de implementação

A quinta camada, logo abaixo da Mina Abandonada, de 744 a 930 m. Antes dos mineiros do cobalto, uma colônia mais antiga cavou aqui atrás de um metal verde-azulado e acordou um fungo que tomou as galerias, os bichos e as pessoas. Esta ficha aproveita e atualiza a ideia antiga da Parte 6 de [../biomas.md](../biomas.md).

**O que a diferencia:** é a única camada viva por inteiro. A rocha, o chão, a água e até a parede do chefe crescem, respiram e soltam esporos; a luz é fria e vem dos próprios cogumelos. A Mina, logo acima, é seca, quente e laranja; a Cidade Afundada, logo abaixo, é de pedra lavrada, gente viva e luz de vela; o Abismo é fogo e carne. Aqui é tudo úmido, silencioso, verde-azulado e lento.

---

## 1. Identidade

- **Nome:** As Minas Fúngicas. Código: `FUNGO` (`FUNGO = false` desliga a camada), prefixo `FG_`.
- **Faixas:** Galerias Tomadas, Bosque de Chapéus, Grutas Alagadas, Coração do Micélio.
- **Conceito:** a colônia de Ferroalto achou a esporita, um metal que o micélio deposita na rocha, e cavou atrás dele até furar o ninho do fungo. O fungo subiu pelas galerias, entrou nos corpos e encheu as grutas de água parada. Os mineiros do cobalto, lá em cima, ouviram picaretas debaixo do chão das fornalhas e lacraram os buracos.
- **Sensação:** estranheza e sufoco. Primeiro, as galerias de uma colônia que parece só abandonada; depois, cavernas enormes com cogumelos do tamanho de torres, bonitas e erradas; no fundo, a carne do fungo pulsando em volta.
- **Contraste com a Mina:** a Mina é reta, seca e escorada; aqui as galerias ondulam porque o fungo empurrou as escoras. Lá a luz é de fogo e poeira, aqui é de cogumelo e esporo. Lá os mortos ainda trabalham; aqui os Tomados já não lembram que foram gente.
- **Referências:** *Aniquilação* (a área X), *The Last of Us* (o cordyceps), as cavernas de cogumelo de Terraria e Hollow Knight (Fungal Wastes), Moria.

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 25 | Galerias Tomadas | 744 a 790 | xisto úmido, tijolo da colônia, tábua podre | galerias tortas da colônia, casas de tijolo, escoras tomadas, os primeiros cordões de micélio; o tijolo de fornalha da Mina some nas primeiras linhas |
| 26 | Bosque de Chapéus | 790 a 842 | húmus de esporo, rocha tomada | salões enormes com cogumelos gigantes que servem de plataforma, névoa de esporos, luz ciano forte |
| 27 | Grutas Alagadas | 842 a 894 | lodo, xisto úmido | grutas largas e baixas com bacias de água parada, passarelas da colônia sobre a água, juncos de micélio |
| 28 | Coração do Micélio | 894 a 930 | carne de micélio, rocha tomada | câmaras redondas de carne, túneis em forma de veia, a Gruta da Mãe (o chefe) |

- **Nível dos monstros:** 11 na metade de cima da camada e 12 da metade para baixo (a partir de 93 m); 30% vêm 1 nível acima, mas nunca passam de 12, então nenhum monstro daqui fica abaixo ou no nível da camada de cima.
- **Entrada (de cima):** hoje as duas fendas do Abismo saem do chão das Fornalhas Esquecidas. Quando o Abismo descer para baixo desta camada, essas fendas viram as duas descidas das Minas Fúngicas, nas mesmas posições (`mnExits`). Cada uma é um **poço lacrado**: um anel de tijolo de fornalha no chão, com a grade de ferro que os mineiros puseram arrombada de baixo para cima e fios brancos de micélio escapando pela borda. Embaixo, o poço é de rocha natural forrada de micélio, uns 20 blocos de queda, com uma escada da colônia (tomada) e um cordão de micélio ao lado, até a câmara de pouso. Volta-se pela mesma escada.
- **Saída (para baixo):** duas descidas no chão do Coração do Micélio, longe uma da outra. Cada uma é uma **raiz-mestra**: um cordão de micélio grosso como um tronco que fura o chão e desce uns 25 blocos de rocha até o teto de uma cisterna da Cidade Afundada. Desce-se e sobe-se pelo próprio cordão (escalável como a corrente). Enquanto a camada 6 não existir, as fendas do Abismo saem dessas mesmas posições (`fgExits`).
- **Câmara de pouso:** uma em cada pé de descida: 12 x 6, chão plano de tábua, iluminada por cogumelos-lanterna, sem monstro nascendo, reservada para os pontos de volta.

## 3. Estrutura e geração (`js/125-fungo-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo que é "por mundo" multiplica por `WSC`; a sala do chefe e as duas descidas são únicas.

1. **Rocha por faixa.** Xisto úmido no alto, húmus e rocha tomada no Bosque, lodo e xisto nas Grutas, carne de micélio no Coração. As bordas se misturam por ruído. Nas primeiras 8 linhas o tijolo de fornalha e a escória da Mina rareiam; o xisto úmido sobe um pouco no chão das Fornalhas.
2. **Cavernas naturais** (autômato): estreitas nas Galerias, vãos grandes no Bosque, largas e baixas nas Grutas, bolhas redondas no Coração.
3. **Salas por faixa:**

| Faixa | Sala | Tamanho | O que recebe |
|---|---|---|---|
| Galerias | galeria da colônia | 30 a 60 x 3 a 4, ondulando 1 bloco a cada 8 | piso de tábua podre, escoras tomadas, fios no teto |
| Galerias | casa da colônia | 12 a 18 x 6 a 8 | tijolo da colônia, porta, beliche, mesa; 6 x `WSC` |
| Galerias | enfermaria lacrada | 20 x 8 | macas, colonos fossilizados, atrás de uma parede de bolsas de esporo; 1 por mundo, só cenário |
| Bosque | salão dos chapéus | 40 a 70 x 18 a 30 | 3 a 6 cogumelos gigantes (tronco 2 a 3 de largura, chapéu 7 a 15) dispostos em escada, a no máximo 3 blocos de altura um do outro; 3 x `WSC` |
| Grutas | gruta alagada | 24 a 40 x 10 a 14 | bacia de água de 3 a 6 de fundo, ilhas de lodo, passarela de tábua por cima; 5 x `WSC` |
| Grutas | túnel meio alagado | 20 a 40 x 4 | água de 1 a 2 blocos no fundo, sempre com 2 de ar em cima |
| Coração | câmara de carne | 14 a 22 de diâmetro | paredes de carne, bolsas de esporo, cordões; 6 x `WSC` |
| Coração | veia | minhoca larga, 4 a 5 de altura | liga as câmaras |
| Coração | Gruta da Mãe | 64 x 28 | o chefe (seção 7), do outro lado do mundo em relação às descidas |

4. **Ligações:** escada da colônia nas galerias e casas, cordão de micélio nos salões e câmaras, em todo desnível de 5 blocos ou mais.
5. **Estragos:** trechos de galeria desabados (escora tomada caída e rocha), manchas de rocha tomada rompendo o tijolo, bolsas de esporo tapando passagens laterais (nunca a passagem obrigatória).
6. **Água:** enche as bacias pela regra do sistema comum de água (seção 13). Nunca no caminho obrigatório sem borda ou passarela por cima; nunca nos degraus de subida.
7. **Minérios:** carvão no xisto úmido; esporita no xisto e na rocha tomada, sempre encostada em micélio (o veio segue as manchas de fungo), mais grossa no Coração. Nada de cristal aqui.
8. **Alcance** a partir das duas descidas e as câmaras de pouso.
9. **Decoração de 1 bloco**, depois a **correção estrutural** (escoras chão ao teto, cordões e fios que caem se o apoio quebrar), depois os **objetos**.
10. **Subida garantida** (`fgClimbFix`, como o `mnClimbFix`: pulo de 3 blocos, escadas e cordões sobem) a partir da gruta do chefe, da enfermaria e de cada salão; depois o `worldLink` do 87, só nas linhas desta camada e na emenda com a Mina.

## 4. Blocos (`js/121-fungo-blocos.js`)

Ids 256 a 287 (`tiles` já em 16 bits).

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 256 | `FG_XISTO` | Xisto Úmido | massa geral; lâminas azul-acinzentadas brilhando de água | xisto |
| 257 | `FG_TOMADA` | Rocha Tomada | xisto com crosta branca de micélio; onde a esporita aparece | rocha_tomada |
| 258 | `FG_HUMUS` | Húmus de Esporo | massa do Bosque; terra preta-violeta e fofa, cava rápido | humus |
| 259 | `FG_LODO` | Lodo | fundo e ilhas das Grutas; cava rápido | lodo |
| 260 | `FG_TABUA` | Tábua Podre | pisos e passarelas da colônia; quebra fácil | madeira |
| 261 | `FG_VIGA` | Viga Tomada | vigas do teto, com orelhas-de-pau | madeira |
| 262 | `FG_TIJOLO` | Tijolo da Colônia | casas e enfermaria; tijolo cinza-esverdeado | tijolo_colonia |
| 263 | `FG_TRONCO` | Tronco de Cogumelo | caule dos cogumelos gigantes; fibroso, branco sujo | tronco_cogumelo |
| 264 | `FG_CHAPEU` | Chapéu de Cogumelo | topo dos gigantes; anda-se em cima; as lamelas embaixo brilham (luz fraca) | chapeu_cogumelo |
| 265 | `FG_CARNE` | Carne de Micélio | massa do Coração; rosa pálido, pulsa devagar | carne_micelio |
| 266 | `FG_BOLSA` | Bolsa de Esporos | saco inchado na parede; incha e treme quando o herói bate ao lado, e ao quebrar solta uma nuvem que só tapa a vista por 2 s | fio_micelio |
| 267 | `FG_VIVO` | Micélio Vivo | só na luta do chefe: o chão que vira micélio (herói 25% mais lento em cima); volta ao normal se a luta reiniciar | nenhum |
| 268 | `FG_BARREIRA` | Muralha de Micélio | fecha as saídas da Gruta da Mãe durante a luta; não quebra | nenhum |
| 269 | `FG_O_CARVAO` | Veio de Carvão | carvão no xisto | carvao |
| 270 | `FG_O_ESPORITA` | Veio de Esporita | o metal da camada, no xisto e na rocha tomada; luz fraca verde-azulada | min_esporita |

**Decoração de 1 bloco** (não sólida):

| Id | Constante | Nome | Apoio | Luz |
|---|---|---|---|---|
| 272 | `FG_CORDAO` | Cordão de Micélio | pendurado do teto, em corrente; escala como a `CHAIN` | não |
| 273 | `FG_ESCADA` | Escada da Colônia | encostada; escala como a `MN_ESCADA` | não |
| 274 | `FG_LANTERNA` | Cogumelo-Lanterna | chão | ciano forte (0,8) |
| 275 | `FG_TUFO` | Tufo de Cogumelos | chão | não |
| 276 | `FG_FIOS` | Fios Pendentes | teto; balançam, não escalam | não |
| 277 | `FG_GOTEJO` | Gotejo de Seiva | teto; gota animada | verde fraca (0,2) |
| 278 | `FG_ESPOROS` | Cacho de Esporos | teto; solta partículas | verde (0,4) |
| 279 | `FG_OSSADA` | Ossada Tomada | chão; ossos com brotos | não |
| 280 | `FG_LAMPIAO` | Lampião da Colônia | chão; raro, só nas Galerias Tomadas | quente fraca (0,5) |
| 281 | `FG_JUNCO` | Junco de Micélio | chão de lodo, na beira da água; balança | não |
| 282 | `FG_SEIXOS` | Seixos com Limo | chão | não |
| 283 | `FG_ESCORA` | Escora Tomada | do chão ao teto, como as colunas do gelo; cai inteira se quebrar o apoio | não |

Os ids 271 e 284 a 287 sobram. A água não é bloco: é a camada `agua` do sistema comum (seção 13).

**Paredes de fundo** (ids 33 a 37, bem escuras, sem cor de destaque): `WFG_XISTO`, `WFG_TABUADO` (tábuas inchadas de umidade), `WFG_HUMUS`, `WFG_MICELIO` (fios finos sobre a rocha), `WFG_CARNE`.

**Terceira camada** (ids 24 a 26): `DP_FG_ROCHA` (xisto molhado ao longe), `DP_FG_CHAPEUS` (silhuetas de cogumelos gigantes contra um brilho ciano), `DP_FG_COLONIA` (casas e escoras da colônia ao longe, cobertas de fios).

## 5. Objetos de cena (`js/122-fungo-objetos.js`)

28 objetos com `fungo: true` e o plano por faixa `FG_PROP_PLAN` (mesmo formato do `MN_PROP_PLAN`: `chao`, `teto`, `fundo`). Faixas: G = Galerias Tomadas, B = Bosque de Chapéus, A = Grutas Alagadas, C = Coração.

- **Chão:** colono fossilizado sentado (G, C); beliche podre (G); mesa com lampião e mapa (G, luz quente fraca); carrinho de mão da colônia tombado (G); pilha de sacos de esporita (G); bigorna da colônia tomada (G); maca da enfermaria (G); cogumelo gigante pequeno, de 2 tamanhos (B, A, luz ciano); touceira de chapéus (B); toco de cogumelo cortado (B); ninho de brotos (B); barco de tábua encalhado (A, na borda da água); pilha de redes podres (A); coração de micélio no chão (C, pulsa, luz rosada fraca); casulo de corpo (C).
- **Teto:** cacho grande de esporos (B, C, luz verde); estalactite fúngica (A, C); polia com balde (G); gaiola de pássaro vazia (G); cortina de fios (B, C); lanterna de cogumelo pendurada (A, luz ciano).
- **Fundo, com pé no chão:** arco da galeria da colônia, tomado (G); colono preso na parede, só o rosto de fora (G, C); porta da casa lacrada com tábuas (G); pilar de micélio grosso (C).
- **Fundo, altura do olho:** placa "Ferroalto" rachada (G); orelhas-de-pau em prateleira (B, luz ciano fraca); veios de esporita expostos na rocha (A, C, luz fraca).

Todos guardam os blocos de apoio; quebrar o apoio derruba o objeto, e isso fica salvo.

## 6. Os 10 Tomados (`js/123-fungo-tomados.js` e `js/124-fungo-tomados2.js`)

Família: gente e bicho virando fungo. Nenhum anda do mesmo jeito. Vida e dano são base de nível 1 (o `BAL` e a escala por nível fazem o resto). XP baixo, como hoje.

| Tipo | Nome | Papel | Movimento | Ataque (com aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `colono` | Colono Tomado | corpo a corpo | aos trancos: para, treme, avança 3 blocos de uma vez | o braço de micélio engrossa e brilha verde (0,6 s) e estica 3 blocos para a frente; se errar, fica preso na parede 1 s | 90 | 18 | G, A |
| `marionete` | Marionete do Micélio | corpo a corpo | pendurada por fios presos no teto; os fios a levam em passos longos que mal tocam o chão e a seguram por cima de buracos | os fios esticam e brilham (0,5 s) e a arremessam num chute duplo; um golpe acima dela corta os fios e ela cai, rasteja devagar e morre em 6 s | 70 | 16 | G, C |
| `semeador` | Semeador | distância | anda até um ponto alto e se enraíza (raízes descem, 0,8 s); enraizado não é empurrado; para mudar de lugar arranca as raízes (1 s, sem defesa) | atira uma semente em arco que gruda no chão ou na parede, pisca por 1 s e estoura num espinho de 1 bloco | 55 | 15 | G, B, C |
| `mariposa` | Mariposa-Esporo | voador | círculos largos e lentos, sempre puxada para a luz mais forte por perto (tocha colocada, lampião, cogumelo-lanterna, o herói com luz) | para em cima do herói, as asas acendem (0,7 s) e cai uma cortina de pó de 2 blocos de largura: dano e "esporado" (dano lento por 3 s). Uma tocha no chão longe do herói atrai as mariposas para ela | 36 | 13 | B, A |
| `tapete` | Tapete de Micélio | emboscada | uma mancha chata que desliza por chão, parede e teto a 1 bloco por segundo, quase igual aos fios da parede | quando o herói pisa nela ou passa embaixo, os fios se levantam e estalam (0,5 s), colam o herói (sem pulo por 2 s, anda pela metade) e mordem | 50 | 17 | B, A, C |
| `brotos` | Brotos | enxame | grupos de 5 a 7 cogumelinhos que pulam em fila, um seguindo o outro | param, se agacham e chiam (0,4 s) e pulam no herói; cada um que gruda tira pouco por segundo e deixa o herói 5% mais lento; pular, rolar ou um golpe solta | 10 | 5 | G, B |
| `grilo` | Grilo Tomado | corpo a corpo rápido | saltos longos que ricocheteiam em parede e teto, como bola | as pernas pulsam e ele trila (0,6 s), depois salta em linha reta no herói; errando, fica tonto 1 s onde bateu | 48 | 15 | G, B |
| `pernalta` | Pernalta | pesado | bicho de pernas finas de 4 blocos de altura; anda por cima da água e por cima do herói, com o corpo fora do alcance | levanta uma perna, uma sombra redonda aparece no chão (0,8 s) e ela pisa; a perna fica cravada 1,2 s e leva o dobro de dano. Sem uma perna, cai e luta no chão bicando | 200 | 26 | A, C |
| `mula` | Mula Tomada | pesado | a mula da colônia com um chapéu enorme nas costas; anda devagar, não pula, e deixa um rastro de micélio que deixa o herói lento por 3 s | de frente, sacode o chapéu e solta 3 esporos pesados em arco (círculo no chão antes de cair); por trás, levanta a anca (0,6 s) e dá um coice que joga longe | 260 | 24 | B, C |
| `aguaviva` | Água-Viva de Micélio | distância curta | sobe e desce em pulsos (encolhe e se abre), entra e sai da água; fora da água vai caindo devagar | os tentáculos de 3 blocos acendem um por um, de cima para baixo (0,8 s), e chicoteiam embaixo dela | 45 | 14 | A, C |

**O que não repetem:** o colono não morde nem vomita (zumbi), estica o braço; a marionete não desce por fio como a aranha, anda presa nele; o tapete não cai do teto (rastejador), cola no lugar; a mariposa é a única que segue luz; o grilo é o único que ricocheteia; o Fungo Esporento das Cavernas solta nuvem parado e nenhum Tomado faz isso.

**Spawn por faixa:**

| Faixa | Monstros (peso) | Máximo |
|---|---|---|
| Galerias Tomadas | colono 30, marionete 20, semeador 15, brotos 20, grilo 15 | até 7 monstros |
| Bosque de Chapéus | semeador 15, mariposa 25, brotos 15, grilo 20, tapete 10, mula 15 | até 8 monstros |
| Grutas Alagadas | colono 20, mariposa 20, tapete 20, pernalta 15, aguaviva 25 | até 7 monstros |
| Coração do Micélio | marionete 15, semeador 15, tapete 20, pernalta 15, mula 20, aguaviva 15 | até 8 monstros |

Brotos contam como 1 no máximo (o grupo). A água-viva só nasce em água ou a até 4 blocos dela.

**Drops:** `fio_micelio`, `po_mariposa`, `chapeu_lanterna`, `perna_grilo` (seção 8), poções, `min_esporita` (só desta camada para baixo), as bases temáticas raras.

## 7. Chefe: A Mãe-Esporo (`js/126-mae-esporo.js`)

**A sala:** a Gruta da Mãe, 64 x 28, no Coração do Micélio, do outro lado do mundo em relação às descidas. É uma gruta alagada tomada pelo fungo: chão de lodo com água rasa (2 blocos), cinco plataformas de chapéu de cogumelo em alturas diferentes e, no fundo, ela. **A Mãe-Esporo é a parede:** uma massa de fungo de 40 x 24 blocos pintada no plano da parede de fundo, com o corpo da primeira colona preso no meio, de braços abertos. Ela não anda. Duas entradas, uma de cada lado, que a Muralha de Micélio fecha quando a luta começa.

**Como se luta:** só os **bulbos** levam dano: sacos brilhantes que abrem na parede em 6 pontos possíveis, 3 de cada vez. Bater no resto da parede dá faísca e nada. Para alcançar os de cima é preciso subir nas plataformas. A colona no meio é o último ponto fraco.

**Números (nível 13):** vida 330 x (1 + 0,3 x 12) = **1520**; dano 9 x (1 + 0,2 x 12) = **31** no golpe cheio (braço), 60% nos esporos e 40% por segundo na água esporada.

**Fase 1 (100% a 60%):**
- **Braço de micélio:** a parede incha e brilha numa linha na altura do herói (0,8 s) e um braço sai na horizontal, 14 blocos. Pular ou mudar de plataforma.
- **Chuva de esporos:** cachos do teto acendem, círculos aparecem no chão (1 s) e caem nuvens que deixam esporado.
- **Brotos:** a cada 20 s um bulbo cospe um grupo de brotos.

**Fase 2 (60% a 30%):** o chão vira micélio vivo (`FG_VIVO`, herói mais lento em cima) e a água sobe para 5 blocos, turva de esporos: ficar dentro dela dá dano lento. Os bulbos fechados abrem em lugares mais altos.
- **Raízes em linha:** o lodo racha numa linha (0,9 s) e espinhos de raiz sobem por ela.
- **Inspiração:** partículas correm para a parede (1 s) e ela puxa o ar: o herói é puxado na direção dela por 2 s. Encostar na parede nessa hora é golpe cheio. Segurar-se num cordão anula o puxão.
- Continua o braço, agora dois seguidos em alturas diferentes.

**Fase 3 (30% a 0%):** a gruta escurece; só os bulbos e o peito da colona brilham. A água chega a 8 blocos e cobre o chão (o fôlego do sistema comum vale): sobram as plataformas, que tremem (1 s) e afundam uma de cada vez, a cada 15 s, até restarem duas. O peito da colona abre (o último ponto fraco, no alto). Chegam mariposas, que vão para a luz mais forte: uma tocha colocada numa plataforma longe tira elas de cima do herói.

**Reinício:** se o herói sair, usar o portal ou morrer, a luta reinicia: a água baixa, o micélio vivo volta a lodo, as plataformas voltam, os bulbos se fecham com a vida cheia e a muralha abre. Os blocos da gruta não quebram durante a luta.

**Depois da morte:** a parede murcha e fica cinza (a arte troca para a versão morta), a água baixa para 2 blocos e fica limpa, a muralha some e um cordão de micélio fica pendurado do alto até o chão. A morte fica salva (`maeEsporo.dead`).

**Lendário:** **Lampião da Mãe-Esporo** (acessório, nível 13). Luz ciano em volta do herói (raio 4); parado por 1 s, regenera 2 de vida por segundo; quem acerta o herói corpo a corpo fica esporado (dano lento por 3 s).

## 8. Loot e economia (`js/127-esporita.js` e 125)

- **Metal:** **Esporita** (`min_esporita` -> `barra_esporita`, **6 minérios por barra**), o sexto da forja, depois do cobalto. Nível da forja **9**. A bigorna ganha as 9 peças: espada, adaga, machado, maça, lança, montante, elmo, peitoral e botas de esporita. A esporita é metal e não cristal: vem como placas de metal verde-azulado coladas na rocha, que o fungo foi deixando, e funde na fornalha como os outros.
- **Materiais próprios:**

| Id | Nome | Cai de | Quem compra |
|---|---|---|---|
| `fio_micelio` | Fio de Micélio | colono, marionete, tapete, bolsa de esporos | Grimaldo (corda para cabos) |
| `po_mariposa` | Pó de Mariposa | mariposa, água-viva | Marta (alquimia) |
| `chapeu_lanterna` | Chapéu-Lanterna | semeador, mula, brotos | Odo (ensopado) e Marta |
| `perna_grilo` | Perna de Grilo | grilo, pernalta | Grimaldo |

- **Bases temáticas** (nível 11, só caem aqui, como drop raro: cerca de 1% de cada Tomado, 3% da mula e da pernalta, e a Mãe-Esporo solta uma das três garantida na primeira morte): **Capacete com Lanterna** (elmo; luz própria pequena), **Botas de Seiva** (botas; o herói anda na água sem perder velocidade), **Gancho de Colheita** (lança; a estocada puxa o inimigo leve um passo para perto).
- **Sem baús:** a camada não tem baú nenhum (só o baú do vilarejo existe no jogo). O loot vem dos monstros, dos veios e da chefe.
- **Missões do ancião:** saíram do jogo junto com as tarefas antigas (o sistema de missões vai ser refeito); a camada não ganhou missões.

## 9. Luz e atmosfera

- Escuro de base, mas a luz é **fria e viva**: ciano dos cogumelos-lanterna e dos chapéus, verde dos cachos de esporos e da esporita, rosado pálido no Coração.
- **Galerias Tomadas:** a mais escura; só alguns lampiões quentes da colônia e os primeiros cogumelos. É a passagem do laranja da Mina para o ciano.
- **Bosque de Chapéus:** a mais clara de todas as camadas até aqui: os chapéus iluminam salões inteiros por baixo.
- **Grutas Alagadas:** a água reflete o ciano de leve; embaixo dela a luz cai pela metade.
- **Coração do Micélio:** pouca luz, rosada, que pulsa junto com o som do coração.
- **Partículas:** esporos flutuando devagar para cima (todas), gotas de seiva caindo (Galerias, Grutas), anéis na água quando algo cai (Grutas), poeira verde quando um tufo é pisado.

## 10. Som (`js/97-ambiente.js`)

Cenário novo `fungo`, sem melodia:
- **Leito:** ar úmido e grave, quase um sopro, com eco curto e abafado (o fungo abafa o som, ao contrário do eco de pedra da Mina).
- **Eventos:** gota caindo em água com eco (Grutas mais), estalo seco de esporo abrindo ("puf"), madeira encharcada cedendo (mais grave e mole que o rangido da Mina), um suspiro longo e baixo de vez em quando (o micélio respirando), passos molhados distantes sem ninguém.
- **Por faixa:** o Bosque tem um chiado leve de esporos caindo; as Grutas, água batendo de leve; o Coração, um pulso grave lento que fica mais forte perto da Gruta da Mãe.
- **Monstros:** o trilo do grilo, o chiado dos brotos, o estalo dos fios do tapete, o zumbido de asas da mariposa.

## 11. Interface e progressão

- **Nomes de zona** (`ZONE_NAMES`, empurrados pelo 125): Galerias Tomadas, Bosque de Chapéus, Grutas Alagadas, Coração do Micélio. Aparecem ao entrar, como hoje.
- **Cor no mapa (Tab):** xisto `#2c3a40`, rocha tomada `#74807a`, húmus `#3c3444`, lodo `#2a3430`, carne `#a0686c`, chapéu `#3a9a94`, água `#1a3e40`, esporita `#34a890`.
- **Progressão:** monstros 11 a 12; forja de esporita no nível 9 (boa para entrar, fica para trás no fim); bases no 11; chefe e lendário no 13.

## 12. Arte

Padrão do vilarejo: pixel art granulada, rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, blocos 12 x 12, humanoides 12 x 22 com os encaixes do herói (colono, marionete). Nada de branco puro: o micélio é creme, não branco.

| Material | Rampa (escuro para claro) |
|---|---|
| Xisto úmido | `#12181c` `#1e282e` `#2c3a40` `#3e5056` `#56686c` `#7a8c8c` |
| Rocha tomada | `#1a2024` `#2e383a` `#4a5652` `#74807a` `#a8b2a6` `#d8e0d0` |
| Húmus de esporo | `#120f14` `#1e1a22` `#2c2632` `#3c3444` `#504658` `#6a5e70` |
| Tronco de cogumelo | `#2a2a26` `#48463e` `#6e6a5c` `#9a9480` `#c4bca2` `#e6dec4` |
| Chapéu (lamelas) | `#0e2a2e` `#16444a` `#1e6a6e` `#3a9a94` `#7accc0` `#c4f4e6` |
| Carne de micélio | `#2a1a20` `#4a2c34` `#74464e` `#a0686c` `#c89490` `#ecc8bc` |
| Esporita | `#0c2a2a` `#145048` `#1e7a6a` `#34a890` `#6ad4b4` `#c8fce8` |
| Água das grutas | `#061214` `#0a1e22` `#102c30` `#1a3e40` `#2a5654` `#467472` (60% opaca) |

Os Tomados guardam um pedaço da cor de antes (pele, roupa, pelo da mula) que vai sumindo sob o creme do micélio; quanto mais fundo a faixa, menos sobra.

## 13. Sistemas novos

**Água: usa o sistema comum, não cria um.** A água e o nado do jogo todo são os da ficha do Mar Sem Sol ([10-mar-sem-sol.md](10-mar-sem-sol.md), Sistemas novos), que entram na preparação do 00-geral (`js/171-agua.js` e `js/172-nadar.js`): a água é uma camada própria por célula (`agua`), não um bloco, com fôlego, nado e luz na água já definidos lá. Esta camada só usa:
- **Bacias da geração:** as grutas alagadas, os túneis meio alagados e a Gruta da Mãe são enchidos pela regra de bacia do sistema comum (um ponto e um nível). A cor verde-azulada desta camada é só o tom de desenho da água nas zonas 25 a 28.
- **Nível por roteiro na luta da Mãe-Esporo:** o 126 sobe o nível da bacia da gruta (2, 5 e 8 blocos) escrevendo células do vetor `agua` fileira por fileira, uma a cada 0,3 s, e esvazia do mesmo jeito ao reiniciar ou ao morrer. A "água esporada" das fases 2 e 3 é regra do chefe: quem está em célula molhada dentro da gruta durante a luta leva o dano lento; o vetor não ganha valor novo.
- **Monstros:** a água-viva usa a marca `amph` do sistema comum; a pernalta anda por cima da água como chão (regra própria dela no 124).

**Chefe que é parede (`js/126-mae-esporo.js`).** A Mãe-Esporo não é uma entidade que anda: é uma imagem grande pintada uma vez sobre a parede de fundo da gruta, mais uma lista de **pontos fracos** (bulbos) com caixa de acerto e vida própria. O golpe do herói testa os bulbos; a vida da chefe é a soma. Ataques saem de pontos da parede. A barra de vida de chefe e o save funcionam como nos outros chefes (o `boss: true` vai na entidade invisível que guarda a vida).

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/120-fungo-api.js` | ids, faixas `FG_BANDS`, `FG_D = 186`, topo pelo registro `LAYERS`, `FG_ZONE0` (25), `fungoBand`, `fgExits`, `fgBoss`. `FUNGO = false` desliga a camada |
| `js/121-fungo-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, cordão e escada escaláveis |
| `js/122-fungo-objetos.js` | os 28 objetos e `FG_PROP_PLAN` |
| `js/123-fungo-tomados.js` | colono, marionete, semeador, mariposa, tapete |
| `js/124-fungo-tomados2.js` | brotos, grilo, pernalta, mula, água-viva |
| `js/125-fungo-mundo.js` | geração em pedaços, descidas, zonas, spawn, nível, partículas, loja |
| `js/126-mae-esporo.js` | a chefe: gruta, parede, bulbos, fases, Lampião da Mãe-Esporo |
| `js/127-esporita.js` | o metal na forja (9 peças) e os materiais |
| `js/128-fungo-save.js` | `maeEsporo.dead`, objetos caídos |
| `docs/fungo-spec.md` | a spec técnica depois de implementar |

## 15. Decisões (Jonathan, 2026-10-10)

1. **Fôlego na luta da Mãe-Esporo:** vale o fôlego normal, sem regra especial. A água existe justamente para a mecânica de fôlego valer ali também.
2. **A parede depois da morte:** fica morta para sempre (por enquanto), sem voltar a crescer.
