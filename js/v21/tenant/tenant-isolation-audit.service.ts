export function auditTenantIsolation(records: any[] = []) {
  const issues = [];

  for (const row of records) {
    if (!row.agencyId) {
      issues.push({
        severity: 'critical',
        message: 'Missing agencyId'
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
