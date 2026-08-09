# Migration Notifications V21

## Statut

Domaine `notifications` créé dans `js/v21/modules/notifications/`.

## Ajouts

- module bootstrap
- service notifications
- règles d’alertes métier
- adaptateur Firestore/legacy
- UI liste notifications
- tests Vitest
- façade temporaire `window.GPV21Notifications`

## Alertes couvertes

- loyers bientôt dus
- contrats bientôt expirés
- paiements en retard

## Prochaine étape recommandée

Lancer le nettoyage legacy réel :

1. créer `legacy-map.json`
2. mapper les fonctions legacy par domaine
3. retirer les scripts remplacés par V21
4. réduire progressivement `app.legacy.bundle.js`
5. limiter les exports `window.*`
