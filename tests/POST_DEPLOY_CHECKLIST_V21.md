# Post Deploy Checklist V21

À faire immédiatement après mise en ligne.

## Santé générale

- [ ] ouvrir `/health.v21.html`
- [ ] vérifier `GPV21Health.build()`
- [ ] vérifier `GPV21Errors.list()`
- [ ] vérifier absence d’erreurs console bloquantes

## Auth

- [ ] ouvrir `/login.v21.html`
- [ ] login utilisateur admin
- [ ] logout
- [ ] session persistante

## Firestore

- [ ] ouvrir `/firestore-test.v21.html`
- [ ] lire collection owners
- [ ] créer un propriétaire test
- [ ] vérifier Firebase Console
- [ ] supprimer/archiver test si nécessaire

## Storage

- [ ] ouvrir `/storage-test.v21.html`
- [ ] uploader fichier test
- [ ] vérifier Firebase Storage
- [ ] supprimer fichier test

## Pages métier

- [ ] dashboard
- [ ] biens
- [ ] locataires
- [ ] propriétaires
- [ ] contrats
- [ ] documents

## Décision

- [ ] GO confirmé
- [ ] rollback nécessaire
- [ ] correctif mineur nécessaire
