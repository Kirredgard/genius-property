const STORAGE_KEY = 'gp:v21:timeline';

export function addTimelineEvent(input: any) {
  const rows = listTimelineEvents();

  rows.unshift({
    ...input,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 200)));
}

export function listTimelineEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}
