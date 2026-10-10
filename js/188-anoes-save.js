'use strict';

/* ================= a Fortaleza dos Anões: nomes das zonas, a ponte com o 87 e o save =================
   Carrega logo depois do save da camada de cima (148, o da Floresta Petrificada) e depois do 87:
   - os nomes das zonas 37 a 40 entram aqui, depois dos da Floresta (33 a 36), para que os números batam
   - o save (mundos de antes da camada 8 são refeitos: wg 13); as alavancas e comportas ficam no save da camada, não
     nos diffs (o 189 lê e escreve `anoes.levers`) */

while (ZONE_NAMES.length < AN_ZONE0) { ZONE_NAMES.push('Floresta Petrificada'); ZONE_SUB.push(''); }   // sem a camada 7 (não acontece com ela no disco)
ZONE_NAMES.push('Portões de Bronze', 'Salões do Clã', 'Canais de Lava', 'Forjas de Runas');
ZONE_SUB.push('as portas foram arrombadas de baixo', 'a mesa ainda está posta', 'a lava corre onde mandaram', 'as máquinas ainda guardam a porta');
if (ZONE_NAMES.length !== AN_ZONE0 + 4) console.error('zonas da Fortaleza dos Anões fora do lugar', ZONE_NAMES.length);

// o 87 (que liga ao vilarejo todo bolsão solto) conhece a fortaleza: anKeep, AN_BARREIRA e AN_COMPORTA ele não cava,
// a Grande Forja é sagrada (inAnHall) e a escada que ele põe nestas linhas é a escada anã

// o save: mundos de antes da camada 8 são refeitos (wg 13); nível, itens, ouro e o baú da vila continuam (sem aviso
// na tela: as novidades ficam nas notas da versão, 122)
const AN_WG = 13, AN_WG_PREV = AN_FLORESTA ? 12 : 11;
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); if (ANOES && o.wg === AN_WG_PREV) o.wg = AN_WG;
  if (ANOES) o.anoes = { levers: anLevers.map(L => L.on ? 1 : 0), cinzel: !!anState.cinzel, taken: !!anState.taken };
  return o;
}; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!ANOES || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== AN_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.cervo = null; v.aguaD = null; v.autoforja = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = AN_WG_PREV; const r = _ms(v); if (r && r.wg === AN_WG_PREV) r.wg = AN_WG; return r;
}; }
// o que o herói já fez na fortaleza e não está nos diffs: o cinzel entregue ao Grimaldo (189), as alavancas
const anState = { cinzel: false, taken: false };
{ const _nw = newWorld; newWorld = function (sd, sv) {
  anState.cinzel = !!(sv && sv.anoes && sv.anoes.cinzel); anState.taken = anState.cinzel || !!(sv && sv.anoes && sv.anoes.taken);
  const r = _nw(sd, sv);
  if (ANOES && sv && sv.anoes && Array.isArray(sv.anoes.levers)) sv.anoes.levers.forEach((on, k) => { if (on && anLevers[k] && typeof anLeverSet === 'function') anLeverSet(anLevers[k], true, true); });
  return r;
}; }
