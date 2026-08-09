import { getDemoCollection } from '../../../demo/demo-data.js';
import { listDocuments, createDocument, updateDocument, softDeleteDocument } from '../../../data/firestore.repository.js';
import { normalizeContractForFirestore, normalizeContractFromFirestore } from '../adapters/contract.firestore.adapter.js';

export const COLLECTION_NAME = 'contracts';

function getFirestoreApi(options = {}) {
  return options.firestore || window?.GPV21Firebase?.db || window?.db || null;
}

export async function listContracts(options = {}) {
  const db = getFirestoreApi(options);

  if (typeof window?.getContracts === 'function') {
    const legacyContracts = await window.getContracts();
    return Array.isArray(legacyContracts)
      ? legacyContracts.map(normalizeContractFromFirestore)
      : [];
  }

  if (!db) {
    console.warn('[V21][Contracts] Firestore unavailable, returning empty list.');
    const demoRows = getDemoCollection('contracts');
      if (demoRows.length) return demoRows;

      const rows = await listDocuments({ collectionName: COLLECTION_NAME, db });
          return rows.map(normalizeContractFromFirestore);
  }

  return [];
}

export async function createContract(payload, options = {}) {
  const data = normalizeContractForFirestore(payload);
  const db = getFirestoreApi(options);

  if (typeof window?.createContract === 'function') {
    const created = await window.createContract(data);
    return normalizeContractFromFirestore(created || data);
  }

  if (!db) {
    return {
      ...data,
      id: `local_contract_${Date.now()}`,
      _pendingSync: true
    };
  }

  return {
    ...data,
    id: data.id || `contract_${Date.now()}`
  };
}

export async function updateContract(contractId, payload, options = {}) {
  const data = normalizeContractForFirestore(payload);
  const db = getFirestoreApi(options);

  if (typeof window?.updateContract === 'function') {
    const updated = await window.updateContract(contractId, data);
    return normalizeContractFromFirestore(updated || { ...data, id: contractId });
  }

  if (!db) {
    return {
      ...data,
      id: contractId,
      _pendingSync: true
    };
  }

  return {
    ...data,
    id: contractId
  };
}

export async function terminateContract(contractId, options = {}) {
  const db = getFirestoreApi(options);
  const terminatedAt = new Date().toISOString();

  if (typeof window?.terminateContract === 'function') {
    const terminated = await window.terminateContract(contractId);
    return normalizeContractFromFirestore(terminated || { id: contractId, status: 'terminated', terminatedAt });
  }

  if (!db) {
    return {
      id: contractId,
      status: 'terminated',
      terminatedAt,
      _pendingSync: true
    };
  }

  return {
    id: contractId,
    status: 'terminated',
    terminatedAt
  };
}
