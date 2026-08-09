const STORAGE_KEY = 'gp:v21:fixTracker';

export function addFixItem(input: any) {
  const rows = listFixItems();

  rows.unshift({
    id: `fix_${Date.now()}`,
    title: input.title || '',
    priority: input.priority || 'medium',
    status: input.status || 'open',
    source: input.source || 'beta',
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 200)));
  return rows[0];
}

export function listFixItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}
