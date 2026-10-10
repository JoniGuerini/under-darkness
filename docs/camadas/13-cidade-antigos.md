# A Cidade dos Antigos: ficha de implementação

Camada 13, de 2232 a 2418 m, debaixo do Ossário dos Titãs e em cima dos Salões do Pesadelo. É a cidade de uma civilização mais velha que tudo: pedra lisa sem emenda, ângulos perfeitos, máquinas que ainda giram sem ninguém e, no fundo, a cratera onde caiu uma estrela.

**O que a diferencia:** tudo aqui é frio, exato e inteiro. Não há ruína, sujeira nem fogo; a estranheza vem da ordem demais (prédios pendurados do teto, escadas que sobem para o nada, salas onde a gravidade vira de lado). O Ossário de cima é orgânico e quebrado, os Salões de baixo são moles e errados, e o Abismo é quente e caótico: a Cidade é o único lugar do jogo que parece ter sido medido com régua.

## 1. Identidade

- **Nome:** A Cidade dos Antigos. Faixas: As Escadarias, A Cidade Inversa, As Máquinas, A Cratera da Estrela.
- **Conceito:** antes dos titãs, antes dos dragões, um povo sem nome construiu uma cidade aqui embaixo com uma geometria que a nossa cabeça não aceita direito. Eles sumiram; as máquinas e os vigias que deixaram continuam trabalhando, cuidando de uma cidade vazia. No fundo, uma estrela caiu há eras e abriu uma cratera de vidro: o metal dela é o Ferro Estelar.
- **Sensação:** assombro frio, solidão, sentir-se pequeno e sendo observado. Silêncio de museu fechado.
- **Referências:** a geometria de Escher, Monument Valley, as ruínas Chozo de Metroid, a cidade de Montanhas da Loucura (Lovecraft), Outer Wilds.

## 2. Lugar no mundo

| Zona | Faixa | Metros | Massa | Caráter |
|---|---|---|---|---|
| 57 | As Escadarias | 2232 a 2278 | pedra lisa, laje; o material do Ossário afina nas primeiras linhas | terraços enormes em degraus, escadarias largas, obeliscos de medida, os primeiros vigias |
| 58 | A Cidade Inversa | 2278 a 2330 | laje, pedra lisa | quarteirões com prédios no chão e prédios iguais pendurados no teto, ruas retas, as Salas de Prumo |
| 59 | As Máquinas | 2330 a 2382 | chapa antiga, laje, blocos de engrenagem | salões de máquinas, condutos de luz, poços de pistão, passarelas de chapa |
| 60 | A Cratera da Estrela | 2382 a 2418 | vidro de cratera, rocha fundida, rocha fria | crateras de vidro, lascas da estrela, veios de ferro estelar, a sala do Arquiteto |

- **Monstros:** nível 26 + 1 a cada 60 m (até 28); 30% vêm 1 nível acima.
- **Entrada:** duas descidas saem da última faixa do Ossário dos Titãs (a ficha 12 desenha o lado de cima). Do lado de cá, cada descida é um **Poço dos Antigos**: um poço quadrado perfeito de 4 blocos de largura, paredes de laje, com uma escada embutida (`AT_ESCADA`) correndo inteira por uma das paredes. As 3 últimas linhas do Ossário em volta da boca já são laje, como se o osso tivesse crescido em cima de uma construção. O poço desce uns 24 blocos e abre no teto da câmara de pouso, nas Escadarias. Volta-se pela mesma escada. As posições vêm de `ttExits` (camada 12) e ficam guardadas em `atEntry`.
- **Saída:** duas **Escadas que Afundam** na Cratera da Estrela, longe uma da outra (pelo menos 250 blocos com `WSC = 3`) e do lado oposto da sala do chefe. Cada uma é um vão quadrado de laje com escada embutida; ao descer, as juntas da laje começam a entortar, os degraus ficam de tamanhos diferentes e a pedra vira pedra-sono (o material dos Salões do Pesadelo). As posições ficam em `atExits`, que a camada 14 lê.
- **Câmara de pouso:** uma em cada chegada, 10 x 6, plana, piso de laje, duas lâmpadas de glifo; não nasce monstro. Reservada para os pontos de volta.

