import { describe, it, expect } from 'vitest';
import { exportOwnerPayoutsToCSV, buildOwnerPayoutsPrintableHTML } from '../../../js/v21/modules/owner-payouts/exports/owner-payouts-exporter.js';

describe('owner payouts exporter', () => {
  it('exporte les reversements en CSV', () => {
    const csv = exportOwnerPayoutsToCSV([{
      id: 'p1',
      ownerId: 'o1',
      period: '2026-05',
      revenue: 300000,
      expenses: 50000,
      managementFees: 30000,
      netAmount: 220000,
      status: 'pending'
    }]);

    expect(csv).toContain('Proprietaire');
    expect(csv).toContain('2026-05');
    expect(csv).toContain('220000');
  });

  it('génère une vue imprimable HTML', () => {
    const html = buildOwnerPayoutsPrintableHTML([{
      ownerId: 'o1',
      period: '2026-05',
      netAmount: 220000
    }]);

    expect(html).toContain('<table>');
    expect(html).toContain('Reversements propriétaires');
  });
});
