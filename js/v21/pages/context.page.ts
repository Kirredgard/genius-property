import { buildUserAgencyContext, persistUserAgencyContext } from '../context/user-agency-context.js';

export function initContextPage(): void {
  const form = document.querySelector<HTMLFormElement>('#context-form');
  const output = document.querySelector<HTMLElement>('#context-output');

  render();

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    persistUserAgencyContext({
      agencyId: String(data.get('agencyId') || '').trim(),
      role: String(data.get('role') || '').trim()
    });

    render();
  });

  function render(): void {
    const context = buildUserAgencyContext();

    if (form) {
      const agencyInput = form.querySelector<HTMLInputElement>('input[name="agencyId"]');
      const roleInput = form.querySelector<HTMLInputElement>('input[name="role"]');
      if (agencyInput) agencyInput.value = context.agencyId;
      if (roleInput) roleInput.value = context.role;
    }

    if (output) {
      output.textContent = JSON.stringify(context, null, 2);
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContextPage, { once: true });
  } else {
    initContextPage();
  }
}
