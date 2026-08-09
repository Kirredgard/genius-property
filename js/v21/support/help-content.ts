export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Premiers pas',
    category: 'Démarrage',
    content: 'Connectez-vous, créez votre agence, ajoutez vos propriétaires, biens, locataires et contrats.'
  },
  {
    id: 'properties',
    title: 'Gérer les biens',
    category: 'Gestion',
    content: 'La page Biens permet de créer, modifier et archiver les biens immobiliers.'
  },
  {
    id: 'tenants',
    title: 'Gérer les locataires',
    category: 'Gestion',
    content: 'La page Locataires permet de suivre les occupants, coordonnées et liens avec les biens.'
  },
  {
    id: 'documents',
    title: 'Documents et pièces jointes',
    category: 'Documents',
    content: 'La page Documents permet de suivre les fichiers uploadés et leurs métadonnées.'
  },
  {
    id: 'billing',
    title: 'Abonnement et limites',
    category: 'Billing',
    content: 'Le plan actif définit les limites de biens, locataires, utilisateurs et documents.'
  },
  {
    id: 'feedback',
    title: 'Envoyer un feedback',
    category: 'Beta',
    content: 'Pendant la beta, utilisez la page Feedback pour signaler bugs, idées et questions.'
  }
];

export function searchHelpArticles(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;

  return HELP_ARTICLES.filter((article) =>
    article.title.toLowerCase().includes(q)
    || article.category.toLowerCase().includes(q)
    || article.content.toLowerCase().includes(q)
  );
}
