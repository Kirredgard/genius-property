/* Genius Property — Firebase Auth Adapter
   Remplace : supabase-auth.js
   Version  : 1.0

   Dépendances :
   – firebase-adapter.js (doit être chargé AVANT ce fichier)
   – window._firebaseAuth exposé par le module ES dans index.html

   Méthodes Firebase Auth utilisées :
     signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
     createUserWithEmailAndPassword, onAuthStateChanged, getIdToken
*/
(function () {
  'use strict';

  var legacyDoLogin        = window.doLogin;
  var legacyDoLogout       = window.doLogout;
  var legacySendResetEmail = window.sendResetEmail;

  function $(id)         { return document.getElementById(id); }
  function now()         { return new Date().toISOString(); }
  function emit(n, d)    { try { window.dispatchEvent(new CustomEvent(n, { detail: d || {} })); } catch(e) {} }
  function toast(msg, t) { if (typeof window.toast === 'function') window.toast(msg, t || 'ok'); }


  function applySessionName(name) {
    name = String(name || '').trim();
    if (!name) return false;
    document.querySelectorAll('.user-name,.user-menu-name').forEach(function (el) {
      if (el.textContent !== name) el.textContent = name;
    });
    var hello = $('gpUName');
    if (hello && hello.textContent !== name) hello.textContent = name;
    return true;
  }

  function prefillSessionName() {
    try {
      return applySessionName(localStorage.getItem('gp_session_name') || localStorage.getItem('gp_session_firstname'));
    } catch (_) {
      return false;
    }
  }

  /* ── Accès Auth Firebase ─────────────────────────────────────── */
  function auth() {
    if (!window._firebaseAuth) throw new Error('Firebase Auth non initialisé — attends firebase:ready');
    return window._firebaseAuth;
  }

  function available() {
    return !!(window._firebaseAuth);
  }

  function waitForFirebaseAuth(timeoutMs) {
    timeoutMs = timeoutMs || 5000;
    if (available()) return Promise.resolve(true);
    return new Promise(function(resolve) {
      var done = false;
      function finish(ok) {
        if (done) return;
        done = true;
        window.removeEventListener('firebase:ready', onReady);
        resolve(!!ok);
      }
      function onReady() { finish(available()); }
      window.addEventListener('firebase:ready', onReady, { once: true });
      setTimeout(function(){ finish(available()); }, timeoutMs);
    });
  }

  /* ── Recherche d'un employé par email dans la DB locale ──────── */
  function findEmployeeByEmail(email) {
    var db   = (window.GPDB && typeof window.GPDB.load === 'function') ? window.GPDB.load() : (window.DB || {});
    var list = db.employes || [];
    email    = String(email || '').trim().toLowerCase();
    return list.find(function (e) {
      return String(e.email || '').trim().toLowerCase() === email;
    }) || null;
  }

  function roleFromEmployee(emp) {
    if (!emp) return 'admin';
    if (emp.droits && emp.droits.superAdmin) return 'admin';
    var d = emp.droits || {};
    if (d.depenses || d.paiements || d.rapports)          return 'comptable';
    if (d.proprietaires || d.locataires || d.bail || d.contrats) return 'agent';
    return 'lecture';
  }

  /* ── Pull des données cloud AVANT hydrateCurrentUser ────────── */
  async function autoPullCloudData() {
    try {
      if (!window.GPFirebase || !window.GPFirebase.available()) return false;

      // Active l'autosync si ce n'est pas déjà fait
      var cfg = window.GPFirebase.config();
      if (!cfg.autosync) window.GPFirebase.configure({ autosync: true });

      var payload = await window.GPFirebase.pull();
      if (!payload) return false;

      var defaults = {
        employes: [], proprietaires: [], locataires: [], biens: [], locatives: [],
        contrats: [], paiements: [], depenses: [], fichiers: [], messages: [],
        conversations: [], agenda: [], proprietaireDocs: {}, locataireDocs: {}
      };
      var merged = Object.assign({}, defaults, payload);

      localStorage.setItem('geniusproperty_db_clean_v1', JSON.stringify(merged));
      localStorage.setItem('gp_migrated_v1', '1');

      // Met à jour window.DB immédiatement
      if (window.DB && typeof window.DB === 'object') {
        Object.keys(window.DB).forEach(function (k) { delete window.DB[k]; });
        Object.assign(window.DB, merged);
      } else {
        window.DB = merged;
      }

      try { if (window.GPDB && typeof window.GPDB.load === 'function') await window.GPDB.load(); } catch (_) {}
      try { if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges(); } catch (_) {}
      try {
        var page = window.GP_CURRENT_PAGE || localStorage.getItem('gp_last_page') || '';
        if (page === 'dashboard' && typeof window.renderDashboard === 'function') window.renderDashboard();
        else if (page && window.GPNavigation && typeof window.GPNavigation.renderPage === 'function') window.GPNavigation.renderPage(page);
      } catch (_) {}

      emit('gp:firebase:pulled', { forced: true });
      return true;

    } catch (e) {
      console.warn('[GPFirebaseAuth] autoPullCloudData:', e && e.message || e);
      // Ne pas afficher de toast — l'app fonctionne avec les données locales
      return false;
    }
  }

  /* ── Hydrate l'utilisateur courant après le pull ─────────────── */
  async function hydrateCurrentUser(fbUser) {
    var email = fbUser && fbUser.email || '';

    // Affichage instantané : ne jamais revenir à "Administrateur" pendant le pull cloud.
    prefillSessionName();

    try { if (window.GPDB && typeof window.GPDB.load === 'function') await window.GPDB.load(); } catch (_) {}

    var emp  = findEmployeeByEmail(email);
    var role = roleFromEmployee(emp);

    var user = {
      email:     email,
      id:        fbUser && fbUser.uid || null,
      isAdmin:   role === 'admin',
      role:      role,
      droits:    emp ? (emp.droits || {}) : null,
      employeId: emp && emp.id || null,
      source:    'firebase',
      loggedAt:  now()
    };

    window.currentUser     = user;
    try { window.currentUserRole = role; } catch (_) {}

    // ── Enregistrer la dernière connexion de l employé ──────────
    if (emp) {
      emp.derniereConnexion = new Date().toISOString();
      try { if (typeof window.saveDB === 'function') window.saveDB(); } catch (_) {}
    }

    var prenomOnly = emp ? String(emp.prenom || '').trim() : '';
    var nomOnly    = emp ? String(emp.nom || '').trim() : '';
    var nom = prenomOnly || nomOnly || (email ? email.split('@')[0] : 'Administrateur');

    localStorage.setItem('gp_session_name', nom);
    localStorage.setItem('gp_session_firstname', nom);
    localStorage.setItem('gp_session_role', role);
    localStorage.setItem('gp_session_role_label', role === 'admin' ? 'Administrateur' : (role === 'comptable' ? 'Comptable' : (role === 'agent' ? 'Agent' : 'Lecture seule')));
    applySessionName(nom);

    emit('gp:auth-changed', user);
    if (window.GPAuth       && typeof window.GPAuth.refresh       === 'function') window.GPAuth.refresh();
    if (window.GPPermissions && typeof window.GPPermissions.applyUI === 'function') window.GPPermissions.applyUI();

    return user;
  }

  /* ── signIn ──────────────────────────────────────────────────── */
  async function signIn(email, password) {
    var a = auth();
    // API modulaire
    if (window._fbSignIn) {
      var cred = await window._fbSignIn(a, email, password);
      return cred.user;
    }
    // API compat
    if (a.signInWithEmailAndPassword) {
      var res = await a.signInWithEmailAndPassword(email, password);
      return res.user;
    }
    throw new Error('Firebase Auth SDK non exposé correctement.');
  }

  /* ── signOut ─────────────────────────────────────────────────── */
  async function signOut() {
    try {
      var a = auth();
      if (window._fbSignOut)          await window._fbSignOut(a);
      else if (a.signOut)             await a.signOut();
    } catch (e) { console.warn('[GPFirebaseAuth] signOut:', e); }

    restoreSession._pullStarted = false; // permet un pull frais à la prochaine connexion
    window.currentUser = null;
    localStorage.removeItem('gp_session_name');
    localStorage.removeItem('gp_session_firstname');
    applySessionName('Admin');
    emit('gp:auth-changed', null);
  }

  /* ── resetPassword ───────────────────────────────────────────── */
  async function resetPassword(email) {
    var a = auth();
    if (window._fbSendPasswordResetEmail) {
      await window._fbSendPasswordResetEmail(a, email, { url: window.location.href });
    } else if (a.sendPasswordResetEmail) {
      await a.sendPasswordResetEmail(email, { url: window.location.href });
    } else {
      throw new Error('sendPasswordResetEmail non disponible.');
    }
    return true;
  }

  /* ── createEmployeeAccount ─────────────────────────────────────
     Important : createUserWithEmailAndPassword connecte automatiquement
     le nouvel utilisateur et déconnecte l'admin courant. Pour éviter ça,
     on crée le compte via l'API REST Firebase Auth avec la même apiKey. */
  async function createEmployeeAccount(email, password) {
    email = String(email || '').trim();
    password = String(password || '');
    if (!email || !password) throw new Error('Email et mot de passe requis.');

    var apiKey = window._firebaseConfig && window._firebaseConfig.apiKey;
    if (apiKey && window.fetch) {
      var res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + encodeURIComponent(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password, returnSecureToken: false })
      });
      var json = {};
      try { json = await res.json(); } catch (_) {}
      if (!res.ok) {
        var code = json && json.error && json.error.message;
        if (code === 'EMAIL_EXISTS') return null;
        if (code === 'WEAK_PASSWORD') throw new Error('Mot de passe trop faible.');
        if (code === 'INVALID_EMAIL') throw new Error('Email invalide.');
        if (code === 'OPERATION_NOT_ALLOWED') throw new Error('Activez Email/Password dans Firebase Authentication > Sign-in method.');
        throw new Error(code || 'Création du compte Firebase impossible.');
      }
      return { uid: json.localId || null, email: email };
    }

    // Fallback ancien : fonctionne, mais peut basculer la session sur le nouvel utilisateur.
    var a = auth();
    var current = a.currentUser || null;
    var user;
    try {
      if (window._fbCreateUser) {
        var c = await window._fbCreateUser(a, email, password);
        user  = c.user;
      } else if (a.createUserWithEmailAndPassword) {
        var r = await a.createUserWithEmailAndPassword(email, password);
        user  = r.user;
      } else {
        throw new Error('createUserWithEmailAndPassword non disponible.');
      }
    } catch (e) {
      if (e && e.code === 'auth/email-already-in-use') return null;
      throw e;
    }
    if (current && current.email && current !== (a.currentUser || null)) {
      console.warn('[GPFirebaseAuth] Compte créé, mais la session admin peut avoir changé. Reconnectez-vous si nécessaire.');
    }
    return user || null;
  }

  /* ── getSession : retourne l'utilisateur Firebase courant ────── */
  async function getSession() {
    return new Promise(function (resolve) {
      var a = auth();
      var unsubscribe;
      function cb(user) {
        if (unsubscribe) unsubscribe();
        resolve(user || null);
      }
      if (window._fbOnAuthStateChanged) {
        unsubscribe = window._fbOnAuthStateChanged(a, cb);
      } else if (a.onAuthStateChanged) {
        unsubscribe = a.onAuthStateChanged(cb);
      } else {
        resolve(null);
      }
    });
  }

  /* ── loginHandler ────────────────────────────────────────────── */
  async function loginHandler() {
    var email = ($('lu') && $('lu').value || '').trim();
    var pwd   = ($('lp') && $('lp').value || '');
    var btn   = $('loginBtn');
    var errEl = $('authError');
    if (errEl) errEl.textContent = '';

    if (!email || !pwd) {
      if (errEl) errEl.textContent = 'Veuillez saisir vos identifiants.';
      return;
    }

    if (!available()) {
      if (btn) { btn.classList.add('loading'); btn.textContent = 'Initialisation…'; }
      if (errEl) errEl.textContent = 'Initialisation Firebase…';
      var ready = await waitForFirebaseAuth(5000);
      if (!ready) {
        if (errEl) errEl.textContent = 'Firebase Auth non disponible. Vérifiez la connexion ou rechargez la page.';
        if (btn) { btn.classList.remove('loading'); btn.textContent = 'Se connecter'; }
        return;
      }
      if (errEl) errEl.textContent = '';
    }

    if (btn) { btn.classList.add('loading'); btn.textContent = 'Connexion…'; }

    try {
      // 1. Auth Firebase
      var fbUser = await signIn(email, pwd);

      // 2. Pull des données cloud (AVANT hydrateCurrentUser)
      var pulled = await autoPullCloudData();

      // 3. Hydrater l'utilisateur
      await hydrateCurrentUser(fbUser);

      // 4. Basculer le storage adapter
      if (window.GPStorage && typeof window.GPStorage.use === 'function') {
        try { window.GPStorage.use('firebase'); } catch (e) {
          console.warn('[GPFirebaseAuth] Impossible de basculer sur firebase:', e);
        }
      }

      // 5. Afficher l'app
      if (typeof window._showApp === 'function') await window._showApp();

      toast('Connexion Firebase réussie' + (pulled ? '' : ' (données locales — synchronisez manuellement)'));

    } catch (e) {
      var msg = e && e.message ? e.message : String(e);
      if (e && e.code === 'auth/wrong-password')         msg = 'Mot de passe incorrect.';
      if (e && e.code === 'auth/user-not-found')         msg = 'Aucun compte trouvé avec cet email.';
      if (e && e.code === 'auth/invalid-email')          msg = 'Email invalide.';
      if (e && e.code === 'auth/too-many-requests')      msg = 'Trop de tentatives. Réessayez plus tard.';
      if (e && e.code === 'auth/invalid-credential')     msg = 'Email ou mot de passe incorrect.';
      if (errEl) errEl.textContent = msg;
    } finally {
      if (btn) { btn.classList.remove('loading'); btn.textContent = 'Se connecter'; }
    }
  }

  /* ── logoutHandler ───────────────────────────────────────────── */
  async function logoutHandler() {
    await signOut();
    if (typeof legacyDoLogout === 'function') return legacyDoLogout();
    var app   = $('app'),
        login = $('loginPage'),
        err   = $('authError'),
        lu    = $('lu'),
        lp    = $('lp');
    if (app)   app.style.display   = 'none';
    if (login) login.style.display = 'flex';
    if (err)   err.textContent     = '';
    if (lu)    lu.value            = '';
    if (lp)    lp.value            = '';
  }

  /* ── resetHandler ────────────────────────────────────────────── */
  async function resetHandler() {
    var email = ($('forgotEmail') && $('forgotEmail').value || '').trim()
              || ($('lu') && $('lu').value || '').trim();
    var msgEl = $('forgotMsg');
    if (msgEl) { msgEl.textContent = ''; msgEl.style.color = '#9ca3af'; }
    if (!email) {
      if (msgEl) { msgEl.textContent = 'Veuillez saisir votre email.'; msgEl.style.color = '#f97316'; }
      return;
    }
    if (!available()) {
      if (msgEl) { msgEl.textContent = 'Firebase Auth non disponible.'; msgEl.style.color = '#f97316'; }
      return;
    }
    try {
      if (msgEl) msgEl.textContent = 'Envoi en cours…';
      await resetPassword(email);
      if (msgEl) { msgEl.textContent = '✓ Email envoyé. Vérifiez votre boîte de réception.'; msgEl.style.color = '#22c55e'; }
    } catch (e) {
      if (msgEl) { msgEl.textContent = e.message || String(e); msgEl.style.color = '#ef4444'; }
    }
  }

  /* ── restoreSession : au rechargement de page ────────────────── */
  async function restoreSession() {
    if (!available()) return null;
    prefillSessionName();
    try {
      var fbUser = await getSession();
      if (fbUser) {
        if (window.GPStorage && typeof window.GPStorage.use === 'function') {
          try { window.GPStorage.use('firebase'); } catch (_) {}
        }

        var user = await hydrateCurrentUser(fbUser);

        // Un seul pull Firestore en arrière-plan par chargement : pas de réécriture répétée de la topbar.
        if (!restoreSession._pullStarted) {
          restoreSession._pullStarted = true;
          autoPullCloudData().then(function (pulled) {
            if (pulled) return hydrateCurrentUser(fbUser);
            // Pull échoué mais données locales dispo → débloquer la navigation
            try {
              var db = window.DB || {};
              var hasLocal = (db.paiements && db.paiements.length > 0) || (db.depenses && db.depenses.length > 0);
              if (hasLocal) emit('gp:firebase:pulled', { local: true });
            } catch(_) {}
          }).catch(function (e) {
            console.warn('[GPFirebaseAuth] restoreSession background pull:', e && (e.message || e));
            // Erreur réseau : débloquer quand même la navigation avec données locales
            try { emit('gp:firebase:pulled', { error: true }); } catch(_) {}
          });
        }

        return user;
      }
    } catch (e) { console.warn('[GPFirebaseAuth] restoreSession:', e); }
    return null;
  }

  /* ── API publique ────────────────────────────────────────────── */
  window.GPFirebaseAuth = {
    available:             available,
    getSession:            getSession,
    restoreSession:        restoreSession,
    hydrateCurrentUser:    hydrateCurrentUser,
    signIn:                signIn,
    signOut:               signOut,
    resetPassword:         resetPassword,
    autoPullCloudData:     autoPullCloudData,
    createEmployeeAccount: createEmployeeAccount,
    findEmployeeByEmail:   findEmployeeByEmail,
    status: function () {
      return {
        available:   available(),
        currentUser: window.currentUser || null,
        firebase:    window.GPFirebase && window.GPFirebase.status ? window.GPFirebase.status() : null
      };
    }
  };

  // Remplace les handlers globaux utilisés par le HTML legacy.
  window.doLogin                    = loginHandler;
  window._firebaseAuthLoginHandler  = loginHandler; // accessible par le legacy bundle
  window.doLogout       = logoutHandler;
  window.sendResetEmail = resetHandler;

  // Au chargement de la page, restaure la session si Firebase est prêt.
  function init() {
    prefillSessionName();
    if (available()) {
      restoreSession();
    } else {
      window.addEventListener('firebase:ready', restoreSession, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // [cleaned] debug console statement removed
})();
