import { isValidISODate, parseAmount, roundAmount, todayISO } from '../payments.formatters.js';

export function computePaymentBalance({ montant = 0, paye = 0 } = {}) {
  const total = roundAmount(montant);
  const paid = roundAmount(paye);
  return {
    montant: total,
    paye: paid,
    reste: Math.max(0, total - paid),
    statut: paid >= total && total > 0 ? 'Payé' : paid > 0 ? 'Partiel' : 'Impayé'
  };
}

export function validatePaymentInput(input = {}) {
  const locataire = String(input.locataire ?? '').trim();
  const locative = String(input.locative ?? input.location ?? '').trim();
  const date = String(input.date || todayISO()).trim();
  const montant = parseAmount(input.montant);
  const paye = parseAmount(input.paye ?? input.montantPaye ?? 0);

  if (!locataire) return { ok: false, field: 'locataire', message: 'Le locataire est requis' };
  if (!locative) return { ok: false, field: 'locative', message: 'La location est requise' };
  if (!Number.isFinite(montant) || montant <= 0) return { ok: false, field: 'montant', message: 'Le montant doit être supérieur à 0' };
  if (!Number.isFinite(paye) || paye < 0) return { ok: false, field: 'paye', message: 'Le montant payé ne peut pas être négatif' };
  if (paye > montant) return { ok: false, field: 'paye', message: 'Le montant payé dépasse le montant total' };
  if (!isValidISODate(date)) return { ok: false, field: 'date', message: 'La date du paiement est invalide' };

  return { ok: true, data: { locataire, locative, date, montant, paye, mode: input.mode || 'Espèces' } };
}

export function createPaymentRecord(input = {}, { now = Date.now } = {}) {
  const result = validatePaymentInput(input);
  if (!result.ok) return result;
  const balance = computePaymentBalance(result.data);

  return {
    ok: true,
    data: {
      id: input.id || `pay_${now()}`,
      locataire: result.data.locataire,
      locative: result.data.locative,
      bien: input.bien || '',
      montant: String(balance.montant),
      paye: String(balance.paye),
      reste: String(balance.reste),
      statut: balance.statut,
      mode: result.data.mode,
      date: result.data.date,
      createdAt: input.createdAt || new Date(now()).toISOString(),
      source: 'v21.payments'
    }
  };
}

export function summarizePayments(payments = []) {
  return payments.reduce((acc, payment) => {
    const total = parseAmount(payment.montant);
    const paid = parseAmount(payment.paye);
    const rest = Math.max(0, total - paid);
    acc.count += 1;
    acc.total += total;
    acc.paid += paid;
    acc.remaining += rest;
    if (rest === 0 && total > 0) acc.paidCount += 1;
    else if (paid > 0) acc.partialCount += 1;
    else acc.unpaidCount += 1;
    return acc;
  }, { count: 0, total: 0, paid: 0, remaining: 0, paidCount: 0, partialCount: 0, unpaidCount: 0 });
}

export function filterPayments(payments = [], { query = '', status = '', tenant = '' } = {}) {
  const q = String(query).trim().toLowerCase();
  const st = String(status).trim().toLowerCase();
  const tn = String(tenant).trim().toLowerCase();

  return payments.filter((payment) => {
    const balance = computePaymentBalance(payment);
    const haystack = JSON.stringify(payment).toLowerCase();
    const tenantName = String(payment.locataire || '').toLowerCase();
    return (!q || haystack.includes(q))
      && (!st || String(payment.statut || balance.statut).toLowerCase() === st)
      && (!tn || tenantName.includes(tn));
  });
}

export function addPayment(db = {}, input = {}, options = {}) {
  const result = createPaymentRecord(input, options);
  if (!result.ok) return result;
  const nextDb = { ...db, paiements: Array.isArray(db.paiements) ? [...db.paiements] : [] };
  nextDb.paiements.unshift(result.data);
  return { ok: true, data: result.data, db: nextDb };
}

export async function loadPayments({ db = globalThis.DB } = {}) {
  return Array.isArray(db?.paiements) ? db.paiements : [];
}
