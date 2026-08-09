/* Genius Property V31 — Page client Sauvegarde & synchronisation
   Page simple pour remplacer l'écran technique Stockage côté client.
   La page admin-stockage reste disponible pour l'administrateur/développeur. */
(function(){
  'use strict';

  var rootId = 'gp-sync-root';
  var AUTO_KEY = 'geniusproperty_client_autosave_enabled';

  function esc(v){
    if(window.GPRenderers && window.GPRenderers.esc) return window.GPRenderers.esc(v);
    return String(v == null ? '' : v).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }
  function el(id){ return document.getElementById(id); }
  function fmtDate(value){
    if(!value) return 'Jamais';
    try { return new Date(value).toLocaleString('fr-FR', { dateStyle:'medium', timeStyle:'short' }); }
    catch(e){ return String(value); }
  }
  function toast(msg, type){
    if(typeof window.showToast === 'function') return window.showToast(msg, type || 'info');
    alert(msg);
  }
  function storageStatus(){
    try { return window.GPStorage && window.GPStorage.status ? window.GPStorage.status() : {}; }
    catch(e){ return {}; }
  }
  function firebaseStatus(){
    try { return window.GPFirebase && window.GPFirebase.status ? window.GPFirebase.status() : {}; }
    catch(e){ return {}; }
  }
  function syncState(){
    var st = storageStatus();
    var ss = firebaseStatus();
    var meta = ss.meta || {};
    var cloudReady = !!(ss.configured && ss.sdkLoaded);
    var activeCloud = st.active === 'firebase' || !!ss.active;
    var autosave = localStorage.getItem(AUTO_KEY) !== '0';
    var last = meta.lastPushAt || meta.remoteUpdatedAt || localStorage.getItem('geniusproperty_last_backup_snapshot_date') || localStorage.getItem('geniusproperty_last_backup_date');
    var statusLabel = cloudReady ? (meta.lastError ? 'Attention requise' : 'Synchronisé') : 'Sauvegarde locale active';
    return { st:st, ss:ss, meta:meta, cloudReady:cloudReady, activeCloud:activeCloud, autosave:autosave, last:last, statusLabel:statusLabel };
  }
  function ensureStyle(){
    if(el('gp-sync-style')) return;
    var css = document.createElement('style');
    css.id = 'gp-sync-style';
    css.textContent = `
      .gp-sync-wrap{max-width:1040px;margin:0 auto;padding:4px 0 28px}
      .gp-sync-hero{background:linear-gradient(135deg,#111827,#1f2937);border-radius:24px;padding:24px;color:#fff;box-shadow:0 18px 40px rgba(15,23,42,.18);display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}
      .gp-sync-title{font-size:24px;font-weight:900;margin:0 0 8px;display:flex;gap:10px;align-items:center}.gp-sync-desc{margin:0;color:#d1d5db;font-size:13px;line-height:1.6;max-width:670px}
      .gp-sync-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800;background:rgba(255,255,255,.12);color:#fff;white-space:nowrap}.gp-sync-badge.ok{background:#dcfce7;color:#166534}.gp-sync-badge.warn{background:#fef3c7;color:#92400e}.gp-sync-badge.bad{background:#fee2e2;color:#991b1b}
      .gp-sync-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:16px}.gp-sync-card{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:17px;box-shadow:0 10px 26px rgba(15,23,42,.06)}
      .gp-sync-card.full{grid-column:1/-1}.gp-sync-card h3{margin:0 0 10px;font-size:15px;color:#111827;display:flex;align-items:center;gap:8px}.gp-sync-muted{font-size:12px;color:#6b7280;line-height:1.6;margin:0 0 12px}
      .gp-sync-kpi b{display:block;font-size:20px;color:#111827;margin-bottom:4px}.gp-sync-kpi span{font-size:12px;color:#6b7280}.gp-sync-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .gp-sync-btn{border:none;border-radius:13px;padding:11px 14px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;gap:7px;align-items:center;background:#f3f4f6;color:#374151}.gp-sync-btn.primary{background:#111827;color:#fff}.gp-sync-btn.gold{background:#b88a2b;color:#fff}.gp-sync-btn.success{background:#dcfce7;color:#166534}.gp-sync-btn:disabled{opacity:.55;cursor:not-allowed}
      .gp-sync-list{display:grid;gap:9px;margin-top:8px}.gp-sync-row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #f1f5f9;padding:8px 0;font-size:13px}.gp-sync-row span{color:#6b7280}.gp-sync-row b{color:#111827;text-align:right}.gp-sync-switch{display:flex;align-items:center;gap:10px;font-size:13px;color:#374151}.gp-sync-switch input{width:18px;height:18px}
      @media(max-width:820px){.gp-sync-grid{grid-template-columns:1fr}.gp-sync-hero{border-radius:18px}.gp-sync-row{flex-direction:column}.gp-sync-row b{text-align:left}}
    `;
    document.head.appendChild(css);
  }

  function render(){
    var root = el(rootId);
    if(!root) return;
    ensureStyle();
    var s = syncState();
    var statusClass = s.cloudReady && !s.meta.lastError ? 'ok' : (s.meta.lastError ? 'bad' : 'warn');
    root.innerHTML = `
      <div class="gp-sync-wrap">
        <section class="gp-sync-hero">
          <div>
            <h2 class="gp-sync-title"><span class="material-symbols-rounded">cloud_done</span> Sauvegarde & synchronisation</h2>
            <p class="gp-sync-desc">Vos données sont sauvegardées automatiquement. Cette page remplace l'ancien écran technique de stockage pour offrir une expérience plus claire aux clients.</p>
          </div>
          <span class="gp-sync-badge ${statusClass}"><span class="material-symbols-rounded">${s.meta.lastError ? 'error' : (s.cloudReady ? 'check_circle' : 'save')}</span>${esc(s.statusLabel)}</span>
        </section>

        <div class="gp-sync-grid">
          <div class="gp-sync-card gp-sync-kpi"><b>${esc(s.cloudReady ? 'Cloud sécurisé' : 'Local sécurisé')}</b><span>Mode de sauvegarde</span></div>
          <div class="gp-sync-card gp-sync-kpi"><b>${esc(fmtDate(s.last))}</b><span>Dernière sauvegarde</span></div>
          <div class="gp-sync-card gp-sync-kpi"><b>${esc(s.autosave ? 'Activée' : 'Désactivée')}</b><span>Sauvegarde automatique</span></div>

          <div class="gp-sync-card full">
            <h3><span class="material-symbols-rounded">sync</span> Actions rapides</h3>
            <p class="gp-sync-muted">Le client peut synchroniser ou exporter ses données sans voir les détails techniques Firebase/localStorage.</p>
            <label class="gp-sync-switch"><input type="checkbox" id="gp-sync-autosave" ${s.autosave ? 'checked' : ''} onchange="GPSyncPage.toggleAutoSave(this.checked)"> Activer la sauvegarde automatique</label>
            <div class="gp-sync-actions">
              <button class="gp-sync-btn primary" onclick="GPSyncPage.syncNow()"><span class="material-symbols-rounded">sync</span> Synchroniser maintenant</button>
              <button class="gp-sync-btn success" onclick="GPSyncPage.exportData()"><span class="material-symbols-rounded">download</span> Exporter mes données</button>
              <button class="gp-sync-btn" onclick="GPSyncPage.localSnapshot()"><span class="material-symbols-rounded">backup</span> Créer une sauvegarde locale</button>
            </div>
          </div>

          <div class="gp-sync-card full">
            <h3><span class="material-symbols-rounded">verified_user</span> État du service</h3>
            <div class="gp-sync-list">
              <div class="gp-sync-row"><span>Cloud Firebase</span><b>${esc(s.cloudReady ? 'Configuré' : 'Non configuré côté admin')}</b></div>
              <div class="gp-sync-row"><span>Synchronisation automatique cloud</span><b>${esc(s.ss.autosync ? 'Activée' : 'Désactivée')}</b></div>
              <div class="gp-sync-row"><span>Sauvegardes locales disponibles</span><b>${esc((s.st.backups || 0) + ' sauvegarde(s)')}</b></div>
              <div class="gp-sync-row"><span>Dernière erreur</span><b>${esc(s.meta.lastError || 'Aucune')}</b></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function toggleAutoSave(checked){
    localStorage.setItem(AUTO_KEY, checked ? '1' : '0');
    try {
      if(window.GPFirebase){
        var cfg = window.GPFirebase.config ? window.GPFirebase.config() : {};
        window.GPFirebase.configure(Object.assign({}, cfg, { autosync: !!checked }));
      }
    } catch(e){}
    toast(checked ? 'Sauvegarde automatique activée' : 'Sauvegarde automatique désactivée', 'ok');
    render();
  }

  async function syncNow(){
    try {
      if(window.GPStorage && window.GPStorage.snapshot) window.GPStorage.snapshot(null, 'client-sync');
      if(window.GPFirebase && window.GPFirebase.available && window.GPFirebase.available()){
        await window.GPFirebase.push();
        toast('Synchronisation cloud terminée', 'ok');
      } else {
        toast('Sauvegarde locale créée. Le cloud sera actif après configuration admin.', 'ok');
      }
    } catch(e){ toast('Synchronisation impossible : ' + (e.message || e), 'error'); }
    render();
  }

  function exportData(){
    try { if(window.GPStorage && window.GPStorage.exportFile) window.GPStorage.exportFile(null, 'mes-donnees-genius-property.json'); }
    catch(e){ toast('Export impossible : ' + (e.message || e), 'error'); }
  }

  function localSnapshot(){
    try { if(window.GPStorage && window.GPStorage.snapshot) window.GPStorage.snapshot(null, 'client-manual'); toast('Sauvegarde locale créée', 'ok'); }
    catch(e){ toast('Sauvegarde impossible : ' + (e.message || e), 'error'); }
    render();
  }

  window.GPSyncPage = { render:render, syncNow:syncNow, exportData:exportData, localSnapshot:localSnapshot, toggleAutoSave:toggleAutoSave };
  document.addEventListener('DOMContentLoaded', function(){
    if(window.GPNavigation && window.GPNavigation.registerRenderer) window.GPNavigation.registerRenderer('sync', render);
  });
})();
