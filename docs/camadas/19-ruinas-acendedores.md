# As Ruínas dos Acendedores: ficha de implementação

> **2026-10-21:** a camada tem 558 m (`AC_D = LAYER_D`), com as faixas 3 vezes mais altas (`AC_BANDS = [0, 46, 98, 150, 186] × LAYER_K`) e 3 andares de salas por faixa ([00-geral.md](00-geral.md), seção 1b). Ela é a 19ª da lista, entre O Abismo (18) e A Escuridão (20, a última). O topo sai do registro (`camadaAcima`/`GEN_NOMES`, `AC_S0`), e os níveis saem da posição: monstros 91 a 94, chefe 95, forja `layerForgeIl` (37 na posição 19). Num jogo com menos camadas geradas, ela sobe sozinha, e os números sobem junto.

A cidade do povo que acendeu os braseiros para segurar a Escuridão. Quando a luz começou a faltar, os Acendedores desceram para mais perto do fogo do fundo do mundo e construíram aqui: faróis para vigiar o escuro, ruas de laje por onde passavam as carroças de carvão, templos onde se rezava para a chama, e no fundo a Fornalha do Mundo, que alimentava todos os braseiros. Hoje quase tudo está apagado. Os que ficaram enlouqueceram no escuro, e o fogo que restou virou bicho. No fundo, o mestre da guilda ainda alimenta o Grande Braseiro.

**O que a diferencia:** é a última camada com luz que alguém acende. O Abismo, em cima, é o fogo selvagem do Inferno. A Escuridão, embaixo, é a falta de tudo. Aqui o fogo é trabalho de gente: está em braseiros, faróis, círios e lampadários, e quase todo ele já se apagou. A camada é feita de cidade (pedra lavrada, tijolo, laje, bronze), não de caverna.

---

## 1. Identidade

- **Nome:** As Ruínas dos Acendedores. **Faixas (zonas 93 a 96):** Os Faróis Caídos ("ninguém mais vigia daqui"), As Ruas de Cinza ("a cidade dorme de olhos abertos"), Os Templos da Chama ("aqui se rezava para o fogo"), A Fornalha do Mundo ("a última chama ainda arde").
- **Conceito:** a lenda da Escuridão ([16-escuridao.md](16-escuridao.md)) conta que os Acendedores seguraram o escuro com braseiros. Esta camada mostra onde eles moravam e o que sobrou deles. O monstro `acendedor` da Escuridão é um Acendedor que se perdeu lá embaixo; aqui nenhum bicho repete ele: são turiferários, faroleiros, arautos e o que o fogo virou.
- **Sensação:** luto e teimosia. Uma cidade inteira que se apagou, e uns poucos loucos que ainda acendem braseiros para ninguém.
- **Referências:** Dark Souls (Izalith, a Chama Primordial, o Lorde Gwyn ligando a chama), Blasphemous, as cidades de pedra de Dark Souls 3 (Irithyll de noite), os faróis de Alexandria.
- **Contraste com as vizinhas:** o Abismo é vermelho, barulhento e vivo; as Ruínas são marrom de fuligem, cinza e laranja-brasa, silenciosas, com o fogo em pontos pequenos. A Escuridão, embaixo, é preto e azul-frio: a pedra das Ruínas vai afinando até a pedra da Escuridão nas últimas linhas.

## 2. Lugar no mundo

| Zona | Faixa | Altura (blocos) | Massa | Caráter |
|---|---|---|---|---|
| 93 | Os Faróis Caídos | 0 a 138 | rocha fuliginosa, cinza, tijolo refratário | cavernas altas com faróis de tijolo em pé (escada de ferro por dentro, casa da lanterna no alto) e faróis tombados (túnel de tijolo deitado), covas |
| 94 | As Ruas de Cinza | 138 a 294 | rocha fuliginosa, pedra lavrada, laje | ruas largas de laje com casas de pedra lavrada (porta, janela, telhado), carroças, poços |
| 95 | Os Templos da Chama | 294 a 450 | pedra lavrada, bronze enegrecido | templos de paredes grossas com colunas e estrado do altar; os únicos braseiros acesos (os turiferários alimentam) |
| 96 | A Fornalha do Mundo | 450 a 558 | rocha de brasa, escória, tijolo | forjas com chão de escória, veios de brasa, a Fornalha do Mundo (o chefe) e as duas Escadarias do Fundo |

