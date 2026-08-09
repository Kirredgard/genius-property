import './demo/demo-data.js';
import { initOwnerPayoutsModule } from './modules/owner-payouts/owner-payouts.module.js';
import { renderOwnerReporting } from './modules/reporting/reporting.module.js';
import { initOwnersModule } from './modules/owners/owners.module.js';
import { initDocumentsModule } from './modules/documents/documents.module.js';
import './modules/documents/documents.module.js';
import './storage/storage.module.js';
import { listMigratedDomains } from './legacy/legacy-domain-status.js';
import './legacy/legacy-registry.js';
import { initNotificationsModule } from './modules/notifications/notifications.module.js';
import { initContractsModule } from './modules/contracts/contracts.module.js';
import { initPropertiesModule } from './modules/properties/properties.module.js';
import { initTenantsModule } from './modules/tenants/tenants.module.js';
import { installLegacyQuarantine } from './core/legacy-quarantine.js';
import { initAuthModule } from './modules/auth/auth.module.js';
import { initDashboardModule } from './modules/dashboard/dashboard.module.js';
import { initPaymentsModule } from './modules/payments/payments.module.js';

async function bootV21() {
  installLegacyQuarantine();
  await initAuthModule();

  if (document.querySelector('#dashboard-root') || document.querySelector('#page-dashboard')) {
    await initDashboardModule();
  }

  if (document.querySelector('#page-paiements') || document.querySelector('#payModal') || document.querySelector('#payments-v21-summary')) {
    await initPaymentsModule();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootV21, { once: true });
} else {
  bootV21();
}

export { bootV21 };


// V21 Tenants bootstrap: safe auto-init only if container exists
if (typeof document !== 'undefined' && document.querySelector('#tenants-root')) {
  initTenantsModule({ rootSelector: '#tenants-root' });
}


// V21 Properties bootstrap: safe auto-init only if container exists
if (typeof document !== 'undefined' && document.querySelector('#properties-root')) {
  initPropertiesModule({ rootSelector: '#properties-root' });
}


// V21 Contracts bootstrap: safe auto-init only if container exists
if (typeof document !== 'undefined' && document.querySelector('#contracts-root')) {
  initContractsModule({ rootSelector: '#contracts-root' });
}


// V21 Notifications bootstrap: safe auto-init only if container exists
if (typeof document !== 'undefined' && document.querySelector('#notifications-root')) {
  initNotificationsModule({ rootSelector: '#notifications-root' });
}

if (typeof window !== 'undefined') {
  window.GPV21MigratedDomains = listMigratedDomains();
}

// V21 Documents bootstrap: safe auto-init only if container exists
if (typeof document !== 'undefined' && document.querySelector('#documents-root')) {
  initDocumentsModule({ rootSelector: '#documents-root' });
}

// V21 Owners bootstrap: safe auto-init only if container exists
if (typeof document !== 'undefined' && document.querySelector('#owners-root')) {
  initOwnersModule({ rootSelector: '#owners-root' });
}

// V21 Owner Reporting bootstrap
if (typeof document !== 'undefined' && document.querySelector('#owner-reporting-root')) {
  renderOwnerReporting({ rootSelector: '#owner-reporting-root' });
}

// V21 Owner Payouts bootstrap
if (typeof document !== 'undefined' && document.querySelector('#owner-payouts-root')) {
  initOwnerPayoutsModule({ rootSelector: '#owner-payouts-root' });
}
