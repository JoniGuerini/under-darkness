'use strict';

/* ================= a Prisão dos Deuses: nomes das zonas e save =================
   Carrega depois do 299 (o save da Cidade dos Antigos) e antes do 310:
   - os nomes das zonas 85 a 88 entram por índice (as camadas novas podem chegar em qualquer ordem); os buracos que
     ainda faltarem ficam vazios
   - o save do Lobo Atado: só `prisao_chefe.dead`. Enquanto ele vive, os blocos da Cova não vão para o save (a sala é
     montada de novo ao carregar). O número de mundo (wg) não muda aqui: quem junta as camadas sobe o número uma vez só. */

while (ZONE_NAMES.length < PD_ZONE0 + 4) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
[['As Correntes Suspensas', 'pontes que ninguém forjou para andar'], ['As Celas de Pedra Viva', 'as grades foram arrebentadas por dentro'], ['O Salão dos Gigantes', 'eles ainda respiram, devagar'], ['O Tártaro', 'o fundo de onde nada volta']]
  .forEach(([n, s], k) => { ZONE_NAMES[PD_ZONE0 + k] = n; ZONE_SUB[PD_ZONE0 + k] = s; });

{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.prisao_chefe = { dead: pdChefe.dead };
  if (!pdChefe.dead && o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([idx]) => !inPdHall(idx % WW, (idx / WW) | 0, 0));
  return o;
}; }
// o estado entra antes da geração (a Cova é vestida já sabendo se o lobo caiu)
{ const _nw = newWorld; newWorld = function (sd, sv) {
  pdChefe.dead = !!(sv && sv.prisao_chefe && sv.prisao_chefe.dead);
  return _nw(sd, sv);
}; }
