'use strict';

/* ================= a forja do Grimaldo: fornalha (FURN, 18-forja) e bigorna (RECIPES, 05-itens) ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  UDW.pages.forja = {
    render() {
      let h = UDW.head('Forja', 'Na cabana do Grimaldo: a fornalha funde minério em barras e a bigorna transforma barras em equipamento. A fornalha continua trabalhando com a janela fechada. Os materiais contam o que está na mochila e no baú do vilarejo; ao forjar, sai primeiro da mochila e depois do baú.');
      h += `<h2>Fornalha</h2>` + UDW.table([{ t: 'Minério' }, { t: 'Quantidade', cls: 'n' }, { t: 'Combustível' }, { t: 'Resultado' }, { t: 'Tempo', cls: 'n' }],
        Object.keys(FURN).map(id => ({ cells: [UDW.item(id), FURN[id].n, UDW.item('carvao', { n: 1 }), UDW.item(FURN[id].bar), N(FURN[id].t, 1) + ' s'], keys: [ITEMS[id].name, FURN[id].n, '', ITEMS[FURN[id].bar].name, FURN[id].t] })));
      h += `<h2>Bigorna <small>${RECIPES.length} receitas</small></h2><p class="nota">Cada peça sai branca (Comum), só com os números da base. Os modificadores vêm do <a href="#/npcs/encantador">encantador</a>, com uma pedra preciosa. Tempo de martelo: ${N(anvilTime({ metal: 0 }), 1)} s no cobre até ${N(anvilTime({ metal: METALS.length - 1 }), 1)} s em ${METALS[METALS.length - 1].name.toLowerCase()}.</p>`;
      h += `<div class="tw"><table class="grade forja"><thead><tr><th>Peça</th>${METALS.map(M => `<th>${UDW.item(M.bar)}</th>`).join('')}</tr></thead><tbody>`;
      for (const [pc, nome, , bars] of FORGE_PIECES) {
        h += `<tr><td><b>${E(nome)}</b><small>${bars} barras</small></td>`;
        for (const M of METALS) {
          const id = `f_${pc}_${M.id}`; if (!ITEMS[id]) { h += '<td></td>'; continue; }
          const n = UDW.baseNums(id), it = ITEMS[id];
          const num = it.slot === 'weapon' ? `${n.min}–${n.max} · ${N(n.dps, 1)} DPS` : [n.def ? `${n.def} def` : '', ...n.fx].filter(Boolean).join(' · ');
          h += `<td><a class="rec" href="#/item/${id}" data-item="${id}">${UDW.icon(id, 34)}<span>${num}</span><em>nível ${n.L}</em></a></td>`;
        }
        h += '</tr>';
      }
      return h + '</tbody></table></div>';
    }
  };
})();
