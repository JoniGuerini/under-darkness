'use strict';

/* ================= o Campo da Última Guerra: como os dez se desfazem ao morrer =================
   Carrega depois do 360. Os caídos de armadura racham em placas de ferro que quicam e soltam faíscas; os de carne
   espirram sangue escuro e ossos; o serafim se desfaz devagar no ar como penas; a lâmina se parte em lascas de aço. */
Object.assign(MORTE_TIPOS, {
  gu_cavaleiro:       { px: 3, sp: 0.55, g: 620, bq: 0.45, ar: 0, sangue: 6, placa: 1, faiscas: 8 },
  gu_arqueiro:        { px: 2, sp: 0.55, g: 560, bq: 0.3, ar: 0, sangue: 8, osso: 4 },
  gu_portaestandarte: { px: 3, sp: 0.5, g: 600, bq: 0.4, ar: 0, sangue: 6, placa: 1, faiscas: 10 },
  gu_enterrado:       { px: 2, sp: 0.5, g: 580, bq: 0.25, ar: 0, osso: 8 },
  gu_penitente:       { px: 2, sp: 0.6, g: 560, bq: 0.3, ar: 0, sangue: 14, osso: 3 },
  gu_serafim:         { px: 2, sp: 0.4, g: 120, bq: 0.2, ar: 2.4, flutua: 1, faiscas: 10 },
  gu_corvos:          { px: 1, sp: 0.45, g: 200, bq: 0.2, ar: 1.6, sangue: 4, flutua: 1 },
  gu_cerco:           { px: 3, sp: 0.6, g: 640, bq: 0.4, ar: 0, sangue: 14, placa: 1, osso: 6 },
  gu_clerigo:         { px: 2, sp: 0.5, g: 520, bq: 0.3, ar: 0.6, sangue: 8, faiscas: 12 },
  gu_lamina:          { px: 2, sp: 0.6, g: 640, bq: 0.5, ar: 0, placa: 1, faiscas: 14 }
});
