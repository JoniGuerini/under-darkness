'use strict';

/* ================= a Prisão dos Deuses: como os bichos se desfazem (MORTE_TIPOS do 360) =================
   Carrega depois do 361 e antes do 355 (o 360 precisa estar carregado; não mexe nele). Pedra lasca em placas que quicam
   com pó; ferro solta elos e faíscas; carne espirra sangue e osso; o Lamento se desfaz no ar como fumaça violeta.
   O gigante (grande demais para a janela de 48 x 44 da foto do 360) e a serpe (o pescoço sai da janela) ficam de
   fora: morrem com a explosão de pó e faíscas do 394. */
Object.assign(MORTE_TIPOS, {
  carcereiro:   { px: 3, sp: 0.5, g: 640, bq: 0.45, ar: 0, placa: 1, faiscas: 8 },
  elos:         { px: 2, sp: 0.6, g: 600, bq: 0.5, ar: 0, faiscas: 6 },
  aguia:        { px: 2, sp: 0.45, g: 300, bq: 0.2, ar: 1.4, sangue: 8, osso: 3, flutua: 1 },
  condenado:    { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 10, osso: 4 },
  pedraviva:    { px: 3, sp: 0.5, g: 640, bq: 0.45, ar: 0, placa: 1 },
  cria:         { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 12, osso: 3 },
  lamento:      { px: 2, sp: 0.35, g: -30, bq: 0, ar: 2.4, flutua: 1 },
  acorrentador: { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 10, faiscas: 6 }
});
