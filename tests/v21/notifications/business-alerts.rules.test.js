import { describe, it, expect } from 'vitest';
import { buildContractExpiryAlerts, buildOverduePaymentAlerts } from '../../../js/v21/modules/notifications/rules/business-alerts.rules.js';

describe('business alerts rules', () => {
  it('crée une alerte pour contrat bientôt expiré', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);

    const alerts = buildContractExpiryAlerts({
      contracts: [{
        id: 'c1',
        tenantId: 't1',
        propertyId: 'p1',
        status: 'active',
        endDate: soon.toISOString().slice(0, 10)
      }],
      tenants: [{ id: 't1', firstName: 'Awa', lastName: 'Diop' }],
      properties: [{ id: 'p1', title: 'Appartement' }]
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('contract_expiry');
    expect(alerts[0].severity).toBe('warning');
  });

  it('crée une alerte pour paiement en retard', () => {
    const alerts = buildOverduePaymentAlerts({
      payments: [{ id: 'pay1', tenantId: 't1', status: 'overdue', amount: 150000 }],
      tenants: [{ id: 't1', firstName: 'Awa', lastName: 'Diop' }]
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('payment_overdue');
    expect(alerts[0].severity).toBe('critical');
  });
});
