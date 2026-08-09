/* Genius Property — module Locataires
   Formulaire locataire aligné sur le drawer Propriétaire.
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
  const todayISO = () => new Date().toISOString().split('T')[0];

  function cleanPhone(value) { return String(value || '').replace(/[\s().-]/g, ''); }
  function validPhone(value) { return /^[0-9+]{8,15}$/.test(cleanPhone(value)); }
  function validDate(value) { return !value || !Number.isNaN(new Date(value).getTime()); }
  function fullName(data) { return [data.prenom, data.nom].filter(Boolean).join(' ').trim(); }

  function isDuplicateLocataire(data) {
    const nom = normalize(data.nom);
    const prenom = normalize(data.prenom);
    const tel = cleanPhone(data.tel);
    return (db().locataires || []).some(l => {
      const sameName = normalize(l.nom) === nom && normalize(l.prenom) === prenom;
      const samePhone = tel && cleanPhone(l.tel) === tel;
      return sameName || samePhone;
    });
  }

  function validateLocataireForm() {
    const data = {
      nom: valueOf('lc-nom').trim() || valueOf('nvl-nom').trim(),
      prenom: valueOf('lc-prenom').trim() || valueOf('nvl-prenom').trim(),
      naiss: valueOf('lc-naiss').trim() || valueOf('nvl-naiss').trim(),
      matri: valueOf('lc-matri').trim() || valueOf('nvl-matri').trim(),
      adresse: valueOf('lc-adresse').trim() || valueOf('nvl-adresse').trim(),
      tel: valueOf('lc-tel').trim() || valueOf('nvl-tel').trim(),
      email: valueOf('lc-email').trim() || valueOf('nvl-email').trim(),
      type: 'Particulier'
    };

    if (!data.prenom) return { ok:false, field:'nvl-prenom', message:'Le prénom est requis' };
    if (!data.nom) return { ok:false, field:'nvl-nom', message:'Le nom est requis' };
    if (!data.tel) return { ok:false, field:'nvl-tel', message:'Le téléphone est requis' };
    if (!data.adresse) return { ok:false, field:'nvl-adresse', message:'L’adresse est requise' };
    if (!validDate(data.naiss)) return { ok:false, field:'nvl-naiss', message:'La date de naissance est invalide' };
    if (!validPhone(data.tel)) return { ok:false, field:'nvl-tel', message:'Numéro de téléphone invalide' };
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { ok:false, field:'nvl-email', message:'Adresse email invalide' };
    }
    if (isDuplicateLocataire(data)) return { ok:false, field:'nvl-nom', message:'Un locataire similaire existe déjà' };
    return { ok:true, data };
  }

  async function saveLocataire() {
    const result = validateLocataireForm();
    if (!result.ok) return fieldError(result.field, result.message);
    const data = result.data;
    const photoInput = $('lc-photo-input') ? 'lc-photo-input' : 'nvl-photo-input';
    const photo = typeof window.getPhotoData === 'function' ? await window.getPhotoData(photoInput) : '';
    const _db = db();
    if (!Array.isArray(_db.locataires)) _db.locataires = [];
    _db.locataires.push({
      id: typeof window.genId === 'function' ? window.genId('LC') : ('LC-' + Date.now()),
      nom: data.nom,
      prenom: data.prenom,
      naiss: data.naiss,
      matri: data.matri,
      adresse: data.adresse,
      tel: data.tel,
      email: data.email,
      bien: '-',
      type: 'Particulier',
      date: todayISO(),
      statut: 'Actif',
      photo: photo || ''
    });
    if (typeof window.auditLog === 'function') window.auditLog('Ajout', 'Locataires', 'Nouveau locataire : ' + fullName(data));
    window.DB = _db;
    try { localStorage.setItem('geniusproperty_db_clean_v1', JSON.stringify(_db)); } catch(e) {}
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') window.saveDB();
    if (typeof window.renderLocatairesModern === 'function') window.renderLocatairesModern();
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    if (typeof window.navigate === 'function') window.navigate('locataires');
    notify('Locataire enregistré avec succès ✓');
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.locataires = { validateLocataireForm, saveLocataire, validPhone, cleanPhone };
  window.saveLocataire = saveLocataire;
})();


/* ================================================================
   CONSOLIDATION — locataires final
   Anciennement chargé via fichiers patch séparés.
================================================================ */


