function waitForFirebaseReady(timeoutMs = 6000) {
  if (window._firebaseAuth) return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      window.removeEventListener('firebase:ready', onReady);
      window.removeEventListener('firebase:error', onError);
      resolve(Boolean(ok));
    };
    const onReady = () => finish(Boolean(window._firebaseAuth));
    const onError = () => finish(false);
    window.addEventListener('firebase:ready', onReady, { once: true });
    window.addEventListener('firebase:error', onError, { once: true });
    setTimeout(() => finish(Boolean(window._firebaseAuth)), timeoutMs);
  });
}

function normalizeFirebaseAuthError(error) {
  const code = error?.code || '';
  if (code === 'auth/invalid-credential') return 'Email ou mot de passe incorrect.';
  if (code === 'auth/wrong-password') return 'Mot de passe incorrect.';
  if (code === 'auth/user-not-found') return 'Aucun compte trouvé avec cet email.';
  if (code === 'auth/invalid-email') return 'Email invalide.';
  if (code === 'auth/too-many-requests') return 'Trop de tentatives. Réessayez plus tard.';
  return error?.message || 'Connexion Firebase impossible.';
}

function installAuthDiagnostics() {
  window.GPV21AuthStatus = () => ({
    ready: Boolean(window._firebaseAuth),
    app: Boolean(window._firebaseApp),
    db: Boolean(window._firebaseDB),
    config: Boolean(window._firebaseConfig),
    error: window.__gpFirebaseInitError?.message || null
  });
}

function reinforceLoginButton() {
  const btn = document.getElementById('loginBtn');
  if (!btn) return false;

  btn.addEventListener('click', async (event) => {
    if (window._firebaseAuthLoginHandler) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const err = document.getElementById('authError');
    if (err) err.textContent = 'Initialisation Firebase…';
    const ready = await waitForFirebaseReady();
    if (!ready) {
      if (err) err.textContent = window.__gpFirebaseInitError?.message || 'Firebase Auth non disponible. Vérifiez env.js puis rechargez la page.';
      return;
    }
    if (err) err.textContent = '';
    if (window.GPFirebaseAuth?.signIn) {
      try {
        const email = String(document.getElementById('lu')?.value || '').trim();
        const password = document.getElementById('lp')?.value || '';
        if (!email || !password) {
          if (err) err.textContent = 'Veuillez saisir votre email et votre mot de passe.';
          return;
        }
        const user = await window.GPFirebaseAuth.signIn(email, password);
        if (window.GPFirebaseAuth.hydrateCurrentUser) await window.GPFirebaseAuth.hydrateCurrentUser(user);
        if (typeof window._showApp === 'function') await window._showApp();
      } catch (error) {
        if (err) err.textContent = normalizeFirebaseAuthError(error);
      }
    }
  }, true);

  return true;
}

export async function initAuthModule() {
  installAuthDiagnostics();
  reinforceLoginButton();
  const ready = await waitForFirebaseReady(2500);
  if (!ready) console.warn('[GP V21] Firebase Auth pas encore prêt', window.__gpFirebaseInitError);
  return { ready, status: window.GPV21AuthStatus() };
}

export { waitForFirebaseReady, normalizeFirebaseAuthError };
