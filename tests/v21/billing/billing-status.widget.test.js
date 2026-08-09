import { describe, it, expect, beforeEach } from 'vitest';
import { renderBillingStatus } from '../../../js/v21/billing/billing-status.widget.js';
import { persistLocalSubscription } from '../../../js/v21/billing/subscription.service.js';
import { getPlanLimits } from '../../../js/v21/billing/plans.js';

describe('billing status widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="billing-status-root"></div>';
    localStorage.clear();
  });

  it('affiche le plan courant', () => {
    persistLocalSubscription({ agencyId: 'a1', plan: 'pro', status: 'active', limits: getPlanLimits('pro') });
    renderBillingStatus('#billing-status-root');

    expect(document.querySelector('#billing-status-root').textContent).toContain('pro');
  });
});
