const CACHE = new Map<string, any>();

export function setCache(key: string, value: unknown) {
  CACHE.set(key, {
    value,
    updatedAt: Date.now()
  });
}

export function getCache(key: string) {
  return CACHE.get(key)?.value ?? null;
}

export function clearCache() {
  CACHE.clear();
}
