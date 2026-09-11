/* Genius Property — Local mode / form stability
   Couche volontairement petite : un seul handler de connexion, nettoyage des
   overlays orphelins et protection contre les doubles ouvertures/soumissions.
*/
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function showError(msg){
    var el=$('authError');
    if(el) el.textContent=String(msg||'');
    if(typeof window.toast==='function') window.toast(msg,'err');
  }

  async function login(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    var user=($('lu')&&$('lu').value||'').trim();
    var pass=($('lp')&&$('lp').value||'');
    if(!user || !pass){ showError('Veuillez saisir vos identifiants.'); return false; }
    var btn=$('loginBtn');
    if(btn){ btn.disabled=true; btn.setAttribute('aria-busy','true'); }
    try{
      if(!window.GPSupabaseAuth || typeof window.GPSupabaseAuth.login!=='function')
        throw new Error('Le module de connexion locale n’est pas prêt. Rechargez la page.');
      await window.GPSupabaseAuth.login(ev);
      return true;
    }catch(e){
      showError(e && (e.message||e.code) || 'Connexion impossible.');
      return false;
    }finally{
      if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); }
    }
  }

  function cleanOrphanOverlays(){
    var pairs=[
      ['gpDrawerOverlay','gpDrawer'],
      ['gpFinanceOverlay','gpFinanceDrawer'],
      ['gpActionsOverlay','gpActionsDrawer'],
      ['gpConfirmOverlay','gpConfirmCard']
    ];
    pairs.forEach(function(pair){
      var overlay=$(pair[0]), drawer=$(pair[1]);
      if(!overlay) return;
      if(!drawer || getComputedStyle(drawer).display==='none'){
        overlay.style.display='none';
        overlay.style.opacity='0';
      }
    });
    document.body.classList.remove('gp-drawer-open');
  }

  function closeOtherDrawers(exceptId){
    ['gpDrawer','gpFinanceDrawer','gpActionsDrawer','nvEmpDrawer'].forEach(function(id){
      if(id===exceptId) return;
      var d=$(id); if(!d) return;
      var visible=getComputedStyle(d).display!=='none';
      if(!visible) return;
      var close={
        gpDrawer:'closeGpDrawer',
        gpFinanceDrawer:'closeFinanceDrawer',
        gpActionsDrawer:'gpCloseActionsDrawer',
        nvEmpDrawer:'closeNouvelEmployeDrawer'
      }[id];
      if(close && typeof window[close]==='function'){
        try{ window[close](); }catch(_){ d.style.display='none'; }
      }else d.style.display='none';
    });
  }

  function install(){
    var btn=$('loginBtn');
    if(btn){
      btn.onclick=login;
    }
    var form=$('loginForm');
    if(form) form.addEventListener('submit',login);
    var lu=$('lu'),lp=$('lp');
    [lu,lp].forEach(function(el){ if(el) el.addEventListener('keydown',function(e){ if(e.key==='Enter') login(e); }); });
    cleanOrphanOverlays();
  }

  // Exposé pour les anciens appels, sans dépendance Firebase.
  window.gpFirebaseLoginFromButton=login;
  window.doLogin=login;
  window.GPFormStability={cleanOrphanOverlays:cleanOrphanOverlays,closeOtherDrawers:closeOtherDrawers};

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  document.addEventListener('gp:navigation',function(){ setTimeout(cleanOrphanOverlays,0); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') cleanOrphanOverlays(); });
})();
