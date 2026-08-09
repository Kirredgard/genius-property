# Qualité & CI V21

## Ajouts

- `package.json` scripts qualité
- `vite.config.js`
- `scripts/audit-legacy.mjs`
- `.github/workflows/v21-quality.yml`
- `.editorconfig`
- `.gitignore`

## Commandes

```bash
npm install
npm run test
npm run audit:legacy
npm run quality
npm run build
```

## Objectif

Chaque prochaine migration doit être validée par :

1. tests Vitest
2. audit legacy
3. build Vite
4. réduction progressive des globals `window.*`

## Prochaine étape recommandée

Ajouter TypeScript progressivement avec `checkJs`, puis convertir les modules V21 domaine par domaine.
