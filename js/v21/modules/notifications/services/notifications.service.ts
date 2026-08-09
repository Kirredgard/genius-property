import { normalizeNotificationFromFirestore } from '../adapters/notification.firestore.adapter.js';
import { buildRentDueAlerts, buildContractExpiryAlerts, buildOverduePaymentAlerts } from '../rules/business-alerts.rules.js';

export const COLLECTION_NAME = 'notifications';

function getFirestoreApi(options = {}) {
  return options.firestore || window?.GPV21Firebase?.db || window?.db || null;
}

export async function listNotifications(options = {}) {
  const db = getFirestoreApi(options);

  if (typeof window?.getNotifications === 'function') {
    const legacyNotifications = await window.getNotifications();
    return Array.isArray(legacyNotifications)
      ? legacyNotifications.map(normalizeNotificationFromFirestore)
      : [];
  }

  if (!db) {
    return [];
  }

  return [];
}

export async function markNotificationAsRead(notificationId, options = {}) {
  const db = getFirestoreApi(options);

  if (typeof window?.markNotificationAsRead === 'function') {
    const updated = await window.markNotificationAsRead(notificationId);
    return normalizeNotificationFromFirestore(updated || { id: notificationId, read: true });
  }

  if (!db) {
    return {
      id: notificationId,
      read: true,
      _pendingSync: true
    };
  }

  return {
    id: notificationId,
    read: true
  };
}

export async function generateBusinessAlerts(options = {}) {
  const payments = options.payments || window?.GPV21Payments?.state?.().payments || [];
  const contracts = options.contracts || window?.GPV21Contracts?.state?.().contracts || [];
  const tenants = options.tenants || window?.GPV21Tenants?.state?.().tenants || [];
  const properties = options.properties || window?.GPV21Properties?.state?.().properties || [];

  return [
    ...buildRentDueAlerts({ contracts, tenants, properties }),
    ...buildContractExpiryAlerts({ contracts, tenants, properties }),
    ...buildOverduePaymentAlerts({ payments, contracts, tenants, properties })
  ];
}
