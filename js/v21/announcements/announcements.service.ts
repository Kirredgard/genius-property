export interface Announcement {
  id: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  createdAt?: string;
}

const STORAGE_KEY = 'gp:v21:announcements';

export function listAnnouncements(): Announcement[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function createAnnouncement(input: Announcement) {
  const rows = listAnnouncements();
  rows.unshift({
    ...input,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 50)));
}
