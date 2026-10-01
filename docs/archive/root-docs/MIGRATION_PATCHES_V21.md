# Migration Patches V21

## Objectif

Remplacer progressivement le gros fichier `consolidated-hotfixes.js` par des patches ciblés, testables et importables.

## Fichiers ajoutés

- `js/v21/patches/safe-dom.patch.js`
- `js/v21/patches/safe-storage.patch.js`
- `js/v21/patches/safe-events.patch.js`
- `js/v21/patches/runtime-guards.patch.js`
- `js/v21/patches/index.js`

## Tests ajoutés

- storage
- événements
- runtime guards

## Bénéfice

Au lieu d’un hotfix global de plus de 120 KB, la V21 dispose maintenant de petits modules explicites.

## Prochaine étape

Identifier les fonctions réellement utilisées dans `consolidated-hotfixes.js`, puis les migrer une par une vers `js/v21/patches/`.
