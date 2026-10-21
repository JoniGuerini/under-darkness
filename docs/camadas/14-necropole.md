# A Necrópole do Rei Eterno: ficha de implementação

> **Feita em 2026-10-21**, no revamp das 20 camadas ([00-revamp.md](00-revamp.md)). Posição 14, debaixo do Ossário dos Titãs e em cima da Cidade dos Antigos. Monstros dos níveis 66 a 69, o chefe no 70. Arquivos `js/380` a `389`, blocos 896 a 927, paredes 128 a 132, terceira camada 81 a 83, zonas 81 a 84, código `NECROPOLE`, prefixo `NC_`. A camada tem `LAYER_D` (558) linhas: o desenho de 186 m esticado `LAYER_K = 3` vezes, com 3 andares de salas por faixa. As decisões em aberto (seção 15) seguiram a recomendação; o que ficou de diferente do plano está em "Como ficou no jogo", no fim.

A cidade dos mortos de um reino inteiro. Quando o Rei Eterno se recusou a morrer, mandou enterrar o reino com ele, rua por rua, e levantou o exército para não ficar sozinho. Avenidas de mausoléus, columbários de nichos sem fim, quartéis onde a legião espera de pé e, no fundo, a cripta real, onde o rei não deitou.

**O que a diferencia:** é o espelho escuro da Catedral (camada 2, `js/41-46`). Lá, mortos soltos e confusos, zumbis e esqueletos que tropeçam; aqui, os mortos têm posto, ordem e senhor. Tudo é pedra trabalhada (rua, telhado, parede de nichos, cantaria), nada é caverna natural. A luz é a chama de alma, verde-pálida, que os necromantes mantêm acesa.

---

## 1. Identidade

- **Nome:** A Necrópole do Rei Eterno. **Faixas:** Avenidas dos Túmulos, Os Columbários, Os Quartéis da Legião, A Cripta Real.
- **Conceito:** o reino que desceu para a cova junto com o rei. Os nobres em mausoléus nas avenidas, o povo em nichos nos columbários, os soldados de pé nos quartéis, esperando a ordem. Os necromantes são os sacerdotes que mantêm as lanternas de alma acesas; os escribas escrevem quem vai morrer; os coveiros ainda cavam.
- **Sensação:** frio, silêncio organizado, a sensação de estar sendo contado. Depois do vazio enorme do Ossário, ruas estreitas e salas cheias.
- **Referências:** a Catacumba de Paris, os columbários romanos, Dark Souls (a Tumba dos Gigantes e Nito), o Rei Lich de Warcraft sem o gelo, Castlevania.
- **Contraste com as vizinhas:** o Ossário é curva de osso e abandono; a Necrópole é linha reta de pedra e gente demais. A Cidade dos Antigos, embaixo, é geometria perfeita sem ninguém; aqui a geometria é humana, gasta e lotada.

## 2. Lugar no mundo

| Zona | Faixa | Linhas da camada | Massa | Caráter |
|---|---|---|---|---|
| 81 | Avenidas dos Túmulos | 0 a 138 | granito negro, terra de cova, laje de rua, mármore | ruas compridas calçadas com mausoléus dos dois lados, covas abertas, lápides, carpideiras de pedra |
| 82 | Os Columbários | 138 a 294 | granito, parede de nichos, ossuário, cal | salões altos forrados de nichos com galerias desencontradas e correntes, ossuários de crânios |
| 83 | Os Quartéis da Legião | 294 a 450 | granito, cantaria | salões de cantaria com mezanino, colunas, estandartes, armeiros |
| 84 | A Cripta Real | 450 a 558 | granito, mármore real (negro com veio de ouro), mármore | salas reais de mármore negro com colunas e o Salão do Relicário |

