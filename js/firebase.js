/* Genius Property — Firebase final loader
   Remplace l'ancien loader legacy V40.
   Objectif : aucune dépendance Supabase active, sauvegarde/chargement via Firebase.
*/
(function(){
  'use strict';

  // [cleaned] debug console statement removed

  const STORAGE_KEY = (window.GP && window.GP.STORAGE_KEY) || 'geniusproperty_db_clean_v1';
  const FIREBASE_CACHE_KEY = 'geniusproperty_firebase_cache';
  const DEFAULT_DB = {
    employes:[], proprietaires:[], locataires:[], biens:[], locatives:[], contrats:[],
    paiements:[], depenses:[], fichiers:[], messages:[], conversations:[], agenda:[],
    proprietaireDocs:{}, locataireDocs:{}, settings:{}, meta:{schemaVersion:1}
  };

  function clone(o){ try { return JSON.parse(JSON.stringify(o || {})); } catch(e){ return {}; } }
  function parse(raw){ try { return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
  function normalize(db){
    db = db && typeof db === 'object' ? db : {};
    const out = Object.assign(clone(DEFAULT_DB), db);
    Object.keys(DEFAULT_DB).forEach(k => {
      if(Array.isArray(DEFAULT_DB[k]) && !Array.isArray(out[k])) out[k] = [];
      else if(!Array.isArray(DEFAULT_DB[k]) && (!out[k] || typeof out[k] !== 'object')) out[k] = clone(DEFAULT_DB[k]);
    });
    out.meta = out.meta || {};
    out.meta.schemaVersion = out.meta.schemaVersion || 1;
    return out;
  }
  function countRecords(db){
    db = normalize(db || {});
    return ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers','messages','conversations','agenda'].reduce((n,k) => n + (Array.isArray(db[k]) ? db[k].length : 0), 0);
  }
  function currentDB(candidate){
    // IMPORTANT V8 : quand on SAUVE une base fournie (ajout, modification ou suppression),
    // on doit respecter exactement cette base. L'ancienne logique prenait toujours la source
    // qui contenait le plus d'enregistrements, ce qui annulait les suppressions et pouvait
    // empêcher l'affichage immédiat après Enregistrer.
    if(candidate && typeof candidate === 'object') return normalize(candidate);
    const local = parse(localStorage.getItem(STORAGE_KEY));
    const cache = parse(localStorage.getItem(FIREBASE_CACHE_KEY));
    const sources = [window.DB, local, cache].filter(Boolean).map(normalize);
    sources.sort((a,b) => countRecords(b) - countRecords(a));
    return normalize(sources[0] || {});
  }
  function applyDB(db){
    const clean = normalize(db);
    try {
      const raw = JSON.stringify(clean);
      localStorage.setItem(STORAGE_KEY, raw);
      localStorage.setItem(FIREBASE_CACHE_KEY, raw);
    } catch(e){}
    if(window.DB && typeof window.DB === 'object') {
      Object.keys(window.DB).forEach(k => delete window.DB[k]);
      Object.assign(window.DB, clean);
    } else {
      window.DB = clean;
    }
    try { if(typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges(); } catch(e){}
    try { if(typeof window.renderDashboard === 'function') window.renderDashboard(); } catch(e){}
    try {
      const active = document.querySelector('.page.active');
      const id = active && active.id && active.id.replace(/^page-/, '');
      if(id && typeof window.renderPage === 'function') window.renderPage(id);
    } catch(e){}
    return clean;
  }
  function firebaseReady(){
    return !!(window.GPFirebase && typeof window.GPFirebase.available === 'function' && window.GPFirebase.available());
  }

  async function readCloud(){
    if(!firebaseReady()) return null;
    const data = await window.GPFirebase.pull({applyToLocal:false});
    return data ? {source:'firebase', data:data, updated_at:new Date().toISOString()} : null;
  }

  async function writeCloud(db){
    if(!firebaseReady()) return false;
    const clean = currentDB(db);
    await window.GPFirebase.push(clean);
    return true;
  }

  async function bootPull(){
    try {
      const local = currentDB();
      const remote = await readCloud();
      const remoteData = remote && remote.data ? normalize(remote.data) : null;
      const localCount = countRecords(local);
      const remoteCount = remoteData ? countRecords(remoteData) : 0;

      if(!remoteData || remoteCount === 0){
        console.warn('[GPDB] Firebase vide ignoré, localStorage conservé');
        if(localCount > 0) { try { await writeCloud(local); } catch(e){} }
        applyDB(local);
        return;
      }

      if(localCount > 0 && remoteCount < localCount){
        console.warn('[GPDB] Firebase plus ancien ignoré, localStorage conservé');
        try { await writeCloud(local); } catch(e){}
        applyDB(local);
        return;
      }

      applyDB(remoteData);
      // [cleaned] debug console statement removed
    } catch(e){
      console.warn('[GPDB] bootPull Firebase impossible, localStorage conservé :', e && (e.message || e));
      applyDB(currentDB());
    }
  }

  function installCloudSaveBridge(){
    if(window.__gpCloudSaveBridgeFirebase) return;

    const origSaveDB = typeof window.saveDB === 'function' ? window.saveDB.bind(window) : null;
    if(origSaveDB){
      window.saveDB = async function(){
        const r = origSaveDB();
        if(r && typeof r.then === 'function') await r;
        try { await writeCloud(window.DB); } catch(e){ console.warn('[GPDB] writeCloud/saveDB Firebase:', e && e.message); }
        return true;
      };
    }

    if(window.GPDB && typeof window.GPDB.save === 'function'){
      const origGPDB = window.GPDB.save.bind(window.GPDB);
      window.GPDB.save = async function(db, options){
        options = options || {};
        const data = currentDB(db);
        const r = origGPDB(data, options);
        if(r && typeof r.then === 'function') await r;
        applyDB(data);
        // GPDB.save gère déjà la persistance locale ; éviter double push Firebase
        return true;
      };
    }

    window.__gpCloudSaveBridgeFirebase = true;
    // [cleaned] debug console statement removed
  }


  function installFirebaseAuthHandlers(){
    if(window._firebaseAuthLoginHandler){
      window.doLogin = window._firebaseAuthLoginHandler;
      const errEl = document.getElementById('authError');
      if(errEl && /Supabase/i.test(errEl.textContent || '')) errEl.textContent = '';
    }
    if(window.GPFirebaseAuth && window.GPFirebaseAuth.signOut){
      const oldLogout = window.doLogout;
      window.doLogout = async function(){
        try { await window.GPFirebaseAuth.signOut(); } catch(e) {}
        if(typeof oldLogout === 'function') return oldLogout();
      };
    }
  }

  function start(){
    installFirebaseAuthHandlers();
    installCloudSaveBridge();
    bootPull().then(installCloudSaveBridge);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ installFirebaseAuthHandlers(); start(); }, {once:true});
  else start();

  window.addEventListener('firebase:ready', function(){
    window.GPFirebaseReady = true;
    installFirebaseAuthHandlers();
    window.__gpCloudSaveBridgeFirebase = false;
    installCloudSaveBridge();
    bootPull();
  });

  // Alias conservé pour les anciens boutons/pages qui appellent GPCloudSync.
  window.GPCloudSync = {
    pull: bootPull,
    push: function(){ return writeCloud(window.DB); },
    readCloud: readCloud,
    writeCloud: writeCloud,
    applyDB: applyDB,
    ensureUserProfile: async function(){
      // [cleaned] debug console statement removed
      return null;
    }
  };
})();


/* Firebase v3 safety guard */
(function(){
  function clean(){ var el=document.getElementById('authError'); if(el && /Supabase/i.test(el.textContent||'')) el.textContent=''; }
  function bind(){ if(window._firebaseAuthLoginHandler) window.doLogin = window._firebaseAuthLoginHandler; clean(); }
  bind();
  document.addEventListener('DOMContentLoaded', bind);
  window.addEventListener('firebase:ready', bind);
  window.addEventListener('load', bind);
  setTimeout(bind, 0); setTimeout(bind, 500); setTimeout(bind, 1500);
})();


/* Firebase v4 hard override: bloque les anciens messages/handlers Supabase restants */
(function(){
  function clearLegacyError(){
    var el=document.getElementById('authError');
    if(el && /Supabase/i.test(el.textContent||'')) el.textContent='';
  }
  async function login(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    if(ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    clearLegacyError();
    if(window._firebaseAuthLoginHandler) return window._firebaseAuthLoginHandler();
    if(window.GPFirebaseAuth && window.GPFirebaseAuth.signIn){
      var email=(document.getElementById('lu')||{}).value||'';
      var pwd=(document.getElementById('lp')||{}).value||'';
      var err=document.getElementById('authError');
      email=String(email).trim();
      if(!email || !pwd){ if(err) err.textContent='Veuillez saisir votre email et votre mot de passe.'; return; }
      try{
        var u=await window.GPFirebaseAuth.signIn(email,pwd);
        if(window.GPFirebaseAuth.hydrateCurrentUser) await window.GPFirebaseAuth.hydrateCurrentUser(u);
        if(typeof window._showApp==='function') await window._showApp();
      }catch(e){ if(err) err.textContent=(e && (e.message||e.code)) || 'Connexion Firebase impossible.'; }
      return;
    }
    var er=document.getElementById('authError');
    if(er) er.textContent='Firebase Auth est en cours de chargement. Réessayez dans quelques secondes.';
  }
  function install(){
    window.gpFirebaseLoginFromButton=login;
    window.doLogin=login;
    var btn=document.getElementById('loginBtn');
    if(btn){ btn.onclick=login; btn.addEventListener('click', login, true); }
    clearLegacyError();
  }
  install();
  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('load', install);
  window.addEventListener('firebase:ready', install);
  setInterval(install, 250);
})();
