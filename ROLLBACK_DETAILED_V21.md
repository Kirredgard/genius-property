# Rollback Detailed V21

## Déclencheurs rollback immédiat

- Login impossible
- Firestore inaccessible
- Erreur critique dashboard
- Perte accès données agence
- Règles Firebase bloquent les admins
- Stripe webhook écrit mauvais statut
- Storage upload impossible pour tous

## Procédure rapide

1. Arrêter rollout V21 via feature flags.
2. Rediriger utilisateurs vers legacy.
3. Restaurer ancienne release hosting.
4. Restaurer anciennes règles Firestore/Storage.
5. Vérifier login legacy.
6. Vérifier données agence.
7. Communiquer incident aux beta testers.
8. Créer incident dans `incidents.v21.html`.

## Procédure longue

1. Export Firestore avant correction.
2. Comparer audit logs.
3. Identifier commit/fichier fautif.
4. Corriger en staging.
5. Relancer `npm run release:beta-ready`.
6. Relancer smoke tests.
7. Reprendre rollout par une seule agence.

## Communication

Message court :

```txt
Nous avons détecté une anomalie sur la beta V21.
L'accès est temporairement revenu à la version stable.
Aucune action n'est requise de votre côté.
```
