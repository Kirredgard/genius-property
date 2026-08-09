import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlagName } from './feature-flags.js';

export interface RemoteFeatureFlagOptions {
  db?: Firestore | unknown;
  agencyId?: string;
  environment?: string;
}

export function buildFeatureFlagsPath(options: RemoteFeatureFlagOptions = {}): string[] {
  const environment = options.environment || import.meta.env.MODE || 'development';

  if (options.agencyId) {
    return ['agencies', options.agencyId, 'settings', `featureFlags_${environment}`];
  }

  return ['settings', `featureFlags_${environment}`];
}

export async function loadRemoteFeatureFlags(options: RemoteFeatureFlagOptions = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'settings' });

  if (!db) {
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  const ref = doc(db, ...buildFeatureFlagsPath(options));
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...snapshot.data()
  };
}

export async function saveRemoteFeatureFlags(
  flags: Partial<Record<FeatureFlagName, boolean>>,
  options: RemoteFeatureFlagOptions = {}
) {
  const db = resolveFirestore({ db: options.db, collectionName: 'settings' });

  if (!db) {
    return {
      ok: false,
      reason: 'Firestore unavailable',
      flags
    };
  }

  const ref = doc(db, ...buildFeatureFlagsPath(options));
  await setDoc(ref, {
    ...flags,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return {
    ok: true,
    flags
  };
}
