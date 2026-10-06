/* Genius Property — Gestion centralisée des locataires
 * Module autonome : ne modifie pas le flux de création/modification des locations.
 * Source de vérité pour l'occupation : locatives.locataireId/tenantId -> biens/unites/contrats.
 */
(function(){
  'use strict';

  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function db(){
    try{ if(window.GPDB && typeof window.GPDB.load==='function') return window.GPDB.load() || {}; }catch(e){}
    try{ return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}') || {}; }catch(e){ return window.DB || {}; }
  }
  async function saveDB(d){
    window.DB=d;
    try{ localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d)); }catch(e){}
    try{ if(window.GPDB && typeof window.GPDB.save==='function'){ await window.GPDB.save(d); return; } }catch(e){}
    try{ if(typeof window.saveDB==='function') await window.saveDB(); }catch(e){}
  }
  function toast(msg,type){ if(typeof window.toast==='function') window.toast(msg,type); else if(type==='err') alert(msg); }
  function arr(d,k){ return Array.isArray(d[k]) ? d[k] : []; }
  function id(v){ return String(v==null?'':v); }
  function norm(v){ return String(v==null?'':v).trim().toLowerCase(); }
  function name(l){ return [l&&l.prenom,l&&l.nom].filter(Boolean).join(' ').trim() || (l&&l.nom) || 'Locataire'; }
  function initials(l){ return ((l&&l.prenom||'L')[0]+(l&&l.nom||'C')[0]).toUpperCase(); }
  function money(v){
    if(v==null || v==='') return '—';
    var n=String(v).replace(/[^0-9,.-]/g,'').replace(/,/g,'.');
    var x=Number(n);
    return Number.isFinite(x) ? new Intl.NumberFormat('fr-FR').format(x)+' FCFA' : String(v);
  }
  function findById(list,value){ var x=id(value); return arr({x:list},'x').find(function(o){return id(o&&o.id)===x;}) || null; }

  function relationForTenant(d,l){
    var lid=id(l&&l.id), locations=arr(d,'locatives').filter(function(x){
      return id(x.locataireId||x.tenantId)===lid || (!x.locataireId && !x.tenantId && norm(x.locataire||x.occupant)===norm(name(l)));
    });
    var biens=arr(d,'biens'), contrats=arr(d,'contrats'), out=[];
    locations.forEach(function(loc){
      var bien=biens.find(function(b){return id(b.id)===id(loc.bienId||loc.propertyId);}) || null;
      var unit=null;
      if(bien && Array.isArray(bien.unites)) unit=bien.unites.find(function(u){return id(u.id)===id(loc.uniteId||loc.unitId);}) || null;
      var contrat=contrats.find(function(c){return id(c.locationId||c.locativeId)===id(loc.id);}) || contrats.find(function(c){return id(c.locataireId||c.tenantId)===lid && id(c.bienId||c.propertyId)===id(loc.bienId||loc.propertyId) && (!loc.uniteId || id(c.uniteId||c.unitId)===id(loc.uniteId||loc.unitId));}) || null;
      out.push({loc:loc,bien:bien,unit:unit,contrat:contrat});
    });
    return out;
  }

  function currentRelations(d,l){
    return relationForTenant(d,l).filter(function(r){
      var s=norm(r.loc.statut||r.contrat&&r.contrat.statut||'');
      return ['loue','actif','active','en cours','encours','en attente'].indexOf(s)>=0;
    });
  }

  function relationLabel(r){
    var b=r.bien ? (r.bien.nom||r.bien.name||'Bien') : (r.loc.bien||'Bien non identifié');
    var u=r.unit ? (r.unit.nom||r.unit.name||'') : (r.loc.uniteNom||'');
    return u ? b+' · '+u : b;
  }
  function status(r){ return r.loc.statut || (r.contrat&&r.contrat.statut) || '—'; }

  function installCss(){
    if(document.getElementById('gpLocatairesListeCss')) return;
    var s=document.createElement('style'); s.id='gpLocatairesListeCss';
    s.textContent=`
      #page-locataires .gpl-wrap{padding:0 24px 24px}
      #page-locataires .gpl-head{display:flex;gap:12px;align-items:center;margin-bottom:12px}
      #page-locataires .gpl-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;flex:1}
      #page-locataires .gpl-kpi{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:10px;min-height:62px}
      #page-locataires .gpl-kpi-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fff8df;color:#c99d18}
      #page-locataires .gpl-kpi strong{display:block;font-size:19px;line-height:1;color:#111827}
      #page-locataires .gpl-kpi span{display:block;font-size:11px;font-weight:800;color:#475569;margin-top:3px}
      #page-locataires .gpl-tools{display:flex;gap:8px;align-items:center;margin-bottom:10px}
      #page-locataires .gpl-search{height:36px;width:280px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:7px;padding:0 10px}
      #page-locataires .gpl-search input{border:0;outline:0;width:100%;font-size:13px;background:transparent}
      #page-locataires .gpl-primary{height:36px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:800;padding:0 14px;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
      #page-locataires .gpl-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:auto}
      #page-locataires .gpl-table{width:100%;border-collapse:collapse;min-width:880px}
      #page-locataires .gpl-table th{background:#fffaf0;color:#374151;font-size:11px;text-transform:uppercase;padding:11px 12px;border-bottom:1px solid #e5e7eb;text-align:left}
      #page-locataires .gpl-table td{padding:12px;border-bottom:1px solid #f1f5f9;color:#374151;font-size:12px;vertical-align:middle}
      #page-locataires .gpl-person{display:flex;align-items:center;gap:9px;min-width:180px}
      #page-locataires .gpl-avatar{width:36px;height:36px;border-radius:50%;background:#d4af37;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;overflow:hidden;flex:0 0 36px}
      #page-locataires .gpl-avatar img{width:100%;height:100%;object-fit:cover}
      #page-locataires .gpl-name{font-weight:850;color:#111827}
      #page-locataires .gpl-sub{font-size:10px;color:#94a3b8;margin-top:2px}
      #page-locataires .gpl-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px;background:#eff6ff;color:#2563eb;font-weight:800;max-width:280px}
      #page-locataires .gpl-status{display:inline-flex;align-items:center;gap:5px;font-weight:800}
      #page-locataires .gpl-status:before{content:'';width:7px;height:7px;border-radius:50%;background:#22c55e}
      #page-locataires .gpl-status.off:before{background:#94a3b8}
      #page-locataires .gpl-actions{display:flex;gap:5px;white-space:nowrap}
      #page-locataires .gpl-action{width:32px;height:32px;border:1px solid #e5e7eb;background:#fff;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}.gpl-action .material-symbols-rounded{font-size:16px}.gpl-action:hover{background:#f8fafc;border-color:#cbd5e1}.gpl-action.danger:hover{background:#fef2f2;border-color:#fecaca;color:#ef4444}
      #page-locataires .gpl-action.danger{color:#b91c1c}
      .gpl-overlay{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:12000;display:flex;align-items:center;justify-content:center;padding:20px}
      .gpl-modal{width:min(900px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.25)}
      .gpl-modal.small{width:min(620px,96vw)}
      .gpl-modal-head{padding:16px 18px;border-bottom:1px solid #eef2f7;display:flex;justify-content:space-between;align-items:center;gap:10px}
      .gpl-modal-head h3{margin:0;font-size:18px;color:#111827}
      .gpl-modal-head p{margin:4px 0 0;font-size:11px;color:#64748b}
      .gpl-close{width:32px;height:32px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer}
      .gpl-body{padding:18px}
      .gpl-profile{display:grid;grid-template-columns:76px 1fr;gap:15px;align-items:center;margin-bottom:18px}
      .gpl-profile .gpl-avatar{width:70px;height:70px;font-size:20px}
      .gpl-profile h2{margin:0;font-size:21px;color:#111827}
      .gpl-profile .meta{font-size:12px;color:#64748b;margin-top:5px}
      .gpl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .gpl-field{border:1px solid #e5e7eb;border-radius:10px;padding:10px 11px;background:#fafafa}
      .gpl-field label{display:block;font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:800;margin-bottom:4px}
      .gpl-field div{font-size:13px;color:#111827;font-weight:700;word-break:break-word}
      .gpl-section{margin-top:18px}.gpl-section h4{font-size:13px;margin:0 0 9px;color:#111827}
      .gpl-rel{border:1px solid #e5e7eb;border-radius:11px;padding:12px;margin-bottom:8px;background:#fff}
      .gpl-rel-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
      .gpl-rel-title{font-weight:850;color:#111827}.gpl-rel-meta{font-size:11px;color:#64748b;margin-top:3px}
      .gpl-rel-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}
      .gpl-mini{background:#f8fafc;border-radius:8px;padding:7px}.gpl-mini b{display:block;font-size:10px;color:#94a3b8}.gpl-mini span{font-size:11px;font-weight:800;color:#334155}
      .gpl-empty{padding:28px;text-align:center;color:#94a3b8;font-size:12px}
      .gpl-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.gpl-form .full{grid-column:1/-1}
      .gpl-input{width:100%;box-sizing:border-box;height:38px;border:1px solid #dbe1e8;border-radius:8px;padding:0 10px;outline:0;font-size:13px;background:#fff}
      .gpl-label{display:block;font-size:11px;font-weight:800;color:#475569;margin-bottom:5px}
      .gpl-footer{padding:13px 18px;border-top:1px solid #eef2f7;display:flex;justify-content:flex-end;gap:8px}
      .gpl-btn{height:36px;border:1px solid #dbe1e8;background:#fff;border-radius:8px;padding:0 13px;font-weight:800;cursor:pointer}.gpl-btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}.gpl-btn.danger{color:#b91c1c}
      @media(max-width:760px){#page-locataires .gpl-head{display:block}.gpl-kpis{margin-bottom:10px}.gpl-tools{flex-wrap:wrap}.gpl-search{width:100%!important}.gpl-grid,.gpl-form{grid-template-columns:1fr}.gpl-rel-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  function removeModal(){ var x=document.querySelector('.gpl-overlay'); if(x) x.remove(); }
  function openModal(html,small){
    removeModal(); var ov=document.createElement('div'); ov.className='gpl-overlay';
    ov.innerHTML='<div class="gpl-modal'+(small?' small':'')+'">'+html+'</div>';
    document.body.appendChild(ov); ov.addEventListener('click',function(e){if(e.target===ov)removeModal();});
  }

  function render(){
    installCss(); var page=document.getElementById('page-locataires'); if(!page)return;
    var d=db(), all=arr(d,'locataires'), q=(document.getElementById('gplSearch')||{}).value||''; q=norm(q);
    var data=all.filter(function(l){
      var rel=relationForTenant(d,l), text=[name(l),l.tel,l.email,l.adresse,l.statut].concat(rel.map(function(r){return relationLabel(r)+' '+status(r)+' '+(r.loc.loyer||r.contrat&&r.contrat.loyer||'');})).join(' ');
      return !q || norm(text).indexOf(q)>=0;
    });
    var active=all.filter(function(l){return currentRelations(d,l).length>0;}).length;
    var occupied=all.filter(function(l){return relationForTenant(d,l).length>0;}).length;
    page.innerHTML='<div class="gpl-wrap"><div class="gpl-head"><div class="gpl-kpis">'+
      '<div class="gpl-kpi"><div class="gpl-kpi-ico"><span class="material-symbols-rounded">groups</span></div><div><strong>'+all.length+'</strong><span>Locataires</span></div></div>'+ 
      '<div class="gpl-kpi"><div class="gpl-kpi-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+occupied+'</strong><span>Avec occupation</span></div></div>'+ 
      '<div class="gpl-kpi"><div class="gpl-kpi-ico"><span class="material-symbols-rounded">verified_user</span></div><div><strong>'+active+'</strong><span>Occupations actives</span></div></div>'+ 
      '</div><button class="gpl-primary" onclick="openNouvelLocataireDrawer&&openNouvelLocataireDrawer()"><span class="material-symbols-rounded">add</span>Nouveau locataire</button></div>'+ 
      '<div class="gpl-tools"><label class="gpl-search"><span class="material-symbols-rounded" style="font-size:17px;color:#c99d18">search</span><input id="gplSearch" value="'+esc(q)+'" placeholder="Rechercher nom, téléphone, bien…"></label><span style="font-size:11px;color:#94a3b8">'+data.length+' résultat'+(data.length>1?'s':'')+'</span></div>'+ 
      '<div class="gpl-table-wrap">'+(data.length?'<table class="gpl-table"><thead><tr><th>Locataire</th><th>Contact</th><th>Occupation</th><th>Loyer</th><th>Statut</th><th>Actions</th></tr></thead><tbody>'+data.map(function(l){
        var rel=currentRelations(d,l)[0] || relationForTenant(d,l)[0], occ=rel?relationLabel(rel):'Aucune location';
        var rent=rel ? (rel.loc.loyer || rel.contrat&&rel.contrat.loyer) : '';
        var st=rel?status(rel):(l.statut||'Actif'), off=!rel || ['inactif','termine','terminé'].indexOf(norm(st))>=0;
        var idx=all.indexOf(l), av=l.photo?'<img src="'+esc(l.photo)+'" alt="">':esc(initials(l));
        return '<tr><td><div class="gpl-person"><div class="gpl-avatar">'+av+'</div><div><div class="gpl-name">'+esc(name(l))+'</div><div class="gpl-sub">'+esc(l.email||'')+'</div></div></div></td><td>'+esc(l.tel||'—')+'</td><td><span class="gpl-badge"><span class="material-symbols-rounded" style="font-size:14px">home_work</span>'+esc(occ)+'</span></td><td>'+esc(money(rent))+'</td><td><span class="gpl-status'+(off?' off':'')+'">'+esc(st)+'</span></td><td><div class="gpl-actions"><button class="gpl-action" title="Voir" onclick="GPLocataires.view('+idx+')"><span class="material-symbols-rounded">visibility</span></button><button class="gpl-action" title="Modifier" onclick="GPLocataires.edit('+idx+')"><span class="material-symbols-rounded">edit</span></button><button class="gpl-action" title="Documents" onclick="GPLocataires.docs('+idx+')"><span class="material-symbols-rounded">folder</span></button><button class="gpl-action danger" title="Supprimer" onclick="GPLocataires.remove('+idx+')"><span class="material-symbols-rounded">delete</span></button></div></td></tr>';
      }).join('')+'</tbody></table>':'<div class="gpl-empty">Aucun locataire trouvé.</div>')+'</div></div>';
    var input=document.getElementById('gplSearch'); if(input) input.addEventListener('input',render);
  }

  function view(idx){
    var d=db(), l=arr(d,'locataires')[idx]; if(!l)return; var rels=relationForTenant(d,l);
    var relHtml=rels.length?rels.map(function(r){
      var c=r.contrat||{}, loc=r.loc||{};
      return '<div class="gpl-rel"><div class="gpl-rel-top"><div><div class="gpl-rel-title">'+esc(relationLabel(r))+'</div><div class="gpl-rel-meta">'+esc(r.bien&& (r.bien.adresse||r.bien.address)||'Adresse du bien non renseignée')+'</div></div><span class="gpl-status">'+esc(status(r))+'</span></div><div class="gpl-rel-grid"><div class="gpl-mini"><b>Loyer</b><span>'+esc(money(loc.loyer||c.loyer))+'</span></div><div class="gpl-mini"><b>Entrée</b><span>'+esc(loc.dateEntree||c.debut||'—')+'</span></div><div class="gpl-mini"><b>Contrat</b><span>'+esc(c.num||'—')+'</span></div><div class="gpl-mini"><b>Fin</b><span>'+esc(c.fin||'—')+'</span></div></div></div>';
    }).join(''):'<div class="gpl-empty">Aucune location ou occupation reliée à ce locataire.</div>';
    var av=l.photo?'<img src="'+esc(l.photo)+'" alt="">':esc(initials(l));
    openModal('<div class="gpl-modal-head"><div><h3>Fiche locataire</h3><p>Informations personnelles et occupations liées</p></div><button class="gpl-close" onclick="GPLocataires.close()"><span class="material-symbols-rounded">close</span></button></div><div class="gpl-body"><div class="gpl-profile"><div class="gpl-avatar">'+av+'</div><div><h2>'+esc(name(l))+'</h2><div class="meta">'+esc(l.statut||'Actif')+' · Enregistré le '+esc(l.date||'—')+'</div></div></div><div class="gpl-grid"><div class="gpl-field"><label>Téléphone</label><div>'+esc(l.tel||'—')+'</div></div><div class="gpl-field"><label>Email</label><div>'+esc(l.email||'—')+'</div></div><div class="gpl-field"><label>Adresse</label><div>'+esc(l.adresse||'—')+'</div></div><div class="gpl-field"><label>Date de naissance</label><div>'+esc(l.naiss||'—')+'</div></div><div class="gpl-field"><label>Profession</label><div>'+esc(l.profession||l.metier||'—')+'</div></div><div class="gpl-field"><label>Situation familiale</label><div>'+esc(l.matri||'—')+'</div></div></div><div class="gpl-section"><h4>Occupations & historique</h4>'+relHtml+'</div></div><div class="gpl-footer"><button class="gpl-btn" onclick="GPLocataires.close()">Fermer</button><button class="gpl-btn" onclick="GPLocataires.edit('+idx+')"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle">edit</span> Modifier</button></div>');
  }

  function edit(idx){
    var d=db(), l=arr(d,'locataires')[idx]; if(!l)return;
    openModal('<div class="gpl-modal-head"><div><h3>Modifier le locataire</h3><p>Les informations de la personne uniquement. Le bien et le loyer restent gérés dans la location.</p></div><button class="gpl-close" onclick="GPLocataires.close()"><span class="material-symbols-rounded">close</span></button></div><div class="gpl-body"><form id="gplEditForm" class="gpl-form"><div><label class="gpl-label">Prénom *</label><input class="gpl-input" id="gpl-prenom" value="'+esc(l.prenom||'')+'"></div><div><label class="gpl-label">Nom *</label><input class="gpl-input" id="gpl-nom" value="'+esc(l.nom||'')+'"></div><div><label class="gpl-label">Téléphone *</label><input class="gpl-input" id="gpl-tel" value="'+esc(l.tel||'')+'"></div><div><label class="gpl-label">Email</label><input class="gpl-input" id="gpl-email" type="email" value="'+esc(l.email||'')+'"></div><div><label class="gpl-label">Date de naissance</label><input class="gpl-input" id="gpl-naiss" type="date" value="'+esc(l.naiss||'')+'"></div><div><label class="gpl-label">Situation familiale</label><input class="gpl-input" id="gpl-matri" value="'+esc(l.matri||'')+'"></div><div><label class="gpl-label">Profession</label><input class="gpl-input" id="gpl-profession" value="'+esc(l.profession||l.metier||'')+'"></div><div><label class="gpl-label">Statut</label><select class="gpl-input" id="gpl-statut"><option '+(norm(l.statut||'Actif')==='actif'?'selected':'')+'>Actif</option><option '+(norm(l.statut)==='inactif'?'selected':'')+'>Inactif</option></select></div><div class="full"><label class="gpl-label">Adresse</label><input class="gpl-input" id="gpl-adresse" value="'+esc(l.adresse||'')+'"></div></form></div><div class="gpl-footer"><button class="gpl-btn" onclick="GPLocataires.close()">Annuler</button><button class="gpl-btn primary" onclick="GPLocataires.save('+idx+')">Enregistrer</button></div>');
  }

  async function save(idx){
    var d=db(), a=arr(d,'locataires'), old=a[idx]; if(!old)return;
    var prenom=(document.getElementById('gpl-prenom').value||'').trim(), nom=(document.getElementById('gpl-nom').value||'').trim(), tel=(document.getElementById('gpl-tel').value||'').trim();
    if(!prenom||!nom||!tel){toast('Prénom, nom et téléphone sont requis.','err');return;}
    var newName=(prenom+' '+nom).trim(), oldName=name(old), oldId=id(old.id);
    var duplicate=a.some(function(x,i){return i!==idx && norm(x.prenom)===norm(prenom) && norm(x.nom)===norm(nom);});
    if(duplicate){toast('Un locataire portant déjà ce nom existe.','err');return;}
    old.prenom=prenom; old.nom=nom; old.tel=tel; old.email=(document.getElementById('gpl-email').value||'').trim(); old.naiss=(document.getElementById('gpl-naiss').value||'').trim(); old.matri=(document.getElementById('gpl-matri').value||'').trim(); old.profession=(document.getElementById('gpl-profession').value||'').trim(); old.adresse=(document.getElementById('gpl-adresse').value||'').trim(); old.statut=document.getElementById('gpl-statut').value||'Actif';
    if(oldName!==newName){
      arr(d,'locatives').forEach(function(x){if(id(x.locataireId||x.tenantId)===oldId){x.locataire=newName;x.occupant=newName;}});
      arr(d,'contrats').forEach(function(x){if(id(x.locataireId||x.tenantId)===oldId){x.locataire=newName;}});
      arr(d,'paiements').forEach(function(x){if(id(x.locataireId||x.tenantId)===oldId){x.locataire=newName;x.occupant=newName;}});
      arr(d,'biens').forEach(function(b){if(Array.isArray(b.unites)) b.unites.forEach(function(u){if(id(u.locataireId||u.tenantId)===oldId){u.locataire=newName;}});});
    }
    await saveDB(d); try{if(window.auditLog)window.auditLog('Modification','Locataires','Locataire : '+newName);}catch(e){}
    removeModal(); render(); toast('Locataire modifié avec succès ✓');
  }

  async function remove(idx){
    var d=db(), a=arr(d,'locataires'), l=a[idx]; if(!l)return; var rels=relationForTenant(d,l);
    if(rels.length){toast('Suppression impossible : ce locataire possède une ou plusieurs locations/historiques. Passez-le en Inactif.','err');return;}
    if(!confirm('Supprimer le locataire « '+name(l)+' » ? Cette action est définitive.')) return;
    a.splice(idx,1); d.locataires=a; await saveDB(d); try{if(window.auditLog)window.auditLog('Suppression','Locataires','Locataire : '+name(l));}catch(e){}
    render(); toast('Locataire supprimé.');
  }

  function docs(idx){
    if(typeof window.openEntityDocs==='function') return window.openEntityDocs('locataires',idx);
    view(idx);
  }
  function close(){ removeModal(); }

  window.GP_LOCATAIRES_LISTE=true;
  window.GPModules=window.GPModules||{};
  window.GPModules.locatairesListe={render:render,view:view,edit:edit,save:save,remove:remove};
  window.GPModules.locatairesListe.close=close;
  window.GPModules.locatairesListe.docs=docs;
  window.GPModules.locatairesListe.relations=relationForTenant;
  window.renderLocatairesModern=render;
  window.GPDBLocatairesRelations={forTenant:relationForTenant};
  window.GPLocataires={render:render,view:view,edit:edit,save:save,remove:remove,close:close,docs:docs};

  function boot(){
    if(window.GPNavigation && typeof window.GPNavigation.registerRenderer==='function') window.GPNavigation.registerRenderer('locataires',render);
    if(window.GPNavigation && typeof window.GPNavigation.registerRenderer==='function') window.GPNavigation.registerRenderer('nv-locataire',function(){ if(typeof window.openNouvelLocataireDrawer==='function') return window.openNouvelLocataireDrawer(); });
    if(window.GP_CURRENT_PAGE==='locataires') render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
