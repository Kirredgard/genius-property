function getRoot(rootSelector = '#owner-payouts-root'): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderOwnerPayoutsList(payouts: any[] = [], rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  if (!payouts.length) {
    root.innerHTML = `
      <section class="v21-empty-state">
        <h2>Aucun reversement</h2>
        <p>Les reversements propriétaires apparaîtront ici.</p>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="v21-owner-payouts">
      <header class="v21-section-header">
        <h2>Reversements propriétaires</h2>
        <p>${payouts.length} reversement(s)</p>
      </header>
      <div class="v21-table">
        ${payouts.map(renderPayoutRow).join('')}
      </div>
    </section>
  `;
}

function renderPayoutRow(payout: any): string {
  return `
    <article class="v21-table-row" data-payout-id="${escapeHtml(payout.id || '')}">
      <strong>${escapeHtml(payout.ownerId || 'Propriétaire')}</strong>
      <span>${escapeHtml(payout.period || '-')}</span>
      <span>${formatCurrency(payout.netAmount)}</span>
      <span>${escapeHtml(payout.status || 'pending')}</span>
    </article>
  `;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