- **Constantes:** `AC_D`, `AC_BANDS`, `AC_ZONE0 = 93`, `acBand(ty)`, `inAcendedores(ty)`, `AC_S0` pelo registro (`js/410-acendedores-api.js`).
- **Registro (129):** `camadaNomes('acendedores', …)` com `halls: 'acExits'`, `boss: 'acBoss'`, `climb: 'AC_ESCADA'`, `mouth: 'AC_BRASEIRO'`, `thin: 'AC_ROCHA'`; `camadaExt('acendedores', …)` com `sala`, `salaFn: 'inAcHall'` (função global, o 353 acha pelo nome), `cor: '#ffb060'` (o pó do caminho que abre), `subir`, `tp`, `gemas`, `minerios`, `ambiente`.

## 3. Estrutura e geração (`js/415-acendedores-mundo.js`)

Em passos, dentro do `genStage('acendedores')` que embrulha o `buildCathedral`:

1. **A rocha:** rocha fuliginosa em tudo; a rocha de cima (`camadaAcima`, o Abismo) afina nas últimas linhas e vira cinza; veios de rocha de brasa crescendo para o fundo; escória em bolsões na Fornalha.
2. **Os vazios:**
   - **As duas entradas:** um poço de 3 desce de dois templos do Abismo (longe um do outro, mais de 120 colunas) até a **Casa da Guarda**, a câmara de pouso de 16 x 6, de pedra lavrada, acesa pelas fendas de brasa da lareira (luz do lugar, ninguém precisou acender). Porta de 4 de altura para fora, numa pracinha dos Faróis. Nenhum monstro nasce a menos de 20 blocos dela (`acSafe`).
   - **A Fornalha do Mundo:** a caixa do chefe, do outro lado do mundo em relação às entradas, com dois corredores de serviço até as portas (seção 7).
   - **As duas saídas, as Escadarias do Fundo:** duas salas de 18 a 23 x 10 no fundo, a pelo menos um terço do mundo uma da outra e a 90 da Fornalha, cada uma com um poço de 3 até a última linha. A Escuridão põe as duas entradas dela debaixo delas (seção 13). Entre as duas camadas fica o selo do 353 (6 linhas de rocha inteira, que a picareta quebra): o único caminho natural para baixo é o que desaba do chão da Fornalha quando o chefe cai.
   - **As salas de cada faixa:** faróis em pé (40 a 54 x 32 a 40) e tombados nos Faróis; ruas largas nas Ruas; templos nos Templos; forjas na Fornalha; covas em todas.
3. **As ligações:** túneis entre as salas de cada andar em anel e rampas em zigue-zague entre os andares.
4. **Os carimbos:** a torre de tijolo com a escada de ferro por dentro e a casa da lanterna no alto (o topo fechado, só uma fresta), a torre tombada, as casas de pedra lavrada, as ruas de laje, o templo de colunas, a forja.
5. **Os veios:** carvão na rocha fuliginosa; ardorita sempre a até 6 blocos de um veio de brasa.

Depois (`acAfter`): tudo alcançável das entradas; escada de ferro (faixas 0 e 2) ou corrente de lampadário (faixas 1 e 3) em todo desnível de 5 ou mais (fora das torres, que já têm a escada por dentro); a decoração de 1 bloco; as fendas de brasa no chão de todas as faixas (mais no fundo); os braseiros acesos dos templos; os objetos (412). Por fim `acDress` (a Fornalha), `acExitClear` (as bocas), `acFallFix` e `acClimbFix`:
- **`acFallFix`:** de toda beira onde o herói fica de pé, se o vão embaixo passa de 13 blocos sem escada, corrente ou água, desce uma corrente do teto (se o teto está a até 10) ou se encosta uma escada de ferro no chão até a altura da beira. Roda de novo depois de cada `worldLink` do 87 (as ligações abrem túneis que criam quedas novas).
- **`acClimbFix`:** a subida garantida (o padrão do 285): da Fornalha, de cada torre, rua, templo, forja e do pé das Escadarias, o herói consegue voltar às entradas (pulo de 3 blocos; escada e corrente sobem).

## 4. Blocos (`js/411-acendedores-blocos.js`)

Texturas contínuas de 240 x 240 como no 281, rampas de 6 tons (decoração em 7), luz de cima à esquerda.

