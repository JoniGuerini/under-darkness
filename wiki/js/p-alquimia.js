'use strict';

/* ================= a alquimia da Marta: ervas (HERBS), poções e elixires (ALQ, ALQ_RECIPES) — js/94-alquimia-dados.js ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  const CAMADA = ['Superfície (no capim, fora do vilarejo)', 'Cavernas', 'Catedral', 'Cavernas de Gelo', 'Mina Abandonada'];
  const efeito = id => { const a = ALQ[id]; return a.kind === 'life' ? `+${a.heal} de vida em 5 s` : a.kind === 'mana' ? `+${a.mana} de mana em 2 s` : `${a.fx} por ${Math.round(a.t / 60)} minutos`; };
  UDW.pages.alquimia = {
    render() {
      let h = UDW.head('Alquimia', 'Na casa da Marta, a alquimista: o alambique transforma ervas, materiais de monstro e um frasco de vidro em poções e elixires. Os ingredientes saem da mochila e do baú do vilarejo. A Marta vende frascos na botica dela.');
      h += `<h2>Ervas <small>${HERBS.length}</small></h2><p class="nota">Cada camada tem a sua erva. Colhe com a picareta (um golpe) ou com E perto dela; às vezes vêm duas. Colhida, volta a nascer no mesmo lugar depois de alguns minutos, longe da vista do herói.</p>`;
      h += UDW.table([{ t: 'Erva' }, { t: 'Onde nasce' }, { t: 'Quantas no mundo', cls: 'n' }, { t: 'Usada em' }],
        HERBS.map((q, L) => ({ cells: [UDW.item(q.id), CAMADA[q.camada], Math.round(HERB_N[L] * (typeof WSC !== 'undefined' ? WSC : 1)), ALQ_RECIPES.filter(rc => rc.r.some(([id]) => id === q.id)).map(rc => UDW.item(rc.id, { px: 22 })).join(' ')], keys: [ITEMS[q.id].name, q.camada, HERB_N[L], ''] })));
      for (const [g, nome] of ALQ_GROUPS) {
        const rs = ALQ_RECIPES.filter(rc => rc.g === g);
        h += `<h2>${E(nome)} <small>${rs.length} receitas</small></h2>`;
        h += UDW.table([{ t: 'Resultado' }, { t: 'Efeito' }, { t: 'Ingredientes' }, { t: 'Tempo', cls: 'n' }],
          rs.map(rc => ({ cells: [UDW.item(rc.id), efeito(rc.id), rc.r.map(([id, n]) => UDW.item(id, { n, px: 22 })).join(' '), N(rc.t, 0) + ' s'], keys: [ITEMS[rc.id].name, '', '', rc.t] })));
      }
      h += `<h2>Regras</h2><ul class="regras">
        <li>Beber: clique esquerdo com o frasco na barra, ou botão direito nele no inventário. R bebe a poção de vida que cobre o que falta (a menor que cura tudo, senão a maior que houver).</li>
        <li>Poção de vida cura aos poucos em 5 s; beber outra soma ao que ainda está entrando. Poção de mana devolve em 2 s.</li>
        <li>Elixir dura 5 minutos de jogo. O mesmo elixir de novo renova o tempo; elixires diferentes valem juntos. Os ativos aparecem com o tempo debaixo do quadro do canto de cima. Morrer acaba com todos.</li>
        <li>Cada elixir vem de um bicho e faz o que combina com ele: a carne podre do zumbi dá resistência a veneno, a essência do espírito da nevasca resiste ao frio, o óleo do lampião ao fogo, e assim por diante. Resistência corta o dano daquele tipo pela metade.</li>
        <li>Dano de veneno: vômito do zumbi, aranhas, centopeias, sapos e a nuvem do fungo. Dano de frio: estilhaços e ondas de gelo, o espírito, o sincelo, a sentinela, o wendigo e os ataques gelados do Yeti Ancestral. Dano de fogo: bolas de fogo, caveiras, diabretes, cães infernais, lampiões, grisu e dinamite.</li>
        <li>Não existe volta de vida sozinha: só o Elixir da Gosma e peças com regeneração devolvem vida com o tempo (depois de 4 s sem levar dano).</li>
      </ul>`;
      return h;
    }
  };
})();
