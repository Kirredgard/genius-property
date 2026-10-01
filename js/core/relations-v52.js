/* Genius Property V58 — canonical property relations.
 * Source of truth: Property -> Unit -> Location -> Contract -> Tenant.
 * V58 fixes the root cause found in V57: genId() generated the same fallback ID
 * for UNT / LOC / CT records. Existing duplicate IDs are repaired on migration.
 */
(function(){
  'use strict';
  var db=function(){return window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});};
  var save=async function(d){if(window.GPDB&&GPDB.save)return GPDB.save(d);window.DB=d;if(typeof window.saveDB==='function')return window.saveDB();return true;};
  var norm=function(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();};
  var clean=function(v){return String(v==null?'':v).trim();};
  var newId=function(p){var prefix=clean(p||'ID').toUpperCase();var r=Math.random().toString(36).slice(2,9);return prefix+'-'+Date.now().toString(36)+'-'+r;};
  var name=function(t){return clean([t&&t.prenom,t&&t.nom].filter(Boolean).join(' '))||clean(t&&t.nom)||clean(t&&t.name);};
  var active=function(v){var n=norm(v);return n==='actif'||n==='active'||n==='loue'||n==='occupe';};
  function ensureArray(d,k){if(!Array.isArray(d[k]))d[k]=[];return d[k];}
  function ensureId(x,p){if(!x.id)x.id=newId(p);return x.id;}
  function uniqueArrayIds(arr,p){var seen={};arr.forEach(function(x){var old=clean(x.id);if(!old||seen[old])x.id=newId(p);seen[x.id]=true;});}
  function ownerFor(d,b){var bid=clean(b.proprietaireId||b.proprioId||b.ownerId);if(bid){var by=d.proprietaires.find(function(x){return String(x.id)===bid;});if(by)return by;}var n=norm(b.proprio||b.proprietaire||b.owner||b.proprietaireNom);if(!n)return null;return d.proprietaires.find(function(x){return norm(name(x))===n||norm(x.nom)===n;})||null;}
  function tenantFor(d,row){var tid=clean(row.locataireId||row.tenantId||row.idLocataire);if(tid){var by=d.locataires.find(function(x){return String(x.id)===tid;});if(by)return by;}var n=norm(row.locataire||row.occupant||row.nomLocataire);if(!n)return null;return d.locataires.find(function(x){return norm(name(x))===n||norm(x.nom)===n;})||null;}
  function units(b){if(!b)return [];if(Array.isArray(b.unites)&&b.unites.length)return b.unites;if(Number(b.nbAppart||b.nbAppartements||0)>0){b.unites=Array.from({length:Number(b.nbAppart||b.nbAppartements)},function(_,i){return{id:newId('UNT'),nom:'Appartement '+(i+1),statut:'Disponible',loyer:'',locataire:''};});return b.unites;}return [{id:b.id,nom:b.nom||'Bien',statut:b.statut||'Disponible',loyer:b.loyer||'',locataire:b.locataire||''}];}
  function propertyById(d,v){v=clean(v);return v?d.biens.find(function(b){return String(b.id)===v;})||null:null;}
  function unitById(b,v){v=clean(v);return v?units(b).find(function(u){return String(u.id)===v;})||null:null;}
  function composite(b,u){return norm([b&&b.nom,u&&u.nom].filter(Boolean).join(' - '));}
  function textFields(row){return [row&&row.bien,row&&row.parentBien,row&&row.nomBien,row&&row.property,row&&row.location,row&&row.locative,row&&row.nom,row&&row.unite,row&&row.uniteNom,row&&row.unit,row&&row.appartement,row&&row.appartementNom].filter(function(v){return clean(v);}).map(norm);}
  function resolveProperty(d,row){var texts=textFields(row),bid=clean(row.bienId||row.propertyId||row.idBien),by=propertyById(d,bid);if(by){var bn=norm(by.nom);if(texts.some(function(raw){return raw===bn||raw.indexOf(bn+' - ')===0||raw.indexOf(' - '+bn+' - ')>=0||raw.endsWith(' - '+bn);}))return by;}for(var i=0;i<d.biens.length;i++){var b=d.biens[i],bn=norm(b.nom);if(texts.some(function(raw){return raw===bn||raw.indexOf(bn+' - ')===0||raw.indexOf(' - '+bn+' - ')>=0||raw.endsWith(' - '+bn);}))return b;}return null;}
  function resolveUnit(b,row){if(!b)return null;var us=units(b),texts=textFields(row),uid=clean(row.uniteId||row.unitId||row.appartementId);var exact=us.find(function(u){var full=composite(b,u);return texts.indexOf(full)>=0;});if(exact)return exact;var byLabel=us.find(function(u){var un=norm(u.nom);return texts.some(function(raw){return raw===un||raw.endsWith(' - '+un)||raw.endsWith(un);});});if(byLabel)return byLabel;var idHits=us.filter(function(u){return String(u.id||'')===uid;});return idHits.length===1?idHits[0]:null;}
  function resolveLocation(d,c){var lid=clean(c.locationId||c.locativeId||c.idLocation),raw=norm(c.locative||c.location||c.nom||''),t=norm(c.locataire||'');var candidates=d.locatives||[];var byName=candidates.filter(function(l){var ln=norm(l.nom||l.location||l.bien||'');return raw&&ln&&(ln===raw||raw.indexOf(ln)>=0||ln.indexOf(raw)>=0);});if(byName.length===1)return byName[0];var byComposite=candidates.filter(function(l){var b=resolveProperty(d,l),u=resolveUnit(b,l),lt=norm(l.locataire||l.occupant||'');return (!t||lt===t)&&((c.bienId&&b&&String(b.id)===String(c.bienId))||(!c.bienId))&&((c.uniteId&&u&&String(u.id)===String(c.uniteId))||(!c.uniteId));});if(byComposite.length===1)return byComposite[0];if(lid){var byId=candidates.filter(function(l){return String(l.id)===lid;});if(byId.length===1)return byId[0];}var exactTenant=candidates.filter(function(l){return t&&norm(l.locataire||l.occupant)===t;});return exactTenant.length===1?exactTenant[0]:null;}
  function normalizeLocation(d,l){ensureId(l,'LOC');var b=resolveProperty(d,l),t=tenantFor(d,l),u=resolveUnit(b,l);l.__v58Bien=b||null;l.__v58Tenant=t||null;l.__v58Unit=u||null;if(b){l.bienId=b.id;l.propertyId=b.id;l.proprietaireId=b.proprietaireId||b.proprioId||'';l.parentBien=b.nom;}if(t){l.locataireId=t.id;l.tenantId=t.id;}if(u){l.uniteId=u.id;l.unitId=u.id;l.uniteNom=u.nom;}l.locationId=l.id;return l;}
  function normalizeContract(d,c){ensureId(c,'CT');var l=resolveLocation(d,c);c.__v58Location=l||null;c.__v58Tenant=tenantFor(d,c);if(l){var rel=normalizeLocation(d,l);var b=rel.__v58Bien,t=rel.__v58Tenant,u=rel.__v58Unit;c.__v58Bien=b||null;c.__v58Unit=u||null;c.__v58Tenant=t||null;}else{c.__v58Bien=resolveProperty(d,c);c.__v58Unit=resolveUnit(c.__v58Bien,c);c.__v58Tenant=tenantFor(d,c);}return c;}
  function syncUnitProjection(d){
    d.biens.forEach(function(b){
      var us=units(b);
      us.forEach(function(u){
        var matchedLocation=null, matchedContract=null;
        var activeContracts=(d.contrats||[]).filter(function(c){return active(c.statut);});
        for(var i=0;i<activeContracts.length && !matchedContract;i++){
          var c=activeContracts[i], l=locationForContractRaw(d,c), cb=resolveProperty(d,c)||resolveProperty(d,l||{}), cu=resolveUnit(cb,c)||resolveUnit(cb,l||{});
          if(cb && String(cb.id)===String(b.id) && cu && String(cu.id)===String(u.id)){matchedContract=c;matchedLocation=l||null;}
        }
        var tenantId=(matchedContract&&(matchedContract.locataireId||matchedContract.tenantId))||(matchedLocation&&(matchedLocation.locataireId||matchedLocation.tenantId))||'';
        var tenant=tenantId ? d.locataires.find(function(t){return String(t.id)===String(tenantId);}) : null;
        var rent=(matchedContract&&matchedContract.loyer)||(matchedLocation&&matchedLocation.loyer)||'';
        if(matchedContract){
          u.statut='Loué';
          if(tenant){u.locataireId=tenant.id;u.locataire= name(tenant);}
          if(rent)u.loyer=rent;
        }else{
          u.statut='Disponible';
          delete u.locataireId; delete u.locataire;
        }
      });
      var occ=us.filter(function(u){return norm(u.statut)==='loue';}).length;
      b.statut=occ===0?'Disponible':occ===us.length?'Loué':'Partiellement loué';
    });
  }
  function locationForContractRaw(d,c){var lid=clean(c&& (c.locationId||c.locativeId||c.idLocation));if(lid){var by=(d.locatives||[]).find(function(l){return String(l.id)===lid;});if(by)return by;}return resolveLocation(d,c);}

  function repairRelations(d){
    d.proprietaires.forEach(function(x){ensureId(x,'PR');});
    d.locataires.forEach(function(x){ensureId(x,'LC');});
    d.biens.forEach(function(b){ensureId(b,'BI');var o=ownerFor(d,b);if(o){b.proprietaireId=o.id;b.proprioId=o.id;b.proprio=name(o)||b.proprio||'';}units(b).forEach(function(u){ensureId(u,'UNT');});});
    /* Resolve using human-readable unit/location labels BEFORE repairing duplicate IDs. */
    d.locatives.forEach(function(l){normalizeLocation(d,l);});
    d.contrats.forEach(function(c){normalizeContract(d,c);});
    /* The old global genId() produced repeated IDs for UNT/LOC/CT. Repair them now. */
    var unitSeen={};d.biens.forEach(function(b){units(b).forEach(function(u){var old=clean(u.id);if(!old||unitSeen[old])u.id=newId('UNT');unitSeen[u.id]=true;});});
    uniqueArrayIds(d.locatives,'LOC');
    uniqueArrayIds(d.contrats,'CT');
    /* Re-apply stable references after IDs were repaired. */
    d.locatives.forEach(function(l){var u=l.__v58Unit,b=l.__v58Bien,t=l.__v58Tenant;l.locationId=l.id;if(b){l.bienId=b.id;l.propertyId=b.id;l.parentBien=b.nom;l.proprietaireId=b.proprietaireId||b.proprioId||'';}if(t){l.locataireId=t.id;l.tenantId=t.id;}if(u){l.uniteId=u.id;l.unitId=u.id;l.uniteNom=u.nom;}});
    d.contrats.forEach(function(c){var l=c.__v58Location,b=c.__v58Bien,u=c.__v58Unit,t=c.__v58Tenant;if(l){c.locationId=l.id;c.locativeId=l.id;c.locative=l.nom||c.locative||'';}if(!b&&l)b=l.__v58Bien;if(b){c.bienId=b.id;c.propertyId=b.id;c.proprietaireId=b.proprietaireId||b.proprioId||'';}if(!u&&l)u=l.__v58Unit;if(u){c.uniteId=u.id;c.unitId=u.id;c.uniteNom=u.nom;}if(!t&&l)t=l.__v58Tenant;if(t){c.locataireId=t.id;c.tenantId=t.id;}c.contractId=c.id;});
    syncUnitProjection(d);
    d.paiements.forEach(function(p){var cid=clean(p.contratId||p.contractId),c=cid?(d.contrats.find(function(x){return String(x.id)===cid;})||null):null;if(!c){var n=clean(p.contrat||p.contract||'');var hits=d.contrats.filter(function(x){return n&&(String(x.num||'')===n||String(x.id||'')===n);});if(hits.length===1)c=hits[0];}if(c){p.contratId=c.id;p.contractId=c.id;p.locationId=c.locationId||'';p.bienId=c.bienId||'';p.uniteId=c.uniteId||'';p.proprietaireId=c.proprietaireId||'';p.locataireId=c.locataireId||'';p.tenantId=c.locataireId||'';}});
    d.locatives.forEach(function(l){delete l.__v58Bien;delete l.__v58Unit;delete l.__v58Tenant;});d.contrats.forEach(function(c){delete c.__v58Location;delete c.__v58Bien;delete c.__v58Unit;delete c.__v58Tenant;});
    d.meta=d.meta||{};d.meta.relationsV58='1';return d;
  }
  function propertiesForOwner(d,p){
    d=d||{}; p=p||{};
    var pid=clean(p.id||p.uid||'');
    var ownerName=norm(name(p));
    return (d.biens||[]).filter(function(b){
      var bid=clean(b.proprietaireId||b.proprioId||b.ownerId||b.ownerID||'');
      if(pid && bid && bid===pid) return true;
      if(bid && pid && bid!==pid) return false;
      var bn=norm(b.proprio||b.proprietaire||b.owner||b.proprietaireNom||'');
      return !!ownerName && !!bn && (bn===ownerName || bn.indexOf(ownerName)>=0 || ownerName.indexOf(bn)>=0);
    });
  }

  function ensure(d){ensureArray(d,'proprietaires');ensureArray(d,'locataires');ensureArray(d,'biens');ensureArray(d,'locatives');ensureArray(d,'contrats');ensureArray(d,'paiements');repairRelations(d);return d;}
  function activeContractsForProperty(d,b){return (d.contrats||[]).filter(function(c){if(!active(c.statut))return false;if(String(c.bienId||c.propertyId||'')===String(b.id))return true;var l=(d.locatives||[]).find(function(x){return String(x.id)===String(c.locationId||c.locativeId||'');});return !!(l&&String(l.bienId||l.propertyId||'')===String(b.id));});}
  function locationForContract(d,c){return (d.locatives||[]).find(function(l){return String(l.id)===String(c.locationId||c.locativeId||'');})||null;}
  function activeContractForUnit(d,b,u,contracts){var uid=clean(u&&u.id);var byLocation=(contracts||[]).find(function(c){var l=locationForContract(d,c);if(!l)return false;var lb=resolveProperty(d,l),lu=resolveUnit(lb,l);return !!(lb&&String(lb.id)===String(b.id)&&lu&&uid&&String(lu.id)===uid);});if(byLocation)return byLocation;return (contracts||[]).find(function(c){var cb=propertyById(d,c.bienId||c.propertyId),cu=resolveUnit(cb,c);return !!(cb&&String(cb.id)===String(b.id)&&cu&&uid&&String(cu.id)===uid);})||null;}
  function snapshot(d,b){d=ensure(d||{});var us=units(b),cs=activeContractsForProperty(d,b);var rows=us.map(function(u){var c=activeContractForUnit(d,b,u,cs),l=c&&locationForContract(d,c);var occupied=!!c,tid=(c&&(c.locataireId||c.tenantId))||(l&&(l.locataireId||l.tenantId)),t=tid?d.locataires.find(function(x){return String(x.id)===String(tid);}):null;return{unit:u,location:l,contract:c,occupied:occupied,statut:occupied?'Loué':'Disponible',locataireId:tid||'',locataire:t?name(t):(c&&c.locataire)||(l&&l.locataire)||'',loyer:(c&&c.loyer)||(l&&l.loyer)||u.loyer||''};});var occupied=rows.filter(function(r){return r.occupied;});var status=occupied.length===0?'Disponible':occupied.length===rows.length?'Loué':'Partiellement loué';return{units:rows,activeContracts:cs,occupied:occupied,available:rows.filter(function(r){return !r.occupied;}),status:status};}

  function migrate(){var d=db(),before=JSON.stringify(d);ensure(d);var after=JSON.stringify(d);if(before!==after)return save(d);return d;}
  window.GPRelationsV52={ensure:ensure,migrate:migrate,save:save,activeContractsForBien:activeContractsForProperty,propertySnapshot:snapshot,isActiveStatus:active,propertiesForOwner:propertiesForOwner,_internals:{resolveProperty:resolveProperty,resolveUnit:resolveUnit,resolveLocation:resolveLocation,normalizeLocation:normalizeLocation,normalizeContract:normalizeContract}};
  window.getProprietaireBiens=function(p){ var d=db(); ensure(d); return propertiesForOwner(d,p); };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){migrate().catch(function(e){console.warn('[Relations V58]',e);});});else migrate().catch(function(e){console.warn('[Relations V58]',e);});
})();
