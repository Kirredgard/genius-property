
/* Genius Property — v11 Simple Client License Dashboard
   Une seule page compacte: créer client + licence active, surveiller/prolonger/suspendre. */
(function(){
  'use strict';

  var ADMIN_EMAILS = ['oumarsackefall@gmail.com'];
  var state = { loading:false, licenses:[], error:null, lastAccess:null, isAdmin:false };

  function auth(){ return window._firebaseAuth; }
  function db(){ return window._firebaseDB; }
  function currentUser(){ return auth() && auth().currentUser; }
  function uid(){ return currentUser() && currentUser().uid; }
  function email(){ return currentUser() && currentUser().email; }
  function okEmail(){ return ADMIN_EMAILS.indexOf(String(email()||'').toLowerCase()) !== -1; }
  function toast(m,t){ if(typeof window.toast==='function') window.toast(m,t||'ok'); else alert(m); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function val(id){ var el=document.getElementById(id); return el ? String(el.value||'').trim() : ''; }
  function monthsToDate(months){
    if(months === 'lifetime') return null;
    var d = new Date();
    d.setMonth(d.getMonth() + Number(months||1));
    return d.toISOString();
  }
  function fmtDate(v){
    if(!v) return 'À vie';
    try{
      var d = v && v.toDate ? v.toDate() : new Date(v);
      return d.toLocaleDateString('fr-FR');
    }catch(e){ return String(v); }
  }
  function addMonthsToIso(v, months){
    var d = v ? new Date(v) : new Date();
    if(isNaN(d.getTime()) || d < new Date()) d = new Date();
    d.setMonth(d.getMonth() + Number(months||1));
    return d.toISOString();
  }
  function makeKey(type, months){
    var a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s='';
    for(var i=0;i<12;i++) s+=a[Math.floor(Math.random()*a.length)];
    return 'GENIUS-' + String(type||'AGENCY').toUpperCase() + '-' + (months==='lifetime'?'LIFE':months+'M') + '-' + s.match(/.{1,4}/g).join('-');
  }

  async function modules(){
    var app = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    var au = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    var fs = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { app:app, au:au, fs:fs };
  }

  async function checkAdmin(){
    var u = uid();
    if(!u) return false;
    if(okEmail()) return true;
    try{
      var fs = (await modules()).fs;
      var snap = await fs.getDoc(fs.doc(db(),'superAdmins',u));
      return !!(snap.exists() && snap.data() && snap.data().active === true);
    }catch(e){
      console.warn('[SimpleAdmin] admin check failed', e);
      return okEmail();
    }
  }

  async function load(){
    state.loading = true; render();
    try{
      state.isAdmin = await checkAdmin();
      if(!state.isAdmin){ state.licenses=[]; return; }
      var fs = (await modules()).fs;
      var snap = await fs.getDocs(fs.collection(db(),'licenses'));
      state.licenses = [];
      snap.forEach(function(docSnap){
        var d = docSnap.data() || {};
        d.id = docSnap.id;
        state.licenses.push(d);
      });
      state.licenses.sort(function(a,b){ return String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
      state.error = null;
    }catch(e){
      state.error = e.message || String(e);
      toast('Erreur chargement licences : '+state.error, 'err');
    }finally{
      state.loading = false; render();
    }
  }

  async function createClient(){
    if(!(await checkAdmin())) return toast('Accès réservé admin.', 'err');

    var agencyName = val('sl_agency') || 'Agence client';
    var clientEmail = val('sl_email').toLowerCase();
    var password = val('sl_password') || '123456';
    var duration = val('sl_duration') || '1';
    var maxUsers = Number(val('sl_users') || 1);
    var maxProperties = Number(val('sl_properties') || 50);

    if(!clientEmail || !clientEmail.includes('@')) return toast('Email client invalide.', 'err');
    if(password.length < 6) return toast('Mot de passe : minimum 6 caractères.', 'err');

    state.loading = true; render();
    try{
      var m = await modules();
      var secondaryName = 'clientCreator_' + Date.now();
      var secondaryApp = m.app.initializeApp(window._firebaseConfig, secondaryName);
      var secondaryAuth = m.au.getAuth(secondaryApp);
      var cred = await m.au.createUserWithEmailAndPassword(secondaryAuth, clientEmail, password);
      var clientUid = cred.user.uid;
      await m.au.signOut(secondaryAuth);
      await m.app.deleteApp(secondaryApp);

      var agencyId = 'agency_' + clientUid;
      var licenseType = maxUsers > 5 ? 'business' : (maxUsers > 1 ? 'agency' : 'solo');
      var licenseKey = makeKey(licenseType, duration);
      var expiresAt = monthsToDate(duration);
      var createdAt = new Date().toISOString();

      var agency = {
        name: agencyName,
        email: clientEmail,
        ownerUid: clientUid,
        status: 'active',
        accessStatus: 'active',
        plan: licenseType,
        subscriptionStatus: 'active',
        licenseStatus: 'active',
        licenseKey: licenseKey,
        maxUsers: maxUsers,
        maxProperties: maxProperties,
        expiresAt: expiresAt,
        createdAt: createdAt,
        updatedAt: createdAt
      };
      var license = {
        licenseKey: licenseKey,
        agencyId: agencyId,
        agencyName: agencyName,
        clientEmail: clientEmail,
        ownerUid: clientUid,
        status: 'active',
        type: licenseType,
        durationMonths: duration === 'lifetime' ? null : Number(duration),
        maxUsers: maxUsers,
        maxProperties: maxProperties,
        expiresAt: expiresAt,
        createdAt: createdAt,
        updatedAt: createdAt,
        issuedBy: uid(),
        issuedByEmail: email()
      };
      var member = {
        uid: clientUid,
        email: clientEmail,
        role: 'owner',
        status: 'active',
        createdAt: createdAt
      };

      await m.fs.setDoc(m.fs.doc(db(),'agencies',agencyId), agency, { merge:true });
      await m.fs.setDoc(m.fs.doc(db(),'agencies',agencyId,'members',clientUid), member, { merge:true });
      await m.fs.setDoc(m.fs.doc(db(),'licenses',licenseKey), license, { merge:true });

      state.lastAccess = { agencyName:agencyName, email:clientEmail, password:password, licenseKey:licenseKey, expiresAt:expiresAt };
      toast('Client créé + licence active générée.', 'ok');
      await load();
    }catch(e){
      var msg = e && e.code === 'auth/email-already-in-use'
        ? "Cet email existe déjà dans Firebase Auth. Utilise un autre email ou crée seulement la licence manuellement."
        : (e.message || String(e));
      toast(msg, 'err');
      state.loading = false; render();
    }
  }

  async function updateLicense(key, patch){
    if(!(await checkAdmin())) return toast('Accès réservé admin.', 'err');
    try{
      var fs = (await modules()).fs;
      var lic = state.licenses.find(function(x){ return x.licenseKey===key || x.id===key; }) || {};
      patch.updatedAt = new Date().toISOString();
      await fs.setDoc(fs.doc(db(),'licenses',key), patch, { merge:true });
      if(lic.agencyId){
        var agencyPatch = { updatedAt:patch.updatedAt };
        if(patch.status){
          agencyPatch.licenseStatus = patch.status;
          agencyPatch.accessStatus = patch.status === 'active' ? 'active' : 'blocked';
          agencyPatch.subscriptionStatus = patch.status === 'active' ? 'active' : 'blocked';
        }
        if(patch.expiresAt !== undefined) agencyPatch.expiresAt = patch.expiresAt;
        if(patch.maxUsers !== undefined) agencyPatch.maxUsers = patch.maxUsers;
        if(patch.maxProperties !== undefined) agencyPatch.maxProperties = patch.maxProperties;
        await fs.setDoc(fs.doc(db(),'agencies',lic.agencyId), agencyPatch, { merge:true });
      }
      toast('Licence mise à jour.', 'ok');
      await load();
    }catch(e){ toast(e.message || String(e), 'err'); }
  }

  function suspend(key){ updateLicense(key,{status:'suspended'}); }
  function reactivate(key){ updateLicense(key,{status:'active'}); }
  function prolong(key, months){
    var lic = state.licenses.find(function(x){ return x.licenseKey===key || x.id===key; }) || {};
    updateLicense(key,{status:'active', expiresAt:addMonthsToIso(lic.expiresAt, months)});
  }
  function copyAccess(key){
    var lic = state.licenses.find(function(x){ return x.licenseKey===key || x.id===key; });
    if(!lic) return;
    var txt = "Accès Genius Property\nLien : " + location.origin + "\nAgence : " + (lic.agencyName||'') + "\nEmail : " + (lic.clientEmail||'') + "\nLicence : " + (lic.licenseKey||key) + "\nExpiration : " + fmtDate(lic.expiresAt);
    navigator.clipboard && navigator.clipboard.writeText(txt);
    toast('Accès copié.', 'ok');
  }


  function viewLicense(key){
    var l = state.licenses.find(function(x){ return x.licenseKey===key || x.id===key; });
    if(!l) return toast('Licence introuvable.', 'err');
    var active = l.status === 'active';
    var html = '<div class="sl-modal-backdrop" onclick="GPSimpleLicenseAdmin.closeModal(event)">'+
      '<div class="sl-modal" onclick="event.stopPropagation()">'+
        '<div class="sl-modal-head"><b>Détails licence</b><button onclick="GPSimpleLicenseAdmin.closeModal()"><span class="material-symbols-rounded">close</span></button></div>'+
        '<div class="sl-modal-grid">'+
          '<div><small>Agence</small><b>'+esc(l.agencyName||l.clientName||'Agence')+'</b></div>'+
          '<div><small>Email</small><b>'+esc(l.clientEmail||'')+'</b></div>'+
          '<div><small>Licence</small><b class="mono">'+esc(l.licenseKey||key)+'</b></div>'+
          '<div><small>Statut</small><b>'+esc(l.status||'active')+'</b></div>'+
          '<div><small>Expiration</small><b>'+esc(fmtDate(l.expiresAt))+'</b></div>'+
          '<div><small>Type</small><b>'+esc(l.type||l.plan||'')+'</b></div>'+
          '<div><small>Utilisateurs</small><b>'+esc(l.maxUsers||1)+'</b></div>'+
          '<div><small>Biens</small><b>'+esc(l.maxProperties||'∞')+'</b></div>'+
          '<div><small>Agence ID</small><b class="mono">'+esc(l.agencyId||'')+'</b></div>'+
          '<div><small>Owner UID</small><b class="mono">'+esc(l.ownerUid||'')+'</b></div>'+
          '<div><small>Créée le</small><b>'+esc(fmtDate(l.createdAt))+'</b></div>'+
          '<div><small>Mise à jour</small><b>'+esc(fmtDate(l.updatedAt))+'</b></div>'+
        '</div>'+
        '<div class="sl-modal-actions">'+
          '<button onclick="GPSimpleLicenseAdmin.copyAccess(\''+esc(key)+'\')"><span class="material-symbols-rounded">content_copy</span> Copier accès</button>'+
          (active?'<button onclick="GPSimpleLicenseAdmin.suspend(\''+esc(key)+'\')"><span class="material-symbols-rounded">pause_circle</span> Suspendre</button>':'<button onclick="GPSimpleLicenseAdmin.reactivate(\''+esc(key)+'\')"><span class="material-symbols-rounded">play_circle</span> Réactiver</button>')+
        '</div>'+
      '</div>'+
    '</div>';
    var box = document.getElementById('sl-modal-host');
    if(!box){ box=document.createElement('div'); box.id='sl-modal-host'; document.body.appendChild(box); }
    box.innerHTML = html;
  }

  function closeModal(){
    var box = document.getElementById('sl-modal-host');
    if(box) box.innerHTML = '';
  }

  async function deleteLicense(key){
    if(!(await checkAdmin())) return toast('Accès réservé admin.', 'err');
    var lic = state.licenses.find(function(x){ return x.licenseKey===key || x.id===key; }) || {};
    if(!confirm('Supprimer cette licence de la surveillance ?')) return;
    try{
      var fs = (await modules()).fs;
      await fs.deleteDoc(fs.doc(db(),'licenses',key));
      if(lic.agencyId){
        await fs.setDoc(fs.doc(db(),'agencies',lic.agencyId), {
          licenseStatus:'deleted', accessStatus:'blocked', subscriptionStatus:'blocked', updatedAt:new Date().toISOString()
        }, { merge:true });
      }
      toast('Licence supprimée.', 'ok');
      closeModal();
      await load();
    }catch(e){ toast(e.message || String(e), 'err'); }
  }

  function accessBox(){
    if(!state.lastAccess) return '';
    var a = state.lastAccess;
    return '<div class="sl-access"><b>Accès à envoyer au client</b><pre>Lien : '+esc(location.origin)+'\nEmail : '+esc(a.email)+'\nMot de passe : '+esc(a.password)+'\nLicence : '+esc(a.licenseKey)+'\nExpire le : '+esc(fmtDate(a.expiresAt))+'</pre></div>';
  }

  function licenseRows(){
    if(!state.licenses.length) return '<div class="sl-empty">Aucune licence pour le moment.</div>';
    return '<div class="sl-table">'+state.licenses.map(function(l){
      var key = l.licenseKey || l.id;
      var active = l.status === 'active';
      var status = l.status || 'active';
      return '<div class="sl-row sl-row-compact">'+
        '<div class="sl-agency"><b>'+esc(l.agencyName||l.clientName||'Agence')+'</b><span>'+esc(l.clientEmail||'')+'</span></div>'+
        '<div class="sl-key mono">'+esc(key)+'</div>'+
        '<div class="sl-meta"><b>'+esc(fmtDate(l.expiresAt))+'</b><span>'+esc(l.maxUsers||1)+' u. / '+esc(l.maxProperties||'∞')+' biens</span></div>'+
        '<div><span class="sl-badge '+(active?'ok':'bad')+'">'+esc(status)+'</span></div>'+
        '<div class="sl-actions sl-icon-actions">'+
          '<button title="Voir" onclick="GPSimpleLicenseAdmin.viewLicense(\''+esc(key)+'\')"><span class="material-symbols-rounded">visibility</span></button>'+
          '<button title="Prolonger 1 mois" onclick="GPSimpleLicenseAdmin.prolong(\''+esc(key)+'\',1)"><span class="material-symbols-rounded">event_upcoming</span><small>1m</small></button>'+
          '<button title="Prolonger 1 an" onclick="GPSimpleLicenseAdmin.prolong(\''+esc(key)+'\',12)"><span class="material-symbols-rounded">event_repeat</span><small>1a</small></button>'+
          (active?'<button title="Suspendre" onclick="GPSimpleLicenseAdmin.suspend(\''+esc(key)+'\')"><span class="material-symbols-rounded">pause_circle</span></button>':'<button title="Réactiver" onclick="GPSimpleLicenseAdmin.reactivate(\''+esc(key)+'\')"><span class="material-symbols-rounded">play_circle</span></button>')+
          '<button class="gold" title="Copier" onclick="GPSimpleLicenseAdmin.copyAccess(\''+esc(key)+'\')"><span class="material-symbols-rounded">content_copy</span></button>'+
          '<button class="danger" title="Supprimer" onclick="GPSimpleLicenseAdmin.deleteLicense(\''+esc(key)+'\')"><span class="material-symbols-rounded">delete</span></button>'+
        '</div>'+
      '</div>';
    }).join('')+'</div>';
  }

  function render(){
    var el = document.getElementById('gp-admin-saas-root') || document.getElementById('gp-license-manager-root');
    if(!el) return;
    if(!currentUser()){
      el.innerHTML = '<section class="sl-wrap"><div class="sl-card">Connecte-toi pour accéder au dashboard licences.</div></section>';
      return;
    }
    el.innerHTML =
      '<section class="sl-wrap sl-admin-compact">'+
        '<div class="sl-head"><div><div class="sl-kicker">Genius Property</div><h2>Licences</h2><p>Créer, surveiller, prolonger.</p></div><button onclick="GPSimpleLicenseAdmin.load()">Actualiser</button></div>'+
        (!state.isAdmin && !okEmail()?'<div class="sl-alert">Accès admin non confirmé. Ajoute ton email dans le code ou crée <b>superAdmins/'+esc(uid())+'</b>.</div>':'')+
        '<div class="sl-card"><h3>Créer client</h3>'+
          '<div class="sl-form">'+
            '<label>Nom agence<input id="sl_agency" placeholder="Nom de l’agence"></label>'+
            '<label>Email client<input id="sl_email" type="email" placeholder="client@email.com"></label>'+
            '<label>Mot de passe<input id="sl_password" value="123456"></label>'+
            '<label>Durée<select id="sl_duration"><option value="1">1 mois</option><option value="3">3 mois</option><option value="6">6 mois</option><option value="12">1 an</option><option value="lifetime">À vie</option></select></label>'+
            '<label>Utilisateurs<input id="sl_users" type="number" value="3" min="1"></label>'+
            '<label>Biens<input id="sl_properties" type="number" value="300" min="1"></label>'+
          '</div>'+
          '<button class="sl-main" onclick="GPSimpleLicenseAdmin.createClient()" '+(state.loading?'disabled':'')+'>'+(state.loading?'Patiente...':'Créer + générer licence')+'</button>'+
          accessBox()+
        '</div>'+
        '<div class="sl-card"><div class="sl-title"><h3>Surveillance</h3><span>'+state.licenses.length+'</span></div>'+licenseRows()+'</div>'+
      '</section>';
  }

  function init(){
    if(window.GPNavigation && window.GPNavigation.registerRenderer){
      window.GPNavigation.pageConfig['admin-saas'] = { name:'Licences simples', icon:'vpn_key' };
      window.GPNavigation.registerRenderer('admin-saas', load);
      window.GPNavigation.pageConfig['license-manager'] = { name:'Licences simples', icon:'vpn_key' };
      window.GPNavigation.registerRenderer('license-manager', load);
    }
    setTimeout(load, 500);
  }

  window.GPSimpleLicenseAdmin = { load:load, render:render, createClient:createClient, suspend:suspend, reactivate:reactivate, prolong:prolong, copyAccess:copyAccess, viewLicense:viewLicense, closeModal:closeModal, deleteLicense:deleteLicense };
  window.GPAdminSaaS = window.GPSimpleLicenseAdmin;
  window.GPLicenseManager = window.GPSimpleLicenseAdmin;
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('firebase:ready', function(){ setTimeout(load, 500); });
})();
