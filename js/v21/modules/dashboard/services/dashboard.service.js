export function computeDashboardStats(db = {}) {
  const count = (key) => Array.isArray(db[key]) ? db[key].length : 0;
  return {
    properties: count('biens'),
    tenants: count('locataires'),
    payments: count('paiements'),
    contracts: count('contrats'),
    expenses: count('depenses')
  };
}

export async function loadDashboardStats({ db = globalThis.DB } = {}) {
  return computeDashboardStats(db || {});
}
