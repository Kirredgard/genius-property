export function initDashboardWidgets(stats = {}, { root = document } = {}) {
  const widgetContainer = root.querySelector('#dashboard-widgets');
  if (!widgetContainer) return false;

  const items = [
    ['Biens', stats.properties || 0],
    ['Locataires', stats.tenants || 0],
    ['Paiements', stats.payments || 0],
    ['Contrats', stats.contracts || 0],
    ['Dépenses', stats.expenses || 0]
  ];

  widgetContainer.innerHTML = items.map(([label, value]) => `
    <article class="v21-widget" data-widget="${label.toLowerCase()}">
      <h3>${label}</h3>
      <p>${value}</p>
    </article>
  `).join('');

  return true;
}
