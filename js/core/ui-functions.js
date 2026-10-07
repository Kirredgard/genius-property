/* ================================================================
   Genius Property — UI Functions Fix
   Fournit les fonctions globales manquantes après la migration
   vers legacy-safe-bootstrap.js (remplacement de app.legacy.bundle.js).

   À placer dans : js/core/ui-functions.js
   À charger dans index.html AVANT navigation.js :
     <script src="js/core/ui-functions.js" defer></script>
================================================================ */
(function () {
  'use strict';

  /* ── Utilitaires ─────────────────────────────────────────── */

  function safeJSONParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function safeSetLocal(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function v(id) {
    var e = document.getElementById(id);
    return e ? e.value : '';
  }
  function genId(p) {
    var prefix = String(p || 'ID').toUpperCase();
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /* ── Thème jour/nuit ─────────────────────────────────────── */

  function toggleTheme() {
    document.body.classList.toggle('dark');
    var d = document.body.classList.contains('dark');
    var icon = document.querySelector('#themeIcon .material-symbols-rounded');
    if (icon) icon.textContent = d ? 'light_mode' : 'dark_mode';
    var cfg = document.getElementById('cfg-theme');
    if (cfg) cfg.value = d ? 'dark' : 'light';
    localStorage.setItem('geniusproperty_theme', d ? 'dark' : 'light');
  }

  /* ── Recherche topbar ────────────────────────────────────── */

  window.toggleTopbarSearch = window.toggleTopbarSearch || function (e) {
    if (e) e.stopPropagation();
    var drop = document.getElementById('topbarSearchDrop');
    if (!drop) return;
    var isOpen = drop.classList.contains('open');
    closeAllPanels();
    drop.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
      drop.classList.add('open');
      var inp = drop.querySelector('input');
      if (inp) setTimeout(function () { inp.focus(); }, 50);
    }
  };

  /* ── Recherche topbar ───────────────────────────────────── */

  function closeTopbarSearch() {
    var drop = document.getElementById('topbarSearchDrop');
    if (drop) { drop.classList.remove('open'); drop.style.display = 'none'; }
    var inp = document.getElementById('topbarSearchInput');
    if (inp) inp.value = '';
    var out = document.getElementById('topbarSearchResults');
    if (out) out.innerHTML = '<div style="padding:16px;text-align:center;font-size:12px;color:#9ca3af">Tapez pour rechercher…</div>';
  }

  function runTopbarSearch(query) {
    var out = document.getElementById('topbarSearchResults');
    if (!out) return;
    var q = String(query || '').trim().toLowerCase();
    if (!q) {
      out.innerHTML = '<div style="padding:16px;text-align:center;font-size:12px;color:#9ca3af">Tapez pour rechercher…</div>';
      return;
    }
    var d = window.GPDB && typeof window.GPDB.load === 'function' ? (window.GPDB.load() || {}) : (window.DB || {});
    var groups = [
      ['Propriétaires','proprietaires','proprietaires',function(x){return [x.prenom,x.nom,x.email,x.tel,x.adresse].join(' ')}],
      ['Locataires','locataires','locataires',function(x){return [x.prenom,x.nom,x.email,x.tel,x.adresse].join(' ')}],
      ['Biens','biens','biens',function(x){return [x.nom,x.adresse,x.proprio,x.proprietaire].join(' ')}],
      ['Locations','locatives','locatives',function(x){return [x.nom,x.bien,x.locataire,x.occupant,x.uniteNom].join(' ')}]
    ];
    var hits=[];
    groups.forEach(function(g){
      (Array.isArray(d[g[1]])?d[g[1]]:[]).forEach(function(x,i){
        if (String(g[3](x)||'').toLowerCase().indexOf(q)!==-1) hits.push({label:g[0],page:g[2],idx:i,text:(x.nom||[x.prenom,x.nom].filter(Boolean).join(' ')||x.bien||x.email||'Résultat')});
      });
    });
    if(!hits.length){out.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:#9ca3af">Aucun résultat</div>';return;}
    out.innerHTML=hits.slice(0,12).map(function(h){return '<button type="button" style="display:flex;width:100%;align-items:center;gap:8px;border:0;background:#fff;padding:9px 12px;text-align:left;cursor:pointer" onclick="closeTopbarSearch();if(window.navigate)navigate(\''+h.page+'\');setTimeout(function(){if(window.openProprietaireDetail&&\''+h.page+'\'===\'proprietaires\')openProprietaireDetail('+h.idx+');else if(window.viewRow&&\''+h.page+'\'===\'locataires\')viewRow(\'locataires\','+h.idx+');else if(window.openBienDetail&&\''+h.page+'\'===\'biens\')openBienDetail('+h.idx+');},120)"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><span><b style="display:block;font-size:12px;color:#111">'+String(h.text).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})+'</b><small style="color:#9ca3af">'+h.label+'</small></span></button>';}).join('');
  }

  /* ── Panneaux (notifs / aide) ────────────────────────────── */

  function closeAllPanels() {
    document.querySelectorAll('.tb-panel').forEach(function (p) {
      p.classList.remove('open');
    });
  }

  function toggleNotifPanel(e) {
    if (e) e.stopPropagation();
    var p = document.getElementById('notifPanel');
    if (!p) return;
    var isOpen = p.classList.contains('open');
    closeAllPanels();
    if (!isOpen) {
      if (typeof window.renderNotifPanel === 'function') window.renderNotifPanel();
      p.classList.add('open');
    }
  }

  function closeNotifPanel() {
    var p = document.getElementById('notifPanel');
    if (p) p.classList.remove('open');
  }

  function toggleHelpPanel(e) {
    if (e) e.stopPropagation();
    var p = document.getElementById('helpPanel');
    if (!p) return;
    var isOpen = p.classList.contains('open');
    closeAllPanels();
    if (!isOpen) p.classList.add('open');
  }

  function closeHelpPanel() {
    var p = document.getElementById('helpPanel');
    if (p) p.classList.remove('open');
  }

  function renderNotifPanel() {
    var list = document.getElementById('notifList');
    if (!list) return;
    var d = window.GPDB && typeof window.GPDB.load === 'function' ? (window.GPDB.load() || {}) : (window.DB || {});
    var rows = [];
    if (typeof window.getPaiementEcheances === 'function') {
      try { rows = window.getPaiementEcheances().filter(function(x){return x.cat==='retard';}).slice(0,8); } catch(e) {}
    }
    if (!rows.length) {
      list.innerHTML='<div class="notif-empty"><span class="material-symbols-rounded">notifications_off</span>Aucune notification</div>';
      return;
    }
    list.innerHTML=rows.map(function(r){
      var label=r.locataire||r.tenant||r.bien||'Échéance';
      var amount=r.reste||r.impaye||r.solde||r.montant||'';
      return '<div style="padding:9px 12px;border-bottom:1px solid #f3f4f6;cursor:pointer" onclick="closeNotifPanel();if(window.navigate)navigate(\'paiements\')"><b style="font-size:11px;display:block">Paiement en retard</b><small style="color:#64748b">'+String(label).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})+'</small><strong style="display:block;color:#b91c1c;font-size:11px">'+String(amount)+'</strong></div>';
    }).join('');
  }

  function markAllRead() {
    var dot=document.getElementById('notifDot'), count=document.getElementById('notifCount');
    if(dot) dot.style.display='none';
    if(count) count.style.display='none';
  }

  function switchHelpTab(tab, btn) {
    document.querySelectorAll('#helpPanel .help-section').forEach(function(x){x.classList.toggle('active',x.id==='help-'+tab);});
    document.querySelectorAll('#helpPanel .help-tab').forEach(function(x){x.classList.remove('active');});
    if(btn) btn.classList.add('active');
  }

  function toggleFaq(el) {
    if(!el) return;
    el.classList.toggle('open');
    var body=el.querySelector('.help-faq-answer');
    if(body) body.style.display=el.classList.contains('open')?'block':'none';
  }


  // Fermer les panneaux au clic extérieur
  document.addEventListener('click', function (e) {
    if (
      !e.target.closest('.tb-panel') &&
      !e.target.closest('#notifBtn') &&
      !e.target.closest('#helpBtn') &&
      !e.target.closest('[onclick*="toggleTopbarSearch"]') &&
      !e.target.closest('#topbarSearchDrop')
    ) {
      closeAllPanels();
    }
  });

  /* ── Aperçu photo ────────────────────────────────────────── */

  function previewPhoto(input, previewId, iconId, labelId) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = document.getElementById(previewId);
      var icon = document.getElementById(iconId);
      var lbl = document.getElementById(labelId);
      if (img) { img.src = e.target.result; img.style.display = 'block'; }
      if (icon) icon.style.display = 'none';
      if (lbl) lbl.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function getPhotoData(inputId) {
    if (window.GPMedia && typeof window.GPMedia.readImage === 'function') {
      return window.GPMedia.readImage(inputId).catch(function(err){
        if(window.toast) window.toast(err && err.message ? err.message : 'Impossible de lire la photo.', 'err');
        return '';
      });
    }
    var input = document.getElementById(inputId);
    if (!input || !input.files[0]) return Promise.resolve(null);
    return new Promise(function (res) {
      var r = new FileReader();
      r.onload = function (e) { res(e.target.result); };
      r.onerror = function(){res('');};
      r.readAsDataURL(input.files[0]);
    });
  }

  /* ── Reset formulaire employé ────────────────────────────── */

  function clearEmployePhoto() {
    var input = document.getElementById('e-photo-input');
    if (input) input.value = '';
    var preview = document.getElementById('e-photo-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    var icon = document.getElementById('e-photo-icon');
    if (icon) icon.style.display = '';
    var label = document.getElementById('e-photo-label');
    if (label) label.style.display = '';
  }

  function resetEmployeForm() {
    if (typeof window.openNouvelEmployeDrawer === 'function') { window.openNouvelEmployeDrawer(); return; }
    ['e-civ', 'e-nom', 'e-prenom', 'e-naiss', 'e-fonction', 'e-adresse', 'e-tel',
      'e-piece', 'e-numpiece', 'e-lieu', 'e-deldeb', 'e-delexp', 'e-matri',
      'e-enfants', 'e-contrat', 'e-email', 'e-pass'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
    var ps = document.getElementById('e-pass-strength');
    if (ps) ps.textContent = '';
    var sugg = document.getElementById('e-pass-suggestion');
    if (sugg) sugg.style.display = 'none';
    var eyeIcon = document.getElementById('e-pass-eye');
    if (eyeIcon) eyeIcon.textContent = 'visibility';
    var passField = document.getElementById('e-pass');
    if (passField) passField.type = 'password';
    clearEmployePhoto();
    var droitsEl = document.querySelectorAll('#droits-list .toggle-switch input[type=checkbox]');
    droitsEl.forEach(function (cb, i) { cb.checked = (i === 0); });
  }

  /* ── Sauvegarde employé ──────────────────────────────────── */

  async function saveEmploye() {
    var nom = v('e-nom').trim();
    var email = v('e-email').trim();
    var pass = v('e-pass').trim();
    if (!nom) return window.toast && window.toast('Le nom est requis', 'err');
    if (!email) return window.toast && window.toast("L'email est requis pour créer un accès", 'err');
    if (!pass || pass.length < 6) return window.toast && window.toast('Mot de passe requis (6 caractères min.)', 'err');

    var btn = document.getElementById('nde-save-btn') || document.querySelector('#page-nv-employe .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }

    var authUser = null;
    try {
      if (window.GPFirebaseAuth && typeof window.GPFirebaseAuth.createEmployeeAccount === 'function') {
        authUser = await window.GPFirebaseAuth.createEmployeeAccount(email, pass);
      } else {
        throw new Error('Module Firebase Auth non prêt.');
      }
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
      return window.toast && window.toast((e && e.message) || 'Compte utilisateur non créé', 'err');
    }

    var photo = await getPhotoData('e-photo-input');
    var id = genId('EP');

    var droitsEl = document.querySelectorAll('#droits-list .toggle-switch input[type=checkbox]');
    var droitsLabels = ['employes', 'proprietaires', 'locataires', 'bail', 'contrats',
      'paiements', 'depenses', 'fichiers', 'messages',
      'rapports', 'journal', 'superAdmin'];
    var droits = {};
    droitsEl.forEach(function (cb, i) { droits[droitsLabels[i]] = cb.checked; });

    var db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(db.employes)) db.employes = [];

    db.employes.push({
      id: id,
      uid: authUser && authUser.uid || '',
      civ: v('e-civ'), nom: nom, prenom: v('e-prenom'), fonction: v('e-fonction'),
      tel: v('e-tel'), date: v('e-naiss') || new Date().toISOString().split('T')[0],
      statut: 'Actif', adresse: v('e-adresse'), piece: v('e-piece'),
      numpiece: v('e-numpiece'), lieu: v('e-lieu'), deldeb: v('e-deldeb'),
      delexp: v('e-delexp'), matri: v('e-matri'), enfants: v('e-enfants'),
      contrat: v('e-contrat'), email: email, droits: droits, photo: photo || ''
    });

    if (window.GPDB && window.GPDB.save) {
      await window.GPDB.save(db);
    } else if (window.saveDB) {
      window.DB = db;
      await window.saveDB();
    }

    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
    resetEmployeForm();
    if (typeof window.closeNouvelEmployeDrawer === 'function') window.closeNouvelEmployeDrawer();
    else if (typeof window.navigate === 'function') window.navigate('employes');
    if (typeof window.renderEmployesModern === 'function') window.renderEmployesModern();
    if (window.toast) window.toast(authUser ? 'Employé enregistré et accès créé ✓' : 'Employé enregistré ✓');
  }

  /* ── Topbar : branchement unique des actions ─────────────── */
  function bindTopbarActions(){
    var set=function(id,fn){var el=document.getElementById(id);if(!el)return;el.onclick=fn;el.__gpTopbarBound=true;};
    set('topbarSearchBtn',function(e){toggleTopbarSearch(e);});
    set('helpBtn',function(e){toggleHelpPanel(e);});
    set('topbarAgendaBtn',function(){if(typeof window.navigate==='function')window.navigate('agenda');});
    set('topbarMessagesBtn',function(){if(typeof window.navigate==='function')window.navigate('messages');});
    set('notifBtn',function(e){toggleNotifPanel(e);});
    set('themeIcon',function(){toggleTheme();});
  }

  // Filet de sécurité : même si un autre ancien script remplace un bouton,
  // les actions topbar restent fonctionnelles.
  document.addEventListener('click', function(e){
    var t=e.target&&e.target.closest ? e.target.closest('#topbarSearchBtn,#helpBtn,#topbarAgendaBtn,#topbarMessagesBtn,#notifBtn,#themeIcon') : null;
    if(!t || t.__gpTopbarDelegated) return;
    // Le onclick moderne est la source principale ; ce garde-fou ne s'exécute
    // que si aucun gestionnaire n'est installé.
    if(t.__gpTopbarBound) return;
    t.__gpTopbarDelegated=true;
    if(t.id==='topbarSearchBtn') toggleTopbarSearch(e);
    else if(t.id==='helpBtn') toggleHelpPanel(e);
    else if(t.id==='topbarAgendaBtn' && typeof window.navigate==='function') window.navigate('agenda');
    else if(t.id==='topbarMessagesBtn' && typeof window.navigate==='function') window.navigate('messages');
    else if(t.id==='notifBtn') toggleNotifPanel(e);
    else if(t.id==='themeIcon') toggleTheme();
  }, true);

  /* ── Restaurer le thème sauvegardé au chargement ─────────── */

  document.addEventListener('DOMContentLoaded', function () {
    bindTopbarActions();
    var saved = localStorage.getItem('geniusproperty_theme');
    if (saved === 'dark') {
      document.body.classList.add('dark');
      var icon = document.querySelector('#themeIcon .material-symbols-rounded');
      if (icon) icon.textContent = 'light_mode';
    }
  });

  /* ── Exports globaux ─────────────────────────────────────── */

  Object.assign(window, {
    toggleTheme: toggleTheme,
    closeTopbarSearch: closeTopbarSearch,
    runTopbarSearch: runTopbarSearch,
    toggleNotifPanel: toggleNotifPanel,
    renderNotifPanel: renderNotifPanel,
    markAllRead: markAllRead,
    switchHelpTab: switchHelpTab,
    toggleFaq: toggleFaq,
    closeNotifPanel: closeNotifPanel,
    toggleHelpPanel: toggleHelpPanel,
    closeHelpPanel: closeHelpPanel,
    closeAllPanels: closeAllPanels,
    previewPhoto: previewPhoto,
    getPhotoData: getPhotoData,
    resetEmployeForm: resetEmployeForm,
    clearEmployePhoto: clearEmployePhoto,
    saveEmploye: saveEmploye,
    safeJSONParse: window.safeJSONParse || safeJSONParse,
    safeSetLocal: window.safeSetLocal || safeSetLocal,
    v: window.v || v,
    genId: window.genId || genId
  });

  // [cleaned] debug console statement removed
})();


