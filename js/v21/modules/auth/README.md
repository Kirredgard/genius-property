# Auth Firebase V21

Ce domaine reconnecte Firebase Auth proprement dans la migration V21.

## Ce qui est corrigé

- `env.js` est chargé avant les scripts Firebase.
- `inline-script-02.module.js` initialise Firebase Auth + Firestore.
- Les variables attendues par le legacy sont exposées :
  - `window._firebaseAuth`
  - `window._firebaseDB`
  - `window._fbSignIn`
  - `window._fbSignOut`
  - `window._fbOnAuthStateChanged`
- L'événement `firebase:ready` est déclenché.
- `GPV21AuthStatus()` permet de diagnostiquer l'état Firebase dans la console.

## Test console

```js
GPV21AuthStatus()
```

Le résultat attendu :

```js
{ ready: true, app: true, db: true, config: true, error: null }
```
