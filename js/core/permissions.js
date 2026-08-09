/* Genius Property V28 — Roles & Permissions
   Définit les rôles complets et les permissions par page/action.
   Compatible avec l'ancien système: n'empêche pas l'admin, limite les autres rôles. */
(function(){
  'use strict';

  var ROLE_LABELS = {
    admin: 'Administrateur',
    agent: 'Agent immobilier',
    comptable: 'Comptable',
    lecture: 'Lecture seule'
  };

  var ROLE_PERMISSIONS = {
    admin: ['*'],
    agent: [
      'dashboard:view','biens:view','biens:write','proprietaires:view','proprietaires:write',
      'locataires:view','locataires:write','locatives:view','locatives:write','contrats:view','contrats:write',
      'paiements:view','avenir:view','fichiers:view','messages:view','messages:write','agenda:view','agenda:write',
      'agenda-employes:view','journal:view','parametres:view','sync:view'
    ],
    comptable: [
      'dashboard:view','biens:view','proprietaires:view','locataires:view','locatives:view','contrats:view',
      'paiements:view','paiements:write','avenir:view','depenses:view','depenses:write','rapports:view','rapports:export',
      'journal:view','parametres:view','sync:view'
    ],
    lecture: [
      'dashboard:view','biens:view','proprietaires:view','locataires:view','locatives:view','contrats:view',
      'paiements:view','avenir:view','depenses:view','rapports:view','messages:view','agenda:view','journal:view','sync:view'
    ]
  };

  var PAGE_ACTION = {
    dashboard:'dashboard:view', employes:'employes:view', proprietaires:'proprietaires:view', locataires:'locataires:view',
    biens:'biens:view', locatives:'locatives:view', contrats:'contrats:view', paiements:'paiements:view', avenir:'avenir:view',
    depenses:'depenses:view', fichiers:'fichiers:view', messages:'messages:view', 'agenda-employes':'agenda-employes:view',
    agenda:'agenda:view', rapports:'rapports:view', journal:'journal:view', droits:'droits:view', parametres:'parametres:view', sync:'sync:view',
    'admin-stockage':'admin-stockage:view', 'admin-saas':'admin-saas:view', 'license-manager':'license-manager:view', 'nv-bien':'biens:write', 'nv-locative':'locatives:write', 'nv-contrat':'contrats:write',
    'nv-employe':'employes:write', 'nv-proprietaire':'proprietaires:write', 'nv-locataire':'locataires:write',
    'bien-detail':'biens:view', 'proprietaire-detail':'proprietaires:view'
  };

  var HIDE_SELECTORS_BY_ROLE = {
    agent: ['#sideMenu li[data-page="admin-stockage"]','#sideMenu li[data-page="admin-saas"]','#sideMenu li[data-page="license-manager"]','#sideMenu li[data-page="droits"]'],
    comptable: ['#sideMenu li[data-page="admin-stockage"]','#sideMenu li[data-page="admin-saas"]','#sideMenu li[data-page="license-manager"]','#sideMenu li[data-page="droits"]','#sideMenu li[data-page="employes"]'],
    lecture: ['#sideMenu li[data-page="admin-stockage"]','#sideMenu li[data-page="admin-saas"]','#sideMenu li[data-page="license-manager"]','#sideMenu li[data-page="droits"]','#sideMenu li[data-page="employes"]',
      '#sideMenu li[data-page="nv-bien"]','#sideMenu li[data-page="nv-proprietaire"]','#sideMenu li[data-page="nv-locataire"]',
      '#sideMenu li[data-page="nv-locative"]','#sideMenu li[data-page="nv-contrat"]']
  };

  function currentRole(){
    if(window.GPAuth && typeof window.GPAuth.role === 'function') return window.GPAuth.role() || 'lecture';
    var u = window.currentUser || {};
    if(u.isAdmin) return 'admin';
    return u.role || 'lecture';
  }

  function normalizeAction(pageOrAction){
    if(!pageOrAction) return '';
    return PAGE_ACTION[pageOrAction] || pageOrAction;
  }

  function has(role, action){
    role = role || currentRole();
    action = normalizeAction(action);
    var list = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.lecture;
    return list.indexOf('*') !== -1 || list.indexOf(action) !== -1;
  }

  function canPage(page){ return has(currentRole(), PAGE_ACTION[page] || (page + ':view')); }
  function canWrite(domain){ return has(currentRole(), domain + ':write'); }
  function canExport(domain){ return has(currentRole(), domain + ':export'); }

  function applyUI(){
    var role = currentRole();
    // Masquer toutes les entrées menu qui ne sont pas autorisées par page.
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){
      var page = li.dataset.page;
      var ok = canPage(page);
      li.style.display = ok ? '' : 'none';
      li.setAttribute('aria-hidden', ok ? 'false' : 'true');
    });
    // Masquages supplémentaires conservateurs.
    (HIDE_SELECTORS_BY_ROLE[role] || []).forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){ el.style.display='none'; el.setAttribute('aria-hidden','true'); });
    });
    // Lecture seule: désactive les boutons d'écriture marqués data-write-action.
    document.querySelectorAll('[data-write-action]').forEach(function(el){
      var domain = el.getAttribute('data-write-action');
      var allowed = canWrite(domain);
      el.disabled = !allowed;
      el.classList.toggle('gp-disabled-by-role', !allowed);
      if(!allowed) el.title = 'Action non autorisée pour le rôle ' + (ROLE_LABELS[role] || role);
    });
  }

  function explain(role){
    role = role || currentRole();
    return { role: role, label: ROLE_LABELS[role] || role, permissions: (ROLE_PERMISSIONS[role] || []).slice() };
  }

  document.addEventListener('DOMContentLoaded', applyUI);
  document.addEventListener('gp:auth-changed', applyUI);
  document.addEventListener('gp:navigation', applyUI);

  window.GPPermissions = {
    labels: ROLE_LABELS,
    matrix: ROLE_PERMISSIONS,
    pageAction: PAGE_ACTION,
    currentRole: currentRole,
    has: has,
    canPage: canPage,
    canWrite: canWrite,
    canExport: canExport,
    applyUI: applyUI,
    explain: explain
  };
})();
