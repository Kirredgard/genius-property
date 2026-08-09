import { describe, it, expect } from 'vitest';
import { assignOwnerToProperty, listPropertiesByOwner } from '../../../js/v21/modules/properties/services/property-owner.service.js';

describe('property owner service', () => {
  it('refuse une affectation sans propertyId', async () => {
    const result = await assignOwnerToProperty('', 'owner1');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('propertyId requis');
  });

  it('refuse une affectation sans ownerId', async () => {
    const result = await assignOwnerToProperty('property1', '');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('ownerId requis');
  });

  it('retourne une liste vide sans ownerId', async () => {
    const rows = await listPropertiesByOwner('');
    expect(rows).toEqual([]);
  });
});
