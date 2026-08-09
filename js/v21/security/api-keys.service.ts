const STORAGE_KEY = 'gp:v21:apiKeys';

export function generateApiKey(prefix = 'gpv21') {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export function listApiKeys() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function createApiKey(label = 'default') {
  const rows = listApiKeys();

  const key = {
    id: generateApiKey(),
    label,
    createdAt: new Date().toISOString()
  };

  rows.unshift(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 50)));

  return key;
}
