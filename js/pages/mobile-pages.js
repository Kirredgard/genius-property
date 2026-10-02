/* Genius Property — mobile controller (single consolidated implementation). */
(function(){
  'use strict';
  var MOBILE_MAX=768;
  var ACTIONS=[
    ['nv-bien','home','Nouveau bien'],
    ['nv-locataire','person','Nouveau locataire'],
    ['nv-proprietaire','person_add','Nouveau propriétaire'],
    ['nv-locative','key','Nouvelle location'],
    ['nv-contrat','contract','Nouveau contrat'],
    ['messages','chat','Nouveau message'],
    ['paiements','add_circle','Nouveau revenu','is-money'],
    ['depenses','remove_circle','Nouvelle dépense','is-danger']
  ];
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function mobile(){return window.innerWidth<=MOBILE_MAX}
  function can(page){try{return typeof window.canAccess==='function'?window.canAccess(page):true}catch(e){return true}}

  function ensureOverlay(){
    var o=qs('.sidebar-overlay');
    if(!o){o=document.createElement('div');o.className='sidebar-overlay';document.body.appendChild(o)}
    o.onclick=closeSidebar;
    return o;
  }
  function closeSidebar(){
    qsa('.sidebar,.app-sidebar').forEach(function(s){s.classList.remove('open','is-open')});
    var o=qs('.sidebar-overlay');if(o)o.classList.remove('active');
  }
  function openSidebar(){
    if(!mobile())return;
    closePlus();
    qsa('.sidebar,.app-sidebar').forEach(function(s){s.classList.add('open','is-open')});
    ensureOverlay().classList.add('active');
  }
  function toggleSidebar(){
    var s=qs('.sidebar,.app-sidebar');
    if(s&&(s.classList.contains('open')||s.classList.contains('is-open')))closeSidebar();else openSidebar();
  }

  function closePlus(){var m=qs('#gpMobilePlusMenu');if(m)m.classList.remove('active')}
  function nav(page){closeSidebar();closePlus();if(typeof window.navigate==='function')window.navigate(page)}

  function ensureBrand(topbar){
    var brand=qs('#gpMobileBrand',topbar);
    if(!brand){
      brand=document.createElement('div');brand.id='gpMobileBrand';brand.className='gp-mobile-brand';
      brand.innerHTML='<img src="assets/logo.svg" alt=""><span>Genius Property</span>';
      var plus=qs('#gpMobilePlusBtn',topbar);
      if(plus)plus.insertAdjacentElement('afterend',brand);else topbar.insertBefore(brand,topbar.firstChild);
    }
  }

  function ensureHeader(){
    var topbar=qs('#topbar,.topbar');if(!topbar)return;
    var menu=qs('#gpMobileMenuBtn',topbar);
    if(!menu){menu=document.createElement('button');menu.id='gpMobileMenuBtn';menu.type='button';menu.className='gp-mobile-menu-btn';menu.title='Menu';menu.innerHTML='<span class="material-symbols-rounded">menu</span>';topbar.insertBefore(menu,topbar.firstChild)}
    var plus=qs('#gpMobilePlusBtn',topbar);
    if(!plus){plus=document.createElement('button');plus.id='gpMobilePlusBtn';plus.type='button';plus.className='gp-mobile-plus-btn';plus.title='Ajouter';plus.innerHTML='<span class="material-symbols-rounded">add</span>';menu.insertAdjacentElement('afterend',plus)}
    ensureBrand(topbar);

    menu.onclick=function(e){e.preventDefault();e.stopPropagation();toggleSidebar()};
    plus.onclick=function(e){e.preventDefault();e.stopPropagation();togglePlus()};

    if(!mobile()){menu.style.display='none';plus.style.display='none';var b=qs('#gpMobileBrand',topbar);if(b)b.style.display='none';closeSidebar();closePlus();return}
    menu.style.display='flex';plus.style.display='flex';var brand=qs('#gpMobileBrand',topbar);if(brand)brand.style.display='flex';

    qsa('#syncIndicator,#themeIcon,#notifBtn,#topbarMessagesBtn,.tb-sep,#globalBreadcrumb,.topbar-breadcrumb,.gp-global-breadcrumb',topbar).forEach(function(el){el.style.removeProperty('display');el.style.setProperty('display','none','important')});
    qsa('.user-info,.user-role,.user-chevron',topbar).forEach(function(el){el.style.setProperty('display','none','important')});
    var avatar=qs('#topbarAvatar',topbar)||qs('.user-avatar',topbar);
    if(avatar&&!avatar.querySelector('.material-symbols-rounded'))avatar.innerHTML='<span class="material-symbols-rounded">person</span>';
    var user=qs('.user-box',topbar);if(user)user.style.setProperty('display','flex','important');
    qsa('#topbarSearchBtn,#helpBtn,#topbarAgendaBtn',topbar).forEach(function(el){el.style.setProperty('display','flex','important')});
  }

  function ensurePlusMenu(){
    var m=qs('#gpMobilePlusMenu');
    if(!m){m=document.createElement('div');m.id='gpMobilePlusMenu';m.className='gp-mobile-plus-menu';document.body.appendChild(m)}
    var html=ACTIONS.filter(function(a){return can(a[0])}).map(function(a){return '<button type="button" class="'+(a[3]||'')+'" data-page="'+a[0]+'"><span class="material-symbols-rounded">'+a[1]+'</span><span>'+a[2]+'</span></button>'}).join('');
    m.innerHTML=html||'<button type="button" data-page="dashboard"><span class="material-symbols-rounded">home</span><span>Tableau de bord</span></button>';
    qsa('button[data-page]',m).forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();nav(b.dataset.page)}});
    return m;
  }
  function togglePlus(){if(!mobile())return;var m=ensurePlusMenu();m.classList.toggle('active');if(m.classList.contains('active'))closeSidebar()}

  function wrapTables(){
    qsa('table').forEach(function(t){
      if(t.closest('.gp-table-wrap,.table-wrap,.table-responsive,.data-table-wrap,.payments-table-wrap'))return;
      var w=document.createElement('div');w.className='gp-table-wrap';t.parentNode.insertBefore(w,t);w.appendChild(t);
    });
  }
  function bindNav(){
    qsa('#sideMenu li[data-page]').forEach(function(li){
      if(li.__gpMobileBound)return;li.__gpMobileBound=true;
      li.addEventListener('click',function(){if(mobile()){closeSidebar();closePlus()}})
    });
  }
  function permissions(){
    qsa('#sideMenu li[data-page]').forEach(function(li){var p=li.dataset.page;if(!p)return;li.style.display=can(p)?'':'none'});
    var sync=qs('#sideMenu li[data-page="sync"]');if(sync)sync.style.display='none';
  }
  function placeResponsiveStylesheet(){
    var link=document.querySelector('link[href*=' + JSON.stringify('styles/mobile.css') + ']');
    if(link && link.parentNode===document.head && document.head.lastElementChild!==link)document.head.appendChild(link);
  }
  function apply(){placeResponsiveStylesheet();ensureOverlay();ensureHeader();ensurePlusMenu();wrapTables();bindNav();permissions()}

  document.addEventListener('DOMContentLoaded',apply);
  try{
    new MutationObserver(function(){
      if(window.__gpResponsiveMoveTimer)cancelAnimationFrame(window.__gpResponsiveMoveTimer);
      window.__gpResponsiveMoveTimer=requestAnimationFrame(placeResponsiveStylesheet);
    }).observe(document.head,{childList:true});
  }catch(e){}
  window.addEventListener('load',apply);
  window.addEventListener('resize',function(){apply()});
  document.addEventListener('click',function(e){
    if(!e.target.closest('#gpMobilePlusBtn,#gpMobilePlusMenu'))closePlus();
    if(mobile()&&qs('.sidebar.open,.sidebar.is-open')&&!e.target.closest('.sidebar,#gpMobileMenuBtn'))closeSidebar();
  });
  document.addEventListener('gp:navigation',function(){setTimeout(apply,40);if(mobile()){closeSidebar();closePlus()}});
  setTimeout(apply,100);setTimeout(apply,500);setTimeout(apply,1200);

  window.GP=window.GP||{};
  window.GP.wrapTables=wrapTables;
})();