| Id | Bloco | Item | Notas |
|---|---|---|---|
| 992 | Rocha Fuliginosa (`AC_ROCHA`) | `rocha_fuliginosa` | arenito escuro em camadas, fuligem subindo das rachaduras; a pedra natural |
| 993 | Pedra Lavrada (`AC_LAVRADA`) | `pedra_lavrada` | silhares em fiadas desencontradas, marcas do cinzel |
| 994 | Laje de Rua (`AC_LAJE`) | `laje_rua` | larga e gasta, com os sulcos das carroças |
| 995 | Cinza Fria (`AC_CINZA`) | `cinza_fria` | fina, mole (dureza 0,5) |
| 996 | Rocha de Brasa (`AC_BRASA`) | `rocha_brasa` | veios que ardem por dentro; `EMIT 0,42`: a luz que nasce do lugar |
| 997 | Tijolo Refratário (`AC_TIJOLO`) | `tijolo_refratario` | vermelho-ocre, vidrado; faróis e fornos |
| 998 | Bronze Enegrecido (`AC_BRONZE`) | `bronze_negro` | placas dos templos, só o sol em relevo brilha |
| 999 | Escória (`AC_ESCORIA`) | `escoria` | vidro preto com bolhas |
| 1000 | Grade Acesa (`AC_BARREIRA`) | — | ferro em brasa, não quebra; fecha a Fornalha durante a luta |
| 1001 | Carvão (`AC_O_CARVAO`) | carvão | o carvão comum, na rocha fuliginosa |
| 1002 | Ardorita (`AC_O_ARDORITA`) | `min_ardorita` | pepitas de cobre com o miolo aceso; cintila ao vivo |
| 1003 | Grelha de Ferro (`AC_GRELHA`) | `grelha_ferro` | o chão da Fornalha, barras sobre o poço de brasa |
| 1004 | Escada de Ferro (`AC_ESCADA`) | — | escala; banzos rebitados, ferrugem |
| 1005 | Corrente de Lampadário (`AC_CORRENTE`) | — | escala |
| 1006 / 1007 | Braseiro Frio / Braseiro Aceso | — | o frio vira aceso quando um turiferário passa |
| 1008 a 1016 | cera escorrida, cinzeiro, pavio pendurado, fuligem, fenda de brasa (`EMIT 0,6`), lanterna apagada, coluna, ossada, pingente de cera | `cera_acendedor` (cera), `pedra_lavrada` (coluna) | decoração de 1 bloco |

1017 a 1023 ficam livres. **Paredes:** 143 rocha, 144 pedra lavrada, 145 tijolo, 146 templo, 147 fornalha. **Terceira camada:** 90 Faróis, 91 Cidade, 92 Fornalha.

## 5. Objetos de cena (`js/412-acendedores-objetos.js`)

21 objetos, `defProp` com `acend: true`, postos pelo 415 a partir de `AC_PROP_PLAN`:
- **Faróis Caídos:** a lente de farol rachada (`ac_lente`), o sino de farol caído (`ac_sino`), a pira de farol apagada (`ac_pira_fria`), o estandarte queimado da guilda (`ac_estandarte`), o pedaço de escadaria em caracol (`ac_escadaria`).
- **Ruas de Cinza:** a carroça de carvão tombada (`ac_carroca`), o poço de rua (`ac_poco`), a estátua de Acendedor sem cabeça (`ac_estatua`), a placa da guilda (`ac_placa`), os barris de óleo (`ac_barris`), o varal de lanternas apagadas (`ac_varal`).
- **Templos da Chama:** o altar da chama (`ac_altar`), o disco do Sol em bronze (`ac_sol`), o incensário de pé (`ac_incensario`), o lampadário de teto (`ac_lampadario`), o nicho de urnas de cinza (`ac_urnas`).
- **Fornalha do Mundo:** a bigorna gigante (`ac_bigorna`), o fole quebrado (`ac_fole`), o cadinho tombado com a escória ainda em brasa (`ac_cadinho`), a pilha de lingotes (`ac_lingotes`), a boca de forno (`ac_forno`).

Nada de baú: os únicos baús do jogo são o do vilarejo.

## 6. Os 10 monstros (`js/413-acendedores-loucos.js` e `js/414-acendedores-chamas.js`)

