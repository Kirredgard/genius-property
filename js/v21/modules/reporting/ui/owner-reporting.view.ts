function getRoot(rootSelector = '#owner-reporting-root'): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderOwnerReports(reports: any[] = [], rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  if (!reports.length) {
    root.innerHTML = `
      <section class="v21-empty-state">
        <h2>Aucun reporting propriétaire</h2>
        <p>Ajoutez des propriétaires et des biens pour générer les rapports.</p>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="v21-owner-reporting">
      <header class="v21-section-header">
        <h2>Reporting propriétaires</h2>
        <p>${reports.length} rapport(s)</p>
      </header>
      <div class="v21-table">
        ${reports.map(renderReportRow).join('')}
      </div>
    </section>
  `;
}

function renderReportRow(report: any): string {
  const ownerName = report.owner
    ? `${report.owner.firstName || ''} ${report.owner.lastName || ''}`.trim()
    : report.ownerId;

  return `
    <article class="v21-table-row" data-owner-id="${escapeHtml(report.ownerId)}">
      <strong>${escapeHtml(ownerName || 'Propriétaire')}</strong>
      <span>${report.propertiesCount || 0} bien(s)</span>
      <span>Revenus: ${formatCurrency(report.totalRevenue)}</span>
      <span>Dépenses: ${formatCurrency(report.totalExpenses)}</span>
      <span>Net: ${formatCurrency(report.netBalance)}</span>
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
