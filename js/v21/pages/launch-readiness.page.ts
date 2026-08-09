export function initLaunchReadinessPage(): void {
  const root = document.querySelector('#launch-root');
  if (!root) return;

  const checklist = [
    'Firebase production configuré',
    'Billing Stripe testé',
    'Emails transactionnels actifs',
    'Observabilité activée',
    'Sauvegardes export validées',
    'Support beta prêt',
    'Status page publique'
  ];

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Production Readiness</h2>

      <ul class="v21-list">
        ${checklist.map((item) => `<li>✅ ${item}</li>`).join('')}
      </ul>
    </section>
  `;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaunchReadinessPage, { once: true });
  } else {
    initLaunchReadinessPage();
  }
}
