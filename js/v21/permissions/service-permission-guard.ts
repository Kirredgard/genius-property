import { buildUserAgencyContext } from '../context/user-agency-context.js';
import { canWrite, canAdmin, canManageBilling } from '../profile/permissions.js';

export type ServicePermission = 'write' | 'admin' | 'billing';

export interface GuardResult {
  ok: boolean;
  errors?: string[];
}

export function assertServicePermission(permission: ServicePermission): GuardResult {
  const context = buildUserAgencyContext();

  const allowed =
    permission === 'write'
      ? canWrite(context.role)
      : permission === 'admin'
        ? canAdmin(context.role)
        : canManageBilling(context.role);

  if (allowed) {
    return { ok: true };
  }

  return {
    ok: false,
    errors: [`Permission ${permission} requise pour le rôle ${context.role || 'viewer'}`]
  };
}

export function requireWritePermission(): GuardResult {
  return assertServicePermission('write');
}

export function requireAdminPermission(): GuardResult {
  return assertServicePermission('admin');
}

export function requireBillingPermission(): GuardResult {
  return assertServicePermission('billing');
}
