# Migration V21 Clean Loader

## Fichiers ajoutés

- `index.v21-clean.html`
- `js/v21/bootstrap.js`
- `js/v21/legacy/legacy-loader.js`
- `audit/v21/script-loader-manifest.json`
- `tests/v21/legacy/legacy-loader.test.js`

## Objectif

Séparer le chargement V21 moderne du chargement legacy.

## Utilisation

Version propre :

`index.v21-clean.html`

Version avec compatibilité legacy temporaire :

`index.v21-clean.html?legacy=1`

## Résultat

- le legacy n’est plus chargé par défaut dans la page clean
- les scripts legacy restent disponibles pour compatibilité
- la suppression peut maintenant se faire domaine par domaine

## Scripts legacy cartographiés

Nombre de scripts legacy détectés dans l’ancien index : 65

## Prochaine étape recommandée

Remplacer progressivement les façades `window.GPV21*` par `registerLegacyGlobal`,
puis désactiver définitivement les scripts legacy déjà couverts par les modules V21.
