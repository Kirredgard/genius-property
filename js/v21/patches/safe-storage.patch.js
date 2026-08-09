/**
 * Patch storage sécurisé V21.
 */

export function getStorageValue(key, fallback = null, storage = localStorage) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

export function setStorageValue(key, value, storage = localStorage) {
  try {
    storage.setItem(key, String(value));
    return true;
  } catch (_) {
    return false;
  }
}

export function removeStorageValue(key, storage = localStorage) {
  try {
    storage.removeItem(key);
    return true;
  } catch (_) {
    return false;
  }
}

export function getStorageJSON(key, fallback = null, storage = localStorage) {
  const value = getStorageValue(key, null, storage);
  if (value === null) return fallback;

  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

export function setStorageJSON(key, value, storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_) {
    return false;
  }
}
