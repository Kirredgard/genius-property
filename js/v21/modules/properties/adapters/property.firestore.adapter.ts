export function normalizePropertyForFirestore(property = {}) {
  return {
    title: property.title || '',
    type: property.type || 'appartement',
    address: property.address || '',
    city: property.city || '',
    monthlyRent: Number(property.monthlyRent || 0),
    rooms: Number(property.rooms || 0),
    surface: Number(property.surface || 0),
    status: property.status || 'available',
    ownerId: property.ownerId || '',
    notes: property.notes || '',
    updatedAt: new Date().toISOString()
  };
}

export function normalizePropertyFromFirestore(doc = {}) {
  const data = typeof doc.data === 'function' ? doc.data() : doc;

  return {
    id: doc.id || data.id || '',
    title: data.title || data.nom || data.name || '',
    type: data.type || 'appartement',
    address: data.address || data.adresse || '',
    city: data.city || data.ville || '',
    monthlyRent: Number(data.monthlyRent ?? data.loyerMensuel ?? data.rent ?? 0),
    rooms: Number(data.rooms ?? data.pieces ?? 0),
    surface: Number(data.surface ?? 0),
    status: data.status || 'available',
    ownerId: data.ownerId || data.proprietaireId || '',
    notes: data.notes || '',
    archived: Boolean(data.archived)
  };
}
