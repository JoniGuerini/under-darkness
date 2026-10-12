'use strict';

/* ================= talentos: a árvore do personagem (P), dados em 344-talentos-dados ================= */
(() => {
  const E = UDW.esc;
  const fx = l => l.map(f => `<span${f[1] < 0 ? ' style="color:#ff8a7a"' : ''}>${E(arvFxLine(f))}</span>`).join('<br>');
  UDW.pages.talentos = {
    render() {
      const cnt = t => ARV_LIST.filter(n => n.t === t).length;
      let h = UDW.head('Talentos', 'A árvore do personagem, inspirada no Path of Exile. Abre com P e cobre a tela inteira; arraste para mover e use a rodinha para o zoom. Não há classes: a árvore tem uma região para cada estilo de jogo, todas saindo do mesmo início.');
      h += `<h2>Como funciona</h2><ul>
        <li>Cada nível do personagem dá 1 ponto. Subir de nível não dá mais nada além disso.</li>
        <li>Clique esquerdo liga o caminho mais curto até o nó, gastando 1 ponto por nó. Clique direito devolve um nó, desde que o resto continue ligado ao início. "Recomeçar" devolve tudo.</li>
        <li>Os bônus são porcentagens da base do atributo (+10% de vida é 10% da vida máxima), nunca valores fixos.</li>
        <li>As resistências da árvore somam até 75%.</li>
        <li>${ARV_LIST.length} nós: ${cnt('s')} talentos, ${cnt('n')} notáveis, ${cnt('k')} keystones e o início. ${ARV_EDGES.length} ligações.</li>
        <li>Cada região tem 1 caminho central até a keystone e 2 galhos laterais com um notável na ponta. Pontes ligam as regiões vizinhas perto do centro (${E(ARV_PONTE_IN.map(arvFxLine).join(', '))}) e por fora (${E(ARV_PONTE_FORA.map(arvFxLine).join(', '))}).</li>
        <li>Saves anteriores a esta árvore recebem todos os pontos de volta.</li>
      </ul>`;
      h += `<h2>Regiões</h2>` + UDW.table([{ t: 'Região' }, { t: 'Talentos do caminho' }, { t: 'Notáveis' }, { t: 'Keystone' }],
        ARV_REG.map(G => ({
          cells: [`<b style="color:${G.col.Y}">${E(G.name)}</b>`,
            `${fx(G.P)} <small>(×5)</small><br>${fx(G.A)} <small>(×3)</small><br>${fx(G.B)} <small>(×3)</small>`,
            [G.L, G.M, G.R].map(n => `<b>${E(n[0])}</b><br>${fx(n[1])}`).join('<br><br>'),
            `<b>${E(G.K[0])}</b><br>${fx(G.K[1])}`],
          keys: [G.name, '', '', G.K[0]]
        })));
      return h;
    }
  };
})();
