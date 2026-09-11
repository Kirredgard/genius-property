# User Profile Firestore V21

## Ajouts

- `js/v21/profile/user-profile.service.ts`
- `js/v21/profile/permissions.ts`
- page `profile.v21.html`
- hydratation contexte après Auth
- permissions UI

## Structure Firestore attendue

```txt
agencies/{agencyId}/members/{userId}
```

Exemple :

```json
{
  "userId": "firebase-auth-uid",
  "email": "admin@example.com",
  "role": "admin",
  "agencyId": "agency-demo",
  "status": "active"
}
```

## Rôles

- viewer : lecture
- agent : écriture métier
- admin : administration agence
- owner : facturation/abonnement
- superAdmin : global

## Page de test

`profile.v21.html`

## Prochaine étape

Brancher les permissions UI sur les boutons/formulaires pour masquer les actions non autorisées.
