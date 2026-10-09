'use strict';

/* ================= scrollbars drawn by the game, not the browser =================
   customScroll(el) wraps a scrolling box, hides the native bar (css/rolagem.css) and lays a rail and a thumb over it.
   The thumb drags, the rail pages, and it follows wheel, keyboard and content changes on its own. */
function customScroll(el) {
  if (!el || el._sb) return;
  const wrap = document.createElement('div'); wrap.className = 'sbwrap';
  el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
  const bar = document.createElement('div'); bar.className = 'sbar'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>';
  wrap.appendChild(bar); el._sb = bar;
  const th = bar.firstChild;
  const upd = () => {
    const h = el.clientHeight, H = el.scrollHeight, show = H > h + 1;
    wrap.classList.toggle('scrolls', show); if (!show) return;
    const rail = bar.clientHeight, tH = Math.max(28, Math.round(rail * h / H));
    th.style.height = tH + 'px';
    th.style.transform = `translateY(${Math.round((rail - tH) * el.scrollTop / (H - h))}px)`;
  };
  el.addEventListener('scroll', upd, { passive: true });
  new ResizeObserver(upd).observe(el);
  new MutationObserver(upd).observe(el, { childList: true, subtree: true });
  th.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); th.setPointerCapture(e.pointerId); th.classList.add('drag');
    const y0 = e.clientY, s0 = el.scrollTop;
    const mv = ev => { const k = (el.scrollHeight - el.clientHeight) / Math.max(1, bar.clientHeight - th.offsetHeight); el.scrollTop = s0 + (ev.clientY - y0) * k; };
    const up = () => { th.classList.remove('drag'); th.removeEventListener('pointermove', mv); th.removeEventListener('pointerup', up); th.removeEventListener('pointercancel', up); };
    th.addEventListener('pointermove', mv); th.addEventListener('pointerup', up); th.addEventListener('pointercancel', up);
  });
  bar.addEventListener('pointerdown', e => {
    if (e.target !== bar) return; e.preventDefault(); e.stopPropagation();
    const r = th.getBoundingClientRect(); el.scrollBy({ top: (e.clientY < r.top ? -1 : 1) * el.clientHeight * 0.85, behavior: 'smooth' });
  });
  upd();
}
['profList', 'pdBody'].forEach(id => customScroll($(id)));
