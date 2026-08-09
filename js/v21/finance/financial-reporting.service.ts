export function buildFinancialReport(input: any = {}) {
  const revenue = Number(input.revenue || 0);
  const costs = Number(input.costs || 0);

  return {
    revenue,
    costs,
    profit: revenue - costs,
    margin: revenue > 0
      ? Math.round(((revenue - costs) / revenue) * 100)
      : 0
  };
}
