export function buildRecoveryPlan() {
  return {
    backupFrequency: 'daily',
    retentionDays: 30,
    recoveryTimeObjectiveMinutes: 60,
    recoveryPointObjectiveMinutes: 15
  };
}
