import { evaluateAlerts, persistAlerts, readPersistedAlerts } from './alerting.service.js';

export function renderObservabilityDashboard(rootSelector = '#observability-root', metrics: any = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const alerts = evaluateAlerts(metrics);
  persistAlerts(alerts);

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Observabilité V21</h2>
      <p>${alerts.length} alerte(s) active(s)</p>

      ${alerts.length ? `
        <div class="v21-table">
          ${alerts.map((alert) => `
            <article class="v21-table-row">
              <strong>${escapeHtml(alert.label)}</strong>
              <span>${escapeHtml(alert.severity)}</span>
              <span>${alert.value} / ${alert.threshold}</span>
            </article>
          `).join('')}
        </div>
      ` : '<p>Aucune alerte active.</p>'}

      <details>
        <summary>Alertes persistées</summary>
        <pre>${escapeHtml(JSON.stringify(readPersistedAlerts(), null, 2))}</pre>
      </details>
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
