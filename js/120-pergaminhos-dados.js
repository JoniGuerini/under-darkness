'use strict';

/* ================= pergaminhos de escola: os dados =================
   Pedido do Jonathan: o herói começa sem feitiço nenhum. A Aurélia (js/91-maga.js) vende um pergaminho lacrado por
   escola; ela mesma abre o lacre (js/121-pergaminhos.js) e sai um feitiço sorteado daquela escola, já pronto na barra,
   entre os que o herói ainda não conhece. Por enquanto esses pergaminhos só vêm da loja dela: nada derruba.
   Escolas: Fogo, Raio e Gelo, cinco feitiços cada (a Forma de Morcego e a escola de Metamorfose saíram em 2026-10-22).
   Os pergaminhos de um feitiço só (perg_selado_*, perg_*) continuam existindo para saves antigos, mas ninguém mais vende.
   Carrega depois de 114-escolas-dados (precisa de FOGO_LIST, ESC_SCHOOL e SCROLL_ROWS); a wiki também. */

// k: a escola (chave de SPELL_ELEM) · scroll: o item lacrado · price: preço na Aurélia · spells: tudo o que pode sair dele
const SCHOOLS = [
  { k: 'fogo', scroll: 'perg_escola_fogo', price: 100, spells: FOGO_LIST.map(([k]) => 'feitico_' + k),
    desc: 'Um rolo lacrado com cera cor de brasa. O papel está morno, e a borda já chamuscou uma vez.' },
  { k: 'raio', scroll: 'perg_escola_raio', price: 100, spells: ESC_SCHOOL.raio.slice(),
    desc: 'Um rolo lacrado com cera azul. Dá um estalo baixinho quando você aperta.' },
  { k: 'gelo', scroll: 'perg_escola_gelo', price: 100, spells: ESC_SCHOOL.gelo.slice(),
    desc: 'Um rolo lacrado com cera clara, frio como pedra de poço. Deixa geada nos dedos.' }
];
const SCHOOL_OF = {};   // SCHOOL_OF[id do pergaminho] = a escola
for (const sc of SCHOOLS) {
  SCHOOL_OF[sc.scroll] = sc;
  ITEMS[sc.scroll] = { name: 'Pergaminho de ' + SPELL_ELEM[sc.k].name, rar: 1, scroll: 1, school: sc.k, elem: sc.k, icon: sc.scroll, desc: sc.desc };
}

/* ---- ícones: o rolo lacrado de sempre, com a cera e a fita da escola ---- */
const SCHOOL_PAL = {
  fogo: { roll: '#c9a978', sheet: '#d8c49a', ink: '#8a7458', rune: '#ff8a3c', wax: '#d0441a', ribbon: '#5a1a0a' },
  raio: ESC_PAL.raio,
  gelo: ESC_PAL.gelo
};
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    const sc = SCHOOL_OF[id]; if (!sc) return _makeIcon(id);
    const o = outlined(escPaintRows(SCROLL_ROWS, SCHOOL_PAL[sc.k], 120)); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
