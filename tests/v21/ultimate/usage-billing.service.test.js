import { describe, it, expect } from 'vitest';
import { calculateUsageBilling } from '../../../js/v21/billing/usage-billing.service.js';

describe('usage billing', () => {
  it('calcule total usage', () => {
    const result = calculateUsageBilling({
      properties: 10,
      users: 2,
      documentsGb: 1
    });

    expect(result.total).toBeGreaterThan(0);
  });
});
