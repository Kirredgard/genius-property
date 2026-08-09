/* Genius Property V26 — Administration / Stockage
   Écran de configuration localStorage / Firebase, sans activation cloud par défaut. */
(function(){
  'use strict';

  var rootId = 'gp-admin-stockage-root';

  function esc(v){
    if(window.GPRenderers && window.GPRenderers.esc) return window.GPRenderers.esc(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]); });
  }

  function toast(msg, type){
    if(typeof window.toast === 'function') window.toast(msg, type || 'ok');
    else console.log('[Admin stockage]', msg);
  }

  function fmtBytes(n){
    n = Number(n || 0);
    if(n < 1024) return n + ' o';
    if(n < 1024 * 1024) return (n/1024).toFixed(1) + ' Ko';
    return (n/1024/1024).toFixed(2) + ' Mo';
  }

  function getEl(id){ return document.getElementById(id); }
  function val(id){ var el = getEl(id); return el ? el.value.trim() : ''; }
  function checked(id){ var el = getEl(id); return !!(el && el.checked); }

  function storageStatus(){
    try { return window.GPStorage && window.GPStorage.status ? window.GPStorage.status() : {}; }
    catch(e){ return { error: e.message || String(e) }; }
  }

  function firebaseStatus(){
    try { return window.GPFirebase && window.GPFirebase.status ? window.GPFirebase.status() : {}; }
    catch(e){ return { error: e.message || String(e) }; }
  }

  function firebaseConfig(){
    try { return window.GPFirebase && window.GPFirebase.config ? window.GPFirebase.config() : {}; }
    catch(e){ return {}; }
  }

  function ensureStyle(){
    if(getEl('gp-admin-stockage-style')) return;
    var css = document.createElement('style');
    css.id = 'gp-admin-stockage-style';
    css.textContent = `
      .gp-storage-wrap{max-width:1100px;margin:0 auto;padding:4px 0 24px}
      .gp-storage-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;flex-wrap:wrap}
      .gp-storage-title{font-size:22px;font-weight:800;color:#111827;margin:0;display:flex;align-items:center;gap:8px}
      .gp-storage-desc{font-size:13px;color:#6b7280;line-height:1.6;margin:6px 0 0;max-width:720px}
      .gp-storage-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .gp-storage-card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:16px;box-shadow:0 8px 22px rgba(15,23,42,.05)}
      .gp-storage-card.full{grid-column:1/-1}
      .gp-storage-card h3{margin:0 0 10px;font-size:15px;color:#111827;display:flex;align-items:center;gap:8px}
      .gp-storage-muted{font-size:12px;color:#6b7280;line-height:1.55;margin:4px 0 12px}
      .gp-storage-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
      .gp-storage-kpi{background:#f9fafb;border:1px solid #eef2f7;border-radius:14px;padding:12px}
      .gp-storage-kpi b{display:block;font-size:15px;color:#111827;margin-bottom:3px;word-break:break-word}
      .gp-storage-kpi span{font-size:11px;color:#6b7280}
      .gp-storage-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .gp-storage-field{display:flex;flex-direction:column;gap:5px}
      .gp-storage-field.full{grid-column:1/-1}
      .gp-storage-field label{font-size:12px;font-weight:700;color:#374151}
      .gp-storage-field input,.gp-storage-field select{border:1px solid #d1d5db;border-radius:12px;padding:10px 11px;font-size:13px;outline:none;background:#fff}
      .gp-storage-field input:focus,.gp-storage-field select:focus{border-color:#b88a2b;box-shadow:0 0 0 3px rgba(184,138,43,.12)}
      .gp-storage-check{display:flex;gap:8px;align-items:center;font-size:13px;color:#374151;margin-top:2px}
      .gp-storage-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .gp-storage-btn{border:none;border-radius:12px;padding:10px 13px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;gap:6px;align-items:center;background:#f3f4f6;color:#374151}
      .gp-storage-btn.primary{background:#111827;color:white}
      .gp-storage-btn.gold{background:#b88a2b;color:white}
      .gp-storage-btn.danger{background:#fee2e2;color:#991b1b}
      .gp-storage-btn.success{background:#dcfce7;color:#166534}
      .gp-storage-status{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0f172a;color:#e5e7eb;border-radius:14px;padding:12px;font-size:11px;line-height:1.55;overflow:auto;max-height:240px}
      .gp-storage-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800;background:#f3f4f6;color:#374151}
      .gp-storage-badge.ok{background:#dcfce7;color:#166534}.gp-storage-badge.warn{background:#fef3c7;color:#92400e}.gp-storage-badge.bad{background:#fee2e2;color:#991b1b}
      .gp-storage-table{width:100%;border-collapse:collapse;font-size:12px}.gp-storage-table th,.gp-storage-table td{padding:9px;border-bottom:1px solid #f1f5f9;text-align:left}.gp-storage-table th{color:#6b7280;font-weight:800;background:#f9fafb}
      @media(max-width:760px){.gp-storage-grid,.gp-storage-form{grid-template-columns:1fr}.gp-storage-kpis{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(css);
  }

  function backupRows(){
    var list = (window.GPStorage && window.GPStorage.listBackups) ? window.GPStorage.listBackups() : [];
    if(!list.length) return '<tr><td colspan="4" style="color:#9ca3af;text-align:center;padding:16px">Aucune sauvegarde locale trouvée.</td></tr>';
    return list.slice(0,8).map(function(b){
      return '<tr><td>'+esc(b.date || '—')+'</td><td>'+esc(b.label || '—')+'</td><td>'+esc(fmtBytes(b.bytes))+'</td><td><code>'+esc(b.key)+'</code></td></tr>';
    }).join('');
  }

  function render(){
    if(window.GPAuth && !window.GPAuth.requireAdmin('admin-stockage')) return;
    ensureStyle();
    var mount = getEl(rootId);
    if(!mount) return;
    var st = storageStatus();
    var ss = firebaseStatus();
    var cfg = firebaseConfig();
    var active = st.active || 'localStorage';
    var firebaseReady = !!ss.available;
    mount.innerHTML = `
      <div class="gp-storage-wrap">
        <div class="gp-storage-head">
          <div>
            <h2 class="gp-storage-title"><span class="material-symbols-rounded">database</span> Administration du stockage</h2>
            <p class="gp-storage-desc">Pilote le stockage de l'application. Le mode local reste actif par défaut. Firebase peut être configuré et testé ici avant activation.</p>
          </div>
          <span class="gp-storage-badge ${active === 'firebase' ? 'ok' : 'warn'}">Mode actif : ${esc(active)}</span>
        </div>

        <div class="gp-storage-kpis">
          <div class="gp-storage-kpi"><b>${esc(active)}</b><span>Adapter actif</span></div>
          <div class="gp-storage-kpi"><b>${esc(fmtBytes(st.bytes || 0))}</b><span>Taille données</span></div>
          <div class="gp-storage-kpi"><b>${esc(st.backups || 0)}</b><span>Sauvegardes locales</span></div>
          <div class="gp-storage-kpi"><b>${firebaseReady ? 'Prêt' : 'Non prêt'}</b><span>Firebase</span></div>
        </div>

        <div class="gp-storage-grid">
          <div class="gp-storage-card">
            <h3><span class="material-symbols-rounded">save</span> Stockage local</h3>
            <p class="gp-storage-muted">Mode actuel le plus sûr hors connexion. Les données restent dans le navigateur, avec export et snapshots.</p>
            <div class="gp-storage-actions">
              <button class="gp-storage-btn primary" onclick="GPAdminStockage.useLocal()"><span class="material-symbols-rounded">check_circle</span> Utiliser localStorage</button>
              <button class="gp-storage-btn" onclick="GPAdminStockage.backup()"><span class="material-symbols-rounded">backup</span> Snapshot</button>
              <button class="gp-storage-btn success" onclick="GPAdminStockage.exportJson()"><span class="material-symbols-rounded">download</span> Export JSON</button>
            </div>
          </div>

          <div class="gp-storage-card">
            <h3><span class="material-symbols-rounded">cloud_sync</span> Firebase</h3>
            <p class="gp-storage-muted">Configuration cloud. L'activation n'est pas automatique : teste d'abord la connexion, puis pousse ou récupère les données.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <span class="gp-storage-badge ${ss.configured ? 'ok' : 'warn'}">Config : ${ss.configured ? 'OK' : 'manquante'}</span>
              <span class="gp-storage-badge ${ss.sdkLoaded ? 'ok' : 'bad'}">SDK : ${ss.sdkLoaded ? 'chargé' : 'absent'}</span>
              <span class="gp-storage-badge ${ss.autosync ? 'ok' : 'warn'}">Autosync : ${ss.autosync ? 'ON' : 'OFF'}</span>
            </div>
            <div class="gp-storage-actions">
              <button class="gp-storage-btn" onclick="GPAdminStockage.testFirebase()"><span class="material-symbols-rounded">network_check</span> Tester</button>
              <button class="gp-storage-btn gold" onclick="GPAdminStockage.pushFirebase()"><span class="material-symbols-rounded">cloud_upload</span> Envoyer vers Firebase</button>
              <button class="gp-storage-btn" onclick="GPAdminStockage.pullFirebase()"><span class="material-symbols-rounded">cloud_download</span> Récupérer</button>
              <button class="gp-storage-btn success" onclick="GPAdminStockage.useFirebase()"><span class="material-symbols-rounded">toggle_on</span> Activer Firebase</button>
            </div>
          </div>

          <div class="gp-storage-card full">
            <h3><span class="material-symbols-rounded">settings</span> Configuration Firebase</h3>
            <div class="gp-storage-form">
              <div class="gp-storage-field"><label>Workspace ID</label><input id="gp-fire-workspace" value="${esc(cfg.workspaceId || 'auto')}"></div>
              <div class="gp-storage-field full"><label class="gp-storage-check"><input type="checkbox" id="gp-fire-autosync" ${cfg.autosync ? 'checked' : ''}> Activer l'autosynchronisation après chaque sauvegarde</label></div>
            </div>
            <div class="gp-storage-actions">
              <button class="gp-storage-btn primary" onclick="GPAdminStockage.saveFirebaseConfig()"><span class="material-symbols-rounded">save</span> Enregistrer la configuration</button>
              <button class="gp-storage-btn" onclick="GPAdminStockage.showSql()"><span class="material-symbols-rounded">code</span> Règles Firestore</button>
            </div>
          </div>

          <div class="gp-storage-card full">
            <h3><span class="material-symbols-rounded">history</span> Sauvegardes récentes</h3>
            <div style="overflow:auto"><table class="gp-storage-table"><thead><tr><th>Date</th><th>Label</th><th>Taille</th><th>Clé</th></tr></thead><tbody>${backupRows()}</tbody></table></div>
          </div>

          <div class="gp-storage-card full">
            <h3><span class="material-symbols-rounded">terminal</span> Diagnostic</h3>
            <pre class="gp-storage-status" id="gp-storage-diagnostic">${esc(JSON.stringify({ storage: st, firebase: ss }, null, 2))}</pre>
            <div class="gp-storage-actions"><button class="gp-storage-btn" onclick="GPAdminStockage.render()"><span class="material-symbols-rounded">refresh</span> Rafraîchir</button></div>
          </div>
        </div>
      </div>`;
  }

  function saveFirebaseConfig(){
    if(!window.GPFirebase || !window.GPFirebase.configure) return toast('Adapter Firebase indisponible', 'err');
    window.GPFirebase.configure({
      workspaceId: val('gp-fire-workspace') || 'auto',
      autosync: checked('gp-fire-autosync')
    });
    toast('Configuration Firebase enregistrée', 'ok');
    render();
  }

  function useLocal(){
    try { window.GPStorage.use('localStorage'); toast('Stockage local activé', 'ok'); render(); }
    catch(e){ toast(e.message || String(e), 'err'); }
  }

  function useFirebase(){
    try { window.GPStorage.use('firebase'); toast('Firebase activé comme adapter de stockage', 'ok'); render(); }
    catch(e){ toast(e.message || String(e), 'err'); }
  }

  async function testFirebase(){
    try { saveFirebaseConfig(); var res = await window.GPFirebase.test(); toast('Connexion Firebase OK', 'ok'); render(); return res; }
    catch(e){ toast('Test Firebase échoué : ' + (e.message || String(e)), 'err'); render(); }
  }

  async function pushFirebase(){
    try { saveFirebaseConfig(); if(window.GPStorage) window.GPStorage.snapshot(null, 'avant-push-firebase'); await window.GPFirebase.push(); toast('Données envoyées vers Firebase', 'ok'); render(); }
    catch(e){ toast('Push Firebase échoué : ' + (e.message || String(e)), 'err'); render(); }
  }

  async function pullFirebase(){
    try {
      saveFirebaseConfig();
      if(window.GPStorage) window.GPStorage.snapshot(null, 'avant-pull-firebase');
      await window.GPFirebase.pull({ applyToLocal: true });
      if(window.GPDB && window.GPDB.load) window.GPDB.load();
      toast('Données récupérées depuis Firebase', 'ok');
      render();
    } catch(e){ toast('Pull Firebase échoué : ' + (e.message || String(e)), 'err'); render(); }
  }

  function backup(){
    if(window.GPStorage && window.GPStorage.snapshot){ window.GPStorage.snapshot(null, 'admin-manual'); toast('Snapshot créé', 'ok'); render(); }
  }

  function exportJson(){
    if(window.GPStorage && window.GPStorage.exportFile){ window.GPStorage.exportFile(null, 'genius-property-export-' + new Date().toISOString().slice(0,10) + '.json'); toast('Export JSON lancé', 'ok'); }
  }

  function showSql(){
    var sql = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    match /gp_databases/{workspaceId} {
      allow create: if signedIn() && workspaceId == request.auth.uid && request.resource.data.ownerUid == request.auth.uid;
      allow read, update, delete: if signedIn() && workspaceId == request.auth.uid && resource.data.ownerUid == request.auth.uid;
    }
  }
}`;
    if(window.GPForms && window.GPForms.confirm){
      window.GPForms.confirm({ title:'Règles Firestore', message:'Copie ces règles dans Firebase Console > Firestore Database > Rules :\n\n' + sql, okText:'OK', cancelText:'Fermer' });
    } else {
      alert(sql);
    }
  }

  window.GPAdminStockage = {
    render: render,
    saveFirebaseConfig: saveFirebaseConfig,
    useLocal: useLocal,
    useFirebase: useFirebase,
    testFirebase: testFirebase,
    pushFirebase: pushFirebase,
    pullFirebase: pullFirebase,
    backup: backup,
    exportJson: exportJson,
    showSql: showSql
  };

  if(window.GPNavigation && window.GPNavigation.registerRenderer){
    window.GPNavigation.registerRenderer('admin-stockage', render);
  }
})();
