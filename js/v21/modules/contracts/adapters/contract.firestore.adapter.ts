export function normalizeContractForFirestore(contract = {}) {
  return {
    tenantId: contract.tenantId || '',
    propertyId: contract.propertyId || '',
    startDate: contract.startDate || '',
    endDate: contract.endDate || '',
    monthlyRent: Number(contract.monthlyRent || 0),
    deposit: Number(contract.deposit || 0),
    status: contract.status || 'active',
    paymentDay: Number(contract.paymentDay || 1),
    notes: contract.notes || '',
    updatedAt: new Date().toISOString()
  };
}

export function normalizeContractFromFirestore(doc = {}) {
  const data = typeof doc.data === 'function' ? doc.data() : doc;

  return {
    id: doc.id || data.id || '',
    tenantId: data.tenantId || data.locataireId || '',
    propertyId: data.propertyId || data.bienId || '',
    startDate: data.startDate || data.dateDebut || '',
    endDate: data.endDate || data.dateFin || '',
    monthlyRent: Number(data.monthlyRent ?? data.loyerMensuel ?? data.rent ?? 0),
    deposit: Number(data.deposit ?? data.caution ?? 0),
    status: data.status || 'active',
    paymentDay: Number(data.paymentDay ?? data.jourPaiement ?? 1),
    notes: data.notes || '',
    terminatedAt: data.terminatedAt || ''
  };
}
