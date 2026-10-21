# As 20 camadas de Under Darkness

O mapa da descida: o nome, o tema, o chefe e o metal de cada camada, da primeira (As Cavernas) até a vigésima (A Escuridão). Desde o revamp de 2026-10-21 são **20 camadas de 5 níveis cada**, do nível 1 ao 100. O que mudou e por quê está em [camadas/00-revamp.md](camadas/00-revamp.md); as regras que valem para todas estão em [camadas/00-geral.md](camadas/00-geral.md); cada camada tem a sua ficha na pasta [camadas/](camadas/00-geral.md).

A ordem que vale é a do registro do jogo, `LAYERS` em `js/129-camadas.js`. Esta tabela só a repete.

---

## Os níveis

- A camada **N** tem monstros dos níveis **5N − 4 a 5N − 1** (um nível a cada quarto da altura dela; 30% nascem um acima, nunca passando do 5N − 1) e o chefe no **5N**. Nox, o último chefe, é o nível 100.
- O rótulo do monstro mostra o nível visto, `nvDe(e.lvl)`. As contas de vida, dano, XP e velocidade usam a força de antes, `e.lvl` (`lvlPw(n)`), para o equilíbrio das armas e da forja não mudar.
- Cada camada tem 558 m (o desenho de 186 m esticado `LAYER_K = 3` vezes); a camada N começa a (N − 1) × 558 m. O mundo tem 11.246 blocos de altura.

## O mapa

| # | Camada | Níveis | Tema | Chefe | Metal | Ficha |
|---|---|---|---|---|---|---|
| 1 | As Cavernas | 1–5 | terra úmida, galerias de calcita e o ninho das aranhas | A Mãe-Teia | cobre | [caverna-spec](caverna-spec.md) |
| 2 | A Catedral | 6–10 | catedral gótica soterrada, claustro e criptas | O Rei Esqueleto | ferro | [catedral-spec](catedral-spec.md) |
| 3 | As Cavernas de Gelo | 11–15 | um frio antigo que congelou tudo debaixo das criptas | O Yeti Ancestral | ouro | [gelo-spec](gelo-spec.md) |
| 4 | A Mina Abandonada | 16–20 | escoras, trilhos, goblins e fornalhas | O Rei Goblin | cobalto | [mina-spec](mina-spec.md) |
| 5 | As Minas Fúngicas | 21–25 | uma colônia tomada por um fungo antigo | A Mãe-Esporo | esporita | [05](camadas/05-minas-fungicas.md) |
| 6 | **O Brejo das Bruxas** (nova) | 26–30 | turfa, palafitas, forcas e o círculo de pedras | A Velha do Brejo | ferro-do-brejo | [06](camadas/06-brejo-bruxas.md) |
| 7 | A Cidade Afundada | 31–35 | a cidade que a terra engoliu, o culto do Poço | O Sineiro Afogado | prata | [06](camadas/06-cidade-afundada.md) |
| 8 | A Floresta Petrificada | 36–40 | floresta de granito com folhas de cristal | O Cervo de Pedra | platina | [07](camadas/07-floresta-petrificada.md) |
| 9 | A Fortaleza dos Anões | 41–45 | salões de cantaria, canais de lava, forjas de runas | O Autômato-Forja | mithril | [08](camadas/08-fortaleza-anoes.md) |
| 10 | O Reino Élfico | 46–50 | a mata de prata, os salões do rei e a Corte dos Espinhos (monstros trocados no revamp) | A Dama do Espelho | lunarita | [11](camadas/11-reino-elfico.md) |
| 11 | O Mar Sem Sol | 51–55 | mar subterrâneo, praias negras e navios encalhados | O Leviatã | oricalco | [10](camadas/10-mar-sem-sol.md) |
| 12 | O Covil do Dragão | 56–60 | um vulcão por dentro, kobolds e o Leito de Ouro | Cinzarel, o Dragão Ancião | dracônio | [11](camadas/11-covil-dragao.md) |
| 13 | O Ossário dos Titãs | 61–65 | os ossos dos titãs são o terreno | O Último Titã | adamantita | [12](camadas/12-ossario-titas.md) |
| 14 | **A Necrópole do Rei Eterno** (nova) | 66–70 | a cidade dos mortos de um reino inteiro | O Rei Eterno | sepulcrita | [14](camadas/14-necropole.md) |
| 15 | A Cidade dos Antigos | 71–75 | geometria perfeita, máquinas e a estrela caída | O Arquiteto | ferro estelar | [13](camadas/13-cidade-antigos.md) |
| 16 | **A Prisão dos Deuses** (nova) | 76–80 | correntes sobre abismos, celas de pedra viva, o Tártaro | O Lobo Atado | ferro divino | [16](camadas/16-prisao-deuses.md) |
| 17 | **O Campo da Última Guerra** (nova) | 81–85 | o campo de batalha de anjos e demônios | O General Caído | belicita | [17](camadas/17-campo-guerra.md) |
| 18 | O Abismo | 86–90 | o Inferno: cinza, rios de fogo e o trono do caos | O Príncipe do Caos | infernita | [15](camadas/15-abismo.md) |
| 19 | **As Ruínas dos Acendedores** (nova) | 91–95 | a cidade dos braseiros apagados e a Fornalha do Mundo | O Último Acendedor | ardorita | [19](camadas/19-ruinas-acendedores.md) |
| 20 | A Escuridão | 96–100 | o fundo do mundo, quase sem luz | Nox, Aquele Que Apaga | noctírio | [16](camadas/16-escuridao.md) |

O número no nome da ficha é o do planejamento antigo; vale a coluna **#**.

## Fora da campanha

A Colmeia (`js/190` a `199`), A Nave Caída (`js/240` a `249`) e Os Salões do Pesadelo (`js/300` a `309`) saíram da geração no revamp. Os arquivos continuam na pasta, fora do `index.html`, para virarem fases paralelas depois (portal ou evento). As fichas ficam como estavam: [09-colmeia](camadas/09-colmeia.md), [10-nave-caida](camadas/10-nave-caida.md), [14-saloes-pesadelo](camadas/14-saloes-pesadelo.md).

## Ainda em aberto

- **O caminho de volta.** Com 20 camadas, o teleporte do vilarejo precisa de uma parada por camada ou por grupo de camadas.
