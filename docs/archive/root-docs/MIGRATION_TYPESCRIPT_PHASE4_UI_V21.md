# TypeScript Phase 4 — UI V21

    ## Objectif

    Convertir les rendus UI simples vers TypeScript.

    ## Fichiers convertis / ajoutés

    - `js/v21/modules/dashboard/ui/dashboard.layout.ts`
- `js/v21/modules/payments/ui/payments.layout.ts`
- `js/v21/modules/tenants/ui/tenants.list.ts`
- `js/v21/modules/properties/ui/properties.list.ts`
- `js/v21/modules/contracts/ui/contracts.list.ts`
- `js/v21/modules/notifications/ui/notifications.list.ts`
- `js/v21/modules/dashboard/widgets.ts`
- `js/v21/types/ui-types.ts`

    ## Impact

    Les couches V21 suivantes sont maintenant largement typées :

    - validators
    - adapters
    - services
    - modules bootstrap
    - UI simple

    ## Prochaine étape recommandée

    Lancer une passe de correction d’imports/build puis préparer `strict` par domaine.
