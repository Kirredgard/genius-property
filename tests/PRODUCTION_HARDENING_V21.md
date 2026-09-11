# Production Hardening V21

## Ajouts

- monitoring erreurs runtime
- capture `window.error`
- capture `unhandledrejection`
- rapport santé runtime
- page `health.v21.html`
- tests monitoring

## Utilisation

Après déploiement, ouvrir :

`health.v21.html`

La console expose aussi :

```js
GPV21Errors.list()
GPV21Health.build()
```

## Objectif

Diagnostiquer rapidement :

- modules V21 chargés
- Firebase disponible
- Auth disponible
- erreurs runtime
- statut navigateur
