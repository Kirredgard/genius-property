import { describe, it, expect } from 'vitest';
import { calculateQuotaUsage } from '../../../js/v21/quotas/usage-quotas.service.js';

describe('usage quotas service', () => {
  it('calcule le pourcentage quota', () => {
    const quota = calculateQuotaUsage(50, 100);
    expect(quota.percent).toBe(50);
  });
});
