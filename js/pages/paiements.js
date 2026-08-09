/* Genius Property V7 — module Paiements
   Objectif : isoler la logique critique des paiements hors du bundle legacy.
   Ce fichier surcharge volontairement les fonctions globales appelées par le HTML existant.
*/
(function(){
  'use strict';

  const Forms = window.GPForms || {};
  const $ = Forms.$ || ((id) => document.getElementById(id));
  const valueOf = Forms.value || ((id) => {
    const el = $(id);
    return el ? String(el.value || '') : '';
  });
  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}));
  const save = () => (window.GPDB && window.GPDB.save ? window.GPDB.save(db()) : (typeof window.saveDB === 'function' ? window.saveDB() : undefined));
  const notify = (message, type) => {
    if (typeof window.toast === 'function') return window.toast(message, type);
    console[type === 'err' ? 'error' : 'log'](message);
  };
  const numberOf = (raw) => {
    if (Forms.number && typeof raw === 'string' && document.getElementById(raw)) return Forms.number(raw);
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(raw);
    if (typeof window.num === 'function') return window.num(raw);
    const cleaned = String(raw ?? '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const escapeHtml = (raw) => {
    if (typeof window.gp_esc === 'function') return window.gp_esc(raw);
    return String(raw ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  };
  const fieldError = Forms.fieldError || ((id, message) => {
    const el = $(id);
    if (el) {
      el.focus();
      el.style.borderColor = '#E24B4A';
      el.addEventListener('input', () => { el.style.borderColor = ''; }, { once:true });
    }
    notify(message, 'err');
    return false;
  });
  const todayISO = () => new Date().toISOString().split('T')[0];

  function activeLocationFor(locataire, locative) {
    return (db().locatives || []).find(l =>
      String(l.nom || '') === String(locative || '') &&
      (!locataire || String(l.locataire || l.occupant || '') === String(locataire || ''))
    );
  }

  function validatePaiementForm() {
    const locataire = valueOf('pay-locataire').trim();
    if (!locataire) return { ok:false, field:'pay-locataire', message:'Le locataire est requis' };

    const locative = valueOf('pay-locative').trim();
    if (!locative) return { ok:false, field:'pay-locative', message:'La location est requise' };

    const montantRaw = valueOf('pay-montant').trim();
    if (!montantRaw) return { ok:false, field:'pay-montant', message:'Le montant est requis' };

    const montant = numberOf(montantRaw);
    if (!Number.isFinite(montant) || montant <= 0) {
      return { ok:false, field:'pay-montant', message:'Le montant doit être supérieur à 0' };
    }

    const payeRaw = valueOf('pay-paye').trim() || '0';
    const paye = numberOf(payeRaw);
    if (!Number.isFinite(paye) || paye < 0) {
      return { ok:false, field:'pay-paye', message:'Le montant payé ne peut pas être négatif' };
    }
    if (paye > montant) {
      return { ok:false, field:'pay-paye', message:'Le montant payé dépasse le montant total' };
    }

    const date = valueOf('pay-date').trim() || todayISO();
    if (Number.isNaN(new Date(date).getTime())) {
      return { ok:false, field:'pay-date', message:'La date du paiement est invalide' };
    }

    return {
      ok:true,
      data: {
        locataire,
        locative,
        montant: String(Math.round(montant)),
        paye: String(Math.round(paye)),
        reste: String(Math.max(0, Math.round(montant - paye))),
        date,
        mode: valueOf('pay-mode') || 'Espèces'
      }
    };
  }

  function refreshContratNextPayment(paiement) {
    if (numberOf(paiement.reste) !== 0) return;
    const contrats = db().contrats || [];
    const ct = contrats.find(c =>
      c.locataire === paiement.locataire &&
      c.locative === paiement.locative &&
      c.statut === 'Actif'
    );
    if (!ct) return;

    const parse = window.parseGPDate || ((v) => new Date(v));
    const addMonth = window.addOneMonthGP || ((d) => {
      const x = new Date(d);
      x.setMonth(x.getMonth() + 1);
      return x;
    });
    const format = window.formatGPDate || ((d) => d.toISOString().split('T')[0]);

    let next = parse(ct.prochain) || parse(paiement.date) || new Date();
    const paidAt = parse(paiement.date) || new Date();
    while (next <= paidAt) next = addMonth(next);
    ct.prochain = format(next);
  }

  function openPayModal() {
    const modal = $('payModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const date = $('pay-date');
    if (date) date.value = todayISO();
    ['pay-montant','pay-paye','pay-reste'].forEach(id => { const el = $(id); if (el) el.value = ''; });

    const _db = db();
    const locataires = _db.locataires || [];
    const locatives = _db.locatives || [];
    const biens = _db.biens || [];

    const sl = $('pay-locataire');
    if (sl) {
      sl.innerHTML = '<option value="">Sélectionner</option>' + locataires
        .map(l => `<option>${escapeHtml([l.prenom, l.nom].filter(Boolean).join(' '))}</option>`)
        .join('');
    }
    const slv = $('pay-locative');
    if (slv) {
      slv.innerHTML = '<option value="">Sélectionner</option>' + locatives
        .map(l => `<option>${escapeHtml(l.nom)}</option>`)
        .join('');
    }
    const slb = $('pay-bien');
    if (slb) {
      slb.innerHTML = '<option value="">Sélectionner</option>' + biens
        .map(b => `<option>${escapeHtml(b.nom || b.adresse || '')}</option>`)
        .join('');
    }
  }

  function closePayModal() {
    ['pay-locataire','pay-locative','pay-bien','pay-montant','pay-paye','pay-reste'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    const modal = $('payModal');
    if (modal) modal.style.display = 'none';
  }

  function syncPayModalFromLocataire() {
    const loc = valueOf('pay-locataire');
    const locatives = db().locatives || [];
    const locations = locatives.filter(l => String(l.locataire || l.occupant || '') === loc);
    const slv = $('pay-locative');
    if (!slv) return;
    const list = locations.length ? locations : locatives;
    slv.innerHTML = '<option value="">Sélectionner</option>' + list
      .map(l => `<option>${escapeHtml(l.nom)}</option>`)
      .join('');
    if (locations.length === 1) {
      slv.value = locations[0].nom;
      syncPayModalFromLocative();
    }
  }

  function syncPayModalFromLocative() {
    const locative = valueOf('pay-locative');
    const lv = activeLocationFor(valueOf('pay-locataire'), locative);
    if (!lv) return;
    const loyer = numberOf(lv.loyer);
    const montant = $('pay-montant');
    const paye = $('pay-paye');
    if (montant) montant.value = String(Math.round(loyer));
    if (paye) paye.value = String(Math.round(loyer));
    updatePayReste();
    // Auto-sélectionner le bien lié à cette locative
    const bien = lv.bien || lv.bienNom || '';
    const slb = $('pay-bien');
    if (slb && bien) {
      const opt = [...slb.options].find(o => o.value === bien || o.text === bien);
      if (opt) slb.value = opt.value;
    }
  }

  function syncPayModalFromBien() {
    const bienNom = valueOf('pay-bien');
    if (!bienNom) return;
    // Chercher les locatives liées à ce bien
    const locatives = db().locatives || [];
    const linked = locatives.filter(l => String(l.bien || l.bienNom || '') === bienNom);
    if (!linked.length) return;
    const slv = $('pay-locative');
    if (slv) {
      slv.innerHTML = '<option value="">Sélectionner</option>' + linked
        .map(l => `<option>${escapeHtml(l.nom)}</option>`)
        .join('');
      if (linked.length === 1) {
        slv.value = linked[0].nom;
        // Auto-remplir locataire si disponible
        const locataire = linked[0].locataire || linked[0].occupant || '';
        const sl = $('pay-locataire');
        if (sl && locataire) {
          const opt = [...sl.options].find(o => o.value === locataire || o.text === locataire);
          if (opt) sl.value = opt.value;
        }
        syncPayModalFromLocative();
      }
    }
  }

  function updatePayReste() {
    const montant = numberOf(valueOf('pay-montant'));
    const paye = numberOf(valueOf('pay-paye'));
    const reste = $('pay-reste');
    if (reste) reste.value = String(Math.max(0, Math.round(montant - paye)));
  }

  async function savePaiement() {
    const result = validatePaiementForm();
    if (!result.ok) return fieldError(result.field, result.message);

    const paiement = result.data;
    const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(_db.paiements)) _db.paiements = [];
    _db.paiements.unshift(paiement);
    refreshContratNextPayment(paiement);

    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    closePayModal();
    if (typeof window.renderPaiements === 'function') window.renderPaiements();
    if (typeof window.renderAvenir === 'function') window.renderAvenir();
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    notify('Paiement enregistré ✓');
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.paiements = {
    validatePaiementForm,
    openPayModal,
    closePayModal,
    syncPayModalFromLocataire,
    syncPayModalFromLocative,
    syncPayModalFromBien,
    updatePayReste,
    savePaiement
  };

  window.openPayModal = openPayModal;
  window.closePayModal = closePayModal;
  window.syncPayModalFromLocataire = syncPayModalFromLocataire;
  window.syncPayModalFromLocative = syncPayModalFromLocative;
  window.syncPayModalFromBien = syncPayModalFromBien;
  window.updatePayReste = updatePayReste;
  window.savePaiement = savePaiement;

  // [cleaned] debug console statement removed
})();

/* ================================================================
   CONSOLIDATION — paiements et dépenses
   Anciennement chargé via fichiers patch séparés.
================================================================ */

/* ===== Source consolidée: js/pages/final-detail-paiements-depenses.js ===== */
(function(){
  'use strict';
  var PAGE={biens:1,paiements:1,depenses:1}, PS={biens:8,paiements:8,depenses:8};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}');}catch(e){return window.DB||{};}}
  function persist(d){window.DB=d;try{localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){} try{if(window.GPDB&&GPDB.save)GPDB.save(d);else if(window.saveDB)window.saveDB();}catch(e){}}
  function num(v){return Number(String(v||0).replace(/[^0-9,.-]/g,'').replace(',','.'))||0;}
  function money(v){ if(v==null||v==='')return '—'; if(String(v).match(/FCFA|€|\$/i))return String(v); var n=num(v); return n?Math.round(n).toLocaleString('fr-FR')+' FCFA':'—'; }
  function statusClass(s){s=String(s||'').toLowerCase(); if(s.indexOf('att')>-1||s.indexOf('partiel')>-1)return 'warn'; if(s.indexOf('impay')>-1||s.indexOf('retard')>-1||s.indexOf('annul')>-1)return 'off'; return '';}
  function iconBtn(cls,icon,title,onclick){
    var map = { view:'gp-pay-view', doc:'gp-pay-doc', edit:'gp-pay-edit', del:'gp-pay-delete', print:'gp-pay-doc', delete:'gp-pay-delete' };
    return '<button class="gp-pay-action '+(map[cls]||'')+'" title="'+esc(title)+'" onclick="event.stopPropagation();'+onclick+'"><span class="material-symbols-rounded">'+icon+'</span></button>';
  }
  function pageBtns(key,total){var pages=Math.max(1,Math.ceil(total/(PS[key]||8))), cur=Math.min(Math.max(PAGE[key]||1,1),pages); PAGE[key]=cur; var out='<div class="gp-pages"><button class="gp-page" '+(cur===1?'disabled':'')+' onclick="gpExtraPage(\''+key+'\','+(cur-1)+')"><span class="material-symbols-rounded">chevron_left</span></button>'; for(var i=1;i<=pages;i++){ if(pages>7 && i>2 && i<pages-1 && Math.abs(i-cur)>1){ if(i===3)out+='<span style="padding:7px;color:#94a3b8">…</span>'; continue;} out+='<button class="gp-page '+(i===cur?'active':'')+'" onclick="gpExtraPage(\''+key+'\','+i+')">'+i+'</button>'; } return out+'<button class="gp-page" '+(cur===pages?'disabled':'')+' onclick="gpExtraPage(\''+key+'\','+(cur+1)+')"><span class="material-symbols-rounded">chevron_right</span></button></div>'; }
  window.gpExtraPage=function(k,p){PAGE[k]=p; if(k==='biens')renderBiensFinal2(); if(k==='paiements')renderPaiementsFinal(); if(k==='depenses')renderDepensesFinal();};
  function inject(){if(document.getElementById('gp-extra-final-style'))return;document.head.insertAdjacentHTML('beforeend','<style id="gp-extra-final-style">.gp-pages{display:flex;gap:6px;align-items:center}.gp-page{min-width:30px;height:30px;border:1px solid #e5e7eb;background:#fff;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b}.gp-page .material-symbols-rounded{font-size:16px}.gp-page.active{background:#D4AF37;color:#111;border-color:#D4AF37;font-weight:800}.gp-page:disabled{opacity:.45;cursor:not-allowed}.gp-primary.blue{background:#2563eb;color:#fff}.gp-finance-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px}.gp-drawer .gp-phone-line{display:flex;gap:8px}.gp-drawer .gp-phone-country{height:38px;min-width:104px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;gap:5px;font-size:13px}.gp-bien-card{background:#fff;border:1px solid #f0f0f0;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.07);cursor:pointer;position:relative;transition:.18s}.gp-bien-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)}.gp-biens-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:16px}.gp-bien-badge{position:absolute;right:12px;top:12px;background:#fef3c7;color:#b45309;border:1px solid #fde68a;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;z-index:2}.gp-bien-card-img{height:130px;background:#f8fafc;overflow:hidden}.gp-bien-card-img img{width:100%;height:100%;object-fit:cover}.gp-bien-card-body{padding:12px}.gp-bien-card-title{font-size:15px;font-weight:900;color:#111827;margin-bottom:4px}.gp-bien-card-meta{font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;margin-bottom:6px}.gp-unit-badge{background:#fef3c7;color:#b45309;border-radius:999px;padding:2px 7px;font-weight:800;margin-left:5px}.gp-bien-card-price{font-size:13px;font-weight:900;color:#D4AF37;display:flex;justify-content:space-between;gap:8px}.gp-bien-card-owner{font-size:11px;font-weight:600;color:#9ca3af}.gp-unit-line{display:block;width:max-content;margin-top:6px;border-radius:999px;padding:2px 7px;font-size:10.5px;font-weight:800}.gp-unit-line.ok{background:#dcfce7;color:#15803d}.gp-unit-line.free{background:#dbeafe;color:#1d4ed8}</style>');}
  function renderBiensFinal2(){inject();var page=document.getElementById('page-biens');if(!page)return;var d=db(); window.DB=d; if(!Array.isArray(d.biens))d.biens=[];var all=d.biens,q=(document.getElementById('gpBienSearch')||{}).value||'',st=(document.getElementById('gpBienStatus')||{}).value||'';var data=all.filter(function(b){return (!q||JSON.stringify(b).toLowerCase().indexOf(q.toLowerCase())>-1)&&(!st||String(b.statut||'').toLowerCase()===st.toLowerCase());});var start=((PAGE.biens||1)-1)*PS.biens,slice=data.slice(start,start+PS.biens);var dispo=all.filter(function(b){return String(b.statut||'').toLowerCase().indexOf('dispo')>-1}).length, occ=all.filter(function(b){return /lou|occup/i.test(String(b.statut||''));}).length;page.innerHTML='<div class="gp-modern-page gp-payments-compact"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+all.length+'</strong><span>Biens</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">meeting_room</span></div><div><strong>'+dispo+'</strong><span>Disponibles</span><em>Biens libres</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+occ+'</strong><span>Occupés</span><em>Biens loués</em></div></div></div><button class="gp-primary" onclick="openGpDrawer&&openGpDrawer(\'bien\')"><span class="material-symbols-rounded">add</span>Nouveau bien</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpBienSearch" value="'+esc(q)+'" placeholder="Rechercher un bien…" oninput="gpExtraPage(\'biens\',1)"></label><select id="gpBienStatus" class="gp-select" onchange="gpExtraPage(\'biens\',1)"><option value="">Tous les statuts</option><option '+(st==='Disponible'?'selected':'')+'>Disponible</option><option '+(st==='Loué'?'selected':'')+'>Loué</option><option '+(st==='En attente'?'selected':'')+'>En attente</option></select><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div>'+(data.length?'<div class="gp-biens-grid">'+slice.map(function(b){var i=all.indexOf(b),units=Array.isArray(b.unites)?b.unites:[];var loue=units.filter(function(u){return /lou/i.test(String(u.statut||''));}).length;return '<div class="gp-bien-card" onclick="window.DB=gpExtraDb();openBienDetail&&openBienDetail('+i+')"><span class="gp-bien-badge">'+esc(b.statut||'En attente')+'</span><div class="gp-bien-card-img">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8"><span class="material-symbols-rounded" style="font-size:48px">apartment</span></div>')+'</div><div class="gp-bien-card-body"><div class="gp-bien-card-title">'+esc(b.nom||'Bien')+'</div><div class="gp-bien-card-meta"><span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37">apartment</span>'+esc(b.type||'Bien')+(units.length?' <span class="gp-unit-badge">'+units.length+' apparts</span>':'')+'</div><div class="gp-bien-card-price">'+money(b.valeur||b.prix||b.loyer)+'<span class="gp-bien-card-owner">'+esc(b.proprio||'')+'</span></div>'+(units.length?'<span class="gp-unit-line ok">Appartement 1 · '+(loue?'Loué':'Disponible')+'</span>'+(units[1]?'<span class="gp-unit-line free">Appartement 2 · '+esc(units[1].statut||'Disponible')+'</span>':''):'')+'</div></div>';}).join('')+'</div><div class="gp-footer" style="margin-top:14px;background:#fff;border:1px solid #e5e7eb;border-radius:12px"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.biens,data.length)+' sur '+data.length+' bien'+(data.length>1?'s':'')+'</span>'+pageBtns('biens',data.length)+'</div>':'<div class="gp-empty">Aucun bien trouvé</div>')+'</div>';}
  window.gpExtraDb=db;
  function renderPaiementsFinal(){inject();var page=document.getElementById('page-paiements');if(!page)return;var d=db(); if(!Array.isArray(d.paiements))d.paiements=[];var all=d.paiements,q=(document.getElementById('gpPaySearch')||{}).value||'';var data=all.filter(function(p){return !q||JSON.stringify(p).toLowerCase().indexOf(q.toLowerCase())>-1;});var start=((PAGE.paiements||1)-1)*PS.paiements,slice=data.slice(start,start+PS.paiements);var total=all.reduce(function(s,p){return s+num(p.montant);},0), paye=all.reduce(function(s,p){return s+num(p.paye||p.montantPaye);},0), reste=all.reduce(function(s,p){return s+num(p.reste||Math.max(0,num(p.montant)-num(p.paye)));},0);page.innerHTML='<div class="gp-modern-page gp-payments-compact"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(total)+'</strong><span>Montant dû</span><em>Total paiements</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">check_circle</span></div><div><strong>'+money(paye)+'</strong><span>Payé</span><em>Montant encaissé</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">warning</span></div><div><strong>'+money(reste)+'</strong><span>Reste</span><em>Solde à payer</em></div></div></div><button class="gp-primary blue" onclick="openFinanceDrawer(\'paiement\')"><span class="material-symbols-rounded">add</span>Nouveau paiement</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpPaySearch" value="'+esc(q)+'" placeholder="Rechercher un paiement…" oninput="gpExtraPage(\'paiements\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'paiements\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'paiements\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button><button class="gp-outline gp-avenir-red-cta" data-gp-avenir-cta="1" onclick="return gpOpenAvenirFromPaiements(event)" title="Paiements à venir"><span class="material-symbols-rounded" style="font-size:13px;vertical-align:-2px">event</span> À venir</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table gp-payments-table-v6 gp-payments-table-v7"><thead><tr><th>Locataire</th><th>Locative</th><th>Montant</th><th>Payé</th><th>Reste</th><th>Date</th><th>Mode</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(p){var i=all.indexOf(p);return '<tr><td><b>'+esc(p.locataire||'—')+'</b></td><td>'+esc(p.locative||p.bien||'—')+'</td><td><b>'+money(p.montant)+'</b></td><td class="gp-paid-cell">'+money(p.paye||p.montantPaye)+'</td><td><span class="gp-pill '+(num(p.reste)>0?'off':'')+'">'+money(p.reste||Math.max(0,num(p.montant)-num(p.paye)))+'</span></td><td class="gp-date-cell">'+esc((window.gpFormatDateFR||window.formatDateFR||function(v){return v||'—';})(p.date||p.datePaiement))+'</td><td>'+esc(p.mode||'—')+'</td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'paiements\','+i+')')+iconBtn('docs','receipt_long','Reçu','genererRecuPaiementPDF&&genererRecuPaiementPDF('+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'paiements\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'paiements\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.paiements,data.length)+' sur '+data.length+' paiement'+(data.length>1?'s':'')+'</span>'+pageBtns('paiements',data.length)+'</div>':'<div class="gp-empty">Aucun paiement enregistré</div>')+'</div></div>';}
  function renderDepensesFinal(){inject();var page=document.getElementById('page-depenses');if(!page)return;var d=db(); if(!Array.isArray(d.depenses))d.depenses=[];var all=d.depenses,q=(document.getElementById('gpDepSearch')||{}).value||'',cat=(document.getElementById('gpDepCat')||{}).value||'';var data=all.filter(function(x){return (!q||JSON.stringify(x).toLowerCase().indexOf(q.toLowerCase())>-1)&&(!cat||String(x.cat||x.categorie||'')===cat);});var start=((PAGE.depenses||1)-1)*PS.depenses,slice=data.slice(start,start+PS.depenses);var total=all.reduce(function(s,x){return s+num(x.montant);},0), biens=all.filter(function(x){return x.bien;}).length;page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">account_balance_wallet</span></div><div><strong>'+all.length+'</strong><span>Dépenses</span><em>Total enregistrées</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(total)+'</strong><span>Total</span><em>Montant dépenses</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+biens+'</strong><span>Liées aux biens</span><em>Dépenses biens</em></div></div></div><button class="gp-primary blue" onclick="openFinanceDrawer(\'depense\')"><span class="material-symbols-rounded">add</span>Nouvelle dépense</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpDepSearch" value="'+esc(q)+'" placeholder="Rechercher une dépense…" oninput="gpExtraPage(\'depenses\',1)"></label><select id="gpDepCat" class="gp-select" onchange="gpExtraPage(\'depenses\',1)"><option value="">Toutes catégories</option><option '+(cat==='Entretien'?'selected':'')+'>Entretien</option><option '+(cat==='Réparation'?'selected':'')+'>Réparation</option><option '+(cat==='Taxe'?'selected':'')+'>Taxe</option><option '+(cat==='Assurance'?'selected':'')+'>Assurance</option><option '+(cat==='Autre'?'selected':'')+'>Autre</option></select><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'depenses\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'depenses\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Dépense</th><th>Catégorie</th><th>Montant</th><th>Date</th><th>Bien concerné</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(x){var i=all.indexOf(x);return '<tr><td><b>'+esc(x.libelle||x.titre||'Dépense')+'</b><br><small style="color:#64748b">'+esc(x.type||'Dépense')+'</small></td><td>'+esc(x.cat||x.categorie||'—')+'</td><td><b>'+money(x.montant)+'</b></td><td>'+esc(x.date||'—')+'</td><td><span class="gp-line"><span class="material-symbols-rounded">home</span>'+esc(x.bien||'—')+'</span></td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow&&viewRow(\'depenses\','+i+')')+iconBtn('edit','edit','Modifier','editRow&&editRow(\'depenses\','+i+')')+iconBtn('del','delete','Supprimer','delRow&&delRow(\'depenses\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.depenses,data.length)+' sur '+data.length+' dépense'+(data.length>1?'s':'')+'</span>'+pageBtns('depenses',data.length)+'</div>':'<div class="gp-empty">Aucune dépense enregistrée</div>')+'</div></div>';}
  window.openFinanceDrawer=function(kind){inject();document.querySelectorAll('#gpFinanceDrawer,#gpFinanceOverlay').forEach(function(e){e.remove();});var title=kind==='paiement'?'Nouveau paiement':'Nouvelle dépense', sub=kind==='paiement'?'Ajoutez un nouveau paiement à votre portefeuille':'Ajoutez une nouvelle dépense à votre portefeuille';var body=kind==='paiement'?'<div class="gp-drawer-section"><h3>Paiement</h3><div class="gp-form-row"><div class="gp-field"><label>Locataire <b>*</b></label><input id="fin-p-locataire" placeholder="Nom du locataire"></div><div class="gp-field"><label>Locative / Bien <b>*</b></label><input id="fin-p-locative" placeholder="Location ou bien"></div></div><div class="gp-form-row"><div class="gp-field"><label>Montant dû <b>*</b></label><input id="fin-p-montant" placeholder="300000"></div><div class="gp-field"><label>Montant payé <b>*</b></label><input id="fin-p-paye" placeholder="300000"></div></div></div><div class="gp-drawer-section"><h3>Détails</h3><div class="gp-form-row"><div class="gp-field"><label>Date paiement</label><input id="fin-p-date" type="date"></div><div class="gp-field"><label>Mode paiement</label><select id="fin-p-mode"><option>Espèces</option><option>Wave</option><option>Orange Money</option><option>Virement</option><option>Chèque</option></select></div></div></div>':'<div class="gp-drawer-section"><h3>Dépense</h3><div class="gp-form-row"><div class="gp-field"><label>Libellé <b>*</b></label><input id="fin-d-libelle" placeholder="Ex: Réparation plomberie"></div><div class="gp-field"><label>Catégorie</label><select id="fin-d-cat"><option>Entretien</option><option>Réparation</option><option>Taxe</option><option>Assurance</option><option>Autre</option></select></div></div><div class="gp-form-row"><div class="gp-field"><label>Montant <b>*</b></label><input id="fin-d-montant" placeholder="50000"></div><div class="gp-field"><label>Date</label><input id="fin-d-date" type="date"></div></div></div><div class="gp-drawer-section"><h3>Bien concerné</h3><div class="gp-form-row full"><div class="gp-field"><label>Bien</label><input id="fin-d-bien" placeholder="Nom du bien"></div></div></div>';document.body.insertAdjacentHTML('beforeend','<div id="gpFinanceOverlay" class="gp-drawer-overlay" onclick="closeFinanceDrawer()"></div><div id="gpFinanceDrawer" class="gp-drawer"><div class="gp-drawer-head"><div><div class="gp-drawer-title">'+title+'</div><div class="gp-drawer-sub">'+sub+'</div></div><button class="gp-drawer-close" onclick="closeFinanceDrawer()"><span class="material-symbols-rounded">close</span></button></div><div class="gp-drawer-body">'+body+'</div><div class="gp-drawer-foot"><button class="gp-cancel" onclick="closeFinanceDrawer()">Annuler</button><button class="gp-save" onclick="saveFinanceDrawer(\''+kind+'\')">Enregistrer</button></div></div>');var o=document.getElementById('gpFinanceOverlay'),dr=document.getElementById('gpFinanceDrawer');o.style.display='block';dr.style.display='flex';requestAnimationFrame(function(){o.style.opacity='1';dr.style.transform='translateX(0)';});};
  window.closeFinanceDrawer=function(){ if(window.GPUIManager){ window.GPUIManager.closeFinanceDrawer(); return; } var o=document.getElementById('gpFinanceOverlay'),dr=document.getElementById('gpFinanceDrawer'); if(o)o.remove(); if(dr)dr.remove(); document.body.style.overflow=''; };
  window.saveFinanceDrawer=function(kind){var d=db(); if(kind==='paiement'){if(!Array.isArray(d.paiements))d.paiements=[];var m=num(document.getElementById('fin-p-montant').value),p=num(document.getElementById('fin-p-paye').value);var row={locataire:document.getElementById('fin-p-locataire').value,locative:document.getElementById('fin-p-locative').value,montant:String(m),paye:String(p),reste:String(Math.max(0,m-p)),date:document.getElementById('fin-p-date').value,mode:document.getElementById('fin-p-mode').value};if(!row.locataire||!row.locative)return (window.toast?toast('Locataire et locative sont requis','err'):alert('Locataire et locative sont requis'));d.paiements.unshift(row);persist(d);closeFinanceDrawer();renderPaiementsFinal();if(window.toast)toast('Paiement enregistré ✓');return;} if(kind==='depense'){if(!Array.isArray(d.depenses))d.depenses=[];var rowd={libelle:document.getElementById('fin-d-libelle').value,cat:document.getElementById('fin-d-cat').value,montant:document.getElementById('fin-d-montant').value,date:document.getElementById('fin-d-date').value,bien:document.getElementById('fin-d-bien').value,type:document.getElementById('fin-d-bien').value?'Bien':'Agence'};if(!rowd.libelle)return (window.toast?toast('Le libellé est requis','err'):alert('Le libellé est requis'));d.depenses.unshift(rowd);persist(d);closeFinanceDrawer();renderDepensesFinal();if(window.toast)toast('Dépense enregistrée ✓');}};
  /* On n'assigne PAS renderPaiementsFinal/renderDepensesFinal sur window ici :
     finance-pages-sidecards-final.js (chargé après) pose les versions finales.
     On expose seulement renderBiensFinal qui n'a pas d'autre source. */
  window.renderBiensFinal=renderBiensFinal2;
  /* renderPage : on ne wrappe que biens pour ne pas écraser la chaîne finale */
  var oldRP=window.renderPage; window.renderPage=function(p){ if(p==='biens'){renderBiensFinal2();return} return oldRP?oldRP.apply(this,arguments):undefined; };
  /* navigate : on ne wrappe que biens ici, paiements/depenses sont gérés par finance-pages-sidecards-final + no-flicker-nav-fix */
  var oldNav=window.navigate; window.navigate=function(p){ if(p==='biens'){if(oldNav)oldNav.call(this,p);setTimeout(renderBiensFinal2,30);return} return oldNav?oldNav.apply(this,arguments):undefined; };
  document.addEventListener('DOMContentLoaded',function(){inject();setTimeout(function(){var a=document.querySelector('.page.active'); if(!a)return; if(a.id==='page-biens')renderBiensFinal2();},900);});
})();

/* ===== Source consolidée: js/pages/final-paiements-depenses-restore.js ===== */
(function(){
  'use strict';
  var PAGE={paiements:1,depenses:1}, PS=8;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} return window.DB||{};}
  function num(v){return Number(String(v||0).replace(/[^0-9,.-]/g,'').replace(',','.'))||0;}
  function money(v){var n=num(v);return Math.round(n).toLocaleString('fr-FR')+' FCFA';}
  function fmtDate(v){if(!v)return '—';var d=new Date(v);if(isNaN(d))return esc(v);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit'});}
  function icon(cls,ic,t,fn){return '<button class="gp-mini-action '+cls+'" title="'+t+'" onclick="event.stopPropagation();'+fn+'"><span class="material-symbols-rounded">'+ic+'</span></button>';}
  function pages(key,total){var p=Math.max(1,Math.ceil(total/PS)),c=Math.min(Math.max(PAGE[key]||1,1),p);PAGE[key]=c;var h='<div class="gp-pages"><button class="gp-page" '+(c===1?'disabled':'')+' onclick="gpRestorePage(\''+key+'\','+(c-1)+')"><span class="material-symbols-rounded">chevron_left</span></button>';for(var i=1;i<=p;i++)h+='<button class="gp-page '+(i===c?'active':'')+'" onclick="gpRestorePage(\''+key+'\','+i+')">'+i+'</button>';return h+'<button class="gp-page" '+(c===p?'disabled':'')+' onclick="gpRestorePage(\''+key+'\','+(c+1)+')"><span class="material-symbols-rounded">chevron_right</span></button></div>';}
  function css(){if(document.getElementById('restore-pay-dep-css'))return;document.head.insertAdjacentHTML('beforeend','<style id="restore-pay-dep-css">.gp-primary.red{background:#dc2626!important;color:#fff!important}.gp-fin-layout{display:grid;grid-template-columns:1fr 220px;gap:12px;align-items:start}.gp-side-card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:12px;margin-bottom:12px}.gp-side-dark{background:linear-gradient(135deg,#0f1020,#151625);color:#fff;text-align:center;border-radius:10px;padding:20px 12px}.gp-side-dark small{letter-spacing:4px;color:#b8b8c8;font-weight:800;font-size:10px}.gp-side-dark b{display:block;color:#facc15;font-size:23px;margin:6px 0}.gp-side-title{font-size:12px;font-weight:900;text-transform:uppercase;color:#64748b;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:9px}.gp-type-row{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin:8px 0}.gp-type-bar{height:5px;border-radius:999px;background:#D4AF37;margin-top:5px}.gp-month-total{text-align:center;color:#dc2626;font-weight:900;font-size:20px;margin:12px 0}.gp-mini-legend{display:flex;gap:12px;align-items:center;justify-content:center;font-size:10px;color:#64748b}.gp-dot{width:10px;height:10px;display:inline-block}.gp-dot.blue{background:#7c9cf5}.gp-dot.gold{background:#d4af37}.gp-pay-donut{width:98px;height:98px;border-radius:50%;margin:12px auto;background:conic-gradient(#16a34a var(--paid),#D4AF37 0);position:relative}.gp-pay-donut:after{content:"";position:absolute;inset:22px;background:#fff;border-radius:50%}.gp-table-wrap table.gp-old-table{width:100%;border-collapse:collapse}.gp-old-table th{background:#fffaf0;text-align:left;padding:11px 12px;font-size:11px;text-transform:uppercase}.gp-old-table td{padding:12px;border-top:1px solid #eee;font-size:13px}.gp-pill{display:inline-flex;padding:5px 10px;border-radius:999px;background:#fde68a;color:#92400e;font-weight:800;font-size:11px}.gp-pill.blue{background:#dbeafe;color:#1d4ed8}.gp-amount-red{color:#ef0000;font-weight:900}.gp-fin-actions{display:flex;justify-content:center;gap:7px}.gp-mini-action.view{background:#fef3c7;color:#d97706}.gp-mini-action.doc{background:#dcfce7;color:#16a34a}.gp-modern-page .gp-footer{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-top:1px solid #eee}.gp-pages{display:flex;gap:6px;align-items:center}.gp-page{min-width:30px;height:30px;border:1px solid #e5e7eb;background:#fff;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b}.gp-page.active{background:#D4AF37;color:#111;border-color:#D4AF37;font-weight:800}.gp-page:disabled{opacity:.45}@media(max-width:900px){.gp-fin-layout{grid-template-columns:1fr}.gp-fin-side{order:-1}}</style>');}
  function renderDepenses(){css();var page=document.getElementById('page-depenses');if(!page)return;var d=db();window.DB=d;if(!Array.isArray(d.depenses))d.depenses=[];var all=d.depenses,q=(document.getElementById('gpDepSearch2')||{}).value||'',cat=(document.getElementById('gpDepCat2')||{}).value||'';var data=all.filter(function(x){return (!q||JSON.stringify(x).toLowerCase().indexOf(q.toLowerCase())>-1)&&(!cat||String(x.cat||x.categorie||'')===cat);});var total=all.reduce(function(s,x){return s+num(x.montant);},0),ag=all.filter(function(x){return !x.bien&&String(x.type||'').toLowerCase().indexOf('agence')>-1}).reduce(function(s,x){return s+num(x.montant)},0),tr=total-ag;var now=new Date(), ym=now.toISOString().slice(0,7), mois=all.filter(function(x){return String(x.date||'').slice(0,7)===ym}).reduce(function(s,x){return s+num(x.montant)},0);var start=(PAGE.depenses-1)*PS,slice=data.slice(start,start+PS);page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">account_balance_wallet</span></div><div><strong>'+all.length+'</strong><span>Dépenses</span><em>Total enregistrées</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(total)+'</strong><span>Total</span><em>Montant dépenses</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+all.filter(function(x){return x.bien}).length+'</strong><span>Liées aux biens</span><em>Dépenses biens</em></div></div></div><button class="gp-primary red" onclick="openDepModal&&openDepModal()"><span class="material-symbols-rounded">add</span>Nouvelle dépense</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpDepSearch2" value="'+esc(q)+'" placeholder="Rechercher une dépense…" oninput="gpRestorePage(\'depenses\',1)"></label><select id="gpDepCat2" class="gp-select" onchange="gpRestorePage(\'depenses\',1)"><option value="">Toutes catégories</option><option '+(cat==='Travaux'?'selected':'')+'>Travaux</option><option '+(cat==='Réparation'?'selected':'')+'>Réparation</option><option '+(cat==='Entretien'?'selected':'')+'>Entretien</option><option '+(cat==='Transport'?'selected':'')+'>Transport</option><option '+(cat==='Facture agence'?'selected':'')+'>Facture agence</option><option '+(cat==='Autre'?'selected':'')+'>Autre</option></select><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'depenses\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'depenses\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div><div class="gp-fin-layout"><div class="gp-table-wrap"><table class="gp-old-table"><thead><tr><th>#</th><th>Type</th><th>Catégorie</th><th>Montant (FCFA)</th><th>Date</th><th>Bien concerné</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+(slice.length?slice.map(function(x,k){var i=all.indexOf(x);var type=x.type||(x.bien?'Travaux / Réparations':'Dépenses agence');return '<tr><td>'+(start+k+1)+'</td><td><span class="gp-pill">'+esc(type)+'</span></td><td><span class="gp-pill blue">'+esc(x.cat||x.categorie||'Réparation')+'</span></td><td><span class="gp-amount-red">'+money(x.montant)+'</span></td><td>'+fmtDate(x.date)+'</td><td>'+esc(x.bien||'—')+'</td><td><div class="gp-fin-actions">'+icon('view','visibility','Voir','viewRow&&viewRow(\'depenses\','+i+')')+icon('doc','receipt_long','Facture','openDepFacture&&openDepFacture('+i+')')+icon('edit','edit','Modifier','editRow&&editRow(\'depenses\','+i+')')+icon('del','delete','Supprimer','delRow&&delRow(\'depenses\','+i+')')+'</div></td></tr>';}).join(''):'<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:26px">Aucune dépense enregistrée</td></tr>')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(data.length?start+1:0)+' à '+Math.min(start+PS,data.length)+' sur '+data.length+' dépense'+(data.length>1?'s':'')+'</span>'+pages('depenses',data.length)+'</div></div><aside class="gp-fin-side"><div class="gp-side-dark"><small>TOTAL DÉPENSES</small><b>'+money(total)+'</b><span>'+all.length+' entrée'+(all.length>1?'s':'')+'</span></div><div class="gp-side-card"><div class="gp-side-title">Totaux par type</div><div class="gp-type-row"><span>Dépenses agence</span><span>'+money(ag)+'</span></div><div class="gp-type-row"><span>Travaux / Réparations</span><span>'+money(tr)+'</span></div><div class="gp-type-bar" style="width:'+(total?Math.max(8,Math.round(tr/total*100)):0)+'%"></div></div><div class="gp-side-card"><div class="gp-side-title">Ce mois-ci</div><div class="gp-month-total">'+money(mois)+'</div><div class="gp-mini-legend"><span><i class="gp-dot blue"></i> Agence</span><span><i class="gp-dot gold"></i> Travaux / Réparations</span></div></div></aside></div></div>';}
  function renderPaiements(){css();var page=document.getElementById('page-paiements');if(!page)return;var d=db();window.DB=d;if(!Array.isArray(d.paiements))d.paiements=[];var all=d.paiements,q=(document.getElementById('gpPaySearch2')||{}).value||'';var data=all.filter(function(x){return !q||JSON.stringify(x).toLowerCase().indexOf(q.toLowerCase())>-1});var total=all.reduce(function(s,x){return s+num(x.montant)},0),paye=all.reduce(function(s,x){return s+num(x.paye||x.montantPaye)},0),reste=all.reduce(function(s,x){return s+num(x.reste||Math.max(0,num(x.montant)-num(x.paye||x.montantPaye)))},0);var pct=total?Math.round(paye/total*100):0;var start=(PAGE.paiements-1)*PS,slice=data.slice(start,start+PS);page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid"><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+all.length+'</strong><span>Paiements</span><em>Total enregistrés</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">check_circle</span></div><div><strong>'+money(paye)+'</strong><span>Payé</span><em>Montant encaissé</em></div></div><div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">pending_actions</span></div><div><strong>'+money(reste)+'</strong><span>Reste</span><em>Solde restant</em></div></div></div><button class="gp-primary" onclick="openPayModal&&openPayModal()"><span class="material-symbols-rounded">add</span>Nouveau paiement</button></div><div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpPaySearch2" value="'+esc(q)+'" placeholder="Rechercher un paiement…" oninput="gpRestorePage(\'paiements\',1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'paiements\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'paiements\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button><button class="gp-outline gp-avenir-red-cta" data-gp-avenir-cta="1" onclick="return gpOpenAvenirFromPaiements(event)" title="Paiements à venir"><span class="material-symbols-rounded" style="font-size:13px;vertical-align:-2px">event</span> À venir</button></div></div><div class="gp-fin-layout"><div class="gp-table-wrap"><table class="gp-old-table"><thead><tr><th>Locataire</th><th>Locative</th><th>Montant</th><th>Payé</th><th>Reste</th><th>Date paiement</th><th>Mode paiement</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+(slice.length?slice.map(function(x){var i=all.indexOf(x);return '<tr><td><b>'+esc(x.locataire||'—')+'</b></td><td>'+esc(x.locative||x.bien||'—')+'</td><td>'+money(x.montant)+'</td><td style="color:#16a34a;font-weight:900">'+money(x.paye||x.montantPaye)+'</td><td style="color:#dc2626;font-weight:900">'+money(x.reste||Math.max(0,num(x.montant)-num(x.paye||x.montantPaye)))+'</td><td>'+fmtDate(x.date)+'</td><td>'+esc(x.mode||'—')+'</td><td><div class="gp-fin-actions">'+icon('view','visibility','Voir','viewRow&&viewRow(\'paiements\','+i+')')+icon('edit','edit','Modifier','editRow&&editRow(\'paiements\','+i+')')+icon('del','delete','Supprimer','delRow&&delRow(\'paiements\','+i+')')+'</div></td></tr>';}).join(''):'<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:26px">Aucun paiement enregistré</td></tr>')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(data.length?start+1:0)+' à '+Math.min(start+PS,data.length)+' sur '+data.length+' paiement'+(data.length>1?'s':'')+'</span>'+pages('paiements',data.length)+'</div></div><aside class="gp-fin-side"><div class="gp-side-card" style="text-align:center"><h4 style="margin:4px 0 0;color:#64748b">Total Montant</h4><div style="font-weight:900;font-size:20px">'+money(total)+'</div><div class="gp-pay-donut" style="--paid:'+pct+'%"></div><div class="gp-mini-legend" style="display:block;text-align:left;margin-left:50px"><div><i class="gp-dot" style="background:#16a34a"></i> Payé</div><div><i class="gp-dot gold"></i> Reste</div></div><p style="color:#16a34a;font-size:13px;font-weight:800">Payé : '+money(paye)+'</p><p style="color:#dc2626;font-size:13px;font-weight:800">Reste : '+money(reste)+'</p></div></aside></div></div>';}
  window.gpRestorePage=function(k,p){PAGE[k]=p;if(k==='depenses')renderDepenses();if(k==='paiements')renderPaiements();};
  /* On enregistre les fonctions sous leurs noms — finance-pages-sidecards-final
     les écrasera avec la version finale. On ne wrappe PAS navigate ici. */
  window.renderDepensesFinal=renderDepenses; window.renderPaiementsFinal=renderPaiements; window.renderDepenses=renderDepenses; window.renderPaiements=renderPaiements;
  document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){var a=document.querySelector('.page.active');if(a&&a.id==='page-depenses')renderDepenses();if(a&&a.id==='page-paiements')renderPaiements();},1200);});
})();

/* ================================================================
   CORRECTIF UTILISATEUR — Formulaires Dépenses/Paiements compactés
   - Restaure les champs de l'ancien formulaire dépense
   - Transforme Locataire et Locative/Bien en listes alimentées par les données existantes
   - Corrige aussi le drawer moderne si une page l'appelle encore
================================================================ */
(function(){
  'use strict';
  function db(){try{if(window.GPDB&&GPDB.load)return GPDB.load();}catch(e){} try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}');}catch(e){return window.DB||{};}}
  function arr(k){var d=db(); return Array.isArray(d&&d[k])?d[k]:[];}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function n(v){return Number(String(v||0).replace(/[^0-9,.-]/g,'').replace(',','.'))||0;}
  function uniq(a){var m={},out=[];a.forEach(function(x){x=String(x||'').trim();if(x&&!m[x]){m[x]=1;out.push(x);}});return out;}
  function locName(x){return String(x.nom||x.nomComplet||x.name||x.prenomNom||x.locataire||x.occupant||'').trim();}
  function bienName(x){return String(x.nom||x.bien||x.nomBien||x.titre||x.adresse||'').trim();}
  function locativeName(x,i){return String(x.nom||x.libelle||x.numero||x.lot||x.appartement||x.unite||x.bien||('Locative '+(i+1))).trim();}
  function locataireOptions(){return uniq(arr('locataires').map(locName).concat(arr('locatives').map(function(x){return x.locataire||x.occupant;}))).map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join('');}
  function locativeOptions(list){return (list||arr('locatives')).map(function(x,i){var val=locativeName(x,i);var txt=val;var b=x.bien||x.parentBien||x.nomBien; if(b&&String(b)!==txt)txt+=' — '+b;return '<option value="'+esc(val)+'" data-index="'+i+'">'+esc(txt)+'</option>';}).join('');}
  function bienOptions(){return uniq(arr('biens').map(bienName).concat(arr('locatives').map(function(x){return x.bien||x.parentBien||x.nomBien;}))).map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join('');}
  function set(id,html){var e=document.getElementById(id); if(e)e.innerHTML=html;}
  function val(id){var e=document.getElementById(id);return e?e.value:'';}
  function put(id,v){var e=document.getElementById(id);if(e)e.value=v==null?'':v;}
  function findLocativeByValue(value){var list=arr('locatives');return list.find(function(x,i){return locativeName(x,i)===value || String(x.bien||x.parentBien||x.nomBien||'')===value;})||null;}
  function amountOf(l){return n(l&& (l.loyer||l.montant||l.prix||l.montantLoyer||l.loyerMensuel));}
  function addCompatStyle(){if(document.getElementById('gp-old-form-compat-style'))return;document.head.insertAdjacentHTML('beforeend','<style id="gp-old-form-compat-style">#gpFinanceDrawer.gp-compact-finance{width:min(560px,92vw)!important;max-width:92vw!important}.gp-compact-finance .gp-drawer-head{padding:16px 18px 10px!important}.gp-compact-finance .gp-drawer-body{padding:0 18px 10px!important;gap:0!important;overflow:auto}.gp-compact-finance .gp-drawer-section{padding:0!important;margin:0!important;border:0!important}.gp-compact-finance .gp-form-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px 12px!important;margin:0!important}.gp-compact-finance .gp-form-row.full{grid-template-columns:1fr!important}.gp-compact-finance .gp-field{margin:0!important}.gp-compact-finance .gp-field label{font-size:12px!important;margin:0 0 4px!important}.gp-compact-finance input,.gp-compact-finance select{height:38px!important;font-size:11px!important;padding:0 12px!important}.gp-compact-finance .gp-drawer-section h3{font-size:13px!important;margin:10px 0 8px!important;padding-bottom:6px!important;border-bottom:1px solid #eef2f7}.gp-compact-finance .gp-drawer-foot{padding:12px 18px!important}.gp-mini-help{font-size:11px;color:#9ca3af;margin:-2px 0 6px}.dep-modal-card{max-height:92vh!important;overflow:auto!important}#depModal .fg,#payModal .fg{padding-top:4px!important}#depModal input,#depModal select,#payModal input,#payModal select{min-height:42px!important}</style>');}
  window.gpFinanceFillSelects=function(){
    set('fin-p-locataire','<option value="">Sélectionner</option>'+locataireOptions());
    set('fin-p-locative','<option value="">Sélectionner</option>'+locativeOptions(arr('locatives'))+bienOptions());
    set('fin-d-bien','<option value="">Sélectionnez un bien enregistré</option>'+bienOptions());
    set('pay-locataire','<option value="">Sélectionner</option>'+locataireOptions());
    set('pay-locative','<option value="">Sélectionner</option>'+locativeOptions(arr('locatives')));
    set('pay-bien','<option value="">Sélectionner un bien</option>'+bienOptions());
    set('d-bien','<option value="">Sélectionnez un bien enregistré</option>'+bienOptions());
  };
  window.gpFinSyncPayFromLocataire=function(){var loc=val('fin-p-locataire');var list=arr('locatives').filter(function(x){return String(x.locataire||x.occupant||'').trim()===loc;});set('fin-p-locative','<option value="">Sélectionner</option>'+locativeOptions(list.length?list:arr('locatives'))+bienOptions());};
  window.gpFinSyncPayFromLocative=function(){var l=findLocativeByValue(val('fin-p-locative'));if(!l)return; if(l.locataire||l.occupant)put('fin-p-locataire',l.locataire||l.occupant);var a=amountOf(l); if(a){put('fin-p-montant',a);put('fin-p-paye',a);put('fin-p-reste',0);}};
  window.gpFinUpdateReste=function(){put('fin-p-reste',Math.max(0,n(val('fin-p-montant'))-n(val('fin-p-paye'))));};
  window.openFinanceDrawer=function(kind){
    addCompatStyle();document.querySelectorAll('#gpFinanceDrawer,#gpFinanceOverlay').forEach(function(e){e.remove();});
    var title=kind==='paiement'?'Nouveau paiement':'Nouvelle dépense';
    var sub=kind==='paiement'?'Enregistrez un paiement de loyer':'Renseignez les informations de la dépense';
    var body=kind==='paiement'
      ? '<div class="gp-drawer-section"><h3>Paiement</h3><div class="gp-form-row"><div class="gp-field"><label>Locataire <b>*</b></label><select id="fin-p-locataire" onchange="gpFinSyncPayFromLocataire()"><option value="">Sélectionner</option></select></div><div class="gp-field"><label>Locative / Bien <b>*</b></label><select id="fin-p-locative" onchange="gpFinSyncPayFromLocative()"><option value="">Sélectionner</option></select></div></div><div class="gp-form-row"><div class="gp-field"><label>Montant dû (FCFA) <b>*</b></label><input id="fin-p-montant" type="number" placeholder="150000" oninput="gpFinUpdateReste()"></div><div class="gp-field"><label>Montant payé (FCFA) <b>*</b></label><input id="fin-p-paye" type="number" placeholder="150000" oninput="gpFinUpdateReste()"></div></div><div class="gp-form-row"><div class="gp-field"><label>Reste (FCFA)</label><input id="fin-p-reste" type="number" placeholder="0" readonly style="background:#f5f5f5"></div><div class="gp-field"><label>Mode de paiement</label><select id="fin-p-mode"><option>Espèces</option><option>Virement</option><option>Chèque</option><option>Mobile Money</option><option>Wave</option><option>Orange Money</option></select></div></div><div class="gp-form-row full"><div class="gp-field"><label>Date de paiement <b>*</b></label><input id="fin-p-date" type="date"></div></div></div>'
      : '<div class="gp-drawer-section"><h3>Dépense</h3><div class="gp-form-row full"><div class="gp-field"><label>Type de dépense</label><select id="fin-d-type"><option value="bien">Travaux / Réparations des biens</option><option value="agence">Dépense agence</option></select></div></div><div class="gp-form-row full"><div class="gp-field"><label>Libellé <b>*</b></label><input id="fin-d-libelle" placeholder="Réparation toiture, transport agence..."></div></div><div class="gp-form-row"><div class="gp-field"><label>Catégorie</label><select id="fin-d-cat"><option>Travaux</option><option>Réparation</option><option>Entretien</option><option>Transport</option><option>Facture agence</option><option>Fournitures</option><option>Taxe</option><option>Assurance</option><option>Autre</option></select></div><div class="gp-field"><label>Montant (FCFA) <b>*</b></label><input id="fin-d-montant" type="number" placeholder="50000"></div></div><div class="gp-form-row"><div class="gp-field"><label>Date <b>*</b></label><input id="fin-d-date" type="date"></div><div class="gp-field"><label>Bien concerné</label><select id="fin-d-bien"><option value="">Sélectionnez un bien enregistré</option></select></div></div><div class="gp-mini-help">Propriétaire récupéré automatiquement</div><div class="gp-form-row"><div class="gp-field"><label>Facture / justificatif</label><input id="fin-d-facture" type="file" accept="image/*,.pdf"></div><div class="gp-field"><label>Facturable au propriétaire ?</label><select id="fin-d-facturable"><option value="oui">Oui, inclure sur facture propriétaire</option><option value="non">Non</option></select></div></div></div>';
    document.body.insertAdjacentHTML('beforeend','<div id="gpFinanceOverlay" class="gp-drawer-overlay" onclick="closeFinanceDrawer()"></div><div id="gpFinanceDrawer" class="gp-drawer gp-compact-finance"><div class="gp-drawer-head"><div><div class="gp-drawer-title">'+title+'</div><div class="gp-drawer-sub">'+sub+'</div></div><button class="gp-drawer-close" onclick="closeFinanceDrawer()"><span class="material-symbols-rounded">close</span></button></div><div class="gp-drawer-body">'+body+'</div><div class="gp-drawer-foot"><button class="gp-cancel" onclick="closeFinanceDrawer()">Annuler</button><button class="gp-save" onclick="saveFinanceDrawer(\''+kind+'\')">Enregistrer</button></div></div>');
    window.gpFinanceFillSelects(); var today=new Date().toISOString().slice(0,10); if(kind==='paiement')put('fin-p-date',today); else put('fin-d-date',today);
    var o=document.getElementById('gpFinanceOverlay'),dr=document.getElementById('gpFinanceDrawer');o.style.display='block';dr.style.display='flex';requestAnimationFrame(function(){o.style.opacity='1';dr.style.transform='translateX(0)';});
  };
  var oldOpenPay=window.openPayModal, oldOpenDep=window.openDepModal;
  window.openPayModal=function(){
    addCompatStyle();
    if (typeof window.openFinanceDrawer === 'function') return window.openFinanceDrawer('paiement');
    if(typeof oldOpenPay==='function')oldOpenPay.apply(this,arguments);
    window.gpFinanceFillSelects();
  };
  window.openDepModal=function(){
    addCompatStyle();
    if (typeof window.openFinanceDrawer === 'function') return window.openFinanceDrawer('depense');
    if(typeof oldOpenDep==='function')oldOpenDep.apply(this,arguments);
    window.gpFinanceFillSelects();
  };
  var oldSave=window.saveFinanceDrawer;
  window.saveFinanceDrawer=function(kind){
    if(kind==='paiement'){window.gpFinUpdateReste();}
    if(kind==='depense'){
      var d=db(); if(!Array.isArray(d.depenses))d.depenses=[];
      var row={type:val('fin-d-type')==='bien'?'Travaux / Réparations des biens':'Dépense agence',libelle:val('fin-d-libelle'),cat:val('fin-d-cat'),categorie:val('fin-d-cat'),montant:val('fin-d-montant'),date:val('fin-d-date'),bien:val('fin-d-bien'),facturable:val('fin-d-facturable')};
      if(!row.libelle)return (window.toast?toast('Le libellé est requis','err'):alert('Le libellé est requis'));
      d.depenses.unshift(row); try{if(window.GPDB&&GPDB.save)GPDB.save(d);else localStorage.setItem('geniusproperty_db_clean_v1',JSON.stringify(d));}catch(e){} window.DB=d; closeFinanceDrawer(); if(window.renderDepensesFinal)renderDepensesFinal(); else if(window.renderDepenses)renderDepenses(); if(window.toast)toast('Dépense enregistrée ✓'); return;
    }
    if(typeof oldSave==='function')return oldSave(kind);
  };
})();