## 3. Estrutura e geração (`js/205-antigos-mundo.js`)

Segue a ordem de [../regras-de-bioma.md](../regras-de-bioma.md). Tudo que é "por mundo" multiplica por `WSC`.

1. **Rocha por faixa.** Pedra lisa em toda a camada; rocha fria (natural, fosca) em bolsões por ruído; vidro de cratera e rocha fundida só na Cratera. Nas primeiras 8 linhas o material da última faixa do Ossário afina por ruído e a pedra lisa aparece.
2. **Cavernas naturais quase não existem.** Autômato bem esparso só na rocha fria e na Cratera. O resto é construído: a cidade ocupa a camada.
3. **Salas por faixa:**
   - **Escadarias:** terraços de 30 a 50 x 8 a 12, ligados em degraus de 3 blocos (o pulo do herói); câmaras quadradas de 12 x 12 com porta no meio da parede; escadarias largas de 6 blocos de altura de degrau a cada 2 terraços, com escada embutida ao lado. 8 terraços e 6 câmaras por faixa (vezes `WSC`).
   - **Cidade Inversa:** quarteirões de 24 a 40 x 14 a 18. Dentro, prédios de laje (4 a 8 de largura, 4 a 7 de altura) nascem do chão e o mesmo prédio aparece espelhado pendurado no teto, com porta e janelas de cabeça para baixo. Ruas retas de 4 de altura ligam os quarteirões. **Salas de Prumo**: 2 por faixa (vezes `WSC`), 14 x 14, fechadas, uma porta no chão (ver Sistemas novos).
   - **Máquinas:** salões de 40 a 60 x 14 a 20 com passarelas de chapa antiga em 2 ou 3 andares, blocos de engrenagem nas paredes e condutos de luz correndo na horizontal; poços de pistão de 4 de largura e 20 a 30 de altura, com escada embutida. 5 salões e 4 poços por faixa (vezes `WSC`).
   - **Cratera:** 1 cratera por faixa (vezes `WSC`), uma tigela de 60 a 90 x 20 a 28 forrada de vidro, com rocha fundida na borda e lascas da estrela no fundo. A **sala do Arquiteto** (32 x 32 com a moldura) fica na Cratera, do lado do mundo oposto às descidas.
4. **Ligações:** escada embutida nas paredes dos poços e ao lado das escadarias; corrente de elos quadrados (`AT_CORRENTE`) pendurada nos vãos das crateras. Todo desnível de 5 blocos ou mais ganha uma das duas.
5. **Estragos:** os Antigos não envelhecem, então não há escombros nem buraco de abóbada. O único estrago é o da estrela: rachaduras radiais de rocha fundida saindo das crateras e entrando nas salas da faixa 59, e blocos de laje derretidos em gota na borda.
6. **Minérios:** carvão pouco (só na rocha fria) e ferro estelar (ver seção 8).
7. **Alcance** a partir das duas câmaras de pouso; câmara de pouso nas saídas; `atClimbFix` (como o `mnClimbFix`) a partir da sala do chefe e de cada Sala de Prumo, sempre com gravidade normal.
8. **Decoração de 1 bloco**, depois **correção estrutural** (colunas facetadas do chão ao teto, prédios pendurados só onde há teto de laje inteiro em cima), depois **objetos**. O `worldLink` do 87 roda por último, só nas linhas da camada.

## 4. Blocos (`js/201-antigos-blocos.js`)

Ids 512 a 543. Sólidos:

