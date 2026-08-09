import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

export interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export function getFirebaseEnv(): FirebaseEnv {
  const env = (typeof window !== 'undefined' ? (window as any).GPV21_ENV : {}) || {};

  return {
    apiKey: env.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
}

export function initFirebaseClient(config: Partial<FirebaseEnv> = {}): FirebaseClient {
  const env = { ...getFirebaseEnv(), ...config };

  if (!env.apiKey || !env.projectId || !env.authDomain) {
    throw new Error('[V21][Firebase] Configuration Firebase incomplète.');
  }

  const app = getApps().length ? getApps()[0] : initializeApp(env);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const client = { app, auth, db, storage };

  if (typeof window !== 'undefined') {
    (window as any).GPV21Firebase = client;
  }

  return client;
}

export function getFirebaseClient(): FirebaseClient | null {
  if (typeof window !== 'undefined' && (window as any).GPV21Firebase) {
    return (window as any).GPV21Firebase;
  }

  try {
    return initFirebaseClient();
  } catch (_) {
    return null;
  }
}
