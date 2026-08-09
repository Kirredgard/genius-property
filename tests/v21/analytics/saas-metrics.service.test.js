import { describe, it, expect } from 'vitest';
import { calculateSaasMetrics, buildSaasMetricCards } from '../../../js/v21/analytics/saas-metrics.service.js';

describe('saas metrics service', () => {
  it('calcule MRR/ARR et usage', () => {
    const metrics = calculateSaasMetrics(
      [
        { agencyId: 'a1', plan: 'pro', status: 'active' },
        { agencyId: 'a2', plan: 'starter', status: 'active' },
        { agencyId: 'a3', plan: 'free', status: 'trialing' }
      ],
      [
        { agencyId: 'a1', properties: 10, tenants: 20, documentsMb: 100, users: 2, firebaseCostEstimate: 1000 }
      ]
    );

    expect(metrics.mrr).toBeGreaterThan(0);
    expect(metrics.arr).toBe(metrics.mrr * 12);
    expect(metrics.totalProperties).toBe(10);
  });

  it('construit des cartes métriques', () => {
    const cards = buildSaasMetricCards({ mrr: 1000, arr: 12000, agenciesActive: 2 });
    expect(cards.some((card) => card.key === 'mrr')).toBe(true);
  });
});
