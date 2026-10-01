# Corrections build / quality

Corrections appliquées après audit :

- `vite.config.js` ne référence plus `index.v21-clean.html` ni `index.v21-production.html`, absents du projet.
- L'entrée principale Vite est maintenant `index.html`.
- `firestore-validation.v21.html` a été ajouté aux entrées de build.
- Le dossier `tests/` a été restauré avec un setup Vitest minimal et un smoke test, afin que `npm run test`, `npm run quality` et `npm run quality:prod-candidate` ne bloquent pas immédiatement sur un dossier absent.

Commandes à lancer après extraction :

```bash
npm install
npm run build
npm run test
npm run quality
```
