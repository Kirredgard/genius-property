import { describe, it, expect, beforeEach } from 'vitest';
import { requireWritePermission, requireAdminPermission, requireBillingPermission } from '../../../js/v21/permissions/service-permission-guard.js';

describe('service permission guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('refuse write pour viewer', () => {
    localStorage.setItem('gp:v21:role', 'viewer');
    expect(requireWritePermission().ok).toBe(false);
  });

  it('autorise write pour agent', () => {
    localStorage.setItem('gp:v21:role', 'agent');
    expect(requireWritePermission().ok).toBe(true);
  });

  it('autorise admin pour admin', () => {
    localStorage.setItem('gp:v21:role', 'admin');
    expect(requireAdminPermission().ok).toBe(true);
  });

  it('autorise billing pour owner', () => {
    localStorage.setItem('gp:v21:role', 'owner');
    expect(requireBillingPermission().ok).toBe(true);
  });
});
