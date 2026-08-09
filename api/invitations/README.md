# Invitation API V21

Endpoint :

- `POST /api/invitations/accept`

Authentification :

- Firebase ID token dans `Authorization: Bearer <token>`.
- Le token d'invitation est envoyé dans le JSON `{ "token": "..." }`.

Le serveur résout l'agence depuis l'invitation et crée le membership avec Firebase Admin. Le navigateur ne peut donc plus créer directement son propre document `members/{uid}`.

Variables serveur :

```bash
GOOGLE_APPLICATION_CREDENTIALS=
PORT=8789
```
