/**
 * Registre de compatibilité legacy V21.
 *
 * Objectif :
 * - centraliser les accès window.*
 * - éviter de disperser de nouveaux globals partout
 * - permettre de remplacer domaine par domaine sans casser l’app
 */

const registry = new Map();

export function registerLegacyGlobal(name, value) {
  if (!name || typeof name !== 'string') {
    throw new Error('[V21][LegacyRegistry] name requis');
  }

  registry.set(name, value);

  if (typeof window !== 'undefined') {
    window[name] = value;
  }

  return value;
}

export function getLegacyGlobal(name, fallback = null) {
  if (registry.has(name)) return registry.get(name);

  if (typeof window !== 'undefined' && name in window) {
    return window[name];
  }

  return fallback;
}

export function hasLegacyGlobal(name) {
  return registry.has(name) || (typeof window !== 'undefined' && name in window);
}

export function listLegacyGlobals() {
  return Array.from(registry.keys()).sort();
}

export function unregisterLegacyGlobal(name) {
  registry.delete(name);

  if (typeof window !== 'undefined' && name in window) {
    try {
      delete window[name];
    } catch (_) {
      window[name] = undefined;
    }
  }
}

if (typeof window !== 'undefined') {
  window.GPV21LegacyRegistry = {
    register: registerLegacyGlobal,
    get: getLegacyGlobal,
    has: hasLegacyGlobal,
    list: listLegacyGlobals,
    unregister: unregisterLegacyGlobal
  };
}
