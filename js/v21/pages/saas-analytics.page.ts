import { renderAuditDashboard } from '../audit/audit-dashboard.widget.js';
import { calculateSaasMetrics, buildSaasMetricCards } from '../analytics/saas-metrics.service.js';
import { listAgencySubscriptions, listAgencyUsage } from '../analytics/saas-analytics.repository.js';
import { renderSaasMetricCards } from '../analytics/saas-analytics.view.js';

const demoSubscriptions = [
  { agencyId: 'agency-1', plan: 'pro', status: 'active' },
  { agencyId: 'agency-2', plan: 'starter', status: 'active' },
  { agencyId: 'agency-3', plan: 'free', status: 'trialing' }
];

const demoUsage = [
  { agencyId: 'agency-1', properties: 30, tenants: 45, documentsMb: 1200, users: 5, firebaseCostEstimate: 9000 },
  { agencyId: 'agency-2', properties: 12, tenants: 18, documentsMb: 300, users: 2, firebaseCostEstimate: 2500 },
  { agencyId: 'agency-3', properties: 2, tenants: 3, documentsMb: 20, users: 1, firebaseCostEstimate: 200 }
];

export async function initSaasAnalyticsPage(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo') === '1';

  const subscriptions = demo ? demoSubscriptions : await listAgencySubscriptions().catch(() => []);
  const usage = demo ? demoUsage : await listAgencyUsage().catch(() => []);

  const metrics = calculateSaasMetrics(subscriptions, usage);
  renderSaasMetricCards(buildSaasMetricCards(metrics), '#saas-analytics-root');
      renderAuditDashboard('#audit-dashboard-root');

  const raw = document.querySelector('#saas-analytics-json');
  if (raw) raw.textContent = JSON.stringify(metrics, null, 2);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSaasAnalyticsPage, { once: true });
  } else {
    initSaasAnalyticsPage();
  }
}
