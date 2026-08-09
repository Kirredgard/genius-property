/* Genius Property V10 — module Biens
   Objectif : isoler la création/validation des biens hors du bundle legacy.
   Ce fichier surcharge volontairement saveBien() appelé par le HTML existant.
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
  const numberOf = (raw) => {
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(raw);
    if (typeof window.num === 'function') return window.num(raw);
    const cleaned = String(raw ?? '').replace(/\s/g, '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const moneyOf = (raw) => {
    if (window.GP && typeof window.GP.money === 'function') return window.GP.money(raw);
    if (typeof window.gp_money === 'function') return window.gp_money(raw);
    return Math.round(numberOf(raw)).toLocaleString('fr-FR') + ' FCFA';
  };
  const idOf = (prefix) => {
    if (typeof window.genId === 'function') return window.genId(prefix);
    if (window.GP && typeof window.GP.uid === 'function') return window.GP.uid(prefix);
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
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

  function validateBienForm() {
    const data = {
      nom: valueOf('b-nom').trim(),
      vente: valueOf('b-vente').trim(),
      type: valueOf('b-type').trim(),
      proprio: valueOf('b-proprio').trim(),
      valeurRaw: valueOf('b-valeur').trim(),
      nbAppartRaw: valueOf('b-nb-appart').trim(),
      etat: valueOf('b-etat').trim() || 'Bon état',
      statut: valueOf('b-statut').trim() || 'Disponible',
      adresse: valueOf('b-adresse').trim()
    };

    if (!data.nom) return { ok:false, field:'b-nom', message:'Le nom du bien est requis' };
    if (!data.vente) return { ok:false, field:'b-vente', message:'Indiquez si le bien est destiné à la vente' };
    if (!data.type) return { ok:false, field:'b-type', message:'Le type de bien est requis' };
    if (!data.proprio) return { ok:false, field:'b-proprio', message:'Le propriétaire est requis' };
    if (!data.valeurRaw) return { ok:false, field:'b-valeur', message:'La valeur du bien est requise' };

    const valeur = numberOf(data.valeurRaw);
    if (!Number.isFinite(valeur) || valeur <= 0) {
      return { ok:false, field:'b-valeur', message:'La valeur du bien doit être supérieure à 0' };
    }

    const duplicate = (db().biens || []).some(b => normalize(b.nom) === normalize(data.nom));
    if (duplicate) return { ok:false, field:'b-nom', message:'Un bien avec ce nom existe déjà' };

    const nbAppart = data.type === 'Immeuble' ? parseInt(data.nbAppartRaw || '0', 10) : 0;
    if (data.type === 'Immeuble') {
      if (!Number.isFinite(nbAppart) || nbAppart < 1) {
        return { ok:false, field:'b-nb-appart', message:'Le nombre d’appartements est requis' };
      }
      if (nbAppart > 500) {
        return { ok:false, field:'b-nb-appart', message:'Nombre d’appartements trop élevé pour une création directe' };
      }
    }

    return { ok:true, data:{ ...data, valeur, nbAppart } };
  }

  function buildUnits(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: idOf('UNT'),
      nom: `Appartement ${i + 1}`,
      statut: 'Disponible',
      loyer: '',
      locataire: ''
    }));
  }

  async function saveBien() {
    const result = validateBienForm();
    if (!result.ok) return fieldError(result.field, result.message);

    const data = result.data;
    const photo = typeof window.getPhotoData === 'function'
      ? await window.getPhotoData('b-photo-input')
      : '';

    const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(_db.biens)) _db.biens = [];

    if (window.GPLicenseGuard && typeof window.GPLicenseGuard.canAddProperty === 'function') {
      const quota = window.GPLicenseGuard.canAddProperty(_db.biens.length);
      if (!quota.ok) { notify(quota.reason || 'Limite du plan atteinte', 'err'); return; }
    }

    const bien = {
      id: idOf('BI'),
      nom: data.nom,
      vente: data.vente,
      type: data.type,
      proprio: data.proprio,
      valeur: moneyOf(data.valeur),
      adresse: data.adresse,
      nbAppart: data.nbAppart || '',
      etat: data.etat,
      statut: data.statut,
      photo: photo || '',
      documents: []
    };

    if (data.nbAppart > 1) {
      bien.unites = buildUnits(data.nbAppart);
      bien.statut = 'Disponible';
    }

    _db.biens.push(bien);

    if (typeof window.auditLog === 'function') {
      window.auditLog('Ajout', 'Biens', 'Nouveau bien : ' + data.nom);
    }
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    if (typeof window.resetAfterSave === 'function') window.resetAfterSave('page-nv-bien');
    if (typeof window.resetBienDocumentInputs === 'function') window.resetBienDocumentInputs();
    if (typeof window.renderTable === 'function') window.renderTable('biens');
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    if (typeof window.navigate === 'function') window.navigate('biens');
    notify('Bien enregistré avec succès ✓');
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.biens = {
    validateBienForm,
    saveBien,
    buildUnits
  };

  window.saveBien = saveBien;

  // [cleaned] debug console statement removed
})();

/* ================================================================
   CONSOLIDATION — biens / locations / contrats / drawers
   Anciennement chargé via fichiers patch séparés.
================================================================ */

/* ===== Source consolidée: js/pages/final-universal-phone-biens-locations-contrats.js ===== */
(function(){
  'use strict';
  var COUNTRIES=[['🇸🇳','SN','+221','Sénégal'],['🇫🇷','FR','+33','France'],['🇨🇮','CI','+225','Côte d’Ivoire'],['🇲🇱','ML','+223','Mali'],['🇬🇳','GN','+224','Guinée'],['🇬🇲','GM','+220','Gambie'],['🇲🇷','MR','+222','Mauritanie'],['🇧🇫','BF','+226','Burkina Faso'],['🇲🇦','MA','+212','Maroc'],['🇨🇲','CM','+237','Cameroun'],['🇨🇩','CD','+243','RDC'],['🇺🇸','US','+1','États-Unis']];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}');}catch(e){return window.DB||{};}}
  function save(d){window.DB=d;try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){} try{if(window.GPDB&&GPDB.save)GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){}}
  function money(v){ if(v==null||v==='')return '—'; if(String(v).match(/[A-Z]{3,}|FCFA|€|\$/i))return String(v); var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.')); return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':String(v); }
  function fullName(o){return ([o&&o.prenom,o&&o.nom].filter(Boolean).join(' ') || (o&&o.locataire) || (o&&o.nom) || '—').trim();}
  function initials(n){var p=String(n||'').trim().split(/\s+/).filter(Boolean);return ((p[0]||'L')[0]+(p[1]||p[0]||'C')[0]).toUpperCase();}
  function iconBtn(cls,icon,title,onclick){return '<button class="gp-mini-action '+cls+'" title="'+esc(title)+'" onclick="event.stopPropagation();'+onclick+'"><span class="material-symbols-rounded">'+icon+'</span></button>';}

  function injectStyle(){ if(document.getElementById('gp-final-style'))return; document.head.insertAdjacentHTML('beforeend','<style id="gp-final-style">'+
    '.gp-phone-field{display:flex!important;align-items:stretch!important;gap:6px!important;width:100%!important}.gp-phone-country{height:38px;min-width:104px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;gap:5px;font-size:13px;color:#111827;cursor:pointer;padding:0 8px;box-sizing:border-box}.gp-phone-country:hover{border-color:#2563eb}.gp-phone-field input{flex:1!important;min-width:0!important}.gp-country-menu{position:absolute;z-index:99999;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 28px rgba(15,23,42,.16);width:280px;max-height:270px;overflow:auto;padding:6px}.gp-country-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:13px;color:#374151}.gp-country-item:hover{background:#eff6ff}.gp-modern-page{padding:8px 24px}.gp-page-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}.gp-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;flex:1}.gp-stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;min-height:66px}.gp-stat-ico{width:40px;height:40px;border-radius:10px;background:#fffbeb;color:#D4AF37;display:flex;align-items:center;justify-content:center}.gp-stat-card:nth-child(2) .gp-stat-ico{background:#eff6ff;color:#2563eb}.gp-stat-card:nth-child(3) .gp-stat-ico{background:#ecfdf5;color:#10b981}.gp-stat-card strong{font-size:24px;display:block;line-height:1;color:#111827}.gp-stat-card span{display:block;font-size:12px;font-weight:700;color:#374151;margin-top:4px}.gp-stat-card em{display:block;font-size:11px;color:#9ca3af;font-style:normal}.gp-primary{height:40px;border:0;border-radius:8px;background:#D4AF37;color:#111827;padding:0 18px;font-weight:800;display:inline-flex;align-items:center;gap:7px;cursor:pointer;white-space:nowrap}.gp-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:8px}.gp-search{height:36px;width:250px;display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px}.gp-search input{border:0;outline:0;background:transparent;width:100%;font-size:13px}.gp-select,.gp-outline{height:36px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#374151}.gp-outline{display:inline-flex;align-items:center;gap:5px;cursor:pointer}.gp-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 10px 24px rgba(15,23,42,.03)}.gp-table{width:100%;border-collapse:collapse}.gp-table th{padding:10px 12px;background:#fffaf0;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px;text-transform:uppercase;color:#111827}.gp-table td{padding:12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;vertical-align:middle}.gp-table tr:last-child td{border-bottom:0}.gp-line{display:inline-flex;align-items:center;gap:6px}.gp-line .material-symbols-rounded{font-size:16px;color:#64748b}.gp-pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;background:#dcfce7;color:#15803d}.gp-pill.warn{background:#fef3c7;color:#b45309}.gp-pill.off{background:#fee2e2;color:#b91c1c}.gp-actions{display:flex;gap:6px;justify-content:center}.gp-mini-action{width:28px;height:28px;border-radius:7px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}.gp-mini-action span{font-size:16px}.gp-mini-action.view{color:#0284c7}.gp-mini-action.edit{color:#ca8a04}.gp-mini-action.docs{color:#0f172a}.gp-mini-action.del{color:#dc2626}.gp-footer{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f3f4f6;color:#64748b;font-size:13px}.gp-empty{padding:48px;text-align:center;color:#9ca3af}.gp-biens-soft #biensCardsGrid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(235px,1fr))!important;gap:16px!important}.gp-biens-soft .biens-page-header{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px!important}.gp-biens-soft #biensStatCards>div{border-left:0!important;border:1px solid #e5e7eb!important;border-radius:12px!important;box-shadow:none!important}</style>');}

  function showCountries(btn,input){ var old=document.querySelector('.gp-country-menu'); if(old)old.remove(); var r=btn.getBoundingClientRect(), menu=document.createElement('div'); menu.className='gp-country-menu'; menu.style.left=(r.left+window.scrollX)+'px'; menu.style.top=(r.bottom+window.scrollY+6)+'px'; menu.innerHTML=COUNTRIES.map(function(c){return '<div class="gp-country-item" data-code="'+esc(c[2])+'"><b>'+c[0]+'</b><span>'+esc(c[3])+'</span><small style="margin-left:auto;color:#64748b">'+esc(c[2])+'</small></div>';}).join(''); document.body.appendChild(menu); menu.querySelectorAll('.gp-country-item').forEach(function(it){it.onclick=function(){var c=COUNTRIES.find(function(x){return x[2]===it.getAttribute('data-code')})||COUNTRIES[0];btn.innerHTML='<span>'+c[0]+'</span><strong>'+c[2]+'</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>';btn.setAttribute('data-code',c[2]); menu.remove(); input.focus();};}); setTimeout(function(){document.addEventListener('click',function close(e){if(!menu.contains(e.target)&&e.target!==btn){menu.remove();document.removeEventListener('click',close);}},true);},0); }
  function enhancePhoneInputs(root){ injectStyle(); (root||document).querySelectorAll('input[id$="tel"],input[id$="-tel"]').forEach(function(input){ if(!input || input.closest('.gp-phone-field,.nvl-phone-row,.nde-phone-row') || input.type==='hidden') return; var parent=input.parentElement; if(input.id==='pdf-agence-tel'||input.id==='pdf-bailleur-tel')return; var wrap=document.createElement('div'); wrap.className='gp-phone-field'; wrap.style.position='relative'; var btn=document.createElement('button'); btn.type='button'; btn.className='gp-phone-country'; btn.setAttribute('data-code','+221'); btn.innerHTML='<span>🇸🇳</span><strong>+221</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>'; btn.onclick=function(e){e.preventDefault();e.stopPropagation();showCountries(btn,input);}; parent.insertBefore(wrap,input); wrap.appendChild(btn); wrap.appendChild(input); }); }

  function locativeLabel(l){return l.nom||l.bien||l.appartement||l.unite||'Location';}
  function statusClass(s){s=String(s||'').toLowerCase(); if(s.indexOf('att')>-1||s.indexOf('brou')>-1)return 'warn'; if(s.indexOf('inact')>-1||s.indexOf('résil')>-1||s.indexOf('expire')>-1)return 'off'; return '';}
  function renderLocativesModern(){ var page=document.getElementById('page-locatives'); if(!page)return; var d=db(), all=Array.isArray(d.locatives)?d.locatives:[]; var q=(document.getElementById('gpLocativeSearch')||{}).value||''; var data=all.filter(function(l){return !q||JSON.stringify(l).toLowerCase().indexOf(q.toLowerCase())>-1;}); var act=all.filter(function(l){return String(l.statut||'Loué').toLowerCase().indexOf('lou')>-1||String(l.statut||'Actif').toLowerCase()==='actif';}).length; page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+all.length+'</strong><span>Locations</span><em>Total enregistrées</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+act+'</strong><span>Occupées</span><em>Locations actives</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,l){return s+(Number(String(l.loyer||0).replace(/[^0-9.-]/g,""))||0);},0))+'</strong><span>Loyers</span><em>Total mensuel</em></div></div></div><button class="gp-primary" onclick="navigate(\'nv-locative\')"><span class="material-symbols-rounded">add_home</span>Nouvelle location</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpLocativeSearch" value="'+esc(q)+'" placeholder="Rechercher une location…" oninput="renderLocativesModern()"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Location</th><th>Bien</th><th>Locataire</th><th>Loyer</th><th>Statut</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+data.map(function(l){var i=all.indexOf(l);return '<tr><td><b>'+esc(locativeLabel(l))+'</b><br><small style="color:#64748b">'+esc(l.type||l.nature||'Location')+'</small></td><td><span class="gp-line"><span class="material-symbols-rounded">home</span>'+esc(l.bien||'—')+'</span></td><td>'+esc(l.locataire||l.occupant||'—')+'</td><td><b>'+money(l.loyer||l.montant)+'</b></td><td><span class="gp-pill '+statusClass(l.statut)+'">'+esc(l.statut||'Loué')+'</span></td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'locatives\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'locatives\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'locatives\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de 1 à '+data.length+' sur '+data.length+' location'+(data.length>1?'s':'')+'</span><span></span></div>':'<div class="gp-empty">Aucune location trouvée</div>')+'</div></div>'; }
  function renderContratsModern(){ var page=document.getElementById('page-contrats'); if(!page)return; var d=db(), all=Array.isArray(d.contrats)?d.contrats:[]; var q=(document.getElementById('gpContratSearch')||{}).value||''; var data=all.filter(function(c){return !q||JSON.stringify(c).toLowerCase().indexOf(q.toLowerCase())>-1;}); var actifs=all.filter(function(c){return String(c.statut||'Actif').toLowerCase()==='actif';}).length; page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">description</span></div><div><strong>'+all.length+'</strong><span>Contrats</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">verified</span></div><div><strong>'+actifs+'</strong><span>Actifs</span><em>Contrats actifs</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,c){return s+(Number(String(c.loyer||0).replace(/[^0-9.-]/g,""))||0);},0))+'</strong><span>Loyers</span><em>Total contrats</em></div></div></div><button class="gp-primary" onclick="navigate(\'nv-contrat\')"><span class="material-symbols-rounded">add</span>Nouveau contrat</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpContratSearch" value="'+esc(q)+'" placeholder="Rechercher un contrat…" oninput="renderContratsModern()"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>N° contrat</th><th>Locataire</th><th>Location</th><th>Début / Fin</th><th>Loyer</th><th>Statut</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+data.map(function(c){var i=all.indexOf(c);return '<tr><td><b>'+esc(c.num||c.numero||('CT-'+(i+1)))+'</b><br><small style="color:#64748b">'+esc(c.type||'Bail habitation')+'</small></td><td>'+esc(c.locataire||'—')+'</td><td>'+esc(c.locative||c.bien||'—')+'</td><td>'+esc(c.debut||'—')+'<br><small style="color:#64748b">'+esc(c.fin||'—')+'</small></td><td><b>'+money(c.loyer)+'</b></td><td><span class="gp-pill '+statusClass(c.statut)+'">'+esc(c.statut||'Actif')+'</span></td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'contrats\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'contrats\','+i+')')+iconBtn('docs','picture_as_pdf','PDF','generateContratPDF&&generateContratPDF('+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'contrats\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de 1 à '+data.length+' sur '+data.length+' contrat'+(data.length>1?'s':'')+'</span><span></span></div>':'<div class="gp-empty">Aucun contrat trouvé</div>')+'</div></div>'; }

  function patchBiensPage(){ var p=document.getElementById('page-biens'); if(!p)return; p.classList.add('gp-biens-soft'); }
  var oldRP=window.renderPage; window.renderPage=function(p){ if(p==='locatives'||p==='locations'){renderLocativesModern();return;} if(p==='contrats'){renderContratsModern();return;} var r=oldRP?oldRP.apply(this,arguments):undefined; setTimeout(function(){enhancePhoneInputs(document);patchBiensPage();},80); return r; };
  var oldNav=window.navigate; window.navigate=function(p){ if(p==='locatives'||p==='locations'){ if(oldNav)oldNav.call(this,'locatives'); setTimeout(renderLocativesModern,60); return;} if(p==='contrats'){ if(oldNav)oldNav.call(this,p); setTimeout(renderContratsModern,60); return;} var r=oldNav?oldNav.apply(this,arguments):undefined; setTimeout(function(){enhancePhoneInputs(document);patchBiensPage();},100); return r; };
  window.renderLocativesModern=renderLocativesModern; window.renderContratsModern=renderContratsModern; window.enhancePhoneInputs=enhancePhoneInputs;
  document.addEventListener('DOMContentLoaded',function(){injectStyle(); setTimeout(function(){enhancePhoneInputs(document);patchBiensPage(); var a=document.querySelector('.page.active'); if(a&&a.id==='page-locatives')renderLocativesModern(); if(a&&a.id==='page-contrats')renderContratsModern();},500); document.addEventListener('focusin',function(e){ if(e.target&&e.target.matches&&e.target.matches('input[id$="tel"],input[id$="-tel"]')) enhancePhoneInputs(document);}); });
})();

