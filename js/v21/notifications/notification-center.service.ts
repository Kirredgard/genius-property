const STORAGE_KEY = 'gp:v21:notifications';

export function listNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function pushNotification(notification: any) {
  const rows = listNotifications();

  rows.unshift({
    ...notification,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 100)));
}
