# Final Handover — Genius Property V21

## Statut

Version : `21.0.0-rc-production`

Cette archive représente une base V21 production candidate avec :

- architecture modulaire
- pages V21 isolées du legacy
- Firebase Auth / Firestore / Storage préparés
- tests Vitest
- TypeScript progressif
- CI/CD
- monitoring runtime
- rollback plan
- checklist production

## Pages V21 disponibles

- `contract-detail.v21.html`
- `contracts.v21.html`
- `dashboard.v21.html`
- `documents.v21.html`
- `firestore-test.v21.html`
- `health.v21.html`
- `index.v21.html`
- `login.v21.html`
- `owner-detail.v21.html`
- `owners.v21.html`
- `propertie-detail.v21.html`
- `properties.v21.html`
- `storage-test.v21.html`
- `tenant-detail.v21.html`
- `tenants.v21.html`

## Commandes principales

```bash
npm install
npm run dev
npm run healthcheck:v21
npm run audit:imports
npm run typecheck
npm run test
npm run build
npm run production:ready
```

## Tests fonctionnels recommandés

1. `login.v21.html`
2. `dashboard.v21.html?demo=1`
3. `firestore-test.v21.html`
4. `storage-test.v21.html`
5. `health.v21.html`
6. pages métiers V21

## Déploiement

Lire dans cet ordre :

1. `QUICK_START_V21.md`
2. `FIREBASE_REAL_SETUP_V21.md`
3. `PRODUCTION_GUIDE_V21.md`
4. `DEPLOYMENT_CHECKLIST_V21.md`
5. `ROLLBACK_PLAN_V21.md`
6. `POST_DEPLOY_CHECKLIST_V21.md`

## Points importants

- Ne pas utiliser Live Server pour les pages TypeScript.
- Utiliser `npm run dev`.
- La page production candidate est `index.v21-production.html`.
- Le legacy reste présent mais n’est plus chargé par défaut dans la V21 production candidate.
- Les règles Firebase fournies doivent être validées en staging avant production.

## Prochaine décision

Après validation locale et Firebase réel :

- soit corriger les erreurs restantes,
- soit lancer staging,
- soit poursuivre la suppression physique du legacy.


## Rollout progressif

- `rollout.v21.html`
- `ROLLOUT_FLAGS_V21.md`
