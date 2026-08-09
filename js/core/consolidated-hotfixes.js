window.gpGoToAvenir=function(){try{if(typeof window.navigate==='function')window.navigate('avenir');}catch(e){}};
/* Consolidated hotfixes generated 2026-05-23. Source files archived in _archive/refactor-safe-20260523/. */


/* ===== BEGIN js/core/final-page-render-fixes.js ===== */
/* ================================================================
   V40 — Final page render fixes
   - empêche le flash de l'ancien renderer Locations
   - force les pages modernes/finales via GPNavigation
   - restaure window.navigate après les wrappers legacy
================================================================ */
(function(){
  'use strict';

  function registerFinalRenderers(){
    if(!window.GPNavigation || typeof window.GPNavigation.registerRenderer !== 'function') return;

    window.GPNavigation.registerRenderer('proprietaires', function(){
      if(typeof window.renderProprietairesModern === 'function') return window.renderProprietairesModern();
      if(typeof window.renderProprietairesCards === 'function') return window.renderProprietairesCards();
    });

    window.GPNavigation.registerRenderer('locatives', function(){
      if(typeof window.renderLocativesFinal === 'function') return window.renderLocativesFinal();
      if(typeof window.renderLocativesModernAligned === 'function') return window.renderLocativesModernAligned();
      if(typeof window.renderLocativesModern === 'function') return window.renderLocativesModern();
      if(typeof window.renderTable === 'function') return window.renderTable('locatives');
    });

    window.GPNavigation.registerRenderer('biens', function(){
      if(typeof window.renderBiensFinal === 'function') return window.renderBiensFinal();
      if(typeof window.renderBiensCards === 'function') return window.renderBiensCards();
    });

    window.GPNavigation.registerRenderer('contrats', function(){
      if(typeof window.renderContratsFinal === 'function') return window.renderContratsFinal();
      if(typeof window.renderContratsModern === 'function') return window.renderContratsModern();
      if(typeof window.renderContrats === 'function') return window.renderContrats();
    });
  }

  function restoreStableNavigation(){
    if(!window.GPNavigation) return;
    if(typeof window.GPNavigation.navigate === 'function') {
      window.navigate = function(page){ return window.GPNavigation.navigate(page); };
    }
    if(typeof window.GPNavigation.renderPage === 'function') {
      window.renderPage = function(page){ return window.GPNavigation.renderPage(page); };
    }
  }

  function rerenderActivePageOnce(){
    var active = document.querySelector('.page.active');
    if(!active || !active.id) return;
    var page = active.id.replace(/^page-/, '');
    if(['proprietaires','locatives','biens','contrats'].indexOf(page) !== -1 && window.GPNavigation) {
      window.GPNavigation.renderPage(page);
    }
  }

  function boot(){
    registerFinalRenderers();
    restoreStableNavigation();
    setTimeout(function(){
      registerFinalRenderers();
      restoreStableNavigation();
      rerenderActivePageOnce();
    }, 0);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.addEventListener('gp:auth-changed', function(){
    setTimeout(function(){ registerFinalRenderers(); restoreStableNavigation(); }, 0);
  });
})();
/* ===== END js/core/final-page-render-fixes.js ===== */


/* ===== BEGIN js/core/form-stability-fixes.js ===== */
/* GP v40 — corrections formulaires: drawers scopés, sauvegarde édition fiable */
(function(){
  'use strict';
  if(window.__gpFormStabilityFixes) return;
  window.__gpFormStabilityFixes = true;

  function $(id, root){ return (root || document).getElementById ? (root || document).getElementById(id) : null; }
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function toast(msg, type){ if(typeof window.toast === 'function') window.toast(msg, type || 'ok'); else console.log(msg); }
  function uid(prefix){ return (typeof window.genId === 'function') ? window.genId(prefix || 'ID') : ((prefix || 'ID') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7)); }
  function getDb(){
    try{ if(window.GPDB && typeof window.GPDB.load === 'function') return window.GPDB.load(); }catch(e){}
    if(!window.DB || typeof window.DB !== 'object') window.DB = {};
    return window.DB;
  }
  async function saveDb(db){
    window.DB = db;
    try{ if(window.GPDB && typeof window.GPDB.save === 'function'){ window.GPDB.save(db); return; } }catch(e){ console.warn('[form-fix] GPDB.save:', e); }
    try{ if(typeof window.saveDB === 'function'){ var r = window.saveDB(); if(r && typeof r.then === 'function') await r; } }catch(e){ console.warn('[form-fix] saveDB:', e); }
  }
  function readFileData(input){
    return new Promise(function(resolve){
      var file = input && input.files && input.files[0];
      if(!file) return resolve('');
      var r = new FileReader();
      r.onload = function(e){ resolve(e.target && e.target.result || ''); };
      r.onerror = function(){ resolve(''); };
      r.readAsDataURL(file);
    });
  }
  function val(id, root){ var el = qs('#' + CSS.escape(id), root); return el ? String(el.value || '').trim() : ''; }
  function setBtn(btn, busy, text){ if(!btn) return; btn.disabled = !!busy; btn.textContent = text; }
  function refresh(key){
    try{ if(window.GPDB && typeof GPDB.load === 'function') window.DB = GPDB.load(); }catch(e){}
    var map = {
      employes: ['renderEmployesModern', 'renderEmployes'],
      proprietaires: ['renderProprietairesModern', 'renderProprietaires'],
      biens: ['renderBiensModern', 'renderBiens'],
      locataires: ['renderLocatairesModern', 'renderLocataires'],
      locatives: ['renderLocativesModernV11', 'renderLocativesModern', 'renderLocatives'],
      contrats: ['renderContratsModern', 'renderContrats'],
      paiements: ['renderPaiementsModern', 'renderPaiements'],
      depenses: ['renderDepensesModern', 'renderDepenses']
    };
    (map[key] || []).some(function(fn){ try{ if(typeof window[fn] === 'function'){ window[fn](); return true; } }catch(e){ console.warn('[form-fix] refresh '+fn, e); } return false; });
    try{ if(typeof window.renderPage === 'function') window.renderPage(key); }catch(e){}
    try{ if(typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges(); }catch(e){}
  }

  window.saveEmployeFromDrawer = async function(){
    var drawer = document.getElementById('nvEmpDrawer');
    if(!drawer) return toast('Formulaire employé introuvable', 'err');
    var btn = document.getElementById('nde-save-btn');
    var prenom = val('e-prenom', drawer), nom = val('e-nom', drawer), email = val('e-email', drawer), pass = val('e-pass', drawer);
    if(!nom) return toast('Le nom est requis', 'err');
    if(!email) return toast("L'email est requis", 'err');
    if(!pass || pass.length < 6) return toast('Mot de passe requis (6 caractères min.)', 'err');
    setBtn(btn, true, 'Enregistrement…');
    try{
      var db = getDb();
      if(!Array.isArray(db.employes)) db.employes = [];
      var photo = await readFileData(qs('#e-photo-input', drawer));
      db.employes.push({
        id: uid('EP'), civ: val('e-civ', drawer) || 'Employé', prenom: prenom, nom: nom,
        email: email, pass: pass, tel: val('e-tel', drawer), fonction: val('e-fonction', drawer) || val('e-civ', drawer),
        statut: val('e-statut-drawer', drawer) || 'Actif', adresse: val('e-adresse', drawer),
        date: val('e-deldeb', drawer) || new Date().toISOString().slice(0,10), deldeb: val('e-deldeb', drawer),
        contrat: val('e-contrat', drawer) || 'CDI', piece: val('e-piece', drawer) || 'CNI',
        droits: { employes: true }, photo: photo || ''
      });
      await saveDb(db);
      try{ if(typeof window.closeNouvelEmployeDrawer === 'function') window.closeNouvelEmployeDrawer(); }catch(e){}
      refresh('employes');
      toast('Employé enregistré ✓');
    }catch(e){ console.error(e); toast((e && e.message) || 'Enregistrement employé impossible', 'err'); }
    finally{ setBtn(btn, false, 'Enregistrer'); }
  };

  window.saveProprietaireFromDrawer = async function(){
    var drawer = document.getElementById('nvPropDrawer');
    if(!drawer) return toast('Formulaire propriétaire introuvable', 'err');
    var btn = document.getElementById('nvp-save-btn');
    var nom = val('nvp-nom', drawer), prenom = val('nvp-prenom', drawer), tel = val('nvp-tel', drawer), email = val('nvp-email', drawer);
    if(!nom) return toast('Le nom est requis', 'err');
    if(!tel) return toast('Le téléphone est requis', 'err');
    if(!email) return toast("L'email est requis", 'err');
    setBtn(btn, true, 'Enregistrement…');
    try{
      var db = getDb();
      if(!Array.isArray(db.proprietaires)) db.proprietaires = [];
      var photo = await readFileData(qs('#nvp-photo-input', drawer));
      db.proprietaires.push({
        id: uid('PR'), nom: nom, prenom: prenom, tel: tel, email: email,
        adresse: val('nvp-adresse', drawer), naiss: val('nvp-naiss', drawer), matri: val('nvp-matri', drawer),
        statut: 'Actif', photo: photo || ''
      });
      await saveDb(db);
      try{ if(typeof window.closeNouvelProprietaireDrawer === 'function') window.closeNouvelProprietaireDrawer(); }catch(e){}
      refresh('proprietaires');
      toast('Propriétaire enregistré ✓');
    }catch(e){ console.error(e); toast((e && e.message) || 'Enregistrement propriétaire impossible', 'err'); }
    finally{ setBtn(btn, false, 'Enregistrer'); }
  };

  var FIELD_MAP = {
    locataires: ['prenom','nom','naiss','matri','prof','travail','enfants','tel','email','adresse','type','statut','bien','date'],
    proprietaires: ['nom','prenom','naiss','matri','adresse','tel','email'],
    employes: ['nom','prenom','fonction','contrat','date','statut','tel','email','adresse','piece','numpiece','lieu','deldeb','delexp','user'],
    biens: ['nom','type','proprio','valeur','nbAppart','etat','statut','vente','adresse'],
    locatives: ['nom','bien','locataire','loyer','charge','dateEntree','statut'],
    contrats: ['locataire','locative','type','statut','debut','fin','prochain','sign','loyer','charges','caution','honor','frais','obs'],
    paiements: ['locataire','locative','montant','paye','date','mode'],
    depenses: ['libelle','cat','montant','date','bien']
  };

  window.gpSaveEdit = async function(key, idx){
    var drawer = document.getElementById('gpActionsDrawer') || document;
    var btn = qs('#gpad-save', drawer) || document.getElementById('gpad-save');
    setBtn(btn, true, 'Enregistrement…');
    try{
      var db = getDb();
      if(!Array.isArray(db[key])) db[key] = [];
      var row = db[key][idx];
      if(!row) throw new Error('Enregistrement introuvable');
      (FIELD_MAP[key] || []).forEach(function(f){
        var el = qs('#' + CSS.escape('e-' + f), drawer);
        if(el) row[f] = String(el.value || '').trim();
      });
      var photo = await readFileData(qs('#gpad-photo-inp', drawer) || qs('#gpad-photo-input', drawer) || qs('#edit-photo-inp', drawer));
      if(photo) row.photo = photo;
      if(key === 'paiements'){
        var du = Number(row.montant) || 0, paye = Number(row.paye) || 0;
        row.reste = Math.max(0, du - paye);
      }
      await saveDb(db);
      try{ if(typeof window.auditLog === 'function') window.auditLog('Modification', key, 'Modification enregistrée'); }catch(e){}
      try{ if(typeof window.gpCloseActionsDrawer === 'function') window.gpCloseActionsDrawer(); }catch(e){}
      refresh(key);
      toast('Modification enregistrée ✓');
    }catch(e){ console.error(e); toast((e && e.message) || 'Modification impossible', 'err'); }
    finally{ setBtn(btn, false, 'Enregistrer'); }
  };

})();
/* ===== END js/core/form-stability-fixes.js ===== */


/* ===== BEGIN js/core/skeleton-unblock-hotfix.js ===== */
/* GP hotfix — empêche le skeleton de bloquer l'interface. */
(function(){
  'use strict';
  function killSkeleton(){
    var sk = document.getElementById('gp-skeleton-wrap');
    if(!sk) return;
    sk.classList.remove('visible');
    sk.innerHTML = '';
    sk.style.display = 'none';
    sk.style.opacity = '0';
    sk.style.pointerEvents = 'none';
    sk.style.visibility = 'hidden';
  }
  function afterRender(){
    killSkeleton();
    setTimeout(killSkeleton, 80);
    setTimeout(killSkeleton, 300);
    setTimeout(killSkeleton, 900);
  }
  window.GPKillSkeleton = killSkeleton;
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afterRender, {once:true});
  else afterRender();
  window.addEventListener('load', afterRender);
  document.addEventListener('gp:navigation', afterRender);
  window.addEventListener('gp:auth-changed', afterRender);
  window.addEventListener('firebase:ready', afterRender);
  try{
    new MutationObserver(function(){
      var sk = document.getElementById('gp-skeleton-wrap');
      if(sk && sk.classList.contains('visible')) afterRender();
    }).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
  }catch(e){}
})();
/* ===== END js/core/skeleton-unblock-hotfix.js ===== */


