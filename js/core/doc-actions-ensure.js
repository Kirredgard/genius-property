/* GP — Garantit l'icône Documents dans les renderers réellement affichés. */
(function(){
  'use strict';
  if (window.__gpDocActionsEnsure) return;
  window.__gpDocActionsEnsure = true;
  function hasDoc(container){ return !!container.querySelector('[data-gp-doc-action], .icon-doc, .docs, [title="Documents"]'); }
  function parseIdx(container, key){
    const html = container.innerHTML || '';
    let m = html.match(new RegExp("(?:viewRow|editRow|delRow)\\\\?\\.?\\s*\\(\\s*['\\\"]"+key+"['\\\"]\\s*,\\s*(\\d+)", 'i'));
    if(!m) m = html.match(new RegExp("(?:viewRow|editRow|delRow)\\s*\\(\\s*['\\\"]"+key+"['\\\"]\\s*,\\s*(\\d+)", 'i'));
    if(!m) m = html.match(/openProprietaireDetail\((\d+)\)/i);
    return m ? parseInt(m[1],10) : -1;
  }
  function makeBtn(key, idx, cls){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls || 'icon-btn icon-doc';
    b.title = 'Documents';
    b.setAttribute('data-gp-doc-action','1');
    b.innerHTML = '<span class="material-symbols-rounded">folder</span>';
    b.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(typeof window.openEntityDocs==='function') window.openEntityDocs(key, idx); });
    return b;
  }
  function ensureInPage(pageId, key, selector, cls){
    const page = document.getElementById(pageId); if(!page) return;
    page.querySelectorAll(selector).forEach(function(actions){
      if(hasDoc(actions)) return;
      const idx = parseIdx(actions, key); if(idx < 0) return;
      const del = actions.querySelector('[title="Supprimer"], .del, .icon-delete');
      const btn = makeBtn(key, idx, cls);
      if(del && del.parentNode === actions) actions.insertBefore(btn, del); else actions.appendChild(btn);
    });
  }
  function ensureDocActions(){
    ensureInPage('page-locataires', 'locataires', '.prop-actions, .loc-actions, .actions', 'prop-action-btn docs');
    ensureInPage('page-proprietaires', 'proprietaires', '.prop-actions, .actions', 'prop-action-btn docs');
    ensureInPage('page-employes', 'employes', '.emp-actions, .actions', 'emp-action-btn docs');
  }
  window.ensureDocActions = ensureDocActions;
  ['renderLocatairesModern','renderProprietairesModern','renderEmployesModern'].forEach(function(name){
    const old = window[name];
    if(typeof old === 'function' && !old.__gpDocWrapped){
      const wrapped = function(){ const r = old.apply(this, arguments); setTimeout(ensureDocActions, 0); return r; };
      wrapped.__gpDocWrapped = true;
      window[name] = wrapped;
    }
  });
  const oldNavigate = window.navigate;
  if(typeof oldNavigate === 'function' && !oldNavigate.__gpDocWrapped){
    const nav = function(){ const r = oldNavigate.apply(this, arguments); setTimeout(ensureDocActions, 80); setTimeout(ensureDocActions, 400); return r; };
    nav.__gpDocWrapped = true; window.navigate = nav;
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(ensureDocActions, 0); setTimeout(ensureDocActions, 500); });
  window.addEventListener('gp:auth-changed', function(){ setTimeout(ensureDocActions, 300); });
  try{
    new MutationObserver(function(){ clearTimeout(window.__gpDocActionsTimer); window.__gpDocActionsTimer=setTimeout(ensureDocActions,50); })
      .observe(document.body, {childList:true, subtree:true});
  }catch(e){}
})();
