'use strict';
/* modo deus, só para testes: F4 liga e desliga. Em Menu > Testes > Modo deus dá para ligar e desligar o modo
   e cada um dos efeitos dele: sem dano (o herói não perde vida), mana infinita, um golpe mata (qualquer alvo,
   chefes inclusive) e luz total (o subterrâneo fica bem menos escuro, ainda com sombra). Os efeitos começam todos ligados. Nada disso vai para
   o save: todo jogo começa com o modo desligado. Enquanto ligado, aparece uma linha "Deus" no painel do canto superior direito.
   `modoDeus` (lido por outros arquivos para pular dano) quer dizer "o herói não toma dano agora": modo ligado e "Sem dano" ligado. */
let deusOn = false;
const DEUS = { vida: true, mana: true, golpe: true, luz: true };
const deusFx = k => deusOn && DEUS[k];
Object.defineProperty(window, 'modoDeus', { configurable: true, get: () => deusFx('vida') });
(function () {
  const row = document.createElement('div');
  row.className = 'row'; row.id = 'deusRow'; row.hidden = true;
  row.innerHTML = '<em>Deus</em><span style="color:#f0c040">ligado</span>';
  document.querySelector('#hud .world').appendChild(row);
})();
function deusRefill() { if (!pl || pl.dead) return; if (deusFx('vida')) pl.hp = pl.maxHp; if (deusFx('mana')) pl.mana = pl.maxMana; }
function toggleModoDeus() { deusOn = !deusOn; $('deusRow').hidden = !deusOn; deusRefill(); deusMenu(); }
addEventListener('keydown', e => {
  if (e.code !== 'F4') return;
  e.preventDefault();
  if (!e.repeat && !(e.target && e.target.tagName === 'INPUT')) toggleModoDeus();
});

/* ---- Menu > Testes > Modo deus (a lista do 75-teleporte) ---- */
let deusMenu = () => { };
(function () {
  const list = $('tpList'); if (!list || !window.__tp) return;
  const h2 = $('pause').querySelector('.card h2');
  const OPC = [['vida', 'Sem dano'], ['mana', 'Mana infinita'], ['golpe', 'Um golpe mata'], ['luz', 'Luz total']];
  const lbl = (t, on) => t + ': ' + (on ? 'ligado' : 'desligado');
  let aberto = false;
  const btn = (txt, fn, id) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost'; b.textContent = txt; if (id) b.id = id; b.addEventListener('click', fn); b.addEventListener('pointerenter', () => b.focus({ preventScroll: true })); list.appendChild(b); return b; };
  function abrir() {
    aberto = true; list.textContent = ''; h2.textContent = 'Modo deus';
    btn(lbl('Modo deus', deusOn), toggleModoDeus, 'deusBtnOn');
    for (const [k, t] of OPC) btn(lbl(t, DEUS[k]), () => { DEUS[k] = !DEUS[k]; deusRefill(); deusMenu(); }, 'deusBtn-' + k);
    btn('Voltar', () => { aberto = false; __tp.show('tests'); setTimeout(() => { const b = $('btnDeus'); if (b) b.focus(); }); });
    list.querySelector('button').focus();
  }
  deusMenu = () => {
    if (!aberto || list.hidden) return;
    $('deusBtnOn').textContent = lbl('Modo deus', deusOn);
    for (const [k, t] of OPC) $('deusBtn-' + k).textContent = lbl(t, DEUS[k]);
  };
  // quando o submenu Testes aparece, o botão entra logo antes do Voltar
  new MutationObserver(() => {
    if (!$('btnArmy') || $('btnDeus')) return;
    aberto = false;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost'; b.id = 'btnDeus'; b.textContent = 'Modo deus';
    b.addEventListener('click', abrir); b.addEventListener('pointerenter', () => b.focus({ preventScroll: true }));
    list.insertBefore(b, list.lastElementChild);
  }).observe(list, { childList: true });
})();

// a mana não desce: qualquer feitiço (de hoje ou futuro) que tire de pl.mana fica com ela cheia
{ let mana = pl.mana; Object.defineProperty(pl, 'mana', { enumerable: true, configurable: true,
  get() { return mana; }, set(v) { mana = deusFx('mana') ? Math.max(v, pl.maxMana) : v; } }); }
// nenhum dano chega: quase toda perda de vida passa por rawDamage (10-combate); o resto (afogar, veneno, sangria, esporos) checa modoDeus
{ const _raw = rawDamage; rawDamage = function (d, kdir) { if (modoDeus) return; return _raw(d, kdir); }; }
// luz total: o subterrâneo fica bem menos escuro, mas com sombra (piso de claridade mais alto no DARK do 07-chunks-luz)
// e o herói ganha um brilho em volta, como uma tocha fraca, para a luz cair e sumir nas bordas
{ const _cl = computeLight; computeLight = function (cx, cy) {
  if (!deusFx('luz')) return _cl(cx, cy);
  const a = DARK.amb, x = DARK.ex, c = DARK.cap, l = pl.light;
  DARK.amb = 0.22; DARK.ex = 1.3; DARK.cap = 0.95; pl.light = Math.max(l || 0, 2);
  try { return _cl(cx, cy); } finally { DARK.amb = a; DARK.ex = x; DARK.cap = c; pl.light = l; }
}; }
// um golpe, uma morte. Fica por fora de todos os outros embrulhos de hitEnemy, por isso vem no fim.
// Respeita só os momentos em que o chefe não pode ser tocado (entrada, queda e volta do Rei Esqueleto);
// o Rei ainda se levanta uma vez, e o segundo golpe acaba com ele.
function deusIntocavel(e) {
  if (e.state === 'intro') return true;
  return e.type === 'rei' && (e.state === 'collapse' || e.state === 'reform');
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (!deusFx('golpe') || !e || e.dead || deusIntocavel(e)) return _hit(e, dir, mult, melee);
  e.hp = Math.min(e.hp, 1);
  const r = _hit(e, dir, mult, melee);
  if (!e.dead && !deusIntocavel(e)) {
    if (e.hp >= 1) e.hp = 0;   // o golpe foi bloqueado ou atravessou: mata assim mesmo
    if (e.hp <= 0) killEnemy(e);
  }
  return r;
}; }
