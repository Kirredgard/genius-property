# Optimisation V21

## Scripts ajoutés

```bash
npm run analyze:bundle
npm run performance:check
npm run quality:optimized
```

## Budgets initiaux

- bundle total : 900 KB
- fichier unique : 350 KB
- nombre JS max : 40

## Ajouts techniques

- analyse bundle simple
- budget performance automatisé
- lazy preload des pages V21 au survol des liens

## Checklist optimisation

- [ ] lancer `npm run build:production`
- [ ] lancer `npm run analyze:bundle`
- [ ] inspecter `audit/v21/bundle-analysis-latest.json`
- [ ] lancer `npm run performance:check`
- [ ] supprimer scripts legacy inutiles
- [ ] vérifier Lighthouse
- [ ] réduire CSS mort
- [ ] compresser assets
- [ ] configurer cache headers

## Prochaine étape

Préparer la checklist production finale et les règles Firebase.
