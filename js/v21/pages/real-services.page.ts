import { validateRuntimeConfig } from '../config/config-validation.service.js';
import { runAutoHealthCheck } from '../health/auto-health-check.service.js';
import { getBillingApiBaseUrl } from '../billing/billing-api.client.js';
import { getEmailApiBaseUrl } from '../emails/email-api.client.js';

export async function initRealServicesPage(): Promise<void> {
  const root = document.querySelector('#real-services-root');
  if (!root) return;

  const config = validateRuntimeConfig();
  const health = await runAutoHealthCheck();

  const result = {
    checkedAt: new Date().toISOString(),
    config,
    health,
    endpoints: {
      billingApi: getBillingApiBaseUrl(),
      emailApi: getEmailApiBaseUrl()
    },
    nextManualTests: [
      'login.v21.html',
      'firestore-test.v21.html',
      'storage-test.v21.html',
      'upgrade.v21.html',
      'team.v21.html'
    ]
  };

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Real Services Check</h2>
      <p>Firebase réel + Stripe réel + Email réel.</p>
      <pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>
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
    document.addEventListener('DOMContentLoaded', initRealServicesPage, { once: true });
  } else {
    initRealServicesPage();
  }
}
