# Rollout Flags V21

## Ajouts

- `js/v21/rollout/feature-flags.ts`
- `js/v21/rollout/rollout-router.ts`
- `rollout.v21.html`
- tests feature flags / router

## Objectif

Activer V21 progressivement :

- par domaine
- par rôle
- par environnement
- par agence plus tard

## Console

```js
GPV21Flags.list()
GPV21Flags.set('v21OwnerPayouts', true)
GPV21Flags.reset()
GPV21Rollout.resolve('dashboard')
```

## Page

Ouvrir :

`rollout.v21.html`

## Prochaine étape

Brancher les flags sur Firestore pour piloter le rollout côté serveur.
