import { describe, it, expect } from 'vitest';
import { normalizeContractForFirestore, normalizeContractFromFirestore } from '../../../js/v21/modules/contracts/adapters/contract.firestore.adapter.js';

describe('contract firestore adapter', () => {
  it('normalise pour Firestore', () => {
    const data = normalizeContractForFirestore({
      tenantId: 't1',
      propertyId: 'p1',
      monthlyRent: '250000',
      deposit: '500000'
    });

    expect(data.monthlyRent).toBe(250000);
    expect(data.deposit).toBe(500000);
    expect(data.status).toBe('active');
  });

  it('supporte les champs legacy', () => {
    const data = normalizeContractFromFirestore({
      id: 'c1',
      locataireId: 't1',
      bienId: 'p1',
      loyerMensuel: '275000',
      caution: '550000'
    });

    expect(data.tenantId).toBe('t1');
    expect(data.propertyId).toBe('p1');
    expect(data.monthlyRent).toBe(275000);
    expect(data.deposit).toBe(550000);
  });
});
