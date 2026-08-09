export function normalizeNotificationForFirestore(notification = {}) {
  return {
    type: notification.type || 'generic',
    severity: notification.severity || 'info',
    title: notification.title || '',
    message: notification.message || '',
    read: Boolean(notification.read),
    entityId: notification.entityId || '',
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function normalizeNotificationFromFirestore(doc = {}) {
  const data = typeof doc.data === 'function' ? doc.data() : doc;

  return {
    id: doc.id || data.id || '',
    type: data.type || 'generic',
    severity: data.severity || 'info',
    title: data.title || '',
    message: data.message || '',
    read: Boolean(data.read),
    entityId: data.entityId || '',
    createdAt: data.createdAt || ''
  };
}
