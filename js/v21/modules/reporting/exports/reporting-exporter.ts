export interface ReportingExportOptions {
  title?: string;
  filename?: string;
}

export function exportRowsToCSV(rows: Record<string, unknown>[] = [], headers?: string[]): string {
  const finalHeaders = headers?.length ? headers : inferHeaders(rows);

  const body = rows.map((row) =>
    finalHeaders.map((header) => escapeCSV(row[header] ?? '')).join(',')
  );

  return [finalHeaders.map(escapeCSV).join(','), ...body].join('\n');
}

export function downloadCSV(rows: Record<string, unknown>[] = [], options: ReportingExportOptions = {}): boolean {
  if (typeof document === 'undefined') return false;

  const csv = exportRowsToCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = options.filename || 'reporting-export.csv';
  link.click();

  URL.revokeObjectURL(url);
  return true;
}

export function buildPrintableReport(rows: Record<string, unknown>[] = [], options: ReportingExportOptions = {}): string {
  const headers = inferHeaders(rows);
  const title = options.title || 'Rapport Genius Property';

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>${headers.map((header) => `<td>${escapeHtml(formatValue(row[header]))}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export function openPrintableReport(rows: Record<string, unknown>[] = [], options: ReportingExportOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  const popup = window.open('', '_blank');
  if (!popup) return false;

  popup.document.open();
  popup.document.write(buildPrintableReport(rows, options));
  popup.document.close();

  return true;
}

export function normalizeOwnerReportsForExport(reports: any[] = []): Record<string, unknown>[] {
  return reports.map((report) => ({
    ownerId: report.ownerId,
    ownerName: report.owner
      ? `${report.owner.firstName || ''} ${report.owner.lastName || ''}`.trim()
      : report.ownerId,
    propertiesCount: report.propertiesCount || 0,
    totalRevenue: report.totalRevenue || 0,
    totalExpenses: report.totalExpenses || 0,
    netBalance: report.netBalance || 0
  }));
}

export function normalizeKpisForExport(kpis: Record<string, unknown> = {}): Record<string, unknown>[] {
  return Object.entries(kpis).map(([key, value]) => ({
    indicator: key,
    value
  }));
}

function inferHeaders(rows: Record<string, unknown>[] = []): string[] {
  const set = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
  return Array.from(set);
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

function formatValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return String(value ?? '');
}
