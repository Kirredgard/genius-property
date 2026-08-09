export function buildRetentionPolicy() {
  return {
    auditLogsDays: 365,
    notificationsDays: 90,
    incidentsDays: 365,
    backupsDays: 30
  };
}

export function generateDataExport(data: any) {
  return {
    exportedAt: new Date().toISOString(),
    data
  };
}
