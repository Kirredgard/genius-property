/**
 * Patch événements V21.
 */

export function emitAppEvent(name, detail = {}) {
  if (typeof document === 'undefined' || !name) return false;

  document.dispatchEvent(new CustomEvent(name, { detail }));
  return true;
}

export function listenAppEvent(name, handler, options) {
  if (typeof document === 'undefined' || !name || typeof handler !== 'function') {
    return () => {};
  }

  document.addEventListener(name, handler, options);
  return () => document.removeEventListener(name, handler, options);
}

export function onceAppEvent(name, handler) {
  return listenAppEvent(name, handler, { once: true });
}
