# TypeScript Phase 3 — Modules V21

    ## Objectif

    Convertir les fichiers bootstrap `.module.js` vers `.module.ts`.

    ## Fichiers convertis / ajoutés

    - `js/v21/modules/dashboard/dashboard.module.ts`
- `js/v21/modules/payments/payments.module.ts`
- `js/v21/modules/auth/auth.module.ts`
- `js/v21/modules/tenants/tenants.module.ts`
- `js/v21/modules/properties/properties.module.ts`
- `js/v21/modules/contracts/contracts.module.ts`
- `js/v21/modules/notifications/notifications.module.ts`
- `js/v21/types/module-types.ts`

    ## Impact

    Les modules V21 deviennent progressivement typables :

    - initialisation
    - état local
    - façade legacy temporaire
    - orchestration services/UI

    ## Prochaine étape

    Convertir les UI simples vers TypeScript, puis commencer à activer plus de règles strictes.
