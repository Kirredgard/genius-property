import { getLocalSubscription } from './subscription.service.js';
import { getPlanLimits } from './plans.js';

export type UsageMetric = 'properties' | 'tenants' | 'owners' | 'documentsMb' | 'users';

export interface UsageCheck {
  ok: boolean;
  metric: UsageMetric;
  used: number;
  limit: number;
  plan: string;
  errors?: string[];
}

export function checkUsageLimit(metric: UsageMetric, used: number): UsageCheck {
  const subscription = getLocalSubscription();
  const limits: any = subscription.limits || getPlanLimits(subscription.plan || 'free');
  const limit = Number(limits[metric] ?? 0);
  const ok = limit === Number.POSITIVE_INFINITY || used < limit;

  return {
    ok,
    metric,
    used,
    limit,
    plan: String(subscription.plan || 'free'),
    errors: ok ? [] : [`Limite ${metric} atteinte pour le plan ${subscription.plan || 'free'}`]
  };
}

export function hasPlanFeature(feature: 'ownerPayouts' | 'advancedReporting'): boolean {
  const subscription = getLocalSubscription();
  const limits: any = subscription.limits || getPlanLimits(subscription.plan || 'free');
  return Boolean(limits[feature]);
}
