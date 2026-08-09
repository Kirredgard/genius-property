/* Genius Property V6 — Core runtime
   Chargé avant le bundle legacy. Fournit un namespace stable pour les prochains modules. */
(function(){
  'use strict';
  var GP = window.GP = window.GP || {};
  GP.VERSION = '6.0.0-modulaire';
  GP.STORAGE_KEY = 'geniusproperty_db_clean_v1';

  GP.safeJSONParse = function(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; }
  };
  GP.safeSetLocal = function(key, value){
    try { localStorage.setItem(key, value); return true; } catch(e){ console.warn('[GP] localStorage write failed', e); return false; }
  };
  GP.esc = function(v){
    return String(v ?? '').replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
    });
  };
  GP.num = function(v){
    var n = Number(String(v ?? 0).replace(/\s/g,'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  };
  GP.money = function(v){
    return Math.round(GP.num(v)).toLocaleString('fr-FR') + ' FCFA';
  };
  GP.uid = function(prefix){
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  };
  GP.dateKey = function(d){
    d = d || new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  GP.todayKey = function(){ return GP.dateKey(new Date()); };
  GP.toast = function(message, type){
    if (typeof window.toast === 'function') return window.toast(message, type || 'info');
    // [cleaned] debug console statement removed
  };
  GP.fieldError = function(id, msg){
    var el = document.getElementById(id);
    if(el){
      el.classList.add('gp-field-error');
      el.focus();
      el.addEventListener('input', function(){ el.classList.remove('gp-field-error'); }, {once:true});
    }
    GP.toast(msg, 'err');
    return false;
  };
  GP.getDB = function(){ return window.DB || GP.safeJSONParse(localStorage.getItem(GP.STORAGE_KEY), {}) || {}; };
  GP.saveBackupSnapshot = function(){
    try {
      var data = GP.getDB();
      localStorage.setItem('geniusproperty_last_backup_snapshot', JSON.stringify({date:new Date().toISOString(), data:data}));
      localStorage.setItem('geniusproperty_last_backup_date', GP.todayKey());
      return true;
    } catch(e){ console.warn('[GP] backup snapshot failed', e); return false; }
  };
  GP.exportData = function(){
    var data = GP.getDB();
    var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'genius-property-backup-' + GP.todayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  };
  GP.importData = function(file){
    return new Promise(function(resolve, reject){
      var r = new FileReader();
      r.onload = function(){
        try {
          var data = JSON.parse(String(r.result || '{}'));
          localStorage.setItem(GP.STORAGE_KEY, JSON.stringify(data));
          resolve(data);
        } catch(e){ reject(e); }
      };
      r.onerror = reject;
      r.readAsText(file);
    });
  };

  // Compatibilité globale pour l'ancien bundle et les appels HTML inline.
  window.gp_esc = window.gp_esc || GP.esc;
  window.gp_num = window.gp_num || GP.num;
  window.gp_money = window.gp_money || GP.money;
  window.gp_uid = window.gp_uid || GP.uid;
  window.gp_dateKey = window.gp_dateKey || GP.dateKey;
  window.gp_todayKey = window.gp_todayKey || GP.todayKey;
  window.gp_fieldError = window.gp_fieldError || GP.fieldError;
  window.gp_exportData = window.gp_exportData || GP.exportData;
})();


/* ================================================================
   CONSOLIDATION — correctifs runtime live
   Anciennement chargé via fichiers patch séparés.
================================================================ */


/* ===== Source consolidée: js/pages/live-fixes.js ===== */
/*
 * Genius Property — correctifs runtime consolidés
 * Fusion depuis : live-fixes-v9.js, live-fixes-v12.js, live-fixes-v13.js
 * Ordre conservé selon index.html original.
 */


/* ===== Source: js/pages/live-fixes-v9.js ===== */

/* Genius Property — correctifs live V9
   - affichage immédiat après Enregistrer
   - suppression réellement persistée
   - statut des biens synchronisé avec les locations/contrats
*/
(function(){
  'use strict';

  const STORAGE_KEY = (window.GP && window.GP.STORAGE_KEY) || 'geniusproperty_db_clean_v1';
  const FIREBASE_CACHE_KEY = 'geniusproperty_firebase_cache';

  function normalizeText(v){
    return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  }
  function getDB(){ return (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {})); }
  function clone(obj){ try { return JSON.parse(JSON.stringify(obj || {})); } catch(e){ return {}; } }
  function setDB(db){
    // V9 : ne jamais vider window.DB quand db et window.DB sont le même objet.
    // En V8, Object.keys(window.DB).delete + Object.assign(window.DB, db) pouvait transformer la base en {}.
    const clean = clone(db || {});
    if (window.DB && typeof window.DB === 'object') {
      Object.keys(window.DB).forEach(k => delete window.DB[k]);
      Object.assign(window.DB, clean);
    } else {
      window.DB = clean;
    }
    try {
      const raw = JSON.stringify(window.DB);
      localStorage.setItem(STORAGE_KEY, raw);
      localStorage.setItem(FIREBASE_CACHE_KEY, raw);
    } catch(e) {}
    return window.DB;
  }
  async function persist(db){
    setDB(db);
    try {
      if (window.GPDB && typeof window.GPDB.save === 'function') await window.GPDB.save(db);
      else if (typeof window.saveDB === 'function') await window.saveDB();
    } catch(e) { console.warn('[LiveFix V9] sauvegarde cloud différée:', e && (e.message || e)); }
  }
  function forceRender(page){
    try { if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges(); } catch(e) {}
    try {
      if (page === 'locataires') {
        if (typeof window.renderLocatairesModern === 'function') window.renderLocatairesModern(true);
        else if (typeof window.renderTable === 'function') window.renderTable('locataires');
      } else if (page === 'proprietaires') {
        if (typeof window.renderProprietairesCards === 'function') window.renderProprietairesCards();
        else if (typeof window.renderTable === 'function') window.renderTable('proprietaires');
      } else if (page === 'biens') {
        if (typeof window.renderBiensCards === 'function') window.renderBiensCards(true);
        else if (typeof window.renderTable === 'function') window.renderTable('biens');
      } else if (page === 'locatives') {
        if (typeof window.renderTable === 'function') window.renderTable('locatives');
      } else if (page === 'contrats') {
        if (typeof window.renderContrats === 'function') window.renderContrats();
      } else if (page && typeof window.renderPage === 'function') window.renderPage(page);
    } catch(e) { console.warn('[LiveFix V9] rendu impossible:', e); }
  }
  function go(page){
    if (typeof window.navigate === 'function') window.navigate(page);
    setTimeout(() => forceRender(page), 0);
    setTimeout(() => forceRender(page), 150);
  }

  function isMulti(b){ return b && b.type === 'Immeuble' && parseInt(b.nbAppart || b.nbAppartements || 0, 10) > 1; }
  function ensureUnits(b){
    if (!b) return [];
    if (typeof window.ensureBienUnits === 'function') return window.ensureBienUnits(b);
    const n = parseInt(b.nbAppart || b.nbAppartements || 0, 10);
    if (n > 1) {
      if (!Array.isArray(b.unites) || b.unites.length !== n) {
        const old = Array.isArray(b.unites) ? b.unites : [];
        b.unites = Array.from({length:n}, (_,i) => Object.assign({id:'UNT-'+Date.now()+'-'+i, nom:'Appartement '+(i+1), statut:'Disponible', loyer:'', locataire:''}, old[i] || {}));
      }
      return b.unites;
    }
    return [{id:b.id, nom:b.nom, statut:b.statut || 'Disponible', loyer:b.loyer || '', locataire:b.locataire || ''}];
  }
  function unitFullName(b,u){
    if (!b || !u) return '';
    if (typeof window.getBienUnitFullName === 'function') return window.getBienUnitFullName(b,u);
    return isMulti(b) ? (b.nom + ' - ' + u.nom) : b.nom;
  }
  function findByUnitName(db, name){
    const wanted = normalizeText(name);
    for (const b of (db.biens || [])) {
      if (normalizeText(b.nom) === wanted) return {bien:b, unite:null};
      for (const u of ensureUnits(b)) {
        if (normalizeText(unitFullName(b,u)) === wanted || normalizeText(u.nom) === wanted) return {bien:b, unite:u};
      }
    }
    return {bien:null, unite:null};
  }
  function isActiveLocation(row){
    const s = normalizeText(row && row.statut || 'Loué');
    return !s || ['loue','loué','actif','occupe','occupé','en cours'].includes(s);
  }
  function resyncBienStatuses(db){
    db = db || getDB();
    (db.biens || []).forEach(b => {
      if (isMulti(b)) {
        ensureUnits(b).forEach(u => { u.statut = 'Disponible'; u.locataire = ''; });
        b.statut = 'Disponible'; b.locataire = '';
      } else {
        b.statut = 'Disponible'; b.locataire = '';
      }
    });
    (db.locatives || []).filter(isActiveLocation).forEach(lv => {
      const found = findByUnitName(db, lv.bien || lv.nom);
      const tenant = lv.locataire || lv.occupant || '';
      if (found.bien && found.unite && isMulti(found.bien)) {
        found.unite.statut = 'Loué';
        found.unite.locataire = tenant;
        found.unite.loyer = found.unite.loyer || lv.loyer || '';
      } else if (found.bien) {
        found.bien.statut = 'Loué';
        found.bien.locataire = tenant;
        found.bien.loyer = found.bien.loyer || lv.loyer || '';
      }
    });
    (db.contrats || []).filter(c => ['actif','en attente'].includes(normalizeText(c.statut || 'Actif'))).forEach(c => {
      const locative = (db.locatives || []).find(l => normalizeText(l.nom) === normalizeText(c.locative) || normalizeText(l.bien) === normalizeText(c.locative));
      const unitName = (locative && (locative.bien || locative.nom)) || c.locative;
      const found = findByUnitName(db, unitName);
      if (found.bien && found.unite && isMulti(found.bien)) {
        found.unite.statut = 'Loué'; found.unite.locataire = c.locataire || found.unite.locataire || '';
      } else if (found.bien) {
        found.bien.statut = 'Loué'; found.bien.locataire = c.locataire || found.bien.locataire || '';
      }
    });
    (db.biens || []).forEach(b => {
      if (isMulti(b)) {
        const units = ensureUnits(b);
        const occupied = units.filter(u => normalizeText(u.statut).startsWith('loue')).length;
        b.statut = occupied === units.length ? 'Loué' : occupied === 0 ? 'Disponible' : 'En attente';
      }
    });
    setDB(db);
    return db;
  }
  window.GPResyncBienStatuses = resyncBienStatuses;

  function patchSave(name, page){
    const old = window[name];
    if (typeof old !== 'function' || old.__liveFix) return;
    const wrapped = async function(){
      const before = getDB();
      const result = await old.apply(this, arguments);
      const after = resyncBienStatuses(getDB());
      setDB(after);
      go(page);
      // Sauvegarde arrière-plan, sans bloquer l'affichage immédiat.
      persist(after);
      return result;
    };
    wrapped.__liveFix = true;
    window[name] = wrapped;
  }

  function patchDelete(){
    if (typeof window.delRow === 'function' && !window.delRow.__liveFix) {
      const oldDelRow = window.delRow;
      window.delRow = async function(key, i){
        if (!confirm('Supprimer cet enregistrement ?')) return;
        const db = getDB();
        if (!Array.isArray(db[key])) return;
        db[key].splice(i, 1);
        resyncBienStatuses(db);
        await persist(db);
        forceRender(key);
        if (typeof window.toast === 'function') window.toast('Supprimé ✓');
      };
      window.delRow.__liveFix = true;
    }
    if (typeof window.deleteFromModal === 'function' && !window.deleteFromModal.__liveFix) {
      window.deleteFromModal = async function(){
        if (!confirm('Supprimer cet enregistrement ?')) return;
        const key = window._modalKey, idx = window._modalIdx;
        if (typeof window.closeRowModal === 'function') window.closeRowModal();
        const db = getDB();
        if (Array.isArray(db[key])) db[key].splice(idx, 1);
        resyncBienStatuses(db);
        await persist(db);
        forceRender(key);
        if (typeof window.toast === 'function') window.toast('Supprimé ✓');
      };
      window.deleteFromModal.__liveFix = true;
    }
    if (typeof window.deleteBienFromDetail === 'function' && !window.deleteBienFromDetail.__liveFix) {
      window.deleteBienFromDetail = async function(){
        const idx = typeof window._bienDetailIdx === 'number' ? window._bienDetailIdx : -1;
        if (idx < 0) return;
        if (!confirm('Supprimer ce bien définitivement ?')) return;
        const db = getDB();
        if (Array.isArray(db.biens)) db.biens.splice(idx, 1);
        resyncBienStatuses(db);
        await persist(db);
        if (typeof window.closeBienDetail === 'function') window.closeBienDetail();
        forceRender('biens');
        if (typeof window.toast === 'function') window.toast('Bien supprimé ✓');
      };
      window.deleteBienFromDetail.__liveFix = true;
    }
  }

  function patchFillLocativeSelects(){
    if (typeof window.fillLocativeSelects !== 'function' || window.fillLocativeSelects.__liveFix) return;
    window.fillLocativeSelects = function(){
      const db = resyncBienStatuses(getDB());
      const sl = document.getElementById('lv-locataire');
      if (sl) sl.innerHTML = '<option value="">Sélectionner un locataire</option>' + (db.locataires || []).map(l => `<option>${(l.prenom||'')} ${(l.nom||'')}</option>`).join('');
      const sb = document.getElementById('lv-bien');
      if (sb) {
        const options = [];
        (db.biens || []).forEach(b => {
          if (isMulti(b)) {
            const unitOpts = ensureUnits(b).map(u => {
              const disabled = normalizeText(u.statut).startsWith('loue') ? ' disabled' : '';
              return `<option value="${unitFullName(b,u)}"${disabled}>${u.nom} — ${u.statut || 'Disponible'}${disabled ? ' (déjà loué)' : ''}</option>`;
            }).join('');
            options.push(`<optgroup label="${b.nom} — ${b.proprio || 'Propriétaire'}">${unitOpts}</optgroup>`);
          } else {
            const disabled = normalizeText(b.statut).startsWith('loue') ? ' disabled' : '';
            options.push(`<option value="${b.nom}"${disabled}>${b.nom} — ${b.statut || 'Disponible'}${disabled ? ' (déjà loué)' : ''}</option>`);
          }
        });
        sb.innerHTML = '<option value="">Sélectionner un bien / appartement</option>' + options.join('');
      }
      const d = document.getElementById('lv-date-entree');
      if (d && !d.value) d.value = new Date().toISOString().split('T')[0];
    };
    window.fillLocativeSelects.__liveFix = true;
  }

  function install(){
    patchSave('saveLocataire', 'locataires');
    patchSave('saveProprietaire', 'proprietaires');
    patchSave('saveBien', 'biens');
    patchSave('saveLocative', 'locatives');
    patchSave('saveContrat', 'contrats');
    patchDelete();
    patchFillLocativeSelects();
    resyncBienStatuses(getDB());
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('load', install);
  window.addEventListener('gp:db:saved', function(){ resyncBienStatuses(getDB()); });
  setTimeout(install, 0); setTimeout(install, 400); setTimeout(install, 1200);
})();

/* ===== Source: js/pages/live-fixes-v12.js ===== */

/* Genius Property — Live fixes V12
   - Contrats: sauvegarde locale + Firebase fiable, affichage immédiat
   - Droits: les droits cochés à la création employé pilotent vraiment la sidebar
   - Bonjour: affiche le prénom de l'utilisateur connecté quand il existe
*/
(function(){
  'use strict';

  var DEFAULT_DB = {
    employes: [], proprietaires: [], locataires: [], biens: [], locatives: [], contrats: [],
    paiements: [], depenses: [], fichiers: [], messages: [], conversations: [], agenda: [],
    proprietaireDocs: {}, locataireDocs: {}
  };

  var DROIT_PAGES = {
    dashboard: ['dashboard'],
    employes: ['employes','nv-employe'],
    proprietaires: ['proprietaires','nv-proprietaire','proprietaire-detail'],
    locataires: ['locataires','nv-locataire'],
    biens: ['biens','nv-bien','bien-detail'],
    locatives: ['locatives','nv-locative'],
    bail: ['biens','nv-bien','locatives','nv-locative','bien-detail'],
    contrats: ['contrats','nv-contrat'],
    paiements: ['paiements','avenir'],
    avenir: ['avenir'],
    depenses: ['depenses'],
    fichiers: ['fichiers'],
    messages: ['messages'],
    journal: ['journal','agenda-employes','agenda'],
    parametres: ['parametres','sync'],
    rapports: ['rapports'],
    superAdmin: ['dashboard','droits','employes','nv-employe','parametres','sync','admin-stockage','messages','journal','agenda-employes']
  };

  var DROITS_FORM_KEYS = [
    'dashboard','employes','proprietaires','locataires','biens','locatives','contrats',
    'paiements','depenses','messages','journal','parametres','superAdmin'
  ];

  function $(id){ return document.getElementById(id); }
  function val(id){ var el=$(id); return el ? String(el.value||'').trim() : ''; }
  function toast(msg,type){ if(typeof window.toast === 'function') window.toast(msg,type||'ok'); else console.log(msg); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
  function today(){ return new Date().toISOString().split('T')[0]; }

  function loadDB(){
    var db = null;
    try { db = window.GPDB && window.GPDB.load ? window.GPDB.load() : null; } catch(e) {}
    if(!db || typeof db !== 'object') db = window.DB || {};
    db = Object.assign({}, DEFAULT_DB, db || {});
    Object.keys(DEFAULT_DB).forEach(function(k){
      if(Array.isArray(DEFAULT_DB[k]) && !Array.isArray(db[k])) db[k]=[];
      if(!Array.isArray(DEFAULT_DB[k]) && (!db[k] || typeof db[k] !== 'object')) db[k]=Object.assign({}, DEFAULT_DB[k]);
    });
    return db;
  }

  async function persistDB(db){
    db = Object.assign({}, DEFAULT_DB, db || {});
    window.DB = db;
    try { localStorage.setItem('geniusproperty_db_clean_v1', JSON.stringify(db)); } catch(e) {}
    try {
      if(window.GPDB && window.GPDB.save) await window.GPDB.save(db);
      else if(typeof window.saveDB === 'function') await window.saveDB();
    } catch(e) {
      console.warn('[V12] GPDB.save impossible, localStorage conservé:', e && (e.message || e));
    }
    try { if(window.GPFirebase && window.GPFirebase.push) await window.GPFirebase.push(db); } catch(e) {
      console.warn('[V12] Push Firebase impossible, localStorage conservé:', e && (e.message || e));
    }
    try { window.dispatchEvent(new CustomEvent('gp:data-changed', { detail:{ db: db } })); } catch(e) {}
    try { document.dispatchEvent(new CustomEvent('gp:data-changed', { detail:{ db: db } })); } catch(e) {}
    return db;
  }

  function readEmployeeDroits(){
    var droits = {};
    var inputs = document.querySelectorAll('#droits-list .toggle-switch input[type=checkbox]');
    inputs.forEach(function(cb, i){
      var key = DROITS_FORM_KEYS[i];
      if(key) droits[key] = !!cb.checked;
    });
    // Compatibilité avec l'ancien code: ancien droit "bail" = Biens OU Locations.
    droits.bail = !!(droits.biens || droits.locatives);
    // Un super admin doit pouvoir tout ouvrir.
    if(droits.superAdmin){
      Object.keys(DROIT_PAGES).forEach(function(k){ droits[k] = true; });
      droits.bail = true;
    }
    return droits;
  }

  function resetEmployeeDroits(){
    var inputs = document.querySelectorAll('#droits-list .toggle-switch input[type=checkbox]');
    inputs.forEach(function(cb, i){ cb.checked = i === 0; });
  }

  function getCurrentEmployee(){
    var email = String((window.currentUser && window.currentUser.email) || '').trim().toLowerCase();
    if(!email) return null;
    var db = loadDB();
    return (db.employes||[]).find(function(e){ return String(e.email||'').trim().toLowerCase() === email; }) || null;
  }

  function isAdminUser(){
    var u = window.currentUser || {};
    if(u.isAdmin) return true;
    var emp = getCurrentEmployee();
    return !!(emp && emp.droits && emp.droits.superAdmin);
  }

  function currentDroits(){
    var emp = getCurrentEmployee();
    if(emp && emp.droits) return emp.droits || {};
    return (window.currentUser && window.currentUser.droits) || {};
  }

  function canAccessPage(page){
    if(!page) return false;
    if(isAdminUser()) return true;
    var d = currentDroits();
    return Object.keys(DROIT_PAGES).some(function(key){
      return !!d[key] && DROIT_PAGES[key].indexOf(page) !== -1;
    });
  }

  function applyRightsUI(){
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){
      var page = li.getAttribute('data-page');
      var ok = canAccessPage(page);
      li.style.display = ok ? '' : 'none';
      li.setAttribute('aria-hidden', ok ? 'false' : 'true');
    });

    // Cache aussi les raccourcis du panneau aide/topbar qui ouvrent des pages non autorisées.
    document.querySelectorAll('[onclick*="navigate(\'"]').forEach(function(el){
      var m = String(el.getAttribute('onclick')||'').match(/navigate\('([^']+)'\)/);
      if(!m) return;
      var ok = canAccessPage(m[1]);
      if(el.closest('#sideMenu')) return;
      if(el.classList.contains('help-nav-item') || el.classList.contains('btn') || el.tagName === 'BUTTON'){
        el.style.display = ok ? '' : 'none';
      }
    });
  }

  function setHelloName(){
    // Si le nom est déjà verrouillé par username-lock.js, l'utiliser directement
    if(window.GP_USER_NAME){
      document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function(el){ el.textContent = window.GP_USER_NAME; });
      return;
    }
    var emp = getCurrentEmployee();
    var u = window.currentUser || {};
    var name = '';
    if(emp) name = String(emp.prenom || '').trim() || String(emp.nom || '').trim();
    if(!name && u.displayName) name = String(u.displayName).trim().split(/\s+/)[0];
    if(!name && u.email) name = String(u.email).split('@')[0];
    if(!name) name = 'Utilisateur';
    try { localStorage.setItem('gp_session_name', name); localStorage.setItem('gp_session_firstname', name); } catch(e) {}
    document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function(el){ el.textContent = name; });
    // Verrouiller pour les prochains appels
    if(window.GPUserName && name && name !== 'Utilisateur') window.GPUserName.lock(name);
  }

  function fieldError(id,msg){
    var el=$(id); if(el){ el.focus(); el.style.borderColor='#E24B4A'; }
    toast(msg,'err'); return false;
  }

  function contratData(){
    return {
      id: 'CT-' + Date.now(),
      num: val('ct-num') || ('CT-' + Date.now()),
      locataire: val('ct-locataire'),
      locative: val('ct-locative'),
      type: val('ct-type') || 'Bail habitation',
      debut: val('ct-debut'),
      fin: val('ct-fin'),
      statut: val('ct-statut') || 'Actif',
      prochain: val('ct-prochain') || val('ct-debut') || today(),
      loyer: val('ct-loyer'),
      charges: val('ct-charges'),
      caution: val('ct-caution'),
      honor: val('ct-honor'),
      frais: val('ct-frais'),
      obs: val('ct-obs') || 'Néant',
      sign: val('ct-sign') || val('ct-debut') || today(),
      createdAt: new Date().toISOString()
    };
  }

  async function saveContratV12(){
    var c = contratData();
    if(!c.locataire) return fieldError('ct-locataire','Le locataire est requis');
    if(!c.locative) return fieldError('ct-locative','La locative est requise');
    if(!c.debut) return fieldError('ct-debut','La date de début est requise');
    if(!c.loyer) return fieldError('ct-loyer','Le loyer est requis');

    var db = loadDB();
    if(!Array.isArray(db.contrats)) db.contrats = [];
    if(db.contrats.some(function(x){ return norm(x.num) === norm(c.num); })){
      return fieldError('ct-num','Ce numéro de contrat existe déjà');
    }
    db.contrats.push(c);

    // Met à jour le statut du bien/de la location liée.
    (db.locatives||[]).forEach(function(l){
      if(norm(l.nom) === norm(c.locative) || norm(l.bien) === norm(c.locative)){
        l.locataire = l.locataire || c.locataire;
        l.occupant = l.occupant || c.locataire;
        l.statut = norm(c.statut) === 'actif' ? 'Loué' : (l.statut || 'Loué');
      }
    });
    (db.biens||[]).forEach(function(b){
      if(norm(b.nom) === norm(c.locative) || norm(b.titre) === norm(c.locative) || norm(b.adresse) === norm(c.locative)){
        b.statut = norm(c.statut) === 'actif' ? 'Loué' : (b.statut || 'Loué');
      }
    });

    await persistDB(db);
    if(typeof window.auditLog === 'function') try { window.auditLog('Ajout','Contrats', c.num + ' — ' + c.locataire); } catch(e) {}
    if(typeof window.resetAfterSave === 'function') window.resetAfterSave('page-nv-contrat');
    if(typeof window.navigate === 'function') window.navigate('contrats');
    setTimeout(function(){
      try { window.DB = loadDB(); } catch(e) {}
      if(typeof window.renderContrats === 'function') window.renderContrats();
      if(typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    }, 60);
    toast('Contrat créé avec succès ✓');
    return true;
  }

  async function saveEmployeV12(){
    var nom = val('e-nom');
    var email = val('e-email');
    var pass = val('e-pass');
    if(!nom) return toast('Le nom est requis','err');
    if(!email) return toast("L'email est requis pour créer un accès",'err');
    if(!pass || pass.length < 6) return toast('Mot de passe requis (6 caractères min.)','err');

    var btn = document.querySelector('#page-nv-employe .btn-primary');
    if(btn){ btn.disabled = true; btn.textContent = 'Enregistrement…'; }
    var authUser = null;
    try {
      if(window.GPFirebaseAuth && typeof window.GPFirebaseAuth.createEmployeeAccount === 'function') {
        authUser = await window.GPFirebaseAuth.createEmployeeAccount(email, pass);
      }
    } catch(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Enregistrer'; }
      return toast((e && e.message) || 'Compte utilisateur non créé','err');
    }

    var photo = '';
    try { if(typeof window.getPhotoData === 'function') photo = await window.getPhotoData('e-photo-input'); } catch(e) {}
    var db = loadDB();
    var droits = readEmployeeDroits();
    var existing = (db.employes||[]).find(function(e){ return norm(e.email) === norm(email); });
    var emp = {
      id: existing && existing.id || ('EP-' + Date.now()),
      uid: authUser && authUser.uid || existing && existing.uid || '',
      civ: val('e-civ'), nom: nom, prenom: val('e-prenom'), fonction: val('e-fonction'),
      tel: val('e-tel'), date: val('e-naiss') || today(), statut: 'Actif', adresse: val('e-adresse'),
      piece: val('e-piece'), numpiece: val('e-numpiece'), lieu: val('e-lieu'), deldeb: val('e-deldeb'),
      delexp: val('e-delexp'), matri: val('e-matri'), enfants: val('e-enfants'), contrat: val('e-contrat'),
      email: email, droits: droits, photo: photo || existing && existing.photo || ''
    };
    if(existing) Object.assign(existing, emp); else db.employes.push(emp);
    await persistDB(db);
    if(btn){ btn.disabled = false; btn.textContent = 'Enregistrer'; }
    if(typeof window.resetEmployeForm === 'function') window.resetEmployeForm(); else resetEmployeeDroits();
    if(typeof window.navigate === 'function') window.navigate('employes');
    toast(authUser ? 'Employé enregistré et accès créé ✓' : 'Employé enregistré ✓');
  }

  function patchNavigationGuards(){
    window.canAccess = canAccessPage;
    window.appliqueDroits = applyRightsUI;
    if(window.GPPermissions){
      window.GPPermissions.canPage = canAccessPage;
      window.GPPermissions.applyUI = applyRightsUI;
      window.GPPermissions.currentRole = function(){ return isAdminUser() ? 'admin' : 'personnalise'; };
      window.GPPermissions.has = function(roleOrAction, maybeAction){
        var action = maybeAction || roleOrAction || '';
        var page = String(action).split(':')[0];
        return canAccessPage(page);
      };
    }
    if(window.GPNavigation && window.GPNavigation.navigate && !window.GPNavigation.__v12patched){
      var oldNavigate = window.GPNavigation.navigate;
      window.GPNavigation.navigate = function(page){
        if(!canAccessPage(page)) { toast("Accès refusé — cette page n'est pas autorisée", 'err'); applyRightsUI(); return false; }
        var r = oldNavigate.apply(this, arguments);
        setTimeout(applyRightsUI, 30);
        return r;
      };
      window.navigate = window.GPNavigation.navigate;
      window.GPNavigation.__v12patched = true;
    } else if(typeof window.navigate === 'function' && !window.navigate.__v12patched){
      var nav = window.navigate;
      var wrapped = function(page){
        if(!canAccessPage(page)) { toast("Accès refusé — cette page n'est pas autorisée", 'err'); applyRightsUI(); return false; }
        var r = nav.apply(this, arguments);
        setTimeout(applyRightsUI, 30);
        return r;
      };
      wrapped.__v12patched = true;
      window.navigate = wrapped;
    }
  }

  window.saveContrat = saveContratV12;
  window.saveEmploye = saveEmployeV12;
  window.GPLiveFixV12 = { saveContrat: saveContratV12, saveEmploye: saveEmployeV12, applyRightsUI: applyRightsUI, canAccessPage: canAccessPage, setHelloName: setHelloName };

  function init(){
    patchNavigationGuards();
    setHelloName();
    applyRightsUI();
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 200); });
  window.addEventListener('gp:auth-changed', function(){ setTimeout(init, 80); });
  document.addEventListener('gp:navigation', function(){ setTimeout(init, 40); });
  window.addEventListener('gp:data-changed', function(){ setTimeout(init, 40); });
  setTimeout(init, 500);

  // [cleaned] debug console statement removed
})();

