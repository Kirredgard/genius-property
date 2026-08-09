import { exposeGlobal } from '../../core/global-registry.js';
import { readPaymentForm, writePaymentBalance, closePaymentModal } from './adapters/payments.dom-adapter.js';
import { renderPaymentsSummary } from './ui/payments.layout.js';
import { addPayment, computePaymentBalance, loadPayments, validatePaymentInput } from './services/payments.service.js';

function getDb() {
  if (globalThis.GPDB?.load) return globalThis.GPDB.load();
  return globalThis.DB || {};
}

async function persistDb(db) {
  globalThis.DB = db;
  if (globalThis.GPDB?.save) return globalThis.GPDB.save(db);
  if (typeof globalThis.saveDB === 'function') return globalThis.saveDB();
  return undefined;
}

function notify(message, type = 'ok') {
  if (typeof globalThis.toast === 'function') return globalThis.toast(message, type === 'error' ? 'err' : type);
  const logger = type === 'error' ? console.error : console.log;
  logger(message);
}

export async function initPaymentsModule() {
  const payments = await loadPayments({ db: getDb() });
  renderPaymentsSummary(payments);

  exposeGlobal('GPV21Payments', {
    addPayment,
    computePaymentBalance,
    validatePaymentInput,
    refreshSummary: async () => renderPaymentsSummary(await loadPayments({ db: getDb() }))
  }, { overwrite: true });

  exposeGlobal('updatePayResteV21', () => {
    const input = readPaymentForm();
    writePaymentBalance(computePaymentBalance(input));
  }, { overwrite: true });

  exposeGlobal('savePaiementV21', async () => {
    const db = getDb();
    const result = addPayment(db, readPaymentForm());
    if (!result.ok) {
      notify(result.message, 'error');
      return false;
    }
    await persistDb(result.db);
    closePaymentModal();
    renderPaymentsSummary(result.db.paiements);
    if (typeof globalThis.renderPaiements === 'function') globalThis.renderPaiements();
    notify('Paiement enregistré ✓');
    return true;
  }, { overwrite: true });
}