Nenhum machuca no toque: todo golpe tem aviso (`WARN_E`) e todos usam linha de visão e o caminho do jogo (`NAV_WALKERS`/`CV_STEP` para os que andam). XP baixo (18 a 34). Os números abaixo são os de antes do `BAL` do 49, no nível 1; o nível da camada multiplica (vida ×(1+0,3(n−1)), dano ×(1+0,2(n−1))).

**Os loucos (413):**

| Monstro | Estilo | Vida / dano | Aviso e golpe |
|---|---|---|---|
| Turiferário Louco (`turibulo`) | corpo a corpo | 70 / 15 | gira o turíbulo acima da cabeça com rastro de fagulhas (0,6 s) e varre um círculo inteiro em volta; acende os braseiros frios por onde passa |
| Faroleiro Cego (`faroleiro`) | à distância | 58 / 17 | um fio de luz procura o herói (0,9 s, para de seguir no último terço) e o feixe queima a linha até a pedra |
| Arauto das Cinzas (`arauto`) | apoio | 80 / 12 | leva a trompa à boca (0,8 s) e sopra: anel de cinza quente que empurra e queima; os loucos em volta ganham o fervor (6 s, mais fortes e rápidos) |
| Engolidor de Brasas (`engolidor`) | à distância | 92 / 17 | bochechas incham e a boca brilha (0,7 s); cospe uma bola de fogo que quica três vezes |
| Alado de Cera (`alado`) | voador | 52 / 14 | voa alto; marcas brilham no chão (0,8 s) e gotas de cera fervendo caem nelas |

**O que o fogo virou (414):**

| Monstro | Estilo | Vida / dano | Aviso e golpe |
|---|---|---|---|
| Enxame de Fagulhas (`fagulhas`) | enxame, atravessa pedra | 34 / 11 | o bolo se aperta num nó branco (0,8 s) e corre em linha reta pelo herói |
| Braseiro Faminto (`faminto`) | emboscada | 78 / 19 | parece um braseiro frio; as brasas acendem por baixo da cinza (0,7 s) e ele morde ou salta; acordado, anda pulando nas três pernas |
| Forno Andante (`fornoandante`) | pesado | 230 / 24 | a porta da barriga abre e clareia (1 s) antes do cone de chamas; ou ergue o pé (0,8 s) e pisa, e uma onda de cinza corre pelo chão dos dois lados (pular passa) |
| Círio Vivo (`cirio`) | lento | 88 / 15 | deixa poças de cera que prendem o passo; a chama cresce (0,8 s) e ele sacode três bolas de cera fervendo |
| Enforcado do Pavio (`pavio`) | do teto | 62 / 14 | pendurado num pavio; o laço aceso desce brilhando (0,8 s); quem fica no laço é puxado para cima e queima |

**Por faixa (`CATH_SPAWN`, cada faixa usa 5 ou 6 dos 10, todos aparecem):**
- Faróis Caídos (máx. 8): faroleiro, alado, turiferário, fagulhas, enforcado.
- Ruas de Cinza (máx. 9): turiferário, arauto, faminto, enforcado, engolidor, círio.
- Templos da Chama (máx. 9): círio, arauto, turiferário, alado, faminto.
- Fornalha do Mundo (máx. 10): forno andante, fagulhas, engolidor, faminto, faroleiro.

A queimadura (`acQueima`, dano por segundo curto) e as poças de cera (`acCera`, prendem o passo) são as duas peças comuns (`ACM`). As mortes de cada um estão no `js/419-acendedores-morte.js` (`Object.assign(MORTE_TIPOS, …)`, depois do 360).

## 7. Chefe: O Último Acendedor (`js/416-ultimo-acendedor.js`)

O mestre da guilda, o que acendeu o primeiro braseiro da cidade e o que ainda alimenta o Grande Braseiro. Um velho alto (12 x 30) de manto de brasa e máscara de sol, com a vara de pavio aceso. Nível 95 (`layerBossLvl`): vida 330 × (1 + 0,3 × 94) = 9636, dano 9 × (1 + 0,2 × 94) = 178, antes do `BAL` do 49. XP 560.

