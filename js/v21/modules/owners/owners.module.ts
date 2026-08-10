import { requireUsageCapacity, countStateItems } from '../../billing/usage-guard.js';
import { requireWritePermission, requireAdminPermission, requireBillingPermission } from '../../permissions/service-permission-guard.js';
import { listOwners, createOwner, updateOwner, archiveOwner } from './services/owners.service.js';
import { validateOwner } from './validators/owner.validator.js';
import { renderOwnersList, renderOwnersEmptyState } from './ui/owners.list.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';

const state = {
  owners: [],
  initialized: false
};

export async function initOwnersModule(options = {}) {
  state.initialized = true;

  try {
    state.owners = await listOwners(options);

    if (!state.owners.length) {
      renderOwnersEmptyState(options.rootSelector);
    } else {
      renderOwnersList(state.owners, options.rootSelector);
    }
  } catch (error) {
    console.error('[V21][Owners] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.owners.length
  };
}

export async function saveOwner(payload, options = {}) {
  if (!payload.id) {
    const usage = requireUsageCapacity(
      'owners',
      countStateItems(state, 'owners')
    );

    if (!usage.ok) return usage;
  }

  const permission = requireWritePermission();
  if (!permission.ok) return permission;

  const validation = validateOwner(payload);

  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const result = payload.id
    ? await updateOwner(payload.id, validation.value, options)
    : await createOwner(validation.value, options);

  return { ok: true, owner: result };
}

export async function removeOwner(ownerId, options = {}) {
  const permission = requireAdminPermission();
  if (!permission.ok) return permission;

  if (!ownerId) {
    return { ok: false, errors: ['ownerId requis'] };
  }

  const result = await archiveOwner(ownerId, options);

  return { ok: true, owner: result };
}

export function getOwnersState() {
  return { ...state, owners: [...state.owners] };
}

export const GPV21Owners = {
  init: initOwnersModule,
  save: saveOwner,
  archive: removeOwner,
  state: getOwnersState
};

registerLegacyGlobal('GPV21Owners', GPV21Owners);
