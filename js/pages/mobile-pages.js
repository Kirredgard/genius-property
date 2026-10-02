/*
 * Genius Property — scripts mobiles consolidés
 * Fusion depuis : mobile-rentilia-v15.js, mobile-compact-v17.js, mobile-clean-v20.js
 * Ordre conservé selon index.html original.
 */


/* ===== Source: js/pages/mobile-rentilia-v15.js ===== */

/* Genius Property — Mobile compact helper V16 */
(function(){
  'use strict';
  var MOBILE = 768;
  function qs(s){ return document.querySelector(s); }
  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function isMobile(){ return window.innerWidth <= MOBILE; }
  function can(page){ try{ return typeof window.canAccess === 'function' ? window.canAccess(page) : true; }catch(e){ return true; } }
  function nav(page){ closePlus(); closeSidebar(); if(typeof window.navigate === 'function') window.navigate(page); }

  function ensureOverlay(){
    var overlay = qs('.sidebar-overlay');
    if(!overlay){ overlay = document.createElement('div'); overlay.className = 'sidebar-overlay'; document.body.appendChild(overlay); }
    overlay.onclick = closeSidebar;
    return overlay;
  }
  function openSidebar(){ closePlus(); qsa('.sidebar,.app-sidebar').forEach(function(s){ s.classList.add('open','is-open'); }); ensureOverlay().classList.add('active'); }
  function closeSidebar(){ qsa('.sidebar,.app-sidebar').forEach(function(s){ s.classList.remove('open','is-open'); }); var overlay=qs('.sidebar-overlay'); if(overlay) overlay.classList.remove('active'); }

  function ensureTopButtons(){
    var topbar = qs('#topbar,.topbar'); if(!topbar) return;
    /* supprimer les anciens hamburgers mobiles injectés/cache, garder un seul bouton */
    qsa('.gp-mobile-menu-btn').forEach(function(b){ if(b.id !== 'gpMobileMenuBtn') b.remove(); });
    var oldBtns = qsa('#gpMobileMenuBtn');
    oldBtns.slice(1).forEach(function(b){ b.remove(); });
    var menu = qs('#gpMobileMenuBtn');
    if(!menu){ menu = document.createElement('button'); menu.id='gpMobileMenuBtn'; menu.type='button'; menu.className='gp-mobile-menu-btn'; menu.title='Menu'; menu.innerHTML='<span class="material-symbols-rounded">menu</span>'; topbar.insertBefore(menu, topbar.firstChild); }
    menu.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openSidebar(); };

    var plus = qs('#gpMobilePlusBtn');
    if(!plus){ plus = document.createElement('button'); plus.id='gpMobilePlusBtn'; plus.type='button'; plus.className='gp-mobile-plus-btn'; plus.title='Ajouter'; plus.innerHTML='<span class="material-symbols-rounded">add</span>'; menu.insertAdjacentElement('afterend', plus); }
    plus.onclick = function(e){ e.preventDefault(); e.stopPropagation(); togglePlus(); };

    var settings = qs('#gpMobileSettingsBtn');
    if(!settings){ settings = document.createElement('button'); settings.id='gpMobileSettingsBtn'; settings.type='button'; settings.className='gp-mobile-settings-btn'; settings.title='Paramètres'; settings.innerHTML='<span class="material-symbols-rounded">settings</span>'; var icons=qs('.top-icons'); (icons||topbar).appendChild(settings); }
    settings.onclick = function(e){ e.preventDefault(); e.stopPropagation(); nav('parametres'); };
  }

  var ACTIONS = [
    ['nv-bien','home','Nouveau bien'],
    ['nv-locataire','person','Nouveau locataire'],
    ['nv-proprietaire','person_add','Nouveau propriétaire'],
    ['nv-locative','key','Nouvelle location'],
    ['nv-contrat','contract','Nouveau contrat'],
    ['messages','chat','Nouveau message'],
    ['paiements','add_circle','Nouveau revenu','is-money'],
    ['depenses','remove_circle','Nouvelle dépense','is-danger']
  ];
  function ensurePlusMenu(){
    var m = qs('#gpMobilePlusMenu');
    if(!m){ m = document.createElement('div'); m.id='gpMobilePlusMenu'; m.className='gp-mobile-plus-menu'; document.body.appendChild(m); }
    var html = ACTIONS.filter(function(a){ return can(a[0]); }).map(function(a){ return '<button type="button" class="'+(a[3]||'')+'" data-page="'+a[0]+'"><span class="material-symbols-rounded">'+a[1]+'</span><span>'+a[2]+'</span></button>'; }).join('');
    m.innerHTML = html || '<button type="button" data-page="dashboard"><span class="material-symbols-rounded">home</span><span>Bureau</span></button>';
    qsa('#gpMobilePlusMenu button[data-page]').forEach(function(b){ b.onclick = function(e){ e.preventDefault(); e.stopPropagation(); nav(b.getAttribute('data-page')); }; });
    return m;
  }
  function togglePlus(){ if(!isMobile()) return; var m=ensurePlusMenu(); m.classList.toggle('active'); if(m.classList.contains('active')) closeSidebar(); }
  function closePlus(){ var m=qs('#gpMobilePlusMenu'); if(m) m.classList.remove('active'); }

  function wrapTables(){ qsa('table').forEach(function(tbl){ if(tbl.closest('.gp-table-wrap,.table-wrap,.data-table-wrap,.table-responsive')) return; var w=document.createElement('div'); w.className='gp-table-wrap'; tbl.parentNode.insertBefore(w,tbl); w.appendChild(tbl); }); }
  function closeOnNavigate(){ qsa('.sidebar li[data-page]').forEach(function(li){ if(li.__gpMobileCloseBound) return; li.__gpMobileCloseBound=true; li.addEventListener('click',function(){ if(isMobile()){ closeSidebar(); closePlus(); } }); }); }

  function applyPermissionsToMenu(){
    qsa('#sideMenu li[data-page]').forEach(function(li){ var p=li.dataset.page; if(!p) return; li.style.display = can(p) ? '' : 'none'; });
    ensurePlusMenu();
  }

  function compactHeaderUser(){
    /* En mobile: enlever le badge Administrateur, l'indicateur connexion/sync et garder un header court. */
    qsa('.user-role').forEach(function(e){ e.textContent=''; });
    if(isMobile()){
      qsa('.user-box,.user-info,.user-chevron,#syncIndicator,.tb-sep,#themeIcon,#notifBtn,.topbar .tb-icon-btn[title="Messages"],#gpMobileSettingsBtn').forEach(function(e){ e.style.display='none'; });
      qsa('.topbar .tb-icon-btn[title="Rechercher"],#helpBtn,#topbarAgendaBtn').forEach(function(e){ e.style.display='flex'; });
    }
  }

  function apply(){ ensureOverlay(); ensureTopButtons(); ensurePlusMenu(); wrapTables(); closeOnNavigate(); applyPermissionsToMenu(); compactHeaderUser(); }
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  window.addEventListener('resize', function(){ if(!isMobile()){ closeSidebar(); closePlus(); } apply(); });
  document.addEventListener('click', function(e){ if(!e.target.closest('#gpMobilePlusBtn,#gpMobilePlusMenu')) closePlus(); });
  document.addEventListener('gp:navigation', function(){ setTimeout(apply,50); if(isMobile()){ closeSidebar(); closePlus(); } });

  var oldNavigate = window.navigate;
  if(typeof oldNavigate === 'function' && !oldNavigate.__gpMobileV15Wrapped){
    window.navigate = function(){ var r=oldNavigate.apply(this,arguments); setTimeout(apply,50); if(isMobile()){ closeSidebar(); closePlus(); } return r; };
    window.navigate.__gpMobileV15Wrapped=true;
  }
  setTimeout(apply,300); setTimeout(apply,1000); setTimeout(apply,2000);
})();

