# GitHub Pages + Firebase — Genius Property

Cette version corrige le chargement Firebase sur GitHub Pages.

## 1. Variables GitHub Actions

Dans GitHub : **Settings → Secrets and variables → Actions → Variables**, ajoute ces variables de dépôt :

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optionnelle)

Ce sont les valeurs de la configuration **Web App** de ton projet Firebase. La clé Web Firebase n'est pas un secret serveur ; la sécurité doit être assurée par les règles Firebase et les domaines autorisés.

## 2. GitHub Pages

Dans **Settings → Pages** :

- Source : **GitHub Actions**
- Branche : `main`

Le workflow `.github/workflows/pages.yml` construit `dist/` puis le publie automatiquement.

Le chemin de base est calculé automatiquement à partir du nom du dépôt. Tu peux le remplacer avec la variable de dépôt `VITE_BASE_PATH` si nécessaire.

## 3. Firebase Authentication

Dans Firebase Console : **Authentication → Settings → Authorized domains**.

Ajoute le domaine GitHub Pages de l'application, par exemple :

`TON-UTILISATEUR.github.io`

Si le dépôt est servi sous un chemin (`TON-UTILISATEUR.github.io/genius-property/`), le domaine à autoriser reste `TON-UTILISATEUR.github.io`.

## 4. Ce qui a été corrigé

- `env.js` n'utilise plus la configuration Supabase.
- Le workflow génère la configuration Firebase au moment du déploiement.
- Les anciens scripts `supabase-adapter.js` / `supabase-auth.js` inexistants ont été remplacés par les modules Firebase présents.
- Les références vers des fichiers JavaScript absents ont été supprimées.
- Le handler de connexion de `form-stability-fixes.js` n'appelle plus Supabase.
- Le `base` Vite est compatible avec un dépôt GitHub Pages.
- Le workflow OVH existant a été conservé dans `.github/workflows/deploy-ovh.yml`.

## 5. Vérification

Après le premier déploiement :

1. Ouvre l'URL GitHub Pages.
2. Ouvre DevTools → Console.
3. Vérifie qu'il n'y a plus de message `Firebase Auth est en cours de chargement` immédiatement après le chargement.
4. Vérifie que `window._firebaseAuth` existe.
5. Teste avec un utilisateur Firebase existant.

La configuration Firebase doit être générée par GitHub Actions avant le build ; ne remplace pas manuellement `env.js` par une configuration Supabase.