**A sala, a Fornalha do Mundo, sem trono.** Uma caixa de 112 x 46 de tijolo, abobadada. É a sala que muda a luta:
- **O chão é a grelha de ferro** (`AC_GRELHA`) sobre o poço de brasa, com três lugares de pedra: o estrado do meio (onde fica o Grande Braseiro) e dois pedestais baixos.
- **Plataformas de pedra em dois andares** dos dois lados (as baixas a 10 do chão, as altas a 15), com correntes para subir.
- **Quatro lanternas de bronze** penduradas do teto, uma ao lado da ponta de cada plataforma. Cada lanterna acesa manda um fio de fogo para ele e corta 15% do dano que ele toma. Um golpe na lanterna corta a corrente e ela cai reto: se cair a até 2 blocos dele, queima (12% da vida dele e 2 s tonto); se não, vira uma poça de fogo no chão. Derrubar as lanternas na hora certa, em cima dele, é a luta.
- **A Grade Acesa** fecha as duas portas quando a luta começa.

**Fases e golpes (todos com aviso):**
1. **Varada:** a ponta da vara fica branca (0,6 s) e ele estoca de baixo para cima, 4,5 blocos. **Brasa Lançada:** uma marca no chão debaixo do herói (0,9 s), a brasa cai ali e o chão queima 3 s.
2. **Abaixo de 2/3:** também a **Maré de Brasa**: as grelhas acendem do meio para fora (1,5 s) e queimam 3 s. Só a pedra (estrado, pedestais, plataformas) é segura.
3. **Abaixo de 1/3:** o Grande Braseiro apaga e a sala escurece. Ele **salta** de plataforma em plataforma: um círculo de brasa marca onde vai cair (0,9 s), e a queda queima em volta.

Sair da sala, usar portal ou morrer reinicia: as lanternas voltam, o braseiro reacende, a grade abre. Na vitória: a lendária e uma das três bases. O caminho para baixo abre pelo `js/363-descida-vitoria.js` (o embrulho do `endBossFight` do coordenador). O save guarda só `ultimoAcendedor: { dead }`; a grade nunca entra nos `diffs`.

## 8. Loot e economia (`js/417-ardorita.js`, 413, 414, 416)

- **O metal: ardorita.** Vermelho-cobre por fora com o miolo que ainda brilha como brasa; os veios nascem sempre junto da rocha de brasa. O minério cai **só dos monstros desta camada** (5 a 22%) e se minera nos veios; 10 minérios por barra na fornalha (`FURN.min_ardorita`). Na forja, nível `layerForgeIl('acendedores')`, entre a infernita e o noctírio: espada 44 / 15,5%, adaga 29 / 11,5%, machado 66, maça 52, lança 47 / 9,5%, montante, elmo 9 def / 21 vida, peitoral 12 / 32, botas 6 / +6% velocidade.
- **O carvão:** o carvão comum (`AC_O_CARVAO` solta o mesmo item).
- **Os materiais:** Cera de Círio (`cera_acendedor`), Brasa Viva (`brasa_viva`), Pavio Eterno (`pavio_eterno`), com preço em `MAT_VAL` e nas lojas.
- **As três bases, raras (cerca de 1%):** o Atiçador dos Acendedores (`aticador`, maça, 8% de crítico; turiferário e faminto), o Capuz de Cinza (`capuz_cinza`, cabeça, def 6, vida 18, um pouco de luz; faroleiro e círio), as Botas de Brasa (`botas_brasa`, pés, def 4, +7% velocidade; engolidor e forno andante). Nível `layerLo('acendedores')`.
- **O chefe:** sempre a **Vara do Último Acendedor** (`vara_acendedor`, lança lendária: todo golpe acende o alvo, que queima 3 s; a vara ilumina em volta; +12% de dano), uma das três bases, de 6 a 10 minérios de ardorita, materiais e poções.
- Sem baú, sem missão.

## 9. Luz e atmosfera

- **Luz que nasce do lugar:** os veios de rocha de brasa (`EMIT 0,42`), as fendas de brasa no chão (`EMIT 0,6`, mais densas no fundo), a ardorita cintilando (`EMIT 0,2`), a escória ainda em brasa no cadinho e na boca de forno, a Fornalha do Mundo.
- **Luz que alguém acende:** os braseiros dos templos estão acesos porque os turiferários ainda os alimentam (e um turiferário acende todo braseiro frio por onde passa, na hora); a lanterna do faroleiro; o pavio do círio; as lanternas e o Grande Braseiro da Fornalha, que o Último Acendedor mantém. Tudo o mais está apagado: braseiros frios, lanternas apagadas, piras de farol frias.
- A Casa da Guarda é acesa pelas fendas de brasa da lareira, não por braseiro.
- Partículas: cinza caindo devagar nas Ruas, fagulhas subindo dos veios e das fendas no fundo.

