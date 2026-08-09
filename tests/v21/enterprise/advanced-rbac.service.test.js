import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../../js/v21/rbac/advanced-rbac.service.js';

describe('advanced rbac', () => {
  it('autorise admin properties:*', () => {
    expect(hasPermission('ADMIN', 'properties:*')).toBe(true);
  });
});
