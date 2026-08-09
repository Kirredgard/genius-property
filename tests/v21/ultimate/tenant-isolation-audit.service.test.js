import { describe, it, expect } from 'vitest';
import { auditTenantIsolation } from '../../../js/v21/tenant/tenant-isolation-audit.service.js';

describe('tenant isolation audit', () => {
  it('détecte missing agencyId', () => {
    const result = auditTenantIsolation([{ id: 1 }]);
    expect(result.ok).toBe(false);
  });
});
