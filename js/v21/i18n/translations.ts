export const TRANSLATIONS = {
  fr: {
    welcome: 'Bienvenue',
    dashboard: 'Dashboard',
    properties: 'Biens',
    tenants: 'Locataires',
    contracts: 'Contrats'
  },
  en: {
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    properties: 'Properties',
    tenants: 'Tenants',
    contracts: 'Contracts'
  }
};

export function translate(locale = 'fr', key = '') {
  return (TRANSLATIONS as any)?.[locale]?.[key] || key;
}
