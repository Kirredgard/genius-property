import { describe, it, expect } from 'vitest';
import { validateOwner } from '../../../js/v21/modules/owners/validators/owner.validator.js';

describe('validateOwner', () => {
  it('accepte un propriétaire valide', () => {
    const result = validateOwner({
      firstName: 'Mamadou',
      lastName: 'Fall',
      phone: '771234567'
    });

    expect(result.valid).toBe(true);
  });

  it('refuse un propriétaire sans contact', () => {
    const result = validateOwner({
      firstName: 'Mamadou',
      lastName: 'Fall'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Téléphone ou email requis');
  });
});
