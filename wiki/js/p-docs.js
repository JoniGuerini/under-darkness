'use strict';

/* ================= documentos da pasta docs/ (cópia em js/docs.js) ================= */
(() => {
  UDW.docView = d => {
    if (!d) return '<p class="vazio">Documento não encontrado.</p>';
    const toc = [], body = UDW.md(d.texto, toc);
    return `<div class="doc"><aside class="toc">${toc.filter(t => t[0] <= 2).map(([n, t, id]) => `<a href="#/docs/${d.id}/${id}" class="t${n}">${UDW.esc(t)}</a>`).join('')}</aside><article class="md">${body}<p class="nota">Cópia de ${UDW.esc(d.arquivo)}.</p></article></div>`;
  };
  UDW.pages.docs = {
    render(id, anchor) {
      const d = UDW_DOCS.find(x => x.id === id) || UDW_DOCS[0];
      return UDW.head('Documentos') + UDW.tabs('docs', UDW_DOCS.map(x => [x.id, x.titulo]), d.id) + UDW.docView(d);
    },
    after(root, id, anchor) { if (anchor && $(anchor)) setTimeout(() => $(anchor).scrollIntoView(), 20); }
  };
})();
