import { describe, it, expect } from 'vitest';
import { getPreferredRegion } from '../../../js/v21/infrastructure/multi-region.service.js';

describe('multi region', () => {
  it('retourne region africa', () => {
    expect(getPreferredRegion('africa')).toBe('africa-south1');
  });
});
