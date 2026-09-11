/**
 * missing-actions.js — Genius Property V21
 * =====================================================================
 * Implémentation des fonctions manquantes qui causaient le silence
 * silencieux sur les boutons d'action dans les pages suivantes :
 *
 *  - Employés      : icône dossier (openEntityDocs)
 *  - Propriétaires : icône voir (openProprietaireDetail) + dossier
 *  - Locataires    : icône voir manquante + icône dossier
 *  - Biens         : clic carte (openBienDetail)
 *  - Contrats      : icône PDF (generateContratPDF)
 *  - Dépenses      : icône facture (openDepFacture)
 *
 * Ce fichier doit être chargé APRÈS biens.js.
 * =====================================================================
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     UTILITAIRES INTERNES
  ───────────────────────────────────────────────────────────── */

  function db() {
    if (window.GPDB && window.GPDB.load) return window.GPDB.load();
    return window.DB || {};
  }

  function saveDb(data) {
    if (window.GPDB && window.GPDB.save) { window.GPDB.save(data); return; }
    window.DB = data;
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(v) {
    var n = Number(String(v || 0).replace(/[^0-9.-]/g, '')) || 0;
    return n.toLocaleString('fr-FR') + ' FCFA';
  }

  function gpToast(msg, type) {
    if (typeof window.toast === 'function') window.toast(msg, type);
    else console[type === 'err' ? 'error' : 'log']('[GP]', msg);
  }

  function genId() {
    return 'f-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /* ─────────────────────────────────────────────────────────────
     MODAL DOSSIER DOCUMENTS
     Affiche la liste des fichiers, permet d'en ajouter et supprimer.
     Structure d'un fichier dans db().fichiers[] :
     { id, entity, entityIdx, nom, url, type, date, size }
  ───────────────────────────────────────────────────────────── */

  var MODAL_ID = 'gp-docs-modal';

  /* Convertit un fichier File en base64 */
  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload  = function(e) { resolve(e.target.result); };
      reader.onerror = function()  { reject(new Error('Lecture fichier échouée')); };
      reader.readAsDataURL(file);
    });
  }

  /* Formate la taille en Ko/Mo */
  function fmtSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024)      return bytes + ' o';
    if (bytes < 1048576)   return Math.round(bytes / 1024) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  /* Icône selon extension */
  function fileIcon(nom) {
    var n = String(nom || '').toLowerCase();
    if (/\.pdf$/.test(n))                   return { icon: 'picture_as_pdf',  color: '#dc2626' };
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return { icon: 'image',         color: '#2563eb' };
    if (/\.(doc|docx)$/.test(n))            return { icon: 'description',     color: '#1d4ed8' };
    if (/\.(xls|xlsx)$/.test(n))            return { icon: 'table_chart',     color: '#15803d' };
    return                                         { icon: 'insert_drive_file', color: '#6b7280' };
  }

  /* Rendu HTML d'un document dans la liste */
  function docItemHTML(f, i) {
    var fi = fileIcon(f.nom);
    return '<div id="gp-doc-item-' + esc(f.id) + '" ' +
      'style="display:flex;align-items:center;gap:10px;padding:10px 12px;' +
             'background:#f9fafb;border-radius:9px;margin-bottom:8px;border:1px solid #e5e7eb">' +
      '<span class="material-symbols-rounded" style="font-size:24px;color:' + fi.color + ';flex-shrink:0">' + fi.icon + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;font-size:13px;color:#111827;' +
             'white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(f.nom) + '">' +
          esc(f.nom) +
        '</div>' +
        '<div style="font-size:11px;color:#9ca3af;margin-top:2px">' +
          esc(f.date || '') + (f.size ? ' · ' + fmtSize(f.size) : '') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-shrink:0">' +
        (f.url
          ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener" ' +
            'style="display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 10px;' +
                   'border:1px solid #bfdbfe;border-radius:6px;background:#eff6ff;color:#2563eb;' +
                   'font-size:12px;font-weight:600;text-decoration:none;cursor:pointer">' +
            '<span class="material-symbols-rounded" style="font-size:13px">open_in_new</span>Ouvrir</a>'
          : '') +
        '<button onclick="window._gpDeleteDoc(\'' + esc(f.id) + '\')" ' +
          'title="Supprimer ce document" ' +
          'style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;' +
                 'border:1px solid #fecaca;border-radius:6px;background:#fef2f2;color:#ef4444;cursor:pointer">' +
          '<span class="material-symbols-rounded" style="font-size:15px">delete</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  /* Rafraîchit la liste dans la modal ouverte */
  function refreshDocsList(entity, entityIdx) {
    var listEl = document.getElementById('gp-docs-list');
    if (!listEl) return;
    var d = db();
    var fichiers = Array.isArray(d.fichiers) ? d.fichiers : [];
    var docs = fichiers.filter(function(f) {
      return String(f.entity) === String(entity) && String(f.entityIdx) === String(entityIdx);
    });
    if (docs.length) {
      listEl.innerHTML = docs.map(docItemHTML).join('');
    } else {
      listEl.innerHTML =
        '<div style="padding:28px;text-align:center;color:#9ca3af">' +
          '<span class="material-symbols-rounded" style="font-size:40px;display:block;margin-bottom:8px">folder_open</span>' +
          'Aucun document dans ce dossier.' +
        '</div>';
    }
    var counter = document.getElementById('gp-docs-counter');
    if (counter) counter.textContent = docs.length ? docs.length + ' document' + (docs.length > 1 ? 's' : '') : '';
  }

  /* Sauvegarde d'un nouveau document */
  function saveDoc(entity, entityIdx, nom, url, size) {
    var d = db();
    if (!Array.isArray(d.fichiers)) d.fichiers = [];
    var today = new Date().toLocaleDateString('fr-FR');
    d.fichiers.push({
      id: genId(),
      entity: entity,
      entityIdx: entityIdx,
      nom: nom.trim(),
      url: url,
      size: size || 0,
      date: today
    });
    saveDb(d);
  }

  /* Suppression d'un document par id */
  window._gpDeleteDoc = function(docId) {
    if (!confirm('Supprimer ce document ?')) return;
    var d = db();
    if (!Array.isArray(d.fichiers)) return;
    var before = d.fichiers.length;
    d.fichiers = d.fichiers.filter(function(f) { return f.id !== docId; });
    if (d.fichiers.length === before) return;
    saveDb(d);
    // Retrouver entity/entityIdx depuis le modal ouvert
    var modal = document.getElementById(MODAL_ID);
    if (modal) {
      var entity    = modal.getAttribute('data-entity');
      var entityIdx = modal.getAttribute('data-entity-idx');
      refreshDocsList(entity, entityIdx);
    }
    gpToast('Document supprimé');
  };

  /* Ouvre la modal dossier documents */
  function openDocsModal(entity, entityIdx, entityLabel) {
    var old = document.getElementById(MODAL_ID);
    if (old) old.remove();

    var html =
      '<div id="' + MODAL_ID + '" data-entity="' + esc(entity) + '" data-entity-idx="' + entityIdx + '" ' +
        'style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;' +
               'display:flex;align-items:center;justify-content:center;padding:20px">' +
        '<div style="background:#fff;border-radius:16px;width:100%;max-width:520px;' +
                    'max-height:88vh;display:flex;flex-direction:column;' +
                    'box-shadow:0 20px 60px rgba(0,0,0,.22)">' +

          /* Header */
          '<div style="padding:18px 22px 14px;border-bottom:1px solid #f3f4f6;' +
                      'display:flex;align-items:center;justify-content:space-between;flex-shrink:0">' +
            '<div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
                '<span class="material-symbols-rounded" style="font-size:22px;color:#D4AF37">folder</span>' +
                '<span style="font-size:17px;font-weight:800;color:#111827">Dossier documents</span>' +
                '<span id="gp-docs-counter" style="font-size:11px;color:#9ca3af;margin-left:4px"></span>' +
              '</div>' +
              '<div style="font-size:12px;color:#6b7280;margin-top:3px">' + esc(entityLabel) + '</div>' +
            '</div>' +
            '<button onclick="document.getElementById(\'' + MODAL_ID + '\').remove()" ' +
              'style="border:0;background:transparent;color:#6b7280;cursor:pointer;padding:4px">' +
              '<span class="material-symbols-rounded" style="font-size:20px">close</span>' +
            '</button>' +
          '</div>' +

          /* Liste documents */
          '<div id="gp-docs-list" style="flex:1;overflow:auto;padding:16px 22px"></div>' +

          /* Formulaire ajout */
          '<div style="border-top:2px solid #f3f4f6;padding:16px 22px;flex-shrink:0;background:#fafafa;' +
                      'border-radius:0 0 16px 16px">' +
            '<div style="font-size:12px;font-weight:800;color:#374151;text-transform:uppercase;' +
                        'letter-spacing:.05em;margin-bottom:12px">Ajouter un document</div>' +

            /* Nom du document */
            '<div style="margin-bottom:10px">' +
              '<label style="font-size:11.5px;font-weight:700;color:#374151;display:block;margin-bottom:5px">' +
                'Nom du document <span style="color:#ef4444">*</span>' +
              '</label>' +
              '<input id="gp-doc-nom" placeholder="Ex : Contrat signé, Pièce d\'identité…" ' +
                'style="width:100%;box-sizing:border-box;height:36px;border:1px solid #e5e7eb;' +
                       'border-radius:8px;padding:0 12px;font-size:13px;color:#111827;outline:0;background:#fff">' +
            '</div>' +

            /* Fichier OU lien */
            '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-bottom:12px">' +

              /* Upload fichier */
              '<div>' +
                '<label style="font-size:11.5px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Fichier</label>' +
                '<label style="display:flex;align-items:center;gap:7px;height:36px;padding:0 12px;' +
                              'border:1px dashed #d1d5db;border-radius:8px;background:#fff;cursor:pointer;' +
                              'font-size:12px;color:#6b7280;overflow:hidden">' +
                  '<span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37;flex-shrink:0">upload_file</span>' +
                  '<span id="gp-doc-file-label" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Choisir un fichier</span>' +
                  '<input id="gp-doc-file" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" ' +
                    'style="position:absolute;opacity:0;width:0;height:0" ' +
                    'onchange="window._gpDocFileChange(this)">' +
                '</label>' +
              '</div>' +

              /* Séparateur OU */
              '<div style="text-align:center;font-size:11px;color:#9ca3af;font-weight:700">OU</div>' +

              /* Lien URL */
              '<div>' +
                '<label style="font-size:11.5px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Lien URL</label>' +
                '<input id="gp-doc-url" type="url" placeholder="https://…" ' +
                  'style="width:100%;box-sizing:border-box;height:36px;border:1px solid #e5e7eb;' +
                         'border-radius:8px;padding:0 12px;font-size:13px;color:#111827;outline:0;background:#fff">' +
              '</div>' +
            '</div>' +

            /* Bouton enregistrer */
            '<button id="gp-doc-save-btn" onclick="window._gpSaveNewDoc()" ' +
              'style="width:100%;height:38px;border:0;border-radius:9px;background:#D4AF37;' +
                     'color:#111827;font-weight:800;font-size:13px;cursor:pointer;' +
                     'display:flex;align-items:center;justify-content:center;gap:7px">' +
              '<span class="material-symbols-rounded" style="font-size:16px">add</span>' +
              'Enregistrer le document' +
            '</button>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    // Fermeture au clic sur overlay
    document.getElementById(MODAL_ID).addEventListener('click', function(e) {
      if (e.target === this) this.remove();
    });

    // Charger la liste initiale
    refreshDocsList(entity, entityIdx);
  }

  /* Callback changement de fichier (met à jour le label) */
  window._gpDocFileChange = function(input) {
    var lbl = document.getElementById('gp-doc-file-label');
    if (!lbl) return;
    if (input.files && input.files[0]) {
      lbl.textContent = input.files[0].name;
      // Pré-remplir le nom si vide
      var nomInput = document.getElementById('gp-doc-nom');
      if (nomInput && !nomInput.value.trim()) {
        // Enlever l'extension pour le nom par défaut
        nomInput.value = input.files[0].name.replace(/\.[^.]+$/, '');
      }
    } else {
      lbl.textContent = 'Choisir un fichier';
    }
  };

  /* Callback bouton Enregistrer */
  window._gpSaveNewDoc = async function() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    var entity    = modal.getAttribute('data-entity');
    var entityIdx = modal.getAttribute('data-entity-idx');

    var nomInput  = document.getElementById('gp-doc-nom');
    var fileInput = document.getElementById('gp-doc-file');
    var urlInput  = document.getElementById('gp-doc-url');
    var btn       = document.getElementById('gp-doc-save-btn');

    var nom  = nomInput  ? nomInput.value.trim()  : '';
    var url  = urlInput  ? urlInput.value.trim()  : '';
    var file = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;

    if (!nom) {
      if (nomInput) {
        nomInput.style.borderColor = '#ef4444';
        nomInput.focus();
        setTimeout(function() { nomInput.style.borderColor = ''; }, 2000);
      }
      gpToast('Le nom du document est requis', 'err');
      return;
    }

    if (!file && !url) {
      gpToast('Ajoutez un fichier ou un lien URL', 'err');
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }

    try {
      var finalUrl = url;
      var size = 0;

      if (file) {
        // Vérification taille (max 5 Mo)
        if (file.size > 5 * 1024 * 1024) {
          gpToast('Fichier trop lourd (max 5 Mo)', 'err');
          if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">add</span>Enregistrer le document'; }
          return;
        }
        finalUrl = await fileToBase64(file);
        size = file.size;
        // Si un nom de fichier n'est pas déjà dans le nom, on garde le nom saisi
      }

      saveDoc(entity, entityIdx, nom, finalUrl, size);

      // Reset formulaire
      if (nomInput)  { nomInput.value = ''; }
      if (urlInput)  { urlInput.value = ''; }
      if (fileInput) { fileInput.value = ''; }
      var lbl = document.getElementById('gp-doc-file-label');
      if (lbl) lbl.textContent = 'Choisir un fichier';

      refreshDocsList(entity, entityIdx);
      gpToast('Document enregistré ✓');
    } catch(e) {
      console.error('[GP] Erreur sauvegarde doc', e);
      gpToast('Erreur lors de l\'enregistrement', 'err');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">add</span>Enregistrer le document';
      }
    }
  };

  /* ─────────────────────────────────────────────────────────────
     1. openEntityDocs(entity, idx)
        Utilisé par : Employés, Propriétaires, Locataires
  ───────────────────────────────────────────────────────────── */
  window.openEntityDocs = function(entity, idx) {
    var d = db();
    var arr = Array.isArray(d[entity]) ? d[entity] : [];
    var r = arr[idx];
    if (!r) { gpToast('Enregistrement introuvable', 'err'); return; }

    var label;
    if (entity === 'employes' || entity === 'proprietaires' || entity === 'locataires') {
      label = [r.prenom, r.nom].filter(Boolean).join(' ') || entity.slice(0, -1);
    } else {
      label = r.nom || r.libelle || (entity + ' #' + (idx + 1));
    }

    openDocsModal(entity, idx, label);
  };

  /* ─────────────────────────────────────────────────────────────
     2. openLocataireDocs(idx) — alias pour locataires.js classique
  ───────────────────────────────────────────────────────────── */
  window.openLocataireDocs = function(idx) {
    window.openEntityDocs('locataires', idx);
  };

  /* ─────────────────────────────────────────────────────────────
     3. openProprietaireDetail(idx) — bouton "Voir" propriétaires
  ───────────────────────────────────────────────────────────── */
  window.openProprietaireDetail = function(idx) {
    if (typeof window.viewRow === 'function') {
      window.viewRow('proprietaires', idx);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     4. openBienDetail(idx) — clic carte biens → page détail complète
  ───────────────────────────────────────────────────────────── */

  /* --- helpers bien-detail --- */
  function _bd_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function _bd_clean(v){return String(v==null?'':v).trim();}
  function _bd_norm(v){return _bd_clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function _bd_money(v){if(v==null||v==='')return '—';if(/FCFA|€|\$/i.test(String(v)))return _bd_esc(v);var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.'));return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':_bd_esc(v);}
  function _bd_similar(a,b){a=_bd_norm(a);b=_bd_norm(b);if(!a||!b)return false;return a===b||a.indexOf(b)>-1||b.indexOf(a)>-1;}
  function _bd_keyVals(o,keys){return keys.map(function(k){return _bd_clean(o&&o[k]);}).filter(Boolean);}
  function _bd_namePerson(p){return _bd_clean([p&&p.prenom,p&&p.nom].filter(Boolean).join(' '))||_bd_clean(p&&p.nom)||_bd_clean(p&&p.name)||_bd_clean(p&&p.fullName)||_bd_clean(p&&p.email)||_bd_clean(p&&p.tel)||'';}
  function _bd_bienName(b){return _bd_clean(b&&(b.nom||b.name||b.designation||b.adresse||b.id));}
  function _bd_locName(l){return _bd_clean(l&&(l.nom||l.name||l.location||l.bien||l.locative||l.id));}
  function _bd_arr(k){var d=db();return Array.isArray(d[k])?d[k]:[];}
  function _bd_ownerKeys(b){return _bd_keyVals(b,['proprietaireId','ownerId','proprioId','proprio','proprietaire','owner','nomProprietaire','proprietaireNom','ownerName']);}
  function _bd_findOwner(b){
    var keys=_bd_ownerKeys(b);if(!keys.length)return null;
    var owners=_bd_arr('proprietaires'),best=null,score=0;
    owners.forEach(function(p){
      var vals=_bd_keyVals(p,['id','uid','key','email','tel','phone','telephone','nom','prenom','name','fullName','raisonSociale']);vals.push(_bd_namePerson(p));
      var s=0;keys.forEach(function(k){vals.forEach(function(v){if(_bd_norm(k)&&_bd_norm(v)){if(_bd_norm(k)===_bd_norm(v))s=Math.max(s,100);else if(_bd_similar(k,v))s=Math.max(s,70);}});});
      if(s>score){score=s;best=p;}
    });
    return score>=50?best:null;
  }
  function _bd_countOwnerBiens(p){
    var vals=_bd_keyVals(p,['id','uid','key','email','tel','phone','telephone','nom','prenom','name','fullName']);vals.push(_bd_namePerson(p));
    return _bd_arr('biens').filter(function(b){return _bd_ownerKeys(b).some(function(k){return vals.some(function(v){return _bd_similar(k,v);});});}).length;
  }
  function _bd_locativesForBien(b){
    var bid=_bd_clean(b.id||b.uid||b.key),bn=_bd_bienName(b),adr=_bd_clean(b.adresse);
    return _bd_arr('locatives').filter(function(l){
      var vals=_bd_keyVals(l,['bienId','idBien','bien_id','bien','nomBien','bienNom','immeuble','propriete','location','locative']);
      if(bid&&vals.some(function(v){return _bd_norm(v)===_bd_norm(bid);}))return true;
      if(bn&&vals.some(function(v){return _bd_similar(v,bn);}))return true;
      if(adr&&vals.some(function(v){return _bd_similar(v,adr);}))return true;
      return false;
    });
  }
  function _bd_unitsOf(b){
    if(Array.isArray(b.unites)&&b.unites.length)return b.unites.map(function(u,i){return typeof u==='string'?{nom:u}:Object.assign({nom:'Appartement '+(i+1)},u);});
    var n=parseInt(b.nbAppart||b.nbAppartement||b.nbAppartements||b.nombreUnites||0,10);
    if(!n||n<1)n=1;
    return Array.from({length:n},function(_,i){return{nom:n>1?'Appartement '+(i+1):(b.nom||'Unité principale')};});
  }
  function _bd_locataireFor(loc){
    var keys=_bd_keyVals(loc,['locataireId','tenantId','locataire','occupant','nomLocataire']);
    var tenants=_bd_arr('locataires');
    for(var i=0;i<tenants.length;i++){
      var t=tenants[i],vals=_bd_keyVals(t,['id','uid','key','email','tel','phone','telephone','nom','prenom','name','fullName']);vals.push(_bd_namePerson(t));
      if(keys.some(function(k){return vals.some(function(v){return _bd_similar(k,v);});}))return t;
    }
    return null;
  }
  function _bd_locMatchesUnit(loc,u){
    var un=_bd_clean(u.nom||u.name||u.numero||u.label||u.id),uid=_bd_clean(u.id||u.uid||u.key||u.numero);
    var vals=_bd_keyVals(loc,['uniteId','unitId','appartementId','unite','unit','appartement','numero','lot','nom','location','locative']);
    if(uid&&vals.some(function(v){return _bd_norm(v)===_bd_norm(uid);}))return true;
    if(un&&vals.some(function(v){return _bd_similar(v,un);}))return true;
    return false;
  }
  function _bd_statusFor(b){
    var units=_bd_unitsOf(b),locs=_bd_locativesForBien(b).filter(function(l){return !/dispon|libre|annul|resil/i.test(String(l.statut||''));});
    if(!locs.length)return 'Disponible';
    if(locs.length>=units.length)return 'Loué';
    return 'Partiellement loué';
  }
  function _bd_statusBadge(s){
    var bg=s==='Loué'?'#dcfce7':(s==='Partiellement loué'?'#fef3c7':'#eff6ff');
    var c=s==='Loué'?'#15803d':(s==='Partiellement loué'?'#b45309':'#2563eb');
    return '<span class="bd-status-pill" style="background:'+bg+';color:'+c+';display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800">'+_bd_esc(s)+'</span>';
  }
  function _bd_renderOwner(b){
    var p=_bd_findOwner(b),wanted=_bd_ownerKeys(b).join(' / ')||'—';
    if(!p)return '<div class="bd-empty-state" style="display:grid;place-items:center;text-align:center;gap:6px;border:1px dashed #cbd5e1;border-radius:16px;padding:28px;color:#94a3b8"><span class="material-symbols-rounded" style="font-size:42px;color:#D4AF37">person_off</span><b>Propriétaire non trouvé</b><small>'+_bd_esc(wanted)+'</small></div>';
    var n=_bd_namePerson(p)||'Propriétaire',initials=n.split(/\s+/).map(function(x){return x[0];}).join('').slice(0,2).toUpperCase();
    return '<div style="display:flex;align-items:center;gap:14px;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;padding:15px;margin-bottom:12px"><div style="width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,#D4AF37,#ffe38a);display:grid;place-items:center;font-size:22px;font-weight:950;overflow:hidden;flex-shrink:0">'+(p.photo?'<img src="'+_bd_esc(p.photo)+'" style="width:100%;height:100%;object-fit:cover">':_bd_esc(initials))+'</div><div><h3 style="margin:0;font-size:17px;font-weight:900">'+_bd_esc(n)+'</h3><p style="margin:3px 0 0;color:#64748b;font-size:13px">'+_bd_esc(p.adresse||'Adresse non renseignée')+'</p></div></div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"><div style="background:#f8fafc;border:1px solid #edf2f7;border-radius:12px;padding:12px"><label style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:4px">Téléphone</label><b>'+_bd_esc(p.tel||p.phone||p.telephone||'—')+'</b></div><div style="background:#f8fafc;border:1px solid #edf2f7;border-radius:12px;padding:12px"><label style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:4px">Email</label><b>'+_bd_esc(p.email||'—')+'</b></div><div style="background:#f8fafc;border:1px solid #edf2f7;border-radius:12px;padding:12px"><label style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:4px">Nb biens</label><b>'+_bd_countOwnerBiens(p)+'</b></div></div>';
  }
  function _bd_renderLocataires(b){
    var locs=_bd_locativesForBien(b);
    if(!locs.length)return '<div class="bd-empty-state" style="display:grid;place-items:center;text-align:center;gap:6px;border:1px dashed #cbd5e1;border-radius:16px;padding:28px;color:#94a3b8"><span class="material-symbols-rounded" style="font-size:42px;color:#D4AF37">groups</span><b>Aucun locataire lié</b><small>Créez une location liée à ce bien pour l\'afficher ici.</small></div>';
    return locs.map(function(l){
      var t=_bd_locataireFor(l),n=_bd_namePerson(t)||_bd_clean(l.locataire||l.occupant||l.nomLocataire)||'Locataire';
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px;font-weight:800"><span class="material-symbols-rounded" style="color:#D4AF37">person</span>'+_bd_esc(n)+'</div>'+_bd_statusBadge(l.statut||'Loué')+'</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"><div style="background:#f8fafc;border-radius:10px;padding:10px"><label style="display:block;font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:3px">Location</label><b style="font-size:13px">'+_bd_esc(_bd_locName(l)||'—')+'</b></div><div style="background:#f8fafc;border-radius:10px;padding:10px"><label style="display:block;font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:3px">Date entrée</label><b style="font-size:13px">'+_bd_esc(l.dateEntree||l.date||l.debut||'—')+'</b></div><div style="background:#f8fafc;border-radius:10px;padding:10px"><label style="display:block;font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:3px">Loyer</label><b style="font-size:13px">'+_bd_money(l.loyer||l.montant)+'</b></div></div></div>';
    }).join('');
  }
  function _bd_renderUnits(b){
    var locs=_bd_locativesForBien(b),used={};
    return _bd_unitsOf(b).map(function(u,i){
      var loc=locs.find(function(l,j){if(used[j])return false;return _bd_locMatchesUnit(l,u);});
      if(!loc&&_bd_unitsOf(b).length===1)loc=locs[0];
      if(loc){used[locs.indexOf(loc)]=true;}
      var t=loc&&_bd_locataireFor(loc),s=loc?'Loué':'Disponible';
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px;font-weight:800"><span class="material-symbols-rounded" style="color:#D4AF37">meeting_room</span>'+_bd_esc(u.nom||('Unité '+(i+1)))+'</div>'+_bd_statusBadge(s)+'</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px"><div style="background:#f8fafc;border-radius:10px;padding:10px"><label style="display:block;font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:3px">Locataire</label><b style="font-size:13px">'+_bd_esc((t&&_bd_namePerson(t))||(loc&&(loc.locataire||loc.occupant))||'—')+'</b></div><div style="background:#f8fafc;border-radius:10px;padding:10px"><label style="display:block;font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:3px">Loyer</label><b style="font-size:13px">'+_bd_money(loc&&(loc.loyer||loc.montant)||u.loyer)+'</b></div></div></div>';
    }).join('');
  }
  function _bd_renderDocs(b){
    if(!Array.isArray(b.documents))b.documents=[];
    var list=b.documents;
    return '<div style="display:flex;gap:10px;align-items:center;background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:12px;margin-bottom:12px"><input id="bdDocName" placeholder="Nom du document" style="flex:1;height:38px;border:1px solid #e5e7eb;border-radius:10px;padding:0 12px;background:#fff;font-size:13px"><input id="bdDocFile" type="file" style="height:38px;border:1px solid #e5e7eb;border-radius:10px;padding:0 8px;background:#fff;font-size:12px"><button type="button" onclick="gpAddBienDetailDocument()" style="height:38px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;padding:0 14px;display:inline-flex;align-items:center;gap:6px;cursor:pointer"><span class="material-symbols-rounded" style="font-size:16px">add</span>Ajouter</button></div>'+
      (list.length?list.map(function(d,i){return '<div style="display:flex;align-items:center;gap:12px;border:1px solid #e5e7eb;background:#fff;border-radius:13px;padding:12px;margin-bottom:8px"><div style="width:38px;height:38px;border-radius:11px;background:#fff7dd;display:grid;place-items:center;flex-shrink:0"><span class="material-symbols-rounded" style="color:#D4AF37">folder</span></div><div style="flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_bd_esc(d.nom||d.name||d.fileName||'Document')+'</b><small style="color:#94a3b8;font-size:11px">'+_bd_esc(d.fileName||'')+'</small></div><div style="display:flex;gap:7px"><button type="button" onclick="gpOpenBienDoc('+i+')" style="width:33px;height:33px;border:1px solid #e5e7eb;border-radius:9px;background:#fff;display:grid;place-items:center;cursor:pointer"><span class="material-symbols-rounded" style="font-size:17px;color:#D4AF37">visibility</span></button><button type="button" onclick="gpDeleteBienDoc('+i+')" style="width:33px;height:33px;border:1px solid #fecaca;border-radius:9px;background:#fff1f2;display:grid;place-items:center;cursor:pointer"><span class="material-symbols-rounded" style="font-size:17px;color:#ef4444">delete</span></button></div></div>';}).join('')
      :'<div style="display:grid;place-items:center;text-align:center;gap:6px;border:1px dashed #cbd5e1;border-radius:14px;padding:28px;color:#94a3b8"><span class="material-symbols-rounded" style="font-size:40px;color:#D4AF37">folder_off</span><b>Aucun document</b><small>Ajoutez les documents liés au bien.</small></div>');
  }
  function _bd_injectCSS(){
    if(document.getElementById('gp-bd-restored-css'))return;
    var s=document.createElement('style');s.id='gp-bd-restored-css';
    s.textContent='#page-bien-detail{padding:18px 22px 40px!important;background:#f5f6f8!important}.bd-restored{display:block}.bd-restored-head{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px 18px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.04)}.bd-restored-title{flex:1;min-width:0}.bd-restored-title h2{margin:0;font-size:20px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bd-restored-title p{margin:3px 0 0;color:#64748b;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bd-restored-actions{display:flex;gap:8px;flex-shrink:0}.bd-top-btn{height:36px;border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:0 13px;display:inline-flex;align-items:center;gap:6px;font-weight:800;font-size:13px;cursor:pointer;color:#374151}.bd-top-btn:hover{background:#f9fafb}.bd-top-btn.edit{background:#dbeafe;color:#1e40af;border-color:#bfdbfe}.bd-top-btn.danger{background:#fee2e2;color:#dc2626;border-color:#fecaca}.bd-restored-hero{display:flex;gap:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.04)}.bd-restored-photo{flex-shrink:0;width:120px;height:110px;border-radius:14px;background:#f3f4f6;overflow:hidden;border:1px solid #e5e7eb;display:grid;place-items:center}.bd-restored-photo img{width:100%;height:100%;object-fit:cover}.bd-restored-photo .material-symbols-rounded{font-size:44px;color:#D4AF37}.bd-restored-main{flex:1;min-width:0}.bd-restored-main h1{margin:6px 0 4px;font-size:22px;font-weight:900}.bd-restored-main>p{margin:0;color:#64748b;font-size:13px;display:flex;align-items:center;gap:5px}.bd-restored-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.bd-restored-kpis>div{background:#f9fafb;border:1px solid #f0f0f0;border-radius:10px;padding:10px 12px}.bd-restored-kpis small{display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:3px}.bd-restored-kpis b{font-size:14px;font-weight:900;color:#111827}.bd-restored-tabs{display:flex;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:8px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.04)}.bd-restored-tab{height:40px;border:0;background:transparent;border-radius:10px;padding:0 14px;display:inline-flex;align-items:center;gap:7px;font-weight:800;font-size:13px;color:#64748b;cursor:pointer;white-space:nowrap}.bd-restored-tab .material-symbols-rounded{font-size:18px;color:#D4AF37}.bd-restored-tab.active{background:#fff7dd;color:#92400e}.bd-restored-panel{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.04)}.bd-restored-panel h3{margin:0 0 14px;font-size:15px;font-weight:900}.bd-info-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}@media(max-width:900px){.bd-restored-head{flex-direction:column;align-items:stretch}.bd-restored-hero{flex-direction:column}.bd-restored-kpis{grid-template-columns:repeat(2,1fr)}.bd-info-grid-4{grid-template-columns:repeat(2,1fr)}.bd-restored-tabs{overflow-x:auto}}';
    document.head.appendChild(s);
  }

  window.gpSwitchBienDetailTabClean = function(tab, btn) {
    document.querySelectorAll('#page-bien-detail .bd-restored-panel').forEach(function(p){p.style.display='none';});
    var p = document.getElementById('bdRestored-'+tab); if(p) p.style.display='block';
    document.querySelectorAll('#page-bien-detail .bd-restored-tab').forEach(function(b){b.classList.remove('active');});
    if(btn) btn.classList.add('active');
  };

  window.gpBackToBiens = function() {
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});
    try{ if(typeof window.navigate==='function') window.navigate('biens'); }catch(e){}
    setTimeout(function(){
      var p = document.getElementById('page-biens');
      if(p){p.classList.add('active');p.style.display='';}
      window.GP_CURRENT_PAGE='biens';
      try{
        if(window.renderBiensFinal) window.renderBiensFinal();
        else if(window.renderBiensFinal2) window.renderBiensFinal2();
        else if(window.renderBiens) window.renderBiens();
      }catch(e){console.error(e);}
    }, 20);
  };
  window.closeBienDetail = window.gpBackToBiens;

  window.gpAddBienDetailDocument = function() {
    var b = _bd_arr('biens')[Number(window._bienDetailIdx)]; if(!b) return;
    var f = document.getElementById('bdDocFile'), file = f&&f.files&&f.files[0];
    var name = _bd_clean((document.getElementById('bdDocName')||{}).value)||(file&&file.name)||'Document';
    if(!file){ if(window.toast) window.toast('Choisissez un fichier','err'); return; }
    var r = new FileReader();
    r.onload = function(){
      if(!Array.isArray(b.documents)) b.documents=[];
      b.documents.push({id:'DOC-'+Date.now(),nom:name,fileName:file.name,type:file.type||'',data:r.result,date:new Date().toISOString()});
      try{if(window.GPDB&&window.GPDB.save)window.GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){}
      window.openBienDetail(window._bienDetailIdx,'docs');
    };
    r.readAsDataURL(file);
  };
  window.gpOpenBienDoc = function(i) {
    var b=_bd_arr('biens')[Number(window._bienDetailIdx)];
    var doc=b&&Array.isArray(b.documents)&&b.documents[i];
    if(doc&&doc.data) window.open(doc.data,'_blank');
  };
  window.gpDeleteBienDoc = function(i) {
    var b=_bd_arr('biens')[Number(window._bienDetailIdx)];
    if(!b||!confirm('Supprimer ce document ?')) return;
    if(Array.isArray(b.documents)) b.documents.splice(i,1);
    try{if(window.GPDB&&window.GPDB.save)window.GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){}
    window.openBienDetail(window._bienDetailIdx,'docs');
  };

  window.openBienDetail = function(idx, tab) {
    idx = Number(idx);
    var b = _bd_arr('biens')[idx];
    if(!b){ if(window.toast) window.toast('Bien introuvable','err'); return; }
    window._bienDetailIdx = idx;
    _bd_injectCSS();

    var page = document.getElementById('page-bien-detail'); if(!page) return;
    var st = _bd_statusFor(b);
    var locs = _bd_locativesForBien(b);
    var units = _bd_unitsOf(b);
    var owner = _bd_findOwner(b);

    page.innerHTML =
      '<div class="bd-restored">' +
        /* ── Header ── */
        '<div class="bd-restored-head">' +
          '<button type="button" class="bd-top-btn" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span> Retour</button>' +
          '<div class="bd-restored-title"><h2>'+_bd_esc(b.nom||'Bien')+'</h2><p>'+_bd_esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div>' +
          '<div class="bd-restored-actions">' +
            '<button type="button" class="bd-top-btn edit" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button>' +
            '<button type="button" class="bd-top-btn danger" onclick="deleteRow&&deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button>' +
          '</div>' +
        '</div>' +
        /* ── Hero ── */
        '<div class="bd-restored-hero">' +
          '<div class="bd-restored-photo">'+(b.photo?'<img src="'+_bd_esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div>' +
          '<div class="bd-restored-main">' +
            '<div>'+_bd_statusBadge(st)+'</div>' +
            '<h1>'+_bd_esc(b.nom||'—')+'</h1>' +
            '<p><span class="material-symbols-rounded">location_on</span>'+_bd_esc(b.adresse||'Adresse non renseignée')+'</p>' +
            '<div class="bd-restored-kpis">' +
              '<div><small>Type</small><b>'+_bd_esc(b.type||'—')+'</b></div>' +
              '<div><small>Unités</small><b>'+units.length+'</b></div>' +
              '<div><small>Locations</small><b>'+locs.length+'</b></div>' +
              '<div><small>Propriétaire</small><b>'+_bd_esc((owner&&_bd_namePerson(owner))||_bd_ownerKeys(b)[0]||'—')+'</b></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        /* ── Onglets ── */
        '<div class="bd-restored-tabs">' +
          '<button class="bd-restored-tab active" onclick="gpSwitchBienDetailTabClean(\'infos\',this)"><span class="material-symbols-rounded">info</span> Informations</button>' +
          '<button class="bd-restored-tab" onclick="gpSwitchBienDetailTabClean(\'locataires\',this)"><span class="material-symbols-rounded">groups</span> Locataires</button>' +
          '<button class="bd-restored-tab" onclick="gpSwitchBienDetailTabClean(\'proprio\',this)"><span class="material-symbols-rounded">person</span> Propriétaire</button>' +
          '<button class="bd-restored-tab" onclick="gpSwitchBienDetailTabClean(\'docs\',this)"><span class="material-symbols-rounded">folder</span> Documents</button>' +
        '</div>' +
        /* ── Panel Infos ── */
        '<section id="bdRestored-infos" class="bd-restored-panel">' +
          '<h3>Caractéristiques</h3>' +
          '<div class="bd-info-grid-4">' +
            '<div style="background:#f9fafb;border-radius:10px;padding:12px"><label style="display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:4px">Type</label><b>'+_bd_esc(b.type||'—')+'</b></div>' +
            '<div style="background:#f9fafb;border-radius:10px;padding:12px"><label style="display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:4px">Adresse</label><b>'+_bd_esc(b.adresse||'—')+'</b></div>' +
            '<div style="background:#f9fafb;border-radius:10px;padding:12px"><label style="display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:4px">Vente</label><b>'+_bd_esc(b.vente||'Non')+'</b></div>' +
            '<div style="background:#f9fafb;border-radius:10px;padding:12px"><label style="display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:4px">Nb unités</label><b>'+units.length+'</b></div>' +
            '<div style="background:#f9fafb;border-radius:10px;padding:12px"><label style="display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:4px">Statut</label><b>'+_bd_esc(st)+'</b></div>' +
            '<div style="background:#fef9ec;border:1px solid #fde68a;border-radius:10px;padding:12px"><label style="display:block;font-size:10px;color:#92400e;text-transform:uppercase;font-weight:700;margin-bottom:4px">Valeur estimée</label><b style="color:#D4AF37;font-size:15px;font-weight:900">'+_bd_money(b.valeur||b.loyer||b.prix)+'</b></div>' +
          '</div>' +
          '<h3 style="margin-top:18px">Unités</h3>' +
          _bd_renderUnits(b) +
        '</section>' +
        /* ── Panel Locataires ── */
        '<section id="bdRestored-locataires" class="bd-restored-panel" style="display:none">' +
          '<h3>Locataires</h3>' +
          _bd_renderLocataires(b) +
        '</section>' +
        /* ── Panel Propriétaire ── */
        '<section id="bdRestored-proprio" class="bd-restored-panel" style="display:none">' +
          '<h3>Propriétaire</h3>' +
          _bd_renderOwner(b) +
        '</section>' +
        /* ── Panel Documents ── */
        '<section id="bdRestored-docs" class="bd-restored-panel" style="display:none">' +
          '<h3>Documents</h3>' +
          _bd_renderDocs(b) +
        '</section>' +
      '</div>';

    /* Activer la page */
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});
    page.classList.add('active');
    page.style.display = '';
    window.GP_CURRENT_PAGE = 'bien-detail';

    /* Aller sur le bon onglet si demandé */
    if(tab){
      setTimeout(function(){
        var btn = [].find.call(document.querySelectorAll('.bd-restored-tab'),function(x){return x.textContent.toLowerCase().indexOf(tab)>-1;});
        window.gpSwitchBienDetailTabClean(tab, btn);
      }, 0);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     5. generateContratPDF(idx) + genererPDFContrat(idx)
  ───────────────────────────────────────────────────────────── */
  function buildContratPDF(idx) {
    var d   = db();
    var all = Array.isArray(d.contrats) ? d.contrats : [];
    var c   = all[idx];
    if (!c) { gpToast('Contrat introuvable', 'err'); return; }

    var num   = c.num || c.numero || ('CT-' + (idx + 1));
    var today = new Date().toLocaleDateString('fr-FR');

    var statusColor = String(c.statut || '').toLowerCase() === 'actif'   ? '#dcfce7;color:#15803d' :
                      String(c.statut || '').toLowerCase() === 'résilié' ? '#fee2e2;color:#991b1b' :
                                                                           '#fef3c7;color:#92400e';

    var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">' +
      '<title>Contrat ' + esc(num) + '</title><style>' +
      'body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 32px;color:#1a1a1a;line-height:1.6}' +
      'h1{text-align:center;font-size:22px;margin-bottom:4px}' +
      '.sub{text-align:center;color:#6b7280;font-size:12px;margin-bottom:30px}' +
      '.section{margin-bottom:20px;padding:14px 18px;border:1px solid #e5e7eb;border-radius:8px}' +
      '.section h2{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #f3f4f6}' +
      '.row{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:6px}' +
      '.f label{font-size:10px;color:#9ca3af;display:block;margin-bottom:2px}' +
      '.f span{font-size:13px;font-weight:600;color:#111827}' +
      '.amount{font-size:18px;font-weight:800;color:#D4AF37}' +
      '.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:' + statusColor + '}' +
      '.sig{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:50px}' +
      '.sig-box{border-top:1px solid #374151;padding-top:8px;font-size:11px;color:#6b7280;text-align:center}' +
      '.foot{margin-top:36px;text-align:center;font-size:10px;color:#9ca3af;padding-top:12px;border-top:1px solid #f3f4f6}' +
      '@media print{body{margin:0}}' +
      '</style></head><body>' +
      '<h1>CONTRAT DE BAIL</h1>' +
      '<p class="sub">Réf. ' + esc(num) + ' · Édité le ' + today + '</p>' +
      '<div class="section"><h2>Parties</h2><div class="row">' +
        '<div class="f"><label>Locataire</label><span>' + esc(c.locataire || '—') + '</span></div>' +
        '<div class="f"><label>Location / Locative</label><span>' + esc(c.locative || c.bien || '—') + '</span></div>' +
      '</div><div class="row">' +
        '<div class="f"><label>Type de contrat</label><span>' + esc(c.type || 'Habitation') + '</span></div>' +
        '<div class="f"><label>Statut</label><span class="badge">' + esc(c.statut || 'Actif') + '</span></div>' +
      '</div></div>' +
      '<div class="section"><h2>Dates</h2><div class="row">' +
        '<div class="f"><label>Date de début</label><span>' + esc(c.debut || c.dateDebut || '—') + '</span></div>' +
        '<div class="f"><label>Date de fin</label><span>' + esc(c.fin || c.dateFin || '—') + '</span></div>' +
      '</div><div class="row">' +
        '<div class="f"><label>Prochain paiement</label><span>' + esc(c.prochain || c.prochainPaiement || '—') + '</span></div>' +
        '<div class="f"><label>Date de signature</label><span>' + esc(c.sign || '—') + '</span></div>' +
      '</div></div>' +
      '<div class="section"><h2>Montants</h2><div class="row">' +
        '<div class="f"><label>Loyer mensuel</label><span class="amount">' + money(c.loyer) + '</span></div>' +
        '<div class="f"><label>Charges</label><span>' + (c.charges ? money(c.charges) : '—') + '</span></div>' +
      '</div><div class="row">' +
        '<div class="f"><label>Caution</label><span>' + (c.caution ? money(c.caution) : '—') + '</span></div>' +
        '<div class="f"><label>Honoraires</label><span>' + (c.honor ? money(c.honor) : '—') + '</span></div>' +
      '</div></div>' +
      (c.obs ? '<div class="section"><h2>Observations</h2><p style="font-size:13px;color:#374151;margin:0">' + esc(c.obs) + '</p></div>' : '') +
      '<div class="sig"><div class="sig-box">Signature du bailleur / propriétaire</div><div class="sig-box">Signature du locataire</div></div>' +
      '<div class="foot">Document généré par Genius Property · ' + today + '</div>' +
      '</body></html>';

    var win = window.open('', '_blank');
    if (!win) { gpToast('Popup bloquée — autoriser les popups pour le PDF', 'err'); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(function() { win.print(); }, 400);
  }

  window.generateContratPDF = buildContratPDF;
  window.genererPDFContrat  = buildContratPDF;

  /* ─────────────────────────────────────────────────────────────
     6. openDepFacture(idx) — icône facture sur la page dépenses
  ───────────────────────────────────────────────────────────── */
  window.openDepFacture = function(idx) {
    var d   = db();
    var all = Array.isArray(d.depenses) ? d.depenses : [];
    var x   = all[idx];
    if (!x) { gpToast('Dépense introuvable', 'err'); return; }

    var src = x.factureData || x.factureUrl || x.facture;

    if (!src) {
      // Pas de fichier : modal informative avec accès rapide à l'édition
      var MID = 'gp-facture-info-modal';
      var old = document.getElementById(MID);
      if (old) old.remove();
      document.body.insertAdjacentHTML('beforeend',
        '<div id="' + MID + '" onclick="if(event.target===this)this.remove()" ' +
          'style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;' +
                 'display:flex;align-items:center;justify-content:center;padding:20px">' +
          '<div style="background:#fff;border-radius:16px;width:100%;max-width:420px;' +
                      'box-shadow:0 20px 60px rgba(0,0,0,.2)">' +
            '<div style="padding:18px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6">' +
              '<div style="font-size:16px;font-weight:800;color:#111827">Justificatif de dépense</div>' +
              '<button onclick="document.getElementById(\'' + MID + '\').remove()" style="border:0;background:0;color:#6b7280;cursor:pointer"><span class="material-symbols-rounded">close</span></button>' +
            '</div>' +
            '<div style="padding:20px 22px">' +
              '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:14px">' +
                '<div style="font-weight:700;font-size:13px;color:#111827">' + esc(x.libelle || x.titre || 'Dépense') + '</div>' +
                '<div style="font-size:12px;color:#6b7280;margin-top:4px">' +
                  esc(x.cat || '—') + ' · <b style="color:#D4AF37">' + money(x.montant) + '</b>' +
                '</div>' +
              '</div>' +
              '<div style="text-align:center;padding:16px;color:#9ca3af">' +
                '<span class="material-symbols-rounded" style="font-size:36px;display:block;margin-bottom:8px;color:#d1d5db">receipt_long</span>' +
                '<div style="font-size:13px">Aucun fichier justificatif attaché.</div>' +
                '<div style="font-size:11px;margin-top:4px">Modifiez la dépense pour en ajouter un.</div>' +
              '</div>' +
            '</div>' +
            '<div style="padding:14px 22px;border-top:1px solid #f3f4f6;display:flex;justify-content:flex-end;gap:8px">' +
              '<button onclick="document.getElementById(\'' + MID + '\').remove()" style="height:36px;padding:0 18px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#374151;cursor:pointer;font-weight:600">Fermer</button>' +
              '<button onclick="document.getElementById(\'' + MID + '\').remove();setTimeout(function(){editRow&&editRow(\'depenses\',' + idx + ')},80)" style="height:36px;padding:0 16px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px"><span class="material-symbols-rounded" style="font-size:14px">edit</span>Modifier</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      return;
    }

    // Afficher le fichier
    var isPDF = typeof src === 'string' && (src.startsWith('data:application/pdf') || /\.pdf$/i.test(src));
    if (isPDF) {
      var win = window.open('', '_blank');
      if (!win) { gpToast('Popup bloquée', 'err'); return; }
      win.document.write('<html><body style="margin:0"><embed src="' + src + '" width="100%" height="100%" type="application/pdf"></body></html>');
      win.document.close();
    } else {
      var IMG_ID = 'gp-facture-img-modal';
      var oldImg = document.getElementById(IMG_ID);
      if (oldImg) oldImg.remove();
      document.body.insertAdjacentHTML('beforeend',
        '<div id="' + IMG_ID + '" onclick="this.remove()" ' +
          'style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9100;' +
                 'display:flex;align-items:center;justify-content:center;cursor:zoom-out">' +
          '<img src="' + esc(src) + '" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5)">' +
        '</div>'
      );
    }
  };

  /* ─────────────────────────────────────────────────────────────
     PATCH — renderLocatairesModern : câbler le bouton Voir
  ───────────────────────────────────────────────────────────── */
  var _origRenderLocModern = window.renderLocatairesModern;
  window.renderLocatairesModern = function() {
    if (typeof _origRenderLocModern === 'function') _origRenderLocModern.apply(this, arguments);
    setTimeout(function() {
      var page = document.getElementById('page-locataires');
      if (!page) return;
      page.querySelectorAll('.prop-actions').forEach(function(actionsDiv) {
        var btn = actionsDiv.querySelector('.prop-action-btn:not([onclick])');
        if (!btn) return;
        var icon = btn.querySelector('.material-symbols-rounded');
        if (!icon || icon.textContent.trim() !== 'visibility') return;
        var tr   = btn.closest('tr');
        var tbody = tr && tr.closest('tbody');
        if (!tbody) return;
        var rowIdx = Array.from(tbody.querySelectorAll('tr')).indexOf(tr);
        if (rowIdx < 0) return;
        btn.onclick = function(e) { e.stopPropagation(); window.viewRow && window.viewRow('locataires', rowIdx); };
        btn.title = 'Voir';
      });
    }, 80);
  };

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      var active = document.querySelector('.page.active');
      if (active && active.id === 'page-locataires') {
        window.renderLocatairesModern && window.renderLocatairesModern();
      }
    }, 800);
  });

  console.info('[GP] missing-actions.js chargé ✓');

})();
