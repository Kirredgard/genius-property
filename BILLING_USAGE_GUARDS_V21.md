# Billing Usage Guards V21

## Ajouts

- guard quotas d’usage
- blocage création biens/locataires/propriétaires si quota atteint
- widget plan actuel sur dashboard
- tests guards/widget

## Domaines protégés

- properties
- tenants
- owners

## Principe

Si le plan agence ne permet plus d’ajouter une entité, les fonctions `save*` retournent :

```js
{ ok: false, errors: [...] }
```

## Prochaine étape

Ajouter une page upgrade/checkout et brancher un prestataire de paiement.
