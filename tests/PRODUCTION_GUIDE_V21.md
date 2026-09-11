# Production Guide V21

## 1. Préparer l’environnement

Créer `.env.production` ou configurer les secrets CI :

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_APP_ENV=production
```

## 2. Vérifier la qualité

```bash
npm run production:ready
```

## 3. Build production

```bash
npm run build:production
```

## 4. Déployer les règles Firebase

Les fichiers préparés sont :

- `firestore.rules.v21`
- `storage.rules.v21`
- `firebase.v21.json`

Avant déploiement réel, relire les règles selon tes rôles exacts.

## 5. Tester en production

Pages critiques :

- `/login.v21.html`
- `/index.v21-production.html`
- `/dashboard.v21.html`
- `/properties.v21.html`
- `/tenants.v21.html`
- `/owners.v21.html`
- `/contracts.v21.html`
- `/documents.v21.html`
- `/firestore-test.v21.html`
- `/storage-test.v21.html`

## 6. Go / No-Go

GO uniquement si :

- Auth fonctionne
- Firestore lecture/écriture fonctionne
- Storage upload/suppression fonctionne
- Dashboard KPI fonctionne
- aucune erreur console bloquante
- règles Firebase validées
- backup Firestore prévu
- rollback possible

## 7. Après mise en production

- surveiller logs Firebase
- surveiller erreurs console utilisateurs
- surveiller coûts Firebase
- réduire progressivement legacy restant
