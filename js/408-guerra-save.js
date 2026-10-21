'use strict';

/* ================= o Campo da Última Guerra: nomes das zonas =================
   As zonas 89 a 92 são do Campo. Várias camadas foram feitas ao mesmo tempo, então os nomes entram pelo número (nunca
   por push): os buracos que ninguém preencheu ficam com ''. O número do mundo (wg) não muda aqui; a morte do General fica
   em generalCaido (406). */

{
  const N = ['Campo das Lâminas', 'Bastiões Partidos', 'A Brecha', 'O Último Estandarte'];
  const S = ['as espadas ainda estão onde caíram', 'ninguém rendeu estas muralhas', 'o inferno subiu por aqui', 'a guerra ainda não acabou'];
  for (let i = 0; i < GU_ZONE0 + 4; i++) { if (ZONE_NAMES[i] === undefined) ZONE_NAMES[i] = ''; if (ZONE_SUB[i] === undefined) ZONE_SUB[i] = ''; }
  for (let k = 0; k < 4; k++) { ZONE_NAMES[GU_ZONE0 + k] = N[k]; ZONE_SUB[GU_ZONE0 + k] = S[k]; }
}
