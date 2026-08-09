# CI/CD V21

## Scripts ajoutés

```bash
npm run build:staging
npm run build:production
npm run predeploy:staging
npm run predeploy:production
```

## Workflows ajoutés

- `.github/workflows/v21-staging.yml`
- `.github/workflows/v21-production.yml`

## Secrets GitHub requis

### Staging

- `STAGING_FIREBASE_API_KEY`
- `STAGING_FIREBASE_AUTH_DOMAIN`
- `STAGING_FIREBASE_PROJECT_ID`
- `STAGING_FIREBASE_STORAGE_BUCKET`
- `STAGING_FIREBASE_MESSAGING_SENDER_ID`
- `STAGING_FIREBASE_APP_ID`

### Production

- `PROD_FIREBASE_API_KEY`
- `PROD_FIREBASE_AUTH_DOMAIN`
- `PROD_FIREBASE_PROJECT_ID`
- `PROD_FIREBASE_STORAGE_BUCKET`
- `PROD_FIREBASE_MESSAGING_SENDER_ID`
- `PROD_FIREBASE_APP_ID`

## Gate qualité

Avant build :

```bash
npm run quality:prod-candidate
```

Cela vérifie :

- healthcheck V21
- imports
- typecheck
- tests
- audit legacy
- audit legacy strict
- build