- **Constantes:** `NC_D = LAYER_D`, `NC_BANDS = [0, 46, 98, 150, 186].map(v => v * LAYER_K)`, `NC_ZONE0 = 81`, `necroBand(ty)`, `NC_S0 = A.S0 + A.D` (da camada de cima, acertado no build), `NC_TOP = layerTop('necropole')`.
- **Nível dos monstros:** `layerLvl(layerLo('necropole'), d)`: os níveis vistos 66, 67, 68 e 69, um a cada quarto da altura (30% nascem um acima, nunca passando de 69). Vida × (1 + 0,3 × (força − 1)), dano × (1 + 0,2 × (força − 1)).
- **Entrada (vinda do Ossário):** as duas descidas saem das Fendas Retas do Ossário (`ttExits`, lidas por `camadaAcima('necropole').halls`). O poço de 3 de largura desce com uma **escada de ferro chumbada** (`NC_ESCADA`), com um patamar no meio (só a escada passa), e cai dentro da **capela da guarda**.
- **Câmara de pouso:** a capela da guarda, 16 x 6, casca de mármore, chão de laje, plana, com **duas lanternas de alma** acesas; nenhum monstro nasce a menos de 20 blocos dela (`ncSafe`). Sai-se pela porta para a primeira avenida.
- **Saída (para a Cidade dos Antigos):** as duas **Escadas dos Mortos** no fundo da Cripta, longe uma da outra e do Salão: salas com um poço de 3 de largura forrado de cantaria e uma **corrente** descendo até a última linha. Gravadas em `ncExits` (são as `halls` da camada para os Antigos).

## 3. Estrutura e geração (`js/385-necropole-mundo.js`)

A ordem de [../regras-de-bioma.md](../regras-de-bioma.md); cada faixa tem 3 andares de salas (`LAYER_K`), "por mundo" multiplica por `WSC`.

1. **Rocha base:** granito negro em tudo; a rocha de cima afina e vira terra de cova nas primeiras linhas; bolsas de terra de cova pelas Avenidas; veios finos de cal; mármore na Cripta.
2. **Vazios:** as duas descidas com a capela; o **Salão do Relicário** (120 x 44) do outro lado do mundo em relação às descidas, uma caixa maciça que o 387 veste, com dois corredores até duas salas reais de fora; as duas Escadas dos Mortos; e as peças de cada faixa:

| Faixa | Peça | Como vira terreno |
|---|---|---|
| Avenidas | avenida | rua comprida de laje; dos lados, **mausoléus** de mármore com telhado de ardósia em duas águas, porta dos dois lados e a laje de cova dentro; uma lápide na porta |
| Avenidas | cova | buraco de terra de cova com lápides e raízes brancas no teto |
| Columbários | columbário | salão alto forrado de **parede de nichos**, com galerias de laje desencontradas e **correntes** logo depois da ponta de cada galeria |
| Columbários | ossuário | sala forrada de crânios e ossos em argamassa, chão de cal |
| Quartéis | quartel | salão de cantaria com o **mezanino** e as colunas |
| Cripta | sala real | chão de mármore real, teto de mármore, colunas a cada 7 blocos |

3. **Ligações:** túneis entre as peças de cada andar (em anel) e 3 por `WSC` rampas entre os andares; depois o `worldLink` do 87.
4. **Minérios:** carvão no granito (28 por `WSC` por andar); **sepulcrita** sempre a até 8 blocos de uma cova, de um mausoléu, de um ossuário ou de uma sala real (`ncSites`).
5. **Alcance e subida:** tudo alcançável das duas capelas; todo desnível de 5 blocos ou mais ganha escada de ferro (nos Columbários, corrente) por `ncClimbT`; `ncClimbFix` garante a volta das salas, dos altares, do Salão e do pé das Escadas dos Mortos.
6. **Decoração e objetos** por último (seções 4 e 5), e os **altares dos necromantes**: 5 por `WSC` por faixa, com duas lanternas de alma no chão e o altar (382).

## 4. Blocos (`js/381-necropole-blocos.js`)

Sólidos (896 a 909), texturas contínuas de 240 x 240 como o 281, e rampas de 6 tons:

