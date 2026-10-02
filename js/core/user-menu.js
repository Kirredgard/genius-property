/* Genius Property — Menu utilisateur + modal « Mon profil »
   Remplace les fonctions du bundle legacy supprimé (app.legacy.bundle.js) :
   toggleUM, openProfilModal, closeProfilModal, profilPhotoChange,
   saveProfilUser, tglPassField.

   À charger dans app.html APRÈS user-identity.js :
   <script src="js/core/user-menu.js?v=user-menu-1" defer></script>

   Données : la fiche de l'employé (Équipe) liée au compte connecté, retrouvée
   comme dans user-identity.js (uid / supaUserId, sinon email).
   Mot de passe : supabase.auth.updateUser (réellement appliqué, contrairement
   au legacy qui affichait « mis à jour » sans rien envoyer). */
(function () {
  'use strict';

  var MIN_PASSWORD = 8;
  var MAX_PHOTO_BYTES = 8 * 1024 * 1024; // fichier source
  var PHOTO_MAX_SIDE = 256;              // px, côté max après redimensionnement

  var ROLE_LABELS = {
    admin: 'Administrateur', super_admin: 'Super administrateur',
    gestionnaire: 'Gestionnaire', agent: 'Agent', comptable: 'Comptable',
    lecture: 'Lecture seule', readonly: 'Lecture seule'
  };

  var pendingPhoto = null; // data URL de la photo choisie, pas encore enregistrée
  var saving = false;

  /* ───────── utilitaires ───────── */

  function $(id) { return document.getElementById(id); }

  function notify(msg, type) {
    if (typeof window.toast === 'function') window.toast(msg, type || '');
    else window.alert(msg);
  }

  function getDB() {
    try {
      return (window.GPDB && window.GPDB.load) ? window.GPDB.load() : (window.DB || {});
    } catch (_) { return window.DB || {}; }
  }

  function findEmployee(user) {
    var list = (getDB().employes || []);
    var mail = String(user.email || '').toLowerCase();
    for (var i = 0; i < list.length; i++) {
      var e = list[i] || {};
      if ((e.uid && e.uid === user.id) || (e.supaUserId && e.supaUserId === user.id)) return e;
      if (mail && String(e.email || '').toLowerCase() === mail) return e;
    }
    return null;
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || '?';
  }

  function fullName(emp, user) {
    var n = emp ? [emp.prenom, emp.nom].filter(Boolean).join(' ').trim() : '';
    return n || user.full_name || String(user.email || '').split('@')[0] || 'Utilisateur';
  }

  function roleLabel(user, emp) {
    var r = String(user.role || '').toLowerCase();
    return ROLE_LABELS[r] || (emp && (emp.fonction || emp.role)) || 'Utilisateur';
  }

  function paintAvatar(el, photo, name) {
    if (!el) return;
    el.innerHTML = '';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.overflow = 'hidden';
    if (photo) {
      var img = document.createElement('img');
      img.src = photo;
      img.alt = name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
      el.appendChild(img);
    } else {
      el.textContent = initials(name);
      el.style.fontWeight = '700';
    }
  }

  function setText(id, v) { var el = $(id); if (el) el.textContent = v || ''; }
  function setVal(id, v) { var el = $(id); if (el) el.value = v || ''; }
  function getVal(id) { var el = $(id); return el ? String(el.value || '').trim() : ''; }

  /* Redimensionne l'image pour ne pas gonfler la base (la photo est stockée
     en data URL dans la fiche employé, donc synchronisée avec le reste). */
  function downscaleImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Lecture du fichier impossible.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Image illisible.')); };
        img.onload = function () {
          var scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d');
          if (!ctx) { resolve(reader.result); return; } // repli : image d'origine
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function passwordScore(pwd) {
    var s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    return s;
  }

  /* ───────── menu déroulant du profil ───────── */

  window.toggleUM = function () {
    var m = $('userMenu');
    if (m) m.classList.toggle('show');
  };

  document.addEventListener('click', function (e) {
    var m = $('userMenu');
    if (m && !e.target.closest('.user-box')) m.classList.remove('show');
  });

  /* ───────── modal « Mon profil » ───────── */

  function setProfileFieldsEnabled(enabled) {
    ['profil-prenom', 'profil-nom', 'profil-tel', 'profil-adresse'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.disabled = !enabled;
      el.style.opacity = enabled ? '' : '.6';
      el.style.cursor = enabled ? '' : 'not-allowed';
    });
    var note = $('profil-noemp-note');
    if (!enabled) {
      if (!note) {
        var grid = document.querySelector('#profilModal .profil-grid');
        if (grid) {
          note = document.createElement('div');
          note.id = 'profil-noemp-note';
          note.style.cssText = 'font-size:11px;color:#9ca3af;margin:0 0 8px';
          note.textContent = "Aucune fiche « Équipe » n'est liée à ce compte : ces informations ne peuvent pas être modifiées ici. Le mot de passe, lui, peut l'être.";
          grid.parentNode.insertBefore(note, grid);
        }
      }
    } else if (note) {
      note.remove();
    }
  }

  window.openProfilModal = function () {
    var modal = $('profilModal');
    if (!modal) return;

    var user = window.currentUser || {};
    var emp = findEmployee(user);
    var name = fullName(emp, user);
    pendingPhoto = null;

    setText('profilDisplayName', name);
    setText('profilDisplayEmail', user.email || '');
    setText('profilDisplayRole', roleLabel(user, emp));

    var img = $('profilAvatarImg');
    var ini = $('profilAvatarInitial');
    if (ini) ini.textContent = initials(name).charAt(0);
    if (emp && emp.photo && img) {
      img.src = emp.photo; img.style.display = 'block';
      if (ini) ini.style.display = 'none';
    } else {
      if (img) { img.removeAttribute('src'); img.style.display = 'none'; }
      if (ini) ini.style.display = '';
    }

    setVal('profil-prenom', emp ? emp.prenom : '');
    setVal('profil-nom', emp ? emp.nom : name);
    setVal('profil-fonction', roleLabel(user, emp));
    setVal('profil-email', user.email || '');
    setVal('profil-tel', emp ? emp.tel : '');
    setVal('profil-adresse', emp ? emp.adresse : '');
    setVal('profil-newpass', '');
    setText('profil-pass-strength', '');
    var photoInp = $('profil-photo-inp'); if (photoInp) photoInp.value = '';
    var pass = $('profil-newpass'); if (pass) pass.type = 'password';
    var eye = $('profil-pass-eye-icon'); if (eye) eye.textContent = 'visibility';

    var droits = $('profil-droits-section'); if (droits) droits.style.display = 'none';
    setProfileFieldsEnabled(!!emp);

    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
  };

  window.closeProfilModal = function () {
    var m = $('profilModal');
    if (m) m.style.display = 'none';
    pendingPhoto = null;
  };

  // Fermer en cliquant sur le fond sombre, ou avec Échap.
  document.addEventListener('click', function (e) {
    var m = $('profilModal');
    if (m && e.target === m) window.closeProfilModal();
  });
  document.addEventListener('keydown', function (e) {
    var m = $('profilModal');
    if (e.key === 'Escape' && m && m.style.display !== 'none') window.closeProfilModal();
  });

  // Indicateur de force du mot de passe.
  document.addEventListener('input', function (e) {
    if (!e.target || e.target.id !== 'profil-newpass') return;
    var el = $('profil-pass-strength');
    if (!el) return;
    var v = e.target.value;
    if (!v) { el.textContent = ''; return; }
    var s = passwordScore(v);
    var levels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    var colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
    el.textContent = '● ' + (levels[s] || '');
    el.style.color = colors[s] || '#9ca3af';
  });

  window.tglPassField = window.tglPassField || function (inputId, iconId) {
    var i = $(inputId), ico = $(iconId);
    if (!i) return;
    var show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    if (ico) ico.textContent = show ? 'visibility_off' : 'visibility';
  };

  window.profilPhotoChange = async function (input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { notify('Choisissez un fichier image.', 'err'); input.value = ''; return; }
    if (file.size > MAX_PHOTO_BYTES) { notify('Image trop volumineuse (8 Mo maximum).', 'err'); input.value = ''; return; }
    try {
      pendingPhoto = await downscaleImage(file);
      var img = $('profilAvatarImg'), ini = $('profilAvatarInitial');
      if (img) { img.src = pendingPhoto; img.style.display = 'block'; }
      if (ini) ini.style.display = 'none';
    } catch (err) {
      pendingPhoto = null;
      notify((err && err.message) || 'Photo non valide.', 'err');
    }
  };

  /* ───────── enregistrement ───────── */

  async function changePassword(pwd) {
    if (!window.GPSupabase || !window.GPSupabase.available || !window.GPSupabase.available()) {
      return { message: 'Changement de mot de passe indisponible (Supabase non configuré).' };
    }
    try {
      var sb = await window.GPSupabase.ready();
      var r = await sb.auth.updateUser({ password: pwd });
      return r && r.error ? r.error : null;
    } catch (e) {
      return e || { message: 'Erreur inconnue.' };
    }
  }

  function refreshIdentityUI(emp, user) {
    var name = fullName(emp, user);
    // username-lock.js remet le nom verrouillé : on le met à jour d'abord.
    if (window.GPUserName && typeof window.GPUserName.lock === 'function') window.GPUserName.lock(name);
    document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function (el) { el.textContent = name; });
    var photo = emp && emp.photo ? emp.photo : '';
    paintAvatar($('topbarAvatar'), photo, name);
    paintAvatar($('menuAvatar'), photo, name);
    setText('profilDisplayName', name);
    try { localStorage.setItem('gp_session_name', name); } catch (_) {}
  }

  window.saveProfilUser = async function () {
    if (saving) return;
    var user = window.currentUser || {};
    var emp = findEmployee(user);

    var prenom = getVal('profil-prenom');
    var nom = getVal('profil-nom');
    var tel = getVal('profil-tel');
    var adresse = getVal('profil-adresse');
    var newpass = ($('profil-newpass') || {}).value || '';

    // 1) Validations — rien n'est enregistré si l'une échoue.
    if (emp && !prenom && !nom) { notify('Renseignez au moins un nom ou un prénom.', 'err'); return; }
    if (newpass && newpass.length < MIN_PASSWORD) {
      notify('Le mot de passe doit contenir au moins ' + MIN_PASSWORD + ' caractères.', 'err');
      return;
    }

    saving = true;
    try {
      // 2) Fiche employé.
      if (emp) {
        emp.prenom = prenom;
        emp.nom = nom;
        emp.tel = tel;
        emp.adresse = adresse;
        if (pendingPhoto) emp.photo = pendingPhoto;
        try {
          var d = getDB();
          if (window.GPDB && typeof window.GPDB.save === 'function') await window.GPDB.save(d);
          else if (typeof window.saveDB === 'function') await window.saveDB();
        } catch (err) {
          notify("Enregistrement impossible : " + ((err && err.message) || 'erreur inconnue'), 'err');
          return;
        }
        pendingPhoto = null;
        refreshIdentityUI(emp, user);
      }

      // 3) Mot de passe (réel, via Supabase).
      if (newpass) {
        var perr = await changePassword(newpass);
        if (perr) {
          notify('Mot de passe non modifié : ' + (perr.message || 'erreur') +
            (emp ? ' (le reste du profil a bien été enregistré).' : ''), 'err');
          return; // on garde le modal ouvert pour corriger
        }
      }

      window.closeProfilModal();
      notify(newpass ? 'Profil et mot de passe mis à jour ✓' : 'Profil enregistré ✓');
    } finally {
      saving = false;
    }
  };
})();
