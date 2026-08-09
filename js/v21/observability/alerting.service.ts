export interface AlertRule {
  key: string;
  label: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
}

export interface AlertInput {
  runtimeErrors?: number;
  firebaseCostEstimate?: number;
  failedPayments?: number;
  pastDueSubscriptions?: number;
  storageMb?: number;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  { key: 'runtimeErrors', label: 'Erreurs runtime', threshold: 5, severity: 'warning' },
  { key: 'firebaseCostEstimate', label: 'Coût Firebase estimé', threshold: 50000, severity: 'warning' },
  { key: 'failedPayments', label: 'Paiements échoués', threshold: 1, severity: 'critical' },
  { key: 'pastDueSubscriptions', label: 'Abonnements en retard', threshold: 1, severity: 'warning' },
  { key: 'storageMb', label: 'Stockage documents MB', threshold: 20000, severity: 'warning' }
];

export function evaluateAlerts(input: AlertInput, rules: AlertRule[] = DEFAULT_ALERT_RULES) {
  return rules
    .map((rule) => {
      const value = Number((input as any)[rule.key] || 0);
      return {
        ...rule,
        value,
        triggered: value >= rule.threshold
      };
    })
    .filter((alert) => alert.triggered);
}

export function persistAlerts(alerts: any[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('gp:v21:alerts', JSON.stringify({
      alerts,
      updatedAt: new Date().toISOString()
    }));
  } catch (_) {
    // ignore
  }
}

export function readPersistedAlerts() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('gp:v21:alerts');
    return raw ? JSON.parse(raw).alerts || [] : [];
  } catch (_) {
    return [];
  }
}