| Id | Constante | Nome | Uso | Item |
|---|---|---|---|---|
| 512 | `AT_PEDRA` | Pedra Lisa | massa geral; cinza-azulada, sem emenda visível, um brilho fosco | pedra_lisa |
| 513 | `AT_LAJE` | Laje dos Antigos | salas e prédios; blocos perfeitos com junta fina e reta | laje_antiga |
| 514 | `AT_ROCHA_FRIA` | Rocha Fria | bolsões naturais; cinza-escura, áspera, recebe o carvão | rocha_fria |
| 515 | `AT_GLIFO` | Laje de Glifo | faixas nas paredes das salas; glifo ciano aceso (luz fraca) | laje_glifo |
| 516 | `AT_CONDUTO` | Conduto de Luz | tubos nas Máquinas; luz ciano que corre (luz média) | conduto |
| 517 | `AT_ENGRENAGEM` | Bloco de Engrenagem | paredes das Máquinas; dentes de pedra, a textura gira devagar | engrenagem_pedra |
| 518 | `AT_CHAPA` | Chapa Antiga | passarelas e plataformas; liga verde-cinza, sem rebite | chapa_antiga |
| 519 | `AT_VIDRO` | Vidro de Cratera | forro das crateras; preto com reflexo verde, duro | vidro_cratera |
| 520 | `AT_FUNDIDA` | Rocha Fundida | borda das crateras e rachaduras; preta com veios brancos (luz fraca) | rocha_fundida |
| 521 | `AT_LADRILHO` | Ladrilho de Prumo | piso e paredes das Salas de Prumo e da arena; quadriculado | ladrilho_prumo |
| 522 | `AT_BARREIRA` | Grade de Luz | portas da sala do chefe (só na luta; não quebra) | nenhum |
| 523 | `AT_TRANSITO` | Bloco em Trânsito | invisível e sólido, só na arena enquanto um módulo desliza | nenhum |
| 524 | `AT_O_CARVAO` | Veio de Carvão | carvão na rocha fria | carvao |
| 525 | `AT_O_ESTELAR` | Veio de Ferro Estelar | na pedra lisa, no vidro e na rocha fundida; pontos brancos que piscam (luz fraca) | min_ferro_estelar |

Decoração de 1 bloco (não sólida):

| Id | Constante | Nome | Apoio e luz |
|---|---|---|---|
| 526 | `AT_ESCADA` | Escada Embutida | na parede; escala como a escada da mina |
| 527 | `AT_CORRENTE` | Corrente de Elos Quadrados | pendurada do teto; escala como a `CHAIN` |
| 528 | `AT_LAMPADA` | Lâmpada de Glifo | teto; luz ciano forte |
| 529 | `AT_LASCA` | Lasca de Estrela | chão; luz branca |
| 530 | `AT_MARCO` | Marco de Medida | chão; pequeno pilar com riscas |
| 531 | `AT_ENGRENA` | Engrenagem Solta | chão |
| 532 | `AT_FIO` | Fio de Luz | pendurado do teto; luz fraca, vibra |
| 533 | `AT_CUBOS` | Cubos Flutuantes | chão; três cubinhos parados no ar, a 1 bloco do piso |
| 534 | `AT_POEIRA` | Poeira de Estrela | chão; brilho fraco, solta partícula |
| 535 | `AT_COLUNA` | Coluna Facetada | do chão ao teto, como as colunas do gelo |
| 536 | `AT_ESTALAC` | Estalactite de Vidro | teto |
| 537 | `AT_SETA` | Seta de Prumo | parede das Salas de Prumo; aponta para onde é "baixo" agora (luz fraca) |

Os ids 538 a 543 ficam livres.

**Paredes de fundo (73 a 77):** `WAT_PEDRA` (lisa), `WAT_LAJE` (juntas finas), `WAT_GLIFO` (glifos gravados, só no tom), `WAT_MAQUINA` (painéis e eixos), `WAT_VIDRO` (vidro fosco das crateras). Todas escuras e frias.

**Terceira camada (48 a 50):** `DP_AT_CIDADE` (torres ao longe, algumas de cabeça para baixo, outras deitadas), `DP_AT_MAQUINAS` (engrenagens gigantes paradas no escuro), `DP_AT_ESTRELA` (o clarão branco da estrela atrás da rocha, só na Cratera).

## 5. Objetos de cena (`js/202-antigos-objetos.js`)

