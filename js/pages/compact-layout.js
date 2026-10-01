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
      .gpi-primary{height:36px!important;border:0!important;border-radius:8px!important;background:#d4af37!important;color:#111827!important;padding:0 14px!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;gap:6px!important;cursor:pointer!important}.gpi-secondary{height:36px!important;border:1px solid #e5dfca!important;border-radius:8px!important;background:#fff!important;color:#374151!important;padding:0 11px!important;display:inline-flex!important;align-items:center!important;gap:5px!important;font-weight:700!important;cursor:pointer!important}.gpi-search{height:36px!important;min-width:250px!important;display:flex!important;align-items:center!important;gap:6px!important;border:1px solid #e5e7eb!important;background:#fff!important;border-radius:8px!important;padding:0 10px!important}.gpi-search input{border:0!important;outline:0!important;width:100%!important;font-size:12px!important}.gpi-stat-card{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:10px!important;padding:10px 13px!important}.gpi-stat-card strong{display:block!important;font-size:20px!important;color:#111827!important}.gpi-stat-card span{display:block!important;margin-top:2px!important;font-size:11px!important;color:#64748b!important}
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
      return '<tr><td><div class="gpi-person"><span class="gpi-avatar">'+esc(initials(nm))+'</span><div><b>'+esc(nm)+'</b><small>Propriétaire</small></div></div></td><td><b>'+nb+'</b> bien'+(nb>1?'s':'')+'</td><td><span class="gpi-line"><span class="material-symbols-rounded">call</span>'+esc(p.tel||'—')+'</span></td><td><span class="gpi-line"><span class="material-symbols-rounded">mail</span>'+esc(p.email||'—')+'</span></td><td><span class="gpi-pill ok">Actif</span></td><td><div class="gpi-actions">'+actionBtn('Voir','visibility',view)+actionBtn('Modifier','edit','editRow(\'proprietaires\','+idx+')')+actionBtn('Mandat de gérance','description','generateMandatGerance('+idx+')')+actionBtn('Supprimer','delete','delRow(\'proprietaires\','+idx+')')+'</div></td></tr>';
    }).join('')+'</tbody></table>';
  };

  var LOC_PAGE=1, LOC_PS=10;
  function locPagination(total){ return window.GPPagination ? GPPagination.pages('locataires', total, LOC_PS, window.renderLocatairesModern) : ''; }
  window.gpLocatairesPage=function(p){ LOC_PAGE=Math.max(1,Number(p)||1); if(window.GPPagination)GPPagination.state.locataires=LOC_PAGE; return window.renderLocatairesModern(); };

  window.renderLocatairesModern=function(){
    injectCSS();
    var DB=getDB(), all=Array.isArray(DB.locataires)?DB.locataires:[];
    var page=document.getElementById('page-locataires'); if(!page)return;
    var search=(document.getElementById('locatairesSearchModern')?.value||'').toLowerCase().trim();
    var type=(document.getElementById('locatairesTypeFilter')?.value||'').toLowerCase();
    var statut=(document.getElementById('locatairesStatutFilter')?.value||'').toLowerCase();
    var data=all.filter(function(l){var blob=JSON.stringify(l).toLowerCase();return (!search||blob.includes(search)||locName(l).toLowerCase().includes(search))&&(!type||String(l.type||'').toLowerCase()===type)&&(!statut||String(l.statut||'Actif').toLowerCase()===statut);});
    var pg=window.GPPagination?GPPagination.normalize('locataires',data.length,LOC_PS):{page:LOC_PAGE,start:(LOC_PAGE-1)*LOC_PS}; LOC_PAGE=pg.page;
    var visible=data.slice(pg.start,pg.start+LOC_PS);
    var types={}; all.forEach(function(l){if(l.type)types[l.type]=true;});
    var statuses={}; all.forEach(function(l){statuses[l.statut||'Actif']=true;});
    page.innerHTML='<div class="gpi-page" style="padding:8px 24px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px"><div><h2 style="margin:0;font-size:19px;color:#111827">Locataires</h2><p style="margin:3px 0 0;color:#64748b;font-size:11px">Suivez les locataires et leurs locations.</p></div><button class="gpi-primary" onclick="navigate(\'nv-locataire\')"><span class="material-symbols-rounded">add</span>Nouveau locataire</button></div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:10px"><div class="gpi-stat-card"><strong>'+all.length+'</strong><span>Locataires</span></div><div class="gpi-stat-card"><strong>'+all.filter(function(l){return locBien(l)!=='—'&&locBien(l)!=='Aucun bien associé';}).length+'</strong><span>Avec un bien</span></div><div class="gpi-stat-card"><strong>'+all.filter(function(l){return String(l.statut||'Actif').toLowerCase()==='actif';}).length+'</strong><span>Actifs</span></div></div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap"><label class="gpi-search"><span class="material-symbols-rounded">search</span><input id="locatairesSearchModern" value="'+esc(search)+'" placeholder="Rechercher un locataire…" oninput="gpLocatairesPage(1)"></label><select id="locatairesTypeFilter" onchange="gpLocatairesPage(1)" style="height:36px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;background:#fff;font-size:12px"><option value="">Tous les types</option>'+Object.keys(types).map(function(x){return '<option value="'+esc(x.toLowerCase())+'" '+(type===x.toLowerCase()?'selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select><select id="locatairesStatutFilter" onchange="gpLocatairesPage(1)" style="height:36px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;background:#fff;font-size:12px"><option value="">Tous les statuts</option>'+Object.keys(statuses).map(function(x){return '<option value="'+esc(x.toLowerCase())+'" '+(statut===x.toLowerCase()?'selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select><div style="margin-left:auto;display:flex;gap:8px"><button class="gpi-secondary" onclick="exportListePDF(\'locataires\')"><span class="material-symbols-rounded">download</span>Exporter</button><button class="gpi-secondary" onclick="openImportModal(\'locataires\')"><span class="material-symbols-rounded">upload</span>Importer</button></div></div>'+
      '<div class="gpi-wrap">'+(data.length?'<table class="gpi-table"><thead><tr><th>Nom</th><th>Bien</th><th>Téléphone</th><th>Email</th><th>Type</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>'+visible.map(function(l){var idx=all.indexOf(l),nm=locName(l),active=String(l.statut||'Actif').toLowerCase()==='actif';return '<tr><td><div class="gpi-person"><span class="gpi-avatar">'+esc(initials(nm))+'</span><div><b>'+esc(nm)+'</b><small>Locataire</small></div></div></td><td><span class="gpi-line"><span class="material-symbols-rounded">home</span>'+esc(locBien(l))+'</span></td><td><span class="gpi-line"><span class="material-symbols-rounded">call</span>'+esc(l.tel||'—')+'</span></td><td><span class="gpi-line"><span class="material-symbols-rounded">mail</span>'+esc(l.email||'—')+'</span></td><td>'+esc(l.type||'Particulier')+'</td><td><span class="gpi-pill '+(active?'ok':'off')+'">'+esc(l.statut||'Actif')+'</span></td><td><div class="gpi-actions">'+actionBtn('Voir','visibility','viewRow(\'locataires\','+idx+')')+actionBtn('Modifier','edit','editRow(\'locataires\','+idx+')')+actionBtn('Documents','folder','openLocataireDocs('+idx+')')+actionBtn('Supprimer','delete','delRow(\'locataires\','+idx+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-common-footer"><span>Affichage de '+(data.length?pg.start+1:0)+' à '+Math.min(pg.start+LOC_PS,data.length)+' sur '+data.length+' locataire'+(data.length>1?'s':'')+'</span>'+locPagination(data.length)+'</div>':'<div style="padding:40px;text-align:center;color:#94a3b8">Aucun locataire trouvé</div>')+'</div></div>';
  };

  // Le Journal V20 est rendu par js/core/activity-pages-v20.js.
  // Aucun renderer concurrent ici : on évite d'écraser le journal moderne.

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
