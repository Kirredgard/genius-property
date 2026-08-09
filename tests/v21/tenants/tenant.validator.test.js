import { describe, it, expect } from 'vitest';
import { validateTenant } from '../../../js/v21/modules/tenants/validators/tenant.validator.js';

describe('validateTenant', () => {
  it('accepte un locataire valide', () => {
    const result = validateTenant({
      firstName: 'Awa',
      lastName: 'Diop',
      phone: '771234567',
      monthlyRent: 150000
    });

    expect(result.valid).toBe(true);
    expect(result.value.monthlyRent).toBe(150000);
  });

  it('refuse un locataire sans nom', () => {
    const result = validateTenant({
      phone: '771234567'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Prénom locataire requis');
    expect(result.errors).toContain('Nom locataire requis');
  });

  it('refuse un email invalide', () => {
    const result = validateTenant({
      firstName: 'Awa',
      lastName: 'Diop',
      email: 'mauvais-email'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email invalide');
  });
});
