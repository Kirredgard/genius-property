export function renderDashboardLayout(root = document.querySelector('#dashboard-root')) {
  if (!root) return false;

  root.innerHTML = `
    <section class="v21-dashboard" aria-labelledby="dashboard-title">
      <header class="v21-dashboard__header">
        <h1 id="dashboard-title">Dashboard</h1>
        <p>Vue synthétique de l'activité.</p>
      </header>
      <div id="dashboard-widgets" class="v21-dashboard__widgets"></div>
    </section>
  `;

  return true;
}
