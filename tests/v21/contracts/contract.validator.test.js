import { describe, it, expect } from 'vitest';
import { validateContract } from '../../../js/v21/modules/contracts/validators/contract.validator.js';

describe('validateContract', () => {
  it('accepte un contrat valide', () => {
    const result = validateContract({
      tenantId: 't1',
      propertyId: 'p1',
      startDate: '2026-01-01',
      monthlyRent: 200000,
      paymentDay: 5
    });

    expect(result.valid).toBe(true);
    expect(result.value.monthlyRent).toBe(200000);
  });

  it('refuse un contrat sans locataire', () => {
    const result = validateContract({
      propertyId: 'p1',
      startDate: '2026-01-01',
      monthlyRent: 200000
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Locataire requis');
  });

  it('refuse une date de fin avant le début', () => {
    const result = validateContract({
      tenantId: 't1',
      propertyId: 'p1',
      startDate: '2026-05-01',
      endDate: '2026-01-01',
      monthlyRent: 200000
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Date de fin antérieure à la date de début');
  });
});