/* ===== Source: js/pages/mobile-compact-v17.js ===== */

/* Genius Property — Mobile compact V17 */
(function(){
  'use strict';
  var MOBILE = 768;
  function qs(s,r){ return (r||document).querySelector(s); }
  function qsa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function isMobile(){ return window.innerWidth <= MOBILE; }
  function can(page){ try{ return typeof window.canAccess === 'function' ? window.canAccess(page) : true; }catch(e){ return true; } }

  function ensureOverlay(){
    var overlay = qs('.sidebar-overlay');
    if(!overlay){ overlay=document.createElement('div'); overlay.className='sidebar-overlay'; document.body.appendChild(overlay); }
    overlay.onclick = closeSidebar;
    return overlay;
  }
  function sidebar(){ return qs('.sidebar,.app-sidebar'); }
  function isSidebarOpen(){ var s=sidebar(); return !!(s && (s.classList.contains('open') || s.classList.contains('is-open'))); }
  function openSidebar(){ closePlus(); qsa('.sidebar,.app-sidebar').forEach(function(s){ s.classList.add('open','is-open'); }); ensureOverlay().classList.add('active'); }
  function closeSidebar(){ qsa('.sidebar,.app-sidebar').forEach(function(s){ s.classList.remove('open','is-open'); }); var o=qs('.sidebar-overlay'); if(o) o.classList.remove('active'); }
  function toggleSidebar(){ isSidebarOpen() ? closeSidebar() : openSidebar(); }
  function nav(page){ closePlus(); closeSidebar(); if(typeof window.navigate === 'function') window.navigate(page); }

  function removeDuplicateMobileButtons(topbar, keepMenu, keepPlus){
    qsa('.gp-mobile-menu-btn', topbar).forEach(function(b){ if(b !== keepMenu) b.remove(); });
    qsa('.gp-mobile-plus-btn', topbar).forEach(function(b){ if(b !== keepPlus) b.remove(); });
    /* boutons menu injectés sans notre classe */
    qsa('button', topbar).forEach(function(b){
      if(b === keepMenu || b === keepPlus) return;
      var icon = (b.textContent || '').trim();
      var ms = qs('.material-symbols-rounded', b);
      var name = ms ? (ms.textContent || '').trim() : icon;
      if(name === 'menu' && !b.closest('.user-menu')) b.remove();
    });
  }

  function ensureTopButtons(){
    var topbar = qs('#topbar,.topbar'); if(!topbar) return;
    var menu = qs('#gpMobileMenuBtn', topbar);
    if(!menu){ menu=document.createElement('button'); menu.id='gpMobileMenuBtn'; menu.type='button'; menu.className='gp-mobile-menu-btn'; menu.title='Menu'; menu.innerHTML='<span class="material-symbols-rounded">menu</span>'; topbar.insertBefore(menu, topbar.firstChild); }
    var plus = qs('#gpMobilePlusBtn', topbar);
    if(!plus){ plus=document.createElement('button'); plus.id='gpMobilePlusBtn'; plus.type='button'; plus.className='gp-mobile-plus-btn'; plus.title='Ajouter'; plus.innerHTML='<span class="material-symbols-rounded">add</span>'; menu.insertAdjacentElement('afterend', plus); }
    removeDuplicateMobileButtons(topbar, menu, plus);
    menu.onclick=function(e){ e.preventDefault(); e.stopPropagation(); if(isMobile()) toggleSidebar(); };
    plus.onclick=function(e){ e.preventDefault(); e.stopPropagation(); if(isMobile()) togglePlus(); };

    /* sur desktop: ne jamais afficher les boutons mobiles */
    if(!isMobile()){ menu.style.display='none'; plus.style.display='none'; closeSidebar(); closePlus(); }
    else { menu.style.display=''; plus.style.display=''; }
  }

  var ACTIONS = [
    ['nv-bien','home','Nouveau bien'],
    ['nv-locataire','person','Nouveau locataire'],
    ['nv-proprietaire','person_add','Nouveau propriétaire'],
    ['nv-locative','key','Nouvelle location'],
    ['nv-contrat','contract','Nouveau contrat'],
    ['messages','chat','Nouveau message'],
    ['paiements','add_circle','Nouveau revenu','is-money'],
    ['depenses','remove_circle','Nouvelle dépense','is-danger']
  ];
  function ensurePlusMenu(){
    var m=qs('#gpMobilePlusMenu');
    if(!m){ m=document.createElement('div'); m.id='gpMobilePlusMenu'; m.className='gp-mobile-plus-menu'; document.body.appendChild(m); }
    m.innerHTML = ACTIONS.filter(function(a){ return can(a[0]); }).map(function(a){ return '<button type="button" class="'+(a[3]||'')+'" data-page="'+a[0]+'"><span class="material-symbols-rounded">'+a[1]+'</span><span>'+a[2]+'</span></button>'; }).join('');
    qsa('button[data-page]',m).forEach(function(b){ b.onclick=function(e){ e.preventDefault(); e.stopPropagation(); nav(b.dataset.page); }; });
    return m;
  }
  function togglePlus(){ var m=ensurePlusMenu(); m.classList.toggle('active'); if(m.classList.contains('active')) closeSidebar(); }
  function closePlus(){ var m=qs('#gpMobilePlusMenu'); if(m) m.classList.remove('active'); }

  function compactHeaderUser(){
    var topbar = qs('#topbar,.topbar'); if(!topbar) return;
    // NE PAS vider user-name : username-lock.js maintient le bon nom
    qsa('.user-role,.user-info,.user-chevron', topbar).forEach(function(e){ e.style.display='none'; });
    qsa('#syncIndicator,.tb-sep,#themeIcon,#notifBtn,.topbar .tb-icon-btn[title="Messages"]', topbar).forEach(function(e){ e.style.display='none'; });
    qsa('.user-box', topbar).forEach(function(e){ e.style.display = isMobile() ? 'flex' : ''; });
    qsa('.topbar .u-rel,.topbar .u-rel .tb-icon-btn,#helpBtn,#topbarAgendaBtn', document).forEach(function(e){ if(isMobile()) e.style.display='flex'; });
  }

  function applyPermissions(){
    qsa('#sideMenu li[data-page]').forEach(function(li){ var p=li.dataset.page; li.style.display = can(p) ? '' : 'none'; });
    var sync=qs('#sideMenu li[data-page="sync"]'); if(sync) sync.style.display='none';
    ensurePlusMenu();
  }
  function bindSidebarItems(){ qsa('#sideMenu li[data-page]').forEach(function(li){ if(li.__v17) return; li.__v17=true; li.addEventListener('click',function(){ if(isMobile()){ closeSidebar(); closePlus(); } }); }); }
  function wrapTables(){ qsa('table').forEach(function(t){ if(t.closest('.gp-table-wrap,.table-wrap,.data-table-wrap,.table-responsive')) return; var w=document.createElement('div'); w.className='gp-table-wrap'; t.parentNode.insertBefore(w,t); w.appendChild(t); }); }
  function apply(){ ensureOverlay(); ensureTopButtons(); compactHeaderUser(); applyPermissions(); bindSidebarItems(); wrapTables(); }

  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  window.addEventListener('resize', apply);
  document.addEventListener('click', function(e){
    if(!e.target.closest('#gpMobilePlusBtn,#gpMobilePlusMenu')) closePlus();
    if(isMobile() && isSidebarOpen() && !e.target.closest('.sidebar,#gpMobileMenuBtn')) closeSidebar();
  });
  document.addEventListener('gp:navigation', function(){ setTimeout(apply, 40); if(isMobile()){ closeSidebar(); closePlus(); } });
  setTimeout(apply,100); setTimeout(apply,600); setTimeout(apply,1500);
})();

