/* Genius Property V13 — module Contrats
   Objectif : isoler la création/validation des contrats hors du bundle legacy.
   Ce fichier surcharge volontairement saveContrat() appelé par le HTML existant.
*/
(function(){
  'use strict';

  const Forms = window.GPForms || {};
  const $ = Forms.$ || ((id) => document.getElementById(id));
  const valueOf = Forms.value || ((id) => {
    const el = $(id);
    return el ? String(el.value || '') : '';
  });
  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}));
  const save = () => (window.GPDB && window.GPDB.save ? window.GPDB.save(db()) : (typeof window.saveDB === 'function' ? window.saveDB() : undefined));
  const notify = (message, type) => {
    if (typeof window.toast === 'function') return window.toast(message, type);
    console[type === 'err' ? 'error' : 'log'](message);
  };
  const fieldError = (id, message) => {
    if (typeof window.gp_fieldError === 'function') return window.gp_fieldError(id, message);
    const el = $(id);
    if (el) {
      el.focus();
      el.style.borderColor = '#E24B4A';
      el.addEventListener('input', () => { el.style.borderColor = ''; }, { once:true });
      el.addEventListener('change', () => { el.style.borderColor = ''; }, { once:true });
    }
    notify(message, 'err');
    return false;
  };
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const parseAmount = (value) => {
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(value);
    if (typeof window.num === 'function') return window.num(value);
    const cleaned = String(value || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const todayKey = () => new Date().toISOString().split('T')[0];

  function locataireExists(name) {
    if (!(db().locataires || []).length) return true;
    return (db().locataires || []).some(l => {
      const full = [l.prenom, l.nom].filter(Boolean).join(' ');
      return normalize(full) === normalize(name) || normalize(l.nom) === normalize(name);
    });
  }

  function locativeExists(name) {
    if (!(db().locatives || []).length) return true;
    return (db().locatives || []).some(l => normalize(l.nom) === normalize(name) || normalize(l.bien) === normalize(name));
  }

  function hasActiveDuplicate(data) {
    return (db().contrats || []).some(c => {
      const sameTenant = normalize(c.locataire) === normalize(data.locataire);
      const sameUnit = normalize(c.locative) === normalize(data.locative);
      const active = !c.statut || ['actif','en attente'].includes(normalize(c.statut));
      return sameTenant && sameUnit && active;
    });
  }

  function validateContratForm() {
    const data = {
      num: valueOf('ct-num').trim() || ('CT-' + Date.now()),
      locataire: valueOf('ct-locataire').trim(),
      locative: valueOf('ct-locative').trim(),
      type: valueOf('ct-type').trim() || 'Bail habitation',
      debut: valueOf('ct-debut').trim(),
      fin: valueOf('ct-fin').trim(),
      statut: valueOf('ct-statut').trim() || 'Actif',
      prochain: valueOf('ct-prochain').trim(),
      loyer: valueOf('ct-loyer').trim(),
      charges: valueOf('ct-charges').trim(),
      caution: valueOf('ct-caution').trim(),
      honor: valueOf('ct-honor').trim(),
      frais: valueOf('ct-frais').trim(),
      obs: valueOf('ct-obs').trim() || 'Néant',
      sign: valueOf('ct-sign').trim() || valueOf('ct-debut').trim() || todayKey()
    };

    if (!data.locataire) return { ok:false, field:'ct-locataire', message:'Le locataire est requis' };
    if (!locataireExists(data.locataire)) return { ok:false, field:'ct-locataire', message:'Le locataire sélectionné est introuvable' };
    if (!data.locative) return { ok:false, field:'ct-locative', message:'La locative est requise' };
    if (!locativeExists(data.locative)) return { ok:false, field:'ct-locative', message:'La locative sélectionnée est introuvable' };
    if (!data.debut) return { ok:false, field:'ct-debut', message:'La date de début est requise' };
    if (Number.isNaN(new Date(data.debut).getTime())) return { ok:false, field:'ct-debut', message:'La date de début est invalide' };
    if (data.fin && Number.isNaN(new Date(data.fin).getTime())) return { ok:false, field:'ct-fin', message:'La date de fin est invalide' };
    if (data.fin && new Date(data.fin) <= new Date(data.debut)) {
      return { ok:false, field:'ct-fin', message:'La date de fin doit être après la date de début' };
    }
    if (data.sign && Number.isNaN(new Date(data.sign).getTime())) return { ok:false, field:'ct-sign', message:'La date de signature est invalide' };

    const loyer = parseAmount(data.loyer);
    if (!data.loyer || !Number.isFinite(loyer) || loyer <= 0) {
      return { ok:false, field:'ct-loyer', message:'Le loyer doit être supérieur à 0' };
    }

    const amountFields = [
      ['ct-charges', 'charges', 'Les charges ne peuvent pas être négatives'],
      ['ct-caution', 'caution', 'La caution ne peut pas être négative'],
      ['ct-honor', 'honor', 'Les honoraires ne peuvent pas être négatifs'],
      ['ct-frais', 'frais', 'Les frais de dossier ne peuvent pas être négatifs']
    ];
    for (const [field, key, message] of amountFields) {
      if (!data[key]) continue;
      const amount = parseAmount(data[key]);
      if (!Number.isFinite(amount) || amount < 0) return { ok:false, field, message };
    }

    if ((db().contrats || []).some(c => normalize(c.num) === normalize(data.num))) {
      return { ok:false, field:'ct-num', message:'Ce numéro de contrat existe déjà' };
    }
    if (hasActiveDuplicate(data)) {
      return { ok:false, field:'ct-locative', message:'Un contrat actif existe déjà pour ce locataire et cette locative' };
    }

    if (!data.prochain) data.prochain = data.debut;
    return { ok:true, data };
  }

  function syncRelatedRecords(data, targetDb) {
    const sourceDb = targetDb || db();
    const locative = (sourceDb.locatives || []).find(l => normalize(l.nom) === normalize(data.locative) || normalize(l.bien) === normalize(data.locative));
    if (locative) {
      locative.locataire = locative.locataire || data.locataire;
      locative.occupant = locative.occupant || data.locataire;
      locative.statut = data.statut === 'Actif' ? 'Loué' : (locative.statut || 'Loué');
    }
    const locataire = (sourceDb.locataires || []).find(l => normalize([l.prenom, l.nom].filter(Boolean).join(' ')) === normalize(data.locataire) || normalize(l.nom) === normalize(data.locataire));
    if (locataire && locative) locataire.bien = locataire.bien || (locative.bien || locative.nom || data.locative);
  }

  async function saveContrat() {
    const result = validateContratForm();
    if (!result.ok) return fieldError(result.field, result.message);

    const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(_db.contrats)) _db.contrats = [];
    const contrat = result.data;
    contrat.createdAt = new Date().toISOString();
    _db.contrats.push(contrat);
    syncRelatedRecords(contrat, _db);

    if (typeof window.auditLog === 'function') {
      window.auditLog('Ajout', 'Contrats', `${contrat.num} — ${contrat.locataire}`);
    }
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    if (typeof window.resetAfterSave === 'function') window.resetAfterSave('page-nv-contrat');
    if (typeof window.renderContrats === 'function') window.renderContrats();
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    if (typeof window.navigate === 'function') window.navigate('contrats');
    notify('Contrat créé avec succès ✓');
  }

  function fillContratSelectsSafe() {
    const num = 'CT-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    const el = $('ct-num');
    if (el && !el.value) el.value = num;
    const sl = $('ct-locataire');
    if (sl) sl.innerHTML = '<option value="">Sélectionner</option>' + (db().locataires || []).map(l => {
      const full = [l.prenom, l.nom].filter(Boolean).join(' ').trim() || l.nom || '';
      return `<option>${full}</option>`;
    }).join('');
    const slv = $('ct-locative');
    if (slv) slv.innerHTML = '<option value="">Sélectionner</option>' + (db().locatives || []).map(l => `<option>${l.nom || l.bien || ''}</option>`).join('');
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.contrats = {
    validateContratForm,
    saveContrat,
    fillContratSelectsSafe
  };
  window.saveContrat = saveContrat;
  window.fillContratSelects = fillContratSelectsSafe;

  // [cleaned] debug console statement removed
})();


