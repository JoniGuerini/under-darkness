# O Brejo das Bruxas: ficha de implementação

> **Feito em 2026-10-21.** Entra no lugar da Colmeia, que o Jonathan achou "bobinha": ele pediu "uma coisa mais medieval, um pouco mais sombria". Arquivos `js/370` a `379`, blocos 864 a 889 (890 a 895 livres), paredes 123 a 127, terceira camada 78 a 80, zonas 77 a 80, código `BREJO`, prefixo `BJ_` (constantes) e `bj` (funções). A camada tem 558 m (o desenho de 186 m esticado `LAYER_K = 3` vezes), de 2790 a 3348 m abaixo do chão do vilarejo. Os metros desta ficha são os do desenho de 186 m; dentro da camada, cada um vale 3.

A camada 6, segunda do Ato II, debaixo das Minas Fúngicas e em cima da Cidade Afundada. Abaixo do micélio a rocha vira turfa encharcada: um pântano subterrâneo de água parada e preta. As bruxas que fugiram das fogueiras lá de cima fizeram aldeia aqui, em palafitas. Os caçadores de bruxas vieram atrás, ergueram forcas e gaiolas, e o brejo engoliu todos: os enforcados ainda balançam, os caçadores andam afogados na água rasa, e no fundo, depois do Círculo de pedras, a Velha do Brejo mexe o caldeirão.

**O que a diferencia:** é a camada da água parada e do medo de gente. As Minas Fúngicas, em cima, são carne e esporo; a Cidade Afundada, embaixo, é pedra lavrada e água que corre. Aqui a água não corre, é preta e funda, o chão prende o pé, e quase todo inimigo é uma pessoa (a bruxa, o caçador, o enforcado, a lavadeira) ou o que as bruxas fizeram (a Mão de Glória, o boneco). Folclore europeu medieval sombrio: a caça às bruxas, Baba Yaga no pilão, os corpos das turfeiras, os fogos-fátuos, *A Bruxa* de Robert Eggers, os brejos de Bloodborne e de Dark Souls.

---

## 1. Identidade

- **Nome:** O Brejo das Bruxas (`brejo`). Posição 6 na lista do `js/129` (níveis 26 a 30: monstros 26 a 29, a Velha no 30).
- **Paleta:** marrom-preto da turfa, verde-musgo apagado do limo e da pedra, cinza-azulado da argila, o cobre da ferrugem. Luz quente só onde alguém acendeu (o fogo do caldeirãozinho, as velas pretas); luz fria e esverdeada dos fogos-fátuos. A água é preta-castanha (a turfa tinge).
- **Sensação:** abafado e molhado, eco curto, o passo afundando. Silêncio cortado por sapos, gotas, a madeira das palafitas rangendo, as correntes das gaiolas e, no fundo, sussurros e cantoria.

## 2. Lugar no mundo

- **Em cima:** As Minas Fúngicas (camada 5). O topo vem de `camadaAcima('brejo')`: `BJ_S0 = A.S0 + A.D`, acertado no `bjBuild` como o Covil faz. Se as Minas não existirem, cai na Mina Abandonada (`bjAbove`).
- **Entradas:** as duas descidas (`halls`) das Minas Fúngicas. O poço de cada uma cai numa **câmara de pouso** de tábua, 16 x 6, com duas velas e escada de corda por dentro até o teto (para voltar a subir).
- **Saídas:** duas **Valas de Escoamento** no fundo, do outro lado do Caldeirão. A Cidade Afundada desce delas (o 136 agora pega a camada de cima pela corrente).
- **A descida natural:** como todas as camadas do revamp, o selo do `js/353` fecha as passagens naturais entre camadas; o caminho de baixo abre quando a Velha morre (`js/363`).

## 3. Estrutura e geração (`js/375-brejo-mundo.js`)

Quatro faixas, `BJ_BANDS = [0, 46, 98, 150, 186] × LAYER_K`; cada faixa tem 3 andares de salas.

