export function normalizeTenantForFirestore(tenant = {}) {
  return {
    firstName: tenant.firstName || '',
    lastName: tenant.lastName || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    propertyId: tenant.propertyId || '',
    status: tenant.status || 'active',
    monthlyRent: Number(tenant.monthlyRent || 0),
    moveInDate: tenant.moveInDate || '',
    notes: tenant.notes || '',
    updatedAt: new Date().toISOString()
  };
}

export function normalizeTenantFromFirestore(doc = {}) {
  const data = typeof doc.data === 'function' ? doc.data() : doc;

  return {
    id: doc.id || data.id || '',
    firstName: data.firstName || data.prenom || '',
    lastName: data.lastName || data.nom || '',
    phone: data.phone || data.telephone || '',
    email: data.email || '',
    propertyId: data.propertyId || data.bienId || '',
    status: data.status || 'active',
    monthlyRent: Number(data.monthlyRent ?? data.loyerMensuel ?? data.rent ?? 0),
    moveInDate: data.moveInDate || data.dateEntree || '',
    notes: data.notes || '',
    archived: Boolean(data.archived)
  };
}