/* ===== Source consolidée: js/pages/final-align-biens-locations-contrats.js ===== */
(function(){
  'use strict';
  var PS={locatives:10,contrats:10};
  var PAGE={locatives:1,contrats:1};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}');}catch(e){return window.DB||{};}}
  function money(v){ if(v==null||v==='')return '—'; if(String(v).match(/FCFA|€|\$/i))return String(v); var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.')); return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':String(v); }
  function iconBtn(cls,icon,title,onclick){return '<button class="gp-mini-action '+cls+'" title="'+esc(title)+'" onclick="event.stopPropagation();'+onclick+'"><span class="material-symbols-rounded">'+icon+'</span></button>';}
  function statusClass(s){s=String(s||'').toLowerCase(); if(s.indexOf('att')>-1||s.indexOf('brou')>-1)return 'warn'; if(s.indexOf('inact')>-1||s.indexOf('résil')>-1||s.indexOf('expire')>-1)return 'off'; return '';}
  function inject(){ if(document.getElementById('gp-align-bLC-style'))return; document.head.insertAdjacentHTML('beforeend','<style id="gp-align-bLC-style">'+
    '.gp-modern-page{padding:8px 24px!important}.gp-page-top{display:flex!important;align-items:center!important;gap:12px!important;margin-bottom:8px!important}.gp-stat-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:10px!important;flex:1!important}.gp-stat-card{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important;padding:12px 16px!important;display:flex!important;align-items:center!important;gap:12px!important;min-height:66px!important;box-shadow:none!important}.gp-stat-ico{width:40px!important;height:40px!important;border-radius:10px!important;background:#fffbeb!important;color:#D4AF37!important;display:flex!important;align-items:center!important;justify-content:center!important}.gp-stat-card strong{font-size:24px!important;display:block!important;line-height:1!important;color:#111827!important}.gp-stat-card span{display:block!important;font-size:12px!important;font-weight:700!important;color:#374151!important;margin-top:4px!important}.gp-stat-card em{display:block!important;font-size:11px!important;color:#9ca3af!important;font-style:normal!important}.gp-primary{height:40px!important;border:0!important;border-radius:8px!important;background:#2563eb!important;color:white!important;padding:0 18px!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;gap:7px!important;cursor:pointer!important;white-space:nowrap!important}.gp-primary.gold{background:#D4AF37!important;color:#111827!important}.gp-toolbar{display:flex!important;align-items:center!important;gap:8px!important;margin-bottom:8px!important}.gp-search{height:36px!important;width:250px!important;display:flex!important;align-items:center!important;gap:7px!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:8px!important;padding:0 10px!important}.gp-search input{border:0!important;outline:0!important;background:transparent!important;width:100%!important;font-size:13px!important}.gp-select,.gp-outline{height:36px!important;border:1px solid #e5e7eb!important;background:#fff!important;border-radius:8px!important;padding:0 12px!important;font-size:13px!important;color:#374151!important}.gp-outline{display:inline-flex!important;align-items:center!important;gap:5px!important;cursor:pointer!important}.gp-table-wrap{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important;overflow:hidden!important;box-shadow:0 10px 24px rgba(15,23,42,.03)!important}.gp-table{width:100%!important;border-collapse:collapse!important}.gp-table th{padding:10px 12px!important;background:#fffaf0!important;border-bottom:1px solid #e5e7eb!important;text-align:left!important;font-size:12px!important;text-transform:uppercase!important;color:#111827!important}.gp-table td{padding:12px!important;border-bottom:1px solid #f3f4f6!important;font-size:13px!important;color:#111827!important;vertical-align:middle!important}.gp-pill{display:inline-flex!important;align-items:center!important;padding:3px 9px!important;border-radius:999px!important;font-size:11px!important;font-weight:800!important;background:#dcfce7!important;color:#15803d!important}.gp-pill.warn{background:#fef3c7!important;color:#b45309!important}.gp-pill.off{background:#fee2e2!important;color:#b91c1c!important}.gp-actions{display:flex!important;gap:6px!important;justify-content:center!important}.gp-mini-action{width:28px!important;height:28px!important;border-radius:7px!important;border:1px solid #e5e7eb!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}.gp-mini-action span{font-size:16px!important}.gp-mini-action.view{color:#0284c7!important}.gp-mini-action.edit{color:#ca8a04!important}.gp-mini-action.docs{color:#0f172a!important}.gp-mini-action.del{color:#dc2626!important}.gp-footer{padding:14px 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-top:1px solid #f3f4f6!important;color:#64748b!important;font-size:13px!important}.gp-pages{display:flex!important;align-items:center!important;gap:6px!important}.gp-page-btn{min-width:30px!important;height:30px!important;border-radius:7px!important;border:1px solid #e5e7eb!important;background:#fff!important;color:#374151!important;font-weight:700!important;cursor:pointer!important}.gp-page-btn.active{background:#D4AF37!important;border-color:#D4AF37!important;color:#111827!important}.gp-empty{padding:48px!important;text-align:center!important;color:#9ca3af!important}.gp-form-modern{max-width:1100px!important;margin:0 auto!important}.gp-form-modern .card{border:1px solid #e5e7eb!important;border-radius:14px!important;box-shadow:0 10px 24px rgba(15,23,42,.04)!important;background:#fff!important}.gp-form-modern h3{font-size:13px!important;font-weight:800!important;color:#111827!important;margin-bottom:12px!important;padding-bottom:10px!important;border-bottom:1px solid #f3f4f6!important}.gp-form-modern .fg label{font-size:11.5px!important;font-weight:800!important;color:#374151!important}.gp-form-modern input,.gp-form-modern select{height:38px!important;border:1px solid #e5e7eb!important;border-radius:9px!important;padding:0 11px!important;background:#fff!important}.gp-form-modern .form-actions{border-top:1px solid #f3f4f6!important;padding-top:14px!important;justify-content:flex-end!important}.gp-form-modern .btn-primary{background:#D4AF37!important;color:#111827!important;border:0!important}.gp-form-modern .btn-danger{background:#fee2e2!important;color:#991b1b!important;border:0!important}.gp-biens-soft .biens-page-header{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important;padding:16px!important;box-shadow:none!important}.gp-biens-soft #biensCardsGrid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))!important;gap:14px!important}.gp-biens-soft #biensStatCards>div{border-left:0!important;border:1px solid #e5e7eb!important;border-radius:12px!important;box-shadow:none!important}</style>');}
  function pages(kind,total){var ps=PS[kind]||10, max=Math.max(1,Math.ceil(total/ps)); PAGE[kind]=Math.min(Math.max(1,PAGE[kind]||1),max); var h='<div class="gp-pages"><button class="gp-page-btn" onclick="gpSetPage(\''+kind+'\','+(PAGE[kind]-1)+')"><span class="material-symbols-rounded" style="font-size:15px">chevron_left</span></button>'; for(var i=1;i<=max;i++){ if(i===1||i===max||Math.abs(i-PAGE[kind])<=1) h+='<button class="gp-page-btn '+(i===PAGE[kind]?'active':'')+'" onclick="gpSetPage(\''+kind+'\','+i+')">'+i+'</button>'; else if(Math.abs(i-PAGE[kind])===2) h+='<span style="padding:0 3px">…</span>'; } return h+'<button class="gp-page-btn" onclick="gpSetPage(\''+kind+'\','+(PAGE[kind]+1)+')"><span class="material-symbols-rounded" style="font-size:15px">chevron_right</span></button></div>';}
  window.gpSetPage=function(kind,p){PAGE[kind]=p; if(kind==='locatives')renderLocativesModernAligned(); if(kind==='contrats')renderContratsModernAligned();};
  function renderLocativesModernAligned(){inject(); var page=document.getElementById('page-locatives'); if(!page)return; var d=db(), all=Array.isArray(d.locatives)?d.locatives:[]; var q=(document.getElementById('gpLocativeSearch')||{}).value||''; var data=all.filter(function(l){return !q||JSON.stringify(l).toLowerCase().indexOf(q.toLowerCase())>-1;}); var start=((PAGE.locatives||1)-1)*PS.locatives, slice=data.slice(start,start+PS.locatives); var act=all.filter(function(l){return String(l.statut||'Loué').toLowerCase().indexOf('lou')>-1||String(l.statut||'Actif').toLowerCase()==='actif';}).length; page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+all.length+'</strong><span>Locations</span><em>Total enregistrées</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+act+'</strong><span>Occupées</span><em>Locations actives</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,l){return s+(Number(String(l.loyer||0).replace(/[^0-9.-]/g,""))||0);},0))+'</strong><span>Loyers</span><em>Total mensuel</em></div></div></div><button class="gp-primary" onclick="navigate(\'nv-locative\')"><span class="material-symbols-rounded">add</span>Nouvelle location</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpLocativeSearch" value="'+esc(q)+'" placeholder="Rechercher une location…" oninput="PAGE&&0;window.gpSetPage(\'locatives\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="toggleExportMenu?toggleExportMenu(\'locatives\'):exportListePDF(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Location</th><th>Bien</th><th>Occupant</th><th>Montant loyer</th><th>Date entrée</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(l){var i=all.indexOf(l);return '<tr><td><b>'+esc(l.nom||l.bien||('Location '+(i+1)))+'</b><br><small style="color:#64748b">'+esc(l.type||l.nature||'Location')+'</small></td><td>'+esc(l.bien||'—')+'</td><td>'+esc(l.locataire||l.occupant||'—')+'</td><td><b>'+money(l.loyer||l.montant)+'</b></td><td>'+esc(l.dateEntree||l.date_entree||l.entree||l.debut||'—')+'</td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'locatives\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'locatives\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'locatives\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.locatives,data.length)+' sur '+data.length+' location'+(data.length>1?'s':'')+'</span>'+pages('locatives',data.length)+'</div>':'<div class="gp-empty">Aucune location trouvée</div>')+'</div></div>';}
  function renderContratsModernAligned(){inject(); var page=document.getElementById('page-contrats'); if(!page)return; var d=db(), all=Array.isArray(d.contrats)?d.contrats:[]; var q=(document.getElementById('gpContratSearch')||{}).value||''; var data=all.filter(function(c){return !q||JSON.stringify(c).toLowerCase().indexOf(q.toLowerCase())>-1;}); var start=((PAGE.contrats||1)-1)*PS.contrats, slice=data.slice(start,start+PS.contrats); var actifs=all.filter(function(c){return String(c.statut||'Actif').toLowerCase()==='actif';}).length; page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">description</span></div><div><strong>'+all.length+'</strong><span>Contrats</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">verified</span></div><div><strong>'+actifs+'</strong><span>Actifs</span><em>Contrats actifs</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,c){return s+(Number(String(c.loyer||0).replace(/[^0-9.-]/g,""))||0);},0))+'</strong><span>Loyers</span><em>Total contrats</em></div></div></div><button class="gp-primary" onclick="navigate(\'nv-contrat\')"><span class="material-symbols-rounded">note_add</span>Nouveau contrat</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpContratSearch" value="'+esc(q)+'" placeholder="Rechercher un contrat…" oninput="window.gpSetPage(\'contrats\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="toggleExportMenu?toggleExportMenu(\'contrats\'):exportListePDF(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Locataire</th><th>Locative</th><th>Type contrat</th><th>Date début</th><th>Date fin</th><th>Statut</th><th>Prochain paiement</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(c){var i=all.indexOf(c);return '<tr><td><b>'+esc(c.locataire||'—')+'</b><br><small style="color:#64748b">'+esc(c.num||c.numero||('CT-'+(i+1)))+'</small></td><td>'+esc(c.locative||c.bien||'—')+'</td><td>'+esc(c.type||'Habitation')+'</td><td>'+esc(c.debut||c.dateDebut||'—')+'</td><td>'+esc(c.fin||c.dateFin||'—')+'</td><td><span class="gp-pill '+statusClass(c.statut)+'">'+esc(c.statut||'Actif')+'</span></td><td>'+esc(c.prochain||c.prochainPaiement||'—')+'</td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'contrats\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'contrats\','+i+')')+iconBtn('docs','picture_as_pdf','PDF','generateContratPDF&&generateContratPDF('+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'contrats\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.contrats,data.length)+' sur '+data.length+' contrat'+(data.length>1?'s':'')+'</span>'+pages('contrats',data.length)+'</div>':'<div class="gp-empty">Aucun contrat trouvé</div>')+'</div></div>';}
  function patchBiens(){inject(); var p=document.getElementById('page-biens'); if(!p)return; p.classList.add('gp-biens-soft'); var actions=p.querySelector('.biens-page-header > div:last-child'); if(actions&&!document.getElementById('gp-biens-import-btn')){ actions.insertAdjacentHTML('beforeend','<button id="gp-biens-import-btn" class="gp-outline" onclick="openImportModal&&openImportModal(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button>'); } }
  function patchForm(pageId){inject(); var p=document.getElementById(pageId); if(!p)return; p.classList.add('gp-form-modern'); if(window.enhancePhoneInputs) window.enhancePhoneInputs(p);}
  var oldNav=window.navigate; window.navigate=function(p){ if(p==='locatives'||p==='locations'){ if(oldNav)oldNav.call(this,'locatives'); setTimeout(renderLocativesModernAligned,80); return; } if(p==='contrats'){ if(oldNav)oldNav.call(this,'contrats'); setTimeout(renderContratsModernAligned,80); return; } var r=oldNav?oldNav.apply(this,arguments):undefined; setTimeout(function(){patchBiens(); patchForm('page-nv-bien'); patchForm('page-nv-locative'); patchForm('page-nv-contrat');},100); return r; };
  var oldRP=window.renderPage; window.renderPage=function(p){ if(p==='locatives'||p==='locations'){renderLocativesModernAligned();return;} if(p==='contrats'){renderContratsModernAligned();return;} var r=oldRP?oldRP.apply(this,arguments):undefined; setTimeout(function(){patchBiens(); patchForm('page-nv-bien'); patchForm('page-nv-locative'); patchForm('page-nv-contrat');},80); return r; };
  window.renderLocativesModern=renderLocativesModernAligned; window.renderContratsModern=renderContratsModernAligned;
  document.addEventListener('DOMContentLoaded',function(){inject(); setTimeout(function(){patchBiens(); patchForm('page-nv-bien'); patchForm('page-nv-locative'); patchForm('page-nv-contrat'); var a=document.querySelector('.page.active'); if(a&&a.id==='page-locatives')renderLocativesModernAligned(); if(a&&a.id==='page-contrats')renderContratsModernAligned();},600);});
})();

