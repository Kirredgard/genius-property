import { isFeatureEnabled, type FeatureFlagName } from './feature-flags.js';

export interface RolloutRoute {
  legacyUrl: string;
  v21Url: string;
  flag: FeatureFlagName;
}

export const ROLLOUT_ROUTES: Record<string, RolloutRoute> = {
  dashboard: {
    legacyUrl: './index.html',
    v21Url: './dashboard.v21.html',
    flag: 'v21Dashboard'
  },
  properties: {
    legacyUrl: './index.html#properties',
    v21Url: './properties.v21.html',
    flag: 'v21Properties'
  },
  tenants: {
    legacyUrl: './index.html#tenants',
    v21Url: './tenants.v21.html',
    flag: 'v21Tenants'
  },
  owners: {
    legacyUrl: './index.html#owners',
    v21Url: './owners.v21.html',
    flag: 'v21Owners'
  },
  contracts: {
    legacyUrl: './index.html#contracts',
    v21Url: './contracts.v21.html',
    flag: 'v21Contracts'
  },
  documents: {
    legacyUrl: './index.html#documents',
    v21Url: './documents.v21.html',
    flag: 'v21Documents'
  }
};

export function resolveRolloutUrl(routeName: keyof typeof ROLLOUT_ROUTES, context = {}): string {
  const route = ROLLOUT_ROUTES[routeName];

  if (!route) return './dashboard.v21.html';

  return isFeatureEnabled(route.flag, context)
    ? route.v21Url
    : route.legacyUrl;
}

export function goToRolloutRoute(routeName: keyof typeof ROLLOUT_ROUTES, context = {}): void {
  if (typeof window === 'undefined') return;

  window.location.href = resolveRolloutUrl(routeName, context);
}

if (typeof window !== 'undefined') {
  (window as any).GPV21Rollout = {
    routes: ROLLOUT_ROUTES,
    resolve: resolveRolloutUrl,
    go: goToRolloutRoute
  };
}
