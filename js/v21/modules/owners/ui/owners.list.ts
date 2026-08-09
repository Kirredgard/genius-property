import { createActionButton } from '../../../actions/list-actions.js';
function getRoot(rootSelector = '#owners-root'): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderOwnersList(owners: any[] = [], rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-owners">
      <header class="v21-section-header">
        <h2>Propriétaires</h2>
        <p>${owners.length} propriétaire(s)</p>
      </header>
      <div class="v21-table">
        ${owners.map(renderOwnerRow).join('')}
      </div>
    </section>
  `;
}

export function renderOwnersEmptyState(rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-empty-state">
      <h2>Aucun propriétaire</h2>
      <p>Ajoutez un propriétaire pour relier vos biens à leur gestion.</p>
    </section>
  `;
}

function renderOwnerRow(owner: any): string {
  const name = `${owner.firstName || ''} ${owner.lastName || ''}`.trim();

  return `
    <article class="v21-table-row" data-owner-id="${escapeHtml(owner.id || '')}">
      <strong>${escapeHtml(name || 'Propriétaire')}</strong>
      <span>${escapeHtml(owner.phone || owner.email || '-')}</span>
      <span>${escapeHtml(owner.address || '-')}</span>
      <span>${escapeHtml(owner.status || 'active')}</span>
                  <a class="v21-action-button" href="./owner-detail.v21.html?id=${owner.id || ''}">Modifier</a>
              ${createActionButton(owner.id || '', 'Archiver')}
            </article>
  `;
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
