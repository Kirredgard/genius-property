export const SMOKE_TESTS = [
  { key: 'login', label: 'Login V21', url: './login.v21.html' },
  { key: 'dashboard', label: 'Dashboard V21', url: './dashboard.v21.html?demo=1' },
  { key: 'firestore', label: 'Firestore test', url: './firestore-test.v21.html' },
  { key: 'storage', label: 'Storage test', url: './storage-test.v21.html' },
  { key: 'billing', label: 'Billing V21', url: './billing.v21.html' },
  { key: 'support', label: 'Support V21', url: './support.v21.html' },
  { key: 'health', label: 'Health V21', url: './health.v21.html' },
  { key: 'goLive', label: 'Go Live V21', url: './go-live.v21.html' }
];

export function buildSmokeTestReport(results: Record<string, boolean> = {}) {
  return SMOKE_TESTS.map((test) => ({
    ...test,
    status: results[test.key] ? 'passed' : 'pending'
  }));
}