| Faixa | Zona | Nome | Rocha | Salas |
|---|---|---|---|---|
| 0 | 77 | A Turfeira | turfa, raizame; lama nas primeiras linhas | **bacias** de turfa com a poça preta no meio e a **mata afogada** (troncos, tocos, raízes) |
| 1 | 78 | As Palafitas | argila e turfa | **lagoas** largas com plataformas de tábua sobre estacas, **cabanas** de pau a pique e sapê, passarelas |
| 2 | 79 | O Patíbulo | pedra do brejo e argila | **pátios** com o cadafalso, as forcas e as cordas penduradas do teto |
| 3 | 80 | O Círculo de Pedras | pedra do brejo e menir | **círculos** de pedras em pé em volta de uma poça; o Caldeirão do lado oposto às descidas |

Passos do `bjBuild`:

1. A rocha por faixa. Abaixo da camada (`YB`) tudo vira pedra do brejo.
2. Os vazios: os pousos das duas entradas, a caixa do Caldeirão (110 x 44; o 376 veste), as duas Valas e as salas de cada faixa. A poça de cada bacia guarda as células que cavou e, antes de abrir, força a borda sólida (turfa) e a põe no `keep`: túnel nenhum fura a bacia depois.
3. As ligações: túneis de minhoca entre as salas de um andar e rampas em zigue-zague entre os andares.
4. Os carimbos: plataformas, estacas, cabanas, cadafalsos, menires; lama no chão das bacias.
5. Os veios: carvão de turfa na turfa e na argila; ferro-do-brejo na **crosta de ferro**, que junta em volta da água.

Depois (`bjAfter`): tudo alcançável a partir das entradas, escada de corda em todo desnível de 5 ou mais, a água das poças (`bjWater`, que procura a primeira célula aberta de baixo para cima, porque um menir pode estar no meio), as cordas das forcas, as velas, a decoração de 1 bloco e os objetos (`bjPlaceProps`). Por fim o Caldeirão (`bjDress`, 376), as bocas das descidas (`bjExitClear`) e a subida garantida (`bjClimbFix`). O `js/378` enche a água de novo depois das ligações do 87 (`genPos`).

A terceira camada: a mata afogada ao longe (78), as palafitas ao longe (79), as forcas e as pedras em pé ao longe (80).

## 4. Blocos (`js/371-brejo-blocos.js`)

Texturas contínuas de 240 x 240 como no 281; rampas de 6 tons, luz de cima à esquerda.

| Id | Bloco | Como é |
|---|---|---|
| 864 | turfa | marrom-preta, fibrosa, em camadas, com raizinhas |
| 865 | lama | o atoleiro: brilha molhada, faz bolhas; **prende o passo** (anda a 70%, menos com as Botas de Atoleiro) |
| 866 | argila de brejo | cinza-azulada em lâminas, manchas de ferrugem |
| 867 | pedra do brejo | calcário verde-acinzentado em lajes, limo escorrido |
| 868 | tábua | o chão das palafitas: pranchas velhas, veio, prego, podre |
| 869 | sapê | o telhado das cabanas, palha em fiadas |
| 870 | pau a pique | a parede das cabanas: varas trançadas com barro |
| 871 | menir | granito com líquen e as espirais riscadas |
| 872 | raizame | o nó de raízes das árvores afogadas |
| 873 | crosta de ferro | nódulos de limonita; o ferro-do-brejo nasce nela |
| 874 | Espinheiro da Velha | galhos pretos com espinho e flor branca; fecha o Caldeirão na luta, não quebra |
| 875, 876 | carvão de turfa, ferro-do-brejo | os minérios |
| 878 a 889 | decoração de 1 bloco | escada de corda e corda de forca (escalam), junco, fogo-fátuo (flutua e brilha), barba-de-velho, estaca de palafita, vela preta (acesa), ossos no lodo, amuleto de galhos, goteira, crânio na estaca, touceira |

Paredes: turfa (123), pedra do brejo (124), tábua (125, dentro das cabanas), raizame (126), a pedra escura do Círculo (127).

