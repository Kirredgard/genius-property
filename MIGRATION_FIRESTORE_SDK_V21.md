# Firestore SDK V21

## Ajouts

- `js/v21/firebase/firebase-client.ts`
- `js/v21/firebase/index.ts`
- repository Firestore avec `getDocs`, `addDoc`, `updateDoc`
- dépendance `firebase`
- `.env.example`
- tests Firebase env

## Configuration

Créer un fichier `.env.local` :

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Prochaine étape

Brancher Auth V21 sur `firebase-client.ts`, puis connecter Storage documents.
