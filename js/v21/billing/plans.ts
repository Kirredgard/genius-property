export type PlanCode = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface PlanLimits {
  properties: number;
  tenants: number;
  owners: number;
  documentsMb: number;
  users: number;
  ownerPayouts: boolean;
  advancedReporting: boolean;
}

export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: {
    properties: 3,
    tenants: 5,
    owners: 1,
    documentsMb: 50,
    users: 1,
    ownerPayouts: false,
    advancedReporting: false
  },
  starter: {
    properties: 20,
    tenants: 40,
    owners: 5,
    documentsMb: 500,
    users: 3,
    ownerPayouts: false,
    advancedReporting: false
  },
  pro: {
    properties: 100,
    tenants: 200,
    owners: 30,
    documentsMb: 5000,
    users: 10,
    ownerPayouts: true,
    advancedReporting: true
  },
  business: {
    properties: 500,
    tenants: 1000,
    owners: 100,
    documentsMb: 25000,
    users: 50,
    ownerPayouts: true,
    advancedReporting: true
  },
  enterprise: {
    properties: Number.POSITIVE_INFINITY,
    tenants: Number.POSITIVE_INFINITY,
    owners: Number.POSITIVE_INFINITY,
    documentsMb: Number.POSITIVE_INFINITY,
    users: Number.POSITIVE_INFINITY,
    ownerPayouts: true,
    advancedReporting: true
  }
};

export function getPlanLimits(plan: PlanCode | string = 'free'): PlanLimits {
  return PLAN_LIMITS[plan as PlanCode] || PLAN_LIMITS.free;
}
