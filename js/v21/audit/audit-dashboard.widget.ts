import { readLocalAuditLogs } from './audit-log.service.js';

export function renderAuditDashboard(rootSelector = '#audit-dashboard-root') {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const logs = readLocalAuditLogs().slice(0, 20);

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Audit Logs</h2>

      ${logs.length === 0 ? '<p>Aucun log.</p>' : `
        <div class="v21-table-wrapper">
          <table class="v21-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Type</th>
                <th>Niveau</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map((log) => `
                <tr>
                  <td>${escapeHtml(log.action || '')}</td>
                  <td>${escapeHtml(log.entityType || '')}</td>
                  <td>${escapeHtml(log.level || '')}</td>
                  <td>${escapeHtml(log.createdAt || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
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