/* ===== BEGIN js/core/v38-biens-finance-restore.js ===== */
/* GP v40 — Restore v38 bien detail + payment/expense document actions
   - Biens cards open the full legacy detail page with rubriques/tabs
   - Detail header buttons are modernized
   - Paiements restore receipt PDF action
   - Dépenses restore facture owner/PDF action
*/
(function(){
  'use strict';
  if(window.__gpV38BiensFinanceRestore) return;
  window.__gpV38BiensFinanceRestore = true;

  var PAGE = { biens:1, paiements:1, depenses:1 };
  var PS = { biens:12, paiements:10, depenses:10 };

  function db(){
    try{ if(window.GPDB && typeof GPDB.load==='function'){ window.DB = GPDB.load(); return window.DB; } }catch(e){}
    window.DB = window.DB || {};
    return window.DB;
  }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});
  }
  function norm(v){ return String(v||'').toLowerCase(); }
  function num(v){
    if(typeof window.num==='function') return window.num(v);
    var n = Number(String(v||'').replace(/\s/g,'').replace(/[^0-9,.-]/g,'').replace(',','.'));
    return isFinite(n) ? n : 0;
  }
  function money(v){
    if(typeof window.gp_money==='function') return window.gp_money(v);
    var n = num(v);
    return Math.round(n).toLocaleString('fr-FR') + ' FCFA';
  }
  function fmtDate(v){
    if(!v) return '—';
    try{ return new Date(String(v)).toLocaleDateString('fr-FR'); }catch(e){ return esc(v); }
  }
  function iconBtn(cls, ico, title, onclick){
    return '<button type="button" class="gp-action '+esc(cls)+'" title="'+esc(title)+'" onclick="event.stopPropagation();'+onclick+'"><span class="material-symbols-rounded">'+esc(ico)+'</span></button>';
  }
  function pageBtns(key,total){
    var pages = Math.max(1, Math.ceil(total / (PS[key]||10)));
    var cur = Math.min(PAGE[key]||1, pages);
    PAGE[key]=cur;
    var html='<div class="gp-page-mini">';
    html += '<button '+(cur<=1?'disabled':'')+' onclick="gpV38Page(\''+key+'\','+(cur-1)+')"><span class="material-symbols-rounded">chevron_left</span></button>';
    for(var i=1;i<=pages;i++){
      if(i===1 || i===pages || Math.abs(i-cur)<=1){ html += '<button class="'+(i===cur?'active':'')+'" onclick="gpV38Page(\''+key+'\','+i+')">'+i+'</button>'; }
      else if(i===cur-2 || i===cur+2){ html += '<span>…</span>'; }
    }
    html += '<button '+(cur>=pages?'disabled':'')+' onclick="gpV38Page(\''+key+'\','+(cur+1)+')"><span class="material-symbols-rounded">chevron_right</span></button></div>';
    return html;
  }
  window.gpV38Page = function(key,p){
    PAGE[key]=Math.max(1,p||1);
    if(key==='biens') return window.renderBiensFinal();
    if(key==='paiements') return window.renderPaiementsFinal();
    if(key==='depenses') return window.renderDepensesFinal();
  };

  function injectCSS(){
    if(document.getElementById('gp-v38-biens-finance-css')) return;
    var s=document.createElement('style');
    s.id='gp-v38-biens-finance-css';
    s.textContent = `
      #page-dashboard.page.active{padding-top:18px!important}
      #page-bien-detail{padding-top:18px!important}
      #page-bien-detail .page-header{background:#fff!important;border:1px solid #eceff4!important;border-radius:16px!important;padding:12px 14px!important;box-shadow:0 8px 24px rgba(15,23,42,.06)!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important}
      #page-bien-detail .btn-back-lnk{height:36px!important;padding:0 13px!important;border-radius:12px!important;border:1px solid #e5e7eb!important;background:#fff!important;color:#374151!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;gap:7px!important;box-shadow:0 2px 8px rgba(15,23,42,.04)!important;transition:.16s!important}
      #page-bien-detail .btn-back-lnk:hover{background:#f8fafc!important;transform:translateY(-1px)!important}
      #bienDetailEditBtn,#bienDetailDelBtn{height:36px!important;border-radius:12px!important;padding:0 13px!important;font-weight:900!important;box-shadow:0 3px 10px rgba(15,23,42,.06)!important;display:inline-flex!important;align-items:center!important;gap:7px!important}
      #bienDetailEditBtn{background:#fff7d6!important;color:#8a6a00!important;border:1px solid #f4d77d!important}
      #bienDetailEditBtn:hover{background:#ffefad!important;transform:translateY(-1px)!important}
      #bienDetailDelBtn{background:#fff!important;color:#dc2626!important;border:1px solid #fecaca!important}
      #bienDetailDelBtn:hover{background:#fee2e2!important;transform:translateY(-1px)!important}
      #page-bien-detail .bien-detail-tab{height:48px!important;padding:0 16px!important;border:0!important;background:transparent!important;display:inline-flex!important;align-items:center!important;gap:7px!important;color:#64748b!important;font-size:12.5px!important;font-weight:800!important;cursor:pointer!important;border-bottom:3px solid transparent!important}
      #page-bien-detail .bien-detail-tab .material-symbols-rounded{font-size:18px!important}
      #page-bien-detail .bien-detail-tab.active{color:#D4AF37!important;border-bottom-color:#D4AF37!important}
      .gp-biens-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))!important;gap:14px!important}
      .gp-bien-card{position:relative;background:#fff;border:1px solid #edf0f4;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.055);cursor:pointer;transition:.18s}
      .gp-bien-card:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(15,23,42,.11)}
      .gp-bien-card-img{height:142px;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .gp-bien-card-img img{width:100%;height:100%;object-fit:cover}
      .gp-bien-badge{position:absolute;top:10px;right:10px;background:#fff7d6;color:#8a6a00;border:1px solid #f4d77d;border-radius:999px;padding:4px 9px;font-size:10px;font-weight:900}
      .gp-bien-card-body{padding:12px 13px 14px}
      .gp-bien-card-title{font-size:14px;font-weight:950;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .gp-bien-card-meta{margin-top:6px;display:flex;align-items:center;gap:5px;color:#64748b;font-size:11.5px;font-weight:700}
      .gp-bien-card-price{margin-top:9px;color:#D4AF37;font-size:13.5px;font-weight:950;display:flex;justify-content:space-between;gap:8px;align-items:center}
      .gp-bien-card-owner{font-size:11px;color:#94a3b8;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .gp-unit-badge,.gp-unit-line{display:inline-flex;align-items:center;border-radius:999px;padding:2px 7px;font-size:10px;font-weight:900;background:#fef3c7;color:#92400e;margin-left:5px}
      .gp-unit-line{display:flex;width:max-content;margin:8px 0 0 0;background:#ecfdf5;color:#166534}.gp-unit-line.free{background:#eff6ff;color:#1e40af}
      .gp-actions,.gp-fin-actions{display:flex;align-items:center;justify-content:center;gap:6px}.gp-action{width:31px;height:31px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s}.gp-action .material-symbols-rounded{font-size:17px}.gp-action.view{color:#2563eb;background:#eff6ff;border-color:#bfdbfe}.gp-action.docs,.gp-action.receipt,.gp-action.invoice{color:#8a6a00;background:#fff7d6;border-color:#f4d77d}.gp-action.edit{color:#1e40af;background:#dbeafe;border-color:#bfdbfe}.gp-action.del{color:#dc2626;background:#fff1f2;border-color:#fecdd3}.gp-action:hover{transform:translateY(-1px);filter:brightness(.98)}
      .gp-page-mini{display:flex;align-items:center;gap:5px}.gp-page-mini button{height:28px;min-width:28px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#475569;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}.gp-page-mini button.active{background:#111827;color:#fff;border-color:#111827}.gp-page-mini button:disabled{opacity:.45}.gp-page-mini .material-symbols-rounded{font-size:16px}
    `;
    document.head.appendChild(s);
  }

  function renderBiensFinal(){
    injectCSS();
    var page=document.getElementById('page-biens'); if(!page) return;
    var d=db(); if(!Array.isArray(d.biens)) d.biens=[];
    var all=d.biens;
    var q=(document.getElementById('gpBienSearch')||{}).value||'';
    var st=(document.getElementById('gpBienStatus')||{}).value||'';
    var qn=norm(q);
    var data=all.filter(function(b){return (!qn||norm(JSON.stringify(b)).indexOf(qn)>-1)&&(!st||norm(b.statut)===norm(st));});
    var totalPages=Math.max(1,Math.ceil(data.length/PS.biens)); PAGE.biens=Math.min(PAGE.biens,totalPages);
    var start=(PAGE.biens-1)*PS.biens, slice=data.slice(start,start+PS.biens);
    var dispo=all.filter(function(b){return norm(b.statut).indexOf('dispo')>-1}).length;
    var occ=all.filter(function(b){return norm(b.statut).indexOf('lou')>-1||norm(b.statut).indexOf('occup')>-1}).length;
    page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+all.length+'</strong><span>Biens</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">meeting_room</span></div><div><strong>'+dispo+'</strong><span>Disponibles</span><em>Biens libres</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+occ+'</strong><span>Occupés</span><em>Biens loués</em></div></div></div><button class="gp-primary" onclick="openGpDrawer&&openGpDrawer(\'bien\')"><span class="material-symbols-rounded">add</span>Nouveau bien</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpBienSearch" value="'+esc(q)+'" placeholder="Rechercher un bien…" oninput="gpV38Page(\'biens\',1)"></label><select id="gpBienStatus" class="gp-select" onchange="gpV38Page(\'biens\',1)"><option value="">Tous les statuts</option><option '+(st==='Disponible'?'selected':'')+'>Disponible</option><option '+(st==='Loué'?'selected':'')+'>Loué</option><option '+(st==='En attente'?'selected':'')+'>En attente</option></select><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div>'+(data.length?'<div class="gp-biens-grid">'+slice.map(function(b){var i=all.indexOf(b),units=Array.isArray(b.unites)?b.unites:[];var loue=units.filter(function(u){return norm(u.statut).indexOf('lou')>-1}).length;return '<div class="gp-bien-card" title="Appuyer pour voir les détails" onclick="window.DB=window.GPDB&&GPDB.load?GPDB.load():window.DB;openBienDetail&&openBienDetail('+i+')"><span class="gp-bien-badge">'+esc(b.statut||'En attente')+'</span><div class="gp-bien-card-img">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded" style="font-size:46px;color:#cbd5e1">apartment</span>')+'</div><div class="gp-bien-card-body"><div class="gp-bien-card-title">'+esc(b.nom||'Bien')+'</div><div class="gp-bien-card-meta"><span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37">apartment</span>'+esc(b.type||'Bien')+(units.length?' <span class="gp-unit-badge">'+units.length+' apparts</span>':'')+'</div><div class="gp-bien-card-price">'+money(b.valeur||b.prix||b.loyer)+'<span class="gp-bien-card-owner">'+esc(b.proprio||'')+'</span></div>'+(units.length?'<span class="gp-unit-line ok">Appartement 1 · '+(loue?'Loué':'Disponible')+'</span>'+(units[1]?'<span class="gp-unit-line free">Appartement 2 · '+esc(units[1].statut||'Disponible')+'</span>':''):'')+'</div></div>';}).join('')+'</div><div class="gp-footer" style="margin-top:14px;background:#fff;border:1px solid #e5e7eb;border-radius:12px"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.biens,data.length)+' sur '+data.length+' bien'+(data.length>1?'s':'')+'</span>'+pageBtns('biens',data.length)+'</div>':'<div class="gp-empty">Aucun bien trouvé</div>')+'</div>';
  }

  function renderPaiementsFinal(){
    injectCSS(); var page=document.getElementById('page-paiements'); if(!page) return;
    var d=db(); if(!Array.isArray(d.paiements)) d.paiements=[];
    var all=d.paiements, q=(document.getElementById('gpPaySearch')||{}).value||'', qn=norm(q);
    var data=all.filter(function(p){return !qn||norm(JSON.stringify(p)).indexOf(qn)>-1;});
    var totalPages=Math.max(1,Math.ceil(data.length/PS.paiements)); PAGE.paiements=Math.min(PAGE.paiements,totalPages);
    var start=(PAGE.paiements-1)*PS.paiements, slice=data.slice(start,start+PS.paiements);
    var total=all.reduce(function(s,p){return s+num(p.montant);},0), paye=all.reduce(function(s,p){return s+num(p.paye||p.montantPaye||p.montant);},0), reste=all.reduce(function(s,p){return s+num(p.reste||Math.max(0,num(p.montant)-num(p.paye||p.montantPaye||p.montant)));},0);
    page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(total)+'</strong><span>Montant dû</span><em>Total paiements</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">check_circle</span></div><div><strong>'+money(paye)+'</strong><span>Payé</span><em>Montant encaissé</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">warning</span></div><div><strong>'+money(reste)+'</strong><span>Reste</span><em>Solde à payer</em></div></div></div><button class="gp-primary blue" onclick="openFinanceDrawer&&openFinanceDrawer(\'paiement\')"><span class="material-symbols-rounded">add</span>Nouveau paiement</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpPaySearch" value="'+esc(q)+'" placeholder="Rechercher un paiement…" oninput="gpV38Page(\'paiements\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'paiements\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'paiements\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button><button class="gp-outline gp-avenir-red-cta" data-gp-avenir-cta="1" onclick="return gpOpenAvenirFromPaiements(event)" title="Paiements à venir"><span class="material-symbols-rounded" style="font-size:13px;vertical-align:-2px">event</span> À venir</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Locataire</th><th>Locative</th><th>Montant</th><th>Payé</th><th>Reste</th><th>Date paiement</th><th>Mode</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(p){var i=all.indexOf(p);var r=num(p.reste||Math.max(0,num(p.montant)-num(p.paye||p.montantPaye||p.montant)));return '<tr><td><b>'+esc(p.locataire||'—')+'</b></td><td>'+esc(p.locative||p.bien||'—')+'</td><td><b>'+money(p.montant)+'</b></td><td>'+money(p.paye||p.montantPaye||p.montant)+'</td><td><span class="gp-pill '+(r>0?'off':'')+'">'+money(r)+'</span></td><td>'+esc(p.date||p.datePaiement||'—')+'</td><td>'+esc(p.mode||'—')+'</td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'paiements\','+i+')')+iconBtn('receipt','receipt_long','Générer le reçu PDF','genererRecuPaiementPDF&&genererRecuPaiementPDF('+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'paiements\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'paiements\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.paiements,data.length)+' sur '+data.length+' paiement'+(data.length>1?'s':'')+'</span>'+pageBtns('paiements',data.length)+'</div>':'<div class="gp-empty">Aucun paiement enregistré</div>')+'</div></div>';
  }

  function renderDepensesFinal(){
    injectCSS(); var page=document.getElementById('page-depenses'); if(!page) return;
    var d=db(); if(!Array.isArray(d.depenses)) d.depenses=[];
    var all=d.depenses, q=(document.getElementById('gpDepSearch')||document.getElementById('gpDepSearch2')||{}).value||'', cat=(document.getElementById('gpDepCat')||document.getElementById('gpDepCat2')||{}).value||'', qn=norm(q);
    var data=all.filter(function(x){return (!qn||norm(JSON.stringify(x)).indexOf(qn)>-1)&&(!cat||String(x.cat||x.categorie||'')===cat);});
    var totalPages=Math.max(1,Math.ceil(data.length/PS.depenses)); PAGE.depenses=Math.min(PAGE.depenses,totalPages);
    var start=(PAGE.depenses-1)*PS.depenses, slice=data.slice(start,start+PS.depenses);
    var total=all.reduce(function(s,x){return s+num(x.montant);},0), biens=all.filter(function(x){return !!x.bien;}).length;
    page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">account_balance_wallet</span></div><div><strong>'+all.length+'</strong><span>Dépenses</span><em>Total enregistrées</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(total)+'</strong><span>Total</span><em>Montant dépenses</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+biens+'</strong><span>Liées aux biens</span><em>Dépenses biens</em></div></div></div><button class="gp-primary blue" onclick="openFinanceDrawer&&openFinanceDrawer(\'depense\')"><span class="material-symbols-rounded">add</span>Nouvelle dépense</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpDepSearch" value="'+esc(q)+'" placeholder="Rechercher une dépense…" oninput="gpV38Page(\'depenses\',1)"></label><select id="gpDepCat" class="gp-select" onchange="gpV38Page(\'depenses\',1)"><option value="">Toutes catégories</option><option '+(cat==='Travaux'?'selected':'')+'>Travaux</option><option '+(cat==='Réparation'?'selected':'')+'>Réparation</option><option '+(cat==='Entretien'?'selected':'')+'>Entretien</option><option '+(cat==='Taxe'?'selected':'')+'>Taxe</option><option '+(cat==='Assurance'?'selected':'')+'>Assurance</option><option '+(cat==='Autre'?'selected':'')+'>Autre</option></select><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'depenses\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'depenses\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Dépense</th><th>Catégorie</th><th>Montant</th><th>Date</th><th>Bien concerné</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(x){var i=all.indexOf(x);var invoice="if(window.genererFactureDepense){genererFactureDepense("+i+")}else if(window.openDepFacture){openDepFacture("+i+")}else if(window.toast){toast(\'Facture indisponible\',\'err\')}";return '<tr><td><b>'+esc(x.libelle||x.titre||'Dépense')+'</b><br><small style="color:#64748b">'+esc(x.type||'Dépense')+'</small></td><td>'+esc(x.cat||x.categorie||'—')+'</td><td><b>'+money(x.montant)+'</b></td><td>'+esc(x.date||'—')+'</td><td><span class="gp-line"><span class="material-symbols-rounded">home</span>'+esc(x.bien||'—')+'</span></td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'depenses\','+i+')')+iconBtn('invoice','receipt_long','Générer facture',invoice)+iconBtn('edit','edit','Modifier','editRow&&editRow(\'depenses\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'depenses\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.depenses,data.length)+' sur '+data.length+' dépense'+(data.length>1?'s':'')+'</span>'+pageBtns('depenses',data.length)+'</div>':'<div class="gp-empty">Aucune dépense enregistrée</div>')+'</div></div>';
  }

  function patchTabs(){
    var oldSwitch = window.switchBienTab;
    window.switchBienTab = function(el,tab){
      if(typeof oldSwitch==='function') oldSwitch.apply(this,arguments);
      document.querySelectorAll('#page-bien-detail .bien-detail-tab').forEach(function(t){t.classList.remove('active');});
      if(el) el.classList.add('active');
    };
  }

  function install(){
    injectCSS(); patchTabs();
    /* On n'assigne PAS renderPaiementsFinal/renderDepensesFinal sur window ici :
       finance-pages-sidecards-final.js (chargé après) pose les versions finales. */
    window.renderBiensFinal = renderBiensFinal;
    window.renderBiensFinal2 = renderBiensFinal;
    window.renderBiensCards = renderBiensFinal;
    var oldRenderPage = window.renderPage;
    if(!window.__gpV38RenderPagePatched){
      window.renderPage = function(p){
        if(p==='biens') return renderBiensFinal();
        return oldRenderPage ? oldRenderPage.apply(this,arguments) : undefined;
      };
      window.__gpV38RenderPagePatched = true;
    }
    var oldNavigate = window.navigate;
    if(!window.__gpV38NavigatePatched){
      window.navigate = function(p){
        var r = oldNavigate ? oldNavigate.apply(this,arguments) : undefined;
        if(p==='biens') setTimeout(renderBiensFinal,20);
        return r;
      };
      window.__gpV38NavigatePatched = true;
    }
    var active=document.querySelector('.page.active');
    if(active){
      if(active.id==='page-biens') renderBiensFinal();
      if(active.id==='page-paiements') renderPaiementsFinal();
      if(active.id==='page-depenses') renderDepensesFinal();
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(install,120);});
  else setTimeout(install,120);
  setTimeout(install,900);
  setTimeout(install,1800);
})();
/* ===== END js/core/v38-biens-finance-restore.js ===== */


