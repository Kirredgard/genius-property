export function validateProperty(input = {}) {
  const errors = [];

  const value = {
    id: clean(input.id),
    title: clean(input.title || input.nom || input.name),
    type: clean(input.type || 'appartement'),
    address: clean(input.address || input.adresse),
    city: clean(input.city || input.ville),
    monthlyRent: toNumber(input.monthlyRent ?? input.loyerMensuel ?? input.rent),
    rooms: toNumber(input.rooms ?? input.pieces),
    surface: toNumber(input.surface),
    status: clean(input.status || 'available'),
    ownerId: clean(input.ownerId || input.proprietaireId),
    notes: clean(input.notes)
  };

  if (!value.title) errors.push('Nom du bien requis');
  if (!value.address) errors.push('Adresse du bien requise');
  if (value.monthlyRent < 0) errors.push('Loyer mensuel invalide');
  if (value.rooms < 0) errors.push('Nombre de pièces invalide');
  if (value.surface < 0) errors.push('Surface invalide');

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
