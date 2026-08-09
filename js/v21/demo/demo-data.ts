export const GPV21_DEMO_DATA = {
  owners: [
    { id: 'owner-demo-1', firstName: 'Awa', lastName: 'Diop', phone: '77 000 00 01', email: 'awa@example.com', status: 'active' }
  ],
  properties: [
    { id: 'property-demo-1', title: 'Appartement Almadies', address: 'Route des Almadies', city: 'Dakar', monthlyRent: 350000, ownerId: 'owner-demo-1', status: 'occupied' },
    { id: 'property-demo-2', title: 'Studio Plateau', address: 'Avenue Pompidou', city: 'Dakar', monthlyRent: 220000, ownerId: 'owner-demo-1', status: 'available' }
  ],
  tenants: [
    { id: 'tenant-demo-1', firstName: 'Moussa', lastName: 'Fall', phone: '77 000 00 02', propertyId: 'property-demo-1', monthlyRent: 350000, status: 'active' }
  ],
  contracts: [
    { id: 'contract-demo-1', tenantId: 'tenant-demo-1', propertyId: 'property-demo-1', startDate: '2026-01-01', monthlyRent: 350000, status: 'active', paymentDay: 5 }
  ],
  payments: [
    { id: 'payment-demo-1', tenantId: 'tenant-demo-1', propertyId: 'property-demo-1', amount: 350000, status: 'paid' },
    { id: 'payment-demo-2', tenantId: 'tenant-demo-1', propertyId: 'property-demo-1', amount: 350000, remainingAmount: 120000, status: 'overdue' }
  ],
  expenses: [
    { id: 'expense-demo-1', propertyId: 'property-demo-1', amount: 45000, category: 'maintenance' }
  ],
  payouts: [
    { id: 'payout-demo-1', ownerId: 'owner-demo-1', period: '2026-05', netAmount: 250000, status: 'pending' }
  ],
  documents: [
    { id: 'doc-demo-1', filename: 'quittance-demo.pdf', documentType: 'receipt', entityId: 'tenant-demo-1', size: 24576, uploadedAt: new Date().toISOString() }
  ]
};

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1' || localStorage.getItem('gp:v21:demo') === '1';
}

export function enableDemoMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('gp:v21:demo', '1');
  (window as any).GPV21DemoData = GPV21_DEMO_DATA;
}

export function disableDemoMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('gp:v21:demo');
}

export function getDemoCollection(name: keyof typeof GPV21_DEMO_DATA): any[] {
  if (!isDemoModeEnabled()) return [];
  return [...(GPV21_DEMO_DATA[name] || [])];
}

if (typeof window !== 'undefined') {
  (window as any).GPV21DemoData = GPV21_DEMO_DATA;
  (window as any).GPV21Demo = {
    enable: enableDemoMode,
    disable: disableDemoMode,
    enabled: isDemoModeEnabled,
    data: GPV21_DEMO_DATA
  };
}
