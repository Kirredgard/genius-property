import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';
import { listNotifications, markNotificationAsRead, generateBusinessAlerts } from './services/notifications.service.js';
import { renderNotificationsList, renderNotificationsEmptyState } from './ui/notifications.list.js';

const state = {
  notifications: [],
  initialized: false
};

export async function initNotificationsModule(options = {}) {
  state.initialized = true;

  try {
    const generated = await generateBusinessAlerts(options);
    const existing = await listNotifications(options);

    state.notifications = mergeNotifications(existing, generated);

    if (!state.notifications.length) {
      renderNotificationsEmptyState(options.rootSelector);
    } else {
      renderNotificationsList(state.notifications, options.rootSelector);
    }
  } catch (error) {
    console.error('[V21][Notifications] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.notifications.length,
    unread: state.notifications.filter((item) => !item.read).length
  };
}

export async function readNotification(notificationId, options = {}) {
  if (!notificationId) {
    return { ok: false, errors: ['notificationId requis'] };
  }

  const result = await markNotificationAsRead(notificationId, options);
  state.notifications = state.notifications.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );

  return { ok: true, notification: result };
}

export function getNotificationsState() {
  return { ...state, notifications: [...state.notifications] };
}

function mergeNotifications(existing = [], generated = []) {
  const byId = new Map();

  [...generated, ...existing].forEach((item) => {
    if (!item?.id) return;
    byId.set(item.id, item);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const aDate = new Date(a.createdAt || 0).getTime();
    const bDate = new Date(b.createdAt || 0).getTime();
    return bDate - aDate;
  });
}


registerLegacyGlobal('GPV21Notifications', { init: initNotificationsModule, read: readNotification, state: getNotificationsState });
