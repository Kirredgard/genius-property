export interface DashboardKpiInput {
  properties?: any[];
  tenants?: any[];
  contracts?: any[];
  payments?: any[];
  expenses?: any[];
  owners?: any[];
  payouts?: any[];
}

export function buildDashboardKpis(input: DashboardKpiInput = {}) {
  const properties = input.properties || [];
  const tenants = input.tenants || [];
  const contracts = input.contracts || [];
  const payments = input.payments || [];
  const expenses = input.expenses || [];
  const owners = input.owners || [];
  const payouts = input.payouts || [];

  const activeContracts = contracts.filter((item) => item.status !== 'terminated' && item.status !== 'archived');
  const occupiedPropertyIds = new Set(activeContracts.map((item) => item.propertyId).filter(Boolean));

  const totalRevenue = sum(payments.map((item) => item.amount ?? item.paidAmount ?? 0));
  const totalExpenses = sum(expenses.map((item) => item.amount ?? 0));
  const overdueAmount = sum(
    payments
      .filter((item) => item.status === 'overdue' || item.status === 'late')
      .map((item) => item.remainingAmount ?? item.amount ?? 0)
  );
  const pendingPayouts = sum(
    payouts
      .filter((item) => item.status !== 'paid')
      .map((item) => item.netAmount ?? 0)
  );

  const occupancyRate = properties.length
    ? Math.round((occupiedPropertyIds.size / properties.length) * 100)
    : 0;

  return {
    propertiesCount: properties.length,
    tenantsCount: tenants.length,
    ownersCount: owners.length,
    activeContractsCount: activeContracts.length,
    occupiedPropertiesCount: occupiedPropertyIds.size,
    occupancyRate,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    overdueAmount,
    pendingPayouts
  };
}

export function buildDashboardKpiCards(kpis: Record<string, number>) {
  return [
    { key: 'propertiesCount', label: 'Biens', value: kpis.propertiesCount || 0 },
    { key: 'tenantsCount', label: 'Locataires', value: kpis.tenantsCount || 0 },
    { key: 'ownersCount', label: 'Propriétaires', value: kpis.ownersCount || 0 },
    { key: 'occupancyRate', label: 'Occupation', value: `${kpis.occupancyRate || 0}%` },
    { key: 'totalRevenue', label: 'Revenus', value: formatCurrency(kpis.totalRevenue || 0) },
    { key: 'totalExpenses', label: 'Dépenses', value: formatCurrency(kpis.totalExpenses || 0) },
    { key: 'netIncome', label: 'Résultat net', value: formatCurrency(kpis.netIncome || 0) },
    { key: 'overdueAmount', label: 'Impayés', value: formatCurrency(kpis.overdueAmount || 0) },
    { key: 'pendingPayouts', label: 'Reversements à payer', value: formatCurrency(kpis.pendingPayouts || 0) }
  ];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}
