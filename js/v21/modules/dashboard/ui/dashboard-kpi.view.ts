function getRoot(rootSelector = '#dashboard-root'): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderDashboardKpis(cards: any[] = [], rootSelector?: string): void {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-dashboard">
      <header class="v21-section-header">
        <h2>Dashboard KPI</h2>
        <p>Vue consolidée de la gestion immobilière</p>
      </header>
      <div class="v21-kpi-grid">
        ${cards.map(renderCard).join('')}
      </div>
    </section>
  `;
}

function renderCard(card: any): string {
  return `
    <article class="v21-widget" data-kpi="${escapeHtml(card.key || '')}">
      <span>${escapeHtml(card.label || '')}</span>
      <strong>${escapeHtml(String(card.value ?? ''))}</strong>
    </article>
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
