# Catedral Abandonada: especificação compartilhada

Camada nova e, por enquanto, **a única** debaixo do vilarejo. Três threads trabalham juntas:

| Thread | Dona de | Arquivos (só ela edita) |
|---|---|---|
| **Catedral: mundo e integração** (líder) | geração do mundo, motor de objetos, ganchos nos arquivos antigos, spawns, save, testes | `js/41-catedral-api.js`, `js/45-catedral-mundo.js`, e os pequenos ganchos em `03`, `06`, `07`, `10`, `15`, `23`, `36`, HTML |
| **Catedral: blocos e objetos** | texturas de blocos, paredes de fundo, blocos da 3ª camada, arte dos objetos (props), itens de bloco | `js/42-catedral-blocos.js`, `js/43-catedral-objetos.js` |
| **Catedral: mortos-vivos** | arte e animação dos monstros, IA nova, drops, projéteis/efeitos deles | `js/44-mortos-vivos.js` |
| **Catedral: monstros 7 a 10** | gárgula, acólito profano, carniçal, abominação; spawn novo das faixas (regra dos 10 monstros por camada) | `js/77-catedral-novos.js` |

Regras de sempre: arquivos são scripts comuns (não módulos), todos com `'use strict'`; antes de gravar, releia do dispositivo o arquivo e mexa só no seu; depois de gravar, re-stage e compare. Nenhum texto de dica, atalho ou linha extra na interface. Nada de trabalho por pixel por quadro: tudo é pintado uma vez (na carga ou na 1ª vez que aparece) e guardado. O jogador roda a ~180 FPS.

Se precisar de um gancho novo num arquivo antigo, **peça à thread líder** (mensagem) em vez de editar.

---

## 1. Conceito

Uma catedral gótica soterrada, abandonada há séculos, com a cripta embaixo. Logo na descida pela placa do vilarejo a terra dá lugar a pedra clara (calcário e cantaria branco-acinzentada) com um pouco de terra e raízes. Mais fundo: naves enormes com colunas, arcos, bancos tombados, vitrais apagados no fundo, candelabros; depois claustro e capelas laterais; no fundo, criptas baixas com ossários, sarcófagos e a cripta do Carrasco (a antiga, movida para o fundo).

Profundidade (1 bloco = 1 m, medida a partir do chão do vilarejo, como no HUD):

| Faixa | Profundidade | Nome no jogo (zona) | Caráter |
|---|---|---|---|
| Átrio | 6 a ~25 m | **Átrio Soterrado** | terra virando calcário claro, escadaria quebrada, primeiras paredes de cantaria, raízes |
| Nave | ~25 a ~80 m | **Nave da Catedral** | salões altos (14–22 blocos), colunas, arcos, bancos, vitrais, candelabros, estandartes |
| Claustro | ~80 a ~130 m | **Claustro Profanado** | capelas menores, corredores, escadas, reboco com afrescos, estátuas, mais escombros |
| Criptas | ~130 a ~185 m | **Criptas** | corredores baixos, ossário, nichos de túmulo, sarcófagos, pedra de cripta escura |

Abaixo de ~186 m: rocha-mãe (BEDROCK). Mundo continua 300 x 240 blocos, dá a volta na horizontal.

## 2. Estilo de arte (igual ao vilarejo, herói e árvores)

- Bloco = **12 x 12 px** (`T = 12`). Personagens humanoides: 12 x 22 (corpo 12x18 + pernas 12x4), mesmos pontos de encaixe do herói (ver `js/37-heroi.js`).
- Rampas de **6 tons** por material (0 sombra mais funda → 5 brilho), com leve deslocamento de matiz (sombras frias/violeta, luzes quentes). Luz de **cima à esquerda**; borda de cima de cada massa com brilho; sombra embaixo de saliências.
- **Granulado**: ruído fino por pixel (`hash2`) e manchas largas (`pn`), como em `03-blocos` (texturas assadas em 240x240 com `bake(fn)` e `pal(nome, [6 hex])`).
- Contorno escuro (tom 0 da rampa) só onde a massa toca o ar, como os blocos atuais.
- Objetos e monstros pintados com rampas por material, contorno escuro de 1 px, brilho de aro em cima.
- Nada de preto puro nem branco puro dominante; o “branco” da catedral é um cinza-osso quente, que fica bonito no escuro com a luz das velas.

