const DAY_MS = 24 * 60 * 60 * 1000;

export function buildRentDueAlerts({ contracts = [], tenants = [], properties = [] } = {}) {
  const today = new Date();
  const day = today.getDate();

  return contracts
    .filter((contract) => contract.status === 'active')
    .filter((contract) => Number(contract.paymentDay || 1) >= day && Number(contract.paymentDay || 1) <= day + 3)
    .map((contract) => {
      const tenant = tenants.find((item) => item.id === contract.tenantId);
      const property = properties.find((item) => item.id === contract.propertyId);

      return {
        id: `rent_due_${contract.id}_${today.toISOString().slice(0, 10)}`,
        type: 'rent_due',
        severity: 'info',
        title: 'Loyer bientôt dû',
        message: `${tenantName(tenant)} doit payer ${formatCurrency(contract.monthlyRent)} pour ${propertyName(property)}.`,
        read: false,
        createdAt: today.toISOString(),
        entityId: contract.id
      };
    });
}

export function buildContractExpiryAlerts({ contracts = [], tenants = [], properties = [] } = {}) {
  const today = new Date();

  return contracts
    .filter((contract) => contract.status === 'active' && contract.endDate)
    .filter((contract) => {
      const end = new Date(contract.endDate);
      if (!Number.isFinite(end.getTime())) return false;
      const daysLeft = Math.ceil((end.getTime() - today.getTime()) / DAY_MS);
      return daysLeft >= 0 && daysLeft <= 30;
    })
    .map((contract) => {
      const tenant = tenants.find((item) => item.id === contract.tenantId);
      const property = properties.find((item) => item.id === contract.propertyId);

      return {
        id: `contract_expiry_${contract.id}`,
        type: 'contract_expiry',
        severity: 'warning',
        title: 'Contrat bientôt expiré',
        message: `Le contrat de ${tenantName(tenant)} pour ${propertyName(property)} arrive bientôt à échéance.`,
        read: false,
        createdAt: today.toISOString(),
        entityId: contract.id
      };
    });
}

export function buildOverduePaymentAlerts({ payments = [], tenants = [] } = {}) {
  const today = new Date();

  return payments
    .filter((payment) => payment.status === 'overdue' || payment.status === 'late')
    .map((payment) => {
      const tenant = tenants.find((item) => item.id === payment.tenantId);

      return {
        id: `payment_overdue_${payment.id}`,
        type: 'payment_overdue',
        severity: 'critical',
        title: 'Paiement en retard',
        message: `${tenantName(tenant)} a un paiement en retard de ${formatCurrency(payment.amount || payment.remainingAmount)}.`,
        read: false,
        createdAt: today.toISOString(),
        entityId: payment.id
      };
    });
}

function tenantName(tenant) {
  if (!tenant) return 'Un locataire';
  return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Un locataire';
}

function propertyName(property) {
  return property?.title || property?.address || 'un bien';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}
