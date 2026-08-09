import { createActionButton } from '../../../actions/list-actions.js';
function getRoot(rootSelector = '#contracts-root') {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderContractsList(contracts = [], rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-contracts">
      <header class="v21-section-header">
        <h2>Contrats</h2>
        <p>${contracts.length} contrat(s)</p>
      </header>
      <div class="v21-table">
        ${contracts.map(renderContractRow).join('')}
      </div>
    </section>
  `;
}

export function renderContractsEmptyState(rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-empty-state">
      <h2>Aucun contrat</h2>
      <p>Créez un contrat pour relier un locataire à un bien.</p>
    </section>
  `;
}

function renderContractRow(contract) {
  return `
    <article class="v21-table-row" data-contract-id="${escapeHtml(contract.id)}">
      <strong>${escapeHtml(contract.tenantId || 'Locataire')}</strong>
      <span>${escapeHtml(contract.propertyId || 'Bien')}</span>
      <span>${formatRent(contract.monthlyRent)}</span>
      <span>${escapeHtml(contract.status || 'active')}</span>
                  <a class="v21-action-button" href="./contract-detail.v21.html?id=${contract.id || ''}">Modifier</a>
              ${createActionButton(contract.id || '', 'Terminer')}
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