/* ===== Source consolidée: js/pages/final-biens-locations-contrats-drawers.js ===== */
(function(){
'use strict';
var PS={biens:12,locatives:10,contrats:10}, PAGE={biens:1,locatives:1,contrats:1};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}');}catch(e){return window.DB||{};}}
async function saveDb(d){window.DB=d;try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){} try{if(window.GPDB&&GPDB.save)await GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){} if(window.updateSidebarBadges)try{window.updateSidebarBadges();}catch(e){}}
function money(v){if(v==null||v==='')return '—'; if(String(v).match(/FCFA|€|\$/i))return String(v); var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.'));return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':String(v);}
function num(v){var n=Number(String(v||'').replace(/[^0-9,.-]/g,'').replace(',','.'));return Number.isFinite(n)?n:0;}
function id(p){return p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function toast(m,t){if(window.toast)window.toast(m,t);else console.log(m)}
function iconBtn(cls,icon,title,onclick){return '<button class="gp-mini-action '+cls+'" title="'+esc(title)+'" onclick="event.stopPropagation();'+onclick+'"><span class="material-symbols-rounded">'+icon+'</span></button>';}
function statusClass(s){s=String(s||'').toLowerCase(); if(s.indexOf('att')>-1||s.indexOf('brou')>-1)return 'warn'; if(s.indexOf('inact')>-1||s.indexOf('résil')>-1||s.indexOf('expire')>-1)return 'off'; return '';}
function inject(){if(document.getElementById('gp-final-biens-forms-style'))return;document.head.insertAdjacentHTML('beforeend','<style id="gp-final-biens-forms-style">'+
'.gp-modern-page{padding:8px 24px!important}.gp-page-top{display:flex!important;align-items:center!important;gap:12px!important;margin-bottom:8px!important}.gp-stat-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:10px!important;flex:1!important}.gp-stat-card{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important;padding:12px 16px!important;display:flex!important;align-items:center!important;gap:12px!important;min-height:66px!important}.gp-stat-ico{width:40px!important;height:40px!important;border-radius:10px!important;background:#fffbeb!important;color:#D4AF37!important;display:flex!important;align-items:center!important;justify-content:center!important}.gp-stat-card strong{font-size:24px!important;display:block!important;line-height:1!important;color:#111827!important}.gp-stat-card span{display:block!important;font-size:12px!important;font-weight:700!important;color:#374151!important;margin-top:4px!important}.gp-stat-card em{display:block!important;font-size:11px!important;color:#9ca3af!important;font-style:normal!important}.gp-primary{height:40px!important;border:0!important;border-radius:8px!important;background:#2563eb!important;color:white!important;padding:0 18px!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;gap:7px!important;cursor:pointer!important;white-space:nowrap!important}.gp-toolbar{display:flex!important;align-items:center!important;gap:8px!important;margin-bottom:8px!important}.gp-search{height:36px!important;width:250px!important;display:flex!important;align-items:center!important;gap:7px!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:8px!important;padding:0 10px!important}.gp-search input{border:0!important;outline:0!important;background:transparent!important;width:100%!important;font-size:13px!important}.gp-select,.gp-outline{height:36px!important;border:1px solid #e5e7eb!important;background:#fff!important;border-radius:8px!important;padding:0 12px!important;font-size:13px!important;color:#374151!important}.gp-outline{display:inline-flex!important;align-items:center!important;gap:5px!important;cursor:pointer!important}.gp-table-wrap{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important;overflow:hidden!important;box-shadow:0 10px 24px rgba(15,23,42,.03)!important}.gp-table{width:100%!important;border-collapse:collapse!important}.gp-table th{padding:10px 12px!important;background:#fffaf0!important;border-bottom:1px solid #e5e7eb!important;text-align:left!important;font-size:12px!important;text-transform:uppercase!important;color:#111827!important}.gp-table td{padding:12px!important;border-bottom:1px solid #f3f4f6!important;font-size:13px!important;color:#111827!important;vertical-align:middle!important}.gp-pill{display:inline-flex!important;align-items:center!important;padding:3px 9px!important;border-radius:999px!important;font-size:11px!important;font-weight:800!important;background:#dcfce7!important;color:#15803d!important}.gp-pill.warn{background:#fef3c7!important;color:#b45309!important}.gp-pill.off{background:#fee2e2!important;color:#b91c1c!important}.gp-actions{display:flex!important;gap:6px!important;justify-content:center!important}.gp-mini-action{width:28px!important;height:28px!important;border-radius:7px!important;border:1px solid #e5e7eb!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}.gp-mini-action span{font-size:16px!important}.gp-mini-action.view{color:#0284c7!important}.gp-mini-action.edit{color:#ca8a04!important}.gp-mini-action.docs{color:#0f172a!important}.gp-mini-action.del{color:#dc2626!important}.gp-footer{padding:14px 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-top:1px solid #f3f4f6!important;color:#64748b!important;font-size:13px!important}.gp-pages{display:flex!important;align-items:center!important;gap:6px!important}.gp-page-btn{min-width:30px!important;height:30px!important;border-radius:7px!important;border:1px solid #e5e7eb!important;background:#fff!important;color:#374151!important;font-weight:700!important;cursor:pointer!important}.gp-page-btn.active{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}.gp-empty{padding:48px!important;text-align:center!important;color:#9ca3af!important}.gp-biens-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))!important;gap:18px!important}.gp-bien-card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,.08);border:1px solid #eef2f7;position:relative}.gp-bien-card-img{height:128px;background:#e5e7eb;overflow:hidden}.gp-bien-card-img img{width:100%;height:100%;object-fit:cover;display:block}.gp-bien-card-body{padding:12px 14px}.gp-bien-card-title{font-size:15px;font-weight:800;color:#111827;margin-bottom:3px}.gp-bien-card-meta{display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b}.gp-bien-card-price{margin-top:10px;font-size:13px;font-weight:800;color:#D4AF37}.gp-bien-card-owner{font-size:11px;color:#a78bfa;float:right;font-weight:500}.gp-bien-badge{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:800;background:#fef3c7;color:#92400e;position:absolute;right:10px;top:10px}.gp-unit-badge{display:inline-flex;margin-top:8px;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:700;background:#fde68a;color:#92400e}.gp-unit-line{display:block;margin-top:6px;font-size:11px;font-weight:800}.gp-unit-line.ok{color:#15803d}.gp-unit-line.free{color:#2563eb}.gp-drawer-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1400;opacity:0;transition:opacity .25s}.gp-drawer{display:none;position:fixed;top:0;right:0;height:100vh;width:480px;max-width:100vw;background:#fff;z-index:1401;box-shadow:-8px 0 32px rgba(0,0,0,.15);transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);flex-direction:column}.gp-drawer-head{padding:20px 24px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between}.gp-drawer-title{font-size:20px;font-weight:800;color:#111827}.gp-drawer-sub{font-size:13px;color:#6b7280;margin-top:3px}.gp-drawer-close{border:0;background:transparent;color:#6b7280;cursor:pointer}.gp-drawer-body{flex:1;overflow:auto;padding:20px 24px}.gp-drawer-section{margin-bottom:20px}.gp-drawer-section h3{font-size:13px;font-weight:800;color:#111827;border-bottom:1px solid #f3f4f6;padding-bottom:10px;margin:0 0 14px}.gp-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.gp-form-row.full{grid-template-columns:1fr}.gp-field{display:flex;flex-direction:column;gap:6px}.gp-field label{font-size:12px;color:#374151;font-weight:600}.gp-field label b{color:#ef4444}.gp-field input,.gp-field select,.gp-field textarea{width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:8px;background:#fff;font-size:13px;color:#111827;outline:0}.gp-field input,.gp-field select{height:38px;padding:0 12px}.gp-field textarea{min-height:72px;padding:10px 12px;resize:vertical}.gp-field input:focus,.gp-field select:focus,.gp-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.14)}.gp-photo-box{border:2px dashed #e5e7eb;border-radius:12px;padding:22px;text-align:center;color:#9ca3af;cursor:pointer}.gp-photo-box span{font-size:42px;color:#cbd5e1}.gp-photo-preview{display:none;width:100%;height:110px;object-fit:cover;border-radius:10px}.gp-photo-actions{display:flex;gap:8px;justify-content:center;margin-top:10px}.gp-photo-actions button{height:32px;border-radius:7px;padding:0 14px;border:1px solid #bfdbfe;background:#eff6ff;color:#3b82f6}.gp-photo-actions button.del{border-color:#fecaca;background:#fef2f2;color:#ef4444}.gp-phone-line{display:flex;gap:6px}.gp-phone-country{height:38px;min-width:98px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}.gp-drawer-foot{padding:16px 24px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;background:#fff}.gp-cancel{height:38px;padding:0 20px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#374151}.gp-save{height:38px;padding:0 24px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:800}.gp-line{display:flex;align-items:center;gap:6px}.gp-line .material-symbols-rounded{font-size:16px;color:#64748b}</style>');}
function pageBtns(kind,total){var ps=PS[kind]||10, max=Math.max(1,Math.ceil(total/ps));PAGE[kind]=Math.min(Math.max(1,PAGE[kind]||1),max);var h='<div class="gp-pages"><button class="gp-page-btn" onclick="gpFinalPage(\''+kind+'\','+(PAGE[kind]-1)+')">‹</button>';for(var i=1;i<=max;i++){if(i===1||i===max||Math.abs(i-PAGE[kind])<=1)h+='<button class="gp-page-btn '+(i===PAGE[kind]?'active':'')+'" onclick="gpFinalPage(\''+kind+'\','+i+')">'+i+'</button>';else if(Math.abs(i-PAGE[kind])===2)h+='<span>…</span>';}return h+'<button class="gp-page-btn" onclick="gpFinalPage(\''+kind+'\','+(PAGE[kind]+1)+')">›</button></div>';}
window.gpFinalPage=function(k,p){PAGE[k]=p;if(k==='biens')renderBiensFinal();if(k==='locatives')renderLocativesFinal();if(k==='contrats')renderContratsFinal();};
function renderBiensFinal(){inject();var page=document.getElementById('page-biens');if(!page)return;var d=db(), all=Array.isArray(d.biens)?d.biens:[],q=(document.getElementById('gpBienSearch')||{}).value||'',st=(document.getElementById('gpBienStatus')||{}).value||'';var data=all.filter(function(b){return (!q||JSON.stringify(b).toLowerCase().indexOf(q.toLowerCase())>-1)&&(!st||String(b.statut||'').toLowerCase()===st.toLowerCase());});var start=((PAGE.biens||1)-1)*PS.biens,slice=data.slice(start,start+PS.biens);var dispo=all.filter(function(b){return String(b.statut||'').toLowerCase().indexOf('dispo')>-1}).length;var occ=all.filter(function(b){return String(b.statut||'').toLowerCase().indexOf('lou')>-1||String(b.statut||'').toLowerCase().indexOf('occup')>-1}).length;page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+all.length+'</strong><span>Biens</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">meeting_room</span></div><div><strong>'+dispo+'</strong><span>Disponibles</span><em>Biens libres</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+occ+'</strong><span>Occupés</span><em>Biens loués</em></div></div></div><button class="gp-primary" onclick="openGpDrawer(\'bien\')"><span class="material-symbols-rounded">add</span>Nouveau bien</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpBienSearch" value="'+esc(q)+'" placeholder="Rechercher un bien…" oninput="gpFinalPage(\'biens\',1)"></label><select id="gpBienStatus" class="gp-select" onchange="gpFinalPage(\'biens\',1)"><option value="">Tous les statuts</option><option '+(st==='Disponible'?'selected':'')+'>Disponible</option><option '+(st==='Loué'?'selected':'')+'>Loué</option><option '+(st==='En attente'?'selected':'')+'>En attente</option></select><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div>'+(data.length?'<div class="gp-biens-grid">'+slice.map(function(b){var i=all.indexOf(b),units=Array.isArray(b.unites)?b.unites:[];var loue=units.filter(function(u){return String(u.statut||'').toLowerCase().indexOf('lou')>-1}).length,free=units.length-loue;return '<div class="gp-bien-card" onclick="openBienDetail?openBienDetail('+i+'):viewRow&&viewRow(\'biens\','+i+')"><span class="gp-bien-badge">'+esc(b.statut||'En attente')+'</span><div class="gp-bien-card-img">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8"><span class="material-symbols-rounded" style="font-size:48px">apartment</span></div>')+'</div><div class="gp-bien-card-body"><div class="gp-bien-card-title">'+esc(b.nom||'Bien')+'</div><div class="gp-bien-card-meta"><span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37">apartment</span>'+esc(b.type||'Bien')+(units.length?' <span class="gp-unit-badge">'+units.length+' apparts</span>':'')+'</div><div class="gp-bien-card-price">'+money(b.valeur||b.prix||b.loyer)+'<span class="gp-bien-card-owner">'+esc(b.proprio||'')+'</span></div>'+(units.length?'<span class="gp-unit-line ok">Appartement 1 · '+(loue?'Loué':'Disponible')+'</span>'+(units[1]?'<span class="gp-unit-line free">Appartement 2 · '+esc(units[1].statut||'Disponible')+'</span>':''):'')+'</div></div>';}).join('')+'</div><div class="gp-footer" style="margin-top:14px;background:#fff;border:1px solid #e5e7eb;border-radius:12px"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.biens,data.length)+' sur '+data.length+' bien'+(data.length>1?'s':'')+'</span>'+pageBtns('biens',data.length)+'</div>':'<div class="gp-empty">Aucun bien trouvé</div>')+'</div>';}
function renderLocativesFinal(){inject();var page=document.getElementById('page-locatives');if(!page)return;var d=db(),all=Array.isArray(d.locatives)?d.locatives:[],q=(document.getElementById('gpLocativeSearch')||{}).value||'';var data=all.filter(function(l){return !q||JSON.stringify(l).toLowerCase().indexOf(q.toLowerCase())>-1;});var start=((PAGE.locatives||1)-1)*PS.locatives,slice=data.slice(start,start+PS.locatives);var act=all.filter(function(l){return String(l.statut||'Loué').toLowerCase().indexOf('lou')>-1||String(l.statut||'Actif').toLowerCase()==='actif';}).length;page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+all.length+'</strong><span>Locations</span><em>Total enregistrées</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+act+'</strong><span>Occupées</span><em>Locations actives</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,l){return s+num(l.loyer||l.montant);},0))+'</strong><span>Loyers</span><em>Total mensuel</em></div></div></div><button class="gp-primary" onclick="openGpDrawer(\'locative\')"><span class="material-symbols-rounded">add</span>Nouvelle location</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpLocativeSearch" value="'+esc(q)+'" placeholder="Rechercher une location…" oninput="gpFinalPage(\'locatives\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Location</th><th>Bien</th><th>Locataire</th><th>Téléphone</th><th>Loyer</th><th>Statut</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(l){var i=all.indexOf(l);return '<tr><td><b>'+esc(l.nom||l.bien||'Location')+'</b><br><small style="color:#64748b">'+esc(l.type||l.nature||'Location')+'</small></td><td><span class="gp-line"><span class="material-symbols-rounded">home</span>'+esc(l.bien||'—')+'</span></td><td>'+esc(l.locataire||l.occupant||'—')+'</td><td>'+esc(l.tel||l.telephone||'—')+'</td><td><b>'+money(l.loyer||l.montant)+'</b></td><td><span class="gp-pill '+statusClass(l.statut)+'">'+esc(l.statut||'Loué')+'</span></td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'locatives\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'locatives\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'locatives\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.locatives,data.length)+' sur '+data.length+' location'+(data.length>1?'s':'')+'</span>'+pageBtns('locatives',data.length)+'</div>':'<div class="gp-empty">Aucune location trouvée</div>')+'</div></div>';}
function renderContratsFinal(){inject();var page=document.getElementById('page-contrats');if(!page)return;var d=db(),all=Array.isArray(d.contrats)?d.contrats:[],q=(document.getElementById('gpContratSearch')||{}).value||'';var data=all.filter(function(c){return !q||JSON.stringify(c).toLowerCase().indexOf(q.toLowerCase())>-1;});var start=((PAGE.contrats||1)-1)*PS.contrats,slice=data.slice(start,start+PS.contrats);var actifs=all.filter(function(c){return String(c.statut||'Actif').toLowerCase()==='actif';}).length;page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">description</span></div><div><strong>'+all.length+'</strong><span>Contrats</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">verified</span></div><div><strong>'+actifs+'</strong><span>Actifs</span><em>Contrats actifs</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,c){return s+num(c.loyer);},0))+'</strong><span>Loyers</span><em>Total contrats</em></div></div></div><button class="gp-primary" onclick="openGpDrawer(\'contrat\')"><span class="material-symbols-rounded">add</span>Nouveau contrat</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpContratSearch" value="'+esc(q)+'" placeholder="Rechercher un contrat…" oninput="gpFinalPage(\'contrats\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'contrats\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Locataire</th><th>Location</th><th>Type contrat</th><th>Date début</th><th>Date fin</th><th>Statut</th><th>Prochain paiement</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(c){var i=all.indexOf(c);return '<tr><td><b>'+esc(c.locataire||'—')+'</b><br><small style="color:#64748b">'+esc(c.num||c.numero||('CT-'+(i+1)))+'</small></td><td>'+esc(c.locative||c.bien||'—')+'</td><td>'+esc(c.type||'Habitation')+'</td><td>'+esc(c.debut||c.dateDebut||'—')+'</td><td>'+esc(c.fin||c.dateFin||'—')+'</td><td><span class="gp-pill '+statusClass(c.statut)+'">'+esc(c.statut||'Actif')+'</span></td><td>'+esc(c.prochain||c.prochainPaiement||'—')+'</td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'contrats\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'contrats\','+i+')')+iconBtn('docs','picture_as_pdf','PDF','generateContratPDF&&generateContratPDF('+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'contrats\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.contrats,data.length)+' sur '+data.length+' contrat'+(data.length>1?'s':'')+'</span>'+pageBtns('contrats',data.length)+'</div>':'<div class="gp-empty">Aucun contrat trouvé</div>')+'</div></div>';}
function imgPreview(input){var file=input.files&&input.files[0],prev=document.getElementById('gp-photo-preview'),ico=document.getElementById('gp-photo-ico');if(!file)return;var r=new FileReader();r.onload=function(e){prev.src=e.target.result;prev.style.display='block';if(ico)ico.style.display='none'};r.readAsDataURL(file)}
function getPhoto(){return new Promise(function(resolve){var inp=document.getElementById('gp-d-photo');var file=inp&&inp.files&&inp.files[0];if(!file)return resolve('');var r=new FileReader();r.onload=function(e){resolve(e.target.result||'')};r.onerror=function(){resolve('')};r.readAsDataURL(file);});}

function gpFullName(o){return [o&&o.prenom,o&&o.nom].filter(Boolean).join(' ').trim() || (o&&o.nom) || (o&&o.name) || '';}
function gpPropOptions(){var d=db(), out=['<option value="">Sélectionner un propriétaire existant</option>']; (d.proprietaires||[]).forEach(function(p){var n=gpFullName(p); if(!n)return; var info=p.tel||p.email||''; out.push('<option value="'+esc(n)+'" data-id="'+esc(p.id||'')+'">'+esc(n+(info?' — '+info:''))+'</option>');}); return out.join('');}
function gpLocOptions(){var d=db(), out=['<option value="">Sélectionner un locataire existant</option>']; (d.locataires||[]).forEach(function(l){var n=gpFullName(l); if(!n)return; var tel=l.tel||l.telephone||l.phone||''; out.push('<option value="'+esc(n)+'" data-tel="'+esc(tel)+'">'+esc(n+(tel?' — '+tel:''))+'</option>');}); return out.join('');}
function gpUnitLabel(b,u){return (b&&b.nom?b.nom:'Bien')+(u&&u.nom?' - '+u.nom:'');}
function gpBienOptions(){var d=db(), out=['<option value="">Sélectionner un bien / appartement existant</option>']; (d.biens||[]).forEach(function(b){var units=Array.isArray(b.unites)?b.unites:[]; if(units.length){out.push('<optgroup label="'+esc(b.nom||'Bien')+'">'); units.forEach(function(u){var label=gpUnitLabel(b,u); var statut=u.statut||'Disponible'; out.push('<option value="'+esc(label)+'" data-parent="'+esc(b.nom||'')+'" data-loyer="'+esc(u.loyer||b.loyer||b.valeurLocative||'')+'">'+esc((u.nom||label)+' — '+statut)+'</option>');}); out.push('</optgroup>');} else {out.push('<option value="'+esc(b.nom||'')+'" data-parent="'+esc(b.nom||'')+'" data-loyer="'+esc(b.loyer||b.valeurLocative||'')+'">'+esc((b.nom||'Bien')+' — '+(b.statut||'Disponible'))+'</option>');}}); return out.join('');}
function gpSyncDrawerLocataire(){var s=document.getElementById('gp-l-locataire'), tel=document.getElementById('gp-l-tel'); if(!s||!tel)return; var opt=s.options&&s.options[s.selectedIndex]; tel.value=(opt&&opt.dataset&&opt.dataset.tel)||'';}
function gpSyncDrawerBien(){var s=document.getElementById('gp-l-bien'), loyer=document.getElementById('gp-l-loyer'); if(!s||!loyer||loyer.value)return; var opt=s.options&&s.options[s.selectedIndex]; var raw=(opt&&opt.dataset&&opt.dataset.loyer)||''; if(raw)loyer.value=money(raw).replace(/\s*FCFA$/,'');}
window.gpSyncDrawerLocataire=gpSyncDrawerLocataire; window.gpSyncDrawerBien=gpSyncDrawerBien;
function drawerHtml(kind){var title={bien:'Nouveau bien',locative:'Nouvelle location',contrat:'Nouveau contrat'}[kind],sub={bien:'Ajoutez un nouveau bien à votre portefeuille',locative:'Ajoutez une nouvelle location à votre portefeuille',contrat:'Ajoutez un nouveau contrat à votre portefeuille'}[kind];var body='';
 if(kind==='bien')body='<div class="gp-drawer-section"><h3>Photo</h3><div class="gp-photo-box" onclick="document.getElementById(\'gp-d-photo\').click()"><span id="gp-photo-ico" class="material-symbols-rounded">image</span><img id="gp-photo-preview" class="gp-photo-preview"><div>Cliquez pour ajouter une photo</div><input id="gp-d-photo" type="file" accept="image/*" style="display:none"></div><div class="gp-photo-actions"><button type="button" onclick="document.getElementById(\'gp-d-photo\').click()">Choisir</button><button class="del" type="button" onclick="document.getElementById(\'gp-d-photo\').value=\'\';document.getElementById(\'gp-photo-preview\').style.display=\'none\';document.getElementById(\'gp-photo-ico\').style.display=\'inline-block\'">Supprimer</button></div></div><div class="gp-drawer-section"><h3>Informations</h3><div class="gp-form-row"><div class="gp-field"><label>Nom du bien <b>*</b></label><input id="gp-b-nom" placeholder="Nom"></div><div class="gp-field"><label>Type <b>*</b></label><select id="gp-b-type"><option>Immeuble</option><option>Appartement</option><option>Villa</option><option>Terrain</option><option>Bureau</option></select></div></div><div class="gp-form-row"><div class="gp-field"><label>Propriétaire <b>*</b></label><select id="gp-b-proprio">'+gpPropOptions()+'</select></div><div class="gp-field"><label>Valeur / Prix <b>*</b></label><input id="gp-b-valeur" placeholder="300000 FCFA"></div></div><div class="gp-form-row"><div class="gp-field"><label>Nombre appartements</label><input id="gp-b-nb" type="number" min="0" placeholder="2"></div><div class="gp-field"><label>Statut</label><select id="gp-b-statut"><option>En attente</option><option>Disponible</option><option>Loué</option></select></div></div><div class="gp-form-row full"><div class="gp-field"><label>Adresse</label><input id="gp-b-adresse" placeholder="Adresse complète"></div></div></div>';
 if(kind==='locative')body='<div class="gp-drawer-section"><h3>Location</h3><div class="gp-form-row"><div class="gp-field"><label>Bien <b>*</b></label><select id="gp-l-bien" onchange="gpSyncDrawerBien()">'+gpBienOptions()+'</select></div><div class="gp-field"><label>Locataire <b>*</b></label><select id="gp-l-locataire" onchange="gpSyncDrawerLocataire()">'+gpLocOptions()+'</select></div></div><div class="gp-form-row"><div class="gp-field"><label>Type</label><select id="gp-l-type"><option>Location</option><option>Habitation</option><option>Commercial</option></select></div><div class="gp-field"><label>Statut</label><select id="gp-l-statut"><option>Loué</option><option>Disponible</option><option>En attente</option></select></div></div><div class="gp-form-row full"><div class="gp-field"><label>Téléphone locataire</label><input id="gp-l-tel" readonly placeholder="Auto depuis le locataire"></div></div></div><div class="gp-drawer-section"><h3>Loyer</h3><div class="gp-form-row full"><div class="gp-field"><label>Loyer <b>*</b></label><input id="gp-l-loyer" placeholder="300000 FCFA"></div></div><div class="gp-form-row"><div class="gp-field"><label>Date début</label><input id="gp-l-debut" type="date"></div><div class="gp-field"><label>Date fin</label><input id="gp-l-fin" type="date"></div></div></div>';
 if(kind==='contrat')body='<div class="gp-drawer-section"><h3>Contrat</h3><div class="gp-form-row"><div class="gp-field"><label>N° contrat</label><input id="gp-c-num" placeholder="CT-0001"></div><div class="gp-field"><label>Type contrat</label><select id="gp-c-type"><option>Bail habitation</option><option>Bail commercial</option><option>Contrat location</option></select></div></div><div class="gp-form-row"><div class="gp-field"><label>Locataire <b>*</b></label><input id="gp-c-locataire" placeholder="Locataire"></div><div class="gp-field"><label>Location <b>*</b></label><input id="gp-c-locative" placeholder="Bien / Location"></div></div></div><div class="gp-drawer-section"><h3>Dates & paiement</h3><div class="gp-form-row"><div class="gp-field"><label>Date début <b>*</b></label><input id="gp-c-debut" type="date"></div><div class="gp-field"><label>Date fin</label><input id="gp-c-fin" type="date"></div></div><div class="gp-form-row"><div class="gp-field"><label>Loyer <b>*</b></label><input id="gp-c-loyer" placeholder="300000 FCFA"></div><div class="gp-field"><label>Statut</label><select id="gp-c-statut"><option>Actif</option><option>En attente</option><option>Expiré</option><option>Résilié</option></select></div></div><div class="gp-form-row full"><div class="gp-field"><label>Prochain paiement</label><input id="gp-c-prochain" type="date"></div></div></div>';
 return '<div id="gpDrawerOverlay" class="gp-drawer-overlay" onclick="closeGpDrawer()"></div><div id="gpDrawer" class="gp-drawer"><div class="gp-drawer-head"><div><div class="gp-drawer-title">'+title+'</div><div class="gp-drawer-sub">'+sub+'</div></div><button class="gp-drawer-close" onclick="closeGpDrawer()"><span class="material-symbols-rounded">close</span></button></div><div class="gp-drawer-body">'+body+'</div><div class="gp-drawer-foot"><button class="gp-cancel" onclick="closeGpDrawer()">Annuler</button><button class="gp-save" onclick="saveGpDrawer(\''+kind+'\')">Enregistrer</button></div></div>';}
window.openGpDrawer=function(kind){inject();document.querySelectorAll('#gpDrawer,#gpDrawerOverlay').forEach(function(e){e.remove()});document.body.insertAdjacentHTML('beforeend',drawerHtml(kind));var o=document.getElementById('gpDrawerOverlay'),dr=document.getElementById('gpDrawer');var f=document.getElementById('gp-d-photo');if(f)f.onchange=function(){imgPreview(this)}; if(kind==='locative'){setTimeout(function(){gpSyncDrawerLocataire();gpSyncDrawerBien();},0);} o.style.display='block';dr.style.display='flex';requestAnimationFrame(function(){o.style.opacity='1';dr.style.transform='translateX(0)';});};
window.closeGpDrawer=function(){var o=document.getElementById('gpDrawerOverlay'),dr=document.getElementById('gpDrawer');if(o)o.style.opacity='0';if(dr)dr.style.transform='translateX(100%)';setTimeout(function(){if(o)o.remove();if(dr)dr.remove();},260);};
window.saveGpDrawer=async function(kind){var d=db(); if(kind==='bien'){if(!Array.isArray(d.biens))d.biens=[];var photo=await getPhoto();var nb=parseInt((document.getElementById('gp-b-nb')||{}).value||'0',10)||0;var bien={id:id('BI'),nom:(document.getElementById('gp-b-nom')||{}).value||'',type:(document.getElementById('gp-b-type')||{}).value||'Bien',proprio:(document.getElementById('gp-b-proprio')||{}).value||'',valeur:(document.getElementById('gp-b-valeur')||{}).value||'',adresse:(document.getElementById('gp-b-adresse')||{}).value||'',statut:(document.getElementById('gp-b-statut')||{}).value||'En attente',nbAppart:nb||'',photo:photo,documents:[]};if(!bien.nom)return toast('Le nom du bien est requis','err');if(nb>0){bien.unites=[];for(var i=1;i<=nb;i++)bien.unites.push({id:id('UNT'),nom:'Appartement '+i,statut:i===1?'Loué':'Disponible',loyer:'',locataire:''});}d.biens.push(bien);await saveDb(d);closeGpDrawer();renderBiensFinal();toast('Bien enregistré avec succès ✓');return;}
 if(kind==='locative'){if(!Array.isArray(d.locatives))d.locatives=[];var loc={id:id('LOC'),nom:(document.getElementById('gp-l-bien')||{}).value||'',bien:(document.getElementById('gp-l-bien')||{}).value||'',locataire:(document.getElementById('gp-l-locataire')||{}).value||'',occupant:(document.getElementById('gp-l-locataire')||{}).value||'',type:(document.getElementById('gp-l-type')||{}).value||'Location',tel:(document.getElementById('gp-l-tel')||{}).value||'',loyer:(document.getElementById('gp-l-loyer')||{}).value||'',debut:(document.getElementById('gp-l-debut')||{}).value||'',fin:(document.getElementById('gp-l-fin')||{}).value||'',statut:(document.getElementById('gp-l-statut')||{}).value||'Loué'};if(!loc.bien||!loc.locataire)return toast('Bien et locataire sont requis','err');d.locatives.push(loc);await saveDb(d);closeGpDrawer();renderLocativesFinal();toast('Location enregistrée avec succès ✓');return;}
 if(kind==='contrat'){if(!Array.isArray(d.contrats))d.contrats=[];var ct={id:id('CT'),num:(document.getElementById('gp-c-num')||{}).value||('CT-'+Date.now()),type:(document.getElementById('gp-c-type')||{}).value||'Bail habitation',locataire:(document.getElementById('gp-c-locataire')||{}).value||'',locative:(document.getElementById('gp-c-locative')||{}).value||'',debut:(document.getElementById('gp-c-debut')||{}).value||'',fin:(document.getElementById('gp-c-fin')||{}).value||'',loyer:(document.getElementById('gp-c-loyer')||{}).value||'',statut:(document.getElementById('gp-c-statut')||{}).value||'Actif',prochain:(document.getElementById('gp-c-prochain')||{}).value||''};if(!ct.locataire||!ct.locative)return toast('Locataire et location sont requis','err');d.contrats.push(ct);await saveDb(d);closeGpDrawer();renderContratsFinal();toast('Contrat enregistré avec succès ✓');return;}};
var oldRP=window.renderPage;window.renderPage=function(p){if(p==='biens'){renderBiensFinal();return}if(p==='locatives'||p==='locations'){renderLocativesFinal();return}if(p==='contrats'){renderContratsFinal();return}if(p==='nv-bien'){openGpDrawer('bien');return}if(p==='nv-locative'){openGpDrawer('locative');return}if(p==='nv-contrat'){openGpDrawer('contrat');return}return oldRP?oldRP.apply(this,arguments):undefined};
var oldNav=window.navigate;window.navigate=function(p){if(p==='biens'){if(oldNav)oldNav.call(this,p);setTimeout(renderBiensFinal,30);return}if(p==='locatives'||p==='locations'){if(oldNav)oldNav.call(this,'locatives');setTimeout(renderLocativesFinal,30);return}if(p==='contrats'){if(oldNav)oldNav.call(this,p);setTimeout(renderContratsFinal,30);return}if(p==='nv-bien'){openGpDrawer('bien');return}if(p==='nv-locative'){openGpDrawer('locative');return}if(p==='nv-contrat'){openGpDrawer('contrat');return}return oldNav?oldNav.apply(this,arguments):undefined};
window.renderBiensFinal=renderBiensFinal;window.renderLocativesFinal=renderLocativesFinal;window.renderContratsFinal=renderContratsFinal;
document.addEventListener('DOMContentLoaded',function(){inject();setTimeout(function(){var a=document.querySelector('.page.active');if(a){if(a.id==='page-biens')renderBiensFinal();if(a.id==='page-locatives')renderLocativesFinal();if(a.id==='page-contrats')renderContratsFinal();}},800);});
})();

