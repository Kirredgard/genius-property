import { sendOpsAlert } from '../ops/ops-alerts.client.js';

export function initCommandCenterPage(): void {
  const form = document.querySelector<HTMLFormElement>('#ops-alert-form');
  const output = document.querySelector<HTMLElement>('#command-output');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const result = await sendOpsAlert({
      title: String(data.get('title') || 'Alerte V21'),
      message: String(data.get('message') || ''),
      severity: String(data.get('severity') || 'info'),
      source: 'command-center'
    }).catch((error) => ({ ok: false, error: error.message }));

    if (output) output.textContent = JSON.stringify(result, null, 2);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommandCenterPage, { once: true });
  } else {
    initCommandCenterPage();
  }
}
