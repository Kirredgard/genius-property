const CACHE_NAME = 'gp-v21-cache';

export async function registerOfflineCache() {
  if (!('serviceWorker' in navigator)) return false;

  await navigator.serviceWorker.register('/sw.v21.js');
  return true;
}

export async function clearOfflineCache() {
  const keys = await caches.keys();

  await Promise.all(
    keys.map((key) => caches.delete(key))
  );
}

export async function cacheUrls(urls: string[] = []) {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(urls);
}
