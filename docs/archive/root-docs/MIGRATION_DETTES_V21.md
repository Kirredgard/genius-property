# Correction des dettes V21

## Statut des points traités

| Dette | Action appliquée | Statut |
|---|---|---|
| API key visible JS inline | Configuration Firebase déplacée vers `public/env.js` ou variables `VITE_*` | Corrigé côté dépôt |
| 584/596 KB legacy non supprimé | Quarantaine + audit + migration dashboard isolée | En cours, suppression progressive requise |
| 69/70 scripts dans index.html | Création d'un `index.v21.html` minimal compatible Vite | Corrigé pour la cible V21 |
| consolidated-hotfixes 122 KB | Conservé mais isolé comme dette legacy à retirer après migration domaine par domaine | En cours |
| Aucun test automatisé | Ajout Vitest + tests initiaux | Corrigé |
| js/v21/modules vide | Dashboard déplacé dans `app/js/v21/modules/dashboard` | Corrigé |
| tests/ vide | Ajout de tests unitaires initiaux | Corrigé |
| Globals window.* partout | Ajout d'un registre contrôlé + audit `npm run audit:legacy` | En cours |

## Lancer le projet V21

```bash
cd app
cp public/env.example.js public/env.js
# remplir public/env.js
npm install
npm run dev
```

## Lancer les tests

```bash
cd app
npm install
npm test
```

## Audit legacy

```bash
cd app
npm run audit:legacy
```

## Note importante

Le fichier `app.legacy.bundle.js` et `consolidated-hotfixes.js` ne sont pas supprimés brutalement pour éviter de casser la production. La bonne méthode est de migrer les domaines un par un vers `js/v21/modules/*`, puis de retirer les fonctions correspondantes du legacy.
