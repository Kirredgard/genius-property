import { describe, it, expect } from 'vitest';
import { normalizeNotificationFromFirestore, normalizeNotificationForFirestore } from '../../../js/v21/modules/notifications/adapters/notification.firestore.adapter.js';

describe('notification firestore adapter', () => {
  it('normalise une notification entrante', () => {
    const data = normalizeNotificationFromFirestore({
      id: 'n1',
      type: 'rent_due',
      severity: 'info',
      title: 'Loyer',
      read: false
    });

    expect(data.id).toBe('n1');
    expect(data.type).toBe('rent_due');
    expect(data.read).toBe(false);
  });

  it('prépare une notification pour Firestore', () => {
    const data = normalizeNotificationForFirestore({
      title: 'Test',
      message: 'Message'
    });

    expect(data.type).toBe('generic');
    expect(data.severity).toBe('info');
    expect(data.updatedAt).toBeTruthy();
  });
});