/* ===== Source consolidée: js/pages/locataires-profession-fix.js ===== */
(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function loadDB(){
    try{ if(window.GPDB&&window.GPDB.load) return window.GPDB.load(); }catch(e){}
    try{ return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}'); }catch(e){ return window.DB||{}; }
  }
  async function saveDB(db){
    window.DB=db;
    try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(db));}catch(e){}
    try{ if(window.GPDB&&window.GPDB.save){ await window.GPDB.save(db); return; } }catch(e){}
    try{ if(window.saveDB) window.saveDB(); }catch(e){}
  }
  function nameOf(l){ return ([l.prenom,l.nom].filter(Boolean).join(' ') || l.nom || 'Locataire').trim(); }
  function initialsFromName(n){ var parts=String(n||'').trim().split(/\s+/).filter(Boolean); return ((parts[0]||'L')[0]+(parts[1]||parts[0]||'C')[0]).toUpperCase(); }
  function locBien(l){ return (l.bien && l.bien!=='-' && l.bien!=='Aucun bien associé') ? l.bien : '—'; }
  function professionOf(l){ return (l.profession || l.metier || 'Locataire'); }
  function photoData(){ return new Promise(function(resolve){ var input=document.getElementById('nvl-photo-input'), file=input&&input.files&&input.files[0]; if(!file) return resolve(''); var r=new FileReader(); r.onload=function(e){resolve(e.target.result||'')}; r.onerror=function(){resolve('')}; r.readAsDataURL(file); }); }
  function ensureProfessionField(){
    var drawer=document.getElementById('nvLocDrawer'); if(!drawer || document.getElementById('nvl-profession')) return;
    var nom=document.getElementById('nvl-nom'); if(!nom) return;
    var row=nom.closest('.nde-row'); if(!row) return;
    var prof=document.createElement('div');
    prof.className='nde-row full';
    prof.innerHTML='<div class="nde-field"><label class="nde-label">Profession</label><input class="nde-input" id="nvl-profession" placeholder="Profession"></div>';
    row.parentNode.insertBefore(prof,row.nextSibling);
  }
  var oldOpen=window.openNouvelLocataireDrawer;
  window.openNouvelLocataireDrawer=function(){
    if(oldOpen) oldOpen();
    ensureProfessionField();
    var e=document.getElementById('nvl-profession'); if(e) e.value='';
  };
  window.saveLocataireFromDrawer=async function(){
    var prenom=(document.getElementById('nvl-prenom')||{}).value||'', nom=(document.getElementById('nvl-nom')||{}).value||'', profession=(document.getElementById('nvl-profession')||{}).value||'', tel=(document.getElementById('nvl-tel')||{}).value||'', adresse=(document.getElementById('nvl-adresse')||{}).value||'';
    prenom=prenom.trim(); nom=nom.trim(); profession=profession.trim(); tel=tel.trim(); adresse=adresse.trim();
    if(!prenom) return window.toast?toast('Le prénom est requis','err'):alert('Le prénom est requis');
    if(!nom) return window.toast?toast('Le nom est requis','err'):alert('Le nom est requis');
    if(!tel) return window.toast?toast('Le téléphone est requis','err'):alert('Le téléphone est requis');
    if(!adresse) return window.toast?toast('L’adresse est requise','err'):alert('L’adresse est requise');
    var btn=document.getElementById('nvl-save-btn'); if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    var db=loadDB(); if(!Array.isArray(db.locataires)) db.locataires=[];
    db.locataires.push({id:window.genId?genId('LC'):('LC-'+Date.now()),prenom:prenom,nom:nom,profession:profession,naiss:(document.getElementById('nvl-naiss')||{}).value||'',matri:(document.getElementById('nvl-matri')||{}).value||'',tel:tel,email:(document.getElementById('nvl-email')||{}).value||'',adresse:adresse,bien:'-',type:'Particulier',date:new Date().toISOString().split('T')[0],statut:'Actif',photo:await photoData()});
    await saveDB(db);
    try{ if(window.auditLog) window.auditLog('Ajout','Locataires','Nouveau locataire : '+prenom+' '+nom); }catch(e){}
    try{ if(window.closeNouvelLocataireDrawer) closeNouvelLocataireDrawer(); }catch(e){}
    if(window.renderLocatairesModern) window.renderLocatairesModern();
    try{ if(window.updateSidebarBadges) updateSidebarBadges(); }catch(e){}
    if(window.toast) toast('Locataire enregistré avec succès ✓');
    if(btn){btn.disabled=false;btn.textContent='Enregistrer';}
  };
  window.renderLocatairesModern=function(){
    var page=document.getElementById('page-locataires'); if(!page) return;
    var db=loadDB(), all=Array.isArray(db.locataires)?db.locataires:[];
    var currentQ=(document.getElementById('gpLocSearch')&&document.getElementById('gpLocSearch').value)||'';
    var currentType=(document.getElementById('gpLocType')&&document.getElementById('gpLocType').value)||'';
    var currentStatut=(document.getElementById('gpLocStatut')&&document.getElementById('gpLocStatut').value)||'';
    var q=currentQ.toLowerCase().trim();
    var data=all.filter(function(l){ var blob=[l.prenom,l.nom,l.profession,l.metier,l.bien,l.tel,l.email,l.type,l.statut].join(' ').toLowerCase(); return (!q||blob.indexOf(q)>-1)&&(!currentType||(l.type||'Particulier')===currentType)&&(!currentStatut||(l.statut||'Actif')===currentStatut); });
    var avecBien=all.filter(function(l){return locBien(l)!=='—';}).length;
    var actifs=all.filter(function(l){return String(l.statut||'Actif').toLowerCase()==='actif';}).length;
    var rows=data.map(function(l){
      var idx=all.indexOf(l), nm=nameOf(l), active=String(l.statut||'Actif').toLowerCase()==='actif';
      var avatar=l.photo?'<img src="'+esc(l.photo)+'" alt="'+esc(nm)+'">':esc(initialsFromName(nm));
      return '<tr><td><div class="loc-person"><span class="loc-avatar">'+avatar+'</span><div><b>'+esc(nm)+'</b><small>'+esc(professionOf(l))+'</small></div></div></td><td><span class="loc-line"><span class="material-symbols-rounded">home</span>'+esc(locBien(l))+'</span></td><td><span class="loc-line"><span class="material-symbols-rounded">call</span>'+esc(l.tel||'—')+'</span></td><td><span class="loc-line"><span class="material-symbols-rounded">mail</span>'+esc(l.email||'—')+'</span></td><td>'+esc(l.type||'Particulier')+'</td><td><span class="loc-pill '+(active?'ok':'off')+'">'+esc(l.statut||'Actif')+'</span></td><td><div class="loc-actions">'+
        '<button class="loc-action view" title="Voir" onclick="viewRow(\'locataires\','+idx+')"><span class="material-symbols-rounded">visibility</span></button>'+ 
        '<button class="loc-action edit" title="Modifier" onclick="editRow(\'locataires\','+idx+')"><span class="material-symbols-rounded">edit</span></button>'+ 
        '<button class="loc-action docs" title="Documents" onclick="openLocataireDocs('+idx+')"><span class="material-symbols-rounded">folder</span></button>'+ 
        '<button class="loc-action del" title="Supprimer" onclick="delRow(\'locataires\','+idx+')"><span class="material-symbols-rounded">delete</span></button>'+ 
      '</div></td></tr>';
    }).join('');
    page.innerHTML='<div class="locv2"><style>'+ 
      '#page-locataires .locv2{padding:24px}#page-locataires .loc-top{display:flex;align-items:center;gap:16px;margin-bottom:16px}#page-locataires .loc-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;flex:1}#page-locataires .loc-kpi{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;display:flex;align-items:center;gap:14px;min-height:74px}#page-locataires .loc-kpi-ico{width:38px;height:38px;border-radius:10px;background:#fffbeb;color:#D4AF37;display:flex;align-items:center;justify-content:center}#page-locataires .loc-kpi:nth-child(2) .loc-kpi-ico{background:#eff6ff;color:#3b82f6}#page-locataires .loc-kpi:nth-child(3) .loc-kpi-ico{background:#ecfdf5;color:#10b981}#page-locataires .loc-kpi strong{display:block;font-size:23px;line-height:1;color:#111827}#page-locataires .loc-kpi span{display:block;font-size:12px;font-weight:700;color:#374151;margin-top:4px}#page-locataires .loc-kpi em{display:block;font-style:normal;font-size:11px;color:#9ca3af}#page-locataires .loc-new{height:40px;padding:0 18px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer;white-space:nowrap}#page-locataires .loc-tools{display:flex;align-items:center;gap:8px;margin-bottom:14px}#page-locataires .loc-search{width:240px;height:34px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;display:flex;align-items:center;gap:7px;padding:0 10px}#page-locataires .loc-search input{border:0;outline:0;background:transparent;width:100%;font-size:13px}#page-locataires .loc-select{height:34px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#374151}#page-locataires .loc-tools-right{margin-left:auto;display:flex;align-items:center;gap:8px}#page-locataires .loc-btn-sm{height:34px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:0 12px;display:inline-flex;align-items:center;gap:5px;font-size:13px;color:#374151;cursor:pointer}#page-locataires .loc-count{font-size:12px;color:#9ca3af;margin-left:8px}#page-locataires .loc-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}#page-locataires .loc-table{width:100%;border-collapse:collapse}#page-locataires .loc-table th{padding:9px 10px;background:#fffaf0;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px;text-transform:uppercase;color:#111827}#page-locataires .loc-table th:last-child{text-align:center}#page-locataires .loc-table td{padding:9px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;vertical-align:middle}#page-locataires .loc-table tr:last-child td{border-bottom:0}#page-locataires .loc-person{display:flex;align-items:center;gap:8px}#page-locataires .loc-avatar{width:28px;height:28px;border-radius:9px;background:#D4AF37;color:#111827;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none}#page-locataires .loc-avatar img{width:100%;height:100%;object-fit:cover}#page-locataires .loc-person b{font-size:13px;color:#111827;display:block}#page-locataires .loc-person small{display:block;font-size:11px;color:#64748b;margin-top:1px}#page-locataires .loc-line{display:inline-flex;align-items:center;gap:6px;color:#0f172a}#page-locataires .loc-line .material-symbols-rounded{font-size:15px;color:#64748b}#page-locataires .loc-pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700}#page-locataires .loc-pill.ok{background:#dcfce7;color:#15803d}#page-locataires .loc-pill.off{background:#fee2e2;color:#b91c1c}#page-locataires .loc-actions{display:flex;align-items:center;justify-content:center;gap:6px}#page-locataires .loc-action{width:26px;height:26px;border-radius:7px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}#page-locataires .loc-action span{font-size:16px}#page-locataires .loc-action.view{color:#0284c7}#page-locataires .loc-action.edit{color:#ca8a04}#page-locataires .loc-action.docs{color:#0f172a}#page-locataires .loc-action.del{color:#dc2626}#page-locataires .loc-footer{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f3f4f6;color:#64748b;font-size:13px}#page-locataires .loc-pages{display:flex;gap:6px}.loc-page{width:30px;height:30px;border:1px solid #e5e7eb;border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center}.loc-page.active{background:#2563eb;border-color:#2563eb;color:#fff}#page-locataires .loc-empty{padding:42px;text-align:center;color:#9ca3af}'+
      '</style><div class="loc-top"><div class="loc-kpis"><div class="loc-kpi"><div class="loc-kpi-ico"><span class="material-symbols-rounded">groups</span></div><div><strong>'+all.length+'</strong><span>Locataires</span><em>Total enregistrés</em></div></div><div class="loc-kpi"><div class="loc-kpi-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+avecBien+'</strong><span>Avec bien</span><em>Logement associé</em></div></div><div class="loc-kpi"><div class="loc-kpi-ico"><span class="material-symbols-rounded">verified_user</span></div><div><strong>'+actifs+'</strong><span>Actifs</span><em>Dossiers actifs</em></div></div></div><button class="loc-new" onclick="openNouvelLocataireDrawer()"><span class="material-symbols-rounded" style="font-size:17px">person_add</span> Nouveau locataire</button></div><div class="loc-tools"><label class="loc-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpLocSearch" value="'+esc(currentQ)+'" placeholder="Rechercher un locataire…" oninput="renderLocatairesModern()"></label><select id="gpLocType" class="loc-select" onchange="renderLocatairesModern()"><option value="">Tous les types</option><option '+(currentType==='Particulier'?'selected':'')+'>Particulier</option><option '+(currentType==='Entreprise'?'selected':'')+'>Entreprise</option></select><select id="gpLocStatut" class="loc-select" onchange="renderLocatairesModern()"><option value="">Tous les statuts</option><option '+(currentStatut==='Actif'?'selected':'')+'>Actif</option><option '+(currentStatut==='Inactif'?'selected':'')+'>Inactif</option></select><div class="loc-tools-right"><div class="gp-export-wrap" id="exportWrap-locataires" style="position:relative"><button class="loc-btn-sm" onclick="toggleExportMenu(\'locataires\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span> Exporter</button><div class="gp-export-menu" id="exportMenu-locataires"><div class="gp-export-item" onclick="exportListePDF(\'locataires\');toggleExportMenu(\'locataires\')"><span class="material-symbols-rounded">picture_as_pdf</span> Export PDF</div><div class="gp-export-sep"></div><div class="gp-export-item" onclick="exportExcel(\'locataires\');toggleExportMenu(\'locataires\')"><span class="material-symbols-rounded">table_view</span> Export Excel</div></div></div><button class="loc-btn-sm" onclick="openImportModal(\'locataires\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span> Importer</button><span class="loc-count">'+data.length+' locataire'+(data.length>1?'s':'')+'</span></div></div><div class="loc-table-wrap">'+(data.length?'<table class="loc-table"><thead><tr><th>Nom</th><th>Bien</th><th>Téléphone</th><th>Email</th><th>Type</th><th>Statut</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table><div class="loc-footer"><span>Affichage de 1 à '+data.length+' sur '+data.length+' locataire'+(data.length>1?'s':'')+'</span><div class="loc-pages"><button class="loc-page"><span class="material-symbols-rounded" style="font-size:15px">chevron_left</span></button><button class="loc-page active">1</button><button class="loc-page"><span class="material-symbols-rounded" style="font-size:15px">chevron_right</span></button></div></div>':'<div class="loc-empty"><span class="material-symbols-rounded" style="font-size:38px;display:block;margin-bottom:8px">person_search</span>Aucun locataire trouvé</div>')+'</div></div>';
    var ns=document.getElementById('gpLocSearch'); if(ns) try{ ns.focus(); ns.setSelectionRange(ns.value.length,ns.value.length); }catch(e){}
  };
  var oldNav=window.navigate;
  window.navigate=function(p){ if(p==='nv-locataire'){ window.openNouvelLocataireDrawer(); return; } return oldNav?oldNav(p):undefined; };
  var oldRP=window.renderPage;
  window.renderPage=function(p){ if(p==='locataires'){ window.renderLocatairesModern(); return; } if(p==='nv-locataire'){ window.openNouvelLocataireDrawer(); return; } return oldRP?oldRP(p):undefined; };
  document.addEventListener('DOMContentLoaded',function(){ ensureProfessionField(); setTimeout(function(){ if(document.getElementById('page-locataires')&&document.getElementById('page-locataires').classList.contains('active')) window.renderLocatairesModern(); },300); });
})();



