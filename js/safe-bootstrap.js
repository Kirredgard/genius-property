/* Genius Property — Legacy Safe Bootstrap v5
   Remplace le bundle legacy cassé app.legacy.bundle.js.
   Rôle: afficher login/app, fournir les fonctions globales minimum, laisser les modules séparés faire le rendu. */
(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  function hideSplash(){
    var s = document.getElementById('gpSplash');
    if(!s) return;
    s.classList.add('gp-splash-hide');
    setTimeout(function(){ try { s.remove(); } catch(_){} }, 400);
  }

  function showLogin(){
    var login=$('loginPage'), app=$('app'), err=$('authError');
    if(app) app.style.display='none';
    if(login) login.style.display='flex';
    if(err && /Supabase/i.test(err.textContent||'')) err.textContent='';
    hideSplash();
  }

  async function showApp(){
    var login=$('loginPage'), app=$('app');
    if(login) login.style.display='none';
    if(app) app.style.display='flex';
    hideSplash();
    try { if(window.GPDB && typeof window.GPDB.load==='function') window.GPDB.load(); } catch(e){}
    try { if(typeof window.updateSidebarBadges==='function') window.updateSidebarBadges(); } catch(e){}
    try { if(window.GPAuth && typeof window.GPAuth.refresh==='function') window.GPAuth.refresh(); } catch(e){}

    // Restaurer la dernière page visitée.
    // Pour les pages données (paiements, depenses, etc.), on attend que les données
    // Firestore soient prêtes avant de naviguer, afin d'éviter le flash "ancienne version".
    var lastPage = 'dashboard';
    try { lastPage = localStorage.getItem('gp_last_page') || 'dashboard'; } catch(_){}

    var dataPages = ['paiements','depenses','avenir','rapports','locatives','contrats','locataires','proprietaires','biens'];
    var needsData = dataPages.indexOf(lastPage) !== -1;

    function doNavigate(page){
      try { if(typeof window.navigate==='function') window.navigate(page); }
      catch(e){ console.warn('[legacy-safe] navigation:', e && (e.message||e)); }
    }

    if(!needsData){
      // Dashboard ou pages formulaire : navigation immédiate
      doNavigate(lastPage);
    } else {
      // Pages données : naviguer vers dashboard d'abord, puis attendre les données
      doNavigate('dashboard');
      // Si le pull Firestore arrive (événement gp:db:synced ou firebase:data-loaded),
      // ou au bout de 3s max (données localStorage), naviguer vers la vraie page
      var navigated = false;
      function navigateToTarget(){
        if(navigated) return;
        navigated = true;
        doNavigate(lastPage);
      }
      // Écoute le pull Firestore
      window.addEventListener('gp:firebase:pulled', navigateToTarget, {once:true});
      window.addEventListener('gp:db:imported', navigateToTarget, {once:true});
      // Fallback : si les données sont déjà en localStorage (pas vides), naviguer après 400ms
      setTimeout(function(){
        if(navigated) return;
        var db = window.DB || {};
        var hasData = (db[lastPage] && db[lastPage].length > 0) ||
                      (lastPage==='avenir' && db.paiements && db.paiements.length > 0);
        if(hasData){
          navigateToTarget();
        } else {
          // Attendre encore un peu (Firestore en cours)
          window.addEventListener('gp:firebase:pulled', navigateToTarget, {once:true});
          setTimeout(navigateToTarget, 2500); // fallback ultime
        }
      }, 400);
    }
  }

  async function logout(){
    _appShown = false; // permet une reconnexion propre
    try { if(window.GPFirebaseAuth && window.GPFirebaseAuth.signOut) await window.GPFirebaseAuth.signOut(); }
    catch(e){ console.warn('[legacy-safe] logout Firebase:', e && (e.message||e)); }
    window.currentUser=null;
    try { localStorage.removeItem('gp_session_name'); } catch(e){}
    showLogin();
  }

  function toast(msg,type){
    console[(type==='err'||type==='error')?'warn':'log']('[toast]', msg);
    var old=$('gpToast');
    if(!old){
      old=document.createElement('div');
      old.id='gpToast';
      old.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;max-width:360px;padding:12px 14px;border-radius:12px;background:#111;color:#fff;font:600 13px Inter,Arial;box-shadow:0 12px 30px rgba(0,0,0,.25);display:none';
      document.body.appendChild(old);
    }
    old.textContent=String(msg||'');
    old.style.background=(type==='err'||type==='error')?'#991b1b':'#111';
    old.style.display='block';
    clearTimeout(old._t); old._t=setTimeout(function(){ old.style.display='none'; }, 3500);
  }

  function uid(prefix){ return String(prefix||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); }
  function todayKey(){ return new Date().toISOString().slice(0,10); }

  window._showLogin=window._showLogin||showLogin;
  window._showApp=window._showApp||showApp;
  window.doLogout=window.doLogout||logout;
  window.toast=window.toast||toast;
  window.GP=window.GP||{};
  window.GP.uid=window.GP.uid||uid;
  window.GP.todayKey=window.GP.todayKey||todayKey;

  // Stubs défensifs pour anciennes pages qui appellent encore ces fonctions.
  ['updateSidebarBadges','appliqueDroits','appliqueDroitsPage','startDashboardRealtime','refreshDashboardFromSupabase','refreshDashboardFromFirebase'].forEach(function(name){
    if(typeof window[name] !== 'function') window[name]=function(){};
  });

  var _initRunning = false;
  var _appShown = false; // évite un double-appel de showApp
  async function initAuthScreen(){
    if(_initRunning) return;
    if(_appShown) return; // déjà montré, ne pas re-déclencher
    _initRunning = true;
    try{
      try {
        var cached=(localStorage.getItem('gp_session_name')||localStorage.getItem('gp_session_firstname')||'').trim();
        if(cached) document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function(el){ if(el) el.textContent=cached; });
      } catch(_) {}
      if(window.GPFirebaseAuth && window.GPFirebaseAuth.available && window.GPFirebaseAuth.available()){
        var user = await window.GPFirebaseAuth.restoreSession();
        if(user){
          _initRunning = false;
          if(!_appShown){ _appShown = true; return showApp(); }
          return;
        }
      }
    }catch(e){ console.warn('[legacy-safe] restoreSession:', e && (e.message||e)); }
    if(!window.currentUser){
      showLogin();
    } else if(!_appShown){
      _appShown = true;
      showApp();
    }
    _initRunning = false;
  }

  document.addEventListener('DOMContentLoaded', function(){
    var hasCached=false;
    try{ hasCached=!!(localStorage.getItem('gp_session_name')||localStorage.getItem('gp_session_firstname')||localStorage.getItem('gp_user_name')); }catch(_){}
    if(!hasCached && !window.currentUser) showLogin();
    setTimeout(initAuthScreen, 120);
  });
  window.addEventListener('firebase:ready', function(){ setTimeout(initAuthScreen, 300); });

  // [cleaned] debug console statement removed
})();