28 objetos com `antigos: true` e o plano por faixa `AT_PROP_PLAN` (formato do `MN_PROP_PLAN`).

- **Chão:** obelisco de medida (57, 58); estátua de Antigo, alta, de quatro braços com as mãos em ângulo reto (57, 58); poliedro flutuante que gira sobre um pedestal, luz ciano (57 a 60); esfera armilar (58, 59); prancheta com uma planta gravada (58); construto desligado, ajoelhado (57 a 59); máquina de engrenagens (59); bobina de luz, luz ciano (59); bancada com um construto pela metade (59); lasca grande da estrela, luz branca (60); pedra fundida em gota (60); meteorito cravado no chão (60); bacia de vidro (60).
- **Fundo com pé no chão:** escada que sobe para o nada (58); pistão gigante, sobe e desce devagar (59); engrenagem de parede gigante, gira (59); porta selada dos Antigos, sem maçaneta (57 a 59).
- **Fundo, altura do olho:** mural de glifos (57, 58); relevo de órbitas (58); painel de mostradores com luz (59); mapa estelar (58 a 60); rachadura radial acesa (60).
- **Janela:** janela para lugar nenhum, mostrando um céu estrelado que não existe (57, 58; mesma altura na sala).
- **Teto:** lustre de anéis concêntricos, luz (57, 58); prédio invertido pequeno, com porta e janelas (58); olho de vigia apagado (57 a 59); conduto pendurado, luz (59); estalactite de vidro grande (60).

O Prumo das Salas de Prumo e a Prancheta do Arquiteto ficam no 206 e no 207.

## 6. Os 10 construtos e vigias (`js/203-antigos-construtos.js` e `js/204-antigos-construtos2.js`)

Nada aqui respira nem sangra: o sangue é faísca branca ou pó de pedra. Todos se mexem em ângulos retos ou em curvas perfeitas.

| Tipo | Nome | Papel | Movimento | Ataque (aviso) | Vida | Dano | Faixas |
|---|---|---|---|---|---|---|---|
| `custodio` | Custódio | corpo a corpo | anda em passos exatos de 1 bloco, com um clique, e para meio segundo entre um e outro | uma grade de quadrados vermelhos acende no chão à frente (3 blocos), depois a alabarda cai nos quadrados | 110 | 22 | 57, 59 |
| `olhovigia` | Olho-Vigia | distância | flutua só em linha reta na horizontal ou vertical, virando em ângulo reto | uma linha fina de mira liga o olho ao herói por 0,8 s, depois o raio | 60 | 18 | 57, 58, 60 |
| `agrimensor` | Agrimensor | distância | tripé que anda em três pernas e se crava no chão para atirar | duas linhas de medida saem dele e se cruzam onde o herói está; um tiro curvo cai no cruzamento | 70 | 20 | 57, 59 |
| `tesselas` | Enxame de Tesselas | enxame | dezenas de ladrilhos triangulares voando em formação (linha, ponto, anel) | o anel de tesselas acende em volta do herói e fecha | 30 | 10 | 57, 59 |
| `ponteiro` | Ponteiro | corpo a corpo | uma barra comprida que avança girando em volta de uma ponta, como um compasso andando | um arco fino aparece na parede marcando o giro, depois a varredura | 90 | 22 | 57, 58 |
| `cuboerrante` | Cubo Errante | pesado | um cubo de 2 x 2 que avança tombando sobre as arestas, bloco a bloco | as arestas acendem e ele se inclina para o lado do herói; tomba em cima dele | 180 | 26 | 58, 60 |
| `embolo` | Êmbolo | emboscada (parede) | mora dentro da laje das ruas e corredores; só o glifo da ponta aparece | o glifo acende e uma fileira de pontos marca o caminho; o pistão atravessa o corredor e empurra o herói | 140 | 28 | 58, 59 |
| `astrolabio` | Astrolábio | voador | anéis girando em volta de um núcleo, em órbita lenta em volta de um ponto que segue o herói | os anéis param e se alinham, brilhando; três tiros saem pelos planos dos anéis | 80 | 18 | 58, 59, 60 |
| `obreiro` | Obreiro | pesado | construto grande e lento que arranca blocos de laje e monta muros entre ele e o herói | o contorno de um bloco da sala pisca; ele arranca e arremessa; pisão com o chão rachando antes | 280 | 30 | 59, 60 |
| `estilhaco` | Estilhaço da Estrela | voador | lasca de luz que voa reto e quica nas paredes como um raio refletido | para, fica branco e mostra a linha pontilhada do trajeto com um ricochete; dispara por ela | 50 | 20 | 60 |

