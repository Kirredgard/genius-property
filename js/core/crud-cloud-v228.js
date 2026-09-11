/* Genius Property V22.8 — CRUD cloud guard */
(function(){
  'use strict';
  function db(){ return window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}); }
  async function syncNow(){
    if(!window.GPSupabase || !GPSupabase.available || !GPSupabase.available()) throw new Error('Supabase indisponible ou non configuré.');
    if(!GPSupabase.currentUid || !GPSupabase.currentUid()) throw new Error('Utilisateur non connecté.');
    if(window.GPDB&&GPDB.save) { await GPSupabase.push(GPDB.load()); } else { await GPSupabase.push(db()); }
    try{ if(window.toast) window.toast('Données synchronisées vers Supabase ✓','ok'); }catch(e){}
    return true;
  }
  window.GPCloudCRUD = { syncNow: syncNow };
  window.gpCloudCrudStatus = function(){
    var s=window.GPSupabase && GPSupabase.status ? GPSupabase.status() : {};
    return {configured:!!s.configured,available:!!s.available,autosync:!!s.autosync,crudAutosync:s.crudAutosync!==false,user:GPSupabase&&GPSupabase.currentUid?GPSupabase.currentUid():null};
  };
})();
