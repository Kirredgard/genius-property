import { trackPageView, trackProductEvent, trackBillingUpgrade } from '../audit/product-tracking.service.js';
import { PLAN_LIMITS } from '../billing/plans.js';
import { redirectToCheckout, redirectToPortal } from '../billing/billing-api.client.js';
import { getLocalSubscription } from '../billing/subscription.service.js';

const paidPlans = ['starter', 'pro', 'business', 'enterprise'];

trackPageView(window.location.pathname);

export function initUpgradePage(): void {
  const root = document.querySelector('#upgrade-root');
  if (!root) return;

  render();

  root.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement | null;
    const checkout = target?.closest('[data-checkout-plan]') as HTMLElement | null;
    const portal = target?.closest('[data-open-portal]') as HTMLElement | null;

    if (checkout) {
      const plan = checkout.dataset.checkoutPlan || '';
      checkout.setAttribute('disabled', 'true');

      try {
        await trackBillingUpgrade(plan);
            await redirectToCheckout(plan);
      } catch (error) {
        console.error('[V21][Upgrade] checkout failed:', error);
        alert(error instanceof Error ? error.message : 'Checkout impossible');
        checkout.removeAttribute('disabled');
      }
    }

    if (portal) {
      try {
        await redirectToPortal();
      } catch (error) {
        console.error('[V21][Upgrade] portal failed:', error);
        alert(error instanceof Error ? error.message : 'Portail impossible');
      }
    }
  });

  function render() {
    const subscription = getLocalSubscription();

    root.innerHTML = `
      <section class="v21-section-header">
        <h2>Upgrade Genius Property</h2>
        <p>Plan actuel : <strong>${escapeHtml(String(subscription.plan || 'free'))}</strong></p>
      </section>

      <div class="v21-kpi-grid">
        ${paidPlans.map((plan) => renderPlanCard(plan, subscription.plan === plan)).join('')}
      </div>

      <section class="v21-form-card">
        <h2>Gérer l’abonnement</h2>
        <p>Changer la carte, annuler ou consulter les factures via le portail client.</p>
        <button type="button" data-open-portal>Ouvrir le portail client</button>
      </section>
    `;
  }
}

function renderPlanCard(plan: string, active: boolean): string {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return `
    <article class="v21-widget">
      <span>${active ? 'Plan actuel' : 'Plan'}</span>
      <strong>${escapeHtml(plan)}</strong>
      <p>Biens: ${formatLimit(limits.properties)}</p>
      <p>Locataires: ${formatLimit(limits.tenants)}</p>
      <p>Utilisateurs: ${formatLimit(limits.users)}</p>
      <p>Documents: ${formatLimit(limits.documentsMb)} MB</p>
      <p>Reversements: ${limits.ownerPayouts ? 'Oui' : 'Non'}</p>
      <button type="button" data-checkout-plan="${escapeHtml(plan)}" ${active ? 'disabled' : ''}>
        ${active ? 'Actif' : 'Choisir'}
      </button>
    </article>
  `;
}

function formatLimit(value: number): string {
  return value === Number.POSITIVE_INFINITY ? 'Illimité' : String(value);
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
    document.addEventListener('DOMContentLoaded', initUpgradePage, { once: true });
  } else {
    initUpgradePage();
  }
}
