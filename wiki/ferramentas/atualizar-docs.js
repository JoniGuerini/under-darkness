// Refaz wiki/js/docs.js com o texto atual dos documentos do jogo. Uso (na pasta do jogo): node wiki/ferramentas/atualizar-docs.js
const fs = require('fs'), path = require('path');
const g = path.join(__dirname, '..', '..');
const list = [['biomas', 'Biomas', 'docs/biomas.md'], ['regras-de-bioma', 'Regras de geração de bioma', 'docs/regras-de-bioma.md'], ['catedral-spec', 'Especificação da catedral', 'docs/catedral-spec.md'],
  ['caverna-spec', 'Especificação das cavernas', 'docs/caverna-spec.md'], ['gelo-spec', 'Especificação do gelo', 'docs/gelo-spec.md'], ['mina-spec', 'Especificação da mina', 'docs/mina-spec.md'], ['abismo-spec', 'Especificação do Abismo', 'docs/abismo-spec.md'], ['camadas', 'As 16 camadas', 'docs/camadas.md'], ['leia-me', 'Como o código está organizado', 'LEIA-ME.md']];
let out = "'use strict';\n\n/* Cópia dos documentos da pasta do jogo (docs/ e LEIA-ME.md) para a wiki mostrar.\n   O navegador não deixa uma página aberta com dois cliques ler outros arquivos sozinha, por isso o texto fica aqui.\n   Copiado em " + new Date().toISOString().slice(0, 10) + ". Para atualizar: node wiki/ferramentas/atualizar-docs.js */\nconst UDW_DOCS = [\n";
for (const [id, t, f] of list) { const p = path.join(g, f); if (fs.existsSync(p)) out += `  { id: ${JSON.stringify(id)}, titulo: ${JSON.stringify(t)}, arquivo: ${JSON.stringify(f)}, texto: ${JSON.stringify(fs.readFileSync(p, 'utf8'))} },\n`; }
fs.writeFileSync(path.join(g, 'wiki', 'js', 'docs.js'), out + '];\n');
console.log('wiki/js/docs.js atualizado');
