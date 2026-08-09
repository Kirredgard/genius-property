export const FIELD_VALIDATION_STEPS = [
  'Connexion',
  'Création agence',
  'Création propriétaire',
  'Création bien',
  'Création locataire',
  'Création contrat',
  'Upload document',
  'Envoi feedback',
  'Vérification health/status'
];

export function buildFieldValidationReport(results: Record<string, boolean> = {}) {
  return FIELD_VALIDATION_STEPS.map((step) => ({
    step,
    passed: Boolean(results[step]),
    status: results[step] ? 'passed' : 'pending'
  }));
}
