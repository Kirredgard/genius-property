# Correction déploiement Firebase Hosting — erreurs 404 sur /js/*

Le projet déploie maintenant le dossier `dist/` via Firebase Hosting.
Après `vite build`, certains scripts legacy référencés directement par `index.html` doivent rester accessibles avec leurs chemins originaux (`js/core/...`, `js/pages/...`, etc.).

Correction ajoutée :

- `scripts/copy-runtime-assets.mjs`
- script npm `postbuild`
- script npm `deploy:hosting`
- fallback de fermeture du splash loader dans `index.html`

Commandes :

```bash
npm install
npm run build
firebase deploy --only hosting
```

Ou directement :

```bash
npm run deploy:hosting
```

Après déploiement, faire `Ctrl + F5` dans le navigateur.
