import { describe, it, expect } from 'vitest';
import { validateOwnerPayout } from '../../../js/v21/modules/owner-payouts/validators/owner-payout.validator.js';

describe('owner payout validator', () => {
  it('accepte un reversement valide', () => {
    const result = validateOwnerPayout({
      ownerId: 'o1',
      period: '2026-05',
      revenue: 100000
    });

    expect(result.valid).toBe(true);
  });

  it('refuse sans période', () => {
    const result = validateOwnerPayout({
      ownerId: 'o1'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Période requise');
  });
});
