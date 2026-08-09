import { describe, it, expect } from 'vitest';
import { trackBillingUpgrade } from '../../../js/v21/audit/product-tracking.service.js';

describe('product tracking service', () => {
  it('expose tracking upgrade', () => {
    expect(typeof trackBillingUpgrade).toBe('function');
  });
});
