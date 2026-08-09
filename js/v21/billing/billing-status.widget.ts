import { getLocalSubscription } from './subscription.service.js';
import { getPlanLimits } from './plans.js';

export function renderBillingStatus(rootSelector = '#billing-status-root'): void {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const subscription = getLocalSubscription();
  const limits = subscription.limits || getPlanLimits(subscription.plan || 'free');

  root.innerHTML = `
    <section class="v21-widget">
      <span>Plan actuel</span>
      <strong>${escapeHtml(String(subscription.plan || 'free'))}</strong>
      <p>Statut: ${escapeHtml(String(subscription.status || 'trialing'))}</p>
      <details>
        <summary>Limites</summary>
        <pre>${escapeHtml(JSON.stringify(limits, null, 2))}</pre>
      </details>
    </section>
  `;
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
