import { createActionButton } from '../../../actions/list-actions.js';
function getRoot(rootSelector = '#properties-root') {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderPropertiesList(properties = [], rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-properties">
      <header class="v21-section-header">
        <h2>Biens immobiliers</h2>
        <p>${properties.length} bien(s) · propriétaire lié si disponible</p>
      </header>
      <div class="v21-table">
        ${properties.map(renderPropertyRow).join('')}
      </div>
    </section>
  `;
}

export function renderPropertiesEmptyState(rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-empty-state">
      <h2>Aucun bien</h2>
      <p>Ajoutez votre premier bien immobilier pour démarrer.</p>
    </section>
  `;
}

function renderPropertyRow(property) {
  return `
    <article class="v21-table-row" data-property-id="${escapeHtml(property.id)}">
      <strong>${escapeHtml(property.title || 'Bien sans nom')}</strong>
      <span>${escapeHtml(property.address || '-')}</span>
      <span>${formatRent(property.monthlyRent)}</span>
      <span>${escapeHtml(property.ownerId || '-')}</span>
              <span>${escapeHtml(property.status || 'available')}</span>
                  <a class="v21-action-button" href="./property-detail.v21.html?id=${property.id || ''}">Modifier</a>
              ${createActionButton(property.id || '', 'Archiver')}
            </article>
  `;
}

function formatRent(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
