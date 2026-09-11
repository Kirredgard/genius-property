/* ================================================================
   Genius Property V21 — Restauration page Paramètres
   Source : app.legacy.bundle.js (V48/V20)

   Ce fichier remplace le fallback générique de fallback-renderers.js
   par le vrai renderParametres avec logo, agence, thème, données.

   Installation :
     1. Copier ce fichier dans js/core/parametres-restore.js
     2. Dans index.html, ajouter AVANT la balise </body> :
        <script src="js/core/parametres-restore.js" defer></script>
   Note : ce script s'auto-enregistre via window.renderParametres
   et écrase le fallback minimal de fallback-renderers.js.
================================================================ */
(function () {
  'use strict';

  /* ── Renderer principal ── */
  function renderParametres() {
    var fields = {
      'geniusproperty_agence':  'cfg-agence',
      'geniusproperty_email':   'cfg-email',
      'geniusproperty_tel':     'cfg-tel',
      'geniusproperty_adresse': 'cfg-adresse',
      'geniusproperty_rccm':    'cfg-rccm',
      'geniusproperty_ninea':   'cfg-ninea'
    };
    Object.entries(fields).forEach(function (entry) {
      var key = entry[0], id = entry[1];
      var val = localStorage.getItem(key);
      var el  = document.getElementById(id);
      if (el && val) el.value = val;
    });

    var th = document.getElementById('cfg-theme');
    if (th) th.value = localStorage.getItem('geniusproperty_theme') || 'light';

    var savedLogo = localStorage.getItem('geniusproperty_logo');
    if (savedLogo) {
      var img = document.getElementById('cfg-logo-preview');
      var ph  = document.getElementById('cfg-logo-placeholder');
      if (img) { img.src = savedLogo; img.style.display = 'block'; }
      if (ph)  ph.style.display = 'none';
    }
  }

  /* ── Sauvegarde ── */
  function saveSettings() {
    var agence  = (document.getElementById('cfg-agence')  || {}).value  || 'Genius Property';
    var email   = (document.getElementById('cfg-email')   || {}).value  || '';
    var tel     = (document.getElementById('cfg-tel')     || {}).value  || '';
    var adresse = (document.getElementById('cfg-adresse') || {}).value  || '';
    var rccm    = (document.getElementById('cfg-rccm')    || {}).value  || '';
    var ninea   = (document.getElementById('cfg-ninea')   || {}).value  || '';
    localStorage.setItem('geniusproperty_agence',  agence);
    localStorage.setItem('geniusproperty_email',   email);
    localStorage.setItem('geniusproperty_tel',     tel);
    localStorage.setItem('geniusproperty_adresse', adresse);
    localStorage.setItem('geniusproperty_rccm',    rccm);
    localStorage.setItem('geniusproperty_ninea',   ninea);
    if (typeof window.toast === 'function') window.toast('Paramètres sauvegardés ✓');
  }

  /* ── Preview logo ── */
  function previewLogo(input) {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      if (typeof window.toast === 'function') window.toast('Logo trop volumineux (max 2 Mo)', 'err');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var data = e.target.result;
      var img  = document.getElementById('cfg-logo-preview');
      var ph   = document.getElementById('cfg-logo-placeholder');
      if (img) { img.src = data; img.style.display = 'block'; }
      if (ph)  ph.style.display = 'none';
      localStorage.setItem('geniusproperty_logo', data);
      if (typeof window.toast === 'function') window.toast('Logo chargé ✓');
    };
    reader.readAsDataURL(file);
  }

  /* ── Suppression logo ── */
  function removeLogo() {
    localStorage.removeItem('geniusproperty_logo');
    var img   = document.getElementById('cfg-logo-preview');
    var ph    = document.getElementById('cfg-logo-placeholder');
    var input = document.getElementById('cfg-logo-input');
    if (img)   { img.src = ''; img.style.display = 'none'; }
    if (ph)    ph.style.display = 'block';
    if (input) input.value = '';
    if (typeof window.toast === 'function') window.toast('Logo supprimé ✓');
  }

  /* ── Export données ── */
  function exportAllData() {
    var db   = window.DB || {};
    var json = JSON.stringify(db, null, 2);
    var a    = document.createElement('a');
    a.href     = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    a.download = 'genius_property_backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    if (typeof window.toast === 'function') window.toast('Backup exporté ✓');
  }

  /* ── Exposition globale ── */
  // On écrase le fallback minimal défini dans fallback-renderers.js
  window.renderParametres = renderParametres;
  window.saveSettings     = saveSettings;
  window.previewLogo      = previewLogo;
  window.removeLogo       = removeLogo;
  window.exportAllData    = exportAllData;

})();
