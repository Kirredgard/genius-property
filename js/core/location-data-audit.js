/* Genius Property V69 — audit canonique des relations Location.
 * Lecture seule : ne supprime aucune donnée et ne réécrit rien.
 * But : détecter les doublons/orphelins après retrait des anciens CRUD Location.
 */
(function(){
  'use strict';
  function db(){ return window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}); }
  function arr(d,k){ return Array.isArray(d[k]) ? d[k] : []; }
  function id(x){ return String(x && x.id || '').trim(); }
  function activeStatus(v){
    var s=String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    return s==='loue' || s==='actif' || s==='occupe' || s==='occupé';
  }
  function key(v){ return String(v||'').trim(); }
  function push(map,k,item){ if(!k)return; (map[k]||(map[k]=[])).push(item); }
  function dupMap(map){ return Object.keys(map).filter(function(k){return map[k].length>1;}); }

  function run(options){
    options=options||{};
    var d=db();
    if(window.GPRelationsV52 && typeof window.GPRelationsV52.ensure==='function') window.GPRelationsV52.ensure(d);
    var biens=arr(d,'biens'), locs=arr(d,'locatives'), contrats=arr(d,'contrats');
    var units=[], unitById={}, propertyById={};
    biens.forEach(function(b){
      propertyById[id(b)]=b;
      (Array.isArray(b.unites)?b.unites:[]).forEach(function(u){
        var row={bien:b,unit:u}; units.push(row);
        if(id(u)) push(unitById,id(u),row);
      });
    });
    var locById={}, contractById={}, activeLocByUnit={}, activeContractByUnit={};
    locs.forEach(function(l){ if(id(l)) push(locById,id(l),l); });
    contrats.forEach(function(c){ if(id(c)) push(contractById,id(c),c); });

    var orphanLocations=[], orphanContracts=[], orphanUnitLocations=[], orphanUnitContracts=[];
    locs.forEach(function(l){
      var bid=key(l.bienId||l.propertyId), uid=key(l.uniteId||l.unitId);
      if(bid && !propertyById[bid]) orphanLocations.push({id:id(l),bienId:bid});
      if(uid && !unitById[uid]) orphanUnitLocations.push({id:id(l),uniteId:uid});
      if(activeStatus(l.statut) && uid) push(activeLocByUnit,uid,l);
    });
    contrats.forEach(function(c){
      var lid=key(c.locationId||c.locativeId), bid=key(c.bienId||c.propertyId), uid=key(c.uniteId||c.unitId);
      if(lid && !locById[lid]) orphanContracts.push({id:id(c),locationId:lid});
      if(uid && !unitById[uid]) orphanUnitContracts.push({id:id(c),uniteId:uid});
      if(activeStatus(c.statut) && uid) push(activeContractByUnit,uid,c);
    });

    var duplicateLocationIds=dupMap(locById), duplicateContractIds=dupMap(contractById), duplicateUnitIds=dupMap(unitById);
    var duplicateActiveLocations=Object.keys(activeLocByUnit).filter(function(k){return activeLocByUnit[k].length>1;});
    var duplicateActiveContracts=Object.keys(activeContractByUnit).filter(function(k){return activeContractByUnit[k].length>1;});

    var report={
      generatedAt:new Date().toISOString(),
      counts:{biens:biens.length,units:units.length,locations:locs.length,activeLocations:locs.filter(function(x){return activeStatus(x.statut);}).length,contracts:contrats.length,activeContracts:contrats.filter(function(x){return activeStatus(x.statut);}).length},
      duplicates:{locationIds:duplicateLocationIds,contractIds:duplicateContractIds,unitIds:duplicateUnitIds,activeLocationsByUnit:duplicateActiveLocations,activeContractsByUnit:duplicateActiveContracts},
      orphans:{locationsWithoutBien:orphanLocations,locationsWithoutUnit:orphanUnitLocations,contractsWithoutLocation:orphanContracts,contractsWithoutUnit:orphanUnitContracts},
      healthy:!duplicateLocationIds.length&&!duplicateContractIds.length&&!duplicateUnitIds.length&&!duplicateActiveLocations.length&&!duplicateActiveContracts.length&&!orphanLocations.length&&!orphanUnitLocations.length&&!orphanContracts.length&&!orphanUnitContracts.length
    };
    window.GPLocationAudit.last=report;
    try{ window.dispatchEvent(new CustomEvent('gp:location-audit',{detail:report})); }catch(e){}
    if(!report.healthy && options.log!==false) console.warn('[GPLocationAudit] incohérences détectées',report);
    return report;
  }
  window.GPLocationAudit={run:run,last:null};
  function boot(){ setTimeout(function(){ try{run({log:true});}catch(e){console.warn('[GPLocationAudit] échec audit',e);} },120); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
