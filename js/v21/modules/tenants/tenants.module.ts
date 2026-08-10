import { requireUsageCapacity, countStateItems } from '../../billing/usage-guard.js';
import { requireWritePermission, requireAdminPermission, requireBillingPermission } from '../../permissions/service-permission-guard.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';
import { listTenants, createTenant, updateTenant, archiveTenant } from './services/tenants.service.js';
import { validateTenant } from './validators/tenant.validator.js';
import { renderTenantsList, renderTenantsEmptyState } from './ui/tenants.list.js';

const state = {
  tenants: [],
  initialized: false
};

export async function initTenantsModule(options = {}) {
  state.initialized = true;

  try {
    state.tenants = await listTenants(options);
    if (!state.tenants.length) {
      renderTenantsEmptyState(options.rootSelector);
    } else {
      renderTenantsList(state.tenants, options.rootSelector);
    }
  } catch (error) {
    console.error('[V21][Tenants] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.tenants.length
  };
}

export async function saveTenant(payload, options = {}) {
  if (!payload.id) {
    const usage = requireUsageCapacity(
      'tenants',
      countStateItems(state, 'tenants')
    );

    if (!usage.ok) return usage;
  }

  const permission = requireWritePermission();
  if (!permission.ok) return permission;

  const validation = validateTenant(payload);

  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const result = payload.id
    ? await updateTenant(payload.id, validation.value, options)
    : await createTenant(validation.value, options);

  return { ok: true, tenant: result };
}

export async function removeTenant(tenantId, options = {}) {
  const permission = requireAdminPermission();
  if (!permission.ok) return permission;

  if (!tenantId) {
    return { ok: false, errors: ['tenantId requis'] };
  }

  const result = await archiveTenant(tenantId, options);

  return { ok: true, tenant: result };
}

export function getTenantsState() {
  return { ...state, tenants: [...state.tenants] };
}

registerLegacyGlobal('GPV21Tenants', {
  init: initTenantsModule,
  save: saveTenant,
  archive: removeTenant,
  state: getTenantsState
});
