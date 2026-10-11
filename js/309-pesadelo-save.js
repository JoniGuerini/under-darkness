'use strict';

/* ================= os Salões do Pesadelo: nomes das zonas e save =================
   - os nomes das zonas 73 a 76 entram pelo índice (PS_ZONE0 a PS_ZONE0 + 3), sem empurrar: outras camadas podem pôr os
     delas antes ou depois sem trocar os números
   - o save guarda os laços desfeitos, os Adormecidos acordados e o Sem-Rosto (semRosto.dead); a Moldura Fechada da
     luta nunca vai para o save. O número de mundo (wg) não muda aqui. */

while (ZONE_NAMES.length < PS_ZONE0 + 4) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
['A Casa que Não Era', 'Os Corredores Sem Fim', 'Os Quartos Esquecidos', 'A Galeria dos Espelhos'].forEach((n, k) => { ZONE_NAMES[PS_ZONE0 + k] = n; });
['você já morou aqui?', 'você já passou por aqui', 'fale baixo', 'ele está atrás de você'].forEach((n, k) => { ZONE_SUB[PS_ZONE0 + k] = n; });

{ const _mk = makeSave; makeSave = function () {
  const o = _mk();
  o.semRosto = { dead: srState.dead };
  o.pesadelo = { lacos: [...psLoopUndone], acordados: [...psAwakeSet] };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== PS_BARREIRA);
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.sr) bossFight = null;
  srBoss = null; srAlly = null; psDoorFx = null; psFade = 0;
  for (const k in psNoise) delete psNoise[k];
  psLoopUndone.clear(); psAwakeSet.clear(); psHist.length = 0;
  srState.dead = !!(sv && sv.semRosto && sv.semRosto.dead);
  const P = sv && sv.pesadelo;
  if (P) { for (const id of P.lacos || []) psLoopUndone.add(id); for (const id of P.acordados || []) psAwakeSet.add(id); }
  return _nw(sd, sv);
}; }
