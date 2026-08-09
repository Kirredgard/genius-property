export interface DocumentListItem {
  id?: string;
  filename: string;
  documentType: string;
  entityId: string;
  url?: string;
  path?: string;
  uploadedAt?: string;
  size?: number;
}

function getRoot(rootSelector = '#documents-root'): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderDocumentsList(documents: DocumentListItem[] = [], rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-documents">
      <header class="v21-section-header">
        <h2>Documents</h2>
        <p>${documents.length} document(s)</p>
      </header>
      <div class="v21-table">
        ${documents.map(renderDocumentRow).join('')}
      </div>
    </section>
  `;
}

export function renderDocumentsEmptyState(rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-empty-state">
      <h2>Aucun document</h2>
      <p>Les quittances, baux et pièces jointes apparaîtront ici.</p>
    </section>
  `;
}

function renderDocumentRow(item: DocumentListItem): string {
  const link = item.url
    ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Ouvrir</a>`
    : `<span>Non synchronisé</span>`;

  return `
    <article class="v21-table-row" data-document-id="${escapeHtml(item.id || '')}">
      <strong>${escapeHtml(item.filename || 'Document')}</strong>
      <span>${escapeHtml(item.documentType || 'document')}</span>
      <span>${formatSize(item.size || 0)}</span>
      <span>${escapeHtml(formatDate(item.uploadedAt))}</span>
      ${link}
    </article>
  `;
}

function formatSize(size: number): string {
  if (!size) return '-';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
