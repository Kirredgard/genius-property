# Firebase Rules V21

## Fichiers

- `firestore.rules.v21`
- `storage.rules.v21`

## Modèle de sécurité

Firestore est structuré autour de :

```txt
agencies/{agencyId}/{collections}
```

Rôles prévus :

- owner
- admin
- agent
- viewer
- superAdmin

## Important

Les règles fournies sont une base de production candidate. Elles doivent être adaptées à ton modèle exact de licences, agences et rôles avant déploiement final.

## Collections couvertes

- owners
- properties
- tenants
- contracts
- payments
- expenses
- documents
- ownerPayouts
- notifications
- members
