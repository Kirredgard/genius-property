export function readPaymentForm(documentRef = document) {
  const value = (id) => String(documentRef.getElementById(id)?.value ?? '').trim();
  return {
    locataire: value('pay-locataire') || value('fin-p-locataire'),
    locative: value('pay-locative') || value('fin-p-locative'),
    bien: value('pay-bien'),
    montant: value('pay-montant') || value('fin-p-montant'),
    paye: value('pay-paye') || value('fin-p-paye'),
    date: value('pay-date') || value('fin-p-date'),
    mode: value('pay-mode') || value('fin-p-mode') || 'Espèces'
  };
}

export function writePaymentBalance(balance, documentRef = document) {
  ['pay-reste', 'fin-p-reste'].forEach((id) => {
    const el = documentRef.getElementById(id);
    if (el) el.value = String(balance.reste);
  });
}

export function closePaymentModal(documentRef = document) {
  ['payModal', 'gpFinanceDrawer', 'gpFinanceOverlay'].forEach((id) => {
    const el = documentRef.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
