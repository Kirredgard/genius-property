# Genius Property V21 — version finale nettoyée

Cette version conserve l'application fonctionnelle avec l'interface restaurée, Firebase actif et les fichiers nécessaires au lancement/déploiement.

## Conservé
- `index.html` principal
- `js/`, `styles/`, `assets/`
- `js/v21/` et pages `.v21.html`
- `api/`
- `firebase.json`, `.firebaserc`, `firestore.rules`
- `package.json`, `package-lock.json`, scripts utiles
- `env.js` et `public/env.js` avec la configuration Firebase actuelle

## Supprimé du package final
- anciens audits volumineux
- tests/snapshots hors production
- documentation de migration longue
- backups d'index
- hotfixes legacy déjà désactivés
- règles/configs Firebase doublons
- `node_modules`, `dist`, `.firebase`

## Démarrage local
```bash
npm install
npm run dev -- --force
```

Puis ouvrir l'URL locale affichée par Vite et faire `Ctrl + F5`.

## Déploiement
```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

Projet Firebase configuré : `geniusproperty-50bfb`.
