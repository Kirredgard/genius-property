# Migration façades V21 vers Legacy Registry

    ## Objectif

    Réduire les écritures directes `window.*` dans les nouveaux modules V21.

    ## Modules traités

    - `modules/tenants/tenants.module.js`
- `modules/properties/properties.module.js`
- `modules/contracts/contracts.module.js`
- `modules/notifications/notifications.module.js`
- `modules/dashboard/dashboard.module.js`

    ## Principe

    Avant :

    ```js
    window.GPV21Tenants = { ... }
    ```

    Maintenant :

    ```js
    registerLegacyGlobal('GPV21Tenants', { ... })
    ```

    ## Bénéfice

    - centralisation des globals temporaires
    - suppression future plus simple
    - meilleure testabilité
    - moins de pollution globale incontrôlée

    ## Prochaine étape

    Créer `index.v21-auth.html` ou intégrer les conteneurs V21 réels pour tester chaque module sans dépendre de l’ancien `index.html`.
