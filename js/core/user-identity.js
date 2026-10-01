/* Genius Property — Identité de l'utilisateur connecté
   Affiche le nom, la photo, le rôle et l'email de la personne connectée (barre du haut + menu profil).
   Source : fiche de l'employé (Équipe) retrouvée par email ; à défaut, le profil de connexion. */
(function(){
  'use strict';

  var ROLE_LABELS = { admin:'Administrateur', gestionnaire:'Gestionnaire', agent:'Agent', comptable:'Comptable', lecture:'Lecture seule', readonly:'Lecture seule' };

  function db(){ try { return (window.GPDB && window.GPDB.load) ? window.GPDB.load() : (window.DB || {}); } catch(_) { return window.DB || {}; } }
  function initials(name){ return String(name||'?').trim().split(/\s+/).slice(0,2).map(function(w){ return w.charAt(0).toUpperCase(); }).join('') || '?'; }

  function findEmployee(user){
    var list = (db().employes || []);
    var mail = String(user.email||'').toLowerCase();
    for (var i=0;i<list.length;i++){
      var e = list[i] || {};
      if ((e.uid && e.uid === user.id) || (e.supaUserId && e.supaUserId === user.id)) return e;
      if (mail && String(e.email||'').toLowerCase() === mail) return e;
    }
    return null;
  }

  function paintAvatar(el, photo, name){
    if(!el) return;
    el.innerHTML = '';
    el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center'; el.style.overflow = 'hidden';
    if (photo) {
      var img = document.createElement('img');
      img.src = photo; img.alt = name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
      el.appendChild(img);
    } else {
      el.textContent = initials(name);
      el.style.fontWeight = '700';
    }
  }

  function apply(){
    var user = window.currentUser;
    if(!user) return;
    var emp = findEmployee(user);
    var name = emp ? [emp.prenom, emp.nom].filter(Boolean).join(' ').trim() : '';
    name = name || user.full_name || String(user.email||'').split('@')[0] || 'Utilisateur';
    var photo = emp && emp.photo ? emp.photo : '';
    var role = String(user.role||'').toLowerCase();
    var roleLabel = ROLE_LABELS[role] || (emp && emp.role) || 'Utilisateur';

    try { localStorage.setItem('gp_session_name', name); } catch(_) {}
    if (window.GPUserName && window.GPUserName.lock) window.GPUserName.lock(name);
    document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function(el){ el.textContent = name; });

    paintAvatar(document.getElementById('topbarAvatar'), photo, name);
    paintAvatar(document.getElementById('menuAvatar'), photo, name);

    document.querySelectorAll('.user-role').forEach(function(el){ el.textContent = roleLabel; });
    document.querySelectorAll('.user-menu-email').forEach(function(el){ el.textContent = user.email || ''; });
  }

  // Les données (fiche employé + photo) arrivent après la connexion : on réessaie quelques fois.
  var timer = null;
  function schedule(){
    apply();
    var tries = 0;
    clearInterval(timer);
    timer = setInterval(function(){ apply(); if(++tries >= 8) clearInterval(timer); }, 700);
  }

  window.addEventListener('gp:auth-changed', function(e){ if(e && e.detail) schedule(); });
  window.addEventListener('gp:supabase:pulled', apply);
  window.addEventListener('gp:db:imported', apply);
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(schedule, 600); });

  window.GPUserIdentity = { refresh: apply };
})();
