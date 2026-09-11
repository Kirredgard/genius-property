/* Genius Property V22.7 — CRUD bridge
   Fixes cross-form edits and delete actions after the V21 legacy bundle has loaded. */
(function(){
  'use strict';
  function db(){ try { return window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}); } catch(e){ return window.DB || {}; } }
  async function save(d){
    if(window.GPDB && GPDB.save) return await GPDB.save(d,{skipLicenseGuard:true});
    window.DB=d;
    if(typeof window.saveDB==='function') return await window.saveDB();
  }
  function render(key){
    var map={
      proprietaires:['renderProprietairesModern','renderProprietairesCards'],
      locataires:['renderLocatairesModern'],
      employes:['renderEmployesModern'],
      biens:['renderBiensFinal','renderBiensFinal2','renderBiensCards'],
      locatives:['renderLocativesFinal','renderLocativesModern'],
      contrats:['renderContratsFinal','renderContratsModern','renderContrats'],
      paiements:['renderPaiementsFinal','renderPaiements'],
      depenses:['renderDepensesFinal','renderDepenses']
    };
    var f=map[key]||[];
    for(var i=0;i<f.length;i++) if(typeof window[f[i]]==='function'){ try{window[f[i]]();}catch(e){}; break; }
    try{ if(typeof window.updateSidebarBadges==='function') window.updateSidebarBadges(); }catch(e){}
  }
  async function delRow(key,idx){
    var d=db();
    if(!Array.isArray(d[key]) || idx<0 || idx>=d[key].length) return false;
    var item=d[key][idx];
    var label=(item && (item.nom || item.libelle || item.titre || item.email || item.prenom)) || 'cet élément';
    if(!window.confirm('Supprimer '+label+' ?')) return false;
    var targetId=item && item.id!=null ? String(item.id) : null;
    if(targetId){
      d[key]=d[key].filter(function(row){ return String(row && row.id) !== targetId; });
    }else{
      d[key].splice(idx,1);
    }
    await save(d);
    if(window.GPSupabase && GPSupabase.available && GPSupabase.available() && GPSupabase.currentUid && GPSupabase.currentUid()){
    }
    render(key);
    try{ if(typeof window.toast==='function') window.toast('Suppression effectuée ✓','ok'); }catch(e){}
    return true;
  }
  window.delRow=delRow;
  window.GPCRUD={delete:delRow,render:render};
})();
