import { describe, expect, it } from 'vitest';
import { computeDashboardStats } from '../js/v21/modules/dashboard/services/dashboard.service.js';

describe('computeDashboardStats', () => {
  it('compte les entités principales du dashboard', () => {
    const stats = computeDashboardStats({
      biens: [{ id: 1 }, { id: 2 }],
      locataires: [{ id: 1 }],
      paiements: [{ id: 1 }, { id: 2 }, { id: 3 }],
      contrats: [],
      depenses: [{ id: 1 }]
    });

    expect(stats).toEqual({
      properties: 2,
      tenants: 1,
      payments: 3,
      contracts: 0,
      expenses: 1
    });
  });
});
