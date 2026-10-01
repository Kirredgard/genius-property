/* Genius Property V23 — single runtime mount/render layer.
 * Root-cause fix: the HTML runtime had navigation entries for several pages,
 * but their #page-* mounts were missing. Some finance renderers were also not
 * loaded. This layer creates the mounts defensively and renders one page only.
 * It does not delete or rewrite business data.
 */
(function(){
  'use strict';
  var VERSION='V23';
  var PAGES=['dashboard','biens','proprietaires','locatives','locataires','contrats','paiements','depenses','messages','journal','employes','parametres','sync','admin-stockage','fichiers','droits','rapports'];

  function ensureMounts(){
    var host=document.querySelector('main')||document.body;
    PAGES.forEach(function(p){
      if(!document.getElementById('page-'+p)){
        var el=document.createElement('div');
        el.className='page';
        el.id='page-'+p;
        host.appendChild(el);
      }
    });
  }
  function activate(p){
    ensureMounts();
    document.querySelectorAll('.page').forEach(function(x){x.classList.remove('active');});
    var el=document.getElementById('page-'+p);
    if(el) el.classList.add('active');
    window.GP_CURRENT_PAGE=p;
    try{localStorage.setItem('gp_last_page',p);}catch(e){}
  }
  function safe(fn,p){
    try{return fn();}
    catch(err){
      console.error('[GP V23] render error:',p,err);
      var el=document.getElementById('page-'+p);
      if(el) el.innerHTML='<div style="margin:24px;padding:18px;border:1px solid #fecaca;border-radius:12px;background:#fff7f7;color:#991b1b"><strong>Erreur d’affichage</strong><div style="margin-top:6px;font-size:12px">'+escapeHtml(err&&err.message||err)+'</div></div>';
    }
  }
  function escapeHtml(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function render(p){
    ensureMounts();
    var el=document.getElementById('page-'+p); if(!el) return;
    var f=null;
    if(p==='dashboard') f=window.renderDashboard;
    else if(p==='biens') f=window.renderBiensFinal;
    else if(p==='proprietaires') f=window.renderProprietairesModern||window.renderProprietairesCards;
    else if(p==='locatives') f=window.renderLocativesFinal||window.renderLocativesModern;
    else if(p==='locataires') f=window.renderLocatairesModern||window.renderLocataires;
    else if(p==='contrats') f=window.renderContratsFinal||window.renderContratsModern||window.renderContrats;
    else if(p==='paiements') f=window.renderPaiementsFinal||window.renderPaiements;
    else if(p==='depenses') f=window.renderDepensesFinal||window.renderDepenses;
    else if(p==='messages') f=window.renderMessages||window.renderMessagesV20;
    else if(p==='journal') f=window.renderJournalEmployeGrid||window.renderAuditLog;
    else if(p==='employes') f=window.renderEmployesModern;
    else if(p==='parametres') f=window.renderParametres;
    else if(p==='sync') f=window.GPSyncPage&&window.GPSyncPage.render;
    else if(p==='admin-stockage') f=window.GPAdminStockage&&window.GPAdminStockage.render;
    else if(p==='rapports') f=window.renderRapports;
    if(typeof f==='function') return safe(function(){return f();},p);
    if(!el.innerHTML.trim()) el.innerHTML='<div style="padding:28px;color:#64748b">Cette page n’est pas encore disponible.</div>';
  }
  /* Pages sans écran dédié : on redirige au lieu d'afficher une page blanche.
   * 'contrats' → Locations (les contrats se consultent/génèrent depuis la location, cf. current-workflows.js). */
  var REDIRECTS={contrats:'locatives',droits:'employes',fichiers:'dashboard'};
  function resolveRedirect(p){
    if(Object.prototype.hasOwnProperty.call(REDIRECTS,p)) return REDIRECTS[p];
    return p;
  }
  /* Même règle que GPNavigation.canOpen : navigateV23 traitait les pages connues sans vérifier les droits. */
  function allowed(p){
    if(p==='dashboard') return true;
    try{
      if(window.GPSingleAgency && typeof GPSingleAgency.isCommercialPage==='function' && GPSingleAgency.isCommercialPage(p)) return false;
      if(window.GPAuth && typeof GPAuth.can==='function') return !!GPAuth.can(p);
      if(typeof window.canAccess==='function') return !!window.canAccess(p);
    }catch(e){ console.warn('[GP V23] droits:',e); }
    return true;
  }
  function route(p){
    if(p==='locations')p='locatives';
    if(p==='locataires')p='locataires';
    if(p==='contrats')p='contrats';
    if(p==='nv-bien'){activate('biens');setTimeout(function(){if(window.GPV10&&window.GPV10.renderBien)window.GPV10.renderBien(null);},0);return 'nv-bien';}
    if(p==='nv-proprietaire'){activate('proprietaires');setTimeout(function(){if(window.GPV10&&window.GPV10.renderOwner)window.GPV10.renderOwner(null);},0);return 'nv-proprietaire';}
    if(p==='nv-locative'){activate('locatives');setTimeout(function(){if(window.gpUL&&gpUL.openNew)gpUL.openNew();else if(window.openGpDrawer)window.openGpDrawer('locative');},0);return 'nv-locative';}
    if(p==='nv-employe'){activate('employes');setTimeout(function(){if(window.openNouvelEmployeDrawer)window.openNouvelEmployeDrawer();},0);return 'nv-employe';}
    if(PAGES.indexOf(p)!==-1){activate(p);setTimeout(function(){render(p);},0);return p;}
    return p;
  }

  var previousNavigate=window.navigate;
  function navigateV23(p){
    if(p==='locations') p='locatives';
    var asked=p;
    p=resolveRedirect(p);
    if(!allowed(p)){
      if(typeof window.toast==='function') window.toast("Accès refusé — vous n'avez pas les droits pour cette section",'err');
      p='dashboard';
    }else if(p!==asked && asked!=='contrats' && typeof window.toast==='function'){
      window.toast("Cette section n'est pas disponible comme page séparée.");
    }
    var known=PAGES.indexOf(p)!==-1 || ['locations','nv-bien','nv-proprietaire','nv-locative','nv-employe'].indexOf(p)!==-1;
    if(known) return route(p);
    return typeof previousNavigate==='function' ? previousNavigate.apply(window,[p].concat([].slice.call(arguments,1))) : p;
  }
  navigateV23.__gpV23=true;
  window.navigate=navigateV23;
  window.renderPage=function(p){if(p==='locations')p='locatives';activate(p);render(p);};

  var renderQueued=false;
  function rerenderCurrent(){
    if(renderQueued)return; renderQueued=true;
    setTimeout(function(){renderQueued=false;var p=window.GP_CURRENT_PAGE;if(p&&PAGES.indexOf(p)!==-1)render(p);},30);
  }
  window.addEventListener('gp:db:saved',rerenderCurrent);
  window.addEventListener('gp:data-changed',rerenderCurrent);

  function boot(){
    ensureMounts();
    var p=window.GP_CURRENT_PAGE;
    if(!p){var active=document.querySelector('.page.active');p=active&&active.id?active.id.replace(/^page-/,''):'';}
    if(!p){try{p=localStorage.getItem('gp_last_page')||'dashboard';}catch(e){p='dashboard';}}
    if(p==='locations')p='locatives';
    p=resolveRedirect(p);
    if(PAGES.indexOf(p)===-1||!allowed(p))p='dashboard';
    activate(p);
    setTimeout(function(){render(p);},0);
  }
  window.GPV23={version:VERSION,ensureMounts:ensureMounts,render:render,route:route};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
})();