/* ===== Source consolidée: js/pages/fix-biens-affichage-final.js ===== */
/* Correctif final : page Biens sans erreur "Erreur affichage : page:biens".
   Le bug venait du renderer historique renderBiensCards appelé par la navigation,
   avant les overrides modernes. On force ici le renderer moderne déjà présent. */
(function(){
  'use strict';
  function renderBiensSafe(){
    if(typeof window.renderBiensFinal === 'function') return window.renderBiensFinal();
    if(typeof window.renderBiensFinal2 === 'function') return window.renderBiensFinal2();
    if(typeof window.renderBiensCards === 'function'){
      try { return window.renderBiensCards(); }
      catch(e){ console.error('[fix-biens-affichage-final] renderBiensCards error', e); return null; }
    }
    return null;
  }
  function register(){
    try{
      if(window.GPNavigation && typeof window.GPNavigation.registerRenderer === 'function'){
        window.GPNavigation.registerRenderer('biens', renderBiensSafe);
      }
    }catch(e){ console.error('[fix-biens-affichage-final] register error', e); }
  }
  register();
  document.addEventListener('DOMContentLoaded', function(){
    register();
    setTimeout(function(){
      register();
      var page = document.getElementById('page-biens');
      if(page && page.classList.contains('active')) renderBiensSafe();
    }, 300);
  });
  document.addEventListener('gp:navigation', function(ev){
    if(ev && ev.detail && ev.detail.page === 'biens') setTimeout(renderBiensSafe, 20);
  });
})();

