// V25 ultra compact stable - compact tables/icons
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m];});}
  function getDB(){return window.DB||{proprietaires:[],locataires:[],biens:[],employes:[]};}
  function nameOf(p){if(window.getProprietaireFullName)return window.getProprietaireFullName(p);return [p.prenom,p.nom].filter(Boolean).join(' ')||p.nom||p.email||'—';}
  function locName(l){if(window.locataireFullName)return window.locataireFullName(l);return [l.prenom,l.nom].filter(Boolean).join(' ')||l.nom||l.email||'—';}
  function propBiens(p){if(window.getProprietaireBiens)return window.getProprietaireBiens(p)||[];return []}
  function locBien(l){if(window.getLocataireBienLabel)return window.getLocataireBienLabel(l);return l.bien||l.logement||'—';}
  function safeDate(ts){if(!ts)return '—';try{return new Date(ts).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return '—';}}
  function initials(name){return (name||'?').split(' ').filter(Boolean).map(x=>x[0]||'').join('').slice(0,2).toUpperCase()||'?';}
  function injectCSS(){
    if(document.getElementById('v25-ultra-compact-css'))return;
    var s=document.createElement('style');s.id='v25-ultra-compact-css';
    s.textContent=`
      [data-page="sync"],#page-sync,.journal-agenda-integrated{display:none!important}
      .gpi-wrap{width:100%!important;overflow-x:auto!important;background:#fff!important;border:1px solid #e9edf3!important;border-radius:10px!important;box-shadow:0 4px 18px rgba(15,23,42,.045)!important;margin-top:6px!important}
      .gpi-table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;background:#fff!important;table-layout:auto!important;font-family:inherit!important}
      .gpi-table th{font-size:11px!important;text-transform:uppercase!important;letter-spacing:.045em!important;color:#475569!important;background:#f8fafc!important;border-bottom:1px solid #e9edf3!important;text-align:left!important;padding:6px 9px!important;white-space:nowrap!important;font-weight:800!important}
      .gpi-table td{font-size:11px!important;color:#111827!important;border-bottom:1px solid #f1f4f8!important;padding:6px 9px!important;white-space:nowrap!important;vertical-align:middle!important;line-height:1.2!important}
      .gpi-table tbody tr:hover{background:#fffaf0!important}.gpi-table tbody tr:last-child td{border-bottom:none!important}
      .gpi-person{display:flex!important;align-items:center!important;gap:5px!important;min-width:170px!important}.gpi-person b{font-size:11px!important;font-weight:800!important;display:block!important;max-width:160px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.gpi-person small{font-size:10px!important;color:#94a3b8!important;display:block!important;margin-top:2px!important}
      .gpi-avatar{width:24px!important;height:24px!important;border-radius:8px!important;background:#d4af37!important;color:#101827!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:9px!important;font-weight:900!important;flex:0 0 24px!important;line-height:1!important;text-transform:uppercase!important}
      .gpi-line{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important}.gpi-line .material-symbols-rounded{font-size:15px!important;width:15px!important;height:15px!important;line-height:15px!important;margin:0!important;color:#64748b!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important}
      .gpi-muted{color:#64748b!important}.gpi-pill{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:3px 8px!important;border-radius:999px!important;font-size:10px!important;font-weight:800!important;line-height:1!important}.gpi-pill.ok{background:#dcfce7!important;color:#166534!important}.gpi-pill.off{background:#f1f5f9!important;color:#64748b!important}
      .gpi-actions{display:flex!important;gap:6px!important;align-items:center!important;justify-content:flex-end!important}.gpi-actions button{width:25px!important;height:25px!important;border:1px solid #e2e8f0!important;border-radius:7px!important;background:#fff!important;color:#111827!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;padding:0!important}.gpi-actions button:hover{background:#fef3c7!important;border-color:#d4af37!important;color:#8a6400!important}.gpi-actions button .material-symbols-rounded{font-size:15px!important;margin:0!important;color:inherit!important;width:auto!important;height:auto!important;line-height:1!important}
      .journal-modern .gpi-wrap{margin-top:8px!important}.journal-modern-head{align-items:center!important}.journal-modern-title h2{font-size:15px!important}.journal-modern-title p{font-size:11px!important}.journal-search input{font-size:11px!important}

      .v25-ultra-compact .gpi-wrap{max-height:none!important}
      .gpi-table th:nth-child(2),.gpi-table td:nth-child(2){max-width:190px!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .gpi-table td{height:34px!important}
      .gpi-actions button[title="Supprimer"]{color:#b91c1c!important}
      .gpi-actions button[title="Modifier"]{color:#8a6400!important}
      .gpi-actions button[title="Voir"]{color:#0369a1!important}
      @media(max-width:900px){.gpi-table{min-width:650px!important}.gpi-person b{max-width:170px!important}.gpi-table th,.gpi-table td{padding:6px 8px!important}}
    `;
    document.head.appendChild(s);
  }
  function actionBtn(title, icon, onclick){return '<button type="button" title="'+esc(title)+'" onclick="'+onclick+'"><span class="material-symbols-rounded">'+icon+'</span></button>';}

  window.renderProprietairesCards=function(){
    injectCSS();
    var DB=getDB(), props=Array.isArray(DB.proprietaires)?DB.proprietaires:[];
    var search=(document.getElementById('proprietairesSearch')?.value||'').toLowerCase();
    var data=props.filter(function(p){return !search || JSON.stringify(p).toLowerCase().includes(search) || nameOf(p).toLowerCase().includes(search);});
    var totalBiens=props.reduce(function(s,p){return s+propBiens(p).length;},0);
    var set=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    set('propStatTotal',props.length);set('propStatBiens',totalBiens);set('propStatActifs',props.length);
    var counter=document.getElementById('proprietairesCount');if(counter)counter.textContent=data.length+' propriétaire'+(data.length>1?'s':'');
    var grid=document.getElementById('proprietairesCardsGrid'), empty=document.getElementById('proprietairesEmptyState');if(!grid)return;
    if(!data.length){grid.innerHTML='';grid.style.display='none';if(empty)empty.style.display='block';return;} if(empty)empty.style.display='none'; grid.style.display='block';
    grid.className='gpi-wrap';
    grid.innerHTML='<table class="gpi-table"><thead><tr><th>Nom</th><th>Biens</th><th>Téléphone</th><th>Email</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>'+data.map(function(p){
      var idx=props.indexOf(p), nm=nameOf(p), nb=propBiens(p).length;
      var view=(window.openProprietaireDetail?'openProprietaireDetail('+idx+')':'viewRow(\'proprietaires\','+idx+')');
      return '<tr><td><div class="gpi-person"><span class="gpi-avatar">'+esc(initials(nm))+'</span><div><b>'+esc(nm)+'</b><small>Propriétaire</small></div></div></td><td><b>'+nb+'</b> bien'+(nb>1?'s':'')+'</td><td><span class="gpi-line"><span class="material-symbols-rounded">call</span>'+esc(p.tel||'—')+'</span></td><td><span class="gpi-line"><span class="material-symbols-rounded">mail</span>'+esc(p.email||'—')+'</span></td><td><span class="gpi-pill ok">Actif</span></td><td><div class="gpi-actions">'+actionBtn('Voir','visibility',view)+actionBtn('Modifier','edit','editRow(\'proprietaires\','+idx+')')+actionBtn('Supprimer','delete','delRow(\'proprietaires\','+idx+')')+'</div></td></tr>';
    }).join('')+'</tbody></table>';
  };

  window.renderLocatairesModern=function(){
    injectCSS();
    var DB=getDB(), all=Array.isArray(DB.locataires)?DB.locataires:[];
    var search=(document.getElementById('locatairesSearchModern')?.value||'').toLowerCase().trim();
    var type=(document.getElementById('locatairesTypeFilter')?.value||'').toLowerCase();
    var statut=(document.getElementById('locatairesStatutFilter')?.value||'').toLowerCase();
    var set=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    set('locStatTotal',all.length);set('locStatBien',all.filter(l=>locBien(l)!=='—'&&locBien(l)!=='Aucun bien associé').length);set('locStatActifs',all.filter(l=>String(l.statut||'Actif').toLowerCase()==='actif').length);
    var data=all.filter(function(l){var blob=JSON.stringify(l).toLowerCase();return (!search||blob.includes(search)||locName(l).toLowerCase().includes(search))&&(!type||String(l.type||'').toLowerCase()===type)&&(!statut||String(l.statut||'Actif').toLowerCase()===statut);});
    var grid=document.getElementById('locatairesCardsGrid'), empty=document.getElementById('locatairesEmptyState');if(!grid){if(window.renderTable)window.renderTable('locataires');return;}
    var pag=document.getElementById('locatairesPagination');if(pag)pag.style.display='none'; var count=document.getElementById('locatairesModernCount');if(count)count.textContent=data.length+' locataire'+(data.length>1?'s':'');
    if(!data.length){grid.innerHTML=''; if(empty)empty.style.display='block'; return;} if(empty)empty.style.display='none';
    grid.className='gpi-wrap';
    grid.innerHTML='<table class="gpi-table"><thead><tr><th>Nom</th><th>Bien</th><th>Téléphone</th><th>Email</th><th>Type</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>'+data.map(function(l){
      var idx=all.indexOf(l), nm=locName(l), active=String(l.statut||'Actif').toLowerCase()==='actif';
      return '<tr><td><div class="gpi-person"><span class="gpi-avatar">'+esc(initials(nm))+'</span><div><b>'+esc(nm)+'</b><small>Locataire</small></div></div></td><td><span class="gpi-line"><span class="material-symbols-rounded">home</span>'+esc(locBien(l))+'</span></td><td><span class="gpi-line"><span class="material-symbols-rounded">call</span>'+esc(l.tel||'—')+'</span></td><td><span class="gpi-line"><span class="material-symbols-rounded">mail</span>'+esc(l.email||'—')+'</span></td><td>'+esc(l.type||'Particulier')+'</td><td><span class="gpi-pill '+(active?'ok':'off')+'">'+esc(l.statut||'Actif')+'</span></td><td><div class="gpi-actions">'+actionBtn('Voir','visibility','viewRow(\'locataires\','+idx+')')+actionBtn('Modifier','edit','editRow(\'locataires\','+idx+')')+actionBtn('Documents','folder','openLocataireDocs('+idx+')')+actionBtn('Supprimer','delete','delRow(\'locataires\','+idx+')')+'</div></td></tr>';
    }).join('')+'</tbody></table>';
  };

  window.renderJournalEmployeGrid=function(){
    injectCSS();
    var grid=document.getElementById('journalEmployeGrid'); if(!grid)return;
    var logs=[]; try{logs=window.safeJSONParse?window.safeJSONParse(localStorage.getItem('gp_auditlog'),[]):JSON.parse(localStorage.getItem('gp_auditlog')||'[]');}catch(e){logs=[];}
    var DB=getDB(), users=new Map(), email=(window.currentUser&&window.currentUser.email)||'', adminName=(email||'admin').split('@')[0];
    users.set(adminName,{name:adminName,email:email||'admin',count:0,last:null});
    (DB.employes||[]).filter(e=>e.nom||e.email).forEach(function(e){var nm=([e.prenom,e.nom].filter(Boolean).join(' ')||e.nom||e.email).trim();users.set(nm,{name:nm,email:e.email||'',count:0,last:null});});
    logs.forEach(function(l){var k=l.user||adminName;var u=users.get(k)||{name:k,email:l.email||'',count:0,last:null};u.count++;if(!u.last||(l.ts&&l.ts>u.last))u.last=l.ts;users.set(k,u);});
    var q=(document.getElementById('journalEmployeeSearch')?.value||'').toLowerCase().trim(); var arr=[].slice.call(users.values()).filter(u=>!q||(u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q));
    if(!arr.length){grid.innerHTML='<div class="journal-empty">Aucun employé trouvé</div>';return;} grid.className='gpi-wrap';
    grid.innerHTML='<table class="gpi-table"><thead><tr><th>Employé</th><th>Email</th><th>Actions</th><th>Dernière activité</th><th style="text-align:right">Voir</th></tr></thead><tbody>'+arr.map(function(u){
      return '<tr><td><div class="gpi-person"><span class="gpi-avatar">'+esc(initials(u.name))+'</span><div><b>'+esc(u.name)+'</b><small>Employé</small></div></div></td><td>'+esc(u.email||'—')+'</td><td><b>'+u.count+'</b> actions</td><td><span class="gpi-line"><span class="material-symbols-rounded">schedule</span>'+safeDate(u.last)+'</span></td><td><div class="gpi-actions">'+actionBtn('Voir','visibility','openEmpActivityModal('+JSON.stringify(u.name)+','+JSON.stringify(u.email||'')+')')+'</div></td></tr>';
    }).join('')+'</tbody></table>';
  };

  // La page 'sync' (synchronisation Supabase legacy) n'est plus utilisée dans l'architecture
  // Firebase actuelle. cleanupNav() la retire du DOM et du menu pour éviter toute confusion.
  // Le CSS injecté ci-dessus (display:none) en est la couverture préventive au cas où
  // le DOM ne serait pas encore prêt lors de l'appel.
  function cleanupNav(){
    document.querySelectorAll('[data-page="sync"]').forEach(function(el){ el.remove(); });
    var syncPage = document.getElementById('page-sync');
    if (syncPage) syncPage.remove();
  }
  document.addEventListener('DOMContentLoaded',function(){injectCSS();cleanupNav();setTimeout(function(){injectCSS();cleanupNav();if(document.body)document.body.classList.add('v25-ultra-compact'); if(location.hash.includes('journal')&&window.renderJournalEmployeGrid)window.renderJournalEmployeGrid();},500);});
})();
