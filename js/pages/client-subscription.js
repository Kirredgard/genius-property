/* Genius Property — v19 Client Subscription Page
   Petite page compacte pour afficher le statut abonnement/licence côté client. */
(function(){
  'use strict';

  var state = { loading:false, agency:null, license:null, error:null };

  function auth(){ return window._firebaseAuth; }
  function db(){ return window._firebaseDB; }
  function user(){ return auth() && auth().currentUser; }
  function uid(){ return user() && user().uid; }
  function email(){ return String((user() && user().email) || '').toLowerCase(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function fmtDate(v){
    if(!v) return 'À vie';
    try{ var d = v && v.toDate ? v.toDate() : new Date(v); return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR'); }
    catch(e){ return String(v); }
  }
  function statusLabel(s){
    s = String(s || 'active').toLowerCase();
    if(s === 'active') return 'Actif';
    if(s === 'suspended') return 'Suspendu';
    if(s === 'blocked') return 'Bloqué';
    if(s === 'expired') return 'Expiré';
    return s;
  }
  function typeLabel(t){
    t = String(t || '').toLowerCase();
    if(t === 'solo') return 'Solo';
    if(t === 'agency') return 'Agence';
    if(t === 'business') return 'Business';
    if(t === 'pro') return 'Pro';
    if(t === 'starter') return 'Starter';
    return t || 'Standard';
  }
  async function fsmod(){ return import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'); }

  async function findAgency(fs){
    if(!db() || !uid()) return null;
    // Cas créé par le dashboard simple: agency_{clientUid}
    var direct = await fs.getDoc(fs.doc(db(), 'agencies', 'agency_' + uid()));
    if(direct.exists()) return Object.assign({ id: direct.id }, direct.data() || {});

    // Cas ownerUid = uid
    var q1 = fs.query(fs.collection(db(), 'agencies'), fs.where('ownerUid','==',uid()), fs.limit(1));
    var s1 = await fs.getDocs(q1);
    var found = null; s1.forEach(function(d){ if(!found) found = Object.assign({ id:d.id }, d.data()||{}); });
    if(found) return found;

    // Cas email agence/client
    var q2 = fs.query(fs.collection(db(), 'agencies'), fs.where('email','==',email()), fs.limit(1));
    var s2 = await fs.getDocs(q2);
    s2.forEach(function(d){ if(!found) found = Object.assign({ id:d.id }, d.data()||{}); });
    return found;
  }

  async function findLicense(fs, agency){
    if(!db()) return null;
    if(agency && agency.licenseKey){
      var direct = await fs.getDoc(fs.doc(db(), 'licenses', agency.licenseKey));
      if(direct.exists()) return Object.assign({ id: direct.id }, direct.data() || {});
    }
    var found = null;
    if(agency && agency.id){
      var q1 = fs.query(fs.collection(db(), 'licenses'), fs.where('agencyId','==',agency.id), fs.limit(1));
      var s1 = await fs.getDocs(q1);
      s1.forEach(function(d){ if(!found) found = Object.assign({ id:d.id }, d.data()||{}); });
    }
    if(!found && uid()){
      var q2 = fs.query(fs.collection(db(), 'licenses'), fs.where('ownerUid','==',uid()), fs.limit(1));
      var s2 = await fs.getDocs(q2);
      s2.forEach(function(d){ if(!found) found = Object.assign({ id:d.id }, d.data()||{}); });
    }
    return found;
  }

  async function load(){
    state.loading = true; state.error = null; render();
    try{
      if(!user()) throw new Error('Utilisateur non connecté.');
      var fs = await fsmod();
      var agency = await findAgency(fs);
      var license = await findLicense(fs, agency);
      state.agency = agency;
      state.license = license;
    }catch(e){
      state.error = e.message || String(e);
    }finally{
      state.loading = false; render();
    }
  }

  function currentData(){
    var a = state.agency || {};
    var l = state.license || {};
    return {
      agencyName: a.name || l.agencyName || 'Agence',
      licenseKey: l.licenseKey || a.licenseKey || l.id || '—',
      status: l.status || a.licenseStatus || a.subscriptionStatus || a.accessStatus || 'active',
      expiresAt: l.expiresAt || a.expiresAt || null,
      type: l.type || a.plan || 'standard',
      maxUsers: l.maxUsers || a.maxUsers || '—',
      maxProperties: l.maxProperties || a.maxProperties || '—'
    };
  }

  function render(){
    var el = document.getElementById('gp-client-subscription-root');
    if(!el) return;
    if(state.loading){ el.innerHTML = '<section class="sub-mini"><div class="sub-card">Chargement abonnement...</div></section>'; return; }
    if(state.error){ el.innerHTML = '<section class="sub-mini"><div class="sub-card sub-error">'+esc(state.error)+'</div></section>'; return; }
    var d = currentData();
    var ok = String(d.status).toLowerCase() === 'active';
    el.innerHTML =
      '<section class="sub-mini">'+
        '<div class="sub-head"><div><span>Mon abonnement</span><h2>Statut de licence</h2></div><button onclick="GPClientSubscription.load()">Actualiser</button></div>'+
        '<div class="sub-line">'+
          '<div><small>Agence</small><b>'+esc(d.agencyName)+'</b></div>'+
          '<div><small>Licence</small><b class="sub-key">'+esc(d.licenseKey)+'</b></div>'+
          '<div><small>État</small><b class="sub-badge '+(ok?'ok':'bad')+'">'+esc(statusLabel(d.status))+'</b></div>'+
          '<div><small>Fin</small><b>'+esc(fmtDate(d.expiresAt))+'</b></div>'+
          '<div><small>Type</small><b>'+esc(typeLabel(d.type))+'</b></div>'+
          '<div><small>Limites</small><b>'+esc(d.maxUsers)+' users / '+esc(d.maxProperties)+' biens</b></div>'+
        '</div>'+
        '<div class="sub-offers">'+
          '<div><b>Starter</b><span>15k FCFA / mois · 1 utilisateur · 50 biens</span></div>'+
          '<div><b>Pro</b><span>35k FCFA / mois · 3 utilisateurs · 300 biens</span></div>'+
          '<div><b>Business</b><span>65k FCFA / mois · 10 utilisateurs · illimité</span></div>'+
          '<div><b>Offre personnalisée</b><span>Sur mesure selon votre agence, le nombre d’utilisateurs, de biens et vos besoins.</span></div>'+
        '</div>'+
        '<div class="sub-contact">'+
          '<b>Pour prolonger ou changer d’offre, contactez l’administrateur.</b>'+
          '<span>🇸🇳 +221 77 587 80 04 / +221 78 778 18 18</span>'+
          '<span>🌍 +33 6 61 31 18 02</span>'+
          '<span>✉️ support@geniusimmobtp.com</span>'+
        '</div>'+
      '</section>';
  }

  function init(){
    if(window.GPNavigation && window.GPNavigation.registerRenderer){
      window.GPNavigation.pageConfig['abonnement'] = { name:'Abonnement', icon:'workspace_premium' };
      window.GPNavigation.registerRenderer('abonnement', load);
    }
  }

  window.GPClientSubscription = { load:load, render:render };
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('firebase:ready', function(){ setTimeout(init, 400); });
})();
