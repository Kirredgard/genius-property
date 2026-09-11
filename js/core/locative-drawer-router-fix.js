/* Genius Property — fix Nouvelle location: toujours utiliser le drawer moderne
   Cause: la page HTML legacy #page-nv-locative pouvait reprendre la main après certains hotfixs. */
(function(){
  'use strict';
  function openModernLocative(){
    try{
      document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
      var locPage = document.getElementById('page-locatives');
      if(locPage) locPage.classList.add('active');
      if(typeof window.renderLocativesFinal === 'function') setTimeout(window.renderLocativesFinal, 20);
      else if(typeof window.renderLocativesModernAligned === 'function') setTimeout(window.renderLocativesModernAligned, 20);
      else if(typeof window.renderLocativesModern === 'function') setTimeout(window.renderLocativesModern, 20);
      setTimeout(function(){
        if(typeof window.openGpDrawer === 'function') window.openGpDrawer('locative');
        else {
          var legacy = document.getElementById('page-nv-locative');
          if(legacy) legacy.classList.add('gp-legacy-form-blocked');
          if(typeof window.toast === 'function') window.toast('Formulaire moderne indisponible. Rechargez la page.', 'err');
        }
      }, 60);
    }catch(e){ console.warn('[GP] locative drawer route fix', e); }
  }

  function install(){
    if(window.__gpLocativeDrawerRouteFixed) return;
    window.__gpLocativeDrawerRouteFixed = true;

    var oldNav = window.navigate;
    window.navigate = function(page){
      if(page === 'nv-locative' || page === 'nouvelle-location'){
        openModernLocative();
        return page;
      }
      return oldNav ? oldNav.apply(this, arguments) : undefined;
    };

    var oldRenderPage = window.renderPage;
    window.renderPage = function(page){
      if(page === 'nv-locative' || page === 'nouvelle-location'){
        openModernLocative();
        return page;
      }
      return oldRenderPage ? oldRenderPage.apply(this, arguments) : undefined;
    };

    if(window.GPNavigation && typeof window.GPNavigation.registerRenderer === 'function'){
      window.GPNavigation.registerRenderer('nv-locative', openModernLocative);
    }

    document.addEventListener('click', function(ev){
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-page="nv-locative"], a[href="#nv-locative"]') : null;
      if(!el) return;
      ev.preventDefault();
      ev.stopPropagation();
      openModernLocative();
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', install);
})();
