'use strict';

/* ================= os monstros dormem em vez de sumir (2026-10-12) =================
   Pedido do Jonathan (2026-10-12): abrir um portal para a vila e voltar apagava os monstros de perto (o 13 tira quem
   fica a mais de 1,3 tela), e o bicho que ele queria matar pelo loot sumia. Agora quem sai do alcance dorme: sai da
   lista `enemies` inteiro (tipo, lugar, vida, nível, tudo) para `SONO`, onde não pensa, não anda e não é desenhado, e
   acorda igual quando o herói volta para perto. Dormindo não conta no limite de cada área (trySpawn), acordado conta.
   - Dorme um pouco antes da distância em que o 13 apagaria (então o 13 só apaga quem foge do céu aberto), e acorda um
     pouco mais perto que isso, para não ficar dormindo e acordando na borda.
   - Até SONO_MAX dormindo; passando disso, os mais antigos vão embora. Não vai no save: um mundo novo ou carregado
     começa sem ninguém dormindo. Chefes nunca dormem (não somem hoje também). Na luta com um chefe ninguém acorda
     (como o trySpawn, que também para).
   - Acordar onde o jogador pôs bloco ou onde virou lava: esse vai embora. Carrega antes do 24-boot. */
const SONO = [], SONO_MAX = 300;
function sonoLonge(e, pcx, pcy, kx, ky) { return Math.abs(pcx - (e.x + e.w / 2)) > VW * kx || Math.abs(pcy - (e.y + e.h / 2)) > VH * ky; }
{ const _ue = updateEnemies; updateEnemies = function (dt) {
  if (pl && state === 'play') {
    const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
    // longe: dorme
    for (let k = enemies.length - 1; k >= 0; k--) {
      const e = enemies[k];
      if (e.dead || e.boss || !sonoLonge(e, pcx, pcy, 1.22, 1.52)) continue;
      enemies.splice(k, 1); SONO.push(e);
    }
    if (SONO.length > SONO_MAX) SONO.splice(0, SONO.length - SONO_MAX);
    // perto de novo: acorda
    if (!bossFight) for (let k = SONO.length - 1; k >= 0; k--) {
      const e = SONO[k]; if (sonoLonge(e, pcx, pcy, 1.15, 1.45)) continue;
      SONO.splice(k, 1);
      const D = ET[e.type];
      if (!D || (!D.phase && rectSolid(e.x, e.y, e.w, e.h)) || lavaIn(e.x, e.y, e.w, e.h)) continue;
      e.vx = e.vy = 0; e.onGround = false; e.nav = null; e.navT = 0; e.seeT = 0; e.sees = false; e.memT = 0;
      enemies.push(e);
    }
  }
  return _ue(dt);
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) { SONO.length = 0; return _nw(sd, sv); }; }
