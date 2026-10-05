/* Genius Property V22 — Supabase Auth
   Authentification réelle par email/mot de passe + profil gp_user_profiles. */
(function(){
  'use strict';

  function setError(msg){
    var el=document.getElementById('authError');
    if(el) el.textContent=String(msg || '');
  }
  function setButtonLoading(loading){
    var btn=document.getElementById('loginBtn');
    if(!btn) return;
    btn.disabled=!!loading;
    btn.classList.toggle('loading',!!loading);
    btn.textContent=loading ? 'Connexion…' : 'Se connecter';
  }
  function emitAuth(user){
    try { window.dispatchEvent(new CustomEvent('gp:auth-changed',{detail:user||null})); } catch(_) {}
    try { document.dispatchEvent(new CustomEvent('gp:auth-changed',{detail:user||null})); } catch(_) {}
  }

  async function hydrateCurrentUser(authUser){
    if(!authUser) return null;
    var sb = await window.GPSupabase.ready();
    var profile = null;
    try {
      var r = await sb.from('gp_user_profiles').select('id,email,full_name,role,is_active,agency_id').eq('id',authUser.id).maybeSingle();
      if(r.error) throw r.error;
      profile = r.data || null;
    } catch(e) {
      console.warn('[GPSupabaseAuth] Profil inaccessible:', e.message || e);
    }

    if(!profile) {
      await sb.auth.signOut().catch(function(){});
      throw new Error('Profil utilisateur introuvable. Contactez l’administrateur.');
    }
    if(profile.is_active === false) {
      await sb.auth.signOut().catch(function(){});
      throw new Error('Ce compte est désactivé. Contactez l’administrateur.');
    }
    var realRole = profile.role ? String(profile.role).toLowerCase() : 'anonymous';
    var isSuperAdmin = realRole === 'super_admin';
    // Le reste de l'appli ne connaît que « admin » : le super_admin est vu comme admin.
    var role = isSuperAdmin ? 'admin' : realRole;
    if(!profile.agency_id) {
      await sb.auth.signOut().catch(function(){});
      throw new Error('Votre compte n’est rattaché à aucune agence. Contactez l’administrateur.');
    }
    var agency = null;
    try {
      var ar = await sb.from('gp_agencies').select('id,name,slug,is_active').eq('id',profile.agency_id).maybeSingle();
      if(!ar.error) agency = ar.data || null;
    } catch(_) {}
    if(agency && agency.is_active === false) {
      await sb.auth.signOut().catch(function(){});
      throw new Error('Cette agence est suspendue. Contactez l’administrateur de la plateforme.');
    }
    var fullName = (profile && profile.full_name) || (authUser.user_metadata && (authUser.user_metadata.full_name || authUser.user_metadata.name)) || (authUser.email || '').split('@')[0];
    var user = {
      id: authUser.id,
      email: authUser.email || '',
      full_name: fullName,
      role: role,
      isAdmin: role === 'admin',
      isSuperAdmin: isSuperAdmin,
      realRole: realRole,
      agencyId: profile.agency_id,
      agencyName: agency && agency.name || '',
      agency: agency,
      droits: {},
      source: 'supabase',
      profile: profile
    };
    window._supabaseCurrentUser = authUser;
    window.currentUser = user;
    try {
      localStorage.setItem('gp_session_name', fullName);
      localStorage.setItem('gp_session_firstname', fullName);
      localStorage.setItem('gp_session_role', role === 'readonly' ? 'lecture' : role);
    } catch(_) {}
    document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function(el){ el.textContent=fullName; });
    emitAuth(user);
    return user;
  }

  function countRecords(d){
    d = d || {};
    return ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers','messages','conversations','agenda']
      .reduce(function(n,k){ return n + (Array.isArray(d[k]) ? d[k].length : 0); }, 0);
  }

  /* ---------- V30 — protection des données ---------- */
  var CACHE_KEYS = [
    'geniusproperty_db_clean_v1','geniusproperty_db_authoritative_v1',
    'geniusproperty_last_backup_snapshot','geniusproperty_last_backup_date',
    'gpdb_local_revision','gp_data_dirty_at','gp_cache_owner','gp_safety_snapshot'
  ];
  function clearLocalCache(){
    try {
      CACHE_KEYS.forEach(function(k){ localStorage.removeItem(k); });
      for(var i=localStorage.length-1;i>=0;i--){
        var k=localStorage.key(i);
        if(k && k.indexOf('geniusproperty_backup_')===0) localStorage.removeItem(k);
      }
    } catch(_) {}
  }
  function readJSON(key){
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch(_) { return null; }
  }
  function stamp(){ return new Date().toISOString().replace(/[:.]/g,'-'); }
  function keepOnly(prefix, max){
    try {
      var keys=[];
      for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k && k.indexOf(prefix)===0) keys.push(k); }
      keys.sort().reverse().slice(max).forEach(function(k){ localStorage.removeItem(k); });
    } catch(_) {}
  }
  // Copie de sécurité locale AVANT tout écrasement du cache par le cloud.
  function safetySnapshot(db, why){
    try { localStorage.setItem('gp_safety_snapshot', JSON.stringify({date:new Date().toISOString(), why:why||'', db:db})); } catch(_) {}
  }
  // Données d'un autre compte/agence : on les met de côté, on ne les mélange JAMAIS avec l'agence courante.
  function quarantine(db, owner){
    try {
      localStorage.setItem('gp_quarantine_'+stamp(), JSON.stringify({owner:owner, date:new Date().toISOString(), db:db}));
      keepOnly('gp_quarantine_', 3);
    } catch(_) {}
  }
  function idsOf(list){ var m={}; (list||[]).forEach(function(r){ if(r && r.id!=null) m[String(r.id)]=1; }); return m; }
  // Fusion non destructive : union par id, la version locale (modifiée) l'emporte.
  function mergeData(cloud, local){
    var out = JSON.parse(JSON.stringify(cloud || {}));
    Object.keys(local || {}).forEach(function(k){
      var lv = local[k], cv = out[k];
      if(Array.isArray(lv)) {
        var res = Array.isArray(cv) ? cv.slice() : [];
        var pos = {}; res.forEach(function(r,i){ if(r && r.id!=null) pos[String(r.id)] = i; });
        lv.forEach(function(r){
          if(r && r.id!=null && pos[String(r.id)]!=null) res[pos[String(r.id)]] = r; else res.push(r);
        });
        out[k] = res;
      } else if(lv && typeof lv === 'object') {
        out[k] = Object.assign({}, cv && typeof cv==='object' ? cv : {}, lv);
      } else if(lv != null) out[k] = lv;
    });
    return out;
  }
  // Tout ce qui est local existe-t-il dans le cloud ?
  function cloudCoversLocal(cloud, local){
    var ok = true;
    ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers','messages','conversations','agenda'].forEach(function(k){
      var c = idsOf(cloud && cloud[k]);
      (local && local[k] || []).forEach(function(r){ if(r && r.id!=null && !c[String(r.id)]) ok = false; });
    });
    return ok && countRecords(cloud) >= countRecords(local);
  }

  var syncing = null;
  // Aligne les données locales et le cloud (connexion ET restauration de session).
  // L'envoi vers le cloud reste bloqué (GPSupabase.isReady() === false) tant que cette
  // étape n'a pas abouti : une base locale vide ne peut donc plus écraser le cloud.
  function syncData(){
    if(syncing) return syncing;
    syncing = doSyncData().finally(function(){ syncing = null; });
    return syncing;
  }
  async function doSyncData(){
    var A = window.GPSupabase;
    if(!(A && typeof A.pull==='function')) {
      if(window.GPDB && typeof window.GPDB.load==='function') window.GPDB.load();
      return;
    }
    if(A.setReady) A.setReady(false);
    var u = window.currentUser || {};
    var owner = String(u.agencyId || u.id || '');
    var local = window.GPDB && typeof window.GPDB.load==='function' ? window.GPDB.load() : (window.DB || {});
    var localDirty = false;
    try { localDirty = !!localStorage.getItem('gp_data_dirty_at'); } catch(_) {}

    try {
      // 1) Propriétaire du cache : jamais de mélange entre comptes/agences.
      var cacheOwner = '';
      try { cacheOwner = localStorage.getItem('gp_cache_owner') || ''; } catch(_) {}
      if(owner && cacheOwner && cacheOwner !== owner && countRecords(local) > 0) {
        quarantine(local, cacheOwner);
        try { ['geniusproperty_db_clean_v1','geniusproperty_db_authoritative_v1','gpdb_local_revision','gp_data_dirty_at'].forEach(function(k){ localStorage.removeItem(k); }); } catch(_) {}
        local = window.GPDB.load(); localDirty = false;
        if(window.toast) window.toast('Les données locales d’un autre compte ont été mises de côté.', 'warn');
      }
      if(owner) { try { localStorage.setItem('gp_cache_owner', owner); } catch(_) {} }

      // 2) Sauvegarde locale non synchronisée laissée par une déconnexion forcée.
      var rec = readJSON('gp_recovery_snapshot');
      if(rec && rec.db && countRecords(rec.db) > 0 && (!rec.owner || rec.owner === owner) && countRecords(local) === 0) {
        if(confirm('Une sauvegarde locale NON synchronisée (' + countRecords(rec.db) + ' enregistrements) a été conservée lors de votre dernière déconnexion.\n\nLa restaurer maintenant ?')) {
          window.GPDB.save(rec.db, {silent:true, force:true});
          try { localStorage.removeItem('gp_recovery_snapshot'); } catch(_) {}
          local = window.GPDB.load();
          localDirty = true;
        }
      }

      // 3) État du cloud
      // IMPORTANT : le pull est asynchrone. Une location (ou toute autre donnée)
      // peut être créée localement pendant l'attente réseau. Il faut donc relire
      // l'état local APRÈS le await, sinon on risque de travailler avec un snapshot
      // obsolète et de remplacer la nouvelle donnée par l'ancien état du cloud.
      var cloud = await A.pull({applyToLocal:false});
      local = window.GPDB && typeof window.GPDB.load==='function' ? window.GPDB.load() : (window.DB || {});
      try { localDirty = !!localStorage.getItem('gp_data_dirty_at'); } catch(_) {}
      var cloudCount = countRecords(cloud), localCount = countRecords(local);

      if(cloudCount === 0 && localCount > 0) {
        // Cloud vide, local rempli : on envoie le local.
        await A.push(local, {bootstrap:true});
        try { localStorage.removeItem('gp_data_dirty_at'); } catch(_) {}
      } else if(cloudCount > 0 && localCount === 0) {
        // Local vide : on charge le cloud.
        window.GPDB.save(cloud, {silent:true, skipCloud:true, force:true});
        try { window.dispatchEvent(new CustomEvent('gp:supabase:pulled')); } catch(_) {}
      } else if(cloudCount > 0 && localCount > 0) {
        if(localDirty) {
          // Les deux côtés ont des données et le local a des modifications en attente : FUSION.
          safetySnapshot(local, 'avant fusion');
          var merged = mergeData(cloud, local);
          window.GPDB.save(merged, {silent:true, force:true});
          await A.push(merged, {bootstrap:true});
          try { localStorage.removeItem('gp_data_dirty_at'); } catch(_) {}
          try { window.dispatchEvent(new CustomEvent('gp:supabase:pulled')); } catch(_) {}
        } else {
          // Pas de modification locale en attente : le cloud est la source de vérité,
          // mais on garde une copie de sécurité du local avant de le remplacer.
          if(!cloudCoversLocal(cloud, local)) safetySnapshot(local, 'avant remplacement par le cloud');
          window.GPDB.save(cloud, {silent:true, skipCloud:true, force:true});
          try { window.dispatchEvent(new CustomEvent('gp:supabase:pulled')); } catch(_) {}
        }
      }
      if(A.setReady) A.setReady(true);   // les envois sont maintenant autorisés
    } catch(e) {
      // Échec (réseau, droits…) : envois BLOQUÉS, données locales conservées, nouvelle tentative automatique.
      console.warn('[GPSupabaseAuth] Chargement données:', e && e.message || e);
      if(window.toast) window.toast('Synchronisation impossible pour le moment. Vos données locales sont conservées ; nouvelle tentative automatique.', 'err');
    }
  }

  async function login(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    setError('');
    var email=((document.getElementById('lu')||{}).value || '').trim();
    var password=(document.getElementById('lp')||{}).value || '';
    if(!email || !password){ setError('Veuillez saisir votre email et votre mot de passe.'); return false; }
    setButtonLoading(true);
    try {
      var sb=await window.GPSupabase.ready();
      var r=await sb.auth.signInWithPassword({email:email,password:password});
      if(r.error) {
        var msg=r.error.message || 'Connexion impossible.';
        if(/invalid login credentials/i.test(msg)) msg='Email ou mot de passe incorrect.';
        else if(/email not confirmed/i.test(msg)) msg='Email non confirmé. Vérifiez votre email ou désactivez la confirmation dans Supabase Auth.';
        throw new Error(msg);
      }
      await hydrateCurrentUser(r.data.user);
      await syncData();
      if(typeof window._showApp==='function') await window._showApp();
      return true;
    } catch(e) {
      setError(e && (e.message || e.code) || 'Connexion impossible.');
      return false;
    } finally {
      setButtonLoading(false);
    }
  }

  async function restoreSession(){
    try {
      var sb=await window.GPSupabase.ready();
      var r=await sb.auth.getSession();
      if(r.error) throw r.error;
      if(!r.data || !r.data.session) return null;
      var restored = await hydrateCurrentUser(r.data.session.user);
      if(restored) await syncData();
      return restored;
    } catch(e) {
      if(window.GPV22_ENV && window.GPV22_ENV.supabasePublishableKey) console.warn('[GPSupabaseAuth] restoreSession:', e.message || e);
      return null;
    }
  }

  // Envoie TOUT vers le cloud puis relit le serveur pour confirmer que rien ne manque.
  async function flushAndVerify(){
    var A = window.GPSupabase;
    if(!A || !A.available || !A.available() || !A.currentUid || !A.currentUid() || !window.GPDB) return false;
    try {
      if(!A.isReady()) await syncData();
      if(!A.isReady()) return false;
      var local = window.GPDB.load();
      if(countRecords(local) > 0) await A.push(local);
      var cloud = await A.pull({applyToLocal:false});
      return cloudCoversLocal(cloud, local);
    } catch(e) {
      console.warn('[GPSupabaseAuth] vérification avant déconnexion:', e && e.message || e);
      return false;
    }
  }

  async function signOut(){
    var A = window.GPSupabase;
    var local = window.GPDB && typeof window.GPDB.load==='function' ? window.GPDB.load() : (window.DB || {});
    var hasData = countRecords(local) > 0;
    var keepRecovery = false;

    // 1) On ne supprime RIEN tant que le serveur n'a pas confirmé qu'il possède toutes les données.
    if(hasData) {
      var verified = await flushAndVerify();
      if(!verified) {
        var go = confirm('⚠ Vos données n’ont PAS pu être confirmées dans le cloud (connexion, droits ou conflit).\n\n' +
          'OK = télécharger une sauvegarde JSON maintenant, puis vous déconnecter (une copie reste aussi dans ce navigateur).\n' +
          'Annuler = rester connecté.');
        if(!go) return false;
        try {
          window.GPDB.exportJSON('genius-property-SAUVEGARDE-avant-deconnexion-' + stamp() + '.json');
        } catch(e) {
          alert('La sauvegarde JSON a échoué : déconnexion annulée pour protéger vos données.');
          return false;
        }
        keepRecovery = true;
      }
    }

    // 2) Copie de secours conservée si la synchro n'est pas confirmée (restaurable à la prochaine connexion).
    if(keepRecovery) {
      try {
        var u = window.currentUser || {};
        localStorage.setItem('gp_recovery_snapshot', JSON.stringify({
          owner: String(u.agencyId || u.id || localStorage.getItem('gp_cache_owner') || ''),
          date: new Date().toISOString(), db: local
        }));
      } catch(_) {}
    }

    try { if(A && A.available()) await A.client().auth.signOut(); } catch(_) {}
    window._supabaseCurrentUser=null;
    window.currentUser=null;
    if(A && A.reset) A.reset();

    // 3) Poste partagé : on efface le cache métier seulement maintenant (données déjà sécurisées).
    try { ['gp_session_name','gp_session_firstname','gp_session_role'].forEach(function(k){ localStorage.removeItem(k); }); } catch(_) {}
    clearLocalCache();
    try { window.DB = null; } catch(_) {}
    emitAuth(null);
  }

  async function createEmployeeAccount(email,password,meta){
    var sb=await window.GPSupabase.ready();
    var sessionResult=await sb.auth.getSession();
    var session=sessionResult.data && sessionResult.data.session;
    if(!session) throw new Error('Une session administrateur est nécessaire pour créer un employé.');
    var fnUrl=window.GPSupabase.config().url + '/functions/v1/create-employee-account';
    var response=await fetch(fnUrl,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':window.GPSupabase.config().publishableKey},
      body:JSON.stringify({email:email,password:password,fullName:meta&&meta.fullName||'',role:meta&&meta.role||'lecture'})
    });
    var body={};
    try{ body=await response.json(); }catch(_){}
    if(!response.ok) throw new Error(body.error || body.message || 'Création du compte employé impossible.');
    return body.user || body;
  }

  async function resetPassword(){
    var email=((document.getElementById('lu')||{}).value || '').trim();
    if(!email){ setError('Saisissez votre email pour recevoir le lien de réinitialisation.'); return false; }
    try {
      var sb=await window.GPSupabase.ready();
      var r=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin + window.location.pathname});
      if(r.error) throw r.error;
      setError('Email de réinitialisation envoyé. Vérifiez votre boîte de réception.');
      return true;
    } catch(e){ setError(e.message || 'Impossible d’envoyer le lien.'); return false; }
  }

  async function diagnose(){
    var out={configured:false,available:false,user:null,profile:null,error:null};
    try {
      out.configured=!!(window.GPSupabase && window.GPSupabase.config().configured);
      out.available=!!(window.GPSupabase && window.GPSupabase.available());
      if(!out.available) await window.GPSupabase.ready();
      var sb=window.GPSupabase.client();
      var s=await sb.auth.getSession();
      out.user=s.data && s.data.session ? {id:s.data.session.user.id,email:s.data.session.user.email} : null;
      if(out.user){
        var p=await sb.from('gp_user_profiles').select('id,email,full_name,role,is_active').eq('id',out.user.id).maybeSingle();
        out.profile=p.data||null;
        if(p.error) out.error=p.error.message;
      }
    } catch(e){ out.error=e.message || String(e); }
    return out;
  }

  window.GPSupabaseAuth={
    login:login,
    signIn:login,
    signOut:signOut,
    restoreSession:restoreSession,
    syncData:syncData,
    clearCache:clearLocalCache,
    hydrateCurrentUser:hydrateCurrentUser,
    resetPassword:resetPassword,
    createEmployeeAccount:createEmployeeAccount,
    diagnose:diagnose,
    available:function(){ return !!(window.GPSupabase && window.GPSupabase.available()); }
  };

  // Les écrans « Équipe » appellent encore l'ancien nom : on le branche sur Supabase.
  window.GPFirebaseAuth = window.GPFirebaseAuth || { createEmployeeAccount: createEmployeeAccount };

  // Alias temporaire de compatibilité avec les anciens boutons/pages.
  window.gpSupabaseLoginFromButton=login;
  window.gpFirebaseLoginFromButton=login;
  window.doLogin=login;
  window.sendResetEmail=resetPassword;

  function install(){
    var btn=document.getElementById('loginBtn');
    if(btn) btn.onclick=login;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
  window.addEventListener('supabase:ready',function(){ install(); });
  window.addEventListener('storage',function(){ if(window.GPSupabase) window.GPSupabase.config(); });
})();
