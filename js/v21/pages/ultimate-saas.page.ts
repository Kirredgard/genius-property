import { calculateUsageBilling } from '../billing/usage-billing.service.js';
import { buildAutoscalingReadiness } from '../autoscaling/autoscaling-readiness.service.js';
import { generateAiInsights } from '../ai/insights-analytics.service.js';

export function initUltimateSaasPage(): void {
  const root = document.querySelector('#ultimate-root');
  if (!root) return;

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Ultimate SaaS Platform</h2>

      <h3>Usage Billing</h3>
      <pre>${escapeHtml(JSON.stringify(calculateUsageBilling({
        properties: 120,
        users: 8,
        documentsGb: 40
      }), null, 2))}</pre>

      <h3>AI Insights</h3>
      <pre>${escapeHtml(JSON.stringify(generateAiInsights({
        activationRate: 32,
        failedPayments: 2
      }), null, 2))}</pre>

      <h3>Autoscaling</h3>
      <pre>${escapeHtml(JSON.stringify(buildAutoscalingReadiness(), null, 2))}</pre>
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
    document.addEventListener('DOMContentLoaded', initUltimateSaasPage, { once: true });
  } else {
    initUltimateSaasPage();
  }
}
