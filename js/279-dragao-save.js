'use strict';

/* ================= o Covil do Dragão: nomes das zonas =================
   As zonas 61 a 64 são do Covil. Várias camadas foram feitas ao mesmo tempo, então os nomes entram pelo número (nunca
   por push): os buracos que ninguém preencheu ficam com ''. O número do mundo (wg) não muda aqui: a troca de versão
   do save é feita uma vez só, quando as camadas novas forem juntadas. */

{
  const N = ['Chaminés de Vapor', 'Túneis Kobold', 'Tubos de Lava', 'Leito de Ouro'];
  const S = ['o mar ferve aqui embaixo', 'alguém cavou isto com as unhas', 'a pedra já correu por aqui', 'tudo isto tem dono'];
  for (let i = 0; i < DG_ZONE0 + 4; i++) { if (ZONE_NAMES[i] === undefined) ZONE_NAMES[i] = ''; if (ZONE_SUB[i] === undefined) ZONE_SUB[i] = ''; }
  for (let k = 0; k < 4; k++) { ZONE_NAMES[DG_ZONE0 + k] = N[k]; ZONE_SUB[DG_ZONE0 + k] = S[k]; }
}
