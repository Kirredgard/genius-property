import { describe, it, expect } from 'vitest';

function resolveBillingRecipient(subscriptionDocData = {}, fallbackCustomerEmail = '') {
  return subscriptionDocData.billingEmail
    || subscriptionDocData.email
    || subscriptionDocData.ownerEmail
    || fallbackCustomerEmail
    || '';
}

describe('stripe email notifications helper', () => {
  it('résout un destinataire billing', () => {
    expect(resolveBillingRecipient({ billingEmail: 'billing@example.com' })).toBe('billing@example.com');
  });

  it('utilise le fallback customer email', () => {
    expect(resolveBillingRecipient({}, 'customer@example.com')).toBe('customer@example.com');
  });
});
