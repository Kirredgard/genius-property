import { loadAgencySubscription, saveAgencySubscription, getLocalSubscription } from '../billing/subscription.service.js';
import { getPlanLimits } from '../billing/plans.js';
import { buildUserAgencyContext } from '../context/user-agency-context.js';

const plans = ['free', 'starter', 'pro', 'business', 'enterprise'];

export async function initBillingPage(): Promise<void> {
  const root = document.querySelector('#billing-root');
  if (!root) return;

  const context = buildUserAgencyContext();
  await loadAgencySubscription({ agencyId: context.agencyId });
  render();

  root.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement | null;
    if (!target?.matches('[data-plan-select]')) return;

    const subscription = {
      ...getLocalSubscription(),
      agencyId: context.agencyId,
      plan: target.value,
      status: 'active',
      limits: getPlanLimits(target.value)
    };

    await saveAgencySubscription(subscription);
    render();
  });

  function render() {
    const subscription = getLocalSubscription();

    root.innerHTML = `
      <section class="v21-form-card">
        <h2>Abonnement agence</h2>
        <p>Agence: ${escapeHtml(subscription.agencyId || context.agencyId || 'non définie')}</p>

        <label class="v21-form-field">
          <span>Plan</span>
          <select data-plan-select>
            ${plans.map((plan) => `<option value="${plan}" ${subscription.plan === plan ? 'selected' : ''}>${plan}</option>`).join('')}
          </select>
        </label>

        <h3>Limites</h3>
        <pre>${escapeHtml(JSON.stringify(subscription.limits || getPlanLimits(subscription.plan), null, 2))}</pre>
      </section>
    `;
  }
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBillingPage, { once: true });
  } else {
    initBillingPage();
  }
}
