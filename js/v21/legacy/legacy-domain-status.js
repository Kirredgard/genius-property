export const LEGACY_DOMAIN_STATUS = {
  auth: 'v21-ready',
  dashboard: 'v21-ready',
  payments: 'v21-ready',
  tenants: 'v21-ready',
  properties: 'v21-ready',
  contracts: 'v21-ready',
  expenses: 'v21-ready',
  documents: 'v21-ready',
  reporting: 'v21-ready',
  notifications: 'v21-ready',
      owners: 'v21-ready'
};

export function getLegacyDomainStatus(domain) {
  return LEGACY_DOMAIN_STATUS[domain] || 'unknown';
}

export function listMigratedDomains() {
  return Object.entries(LEGACY_DOMAIN_STATUS)
    .filter(([, status]) => status === 'v21-ready')
    .map(([domain]) => domain);
}
