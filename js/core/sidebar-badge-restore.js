/* ================================================================
   Genius Property V21 — Restauration badge Abonnement (sidebar)
   Source : consolidated-hotfixes.js section "sidebar-licence-badge" (V48/V20)

   Ce fichier remet le badge doré d'abonnement dans la sidebar,
   identique à l'ancienne version.

   Installation :
     1. Copier ce fichier dans js/core/sidebar-badge-restore.js
     2. Dans index.html, ajouter AVANT la balise </body> :
        <script src="js/core/sidebar-badge-restore.js" defer></script>
================================================================ */
(function () {
  'use strict';

  /* Mapping des types de licence vers label lisible */
  function planLabel(type) {
    var map = {
      starter:    'Starter',
      pro:        'Pro',
      business:   'Business',
      agency:     'Pro',
      solo:       'Starter',
      trial:      'Abonnement',
      enterprise: 'Enterprise',
      lifetime:   'Lifetime'
    };
    return map[String(type || '').toLowerCase()] || 'Abonnement';
  }

  function fmtDate(d) {
    if (!d) return null;
    try {
      var dt = (d && typeof d.toDate === 'function') ? d.toDate() : new Date(d);
      if (isNaN(dt.getTime())) return null;
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return null; }
  }

  function renderBadge() {
    var el = document.getElementById('gp-sidebar-licence-badge');
    if (!el) return;

    var s = (window.GPLicenseGuard && typeof window.GPLicenseGuard.status === 'function')
            ? window.GPLicenseGuard.status() : null;

    /* Affiche un état par défaut si pas encore chargé */
    if (!s || !s.license) {
      el.style.display = '';
      el.innerHTML =
        '<span class="material-symbols-rounded slb-icon">star</span>' +
        '<div class="slb-body">' +
          '<div class="slb-top"><span class="slb-plan">Abonnement</span></div>' +
          '<span class="slb-date">Chargement\u2026</span>' +
        '</div>';
      return;
    }

    var lic     = s.license;
    var type    = lic.type || '';
    var plan    = planLabel(type);
    var expired = lic.locked || lic.status === 'expired';
    var warn    = !expired && typeof lic.daysLeft === 'number' && lic.daysLeft <= 7;
    var dateFmt = fmtDate(lic.expiresAt);
    var dateTxt = dateFmt ? ('Expire le ' + dateFmt) : 'Sans expiration';
    var pillCls = expired ? 'slb-pill expired' : (warn ? 'slb-pill warn' : 'slb-pill');
    var pillTxt = expired ? 'Expiré' : 'Active';

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

  /* Écoute la mise à jour de licence */
  window.addEventListener('gp:license-updated', renderBadge);

  /* Rendu initial + retry car GPLicenseGuard charge en async */
  function tryRender(attempts) {
    if (document.getElementById('gp-sidebar-licence-badge')) {
      renderBadge();
      if (attempts < 12) {
        setTimeout(function () { tryRender(attempts + 1); }, 700);
      }
    } else if (attempts < 15) {
      setTimeout(function () { tryRender(attempts + 1); }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryRender(0); });
  } else {
    tryRender(0);
  }

})();
