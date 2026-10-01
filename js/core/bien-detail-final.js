/* V34 - Final user-requested Bien detail + monthly expense indicators.
   Single final override, loaded last. No new parallel data model. */
(function(){
  'use strict';

  function db(){
    try { if(window.GPDB && typeof GPDB.load==='function') return GPDB.load() || {}; } catch(e){}
    try { return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}') || {}; } catch(e){}
    return window.DB || {};
  }
  function arr(k){ var d=db(); return Array.isArray(d[k])?d[k]:[]; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function clean(v){ return String(v==null?'':v).trim(); }
  function norm(v){ return clean(v).toLowerCase().normalize ? clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') : clean(v).toLowerCase(); }
  function money(v){ var n=Number(String(v==null?'':v).replace(/\s/g,'').replace(/,/g,'.')); return isFinite(n)&&n ? n.toLocaleString('fr-FR')+' FCFA' : (v ? esc(v) : '—'); }
  function fullName(p){ if(!p)return ''; return clean(p.prenom||p.firstName)+' '+clean(p.nom||p.lastName); }
  function ownerName(b){ return clean(b.proprio||b.proprietaire||b.owner||b.proprietaireNom); }
  function personName(x){ var d=db(); var t=tenantForId(d,x&& (x.locataireId||x.tenantId)); if(t)return fullName(t); return clean(x && (x.locataire||x.occupant||x.tenant||x.locataireNom||x.nomLocataire)); }
  function same(a,b){ a=norm(a); b=norm(b); return !!a && !!b && (a===b || a.indexOf(b)>=0 || b.indexOf(a)>=0); }
  function unitsOf(b){ return Array.isArray(b&&b.unites)?b.unites:[]; }
  function tenantForId(d,id){
    id=clean(id); if(!id)return null;
    return (d.locataires||[]).find(function(t){return String(t.id||'')===id;})||null;
  }
  function snapshotForBien(b){
    var d=db();
    try { if(window.GPRelationsV52 && typeof window.GPRelationsV52.propertySnapshot==='function') return window.GPRelationsV52.propertySnapshot(d,b); } catch(e){}
    var units=unitsOf(b), locs=[];
    return {units:units.map(function(u){return {unit:u,occupied:/lou|occup/i.test(String(u.statut||'')),statut:u.statut||'Disponible',locataire:u.locataire||'',loyer:u.loyer||''};}),activeContracts:[],occupied:[],available:units};
  }
  function locsForBien(b){
    var snap=snapshotForBien(b), out=[];
    /* Une ligne de locataire = une unité occupée.
       On ne parcourt jamais la collection globale locatives ici. */
    (snap.units||[]).forEach(function(r){
      if(!r || !r.occupied) return;
      var l=r.location||null, c=r.contract||null;
      if(l){
        out.push(Object.assign({}, l, {
          bienId:l.bienId||b.id,
          uniteId:l.uniteId||l.unitId||(r.unit&&r.unit.id)||'',
          locataireId:l.locataireId||l.tenantId||r.locataireId||'',
          statut:'Loué',
          _contract:c||null,
          _unit:r.unit||null
        }));
        return;
      }
      if(c){
        out.push({
          id:c.locationId||c.locativeId||'',
          bienId:b.id,
          uniteId:c.uniteId||c.unitId||(r.unit&&r.unit.id)||'',
          locataireId:c.locataireId||c.tenantId||r.locataireId||'',
          locataire:r.locataire||c.locataire||'',
          bien:c.bien||c.locative||b.nom,
          loyer:r.loyer||c.loyer||'',
          debut:c.debut||c.dateDebut||'',
          fin:c.fin||c.dateFin||'',
          statut:'Loué',
          contrat:c.num||c.numero||c.id,
          _contract:c,
          _unit:r.unit||null
        });
      }
    });
    return out;
  }
  function activeContractsForBien(b){
    var d=db();
    try { if(window.GPRelationsV52 && typeof window.GPRelationsV52.activeContractsForBien==='function') return window.GPRelationsV52.activeContractsForBien(d,b); } catch(e){}
    return [];
  }
  function currentLocsForBien(b){ return locsForBien(b); }
  function ownerFor(b){
    var raw=ownerName(b);
    return arr('proprietaires').find(function(p){
      return same(fullName(p),raw)||same(p.nom,raw)||same(p.prenom,raw);
    }) || null;
  }
  function contractsForLoc(l){
    var d=db(), lid=clean(l&&l.id), tenantId=clean(l&&l.locataireId||l&&l.tenantId);
    var out=(d.contrats||[]).filter(function(c){
      if(norm(c.statut||'')!=='actif')return false;
      if(lid && String(c.locationId||c.locativeId||'')===lid)return true;
      return tenantId && String(c.locataireId||c.tenantId||'')===tenantId && String(c.bienId||c.propertyId||'')===String(l.bienId||l.propertyId||'');
    });
    return out;
  }
  function status(b){ var snap=snapshotForBien(b); return snap.status || 'Disponible'; }
  function badge(st){
    var n=norm(st), cls=n.indexOf('lou')>=0?'is-rented':n.indexOf('att')>=0?'is-pending':'is-free';
    return '<span class="v34-status '+cls+'">'+esc(st)+'</span>';
  }
  function injectCSS(){
    if(document.getElementById('gp-v34-css'))return;
    var s=document.createElement('style'); s.id='gp-v34-css';
    s.textContent = `
      #page-bien-detail{padding:10px 14px 24px!important;background:#f7f1e6!important}
      .v34-bd{max-width:100%;font-family:inherit}
      .v34-head{display:flex;align-items:center;gap:9px;background:#fffdf5;border:1px solid #eee5d5;border-radius:10px;padding:7px 9px;margin-bottom:7px}
      .v34-title{flex:1;min-width:0}.v34-title h2{margin:0;font-size:14px;font-weight:850;color:#172033}.v34-title p{margin:1px 0 0;font-size:10px;color:#6b7280}
      .v34-btn{height:27px;border:1px solid #eadfc9;background:#fffdf5;border-radius:8px;padding:0 10px;display:inline-flex;align-items:center;gap:5px;font-weight:800;font-size:8.5px;color:#374151;cursor:pointer}
      .v34-btn .material-symbols-rounded{font-size:14px}.v34-btn.edit{background:#eee9ff;border-color:#ddd4ff;color:#5842c9}.v34-btn.danger{background:#fff0ed;border-color:#ffd4cc;color:#dc4935}
      .v34-hero{display:flex;gap:9px;background:#fffdf5;border:1px solid #eee5d5;border-radius:12px;padding:7px;margin-bottom:7px}
      .v34-photo{width:52px;height:52px;flex:0 0 52px;border-radius:9px;background:#f7f0df;border:1px solid #eee3c9;display:grid;place-items:center;overflow:hidden}
      .v34-photo img{width:100%;height:100%;object-fit:cover}.v34-photo .material-symbols-rounded{font-size:24px;color:#D4AF37}
      .v34-main{flex:1;min-width:0}.v34-main h1{margin:1px 0;font-size:14px;font-weight:900}.v34-main p{margin:0;font-size:10px;color:#6b7280;display:flex;align-items:center;gap:3px}
      .v34-main p .material-symbols-rounded{font-size:13px}.v34-status{display:inline-flex;padding:2px 6px;border-radius:999px;font-size:8px;font-weight:800}.v34-status.is-free{background:#eef8f0;color:#3d8b4b}.v34-status.is-rented{background:#fff4df;color:#a56a00}.v34-status.is-pending{background:#f1efff;color:#6757b5}
      .v34-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:5px}.v34-kpi{background:#faf8ef;border:1px solid #eee6d6;border-radius:7px;padding:4px 6px}.v34-kpi small{display:block;font-size:6.5px;text-transform:uppercase;color:#8a8f98;font-weight:800;margin-bottom:2px}.v34-kpi b{font-size:8.5px;color:#172033}
      .v34-tabs{display:flex;gap:3px;background:#fffdf5;border:1px solid #eee5d5;border-radius:9px;padding:3px;margin-bottom:7px}
      .v34-tab{height:24px;border:0;background:transparent;border-radius:6px;padding:0 8px;display:inline-flex;align-items:center;gap:4px;font-weight:800;font-size:9px;color:#697386;cursor:pointer}.v34-tab .material-symbols-rounded{font-size:12px;color:#c79f17}.v34-tab.active{background:#fff1bf;color:#8b6910}
      .v34-panel{background:#fffdf5;border:1px solid #eee5d5;border-radius:9px;padding:8px;margin-bottom:7px}.v34-panel h3{margin:0 0 6px;font-size:10px;font-weight:900;color:#1b2535}
      .v34-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.v34-field{background:#faf8ef;border-radius:7px;padding:5px 7px;min-width:0}.v34-field small{display:block;font-size:7px;text-transform:uppercase;color:#9297a0;font-weight:800;margin-bottom:2px}.v34-field b{display:block;font-size:8.5px;color:#172033;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .v34-field.value{background:#fff8cf;border:1px solid #f1df73}.v34-field.value b{color:#b08a00}
      .v34-unit{border:1px solid #eee5d5;border-radius:8px;padding:8px;margin-top:6px;background:#fffefa}.v34-unit-head{display:flex;align-items:center;gap:6px;margin-bottom:6px}.v34-unit-head .material-symbols-rounded{font-size:16px;color:#c79f17}.v34-unit-head b{font-size:10px}.v34-mini{font-size:7px;padding:2px 5px;border-radius:99px;background:#eef8f0;color:#3d8b4b;font-weight:800}
      .v34-person{border:1px solid #eee5d5;border-radius:8px;padding:8px;margin-top:6px;background:#fffefa}.v34-person-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.v34-person-head b{font-size:10px}.v34-person-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
      .v34-doc{display:flex;align-items:center;gap:7px;border:1px solid #eee5d5;border-radius:8px;padding:7px;margin-top:5px;background:#fffefa}.v34-doc .material-symbols-rounded{color:#c79f17;font-size:17px}.v34-doc-main{flex:1;min-width:0}.v34-doc-main b{font-size:9px;display:block}.v34-doc-main small{font-size:7px;color:#8b919c}
      .v34-empty{padding:18px;text-align:center;color:#8b919c;font-size:10px;border:1px dashed #e4dccb;border-radius:8px}
      .v34-owner{display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:start}.v34-avatar{width:48px;height:48px;border-radius:9px;background:#fff1bf;display:grid;place-items:center;color:#c79f17;font-size:15px;font-weight:900}
      .v34-owner-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
      @media(max-width:850px){.v34-kpis,.v34-grid,.v34-person-grid{grid-template-columns:repeat(2,1fr)}.v34-head{flex-wrap:wrap}.v34-tabs{overflow:auto}.v34-hero{flex-wrap:wrap}}
    `;
    document.head.appendChild(s);
  }
  function switchTab(tab,btn){
    document.querySelectorAll('#page-bien-detail .v34-panel').forEach(function(p){p.style.display='none';});
    var p=document.getElementById('v34-panel-'+tab); if(p)p.style.display='block';
    document.querySelectorAll('#page-bien-detail .v34-tab').forEach(function(b){b.classList.remove('active');});
    if(btn)btn.classList.add('active');
  }
  window.gpV34BienTab=switchTab;

  function renderBienDetailV34(idx,tab){
    injectCSS();
    idx=Number(idx); var d=db(), b=(d.biens||[])[idx];
    if(!b){ if(window.toast)window.toast('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page)return;
    var snap=snapshotForBien(b), units=(snap.units||[]).map(function(r){return r.unit||{};}), locs=currentLocsForBien(b), owner=ownerFor(b), st=snap.status;
    var ownerDisplay=owner?fullName(owner):ownerName(b)||'—';
    var occupied=(snap.occupied||[]).length;
    var unitRows=(snap.units||[]).map(function(r){ return {nom:r.unit&&r.unit.nom||'Unité', statut:r.statut, loyer:r.loyer, relation:r}; });
    var locHtml=locs.length?locs.map(function(l){
      var cs=contractsForLoc(l), c=cs[0], tenant=clean(c&&(c.locataire||c.tenant))||personName(l)||'—';
      var tel=l.telephone||l.tel||l.phone||'', rent=l.loyer||l.montant||l.montantLoyer||'';
      return '<div class="v34-person"><div class="v34-person-head"><b>'+esc(tenant)+'</b>'+badge(l.statut||'Loué')+'</div><div class="v34-person-grid">'+
        '<div class="v34-field"><small>Location</small><b>'+esc(l.nom||l.location||'—')+'</b></div>'+
        '<div class="v34-field"><small>Téléphone</small><b>'+esc(tel||'—')+'</b></div>'+
        '<div class="v34-field"><small>Loyer</small><b>'+money(rent)+'</b></div>'+
        '<div class="v34-field"><small>Entrée</small><b>'+esc(l.dateEntree||l.dateDebut||l.debut||'—')+'</b></div>'+
        '<div class="v34-field"><small>Contrat</small><b>'+esc(c?(c.num||c.numero||c.reference||'Contrat'):'—')+'</b></div>'+
        '<div class="v34-field"><small>Fin contrat</small><b>'+esc(c?(c.fin||c.dateFin||'—'):'—')+'</b></div>'+
        '<div class="v34-field"><small>Statut</small><b>'+esc(l.statut||'—')+'</b></div>'+
        '<div class="v34-field"><small>Bien / unité</small><b>'+esc(l.bien||b.nom||'—')+'</b></div>'+
      '</div></div>';
    }).join(''):'<div class="v34-empty">Aucun locataire ou location associé à ce bien.</div>';
    var ownerHtml=owner?'<div class="v34-owner"><div class="v34-avatar">'+esc((owner.prenom||owner.nom||'?').charAt(0)+(owner.nom||'').charAt(0))+'</div><div><h3 style="margin:0 0 5px;font-size:11px;font-weight:900;color:#172033">'+esc(fullName(owner)||'Propriétaire')+'</h3><div class="v34-owner-grid">'+
      '<div class="v34-field"><small>Téléphone</small><b>'+esc(owner.telephone||owner.tel||owner.phone||'—')+'</b></div>'+
      '<div class="v34-field"><small>Email</small><b>'+esc(owner.email||'—')+'</b></div>'+
      '<div class="v34-field"><small>Adresse</small><b>'+esc(owner.adresse||'—')+'</b></div>'+
      '<div class="v34-field"><small>Biens associés</small><b>'+((typeof window.getProprietaireBiens==='function')?window.getProprietaireBiens(owner).length:arr('biens').filter(function(x){return same(ownerName(x),fullName(owner))||same(ownerName(x),owner.nom);}).length)+'</b></div>'+
      '</div></div></div>':'<div class="v34-empty">Aucun propriétaire associé à ce bien.</div>';
    var docs=Array.isArray(b.documents)?b.documents:[];
    var docsHtml=docs.length?docs.map(function(doc,i){return '<div class="v34-doc"><span class="material-symbols-rounded">description</span><div class="v34-doc-main"><b>'+esc(doc.nom||doc.fileName||'Document')+'</b><small>'+esc(doc.fileName||doc.type||'')+'</small></div><button class="v34-btn" onclick="gpV34OpenDoc('+i+')"><span class="material-symbols-rounded">visibility</span>Voir</button></div>';}).join(''):'<div class="v34-empty">Aucun document associé à ce bien.</div>';
    var unitHtml=unitRows.length?unitRows.map(function(u){
      var rel=u.relation||{}, linked=rel.location||null, c=rel.contract||null;
      var tenant=rel.locataire||personName(linked)||'';
      return '<div class="v34-unit"><div class="v34-unit-head"><span class="material-symbols-rounded">apartment</span><b>'+esc(u.nom||'Unité')+'</b>'+badge(u.statut||'Disponible')+'</div><div class="v34-grid">'+
        '<div class="v34-field"><small>Statut</small><b>'+esc(u.statut||'Disponible')+'</b></div>'+ 
        '<div class="v34-field"><small>Locataire</small><b>'+esc(tenant||'Aucun locataire')+'</b></div>'+ 
        '<div class="v34-field"><small>Loyer</small><b>'+money(u.loyer||'')+'</b></div>'+ 
        '<div class="v34-field"><small>Contrat</small><b>'+esc(c?(c.num||c.numero||c.id):'—')+'</b></div>'+ 
      '</div></div>';
    }).join(''):'<div class="v34-empty">Aucune unité enregistrée.</div>';

    page.innerHTML='<div class="v34">'+
      '<div class="v34-head"><button class="v34-btn" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span>Retour</button>'+
      '<div class="v34-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type||'Immeuble',b.adresse||''].filter(Boolean).join(' · '))+'</p></div>'+
      '<button class="v34-btn edit" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span>Modifier</button>'+
      '<button class="v34-btn danger" onclick="gpDeleteBien('+idx+')"><span class="material-symbols-rounded">delete</span>Supprimer</button></div>'+
      '<div class="v34-hero"><div class="v34-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="v34-main"><div>'+badge(st)+'</div><h1>'+esc(b.nom||'—')+'</h1><p><span class="material-symbols-rounded">location_on</span>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="v34-kpis">'+
      '<div class="v34-kpi"><small>Type</small><b>'+esc(b.type||'Immeuble')+'</b></div><div class="v34-kpi"><small>Unités</small><b>'+unitRows.length+'</b></div><div class="v34-kpi"><small>Locations</small><b>'+locs.length+'</b></div><div class="v34-kpi"><small>Propriétaire</small><b>'+esc(ownerDisplay)+'</b></div>'+
      '</div></div></div>'+
      '<div class="v34-tabs">'+
      '<button class="v34-tab active" onclick="gpV34BienTab(\'infos\',this)"><span class="material-symbols-rounded">info</span>Informations</button>'+
      '<button class="v34-tab" onclick="gpV34BienTab(\'locataires\',this)"><span class="material-symbols-rounded">groups</span>Locataires</button>'+
      '<button class="v34-tab" onclick="gpV34BienTab(\'proprio\',this)"><span class="material-symbols-rounded">person</span>Propriétaire</button>'+
      '<button class="v34-tab" onclick="gpV34BienTab(\'docs\',this)"><span class="material-symbols-rounded">folder</span>Documents</button></div>'+
      '<section id="v34-panel-infos" class="v34-panel"><h3>Caractéristiques</h3><div class="v34-grid">'+
      '<div class="v34-field"><small>Type</small><b>'+esc(b.type||'—')+'</b></div><div class="v34-field"><small>Adresse</small><b>'+esc(b.adresse||'—')+'</b></div><div class="v34-field"><small>Vente</small><b>'+esc(b.vente||b.destineVente||'Non')+'</b></div><div class="v34-field"><small>Nb unités</small><b>'+unitRows.length+'</b></div><div class="v34-field"><small>Statut</small><b>'+esc(st)+'</b></div><div class="v34-field value"><small>Valeur estimée</small><b>'+money(b.valeur||b.valeurEstimee||b.prix)+'</b></div></div><h3 style="margin-top:11px">Unités</h3>'+unitHtml+'</section>'+
      '<section id="v34-panel-locataires" class="v34-panel" style="display:none"><h3>Locataires actuels du bien</h3>'+locHtml+'</section>'+
      '<section id="v34-panel-proprio" class="v34-panel" style="display:none"><h3>Propriétaire</h3>'+ownerHtml+'</section>'+
      '<section id="v34-panel-docs" class="v34-panel" style="display:none"><h3>Documents du bien</h3>'+docsHtml+'</section>'+
      '</div>';
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});
    page.classList.add('active'); page.style.display='';
    window.GP_CURRENT_PAGE='bien-detail';
    if(tab){setTimeout(function(){var bts=[].slice.call(page.querySelectorAll('.v34-tab'));var btn=bts.find(function(x){return norm(x.textContent).indexOf(norm(tab))>=0;});switchTab(tab,btn);},0);}
  }
  window.gpBackToBiens=function(){
    try{
      if(typeof window.navigate==='function') return window.navigate('biens');
    }catch(e){}
    var page=document.getElementById('page-bien-detail');
    if(page){page.classList.remove('active');page.style.display='none';}
    var biens=document.getElementById('page-biens');
    if(biens){biens.classList.add('active');biens.style.display='';}
    window.GP_CURRENT_PAGE='biens';
    if(typeof window.renderBiensFinal==='function') window.renderBiensFinal();
  };
  window.closeBienDetail=window.gpBackToBiens;

  /* Suppression d'un bien depuis sa fiche (remplace l'ancien appel à deleteRow, jamais défini).
   * Règle métier : un bien avec contrat actif ou location rattachée ne peut pas être supprimé. */
  window.gpDeleteBien=async function(idx){
    var d=db(), list=Array.isArray(d.biens)?d.biens:[], b=list[Number(idx)];
    if(!b) return (typeof window.toast==='function') && window.toast('Bien introuvable','err');
    var bid=String(b.id||'');
    var active=[];
    try{ if(window.GPRelationsV52 && GPRelationsV52.activeContractsForBien) active=GPRelationsV52.activeContractsForBien(d,b)||[]; }catch(e){}
    var locs=(d.locatives||[]).filter(function(l){ return bid && String(l.bienId||l.propertyId||'')===bid; });
    if(active.length||locs.length){
      var msg='Impossible de supprimer « '+(b.nom||'ce bien')+' » : '+(active.length?active.length+' contrat(s) actif(s)':'')+(active.length&&locs.length?' et ':'')+(locs.length?locs.length+' location(s) rattachée(s)':'')+'. Clôturez ou supprimez-les d\u2019abord.';
      return (typeof window.toast==='function') ? window.toast(msg,'err') : alert(msg);
    }
    if(!confirm('Supprimer définitivement « '+(b.nom||'ce bien')+' » ?')) return;
    list.splice(Number(idx),1);
    var ok=true;
    try{ ok=(window.GPDB && GPDB.save) ? await GPDB.save(d) : (window.DB=d, typeof window.saveDB==='function' ? await window.saveDB() : true); }catch(e){ ok=false; console.error('[gpDeleteBien]',e); }
    if(ok===false) return (typeof window.toast==='function') && window.toast('Suppression non enregistrée. Rechargez puis réessayez.','err');
    window._bienDetailIdx=undefined;
    window.gpBackToBiens();
    if(typeof window.toast==='function') window.toast('Bien supprimé ✓');
  };

  window.gpV34OpenDoc=function(i){
    var b=(db().biens||[])[Number(window._bienDetailIdx)], doc=b&&Array.isArray(b.documents)&&b.documents[Number(i)];
    if(doc&&doc.data) window.open(doc.data,'_blank');
    else if(doc&&doc.url) window.open(doc.url,'_blank');
    else if(window.toast) window.toast('Document indisponible','err');
  };
  window.openBienDetail=renderBienDetailV34;

})();
