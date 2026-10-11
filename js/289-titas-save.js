'use strict';

/* ================= o Ossário dos Titãs: nomes das zonas e save =================
   As zonas 65 a 68 são a reserva do Ossário. As cinco camadas novas foram feitas ao mesmo tempo e cada uma escreve os
   nomes no próprio índice (e não com push): assim a ordem em que os arquivos carregam não troca os nomes. Buracos que
   ninguém preencheu ficam ''.
   O save: a chave do chefe é `ultimoTita` (287). O número de mundo (wg) não sobe aqui: as cinco camadas entram juntas e
   quem junta tudo sobe o wg uma vez só; o laço do 258 já zera todo chefe ({ dead }) quando o mundo é refeito. */

for (let z = 0; z < TT_ZONE0 + 4; z++) { if (ZONE_NAMES[z] === undefined) ZONE_NAMES[z] = ''; if (ZONE_SUB[z] === undefined) ZONE_SUB[z] = ''; }
['Campo das Costelas', 'A Espinha', 'Vale dos Crânios', 'Leito do Último'].forEach((n, k) => { ZONE_NAMES[TT_ZONE0 + k] = n; });
['aqui dentro já bateu um coração', 'não olhe para baixo', 'eles ainda olham para cima', 'ele ainda respira'].forEach((n, k) => { ZONE_SUB[TT_ZONE0 + k] = n; });
