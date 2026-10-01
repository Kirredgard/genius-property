/* Finance V17 — robust drawer closing. No legacy modal dependency. */
(function(){
  'use strict';
  function closeFinance(){
    if(window.GPFinanceV16 && typeof window.GPFinanceV16.close==='function'){
      window.GPFinanceV16.close();
      return false;
    }
    var d=document.getElementById('gpFinanceDrawerV16');
    var o=document.getElementById('gpFinanceOverlayV16');
    if(d)d.remove(); if(o)o.remove();
    document.body.classList.remove('modal-open','drawer-open','gp-modal-open','overflow-hidden');
    document.body.style.overflow='';
    return false;
  }
  window.closeFinanceDrawer=closeFinance;
  window.closePayModal=closeFinance;
  window.closeDepModal=closeFinance;
  document.addEventListener('click',function(e){
    var el=e.target && e.target.closest ? e.target.closest('[data-gp-finance-close="1"]') : null;
    if(el){ e.preventDefault(); e.stopPropagation(); closeFinance(); }
  }, true);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && document.getElementById('gpFinanceDrawerV16')) closeFinance(); });
})();
