# Mode test local — agence unique

L'application est configurée temporairement en authentification locale pour les tests.

- Identifiant administrateur : `admin`
- Mot de passe : `admin123`
- Données métier : `localStorage` du navigateur
- Supabase : ignoré en mode test local
- Aucun abonnement/licence commerciale requis

La session locale est conservée après rechargement jusqu'à la déconnexion.

> Ce mode est destiné au test/local uniquement. Avant une mise en production, remplacer l'authentification locale par un mécanisme sécurisé (par exemple Supabase Auth).
