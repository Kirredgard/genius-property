import { formatMoney } from '../payments.formatters.js';
import { summarizePayments } from '../services/payments.service.js';

export function renderPaymentsSummary(payments = [], root = document.querySelector('#payments-v21-summary')) {
  if (!root) return;
  const summary = summarizePayments(payments);
  root.innerHTML = `
    <section class="v21-payments-summary" aria-label="Résumé paiements">
      <article><strong>${summary.count}</strong><span>Paiements</span></article>
      <article><strong>${formatMoney(summary.total)}</strong><span>Total dû</span></article>
      <article><strong>${formatMoney(summary.paid)}</strong><span>Encaissé</span></article>
      <article><strong>${formatMoney(summary.remaining)}</strong><span>Reste</span></article>
    </section>
  `;
}
