import { checkUsageLimit, type UsageMetric } from './usage-limits.js';

export interface UsageGuardResult {
  ok: boolean;
  errors?: string[];
}

export function requireUsageCapacity(metric: UsageMetric, currentCount: number): UsageGuardResult {
  const result = checkUsageLimit(metric, currentCount);

  if (result.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    errors: result.errors || [`Limite ${metric} atteinte`]
  };
}

export function countStateItems(state: unknown, key: string): number {
  const value = (state as any)?.[key];
  return Array.isArray(value) ? value.length : 0;
}
