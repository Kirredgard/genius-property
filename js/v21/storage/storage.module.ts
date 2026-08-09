import { uploadDocument, deleteDocument, buildStoragePath } from './storage.service.js';
import { registerLegacyGlobal } from '../legacy/legacy-registry.js';

export const GPV21Storage = {
  uploadDocument,
  deleteDocument,
  buildStoragePath
};

registerLegacyGlobal('GPV21Storage', GPV21Storage);