## 5. Objetos de cena (`js/372-brejo-objetos.js`)

19 objetos com `defProp` (`brejo: true`), postos pelo 375 a partir do `BJ_PROP_PLAN` (de 426 a 482 por mundo nas sementes testadas).

- **Turfeira:** o corpo de turfa (um morto de mil anos meio saído da terra, a corda no pescoço), o toco de árvore afogada, o tronco morto em pé (fundo), a touceira de taboa.
- **Palafitas:** o caldeirãozinho no tripé com o fogo (luz laranja), o varal de trapos e ervas, os maços de ervas secando, a gaiola de corvo, o barril podre, o espantalho de gravetos.
- **Patíbulo:** a forca com o laço, a gaiola de enforcado com o esqueleto, a fogueira apagada com a estaca queimada (a brasa brilha), o pelourinho, a tábua dos caçadores pregada na parede.
- **Círculo:** a pedra em pé pequena com a espiral, as marcas de bruxa na parede, o monte de crânios com as velas pretas acesas, os bonecos de graveto pendurados.

## 6. Os 10 monstros (`js/373-brejo-bichos.js` e `js/374-brejo-bruxas.js`)

Níveis por `layerLvl(layerLo('brejo'), d)`, vida e dano por `1 + 0.3 (lvl − 1)` e `1 + 0.2 (lvl − 1)`. Todo ataque tem aviso.

| Bicho | Papel | Aviso | O ataque |
|---|---|---|---|
| **Sapo-Boi** (`bjsapo`) | pesado | a garganta incha com o coaxar (0,9 s); a sombra da queda no chão | salta alto em cima de onde o herói estava; a onda de lama corre 3,5 blocos para cada lado (pula-se por cima) |
| **Sanguessuga** (`bjsangue`) | emboscada na água | o risco em V na superfície, as bolhas (0,6 s) | salta e gruda: suga a vida e prende (anda mais devagar); dois golpes a arrancam. Só nasce na água (spawner dela, faixas 0 e 1, até 3) |
| **O Enforcado** (`bjenforcado`) | emboscada do teto | a corda range, os olhos abrem (0,7 s) | cai em cima e estrangula; depois anda arrastado, agarrão com as mãos subindo (0,5 s) |
| **O Homem da Turfa** (`bjturfeiro`) | lento e forte | levanta da turfa (1 s); a pá raspa o chão (0,8 s, faíscas) | varre rente ao chão com a pá: quem pula passa por cima |
| **Corvos do Patíbulo** (`bjcorvo`) | enxame | um de cada vez grasna (0,5 s, bico aberto, olho aceso) | mergulha em linha reta onde o herói estava. Bando de 4 ou 5 |
| **Bruxa da Vassoura** (`bjvassoura`) | voadora | a gargalhada e o frasco verde acendendo (0,7 s) | solta o frasco: poça de veneno 4 s no chão |
| **Mão de Glória** (`bjmao`) | controle | as chamas se inclinam para o herói e crescem (0,8 s) | quem estiver **olhando para ela**, com ela à vista e a menos de 8 blocos, fica **paralisado** 1,2 s; de costas, nada. Também recua e investe |
| **Caçador de Bruxas Afogado** (`bjinquisidor`) | corpo a corpo, escudo | a espada erguida brilha (0,55 s); os pés plantados (0,4 s) | golpe por cima; ou o tranco com o escudo. Bloqueia de frente, sobe escadas |
| **Lavadeira da Noite** (`bjlavadeira`) | distância | torce a mortalha, a água escorrendo (0,8 s) | joga em arco: quem é pego fica **enrolado** (não ataca, anda a 55%, 1,5 s; bater esquerda e direita solta antes) |
| **Bruxa do Boneco** (`bjbruxa`) | maldição | ergue o boneco; a linha estica dela até o herói (1 s) | três alfinetadas, cada uma com o brilho antes. Sair da vista ou acertá-la corta a linha |