Detalhes que contam:
- **Êmbolo:** não sai da parede; é atingível só enquanto o pistão está estendido (2 s). Depois volta e anda por dentro da laje até outro ponto do corredor. Não entra em pedra natural.
- **Obreiro:** os muros que ele monta são laje comum (quebram) e somem quando ele morre. No máximo 6 blocos por muro.
- **Tesselas:** cada golpe no enxame derruba algumas tesselas; o anel fica menor e mais fraco conforme ele perde vida.
- **Cubo Errante:** não pula; se o caminho tem degrau de mais de 2 blocos, ele sobe tombando pela parede, devagar.
- Nenhum deles entra nas Salas de Prumo nem na arena.

**Spawn por faixa:**

| Faixa | Monstros (peso) | Máximo |
|---|---|---|
| 57 Escadarias | custodio 0,24; olhovigia 0,2; agrimensor 0,2; tesselas 0,18; ponteiro 0,18 | Até 8 monstros |
| 58 Cidade Inversa | olhovigia 0,2; cuboerrante 0,2; embolo 0,18; ponteiro 0,2; astrolabio 0,22 | Até 8 monstros |
| 59 Máquinas | obreiro 0,14; embolo 0,16; custodio 0,2; tesselas 0,18; astrolabio 0,16; agrimensor 0,16 | Até 9 monstros |
| 60 Cratera | estilhaco 0,26; obreiro 0,16; cuboerrante 0,18; astrolabio 0,2; olhovigia 0,2 | Até 9 monstros |

Drops: `nucleo_estelar`, `lente_vigia`, `tessela`, `po_estelar`, poções, `min_ferro_estelar` (só daqui para baixo) e as bases temáticas.

## 7. Chefe: O Arquiteto (`js/207-arquiteto.js`)

**Quem é:** o último Antigo, ou a máquina que ficou no lugar dele: uma figura alta e fina de laje e luz, sem pernas, com quatro braços que seguram régua, esquadro, compasso e prumo. Flutua no meio da sala e redesenha a sala enquanto luta.

**A sala: A Sala que se Monta.** Na Cratera, do lado oposto às descidas. Por dentro, 30 x 30 blocos, divididos numa grade de 5 x 5 **módulos** de 6 x 6; a moldura é de Ladrilho de Prumo com 2 portas (uma em cada lado) que a Grade de Luz fecha na luta. É quadrada de propósito: com a gravidade virada, ela continua igual. A entrada fica no chão normal; a sala é alcançável sem cavar.

- **Nível 29. Vida 3100, dano 59** (330 x 9,4 e 9 x 6,6).
- **Fase 1 (100% a 60%), gravidade para baixo:**
  - **Régua:** uma linha branca fina atravessa a sala de parede a parede por 0,8 s; depois uma lâmina de luz corre por ela.
  - **Esquadro:** dois muros em L sobem do chão em volta do herói; o contorno deles aparece antes (1 s). Prendem por 4 s e somem.
  - **Prumo:** um fio fino desce do teto sobre o herói e o peso cai por ele.
- **Virada para a fase 2 (60%):** ele levanta os quatro braços; as bordas dos módulos que vão se mexer acendem e aparecem setas finas (1,5 s). Os módulos trocam de lugar (1,2 s deslizando) e a gravidade vira para a esquerda: a parede da esquerda vira chão e a câmera gira junto.
- **Fase 2 (60% a 25%), gravidade de lado:**
  - **Compasso:** um círculo fino é riscado no chão e nas paredes por 1 s; o anel queima.
  - Chama 2 **Cubos Errantes** (da camada, com vida reduzida pela metade) que tombam a favor da gravidade.
  - A cada 10 s, um só módulo troca de lugar com aviso (borda acesa e seta).
  - Régua e Prumo continuam, agora seguindo a gravidade nova.