/* ================================================================
   CONSOLIDATION — téléphone / recherche globale
   Anciennement chargé via fichiers patch séparés.
================================================================ */


/* ===== Source consolidée: js/pages/final-phone-dial-fix-global.js ===== */
(function(){
  'use strict';
  var COUNTRIES=[
    ['🇸🇳','SN','+221','Sénégal'],['🇫🇷','FR','+33','France'],['🇨🇮','CI','+225','Côte d’Ivoire'],['🇲🇱','ML','+223','Mali'],['🇬🇳','GN','+224','Guinée'],['🇬🇲','GM','+220','Gambie'],['🇲🇷','MR','+222','Mauritanie'],['🇧🇫','BF','+226','Burkina Faso'],['🇲🇦','MA','+212','Maroc'],['🇨🇲','CM','+237','Cameroun'],['🇨🇩','CD','+243','RDC'],['🇺🇸','US','+1','États-Unis']
  ];
  function css(){
    if(document.getElementById('gp-phone-dial-fix-css')) return;
    document.head.insertAdjacentHTML('beforeend','<style id="gp-phone-dial-fix-css">.gp-phone-field{display:flex!important;align-items:stretch!important;gap:6px!important;width:100%!important;position:relative!important}.gp-phone-country{height:38px;min-width:104px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;gap:5px;font-size:13px;color:#111827;cursor:pointer;padding:0 8px;box-sizing:border-box;white-space:nowrap}.gp-phone-country:hover{border-color:#2563eb}.gp-phone-field input{flex:1!important;min-width:0!important}.gp-country-menu{position:absolute;z-index:999999;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 28px rgba(15,23,42,.16);width:280px;max-height:270px;overflow:auto;padding:6px}.gp-country-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:13px;color:#374151}.gp-country-item:hover{background:#eff6ff}.nde-phone-row>.gp-phone-field{display:contents!important}.nde-phone-row>.gp-phone-field>.gp-phone-country{display:none!important}.nvl-phone-row>.gp-phone-field{display:contents!important}.nvl-phone-row>.gp-phone-field>.gp-phone-country{display:none!important}</style>');
  }
  function selectedDialFor(input){
    var wrap=input.closest('.gp-phone-field,.nde-phone-row,.nde-phone');
    if(!wrap) return '+221';
    var gp=wrap.querySelector('.gp-phone-country[data-code]'); if(gp) return gp.getAttribute('data-code')||'+221';
    var nde=wrap.querySelector('#nde-dial-code'); if(nde) return nde.textContent.trim()||'+221';
    var staticC=wrap.querySelector('.nde-phone-country'); if(staticC){var m=staticC.textContent.match(/\+\d+/); if(m) return m[0];}
    return '+221';
  }
  function stripDial(input){
    if(!input || input.dataset.keepFullPhone==='1') return;
    var v=(input.value||'').trim(); if(!v) return;
    var codes=COUNTRIES.map(function(c){return c[2].replace('+','\\+');}).join('|');
    var re=new RegExp('^\\s*(?:'+codes+')\\s*','i');
    var nv=v.replace(re,'').replace(/^\s*(?:SN|FR|CI|ML|GN|GM|MR|BF|MA|CM|CD|US)\s*/i,'').trim();
    if(nv!==v) input.value=nv;
  }
  function menu(btn,input){
    var old=document.querySelector('.gp-country-menu'); if(old) old.remove();
    var r=btn.getBoundingClientRect(), m=document.createElement('div'); m.className='gp-country-menu';
    m.style.left=(r.left+window.scrollX)+'px'; m.style.top=(r.bottom+window.scrollY+6)+'px';
    m.innerHTML=COUNTRIES.map(function(c){return '<div class="gp-country-item" data-code="'+c[2]+'"><b>'+c[0]+'</b><span>'+c[3]+'</span><small style="margin-left:auto;color:#64748b">'+c[2]+'</small></div>';}).join('');
    document.body.appendChild(m);
    Array.prototype.forEach.call(m.querySelectorAll('.gp-country-item'),function(it){it.onclick=function(){var code=it.getAttribute('data-code'), c=COUNTRIES.filter(function(x){return x[2]===code})[0]||COUNTRIES[0]; btn.setAttribute('data-code',c[2]); btn.innerHTML='<span>'+c[0]+'</span><strong>'+c[2]+'</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>'; stripDial(input); m.remove(); input.focus();};});
    setTimeout(function(){document.addEventListener('click',function close(e){if(!m.contains(e.target)&&e.target!==btn){m.remove();document.removeEventListener('click',close,true);}},true);},0);
  }
  function unwrapWrongEmployeePhone(){
    Array.prototype.forEach.call(document.querySelectorAll('.nde-phone-row > .gp-phone-field'),function(w){
      var inp=w.querySelector('input'); if(inp){w.parentNode.insertBefore(inp,w);} w.remove();
    });
  }
  function enhance(root){
    css(); unwrapWrongEmployeePhone();
    Array.prototype.forEach.call((root||document).querySelectorAll('input[id$="tel"],input[id$="-tel"],input[name*="tel" i],input[placeholder*="Téléphone" i]'),function(input){
      if(!input || input.type==='hidden' || input.id==='pdf-agence-tel' || input.id==='pdf-bailleur-tel') return;
      if(input.closest('.nde-phone-row,.nde-phone,.nvl-phone-row')){ stripDial(input); return; }
      if(!input.closest('.gp-phone-field')){
        var p=input.parentElement; if(!p) return;
        var wrap=document.createElement('div'); wrap.className='gp-phone-field';
        var btn=document.createElement('button'); btn.type='button'; btn.className='gp-phone-country'; btn.setAttribute('data-code','+221'); btn.innerHTML='<span>🇸🇳</span><strong>+221</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>';
        btn.onclick=function(e){e.preventDefault();e.stopPropagation();menu(btn,input);};
        p.insertBefore(wrap,input); wrap.appendChild(btn); wrap.appendChild(input);
      }
      stripDial(input);
    });
  }
  function bindSanitizer(){
    document.addEventListener('input',function(e){if(e.target&&e.target.matches&&e.target.matches('input[id$="tel"],input[id$="-tel"],input[name*="tel" i]')) stripDial(e.target);},true);
    document.addEventListener('blur',function(e){if(e.target&&e.target.matches&&e.target.matches('input[id$="tel"],input[id$="-tel"],input[name*="tel" i]')) stripDial(e.target);},true);
  }
  var oldEnhance=window.enhancePhoneInputs;
  window.enhancePhoneInputs=function(root){try{if(oldEnhance) oldEnhance(root);}catch(e){} setTimeout(function(){enhance(root||document);},0);};
  var oldRender=window.renderPage;
  window.renderPage=function(){var r=oldRender?oldRender.apply(this,arguments):undefined;setTimeout(function(){enhance(document);},120);return r;};
  var oldNav=window.navigate;
  window.navigate=function(){var r=oldNav?oldNav.apply(this,arguments):undefined;setTimeout(function(){enhance(document);},160);return r;};
  document.addEventListener('DOMContentLoaded',function(){bindSanitizer(); setTimeout(function(){enhance(document);},300); setTimeout(function(){enhance(document);},1000);});
  window.fixAllPhoneDialFields=function(){enhance(document);};
})();



