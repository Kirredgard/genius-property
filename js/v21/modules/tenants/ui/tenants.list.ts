import { createActionButton } from '../../../actions/list-actions.js';
function getRoot(rootSelector = '#tenants-root') {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderTenantsList(tenants = [], rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-tenants">
      <header class="v21-section-header">
        <h2>Locataires</h2>
        <p>${tenants.length} locataire(s)</p>
      </header>
      <div class="v21-table">
        ${tenants.map(renderTenantRow).join('')}
      </div>
    </section>
  `;
}

export function renderTenantsEmptyState(rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-empty-state">
      <h2>Aucun locataire</h2>
      <p>Ajoutez votre premier locataire pour démarrer la gestion locative.</p>
    </section>
  `;
}

function renderTenantRow(tenant) {
  const fullName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
  return `
    <article class="v21-table-row" data-tenant-id="${escapeHtml(tenant.id)}">
      <strong>${escapeHtml(fullName || 'Locataire sans nom')}</strong>
      <span>${escapeHtml(tenant.phone || tenant.email || '-')}</span>
      <span>${formatRent(tenant.monthlyRent)}</span>
      <span>${escapeHtml(tenant.status || 'active')}</span>
                  <a class="v21-action-button" href="./tenant-detail.v21.html?id=${tenant.id || ''}">Modifier</a>
              ${createActionButton(tenant.id || '', 'Archiver')}
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
