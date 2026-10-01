/* V33: each EDIT action reuses the exact same form used by CREATE for that entity. */
(function(){
  'use strict';
  function install(){
    var previous=window.editRow;
    window.editRow=function(key,idx){
      idx=Number(idx);
      if(key==='locatives' && typeof window.openGpDrawer==='function'){ window.openGpDrawer('locative',idx); return true; }
      if(key==='paiements' && typeof window.openFinanceDrawer==='function'){ window.openFinanceDrawer('paiement',idx); return true; }
      if(key==='depenses' && typeof window.openFinanceDrawer==='function'){ window.openFinanceDrawer('depense',idx); return true; }
      return typeof previous==='function' ? previous.apply(this,arguments) : false;
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
