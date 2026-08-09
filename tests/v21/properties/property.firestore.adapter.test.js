import { describe, it, expect } from 'vitest';
import { normalizePropertyForFirestore, normalizePropertyFromFirestore } from '../../../js/v21/modules/properties/adapters/property.firestore.adapter.js';

describe('property firestore adapter', () => {
  it('normalise pour Firestore', () => {
    const data = normalizePropertyForFirestore({
      title: 'Villa',
      monthlyRent: '500000',
      rooms: '5'
    });

    expect(data.monthlyRent).toBe(500000);
    expect(data.rooms).toBe(5);
    expect(data.status).toBe('available');
  });

  it('supporte les champs legacy', () => {
    const data = normalizePropertyFromFirestore({
      id: 'p1',
      nom: 'Maison',
      adresse: 'Thiès',
      loyerMensuel: '250000'
    });

    expect(data.title).toBe('Maison');
    expect(data.address).toBe('Thiès');
    expect(data.monthlyRent).toBe(250000);
  });
});
