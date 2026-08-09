# Billing & Subscriptions V21

## Ajouts

- plans SaaS
- limites par plan
- abonnement agence Firestore
- page `billing.v21.html`
- vérification usage
- tests billing

## Plans

- free
- starter
- pro
- business
- enterprise

## Chemin Firestore

```txt
agencies/{agencyId}/settings/subscription
```

## Prochaine étape

Brancher les limites dans les formulaires/services pour bloquer la création si le quota est atteint.
