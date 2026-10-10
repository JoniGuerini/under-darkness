'use strict';

/* ================= a Floresta Petrificada: nomes das zonas e save =================
   Carrega logo depois do 137-sineiro-afogado (que vem depois do 139-cidade-save):
   - os nomes das zonas 33 a 36 entram aqui, depois dos da Cidade Afundada (29 a 32), para que os números batam
   - o save: mundos de antes da camada 7 são refeitos (wg 12) */

ZONE_NAMES.push('Bosque Soterrado', 'Mata de Cristal', 'Raízes Profundas', 'Clareira dos Gigantes');
ZONE_SUB.push('a pedra ainda lembra que foi árvore', 'tudo brilha e nada se mexe', 'o chão é feito de raízes', 'ao longe, cascos na pedra');
if (ZONE_NAMES.length !== FP_ZONE0 + 4) console.error('zonas da Floresta Petrificada fora do lugar', ZONE_NAMES.length);

// o save: mundos de antes da camada 7 são refeitos (wg 12); nível, itens, ouro e o baú da vila continuam (sem aviso
// na tela: as novidades ficam nas notas da versão, 122)
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (FLORESTA && o.wg === 11) o.wg = 12; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!FLORESTA || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 12) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.cervo = null; v.aguaD = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = 11; const r = _ms(v); if (r && r.wg === 11) r.wg = 12; return r;   // 139 knows world 11
}; }

// a Lança de Raiz alcança 12 px (1 bloco) a mais que as outras lanças (o 08 põe pl.reach pelo tipo da arma)
{ const _rc = recalc; recalc = function (...a) {
  const r = _rc.apply(this, a);
  const w = equip.weapon && ITEMS[equip.weapon.id]; if (w && w.alcance) pl.reach += w.alcance;
  return r;
}; }
