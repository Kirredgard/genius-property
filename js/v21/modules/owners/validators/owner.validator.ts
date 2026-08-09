export interface OwnerInput {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: string;
}

export function validateOwner(input: OwnerInput = {}) {
  const errors: string[] = [];

  const value = {
    id: clean(input.id),
    firstName: clean(input.firstName),
    lastName: clean(input.lastName),
    phone: clean(input.phone),
    email: clean(input.email),
    address: clean(input.address),
    notes: clean(input.notes),
    status: clean(input.status || 'active') || 'active'
  };

  if (!value.firstName) errors.push('Prénom propriétaire requis');
  if (!value.lastName) errors.push('Nom propriétaire requis');
  if (!value.phone && !value.email) errors.push('Téléphone ou email requis');
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push('Email invalide');

  return {
    valid: errors.length === 0,
    errors,
    value
  };
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value ? String(value) : '';
}
