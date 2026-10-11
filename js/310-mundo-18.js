'use strict';

/* ================= as cinco camadas de baixo do Reino: o número de mundo =================
   O Mar Sem Sol, o Covil do Dragão, o Ossário dos Titãs, a Cidade dos Antigos e os Salões do Pesadelo entraram juntos
   (2026-10-11) e nenhum deles sobe o wg sozinho. Este arquivo sobe uma vez só, para 18: mundos de antes (wg 17, sem
   as cinco camadas entre o Reino e o Abismo) são refeitos; nível, itens, ouro e o baú da vila continuam, e todos os
   chefes voltam vivos. Carrega depois do save do Reino (258) e dos saves das cinco camadas (268 a 309). */

const MUNDO_WG = 18;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (o.wg === EL_WG) o.wg = MUNDO_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== MUNDO_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.aguaD = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }   // as alavancas da Fortaleza são do mundo velho
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;   // os chefes de todas as camadas
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = EL_WG; const r = _ms(v); if (r && r.wg === EL_WG) r.wg = MUNDO_WG; return r;   // a cadeia de cima conhece o mundo dela
}; }