### Paletas de referência (6 tons, escuro → claro)

| Material | Hex |
|---|---|
| `calcario` (rocha natural clara) | `#35322e #514c45 #6d675e #8a8378 #a69e91 #c1b9aa` |
| `cantaria` (blocos lavrados) | `#3b3936 #5a5751 #7a766e #9a958b #b9b3a7 #d6d0c3` |
| `marmore` (lajes, mosaico claro) | `#45423f #66625d #8a857e #aca69c #cac4b8 #e3ddd1` |
| `marmore_negro` | `#0e0d10 #18161b #232027 #2f2b34 #3d3843 #4d4754` |
| `cripta` (pedra fria do fundo) | `#17161b #222027 #2d2a33 #3a3640 #48434f #57515f` |
| `osso` | `#3a3226 #5a4e3c #7d6f58 #a09078 #c0b298 #dcd0b6` |
| parede de fundo clara (`cantariaW`) | `#121110 #181715 #1f1d1a #262420 #2e2b27 #37332e` |
| `madeira` velha (bancos, vigas) | `#1a110b #2c1d13 #40291a #563823 #6e4a2f #88603d` |
| bronze (candelabros) | `#2e200e #4e3818 #745626 #9c7a38 #c4a252 #e6ca7a` |
| ferro | `#141418 #24252b #383a42 #50535d #6e727e #9298a4` |
| vitral | chumbo `#141214`; vidro vermelho `#5a1418 #8a2228 #b8403a`; azul `#162a5a #23428a #3e66b8`; âmbar `#6a4410 #a06c1a #d8a03a`; verde `#163a22 #23603a #3e8a56`; violeta `#2a1840 #46286a #6a46a0` |
| tecido gasto (estandarte) | `#2a0a10 #43121a #5e1a22 #7a262c #94383a #b04e4a`, fio dourado `#8a6a2a #c49a42` |
| musgo / raiz (só no átrio) | musgo `#1e2a16 #2e4020 #44582c`; raiz `#2a1a10 #43301e #5e4630` |

A **parede de fundo** é sempre bem mais escura que o bloco da frente (o jogo inteiro faz assim), senão a frente não se destaca.

## 3. Blocos (thread de blocos, em `js/42-catedral-blocos.js`)

`NT` sobe para **64** (a líder faz isso em `03-blocos.js`). IDs reservados, já declarados em `js/41-catedral-api.js` (não redeclare; só pinte):

### 3.1 Blocos sólidos da frente (andáveis, quebráveis)

| ID | Constante | Nome | Uso | DIG sugerido |
|---|---|---|---|---|
| 30 | `CT_CALCARIO` | Calcário | rocha natural que envolve a catedral (a “massa”); hospeda os minérios | 0.55 |
| 31 | `CT_CALC_TERRA` | Calcário com terra | transição no átrio: calcário com bolsões de terra e raízes | 0.4 |
| 32 | `CT_CANTARIA` | Cantaria | blocos lavrados grandes (2 por bloco na horizontal, juntas desencontradas) — paredes dos salões | 0.9 |
| 33 | `CT_LAJE` | Laje | piso de lajes grandes, topo gasto e liso | 0.9 |
| 34 | `CT_MOSAICO` | Mosaico | piso de mármore xadrez claro/escuro com friso | 0.9 |
| 35 | `CT_RUINA` | Cantaria rachada | cantaria quebrada, rachaduras e fuligem; bordas de desabamento | 0.7 |
| 36 | `CT_ESCOMBRO` | Escombros | pedras soltas amontoadas (montes de desabamento) | 0.45 |
| 37 | `CT_CRIPTA` | Pedra da cripta | alvenaria velha, fria, escura (faixa das criptas). Diferente de `CRYPT` (21), o bloco da antiga cripta do Carrasco (removida) | 1.0 |
| 38 | `CT_OSSARIO` | Ossário | parede de crânios e ossos longos em argamassa | 0.6 |
| 39 | `CT_MARMORE_NEGRO` | Mármore negro | degraus de altar, rodapés, molduras | 1.1 |
| 40 | `CT_GRADE` | Grade de ferro | sólida, mas vazada: a parede de fundo aparece pelos furos (como `GATE`) | 1.0 |

