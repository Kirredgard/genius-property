import { describe, it, expect } from 'vitest';
import { calculateOwnerPayout, markOwnerPayoutPaid } from '../../../js/v21/modules/owner-payouts/services/owner-payouts.service.js';

describe('owner payouts service', () => {
  it('calcule le net à reverser', () => {
    const payout = calculateOwnerPayout({
      ownerId: 'o1',
      period: '2026-05',
      revenue: 300000,
      expenses: 50000,
      managementFees: 30000,
      adjustments: 10000
    });

    expect(payout.netAmount).toBe(230000);
    expect(payout.status).toBe('pending');
  });

  it('refuse markPaid sans id', async () => {
    const result = await markOwnerPayoutPaid('');
    expect(result.ok).toBe(false);
  });
});
