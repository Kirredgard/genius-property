import { renderSubscriptionBanner } from '../billing/subscription-banner.js';
import { renderBillingStatus } from '../billing/billing-status.widget.js';
import { GPV21_DEMO_DATA, isDemoModeEnabled } from '../demo/demo-data.js';
import { initDashboardModule } from '../modules/dashboard/dashboard.module.js';
import { initNotificationsModule } from '../modules/notifications/notifications.module.js';

export async function initDashboardPage() {
      renderSubscriptionBanner('#subscription-banner-root');
      renderBillingStatus('#billing-status-root');
  await initDashboardModule({ rootSelector: '#dashboard-root', ...(isDemoModeEnabled() ? GPV21_DEMO_DATA : {}) });

  if (document.querySelector('#notifications-root')) {
    await initNotificationsModule({ rootSelector: '#notifications-root' });
  }

  document.dispatchEvent(new CustomEvent('gp:v21-dashboard-page-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardPage, { once: true });
  } else {
    initDashboardPage();
  }
}
