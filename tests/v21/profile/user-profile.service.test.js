import { describe, it, expect } from 'vitest';
import { hydrateContextFromUserProfile } from '../../../js/v21/profile/user-profile.service.js';

describe('user profile service', () => {
  it('retourne un contexte fallback sans Firestore', async () => {
    const context = await hydrateContextFromUserProfile({
      uid: 'u1',
      email: 'user@example.com',
      displayName: null,
      photoURL: null
    });

    expect(context.userId).toBe('u1');
    expect(context.role).toBe('viewer');
  });
});
