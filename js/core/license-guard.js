/* Genius Property — License Guard v7
   Licences temporaires : 1, 3, 6, 12 mois ou lifetime. */
(function(){
  'use strict';
  var LICENSE_TYPES = {
    trial:{ label:'Trial', maxUsers:1, maxProperties:20 },
    solo:{ label:'Solo', maxUsers:1, maxProperties:50 },
    agency:{ label:'Agence', maxUsers:5, maxProperties:300 },
    enterprise:{ label:'Enterprise', maxUsers:10, maxProperties:null },
    lifetime:{ label:'Lifetime', maxUsers:10, maxProperties:null }
  };
  var state = { agency:null, license:null, daysLeft:null, locked:false, reason:null, lastCheck:null };
  function db(){ return window._firebaseDB; }
  function auth(){ return window._firebaseAuth; }
  function uid(){ return auth() && auth().currentUser && auth().currentUser.uid; }
  function agencyId(){ if(window.GPFirebase && window.GPFirebase.status) return window.GPFirebase.status().agencyId; return localStorage.getItem('geniusproperty_current_agency_id') || null; }
  function now(){ return new Date(); }
  function parseDate(v){ if(!v) return null; if(v.toDate) return v.toDate(); var d=new Date(v); return isNaN(d.getTime())?null:d; }
  async function sdk(){
    if(window._fbGetDoc && window._fbSetDoc) return window;
    var mod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    window._fbDoc=mod.doc; window._fbCollection=mod.collection; window._fbGetDoc=mod.getDoc; window._fbSetDoc=mod.setDoc; window._fbServerTimestamp=mod.serverTimestamp;
    return window;
  }
  function normalize(agency, license){
    var type = (license && license.type) || (agency && agency.licenseType) || 'trial';
    if(!LICENSE_TYPES[type]) type = 'trial';
    var status = (license && license.status) || (agency && agency.licenseStatus) || agency && agency.status || 'trial';
    var expiresAt = parseDate((license && license.expiresAt) || (agency && agency.licenseExpiresAt));
    var lifetime = type === 'lifetime' || !expiresAt;
    var daysLeft = lifetime ? null : Math.ceil((expiresAt.getTime() - now().getTime()) / 86400000);
    var expired = !lifetime && expiresAt && expiresAt.getTime() < now().getTime();
    var locked = status === 'expired' || status === 'suspended' || status === 'revoked' || expired;
    return Object.assign({}, license || {}, { type:type, status:expired?'expired':status, expiresAt:expiresAt, daysLeft:daysLeft, locked:locked, plan:LICENSE_TYPES[type] });
  }
  async function refresh(){
    try{
      if(!db() || !agencyId()) return state;
      await sdk();
      var aRef = window._fbDoc(window._fbCollection(db(),'agencies'), agencyId());
      var aSnap = await window._fbGetDoc(aRef).catch(function(){ return null; });
      state.agency = aSnap && aSnap.exists() ? aSnap.data() : null;
      var key = state.agency && state.agency.licenseKey;
      var lic = null;
      if(key){ var lSnap = await window._fbGetDoc(window._fbDoc(window._fbCollection(db(),'licenses'), key)).catch(function(){return null;}); lic = lSnap && lSnap.exists() ? lSnap.data() : null; }
      state.license = normalize(state.agency, lic);
      state.daysLeft = state.license.daysLeft;
      state.locked = !!state.license.locked;
      state.reason = state.locked ? 'Licence expirée, suspendue ou révoquée' : null;
      state.lastCheck = new Date().toISOString();
      renderBanner(); applyWriteLock(); redirectIfNeeded();
      try{ window.dispatchEvent(new CustomEvent('gp:license-updated',{ detail:status() })); }catch(e){}
      return state;
    }catch(e){ console.warn('[LicenseGuard] refresh failed', e); return state; }
  }

  function redirectIfNeeded(){
    var page = window.GP_CURRENT_PAGE || '';
    var admin = window.GPSuperAdmin && window.GPSuperAdmin.status && window.GPSuperAdmin.status().isSuperAdmin;
    var allowed = page === 'license-activation' || page === 'login' || page === 'admin-saas' || page === 'license-manager';
    var noLicense = !state.license || state.locked || !state.agency || !state.agency.licenseKey;
    if(!admin && noLicense && !allowed && window.GPNavigation && typeof window.GPNavigation.go === 'function'){
      window.GPNavigation.go('license-activation');
    }
  }

  function canWrite(domain){ if(state.locked) return false; if(window.GPPermissions && window.GPPermissions.canWrite) return window.GPPermissions.canWrite(domain||'biens'); return true; }
  function canAddProperty(currentCount){ if(state.locked) return {ok:false,reason:'Licence expirée ou suspendue.'}; var p=(state.license&&state.license.plan)||LICENSE_TYPES.trial; if(p.maxProperties!=null && Number(currentCount||0)>=p.maxProperties) return {ok:false,reason:'Limite de biens atteinte pour la licence '+p.label+'.'}; return {ok:true}; }
  function canAddUser(currentCount){ if(state.locked) return {ok:false,reason:'Licence expirée ou suspendue.'}; var p=(state.license&&state.license.plan)||LICENSE_TYPES.trial; if(p.maxUsers!=null && Number(currentCount||0)>=p.maxUsers) return {ok:false,reason:'Limite utilisateurs atteinte pour la licence '+p.label+'.'}; return {ok:true}; }
  function beforeWrite(domain){ if(!canWrite(domain)){ var msg=state.reason||'Action bloquée par licence.'; if(typeof window.toast==='function') window.toast(msg,'err'); throw new Error(msg); } return true; }
  function applyWriteLock(){ document.querySelectorAll('[data-write-action], .btn-primary, button[type="submit"]').forEach(function(el){ var page=window.GP_CURRENT_PAGE||''; var allow=page==='license-activation'||page==='license-manager'||page==='admin-saas'||page==='sync'||page==='admin-stockage'; if(state.locked&&!allow){ el.disabled=true; el.classList.add('gp-disabled-by-license'); el.title='Licence expirée — lecture seule'; } }); }
  function renderBanner(){ var id='gp-license-banner'; var existing=document.getElementById(id); var l=state.license||{}; var text=''; var cls=''; if(l.locked){ text='Licence expirée ou suspendue — données en lecture seule. Contactez l’administrateur.'; cls=' locked'; } else if(typeof l.daysLeft==='number' && l.daysLeft<=7){ text='Votre licence expire dans '+l.daysLeft+' jour(s). Pensez au renouvellement.'; } if(!text){ if(existing) existing.remove(); return; } if(!existing){ existing=document.createElement('div'); existing.id=id; existing.className='gp-license-banner'; document.body.prepend(existing); } existing.className='gp-license-banner'+cls; existing.textContent=text; }
  function status(){ return { license:state.license, agency:state.agency, locked:state.locked, daysLeft:state.daysLeft, reason:state.reason, plans:LICENSE_TYPES }; }
  window.GPLicenseGuard = { refresh:refresh, status:status, canWrite:canWrite, beforeWrite:beforeWrite, canAddProperty:canAddProperty, canAddUser:canAddUser, LICENSE_TYPES:LICENSE_TYPES };
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(refresh, 1600); setInterval(refresh, 24*60*60*1000); });
})();
