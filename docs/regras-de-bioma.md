# Regras de geração de bioma

Aprendizados da catedral (2026-10-08) para usar em todo bioma novo. Cada regra veio de um problema que o Jonathan viu jogando.

## Objetos (props)

Todo objeto tem uma **regra de apoio** declarada. Nunca deixar o posicionamento decidir sozinho pelo tamanho do sprite.

| Apoio | Onde fica | Exemplos na catedral |
|---|---|---|
| `chao` | O pé encosta no chão onde o jogador anda. Todo bloco embaixo dele é sólido. | banco, altar, estátua, sarcófago |
| `fundo` + `chao` | Fica na parede de fundo, mas o pé fica no chão. | órgão, arco em relevo, nichos de túmulo, cruz torta |
| `janela` | Fica na parede de fundo, numa fileira da sala. | vitral, rosácea |
| `fundo` (olho) | Fica na parede de fundo, de 1 a 2 blocos acima do chão. | tocheiro, quadro, brasão, afresco |
| `teto` | Fica pendurado num bloco sólido do teto, com espaço livre embaixo. | lustre, estandarte, gaiola |

- **Objeto de chão:** só vai em chão de verdade da sala, nunca sobre poço, buraco, corrente ou grade.
- **Janelas:**
  - Todas as janelas da sala ficam na **mesma altura**, logo abaixo do ponto mais baixo da abóbada.
  - Ficam **espaçadas por igual**, com pelo menos 2 blocos entre elas e sem sobrepor.
  - Se a sala tiver rosácea, ela vai no centro.
  - A sala usa uma variante só de vitral.
- **Parede de fundo:** dois objetos de fundo nunca se sobrepõem, e a janela reserva 1 bloco livre de cada lado.
- **Suporte:** todo objeto guarda os blocos que o sustentam. Se o jogador quebrar um deles, o objeto cai, e isso fica salvo.

## Blocos estruturais

- **Colunas e pilastras:** vão sempre do chão ao teto. Depois de cavar salas, passagens e poços, a geração estica cada coluna até tocar os dois lados ou a remove. Quebrar o chão, o teto ou um pedaço da coluna derruba a coluna inteira.
- **Ilhas soltas:** depois de cavar, todo pedaço de rocha com menos de 24 blocos que não encosta em nada sai. Bolsões de ar minúsculos são fechados.
- **Forro (musgo, calcita, teia):** só na parede e no teto da gruta, nunca no chão onde o jogador anda.
- **Decoração de 1 bloco em corrente** (raízes, estalactites, estalagmites empilhadas): quebrar o bloco que segura derruba a corrente inteira.
- **Teto irregular:** o que pendura (objeto de teto, chefe no fio) procura o ponto mais baixo do teto acima dele e guarda os blocos desse ponto como apoio.
- **Árvores:** só ficam em terra ou grama. Se a estrutura do bioma trocar o chão embaixo de uma árvore, a árvore sai inteira, tronco e copa.

## Entrada do bioma

- A entrada precisa estar **aberta** para quem vem andando do vilarejo. Nenhum bloco sólido pode fechar a passagem.
- Os pilares do lado de onde o jogador chega são decoração, que dá para atravessar.
- Nada da superfície (árvore, folhas) pode ficar por cima do portal.

## Passagem entre camadas

Aprendido nas cavernas (2026-10-08):

- A camada de cima vai **perdendo** o seu material aos poucos e a de baixo vai **aparecendo** aos poucos, por ruído, numa faixa de transição (nas cavernas, as Fundações Soterradas: rocha que vira calcário, pedra lavrada caída, arcos enterrados).
- A entrada da camada de cima (o portal de pedra) também se desfaz: a cantaria vira terra ao descer.
- Cada camada tem pelo menos duas saídas para a de baixo, longe uma da outra, e todas são alcançáveis a partir da entrada.
- Os monstros de uma camada não aparecem na outra.

Aprendido no gelo (2026-10-09):

- Cada descida tem que dar para **subir de volta pulando**: degraus a cada 3 fileiras no máximo (o pulo do herói sobe 3 blocos), começando do chão da gruta de baixo até a sala de cima. Conferir com uma busca que simula o pulo, não só com o preenchimento de espaço vazio: o preenchimento diz que está aberto, não que dá para subir.
- O chão debaixo dos degraus e o chão da gruta de baixo ficam protegidos dos túneis e da decoração, senão um túnel de ligação come o chão e o herói cai direto.
- Bloco que muda o controle do herói (gelo que escorrega) nunca fica nos degraus de subida nem no chão da sala do chefe.

## Monstros

Regra do Jonathan (2026-10-09), fixa:

- Toda camada tem **exatamente 10 monstros** próprios, sem contar o chefe. Variante de outro bicho (a gosma gelada) conta como um dos 10 da camada onde aparece.
- Cada faixa usa de 4 a 6 deles, e todos os 10 aparecem em pelo menos uma faixa.
- Os 10 se dividem entre jeitos diferentes de lutar: corpo a corpo, à distância, voador, emboscada (parede, teto ou enterrado), pesado (lento e forte) e enxame. Monstro novo não repete o comportamento de outro da mesma camada.

## Ordem da geração

1. Rocha base do bioma.
2. Salas e corredores.
3. Ligações entre andares (escadas e poços com corrente).
4. Estragos (escombros, buracos na abóbada).
5. Minérios: carvão e um único metal por camada, na ordem da forja (cobre, ferro, ouro, cobalto, infernita; o cristal é pedra preciosa, não metal; ver `js/102-minerios-camada.js` e `js/110-infernita.js`). Camada nova abaixo do Abismo traz um metal novo.
6. Garantir que tudo é alcançável a partir da entrada.
7. Decoração de 1 bloco.
8. Correção estrutural (colunas, árvores).
9. Objetos grandes, por último, já com o terreno final.

## Teste antes de entregar

Rodar pelo menos 8 sementes e conferir por código:

- nenhuma coluna solta;
- nenhum objeto de chão sem chão embaixo;
- nenhum objeto de teto sem teto em cima;
- todas as janelas da mesma sala na mesma altura e sem se encostar;
- todas as salas alcançáveis a partir da entrada;
- as descidas sobem de volta com o pulo do herói;
- nenhuma árvore sobre pedra.

## Largura do mundo

Desde 2026-10-09 o mundo tem 900 blocos de largura (`WW`), três vezes os 300 de antes. `WSC` (em `js/01-base.js`) diz quantas vezes ele é mais largo que o original.

- Tudo que existe "por mundo" multiplica por `WSC`: salas, câmaras, galerias, poços, túneis entre faixas, veios de minério, baús, tentativas e passes de alcance.
- O que é único continua único: a sala do chefe e as duas descidas de cada camada.
- Ruído que dá a volta no mundo (`depthNz`) já corrige sozinho; o tamanho dos detalhes não muda.
- Laços que comparam todos com todos (O(n²) ou pior) ficam três vezes mais caros ou piores: evite.
- No fim da geração, o `js/87-mundo-largo.js` liga ao vilarejo qualquer bolsão aberto de 30 blocos ou mais que ficou isolado (passagem e poço com corrente ou escada).

