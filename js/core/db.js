/* Genius Property V17 — Core DB layer
   Objectif : centraliser l'accès aux données avant migration Supabase/Firebase.
   Cette couche reste compatible localStorage + window.DB pour ne pas casser le bundle legacy. */
(function(){
  'use strict';

  var GP = window.GP = window.GP || {};
  var STORAGE_KEY = GP.STORAGE_KEY || 'geniusproperty_db_clean_v1';
  var GPStorage = window.GPStorage || null;
  var BACKUP_KEY = 'geniusproperty_last_backup_snapshot';
  var BACKUP_DATE_KEY = 'geniusproperty_last_backup_date';

  var DEFAULT_DB = {
    proprietaires: [],
    biens: [],
    locataires: [],
    locatives: [],
    paiements: [],
    depenses: [],
    contrats: [],
    agenda: [],
    messages: [],
    settings: {},
    meta: {
      schemaVersion: 1,
      updatedAt: null
    }
  };

  function clone(obj){
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : clone(fallback); }
    catch(e){
      console.warn('[GPDB] JSON invalide, fallback utilisé', e);
      return clone(fallback);
    }
  }

  function normalize(db){
    db = db && typeof db === 'object' ? db : {};
    Object.keys(DEFAULT_DB).forEach(function(key){
      if (Array.isArray(DEFAULT_DB[key])) {
        if (!Array.isArray(db[key])) db[key] = [];
      } else if (!db[key] || typeof db[key] !== 'object') {
        db[key] = clone(DEFAULT_DB[key]);
      }
    });
    db.meta = db.meta || {};
    db.meta.schemaVersion = db.meta.schemaVersion || 1;
    return db;
  }

  function emit(eventName, detail){
    try { window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} })); }
    catch(e) { /* anciens navigateurs */ }
  }

  function countRecordsRaw(raw){
    var d = safeParse(raw, {}) || {};
    return ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers','messages','conversations','agenda'].reduce(function(n,k){ return n + (Array.isArray(d[k]) ? d[k].length : 0); }, 0);
  }

  function readRaw(){
    var local = localStorage.getItem(STORAGE_KEY);
    if (window.GPStorage && typeof window.GPStorage.readRaw === 'function') {
      var active = window.GPStorage.readRaw();
      // Si l'adapter Firebase renvoie un cache vide mais le stockage local contient des données,
      // conserver le stockage local pour éviter la disparition après refresh.
      if (countRecordsRaw(local) > countRecordsRaw(active)) return local;
      return active;
    }
    return local;
  }

  function writeRaw(raw){
    localStorage.setItem(STORAGE_KEY, raw);
    if (window.GPStorage && typeof window.GPStorage.writeRaw === 'function') return window.GPStorage.writeRaw(raw);
    return true;
  }

  function load(){
    // FIX V35 : le stockage actif (cache Supabase/localStorage) est la source principale.
    // Avant, si window.DB existait déjà, on ignorait les données relues du cloud au refresh.
    var fromStorage = safeParse(readRaw(), null);
    var db = normalize(fromStorage || window.DB || DEFAULT_DB);
    window.DB = db;
    return db;
  }

  function save(db, options){
    options = options || {};
    if (!options.skipLicenseGuard && window.GPLicenseGuard && typeof window.GPLicenseGuard.beforeWrite === 'function') {
      window.GPLicenseGuard.beforeWrite(options.domain || 'data');
    }
    var data = normalize(db || window.DB || {});
    data.meta = data.meta || {};
    data.meta.updatedAt = new Date().toISOString();

    try {
      writeRaw(JSON.stringify(data));
      // Mutate window.DB in place so const DB references in legacy bundle stay in sync
      if (window.DB && typeof window.DB === 'object') {
        Object.keys(window.DB).forEach(function(k){ delete window.DB[k]; });
        Object.assign(window.DB, data);
      } else {
        window.DB = data;
      }
      if (!options.silent) emit('gp:db:saved', { db: data });
      return true;
    } catch(e) {
      console.error('[GPDB] Échec sauvegarde localStorage', e);
      if (GP.toast) GP.toast('Erreur sauvegarde locale. Exportez vos données.', 'err');
      return false;
    }
  }

  function update(mutator, options){
    var db = load();
    if (typeof mutator === 'function') mutator(db);
    save(db, options);
    return db;
  }

  function collection(name){
    var db = load();
    if (!Array.isArray(db[name])) db[name] = [];
    return db[name];
  }

  function findById(name, id){
    return collection(name).find(function(item){ return String(item.id) === String(id); }) || null;
  }

  function upsert(name, item, idField){
    idField = idField || 'id';
    if (!item || typeof item !== 'object') throw new Error('GPDB.upsert: item invalide');
    var db = load();
    if (!Array.isArray(db[name])) db[name] = [];
    if (!item[idField]) item[idField] = GP.uid ? GP.uid(name.slice(0,3) || 'id') : String(Date.now());
    var idx = db[name].findIndex(function(row){ return String(row[idField]) === String(item[idField]); });
    if (idx >= 0) db[name][idx] = Object.assign({}, db[name][idx], item);
    else db[name].push(item);
    save(db);
    return item;
  }

  function remove(name, id, idField){
    idField = idField || 'id';
    var db = load();
    if (!Array.isArray(db[name])) db[name] = [];
    var before = db[name].length;
    db[name] = db[name].filter(function(row){ return String(row[idField]) !== String(id); });
    save(db);
    return before !== db[name].length;
  }

  function backupSnapshot(){
    var db = load();
    try {
      if (window.GPStorage && typeof window.GPStorage.snapshot === 'function') {
        window.GPStorage.snapshot(db, 'gpdb');
      } else {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({ date: new Date().toISOString(), data: db }));
        localStorage.setItem(BACKUP_DATE_KEY, GP.todayKey ? GP.todayKey() : new Date().toISOString().slice(0,10));
      }
      return true;
    } catch(e) {
      console.warn('[GPDB] Backup snapshot impossible', e);
      return false;
    }
  }

  function exportJSON(filename){
    var db = load();
    var date = GP.todayKey ? GP.todayKey() : new Date().toISOString().slice(0,10);
    if (window.GPStorage && typeof window.GPStorage.exportFile === 'function') {
      return window.GPStorage.exportFile(db, filename || ('genius-property-backup-' + date + '.json'));
    }
    var blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || ('genius-property-backup-' + date + '.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    return db;
  }

  function validateSchema(input){
    var errors = [];
    var db = input && typeof input === 'object' ? input : {};
    Object.keys(DEFAULT_DB).forEach(function(key){
      if (Array.isArray(DEFAULT_DB[key]) && db[key] != null && !Array.isArray(db[key])) {
        errors.push(key + ' doit être un tableau');
      }
    });
    return { ok: errors.length === 0, errors: errors };
  }

  function importJSON(fileOrText){
    return new Promise(function(resolve, reject){
      function apply(text){
        try {
          var rawParsed = JSON.parse(String(text || '{}'));
          var check = validateSchema(rawParsed);
          if (!check.ok) throw new Error('Structure import invalide: ' + check.errors.join(', '));
          backupSnapshot();
          var parsed = normalize(rawParsed);
          save(parsed);
          backupSnapshot();
          emit('gp:db:imported', { db: parsed });
          resolve(parsed);
        } catch(e) { reject(e); }
      }
      if (typeof fileOrText === 'string') return apply(fileOrText);
      var reader = new FileReader();
      reader.onload = function(){ apply(reader.result); };
      reader.onerror = reject;
      reader.readAsText(fileOrText);
    });
  }

  function health(){
    var db = load();
    return {
      storageKey: STORAGE_KEY,
      bytes: (readRaw() || '').length,
      storage: window.GPStorage && window.GPStorage.status ? window.GPStorage.status() : { active: 'localStorage' },
      counts: Object.keys(DEFAULT_DB).reduce(function(acc, key){
        if (Array.isArray(db[key])) acc[key] = db[key].length;
        return acc;
      }, {}),
      updatedAt: db.meta && db.meta.updatedAt || null
    };
  }

  var GPDB = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_DB: clone(DEFAULT_DB),
    load: load,
    save: save,
    update: update,
    collection: collection,
    findById: findById,
    upsert: upsert,
    remove: remove,
    backupSnapshot: backupSnapshot,
    exportJSON: exportJSON,
    importJSON: importJSON,
    health: health,
    normalize: normalize,
    validateSchema: validateSchema
  };

  GP.DB = GPDB;
  window.GPDB = GPDB;

  // Compatibilité avec les helpers V6 existants.
  GP.getDB = load;
  GP.saveDB = save;
  GP.saveBackupSnapshot = backupSnapshot;
  GP.exportData = exportJSON;
  GP.importData = importJSON;
  window.gp_getDB = load;
  window.gp_saveDB = save;
  window.saveDB = window.saveDB || save;
  window.loadDB = window.loadDB || load;
  window.gp_exportData = exportJSON;
  window.gp_importData = importJSON;

  load();
  // [cleaned] debug console statement removed
})();
