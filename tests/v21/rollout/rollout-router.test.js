import { describe, it, expect, beforeEach } from 'vitest';
import { resolveRolloutUrl } from '../../../js/v21/rollout/rollout-router.js';
import { setFeatureFlag } from '../../../js/v21/rollout/feature-flags.js';

describe('rollout router', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('résout une route V21 active', () => {
    expect(resolveRolloutUrl('dashboard')).toBe('./dashboard.v21.html');
  });

  it('résout une route legacy si désactivée', () => {
    setFeatureFlag('v21Dashboard', false);
    expect(resolveRolloutUrl('dashboard')).toBe('./index.html');
  });
});
