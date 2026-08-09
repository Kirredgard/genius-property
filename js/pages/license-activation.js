/* Genius Property — Activation Licence Client v8 */
(function(){
  'use strict';
  var state={loading:false,error:null,agency:null,license:null};
  function db(){return window._firebaseDB;} function auth(){return window._firebaseAuth;}
  function uid(){return auth()&&auth().currentUser&&auth().currentUser.uid;} function email(){return auth()&&auth().currentUser&&auth().currentUser.email;}
  function agencyId(){ if(window.GPFirebase&&window.GPFirebase.status) return window.GPFirebase.status().agencyId; return localStorage.getItem('geniusproperty_current_agency_id') || ('agency_'+(uid()||'user')); }
  function esc(s){return String(s==null?'':s).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function toast(m,t){ if(typeof window.toast==='function') window.toast(m,t||'ok'); else alert(m); }
  function now(){return new Date().toISOString();}
  function addMonths(m){var d=new Date(); d.setMonth(d.getMonth()+Number(m||1)); return d;}
  async function sdk(){ if(window._fbGetDoc&&window._fbSetDoc) return window; var mod=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'); Object.assign(window,{_fbDoc:mod.doc,_fbCollection:mod.collection,_fbGetDoc:mod.getDoc,_fbSetDoc:mod.setDoc}); return window; }
  async function ensureAgency(){
    var aId=agencyId(); var ref=window._fbDoc(window._fbCollection(db(),'agencies'),aId); var snap=await window._fbGetDoc(ref);
    if(!snap.exists()){
      await window._fbSetDoc(ref,{name:'Mon agence',ownerUid:uid(),status:'trial',licenseStatus:'pending',createdAt:now(),updatedAt:now()},{merge:true});
      await window._fbSetDoc(window._fbDoc(window._fbCollection(db(),'agencies',aId,'members'),uid()),{uid:uid(),email:email()||'',role:'owner',status:'active',createdAt:now(),updatedAt:now()},{merge:true});
      snap=await window._fbGetDoc(ref);
    }
    state.agency=snap.data()||{}; return aId;
  }
  async function load(){
    state.loading=true; state.error=null; render();
    try{ if(!db()) throw new Error('Firebase non initialisé.'); if(!uid()) throw new Error('Connecte-toi d’abord.'); await sdk(); var aId=await ensureAgency(); var key=state.agency.licenseKey; state.license=null; if(key){var ls=await window._fbGetDoc(window._fbDoc(window._fbCollection(db(),'licenses'),key)); if(ls.exists()) state.license=Object.assign({id:ls.id},ls.data());} if(window.GPLicenseGuard) await window.GPLicenseGuard.refresh(); }
    catch(e){state.error=e.message||String(e);} state.loading=false; render();
  }
  async function activate(){
    try{
      await sdk(); if(!uid()) throw new Error('Connecte-toi d’abord.'); var key=((document.getElementById('clientLicenseKey')||{}).value||'').trim().toUpperCase(); if(!key) throw new Error('Entre une clé licence.');
      var aId=await ensureAgency(); var ref=window._fbDoc(window._fbCollection(db(),'licenses'),key); var snap=await window._fbGetDoc(ref); if(!snap.exists()) throw new Error('Licence introuvable.');
      var l=snap.data()||{}; if(['suspended','revoked','expired'].indexOf(l.status)>=0) throw new Error('Cette licence est '+l.status+'.'); if(l.agencyId && l.agencyId!==aId) throw new Error('Cette licence est déjà liée à une autre agence.');
      var exp=l.expiresAt || (l.durationMonths==='lifetime'?null:addMonths(l.durationMonths||1));
      await window._fbSetDoc(ref,{status:'active',agencyId:aId,activatedBy:uid(),activatedByEmail:email()||'',activatedAt:now(),lastSeenAt:now(),expiresAt:exp,updatedAt:now()},{merge:true});
      await window._fbSetDoc(window._fbDoc(window._fbCollection(db(),'agencies'),aId),{licenseKey:key,licenseStatus:'active',licenseType:l.type||'solo',licenseExpiresAt:exp,maxUsers:l.maxUsers||1,maxProperties:l.maxProperties||50,status:'active',updatedAt:now()},{merge:true});
      toast('Licence activée.'); if(window.GPLicenseGuard) await window.GPLicenseGuard.refresh(); await load();
      setTimeout(function(){ if(window.GPNavigation&&window.GPNavigation.go) window.GPNavigation.go('dashboard'); },700);
    }catch(e){toast(e.message||String(e),'err');}
  }
  function fmt(v){ if(!v) return 'Illimité'; var d=v.toDate?v.toDate():new Date(v); return isNaN(d.getTime())?'—':d.toLocaleDateString('fr-FR'); }
  function render(){
    var root=document.getElementById('gp-license-activation-root'); if(!root) return; var l=state.license, a=state.agency||{};
    root.innerHTML='<section class="license-manager"><div class="license-hero"><div><div class="license-kicker">Activation</div><h2>Activer votre licence</h2><p>Connectez-vous, collez la clé reçue par WhatsApp/email, puis accédez au dashboard.</p></div><button class="btn btn-primary" onclick="GPLicenseActivation.load()">Actualiser</button></div>'+
      (state.error?'<div class="license-alert err"><b>Erreur :</b> '+esc(state.error)+'</div>':'')+
      '<div class="license-grid"><div class="license-card"><h3>Clé licence</h3><label>Votre clé<input id="clientLicenseKey" class="license-input" placeholder="GENIUS-SOLO-1M-XXXX-XXXX-XXXX"></label><button class="btn btn-primary" onclick="GPLicenseActivation.activate()">Activer maintenant</button><p class="license-note">La clé est liée automatiquement à votre agence.</p></div>'+
      '<div class="license-card"><h3>Statut actuel</h3><div class="license-status"><div><span>Agence</span><b>'+esc(a.name||'Mon agence')+'</b></div><div><span>Licence</span><b>'+esc(a.licenseKey||'Aucune')+'</b></div><div><span>Statut</span><b>'+esc((l&&l.status)||a.licenseStatus||'pending')+'</b></div><div><span>Expiration</span><b>'+fmt((l&&l.expiresAt)||a.licenseExpiresAt)+'</b></div></div></div></div></section>';
  }
  function init(){ if(window.GPNavigation&&window.GPNavigation.registerRenderer){ window.GPNavigation.pageConfig['license-activation']={name:'Activation',icon:'key'}; window.GPNavigation.registerRenderer('license-activation',load);} render(); }
  window.GPLicenseActivation={load:load,activate:activate,render:render};
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(init,900); });
})();
