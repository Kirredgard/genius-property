/* ============================================================
   Genius Property — Hotfix v4.8
   1. KPI Alertes bureau  → avenir + filtre retard
   2. Page "Paiements à venir" redesign moderne
   3. Compactage espaces KPIs + layout
   4. Bouton retour corrigé (→ paiements) + z-index fix
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. KPI ALERTES : déjà géré par dashboard-actions-fix.js
         On renforce juste pour les KPI de type "bureau" (gd-kpi) ──── */
  function ensureAlertKpiNav() {
    document.querySelectorAll(
      '#page-dashboard .gd-alert-kpi, #page-bureau .gd-alert-kpi'
    ).forEach(function (kpi) {
      kpi.style.cursor = 'pointer';
      if (kpi._alertFixed) return;
      kpi._alertFixed = true;
      kpi.addEventListener('click', function (e) {
        e.stopPropagation();
        if (typeof window.gdOpenPayments === 'function') {
          window.gdOpenPayments('late');
        } else if (typeof window.navigate === 'function') {
          window.navigate('avenir');
          setTimeout(function () {
            if (typeof window.filterAvenir === 'function') window.filterAvenir('retard');
          }, 100);
        }
      });
    });
  }

  /* ── 2. REDESIGN PAGE AVENIR ──────────────────────────────── */
  function injectAvenirStyle() {
    if (document.getElementById('gp-avenir-modern-style')) return;
    var css = `
      #page-avenir {
        padding: 0 !important;
      }
      /* Supprime l'ancien page-hero encombrant */
      #page-avenir .page-hero {
        display: none !important;
      }
      /* Header compact moderne */
      #gp-avenir-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }
      #gp-avenir-header h2 {
        font-size: 19px;
        font-weight: 900;
        color: #111;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        letter-spacing: -.2px;
      }
      body.dark #gp-avenir-header h2 { color: #eee !important; }
      #gp-avenir-header h2 .material-symbols-rounded {
        font-size: 20px;
        color: #2563eb;
      }
      #gp-avenir-back {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #dbeafe;
        color: #1d4ed8;
        border: 1.5px solid #bfdbfe;
        border-radius: 8px;
        padding: 5px 11px 5px 7px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: .15s;
        position: relative !important;
        z-index: 1 !important;
      }
      #gp-avenir-back:hover { background: #bfdbfe; }
      #gp-avenir-back .material-symbols-rounded { font-size: 14px; }

      /* KPIs compacts — enlève les gaps excessifs */
      #page-avenir .stats {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin-bottom: 8px !important;
        max-width: none !important;
      }
      #page-avenir .stat-card {
        padding: 8px 10px !important;
        min-height: 58px !important;
        border-radius: 10px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      #page-avenir .stat-card p {
        font-size: 10px !important;
        margin: 0 !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: .2px !important;
        color: #64748b !important;
      }
      #page-avenir .stat-card h3 {
        font-size: 22px !important;
        font-weight: 900 !important;
        margin: 0 !important;
        line-height: 1 !important;
      }
      /* Alert banner compact */
      #av-alert-banner {
        margin-bottom: 8px !important;
        padding: 8px 12px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
      }
      /* Container et toolbar */
      #page-avenir .container {
        padding: 10px !important;
        border-radius: 12px !important;
      }
      #page-avenir .container > div:first-child {
        margin-bottom: 8px !important;
        gap: 6px !important;
        flex-wrap: wrap !important;
      }
      /* Boutons filtres compacts */
      #av-btn-tous, #av-btn-retard, #av-btn-urgent, #av-btn-avenir {
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        font-size: 11px !important;
        border-radius: 6px !important;
        font-weight: 700 !important;
      }
      /* Table */
      #page-avenir table {
        font-size: 11.5px !important;
      }
      #page-avenir table th {
        font-size: 10px !important;
        padding: 7px 8px !important;
        background: #f9fafb !important;
        text-transform: uppercase !important;
        letter-spacing: .3px !important;
      }
      #page-avenir table td {
        padding: 8px !important;
        font-size: 11px !important;
      }
      #page-avenir .badge {
        font-size: 9.5px !important;
        padding: 2px 7px !important;
        border-radius: 20px !important;
      }
      /* Footer pagination */
      #av-footer {
        margin-top: 8px !important;
        font-size: 11px !important;
      }
      /* Bouton retour — z-index safe */
      .btn-back-lnk {
        position: relative !important;
        z-index: 1 !important;
      }
    `;
    var style = document.createElement('style');
    style.id = 'gp-avenir-modern-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectAvenirHeader() {
    var page = document.getElementById('page-avenir');
    if (!page || document.getElementById('gp-avenir-header')) return;

    var header = document.createElement('div');
    header.id = 'gp-avenir-header';
    header.innerHTML = '<h2><span class="material-symbols-rounded">event_upcoming</span>Paiements à venir</h2>' +
      '<button id="gp-avenir-back" onclick="(function(){' +
        'if(typeof window.navigate===\'function\'){window.navigate(\'paiements\');}' +
      '})()"><span class="material-symbols-rounded">arrow_back</span> Retour</button>';

    // Insert before the .stats or as first child
    var stats = page.querySelector('.stats');
    if (stats) {
      page.insertBefore(header, stats);
    } else {
      page.insertBefore(header, page.firstChild);
    }
  }

  /* ── 3. BOUTON RETOUR BUG : le bouton `navigate('paiements')`
         peut échouer si navigate est wrappé. On patch l'onclick. ── */
  function fixBackButton() {
    document.querySelectorAll('#page-avenir .btn-back-lnk, #page-avenir button[onclick*="navigate"]').forEach(function (btn) {
      if (btn._backFixed) return;
      btn._backFixed = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // Use the most reliable navigation method available
        var tried = false;
        if (typeof window.gpDashboardGo === 'function') {
          window.gpDashboardGo('paiements');
          tried = true;
        } else if (window.GPNavigation && typeof window.GPNavigation.navigate === 'function') {
          window.GPNavigation.navigate('paiements');
          tried = true;
        } else if (typeof window.navigate === 'function') {
          window.navigate('paiements');
          tried = true;
        }
        if (!tried) {
          // Manual fallback
          document.querySelectorAll('.page').forEach(function (p) {
            p.classList.remove('active');
            p.style.display = '';
          });
          var target = document.getElementById('page-paiements');
          if (target) {
            target.classList.add('active');
            window.GP_CURRENT_PAGE = 'paiements';
            if (typeof window.renderPaiementsFinal === 'function') window.renderPaiementsFinal();
            else if (typeof window.renderPaiements === 'function') window.renderPaiements();
          }
        }
      });
    });
  }

  /* ── 4. SUPPRIMER L'ESPACE APRÈS PAGE-HERO (maintenant masqué) ── */
  function patchAvenirLayout() {
    injectAvenirStyle();
    injectAvenirHeader();
    fixBackButton();
  }

  /* ── 5. Observe navigation to patch on page show ────────────── */
  var patchOnNav = function (page) {
    if (page === 'avenir') {
      setTimeout(patchAvenirLayout, 20);
    }
  };

  // Wrap navigate
  var _origNav = window.navigate;
  if (_origNav && !_origNav.__avenirFixed) {
    window.navigate = function (p) {
      var r = _origNav.apply(this, arguments);
      patchOnNav(p);
      return r;
    };
    window.navigate.__avenirFixed = true;
  }

  // Also wrap GPNavigation if exists
  if (window.GPNavigation && window.GPNavigation.navigate && !window.GPNavigation.navigate.__avenirFixed) {
    var _origGPNav = window.GPNavigation.navigate;
    window.GPNavigation.navigate = function (p) {
      var r = _origGPNav.apply(this, arguments);
      patchOnNav(p);
      return r;
    };
    window.GPNavigation.navigate.__avenirFixed = true;
  }

  /* ── 6. On DOM ready + re-check on avenir page open ─────────── */
  function init() {
    injectAvenirStyle();
    ensureAlertKpiNav();

    // If avenir page is already active
    var avenirPage = document.getElementById('page-avenir');
    if (avenirPage && avenirPage.classList.contains('active')) {
      patchAvenirLayout();
    }

    // MutationObserver to detect when avenir becomes active
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target && m.target.id === 'page-avenir' &&
            m.target.classList.contains('active')) {
          patchAvenirLayout();
        }
        // Also re-bind alert KPI buttons if dashboard re-renders
        if (m.target && (m.target.id === 'page-dashboard' || m.target.id === 'page-bureau')) {
          setTimeout(ensureAlertKpiNav, 50);
        }
      });
    });

    var content = document.querySelector('.content') || document.body;
    observer.observe(content, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-expose filterAvenir trigger for KPI clicks from dashboard
  window.__gpAvenirRetardFilter = function () {
    if (typeof window.navigate === 'function') window.navigate('avenir');
    setTimeout(function () {
      if (typeof window.filterAvenir === 'function') window.filterAvenir('retard');
    }, 100);
  };

})();
