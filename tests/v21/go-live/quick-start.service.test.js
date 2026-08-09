import { describe, it, expect } from 'vitest';
import { buildQuickStartChecklist } from '../../../js/v21/onboarding/quick-start.service.js';

describe('quick start', () => {
  it('retourne checklist', () => {
    expect(buildQuickStartChecklist().length).toBeGreaterThan(0);
  });
});
