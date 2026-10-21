# O revamp das camadas: 20 camadas, do nível 1 ao 100 (2026-10-21)

Pedido do Jonathan (2026-10-21). A campanha tem 20 camadas, cada uma com 5 níveis. A ordem está em `js/129-camadas.js` (`LAYERS`):

| # | Camada | Níveis | Situação |
|---|---|---|---|
| 1 | As Cavernas | 1–5 | existe |
| 2 | A Catedral | 6–10 | existe |
| 3 | As Cavernas de Gelo | 11–15 | existe |
| 4 | A Mina Abandonada | 16–20 | existe |
| 5 | As Minas Fúngicas | 21–25 | existe |
| 6 | **O Brejo das Bruxas** | 26–30 | nova, no lugar da Colmeia |
| 7 | A Cidade Afundada | 31–35 | existe |
| 8 | A Floresta Petrificada | 36–40 | existe |
| 9 | A Fortaleza dos Anões | 41–45 | existe |
| 10 | O Reino Élfico | 46–50 | revamp dos monstros (menos Warcraft, mais elfo de fantasia geral) |
| 11 | O Mar Sem Sol | 51–55 | existe |
| 12 | O Covil do Dragão | 56–60 | existe |
| 13 | O Ossário dos Titãs | 61–65 | existe |
| 14 | **A Necrópole do Rei Eterno** | 66–70 | nova |
| 15 | A Cidade dos Antigos | 71–75 | existe |
| 16 | **A Prisão dos Deuses** | 76–80 | nova |
| 17 | **O Campo da Última Guerra** | 81–85 | nova |
| 18 | O Abismo | 86–90 | existe |
| 19 | **As Ruínas dos Acendedores** | 91–95 | nova |
| 20 | A Escuridão | 96–100 | existe (Nox é o nível 100) |

A Colmeia (`js/190-199`), a Nave Caída (`js/240-249`) e os Salões do Pesadelo (`js/300-309`) saíram da geração: os arquivos continuam na pasta, fora do `index.html`, para virarem fases paralelas depois (portal ou evento).

## Os níveis

- **Nível visto:** a camada N tem monstros do 5N−4 ao 5N−1 (um nível a cada quarto da altura dela, 30% nascem um acima, nunca passando do 5N−1) e o chefe no 5N.
- **Força:** as contas de vida, dano, XP e velocidade continuam na escala de antes (`e.lvl`), para o equilíbrio das armas e da forja não mudar. `lvlPw(n)` dá a força de um nível visto (igual até o 4, depois 0,4n + 2,5) e `nvDe(força)` dá o nível visto de volta. `layerLo(id)`, `layerBossLvl(id)` e `layerLvl(lo, d)` devolvem a força.
- **O rótulo do monstro** mostra `nvDe(e.lvl)`. **O ouro** segue a regra do Jonathan pelo nível visto (nível N dá de N a 2N moedas).
- **XP do herói:** `xpNeed(l) = 10 x lvlPw(l)^1,5`. Saves de antes passam o nível do herói para a escala nova uma vez só (`js/362-revamp-camadas.js`).
- **Forja:** o nível de item do metal continua `2n − 1` pela posição.

## A corrente das camadas

Cada camada se registra em `js/129`:

- `camadaNomes(id, { on, S0, D, soils, thin, thinW, halls, boss, climb, host })` (nomes das variáveis, resolvidos na hora) diz como ela é vista pela camada de baixo. `halls` são as duas descidas `{ cx, x0, x1, fy, w, top }`.
- `camadaAcima(id)` devolve a camada de cima que existe. As APIs das camadas pegam o topo dela: `XX_S0 = A.S0 + A.D`, `XX_TOP = layerTop(id)`.
- `GEN_NOMES[id]` (no 129) já tem os nomes do topo e da altura das camadas novas: `BJ_S0/BJ_D`, `NC_S0/NC_D`, `PD_S0/PD_D`, `GU_S0/GU_D`, `AC_S0/AC_D`.

## Contrato das camadas novas: `camadaExt(id, { ... })`

Chamado na API da camada (carrega antes dos sistemas comuns). Os sistemas comuns leem `CAMADA_EXT`:

| Campo | Quem lê | O que é |
|---|---|---|
| `sala(x, y, m)` | 87, 75 | dentro da sala do chefe (com margem m) |
| `salaFn` | 353 | o nome da função global da sala do chefe (`'inBjHall'`) |
| `cor` | 353 | a cor da poeira que guia até a sala do chefe |
| `keep()` | 87 | `Set` de índices de bloco que a geração não pode mexer |
| `barreira(t)` | 87, 313 | blocos que nunca são cavados (barreira da sala, portões) |
| `subir(y)` | 87, 353 | o bloco de subir (corrente, escada) dos poços cavados nas linhas da camada; 0 fora dela |
| `corda(t)` | 87 | escadas e cordas que não caem quando o apoio some |
| `escalar` | 356 | nomes dos blocos de subir que os humanoides usam (`['BJ_ESCADA', ...]`) |
| `tp()` | 75, 339 | `{ nome, faixas: [{ nome, y0, y1 }], entrada: [x, y] }` para a tela de Testes |
| `gemas` | 117 | `{ ok(t), pal, host, soils }`: a rocha que recebe as pedras |
| `minerios` | 313 | `['XX_O_CARVAO', 'XX_O_METAL']` |
| `ambiente` + `zona0` | 97 | o cenário de som (o formato do `DEF` do 97) e a primeira zona da camada |

## Números reservados

| # | Camada | Arquivos `js/` | Blocos | Paredes | Terceira camada | Zonas | Código |
|---|---|---|---|---|---|---|---|
| 6 | O Brejo das Bruxas | 370 a 379 | 864 a 895 | 123 a 127 | 78 a 80 | 77 a 80 | `BREJO`, `BJ_` |
| 14 | A Necrópole do Rei Eterno | 380 a 389 | 896 a 927 | 128 a 132 | 81 a 83 | 81 a 84 | `NECROPOLE`, `NC_` |
| 16 | A Prisão dos Deuses | 390 a 399 | 928 a 959 | 133 a 137 | 84 a 86 | 85 a 88 | `PRISAO`, `PD_` |
| 17 | O Campo da Última Guerra | 400 a 409 | 960 a 991 | 138 a 142 | 87 a 89 | 89 a 92 | `GUERRA`, `GU_` |
| 19 | As Ruínas dos Acendedores | 410 a 419 | 992 a 1023 | 143 a 147 | 90 a 92 | 93 a 96 | `ACENDEDORES`, `AC_` |

`NT` é 1024 e `WH` é 11246 (20 camadas de 558 m).
