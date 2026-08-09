export const PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['properties:*', 'tenants:*', 'contracts:*'],
  MANAGER: ['properties:read', 'tenants:read'],
  VIEWER: ['properties:read']
};

export function hasPermission(role = 'VIEWER', permission = '') {
  const permissions = (PERMISSIONS as any)[role] || [];

  return permissions.includes('*')
    || permissions.includes(permission);
}