- **Fase 3 (25% a 0), a gravidade gira:** ele abre o peito e mostra um núcleo de estrela; leva 50% a mais de dano no núcleo (por trás). A gravidade vai para cima e, a cada 12 s, vira 90° de novo; 2 s antes as Setas de Prumo das paredes giram juntas e um ronco grave sobe. Ataque novo: **Planta**, um desenho fantasma do próximo arranjo da sala aparece por 2 s e os módulos encaixam nele de uma vez.
- **Como a sala muda a luta:** o herói nunca está no mesmo terreno por muito tempo; o chão de agora é a parede de antes, e os ataques de linha (régua, prumo) mudam de direção com a gravidade. O módulo onde o herói está nunca se mexe, então nada esmaga o herói.
- **Se o herói sair ou morrer:** a luta reinicia. A sala volta ao arranjo inicial, a gravidade volta para baixo, os cubos somem, o Arquiteto volta com vida cheia.
- **Lendário:** **Prumo do Arquiteto** (acessório, raridade 4, nível 29). +def, +vida, luz branca fria. O herói não sofre empurrão de golpes e, ao cair de 6 blocos ou mais, o pouso solta uma onda curta que causa dano nos dois lados.
- **Save:** `arquiteto.dead`. Depois da morte a sala fica no arranjo inicial, com gravidade normal, e os blocos dela quebram como os outros.

## 8. Loot e economia (`js/208-ferro-estelar.js` e 205)

- **Metal: Ferro Estelar.** `min_ferro_estelar` -> `barra_ferro_estelar`, **8 minérios por barra**, forja de **nível 24**. Veios grossos na Cratera (no vidro e na rocha fundida, perto das lascas) e veios finos e raros na pedra lisa das Máquinas. Nas Escadarias e na Cidade Inversa, nenhum: quem quer o metal tem que descer até a estrela.
- **As 9 peças forjadas:** Espada, Adaga, Machado, Maça, Lança e Montante de Ferro Estelar, Elmo, Peitoral e Botas de Ferro Estelar. Cor violeta-prata com pontinhos brancos de estrela na lâmina.
- **Materiais próprios:**
  - `nucleo_estelar` (Núcleo Estelar), do obreiro, do cubo e do custódio: o ferreiro compra.
  - `tessela` (Tessela), das tesselas e do ponteiro: o ferreiro compra.
  - `lente_vigia` (Lente de Vigia), do olho-vigia e do agrimensor: a alquimista compra.
  - `po_estelar` (Pó Estelar), do estilhaço e do astrolábio, e de quebrar lascas de estrela: a alquimista compra.
- **Bases temáticas** (só caem aqui, nível 26, como drop raro: cerca de 1,5% em cada monstro da camada e 1 garantida no Arquiteto, além do lendário): **Lança-Compasso** (lança, alcance maior), **Elmo de Prumo** (elmo, luz), **Couraça de Tesselas** (peitoral, defesa alta e um pouco de esquiva).
- **Sem baús:** a camada não tem baú de loot (só o baú do vilarejo existe no jogo). O prêmio das Salas de Prumo é um veio grosso de ferro estelar preso no que é o teto com gravidade normal.
- **Missões:** o ancião ganha 3 (núcleos estelares, lentes, uma barra de ferro estelar).

## 9. Luz e atmosfera

- Escuro uniforme e limpo. A luz é fria: ciano dos glifos, condutos e lâmpadas, branca das lascas de estrela. Nenhuma luz quente na camada inteira.
- Na Cratera, o fundo inteiro tem um clarão branco fraco, como se a estrela ainda estivesse ali atrás da rocha.
- **Partículas:** poeira de estrela subindo devagar em linha reta (sem vento nenhum); faíscas brancas quando um construto leva golpe; nas Máquinas, um brilho correndo pelos condutos a intervalos certos.
- Nada pisca à toa: as luzes daqui pulsam num ritmo exato, todas juntas.

