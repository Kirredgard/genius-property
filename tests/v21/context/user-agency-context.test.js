import { describe, it, expect, beforeEach } from 'vitest';
import { buildUserAgencyContext, persistUserAgencyContext, getCurrentRole } from '../../../js/v21/context/user-agency-context.js';

describe('user agency context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('construit un contexte par défaut', () => {
    const context = buildUserAgencyContext();
    expect(context.role).toBe('viewer');
  });

  it('persiste agence et rôle', () => {
    const context = persistUserAgencyContext({ agencyId: 'a1', role: 'admin' });
    expect(context.agencyId).toBe('a1');
    expect(getCurrentRole()).toBe('admin');
  });
});
