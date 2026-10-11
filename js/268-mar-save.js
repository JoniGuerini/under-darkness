'use strict';

/* ================= o Mar Sem Sol: nomes das zonas e o tom da água =================
   Carrega depois do save do Reino (258):
   - os nomes das zonas 57 a 60 entram pelo índice (cinco camadas estão sendo feitas ao mesmo tempo, então cada uma
     escreve no seu lugar e só tapa com '' os buracos que ainda não existem)
   - a água do mar: azul-petróleo escuro em cima, quase preta na Fossa, avermelhada perto das Chaminés
   - o save: o número do mundo não muda aqui (a integração das cinco camadas troca o número uma vez só); o Leviatã
     guarda a morte em `leviata` (266) e volta vivo junto com os outros chefes quando o mundo é refeito. */

for (let z = 0; z < MS_ZONE0 + 4; z++) { if (ZONE_NAMES[z] === undefined) ZONE_NAMES[z] = ''; if (ZONE_SUB[z] === undefined) ZONE_SUB[z] = ''; }
['Praias Negras', 'Floresta de Algas', 'A Fossa', 'Chaminés Negras'].forEach((n, b) => { ZONE_NAMES[MS_ZONE0 + b] = n; });
['o mar que não tem céu', 'o chão balança', 'aqui embaixo, tudo enxerga', 'o fundo do mar ferve'].forEach((n, b) => { ZONE_SUB[MS_ZONE0 + b] = n; });

if (typeof aguaTom === 'function') {
  aguaTom(ty => MAR && ty >= MS_S0 && ty < MS_S0 + 98, ['#02060c', '#041020', '#081c34', '#0e2c4a', '#164264', '#2a6688']);
  aguaTom(ty => MAR && ty >= MS_S0 + 98 && ty < MS_S0 + 150, ['#010206', '#020610', '#040c1c', '#08142a', '#0e2038', '#1e3a58']);
  aguaTom(ty => MAR && ty >= MS_S0 + 150 && ty < MS_S0 + MS_D, ['#0a0404', '#140806', '#20100a', '#2e1a10', '#40281a', '#6a4430']);
}

// depois do worldLink (87): corda de subir no meio da água não serve (debaixo da água se nada), e deixa o mar cheio de
// riscos verticais; fica só o pedaço que sai da água (a célula de cima seca) e o que é da estrutura (msKeep)
let msCordaTirada = 0;
{ const _wl = worldLink; worldLink = function () {
  const r = _wl();
  if (MAR && agua.length) {
    let n = 0;
    for (let y = MS_S0 + 1; y < Math.min(WH - 1, MS_S0 + MS_D); y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (tiles[i] !== MS_CORDAME || !agua[i] || !agua[i - WW] || msKeep.has(i)) continue;
      tiles[i] = AIR; n++;
    }
    msCordaTirada = n;
  }
  return r;
}; }