/* ===== Source consolidée: js/pages/final-phone-flag-and-location-fix.js ===== */
(function(){
  'use strict';
  function flagHtml(){return '<span>🇸🇳</span><strong>+221</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>';}
  function injectCss(){
    if(document.getElementById('gp-final-phone-flag-css')) return;
    document.head.insertAdjacentHTML('beforeend','<style id="gp-final-phone-flag-css">.nde-phone-country,.gp-phone-line .gp-phone-country,.gp-phone-field .gp-phone-country{height:38px!important;min-width:104px!important;border:1px solid #e5e7eb!important;border-radius:8px!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;font-size:13px!important;color:#111827!important;font-weight:600!important;white-space:nowrap!important}.nde-phone-country span:first-child,.gp-phone-country span:first-child{font-size:16px!important}.nde-phone-country strong,.gp-phone-country strong{font-weight:700!important}.nde-phone .gp-phone-field,.gp-phone-line .gp-phone-field{display:flex!important;gap:6px!important;width:100%!important}.gp-drawer-section h3[data-fixed-loyer="1"]{text-transform:none!important}</style>');
  }
  function normalizeStaticCountry(el){
    if(!el) return;
    var t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(t==='SN +221' || t==='+221' || t.indexOf('+221')>=0 || t.indexOf('🇸🇳')>=0){
      // Perf : ne réécrit que si nécessaire (sinon l'observateur ci-dessous se redéclenche en boucle)
      if(t!=='🇸🇳 +221 expand_more' && t!=='🇸🇳+221expand_more'){ el.innerHTML=flagHtml(); }
      if(el.getAttribute('data-code')!=='+221') el.setAttribute('data-code','+221');
    }
  }
  function fixPhoneFlags(root){
    injectCss();
    root=root||document;
    Array.prototype.forEach.call(root.querySelectorAll('.nde-phone-country,.gp-phone-line .gp-phone-country,.gp-phone-country'), normalizeStaticCountry);
    // Corrige les doubles indicatifs dans tous les formulaires : on garde uniquement celui avec le drapeau.
    Array.prototype.forEach.call(root.querySelectorAll('.nde-phone,.gp-phone-line,.gp-phone-field'), function(w){
      var countries=Array.prototype.slice.call(w.querySelectorAll('.nde-phone-country,.gp-phone-country'));
      if(countries.length>1){
        countries.forEach(normalizeStaticCountry);
        countries.slice(1).forEach(function(c){ c.remove(); });
      }
      var inp=w.querySelector('input');
      if(inp){ var cleaned=(inp.value||'').replace(/^\s*(SN\s*)?\+221\s*/i,'').trim(); if(cleaned!==inp.value) inp.value=cleaned; }
    });
  }
  function removeLocationPhone(root){
    root=root||document;
    var tel=root.querySelector('#gp-l-tel');
    if(!tel) return;
    var field=tel.closest('.gp-field');
    if(field) field.remove();
    Array.prototype.forEach.call(root.querySelectorAll('.gp-drawer-section h3'), function(h){
      if((h.textContent||'').trim().toLowerCase()==='contact & loyer'){
        h.textContent='Loyer';
        h.setAttribute('data-fixed-loyer','1');
      }
    });
    Array.prototype.forEach.call(root.querySelectorAll('.gp-form-row'), function(row){
      if(row.querySelector('#gp-l-loyer') && !row.classList.contains('full')) row.classList.add('full');
    });
  }
  function run(root){ fixPhoneFlags(root); removeLocationPhone(root); }
  var oldOpen=window.openGpDrawer;
  window.openGpDrawer=function(kind){
    var r=oldOpen?oldOpen.apply(this,arguments):undefined;
    setTimeout(function(){run(document);},30);
    setTimeout(function(){run(document);},160);
    return r;
  };
  ['openNouvelLocataireDrawer','openNouvelEmployeDrawer','openEmployeeDrawer'].forEach(function(name){
    var fn=window[name];
    if(typeof fn==='function'){
      window[name]=function(){var r=fn.apply(this,arguments);setTimeout(function(){run(document);},30);setTimeout(function(){run(document);},180);return r;};
    }
  });
  var oldEnh=window.fixAllPhoneDialFields;
  window.fixAllPhoneDialFields=function(){ if(oldEnh) try{oldEnh();}catch(e){} run(document); };
  var moTimer=null;
  var mo=new MutationObserver(function(muts){
    var need=false; muts.forEach(function(m){ if(m.addedNodes && m.addedNodes.length) need=true; });
    if(need && !moTimer) moTimer=setTimeout(function(){ moTimer=null; run(document); mo.takeRecords(); },60);
  });
  document.addEventListener('DOMContentLoaded',function(){
    run(document); setTimeout(function(){run(document);},500); setTimeout(function(){run(document);},1200);
    try{mo.observe(document.body,{childList:true,subtree:true});}catch(e){}
  });
})();



