import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeUser, persistSession, getPersistedSession, clearSession } from '../../../js/v21/auth/auth.service.js';

describe('auth service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalise un utilisateur Firebase', () => {
    const session = normalizeUser({
      uid: 'u1',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    });

    expect(session.uid).toBe('u1');
    expect(session.email).toBe('test@example.com');
  });

  it('persiste et supprime une session', () => {
    persistSession({ uid: 'u1', email: 'a@b.com', displayName: null, photoURL: null });
    expect(getPersistedSession().uid).toBe('u1');

    clearSession();
    expect(getPersistedSession()).toBe(null);
  });
});
