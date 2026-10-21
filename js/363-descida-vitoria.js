'use strict';

/* ================= a vitória sobre o chefe abre o caminho para baixo (2026-10-21) =================
   Era o fim do 353, mas os chefes que carregam depois dele (Cervo, Autômato, Dama, Leviatã, Cinzarel, Arquiteto,
   Último Titã e os das camadas novas) embrulham o endBossFight e respondem sozinhos, sem chamar o de baixo: a
   vitória deles nunca chegava aqui. Este arquivo carrega depois de todos os chefes, logo antes do 355. */
{ const _eb = endBossFight; endBossFight = function (won) {
  const F = bossFight, e = F && F.e;
  const r = _eb.apply(this, arguments);
  if (won && e) {
    const k = genCamadaDe(Math.floor((e.y + e.h / 2) / T));
    if (k >= 0) { const id = LAYERS[k].id; descida.vencidos.add(id); rotaAbre(id); saveGame(); }
  }
  return r;
}; }
