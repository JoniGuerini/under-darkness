'use strict';

/* ================= a Cidade dos Antigos: nomes das zonas e save =================
   Carrega depois do save do Reino Élfico (258) e dos das outras camadas novas:
   - os nomes das zonas 69 a 72 entram por índice (as cinco camadas novas foram feitas ao mesmo tempo, então as zonas
     de cada uma podem chegar em qualquer ordem); os buracos que ainda faltarem ficam vazios
   - o save do Arquiteto (`arquiteto.dead`) fica no 297, como o de todo chefe. O número de mundo (wg) não muda aqui: quem junta as
     camadas sobe o número uma vez só. */

while (ZONE_NAMES.length < AT_ZONE0 + 4) { ZONE_NAMES.push(''); ZONE_SUB.push(''); }
[['As Escadarias', 'cada degrau foi medido'], ['A Cidade Inversa', 'o teto também é rua'], ['As Máquinas', 'ainda trabalham, para ninguém'], ['A Cratera da Estrela', 'ela ainda está quente por dentro']]
  .forEach(([n, s], k) => { ZONE_NAMES[AT_ZONE0 + k] = n; ZONE_SUB[AT_ZONE0 + k] = s; });

