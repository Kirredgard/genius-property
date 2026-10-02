/*
 * Genius Property — Mobile controller V4
 * Un seul contrôleur mobile : navigation, actions rapides et header.
 * Référence principale : iPhone 11 Pro / 375 px.
 */
(function(){
  'use strict';

  var MOBILE = 768;
  var state = { plusOpen:false, sidebarOpen:false };

  function qs(selector, root){ return (root || document).querySelector(selector); }
  function qsa(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function isMobile(){ return window.innerWidth <= MOBILE; }
  function can(page){
    try { return typeof window.canAccess === 'function' ? window.canAccess(page) : true; }
    catch(e){ return true; }
  }

  function topbar(){ return qs('#topbar,.topbar'); }
  function sidebar(){ return qs('.sidebar,.app-sidebar'); }

  function ensureOverlay(){
    var overlay = qs('.sidebar-overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
    overlay.onclick = function(){ closeSidebar(); closePlus(); };
    return overlay;
  }

  function ensurePlusBackdrop(){
    var backdrop = qs('#gpMobilePlusBackdrop');
    if(!backdrop){
      backdrop = document.createElement('div');
      backdrop.id = 'gpMobilePlusBackdrop';
      backdrop.className = 'gp-mobile-plus-backdrop';
      document.body.appendChild(backdrop);
    }
    backdrop.onclick = function(){ closePlus(); };
    return backdrop;
  }

  function closeSidebar(){
    state.sidebarOpen = false;
    qsa('.sidebar,.app-sidebar').forEach(function(el){ el.classList.remove('open','is-open'); });
    var overlay = qs('.sidebar-overlay');
    if(overlay) overlay.classList.remove('active');
    document.body.classList.remove('gp-mobile-sidebar-open');
  }

  function openSidebar(){
    if(!isMobile()) return;
    closePlus();
    state.sidebarOpen = true;
    qsa('.sidebar,.app-sidebar').forEach(function(el){ el.classList.add('open','is-open'); });
    ensureOverlay().classList.add('active');
    document.body.classList.add('gp-mobile-sidebar-open');
  }

  function toggleSidebar(){
    if(state.sidebarOpen) closeSidebar();
    else openSidebar();
  }

  var ACTIONS = [
    ['nv-bien','home','Nouveau bien'],
    ['nv-locataire','person','Nouveau locataire'],
    ['nv-proprietaire','person_add','Nouveau propriétaire'],
    ['nv-locative','key','Nouvelle location'],
    ['nv-contrat','description','Nouveau contrat'],
    ['messages','chat_bubble','Nouveau message'],
    ['paiements','add_circle','Nouveau revenu','is-money'],
    ['depenses','remove_circle','Nouvelle dépense','is-danger']
  ];

  function closePlus(){
    state.plusOpen = false;
    var menu = qs('#gpMobilePlusMenu');
    var backdrop = qs('#gpMobilePlusBackdrop');
    if(menu) menu.classList.remove('active');
    if(backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('gp-mobile-plus-open');
  }

  function buildPlusMenu(){
    var menu = qs('#gpMobilePlusMenu');
    if(!menu){
      menu = document.createElement('section');
      menu.id = 'gpMobilePlusMenu';
      menu.className = 'gp-mobile-plus-menu';
      menu.setAttribute('aria-label','Actions rapides');
      document.body.appendChild(menu);
    }

    var actions = ACTIONS.filter(function(item){ return can(item[0]); });
    menu.innerHTML =
      '<div class="gp-mobile-plus-head">' +
        '<div><strong>Actions rapides</strong><span>Créer un nouvel élément</span></div>' +
        '<button type="button" class="gp-mobile-plus-close" aria-label="Fermer"><span class="material-symbols-rounded">close</span></button>' +
      '</div>' +
      '<div class="gp-mobile-plus-grid">' +
        actions.map(function(item){
          return '<button type="button" class="gp-mobile-plus-item '+(item[3]||'')+'" data-page="'+item[0]+'">' +
            '<span class="gp-mobile-plus-icon material-symbols-rounded">'+item[1]+'</span>' +
            '<span>'+item[2]+'</span>' +
          '</button>';
        }).join('') +
      '</div>';

    qs('.gp-mobile-plus-close', menu).onclick = function(e){ e.preventDefault(); e.stopPropagation(); closePlus(); };
    qsa('.gp-mobile-plus-item', menu).forEach(function(button){
      button.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        var page = button.getAttribute('data-page');
        closePlus();
        closeSidebar();
        if(typeof window.navigate === 'function') window.navigate(page);
      };
    });

    ensurePlusBackdrop();
    return menu;
  }

  function togglePlus(){
    if(!isMobile()) return;
    var menu = buildPlusMenu();
    if(state.plusOpen){ closePlus(); return; }
    closeSidebar();
    state.plusOpen = true;
    menu.classList.add('active');
    ensurePlusBackdrop().classList.add('active');
    document.body.classList.add('gp-mobile-plus-open');
  }

  function ensureMobileBrand(){
    var bar = topbar();
    if(!bar) return;
    var brand = qs('#gpMobileBrand', bar);
    if(!brand){
      brand = document.createElement('div');
      brand.id = 'gpMobileBrand';
      brand.className = 'gp-mobile-brand';
      brand.innerHTML =
        '<img src="assets/logo.svg" alt="Genius Property" class="gp-mobile-brand-logo">' +
        '<span class="gp-mobile-brand-name">Genius Property</span>';
      bar.appendChild(brand);
    }
  }

  function ensureMobileButtons(){
    var bar = topbar();
    if(!bar) return;

    qsa('.gp-mobile-menu-btn', bar).forEach(function(button){ if(button.id !== 'gpMobileMenuBtn') button.remove(); });
    qsa('.gp-mobile-plus-btn', bar).forEach(function(button){ if(button.id !== 'gpMobilePlusBtn') button.remove(); });

    var menu = qs('#gpMobileMenuBtn', bar);
    if(!menu){
      menu = document.createElement('button');
      menu.id = 'gpMobileMenuBtn';
      menu.type = 'button';
      menu.className = 'gp-mobile-menu-btn';
      menu.setAttribute('aria-label','Ouvrir le menu');
      menu.innerHTML = '<span class="material-symbols-rounded">menu</span>';
      bar.insertBefore(menu, bar.firstChild);
    }

    var plus = qs('#gpMobilePlusBtn', bar);
    if(!plus){
      plus = document.createElement('button');
      plus.id = 'gpMobilePlusBtn';
      plus.type = 'button';
      plus.className = 'gp-mobile-plus-btn';
      plus.setAttribute('aria-label','Créer');
      plus.innerHTML = '<span class="material-symbols-rounded">add</span>';
      menu.insertAdjacentElement('afterend', plus);
    }

    menu.onclick = function(e){ e.preventDefault(); e.stopPropagation(); toggleSidebar(); };
    plus.onclick = function(e){ e.preventDefault(); e.stopPropagation(); togglePlus(); };
  }

  function cleanMobileHeader(){
    var bar = topbar();
    if(!bar) return;

    ensureMobileBrand();
    ensureMobileButtons();

    if(!isMobile()) return;

    /* Sur 375 px, seules les actions réellement utiles restent visibles. */
    qsa('#topbarSearchBtn,#helpBtn,#topbarAgendaBtn,#topbarMessagesBtn,#notifBtn,#themeIcon,#syncIndicator,.tb-sep', bar)
      .forEach(function(el){ el.style.setProperty('display','none','important'); });

    /* Le breadcrumb devient le libellé d'agence compact. */
    var breadcrumb = qs('#globalBreadcrumb', bar);
    if(breadcrumb){
      breadcrumb.style.setProperty('display','none','important');
    }

    /* Profil : avatar uniquement. */
    var user = qs('.user-box', bar);
    if(user){
      user.style.setProperty('display','flex','important');
      qsa('.user-info,.user-chevron', user).forEach(function(el){ el.style.setProperty('display','none','important'); });
    }

    /* Pas de vieux boutons mobiles résiduels. */
    qsa('button', bar).forEach(function(button){
      if(button.id === 'gpMobileMenuBtn' || button.id === 'gpMobilePlusBtn') return;
      if(button.classList.contains('gp-mobile-menu-btn') || button.classList.contains('gp-mobile-plus-btn')) return;
      var icon = qs('.material-symbols-rounded', button);
      if(icon && ['menu'].indexOf((icon.textContent||'').trim()) !== -1) button.remove();
    });
  }

  function applyPermissions(){
    qsa('#sideMenu li[data-page]').forEach(function(item){
      var page = item.getAttribute('data-page');
      item.style.display = can(page) ? '' : 'none';
    });
    var sync = qs('#sideMenu li[data-page="sync"]');
    if(sync) sync.style.display = 'none';
    buildPlusMenu();
    if(typeof window.refreshSidebarSections === 'function') window.refreshSidebarSections();
  }

  function bindNavigation(){
    qsa('#sideMenu li[data-page]').forEach(function(item){
      if(item.__gpV4Bound) return;
      item.__gpV4Bound = true;
      item.addEventListener('click', function(){
        if(isMobile()){ closeSidebar(); closePlus(); }
      });
    });
  }

  function wrapTables(){
    qsa('table').forEach(function(table){
      if(table.closest('.gp-table-wrap,.table-wrap,.data-table-wrap,.table-responsive')) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'gp-table-wrap';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function apply(){
    ensureOverlay();
    ensureMobileButtons();
    ensureMobileBrand();
    buildPlusMenu();
    cleanMobileHeader();
    applyPermissions();
    bindNavigation();
    wrapTables();

    if(!isMobile()){
      closeSidebar();
      closePlus();
    }
  }

  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  window.addEventListener('resize', function(){
    if(!isMobile()){ closeSidebar(); closePlus(); }
    apply();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      closeSidebar();
      closePlus();
    }
  });
  document.addEventListener('click', function(e){
    if(state.plusOpen && !e.target.closest('#gpMobilePlusMenu,#gpMobilePlusBtn')) closePlus();
    if(state.sidebarOpen && isMobile() && !e.target.closest('.sidebar,#gpMobileMenuBtn')) closeSidebar();
  });
  document.addEventListener('gp:navigation', function(){
    closeSidebar();
    closePlus();
    setTimeout(apply, 80);
  });

  /* Re-apply après rendu des pages dynamiques sans jamais rouvrir les menus. */
  [150,500,1200].forEach(function(delay){ setTimeout(apply, delay); });
})();