/* ===== BEGIN js/core/final-user-request-fixes.js ===== */
/* GP final fixes — dashboard spacing, bien detail click, receipt PDF robustness */
(function(){
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function money(v){
    if(v == null || v === '') return '0';
    var n = Number(String(v).replace(/[^0-9.-]/g,''));
    if(!isFinite(n)) return String(v);
    return new Intl.NumberFormat('fr-FR').format(n);
  }
  function db(){
    try{ if(window.GPDB && GPDB.load) return GPDB.load(); }catch(e){}
    return window.DB || {};
  }
  function save(){ try{ if(window.GPDB && GPDB.save) GPDB.save(window.DB); else if(window.saveDB) saveDB(); }catch(e){} }
  function showPage(id){
    var pageName = String(id||'').replace(/^page-/,'');
    try{
      document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); p.style.display=''; });
      var el = document.getElementById('page-'+pageName);
      if(el){ el.classList.add('active'); el.style.display=''; }
      window.GP_CURRENT_PAGE = pageName;
      try{ localStorage.setItem('gp_last_page', pageName); }catch(e){}
      if(window.updateGlobalBreadcrumb) window.updateGlobalBreadcrumb(pageName);
      document.querySelectorAll('.sidebar li[data-page]').forEach(function(li){ li.classList.toggle('active', li.getAttribute('data-page')===pageName); });
    }catch(e){}
  }
  function findLocataireByName(name){
    var n=String(name||'').trim().toLowerCase();
    return ((window.DB&&DB.locataires)||[]).find(function(l){
      return String((l.prenom||'')+' '+(l.nom||'')).trim().toLowerCase()===n ||
             String((l.nom||'')+' '+(l.prenom||'')).trim().toLowerCase()===n ||
             String(l.nom||'').trim().toLowerCase()===n;
    }) || {};
  }
  function resolveBienFromPayment(p){
    var locativeName=String((p&& (p.locative||p.bien)) || '').trim();
    var locs=(window.DB&&DB.locatives)||[];
    var biens=(window.DB&&DB.biens)||[];
    var lv=locs.find(function(l){return l.nom===locativeName || l.bien===locativeName || l.id===locativeName || String(l.locataire||'')===String(p&&p.locataire||'');}) || {};
    var b=biens.find(function(x){return x.nom===lv.parentBien || x.nom===lv.bien || x.nom===locativeName || x.id===lv.bien;}) || {};
    var titre = lv.bien || b.nom || locativeName || 'Bien loué';
    return {lv:lv,b:b,titre:titre,type:(b.type?b.type+' · '+titre:titre),adresse:b.adresse||lv.adresse||p.adresseBien||p.adresse||'Adresse du bien non renseignée'};
  }
  function dateFr(v){ try{ var d = window.parseGPDate ? parseGPDate(v) : new Date(v); return isNaN(d) ? (v||'—') : d.toLocaleDateString('fr-FR'); }catch(e){ return v||'—'; } }
  function monthLabel(v){ try{ var d = window.parseGPDate ? parseGPDate(v) : new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}); }catch(e){ return ''; } }
  function agence(){
    try{ if(window._getAgenceInfo) return _getAgenceInfo(); }catch(e){}
    return {agence:localStorage.getItem('geniusproperty_agence')||'Genius Property',email:localStorage.getItem('geniusproperty_email')||'contact@geniusproperty.com',tel:localStorage.getItem('geniusproperty_tel')||'',adresse:localStorage.getItem('geniusproperty_adresse')||'Dakar, Sénégal',logo:localStorage.getItem('geniusproperty_logo')||''};
  }
  function safeLogo(src){
    src=String(src||'');
    if(!src) return '';
    // html2canvas échoue souvent sur les images distantes sans CORS. On garde seulement les data/locales.
    if(/^https?:\/\//i.test(src)) return '';
    return '<img src="'+esc(src)+'" style="width:72px;height:72px;object-fit:contain;border-radius:10px;border:1px solid rgba(212,175,55,.35);padding:5px;box-sizing:border-box;background:#fff">';
  }
  window.genererRecuPaiementPDF = async function(idx){
    window.DB = db();
    var p=(DB.paiements||[])[idx];
    if(!p) return (window.toast?toast('Paiement introuvable','err'):alert('Paiement introuvable'));
    try{
      if(window.ensureHtml2Pdf) await window.ensureHtml2Pdf();
      if(!window.html2pdf) throw new Error('html2pdf indisponible');
      var ag=agence(), rel=resolveBienFromPayment(p), loc=findLocataireByName(p.locataire);
      var receiptNo=p.recuNo || ('RCP-'+new Date().getFullYear()+'-'+String(((DB.paiements||[]).length-idx)||1).padStart(4,'0'));
      p.recuNo=receiptNo; save();
      var periode=monthLabel(p.date), dateTxt=dateFr(p.date), montant=money(p.paye||p.montant)+' FCFA';
      var html='<div style="width:794px;min-height:1123px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;padding:42px 44px;box-sizing:border-box">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #D4AF37;padding-bottom:22px;margin-bottom:30px">'
        +'<div style="display:flex;gap:16px;align-items:flex-start;max-width:390px">'+safeLogo(ag.logo)+'<div><div style="font-size:25px;line-height:1.1;font-weight:900;letter-spacing:.4px">'+esc(ag.agence||'Genius Property').toUpperCase()+'</div><div style="font-size:13px;color:#666;margin-top:7px;letter-spacing:.6px;text-transform:uppercase">Gestion locative</div></div></div>'
        +'<div style="text-align:right;min-width:260px"><div style="font-size:30px;line-height:1.08;font-weight:900;color:#111">Reçu de paiement</div><div style="font-size:12px;color:#999;margin-top:12px;text-transform:uppercase;letter-spacing:.8px">N° de reçu</div><div style="font-size:18px;font-weight:900;color:#D4AF37;margin-top:5px">'+esc(receiptNo)+'</div></div></div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:60px;row-gap:28px;margin-bottom:34px">'
        +'<div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px">Locataire</div><div style="font-size:17px;font-weight:900">'+esc(p.locataire||'—')+'</div><div style="font-size:13px;color:#666;line-height:1.65;margin-top:7px">'+esc(loc.adresse||'Adresse locataire non renseignée')+'<br>'+esc(loc.tel||'')+'</div></div>'
        +'<div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px">Date de paiement</div><div style="font-size:17px;font-weight:900">'+esc(dateTxt)+'</div><div style="font-size:13px;color:#666;line-height:1.6;margin-top:7px">Période : '+esc(periode)+'</div></div>'
        +'<div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px">Bien loué</div><div style="font-size:17px;font-weight:900">'+esc(rel.type||rel.titre)+'</div><div style="font-size:13px;color:#666;line-height:1.65;margin-top:7px">'+esc(rel.adresse)+'</div></div>'
        +'<div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px">Mode de paiement</div><div style="font-size:17px;font-weight:900">'+esc(p.mode||'—')+'</div><div style="font-size:13px;color:#666;line-height:1.6;margin-top:7px">Réf. '+esc(receiptNo)+'</div></div></div>'
        +'<table style="width:100%;border-collapse:collapse;margin-bottom:30px;table-layout:fixed"><thead><tr style="background:#f8fafc;color:#444"><th style="text-align:left;padding:12px 13px;font-size:12px;text-transform:uppercase;border:1px solid #e5e7eb">Désignation</th><th style="text-align:right;width:210px;padding:12px 13px;font-size:12px;text-transform:uppercase;border:1px solid #e5e7eb">Montant</th></tr></thead><tbody><tr><td style="padding:17px 13px;border-bottom:1px solid #eee;vertical-align:top"><div style="font-size:15px;font-weight:900">Loyer mensuel — '+esc(periode)+'</div><div style="font-size:13px;color:#666;line-height:1.55;margin-top:6px">'+esc(rel.titre)+' · '+esc(rel.adresse)+'</div></td><td style="padding:17px 13px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;font-size:16px;font-weight:900;white-space:nowrap">'+esc(montant)+'</td></tr></tbody></table>'
        +'<div style="display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:21px 22px;margin-bottom:38px"><div style="font-size:16px;font-weight:900;color:#166534">TOTAL REÇU<br><span style="font-size:13px;font-weight:800">Paiement reçu ✓</span></div><div style="font-size:30px;font-weight:900;color:#111;white-space:nowrap">'+esc(montant)+'</div></div>'
        +'<div style="text-align:center;font-size:13px;color:#666;line-height:1.75;border-top:1px solid #eee;padding-top:22px;margin-top:8px"><strong style="font-size:14px;color:#555">'+esc(ag.agence||'Genius Property')+'</strong><br>'+esc(ag.adresse||'Dakar, Sénégal')+'<br>'+esc(ag.email||'')+(ag.tel?' · '+esc(ag.tel):'')+'<br><span style="font-size:12px;color:#999">Ce reçu tient lieu de quittance de loyer</span></div></div>';
      var box=document.createElement('div');
      box.style.cssText='position:fixed;left:0;top:0;width:794px;background:#fff;z-index:-1;opacity:0;pointer-events:none';
      box.innerHTML=html; document.body.appendChild(box);
      await window.html2pdf().set({margin:0,filename:'recu_paiement_'+String(receiptNo).replace(/[^a-z0-9_-]/gi,'_')+'.pdf',image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false},jsPDF:{unit:'pt',format:'a4',orientation:'portrait'}}).from(box.firstElementChild).save();
      box.remove(); if(window.toast) toast('Reçu PDF téléchargé ✓');
    }catch(e){
      console.error('[GP] Erreur génération reçu:', e);
      if(window.toast) toast('Erreur génération reçu : bibliothèque PDF ou image non compatible','err');
    }
  };
  function renderBienDetailFallback(idx){
    window.DB=db(); var b=(DB.biens||[])[idx]; if(!b) return;
    var page=document.getElementById('page-bien-detail'); if(!page) return;
    window._bienDetailIdx=idx;
    var units=Array.isArray(b.unites)?b.unites:[];
    var locs=(DB.locatives||[]).filter(function(l){return l.parentBien===b.nom || l.bien===b.nom || units.some(function(u){return String(l.bien||'').indexOf(u.nom||'')>-1;});});
    var prop=(DB.proprietaires||[]).find(function(p){var n1=String((p.nom||'')+' '+(p.prenom||'')).trim(), n2=String((p.prenom||'')+' '+(p.nom||'')).trim(); return n1===b.proprio || n2===b.proprio || p.nom===b.proprio;});
    page.innerHTML='<div class="gp-bien-detail-final">'
      +'<div class="gp-detail-head"><button class="gp-detail-back" onclick="navigate(\'biens\')"><span class="material-symbols-rounded">arrow_back</span>Retour</button><div><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="gp-detail-actions"><button onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span>Modifier</button><button class="danger" onclick="deleteBienFromDetail&&deleteBienFromDetail()"><span class="material-symbols-rounded">delete</span>Supprimer</button></div></div>'
      +'<div class="gp-detail-hero"><div class="gp-detail-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="gp-detail-card"><label>Valeur</label><strong>'+esc(b.valeur||b.prix||'—')+'</strong></div><div class="gp-detail-card"><label>Statut</label><strong>'+esc(b.statut||'—')+'</strong></div><div class="gp-detail-card"><label>État</label><strong>'+esc(b.etat||'—')+'</strong></div><div class="gp-detail-card"><label>Propriétaire</label><strong>'+esc(b.proprio||'—')+'</strong></div></div>'
      +'<div class="gp-detail-tabs"><button class="active" onclick="gpBienDetailTab(this,\'infos\')"><span class="material-symbols-rounded">info</span>Informations</button><button onclick="gpBienDetailTab(this,\'locs\')"><span class="material-symbols-rounded">groups</span>Locataires</button><button onclick="gpBienDetailTab(this,\'prop\')"><span class="material-symbols-rounded">person</span>Propriétaire</button><button onclick="gpBienDetailTab(this,\'docs\')"><span class="material-symbols-rounded">folder</span>Documents</button></div>'
      +'<section data-bd-panel="infos" class="gp-detail-panel active"><h3>Caractéristiques</h3><div class="gp-info-grid"><div><label>Type</label><b>'+esc(b.type||'—')+'</b></div><div><label>Adresse</label><b>'+esc(b.adresse||'—')+'</b></div><div><label>Vente</label><b>'+esc(b.vente||'—')+'</b></div><div><label>Nombre unités</label><b>'+esc(units.length||1)+'</b></div></div></section>'
      +'<section data-bd-panel="locs" class="gp-detail-panel"><h3>Locations liées</h3>'+(locs.length?locs.map(function(l){return '<div class="gp-line"><b>'+esc(l.locataire||l.nom||'Locataire')+'</b><span>'+esc(l.bien||b.nom)+' · '+esc(l.loyer||'—')+'</span></div>';}).join(''):'<div class="gp-empty">Aucune location liée</div>')+'</section>'
      +'<section data-bd-panel="prop" class="gp-detail-panel"><h3>Propriétaire</h3>'+(prop?'<div class="gp-info-grid"><div><label>Nom</label><b>'+esc((prop.prenom||'')+' '+(prop.nom||''))+'</b></div><div><label>Téléphone</label><b>'+esc(prop.tel||'—')+'</b></div><div><label>Email</label><b>'+esc(prop.email||'—')+'</b></div><div><label>Adresse</label><b>'+esc(prop.adresse||'—')+'</b></div></div>':'<div class="gp-empty">Propriétaire non trouvé</div>')+'</section>'
      +'<section data-bd-panel="docs" class="gp-detail-panel"><h3>Documents</h3><div id="bienDetailDocsContent"></div></section>'
      +'</div>';
    showPage('bien-detail');
    try{ if(window.renderBienDetailDocuments) renderBienDetailDocuments(); }catch(e){}
  }
  window.gpBienDetailTab=function(btn, name){
    var root=btn.closest('.gp-bien-detail-final'); if(!root) return;
    root.querySelectorAll('.gp-detail-tabs button').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active');
    root.querySelectorAll('.gp-detail-panel').forEach(function(p){p.classList.toggle('active', p.getAttribute('data-bd-panel')===name);});
  };
  var _oldOpenBien = window.openBienDetail;
  window.openBienDetail = function(idx){
    try{
      window.DB=db();
      if(typeof _oldOpenBien==='function'){
        var r=_oldOpenBien.apply(this, arguments);
        var page=document.getElementById('page-bien-detail');
        if(page && page.classList.contains('active')) return r;
      }
    }catch(e){ console.warn('[GP] Ancien détail bien indisponible, fallback:', e); }
    renderBienDetailFallback(idx);
  };
  document.addEventListener('click', function(e){
    var card=e.target.closest && e.target.closest('.gp-bien-card,.bien-card');
    if(!card || !document.getElementById('page-biens')?.classList.contains('active')) return;
    var handler=card.getAttribute('onclick')||'';
    var m=handler.match(/openBienDetail\((\d+)\)/);
    if(m){ e.preventDefault(); e.stopPropagation(); window.openBienDetail(Number(m[1])); }
  }, true);
})();
/* ===== END js/core/final-user-request-fixes.js ===== */


