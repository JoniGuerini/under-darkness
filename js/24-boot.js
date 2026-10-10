'use strict';

/* ================= boot ================= */
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(innerWidth * dpr)), h = Math.max(1, Math.floor(innerHeight * dpr));
  cvs.width = w; cvs.height = h;
  S = Math.max(2, Math.round(h / 285));
  VW = Math.min(WW * T, Math.ceil(w / S)); VH = Math.min(WH * T, Math.ceil(h / S));
  low.width = VW; low.height = VH; lc.imageSmoothingEnabled = false; sc.imageSmoothingEnabled = false;
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
  if (state === 'play') { if (hitstop > 0) { hitstop -= dt; updateCamera(dt * 0.3); } else update(dt); }
  else if (state === 'menu' || state === 'dead') idleUpdate(dt);
  else if (state === 'inv') { updateParts(dt); if (invDirty) refreshInv(); }
  else if (state === 'talk' || state === 'char') { updateParts(dt); if (invDirty && (shopNpc || forgeNpc)) { refreshInv(); forgeDirty = true; } refreshForge(); }
  if (state !== 'menu' && state !== 'pause' && state !== 'dead') tickFurnace(dt);
  levelFlash = Math.max(0, levelFlash - dt * 1.2); hurtVig = Math.max(0, hurtVig - dt * 1.5);
  for (const k in pressed) pressed[k] = false;
  mouse.lPressed = false;
  try { render(); } catch (err) { console.error(err); }
  if (state !== 'menu') updateHUD();
}
function startPlaying() {
  initAudio();
  $('menu').hidden = true; $('hud').hidden = false; state = 'play'; last = performance.now();
  if (lastZone === -1) { const tx = Math.floor((pl.x + 4) / T), ty = Math.floor((pl.y + 10) / T), z = zoneAt(tx, ty); lastZone = z; lastVil = inVillage(tx, ty) && z === 0; const [a, b] = placeName(tx, ty); showBanner(a, b); }
  setTimeout(() => { if (!helpHidden) $('help').classList.add('min'); }, 25000);
  if (gearNews) { gearNews = false; setTimeout(() => toast('Novidade: itens com propriedades sorteadas! Cada equipamento que cai é único. Seus itens antigos ganharam propriedades de acordo com a raridade.', 'gold'), 2600); }
  if (ringNews) { ringNews = false; setTimeout(() => toast('Novidade: o mundo agora dá a volta. Andando sempre para um lado, você chega pelo outro. Para isso foi criado um mundo novo, mas seu nível, itens e equipamento continuam.', 'gold'), 900); }
  if (villageNews) { villageNews = false; setTimeout(() => toast('Novidade: a superfície agora é segura e tem um vilarejo com ferreiro, curandeira, taverneiro e ancião. Aperte E perto deles para conversar, comprar e vender.', 'gold'), 3600); }
  if (cathNews) { cathNews = false; setTimeout(() => toast('Novidade: debaixo do vilarejo agora há uma catedral soterrada. O mundo foi refeito para ela; seu nível, itens e ouro continuam.', 'gold'), 900); }
  if (mapNews) { mapNews = false; setTimeout(() => toast('Novidade: aperte Tab para abrir o mapa de tudo que você já explorou.', 'gold'), toolNews ? 5600 : 1600); }
  if (toolNews) { toolNews = false; setTimeout(() => toast('Novidade: aperte 2 (ou gire a rodinha) para pegar a picareta e segure o clique esquerdo para minerar. O E agora só abre baús.', 'gold'), 1600); }
}
function start(hot) {
  comp = mk(CW, CHT); cctx = comp.getContext('2d', { willReadFrequently: true }); cctx.imageSmoothingEnabled = false;
  buildSprites(); buildIcons(); paintCoinIcon(); buildBackdrop(); resize();
  try { muted = localStorage.getItem('sob-a-terra-mute') === '1'; } catch (e) { }
  $('btnSound').textContent = muted ? 'Som: desligado' : 'Som: ligado';
  const sv = migrateSave((hot && hot.save) || loadSave());
  if (sv && typeof sv.seed === 'number') { newWorld(sv.seed, sv); $('btnPlay').textContent = `Continuar · Nível ${pl.lvl}`; $('btnNewMenu').hidden = false; }
  else newWorld((Math.random() * 2 ** 31) | 0);
  if (matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches) $('touchNote').hidden = false;
  $('btnPlay').addEventListener('click', startPlaying);
  $('btnNewMenu').addEventListener('click', () => { newWorld((Math.random() * 2 ** 31) | 0); saveGame(); startPlaying(); });
  $('btnResume').addEventListener('click', resumeGame);
  $('btnSound').addEventListener('click', () => { initAudio(); toggleSound(); });
  $('btnFull').addEventListener('click', toggleFull);
  document.addEventListener('fullscreenchange', onFullChange); document.addEventListener('webkitfullscreenchange', onFullChange);
  $('btnNew').addEventListener('click', () => { if (!newArmed) { newArmed = true; $('btnNew').textContent = 'Clique de novo para apagar'; return; } resetNewBtn(); newWorld((Math.random() * 2 ** 31) | 0); saveGame(); $('pause').hidden = true; state = 'play'; last = performance.now(); });
  $('btnRespawn').addEventListener('click', respawn);
  $('hotbar').addEventListener('pointerdown', e => { e.preventDefault(); const d = e.target.closest('.slot'); if (d && state === 'play') { initAudio(); selectHB(+d.dataset.hb); } });
  addEventListener('resize', resize);
  addEventListener('beforeunload', saveGame);
  try { window.claude?.hot?.snapshot?.(() => ({ save: makeSave() })); } catch (e) { }
  requestAnimationFrame(t => { last = t; frame(t); });
  window.__game = { pl, enemies, get state() { return state; }, set state(v) { state = v; }, keys, mouse, tiles: () => tiles, surf: () => surf, spawnEnemy, startPlaying, hurtPlayer, gainXP, addItem, equip, get inv() { return inv; }, openInv, closeInv, NPCS, openTalk, closeTalk, get stock() { return stock; }, inVillage, get wt() { return worldTime; }, set wt(v) { worldTime = v; }, dropLoot, loot, openChest, quickAction, moveItem, sortInv, recalc, hb, selectHB, rollItem, mkItem, itemName, itemStats, addInst, dropGear, ITEMS, get mapOpen() { return mapOpen; }, get seen() { return seen; }, get bossFight() { return bossFight; }, endBossFight, makeSave, newWorld, get target() { return pl.target; }, tileAt, setTile };
}
const boot = d => start(d || {});
if (window.claude?.hot?.ready) window.claude.hot.ready(boot); else boot(window.claude?.hot?.data ?? {});
