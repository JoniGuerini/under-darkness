'use strict';

/* ================= As Ruínas dos Acendedores: nomes das zonas e save =================
   Carrega depois do save da Cidade dos Antigos (299):
   - os nomes das zonas 93 a 96 entram por índice (as camadas novas foram feitas ao mesmo tempo e chegam em qualquer
     ordem); os buracos que ainda faltarem ficam vazios
   - o save do Último Acendedor (`ultimoAcendedor.dead`) fica no 416, como o de todo chefe. O número de mundo (wg) não
     muda aqui: quem junta as camadas sobe o número uma vez só (o laço do 353 já zera todo chefe { dead } quando o mundo
     é refeito). */

while (ZONE_NAMES.length < AC_ZONE0 + 4) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
[['Os Faróis Caídos', 'ninguém mais vigia daqui'], ['As Ruas de Cinza', 'a cidade dorme de olhos abertos'], ['Os Templos da Chama', 'aqui se rezava para o fogo'], ['A Fornalha do Mundo', 'a última chama ainda arde']]
  .forEach(([n, s], k) => { ZONE_NAMES[AC_ZONE0 + k] = n; ZONE_SUB[AC_ZONE0 + k] = s; });
