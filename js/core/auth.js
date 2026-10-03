/* Genius Property V27 — Auth & Role Guard
   Couche légère au-dessus du système existant : expose l'utilisateur courant,
   centralise les rôles, protège explicitement les pages admin. */
(function(){
  'use strict';

  var ADMIN_ONLY = ['admin-stockage'];
  // Multi-agences : ces pages sont réservées au super_admin (propriétaire de la plateforme),
  // pas aux administrateurs d'agence.
  var SUPER_ONLY = ['admin-stockage'];
  var ROLE_LABELS = {
    admin: 'Administrateur',
    gestionnaire: 'Gestionnaire',
    agent: 'Agent',
    comptable: 'Comptable',
    lecture: 'Lecture seule'
  };

  var _lastBadgeState = null;
  var _lastMenuState = null;

  function getUser(){
    return window.currentUser || null;
  }

  function isLoggedIn(){
    return !!getUser();
  }

  function isAdmin(){
    var u = getUser();
    return !!(u && u.isAdmin);
  }

  function isSuperAdmin(){
    var u = getUser();
    return !!(u && u.isSuperAdmin);
  }

  function role(){
    var u = getUser();
    if(!u) return null;
    // Supabase profile is the source of truth in V22.
    var explicit = String(u.role || '').toLowerCase().trim();
    if(explicit === 'admin' || u.isAdmin) return 'admin';
    if(explicit === 'gestionnaire') return 'gestionnaire';
    if(explicit === 'comptable') return 'comptable';
    if(explicit === 'agent') return 'agent';
    if(explicit === 'lecture' || explicit === 'readonly') return 'lecture';
    // Legacy fallback for old local employee records.
    var d = u.droits || {};
    if(d.depenses || d.paiements || d.rapports) return 'comptable';
    if(d.proprietaires || d.locataires || d.bail || d.contrats) return 'agent';
    return 'lecture';
  }

  function can(page){
    if(SUPER_ONLY.indexOf(page) !== -1) return isSuperAdmin();
    if(ADMIN_ONLY.indexOf(page) !== -1) return isAdmin();
    if(window.GPPermissions && typeof window.GPPermissions.canPage === 'function'){
      return !!window.GPPermissions.canPage(page);
    }
    if(typeof window.canAccess === 'function'){
      try { return !!window.canAccess(page); }
      catch(e){ console.warn('[GPAuth] canAccess legacy error:', e); }
    }
    return isAdmin() || page === 'dashboard';
  }

  function requireAdmin(page){
    if(SUPER_ONLY.indexOf(page) !== -1 ? isSuperAdmin() : isAdmin()) return true;
    if(typeof window.toast === 'function') window.toast(SUPER_ONLY.indexOf(page) !== -1 ? 'Accès réservé au propriétaire de la plateforme.' : 'Accès réservé à l’administrateur.', 'err');
    if(window.GPNavigation && typeof window.GPNavigation.navigate === 'function'){
      window.GPNavigation.navigate('dashboard');
    }
    return false;
  }

  function protectMenus(){
    var state = (isAdmin() ? 'admin' : 'user') + (isSuperAdmin() ? '-super' : '');
    if(_lastMenuState === state) return;
    _lastMenuState = state;
    document.documentElement.classList.toggle('gp-super-admin', isSuperAdmin());
    document.querySelectorAll('[data-admin-only="true"]').forEach(function(el){
      el.style.display = isAdmin() ? '' : 'none';
      el.setAttribute('aria-hidden', isAdmin() ? 'false' : 'true');
    });
    // Maintenance & Sécurité : super_admin uniquement.
    document.querySelectorAll('#sideMenu li[data-page="admin-stockage"]').forEach(function(el){
      el.style.display = isSuperAdmin() ? '' : 'none';
      el.setAttribute('aria-hidden', isSuperAdmin() ? 'false' : 'true');
    });
  }

  function renderSessionBadge(){
    var id = 'gp-auth-session-badge';
    var isMobile = window.innerWidth <= 768;
    var r = role();
    // Si Firebase n'a pas encore résolu currentUser, lire le rôle depuis localStorage
    // pour éviter le délai de 2-3s avant affichage du badge
    if(!r){
      try {
        var cachedRole = localStorage.getItem('gp_session_role');
        if(cachedRole) r = cachedRole;
      } catch(_){}
    }
    // Persister le rôle résolu pour les prochains rechargements
    if(r && r !== 'null'){
      try {
        localStorage.setItem('gp_session_role', r);
        localStorage.setItem('gp_session_role_label', ROLE_LABELS[r] || 'Session');
      } catch(_){}
    }
    var state = JSON.stringify({ mobile: isMobile, role: r });
    if(_lastBadgeState === state) return;
    _lastBadgeState = state;

    /* Sur mobile (<= 768px) : masquer le badge et ne pas le créer */
    if(isMobile){
      var existing = document.getElementById(id);
      if(existing){ existing.style.cssText = 'display:none!important;width:0;height:0;overflow:hidden;padding:0;margin:0;'; }
      return;
    }

    var host = document.querySelector('.top-icons');
    if(!host) return;
    var el = document.getElementById(id);
    if(!el){
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;background:#f3f4f6;color:#374151;font-size:11px;font-weight:700;';
      host.insertBefore(el, host.firstChild);
    }else{
      el.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;background:#f3f4f6;color:#374151;font-size:11px;font-weight:700;';
    }

    el.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px">shield_person</span>' + (ROLE_LABELS[r] || 'Session');
  }

  function refresh(){
    protectMenus();
    if(window.GPPermissions && typeof window.GPPermissions.applyUI === 'function') window.GPPermissions.applyUI();
    renderSessionBadge();
  }

  document.addEventListener('DOMContentLoaded', refresh);
  document.addEventListener('gp:auth-changed', function(){
    _lastBadgeState = null; _lastMenuState = null;
    // Si déconnecté, nettoyer le rôle mis en cache
    if(!getUser()) { try { localStorage.removeItem('gp_session_role'); } catch(_){} }
    refresh();
  });
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-page="admin-stockage"], [data-gp-nav="admin-stockage"]');
    if(t && !isSuperAdmin()){
      e.preventDefault();
      e.stopPropagation();
      requireAdmin('admin-stockage');
    }
  }, true);

  window.GPAuth = {
    adminOnlyPages: ADMIN_ONLY.slice(),
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    isAdmin: isAdmin,
    isSuperAdmin: isSuperAdmin,
    role: role,
    roleLabel: function(){ return ROLE_LABELS[role()] || 'Session'; },
    source: function(){ var u=getUser(); return u && u.source || (window.GPSupabaseAuth && window.GPSupabaseAuth.available && window.GPSupabaseAuth.available() ? 'supabase' : 'local'); },
    can: can,
    requireAdmin: requireAdmin,
    refresh: refresh
  };
})();
