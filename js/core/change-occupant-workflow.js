/* Genius Property — Changement d'occupant
 * Parcours strict : clôturer le contrat -> libérer la locative/unité -> préparer le nouveau contrat.
 */
(function(){
  'use strict';
  function db(){
    try{ if(window.GPDB&&GPDB.load) return GPDB.load()||{}; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}')||{}; }catch(e){ return window.DB||{}; }
  }
  async function save(d){
    window.DB=d;
    if(window.GPDB&&GPDB.save) return await GPDB.save(d);
    localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));
    if(typeof window.saveDB==='function') return await window.saveDB();
    return true;
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function norm(v){return String(v==null?'':v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function money(v){return String(v==null?'':v);}
  function today(){return new Date().toISOString().slice(0,10);}
  function toast(m,t){ if(typeof window.toast==='function') window.toast(m,t); else if(t==='err') alert(m); }
  function isActive(c){return ['actif','active'].includes(norm(c&&c.statut||'Actif'));}
  function tenantName(t){return [t&&t.prenom,t&&t.nom].filter(Boolean).join(' ') || (t&&t.nom) || '';}
  function same(a,b){a=norm(a);b=norm(b);return !!a&&!!b&&(a===b||a.indexOf(b)>=0||b.indexOf(a)>=0);}
  function activeContractFor(loc,d){
    var contracts=(d.contrats||[]).filter(isActive);
    var lid=String(loc.id||''), tid=String(loc.locataireId||loc.tenantId||'');
    return contracts.find(function(c){
      if(lid && String(c.locationId||c.locativeId||'')===lid) return true;
      if(String(c.locativeId||'') && String(c.locativeId)===lid) return true;
      var ctenant=String(c.locataireId||c.tenantId||'');
      var sameLocation=same(c.locative||c.bien,loc.bien||loc.nom);
      if(tid && ctenant===tid && (!c.bienId || String(c.bienId)===String(loc.bienId||loc.propertyId||''))) return true;
      return sameLocation;
    })||null;
  }
  function findLocative(b, loc, contract, d){
    var locs=Array.isArray(d.locatives)?d.locatives:[];
    var id=String(loc&&loc.id||''), unit=String(loc&&loc.uniteId||loc&&loc.unitId||'');
    var cid=String(contract&& (contract.locationId||contract.locativeId)||'');
    return locs.find(function(x){
      if(id && String(x.id||'')===id) return true;
      if(cid && String(x.id||'')===cid) return true;
      if(unit && String(x.uniteId||x.unitId||'')===unit && same(x.bien||x.parentBien,b.nom)) return true;
      return same(x.bien||x.parentBien||x.nom,b.nom) && same(x.locataire||x.occupant,loc.locataire||loc.occupant);
    })||null;
  }
  function unitFor(b,loc,contract){
    var units=Array.isArray(b.unites)?b.unites:[];
    var uid=String(loc&&loc.uniteId||loc&&loc.unitId||contract&&contract.uniteId||contract&&contract.unitId||'');
    return units.find(function(u){return uid && String(u.id||'')===uid;}) || units.find(function(u){return same(u.nom,loc&&loc.unite);}) || (units.length===1?units[0]:null);
  }
  function unpaid(d,contract){
    var keys=[contract&&contract.id,contract&&contract.num,contract&&contract.numero].filter(Boolean).map(String);
    return (d.paiements||[]).filter(function(p){
      var amount=Number(String(p.montant||0).replace(/[^0-9.-]/g,''))||0;
      var paid=Number(String(p.paye||p.montantPaye||0).replace(/[^0-9.-]/g,''))||0;
      var linked=keys.some(function(k){return String(p.contratId||p.contractId||p.contrat||p.reference||'')===k;}) || same(p.locataire,contract&&contract.locataire) || same(p.locative,contract&&contract.locative);
      return linked && amount>paid;
    });
  }
  function depositValue(contract){return contract&&(contract.caution||contract.deposit||contract.depotGarantie||contract.montantCaution)||'';}
  function inject(){
    if(document.getElementById('gp-change-occupant-css')) return;
    var s=document.createElement('style');s.id='gp-change-occupant-css';s.textContent=''+
      '#gpChangeOccOverlay{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:3000;display:none;align-items:center;justify-content:center;padding:18px}'+
      '#gpChangeOccModal{width:520px;max-width:100%;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(15,23,42,.25);overflow:hidden}'+
      '.gp-co-head{padding:18px 20px;border-bottom:1px solid #eef2f7}.gp-co-head h3{margin:0;font-size:17px;color:#111827}.gp-co-head p{margin:5px 0 0;font-size:12px;color:#64748b}.gp-co-body{padding:18px 20px}.gp-co-warning{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:11px 12px;font-size:12px;color:#9a3412;margin-bottom:14px}.gp-co-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gp-co-field{display:flex;flex-direction:column;gap:6px}.gp-co-field.full{grid-column:1/-1}.gp-co-field label{font-size:12px;font-weight:700;color:#374151}.gp-co-field input,.gp-co-field select{height:38px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;font-size:13px;box-sizing:border-box}.gp-co-foot{padding:14px 20px;border-top:1px solid #eef2f7;display:flex;justify-content:flex-end;gap:8px}.gp-co-btn{height:38px;border-radius:8px;padding:0 15px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-weight:700}.gp-co-btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}.gp-co-btn.danger{background:#dc2626;border-color:#dc2626;color:#fff}';document.head.appendChild(s);
  }
  function openModal(payload){
    inject();
    var old=document.getElementById('gpChangeOccOverlay');if(old)old.remove();
    var d=payload.db, c=payload.contract, arrears=unpaid(d,c), caution=depositValue(c);
    var warning=arrears.length||caution?'<div class="gp-co-warning"><b>Avant de clôturer :</b> '+(arrears.length?('impayé(s) détecté(s) : '+arrears.length+'. '):'')+(caution?('Caution enregistrée : '+esc(caution)+'. Vérifiez sa restitution ou son report.'): 'Aucune caution renseignée dans le contrat.')+'</div>':'';
    var html='<div id="gpChangeOccOverlay"><div id="gpChangeOccModal"><div class="gp-co-head"><h3>Changer d’occupant</h3><p>'+esc(payload.tenant||'Occupant actuel')+' · '+esc(payload.locationName||payload.bien.nom||'Locative')+'</p></div><div class="gp-co-body">'+warning+'<div class="gp-co-grid"><div class="gp-co-field"><label>Date de sortie prévue <b>*</b></label><input id="gp-co-date" type="date" value="'+esc(c.fin||c.dateFin||today())+'"></div><div class="gp-co-field"><label>Statut de clôture</label><select id="gp-co-status"><option>Terminé</option><option>Résilié</option></select></div><div class="gp-co-field full"><label>Contrat sortant</label><input value="'+esc(c.num||c.numero||c.id||'Contrat')+'" readonly></div></div></div><div class="gp-co-foot"><button class="gp-co-btn" onclick="gpCloseChangeOccupant()">Annuler</button><button class="gp-co-btn danger" onclick="gpConfirmChangeOccupant()">Clôturer et préparer le nouveau contrat</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);document.getElementById('gpChangeOccOverlay').style.display='flex';
    window.__gpChangeOccPayload=payload;
  }
  window.gpCloseChangeOccupant=function(){var e=document.getElementById('gpChangeOccOverlay');if(e)e.remove();window.__gpChangeOccPayload=null;};
  window.gpConfirmChangeOccupant=async function(){
    var p=window.__gpChangeOccPayload;if(!p)return;
    var date=(document.getElementById('gp-co-date')||{}).value||'';var status=(document.getElementById('gp-co-status')||{}).value||'Terminé';
    if(!date){toast('La date de sortie est requise','err');return;}
    var d=db(), b=p.bien, loc=p.locative, c=p.contract;
    if(!c){toast('Contrat actif introuvable','err');return;}
    /* Revalidation juste avant écriture : évite de clôturer un contrat devenu obsolète. */
    if(!isActive(c)){toast('Ce contrat n’est plus actif. Rechargez la fiche.','err');return;}
    var unpaidRows=unpaid(d,c);if(unpaidRows.length&&!confirm('Des impayés sont associés à ce contrat. Continuer la clôture ?'))return;
    if(depositValue(c)&&!confirm('Une caution est enregistrée. Confirmez que son traitement est vérifié avant la clôture.'))return;
    var oldStatus=c.statut||'Actif';
    c.dateFin=date;c.fin=date;c.statut=status;c.dateSortie=date;c.updatedAt=new Date().toISOString();
    var targetLoc=findLocative(b,loc,c,d);
    if(targetLoc){targetLoc.locataire='';targetLoc.occupant='';targetLoc.locataireId='';targetLoc.tenantId='';targetLoc.statut='Disponible';targetLoc.dateSortie=date;}
    var unit=unitFor(b,targetLoc||loc,c);
    if(unit){unit.locataire='';unit.locataireId='';unit.tenantId='';unit.statut='Disponible';unit.dateSortie=date;}
    if(b){
      var units=Array.isArray(b.unites)?b.unites:[];
      if(units.length){var occupied=units.filter(function(u){return ['loué','loue','occupé','occupe'].includes(norm(u.statut));}).length;b.statut=occupied?'Partiellement loué':'Disponible';}
      else {b.locataire='';b.locataireId='';b.statut='Disponible';}
    }
    if(typeof window.auditLog==='function')window.auditLog('Modification','Contrats','Changement d’occupant : contrat '+(c.num||c.id||'')+' clôturé le '+date);
    try{await save(d);}catch(e){c.statut=oldStatus;toast('La clôture n’a pas pu être enregistrée. Rien n’a été préparé.','err');return;}
    gpCloseChangeOccupant();
    toast('Ancien contrat clôturé et locative libérée ✓');
    if(typeof window.renderBiensFinal==='function')window.renderBiensFinal();
    /* Ouvre le contrat suivant uniquement après sauvegarde réussie. */
    setTimeout(function(){
      if(typeof window.openGpDrawer!=='function'){toast('Formulaire Nouveau contrat indisponible.','err');return;}
      window.openGpDrawer('contrat');
      setTimeout(function(){
        var vals={
          'gp-c-num':'',
          'gp-c-type':c.type||'Bail habitation',
          'gp-c-locataire':'',
          'gp-c-locative':targetLoc&&(targetLoc.nom||targetLoc.bien)||loc.bien||b.nom||'',
          'gp-c-debut':date,
          'gp-c-fin':'',
          'gp-c-loyer':c.loyer||loc.loyer||'',
          'gp-c-statut':'Actif',
          'gp-c-prochain':''
        };
        Object.keys(vals).forEach(function(id){var el=document.getElementById(id);if(el)el.value=vals[id];});
        var title=document.querySelector('#gpDrawer .gp-drawer-title');if(title)title.textContent='Nouveau contrat — changement d’occupant';
        var sub=document.querySelector('#gpDrawer .gp-drawer-sub');if(sub)sub.textContent='Ancien contrat clôturé le '+date+' · saisissez le nouveau locataire';
        var tenant=document.getElementById('gp-c-locataire');if(tenant)tenant.focus();
      },60);
    },120);
  };

  function installContractLinkHook(){
    if(window.__gpChangeOccupantContractLinkHook) return;
    if(typeof window.saveGpDrawer!=='function') return;
    var original=window.saveGpDrawer;
    window.saveGpDrawer=async function(kind){
      if(kind!=='contrat') return original.apply(this,arguments);
      var locataire=(document.getElementById('gp-c-locataire')||{}).value||'';
      var locative=(document.getElementById('gp-c-locative')||{}).value||'';
      var result=await original.apply(this,arguments);
      try{
        var d=db();
        var contracts=Array.isArray(d.contrats)?d.contrats:[];
        var c=contracts[contracts.length-1];
        if(!c) return result;
        var target=(d.locatives||[]).find(function(l){return same(l.bien||l.nom||l.locative,locative);});
        if(target){
          target.locataire=locataire;target.occupant=locataire;target.statut='Loué';
          var b=(d.biens||[]).find(function(x){return same(x.nom, target.bien||target.parentBien||locative);});
          if(b){
            if(Array.isArray(b.unites)&&b.unites.length){var u=b.unites.find(function(x){return String(x.id||'')===String(target.uniteId||target.unitId||'');}) || (b.unites.length===1?b.unites[0]:null);if(u){u.locataire=locataire;u.statut='Loué';}var occ=b.unites.some(function(x){return ['loué','loue','occupé','occupe'].includes(norm(x.statut));});b.statut=occ?'Loué':'Disponible';}
            else {b.locataire=locataire;b.statut='Loué';}
          }
          c.locationId=target.id||c.locationId||'';c.locativeId=target.id||c.locativeId||'';c.bien=target.bien||c.bien||locative;
          await save(d);
          if(typeof window.renderLocativesFinal==='function') window.renderLocativesFinal();
          if(typeof window.renderBiensFinal==='function') window.renderBiensFinal();
        }
      }catch(e){console.warn('[GP] rattachement nouveau contrat',e);}
      return result;
    };
    window.__gpChangeOccupantContractLinkHook=true;
  }
  installContractLinkHook();
  window.addEventListener('load',installContractLinkHook);

  window.gpChangeOccupant=function(bienIndex,locIndex){
    var d=db(), b=(d.biens||[])[Number(bienIndex)]; if(!b)return toast('Bien introuvable','err');
    var locs=[];
    try{ if(window.GPRelationsV52&&typeof GPRelationsV52.propertySnapshot==='function'){var s=GPRelationsV52.propertySnapshot(d,b);locs=(s.units||[]).map(function(r){return r.location||null;}).filter(Boolean);} }catch(e){}
    if(!locs.length)locs=(d.locatives||[]).filter(function(l){return same(l.bien||l.parentBien,b.nom)||String(l.bienId||l.propertyId||'')===String(b.id||'');});
    var loc=locs[Number(locIndex)];if(!loc)return toast('Locative introuvable','err');
    var c=activeContractFor(loc,d);
    if(!c) return toast('Aucun contrat actif pour cet occupant. Clôturez le contrat dans Contrats d’abord.','err');
    var tenant=loc.locataire||loc.occupant||c.locataire||'';
    openModal({db:d,bien:b,locative:loc,contract:c,tenant:tenant,locationName:loc.bien||loc.nom||b.nom});
  };
})();