## 10. Som (`camadaExt.ambiente`, no 410)

Reverberação longa (3,8 s). Leitos: o ronco baixo (marrom), o vento passando pelas ruas vazias (rosa, mais forte nos Faróis e nas Ruas) e o fole da Fornalha (só na faixa 4). Eventos: estalo de brasa (mais no fundo), sino de farol batendo com o vento (Faróis), assobio do vento, correntes de lampadário (Templos), sussurro de reza (Templos), o fole e um coração de fogo batendo (Fornalha), a rocha gemendo de calor, cascalho caindo, uma porta batendo (Ruas). Cada monstro e o chefe têm os seus sons em `sfx.ac*` e `sfx.acq*`.

## 11. Interface e progressão

- Só o nome da faixa ao entrar (o banner com o nome e o subtítulo da zona). Nenhuma dica, atalho ou aviso escrito.
- O nome do chefe e "a última chama" na barra de chefe e no banner do começo.
- O teleporte da tela de Testes lista a camada e as 4 faixas (`camadaExt.tp`).
- O número do mundo (`wg`) não sobe aqui.

## 12. Arte (rampas de 6 tons)

- Luz de cima à esquerda, contorno escuro só onde toca o ar, blocos de 12 x 12, humanoides de 12 x 22 (os Acendedores de manto têm 9 de largura de corpo).
- Paletas: rocha fuliginosa `#141210 → #665c4e`; pedra lavrada `#2a241c → #9a8a68`; tijolo `#2a120a → #b06a44`; bronze `#140e08 → #8a663c`; brasa `#3a0e04 → #ffe6a8`; cera `#3a3226 → #f8f0d8`.
- Nada fora da época: ferro batido, bronze, cera, pavio, carvão, tijolo. Nenhum vidro moderno, nenhum gás.

## 13. A vizinha de baixo: a Escuridão desce das Ruínas

`js/220-escuro-api.js` e `js/226-escuro-mundo.js` pegam a camada de cima por `camadaAcima('escuro')`, com o Abismo como antes quando as Ruínas não existem:
- `ES_S0` = topo + altura da camada de cima.
- A transição de material usa os solos da camada de cima (`ACI.soils`/`host`), as lascas usam a rocha fina dela (`thin`/`thinW`).
- As duas entradas da Escuridão saem das saídas que a camada de cima anotou (`ACI.exits`, as Escadarias do Fundo), e os braseiros da boca usam o `mouth` dela. A subida da Escuridão aceita a escada e a corrente da camada de cima (`esUpClimbs`).

## 14. Arquivos

| Arquivo | O que faz | Onde carrega |
|---|---|---|
| `js/410-acendedores-api.js` | constantes, ids, faixas, `inAcHall`, `acSafe`, registro (`camadaNomes`, `camadaExt` com o som) | depois do 109 |
| `js/411-acendedores-blocos.js` | blocos, paredes, terceira camada, minérios, decoração | depois do 410 |
| `js/412-acendedores-objetos.js` | os 21 objetos | depois do 411 |
| `js/413-acendedores-loucos.js` | ACM e os 5 loucos | depois do 412 |
| `js/414-acendedores-chamas.js` | os 5 do fogo | depois do 413 |
| `js/415-acendedores-mundo.js` | geração, zonas, spawn, nível, partículas, fornalha, lojas | depois do 414, antes do 220 |
| `js/416-ultimo-acendedor.js` | a Fornalha do Mundo e o chefe, a lendária | depois do 287 |
| `js/417-ardorita.js` | o metal, as peças, os materiais, as bases | entre o 110 e o 228 |
| `js/418-acendedores-save.js` | nomes das zonas | depois do 299 |
| `js/419-acendedores-morte.js` | as mortes dos 10 | depois do 360, antes do 361 |
| `js/220-escuro-api.js`, `js/226-escuro-mundo.js` | a Escuridão desce da camada de cima | (já existiam) |

## 15. Decisões

