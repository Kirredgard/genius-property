import { describe, it, expect } from 'vitest';
import { exportRowsToCSV, buildPrintableReport, normalizeOwnerReportsForExport, normalizeKpisForExport } from '../../../js/v21/modules/reporting/exports/reporting-exporter.js';

describe('reporting exporter', () => {
  it('exporte des lignes en CSV', () => {
    const csv = exportRowsToCSV([{ name: 'Awa', amount: 1000 }]);
    expect(csv).toContain('name,amount');
    expect(csv).toContain('Awa,1000');
  });

  it('génère un rapport imprimable', () => {
    const html = buildPrintableReport([{ name: 'Awa' }], { title: 'Test' });
    expect(html).toContain('<table>');
    expect(html).toContain('Test');
  });

  it('normalise les rapports propriétaires', () => {
    const rows = normalizeOwnerReportsForExport([{
      ownerId: 'o1',
      owner: { firstName: 'Awa', lastName: 'Diop' },
      totalRevenue: 100,
      totalExpenses: 20,
      netBalance: 80
    }]);

    expect(rows[0].ownerName).toBe('Awa Diop');
    expect(rows[0].netBalance).toBe(80);
  });

  it('normalise les KPI', () => {
    const rows = normalizeKpisForExport({ revenue: 1000 });
    expect(rows[0]).toEqual({ indicator: 'revenue', value: 1000 });
  });
});
