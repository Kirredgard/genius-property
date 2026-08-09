/* Genius Property — Firebase Storage Adapter
   Remplace : supabase-adapter.js
   Version  : 1.0

   SETUP (dans index.html, AVANT ce fichier) :
   ─────────────────────────────────────────────
   <script type="module">
     import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
     import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
     import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

     const app = initializeApp({
       apiKey:            "VOTRE_API_KEY",
       authDomain:        "VOTRE_PROJECT.firebaseapp.com",
       projectId:         "VOTRE_PROJECT_ID",
       storageBucket:     "VOTRE_PROJECT.appspot.com",
       messagingSenderId: "VOTRE_SENDER_ID",
       appId:             "VOTRE_APP_ID"
     });

     window._firebaseApp   = app;
     window._firebaseAuth  = getAuth(app);
     window._firebaseDB    = getFirestore(app);
     window.GPFirebaseReady = true;
     window.dispatchEvent(new Event('firebase:ready'));
   </script>

   FIRESTORE RULES (dans la console Firebase) :
   ─────────────────────────────────────────────
   Voir firestore.rules : isolation par UID Firebase.

   UTILISATION :
   ─────────────
   window.GPFirebase.configure({ workspaceId: 'auto', autosync: true });
   await GPFirebase.pull();   // charge les données cloud
   await GPFirebase.push();   // envoie les données locales
   GPStorage.use('firebase'); // active l'adapter
*/
(function () {
  'use strict';

  var GP = window.GP = window.GP || {};
  var STORAGE_KEY  = GP.STORAGE_KEY || 'geniusproperty_db_clean_v1';
  var CONFIG_KEY   = 'geniusproperty_firebase_config';
  var CACHE_KEY    = 'geniusproperty_firebase_cache';
  var META_KEY     = 'geniusproperty_firebase_meta';
  var COLLECTION   = 'agencies';
  var LEGACY_COLLECTION = 'gp_databases';
  var DEFAULT_WS   = 'auto';
  var AGENCY_KEY   = 'geniusproperty_current_agency_id';

  var pushTimer = null;
  var config    = loadConfig();

  /* ── Utilitaires ────────────────────────────────────────────── */
  function now()        { return new Date().toISOString(); }
  function clone(obj)   { return JSON.parse(JSON.stringify(obj || {})); }
  function safeParse(r, fb) { try { return r ? JSON.parse(r) : fb; } catch(e) { return fb; } }
  function localRaw()   { return localStorage.getItem(STORAGE_KEY) || '{}'; }
  function countRecords(raw){
    var db = safeParse(raw, {}) || {};
    return ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers','messages','conversations','agenda'].reduce(function(n,k){ return n + (Array.isArray(db[k]) ? db[k].length : 0); }, 0);
  }
  function readCacheRaw()  {
    var cache = localStorage.getItem(CACHE_KEY);
    var local = localRaw();
    // Important : si le cache Firebase est vide mais le vrai localStorage contient des données,
    // on garde le local. Sinon GPDB.load() recharge {} et les ajouts disparaissent au refresh.
    if (!cache || countRecords(local) > countRecords(cache)) return local;
    return cache;
  }
  function writeCacheRaw(r){
    var raw = String(r || '{}');
    localStorage.setItem(CACHE_KEY, raw);
    localStorage.setItem(STORAGE_KEY, raw);
    return true;
  }
  function meta()       { return safeParse(localStorage.getItem(META_KEY), {}); }
  function setMeta(n)   { localStorage.setItem(META_KEY, JSON.stringify(Object.assign(meta(), n || {}))); }
  function emit(name, d){ try { window.dispatchEvent(new CustomEvent(name, { detail: d || {} })); } catch(e) {} }

  function loadConfig() {
    var stored = safeParse(localStorage.getItem(CONFIG_KEY), {});
    var inline  = window.GP_FIREBASE_CONFIG || {};
    return Object.assign({ workspaceId: DEFAULT_WS, agencyId: DEFAULT_WS, autosync: false }, stored, inline);
  }

  function saveConfig(next) {
    config = Object.assign({}, config, next || {});
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return clone(config);
  }

  /* ── Accès au SDK Firebase (chargé en module ES) ────────────── */
  function db() {
    if (!window._firebaseDB) throw new Error('Firebase non initialisé — vérifie que firebase:ready a été reçu avant ce script.');
    return window._firebaseDB;
  }

  function available() {
    return !!(window._firebaseDB);
  }

  function currentUid() {
    try {
      var a = window._firebaseAuth;
      if (a && a.currentUser && a.currentUser.uid) return a.currentUser.uid;
    } catch (_) {}
    try {
      if (window.currentUser && (window.currentUser.id || window.currentUser.uid)) {
        return window.currentUser.id || window.currentUser.uid;
      }
    } catch (_) {}
    return null;
  }

  function agencyId() {
    var fromLocal = localStorage.getItem(AGENCY_KEY);
    var ws = (config && (config.agencyId || config.workspaceId)) || fromLocal || DEFAULT_WS;
    // SaaS v4 : le workspace devient une agence.
    // En attendant l'écran de création/invitation d'agence, on crée un identifiant stable par propriétaire.
    if (!ws || ws === 'default' || ws === 'user' || ws === 'auto') {
      var uid = currentUid() || 'user';
      ws = 'agency_' + uid;
    }
    localStorage.setItem(AGENCY_KEY, ws);
    return ws;
  }

  function workspaceId() {
    // Alias conservé pour compatibilité UI/admin existante.
    return agencyId();
  }

  /* ── Accès Firestore (compat CDN v9 modulaire via compat shim) ─
     On utilise l'API compat si disponible (window.firebase),
     sinon les fonctions standalone importées sur window._fb*.      */
  function agencyRef() {
    var d = db();
    if (window._fbDoc && window._fbCollection) {
      return window._fbDoc(window._fbCollection(d, COLLECTION), agencyId());
    }
    if (window.firebase && window.firebase.firestore) {
      return window.firebase.firestore().collection(COLLECTION).doc(agencyId());
    }
    throw new Error('Impossible de créer une référence agence Firestore.');
  }

  function docRef() {
    var d = db();
    // Nouveau chemin SaaS : agencies/{agencyId}/data/main
    if (window._fbDoc && window._fbCollection) {
      return window._fbDoc(window._fbCollection(d, COLLECTION, agencyId(), 'data'), 'main');
    }
    if (window.firebase && window.firebase.firestore) {
      return window.firebase.firestore().collection(COLLECTION).doc(agencyId()).collection('data').doc('main');
    }
    throw new Error('Impossible de créer une référence Firestore. Expose _fbDoc/_fbCollection ou utilise le SDK compat.');
  }

  /* ── test ───────────────────────────────────────────────────── */
  async function test() {
    var ref = docRef();
    var snap;
    if (typeof ref.get === 'function') {
      snap = await ref.get();                 // compat
    } else {
      snap = await window._fbGetDoc(ref);     // modulaire
    }
    setMeta({ lastTestAt: now(), lastError: null });
    return { ok: true, exists: snap.exists || snap.exists(), agencyId: agencyId(), workspaceId: workspaceId() };
  }

  /* ── pull : Firebase → localStorage ────────────────────────── */
  async function pull(options) {
    options = options || {};
    try {
      var ref  = docRef();
      var snap;
      if (typeof ref.get === 'function') {
        snap = await ref.get();
      } else {
        snap = await window._fbGetDoc(ref);
      }

      var exists = (typeof snap.exists === 'function') ? snap.exists() : snap.exists;
      if (!exists) {
        setMeta({ lastPullAt: now(), remoteEmpty: true, lastError: null });
        return null;
      }

      var remoteData = snap.data ? snap.data() : {};
      var payload    = remoteData.data || remoteData || {};
      var raw        = JSON.stringify(payload);

      // Ne pas écraser une base locale remplie avec un document Firebase vide/ancien.
      var currentRaw = readCacheRaw();
      if (countRecords(raw) > 0 || countRecords(currentRaw) === 0) {
        writeCacheRaw(raw);
        if (options.applyToLocal !== false) localStorage.setItem(STORAGE_KEY, raw);
      }
      if (window.GPDB && typeof window.GPDB.load === 'function') window.GPDB.load();

      setMeta({ lastPullAt: now(), lastError: null });
      emit('gp:firebase:pulled', { agencyId: agencyId(), workspaceId: workspaceId() });
      return payload;

    } catch (e) {
      setMeta({ lastPullAt: now(), lastError: e && e.message || String(e) });
      throw e;
    }
  }

  /* ── push : localStorage → Firebase ────────────────────────── */
  async function push(data) {
    try {
      var payload = data || safeParse(localRaw(), {});
      var ref     = docRef();
      var uid     = currentUid();
      var row     = {
        data: payload,
        updatedAt: now(),
        agencyId: agencyId(),
        workspaceId: workspaceId(),
        updatedBy: uid || null
      };
      var agency = {
        name: config.agencyName || 'Mon agence',
        ownerUid: uid || null,
        plan: config.plan || 'free',
        status: 'active',
        updatedAt: now(),
        createdAt: now()
      };
      var member = {
        uid: uid || null,
        email: (window._firebaseAuth && window._firebaseAuth.currentUser && window._firebaseAuth.currentUser.email) || null,
        role: 'owner',
        status: 'active',
        updatedAt: now()
      };

      if (typeof ref.set === 'function') {
        await agencyRef().set(agency, { merge: true });
        if (uid) await agencyRef().collection('members').doc(uid).set(member, { merge: true });
        await ref.set(row, { merge: true });                  // compat
      } else {
        await window._fbSetDoc(agencyRef(), agency, { merge: true });
        if (uid) await window._fbSetDoc(window._fbDoc(window._fbCollection(db(), COLLECTION, agencyId(), 'members'), uid), member, { merge: true });
        await window._fbSetDoc(ref, row, { merge: true });    // modulaire
      }

      writeCacheRaw(JSON.stringify(payload));
      setMeta({ lastPushAt: now(), lastError: null });
      emit('gp:firebase:pushed', { agencyId: agencyId(), workspaceId: workspaceId() });
      return row;

    } catch (e) {
      setMeta({ lastPushAt: now(), lastError: e && e.message || String(e) });
      throw e;
    }
  }

  /* ── push différé (déclenché sur chaque sauvegarde locale) ─── */
  function queuePush(raw) {
    writeCacheRaw(raw);
    if (!config.autosync || !available()) return true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      push(safeParse(raw, {})).catch(function (err) {
        console.warn('[GPFirebase] Push auto échoué', err);
      });
    }, 750);
    return true;
  }

  /* ── status ─────────────────────────────────────────────────── */
  function status() {
    config = loadConfig();
    return {
      sdkLoaded:   available(),
      available:   available(),
      active:      window.GPStorage && window.GPStorage.status
                     ? window.GPStorage.status().active === 'firebase'
                     : false,
      agencyId:    agencyId(),
      workspaceId: workspaceId(),
      autosync:    !!config.autosync,
      meta:        meta()
    };
  }

  /* ── Adapter GPStorage ──────────────────────────────────────── */
  var adapter = {
    name:      'firebase',
    key:       CACHE_KEY,
    isAsync:   true,
    available: available,
    readRaw:   readCacheRaw,
    writeRaw:  queuePush,
    remove:    function () { localStorage.removeItem(CACHE_KEY); return true; },
    size:      function () { return (readCacheRaw() || '').length; },
    pull:      pull,
    push:      push,
    test:      test,
    status:    status
  };

  if (window.GPStorage && typeof window.GPStorage.register === 'function') {
    window.GPStorage.register('firebase', adapter);
  }

  /* ── Push automatique sur chaque sauvegarde locale ──────────── */
  window.addEventListener('gp:db:saved', function () {
    try {
      config = loadConfig();
      if (!config.autosync || !available()) return;
      var raw = localStorage.getItem(STORAGE_KEY) || '{}';
      queuePush(raw);
    } catch (err) {
      console.warn('[GPFirebase] gp:db:saved push échoué', err);
    }
  });

  /* ── Auto-activation au démarrage si Firebase est prêt ──────── */
  function tryAutoActivate() {
    try {
      if (available() && window.GPStorage && typeof window.GPStorage.use === 'function') {
        window.GPStorage.use('firebase');
        // [cleaned] debug console statement removed
      }
    } catch (e) {
      // [cleaned] debug console statement removed
    }
  }

  // Firebase peut être prêt avant ou après ce script selon l'ordre de chargement.
  if (available()) {
    tryAutoActivate();
  } else {
    window.addEventListener('firebase:ready', tryAutoActivate);
  }

  /* ── API publique ────────────────────────────────────────────── */
  window.GPFirebase = GP.Firebase = {
    configure:   function (next) { return saveConfig(next); },
    config:      function () { return clone(loadConfig()); },
    available:   available,
    test:        test,
    pull:        pull,
    push:        push,
    status:      status,
    adapter:     adapter
  };

  // [cleaned] debug console statement removed
})();
