'use strict';

/* ================= o revamp das camadas: 20 camadas, do nível 1 ao 100 (2026-10-21) =================
   Pedido do Jonathan (2026-10-21): a campanha vira 20 camadas de 5 níveis (lista no 129). A Colmeia, a Nave Caída e
   os Salões do Pesadelo saíram da geração (os arquivos ficam na pasta, fora do index.html, para virarem fases
   paralelas); entram O Brejo das Bruxas, A Necrópole do Rei Eterno, A Prisão dos Deuses, O Campo da Última Guerra e
   As Ruínas dos Acendedores.
   O save: mundos de antes (wg 20) são refeitos, como em toda camada nova: nível, itens, ouro e o baú da vila ficam e
   todos os chefes voltam vivos. O nível do herói passa para a escala nova uma vez só (o nível 20 de antes vira 44, o
   37 vira 86), assim os pontos de talento acompanham. Carrega logo depois do 353. */

const REVAMP_WG = 21;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (o.wg === DESCIDA_WG) o.wg = REVAMP_WG; o.nv2 = 1; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== REVAMP_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.aguaD = null; v.gerado = 1; v.vencidos = [];
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;   // os chefes de todas as camadas
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  if (v.p && !v.nv2) { const L = Math.max(1, v.p.lvl | 0); v.p.lvl = L <= 4 ? L : Math.max(5, Math.round((L - 2.5) / 0.4)); v.p.xp = 0; v.nv2 = 1; }
  v.wg = DESCIDA_WG; const r = _ms(v); if (r && r.wg === DESCIDA_WG) r.wg = REVAMP_WG; return r;   // a cadeia de baixo conhece o mundo 20
}; }
