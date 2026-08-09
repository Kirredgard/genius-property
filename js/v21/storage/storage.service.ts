import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage
} from 'firebase/storage';
import { getFirebaseClient } from '../firebase/firebase-client.js';
import { getCurrentAgencyId } from '../data/agency-context.js';

export interface UploadDocumentOptions {
  agencyId?: string;
  folder?: string;
  entityId?: string;
  filename?: string;
  contentType?: string;
}

export interface UploadedDocument {
  path: string;
  url: string;
  filename: string;
  contentType?: string;
  size?: number;
}

export function resolveStorage(): FirebaseStorage | null {
  const client = getFirebaseClient();
  return client?.storage || null;
}

export function buildStoragePath(options: UploadDocumentOptions = {}): string {
  const agencyId = getCurrentAgencyId(options.agencyId);
  const folder = sanitizeSegment(options.folder || 'documents');
  const entityId = sanitizeSegment(options.entityId || 'general');
  const filename = sanitizeFilename(options.filename || `document-${Date.now()}`);

  if (!agencyId) {
    return `${folder}/${entityId}/${filename}`;
  }

  return `agencies/${sanitizeSegment(agencyId)}/${folder}/${entityId}/${filename}`;
}

export async function uploadDocument(file: Blob | File, options: UploadDocumentOptions = {}): Promise<UploadedDocument> {
  const storage = resolveStorage();
  const filename = options.filename || ('name' in file ? file.name : `document-${Date.now()}`);
  const path = buildStoragePath({ ...options, filename });

  if (!storage) {
    return {
      path,
      url: '',
      filename,
      contentType: options.contentType || file.type,
      size: file.size
    };
  }

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: options.contentType || file.type
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    path,
    url,
    filename,
    contentType: options.contentType || file.type,
    size: file.size
  };
}

export async function deleteDocument(path: string): Promise<boolean> {
  const storage = resolveStorage();

  if (!storage || !path) {
    return false;
  }

  await deleteObject(ref(storage, path));
  return true;
}

export function sanitizeSegment(value: string): string {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function sanitizeFilename(value: string): string {
  const safe = String(value || 'document')
    .trim()
    .replace(/[\\/]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');

  return safe || `document-${Date.now()}`;
}
