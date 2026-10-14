'use strict';

/* ================= vida e mana não somem no recalc (2026-10-14) =================
   O recalc é embrulhado por vários arquivos (talentos, ofícios, elixires...). O de dentro (js/08) e alguns do meio
   cortavam pl.hp e pl.mana pelo máximo DELES, antes dos de fora somarem a vida e a mana da árvore, do banquete ou do
   elixir. Resultado: qualquer troca de equipamento com esses bônus ativos tirava vida e mana do herói.
   Aqui, por fora de todos: guarda a vida e a mana de antes, deixa os recalc trabalharem e só corta pelo máximo final.
   Carrega por último, depois de todo arquivo que embrulha recalc. */
{
  const _rc = recalc;
  recalc = function () {
    const hp0 = pl.hp, mana0 = pl.mana;
    const r = _rc.apply(this, arguments);
    if (Number.isFinite(hp0) && Number.isFinite(pl.maxHp)) pl.hp = Math.min(hp0, pl.maxHp);
    if (Number.isFinite(mana0) && Number.isFinite(pl.maxMana)) pl.mana = Math.min(mana0, pl.maxMana);
    return r;
  };
}
