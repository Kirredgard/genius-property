/**
 * Format date global — jj/mm/aaaa
 */
(function () {
  if (window.GPDateUtils) return;

  function formatDateFR(value) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function normalizeDateInput(input) {
    if (!input) return;
    input.setAttribute('placeholder', 'jj/mm/aaaa');
  }

  function normalizeAllDateInputs(root) {
    (root || document).querySelectorAll('input[type="date"], input[data-date]').forEach(normalizeDateInput);
  }

  window.GPDateUtils = {
    formatDateFR,
    normalizeDateInput,
    normalizeAllDateInputs
  };

  document.addEventListener('DOMContentLoaded', function () {
    normalizeAllDateInputs(document);
  });
})();
