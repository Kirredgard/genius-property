/* Genius Property — correctif final clics Bureau/KPI
   Chargé en dernier pour neutraliser les wrappers navigate() qui cassent les actions du dashboard. */
(function(){
  'use strict';

  function pageEl(page){ return document.getElementById('page-' + page); }
  function call(name){ try{ if(typeof window[name] === 'function') return window[name].apply(window, Array.prototype.slice.call(arguments,1)); }catch(e){ console.error('[dashboard-actions-fix]', name, e); } }

  function ensureActive(page){
    var el = pageEl(page);
    if(!el) return false;
    document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); p.style.display = ''; });
    el.classList.add('active');
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){ li.classList.toggle('active', li.dataset.page === page); });
    window.GP_CURRENT_PAGE = page;
    try{ localStorage.setItem('gp_last_page', page); }catch(_){ }
    call('updateGlobalBreadcrumb', page);
    call('appliqueDroitsPage', page);
    return true;
  }

  function renderKnown(page){
    if(page === 'dashboard') return call('renderDashboard');
    if(page === 'biens') return call('renderBiensFinal') || call('renderBiensFinal2') || call('renderBiensCards') || call('renderBiens');
    if(page === 'locataires') return call('renderLocatairesModern') || call('renderLocataires');
    if(page === 'paiements') return call('renderPaiementsFinal') || call('renderPaiements');
    if(page === 'depenses') return call('renderDepensesFinal') || call('renderDepenses');
    if(page === 'avenir') return call('renderAvenir');
    if(window.GPNavigation && typeof window.GPNavigation.renderPage === 'function'){
      try{ return window.GPNavigation.renderPage(page); }catch(e){ console.error('[dashboard-actions-fix] renderPage', e); }
    }
  }

  function go(page){
    if(!page) return;
    var ok = false;
    try{
      if(window.GPNavigation && typeof window.GPNavigation.navigate === 'function'){
        window.GPNavigation.navigate(page);
        ok = !!(pageEl(page) && pageEl(page).classList.contains('active'));
      }
    }catch(e){ console.warn('[dashboard-actions-fix] GPNavigation.navigate failed', e); }
    if(!ok){ ensureActive(page); renderKnown(page); }
    setTimeout(function(){
      if(!(pageEl(page) && pageEl(page).classList.contains('active'))){ ensureActive(page); }
      renderKnown(page);
    }, 30);
  }

  function openPayments(kind){
    try{ sessionStorage.setItem('gp_paiements_filter', kind || ''); }catch(_){ }
    if(kind === 'late' || kind === 'retard'){
      go('avenir');
      setTimeout(function(){
        call('filterAvenir', 'retard');
        var b = document.getElementById('av-btn-retard');
        if(b) b.classList.add('btn-primary');
      }, 80);
      return;
    }
    go('paiements');
  }

  function openBienType(type){
    try{ sessionStorage.setItem('gp_biens_type_filter', type || ''); localStorage.setItem('gp_biens_type_filter', type || ''); }catch(_){ }
    go('biens');
    setTimeout(function(){
      var input = document.getElementById('gpBienSearch') || document.getElementById('biensSearch');
      if(input && type){ input.value = type; }
      call('renderBiensFinal') || call('renderBiensFinal2') || call('renderBiensCards', true) || call('renderBiens');
    }, 80);
  }

  window.gpDashboardGo = go;
  window.gdOpenPayments = openPayments;
  window.gdOpenBienType = openBienType;

  document.addEventListener('click', function(e){
    var kpi = e.target.closest('#page-dashboard .gd-kpi');
    if(kpi){
      var text = (kpi.textContent || '').toLowerCase();
      if(text.indexOf('bien') !== -1){ e.preventDefault(); e.stopPropagation(); go('biens'); return; }
      if(text.indexOf('locataire') !== -1){ e.preventDefault(); e.stopPropagation(); go('locataires'); return; }
      if(text.indexOf('loyer') !== -1){ e.preventDefault(); e.stopPropagation(); go('paiements'); return; }
      if(text.indexOf('dépense') !== -1 || text.indexOf('depense') !== -1){ e.preventDefault(); e.stopPropagation(); go('depenses'); return; }
      if(text.indexOf('alerte') !== -1 || text.indexOf('retard') !== -1){ e.preventDefault(); e.stopPropagation(); openPayments('late'); return; }
    }

    var btn = e.target.closest('#page-dashboard .gd-alerts-panel .gd-panel-head button, #page-dashboard .gd-alert');
    if(btn){ e.preventDefault(); e.stopPropagation(); openPayments('late'); return; }

    var payBtn = e.target.closest('#page-dashboard .gd-table-panel .gd-panel-head button, #page-dashboard .gd-click-row');
    if(payBtn){ e.preventDefault(); e.stopPropagation(); openPayments('paid'); return; }
  }, true);

  document.addEventListener('change', function(e){
    var sel = e.target.closest('#page-dashboard .gd-type-select');
    if(sel && sel.value){ e.preventDefault(); openBienType(sel.value); }
  }, true);
})();
