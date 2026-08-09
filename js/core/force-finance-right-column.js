/* Force Paiements/Dépenses right graph/stat column — final targeted fix */
/* DÉSACTIVÉ : finance-pages-sidecards-final.js génère déjà la colonne latérale
   dans son innerHTML. Ce fichier causait une 2e/3e colonne en doublon. */
(function(){
  'use strict';
  if (window.__gpForceFinanceRightColumn) return;
  window.__gpForceFinanceRightColumn = true;
  return; /* early exit — tout le reste est désactivé */

  function db(){
    try { if (window.GPDB && GPDB.load) return GPDB.load() || {}; } catch(e) {}
    try { return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1') || '{}'); } catch(e) {}
    return window.DB || {};
  }
  function num(v){ return Number(String(v == null ? 0 : v).replace(/[^0-9,.-]/g,'').replace(',','.')) || 0; }
  function money(v){ return Math.round(num(v)).toLocaleString('fr-FR') + ' FCFA'; }
  function depKind(x){
    var s = String((x && (x.type || x.cat || x.categorie)) || '').toLowerCase();
    if (s.indexOf('trav') > -1 || s.indexOf('répar') > -1 || s.indexOf('repar') > -1 || (x && x.bien)) return 'travaux';
    return 'agence';
  }
  function css(){
    if (document.getElementById('gp-force-finance-right-column-css')) return;
    document.head.insertAdjacentHTML('beforeend', '<style id="gp-force-finance-right-column-css">\
      #page-paiements .gp-force-finance-layout,#page-depenses .gp-force-finance-layout{display:grid!important;grid-template-columns:minmax(0,1fr) 210px!important;gap:12px!important;align-items:start!important;width:100%!important;max-width:100%!important;overflow:visible!important}\
      #page-paiements .gp-force-finance-layout>.gp-table-wrap,#page-depenses .gp-force-finance-layout>.gp-table-wrap{min-width:0!important;width:100%!important;max-width:100%!important;overflow-x:auto!important}\
      #page-paiements .gp-force-finance-aside,#page-depenses .gp-force-finance-aside{display:flex!important;flex-direction:column!important;gap:10px!important;width:210px!important;min-width:210px!important;max-width:210px!important;position:sticky!important;top:10px!important;z-index:2!important}\
      #page-paiements .gp-force-card,#page-depenses .gp-force-card{background:#fff!important;border:1px solid rgba(15,23,42,.08)!important;border-radius:12px!important;padding:12px!important;box-shadow:0 8px 18px rgba(15,23,42,.08)!important;text-align:center!important;color:#0f172a!important}\
      #page-depenses .gp-force-dark{background:linear-gradient(135deg,#0f172a,#111827)!important;color:#fff!important;border-radius:12px!important;padding:14px 10px!important;box-shadow:0 8px 18px rgba(15,23,42,.12)!important;text-align:center!important}\
      .gp-force-title{font-size:10px!important;text-transform:uppercase!important;letter-spacing:1.2px!important;font-weight:900!important;color:#64748b!important;border-bottom:1px solid #eef2f7!important;padding-bottom:7px!important;margin-bottom:9px!important;text-align:left!important}\
      .gp-force-dark .gp-force-title{border:0!important;color:#cbd5e1!important;text-align:center!important;margin-bottom:4px!important;padding:0!important}\
      .gp-force-total{font-size:19px!important;font-weight:900!important;line-height:1.1!important;color:#111827!important;margin:3px 0 8px!important}\
      .gp-force-dark .gp-force-total{color:#facc15!important;font-size:20px!important}\
      .gp-force-sub{font-size:10px!important;color:#94a3b8!important;font-weight:700!important}\
      .gp-force-donut{width:88px!important;height:88px!important;border-radius:50%!important;margin:10px auto!important;background:conic-gradient(#16a34a var(--paid),#d4af37 0)!important;position:relative!important}\
      .gp-force-donut:after{content:""!important;position:absolute!important;inset:20px!important;background:#fff!important;border-radius:50%!important}\
      .gp-force-legend{display:inline-block!important;text-align:left!important;font-size:10px!important;color:#64748b!important;line-height:1.45!important;margin:0 auto 4px!important}\
      .gp-force-dot{display:inline-block!important;width:9px!important;height:9px!important;border-radius:2px!important;margin-right:5px!important;vertical-align:-1px!important;background:#16a34a!important}.gp-force-dot.gold{background:#d4af37!important}.gp-force-dot.blue{background:#7c9cf5!important}\
      .gp-force-ok{color:#16a34a!important;font-size:12px!important;font-weight:900!important;margin:4px 0!important}.gp-force-bad{color:#dc2626!important;font-size:12px!important;font-weight:900!important;margin:4px 0!important}\
      .gp-force-row{display:flex!important;justify-content:space-between!important;gap:8px!important;align-items:center!important;font-size:10px!important;font-weight:800!important;color:#334155!important;margin:7px 0!important;text-align:left!important}.gp-force-row span:last-child{white-space:nowrap!important}\
      .gp-force-bar-bg{height:6px!important;background:#eef2f7!important;border-radius:999px!important;overflow:hidden!important;margin-top:8px!important}.gp-force-bar{height:100%!important;background:#d4af37!important;border-radius:999px!important}\
      .gp-force-month{font-size:17px!important;font-weight:900!important;color:#dc2626!important;margin:8px 0!important}\
      #page-paiements .gp-fin-layout,#page-depenses .gp-fin-layout,#page-paiements .gp-fin-layout-final,#page-depenses .gp-fin-layout-final{grid-template-columns:minmax(0,1fr) 210px!important;gap:12px!important}\
      #page-paiements .gp-fin-side,#page-depenses .gp-fin-side,#page-paiements .gp-sidecards-final,#page-depenses .gp-sidecards-final{display:flex!important;flex-direction:column!important;width:210px!important;min-width:210px!important;max-width:210px!important;position:sticky!important;top:10px!important}\
      @media(max-width:980px){#page-paiements .gp-force-finance-layout,#page-depenses .gp-force-finance-layout{grid-template-columns:1fr!important}#page-paiements .gp-force-finance-aside,#page-depenses .gp-force-finance-aside{width:100%!important;min-width:0!important;max-width:none!important;position:static!important;display:grid!important;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important}}\
    </style>');
  }
  function paiementAside(){
    var d = db(), all = Array.isArray(d.paiements) ? d.paiements : [];
    var total = all.reduce(function(s,x){ return s + num(x.montant); }, 0);
    var paye = all.reduce(function(s,x){ return s + num(x.paye || x.montantPaye); }, 0);
    var reste = all.reduce(function(s,x){ return s + num(x.reste || Math.max(0, num(x.montant) - num(x.paye || x.montantPaye))); }, 0);
    var pct = total ? Math.max(0, Math.min(100, Math.round((paye / total) * 100))) : 0;
    return '<aside class="gp-force-finance-aside" data-force-aside="paiements"><div class="gp-force-card"><div class="gp-force-title" style="text-align:center!important;border:0!important;margin-bottom:4px!important">Total Montant</div><div class="gp-force-total">'+money(total)+'</div><div class="gp-force-donut" style="--paid:'+pct+'%"></div><div class="gp-force-legend"><div><i class="gp-force-dot"></i>Payé</div><div><i class="gp-force-dot gold"></i>Reste</div></div><p class="gp-force-ok">Payé : '+money(paye)+'</p><p class="gp-force-bad">Reste : '+money(reste)+'</p></div></aside>';
  }
  function depensesAside(){
    var d = db(), all = Array.isArray(d.depenses) ? d.depenses : [];
    var total = all.reduce(function(s,x){ return s + num(x.montant); }, 0);
    var ag = all.filter(function(x){ return depKind(x) === 'agence'; }).reduce(function(s,x){ return s + num(x.montant); }, 0);
    var tr = all.filter(function(x){ return depKind(x) === 'travaux'; }).reduce(function(s,x){ return s + num(x.montant); }, 0);
    var ym = new Date().toISOString().slice(0,7);
    var mois = all.filter(function(x){ return String(x.date || '').slice(0,7) === ym; }).reduce(function(s,x){ return s + num(x.montant); }, 0);
    var pct = total ? Math.max(4, Math.min(100, Math.round((tr / total) * 100))) : 0;
    return '<aside class="gp-force-finance-aside" data-force-aside="depenses"><div class="gp-force-dark"><div class="gp-force-title">Total dépenses</div><div class="gp-force-total">'+money(total)+'</div><div class="gp-force-sub">'+all.length+' entrée'+(all.length>1?'s':'')+'</div></div><div class="gp-force-card"><div class="gp-force-title">Totaux par type</div><div class="gp-force-row"><span>Dépenses agence</span><span>'+money(ag)+'</span></div><div class="gp-force-row"><span>Travaux / Réparations</span><span>'+money(tr)+'</span></div><div class="gp-force-bar-bg"><div class="gp-force-bar" style="width:'+pct+'%"></div></div></div><div class="gp-force-card"><div class="gp-force-title">Ce mois-ci</div><div class="gp-force-month">'+money(mois)+'</div><div class="gp-force-legend"><span><i class="gp-force-dot blue"></i>Agence</span><br><span><i class="gp-force-dot gold"></i>Travaux / Réparations</span></div></div></aside>';
  }
  function ensure(pageId){
    css();
    var page = document.getElementById('page-' + pageId);
    if (!page || !page.classList.contains('active')) return;
    var root = page.querySelector('.gp-modern-page') || page;
    var layout = page.querySelector('.gp-force-finance-layout') || page.querySelector('.gp-fin-layout') || page.querySelector('.gp-fin-layout-final') || page.querySelector('.pay-layout');
    var table = page.querySelector('.gp-table-wrap') || (page.querySelector('.container table') ? page.querySelector('.container') : null);
    if (!table) return;
    if (!layout || layout === table || !layout.contains(table)) {
      layout = document.createElement('div');
      layout.className = 'gp-force-finance-layout';
      table.parentNode.insertBefore(layout, table);
      layout.appendChild(table);
    } else {
      layout.classList.add('gp-force-finance-layout');
    }
    var old = layout.querySelector('[data-force-aside]');
    if (old) old.remove();
    var existing = layout.querySelector('.gp-fin-side,.gp-sidecards-final,.pay-summary');
    if (existing) existing.style.display = 'none';
    layout.insertAdjacentHTML('beforeend', pageId === 'paiements' ? paiementAside() : depensesAside());
  }
  function run(){ ensure('paiements'); ensure('depenses'); }
  var scheduled = false;
  function schedule(){ if (scheduled) return; scheduled = true; setTimeout(function(){ scheduled = false; run(); }, 60); }
  var oldNavigate = window.navigate;
  window.navigate = function(){ var r = oldNavigate ? oldNavigate.apply(this, arguments) : undefined; schedule(); setTimeout(run, 180); return r; };
  ['renderPaiements','renderDepenses','renderPaiementsFinal','renderDepensesFinal','gpFinancePage','gpRestorePage'].forEach(function(name){
    var fn = window[name];
    if (typeof fn === 'function' && !fn.__gpForceWrapped) {
      window[name] = function(){ var r = fn.apply(this, arguments); schedule(); return r; };
      window[name].__gpForceWrapped = true;
    }
  });
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(run, 250); setTimeout(run, 900); setTimeout(run, 1600); });
  new MutationObserver(schedule).observe(document.documentElement, {childList:true, subtree:true});
})();
