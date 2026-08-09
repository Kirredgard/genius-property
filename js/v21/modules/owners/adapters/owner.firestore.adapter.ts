export function normalizeOwnerForFirestore(owner: any = {}) {
  return {
    firstName: owner.firstName || '',
    lastName: owner.lastName || '',
    phone: owner.phone || '',
    email: owner.email || '',
    address: owner.address || '',
    notes: owner.notes || '',
    status: owner.status || 'active',
    updatedAt: new Date().toISOString()
  };
}

export function normalizeOwnerFromFirestore(doc: any = {}) {
  const data = typeof doc.data === 'function' ? doc.data() : doc;

  return {
    id: doc.id || data.id || '',
    firstName: data.firstName || data.prenom || '',
    lastName: data.lastName || data.nom || '',
    phone: data.phone || data.telephone || '',
    email: data.email || '',
    address: data.address || data.adresse || '',
    notes: data.notes || '',
    status: data.status || 'active',
    archived: Boolean(data.archived)
  };
}
