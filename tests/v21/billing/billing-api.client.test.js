import { describe, it, expect } from 'vitest';
import { getBillingApiBaseUrl } from '../../../js/v21/billing/billing-api.client.js';

describe('billing api client', () => {
  it('retourne une URL API', () => {
    expect(getBillingApiBaseUrl()).toBeTruthy();
  });
});
