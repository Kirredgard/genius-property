import { getDemoCollection } from '../../../demo/demo-data.js';
import { listDocuments, createDocument, updateDocument, softDeleteDocument } from '../../../data/firestore.repository.js';
import { normalizeTenantForFirestore, normalizeTenantFromFirestore } from '../adapters/tenant.firestore.adapter.js';

const COLLECTION_NAME = 'tenants';

function getFirestoreApi(options = {}) {
  const api = options.firestore || window?.GPV21Firebase?.db || window?.db || null;
  return api;
}

export async function listTenants(options = {}) {
  const db = getFirestoreApi(options);

  if (!db) {
    console.warn('[V21][Tenants] Firestore unavailable, returning empty list.');
    const demoRows = getDemoCollection('tenants');
      if (demoRows.length) return demoRows;

      const rows = await listDocuments({ collectionName: COLLECTION_NAME, db });
          return rows.map(normalizeTenantFromFirestore);
  }

  // Compatible avec le mode legacy si une fonction globale existe déjà.
  if (typeof window?.getTenants === 'function') {
    const legacyTenants = await window.getTenants();
    return Array.isArray(legacyTenants) ? legacyTenants.map(normalizeTenantFromFirestore) : [];
  }

  // Placeholder sûr : à brancher sur SDK Firestore modulaire selon la structure finale agencyId.
  return [];
}

export async function createTenant(payload, options = {}) {
  const data = normalizeTenantForFirestore(payload);
  const db = getFirestoreApi(options);

  if (typeof window?.createTenant === 'function') {
    const created = await window.createTenant(data);
    return normalizeTenantFromFirestore(created || data);
  }

  if (!db) {
    return {
      ...data,
      id: `local_${Date.now()}`,
      _pendingSync: true
    };
  }

  return {
    ...data,
    id: data.id || `tenant_${Date.now()}`
  };
}

export async function updateTenant(tenantId, payload, options = {}) {
  const data = normalizeTenantForFirestore(payload);
  const db = getFirestoreApi(options);

  if (typeof window?.updateTenant === 'function') {
    const updated = await window.updateTenant(tenantId, data);
    return normalizeTenantFromFirestore(updated || { ...data, id: tenantId });
  }

  if (!db) {
    return {
      ...data,
      id: tenantId,
      _pendingSync: true
    };
  }

  return {
    ...data,
    id: tenantId
  };
}

export async function archiveTenant(tenantId, options = {}) {
  const db = getFirestoreApi(options);

  if (typeof window?.archiveTenant === 'function') {
    const archived = await window.archiveTenant(tenantId);
    return normalizeTenantFromFirestore(archived || { id: tenantId, archived: true });
  }

  if (!db) {
    return {
      id: tenantId,
      archived: true,
      _pendingSync: true
    };
  }

  return {
    id: tenantId,
    archived: true
  };
}

export { COLLECTION_NAME };
