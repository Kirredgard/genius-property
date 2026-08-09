export function mapStripeStatus(stripeStatus = '') {
  const statusMap = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    unpaid: 'past_due',
    canceled: 'cancelled',
    incomplete: 'pending',
    incomplete_expired: 'expired',
    paused: 'paused'
  };

  return statusMap[stripeStatus] || stripeStatus || 'unknown';
}

export function extractPlanFromSubscription(subscription, priceToPlan = {}) {
  const priceId = subscription?.items?.data?.[0]?.price?.id || '';
  return priceToPlan[priceId] || subscription?.metadata?.plan || 'free';
}

export function getPeriodEndISO(subscription) {
  const ts = subscription?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : '';
}

export function buildSubscriptionPayload({
  agencyId,
  plan,
  status,
  customerId,
  subscriptionId,
  currentPeriodEnd,
  provider = 'stripe'
}) {
  return {
    agencyId,
    plan: plan || 'free',
    status: status || 'unknown',
    provider,
    customerId: customerId || '',
    subscriptionId: subscriptionId || '',
    currentPeriodEnd: currentPeriodEnd || '',
    updatedAt: new Date().toISOString()
  };
}
