export function validateOwnerPayout(input: any = {}) {
  const errors: string[] = [];

  const value = {
    ownerId: clean(input.ownerId),
    period: clean(input.period),
    revenue: toNumber(input.revenue),
    expenses: toNumber(input.expenses),
    managementFees: toNumber(input.managementFees),
    adjustments: toNumber(input.adjustments),
    status: clean(input.status || 'pending'),
    notes: clean(input.notes)
  };

  if (!value.ownerId) errors.push('ownerId requis');
  if (!value.period) errors.push('Période requise');
  if (value.revenue < 0) errors.push('Revenus invalides');
  if (value.expenses < 0) errors.push('Dépenses invalides');
  if (value.managementFees < 0) errors.push('Frais de gestion invalides');

  return {
    valid: errors.length === 0,
    errors,
    value
  };
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value ? String(value) : '';
}

function toNumber(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}
