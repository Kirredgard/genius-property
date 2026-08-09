export interface AdvancedFeatureFlag {
  key: string;
  enabled: boolean;
  rollout?: number;
  maintenanceMode?: boolean;
  allowedAgencies?: string[];
  allowedRoles?: string[];
}

const STORAGE_KEY = 'gp:v21:advancedFeatureFlags';

export function getAdvancedFeatureFlags(): AdvancedFeatureFlag[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function saveAdvancedFeatureFlags(flags: AdvancedFeatureFlag[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function isFeatureEnabled(key: string, context: any = {}) {
  const flag = getAdvancedFeatureFlags().find((f) => f.key === key);
  if (!flag) return false;

  if (flag.maintenanceMode) return false;

  if (flag.allowedAgencies?.length) {
    if (!flag.allowedAgencies.includes(context.agencyId)) return false;
  }

  if (flag.allowedRoles?.length) {
    if (!flag.allowedRoles.includes(context.role)) return false;
  }

  if (typeof flag.rollout === 'number') {
    return Math.random() * 100 <= flag.rollout;
  }

  return !!flag.enabled;
}
