export function calculateUsageBilling(input: any = {}) {
  const properties = Number(input.properties || 0);
  const users = Number(input.users || 0);
  const documentsGb = Number(input.documentsGb || 0);

  const total =
    (properties * 1000)
    + (users * 5000)
    + (documentsGb * 2000);

  return {
    properties,
    users,
    documentsGb,
    total
  };
}
