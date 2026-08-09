import { describe, it, expect } from 'vitest';
import { buildSystemStatus } from '../../../js/v21/status/status.service.js';

describe('status service', () => {
  it('retourne operational par défaut', () => {
    expect(buildSystemStatus().overall).toBe('operational');
  });

  it('retourne degraded si un service est dégradé', () => {
    expect(buildSystemStatus([{ key: 'billing', label: 'Billing', status: 'degraded' }]).overall).toBe('degraded');
  });
});
