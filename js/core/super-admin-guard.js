/* Genius Property — Super Admin Guard v10
   Fix robuste: vérifie superAdmins/{uid}, super_admins/{uid}, fallback email autorisé. */
(function(){
  'use strict';

  var SUPER_ADMIN_EMAILS = ['oumarsackefall@gmail.com'];
  var state = { checked:false, isSuperAdmin:false, uid:null, email:null, lastError:null, source:null };

  function auth(){ return window._firebaseAuth; }
  function db(){ return window._firebaseDB; }
  function uid(){ return auth() && auth().currentUser && auth().currentUser.uid; }
  function email(){ return auth() && auth().currentUser && auth().currentUser.email; }
  function emailOk(mail){ return SUPER_ADMIN_EMAILS.indexOf(String(mail||'').toLowerCase()) !== -1; }
  function toast(msg,type){ if(typeof window.toast==='function') window.toast(msg,type||'err'); else console.warn(msg); }

  async function sdk(){
    if(window._fbGetDoc && window._fbDoc && window._fbCollection) return window;
    var mod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    Object.assign(window,{_fbDoc:mod.doc,_fbCollection:mod.collection,_fbGetDoc:mod.getDoc});
    return window;
  }

  async function readAdminDoc(collectionName){
    try{
      var snap = await window._fbGetDoc(window._fbDoc(window._fbCollection(db(), collectionName), state.uid));
      if(!snap || !snap.exists || !snap.exists()) return false;
      var data = snap.data() || {};
      return data.active === true || data.role === 'super_admin' || data.email === state.email;
    }catch(e){
      state.lastError = (e && (e.code || e.message)) || String(e);
      return false;
    }
  }

  async function refresh(){
    state.uid = uid();
    state.email = email();
    state.isSuperAdmin = false;
    state.checked = true;
    state.lastError = null;
    state.source = null;

    if(!state.uid){ applyUI(); return state; }

    // Fallback immédiat par email pour débloquer ton Admin Central même si Firestore cache/bloque.
    if(emailOk(state.email)){
      state.isSuperAdmin = true;
      state.source = 'email-whitelist';
      applyUI();
      try{ window.dispatchEvent(new CustomEvent('gp:super-admin-changed',{detail:status()})); }catch(e){}
      return state;
    }

    if(!db()){ applyUI(); return state; }

    try{
      await sdk();
      if(await readAdminDoc('superAdmins')){ state.isSuperAdmin = true; state.source = 'superAdmins'; }
      else if(await readAdminDoc('super_admins')){ state.isSuperAdmin = true; state.source = 'super_admins'; }
    }catch(e){
      state.lastError = (e && (e.code || e.message)) || String(e);
      state.isSuperAdmin = false;
    }

    applyUI();
    try{ window.dispatchEvent(new CustomEvent('gp:super-admin-changed',{detail:status()})); }catch(e){}
    return state;
  }

  function applyUI(){
    document.querySelectorAll('[data-page="admin-saas"],[data-page="license-manager"]').forEach(function(el){
      if(state.isSuperAdmin){ el.style.display=''; el.removeAttribute('aria-hidden'); }
      else { el.style.display='none'; el.setAttribute('aria-hidden','true'); }
    });
  }

  function requireSuperAdmin(){
    if(!state.isSuperAdmin) throw new Error('Action réservée au super administrateur. UID='+(state.uid||'-')+' email='+(state.email||'-')+' err='+(state.lastError||'-'));
    return true;
  }

  async function ensureSuperAdmin(){
    await refresh();
    return requireSuperAdmin();
  }

  function status(){
    return { checked:state.checked, isSuperAdmin:state.isSuperAdmin, uid:state.uid, email:state.email, lastError:state.lastError, source:state.source };
  }

  window.GPSuperAdmin = { refresh:refresh, applyUI:applyUI, requireSuperAdmin:requireSuperAdmin, ensureSuperAdmin:ensureSuperAdmin, status:status };
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(refresh,500); setInterval(refresh,60000); });
  window.addEventListener('firebase:ready', function(){ setTimeout(refresh,100); });
  window.addEventListener('gp:auth-changed', function(){ setTimeout(refresh,100); });
})();