| id | Bloco | Item | Onde |
|---|---|---|---|
| 896 | Granito negro (`NC_GRANITO`) | `granito_negro` | a rocha da camada |
| 897 | Terra de cova (`NC_TERRA`) | `terra_cova` | Avenidas, covas |
| 898 | Laje de rua (`NC_LAJE`) | `laje_rua` | o chão das avenidas, as galerias, os beirais do Salão |
| 899 | Mármore funerário (`NC_MARMORE`) | `marmore_funerario` | mausoléus, capelas, tetos da Cripta |
| 900 | Telha de ardósia (`NC_TELHA`) | `telha_ardosia` | telhados dos mausoléus |
| 901 | Parede de nichos (`NC_NICHO`) | `nicho` | columbários |
| 902 | Ossuário (`NC_OSSUARIO`) | `ossuario` | ossuários |
| 903 | Cantaria (`NC_CANTARIA`) | `cantaria` | quartéis, poços das saídas |
| 904 | Mármore real (`NC_REAL`) | `marmore_real` | chão da Cripta e do Salão |
| 905 | Cal (`NC_CAL`) | `cal_virgem` | veios, chão dos ossuários |
| 906 | Rastrilho de ossos (`NC_BARREIRA`) | (não quebra) | fecha as portas do Salão na luta |
| 907 | Laje de cova (`NC_COVA`) | `laje_cova` | dentro dos mausoléus e no chão do Salão (os mortos do rei sobem dela) |
| 908 | Carvão (`NC_O_CARVAO`) | carvão | no granito |
| 909 | Sepulcrita (`NC_O_SEPULCRITA`) | `min_sepulcrita` | perto dos mortos |

Decoração de 1 bloco (910 a 923, não sólida): escada de ferro (escala), corrente (escala), lanterna de alma no chão, lápide, flores secas, ossos soltos, mortalha pendurada, musgo-de-alma, urna, lanterna de alma pendurada, raízes brancas, elmo caído, lanças fincadas, coluna do chão ao teto. 924 a 927 ficam livres.

Paredes (128 a 132): granito, mármore, nichos, ossos, cantaria. Terceira camada (81 a 83): a cidade dos mortos ao longe (telhados e torres), a parede de nichos sem fim, a legião parada em fileiras no escuro.

## 5. Objetos de cena (`js/382-necropole-objetos.js`)

18 objetos, duas variantes cada, postos pelo `NC_PROP_PLAN`:

| Faixa | Objetos |
|---|---|
| Avenidas | carpideira de pedra, obelisco de nome raspado, carroça fúnebre com o caixão, portão de ferro do cemitério (fundo), sino de finados (teto) |
| Columbários | estante de crânios (fundo, só nos columbários), urnas grandes, mortalhas no varal (teto), altar dos necromantes (a vela de alma acesa, só junto de um acampamento) |
| Quartéis | estandarte rasgado da legião (fundo), armeiro, tambor de guerra, cabide de armadura vazio, grilhões pendurados (teto) |
| Cripta | sarcófago com efígie, brasão do Rei Eterno (fundo), estátua do rei moço, correntes de alma (teto) |

## 6. Os 10 monstros: a legião (`js/383-necropole-legiao.js`) e a corte (`js/384-necropole-corte.js`)

Todos os humanoides têm o corpo de 12 x 22 nos encaixes do herói (o pintor do 37 para corpo e pernas, braços e armas por cima). Os olhos de alma acendem verde-pálido; todo ataque tem aviso (pose, brilho, som, marca no chão) e o "!" vermelho do jogo. Nenhum machuca só por encostar.

