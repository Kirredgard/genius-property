const registry = new Map();

export function exposeGlobal(name, value, { overwrite = false } = {}) {
  if (!name || typeof name !== 'string') throw new TypeError('Global name is required');
  if (!overwrite && Object.prototype.hasOwnProperty.call(globalThis, name)) {
    registry.set(name, { value: globalThis[name], source: 'existing' });
    return globalThis[name];
  }
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value
  });
  registry.set(name, { value, source: 'v21' });
  return value;
}

export function getGlobalReport() {
  return Array.from(registry.entries()).map(([name, meta]) => ({ name, source: meta.source }));
}

export function getLegacyWindowUsage(pattern = /^GP|^render|^open|^close|^navigate|^toast|^save|^load/) {
  return Object.keys(globalThis).filter((name) => pattern.test(name)).sort();
}
