import { describe, it, expect } from 'vitest';
import { canRead, canWrite, canAdmin, canManageBilling, roleLevel } from '../../../js/v21/profile/permissions.js';

describe('permissions', () => {
  it('calcule les niveaux de rôle', () => {
    expect(roleLevel('viewer')).toBe(1);
    expect(roleLevel('admin')).toBe(3);
  });

  it('valide les permissions', () => {
    expect(canRead('viewer')).toBe(true);
    expect(canWrite('viewer')).toBe(false);
    expect(canWrite('agent')).toBe(true);
    expect(canAdmin('admin')).toBe(true);
    expect(canManageBilling('owner')).toBe(true);
  });
});