### 3.2 Blocos não sólidos de 1 bloco (decoração quebrável, `DECO[t]` com variações)

| ID | Constante | Nome | Observação |
|---|---|---|---|
| 41 | `CT_COLUNA` | Coluna | **não sólida** (o jogador passa na frente). 3 peças: base, fuste canelado, capitel; a líder escolhe a peça pelos vizinhos via `DECO_PICK` (ver §6). Variação rachada opcional |
| 42 | `CT_RAIZ` | Raízes | penduradas do teto (átrio). 2–3 variações; a de baixo termina em ponta |
| 43 | `CT_CACOS` | Cacos de vitral | no chão, alguns pixels coloridos |
| 44 | `CT_CRANIOS` | Crânios | pilha pequena no chão |
| 45 | `CT_VELAS` | Velas derretidas | grupo de velas no chão; **emite luz** (`EMIT` ~0.7); a chama fica sem pintar no bloco (a líder anima por cima, como a `CANDLE`) — diga onde ficam os pavios |
| 46 | `CT_TEIA` | Teia grossa | teia de canto mais densa (2 variações, espelhadas) |
| 47–49 | livres | — | para o que a thread de blocos achar que falta (ex.: gotejo de cera, corrente de sino) — avise a líder o ID que usou |

Reaproveitamos sem mudar: `CHAIN` (escalável, serve de corda de sino), `CANDLE`, `WEB`, `BONES`, `BANNER`, `URN`, `TORCH`. (O `CHEST` saiu em 2026-10-10 com os baús de loot.)

### 3.3 Paredes de fundo (`walls[]`, valores 5..10) → `WMAT[id] = [paleta, bake(fn)]`

| ID | Constante | Nome |
|---|---|---|
| 5 | `WCT_CALCARIO` | calcário natural, rugoso |
| 6 | `WCT_CANTARIA` | cantaria lavrada (fileiras grandes) |
| 7 | `WCT_REBOCO` | reboco rachado com manchas de afresco desbotado (ocre, azul, vermelho bem apagados) |
| 8 | `WCT_PAINEL` | lambri de madeira escura (capelas, metade de baixo das paredes) |
| 9 | `WCT_CRIPTA` | pedra da cripta |
| 10 | `WCT_OSSARIO` | ossário (crânios em nichos) |

### 3.4 Terceira camada (atrás do fundo, `DEEPT`, `js/36-profundeza.js`) → `DMAT[id] = [paleta, bake(fn)]`

Bem mais escuras e “distantes” (tons como `deepAntiga`):

| ID | Constante | Nome |
|---|---|---|
| 6 | `DP_CT_ALVENARIA` | alvenaria distante: blocos enormes, juntas fundas |
| 7 | `DP_CT_ABOBADA` | nervuras de abóbada / aduelas de arco (pedras em leque) |
| 8 | `DP_CT_CALCARIO` | calcário fundo, rugoso |
| 9 | `DP_CT_CRIPTA` | nichos de túmulo distantes (fileiras de nichos escuros) |

### 3.5 Minérios dentro da catedral

