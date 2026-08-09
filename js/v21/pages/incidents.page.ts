import { createIncident, listIncidents } from '../incidents/incident.service.js';

export async function initIncidentsPage(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>('#incident-form');
  const output = document.querySelector<HTMLElement>('#incident-output');

  await render();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const result = await createIncident({
      title: String(data.get('title') || ''),
      severity: String(data.get('severity') || 'medium'),
      description: String(data.get('description') || '')
    });
    form.reset();
    await render(result);
  });

  async function render(lastResult: any = null) {
    const incidents = await listIncidents().catch(() => []);
    if (output) output.textContent = JSON.stringify({ lastResult, incidents }, null, 2);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIncidentsPage, { once: true });
  } else {
    initIncidentsPage();
  }
}