/* ===== BEGIN js/core/real-contract-bien-fix.js ===== */
/* GP real active fixes — contrat selects + bien detail stable back/docs */
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clean(v){return String(v==null?'':v).trim();}
  function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}');}catch(e){} return window.DB||{};}
  function setDb(d){window.DB=d;try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){} try{if(window.GPDB&&GPDB.save)GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){} }
  function arr(k){var d=db(); return Array.isArray(d[k])?d[k]:[];}
  function fullName(x){return clean([x.prenom||x.firstName||x.firstname, x.nom||x.lastName||x.lastname].filter(Boolean).join(' ')) || clean(x.name||x.fullName||x.libelle||x.email||x.tel||x.telephone||'');}
  function locLabel(l,i){var n=fullName(l); return n || ('Locataire '+(i+1));}
  function bienLabel(b,i){return clean(b.nom||b.name||b.titre||b.libelle) || ('Bien '+(i+1));}
  function locationLabel(l,i){return clean(l.nom||l.libelle||l.location||l.locative) || clean([l.bien||l.parentBien, l.unite||l.appartement].filter(Boolean).join(' - ')) || ('Location '+(i+1));}
  function money(v){ if(!v) return ''; if(/FCFA|€|\$/i.test(String(v))) return String(v); var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.')); return isFinite(n)&&n>0?Math.round(n).toLocaleString('fr-FR')+' FCFA':String(v); }
  function toast(m,t){ if(window.toast) window.toast(m,t); else console[(t==='err'?'error':'log')](m); }
  function ensureSelect(id, placeholder, optionsHtml, onchange){
    var el=document.getElementById(id); if(!el) return null;
    var value=el.value||'';
    if(el.tagName.toLowerCase()!=='select'){
      var sel=document.createElement('select');
      sel.id=el.id; sel.className=el.className; sel.name=el.name||''; sel.required=el.required; sel.setAttribute('data-gp-real-select','1');
      el.parentNode.replaceChild(sel,el); el=sel;
    }
    el.innerHTML='<option value="">'+esc(placeholder)+'</option>'+optionsHtml;
    if(value){ var has=[].slice.call(el.options).some(function(o){return o.value===value;}); if(has) el.value=value; }
    if(onchange){ el.onchange=onchange; }
    return el;
  }
  function locOptions(){return arr('locataires').map(function(l,i){var label=locLabel(l,i);var tel=clean(l.tel||l.telephone||l.phone||l.mobile||'');var email=clean(l.email||'');return '<option value="'+esc(label)+'" data-index="'+i+'" data-tel="'+esc(tel)+'" data-email="'+esc(email)+'">'+esc(label)+(tel?' · '+esc(tel):'')+'</option>';}).join('');}
  function bienOptions(){return arr('biens').map(function(b,i){var label=bienLabel(b,i);return '<option value="'+esc(label)+'" data-index="'+i+'" data-loyer="'+esc(b.loyer||b.valeur||b.prix||'')+'">'+esc(label)+'</option>';}).join('');}
  function locationOptions(filterLoc){var fl=clean(filterLoc).toLowerCase();return arr('locatives').map(function(l,i){var loc=clean(l.locataire||l.occupant||''); if(fl && loc.toLowerCase()!==fl) return ''; var label=locationLabel(l,i); return '<option value="'+esc(label)+'" data-index="'+i+'" data-locataire="'+esc(loc)+'" data-bien="'+esc(l.bien||l.parentBien||'')+'" data-loyer="'+esc(l.loyer||l.montant||'')+'">'+esc(label)+(loc?' · '+esc(loc):'')+'</option>';}).join('');}
  function propOptions(){return arr('proprietaires').map(function(p,i){var label=fullName(p)||('Propriétaire '+(i+1));return '<option value="'+esc(label)+'" data-index="'+i+'">'+esc(label)+'</option>';}).join('');}

  function patchContratDrawer(){
    var locSel=ensureSelect('gp-c-locataire','Sélectionner un locataire existant',locOptions(),function(){
      var v=this.value; var locative=ensureSelect('gp-c-locative','Sélectionner une location existante',locationOptions(v),syncContratLocative);
      if(locative && locative.options.length===2){ locative.selectedIndex=1; syncContratLocative.call(locative); }
    });
    ensureSelect('gp-c-locative','Sélectionner une location existante',locationOptions(locSel&&locSel.value),syncContratLocative);
    function syncContratLocative(){
      var opt=this.options[this.selectedIndex]; if(!opt) return;
      var loc=opt.dataset.locataire||''; var loyer=opt.dataset.loyer||'';
      var ls=document.getElementById('gp-c-locataire'); if(ls && loc) ls.value=loc;
      var lo=document.getElementById('gp-c-loyer'); if(lo && loyer && !lo.value) lo.value=money(loyer);
      var p=document.getElementById('gp-c-prochain'); if(p && !p.value) p.value=new Date().toISOString().slice(0,10);
      var d=document.getElementById('gp-c-debut'); if(d && !d.value) d.value=new Date().toISOString().slice(0,10);
    }
    // Legacy formulaire ids aussi, si une autre version du formulaire est ouverte
    var ctLoc=ensureSelect('ct-locataire','Sélectionner un locataire existant',locOptions(),function(){ensureSelect('ct-locative','Sélectionner une location existante',locationOptions(this.value),function(){syncLegacyContrat(this);});});
    ensureSelect('ct-locative','Sélectionner une location existante',locationOptions(ctLoc&&ctLoc.value),function(){syncLegacyContrat(this);});
    function syncLegacyContrat(sel){var opt=sel.options[sel.selectedIndex]; if(!opt) return; var l=document.getElementById('ct-locataire'); if(l&&opt.dataset.locataire) l.value=opt.dataset.locataire; var lo=document.getElementById('ct-loyer'); if(lo&&opt.dataset.loyer) lo.value=money(opt.dataset.loyer);}
  }
  function patchOtherRelationSelects(){
    ensureSelect('gp-b-proprio','Sélectionner un propriétaire existant',propOptions());
    ensureSelect('gp-l-bien','Sélectionner un bien existant',bienOptions(),function(){var opt=this.options[this.selectedIndex]; var lo=document.getElementById('gp-l-loyer'); if(lo&&opt&&opt.dataset.loyer&&!lo.value) lo.value=money(opt.dataset.loyer);});
    ensureSelect('gp-l-locataire','Sélectionner un locataire existant',locOptions(),function(){var opt=this.options[this.selectedIndex]; var tel=document.getElementById('gp-l-tel'); if(tel&&opt) tel.value=opt.dataset.tel||opt.dataset.email||'';});
    patchContratDrawer();
  }

  var oldOpen=window.openGpDrawer;
  window.openGpDrawer=function(kind){
    var r=oldOpen?oldOpen.apply(this,arguments):undefined;
    setTimeout(function(){ patchOtherRelationSelects(); if(kind==='contrat') patchContratDrawer(); },0);
    setTimeout(function(){ patchOtherRelationSelects(); if(kind==='contrat') patchContratDrawer(); },120);
    return r;
  };
  document.addEventListener('focusin',function(e){ if(e.target && /^(gp-c-|ct-|gp-l-|gp-b-proprio)/.test(e.target.id||'')) setTimeout(patchOtherRelationSelects,0); });
  document.addEventListener('click',function(e){ if(e.target && e.target.closest && e.target.closest('#gpDrawer,#page-nv-contrat,#page-nv-locative,#page-nv-bien')) setTimeout(patchOtherRelationSelects,0); },true);

  function showBiens(){
    try{document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});  var pg=document.getElementById('page-biens'); if(pg){pg.classList.add('active');pg.style.display='';} window.GP_CURRENT_PAGE='biens'; localStorage.setItem('gp_last_page','biens'); if(window.updateGlobalBreadcrumb) window.updateGlobalBreadcrumb('biens'); if(window.renderBiensFinal) window.renderBiensFinal(); else if(window.renderBiensCards) window.renderBiensCards();}catch(e){ if(window.navigate) window.navigate('biens'); }
  }
  window.gpBackToBiens=function(){ showBiens(); };
  function saveDocs(idx, docs){var d=db(); if(!Array.isArray(d.biens)) return; if(!d.biens[idx]) return; d.biens[idx].documents=docs; setDb(d);}
  function getDocs(idx){var b=arr('biens')[idx]; if(!b) return []; if(!Array.isArray(b.documents)) b.documents=[]; return b.documents;}
  window.gpAddBienDocReal=function(){var idx=Number(window._bienDetailIdx); var f=document.getElementById('gpRealBienDocFile'); var n=document.getElementById('gpRealBienDocName'); var file=f&&f.files&&f.files[0]; if(!file){toast('Choisissez un fichier','err');return;} var name=clean(n&&n.value)||file.name; var reader=new FileReader(); reader.onload=function(){var docs=getDocs(idx); docs.push({id:'DOC-'+Date.now(),nom:name,fileName:file.name,type:file.type,size:file.size,data:reader.result,date:new Date().toISOString()}); saveDocs(idx,docs); window.openBienDetail(idx,'docs'); toast('Document ajouté ✓');}; reader.readAsDataURL(file);};
  window.gpPreviewBienDocReal=function(i){var d=getDocs(Number(window._bienDetailIdx))[i]; if(!d||!d.data)return; var w=window.open('','_blank'); if(!w){toast('Popup bloquée','err');return;} if(String(d.type||'').indexOf('image/')===0) w.document.write('<img src="'+d.data+'" style="max-width:100%;height:auto">'); else w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:0"></iframe>');};
  window.gpDownloadBienDocReal=function(i){var d=getDocs(Number(window._bienDetailIdx))[i]; if(!d||!d.data)return; var a=document.createElement('a'); a.href=d.data; a.download=d.fileName||d.nom||'document'; document.body.appendChild(a); a.click(); a.remove();};
  window.gpDeleteBienDocReal=function(i){if(!confirm('Supprimer ce document ?'))return; var idx=Number(window._bienDetailIdx); var docs=getDocs(idx); docs.splice(i,1); saveDocs(idx,docs); window.openBienDetail(idx,'docs');};
  window.gpShowBienPanelReal=function(tab,btn){document.querySelectorAll('.gp-real-bd-panel').forEach(function(p){p.style.display=(p.dataset.panel===tab?'block':'none');}); document.querySelectorAll('.gp-real-bd-tabs button').forEach(function(b){b.classList.remove('active');}); if(btn)btn.classList.add('active');};

  window.openBienDetail=function(idx,tab){
    idx=Number(idx); var b=arr('biens')[idx]; if(!b){toast('Bien introuvable','err');return;} window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page){toast('Page détail bien introuvable','err');return;}
    var propName=clean(b.proprio||b.proprietaire||b.owner||'');
    var prop=arr('proprietaires').find(function(p){var n=fullName(p); return n===propName || clean(p.nom)===propName;});
    var locs=arr('locatives').filter(function(l){var lb=clean(l.bien||l.parentBien||l.locative||''); return lb===clean(b.nom)||lb.indexOf(clean(b.nom))!==-1;});
    var docs=getDocs(idx);
    var docsHtml='<div class="gp-real-doc-add"><input id="gpRealBienDocName" placeholder="Nom du document"><input id="gpRealBienDocFile" type="file"><button onclick="gpAddBienDocReal()"><span class="material-symbols-rounded">upload_file</span> Ajouter</button></div>'+(docs.length?docs.map(function(d,i){return '<div class="gp-real-doc-row"><span class="material-symbols-rounded">folder</span><div><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+'</small></div><button onclick="gpPreviewBienDocReal('+i+')"><span class="material-symbols-rounded">visibility</span></button><button onclick="gpDownloadBienDocReal('+i+')"><span class="material-symbols-rounded">download</span></button><button class="danger" onclick="gpDeleteBienDocReal('+i+')"><span class="material-symbols-rounded">delete</span></button></div>';}).join(''):'<div class="gp-real-empty">Aucun document ajouté</div>');
    page.innerHTML='<div class="gp-real-bd"><div class="gp-real-bd-head"><button class="gp-real-back" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="gp-real-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="gp-real-head-actions"><button onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button class="danger" onclick="delRow&&delRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div><div class="gp-real-hero"><div class="gp-real-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="gp-real-kpis"><div><small>Valeur</small><b>'+esc(b.valeur||b.prix||'—')+'</b></div><div><small>Statut</small><b>'+esc(b.statut||'—')+'</b></div><div><small>Propriétaire</small><b>'+esc(propName||'—')+'</b></div></div></div><div class="gp-real-bd-tabs"><button class="active" onclick="gpShowBienPanelReal(\'infos\',this)">Informations</button><button onclick="gpShowBienPanelReal(\'locs\',this)">Locataires</button><button onclick="gpShowBienPanelReal(\'prop\',this)">Propriétaire</button><button onclick="gpShowBienPanelReal(\'docs\',this)">Documents bien</button></div><section class="gp-real-bd-panel" data-panel="infos"><div class="gp-real-grid"><div><label>Nom</label><b>'+esc(b.nom||'—')+'</b></div><div><label>Type</label><b>'+esc(b.type||'—')+'</b></div><div><label>Adresse</label><b>'+esc(b.adresse||'—')+'</b></div><div><label>État</label><b>'+esc(b.etat||'—')+'</b></div><div><label>Nombre appartements</label><b>'+esc((b.unites&&b.unites.length)||b.nbAppart||'—')+'</b></div><div><label>Valeur</label><b>'+esc(b.valeur||b.prix||'—')+'</b></div></div></section><section class="gp-real-bd-panel" data-panel="locs" style="display:none">'+(locs.length?locs.map(function(l){return '<div class="gp-real-line"><b>'+esc(l.locataire||l.occupant||'Locataire')+'</b><span>'+esc(locationLabel(l,0))+' · '+esc(l.loyer||l.montant||'—')+'</span></div>';}).join(''):'<div class="gp-real-empty">Aucun locataire lié à ce bien</div>')+'</section><section class="gp-real-bd-panel" data-panel="prop" style="display:none">'+(prop?'<div class="gp-real-grid"><div><label>Nom</label><b>'+esc(fullName(prop))+'</b></div><div><label>Téléphone</label><b>'+esc(prop.tel||prop.telephone||'—')+'</b></div><div><label>Email</label><b>'+esc(prop.email||'—')+'</b></div><div><label>Adresse</label><b>'+esc(prop.adresse||'—')+'</b></div></div>':'<div class="gp-real-empty">Propriétaire non trouvé dans la base</div>')+'</section><section class="gp-real-bd-panel" data-panel="docs" style="display:none">'+docsHtml+'</section></div>';
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});  page.classList.add('active'); page.style.display='';  window.GP_CURRENT_PAGE='bien-detail'; if(window.updateGlobalBreadcrumb) window.updateGlobalBreadcrumb('bien-detail');
    if(tab==='docs') setTimeout(function(){var b=document.querySelector('.gp-real-bd-tabs button:nth-child(4)'); if(b)b.click();},20);
  };

  var css='.gp-real-bd{padding:24px 32px}.gp-real-bd-head{display:flex;align-items:center;gap:14px;margin-bottom:18px}.gp-real-title{flex:1}.gp-real-title h2{margin:0;font-size:22px}.gp-real-title p{margin:3px 0 0;color:#64748b}.gp-real-back,.gp-real-head-actions button{border:1px solid #e5e7eb;background:#fff;border-radius:12px;height:40px;padding:0 13px;display:inline-flex;align-items:center;gap:7px;font-weight:850;cursor:pointer}.gp-real-head-actions{display:flex;gap:8px}.gp-real-head-actions .danger,.gp-real-doc-row .danger{color:#dc2626}.gp-real-hero{display:flex;gap:16px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:16px;box-shadow:0 10px 30px rgba(15,23,42,.04)}.gp-real-photo{width:170px;height:125px;border-radius:16px;background:#fffaf0;display:grid;place-items:center;overflow:hidden}.gp-real-photo img{width:100%;height:100%;object-fit:cover}.gp-real-photo span{font-size:52px;color:#d4af37}.gp-real-kpis{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-content:center}.gp-real-kpis div,.gp-real-grid div{background:#f8fafc;border:1px solid #eef2f7;border-radius:14px;padding:13px}.gp-real-kpis small,.gp-real-grid label{display:block;color:#64748b;font-size:12px;margin-bottom:5px}.gp-real-bd-tabs{display:flex;gap:8px;margin:18px 0}.gp-real-bd-tabs button{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:10px 15px;font-weight:850;cursor:pointer}.gp-real-bd-tabs button.active{background:#111827;color:#fff}.gp-real-bd-panel{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:16px}.gp-real-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.gp-real-line,.gp-real-doc-row{display:flex;align-items:center;gap:12px;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-bottom:10px}.gp-real-line span,.gp-real-doc-row small{color:#64748b}.gp-real-doc-row>div{flex:1}.gp-real-doc-row>span{color:#d4af37}.gp-real-doc-row button{width:34px;height:34px;border:1px solid #e5e7eb;background:#fff;border-radius:10px;display:grid;place-items:center;cursor:pointer}.gp-real-doc-add{display:flex;gap:10px;margin-bottom:14px}.gp-real-doc-add input{border:1px solid #e5e7eb;border-radius:10px;padding:10px}.gp-real-doc-add button{border:0;background:#2563eb;color:#fff;border-radius:10px;padding:0 14px;font-weight:850;display:inline-flex;align-items:center;gap:6px}.gp-real-empty{border:1px dashed #d1d5db;border-radius:14px;padding:20px;color:#64748b;background:#f8fafc}';
  if(!document.getElementById('gp-real-contract-bien-css')){var st=document.createElement('style');st.id='gp-real-contract-bien-css';st.textContent=css;document.head.appendChild(st);}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(patchOtherRelationSelects,300);setTimeout(patchOtherRelationSelects,1000);});
})();
/* ===== END js/core/real-contract-bien-fix.js ===== */


