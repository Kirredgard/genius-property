/* Genius Property V24 — Storage Adapter
   Objectif : isoler le stockage pour pouvoir remplacer localStorage par Supabase/Firebase
   sans changer les modules métier. L'adapter actif reste localStorage par défaut. */
(function(){
  'use strict';

  var GP = window.GP = window.GP || {};
  var DEFAULT_KEY = GP.STORAGE_KEY || 'geniusproperty_db_clean_v1';
  var ADAPTER_NAME_KEY = 'geniusproperty_storage_adapter_name';
  var BACKUP_PREFIX = 'geniusproperty_backup_';

  function now(){ return new Date().toISOString(); }
  function clone(obj){ return JSON.parse(JSON.stringify(obj || {})); }

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function byteLength(text){
    try { return new Blob([String(text || '')]).size; }
    catch(e){ return String(text || '').length; }
  }

  function emit(eventName, detail){
    try { window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} })); }
    catch(e){}
  }

  function makeLocalStorageAdapter(key){
    key = key || DEFAULT_KEY;
    return {
      name: 'localStorage',
      key: key,
      isAsync: false,
      available: function(){
        try {
          var probe = '__gp_storage_probe__';
          localStorage.setItem(probe, '1');
          localStorage.removeItem(probe);
          return true;
        } catch(e){ return false; }
      },
      readRaw: function(){ return localStorage.getItem(key); },
      writeRaw: function(raw){ localStorage.setItem(key, String(raw || '')); return true; },
      remove: function(){ localStorage.removeItem(key); return true; },
      size: function(){ return byteLength(localStorage.getItem(key) || ''); },
      keys: function(){
        var out = [];
        for (var i=0; i<localStorage.length; i++) out.push(localStorage.key(i));
        return out;
      }
    };
  }

  var adapters = { localStorage: makeLocalStorageAdapter(DEFAULT_KEY) };
  var activeName = localStorage.getItem(ADAPTER_NAME_KEY) || 'localStorage';

  function register(name, adapter){
    if (!name || !adapter) throw new Error('GPStorage.register: adapter invalide');
    adapter.name = adapter.name || name;
    adapters[name] = adapter;
    emit('gp:storage:registered', { name: name });
    return adapter;
  }

  function use(name){
    if (!adapters[name]) throw new Error('Adapter stockage inconnu: ' + name);
    if (typeof adapters[name].available === 'function' && !adapters[name].available()) {
      throw new Error('Adapter stockage indisponible: ' + name);
    }
    activeName = name;
    try { localStorage.setItem(ADAPTER_NAME_KEY, name); } catch(e){}
    emit('gp:storage:changed', { name: name });
    return adapter();
  }

  function adapter(){ return adapters[activeName] || adapters.localStorage; }

  function readRaw(){ return adapter().readRaw(); }
  function writeRaw(raw){ return adapter().writeRaw(raw); }
  function clear(){ return adapter().remove ? adapter().remove() : writeRaw(''); }

  function readJSON(fallback){ return safeParse(readRaw(), fallback || null); }
  function writeJSON(data){ return writeRaw(JSON.stringify(data || {})); }

  function snapshot(data, label){
    var payload = { date: now(), label: label || 'manual', data: clone(data || readJSON({})) };
    var key = BACKUP_PREFIX + payload.date.replace(/[:.]/g, '-');
    try {
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem('geniusproperty_last_backup_snapshot', JSON.stringify(payload));
      localStorage.setItem('geniusproperty_last_backup_date', payload.date.slice(0,10));
      emit('gp:storage:backup', { key: key, date: payload.date });
      return payload;
    } catch(e) {
      console.warn('[GPStorage] Backup impossible', e);
      return null;
    }
  }

  function listBackups(){
    var keys = [];
    try {
      for (var i=0; i<localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(BACKUP_PREFIX) === 0) keys.push(k);
      }
    } catch(e){}
    return keys.sort().reverse().map(function(k){
      var raw = localStorage.getItem(k);
      var parsed = safeParse(raw, {});
      return { key: k, date: parsed.date || null, label: parsed.label || null, bytes: byteLength(raw || '') };
    });
  }

  function exportFile(data, filename){
    var payload = data || readJSON({});
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || ('genius-property-backup-' + now().slice(0,10) + '.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    return payload;
  }

  function status(){
    var a = adapter();
    var raw = '';
    try { raw = readRaw() || ''; } catch(e){}
    return {
      active: activeName,
      available: typeof a.available === 'function' ? a.available() : true,
      key: a.key || DEFAULT_KEY,
      bytes: byteLength(raw),
      backups: listBackups().length,
      registered: Object.keys(adapters)
    };
  }

  window.GPStorage = GP.Storage = {
    register: register,
    use: use,
    adapter: adapter,
    readRaw: readRaw,
    writeRaw: writeRaw,
    readJSON: readJSON,
    writeJSON: writeJSON,
    clear: clear,
    snapshot: snapshot,
    listBackups: listBackups,
    exportFile: exportFile,
    status: status,
    makeLocalStorageAdapter: makeLocalStorageAdapter
  };

  // [cleaned] debug console statement removed
})();
