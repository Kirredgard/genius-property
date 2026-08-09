# Rollout Firestore Flags V21

## Ajouts

- repository Firestore pour feature flags
- chargement remote des flags
- sauvegarde remote depuis `rollout.v21.html`
- fallback localStorage
- règles Firestore `settings`

## Chemins Firestore

Global :

`settings/featureFlags_<environment>`

Par agence :

`agencies/{agencyId}/settings/featureFlags_<environment>`

## Sécurité

Lecture : utilisateur connecté  
Écriture globale : superAdmin uniquement

## Prochaine étape

Brancher le contexte utilisateur/agence réel pour piloter le rollout par agence.