| Monstro | Jeito | Ataque e aviso |
|---|---|---|
| **Legionário Eterno** (`legionario`) | corpo a corpo, escudo | marcha atrás do escudo de torre, que segura todo golpe de frente; recua a lança 0,5 s (a ponta acende) e estoca 2 blocos; depois baixa o escudo um instante |
| **Cavaleiro da Morte** (`cavaleiro`) | pesado | ergue o montante 0,9 s (a lâmina acende) e racha o chão: o golpe na frente e uma onda de alma correndo pelo chão (pula-se); a lâmina fica presa; abaixo da metade ergue em 0,6 s |
| **Arauto do Rei** (`arauto`) | apoio, foge | ergue a trompa 0,8 s e sopra: o anel de som empurra o herói e manda os mortos em volta para a frente por 6 s |
| **Embalsamador** (`embalsamador`) | distância, apoio | joga o pote de unguento em arco (0,6 s com o pote erguido; gruda o herói 0,7 s); enfaixa um monte de ossos 1,4 s e o morto levanta com metade da vida |
| **Coveiro** (`coveiro`) | emboscada | anda debaixo da terra (um risco de terra); para debaixo do herói, a terra estufa 0,7 s e ele sai com a pá para cima; depois briga de pá (ergue 0,45 s) |
| **Necromante** (`necromante`) | distância | ergue as mãos 0,9 s: o selo verde segue o herói meio segundo, para e solta espinhos de osso; apanhando de perto, some numa fumaça verde e reaparece longe (a fumaça aparece antes onde ele vai sair) |
| **Escriba da Sentença** (`escriba`) | distância, marca | escreve 1,2 s e o herói fica MARCADO 2,2 s; se o escriba ainda o vê no fim, a coluna da sentença se desenha no chão e cai meio segundo depois; quebrar a linha de visão apaga a marca |
| **Mortalha** (`ncMortalha`) | voador | voa rente ao teto, para em cima do herói, treme 0,7 s (a sombra escurece no chão) e cai reta; se pega, envolve (prende e tira vida aos poucos, apanha em dobro); se erra, fica estendida |
| **Gaveta do Columbário** (`gaveta`) | emboscada na parede | fechada na parede o golpe não entra; quando o herói passa, a tampa corre e os olhos acendem 0,6 s, o braço de osso sai 4 blocos e puxa; depois fica aberta (é quando se bate) |
| **Fogo-fátuo** (`ncFatuo`) | enxame | bando de 4 a 6 rodando em volta do herói; um de cada vez acende e treme 0,5 s e dispara reto; erra e volta para a roda |

**Por faixa (pesos do spawn):** Avenidas: coveiro, mortalha, fogo-fátuo, embalsamador, legionário, necromante. Columbários: gaveta, fogo-fátuo, escriba, necromante, mortalha. Quartéis: legionário, arauto, cavaleiro, embalsamador, necromante. Cripta: cavaleiro, escriba, gaveta, legionário, arauto, mortalha. Os 10 aparecem; cada faixa usa 5 ou 6.

## 7. Chefe: O Rei Eterno (`js/387-rei-eterno.js`)

- **Nível visto 70** (`layerBossLvl('necropole')`, força 30,5). Vida 400 × (1 + 0,3 × 29,5) e dano 11 × (1 + 0,2 × 29,5), na escala do 49 (`BAL`): **985** de vida e **30** de dano no jogo. As âncoras: 26 × o mesmo multiplicador (64 de vida no jogo).
- **A sala: o Salão do Relicário.** 120 x 44 na Cripta Real, abóbada arredondada, nichos no alto e mármore embaixo, chão de mármore real com **oito lajes de cova**, duas portas, quatro **beirais de laje** (dois baixos a 7 blocos, dois altos a 14) com escadas de ferro, colunas, lanternas de alma e urnas. **Sem trono: o rei não senta.**
- **A ideia que muda a luta: o Coração-Relicário.** No meio do Salão pende o relicário com o coração do rei, preso por **três correntes de alma** a três **âncoras** (blocos de mármore com o selo, monstros sem corpo que tomam qualquer golpe). Enquanto uma corrente segura, o rei não sente nada: o golpe resvala (faísca verde, "tink", o escudo de alma aparece). Quebradas as três, o coração cai no chão e o rei **ajoelha**: fica exposto por **10 s ou até perder um terço da vida**. Depois ele ergue o coração (2 s) e refaz as âncoras **em outros lugares** (no chão, nos beirais baixos, nos beirais altos). **Três ciclos**, que são as três fases. O herói tem de correr o Salão inteiro, subir escadas e escolher a ordem das âncoras enquanto o rei ataca.
- **Os golpes (todos avisados):**
  - **Lança de Alma:** ele ergue a mão de trás com a lança de luz; uma linha fina vai da mão até o herói (segue 0,7 s, trava e pisca 0,3 s) e a lança voa por ela.
  - **Mão da Cova:** círculos claros no chão por 1 s (um debaixo do herói, mais um por fase em volta); depois mãos de osso saem e prendem os pés 0,6 s.
  - **Foice:** de perto, ele ergue a foice atrás da cabeça (0,75 s; 0,6 s na fase 3) e o arco do golpe aparece no chão; varre rente ao chão na frente (5,5 blocos). Pula-se por cima.
  - **Levantar os Mortos:** ergue o braço 1,2 s; as lajes de cova mais perto do herói racham (pó e luz verde) e legionários sobem delas (no máximo três de uma vez, sem loot).
  - **Fase 3, as Paredes de Osso:** a linha verde acende no chão 1,2 s e duas paredes de osso fecham devagar das pontas do Salão até 26 blocos de cada lado (cobrem os beirais baixos), seguram 5 s e voltam. Empurram, não machucam.
