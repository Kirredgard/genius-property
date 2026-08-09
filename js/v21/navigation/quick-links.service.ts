export const QUICK_LINKS = [
  { label: 'Go Live', href: './go-live.v21.html' },
  { label: 'Beta Hub', href: './beta-hub.v21.html' },
  { label: 'Status', href: './status.v21.html' },
  { label: 'Health', href: './health.v21.html' },
  { label: 'Support', href: './support.v21.html' },
  { label: 'Launch Readiness', href: './launch-readiness.v21.html' },
  { label: 'Ultimate SaaS', href: './ultimate-saas.v21.html' }
];

export function renderQuickLinks(rootSelector = '#quick-links-root') {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-kpi-grid">
      ${QUICK_LINKS.map((link) => `
        <a class="v21-widget" href="${link.href}">
          <span>Ouvrir</span>
          <strong>${link.label}</strong>
        </a>
      `).join('')}
    </section>
  `;
}
