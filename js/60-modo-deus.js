'use strict';
/* modo deus, só para testes: F4 liga e desliga. Na aba Modo deus da tela de Testes (Menu > Testes, 339-testes) dá para ligar e desligar o modo
   e cada um dos efeitos dele: sem dano (o herói não perde vida), mana infinita, um golpe mata (qualquer alvo,
   chefes inclusive) luz total (o subterrâneo fica bem menos escuro, ainda com sombra) tochas infinitas (põe tocha sem ter nenhuma) e compras de graça (loja e abas do baú sem gastar ouro). Os efeitos começam todos ligados. Nada disso vai para
   o save: todo jogo começa com o modo desligado. Enquanto ligado, aparece uma linha "Deus" no painel do canto superior direito.
   `modoDeus` (lido por outros arquivos para pular dano) quer dizer "o herói não toma dano agora": modo ligado e "Sem dano" ligado. */
let deusOn = false;
const DEUS = { vida: true, mana: true, golpe: true, luz: true, tocha: true, ouro: true };
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

// a tela de Testes (339) troca isto para se repintar quando o modo muda (pelo F4 também)
let deusMenu = () => { };

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
// tochas infinitas: enquanto põe a tocha (11-jogador), a conta de tochas (05 + cinto do 231) diz que tem e não tira nenhuma
{ const _pt = placeTorch; placeTorch = function (tx, ty) {
  if (!deusFx('tocha')) return _pt(tx, ty);
  const ci = countItem, ri = removeItem;
  countItem = id => id === 'tocha' ? Math.max(1, ci(id)) : ci(id);
  removeItem = (id, n = 1) => id === 'tocha' ? true : ri(id, n);
  try { return _pt(tx, ty); } finally { countItem = ci; removeItem = ri; }
}; }
// compras de graça: só enquanto a loja (19) e as abas do baú (333) conferem e cobram o preço, pl.gold parece não ter fim
// e não desce; fora disso (HUD, save, roubo dos goblins) é o ouro de verdade. O save nunca vê o ouro de mentira.
{ let ouro = pl.gold, dentro = 0, fora = 0;
  const finge = () => dentro > 0 && !fora && deusFx('ouro');
  Object.defineProperty(pl, 'gold', { enumerable: true, configurable: true,
    get() { return finge() ? Math.max(ouro, 1e9) : ouro; },
    set(v) { if (!finge()) { ouro = v; return; } const d = v - Math.max(ouro, 1e9); if (d > 0) ouro += d; } });
  const mostra = () => { const g = $('shopGold'); if (g) g.innerHTML = coinTag(ouro); const b = $('bagGold'); if (b) b.textContent = goldTxt(ouro); };
  const escopo = fn => function () { dentro++; try { return fn.apply(this, arguments); } finally { if (--dentro === 0 && deusFx('ouro')) mostra(); } };
  const semFingir = fn => function () { fora++; try { return fn.apply(this, arguments); } finally { fora--; } };
  for (const k of ['refreshShop', 'renderFeat', 'buyEntry', 'openBuyPop', 'buyStashTab']) if (typeof window[k] === 'function') window[k] = escopo(window[k]);
  makeSave = semFingir(makeSave); saveGame = semFingir(saveGame);
  // o Comprar do baú foi ligado ao buyStashTab original (333): com o efeito ligado, o clique passa pelo embrulhado
  document.addEventListener('click', e => { if (!deusFx('ouro') || !e.target.closest || !e.target.closest('#stashBuyOk')) return; e.stopPropagation(); e.preventDefault(); buyStashTab(); }, true);
}
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
