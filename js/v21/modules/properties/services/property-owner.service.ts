import { updateProperty, listProperties } from './properties.service.js';

export async function assignOwnerToProperty(propertyId: string, ownerId: string, options: { agencyId?: string; db?: unknown } = {}) {
  if (!propertyId) {
    return { ok: false, errors: ['propertyId requis'] };
  }

  if (!ownerId) {
    return { ok: false, errors: ['ownerId requis'] };
  }

  const result = await updateProperty(propertyId, { ownerId }, options);
  return { ok: true, property: result };
}

export async function listPropertiesByOwner(ownerId: string, options: { agencyId?: string; db?: unknown } = {}) {
  if (!ownerId) return [];

  const properties = await listProperties(options);
  return properties.filter((property: any) => property.ownerId === ownerId);
}
