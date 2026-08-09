import { describe, it, expect } from 'vitest';
import { buildDashboardKpis, buildDashboardKpiCards } from '../../../js/v21/modules/dashboard/services/dashboard-kpi.service.js';

describe('dashboard KPI service', () => {
  it('calcule les KPI consolidés', () => {
    const kpis = buildDashboardKpis({
      properties: [{ id: 'p1' }, { id: 'p2' }],
      tenants: [{ id: 't1' }],
      owners: [{ id: 'o1' }],
      contracts: [{ id: 'c1', propertyId: 'p1', status: 'active' }],
      payments: [{ amount: 200000 }, { amount: 50000, status: 'overdue' }],
      expenses: [{ amount: 30000 }],
      payouts: [{ netAmount: 100000, status: 'pending' }]
    });

    expect(kpis.propertiesCount).toBe(2);
    expect(kpis.occupancyRate).toBe(50);
    expect(kpis.totalRevenue).toBe(250000);
    expect(kpis.totalExpenses).toBe(30000);
    expect(kpis.netIncome).toBe(220000);
    expect(kpis.overdueAmount).toBe(50000);
    expect(kpis.pendingPayouts).toBe(100000);
  });

  it('crée des cartes KPI', () => {
    const cards = buildDashboardKpiCards({ propertiesCount: 2, occupancyRate: 50 });
    expect(cards.some((card) => card.key === 'propertiesCount')).toBe(true);
    expect(cards.some((card) => card.key === 'occupancyRate')).toBe(true);
  });
});
