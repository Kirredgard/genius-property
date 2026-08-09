export function validateContract(input = {}) {
  const errors = [];

  const value = {
    id: clean(input.id),
    tenantId: clean(input.tenantId || input.locataireId),
    propertyId: clean(input.propertyId || input.bienId),
    startDate: clean(input.startDate || input.dateDebut),
    endDate: clean(input.endDate || input.dateFin),
    monthlyRent: toNumber(input.monthlyRent ?? input.loyerMensuel ?? input.rent),
    deposit: toNumber(input.deposit ?? input.caution),
    status: clean(input.status || 'active'),
    paymentDay: toNumber(input.paymentDay || input.jourPaiement || 1),
    notes: clean(input.notes)
  };

  if (!value.tenantId) errors.push('Locataire requis');
  if (!value.propertyId) errors.push('Bien immobilier requis');
  if (!value.startDate) errors.push('Date de début requise');
  if (value.monthlyRent <= 0) errors.push('Loyer mensuel requis');
  if (value.deposit < 0) errors.push('Caution invalide');
  if (value.paymentDay < 1 || value.paymentDay > 31) errors.push('Jour de paiement invalide');

  if (value.startDate && value.endDate) {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end < start) {
      errors.push('Date de fin antérieure à la date de début');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    value
  };
}

export function clean(value) {
  return typeof value === 'string' ? value.trim() : value || '';
}

export function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}
