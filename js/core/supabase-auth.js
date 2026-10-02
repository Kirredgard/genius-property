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

  // Aligne les données locales et le cloud (connexion ET restauration de session).
  async function syncData(){
    if(!(window.GPSupabase && typeof window.GPSupabase.pull==='function')) {
      if(window.GPDB && typeof window.GPDB.load==='function') window.GPDB.load();
      return;
    }
    var local = window.GPDB && typeof window.GPDB.load==='function' ? window.GPDB.load() : (window.DB || {});
    var localDirty = false;
    try { localDirty = !!localStorage.getItem('gp_data_dirty_at'); } catch(_) {}
    try {
      // Toujours récupérer la version serveur pour initialiser le verrou de concurrence.
      var cloud = await window.GPSupabase.pull({applyToLocal:false});
      var cloudCount = countRecords(cloud), localCount = countRecords(local);
      if((localDirty || cloudCount===0) && localCount>0 && window.GPSupabase.push) {
        // Modifications locales non synchronisées (ou cloud encore vide) : on les envoie.
        try {
          await window.GPSupabase.push(local);
          try { localStorage.removeItem('gp_data_dirty_at'); } catch(_) {}
        } catch(syncErr) {
          console.warn('[GPSupabaseAuth] Modification locale non synchronisée:', syncErr.message || syncErr);
          if(window.toast) window.toast('Une modification locale n’a pas pu être synchronisée. Vos données locales sont conservées.', 'err');
        }
      } else if(cloud && cloudCount>0 && window.GPDB && typeof window.GPDB.save==='function') {
        // Sans modification locale en attente, le cloud est la source de vérité.
        // force:true : sinon la révision locale (plus élevée) bloque l'écriture.
        window.GPDB.save(cloud,{silent:true,skipCloud:true,force:true});
        try { window.dispatchEvent(new CustomEvent('gp:supabase:pulled')); } catch(_) {}
      }
    } catch(e) { console.warn('[GPSupabaseAuth] Chargement données:', e.message || e); }
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

  async function signOut(){
    // Avant d'effacer le cache local, on envoie les modifications en attente.
    var dirtyNow = false;
    try { dirtyNow = !!localStorage.getItem('gp_data_dirty_at'); } catch(_) {}
    if(dirtyNow && window.GPSupabase && window.GPSupabase.available && window.GPSupabase.available() && window.GPDB) {
      try {
        await window.GPSupabase.push(window.GPDB.load());
        try { localStorage.removeItem('gp_data_dirty_at'); } catch(_) {}
      } catch(flushErr) {
        if(!confirm('Des modifications ne sont pas encore synchronisées et seront PERDUES si vous vous déconnectez maintenant. Se déconnecter quand même ?')) return false;
      }
    }
    try { if(window.GPSupabase && window.GPSupabase.available()) await window.GPSupabase.client().auth.signOut(); } catch(_) {}
    window._supabaseCurrentUser=null;
    window.currentUser=null;
    // Un poste partagé ne doit pas conserver les données métier après déconnexion.
    // On supprime les caches connus ; la configuration Supabase reste conservée.
    try {
      [
        'gp_session_name','gp_session_firstname','gp_session_role',
        'geniusproperty_db_clean_v1','geniusproperty_db_authoritative_v1',
        'geniusproperty_last_backup_snapshot','geniusproperty_last_backup_date',
        'gpdb_local_revision','gp_data_dirty_at'
      ].forEach(function(k){ localStorage.removeItem(k); });
      for(var i=localStorage.length-1;i>=0;i--){
        var k=localStorage.key(i);
        if(k && k.indexOf('geniusproperty_backup_')===0) localStorage.removeItem(k);
      }
    } catch(_) {}
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
