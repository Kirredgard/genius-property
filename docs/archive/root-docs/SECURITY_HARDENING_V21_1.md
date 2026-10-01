# Genius Property V21.1 — Security Hardening

## Corrigé

### Storage multi-agence
- Lecture Storage limitée aux membres de l'agence.
- Écriture limitée aux rôles `owner`, `admin`, `agent`.
- Suppression limitée aux rôles `owner`, `admin`.
- Namespace `test-uploads` désactivé dans les règles durcies.

### API Billing
- `create-checkout-session` exige un Firebase ID token.
- `create-portal-session` exige un Firebase ID token.
- Les deux endpoints vérifient que l'utilisateur est `owner` ou `admin` de `agencyId`.
- L'email Stripe vient de l'utilisateur Firebase authentifié, pas du payload navigateur.

### API Email
- Les endpoints utilisateur exigent Firebase Auth + rôle `owner`/`admin` de l'agence.
- Les emails de billing sont réservés aux appels backend via `EMAIL_API_INTERNAL_SECRET`.
- Le secret interne ne doit jamais être exposé au frontend.

### Invitations
- Les tokens sont générés avec `crypto.getRandomValues`.
- L'acceptation en production passe par Firebase Admin côté serveur.
- L'agence est résolue depuis l'invitation, pas depuis l'URL du navigateur.
- Le serveur vérifie que l'email Firebase correspond à l'email invité.
- La création du membership est faite côté serveur dans une transaction.
- Le navigateur ne crée plus directement son propre membership dans le parcours production.

### Qualité
- Ajout de `npm run security:check`.
- Le check sécurité est intégré à `quality:prod-candidate`.
- Les dépendances frontend `latest` ont été remplacées par des versions explicites pour rendre les installations reproductibles.

## Vérifications exécutées

- Syntaxe Node des nouveaux services backend : OK.
- `scripts/security-hardening-check.mjs` : OK.

## Limitation connue

Le registre npm disponible dans l'environnement d'audit ne contient pas actuellement `@vitejs/plugin-legacy@7.2.1`, donc un `npm install --package-lock-only` n'a pas pu être terminé ici. Le projet doit générer et committer son `package-lock.json` dans un environnement npm disposant des versions verrouillées.

## Variables backend

```bash
EMAIL_API_INTERNAL_SECRET=<long-secret-random>
GOOGLE_APPLICATION_CREDENTIALS=<service-account-json-path>
```

Ne jamais mettre ces secrets dans une variable `VITE_*`.
