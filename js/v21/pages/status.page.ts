import { buildSystemStatus } from '../status/status.service.js';

export function initStatusPage(): void {
  const root = document.querySelector('#status-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo') === '1';

  const status = buildSystemStatus(demo ? [
    { key: 'billing', label: 'Billing API', status: 'degraded', details: 'Webhook test en cours' }
  ] : []);

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Statut global : ${escapeHtml(status.overall)}</h2>
      <p>Dernière mise à jour : ${escapeHtml(status.updatedAt)}</p>
      <div class="v21-table">
        ${status.items.map((item) => `
          <article class="v21-table-row">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.status)}</span>
            <span>${escapeHtml(item.details || '')}</span>
          </article>
        `).join('')}
      </div>
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
    document.addEventListener('DOMContentLoaded', initStatusPage, { once: true });
  } else {
    initStatusPage();
  }
}