- **Entrada na luta:** entrar 10 blocos no Salão acorda o rei (2 s, ele aparece da fumaça verde e as correntes se acendem). O **Rastrilho de Ossos** (`NC_BARREIRA`) fecha as duas portas e a câmera se afasta um passo.
- **Reinício:** sair do Salão, usar portal ou morrer reinicia: o rei some, as âncoras e o coração voltam, o rastrilho abre.
- **Lendário único:** **O Filactério do Rei Eterno** (acessório): uma vez a cada 3 minutos, a morte não leva: o herói volta com 40% da vida, num clarão verde. Mais 30 de vida, 1 de regeneração e 3 de defesa. Nível de item 70.
- **Primeira vitória:** uma das três bases da camada, garantida. **Save:** `reiEterno.dead`. O 363 abre o caminho para baixo (353).

## 8. Loot e economia (`js/388-sepulcrita.js` e 385)

- **Metal:** **Sepulcrita**, o ferro dos cravos de caixão e das armaduras enterradas, passado por séculos de alma presa: nódulos cinza-prata com um lustro verde-pálido. `min_sepulcrita` → `barra_sepulcrita`, **8 minérios por barra**. Nível da forja `layerForgeIl('necropole')` (27). As 9 peças na bigorna: espada 44, adaga 30, machado 67, maça 53, lança 47, montante, elmo (9 def, 22 vida), peitoral (12 def, 32 vida), botas (5 def, +6% de velocidade).
- **Carvão:** no granito.
- **Materiais próprios:** `cravo_caixao` (Cravo de Caixão, o Grimaldo compra), `cinza_alma` (Cinza de Alma, a Marta e a Aurélia compram), `unguento` (Unguento de Embalsamar, a Marta compra), `tinta_sentenca` (Tinta da Sentença, a Aurélia compra), `mortalha_pano` (Pano de Mortalha).
- **Bases temáticas** (só caem aqui, raras): **Alabarda da Legião** (lança, golpe mais pesado; legionário e cavaleiro), **Escudo de Tampa de Sarcófago** (escudo, defesa 7 e aparo largo; legionário, cavaleiro, coveiro, gaveta), **Capuz do Necromante** (elmo, +vida e regeneração; necromante, escriba, embalsamador). O Rei Eterno solta uma das três na primeira vitória.
- **Sem baús.** Barras e minério vêm dos veios e dos monstros. Os mortos levantados pelo embalsamador e os do rei não soltam nada.

## 9. Luz e atmosfera

- Escuro de pedra. A luz que existe tem dono: as **lanternas de alma** que os necromantes mantêm (nos altares, nas capelas de pouso, no Salão), a vela de alma do altar, o **musgo-de-alma** que nasce das covas (luz fraca, natural do lugar) e os olhos dos mortos. Nada de tocha.
- Partículas por faixa: pó cinza caindo devagar nas Avenidas, poeira de osso nos Columbários, fuligem nos Quartéis e, na Cripta, faíscas de alma subindo devagar (as almas que o rei prendeu).
- A terceira camada mostra a cidade dos mortos ao longe, a parede de nichos sem fim e a legião parada em fileiras.

