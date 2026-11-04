/* Genius Property — Paramètres d'agence synchronisés (v2)
 * Les paramètres d'entreprise appartiennent au payload de l'agence (DB.settings),
 * pas au localStorage de chaque navigateur. Le localStorage n'est conservé que
 * comme source de migration/compatibilité.
 */
(function () {
  'use strict';
  var LEGACY = {
    agence: 'geniusproperty_agence', email: 'geniusproperty_email',
    tel: 'geniusproperty_tel', adresse: 'geniusproperty_adresse',
    rccm: 'geniusproperty_rccm', ninea: 'geniusproperty_ninea',
    logo: 'geniusproperty_logo'
  };
  var FIELD_IDS = {
    agence: 'cfg-agence', email: 'cfg-email', tel: 'cfg-tel',
    adresse: 'cfg-adresse', rccm: 'cfg-rccm', ninea: 'cfg-ninea'
  };
  function dbLoad() {
    try { return window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}); }
    catch (_) { return window.DB || {}; }
  }
  function settingsOf(db) {
    db = db || dbLoad();
    if (!db.settings || typeof db.settings !== 'object' || Array.isArray(db.settings)) db.settings = {};
    if (!db.settings.company || typeof db.settings.company !== 'object') db.settings.company = {};
    return db.settings.company;
  }
  function migrateLegacy(db) {
    var s = settingsOf(db), changed = false;
    Object.keys(FIELD_IDS).forEach(function (key) {
      var legacy = null;
      try { legacy = localStorage.getItem(LEGACY[key]); } catch (_) {}
      if ((s[key] == null || s[key] === '') && legacy != null && legacy !== '') { s[key] = legacy; changed = true; }
    });
    var logo = null;
    try { logo = localStorage.getItem(LEGACY.logo); } catch (_) {}
    if (!s.logoDataUrl && logo) { s.logoDataUrl = logo; changed = true; }
    if (changed && window.GPDB && window.GPDB.save) window.GPDB.save(db, { silent: false });
    return s;
  }
  function persist(db) {
    if (!window.GPDB || typeof window.GPDB.save !== 'function') throw new Error('Le stockage central Genius Property n’est pas prêt.');
    var ok = window.GPDB.save(db, { silent: false });
    if (ok === false) throw new Error('La sauvegarde locale a été refusée. Rechargez la page avant de réessayer.');
    window.DB = db;
    return true;
  }
  function paintLogo(data) {
    var img = document.getElementById('cfg-logo-preview');
    var ph = document.getElementById('cfg-logo-placeholder');
    if (img) { img.src = data || ''; img.style.display = data ? 'block' : 'none'; }
    if (ph) ph.style.display = data ? 'none' : 'block';
  }
  function renderParametres() {
    var db = dbLoad();
    var s = migrateLegacy(db);
    Object.keys(FIELD_IDS).forEach(function (key) {
      var el = document.getElementById(FIELD_IDS[key]);
      if (el) el.value = s[key] == null ? '' : String(s[key]);
    });
    var th = document.getElementById('cfg-theme');
    if (th) th.value = localStorage.getItem('geniusproperty_theme') || 'light';
    paintLogo(s.logoDataUrl || '');
  }
  function saveSettings() {
    var db = dbLoad(), s = settingsOf(db);
    Object.keys(FIELD_IDS).forEach(function (key) {
      var el = document.getElementById(FIELD_IDS[key]);
      s[key] = el ? String(el.value || '').trim() : '';
    });
    s.updatedAt = new Date().toISOString();
    s.updatedBy = window.GPSupabase && window.GPSupabase.currentUid ? window.GPSupabase.currentUid() : null;
    try {
      persist(db);
      Object.keys(FIELD_IDS).forEach(function (key) { try { localStorage.setItem(LEGACY[key], s[key]); } catch (_) {} });
      if (window.toast) window.toast('Paramètres enregistrés. Synchronisation avec les autres appareils en cours…');
    } catch (e) { if (window.toast) window.toast(e.message || 'Enregistrement impossible.', 'err'); else alert(e.message); }
  }
  function previewLogo(input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) {
      if (window.toast) window.toast('Format de logo non pris en charge.', 'err'); return;
    }
    if (file.size > 2 * 1024 * 1024) { if (window.toast) window.toast('Logo trop volumineux (max 2 Mo)', 'err'); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      var db = dbLoad(), s = settingsOf(db);
      s.logoDataUrl = String(e.target.result || ''); s.logoName = file.name; s.updatedAt = new Date().toISOString();
      try {
        persist(db); paintLogo(s.logoDataUrl);
        try { localStorage.setItem(LEGACY.logo, s.logoDataUrl); } catch (_) {}
        if (window.toast) window.toast('Logo enregistré. Synchronisation en cours…');
      } catch (err) { if (window.toast) window.toast(err.message || 'Enregistrement du logo impossible.', 'err'); }
    };
    reader.onerror = function () { if (window.toast) window.toast('Lecture du logo impossible.', 'err'); };
    reader.readAsDataURL(file);
  }
  function removeLogo() {
    var db = dbLoad(), s = settingsOf(db);
    delete s.logoDataUrl; delete s.logoName; s.updatedAt = new Date().toISOString();
    try {
      persist(db); paintLogo('');
      try { localStorage.removeItem(LEGACY.logo); } catch (_) {}
      var input = document.getElementById('cfg-logo-input'); if (input) input.value = '';
      if (window.toast) window.toast('Logo supprimé de l’agence et synchronisation en cours…');
    } catch (e) { if (window.toast) window.toast(e.message || 'Suppression impossible.', 'err'); }
  }
  function exportAllData() {
    var db = dbLoad(), a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    a.download = 'genius_property_backup_' + new Date().toISOString().split('T')[0] + '.json'; a.click();
    if (window.toast) window.toast('Backup exporté ✓');
  }
  window.renderParametres = renderParametres;
  window.saveSettings = saveSettings;
  window.previewLogo = previewLogo;
  window.removeLogo = removeLogo;
  window.exportAllData = exportAllData;
})();
