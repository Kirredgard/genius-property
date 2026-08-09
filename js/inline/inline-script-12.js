/* GP patch — topbar sans flash + employés drawer/save/edit robustes */
(function(){
  function installGpFinalPatch(){
    function $(id){return document.getElementById(id);}
    function toast(m,t){ if(window.toast) window.toast(m,t||'ok'); else console.log(m); }
    function refreshEmployes(){
      try{ if(window.GPDB && GPDB.load) window.DB = GPDB.load(); }catch(e){}
      try{ if(typeof window.renderEmployesModern==='function') window.renderEmployesModern(); }catch(e){}
      try{ if(typeof window.updateSidebarBadges==='function') window.updateSidebarBadges(); }catch(e){}
    }
    window.openNouvelEmployeDrawer = function(){
      var overlay=$('nvEmpOverlay'), drawer=$('nvEmpDrawer');
      if(!overlay || !drawer){ if(window.navigate) window.navigate('nv-employe'); return; }
      if(typeof window.resetEmployeForm==='function') window.resetEmployeForm();
      overlay.style.display='block'; overlay.style.opacity='0';
      drawer.style.display='flex'; drawer.style.transform='translateX(100%)';
      requestAnimationFrame(function(){ overlay.style.opacity='1'; drawer.style.transform='translateX(0)'; });
    };
    window.closeNouvelEmployeDrawer = function(){
      var overlay=$('nvEmpOverlay'), drawer=$('nvEmpDrawer');
      if(!overlay || !drawer) return;
      overlay.style.opacity='0'; drawer.style.transform='translateX(100%)';
      setTimeout(function(){ overlay.style.display='none'; drawer.style.display='none'; }, 260);
    };
    // saveEmployeFromDrawer est géré par js/core/form-stability-fixes.js pour lire les champs dans le drawer, pas les anciens champs cachés du DOM.
    if(!window.__gpSaveEditPatched){
      var oldGpSaveEdit = window.gpSaveEdit;
      if(typeof oldGpSaveEdit === 'function'){
        window.gpSaveEdit = async function(key, idx){
          var r = oldGpSaveEdit.apply(this, arguments);
          try{ if(r && typeof r.then==='function') await r; }catch(e){ throw e; }
          if(key==='employes') setTimeout(refreshEmployes, 80);
          return r;
        };
        window.__gpSaveEditPatched = true;
      }
    }
  }
  window.addEventListener('DOMContentLoaded', function(){ setTimeout(installGpFinalPatch, 0); setTimeout(installGpFinalPatch, 400); });
  setTimeout(installGpFinalPatch, 800);
  window.addEventListener('gp:firebase:pulled', function(){
    if((window.GP_CURRENT_PAGE||localStorage.getItem('gp_last_page')) === 'locatives'){
      try{ if(window.renderLocativesModernV11) window.renderLocativesModernV11(); }catch(e){}
    }
  });
})();
