'use strict';

/* ================= a cozinha do Odo: receitas (COZINHA, 98-cozinha-dados) e quem deixa cair os ingredientes ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  UDW.pages.cozinha = {
    render() {
      let h = UDW.head('Cozinha', 'Na taverna do Odo: ele cozinha os ingredientes que caem dos bichos do subterrâneo. Os ingredientes contam o que está na mochila e no baú do vilarejo. Sair da janela devolve os ingredientes do prato que estava no fogo. Assar uma coisa crua é 1 para 1, e todo prato gasta combustível: madeira ou carvão.');
      h += `<h2>Receitas</h2>` + UDW.table([{ t: 'Prato' }, { t: 'Ingredientes' }, { t: 'No fogo', cls: 'n' }, { t: 'Comer', cls: 'n' }, { t: 'Vida', cls: 'n' }, { t: 'Mana', cls: 'n' }, { t: 'Ao longo de', cls: 'n' }],
        COZINHA.flatMap(G => G.items.map(r => { const F = ITEMS[r.id].food; return {
          cells: [UDW.item(r.id), r.need.map(([id, n]) => UDW.item(id, { n })).join(' ') + (r.fuel ? ` ${UDW.item(CK_FUEL[0], { n: r.fuel })} ou ${UDW.item(CK_FUEL[1], { n: r.fuel })}` : ''), N(r.t, 1) + ' s', N(F.eat, 1) + ' s', F.hp, F.mp || '—', N(F.t, 1) + ' s'],
          keys: [ITEMS[r.id].name, r.need.length, r.t, F.eat, F.hp, F.mp, F.t] }; })));
      h += `<p class="nota">Comer: com o prato na barra, clique esquerdo; ou botão direito nele no inventário. O herói fica parado levando a comida à boca. Andar, pular, golpear, escudo ou levar dano interrompem, e o prato não é gasto. Depois de comer, a vida e a mana voltam aos poucos; um prato novo toma o lugar do anterior.</p>`;
      const ing = [...new Set(COZINHA.flatMap(G => G.items.flatMap(r => r.need.map(q => q[0]))))];
      h += `<h2>Ingredientes</h2>` + UDW.table([{ t: 'Ingrediente' }, { t: 'Cai de' }],
        ing.map(id => {
          const who = Object.keys(DROPS).filter(t => ET[t] && DROPS[t].some(r => r[0] === id));
          return { cells: [UDW.item(id), who.map(t => { const r = DROPS[t].find(q => q[0] === id); return `<a href="#/inimigo/${t}">${E(ET[t].name)}</a> (${UDW.pct(UDW.dropRate(t, r), 1)})`; }).join(', ')], keys: [ITEMS[id].name, who.length] };
        }));
      return h;
    }
  };
})();
