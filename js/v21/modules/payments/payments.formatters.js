export function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/FCFA|XOF|€|EUR|\$/gi, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

export function roundAmount(value) {
  return Math.max(0, Math.round(parseAmount(value)));
}

export function formatMoney(value, { locale = 'fr-FR', currencyLabel = 'FCFA' } = {}) {
  const amount = roundAmount(value);
  if (!amount) return `0 ${currencyLabel}`;
  return `${amount.toLocaleString(locale)} ${currencyLabel}`;
}

export function todayISO(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isValidISODate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}
