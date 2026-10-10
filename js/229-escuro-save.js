'use strict';

/* ================= a Escuridão: nomes das zonas e save =================
   Carrega depois do save da camada de cima (198, o da Colmeia):
   - os nomes das zonas 45 a 48 entram aqui, depois dos da Colmeia (41 a 44), para que os números batam; se uma
     camada de cima ainda não existe, as zonas dela ficam em branco até chegar a vez da Escuridão
   - o save: mundos de antes da camada (sem a Escuridão debaixo do Abismo) são refeitos (wg 15); nível, itens, ouro e
     o baú da vila continuam. A idade do mapa da camada não vai para o save; as piras voltam frias (227). */

while (ZONE_NAMES.length < ES_ZONE0) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
ZONE_NAMES.push('A Borda Apagada', 'O Breu', 'As Raízes da Noite', 'O Fundo do Mundo');
ZONE_SUB.push('aqui o fogo acaba', 'a luz não chega às paredes', 'tudo isto sobe', 'não há nada embaixo');
if (ZONE_NAMES.length !== ES_ZONE0 + 4) console.error('zonas da Escuridão fora do lugar', ZONE_NAMES.length);

// o número de mundo que a camada de cima conhece: 14 com a Colmeia, 13 com a Fortaleza, 12 com a Floresta, 11 só com a Cidade
const ES_WG = 15, ES_WG_UP = typeof COLMEIA !== 'undefined' && COLMEIA ? 14 : typeof ANOES !== 'undefined' && ANOES ? 13 : typeof FLORESTA !== 'undefined' && FLORESTA ? 12 : 11;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (ESCURO && o.wg === ES_WG_UP) o.wg = ES_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!ESCURO || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== ES_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.cervo = null; v.autoforja = null; v.rainha = null; v.nox = null; v.aguaD = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }   // as alavancas da Fortaleza são do mundo velho
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;   // os chefes das camadas de cima também
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = ES_WG_UP; const r = _ms(v); if (r && r.wg === ES_WG_UP) r.wg = ES_WG; return r;   // a camada de cima conhece o mundo dela
}; }