/* ===== Source: js/pages/mobile-clean-v20.js ===== */

/* Genius Property — Mobile clean V20 */
(function(){
  'use strict';
  var MOBILE = 768;
  function qs(s,r){ return (r||document).querySelector(s); }
  function qsa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function isMobile(){ return window.innerWidth <= MOBILE; }

  function normalizeMobileHeader(){
    var topbar = qs('#topbar,.topbar');
    if(!topbar || !isMobile()) return;

    // Supprime les textes du badge utilisateur, garde uniquement l'icône.
    qsa('.user-info,.user-name,.user-role,.user-chevron', topbar).forEach(function(el){
      el.textContent = '';
      el.style.cssText += ';display:none!important;visibility:hidden!important;opacity:0!important;width:0!important;height:0!important;overflow:hidden!important;padding:0!important;margin:0!important;';
      el.setAttribute('aria-hidden','true');
    });

    // Supprime tout bouton/badge admin généré par d'anciens correctifs.
    qsa('[class*="admin"],[class*="role"]', topbar).forEach(function(el){
      if(el.closest('#userMenu')) return;
      el.style.cssText += ';display:none!important;visibility:hidden!important;opacity:0!important;width:0!important;height:0!important;overflow:hidden!important;padding:0!important;margin:0!important;';
      el.textContent = '';
    });

    // Icônes demandées.
    var searchIcon = qs('.u-rel .tb-icon-btn .material-symbols-rounded', topbar);
    if(searchIcon) searchIcon.textContent = 'search';
    var helpIcon = qs('#helpBtn .material-symbols-rounded', topbar);
    if(helpIcon) helpIcon.textContent = 'help';
    var agendaIcon = qs('#topbarAgendaBtn .material-symbols-rounded', topbar);
    if(agendaIcon) agendaIcon.textContent = 'calendar_month';
    var avatar = qs('#topbarAvatar', topbar) || qs('.user-avatar', topbar);
    if(avatar){
      avatar.innerHTML = '<span class="material-symbols-rounded">person</span>';
      avatar.style.background = 'transparent';
      avatar.style.boxShadow = 'none';
      avatar.style.border = '0';
    }

    // Cache les icônes non demandées sur mobile.
    qsa('#syncIndicator,.tb-sep,#themeIcon,#notifBtn,.topbar .tb-icon-btn[title="Messages"]', topbar).forEach(function(el){
      el.style.display = 'none';
    });

    // Ne garde qu'un seul hamburger mobile.
    var keep = qs('#gpMobileMenuBtn', topbar) || qs('.gp-mobile-menu-btn', topbar);
    qsa('.gp-mobile-menu-btn', topbar).forEach(function(btn){ if(btn !== keep) btn.remove(); });
    qsa('button', topbar).forEach(function(btn){
      if(btn === keep || btn.id === 'gpMobilePlusBtn') return;
      var ms = qs('.material-symbols-rounded', btn);
      if(ms && (ms.textContent || '').trim() === 'menu') btn.remove();
    });
  }

  function apply(){ normalizeMobileHeader(); }
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  window.addEventListener('resize', apply);
  document.addEventListener('gp:navigation', function(){ setTimeout(apply,30); });
  setTimeout(apply,100); setTimeout(apply,500); setTimeout(apply,1500);
})();
