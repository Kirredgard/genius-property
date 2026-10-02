
/* Genius Property — Mobile V5 interaction guard.
   Only changes behavior while viewport <= 768px. */
(function(){
  'use strict';

  var MOBILE=768;

  function isMobile(){ return window.innerWidth <= MOBILE; }

  function closeForms(){
    if(!isMobile()) return;
    try{
      if(window.GPV10 && typeof window.GPV10.close==='function'){
        window.GPV10.close();
      }
    }catch(e){}
    try{
      if(typeof window.closeGpDrawer==='function') window.closeGpDrawer();
    }catch(e){}
    ['#gp10Drawer','#gpDrawer','#gpDrawerOverlay','#gp10DrawerOverlay'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){ el.remove(); });
    });
    document.body.style.overflow='';
  }

  function closeMobileLayers(){
    closeForms();
    try{
      if(typeof window.gpCloseActionsDrawer==='function') window.gpCloseActionsDrawer();
    }catch(e){}
    try{
      if(typeof window.GPUIManager && typeof window.GPUIManager.closeActionsDrawer==='function'){
        window.GPUIManager.closeActionsDrawer();
      }
    }catch(e){}
    document.querySelectorAll('.gp-mobile-plus-menu.active').forEach(function(el){el.classList.remove('active');});
    document.querySelectorAll('.gp-mobile-plus-backdrop.active').forEach(function(el){el.classList.remove('active');});
    document.querySelectorAll('.sidebar-overlay.active').forEach(function(el){el.classList.remove('active');});
    document.querySelectorAll('.sidebar.open,.sidebar.is-open,.app-sidebar.open,.app-sidebar.is-open')
      .forEach(function(el){el.classList.remove('open','is-open');});
    document.body.classList.remove('gp-mobile-plus-open','gp-mobile-sidebar-open');
  }

  function installNavigateGuard(){
    if(!isMobile() || window.__gpV5NavigateGuard) return;
    if(typeof window.navigate!=='function') return;

    var original=window.navigate;
    function guardedNavigate(page){
      if(isMobile() && page!=='nv-bien' && page!=='nv-proprietaire'){
        closeForms();
      }
      return original.apply(this,arguments);
    }
    guardedNavigate.__gpV5=true;
    window.__gpV5NavigateGuard=true;
    window.navigate=guardedNavigate;
  }

  function bind(){
    if(!isMobile()) return;
    installNavigateGuard();

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' || e.key==='Esc'){
        closeMobileLayers();
      }
    },true);

    document.addEventListener('click',function(e){
      if(!isMobile()) return;

      var t=e.target;
      if(!t || !t.closest) return;

      /* Any explicit close/cancel action inside a form must work. */
      if(t.closest('#gp10Drawer .gp10-btn:not(.primary), #gp10Drawer [data-close], #gpDrawer .gp-cancel, #gpDrawer .gp-drawer-close')){
        setTimeout(closeForms,0);
        return;
      }

      /* Navigation controls must always be able to escape a form. */
      if(t.closest('.sidebar [data-page], #sideMenu [data-page], [onclick*="navigate("]')){
        var navTarget=t.closest('[data-page]');
        var onclickEl=t.closest('[onclick*="navigate("]');
        var isFormNav=onclickEl && /navigate\s*\(\s*['"](?:biens|proprietaires|dashboard|locataires|locations|locatives|depenses|paiements|messages|journal|encaissements)/i.test(onclickEl.getAttribute('onclick')||'');
        if(navTarget || isFormNav){
          closeForms();
        }
      }

      /* Header hamburger/plus remain usable even when a drawer is open. */
      if(t.closest('#gpMobileMenuBtn,#gpMobilePlusBtn')){
        closeForms();
      }
    },true);

    /* If a form is rendered after page load, guarantee that its controls work. */
    try{
      var mo=new MutationObserver(function(){
        if(!isMobile()) return;
        var d=document.getElementById('gp10Drawer');
        if(d && !d.__gpV5Bound){
          d.__gpV5Bound=true;
          d.addEventListener('click',function(e){
            var t=e.target.closest && e.target.closest('.gp10-btn');
            if(t && !t.classList.contains('primary')) setTimeout(closeForms,0);
          },true);
        }
      });
      mo.observe(document.body,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind,{once:true});
  }else bind();

  window.GPV5Mobile={
    closeForms:closeForms,
    closeAll:closeMobileLayers
  };
})();
