import { exportRowsToCSV, downloadCSV, buildPrintableReport, openPrintableReport, normalizeOwnerReportsForExport, normalizeKpisForExport } from './exports/reporting-exporter.js';
import { buildOwnerReport, buildAllOwnerReports } from './services/owner-reporting.service.js';
import { renderOwnerReports } from './ui/owner-reporting.view.js';


import { registerLegacyGlobal } from '../../legacy/legacy-registry.js';

export function renderOwnerReporting,
          exportRowsToCSV,
          downloadCSV,
          buildPrintableReport,
          openPrintableReport,
          normalizeOwnerReportsForExport,
          normalizeKpisForExport(options = {}) {
  const reports = buildAllOwnerReports({
    owners: options.owners || window?.GPV21Owners?.state?.().owners || [],
    properties: options.properties || window?.GPV21Properties?.state?.().properties || [],
    payments: options.payments || window?.GPV21Payments?.state?.().payments || [],
    expenses: options.expenses || window?.GPV21Expenses?.state?.().expenses || []
  });

  renderOwnerReports(reports, options.rootSelector);
  return reports;
}

export const GPV21Reporting = {
  buildOwnerReport,
  buildAllOwnerReports,
  renderOwnerReporting,
          exportRowsToCSV,
          downloadCSV,
          buildPrintableReport,
          openPrintableReport,
          normalizeOwnerReportsForExport,
          normalizeKpisForExport
};

registerLegacyGlobal('GPV21Reporting', GPV21Reporting);
