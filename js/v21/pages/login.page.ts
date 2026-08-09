import { loginWithEmail, getPersistedSession } from '../auth/auth.service.js';

function getEl<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector);
}

export function initLoginPage() {
  const form = getEl<HTMLFormElement>('#login-form');
  const message = getEl<HTMLElement>('#login-message');

  const existingSession = getPersistedSession();
  if (existingSession) {
    setMessage(`Session active : ${existingSession.email || existingSession.uid}`, 'success');
  }

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');

    if (!email || !password) {
      setMessage('Email et mot de passe requis.', 'error');
      return;
    }

    try {
      setMessage('Connexion en cours...', 'info');
      await loginWithEmail(email, password);
      setMessage('Connexion réussie. Redirection...', 'success');
      window.location.href = './dashboard.v21.html';
    } catch (error) {
      console.error('[V21][LoginPage] login failed:', error);
      setMessage(error instanceof Error ? error.message : 'Connexion impossible.', 'error');
    }
  });

  function setMessage(text: string, type: 'success' | 'error' | 'info') {
    if (!message) return;
    message.textContent = text;
    message.dataset.type = type;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage, { once: true });
  } else {
    initLoginPage();
  }
}
