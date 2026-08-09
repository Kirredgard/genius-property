import { describe, it, expect } from 'vitest';
import { evaluateAlerts } from '../../../js/v21/observability/alerting.service.js';

describe('alerting service', () => {
  it('déclenche une alerte si seuil dépassé', () => {
    const alerts = evaluateAlerts({ runtimeErrors: 10 });
    expect(alerts.some((alert) => alert.key === 'runtimeErrors')).toBe(true);
  });

  it('ne déclenche rien si seuil non atteint', () => {
    const alerts = evaluateAlerts({ runtimeErrors: 0 });
    expect(alerts.length).toBe(0);
  });
});
