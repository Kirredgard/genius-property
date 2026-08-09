import { uploadBusinessDocument, uploadAndSaveBusinessDocument, deleteBusinessDocument } from './services/document-storage.service.js';
import { saveDocumentMetadata, listDocumentMetadata, archiveDocumentMetadata } from './services/document-metadata.service.js';
import { renderDocumentsList, renderDocumentsEmptyState } from './ui/documents.list.js';
import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';

const state = {
  documents: [],
  initialized: false
};

export async function initDocumentsModule(options = {}) {
  state.initialized = true;

  try {
    state.documents = await listDocumentMetadata(options);

    if (!state.documents.length) {
      renderDocumentsEmptyState(options.rootSelector);
    } else {
      renderDocumentsList(state.documents, options.rootSelector);
    }
  } catch (error) {
    console.error('[V21][Documents] initialization failed:', error);
  }

  return {
    ready: state.initialized,
    count: state.documents.length
  };
}

export function getDocumentsState() {
  return { ...state, documents: [...state.documents] };
}

export const GPV21Documents = {
  init: initDocumentsModule,
  state: getDocumentsState,
  uploadBusinessDocument,
  uploadAndSaveBusinessDocument,
  deleteBusinessDocument,
  saveDocumentMetadata,
  listDocumentMetadata,
  archiveDocumentMetadata
};

registerLegacyGlobal('GPV21Documents', GPV21Documents);
