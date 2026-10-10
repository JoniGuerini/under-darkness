'use strict';

/* ================= tipos de dano: veneno, frio e fogo (e as resistências dos elixires) =================
   O jogo não tinha tipos de dano; aqui cada golpe no herói ganha um, só para as resistências funcionarem:
   - golpe de bicho (src no hurtPlayer): pelo tipo do bicho, na tabela `DMG_KIND`;
   - projétil, explosão, nuvem (src nulo): pelo que estava rodando na hora. As funções que movem vômito, teia,
     estilhaços de gelo, o sopro e os sincelos do Yeti Ancestral, as bombas e o gás são embrulhadas e marcam
     `dmgCtx` enquanto rodam; nas bolas de fogo comuns (`projs`) vale a que está encostando no herói.
   - `pl.res = { veneno, frio, fogo }` (0 a 0,75) vem dos elixires (js/95-alquimia-uso.js, `ALQ[id].res`) e corta
     o dano antes da armadura. A nuvem do fungo envenena direto na vida: com resistência ela passa mais rápido.
   - Elixir da Geada também tira a lentidão do gelo (`icSlowT`); Elixir da Peçonha envenena quem leva golpe
     corpo a corpo (4 s, um terço do dano mínimo por segundo).
   Carrega depois do 96-alquimista. */

const DMG_KIND = {
  vomit: 'veneno', aranha: 'veneno', cuspideira: 'veneno', filhote: 'veneno', centopeia: 'veneno', sapo: 'veneno', maeteia: 'veneno',
  espirito: 'frio', sincelo: 'frio', sentinela: 'frio', wendigo: 'frio',
  skull: 'fogo', lampiao: 'fogo', grisu: 'fogo',
  diabrete: 'fogo', caoinferno: 'fogo', vermemagma: 'fogo', cultista: 'fogo', salamandra: 'fogo', moscas: 'veneno', principecaos: 'fogo'
};
const DMG_COL = { veneno: '#9ad83a', frio: '#a8dcf4', fogo: '#ffa040' };
let dmgCtx = null;
pl.res = { veneno: 0, frio: 0, fogo: 0 };

function dmgKindOf(src, isProj) {
  if (src) return DMG_KIND[src.type] || null;
  if (dmgCtx) return dmgCtx;
  if (isProj) for (const o of projs) if (o.owner === 'enemy' && o.kind === 'fire' && Math.abs(o.x - (pl.x + pl.w / 2)) < pl.w / 2 + 6 && o.y > pl.y - 6 && o.y < pl.y + pl.h + 6) return 'fogo';
  return null;
}
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const k = dmgKindOf(src, isProj), r = k && pl.res ? pl.res[k] || 0 : 0;
  if (r > 0 && dmg > 0) dmg = Math.max(1, Math.round(dmg * (1 - r)));
  return _hp(dmg, srcX, src, isProj);
}; }

// roda `f` com um tipo de dano marcado (e devolve o anterior no fim, mesmo se der erro)
const withKind = (kind, f) => function () { const o = dmgCtx; dmgCtx = kind; try { return f.apply(this, arguments); } finally { dmgCtx = o; } };
{
  const H = HOOK.update, swap = (test, kind) => { const i = H.findIndex(test); if (i >= 0) H[i] = withKind(kind, H[i]); };
  if (typeof uvUpdate === 'function') swap(f => f === uvUpdate, 'veneno');   // vômito do zumbi
  if (typeof cvUpdate === 'function') swap(f => f === cvUpdate, 'veneno');   // teia cuspida das aranhas
  if (typeof cvnUpdate === 'function') swap(f => f === cvnUpdate, 'veneno'); // fungo; as bombas dentro viram fogo abaixo
  if (typeof icUpdate === 'function') swap(f => f === icUpdate, 'frio');     // estilhaços, pedras e ondas de gelo
  swap(f => /yetiFx\.icicles/.test(String(f)), 'frio');                      // sopro e sincelos do Yeti Ancestral
}
if (typeof gbBoom === 'function') gbBoom = withKind('fogo', gbBoom);
if (typeof mnGasBoom === 'function') mnGasBoom = withKind('fogo', mnGasBoom);
if (typeof rgBreak === 'function') rgBreak = withKind('fogo', rgBreak);

HOOK.update.push(dt => {
  if (pl.dead) return;
  const E = pl.elix || {};
  // a nuvem do fungo tira vida direto: com resistência a veneno ela acaba antes
  if (typeof fgPoisonT !== 'undefined' && fgPoisonT > 0 && pl.res && pl.res.veneno > 0) fgPoisonT -= dt * pl.res.veneno / (1 - pl.res.veneno);
  if (E.elixir_geada && typeof icSlowT !== 'undefined' && icSlowT > 0) icSlowT = 0;
  // o veneno da peçonha nos bichos
  for (const e of enemies) {
    if (!(e.alqPoi > 0) || e.dead) continue;
    e.alqPoi -= dt; e.alqPoiT -= dt;
    if (Math.random() < dt * 10) parts.push({ x: e.x + rnd(0, e.w), y: e.y + rnd(0, e.h * 0.6), vx: rnd(-5, 5), vy: rnd(-18, -6), g: -10, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#9ad83a' : '#5a9a1a', size: 1 });
    if (e.alqPoiT <= 0) {
      e.alqPoiT += 1;
      const d = Math.max(1, Math.round((pl.dmgMin || 1) / 3));
      e.hp -= d; e.flash = 0.06; e.showHp = 3; e.memT = 4;
      floatText(e.x + e.w / 2, e.y - 4, String(d), DMG_COL.veneno, 0.8);
      if (e.hp <= 0) killEnemy(e);
    }
  }
});
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (melee && e && !e.dead && e.hp < hp0 && pl.elix && pl.elix.elixir_peconha) { if (!(e.alqPoi > 0)) e.alqPoiT = 1; e.alqPoi = 4; }
  return r;
}; }
