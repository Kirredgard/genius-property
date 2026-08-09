/* Genius Property V6 — Mobile guards */
(function(){
  'use strict';
  function wrapTables(){
    document.querySelectorAll('table').forEach(function(tbl){
      if(!tbl.parentNode) return;
      if(tbl.closest('.gp-table-wrap,.table-wrap,.table-responsive,.data-table-wrap,.payments-table-wrap')) return;
      var wrap=document.createElement('div');
      wrap.className='gp-table-wrap';
      tbl.parentNode.insertBefore(wrap,tbl);
      wrap.appendChild(tbl);
    });
  }
  function ensureSidebarOverlay(){
    if(document.querySelector('.sidebar-overlay')) return;
    var overlay=document.createElement('div');
    overlay.className='sidebar-overlay';
    overlay.addEventListener('click',function(){
      document.querySelectorAll('.sidebar,.app-sidebar').forEach(function(s){s.classList.remove('open');});
      overlay.classList.remove('active');
    });
    document.body.appendChild(overlay);
  }
  document.addEventListener('DOMContentLoaded', function(){
    wrapTables();
    ensureSidebarOverlay();
    try{
      var mo=new MutationObserver(function(){ clearTimeout(window.__gpWrapTablesT); window.__gpWrapTablesT=setTimeout(wrapTables,80); });
      mo.observe(document.body,{childList:true,subtree:true});
    }catch(e){}
  });
  window.GP = window.GP || {};
  window.GP.wrapTables = wrapTables;
})();