/* ================================================================
   CONSOLIDATION — affichage contrats
   Anciennement chargé via fichiers patch séparés.
================================================================ */


/* ===== Source consolidée: js/pages/fix-contrats-affichage.js ===== */
/* Correctif final : supprime l'erreur "Erreur affichage : page:contrats".
   Cause : certains scripts appelaient encore l'ancien renderer renderContrats(), qui cherche
   les anciens éléments tbl-contrats / pag-contrats après que la page ait été modernisée.
*/
(function(){
  'use strict';
  function esc(v){
    if(window.GPRenderers && window.GPRenderers.esc) return window.GPRenderers.esc(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});
  }
  function money(v){
    if(window.GPRenderers && window.GPRenderers.money) return window.GPRenderers.money(v);
    var n=Math.round(Number(String(v||0).replace(/[^0-9.-]/g,''))||0);
    return n.toLocaleString('fr-FR')+' FCFA';
  }
  function db(){ return (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {})); }
  function num(v){ return Number(String(v||0).replace(/[^0-9.-]/g,''))||0; }
  function statusClass(s){ s=String(s||'').toLowerCase(); return s.indexOf('actif')>-1?'ok':(s.indexOf('attente')>-1?'wait':'off'); }
  function iconBtn(cls, icon, title, action){
    return '<button class="gp-icon '+cls+'" title="'+esc(title)+'" onclick="'+action+'"><span class="material-symbols-rounded">'+esc(icon)+'</span></button>';
  }
  var PAGE = { contrats: 1 };
  var PS = { contrats: 10 };
  function pageBtns(total){
    var max=Math.max(1,Math.ceil(total/PS.contrats));
    PAGE.contrats=Math.min(Math.max(1,PAGE.contrats),max);
    var h='<div class="gp-pages"><button class="gp-page-btn" '+(PAGE.contrats<=1?'disabled':'')+' onclick="gpContratsPage('+(PAGE.contrats-1)+')"><span class="material-symbols-rounded" style="font-size:15px">chevron_left</span></button>';
    for(var i=1;i<=max;i++) h+='<button class="gp-page-btn '+(i===PAGE.contrats?'active':'')+'" onclick="gpContratsPage('+i+')">'+i+'</button>';
    return h+'<button class="gp-page-btn" '+(PAGE.contrats>=max?'disabled':'')+' onclick="gpContratsPage('+(PAGE.contrats+1)+')"><span class="material-symbols-rounded" style="font-size:15px">chevron_right</span></button></div>';
  }
  window.gpContratsPage=function(p){ PAGE.contrats=p; renderContratsSafe(); };
  function ensureStyles(){
    if(document.getElementById('gp-contrats-safe-style')) return;
    var css=document.createElement('style'); css.id='gp-contrats-safe-style';
    css.textContent='.gp-modern-page{padding:8px 24px}.gp-page-top{display:flex;gap:12px;align-items:center;margin-bottom:8px}.gp-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;flex:1}.gp-stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px 16px;display:flex;gap:12px;align-items:center;box-shadow:0 10px 25px rgba(15,23,42,.05)}.gp-stat-ico{width:38px;height:38px;border-radius:12px;background:#f8fafc;color:#e0aa12;display:grid;place-items:center}.gp-stat-card strong{display:block;font-size:22px}.gp-stat-card span{display:block;font-weight:700;font-size:13px}.gp-stat-card em{display:block;font-style:normal;color:#94a3b8;font-size:12px}.gp-primary{background:#2563eb;color:#fff;border:0;border-radius:9px;padding:11px 16px;font-weight:700;display:flex;gap:7px;align-items:center;cursor:pointer}.gp-outline{background:#fff;border:1px solid #e5e7eb;border-radius:9px;padding:9px 13px;display:inline-flex;gap:6px;align-items:center;cursor:pointer}.gp-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:8px}.gp-search{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:0 10px;display:flex;align-items:center;gap:7px;height:38px}.gp-search input{border:0;outline:0;background:transparent;min-width:230px}.gp-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.04)}.gp-table{width:100%;border-collapse:collapse}.gp-table th{background:#fffbf2;text-transform:uppercase;font-size:12px;padding:12px;text-align:left}.gp-table td{padding:13px 12px;border-top:1px solid #eef2f7}.gp-actions{display:flex;gap:7px;justify-content:center}.gp-icon{width:30px;height:30px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:grid;place-items:center;cursor:pointer}.gp-icon span{font-size:17px}.gp-icon.view{color:#0284c7}.gp-icon.edit{color:#ca8a04}.gp-icon.docs{color:#d97706}.gp-icon.del{color:#ef4444}.gp-pill{display:inline-flex;align-items:center;border-radius:999px;padding:3px 9px;font-weight:700;font-size:12px}.gp-pill.ok{background:#dcfce7;color:#15803d}.gp-pill.wait{background:#fef3c7;color:#92400e}.gp-pill.off{background:#f1f5f9;color:#475569}.gp-footer{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-top:1px solid #eef2f7;color:#64748b}.gp-pages{display:flex;gap:7px}.gp-page-btn{width:34px;height:34px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;display:grid;place-items:center;cursor:pointer}.gp-page-btn.active{background:#2563eb;color:#fff;border-color:#2563eb}.gp-page-btn:disabled{opacity:.45;cursor:not-allowed}';
    document.head.appendChild(css);
  }
  function renderContratsSafe(){
    ensureStyles();
    var page=document.getElementById('page-contrats'); if(!page) return;
    var d=db(), all=Array.isArray(d.contrats)?d.contrats:[];
    var q=(document.getElementById('gpContratSearch')||{}).value||'';
    var data=all.filter(function(c){return !q||JSON.stringify(c).toLowerCase().indexOf(q.toLowerCase())>-1;});
    var start=(PAGE.contrats-1)*PS.contrats, slice=data.slice(start,start+PS.contrats);
    var actifs=all.filter(function(c){return String(c.statut||'Actif').toLowerCase()==='actif';}).length;
    page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">description</span></div><div><strong>'+all.length+'</strong><span>Contrats</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">verified</span></div><div><strong>'+actifs+'</strong><span>Actifs</span><em>Contrats actifs</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,c){return s+num(c.loyer);},0))+'</strong><span>Loyers</span><em>Total contrats</em></div></div></div><button class="gp-primary" onclick="openGpDrawer?openGpDrawer(\'contrat\'):navigate(\'nv-contrat\')"><span class="material-symbols-rounded">add</span>Nouveau contrat</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpContratSearch" value="'+esc(q)+'" placeholder="Rechercher un contrat…" oninput="gpContratsPage(1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Locataire</th><th>Locative</th><th>Type contrat</th><th>Date début</th><th>Date fin</th><th>Statut</th><th>Prochain paiement</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(c){var i=all.indexOf(c);return '<tr><td><b>'+esc(c.locataire||'—')+'</b><br><small style="color:#64748b">'+esc(c.num||c.numero||('CT-'+(i+1)))+'</small></td><td>'+esc(c.locative||c.bien||'—')+'</td><td>'+esc(c.type||'Habitation')+'</td><td>'+esc(c.debut||c.dateDebut||'—')+'</td><td>'+esc(c.fin||c.dateFin||'—')+'</td><td><span class="gp-pill '+statusClass(c.statut)+'">'+esc(c.statut||'Actif')+'</span></td><td>'+esc(c.prochain||c.prochainPaiement||'—')+'</td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'contrats\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'contrats\','+i+')')+iconBtn('docs','picture_as_pdf','PDF','(generateContratPDF||genererPDFContrat)&&((generateContratPDF||genererPDFContrat)('+i+'))')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'contrats\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.contrats,data.length)+' sur '+data.length+' contrat'+(data.length>1?'s':'')+'</span>'+pageBtns(data.length)+'</div>':'<div style="padding:30px;text-align:center;color:#94a3b8">Aucun contrat trouvé</div>')+'</div></div>';
  }
  function activate(page){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
    var el=document.getElementById('page-'+page); if(el) el.classList.add('active');
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){li.classList.toggle('active', li.dataset.page===page);});
    if(window.GPNavigation && window.GPNavigation.updateBreadcrumb) window.GPNavigation.updateBreadcrumb(page);
    if(typeof window.appliqueDroitsPage==='function') window.appliqueDroitsPage(page);
    window.GP_CURRENT_PAGE=page;
  }
  window.renderContrats = renderContratsSafe;
  window.renderContratsFinal = renderContratsSafe;
  if(window.GPNavigation && window.GPNavigation.registerRenderer) window.GPNavigation.registerRenderer('contrats', renderContratsSafe);
  var oldRenderPage=window.renderPage;
  window.renderPage=function(p){ if(p==='contrats'){renderContratsSafe();return;} return oldRenderPage?oldRenderPage.apply(this,arguments):undefined; };
  var oldNavigate=window.navigate;
  window.navigate=function(p){
    if(p==='contrats'){ activate('contrats'); renderContratsSafe(); return 'contrats'; }
    if(p==='nv-contrat'){ if(typeof window.openGpDrawer==='function') { openGpDrawer('contrat'); return 'nv-contrat'; } }
    return oldNavigate?oldNavigate.apply(this,arguments):undefined;
  };
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ var a=document.querySelector('.page.active'); if(a && a.id==='page-contrats') renderContratsSafe(); },300); });
})();

