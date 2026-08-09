import { renderObservabilityDashboard } from '../observability/observability-dashboard.js';
import { readLocalAuditLogs } from '../audit/audit-log.service.js';
import { getErrorLogs } from '../monitoring/error-monitor.js';

export function initObservabilityPage(): void {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo') === '1';

  const metrics = demo ? {
    runtimeErrors: 7,
    firebaseCostEstimate: 65000,
    failedPayments: 2,
    pastDueSubscriptions: 3,
    storageMb: 25000
  } : {
    runtimeErrors: getErrorLogs().length,
    firebaseCostEstimate: 0,
    failedPayments: readLocalAuditLogs().filter((log: any) => String(log.action || '').includes('payment_failed')).length,
    pastDueSubscriptions: 0,
    storageMb: 0
  };

  renderObservabilityDashboard('#observability-root', metrics);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObservabilityPage, { once: true });
  } else {
    initObservabilityPage();
  }
}