Os minérios continuam os mesmos tiles (`COAL`, `COPPER`, `IRON`, `GOLD`, `CRYSTAL`; a forja e os itens dependem deles), mas o hospedeiro muda: **a thread de blocos refaz `MAT[ore]` com `bakeOre(t, vCalcario)` e o halo sobre a paleta `calcario`** (ajuste `ORE_HALO[t].pal[0]` antes de assar), para o veio não aparecer cercado de pedra cinza. A líder põe os minérios no calcário (não nas paredes lavradas): carvão e ferro em toda a catedral (desde 2026-10-09, um metal por camada: `js/102-minerios-camada.js`).

### 3.6 O que a thread de blocos registra por bloco

```js
MAT[CT_X] = [PALS.x, bake(vX)];      // sólidos e não sólidos “blocky”
SOLID[CT_X] = 1; BLOCKY[CT_X] = 1;   // sólidos
DIG[CT_X] = 0.9; EMIT[CT_VELAS] = 0.7;
BLEND[CT_CALCARIO] = 1; BLEND[CT_CALC_TERRA] = 1;   // só os naturais misturam borda com terra/minério
SEETHRU[CT_GRADE] = 1;               // desenha a parede de fundo atrás (registro da API)
DECO[CT_COLUNA] = [base, fuste, capitel];  // rowsT(...) ou Uint32Array(T*T)
PCOL[CT_X] = '#hex';                 // cor no mapa (Tab)
ITEMS.calcario = { name: 'Calcário', rar: 0, stack: 99, block: CT_CALCARIO, desc: '...' };
BLOCK_DROP[CT_CALCARIO] = 'calcario';
```
Itens de bloco: um por material sólido que valha a pena colocar (calcário, cantaria, laje, mosaico, pedra da cripta, mármore negro). Escombros e calcário com terra podem soltar `calcario`. Ossário pode soltar `osso`.

## 4. Objetos do mundo (props) — arte na thread de blocos, `js/43-catedral-objetos.js`

Objetos maiores que um bloco, pintados uma vez e assados **dentro da imagem do chunk** (custam zero por quadro). Não colidem. Somem (sem drop) se o bloco que os apoia for quebrado.

Registro (função da API, `js/41-catedral-api.js`):

```js
defProp('banco', {
  nome: 'Banco',
  apoio: 'chao',          // 'chao' (pés no topo do bloco de baixo) | 'teto' (pendura do bloco de cima) | 'parede' (solto na parede de fundo)
  camada: 'frente',       // 'fundo' = entre a parede de fundo e os blocos | 'frente' = por cima dos blocos não sólidos
  faixas: ['nave', 'claustro'],   // onde a líder pode usar: 'atrio' | 'nave' | 'claustro' | 'criptas'
  variantes: [canvas, canvas2],   // cada uma um canvas (tamanho livre, em px); transparente = alpha 0
  luz: [{ x: 7, y: 3, r: 0.8 }],  // opcional, por variante igual: pontos de luz (px dentro do canvas), r 0..1
  chamas: [{ x: 7, y: 3 }],       // opcional: pixels de pavio onde a líder anima chama por cima do escuro
  brilho: '#ffb060'               // opcional: cor do halo aditivo das luzes
});
```
O ponto de encaixe é o canto de baixo-esquerdo para `chao`, de cima-esquerdo para `teto` e `parede`. Larguras de preferência múltiplas de 12 (cabem nos blocos), mas não é obrigatório.

### Lista de objetos (ids e tamanhos sugeridos)

**Chão (`chao`)**
- `banco` 36x14 (fileira de banco de igreja; variantes inteira / quebrada / tombada)
- `candelabro_pe` 12x34 (candelabro alto de bronze, 3 velas, luz) 
- `estatua_santo` 18x40 (santo encapuzado sem rosto; variante sem cabeça)
- `estatua_anjo` 24x44 (anjo de asas fechadas, lacrimoso; variante com asa quebrada)
- `altar` 48x24 (altar de mármore com pano rasgado e velas, luz)
- `pulpito` 20x30
- `sarcofago` 36x18 (tampa com figura deitada; variante com tampa aberta/deslocada)
- `caixao` 24x12 (madeira podre; variante aberto com ossos)
- `pia_batismal` 18x20
- `sino_caido` 24x22 (sino rachado de bronze)
- `escombro_grande` 36x16 (pedaço de arco caído) e `coluna_tombada` 48x14
- `ossos_monte` 24x10
- `cadeira_bispo` 16x26

