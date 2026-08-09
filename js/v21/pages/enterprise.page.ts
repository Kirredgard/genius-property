import { listMarketplaceIntegrations } from '../integrations/marketplace.service.js';
import { buildRetentionPolicy } from '../gdpr/data-retention.service.js';

export function initEnterprisePage(): void {
  const root = document.querySelector('#enterprise-root');
  if (!root) return;

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Enterprise Features</h2>

      <h3>Integrations Marketplace</h3>
      <pre>${escapeHtml(JSON.stringify(listMarketplaceIntegrations(), null, 2))}</pre>

      <h3>Retention Policy</h3>
      <pre>${escapeHtml(JSON.stringify(buildRetentionPolicy(), null, 2))}</pre>
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
    document.addEventListener('DOMContentLoaded', initEnterprisePage, { once: true });
  } else {
    initEnterprisePage();
  }
}
