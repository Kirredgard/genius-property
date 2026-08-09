export interface OwnerPayoutExportRow {
  id?: string;
  ownerId: string;
  period: string;
  revenue?: number;
  expenses?: number;
  managementFees?: number;
  adjustments?: number;
  netAmount?: number;
  status?: string;
  paidAt?: string;
}

export function exportOwnerPayoutsToCSV(payouts: OwnerPayoutExportRow[] = []): string {
  const headers = [
    'ID',
    'Proprietaire',
    'Periode',
    'Revenus',
    'Depenses',
    'Frais gestion',
    'Ajustements',
    'Net a reverser',
    'Statut',
    'Date paiement'
  ];

  const rows = payouts.map((payout) => [
    payout.id || '',
    payout.ownerId || '',
    payout.period || '',
    payout.revenue || 0,
    payout.expenses || 0,
    payout.managementFees || 0,
    payout.adjustments || 0,
    payout.netAmount || 0,
    payout.status || 'pending',
    payout.paidAt || ''
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(','))
    .join('\n');
}

export function downloadOwnerPayoutsCSV(payouts: OwnerPayoutExportRow[] = [], filename = 'reversements-proprietaires.csv'): boolean {
  if (typeof document === 'undefined') return false;

  const csv = exportOwnerPayoutsToCSV(payouts);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
  return true;
}

export function buildOwnerPayoutsPrintableHTML(payouts: OwnerPayoutExportRow[] = []): string {
  const rows = payouts.map((payout) => `
    <tr>
      <td>${escapeHtml(payout.ownerId || '')}</td>
      <td>${escapeHtml(payout.period || '')}</td>
      <td>${formatCurrency(payout.revenue || 0)}</td>
      <td>${formatCurrency(payout.expenses || 0)}</td>
      <td>${formatCurrency(payout.managementFees || 0)}</td>
      <td>${formatCurrency(payout.netAmount || 0)}</td>
      <td>${escapeHtml(payout.status || 'pending')}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Reversements propriétaires</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Reversements propriétaires</h1>
        <table>
          <thead>
            <tr>
              <th>Propriétaire</th>
              <th>Période</th>
              <th>Revenus</th>
              <th>Dépenses</th>
              <th>Frais</th>
              <th>Net</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

export function openOwnerPayoutsPrintableView(payouts: OwnerPayoutExportRow[] = []): boolean {
  if (typeof window === 'undefined') return false;

  const popup = window.open('', '_blank');
  if (!popup) return false;

  popup.document.open();
  popup.document.write(buildOwnerPayoutsPrintableHTML(payouts));
  popup.document.close();
  return true;
}

function escapeCSV(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}