**Teto (`teto`)**
- `lustre` 36x30 (lustre/roda de ferro com velas, pendurado por corrente; luz)
- `incensario` 10x24 (turíbulo em corrente)
- `estandarte` 14x40 (estandarte rasgado, 2–3 variantes de brasão)
- `teia_grande` 30x24
- `corrente_gancho` 8x30
- `gaiola` 14x36 (gaiola de suplício com esqueleto)

**Parede de fundo (`parede`, camada `fundo`)**
- `vitral_alto` 36x72 (janela ogival alta: chumbo + vidro colorido apagado, alguns painéis quebrados mostrando escuro; um leve brilho próprio, sem luz)
- `vitral_rosacea` 60x60 (rosácea)
- `arco_ogiva` 60x48 (arco ogival de cantaria em relevo sobre a parede, para emoldurar passagens e naves)
- `nicho_santo` 24x36 (nicho com estatueta)
- `afresco` 48x30 (pintura desbotada e descascada)
- `cruz_caida` 24x36, `brasao` 24x24
- `nichos_cripta` 36x36 (nichos de túmulo com crânios)
- `tocheiro_parede` 10x16 (suporte de ferro com vela; luz)
- `quadro_rasgado` 24x30
- `orgao` 72x60 (tubos de órgão ao fundo, um por mundo, na nave principal)

A líder decide quantidade e lugar; a thread de blocos decide o desenho e pode acrescentar ids (avisando).

## 5. Mortos-vivos — thread de monstros, `js/44-mortos-vivos.js`

Refazer arte e animação no padrão do herói (rampas de 6 tons, luz de cima-esquerda, contorno). Mantém os tipos que já existem (a IA atual deles pode ser ajustada ou trocada) e soma o vomitador:

| tipo (`ET`) | Nome | Papel | Direção de status (nível 1) |
|---|---|---|---|
| `zombie` | Zumbi | lento, aguenta muito, agarra e arranha (melee curto) | hp ~55, dmg ~13, xp 14, kb baixo |
| `vomit` (novo) | Zumbi Vomitador | mantém meia distância, vomita um jato/bola de bile em arco que deixa poça ácida por alguns segundos (a poça é o ataque; fica no chão) | hp ~45, dmg ~10 (+ poça), xp 18 |
| `skeleton` | Esqueleto | espada, golpe com preparação clara | hp ~70, dmg ~20, xp 24 |
| `archer` | Esqueleto Arqueiro | recua, mira, flecha | hp ~48, dmg ~15, xp 22 |
| `guard` | Guardião Esquelético | lança e escudo, bloqueia de frente, estocada longa | hp ~95, dmg ~22, xp 34 |
| `ghost` | Espectro | atravessa paredes, some e aparece, investida gelada | hp ~40, dmg ~16, xp 26 |

Opcional se sobrar fôlego: `skull` (Caveira Flamejante) refeita para as criptas. Regras da casa: sem dano de contato (só ataques), aggro com linha de visão, caminhos com `navFind`/`walk` (ver `12-inimigos-ia.js`), XP baixo (a fórmula já existe em `spawnEnemy`).

Animação mínima por humanoide: parado (respiração 2 quadros), andar (4), preparar ataque, golpe, recuperar, levar dano (flash branco já existe), morrer opcional (partículas já existem). Esqueletos: ossos com sombreado, crânio com órbitas escuras e brilho fraco nos olhos durante o ataque. Zumbis: pele cinza-esverdeada, roupas de monge/peregrino rasgadas (combina com a catedral). Vomitador: barriga inchada, bile verde-amarela.

