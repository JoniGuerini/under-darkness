'use strict';
/* modo deus, só para testes: F4 liga e desliga. Com ele ligado o herói não perde vida nem gasta mana,
   e qualquer golpe dele mata o alvo na hora, chefes inclusive. Não vai para o save:
   todo jogo começa com ele desligado. Enquanto ligado, aparece uma linha "Deus" no painel do canto superior direito. */
let modoDeus = false;
(function () {
  const row = document.createElement('div');
  row.className = 'row'; row.id = 'deusRow'; row.hidden = true;
  row.innerHTML = '<em>Deus</em><span style="color:#f0c040">ligado</span>';
  document.querySelector('#hud .world').appendChild(row);
})();
function toggleModoDeus() {
  modoDeus = !modoDeus; $('deusRow').hidden = !modoDeus;
  if (modoDeus && pl && !pl.dead) { pl.hp = pl.maxHp; pl.mana = pl.maxMana; }
}
addEventListener('keydown', e => {
  if (e.code !== 'F4') return;
  e.preventDefault();
  if (!e.repeat && !(e.target && e.target.tagName === 'INPUT')) toggleModoDeus();
});
// a mana não desce: qualquer feitiço (de hoje ou futuro) que tire de pl.mana fica com ela cheia
{ let mana = pl.mana; Object.defineProperty(pl, 'mana', { enumerable: true, configurable: true,
  get() { return mana; }, set(v) { mana = modoDeus ? Math.max(v, pl.maxMana) : v; } }); }
// nenhum dano chega: toda perda de vida do herói passa por rawDamage (10-combate)
{ const _raw = rawDamage; rawDamage = function (d, kdir) { if (modoDeus) return; return _raw(d, kdir); }; }
// um golpe, uma morte. Fica por fora de todos os outros embrulhos de hitEnemy, por isso vem no fim.
// Respeita só os momentos em que o chefe não pode ser tocado (entrada, queda e volta do Rei Esqueleto);
// o Rei ainda se levanta uma vez, e o segundo golpe acaba com ele.
function deusIntocavel(e) {
  if (e.state === 'intro') return true;
  return e.type === 'rei' && (e.state === 'collapse' || e.state === 'reform');
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (!modoDeus || !e || e.dead || deusIntocavel(e)) return _hit(e, dir, mult, melee);
  e.hp = Math.min(e.hp, 1);
  const r = _hit(e, dir, mult, melee);
  if (!e.dead && !deusIntocavel(e)) {
    if (e.hp >= 1) e.hp = 0;   // o golpe foi bloqueado ou atravessou: mata assim mesmo
    if (e.hp <= 0) killEnemy(e);
  }
  return r;
}; }