Spawn por zona (pesos em `CATH_SPAWN`): Turfeira com homem da turfa, sapo, mão, lavadeira e poucos corvos; Palafitas com sapo, vassoura, lavadeira, bruxa do boneco e caçador; Patíbulo com enforcado, corvos, caçador, bruxa e homem da turfa; Círculo com vassoura, mão, bruxa, corvos, enforcado e caçador. Nada nasce perto do pouso, no Caldeirão nem nas Valas. Ao morrer cada um se desfaz do seu jeito (`MORTE_TIPOS`, `js/379`).

## 7. Chefe: A Velha do Brejo (`js/376-velha-brejo.js`)

**A sala, o Caldeirão:** no fundo do Círculo, do lado do mundo oposto às descidas, 110 x 44, sem trono. Duas margens secas de turfa nas pontas (as portas dão nelas), entre elas a água preta funda, e no meio uma ilhota baixa com o caldeirão de ferro sobre um fogo de turfa. Duas plataformas de tábua sobre estacas cruzam a água, da ilhota às margens, um pouco mais altas, com escada de corda. Luz do fogo, das velas nas margens e dos fogos-fátuos. Entrando, o Espinheiro fecha as duas portas.

**A Velha:** corcunda, de lenço, nariz de gancho, com a concha comprida. Nível `layerBossLvl('brejo')` (30); vida `330 × (1 + 0.3 (L − 1))`, dano `9 × (1 + 0.2 (L − 1))`, 520 XP.

- **Fase 1 (vida > 60%), na ilhota.** Mexe o caldeirão e o vapor muda de cor (1,2 s; a cor diz o que vem): **verde**, a água da gruta fica venenosa 6 s; **preto**, a água sobe 2 linhas e cobre a ilhota 5 s (nas plataformas e nas margens fica-se seco); **branco**, a névoa e dois corvos saindo do vapor (nascem perto do herói). Joga **conchadas** de caldo fervendo em arco (0,7 s; onde caem deixam poça de veneno) e, de perto, a **unhada** (0,55 s).
- **Fase 2 (vida < 60%), no pilão.** Voa. **O pilão:** para em cima do herói, a sombra cresce no chão (1 s), ela cai e a onda de lama corre para os lados (pula-se por cima). **A vassoura:** desce à altura do herói, a palha faísca (0,7 s) e varre a gruta de lado. Ainda joga a concha e ferve as cores.
- **Fase 3 (vida < 30%).** **O caldeirão transborda** (1,2 s, a tampa batendo): o caldo corre pelo chão da ilhota às margens (nas plataformas ou num pulo alto passa-se). **As mãos dos afogados** (0,8 s, o círculo de bolhas sob o herói) saem e prendem um instante.

Invulnerável na entrada e nas trocas de fase. Quebrar bloco dentro do Caldeirão não vale. Morrer na luta acaba a luta, abre as portas e baixa a água.

**Vencida:** o Pilão da Velha, minério, pele de sapo, velas pretas, ervas e poções; uma das três bases do Brejo; o Espinheiro some, a faixa "Vitória: o caldeirão esfria" e o caminho para a Cidade abre (`js/363`). O save guarda só `velhaBrejo: { dead }`.

## 8. Loot e economia (`js/377-ferro-brejo.js` e 375)

- **Metal: ferro-do-brejo.** O ferro que a água parada tira da turfa e junta em crostas de limonita perto das poças: o ferro mais velho que se forjou, mole e escuro. Minério nos veios da crosta de ferro e nos drops; 6 minérios por barra na fornalha. Na forja, `layerForgeIl('brejo')`, 9 peças, números entre a esporita (as Minas) e a prata (a Cidade): espada 39, adaga 26, machado 60, maça 46, lança 42, montante, elmo 7 def / 19 vida, peitoral 10 / 26, botas 4 / +5,2% de velocidade.
- **Materiais:** pele de sapo-boi e erva do brejo (a curandeira compra), corda de forca (o ferreiro), pena de corvo e vela preta (a maga). O ferreiro também compra o minério e a barra.
- **As três bases** (nível `layerLo('brejo')`, só caem aqui):
  - **Fisga do Turfeiro** (lança): com o herói ou o bicho dentro da água, fura 30% mais.
  - **Chapéu de Caçador** (cabeça, def 6): os feitiços das bruxas (enrolar, paralisar, envenenar) duram metade.
  - **Botas de Atoleiro** (pés, def 4): a lama não prende e na água anda-se como em terra.
