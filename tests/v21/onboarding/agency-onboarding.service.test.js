import { describe, it, expect } from 'vitest';
import { generateAgencyId } from '../../../js/v21/onboarding/agency-onboarding.service.js';

describe('agency onboarding', () => {
  it('génère un agencyId', () => {
    expect(generateAgencyId('Agence Dakar')).toContain('agence-dakar');
  });
});
