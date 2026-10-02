
/*
 * Genius Property — Mobile surgical V6
 * This file intentionally does nothing above 768px.
 * It fixes only quick-actions closing, mobile form escape/navigation,
 * and a few iPhone-specific interaction issues.
 */
(function(){
  'use strict';

  var MOBILE_MAX = 768;

  function isMobile(){
    return window.innerWidth <= MOBILE_MAX;
  }

  function qs(s){ return document.querySelector(s); }

  function closeQuickActions(){
    var menu = qs('#gpMobilePlusMenu');
    if(menu) menu.classList.remove('active');
    var backdrop = qs('.gp-mobile-plus-backdrop');
    if(backdrop) backdrop.classList.remove('active');
    var plus = qs('#gpMobilePlusBtn');
    if(plus) plus.setAttribute('aria-expanded','false');
  }

  function openQuickActions(){
    if(!isMobile()) return;
    var menu = qs('#gpMobilePlusMenu');
    if(!menu){
      /* Let the original mobile controller create it. */
      var plus = qs('#gpMobilePlusBtn');
      if(plus) plus.click();
      setTimeout(openQuickActions, 0);
      return;
    }

    var backdrop = qs('.gp-mobile-plus-backdrop');
    if(!backdrop){
      backdrop = document.createElement('div');
      backdrop.className = 'gp-mobile-plus-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', closeQuickActions);
    }

    var close = menu.querySelector('.gp-mobile-plus-close');
    if(!close){
      close = document.createElement('button');
      close.type = 'button';
      close.className = 'gp-mobile-plus-close';
      close.innerHTML =
        '<span>Actions rapides</span>' +
        '<span class="material-symbols-rounded">close</span>';
      menu.insertBefore(close, menu.firstChild);
      close.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        closeQuickActions();
      });
    }

    menu.classList.add('active');
    backdrop.classList.add('active');

    var plus = qs('#gpMobilePlusBtn');
    if(plus) plus.setAttribute('aria-expanded','true');
  }

  function toggleQuickActions(){
    var menu = qs('#gpMobilePlusMenu');
    if(menu && menu.classList.contains('active')){
      closeQuickActions();
    }else{
      openQuickActions();
    }
  }

  function bindQuickActions(){
    if(!isMobile()) return;

    var plus = qs('#gpMobilePlusBtn');
    if(plus && !plus.dataset.gpV6Bound){
      plus.dataset.gpV6Bound = '1';

      /* Replace any previous onclick handler. */
      plus.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        toggleQuickActions();
        return false;
      };

      plus.setAttribute('aria-expanded','false');
      plus.setAttribute('aria-controls','gpMobilePlusMenu');
    }

    var menu = qs('#gpMobilePlusMenu');
    if(menu && !menu.dataset.gpV6Bound){
      menu.dataset.gpV6Bound = '1';

      /* Any quick-action navigation must close the menu first. */
      menu.addEventListener('click', function(e){
        var btn = e.target.closest('button[data-page]');
        if(btn){
          closeQuickActions();
        }
      });
    }
  }

  function bindOutsideClose(){
    if(document.documentElement.dataset.gpV6OutsideBound) return;
    document.documentElement.dataset.gpV6OutsideBound = '1';

    document.addEventListener('pointerdown', function(e){
      if(!isMobile()) return;

      var menu = qs('#gpMobilePlusMenu');
      if(!menu || !menu.classList.contains('active')) return;

      if(e.target.closest('#gpMobilePlusMenu') ||
         e.target.closest('#gpMobilePlusBtn')){
        return;
      }

      closeQuickActions();
    }, true);

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        closeQuickActions();
        closeMobileForm();
      }
    });

    window.addEventListener('resize', function(){
      if(!isMobile()) closeQuickActions();
    });
  }

  /* ---------- Forms ---------- */

  var FORM_PARENTS = {
    'page-nv-bien':'biens',
    'page-nv-proprietaire':'proprietaires',
    'page-nv-locataire':'locataires',
    'page-nv-locative':'locatives',
    'page-nv-contrat':'contrats',
    'page-nv-employe':'employes'
  };

  function activeMobileForm(){
    if(!isMobile()) return null;

    for(var id in FORM_PARENTS){
      var el = document.getElementById(id);
      if(el && el.classList.contains('active')) return el;
    }
    return null;
  }

  function closeMobileForm(){
    var page = activeMobileForm();
    if(!page) return;

    var parent = FORM_PARENTS[page.id] || 'dashboard';

    /* Navigation is the application's canonical way to hide a page. */
    if(typeof window.navigate === 'function'){
      try{
        window.navigate(parent);
      }catch(_){}
    }else{
      page.classList.remove('active');
    }
  }

  function formTitle(page){
    var titles = {
      'page-nv-bien':'Nouveau bien',
      'page-nv-proprietaire':'Nouveau propriétaire',
      'page-nv-locataire':'Nouveau locataire',
      'page-nv-locative':'Nouvelle location',
      'page-nv-contrat':'Nouveau contrat',
      'page-nv-employe':'Nouvel employé'
    };
    return titles[page.id] || 'Nouveau';
  }

  function ensureFormBar(page){
    if(!isMobile() || !page) return;

    var bar = page.querySelector(':scope > .gp-mobile-form-bar');
    if(bar) return;

    bar = document.createElement('div');
    bar.className = 'gp-mobile-form-bar';

    var title = document.createElement('div');
    title.className = 'gp-mobile-form-title';
    title.textContent = formTitle(page);

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'gp-mobile-form-cancel';
    cancel.innerHTML =
      '<span class="material-symbols-rounded" style="font-size:17px;vertical-align:middle">close</span> ' +
      'Annuler';

    cancel.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      closeMobileForm();
    });

    bar.appendChild(title);
    bar.appendChild(cancel);

    page.insertBefore(bar, page.firstChild);
  }

  function refreshFormState(){
    if(!isMobile()) return;

    var form = activeMobileForm();
    if(form){
      ensureFormBar(form);
    }
  }

  function bindNavigationClose(){
    if(document.documentElement.dataset.gpV6NavBound) return;
    document.documentElement.dataset.gpV6NavBound = '1';

    document.addEventListener('gp:navigation', function(){
      closeQuickActions();
      setTimeout(refreshFormState, 0);
    });

    /* Fallback for older renderers that don't dispatch gp:navigation. */
    var originalNavigate = window.navigate;
    if(typeof originalNavigate === 'function' && !originalNavigate.__gpV6Wrapped){
      function wrappedNavigate(page){
        closeQuickActions();
        var result = originalNavigate.apply(this, arguments);
        setTimeout(function(){
          closeQuickActions();
          refreshFormState();
        }, 0);
        return result;
      }
      wrappedNavigate.__gpV6Wrapped = true;
      window.navigate = wrappedNavigate;
      if(window.GPNavigation && window.GPNavigation.navigate === originalNavigate){
        window.GPNavigation.navigate = wrappedNavigate;
        window.GPNavigation.go = wrappedNavigate;
      }
    }
  }

  function observeDom(){
    if(document.documentElement.dataset.gpV6Observer) return;
    document.documentElement.dataset.gpV6Observer = '1';

    var mo = new MutationObserver(function(){
      if(!isMobile()) return;
      bindQuickActions();
      refreshFormState();
    });

    mo.observe(document.body, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class']
    });
  }

  function init(){
    if(!isMobile()) return;

    bindQuickActions();
    bindOutsideClose();
    bindNavigationClose();
    refreshFormState();
    observeDom();

    /* Run again after the original mobile controller has initialized. */
    setTimeout(function(){
      bindQuickActions();
      refreshFormState();
    }, 250);
    setTimeout(function(){
      bindQuickActions();
      refreshFormState();
    }, 1000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }

  window.GPMobileV6 = {
    closeQuickActions: closeQuickActions,
    closeMobileForm: closeMobileForm,
    refresh: function(){
      if(isMobile()){
        bindQuickActions();
        refreshFormState();
      }
    }
  };
})();
