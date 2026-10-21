'use strict';

/* ================= a Necrópole do Rei Eterno: nomes das zonas e save =================
   As zonas 81 a 84 são a reserva da Necrópole (00-revamp). Cada camada escreve os nomes no próprio índice (e não com
   push): assim a ordem em que os arquivos carregam não troca os nomes. Buracos que ninguém preencheu ficam ''.
   O save: a chave do chefe é `reiEterno` (387), só { dead }. O número de mundo (wg) não sobe aqui: o 362 já refaz os
   mundos antigos. */

for (let z = 0; z < NC_ZONE0 + 4; z++) { if (ZONE_NAMES[z] === undefined) ZONE_NAMES[z] = ''; if (ZONE_SUB[z] === undefined) ZONE_SUB[z] = ''; }
NC_BAND_TITLES.forEach((n, k) => { ZONE_NAMES[NC_ZONE0 + k] = n; });
['aqui o reino inteiro veio deitar', 'cada nicho tem um nome', 'o exército espera a ordem', 'o rei não deitou'].forEach((n, k) => { ZONE_SUB[NC_ZONE0 + k] = n; });
