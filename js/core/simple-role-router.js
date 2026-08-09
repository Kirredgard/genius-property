/* Genius Property — v19 Simple Role Router
   Ne touche pas aux pages métier.
   Objectif: cacher TOUS les boutons admin/licences aux clients + page Abonnement client. */
(function(){
  'use strict';

  var ADMIN_EMAILS = ['oumarsackefall@gmail.com'];
  var state = { checked:false, isAdmin:false };
  var _routeOnce = false;
  var _firestoreModule = null;
  var _adminCache = { uid:null, email:null, value:null };

  function auth(){ return window._firebaseAuth; }
  function db(){ return window._firebaseDB; }
  function user(){ return auth() && auth().currentUser; }
  function uid(){ return user() && user().uid; }
  function email(){ return String((user() && user().email) || '').toLowerCase(); }
  function by(id){ return document.getElementById(id); }
  function isAdminEmail(){ return ADMIN_EMAILS.indexOf(email()) !== -1; }

  async function getFirestoreModule(){
    return _firestoreModule || (_firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'));
  }

  function clearAdminCache(){
    _adminCache = { uid:null, email:null, value:null };
  }

  async function isSimpleAdmin(){
    if(!user()){ clearAdminCache(); return false; }

    var currentUid = uid();
    var currentEmail = email();
    if(_adminCache.uid === currentUid && _adminCache.email === currentEmail && _adminCache.value !== null){
      return _adminCache.value;
    }

    if(isAdminEmail()){
      _adminCache = { uid:currentUid, email:currentEmail, value:true };
      return true;
    }

    try{
      if(!db()){
        _adminCache = { uid:currentUid, email:currentEmail, value:false };
        return false;
      }
      var fs = await getFirestoreModule();
      var snap = await fs.getDoc(fs.doc(db(), 'superAdmins', currentUid));
      var value = !!(snap.exists() && snap.data() && snap.data().active === true);
      _adminCache = { uid:currentUid, email:currentEmail, value:value };
      return value;
    }catch(e){
      console.warn('[simple-role-router] admin check failed', e);
      var fallback = isAdminEmail();
      _adminCache = { uid:currentUid, email:currentEmail, value:fallback };
      return fallback;
    }
  }

  var ADMIN_PAGES = ['admin-saas','license-manager','license-activation','admin-stockage','droits'];

  function setMenuItem(page, visible){
    document.querySelectorAll('[data-page="'+page+'"], #sideMenu li[data-page="'+page+'"]').forEach(function(li){
      li.style.setProperty('display', visible ? '' : 'none', visible ? '' : 'important');
      if(visible) li.removeAttribute('aria-hidden'); else li.setAttribute('aria-hidden','true');
    });
  }

  function forceClientMenuHidden(){
    if(state.isAdmin) return;
    ADMIN_PAGES.forEach(function(p){ setMenuItem(p, false); });
  }

  function applyMenu(isAdmin){
    state.isAdmin = !!isAdmin; state.checked = true;
    document.body.classList.toggle('gp-simple-admin', !!isAdmin);
    document.body.classList.toggle('gp-simple-client', !isAdmin);

    // Pages admin/licence: uniquement pour toi / super admin.
    ADMIN_PAGES.forEach(function(p){ setMenuItem(p, !!isAdmin); });

    // Abonnement: visible côté client pour voir son statut.
    setMenuItem('abonnement', true);

    if(!isAdmin) forceClientMenuHidden();
  }

  function isRestrictedAdminPage(page){
    return ADMIN_PAGES.indexOf(String(page||'')) !== -1;
  }

  function getCurrentPage(){ return window.GP_CURRENT_PAGE || window.currentPage || 'dashboard'; }

  async function routeAfterLogin(){
    var admin = await isSimpleAdmin();
    applyMenu(admin);

    var target = getCurrentPage();
    if(admin){
      // L’admin principal arrive sur le dashboard licences simple.
      target = 'admin-saas';
    }else if(isRestrictedAdminPage(target)){
      target = 'dashboard';
    }

    if(window.GPNavigation && window.GPNavigation.navigate) window.GPNavigation.navigate(target);
    else if(typeof window.navigate === 'function') window.navigate(target);

    if(admin && target === 'admin-saas' && window.GPSimpleLicenseAdmin && window.GPSimpleLicenseAdmin.load){
      setTimeout(window.GPSimpleLicenseAdmin.load, 200);
    }
  }

  function patchNavigate(){
    if(window.__gpV17NavigatePatched || typeof window.navigate !== 'function') return;
    var original = window.navigate;
    window.navigate = function(page){
      if(!state.isAdmin && isRestrictedAdminPage(page)) page = 'dashboard';
      return original.call(this, page);
    };
    window.__gpV17NavigatePatched = true;
    if(window.GPNavigation) window.GPNavigation.navigate = window.navigate;
  }

  async function doLogout(){
    try{ if(auth() && window._fbSignOut) await window._fbSignOut(auth()); }
    catch(e){ console.warn('[logout]', e); }
    try{
      clearAdminCache();
      _routeOnce = false;
      localStorage.removeItem('gp_user');
      localStorage.removeItem('genius_current_user');
      localStorage.removeItem('gp_last_page');
      localStorage.removeItem('gp_session_role');
      sessionStorage.clear();
    }catch(e){}
    window.currentUser = null;
    var app = by('app'), login = by('loginPage');
    if(app) app.style.display = 'none';
    if(login) login.style.display = 'flex';
    var err = by('authError'); if(err) err.textContent='';
  }

  function patchShowApp(){
    if(window.__gpSimpleRoleRouterPatched) return;
    var original = window._showApp;
    if(typeof original === 'function'){
      window._showApp = async function(){
        var res = await original.apply(this, arguments);
        setTimeout(function(){ patchNavigate(); routeAfterLogin(); }, 250);
        return res;
      };
      window.__gpSimpleRoleRouterPatched = true;
    }
  }

  document.addEventListener('click', function(e){
    var logout = e.target && e.target.closest && e.target.closest('li.logout, [data-gp-logout]');
    if(logout){ e.preventDefault(); e.stopPropagation(); doLogout(); }
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    patchShowApp(); patchNavigate();
    // Cacher par défaut les boutons sensibles le temps de vérifier le rôle.
    ADMIN_PAGES.forEach(function(p){ setMenuItem(p, false); });
    setTimeout(function(){ patchShowApp(); patchNavigate(); if(user()) routeAfterLogin(); }, 1000);
    try{
      new MutationObserver(function(){ forceClientMenuHidden(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    }catch(e){}
  });
  window.addEventListener('firebase:ready', function(){ setTimeout(function(){ patchShowApp(); patchNavigate(); if(user()) routeAfterLogin(); }, 800); });
  window.addEventListener('gp:auth-changed', function(){
    clearAdminCache();
    if(!user()){ _routeOnce = false; return; }
    if(_routeOnce) return;
    _routeOnce = true;
    setTimeout(routeAfterLogin, 300);
  });

  window.GPSimpleRoleRouter = { isAdmin:isSimpleAdmin, route:routeAfterLogin, applyMenu:applyMenu };
  window.doLogout = doLogout;
})();
