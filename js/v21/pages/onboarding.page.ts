import { trackPageView, trackProductEvent, trackBillingUpgrade } from '../audit/product-tracking.service.js';
import { createAgency } from '../onboarding/agency-onboarding.service.js';

trackPageView(window.location.pathname);

export function initOnboardingPage(): void {
  const form = document.querySelector<HTMLFormElement>('#agency-onboarding-form');
  const output = document.querySelector<HTMLElement>('#onboarding-output');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const result = await createAgency({
      name: String(data.get('name') || '').trim(),
      country: String(data.get('country') || '').trim(),
      city: String(data.get('city') || '').trim()
    });

    if (output) output.textContent = JSON.stringify(result, null, 2);

    if (result.ok) {
          await trackProductEvent({ event: 'agency_created', category: 'onboarding' });
      setTimeout(() => {
        window.location.href = './dashboard.v21.html';
      }, 700);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnboardingPage, { once: true });
  } else {
    initOnboardingPage();
  }
}
