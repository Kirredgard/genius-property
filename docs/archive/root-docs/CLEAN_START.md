# Genius Property — Clean runtime V15

Cette distribution n'utilise qu'un seul `index.html` pour l'application principale.
Les anciennes variantes `index.v21*`, les pages `.v21.html` et les scripts de refactor v4-v14 ont été retirés du runtime.

## Démarrage local

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:5180/**.

Le port 5180 est volontaire pour éviter de reprendre un ancien serveur Vite encore actif sur 5173.

## Test création/modification

- Propriétaires → Nouveau propriétaire → drawer
- Propriétaires → Modifier → même drawer prérempli
- Biens → Nouveau bien → drawer
- Biens → Modifier → même drawer prérempli
- Locations → Nouvelle location → drawer

Le runtime tente aussi de désenregistrer les service workers/caches Genius Property hérités du navigateur.
