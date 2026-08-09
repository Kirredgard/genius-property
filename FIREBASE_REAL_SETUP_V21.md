# Firebase réel V21

## 1. Créer `.env.local`

À la racine du projet :

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 2. Lancer avec Vite

```bash
npm install
npm run dev
```

## 3. Tester la connexion

Ouvrir :

`http://localhost:5173/login.v21.html`

## 4. Tester le dashboard

Après connexion :

`http://localhost:5173/dashboard.v21.html`

## 5. Vérifier Firebase Console

- Authentication : utilisateur connecté
- Firestore : documents créés par formulaires
- Storage : documents uploadés

## Important

Ne pas utiliser Live Server pour les pages V21 TypeScript.
