import { requireUsageCapacity, countStateItems } from '../../billing/usage-guard.js';
import { requireWritePermission, requireAdminPermission, requireBillingPermission } from '../../permissions/service-permission-guard.js';
import { assignOwnerToProperty, listPropertiesByOwner } from './services/property-owner.service.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';
import { listProperties, createProperty, updateProperty, archiveProperty } from './services/properties.service.js';
import { validateProperty } from './validators/property.validator.js';
import { renderPropertiesList, renderPropertiesEmptyState } from './ui/properties.list.js';

const state = {
  properties: [],
  initialized: false
};

export async function initPropertiesModule(options = {}) {
  state.initialized = true;

  try {
    state.properties = await listProperties(options);

    if (!state.properties.length) {
      renderPropertiesEmptyState(options.rootSelector);
    } else {
      renderPropertiesList(state.properties, options.rootSelector);
    }
  } catch (error) {
    console.error('[V21][Properties] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.properties.length
  };
}

export async function saveProperty(payload, options = {

if (!payload.id) {
  const usage = requireUsageCapacity('properties', countStateItems(state, 'properties'));
  if (!usage.ok) return usage;
}

      const permission = requireWritePermission();
      if (!permission.ok) return permission;
}) {
  const validation = validateProperty(payload);

  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const result = payload.id
    ? await updateProperty(payload.id, validation.value, options)
    : await createProperty(validation.value, options);

  return { ok: true, property: result };
}

export async function removeProperty(propertyId, options = {
      const permission = requireAdminPermission();
      if (!permission.ok) return permission;
}) {
  if (!propertyId) {
    return { ok: false, errors: ['propertyId requis'] };
  }

  const result = await archiveProperty(propertyId, options);
  return { ok: true, property: result };
}

export function getPropertiesState() {
  return { ...state, properties: [...state.properties] };
}


registerLegacyGlobal('GPV21Properties', { init: initPropertiesModule, save: saveProperty, archive: removeProperty, state: getPropertiesState });
