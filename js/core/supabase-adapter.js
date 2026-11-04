/* Genius Property V22 — Supabase browser adapter
   Backend unique : Supabase Auth + Postgres/RLS.
   La clé utilisée dans le navigateur doit être une Publishable key (sb_publishable_...). */
(function(){
  'use strict';

  var state = {
    url: '',
    publishableKey: '',
    client: null,
    loading: null,
    configured: false,
    autosync: true,
    table: 'gp_app_data',
    rowId: 'main',
    serverVersion: 1,
    versionKnown: false,
    // V30 — protection des données
    syncReady: false,   // true seulement après la réconciliation local/cloud de la session
    cloudCount: 0       // nombre d'enregistrements vus côté serveur au dernier pull
  };
  var RECORD_KEYS = ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers','messages','conversations','agenda'];
  function countRecords(d){
    d = d || {};
    return RECORD_KEYS.reduce(function(n,k){ return n + (Array.isArray(d[k]) ? d[k].length : 0); }, 0);
  }
  function isDirty(){ try { return localStorage.getItem('gp_data_dirty_at') || ''; } catch(_) { return ''; } }
  var pushChain = Promise.resolve();

  function readConfig(){
    var env = window.GPV22_ENV || {};
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('gp_supabase_config') || '{}') || {}; } catch(_) {}
    state.url = String(saved.url || env.supabaseUrl || '').trim().replace(/\/+$/, '');
    state.publishableKey = String(saved.publishableKey || env.supabasePublishableKey || '').trim();
    state.configured = !!(state.url && state.publishableKey);
  }
  readConfig();

  function isPublicKey(k){ return /^sb_publishable_/i.test(k) || /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(k); }
  function valid(){
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(state.url) && isPublicKey(state.publishableKey);
  }

  function loadLibrary(){
    if(window.supabase && typeof window.supabase.createClient === 'function') return Promise.resolve(window.supabase);
    if(state.loading) return state.loading;
    state.loading = import('https://esm.sh/@supabase/supabase-js@2')
      .then(function(mod){
        window.__gpSupabaseLib = mod;
        return mod;
      })
      .catch(function(err){
        state.loading = null;
        throw new Error('Impossible de charger Supabase : ' + (err && err.message ? err.message : err));
      });
    return state.loading;
  }

  function ensureClient(){
    readConfig();
    if(!valid()) return Promise.reject(new Error('Supabase n’est pas configuré. Ajoutez la Project URL et la Publishable key.'));
    if(state.client) return Promise.resolve(state.client);
    return loadLibrary().then(function(lib){
      var createClient = lib.createClient || (window.supabase && window.supabase.createClient);
      if(typeof createClient !== 'function') throw new Error('Le SDK Supabase n’expose pas createClient.');
      state.client = createClient(state.url, state.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      state.configured = true;
      window._supabaseClient = state.client;
      window.__gpUnifiedSupaClient = state.client;
      try { window.dispatchEvent(new Event('supabase:ready')); } catch(_) {}
      return state.client;
    });
  }

  function configure(opts){
    opts = opts || {};
    var url = String(opts.url || '').trim().replace(/\/+$/, '');
    var key = String(opts.publishableKey || '').trim();
    if(!url || !key) throw new Error('URL et Publishable key sont obligatoires.');
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) throw new Error('URL Supabase invalide.');
    if(!isPublicKey(key)) throw new Error('Clé publique Supabase invalide.');
    state.url = url;
    state.publishableKey = key;
    state.configured = true;
    state.table = opts.table || state.table;
    state.rowId = opts.rowId || state.rowId;
    state.autosync = opts.autosync !== false;
    state.client = null;
    try { localStorage.setItem('gp_supabase_config', JSON.stringify({url:url,publishableKey:key})); } catch(_) {}
    ensureClient().catch(function(err){ console.error('[GPSupabase] init:', err); });
    return true;
  }

  function config(){
    readConfig();
    return { url: state.url, publishableKey: state.publishableKey, configured: state.configured, autosync: state.autosync, table: state.table, rowId: state.rowId };
  }
  function available(){ return !!state.client; }
  function currentUid(){
    try { return window._supabaseCurrentUser && window._supabaseCurrentUser.id || null; } catch(_) { return null; }
  }
  function client(){ return state.client; }

  async function ready(){ return ensureClient(); }

  async function pull(options){
    options = options || {};
    var sb = await ready();
    var result = await sb.rpc('gp_get_app_data');
    if(result.error) throw result.error;
    var row = Array.isArray(result.data) ? result.data[0] : result.data;
    state.serverVersion = Number(row && row.version || 1);
    state.versionKnown = true;
    var data = row && row.payload ? row.payload : null;
    state.cloudCount = countRecords(data);
    if(options.applyToLocal && data && window.GPDB && typeof window.GPDB.save === 'function') {
      window.GPDB.save(data, {silent:true, skipCloud:true});
    }
    return data;
  }

  function pushError(code, message){
    var e = new Error(message); e.code = code; return e;
  }

  async function doPush(data, opts){
    opts = opts || {};
    var sb = await ready();
    // 1) Aucun envoi tant que la réconciliation local/cloud de la session n'est pas faite :
    //    sinon une base locale vide (pas encore chargée) écrase le cloud.
    if(!state.syncReady && !opts.bootstrap) {
      throw pushError('sync_not_ready', 'Synchronisation initiale en cours : envoi différé.');
    }
    // 2) Version serveur (et volume cloud) toujours connus avant d'envoyer.
    if(!state.versionKnown){ try { await pull({applyToLocal:false}); } catch(_) {} }
    var payload = data || window.DB || {};
    if(!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw pushError('invalid_payload', 'Données invalides : envoi refusé.');
    }
    // 3) Anti-écrasement : refuse d'envoyer une base vide (ou quasi vide) par-dessus un cloud rempli.
    var n = countRecords(payload), c = Number(state.cloudCount || 0);
    if(!opts.allowShrink && ((c >= 5 && n === 0) || (c >= 10 && n < c * 0.2))) {
      throw pushError('shrink_refused', 'Envoi refusé : ' + n + ' enregistrement(s) locaux contre ' + c + ' dans le cloud. Vos données cloud sont protégées.');
    }
    var expected = Number(state.serverVersion || 1);
    var result = await sb.rpc('gp_update_app_data', {p_payload: payload, p_expected_version: expected, p_allow_shrink: !!opts.allowShrink});
    if(result.error && /stale_data/i.test(result.error.message || '') && !opts._merged &&
       window.GPDB && typeof window.GPDB.mergeSnapshots === 'function') {
      // V31 — Un autre poste a enregistré entre-temps. On NE renvoie PAS notre copie telle quelle
      // (elle écraserait ses modifications et ferait revenir les éléments supprimés) :
      // on relit le cloud, on fusionne en respectant les suppressions, puis on renvoie une fois.
      state.versionKnown = false;
      var fresh = await pull({applyToLocal:false});
      var merged = fresh ? window.GPDB.mergeSnapshots(fresh, payload) : payload;
      try { window.GPDB.save(merged, {silent:true, force:true}); } catch(_) {}
      try { window.dispatchEvent(new CustomEvent('gp:supabase:pulled')); } catch(_) {}
      var o2 = {}; Object.keys(opts).forEach(function(k){ o2[k] = opts[k]; }); o2._merged = true;
      return doPush(merged, o2);
    }
    if(result.error) {
      if(/stale_data/i.test(result.error.message || '')) {
        state.versionKnown = false;
        try { await pull({applyToLocal:false}); } catch(_) {}
        throw pushError('stale_data', 'Les données ont changé sur un autre poste. Rechargez les données avant de réessayer.');
      }
      if(/shrink_refused/i.test(result.error.message || '')) {
        throw pushError('shrink_refused', 'Le serveur a refusé un écrasement massif des données.');
      }
      throw result.error;
    }
    var row = Array.isArray(result.data) ? result.data[0] : result.data;
    state.serverVersion = Number(row && row.version || expected + 1);
    state.versionKnown = true;
    state.cloudCount = n;
    return row;
  }

  // PHASE 7 — API de synchronisation par fiche (pont volontairement inactif).
  // Ces fonctions ne sont PAS branchées sur GPDB.save()/flush : l'ancien snapshot
  // reste l'unique chemin automatique tant que le backfill et la réconciliation
  // de toutes les collections n'ont pas été validés.
  var RECORD_COLLECTIONS = [
    'employes','proprietaires','locataires','biens','locatives','contrats',
    'paiements','depenses','fichiers','messages','conversations','agenda',
    'marches','reversements','revenusAutres','activites'
  ];

  function validateRecordArgs(collection, recordId) {
    if (RECORD_COLLECTIONS.indexOf(String(collection || '')) < 0) {
      throw pushError('invalid_collection', 'Collection non prise en charge.');
    }
    if (recordId == null || !String(recordId).trim() || String(recordId).length > 200) {
      throw pushError('invalid_record_id', 'Identifiant de fiche absent ou invalide.');
    }
  }

  function normalizeRecordError(err) {
    var msg = String(err && (err.message || err.details || err) || 'Erreur Supabase');
    if (/record_conflict/i.test(msg)) {
      return pushError('record_conflict', 'Cette fiche a été modifiée sur un autre appareil. Rechargez-la avant de réessayer.');
    }
    if (/not_authorized|permission denied|row-level security/i.test(msg)) {
      return pushError('record_not_authorized', 'Accès refusé pour cette fiche ou cette agence.');
    }
    return err instanceof Error ? err : new Error(msg);
  }

  async function pullRecordCollection(collection, options) {
    options = options || {};
    if (RECORD_COLLECTIONS.indexOf(String(collection || '')) < 0) {
      throw pushError('invalid_collection', 'Collection non prise en charge.');
    }
    var sb = await ready();
    var pageSize = Math.max(1, Math.min(Number(options.pageSize || 500), 1000));
    var offset = 0, rows = [];
    while (true) {
      var result = await sb.from('gp_app_records')
        .select('record_id,payload,version,deleted_at,updated_at')
        .eq('collection', collection)
        .order('record_id', {ascending:true})
        .range(offset, offset + pageSize - 1);
      if (result.error) throw normalizeRecordError(result.error);
      var page = Array.isArray(result.data) ? result.data : [];
      rows = rows.concat(page);
      if (page.length < pageSize) break;
      offset += page.length;
    }
    return rows;
  }

  async function pullAllRecordCollections(options) {
    var out = {};
    for (var i = 0; i < RECORD_COLLECTIONS.length; i++) {
      var collection = RECORD_COLLECTIONS[i];
      out[collection] = await pullRecordCollection(collection, options);
    }
    return out;
  }

  async function writeRecord(collection, recordId, payload, expectedVersion) {
    validateRecordArgs(collection, recordId);
    if (!Number.isInteger(Number(expectedVersion)) || Number(expectedVersion) < 0) {
      throw pushError('invalid_expected_version', 'La version attendue doit être un entier positif ou zéro.');
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw pushError('invalid_payload', 'Le contenu de la fiche doit être un objet.');
    }
    var sb = await ready();
    var result = await sb.rpc('gp_upsert_app_record', {
      p_collection: collection,
      p_record_id: String(recordId),
      p_payload: payload,
      p_expected_version: Number(expectedVersion),
      p_deleted: false
    });
    if (result.error) throw normalizeRecordError(result.error);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  }

  async function deleteRecord(collection, recordId, expectedVersion) {
    validateRecordArgs(collection, recordId);
    if (!Number.isInteger(Number(expectedVersion)) || Number(expectedVersion) < 0) {
      throw pushError('invalid_expected_version', 'La version attendue doit être un entier positif ou zéro.');
    }
    var sb = await ready();
    var result = await sb.rpc('gp_upsert_app_record', {
      p_collection: collection,
      p_record_id: String(recordId),
      p_payload: null,
      p_expected_version: Number(expectedVersion),
      p_deleted: true
    });
    if (result.error) throw normalizeRecordError(result.error);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  }

  function recordSyncCapabilities() {
    return {
      available: !!state.client,
      activated: false,
      automatic: false,
      collections: RECORD_COLLECTIONS.slice(),
      note: 'API préparatoire : aucune écriture par fiche automatique n’est déclenchée.'
    };
  }

  // Les envois sont mis en file : deux sauvegardes rapprochées n'utilisent plus
  // la même version attendue (ce qui provoquait des rejets stale_data).
  function push(data, opts){
    var run = pushChain.then(function(){ return doPush(data, opts); });
    pushChain = run.catch(function(){});
    return run;
  }

  // Envoie les modifications locales en attente. Le marqueur « dirty » n'est effacé
  // que si aucune nouvelle modification n'est arrivée pendant l'envoi.
  var flushing = null;
  function flush(){
    if(flushing) return flushing;
    flushing = (async function(){
      if(!state.syncReady || !currentUid() || !window.GPDB) return false;
      var stamp = isDirty();
      if(!stamp) return true;
      await push(window.GPDB.load());
      if(isDirty() === stamp) { try { localStorage.removeItem('gp_data_dirty_at'); } catch(_) {} }
      try { localStorage.setItem('gp_last_cloud_sync_at', new Date().toISOString()); } catch(_) {}
      return true;
    })().finally(function(){ flushing = null; });
    return flushing;
  }

  function setReady(v){ state.syncReady = !!v; }
  function isReady(){ return !!state.syncReady; }
  function reset(){ state.syncReady = false; state.versionKnown = false; state.serverVersion = 1; state.cloudCount = 0; }

  function status(){
    return {configured:state.configured || valid(), available:available(), autosync:state.autosync, crudAutosync:state.autosync, user:currentUid(), ready:state.syncReady, dirty:!!isDirty(), cloudCount:state.cloudCount};
  }

  window.GPSupabase = {
    configure: configure,
    config: config,
    available: available,
    currentUid: currentUid,
    client: client,
    ready: ready,
    pull: pull,
    push: push,
    flush: flush,
    setReady: setReady,
    isReady: isReady,
    reset: reset,
    countRecords: countRecords,
    status: status,
    // API de phase 7 — appel explicite seulement, sans activation automatique.
    pullRecordCollection: pullRecordCollection,
    pullAllRecordCollections: pullAllRecordCollections,
    writeRecord: writeRecord,
    deleteRecord: deleteRecord,
    recordSyncCapabilities: recordSyncCapabilities,
    library: loadLibrary
  };

  // V30 — envoi automatique des modifications en attente (le marqueur « dirty » ne reste plus
  // en souffrance) + alerte si l'utilisateur ferme l'onglet avec des données non synchronisées.
  var flushTimer = null, resyncing = false;
  function scheduleFlush(delay){
    clearTimeout(flushTimer);
    flushTimer = setTimeout(function(){
      flush().catch(function(e){ console.warn('[GPSupabase] flush:', e && e.message || e); });
    }, delay || 1500);
  }
  window.addEventListener('gp:db:saved', function(){ scheduleFlush(2500); });
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') scheduleFlush(0); });
  setInterval(function(){
    if(!currentUid()) return;
    if(!state.syncReady) {
      // la réconciliation initiale n'a pas abouti (réseau…) : on la retente
      if(!resyncing && window.GPSupabaseAuth && window.GPSupabaseAuth.syncData) {
        resyncing = true;
        window.GPSupabaseAuth.syncData().catch(function(){}).finally(function(){ resyncing = false; });
      }
      return;
    }
    if(isDirty()) scheduleFlush(0);
  }, 20000);
  window.addEventListener('beforeunload', function(ev){
    if(currentUid() && isDirty()) {
      scheduleFlush(0);
      ev.preventDefault();
      ev.returnValue = 'Des modifications ne sont pas encore synchronisées.';
      return ev.returnValue;
    }
  });

  // Commence le chargement du SDK dès que possible, sans bloquer l’interface.
  if(valid()) ensureClient().catch(function(err){ console.warn('[GPSupabase] SDK non prêt:', err.message || err); });
})();
