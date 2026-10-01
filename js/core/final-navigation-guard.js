/* Genius Property — final navigation guard.
 * Form pages are no longer pages. They always open the canonical drawers.
 */
(function(){
  'use strict';
  function openOwner(id){
    if(window.GPV10 && typeof window.GPV10.renderOwner === 'function'){
      window.GPV10.renderOwner(id || null); return true;
    }
    return false;
  }
  function openBien(id){
    if(window.GPV10 && typeof window.GPV10.renderBien === 'function'){
      window.GPV10.renderBien(id || null); return true;
    }
    return false;
  }
  function hideFormPages(){
    ['page-nv-bien','page-nv-proprietaire'].forEach(function(id){
      var el=document.getElementById(id); if(el){el.classList.remove('active'); el.style.display='none';}
    });
  }
  function route(page){
    if(page==='nv-bien'){ hideFormPages(); return openBien(null); }
    if(page==='nv-proprietaire'){ hideFormPages(); return openOwner(null); }
    return false;
  }
  function patchNavigation(){
    var oldNav=window.navigate;
    if(typeof oldNav==='function' && !oldNav.__cleanFormsGuard){
      function nav(page){
        if(route(page)) return page;
        return oldNav.apply(this, arguments);
      }
      nav.__cleanFormsGuard=true;
      window.navigate=nav;
    }
    var oldRender=window.renderPage;
    if(typeof oldRender==='function' && !oldRender.__cleanFormsGuard){
      function render(page){
        if(route(page)) return;
        return oldRender.apply(this, arguments);
      }
      render.__cleanFormsGuard=true;
      window.renderPage=render;
    }
  }
  document.addEventListener('click',function(e){
    var el=e.target && e.target.closest ? e.target.closest('[data-page],button,a,[onclick]') : null;
    if(!el) return;
    var dp=el.getAttribute('data-page') || '';
    var oc=el.getAttribute('onclick') || '';
    var text=(el.textContent||'').trim().toLowerCase();
    var owner=dp==='nv-proprietaire' || /nv-proprietaire/.test(oc) || /nouveau propriétaire/.test(text);
    var bien=dp==='nv-bien' || /nv-bien/.test(oc) || /nouveau bien|ajouter un bien/.test(text);
    if(owner){e.preventDefault();e.stopImmediatePropagation();openOwner(null);hideFormPages();return;}
    if(bien){e.preventDefault();e.stopImmediatePropagation();openBien(null);hideFormPages();return;}
  },true);
  function install(){
    patchNavigation();
    hideFormPages();
    var tries=0, timer=setInterval(function(){
      patchNavigation();
      tries++; if(tries>40) clearInterval(timer);
    },100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
