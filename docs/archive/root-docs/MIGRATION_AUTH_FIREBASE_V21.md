# Migration Firebase Auth V21

## Objectif

Réparer le message : `Firebase Auth non disponible` pendant les tests de connexion.

## Corrections appliquées

1. Ajout de `env.js` chargé avant Firebase.
2. Ajout de `public/env.js` pour Vite.
3. Chargement de `js/inline/inline-script-02.module.js` dans `index.html`.
4. Initialisation Firebase robuste avec :
   - `initializeApp`
   - `getAuth`
   - `getFirestore`
   - fonctions modulaires exposées pour le legacy.
5. Ajout du domaine : `js/v21/modules/auth/`.
6. Ajout de `GPV21AuthStatus()` pour diagnostiquer rapidement Firebase dans la console.
7. Ajout de tests Vitest pour les messages d'erreur Auth.

## Comment tester

Lancer l'app, ouvrir la console navigateur puis exécuter :

```js
GPV21AuthStatus()
```

Résultat attendu :

```js
{ ready: true, app: true, db: true, config: true, error: null }
```

Ensuite tester la connexion avec un compte Firebase Authentication existant.

## Important sécurité

La clé Firebase côté frontend n'est pas un secret absolu. La vraie sécurité doit être assurée par :

- Firestore Rules strictes
- domaines autorisés dans Firebase Authentication
- App Check si possible
- séparation dev/prod

La config n'est plus codée inline dans `index.html`; elle est centralisée dans `env.js`.
