# Test Firestore réel V21

## Page ajoutée

`firestore-test.v21.html`

## Utilisation

1. Configurer `.env.local`
2. Lancer :

```bash
npm run dev
```

3. Ouvrir :

`http://localhost:5173/firestore-test.v21.html`

## Ce que la page teste

- initialisation Firebase
- lecture collection `owners`
- création document dans `owners`
- affichage JSON des documents

## Si erreur permission denied

Vérifier Firestore Rules.

## Si configuration incomplète

Vérifier `.env.local`.
