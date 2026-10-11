'use strict';

/* ================= o Reino Élfico: nomes das zonas e save =================
   Carrega depois do save da Nave (248):
   - os nomes das zonas 53 a 56 entram aqui, depois dos da Nave (49 a 52), para que os números batam
   - o save: mundos de antes da camada (sem o Reino debaixo da Nave) são refeitos (wg 17); nível, itens, ouro e o baú
     da vila continuam. A Dama do Espelho volta viva junto com todos os outros chefes. */

while (ZONE_NAMES.length < EL_ZONE0) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
ZONE_NAMES.push('A Mata de Prata', 'Os Salões do Rei', 'A Corte Desterrada', 'O Poço da Lua');
ZONE_SUB.push('debaixo da Lua Presa', 'ninguém passa', 'eles beberam do poço', 'o espelho está olhando');
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
