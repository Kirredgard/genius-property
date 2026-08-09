export interface StatusItem {
  key: string;
  label: string;
  status: 'operational' | 'degraded' | 'down' | string;
  details?: string;
}

export function buildSystemStatus(items: StatusItem[] = []) {
  const defaults: StatusItem[] = [
    { key: 'frontend', label: 'Frontend V21', status: 'operational' },
    { key: 'auth', label: 'Firebase Auth', status: 'operational' },
    { key: 'firestore', label: 'Firestore', status: 'operational' },
    { key: 'storage', label: 'Storage', status: 'operational' },
    { key: 'billing', label: 'Billing API', status: 'operational' },
    { key: 'emails', label: 'Email API', status: 'operational' }
  ];

  const merged = defaults.map((item) => items.find((custom) => custom.key === item.key) || item);
  const hasDown = merged.some((item) => item.status === 'down');
  const hasDegraded = merged.some((item) => item.status === 'degraded');

  return {
    overall: hasDown ? 'down' : hasDegraded ? 'degraded' : 'operational',
    items: merged,
    updatedAt: new Date().toISOString()
  };
}
