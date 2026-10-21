'use strict';

/* ================= o Reino Élfico: nomes das zonas e save =================
   Carrega depois do save da Nave (248):
   - os nomes das zonas 53 a 56 entram aqui, depois dos da Nave (49 a 52), para que os números batam
   - os itens que saíram no revamp de 2026-10-21 (EL_ITEM_TROCA, 257) viram os novos nos saves (mochila, equipados,
     baú, fornalha: qualquer [id, ...] ou { id } do save);
   - o save: mundos de antes da camada (sem o Reino debaixo da Nave) são refeitos (wg 17); nível, itens, ouro e o baú
     da vila continuam. A Dama do Espelho volta viva junto com todos os outros chefes. */

while (ZONE_NAMES.length < EL_ZONE0) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
// revamp de 2026-10-21: a terceira faixa deixou de ser a Corte Desterrada (carmesim e ouro, cara de Warcraft) e virou
// a Corte dos Espinhos; a quarta deixou de ser o Poço da Lua e virou As Grutas da Lua
ZONE_NAMES.push('A Mata de Prata', 'Os Salões do Rei', 'A Corte dos Espinhos', 'As Grutas da Lua');
ZONE_SUB.push('debaixo da Lua Presa', 'ninguém passa', 'a roseira cresceu por cima do trono', 'o espelho está olhando');
if (ZONE_NAMES.length !== EL_ZONE0 + 4) console.error('zonas do Reino fora do lugar', ZONE_NAMES.length);

// o número de mundo que a cadeia de cima conhece: 16 com a Nave
const EL_WG = 17, EL_WG_UP = typeof NAVE !== 'undefined' && NAVE ? NV_WG : 15;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (ELFOS && o.wg === EL_WG_UP) o.wg = EL_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!ELFOS || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== EL_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.aguaD = null;
    v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.cervo = null; v.autoforja = null; v.rainha = null; v.nox = null; v.olhoCometa = null; v.damaEspelho = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }   // as alavancas da Fortaleza são do mundo velho
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;   // os chefes de todas as camadas
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = EL_WG_UP; const r = _ms(v); if (r && r.wg === EL_WG_UP) r.wg = EL_WG; return r;   // a cadeia de cima conhece o mundo dela
}; }

// revamp de 2026-10-21: cristal sangrento -> rosa negra, pena de hipogrifo -> asa de sílfide, presa de sabre -> pelo de
// cão-fada, lágrima de espectro -> lágrima de carpideira, Glaive Lunar -> Lâmina-Folha (com a raridade e os modificadores)
function elTrocaItens(o, d = 0) {
  if (!o || typeof o !== 'object' || d > 6) return;
  if (Array.isArray(o)) {
    if (typeof o[0] === 'string' && EL_ITEM_TROCA[o[0]]) o[0] = EL_ITEM_TROCA[o[0]];
    for (const v of o) if (v && typeof v === 'object') elTrocaItens(v, d + 1);
    return;
  }
  if (typeof o.id === 'string' && EL_ITEM_TROCA[o.id]) o.id = EL_ITEM_TROCA[o.id];
  for (const k in o) if (k !== 'diffs' && k !== 'seen' && o[k] && typeof o[k] === 'object') elTrocaItens(o[k], d + 1);
}
{ const _ms = migrateSave; migrateSave = function (v) { if (v && typeof v === 'object') try { elTrocaItens(v); } catch (e) { } return _ms(v); }; }
