import { describe, it, expect, beforeEach } from 'vitest';
import { persistLocalBetaAgency, readLocalBetaAgencies } from '../../../js/v21/beta/beta-program.service.js';

describe('beta program service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste une agence beta locale', () => {
    persistLocalBetaAgency({ agencyId: 'a1', status: 'candidate' });
    expect(readLocalBetaAgencies()[0].agencyId).toBe('a1');
  });
});
