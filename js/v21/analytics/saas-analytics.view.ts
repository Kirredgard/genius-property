export function renderSaasMetricCards(cards: any[] = [], rootSelector = '#saas-analytics-root') {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-dashboard">
      <header class="v21-section-header">
        <h2>Analytics SaaS</h2>
        <p>Indicateurs business et usage plateforme.</p>
      </header>
      <div class="v21-kpi-grid">
        ${cards.map((card) => `
          <article class="v21-widget" data-metric="${escapeHtml(card.key || '')}">
            <span>${escapeHtml(card.label || '')}</span>
            <strong>${escapeHtml(String(card.value ?? ''))}</strong>
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
