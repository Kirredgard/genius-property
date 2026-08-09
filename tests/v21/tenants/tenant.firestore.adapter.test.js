import { describe, it, expect } from 'vitest';
import { normalizeTenantForFirestore, normalizeTenantFromFirestore } from '../../../js/v21/modules/tenants/adapters/tenant.firestore.adapter.js';

describe('tenant firestore adapter', () => {
  it('normalise pour Firestore', () => {
    const data = normalizeTenantForFirestore({
      firstName: 'Awa',
      lastName: 'Diop',
      monthlyRent: '200000'
    });

    expect(data.monthlyRent).toBe(200000);
    expect(data.status).toBe('active');
    expect(data.updatedAt).toBeTruthy();
  });

  it('lit aussi les anciens champs legacy', () => {
    const data = normalizeTenantFromFirestore({
      id: 't1',
      prenom: 'Moussa',
      nom: 'Fall',
      loyerMensuel: '175000'
    });

    expect(data.firstName).toBe('Moussa');
    expect(data.lastName).toBe('Fall');
    expect(data.monthlyRent).toBe(175000);
  });
});
