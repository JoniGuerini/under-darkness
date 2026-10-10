'use strict';

/* ================= diagnóstico: o que aconteceu quando o jogo pesou ou travou (2026-10-10) =================
   Fica quieto. Guarda os últimos erros, o pior quadro de cada segundo e um retrato do jogo quando os quadros
   param de vir com a aba visível (tela congelada com o som tocando). Tudo vai para localStorage 'ud-diag',
   então sobrevive a recarregar a página depois de um travamento. F9 mostra/esconde o painel com o texto e um
   botão para copiar. Carrega por último. */
(() => {
  const D = { erros: [], travadas: [], seg: [] };
  try { const o = JSON.parse(localStorage.getItem('ud-diag')); if (o && o.travadas) { D.antes = { erros: o.erros, travadas: o.travadas, seg: (o.seg || []).slice(-10) }; } } catch (e) { }
  const nota = () => {
    const r = { t: new Date().toLocaleTimeString(), estado: typeof state !== 'undefined' ? state : '?' };
    try { r.y = Math.round(pl.y / T); r.zona = typeof zoneAt === 'function' ? zoneAt(Math.floor(pl.x / T), Math.floor(pl.y / T)) : '?'; } catch (e) { }
    try { r.monstros = enemies.length; r.particulas = parts.length; r.tiros = projs.length; r.pedacos = chunks.size; r.arma = equip.weapon ? equip.weapon.id : null; } catch (e) { }
    try { if (performance.memory) r.memMB = Math.round(performance.memory.usedJSHeapSize / 1e6); } catch (e) { }
    return r;
  };
  const erro = (msg, onde) => { D.erros.push(Object.assign(nota(), { msg: String(msg).slice(0, 300), onde: String(onde || '').slice(0, 200) })); if (D.erros.length > 8) D.erros.shift(); };
  addEventListener('error', e => erro(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => erro(e.reason && e.reason.message || e.reason, 'promise'));

  // quadros: quantos por segundo e o pior
  let lastF = performance.now(), n = 0, pior = 0, t0 = performance.now();
  (function f(now) { const d = now - lastF; lastF = now; n++; if (d > pior) pior = d; requestAnimationFrame(f); })(performance.now());
  setInterval(() => {
    const now = performance.now();
    if (now - t0 >= 1000) { D.seg.push([Math.round(n * 1000 / (now - t0)), Math.round(pior)]); if (D.seg.length > 60) D.seg.shift(); n = 0; pior = 0; t0 = now; }
    // aba visível e nenhum quadro há 1,5 s: a tela congelou
    if (!document.hidden && now - lastF > 1500) { const ult = D.travadas[D.travadas.length - 1]; if (!ult || now - ult._at > 5000) { D.travadas.push(Object.assign(nota(), { _at: now, semQuadroMs: Math.round(now - lastF) })); if (D.travadas.length > 6) D.travadas.shift(); } else ult.semQuadroMs = Math.round(now - lastF); }
  }, 250);
  setInterval(() => { try { localStorage.setItem('ud-diag', JSON.stringify(D)); } catch (e) { } }, 2000);

  // F9: o painel
  let box = null;
  const texto = () => JSON.stringify(Object.assign({ agora: nota(), ua: navigator.userAgent }, D), null, 1);
  addEventListener('keydown', e => {
    if (e.code !== 'F9') return; e.preventDefault();
    if (box) { box.remove(); box = null; return; }
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;right:12px;top:12px;z-index:99999;width:420px;max-height:70vh;display:flex;flex-direction:column;gap:6px;padding:10px;background:#120d12;border:2px solid #000;color:#e8dcc8;font:12px monospace';
    const pre = document.createElement('pre'); pre.style.cssText = 'margin:0;overflow:auto;white-space:pre-wrap'; pre.textContent = texto();
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Copiar';
    b.onclick = () => { try { navigator.clipboard.writeText(texto()); b.textContent = 'Copiado'; } catch (err) { } };
    box.append(pre, b); document.body.appendChild(box);
  });
  window.__diag = D;
})();
