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

## Ordem da geração

1. Rocha base do bioma.
2. Salas e corredores.
3. Ligações entre andares (escadas e poços com corrente).
4. Estragos (escombros, buracos na abóbada).
5. Minérios.
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
