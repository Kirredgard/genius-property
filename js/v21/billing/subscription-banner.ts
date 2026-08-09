import { getLocalSubscription } from './subscription.service.js';

export function renderSubscriptionBanner(rootSelector = '#subscription-banner-root'): void {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const subscription = getLocalSubscription();
  const status = subscription.status || 'trialing';

  if (!['past_due', 'cancelled', 'expired'].includes(status)) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <section class="v21-form-card v21-subscription-warning">
      <h2>Abonnement à vérifier</h2>
      <p>Statut actuel : <strong>${escapeHtml(status)}</strong></p>
      <a class="v21-action-button" href="./upgrade.v21.html">Mettre à jour l’abonnement</a>
    </section>
  `;
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
