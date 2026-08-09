import { getDemoCollection } from '../../../demo/demo-data.js';
import { listDocuments, createDocument, updateDocument, softDeleteDocument } from '../../../data/firestore.repository.js';
import { normalizePropertyForFirestore, normalizePropertyFromFirestore } from '../adapters/property.firestore.adapter.js';

export const COLLECTION_NAME = 'properties';

function getFirestoreApi(options = {}) {
  return options.firestore || window?.GPV21Firebase?.db || window?.db || null;
}

export async function listProperties(options = {}) {
  const db = getFirestoreApi(options);

  if (typeof window?.getProperties === 'function') {
    const legacyProperties = await window.getProperties();
    return Array.isArray(legacyProperties)
      ? legacyProperties.map(normalizePropertyFromFirestore)
      : [];
  }

  if (!db) {
    console.warn('[V21][Properties] Firestore unavailable, returning empty list.');
    const demoRows = getDemoCollection('properties');
      if (demoRows.length) return demoRows;

      const rows = await listDocuments({ collectionName: COLLECTION_NAME, db });
          return rows.map(normalizePropertyFromFirestore);
  }

  return [];
}

export async function createProperty(payload, options = {}) {
  const data = normalizePropertyForFirestore(payload);
  const db = getFirestoreApi(options);

  if (typeof window?.createProperty === 'function') {
    const created = await window.createProperty(data);
    return normalizePropertyFromFirestore(created || data);
  }

  if (!db) {
    return {
      ...data,
      id: `local_property_${Date.now()}`,
      _pendingSync: true
    };
  }

  return {
    ...data,
    id: data.id || `property_${Date.now()}`
  };
}

export async function updateProperty(propertyId, payload, options = {}) {
  const data = normalizePropertyForFirestore(payload);
  const db = getFirestoreApi(options);

  if (typeof window?.updateProperty === 'function') {
    const updated = await window.updateProperty(propertyId, data);
    return normalizePropertyFromFirestore(updated || { ...data, id: propertyId });
  }

  if (!db) {
    return {
      ...data,
      id: propertyId,
      _pendingSync: true
    };
  }

  return {
    ...data,
    id: propertyId
  };
}

export async function archiveProperty(propertyId, options = {}) {
  const db = getFirestoreApi(options);

  if (typeof window?.archiveProperty === 'function') {
    const archived = await window.archiveProperty(propertyId);
    return normalizePropertyFromFirestore(archived || { id: propertyId, archived: true });
  }

  if (!db) {
    return {
      id: propertyId,
      archived: true,
      _pendingSync: true
    };
  }

  return {
    id: propertyId,
    archived: true
  };
}