- **Lendário: O Pilão da Velha** (maça): todo golpe envenena por 3 s, e quem está envenenado leva +20% de dano; +14% de dano, +30 de vida.

## 9. Luz e atmosfera

Escuro de verdade, como as outras camadas fundas. Luz quente só onde alguém acendeu: a vela preta (bloco e o monte de crânios), o fogo do caldeirãozinho das cabanas, a brasa da fogueira, o fogo do Caldeirão. Os fogos-fátuos dão uma luz verde-azulada fraca que flutua sobre a água. A Mão de Glória tem as próprias velas. Partículas: o vapor baixo em cima da água, gotas caindo, mosquitos nas Palafitas, a cinza de fogueira velha no Patíbulo. Na luta, o vapor colorido do caldeirão e a água verde brilham.

## 10. Som (`js/97-ambiente.js`, paisagem `brejo`, pelo `camadaExt`)

Eco curto e abafado (`rt 2.2`, `damp 0.7`). Camadas de ruído marrom e rosa graves; o vento nas cordas no Patíbulo. Eventos por faixa: gotas e bolhas e o chapinhar na Turfeira; a madeira rangendo e o tapa na água nas Palafitas; as correntes das gaiolas e os corvos no Patíbulo; sussurros e cantoria no Círculo. Sem melodia. A Velha tem os seus (`sfx.bjVl*`): a gargalhada, a unhada, a concha, o borbulhar do caldeirão, o Espinheiro fechando, a morte.

## 11. Interface e progressão

- Zonas 77 a 80 com nome e subtítulo ao entrar: **A Turfeira** ("a turfa guarda o que cai nela"), **As Palafitas** ("as bruxas moravam em cima da água"), **O Patíbulo** ("aqui os caçadores enforcavam"), **O Círculo de Pedras** ("a Velha ainda mexe o caldeirão").
- Estados no herói (desenhados por cima dele): **enrolado** (as faixas de linho), **paralisado** (o contorno pálido piscando), **envenenado** (bolhas verdes, número verde), **preso** (a sanguessuga grudada). A morte limpa tudo.
- Testes: a camada aparece no teleporte com as 4 faixas e a entrada.

## 12. Arte (rampas de 6 tons)

Turfa `#120c08 → #6c5638`; lama `#100c0a → #6a6052`; argila `#1e2224 → #8c948c`; pedra do brejo `#141a16 → #6a7560`; tábua `#1a120a → #806640`; ferrugem `#1e0e06 → #ac6a36`; menir `#1a1c1c → #868a80`; vela preta `#060606 → #44444c`; pele curtida `#1a0e08 → #8c5c38`. Bichos com o pincel do 55 (contorno só onde toca o ar), luz de cima à esquerda; olhos e chamas pelo `EYES_E` e `HOOK.drawGlow`. A Velha em 7 quadros de 44 x 40 e o caldeirão de 40 x 26.

