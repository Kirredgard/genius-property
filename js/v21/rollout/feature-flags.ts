export type FeatureFlagName =
  | 'v21Dashboard'
  | 'v21Properties'
  | 'v21Tenants'
  | 'v21Owners'
  | 'v21Contracts'
  | 'v21Documents'
  | 'v21OwnerPayouts'
  | 'v21ProductionIndex';

export interface FeatureFlagContext {
  role?: string;
  agencyId?: string;
  environment?: string;
  userId?: string;
}

let remoteFeatureFlags: Partial<Record<FeatureFlagName, boolean>> = {};

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagName, boolean> = {
  v21Dashboard: true,
  v21Properties: true,
  v21Tenants: true,
  v21Owners: true,
  v21Contracts: true,
  v21Documents: true,
  v21OwnerPayouts: false,
  v21ProductionIndex: false
};

export function getFeatureFlags(): Record<FeatureFlagName, boolean> {
  if (typeof window === 'undefined') return { ...DEFAULT_FEATURE_FLAGS };

  const fromStorage = readStoredFlags();

  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...fromStorage
  };
}

export function isFeatureEnabled(name: FeatureFlagName, context: FeatureFlagContext = {}): boolean {
  const flags = getFeatureFlags();

  if (context.environment === 'production' && name === 'v21ProductionIndex') {
    return Boolean(flags[name]);
  }

  if (context.role === 'superAdmin' || context.role === 'admin') {
    return Boolean(flags[name]);
  }

  return Boolean(flags[name]);
}

export function setFeatureFlag(name: FeatureFlagName, enabled: boolean): void {
  if (typeof window === 'undefined') return;

  const flags = readStoredFlags();
  flags[name] = enabled;

  localStorage.setItem('gp:v21:feature-flags', JSON.stringify(flags));
}

export function setRemoteFeatureFlags(flags: Partial<Record<FeatureFlagName, boolean>>): void {
      remoteFeatureFlags = { ...flags };
    }

    export function resetFeatureFlags(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('gp:v21:feature-flags');
}

function readStoredFlags(): Partial<Record<FeatureFlagName, boolean>> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem('gp:v21:feature-flags');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

if (typeof window !== 'undefined') {
  (window as any).GPV21Flags = {
    list: getFeatureFlags,
    enabled: isFeatureEnabled,
    set: setFeatureFlag,
    reset: resetFeatureFlags,
        setRemote: setRemoteFeatureFlags
  };
}
