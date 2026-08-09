# Onboarding & Invitations V21

## Ajouts

- création agence
- création membre owner initial
- invitations équipe
- acceptation invitation
- pages onboarding/team/invite
- règles Firestore invitations
- tests onboarding

## Pages

- `onboarding.v21.html`
- `team.v21.html`
- `invite.v21.html`

## Firestore

```txt
agencies/{agencyId}
agencies/{agencyId}/members/{userId}
agencies/{agencyId}/invitations/{token}
```

## Prochaine étape

Ajouter emails transactionnels pour envoyer les liens d’invitation automatiquement.
