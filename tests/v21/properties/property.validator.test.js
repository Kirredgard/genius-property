import { describe, it, expect } from 'vitest';
import { validateProperty } from '../../../js/v21/modules/properties/validators/property.validator.js';

describe('validateProperty', () => {
  it('accepte un bien valide', () => {
    const result = validateProperty({
      title: 'Appartement Almadies',
      address: 'Route des Almadies',
      monthlyRent: 350000
    });

    expect(result.valid).toBe(true);
    expect(result.value.monthlyRent).toBe(350000);
  });

  it('refuse un bien sans nom', () => {
    const result = validateProperty({
      address: 'Dakar'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Nom du bien requis');
  });

  it('refuse un loyer négatif', () => {
    const result = validateProperty({
      title: 'Studio',
      address: 'Dakar',
      monthlyRent: -1
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Loyer mensuel invalide');
  });
});