### Ganchos (já existem em `js/41-catedral-api.js`; o render e o combate chamam)

```js
ET.vomit = { name: 'Zumbi Vomitador', w: 8, h: 21, hp: 45, dmg: 10, xp: 18, kb: 0.6, fly: false, blood: '#8a9a3a' };
AI.vomit = function (e, dt, dx, dy, dist, aggro) { ... };          // mesmo formato das outras IAs
DROPS.vomit = [['carne', 0.5, 1, 2], ['pocao', 0.08], ...];
DRAW_E.zombie = (e, fx, fy, fl) => { ... };   // desenha no lc; fx = centro dos pés, fy = base dos pés (px da tela baixa), fl = piscando
EYES_E.zombie = (e, fx, fy) => { ... };       // passe aditivo de brilho (olhos), depois da luz
WARN_E.vomit = e => e.state === 'wind';       // mostra o “!” vermelho de aviso
BLOCK_E.guard = (e, dir) => bool;             // opcional: true = golpe bloqueado (substitui o bloqueio embutido do guard)
HOOK.update.push(dt => { ... });              // a cada quadro em jogo (poças, gotas...)
HOOK.drawWorld.push((cx, cy) => { ... });     // depois dos monstros, antes da luz (poças, bile em voo)
HOOK.drawGlow.push((cx, cy) => { ... });      // passe aditivo (brilho da bile, olhos)
```
Se `DRAW_E[tipo]` existe, o render usa ele no lugar do desenho antigo (o antigo fica no código). Pinte tudo uma vez (canvas por quadro de animação e por lado, + versão branca para o flash), como `set4()` em `02-arte.js`. A líder cuida das tabelas de spawn por faixa (§7); diga a ela se algum monstro precisa de algo especial (ex.: só em salões altos).

## 6. API e ganchos (thread líder)

`js/41-catedral-api.js` carrega depois de `36-profundeza.js` e define: `CATEDRAL` (liga a camada), as constantes de §3, `SEETHRU`, `DECO_PICK`, `defProp`/`PROP_DEFS`, `DRAW_E`, `EYES_E`, `WARN_E`, `BLOCK_E`, `HOOK`. `DECO_PICK[t] = (gx, gy, arr) => sprite` escolhe a variação de um bloco decorativo pelos vizinhos (a líder faz o da coluna; a thread de blocos pode registrar outros).

Ordem no HTML: `… 36-profundeza, 41-catedral-api, 42-catedral-blocos, 43-catedral-objetos, 08 … 13-cripta-chefe, 44-mortos-vivos, 14 … 23-save … 29-missoes, 45-catedral-mundo, 24-boot …`.

Código que roda na carga do 42/43/44 pode usar tudo de `00`–`36` + `41` (e o 44 também `08`–`13`). `SPR` só existe depois do `start()`: monte sprites no carregamento com `mk/fromRows/outlined/flip/whiteOf` ou na primeira vez que precisar.

## 7. Spawns por faixa (thread líder, para referência)

| Faixa | Tabela (peso) | Máx. |
|---|---|---|
| Átrio | zombie 0.6, skeleton 0.4 | 5 |
| Nave | zombie 0.3, vomit 0.15, skeleton 0.3, archer 0.25 | 8 |
| Claustro | zombie 0.1, vomit 0.13, skeleton 0.22, archer 0.2, guard 0.2, ghost 0.15 | 9 |
| Criptas | zombie 0.13, vomit 0.1, skeleton 0.2, archer 0.1, guard 0.22, ghost 0.25 | 10 |
| ~~Cripta do Carrasco~~ | removida em 2026-10-09; os demônios estão no Abismo (`abismo-spec.md`) | - |

## 8. Save

O mundo novo é gerado pela semente; saves antigos ganham um mundo novo (nível, itens, ouro e baú continuam), com um aviso. Objetos que sumiram (apoio quebrado) entram no save.
