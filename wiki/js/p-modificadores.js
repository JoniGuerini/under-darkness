'use strict';

/* ================= modificadores (AFFIXES do 48-itemizacao) ================= */
(() => {
  const E = UDW.esc;
  // a faixa de valores que um modificador pode rolar num nível de item: roda o próprio rollAffix do jogo com o sorteio no mínimo e no máximo
  UDW.affixRange = (a, L) => {
    const R = Math.random;
    try { Math.random = () => 0; const lo = rollAffix(a, L); Math.random = () => 0.999999; const hi = rollAffix(a, L); return [lo, hi]; }
    finally { Math.random = R; }
  };
  const fmt = (sd, v) => { const d = sd.dec === 2 ? 2 : sd.pct || sd.per5 || sd.dec ? 1 : 0; return UDW.num(v, d).replace(/,0+$/, ''); };
  UDW.affixText = (a, L) => {
    const [lo, hi] = UDW.affixRange(a, L); let i = 1;
    return a.lines.map(([st, ...specs]) => {
      const sd = STAT_DEF[st]; if (sd.flag) return E(sd.t);
      const vals = specs.map(() => { const x = lo[i], y = hi[i]; i++; return x === y ? fmt(sd, x) : `${fmt(sd, x)}–${fmt(sd, y)}`; });
      if (sd.t0 && lo[1] === 0 && hi[1] === 0) return E(sd.t0.replace('Y', vals[1]));
      let k = 0; return E(sd.t.replace(/X|Y/g, () => vals[k++]));
    }).join('<br>');
  };
  UDW.affixName = a => Array.isArray(a.name) ? a.name[0] + (a.g ? ` / ${a.g[0]}` : '') : a.name;
  const SLOTN = { weapon: 'arma', shield: 'escudo', head: 'cabeça', body: 'corpo', feet: 'pés', acc: 'acessório', tool: 'picareta', magic: 'cajado, varinha e tomo' };
  const TIER = ['', 'Incomum', 'Raro', 'Épico', 'Lendário'];

  let curL = 5;
  function rows(L, hl) {
    return [1, 2, 3, 4].map(t => {
      const list = AFFIXES.filter(a => a.tier === t);
      const tot = TIER_WEIGHT.reduce((n, w) => n + w, 0);
      return `<h2 style="color:${RAR_COL[t]}">${TIER[t]} <small>${list.length} modificadores${t < 4 ? '' : ', sempre sufixo'}</small></h2>`
        + UDW.table([{ t: 'Nome' }, { t: 'Posição' }, { t: 'Efeito', nosort: true }, { t: 'Onde aparece' }], list.map(a => ({
          attr: ` id="m-${a.id}" class="${a.id === hl ? 'hl' : ''}"`,
          cells: [`<b style="color:${RAR_COL[t]}">${E(UDW.affixName(a))}</b>${a.flavor ? `<p class="flavor">"${E(a.flavor)}"</p>` : ''}`, a.kind === 'p' ? 'Prefixo' : 'Sufixo',
            `<span class="fxs">${UDW.affixText(a, L)}</span>`, [...a.where].map(s => SLOTN[s]).join(', ')],
          keys: [UDW.affixName(a), a.kind, '', [...a.where].join()]
        })), 'mods');
    }).join('');
  }
  UDW.pages.modificadores = {
    render(hl) {
      return UDW.head('Modificadores', 'Prefixos e sufixos que o jogo sorteia por cima das bases. A raridade do item é a do seu modificador mais forte. Os números crescem com o nível do item e variam 15% para cima ou para baixo a cada sorteio.')
        + `<div class="barra"><label>Nível do item <input id="mL" type="range" min="1" max="12" value="${curL}"><b id="mLv">${curL}</b></label>
           <span class="leg">Peso de cada raridade quando sorteia: ${[1, 2, 3, 4].map(t => `<span style="color:${RAR_COL[t]}">${TIER[t]} ${TIER_WEIGHT[t]}</span>`).join(' · ')}</span></div>`
        + `<div id="mRows">${rows(curL, hl)}</div>`;
    },
    after(root, hl) {
      const r = $('mL'); r.addEventListener('input', () => { curL = +r.value; $('mLv').textContent = curL; $('mRows').innerHTML = rows(curL, hl); });
      if (hl && $('m-' + hl)) setTimeout(() => $('m-' + hl).scrollIntoView({ block: 'center' }), 30);
    }
  };
})();
