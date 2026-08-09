import { REGIONS } from '../infrastructure/multi-region.service.js';
import { buildRecoveryPlan } from '../recovery/disaster-recovery.service.js';
import { buildFinancialReport } from '../finance/financial-reporting.service.js';

export function initScaleOpsPage(): void {
  const root = document.querySelector('#scale-root');
  if (!root) return;

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Scale & Enterprise Ops</h2>

      <h3>Regions</h3>
      <pre>${escapeHtml(JSON.stringify(REGIONS, null, 2))}</pre>

      <h3>Recovery Plan</h3>
      <pre>${escapeHtml(JSON.stringify(buildRecoveryPlan(), null, 2))}</pre>

      <h3>Financial Report</h3>
      <pre>${escapeHtml(JSON.stringify(buildFinancialReport({
        revenue: 1200000,
        costs: 300000
      }), null, 2))}</pre>
    </section>
  `;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScaleOpsPage, { once: true });
  } else {
    initScaleOpsPage();
  }
}
