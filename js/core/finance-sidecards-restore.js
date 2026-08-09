/* Restore finance right-side stat cards only (paiements + dépenses) */
/* DÉSACTIVÉ : finance-pages-sidecards-final.js génère déjà la colonne latérale.
   Ce fichier causait une colonne en doublon. */
(function(){
  'use strict';
  if (window.__gpFinanceSidecardsRestore) return;
  window.__gpFinanceSidecardsRestore = true;
  return; /* early exit */

  function db(){
    try { if (window.GPDB && GPDB.load) return GPDB.load() || {}; } catch(e) {}
    try { return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1') || '{}'); } catch(e) {}
    return window.DB || {};
  }
  function num(v){ return Number(String(v == null ? 0 : v).replace(/[^0-9,.-]/g,'').replace(',','.')) || 0; }
  function money(v){
    var n = num(v);
    return Math.round(n).toLocaleString('fr-FR') + ' FCFA';
  }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function injectCss(){
    if (document.getElementById('gp-finance-sidecards-restore-css')) return;
    document.head.insertAdjacentHTML('beforeend', '<style id="gp-finance-sidecards-restore-css">\
      #page-paiements .gp-finance-restored-layout,#page-depenses .gp-finance-restored-layout{display:grid!important;grid-template-columns:minmax(0,1fr) 220px!important;gap:14px!important;align-items:start!important;width:100%!important}\
      #page-paiements .gp-finance-restored-layout>.gp-table-wrap,#page-depenses .gp-finance-restored-layout>.gp-table-wrap{min-width:0!important;width:100%!important}\
      .gp-finance-sidecards{display:block!important;width:220px!important;min-width:220px!important}\
      .gp-finance-side-card{background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:12px;box-shadow:0 10px 24px rgba(15,23,42,.08);padding:14px;margin-bottom:12px}\
      .gp-finance-side-dark{background:linear-gradient(135deg,#0f172a,#111827);color:#fff;text-align:center;border-radius:12px;padding:18px 12px;box-shadow:0 10px 24px rgba(15,23,42,.12);margin-bottom:12px}\
      .gp-finance-side-dark small{display:block;font-size:9px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;font-weight:800}\
      .gp-finance-side-dark b{display:block;color:#facc15;font-size:20px;margin:6px 0;font-weight:900}\
      .gp-finance-side-title{font-size:11px;font-weight:900;color:#475569;text-transform:uppercase;border-bottom:1px solid #edf2f7;padding-bottom:8px;margin-bottom:10px}\
      .gp-finance-type-row{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:700;margin:8px 0;color:#334155}\
      .gp-finance-bar-bg{height:6px;background:#eef2f7;border-radius:999px;overflow:hidden;margin-top:8px}\
      .gp-finance-bar-fill{height:100%;background:#d4af37;border-radius:999px}\
      .gp-finance-month-total{text-align:center;color:#dc2626;font-weight:900;font-size:18px;margin:12px 0}\
      .gp-finance-mini-legend{display:flex;gap:8px;align-items:center;justify-content:center;font-size:9px;color:#64748b;flex-wrap:wrap}\
      .gp-finance-dot{width:9px;height:9px;display:inline-block;border-radius:2px;margin-right:3px;vertical-align:-1px}.gp-finance-dot.green{background:#16a34a}.gp-finance-dot.gold{background:#d4af37}.gp-finance-dot.blue{background:#7c9cf5}\
      .gp-finance-pay-donut{width:96px;height:96px;border-radius:50%;margin:12px auto;background:conic-gradient(#16a34a var(--paid),#d4af37 0);position:relative}\
      .gp-finance-pay-donut:after{content:"";position:absolute;inset:21px;background:#fff;border-radius:50%}\
      .gp-finance-card-center{text-align:center}.gp-finance-card-center h4{margin:4px 0 0;color:#64748b;font-size:12px}.gp-finance-card-center .total{font-weight:900;font-size:19px;color:#111827;margin-top:2px}.gp-finance-card-center p{font-size:11px;font-weight:800;margin:5px 0}.gp-finance-card-center p.ok{color:#16a34a}.gp-finance-card-center p.bad{color:#dc2626}\
      @media(max-width:1050px){#page-paiements .gp-finance-restored-layout,#page-depenses .gp-finance-restored-layout{grid-template-columns:1fr!important}.gp-finance-sidecards{width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.gp-finance-side-card,.gp-finance-side-dark{margin-bottom:0}}\
    </style>');
  }
  function ensureLayout(page){
    var root = document.getElementById('page-' + page);
    if (!root) return null;
    var table = root.querySelector('.gp-table-wrap');
    if (!table) return null;
    var existing = root.querySelector('.gp-finance-restored-layout');
    if (existing) return existing;
    var layout = document.createElement('div');
    layout.className = 'gp-finance-restored-layout';
    table.parentNode.insertBefore(layout, table);
    layout.appendChild(table);
    return layout;
  }
  function renderPaiementsCard(){
    var d = db(), all = Array.isArray(d.paiements) ? d.paiements : [];
    var total = all.reduce(function(s,x){ return s + num(x.montant); },0);
    var paye = all.reduce(function(s,x){ return s + num(x.paye || x.montantPaye); },0);
    var reste = all.reduce(function(s,x){ return s + num(x.reste || Math.max(0, num(x.montant)-num(x.paye || x.montantPaye))); },0);
    var pct = total ? Math.max(0, Math.min(100, Math.round(paye / total * 100))) : 0;
    return '<aside class="gp-finance-sidecards" data-finance-sidecards="paiements"><div class="gp-finance-side-card gp-finance-card-center"><h4>Total Montant</h4><div class="total">'+money(total)+'</div><div class="gp-finance-pay-donut" style="--paid:'+pct+'%"></div><div style="display:inline-block;text-align:left;font-size:10px;color:#64748b;margin-bottom:4px"><div><i class="gp-finance-dot green"></i> Payé</div><div><i class="gp-finance-dot gold"></i> Reste</div></div><p class="ok">Payé : '+money(paye)+'</p><p class="bad">Reste : '+money(reste)+'</p></div></aside>';
  }
  function depType(x){
    var raw = String(x.type || x.categorie || x.cat || '').toLowerCase();
    if (raw.indexOf('trav')>-1 || raw.indexOf('répar')>-1 || raw.indexOf('repar')>-1 || x.bien) return 'travaux';
    return 'agence';
  }
  function renderDepensesCard(){
    var d = db(), all = Array.isArray(d.depenses) ? d.depenses : [];
    var total = all.reduce(function(s,x){ return s + num(x.montant); },0);
    var ag = all.filter(function(x){return depType(x)==='agence';}).reduce(function(s,x){return s+num(x.montant);},0);
    var tr = all.filter(function(x){return depType(x)==='travaux';}).reduce(function(s,x){return s+num(x.montant);},0);
    var ym = new Date().toISOString().slice(0,7);
    var mois = all.filter(function(x){ return String(x.date || '').slice(0,7) === ym; }).reduce(function(s,x){ return s + num(x.montant); },0);
    var pct = total ? Math.max(8, Math.round(tr / total * 100)) : 0;
    return '<aside class="gp-finance-sidecards" data-finance-sidecards="depenses"><div class="gp-finance-side-dark"><small>Total dépenses</small><b>'+money(total)+'</b><span>'+all.length+' entrée'+(all.length>1?'s':'')+'</span></div><div class="gp-finance-side-card"><div class="gp-finance-side-title">Totaux par type</div><div class="gp-finance-type-row"><span>Dépenses agence</span><span>'+money(ag)+'</span></div><div class="gp-finance-type-row"><span>Travaux / Réparations</span><span>'+money(tr)+'</span></div><div class="gp-finance-bar-bg"><div class="gp-finance-bar-fill" style="width:'+pct+'%"></div></div></div><div class="gp-finance-side-card"><div class="gp-finance-side-title">Ce mois-ci</div><div class="gp-finance-month-total">'+money(mois)+'</div><div class="gp-finance-mini-legend"><span><i class="gp-finance-dot blue"></i> Agence</span><span><i class="gp-finance-dot gold"></i> Travaux / Réparations</span></div></div></aside>';
  }
  function restore(page){
    injectCss();
    var layout = ensureLayout(page);
    if (!layout) return;
    var old = layout.querySelector('.gp-finance-sidecards');
    if (old) old.remove();
    layout.insertAdjacentHTML('beforeend', page === 'paiements' ? renderPaiementsCard() : renderDepensesCard());
  }
  window.gpRestoreFinanceSidecards = function(){ restore('paiements'); restore('depenses'); };

  function afterRender(page){ setTimeout(function(){ if(page==='paiements' || page==='depenses') restore(page); }, 80); }
  var oldRenderPage = window.renderPage;
  window.renderPage = function(page){
    var r = oldRenderPage ? oldRenderPage.apply(this, arguments) : undefined;
    afterRender(page);
    return r;
  };
  var oldNavigate = window.navigate;
  window.navigate = function(page){
    var r = oldNavigate ? oldNavigate.apply(this, arguments) : undefined;
    afterRender(page);
    return r;
  };
  ['renderPaiements','renderPaiementsFinal','renderDepenses','renderDepensesFinal'].forEach(function(name){
    var fn = window[name];
    if (typeof fn === 'function' && !fn.__financeSidecardsWrapped) {
      var wrapped = function(){ var r = fn.apply(this, arguments); afterRender(name.toLowerCase().indexOf('paiement')>-1?'paiements':'depenses'); return r; };
      wrapped.__financeSidecardsWrapped = true;
      window[name] = wrapped;
    }
  });
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(window.gpRestoreFinanceSidecards, 1200); });
  setTimeout(window.gpRestoreFinanceSidecards, 1600);
})();