## 10. Som (`camadaExt('necropole').ambiente`, formato do `DEF` do 97)

Sem melodia: ar parado e frio, eco longo de pedra (rt 5,2). Bases: ruído marrom grave; um sopro rosa nos Columbários; um chiado fino na Cripta. Eventos que já existem no 97: sussurros (mais nos Columbários), correntes rangendo, sino de finados raro (Avenidas), laje arrastando, gotas, um canto baixo (Cripta), gemido, vento frio, passos em marcha nos Quartéis, corvo raro, murmúrio, e o **coração** do rei batendo devagar na Cripta enquanto ele vive.

## 11. Interface e progressão

- Nomes de zona (o nome aparece ao entrar, como hoje): Avenidas dos Túmulos (`aqui o reino inteiro veio deitar`), Os Columbários (`cada nicho tem um nome`), Os Quartéis da Legião (`o exército espera a ordem`), A Cripta Real (`o rei não deitou`).
- Barra de chefe: "O Rei Eterno", "o rei não deitou". Nenhum texto de dica, atalho ou aviso.
- Teleporte da tela de Testes: "A Necrópole do Rei Eterno", as quatro faixas (`camadaExt('necropole').tp`).

## 12. Arte (rampas de 6 tons)

| Material | Rampa |
|---|---|
| Granito negro | `#121317` `#1d1f24` `#2a2d34` `#3a3e46` `#4f535c` `#686c76` |
| Terra de cova | `#17120e` `#261e17` `#362b21` `#47392b` `#5a4a38` `#705e48` |
| Laje de rua | `#24221e` `#37342d` `#4d493f` `#655f53` `#7f786a` `#9b9382` |
| Mármore funerário | `#36363a` `#535357` `#747476` `#979592` `#bab8b2` `#dcdad2` |
| Mármore real | `#07070a` `#101014` `#19191f` `#24242b` `#323239` `#46464f` (veio `#d8b060`) |
| Alma | `#1a3a2c` `#2e5e48` `#4a8a6a` `#7ad8a8` `#b8f0d0` `#eafff4` |
| Sepulcrita | `#18222a` `#2a3a42` `#4a6262` `#64807e` `#b8f0d0` `#d8f0e6` |

Os humanoides seguem o herói (12 x 22, corpo e pernas no `heroPaint`), braços e armas desenhados por cima com a luz de cima à esquerda. O Rei Eterno é um esqueleto alto de coroa de ouro com a pedra de alma, manto negro com friso de ouro, capa vermelho-escura com gola alta e arminho, e a foice de cabo de freixo com o fio de alma (72 x 62, nove poses).

## 13. Sistemas novos

- **Os montes de ossos** (383): onde um morto da legião cai fica um monte por 12 s; o embalsamador vai até ele e o levanta.
- **O Coração-Relicário e as âncoras** (387): âncoras são monstros sem corpo que seguem um lugar do Salão; o coração é desenho (cai com gravidade e quica quando as correntes quebram). As paredes de osso da fase 3 são um empurrão, não blocos.
- **O Filactério** (387): o `die` é embrulhado; com o lendário e fora da espera, a morte vira 40% de vida.

## 14. Arquivos

