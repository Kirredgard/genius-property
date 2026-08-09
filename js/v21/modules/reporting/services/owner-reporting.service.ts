export interface OwnerReportInput {
  ownerId: string;
  owners?: any[];
  properties?: any[];
  payments?: any[];
  expenses?: any[];
}

export function buildOwnerReport(input: OwnerReportInput) {
  const owner = (input.owners || []).find((item) => item.id === input.ownerId) || null;
  const properties = (input.properties || []).filter((item) => item.ownerId === input.ownerId);
  const propertyIds = new Set(properties.map((item) => item.id));

  const payments = (input.payments || []).filter((item) => propertyIds.has(item.propertyId));
  const expenses = (input.expenses || []).filter((item) => propertyIds.has(item.propertyId));

  const totalRevenue = sum(payments.map((item) => item.amount ?? item.paidAmount ?? 0));
  const totalExpenses = sum(expenses.map((item) => item.amount ?? 0));
  const netBalance = totalRevenue - totalExpenses;

  return {
    ownerId: input.ownerId,
    owner,
    propertiesCount: properties.length,
    properties,
    paymentsCount: payments.length,
    expensesCount: expenses.length,
    totalRevenue,
    totalExpenses,
    netBalance
  };
}

export function buildAllOwnerReports(input: Omit<OwnerReportInput, 'ownerId'>) {
  return (input.owners || []).map((owner) =>
    buildOwnerReport({
      ...input,
      ownerId: owner.id
    })
  );
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}
