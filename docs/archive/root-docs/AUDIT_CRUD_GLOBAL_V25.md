# Audit CRUD global V25

## Cause principale identifiée
Le projet V21/V24 contient plusieurs couches historiques qui peuvent appeler `GPDB.save()` avec des snapshots capturés avant une modification plus récente. Avec Supabase, ces sauvegardes complètes du document `gp_app_data/main` peuvent réécrire toute la base et ressusciter une ancienne fiche quelques instants plus tard.

## Correction
V25 introduit une révision monotone `db.meta.localRevision`.
- Chaque `GPDB.load()` expose la révision courante.
- `GPDB.save()` rejette un snapshot dont la révision est plus ancienne que celle déjà stockée.
- Chaque sauvegarde acceptée incrémente la révision.
- `GPSupabase.push()` refuse aussi les snapshots obsolètes.
- Le cache cloud n'est jamais rétrogradé par une sauvegarde ancienne.
- Les rendus des pages sont rafraîchis après un save accepté.

## Collections couvertes
proprietaires, employes, biens, locataires, locatives, contrats, paiements, depenses, agenda, messages.

## Diagnostic navigateur
`GPDataConsistency.snapshot()`
`GPDataConsistency.audit()`

## Important
Cette version corrige la cohérence de stockage globale. Les règles métier spécifiques de chaque formulaire (validation, champs obligatoires, liens bien/locataire/location) restent celles de V24.
