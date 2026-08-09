import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import { getFirebaseClient } from '../firebase/firebase-client.js';

export interface FirestoreRepositoryOptions {
  db?: Firestore | unknown;
  agencyId?: string;
  collectionName: string;
}

export interface RepositoryDocument {
  id?: string;
  [key: string]: unknown;
}

export function resolveFirestore(options: Partial<FirestoreRepositoryOptions> = {}): Firestore | null {
  if (options.db) return options.db as Firestore;

  const client = getFirebaseClient();
  return client?.db || null;
}

export function buildAgencyCollectionPath(agencyId: string | undefined, collectionName: string): string {
  if (!collectionName) {
    throw new Error('[V21][FirestoreRepository] collectionName requis');
  }

  if (!agencyId) return collectionName;
  return `agencies/${agencyId}/${collectionName}`;
}

export async function listDocuments<T extends RepositoryDocument>(
  options: FirestoreRepositoryOptions
): Promise<T[]> {
  const db = resolveFirestore(options);

  if (!db) {
    console.warn(`[V21][FirestoreRepository] Firestore indisponible pour ${options.collectionName}.`);
    return [];
  }

  const path = buildAgencyCollectionPath(options.agencyId, options.collectionName);
  const snapshot = await getDocs(collection(db, path));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  })) as T[];
}

export async function createDocument<T extends RepositoryDocument>(
  payload: T,
  options: FirestoreRepositoryOptions
): Promise<T> {
  const db = resolveFirestore(options);

  if (!db) {
    return {
      ...payload,
      id: payload.id || `local_${options.collectionName}_${Date.now()}`,
      _pendingSync: true
    } as T;
  }

  const path = buildAgencyCollectionPath(options.agencyId, options.collectionName);
  const ref = await addDoc(collection(db, path), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    ...payload,
    id: ref.id
  } as T;
}

export async function updateDocument<T extends RepositoryDocument>(
  documentId: string,
  payload: T,
  options: FirestoreRepositoryOptions
): Promise<T> {
  const db = resolveFirestore(options);

  if (!db) {
    return {
      ...payload,
      id: documentId,
      _pendingSync: true
    } as T;
  }

  const path = buildAgencyCollectionPath(options.agencyId, options.collectionName);
  await updateDoc(doc(db, path, documentId), {
    ...payload,
    updatedAt: serverTimestamp()
  });

  return {
    ...payload,
    id: documentId
  } as T;
}

export async function softDeleteDocument(
  documentId: string,
  options: FirestoreRepositoryOptions
): Promise<RepositoryDocument> {
  const db = resolveFirestore(options);
  const deletedAt = new Date().toISOString();

  if (!db) {
    return {
      id: documentId,
      archived: true,
      deletedAt,
      _pendingSync: true
    };
  }

  const path = buildAgencyCollectionPath(options.agencyId, options.collectionName);
  await updateDoc(doc(db, path, documentId), {
    archived: true,
    deletedAt,
    updatedAt: serverTimestamp()
  });

  return {
    id: documentId,
    archived: true,
    deletedAt
  };
}
