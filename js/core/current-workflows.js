/* Genius Property — current workflow runtime.
 * Consolidated from the refactor iterations. This is the single active module
 * for Locations + Biens + Propriétaires forms and live refresh.
 */

/* ===== consolidated: unified-locations-v4.js ===== */
/* Genius Property V4 — Gestion locative unifiée
 * Une seule entrée métier : LOCATION.
 * Une location regroupe : bien + locataire + contrat + loyer/échéances.
 * Compatibilité conservée avec les tableaux legacy locatives/locataires/contrats.
 */
(function(){
  'use strict';
  var state={mode:'list',editIndex:-1,focus:'locations'};
  var $=function(id){return document.getElementById(id);};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var norm=function(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();};
  var db=function(){return window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});};
  var money=function(v){var n=Number(String(v||'').replace(/[^0-9,.-]/g,'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':'—';};
  var amount=function(v){var n=Number(String(v||'').replace(/[^0-9,.-]/g,'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0;};
  var today=function(){return new Date().toISOString().slice(0,10);};
  var toast=function(m,t){if(typeof window.toast==='function') window.toast(m,t||''); else console.log(m);};
  var save=async function(d){if(window.GPDB&&GPDB.save) return await GPDB.save(d); window.DB=d;if(typeof window.saveDB==='function') return await window.saveDB();return true;};
  function tenantName(t){return t?[t.prenom,t.nom].filter(Boolean).join(' ').trim()||t.nom||t.name||'—':'—';}
  function findTenant(d,name){var q=norm(name),id=String(name||'');return (d.locataires||[]).find(function(t){return String(t.id||'')===id;})||(d.locataires||[]).find(function(t){return norm(tenantName(t))===q||norm(t.nom)===q;});}
  function findContract(d,loc){
    var lid=String(loc&&loc.id||'');
    if(lid){var byId=(d.contrats||[]).find(function(c){return String(c.locationId||c.locativeId||'')===lid;});if(byId)return byId;}
    var q=norm(loc&&loc.nom||loc&&loc.bien),tenant=norm(loc&&loc.locataire||loc&&loc.occupant);
    return (d.contrats||[]).find(function(c){return (!q||norm(c.locative||c.bien)===q)&&(!tenant||norm(c.locataire)===tenant);});
  }
  function findLocationForContract(d,c){
    var lid=String(c&&c.locationId||c&&c.locativeId||'');
    if(lid){var byId=(d.locatives||[]).find(function(l){return String(l.id)===lid;});if(byId)return byId;}
    var q=norm(c&&c.locative||c&&c.bien);return (d.locatives||[]).find(function(l){return norm(l.nom||l.bien)===q||norm(l.bien)===q;})||null;
  }
  function propertyOptions(d,selected){
    var out=['<option value="">Sélectionner un bien / une unité</option>'];
    var currentId='', currentUnitId='';
    var current=(d.locatives||[]).find(function(l){return norm(l.id)===norm(selected)||norm(l.bien)===norm(selected)||norm(l.nom)===norm(selected);});
    if(current){currentId=String(current.bienId||current.propertyId||'');currentUnitId=String(current.uniteId||current.unitId||'');}
    (d.biens||[]).forEach(function(b){
      var us=Array.isArray(b.unites)&&b.unites.length?b.unites:[{id:b.id,nom:b.nom||'Bien',loyer:b.loyer||''}];
      if(us.length>1 || (Array.isArray(b.unites)&&b.unites.length)){
        out.push('<optgroup label="'+esc(b.nom||'Bien')+'">');
        us.forEach(function(u){
          var bid=String(b.id||''),uid=String(u.id||'');
          var snap=window.GPRelationsV52&&GPRelationsV52.propertySnapshot?GPRelationsV52.propertySnapshot(d,b):null;
          var active=snap&&snap.units&&snap.units.some(function(r){return r.unit&&String(r.unit.id)===uid&&r.occupied;});
          var isCurrent=(bid===currentId&&uid===currentUnitId);
          if(active&&!isCurrent)return;
          var label=[b.nom,u.nom].filter(Boolean).join(' - ');
          out.push('<option value="'+esc(uid)+'" data-bien-id="'+esc(bid)+'" data-unit-id="'+esc(uid)+'" data-parent="'+esc(b.nom||'')+'" data-label="'+esc(label)+'" data-loyer="'+esc(u.loyer||b.loyer||'')+'" '+(isCurrent?'selected':'')+'>'+esc(u.nom||label)+'</option>');
        });
        out.push('</optgroup>');
      }else{
        var bid=String(b.id||''), snap=window.GPRelationsV52&&GPRelationsV52.propertySnapshot?GPRelationsV52.propertySnapshot(d,b):null;
        var active=!!(snap&&snap.occupied&&snap.occupied.length);
        var isCurrent=bid===currentId||norm(b.nom)===norm(selected);
        if(active&&!isCurrent)return;
        out.push('<option value="'+esc(bid)+'" data-bien-id="'+esc(bid)+'" data-unit-id="'+esc(bid)+'" data-parent="'+esc(b.nom||'')+'" data-label="'+esc(b.nom||'')+'" data-loyer="'+esc(b.loyer||'')+'" '+(isCurrent?'selected':'')+'>'+esc(b.nom||'Bien')+'</option>');
      }
    });
    return out.join('');
  }
  function tenantOptions(d,selected){var sid=String(selected||'');return (d.locataires||[]).map(function(t){var n=tenantName(t),sel=(String(t.id||'')===sid||norm(n)===norm(selected));return '<option value="'+esc(t.id||n)+'" data-name="'+esc(n)+'" '+(sel?'selected':'')+'>'+esc(n)+(t.tel?' — '+esc(t.tel):'')+'</option>';}).join('');}
  function contractFor(d,loc){return findContract(d,loc)||{};}
  function statusClass(s){var x=norm(s);return x==='loue'||x==='actif'?'ok':x==='en attente'||x==='attente'?'wait':'off';}
  function injectStyles(){if($('gp-unified-locations-style'))return;var s=document.createElement('style');s.id='gp-unified-locations-style';s.textContent='.gp-ul-page{padding:18px}.gp-ul-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}.gp-ul-title h2{margin:0;font-size:20px}.gp-ul-title p{margin:4px 0 0;color:#64748b;font-size:12px}.gp-ul-actions{display:flex;gap:8px;flex-wrap:wrap}.gp-ul-btn{border:1px solid #e5e7eb;background:#fff;border-radius:9px;padding:9px 13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px}.gp-ul-btn.primary{background:#d4af37;border-color:#d4af37;color:#111}.gp-ul-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.gp-ul-stat{background:#fff;border:1px solid #eef2f7;border-radius:12px;padding:12px 14px}.gp-ul-stat b{display:block;font-size:20px}.gp-ul-stat span{font-size:11px;color:#64748b}.gp-ul-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.gp-ul-search{flex:1;min-width:220px;background:#fff;border:1px solid #e5e7eb;border-radius:9px;padding:9px 11px;outline:none}.gp-ul-filter{background:#fff;border:1px solid #e5e7eb;border-radius:9px;padding:9px 10px}.gp-ul-table{background:#fff;border:1px solid #eef2f7;border-radius:12px;overflow:auto}.gp-ul-table table{width:100%;border-collapse:collapse;min-width:760px}.gp-ul-table th{background:#fafafa;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;padding:11px}.gp-ul-table td{padding:12px;border-top:1px solid #f1f5f9;font-size:12px}.gp-ul-actions-cell{display:flex;gap:5px}.gp-ul-icon{width:30px;height:30px;border:1px solid #e5e7eb;background:#fff;border-radius:7px;cursor:pointer;display:grid;place-items:center}.gp-ul-pill{display:inline-flex;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:800}.gp-ul-pill.ok{background:#dcfce7;color:#15803d}.gp-ul-pill.wait{background:#fef3c7;color:#92400e}.gp-ul-pill.off{background:#f1f5f9;color:#475569}.gp-ul-overlay{position:fixed;inset:0;background:rgba(15,23,42,.38);z-index:1000;display:flex;justify-content:flex-end}.gp-ul-drawer{width:min(720px,100%);height:100%;background:#fff;overflow:auto;box-shadow:-12px 0 40px rgba(0,0,0,.18)}.gp-ul-dhead{position:sticky;top:0;background:#fff;border-bottom:1px solid #eef2f7;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;z-index:2}.gp-ul-dhead h3{margin:0;font-size:17px}.gp-ul-body{padding:18px}.gp-ul-section{border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:12px}.gp-ul-section h4{margin:0 0 12px;font-size:13px}.gp-ul-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gp-ul-field{display:flex;flex-direction:column;gap:5px}.gp-ul-field.full{grid-column:1/-1}.gp-ul-field label{font-size:11px;font-weight:700;color:#475569}.gp-ul-field input,.gp-ul-field select,.gp-ul-field textarea{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:8px;padding:9px 10px;font-size:12px;outline:none;background:#fff}.gp-ul-field input:focus,.gp-ul-field select:focus,.gp-ul-field textarea:focus{border-color:#d4af37;box-shadow:0 0 0 2px rgba(212,175,55,.12)}.gp-ul-inline{display:flex;gap:8px;align-items:end}.gp-ul-inline>*{flex:1}.gp-ul-check{display:flex;gap:8px;align-items:center;font-size:12px}.gp-ul-docs{margin-top:12px;border:1px solid #ece7d8;background:#fffdf5;border-radius:10px;padding:10px}.gp-ul-docs-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}.gp-ul-docs-head b{display:block;font-size:12px;color:#334155}.gp-ul-docs-head small{display:block;font-size:10px;color:#94a3b8;margin-top:2px}.gp-ul-docs-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#7c6a22;background:#fff8d8;border:1px solid #f0e4a8;border-radius:999px;padding:4px 7px}.gp-ul-docs-badge .material-symbols-rounded{font-size:13px}.gp-ul-docs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.gp-ul-doc-field{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid #eee8d9;border-radius:8px;padding:7px}.gp-ul-doc-field span{font-size:10px;font-weight:700;color:#475569}.gp-ul-doc-field input{width:100%;font-size:10px;color:#64748b}.gp-ul-doc-note{margin-top:7px;font-size:9px;color:#94a3b8}.gp-ul-footer{position:sticky;bottom:0;background:#fff;border-top:1px solid #eef2f7;padding:12px 18px;display:flex;justify-content:flex-end;gap:8px}.gp-ul-detail{padding:18px}.gp-ul-detail-card{border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:10px}.gp-ul-detail-card h4{margin:0 0 10px;font-size:13px}.gp-ul-kv{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.gp-ul-kv div{background:#f8fafc;border-radius:8px;padding:9px}.gp-ul-kv small{display:block;color:#64748b;font-size:10px}.gp-ul-kv b{font-size:12px}.gp-ul-kv .full{grid-column:1/-1}.gp-ul-detail-docs{display:grid;gap:7px}.gp-ul-detail-doc{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #ece7d8;border-radius:8px;background:#fffdf5}.gp-ul-detail-doc>.material-symbols-rounded{font-size:18px;color:#b58f00}.gp-ul-detail-doc>div{flex:1;min-width:0}.gp-ul-detail-doc b,.gp-ul-detail-doc small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gp-ul-detail-doc b{font-size:11px}.gp-ul-detail-doc small{font-size:9px;color:#94a3b8}.gp-ul-detail-doc a{color:#2563eb;text-decoration:none}.gp-ul-existing-docs{display:grid;gap:6px;margin-bottom:8px}.gp-ul-existing-doc{display:flex;align-items:center;gap:7px;padding:7px 8px;border:1px solid #ece7d8;border-radius:8px;background:#fff}.gp-ul-existing-doc>.material-symbols-rounded{font-size:16px;color:#b58f00}.gp-ul-existing-doc-name{flex:1;min-width:0}.gp-ul-existing-doc-name b,.gp-ul-existing-doc-name small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gp-ul-existing-doc-name b{font-size:10px}.gp-ul-existing-doc-name small{font-size:9px;color:#94a3b8}.gp-ul-doc-open{font-size:17px;color:#2563eb;text-decoration:none}.gp-ul-no-docs{padding:8px;color:#94a3b8;font-size:10px;border:1px dashed #e5e7eb;border-radius:8px;background:#fff}.gp-ul-empty{text-align:center;padding:35px;color:#94a3b8}@media(max-width:700px){.gp-ul-stats{grid-template-columns:repeat(2,1fr)}.gp-ul-grid,.gp-ul-kv{grid-template-columns:1fr}}';document.head.appendChild(s);}
  function pageShell(){var p=$('page-locatives');if(!p)return null;injectStyles();return p;}
  function renderList(){if(typeof window.renderLocativesFinal==='function'){return window.renderLocativesFinal();}var p=pageShell();if(!p)return;var d=db();if(window.GPRelationsV52)window.GPRelationsV52.ensure(d);var all=Array.isArray(d.locatives)?d.locatives:[],q=(state.q||'').toLowerCase(),status=state.status||'';var rows=all.filter(function(l){var c=findContract(d,l),t=findTenant(d,l.locataire||l.occupant);var hay=[l.nom,l.bien,l.locataire,l.occupant,t&&tenantName(t),c&&c.num].join(' ').toLowerCase();return (!q||hay.indexOf(q)>=0)&&(!status||norm(l.statut)===norm(status));});var active=all.filter(function(l){return ['loue','loue','actif'].indexOf(norm(l.statut))>=0;}).length;var pending=all.filter(function(l){return norm(l.statut)==='en attente';}).length;var vacant=all.filter(function(l){return ['disponible','libre'].indexOf(norm(l.statut))>=0;}).length;p.innerHTML='<div class="gp-ul-page"><div class="gp-ul-head"><div class="gp-ul-title"><h2>Locations</h2><p>Une seule fiche pour le bien, le locataire, le contrat et le loyer.</p></div><div class="gp-ul-actions"><button class="gp-ul-btn" onclick="window.gpUL.openFocus(\'tenants\')"><span class="material-symbols-rounded">groups</span>Locataires</button><button class="gp-ul-btn" onclick="window.gpUL.openFocus(\'contracts\')"><span class="material-symbols-rounded">description</span>Contrats</button><button class="gp-ul-btn primary" onclick="window.gpUL.openNew()"><span class="material-symbols-rounded">add</span>Nouvelle location</button></div></div><div class="gp-ul-stats"><div class="gp-ul-stat"><b>'+all.length+'</b><span>Locations</span></div><div class="gp-ul-stat"><b>'+active+'</b><span>Actives</span></div><div class="gp-ul-stat"><b>'+vacant+'</b><span>Disponibles</span></div><div class="gp-ul-stat"><b>'+pending+'</b><span>En attente</span></div></div><div class="gp-ul-toolbar"><input class="gp-ul-search" placeholder="Rechercher bien, locataire ou contrat…" value="'+esc(state.q||'')+'" oninput="window.gpUL.search(this.value)"><select class="gp-ul-filter" onchange="window.gpUL.filter(this.value)"><option value="">Tous les statuts</option><option value="Loué" '+(norm(status)==='loue'?'selected':'')+'>Loué</option><option value="Disponible" '+(norm(status)==='disponible'?'selected':'')+'>Disponible</option><option value="En attente" '+(norm(status)==='en attente'?'selected':'')+'>En attente</option><option value="Terminé" '+(norm(status)==='termine'?'selected':'')+'>Terminé</option></select></div><div class="gp-ul-table">'+(rows.length?'<table><thead><tr><th>Bien</th><th>Locataire</th><th>Contrat</th><th>Loyer</th><th>Entrée</th><th>Statut</th><th></th></tr></thead><tbody>'+rows.map(function(l){var idx=all.indexOf(l),t=findTenant(d,l.locataire||l.occupant),c=findContract(d,l);return '<tr><td><b>'+esc(l.bien||l.nom||'—')+'</b></td><td>'+esc(t?tenantName(t):(l.locataire||l.occupant||'—'))+'</td><td>'+esc(c?(c.num||c.numero||'Contrat actif'):'—')+'</td><td>'+esc(l.loyer||money(c&&c.loyer))+'</td><td>'+esc(l.dateEntree||c&&c.debut||'—')+'</td><td><span class="gp-ul-pill '+statusClass(l.statut)+'">'+esc(l.statut||'—')+'</span></td><td><div class="gp-ul-actions-cell"><button class="gp-ul-icon" title="Voir" onclick="window.gpUL.view('+idx+')"><span class="material-symbols-rounded">visibility</span></button></div></td></tr>';}).join('')+'</tbody></table>':'<div class="gp-ul-empty"><span class="material-symbols-rounded" style="font-size:34px">door_front</span><div>Aucune location trouvée</div><button class="gp-ul-btn primary" style="margin-top:10px" onclick="window.gpUL.openNew()">Créer une location</button></div>')+'</div></div>';}
  function tenantDocsHtml(d,t){
    var ti=t?(d.locataires||[]).indexOf(t):-1, key='loc_'+ti, docs=(ti>=0&&d.locataireDocs&&Array.isArray(d.locataireDocs[key]))?d.locataireDocs[key]:[];
    var existing=docs.length?'<div class="gp-ul-existing-docs">'+docs.map(function(x){
      var data=x.data||''; var href=data || '#';
      return '<div class="gp-ul-existing-doc"><span class="material-symbols-rounded">description</span><span class="gp-ul-existing-doc-name" title="'+esc(x.fileName||x.name||'Document')+'"><b>'+esc(x.name||'Document')+'</b><small>'+esc(x.fileName||'')+'</small></span>'+(data?'<a class="gp-ul-doc-open" href="'+esc(href)+'" target="_blank" rel="noopener" title="Ouvrir">open_in_new</a>':'')+'</div>';
    }).join('')+'</div>':'<div class="gp-ul-no-docs">Aucun document enregistré pour ce locataire.</div>';
    return '<div class="gp-ul-docs"><div class="gp-ul-docs-head"><div><b>Documents du locataire</b><small>Pièce d’identité, justificatif, contrat de travail…</small></div><span class="gp-ul-docs-badge"><span class="material-symbols-rounded">folder</span> '+docs.length+' pièce'+(docs.length>1?'s':'')+'</span></div>'+existing+'<div class="gp-ul-docs-grid"><label class="gp-ul-doc-field"><span>Pièce d’identité</span><input type="file" accept="image/*,.pdf" data-tenant-doc="Pièce d’identité"></label><label class="gp-ul-doc-field"><span>Justificatif de domicile</span><input type="file" accept="image/*,.pdf" data-tenant-doc="Justificatif de domicile"></label><label class="gp-ul-doc-field"><span>Contrat de travail</span><input type="file" accept="image/*,.pdf" data-tenant-doc="Contrat de travail"></label><label class="gp-ul-doc-field"><span>Autre document</span><input type="file" accept="image/*,.pdf,.doc,.docx" data-tenant-doc="Autre document"></label></div><div class="gp-ul-doc-note">Les nouveaux fichiers sont ajoutés aux documents existants, sans supprimer ceux déjà enregistrés.</div></div>';
  }
  function tenantFormHtml(t){t=t||{};var d=db();return '<div class="gp-ul-grid"><div class="gp-ul-field"><label>Prénom *</label><input id="ul-t-prenom" value="'+esc(t.prenom||'')+'"></div><div class="gp-ul-field"><label>Nom *</label><input id="ul-t-nom" value="'+esc(t.nom||'')+'"></div><div class="gp-ul-field"><label>Téléphone *</label><input id="ul-t-tel" inputmode="tel" value="'+esc(t.tel||'')+'"></div><div class="gp-ul-field"><label>Email</label><input id="ul-t-email" type="email" value="'+esc(t.email||'')+'"></div><div class="gp-ul-field"><label>Profession</label><input id="ul-t-profession" value="'+esc(t.profession||t.metier||'')+'"></div><div class="gp-ul-field"><label>Type</label><select id="ul-t-type"><option '+(t.type!=='Entreprise'?'selected':'')+'>Particulier</option><option '+(t.type==='Entreprise'?'selected':'')+'>Entreprise</option></select></div><div class="gp-ul-field full"><label>Adresse *</label><input id="ul-t-adresse" value="'+esc(t.adresse||'')+'"></div></div>'+tenantDocsHtml(d,t);}
  function readFileData(file){return new Promise(function(resolve,reject){if(!file)return resolve(null);var r=new FileReader();r.onload=function(e){resolve(e.target.result)};r.onerror=reject;r.readAsDataURL(file);});}
  async function collectTenantDocuments(){var inputs=[].slice.call(document.querySelectorAll('#gpUlOverlay input[type="file"][data-tenant-doc]'));var out=[];for(var i=0;i<inputs.length;i++){var f=inputs[i].files&&inputs[i].files[0];if(!f)continue;if(f.size>8*1024*1024){toast('Le fichier « '+f.name+' » dépasse 8 Mo.','err');throw new Error('Fichier trop volumineux');}out.push({type:inputs[i].getAttribute('data-tenant-doc')||'Autre document',file:f,data:await readFileData(f)});}return out;}
  function attachTenantDocuments(d,tenant,tenantIndex,docs){if(!docs.length||tenantIndex<0)return;if(!d.locataireDocs||typeof d.locataireDocs!=='object')d.locataireDocs={};var key='loc_'+tenantIndex;if(!Array.isArray(d.locataireDocs[key]))d.locataireDocs[key]=[];docs.forEach(function(x){d.locataireDocs[key].push({id:'DOC-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:x.type,fileName:x.file.name,album:'Documents locataire',type:x.file.type||'application/octet-stream',mime:x.file.type||'application/octet-stream',size:x.file.size||0,data:x.data,created:new Date().toISOString(),date:new Date().toISOString()});});}
  function formHtml(idx){var d=db();if(window.GPRelationsV52)window.GPRelationsV52.ensure(d);var l=idx>=0?(d.locatives||[])[idx]||{}:{},t=findTenant(d,l.locataire||l.occupant),c=contractFor(d,l),newTenant=!t;var editing=idx>=0;return '<div class="gp-ul-overlay" id="gpUlOverlay" onclick="if(event.target===this)window.gpUL.close()"><div class="gp-ul-drawer"><div class="gp-ul-dhead"><div><h3>'+ (editing?'Modifier la location':'Nouvelle location') +'</h3><div style="font-size:11px;color:#64748b">Tout est enregistré depuis cette fiche.</div></div><button class="gp-ul-icon" onclick="window.gpUL.close()"><span class="material-symbols-rounded">close</span></button></div><div class="gp-ul-body"><div class="gp-ul-section"><h4>1. Bien loué</h4><div class="gp-ul-grid"><div class="gp-ul-field full"><label>Bien / unité *</label><select id="ul-bien"><option value="">Sélectionner un bien</option>'+propertyOptions(d,l.bien||l.nom)+'</select></div><div class="gp-ul-field"><label>Date d’entrée *</label><input id="ul-date-entree" type="date" value="'+esc(l.dateEntree||c.debut||today())+'"></div><div class="gp-ul-field"><label>Statut *</label><select id="ul-statut"><option '+(norm(l.statut||'Loué')==='loue'?'selected':'')+'>Loué</option><option '+(norm(l.statut)==='disponible'?'selected':'')+'>Disponible</option><option '+(norm(l.statut)==='en attente'?'selected':'')+'>En attente</option><option '+(norm(l.statut)==='termine'?'selected':'')+'>Terminé</option></select></div></div></div><div class="gp-ul-section"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h4>2. Locataire</h4><label class="gp-ul-check"><input id="ul-new-tenant" type="checkbox" '+(newTenant?'checked':'')+' onchange="window.gpUL.toggleTenant()"> Nouveau locataire</label></div><div id="ul-existing-tenant" style="display:'+(newTenant?'none':'block')+'"><div class="gp-ul-field"><label>Locataire *</label><select id="ul-tenant"><option value="">Sélectionner un locataire</option>'+tenantOptions(d,l.locataireId||l.tenantId||l.locataire||l.occupant)+'</select></div>'+(newTenant?'':'<div id="ul-existing-tenant-docs">'+tenantDocsHtml(d,t)+'</div>')+'</div><div id="ul-new-tenant-form" style="display:'+(newTenant?'block':'none')+';margin-top:10px">'+tenantFormHtml(t)+'</div></div><div class="gp-ul-section"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h4>3. Contrat & finances</h4><label class="gp-ul-check"><input id="ul-contract" type="checkbox" '+(c||!editing?'checked':'')+' onchange="window.gpUL.toggleContract()"> Créer / mettre à jour le contrat</label></div><div id="ul-contract-form"><div class="gp-ul-grid"><div class="gp-ul-field"><label>N° contrat</label><input id="ul-c-num" value="'+esc(c.num||('CT-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-6)))+'" readonly></div><div class="gp-ul-field"><label>Type</label><select id="ul-c-type"><option '+(!c.type||c.type==='Habitation'?'selected':'')+'>Habitation</option><option '+(c.type==='Commercial'?'selected':'')+'>Commercial</option><option '+(c.type==='Bureau'?'selected':'')+'>Bureau</option></select></div><div class="gp-ul-field"><label>Date signature</label><input id="ul-c-sign" type="date" value="'+esc(c.sign||c.debut||l.dateEntree||today())+'"></div><div class="gp-ul-field"><label>Date début *</label><input id="ul-c-debut" type="date" value="'+esc(c.debut||l.dateEntree||today())+'"></div><div class="gp-ul-field"><label>Date fin</label><input id="ul-c-fin" type="date" value="'+esc(c.fin||'')+'"></div><div class="gp-ul-field"><label>Prochaine échéance</label><input id="ul-c-prochain" type="date" value="'+esc(c.prochain||c.prochainPaiement||c.debut||l.dateEntree||today())+'"></div><div class="gp-ul-field"><label>Loyer mensuel *</label><input id="ul-c-loyer" inputmode="decimal" value="'+esc(String(c.loyer||l.loyer||'').replace(/[^0-9,.-]/g,''))+'" placeholder="150000"></div><div class="gp-ul-field"><label>Charges</label><input id="ul-c-charges" inputmode="decimal" value="'+esc(String(c.charges||l.charge||'').replace(/[^0-9,.-]/g,''))+'"></div><div class="gp-ul-field"><label>Caution</label><input id="ul-c-caution" inputmode="decimal" value="'+esc(String(c.caution||'').replace(/[^0-9,.-]/g,''))+'"></div><div class="gp-ul-field"><label>Honoraires</label><input id="ul-c-honor" inputmode="decimal" value="'+esc(String(c.honor||'').replace(/[^0-9,.-]/g,''))+'"></div><div class="gp-ul-field full"><label>Observations</label><textarea id="ul-c-obs" rows="3">'+esc(c.obs||'')+'</textarea></div></div></div></div></div><div class="gp-ul-footer"><button class="gp-ul-btn" onclick="window.gpUL.close()">Annuler</button><button class="gp-ul-btn primary" id="gpUlSave" onclick="window.gpUL.save()"><span class="material-symbols-rounded">save</span>Enregistrer</button></div></div></div>';}
  function detail(idx){
    var d=db(),l=(d.locatives||[])[idx];if(!l)return;
    var t=findTenant(d,l.locataire||l.occupant),c=findContract(d,l),ti=t?(d.locataires||[]).indexOf(t):-1;
    var docs=(ti>=0&&d.locataireDocs&&Array.isArray(d.locataireDocs['loc_'+ti]))?d.locataireDocs['loc_'+ti]:[];
    var p=$('page-locatives');
    var docHtml=docs.length?docs.map(function(x){var data=x.data||'';return '<div class="gp-ul-detail-doc"><span class="material-symbols-rounded">description</span><div><b>'+esc(x.name||'Document')+'</b><small>'+esc(x.fileName||'')+'</small></div>'+(data?'<a href="'+esc(data)+'" target="_blank" rel="noopener" title="Ouvrir le fichier"><span class="material-symbols-rounded">open_in_new</span></a>':'')+'</div>';}).join(''):'<div class="gp-ul-no-docs">Aucun document enregistré pour ce locataire.</div>';
    var body='<div class="gp-ul-detail">'+
      '<div class="gp-ul-detail-card"><h4>Location</h4><div class="gp-ul-kv">'+
      '<div><small>Nom / référence</small><b>'+esc(l.nom||'Location')+'</b></div><div><small>Bien / unité</small><b>'+esc(l.bien||l.parentBien||'—')+'</b></div>'+
      '<div><small>Loyer</small><b>'+esc(l.loyer||money(c&&c.loyer))+'</b></div><div><small>Charges</small><b>'+esc(l.charge||money(c&&c.charges))+'</b></div>'+
      '<div><small>Date d’entrée</small><b>'+esc(l.dateEntree||c&&c.debut||'—')+'</b></div><div><small>Statut</small><b>'+esc(l.statut||'—')+'</b></div>'+
      '</div></div>'+
      '<div class="gp-ul-detail-card"><h4>Locataire</h4><div class="gp-ul-kv">'+
      '<div><small>Nom</small><b>'+esc(t?tenantName(t):(l.locataire||l.occupant||'—'))+'</b></div><div><small>Téléphone</small><b>'+esc(t&&t.tel||'—')+'</b></div>'+
      '<div><small>Email</small><b>'+esc(t&&t.email||'—')+'</b></div><div><small>Profession</small><b>'+esc(t&&t.profession||t&&t.metier||'—')+'</b></div>'+
      '<div><small>Type</small><b>'+esc(t&&t.type||'—')+'</b></div><div><small>Statut</small><b>'+esc(t&&t.statut||'—')+'</b></div>'+
      '<div class="full"><small>Adresse</small><b>'+esc(t&&t.adresse||'—')+'</b></div>'+
      '</div></div>'+
      '<div class="gp-ul-detail-card"><h4>Contrat associé</h4><div class="gp-ul-kv">'+
      '<div><small>N° contrat</small><b>'+esc(c&&(c.num||c.numero)||'Aucun contrat')+'</b></div><div><small>Statut</small><b>'+esc(c&&c.statut||'—')+'</b></div>'+
      '<div><small>Type</small><b>'+esc(c&&c.type||'—')+'</b></div><div><small>Signature</small><b>'+esc(c&&c.sign||'—')+'</b></div>'+
      '<div><small>Début</small><b>'+esc(c&&c.debut||l.dateEntree||'—')+'</b></div><div><small>Fin</small><b>'+esc(c&&c.fin||'—')+'</b></div>'+
      '<div><small>Loyer contrat</small><b>'+esc(c&&c.loyer||'—')+'</b></div><div><small>Charges contrat</small><b>'+esc(c&&c.charges||'—')+'</b></div>'+
      '<div><small>Caution</small><b>'+esc(c&&c.caution||'—')+'</b></div><div><small>Honoraires</small><b>'+esc(c&&c.honor||'—')+'</b></div>'+
      '<div class="full"><small>Prochain paiement</small><b>'+esc(c&&(c.prochain||c.prochainPaiement)||'—')+'</b></div>'+
      '<div class="full"><small>Observations</small><b>'+esc(c&&c.obs||'—')+'</b></div>'+
      '</div></div>'+
      '<div class="gp-ul-detail-card"><h4>Documents du locataire</h4><div class="gp-ul-detail-docs">'+docHtml+'</div></div>'+
      '</div>';
    var overlay=document.createElement('div');overlay.className='gp-ul-overlay';overlay.id='gpUlOverlay';
    overlay.innerHTML='<div class="gp-ul-drawer"><div class="gp-ul-dhead"><div><h3>'+esc(l.bien||l.nom||'Location')+'</h3><div style="font-size:11px;color:#64748b">Fiche de location</div></div><button class="gp-ul-icon" onclick="window.gpUL.close()"><span class="material-symbols-rounded">close</span></button></div>'+body+'<div class="gp-ul-footer"><button class="gp-ul-btn" onclick="window.gpUL.close()">Fermer</button>'+(c&&typeof window.generateContratPDF==='function'?'<button class="gp-ul-btn" onclick="window.generateContratPDF('+((d.contrats||[]).indexOf(c))+')"><span class="material-symbols-rounded">description</span>Voir le contrat</button>':'')+'<button class="gp-ul-btn primary" onclick="window.gpUL.close();setTimeout(function(){window.gpUL.edit('+idx+')},30)"><span class="material-symbols-rounded">edit</span>Modifier</button></div></div>';
    p.appendChild(overlay);
  }
  function openNew(){var p=pageShell();if(!p)return;var holder=document.createElement('div');holder.innerHTML=formHtml(-1);p.appendChild(holder.firstElementChild);state.editIndex=-1;}
  function edit(idx){var p=pageShell();if(!p)return;var holder=document.createElement('div');holder.innerHTML=formHtml(idx);p.appendChild(holder.firstElementChild);state.editIndex=idx;}
  function close(){var o=$('gpUlOverlay');if(o)o.remove();state.editIndex=-1;}
  function toggleTenant(){var n=$('ul-new-tenant')&&$('ul-new-tenant').checked;if($('ul-existing-tenant'))$('ul-existing-tenant').style.display=n?'none':'block';if($('ul-new-tenant-form'))$('ul-new-tenant-form').style.display=n?'block':'none';}
  function toggleContract(){var on=$('ul-contract')&&$('ul-contract').checked;if($('ul-contract-form'))$('ul-contract-form').style.display=on?'block':'none';}
  function validate(d){var errors=[];if(!$('ul-bien')||!$('ul-bien').value)errors.push(['ul-bien','Le bien est requis']);if(!$('ul-date-entree')||!$('ul-date-entree').value)errors.push(['ul-date-entree','La date d’entrée est requise']);var newT=$('ul-new-tenant')&&$('ul-new-tenant').checked;if(newT){[['ul-t-prenom','Le prénom du locataire est requis'],['ul-t-nom','Le nom du locataire est requis'],['ul-t-tel','Le téléphone du locataire est requis'],['ul-t-adresse','L’adresse du locataire est requise']].forEach(function(x){if(!$(x[0])||!$(x[0]).value.trim())errors.push(x);});}else if(!$('ul-tenant')||!$('ul-tenant').value)errors.push(['ul-tenant','Le locataire est requis']);var contract=$('ul-contract')&&$('ul-contract').checked;if(contract){if(!$('ul-c-debut').value)errors.push(['ul-c-debut','La date de début du contrat est requise']);if(!$('ul-c-loyer').value||amount($('ul-c-loyer').value)<=0)errors.push(['ul-c-loyer','Le loyer doit être supérieur à 0']);var debut=$('ul-c-debut').value,fin=$('ul-c-fin').value;if(fin&&debut&&new Date(fin)<=new Date(debut))errors.push(['ul-c-fin','La date de fin doit être après la date de début']);}if(errors.length){var e=errors[0],el=$(e[0]);if(el)el.focus();toast(e[1],'err');return false;}return true;}
  async function saveForm(){
    var btn=$('gpUlSave');if(btn&&btn.disabled)return;if(!validate())return;
    var d=db();if(window.GPRelationsV52)window.GPRelationsV52.ensure(d);
    var idx=state.editIndex,old=idx>=0?(d.locatives||[])[idx]||{}:{};
    var sel=$('ul-bien'),opt=sel&&sel.options&&sel.options[sel.selectedIndex];
    var bienId=String((opt&&opt.dataset&&opt.dataset.bienId)||old.bienId||old.propertyId||'');
    var unitId=String((opt&&opt.dataset&&opt.dataset.unitId)||old.uniteId||old.unitId||'');
    var bien=(d.biens||[]).find(function(b){return String(b.id)===bienId;});
    if(!bien){toast('Le bien sélectionné est introuvable.','err');return;}
    var unit=(Array.isArray(bien.unites)?bien.unites:[]).find(function(u){return String(u.id)===unitId;})||null;
    if(!unit&&Array.isArray(bien.unites)&&bien.unites.length>1){toast('L’unité du bien est requise.','err');return;}
    var propertyLabel=(opt&&opt.dataset&&opt.dataset.label)||[bien.nom,unit&&unit.nom].filter(Boolean).join(' - ')||bien.nom;
    var newT=$('ul-new-tenant')&&$('ul-new-tenant').checked,pendingTenantDocs=[];try{pendingTenantDocs=await collectTenantDocuments();}catch(e){return;}
    var tenantNameValue='';
    if(newT){var prenom=$('ul-t-prenom').value.trim(),nom=$('ul-t-nom').value.trim();tenantNameValue=(prenom+' '+nom).trim();var existing=findTenant(d,tenantNameValue);if(existing&&(!old.locataireId||String(existing.id)!==String(old.locataireId))){toast('Un locataire portant ce nom existe déjà. Sélectionnez-le au lieu de créer un doublon.','err');return;}}else tenantNameValue=$('ul-tenant').value.trim();
    if(!tenantNameValue){toast('Le locataire est requis','err');return;}
    if(btn){btn.disabled=true;btn.innerHTML='<span class="material-symbols-rounded">hourglass_top</span>Enregistrement…';}
    try{
      if(!Array.isArray(d.locatives))d.locatives=[];if(!Array.isArray(d.locataires))d.locataires=[];if(!Array.isArray(d.contrats))d.contrats=[];
      var tenant;if(newT){tenant={id:window.genId?genId('LC'):('LC-'+Date.now()),prenom:$('ul-t-prenom').value.trim(),nom:$('ul-t-nom').value.trim(),profession:$('ul-t-profession').value.trim(),tel:$('ul-t-tel').value.trim(),email:$('ul-t-email').value.trim(),adresse:$('ul-t-adresse').value.trim(),type:$('ul-t-type').value,statut:'Actif',date:today()};d.locataires.push(tenant);}else tenant=findTenant(d,tenantNameValue);
      if(!tenant){toast('Locataire introuvable.','err');return;}
      var tenantFull=tenantName(tenant),tenantIndex=d.locataires.indexOf(tenant);attachTenantDocuments(d,tenant,tenantIndex,pendingTenantDocs);
      var status=$('ul-statut').value||'Loué',cEnabled=$('ul-contract').checked,currentContract=(d.contrats||[]).find(function(c){return String(c.locationId||c.locativeId||'')===String(old.id||'');})||(idx>=0?(d.contrats||[]).find(function(c){var cl=String(c.locationId||c.locativeId||'');return !(d.locatives||[]).some(function(l){return String(l.id)===cl;})&&String(c.uniteId||c.unitId||'')===String(old.uniteId||old.unitId||'')&&String(c.locataireId||c.tenantId||'')===String(old.locataireId||old.tenantId||'');}):null);
      var duplicate=(d.contrats||[]).some(function(c){if(c===currentContract||!window.GPRelationsV52.isActiveStatus(c.statut))return false;return String(c.bienId||c.propertyId||'')===bienId&&(!unitId||String(c.uniteId||c.unitId||'')===unitId);});
      if(cEnabled&&status==='Loué'&&duplicate){toast('Cette unité est déjà occupée par un contrat actif.','err');return;}
      var loc={...(old||{}),id:old.id||(window.genId?genId('LOC'):('LOC-'+Date.now())),nom:'Location - '+propertyLabel,bien:propertyLabel,parentBien:bien.nom,bienId:bien.id,propertyId:bien.id,proprietaireId:bien.proprietaireId||bien.proprioId||'',uniteId:unit?unit.id:bien.id,unitId:unit?unit.id:bien.id,uniteNom:unit?unit.nom:bien.nom,locataire:tenantFull,occupant:tenantFull,locataireId:tenant.id,tenantId:tenant.id,dateEntree:$('ul-date-entree').value,statut:cEnabled?status:'En attente',loyer:cEnabled?money(amount($('ul-c-loyer').value)):(old.loyer||''),charge:cEnabled?money(amount($('ul-c-charges').value)):(old.charge||''),updatedAt:new Date().toISOString()};
      if(idx>=0)d.locatives[idx]=loc;else d.locatives.push(loc);
      if(cEnabled){var c={...(currentContract||{}),id:(currentContract&&currentContract.id)||(window.genId?genId('CT'):('CT-'+Date.now())),num:$('ul-c-num').value.trim(),locataire:tenantFull,locataireId:tenant.id,tenantId:tenant.id,locationId:loc.id,locativeId:loc.id,locative:loc.nom,bien:bien.nom,bienId:bien.id,propertyId:bien.id,proprietaireId:bien.proprietaireId||bien.proprioId||'',uniteId:loc.uniteId,unitId:loc.unitId,uniteNom:loc.uniteNom,type:$('ul-c-type').value,sign:$('ul-c-sign').value||$('ul-c-debut').value,debut:$('ul-c-debut').value,fin:$('ul-c-fin').value,statut:status==='Loué'?'Actif':(status==='Terminé'?'Terminé':'En attente'),prochain:$('ul-c-prochain').value||$('ul-c-debut').value,jourEcheance:(function(){var v=$('ul-c-prochain').value||$('ul-c-debut').value,m=/^\d{4}-\d{2}-(\d{2})/.exec(v||'');return m?String(+m[1]):'';})(),loyer:money(amount($('ul-c-loyer').value)),charges:money(amount($('ul-c-charges').value)),caution:money(amount($('ul-c-caution').value)),honor:money(amount($('ul-c-honor').value)),frais:'0 FCFA',obs:$('ul-c-obs').value.trim()||'Néant',updatedAt:new Date().toISOString()};var ci=currentContract?d.contrats.indexOf(currentContract):-1;if(ci>=0)d.contrats[ci]=c;else d.contrats.push(c);}else if(currentContract){currentContract.statut='Terminé';currentContract.updatedAt=new Date().toISOString();}
      if(Array.isArray(bien.unites)&&unit){unit.locataireId=tenant.id;unit.locataire=tenantFull;unit.loyer=loc.loyer;unit.statut=cEnabled&&status==='Loué'?'Loué':'Disponible';}
      if(window.GPRelationsV52)window.GPRelationsV52.ensure(d);
      if(typeof window.auditLog==='function')window.auditLog(idx>=0?'Modification':'Ajout','Locations',tenantFull+' — '+propertyLabel);
      var ok=await save(d);if(ok===false){toast('La sauvegarde a été refusée car les données ont changé ailleurs. Recharge la page avant de réessayer.','err');return;}
      close();renderList();if(typeof window.renderBiensFinal==='function')window.renderBiensFinal();try{if(window.GPEncV2&&GPEncV2.render)GPEncV2.render();if(typeof window.renderAvenir==='function')window.renderAvenir();}catch(_){}if(typeof window.updateSidebarBadges==='function')window.updateSidebarBadges();toast(idx>=0?'Location mise à jour ✓':'Location créée avec succès ✓');
    }catch(e){console.error('[GP Unified Locations]',e);toast('Impossible d’enregistrer la location : '+(e.message||e),'err');}finally{if(btn){btn.disabled=false;btn.innerHTML='<span class="material-symbols-rounded">save</span>Enregistrer';}}
  }
  function search(q){state.q=q||'';renderList();var el=document.querySelector('.gp-ul-search');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
  function filter(v){state.status=v||'';renderList();}
  function openFocus(f){state.focus=f;renderList();toast(f==='tenants'?'Les locataires sont gérés depuis chaque fiche de location.':'Les contrats sont gérés depuis chaque fiche de location.');}
  function init(){pageShell();if(window.GPNavigation&&window.GPNavigation.registerRenderer)window.GPNavigation.registerRenderer('locatives',renderList);var oldNav=window.navigate;function unifiedNav(page){if(page==='nv-locative'){renderList();openNew();return 'nv-locative';}if(page==='locataires'){return oldNav?oldNav.apply(window,arguments):undefined;}if(page==='contrats'){renderList();openFocus('contracts');return 'locatives';}return oldNav?oldNav.apply(window,arguments):undefined;}unifiedNav.__gpUnifiedLocations=true;window.navigate=unifiedNav;if(window.GPNavigation){window.GPNavigation.navigate=unifiedNav;window.GPNavigation.go=unifiedNav;}renderList();}
  window.gpUL={render:renderList,openNew:openNew,edit:edit,view:detail,close:close,save:saveForm,toggleTenant:toggleTenant,toggleContract:toggleContract,search:search,filter:filter,openFocus:openFocus};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ===== consolidated: unified-workflow-v5.js ===== */
/* Genius Property V5 — cohérence des parcours métier
 * - Location = point d'entrée unique pour locataire + contrat.
 * - Paiement = rattaché à une location; locataire/bien sont dérivés.
 * - Anciennes routes locataires/contrats redirigent vers Locations.
 * - Bloque les anciens drawers/formulaires qui pourraient reprendre la main.
 */
(function(){
  'use strict';
  function db(){ return window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB||{}); }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function name(t){return t ? String([t.prenom,t.nom].filter(Boolean).join(' ')||t.nom||t.prenom||'').trim() : '';}
  function locationByName(v){var ds=db(), a=Array.isArray(ds.locatives)?ds.locatives:[];return a.find(function(x){return String(x.nom||'')===String(v||'');})||null;}
  function forceLocationEntry(){
    if(window.gpUL && typeof window.gpUL.openNew==='function') { window.gpUL.openNew(); return true; }
    return false;
  }
  function routeLegacy(page){
    /* Locataires possède sa propre page de consultation. Seuls les anciens parcours
       Contrats/Nouveau locataire restent redirigés vers Location. */
    if(page==='contrats'||page==='nv-locataire'||page==='nv-contrat'){
      if(window.gpUL && typeof window.gpUL.render==='function') window.gpUL.render();
      if(window.gpUL && typeof window.gpUL.openFocus==='function') window.gpUL.openFocus(page.indexOf('contrat')>=0?'contracts':'tenants');
      return 'locatives';
    }
    if(page==='nv-locative'){forceLocationEntry();return 'nv-locative';}
    return null;
  }
  function patchNavigation(){
    var old=window.navigate;
    if(old && old.__gpV5) return;
    function nav(page){var r=routeLegacy(page);if(r!==null)return r;return old?old.apply(window,arguments):undefined;}
    nav.__gpV5=true;window.navigate=nav;
    if(window.GPNavigation){window.GPNavigation.navigate=nav;window.GPNavigation.go=nav;}
  }
  function hideLegacyPages(){
    ['page-contrats','page-nv-locataire','page-nv-contrat'].forEach(function(id){var el=document.getElementById(id);if(el)el.setAttribute('data-gp-legacy-hidden','1');});
    var style=document.getElementById('gp-v5-legacy-style');
    if(!style){style=document.createElement('style');style.id='gp-v5-legacy-style';style.textContent='[data-gp-legacy-hidden="1"]{display:none!important}';document.head.appendChild(style);}
  }
  function cleanLocationPage(){
    var p=document.getElementById('page-locatives'); if(!p)return;
    p.querySelectorAll('button,a').forEach(function(el){
      var txt=(el.textContent||'').trim().toLowerCase();
      var onclick=el.getAttribute('onclick')||'';
      if(txt==='locataires'||txt==='contrats'||/navigate\(['"](?:locataires|contrats)['"]\)/.test(onclick)) el.style.display='none';
    });
  }
  function patchPaymentModal(){
    var field=document.getElementById('pay-locataire');
    if(field){
      var wrap=field.closest('.fg');
      if(wrap){wrap.setAttribute('data-gp-derived-field','locataire');wrap.style.display='none';}
    }
    var locLabel=document.querySelector('label[for="pay-locative"]');
    if(locLabel) locLabel.textContent='Location *';
    var sl=document.getElementById('pay-locative');
    if(!sl || sl.__gpV5) return;
    sl.__gpV5=true;
    sl.addEventListener('change',function(){
      var l=locationByName(sl.value); if(!l)return;
      var tenant=String(l.locataire||l.occupant||'');
      var hidden=document.getElementById('pay-locataire');
      if(hidden){
        var ds=db(),ts=Array.isArray(ds.locataires)?ds.locataires:[];
        var found=ts.find(function(t){return name(t)===tenant;});
        hidden.innerHTML='<option value="'+esc(tenant)+'">'+esc(tenant)+'</option>';hidden.value=tenant;
      }
      if(typeof window.syncPayModalFromLocative==='function') window.syncPayModalFromLocative();
    });
  }
  function patchPaymentOpen(){
    var old=window.openPayModal;
    if(typeof old!=='function' || old.__gpV5)return;
    function open(){old.apply(window,arguments);setTimeout(function(){
      patchPaymentModal();
      var sl=document.getElementById('pay-locative');
      if(sl && sl.options.length===2 && sl.options[1].value) { sl.value=sl.options[1].value; sl.dispatchEvent(new Event('change',{bubbles:true})); }
    },0);}
    open.__gpV5=true;window.openPayModal=open;
  }
  function patchPaymentValidation(){
    var old=window.validatePaiementForm;
    if(typeof old!=='function'||old.__gpV5)return;
    function validate(){
      var loc=document.getElementById('pay-locative'), tenant=document.getElementById('pay-locataire');
      if(loc&&loc.value&&tenant){var l=locationByName(loc.value);if(l){var n=String(l.locataire||l.occupant||'');tenant.innerHTML='<option value="'+esc(n)+'">'+esc(n)+'</option>';tenant.value=n;}}
      return old.apply(window,arguments);
    }
    validate.__gpV5=true;window.validatePaiementForm=validate;
  }
  function install(){
    patchNavigation();hideLegacyPages();cleanLocationPage();patchPaymentModal();patchPaymentOpen();patchPaymentValidation();
    setTimeout(function(){hideLegacyPages();cleanLocationPage();patchPaymentModal();patchPaymentOpen();patchPaymentValidation();},300);
    setTimeout(function(){hideLegacyPages();cleanLocationPage();},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
  window.GPV5={install:install};
})();


/* ===== consolidated: workflow-stability-v6.js ===== */
/* Genius Property V6 — workflow stability
 * Single-purpose navigation + coherent creation forms.
 * Loaded last on purpose: this is the final interaction layer.
 */
(function(){
  'use strict';

  function db(){
    try { return window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}); }
    catch(e){ return window.DB || {}; }
  }
  async function save(d){
    window.DB=d;
    if(window.GPDB && typeof window.GPDB.save==='function') return window.GPDB.save(d);
    if(typeof window.saveDB==='function') return window.saveDB();
  }
  function toast(msg,type){ if(typeof window.toast==='function') window.toast(msg,type); else if(type==='err') alert(msg); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function uid(prefix){ return typeof window.genId==='function' ? window.genId(prefix) : prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7); }
  function activate(page){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
    var el=document.getElementById('page-'+page); if(el) el.classList.add('active');
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){li.classList.toggle('active',li.dataset.page===page);});
    window.GP_CURRENT_PAGE=page;
    try{localStorage.setItem('gp_last_page',page);}catch(_){ }
  }

  function resetBienForm(){
    ['b-nom','b-valeur','b-adresse','b-nb-appart'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    ['b-vente','b-type','b-proprio'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    var et=document.getElementById('b-etat');if(et)et.value='Neuf';
    var st=document.getElementById('b-statut');if(st)st.value='Disponible';
    var img=document.getElementById('b-photo-preview');if(img){img.src='';img.style.display='none';}
    var icon=document.getElementById('b-photo-icon');if(icon)icon.style.display='';
    var label=document.getElementById('b-photo-label');if(label)label.textContent='Ajouter une photo';
    var file=document.getElementById('b-photo-input');if(file)file.value='';
    if(typeof window.fillProprioBien==='function') window.fillProprioBien();
    if(typeof window.onBienTypeChange==='function') window.onBienTypeChange();
  }

  function fallbackTenantDrawer(){
    var old=document.getElementById('gpV6TenantOverlay');if(old)old.remove();
    var html='<div id="gpV6TenantOverlay" style="position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:100000;display:flex;justify-content:flex-end">'+
      '<section style="width:min(520px,96vw);height:100%;background:#fff;box-shadow:-12px 0 40px rgba(15,23,42,.18);display:flex;flex-direction:column">'+
      '<header style="padding:18px 20px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:18px">Nouveau locataire</b><div style="font-size:12px;color:#64748b;margin-top:3px">Créer le locataire sans quitter votre parcours</div></div><button type="button" data-gp-v6-close style="border:0;background:#f3f4f6;border-radius:8px;width:34px;height:34px;cursor:pointer">×</button></header>'+ 
      '<div style="padding:20px;overflow:auto;display:grid;gap:14px">'+
      '<div><label>Prénom *</label><input id="gpV6TFirst" style="width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px"></div>'+ 
      '<div><label>Nom *</label><input id="gpV6TLast" style="width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px"></div>'+ 
      '<div><label>Téléphone *</label><input id="gpV6TPhone" style="width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px"></div>'+ 
      '<div><label>Email</label><input id="gpV6TEmail" type="email" style="width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px"></div>'+ 
      '<div><label>Adresse *</label><input id="gpV6TAddress" style="width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px"></div>'+ 
      '<div><label>Profession</label><input id="gpV6TJob" style="width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px"></div>'+ 
      '</div><footer style="padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px"><button type="button" data-gp-v6-close style="height:40px;padding:0 16px;border:1px solid #d1d5db;background:#fff;border-radius:8px">Annuler</button><button type="button" id="gpV6TSave" style="height:40px;padding:0 18px;border:0;background:#2563eb;color:#fff;border-radius:8px;font-weight:700">Enregistrer</button></footer></section></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    var root=document.getElementById('gpV6TenantOverlay');
    root.querySelectorAll('[data-gp-v6-close]').forEach(function(b){b.onclick=function(){root.remove();};});
    root.querySelector('#gpV6TSave').onclick=async function(){
      var first=root.querySelector('#gpV6TFirst').value.trim(), last=root.querySelector('#gpV6TLast').value.trim(), phone=root.querySelector('#gpV6TPhone').value.trim(), address=root.querySelector('#gpV6TAddress').value.trim();
      if(!first)return toast('Le prénom est requis','err'); if(!last)return toast('Le nom est requis','err'); if(!phone)return toast('Le téléphone est requis','err'); if(!address)return toast("L'adresse est requise",'err');
      var d=db(); if(!Array.isArray(d.locataires))d.locataires=[];
      var key=(first+' '+last).toLowerCase().replace(/\s+/g,' ').trim();
      var exists=d.locataires.find(function(t){return ([t.prenom,t.nom].filter(Boolean).join(' ')).toLowerCase().replace(/\s+/g,' ').trim()===key;});
      if(exists){toast('Ce locataire existe déjà.','err');return;}
      var rec={id:uid('LC'),prenom:first,nom:last,tel:phone,email:root.querySelector('#gpV6TEmail').value.trim(),adresse:address,profession:root.querySelector('#gpV6TJob').value.trim(),bien:'-',type:'Particulier',date:new Date().toISOString().slice(0,10),statut:'Actif'};
      this.disabled=true; this.textContent='Enregistrement…';
      try{await save(d);if(window.auditLog)window.auditLog('Ajout','Locataires','Nouveau locataire : '+first+' '+last);root.remove();toast('Locataire enregistré avec succès ✓');window.dispatchEvent(new CustomEvent('gp:tenant-created',{detail:rec}));}catch(e){this.disabled=false;this.textContent='Enregistrer';toast('Impossible d’enregistrer le locataire','err');}
    };
    setTimeout(function(){var e=root.querySelector('#gpV6TFirst');if(e)e.focus();},50);
  }

  function openTenant(){
    try{
      if(typeof window.openNouvelLocataireDrawer==='function' && !window.openNouvelLocataireDrawer.__gpV6){ window.openNouvelLocataireDrawer(); return; }
    }catch(e){}
    fallbackTenantDrawer();
  }

  function locationDrawer(){
    if(typeof window.openGpDrawer!=='function') return false;
    // Reuse the existing drawer but make the tenant choice explicit and allow inline creation.
    window.openGpDrawer('locative');
    setTimeout(function(){
      var select=document.getElementById('gp-l-locataire');
      if(!select)return;
      if(select.__gpV6)return;
      select.__gpV6=true;
      var wrap=select.closest('.gp-field');
      if(!wrap)return;
      var btn=document.createElement('button');btn.type='button';btn.textContent='+ Nouveau locataire';btn.style.cssText='margin-top:6px;border:0;background:none;color:#2563eb;font-weight:700;cursor:pointer;padding:0';
      btn.onclick=function(){
        openTenant();
        window.addEventListener('gp:tenant-created',function handler(e){
          window.removeEventListener('gp:tenant-created',handler);
          var t=e.detail;if(!t)return;
          var opt=document.createElement('option');opt.value=[t.prenom,t.nom].join(' ');opt.textContent=opt.value+' — '+t.tel;opt.dataset.tel=t.tel;select.appendChild(opt);select.value=opt.value;select.dispatchEvent(new Event('change',{bubbles:true}));
        },{once:true});
      };
      wrap.appendChild(btn);
      var note=document.createElement('small');note.textContent='Ou créez le locataire directement ici.';note.style.cssText='display:block;color:#64748b;margin-top:4px';wrap.appendChild(note);
    },30);
    return true;
  }

  function stableNavigate(page){
    if(page==='nv-locataire'){openTenant();return page;}
    if(page==='locataires'){activate('locataires');setTimeout(function(){if(typeof window.renderLocatairesModern==='function')window.renderLocatairesModern(true);else if(typeof window.renderLocataires==='function')window.renderLocataires();},0);return 'locataires';}
    if(page==='contrats'||page==='nv-contrat'){activate('locatives');setTimeout(function(){if(window.gpUL&&typeof window.gpUL.openFocus==='function')window.gpUL.openFocus('contracts');},0);return 'locatives';}
    if(page==='biens'){activate('biens');if(typeof window.renderBiensFinal==='function')window.renderBiensFinal();return page;}
    if(page==='nv-bien'){
      activate('biens');
      setTimeout(function(){
        if(typeof window.renderBiensFinal==='function')window.renderBiensFinal();
        setTimeout(function(){activate('nv-bien');if(window.GPV10&&window.GPV10.renderBien)window.GPV10.renderBien(null);},20);
      },0);
      return page;
    }
    if(page==='nv-locative'){activate('locatives');setTimeout(function(){if(window.gpUL&&typeof window.gpUL.openNew==='function')window.gpUL.openNew();else locationDrawer();},20);return page;}
    if(page==='locatives'){activate('locatives');if(typeof window.renderLocativesFinal==='function')window.renderLocativesFinal();else if(window.gpUL&&typeof window.gpUL.render==='function')window.gpUL.render();return page;}
    return null;
  }

  var oldNavigate=window.navigate;
  function navigate(page){
    var handled=stableNavigate(page);if(handled!==null){window.GP_CURRENT_PAGE=handled;try{localStorage.setItem('gp_last_page',handled);}catch(_){ }return handled;}
    return typeof oldNavigate==='function'?oldNavigate.apply(window,arguments):undefined;
  }
  navigate.__gpV6=true;
  window.navigate=navigate;
  if(window.GPNavigation){window.GPNavigation.navigate=navigate;window.GPNavigation.go=navigate;}

  // Capture dynamically rendered buttons too; this prevents older inline handlers from becoming dead ends.
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('button,a');if(!b)return;
    var text=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    var oc=b.getAttribute('onclick')||'';
    if(text.indexOf('nouveau locataire')>=0 || /navigate\(['"]nv-locataire['"]\)/.test(oc)){
      e.preventDefault();e.stopImmediatePropagation();openTenant();return;
    }
    if(text==='nouveau bien' || text==='ajouter un bien' || /navigate\(['"]nv-bien['"]\)/.test(oc)){
      e.preventDefault();e.stopImmediatePropagation();navigate('nv-bien');return;
    }
  },true);

  window.GPWorkflowV6={navigate:navigate,openTenant:openTenant,resetBienForm:resetBienForm};
})();


/* ===== consolidated: forms-v10-clean.js ===== */
/* V10 CLEAN FORMS
 * The only forms for Biens and Propriétaires.
 * Old HTML forms are removed from index.html; this module owns create/edit.
 */
(function(){
  'use strict';
  var state={ownerId:null,bienId:null,ownerPhotoCleared:false,bienPhotoCleared:false};
  function db(){try{return window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});}catch(e){return window.DB||{};}}
  async function save(d){window.DB=d;if(window.GPDB&&GPDB.save)return await GPDB.save(d);if(window.saveDB)return await window.saveDB();try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){}return true;}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function val(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';}
  function moneyNumber(v){var n=Number(String(v==null?'':v).replace(/[^0-9,.-]/g,'').replace(',','.'));return Number.isFinite(n)?n:null;}
  function id(prefix){return window.genId?window.genId(prefix):prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);}
  function notify(msg,type){if(window.notify)window.notify(msg,type||'ok');else if(window.toast)window.toast(msg,type||'ok');}
  function navigate(p){if(typeof window.navigate==='function' && !window.navigate.__v10) return window.navigate(p);if(window.GPNavigation&&typeof window.GPNavigation.navigate==='function')return window.GPNavigation.navigate(p);}
  function installCss(){if(document.getElementById('gp10-css'))return;var s=document.createElement('style');s.id='gp10-css';s.textContent=`
    .gp10{padding:24px}.gp10-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.gp10-title{font-size:21px;font-weight:850;color:#111827}.gp10-sub{font-size:12px;color:#64748b;margin-top:4px}.gp10-badge{font-size:10px;font-weight:800;padding:6px 10px;border-radius:999px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0}.gp10-grid{display:grid;grid-template-columns:280px minmax(0,1fr);gap:16px;align-items:start}.gp10-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px;box-shadow:0 2px 8px rgba(15,23,42,.04)}.gp10-card h3{font-size:13px;margin:0 0 14px;color:#111827}.gp10-fields{display:grid;grid-template-columns:1fr 1fr;gap:13px}.gp10-field.full{grid-column:1/-1}.gp10-field label{display:block;font-size:11px;font-weight:750;color:#475569;margin-bottom:6px}.gp10-field label span{color:#dc2626}.gp10-field input,.gp10-field select,.gp10-field textarea{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:9px;padding:10px 11px;font-size:13px;color:#111827;background:#fff;outline:none}.gp10-field input:focus,.gp10-field select:focus,.gp10-field textarea:focus{border-color:#c9a227;box-shadow:0 0 0 3px rgba(212,175,55,.12)}.gp10-field textarea{min-height:88px;resize:vertical}.gp10-photo{height:230px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;overflow:hidden;cursor:pointer}.gp10-photo img{width:100%;height:100%;object-fit:cover}.gp10-photo .material-symbols-rounded{font-size:48px;color:#cbd5e1}.gp10-photo small{font-size:11px;color:#94a3b8}.gp10-photo-actions{display:flex;justify-content:center;gap:7px;margin-top:9px}.gp10-btn{border:1px solid #e2e8f0;background:#fff;color:#334155;border-radius:9px;padding:9px 13px;font-size:12px;font-weight:750;cursor:pointer}.gp10-btn:hover{background:#f8fafc}.gp10-btn.primary{background:#111827;border-color:#111827;color:#fff}.gp10-btn.danger{color:#b91c1c}.gp10-actions{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #eef2f7;margin-top:18px;padding-top:15px}.gp10-note{font-size:10px;color:#94a3b8;line-height:1.5;margin-top:9px}.gp10-related{margin-top:10px;padding:10px;border-radius:9px;background:#f8fafc;font-size:11px;color:#64748b}.gp10-related button{margin-left:5px;border:0;background:none;color:#2563eb;font-weight:700;cursor:pointer}.gp10-drawer{width:min(760px,100%);display:flex;flex-direction:column}.gp10-dbody{flex:1;overflow:auto;background:#fff}.gp10-dbody .gp10{padding:18px}.gp10-dbody .gp10-head{display:none}.gp10-dbody .gp10-grid{grid-template-columns:220px minmax(0,1fr)}.gp10-dbody .gp10-card{box-shadow:none}.gp10-dbody .gp10-actions{position:sticky;bottom:0;background:#fff;padding:14px 0 2px;margin-top:16px;z-index:3}.gp10-drawer .gp-ul-dhead{flex:none}.gp10-drawer .gp10-photo{height:210px}@media(max-width:800px){.gp10-dbody .gp10-grid{grid-template-columns:1fr}}@media(max-width:800px){.gp10{padding:15px}.gp10-grid,.gp10-fields{grid-template-columns:1fr}.gp10-field.full{grid-column:auto}}
  `;document.head.appendChild(s);}
  function photoBlock(inputId,photo,icon,clearType){var content=photo?'<img src="'+esc(photo)+'" alt="">':'<span class="material-symbols-rounded">'+icon+'</span><small>Ajouter une photo</small>';return '<div class="gp10-photo" id="'+inputId+'Wrap" onclick="document.getElementById(\''+inputId+'\').click()">'+content+'<input id="'+inputId+'" type="file" accept="image/*" style="display:none"></div><div class="gp10-photo-actions"><button type="button" class="gp10-btn" onclick="event.stopPropagation();document.getElementById(\''+inputId+'\').click()">Choisir une photo</button><button type="button" class="gp10-btn danger" onclick="event.stopPropagation();GPV10.clearPhoto(\''+clearType+'\')">Supprimer</button></div>'}
  function bindPhoto(inputId,clearType){var el=document.getElementById(inputId);if(!el)return;el.onchange=function(){var f=el.files&&el.files[0];if(!f)return;if(f.size>12*1024*1024){notify('La photo ne doit pas dépasser 12 Mo','err');el.value='';return}var r=new FileReader();r.onload=function(e){var w=document.getElementById(inputId+'Wrap');if(!w)return;var img=w.querySelector('img');if(!img){img=document.createElement('img');img.alt='';w.insertBefore(img,el);}img.src=e.target.result||'';img.style.display='block';var icon=w.querySelector('.material-symbols-rounded');if(icon)icon.style.display='none';var small=w.querySelector('small');if(small)small.style.display='none';};r.readAsDataURL(f)};}
  function ownerForm(p){p=p||{};var mat=['','Célibataire','Marié','Divorcé','Veuf'].map(function(x){return '<option value="'+esc(x)+'" '+(p.matri===x?'selected':'')+'>'+esc(x||'Sélectionner')+'</option>'}).join('');return '<div class="gp10"><div class="gp10-head"><div><div class="gp10-title">'+(p.id?'Modifier le propriétaire':'Nouveau propriétaire')+'</div><div class="gp10-sub">Un seul formulaire pour créer ou modifier. Les informations existantes sont conservées.</div></div><span class="gp10-badge">'+(p.id?'MODIFICATION':'NOUVEAU')+'</span></div><div class="gp10-grid"><div class="gp10-card"><h3>Photo du propriétaire</h3>'+photoBlock('gp10-owner-photo',p.photo||'','person','owner')+'<div class="gp10-note">Si tu ne choisis pas de nouvelle photo lors d’une modification, l’ancienne est conservée.</div></div><div class="gp10-card"><h3>Informations</h3><div class="gp10-fields"><div class="gp10-field"><label>Nom <span>*</span></label><input id="gp10-owner-nom" value="'+esc(p.nom||'')+'" autocomplete="family-name"></div><div class="gp10-field"><label>Prénoms <span>*</span></label><input id="gp10-owner-prenom" value="'+esc(p.prenom||'')+'" autocomplete="given-name"></div><div class="gp10-field"><label>Téléphone <span>*</span></label><input id="gp10-owner-tel" value="'+esc(p.tel||p.telephone||'')+'" autocomplete="tel"></div><div class="gp10-field"><label>Email</label><input id="gp10-owner-email" type="email" value="'+esc(p.email||'')+'" autocomplete="email"></div><div class="gp10-field"><label>Date de naissance</label><input id="gp10-owner-naiss" type="date" value="'+esc(p.naiss||'')+'"></div><div class="gp10-field"><label>Statut matrimonial</label><select id="gp10-owner-matri">'+mat+'</select></div><div class="gp10-field full"><label>Adresse</label><input id="gp10-owner-adresse" value="'+esc(p.adresse||'')+'" autocomplete="street-address"></div><div class="gp10-field full"><label>Observations</label><textarea id="gp10-owner-obs">'+esc(p.observations||p.obs||'')+'</textarea></div></div><div class="gp10-actions"><button type="button" class="gp10-btn" onclick="navigate(\'proprietaires\')">Annuler</button><button type="button" class="gp10-btn primary" onclick="GPV10.saveOwner()">'+(p.id?'Enregistrer les modifications':'Créer le propriétaire')+'</button></div></div></div></div>'}
  function bienForm(b){b=b||{};var d=db(),props=Array.isArray(d.proprietaires)?d.proprietaires:[];var opts='<option value="">Sélectionner</option>'+props.map(function(p){var n=[p.prenom,p.nom].filter(Boolean).join(' ').trim();var stored=p.id||n;return '<option value="'+esc(stored)+'" '+((b.proprioId&&String(b.proprioId)===String(stored))||(!b.proprioId&&n===b.proprio)?'selected':'')+'>'+esc(n||p.nom||'Propriétaire')+'</option>'}).join('');var count=parseInt(b.nbAppart||0,10)||'';var types=['Immeuble','Appartement','Maison','Villa','Terrain','Local commercial','Bureau','Studio'];var states=['Neuf','Bon état','À rénover','En travaux'];return '<div class="gp10"><div class="gp10-head"><div><div class="gp10-title">'+(b.id?'Modifier le bien':'Nouveau bien')+'</div><div class="gp10-sub">Un seul formulaire pour créer ou modifier. Les unités et champs historiques sont conservés.</div></div><span class="gp10-badge">'+(b.id?'MODIFICATION':'NOUVEAU')+'</span></div><div class="gp10-grid"><div class="gp10-card"><h3>Photo du bien</h3>'+photoBlock('gp10-bien-photo',b.photo||'','home_work','bien')+'<div class="gp10-note">Sans nouvelle photo, la photo existante est conservée.</div></div><div class="gp10-card"><h3>Informations du bien</h3><div class="gp10-fields"><div class="gp10-field"><label>Nom du bien <span>*</span></label><input id="gp10-bien-nom" value="'+esc(b.nom||'')+'"></div><div class="gp10-field"><label>Destiné à la vente <span>*</span></label><select id="gp10-bien-vente"><option value="">Sélectionner</option><option '+(b.vente==='Oui'?'selected':'')+'>Oui</option><option '+(b.vente==='Non'?'selected':'')+'>Non</option></select></div><div class="gp10-field"><label>Type <span>*</span></label><select id="gp10-bien-type" onchange="GPV10.toggleUnits()"><option value="">Sélectionner</option>'+types.map(function(x){return '<option '+(b.type===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="gp10-field"><label>Propriétaire <span>*</span></label><select id="gp10-bien-proprio">'+opts+'</select>'+(!props.length?'<div class="gp10-related">Aucun propriétaire disponible. <button type="button" onclick="navigate(\'nv-proprietaire\')">Créer un propriétaire</button></div>':'')+'</div><div class="gp10-field" id="gp10-bien-units-wrap" style="display:'+(b.type==='Immeuble'?'block':'none')+'"><label>Nombre d’appartements <span>*</span></label><input id="gp10-bien-units" type="number" min="1" max="500" value="'+esc(count)+'"></div><div class="gp10-field"><label>Valeur <span>*</span></label><input id="gp10-bien-valeur" type="number" min="1" value="'+esc(moneyNumber(b.valeur)||'')+'"></div><div class="gp10-field"><label>État</label><select id="gp10-bien-etat">'+states.map(function(x){return '<option '+((b.etat||'Bon état')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="gp10-field"><label>Statut</label><select id="gp10-bien-statut">'+['Disponible','Loué','En attente'].map(function(x){return '<option '+((b.statut||'Disponible')===x?'selected':'')+'>'+x+'</option>'}).join('')+'</select></div><div class="gp10-field full"><label>Adresse</label><input id="gp10-bien-adresse" value="'+esc(b.adresse||'')+'"></div><div class="gp10-field full"><label>Observations</label><textarea id="gp10-bien-obs">'+esc(b.observations||b.obs||'')+'</textarea></div></div><div class="gp10-actions"><button type="button" class="gp10-btn" onclick="navigate(\'biens\')">Annuler</button><button type="button" class="gp10-btn primary" onclick="GPV10.saveBien()">'+(b.id?'Enregistrer les modifications':'Créer le bien')+'</button></div></div></div></div>'}
  function closeDrawer(){var ov=document.getElementById('gp10Drawer');if(ov)ov.remove();state.ownerId=null;state.bienId=null;state.ownerPhotoCleared=false;state.bienPhotoCleared=false;}
  function showDrawer(kind,idv){installCss();closeDrawer();var d=db(),isOwner=kind==='owner',arr=isOwner?(d.proprietaires||[]):(d.biens||[]),obj=idv?arr.find(function(x){return String(x.id)===String(idv)}):null;if(isOwner){state.ownerId=obj&&obj.id||null;state.ownerPhotoCleared=false;}else{state.bienId=obj&&obj.id||null;state.bienPhotoCleared=false;}var title=isOwner?(obj?'Modifier le propriétaire':'Nouveau propriétaire'):(obj?'Modifier le bien':'Nouveau bien');var sub=isOwner?'Tout est enregistré depuis cette fiche.':'Tout est enregistré depuis cette fiche.';var body=isOwner?ownerForm(obj):bienForm(obj);var ov=document.createElement('div');ov.id='gp10Drawer';ov.className='gp-ul-overlay';ov.innerHTML='<div class="gp-ul-drawer gp10-drawer"><div class="gp-ul-dhead"><div><h3>'+esc(title)+'</h3><div style="font-size:11px;color:#64748b">'+esc(sub)+'</div></div><button type="button" class="gp-ul-icon" aria-label="Fermer" onclick="GPV10.close()"><span class="material-symbols-rounded">close</span></button></div><div class="gp10-dbody">'+body+'</div></div>' ;document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)closeDrawer();});if(isOwner)bindPhoto('gp10-owner-photo','owner');else bindPhoto('gp10-bien-photo','bien');}
  function renderOwner(id){showDrawer('owner',id||null);}
  function renderBien(id){showDrawer('bien',id||null);}
  async function getPhoto(inputId){if(window.GPMedia&&typeof window.GPMedia.readImage==='function')return window.GPMedia.readImage(inputId);return new Promise(function(resolve){var e=document.getElementById(inputId);if(!e||!e.files||!e.files[0])return resolve('');var r=new FileReader();r.onload=function(){resolve(r.result||'')};r.onerror=function(){resolve('')};r.readAsDataURL(e.files[0]);});}
  async function saveOwner(){
    var d=db();
    d.proprietaires=Array.isArray(d.proprietaires)?d.proprietaires:[];
    var nom=val('gp10-owner-nom'),prenom=val('gp10-owner-prenom'),tel=val('gp10-owner-tel'),email=val('gp10-owner-email');
    if(!nom||!prenom)return notify('Nom et prénoms sont obligatoires','err');
    if(tel&&!/^[0-9+ ()-]{8,20}$/.test(tel))return notify('Numéro de téléphone invalide','err');
    if(email&&!/^\S+@\S+\.\S+$/.test(email))return notify('Adresse email invalide','err');
    var full=(prenom+' '+nom).trim().toLowerCase();
    if(d.proprietaires.some(function(p){return String(p.id)!==String(state.ownerId)&&((p.prenom||'')+' '+(p.nom||'')).trim().toLowerCase()===full}))return notify('Un propriétaire avec ce nom existe déjà','err');
    var old=d.proprietaires.find(function(p){return String(p.id)===String(state.ownerId)})||null;
    var photo=state.ownerPhotoCleared?'':await getPhoto('gp10-owner-photo');
    if(!state.ownerPhotoCleared && !photo && old)photo=old.photo||'';
    var o=old?Object.assign({},old):{id:id('PR'),createdAt:new Date().toISOString()};
    Object.assign(o,{nom:nom,prenom:prenom,tel:tel,email:email,naiss:val('gp10-owner-naiss'),matri:val('gp10-owner-matri'),adresse:val('gp10-owner-adresse'),observations:val('gp10-owner-obs'),photo:photo,updatedAt:new Date().toISOString()});
    var saved=false;
    try {
      if(window.GPDB&&typeof window.GPDB.commitRecord==='function') saved=window.GPDB.commitRecord('proprietaires',o.id,o);
      else saved=await save(Object.assign({},d,{proprietaires:d.proprietaires.map(function(p){return String(p.id)===String(o.id)?o:p;}).concat(old?[]:[o])}));
    } catch(e) { console.error('[GP Owner] save failed',e); saved=false; }
    if(!saved)return notify('La modification n’a pas été enregistrée. La base locale n’a pas confirmé cette écriture.','err');
    var fresh=db(), persisted=(fresh.proprietaires||[]).find(function(p){return String(p.id)===String(o.id)});
    if(!persisted||String(persisted.tel||'')!==String(o.tel||'')){return notify('La base locale n’a pas confirmé le nouveau téléphone. Aucune redirection effectuée.','err');}
    window.DB=fresh;
    if(window.auditLog)window.auditLog(old?'Modification':'Ajout','Propriétaires',(old?'Modification':'Nouveau')+' propriétaire : '+nom);
    if(window.renderProprietairesCards)window.renderProprietairesCards();
    if(window.fillProprioBien)window.fillProprioBien();
    notify(old?'Propriétaire modifié avec succès ✓':'Propriétaire créé avec succès ✓');
    closeDrawer();navigate('proprietaires');
  }
  async function saveBien(){
    var d=db();
    d.biens=Array.isArray(d.biens)?d.biens:[];
    var nom=val('gp10-bien-nom'),vente=val('gp10-bien-vente'),type=val('gp10-bien-type'),proprio=val('gp10-bien-proprio'),raw=val('gp10-bien-valeur');
    if(!nom||!vente||!type||!proprio||!raw)return notify('Veuillez remplir tous les champs obligatoires','err');
    var value=moneyNumber(raw);
    if(value===null||value<=0)return notify('La valeur doit être supérieure à 0','err');
    var duplicate=d.biens.some(function(b){return String(b.id)!==String(state.bienId)&&String(b.nom||'').trim().toLowerCase()===nom.toLowerCase()});
    if(duplicate)return notify('Un bien avec ce nom existe déjà','err');
    var count=type==='Immeuble'?parseInt(val('gp10-bien-units')||'0',10):0;
    if(type==='Immeuble'&&(count<1||count>500))return notify('Indiquez entre 1 et 500 appartements','err');
    var old=d.biens.find(function(b){return String(b.id)===String(state.bienId)})||null;
    var oldUnits=Array.isArray(old&&old.unites)?old.unites:[];
    if(type!=='Immeuble'&&oldUnits.length&&oldUnits.some(function(u){return u.locataire||/lou/i.test(String(u.statut||''))}))return notify('Impossible de supprimer les unités : certaines sont occupées','err');
    if(type==='Immeuble'&&oldUnits.length>count&&oldUnits.slice(count).some(function(u){return u.locataire||/lou/i.test(String(u.statut||''))}))return notify('Impossible de réduire les appartements : une unité est occupée','err');
    var photo=state.bienPhotoCleared?'':await getPhoto('gp10-bien-photo');
    if(!state.bienPhotoCleared && !photo && old)photo=old.photo||'';
    var b=old?Object.assign({},old):{id:id('BI'),createdAt:new Date().toISOString(),documents:[]};
    var ownerObj=(d.proprietaires||[]).find(function(p){return String(p.id)===String(proprio)});
    var ownerName=ownerObj?[ownerObj.prenom,ownerObj.nom].filter(Boolean).join(' ').trim():proprio;
    Object.assign(b,{nom:nom,vente:vente,type:type,proprio:ownerName,proprioId:ownerObj&&ownerObj.id||b.proprioId||'',valeur:Math.round(value).toLocaleString('fr-FR')+' FCFA',adresse:val('gp10-bien-adresse'),etat:val('gp10-bien-etat')||'Bon état',statut:val('gp10-bien-statut')||'Disponible',observations:val('gp10-bien-obs'),photo:photo,updatedAt:new Date().toISOString()});
    if(type==='Immeuble'){
      b.nbAppart=count;
      b.unites=Array.from({length:count},function(_,i){
        var u=oldUnits[i];
        return u?Object.assign({},u,{nom:u.nom||'Appartement '+(i+1)}):{id:id('UNT'),nom:'Appartement '+(i+1),statut:'Disponible',loyer:'',locataire:''};
      });
    }else{
      b.nbAppart='';
      if(oldUnits.length)delete b.unites;
    }
    var saved=false;
    try{
      if(window.GPDB&&typeof window.GPDB.commitRecord==='function'){
        saved=window.GPDB.commitRecord('biens',b.id,b);
      }else{
        var next=Object.assign({},d,{biens:d.biens.map(function(row){return String(row.id)===String(b.id)?b:row;})});
        if(!old)next.biens.push(b);
        saved=await save(next);
      }
    }catch(e){console.error('[GP Bien] save failed',e);saved=false;}
    if(!saved)return notify('La modification n’a pas été enregistrée. La base locale n’a pas confirmé cette écriture.','err');
    var fresh=db(),persisted=(fresh.biens||[]).find(function(row){return String(row.id)===String(b.id)});
    if(!persisted||String(persisted.nom||'')!==String(b.nom||'')||String(persisted.proprioId||'')!==String(b.proprioId||'')){
      return notify('La base locale n’a pas confirmé les nouvelles données du bien. Aucune redirection effectuée.','err');
    }
    window.DB=fresh;
    if(window.auditLog)window.auditLog(old?'Modification':'Ajout','Biens',(old?'Modification':'Nouveau')+' bien : '+nom);
    if(window.renderBiensCards)window.renderBiensCards(true);
    if(window.renderTable)window.renderTable('biens');
    if(window.updateSidebarBadges)window.updateSidebarBadges();
    notify(old?'Bien modifié avec succès ✓':'Bien créé avec succès ✓');
    closeDrawer();navigate('biens');
  }
  function open(page,idv){if(page==='nv-proprietaire'){showDrawer('owner',idv||null);return true}if(page==='nv-bien'){showDrawer('bien',idv||null);return true}return false;}
  function edit(key,idx){var d=db();if(key==='proprietaires'&&d.proprietaires&&d.proprietaires[idx])return open('nv-proprietaire',d.proprietaires[idx].id);if(key==='biens'&&d.biens&&d.biens[idx])return open('nv-bien',d.biens[idx].id);return false;}
  function install(){installCss();var oldNav=window.navigate;function nav(p){if(p==='nv-proprietaire'){showDrawer('owner',state.ownerId||null);return p}if(p==='nv-bien'){showDrawer('bien',state.bienId||null);return p}return oldNav?oldNav.apply(window,arguments):undefined}nav.__v10=true;window.navigate=nav;window.GPV10={renderOwner:renderOwner,renderBien:renderBien,saveOwner:saveOwner,saveBien:saveBien,close:closeDrawer,clearPhoto:function(which){var inputId=which==='owner'?'gp10-owner-photo':'gp10-bien-photo';var wrapId=inputId+'Wrap';var input=document.getElementById(inputId);if(input)input.value='';var wrap=document.getElementById(wrapId);if(wrap){var img=wrap.querySelector('img');if(img){img.remove();}var icon=wrap.querySelector('.material-symbols-rounded');if(icon){icon.style.display='';}else{icon=document.createElement('span');icon.className='material-symbols-rounded';icon.textContent=which==='owner'?'person':'home_work';wrap.insertBefore(icon,input||null);}var small=wrap.querySelector('small');if(small){small.style.display='';}else{small=document.createElement('small');small.textContent='Ajouter une photo';wrap.insertBefore(small,input||null);}}if(which==='owner'){state.ownerPhotoCleared=true;}else{state.bienPhotoCleared=true;}},toggleUnits:function(){var w=document.getElementById('gp10-bien-units-wrap');if(w)w.style.display=val('gp10-bien-type')==='Immeuble'?'block':'none'}};var oldEdit=window.editRow;window.editRow=function(key,idx){if(edit(key,idx))return true;return typeof oldEdit==='function'?oldEdit.apply(window,arguments):false};window.editProprietaireFromDetail=function(){var d=db(),i=window._proprietaireDetailIdx;if(d.proprietaires&&d.proprietaires[i])open('nv-proprietaire',d.proprietaires[i].id)};window.editBienFromDetail=function(){var d=db(),i=window._bienDetailIdx;if(d.biens&&d.biens[i])open('nv-bien',d.biens[i].id)};window.saveProprietaire=saveOwner;}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();


/* ===== consolidated: v14-live-refresh.js ===== */
/* Genius Property V14 — refresh UI after successful data writes.
 * Fix: a modification was persisted but the active list/detail renderer could
 * keep showing an older in-memory snapshot. The DB is now reloaded from the
 * authoritative local store after every GPDB save and the active domain page
 * is rendered again.
 */
(function(){
  'use strict';
  var scheduled = false;
  function freshDb(){
    try {
      if(window.GPDB && typeof window.GPDB.load === 'function') {
        var d = window.GPDB.load();
        window.DB = d;
        return d;
      }
    } catch(e) { console.warn('[V14] refresh DB load failed', e); }
    return window.DB || {};
  }
  function render(page){
    var d = freshDb();
    try {
      if(page === 'biens') {
        if(typeof window.renderBiensFinal === 'function') return window.renderBiensFinal();
      }
      if(page === 'proprietaires') {
        if(typeof window.renderProprietairesCards === 'function') return window.renderProprietairesCards();
        if(typeof window.renderTable === 'function') return window.renderTable('proprietaires');
      }
      if(page === 'locatives' || page === 'locations') {
        if(typeof window.renderLocativesFinal === 'function') return window.renderLocativesFinal();
        if(typeof window.renderLocatives === 'function') return window.renderLocatives();
      }
      if(page === 'contrats') {
        if(typeof window.renderContratsFinal === 'function') return window.renderContratsFinal();
        if(typeof window.renderContrats === 'function') return window.renderContrats();
      }
    } catch(e) { console.error('[V14] render failed for '+page, e); }
  }
  function activePage(){
    var p = window.GP_CURRENT_PAGE;
    if(p) return p;
    var el = document.querySelector('.page.active');
    return el && el.id ? el.id.replace(/^page-/, '') : '';
  }
  function refresh(){
    if(scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      var page = activePage();
      if(['biens','proprietaires','locatives','locations','contrats'].indexOf(page) !== -1) render(page);
    }, 0);
  }
  window.addEventListener('gp:db:saved', refresh);
  document.addEventListener('gp:navigation', function(ev){
    var p = ev && ev.detail && ev.detail.page;
    if(['biens','proprietaires','locatives','locations','contrats'].indexOf(p) !== -1) {
      setTimeout(function(){ render(p); }, 0);
    }
  });
  window.GPV14 = { refresh: refresh, render: render };
})();

