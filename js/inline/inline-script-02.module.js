import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, collection,
  getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getFirebaseConfig } from "../v21/config/firebase-config.js";

function setAuthError(message) {
  const el = document.getElementById('authError');
  if (el) el.textContent = message || '';
}

function dispatchReady() {
  if (window.__gpFirebaseReadyDispatched) return;
  window.__gpFirebaseReadyDispatched = true;
  window.GPFirebaseReady = true;
  window.dispatchEvent(new Event('firebase:ready'));
}

function dispatchError(error) {
  window.GPFirebaseReady = false;
  window.__gpFirebaseInitError = error;
  window.dispatchEvent(new CustomEvent('firebase:error', { detail: { error } }));
  setAuthError(error?.message || 'Firebase Auth non disponible.');
  console.error('[GP V21] Firebase init error:', error);
}

try {
  const firebaseConfig = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  window._firebaseConfig = firebaseConfig;
  window._firebaseApp = app;
  window._firebaseAuth = getAuth(app);
  window._firebaseDB = getFirestore(app);

  window._fbSignIn = (auth, email, password) => signInWithEmailAndPassword(auth, email, password);
  window._fbSignOut = signOut;
  window._fbSendPasswordResetEmail = sendPasswordResetEmail;
  window._fbCreateUser = createUserWithEmailAndPassword;
  window._fbOnAuthStateChanged = onAuthStateChanged;
  window._fbDoc = doc;
  window._fbCollection = collection;
  window._fbGetDoc = getDoc;
  window._fbSetDoc = setDoc;

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', dispatchReady, { once: true });
  } else {
    setTimeout(dispatchReady, 0);
  }
} catch (error) {
  dispatchError(error);
}
