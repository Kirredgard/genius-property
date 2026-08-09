import { buildExecutiveMetrics } from '../executive/executive-dashboard.service.js';
import { buildQuickStartChecklist } from '../onboarding/quick-start.service.js';
import { runAutoHealthCheck } from '../health/auto-health-check.service.js';

export async function initGoLivePage(): Promise<void> {
  const root = document.querySelector('#go-live-root');
  if (!root) return;

  const health = await runAutoHealthCheck();

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Go Live Final</h2>

      <h3>Executive Metrics</h3>
      <pre>${escapeHtml(JSON.stringify(buildExecutiveMetrics(), null, 2))}</pre>

      <h3>Quick Start</h3>
      <pre>${escapeHtml(JSON.stringify(buildQuickStartChecklist(), null, 2))}</pre>

      <h3>Health Check</h3>
      <pre>${escapeHtml(JSON.stringify(health, null, 2))}</pre>
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
    document.addEventListener('DOMContentLoaded', initGoLivePage, { once: true });
  } else {
    initGoLivePage();
  }
}
