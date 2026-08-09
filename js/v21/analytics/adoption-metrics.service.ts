export function calculateAdoptionMetrics(input: any = {}) {
  const activeUsers = Number(input.activeUsers || 0);
  const invitedUsers = Number(input.invitedUsers || 0);

  return {
    activeUsers,
    invitedUsers,
    activationRate: invitedUsers > 0
      ? Math.round((activeUsers / invitedUsers) * 100)
      : 0,
    documentsUploaded: Number(input.documentsUploaded || 0),
    contractsCreated: Number(input.contractsCreated || 0)
  };
}
