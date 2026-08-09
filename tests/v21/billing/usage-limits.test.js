import { describe, it, expect, beforeEach } from 'vitest';
import { checkUsageLimit, hasPlanFeature } from '../../../js/v21/billing/usage-limits.js';
import { persistLocalSubscription } from '../../../js/v21/billing/subscription.service.js';
import { getPlanLimits } from '../../../js/v21/billing/plans.js';

describe('usage limits', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('bloque si limite atteinte', () => {
    persistLocalSubscription({ agencyId: 'a1', plan: 'free', status: 'active', limits: getPlanLimits('free') });
    expect(checkUsageLimit('properties', 3).ok).toBe(false);
  });

  it('autorise une fonctionnalité pro', () => {
    persistLocalSubscription({ agencyId: 'a1', plan: 'pro', status: 'active', limits: getPlanLimits('pro') });
    expect(hasPlanFeature('ownerPayouts')).toBe(true);
  });
});
