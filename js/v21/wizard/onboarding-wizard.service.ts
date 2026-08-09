export const WIZARD_STEPS = [
  'Créer agence',
  'Ajouter propriétaire',
  'Ajouter bien',
  'Ajouter locataire',
  'Créer contrat',
  'Uploader document'
];

export function getWizardProgress(currentStep = 0) {
  return {
    currentStep,
    totalSteps: WIZARD_STEPS.length,
    percent: Math.round((currentStep / WIZARD_STEPS.length) * 100)
  };
}
