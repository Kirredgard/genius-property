import { describe, it, expect } from 'vitest';
import { generateInviteToken, buildInviteUrl } from '../../../js/v21/onboarding/invitations.service.js';

describe('invitations service', () => {
  it('génère un token invitation', () => {
    expect(generateInviteToken('a@b.com')).toBeTruthy();
  });

  it('génère une URL invitation', () => {
    expect(buildInviteUrl('tok')).toContain('invite.v21.html?token=tok');
  });
});
