# Demo Data V21

## Objectif

Permettre de tester visuellement les pages V21 avant le branchement complet Firestore.

## Activation

Dans l’URL :

`dashboard.v21.html?demo=1`

Ou en console :

```js
GPV21Demo.enable()
location.reload()
```

Désactivation :

```js
GPV21Demo.disable()
location.reload()
```

## Données incluses

- propriétaires
- biens
- locataires
- contrats
- paiements
- dépenses
- reversements
- documents

## Prochaine étape

Tester les pages avec `?demo=1`, puis corriger les erreurs runtime affichées dans la console.
