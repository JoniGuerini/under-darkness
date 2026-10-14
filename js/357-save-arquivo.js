'use strict';

/* ================= save em arquivo: exportar e importar personagens =================
   Exportar baixa o save de um personagem num .json; Importar lê um .json e cria um personagem NOVO com ele,
   sem nunca sobrescrever um que já existe (dá para testar o save de um amigo sem perder o seu).
   O arquivo é { tipo, versao, save }, com o save igual ao de 'ud-save-<id>' (120-personagens).
   Os botões ficam na lista Carregar da tela de início (39-titulo). */
const SAVE_ARQ_TIPO = 'under-darkness-save';
function charExport(id) {
  const c = chars.list.find(q => q.id === id); if (!c) return false;
  let sv = null; try { sv = JSON.parse(localStorage.getItem(charKey(id))); } catch (e) { }
  if (!sv) return false;
  const arq = { tipo: SAVE_ARQ_TIPO, versao: typeof VERSAO === 'string' ? VERSAO : '', save: sv };
  const url = URL.createObjectURL(new Blob([JSON.stringify(arq)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `Under Darkness - ${charName(c)} - Nivel ${c.lvl}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
// devolve o id do personagem novo, ou null quando o texto não é um save
function charImport(texto) {
  let v; try { v = JSON.parse(texto); } catch (e) { return null; }
  const sv = v && v.tipo === SAVE_ARQ_TIPO ? v.save : v;
  if (!sv || typeof sv !== 'object' || typeof sv.seed !== 'number') return null;
  const n = chars.list.reduce((m, c) => Math.max(m, c.n), 0) + 1;
  const c = { id: chars.next, n, lvl: sv.p ? Math.max(1, sv.p.lvl | 0) : 1, gold: Math.max(0, sv.gold | 0), t: Date.now() };
  try { localStorage.setItem(charKey(c.id), JSON.stringify(sv)); } catch (e) { return null; }
  chars.next++; chars.list.push(c); charsWrite(chars);
  return c.id;
}
// abre o seletor de arquivo; resolve com o id novo ou null (não resolve se a pessoa cancelar)
function charImportFile() {
  return new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; if (!f) { res(null); return; }
      const r = new FileReader();
      r.onload = () => res(charImport(String(r.result))); r.onerror = () => res(null);
      r.readAsText(f);
    });
    inp.click();
  });
}
