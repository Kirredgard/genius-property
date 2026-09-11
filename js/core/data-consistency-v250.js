/* Genius Property V25 — global data consistency layer
   One final guard for every CRUD page. It does not replace page UI; it prevents
   stale asynchronous snapshots from overwriting newer data. */
(function(){
  'use strict';

  function db(){ try{return window.GPDB && GPDB.load ? GPDB.load() : (window.DB||{});}catch(e){return window.DB||{};} }
  function rev(d){ return Number(d && d.meta && d.meta.localRevision || localStorage.getItem('gpdb_local_revision') || 0) || 0; }

  // Public diagnostic: shows all collections and their current revision.
  window.GPDataConsistency = {
    revision:function(){ return rev(db()); },
    storage:function(){ return {localRevision:rev(db()), authoritative:window.GPDB&&GPDB.authoritativeSnapshot?rev(GPDB.authoritativeSnapshot()):null, storage:window.GPDB&&GPDB.health?GPDB.health():null}; },
    snapshot:function(){
      var d=db();
      var keys=['proprietaires','employes','biens','locataires','locatives','contrats','paiements','depenses','agenda','messages'];
      var out={revision:rev(d), updatedAt:d.meta&&d.meta.updatedAt||null};
      keys.forEach(function(k){out[k]=Array.isArray(d[k])?d[k].length:0;});
      return out;
    },
    audit:function(){
      var d=db(), r=rev(d);
      var issues=[];
      ['proprietaires','biens','locataires','locatives','contrats','paiements','depenses','agenda','messages'].forEach(function(k){
        if(d[k]!=null && !Array.isArray(d[k])) issues.push(k+' n’est pas un tableau');
        if(Array.isArray(d[k])){
          var ids={};
          d[k].forEach(function(x,i){
            if(!x || !x.id) issues.push(k+'['+i+'] sans id');
            else if(ids[String(x.id)]) issues.push(k+' id dupliqué: '+x.id);
            else ids[String(x.id)]=true;
          });
        }
      });
      return {ok:issues.length===0,revision:r,issues:issues,snapshot:this.snapshot()};
    }
  };

  // Whenever a save succeeds, refresh all currently visible legacy renderers.
  window.addEventListener('gp:db:saved',function(e){
    try{
      var page=document.querySelector('.page.active');
      if(!page) return;
      var id=page.id||'';
      var key=id.replace(/^page-/,'');
      setTimeout(function(){
        try{
          if(key==='proprietaires' && typeof window.renderProprietairesCards==='function') window.renderProprietairesCards();
          else if(key==='biens' && typeof window.renderBiensCards==='function') window.renderBiensCards(true);
          else if(key==='locataires' && typeof window.renderLocatairesModern==='function') window.renderLocatairesModern(true);
          else if(key==='locatives' && typeof window.renderLocativesModern==='function') window.renderLocativesModern();
          else if(key==='contrats' && typeof window.renderContratsModern==='function') window.renderContratsModern();
          else if(key==='paiements' && typeof window.renderPaiements==='function') window.renderPaiements();
          else if(key==='depenses' && typeof window.renderDepenses==='function') window.renderDepenses();
        }catch(ignore){}
      },0);
    }catch(ignore){}
  });

  // Do not allow an old cached cloud snapshot to overwrite a newer local revision.
  window.addEventListener('gp:supabase:pulled',function(e){
    try{
      var incoming=e && e.detail && e.detail.data;
      var incomingRev=rev(incoming);
      var localRev=rev(db());
      if(incomingRev && localRev && incomingRev < localRev){
        console.warn('[GPDataConsistency] stale cloud snapshot ignored',incomingRev,localRev);
      }
    }catch(ignore){}
  });
})();
