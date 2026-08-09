import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe
} from 'firebase/auth';
import { getFirebaseClient } from '../firebase/firebase-client.js';

export interface AuthSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function normalizeUser(user: User | null): AuthSession | null {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  const client = getFirebaseClient();

  if (!client?.auth) {
    throw new Error('[V21][Auth] Firebase Auth non disponible.');
  }

  const credentials = await signInWithEmailAndPassword(client.auth, email, password);
  const session = normalizeUser(credentials.user);

  if (!session) {
    throw new Error('[V21][Auth] Session invalide après connexion.');
  }

  persistSession(session);
  return session;
}

export async function logout(): Promise<boolean> {
  const client = getFirebaseClient();

  if (!client?.auth) {
    clearSession();
    return true;
  }

  await signOut(client.auth);
  clearSession();
  return true;
}

export function observeAuthState(callback: (session: AuthSession | null) => void): Unsubscribe {
  const client = getFirebaseClient();

  if (!client?.auth) {
    callback(getPersistedSession());
    return () => {};
  }

  return onAuthStateChanged(client.auth, (user) => {
    const session = normalizeUser(user);
    if (session) persistSession(session);
    else clearSession();
    callback(session);
  });
}

export function persistSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('gp:v21:session', JSON.stringify(session));
  } catch (_) {
    // ignore storage failures
  }
}

export function getPersistedSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('gp:v21:session');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('gp:v21:session');
  } catch (_) {
    // ignore storage failures
  }
}
