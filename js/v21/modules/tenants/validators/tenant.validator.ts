const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTenant(input = {}) {
  const errors = [];
  const value = {
    id: clean(input.id),
    firstName: clean(input.firstName || input.prenom),
    lastName: clean(input.lastName || input.nom),
    phone: clean(input.phone || input.telephone),
    email: clean(input.email),
    propertyId: clean(input.propertyId || input.bienId),
    status: clean(input.status || 'active') || 'active',
    monthlyRent: toNumber(input.monthlyRent ?? input.loyerMensuel ?? input.rent),
    moveInDate: clean(input.moveInDate || input.dateEntree),
    notes: clean(input.notes)
  };

  if (!value.firstName) errors.push('Prénom locataire requis');
  if (!value.lastName) errors.push('Nom locataire requis');
  if (!value.phone && !value.email) errors.push('Téléphone ou email requis');
  if (value.email && !EMAIL_RE.test(value.email)) errors.push('Email invalide');
  if (value.monthlyRent < 0) errors.push('Loyer mensuel invalide');

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
