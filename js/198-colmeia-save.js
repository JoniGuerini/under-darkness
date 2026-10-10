'use strict';

/* ================= a Colmeia: nomes das zonas e save =================
   Carrega depois do save da camada de cima (188, o da Fortaleza dos Anões):
   - os nomes das zonas 41 a 44 entram aqui, depois dos da Fortaleza (37 a 40), para que os números batam; se uma
     camada de cima ainda não existe, as zonas dela ficam em branco até chegar a vez da colmeia
   - o save: mundos de antes da camada 9 são refeitos (wg 14); nível, itens, ouro e o baú da vila continuam (sem
     aviso na tela: a novidade fica nas notas da versão, 122). A morte da Rainha fica no `rainha` do 196; os blocos
     lacrados pelas operárias passam por setTile e vão nos diffs como qualquer outro. */

while (ZONE_NAMES.length < CM_ZONE0) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
ZONE_NAMES.push('Brecha Tomada', 'Galerias de Cera', 'Câmaras de Âmbar', 'O Berçário');
ZONE_SUB.push('onde a cera engoliu a pedra', 'as paredes trabalham', 'o que entra não sai', 'algo bate dentro dos ovos');
if (ZONE_NAMES.length !== CM_ZONE0 + 4) console.error('zonas da Colmeia fora do lugar', ZONE_NAMES.length);

// o número de mundo que a camada de cima conhece: 13 com a Fortaleza, 12 com a Floresta, 11 só com a Cidade
const CM_WG = 14, CM_WG_UP = typeof ANOES !== 'undefined' && ANOES ? 13 : typeof FLORESTA !== 'undefined' && FLORESTA ? 12 : 11;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (COLMEIA && o.wg === CM_WG_UP) o.wg = CM_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!COLMEIA || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== CM_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.cervo = null; v.autoforja = null; v.rainha = null; v.aguaD = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }   // as alavancas da Fortaleza são do mundo velho
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;   // os chefes das camadas de cima também
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = CM_WG_UP; const r = _ms(v); if (r && r.wg === CM_WG_UP) r.wg = CM_WG; return r;   // a camada de cima conhece o mundo dela
}; }