/* ===== Source consolidée: js/pages/locataires-final-override.js ===== */
/* Correctif final Locataires: liste + drawer alignés Propriétaires */
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function loadDB(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{if(typeof window.DB==='function')return window.DB();}catch(e){} return window.DB||{};}
  async function saveDB(db){window.DB=db;try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(db));}catch(e){} try{if(window.GPDB&&GPDB.save)return await GPDB.save(db);}catch(e){} try{if(typeof window.setDB==='function')return await window.setDB(db);}catch(e){} try{if(typeof window.saveDB==='function')return window.saveDB();}catch(e){} }
  function initials(p,n){var s=((p||'').charAt(0)+(n||'').charAt(0)).toUpperCase();return s||'LC';}
  function fullName(l){return [l&&l.prenom,l&&l.nom].filter(Boolean).join(' ').trim() || (l&&l.nom) || 'Locataire';}
  function locBien(l){return (l&&l.bien&&l.bien!=='-')?l.bien:'—';}

  /* ── Sélecteur pays (même logique que Employé/Propriétaire) ─────────── */
  var nvlSelectedCountry={code:'SN',dial:'+221'};
  function nvlRenderCountryList(filter){
    var list=document.getElementById('nvl-country-list');
    if(!list||typeof window.COUNTRIES==='undefined') return;
    var f=(filter||'').toLowerCase();
    var items=window.COUNTRIES.filter(function(c){return !f||c.name.toLowerCase().includes(f)||c.dial.includes(f)||c.code.toLowerCase().includes(f);});
    if(!items.length){list.innerHTML='<div class="nvl-country-empty">Aucun pays trouvé</div>';return;}
    list.innerHTML=items.map(function(c){
      var sel=c.code===nvlSelectedCountry.code?' nvl-ci-selected':'';
      return '<div class="nvl-country-item'+sel+'" onclick="nvlSelectCountry(\''+c.code+'\',\''+c.name+'\',\''+c.dial+'\')"><div class="nvl-ci-flag"><img src="https://flagcdn.com/w40/'+c.code.toLowerCase()+'.png" alt="'+c.code+'"></div><span class="nvl-ci-name">'+c.name+'</span><span class="nvl-ci-code">'+c.dial+'</span></div>';
    }).join('');
  }
  window.nvlToggleCountryDropdown=function(){
    var btn=document.getElementById('nvl-country-btn');
    var dd=document.getElementById('nvl-country-dropdown');
    if(!btn||!dd)return;
    if(dd.classList.contains('nvl-dd-open')){window.nvlCloseCountryDropdown();return;}
    dd.classList.add('nvl-dd-open');btn.classList.add('nvl-flag-open');
    nvlRenderCountryList('');
    setTimeout(function(){var inp=document.getElementById('nvl-country-search-input');if(inp)inp.focus();},80);
  };
  window.nvlCloseCountryDropdown=function(){
    var btn=document.getElementById('nvl-country-btn');
    var dd=document.getElementById('nvl-country-dropdown');
    if(btn)btn.classList.remove('nvl-flag-open');
    if(dd)dd.classList.remove('nvl-dd-open');
    var inp=document.getElementById('nvl-country-search-input');if(inp)inp.value='';
  };
  window.nvlSelectCountry=function(code,name,dial){
    nvlSelectedCountry={code:code,dial:dial};
    var flagEl=document.getElementById('nvl-flag-img');
    var dialEl=document.getElementById('nvl-dial-code');
    if(flagEl){flagEl.src='https://flagcdn.com/w40/'+code.toLowerCase()+'.png';flagEl.alt=code;}
    if(dialEl)dialEl.textContent=dial;
    window.nvlCloseCountryDropdown();
  };
  window.nvlFilterCountries=function(val){nvlRenderCountryList(val);};

  function ensureDrawer(){
    var old=document.getElementById('nvLocDrawer'); var oldO=document.getElementById('nvLocOverlay');
    if(old)old.remove(); if(oldO)oldO.remove();

    var drawerHTML=
      '<div id="nvLocOverlay" class="nvl-overlay" onclick="closeNouvelLocataireDrawer()"></div>'+
      '<aside id="nvLocDrawer" class="nvl-drawer" aria-hidden="true">'+
        '<div class="nvl-head">'+
          '<div><h2>Nouveau locataire</h2><p>Ajoutez un nouveau locataire à votre portefeuille</p></div>'+
          '<button type="button" class="nvl-close" onclick="closeNouvelLocataireDrawer()"><span class="material-symbols-rounded">close</span></button>'+
        '</div>'+
        '<div class="nvl-body">'+

          /* Photo */
          '<section>'+
            '<h3>Photo</h3>'+
            '<label class="nvl-photo" for="nvl-photo-input">'+
              '<span id="nvl-photo-icon" class="material-symbols-rounded">person</span>'+
              '<img id="nvl-photo-preview" alt="">'+
              '<em>Cliquez pour ajouter une photo</em>'+
              '<input type="file" id="nvl-photo-input" accept="image/*" hidden onchange="nvlPreviewPhoto(this)">'+
            '</label>'+
            '<div class="nvl-photo-actions">'+
              '<button type="button" class="nvl-btn-choose" onclick="document.getElementById(\'nvl-photo-input\').click()"><span class="material-symbols-rounded">upload</span> Choisir</button>'+
              '<button type="button" class="nvl-btn-delete" onclick="nvlClearPhoto()"><span class="material-symbols-rounded">delete</span> Supprimer</button>'+
            '</div>'+
          '</section>'+

          /* Identité */
          '<section>'+
            '<h3>Identité</h3>'+
            '<div class="nvl-grid">'+
              '<div class="nvl-field"><label class="nvl-label">Prénom <span class="nvl-req">*</span></label><input class="nvl-input" id="nvl-prenom" placeholder="Prénom"></div>'+
              '<div class="nvl-field"><label class="nvl-label">Nom <span class="nvl-req">*</span></label><input class="nvl-input" id="nvl-nom" placeholder="Nom"></div>'+
              '<div class="nvl-field"><label class="nvl-label">Date de naissance</label><input class="nvl-input" id="nvl-naiss" type="date"></div>'+
              '<div class="nvl-field"><label class="nvl-label">Statut matrimonial</label><select class="nvl-input" id="nvl-matri"><option value="">Sélectionnez</option><option>Célibataire</option><option>Marié(e)</option><option>Divorcé(e)</option><option>Veuf/Veuve</option></select></div>'+
            '</div>'+
          '</section>'+

          /* Contact */
          '<section>'+
            '<h3>Contact</h3>'+
            '<div class="nvl-field nvl-full-field">'+
              '<label class="nvl-label">Téléphone <span class="nvl-req">*</span></label>'+
              '<div class="nvl-phone-row" id="nvl-phone-wrap">'+
                '<div class="nvl-phone-flag" id="nvl-country-btn" onclick="nvlToggleCountryDropdown()">'+
                  '<img id="nvl-flag-img" class="nvl-flag-img" src="https://flagcdn.com/w40/sn.png" alt="SN">'+
                  '<span id="nvl-dial-code" class="nvl-dial-code">+221</span>'+
                  '<span class="material-symbols-rounded nvl-chevron">expand_more</span>'+
                '</div>'+
                '<div class="nvl-country-dropdown" id="nvl-country-dropdown">'+
                  '<div class="nvl-country-search">'+
                    '<span class="material-symbols-rounded">search</span>'+
                    '<input type="text" id="nvl-country-search-input" placeholder="Rechercher un pays…" oninput="nvlFilterCountries(this.value)">'+
                  '</div>'+
                  '<div class="nvl-country-list" id="nvl-country-list"></div>'+
                '</div>'+
                '<input class="nvl-input" id="nvl-tel" inputmode="tel" placeholder="77 000 00 00" style="flex:1" onclick="nvlCloseCountryDropdown()">'+
              '</div>'+
            '</div>'+
            '<div class="nvl-grid nvl-contact-grid">'+
              '<div class="nvl-field"><label class="nvl-label">Email</label><input class="nvl-input" id="nvl-email" type="email" placeholder="email@domaine.com"></div>'+
              '<div class="nvl-field"><label class="nvl-label">Adresse <span class="nvl-req">*</span></label><input class="nvl-input" id="nvl-adresse" placeholder="Adresse complète"></div>'+
            '</div>'+
          '</section>'+

        '</div>'+
        '<div class="nvl-foot">'+
          '<button type="button" class="nvl-cancel" onclick="closeNouvelLocataireDrawer()">Annuler</button>'+
          '<button type="button" id="nvl-save-btn" class="nvl-save" onclick="saveLocataireFromDrawer()">Enregistrer</button>'+
        '</div>'+
      '</aside>';

    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    if(!document.getElementById('nvl-style')){
      document.head.insertAdjacentHTML('beforeend',
        '<style id="nvl-style">'+
          /* Overlay & drawer */
          '.nvl-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;opacity:0;transition:opacity .25s}'+
          '.nvl-drawer{display:flex;position:fixed;top:0;right:0;width:480px;max-width:100vw;height:100vh;background:#fff;z-index:9999;box-shadow:-8px 0 32px rgba(0,0,0,.15);transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);flex-direction:column}'+
          /* Header */
          '.nvl-head{padding:20px 24px 16px;border-bottom:1px solid #f3f4f6;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0}'+
          '.nvl-head h2{margin:0;font-size:18px;font-weight:700;color:#111827}'+
          '.nvl-head p{margin:2px 0 0;color:#6b7280;font-size:13px}'+
          '.nvl-close{border:0;background:transparent;color:#6b7280;border-radius:6px;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center}'+
          '.nvl-close:hover{background:#f3f4f6}'+
          /* Body & sections */
          '.nvl-body{flex:1;overflow:auto;padding:20px 24px}'+
          '.nvl-body section{margin-bottom:22px}'+
          '.nvl-body h3{font-size:13px;font-weight:600;margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid #f3f4f6;color:#111827}'+
          /* Grid */
          '.nvl-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}'+
          '.nvl-contact-grid{margin-top:12px}'+
          '.nvl-full-field{margin-bottom:0}'+
          /* Field & label — FIX: label en ligne avec * */
          '.nvl-field{display:flex;flex-direction:column;gap:4px}'+
          '.nvl-label{font-size:12px;font-weight:500;color:#374151;display:flex;flex-direction:row;align-items:center;gap:2px;line-height:1.4}'+
          '.nvl-req{color:#ef4444;line-height:1}'+
          /* Input */
          '.nvl-input{height:38px;border:1px solid #e5e7eb;border-radius:8px;padding:0 12px;font-size:13px;color:#111;outline:none;background:#fff;box-sizing:border-box;width:100%}'+
          '.nvl-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}'+
          /* Phone row */
          '.nvl-phone-row{display:flex;gap:6px;position:relative}'+
          '.nvl-phone-flag{height:38px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0;min-width:105px;user-select:none;transition:border-color .2s}'+
          '.nvl-phone-flag:hover,.nvl-flag-open{border-color:#2563eb}'+
          '.nvl-flag-open{box-shadow:0 0 0 3px rgba(37,99,235,.1)}'+
          '.nvl-flag-img{width:22px;height:16px;object-fit:cover;border-radius:2px;display:block}'+
          '.nvl-dial-code{font-size:12px;color:#374151;font-weight:500}'+
          '.nvl-chevron{font-size:14px;color:#9ca3af;transition:transform .2s}'+
          '.nvl-flag-open .nvl-chevron{transform:rotate(180deg)}'+
          /* Country dropdown */
          '.nvl-country-dropdown{position:absolute;top:calc(100% + 6px);left:0;width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:9999;display:none;flex-direction:column;overflow:hidden}'+
          '.nvl-dd-open{display:flex!important}'+
          '.nvl-country-search{padding:10px 12px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:8px}'+
          '.nvl-country-search input{border:none;outline:none;font-size:13px;color:#374151;width:100%;background:transparent}'+
          '.nvl-country-search .material-symbols-rounded{font-size:16px;color:#9ca3af;flex-shrink:0}'+
          '.nvl-country-list{overflow-y:auto;max-height:220px}'+
          '.nvl-country-item{display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;font-size:13px;color:#374151;transition:background .1s}'+
          '.nvl-country-item:hover{background:#eff6ff}'+
          '.nvl-ci-selected{background:#eff6ff;font-weight:600;color:#2563eb}'+
          '.nvl-ci-flag{flex-shrink:0;width:22px;height:16px;border-radius:2px;overflow:hidden;display:inline-flex;align-items:center}'+
          '.nvl-ci-flag img{width:22px;height:16px;object-fit:cover;display:block}'+
          '.nvl-ci-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
          '.nvl-ci-code{font-size:12px;color:#9ca3af;flex-shrink:0}'+
          '.nvl-country-empty{padding:20px;text-align:center;color:#9ca3af;font-size:13px}'+
          /* Photo */
          '.nvl-photo{height:104px;border:2px dashed #e5e7eb;border-radius:12px;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;cursor:pointer;color:#9ca3af}'+
          '.nvl-photo .material-symbols-rounded{font-size:40px;color:#d1d5db}'+
          '.nvl-photo img{width:72px;height:72px;border-radius:50%;object-fit:cover;display:none}'+
          '.nvl-photo em{font-style:normal;font-size:12px}'+
          '.nvl-photo-actions{display:flex;justify-content:center;gap:8px;margin-top:10px}'+
          '.nvl-photo-actions button{height:32px;padding:0 14px;border-radius:7px;font-size:12px;display:inline-flex;align-items:center;gap:5px;cursor:pointer}'+
          '.nvl-photo-actions .material-symbols-rounded{font-size:14px}'+
          '.nvl-btn-choose{background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe}'+
          '.nvl-btn-delete{background:#fef2f2;color:#ef4444;border:1px solid #fecaca}'+
          /* Footer */
          '.nvl-foot{padding:16px 24px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;background:#fff;flex-shrink:0}'+
          '.nvl-cancel{height:38px;padding:0 22px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;color:#374151;cursor:pointer}'+
          '.nvl-cancel:hover{background:#f9fafb}'+
          '.nvl-save{height:38px;padding:0 26px;border:0;background:#2563eb;color:#fff;border-radius:8px;font-weight:700;cursor:pointer}'+
          '.nvl-save:hover{background:#1d4ed8}'+
          '.nvl-save:disabled{opacity:.6;cursor:not-allowed}'+
        '</style>'
      );
    }

    /* Fermer dropdown au clic extérieur */
    document.addEventListener('click',function(e){
      var wrap=document.getElementById('nvl-phone-wrap');
      if(wrap&&!wrap.contains(e.target))window.nvlCloseCountryDropdown();
    });
  }

  window.nvlPreviewPhoto=function(input){var file=input&&input.files&&input.files[0]; if(!file)return; var r=new FileReader(); r.onload=function(e){var p=document.getElementById('nvl-photo-preview'),i=document.getElementById('nvl-photo-icon'); if(p){p.src=e.target.result;p.style.display='block'} if(i)i.style.display='none';}; r.readAsDataURL(file);};
  window.nvlClearPhoto=function(){var p=document.getElementById('nvl-photo-preview'),i=document.getElementById('nvl-photo-icon'),inp=document.getElementById('nvl-photo-input'); if(p){p.src='';p.style.display='none'} if(i)i.style.display=''; if(inp)inp.value='';};

  window.openNouvelLocataireDrawer=function(){
    ensureDrawer();
    var o=document.getElementById('nvLocOverlay'),d=document.getElementById('nvLocDrawer');
    ['nvl-prenom','nvl-nom','nvl-naiss','nvl-tel','nvl-email','nvl-adresse'].forEach(function(id){var e=document.getElementById(id); if(e)e.value='';});
    var m=document.getElementById('nvl-matri'); if(m)m.value='';
    nvlClearPhoto();
    nvlSelectedCountry={code:'SN',dial:'+221'};
    var fi=document.getElementById('nvl-flag-img'); if(fi){fi.src='https://flagcdn.com/w40/sn.png';fi.alt='SN';}
    var dc=document.getElementById('nvl-dial-code'); if(dc)dc.textContent='+221';
    o.style.display='block'; d.style.display='flex'; d.setAttribute('aria-hidden','false');
    requestAnimationFrame(function(){o.style.opacity='1'; d.style.transform='translateX(0)';});
    setTimeout(function(){var e=document.getElementById('nvl-prenom'); if(e)e.focus();},100);
  };

  window.closeNouvelLocataireDrawer=function(){
    var o=document.getElementById('nvLocOverlay'),d=document.getElementById('nvLocDrawer');
    if(!o||!d)return;
    o.style.opacity='0'; d.style.transform='translateX(100%)'; d.setAttribute('aria-hidden','true');
    setTimeout(function(){o.style.display='none';},300);
  };

  function readPhoto(){return new Promise(function(resolve){var f=document.getElementById('nvl-photo-input'); f=f&&f.files&&f.files[0]; if(!f)return resolve(''); var r=new FileReader(); r.onload=function(e){resolve(e.target.result||'')}; r.onerror=function(){resolve('')}; r.readAsDataURL(f);});}

  window.saveLocataireFromDrawer=async function(){
    var prenom=(document.getElementById('nvl-prenom')||{}).value||'',nom=(document.getElementById('nvl-nom')||{}).value||'',tel=(document.getElementById('nvl-tel')||{}).value||'',adresse=(document.getElementById('nvl-adresse')||{}).value||'';
    prenom=prenom.trim();nom=nom.trim();tel=tel.trim();adresse=adresse.trim();
    var dialPrefix=nvlSelectedCountry.dial||'';
    var fullTel=dialPrefix&&tel&&!tel.startsWith(dialPrefix)?dialPrefix+' '+tel:tel;
    if(!prenom)return window.toast?toast('Le prénom est requis','err'):alert('Le prénom est requis');
    if(!nom)return window.toast?toast('Le nom est requis','err'):alert('Le nom est requis');
    if(!tel)return window.toast?toast('Le téléphone est requis','err'):alert('Le téléphone est requis');
    if(!adresse)return window.toast?toast("L'adresse est requise",'err'):alert("L'adresse est requise");
    var btn=document.getElementById('nvl-save-btn'); if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    var db=loadDB(); if(!Array.isArray(db.locataires))db.locataires=[];
    db.locataires.push({id:window.genId?genId('LC'):('LC-'+Date.now()),prenom:prenom,nom:nom,naiss:(document.getElementById('nvl-naiss')||{}).value||'',matri:(document.getElementById('nvl-matri')||{}).value||'',tel:fullTel,email:(document.getElementById('nvl-email')||{}).value||'',adresse:adresse,bien:'-',type:'Particulier',date:new Date().toISOString().slice(0,10),statut:'Actif',photo:await readPhoto()});
    await saveDB(db);
    if(window.auditLog)window.auditLog('Ajout','Locataires','Nouveau locataire : '+prenom+' '+nom);
    closeNouvelLocataireDrawer();
    if(window.renderLocatairesModern)window.renderLocatairesModern();
    if(window.updateSidebarBadges)window.updateSidebarBadges();
    if(window.toast)toast('Locataire enregistré avec succès ✓');
    if(btn){btn.disabled=false;btn.textContent='Enregistrer';}
  };

  window.renderLocatairesModern=function(){var page=document.getElementById('page-locataires'); if(!page)return; var db=loadDB(), all=(db.locataires||[]).slice(); var qEl=document.getElementById('gpLocSearch'), q=(qEl?qEl.value:'').toLowerCase().trim(); var data=q?all.filter(function(l){return [l.prenom,l.nom,l.tel,l.email,l.adresse,l.bien,l.type].join(' ').toLowerCase().includes(q);}):all; var avecBien=all.filter(function(l){return l.bien&&l.bien!=='-';}).length, actifs=all.filter(function(l){return (l.statut||'Actif')==='Actif';}).length; page.innerHTML='<div class="gp-modern-zone" style="padding:0 24px"><style>#page-locataires .prop-cards-action-row{display:flex;gap:12px;align-items:center;margin-bottom:8px}#page-locataires .prop-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;flex:1}#page-locataires .prop-stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;min-height:66px}#page-locataires .prop-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fffbeb;color:#D4AF37}.prop-stat-info strong{display:block;font-size:24px;line-height:1}.prop-stat-info span{font-size:12px;font-weight:700;color:#374151}.prop-stat-info em{display:block;font-style:normal;font-size:11px;color:#9ca3af}.prop-btn-primary{height:40px;padding:0 18px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;display:flex;align-items:center;gap:7px;cursor:pointer}.prop-toolbar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}.prop-search-box{height:34px;width:220px;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:7px;padding:0 10px}.prop-search-box input{border:0;outline:0;width:100%;font-size:13px}.prop-btn-sm-outline{height:34px;padding:0 12px;background:#fff;border:1px solid #e5e7eb;border-radius:7px;display:inline-flex;align-items:center;gap:5px;cursor:pointer}.prop-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}.prop-table{width:100%;border-collapse:collapse}.prop-table th{padding:12px 16px;text-align:center;font-size:12px;font-weight:700;color:#111827;text-transform:uppercase;background:#fffdf5;border-bottom:1px solid #f3f4f6}.prop-table td{padding:14px 16px;text-align:center;border-bottom:1px solid #f9fafb;color:#374151}.prop-person-cell{display:flex;align-items:center;gap:12px;justify-content:center}.prop-avatar{width:40px;height:40px;border-radius:50%;background:#D4AF37;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden}.prop-avatar img{width:100%;height:100%;object-fit:cover}.prop-person-name{font-weight:700;color:#111827}.prop-person-sub{font-size:12px;color:#9ca3af}.prop-contact-cell{display:inline-block;text-align:left}.prop-contact-phone,.prop-contact-email{display:flex;align-items:center;gap:5px}.prop-contact-cell .material-symbols-rounded{font-size:14px;color:#D4AF37}.prop-biens-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:#eff6ff;color:#2563eb;font-weight:700}.prop-status-dot{display:inline-flex;align-items:center;gap:6px}.prop-status-dot:before{content:"";width:8px;height:8px;border-radius:50%;background:#22c55e}.prop-actions{display:flex;align-items:center;gap:6px;justify-content:center}.prop-action-btn{width:32px;height:32px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}.prop-action-btn .material-symbols-rounded{font-size:16px}.prop-table-footer{padding:14px 20px;display:flex;justify-content:space-between;border-top:1px solid #f3f4f6;color:#6b7280}.prop-page-btns{display:flex;gap:6px}.prop-page-btn{width:30px;height:30px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center}.prop-page-btn.active{background:#D4AF37;color:#fff;border-color:#D4AF37}</style><div class="prop-cards-action-row"><div class="prop-stats-row"><div class="prop-stat-card"><div class="prop-stat-icon"><span class="material-symbols-rounded">groups</span></div><div class="prop-stat-info"><strong>'+all.length+'</strong><span>Locataires</span><em>Total enregistrés</em></div></div><div class="prop-stat-card"><div class="prop-stat-icon"><span class="material-symbols-rounded">home_work</span></div><div class="prop-stat-info"><strong>'+avecBien+'</strong><span>Avec bien</span><em>Logement associé</em></div></div><div class="prop-stat-card"><div class="prop-stat-icon"><span class="material-symbols-rounded">verified_user</span></div><div class="prop-stat-info"><strong>'+actifs+'</strong><span>Actifs</span><em>Dossiers actifs</em></div></div></div><button class="prop-btn-primary" onclick="openNouvelLocataireDrawer()"><span class="material-symbols-rounded">add</span>Nouveau locataire</button></div><div class="prop-toolbar-row"><label class="prop-search-box"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpLocSearch" value="'+esc(q)+'" placeholder="Rechercher un locataire…" oninput="renderLocatairesModern()"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="prop-btn-sm-outline" onclick="toggleExportMenu&&toggleExportMenu(\'locataires\')"><span class="material-symbols-rounded" style="font-size:14px;color:#D4AF37">file_download</span>Exporter</button><button class="prop-btn-sm-outline" onclick="openImportModal&&openImportModal(\'locataires\')"><span class="material-symbols-rounded" style="font-size:14px;color:#D4AF37">file_upload</span>Importer</button></div></div><div class="prop-table-wrap">'+(data.length?'<table class="prop-table"><thead><tr><th>Locataire</th><th>Contact</th><th>Adresse</th><th>Bien</th><th>Statut</th><th>Actions</th></tr></thead><tbody>'+data.map(function(l){var idx=all.indexOf(l),name=fullName(l),photo=l.photo?'<img src="'+esc(l.photo)+'" alt="">':initials(l.prenom,l.nom);return '<tr><td><div class="prop-person-cell"><div class="prop-avatar">'+photo+'</div><div><div class="prop-person-name">'+esc(name)+'</div><div class="prop-person-sub">'+esc(l.email||'—')+'</div></div></div></td><td><div class="prop-contact-cell"><div class="prop-contact-phone"><span class="material-symbols-rounded">call</span>'+esc(l.tel||'—')+'</div><div class="prop-contact-email"><span class="material-symbols-rounded">mail</span>'+esc(l.email||'—')+'</div></div></td><td>'+esc(l.adresse||'—')+'</td><td><span class="prop-biens-badge"><span class="material-symbols-rounded" style="font-size:14px">home_work</span>'+esc(locBien(l))+'</span></td><td><span class="prop-status-dot">'+esc(l.statut||'Actif')+'</span></td><td><div class="prop-actions"><button class="prop-action-btn"><span class="material-symbols-rounded">visibility</span></button><button class="prop-action-btn" onclick="editRow&&editRow(\'locataires\','+idx+')"><span class="material-symbols-rounded">edit</span></button><button class="prop-action-btn docs gp-doc-folder-btn" title="Documents" onclick="openEntityDocs&&openEntityDocs(\'locataires\','+idx+')"><span class="material-symbols-rounded">folder</span></button><button class="prop-action-btn" onclick="delRow&&delRow(\'locataires\','+idx+')"><span class="material-symbols-rounded">delete</span></button></div></td></tr>';}).join('')+'</tbody></table><div class="prop-table-footer"><span>Affichage de 1 à '+data.length+' sur '+data.length+' locataire'+(data.length>1?'s':'')+'</span><div class="prop-page-btns"><button class="prop-page-btn"><span class="material-symbols-rounded" style="font-size:14px">chevron_left</span></button><button class="prop-page-btn active">1</button><button class="prop-page-btn"><span class="material-symbols-rounded" style="font-size:14px">chevron_right</span></button></div></div>':'<div style="padding:60px;text-align:center;color:#9ca3af">Aucun locataire trouvé</div>')+'</div></div>'; var e=document.getElementById('gpLocSearch'); if(e)try{e.focus();e.setSelectionRange(e.value.length,e.value.length);}catch(_){}};

  function activateLocatairesThenOpen(){ if(window.GPNavigation && window.GPNavigation.navigate && window.GP_CURRENT_PAGE!=='locataires') window.GPNavigation.navigate('locataires'); else if(window.renderLocatairesModern) window.renderLocatairesModern(); setTimeout(window.openNouvelLocataireDrawer,30); }
  document.addEventListener('click',function(e){var b=e.target.closest('button,a'); if(!b)return; var txt=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase(); var nav=b.getAttribute('onclick')||b.getAttribute('data-gp-nav')||''; if(txt.includes('nouveau locataire')||nav.includes('nv-locataire')){e.preventDefault(); e.stopPropagation(); activateLocatairesThenOpen();}},true);
  document.addEventListener('DOMContentLoaded',function(){ensureDrawer(); if(window.GPNavigation&&GPNavigation.registerRenderer){GPNavigation.registerRenderer('locataires',window.renderLocatairesModern); GPNavigation.registerRenderer('nv-locataire',activateLocatairesThenOpen);} var oldNav=window.navigate; window.navigate=function(page){if(page==='nv-locataire'){activateLocatairesThenOpen();return page;} return oldNav?oldNav.apply(this,arguments):undefined;}; if(window.GP_CURRENT_PAGE==='locataires'||(document.getElementById('page-locataires')&&document.getElementById('page-locataires').classList.contains('active'))) window.renderLocatairesModern();});
})();

