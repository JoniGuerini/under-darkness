'use strict';

/* ================= a Cidade Afundada: nomes das zonas, água e save =================
   Carrega logo depois do 128-fungo-save:
   - os nomes das zonas 29 a 32 entram aqui, depois dos das Minas Fúngicas (25 a 28), para que os números batam
   - a água negra refeita depois do 87, o tom da água, o save (mundos de antes da camada 6 são refeitos: wg 11) */

ZONE_NAMES.push('Cisternas Altas', 'Ruas Tortas', 'Bairro do Poço', 'Palácio do Sino');
ZONE_SUB.push('a água negra não corre para lugar nenhum', 'alguém fecha uma janela', 'eles escutam o fundo', 'o sino ainda está lá em cima');
if (ZONE_NAMES.length !== CD_ZONE0 + 4) console.error('zonas da Cidade Afundada fora do lugar', ZONE_NAMES.length);

// a água negra das cisternas é cheia de novo depois do 87 (que ainda pode abrir túneis): cdWater no 136
genPos(() => { if (CIDADE) try { cdWater(); } catch (err) { console.error(err); } }, 'cidade');   // depois das ligações da leva que gerou a cidade (129)

// a água da cidade é negra (171): 80% opaca no desenho
aguaTom(ty => CIDADE && ty >= CD_S0 - 2 && ty < CD_S0 + CD_D, ['#040506', '#08090c', '#0c0e12', '#121418', '#181c20', '#22262c']);

// o save: mundos de antes da camada 6 são refeitos (wg 11); nível, itens, ouro e o baú da vila continuam (sem aviso
// na tela: as novidades ficam nas notas da versão, 122)
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (CIDADE && o.wg === 10) o.wg = 11; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!CIDADE || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 11) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null; v.maeEsporo = null; v.sineiro = null; v.aguaD = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = 10; const r = _ms(v); if (r && r.wg === 10) r.wg = 11; return r;   // 128 knows world 10
}; }