/* ===== Source consolidée: js/pages/actions-drawers-override.js ===== */
/**
 * actions-drawers-override.js  — v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Remplace les boutons Voir / Modifier (qui ouvraient l'ancien #rowModal centré)
 * par des drawers latéraux modernes cohérents avec les nouveaux formulaires.
 *
 * Entités couvertes :
 *   locataires · propriétaires · employés · biens · locations · contrats
 *   paiements  · dépenses
 *
 * Principe :
 *   - viewRow(key, idx)  → drawer "Fiche" (lecture seule + bouton Modifier)
 *   - editRow(key, idx)  → drawer "Modifier" (formulaire pré-rempli + Enregistrer)
 *   - delRow  non touché (confirm + suppression déjà OK)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════ */
  var DB_ID = 'gpActionsDrawer';
  var OV_ID = 'gpActionsOverlay';

  function db() {
    if (window.GPDB && window.GPDB.load) return window.GPDB.load();
    return window.DB || {};
  }
  function saveDb(data) {
    if (window.GPDB && window.GPDB.save) return window.GPDB.save(data);
    window.DB = data;
    if (typeof window.saveDB === 'function') window.saveDB();
  }
  function esc(v) {
    return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function money(v) {
    var n = Number(String(v || '').replace(/[^0-9.-]/g, '')) || 0;
    return n.toLocaleString('fr-FR') + ' FCFA';
  }
  function rerender(key) {
    var map = {
      locataires: ['renderLocatairesModern'],
      proprietaires: ['renderProprietairesModern', 'renderProprietairesCards'],
      employes: ['renderEmployesModern'],
      biens: ['renderBiensFinal', 'renderBiensFinal2', 'renderBiensCards'],
      locatives: ['renderLocativesFinal', 'renderLocativesModern'],
      contrats: ['renderContratsFinal', 'renderContratsModern'],
      paiements: ['renderPaiementsFinal', 'renderPaiements'],
      depenses: ['renderDepensesFinal', 'renderDepenses'],
    };
    var fns = map[key] || [];
    for (var i = 0; i < fns.length; i++) {
      if (typeof window[fns[i]] === 'function') {
        window[fns[i]]();
        return;
      }
    }
    if (typeof window.renderPage === 'function') window.renderPage(key);
    else if (typeof window.renderTable === 'function') window.renderTable(key);
  }

  /* ══════════════════════════════════════════════════════════
     DRAWER SHELL
  ══════════════════════════════════════════════════════════ */
  function injectBaseCSS() {
    if (document.getElementById('gp-ad-css')) return;
    var s = document.createElement('style');
    s.id = 'gp-ad-css';
    s.textContent = `
/* ── Actions Drawer ── */
#gpActionsOverlay{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:1500;opacity:0;transition:opacity .25s;display:none}
#gpActionsDrawer{position:fixed;top:0;right:0;height:100vh;width:520px;max-width:100vw;background:#fff;z-index:1501;box-shadow:-8px 0 32px rgba(0,0,0,.14);transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:none;flex-direction:column}
.gpad-head{padding:20px 24px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:flex-start}
.gpad-head-left{}
.gpad-title{font-size:19px;font-weight:800;color:#111827;margin:0}
.gpad-sub{font-size:12px;color:#6b7280;margin-top:3px}
.gpad-close{border:0;background:transparent;color:#9ca3af;cursor:pointer;padding:4px;border-radius:6px;transition:.15s}
.gpad-close:hover{background:#f3f4f6;color:#374151}
.gpad-body{flex:1;overflow-y:auto;padding:20px 24px}
.gpad-foot{padding:14px 24px;border-top:1px solid #f3f4f6;display:flex;justify-content:flex-end;gap:10px;background:#fff}
.gpad-btn{height:38px;border-radius:8px;padding:0 20px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;border:0}
.gpad-btn.cancel{background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}
.gpad-btn.primary{background:#D4AF37;color:#111827}
.gpad-btn.danger{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}
.gpad-btn.blue{background:#2563eb;color:#fff}
.gpad-btn:disabled{opacity:.5;cursor:not-allowed}

/* ── View mode ── */
.gpad-profile-band{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-radius:14px;padding:16px;margin-bottom:18px}
.gpad-avatar{width:68px;height:68px;border-radius:14px;background:#D4AF37;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;flex-shrink:0;overflow:hidden}
.gpad-avatar img{width:100%;height:100%;object-fit:cover}
.gpad-profile-name{font-size:18px;font-weight:800;color:#111827}
.gpad-profile-sub{font-size:12px;color:#6b7280;margin-top:3px}
.gpad-section{margin-bottom:20px}
.gpad-section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#9ca3af;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6}
.gpad-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gpad-field{background:#f9fafb;border-radius:9px;padding:10px 12px}
.gpad-field.full{grid-column:1/-1}
.gpad-field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#9ca3af;display:block;margin-bottom:3px}
.gpad-field span{font-size:13px;font-weight:600;color:#111827}
.gpad-pill{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800}
.gpad-pill.ok{background:#dcfce7;color:#15803d}
.gpad-pill.warn{background:#fef3c7;color:#b45309}
.gpad-pill.off{background:#fee2e2;color:#b91c1c}
.gpad-pill.blue{background:#dbeafe;color:#1e40af}

/* ── Edit mode ── */
.gpad-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.gpad-form-row.full{grid-template-columns:1fr}
.gpad-fg{display:flex;flex-direction:column;gap:5px}
.gpad-fg label{font-size:11.5px;font-weight:700;color:#374151}
.gpad-fg label b{color:#ef4444}
.gpad-fg input,.gpad-fg select,.gpad-fg textarea{
  border:1px solid #e5e7eb;border-radius:8px;background:#fff;font-size:13px;
  color:#111827;outline:0;box-sizing:border-box;width:100%}
.gpad-fg input,.gpad-fg select{height:38px;padding:0 12px}
.gpad-fg textarea{min-height:72px;padding:10px 12px;resize:vertical}
.gpad-fg input:focus,.gpad-fg select:focus,.gpad-fg textarea:focus{border-color:#D4AF37;box-shadow:0 0 0 3px rgba(212,175,55,.15)}
.gpad-photo-box{border:2px dashed #e5e7eb;border-radius:12px;padding:18px;text-align:center;cursor:pointer;margin-bottom:14px}
.gpad-photo-preview{width:80px;height:80px;border-radius:10px;object-fit:cover;border:2px solid #D4AF37;display:none;margin:0 auto 8px}
.gpad-section-edit{margin-bottom:20px}
.gpad-section-edit h3{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#374151;border-bottom:1px solid #f3f4f6;padding-bottom:8px;margin-bottom:12px}
    `;
    document.head.appendChild(s);
  }

  function openDrawer(headHTML, bodyHTML, footHTML) {
    injectBaseCSS();
    document.querySelectorAll('#' + DB_ID + ',#' + OV_ID).forEach(function (e) { e.remove(); });
    var html = '<div id="' + OV_ID + '" onclick="window.gpCloseActionsDrawer()"></div>' +
      '<div id="' + DB_ID + '">' +
      headHTML +
      '<div class="gpad-body">' + bodyHTML + '</div>' +
      '<div class="gpad-foot">' + footHTML + '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    var ov = document.getElementById(OV_ID);
    var dr = document.getElementById(DB_ID);
    ov.style.display = 'block';
    dr.style.display = 'flex';
    requestAnimationFrame(function () {
      ov.style.opacity = '1';
      dr.style.transform = 'translateX(0)';
    });
  }

  window.gpCloseActionsDrawer = function () {
    if (window.GPUIManager) { window.GPUIManager.closeActionsDrawer(); return; }
    var ov = document.getElementById(OV_ID);
    var dr = document.getElementById(DB_ID);
    if (ov) ov.remove();
    if (dr) dr.remove();
    document.body.style.overflow = '';
  };

  function head(icon, title, sub) {
    return '<div class="gpad-head">' +
      '<div class="gpad-head-left">' +
      '<div class="gpad-title"><span class="material-symbols-rounded" style="font-size:18px;color:#D4AF37;vertical-align:middle;margin-right:6px">' + icon + '</span>' + esc(title) + '</div>' +
      '<div class="gpad-sub">' + esc(sub) + '</div>' +
      '</div>' +
      '<button class="gpad-close" onclick="window.gpCloseActionsDrawer()"><span class="material-symbols-rounded" style="font-size:18px">close</span></button>' +
      '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     VIEW HELPERS
  ══════════════════════════════════════════════════════════ */
  function avatarHTML(r, iconFallback) {
    if (r && r.photo) return '<div class="gpad-avatar"><img src="' + esc(r.photo) + '"></div>';
    var initials = '';
    if (r) {
      var n = ((r.prenom || r.nom || r.libelle || r.nom || '').trim().split(' '));
      initials = n.map(function (w) { return w[0] || ''; }).slice(0, 2).join('').toUpperCase();
    }
    return initials
      ? '<div class="gpad-avatar">' + esc(initials) + '</div>'
      : '<div class="gpad-avatar" style="background:#f3f4f6;color:#9ca3af"><span class="material-symbols-rounded" style="font-size:28px">' + iconFallback + '</span></div>';
  }

  function profileBand(r, name, sub, iconFallback) {
    return '<div class="gpad-profile-band">' +
      avatarHTML(r, iconFallback) +
      '<div><div class="gpad-profile-name">' + esc(name) + '</div><div class="gpad-profile-sub">' + esc(sub) + '</div></div>' +
      '</div>';
  }

  function section(title, fieldsHTML) {
    return '<div class="gpad-section"><div class="gpad-section-title">' + title + '</div>' +
      '<div class="gpad-grid">' + fieldsHTML + '</div></div>';
  }

  function field(label, value, full, pill) {
    var cls = 'gpad-field' + (full ? ' full' : '');
    var val = pill
      ? '<span class="gpad-pill ' + pill + '">' + esc(value || '—') + '</span>'
      : esc(value || '—');
    return '<div class="' + cls + '"><label>' + label + '</label><span>' + val + '</span></div>';
  }

  function pillClass(statut) {
    var s = String(statut || '').toLowerCase();
    if (s.includes('actif') || s.includes('disponible') || s.includes('payé') || s === 'loué') return 'ok';
    if (s.includes('attente') || s.includes('provisoire')) return 'warn';
    if (s.includes('inactif') || s.includes('résilié') || s.includes('annulé')) return 'off';
    return 'blue';
  }

  /* ══════════════════════════════════════════════════════════
     EDIT HELPERS
  ══════════════════════════════════════════════════════════ */
  function eSection(title, rowsHTML) {
    return '<div class="gpad-section-edit"><h3>' + title + '</h3>' + rowsHTML + '</div>';
  }

  function eRow(fields, full) {
    return '<div class="gpad-form-row' + (full ? ' full' : '') + '">' + fields + '</div>';
  }

  function eField(label, id, type, value, required, options) {
    var req = required ? ' <b>*</b>' : '';
    var input;
    if (options) {
      var opts = options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('');
      input = '<select id="' + id + '">' + opts + '</select>';
    } else if (type === 'textarea') {
      input = '<textarea id="' + id + '" rows="3">' + esc(value) + '</textarea>';
    } else {
      input = '<input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(value) + '">';
    }
    return '<div class="gpad-fg"><label>' + label + req + '</label>' + input + '</div>';
  }

  function photoEditHTML(r, key) {
    var has = !!(r && r.photo);
    return '<div class="gpad-photo-box" onclick="document.getElementById(\'gpad-photo-inp\').click()">' +
      (has ? '<img id="gpad-photo-preview" class="gpad-photo-preview" src="' + esc(r.photo) + '" style="display:block">' : '<img id="gpad-photo-preview" class="gpad-photo-preview">') +
      '<span class="material-symbols-rounded" style="font-size:36px;color:#d1d5db' + (has ? ';display:none' : '') + '" id="gpad-photo-ico">' + (key === 'biens' ? 'home_work' : 'person') + '</span>' +
      '<div style="font-size:12px;color:#9ca3af;margin-top:6px">Cliquer pour ' + (has ? 'changer' : 'ajouter') + ' la photo</div>' +
      '</div>' +
      '<input type="file" id="gpad-photo-inp" accept="image/*" style="display:none" onchange="window.gpAdPreviewPhoto(this)">';
  }

  window.gpAdPreviewPhoto = function (input) {
    var f = input.files && input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function (e) {
      var p = document.getElementById('gpad-photo-preview');
      var ico = document.getElementById('gpad-photo-ico');
      if (p) { p.src = e.target.result; p.style.display = 'block'; }
      if (ico) ico.style.display = 'none';
    };
    r.readAsDataURL(f);
  };

  function getPhotoData() {
    return new Promise(function (resolve) {
      var inp = document.getElementById('gpad-photo-inp');
      var f = inp && inp.files && inp.files[0];
      if (!f) {
        var p = document.getElementById('gpad-photo-preview');
        return resolve(p && p.style.display !== 'none' ? p.src : '');
      }
      var r = new FileReader();
      r.onload = function (e) { resolve(e.target.result || ''); };
      r.onerror = function () { resolve(''); };
      r.readAsDataURL(f);
    });
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* ══════════════════════════════════════════════════════════
     LOCATAIRES
  ══════════════════════════════════════════════════════════ */
  function viewLocataire(r, idx) {
    var name = [r.prenom, r.nom].filter(Boolean).join(' ') || 'Locataire';
    var body = profileBand(r, name, r.email || r.tel || 'Locataire', 'person') +
      section('Identité', [
        field('Prénom', r.prenom), field('Nom', r.nom),
        field('Date naissance', r.naiss), field('Situation matrimoniale', r.matri),
        field('Profession', r.prof), field('Lieu de travail', r.travail, true),
      ].join('')) +
      section('Contact', [
        field('Téléphone', r.tel), field('Email', r.email),
        field('Adresse', r.adresse, true),
      ].join('')) +
      section('Dossier locatif', [
        field('Bien occupé', r.bien), field('Type', r.type),
        field('Statut', r.statut, false, pillClass(r.statut)), field('Date entrée', r.date),
      ].join(''));
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'locataires\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('groups', name, 'Fiche locataire'), body, foot);
  }

  function editLocataire(r, idx) {
    var body = photoEditHTML(r, 'locataires') +
      eSection('Identité',
        eRow(eField('Prénom', 'e-prenom', 'text', r.prenom, true) + eField('Nom', 'e-nom', 'text', r.nom, true)) +
        eRow(eField('Date naissance', 'e-naiss', 'date', r.naiss) + eField('Situation matrimoniale', 'e-matri', 'text', r.matri, false, ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)'])) +
        eRow(eField('Profession', 'e-prof', 'text', r.prof) + eField('Nb enfants', 'e-enfants', 'number', r.enfants)) +
        eRow(eField('Lieu de travail', 'e-travail', 'text', r.travail), true)
      ) +
      eSection('Contact',
        eRow(eField('Téléphone', 'e-tel', 'tel', r.tel, true) + eField('Email', 'e-email', 'email', r.email)) +
        eRow(eField('Adresse', 'e-adresse', 'text', r.adresse, true), true)
      ) +
      eSection('Dossier locatif',
        eRow(eField('Type', 'e-type', 'text', r.type, false, ['Particulier', 'Entreprise']) + eField('Statut', 'e-statut', 'text', r.statut, false, ['Actif', 'Inactif'])) +
        eRow(eField('Bien occupé', 'e-bien', 'text', r.bien) + eField('Date entrée', 'e-date', 'date', r.date))
      );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'locataires\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier le locataire', [r.prenom, r.nom].filter(Boolean).join(' ')), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     PROPRIÉTAIRES
  ══════════════════════════════════════════════════════════ */
  function viewProprietaire(r, idx) {
    var name = [r.prenom, r.nom].filter(Boolean).join(' ') || 'Propriétaire';
    var biens = (db().biens || []).filter(function (b) { return String(b.proprio || '').trim() === name.trim(); });
    var body = profileBand(r, name, r.email || r.tel || 'Propriétaire', 'person') +
      section('Informations personnelles', [
        field('Nom', r.nom), field('Prénom', r.prenom),
        field('Date de naissance', r.naiss), field('Situation matrimoniale', r.matri),
        field('Adresse', r.adresse, true),
      ].join('')) +
      section('Contact', [
        field('Téléphone', r.tel), field('Email', r.email),
      ].join('')) +
      '<div class="gpad-section"><div class="gpad-section-title">Biens associés (' + biens.length + ')</div>' +
      (biens.length ? biens.map(function (b) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f9fafb;border-radius:9px;margin-bottom:8px;border:1px solid #e5e7eb">' +
          '<span class="material-symbols-rounded" style="font-size:20px;color:#D4AF37">home_work</span>' +
          '<div><div style="font-weight:700;font-size:13px">' + esc(b.nom) + '</div><div style="font-size:11px;color:#6b7280">' + esc(b.type || '—') + ' · ' + esc(b.statut || '—') + '</div></div>' +
          '</div>';
      }).join('') : '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px">Aucun bien associé</div>') +
      '</div>';
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'proprietaires\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('person', name, 'Fiche propriétaire'), body, foot);
  }

  function editProprietaire(r, idx) {
    var body = photoEditHTML(r, 'proprietaires') +
      eSection('Identité',
        eRow(eField('Nom', 'e-nom', 'text', r.nom, true) + eField('Prénom', 'e-prenom', 'text', r.prenom)) +
        eRow(eField('Date naissance', 'e-naiss', 'date', r.naiss) + eField('Situation matrimoniale', 'e-matri', 'text', r.matri, false, ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)'])) +
        eRow(eField('Adresse', 'e-adresse', 'text', r.adresse), true)
      ) +
      eSection('Contact',
        eRow(eField('Téléphone', 'e-tel', 'tel', r.tel, true) + eField('Email', 'e-email', 'email', r.email))
      );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'proprietaires\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier le propriétaire', [r.prenom, r.nom].filter(Boolean).join(' ')), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     EMPLOYÉS
  ══════════════════════════════════════════════════════════ */
  function viewEmploye(r, idx) {
    var name = [r.prenom, r.nom].filter(Boolean).join(' ') || 'Employé';
    var body = profileBand(r, name, r.fonction || r.email || 'Employé', 'badge') +
      section('Identité', [
        field('Nom', r.nom), field('Prénom', r.prenom),
        field('Fonction', r.fonction), field('Type contrat', r.contrat),
        field('Date entrée', r.date), field('Statut', r.statut, false, pillClass(r.statut)),
      ].join('')) +
      section('Contact', [
        field('Téléphone', r.tel), field('Email', r.email),
        field('Adresse', r.adresse, true),
      ].join('')) +
      section('Documents', [
        field('Type pièce', r.piece), field('N° pièce', r.numpiece),
        field('Lieu délivrance', r.lieu), field('Date délivrance', r.deldeb),
        field('Date expiration', r.delexp), field('Identifiant', r.user),
      ].join(''));
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'employes\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('badge', name, 'Fiche employé'), body, foot);
  }

  function editEmploye(r, idx) {
    var body = photoEditHTML(r, 'employes') +
      eSection('Informations',
        eRow(eField('Nom', 'e-nom', 'text', r.nom, true) + eField('Prénom', 'e-prenom', 'text', r.prenom, true)) +
        eRow(eField('Fonction', 'e-fonction', 'text', r.fonction, true) + eField('Type contrat', 'e-contrat', 'text', r.contrat, false, ['CDI', 'CDD', 'Stage', 'Freelance'])) +
        eRow(eField('Date entrée', 'e-date', 'date', r.date) + eField('Statut', 'e-statut', 'text', r.statut, false, ['Actif', 'Inactif']))
      ) +
      eSection('Contact',
        eRow(eField('Téléphone', 'e-tel', 'tel', r.tel, true) + eField('Email', 'e-email', 'email', r.email, true)) +
        eRow(eField('Adresse', 'e-adresse', 'text', r.adresse), true)
      ) +
      eSection('Pièce d\'identité',
        eRow(eField('Type pièce', 'e-piece', 'text', r.piece, false, ['CNI', 'Passeport', 'Permis']) + eField('N° pièce', 'e-numpiece', 'text', r.numpiece)) +
        eRow(eField('Lieu délivrance', 'e-lieu', 'text', r.lieu) + eField('Date délivrance', 'e-deldeb', 'date', r.deldeb)) +
        eRow(eField('Date expiration', 'e-delexp', 'date', r.delexp) + eField('Identifiant / user', 'e-user', 'text', r.user))
      );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'employes\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier l\'employé', [r.prenom, r.nom].filter(Boolean).join(' ')), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     BIENS
  ══════════════════════════════════════════════════════════ */
  function viewBien(r, idx) {
    var body = '<div style="height:160px;border-radius:12px;overflow:hidden;background:#f3f4f6;margin-bottom:18px;display:flex;align-items:center;justify-content:center">' +
      (r.photo ? '<img src="' + esc(r.photo) + '" style="width:100%;height:100%;object-fit:cover">' : '<span class="material-symbols-rounded" style="font-size:56px;color:#d1d5db">apartment</span>') +
      '</div>' +
      section('Informations générales', [
        field('Désignation', r.nom, true),
        field('Type', r.type), field('Propriétaire', r.proprio),
        field('Valeur', r.valeur), field('Nb appartements', r.nbAppart),
        field('Statut', r.statut, false, pillClass(r.statut)), field('État', r.etat),
        field('Destiné à la vente', r.vente), field('Adresse', r.adresse, true),
      ].join(''));
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'biens\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('home_work', r.nom || 'Bien', 'Fiche du bien'), body, foot);
  }

  function editBien(r, idx) {
    var body = photoEditHTML(r, 'biens') +
      eSection('Informations',
        eRow(eField('Désignation', 'e-nom', 'text', r.nom, true), true) +
        eRow(eField('Type', 'e-type', 'text', r.type, true, ['Appartement', 'Maison', 'Villa', 'Studio', 'Bureau', 'Local commercial', 'Immeuble', 'Terrain']) +
          eField('Propriétaire', 'e-proprio', 'text', r.proprio, true)) +
        eRow(eField('Valeur', 'e-valeur', 'text', r.valeur, true) + eField('Nb appartements', 'e-nbAppart', 'number', r.nbAppart)) +
        eRow(eField('État', 'e-etat', 'text', r.etat, false, ['Neuf', 'Bon état', 'À rénover', 'En travaux']) +
          eField('Statut', 'e-statut', 'text', r.statut, false, ['Disponible', 'Loué', 'En attente'])) +
        eRow(eField('Destiné à la vente', 'e-vente', 'text', r.vente, false, ['Oui', 'Non']) + eField('Adresse', 'e-adresse', 'text', r.adresse))
      );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'biens\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier le bien', r.nom || 'Bien'), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     LOCATIONS (locatives)
  ══════════════════════════════════════════════════════════ */
  function viewLocative(r, idx) {
    var body = section('Informations location', [
      field('Nom / Référence', r.nom || r.bien, true),
      field('Bien', r.bien), field('Locataire', r.locataire || r.occupant),
      field('Loyer', r.loyer ? money(r.loyer) : '—'), field('Charges', r.charge ? money(r.charge) : '—'),
      field('Date entrée', r.dateEntree), field('Statut', r.statut, false, pillClass(r.statut)),
    ].join(''));
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'locatives\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('key', r.nom || r.bien || 'Location', 'Fiche location'), body, foot);
  }

  function editLocative(r, idx) {
    var body = eSection('Location',
      eRow(eField('Nom / Référence', 'e-nom', 'text', r.nom), true) +
      eRow(eField('Bien', 'e-bien', 'text', r.bien, true) + eField('Locataire', 'e-locataire', 'text', r.locataire || r.occupant)) +
      eRow(eField('Loyer (FCFA)', 'e-loyer', 'number', r.loyer) + eField('Charges (FCFA)', 'e-charge', 'number', r.charge)) +
      eRow(eField('Date entrée', 'e-dateEntree', 'date', r.dateEntree) + eField('Statut', 'e-statut', 'text', r.statut, false, ['Loué', 'Disponible', 'En attente']))
    );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'locatives\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier la location', r.nom || r.bien || 'Location'), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     CONTRATS
  ══════════════════════════════════════════════════════════ */
  function viewContrat(r, idx) {
    var body = section('Parties', [
      field('Locataire', r.locataire), field('Location / Locative', r.locative || r.bien),
      field('Type de contrat', r.type), field('Statut', r.statut, false, pillClass(r.statut)),
    ].join('')) +
      section('Dates & Paiements', [
        field('Date début', r.debut), field('Date fin', r.fin),
        field('Loyer (FCFA)', r.loyer ? money(r.loyer) : '—'), field('Charges', r.charges ? money(r.charges) : '—'),
        field('Caution', r.caution ? money(r.caution) : '—'), field('Honoraires', r.honor ? money(r.honor) : '—'),
        field('Prochain paiement', r.prochain), field('Date signature', r.sign),
      ].join('')) +
      (r.obs ? section('Observations', [field('', r.obs, true)].join('')) : '');
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      (typeof window.generateContratPDF === 'function'
        ? '<button class="gpad-btn blue" onclick="window.generateContratPDF(' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">picture_as_pdf</span>PDF</button>'
        : '') +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'contrats\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('description', 'Contrat ' + (r.num || r.numero || ''), r.locataire || 'Contrat'), body, foot);
  }

  function editContrat(r, idx) {
    var body = eSection('Parties',
      eRow(eField('Locataire', 'e-locataire', 'text', r.locataire, true) + eField('Location / Locative', 'e-locative', 'text', r.locative || r.bien, true)) +
      eRow(eField('Type', 'e-type', 'text', r.type, false, ['Habitation', 'Commercial', 'Stage', 'Autre']) +
        eField('Statut', 'e-statut', 'text', r.statut, false, ['Actif', 'En attente', 'Résilié']))
    ) +
      eSection('Dates',
        eRow(eField('Date début', 'e-debut', 'date', r.debut) + eField('Date fin', 'e-fin', 'date', r.fin)) +
        eRow(eField('Prochain paiement', 'e-prochain', 'text', r.prochain) + eField('Date signature', 'e-sign', 'date', r.sign))
      ) +
      eSection('Montants',
        eRow(eField('Loyer (FCFA)', 'e-loyer', 'number', r.loyer) + eField('Charges (FCFA)', 'e-charges', 'number', r.charges)) +
        eRow(eField('Caution (FCFA)', 'e-caution', 'number', r.caution) + eField('Honoraires (FCFA)', 'e-honor', 'number', r.honor)) +
        eRow(eField('Frais dossier', 'e-frais', 'number', r.frais), true)
      ) +
      eSection('Observations',
        eRow(eField('Observations', 'e-obs', 'textarea', r.obs), true)
      );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'contrats\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier le contrat', r.locataire || 'Contrat'), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     PAIEMENTS
  ══════════════════════════════════════════════════════════ */
  function viewPaiement(r, idx) {
    var reste = r.reste || Math.max(0, (Number(r.montant) || 0) - (Number(r.paye || r.montantPaye) || 0));
    var body = section('Paiement', [
      field('Locataire', r.locataire), field('Location / Locative', r.locative || r.bien),
      field('Montant dû', money(r.montant)), field('Montant payé', money(r.paye || r.montantPaye)),
      field('Reste', money(reste), false, reste > 0 ? 'off' : 'ok'),
      field('Date paiement', r.date), field('Mode paiement', r.mode),
    ].join(''));
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      (typeof window.genererRecuPaiementPDF === 'function'
        ? '<button class="gpad-btn blue" onclick="window.genererRecuPaiementPDF(' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">receipt_long</span>Reçu PDF</button>'
        : '') +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'paiements\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('payments', 'Paiement', r.locataire || 'Paiement'), body, foot);
  }

  function editPaiement(r, idx) {
    var body = eSection('Paiement',
      eRow(eField('Locataire', 'e-locataire', 'text', r.locataire, true) + eField('Location / Locative', 'e-locative', 'text', r.locative || r.bien)) +
      eRow(eField('Montant dû (FCFA)', 'e-montant', 'number', r.montant, true) + eField('Montant payé (FCFA)', 'e-paye', 'number', r.paye || r.montantPaye, true)) +
      eRow(eField('Date paiement', 'e-date', 'date', r.date) +
        eField('Mode paiement', 'e-mode', 'text', r.mode, false, ['Espèces', 'Wave', 'Orange Money', 'Virement', 'Chèque']))
    );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'paiements\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier le paiement', r.locataire || 'Paiement'), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     DÉPENSES
  ══════════════════════════════════════════════════════════ */
  function viewDepense(r, idx) {
    var body = section('Dépense', [
      field('Libellé', r.libelle || r.titre, true),
      field('Catégorie', r.cat || r.categorie), field('Montant', money(r.montant)),
      field('Date', r.date), field('Bien concerné', r.bien, true),
    ].join(''));
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){editRow(\'depenses\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('account_balance_wallet', r.libelle || r.titre || 'Dépense', 'Détail dépense'), body, foot);
  }

  function editDepense(r, idx) {
    var body = eSection('Dépense',
      eRow(eField('Libellé', 'e-libelle', 'text', r.libelle || r.titre, true), true) +
      eRow(eField('Catégorie', 'e-cat', 'text', r.cat || r.categorie, false, ['Entretien', 'Réparation', 'Travaux', 'Taxe', 'Assurance', 'Transport', 'Facture agence', 'Autre']) +
        eField('Montant (FCFA)', 'e-montant', 'number', r.montant, true)) +
      eRow(eField('Date', 'e-date', 'date', r.date) + eField('Bien concerné', 'e-bien', 'text', r.bien))
    );
    var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Annuler</button>' +
      '<button class="gpad-btn primary" id="gpad-save" onclick="window.gpSaveEdit(\'depenses\',' + idx + ')"><span class="material-symbols-rounded" style="font-size:15px">save</span>Enregistrer</button>';
    openDrawer(head('edit', 'Modifier la dépense', r.libelle || r.titre || 'Dépense'), body, foot);
  }

  /* ══════════════════════════════════════════════════════════
     SAVE GENERIC
  ══════════════════════════════════════════════════════════ */
  var FIELD_MAP = {
    locataires: ['prenom', 'nom', 'naiss', 'matri', 'prof', 'travail', 'enfants', 'tel', 'email', 'adresse', 'type', 'statut', 'bien', 'date'],
    proprietaires: ['nom', 'prenom', 'naiss', 'matri', 'adresse', 'tel', 'email'],
    employes: ['nom', 'prenom', 'fonction', 'contrat', 'date', 'statut', 'tel', 'email', 'adresse', 'piece', 'numpiece', 'lieu', 'deldeb', 'delexp', 'user'],
    biens: ['nom', 'type', 'proprio', 'valeur', 'nbAppart', 'etat', 'statut', 'vente', 'adresse'],
    locatives: ['nom', 'bien', 'locataire', 'loyer', 'charge', 'dateEntree', 'statut'],
    contrats: ['locataire', 'locative', 'type', 'statut', 'debut', 'fin', 'prochain', 'sign', 'loyer', 'charges', 'caution', 'honor', 'frais', 'obs'],
    paiements: ['locataire', 'locative', 'montant', 'paye', 'date', 'mode'],
    depenses: ['libelle', 'cat', 'montant', 'date', 'bien'],
  };

  window.gpSaveEdit = async function (key, idx) {
    var btn = document.getElementById('gpad-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }
    var data = db();
    if (!Array.isArray(data[key])) data[key] = [];
    var r = data[key][idx];
    if (!r) { if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; } return; }

    var fields = FIELD_MAP[key] || [];
    fields.forEach(function (f) {
      var el = document.getElementById('e-' + f);
      if (el) r[f] = el.value.trim();
    });

    // Photo
    var photo = await getPhotoData();
    if (photo) r.photo = photo;

    // Recalcul reste paiements
    if (key === 'paiements') {
      var du = Number(r.montant) || 0;
      var paye = Number(r.paye) || 0;
      r.reste = Math.max(0, du - paye);
    }

    try { await saveDb(data); } catch (e) { console.error(e); }

    if (typeof window.auditLog === 'function') window.auditLog('Modification', key, 'Modification enregistrée');
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    window.gpCloseActionsDrawer();
    rerender(key);
    if (typeof window.toast === 'function') window.toast('Modification enregistrée ✓');
  };

  /* ══════════════════════════════════════════════════════════
     ROUTER — remplace viewRow & editRow
  ══════════════════════════════════════════════════════════ */
  var VIEW_FNS = {
    locataires: viewLocataire,
    proprietaires: viewProprietaire,
    employes: viewEmploye,
    biens: viewBien,
    locatives: viewLocative,
    contrats: viewContrat,
    paiements: viewPaiement,
    depenses: viewDepense,
  };
  var EDIT_FNS = {
    locataires: editLocataire,
    proprietaires: editProprietaire,
    employes: editEmploye,
    biens: editBien,
    locatives: editLocative,
    contrats: editContrat,
    paiements: editPaiement,
    depenses: editDepense,
  };

  window.viewRow = function (key, idx) {
    var data = db();
    if (!Array.isArray(data[key])) return;
    var r = data[key][idx];
    if (!r) return;
    var fn = VIEW_FNS[key];
    if (fn) fn(r, idx);
    else {
      // Fallback: drawer générique Voir
      var labels = (window.LABELS && window.LABELS[key]) || {};
      var fieldsHTML = Object.keys(labels).map(function (k) {
        return field(labels[k], r[k]);
      }).join('');
      var body = '<div class="gpad-grid">' + fieldsHTML + '</div>';
      var foot = '<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>' +
        '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){window.editRow(\'' + key + '\',' + idx + ')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
      openDrawer(head('info', 'Détails', key), body, foot);
    }
  };

  window.editRow = function (key, idx) {
    var data = db();
    if (!Array.isArray(data[key])) return;
    var r = data[key][idx];
    if (!r) return;
    var fn = EDIT_FNS[key];
    if (fn) fn(r, idx);
    else window.viewRow(key, idx);
  };

  // [cleaned] debug console statement removed
})();

/* ===== Source consolidée: js/pages/search-toolbar-unified.js ===== */
/**
 * search-toolbar-unified.js
 * Applique exactement le même style de champ recherche que la page "Locataires"
 * sur les pages : Biens, Dépenses, Employés et Propriétaires.
 *
 * Style de référence (locataires) :
 *   - Champ recherche : height 34px, border-radius 8px, fond blanc,
 *     bordure #e5e7eb, icône loupe dorée (#D4AF37), font-size 13px
 *   - Selects (filtres) : même largeur que le champ recherche
 */
(function () {
  'use strict';

  var CSS_ID = 'gp-unified-search-css';

  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = `

/* ═══════════════════════════════════════════════════════════
   CHAMPS RECHERCHE UNIFIÉS — style identique à la page Locataires
   Pages ciblées : Biens, Dépenses, Employés, Propriétaires
   ═══════════════════════════════════════════════════════════ */

/* ── BIENS ── */
#page-biens .gp-search {
  width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  box-sizing: border-box !important;
}
#page-biens .gp-search input {
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  width: 100% !important;
  font-size: 13px !important;
  color: #374151 !important;
}
#page-biens .gp-search .material-symbols-rounded {
  font-size: 16px !important;
  color: #D4AF37 !important;
  flex-shrink: 0 !important;
}
#page-biens .gp-select {
  width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  color: #374151 !important;
  box-sizing: border-box !important;
}
#page-biens .gp-outline {
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 13px !important;
  color: #374151 !important;
  cursor: pointer !important;
}

/* ── DÉPENSES ── */
#page-depenses .gp-search {
  width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  box-sizing: border-box !important;
}
#page-depenses .gp-search input {
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  width: 100% !important;
  font-size: 13px !important;
  color: #374151 !important;
}
#page-depenses .gp-search .material-symbols-rounded {
  font-size: 16px !important;
  color: #D4AF37 !important;
  flex-shrink: 0 !important;
}
#page-depenses .gp-select {
  width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  color: #374151 !important;
  box-sizing: border-box !important;
}
#page-depenses .gp-outline {
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 13px !important;
  color: #374151 !important;
  cursor: pointer !important;
}

/* ── EMPLOYÉS ── */
#page-employes .emp-search-box,
#gpEmployesModern .emp-search-box {
  width: 220px !important;
  flex: 0 0 220px !important;
  min-width: 220px !important;
  max-width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  box-sizing: border-box !important;
}
#page-employes .emp-search-box input,
#gpEmployesModern .emp-search-box input {
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  width: 100% !important;
  font-size: 13px !important;
  color: #374151 !important;
}
#page-employes .emp-search-box .material-symbols-rounded,
#gpEmployesModern .emp-search-box .material-symbols-rounded {
  font-size: 16px !important;
  color: #D4AF37 !important;
  flex-shrink: 0 !important;
}
#page-employes .emp-filter-sel,
#gpEmployesModern .emp-filter-sel {
  width: 220px !important;
  flex: 0 0 220px !important;
  min-width: 220px !important;
  max-width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  color: #374151 !important;
  box-sizing: border-box !important;
}
#page-employes .emp-btn-sm-outline,
#gpEmployesModern .emp-btn-sm-outline {
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 13px !important;
  color: #374151 !important;
  cursor: pointer !important;
}

/* ── PROPRIÉTAIRES ── */
#page-proprietaires .prop-search-box {
  width: 220px !important;
  flex: 0 0 220px !important;
  min-width: 220px !important;
  max-width: 220px !important;
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  box-sizing: border-box !important;
}
#page-proprietaires .prop-search-box input {
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  width: 100% !important;
  font-size: 13px !important;
  color: #374151 !important;
}
#page-proprietaires .prop-search-box .material-symbols-rounded {
  font-size: 16px !important;
  color: #D4AF37 !important;
  flex-shrink: 0 !important;
}
#page-proprietaires .prop-btn-sm-outline {
  height: 34px !important;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 13px !important;
  color: #374151 !important;
  cursor: pointer !important;
}
    `;
    document.head.appendChild(s);
  }

  /* ── Corrige les icônes loupe encore grises après render ── */
  function fixIcons(pageId, searchSelector) {
    var page = document.getElementById(pageId);
    if (!page) return;
    page.querySelectorAll(searchSelector + ' .material-symbols-rounded').forEach(function (ico) {
      ico.style.color = '#D4AF37';
      ico.style.fontSize = '16px';
      ico.style.flexShrink = '0';
    });
  }

  function fixAllIcons() {
    fixIcons('page-biens',         '.gp-search');
    fixIcons('page-depenses',      '.gp-search');
    fixIcons('page-employes',      '.emp-search-box');
    fixIcons('gpEmployesModern',   '.emp-search-box');
    fixIcons('page-proprietaires', '.prop-search-box');
  }

  /* ── Monkey-patch des renderers ── */
  function patchRenderer(fnName) {
    var original = window[fnName];
    if (typeof original !== 'function' || original.__gpUnified) return;
    window[fnName] = function () {
      injectCSS();
      var r = original.apply(this, arguments);
      setTimeout(fixAllIcons, 0);
      return r;
    };
    window[fnName].__gpUnified = true;
  }

  function patchAll() {
    injectCSS();
    // Biens
    patchRenderer('renderBiensFinal');
    patchRenderer('renderBiensFinal2');
    patchRenderer('renderBiensCards');
    // Dépenses
    patchRenderer('renderDepensesFinal');
    patchRenderer('renderDepenses');
    // Employés
    patchRenderer('renderEmployesModern');
    // Propriétaires
    patchRenderer('renderProprietairesModern');
    patchRenderer('renderProprietairesCards');

    fixAllIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(patchAll, 200); });
  } else {
    setTimeout(patchAll, 200);
  }

  // Re-patch pour les modules chargés en différé
  setTimeout(patchAll, 800);
  setTimeout(patchAll, 1600);

  // [cleaned] debug console statement removed
})();

