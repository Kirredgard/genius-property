import { saveBetaAgency, listBetaAgencies } from '../beta/beta-program.service.js';

export async function initBetaPage(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>('#beta-agency-form');
  const output = document.querySelector<HTMLElement>('#beta-output');

  await render();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const result = await saveBetaAgency({
      agencyId: String(data.get('agencyId') || '').trim(),
      name: String(data.get('name') || '').trim(),
      status: String(data.get('status') || 'candidate'),
      cohort: String(data.get('cohort') || 'beta-v21'),
      notes: String(data.get('notes') || '')
    });

    form.reset();
    await render(result);
  });

  async function render(lastResult: any = null) {
    const agencies = await listBetaAgencies().catch(() => []);

    if (output) {
      output.textContent = JSON.stringify({ lastResult, agencies }, null, 2);
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBetaPage, { once: true });
  } else {
    initBetaPage();
  }
}
