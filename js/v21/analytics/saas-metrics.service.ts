export interface SubscriptionLike {
  agencyId?: string;
  plan?: string;
  status?: string;
  amountMonthly?: number;
  currency?: string;
}

export interface UsageLike {
  agencyId?: string;
  properties?: number;
  tenants?: number;
  documentsMb?: number;
  users?: number;
  firebaseCostEstimate?: number;
}

const DEFAULT_PLAN_MRR: Record<string, number> = {
  free: 0,
  starter: 15000,
  pro: 45000,
  business: 120000,
  enterprise: 0
};

export function calculateSaasMetrics(
  subscriptions: SubscriptionLike[] = [],
  usage: UsageLike[] = [],
  planMrr: Record<string, number> = DEFAULT_PLAN_MRR
) {
  const active = subscriptions.filter((item) => ['active', 'trialing'].includes(String(item.status || '')));
  const paid = active.filter((item) => String(item.plan || 'free') !== 'free');

  const mrr = paid.reduce((total, item) => {
    const amount = Number(item.amountMonthly ?? planMrr[String(item.plan || 'free')] ?? 0);
    return total + amount;
  }, 0);

  const byStatus = countBy(subscriptions, 'status');
  const byPlan = countBy(subscriptions, 'plan');

  const totalFirebaseCostEstimate = usage.reduce((sum, item) => sum + Number(item.firebaseCostEstimate || 0), 0);

  return {
    agenciesTotal: new Set(subscriptions.map((item) => item.agencyId).filter(Boolean)).size,
    agenciesActive: new Set(active.map((item) => item.agencyId).filter(Boolean)).size,
    paidAgencies: new Set(paid.map((item) => item.agencyId).filter(Boolean)).size,
    mrr,
    arr: mrr * 12,
    subscriptionsByStatus: byStatus,
    subscriptionsByPlan: byPlan,
    totalProperties: sumUsage(usage, 'properties'),
    totalTenants: sumUsage(usage, 'tenants'),
    totalDocumentsMb: sumUsage(usage, 'documentsMb'),
    totalUsers: sumUsage(usage, 'users'),
    totalFirebaseCostEstimate,
    grossMarginEstimate: mrr ? Math.round(((mrr - totalFirebaseCostEstimate) / mrr) * 100) : 0
  };
}

export function buildSaasMetricCards(metrics: Record<string, any>) {
  return [
    { key: 'agenciesActive', label: 'Agences actives', value: metrics.agenciesActive || 0 },
    { key: 'paidAgencies', label: 'Agences payantes', value: metrics.paidAgencies || 0 },
    { key: 'mrr', label: 'MRR', value: formatCurrency(metrics.mrr || 0) },
    { key: 'arr', label: 'ARR', value: formatCurrency(metrics.arr || 0) },
    { key: 'totalProperties', label: 'Biens gérés', value: metrics.totalProperties || 0 },
    { key: 'totalTenants', label: 'Locataires', value: metrics.totalTenants || 0 },
    { key: 'totalDocumentsMb', label: 'Documents MB', value: metrics.totalDocumentsMb || 0 },
    { key: 'grossMarginEstimate', label: 'Marge estimée', value: `${metrics.grossMarginEstimate || 0}%` }
  ];
}

function countBy(rows: any[], key: string) {
  return rows.reduce((acc, item) => {
    const value = String(item[key] || 'unknown');
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function sumUsage(rows: UsageLike[], key: keyof UsageLike) {
  return rows.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}
