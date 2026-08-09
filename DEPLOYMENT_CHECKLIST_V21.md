# Deployment Checklist V21

## Avant staging

- [ ] `npm run predeploy:staging` OK
- [ ] `.env.staging` configuré
- [ ] Auth staging testé
- [ ] Firestore staging testé
- [ ] Storage staging testé
- [ ] Pages V21 testées

## Avant production

- [ ] `npm run predeploy:production` OK
- [ ] secrets GitHub production ajoutés
- [ ] Firebase Rules production validées
- [ ] backup Firestore activé
- [ ] domaine HTTPS actif
- [ ] compte admin sécurisé
- [ ] monitoring erreurs prêt
- [ ] rollback documenté

## Go / No-Go

Go uniquement si :

- build production OK
- tests OK
- login OK
- CRUD Firestore OK
- upload Storage OK
- aucune erreur console bloquante
- legacy non obligatoire


## Firebase Rules V21

- [ ] `firestore.rules.v21` relu
- [ ] `storage.rules.v21` relu
- [ ] règles testées en staging
- [ ] règles déployées en production
- [ ] accès multi-agence validé
- [ ] rôles validés

## Production final

- [ ] `npm run production:ready` OK
- [ ] `npm run build:production` OK
- [ ] rollback prêt
- [ ] monitoring prêt
