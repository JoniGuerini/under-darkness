# Wiki de Under Darkness

Abra `index.html` com dois cliques. Não precisa de servidor nem de internet (sem internet só as fontes mudam).

A wiki **não tem uma cópia dos números do jogo**: ela carrega os próprios arquivos de `../js/` (itens, modificadores, monstros, moradores, catedral, forja) e monta as páginas a partir deles. Os ícones, sprites de monstros, moradores, casas, objetos e texturas de bloco são desenhados pelas mesmas funções do jogo. Mudou o jogo, recarregue a wiki.

A wiki só lê: ela não deixa o código do jogo ouvir o teclado e nunca grava o save (`js/00-guarda.js` e o começo do `js/app.js`).

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | a página e a lista de scripts: primeiro a guarda, depois os arquivos do jogo (mesma ordem do `index.html` do jogo, sem HUD, menus, música e o loop), depois a wiki |
| `wiki.css` | o visual (cores, fontes e molduras do jogo) |
| `js/base.js` | desenhos, dica de item (a mesma do jogo), markdown, tabelas que ordenam |
| `js/app.js` | prepara os desenhos, monta o menu e troca de página pelo endereço (`#/itens`, `#/item/espada_ferro`...) |
| `js/p-*.js` | uma página cada: início e busca, itens, modificadores, raridades e lendários, forja, inimigos e chefes, moradores, biomas, regras, documentos |
| `js/textos.js` | o que o código não diz em palavras: papel de cada monstro, fases do Rei, o que cada morador faz, faixas e minérios da catedral |
| `js/docs.js` | cópia dos documentos `docs/*.md` e do `LEIA-ME.md` do jogo |
| `ferramentas/atualizar-docs.js` | refaz o `js/docs.js` a partir da pasta `docs/` (roda com Node: `node wiki/ferramentas/atualizar-docs.js`) |

## Quando mexer na wiki

- **Arquivo novo no jogo com dados** (itens, monstros, um bioma novo): acrescente o `<script src="../js/...">` no `index.html`, na mesma posição relativa do `index.html` do jogo. Arquivos de interface (HUD, menus, música, título) ficam de fora.
- **Monstro, morador ou faixa nova**: escreva a descrição em `js/textos.js` (os números aparecem sozinhos).
- **Documento novo ou alterado em `docs/`**: refaça o `js/docs.js` (o navegador não deixa uma página aberta com dois cliques ler outros arquivos sozinha, por isso o texto é copiado).
- Se uma página quebrar porque o jogo mudou, ela mostra o motivo e as outras continuam funcionando.
