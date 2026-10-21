'use strict';

/* ================= os mortos da Necrópole se desfazem ao morrer (2026-10-21) =================
   O 360 desfaz o desenho do bicho em pedaços das cores dele. Aqui entram os 10 da Necrópole (383 e 384), pela tabela
   do 360 (MORTE_TIPOS), sem mexer nele:
   - os da legião (legionário, cavaleiro, arauto) racham em placas de armadura que quicam e soltam lascas de osso;
   - o embalsamador e o coveiro se desfazem em pó de osso e terra; o necromante e o escriba se desfazem no ar como
     cinza, com as faíscas verdes da alma que sai;
   - a mortalha cai devagar, pano solto no ar; a gaveta racha em lascas de pedra e osso; o fogo-fátuo apaga em faíscas.
   Os erguidos de novo pelo embalsamador e os chamados pelo Rei Eterno usam a mesma tabela. Carrega depois do 360. */
Object.assign(MORTE_TIPOS, {
  legionario:   { px: 2, sp: 0.55, g: 600, bq: 0.4, ar: 0, osso: 10, placa: 1 },
  cavaleiro:    { px: 3, sp: 0.5, g: 640, bq: 0.45, ar: 0, osso: 12, placa: 1 },
  arauto:       { px: 2, sp: 0.55, g: 600, bq: 0.4, ar: 0, osso: 8 },
  embalsamador: { px: 2, sp: 0.5, g: 560, bq: 0.25, ar: 0, osso: 6, sangue: 6 },
  coveiro:      { px: 2, sp: 0.5, g: 580, bq: 0.3, ar: 0, osso: 8, sangue: 4 },
  necromante:   { px: 2, sp: 0.45, g: 260, bq: 0.2, ar: 1.6, flutua: 1, esporos: 18 },
  escriba:      { px: 2, sp: 0.45, g: 280, bq: 0.2, ar: 1.6, flutua: 1, esporos: 14 },
  ncMortalha:   { px: 2, sp: 0.35, g: 120, bq: 0, ar: 2.4, flutua: 1 },
  gaveta:       { px: 2, sp: 0.6, g: 620, bq: 0.4, ar: 0, osso: 8 },
  ncFatuo:      { px: 1, sp: 0.5, g: 90, bq: 0, ar: 2.6, flutua: 1, esporos: 10 }
});
