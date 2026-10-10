'use strict';

/* ================= personagens: cada um com o seu save =================
   A lista fica em 'ud-personagens' ({ next, last, list: [{ id, n, lvl, gold, t }] }) e o save de cada um em 'ud-save-<id>'.
   saveGame grava no personagem atual (charCur); sem personagem atual não grava nada (depois de excluir, por exemplo).
   loadSave devolve o save do último personagem jogado. Na primeira vez, o save antigo vira o Personagem 1.
   A tela de início (39-titulo) usa charList, charNew, charLoad e charDelete. Carrega antes do 24-boot. */
const CHARS_KEY = 'ud-personagens', charKey = id => 'ud-save-' + id;
let charCur = null;
function charsRead() {
  try { const v = JSON.parse(localStorage.getItem(CHARS_KEY)); if (v && Array.isArray(v.list)) return v; } catch (e) { }
  return null;
}
function charsWrite(v) { try { localStorage.setItem(CHARS_KEY, JSON.stringify(v)); } catch (e) { } }
const loadSaveLegacy = loadSave;
let chars = charsRead();
if (!chars) {
  chars = { next: 1, last: null, list: [] };
  const old = loadSaveLegacy();
  if (old && typeof old.seed === 'number') {
    try { localStorage.setItem(charKey(1), JSON.stringify(old)); chars = { next: 2, last: 1, list: [{ id: 1, n: 1, lvl: old.p ? Math.max(1, old.p.lvl | 0) : 1, gold: old.gold | 0, t: Date.now() }] }; } catch (e) { }
  }
  charsWrite(chars);
}
charCur = chars.last;
function charList() { return chars.list.slice().sort((a, b) => b.t - a.t); }
function charName(c) { return 'Personagem ' + c.n; }
saveGame = function () {
  if (!tiles || charCur == null) return;
  try { localStorage.setItem(charKey(charCur), JSON.stringify(makeSave())); } catch (e) { return; }
  const c = chars.list.find(q => q.id === charCur);
  if (c) { c.lvl = pl.lvl; c.gold = pl.gold; c.t = Date.now(); }
  chars.last = charCur; charsWrite(chars);
};
loadSave = function () {
  if (charCur == null) return null;
  try { const s = localStorage.getItem(charKey(charCur)); return s ? JSON.parse(s) : null; } catch (e) { return null; }
};
// personagem novo: entra direto num mundo novo, já com o seu save
function charNew() {
  const n = chars.list.reduce((m, c) => Math.max(m, c.n), 0) + 1;
  const c = { id: chars.next++, n, lvl: 1, gold: 0, t: Date.now() };
  chars.list.push(c); charCur = c.id;
  newWorld((Math.random() * 2 ** 31) | 0); saveGame();
}
function charLoad(id) {
  if (!chars.list.some(c => c.id === id)) return false;
  charCur = id;
  const sv = migrateSave(loadSave());
  if (sv && typeof sv.seed === 'number') newWorld(sv.seed, sv); else { newWorld((Math.random() * 2 ** 31) | 0); saveGame(); }
  chars.last = id; charsWrite(chars);
  return true;
}
function charDelete(id) {
  chars.list = chars.list.filter(c => c.id !== id);
  try { localStorage.removeItem(charKey(id)); } catch (e) { }
  if (charCur === id) charCur = null;
  if (chars.last === id) chars.last = chars.list.length ? charList()[0].id : null;
  charsWrite(chars);
}
