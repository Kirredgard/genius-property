import { submitFeedback, readLocalFeedback } from '../beta/feedback.service.js';

export function initFeedbackPage(): void {
  const form = document.querySelector<HTMLFormElement>('#feedback-form');
  const output = document.querySelector<HTMLElement>('#feedback-output');

  render();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const result = await submitFeedback({
      type: String(data.get('type') || 'idea'),
      severity: String(data.get('severity') || 'medium'),
      message: String(data.get('message') || '').trim(),
      page: String(data.get('page') || location.pathname)
    });

    form.reset();
    render(result);
  });

  function render(lastResult: any = null) {
    if (!output) return;

    output.textContent = JSON.stringify({
      lastResult,
      localFeedback: readLocalFeedback()
    }, null, 2);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedbackPage, { once: true });
  } else {
    initFeedbackPage();
  }
}
