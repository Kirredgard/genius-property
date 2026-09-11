/* Genius Property V21 — Core DB layer
   Objectif : centraliser l'accès aux données avant migration Supabase/Firebase.
   Cette couche reste compatible localStorage + window.DB pour ne pas casser le bundle legacy. */
(function(){
  'use strict';

  var GP = window.GP = window.GP || {};
  var STORAGE_KEY = GP.STORAGE_KEY || 'geniusproperty_db_clean_v1';
  var GPStorage = window.GPStorage || null;
  var BACKUP_KEY = 'geniusproperty_last_backup_snapshot';
  var BACKUP_DATE_KEY = 'geniusproperty_last_backup_date';
  var AUTHORITATIVE_KEY = 'geniusproperty_db_authoritative_v1';

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

  var GPDB_REVISION_KEY = 'gpdb_local_revision';

  function currentRevision(){
    var n = parseInt(localStorage.getItem(GPDB_REVISION_KEY) || '0', 10);
    return Number.isFinite(n) ? n : 0;
  }
  function setRevision(n){
    n = Math.max(0, parseInt(n || '0', 10));
    localStorage.setItem(GPDB_REVISION_KEY, String(n));
    return n;
  }
  function stampRevision(db, rev){
    db = db || {};
    db.meta = db.meta || {};
    db.meta.localRevision = rev;
    return db;
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
    var authoritative = localStorage.getItem(AUTHORITATIVE_KEY);
    var lp = safeParse(local, null), ap = safeParse(authoritative, null);
    var lr = lp && lp.meta ? Number(lp.meta.localRevision || 0) : 0;
    var ar = ap && ap.meta ? Number(ap.meta.localRevision || 0) : 0;
    var active = null, sp = null, sr = 0;
    try {
      if(window.GPStorage && typeof window.GPStorage.readRaw === 'function') {
        active = window.GPStorage.readRaw();
        sp = safeParse(active, null);
        sr = sp && sp.meta ? Number(sp.meta.localRevision || 0) : 0;
      }
    } catch(e) {}
    // Highest revision wins. On equal revisions, authoritative wins over the
    // legacy raw key/cloud cache. This makes old modules unable to erase data.
    if(ap && ar >= Math.max(Number(lr||0), Number(sr||0))) {
      if(ar > Number(lr||0)) { try { localStorage.setItem(STORAGE_KEY, authoritative); } catch(e) {} }
      if(ar > Number(sr||0)) { try { if(window.GPStorage && window.GPStorage.writeRaw) window.GPStorage.writeRaw(authoritative); } catch(e) {} }
      return authoritative;
    }
    if(sp && sr > Number(lr||0)) {
      try { localStorage.setItem(STORAGE_KEY, active); } catch(e) {}
      return active;
    }
    return local || active;
  }
  function writeRaw(raw){
    localStorage.setItem(STORAGE_KEY, raw);
    if (window.GPStorage && typeof window.GPStorage.writeRaw === 'function') return window.GPStorage.writeRaw(raw);
    return true;
  }

  function load(){
    var fromStorage = safeParse(readRaw(), null);
    var db = normalize(fromStorage || window.DB || DEFAULT_DB);
    db.meta = db.meta || {};
    var rev = Number(db.meta.localRevision || currentRevision() || 0);
    if(!Number.isFinite(rev) || rev < 0) rev = currentRevision();
    if(rev !== currentRevision()) setRevision(rev);
    db.meta.localRevision = rev;
    try { if(!localStorage.getItem(AUTHORITATIVE_KEY)) localStorage.setItem(AUTHORITATIVE_KEY, JSON.stringify(db)); } catch(e) {}
    window.DB = db;
    return db;
  }

  function save(db, options){
    options = options || {};
    if (!options.skipLicenseGuard && window.GPLicenseGuard && typeof window.GPLicenseGuard.beforeWrite === 'function') {
      window.GPLicenseGuard.beforeWrite(options.domain || 'data');
    }

    var incoming = normalize(db || window.DB || {});
    incoming.meta = incoming.meta || {};

    // Optimistic concurrency control:
    // every GPDB.load() carries the current revision. A delayed operation that
    // tries to save an older snapshot is rejected instead of resurrecting data.
    var stored = safeParse(readRaw(), null);
    var storedRev = stored && stored.meta ? Number(stored.meta.localRevision || 0) : currentRevision();
    if(!Number.isFinite(storedRev) || storedRev < 0) storedRev = currentRevision();

    var incomingRev = Number(incoming.meta.localRevision || 0);
    if(!Number.isFinite(incomingRev) || incomingRev < 0) incomingRev = storedRev;

    if(!options.force && stored && incomingRev < storedRev){
      console.warn('[GPDB] Stale write ignored', {incomingRev:incomingRev, storedRev:storedRev});
      return false;
    }

    var nextRev = Math.max(storedRev, incomingRev) + 1;
    stampRevision(incoming, nextRev);
    incoming.meta.updatedAt = new Date().toISOString();

    try {
      var serialized = JSON.stringify(incoming);
      writeRaw(serialized);
      localStorage.setItem(AUTHORITATIVE_KEY, serialized);

      if (window.DB && typeof window.DB === 'object') {
        Object.keys(window.DB).forEach(function(k){ delete window.DB[k]; });
        Object.assign(window.DB, incoming);
      } else {
        window.DB = incoming;
      }

      setRevision(nextRev);

      if (!options.silent) {
        try { localStorage.setItem('gp_data_dirty_at', new Date().toISOString()); } catch(ignore) {}
        emit('gp:db:saved', { db: incoming, revision: nextRev });
      }

      if (!options.skipCloud && !options.silent && window.GPSupabase &&
          typeof window.GPSupabase.push === 'function' &&
          typeof window.GPSupabase.available === 'function' && window.GPSupabase.available() &&
          window.GPSupabase.currentUid && window.GPSupabase.currentUid()) {
        window.GPSupabase.push(incoming).catch(function(e){
          console.warn('[GPDB] Synchronisation Supabase échouée:', e && (e.message || e));
          try { if(window.toast) window.toast('Donnée locale enregistrée ; synchronisation Supabase à vérifier.', 'err'); } catch(ignore) {}
        });
      }
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
    validateSchema: validateSchema,
    authoritativeKey: AUTHORITATIVE_KEY,
    authoritativeSnapshot: function(){ return safeParse(localStorage.getItem(AUTHORITATIVE_KEY), null); }
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