/* ===== Source consolidée: js/pages/final-safe-phone-search-fix.js ===== */
(function(){
  'use strict';
  function injectCss(){
    if(document.getElementById('gp-safe-phone-search-css')) return;
    document.head.insertAdjacentHTML('beforeend','<style id="gp-safe-phone-search-css">'+
      '.gp-safe-search,.prop-search-box,.gp-search,.search-box,.table-search,.filters-search{height:34px!important;display:flex!important;align-items:center!important;gap:6px!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:7px!important;padding:0 10px!important;box-sizing:border-box!important;box-shadow:none!important}'+
      '.prop-search-box input,.gp-search input,.search-box input,.table-search input,.filters-search input{border:0!important;outline:0!important;background:transparent!important;width:100%!important;font-size:13px!important;color:#374151!important;height:100%!important;padding:0!important}'+
      '.prop-search-box .material-symbols-rounded,.gp-search .material-symbols-rounded,.search-box .material-symbols-rounded,.table-search .material-symbols-rounded,.filters-search .material-symbols-rounded{font-size:16px!important;color:#D4AF37!important}'+
      '.gp-phone-field,.nde-phone{display:flex!important;align-items:stretch!important;gap:6px!important;width:100%!important;position:relative!important}'+
      '.gp-phone-country,.nde-phone-country,.nde-phone-flag{height:38px!important;min-width:104px!important;border:1px solid #e5e7eb!important;border-radius:8px!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;padding:0 8px!important;box-sizing:border-box!important;white-space:nowrap!important;color:#111827!important;font-size:13px!important;font-weight:600!important}'+
      '.gp-phone-field input,.nde-phone input{flex:1!important;min-width:0!important}'+
      '</style>');
  }
  function normalizePhone(root){
    root=root||document; injectCss();
    Array.prototype.forEach.call(root.querySelectorAll('.gp-phone-country,.nde-phone-country,.nde-phone-flag'),function(el){
      if(!el) return;
      var txt=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!el.querySelector('img') && !/🇸🇳/.test(txt)){
        el.innerHTML='<span>🇸🇳</span><strong>+221</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>';
      }else if(/SN\s*\+221/i.test(txt) || txt==='+221'){
        el.innerHTML='<span>🇸🇳</span><strong>+221</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>';
      }
      el.setAttribute('data-code','+221');
    });
    Array.prototype.forEach.call(root.querySelectorAll('input[id$="tel"],input[id$="-tel"],input[name*="tel" i]'),function(input){
      if(!input || input.type==='hidden') return;
      if(input.id==='pdf-agence-tel' || input.id==='pdf-bailleur-tel') return;
      input.value=String(input.value||'').replace(/^\s*(SN\s*)?\+221\s*/i,'').trimStart();
      if(input.closest('.gp-phone-field,.nde-phone,.nvl-phone-row')) return;
      var parent=input.parentElement; if(!parent) return;
      var wrap=document.createElement('div'); wrap.className='gp-phone-field';
      var btn=document.createElement('button'); btn.type='button'; btn.className='gp-phone-country'; btn.setAttribute('data-code','+221');
      btn.innerHTML='<span>🇸🇳</span><strong>+221</strong><span class="material-symbols-rounded" style="font-size:14px;color:#94a3b8">expand_more</span>';
      btn.onclick=function(e){e.preventDefault();e.stopPropagation();};
      parent.insertBefore(wrap,input); wrap.appendChild(btn); wrap.appendChild(input);
    });
    var ltel=document.getElementById('gp-l-tel');
    if(ltel){ var f=ltel.closest('.gp-field,.nde-field,.fg'); if(f) f.remove(); }
    Array.prototype.forEach.call(root.querySelectorAll('.gp-drawer-section h3,.nde-section-title'),function(h){
      if(/contact\s*&\s*loyer/i.test(h.textContent||'')) h.textContent='Loyer';
    });
  }
  function run(){ normalizePhone(document); }
  ['openNouveauProprietaireDrawer','openNouvelLocataireDrawer','openNouvelEmployeDrawer','openEmployeeDrawer','openGpDrawer','navigate','renderPage'].forEach(function(name){
    var fn=window[name]; if(typeof fn==='function' && !fn.__gpSafeWrapped){
      var wrapped=function(){ var r=fn.apply(this,arguments); setTimeout(run,80); return r; };
      wrapped.__gpSafeWrapped=true; window[name]=wrapped;
    }
  });
  document.addEventListener('DOMContentLoaded',function(){injectCss(); setTimeout(run,300); setTimeout(run,1000);});
  if(document.readyState!=='loading'){injectCss(); setTimeout(run,50);}
})();

