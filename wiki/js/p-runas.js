'use strict';

/* ================= runas: as 15 árvores do tabuleiro da Aurélia (RUNE_BOARDS, montadas em 340-runas-dados e 420-422) ================= */
(() => {
  const E = UDW.esc;
  const EL = { raio: 'Raio', gelo: 'Gelo', fogo: 'Fogo' };
  const TH = { forca: 'Força', elem: 'Elemento', sust: 'Sustento', caca: 'Caça' };
  const ORD = { 0: 0, 1: 1, forca: 2, elem: 3, sust: 4, caca: 5 };
  const branch = q => q.own ? q.br : q.th;
  // os nós na ordem da árvore: cada galho a partir da raiz, cada filho logo depois do pai (com recuo pela profundidade)
  function tree(B) {
    const kids = {}; for (const q of B.nodes) (kids[q.parent || '#'] = kids[q.parent || '#'] || []).push(q);
    const out = [], walk = (q, d) => { out.push([q, d]); for (const c of kids[q.k] || []) walk(c, d + 1); };
    for (const q of (kids['#'] || []).slice().sort((a, b) => ORD[branch(a)] - ORD[branch(b)])) walk(q, 0);
    return out;
  }
  UDW.pages.runas = {
    render() {
      const ids = Object.keys(RUNE_BOARDS);
      let h = UDW.head('Runas', 'O tabuleiro de runas fica na torre da Aurélia. Cada um dos 15 feitiços tem a sua árvore de 50 nós: a runa vai no encaixe do centro e a árvore se abre em volta dela.');
      h += `<h2>Como funciona</h2><ul>
        <li>Cada inimigo que o feitiço acerta dá 1 de experiência à runa dele. Do nível L para o L+1 a runa pede 8 + 2 × L (${RUNE_XP(1)} no nível 1, ${RUNE_XP(10)} no nível 10, ${RUNE_XP(40)} no nível 40).</li>
        <li>Cada nível dá 1 ponto. A runa para de subir quando já tem os pontos para encher a árvore toda.</li>
        <li>Um nó só aceita ponto depois que o nó de onde ele sai tem pelo menos 1. Um nó pode ter vários pontos, mas cada nó tem um efeito só dele.</li>
        <li>Seis galhos saem do encaixe. Dois são do próprio feitiço, com o que só ele faz (mais saltos, mais bolas, a nevasca que segue o herói...). Os outros quatro são comuns e ficam só com os nós que fazem sentido para cada feitiço: <b>Força</b> (dano, crítico, chefes), <b>Elemento</b> (o que o raio, o gelo ou o fogo fazem a mais), <b>Sustento</b> (mana, vida, recarga, eco) e <b>Caça</b> (bônus por situação).</li>
        <li>A Aurélia devolve os pontos de uma runa quando você quiser recomeçar.</li>
        <li>Menu &gt; Testes, aba Outros, dá +5 pontos a todas as runas ou põe as 15 no máximo, com todos os nós cheios.</li>
      </ul>`;
      for (const el of ['raio', 'gelo', 'fogo']) {
        h += `<h2 style="color:${RUNE_COL[el].O}">${EL[el]}</h2>`;
        for (const id of ids.filter(i => RUNE_BOARDS[i].elem === el)) {
          const B = RUNE_BOARDS[id], own = B.nodes.filter(q => q.own).length;
          h += `<details id="rn-${id}"><summary>${UDW.icon(id, 22)} ${E(ITEMS[id].name)} <small>${B.nodes.length} nós (${own} só dele), ${B.maxLvl} pontos para completar</small></summary>` +
            UDW.table([{ t: 'Nó' }, { t: 'Galho' }, { t: 'Pontos', cls: 'n' }, { t: 'Sai de' }, { t: 'No máximo' }],
              tree(B).map(([q, d], i) => ({
                cells: [`<span style="padding-left:${d * 12}px">${E(q.name)}</span>`, q.own ? '<b>do feitiço</b>' : TH[q.th], q.max, q.parent ? E(B.byK[q.parent].name) : 'a runa', E(q.val(q.max))],
                keys: [i, ORD[branch(q)], q.max, q.parent ? B.byK[q.parent].name : '', q.val(q.max)]
              }))) + '</details>';
        }
      }
      return h;
    },
    after(root, focus) { const d = focus && $('rn-' + focus); if (d) { d.open = true; setTimeout(() => d.scrollIntoView(), 30); } }
  };
})();
