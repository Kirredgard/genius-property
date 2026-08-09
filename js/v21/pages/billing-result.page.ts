import { loadAgencySubscription } from '../billing/subscription.service.js';

export async function initBillingResultPage(): Promise<void> {
  const root = document.querySelector('#billing-result-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const status = params.get('status') || document.body.dataset.billingStatus || 'unknown';

  try {
    await loadAgencySubscription();
  } catch (error) {
    console.warn('[V21][BillingResult] subscription refresh failed:', error);
  }

  root.innerHTML = `
    <section class="v21-form-card">
      <h1>${status === 'success' ? 'Paiement confirmé' : 'Paiement annulé'}</h1>
      <p>${status === 'success'
        ? 'Ton abonnement est en cours de mise à jour.'
        : 'Aucun changement n’a été appliqué à ton abonnement.'}</p>
      <div class="v21-form-actions">
        <a class="v21-action-button" href="./billing.v21.html">Voir abonnement</a>
        <a class="v21-action-button" href="./dashboard.v21.html">Dashboard</a>
      </div>
    </section>
  `;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBillingResultPage, { once: true });
  } else {
    initBillingResultPage();
  }
}
