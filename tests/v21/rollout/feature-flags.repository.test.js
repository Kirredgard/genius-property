import { describe, it, expect } from 'vitest';
import { buildFeatureFlagsPath } from '../../../js/v21/rollout/feature-flags.repository.js';

describe('feature flags repository', () => {
  it('construit un chemin global par environnement', () => {
    expect(buildFeatureFlagsPath({ environment: 'staging' })).toEqual(['settings', 'featureFlags_staging']);
  });

  it('construit un chemin par agence', () => {
    expect(buildFeatureFlagsPath({ agencyId: 'a1', environment: 'production' })).toEqual([
      'agencies',
      'a1',
      'settings',
      'featureFlags_production'
    ]);
  });
});
