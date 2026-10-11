'use strict';

/* ================= ofícios: as árvores de talentos de Ferraria, Culinária, Encantamento e Alquimia (OFICIOS, 330-oficios-dados) ================= */
(() => {
  const E = UDW.esc;
  const ic = s => { const [k, ref] = s.ic.split(':'); return k === 'i' && ITEMS[ref] ? UDW.icon(ref, 26) + ' ' : ''; };
  UDW.pages.oficios = {
    render() {
      let h = UDW.head('Ofícios', 'Árvores de talentos no estilo do Diablo 2 para quem cria coisas. Usar a forja, a cozinha, o encantador ou o alambique dá experiência naquele ofício; cada nível do ofício dá 1 ponto para a árvore dele, que fica numa aba "Talentos" na janela de criação. Clique esquerdo põe um ponto, clique direito tira.');
      h += `<h2>Como sobe</h2><ul>
        <li><b>Ferraria</b> (forja do Grimaldo): cada barra fundida dá 2 + o tier do metal; cada peça forjada dá 5 + 2 × o tier; gravar uma runa dá 6; cada receita do Criar do inventário dá 1.</li>
        <li><b>Culinária</b> (cozinha do Odo): cada prato na brasa dá 4, no caldeirão dá 7.</li>
        <li><b>Encantamento</b> (oficina do Teodoro): cada encanto dá 5 + 4 × a posição da pedra (topázio 5, esmeralda 9, safira 13, cristal 17, rubi 21).</li>
        <li><b>Alquimia</b> (alambique da Marta): cada frasco preparado dá o tempo da receita + 1 (poção de vida 3, elixires da Mina 7); cada erva colhida dá 1 + metade da camada dela (sanguinária e lírio 1, losna e flor-de-geada 2, raiz-de-brasa 3).</li>
      </ul><p>Nível máximo ${OF_MAX_LVL}. Cada linha da árvore pede um nível do ofício: ${OF_ROW_LVL.map((l, i) => `linha ${i + 1}: ${l}`).join(', ')}. Um talento só aceita ponto quando os que apontam para ele (as setas) já têm pelo menos 1.</p>`;
      h += `<h2>Experiência por nível</h2>` + UDW.table([{ t: 'Nível', cls: 'n' }, { t: 'XP para o próximo', cls: 'n' }, { t: 'XP total', cls: 'n' }],
        (() => { let acc = 0; const out = []; for (let l = 1; l < OF_MAX_LVL; l++) { acc += ofNeed(l); if (l <= 5 || l % 5 === 0 || l === OF_MAX_LVL - 1) out.push({ cells: [l + ' → ' + (l + 1), ofNeed(l), acc], keys: [l, ofNeed(l), acc] }); } return out; })());
      for (const p in OFICIOS) {
        const O = OFICIOS[p];
        h += `<h2>${E(O.name)} <small>(${E(O.npc)})</small></h2>`;
        for (const T of O.tabs) {
          h += `<h3>${E(T.name)}</h3>` + UDW.table([{ t: 'Talento' }, { t: 'Linha', cls: 'n' }, { t: 'Nível', cls: 'n' }, { t: 'Pontos', cls: 'n' }, { t: 'Pede' }, { t: 'No primeiro ponto' }, { t: 'No máximo' }],
            T.sk.map(s => ({ cells: [`${ic(s)}${E(s.n)}`, s.r + 1, OF_ROW_LVL[s.r], s.max, s.req.map(q => E(OF_SK[q].n)).join(', ') || '—', E(ofTxt(s, 1)), s.max > 1 ? E(ofTxt(s, s.max)) : '—'], keys: [s.n, s.r, OF_ROW_LVL[s.r], s.max, s.req.length, '', ''] })));
        }
      }
      return h;
    }
  };
})();
