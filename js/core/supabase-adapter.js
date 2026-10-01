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
    autosync: false,
    table: 'gp_app_data',
    rowId: 'main',
    serverVersion: 1
  };

  function readConfig(){
    var env = window.GPV22_ENV || {};
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('gp_supabase_config') || '{}') || {}; } catch(_) {}
    state.url = String(saved.url || env.supabaseUrl || '').trim().replace(/\/+$/, '');
    state.publishableKey = String(saved.publishableKey || env.supabasePublishableKey || '').trim();
    state.configured = !!(state.url && state.publishableKey);
  }
  readConfig();

  function valid(){
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(state.url) && /^sb_publishable_/i.test(state.publishableKey);
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
    if(!/^sb_publishable_/i.test(key)) throw new Error('Utilise la Publishable key qui commence par sb_publishable_.');
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
    var data = row && row.payload ? row.payload : null;
    if(options.applyToLocal && data && window.GPDB && typeof window.GPDB.save === 'function') {
      window.GPDB.save(data, {silent:true, skipCloud:true});
    }
    return data;
  }

  async function push(data){
    var sb = await ready();
    var payload = data || window.DB || {};
    var expected = Number(state.serverVersion || 1);
    var result = await sb.rpc('gp_update_app_data', {p_payload: payload, p_expected_version: expected});
    if(result.error) {
      if(/stale_data/i.test(result.error.message || '')) {
        state.serverVersion = null;
        try { await pull({applyToLocal:false}); } catch(_) {}
        throw new Error('Les données ont changé sur un autre poste. Rechargez les données avant de réessayer.');
      }
      throw result.error;
    }
    var row = Array.isArray(result.data) ? result.data[0] : result.data;
    state.serverVersion = Number(row && row.version || expected + 1);
    return row;
  }

  function status(){
    return {configured:state.configured || valid(), available:available(), autosync:state.autosync, crudAutosync:state.autosync, user:currentUid()};
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
    status: status,
    library: loadLibrary
  };

  // Commence le chargement du SDK dès que possible, sans bloquer l’interface.
  if(valid()) ensureClient().catch(function(err){ console.warn('[GPSupabase] SDK non prêt:', err.message || err); });
})();