## 10. Som (`js/97-ambiente.js`)

Cenário `antigos`, sem melodia:
- **Leito:** ruído marrom bem grave, filtrado abaixo de 70 Hz, quase parado; por cima, um zumbido fino e constante de ruído branco filtrado em faixa estreita, como uma lâmpada.
- **Eventos:** cliques de mecanismo distante em intervalos exatos (sempre o mesmo intervalo, sem variação); pedra lisa deslizando sobre pedra; um "ping" de cristal esfriando.
- **Eco:** longo e limpo (4 s), de salão vazio.
- **Por faixa:** nas Máquinas, um pistão grave a cada 3 s; na Cratera, estalos de metal esfriando e um ronco baixo que sobe e desce muito devagar.

## 11. Interface e progressão

- **Nomes de zona** (`ZONE_NAMES`, zonas 57 a 60) e a linha de baixo (`ZONE_SUB`): As Escadarias, "cada degrau foi medido"; A Cidade Inversa, "o teto também é rua"; As Máquinas, "ainda trabalham, para ninguém"; A Cratera da Estrela, "ela ainda está quente por dentro".
- **Cor no mapa (Tab):** azul-acinzentado frio `#4a5a70` nas três primeiras faixas e verde-vidro escuro `#2e4a44` na Cratera; a sala do chefe em branco `#c8d8e8`.
- Nada de texto de dica: a Seta de Prumo das paredes é o único aviso de onde fica o chão.

## 12. Arte

Padrão do vilarejo: granulado, rampas de 6 tons, luz de cima à esquerda. Aqui, porém, as bordas são retas e as texturas quase sem ruído (o granulado fica fino), para a cidade parecer feita à máquina. Humanoides (custódio) 12 x 22 com os encaixes do herói.

| Material | Rampa (escuro para claro) |
|---|---|
| Pedra Lisa | `#12161e` `#1e2632` `#2e3a4a` `#46566a` `#6a7e94` `#a4b6c8` |
| Laje dos Antigos | `#161a20` `#262c36` `#3a4250` `#56606e` `#7c8898` `#b0bccc` |
| Luz de glifo | `#0a2a30` `#145058` `#2a8a94` `#4ac8d0` `#9af0f0` `#e8ffff` |
| Vidro de Cratera | `#060a08` `#0e1a16` `#183028` `#24483c` `#3e6e5c` `#7ab0a0` |
| Ferro Estelar | `#14121e` `#2a2840` `#4a4870` `#7a7ab0` `#b4b8e8` `#f0f4ff` |
| Chapa Antiga | `#141814` `#222a24` `#344038` `#4c5a50` `#6a7c70` `#9cb0a2` |

## 13. Sistemas novos

### Gravidade virada (`js/206-antigos-gravidade.js`)

