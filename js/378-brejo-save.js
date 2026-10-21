'use strict';

/* ================= o Brejo das Bruxas: nomes das zonas, a água e o save =================
   As zonas 77 a 80 são a reserva do Brejo; os nomes vão no próprio índice (não com push), como as outras camadas
   novas, para a ordem de carga não trocar os nomes. Buracos que ninguém preencheu ficam ''.
   A água das poças, das lagoas e do Caldeirão: o 375 enche na geração, mas as ligações do 87 rodam depois e podem
   abrir um vão numa bacia; aqui ela enche de novo depois de cada leva que gerou o Brejo (genPos, 129). O tom da água
   do Brejo é preto-castanho (a turfa tinge).
   O save: a chave do chefe é `velhaBrejo` (376). O número de mundo (wg) não sobe aqui. */

for (let z = 0; z < BJ_ZONE0 + 4; z++) { if (ZONE_NAMES[z] === undefined) ZONE_NAMES[z] = ''; if (ZONE_SUB[z] === undefined) ZONE_SUB[z] = ''; }
['A Turfeira', 'As Palafitas', 'O Patíbulo', 'O Círculo de Pedras'].forEach((n, k) => { ZONE_NAMES[BJ_ZONE0 + k] = n; });
['a turfa guarda o que cai nela', 'as bruxas moravam em cima da água', 'aqui os caçadores enforcavam', 'a Velha ainda mexe o caldeirão'].forEach((n, k) => { ZONE_SUB[BJ_ZONE0 + k] = n; });

genPos(() => { if (BREJO) try { bjWater(); } catch (err) { console.error(err); } }, 'brejo');
aguaTom(ty => BREJO && ty >= BJ_S0 - 2 && ty < BJ_S0 + BJ_D, ['#060402', '#0e0a04', '#181008', '#22180c', '#2e2212', '#3e301c']);