/* ===== Source: js/pages/live-fixes-v13.js ===== */

/* Genius Property — Live fixes V13
   - Contrats: force la persistance locale + Firestore et garde l'affichage immédiatement
   - Messages: corrige le destinataire obligatoire quand le select affiche un employé mais value vide
*/
(function(){
  'use strict';

  var DEFAULT_DB = {
    employes: [], proprietaires: [], locataires: [], biens: [], locatives: [], contrats: [],
    paiements: [], depenses: [], fichiers: [], messages: [], conversations: [], agenda: [],
    proprietaireDocs: {}, locataireDocs: {}, settings: {}, meta: { schemaVersion: 1 }
  };

  function $(id){ return document.getElementById(id); }
  function val(id){ var el=$(id); return el ? String(el.value||'').trim() : ''; }
  function toast(msg,type){ if(typeof window.toast === 'function') window.toast(msg,type||'ok'); else console.log(msg); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
  function today(){ return new Date().toISOString().split('T')[0]; }
  function clone(o){ try { return JSON.parse(JSON.stringify(o || {})); } catch(e){ return {}; } }

  function normalizeDB(input){
    var db = Object.assign(clone(DEFAULT_DB), input && typeof input === 'object' ? input : {});
    Object.keys(DEFAULT_DB).forEach(function(k){
      if(Array.isArray(DEFAULT_DB[k]) && !Array.isArray(db[k])) db[k] = [];
      if(!Array.isArray(DEFAULT_DB[k]) && (!db[k] || typeof db[k] !== 'object')) db[k] = clone(DEFAULT_DB[k]);
    });
    db.meta = Object.assign({}, DEFAULT_DB.meta, db.meta || {});
    db.meta.lastLocalChangeAt = new Date().toISOString();
    return db;
  }

  function loadDB(){
    var db = null;
    try { if(window.GPDB && window.GPDB.load) db = window.GPDB.load(); } catch(e) {}
    if(!db || typeof db !== 'object') db = window.DB || {};
    return normalizeDB(db);
  }

  async function forceCloudPush(db){
    if(!window.GPFirebase || !window.GPFirebase.push || !window.GPFirebase.available || !window.GPFirebase.available()) return false;
    try { if(window.GPFirebase.configure) window.GPFirebase.configure({ workspaceId:'auto', autosync:true }); } catch(e) {}
    await window.GPFirebase.push(normalizeDB(db));
    return true;
  }

  async function persistDB(db){
    db = normalizeDB(db);
    window.DB = db;
    var raw = JSON.stringify(db);
    try { localStorage.setItem('geniusproperty_db_clean_v1', raw); } catch(e) {}
    try { localStorage.setItem('geniusproperty_firebase_cache', raw); } catch(e) {}

    // Sauvegarde locale d'abord, puis push Firestore explicite.
    try {
      if(window.GPDB && window.GPDB.save) await window.GPDB.save(db, { skipCloud:true });
      else if(typeof window.saveDB === 'function') await window.saveDB();
    } catch(e){
      console.warn('[V13] Sauvegarde locale GPDB impossible, localStorage conservé:', e && (e.message || e));
    }

    try { await forceCloudPush(db); }
    catch(e){
      console.warn('[V13] Push Firestore impossible:', e && (e.message || e));
      toast('Sauvegarde locale OK, mais synchronisation Firebase échouée. Vérifie la connexion.', 'err');
    }

    try { window.dispatchEvent(new CustomEvent('gp:data-changed', { detail:{ db: db } })); } catch(e) {}
    try { document.dispatchEvent(new CustomEvent('gp:data-changed', { detail:{ db: db } })); } catch(e) {}
    return db;
  }

  function fieldError(id,msg){
    var el=$(id); if(el){ el.focus(); el.style.borderColor='#E24B4A'; }
    toast(msg,'err'); return false;
  }

  function selectedText(id){
    var el=$(id); if(!el) return '';
    var opt = el.selectedOptions && el.selectedOptions[0];
    return String((opt && (opt.dataset.email || opt.dataset.id || opt.value || opt.textContent)) || el.value || '').trim();
  }

  function contratData(){
    var locataire = val('ct-locataire') || selectedText('ct-locataire');
    var locative  = val('ct-locative') || selectedText('ct-locative');
    return {
      id: 'CT-' + Date.now(),
      num: val('ct-num') || ('CT-' + Date.now()),
      locataire: locataire,
      locative: locative,
      type: val('ct-type') || 'Habitation',
      sign: val('ct-sign') || val('ct-debut') || today(),
      debut: val('ct-debut'),
      fin: val('ct-fin'),
      statut: val('ct-statut') || 'Actif',
      prochain: val('ct-prochain') || val('ct-debut') || today(),
      loyer: val('ct-loyer'),
      charges: val('ct-charges'),
      caution: val('ct-caution'),
      honor: val('ct-honor'),
      frais: val('ct-frais'),
      obs: val('ct-obs') || 'Néant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async function saveContratV13(){
    var c = contratData();
    if(!c.locataire) return fieldError('ct-locataire','Le locataire est requis');
    if(!c.locative) return fieldError('ct-locative','La locative est requise');
    if(!c.debut) return fieldError('ct-debut','La date de début est requise');
    if(!c.loyer) return fieldError('ct-loyer','Le loyer est requis');

    var db = loadDB();
    if(!Array.isArray(db.contrats)) db.contrats = [];
    if(db.contrats.some(function(x){ return norm(x.num) === norm(c.num); })){
      c.num = 'CT-' + Date.now();
    }
    db.contrats.unshift(c);

    (db.locatives||[]).forEach(function(l){
      if(norm(l.nom) === norm(c.locative) || norm(l.bien) === norm(c.locative) || norm(l.id) === norm(c.locative)){
        l.locataire = l.locataire || c.locataire;
        l.occupant = l.occupant || c.locataire;
        l.statut = norm(c.statut) === 'actif' ? 'Loué' : (l.statut || 'Loué');
        l.updatedAt = new Date().toISOString();
      }
    });
    (db.biens||[]).forEach(function(b){
      if(norm(b.nom) === norm(c.locative) || norm(b.titre) === norm(c.locative) || norm(b.adresse) === norm(c.locative) || norm(b.id) === norm(c.locative)){
        b.statut = norm(c.statut) === 'actif' ? 'Loué' : (b.statut || 'Loué');
        b.updatedAt = new Date().toISOString();
      }
    });

    await persistDB(db);
    if(typeof window.auditLog === 'function') try { window.auditLog('Ajout','Contrats', c.num + ' — ' + c.locataire); } catch(e) {}
    try { if(typeof window.resetAfterSave === 'function') window.resetAfterSave('page-nv-contrat'); } catch(e) {}
    try { if(typeof window.renderContrats === 'function') window.renderContrats(); } catch(e) {}
    try { if(typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges(); } catch(e) {}
    if(typeof window.navigate === 'function') window.navigate('contrats');
    setTimeout(function(){ try { if(typeof window.renderContrats === 'function') window.renderContrats(); } catch(e) {} }, 100);
    toast('Contrat enregistré et synchronisé ✓');
    return true;
  }

  function readMessageDest(){
    var ids = ['nm-dest','msg-new-dest','message-dest','destinataire'];
    for(var i=0;i<ids.length;i++){
      var el=$(ids[i]); if(!el) continue;
      var opt = el.selectedOptions && el.selectedOptions[0];
      var v = String(el.value || '').trim();
      if(!v && opt) v = String(opt.getAttribute('data-email') || opt.getAttribute('data-id') || opt.value || opt.textContent || '').trim();
      if(v) return v;
      if(opt && opt.textContent) return String(opt.textContent).trim();
    }
    return '';
  }

  function readMessageType(){
    var raw = val('nm-type') || val('msg-new-type') || val('nm-priorite') || val('msg-priorite') || 'normal';
    var n = norm(raw);
    if(n.indexOf('urgent') !== -1) return 'urgent';
    if(n.indexOf('rappel') !== -1) return 'rappel';
    if(n.indexOf('info') !== -1 || n.indexOf('information') !== -1) return 'info';
    return 'normal';
  }

  async function saveMessagesDB(db){
    await persistDB(db);
    try { if(typeof window.renderConvList === 'function') window.renderConvList(); } catch(e) {}
    try { if(typeof window.renderMessages === 'function') window.renderMessages(); } catch(e) {}
    try { if(typeof window.updateMsgBadge === 'function') window.updateMsgBadge(); } catch(e) {}
  }

  function patchMessages(){
    window.envoyerNouveauMsg = async function(){
      var dest = readMessageDest();
      var objet = val('nm-objet') || val('msg-new-objet') || 'Information interne';
      var corps = val('nm-corps') || val('msg-new-corps') || val('nm-message') || '';
      var type = readMessageType();
      if(!dest) return toast('Destinataire obligatoire', 'err');
      if(!String(objet).trim()) return toast('Objet obligatoire', 'err');
      if(!String(corps).trim()) return toast('Message obligatoire', 'err');

      var db = loadDB();
      if(!Array.isArray(db.messages)) db.messages=[];
      if(!Array.isArray(db.conversations)) db.conversations=[];
      var now = new Date().toISOString();
      var contact = (db.employes||[]).find(function(e){
        var label = ((e.prenom||'') + ' ' + (e.nom||'') + ' — ' + (e.fonction||e.poste||'')).trim();
        return norm(e.email)===norm(dest) || norm(e.id)===norm(dest) || norm(label)===norm(dest) || norm((e.prenom||'')+' '+(e.nom||''))===norm(dest);
      });
      var contactId = (contact && (contact.email || contact.id)) || dest;
      var contactName = contact ? (((contact.prenom||'')+' '+(contact.nom||'')).trim() || contact.email) : dest;
      var conv = db.conversations.find(function(c){ return norm(c.contactId)===norm(contactId) || norm(c.contact)===norm(contactName); });
      if(!conv){
        conv = { id:'conv_' + Date.now(), contactId:contactId, contact:contactName, contactRole:(contact && (contact.fonction||contact.poste)) || 'Employé', dernierMsg:'', nonLus:0, date:now, type:type };
        db.conversations.unshift(conv);
      }
      var msg = { id:'msg_' + Date.now(), convId:conv.id, de:'Direction', vers:contactId, versRole:conv.contactRole || 'Employé', objet:objet.trim(), corps:corps.trim(), date:now, lu:false, type:type };
      db.messages.push(msg);
      conv.dernierMsg = msg.corps; conv.objet = msg.objet; conv.date = now; conv.type = type;
      await saveMessagesDB(db);
      if(typeof window.closeNewMsgModal === 'function') window.closeNewMsgModal();
      toast('Message envoyé ✓');
      return msg;
    };
  }

  window.saveContrat = saveContratV13;
  if(window.GPLiveFixV12) window.GPLiveFixV12.saveContrat = saveContratV13;
  window.GPLiveFixV13 = { saveContrat: saveContratV13, persistDB: persistDB, patchMessages: patchMessages };

  function init(){ patchMessages(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 500);
  window.addEventListener('gp:data-changed', function(){ setTimeout(init, 50); });
  // [cleaned] debug console statement removed
})();

