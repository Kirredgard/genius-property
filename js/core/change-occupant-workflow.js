/* Genius Property — workflow « Changer d'occupant »
 * Clôture l'occupation courante, libère l'unité puis ouvre la nouvelle location
 * avec le contrat prérempli. L'historique de l'ancien contrat est conservé.
 */
(function(){
  'use strict';

  var $=function(id){return document.getElementById(id);};
  var clean=function(v){return String(v==null?'':v).trim();};
  var norm=function(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');};
  var db=function(){try{return window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});}catch(e){return window.DB||{};}};
  var save=async function(d){if(window.GPDB&&GPDB.save)return await GPDB.save(d);window.DB=d;if(typeof window.saveDB==='function')return await window.saveDB();return true;};
  var toast=function(m,t){if(typeof window.toast==='function')window.toast(m,t||'');};
  var today=function(){return new Date().toISOString().slice(0,10);};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var moneyNumber=function(v){var n=Number(String(v==null?'':v).replace(/[^0-9,.-]/g,'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0;};
  var money=function(v){var n=moneyNumber(v);return n>0?Math.round(n).toLocaleString('fr-FR')+' FCFA':'';};
  var active=function(c){return !c.statut || ['actif','en attente','loue','loué'].indexOf(norm(c.statut))>=0;};

  function locationFor(d, id){
    id=clean(id); if(!id)return null;
    return (d.locatives||[]).find(function(l){return String(l.id||'')===id;})||null;
  }
  function contractFor(d,l){
    if(!l)return null;
    var lid=String(l.id||'');
    var c=(d.contrats||[]).find(function(x){return lid && String(x.locationId||x.locativeId||'')===lid && active(x);});
    if(c)return c;
    var unit=String(l.uniteId||l.unitId||'');
    var tenant=String(l.locataireId||l.tenantId||'');
    return (d.contrats||[]).find(function(x){
      if(!active(x))return false;
      var sameUnit=unit && String(x.uniteId||x.unitId||'')===unit;
      var sameTenant=tenant && String(x.locataireId||x.tenantId||'')===tenant;
      var sameLocation=norm(x.locative||x.bien)===norm(l.nom||l.bien);
      return sameUnit&&sameTenant || sameLocation&&(!tenant||sameTenant);
    })||null;
  }
  function propertyFor(d,l){
    var bid=String(l&& (l.bienId||l.propertyId)||'');
    if(bid){var byId=(d.biens||[]).find(function(b){return String(b.id||'')===bid;});if(byId)return byId;}
    return (d.biens||[]).find(function(b){return norm(b.nom)===norm(l&& (l.parentBien||l.bien));})||null;
  }
  function unitFor(b,l){
    var uid=String(l&& (l.uniteId||l.unitId)||'');
    var us=Array.isArray(b&&b.unites)?b.unites:[];
    return us.find(function(u){return uid && String(u.id||'')===uid;})||null;
  }

  function modal(l,c){
    var oldExit=clean(c&&(c.fin||c.dateFin))||today();
    var root=document.getElementById('gpChangeOccupantOverlay');
    if(root)root.remove();
    var html='<div id="gpChangeOccupantOverlay" class="gp-change-occupant-overlay">'+
      '<section class="gp-change-occupant-card" role="dialog" aria-modal="true" aria-labelledby="gpChangeOccupantTitle">'+
      '<header><div><h3 id="gpChangeOccupantTitle">Changer d’occupant</h3><p>'+esc(l.bien||l.nom||'Cette location')+'</p></div><button type="button" class="gp-change-close" onclick="gpCloseChangeOccupant()"><span class="material-symbols-rounded">close</span></button></header>'+
      '<div class="gp-change-body"><div class="gp-change-info"><span class="material-symbols-rounded">swap_horiz</span><div><b>Ancien occupant</b><span>'+esc(l.locataire||l.occupant||'—')+'</span></div></div>'+ 
      '<label class="gp-change-field"><span>Date de sortie prévue *</span><input id="gpChangeOccupantDate" type="date" value="'+esc(oldExit)+'"></label>'+ 
      '<p class="gp-change-help">L’ancien contrat sera clôturé à cette date, l’unité sera libérée et un nouveau contrat sera ouvert avec cette date comme début.</p></div>'+
      '<footer><button type="button" class="gp-change-cancel" onclick="gpCloseChangeOccupant()">Annuler</button><button type="button" class="gp-change-confirm" id="gpChangeOccupantConfirm"><span class="material-symbols-rounded">sync_alt</span>Changer d’occupant</button></footer>'+
      '</section></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    root=document.getElementById('gpChangeOccupantOverlay');
    var input=$('gpChangeOccupantDate'),btn=$('gpChangeOccupantConfirm');
    if(input)input.min=today();
    if(btn)btn.onclick=function(){perform(l.id,input&&input.value,c);};
    setTimeout(function(){if(input)input.focus();},30);
  }

  function closeModal(){var root=document.getElementById('gpChangeOccupantOverlay');if(root)root.remove();}
  window.gpCloseChangeOccupant=closeModal;

  async function perform(locationId,exitDate,knownContract){
    exitDate=clean(exitDate);
    if(!exitDate)return toast('La date de sortie prévue est requise.','err');
    if(Number.isNaN(new Date(exitDate).getTime()))return toast('La date de sortie prévue est invalide.','err');
    var d=db(),l=locationFor(d,locationId);
    if(!l)return toast('La locative est introuvable.','err');
    var c=knownContract||contractFor(d,l),b=propertyFor(d,l),u=unitFor(b,l);
    if(!c)return toast('Aucun contrat actif n’est rattaché à cette locative.','err');
    if(!b)return toast('Le bien rattaché à la locative est introuvable.','err');
    if(c.debut && new Date(exitDate)<new Date(c.debut))return toast('La sortie prévue ne peut pas être antérieure au début du contrat.','err');

    var btn=$('gpChangeOccupantConfirm');if(btn){btn.disabled=true;btn.innerHTML='<span class="material-symbols-rounded">hourglass_top</span>Traitement…';}
    try{
      var now=new Date().toISOString();
      var oldContractId=String(c.id||'');
      c.statut='Terminé';
      c.fin=exitDate;
      c.dateFin=exitDate;
      c.dateSortiePrevue=exitDate;
      c.closedAt=now;
      c.closedReason='Changement d’occupant';
      c.updatedAt=now;

      l.statut='Terminé';
      l.dateSortie=exitDate;
      l.dateSortiePrevue=exitDate;
      l.occupantSortie=l.locataire||l.occupant||'';
      l.contractHistoryId=oldContractId;
      l.updatedAt=now;

      if(u){
        u.statut='Disponible';
        u.locataire='';
        u.locataireId='';
        u.loyer=u.loyer||l.loyer||'';
      } else {
        b.statut='Disponible';
        b.locataire='';
      }
      if(typeof window.GPResyncBienStatuses==='function')window.GPResyncBienStatuses(d);
      if(window.GPRelationsV52&&GPRelationsV52.ensure)GPRelationsV52.ensure(d);
      var ok=await save(d);
      if(ok===false)throw new Error('La sauvegarde a été refusée car les données ont changé ailleurs.');
      if(typeof window.auditLog==='function')window.auditLog('Modification','Locations','Changement d’occupant : '+(l.locataire||l.occupant||'—')+' → '+(l.bien||l.nom||'—')+' · sortie '+exitDate);
      closeModal();
      toast('Ancien contrat clôturé et unité libérée ✓');

      if(typeof window.navigate==='function')window.navigate('locatives');
      setTimeout(function(){
        if(!window.gpUL||typeof window.gpUL.openNew!=='function'){
          toast('L’unité est libérée. Ouvrez « Nouvelle location » pour créer le nouveau contrat.','warn');
          return;
        }
        window.gpUL.openNew();
        setTimeout(function(){prefillNewContract(d,b,u,l,c,exitDate);},50);
      },80);
    }catch(e){
      console.error('[GP Change occupant]',e);
      toast('Impossible de changer l’occupant : '+(e.message||e),'err');
      if(btn){btn.disabled=false;btn.innerHTML='<span class="material-symbols-rounded">sync_alt</span>Changer d’occupant';}
    }
  }

  function prefillNewContract(d,b,u,oldLoc,oldContract,exitDate){
    var bienSel=$('ul-bien'),dateEntree=$('ul-date-entree'),status=$('ul-statut');
    var tenant=$('ul-tenant'),newTenant=$('ul-new-tenant'),contract=$('ul-contract');
    var num=$('ul-c-num'),type=$('ul-c-type'),sign=$('ul-c-sign'),debut=$('ul-c-debut'),fin=$('ul-c-fin'),next=$('ul-c-prochain'),loyer=$('ul-c-loyer'),charges=$('ul-c-charges'),caution=$('ul-c-caution'),honor=$('ul-c-honor'),obs=$('ul-c-obs');
    if(bienSel){var uid=String(u&&u.id||oldLoc.uniteId||oldLoc.unitId||b.id||'');bienSel.value=uid;if(!bienSel.value && b.id)bienSel.value=String(b.id);bienSel.dispatchEvent(new Event('change',{bubbles:true}));}
    if(dateEntree)dateEntree.value=exitDate;
    if(status)status.value='Loué';
    if(newTenant){newTenant.checked=true;newTenant.dispatchEvent(new Event('change',{bubbles:true}));}
    if(tenant)tenant.value='';
    if(contract){contract.checked=true;contract.dispatchEvent(new Event('change',{bubbles:true}));}
    if(num)num.value='CT-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-6);
    if(type&&oldContract&&oldContract.type)type.value=oldContract.type==='Bail habitation'?'Habitation':oldContract.type;
    if(sign)sign.value=exitDate;
    if(debut)debut.value=exitDate;
    if(fin)fin.value='';
    if(next)next.value=exitDate;
    if(loyer)loyer.value=String(oldContract&&oldContract.loyer||oldLoc.loyer||'').replace(/[^0-9,.-]/g,'');
    if(charges)charges.value=String(oldContract&&oldContract.charges||oldLoc.charge||'').replace(/[^0-9,.-]/g,'');
    if(caution)caution.value=String(oldContract&&oldContract.caution||'').replace(/[^0-9,.-]/g,'');
    if(honor)honor.value=String(oldContract&&oldContract.honor||'').replace(/[^0-9,.-]/g,'');
    if(obs)obs.value='Changement d’occupant — sortie prévue le '+exitDate+'.';
    var title=document.querySelector('#gpUlOverlay .gp-ul-dhead h3');if(title)title.textContent='Nouveau contrat — changement d’occupant';
    var sub=document.querySelector('#gpUlOverlay .gp-ul-dhead div div');if(sub)sub.textContent='Bien prérempli · date de début '+exitDate+' · choisissez le nouvel occupant';
    var first=$('ul-t-prenom');if(first)setTimeout(function(){first.focus();},30);
  }

  window.gpChangeOccupant=function(locationId){
    var d=db(),l=locationFor(d,locationId),c=contractFor(d,l);
    if(!l)return toast('Locative introuvable.','err');
    if(!c)return toast('Aucun contrat actif à clôturer pour cette locative.','err');
    modal(l,c);
  };
  window.GPChangeOccupant={perform:perform};

  var style=document.createElement('style');
  style.id='gp-change-occupant-style';
  style.textContent='.gp-change-occupant-overlay{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}.gp-change-occupant-card{width:min(460px,96vw);background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.22);overflow:hidden}.gp-change-occupant-card header{display:flex;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid #eef2f7}.gp-change-occupant-card header h3{margin:0;font-size:17px;color:#111827}.gp-change-occupant-card header p{margin:4px 0 0;font-size:11px;color:#64748b}.gp-change-close{width:32px;height:32px;border:0;border-radius:8px;background:#f3f4f6;display:grid;place-items:center;cursor:pointer}.gp-change-close .material-symbols-rounded{font-size:18px}.gp-change-body{padding:20px}.gp-change-info{display:flex;gap:10px;align-items:center;background:#fffaf0;border:1px solid #f0e4b5;border-radius:10px;padding:11px;margin-bottom:14px}.gp-change-info>.material-symbols-rounded{color:#b08a00}.gp-change-info div{display:grid;gap:2px}.gp-change-info b{font-size:11px;color:#374151}.gp-change-info span{font-size:13px;font-weight:800;color:#111827}.gp-change-field{display:grid;gap:6px}.gp-change-field>span{font-size:11px;font-weight:800;color:#374151}.gp-change-field input{height:40px;border:1px solid #dbe2ea;border-radius:9px;padding:0 11px;font-size:13px}.gp-change-help{font-size:10.5px;line-height:1.5;color:#64748b;margin:10px 0 0}.gp-change-occupant-card footer{display:flex;justify-content:flex-end;gap:8px;padding:13px 20px;border-top:1px solid #eef2f7}.gp-change-cancel,.gp-change-confirm{height:38px;border-radius:9px;padding:0 14px;font-weight:800;display:inline-flex;align-items:center;gap:6px;cursor:pointer}.gp-change-cancel{border:1px solid #e5e7eb;background:#fff;color:#374151}.gp-change-confirm{border:0;background:#d4af37;color:#111827}.gp-change-confirm:disabled{opacity:.6;cursor:wait}';
  document.head.appendChild(style);
})();