1. **As altas da Fornalha a 15, não 19.** Assim nenhuma queda da sala passa de 15 blocos; as lanternas de cima descem junto (a 17,5).
2. **Os braseiros acesos só nos templos** (e onde um turiferário passa). O resto da cidade é apagado; a luz da camada vem dos veios, das fendas e da Fornalha.
3. **Escada nas faixas 1 e 3, corrente nas 2 e 4.** Escada de ferro nos Faróis e nos Templos, corrente de lampadário nas Ruas e na Fornalha.
4. **A Casa da Guarda** como câmara de pouso: uma guarita de pedra lavrada, a única casa inteira da cidade.
5. **As três bases** em monstros de estilos diferentes, para que cada faixa tenha chance de pelo menos uma.

---

## Como ficou no jogo

- **Números usados:** arquivos 410 a 419; blocos 992 a 1016 (1017 a 1023 livres); paredes 143 a 147; terceira camada 90 a 92; zonas 93 a 96; código `ACENDEDORES`, prefixo `AC_`.
- **Ordem no `index.html`:** 410 a 415 depois do 109 e antes do 220; 417 entre o 110 e o 228; 418 depois do 299; 416 depois do 287; 419 depois do 360 e antes do 361; o 363 (do coordenador) antes do 355; o 355 é o último.
- **O caminho depois do chefe:** a Fornalha não abre caminho sozinha. O `endBossFight` do 416 só cuida da luta dele (`acqEnd`); quem abre o caminho para as Escadarias é o `js/363-descida-vitoria.js`, como o coordenador pediu.
- **`inAcHall(x, y, m)`** com margem negativa encolhe os lados e o teto, mas nunca o chão: com o herói em pé na grelha a luta começa (a primeira versão encolhia o chão também e a luta não começava).
- **Quedas:** `acFallFix` (seção 3) roda dentro da geração e de novo depois de cada `worldLink` do 87, porque as ligações do 87 abrem túneis e beiradas novas depois da camada. Cair em cima do topo de uma escada também conta como queda (a corrente nova emenda na de baixo). Nas 8 sementes: nenhuma queda livre de mais de 15 blocos de uma beira onde se fica de pé; sobram de 3 a 11 trechos de 13 a 15 por semente.
- **O Turiferário** varre o círculo inteiro: acerta quem estiver a até 2,4 blocos do centro dele durante o giro (a primeira versão só acertava o arco do turíbulo e quase nunca pegava).
- **O nome `leapT`** é usado pelo `walk()` do jogo; o chefe usa `acqT` para o tempo dele.
- **Luz:** a camada é escura como as vizinhas (`DARK.amb` 0,02). Subi a rocha de brasa para `EMIT 0,42` e a fenda de brasa para 0,6, e pus fendas no chão de todas as faixas, para a luz do lugar se ver.
- **Testes (2026-10-21), mundo inteiro, deus ligado (`deusOn = true`):**
  - Geração sem erro em 8 sementes (1, 2, 3, 7, 42, 999, 2024, 12345); tempo das Ruínas (`acBuild.ms`) de 0,8 a 1,6 s, o mundo inteiro de 42 a 73 s (a máquina estava dividida com outras camadas).
  - Alcance: de uma Casa da Guarda, 99,9% das Ruínas e 99% do Abismo; a outra entrada, as duas Escadarias e a Fornalha se ligam. Com o chefe vivo, 0% da Escuridão (o selo do 353); com o caminho da Fornalha aberto, 99,8% da Escuridão. As entradas da Escuridão ficam debaixo das duas Escadarias. Da vila, com todas as rotas abertas, o alcance já era 0% do Mar Sem Sol para baixo na base (`ud5`), antes das Ruínas: não é desta camada.
  - Câmaras de pouso: sem spawn, acesas pelas fendas.
  - Teleporte das Testes: as 4 faixas caem dentro da faixa certa.
  - Os 10 monstros nascem, avisam e acertam.
  - Sair da sala no meio da luta e morrer nela reiniciam: a grade abre, o chefe e as lanternas somem, e ao voltar as quatro lanternas estão acesas de novo.
  - A luta inteira: começa ao entrar, a grade fecha; lanterna em cima dele tira 12% e deixa tonto, longe vira poça de fogo; fase 2 com a Maré, fase 3 com o braseiro apagado e o salto; na morte, a grade abre, cai a Vara e uma base, `descida.vencidos` ganha `acendedores`, o caminho abre (as 213 células da rota ficam livres) e o save fica `{ dead: true }` sem a grade nos `diffs`.