- **Onde vale:** só dentro dos retângulos da lista `AT_GRAV`: a arena do Arquiteto e as Salas de Prumo. Fora deles a gravidade é sempre para baixo e nada do jogo muda. Ao sair de um retângulo a gravidade volta na hora.
- **Estado:** `grav.dir` de 0 a 3 (baixo, esquerda, cima, direita). Quem decide é a sala: o Prumo numa Sala de Prumo, o chefe na arena.
- **O herói:** `updatePlayer` é embrulhado. Com `grav.dir = 0`, chama o original. Com outra direção, roda um movimento próprio e simples (`atMoveRot`): andar, pular e cair no eixo girado, usando o `moveEntity` do 10, que já colide eixo por eixo e não liga para a direção. O "chão" é o lado sólido para onde a gravidade puxa. Com a gravidade de lado, a caixa do herói vira deitada (21 x 8 em vez de 8 x 21); se não couber, ele é empurrado para o vão livre mais perto (os módulos são feitos com folga). Ataque, escudo e itens continuam do jeito normal. Escadas e correntes não existem dentro dos retângulos.
- **Câmera:** gira junto com a gravidade (0,6 s de animação), então o "baixo" da tela é sempre o chão do herói e os controles não mudam de sentido. O mundo é desenhado com uma rotação em volta do herói (só quando `cam.rot` não é zero); o HUD e o mapa são desenhados depois, sem rotação. O mouse é desgirado antes de virar coordenada do mundo (mira e mineração).
- **O resto:** itens no chão e projéteis com peso (flecha, dinamite) usam o vetor da gravidade dentro do retângulo. Partículas ignoram. Monstros comuns não nascem nem entram nos retângulos (a IA trata a borda como parede); só o chefe e os cubos que ele chama sabem andar na gravidade virada.
- **Salas de Prumo:** 14 x 14, fechadas, uma porta no chão. No meio, o Prumo (um peso num pedestal). Golpear o Prumo vira a gravidade 90° no sentido do relógio (aviso: o peso balança e as Setas de Prumo giram, 1 s). São 6 modelos feitos à mão que funcionam nas 4 direções; a geração sorteia e gira. Dentro: um veio grosso de ferro estelar no lugar que só se alcança com outra gravidade. A porta sempre se alcança com a gravidade normal.

### Salas que se montam

- **Módulos:** a arena é uma grade de 5 x 5 módulos de 6 x 6. Há uns 12 modelos de módulo (cheio, vazio, plataforma, L, degraus, pilar, ponte...), todos andáveis nas 4 gravidades. A semente monta 4 arranjos (um por gravidade) e a geração confere, com a busca que simula o pulo, que todo módulo vazio chega aos outros em cada arranjo.
- **Troca:** 1,5 s antes, as bordas dos módulos que vão sair acendem e uma seta fina mostra o rumo. Durante a troca (1,2 s), os módulos viram imagens que deslizam; as casas de destino ficam com `AT_TRANSITO` (sólido e invisível) até a imagem chegar, e então os blocos são escritos. O módulo do herói nunca se mexe. A luz é recalculada só dentro da arena.
- **Save:** os blocos da arena não entram nos `diffs`; a arena é montada de novo do arranjo inicial ao carregar e ao reiniciar a luta. Durante a luta, nada da arena quebra.

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/200-antigos-api.js` | ids, faixas `AT_BANDS`, `AT_ZONE0 = 57`, `antigosBand`, `atEntry`, `atExits`, `atBoss`, `AT_GRAV`. `ANTIGOS = false` desliga a camada. |
| `js/201-antigos-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, escada e corrente escaláveis, itens de bloco |
| `js/202-antigos-objetos.js` | 28 objetos e `AT_PROP_PLAN` |
| `js/203-antigos-construtos.js` | custódio, olho-vigia, agrimensor, tesselas, ponteiro |
| `js/204-antigos-construtos2.js` | cubo errante, êmbolo, astrolábio, obreiro, estilhaço |
| `js/205-antigos-mundo.js` | geração em pedaços, entradas e saídas, zonas, spawn, nível, partículas, loja, missões |
| `js/206-antigos-gravidade.js` | gravidade virada, câmera girada, Salas de Prumo, módulos da arena |
| `js/207-arquiteto.js` | o chefe e a Sala que se Monta |
| `js/208-ferro-estelar.js` | o metal na fornalha e na bigorna |
| `js/209-antigos-save.js` | save da camada (`arquiteto.dead`, Salas de Prumo abertas) |

## 15. Decisões em aberto

1. **Câmera girando ou parada na gravidade virada?** Girar mantém os controles iguais; parada é mais fácil de fazer, mas "esquerda" passa a ser "cima" na parede. Recomendo girar.
2. **Salas de Prumo fora da arena:** ficam (2 por faixa na Cidade Inversa) ou a gravidade virada só aparece no chefe? Recomendo que fiquem: ensinam o sistema antes da luta.
3. **Fase 3 com a gravidade virando no relógio (a cada 12 s)** ou só quando o Arquiteto leva um tanto de dano? Recomendo o relógio, com o aviso das setas: é previsível e combina com a camada.
