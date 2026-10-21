'use strict';

/* ================= os humanoides sobem escadas, cordas, correntes e cipós (2026-10-14) =================
   Pedido do Jonathan (2026-10-14): os inimigos humanoides devem conseguir usar escada e cipó, como o herói.
   Reaproveita o que os humanos da Cidade Afundada (133) já faziam: cdvNav acha o caminho passando por escadas
   (climbU, climbD, toLadder, offLadder) e cdvLadderDrive leva o corpo pela escada. Aqui isso vale também para os
   humanoides de todas as camadas que andam com o walk() do 12:
   - ET[tipo].climbs = true para os tipos de HUMANOIDES (só os que cabem numa coluna de escada: até 12 de largura e
     30 de altura). Os humanos da cidade (ET.human) continuam com o sistema deles.
   - navFind deles: se dá para chegar andando e pulando, vai como antes; se não, vai pelo cdvNav até a casa do herói
     (pendurado na escada também conta). Já pendurado, sempre pelo cdvNav.
   - walk(): quando o próximo passo é de escada, ou o bicho já está pendurado, a escada manda; o caminho é refeito
     enquanto ele sobe (o 13 só refaz o caminho com os pés no chão). Sem o herói, quem está pendurado desce.
   - O que se escala: tudo que o herói escala (o touchingTile de cada camada liga a sua escada à CHAIN); CDV_CLIMB
     do 133 ganha as escadas e cipós das camadas que ele não conhecia.
   Carrega depois do 133 (cdvNav), do 83 (que também embrulha walk) e das camadas. */

// os que perseguem andando (testados numa escada de 6 e de 12); os de longe (arqueiros, magos, fundeiros, o hipnotizador)
// mantêm distância, e o colono anda aos trancos: esses ficam como estavam
const HUMANOIDES = ['zombie', 'skeleton', 'guard', 'gatuno', 'capataz', 'mineiro', 'cultista', 'juramentado', 'cacador', 'visitante',
  'astronauta', 'sentinela', 'guardiao', 'escamado', 'kobarmad', 'catador', 'bailarina'];
for (const k of HUMANOIDES) { const D = ET[k]; if (D && !D.fly && !D.phase && !D.human && D.w <= 12 && D.h <= 30) D.climbs = true; }

// as escadas, cordas, correntes e cipós de cada camada (os nomes que o touchingTile de cada uma liga à CHAIN)
let escalaPronta = false;
function escalaLate() {
  if (escalaPronta) return; escalaPronta = true;
  cdvLate();
  const ids = ['FP_CIPO', 'FP_RAIZ_ESCADA', 'AN_ESCADA', 'AN_CORRENTE', 'CM_FIO_CERA', 'CM_ESCADA_FAVO', 'ES_CORRENTE', 'ES_RAIZ_PEND',
    'NV_ESCADA', 'NV_CABO', 'EL_ESCADA', 'EL_CIPO', 'MS_CORDAME', 'MS_CORRENTE', 'DG_ESCADA', 'DG_CORDA', 'TT_ESCADA', 'TT_TENDAO',
    'AT_ESCADA', 'AT_CORRENTE', 'PS_ESCADA', 'PS_CORDA'];
  for (const id in CAMADA_EXT) for (const n of CAMADA_EXT[id].escalar || []) ids.push(n);   // as camadas novas: nomes dos blocos de subir (129, 2026-10-21)
  for (const n of ids) { let t = -1; try { t = Function('return typeof ' + n + " === 'number' ? " + n + ' : -1')(); } catch (e) { } if (t >= 0) CDV_CLIMB[t] = 1; }
}
const sobe = e => !!(ET[e.type] && ET[e.type].climbs);

{ const _nf = navFind; navFind = function (e) {
  if (!sobe(e)) return _nf(e);
  escalaLate();
  const [px, py] = cdvHeroCell();
  if (e.cdClimb && !e.onGround) return cdvNav(e, px, py);             // já pendurado
  const a = _nf(e); if (a) return a;                                   // dá para ir andando (ou pulando): vai como antes
  const b = cdvNav(e, px, py);
  return b && b.kind === 'offLadder' ? null : b;                       // de pé na beirada ao lado da escada: não "sai" dela
}; }

{ const _w = walk; walk = function (e, dt, dir, sp, acc, jv, dy, chase) {
  if (!sobe(e)) return _w(e, dt, dir, sp, acc, jv, dy, chase);
  if (e.cdClimb && !e.onGround && chase && !pl.dead) e.nav = cdvRoute(e, dt, () => navFind(e));   // pendurado: o caminho segue sendo refeito
  const nav = chase ? e.nav : null;
  if (nav && CDV_LADDER_K[nav.kind] && cdvLadderDrive(e, dt, nav)) return nav.dir || 0;
  if (e.cdClimb && !e.onGround && cdvLadderDrive(e, dt, nav)) return 0;
  e.cdClimb = false;
  return _w(e, dt, dir, sp, acc, jv, dy, chase);
}; }
