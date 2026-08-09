import { describe, it, expect } from 'vitest';
import { buildOwnerReport, buildAllOwnerReports } from '../../../js/v21/modules/reporting/services/owner-reporting.service.js';

describe('owner reporting service', () => {
  it('calcule revenus, dépenses et solde net', () => {
    const report = buildOwnerReport({
      ownerId: 'o1',
      owners: [{ id: 'o1', firstName: 'Awa', lastName: 'Diop' }],
      properties: [{ id: 'p1', ownerId: 'o1' }],
      payments: [{ id: 'pay1', propertyId: 'p1', amount: 200000 }],
      expenses: [{ id: 'e1', propertyId: 'p1', amount: 50000 }]
    });

    expect(report.propertiesCount).toBe(1);
    expect(report.totalRevenue).toBe(200000);
    expect(report.totalExpenses).toBe(50000);
    expect(report.netBalance).toBe(150000);
  });

  it('génère tous les rapports propriétaires', () => {
    const reports = buildAllOwnerReports({
      owners: [{ id: 'o1' }, { id: 'o2' }],
      properties: [],
      payments: [],
      expenses: []
    });

    expect(reports).toHaveLength(2);
  });
});
