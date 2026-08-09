const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];

function fromImportMetaEnv() {
  try {
    const env = import.meta?.env || {};
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
    };
  } catch (_) {
    return {};
  }
}

export function getFirebaseConfig(source = globalThis.__GP_FIREBASE_CONFIG__ || fromImportMetaEnv()) {
  const config = Object.fromEntries(
    Object.entries(source || {}).filter(([, value]) => typeof value === 'string' && value.trim() !== '')
  );

  const missing = REQUIRED_KEYS.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`[GP V21] Configuration Firebase manquante: ${missing.join(', ')}`);
  }

  return Object.freeze(config);
}

export { REQUIRED_KEYS };
