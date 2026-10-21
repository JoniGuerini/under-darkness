'use strict';

/* ================= As Ruínas dos Acendedores: como os bichos se desfazem (360) =================
   Os dez bichos da camada no desfazer do 360: os loucos de manto soltam a fuligem e as últimas fagulhas, o alado perde
   as penas devagar no ar, o enxame se apaga em faíscas, o círio pinga, o forno racha em placas de tijolo que quicam e
   cospe as brasas de dentro, o braseiro faminto espalha a cinza e as brasas. Carrega depois do 360 e antes do 361. */

Object.assign(MORTE_TIPOS, {
  //              pedaço  força  gravidade  quica  ar     extra
  turibulo:     { px: 2, sp: 0.5, g: 540, bq: 0.25, ar: 0, sangue: 6, faiscas: 12 },
  faroleiro:    { px: 2, sp: 0.5, g: 540, bq: 0.25, ar: 0, sangue: 6, faiscas: 10 },
  acArauto:       { px: 2, sp: 0.5, g: 540, bq: 0.25, ar: 0, sangue: 6, faiscas: 8 },
  engolidor:    { px: 2, sp: 0.6, g: 560, bq: 0.2, ar: 0, sangue: 8, faiscas: 20 },
  alado:        { px: 2, sp: 0.4, g: 160, bq: 0.2, ar: 2, flutua: 1, faiscas: 6 },
  fagulhas:     { px: 1, sp: 0.7, g: 120, bq: 0.2, ar: 1.5, flutua: 1, faiscas: 18 },
  faminto:      { px: 2, sp: 0.55, g: 600, bq: 0.4, ar: 0, placa: 1, faiscas: 16 },
  fornoandante: { px: 3, sp: 0.55, g: 640, bq: 0.45, ar: 0, placa: 1, faiscas: 24 },
  cirio:        { px: 2, sp: 0.45, g: 480, bq: 0, ar: 0, gota: 1, faiscas: 6 },
  pavio:        { px: 2, sp: 0.4, g: 520, bq: 0.2, ar: 0, sangue: 4, faiscas: 8 }
});
