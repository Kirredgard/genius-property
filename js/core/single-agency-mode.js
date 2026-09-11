/* Genius Property — Single Agency Mode
   Application destinée à une seule agence, usage interne uniquement.
   Aucun abonnement, aucune licence commerciale, aucun espace client SaaS.
*/
(function(){
  'use strict';
  var COMMERCIAL_PAGES = {
    'abonnement': true,
    'admin-saas': true,
    'license-manager': true,
    'license-activation': true
  };

  function isCommercialPage(page){ return !!COMMERCIAL_PAGES[page]; }

  function applyUI(){
    document.querySelectorAll('[data-page="abonnement"],[data-page="admin-saas"],[data-page="license-manager"],[data-page="license-activation"]').forEach(function(el){
      el.style.display='none';
      el.setAttribute('aria-hidden','true');
    });
    document.querySelectorAll('.gp-sidebar-licence-badge,.slb-separator').forEach(function(el){
      el.style.display='none';
    });
  }

  window.GPSingleAgency = {
    enabled: true,
    agencyOnly: true,
    commercial: false,
    localAuth: true,
    isCommercialPage: isCommercialPage,
    applyUI: applyUI
  };

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(applyUI, 50); });
  document.addEventListener('gp:auth-changed', applyUI);
  document.addEventListener('gp:navigation', applyUI);
})();
