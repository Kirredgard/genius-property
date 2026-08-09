/**
 * Guards runtime V21.
 */

export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function requireBrowser(featureName = 'Cette fonctionnalité') {
  if (!isBrowser()) {
    throw new Error(`[V21][Runtime] ${featureName} nécessite un navigateur.`);
  }
}

export function safeCall(fn, fallback = null, onError = console.error) {
  try {
    return typeof fn === 'function' ? fn() : fallback;
  } catch (error) {
    if (typeof onError === 'function') onError(error);
    return fallback;
  }
}

export async function safeAsync(fn, fallback = null, onError = console.error) {
  try {
    return typeof fn === 'function' ? await fn() : fallback;
  } catch (error) {
    if (typeof onError === 'function') onError(error);
    return fallback;
  }
}
