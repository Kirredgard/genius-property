# Build Readiness V21

    ## Objectif

    Préparer la V21 pour un build Vite/TypeScript plus fiable.

    ## Corrections

    Les imports explicites `.ts` ont été normalisés en imports `.js`.

    Pourquoi : TypeScript recommande les extensions `.js` dans les imports source ESM, même quand les fichiers sources sont `.ts`.

    ## Fichiers modifiés

    - `js/v21/main.js`
- `js/v21/modules/dashboard/dashboard.module.ts`
- `js/v21/modules/tenants/tenants.module.ts`
- `js/v21/modules/properties/properties.module.ts`
- `js/v21/modules/contracts/contracts.module.ts`
- `js/v21/modules/notifications/notifications.module.ts`
- `js/v21/modules/notifications/services/notifications.service.ts`
- `js/v21/modules/contracts/services/contracts.service.ts`
- `js/v21/modules/properties/services/properties.service.ts`
- `js/v21/modules/tenants/services/tenants.service.ts`
- `tests/v21/tenants/tenant.validator.test.js`
- `tests/v21/tenants/tenant.firestore.adapter.test.js`
- `tests/v21/properties/property.validator.test.js`
- `tests/v21/properties/property.firestore.adapter.test.js`
- `tests/v21/contracts/contract.validator.test.js`
- `tests/v21/contracts/contract.firestore.adapter.test.js`
- `tests/v21/notifications/business-alerts.rules.test.js`
- `tests/v21/notifications/notification.firestore.adapter.test.js`

    ## Ajouts

    - `scripts/audit-imports.mjs`
    - script `npm run audit:imports`
    - intégration dans `npm run quality`
    - intégration CI

    ## Commandes

    ```bash
    npm install
    npm run audit:imports
    npm run quality
    npm run build
    ```
