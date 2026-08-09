// ── renderProprietairesModern ─────────────────────────────────────────────
(function(){
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function blob(o){ return JSON.stringify(o||'').toLowerCase(); }
  function initials(pr,n){ var a=(pr||'').trim().charAt(0); var b=(n||'').trim().charAt(0); return (a+b).toUpperCase()||'?'; }

  window.renderProprietairesModern = function(){
    var shell = document.getElementById('gpProprietairesModern');
    if(!shell) return;
    var all   = Array.isArray(window.DB&&window.DB.proprietaires) ? window.DB.proprietaires : [];
    var q     = (document.getElementById('gpPropSearch')  ? document.getElementById('gpPropSearch').value  : '').toLowerCase().trim();
    var fstat = (document.getElementById('gpPropStatus') ? document.getElementById('gpPropStatus').value : '').toLowerCase();

    var totalBiens = all.reduce(function(s,p){
      return s + (typeof window.getProprietaireBiens==='function' ? window.getProprietaireBiens(p).length : 0);
    }, 0);
    var actifs  = all.length; // tous considérés actifs par défaut

    var data = all.filter(function(p){
      var match = !q || blob(p).includes(q) ||
        ((typeof window.getProprietaireFullName==='function' ? window.getProprietaireFullName(p) : ((p.prenom||'')+' '+(p.nom||'')).trim()).toLowerCase().includes(q));
      return match;
    });

    shell.innerHTML = '\n'
      + '<div class="prop-desktop-wrap">'

      // Stats + bouton
      + '<div class="prop-cards-action-row">'
      + '<div class="prop-stats-row">'
      + '<div class="prop-stat-card"><div class="prop-stat-icon gold"><span class="material-symbols-rounded">group</span></div><div class="prop-stat-info"><strong>' + all.length + '</strong><span>Propriétaires</span><em>Total enregistrés</em></div></div>'
      + '<div class="prop-stat-card"><div class="prop-stat-icon blue"><span class="material-symbols-rounded">home_work</span></div><div class="prop-stat-info"><strong>' + totalBiens + '</strong><span>Biens associés</span><em>Tous propriétaires</em></div></div>'
      + '<div class="prop-stat-card"><div class="prop-stat-icon green"><span class="material-symbols-rounded">verified_user</span></div><div class="prop-stat-info"><strong>' + actifs + '</strong><span>Actifs</span><em>Comptes actifs</em></div></div>'
      + '</div>'
      + '<button class="prop-btn-primary" onclick="openNouvelProprietaireDrawer()"><span class="material-symbols-rounded" style="font-size:18px">add</span> Nouveau propriétaire</button>'
      + '</div>'

      // Toolbar
      + '<div class="prop-toolbar-row">'
      + '<label class="prop-search-box"><span class="material-symbols-rounded">search</span><input id="gpPropSearch" value="' + esc(q) + '" placeholder="Rechercher un propriétaire…" oninput="renderProprietairesModern()"></label>'
      + '<div style="margin-left:auto;display:flex;align-items:center;gap:8px">'
      + '<div class="gp-export-wrap" id="exportWrap-proprietaires" style="position:relative"><button class="prop-btn-sm-outline" onclick="toggleExportMenu(\'proprietaires\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span> Exporter</button><div class="gp-export-menu" id="exportMenu-proprietaires"><div class="gp-export-item" onclick="exportListePDF(\'proprietaires\');toggleExportMenu(\'proprietaires\')"><span class="material-symbols-rounded">picture_as_pdf</span> Export PDF</div><div class="gp-export-sep"></div><div class="gp-export-item" onclick="exportExcel(\'proprietaires\');toggleExportMenu(\'proprietaires\')"><span class="material-symbols-rounded">table_view</span> Export Excel</div></div></div>'
      + '<button class="prop-btn-sm-outline" onclick="openImportModal(\'proprietaires\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span> Importer</button>'
      + '</div></div>'

      // Table
      + '<div class="prop-table-wrap">'
      + (data.length
        ? '<table class="prop-table"><thead><tr>'
          + '<th style="text-align:center">Propriétaire</th>'
          + '<th style="text-align:center">Contact</th>'
          + '<th style="text-align:center">Adresse</th>'
          + '<th style="text-align:center">Biens</th>'
          + '<th style="text-align:center">Statut</th>'
          + '<th style="text-align:center">Actions</th>'
          + '</tr></thead><tbody>'
          + data.map(function(p){
              var idx = all.indexOf(p);
              var fullName = (typeof window.getProprietaireFullName==='function')
                ? window.getProprietaireFullName(p)
                : (((p.prenom||'')+' '+(p.nom||'')).trim() || p.nom || 'Propriétaire');
              var photo = p.photo
                ? '<img src="'+esc(p.photo)+'" alt="'+esc(fullName)+'">'
                : initials(p.prenom, p.nom);
              var biens = (typeof window.getProprietaireBiens==='function') ? window.getProprietaireBiens(p).length : 0;
              return '<tr onclick="openProprietaireDetail('+idx+')">'
                + '<td><div class="prop-person-cell"><div class="prop-avatar">'+photo+'</div><div><div class="prop-person-name">'+esc(fullName)+'</div><div class="prop-person-sub">'+esc(p.email||'—')+'</div></div></div></td>'
                + '<td><div class="prop-contact-cell"><div class="prop-contact-phone"><span class="material-symbols-rounded">call</span>'+esc(p.tel||'—')+'</div><div class="prop-contact-email"><span class="material-symbols-rounded">mail</span>'+esc(p.email||'—')+'</div></div></td>'
                + '<td style="font-size:13px;color:#374151">'+esc(p.adresse||'—')+'</td>'
                + '<td><span class="prop-biens-badge"><span class="material-symbols-rounded" style="font-size:14px">home_work</span>'+biens+'</span></td>'
                + '<td><span class="prop-status-dot">Actif</span></td>'
                + '<td><div class="prop-actions" onclick="event.stopPropagation()">'
                + '<button class="prop-action-btn view" title="Voir" onclick="openProprietaireDetail('+idx+')"><span class="material-symbols-rounded">visibility</span></button>'
                + '<button class="prop-action-btn edit" title="Modifier" onclick="editRow(\'proprietaires\','+idx+')"><span class="material-symbols-rounded">edit</span></button>'
                + '<button class="prop-action-btn docs" title="Documents" onclick="openEntityDocs(\'proprietaires\','+idx+')"><span class="material-symbols-rounded">folder</span></button>'
                + '<button class="prop-action-btn del" title="Supprimer" onclick="delRow(\'proprietaires\','+idx+')"><span class="material-symbols-rounded">delete</span></button>'
                + '</div></td>'
                + '</tr>';
            }).join('')
          + '</tbody></table>'
          + '<div class="prop-table-footer"><span>Affichage de 1 à '+data.length+' sur '+data.length+' propriétaire'+(data.length>1?'s':'')+'</span>'
          + '<div class="prop-page-btns"><button class="prop-page-btn"><span class="material-symbols-rounded" style="font-size:14px">chevron_left</span></button><button class="prop-page-btn active">1</button><button class="prop-page-btn"><span class="material-symbols-rounded" style="font-size:14px">chevron_right</span></button></div></div>'
        : '<div class="prop-empty"><span class="material-symbols-rounded">person_off</span>Aucun propriétaire trouvé</div>')
      + '</div></div>';

    setTimeout(function(){
      var s = document.getElementById('gpPropSearch');
      if(s && document.activeElement && document.activeElement.id==='gpPropSearch') s.focus();
    }, 0);
  };

  // Hook navigation
  var _oldRenderPage2 = window.renderPage;
  window.renderPage = function(p){
    if(p==='proprietaires'){ window.renderProprietairesModern(); if(typeof window.updateSidebarBadges==='function') window.updateSidebarBadges(); return; }
    return _oldRenderPage2 ? _oldRenderPage2(p) : undefined;
  };

  // Also patch the legacy renderProprietairesCards calls so they refresh the modern view
  var _oldRPC = window.renderProprietairesCards;
  window.renderProprietairesCards = function(){
    if(document.getElementById('gpProprietairesModern')){ window.renderProprietairesModern(); return; }
    if(typeof _oldRPC==='function') _oldRPC();
  };

  document.addEventListener('DOMContentLoaded', function(){
    try{
      if(document.getElementById('page-proprietaires')&&document.getElementById('page-proprietaires').classList.contains('active'))
        window.renderProprietairesModern();
    }catch(e){}
  });
})();
