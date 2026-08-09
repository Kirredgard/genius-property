export const BETA_QUESTIONS = [
  'La connexion a-t-elle été simple ?',
  'Le dashboard est-il clair ?',
  'La création d’un bien est-elle compréhensible ?',
  'La gestion locataire/contrat est-elle logique ?',
  'Le module documents est-il utile ?',
  'Qu’est-ce qui bloque le plus ?',
  'Quelle fonctionnalité manque pour payer le produit ?'
];

export function buildQuestionnaireTemplate() {
  return BETA_QUESTIONS.map((question) => ({
    question,
    answer: '',
    score: 0
  }));
}
