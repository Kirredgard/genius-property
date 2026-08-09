# Real Firebase Checklist V21

## Configuration

- [ ] créer projet Firebase
- [ ] activer Authentication Email/Password
- [ ] créer Firestore Database
- [ ] créer Storage Bucket
- [ ] remplir `.env.local`
- [ ] déployer `firestore.rules.v21`
- [ ] déployer `storage.rules.v21`
- [ ] déployer `firebase.indexes.v21.json`

## Tests manuels

- [ ] `login.v21.html`
- [ ] `profile.v21.html`
- [ ] `firestore-test.v21.html`
- [ ] `storage-test.v21.html`
- [ ] `onboarding.v21.html`
- [ ] `team.v21.html`

## Validation sécurité

- [ ] viewer ne peut pas écrire
- [ ] agent peut créer/modifier
- [ ] admin peut administrer
- [ ] agence A ne lit pas agence B
- [ ] Storage refuse utilisateur non connecté
