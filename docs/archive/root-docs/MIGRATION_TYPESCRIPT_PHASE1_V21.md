# TypeScript Phase 1 V21

    ## Objectif

    Convertir les fichiers les plus sûrs vers TypeScript :

    - validators
    - adapters
    - règles métier pures

    ## Fichiers convertis

    - `js/v21/modules/tenants/validators/tenant.validator.ts`
- `js/v21/modules/tenants/adapters/tenant.firestore.adapter.ts`
- `js/v21/modules/properties/validators/property.validator.ts`
- `js/v21/modules/properties/adapters/property.firestore.adapter.ts`
- `js/v21/modules/contracts/validators/contract.validator.ts`
- `js/v21/modules/contracts/adapters/contract.firestore.adapter.ts`
- `js/v21/modules/notifications/adapters/notification.firestore.adapter.ts`
- `js/v21/modules/notifications/rules/business-alerts.rules.ts`
- `js/v21/types/domain-types.ts`

    ## Pourquoi ces fichiers d’abord

    Ils sont adaptés à TypeScript parce qu’ils :

    - ont peu de dépendances DOM
    - contiennent de la logique métier pure
    - sont déjà couverts par tests
    - réduisent les bugs silencieux sur les données

    ## À faire ensuite

    1. convertir les services en TypeScript
    2. typer Firebase progressivement
    3. typer les modules bootstrap
    4. activer `strict: true` domaine par domaine
