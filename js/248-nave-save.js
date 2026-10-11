'use strict';

/* ================= a Nave Caída: nomes das zonas e save =================
   Carrega depois do save da Escuridão (229):
   - os nomes das zonas 49 a 52 entram aqui, depois dos da Escuridão (45 a 48), para que os números batam
   - o save: mundos de antes da camada (sem a nave debaixo da Colmeia) são refeitos (wg 16); nível, itens, ouro e o
     baú da vila continuam. O rastro do Olho-Cometa nunca vai para o save (246). */

while (ZONE_NAMES.length < NV_ZONE0) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
ZONE_NAMES.push('A Cratera de Impacto', 'O Casco', 'Os Laboratórios', 'O Núcleo');
ZONE_SUB.push('onde ela caiu', 'as luzes ainda acendem', 'eles levaram de tudo', 'o olho está aberto');
if (ZONE_NAMES.length !== NV_ZONE0 + 4) console.error('zonas da Nave fora do lugar', ZONE_NAMES.length);

// o número de mundo que a cadeia de cima conhece: 15 com a Escuridão, 14 só com a Colmeia
const NV_WG = 16, NV_WG_UP = typeof ESCURO !== 'undefined' && ESCURO ? 15 : 14;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (NAVE && o.wg === NV_WG_UP) o.wg = NV_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!NAVE || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== NV_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.cervo = null; v.autoforja = null; v.rainha = null; v.nox = null; v.olhoCometa = null; v.aguaD = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }   // as alavancas da Fortaleza são do mundo velho
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;   // os chefes de todas as camadas
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = NV_WG_UP; const r = _ms(v); if (r && r.wg === NV_WG_UP) r.wg = NV_WG; return r;   // a cadeia de cima conhece o mundo dela
}; }