/* ===== BEGIN js/core/bien-detail-restored-active-final.js ===== */
/* GP — forced restored active bien detail view (final override) */
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clean(v){return String(v==null?'':v).trim();}
  function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');}
  function db(){ try{ if(window.GPDB&&GPDB.load){ var d=GPDB.load(); if(d){ window.DB=d; return d; } } }catch(e){} window.DB=window.DB||{}; return window.DB; }
  function arr(k){ var d=db(); return Array.isArray(d[k])?d[k]:[]; }
  function save(){ try{ if(window.GPDB&&GPDB.save) GPDB.save(window.DB); else if(window.saveDB) window.saveDB(); }catch(e){} }
  function money(v){ if(v==null||v==='') return '—'; var s=String(v); var n=Number(s.replace(/[^0-9.-]/g,'')); if(!isFinite(n)) return esc(s); return new Intl.NumberFormat('fr-FR').format(n)+' FCFA'; }
  function dateFr(v){ if(!v) return '—'; try{ var d=new Date(v); return isNaN(d)?esc(v):d.toLocaleDateString('fr-FR'); }catch(e){return esc(v);} }
  function fullName(o){ return clean([o&&o.prenom,o&&o.nom].filter(Boolean).join(' ')) || clean(o&&o.nom) || clean(o&&o.name) || clean(o&&o.fullName); }
  function ownerOf(b){
    var owners=arr('proprietaires');
    var keys=[b.proprietaireId,b.ownerId,b.proprioId,b.proprietaire,b.proprio,b.owner,b.nomProprietaire].map(norm).filter(Boolean);
    return owners.find(function(p){
      var vals=[p.id,p.uid,p.key,p.email,p.tel,p.phone,p.nom,fullName(p),[p.nom,p.prenom].filter(Boolean).join(' ')].map(norm);
      return keys.some(function(k){return vals.indexOf(k)>-1;});
    }) || null;
  }
  function bienUnitNames(b){
    var units=Array.isArray(b.unites)?b.unites:(Array.isArray(b.appartements)?b.appartements:[]);
    if(units.length) return units.map(function(u,i){ var n=clean(u.nom||u.name||u.libelle||('Appartement '+(i+1))); return {id:u.id||u.uid||n, nom:n, full:(clean(b.nom)?clean(b.nom)+' - '+n:n), raw:u}; });
    var count=Number(b.nombreUnites||b.nbUnites||b.unitesCount||b.nombre_appartements||0);
    if(count>1){ var out=[]; for(var i=1;i<=count;i++) out.push({id:'apt'+i,nom:'Appartement '+i,full:(clean(b.nom)?clean(b.nom)+' - Appartement '+i:'Appartement '+i),raw:{}}); return out; }
    return [{id:'main',nom:clean(b.nom)||'Bien',full:clean(b.nom)||'Bien',raw:b}];
  }
  function locativesForBien(b){
    var bkeys=[b.id,b.uid,b.key,b.nom,b.reference].map(norm).filter(Boolean);
    return arr('locatives').filter(function(l){
      var vals=[l.bienId,l.idBien,l.parentBienId,l.parentId,l.parentBien,l.bien,l.nomBien,l.location,l.locative,l.nom].map(norm);
      return vals.some(function(v){ return v && (bkeys.indexOf(v)>-1 || bkeys.some(function(k){ return v.indexOf(k)>-1 || k.indexOf(v)>-1; })); });
    });
  }
  function locataireOf(nameOrId){
    var k=norm(nameOrId); if(!k) return null;
    return arr('locataires').find(function(l){ return [l.id,l.uid,l.key,l.email,l.tel,l.phone,l.nom,fullName(l),[l.nom,l.prenom].filter(Boolean).join(' ')].map(norm).indexOf(k)>-1; }) || null;
  }
  function statusFor(b){
    var locs=locativesForBien(b).filter(function(l){ return norm(l.statut||l.status||'actif').indexOf('resil')<0 && norm(l.statut||l.status||'actif').indexOf('termine')<0; });
    var units=bienUnitNames(b);
    if(units.length>1){
      var occupied=locs.length;
      units.forEach(function(u){ if(norm(u.raw&&u.raw.statut).indexOf('lou')>-1) occupied=Math.max(occupied,1); });
      if(occupied<=0) return 'Disponible';
      if(occupied>=units.length) return 'Loué';
      return 'Partiellement loué';
    }
    if(locs.length || norm(b.statut).indexOf('lou')>-1) return 'Loué';
    return clean(b.statut)||'Disponible';
  }
  function statusBadge(st){
    var n=norm(st), cls=n.indexOf('part')>-1?'partial':(n.indexOf('lou')>-1?'ok':(n.indexOf('att')>-1?'wait':'free'));
    return '<span class="bd-status '+cls+'">'+esc(st||'Disponible')+'</span>';
  }
  function unitRows(b){
    var locs=locativesForBien(b), units=bienUnitNames(b);
    if(!units.length) units=[{nom:clean(b.nom)||'Bien',full:clean(b.nom)||'Bien',raw:b}];
    return units.map(function(u){
      var uk=[u.id,u.nom,u.full].map(norm);
      var l=locs.find(function(x){ var vals=[x.uniteId,x.unite,x.appartement,x.bien,x.location,x.nom].map(norm); return vals.some(function(v){ return v && (uk.indexOf(v)>-1 || uk.some(function(k){return v.indexOf(k)>-1 || k.indexOf(v)>-1;})); }); }) || (units.length===1?locs[0]:null);
      var loc=locataireOf(l&&(l.locataireId||l.idLocataire||l.locataire)) || {};
      var name=l ? (l.locataire||fullName(loc)||'Locataire') : (u.raw&&u.raw.locataire)||'';
      var tel=(loc&& (loc.tel||loc.phone||loc.telephone)) || (l&&(l.tel||l.telephone)) || '';
      var entree=(l&&(l.dateEntree||l.date_entree||l.debut||l.dateDebut)) || (u.raw&&u.raw.dateEntree) || '';
      var loyer=(l&&(l.loyer||l.montant||l.prix)) || (u.raw&&u.raw.loyer) || b.loyer || '';
      var st=l||name ? 'Loué' : (clean(u.raw&&u.raw.statut)||'Disponible');
      return '<div class="bd-loc-row">'
        +'<div class="bd-loc-head"><span class="material-symbols-rounded">door_front</span><b>'+esc(u.nom)+'</b>'+statusBadge(st)+'</div>'
        +'<div class="bd-loc-grid">'
        +'<div><small>Locataire</small><strong>'+(name?esc(name):'Aucun locataire')+'</strong></div>'
        +'<div><small>Téléphone</small><strong>'+esc(tel||'—')+'</strong></div>'
        +'<div><small>Loyer</small><strong>'+money(loyer)+'</strong></div>'
        +'<div><small>Date entrée</small><strong>'+dateFr(entree)+'</strong></div>'
        +'</div></div>';
    }).join('');
  }
  function showPage(page){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});
    var el=document.getElementById('page-'+page); if(el){el.classList.add('active');el.style.display='';}
    window.GP_CURRENT_PAGE=page; try{localStorage.setItem('gp_last_page',page);}catch(e){}
    if(window.updateGlobalBreadcrumb) window.updateGlobalBreadcrumb(page);
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){li.classList.toggle('active',li.dataset.page===(page==='bien-detail'?'biens':page));});
  }
  window.gpBackToBiens=function(){ showPage('biens'); try{ if(window.renderBiensFinal) renderBiensFinal(); else if(window.gpV38Page) gpV38Page('biens',1); else if(window.renderBiensCards) renderBiensCards(); }catch(e){} };
  window.gpBienTab=function(tab){
    document.querySelectorAll('.bd-tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
    document.querySelectorAll('.bd-panel').forEach(function(p){p.style.display=p.dataset.panel===tab?'block':'none';});
  };
  function docsFor(b){ if(!Array.isArray(b.documents)) b.documents=[]; return b.documents; }
  window.gpAddBienDocumentFinal=function(){
    var idx=Number(window._bienDetailIdx), b=arr('biens')[idx]; if(!b) return;
    var f=document.getElementById('bdFinalDocFile'); var file=f&&f.files&&f.files[0];
    var name=clean((document.getElementById('bdFinalDocName')||{}).value) || (file&&file.name) || 'Document';
    if(!file){ if(window.toast) toast('Choisissez un fichier','err'); return; }
    var r=new FileReader(); r.onload=function(){ docsFor(b).push({id:'BDOC-'+Date.now(),nom:name,fileName:file.name,type:file.type||'application/octet-stream',size:file.size||0,data:r.result,date:new Date().toISOString()}); save(); window.openBienDetail(idx,'docs'); if(window.toast) toast('Document ajouté ✓');}; r.readAsDataURL(file);
  };
  window.gpDeleteBienDocumentFinal=function(i){ var idx=Number(window._bienDetailIdx), b=arr('biens')[idx]; if(!b) return; if(!confirm('Supprimer ce document ?')) return; docsFor(b).splice(i,1); save(); window.openBienDetail(idx,'docs'); };
  function docsHtml(b){ var docs=docsFor(b); return '<div class="bd-doc-add"><input id="bdFinalDocName" placeholder="Nom du document"><input id="bdFinalDocFile" type="file"><button onclick="gpAddBienDocumentFinal()"><span class="material-symbols-rounded">add</span>Ajouter</button></div>'+
    (docs.length?'<div class="bd-doc-list">'+docs.map(function(d,i){return '<div class="bd-doc-card"><div class="bd-doc-ico"><span class="material-symbols-rounded">folder</span></div><div class="bd-doc-meta"><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'fichier')+' · '+dateFr(d.date||d.createdAt)+'</small></div><div class="bd-doc-actions">'+(d.data?'<a href="'+esc(d.data)+'" target="_blank" title="Voir"><span class="material-symbols-rounded">visibility</span></a><a href="'+esc(d.data)+'" download="'+esc(d.fileName||'document')+'" title="Télécharger"><span class="material-symbols-rounded">download</span></a>':'')+'<button onclick="gpDeleteBienDocumentFinal('+i+')" title="Supprimer"><span class="material-symbols-rounded">delete</span></button></div></div>';}).join('')+'</div>':'<div class="bd-empty"><span class="material-symbols-rounded">folder_open</span><b>Aucun document</b><small>Ajoutez les titres, contrats, plans ou pièces liées à ce bien.</small></div>'); }
  function ownerHtml(b){ var p=ownerOf(b); if(!p) return '<div class="bd-empty"><span class="material-symbols-rounded">person_off</span><b>Propriétaire non trouvé</b><small>'+esc(b.proprio||b.proprietaire||'Aucun propriétaire lié')+'</small></div>'; var n=fullName(p); return '<div class="bd-owner"><div class="bd-owner-avatar">'+(p.photo?'<img src="'+esc(p.photo)+'">':esc((n||'?').charAt(0).toUpperCase()))+'</div><div><h3>'+esc(n||'Propriétaire')+'</h3><p>Propriétaire du bien</p></div></div><div class="bd-info-grid"><div><small>Téléphone</small><strong>'+esc(p.tel||p.phone||p.telephone||'—')+'</strong></div><div><small>Email</small><strong>'+esc(p.email||'—')+'</strong></div><div><small>Adresse</small><strong>'+esc(p.adresse||'—')+'</strong></div><div><small>Nombre de biens</small><strong>'+arr('biens').filter(function(x){return ownerOf(x)===p || norm(x.proprio||x.proprietaire)===norm(n);}).length+'</strong></div></div>'; }
  window.openBienDetail=function(idx,tab){
    window.DB=db(); idx=Number(idx); var b=arr('biens')[idx]; if(!b){ if(window.toast) toast('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx; var page=document.getElementById('page-bien-detail'); if(!page){ if(window.toast) toast('Page détail bien introuvable','err'); return; }
    var owner=ownerOf(b), st=statusFor(b), units=bienUnitNames(b), locs=locativesForBien(b);
    page.innerHTML='<div class="bd-restored">'
      +'<div class="bd-head"><button class="bd-btn" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span>Retour</button><div class="bd-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-actions"><button class="bd-btn primary" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span>Modifier</button><button class="bd-btn danger" onclick="deleteRow&&deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span>Supprimer</button></div></div>'
      +'<div class="bd-hero"><div class="bd-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-hero-info"><div>'+statusBadge(st)+'</div><h1>'+esc(b.nom||'—')+'</h1><p><span class="material-symbols-rounded">location_on</span>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-kpis"><div><small>Valeur / Loyer</small><b>'+money(b.valeur||b.prix||b.loyer)+'</b></div><div><small>Unités</small><b>'+units.length+'</b></div><div><small>Locations</small><b>'+locs.length+'</b></div></div></div></div>'
      +'<div class="bd-tabs"><button class="bd-tab active" data-tab="infos" onclick="gpBienTab(\'infos\')"><span class="material-symbols-rounded">info</span>Informations</button><button class="bd-tab" data-tab="locataires" onclick="gpBienTab(\'locataires\')"><span class="material-symbols-rounded">groups</span>Locataires</button><button class="bd-tab" data-tab="proprio" onclick="gpBienTab(\'proprio\')"><span class="material-symbols-rounded">person</span>Propriétaire</button><button class="bd-tab" data-tab="docs" onclick="gpBienTab(\'docs\')"><span class="material-symbols-rounded">folder</span>Documents</button></div>'
      +'<section class="bd-panel" data-panel="infos"><h3>Caractéristiques</h3><div class="bd-info-grid"><div><small>Type</small><strong>'+esc(b.type||'—')+'</strong></div><div><small>Adresse</small><strong>'+esc(b.adresse||'—')+'</strong></div><div><small>Vente</small><strong>'+esc(b.vente||'Non')+'</strong></div><div><small>Nombre unités</small><strong>'+units.length+'</strong></div><div><small>Statut calculé</small><strong>'+esc(st)+'</strong></div><div><small>Propriétaire</small><strong>'+esc(owner?fullName(owner):(b.proprio||b.proprietaire||'—'))+'</strong></div></div></section>'
      +'<section class="bd-panel" data-panel="locataires" style="display:none"><h3>Locataires et occupations</h3>'+unitRows(b)+'</section>'
      +'<section class="bd-panel" data-panel="proprio" style="display:none"><h3>Propriétaire</h3>'+ownerHtml(b)+'</section>'
      +'<section class="bd-panel" data-panel="docs" style="display:none"><h3>Documents du bien</h3>'+docsHtml(b)+'</section></div>';
    showPage('bien-detail');
    gpBienTab(tab||'infos');
  };
  if(window.GPNavigation&&GPNavigation.registerRenderer){ GPNavigation.registerRenderer('bien-detail',function(){ if(Number.isFinite(Number(window._bienDetailIdx))&&Number(window._bienDetailIdx)>=0) window.openBienDetail(Number(window._bienDetailIdx)); }); }
  var css=document.createElement('style'); css.id='gp-bien-detail-restored-active-final-css'; css.textContent='\
  #page-bien-detail{padding:18px 22px 40px!important;background:#f5f6f8!important}.bd-restored{display:block}.bd-head,.bd-hero,.bd-tabs,.bd-panel{background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 10px 30px rgba(15,23,42,.05)}.bd-head{display:flex;align-items:center;gap:14px;padding:14px;margin-bottom:14px}.bd-title{flex:1}.bd-title h2{margin:0;font-size:22px;font-weight:950}.bd-title p{margin:3px 0 0;color:#64748b;font-weight:600}.bd-actions{display:flex;gap:8px}.bd-btn{height:38px;border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:0 13px;display:inline-flex;align-items:center;gap:7px;font-weight:900;cursor:pointer;color:#111827}.bd-btn span{font-size:19px;color:#d4a511}.bd-btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}.bd-btn.primary span{color:#fff}.bd-btn.danger{background:#fff1f2;color:#e11d48;border-color:#fecdd3}.bd-btn.danger span{color:#e11d48}.bd-hero{display:grid;grid-template-columns:190px 1fr;gap:18px;padding:18px;margin-bottom:14px}.bd-photo{height:145px;border-radius:16px;background:#f8fafc;display:grid;place-items:center;overflow:hidden;border:1px solid #edf2f7}.bd-photo img{width:100%;height:100%;object-fit:cover}.bd-photo>span{font-size:58px;color:#d4a511}.bd-hero-info h1{margin:10px 0 6px;font-size:25px;font-weight:950}.bd-hero-info p{margin:0;color:#64748b;display:flex;align-items:center;gap:7px;font-weight:700}.bd-hero-info p span{font-size:18px;color:#d4a511}.bd-status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:950}.bd-status.ok{background:#dcfce7;color:#166534}.bd-status.free{background:#dbeafe;color:#1d4ed8}.bd-status.partial{background:#fef3c7;color:#92400e}.bd-status.wait{background:#fef3c7;color:#92400e}.bd-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.bd-kpis div,.bd-info-grid>div{background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:12px}.bd-kpis small,.bd-info-grid small,.bd-loc-grid small{display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:900;margin-bottom:5px}.bd-kpis b,.bd-info-grid strong,.bd-loc-grid strong{font-size:15px;font-weight:950;color:#0f172a}.bd-tabs{display:flex;gap:10px;padding:9px;margin-bottom:14px}.bd-tab{height:44px;border:0;background:transparent;border-radius:13px;padding:0 14px;display:inline-flex;align-items:center;gap:8px;font-weight:950;color:#64748b;cursor:pointer}.bd-tab span{font-size:20px;color:#d4a511}.bd-tab.active{background:#fff7dd;color:#b98200}.bd-panel{padding:18px;margin-bottom:14px}.bd-panel h3{margin:0 0 14px;font-size:16px;font-weight:950}.bd-info-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.bd-loc-row{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin-bottom:10px}.bd-loc-head{display:flex;align-items:center;gap:9px;margin-bottom:12px}.bd-loc-head>span{color:#d4a511}.bd-loc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.bd-loc-grid>div{background:#f8fafc;border-radius:12px;padding:11px}.bd-owner{display:flex;align-items:center;gap:14px;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;padding:15px;margin-bottom:12px}.bd-owner-avatar{width:62px;height:62px;border-radius:17px;background:linear-gradient(135deg,#d4af37,#ffe38a);display:grid;place-items:center;font-size:25px;font-weight:950;overflow:hidden}.bd-owner-avatar img{width:100%;height:100%;object-fit:cover}.bd-owner h3{margin:0;font-size:19px;font-weight:950}.bd-owner p{margin:4px 0 0;color:#64748b}.bd-empty{display:grid;place-items:center;text-align:center;gap:6px;border:1px dashed #cbd5e1;border-radius:16px;padding:28px;background:#fbfdff;color:#94a3b8}.bd-empty span{font-size:42px;color:#d4a511}.bd-empty b{color:#475569}.bd-doc-add{display:flex;gap:10px;align-items:center;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;padding:12px;margin-bottom:12px}.bd-doc-add input{height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;background:#fff}.bd-doc-add input:first-child{flex:1}.bd-doc-add button{height:40px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-weight:950;padding:0 14px;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.bd-doc-add button span{font-size:18px}.bd-doc-card{display:flex;align-items:center;gap:12px;border:1px solid #e5e7eb;background:#fff;border-radius:15px;padding:12px;margin-bottom:9px}.bd-doc-ico{width:42px;height:42px;border-radius:13px;background:#fff7dd;display:grid;place-items:center}.bd-doc-ico span{color:#d4a511}.bd-doc-meta{flex:1;min-width:0}.bd-doc-meta b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd-doc-meta small{display:block;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd-doc-actions{display:flex;gap:7px}.bd-doc-actions a,.bd-doc-actions button{width:35px;height:35px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;display:grid;place-items:center;cursor:pointer;text-decoration:none}.bd-doc-actions span{font-size:19px;color:#d4a511}.bd-doc-actions button span{color:#ef4444}@media(max-width:900px){.bd-head{flex-direction:column;align-items:stretch}.bd-actions{flex-wrap:wrap}.bd-hero{grid-template-columns:1fr}.bd-info-grid,.bd-loc-grid,.bd-kpis{grid-template-columns:1fr}.bd-tabs{overflow-x:auto}.bd-doc-add{flex-direction:column;align-items:stretch}}';
  document.head.appendChild(css);
})();
/* ===== END js/core/bien-detail-restored-active-final.js ===== */


/* ===== BEGIN js/core/zzz-clean-bien-detail-edit-selects.js ===== */
/* GP clean fix — single active bien detail + edit selects (loaded last) */
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clean(v){return String(v==null?'':v).trim();}
  function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function db(){try{if(window.GPDB&&GPDB.load){var d=GPDB.load(); if(d){window.DB=d;return d;}}}catch(e){} try{var x=JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}'); if(x&&typeof x==='object'){window.DB=x;return x;}}catch(e){} window.DB=window.DB||{}; return window.DB;}
  function arr(k){var d=db();return Array.isArray(d[k])?d[k]:[];}
  function money(v){if(v==null||v==='')return '—'; if(/FCFA|€|\$/i.test(String(v)))return esc(v); var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.')); return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':esc(v);}
  function namePerson(p){return clean([p&&p.prenom,p&&p.nom].filter(Boolean).join(' '))||clean(p&&p.nom)||clean(p&&p.name)||clean(p&&p.fullName)||clean(p&&p.email)||clean(p&&p.tel)||'';}
  function bienName(b){return clean(b&& (b.nom||b.name||b.designation||b.adresse||b.id));}
  function locName(l){return clean(l&&(l.nom||l.name||l.location||l.bien||l.locative||l.id));}
  function keyVals(o,keys){return keys.map(function(k){return clean(o&&o[k]);}).filter(Boolean);}
  function similar(a,b){a=norm(a);b=norm(b); if(!a||!b)return false; return a===b||a.indexOf(b)>-1||b.indexOf(a)>-1;}

  function ownerKeysForBien(b){return keyVals(b,['proprietaireId','ownerId','proprioId','proprio','proprietaire','owner','nomProprietaire','proprietaireNom','ownerName']);}
  function findOwner(b){
    var keys=ownerKeysForBien(b); if(!keys.length)return null;
    var owners=arr('proprietaires');
    var best=null,score=0;
    owners.forEach(function(p){
      var vals=keyVals(p,['id','uid','key','email','tel','phone','telephone','nom','prenom','name','fullName','raisonSociale']); vals.push(namePerson(p)); vals.push(clean([p&&p.nom,p&&p.prenom].filter(Boolean).join(' ')));
      var s=0; keys.forEach(function(k){ vals.forEach(function(v){ if(norm(k)&&norm(v)){ if(norm(k)===norm(v))s=Math.max(s,100); else if(similar(k,v))s=Math.max(s,70); } }); });
      if(s>score){score=s;best=p;}
    });
    return score>=50?best:null;
  }
  function countOwnerBiens(p){
    var vals=keyVals(p,['id','uid','key','email','tel','phone','telephone','nom','prenom','name','fullName']); vals.push(namePerson(p));
    return arr('biens').filter(function(b){return ownerKeysForBien(b).some(function(k){return vals.some(function(v){return similar(k,v);});});}).length;
  }
  function locativesForBien(b){
    var bid=clean(b.id||b.uid||b.key), bn=bienName(b), adr=clean(b.adresse);
    return arr('locatives').filter(function(l){
      var vals=keyVals(l,['bienId','idBien','bien_id','bien','nomBien','bienNom','immeuble','propriete','location','locative']);
      if(bid && vals.some(function(v){return norm(v)===norm(bid);} )) return true;
      if(bn && vals.some(function(v){return similar(v,bn);} )) return true;
      if(adr && vals.some(function(v){return similar(v,adr);} )) return true;
      return false;
    });
  }
  function unitsOf(b){
    if(Array.isArray(b.unites)&&b.unites.length)return b.unites.map(function(u,i){return typeof u==='string'?{nom:u}:Object.assign({nom:'Appartement '+(i+1)},u);});
    var n=parseInt(b.nbAppart||b.nbAppartement||b.nbAppartements||b.nombreUnites||b.unites||0,10);
    if(!n||n<1)n=1;
    return Array.from({length:n},function(_,i){return {nom:n>1?'Appartement '+(i+1):(b.nom||'Unité principale')};});
  }
  function locataireFor(loc){
    var keys=keyVals(loc,['locataireId','tenantId','locataire','occupant','nomLocataire']);
    var tenants=arr('locataires');
    for(var i=0;i<tenants.length;i++){
      var t=tenants[i], vals=keyVals(t,['id','uid','key','email','tel','phone','telephone','nom','prenom','name','fullName']); vals.push(namePerson(t));
      if(keys.some(function(k){return vals.some(function(v){return similar(k,v);});})) return t;
    }
    return null;
  }
  function locMatchesUnit(loc,u){
    var un=clean(u.nom||u.name||u.numero||u.label||u.id), uid=clean(u.id||u.uid||u.key||u.numero);
    var vals=keyVals(loc,['uniteId','unitId','appartementId','unite','unit','appartement','numero','lot','nom','location','locative']);
    if(uid && vals.some(function(v){return norm(v)===norm(uid);} )) return true;
    if(un && vals.some(function(v){return similar(v,un);} )) return true;
    return false;
  }
  function statusFor(b){var units=unitsOf(b), locs=locativesForBien(b).filter(function(l){return !/dispon|libre|annul|resil/i.test(String(l.statut||''));}); if(!locs.length)return 'Disponible'; if(locs.length>=units.length)return 'Loué'; return 'Partiellement loué';}
  function statusBadge(s){var bg=s==='Loué'?'#dcfce7':(s==='Partiellement loué'?'#fef3c7':'#eff6ff'), c=s==='Loué'?'#15803d':(s==='Partiellement loué'?'#b45309':'#2563eb'); return '<span class="bd-status-pill" style="background:'+bg+';color:'+c+'">'+esc(s)+'</span>';}

  function renderOwner(b){
    var p=findOwner(b), wanted=ownerKeysForBien(b).join(' / ')||'—';
    if(!p)return '<div class="bd-empty-state"><span class="material-symbols-rounded">person_off</span><b>Propriétaire non trouvé</b><small>'+esc(wanted)+'</small></div>';
    var n=namePerson(p)||'Propriétaire', initials=n.split(/\s+/).map(function(x){return x[0];}).join('').slice(0,2).toUpperCase();
    return '<div class="bd-owner-card"><div class="bd-owner-avatar">'+(p.photo?'<img src="'+esc(p.photo)+'">':esc(initials))+'</div><div class="bd-owner-info"><h3>'+esc(n)+'</h3><p>'+esc(p.adresse||'Adresse non renseignée')+'</p></div></div>'+
      '<div class="bd-info-grid"><div><label>Téléphone</label><b>'+esc(p.tel||p.phone||p.telephone||'—')+'</b></div><div><label>Email</label><b>'+esc(p.email||'—')+'</b></div><div><label>Nombre de biens</label><b>'+countOwnerBiens(p)+'</b></div><div><label>Statut</label><b>'+esc(p.statut||'Actif')+'</b></div><div><label>Adresse</label><b>'+esc(p.adresse||'—')+'</b></div><div><label>Référence</label><b>'+esc(p.id||p.uid||'—')+'</b></div></div>';
  }
  function renderLocataires(b){
    var units=unitsOf(b), locs=locativesForBien(b);
    if(!locs.length)return '<div class="bd-empty-state"><span class="material-symbols-rounded">groups</span><b>Aucun locataire lié</b><small>Créez une location liée à ce bien pour l’afficher ici.</small></div>';
    return locs.map(function(l){var t=locataireFor(l), n=namePerson(t)||clean(l.locataire||l.occupant||l.nomLocataire)||'Locataire'; return '<div class="bd-location-card"><div class="bd-location-top"><div><span class="material-symbols-rounded">person</span><b>'+esc(n)+'</b></div>'+statusBadge(l.statut||'Loué')+'</div><div class="bd-location-grid"><div><label>Location</label><b>'+esc(locName(l)||'—')+'</b></div><div><label>Unité</label><b>'+esc(l.unite||l.appartement||l.lot||'—')+'</b></div><div><label>Date entrée</label><b>'+esc(l.dateEntree||l.date||l.debut||'—')+'</b></div><div><label>Loyer</label><b>'+money(l.loyer||l.montant)+'</b></div><div><label>Téléphone</label><b>'+esc((t&&(t.tel||t.phone||t.telephone))||l.tel||l.telephone||'—')+'</b></div><div><label>Contrat</label><b>'+esc(l.contrat||l.numContrat||'—')+'</b></div></div></div>';}).join('');
  }
  function renderUnits(b){
    var locs=locativesForBien(b), used={};
    return unitsOf(b).map(function(u,i){
      var loc=locs.find(function(l,j){if(used[j])return false; return locMatchesUnit(l,u);});
      if(!loc && unitsOf(b).length===1) loc=locs[0];
      if(loc){used[locs.indexOf(loc)]=true;}
      var t=loc&&locataireFor(loc), s=loc?'Loué':'Disponible';
      return '<div class="bd-location-card"><div class="bd-location-top"><div><span class="material-symbols-rounded">meeting_room</span><b>'+esc(u.nom||('Unité '+(i+1)))+'</b></div>'+statusBadge(s)+'</div><div class="bd-location-grid"><div><label>Locataire</label><b>'+esc((t&&namePerson(t))||(loc&&(loc.locataire||loc.occupant))||'—')+'</b></div><div><label>Date entrée</label><b>'+esc((loc&&(loc.dateEntree||loc.date||loc.debut))||'—')+'</b></div><div><label>Loyer</label><b>'+money(loc&&(loc.loyer||loc.montant)||u.loyer)+'</b></div><div><label>Téléphone</label><b>'+esc((t&&(t.tel||t.phone||t.telephone))||(loc&&(loc.tel||loc.telephone))||'—')+'</b></div></div></div>';
    }).join('');
  }
  function docs(b){if(!Array.isArray(b.documents))b.documents=[]; return b.documents;}
  function renderDocs(b){var list=docs(b); return '<div class="bd-doc-add"><input id="bdDocName" placeholder="Nom du document"><input id="bdDocFile" type="file"><button type="button" onclick="gpAddBienDetailDocument()"><span class="material-symbols-rounded">add</span>Ajouter</button></div>'+(list.length?list.map(function(d,i){return '<div class="bd-doc-card"><div class="bd-doc-icon"><span class="material-symbols-rounded">folder</span></div><div class="bd-doc-meta"><b>'+esc(d.nom||d.name||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+'</small></div><div class="bd-doc-actions"><button type="button" onclick="gpOpenBienDoc('+i+')"><span class="material-symbols-rounded">visibility</span></button><button type="button" class="danger" onclick="gpDeleteBienDoc('+i+')"><span class="material-symbols-rounded">delete</span></button></div></div>';}).join(''):'<div class="bd-empty-state"><span class="material-symbols-rounded">folder_off</span><b>Aucun document</b><small>Ajoutez les documents liés au bien.</small></div>');}
  async function save(){var d=db(); try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){} try{if(window.GPDB&&GPDB.save)await GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){} }

  window.gpSwitchBienDetailTabClean=function(tab,btn){document.querySelectorAll('#page-bien-detail .bd-restored-panel').forEach(function(p){p.style.display='none';}); var p=document.getElementById('bdRestored-'+tab); if(p)p.style.display='block'; document.querySelectorAll('#page-bien-detail .bd-restored-tab').forEach(function(b){b.classList.remove('active');}); if(btn)btn.classList.add('active');};
  window.gpBackToBiens=function(){document.querySelectorAll('.page').forEach(function(p){p.style.display='';});try{if(typeof window.navigate==='function')window.navigate('biens');}catch(e){} setTimeout(function(){var p=document.getElementById('page-biens'); if(p){p.classList.add('active');p.style.display='';} window.GP_CURRENT_PAGE='biens'; try{if(window.renderBiensFinal)window.renderBiensFinal();else if(window.renderBiensFinal2)window.renderBiensFinal2();else if(window.renderBiens)window.renderBiens();}catch(e){console.error(e);} },20);};
  window.closeBienDetail=window.gpBackToBiens;
  window.openBienDetail=function(idx,tab){
    idx=Number(idx); var b=arr('biens')[idx]; if(!b){if(window.toast)toast('Bien introuvable','err');return;} window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page)return;
    var st=statusFor(b), locs=locativesForBien(b), units=unitsOf(b);
    page.innerHTML='<div class="bd-restored"><div class="bd-restored-head"><button type="button" class="bd-top-btn" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-restored-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-restored-actions"><button type="button" class="bd-top-btn edit" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button type="button" class="bd-top-btn danger" onclick="deleteRow&&deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div><div class="bd-restored-hero"><div class="bd-restored-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-restored-main"><div>'+statusBadge(st)+'</div><h1>'+esc(b.nom||'—')+'</h1><p><span class="material-symbols-rounded">location_on</span>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-restored-kpis"><div><small>Type</small><b>'+esc(b.type||'—')+'</b></div><div><small>Unités</small><b>'+units.length+'</b></div><div><small>Locations</small><b>'+locs.length+'</b></div><div><small>Propriétaire</small><b>'+esc((findOwner(b)&&namePerson(findOwner(b)))||ownerKeysForBien(b)[0]||'—')+'</b></div></div></div></div><div class="bd-restored-tabs"><button class="bd-restored-tab active" onclick="gpSwitchBienDetailTabClean(\'infos\',this)"><span class="material-symbols-rounded">info</span> Informations</button><button class="bd-restored-tab" onclick="gpSwitchBienDetailTabClean(\'locataires\',this)"><span class="material-symbols-rounded">groups</span> Locataires</button><button class="bd-restored-tab" onclick="gpSwitchBienDetailTabClean(\'proprio\',this)"><span class="material-symbols-rounded">person</span> Propriétaire</button><button class="bd-restored-tab" onclick="gpSwitchBienDetailTabClean(\'docs\',this)"><span class="material-symbols-rounded">folder</span> Documents</button></div><section id="bdRestored-infos" class="bd-restored-panel"><h3>Caractéristiques</h3><div class="bd-info-grid"><div><label>Type</label><b>'+esc(b.type||'—')+'</b></div><div><label>Adresse</label><b>'+esc(b.adresse||'—')+'</b></div><div><label>Vente</label><b>'+esc(b.vente||'Non')+'</b></div><div><label>Nombre unités</label><b>'+units.length+'</b></div><div><label>Statut calculé</label><b>'+esc(st)+'</b></div><div><label>Valeur / Loyer</label><b>'+money(b.valeur||b.loyer||b.prix)+'</b></div></div><h3 style="margin-top:18px">Unités</h3>'+renderUnits(b)+'</section><section id="bdRestored-locataires" class="bd-restored-panel" style="display:none"><h3>Informations locataires</h3>'+renderLocataires(b)+'</section><section id="bdRestored-proprio" class="bd-restored-panel" style="display:none"><h3>Propriétaire</h3>'+renderOwner(b)+'</section><section id="bdRestored-docs" class="bd-restored-panel" style="display:none"><h3>Documents bien</h3>'+renderDocs(b)+'</section></div>';
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');p.style.display='';});  page.classList.add('active'); page.style.display='';  window.GP_CURRENT_PAGE='bien-detail'; if(tab){setTimeout(function(){var btn=[].find.call(document.querySelectorAll('.bd-restored-tab'),function(x){return x.textContent.toLowerCase().indexOf(tab)>-1}); window.gpSwitchBienDetailTabClean(tab,btn);},0);} };
  window.gpAddBienDetailDocument=function(){var b=arr('biens')[Number(window._bienDetailIdx)]; if(!b)return; var f=document.getElementById('bdDocFile'), file=f&&f.files&&f.files[0]; var name=clean((document.getElementById('bdDocName')||{}).value)||(file&&file.name)||'Document'; if(!file){if(window.toast)toast('Choisissez un fichier','err');return;} var r=new FileReader(); r.onload=function(){docs(b).push({id:'DOC-'+Date.now(),nom:name,fileName:file.name,type:file.type||'',data:r.result,date:new Date().toISOString()}); save(); window.openBienDetail(window._bienDetailIdx,'docs');}; r.readAsDataURL(file);};
  window.gpOpenBienDoc=function(i){var b=arr('biens')[Number(window._bienDetailIdx)], d=b&&docs(b)[i]; if(d&&d.data)window.open(d.data,'_blank');};
  window.gpDeleteBienDoc=function(i){var b=arr('biens')[Number(window._bienDetailIdx)]; if(!b||!confirm('Supprimer ce document ?'))return; docs(b).splice(i,1); save(); window.openBienDetail(window._bienDetailIdx,'docs');};

  function selectHtml(id,current,items,valueFn,labelFn){current=clean(current); var opts='<option value="">Sélectionner</option>'+items.map(function(it){var v=clean(valueFn(it)), l=clean(labelFn(it)||v); return '<option value="'+esc(v)+'" '+(norm(v)===norm(current)||norm(l)===norm(current)?'selected':'')+'>'+esc(l)+'</option>';}).join(''); if(current && opts.indexOf('>'+esc(current)+'</option>')<0)opts+='<option value="'+esc(current)+'" selected>'+esc(current)+'</option>'; return '<select id="'+esc(id)+'" class="gp-clean-select">'+opts+'</select>';}
  function replaceInput(id,items,valueFn,labelFn){var old=document.getElementById(id); if(!old || old.tagName==='SELECT')return; var sel=document.createElement('select'); sel.id=id; sel.className=(old.className||'')+' gp-clean-select'; sel.innerHTML=selectHtml(id,old.value,items,valueFn,labelFn).replace(/^<select[^>]*>|<\/select>$/g,''); old.replaceWith(sel);}
  function patchDrawerSelects(key){
    var root=document.getElementById('gp-actions-drawer')||document.getElementById('gpDrawer')||document.body;
    if(!root)return;
    if(key==='biens') replaceInput('e-proprio',arr('proprietaires'),namePerson,namePerson);
    if(key==='locatives'||key==='locations'){replaceInput('e-bien',arr('biens'),bienName,bienName);replaceInput('e-locataire',arr('locataires'),namePerson,namePerson);}
    if(key==='contrats'){replaceInput('e-locataire',arr('locataires'),namePerson,namePerson);replaceInput('e-locative',arr('locatives'),locName,function(l){return locName(l)+(l.bien?' — '+l.bien:'');});}
    if(key==='paiements'){replaceInput('e-locataire',arr('locataires'),namePerson,namePerson);replaceInput('e-locative',arr('locatives'),locName,function(l){return locName(l)+(l.bien?' — '+l.bien:'');});replaceInput('e-bien',arr('biens'),bienName,bienName);}
    if(key==='depenses') replaceInput('e-bien',arr('biens'),bienName,bienName);
  }
  var oldEdit=window.editRow;
  window.editRow=function(key,idx){var r=oldEdit&&oldEdit.apply(this,arguments); setTimeout(function(){patchDrawerSelects(key);},30); setTimeout(function(){patchDrawerSelects(key);},180); return r;};
  window.gpPatchDrawerSelects=patchDrawerSelects;

  if(!document.getElementById('gp-clean-bien-detail-css')){var s=document.createElement('style');s.id='gp-clean-bien-detail-css';s.textContent='#page-bien-detail{padding:24px 18px 40px!important;background:#f6f7f9!important}.bd-restored{display:flex;flex-direction:column;gap:16px;color:#0f172a}.bd-restored-head{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:14px;box-shadow:0 10px 28px rgba(15,23,42,.06)}.bd-restored-title{flex:1}.bd-restored-title h2{margin:0;font-size:22px;font-weight:950}.bd-restored-title p{margin:3px 0 0;color:#64748b;font-size:13px}.bd-restored-actions{display:flex;gap:8px}.bd-top-btn{height:40px;border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:0 13px;display:inline-flex;align-items:center;gap:7px;font-weight:900;color:#0f172a;cursor:pointer;box-shadow:0 5px 14px rgba(15,23,42,.05)}.bd-top-btn span{font-size:19px;color:#D4AF37}.bd-top-btn.edit{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}.bd-top-btn.edit span{color:#2563eb}.bd-top-btn.danger{background:#fff1f2;color:#dc2626;border-color:#fecdd3}.bd-top-btn.danger span{color:#dc2626}.bd-restored-hero{display:grid;grid-template-columns:230px 1fr;gap:18px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:18px;box-shadow:0 14px 34px rgba(15,23,42,.07)}.bd-restored-photo{height:170px;border-radius:16px;background:#f8fafc;border:1px solid #eef2f7;display:grid;place-items:center;overflow:hidden}.bd-restored-photo img{width:100%;height:100%;object-fit:cover}.bd-restored-photo>span{font-size:60px;color:#D4AF37}.bd-restored-main h1{margin:10px 0 5px;font-size:28px;font-weight:950}.bd-restored-main p{margin:0;color:#64748b;display:flex;align-items:center;gap:5px}.bd-restored-main p span{font-size:17px;color:#D4AF37}.bd-status-pill{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:950;border:1px solid rgba(15,23,42,.06)}.bd-restored-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:22px}.bd-restored-kpis div,.bd-info-grid div{background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:13px;min-width:0}.bd-restored-kpis small,.bd-info-grid label,.bd-location-grid label{display:block;color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;margin-bottom:5px}.bd-restored-kpis b,.bd-info-grid b,.bd-location-grid b{font-size:14px;color:#0f172a;overflow-wrap:anywhere}.bd-restored-tabs{display:flex;gap:10px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:8px;box-shadow:0 8px 24px rgba(15,23,42,.05)}.bd-restored-tab{height:44px;border:0;background:transparent;border-radius:13px;padding:0 16px;display:inline-flex;align-items:center;gap:8px;font-weight:950;color:#64748b;cursor:pointer}.bd-restored-tab span{font-size:20px;color:#D4AF37}.bd-restored-tab.active{background:#fff7dd;color:#111827}.bd-restored-panel{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:18px;box-shadow:0 12px 30px rgba(15,23,42,.055)}.bd-restored-panel h3{margin:0 0 14px;font-size:16px;font-weight:950}.bd-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.bd-location-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin-bottom:10px}.bd-location-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.bd-location-top>div{display:flex;align-items:center;gap:8px}.bd-location-top span.material-symbols-rounded{color:#D4AF37}.bd-location-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.bd-location-grid div{background:#f8fafc;border:1px solid #edf2f7;border-radius:12px;padding:11px}.bd-owner-card{display:flex;align-items:center;gap:13px;padding:14px;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;margin-bottom:12px}.bd-owner-avatar{width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg,#D4AF37,#f5d76e);display:grid;place-items:center;font-weight:950;color:#111;overflow:hidden}.bd-owner-avatar img{width:100%;height:100%;object-fit:cover}.bd-owner-info h3{margin:0;font-size:18px;font-weight:950}.bd-owner-info p{margin:4px 0 0;color:#64748b}.bd-empty-state{display:grid;place-items:center;text-align:center;gap:7px;color:#94a3b8;border:1px dashed #d7dee8;border-radius:16px;padding:30px;background:#fbfdff}.bd-empty-state span{font-size:42px;color:#D4AF37}.bd-empty-state b{color:#475569}.bd-doc-add{display:flex;gap:10px;align-items:center;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;padding:12px;margin-bottom:12px}.bd-doc-add input{height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;background:#fff}.bd-doc-add input:first-child{flex:1}.bd-doc-add button{height:40px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-weight:900;padding:0 14px;display:inline-flex;align-items:center;gap:6px;cursor:pointer}.bd-doc-card{display:flex;align-items:center;gap:12px;border:1px solid #e5e7eb;background:#fff;border-radius:15px;padding:12px;margin-bottom:9px}.bd-doc-icon{width:42px;height:42px;border-radius:13px;background:#fff7dd;display:grid;place-items:center}.bd-doc-icon span{color:#D4AF37}.bd-doc-meta{flex:1;min-width:0}.bd-doc-actions{display:flex;gap:6px}.bd-doc-actions button{width:34px;height:34px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;display:grid;place-items:center;cursor:pointer}.bd-doc-actions button span{font-size:18px;color:#D4AF37}.bd-doc-actions .danger span{color:#ef4444}.gp-clean-select{appearance:auto!important}@media(max-width:900px){.bd-restored-head{align-items:flex-start;flex-direction:column}.bd-restored-actions{width:100%;flex-wrap:wrap}.bd-restored-hero{grid-template-columns:1fr}.bd-restored-kpis{grid-template-columns:1fr 1fr}.bd-restored-tabs{overflow-x:auto}.bd-doc-add{align-items:stretch;flex-direction:column}}';document.head.appendChild(s);} 
})();
/* ===== END js/core/zzz-clean-bien-detail-edit-selects.js ===== */

/* ===== BEGIN sidebar-licence-badge ===== */
(function(){
  'use strict';

  // Mapping complet des types de licence vers label lisible
  function planLabel(type) {
    var map = {
      starter:'Starter', pro:'Pro', business:'Business',
      agency:'Pro', solo:'Starter', trial:'Abonnement',
      enterprise:'Enterprise', lifetime:'Lifetime'
    };
    return map[String(type||'').toLowerCase()] || 'Abonnement';
  }

  function fmtDate(d) {
    if(!d) return null;
    try {
      var dt = (d && typeof d.toDate === 'function') ? d.toDate() : new Date(d);
      if(isNaN(dt.getTime())) return null;
      return dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
    } catch(e){ return null; }
  }

  function renderBadge() {
    var el = document.getElementById('gp-sidebar-licence-badge');
    if(!el) return;

    var s = (window.GPLicenseGuard && typeof window.GPLicenseGuard.status === 'function')
            ? window.GPLicenseGuard.status() : null;

    // Affiche un état par défaut si pas encore chargé
    if(!s || !s.license) {
      el.style.display = '';
      el.innerHTML =
        '<span class="material-symbols-rounded slb-icon">star</span>' +
        '<div class="slb-body">' +
          '<div class="slb-top"><span class="slb-plan">Abonnement</span></div>' +
          '<span class="slb-date">Chargement…</span>' +
        '</div>';
      return;
    }

    var lic      = s.license;
    var type     = lic.type || '';
    var plan     = planLabel(type);
    var expired  = lic.locked || lic.status === 'expired';
    var warn     = !expired && typeof lic.daysLeft === 'number' && lic.daysLeft <= 7;
    // Déterminer si vraiment pas de date (lifetime ou trial sans date)
    var hasDate  = lic.expiresAt && !lic.daysLeft === false || typeof lic.daysLeft === 'number';
    var dateFmt  = fmtDate(lic.expiresAt);
    var dateTxt  = dateFmt ? ('Expire le ' + dateFmt) : 'Sans expiration';
    var pillCls  = expired ? 'slb-pill expired' : (warn ? 'slb-pill warn' : 'slb-pill');
    var pillTxt  = expired ? 'Expiré' : 'Active';

    el.style.display = '';
    el.innerHTML =
      '<span class="material-symbols-rounded slb-icon">star</span>' +
      '<div class="slb-body">' +
        '<div class="slb-top">' +
          '<span class="slb-plan">' + plan + '</span>' +
          '<span class="' + pillCls + '">' + pillTxt + '</span>' +
        '</div>' +
        '<span class="slb-date">' + dateTxt + '</span>' +
      '</div>';
  }

  // Écoute la mise à jour de licence
  window.addEventListener('gp:license-updated', renderBadge);

  // Rendu initial dès que le DOM est prêt + retry car GPLicenseGuard charge en async
  function tryRender(attempts) {
    if(document.getElementById('gp-sidebar-licence-badge')) {
      renderBadge();
      if(attempts < 12) {
        setTimeout(function(){ tryRender(attempts + 1); }, 700);
      }
    } else if(attempts < 15) {
      setTimeout(function(){ tryRender(attempts + 1); }, 300);
    }
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ tryRender(0); });
  } else {
    tryRender(0);
  }
})();
/* ===== END sidebar-licence-badge ===== */

/* ===== PATCH KPI COMPACT — propriétaires / locataires / biens / locations / contrats / paiements / dépenses ===== */
(function(){
  'use strict';
  function injectCompactKpiStyle(){
    var old=document.getElementById('gp-compact-kpi-pages-style');
    if(old) old.remove();
    var css = `
#page-proprietaires .prop-cards-action-row,#page-locataires .prop-cards-action-row,#page-locataires .loc-top,#page-biens .gp-page-top,#page-locatives .gp-page-top,#page-contrats .gp-page-top,#page-paiements .gp-page-top,#page-depenses .gp-page-top{display:flex!important;align-items:center!important;gap:10px!important;margin-bottom:8px!important}
#page-proprietaires .prop-stats-row,#page-locataires .prop-stats-row,#page-locataires .loc-kpis,#page-biens .gp-stat-grid,#page-locatives .gp-stat-grid,#page-contrats .gp-stat-grid,#page-paiements .gp-stat-grid,#page-depenses .gp-stat-grid{display:grid!important;grid-template-columns:repeat(3,minmax(118px,1fr))!important;gap:10px!important;flex:1!important}
#page-proprietaires .prop-stat-card,#page-locataires .prop-stat-card,#page-locataires .loc-kpi,#page-biens .gp-stat-card,#page-locatives .gp-stat-card,#page-contrats .gp-stat-card,#page-paiements .gp-stat-card,#page-depenses .gp-stat-card{min-height:60px!important;padding:8px 10px!important;border-radius:13px!important;gap:8px!important;display:flex!important;align-items:center!important;overflow:hidden!important;box-shadow:0 8px 18px rgba(15,23,42,.05)!important}
#page-proprietaires .prop-stat-icon,#page-locataires .prop-stat-icon,#page-locataires .loc-kpi-ico,#page-biens .gp-stat-ico,#page-locatives .gp-stat-ico,#page-contrats .gp-stat-ico,#page-paiements .gp-stat-ico,#page-depenses .gp-stat-ico{width:31px!important;height:31px!important;min-width:31px!important;border-radius:9px!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important}
#page-proprietaires .prop-stat-icon .material-symbols-rounded,#page-locataires .prop-stat-icon .material-symbols-rounded,#page-locataires .loc-kpi-ico .material-symbols-rounded,#page-biens .gp-stat-ico .material-symbols-rounded,#page-locatives .gp-stat-ico .material-symbols-rounded,#page-contrats .gp-stat-ico .material-symbols-rounded,#page-paiements .gp-stat-ico .material-symbols-rounded,#page-depenses .gp-stat-ico .material-symbols-rounded{font-size:18px!important}
#page-proprietaires .prop-stat-info strong,#page-locataires .prop-stat-info strong,#page-locataires .loc-kpi strong,#page-biens .gp-stat-card strong,#page-locatives .gp-stat-card strong,#page-contrats .gp-stat-card strong,#page-paiements .gp-stat-card strong,#page-depenses .gp-stat-card strong{font-size:15px!important;font-weight:900!important;line-height:1!important;letter-spacing:-.045em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin:0!important;color:#111827!important;display:block!important}
#page-proprietaires .prop-stat-info span,#page-locataires .prop-stat-info span,#page-locataires .loc-kpi span,#page-biens .gp-stat-card span,#page-locatives .gp-stat-card span,#page-contrats .gp-stat-card span,#page-paiements .gp-stat-card span,#page-depenses .gp-stat-card span{font-size:11px!important;font-weight:800!important;line-height:1.05!important;margin:3px 0 0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#374151!important;display:block!important}
#page-proprietaires .prop-stat-info em,#page-locataires .prop-stat-info em,#page-locataires .loc-kpi em,#page-biens .gp-stat-card em,#page-locatives .gp-stat-card em,#page-contrats .gp-stat-card em,#page-paiements .gp-stat-card em,#page-depenses .gp-stat-card em{font-size:10px!important;line-height:1.05!important;margin-top:2px!important;color:#9ca3af!important;font-style:normal!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;display:block!important}
#page-proprietaires .prop-btn-primary,#page-locataires .prop-btn-primary,#page-locataires .loc-new,#page-biens .gp-primary,#page-locatives .gp-primary,#page-contrats .gp-primary,#page-paiements .gp-primary,#page-depenses .gp-primary{height:36px!important;min-height:36px!important;border-radius:8px!important;padding:0 14px!important;font-size:13px!important;font-weight:800!important;white-space:nowrap!important;flex:0 0 auto!important}
#page-proprietaires .prop-btn-primary .material-symbols-rounded,#page-locataires .prop-btn-primary .material-symbols-rounded,#page-locataires .loc-new .material-symbols-rounded,#page-biens .gp-primary .material-symbols-rounded,#page-locatives .gp-primary .material-symbols-rounded,#page-contrats .gp-primary .material-symbols-rounded,#page-paiements .gp-primary .material-symbols-rounded,#page-depenses .gp-primary .material-symbols-rounded{font-size:17px!important}
@media(max-width:760px){#page-proprietaires .prop-cards-action-row,#page-locataires .prop-cards-action-row,#page-locataires .loc-top,#page-biens .gp-page-top,#page-locatives .gp-page-top,#page-contrats .gp-page-top,#page-paiements .gp-page-top,#page-depenses .gp-page-top{display:grid!important;grid-template-columns:1fr!important}#page-proprietaires .prop-stats-row,#page-locataires .prop-stats-row,#page-locataires .loc-kpis,#page-biens .gp-stat-grid,#page-locatives .gp-stat-grid,#page-contrats .gp-stat-grid,#page-paiements .gp-stat-grid,#page-depenses .gp-stat-grid{grid-template-columns:1fr!important}#page-proprietaires .prop-stat-card,#page-locataires .prop-stat-card,#page-locataires .loc-kpi,#page-biens .gp-stat-card,#page-locatives .gp-stat-card,#page-contrats .gp-stat-card,#page-paiements .gp-stat-card,#page-depenses .gp-stat-card{min-height:auto!important;padding:7px 8px!important}#page-proprietaires .prop-btn-primary,#page-locataires .prop-btn-primary,#page-locataires .loc-new,#page-biens .gp-primary,#page-locatives .gp-primary,#page-contrats .gp-primary,#page-paiements .gp-primary,#page-depenses .gp-primary{width:100%!important;justify-content:center!important}}
`;
    var style=document.createElement('style'); style.id='gp-compact-kpi-pages-style'; style.textContent=css; document.head.appendChild(style);
  }
  injectCompactKpiStyle();
  document.addEventListener('DOMContentLoaded', function(){ injectCompactKpiStyle(); setTimeout(injectCompactKpiStyle, 300); setTimeout(injectCompactKpiStyle, 1200); });
  window.addEventListener('load', function(){ setTimeout(injectCompactKpiStyle, 300); });
})();
