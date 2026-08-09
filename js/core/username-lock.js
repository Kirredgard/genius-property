/* Genius Property — Username Lock v4
   Stratégie : patcher enhanceTopbarUser après son chargement pour
   qu'elle utilise toujours GP_USER_NAME, et corriger toute écriture
   incorrecte via MutationObserver. */
(function(){
  'use strict';

  var _lockedName = null;
  var _observer   = null;
  var _rafPending = false;

  function applyName(name){
    if(!name) return;
    document.querySelectorAll('.user-name,.user-menu-name').forEach(function(el){
      if(el.textContent !== name) el.textContent = name;
    });
    var hello = document.getElementById('gpUName');
    if(hello && hello.textContent !== name) hello.textContent = name;
  }

  function scheduleCorrection(){
    if(_rafPending || !_lockedName) return;
    _rafPending = true;
    requestAnimationFrame(function(){
      _rafPending = false;
      applyName(_lockedName);
    });
  }

  function startObserver(){
    if(_observer || !window.MutationObserver) return;
    _observer = new MutationObserver(scheduleCorrection);
    _observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  function lockName(name){
    name = String(name||'').trim();
    if(!name) return;
    _lockedName = name;
    window.GP_USER_NAME = name;
    applyName(name);
    if(document.body) startObserver();
    else document.addEventListener('DOMContentLoaded', startObserver, {once:true});
  }

  function unlockName(){
    _lockedName = null;
    window.GP_USER_NAME = null;
    if(_observer){ _observer.disconnect(); _observer = null; }
  }

  /* ── Patch enhanceTopbarUser après chargement de dashboard-desktop.js ──
     Ce script tourne toutes les 1500ms et réécrit .user-name avec sa propre
     uname() locale. On le patche pour qu'il lise GP_USER_NAME en priorité. */
  function patchDashboardDesktop(){
    // Patch: remplacer window.uname par une fonction qui retourne le nom verrouillé
    var _origUname = window.uname;
    window.uname = function(){
      if(window.GP_USER_NAME) return window.GP_USER_NAME;
      if(typeof _origUname === 'function') return _origUname();
      return (localStorage.getItem('gp_session_name')||'Utilisateur');
    };
  }

  // Patcher dès que DOMContentLoaded (dashboard-desktop est defer)
  document.addEventListener('DOMContentLoaded', function(){
    patchDashboardDesktop();
    // Appliquer le nom immédiatement
    if(_lockedName) applyName(_lockedName);
  });

  // Écoute gp:auth-changed
  window.addEventListener('gp:auth-changed', function(e){
    var user = e && e.detail;
    if(!user){ unlockName(); return; }
    var name = '';
    try { name = (localStorage.getItem('gp_session_name') || localStorage.getItem('gp_session_firstname') || '').trim(); } catch(_){}
    if(!name && user.email) name = user.email.split('@')[0];
    if(name) lockName(name);
  });

  // Pré-verrouillage depuis le cache
  (function prefill(){
    try {
      var cached = (localStorage.getItem('gp_session_name') || localStorage.getItem('gp_session_firstname') || '').trim();
      if(cached) lockName(cached);
    } catch(_){}
  })();

  window.GPUserName = { lock: lockName, unlock: unlockName, get: function(){ return _lockedName; } };
})();