| Arquivo | O que tem |
|---|---|
| `js/380-necropole-api.js` | ids, faixas, `necroBand`, `inNcHall`, `inNcLand`, `ncSafe`, as listas da geração, o registro (`camadaNomes`, `camadaExt` com o som) |
| `js/381-necropole-blocos.js` | texturas, paredes, terceira camada, minérios, decoração, itens de bloco, a luz de alma |
| `js/382-necropole-objetos.js` | os 18 objetos e o `NC_PROP_PLAN` |
| `js/383-necropole-legiao.js` | legionário, cavaleiro, arauto, embalsamador, coveiro; as peças comuns de arte (`NCB`), faíscas, montes de ossos |
| `js/384-necropole-corte.js` | necromante, escriba, mortalha, gaveta, fogo-fátuo |
| `js/385-necropole-mundo.js` | geração, descidas, saídas, zonas, spawn e nível, partículas, fornalha, lojas |
| `js/386-necropole-morte.js` | os 10 se desfazem em pedaços (`MORTE_TIPOS` do 360); carrega depois do 360 |
| `js/387-rei-eterno.js` | o chefe, o Salão, o lendário, o save do chefe |
| `js/388-sepulcrita.js` | o metal, as 9 peças, os materiais, as 3 bases (carrega com os metais) |
| `js/389-necropole-save.js` | nomes e subtítulos das zonas 81 a 84 |

## 15. Decisões (tomadas pela recomendação)

1. **Trono?** Não. A sala é o relicário pendurado e as âncoras que mudam de lugar a cada ciclo: a luta é de movimento pelo Salão, não de ficar na frente do rei.
2. **Quanto tempo ele fica exposto?** 10 s ou um terço da vida, o que vier primeiro. Se o tempo acaba antes, o ciclo se repete (as âncoras voltam em outros lugares), sem perder o que já se tirou.
3. **As paredes de osso machucam?** Não: só empurram. O aviso é a linha no chão; machucar seria dano de contato.
4. **Os mortos que o rei levanta dão loot?** Não, e dão 2 de XP. Os levantados pelo embalsamador também não.
5. **Câmera:** um passo mais longe (S − 1) só durante a luta, como no Leito do Titã, para caber o coração, as correntes e as âncoras.
6. **O lendário revive?** Sim, com espera de 3 minutos de jogo e 40% da vida; não funciona em sequência.

---

## Como ficou no jogo (2026-10-21)

- **Arquivos:** `js/380` a `389` como na seção 14. No `index.html`: o 388 logo depois do 288 (adamantita), com os metais; 380 a 385 depois do 285 (mundo do Ossário) e antes do 290 (Antigos); o 387 logo depois do 287 (Último Titã), antes do 49; o 389 depois do 289; o 386 logo depois do 360 (morte). O 355 continua o último.
- **Ids de monstro:** `mortalha` já era do Escuro (225) e `fatuo` dos Elfos (253); os daqui são `ncMortalha` e `ncFatuo` (os nomes na tela continuam Mortalha e Fogo-fátuo). Sem isso, a Necrópole trocava os bichos das outras duas camadas.
- **O bando de fogos-fátuos** não passa o teto de monstros da zona: o bando encolhe se já houver muita gente.
- **O 385 tem `ncSummonNow`:** o que o rei chama (âncoras, legionários) passa pelo `spawnEnemy` sem ganhar o nível da faixa e sem sumir por estar no Salão.
- **O coração** pende a 10 blocos do chão (com a câmera afastada, cabe na tela junto com o rei).
- **O caminho para baixo:** o embrulho do `endBossFight` que abre o caminho saiu do 353 para o `js/363-descida-vitoria.js` (do coordenador, copiado do `ud5`), que carrega depois de todos os chefes; o embrulho do Rei Eterno responde sozinho e o 363 abre o caminho por fora.
- **Testes (2026-10-21):** ver o relatório; resumo: 8 sementes sem erro, a camada 100% alcançável das capelas (e do vilarejo em 6 das 8; nas sementes 9001 e 31337 o caminho do vilarejo já para por volta da linha 2718, nas camadas de cima, igual no `ud5` sem a Necrópole), as duas saídas descem para os Antigos, o teleporte das 4 faixas, os 10 monstros atacando, a luta inteira com `deusOn` (3 ciclos, o caminho abre, o rastrilho abre, o lendário e uma base caem) e a geração da camada em cerca de 1,3 s.
- **Prints:** `/mnt/project-files/revamp/necropole/` (as 4 faixas, a folha dos 10 monstros, o rei na sala, os blocos e os objetos).
