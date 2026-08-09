# TypeScript Phase 2 — Services V21

    ## Objectif

    Convertir les services métier V21 vers TypeScript.

    ## Fichiers convertis / ajoutés

    - `js/v21/modules/tenants/services/tenants.service.ts`
- `js/v21/modules/properties/services/properties.service.ts`
- `js/v21/modules/contracts/services/contracts.service.ts`
- `js/v21/modules/notifications/services/notifications.service.ts`
- `js/v21/types/service-types.ts`

    ## Domaines concernés

    - tenants
    - properties
    - contracts
    - notifications

    ## Pourquoi maintenant

    Les validateurs et adaptateurs sont déjà convertis. Les services sont la couche suivante car ils orchestrent :

    - Firestore
    - legacy bridge
    - normalisation des données
    - synchronisation locale temporaire

    ## Prochaine étape

    Convertir les modules bootstrap `.module.js` vers `.ts`, puis les UI simples.
