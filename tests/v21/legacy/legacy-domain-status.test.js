import { describe, it, expect } from 'vitest';
import { listMigratedDomains, getLegacyDomainStatus } from '../../../js/v21/legacy/legacy-domain-status.js';

describe('legacy domain status', () => {
  it('liste les domaines déjà prêts en V21', () => {
    const domains = listMigratedDomains();

    expect(domains).toContain('dashboard');
    expect(domains).toContain('payments');
    expect(domains).toContain('tenants');
    expect(domains).toContain('properties');
    expect(domains).toContain('contracts');
    expect(domains).toContain('notifications');
  });

  it('retourne unknown pour un domaine non déclaré', () => {
    expect(getLegacyDomainStatus('unknown-domain')).toBe('unknown');
  });
});