## 13. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/370-brejo-api.js` | ids, faixas, `BJ_S0`/`BJ_D`, `bjAbove`, `brejoBand`, `bjExits`, `bjBoss`, a corrente (`camadaNomes`, `camadaExt`, som), os ajudantes dos estados |
| `js/371-brejo-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, a luz viva |
| `js/372-brejo-objetos.js` | 19 objetos e `BJ_PROP_PLAN` |
| `js/373-brejo-bichos.js` | sapo-boi, sanguessuga, enforcado, homem da turfa, corvos; as peças comuns (`BJB`) |
| `js/374-brejo-bruxas.js` | bruxa da vassoura, mão de glória, caçador afogado, lavadeira, bruxa do boneco |
| `js/375-brejo-mundo.js` | geração, pousos, Valas, água, zonas, spawn, nível, partículas, fornalha, lojas |
| `js/376-velha-brejo.js` | o Caldeirão (`bjDress`), a Velha, as 3 fases, o Pilão da Velha, o save do chefe |
| `js/377-ferro-brejo.js` | o metal na forja (9 peças), os materiais, as três bases (carrega com os metais) |
| `js/378-brejo-save.js` | nomes das zonas, a água refeita depois das ligações, o tom da água |
| `js/379-brejo-estados.js` | os estados no herói, a lama, a Fisga na água, `MORTE_TIPOS` (carrega antes do 355) |

## 14. Decisões em aberto (decididas)

1. **Minério só nos drops ou também em veio?** Também em veio: a crosta de ferro junto da água, para o ferro "nascer da turfa" de verdade e o jogador ter onde cavar.
2. **A Mão de Glória paralisa sempre?** Não: só quem está olhando para ela. Virar de costas é a defesa, e dá uma leitura nova (não é só pular).
3. **A sanguessuga nas tabelas de spawn?** Não: ela tem o próprio spawner, dentro da água das faixas 0 e 1, no máximo 3. Uma sanguessuga no seco não faz sentido.
4. **A lama prende?** Sim, 70% da velocidade, e é por isso que as Botas de Atoleiro existem.
5. **Os corvos da névoa branca:** nascem perto do herói (longe demais eles somem pelo limite de distância dos inimigos).
6. **O caminho para a Cidade:** abre pelo `js/363` (embrulho do `endBossFight`), não dentro do chefe, como todas as camadas do revamp.
7. **Os números da forja:** entre a esporita e a prata, a ordem do mundo.

---

## Como ficou no jogo

- **Geração:** testada em 8 sementes (12345, 1, 2, 3, 777, 4242, 9001, 31337), sem erro. Em todas: 2 entradas, 2 Valas, todas as poças com água (67 a 76 por mundo), o caminho do chefe encontrado, 426 a 482 objetos, e **100% do Brejo alcançável** a partir do pouso com as rotas abertas. A partir do vilarejo, 100% em 6 sementes; em 31337 e 9001 dá 0% porque as Minas Fúngicas, em cima, só chegam a 57–62% nessas sementes (o mesmo acontece no ud5 com a Colmeia: é um problema das Minas, não do Brejo). O Brejo sozinho gera em cerca de 1,5 s.
- **Entradas e saídas:** as duas entradas caem no pouso; o herói sai pela porta e sobe de volta pela escada. Nenhum bicho a menos de 20 blocos do pouso. As Valas descem até o selo, e o buraco da Cidade Afundada fica bem embaixo de cada uma.
- **Os 10 monstros:** todos nascem, mostram os avisos e acertam o herói (sapo: salto e onda; sanguessuga: risco, bolhas, gruda; enforcado: estrangula; homem da turfa: levanta e varre; corvos: grasnam e mergulham; vassoura: frasco; mão: paralisa; caçador: golpe e tranco; lavadeira: enrola; bruxa: alfinetadas).
- **A Velha:** a luta começa e o Espinheiro fecha as portas; todos os ataques das 3 fases aparecem (as três cores do vapor, a água subindo 2 linhas, as conchas, o pilão com a sombra e a onda, a vassoura, o transbordar, as mãos). Vencida: dá o Pilão da Velha, os materiais e uma base; as portas abrem; o caminho para a Cidade abre (142 de 142 células) e o herói desce até a Cidade. O save fica `{"dead":true}`. Morrer na luta acaba a luta, abre as portas e baixa a água.
- **A Cidade Afundada** desce das Valas do Brejo pela corrente (`camadaAcima('cidade')`), com as Minas Fúngicas como antes se o Brejo não existir.
- **Prints:** `/mnt/project-files/revamp/brejo/` (as 4 faixas, o pouso e a Vala, a folha dos 10 monstros e os monstros no mundo, a folha de blocos e a de objetos, e a Velha na sala em cada ataque).
