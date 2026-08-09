import { createDocument, listDocuments, updateDocument } from '../../../data/firestore.repository.js';

export const COLLECTION_NAME = 'ownerPayouts';

export interface OwnerPayoutInput {
  ownerId: string;
  period: string;
  revenue?: number;
  expenses?: number;
  managementFees?: number;
  adjustments?: number;
  status?: string;
  notes?: string;
}

export function calculateOwnerPayout(input: OwnerPayoutInput) {
  const revenue = Number(input.revenue || 0);
  const expenses = Number(input.expenses || 0);
  const managementFees = Number(input.managementFees || 0);
  const adjustments = Number(input.adjustments || 0);
  const netAmount = revenue - expenses - managementFees + adjustments;

  return {
    ownerId: input.ownerId,
    period: input.period,
    revenue,
    expenses,
    managementFees,
    adjustments,
    netAmount,
    status: input.status || 'pending',
    notes: input.notes || ''
  };
}

export async function createOwnerPayout(input: OwnerPayoutInput, options: { agencyId?: string; db?: unknown } = {}) {
  const data = calculateOwnerPayout(input);

  return createDocument(data, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });
}

export async function listOwnerPayouts(options: { agencyId?: string; db?: unknown; ownerId?: string } = {}) {
  const rows = await listDocuments({
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });

  return rows.filter((item: any) => !options.ownerId || item.ownerId === options.ownerId);
}

export async function markOwnerPayoutPaid(payoutId: string, options: { agencyId?: string; db?: unknown; paidAt?: string } = {}) {
  if (!payoutId) {
    return { ok: false, errors: ['payoutId requis'] };
  }

  const result = await updateDocument(payoutId, {
    status: 'paid',
    paidAt: options.paidAt || new Date().toISOString()
  }, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });

  return { ok: true, payout: result };
}
