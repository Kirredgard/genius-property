import { describe, expect, it } from 'vitest';
import { addPayment, computePaymentBalance, createPaymentRecord, filterPayments, summarizePayments, validatePaymentInput } from '../js/v21/modules/payments/services/payments.service.js';
import { formatMoney, parseAmount } from '../js/v21/modules/payments/payments.formatters.js';

describe('payments v21 service', () => {
  it('parse les montants FCFA', () => {
    expect(parseAmount('150 000 FCFA')).toBe(150000);
    expect(parseAmount('12,5')).toBe(12.5);
  });

  it('calcule le reste et le statut', () => {
    expect(computePaymentBalance({ montant: 100000, paye: 25000 })).toEqual({
      montant: 100000,
      paye: 25000,
      reste: 75000,
      statut: 'Partiel'
    });
  });

  it('valide les paiements incorrects', () => {
    expect(validatePaymentInput({ montant: 1000, paye: 1200, locataire: 'A', locative: 'B' })).toMatchObject({ ok: false, field: 'paye' });
  });

  it('crée un paiement normalisé', () => {
    const result = createPaymentRecord({ locataire: 'Fall', locative: 'A1', montant: '100000', paye: '100000', date: '2026-05-25' }, { now: () => 1 });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ id: 'pay_1', reste: '0', statut: 'Payé', source: 'v21.payments' });
  });

  it('ajoute un paiement sans muter la base originale', () => {
    const db = { paiements: [] };
    const result = addPayment(db, { locataire: 'Fall', locative: 'A1', montant: '50000', paye: '0', date: '2026-05-25' }, { now: () => 2 });
    expect(result.ok).toBe(true);
    expect(db.paiements).toHaveLength(0);
    expect(result.db.paiements).toHaveLength(1);
  });

  it('résume et filtre les paiements', () => {
    const payments = [
      { locataire: 'Awa', montant: 100, paye: 100 },
      { locataire: 'Moussa', montant: 100, paye: 25 },
      { locataire: 'Awa', montant: 50, paye: 0 }
    ];
    expect(summarizePayments(payments)).toMatchObject({ count: 3, total: 250, paid: 125, remaining: 125 });
    expect(filterPayments(payments, { tenant: 'awa' })).toHaveLength(2);
  });

  it('formate les montants', () => {
    expect(formatMoney(150000)).toContain('FCFA');
  });
});
