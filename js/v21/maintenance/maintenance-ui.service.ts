export function renderMaintenanceMode(message = 'Maintenance en cours') {
  document.body.innerHTML = `
    <main class="v21-shell">
      <section class="v21-form-card">
        <h1>Maintenance</h1>
        <p>${message}</p>
      </section>
    </main>
  `;
}
