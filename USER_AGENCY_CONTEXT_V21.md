# User / Agency Context V21

## Ajouts

- `js/v21/context/user-agency-context.ts`
- page `context.v21.html`
- contexte utilisé par rollout Firestore
- tests contexte

## Console

```js
GPV21Context.build()
GPV21Context.persist({ agencyId: 'agency-demo', role: 'admin' })
GPV21Context.setAgencyId('agency-demo')
GPV21Context.setRole('admin')
```

## Page

Ouvrir :

`context.v21.html`

## Objectif

Tester le rollout et les permissions avec un contexte agence/rôle réaliste avant de brancher un vrai profil utilisateur Firestore.
