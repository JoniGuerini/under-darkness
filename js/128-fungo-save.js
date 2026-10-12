'use strict';

/* ================= as Minas Fúngicas: nomes das zonas, água e save =================
   Carrega depois do 122-sem-baus (e do 87, do 108 e do 111):
   - os nomes das zonas 25 a 28 entram aqui, depois dos do Abismo (21 a 24), para que os números batam
   - a água das grutas é cheia de novo depois do 87 (que ainda pode abrir túneis): fungWater no 125
   - o tom verde-azulado da água nas Minas Fúngicas (171)
   - o save: mundos de antes da camada 5 são refeitos (wg 10); nível, itens, ouro e o baú da vila continuam (sem aviso
     na tela: as novidades ficam nas notas da versão, 122) */

ZONE_NAMES.push('Galerias Tomadas', 'Bosque de Chapéus', 'Grutas Alagadas', 'Coração do Micélio');
ZONE_SUB.push('a colônia ainda parece só abandonada', 'bonito demais para estar certo', 'a água não corre há séculos', 'as paredes respiram');
if (ZONE_NAMES.length !== FG_ZONE0 + 4) console.error('zonas das Minas Fúngicas fora do lugar', ZONE_NAMES.length);

genPos(() => { if (FUNGO) try { fungWater(); } catch (err) { console.error(err); } }, 'fungo');   // depois das ligações da leva que gerou os fungos (129)

aguaTom(ty => FUNGO && ty >= FG_S0 - 4 && ty < FG_S0 + FG_D, ['#061214', '#0a1e22', '#102c30', '#1a3e40', '#2a5654', '#467472']);

{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (FUNGO && o.wg === 9) o.wg = 10; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!FUNGO || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 10) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = 9; const r = _ms(v); if (r && r.wg === 9) r.wg = 10; return r;   // 122 knows world 9
}; }
